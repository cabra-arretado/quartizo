import { jsxs as p, Fragment as b, jsx as a } from "react/jsx-runtime";
import { useAppApi as C, ChatEmbed as I } from "@kirocrew/app-sdk";
import { PageHeader as T, Card as B, CardTitle as F, Btn as P } from "@kirocrew/app-sdk/ui";
import { useState as S, useRef as Q, useEffect as E, useCallback as q, useMemo as O } from "react";
const j = "/apps/quartizo/api", N = "/api/chat/slots", M = "/api/chat?ws=1", _ = "quartizo:slot", y = {
  slot_not_found: "This chat no longer exists or cannot be reached by Quartizo. Start a new chat to continue.",
  session_approval_not_granted: "Quartizo is not allowed to approve or reject tool requests (permissions.sessionApproval is not granted). Decide pending tools from the main chat instead.",
  permission_denied: "Quartizo has not declared access to this API in app.json.",
  unknown: "Request failed."
};
function R(t) {
  if (!(typeof t != "string" || !t))
    try {
      const e = JSON.parse(t);
      if (e && typeof e == "object" && "code" in e) {
        const n = e.code;
        return typeof n == "string" ? n : void 0;
      }
    } catch {
    }
}
function g(t, e = {}) {
  const n = t, r = typeof (n == null ? void 0 : n.message) == "string" ? n.message : String(t);
  if ((n == null ? void 0 : n.name) === "AppApiPermissionError")
    return { kind: "permission_denied", message: y.permission_denied };
  const o = typeof (n == null ? void 0 : n.status) == "number" ? n.status : void 0, i = R(n == null ? void 0 : n.body);
  return i === "slot_not_found" || e.missingIsSlotNotFound && o === 404 ? { kind: "slot_not_found", status: o, message: y.slot_not_found } : i === "session_approval_not_granted" ? { kind: "session_approval_not_granted", status: o, message: y.session_approval_not_granted } : { kind: "unknown", status: o, message: `${y.unknown} ${r}` };
}
const D = /^quartizo-[0-9a-z]+-[0-9a-z]{6}$/;
function z(t) {
  return typeof t == "string" && D.test(t);
}
function G(t = Date.now(), e = Math.random) {
  return `quartizo-${t.toString(36)}-${Math.floor(e() * 36 ** 6).toString(36).padStart(6, "0")}`;
}
async function H(t, e, n) {
  if (!z(e)) throw new Error(`refusing to open a slot not named by Quartizo: ${JSON.stringify(e)}`);
  const r = await t.post(N, { name: e });
  if (!r || typeof r.key != "string" || !r.key)
    throw new Error("POST /api/chat/slots returned no slot key");
  return r.key;
}
function K(t, e, n = {}) {
  const r = `${N}/${encodeURIComponent(e)}?limit=1`;
  return async (o, i) => {
    var f, l;
    try {
      await t.get(r);
    } catch (c) {
      const m = g(c, { missingIsSlotNotFound: !0 });
      throw (f = n.onError) == null || f.call(n, m), c;
    }
    try {
      return await t.post(M, {
        message: o,
        slot: e,
        agent: n.agent ?? "",
        ...i ? { meta: i } : {}
      });
    } catch (c) {
      throw (l = n.onError) == null || l.call(n, g(c)), c;
    }
  };
}
function J(t) {
  try {
    const e = (t == null ? void 0 : t.getItem(_)) ?? null;
    return e === null || z(e) ? e : (t == null || t.removeItem(_), null);
  } catch {
    return null;
  }
}
function x(t, e) {
  try {
    e ? t == null || t.setItem(_, e) : t == null || t.removeItem(_);
  } catch {
  }
}
function w() {
  try {
    return window.localStorage;
  } catch {
    return;
  }
}
function A({ failure: t }) {
  return /* @__PURE__ */ a("div", { role: "alert", className: "text-sm text-danger my-2", "data-kind": t.kind, children: t.message });
}
function W() {
  const t = C(), [e, n] = S({ status: "opening" }), [r, o] = S(null), [i, f] = S("checking…"), [l, c] = S(0), m = Q(null);
  E(() => {
    let s = !1;
    return t.get(`${j}/status`).then((d) => !s && f(`ok (v${d.version}, caller: ${d.principal.kind})`)).catch((d) => !s && f(g(d).message)), () => {
      s = !0;
    };
  }, [t]), E(() => {
    var v;
    let s = !1;
    n({ status: "opening" }), o(null), ((v = m.current) == null ? void 0 : v.generation) !== l && (m.current = { generation: l, name: J(w()) ?? G() });
    const { name: d } = m.current;
    return H(t, d).then((h) => {
      s || (x(w(), h), n({ status: "ready", key: h }));
    }).catch((h) => !s && n({ status: "error", failure: g(h) })), () => {
      s = !0;
    };
  }, [t, l]);
  const $ = q(() => {
    x(w(), null), c((s) => s + 1);
  }, []), u = e.status === "ready" ? e.key : null, k = O(
    () => u ? K(t, u, { onError: o }) : void 0,
    [t, u]
  );
  return /* @__PURE__ */ p(b, { children: [
    /* @__PURE__ */ a(T, { title: "Quartizo", subtitle: "Quartizo-created session" }),
    /* @__PURE__ */ p("div", { className: "px-6 pb-8 flex-1 min-h-0 flex flex-col gap-3", children: [
      /* @__PURE__ */ p(B, { children: [
        /* @__PURE__ */ a(F, { children: "Status" }),
        /* @__PURE__ */ p("p", { className: "text-sm text-muted", children: [
          "Backend: ",
          i
        ] }),
        /* @__PURE__ */ p("p", { className: "text-sm text-muted", children: [
          "Chat: ",
          e.status === "ready" ? e.key : e.status
        ] }),
        e.status === "error" && /* @__PURE__ */ a(A, { failure: e.failure }),
        r && /* @__PURE__ */ a(A, { failure: r }),
        /* @__PURE__ */ a(P, { onClick: $, disabled: e.status === "opening", children: "Start new chat" })
      ] }),
      u && k && /* @__PURE__ */ a("div", { className: "flex-1 min-h-0 flex flex-col", children: /* @__PURE__ */ a(I, { slotKey: u, onSend: k, startAtBottom: !0 }, u) })
    ] })
  ] });
}
export {
  W as default
};
