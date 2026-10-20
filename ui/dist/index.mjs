import { jsx as C, Fragment as kt, jsxs as Q } from "react/jsx-runtime";
import { ChatEmbed as re, useAppApi as se } from "@kirocrew/app-sdk";
import { Card as ie, CardTitle as oe, Btn as Y, PageHeader as le } from "@kirocrew/app-sdk/ui";
import { useState as _, useRef as yt, useEffect as q, useCallback as Bt, useMemo as bA } from "react";
const _t = "/apps/quartizo/api", EA = "/api/chat/slots", ae = "/api/chat?ws=1", bt = "quartizo:slot", mt = {
  slot_not_found: "This chat no longer exists or cannot be reached by Quartizo. Start a new chat to continue.",
  session_approval_not_granted: "Quartizo is not allowed to approve or reject tool requests (permissions.sessionApproval is not granted). Decide pending tools from the main chat instead.",
  permission_denied: "Quartizo has not declared access to this API in app.json.",
  unknown: "Request failed."
};
function ue(t) {
  if (!(typeof t != "string" || !t))
    try {
      const A = JSON.parse(t);
      if (A && typeof A == "object" && "code" in A) {
        const e = A.code;
        return typeof e == "string" ? e : void 0;
      }
    } catch {
    }
}
function Et(t, A = {}) {
  const e = t, n = typeof (e == null ? void 0 : e.message) == "string" ? e.message : String(t);
  if ((e == null ? void 0 : e.name) === "AppApiPermissionError")
    return { kind: "permission_denied", message: mt.permission_denied };
  const r = typeof (e == null ? void 0 : e.status) == "number" ? e.status : void 0, s = ue(e == null ? void 0 : e.body);
  return s === "slot_not_found" || A.missingIsSlotNotFound && r === 404 ? { kind: "slot_not_found", status: r, message: mt.slot_not_found } : s === "session_approval_not_granted" ? { kind: "session_approval_not_granted", status: r, message: mt.session_approval_not_granted } : { kind: "unknown", status: r, message: `${mt.unknown} ${n}` };
}
const ce = /^quartizo-[0-9a-z]+-[0-9a-z]{6}$/;
function wA(t) {
  return typeof t == "string" && ce.test(t);
}
function he(t = Date.now(), A = Math.random) {
  return `quartizo-${t.toString(36)}-${Math.floor(A() * 36 ** 6).toString(36).padStart(6, "0")}`;
}
async function de(t, A, e) {
  if (!wA(A)) throw new Error(`refusing to open a slot not named by Quartizo: ${JSON.stringify(A)}`);
  const n = await t.post(EA, { name: A });
  if (!n || typeof n.key != "string" || !n.key)
    throw new Error("POST /api/chat/slots returned no slot key");
  return n.key;
}
function ge(t, A, e = {}) {
  const n = `${EA}/${encodeURIComponent(A)}?limit=1`;
  return async (r, s) => {
    var o, i;
    try {
      await t.get(n);
    } catch (l) {
      const a = Et(l, { missingIsSlotNotFound: !0 });
      throw (o = e.onError) == null || o.call(e, a), l;
    }
    try {
      return await t.post(ae, {
        message: r,
        slot: A,
        agent: e.agent ?? "",
        ...s ? { meta: s } : {}
      });
    } catch (l) {
      throw (i = e.onError) == null || i.call(e, Et(l)), l;
    }
  };
}
function pe(t) {
  try {
    const A = (t == null ? void 0 : t.getItem(bt)) ?? null;
    return A === null || wA(A) ? A : (t == null || t.removeItem(bt), null);
  } catch {
    return null;
  }
}
function Tt(t, A) {
  try {
    A ? t == null || t.setItem(bt, A) : t == null || t.removeItem(bt);
  } catch {
  }
}
function vt() {
  try {
    return window.localStorage;
  } catch {
    return;
  }
}
function qt({ failure: t }) {
  return /* @__PURE__ */ C("div", { role: "alert", className: "text-sm text-danger my-2", "data-kind": t.kind, children: t.message });
}
function fe({ api: t }) {
  const [A, e] = _({ status: "opening" }), [n, r] = _(null), [s, o] = _("checking…"), [i, l] = _(0), a = yt(null);
  q(() => {
    let d = !1;
    return t.get(`${_t}/status`).then((u) => !d && o(`ok (v${u.version}, caller: ${u.principal.kind})`)).catch((u) => !d && o(Et(u).message)), () => {
      d = !0;
    };
  }, [t]), q(() => {
    var I;
    let d = !1;
    e({ status: "opening" }), r(null), ((I = a.current) == null ? void 0 : I.generation) !== i && (a.current = { generation: i, name: pe(vt()) ?? he() });
    const { name: u } = a.current;
    return de(t, u).then((D) => {
      d || (Tt(vt(), D), e({ status: "ready", key: D }));
    }).catch((D) => !d && e({ status: "error", failure: Et(D) })), () => {
      d = !0;
    };
  }, [t, i]);
  const c = Bt(() => {
    Tt(vt(), null), l((d) => d + 1);
  }, []), h = A.status === "ready" ? A.key : null, g = bA(
    () => h ? ge(t, h, { onError: r }) : void 0,
    [t, h]
  );
  return /* @__PURE__ */ C(kt, { children: /* @__PURE__ */ Q("div", { className: "flex-1 min-h-0 flex flex-col gap-3", children: [
    /* @__PURE__ */ Q(ie, { children: [
      /* @__PURE__ */ C(oe, { children: "Status" }),
      /* @__PURE__ */ Q("p", { className: "text-sm text-muted", children: [
        "Backend: ",
        s
      ] }),
      /* @__PURE__ */ Q("p", { className: "text-sm text-muted", children: [
        "Chat: ",
        A.status === "ready" ? A.key : A.status
      ] }),
      A.status === "error" && /* @__PURE__ */ C(qt, { failure: A.failure }),
      n && /* @__PURE__ */ C(qt, { failure: n }),
      /* @__PURE__ */ C(Y, { onClick: c, disabled: A.status === "opening", children: "Start new chat" })
    ] }),
    h && g && /* @__PURE__ */ C("div", { className: "flex-1 min-h-0 flex flex-col", children: /* @__PURE__ */ C(re, { slotKey: h, onSend: g, startAtBottom: !0 }, h) })
  ] }) });
}
function Ce(t) {
  const A = (t.match(/\r\n/g) ?? []).length, e = (t.match(/\r/g) ?? []).length, n = (t.match(/\n/g) ?? []).length;
  return e !== A ? "mixed" : A === 0 ? "lf" : A === n ? "crlf" : "mixed";
}
function me(t) {
  return t.replace(/\r\n/g, `
`);
}
function De(t, A) {
  const e = t.replace(/\r\n?/g, `
`);
  return A === "crlf" ? e.replace(/\n/g, `\r
`) : e;
}
function Ie(t) {
  return {
    path: t.path,
    disk: t.content,
    hash: t.hash,
    style: Ce(t.content),
    text: me(t.content),
    conflict: null
  };
}
function Ot(t) {
  return t.style !== "mixed";
}
function Fe(t, A) {
  return Ot(t) ? { ...t, text: A } : t;
}
function QA(t) {
  return De(t.text, t.style);
}
function Nt(t) {
  return t.hash === null || Ot(t) && QA(t) !== t.disk;
}
function Be(t, A, e) {
  return { ...t, disk: A, hash: e.hash, conflict: null };
}
function Gt(t, A) {
  return { ...t, conflict: { currentHash: A } };
}
function ke(t) {
  return { ...t, conflict: null };
}
function ye(t) {
  return t.conflict ? { ...t, hash: t.conflict.currentHash, conflict: null } : t;
}
function be(t, A, e) {
  if (e <= 0) return null;
  switch (A) {
    case "ArrowDown":
      return t < 0 ? 0 : Math.min(t + 1, e - 1);
    case "ArrowUp":
      return t < 0 ? e - 1 : Math.max(t - 1, 0);
    case "Home":
      return 0;
    case "End":
      return e - 1;
    case "PageDown":
      return Math.min(Math.max(t, 0) + 10, e - 1);
    case "PageUp":
      return Math.max(t - 10, 0);
    default:
      return null;
  }
}
/*! markdown-it 15.0.2 https://github.com/markdown-it/markdown-it @license MIT */
var $t = Object.defineProperty, xt = (t, A) => {
  let e = {};
  for (var n in t) $t(e, n, {
    get: t[n],
    enumerable: !0
  });
  return $t(e, Symbol.toStringTag, { value: "Module" }), e;
}, tA = {};
function Ee(t) {
  let A = tA[t];
  if (A) return A;
  A = tA[t] = [];
  for (let e = 0; e < 128; e++) {
    let n = String.fromCharCode(e);
    A.push(n);
  }
  for (let e = 0; e < t.length; e++) {
    let n = t.charCodeAt(e);
    A[n] = "%" + ("0" + n.toString(16).toUpperCase()).slice(-2);
  }
  return A;
}
function ot(t, A) {
  typeof A != "string" && (A = ot.defaultChars);
  let e = Ee(A);
  return t.replace(/(%[a-f0-9]{2})+/gi, function(n) {
    let r = "";
    for (let s = 0, o = n.length; s < o; s += 3) {
      let i = parseInt(n.slice(s + 1, s + 3), 16);
      if (i < 128) {
        r += e[i];
        continue;
      }
      if ((i & 224) == 192 && s + 3 < o) {
        let l = parseInt(n.slice(s + 4, s + 6), 16);
        if ((l & 192) == 128) {
          let a = i << 6 & 1984 | l & 63;
          r += a < 128 ? "��" : String.fromCharCode(a), s += 3;
          continue;
        }
      }
      if ((i & 240) == 224 && s + 6 < o) {
        let l = parseInt(n.slice(s + 4, s + 6), 16), a = parseInt(n.slice(s + 7, s + 9), 16);
        if ((l & 192) == 128 && (a & 192) == 128) {
          let c = i << 12 & 61440 | l << 6 & 4032 | a & 63;
          r += c < 2048 || c >= 55296 && c <= 57343 ? "���" : String.fromCharCode(c), s += 6;
          continue;
        }
      }
      if ((i & 248) == 240 && s + 9 < o) {
        let l = parseInt(n.slice(s + 4, s + 6), 16), a = parseInt(n.slice(s + 7, s + 9), 16), c = parseInt(n.slice(s + 10, s + 12), 16);
        if ((l & 192) == 128 && (a & 192) == 128 && (c & 192) == 128) {
          let h = i << 18 & 1835008 | l << 12 & 258048 | a << 6 & 4032 | c & 63;
          h < 65536 || h > 1114111 ? r += "����" : (h -= 65536, r += String.fromCharCode(55296 + (h >> 10), 56320 + (h & 1023))), s += 9;
          continue;
        }
      }
      r += "�";
    }
    return r;
  });
}
ot.defaultChars = ";/?:@&=+$,#", ot.componentChars = "";
var AA = {};
function we(t) {
  let A = AA[t];
  if (A) return A;
  A = AA[t] = [];
  for (let e = 0; e < 128; e++) {
    let n = String.fromCharCode(e);
    /^[0-9a-z]$/i.test(n) ? A.push(n) : A.push("%" + ("0" + e.toString(16).toUpperCase()).slice(-2));
  }
  for (let e = 0; e < t.length; e++) A[t.charCodeAt(e)] = t[e];
  return A;
}
function O(t, A, e) {
  typeof A != "string" && (e = A, A = O.defaultChars), e === void 0 && (e = !0);
  let n = we(A), r = "";
  for (let s = 0, o = t.length; s < o; s++) {
    let i = t.charCodeAt(s);
    if (e && i === 37 && s + 2 < o && /^[0-9a-f]{2}$/i.test(t.slice(s + 1, s + 3))) {
      r += t.slice(s, s + 3), s += 2;
      continue;
    }
    if (i < 128) {
      r += n[i];
      continue;
    }
    if (i >= 55296 && i <= 57343) {
      if (i >= 55296 && i <= 56319 && s + 1 < o) {
        let l = t.charCodeAt(s + 1);
        if (l >= 56320 && l <= 57343) {
          r += encodeURIComponent(t[s] + t[s + 1]), s++;
          continue;
        }
      }
      r += "%EF%BF%BD";
      continue;
    }
    r += encodeURIComponent(t[s]);
  }
  return r;
}
O.defaultChars = ";/?:@&=+$,-_.!~*'()#", O.componentChars = "-_.!~*'()";
function Mt(t) {
  let A = "";
  return A += t.protocol || "", A += t.slashes ? "//" : "", A += t.auth ? t.auth + "@" : "", t.hostname && t.hostname.indexOf(":") !== -1 ? A += "[" + t.hostname + "]" : A += t.hostname || "", A += t.port ? ":" + t.port : "", A += t.pathname || "", A += t.search || "", A += t.hash || "", A;
}
function wt() {
  this.protocol = null, this.slashes = null, this.auth = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.pathname = null;
}
var Qe = /^([a-z0-9.+-]+:)/i, _e = /:[0-9]*$/, xe = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/, eA = [
  "%",
  "/",
  "?",
  ";",
  "#",
  "'",
  "{",
  "}",
  "|",
  "\\",
  "^",
  "`",
  "<",
  ">",
  '"',
  "`",
  " ",
  "\r",
  `
`,
  "	"
], nA = [
  "/",
  "?",
  "#"
], Ke = 255, rA = /^[+a-z0-9A-Z_-]{0,63}$/, We = /^([+a-z0-9A-Z_-]{0,63})(.*)$/, sA = {
  javascript: !0,
  "javascript:": !0
}, iA = {
  http: !0,
  https: !0,
  ftp: !0,
  gopher: !0,
  file: !0,
  "http:": !0,
  "https:": !0,
  "ftp:": !0,
  "gopher:": !0,
  "file:": !0
};
function Ut(t, A) {
  if (t && t instanceof wt) return t;
  let e = new wt();
  return e.parse(t, A), e;
}
wt.prototype.parse = function(t, A) {
  let e, n, r, s = t;
  if (s = s.trim(), !A && t.split("#").length === 1) {
    let a = xe.exec(s);
    if (a) return this.pathname = a[1], a[2] && (this.search = a[2]), this;
  }
  let o = Qe.exec(s);
  if (o && (o = o[0], e = o.toLowerCase(), this.protocol = o, s = s.substr(o.length)), (A || o || s.match(/^\/\/[^@\/]+@[^@\/]+/)) && (r = s.substr(0, 2) === "//", r && !(o && sA[o]) && (s = s.substr(2), this.slashes = !0)), !sA[o] && (r || o && !iA[o])) {
    let a = -1;
    for (let u = 0; u < nA.length; u++) n = s.indexOf(nA[u]), n !== -1 && (a === -1 || n < a) && (a = n);
    let c, h;
    h = a === -1 ? s.lastIndexOf("@") : s.lastIndexOf("@", a), h !== -1 && (c = s.slice(0, h), s = s.slice(h + 1), this.auth = c), a = -1;
    for (let u = 0; u < eA.length; u++) n = s.indexOf(eA[u]), n !== -1 && (a === -1 || n < a) && (a = n);
    a === -1 && (a = s.length), s[a - 1] === ":" && a--;
    let g = s.slice(0, a);
    s = s.slice(a), this.parseHost(g), this.hostname = this.hostname || "";
    let d = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
    if (!d) {
      let u = this.hostname.split(/\./);
      for (let I = 0, D = u.length; I < D; I++) {
        let F = u[I];
        if (F && !F.match(rA)) {
          let y = "";
          for (let m = 0, f = F.length; m < f; m++) F.charCodeAt(m) > 127 ? y += "x" : y += F[m];
          if (!y.match(rA)) {
            let m = u.slice(0, I), f = u.slice(I + 1), B = F.match(We);
            B && (m.push(B[1]), f.unshift(B[2])), f.length && (s = f.join(".") + s), this.hostname = m.join(".");
            break;
          }
        }
      }
    }
    this.hostname.length > Ke && (this.hostname = ""), d && (this.hostname = this.hostname.substr(1, this.hostname.length - 2));
  }
  let i = s.indexOf("#");
  i !== -1 && (this.hash = s.substr(i), s = s.slice(0, i));
  let l = s.indexOf("?");
  return l !== -1 && (this.search = s.substr(l), s = s.slice(0, l)), s && (this.pathname = s), iA[e] && this.hostname && !this.pathname && (this.pathname = ""), this;
}, wt.prototype.parseHost = function(t) {
  let A = _e.exec(t);
  A && (A = A[0], A !== ":" && (this.port = A.substr(1)), t = t.substr(0, t.length - A.length)), t && (this.hostname = t);
};
var ve = /* @__PURE__ */ xt({
  decode: () => ot,
  encode: () => O,
  format: () => Mt,
  parse: () => Ut
}), Ge = /* @__PURE__ */ xt({
  Any: () => _A,
  Cc: () => xA,
  Cf: () => Ye,
  P: () => jt,
  S: () => KA,
  Z: () => WA
}), _A = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, xA = /[\0-\x1F\x7F-\x9F]/, Ye = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/, jt = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B4E\u1B4F\u1B5A-\u1B60\u1B7D-\u1B7F\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDD6E\uDEAD\uDED0\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9\uDFD4\uDFD5\uDFD7\uDFD8]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09\uDFE1]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDD6D-\uDD6F\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD839\uDDFF|\uD83A[\uDD5E\uDD5F]/, KA = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C1\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2429\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E5\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD803[\uDD8E\uDD8F\uDED1-\uDED8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDC00-\uDCEF\uDCFA-\uDCFC\uDD00-\uDEB3\uDEBA-\uDED0\uDEE0-\uDEF0\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED8\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0-\uDCBB\uDCC0\uDCC1\uDCD0-\uDCD8\uDD00-\uDE57\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF-\uDEF8\uDF00-\uDF92\uDF94-\uDFEF\uDFFA]/, WA = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/, Ze = /* @__PURE__ */ new Map([
  [0, 65533],
  [128, 8364],
  [130, 8218],
  [131, 402],
  [132, 8222],
  [133, 8230],
  [134, 8224],
  [135, 8225],
  [136, 710],
  [137, 8240],
  [138, 352],
  [139, 8249],
  [140, 338],
  [142, 381],
  [145, 8216],
  [146, 8217],
  [147, 8220],
  [148, 8221],
  [149, 8226],
  [150, 8211],
  [151, 8212],
  [152, 732],
  [153, 8482],
  [154, 353],
  [155, 8250],
  [156, 339],
  [158, 382],
  [159, 376]
]);
function Je(t) {
  var A;
  return t >= 55296 && t <= 57343 || t > 1114111 ? 65533 : (A = Ze.get(t)) == null ? t : A;
}
function Se(t) {
  let A = atob(t), e = A.length & -2, n = new Uint16Array(e / 2);
  for (let r = 0, s = 0; r < e; r += 2) {
    let o = A.charCodeAt(r), i = A.charCodeAt(r + 1);
    n[s++] = o | i << 8;
  }
  return n;
}
var Re = /* @__PURE__ */ Se("QR08ALkAAgH6AYsDNQR2BO0EPgXZBQEGLAbdBxMISQrvCmQLfQurDKQNLw4fD4YPpA+6D/IPAAAAAAAAAAAAAAAAKhBMEY8TmxUWF2EYLBkxGuAa3RsJHDscWR8YIC8jSCSIJcMl6ie3Ku8rEC0CLjoupS7kLgAIRU1hYmNmZ2xtbm9wcnN0dVQAWgBeAGUAaQBzAHcAfgCBAIQAhwCSAJoAoACsALMAbABpAGcAO4DGAMZAUAA7gCYAJkBjAHUAdABlADuAwQDBQHIiZXZlAAJhAAFpeW0AcgByAGMAO4DCAMJAEGRyAADgNdgE3XIAYQB2AGUAO4DAAMBA8CFoYZFj4SFjcgBhZAAAoFMqAAFncIsAjgBvAG4ABGFmAADgNdg43fAlbHlGdW5jdGlvbgCgYSBpAG4AZwA7gMUAxUAAAWNzpACoAHIAAOA12Jzc6SFnbgCgVCJpAGwAZABlADuAwwDDQG0AbAA7gMQAxEAABGFjZWZvcnN1xQDYANoA7QDxAPYA+QD8AAABY3LJAM8AayNzbGFzaAAAoBYidgHTANUAAKDnKmUAZAAAoAYjeQARZIABY3J0AOAA5QDrAGEidXNlAACgNSLuI291bGxpcwCgLCFhAJJjcgAA4DXYBd1wAGYAAOA12Dnd5SF2ZdhiYwDyAOoAbSJwZXEAAKBOIgAHSE9hY2RlZmhpbG9yc3UXARoBHwE6AVIBVQFiAWQBZgGCAakB6QHtAfIBYwB5ACdkUABZADuAqQCpQIABY3B5ACUBKAE1AfUhdGUGYWmg0iJ0KGFsRGlmZmVyZW50aWFsRAAAoEUhbCJleXMAAKAtIQACYWVpb0EBRAFKAU0B8iFvbgxhZABpAGwAO4DHAMdAcgBjAAhhbiJpbnQAAKAwIm8AdAAKYQABZG5ZAV0BaSJsbGEAuGB0I2VyRG90ALdg8gA5AWkAp2NyImNsZQAAAkRNUFRwAXQBeQF9AW8AdAAAoJkiaSJudXMAAKCWIuwhdXMAoJUiaSJtZXMAAKCXIm8AAAFjc4cBlAFrKndpc2VDb250b3VySW50ZWdyYWwAAKAyImUjQ3VybHkAAAFEUZwBpAFvJXVibGVRdW90ZQAAoB0gdSJvdGUAAKAZIAACbG5wdbABtgHNAdgBbwBuAGWgNyIAoHQqgAFnaXQAvAHBAcUB8iJ1ZW50AKBhIm4AdAAAoC8i7yV1ckludGVncmFsAKAuIgABZnLRAdMBAKACIe8iZHVjdACgECJuLnRlckNsb2Nrd2lzZUNvbnRvdXJJbnRlZ3JhbAAAoDMi7yFzcwCgLypjAHIAAOA12J7ccABDoNMiYQBwAACgTSKABURKU1phY2VmaW9zAAsCEgIVAhgCGwIsAjQCOQI9AnMCfwNvoEUh9CJyYWhkAKARKWMAeQACZGMAeQAFZGMAeQAPZIABZ3JzACECJQIoAuchZXIAoCEgcgAAoKEhaAB2AACg5CoAAWF5MAIzAvIhb24OYRRkbAB0oAciYQCUY3IAAOA12AfdAAFhZkECawIAAWNtRQJnAvIjaXRpY2FsAAJBREdUUAJUAl8CYwJjInV0ZQC0YG8AdAFZAloC2WJiJGxlQWN1dGUA3WJyImF2ZQBgYGkibGRlANxi7yFuZACgxCJmJWVyZW50aWFsRAAAoEYhcAR9AgAAAAAAAIECjgIAABoDZgAA4DXYO91EoagAhQKJAm8AdAAAoNwgcSJ1YWwAAKBQIuIhbGUAA0NETFJVVpkCqAK1Au8C/wIRA28AbgB0AG8AdQByAEkAbgB0AGUAZwByAGEA7ADEAW8AdAKvAgAAAACwAqhgbiNBcnJvdwAAoNMhAAFlb7kC0AJmAHQAgAFBUlQAwQLGAs0CciJyb3cAAKDQIekkZ2h0QXJyb3cAoNQhZQDlACsCbgBnAAABTFLWAugC5SFmdAABQVLcAuECciJyb3cAAKD4J+kkZ2h0QXJyb3cAoPon6SRnaHRBcnJvdwCg+SdpImdodAAAAUFU9gL7AnIicm93AACg0iFlAGUAAKCoInAAQQIGAwAAAAALA3Iicm93AACg0SFvJHduQXJyb3cAAKDVIWUlcnRpY2FsQmFyAACgJSJuAAADQUJMUlRhJAM2AzoDWgNxA3oDciJyb3cAAKGTIUJVLAMwA2EAcgAAoBMpcCNBcnJvdwAAoPUhciJldmUAEWPlIWZ00gJDAwAASwMAAFIDaSVnaHRWZWN0b3IAAKBQKWUkZVZlY3RvcgAAoF4p5SJjdG9yQqC9IWEAcgAAoFYpaSJnaHQA1AFiAwAAaQNlJGVWZWN0b3IAAKBfKeUiY3RvckKgwSFhAHIAAKBXKWUAZQBBoKQiciJyb3cAAKCnIXIAcgBvAPcAtAIAAWN0gwOHA3IAAOA12J/c8iFvaxBhAAhOVGFjZGZnbG1vcHFzdHV4owOlA6kDsAO/A8IDxgPNA9ID8gP9AwEEFAQeBCAEJQRHAEphSAA7gNAA0EBjAHUAdABlADuAyQDJQIABYWl5ALYDuQO+A/Ihb24aYXIAYwA7gMoAykAtZG8AdAAWYXIAAOA12AjdcgBhAHYAZQA7gMgAyEDlIm1lbnQAoAgiAAFhcNYD2QNjAHIAEmF0AHkAUwLhAwAAAADpA20lYWxsU3F1YXJlAACg+yVlJ3J5U21hbGxTcXVhcmUAAKCrJQABZ3D2A/kDbwBuABhhZgAA4DXYPN3zImlsb26VY3UAAAFhaQYEDgRsAFSgdSppImxkZQAAoEIi7CNpYnJpdW0AoMwhAAFjaRgEGwRyAACgMCFtAACgcyphAJdjbQBsADuAywDLQAABaXApBC0E8yF0cwCgAyLvJG5lbnRpYWxFAKBHIYACY2Zpb3MAPQQ/BEMEXQRyBHkAJGRyAADgNdgJ3WwibGVkAFMCTAQAAAAAVARtJWFsbFNxdWFyZQAAoPwlZSdyeVNtYWxsU3F1YXJlAACgqiVwA2UEAABpBAAAAABtBGYAAOA12D3dwSFsbACgACLyI2llcnRyZgCgMSFjAPIAcQQABkpUYWJjZGZnb3JzdIgEiwSOBJMElwSkBKcEqwStBLIE5QTqBGMAeQADZDuAPgA+QO0hbWFkoJMD3GNyImV2ZQAeYYABZWl5AJ0EoASjBOQhaWwiYXIAYwAcYRNkbwB0ACBhcgAA4DXYCt0AoNkicABmAADgNdg+3eUiYXRlcgADRUZHTFNUvwTIBM8E1QTZBOAEcSJ1YWwATKBlIuUhc3MAoNsidSRsbEVxdWFsAACgZyJyI2VhdGVyAACgoirlIXNzAKB3IuwkYW50RXF1YWwAoH4qaSJsZGUAAKBzImMAcgAA4DXYotwAoGsiAARBYWNmaW9zdfkE/QQFBQgFCwUTBSIFKwVSIkRjeQAqZAABY3QBBQQFZQBrAMdiXmDpIXJjJGFyAACgDCFsJWJlcnRTcGFjZQAAoAsh8AEYBQAAGwVmAACgDSHpJXpvbnRhbExpbmUAoAAlAAFjdCYFKAXyABIF8iFvayZhbQBwAEQBMQU5BW8AdwBuAEgAdQBtAPAAAAFxInVhbAAAoE8iAAdFSk9hY2RmZ21ub3N0dVMFVgVZBVwFYwVtBXAFcwV6BZAFtgXFBckFzQVjAHkAFWTsIWlnMmFjAHkAAWRjAHUAdABlADuAzQDNQAABaXlnBWwFcgBjADuAzgDOQBhkbwB0ADBhcgAAoBEhcgBhAHYAZQA7gMwAzEAAoREhYXB/BYsFAAFjZ4MFhQVyACphaSNuYXJ5SQAAoEghbABpAGUA8wD6AvQBlQUAAKUFZaAsIgABZ3KaBZ4F8iFhbACgKyLzI2VjdGlvbgCgwiJpI3NpYmxlAAABQ1SsBbEFbyJtbWEAAKBjIGkibWVzAACgYiCAAWdwdAC8Bb8FwwVvAG4ALmFmAADgNdhA3WEAmWNjAHIAAKAQIWkibGRlAChh6wHSBQAA1QVjAHkABmRsADuAzwDPQIACY2Zvc3UA4QXpBe0F8gX9BQABaXnlBegFcgBjADRhGWRyAADgNdgN3XAAZgAA4DXYQd3jAfcFAAD7BXIAAOA12KXc8iFjeQhk6yFjeQRkgANISmFjZm9zAAwGDwYSBhUGHQYhBiYGYwB5ACVkYwB5AAxk8CFwYZpjAAFleRkGHAbkIWlsNmEaZHIAAOA12A7dcABmAADgNdhC3WMAcgAA4DXYptyABUpUYWNlZmxtb3N0AD0GQAZDBl4GawZkB2gHcAd0B80H2gdjAHkACWQ7gDwAPECAAmNtbnByAEwGTwZSBlUGWwb1IXRlOWHiIWRhm2NnAACg6ifsI2FjZXRyZgCgEiFyAACgniGAAWFleQBkBmcGagbyIW9uPWHkIWlsO2EbZAABZnNvBjQHdAAABUFDREZSVFVWYXKABp4GpAbGBssG3AYDByEHwQIqBwABbnKEBowGZyVsZUJyYWNrZXQAAKDoJ/Ihb3cAoZAhQlKTBpcGYQByAACg5CHpJGdodEFycm93AKDGIWUjaWxpbmcAAKAII28A9QGqBgAAsgZiJWxlQnJhY2tldAAAoOYnbgDUAbcGAAC+BmUkZVZlY3RvcgAAoGEp5SJjdG9yQqDDIWEAcgAAoFkpbCJvb3IAAKAKI2kiZ2h0AAABQVbSBtcGciJyb3cAAKCUIeUiY3RvcgCgTikAAWVy4AbwBmUAAKGjIkFW5gbrBnIicm93AACgpCHlImN0b3IAoFopaSNhbmdsZQBCorIi+wYAAAAA/wZhAHIAAKDPKXEidWFsAACgtCJwAIABRFRWAAoHEQcYB+8kd25WZWN0b3IAoFEpZSRlVmVjdG9yAACgYCnlImN0b3JCoL8hYQByAACgWCnlImN0b3JCoLwhYQByAACgUilpAGcAaAB0AGEAcgByAG8A9wDMAnMAAANFRkdMU1Q/B0cHTgdUB1gHXwfxJXVhbEdyZWF0ZXIAoNoidSRsbEVxdWFsAACgZiJyI2VhdGVyAACgdiLlIXNzAKChKuwkYW50RXF1YWwAoH0qaSJsZGUAAKByInIAAOA12A/dZaDYIuYjdGFycm93AKDaIWkiZG90AD9hgAFucHcAege1B7kHZwAAAkxSbHKCB5QHmwerB+UhZnQAAUFSiAeNB3Iicm93AACg9SfpJGdodEFycm93AKD3J+kkZ2h0QXJyb3cAoPYn5SFmdAABYXLcAqEHaQBnAGgAdABhAHIAcgBvAPcA5wJpAGcAaAB0AGEAcgByAG8A9wDuAmYAAOA12EPdZQByAAABTFK/B8YHZSRmdEFycm93AACgmSHpJGdodEFycm93AKCYIYABY2h0ANMH1QfXB/IAWgYAoLAh8iFva0FhAKBqIgAEYWNlZmlvc3XpB+wH7gf/BwMICQgOCBEIcAAAoAUpeQAcZAABZGzyB/kHaSR1bVNwYWNlAACgXyBsI2ludHJmAACgMyFyAADgNdgQ3e4jdXNQbHVzAKATInAAZgAA4DXYRN1jAPIA/gecY4AESmFjZWZvc3R1ACEIJAgoCDUIgQiFCDsKQApHCmMAeQAKZGMidXRlAENhgAFhZXkALggxCDQI8iFvbkdh5CFpbEVhHWSAAWdzdwA7CGEIfQjhInRpdmWAAU1UVgBECEwIWQhlJWRpdW1TcGFjZQAAoAsgaABpAAABY25SCFMIawBTAHAAYQBjAOUASwhlAHIAeQBUAGgAaQDuAFQI9CFlZAABR0xnCHUIcgBlAGEAdABlAHIARwByAGUAYQB0AGUA8gDrBGUAcwBzAEwAZQBzAPMA2wdMImluZQAKYHIAAOA12BHdAAJCbnB0jAiRCJkInAhyImVhawAAoGAgwiZyZWFraW5nU3BhY2WgYGYAAKAVIUOq7CqzCMIIzQgAAOcIGwkAAAAAAAAtCQAAbwkAAIcJAACdCcAJGQoAADQKAAFvdbYIvAjuI2dydWVudACgYiJwIkNhcAAAoG0ibyh1YmxlVmVydGljYWxCYXIAAKAmIoABbHF4ANII1wjhCOUibWVudACgCSL1IWFsVKBgImkibGRlAADgQiI4A2kic3RzAACgBCJyI2VhdGVyAACjbyJFRkdMU1T1CPoIAgkJCQ0JFQlxInVhbAAAoHEidSRsbEVxdWFsAADgZyI4A3IjZWF0ZXIAAOBrIjgD5SFzcwCgeSLsJGFudEVxdWFsAOB+KjgDaSJsZGUAAKB1IvUhbXBEASAJJwnvI3duSHVtcADgTiI4A3EidWFsAADgTyI4A2UAAAFmczEJRgn0JFRyaWFuZ2xlQqLqIj0JAAAAAEIJYQByAADgzyk4A3EidWFsAACg7CJzAICibiJFR0xTVABRCVYJXAlhCWkJcSJ1YWwAAKBwInIjZWF0ZXIAAKB4IuUhc3MA4GoiOAPsJGFudEVxdWFsAOB9KjgDaSJsZGUAAKB0IuUic3RlZAABR0x1CX8J8iZlYXRlckdyZWF0ZXIA4KIqOAPlI3NzTGVzcwDgoSo4A/IjZWNlZGVzAKGAIkVTjwmVCXEidWFsAADgryo4A+wkYW50RXF1YWwAoOAiAAFlaaAJqQl2JmVyc2VFbGVtZW50AACgDCLnJWh0VHJpYW5nbGVCousitgkAAAAAuwlhAHIAAODQKTgDcSJ1YWwAAKDtIgABcXXDCeAJdSNhcmVTdQAAAWJwywnVCfMhZXRF4I8iOANxInVhbAAAoOIi5SJyc2V0ReCQIjgDcSJ1YWwAAKDjIoABYmNwAOYJ8AkNCvMhZXRF4IIi0iBxInVhbAAAoIgi4yJlZWRzgKGBIkVTVAD6CQAKBwpxInVhbAAA4LAqOAPsJGFudEVxdWFsAKDhImkibGRlAADgfyI4A+UicnNldEXggyLSIHEidWFsAACgiSJpImxkZQCAoUEiRUZUACIKJwouCnEidWFsAACgRCJ1JGxsRXF1YWwAAKBHImkibGRlAACgSSJlJXJ0aWNhbEJhcgAAoCQiYwByAADgNdip3GkAbABkAGUAO4DRANFAnWMAB0VhY2RmZ21vcHJzdHV2XgphCmgKcgp2CnoKgQqRCpYKqwqtCrsKyArNCuwhaWdSYWMAdQB0AGUAO4DTANNAAAFpeWwKcQpyAGMAO4DUANRAHmRiImxhYwBQYXIAAOA12BLdcgBhAHYAZQA7gNIA0kCAAWFlaQCHCooKjQpjAHIATGFnAGEAqWNjInJvbgCfY3AAZgAA4DXYRt3lI25DdXJseQABRFGeCqYKbyV1YmxlUXVvdGUAAKAcIHUib3RlAACgGCAAoFQqAAFjbLEKtQpyAADgNdiq3GEAcwBoADuA2ADYQGkAbAHACsUKZABlADuA1QDVQGUAcwAAoDcqbQBsADuA1gDWQGUAcgAAAUJQ0wrmCgABYXLXCtoKcgAAoD4gYQBjAAABZWvgCuIKAKDeI2UAdAAAoLQjYSVyZW50aGVzaXMAAKDcI4AEYWNmaGlsb3JzAP0KAwsFCwkLCwsMCxELIwtaC3IjdGlhbEQAAKACInkAH2RyAADgNdgT3WkApmOgY/Ujc01pbnVzsWAAAWlwFQsgC24AYwBhAHIAZQBwAGwAYQBuAOUACgVmAACgGSGAobsqZWlvACoLRQtJC+MiZWRlc4CheiJFU1QANAs5C0ALcSJ1YWwAAKCvKuwkYW50RXF1YWwAoHwiaSJsZGUAAKB+Im0AZQAAoDMgAAFkcE0LUQv1IWN0AKAPIm8jcnRpb24AYaA3ImwAAKAdIgABY2leC2ILcgAA4DXYq9yoYwACVWZvc2oLbwtzC3cLTwBUADuAIgAiQHIAAOA12BTdcABmAACgGiFjAHIAAOA12KzcAAZCRWFjZWZoaW9yc3WPC5MLlwupC7YL2AvbC90LhQyTDJoMowzhIXJyAKAQKUcAO4CuAK5AgAFjbnIAnQugC6ML9SF0ZVRhZwAAoOsncgB0oKAhbAAAoBYpgAFhZXkArwuyC7UL8iFvblhh5CFpbFZhIGR2oBwhZSJyc2UAAAFFVb8LzwsAAWxxwwvIC+UibWVudACgCyL1JGlsaWJyaXVtAKDLIXAmRXF1aWxpYnJpdW0AAKBvKXIAAKAcIW8AoWPnIWh0AARBQ0RGVFVWYewLCgwQDDIMNwxeDHwM9gIAAW5y8Av4C2clbGVCcmFja2V0AACg6SfyIW93AKGSIUJM/wsDDGEAcgAAoOUhZSRmdEFycm93AACgxCFlI2lsaW5nAACgCSNvAPUBFgwAAB4MYiVsZUJyYWNrZXQAAKDnJ24A1AEjDAAAKgxlJGVWZWN0b3IAAKBdKeUiY3RvckKgwiFhAHIAAKBVKWwib29yAACgCyMAAWVyOwxLDGUAAKGiIkFWQQxGDHIicm93AACgpiHlImN0b3IAoFspaSNhbmdsZQBCorMiVgwAAAAAWgxhAHIAAKDQKXEidWFsAACgtSJwAIABRFRWAGUMbAxzDO8kd25WZWN0b3IAoE8pZSRlVmVjdG9yAACgXCnlImN0b3JCoL4hYQByAACgVCnlImN0b3JCoMAhYQByAACgUykAAXB1iQyMDGYAAKAdIe4kZEltcGxpZXMAoHAp6SRnaHRhcnJvdwCg2yEAAWNongyhDHIAAKAbIQCgsSHsJGVEZWxheWVkAKD0KYAGSE9hY2ZoaW1vcXN0dQC/DMgMzAzQDOIM5gwKDQ0NFA0ZDU8NVA1YDQABQ2PDDMYMyCFjeSlkeQAoZEYiVGN5ACxkYyJ1dGUAWmEAorwqYWVpedgM2wzeDOEM8iFvbmBh5CFpbF5hcgBjAFxhIWRyAADgNdgW3e8hcnQAAkRMUlXvDPYM/QwEDW8kd25BcnJvdwAAoJMhZSRmdEFycm93AACgkCHpJGdodEFycm93AKCSIXAjQXJyb3cAAKCRIechbWGjY+EkbGxDaXJjbGUAoBgicABmAADgNdhK3XICHw0AAAAAIg10AACgGiLhIXJlgKGhJUlTVQAqDTINSg3uJXRlcnNlY3Rpb24AoJMidQAAAWJwNw1ADfMhZXRFoI8icSJ1YWwAAKCRIuUicnNldEWgkCJxInVhbAAAoJIibiJpb24AAKCUImMAcgAA4DXYrtxhAHIAAKDGIgACYmNtcF8Nag2ODZANc6DQImUAdABFoNAicSJ1YWwAAKCGIgABY2huDYkNZSJlZHMAgKF7IkVTVAB4DX0NhA1xInVhbAAAoLAq7CRhbnRFcXVhbACgfSJpImxkZQAAoH8iVABoAGEA9ADHCwCgESIAodEiZXOVDZ8NciJzZXQARaCDInEidWFsAACghyJlAHQAAKDRIoAFSFJTYWNmaGlvcnMAtQ27Db8NyA3ODdsN3w3+DRgOHQ4jDk8AUgBOADuA3gDeQMEhREUAoCIhAAFIY8MNxg1jAHkAC2R5ACZkAAFidcwNzQ0JYKRjgAFhZXkA1A3XDdoN8iFvbmRh5CFpbGJhImRyAADgNdgX3QABZWnjDe4N8gHoDQAA7Q3lImZvcmUAoDQiYQCYYwABY27yDfkNayNTcGFjZQAA4F8gCiDTInBhY2UAoAkg7CFkZYChPCJFRlQABw4MDhMOcSJ1YWwAAKBDInUkbGxFcXVhbAAAoEUiaSJsZGUAAKBIInAAZgAA4DXYS93pI3BsZURvdACg2yAAAWN0Jw4rDnIAAOA12K/c8iFva2Zh4QpFDlYOYA5qDgAAbg5yDgAAAAAAAAAAAAB5DnwOqA6zDgAADg8RDxYPGg8AAWNySA5ODnUAdABlADuA2gDaQHIAb6CfIeMhaXIAoEkpcgDjAVsOAABdDnkADmR2AGUAbGEAAWl5Yw5oDnIAYwA7gNsA20AjZGIibGFjAHBhcgAA4DXYGN1yAGEAdgBlADuA2QDZQOEhY3JqYQABZGl/Dp8OZQByAAABQlCFDpcOAAFhcokOiw5yAF9gYQBjAAABZWuRDpMOAKDfI2UAdAAAoLUjYSVyZW50aGVzaXMAAKDdI28AbgBQoMMi7CF1cwCgjiIAAWdwqw6uDm8AbgByYWYAAOA12EzdAARBREVUYWRwc78O0g7ZDuEOBQPqDvMOBw9yInJvdwDCoZEhyA4AAMwOYQByAACgEilvJHduQXJyb3cAAKDFIW8kd25BcnJvdwAAoJUhcSV1aWxpYnJpdW0AAKBuKWUAZQBBoKUiciJyb3cAAKClIW8AdwBuAGEAcgByAG8A9wAQA2UAcgAAAUxS+Q4AD2UkZnRBcnJvdwAAoJYh6SRnaHRBcnJvdwCglyFpAGyg0gNvAG4ApWPpIW5nbmFjAHIAAOA12LDcaSJsZGUAaGFtAGwAO4DcANxAgAREYmNkZWZvc3YALQ8xDzUPNw89D3IPdg97D4AP4SFzaACgqyJhAHIAAKDrKnkAEmThIXNobKCpIgCg5ioAAWVyQQ9DDwCgwSKAAWJ0eQBJD00Paw9hAHIAAKAWIGmgFiDjIWFsAAJCTFNUWA9cD18PZg9hAHIAAKAjIukhbmV8YGUkcGFyYXRvcgAAoFgnaSJsZGUAAKBAItQkaGluU3BhY2UAoAogcgAA4DXYGd1wAGYAAOA12E3dYwByAADgNdix3GQiYXNoAACgqiKAAmNlZm9zAI4PkQ+VD5kPng/pIXJjdGHkIWdlAKDAInIAAOA12BrdcABmAADgNdhO3WMAcgAA4DXYstwAAmZpb3OqD64Prw+0D3IAAOA12BvdnmNwAGYAAOA12E/dYwByAADgNdiz3IAEQUlVYWNmb3N1AMgPyw/OD9EP2A/gD+QP6Q/uD2MAeQAvZGMAeQAHZGMAeQAuZGMAdQB0AGUAO4DdAN1AAAFpedwP3w9yAGMAdmErZHIAAOA12BzdcABmAADgNdhQ3WMAcgAA4DXYtNxtAGwAeGEABEhhY2RlZm9z/g8BEAUQDRAQEB0QIBAkEGMAeQAWZGMidXRlAHlhAAFheQkQDBDyIW9ufWEXZG8AdAB7YfIBFRAAABwQbwBXAGkAZAB0AOgAVAhhAJZjcgAAoCghcABmAACgJCFjAHIAAOA12LXc4QtCEEkQTRAAAGcQbRByEAAAAAAAAAAAeRCKEJcQ8hD9EAAAGxEhETIROREAAD4RYwB1AHQAZQA7gOEA4UByImV2ZQADYYCiPiJFZGl1eQBWEFkQWxBgEGUQAOA+IjMDAKA/InIAYwA7gOIA4kB0AGUAO4C0ALRAMGRsAGkAZwA7gOYA5kByoGEgAOA12B7dcgBhAHYAZQA7gOAA4EAAAWVwfBCGEAABZnCAEIQQ8yF5bQCgNSHoAIMQaABhALFjAAFhcI0QWwAAAWNskRCTEHIAAWFnAACgPypkApwQAAAAALEQAKInImFkc3ajEKcQqRCuEG4AZAAAoFUqAKBcKmwib3BlAACgWCoAoFoqAKMgImVsbXJzersQvRDAEN0Q5RDtEACgpCllAACgICJzAGQAYaAhImEEzhDQENIQ1BDWENgQ2hDcEACgqCkAoKkpAKCqKQCgqykAoKwpAKCtKQCgrikAoK8pdAB2oB8iYgBkoL4iAKCdKQABcHTpEOwQaAAAoCIixWDhIXJyAKB8IwABZ3D1EPgQbwBuAAVhZgAA4DXYUt0Ao0giRWFlaW9wBxEJEQ0RDxESERQRAKBwKuMhaXIAoG8qAKBKImQAAKBLInMAJ2DyIW94ZaBIIvEADhFpAG4AZwA7gOUA5UCAAWN0eQAmESoRKxFyAADgNdi23CpgbQBwAGWgSCLxAPgBaQBsAGQAZQA7gOMA40BtAGwAO4DkAORAAAFjaUERRxFvAG4AaQBuAPQA6AFuAHQAAKARKgAITmFiY2RlZmlrbG5vcHJzdWQRaBGXEZ8RpxGrEdIR1hErEjASexKKEn0RThNbE3oTbwB0AACg7SoAAWNybBGJEWsAAAJjZXBzdBF4EX0RghHvIW5nAKBMInAjc2lsb24A9mNyImltZQAAoDUgaQBtAGWgPSJxAACgzSJ2AY0RkRFlAGUAAKC9ImUAZABnoAUjZQAAoAUjcgBrAHSgtSPiIXJrAKC2IwABb3mjEaYRbgDnAHcRMWTxIXVvAKAeIIACY21wcnQAtBG5Eb4RwRHFEeEhdXPloDUi5ABwInR5dgAAoLApcwDpAH0RbgBvAPUA6gCAAWFodwDLEcwRzhGyYwCgNiHlIWVuAKBsInIAAOA12B/dZwCAA2Nvc3R1dncA4xHyEQUSEhIhEiYSKRKAAWFpdQDpEesR7xHwAKMFcgBjAACg7yVwAACgwyKAAWRwdAD4EfwRABJvAHQAAKAAKuwhdXMAoAEqaSJtZXMAAKACKnECCxIAAAAADxLjIXVwAKAGKmEAcgAAoAUm8iNpYW5nbGUAAWR1GhIeEu8hd24AoL0lcAAAoLMlcCJsdXMAAKAEKmUA5QBCD+UAkg9hInJvdwAAoA0pgAFha28ANhJoEncSAAFjbjoSZRJrAIABbHN0AEESRxJNEm8jemVuZ2UAAKDrKXEAdQBhAHIA5QBcBPIjaWFuZ2xlgKG0JWRscgBYElwSYBLvIXduAKC+JeUhZnQAoMIlaSJnaHQAAKC4JWsAAKAjJLEBbRIAAHUSsgFxEgAAcxIAoJIlAKCRJTQAAKCTJWMAawAAoIglAAFlb38ShxJx4D0A5SD1IWl2AOBhIuUgdAAAoBAjAAJwdHd4kRKVEpsSnxJmAADgNdhT3XSgpSJvAG0AAKClIvQhaWUAoMgiAAZESFVWYmRobXB0dXayEsES0RLgEvcS+xIKExoTHxMjEygTNxMAAkxSbHK5ErsSvRK/EgCgVyUAoFQlAKBWJQCgUyUAolAlRFVkdckSyxLNEs8SAKBmJQCgaSUAoGQlAKBnJQACTFJsctgS2hLcEt4SAKBdJQCgWiUAoFwlAKBZJQCjUSVITFJobHLrEu0S7xLxEvMS9RIAoGwlAKBjJQCgYCUAoGslAKBiJQCgXyVvAHgAAKDJKQACTFJscgITBBMGEwgTAKBVJQCgUiUAoBAlAKAMJQCiACVEVWR1EhMUExYTGBMAoGUlAKBoJQCgLCUAoDQlaSJudXMAAKCfIuwhdXMAoJ4iaSJtZXMAAKCgIgACTFJsci8TMRMzEzUTAKBbJQCgWCUAoBglAKAUJQCjAiVITFJobHJCE0QTRhNIE0oTTBMAoGolAKBhJQCgXiUAoDwlAKAkJQCgHCUAAWV2UhNVE3YA5QD5AGIAYQByADuApgCmQAACY2Vpb2ITZhNqE24TcgAA4DXYt9xtAGkAAKBPIG0A5aA9IogRbAAAoVwAYmh0E3YTAKDFKfMhdWIAoMgnbAF+E4QTbABloCIgdAAAoCIgcAAAoU4iRWWJE4sTAKCuKvGgTyI8BeEMqRMAAN8TABQDFB8UAAAjFDQUAAAAAIUUAAAAAI0UAAAAANcU4xT3FPsUAACIFQAAlhWAAWNwcgCuE7ET1RP1IXRlB2GAoikiYWJjZHMAuxO/E8QTzhPSE24AZAAAoEQqciJjdXAAAKBJKgABYXXIE8sTcAAAoEsqcAAAoEcqbwB0AACgQCoA4CkiAP4AAWVv2RPcE3QAAKBBIO4ABAUAAmFlaXXlE+8T9RP4E/AB6hMAAO0TcwAAoE0qbwBuAA1hZABpAGwAO4DnAOdAcgBjAAlhcABzAHOgTCptAACgUCpvAHQAC2GAAWRtbgAIFA0UEhRpAGwAO4C4ALhAcCJ0eXYAAKCyKXQAAIGiADtlGBQZFKJAcgBkAG8A9ABiAXIAAOA12CDdgAFjZWkAKBQqFDIUeQBHZGMAawBtoBMn4SFyawCgEyfHY3IAAKPLJUVjZWZtcz8UQRRHFHcUfBSAFACgwykAocYCZWxGFEkUcQAAoFciZQBhAlAUAAAAAGAUciJyb3cAAAFsclYUWhTlIWZ0AKC6IWkiZ2h0AACguyGAAlJTYWNkAGgUaRRrFG8UcxSuYACgyCRzAHQAAKCbIukhcmMAoJoi4SFzaACgnSJuImludAAAoBAqaQBkAACg7yrjIWlyAKDCKfUhYnN1oGMmaQB0AACgYybsApMUmhS2FAAAwxRvAG4AZaA6APGgVCKrAG0CnxQAAAAAoxRhAHSgLABAYAChASJmbKcUqRTuABMNZQAAAW14rhSyFOUhbnQAoAEiZQDzANIB5wG6FAAAwBRkoEUibwB0AACgbSpuAPQAzAGAAWZyeQDIFMsUzhQA4DXYVN1vAOQA1wEAgakAO3MeAdMUcgAAoBchAAFhb9oU3hRyAHIAAKC1IXMAcwAAoBcnAAFjdeYU6hRyAADgNdi43AABYnDuFPIUZaDPKgCg0SploNAqAKDSKuQhb3QAoO8igANkZWxwcnZ3AAYVEBUbFSEVRBVlFYQV4SFycgABbHIMFQ4VAKA4KQCgNSlwAhYVAAAAABkVcgAAoN4iYwAAoN8i4SFycnCgtiEAoD0pgKIqImJjZG9zACsVMBU6FT4VQRVyImNhcAAAoEgqAAFhdTQVNxVwAACgRipwAACgSipvAHQAAKCNInIAAKBFKgDgKiIA/gACYWxydksVURVuFXMVcgByAG2gtyEAoDwpeQCAAWV2dwBYFWUVaRVxAHACXxUAAAAAYxVyAGUA4wAXFXUA4wAZFWUAZQAAoM4iZSJkZ2UAAKDPImUAbgA7gKQApEBlI2Fycm93AAABbHJ7FX8V5SFmdACgtiFpImdodAAAoLchZQDkAG0VAAFjaYsVkRVvAG4AaQBuAPQAkwFuAHQAAKAxImwiY3R5AACgLSOACUFIYWJjZGVmaGlqbG9yc3R1d3oAuBW7Fb8V1RXgFegV+RUKFhUWHxZUFlcWZRbFFtsW7xb7FgUXChdyAPIAtAJhAHIAAKBlKQACZ2xyc8YVyhXOFdAV5yFlcgCgICDlIXRoAKA4IfIA9QxoAHagECAAoKMiawHZFd4VYSJyb3cAAKAPKWEA4wBfAgABYXnkFecV8iFvbg9hNGQAoUYhYW/tFfQVAAFnciEC8RVyAACgyiF0InNlcQAAoHcqgAFnbG0A/xUCFgUWO4CwALBAdABhALRjcCJ0eXYAAKCxKQABaXIOFhIW8yFodACgfykA4DXYId1hAHIAAAFschsWHRYAoMMhAKDCIYACYWVnc3YAKBauAjYWOhY+Fm0AAKHEIm9zLhY0Fm4AZABzoMQi9SFpdACgZiZhIm1tYQDdY2kAbgAAoPIiAKH3AGlvQxZRFmQAZQAAgfcAO29KFksW90BuI3RpbWVzAACgxyJuAPgAUBZjAHkAUmRjAG8CXhYAAAAAYhZyAG4AAKAeI28AcAAAoA0jgAJscHR1dwBuFnEWdRaSFp4W7CFhciRgZgAA4DXYVd0AotkCZW1wc30WhBaJFo0WcQBkoFAibwB0AACgUSJpIm51cwAAoDgi7CF1cwCgFCLxInVhcmUAoKEiYgBsAGUAYgBhAHIAdwBlAGQAZwDlANcAbgCAAWFkaAClFqoWtBZyAHIAbwD3APUMbwB3AG4AYQByAHIAbwB3APMA8xVhI3Jwb29uAAABbHK8FsAWZQBmAPQAHBZpAGcAaAD0AB4WYgHJFs8WawBhAHIAbwD3AJILbwLUFgAAAADYFnIAbgAAoB8jbwBwAACgDCOAAWNvdADhFukW7BYAAXJ55RboFgDgNdi53FVkbAAAoPYp8iFvaxFhAAFkcvMW9xZvAHQAAKDxImkA5qC/JVsSAAFhaP8WAhdyAPIANQNhAPIA1wvhIm5nbGUAoKYpAAFjaQ4XEBd5AF9k5yJyYXJyAKD/JwAJRGFjZGVmZ2xtbm9wcXJzdHV4MRc4F0YXWxcyBF4XaRd5F40XrBe0F78X2RcVGCEYLRg1GEAYAAFEbzUXgRZvAPQA+BUAAWNzPBdCF3UAdABlADuA6QDpQPQhZXIAoG4qAAJhaW95TRdQF1YXWhfyIW9uG2FyAGOgViI7gOoA6kDsIW9uAKBVIk1kbwB0ABdhAAFEcmIXZhdvAHQAAKBSIgDgNdgi3XKhmipuF3QXYQB2AGUAO4DoAOhAZKCWKm8AdAAAoJgqgKGZKmlscwCAF4UXhxfuInRlcnMAoOcjAKATIWSglSpvAHQAAKCXKoABYXBzAJMXlheiF2MAcgATYXQAeQBzogUinxcAAAAAoRdlAHQAAKAFInAAMaADIDMBqRerFwCgBCAAoAUgAAFnc7AXsRdLYXAAAKACIAABZ3C4F7sXbwBuABlhZgAA4DXYVt2AAWFscwDFF8sXzxdyAHOg1SJsAACg4yl1AHMAAKBxKmkAAKG1A2x21RfYF28AbgC1Y/VjAAJjc3V24BfoF/0XEBgAAWlv5BdWF3IAYwAAoFYiaQLuFwAAAADwF+0ADQThIW50AAFnbPUX+Rd0AHIAAKCWKuUhc3MAoJUqgAFhZWkAAxgGGAoYbABzAD1gcwB0AACgXyJ2AESgYSJEAACgeCrwImFyc2wAoOUpAAFEYRkYHRhvAHQAAKBTInIAcgAAoHEpgAFjZGkAJxgqGO0XcgAAoC8hbwD0AIwCAAFhaDEYMhi3YzuA8ADwQAABbXI5GD0YbAA7gOsA60BvAACgrCCAAWNpcABGGEgYSxhsACFgcwD0ACwEAAFlb08YVxhjAHQAYQB0AGkAbwDuABoEbgBlAG4AdABpAGEAbADlADME4Ql1GAAAgRgAAIMYiBgAAAAAoRilGAAAqhgAALsYvhjRGAAA1xgnGWwAbABpAG4AZwBkAG8AdABzAGUA8QBlF3kARGRtImFsZQAAoEAmgAFpbHIAjRiRGJ0Y7CFpZwCgA/tpApcYAAAAAJoYZwAAoAD7aQBnAACgBPsA4DXYI93sIWlnAKAB++whaWcA4GYAagCAAWFsdACvGLIYthh0AACgbSZpAGcAAKAC+24AcwAAoLElbwBmAJJh8AHCGAAAxhhmAADgNdhX3QABYWvJGMwYbADsAGsEdqDUIgCg2SphI3J0aW50AACgDSoAAWFv2hgiGQABY3PeGB8ZsQPnGP0YBRkSGRUZAAAdGbID7xjyGPQY9xj5GAAA+xg7gL0AvUAAoFMhO4C8ALxAAKBVIQCgWSEAoFshswEBGQAAAxkAoFQhAKBWIbQCCxkOGQAAAAAQGTuAvgC+QACgVyEAoFwhNQAAoFghtgEZGQAAGxkAoFohAKBdITgAAKBeIWwAAKBEIHcAbgAAoCIjYwByAADgNdi73IAIRWFiY2RlZmdpamxub3JzdHYARhlKGVoZXhlmGWkZkhmWGZkZnRmgGa0ZxhnLGc8Z4BkjGmygZyIAoIwqgAFjbXAAUBlTGVgZ9SF0ZfVhbQBhAOSgswM6FgCghipyImV2ZQAfYQABaXliGWUZcgBjAB1hM2RvAHQAIWGAoWUibHFzAMYEcBl6GfGhZSLOBAAAdhlsAGEAbgD0AN8EgKF+KmNkbACBGYQZjBljAACgqSpvAHQAb6CAKmyggioAoIQqZeDbIgD+cwAAoJQqcgAA4DXYJN3noGsirATtIWVsAKA3IWMAeQBTZIChdyJFYWoApxmpGasZAKCSKgCgpSoAoKQqAAJFYWVztBm2Gb0ZwhkAoGkicABwoIoq8iFveACgiipxoIgq8aCIKrUZaQBtAACg5yJwAGYAAOA12FjdYQB2AOUAYwIAAWNp0xnWGXIAAKAKIW0AAKFzImVs3BneGQCgjioAoJAqAIM+ADtjZGxxco0E6xn0GfgZ/BkBGgABY2nvGfEZAKCnKnIAAKB6Km8AdAAAoNci0CFhcgCglSl1ImVzdAAAoHwqgAJhZGVscwAKGvQZFhrVBCAa8AEPGgAAFBpwAHIAbwD4AFkZcgAAoHgpcQAAAWxxxAQbGmwAZQBzAPMASRlpAO0A5AQAAWVuJxouGnIjdG5lcXEAAOBpIgD+xQAsGgAFQWFiY2Vma29zeUAaQxpmGmoabRqDGocalhrCGtMacgDyAMwCAAJpbG1yShpOGlAaVBpyAHMA8ABxD2YAvWBpAGwA9AASBQABZHJYGlsaYwB5AEpkAKGUIWN3YBpkGmkAcgAAoEgpAKCtIWEAcgAAoA8h6SFyYyVhgAFhbHIAcxp7Gn8a8iF0c3WgZSZpAHQAAKBlJuwhaXAAoCYg4yFvbgCguSJyAADgNdgl3XMAAAFld4wakRphInJvdwAAoCUpYSJyb3cAAKAmKYACYW1vcHIAnxqjGqcauhq+GnIAcgAAoP8h9CFodACgOyJrAAABbHKsGrMaZSRmdGFycm93AACgqSHpJGdodGFycm93AKCqIWYAAOA12Fnd4iFhcgCgFSCAAWNsdADIGswa0BpyAADgNdi93GEAcwDoAGka8iFvaydhAAFicNca2xr1IWxsAKBDIOghZW4AoBAg4Qr2GgAA/RoAAAgbExsaGwAAIRs7GwAAAAA+G2IbmRuVG6sbAACyG80b0htjAHUAdABlADuA7QDtQAChYyBpeQEbBhtyAGMAO4DuAO5AOGQAAWN4CxsNG3kANWRjAGwAO4ChAKFAAAFmcssCFhsA4DXYJt1yAGEAdgBlADuA7ADsQIChSCFpbm8AJxsyGzYbAAFpbisbLxtuAHQAAKAMKnQAAKAtIuYhaW4AoNwpdABhAACgKSHsIWlnM2GAAWFvcABDG1sbXhuAAWNndABJG0sbWRtyACthgAFlbHAAcQVRG1UbaQBuAOUAyAVhAHIA9AByBWgAMWFmAACgtyJlAGQAtWEAoggiY2ZvdGkbbRt1G3kb4SFyZQCgBSFpAG4AdKAeImkAZQAAoN0pZABvAPQAWxsAoisiY2VscIEbhRuPG5QbYQBsAACguiIAAWdyiRuNG2UAcgDzACMQ4wCCG2EicmhrAACgFyryIW9kAKA8KgACY2dwdJ8boRukG6gbeQBRZG8AbgAvYWYAAOA12FrdYQC5Y3UAZQBzAHQAO4C/AL9AAAFjabUbuRtyAADgNdi+3G4AAKIIIkVkc3bCG8QbyBvQAwCg+SJvAHQAAKD1Inag9CIAoPMiaaBiIOwhZGUpYesB1hsAANkbYwB5AFZkbAA7gO8A70AAA2NmbW9zdeYb7hvyG/Ub+hsFHAABaXnqG+0bcgBjADVhOWRyAADgNdgn3eEhdGg3YnAAZgAA4DXYW93jAf8bAAADHHIAAOA12L/c8iFjeVhk6yFjeVRkAARhY2ZnaGpvcxUcGhwiHCYcKhwtHDAcNRzwIXBhdqC6A/BjAAFleR4cIRzkIWls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ZmdobG1vcHJzdHV3CiwNLBEsHSwnLDEsQCxLLFIsYix6LIQsjyzLLOgs7Sz/LAotcgDyAAkDYQByAACgYykAAWNyFSwbLHUAdABlADuA+gD6QPIACQ1yAOMBIywAACUseQBeZHYAZQBtYQABaXkrLDAscgBjADuA+wD7QENkgAFhYmgANyw6LD0scgDyANEO7CFhY3FhYQDyAOAOAAFpckQsSCzzIWh0AKB+KQDgNdgy3XIAYQB2AGUAO4D5APlAYQFWLF8scgAAAWxyWixcLACgvyEAoL4hbABrAACggCUAAWN0Zix2LG8CbCwAAAAAcyxyAG4AZaAcI3IAAKAcI28AcAAAoA8jcgBpAACg+CUAAWFsfiyBLGMAcgBrYTuAqACoQAABZ3CILIssbwBuAHNhZgAA4DXYZt0AA2FkaGxzdZksniynLLgsuyzFLHIAcgBvAPcACQ1vAHcAbgBhAHIAcgBvAPcA2A5hI3Jwb29uAAABbHKvLLMsZQBmAPQAWyxpAGcAaAD0AF0sdQDzAKYOaQAAocUDaGzBLMIs0mNvAG4AxWPwI2Fycm93cwCgyCGAAWNpdADRLOEs5CxvAtcsAAAAAN4scgBuAGWgHSNyAACgHSNvAHAAAKAOI24AZwBvYXIAaQAAoPklYwByAADgNdjK3IABZGlyAPMs9yz6LG8AdAAAoPAi7CFkZWlhaQBmoLUlAKC0JQABYW0DLQYtcgDyAMosbAA7gPwA/EDhIm5nbGUAoKcpgAdBQkRhY2RlZmxub3Byc3oAJy0qLTAtNC2bLZ0toS2/LcMtxy3TLdgt3C3gLfwtcgDyABADYQByAHag6CoAoOkqYQBzAOgA/gIAAW5yOC08LechcnQAoJwpgANla25wcnN0AJkpSC1NLVQtXi1iLYItYQBwAHAA4QAaHG8AdABoAGkAbgDnAKEXgAFoaXIAoSmzJFotbwBwAPQAdCVooJUh7wD4JgABaXVmLWotZwBtAOEAuygAAWJwbi14LXMjZXRuZXEAceCKIgD+AODLKgD+cyNldG5lcQBx4IsiAP4A4MwqAP4AAWhyhi2KLWUAdADhABIraSNhbmdsZQAAAWxyki2WLeUhZnQAoLIiaSJnaHQAAKCzInkAMmThIXNoAKCiIoABZWxyAKcttC24LWKiKCKuLQAAAACyLWEAcgAAoLsicQAAoFoi7CFpcACg7iIAAWJ0vC1eD2EA8gBfD3IAAOA12DPddAByAOkAlS1zAHUAAAFicM0t0C0A4IIi0iAA4IMi0iBwAGYAAOA12GfdcgBvAPAAWQt0AHIA6QCaLQABY3XkLegtcgAA4DXYy9wAAWJw7C30LW4AAAFFZXUt8S0A4IoiAP5uAAABRWV/LfktAOCLIgD+6SJnemFnAKCaKYADY2Vmb3BycwANLhAuJS4pLiMuLi40LukhcmN1YQABZGkULiEuAAFiZxguHC5hAHIAAKBfKmUAcaAnIgCgWSLlIXJwAKAYIXIAAOA12DTdcABmAADgNdho3WWgQCJhAHQA6ABqD2MAcgAA4DXYzNzjCuQRUC4AAFQuAABYLmIuAAAAAGMubS5wLnQuAAAAAIguki4AAJouJxIqEnQAcgDpAB0ScgAA4DXYNd0AAUFhWy5eLnIA8gDnAnIA8gCTB75jAAFBYWYuaS5yAPIA4AJyAPIAjAdhAPAAeh5pAHMAAKD7IoABZHB0APgReS6DLgABZmx9LoAuAOA12GnddQDzAP8RaQBtAOUABBIAAUFhiy6OLnIA8gDuAnIA8gCaBwABY3GVLgoScgAA4DXYzdwAAXB0nS6hLmwAdQDzACUScgDpACASAARhY2VmaW9zdbEuvC7ELsguzC7PLtQu2S5jAAABdXm2LrsudABlADuA/QD9QE9kAAFpecAuwy5yAGMAd2FLZG4AO4ClAKVAcgAA4DXYNt1jAHkAV2RwAGYAAOA12GrdYwByAADgNdjO3AABY23dLt8ueQBOZGwAO4D/AP9AAAVhY2RlZmhpb3N38y73Lv8uAi8MLxAvEy8YLx0vIi9jInV0ZQB6YQABYXn7Lv4u8iFvbn5hN2RvAHQAfGEAAWV0Bi8KL3QAcgDmAB8QYQC2Y3IAAOA12DfdYwB5ADZk5yJyYXJyAKDdIXAAZgAA4DXYa91jAHIAAOA12M/cAAFqbiYvKC8AoA0gagAAoAwg"), R;
(function(t) {
  t[t.VALUE_LENGTH = 49152] = "VALUE_LENGTH", t[t.FLAG13 = 8192] = "FLAG13", t[t.BRANCH_LENGTH = 8064] = "BRANCH_LENGTH", t[t.JUMP_TABLE = 127] = "JUMP_TABLE";
})(R || (R = {}));
function ut(t) {
  "@babel/helpers - typeof";
  return ut = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(A) {
    return typeof A;
  } : function(A) {
    return A && typeof Symbol == "function" && A.constructor === Symbol && A !== Symbol.prototype ? "symbol" : typeof A;
  }, ut(t);
}
function He(t, A) {
  if (ut(t) != "object" || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (e !== void 0) {
    var n = e.call(t, A);
    if (ut(n) != "object") return n;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (A === "string" ? String : Number)(t);
}
function Ne(t) {
  var A = He(t, "string");
  return ut(A) == "symbol" ? A : A + "";
}
function p(t, A, e) {
  return (A = Ne(A)) in t ? Object.defineProperty(t, A, {
    value: e,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : t[A] = e, t;
}
var G;
(function(t) {
  t[t.NUM = 35] = "NUM", t[t.SEMI = 59] = "SEMI", t[t.EQUALS = 61] = "EQUALS", t[t.ZERO = 48] = "ZERO", t[t.NINE = 57] = "NINE", t[t.LOWER_A = 97] = "LOWER_A", t[t.LOWER_F = 102] = "LOWER_F", t[t.LOWER_X = 120] = "LOWER_X", t[t.LOWER_Z = 122] = "LOWER_Z", t[t.UPPER_A = 65] = "UPPER_A", t[t.UPPER_F = 70] = "UPPER_F", t[t.UPPER_Z = 90] = "UPPER_Z";
})(G || (G = {}));
var oA = 32;
function zt(t) {
  return t >= G.ZERO && t <= G.NINE;
}
function Me(t) {
  return t >= G.UPPER_A && t <= G.UPPER_F || t >= G.LOWER_A && t <= G.LOWER_F;
}
function Ue(t) {
  return t >= G.UPPER_A && t <= G.UPPER_Z || t >= G.LOWER_A && t <= G.LOWER_Z || zt(t);
}
function ze(t) {
  return t === G.EQUALS || Ue(t);
}
var S;
(function(t) {
  t[t.EntityStart = 0] = "EntityStart", t[t.NumericStart = 1] = "NumericStart", t[t.NumericDecimal = 2] = "NumericDecimal", t[t.NumericHex = 3] = "NumericHex", t[t.NamedEntity = 4] = "NamedEntity";
})(S || (S = {}));
var T;
(function(t) {
  t[t.Legacy = 0] = "Legacy", t[t.Strict = 1] = "Strict", t[t.Attribute = 2] = "Attribute";
})(T || (T = {}));
var Le = class {
  constructor(t, A, e) {
    p(this, "decodeTree", void 0), p(this, "emitCodePoint", void 0), p(this, "errors", void 0), p(this, "state", S.EntityStart), p(this, "consumed", 1), p(this, "result", 0), p(this, "treeIndex", 0), p(this, "excess", 1), p(this, "decodeMode", T.Strict), p(this, "runConsumed", 0), this.decodeTree = t, this.emitCodePoint = A, this.errors = e;
  }
  startEntity(t) {
    this.decodeMode = t, this.state = S.EntityStart, this.result = 0, this.treeIndex = 0, this.excess = 1, this.consumed = 1, this.runConsumed = 0;
  }
  write(t, A) {
    switch (this.state) {
      case S.EntityStart:
        return t.charCodeAt(A) === G.NUM ? (this.state = S.NumericStart, this.consumed += 1, this.stateNumericStart(t, A + 1)) : (this.state = S.NamedEntity, this.stateNamedEntity(t, A));
      case S.NumericStart:
        return this.stateNumericStart(t, A);
      case S.NumericDecimal:
        return this.stateNumericDecimal(t, A);
      case S.NumericHex:
        return this.stateNumericHex(t, A);
      case S.NamedEntity:
        return this.stateNamedEntity(t, A);
    }
  }
  stateNumericStart(t, A) {
    return A >= t.length ? -1 : (t.charCodeAt(A) | oA) === G.LOWER_X ? (this.state = S.NumericHex, this.consumed += 1, this.stateNumericHex(t, A + 1)) : (this.state = S.NumericDecimal, this.stateNumericDecimal(t, A));
  }
  stateNumericHex(t, A) {
    for (; A < t.length; ) {
      let e = t.charCodeAt(A);
      if (zt(e) || Me(e)) {
        let n = e <= G.NINE ? e - G.ZERO : (e | oA) - G.LOWER_A + 10;
        this.result = this.result * 16 + n, this.consumed++, A++;
      } else return this.emitNumericEntity(e, 3);
    }
    return -1;
  }
  stateNumericDecimal(t, A) {
    for (; A < t.length; ) {
      let e = t.charCodeAt(A);
      if (zt(e)) this.result = this.result * 10 + (e - G.ZERO), this.consumed++, A++;
      else return this.emitNumericEntity(e, 2);
    }
    return -1;
  }
  emitNumericEntity(t, A) {
    if (this.consumed <= A) {
      var e;
      return (e = this.errors) == null || e.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
    }
    if (t === G.SEMI) this.consumed += 1;
    else if (this.decodeMode === T.Strict) return 0;
    return this.emitCodePoint(Je(this.result), this.consumed), this.errors && (t !== G.SEMI && this.errors.missingSemicolonAfterCharacterReference(), this.errors.validateNumericCharacterReference(this.result)), this.consumed;
  }
  stateNamedEntity(t, A) {
    let { decodeTree: e } = this, n = e[this.treeIndex], r = (n & R.VALUE_LENGTH) >> 14;
    for (; A < t.length; ) {
      if (r === 0 && n & R.FLAG13) {
        let o = (n & R.BRANCH_LENGTH) >> 7;
        if (this.runConsumed === 0) {
          let i = n & R.JUMP_TABLE;
          if (t.charCodeAt(A) !== i) return this.result === 0 ? 0 : this.emitNotTerminatedNamedEntity();
          A++, this.excess++, this.runConsumed++;
        }
        for (; this.runConsumed < o; ) {
          if (A >= t.length) return -1;
          let i = this.runConsumed - 1, l = e[this.treeIndex + 1 + (i >> 1)], a = i % 2 == 0 ? l & 255 : l >> 8 & 255;
          if (t.charCodeAt(A) !== a) return this.runConsumed = 0, this.result === 0 ? 0 : this.emitNotTerminatedNamedEntity();
          A++, this.excess++, this.runConsumed++;
        }
        this.runConsumed = 0, this.treeIndex += 1 + (o >> 1), n = e[this.treeIndex], r = (n & R.VALUE_LENGTH) >> 14;
      }
      if (A >= t.length) break;
      let s = t.charCodeAt(A);
      if (s === G.SEMI && r !== 0 && n & R.FLAG13) return this.emitNamedEntityData(this.treeIndex, r, this.consumed + this.excess);
      if (this.treeIndex = Oe(e, n, this.treeIndex + Math.max(1, r), s), this.treeIndex < 0) return this.result === 0 || this.decodeMode === T.Attribute && (r === 0 || ze(s)) ? 0 : this.emitNotTerminatedNamedEntity();
      if (n = e[this.treeIndex], r = (n & R.VALUE_LENGTH) >> 14, r !== 0) {
        if (s === G.SEMI) return this.emitNamedEntityData(this.treeIndex, r, this.consumed + this.excess);
        this.decodeMode !== T.Strict && !(n & R.FLAG13) && (this.result = this.treeIndex, this.consumed += this.excess, this.excess = 0);
      }
      A++, this.excess++;
    }
    return -1;
  }
  emitNotTerminatedNamedEntity() {
    var t;
    let { result: A, decodeTree: e } = this, n = (e[A] & R.VALUE_LENGTH) >> 14;
    return this.emitNamedEntityData(A, n, this.consumed), (t = this.errors) == null || t.missingSemicolonAfterCharacterReference(), this.consumed;
  }
  emitNamedEntityData(t, A, e) {
    let { decodeTree: n } = this;
    return this.emitCodePoint(A === 1 ? n[t] & ~(R.VALUE_LENGTH | R.FLAG13) : n[t + 1], e), A === 3 && this.emitCodePoint(n[t + 2], e), e;
  }
  end() {
    switch (this.state) {
      case S.NamedEntity:
        return this.result !== 0 && (this.decodeMode !== T.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
      case S.NumericDecimal:
        return this.emitNumericEntity(0, 2);
      case S.NumericHex:
        return this.emitNumericEntity(0, 3);
      case S.NumericStart:
        var t;
        return (t = this.errors) == null || t.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
      case S.EntityStart:
        return 0;
    }
  }
};
function Xe(t) {
  let A = "", e = new Le(t, (n) => A += String.fromCodePoint(n));
  return function(n, r) {
    let s = 0, o = 0;
    for (; (o = n.indexOf("&", o)) >= 0; ) {
      A += n.slice(s, o), e.startEntity(r);
      let l = e.write(n, o + 1);
      if (l < 0) {
        s = o + e.end();
        break;
      }
      s = o + l, o = l === 0 ? s + 1 : s;
    }
    let i = A + n.slice(s);
    return A = "", i;
  };
}
function Oe(t, A, e, n) {
  let r = (A & R.BRANCH_LENGTH) >> 7, s = A & R.JUMP_TABLE;
  if (r === 0) return s !== 0 && n === s ? e : -1;
  if (s) {
    let a = n - s;
    return a < 0 || a >= r ? -1 : t[e + a] - 1;
  }
  let o = r + 1 >> 1, i = 0, l = r - 1;
  for (; i <= l; ) {
    let a = i + l >>> 1, c = t[e + (a >> 1)] >> (a & 1) * 8 & 255;
    if (c < n) i = a + 1;
    else if (c > n) l = a - 1;
    else return t[e + o + a];
  }
  return -1;
}
var je = /* @__PURE__ */ Xe(Re);
function vA(t) {
  return je(t, T.Strict);
}
var Ve = /* @__PURE__ */ xt({
  arrayReplaceAt: () => Pe,
  asciiTrim: () => Wt,
  callable: () => GA,
  escapeHtml: () => tt,
  escapeRE: () => on,
  fromCodePoint: () => ct,
  isMdAsciiPunct: () => gt,
  isPunctChar: () => ZA,
  isPunctCharCode: () => dt,
  isSpace: () => W,
  isValidEntityCode: () => Vt,
  isWhiteSpace: () => ht,
  lib: () => ln,
  normalizeReference: () => Kt,
  unescapeAll: () => lt,
  unescapeMd: () => tn
});
function GA(t) {
  let A = function(...e) {
    return Reflect.construct(t, e, new.target && new.target !== A ? new.target : t);
  };
  return Object.defineProperty(A, "name", { value: t.name }), Object.setPrototypeOf(A, t), A.prototype = t.prototype, A;
}
function Pe(t, A, e) {
  return [].concat(t.slice(0, A), e, t.slice(A + 1));
}
function Vt(t) {
  return !(t >= 55296 && t <= 57343 || t >= 64976 && t <= 65007 || (t & 65535) == 65535 || (t & 65535) == 65534 || t >= 0 && t <= 8 || t === 11 || t >= 14 && t <= 31 || t >= 127 && t <= 159 || t > 1114111);
}
function ct(t) {
  if (t > 65535) {
    t -= 65536;
    let A = 55296 + (t >> 10), e = 56320 + (t & 1023);
    return String.fromCharCode(A, e);
  }
  return String.fromCharCode(t);
}
var YA = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, Te = RegExp(`${YA.source}|&([a-z#][a-z0-9]{1,31});`, "gi"), qe = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function $e(t, A) {
  if (A.charCodeAt(0) === 35 && qe.test(A)) {
    let n = A[1].toLowerCase() === "x" ? parseInt(A.slice(2), 16) : parseInt(A.slice(1), 10);
    return Vt(n) ? ct(n) : t;
  }
  let e = vA(t);
  return e === t ? t : e;
}
function tn(t) {
  return t.indexOf("\\") < 0 ? t : t.replace(YA, "$1");
}
function lt(t) {
  return t.indexOf("\\") < 0 && t.indexOf("&") < 0 ? t : t.replace(Te, function(A, e, n) {
    return e || $e(A, n);
  });
}
var An = /[&<>"]/, en = /[&<>"]/g, nn = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
};
function rn(t) {
  return nn[t];
}
function tt(t) {
  return An.test(t) ? t.replace(en, rn) : t;
}
var sn = /[.?*+^$[\]\\(){}|-]/g;
function on(t) {
  return t.replace(sn, "\\$&");
}
function W(t) {
  switch (t) {
    case 9:
    case 32:
      return !0;
  }
  return !1;
}
function ht(t) {
  if (t >= 8192 && t <= 8202) return !0;
  switch (t) {
    case 9:
    case 10:
    case 11:
    case 12:
    case 13:
    case 32:
    case 160:
    case 5760:
    case 8239:
    case 8287:
    case 12288:
      return !0;
  }
  return !1;
}
function ZA(t) {
  return jt.test(t) || KA.test(t);
}
function dt(t) {
  return ZA(ct(t));
}
function gt(t) {
  switch (t) {
    case 33:
    case 34:
    case 35:
    case 36:
    case 37:
    case 38:
    case 39:
    case 40:
    case 41:
    case 42:
    case 43:
    case 44:
    case 45:
    case 46:
    case 47:
    case 58:
    case 59:
    case 60:
    case 61:
    case 62:
    case 63:
    case 64:
    case 91:
    case 92:
    case 93:
    case 94:
    case 95:
    case 96:
    case 123:
    case 124:
    case 125:
    case 126:
      return !0;
    default:
      return !1;
  }
}
function Kt(t) {
  return t = t.trim().replace(/\s+/g, " "), t.toLowerCase().toUpperCase();
}
function lA(t) {
  return t === 32 || t === 9 || t === 10 || t === 13;
}
function Wt(t) {
  let A = 0;
  for (; A < t.length && lA(t.charCodeAt(A)); A++) ;
  let e = t.length - 1;
  for (; e >= A && lA(t.charCodeAt(e)); e--) ;
  return t.slice(A, e + 1);
}
var ln = {
  mdurl: ve,
  ucmicro: Ge
};
function an(t, A, e) {
  let n, r, s, o, i = t.posMax, l = t.pos;
  for (t.pos = A + 1, n = 1; t.pos < i; ) {
    if (s = t.src.charCodeAt(t.pos), s === 93 && (n--, n === 0)) {
      r = !0;
      break;
    }
    if (o = t.pos, t.md.inline.skipToken(t), s === 91) {
      if (o === t.pos - 1) n++;
      else if (e) return t.pos = l, -1;
    }
  }
  let a = -1;
  return r && (a = t.pos), t.pos = l, a;
}
function un(t, A, e) {
  let n, r = A, s = {
    ok: !1,
    pos: 0,
    str: ""
  };
  if (t.charCodeAt(r) === 60) {
    for (r++; r < e; ) {
      if (n = t.charCodeAt(r), n === 10 || n === 60) return s;
      if (n === 62) return s.pos = r + 1, s.str = lt(t.slice(A + 1, r)), s.ok = !0, s;
      if (n === 92 && r + 1 < e) {
        r += 2;
        continue;
      }
      r++;
    }
    return s;
  }
  let o = 0;
  for (; r < e && (n = t.charCodeAt(r), !(n === 32 || n < 32 || n === 127)); ) {
    if (n === 92 && r + 1 < e) {
      if (t.charCodeAt(r + 1) === 32) {
        r++;
        continue;
      }
      r += 2;
      continue;
    }
    if (n === 40 && (o++, o > 32)) return s;
    if (n === 41) {
      if (o === 0) break;
      o--;
    }
    r++;
  }
  return A === r || o !== 0 || (s.str = lt(t.slice(A, r)), s.pos = r, s.ok = !0), s;
}
function cn(t, A, e, n) {
  let r, s = A, o = {
    ok: !1,
    can_continue: !1,
    pos: 0,
    str: "",
    marker: 0
  };
  if (n) o.str = n.str, o.marker = n.marker;
  else {
    if (s >= e) return o;
    let i = t.charCodeAt(s);
    if (i !== 34 && i !== 39 && i !== 40) return o;
    A++, s++, i === 40 && (i = 41), o.marker = i;
  }
  for (; s < e; ) {
    if (r = t.charCodeAt(s), r === o.marker) return o.pos = s + 1, o.str += lt(t.slice(A, s)), o.ok = !0, o;
    if (r === 40 && o.marker === 41) return o;
    r === 92 && s + 1 < e && s++, s++;
  }
  return o.can_continue = !0, o.str += lt(t.slice(A, s)), o;
}
var hn = /* @__PURE__ */ xt({
  parseLinkDestination: () => un,
  parseLinkLabel: () => an,
  parseLinkTitle: () => cn
}), At = class {
  constructor(t, A, e) {
    p(this, "map", null), p(this, "level", 0), p(this, "children", null), p(this, "content", ""), p(this, "markup", ""), p(this, "info", ""), p(this, "block", !1), p(this, "hidden", !1), this.type = t, this.tag = A, this.attrs = null, this.nesting = e, this.meta = null;
  }
  attrIndex(t) {
    if (!this.attrs) return -1;
    let A = this.attrs;
    for (let e = 0, n = A.length; e < n; e++) if (A[e][0] === t) return e;
    return -1;
  }
  attrPush(t) {
    this.attrs ? this.attrs.push(t) : this.attrs = [t];
  }
  attrSet(t, A) {
    let e = this.attrIndex(t), n = [t, A];
    e < 0 ? this.attrPush(n) : this.attrs[e] = n;
  }
  attrGet(t) {
    let A = this.attrIndex(t), e = null;
    return A >= 0 && (e = this.attrs[A][1]), e;
  }
  attrJoin(t, A) {
    let e = this.attrIndex(t);
    e < 0 ? this.attrPush([t, A]) : this.attrs[e][1] = `${this.attrs[e][1]} ${A}`;
  }
}, pt = class {
  constructor() {
    p(this, "__rules__", []), p(this, "__cache__", null);
  }
  __find__(t) {
    for (let A = 0; A < this.__rules__.length; A++) if (this.__rules__[A].name === t) return A;
    return -1;
  }
  __compile__() {
    let t = /* @__PURE__ */ new Set();
    this.__rules__.forEach((A) => {
      A.enabled && A.alt.forEach((e) => {
        e && t.add(e);
      });
    }), this.__cache__ = /* @__PURE__ */ Object.create(null), this.__cache__[""] = [], this.__rules__.forEach((A) => {
      A.enabled && this.__cache__[""].push(A.fn);
    }), t.forEach((A) => {
      this.__cache__[A] = [], this.__rules__.forEach((e) => {
        e.enabled && e.alt.indexOf(A) >= 0 && this.__cache__[A].push(e.fn);
      });
    });
  }
  at(t, A, e = {}) {
    let n = this.__find__(t);
    if (n === -1) throw Error(`Parser rule not found: ${t}`);
    this.__rules__[n].fn = A, this.__rules__[n].alt = e.alt || [], this.__cache__ = null;
  }
  before(t, A, e, n = {}) {
    let r = this.__find__(t);
    if (r === -1) throw Error(`Parser rule not found: ${t}`);
    this.__rules__.splice(r, 0, {
      name: A,
      enabled: !0,
      fn: e,
      alt: n.alt || []
    }), this.__cache__ = null;
  }
  after(t, A, e, n = {}) {
    let r = this.__find__(t);
    if (r === -1) throw Error(`Parser rule not found: ${t}`);
    this.__rules__.splice(r + 1, 0, {
      name: A,
      enabled: !0,
      fn: e,
      alt: n.alt || []
    }), this.__cache__ = null;
  }
  push(t, A, e = {}) {
    this.__rules__.push({
      name: t,
      enabled: !0,
      fn: A,
      alt: e.alt || []
    }), this.__cache__ = null;
  }
  enable(t, A = !1) {
    Array.isArray(t) || (t = [t]);
    let e = [];
    return t.forEach((n) => {
      let r = this.__find__(n);
      if (r < 0) {
        if (A) return;
        throw Error(`Rules manager: invalid rule name ${n}`);
      }
      this.__rules__[r].enabled = !0, e.push(n);
    }), this.__cache__ = null, e;
  }
  enableOnly(t, A = !1) {
    Array.isArray(t) || (t = [t]), this.__rules__.forEach((e) => {
      e.enabled = !1;
    }), this.enable(t, A);
  }
  disable(t, A = !1) {
    Array.isArray(t) || (t = [t]);
    let e = [];
    return t.forEach((n) => {
      let r = this.__find__(n);
      if (r < 0) {
        if (A) return;
        throw Error(`Rules manager: invalid rule name ${n}`);
      }
      this.__rules__[r].enabled = !1, e.push(n);
    }), this.__cache__ = null, e;
  }
  getRules(t) {
    return this.__cache__ || this.__compile__(), this.__cache__[t] || [];
  }
}, M = {};
M.code_inline = function(t, A, e, n, r) {
  let s = t[A];
  return `<code${r.renderAttrs(s)}>${tt(s.content)}</code>`;
}, M.code_block = function(t, A, e, n, r) {
  let s = t[A];
  return `<pre${r.renderAttrs(s)}><code>${tt(t[A].content)}</code></pre>
`;
}, M.fence = function(t, A, e, n, r) {
  let s = t[A], o = s.info ? lt(s.info).trim() : "", i = "", l = "";
  if (o) {
    let c = o.split(/(\s+)/g);
    i = c[0], l = c.slice(2).join("");
  }
  let a;
  if (a = e.highlight && e.highlight(s.content, i, l) || tt(s.content), a.indexOf("<pre") === 0) return a + `
`;
  if (o) {
    let c = s.attrIndex("class"), h = s.attrs ? s.attrs.slice() : [];
    c < 0 ? h.push(["class", `${e.langPrefix}${i}`]) : (h[c] = [h[c][0], h[c][1]], h[c][1] += ` ${e.langPrefix}${i}`);
    let g = { attrs: h };
    return `<pre><code${r.renderAttrs(g)}>${a}</code></pre>
`;
  }
  return `<pre><code${r.renderAttrs(s)}>${a}</code></pre>
`;
}, M.image = function(t, A, e, n, r) {
  let s = t[A];
  return s.attrs[s.attrIndex("alt")][1] = r.renderInlineAsText(s.children, e, n), r.renderToken(t, A, e);
}, M.hardbreak = function(t, A, e) {
  return e.xhtmlOut ? `<br />
` : `<br>
`;
}, M.softbreak = function(t, A, e) {
  return e.breaks ? e.xhtmlOut ? `<br />
` : `<br>
` : `
`;
}, M.text = function(t, A) {
  return tt(t[A].content);
}, M.html_block = function(t, A) {
  return t[A].content;
}, M.html_inline = function(t, A) {
  return t[A].content;
};
var JA = class {
  constructor() {
    p(this, "rules", Object.assign({}, M));
  }
  renderAttrs(t) {
    let A, e, n;
    if (!t.attrs) return "";
    for (n = "", A = 0, e = t.attrs.length; A < e; A++) n += ` ${tt(t.attrs[A][0])}="${tt(String(t.attrs[A][1]))}"`;
    return n;
  }
  renderToken(t, A, e) {
    let n = t[A], r = "";
    if (n.hidden) return "";
    let s = A - 1;
    for (; s >= 0 && t[s].hidden && t[s].nesting === 0; ) s--;
    n.block && n.nesting !== -1 && s >= 0 && t[s].hidden && t[s].nesting === -1 && (r += `
`), r += (n.nesting === -1 ? "</" : "<") + n.tag, r += this.renderAttrs(n), n.nesting === 0 && e.xhtmlOut && (r += " /");
    let o = !1;
    if (n.block && (o = !0, n.nesting === 1)) {
      let i = A + 1;
      for (; i < t.length && t[i].hidden && t[i].nesting === 0; ) i++;
      if (i < t.length) {
        let l = t[i];
        (l.type === "inline" || l.hidden || l.nesting === -1 && l.tag === n.tag) && (o = !1);
      }
    }
    return r += o ? `>
` : ">", r;
  }
  renderInline(t, A, e) {
    let n = "", r = this.rules;
    for (let s = 0, o = t.length; s < o; s++) {
      let i = t[s].type;
      r[i] === void 0 ? n += this.renderToken(t, s, A) : n += r[i](t, s, A, e, this);
    }
    return n;
  }
  renderInlineAsText(t, A, e) {
    let n = "";
    for (let r = 0, s = t.length; r < s; r++) switch (t[r].type) {
      case "text":
      case "code_inline":
        n += t[r].content;
        break;
      case "image":
        n += this.renderInlineAsText(t[r].children, A, e);
        break;
      case "html_inline":
      case "html_block":
        n += t[r].content;
        break;
      case "softbreak":
      case "hardbreak":
        n += `
`;
    }
    return n;
  }
  render(t, A, e) {
    let n = "", r = this.rules;
    for (let s = 0, o = t.length; s < o; s++) {
      let i = t[s].type;
      i === "inline" ? n += this.renderInline(t[s].children, A, e) : r[i] === void 0 ? n += this.renderToken(t, s, A) : n += r[i](t, s, A, e, this);
    }
    return n;
  }
}, SA = class {
  constructor(t, A, e) {
    p(this, "tokens", []), p(this, "inlineMode", !1), p(this, "Token", At), this.src = t, this.env = e, this.md = A;
  }
}, dn = /\r\n?/g, gn = /\0/g;
function pn(t) {
  let A;
  A = t.src.replace(dn, `
`), A = A.replace(gn, "�"), t.src = A;
}
function fn(t) {
  let A;
  t.inlineMode ? (A = new t.Token("inline", "", 0), A.content = t.src, A.map = [0, 1], A.children = [], t.tokens.push(A)) : t.md.block.parse(t.src, t.md, t.env, t.tokens);
}
function Cn(t) {
  let A = t.tokens, e = 0;
  for (let n = 0; n < A.length; n++) A[n].type !== "reference_definition" && (n !== e && (A[e] = A[n]), e++);
  A.length !== e && (A.length = e);
}
function mn(t) {
  let A = t.tokens;
  for (let e = 0, n = A.length; e < n; e++) {
    let r = A[e];
    r.type === "inline" && t.md.inline.parse(r.content, t.md, t.env, r.children);
  }
}
function Dn(t) {
  return /^<a[>\s]/i.test(t);
}
function In(t) {
  return /^<\/a\s*>/i.test(t);
}
function Fn(t) {
  let A = t.tokens;
  if (t.md.options.linkify) for (let e = 0, n = A.length; e < n; e++) {
    if (A[e].type !== "inline" || !t.md.linkify.test(A[e].content)) continue;
    let r = A[e].children, s = [], o = 0;
    for (let i = r.length - 1; i >= 0; i--) {
      let l = r[i];
      if (l.type === "link_close") {
        for (i--; r[i].level !== l.level && r[i].type !== "link_open"; ) i--;
        continue;
      }
      if (l.type === "html_inline" && (Dn(l.content) && o > 0 && o--, In(l.content) && o++), !(o > 0) && l.type === "text" && t.md.linkify.test(l.content)) {
        let a = l.content, c = t.md.linkify.match(a), h = [], g = l.level, d = 0;
        c.length > 0 && c[0].index === 0 && i > 0 && r[i - 1].type === "text_special" && (c = c.slice(1));
        for (let u = 0; u < c.length; u++) {
          let I = c[u].url, D = t.md.normalizeLink(I);
          if (!t.md.validateLink(D)) continue;
          let F = c[u].text;
          F = c[u].schema ? c[u].schema === "mailto:" && !/^mailto:/i.test(F) ? t.md.normalizeLinkText(`mailto:${F}`).replace(/^mailto:/, "") : t.md.normalizeLinkText(F) : t.md.normalizeLinkText(`http://${F}`).replace(/^http:\/\//, "");
          let y = c[u].index;
          if (y > d) {
            let E = new t.Token("text", "", 0);
            E.content = a.slice(d, y), E.level = g, h.push(E);
          }
          let m = new t.Token("link_open", "a", 1);
          m.attrs = [["href", D]], m.level = g++, m.markup = "linkify", m.info = "auto", h.push(m);
          let f = new t.Token("text", "", 0);
          f.content = F, f.level = g, h.push(f);
          let B = new t.Token("link_close", "a", -1);
          B.level = --g, B.markup = "linkify", B.info = "auto", h.push(B), d = c[u].lastIndex;
        }
        if (d < a.length) {
          let u = new t.Token("text", "", 0);
          u.content = a.slice(d), u.level = g, h.push(u);
        }
        s.push({
          index: i,
          nodes: h
        });
      }
    }
    if (s.length > 0) {
      let i = r.length;
      for (let h of s) i += h.nodes.length - 1;
      let l = Array(i), a = 0, c = 0;
      s.reverse();
      for (let h = 0; h < r.length; h++) {
        let g = s[a];
        if ((g == null ? void 0 : g.index) === h) {
          for (let d of g.nodes) l[c++] = d;
          a++;
        } else l[c++] = r[h];
      }
      A[e].children = l;
    }
  }
}
var RA = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/, Bn = /\((c|tm|r)\)/i, kn = /\((c|tm|r)\)/gi, yn = {
  c: "©",
  r: "®",
  tm: "™"
};
function bn(t, A) {
  return yn[A.toLowerCase()];
}
function En(t) {
  let A = 0;
  for (let e = t.length - 1; e >= 0; e--) {
    let n = t[e];
    n.type === "text" && !A && (n.content = n.content.replace(kn, bn)), n.type === "link_open" && n.info === "auto" && A--, n.type === "link_close" && n.info === "auto" && A++;
  }
}
function wn(t) {
  let A = 0;
  for (let e = t.length - 1; e >= 0; e--) {
    let n = t[e];
    n.type === "text" && !A && RA.test(n.content) && (n.content = n.content.replace(/\+-/g, "±").replace(/\.{2,}/g, "…").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/gm, "$1—").replace(/(^|\s)--(?=\s|$)/gm, "$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/gm, "$1–")), n.type === "link_open" && n.info === "auto" && A--, n.type === "link_close" && n.info === "auto" && A++;
  }
}
function Qn(t) {
  let A;
  if (t.md.options.typographer) for (A = t.tokens.length - 1; A >= 0; A--) t.tokens[A].type === "inline" && (Bn.test(t.tokens[A].content) && En(t.tokens[A].children), RA.test(t.tokens[A].content) && wn(t.tokens[A].children));
}
var _n = /['"]/, aA = /['"]/g, uA = "’", xn = 1e3;
function cA(t, A, e) {
  for (; t.length > e; ) {
    let n = t.pop();
    n.isSingleQuote ? A.single = n.prevSameQuoteIdx : A.double = n.prevSameQuoteIdx;
  }
}
function Dt(t, A, e, n) {
  t[A] || (t[A] = []), t[A].push({
    pos: e,
    ch: n
  });
}
function Kn(t, A) {
  let e = "", n = 0;
  A.sort((r, s) => r.pos - s.pos);
  for (let r = 0; r < A.length; r++) {
    let s = A[r];
    e += t.slice(n, s.pos) + s.ch, n = s.pos + 1;
  }
  return e + t.slice(n);
}
function Wn(t, A) {
  let e, n = [], r = {
    single: -1,
    double: -1
  }, s = {};
  for (let o = 0; o < t.length; o++) {
    let i = t[o], l = t[o].level;
    for (e = n.length - 1; e >= 0 && !(n[e].level <= l); e--) ;
    if (cA(n, r, e + 1), i.type !== "text") continue;
    let a = i.content, c = 0, h = a.length;
    t: for (; c < h; ) {
      aA.lastIndex = c;
      let g = aA.exec(a);
      if (!g) break;
      let d = !0, u = !0;
      c = g.index + 1;
      let I = g[0] === "'", D = 32;
      if (g.index - 1 >= 0) D = a.charCodeAt(g.index - 1);
      else for (e = o - 1; e >= 0 && t[e].type !== "softbreak" && t[e].type !== "hardbreak"; e--) if (t[e].content) {
        D = t[e].content.charCodeAt(t[e].content.length - 1);
        break;
      }
      let F = 32;
      if (c < h) F = a.charCodeAt(c);
      else for (e = o + 1; e < t.length && t[e].type !== "softbreak" && t[e].type !== "hardbreak"; e++) if (t[e].content) {
        F = t[e].content.charCodeAt(0);
        break;
      }
      let y = gt(D) || dt(D), m = gt(F) || dt(F), f = ht(D), B = ht(F);
      if (B ? d = !1 : m && (f || y || (d = !1)), f ? u = !1 : y && (B || m || (u = !1)), F === 34 && g[0] === '"' && D >= 48 && D <= 57 && (u = d = !1), d && u && (d = y, u = m), !d && !u) {
        I && Dt(s, o, g.index, uA);
        continue;
      }
      if (u && (e = I ? r.single : r.double, e >= 0 && n[e].level === l)) {
        let E = n[e], v, k;
        I ? (v = A.md.options.quotes[2], k = A.md.options.quotes[3]) : (v = A.md.options.quotes[0], k = A.md.options.quotes[1]), Dt(s, o, g.index, k), Dt(s, E.tokenIdx, E.contentPos, v), cA(n, r, e);
        continue t;
      }
      if (d) {
        if (n.length >= xn) return;
        n.push({
          tokenIdx: o,
          contentPos: g.index,
          isSingleQuote: I,
          level: l,
          prevSameQuoteIdx: I ? r.single : r.double
        }), I ? r.single = n.length - 1 : r.double = n.length - 1;
      } else u && I && Dt(s, o, g.index, uA);
    }
  }
  Object.keys(s).forEach(function(o) {
    let i = Number(o);
    t[i].content = Kn(t[i].content, s[o]);
  });
}
function vn(t) {
  if (t.md.options.typographer) for (let A = t.tokens.length - 1; A >= 0; A--) t.tokens[A].type !== "inline" || !_n.test(t.tokens[A].content) || Wn(t.tokens[A].children, t);
}
function Gn(t) {
  let A, e, n = t.length;
  for (A = 0; A < n; A++) t[A].type === "text_special" && (t[A].type = "text");
  for (A = e = 0; A < n; A++) t[A].type === "text" && A + 1 < n && t[A + 1].type === "text" ? t[A + 1].content = t[A].content + t[A + 1].content : (A !== e && (t[e] = t[A]), e++);
  A !== e && (t.length = e);
}
function Yn(t) {
  let A, e, n = t.tokens, r = n.length;
  for (let s = 0; s < r; s++) {
    if (n[s].type !== "inline") continue;
    let o = n[s].children, i = o.length;
    for (A = 0; A < i; A++) o[A].type === "text_special" && (o[A].type = "text"), o[A].children && Gn(o[A].children);
    for (A = e = 0; A < i; A++) o[A].type === "text" && A + 1 < i && o[A + 1].type === "text" ? o[A + 1].content = o[A].content + o[A + 1].content : (A !== e && (o[e] = o[A]), e++);
    A !== e && (o.length = e);
  }
}
var Yt = [
  ["normalize", pn],
  ["block", fn],
  ["strip_references", Cn],
  ["inline", mn],
  ["linkify", Fn],
  ["replacements", Qn],
  ["smartquotes", vn],
  ["text_join", Yn]
], HA = class {
  constructor() {
    p(this, "ruler", new pt()), p(this, "State", SA);
    for (let t = 0; t < Yt.length; t++) this.ruler.push(Yt[t][0], Yt[t][1]);
  }
  process(t) {
    let A = this.ruler.getRules("");
    for (let e = 0, n = A.length; e < n; e++) A[e](t);
  }
}, NA = class {
  constructor(t, A, e, n) {
    p(this, "bMarks", []), p(this, "eMarks", []), p(this, "tShift", []), p(this, "sCount", []), p(this, "bsCount", []), p(this, "blkIndent", 0), p(this, "line", 0), p(this, "lineMax", 0), p(this, "tight", !1), p(this, "listIndent", -1), p(this, "parentType", "root"), p(this, "level", 0), p(this, "Token", At), this.src = t, this.md = A, this.env = e, this.tokens = n;
    let r = this.src;
    for (let s = 0, o = 0, i = 0, l = 0, a = r.length, c = !1; o < a; o++) {
      let h = r.charCodeAt(o);
      if (!c) if (W(h)) {
        i++, h === 9 ? l += 4 - l % 4 : l++;
        continue;
      } else c = !0;
      (h === 10 || o === a - 1) && (h !== 10 && o++, this.bMarks.push(s), this.eMarks.push(o), this.tShift.push(i), this.sCount.push(l), this.bsCount.push(0), c = !1, i = 0, l = 0, s = o + 1);
    }
    this.bMarks.push(r.length), this.eMarks.push(r.length), this.tShift.push(0), this.sCount.push(0), this.bsCount.push(0), this.lineMax = this.bMarks.length - 1;
  }
  push(t, A, e) {
    let n = new At(t, A, e);
    return n.block = !0, e < 0 && this.level--, n.level = this.level, e > 0 && this.level++, this.tokens.push(n), n;
  }
  isEmpty(t) {
    return this.bMarks[t] + this.tShift[t] >= this.eMarks[t];
  }
  skipEmptyLines(t) {
    for (let A = this.lineMax; t < A && !(this.bMarks[t] + this.tShift[t] < this.eMarks[t]); t++) ;
    return t;
  }
  skipSpaces(t) {
    for (let A = this.src.length; t < A && W(this.src.charCodeAt(t)); t++) ;
    return t;
  }
  skipSpacesBack(t, A) {
    if (t <= A) return t;
    for (; t > A; ) if (!W(this.src.charCodeAt(--t))) return t + 1;
    return t;
  }
  skipChars(t, A) {
    for (let e = this.src.length; t < e && this.src.charCodeAt(t) === A; t++) ;
    return t;
  }
  skipCharsBack(t, A, e) {
    if (t <= e) return t;
    for (; t > e; ) if (A !== this.src.charCodeAt(--t)) return t + 1;
    return t;
  }
  getLines(t, A, e, n) {
    if (t >= A) return "";
    let r = Array(A - t);
    for (let s = 0, o = t; o < A; o++, s++) {
      let i = 0, l = this.bMarks[o], a = l, c;
      for (c = o + 1 < A || n ? this.eMarks[o] + 1 : this.eMarks[o]; a < c && i < e; ) {
        let h = this.src.charCodeAt(a);
        if (W(h)) h === 9 ? i += 4 - (i + this.bsCount[o]) % 4 : i++;
        else if (a - l < this.tShift[o]) i++;
        else break;
        a++;
      }
      i > e ? r[s] = Array(i - e + 1).join(" ") + this.src.slice(a, c) : r[s] = this.src.slice(a, c);
    }
    return r.join("");
  }
}, Zn = 65536;
function Zt(t, A) {
  let e = t.bMarks[A] + t.tShift[A], n = t.eMarks[A];
  return t.src.slice(e, n);
}
function hA(t) {
  let A = [], e = t.length, n = 0, r = t.charCodeAt(n), s = !1, o = 0, i = "";
  for (; n < e; ) r === 124 && (s ? (i += t.substring(o, n - 1), o = n) : (A.push(i + t.substring(o, n)), i = "", o = n + 1)), s = r === 92, n++, r = t.charCodeAt(n);
  return A.push(i + t.substring(o)), A;
}
function Jn(t, A, e, n) {
  if (A + 2 > e) return !1;
  let r = A + 1;
  if (t.sCount[r] < t.blkIndent || t.sCount[r] - t.blkIndent >= 4) return !1;
  let s = t.bMarks[r] + t.tShift[r];
  if (s >= t.eMarks[r]) return !1;
  let o = t.src.charCodeAt(s++);
  if (o !== 124 && o !== 45 && o !== 58 || s >= t.eMarks[r]) return !1;
  let i = t.src.charCodeAt(s++);
  if (i !== 124 && i !== 45 && i !== 58 && !W(i) || o === 45 && W(i)) return !1;
  for (; s < t.eMarks[r]; ) {
    let f = t.src.charCodeAt(s);
    if (f !== 124 && f !== 45 && f !== 58 && !W(f)) return !1;
    s++;
  }
  let l = Zt(t, A + 1), a = l.split("|"), c = [];
  for (let f = 0; f < a.length; f++) {
    let B = a[f].trim();
    if (!B) {
      if (f === 0 || f === a.length - 1) continue;
      return !1;
    }
    if (!/^:?-+:?$/.test(B)) return !1;
    B.charCodeAt(B.length - 1) === 58 ? c.push(B.charCodeAt(0) === 58 ? "center" : "right") : B.charCodeAt(0) === 58 ? c.push("left") : c.push("");
  }
  if (l = Zt(t, A).trim(), l.indexOf("|") === -1 || t.sCount[A] - t.blkIndent >= 4) return !1;
  a = hA(l), a.length && a[0] === "" && a.shift(), a.length && a[a.length - 1] === "" && a.pop();
  let h = a.length;
  if (h === 0 || h !== c.length) return !1;
  if (n) return !0;
  let g = t.parentType;
  t.parentType = "table";
  let d = t.md.block.ruler.getRules("blockquote"), u = t.push("table_open", "table", 1), I = [A, 0];
  u.map = I;
  let D = t.push("thead_open", "thead", 1);
  D.map = [A, A + 1];
  let F = t.push("tr_open", "tr", 1);
  F.map = [A, A + 1];
  for (let f = 0; f < a.length; f++) {
    let B = t.push("th_open", "th", 1);
    c[f] && (B.attrs = [["style", `text-align:${c[f]}`]]);
    let E = t.push("inline", "", 0);
    E.content = a[f].trim(), E.children = [], t.push("th_close", "th", -1);
  }
  t.push("tr_close", "tr", -1), t.push("thead_close", "thead", -1);
  let y, m = 0;
  for (r = A + 2; r < e && !(t.sCount[r] < t.blkIndent); r++) {
    let f = !1;
    for (let E = 0, v = d.length; E < v; E++) if (d[E](t, r, e, !0)) {
      f = !0;
      break;
    }
    if (f || (l = Zt(t, r).trim(), !l) || t.sCount[r] - t.blkIndent >= 4 || (a = hA(l), a.length && a[0] === "" && a.shift(), a.length && a[a.length - 1] === "" && a.pop(), m += h - a.length, m > Zn)) break;
    if (r === A + 2) {
      let E = t.push("tbody_open", "tbody", 1);
      E.map = y = [A + 2, 0];
    }
    let B = t.push("tr_open", "tr", 1);
    B.map = [r, r + 1];
    for (let E = 0; E < h; E++) {
      let v = t.push("td_open", "td", 1);
      c[E] && (v.attrs = [["style", `text-align:${c[E]}`]]);
      let k = t.push("inline", "", 0);
      k.content = a[E] ? a[E].trim() : "", k.children = [], t.push("td_close", "td", -1);
    }
    t.push("tr_close", "tr", -1);
  }
  return y && (t.push("tbody_close", "tbody", -1), y[1] = r), t.push("table_close", "table", -1), I[1] = r, t.parentType = g, t.line = r, !0;
}
function Sn(t, A, e) {
  if (t.sCount[A] - t.blkIndent < 4) return !1;
  let n = A + 1, r = n;
  for (; n < e; ) {
    if (t.isEmpty(n)) {
      n++;
      continue;
    }
    if (t.sCount[n] - t.blkIndent >= 4) {
      n++, r = n;
      continue;
    }
    break;
  }
  t.line = r;
  let s = t.push("code_block", "code", 0);
  return s.content = t.getLines(A, r, 4 + t.blkIndent, !1) + `
`, s.map = [A, t.line], !0;
}
function Rn(t, A, e, n) {
  let r = t.bMarks[A] + t.tShift[A], s = t.eMarks[A];
  if (t.sCount[A] - t.blkIndent >= 4 || r + 3 > s) return !1;
  let o = t.src.charCodeAt(r);
  if (o !== 126 && o !== 96) return !1;
  let i = r;
  r = t.skipChars(r, o);
  let l = r - i;
  if (l < 3) return !1;
  let a = t.src.slice(i, r), c = t.src.slice(r, s);
  if (o === 96 && c.indexOf(String.fromCharCode(o)) >= 0) return !1;
  if (n) return !0;
  let h = A, g = !1;
  for (; h++, !(h >= e || (r = i = t.bMarks[h] + t.tShift[h], s = t.eMarks[h], r < s && t.sCount[h] < t.blkIndent)); ) if (t.src.charCodeAt(r) === o && !(t.sCount[h] - t.blkIndent >= 4) && (r = t.skipChars(r, o), !(r - i < l) && (r = t.skipSpaces(r), !(r < s)))) {
    g = !0;
    break;
  }
  l = t.sCount[A], t.line = h + +!!g;
  let d = t.push("fence", "code", 0);
  return d.info = c, d.content = t.getLines(A + 1, h, l, !0), d.markup = a, d.map = [A, t.line], !0;
}
function Hn(t, A, e, n) {
  let r = t.bMarks[A] + t.tShift[A], s = t.eMarks[A], o = t.lineMax;
  if (t.sCount[A] - t.blkIndent >= 4 || t.src.charCodeAt(r) !== 62) return !1;
  if (n) return !0;
  let i = [], l = [], a = [], c = [], h = t.md.block.ruler.getRules("blockquote"), g = t.parentType;
  t.parentType = "blockquote";
  let d = !1, u;
  for (u = A; u < e; u++) {
    let m = t.sCount[u] < t.blkIndent;
    if (r = t.bMarks[u] + t.tShift[u], s = t.eMarks[u], r >= s) break;
    if (t.src.charCodeAt(r++) === 62 && !m) {
      let B = t.sCount[u] + 1, E, v;
      t.src.charCodeAt(r) === 32 ? (r++, B++, v = !1, E = !0) : t.src.charCodeAt(r) === 9 ? (E = !0, (t.bsCount[u] + B) % 4 == 3 ? (r++, B++, v = !1) : v = !0) : E = !1;
      let k = B;
      for (i.push(t.bMarks[u]), t.bMarks[u] = r; r < s; ) {
        let K = t.src.charCodeAt(r);
        if (W(K)) K === 9 ? k += 4 - (k + t.bsCount[u] + +!!v) % 4 : k++;
        else break;
        r++;
      }
      d = r >= s, l.push(t.bsCount[u]), t.bsCount[u] = t.sCount[u] + 1 + +!!E, a.push(t.sCount[u]), t.sCount[u] = k - B, c.push(t.tShift[u]), t.tShift[u] = r - t.bMarks[u];
      continue;
    }
    if (d) break;
    let f = !1;
    for (let B = 0, E = h.length; B < E; B++) if (h[B](t, u, e, !0)) {
      f = !0;
      break;
    }
    if (f) {
      t.lineMax = u, t.blkIndent !== 0 && (i.push(t.bMarks[u]), l.push(t.bsCount[u]), c.push(t.tShift[u]), a.push(t.sCount[u]), t.sCount[u] -= t.blkIndent);
      break;
    }
    i.push(t.bMarks[u]), l.push(t.bsCount[u]), c.push(t.tShift[u]), a.push(t.sCount[u]), t.sCount[u] = -1;
  }
  let I = t.blkIndent;
  t.blkIndent = 0;
  let D = t.push("blockquote_open", "blockquote", 1);
  D.markup = ">";
  let F = [A, 0];
  D.map = F, t.md.block.tokenize(t, A, u);
  let y = t.push("blockquote_close", "blockquote", -1);
  y.markup = ">", t.lineMax = o, t.parentType = g, F[1] = t.line;
  for (let m = 0; m < c.length; m++) t.bMarks[m + A] = i[m], t.tShift[m + A] = c[m], t.sCount[m + A] = a[m], t.bsCount[m + A] = l[m];
  return t.blkIndent = I, !0;
}
function Nn(t, A, e, n) {
  let r = t.eMarks[A];
  if (t.sCount[A] - t.blkIndent >= 4) return !1;
  let s = t.bMarks[A] + t.tShift[A], o = t.src.charCodeAt(s++);
  if (o !== 42 && o !== 45 && o !== 95) return !1;
  let i = 1;
  for (; s < r; ) {
    let a = t.src.charCodeAt(s++);
    if (a !== o && !W(a)) return !1;
    a === o && i++;
  }
  if (i < 3) return !1;
  if (n) return !0;
  t.line = A + 1;
  let l = t.push("hr", "hr", 0);
  return l.map = [A, t.line], l.markup = Array(i + 1).join(String.fromCharCode(o)), !0;
}
function dA(t, A) {
  let e = t.eMarks[A], n = t.bMarks[A] + t.tShift[A], r = t.src.charCodeAt(n++);
  return r !== 42 && r !== 45 && r !== 43 || n < e && !W(t.src.charCodeAt(n)) ? -1 : n;
}
function gA(t, A) {
  let e = t.bMarks[A] + t.tShift[A], n = t.eMarks[A], r = e;
  if (r + 1 >= n) return -1;
  let s = t.src.charCodeAt(r++);
  if (s < 48 || s > 57) return -1;
  for (; ; ) {
    if (r >= n) return -1;
    if (s = t.src.charCodeAt(r++), s >= 48 && s <= 57) {
      if (r - e >= 10) return -1;
      continue;
    }
    if (s === 41 || s === 46) break;
    return -1;
  }
  return r < n && (s = t.src.charCodeAt(r), !W(s)) ? -1 : r;
}
function Mn(t, A) {
  let e = t.level + 2;
  for (let n = A + 2, r = t.tokens.length - 2; n < r; n++) t.tokens[n].level === e && t.tokens[n].type === "paragraph_open" && (t.tokens[n + 2].hidden = !0, t.tokens[n].hidden = !0, n += 2);
}
function Un(t, A, e, n) {
  let r, s, o, i, l = A, a = !0;
  if (t.sCount[l] - t.blkIndent >= 4 || t.listIndent >= 0 && t.sCount[l] - t.listIndent >= 4 && t.sCount[l] < t.blkIndent) return !1;
  let c = !1;
  n && t.parentType === "paragraph" && t.sCount[l] >= t.blkIndent && (c = !0);
  let h, g, d;
  if ((d = gA(t, l)) >= 0) {
    if (h = !0, o = t.bMarks[l] + t.tShift[l], g = Number(t.src.slice(o, d - 1)), c && g !== 1) return !1;
  } else if ((d = dA(t, l)) >= 0) h = !1;
  else return !1;
  if (c && t.skipSpaces(d) >= t.eMarks[l]) return !1;
  if (n) return !0;
  let u = t.src.charCodeAt(d - 1), I = t.tokens.length;
  h ? (i = t.push("ordered_list_open", "ol", 1), g !== 1 && (i.attrs = [["start", g]])) : i = t.push("bullet_list_open", "ul", 1);
  let D = [l, 0];
  i.map = D, i.markup = String.fromCharCode(u);
  let F = !1, y = t.md.block.ruler.getRules("list"), m = t.parentType;
  for (t.parentType = "list"; l < e; ) {
    s = d, r = t.eMarks[l];
    let f = t.sCount[l] + d - (t.bMarks[l] + t.tShift[l]), B = f;
    for (; s < r; ) {
      let X = t.src.charCodeAt(s);
      if (X === 9) B += 4 - (B + t.bsCount[l]) % 4;
      else if (X === 32) B++;
      else break;
      s++;
    }
    let E = s, v;
    v = E >= r ? 1 : B - f, v > 4 && (v = 1);
    let k = f + v;
    i = t.push("list_item_open", "li", 1), i.markup = String.fromCharCode(u);
    let K = [l, 0];
    i.map = K, h && (i.info = t.src.slice(o, d - 1));
    let w = t.tight, Z = t.tShift[l], H = t.sCount[l], L = t.listIndent;
    if (t.listIndent = t.blkIndent, t.blkIndent = k, t.tight = !0, t.tShift[l] = E - t.bMarks[l], t.sCount[l] = B, E >= r && t.isEmpty(l + 1) ? t.line = Math.min(t.line + 2, e) : t.md.block.tokenize(t, l, e), (!t.tight || F) && (a = !1), F = t.line - l > 1 && t.isEmpty(t.line - 1), t.blkIndent = t.listIndent, t.listIndent = L, t.tShift[l] = Z, t.sCount[l] = H, t.tight = w, i = t.push("list_item_close", "li", -1), i.markup = String.fromCharCode(u), l = t.line, K[1] = l, l >= e || t.sCount[l] < t.blkIndent || t.sCount[l] - t.blkIndent >= 4) break;
    let ft = !1;
    for (let X = 0, Ct = y.length; X < Ct; X++) if (y[X](t, l, e, !0)) {
      ft = !0;
      break;
    }
    if (ft) break;
    if (h) {
      if (d = gA(t, l), d < 0) break;
      o = t.bMarks[l] + t.tShift[l];
    } else if (d = dA(t, l), d < 0) break;
    if (u !== t.src.charCodeAt(d - 1)) break;
  }
  return i = h ? t.push("ordered_list_close", "ol", -1) : t.push("bullet_list_close", "ul", -1), i.markup = String.fromCharCode(u), D[1] = l, t.line = l, t.parentType = m, a && Mn(t, I), !0;
}
function zn(t, A, e, n) {
  let r = t.bMarks[A] + t.tShift[A], s = t.eMarks[A], o = A + 1;
  if (t.sCount[A] - t.blkIndent >= 4 || t.src.charCodeAt(r) !== 91) return !1;
  function i(f) {
    let B = t.lineMax;
    if (f >= B || t.isEmpty(f)) return null;
    let E = !1;
    if (t.sCount[f] - t.blkIndent > 3 && (E = !0), t.sCount[f] < 0 && (E = !0), !E) {
      let K = t.md.block.ruler.getRules("reference"), w = t.parentType;
      t.parentType = "reference";
      let Z = !1;
      for (let H = 0, L = K.length; H < L; H++) if (K[H](t, f, B, !0)) {
        Z = !0;
        break;
      }
      if (t.parentType = w, Z) return null;
    }
    let v = t.bMarks[f] + t.tShift[f], k = t.eMarks[f];
    return t.src.slice(v, k + 1);
  }
  let l = t.src.slice(r, s + 1);
  s = l.length;
  let a = -1;
  for (r = 1; r < s; r++) {
    let f = l.charCodeAt(r);
    if (f === 91) return !1;
    if (f === 93) {
      a = r;
      break;
    }
    if (f === 10) {
      let B = i(o);
      B !== null && (l += B, s = l.length, o++);
    } else if (f === 92 && (r++, r < s && l.charCodeAt(r) === 10)) {
      let B = i(o);
      B !== null && (l += B, s = l.length, o++);
    }
  }
  if (a < 0 || l.charCodeAt(a + 1) !== 58) return !1;
  for (r = a + 2; r < s; r++) {
    let f = l.charCodeAt(r);
    if (f === 10) {
      let B = i(o);
      B !== null && (l += B, s = l.length, o++);
    } else if (!W(f)) break;
  }
  let c = t.md.helpers.parseLinkDestination(l, r, s);
  if (!c.ok) return !1;
  let h = t.md.normalizeLink(c.str);
  if (!t.md.validateLink(h)) return !1;
  r = c.pos;
  let g = r, d = o, u = r;
  for (; r < s; r++) {
    let f = l.charCodeAt(r);
    if (f === 10) {
      let B = i(o);
      B !== null && (l += B, s = l.length, o++);
    } else if (!W(f)) break;
  }
  let I = t.md.helpers.parseLinkTitle(l, r, s);
  for (; I.can_continue; ) {
    let f = i(o);
    if (f === null) break;
    l += f, r = s, s = l.length, o++, I = t.md.helpers.parseLinkTitle(l, r, s, I);
  }
  let D;
  for (r < s && u !== r && I.ok ? (D = I.str, r = I.pos) : (D = "", r = g, o = d); r < s && W(l.charCodeAt(r)); ) r++;
  if (r < s && l.charCodeAt(r) !== 10 && D) for (D = "", r = g, o = d; r < s && W(l.charCodeAt(r)); ) r++;
  if (r < s && l.charCodeAt(r) !== 10) return !1;
  let F = Kt(l.slice(1, a));
  if (!F) return !1;
  if (n) return !0;
  t.env.references === void 0 && (t.env.references = {}), t.env.references[F] === void 0 && (t.env.references[F] = {
    title: D,
    href: h
  });
  let y = t.push("reference_definition", "", 0);
  y.map = [A, o], y.hidden = !0;
  let m = /* @__PURE__ */ Object.create(null);
  return m.label = F, y.meta = m, t.line = o, !0;
}
var Ln = /* @__PURE__ */ "address.article.aside.base.basefont.blockquote.body.caption.center.col.colgroup.dd.details.dialog.dir.div.dl.dt.fieldset.figcaption.figure.footer.form.frame.frameset.h1.h2.h3.h4.h5.h6.head.header.hr.html.iframe.legend.li.link.main.menu.menuitem.nav.noframes.ol.optgroup.option.p.param.search.section.summary.table.tbody.td.tfoot.th.thead.title.tr.track.ul".split("."), MA = `<[A-Za-z][A-Za-z0-9\\-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*"))?)*\\s*\\/?>`, UA = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>", Xn = RegExp(`^(?:${MA}|${UA}|<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->|<[?][\\s\\S]*?[?]>|<![A-Za-z][^>]*>|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>)`), On = RegExp(`^(?:${MA}|${UA})`), $ = [
  [
    /^<(script|pre|style|textarea)(?=(\s|>|$))/i,
    /<\/(script|pre|style|textarea)>/i,
    !0
  ],
  [
    /^<!--/,
    /-->/,
    !0
  ],
  [
    /^<\?/,
    /\?>/,
    !0
  ],
  [
    /^<![A-Za-z]/,
    />/,
    !0
  ],
  [
    /^<!\[CDATA\[/,
    /\]\]>/,
    !0
  ],
  [
    RegExp(`^</?(${Ln.join("|")})(?=(\\s|/?>|$))`, "i"),
    /^$/,
    !0
  ],
  [
    RegExp(`${On.source}\\s*$`),
    /^$/,
    !1
  ]
];
function jn(t, A, e, n) {
  let r = t.bMarks[A] + t.tShift[A], s = t.eMarks[A];
  if (t.sCount[A] - t.blkIndent >= 4 || !t.md.options.html || t.src.charCodeAt(r) !== 60) return !1;
  let o = t.src.slice(r, s), i = 0;
  for (; i < $.length && !$[i][0].test(o); i++) ;
  if (i === $.length) return !1;
  if (n) return $[i][2];
  let l = A + 1, a = $[i][1].test("");
  if (!$[i][1].test(o)) {
    for (; l < e && !(t.sCount[l] < t.blkIndent && (a || !t.isEmpty(l))); l++) if (r = t.bMarks[l] + t.tShift[l], s = t.eMarks[l], o = t.src.slice(r, s), $[i][1].test(o)) {
      o.length !== 0 && l++;
      break;
    }
  }
  t.line = l;
  let c = t.push("html_block", "", 0);
  return c.map = [A, l], c.content = t.getLines(A, l, t.blkIndent, !0), !0;
}
function Vn(t, A, e, n) {
  let r = t.bMarks[A] + t.tShift[A], s = t.eMarks[A];
  if (t.sCount[A] - t.blkIndent >= 4) return !1;
  let o = t.src.charCodeAt(r);
  if (o !== 35 || r >= s) return !1;
  let i = 1;
  for (o = t.src.charCodeAt(++r); o === 35 && r < s && i <= 6; ) i++, o = t.src.charCodeAt(++r);
  if (i > 6 || r < s && !W(o)) return !1;
  if (n) return !0;
  s = t.skipSpacesBack(s, r);
  let l = t.skipCharsBack(s, 35, r);
  l > r && W(t.src.charCodeAt(l - 1)) && (s = l), t.line = A + 1;
  let a = t.push("heading_open", `h${i}`, 1);
  a.markup = "########".slice(0, i), a.map = [A, t.line];
  let c = t.push("inline", "", 0);
  c.content = Wt(t.src.slice(r, s)), c.map = [A, t.line], c.children = [];
  let h = t.push("heading_close", `h${i}`, -1);
  return h.markup = "########".slice(0, i), !0;
}
function Pn(t, A, e) {
  let n = t.md.block.ruler.getRules("paragraph");
  if (t.sCount[A] - t.blkIndent >= 4) return !1;
  let r = t.parentType;
  t.parentType = "paragraph";
  let s = 0, o, i = A + 1;
  for (; i < e && !t.isEmpty(i); i++) {
    if (t.sCount[i] - t.blkIndent > 3) continue;
    if (t.sCount[i] >= t.blkIndent) {
      let d = t.bMarks[i] + t.tShift[i], u = t.eMarks[i];
      if (d < u && (o = t.src.charCodeAt(d), (o === 45 || o === 61) && (d = t.skipChars(d, o), d = t.skipSpaces(d), d >= u))) {
        s = o === 61 ? 1 : 2;
        break;
      }
    }
    if (t.sCount[i] < 0) continue;
    let g = !1;
    for (let d = 0, u = n.length; d < u; d++) if (n[d](t, i, e, !0)) {
      g = !0;
      break;
    }
    if (g) break;
  }
  if (!s) return t.parentType = r, !1;
  let l = Wt(t.getLines(A, i, t.blkIndent, !1));
  t.line = i + 1;
  let a = t.push("heading_open", `h${s}`, 1);
  a.markup = String.fromCharCode(o), a.map = [A, t.line];
  let c = t.push("inline", "", 0);
  c.content = l, c.map = [A, t.line - 1], c.children = [];
  let h = t.push("heading_close", `h${s}`, -1);
  return h.markup = String.fromCharCode(o), t.parentType = r, !0;
}
function Tn(t, A, e) {
  let n = t.md.block.ruler.getRules("paragraph"), r = t.parentType, s = A + 1;
  for (t.parentType = "paragraph"; s < e && !t.isEmpty(s); s++) {
    if (t.sCount[s] - t.blkIndent > 3 || t.sCount[s] < 0) continue;
    let a = !1;
    for (let c = 0, h = n.length; c < h; c++) if (n[c](t, s, e, !0)) {
      a = !0;
      break;
    }
    if (a) break;
  }
  let o = Wt(t.getLines(A, s, t.blkIndent, !1));
  t.line = s;
  let i = t.push("paragraph_open", "p", 1);
  i.map = [A, t.line];
  let l = t.push("inline", "", 0);
  return l.content = o, l.map = [A, t.line], l.children = [], t.push("paragraph_close", "p", -1), t.parentType = r, !0;
}
var It = [
  [
    "table",
    Jn,
    ["paragraph", "reference"]
  ],
  ["code", Sn],
  [
    "fence",
    Rn,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "blockquote",
    Hn,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "hr",
    Nn,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "list",
    Un,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  ["reference", zn],
  [
    "html_block",
    jn,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  [
    "heading",
    Vn,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  ["lheading", Pn],
  ["paragraph", Tn]
], zA = class {
  constructor() {
    p(this, "ruler", new pt()), p(this, "State", NA);
    for (let t = 0; t < It.length; t++) this.ruler.push(It[t][0], It[t][1], { alt: (It[t][2] || []).slice() });
  }
  tokenize(t, A, e) {
    let n = this.ruler.getRules(""), r = n.length, s = t.md.options.maxNesting, o = A, i = !1;
    for (; o < e && (t.line = o = t.skipEmptyLines(o), !(o >= e || t.sCount[o] < t.blkIndent)); ) {
      if (t.level >= s) {
        t.line = e;
        break;
      }
      let l = t.line, a = !1;
      for (let c = 0; c < r; c++) if (a = n[c](t, o, e, !1), a) {
        if (l >= t.line) throw Error("block rule didn't increment state.line");
        break;
      }
      if (!a) throw Error("none of the block rules matched");
      t.tight = !i, t.isEmpty(t.line - 1) && (i = !0), o = t.line, o < e && t.isEmpty(o) && (i = !0, o++, t.line = o);
    }
  }
  parse(t, A, e, n) {
    if (!t) return;
    let r = new this.State(t, A, e, n);
    this.tokenize(r, r.line, r.lineMax);
  }
}, LA = class {
  constructor(t, A, e, n) {
    p(this, "pos", 0), p(this, "level", 0), p(this, "pending", ""), p(this, "pendingLevel", 0), p(this, "cache", {}), p(this, "backticks", {}), p(this, "backticksScanned", !1), p(this, "linkLevel", 0), p(this, "delimiters", []), p(this, "_prev_delimiters", []), p(this, "Token", At), this.src = t, this.env = e, this.md = A, this.tokens = n, this.tokens_meta = Array(n.length), this.posMax = this.src.length;
  }
  pushPending() {
    let t = new At("text", "", 0);
    return t.content = this.pending, t.level = this.pendingLevel, this.tokens.push(t), this.pending = "", t;
  }
  push(t, A, e) {
    this.pending && this.pushPending();
    let n = new At(t, A, e), r;
    return e < 0 && (this.level--, this.delimiters = this._prev_delimiters.pop()), n.level = this.level, e > 0 && (this.level++, this._prev_delimiters.push(this.delimiters), this.delimiters = [], r = { delimiters: this.delimiters }), this.pendingLevel = this.level, this.tokens.push(n), this.tokens_meta.push(r), n;
  }
  scanDelims(t, A) {
    let e = this.posMax, n = this.src.charCodeAt(t), r;
    if (t === 0) r = 32;
    else if (t === 1) r = this.src.charCodeAt(0), (r & 63488) == 55296 && (r = 65533);
    else if (r = this.src.charCodeAt(t - 1), (r & 64512) == 56320) {
      let u = this.src.charCodeAt(t - 2);
      r = (u & 64512) == 55296 ? 65536 + (u - 55296 << 10) + (r - 56320) : 65533;
    } else (r & 64512) == 55296 && (r = 65533);
    let s = t;
    for (; s < e && this.src.charCodeAt(s) === n; ) s++;
    let o = s - t, i = s < e ? this.src.charCodeAt(s) : 32;
    if ((i & 64512) == 55296) {
      let u = this.src.charCodeAt(s + 1);
      i = (u & 64512) == 56320 ? 65536 + (i - 55296 << 10) + (u - 56320) : 65533;
    } else (i & 64512) == 56320 && (i = 65533);
    let l = gt(r) || dt(r), a = gt(i) || dt(i), c = ht(r), h = ht(i), g = !h && (!a || c || l), d = !c && (!l || h || a);
    return {
      can_open: g && (A || !d || l),
      can_close: d && (A || !g || a),
      length: o
    };
  }
};
function qn(t) {
  switch (t) {
    case 10:
    case 33:
    case 35:
    case 36:
    case 37:
    case 38:
    case 42:
    case 43:
    case 45:
    case 58:
    case 60:
    case 61:
    case 62:
    case 64:
    case 91:
    case 92:
    case 93:
    case 94:
    case 95:
    case 96:
    case 123:
    case 125:
    case 126:
      return !0;
    default:
      return !1;
  }
}
function $n(t, A) {
  let e = t.pos;
  for (; e < t.posMax && !qn(t.src.charCodeAt(e)); ) e++;
  return e !== t.pos && (A || (t.pending += t.src.slice(t.pos, e)), t.pos = e, !0);
}
function tr(t) {
  return t >= 65 && t <= 90 || t >= 97 && t <= 122;
}
function Ar(t) {
  return t >= 65 && t <= 90 || t >= 97 && t <= 122 || t >= 48 && t <= 57 || t === 43 || t === 45 || t === 46;
}
function er(t, A) {
  if (!t.md.options.linkify || t.linkLevel > 0) return !1;
  let e = t.pos, n = t.posMax;
  if (e + 3 > n || t.src.charCodeAt(e) !== 58 || t.src.charCodeAt(e + 1) !== 47 || t.src.charCodeAt(e + 2) !== 47) return !1;
  let r = e - Math.min(10, t.pending.length, e), s = e;
  for (; s > r && Ar(t.src.charCodeAt(s - 1)); ) s--;
  if (s === e || !tr(t.src.charCodeAt(s))) return !1;
  let o = e - s, i = t.md.linkify.matchAtStart(t.src.slice(s));
  if (!i) return !1;
  let l = i.url;
  if (l.length <= o) return !1;
  let a = l.length;
  for (; a > 0 && l.charCodeAt(a - 1) === 42; ) a--;
  a !== l.length && (l = l.slice(0, a));
  let c = t.md.normalizeLink(l);
  if (!t.md.validateLink(c)) return !1;
  if (!A) {
    t.pending = t.pending.slice(0, -o);
    let h = t.push("link_open", "a", 1);
    h.attrs = [["href", c]], h.markup = "linkify", h.info = "auto";
    let g = t.push("text", "", 0);
    g.content = t.md.normalizeLinkText(l);
    let d = t.push("link_close", "a", -1);
    d.markup = "linkify", d.info = "auto";
  }
  return t.pos += l.length - o, !0;
}
function nr(t, A) {
  let e = t.pos;
  if (t.src.charCodeAt(e) !== 10) return !1;
  let n = t.pending.length - 1, r = t.posMax;
  if (!A) if (n >= 0 && t.pending.charCodeAt(n) === 32) if (n >= 1 && t.pending.charCodeAt(n - 1) === 32) {
    let s = n - 1;
    for (; s >= 1 && t.pending.charCodeAt(s - 1) === 32; ) s--;
    t.pending = t.pending.slice(0, s), t.push("hardbreak", "br", 0);
  } else t.pending = t.pending.slice(0, -1), t.push("softbreak", "br", 0);
  else t.push("softbreak", "br", 0);
  for (e++; e < r && W(t.src.charCodeAt(e)); ) e++;
  return t.pos = e, !0;
}
var Pt = [];
for (let t = 0; t < 256; t++) Pt.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(t) {
  Pt[t.charCodeAt(0)] = 1;
});
function rr(t, A) {
  let e = t.pos, n = t.posMax;
  if (t.src.charCodeAt(e) !== 92 || (e++, e >= n)) return !1;
  let r = t.src.charCodeAt(e);
  if (r === 10) {
    for (A || t.push("hardbreak", "br", 0), e++; e < n && (r = t.src.charCodeAt(e), W(r)); ) e++;
    return t.pos = e, !0;
  }
  if (r === 32) {
    if (!A) {
      let i = t.push("text_special", "", 0);
      i.content = "\\", i.markup = "\\", i.info = "escape";
    }
    return t.pos = e, !0;
  }
  let s = t.src[e];
  if (r >= 55296 && r <= 56319 && e + 1 < n) {
    let i = t.src.charCodeAt(e + 1);
    i >= 56320 && i <= 57343 && (s += t.src[e + 1], e++);
  }
  let o = "\\" + s;
  if (!A) {
    let i = t.push("text_special", "", 0);
    i.content = r < 256 && Pt[r] !== 0 ? s : o, i.markup = o, i.info = "escape";
  }
  return t.pos = e + 1, !0;
}
function sr(t) {
  let A = {}, e = 0;
  for (; (e = t.indexOf("`", e)) !== -1; ) {
    let n = e;
    for (; t.charCodeAt(++e) === 96; ) ;
    A[e - n] = n;
  }
  return A;
}
function ir(t, A) {
  var e;
  let n = t.pos;
  if (t.src.charCodeAt(n) !== 96) return !1;
  let r = t.posMax, s = n + 1;
  for (; s < r && t.src.charCodeAt(s) === 96; ) s++;
  let o = t.src.slice(n, s), i = o.length;
  if (t.backticksScanned || (t.backticks = sr(t.src), t.backticksScanned = !0), ((e = t.backticks[i]) == null ? -1 : e) >= s) {
    let l = s, a;
    for (; (a = t.src.indexOf("`", l)) !== -1 && a < r; ) {
      for (l = a + 1; t.src.charCodeAt(l) === 96; ) l++;
      if (l > r) break;
      if (l - a === i) {
        if (!A) {
          let c = t.push("code_inline", "code", 0);
          c.markup = o;
          let h = t.src.slice(s, a).replace(/\n/g, " ");
          h.startsWith(" ") && h.endsWith(" ") && /[^ ]/.test(h) && (h = h.slice(1, -1)), c.content = h;
        }
        return t.pos = l, !0;
      }
    }
  }
  return A || (t.pending += o), t.pos = s, !0;
}
function or(t, A) {
  let e = t.pos, n = t.src.charCodeAt(e);
  if (A || n !== 126) return !1;
  let r = t.scanDelims(t.pos, !0), s = r.length, o = String.fromCharCode(n);
  if (s < 2) return !1;
  let i;
  s % 2 && (i = t.push("text", "", 0), i.content = o, s--);
  for (let l = 0; l < s; l += 2) i = t.push("text", "", 0), i.content = o + o, t.delimiters.push({
    marker: n,
    length: 0,
    token: t.tokens.length - 1,
    end: -1,
    open: r.can_open,
    close: r.can_close
  });
  return t.pos += r.length, !0;
}
function pA(t, A) {
  let e, n = [], r = A.length;
  for (let s = 0; s < r; s++) {
    let o = A[s];
    if (o.marker !== 126 || o.end === -1) continue;
    let i = A[o.end];
    e = t.tokens[o.token], e.type = "s_open", e.tag = "s", e.nesting = 1, e.markup = "~~", e.content = "", e = t.tokens[i.token], e.type = "s_close", e.tag = "s", e.nesting = -1, e.markup = "~~", e.content = "", t.tokens[i.token - 1].type === "text" && t.tokens[i.token - 1].content === "~" && n.push(i.token - 1);
  }
  for (; n.length; ) {
    let s = n.pop(), o = s + 1;
    for (; o < t.tokens.length && t.tokens[o].type === "s_close"; ) o++;
    o--, s !== o && (e = t.tokens[o], t.tokens[o] = t.tokens[s], t.tokens[s] = e);
  }
}
function lr(t) {
  let A = t.tokens_meta, e = t.tokens_meta.length;
  pA(t, t.delimiters);
  for (let r = 0; r < e; r++) {
    var n;
    let s = (n = A[r]) == null ? void 0 : n.delimiters;
    s && pA(t, s);
  }
}
var XA = {
  tokenize: or,
  postProcess: lr
};
function ar(t, A) {
  let e = t.pos, n = t.src.charCodeAt(e);
  if (A || n !== 95 && n !== 42) return !1;
  let r = t.scanDelims(t.pos, n === 42);
  for (let s = 0; s < r.length; s++) {
    let o = t.push("text", "", 0);
    o.content = String.fromCharCode(n), t.delimiters.push({
      marker: n,
      length: r.length,
      token: t.tokens.length - 1,
      end: -1,
      open: r.can_open,
      close: r.can_close
    });
  }
  return t.pos += r.length, !0;
}
function fA(t, A) {
  let e = A.length;
  for (let n = e - 1; n >= 0; n--) {
    let r = A[n];
    if (r.marker !== 95 && r.marker !== 42 || r.end === -1) continue;
    let s = A[r.end], o = n > 0 && A[n - 1].end === r.end + 1 && A[n - 1].marker === r.marker && A[n - 1].token === r.token - 1 && A[r.end + 1].token === s.token + 1, i = String.fromCharCode(r.marker), l = t.tokens[r.token];
    l.type = o ? "strong_open" : "em_open", l.tag = o ? "strong" : "em", l.nesting = 1, l.markup = o ? i + i : i, l.content = "";
    let a = t.tokens[s.token];
    a.type = o ? "strong_close" : "em_close", a.tag = o ? "strong" : "em", a.nesting = -1, a.markup = o ? i + i : i, a.content = "", o && (t.tokens[A[n - 1].token].content = "", t.tokens[A[r.end + 1].token].content = "", n--);
  }
}
function ur(t) {
  let A = t.tokens_meta, e = t.tokens_meta.length;
  fA(t, t.delimiters);
  for (let r = 0; r < e; r++) {
    var n;
    let s = (n = A[r]) == null ? void 0 : n.delimiters;
    s && fA(t, s);
  }
}
var OA = {
  tokenize: ar,
  postProcess: ur
};
function cr(t, A) {
  let e, n, r, s, o = "", i = "", l = t.pos, a = !0;
  if (t.src.charCodeAt(t.pos) !== 91) return !1;
  let c = t.pos, h = t.posMax, g = t.pos + 1, d = t.md.helpers.parseLinkLabel(t, t.pos, !0);
  if (d < 0) return !1;
  let u = d + 1;
  if (u < h && t.src.charCodeAt(u) === 40) {
    for (a = !1, u++; u < h && (e = t.src.charCodeAt(u), !(!W(e) && e !== 10)); u++) ;
    if (u >= h) return !1;
    if (l = u, r = t.md.helpers.parseLinkDestination(t.src, u, t.posMax), r.ok) {
      for (o = t.md.normalizeLink(r.str), t.md.validateLink(o) ? u = r.pos : o = "", l = u; u < h && (e = t.src.charCodeAt(u), !(!W(e) && e !== 10)); u++) ;
      if (r = t.md.helpers.parseLinkTitle(t.src, u, t.posMax), u < h && l !== u && r.ok) for (i = r.str, u = r.pos; u < h && (e = t.src.charCodeAt(u), !(!W(e) && e !== 10)); u++) ;
    }
    (u >= h || t.src.charCodeAt(u) !== 41) && (a = !0), u++;
  }
  if (a) {
    if (t.env.references === void 0) return !1;
    if (u < h && t.src.charCodeAt(u) === 91 ? (l = u + 1, u = t.md.helpers.parseLinkLabel(t, u), u >= 0 ? n = t.src.slice(l, u++) : u = d + 1) : u = d + 1, n || (n = t.src.slice(g, d)), n = Kt(n), s = t.env.references[n], !s) return t.pos = c, !1;
    o = s.href, i = s.title;
  }
  if (!A) {
    t.pos = g, t.posMax = d;
    let I = t.push("link_open", "a", 1), D = [["href", o]];
    if (I.attrs = D, i && D.push(["title", i]), n) {
      let F = /* @__PURE__ */ Object.create(null);
      F.label = n, I.meta = F;
    }
    t.linkLevel++, t.md.inline.tokenize(t), t.linkLevel--, t.push("link_close", "a", -1);
  }
  return t.pos = u, t.posMax = h, !0;
}
function hr(t, A) {
  let e, n, r, s, o, i, l, a, c = "", h = t.pos, g = t.posMax;
  if (t.src.charCodeAt(t.pos) !== 33 || t.src.charCodeAt(t.pos + 1) !== 91) return !1;
  let d = t.pos + 2, u = t.md.helpers.parseLinkLabel(t, t.pos + 1, !1);
  if (u < 0) return !1;
  if (s = u + 1, s < g && t.src.charCodeAt(s) === 40) {
    for (s++; s < g && (e = t.src.charCodeAt(s), !(!W(e) && e !== 10)); s++) ;
    if (s >= g) return !1;
    for (a = s, i = t.md.helpers.parseLinkDestination(t.src, s, t.posMax), i.ok && (c = t.md.normalizeLink(i.str), t.md.validateLink(c) ? s = i.pos : c = ""), a = s; s < g && (e = t.src.charCodeAt(s), !(!W(e) && e !== 10)); s++) ;
    if (i = t.md.helpers.parseLinkTitle(t.src, s, t.posMax), s < g && a !== s && i.ok) for (l = i.str, s = i.pos; s < g && (e = t.src.charCodeAt(s), !(!W(e) && e !== 10)); s++) ;
    else l = "";
    if (s >= g || t.src.charCodeAt(s) !== 41) return t.pos = h, !1;
    s++;
  } else {
    if (t.env.references === void 0) return !1;
    if (s < g && t.src.charCodeAt(s) === 91 ? (a = s + 1, s = t.md.helpers.parseLinkLabel(t, s), s >= 0 ? r = t.src.slice(a, s++) : s = u + 1) : s = u + 1, r || (r = t.src.slice(d, u)), r = Kt(r), o = t.env.references[r], !o) return t.pos = h, !1;
    c = o.href, l = o.title;
  }
  if (!A) {
    n = t.src.slice(d, u);
    let I = [];
    t.md.inline.parse(n, t.md, t.env, I);
    let D = t.push("image", "img", 0), F = [["src", c], ["alt", ""]];
    if (D.attrs = F, D.children = I, D.content = n, l && F.push(["title", l]), r) {
      let y = /* @__PURE__ */ Object.create(null);
      y.label = r, D.meta = y;
    }
  }
  return t.pos = s, t.posMax = g, !0;
}
var dr = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/, gr = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function pr(t, A) {
  let e = t.pos;
  if (t.src.charCodeAt(e) !== 60) return !1;
  let n = t.pos, r = t.posMax;
  for (; ; ) {
    if (++e >= r) return !1;
    let o = t.src.charCodeAt(e);
    if (o === 60) return !1;
    if (o === 62) break;
  }
  let s = t.src.slice(n + 1, e);
  if (gr.test(s)) {
    let o = t.md.normalizeLink(s);
    if (!t.md.validateLink(o)) return !1;
    if (!A) {
      let i = t.push("link_open", "a", 1);
      i.attrs = [["href", o]], i.markup = "autolink", i.info = "auto";
      let l = t.push("text", "", 0);
      l.content = t.md.normalizeLinkText(s);
      let a = t.push("link_close", "a", -1);
      a.markup = "autolink", a.info = "auto";
    }
    return t.pos += s.length + 2, !0;
  }
  if (dr.test(s)) {
    let o = t.md.normalizeLink(`mailto:${s}`);
    if (!t.md.validateLink(o)) return !1;
    if (!A) {
      let i = t.push("link_open", "a", 1);
      i.attrs = [["href", o]], i.markup = "autolink", i.info = "auto";
      let l = t.push("text", "", 0);
      l.content = t.md.normalizeLinkText(s);
      let a = t.push("link_close", "a", -1);
      a.markup = "autolink", a.info = "auto";
    }
    return t.pos += s.length + 2, !0;
  }
  return !1;
}
function fr(t) {
  return /^<a[>\s]/i.test(t);
}
function Cr(t) {
  return /^<\/a\s*>/i.test(t);
}
function mr(t) {
  let A = t | 32;
  return A >= 97 && A <= 122;
}
function Dr(t, A) {
  if (!t.md.options.html) return !1;
  let e = t.posMax, n = t.pos;
  if (t.src.charCodeAt(n) !== 60 || n + 2 >= e) return !1;
  let r = t.src.charCodeAt(n + 1);
  if (r !== 33 && r !== 63 && r !== 47 && !mr(r)) return !1;
  let s = t.src.slice(n).match(Xn);
  if (!s) return !1;
  if (!A) {
    let o = t.push("html_inline", "", 0);
    o.content = s[0], fr(o.content) && t.linkLevel++, Cr(o.content) && t.linkLevel--;
  }
  return t.pos += s[0].length, !0;
}
var Ir = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i, Fr = /^&([a-z][a-z0-9]{1,31});/i;
function Br(t, A) {
  let e = t.pos, n = t.posMax;
  if (t.src.charCodeAt(e) !== 38 || e + 1 >= n) return !1;
  if (t.src.charCodeAt(e + 1) === 35) {
    let r = t.src.slice(e).match(Ir);
    if (r) {
      if (!A) {
        let s = r[1][0].toLowerCase() === "x" ? parseInt(r[1].slice(1), 16) : parseInt(r[1], 10), o = t.push("text_special", "", 0);
        o.content = Vt(s) ? ct(s) : ct(65533), o.markup = r[0], o.info = "entity";
      }
      return t.pos += r[0].length, !0;
    }
  } else {
    let r = t.src.slice(e).match(Fr);
    if (r) {
      let s = vA(r[0]);
      if (s !== r[0]) {
        if (!A) {
          let o = t.push("text_special", "", 0);
          o.content = s, o.markup = r[0], o.info = "entity";
        }
        return t.pos += r[0].length, !0;
      }
    }
  }
  return !1;
}
function CA(t) {
  let A = {}, e = t.length;
  if (!e) return;
  let n = 0, r = -2, s = [];
  for (let o = 0; o < e; o++) {
    let i = t[o];
    if (s.push(0), (t[n].marker !== i.marker || r !== i.token - 1) && (n = o), r = i.token, i.length = i.length || 0, !i.close) continue;
    A.hasOwnProperty(i.marker) || (A[i.marker] = [
      -1,
      -1,
      -1,
      -1,
      -1,
      -1
    ]);
    let l = A[i.marker][(i.open ? 3 : 0) + i.length % 3], a = n - s[n] - 1, c = a;
    for (; a > l; a -= s[a] + 1) {
      let h = t[a];
      if (h.marker === i.marker && h.open && h.end < 0) {
        let g = !1;
        if ((h.close || i.open) && (h.length + i.length) % 3 == 0 && (h.length % 3 != 0 || i.length % 3 != 0) && (g = !0), !g) {
          let d = a > 0 && !t[a - 1].open ? s[a - 1] + 1 : 0;
          s[o] = o - a + d, s[a] = d, i.open = !1, h.end = o, h.close = !1, c = -1, r = -2;
          break;
        }
      }
    }
    c !== -1 && (A[i.marker][(i.open ? 3 : 0) + (i.length || 0) % 3] = c);
  }
}
function kr(t) {
  let A = t.tokens_meta, e = t.tokens_meta.length;
  CA(t.delimiters);
  for (let r = 0; r < e; r++) {
    var n;
    let s = (n = A[r]) == null ? void 0 : n.delimiters;
    s && CA(s);
  }
}
function yr(t) {
  let A, e, n = 0, r = t.tokens, s = t.tokens.length;
  for (A = e = 0; A < s; A++) r[A].nesting < 0 && n--, r[A].level = n, r[A].nesting > 0 && n++, r[A].type === "text" && A + 1 < s && r[A + 1].type === "text" ? r[A + 1].content = r[A].content + r[A + 1].content : (A !== e && (r[e] = r[A]), e++);
  A !== e && (r.length = e);
}
var Jt = [
  ["text", $n],
  ["linkify", er],
  ["newline", nr],
  ["escape", rr],
  ["backticks", ir],
  ["strikethrough", XA.tokenize],
  ["emphasis", OA.tokenize],
  ["link", cr],
  ["image", hr],
  ["autolink", pr],
  ["html_inline", Dr],
  ["entity", Br]
], St = [
  ["balance_pairs", kr],
  ["strikethrough", XA.postProcess],
  ["emphasis", OA.postProcess],
  ["fragments_join", yr]
], jA = class {
  constructor() {
    p(this, "ruler", new pt()), p(this, "ruler2", new pt()), p(this, "State", LA);
    for (let t = 0; t < Jt.length; t++) this.ruler.push(Jt[t][0], Jt[t][1]);
    for (let t = 0; t < St.length; t++) this.ruler2.push(St[t][0], St[t][1]);
  }
  skipToken(t) {
    let A = t.pos, e = this.ruler.getRules(""), n = e.length, r = t.md.options.maxNesting, s = t.cache;
    if (s[A] !== void 0) {
      t.pos = s[A];
      return;
    }
    let o = !1;
    if (t.level < r) {
      for (let i = 0; i < n; i++) if (t.level++, o = e[i](t, !0), t.level--, o) {
        if (A >= t.pos) throw Error("inline rule didn't increment state.pos");
        break;
      }
    } else t.pos = t.posMax;
    o || t.pos++, s[A] = t.pos;
  }
  tokenize(t) {
    let A = this.ruler.getRules(""), e = A.length, n = t.posMax, r = t.md.options.maxNesting;
    for (; t.pos < n; ) {
      let s = t.pos, o = !1;
      if (t.level < r) {
        for (let i = 0; i < e; i++) if (o = A[i](t, !1), o) {
          if (s >= t.pos) throw Error("inline rule didn't increment state.pos");
          break;
        }
      }
      if (o) {
        if (t.pos >= n) break;
        continue;
      }
      t.pending += t.src[t.pos++];
    }
    t.pending && t.pushPending();
  }
  parse(t, A, e, n) {
    let r = new this.State(t, A, e, n);
    this.tokenize(r);
    let s = this.ruler2.getRules(""), o = s.length;
    for (let i = 0; i < o; i++) s[i](r);
  }
}, br = class {
  constructor(t = {}) {
    p(this, "src_Any", _A.source), p(this, "src_Cc", xA.source), p(this, "src_Z", WA.source), p(this, "src_P", jt.source), p(this, "src_ZPCc", [
      this.src_Z,
      this.src_P,
      this.src_Cc
    ].join("|")), p(this, "src_ZCc", [this.src_Z, this.src_Cc].join("|")), p(this, "cache", {}), p(this, "opts", {
      maxLength: 1e4,
      urlAuth: !1,
      schema_names: []
    }), this.opts = {
      ...this.opts,
      ...t
    };
  }
  set(t = {}) {
    return this.opts = {
      ...this.opts,
      ...t
    }, this.cache = {}, this;
  }
  escapeRE(t) {
    return t.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
  }
  nestedPairRE(t, A, e = 4) {
    let n = this.escapeRE(t), r = this.escapeRE(A), s = `(?:(?!${this.src_ZCc}|${n}|${r}).)`, o = `${n}${s}{0,1000}${r}`;
    for (let i = 2; i <= e; i++) o = `${n}(?:${s}|${o}){0,1000}${r}`;
    return o;
  }
  get_text_separators() {
    var t, A;
    return (A = (t = this.cache).text_separators) == null ? t.text_separators = /[><\uff5c]/ : A;
  }
  get_pseudo_letter() {
    var t, A;
    return (A = (t = this.cache).src_pseudo_letter) == null ? t.src_pseudo_letter = RegExp(`(?:(?!${this.get_text_separators().source}|${this.src_ZPCc})${this.src_Any})`) : A;
  }
  get_ipv4_addr() {
    var t, A;
    return (A = (t = this.cache).src_ip4) == null ? t.src_ip4 = /* @__PURE__ */ RegExp("(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])[.]){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])") : A;
  }
  get_ipv6_addr() {
    var t, A;
    let e = "[0-9A-Fa-f]{1,4}", n = `(?:(?:${e}:${e})|${this.get_ipv4_addr().source})`;
    return (A = (t = this.cache).src_ip6_addr) == null ? t.src_ip6_addr = RegExp(`(?:(?:${e}:){6}${n}|::(?:${e}:){5}${n}|(?:${e})?::(?:${e}:){4}${n}|(?:(?:${e}:){0,1}${e})?::(?:${e}:){3}${n}|(?:(?:${e}:){0,2}${e})?::(?:${e}:){2}${n}|(?:(?:${e}:){0,3}${e})?::${e}:${n}|(?:(?:${e}:){0,4}${e})?::${n}|(?:(?:${e}:){0,5}${e})?::${e}|(?:(?:${e}:){0,6}${e})?::)`) : A;
  }
  get_ipv6_url_host() {
    var t, A;
    return (A = (t = this.cache).src_ip6_host) == null ? t.src_ip6_host = RegExp(`\\[${this.get_ipv6_addr().source}\\]`) : A;
  }
  get_ipv6_mail_host() {
    var t, A;
    return (A = (t = this.cache).src_ipv6_mail_host) == null ? t.src_ipv6_mail_host = RegExp(`\\[IPv6:${this.get_ipv6_addr().source}\\]`) : A;
  }
  get_auth() {
    var t, A;
    return (A = (t = this.cache).src_auth) == null ? t.src_auth = RegExp(`(?:(?:(?!${this.src_ZCc}|[@/\\[\\]()]).){1,50}@)?`) : A;
  }
  get_port() {
    var t, A;
    return (A = (t = this.cache).src_port) == null ? t.src_port = /* @__PURE__ */ RegExp("(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?") : A;
  }
  get_host_terminator() {
    var t, A;
    return (A = (t = this.cache).src_host_terminator) == null ? t.src_host_terminator = RegExp(`(?=$|${this.get_text_separators().source}|${this.src_ZPCc})(?!${this.opts["---"] ? "-(?!--)|" : "-|"}_|:\\d|\\.-|\\.(?!$|${this.src_ZPCc}))`) : A;
  }
  get_path_terminator() {
    var t, A;
    return (A = (t = this.cache).src_path_terminator) == null ? t.src_path_terminator = RegExp(`${this.src_ZPCc}|${this.get_text_separators().source}`) : A;
  }
  get_path() {
    var t, A;
    return (A = (t = this.cache).src_path) == null ? t.src_path = RegExp(`(?:[/?#](?:${this.nestedPairRE("[", "]")}|${this.nestedPairRE("(", ")")}|${this.nestedPairRE("{", "}")}|\\"(?:(?!${this.src_ZCc}|["]).){1,100}\\"|\\'(?:(?!${this.src_ZCc}|[']).){1,100}\\'|\\'(?=${this.get_pseudo_letter().source}|[-])|\\.{2,20}[:]?[a-zA-Z0-9%/&]|\\.(?!${this.src_ZCc}|[.]|$)|` + (this.opts["---"] ? "\\-(?!--(?:[^-]|$))(?:-{0,19})|" : "\\-{1,20}|") + `,(?!${this.src_ZCc}|$)|;(?!${this.src_ZCc}|$)|\\!{1,20}(?!${this.src_ZCc}|[!]|$)|\\?(?!${this.src_ZCc}|[?]|$)|` + this.get_path_extra().source + `[\\\\/:%@#&=_~*]|(?!${this.get_path_terminator().source}).){1,${this.opts.maxLength}}|\\/)?`) : A;
  }
  get_mail_name() {
    var t, A;
    return (A = (t = this.cache).src_mail_name) == null ? t.src_mail_name = /* @__PURE__ */ RegExp("[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9](?:[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9]|[.](?=[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9])){0,63}") : A;
  }
  get_xn() {
    var t, A;
    return (A = (t = this.cache).src_xn) == null ? t.src_xn = /* @__PURE__ */ RegExp("xn--[a-z0-9\\-]{1,59}") : A;
  }
  get_tld() {
    if (this.cache.tld) return this.cache.tld;
    let t = [...new Set(this.opts.tlds || [])].sort().reverse().join("|");
    return this.cache.tld = RegExp(`${t || "$#none#$"}|${this.get_xn().source}`), this.cache.tld;
  }
  get_domain_root() {
    var t, A;
    return (A = (t = this.cache).src_domain_root) == null ? t.src_domain_root = RegExp("(?:" + this.get_xn().source + `|${this.get_pseudo_letter().source}{1,63})`) : A;
  }
  get_domain() {
    var t, A;
    return (A = (t = this.cache).src_domain) == null ? t.src_domain = RegExp("(?:" + this.get_xn().source + `|(?:${this.get_pseudo_letter().source})|(?:${this.get_pseudo_letter().source}(?:-|${this.get_pseudo_letter().source}){0,61}${this.get_pseudo_letter().source}))`) : A;
  }
  get_url_host_port() {
    var t, A;
    return (A = (t = this.cache).url_host_port) == null ? t.url_host_port = RegExp("(?:" + this.get_ipv6_url_host().source + `|(?:(?:(?:${this.get_domain().source})\\.){0,10}${this.get_domain().source}))` + this.get_port().source + this.get_host_terminator().source) : A;
  }
  get_fuzzy_url_host_port() {
    var t, A;
    return (A = (t = this.cache).fuzzy_url_host_port) == null ? t.fuzzy_url_host_port = RegExp("(?:" + (this.opts.fuzzyIP ? this.get_ipv4_addr().source + "|" : "") + `(?:(?:(?:${this.get_domain().source})\\.){1,10}(?:${this.get_tld().source})))` + this.get_host_terminator().source) : A;
  }
  get_mail_host() {
    var t, A;
    return (A = (t = this.cache).src_mail_host) == null ? t.src_mail_host = RegExp("(?:" + this.get_ipv6_mail_host().source + `|(?:(?:(?:${this.get_domain().source})\\.){0,4}${this.get_domain().source}))` + this.get_host_terminator().source) : A;
  }
  get_fuzzy_mail_host() {
    var t, A;
    return (A = (t = this.cache).src_fuzzy_mail_host) == null ? t.src_fuzzy_mail_host = RegExp("(?:" + this.get_ipv6_mail_host().source + `|(?:(?:(?:${this.get_domain().source})[.]){1,4}${this.get_domain_root().source}))` + this.get_host_terminator().source) : A;
  }
  get_path_extra() {
    var t, A;
    return (A = (t = this.cache).src_path_extra) == null ? t.src_path_extra = /* @__PURE__ */ RegExp("") : A;
  }
  get_fuzzy_mail_host_search() {
    var t, A;
    return (A = (t = this.cache).mail_fuzzy_host_search) == null ? t.mail_fuzzy_host_search = RegExp(`@${this.get_fuzzy_mail_host().source}`, "ig") : A;
  }
  get_fuzzy_link_search() {
    var t, A;
    return (A = (t = this.cache).link_fuzzy_search) == null ? t.link_fuzzy_search = RegExp(`(^|(?![.:/\\-_@])(?:[$+<=>^\`|｜]|${this.src_ZPCc}))(?:(?![$+<=>^\`|｜])${this.get_fuzzy_url_host_port().source}${this.get_path().source})`, "ig") : A;
  }
  get_http_validator() {
    var t, A;
    return (A = (t = this.cache).http_validator) == null ? t.http_validator = RegExp("\\/\\/" + (this.opts.urlAuth ? this.get_auth().source : "") + this.get_url_host_port().source + this.get_path().source, "iy") : A;
  }
  get_relative_proto_validator() {
    var t, A;
    return (A = (t = this.cache).relative_proto_validator) == null ? t.relative_proto_validator = RegExp((this.opts.urlAuth ? this.get_auth().source : "") + `(?:localhost|${this.get_ipv6_url_host().source}|(?:(?:${this.get_domain().source})[.]){1,10}${this.get_domain_root().source})` + this.get_port().source + this.get_host_terminator().source + this.get_path().source, "iy") : A;
  }
  get_mail_name_validator() {
    var t, A;
    return (A = (t = this.cache).mail_name_validator) == null ? t.mail_name_validator = RegExp(`(?:^|${this.get_text_separators().source}|"|\\(|${this.src_ZCc})(${this.get_mail_name().source})$`) : A;
  }
  get_mailto_validator() {
    var t, A;
    return (A = (t = this.cache).mailto_validator) == null ? t.mailto_validator = RegExp(`${this.get_mail_name().source}@${this.get_mail_host().source}`, "iy") : A;
  }
  get_schema_names() {
    var t, A;
    return (A = (t = this.cache).schema_names) == null ? t.schema_names = new RegExp((this.opts.schema_names || []).map((e) => this.escapeRE(e)).join("|")) : A;
  }
  get_schema_search() {
    var t, A;
    return (A = (t = this.cache).schema_search) == null ? t.schema_search = RegExp(`(^|(?!_)(?:[><｜]|${this.src_ZPCc}))(${this.get_schema_names().source})`, "ig") : A;
  }
  get_schema_at_start() {
    var t, A;
    return (A = (t = this.cache).schema_at_start) == null ? t.schema_at_start = RegExp(`^${this.get_schema_search().source}`, "i") : A;
  }
}, Rt = {
  validate: (t, A, e) => {
    let n = e.re.get_http_validator();
    n.lastIndex = A;
    let r = n.exec(t);
    return r ? r[0].length : 0;
  },
  normalize: (t, A) => A.normalize(t)
}, Er = {
  "http:": Rt,
  "https:": Rt,
  "ftp:": Rt,
  "//": {
    validate: function(t, A, e) {
      let n = e.re.get_relative_proto_validator();
      n.lastIndex = A;
      let r = n.exec(t);
      return r ? A >= 3 && t[A - 3] === ":" || A >= 3 && t[A - 3] === "/" ? 0 : r[0].length : 0;
    },
    normalize: (t, A) => A.normalize(t)
  },
  "mailto:": {
    validate: function(t, A, e) {
      let n = e.re.get_mailto_validator();
      n.lastIndex = A;
      let r = n.exec(t);
      return r ? r[0].length : 0;
    },
    normalize: (t, A) => A.normalize(t)
  }
}, wr = "a:cdefgilmnoqrstuwxz|b:abdefghijmnorstvwyz|c:acdfghiklmnoruvwxyz|d:ejkmoz|e:cegrstu|f:ijkmor|g:abdefghilmnpqrstuwy|h:kmnrtu|i:delmnoqrst|j:emop|k:eghimnprwyz|l:abcikrstuvy|m:acdeghklmnopqrstuvwxyz|n:acefgilopruz|o:m|p:aefghklmnrstwy|q:a|r:eosuw|s:abcdeghijklmnortuvxyz|t:cdfghjklmnortvwz|u:agksyz|v:aceginu|w:fs|y:et|z:amw", Qr = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф";
function _r() {
  let t = Qr.split("|");
  return wr.split("|").forEach((A) => {
    let e = A.indexOf(":"), n = A.slice(0, e);
    for (let r of A.slice(e + 1)) t.push(n + r);
  }), t;
}
var xr = {
  fuzzyLink: !1,
  fuzzyEmail: !0,
  fuzzyIP: !1,
  "---": !1,
  tlds: _r(),
  urlAuth: !1,
  maxLength: 1e4
}, mA = class {
  constructor(t, A, e, n) {
    p(this, "schema", void 0), p(this, "index", void 0), p(this, "lastIndex", void 0), p(this, "raw", void 0), p(this, "text", void 0), p(this, "url", void 0);
    let r = t.slice(e, n);
    this.schema = A.toLowerCase(), this.index = e, this.lastIndex = n, this.raw = r, this.text = r, this.url = r;
  }
}, Kr = class {
  constructor(t = {}) {
    p(this, "__opts__", void 0), p(this, "__schemas__", void 0), p(this, "re", void 0);
    let { rebuilder: A, ...e } = t;
    this.__opts__ = {
      ...xr,
      ...e
    }, this.__schemas__ = { ...Er }, this.re = A || new br(), this.re.set({
      ...this.__opts__,
      schema_names: Object.keys(this.__schemas__)
    });
  }
  add(t, A = null) {
    if (!A) delete this.__schemas__[t];
    else {
      let e = {
        normalize: (n, r) => r.normalize(n),
        ...A
      };
      this.__schemas__[t] = e;
    }
    return this.re.set({
      ...this.__opts__,
      schema_names: Object.keys(this.__schemas__)
    }), this;
  }
  set(t = {}) {
    return this.__opts__ = {
      ...this.__opts__,
      ...t
    }, this.re.set({
      ...this.__opts__,
      schema_names: Object.keys(this.__schemas__)
    }), this;
  }
  test(t) {
    if (!t.length) return !1;
    let A, e;
    for (e = this.re.get_schema_search(), e.lastIndex = 0; (A = e.exec(t)) !== null; ) if (this.testSchemaAt(t, A[2], e.lastIndex)) return !0;
    if (this.__opts__.fuzzyLink && this.__schemas__["http:"] && (e = this.re.get_fuzzy_link_search(), e.lastIndex = 0, e.exec(t) !== null)) return !0;
    if (this.__opts__.fuzzyEmail && this.__schemas__["mailto:"] && t.indexOf("@") >= 0) {
      let n = this.re.get_fuzzy_mail_host_search(), r = this.re.get_mail_name_validator();
      for (n.lastIndex = 0; (A = n.exec(t)) !== null; ) {
        let s = t.slice(Math.max(0, A.index - 65), A.index);
        if (r.test(s)) return !0;
      }
    }
    return !1;
  }
  testSchemaAt(t, A, e) {
    return this.__schemas__[A.toLowerCase()] ? this.__schemas__[A.toLowerCase()].validate(t.slice(0, e + this.__opts__.maxLength), e, this) : 0;
  }
  match(t) {
    let A = [], e = this.re.get_schema_search(), n, r, s, o, i, l, a = !1, c = !1, h = !1, g = 0;
    if (!t.length) return null;
    for (e.lastIndex = 0, this.__opts__.fuzzyLink && this.__schemas__["http:"] && (n = this.re.get_fuzzy_link_search(), n.lastIndex = 0), this.__opts__.fuzzyEmail && this.__schemas__["mailto:"] && (r = this.re.get_fuzzy_mail_host_search(), r.lastIndex = 0, s = this.re.get_mail_name_validator()); ; ) {
      let d = Math.max(g - 1, 0);
      if (r && s && !h && (!i || i.index < g)) for (r.lastIndex < d && (r.lastIndex = d); ; ) {
        let y = r.exec(t);
        if (!y) {
          h = !0, i = void 0;
          break;
        }
        let m = s.exec(t.slice(Math.max(0, y.index - 65), y.index));
        if (m) {
          if (i = {
            schema: "mailto:",
            index: y.index - m[1].length,
            lastIndex: y.index + y[0].length
          }, i.index >= g) break;
          r.lastIndex < d && (r.lastIndex = d);
        }
      }
      if (n && !c && (!o || o.index < g)) for (n.lastIndex < d && (n.lastIndex = d); ; ) {
        let y = n.exec(t);
        if (!y) {
          c = !0, o = void 0;
          break;
        }
        if (o = {
          schema: "",
          index: y.index + y[1].length,
          lastIndex: y.index + y[0].length
        }, o.index >= g) break;
        n.lastIndex < d && (n.lastIndex = d);
      }
      let u = i;
      (!u || o && (o.index < u.index || o.index === u.index && o.lastIndex > u.lastIndex)) && (u = o);
      let I;
      if (!a) for (; ; ) {
        if (!l) {
          e.lastIndex < d && (e.lastIndex = d);
          let f = e.exec(t);
          if (!f) {
            a = !0;
            break;
          }
          l = {
            schema: f[2],
            index: f.index + f[1].length,
            lastIndex: f.index + f[0].length
          };
        }
        if (l.index < g) {
          l = void 0;
          continue;
        }
        if (u && l.index > u.index) break;
        let y = l;
        l = void 0;
        let m = this.testSchemaAt(t, y.schema, y.lastIndex);
        if (m) {
          I = {
            schema: y.schema,
            index: y.index,
            lastIndex: y.lastIndex + m
          };
          break;
        }
      }
      let D = I;
      if ((!D || i && (i.index < D.index || i.index === D.index && i.lastIndex > D.lastIndex)) && (D = i), (!D || o && (o.index < D.index || o.index === D.index && o.lastIndex > D.lastIndex)) && (D = o), !D) break;
      D === i ? i = void 0 : D === o && (o = void 0);
      let F = new mA(t, D.schema, D.index, D.lastIndex);
      F.schema ? this.__schemas__[F.schema].normalize(F, this) : this.normalize(F), A.push(F), g = D.lastIndex;
    }
    return A.length ? A : null;
  }
  matchAtStart(t) {
    if (!t.length) return null;
    let A = this.re.get_schema_at_start().exec(t);
    if (!A) return null;
    let e = this.testSchemaAt(t, A[2], A[0].length);
    if (!e) return null;
    let n = new mA(t, A[2], A.index + A[1].length, A.index + A[0].length + e);
    return this.__schemas__[n.schema].normalize(n, this), n;
  }
  tlds(t, A = !1) {
    return t = Array.isArray(t) ? t : [t], A ? this.__opts__.tlds = this.__opts__.tlds.concat(t) : this.__opts__.tlds = t, this.re.set({
      ...this.__opts__,
      schema_names: Object.keys(this.__schemas__)
    }), this;
  }
  normalize(t) {
    t.schema || (t.url = `http://${t.url}`), t.schema === "mailto:" && !/^mailto:/i.test(t.url) && (t.url = `mailto:${t.url}`);
  }
}, st = 2147483647, j = 36, VA = 1, Qt = 26, Wr = 38, vr = 700, PA = 72, TA = 128, qA = "-", Gr = /^xn--/, Yr = /[^\0-\x7F]/, Zr = /[\x2E\u3002\uFF0E\uFF61]/g, Jr = {
  overflow: "Overflow: input needs wider integers to process",
  "not-basic": "Illegal input >= 0x80 (not a basic code point)",
  "invalid-input": "Invalid input"
}, Sr = 35, z = Math.floor, Ht = String.fromCharCode;
function P(t) {
  throw RangeError(Jr[t]);
}
function Rr(t, A) {
  let e = [], n = t.length;
  for (; n--; ) e[n] = A(t[n]);
  return e;
}
function DA(t, A) {
  let e = t.split("@"), n = "";
  e.length > 1 && (n = e[0] + "@", t = e[1]), t = t.replace(Zr, ".");
  let r = Rr(t.split("."), A).join(".");
  return n + r;
}
function $A(t) {
  let A = [], e = 0, n = t.length;
  for (; e < n; ) {
    let r = t.charCodeAt(e++);
    if (r >= 55296 && r <= 56319 && e < n) {
      let s = t.charCodeAt(e++);
      (s & 64512) == 56320 ? A.push(((r & 1023) << 10) + (s & 1023) + 65536) : (A.push(r), e--);
    } else A.push(r);
  }
  return A;
}
var Hr = (t) => String.fromCodePoint(...t), Nr = function(t) {
  return t >= 48 && t < 58 ? 26 + (t - 48) : t >= 65 && t < 91 ? t - 65 : t >= 97 && t < 123 ? t - 97 : j;
}, IA = function(t, A) {
  return t + 22 + 75 * (t < 26) - ((A != 0) << 5);
}, te = function(t, A, e) {
  let n = 0;
  for (t = e ? z(t / vr) : t >> 1, t += z(t / A); t > 455; n += j) t = z(t / Sr);
  return z(n + 36 * t / (t + Wr));
}, FA = function(t) {
  let A = [], e = t.length, n = 0, r = TA, s = PA, o = t.lastIndexOf(qA);
  o < 0 && (o = 0);
  for (let i = 0; i < o; ++i) t.charCodeAt(i) >= 128 && P("not-basic"), A.push(t.charCodeAt(i));
  for (let i = o > 0 ? o + 1 : 0; i < e; ) {
    let l = n;
    for (let c = 1, h = j; ; h += j) {
      i >= e && P("invalid-input");
      let g = Nr(t.charCodeAt(i++));
      g >= j && P("invalid-input"), g > z((st - n) / c) && P("overflow"), n += g * c;
      let d = h <= s ? VA : h >= s + Qt ? Qt : h - s;
      if (g < d) break;
      let u = j - d;
      c > z(st / u) && P("overflow"), c *= u;
    }
    let a = A.length + 1;
    s = te(n - l, a, l == 0), z(n / a) > st - r && P("overflow"), r += z(n / a), n %= a, A.splice(n++, 0, r);
  }
  return String.fromCodePoint(...A);
}, BA = function(t) {
  let A = [];
  t = $A(t);
  let e = t.length, n = TA, r = 0, s = PA;
  for (let l of t) l < 128 && A.push(Ht(l));
  let o = A.length, i = o;
  for (o && A.push(qA); i < e; ) {
    let l = st;
    for (let c of t) c >= n && c < l && (l = c);
    let a = i + 1;
    l - n > z((st - r) / a) && P("overflow"), r += (l - n) * a, n = l;
    for (let c of t) if (c < n && ++r > st && P("overflow"), c === n) {
      let h = r;
      for (let g = j; ; g += j) {
        let d = g <= s ? VA : g >= s + Qt ? Qt : g - s;
        if (h < d) break;
        let u = h - d, I = j - d;
        A.push(Ht(IA(d + u % I, 0))), h = z(u / I);
      }
      A.push(Ht(IA(h, 0))), s = te(r, a, i === o), r = 0, ++i;
    }
    ++r, ++n;
  }
  return A.join("");
}, kA = {
  version: "2.3.1",
  ucs2: {
    decode: $A,
    encode: Hr
  },
  decode: FA,
  encode: BA,
  toASCII: function(t) {
    return DA(t, function(A) {
      return Yr.test(A) ? "xn--" + BA(A) : A;
    });
  },
  toUnicode: function(t) {
    return DA(t, function(A) {
      return Gr.test(A) ? FA(A.slice(4).toLowerCase()) : A;
    });
  }
}, Mr = {
  default: {
    options: {
      html: !1,
      xhtmlOut: !1,
      breaks: !1,
      langPrefix: "language-",
      linkify: !1,
      typographer: !1,
      quotes: "“”‘’",
      highlight: null,
      maxNesting: 100
    },
    components: {
      core: {},
      block: {},
      inline: {}
    }
  },
  zero: {
    options: {
      html: !1,
      xhtmlOut: !1,
      breaks: !1,
      langPrefix: "language-",
      linkify: !1,
      typographer: !1,
      quotes: "“”‘’",
      highlight: null,
      maxNesting: 20
    },
    components: {
      core: { rules: [
        "normalize",
        "block",
        "strip_references",
        "inline",
        "text_join"
      ] },
      block: { rules: ["paragraph"] },
      inline: {
        rules: ["text"],
        rules2: ["balance_pairs", "fragments_join"]
      }
    }
  },
  commonmark: {
    options: {
      html: !0,
      xhtmlOut: !0,
      breaks: !1,
      langPrefix: "language-",
      linkify: !1,
      typographer: !1,
      quotes: "“”‘’",
      highlight: null,
      maxNesting: 20
    },
    components: {
      core: { rules: [
        "normalize",
        "block",
        "strip_references",
        "inline",
        "text_join"
      ] },
      block: { rules: [
        "blockquote",
        "code",
        "fence",
        "heading",
        "hr",
        "html_block",
        "lheading",
        "list",
        "reference",
        "paragraph"
      ] },
      inline: {
        rules: [
          "autolink",
          "backticks",
          "emphasis",
          "entity",
          "escape",
          "html_inline",
          "image",
          "link",
          "newline",
          "text"
        ],
        rules2: [
          "balance_pairs",
          "emphasis",
          "fragments_join"
        ]
      }
    }
  }
}, Ur = /^(vbscript|javascript|file|data):/, zr = /^data:image\/(gif|png|jpeg|webp);/, yA = [
  "http:",
  "https:",
  "mailto:"
], U = class {
  validateLink(t) {
    let A = t.trim().toLowerCase();
    return !Ur.test(A) || zr.test(A);
  }
  normalizeLink(t) {
    let A = Ut(t, !0);
    if (A.hostname && (!A.protocol || yA.indexOf(A.protocol) >= 0)) try {
      A.hostname = kA.toASCII(A.hostname);
    } catch {
    }
    return A.auth && (A.auth = O(A.auth)), A.hostname && (A.hostname = O(A.hostname)), A.pathname && (A.pathname = O(A.pathname)), A.search && (A.search = O(A.search)), A.hash && (A.hash = O(A.hash)), Mt(A);
  }
  normalizeLinkText(t) {
    let A = Ut(t, !0);
    if (A.hostname && (!A.protocol || yA.indexOf(A.protocol) >= 0)) try {
      A.hostname = kA.toUnicode(A.hostname);
    } catch {
    }
    return ot(Mt(A), ot.defaultChars + "%");
  }
  constructor(...t) {
    p(this, "inline", new jA()), p(this, "block", new zA()), p(this, "core", new HA()), p(this, "renderer", new JA()), p(this, "linkify", new Kr()), p(this, "utils", Ve), p(this, "helpers", Object.assign({}, hn));
    let [A, e] = t;
    typeof A == "string" ? (this.configure(A), e && this.set(e)) : (this.configure("default"), this.set(A || {}));
  }
  set(t) {
    return Object.assign(this.options, t), this;
  }
  configure(t) {
    let A;
    if (typeof t == "string") {
      let r = t;
      if (A = Mr[r], !A) throw Error(`Wrong 'markdown-it' preset "${r}", check name`);
    } else A = t;
    if (!A) throw Error("Wrong `markdown-it` preset, can't be empty");
    A.options && (this.options = { ...A.options });
    let e = A.components;
    if (e) {
      var n;
      [
        "core",
        "block",
        "inline"
      ].forEach((s) => {
        var o;
        let i = (o = e[s]) == null ? void 0 : o.rules;
        i && this[s].ruler.enableOnly(i);
      });
      let r = (n = e.inline) == null ? void 0 : n.rules2;
      r && this.inline.ruler2.enableOnly(r);
    }
    return this;
  }
  enable(t, A = !1) {
    let e = [];
    Array.isArray(t) || (t = [t]), [
      "core",
      "block",
      "inline"
    ].forEach((r) => {
      e = e.concat(this[r].ruler.enable(t, !0));
    }), e = e.concat(this.inline.ruler2.enable(t, !0));
    let n = t.filter((r) => e.indexOf(r) < 0);
    if (n.length && !A) throw Error(`MarkdownIt. Failed to enable unknown rule(s): ${n}`);
    return this;
  }
  disable(t, A = !1) {
    let e = [];
    Array.isArray(t) || (t = [t]), [
      "core",
      "block",
      "inline"
    ].forEach((r) => {
      e = e.concat(this[r].ruler.disable(t, !0));
    }), e = e.concat(this.inline.ruler2.disable(t, !0));
    let n = t.filter((r) => e.indexOf(r) < 0);
    if (n.length && !A) throw Error(`MarkdownIt. Failed to disable unknown rule(s): ${n}`);
    return this;
  }
  use(t, ...A) {
    return t.apply(t, [this, ...A]), this;
  }
  parse(t, A) {
    if (typeof t != "string") throw Error("Input data should be a String");
    let e = new this.core.State(t, this, A);
    return this.core.process(e), e.tokens;
  }
  render(t, A = {}) {
    return this.renderer.render(this.parse(t, A), this.options, A);
  }
  parseInline(t, A) {
    let e = new this.core.State(t, this, A);
    return e.inlineMode = !0, this.core.process(e), e.tokens;
  }
  renderInline(t, A = {}) {
    return this.renderer.render(this.parseInline(t, A), this.options, A);
  }
};
p(U, "Token", At), p(U, "Ruler", pt), p(U, "Renderer", JA), p(U, "ParserCore", HA), p(U, "StateCore", SA), p(U, "ParserBlock", zA), p(U, "StateBlock", NA), p(U, "ParserInline", jA), p(U, "StateInline", LA);
var Lr = GA(U);
const Xr = /^(https?:\/\/|mailto:)/i;
function Or(t) {
  return Xr.test(t);
}
const et = new Lr({ html: !1, linkify: !1, typographer: !1 });
et.validateLink = Or;
et.renderer.rules.image = (t, A) => {
  const e = t[A], n = et.utils.escapeHtml(e.content || "image");
  return `<span class="qz-image" title="${et.utils.escapeHtml(String(e.attrGet("src") ?? ""))}">[image: ${n}]</span>`;
};
const jr = et.renderer.rules.link_open ?? ((t, A, e, n, r) => r.renderToken(t, A, e));
et.renderer.rules.link_open = (t, A, e, n, r) => (t[A].attrSet("target", "_blank"), t[A].attrSet("rel", "noopener noreferrer nofollow"), jr(t, A, e, n, r));
function Vr(t) {
  return et.render(t);
}
function nt(t, A) {
  return `${_t}/workspaces/${t}${A ? `/${A}` : ""}`;
}
function Ae(t) {
  const A = Object.entries(t).filter((e) => e[1] !== void 0 && e[1] !== "").map(([e, n]) => `${encodeURIComponent(e)}=${encodeURIComponent(n)}`);
  return A.length ? `?${A.join("&")}` : "";
}
async function Pr(t) {
  return (await t.get(`${_t}/workspaces`)).workspaces;
}
async function Tr(t, A, e) {
  return (await t.post(`${_t}/workspaces`, e ? { path: A, name: e } : { path: A })).workspace;
}
async function qr(t, A) {
  await t.del(nt(A));
}
function $r(t, A, e = "", n = !1) {
  return t.get(nt(A, "notes") + Ae({ q: e.trim(), content: n && e.trim() ? "1" : void 0 }));
}
function ts(t, A, e) {
  return t.get(nt(A, "note") + Ae({ path: e }));
}
function ee(t, A, e, n) {
  return t.post(nt(A, "note"), { path: e, content: n });
}
function As(t, A, e, n, r) {
  return t.put(nt(A, "note"), { path: e, content: n, expectedHash: r });
}
function es(t, A, e, n, r = {}) {
  const s = { from: e, to: n };
  return r.expectedHash && (s.expectedHash = r.expectedHash), r.overwrite && Object.assign(s, { overwrite: !0, confirm: !0 }), t.post(nt(A, "rename"), s);
}
function ns(t, A, e, n) {
  return t.post(nt(A, "delete"), n ? { path: e, confirm: !0, expectedHash: n } : { path: e, confirm: !0 });
}
function V(t) {
  const A = t;
  if ((A == null ? void 0 : A.name) === "AppApiPermissionError")
    return { code: "permission_denied", message: "Quartizo has not declared access to this API in app.json." };
  const e = typeof (A == null ? void 0 : A.status) == "number" ? A.status : void 0;
  let n;
  if (typeof (A == null ? void 0 : A.body) == "string" && A.body)
    try {
      const i = JSON.parse(A.body);
      i && typeof i == "object" && !Array.isArray(i) && (n = i);
    } catch {
    }
  const r = typeof (n == null ? void 0 : n.code) == "string" ? n.code : void 0, s = typeof (n == null ? void 0 : n.error) == "string" ? n.error : typeof (A == null ? void 0 : A.message) == "string" ? A.message : String(t), o = { status: e, code: r, message: s };
  if (r === "conflict") {
    const i = n == null ? void 0 : n.currentHash;
    o.currentHash = typeof i == "string" ? i : null;
  }
  return o;
}
function Ft(t) {
  const A = t.lastIndexOf("/");
  return A < 0 ? "" : t.slice(0, A);
}
function ne(t) {
  let A = t.trim();
  if (!A) return { error: "Enter a name." };
  if (A.endsWith(".md") || (A += ".md"), A.startsWith("/")) return { error: "Use a path relative to the workspace." };
  if (A.includes("\\")) return { error: 'Use "/" to separate folders.' };
  if (/[\u0000-\u001f\u007f]/.test(A)) return { error: "Names cannot contain control characters." };
  for (const e of A.split("/")) {
    if (e === "" || e === "." || e === "..") return { error: 'Empty, "." and ".." folder names are not allowed.' };
    if (e.startsWith(".")) return { error: 'Names cannot start with "." (hidden).' };
  }
  return A === ".md" || A.endsWith("/.md") ? { error: "Enter a name." } : { path: A };
}
const Lt = "quartizo:workspace", x = {
  layout: { display: "grid", gridTemplateColumns: "minmax(220px, 300px) 1fr", gap: 12, minHeight: 0, flex: 1 },
  column: { display: "flex", flexDirection: "column", gap: 8, minHeight: 0, minWidth: 0 },
  row: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" },
  input: { flex: 1, minWidth: 0, padding: "4px 6px", border: "1px solid rgba(128,128,128,.4)", borderRadius: 4, background: "transparent", color: "inherit" },
  list: { listStyle: "none", margin: 0, padding: 0, overflowY: "auto", flex: 1, border: "1px solid rgba(128,128,128,.25)", borderRadius: 4 },
  item: { padding: "4px 8px", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  textarea: { flex: 1, minHeight: 300, width: "100%", resize: "none", fontFamily: "ui-monospace, monospace", fontSize: 13, padding: 8, border: "1px solid rgba(128,128,128,.4)", borderRadius: 4, background: "transparent", color: "inherit", tabSize: 4 },
  preview: { flex: 1, minHeight: 300, overflowY: "auto", padding: "4px 12px", border: "1px solid rgba(128,128,128,.25)", borderRadius: 4 },
  notice: { padding: 8, borderRadius: 4, border: "1px solid rgba(220,120,0,.6)", display: "flex", flexDirection: "column", gap: 6 }
};
function Xt() {
  try {
    return window.localStorage;
  } catch {
    return;
  }
}
function rs() {
  var t;
  try {
    const A = Number((t = Xt()) == null ? void 0 : t.getItem(Lt));
    return Number.isInteger(A) && A > 0 ? A : null;
  } catch {
    return null;
  }
}
function ss(t) {
  var A, e;
  try {
    t ? (A = Xt()) == null || A.setItem(Lt, String(t)) : (e = Xt()) == null || e.removeItem(Lt);
  } catch {
  }
}
function it({ failure: t }) {
  return t ? /* @__PURE__ */ C("div", { role: "alert", className: "text-sm text-danger", "data-code": t.code, children: t.message }) : null;
}
function is({ api: t }) {
  const [A, e] = _({ status: "loading" }), [n, r] = _(rs), [s, o] = _(0), i = yt(!1), l = () => !i.current || window.confirm("Discard unsaved changes to the open note?");
  q(() => {
    let h = !1;
    return Pr(t).then((g) => {
      h || (e({ status: "ready", value: g }), r((d) => {
        var u;
        return d && g.some((I) => I.id === d) ? d : ((u = g[0]) == null ? void 0 : u.id) ?? null;
      }));
    }).catch((g) => !h && e({ status: "error", failure: V(g) })), () => {
      h = !0;
    };
  }, [t, s]), q(() => ss(n), [n]);
  const c = (A.status === "ready" ? A.value : []).find((h) => h.id === n) ?? null;
  return /* @__PURE__ */ Q("div", { style: x.column, children: [
    /* @__PURE__ */ C(
      os,
      {
        api: t,
        load: A,
        current: c,
        onSelect: (h) => l() && r(h),
        onChanged: (h) => {
          h !== void 0 && r(h), o((g) => g + 1);
        }
      }
    ),
    c ? /* @__PURE__ */ C(ls, { api: t, workspace: c, dirtyRef: i }, c.id) : A.status === "ready" && /* @__PURE__ */ C("p", { className: "text-sm text-muted", children: "No workspace yet. Register a folder of Markdown files (for example an Obsidian vault) to start." })
  ] });
}
function os(t) {
  const { api: A, load: e, current: n } = t, [r, s] = _(!1), [o, i] = _(""), [l, a] = _(""), [c, h] = _(!1), [g, d] = _(null), [u, I] = _(!1), D = e.status === "ready" ? e.value : [], F = async () => {
    h(!0), d(null);
    try {
      const m = await Tr(A, o.trim(), l.trim() || void 0);
      s(!1), i(""), a(""), t.onChanged(m.id);
    } catch (m) {
      d(V(m));
    } finally {
      h(!1);
    }
  }, y = async () => {
    if (n) {
      h(!0), d(null);
      try {
        await qr(A, n.id), I(!1), t.onChanged(null);
      } catch (m) {
        d(V(m));
      } finally {
        h(!1);
      }
    }
  };
  return /* @__PURE__ */ Q("div", { style: x.column, children: [
    /* @__PURE__ */ Q("div", { style: x.row, children: [
      /* @__PURE__ */ C("label", { className: "text-sm", htmlFor: "qz-ws", children: "Workspace" }),
      e.status === "loading" && /* @__PURE__ */ C("span", { className: "text-sm text-muted", children: "Loading…" }),
      D.length > 0 && /* @__PURE__ */ C(
        "select",
        {
          id: "qz-ws",
          value: (n == null ? void 0 : n.id) ?? "",
          onChange: (m) => t.onSelect(Number(m.target.value)),
          style: { ...x.input, flex: "0 1 280px" },
          children: D.map((m) => /* @__PURE__ */ C("option", { value: m.id, children: m.name }, m.id))
        }
      ),
      n && /* @__PURE__ */ C("span", { className: "text-sm text-muted", title: n.path, children: n.path }),
      /* @__PURE__ */ C(Y, { onClick: () => s((m) => !m), disabled: c, children: r ? "Cancel" : "Add workspace" }),
      n && !u && /* @__PURE__ */ C(Y, { onClick: () => I(!0), disabled: c, children: "Remove…" })
    ] }),
    u && n && /* @__PURE__ */ Q("div", { role: "alertdialog", "aria-label": "Remove workspace", style: x.notice, children: [
      /* @__PURE__ */ Q("span", { className: "text-sm", children: [
        "Stop showing “",
        n.name,
        "” in Quartizo? The folder and its files are not touched."
      ] }),
      /* @__PURE__ */ Q("div", { style: x.row, children: [
        /* @__PURE__ */ C(Y, { onClick: y, disabled: c, children: "Remove workspace" }),
        /* @__PURE__ */ C(Y, { onClick: () => I(!1), disabled: c, children: "Cancel" })
      ] })
    ] }),
    r && /* @__PURE__ */ Q("div", { style: x.row, children: [
      /* @__PURE__ */ C(
        "input",
        {
          "aria-label": "Absolute folder path",
          placeholder: "/home/you/notes",
          value: o,
          onChange: (m) => i(m.target.value),
          onKeyDown: (m) => m.key === "Enter" && o.trim() && void F(),
          style: x.input,
          autoFocus: !0
        }
      ),
      /* @__PURE__ */ C(
        "input",
        {
          "aria-label": "Display name (optional)",
          placeholder: "Name (optional)",
          value: l,
          onChange: (m) => a(m.target.value),
          style: { ...x.input, flex: "0 1 160px" }
        }
      ),
      /* @__PURE__ */ C(Y, { onClick: F, disabled: c || !o.trim(), children: "Register" })
    ] }),
    e.status === "error" && /* @__PURE__ */ C(it, { failure: e.failure }),
    /* @__PURE__ */ C(it, { failure: g })
  ] });
}
function ls(t) {
  const { api: A, workspace: e, dirtyRef: n } = t, r = e.id, [s, o] = _(""), [i, l] = _(!1), [a, c] = _({ status: "loading" }), [h, g] = _(0), [d, u] = _(-1), [I, D] = _(null), [F, y] = _(null), [m, f] = _(null), [B, E] = _(null), v = yt(null), k = yt(0), K = I !== null && Nt(I);
  q(() => {
    if (n.current = K, !K) return;
    const b = (J) => J.preventDefault();
    return window.addEventListener("beforeunload", b), () => window.removeEventListener("beforeunload", b);
  }, [K, n]), q(() => () => void (n.current = !1), [n]), q(() => u(-1), [s, i]), q(() => {
    let b = !1;
    const J = setTimeout(
      () => {
        c((N) => N.status === "ready" ? N : { status: "loading" }), $r(A, r, s, i).then((N) => !b && c({ status: "ready", value: N })).catch((N) => !b && c({ status: "error", failure: V(N) }));
      },
      s ? 250 : 0
    );
    return () => {
      b = !0, clearTimeout(J);
    };
  }, [A, r, s, i, h]);
  const w = a.status === "ready" ? a.value.files : [], Z = Bt(() => g((b) => b + 1), []), H = Bt(
    () => !I || !Nt(I) || window.confirm(`Discard unsaved changes to ${I.path}?`),
    [I]
  ), L = Bt(
    async (b, J = {}) => {
      if (!J.force && !H()) return;
      const N = ++k.current;
      y({ path: b }), E(null);
      try {
        const rt = await ts(A, r, b);
        if (N !== k.current) return;
        D(Ie(rt)), y(null);
      } catch (rt) {
        if (N !== k.current) return;
        D(null), y({ path: b, failure: V(rt) });
      }
    },
    [A, r, H]
  ), ft = (b) => {
    var N, rt;
    if (b.key === "Enter" && d >= 0 && w[d]) {
      b.preventDefault(), L(w[d].path);
      return;
    }
    const J = be(d, b.key, w.length);
    J !== null && (b.preventDefault(), u(J), (rt = (N = v.current) == null ? void 0 : N.querySelectorAll('[role="option"]')[J]) == null || rt.scrollIntoView({ block: "nearest" }));
  }, X = async () => {
    const b = ne(m ?? "");
    if ("error" in b) {
      E({ message: b.error });
      return;
    }
    if (H())
      try {
        await ee(A, r, b.path, ""), f(null), Z(), await L(b.path, { force: !0 });
      } catch (J) {
        E(V(J));
      }
  }, Ct = (I == null ? void 0 : I.path) ?? (F == null ? void 0 : F.path);
  return /* @__PURE__ */ Q("div", { style: x.layout, children: [
    /* @__PURE__ */ Q("div", { style: x.column, children: [
      /* @__PURE__ */ C(
        "input",
        {
          type: "search",
          "aria-label": "Search notes",
          placeholder: "Search notes…",
          value: s,
          onChange: (b) => o(b.target.value),
          onKeyDown: (b) => {
            var J;
            b.key === "ArrowDown" && (b.preventDefault(), u(0), (J = v.current) == null || J.focus());
          },
          style: { ...x.input, flex: "0 0 auto" }
        }
      ),
      /* @__PURE__ */ Q("div", { style: x.row, children: [
        /* @__PURE__ */ Q("label", { className: "text-sm", children: [
          /* @__PURE__ */ C("input", { type: "checkbox", checked: i, onChange: (b) => l(b.target.checked) }),
          " ",
          "Search contents"
        ] }),
        /* @__PURE__ */ C(Y, { onClick: Z, children: "Refresh" }),
        /* @__PURE__ */ C(Y, { onClick: () => f((b) => b === null ? "" : null), children: m === null ? "New note" : "Cancel" })
      ] }),
      m !== null && /* @__PURE__ */ Q("div", { style: x.row, children: [
        /* @__PURE__ */ C(
          "input",
          {
            "aria-label": "New note path",
            placeholder: "folder/name.md",
            value: m,
            onChange: (b) => f(b.target.value),
            onKeyDown: (b) => {
              b.key === "Escape" && f(null), b.key === "Enter" && X();
            },
            style: x.input,
            autoFocus: !0
          }
        ),
        /* @__PURE__ */ C(Y, { onClick: X, children: "Create" })
      ] }),
      /* @__PURE__ */ C(it, { failure: B }),
      a.status === "loading" && /* @__PURE__ */ C("p", { className: "text-sm text-muted", children: "Loading notes…" }),
      a.status === "error" && /* @__PURE__ */ C(it, { failure: a.failure }),
      a.status === "ready" && w.length === 0 && /* @__PURE__ */ C("p", { className: "text-sm text-muted", children: s ? "No notes match." : "No .md files in this workspace yet." }),
      w.length > 0 && /* @__PURE__ */ C(
        "ul",
        {
          ref: v,
          role: "listbox",
          "aria-label": "Notes",
          tabIndex: 0,
          onKeyDown: ft,
          "aria-activedescendant": d >= 0 ? `qz-note-${d}` : void 0,
          style: x.list,
          children: w.map((b, J) => /* @__PURE__ */ Q(
            "li",
            {
              id: `qz-note-${J}`,
              role: "option",
              "aria-selected": b.path === Ct,
              onClick: () => {
                u(J), L(b.path);
              },
              title: b.path,
              style: {
                ...x.item,
                outline: J === d ? "1px solid rgba(80,140,255,.8)" : void 0,
                background: b.path === Ct ? "rgba(80,140,255,.15)" : void 0
              },
              children: [
                /* @__PURE__ */ C("span", { children: b.path.slice(Ft(b.path).length ? Ft(b.path).length + 1 : 0) }),
                Ft(b.path) && /* @__PURE__ */ Q("span", { className: "text-sm text-muted", children: [
                  " — ",
                  Ft(b.path)
                ] }),
                b.snippet && /* @__PURE__ */ C("div", { className: "text-sm text-muted", style: { overflow: "hidden", textOverflow: "ellipsis" }, children: b.snippet })
              ]
            },
            b.path
          ))
        }
      ),
      a.status === "ready" && a.value.truncated && /* @__PURE__ */ C("p", { className: "text-sm text-muted", children: "Showing a partial list (limits reached). Narrow the search." })
    ] }),
    /* @__PURE__ */ C("div", { style: x.column, children: I ? /* @__PURE__ */ C(
      as,
      {
        api: A,
        wsId: r,
        doc: I,
        setDoc: D,
        onReload: () => void L(I.path, { force: !0 }),
        onMoved: (b) => {
          Z(), b ? L(b, { force: !0 }) : D(null);
        },
        onSaved: Z
      },
      I.path
    ) : F ? F.failure ? /* @__PURE__ */ C(it, { failure: F.failure }) : /* @__PURE__ */ Q("p", { className: "text-sm text-muted", children: [
      "Opening ",
      F.path,
      "…"
    ] }) : /* @__PURE__ */ C("p", { className: "text-sm text-muted", children: "Select a note, or create one. Use ↑/↓ and Enter in the list." }) })
  ] });
}
function as(t) {
  const { api: A, wsId: e, doc: n, setDoc: r } = t, [s, o] = _("split"), [i, l] = _(!1), [a, c] = _(null), [h, g] = _(!1), [d, u] = _(null), [I, D] = _(!1), F = Nt(n), y = Ot(n), m = bA(() => s === "edit" ? "" : Vr(n.text), [n.text, s]), f = async () => {
    if (i || !y || n.conflict) return;
    const k = QA(n);
    l(!0), c(null);
    try {
      const K = n.hash === null ? await ee(A, e, n.path, k) : await As(A, e, n.path, k, n.hash);
      r((w) => w && w.path === n.path ? Be(w, k, K) : w), t.onSaved();
    } catch (K) {
      const w = V(K);
      w.code === "conflict" ? r((Z) => Z && Gt(Z, w.currentHash ?? null)) : c(w);
    } finally {
      l(!1);
    }
  }, B = async () => {
    l(!0), c(null);
    try {
      await ns(A, e, n.path, n.hash ?? void 0), g(!1), t.onMoved(null);
    } catch (k) {
      const K = V(k);
      g(!1), K.code === "conflict" ? r((w) => w && Gt(w, K.currentHash ?? null)) : c(K);
    } finally {
      l(!1);
    }
  }, E = async (k) => {
    const K = ne(d ?? "");
    if ("error" in K) {
      c({ message: K.error });
      return;
    }
    if (F) {
      c({ message: "Save or discard your changes before renaming." });
      return;
    }
    l(!0), c(null);
    try {
      const w = await es(A, e, n.path, K.path, { expectedHash: n.hash ?? void 0, overwrite: k });
      u(null), D(!1), t.onMoved(w.path);
    } catch (w) {
      const Z = V(w);
      Z.code === "exists" && !k ? D(!0) : Z.code === "conflict" ? r((H) => H && Gt(H, Z.currentHash ?? null)) : c(Z);
    } finally {
      l(!1);
    }
  }, v = (k) => {
    (k.ctrlKey || k.metaKey) && k.key.toLowerCase() === "s" && (k.preventDefault(), f());
  };
  return /* @__PURE__ */ Q(kt, { children: [
    /* @__PURE__ */ Q("div", { style: x.row, children: [
      /* @__PURE__ */ C("strong", { style: { overflow: "hidden", textOverflow: "ellipsis" }, title: n.path, children: n.path }),
      /* @__PURE__ */ C("span", { className: "text-sm text-muted", "aria-live": "polite", children: i ? "Working…" : n.conflict ? "Conflict" : F ? "Unsaved changes" : "Saved" }),
      /* @__PURE__ */ C("span", { style: { flex: 1 } }),
      /* @__PURE__ */ C("div", { role: "group", "aria-label": "View", style: x.row, children: ["edit", "split", "preview"].map((k) => /* @__PURE__ */ C(
        "button",
        {
          type: "button",
          "aria-pressed": s === k,
          onClick: () => o(k),
          style: { fontWeight: s === k ? 600 : 400, background: "transparent", color: "inherit", border: "none", cursor: "pointer" },
          children: k === "edit" ? "Edit" : k === "split" ? "Split" : "Preview"
        },
        k
      )) }),
      /* @__PURE__ */ C(Y, { onClick: f, disabled: i || !F || !y || !!n.conflict, children: "Save" }),
      /* @__PURE__ */ C(Y, { onClick: () => u((k) => k === null ? n.path : null), disabled: i, children: "Rename" }),
      /* @__PURE__ */ C(Y, { onClick: () => g(!0), disabled: i || h, children: "Delete…" })
    ] }),
    !y && /* @__PURE__ */ C("p", { className: "text-sm text-muted", children: "This note mixes line-ending styles. Editing would normalize them, so it is read-only in Quartizo." }),
    n.conflict && /* @__PURE__ */ Q("div", { role: "alert", style: x.notice, children: [
      /* @__PURE__ */ C("span", { className: "text-sm", children: n.conflict.currentHash === null ? "This note was deleted on disk since you opened it." : "This note changed on disk since you opened it. Your changes were not saved." }),
      /* @__PURE__ */ Q("div", { style: x.row, children: [
        /* @__PURE__ */ C(Y, { onClick: t.onReload, disabled: i, children: "Reload from disk (discard mine)" }),
        /* @__PURE__ */ C(Y, { onClick: () => r((k) => k && ke(k)), disabled: i, children: "Keep editing" }),
        /* @__PURE__ */ C(Y, { onClick: () => r((k) => k && ye(k)), disabled: i, children: n.conflict.currentHash === null ? "Re-create with my version…" : "Overwrite with my version…" })
      ] }),
      /* @__PURE__ */ C("span", { className: "text-sm text-muted", children: "“Keep editing” leaves the file alone; saving will warn again. The last button only arms the next Save." })
    ] }),
    h && /* @__PURE__ */ Q("div", { role: "alertdialog", "aria-label": "Delete note", style: x.notice, children: [
      /* @__PURE__ */ Q("span", { className: "text-sm", children: [
        "Move ",
        /* @__PURE__ */ C("strong", { children: n.path }),
        " to the workspace’s ",
        /* @__PURE__ */ C("code", { children: ".trash" }),
        " folder?",
        F && " Your unsaved changes will be lost."
      ] }),
      /* @__PURE__ */ Q("div", { style: x.row, children: [
        /* @__PURE__ */ C(Y, { onClick: B, disabled: i, children: "Move to trash" }),
        /* @__PURE__ */ C(Y, { onClick: () => g(!1), disabled: i, children: "Cancel" })
      ] })
    ] }),
    d !== null && /* @__PURE__ */ Q("div", { style: x.row, children: [
      /* @__PURE__ */ C(
        "input",
        {
          "aria-label": "New path",
          value: d,
          onChange: (k) => {
            u(k.target.value), D(!1);
          },
          onKeyDown: (k) => {
            k.key === "Escape" && u(null), k.key === "Enter" && !I && E(!1);
          },
          style: x.input,
          autoFocus: !0
        }
      ),
      I ? /* @__PURE__ */ Q(kt, { children: [
        /* @__PURE__ */ C("span", { className: "text-sm text-danger", children: "A note with that name exists." }),
        /* @__PURE__ */ C(Y, { onClick: () => void E(!0), disabled: i, children: "Replace it (old one to .trash)" })
      ] }) : /* @__PURE__ */ C(Y, { onClick: () => void E(!1), disabled: i, children: "Rename" })
    ] }),
    /* @__PURE__ */ C(it, { failure: a }),
    /* @__PURE__ */ Q("div", { style: { ...x.row, flex: 1, alignItems: "stretch", flexWrap: "nowrap", minHeight: 0 }, children: [
      s !== "preview" && /* @__PURE__ */ C(
        "textarea",
        {
          "aria-label": `Edit ${n.path}`,
          value: n.text,
          readOnly: !y,
          spellCheck: !0,
          onChange: (k) => {
            const K = k.target.value;
            r((w) => w && Fe(w, K));
          },
          onKeyDown: v,
          style: x.textarea
        }
      ),
      s !== "edit" && // Sanitized: markdown-it with html disabled and a URL allowlist (src/markdown.ts).
      /* @__PURE__ */ C("div", { className: "qz-preview", "aria-label": "Preview", style: x.preview, dangerouslySetInnerHTML: { __html: m } })
    ] })
  ] });
}
const at = [
  { id: "notes", label: "Notes" },
  { id: "chat", label: "Chat" }
];
function gs() {
  const t = se(), [A, e] = _("notes"), [n, r] = _(!1), s = (i) => {
    e(i), i === "chat" && r(!0);
  };
  return /* @__PURE__ */ Q(kt, { children: [
    /* @__PURE__ */ C(le, { title: "Quartizo", subtitle: "Markdown workspace" }),
    /* @__PURE__ */ Q("div", { className: "px-6 pb-8 flex-1 min-h-0 flex flex-col gap-3", children: [
      /* @__PURE__ */ C("div", { role: "tablist", "aria-label": "Quartizo", onKeyDown: (i) => {
        var c;
        if (i.key !== "ArrowLeft" && i.key !== "ArrowRight") return;
        i.preventDefault();
        const l = at.findIndex((h) => h.id === A), a = at[(l + (i.key === "ArrowRight" ? 1 : at.length - 1)) % at.length];
        s(a.id), (c = document.getElementById(`qz-tab-${a.id}`)) == null || c.focus();
      }, style: { display: "flex", gap: 4 }, children: at.map((i) => /* @__PURE__ */ C(
        "button",
        {
          id: `qz-tab-${i.id}`,
          type: "button",
          role: "tab",
          "aria-selected": A === i.id,
          "aria-controls": `qz-panel-${i.id}`,
          tabIndex: A === i.id ? 0 : -1,
          onClick: () => s(i.id),
          style: {
            padding: "4px 12px",
            background: "transparent",
            color: "inherit",
            border: "none",
            borderBottom: A === i.id ? "2px solid currentColor" : "2px solid transparent",
            fontWeight: A === i.id ? 600 : 400,
            cursor: "pointer"
          },
          children: i.label
        },
        i.id
      )) }),
      /* @__PURE__ */ C(
        "div",
        {
          id: "qz-panel-notes",
          role: "tabpanel",
          "aria-labelledby": "qz-tab-notes",
          hidden: A !== "notes",
          style: { display: A === "notes" ? "flex" : "none", flexDirection: "column", flex: 1, minHeight: 0 },
          children: /* @__PURE__ */ C(is, { api: t })
        }
      ),
      /* @__PURE__ */ C(
        "div",
        {
          id: "qz-panel-chat",
          role: "tabpanel",
          "aria-labelledby": "qz-tab-chat",
          hidden: A !== "chat",
          style: { display: A === "chat" ? "flex" : "none", flexDirection: "column", flex: 1, minHeight: 0 },
          children: n && /* @__PURE__ */ C(fe, { api: t })
        }
      )
    ] })
  ] });
}
export {
  gs as default
};
