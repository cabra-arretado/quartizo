"""Acceptance and refusal cases for the proxy HMAC and the signed principal."""
from __future__ import annotations

import time
import unittest

from tests.backend.signing import encode_claim, load_server, principal_header, proxy_header

srv = load_server()
SECRET = "s3cret-for-tests"

# Known-answer vectors produced by the UPSTREAM implementation
# (kirodotdev/KiroCrew@f62ab4fd src/kiro_crew/apps/proxy_auth.py), not by our signer.
KAV_SECRET = "kav-secret"
KAV_TS = 1791589507
KAV_METHOD = "POST"
KAV_TARGET = "/api/status?x=a%20b"
KAV_BODY = b'{"a":1}'
KAV_PROXY = "1791589507:904243ba28a916e7bcb8d6b0a3293509b6c16f0fb6f460c4606b5825bf256aef"
KAV_PRINCIPAL = (
    "eyJpc3N1ZWRBdCI6MTc5MTU4OTUwNywia2luZCI6Im93bmVyLXNlc3Npb24iLCJvd25lcklkIjoib3duZXItMSIs"
    "InJlcXVlc3RJZCI6IjAxMjM0NTY3ODlhYmNkZWYwMTIzNDU2Nzg5YWJjZGVmIiwidmVyc2lvbiI6MX0"
    ".2e9c96119be84235f4c3b82a7fb584c74a804780b1f0b8ff5484bab7eb4c2301"
)


def verify(header, *, method="GET", target="/api/status", body=b"", secret=SECRET, now=None):
    return srv.verify_proxy_signature(
        header, method=method, target=target, body=body, secret=secret,
        now=time.time() if now is None else now,
    )


class ProxySignatureTests(unittest.TestCase):
    def test_upstream_known_answer_vector(self):
        self.assertTrue(verify(KAV_PROXY, method=KAV_METHOD, target=KAV_TARGET, body=KAV_BODY,
                               secret=KAV_SECRET, now=KAV_TS))

    def test_valid_signature_accepted(self):
        self.assertTrue(verify(proxy_header(SECRET, "GET", "/api/status")))

    def test_valid_with_query_and_body(self):
        body = b'{"x": 1}'
        h = proxy_header(SECRET, "POST", "/api/status?q=a%20b", body)
        self.assertTrue(verify(h, method="POST", target="/api/status?q=a%20b", body=body))

    def test_skew_boundary_accepted(self):
        now = 1_800_000_000
        for ts in (now - 60, now + 60):
            self.assertTrue(verify(proxy_header(SECRET, "GET", "/api/status", ts=ts), now=now))

    def test_missing_header(self):
        self.assertFalse(verify(None))
        self.assertFalse(verify(""))

    def test_malformed_headers(self):
        good = proxy_header(SECRET, "GET", "/api/status")
        ts, sig = good.split(":")
        for bad in (
            sig,                      # no timestamp
            f"{ts}:",                 # no signature
            f":{sig}",                # empty timestamp
            f"{ts}x:{sig}",           # non-numeric timestamp
            f"-{ts}:{sig}",           # signed timestamp
            f"{ts}.5:{sig}",          # fractional
            f"١٢:{sig}",    # non-ASCII digits
            f"{ts}:{sig.upper()}",    # hex must be lowercase as emitted
            f"{ts}:{sig[:-1]}",       # short
            f"{ts}:{sig}00",          # long
            f"{ts}:{sig[:-1]}é", # non-ASCII signature char
            f"{ts}:{sig}:extra",
        ):
            with self.subTest(bad=bad):
                self.assertFalse(verify(bad))

    def test_expired(self):
        now = time.time()
        self.assertFalse(verify(proxy_header(SECRET, "GET", "/api/status", ts=int(now) - 61), now=now))

    def test_future(self):
        now = time.time()
        self.assertFalse(verify(proxy_header(SECRET, "GET", "/api/status", ts=int(now) + 61), now=now))

    def test_wrong_secret(self):
        self.assertFalse(verify(proxy_header("other-secret", "GET", "/api/status")))

    def test_tampered_body(self):
        h = proxy_header(SECRET, "POST", "/api/status", b'{"a":1}')
        self.assertFalse(verify(h, method="POST", body=b'{"a":2}'))
        self.assertFalse(verify(h, method="POST", body=b""))

    def test_tampered_path_and_query(self):
        h = proxy_header(SECRET, "GET", "/api/status?a=1")
        self.assertFalse(verify(h, target="/api/other?a=1"))
        self.assertFalse(verify(h, target="/api/status?a=2"))
        self.assertFalse(verify(h, target="/api/status"))
        # Prefix is stripped by the gateway: the backend never sees /apps/<name>.
        self.assertFalse(verify(proxy_header(SECRET, "GET", "/apps/quartizo/api/status")))

    def test_tampered_method(self):
        self.assertFalse(verify(proxy_header(SECRET, "GET", "/api/status"), method="POST"))

    def test_no_secret_fails_closed(self):
        h = proxy_header("", "GET", "/api/status")
        self.assertFalse(verify(h, secret=""))


class PrincipalTests(unittest.TestCase):
    def setUp(self):
        self.cache = srv.ReplayCache()

    def check(self, header, *, method="GET", target="/api/status", body=b"", secret=SECRET, now=None):
        return srv.verify_principal(
            header, method=method, target=target, body=body, secret=secret,
            now=time.time() if now is None else now, replay_cache=self.cache,
        )

    def test_upstream_known_answer_vector(self):
        p = self.check(KAV_PRINCIPAL, method=KAV_METHOD, target=KAV_TARGET, body=KAV_BODY,
                       secret=KAV_SECRET, now=KAV_TS)
        self.assertIsNotNone(p)
        self.assertEqual((p.kind, p.owner_id), ("owner-session", "owner-1"))

    def test_kinds_accepted(self):
        for kind, owner in (("owner-session", "u1"), ("app-token", ""), ("agent-tool", ""), ("none", "")):
            with self.subTest(kind=kind):
                p = self.check(principal_header(SECRET, "GET", "/api/status", kind=kind, owner_id=owner))
                self.assertEqual(p.kind, kind)

    def test_missing(self):
        self.assertIsNone(self.check(None))
        self.assertIsNone(self.check(""))

    def test_replay_refused(self):
        h = principal_header(SECRET, "GET", "/api/status")
        self.assertIsNotNone(self.check(h))
        self.assertIsNone(self.check(h))

    def test_skew(self):
        now = int(time.time())
        self.assertIsNone(self.check(principal_header(SECRET, "GET", "/api/status", issued_at=now - 61), now=now))
        self.assertIsNone(self.check(principal_header(SECRET, "GET", "/api/status", issued_at=now + 61), now=now))

    def test_bound_to_request(self):
        h = principal_header(SECRET, "POST", "/api/status", b"a")
        self.assertIsNone(self.check(h, method="POST", target="/api/status", body=b"b"))
        self.assertIsNone(self.check(h, method="POST", target="/api/x", body=b"a"))
        self.assertIsNone(self.check(h, method="GET", target="/api/status", body=b"a"))
        self.assertIsNone(self.check(principal_header("wrong", "GET", "/api/status")))

    def test_bad_shapes(self):
        base = {"version": 1, "kind": "app-token", "ownerId": "", "issuedAt": int(time.time()),
                "requestId": "0" * 32}
        for change in (
            {"version": 2}, {"kind": "admin"}, {"kind": ["app-token"]},
            {"kind": "owner-session", "ownerId": ""},  # owner-session must name an owner
            {"ownerId": "x"},                           # only owner-session names one
            {"issuedAt": True}, {"issuedAt": "1"}, {"requestId": "A" * 32}, {"requestId": "0" * 31},
            {"extra": 1},
        ):
            with self.subTest(change=change):
                self.assertIsNone(self.check(principal_header(SECRET, "GET", "/api/status",
                                                              claim={**base, **change})))
        claim = dict(base)
        del claim["requestId"]
        enc = encode_claim(claim)
        self.assertIsNone(self.check(f"{enc}.{'0' * 64}"))
        self.assertIsNone(self.check("not-base64!." + "0" * 64))
        self.assertIsNone(self.check("x" * 5000 + "." + "0" * 64))

    def test_no_secret_fails_closed(self):
        self.assertIsNone(self.check(principal_header("", "GET", "/api/status"), secret=""))

    def test_full_cache_refuses(self):
        self.cache = srv.ReplayCache(max_entries=1)
        self.assertIsNotNone(self.check(principal_header(SECRET, "GET", "/api/status")))
        self.assertIsNone(self.check(principal_header(SECRET, "GET", "/api/status")))


if __name__ == "__main__":
    unittest.main()
