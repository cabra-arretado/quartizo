import { jsx as e, jsxs as r, Fragment as j } from "react/jsx-runtime";
import { useNavigate as ve, useAppApi as Le } from "@kirocrew/app-sdk";
import { useState as g, useEffect as O, useRef as D, useMemo as xe, useCallback as te } from "react";
const V = "/apps/quartizo/api", De = 15e3, Y = ["backlog", "ready", "in_progress", "review", "done"], G = {
  backlog: "Backlog",
  ready: "Ready",
  in_progress: "In Progress",
  review: "Review",
  done: "Done"
};
function Q(t) {
  const n = t;
  if ((n == null ? void 0 : n.name) === "AppApiPermissionError")
    return { code: "permission_denied", message: "Quartizo has not declared access to this API in app.json." };
  const a = typeof (n == null ? void 0 : n.status) == "number" ? n.status : void 0;
  let s;
  if (typeof (n == null ? void 0 : n.body) == "string" && n.body)
    try {
      const i = JSON.parse(n.body);
      i && typeof i == "object" && !Array.isArray(i) && (s = i);
    } catch {
    }
  const c = typeof (s == null ? void 0 : s.code) == "string" ? s.code : void 0, u = typeof (s == null ? void 0 : s.error) == "string" ? s.error : typeof (n == null ? void 0 : n.message) == "string" ? n.message : String(t);
  return { status: a, code: c, message: u };
}
function Z(t, n = De) {
  let a;
  const s = new Promise((c, u) => {
    a = setTimeout(() => u(new Error(`request timed out after ${Math.round(n / 1e3)} s`)), n);
  });
  return Promise.race([t, s]).finally(() => clearTimeout(a));
}
function ke(t) {
  const n = Object.entries(t).filter((a) => a[1] !== void 0 && a[1] !== "").map(([a, s]) => `${encodeURIComponent(a)}=${encodeURIComponent(s)}`);
  return n.length ? `?${n.join("&")}` : "";
}
async function Be(t) {
  return (await t.get(`${V}/workspaces`)).workspaces;
}
async function Ee(t, n, a) {
  return (await t.post(`${V}/workspaces`, a ? { path: n, name: a, companion: !0 } : { path: n, companion: !0 })).workspace;
}
async function Pe(t, n, a = !1) {
  await t.del(`${V}/workspaces/${n}${a ? "?deleteOldTasks=1" : ""}`);
}
const ne = `${V}/companion`;
function we(t) {
  return t.get(ne);
}
function je(t, n, a) {
  return t.put(`${V}/workspaces/${n}/companion`, { enabled: a });
}
function ae(t, n = {}) {
  const a = {};
  return n.workspaceId !== void 0 && (a.workspaceId = n.workspaceId), n.rebuild && (a.rebuild = !0), n.manual && (a.manual = !0), t.post(`${ne}/refresh`, a);
}
function Fe(t, n) {
  return t.get(`${V}/workspaces/${n}/board`);
}
function _e(t, n, a) {
  return t.get(`${ne}/todos${ke({ workspace: a === void 0 ? void 0 : String(a), state: n })}`);
}
const ye = [...Y, "repair"], qe = { ...G, repair: "Needs repair" };
function Ke(t) {
  const n = Object.fromEntries(ye.map((a) => [a, []]));
  for (const a of t) (n[a.lane] ?? n.repair).push(a);
  return n;
}
function Ne(t) {
  var a;
  if (!t) return null;
  if (t.writeBlocked) return t.writeBlocked.message;
  switch (t.state) {
    case "off":
      return "This workspace is not in Kiro Notes companion mode.";
    case "unavailable":
      return `The Markdown index is unavailable: ${typeof t.error == "string" ? t.error : "parsers failed to load"}.`;
    case "unindexed":
      return "Not indexed yet.";
    case "error":
    case "stale": {
      const s = t.error && typeof t.error == "object" ? t.error.message : "the last scan failed";
      return t.state === "stale" ? `The last scan failed (${s}); showing the previous scan.` : `Indexing failed: ${s}.`;
    }
  }
  const n = [];
  return t.migrationPending && n.push("Old task migration is unfinished. Resume it in Settings before editing this workspace."), (a = t.maintenance) != null && a.length && n.push("Some columns have unfinished ordering maintenance. Resume it in Tasks before editing those tickets."), t.complete === !1 ? n.push("The last scan was incomplete (a limit was reached or a folder could not be read): notes it did not reach are shown as last indexed, and none were treated as deleted.") : t.retained && n.push(`${t.retained} note(s) could not be read and are shown as last indexed.`), t.outdated && n.push("This index was built by an older version; refresh to update it."), n.length ? n.join(" ") : null;
}
function Ue(t, n = Date.now()) {
  if (!t) return "";
  if (t.state === "scanning") {
    if (!t.progress) return "Scan queued…";
    const { notes: s, rebuild: c } = t.progress;
    return `Scanning… ${s} ${s === 1 ? "note" : "notes"} read${c ? " (rebuild)" : ""}`;
  }
  if (!t.indexedAt) return "";
  const a = t.files ?? 0;
  return `${a} ${a === 1 ? "note" : "notes"} indexed ${We(t.indexedAt, n)}`;
}
function We(t, n) {
  const a = Math.max(0, Math.round((n - t) / 1e3));
  if (a < 5) return "just now";
  if (a < 60) return `${a} s ago`;
  const s = Math.round(a / 60);
  return s < 60 ? `${s} min ago` : new Date(t).toLocaleString();
}
function He(t, n) {
  const a = n.trim().toLocaleLowerCase();
  if (!a) return [...t];
  const s = [];
  for (const c of t) {
    const i = `${c.title}
${c.path}`.toLocaleLowerCase().includes(a) ? c.items : c.items.filter((h) => `${h.text}
${h.heading ?? ""}`.toLocaleLowerCase().includes(a));
    i.length && s.push({ ...c, items: i });
  }
  return s;
}
function ee(t) {
  return t.trim() || "(empty)";
}
function F(t, n) {
  return `${V}/workspaces/${t}/${n}`;
}
function Qe(t, n, a) {
  return t.get(F(n, "source") + ke({ path: a }));
}
function Ve(t, n, a) {
  return t.post(F(n, "tickets"), a);
}
function Ze(t, n, a) {
  return t.post(F(n, "tickets/promote"), { path: a.path, expectedHash: a.hash });
}
function Ge(t, n, a) {
  return t.post(F(n, "tickets/move"), a);
}
function Je(t, n, a, s) {
  return t.post(F(n.workspaceId, "todos/toggle"), {
    path: n.path,
    expectedHash: n.hash,
    markerStart: a.markerStart,
    line: a.line,
    column: a.column,
    checked: s
  });
}
function Ye(t, n, a, s = !1) {
  return t.post(F(n, "tickets/rebalance"), { status: a, confirm: !0, reconcile: s });
}
function W(t, n) {
  var a, s;
  return t != null && t.writeBlocked ? t.writeBlocked.message : t != null && t.migrationPending ? "Finish the old task migration in Settings before editing this workspace." : !t || t.state !== "ready" || t.complete !== !0 || t.retained || t.outdated || t.error ? "Wait for a complete, current index before editing. Refresh if needed." : n != null && n.status && ((a = t.maintenance) != null && a.includes(n.status)) ? "This column has unfinished order maintenance. Resume maintenance before moving cards." : n && (!n.hash || n.retained || (s = n.diagnostics) != null && s.length) ? "Repair or refresh this note before editing it." : null;
}
function Xe(t, n, a, s) {
  if (!n.hash) throw new Error("Refresh this ticket before moving it.");
  const c = t.filter((o) => o.path !== n.path && o.lane === a);
  if (s !== void 0 && (!Number.isInteger(s) || s < 0 || s > c.length))
    throw new Error("The destination card changed. Refresh before moving this ticket.");
  const u = s ?? c.length, i = c[u - 1], h = c[u], q = (o) => {
    if (!o.hash || o.retained || o.diagnostics.length || !o.id || !o.order) throw new Error("Refresh or repair the destination column before moving cards.");
    return { path: o.path, hash: o.hash };
  };
  return {
    path: n.path,
    expectedHash: n.hash,
    status: a,
    ...i ? { before: q(i) } : {},
    ...h ? { after: q(h) } : {}
  };
}
function et(t, n) {
  return t.get(F(n, "migration"));
}
function tt(t, n, a, s = !1) {
  return t.post(F(n, "migration"), { planHash: a, confirm: !0, ...s ? { acceptCurrent: !0 } : {} });
}
function nt(t, n) {
  return t.get(F(n, "legacy-tasks"));
}
function at(t, n, a) {
  return t.post(F(n, "tickets/demote"), { path: a.path, expectedHash: a.hash });
}
const J = "/md-notebook";
function it(t) {
  return (t.split("/").pop() ?? t).replace(/\.md$/i, "");
}
const rt = {
  gem: /* @__PURE__ */ e("path", { d: "M8 4h8l4.5 5L12 21 3.5 9 8 4Zm-4.5 5h17M8 4l1 5 3 12 3-12 1-5" }),
  board: /* @__PURE__ */ r(j, { children: [
    /* @__PURE__ */ e("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }),
    /* @__PURE__ */ e("path", { d: "M9 4v16m6-16v16M6 8h.1M12 8h.1m6 0h.1" })
  ] }),
  checklist: /* @__PURE__ */ e("path", { d: "m3 6 2 2 3-4m3 3h10M3 13l2 2 3-4m3 3h10M3 20h5m3 0h10" }),
  settings: /* @__PURE__ */ r(j, { children: [
    /* @__PURE__ */ e("path", { d: "M4 6h7m4 0h5M4 12h3m4 0h9M4 18h11m4 0h1" }),
    /* @__PURE__ */ e("circle", { cx: "13", cy: "6", r: "2" }),
    /* @__PURE__ */ e("circle", { cx: "9", cy: "12", r: "2" }),
    /* @__PURE__ */ e("circle", { cx: "17", cy: "18", r: "2" })
  ] }),
  plus: /* @__PURE__ */ e("path", { d: "M12 5v14M5 12h14" }),
  note: /* @__PURE__ */ e("path", { d: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M8 13h8m-8 4h6" }),
  external: /* @__PURE__ */ e("path", { d: "M13 5h6v6m0-6-9 9m8-1v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" }),
  refresh: /* @__PURE__ */ e("path", { d: "M20 11a8 8 0 1 0-2.2 6.6M20 4v7h-7" }),
  folder: /* @__PURE__ */ e("path", { d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" }),
  more: /* @__PURE__ */ r(j, { children: [
    /* @__PURE__ */ e("circle", { cx: "5", cy: "12", r: "1" }),
    /* @__PURE__ */ e("circle", { cx: "12", cy: "12", r: "1" }),
    /* @__PURE__ */ e("circle", { cx: "19", cy: "12", r: "1" })
  ] }),
  copy: /* @__PURE__ */ r(j, { children: [
    /* @__PURE__ */ e("rect", { x: "8", y: "8", width: "12", height: "12", rx: "2" }),
    /* @__PURE__ */ e("path", { d: "M16 4H6a2 2 0 0 0-2 2v10" })
  ] }),
  search: /* @__PURE__ */ r(j, { children: [
    /* @__PURE__ */ e("circle", { cx: "10.5", cy: "10.5", r: "5.5" }),
    /* @__PURE__ */ e("path", { d: "m15 15 5 5" })
  ] }),
  up: /* @__PURE__ */ e("path", { d: "m6 14 6-6 6 6" }),
  down: /* @__PURE__ */ e("path", { d: "m6 10 6 6 6-6" }),
  check: /* @__PURE__ */ e("path", { d: "m5 12 4 4L19 6" }),
  minus: /* @__PURE__ */ e("path", { d: "M5 12h14" })
};
function T({ name: t }) {
  return /* @__PURE__ */ e(
    "svg",
    {
      className: "qz-icon",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.7",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: rt[t]
    }
  );
}
function L({ failure: t }) {
  return t ? /* @__PURE__ */ e("div", { role: "alert", className: "qz-notice qz-error", "data-code": t.code, children: t.message }) : null;
}
function fe() {
  try {
    return window.localStorage;
  } catch {
    return;
  }
}
const st = 1500, ot = 3e4, be = "quartizo:workspace";
function lt() {
  const [t, n] = g(() => typeof document > "u" || document.visibilityState !== "hidden");
  return O(() => {
    const a = () => n(document.visibilityState !== "hidden");
    return document.addEventListener("visibilitychange", a), () => document.removeEventListener("visibilitychange", a);
  }, []), t;
}
function Ce(t, n = !0) {
  const [a, s] = g(null), [c, u] = g(null);
  return O(() => {
    if (!n) return;
    let i = !1;
    return we(t).then((h) => {
      i || (s(h.workspaces.filter((q) => q.workspace.companion)), u(h.available ? null : { message: h.error ?? "The Markdown index is unavailable." }));
    }).catch((h) => !i && u(Q(h))), () => {
      i = !0;
    };
  }, [t, n]), { companions: a, failure: c };
}
function Te(t, n, a, s, c) {
  const u = lt(), [i, h] = g(null), [q, o] = g(null), [z, f] = g(0), [w, S] = g(!1), m = D(null), y = D(a), x = D(s), p = D(c);
  y.current = a, x.current = s, p.current = c, O(() => {
    m.current = null, h(null), o(null);
  }, [n]), O(() => {
    if (!t || !u) return;
    let $ = !1, M, A = !0;
    const _ = async () => {
      try {
        (A || !m.current || !p.current(m.current)) && await Z(x.current(!1));
        const d = await Z(y.current());
        if ($) return;
        m.current = d, h(d), o(null), S(!1);
      } catch (d) {
        $ || (o(Q(d)), S(!1));
      }
      A = !1, $ || (M = setTimeout(_, m.current && p.current(m.current) ? st : ot));
    };
    return _(), () => {
      $ = !0, clearTimeout(M);
    };
  }, [t, u, n, z]);
  const b = te(async () => {
    S(!0);
    try {
      await Z(x.current(!0)), o(null), f(($) => $ + 1);
    } catch ($) {
      o(Q($));
    } finally {
      S(!1);
    }
  }, []), N = te(() => {
    m.current = null, S(!0), f(($) => $ + 1);
  }, []);
  return { data: i, failure: q, busy: w, refresh: b, reload: N };
}
function Se({ statuses: t }) {
  const n = Date.now(), a = t.map((s) => Ue(s, n)).filter(Boolean);
  return /* @__PURE__ */ e("span", { className: "qz-index", role: "status", children: a.length > 0 && /* @__PURE__ */ r(j, { children: [
    /* @__PURE__ */ e("span", { className: "qz-dot", "data-attention": t.some((s) => s.state === "scanning" || !!Ne(s)) }),
    a.join(" · ")
  ] }) });
}
function $e({ statuses: t }) {
  const n = new Set(t.map(Ne).filter(Boolean));
  return /* @__PURE__ */ e(j, { children: [...n].map((a) => /* @__PURE__ */ e("div", { role: "note", className: "qz-notice", children: a }, a)) });
}
function Me({ path: t, compact: n = !1 }) {
  const a = it(t), [s, c] = g("idle");
  O(() => {
    if (s === "idle") return;
    const i = setTimeout(() => c("idle"), 1500);
    return () => clearTimeout(i);
  }, [s]);
  const u = async () => {
    try {
      await navigator.clipboard.writeText(a), c("copied");
    } catch {
      c("failed");
    }
  };
  return /* @__PURE__ */ r(j, { children: [
    /* @__PURE__ */ r(
      "button",
      {
        type: "button",
        className: `qz-button${n ? " qz-icon-button" : ""}`,
        "data-variant": "quiet",
        onClick: () => void u(),
        "aria-label": `Copy note name “${a}”`,
        title: `Copy note name “${a}”`,
        children: [
          /* @__PURE__ */ e(T, { name: s === "copied" ? "check" : "copy" }),
          (!n || s !== "idle") && (s === "copied" ? "Copied" : s === "failed" ? "Copy failed" : "Copy name")
        ]
      }
    ),
    /* @__PURE__ */ e("span", { className: "qz-visually-hidden", role: "status", children: s === "copied" ? "Note name copied." : s === "failed" ? "Could not copy note name." : "" })
  ] });
}
function Re({ onSettings: t }) {
  return /* @__PURE__ */ r("div", { className: "qz-empty", children: [
    /* @__PURE__ */ e("span", { className: "qz-empty-icon", children: /* @__PURE__ */ e(T, { name: "folder" }) }),
    /* @__PURE__ */ e("h2", { children: "Connect a notes folder" }),
    /* @__PURE__ */ e("p", { children: "Share a folder from Kiro Notes to see its tickets and TODOs here." }),
    /* @__PURE__ */ e("button", { type: "button", className: "qz-button", "data-variant": "primary", onClick: t, children: "Open Settings" })
  ] });
}
function ct(t) {
  var h, q;
  const n = t.active ?? !0, { companions: a, failure: s } = Ce(t.api, n), [c, u] = g(() => {
    var z;
    const o = Number((z = fe()) == null ? void 0 : z.getItem(be));
    return Number.isInteger(o) && o > 0 ? o : null;
  }), i = ((h = a == null ? void 0 : a.find((o) => o.workspace.id === c)) == null ? void 0 : h.workspace) ?? ((q = a == null ? void 0 : a[0]) == null ? void 0 : q.workspace) ?? null;
  return O(() => {
    var o;
    try {
      i && ((o = fe()) == null || o.setItem(be, String(i.id)));
    } catch {
    }
  }, [i]), s && !a ? /* @__PURE__ */ e(L, { failure: s }) : a ? i ? /* @__PURE__ */ r("div", { className: "qz-stack", children: [
    /* @__PURE__ */ e(L, { failure: s }),
    /* @__PURE__ */ r("div", { className: "qz-view-heading", children: [
      /* @__PURE__ */ r("div", { children: [
        /* @__PURE__ */ e("h2", { className: "qz-section-title", children: "Task board" }),
        /* @__PURE__ */ e("p", { className: "qz-section-description", children: "Plan and track tickets stored in Kiro Notes." })
      ] }),
      /* @__PURE__ */ r("label", { className: "qz-inline-field", children: [
        /* @__PURE__ */ e(T, { name: "folder" }),
        /* @__PURE__ */ e("span", { children: "Workspace" }),
        /* @__PURE__ */ e("select", { className: "qz-input", value: i.id, onChange: (o) => u(Number(o.target.value)), children: a.map((o) => /* @__PURE__ */ e("option", { value: o.workspace.id, children: o.workspace.name }, o.workspace.id)) })
      ] })
    ] }),
    a.map(({ workspace: o }) => /* @__PURE__ */ e("div", { hidden: o.id !== i.id, children: /* @__PURE__ */ e(dt, { api: t.api, workspace: o, active: n && o.id === i.id }) }, o.uid))
  ] }) : /* @__PURE__ */ e(Re, { onSettings: t.onSettings }) : /* @__PURE__ */ e("p", { className: "qz-empty", role: "status", children: "Loading workspaces…" });
}
function ie(t) {
  const [n, a] = g(!1), [s, c] = g(null), u = D(!0), i = D(!1);
  return O(() => (u.current = !0, () => {
    u.current = !1;
  }), []), { pending: n, failure: s, run: async (q) => {
    if (i.current) return !1;
    i.current = !0, a(!0), c(null);
    try {
      return await Z(q()), u.current && t(), !0;
    } catch (o) {
      if (u.current) {
        const z = Q(o);
        z.status === 409 && (z.message += " Refresh to review the current file, then retry your change."), (z.message.includes("timed out") || !z.status) && (z.message += " The result may be unknown; refresh and check the file before retrying."), c(z);
      }
      return !1;
    } finally {
      i.current = !1, u.current && a(!1);
    }
  } };
}
function dt(t) {
  var ue, pe, he, me;
  const { api: n, workspace: a, active: s } = t, c = a.id, u = ve(), { data: i, failure: h, busy: q, refresh: o, reload: z } = Te(
    s,
    String(c),
    () => Fe(n, c),
    (l) => ae(n, { workspaceId: c, manual: l }),
    (l) => l.index.state === "scanning"
  ), f = ie(z), w = xe(() => Ke((i == null ? void 0 : i.tickets) ?? []), [i]), S = ye.filter((l) => l !== "repair" || w.repair.length > 0), m = D(null), y = D(null), [x, p] = g(null), b = D(null);
  O(() => {
    var l;
    x && ((l = b.current) == null || l.focus());
  }, [x]);
  const [N, $] = g(!1), M = !s || !!h || q || f.pending || N || !!W(i == null ? void 0 : i.index), [A, _] = g("backlog"), [d, k] = g(!1), [K, C] = g(!1), [U, se] = g(!1), oe = i ? [i.index] : [], Oe = te((l) => {
    _(l), se(!0);
  }, []), [X, le] = g(null);
  O(() => {
    var B;
    if (!X || M || !i) return;
    const l = Array.from(((B = m.current) == null ? void 0 : B.querySelectorAll("[data-note-path]")) ?? []).find((v) => v.dataset.notePath === X);
    l == null || l.focus(), le(null);
  }, [X, M, i]);
  const ce = (l, B, v) => {
    var E;
    M || W(i == null ? void 0 : i.index, l) || !i || (E = i.index.maintenance) != null && E.includes(B) || f.run(() => Ge(n, c, Xe(i.tickets, l, B, v))).then((R) => {
      R && le(l.path);
    });
  }, de = (l, B, v) => {
    l.preventDefault(), l.stopPropagation();
    const E = y.current;
    if (y.current = null, !E || (v == null ? void 0 : v.path) === E.path) return;
    const R = w[B].filter((P) => P.path !== E.path), I = v ? R.findIndex((P) => P.path === v.path) : void 0;
    I !== void 0 && I < 0 || ce(E, B, I);
  }, Ae = (l) => {
    var ge, ze;
    const B = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"], v = l.target;
    if (!v.hasAttribute("data-lane")) return;
    const E = Number(v.dataset.lane), R = Number(v.dataset.index);
    if (!B.includes(l.key) || Number.isNaN(E) || Number.isNaN(R)) return;
    let I = E, P = R;
    if (l.key === "ArrowUp" && (P = Math.max(0, R - 1)), l.key === "ArrowDown" && (P = R + 1), l.key === "Home" && (P = 0), l.key === "End" && (P = Number.MAX_SAFE_INTEGER), l.key === "ArrowLeft" || l.key === "ArrowRight") {
      const Ie = l.key === "ArrowLeft" ? -1 : 1;
      do
        I += Ie;
      while (I >= 0 && I < S.length && w[S[I]].length === 0);
      if (I < 0 || I >= S.length) return;
    }
    P = Math.min(P, w[S[I]].length - 1), l.preventDefault(), (ze = (ge = m.current) == null ? void 0 : ge.querySelector(`[data-lane="${I}"][data-index="${P}"]`)) == null || ze.focus();
  };
  return /* @__PURE__ */ r("div", { className: "qz-stack", children: [
    /* @__PURE__ */ r("div", { className: "qz-toolbar", children: [
      /* @__PURE__ */ r("div", { className: "qz-actions", children: [
        /* @__PURE__ */ r(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "primary",
            "aria-expanded": x === "create",
            onClick: () => p(x === "create" ? null : "create"),
            disabled: f.pending || N,
            children: [
              /* @__PURE__ */ e(T, { name: "plus" }),
              "New ticket"
            ]
          }
        ),
        /* @__PURE__ */ r(
          "button",
          {
            type: "button",
            className: "qz-button",
            "aria-expanded": x === "promote",
            onClick: () => p(x === "promote" ? null : "promote"),
            disabled: f.pending || N,
            children: [
              /* @__PURE__ */ e(T, { name: "note" }),
              "Use existing note"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ r("div", { className: "qz-actions", children: [
        /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            "aria-expanded": U,
            onClick: () => se((l) => !l),
            disabled: M,
            children: "Rebalance…"
          }
        ),
        /* @__PURE__ */ r("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => u(J), children: [
          /* @__PURE__ */ e(T, { name: "external" }),
          "Open Kiro Notes"
        ] })
      ] })
    ] }),
    ["create", "promote"].map((l) => /* @__PURE__ */ e("div", { hidden: x !== l, children: /* @__PURE__ */ e(ut, { mode: l, api: n, workspace: a, firstField: x === l ? b : void 0, disabled: !s || !!h || q || f.pending || !!W(i == null ? void 0 : i.index), maintenance: (i == null ? void 0 : i.index.maintenance) ?? [], onBusy: $, onChanged: z, onClose: () => p(null), onMaintenanceNeeded: Oe }) }, l)),
    /* @__PURE__ */ r("div", { className: "qz-toolbar qz-board-meta", children: [
      i && /* @__PURE__ */ r("span", { className: "qz-result-count", children: [
        i.tickets.length,
        " ",
        i.tickets.length === 1 ? "ticket" : "tickets"
      ] }),
      /* @__PURE__ */ r("div", { className: "qz-actions", children: [
        /* @__PURE__ */ e(Se, { statuses: oe }),
        /* @__PURE__ */ r("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => void o(), disabled: q || f.pending, children: [
          /* @__PURE__ */ e(T, { name: "refresh" }),
          "Refresh"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ e($e, { statuses: oe }),
    /* @__PURE__ */ e(L, { failure: h }),
    /* @__PURE__ */ e(L, { failure: f.failure }),
    W(i == null ? void 0 : i.index) && i && /* @__PURE__ */ e("div", { role: "note", className: "qz-notice", children: W(i.index) }),
    U || ((ue = f.failure) == null ? void 0 : ue.code) === "rank_exhausted" || ((pe = f.failure) == null ? void 0 : pe.code) === "maintenance_pending" || (he = i == null ? void 0 : i.index.maintenance) != null && he.length ? /* @__PURE__ */ r("div", { className: "qz-notice qz-stack", children: [
      /* @__PURE__ */ e("p", { children: "Rebalance a column to restore space between card positions. Progress is saved if interrupted." }),
      /* @__PURE__ */ r("div", { className: "qz-actions", children: [
        /* @__PURE__ */ e("select", { className: "qz-input", "aria-label": "Column to rebalance", value: A, onChange: (l) => _(l.target.value), children: Y.map((l) => /* @__PURE__ */ e("option", { value: l, children: G[l] }, l)) }),
        /* @__PURE__ */ e("button", { type: "button", className: "qz-button", onClick: () => k(!0), disabled: !s || f.pending || !!(i != null && i.index.writeBlocked), children: "Review column…" })
      ] }),
      d && /* @__PURE__ */ r("div", { className: "qz-stack", role: "alertdialog", "aria-label": "Rebalance column", children: [
        /* @__PURE__ */ e("p", { children: "Update ordering in each note of this column? Other editors may see progress before all files finish." }),
        !!((me = i == null ? void 0 : i.index.maintenance) != null && me.includes(A)) && /* @__PURE__ */ r("label", { className: "qz-check-label", children: [
          /* @__PURE__ */ e("input", { type: "checkbox", checked: K, onChange: (l) => C(l.target.checked), disabled: f.pending }),
          "Keep the latest note contents and resume ordering after an external edit"
        ] }),
        /* @__PURE__ */ r("div", { className: "qz-actions", children: [
          /* @__PURE__ */ e("button", { type: "button", className: "qz-button", disabled: !s || f.pending || !!(i != null && i.index.writeBlocked), onClick: () => void f.run(() => Ye(n, c, A, K)).then((l) => {
            l && (k(!1), C(!1));
          }), children: "Rebalance column" }),
          /* @__PURE__ */ e("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: f.pending, onClick: () => k(!1), children: "Cancel" })
        ] })
      ] })
    ] }) : null,
    !i && !h && /* @__PURE__ */ e("p", { className: "qz-empty", role: "status", children: "Loading the board…" }),
    i && i.tickets.length === 0 && i.index.state !== "scanning" && /* @__PURE__ */ r("p", { className: "qz-notice", "data-variant": "neutral", children: [
      "No tickets in “",
      a.name,
      "” yet. Create a ticket or use an existing note."
    ] }),
    i && /* @__PURE__ */ e("div", { ref: m, className: "qz-board", tabIndex: 0, onKeyDown: Ae, "aria-label": `Board of ${a.name}`, role: "group", children: S.map((l, B) => /* @__PURE__ */ r(
      "section",
      {
        "aria-label": qe[l],
        className: "qz-lane",
        "data-lane-status": l,
        onDragOver: (v) => {
          !M && l !== "repair" && v.preventDefault();
        },
        onDrop: (v) => {
          l !== "repair" && de(v, l);
        },
        children: [
          /* @__PURE__ */ r("h3", { className: "qz-lane-heading", children: [
            /* @__PURE__ */ e("span", { className: "qz-dot" }),
            qe[l],
            /* @__PURE__ */ e("span", { className: "qz-count", children: w[l].length })
          ] }),
          w[l].length === 0 && /* @__PURE__ */ e("p", { className: "qz-lane-empty", children: "No tickets" }),
          /* @__PURE__ */ e("ul", { className: "qz-cards", children: w[l].map((v, E) => /* @__PURE__ */ e(
            "li",
            {
              draggable: !M && !W(i.index, v),
              onDragStart: (R) => {
                y.current = v, R.dataTransfer.setData("text/plain", v.path), R.dataTransfer.effectAllowed = "move";
              },
              onDragEnd: () => {
                y.current = null;
              },
              onDragOver: (R) => {
                !M && l !== "repair" && R.preventDefault();
              },
              onDrop: (R) => {
                l !== "repair" && de(R, l, v);
              },
              children: /* @__PURE__ */ e(
                pt,
                {
                  ticket: v,
                  lane: B,
                  index: E,
                  onOpen: () => u(J),
                  disabled: M || !!W(i.index, v),
                  maintenance: i.index.maintenance ?? [],
                  onMove: (R, I) => ce(v, R, I),
                  onDemote: () => {
                    window.confirm(`Remove “${v.title}” from the board? Its note and TODOs will remain.`) && f.run(() => at(n, c, v));
                  },
                  count: w[l].length
                }
              )
            },
            v.path
          )) })
        ]
      },
      l
    )) })
  ] });
}
function ut(t) {
  const [n, a] = g(""), [s, c] = g(""), [u, i] = g(""), [h, q] = g("backlog"), [o, z] = g(null), [f, w] = g(null), [S, m] = g(!1), y = D(0), x = D(!0);
  O(() => (x.current = !0, () => {
    x.current = !1, y.current++;
  }), []);
  const p = ie(t.onChanged);
  O(() => (t.onBusy(p.pending), () => t.onBusy(!1)), [p.pending, t.onBusy]);
  const b = t.disabled || p.pending || S, N = t.maintenance.includes(t.mode === "promote" ? "backlog" : h);
  O(() => {
    var C, U;
    (((C = p.failure) == null ? void 0 : C.code) === "rank_exhausted" || ((U = p.failure) == null ? void 0 : U.code) === "maintenance_pending") && t.onMaintenanceNeeded(t.mode === "promote" ? "backlog" : h);
  }, [p.failure, t.mode, t.onMaintenanceNeeded, h]);
  const $ = () => {
    y.current++, m(!1), a(""), c(""), i(""), z(null), w(null), t.onClose();
  }, M = n.trim().endsWith(".md") ? n.trim() : `${n.trim()}.md`, A = async () => {
    const C = ++y.current;
    m(!0), w(null), z(null);
    try {
      const U = await Z(Qe(t.api, t.workspace.id, M));
      x.current && C === y.current && z(U);
    } catch (U) {
      x.current && C === y.current && w(Q(U));
    } finally {
      x.current && C === y.current && m(!1);
    }
  }, _ = async () => {
    await p.run(() => t.mode === "create" ? Ve(t.api, t.workspace.id, { path: M, title: s.trim(), body: u, status: h }) : Ze(t.api, t.workspace.id, o)) && x.current && (a(""), c(""), i(""), z(null), t.onClose());
  }, d = t.mode === "create", k = d ? "New ticket" : "Use existing note", K = !b && !N && !!n.trim() && (d ? !!s.trim() : !!o);
  return /* @__PURE__ */ r("section", { className: "qz-panel-surface qz-ticket-form", "aria-label": k, children: [
    /* @__PURE__ */ e("h3", { children: k }),
    /* @__PURE__ */ r("form", { className: "qz-stack", onSubmit: (C) => {
      C.preventDefault(), K && _();
    }, children: [
      d && /* @__PURE__ */ r("label", { className: "qz-field", children: [
        "Title",
        /* @__PURE__ */ e("input", { className: "qz-input", ref: t.firstField, "aria-label": "Ticket title", placeholder: "Fix login", value: s, disabled: p.pending, onChange: (C) => c(C.target.value) })
      ] }),
      /* @__PURE__ */ r("label", { className: "qz-field", children: [
        "Note path in ",
        t.workspace.name,
        /* @__PURE__ */ e(
          "input",
          {
            className: "qz-input",
            ref: d ? void 0 : t.firstField,
            "aria-label": "Ticket note path",
            placeholder: "tickets/fix-login.md",
            value: n,
            disabled: p.pending,
            onChange: (C) => {
              y.current++, m(!1), a(C.target.value), z(null);
            }
          }
        )
      ] }),
      d ? /* @__PURE__ */ r(j, { children: [
        /* @__PURE__ */ r("label", { className: "qz-field", children: [
          /* @__PURE__ */ r("span", { children: [
            "Description ",
            /* @__PURE__ */ e("span", { className: "qz-muted", children: "· Optional Markdown" })
          ] }),
          /* @__PURE__ */ e("textarea", { className: "qz-input", "aria-label": "Ticket description", placeholder: "What needs to happen?", value: u, disabled: p.pending, onChange: (C) => i(C.target.value), rows: 4 })
        ] }),
        /* @__PURE__ */ r("label", { className: "qz-field", children: [
          "Initial status",
          /* @__PURE__ */ e("select", { className: "qz-input", value: h, disabled: p.pending, onChange: (C) => q(C.target.value), children: Y.map((C) => /* @__PURE__ */ e("option", { value: C, children: G[C] }, C)) })
        ] })
      ] }) : /* @__PURE__ */ r(j, { children: [
        /* @__PURE__ */ e("div", { className: "qz-actions", children: /* @__PURE__ */ e("button", { type: "button", className: "qz-button", disabled: b || !n.trim(), onClick: () => void A(), children: "Preview note" }) }),
        o && /* @__PURE__ */ r(j, { children: [
          /* @__PURE__ */ e("pre", { className: "qz-mono qz-note-preview", children: o.content }),
          /* @__PURE__ */ e("p", { className: "qz-muted", children: "The note will appear in Backlog. Its content and existing properties are preserved." })
        ] })
      ] }),
      N && /* @__PURE__ */ e("span", { className: "qz-notice", children: "Resume ordering maintenance for this column before adding a ticket." }),
      /* @__PURE__ */ e(L, { failure: f }),
      /* @__PURE__ */ e(L, { failure: p.failure }),
      /* @__PURE__ */ r("div", { className: "qz-actions", children: [
        /* @__PURE__ */ e("button", { type: "submit", className: "qz-button", "data-variant": "primary", disabled: !K, children: d ? "Create ticket" : "Make ticket" }),
        /* @__PURE__ */ e("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: p.pending, onClick: $, children: "Cancel" })
      ] })
    ] })
  ] });
}
function pt(t) {
  const { ticket: n } = t;
  return /* @__PURE__ */ r("article", { className: "qz-ticket", children: [
    /* @__PURE__ */ r("div", { className: "qz-ticket-content", children: [
      /* @__PURE__ */ r("button", { type: "button", className: "qz-note-link", "data-lane": t.lane, "data-index": t.index, "data-note-path": n.path, "aria-label": `Open Kiro Notes: ${n.title}`, onClick: t.onOpen, children: [
        n.title,
        /* @__PURE__ */ e(T, { name: "external" })
      ] }),
      /* @__PURE__ */ e("span", { className: "qz-mono qz-path", title: n.path, children: n.path }),
      n.todos.total > 0 && /* @__PURE__ */ r("div", { className: "qz-ticket-progress", children: [
        /* @__PURE__ */ e("progress", { value: n.todos.done, max: n.todos.total, "aria-label": `Checklist progress for ${n.title}` }),
        /* @__PURE__ */ r("span", { title: "Completed TODOs", children: [
          n.todos.done,
          "/",
          n.todos.total
        ] })
      ] }),
      n.diagnostics.length > 0 && /* @__PURE__ */ e("div", { className: "qz-actions", children: n.diagnostics.map((a) => /* @__PURE__ */ e("span", { className: "qz-badge", title: a.message, children: a.code.replace(/_/g, " ") }, a.code)) })
    ] }),
    /* @__PURE__ */ r("div", { className: "qz-ticket-footer", children: [
      /* @__PURE__ */ e("div", { className: "qz-ticket-status", children: /* @__PURE__ */ r(
        "select",
        {
          className: "qz-input",
          "aria-label": `Move ${n.title} to column`,
          title: "Move to column",
          value: n.status ?? "",
          disabled: t.disabled,
          onChange: (a) => t.onMove(a.target.value),
          children: [
            !n.status && /* @__PURE__ */ e("option", { value: "", children: "Needs repair" }),
            Y.map((a) => /* @__PURE__ */ e("option", { value: a, disabled: t.maintenance.includes(a), children: G[a] }, a))
          ]
        }
      ) }),
      /* @__PURE__ */ r("details", { className: "qz-ticket-actions", children: [
        /* @__PURE__ */ e("summary", { className: "qz-button qz-icon-button", "data-variant": "quiet", "aria-label": `Actions for ${n.title}`, title: "Ticket actions", children: /* @__PURE__ */ e(T, { name: "more" }) }),
        /* @__PURE__ */ r("div", { className: "qz-ticket-action-list", children: [
          /* @__PURE__ */ e(Me, { path: n.path }),
          /* @__PURE__ */ r("button", { type: "button", className: "qz-button", "data-variant": "quiet", "aria-label": `Move ${n.title} up`, disabled: t.disabled || t.index === 0 || !n.status, onClick: () => n.status && t.onMove(n.status, t.index - 1), children: [
            /* @__PURE__ */ e(T, { name: "up" }),
            "Move up"
          ] }),
          /* @__PURE__ */ r("button", { type: "button", className: "qz-button", "data-variant": "quiet", "aria-label": `Move ${n.title} down`, disabled: t.disabled || t.index >= t.count - 1 || !n.status, onClick: () => n.status && t.onMove(n.status, t.index + 1), children: [
            /* @__PURE__ */ e(T, { name: "down" }),
            "Move down"
          ] }),
          /* @__PURE__ */ r("button", { type: "button", className: "qz-button qz-destructive", "data-variant": "quiet", "aria-label": `Remove ${n.title} from board`, disabled: t.disabled, onClick: t.onDemote, children: [
            /* @__PURE__ */ e(T, { name: "minus" }),
            "Remove ticket…"
          ] })
        ] })
      ] })
    ] })
  ] });
}
function ht(t) {
  const { api: n } = t, a = ve(), { companions: s, failure: c } = Ce(n), [u, i] = g("all"), [h, q] = g("open"), [o, z] = g(""), f = D(null);
  O(() => {
    s && u !== "all" && !s.some((d) => d.workspace.id === u) && i("all");
  }, [s, u]);
  const w = u === "all" ? void 0 : u, S = !!s && s.length > 0, { data: m, failure: y, busy: x, refresh: p, reload: b } = Te(
    S,
    `${u}:${h}`,
    () => _e(n, h, w),
    (d) => ae(n, { workspaceId: w, manual: d }),
    (d) => Object.values(d.index).some((k) => k.state === "scanning")
  ), N = xe(() => He((m == null ? void 0 : m.groups) ?? [], o), [m, o]), $ = N.reduce((d, k) => d + k.items.length, 0), M = m ? Object.values(m.index) : [], A = ie(b), _ = (d, k, K) => {
    A.pending || y || x || W(m == null ? void 0 : m.index[String(d.workspaceId)], d) || k.markerStart === void 0 || A.run(() => Je(n, d, k, K));
  };
  return c ? /* @__PURE__ */ e(L, { failure: c }) : s ? s.length === 0 ? /* @__PURE__ */ e(Re, { onSettings: t.onSettings }) : /* @__PURE__ */ r("div", { className: "qz-stack qz-todos", children: [
    /* @__PURE__ */ r("div", { className: "qz-view-heading", children: [
      /* @__PURE__ */ r("div", { children: [
        /* @__PURE__ */ e("h2", { className: "qz-section-title", children: "Note checklists" }),
        /* @__PURE__ */ e("p", { className: "qz-section-description", children: "Find and complete Markdown TODOs across your shared folders." })
      ] }),
      /* @__PURE__ */ r("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => a(J), children: [
        /* @__PURE__ */ e(T, { name: "external" }),
        "Open Kiro Notes"
      ] })
    ] }),
    /* @__PURE__ */ r("div", { className: "qz-todo-filters qz-panel-surface", children: [
      /* @__PURE__ */ r("label", { className: "qz-field", children: [
        "Search",
        /* @__PURE__ */ r("span", { className: "qz-search", children: [
          /* @__PURE__ */ e(T, { name: "search" }),
          /* @__PURE__ */ e("input", { className: "qz-input", ref: f, type: "search", "aria-label": "Filter TODOs", placeholder: "Search tasks or notes…", value: o, onChange: (d) => z(d.target.value) })
        ] })
      ] }),
      s.length > 1 && /* @__PURE__ */ r("label", { className: "qz-field", children: [
        "Workspace",
        /* @__PURE__ */ r("select", { className: "qz-input", value: u, onChange: (d) => i(d.target.value === "all" ? "all" : Number(d.target.value)), children: [
          /* @__PURE__ */ e("option", { value: "all", children: "All workspaces" }),
          s.map((d) => /* @__PURE__ */ e("option", { value: d.workspace.id, children: d.workspace.name }, d.workspace.id))
        ] })
      ] }),
      /* @__PURE__ */ r("label", { className: "qz-field", children: [
        "Show",
        /* @__PURE__ */ r("select", { className: "qz-input", value: h, onChange: (d) => q(d.target.value), children: [
          /* @__PURE__ */ e("option", { value: "open", children: "Open" }),
          /* @__PURE__ */ e("option", { value: "done", children: "Completed" }),
          /* @__PURE__ */ e("option", { value: "all", children: "All" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ r("div", { className: "qz-toolbar qz-board-meta", children: [
      m && /* @__PURE__ */ r("span", { className: "qz-result-count", role: "status", children: [
        $,
        " ",
        $ === 1 ? "item" : "items",
        " in ",
        N.length,
        " ",
        N.length === 1 ? "note" : "notes"
      ] }),
      /* @__PURE__ */ r("div", { className: "qz-actions", children: [
        /* @__PURE__ */ e(Se, { statuses: M }),
        /* @__PURE__ */ r("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => void p(), disabled: x || A.pending, children: [
          /* @__PURE__ */ e(T, { name: "refresh" }),
          "Refresh"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ e($e, { statuses: M }),
    /* @__PURE__ */ e(L, { failure: y }),
    /* @__PURE__ */ e(L, { failure: A.failure }),
    (m == null ? void 0 : m.truncated) && /* @__PURE__ */ e("div", { role: "note", className: "qz-notice", children: "Only the first items are listed. Narrow the list by workspace or completion status." }),
    !m && !y && /* @__PURE__ */ e("p", { className: "qz-empty", role: "status", children: "Loading TODOs…" }),
    m && N.length === 0 && /* @__PURE__ */ r("div", { className: "qz-empty", children: [
      /* @__PURE__ */ e("span", { className: "qz-empty-icon", children: /* @__PURE__ */ e(T, { name: o.trim() ? "search" : "checklist" }) }),
      /* @__PURE__ */ e("h3", { children: o.trim() ? "No matching TODOs" : "No TODOs to show" }),
      /* @__PURE__ */ e("p", { children: o.trim() ? "Try a different search or clear the filter." : "Choose a different workspace or completion status to see more." }),
      o.trim() && /* @__PURE__ */ e("button", { type: "button", className: "qz-button", onClick: () => {
        var d;
        z(""), (d = f.current) == null || d.focus();
      }, children: "Clear search" })
    ] }),
    /* @__PURE__ */ e("div", { className: "qz-stack", children: N.map((d) => /* @__PURE__ */ r("section", { "aria-label": d.title, className: "qz-todo-note qz-panel-surface", children: [
      /* @__PURE__ */ r("header", { className: "qz-todo-header", children: [
        /* @__PURE__ */ e("span", { className: "qz-note-icon", children: /* @__PURE__ */ e(T, { name: "note" }) }),
        /* @__PURE__ */ r("div", { className: "qz-todo-identity", children: [
          /* @__PURE__ */ r("h3", { children: [
            d.title,
            d.ticket && d.status && /* @__PURE__ */ r("span", { className: "qz-status-pill", "data-lane-status": d.status, children: [
              /* @__PURE__ */ e("span", { className: "qz-dot" }),
              G[d.status]
            ] })
          ] }),
          /* @__PURE__ */ r("p", { className: "qz-todo-meta", children: [
            /* @__PURE__ */ e("span", { children: d.workspace }),
            /* @__PURE__ */ e("span", { "aria-hidden": "true", children: "/" }),
            /* @__PURE__ */ e("span", { className: "qz-mono qz-path", title: d.path, children: d.path })
          ] })
        ] }),
        /* @__PURE__ */ e(Me, { path: d.path, compact: !0 })
      ] }),
      /* @__PURE__ */ e("ul", { className: "qz-todo-list", children: d.items.map((k) => /* @__PURE__ */ r("li", { className: "qz-todo-row", "data-checked": k.checked, style: { paddingInlineStart: `${Math.min(k.depth, 4) * 0.8}rem` }, children: [
        /* @__PURE__ */ r("label", { className: "qz-todo-check", children: [
          /* @__PURE__ */ e(
            "input",
            {
              type: "checkbox",
              "aria-label": `Complete ${ee(k.text)}`,
              checked: k.checked,
              disabled: A.pending || !!y || x || !!W(m == null ? void 0 : m.index[String(d.workspaceId)], d) || k.markerStart === void 0,
              onChange: (K) => _(d, k, K.target.checked)
            }
          ),
          /* @__PURE__ */ e("span", { children: ee(k.text) })
        ] }),
        /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            title: `Open Kiro Notes · ${d.path}:${k.line}:${k.column}${k.heading ? ` · ${k.heading}` : ""}`,
            "aria-label": `Open Kiro Notes: ${ee(k.text)}`,
            onClick: () => a(J),
            className: "qz-button qz-icon-button",
            "data-variant": "quiet",
            children: /* @__PURE__ */ e(T, { name: "external" })
          }
        )
      ] }, k.ordinal)) })
    ] }, `${d.workspaceId}:${d.path}`)) })
  ] }) : /* @__PURE__ */ e("p", { className: "qz-empty", role: "status", children: "Loading workspaces…" });
}
const mt = '.qz-settings{display:grid;align-content:start;gap:20px;width:100%;max-width:1100px;min-width:0;margin-inline:auto;container:qz-settings / inline-size}.qz-settings .qz-settings-grid{display:grid;align-items:start;gap:20px}@container qz-settings (min-width: 760px){.qz-settings .qz-settings-grid{grid-template-columns:minmax(0,1fr) minmax(260px,330px)}}.qz-settings .qz-settings-folders,.qz-settings .qz-settings-add,.qz-settings .qz-settings-folder,.qz-settings .qz-settings-migration,.qz-settings .qz-settings-notice{display:grid;min-width:0;gap:12px}.qz-settings .qz-settings-add,.qz-settings .qz-settings-folder{padding:16px}.qz-settings .qz-settings-add p{margin-block-start:4px}.qz-settings .qz-settings-add .qz-input{width:100%}.qz-settings .qz-settings-add>.qz-button{justify-self:start}.qz-settings .qz-settings-heading,.qz-settings .qz-settings-folder-identity,.qz-settings .qz-settings-folder-controls,.qz-settings .qz-settings-actions,.qz-settings .qz-settings-check{display:flex;align-items:center}.qz-settings .qz-settings-heading,.qz-settings .qz-settings-folder-identity,.qz-settings .qz-settings-check{gap:10px}.qz-settings .qz-settings-heading h3,.qz-settings .qz-settings-add h3,.qz-settings .qz-settings-folder h4{margin:0;color:var(--qz-text);font-size:15px;font-weight:650}.qz-settings .qz-settings-count{padding:1px 7px;border:1px solid var(--qz-border);border-radius:999px;color:var(--qz-muted);font-size:12px;font-variant-numeric:tabular-nums}.qz-settings .qz-settings-folder-icon{display:grid;flex:none;width:36px;height:36px;place-items:center;border-radius:9px;background:var(--qz-accent-soft);color:var(--qz-accent)}.qz-settings .qz-settings-folder-identity>div{display:grid;min-width:0;gap:3px;overflow-wrap:anywhere}.qz-settings .qz-settings-folder-controls{justify-content:space-between;flex-wrap:wrap;gap:8px 12px;padding-block-start:10px;border-top:1px solid var(--qz-border)}.qz-settings .qz-settings-actions{flex-wrap:wrap;gap:4px}.qz-settings .qz-settings-check{min-height:32px;font-size:13px;cursor:pointer}.qz-settings .qz-settings-check input{flex:none;accent-color:var(--qz-accent)}.qz-settings .qz-settings-toggle{display:inline-grid;align-items:center;justify-items:start;-webkit-appearance:none;-moz-appearance:none;appearance:none;width:34px;height:20px;padding:2px;margin:0;border:1px solid var(--qz-muted);border-radius:999px;background:var(--qz-elevated);cursor:inherit}.qz-settings .qz-settings-toggle:before{width:12px;height:12px;border-radius:50%;background:var(--qz-muted);content:""}.qz-settings .qz-settings-toggle:checked{justify-items:end;border-color:var(--qz-accent);background:var(--qz-accent-soft)}.qz-settings .qz-settings-toggle:checked:before{background:var(--qz-accent)}.qz-settings .qz-settings-toggle:disabled{opacity:.6;cursor:default}@media (forced-colors: active){.qz-settings .qz-settings-toggle{display:inline-block;-webkit-appearance:auto;-moz-appearance:auto;appearance:auto;width:16px;height:16px}}.qz-settings .qz-settings-migration,.qz-settings .qz-settings-result{padding:12px;border:1px solid var(--qz-border);border-radius:9px;background:var(--qz-canvas);font-size:13px}.qz-settings .qz-settings-migration{gap:6px}.qz-settings .qz-settings-notice{gap:8px;overflow-wrap:anywhere}.qz-settings .qz-settings-migration-files{max-height:200px;margin:0;padding-inline-start:20px;overflow-y:auto;list-style:disc}.qz-settings .qz-button[data-destructive]{color:var(--qz-danger)}';
function re() {
  const [t, n] = g(!1), [a, s] = g(null);
  return { busy: t, failure: a, run: async (u) => {
    n(!0), s(null);
    try {
      return await u(), !0;
    } catch (i) {
      return s(Q(i)), !1;
    } finally {
      n(!1);
    }
  } };
}
function gt(t) {
  const { api: n } = t, [a, s] = g(null), [c, u] = g(null), [i, h] = g(null), [q, o] = g(0), [z, f] = g(""), [w, S] = g(""), { busy: m, failure: y, run: x } = re();
  O(() => {
    let b = !1;
    return Promise.all([Be(n), we(n)]).then(([N, $]) => {
      b || (s(N), h($.writeBlocked ?? null), u(null));
    }).catch((N) => !b && u(Q(N))), () => {
      b = !0;
    };
  }, [n, q]);
  const p = async () => {
    await x(() => Ee(n, z.trim(), w.trim() || void 0)) && (f(""), S(""), o((b) => b + 1));
  };
  return /* @__PURE__ */ r("div", { className: "qz-settings", children: [
    /* @__PURE__ */ e("style", { children: mt }),
    /* @__PURE__ */ r("header", { children: [
      /* @__PURE__ */ e("h2", { className: "qz-section-title", children: "Settings" }),
      /* @__PURE__ */ e("p", { className: "qz-section-description", children: "Manage the folders Quartizo reads for your board and TODOs." })
    ] }),
    /* @__PURE__ */ e(L, { failure: c }),
    /* @__PURE__ */ e(L, { failure: i }),
    /* @__PURE__ */ r("div", { className: "qz-settings-grid", children: [
      /* @__PURE__ */ r("section", { className: "qz-settings-folders", "aria-labelledby": "qz-settings-folders", children: [
        /* @__PURE__ */ r("div", { className: "qz-settings-heading", children: [
          /* @__PURE__ */ e("h3", { id: "qz-settings-folders", children: "Connected folders" }),
          a && /* @__PURE__ */ e("span", { className: "qz-settings-count", children: a.length })
        ] }),
        !a && !c && /* @__PURE__ */ e("p", { className: "qz-muted", role: "status", children: "Loading folders…" }),
        (a == null ? void 0 : a.length) === 0 && /* @__PURE__ */ e("p", { className: "qz-empty", children: "Add a folder to start viewing its tickets and TODOs." }),
        a == null ? void 0 : a.map((b) => /* @__PURE__ */ e(zt, { api: n, workspace: b, writeBlocked: i, onChanged: () => o((N) => N + 1) }, b.id))
      ] }),
      /* @__PURE__ */ r(
        "form",
        {
          className: "qz-panel-surface qz-settings-add",
          "aria-labelledby": "qz-settings-add",
          "aria-busy": m,
          onSubmit: (b) => {
            b.preventDefault(), z.trim() && !m && p();
          },
          children: [
            /* @__PURE__ */ r("div", { children: [
              /* @__PURE__ */ e("h3", { id: "qz-settings-add", children: "Add a folder" }),
              /* @__PURE__ */ e("p", { className: "qz-muted", children: "Use the same folder path you added in Kiro Notes." })
            ] }),
            /* @__PURE__ */ r("label", { className: "qz-field", children: [
              "Absolute folder path",
              /* @__PURE__ */ e("input", { className: "qz-input", placeholder: "/home/you/notes", value: z, onChange: (b) => f(b.target.value) })
            ] }),
            /* @__PURE__ */ r("label", { className: "qz-field", children: [
              /* @__PURE__ */ r("span", { children: [
                "Name ",
                /* @__PURE__ */ e("span", { className: "qz-muted", children: "(optional)" })
              ] }),
              /* @__PURE__ */ e("input", { className: "qz-input", placeholder: "e.g. Project notes", value: w, onChange: (b) => S(b.target.value) })
            ] }),
            /* @__PURE__ */ e("button", { className: "qz-button", "data-variant": "primary", type: "submit", disabled: m || !z.trim(), children: "Add folder" }),
            /* @__PURE__ */ e(L, { failure: y })
          ]
        }
      )
    ] })
  ] });
}
function zt(t) {
  const { api: n, workspace: a } = t, { busy: s, failure: c, run: u } = re(), [i, h] = g(null), [q, o] = g(!1);
  return O(() => {
    if (!i) return;
    const z = setTimeout(() => h(null), 3e3);
    return () => clearTimeout(z);
  }, [i]), /* @__PURE__ */ r("section", { "aria-label": a.name, className: "qz-panel-surface qz-settings-folder", children: [
    /* @__PURE__ */ r("div", { className: "qz-settings-folder-identity", children: [
      /* @__PURE__ */ e("span", { className: "qz-settings-folder-icon", children: /* @__PURE__ */ e(T, { name: "folder" }) }),
      /* @__PURE__ */ r("div", { children: [
        /* @__PURE__ */ e("h4", { children: a.name }),
        /* @__PURE__ */ e("code", { className: "qz-mono qz-muted", children: a.path })
      ] })
    ] }),
    /* @__PURE__ */ r("div", { className: "qz-settings-folder-controls", children: [
      /* @__PURE__ */ r("label", { className: "qz-settings-check", children: [
        /* @__PURE__ */ e(
          "input",
          {
            className: "qz-settings-toggle",
            type: "checkbox",
            checked: !!a.companion,
            disabled: s,
            onChange: () => void u(() => je(n, a.id, !a.companion)).then((z) => z && t.onChanged())
          }
        ),
        "Shared with Kiro Notes"
      ] }),
      /* @__PURE__ */ r("div", { className: "qz-settings-actions", children: [
        a.companion && /* @__PURE__ */ e(
          "button",
          {
            className: "qz-button",
            "data-variant": "quiet",
            type: "button",
            onClick: () => void u(() => ae(n, { workspaceId: a.id, manual: !0, rebuild: !0 })).then(
              (z) => z && h("Rebuild requested.")
            ),
            disabled: s,
            children: "Rebuild index"
          }
        ),
        !q && /* @__PURE__ */ e("button", { className: "qz-button", "data-variant": "quiet", type: "button", onClick: () => o(!0), disabled: s, children: "Remove…" })
      ] })
    ] }),
    !!a.oldTasks && /* @__PURE__ */ e(qt, { api: n, workspace: a, writeBlocked: t.writeBlocked, onChanged: t.onChanged }),
    q && /* @__PURE__ */ r("div", { role: "alertdialog", "aria-label": "Remove folder", className: "qz-notice qz-settings-notice", children: [
      /* @__PURE__ */ r("p", { children: [
        "Stop showing “",
        a.name,
        "” in Quartizo? Your folder and files stay on disk.",
        !!a.oldTasks && ` Removing this folder also deletes its ${a.oldTasks} saved task(s) from the old Quartizo board.`
      ] }),
      /* @__PURE__ */ r("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ e(
          "button",
          {
            className: "qz-button",
            "data-destructive": !0,
            type: "button",
            onClick: () => void u(() => Pe(n, a.id, !!a.oldTasks)).then((z) => z && t.onChanged()),
            disabled: s,
            children: a.oldTasks ? `Remove and delete ${a.oldTasks} task(s)` : "Remove"
          }
        ),
        /* @__PURE__ */ e("button", { className: "qz-button", "data-variant": "quiet", type: "button", onClick: () => o(!1), disabled: s, children: "Cancel" })
      ] })
    ] }),
    i && /* @__PURE__ */ e("span", { className: "qz-muted", role: "status", children: i }),
    /* @__PURE__ */ e(L, { failure: c })
  ] });
}
function qt({ api: t, workspace: n, writeBlocked: a, onChanged: s }) {
  const [c, u] = g(null), [i, h] = g(null), [q, o] = g(!1), [z, f] = g(!1), { busy: w, failure: S, run: m } = re(), y = async () => {
    const p = await nt(t, n.id), b = URL.createObjectURL(new Blob([JSON.stringify(p, null, 2)], { type: "application/json" })), N = document.createElement("a");
    N.href = b, N.download = `quartizo-old-tasks-${n.id}.json`, N.click(), setTimeout(() => URL.revokeObjectURL(b), 1e3), o(!0);
  }, x = async () => {
    if (!c) return;
    const p = await tt(t, n.id, c.planHash, z);
    h(p), u(null), s();
  };
  return /* @__PURE__ */ r("section", { className: "qz-settings-migration", "aria-label": `Old tasks in ${n.name}`, children: [
    /* @__PURE__ */ e("strong", { children: "Old task migration" }),
    /* @__PURE__ */ r("p", { className: "qz-muted", children: [
      "Convert ",
      n.oldTasks,
      " saved ",
      n.oldTasks === 1 ? "task" : "tasks",
      " from the old board into Markdown ticket notes."
    ] }),
    /* @__PURE__ */ r("div", { className: "qz-settings-actions", children: [
      /* @__PURE__ */ e("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: w, onClick: () => void m(y), children: "Export old tasks" }),
      /* @__PURE__ */ e("button", { className: "qz-button", type: "button", disabled: w || !n.companion, onClick: () => void m(async () => {
        u(await et(t, n.id)), h(null), f(!1);
      }), children: "Preview migration" })
    ] }),
    q && /* @__PURE__ */ e("span", { className: "qz-muted", role: "status", children: "Export downloaded." }),
    c && /* @__PURE__ */ r("div", { role: "alertdialog", "aria-label": "Confirm old task migration", className: "qz-notice qz-settings-notice", children: [
      /* @__PURE__ */ r("strong", { children: [
        "Create ",
        c.tasks.filter((p) => !p.migrated).length,
        " ticket note(s)"
      ] }),
      /* @__PURE__ */ e("p", { children: "Quartizo backs up the database tasks before writing each ticket to a new file." }),
      c.warnings.map((p, b) => /* @__PURE__ */ e("p", { children: p }, b)),
      /* @__PURE__ */ e("ul", { className: "qz-settings-migration-files", children: c.tasks.map((p) => /* @__PURE__ */ r("li", { children: [
        p.title,
        " → ",
        /* @__PURE__ */ e("code", { children: p.path }),
        " (",
        p.status,
        ")",
        p.migrated && " · already migrated",
        p.noteRef && /* @__PURE__ */ r("span", { children: [
          " · linked note: ",
          p.noteRef
        ] }),
        p.slotId && /* @__PURE__ */ r("span", { children: [
          " · session: ",
          p.slotId
        ] })
      ] }, p.uid)) }),
      c.tasks.some((p) => p.changed) && !c.complete && /* @__PURE__ */ r("label", { className: "qz-settings-check", children: [
        /* @__PURE__ */ e("input", { type: "checkbox", checked: z, onChange: (p) => f(p.target.checked), disabled: w }),
        "I reviewed the changed converted notes; keep their latest contents when resuming"
      ] }),
      /* @__PURE__ */ r("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ e("button", { className: "qz-button", "data-variant": "primary", type: "button", disabled: w || !!a || c.complete || !c.tasks.length, onClick: () => void m(x), children: c.backup ? "Resume and verify migration" : "Back up and migrate" }),
        /* @__PURE__ */ e("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: w, onClick: () => u(null), children: "Cancel" })
      ] })
    ] }),
    i && /* @__PURE__ */ r("div", { className: "qz-settings-notice qz-settings-result", role: "status", children: [
      /* @__PURE__ */ r("p", { children: [
        i.migrated.length,
        " ticket note(s) migrated. ",
        i.complete ? "Migration verified." : `${i.remaining} task(s) remain; preview again to continue.`
      ] }),
      /* @__PURE__ */ r("code", { className: "qz-mono qz-muted", children: [
        "Backup: ",
        i.backup.directory
      ] })
    ] }),
    /* @__PURE__ */ e(L, { failure: S })
  ] });
}
const ft = ".qz-app{--qz-canvas: var(--bg, Canvas);--qz-surface: var(--card, Canvas);--qz-elevated: var(--bg-elevated, Canvas);--qz-border: var(--border, color-mix(in srgb, CanvasText 18%, Canvas));--qz-text: var(--text-strong, CanvasText);--qz-muted: color-mix(in srgb, var(--muted, CanvasText) 87%, var(--qz-text));--qz-accent: var(--accent, LinkText);--qz-accent-soft: var(--accent-subtle, color-mix(in srgb, var(--qz-accent) 13%, transparent));--qz-ok: var(--ok, #4e9a6b);--qz-warning: var(--warn, #ad7628);--qz-danger: var(--danger, #c7465d);--qz-info: var(--info, var(--qz-accent));container:qz-app / inline-size;width:100%;max-width:1560px;min-width:0;margin-inline:auto;padding:24px clamp(16px,3%,40px) 36px;color:var(--qz-text)}.qz-app,.qz-app *{box-sizing:border-box}.qz-app [hidden]{display:none!important}.qz-app :where(h1,h2,h3,p,ul){margin:0}.qz-app :where(button,input,textarea,select){font:inherit}.qz-app :is(button,summary,input,textarea,select,.qz-board):focus-visible{outline:2px solid var(--qz-accent);outline-offset:2px}.qz-app :is(button,input,textarea,select):disabled{opacity:.55;cursor:default}.qz-app input[type=checkbox]{accent-color:var(--qz-accent)}.qz-icon{width:1rem;height:1rem;flex:none}.qz-header,.qz-brand,.qz-tabs,.qz-view-heading,.qz-toolbar,.qz-actions,.qz-inline-field{display:flex;align-items:center;min-width:0}.qz-header,.qz-view-heading,.qz-toolbar{justify-content:space-between;flex-wrap:wrap;gap:12px 20px}.qz-header{padding:0 0 20px;border-bottom:1px solid var(--qz-border)}.qz-brand{gap:12px}.qz-mark{display:grid;place-items:center;flex:none;width:46px;height:46px;border:1px solid color-mix(in srgb,var(--qz-accent) 34%,var(--qz-border));border-radius:13px;background:linear-gradient(145deg,var(--qz-accent-soft),var(--qz-surface));color:var(--qz-accent)}.qz-mark .qz-icon{width:26px;height:26px}.qz-brand h1{font-size:24px;font-weight:700;letter-spacing:-.035em;line-height:1.1}.qz-brand p{margin-top:3px;color:var(--qz-muted);font-size:12px}.qz-tabs{max-width:100%;gap:3px;padding:4px;border:1px solid var(--qz-border);border-radius:12px;background:var(--qz-surface)}.qz-tabs button{display:flex;align-items:center;justify-content:center;gap:7px;min-height:36px;padding:6px 12px;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--qz-muted);font-size:13px;font-weight:600;cursor:pointer}.qz-tabs button:hover{color:var(--qz-text);background:var(--qz-elevated)}.qz-tabs button[aria-selected=true]{border-color:color-mix(in srgb,var(--qz-accent) 25%,var(--qz-border));background:var(--qz-accent-soft);color:var(--qz-text)}.qz-tabs button[aria-selected=true] .qz-icon{color:var(--qz-accent)}.qz-content{padding-top:24px}.qz-stack{display:grid;gap:14px;min-width:0}.qz-section-title{font-size:27px;font-weight:700;letter-spacing:-.032em;line-height:1.17}.qz-section-description{margin-top:5px;color:var(--qz-muted)}.qz-muted{color:var(--qz-muted);font-weight:400}.qz-mono{font:400 12px/1.5 var(--mono, ui-monospace, monospace)}.qz-path{display:block;min-width:0;overflow:hidden;color:var(--qz-muted);text-overflow:ellipsis;white-space:nowrap}.qz-actions{gap:6px;flex-wrap:wrap}.qz-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;max-width:100%;min-height:36px;padding:5px 11px;border:1px solid var(--qz-border);border-radius:8px;background:var(--qz-surface);color:var(--qz-text);font-size:13px;font-weight:600;text-align:center;cursor:pointer}.qz-button:not(:disabled):hover{background:var(--qz-elevated);border-color:var(--border-strong, var(--qz-muted))}.qz-button[data-variant=primary]{border-color:var(--qz-accent);background:var(--qz-accent);color:var(--accent-fg, var(--qz-canvas))}.qz-button[data-variant=primary]:not(:disabled):hover{border-color:var(--accent-hover, var(--qz-accent));background:var(--accent-hover, var(--qz-accent))}.qz-button[data-variant=quiet]{border-color:transparent;background:transparent;color:var(--qz-muted)}.qz-button[data-variant=quiet]:not(:disabled):hover{color:var(--qz-text)}.qz-icon-button{min-width:36px;padding-inline:8px}.qz-input{min-width:0;max-width:100%;min-height:36px;padding:6px 9px;border:1px solid var(--qz-border);border-radius:8px;background:var(--qz-elevated);color:var(--qz-text);font-size:13px}.qz-input::placeholder{color:var(--qz-muted);opacity:1}.qz-field{display:grid;gap:5px;min-width:0;font-size:13px;font-weight:600}.qz-field .qz-input{width:100%;font-weight:400}.qz-inline-field{gap:8px;color:var(--qz-muted);font-size:13px}.qz-inline-field .qz-input{max-width:min(36ch,52%);font-weight:600}.qz-check-label{display:flex;align-items:center;gap:8px}.qz-panel-surface{min-width:0;border:1px solid var(--qz-border);border-radius:12px;background:var(--qz-surface)}.qz-notice{padding:11px 13px;border:1px solid color-mix(in srgb,var(--qz-warning) 42%,var(--qz-border));border-radius:9px;background:color-mix(in srgb,var(--qz-warning) 7%,var(--qz-surface));font-size:13px;overflow-wrap:anywhere}.qz-notice[data-variant=neutral]{border-color:var(--qz-border);background:var(--qz-surface)}.qz-notice.qz-error{border-color:color-mix(in srgb,var(--qz-danger) 53%,var(--qz-border));background:color-mix(in srgb,var(--qz-danger) 9%,var(--qz-surface))}.qz-empty{display:grid;place-items:center;gap:8px;padding:28px 16px;border:1px dashed var(--qz-border);border-radius:12px;color:var(--qz-muted);text-align:center}.qz-empty :is(h2,h3){color:var(--qz-text);font-size:17px;font-weight:650}.qz-empty .qz-button{margin-top:4px}.qz-empty-icon,.qz-note-icon{display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:9px;background:var(--qz-accent-soft);color:var(--qz-accent)}.qz-visually-hidden{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.qz-board-meta{gap:2px 12px;padding-block:2px}.qz-board-meta>.qz-actions{margin-inline-start:auto}.qz-result-count{color:var(--qz-muted);font-size:12px;font-weight:600}.qz-index{display:inline-flex;align-items:baseline;gap:7px;color:var(--qz-muted);font-size:12px}.qz-index:empty{display:none}.qz-board{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(172px,1fr);gap:10px;min-width:0;padding:2px 2px 10px;overflow-x:auto;overscroll-behavior-inline:contain}.qz-lane{--qz-status: var(--qz-muted);min-width:0;min-height:308px;padding:9px;border:1px solid color-mix(in srgb,var(--qz-status) 20%,var(--qz-border));border-radius:12px;background:linear-gradient(180deg,color-mix(in srgb,var(--qz-status) 7%,var(--qz-surface)),var(--qz-surface) 105px)}.qz-app [data-lane-status=ready]{--qz-status: var(--qz-info)}.qz-app [data-lane-status=in_progress]{--qz-status: var(--qz-accent)}.qz-app [data-lane-status=review]{--qz-status: var(--qz-warning)}.qz-app [data-lane-status=done]{--qz-status: var(--qz-ok)}.qz-app [data-lane-status=repair]{--qz-status: var(--qz-danger)}.qz-lane-heading{display:flex;align-items:center;gap:7px;padding:3px 2px 10px;font-size:13px;font-weight:650}.qz-dot{width:8px;height:8px;flex:none;border-radius:50%;background:var(--qz-status, var(--qz-ok))}.qz-dot[data-attention=true]{background:var(--qz-warning)}.qz-count{margin-inline-start:auto;padding:1px 6px;border:1px solid var(--qz-border);border-radius:999px;color:var(--qz-muted);font-size:11px;font-variant-numeric:tabular-nums}.qz-lane-empty{padding:11px;border:1px dashed var(--qz-border);border-radius:8px;color:var(--qz-muted);font-size:12px;text-align:center}.qz-cards,.qz-todo-list{list-style:none;padding:0}.qz-cards{display:grid;gap:8px}.qz-cards li{min-width:0}.qz-cards li[draggable=true]{cursor:grab}.qz-cards li[draggable=true]:active{cursor:grabbing}.qz-ticket{border:1px solid var(--qz-border);border-radius:9px;background:var(--qz-elevated);box-shadow:var(--shadow-sm, none)}.qz-ticket:hover,.qz-ticket:focus-within{border-color:var(--border-strong, var(--qz-muted))}.qz-ticket-content{display:grid;gap:5px;padding:10px 10px 8px}.qz-note-link{display:flex;align-items:start;justify-content:space-between;gap:6px;padding:0;border:0;background:transparent;color:var(--qz-text);font-size:14px;font-weight:650;line-height:1.4;text-align:start;overflow-wrap:anywhere;cursor:pointer}.qz-note-link .qz-icon{width:13px;height:13px;margin-top:3px;color:var(--qz-muted)}.qz-note-link:hover{text-decoration:underline}.qz-ticket-progress{display:flex;align-items:center;gap:8px;margin-top:3px;color:var(--qz-muted);font-size:11px;font-variant-numeric:tabular-nums}.qz-ticket-progress progress{width:min(54px,40%);height:5px;accent-color:var(--qz-ok);border:0;border-radius:6px;overflow:hidden}.qz-ticket-progress progress::-webkit-progress-bar{background:var(--qz-border)}.qz-ticket-progress progress::-webkit-progress-value{border-radius:6px;background:var(--qz-ok)}.qz-badge{padding:2px 5px;border-radius:5px;background:color-mix(in srgb,var(--qz-warning) 17%,var(--qz-surface));font-size:11px;overflow-wrap:anywhere}.qz-ticket-footer{position:relative;padding:5px;border-top:1px solid var(--qz-border)}.qz-ticket-status{padding-inline-end:39px}.qz-ticket-status .qz-input{width:100%;min-height:32px;padding:3px 4px;border-color:transparent;background:transparent;color:var(--qz-muted)}.qz-ticket-status .qz-input:not(:disabled):hover{background:var(--qz-surface);border-color:var(--qz-border)}.qz-ticket-actions summary{position:absolute;inset-block-start:5px;inset-inline-end:5px;min-height:32px;list-style:none}.qz-ticket-actions summary::-webkit-details-marker{display:none}.qz-ticket-action-list{display:grid;gap:1px;margin-top:5px;padding-top:5px;border-top:1px solid var(--qz-border)}.qz-ticket-action-list .qz-button{justify-content:start;min-height:32px;text-align:start}.qz-ticket-action-list .qz-destructive:not(:disabled){color:var(--qz-danger)}.qz-ticket-form{display:grid;gap:12px;max-width:630px;padding:16px}.qz-ticket-form h3{font-size:17px;font-weight:650}.qz-note-preview{max-height:180px;margin:0;padding:10px;overflow:auto;background:var(--qz-canvas);white-space:pre-wrap;overflow-wrap:anywhere}.qz-todos{width:100%;max-width:1100px;margin-inline:auto}.qz-todo-filters{display:flex;flex-wrap:wrap;gap:12px;padding:12px}.qz-todo-filters .qz-field{flex:1 1 135px}.qz-todo-filters .qz-field:first-child{flex:3 1 245px}.qz-search{position:relative;display:block}.qz-search .qz-icon{position:absolute;inset-block-start:10px;inset-inline-start:9px;color:var(--qz-muted);pointer-events:none}.qz-search .qz-input{padding-inline-start:32px}.qz-todo-header{display:flex;align-items:center;gap:10px;min-width:0;padding:12px 14px}.qz-todo-identity{flex:1;min-width:0}.qz-todo-identity h3{display:flex;align-items:center;flex-wrap:wrap;gap:5px 9px;font-size:15px;font-weight:650;overflow-wrap:anywhere}.qz-todo-meta{display:flex;align-items:baseline;gap:6px;color:var(--qz-muted);font-size:12px}.qz-todo-meta>span:first-child{min-width:0;overflow-wrap:anywhere}.qz-status-pill{--qz-status: var(--qz-muted);display:inline-flex;align-items:center;gap:5px;padding:1px 7px;border-radius:999px;background:color-mix(in srgb,var(--qz-status) 13%,var(--qz-surface));font-size:11px;font-weight:500}.qz-status-pill .qz-dot{width:6px;height:6px}.qz-todo-row{display:flex;align-items:center;border-top:1px solid var(--qz-border)}.qz-todo-row:hover,.qz-todo-row:focus-within{background:var(--qz-elevated)}.qz-todo-row:last-child{border-radius:0 0 12px 12px}.qz-todo-check{display:flex;align-items:baseline;gap:10px;flex:1;min-width:0;padding:10px 14px;overflow-wrap:anywhere;cursor:pointer}.qz-todo-check input{flex:none;align-self:start;width:16px;height:16px;margin:2px 0 0}.qz-todo-check:has(input:disabled){cursor:default}.qz-todo-row[data-checked=true] .qz-todo-check span{color:var(--qz-muted);text-decoration:line-through}.qz-todo-row>.qz-button{margin-inline-end:6px}@container qz-app (max-width: 650px){.qz-board{grid-auto-columns:clamp(170px,65cqi,244px)}}@container qz-app (max-width: 520px){.qz-header{gap:14px;padding-bottom:14px}.qz-tabs{width:100%}.qz-tabs button{flex:1;gap:5px;padding-inline:5px}.qz-content{padding-top:18px}.qz-section-title{font-size:24px}.qz-inline-field{width:100%}.qz-inline-field .qz-input{flex:1;max-width:none}.qz-board-meta>.qz-actions{margin-inline-start:0}.qz-todo-filters .qz-field:first-child{flex-basis:100%}.qz-todo-header{padding-inline:10px}.qz-todo-header .qz-note-icon{display:none}}@media (pointer: coarse){.qz-app :is(.qz-button,.qz-tabs button,.qz-input,.qz-ticket-status .qz-input,.qz-ticket-actions summary){min-height:42px}}", H = [
  { id: "tasks", label: "Tasks", icon: "board" },
  { id: "todos", label: "TODOs", icon: "checklist" },
  { id: "settings", label: "Settings", icon: "settings" }
];
function kt() {
  const t = Le(), [n, a] = g("tasks"), s = D(null), c = (i) => {
    var o;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(i.key)) return;
    i.preventDefault();
    const h = H.findIndex((z) => z.id === n), q = i.key === "Home" ? H[0] : i.key === "End" ? H[H.length - 1] : H[(h + (i.key === "ArrowRight" ? 1 : H.length - 1)) % H.length];
    a(q.id), (o = i.currentTarget.querySelector(`#qz-tab-${q.id}`)) == null || o.focus();
  }, u = () => {
    var i, h;
    a("settings"), (h = (i = s.current) == null ? void 0 : i.querySelector("#qz-tab-settings")) == null || h.focus();
  };
  return /* @__PURE__ */ r("div", { className: "qz-app", children: [
    /* @__PURE__ */ e("style", { children: ft }),
    /* @__PURE__ */ r("header", { className: "qz-header", children: [
      /* @__PURE__ */ r("div", { className: "qz-brand", children: [
        /* @__PURE__ */ e("span", { className: "qz-mark", children: /* @__PURE__ */ e(T, { name: "gem" }) }),
        /* @__PURE__ */ r("div", { children: [
          /* @__PURE__ */ e("h1", { children: "Quartizo" }),
          /* @__PURE__ */ e("p", { children: "Kiro Notes companion" })
        ] })
      ] }),
      /* @__PURE__ */ e("div", { className: "qz-tabs", ref: s, role: "tablist", "aria-label": "Quartizo", onKeyDown: c, children: H.map((i) => /* @__PURE__ */ r(
        "button",
        {
          id: `qz-tab-${i.id}`,
          type: "button",
          role: "tab",
          "aria-selected": n === i.id,
          "aria-controls": "qz-panel",
          tabIndex: n === i.id ? 0 : -1,
          onClick: () => a(i.id),
          children: [
            /* @__PURE__ */ e(T, { name: i.icon }),
            i.label
          ]
        },
        i.id
      )) })
    ] }),
    /* @__PURE__ */ r("div", { className: "qz-content", id: "qz-panel", role: "tabpanel", "aria-labelledby": `qz-tab-${n}`, children: [
      /* @__PURE__ */ e("div", { hidden: n !== "tasks", children: /* @__PURE__ */ e(ct, { api: t, active: n === "tasks", onSettings: u }) }),
      n === "todos" && /* @__PURE__ */ e(ht, { api: t, onSettings: u }),
      n === "settings" && /* @__PURE__ */ e(gt, { api: t })
    ] })
  ] });
}
export {
  kt as default
};
