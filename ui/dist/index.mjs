import { jsx as e, jsxs as r, Fragment as F } from "react/jsx-runtime";
import { useNavigate as ve, useChatLauncher as Le, useAppApi as De } from "@kirocrew/app-sdk";
import { useState as m, useEffect as R, useRef as L, useMemo as xe, useCallback as te } from "react";
const V = "/apps/quartizo/api", Be = 15e3, G = ["backlog", "ready", "in_progress", "review", "done"], J = {
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
  const o = typeof (s == null ? void 0 : s.code) == "string" ? s.code : void 0, u = typeof (s == null ? void 0 : s.error) == "string" ? s.error : typeof (n == null ? void 0 : n.message) == "string" ? n.message : String(t);
  return { status: a, code: o, message: u };
}
function Y(t, n = Be) {
  let a;
  const s = new Promise((o, u) => {
    a = setTimeout(() => u(new Error(`request timed out after ${Math.round(n / 1e3)} s`)), n);
  });
  return Promise.race([t, s]).finally(() => clearTimeout(a));
}
function ke(t) {
  const n = Object.entries(t).filter((a) => a[1] !== void 0 && a[1] !== "").map(([a, s]) => `${encodeURIComponent(a)}=${encodeURIComponent(s)}`);
  return n.length ? `?${n.join("&")}` : "";
}
async function Ee(t) {
  return (await t.get(`${V}/workspaces`)).workspaces;
}
async function Pe(t, n, a) {
  return (await t.post(`${V}/workspaces`, a ? { path: n, name: a, companion: !0 } : { path: n, companion: !0 })).workspace;
}
async function Fe(t, n, a = !1) {
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
function Ue(t, n) {
  return t.get(`${V}/workspaces/${n}/board`);
}
function Ke(t, n, a) {
  return t.get(`${ne}/todos${ke({ workspace: a === void 0 ? void 0 : String(a), state: n })}`);
}
const ye = [...G, "repair"], ze = { ...J, repair: "Needs repair" };
function _e(t) {
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
function We(t, n = Date.now()) {
  if (!t) return "";
  if (t.state === "scanning") {
    if (!t.progress) return "Scan queued…";
    const { notes: s, rebuild: o } = t.progress;
    return `Scanning… ${s} ${s === 1 ? "note" : "notes"} read${o ? " (rebuild)" : ""}`;
  }
  if (!t.indexedAt) return "";
  const a = t.files ?? 0;
  return `${a} ${a === 1 ? "note" : "notes"} indexed ${He(t.indexedAt, n)}`;
}
function He(t, n) {
  const a = Math.max(0, Math.round((n - t) / 1e3));
  if (a < 5) return "just now";
  if (a < 60) return `${a} s ago`;
  const s = Math.round(a / 60);
  return s < 60 ? `${s} min ago` : new Date(t).toLocaleString();
}
function Qe(t, n) {
  const a = n.trim().toLocaleLowerCase();
  if (!a) return [...t];
  const s = [];
  for (const o of t) {
    const i = `${o.title}
${o.path}`.toLocaleLowerCase().includes(a) ? o.items : o.items.filter((p) => `${p.text}
${p.heading ?? ""}`.toLocaleLowerCase().includes(a));
    i.length && s.push({ ...o, items: i });
  }
  return s;
}
function ee(t) {
  return t.trim() || "(empty)";
}
function j(t, n) {
  return `${V}/workspaces/${t}/${n}`;
}
function Ve(t, n, a) {
  return t.get(j(n, "source") + ke({ path: a }));
}
function Je(t, n, a) {
  return t.post(j(n, "tickets"), a);
}
function Ye(t, n, a) {
  return t.post(j(n, "tickets/promote"), { path: a.path, expectedHash: a.hash });
}
function Ge(t, n, a) {
  return t.post(j(n, "tickets/move"), a);
}
function Ze(t, n, a, s) {
  return t.post(j(n.workspaceId, "todos/toggle"), {
    path: n.path,
    expectedHash: n.hash,
    markerStart: a.markerStart,
    line: a.line,
    column: a.column,
    checked: s
  });
}
function Xe(t, n, a, s = !1) {
  return t.post(j(n, "tickets/rebalance"), { status: a, confirm: !0, reconcile: s });
}
function W(t, n) {
  var a, s;
  return t != null && t.writeBlocked ? t.writeBlocked.message : t != null && t.migrationPending ? "Finish the old task migration in Settings before editing this workspace." : !t || t.state !== "ready" || t.complete !== !0 || t.retained || t.outdated || t.error ? "Wait for a complete, current index before editing. Refresh if needed." : n != null && n.status && ((a = t.maintenance) != null && a.includes(n.status)) ? "This column has unfinished order maintenance. Resume maintenance before moving cards." : n && (!n.hash || n.retained || (s = n.diagnostics) != null && s.length) ? "Repair or refresh this note before editing it." : null;
}
function et(t, n, a, s) {
  if (!n.hash) throw new Error("Refresh this ticket before moving it.");
  const o = t.filter((c) => c.path !== n.path && c.lane === a);
  if (s !== void 0 && (!Number.isInteger(s) || s < 0 || s > o.length))
    throw new Error("The destination card changed. Refresh before moving this ticket.");
  const u = s ?? o.length, i = o[u - 1], p = o[u], z = (c) => {
    if (!c.hash || c.retained || c.diagnostics.length || !c.id || !c.order) throw new Error("Refresh or repair the destination column before moving cards.");
    return { path: c.path, hash: c.hash };
  };
  return {
    path: n.path,
    expectedHash: n.hash,
    status: a,
    ...i ? { before: z(i) } : {},
    ...p ? { after: z(p) } : {}
  };
}
function tt(t, n) {
  return t.get(j(n, "migration"));
}
function nt(t, n, a, s = !1) {
  return t.post(j(n, "migration"), { planHash: a, confirm: !0, ...s ? { acceptCurrent: !0 } : {} });
}
function at(t, n) {
  return t.get(j(n, "legacy-tasks"));
}
function it(t, n, a) {
  return t.post(j(n, "tickets/demote"), { path: a.path, expectedHash: a.hash });
}
const Z = "/md-notebook";
function rt(t) {
  return (t.split("/").pop() ?? t).replace(/\.md$/i, "");
}
const st = {
  gem: /* @__PURE__ */ e("path", { d: "M8 4h8l4.5 5L12 21 3.5 9 8 4Zm-4.5 5h17M8 4l1 5 3 12 3-12 1-5" }),
  board: /* @__PURE__ */ r(F, { children: [
    /* @__PURE__ */ e("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }),
    /* @__PURE__ */ e("path", { d: "M9 4v16m6-16v16M6 8h.1M12 8h.1m6 0h.1" })
  ] }),
  checklist: /* @__PURE__ */ e("path", { d: "m3 6 2 2 3-4m3 3h10M3 13l2 2 3-4m3 3h10M3 20h5m3 0h10" }),
  settings: /* @__PURE__ */ r(F, { children: [
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
  more: /* @__PURE__ */ r(F, { children: [
    /* @__PURE__ */ e("circle", { cx: "5", cy: "12", r: "1" }),
    /* @__PURE__ */ e("circle", { cx: "12", cy: "12", r: "1" }),
    /* @__PURE__ */ e("circle", { cx: "19", cy: "12", r: "1" })
  ] }),
  copy: /* @__PURE__ */ r(F, { children: [
    /* @__PURE__ */ e("rect", { x: "8", y: "8", width: "12", height: "12", rx: "2" }),
    /* @__PURE__ */ e("path", { d: "M16 4H6a2 2 0 0 0-2 2v10" })
  ] }),
  search: /* @__PURE__ */ r(F, { children: [
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
      children: st[t]
    }
  );
}
function D({ failure: t }) {
  return t ? /* @__PURE__ */ e("div", { role: "alert", className: "qz-notice qz-error", "data-code": t.code, children: t.message }) : null;
}
function qe() {
  try {
    return window.localStorage;
  } catch {
    return;
  }
}
const ot = 1500, ct = 3e4, be = "quartizo:workspace";
function lt() {
  const [t, n] = m(() => typeof document > "u" || document.visibilityState !== "hidden");
  return R(() => {
    const a = () => n(document.visibilityState !== "hidden");
    return document.addEventListener("visibilitychange", a), () => document.removeEventListener("visibilitychange", a);
  }, []), t;
}
function Ce(t, n = !0) {
  const [a, s] = m(null), [o, u] = m(null);
  return R(() => {
    if (!n) return;
    let i = !1;
    return we(t).then((p) => {
      i || (s(p.workspaces.filter((z) => z.workspace.companion)), u(p.available ? null : { message: p.error ?? "The Markdown index is unavailable." }));
    }).catch((p) => !i && u(Q(p))), () => {
      i = !0;
    };
  }, [t, n]), { companions: a, failure: o };
}
function Te(t, n, a, s, o) {
  const u = lt(), [i, p] = m(null), [z, c] = m(null), [f, q] = m(0), [w, S] = m(!1), g = L(null), y = L(a), x = L(s), h = L(o);
  y.current = a, x.current = s, h.current = o, R(() => {
    g.current = null, p(null), c(null);
  }, [n]), R(() => {
    if (!t || !u) return;
    let $ = !1, M, A = !0;
    const U = async () => {
      try {
        (A || !g.current || !h.current(g.current)) && await Y(x.current(!1));
        const d = await Y(y.current());
        if ($) return;
        g.current = d, p(d), c(null), S(!1);
      } catch (d) {
        $ || (c(Q(d)), S(!1));
      }
      A = !1, $ || (M = setTimeout(U, g.current && h.current(g.current) ? ot : ct));
    };
    return U(), () => {
      $ = !0, clearTimeout(M);
    };
  }, [t, u, n, f]);
  const b = te(async () => {
    S(!0);
    try {
      await Y(x.current(!0)), c(null), q(($) => $ + 1);
    } catch ($) {
      c(Q($));
    } finally {
      S(!1);
    }
  }, []), N = te(() => {
    g.current = null, S(!0), q(($) => $ + 1);
  }, []);
  return { data: i, failure: z, busy: w, refresh: b, reload: N };
}
function Se({ statuses: t }) {
  const n = Date.now(), a = t.map((s) => We(s, n)).filter(Boolean);
  return /* @__PURE__ */ e("span", { className: "qz-index", role: "status", children: a.length > 0 && /* @__PURE__ */ r(F, { children: [
    /* @__PURE__ */ e("span", { className: "qz-dot", "data-attention": t.some((s) => s.state === "scanning" || !!Ne(s)) }),
    a.join(" · ")
  ] }) });
}
function $e({ statuses: t }) {
  const n = new Set(t.map(Ne).filter(Boolean));
  return /* @__PURE__ */ e(F, { children: [...n].map((a) => /* @__PURE__ */ e("div", { role: "note", className: "qz-notice", children: a }, a)) });
}
function Me({ path: t, compact: n = !1 }) {
  const a = rt(t), [s, o] = m("idle");
  R(() => {
    if (s === "idle") return;
    const i = setTimeout(() => o("idle"), 1500);
    return () => clearTimeout(i);
  }, [s]);
  const u = async () => {
    try {
      await navigator.clipboard.writeText(a), o("copied");
    } catch {
      o("failed");
    }
  };
  return /* @__PURE__ */ r(F, { children: [
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
function Oe({ onSettings: t }) {
  return /* @__PURE__ */ r("div", { className: "qz-empty", children: [
    /* @__PURE__ */ e("span", { className: "qz-empty-icon", children: /* @__PURE__ */ e(T, { name: "folder" }) }),
    /* @__PURE__ */ e("h2", { children: "Connect a notes folder" }),
    /* @__PURE__ */ e("p", { children: "Share a folder from Kiro Notes to see its tickets and TODOs here." }),
    /* @__PURE__ */ e("button", { type: "button", className: "qz-button", "data-variant": "primary", onClick: t, children: "Open Settings" })
  ] });
}
function dt(t) {
  var p, z;
  const n = t.active ?? !0, { companions: a, failure: s } = Ce(t.api, n), [o, u] = m(() => {
    var f;
    const c = Number((f = qe()) == null ? void 0 : f.getItem(be));
    return Number.isInteger(c) && c > 0 ? c : null;
  }), i = ((p = a == null ? void 0 : a.find((c) => c.workspace.id === o)) == null ? void 0 : p.workspace) ?? ((z = a == null ? void 0 : a[0]) == null ? void 0 : z.workspace) ?? null;
  return R(() => {
    var c;
    try {
      i && ((c = qe()) == null || c.setItem(be, String(i.id)));
    } catch {
    }
  }, [i]), s && !a ? /* @__PURE__ */ e(D, { failure: s }) : a ? i ? /* @__PURE__ */ r("div", { className: "qz-stack", children: [
    /* @__PURE__ */ e(D, { failure: s }),
    /* @__PURE__ */ r("div", { className: "qz-view-heading", children: [
      /* @__PURE__ */ r("div", { children: [
        /* @__PURE__ */ e("h2", { className: "qz-section-title", children: "Task board" }),
        /* @__PURE__ */ e("p", { className: "qz-section-description", children: "Plan and track tickets stored in Kiro Notes." })
      ] }),
      /* @__PURE__ */ r("label", { className: "qz-inline-field", children: [
        /* @__PURE__ */ e(T, { name: "folder" }),
        /* @__PURE__ */ e("span", { children: "Workspace" }),
        /* @__PURE__ */ e("select", { className: "qz-input", value: i.id, onChange: (c) => u(Number(c.target.value)), children: a.map((c) => /* @__PURE__ */ e("option", { value: c.workspace.id, children: c.workspace.name }, c.workspace.id)) })
      ] })
    ] }),
    a.map(({ workspace: c }) => /* @__PURE__ */ e("div", { hidden: c.id !== i.id, children: /* @__PURE__ */ e(ut, { api: t.api, workspace: c, active: n && c.id === i.id }) }, c.uid))
  ] }) : /* @__PURE__ */ e(Oe, { onSettings: t.onSettings }) : /* @__PURE__ */ e("p", { className: "qz-empty", role: "status", children: "Loading workspaces…" });
}
function ie(t) {
  const [n, a] = m(!1), [s, o] = m(null), u = L(!0), i = L(!1);
  return R(() => (u.current = !0, () => {
    u.current = !1;
  }), []), { pending: n, failure: s, run: async (z) => {
    if (i.current) return !1;
    i.current = !0, a(!0), o(null);
    try {
      return await Y(z()), u.current && t(), !0;
    } catch (c) {
      if (u.current) {
        const f = Q(c);
        f.status === 409 && (f.message += " Refresh to review the current file, then retry your change."), (f.message.includes("timed out") || !f.status) && (f.message += " The result may be unknown; refresh and check the file before retrying."), o(f);
      }
      return !1;
    } finally {
      i.current = !1, u.current && a(!1);
    }
  } };
}
function ut(t) {
  var ue, pe, he, me;
  const { api: n, workspace: a, active: s } = t, o = a.id, u = ve(), { data: i, failure: p, busy: z, refresh: c, reload: f } = Te(
    s,
    String(o),
    () => Ue(n, o),
    (l) => ae(n, { workspaceId: o, manual: l }),
    (l) => l.index.state === "scanning"
  ), q = ie(f), w = xe(() => _e((i == null ? void 0 : i.tickets) ?? []), [i]), S = ye.filter((l) => l !== "repair" || w.repair.length > 0), g = L(null), y = L(null), [x, h] = m(null), b = L(null);
  R(() => {
    var l;
    x && ((l = b.current) == null || l.focus());
  }, [x]);
  const [N, $] = m(!1), M = !s || !!p || z || q.pending || N || !!W(i == null ? void 0 : i.index), [A, U] = m("backlog"), [d, k] = m(!1), [K, C] = m(!1), [_, se] = m(!1), oe = i ? [i.index] : [], Re = te((l) => {
    U(l), se(!0);
  }, []), [X, ce] = m(null);
  R(() => {
    var B;
    if (!X || M || !i) return;
    const l = Array.from(((B = g.current) == null ? void 0 : B.querySelectorAll("[data-note-path]")) ?? []).find((v) => v.dataset.notePath === X);
    l == null || l.focus(), ce(null);
  }, [X, M, i]);
  const le = (l, B, v) => {
    var E;
    M || W(i == null ? void 0 : i.index, l) || !i || (E = i.index.maintenance) != null && E.includes(B) || q.run(() => Ge(n, o, et(i.tickets, l, B, v))).then((O) => {
      O && ce(l.path);
    });
  }, de = (l, B, v) => {
    l.preventDefault(), l.stopPropagation();
    const E = y.current;
    if (y.current = null, !E || (v == null ? void 0 : v.path) === E.path) return;
    const O = w[B].filter((P) => P.path !== E.path), I = v ? O.findIndex((P) => P.path === v.path) : void 0;
    I !== void 0 && I < 0 || le(E, B, I);
  }, Ae = (l) => {
    var ge, fe;
    const B = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"], v = l.target;
    if (!v.hasAttribute("data-lane")) return;
    const E = Number(v.dataset.lane), O = Number(v.dataset.index);
    if (!B.includes(l.key) || Number.isNaN(E) || Number.isNaN(O)) return;
    let I = E, P = O;
    if (l.key === "ArrowUp" && (P = Math.max(0, O - 1)), l.key === "ArrowDown" && (P = O + 1), l.key === "Home" && (P = 0), l.key === "End" && (P = Number.MAX_SAFE_INTEGER), l.key === "ArrowLeft" || l.key === "ArrowRight") {
      const Ie = l.key === "ArrowLeft" ? -1 : 1;
      do
        I += Ie;
      while (I >= 0 && I < S.length && w[S[I]].length === 0);
      if (I < 0 || I >= S.length) return;
    }
    P = Math.min(P, w[S[I]].length - 1), l.preventDefault(), (fe = (ge = g.current) == null ? void 0 : ge.querySelector(`[data-lane="${I}"][data-index="${P}"]`)) == null || fe.focus();
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
            onClick: () => h(x === "create" ? null : "create"),
            disabled: q.pending || N,
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
            onClick: () => h(x === "promote" ? null : "promote"),
            disabled: q.pending || N,
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
            "aria-expanded": _,
            onClick: () => se((l) => !l),
            disabled: M,
            children: "Rebalance…"
          }
        ),
        /* @__PURE__ */ r("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => u(Z), children: [
          /* @__PURE__ */ e(T, { name: "external" }),
          "Open Kiro Notes"
        ] })
      ] })
    ] }),
    ["create", "promote"].map((l) => /* @__PURE__ */ e("div", { hidden: x !== l, children: /* @__PURE__ */ e(pt, { mode: l, api: n, workspace: a, firstField: x === l ? b : void 0, disabled: !s || !!p || z || q.pending || !!W(i == null ? void 0 : i.index), maintenance: (i == null ? void 0 : i.index.maintenance) ?? [], onBusy: $, onChanged: f, onClose: () => h(null), onMaintenanceNeeded: Re }) }, l)),
    /* @__PURE__ */ r("div", { className: "qz-toolbar qz-board-meta", children: [
      i && /* @__PURE__ */ r("span", { className: "qz-result-count", children: [
        i.tickets.length,
        " ",
        i.tickets.length === 1 ? "ticket" : "tickets"
      ] }),
      /* @__PURE__ */ r("div", { className: "qz-actions", children: [
        /* @__PURE__ */ e(Se, { statuses: oe }),
        /* @__PURE__ */ r("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => void c(), disabled: z || q.pending, children: [
          /* @__PURE__ */ e(T, { name: "refresh" }),
          "Refresh"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ e($e, { statuses: oe }),
    /* @__PURE__ */ e(D, { failure: p }),
    /* @__PURE__ */ e(D, { failure: q.failure }),
    W(i == null ? void 0 : i.index) && i && /* @__PURE__ */ e("div", { role: "note", className: "qz-notice", children: W(i.index) }),
    _ || ((ue = q.failure) == null ? void 0 : ue.code) === "rank_exhausted" || ((pe = q.failure) == null ? void 0 : pe.code) === "maintenance_pending" || (he = i == null ? void 0 : i.index.maintenance) != null && he.length ? /* @__PURE__ */ r("div", { className: "qz-notice qz-stack", children: [
      /* @__PURE__ */ e("p", { children: "Rebalance a column to restore space between card positions. Progress is saved if interrupted." }),
      /* @__PURE__ */ r("div", { className: "qz-actions", children: [
        /* @__PURE__ */ e("select", { className: "qz-input", "aria-label": "Column to rebalance", value: A, onChange: (l) => U(l.target.value), children: G.map((l) => /* @__PURE__ */ e("option", { value: l, children: J[l] }, l)) }),
        /* @__PURE__ */ e("button", { type: "button", className: "qz-button", onClick: () => k(!0), disabled: !s || q.pending || !!(i != null && i.index.writeBlocked), children: "Review column…" })
      ] }),
      d && /* @__PURE__ */ r("div", { className: "qz-stack", role: "alertdialog", "aria-label": "Rebalance column", children: [
        /* @__PURE__ */ e("p", { children: "Update ordering in each note of this column? Other editors may see progress before all files finish." }),
        !!((me = i == null ? void 0 : i.index.maintenance) != null && me.includes(A)) && /* @__PURE__ */ r("label", { className: "qz-check-label", children: [
          /* @__PURE__ */ e("input", { type: "checkbox", checked: K, onChange: (l) => C(l.target.checked), disabled: q.pending }),
          "Keep the latest note contents and resume ordering after an external edit"
        ] }),
        /* @__PURE__ */ r("div", { className: "qz-actions", children: [
          /* @__PURE__ */ e("button", { type: "button", className: "qz-button", disabled: !s || q.pending || !!(i != null && i.index.writeBlocked), onClick: () => void q.run(() => Xe(n, o, A, K)).then((l) => {
            l && (k(!1), C(!1));
          }), children: "Rebalance column" }),
          /* @__PURE__ */ e("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: q.pending, onClick: () => k(!1), children: "Cancel" })
        ] })
      ] })
    ] }) : null,
    !i && !p && /* @__PURE__ */ e("p", { className: "qz-empty", role: "status", children: "Loading the board…" }),
    i && i.tickets.length === 0 && i.index.state !== "scanning" && /* @__PURE__ */ r("p", { className: "qz-notice", "data-variant": "neutral", children: [
      "No tickets in “",
      a.name,
      "” yet. Create a ticket or use an existing note."
    ] }),
    i && /* @__PURE__ */ e("div", { ref: g, className: "qz-board", tabIndex: 0, onKeyDown: Ae, "aria-label": `Board of ${a.name}`, role: "group", children: S.map((l, B) => /* @__PURE__ */ r(
      "section",
      {
        "aria-label": ze[l],
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
            ze[l],
            /* @__PURE__ */ e("span", { className: "qz-count", children: w[l].length })
          ] }),
          w[l].length === 0 && /* @__PURE__ */ e("p", { className: "qz-lane-empty", children: "No tickets" }),
          /* @__PURE__ */ e("ul", { className: "qz-cards", children: w[l].map((v, E) => /* @__PURE__ */ e(
            "li",
            {
              draggable: !M && !W(i.index, v),
              onDragStart: (O) => {
                y.current = v, O.dataTransfer.setData("text/plain", v.path), O.dataTransfer.effectAllowed = "move";
              },
              onDragEnd: () => {
                y.current = null;
              },
              onDragOver: (O) => {
                !M && l !== "repair" && O.preventDefault();
              },
              onDrop: (O) => {
                l !== "repair" && de(O, l, v);
              },
              children: /* @__PURE__ */ e(
                ht,
                {
                  ticket: v,
                  lane: B,
                  index: E,
                  onOpen: () => u(Z),
                  disabled: M || !!W(i.index, v),
                  maintenance: i.index.maintenance ?? [],
                  onMove: (O, I) => le(v, O, I),
                  onDemote: () => {
                    window.confirm(`Remove “${v.title}” from the board? Its note and TODOs will remain.`) && q.run(() => it(n, o, v));
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
function pt(t) {
  const [n, a] = m(""), [s, o] = m(""), [u, i] = m(""), [p, z] = m("backlog"), [c, f] = m(null), [q, w] = m(null), [S, g] = m(!1), y = L(0), x = L(!0);
  R(() => (x.current = !0, () => {
    x.current = !1, y.current++;
  }), []);
  const h = ie(t.onChanged);
  R(() => (t.onBusy(h.pending), () => t.onBusy(!1)), [h.pending, t.onBusy]);
  const b = t.disabled || h.pending || S, N = t.maintenance.includes(t.mode === "promote" ? "backlog" : p);
  R(() => {
    var C, _;
    (((C = h.failure) == null ? void 0 : C.code) === "rank_exhausted" || ((_ = h.failure) == null ? void 0 : _.code) === "maintenance_pending") && t.onMaintenanceNeeded(t.mode === "promote" ? "backlog" : p);
  }, [h.failure, t.mode, t.onMaintenanceNeeded, p]);
  const $ = () => {
    y.current++, g(!1), a(""), o(""), i(""), f(null), w(null), t.onClose();
  }, M = n.trim().endsWith(".md") ? n.trim() : `${n.trim()}.md`, A = async () => {
    const C = ++y.current;
    g(!0), w(null), f(null);
    try {
      const _ = await Y(Ve(t.api, t.workspace.id, M));
      x.current && C === y.current && f(_);
    } catch (_) {
      x.current && C === y.current && w(Q(_));
    } finally {
      x.current && C === y.current && g(!1);
    }
  }, U = async () => {
    await h.run(() => t.mode === "create" ? Je(t.api, t.workspace.id, { path: M, title: s.trim(), body: u, status: p }) : Ye(t.api, t.workspace.id, c)) && x.current && (a(""), o(""), i(""), f(null), t.onClose());
  }, d = t.mode === "create", k = d ? "New ticket" : "Use existing note", K = !b && !N && !!n.trim() && (d ? !!s.trim() : !!c);
  return /* @__PURE__ */ r("section", { className: "qz-panel-surface qz-ticket-form", "aria-label": k, children: [
    /* @__PURE__ */ e("h3", { children: k }),
    /* @__PURE__ */ r("form", { className: "qz-stack", onSubmit: (C) => {
      C.preventDefault(), K && U();
    }, children: [
      d && /* @__PURE__ */ r("label", { className: "qz-field", children: [
        "Title",
        /* @__PURE__ */ e("input", { className: "qz-input", ref: t.firstField, "aria-label": "Ticket title", placeholder: "Fix login", value: s, disabled: h.pending, onChange: (C) => o(C.target.value) })
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
            disabled: h.pending,
            onChange: (C) => {
              y.current++, g(!1), a(C.target.value), f(null);
            }
          }
        )
      ] }),
      d ? /* @__PURE__ */ r(F, { children: [
        /* @__PURE__ */ r("label", { className: "qz-field", children: [
          /* @__PURE__ */ r("span", { children: [
            "Description ",
            /* @__PURE__ */ e("span", { className: "qz-muted", children: "· Optional Markdown" })
          ] }),
          /* @__PURE__ */ e("textarea", { className: "qz-input", "aria-label": "Ticket description", placeholder: "What needs to happen?", value: u, disabled: h.pending, onChange: (C) => i(C.target.value), rows: 4 })
        ] }),
        /* @__PURE__ */ r("label", { className: "qz-field", children: [
          "Initial status",
          /* @__PURE__ */ e("select", { className: "qz-input", value: p, disabled: h.pending, onChange: (C) => z(C.target.value), children: G.map((C) => /* @__PURE__ */ e("option", { value: C, children: J[C] }, C)) })
        ] })
      ] }) : /* @__PURE__ */ r(F, { children: [
        /* @__PURE__ */ e("div", { className: "qz-actions", children: /* @__PURE__ */ e("button", { type: "button", className: "qz-button", disabled: b || !n.trim(), onClick: () => void A(), children: "Preview note" }) }),
        c && /* @__PURE__ */ r(F, { children: [
          /* @__PURE__ */ e("pre", { className: "qz-mono qz-note-preview", children: c.content }),
          /* @__PURE__ */ e("p", { className: "qz-muted", children: "The note will appear in Backlog. Its content and existing properties are preserved." })
        ] })
      ] }),
      N && /* @__PURE__ */ e("span", { className: "qz-notice", children: "Resume ordering maintenance for this column before adding a ticket." }),
      /* @__PURE__ */ e(D, { failure: q }),
      /* @__PURE__ */ e(D, { failure: h.failure }),
      /* @__PURE__ */ r("div", { className: "qz-actions", children: [
        /* @__PURE__ */ e("button", { type: "submit", className: "qz-button", "data-variant": "primary", disabled: !K, children: d ? "Create ticket" : "Make ticket" }),
        /* @__PURE__ */ e("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: h.pending, onClick: $, children: "Cancel" })
      ] })
    ] })
  ] });
}
function ht(t) {
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
            G.map((a) => /* @__PURE__ */ e("option", { value: a, disabled: t.maintenance.includes(a), children: J[a] }, a))
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
function mt(t) {
  const { api: n } = t, a = ve(), { companions: s, failure: o } = Ce(n), [u, i] = m("all"), [p, z] = m("open"), [c, f] = m(""), q = L(null);
  R(() => {
    s && u !== "all" && !s.some((d) => d.workspace.id === u) && i("all");
  }, [s, u]);
  const w = u === "all" ? void 0 : u, S = !!s && s.length > 0, { data: g, failure: y, busy: x, refresh: h, reload: b } = Te(
    S,
    `${u}:${p}`,
    () => Ke(n, p, w),
    (d) => ae(n, { workspaceId: w, manual: d }),
    (d) => Object.values(d.index).some((k) => k.state === "scanning")
  ), N = xe(() => Qe((g == null ? void 0 : g.groups) ?? [], c), [g, c]), $ = N.reduce((d, k) => d + k.items.length, 0), M = g ? Object.values(g.index) : [], A = ie(b), U = (d, k, K) => {
    A.pending || y || x || W(g == null ? void 0 : g.index[String(d.workspaceId)], d) || k.markerStart === void 0 || A.run(() => Ze(n, d, k, K));
  };
  return o ? /* @__PURE__ */ e(D, { failure: o }) : s ? s.length === 0 ? /* @__PURE__ */ e(Oe, { onSettings: t.onSettings }) : /* @__PURE__ */ r("div", { className: "qz-stack qz-todos", children: [
    /* @__PURE__ */ r("div", { className: "qz-view-heading", children: [
      /* @__PURE__ */ r("div", { children: [
        /* @__PURE__ */ e("h2", { className: "qz-section-title", children: "Note checklists" }),
        /* @__PURE__ */ e("p", { className: "qz-section-description", children: "Find and complete Markdown TODOs across your shared folders." })
      ] }),
      /* @__PURE__ */ r("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => a(Z), children: [
        /* @__PURE__ */ e(T, { name: "external" }),
        "Open Kiro Notes"
      ] })
    ] }),
    /* @__PURE__ */ r("div", { className: "qz-todo-filters qz-panel-surface", children: [
      /* @__PURE__ */ r("label", { className: "qz-field", children: [
        "Search",
        /* @__PURE__ */ r("span", { className: "qz-search", children: [
          /* @__PURE__ */ e(T, { name: "search" }),
          /* @__PURE__ */ e("input", { className: "qz-input", ref: q, type: "search", "aria-label": "Filter TODOs", placeholder: "Search tasks or notes…", value: c, onChange: (d) => f(d.target.value) })
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
        /* @__PURE__ */ r("select", { className: "qz-input", value: p, onChange: (d) => z(d.target.value), children: [
          /* @__PURE__ */ e("option", { value: "open", children: "Open" }),
          /* @__PURE__ */ e("option", { value: "done", children: "Completed" }),
          /* @__PURE__ */ e("option", { value: "all", children: "All" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ r("div", { className: "qz-toolbar qz-board-meta", children: [
      g && /* @__PURE__ */ r("span", { className: "qz-result-count", role: "status", children: [
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
        /* @__PURE__ */ r("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => void h(), disabled: x || A.pending, children: [
          /* @__PURE__ */ e(T, { name: "refresh" }),
          "Refresh"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ e($e, { statuses: M }),
    /* @__PURE__ */ e(D, { failure: y }),
    /* @__PURE__ */ e(D, { failure: A.failure }),
    (g == null ? void 0 : g.truncated) && /* @__PURE__ */ e("div", { role: "note", className: "qz-notice", children: "Only the first items are listed. Narrow the list by workspace or completion status." }),
    !g && !y && /* @__PURE__ */ e("p", { className: "qz-empty", role: "status", children: "Loading TODOs…" }),
    g && N.length === 0 && /* @__PURE__ */ r("div", { className: "qz-empty", children: [
      /* @__PURE__ */ e("span", { className: "qz-empty-icon", children: /* @__PURE__ */ e(T, { name: c.trim() ? "search" : "checklist" }) }),
      /* @__PURE__ */ e("h3", { children: c.trim() ? "No matching TODOs" : "No TODOs to show" }),
      /* @__PURE__ */ e("p", { children: c.trim() ? "Try a different search or clear the filter." : "Choose a different workspace or completion status to see more." }),
      c.trim() && /* @__PURE__ */ e("button", { type: "button", className: "qz-button", onClick: () => {
        var d;
        f(""), (d = q.current) == null || d.focus();
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
              J[d.status]
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
              disabled: A.pending || !!y || x || !!W(g == null ? void 0 : g.index[String(d.workspaceId)], d) || k.markerStart === void 0,
              onChange: (K) => U(d, k, K.target.checked)
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
            onClick: () => a(Z),
            className: "qz-button qz-icon-button",
            "data-variant": "quiet",
            children: /* @__PURE__ */ e(T, { name: "external" })
          }
        )
      ] }, k.ordinal)) })
    ] }, `${d.workspaceId}:${d.path}`)) })
  ] }) : /* @__PURE__ */ e("p", { className: "qz-empty", role: "status", children: "Loading workspaces…" });
}
function gt(t, n) {
  const a = n[0].id, s = n.map((o) => `- ${o.id} (${JSON.stringify(o.label)})`).join(`
`);
  return `Work with Quartizo and Kiro Notes by editing Markdown files in the connected folder ${JSON.stringify(t)}.

- Keep note operations within this exact folder. If you delegate, pass the absolute path to the worker and have it verify that its changes land in that folder.
- Find and read the current note before updating it. Use a new, unused .md path inside the folder for new notes. Use UTF-8 with LF line endings for new files. Preserve existing line endings, unrelated text, and YAML properties when editing. Re-read before saving if the file may have changed, and stop if the edit conflicts with another writer.
- A regular note can start with a # Title heading and needs no ticket metadata. Create a ticket only when asked for a board card. Put its YAML frontmatter at the very start of the file. Generate a fresh UUID for each new ticket and preserve existing ticket IDs.

Use these ticket status IDs, listed in board order.
${s}

Use this template for a new ticket. Replace the example UUID and calculate the order before saving.

\`\`\`markdown
---
id: "8423e295-12ce-4b61-a281-d719c1fa86f6"
type: ticket
status: "${a}"
order: "7fffffffffffffffffffffffffffffff"
---

# Ticket title

- [ ] An actionable TODO
\`\`\`

- Use the first status unless the user specifies a column. Append a new or moved card by inspecting the destination column's current ticket notes. With exact integer arithmetic, take the floor of (largest order + 0xffffffffffffffffffffffffffffffff) / 2, using 0 as the largest order for an empty column. Write the result as a quoted, zero-padded, 32-character lowercase hex string. If the midpoint equals the largest order or the column has invalid metadata, stop and report that it needs repair or rebalancing in Quartizo. Preserve status and order on ordinary note edits.
- Add TODOs to the relevant note as \`- [ ] text\` lines outside tables and code fences. Use lowercase \`- [x] text\` for completed items. To complete or reopen an existing TODO, change only that item's checkbox marker. Keep checklist completion independent of ticket status. If an existing note uses CRLF, explain that its TODOs need LF and ask before converting the note.
- Verify the resulting Markdown and report the note paths you changed. Quartizo picks up file edits on its next scan or when the user clicks Refresh.`;
}
const ft = '.qz-settings{display:grid;align-content:start;gap:20px;width:100%;max-width:1100px;min-width:0;margin-inline:auto;container:qz-settings / inline-size}.qz-settings .qz-settings-grid{display:grid;align-items:start;gap:20px}@container qz-settings (min-width: 760px){.qz-settings .qz-settings-grid{grid-template-columns:minmax(0,1fr) minmax(260px,330px)}}.qz-settings .qz-settings-folders,.qz-settings .qz-settings-add,.qz-settings .qz-settings-folder,.qz-settings .qz-settings-migration,.qz-settings .qz-settings-notice{display:grid;min-width:0;gap:12px}.qz-settings .qz-settings-add,.qz-settings .qz-settings-folder{padding:16px}.qz-settings .qz-settings-add p{margin-block-start:4px}.qz-settings .qz-settings-add .qz-input{width:100%}.qz-settings .qz-settings-add>.qz-button{justify-self:start}.qz-settings .qz-settings-heading,.qz-settings .qz-settings-folder-identity,.qz-settings .qz-settings-folder-controls,.qz-settings .qz-settings-actions,.qz-settings .qz-settings-check{display:flex;align-items:center}.qz-settings .qz-settings-heading,.qz-settings .qz-settings-folder-identity,.qz-settings .qz-settings-check{gap:10px}.qz-settings .qz-settings-heading h3,.qz-settings .qz-settings-add h3,.qz-settings .qz-settings-folder h4{margin:0;color:var(--qz-text);font-size:15px;font-weight:650}.qz-settings .qz-settings-count{padding:1px 7px;border:1px solid var(--qz-border);border-radius:999px;color:var(--qz-muted);font-size:12px;font-variant-numeric:tabular-nums}.qz-settings .qz-settings-folder-icon{display:grid;flex:none;width:36px;height:36px;place-items:center;border-radius:9px;background:var(--qz-accent-soft);color:var(--qz-accent)}.qz-settings .qz-settings-folder-identity>div{display:grid;min-width:0;gap:3px;overflow-wrap:anywhere}.qz-settings .qz-settings-folder-controls{justify-content:space-between;flex-wrap:wrap;gap:8px 12px;padding-block-start:10px;border-top:1px solid var(--qz-border)}.qz-settings .qz-settings-actions{flex-wrap:wrap;gap:4px}.qz-settings .qz-settings-check{min-height:32px;font-size:13px;cursor:pointer}.qz-settings .qz-settings-check input{flex:none;accent-color:var(--qz-accent)}.qz-settings .qz-settings-toggle{display:inline-grid;align-items:center;justify-items:start;-webkit-appearance:none;-moz-appearance:none;appearance:none;width:34px;height:20px;padding:2px;margin:0;border:1px solid var(--qz-muted);border-radius:999px;background:var(--qz-elevated);cursor:inherit}.qz-settings .qz-settings-toggle:before{width:12px;height:12px;border-radius:50%;background:var(--qz-muted);content:""}.qz-settings .qz-settings-toggle:checked{justify-items:end;border-color:var(--qz-accent);background:var(--qz-accent-soft)}.qz-settings .qz-settings-toggle:checked:before{background:var(--qz-accent)}.qz-settings .qz-settings-toggle:disabled{opacity:.6;cursor:default}@media (forced-colors: active){.qz-settings .qz-settings-toggle{display:inline-block;-webkit-appearance:auto;-moz-appearance:auto;appearance:auto;width:16px;height:16px}}.qz-settings .qz-settings-migration,.qz-settings .qz-settings-result{padding:12px;border:1px solid var(--qz-border);border-radius:9px;background:var(--qz-canvas);font-size:13px}.qz-settings .qz-settings-migration{gap:6px}.qz-settings .qz-settings-notice{gap:8px;overflow-wrap:anywhere}.qz-settings .qz-settings-migration-files{max-height:200px;margin:0;padding-inline-start:20px;overflow-y:auto;list-style:disc}.qz-settings .qz-button[data-destructive]{color:var(--qz-danger)}.qz-settings-disclosure{border-top:1px solid var(--qz-border);font-size:13px}.qz-settings-disclosure>summary{padding-block:8px;font-weight:650;cursor:pointer}.qz-agent-prompt{width:100%}';
function re() {
  const [t, n] = m(!1), [a, s] = m(null);
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
function zt(t) {
  const { api: n } = t, [a, s] = m(null), [o, u] = m(null), [i, p] = m(null), [z, c] = m(0), [f, q] = m(""), [w, S] = m(""), { busy: g, failure: y, run: x } = re();
  R(() => {
    let b = !1;
    return Promise.all([Ee(n), we(n)]).then(([N, $]) => {
      b || (s(N), p($.writeBlocked ?? null), u(null));
    }).catch((N) => !b && u(Q(N))), () => {
      b = !0;
    };
  }, [n, z]);
  const h = async () => {
    await x(() => Pe(n, f.trim(), w.trim() || void 0)) && (q(""), S(""), c((b) => b + 1));
  };
  return /* @__PURE__ */ r("div", { className: "qz-settings", children: [
    /* @__PURE__ */ e("style", { children: ft }),
    /* @__PURE__ */ r("header", { children: [
      /* @__PURE__ */ e("h2", { className: "qz-section-title", children: "Settings" }),
      /* @__PURE__ */ e("p", { className: "qz-section-description", children: "Manage connected folders or start a notes request in KiroCrew." })
    ] }),
    /* @__PURE__ */ e(D, { failure: o }),
    /* @__PURE__ */ e(D, { failure: i }),
    /* @__PURE__ */ r("div", { className: "qz-settings-grid", children: [
      /* @__PURE__ */ r("section", { className: "qz-settings-folders", "aria-labelledby": "qz-settings-folders", children: [
        /* @__PURE__ */ r("div", { className: "qz-settings-heading", children: [
          /* @__PURE__ */ e("h3", { id: "qz-settings-folders", children: "Connected folders" }),
          a && /* @__PURE__ */ e("span", { className: "qz-settings-count", children: a.length })
        ] }),
        !a && !o && /* @__PURE__ */ e("p", { className: "qz-muted", role: "status", children: "Loading folders…" }),
        (a == null ? void 0 : a.length) === 0 && /* @__PURE__ */ e("p", { className: "qz-empty", children: "Add a folder to start viewing its tickets and TODOs." }),
        a == null ? void 0 : a.map((b) => /* @__PURE__ */ e(qt, { api: n, workspace: b, writeBlocked: i, onChanged: () => c((N) => N + 1) }, b.id))
      ] }),
      /* @__PURE__ */ r(
        "form",
        {
          className: "qz-panel-surface qz-settings-add",
          "aria-labelledby": "qz-settings-add",
          "aria-busy": g,
          onSubmit: (b) => {
            b.preventDefault(), f.trim() && !g && h();
          },
          children: [
            /* @__PURE__ */ r("div", { children: [
              /* @__PURE__ */ e("h3", { id: "qz-settings-add", children: "Add a folder" }),
              /* @__PURE__ */ e("p", { className: "qz-muted", children: "Use the same folder path you added in Kiro Notes." })
            ] }),
            /* @__PURE__ */ r("label", { className: "qz-field", children: [
              "Absolute folder path",
              /* @__PURE__ */ e("input", { className: "qz-input", placeholder: "/home/you/notes", value: f, onChange: (b) => q(b.target.value) })
            ] }),
            /* @__PURE__ */ r("label", { className: "qz-field", children: [
              /* @__PURE__ */ r("span", { children: [
                "Name ",
                /* @__PURE__ */ e("span", { className: "qz-muted", children: "(optional)" })
              ] }),
              /* @__PURE__ */ e("input", { className: "qz-input", placeholder: "e.g. Project notes", value: w, onChange: (b) => S(b.target.value) })
            ] }),
            /* @__PURE__ */ e("button", { className: "qz-button", "data-variant": "primary", type: "submit", disabled: g || !f.trim(), children: "Add folder" }),
            /* @__PURE__ */ e(D, { failure: y })
          ]
        }
      )
    ] })
  ] });
}
function qt(t) {
  const { api: n, workspace: a } = t, { busy: s, failure: o, run: u } = re(), [i, p] = m(null), [z, c] = m(!1);
  return R(() => {
    if (!i) return;
    const f = setTimeout(() => p(null), 3e3);
    return () => clearTimeout(f);
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
            onChange: () => void u(() => je(n, a.id, !a.companion)).then((f) => f && t.onChanged())
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
              (f) => f && p("Rebuild requested.")
            ),
            disabled: s,
            children: "Rebuild index"
          }
        ),
        !z && /* @__PURE__ */ e("button", { className: "qz-button", "data-variant": "quiet", type: "button", onClick: () => c(!0), disabled: s, children: "Remove…" })
      ] })
    ] }),
    a.companion && /* @__PURE__ */ e(vt, { workspace: a }),
    !!a.oldTasks && /* @__PURE__ */ e(xt, { api: n, workspace: a, writeBlocked: t.writeBlocked, onChanged: t.onChanged }),
    z && /* @__PURE__ */ r("div", { role: "alertdialog", "aria-label": "Remove folder", className: "qz-notice qz-settings-notice", children: [
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
            onClick: () => void u(() => Fe(n, a.id, !!a.oldTasks)).then((f) => f && t.onChanged()),
            disabled: s,
            children: a.oldTasks ? `Remove and delete ${a.oldTasks} task(s)` : "Remove"
          }
        ),
        /* @__PURE__ */ e("button", { className: "qz-button", "data-variant": "quiet", type: "button", onClick: () => c(!1), disabled: s, children: "Cancel" })
      ] })
    ] }),
    i && /* @__PURE__ */ e("span", { className: "qz-muted", role: "status", children: i }),
    /* @__PURE__ */ e(D, { failure: o })
  ] });
}
const bt = G.map((t) => ({ id: t, label: J[t] }));
function vt({ workspace: t }) {
  const { openChat: n } = Le(), a = gt(t.path, bt), s = L(null), [o, u] = m(""), i = async () => {
    var p, z;
    try {
      await navigator.clipboard.writeText(a), u("Agent prompt copied.");
    } catch {
      (p = s.current) == null || p.focus(), (z = s.current) == null || z.select(), u("Copy the selected text to use the prompt.");
    }
  };
  return /* @__PURE__ */ r("details", { className: "qz-settings-disclosure", children: [
    /* @__PURE__ */ e("summary", { children: "Work with a Bot or agent" }),
    /* @__PURE__ */ r("div", { className: "qz-stack", children: [
      /* @__PURE__ */ e("p", { className: "qz-muted", children: "Open a draft in KiroCrew, pick a Bot or agent in the chat composer, then add your request and send it. The selected agent needs access to this folder." }),
      /* @__PURE__ */ e("div", { className: "qz-settings-actions", children: /* @__PURE__ */ r("button", { type: "button", className: "qz-button", "data-variant": "primary", onClick: () => n({ message: a, autoSend: !1 }), children: [
        /* @__PURE__ */ e(T, { name: "external" }),
        "Open in KiroCrew chat"
      ] }) }),
      /* @__PURE__ */ e("textarea", { ref: s, className: "qz-input qz-mono qz-agent-prompt", "aria-label": "Agent prompt", value: a, rows: 8, readOnly: !0 }),
      /* @__PURE__ */ r("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ r("button", { type: "button", className: "qz-button", onClick: () => void i(), children: [
          /* @__PURE__ */ e(T, { name: "copy" }),
          "Copy agent prompt"
        ] }),
        /* @__PURE__ */ e("span", { className: "qz-muted", role: "status", children: o })
      ] })
    ] })
  ] });
}
function xt({ api: t, workspace: n, writeBlocked: a, onChanged: s }) {
  const [o, u] = m(null), [i, p] = m(null), [z, c] = m(!1), [f, q] = m(!1), { busy: w, failure: S, run: g } = re(), y = async () => {
    const h = await at(t, n.id), b = URL.createObjectURL(new Blob([JSON.stringify(h, null, 2)], { type: "application/json" })), N = document.createElement("a");
    N.href = b, N.download = `quartizo-old-tasks-${n.id}.json`, N.click(), setTimeout(() => URL.revokeObjectURL(b), 1e3), c(!0);
  }, x = async () => {
    if (!o) return;
    const h = await nt(t, n.id, o.planHash, f);
    p(h), u(null), s();
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
      /* @__PURE__ */ e("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: w, onClick: () => void g(y), children: "Export old tasks" }),
      /* @__PURE__ */ e("button", { className: "qz-button", type: "button", disabled: w || !n.companion, onClick: () => void g(async () => {
        u(await tt(t, n.id)), p(null), q(!1);
      }), children: "Preview migration" })
    ] }),
    z && /* @__PURE__ */ e("span", { className: "qz-muted", role: "status", children: "Export downloaded." }),
    o && /* @__PURE__ */ r("div", { role: "alertdialog", "aria-label": "Confirm old task migration", className: "qz-notice qz-settings-notice", children: [
      /* @__PURE__ */ r("strong", { children: [
        "Create ",
        o.tasks.filter((h) => !h.migrated).length,
        " ticket note(s)"
      ] }),
      /* @__PURE__ */ e("p", { children: "Quartizo backs up the database tasks before writing each ticket to a new file." }),
      o.warnings.map((h, b) => /* @__PURE__ */ e("p", { children: h }, b)),
      /* @__PURE__ */ e("ul", { className: "qz-settings-migration-files", children: o.tasks.map((h) => /* @__PURE__ */ r("li", { children: [
        h.title,
        " → ",
        /* @__PURE__ */ e("code", { children: h.path }),
        " (",
        h.status,
        ")",
        h.migrated && " · already migrated",
        h.noteRef && /* @__PURE__ */ r("span", { children: [
          " · linked note: ",
          h.noteRef
        ] }),
        h.slotId && /* @__PURE__ */ r("span", { children: [
          " · session: ",
          h.slotId
        ] })
      ] }, h.uid)) }),
      o.tasks.some((h) => h.changed) && !o.complete && /* @__PURE__ */ r("label", { className: "qz-settings-check", children: [
        /* @__PURE__ */ e("input", { type: "checkbox", checked: f, onChange: (h) => q(h.target.checked), disabled: w }),
        "I reviewed the changed converted notes; keep their latest contents when resuming"
      ] }),
      /* @__PURE__ */ r("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ e("button", { className: "qz-button", "data-variant": "primary", type: "button", disabled: w || !!a || o.complete || !o.tasks.length, onClick: () => void g(x), children: o.backup ? "Resume and verify migration" : "Back up and migrate" }),
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
    /* @__PURE__ */ e(D, { failure: S })
  ] });
}
const kt = ".qz-app{--qz-canvas: var(--bg, Canvas);--qz-surface: var(--card, Canvas);--qz-elevated: var(--bg-elevated, Canvas);--qz-border: var(--border, color-mix(in srgb, CanvasText 18%, Canvas));--qz-text: var(--text-strong, CanvasText);--qz-muted: color-mix(in srgb, var(--muted, CanvasText) 87%, var(--qz-text));--qz-accent: var(--accent, LinkText);--qz-accent-soft: var(--accent-subtle, color-mix(in srgb, var(--qz-accent) 13%, transparent));--qz-ok: var(--ok, #4e9a6b);--qz-warning: var(--warn, #ad7628);--qz-danger: var(--danger, #c7465d);--qz-info: var(--info, var(--qz-accent));container:qz-app / inline-size;width:100%;max-width:1560px;min-width:0;margin-inline:auto;padding:24px clamp(16px,3%,40px) 36px;color:var(--qz-text)}.qz-app,.qz-app *{box-sizing:border-box}.qz-app [hidden]{display:none!important}.qz-app :where(h1,h2,h3,p,ul){margin:0}.qz-app :where(button,input,textarea,select){font:inherit}.qz-app :is(button,summary,input,textarea,select,.qz-board):focus-visible{outline:2px solid var(--qz-accent);outline-offset:2px}.qz-app :is(button,input,textarea,select):disabled{opacity:.55;cursor:default}.qz-app input[type=checkbox]{accent-color:var(--qz-accent)}.qz-icon{width:1rem;height:1rem;flex:none}.qz-header,.qz-brand,.qz-tabs,.qz-view-heading,.qz-toolbar,.qz-actions,.qz-inline-field{display:flex;align-items:center;min-width:0}.qz-header,.qz-view-heading,.qz-toolbar{justify-content:space-between;flex-wrap:wrap;gap:12px 20px}.qz-header{padding:0 0 20px;border-bottom:1px solid var(--qz-border)}.qz-brand{gap:12px}.qz-mark{display:grid;place-items:center;flex:none;width:46px;height:46px;border:1px solid color-mix(in srgb,var(--qz-accent) 34%,var(--qz-border));border-radius:13px;background:linear-gradient(145deg,var(--qz-accent-soft),var(--qz-surface));color:var(--qz-accent)}.qz-mark .qz-icon{width:26px;height:26px}.qz-brand h1{font-size:24px;font-weight:700;letter-spacing:-.035em;line-height:1.1}.qz-brand p{margin-top:3px;color:var(--qz-muted);font-size:12px}.qz-tabs{max-width:100%;gap:3px;padding:4px;border:1px solid var(--qz-border);border-radius:12px;background:var(--qz-surface)}.qz-tabs button{display:flex;align-items:center;justify-content:center;gap:7px;min-height:36px;padding:6px 12px;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--qz-muted);font-size:13px;font-weight:600;cursor:pointer}.qz-tabs button:hover{color:var(--qz-text);background:var(--qz-elevated)}.qz-tabs button[aria-selected=true]{border-color:color-mix(in srgb,var(--qz-accent) 25%,var(--qz-border));background:var(--qz-accent-soft);color:var(--qz-text)}.qz-tabs button[aria-selected=true] .qz-icon{color:var(--qz-accent)}.qz-content{padding-top:24px}.qz-stack{display:grid;gap:14px;min-width:0}.qz-section-title{font-size:27px;font-weight:700;letter-spacing:-.032em;line-height:1.17}.qz-section-description{margin-top:5px;color:var(--qz-muted)}.qz-muted{color:var(--qz-muted);font-weight:400}.qz-mono{font:400 12px/1.5 var(--mono, ui-monospace, monospace)}.qz-path{display:block;min-width:0;overflow:hidden;color:var(--qz-muted);text-overflow:ellipsis;white-space:nowrap}.qz-actions{gap:6px;flex-wrap:wrap}.qz-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;max-width:100%;min-height:36px;padding:5px 11px;border:1px solid var(--qz-border);border-radius:8px;background:var(--qz-surface);color:var(--qz-text);font-size:13px;font-weight:600;text-align:center;cursor:pointer}.qz-button:not(:disabled):hover{background:var(--qz-elevated);border-color:var(--border-strong, var(--qz-muted))}.qz-button[data-variant=primary]{border-color:var(--qz-accent);background:var(--qz-accent);color:var(--accent-fg, var(--qz-canvas))}.qz-button[data-variant=primary]:not(:disabled):hover{border-color:var(--accent-hover, var(--qz-accent));background:var(--accent-hover, var(--qz-accent))}.qz-button[data-variant=quiet]{border-color:transparent;background:transparent;color:var(--qz-muted)}.qz-button[data-variant=quiet]:not(:disabled):hover{color:var(--qz-text)}.qz-icon-button{min-width:36px;padding-inline:8px}.qz-input{min-width:0;max-width:100%;min-height:36px;padding:6px 9px;border:1px solid var(--qz-border);border-radius:8px;background:var(--qz-elevated);color:var(--qz-text);font-size:13px}.qz-input::placeholder{color:var(--qz-muted);opacity:1}.qz-field{display:grid;gap:5px;min-width:0;font-size:13px;font-weight:600}.qz-field .qz-input{width:100%;font-weight:400}.qz-inline-field{gap:8px;color:var(--qz-muted);font-size:13px}.qz-inline-field .qz-input{max-width:min(36ch,52%);font-weight:600}.qz-check-label{display:flex;align-items:center;gap:8px}.qz-panel-surface{min-width:0;border:1px solid var(--qz-border);border-radius:12px;background:var(--qz-surface)}.qz-notice{padding:11px 13px;border:1px solid color-mix(in srgb,var(--qz-warning) 42%,var(--qz-border));border-radius:9px;background:color-mix(in srgb,var(--qz-warning) 7%,var(--qz-surface));font-size:13px;overflow-wrap:anywhere}.qz-notice[data-variant=neutral]{border-color:var(--qz-border);background:var(--qz-surface)}.qz-notice.qz-error{border-color:color-mix(in srgb,var(--qz-danger) 53%,var(--qz-border));background:color-mix(in srgb,var(--qz-danger) 9%,var(--qz-surface))}.qz-empty{display:grid;place-items:center;gap:8px;padding:28px 16px;border:1px dashed var(--qz-border);border-radius:12px;color:var(--qz-muted);text-align:center}.qz-empty :is(h2,h3){color:var(--qz-text);font-size:17px;font-weight:650}.qz-empty .qz-button{margin-top:4px}.qz-empty-icon,.qz-note-icon{display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:9px;background:var(--qz-accent-soft);color:var(--qz-accent)}.qz-visually-hidden{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.qz-board-meta{gap:2px 12px;padding-block:2px}.qz-board-meta>.qz-actions{margin-inline-start:auto}.qz-result-count{color:var(--qz-muted);font-size:12px;font-weight:600}.qz-index{display:inline-flex;align-items:baseline;gap:7px;color:var(--qz-muted);font-size:12px}.qz-index:empty{display:none}.qz-board{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(172px,1fr);gap:10px;min-width:0;padding:2px 2px 10px;overflow-x:auto;overscroll-behavior-inline:contain}.qz-lane{--qz-status: var(--qz-muted);min-width:0;min-height:308px;padding:9px;border:1px solid color-mix(in srgb,var(--qz-status) 20%,var(--qz-border));border-radius:12px;background:linear-gradient(180deg,color-mix(in srgb,var(--qz-status) 7%,var(--qz-surface)),var(--qz-surface) 105px)}.qz-app [data-lane-status=ready]{--qz-status: var(--qz-info)}.qz-app [data-lane-status=in_progress]{--qz-status: var(--qz-accent)}.qz-app [data-lane-status=review]{--qz-status: var(--qz-warning)}.qz-app [data-lane-status=done]{--qz-status: var(--qz-ok)}.qz-app [data-lane-status=repair]{--qz-status: var(--qz-danger)}.qz-lane-heading{display:flex;align-items:center;gap:7px;padding:3px 2px 10px;font-size:13px;font-weight:650}.qz-dot{width:8px;height:8px;flex:none;border-radius:50%;background:var(--qz-status, var(--qz-ok))}.qz-dot[data-attention=true]{background:var(--qz-warning)}.qz-count{margin-inline-start:auto;padding:1px 6px;border:1px solid var(--qz-border);border-radius:999px;color:var(--qz-muted);font-size:11px;font-variant-numeric:tabular-nums}.qz-lane-empty{padding:11px;border:1px dashed var(--qz-border);border-radius:8px;color:var(--qz-muted);font-size:12px;text-align:center}.qz-cards,.qz-todo-list{list-style:none;padding:0}.qz-cards{display:grid;gap:8px}.qz-cards li{min-width:0}.qz-cards li[draggable=true]{cursor:grab}.qz-cards li[draggable=true]:active{cursor:grabbing}.qz-ticket{border:1px solid var(--qz-border);border-radius:9px;background:var(--qz-elevated);box-shadow:var(--shadow-sm, none)}.qz-ticket:hover,.qz-ticket:focus-within{border-color:var(--border-strong, var(--qz-muted))}.qz-ticket-content{display:grid;gap:5px;padding:10px 10px 8px}.qz-note-link{display:flex;align-items:start;justify-content:space-between;gap:6px;padding:0;border:0;background:transparent;color:var(--qz-text);font-size:14px;font-weight:650;line-height:1.4;text-align:start;overflow-wrap:anywhere;cursor:pointer}.qz-note-link .qz-icon{width:13px;height:13px;margin-top:3px;color:var(--qz-muted)}.qz-note-link:hover{text-decoration:underline}.qz-ticket-progress{display:flex;align-items:center;gap:8px;margin-top:3px;color:var(--qz-muted);font-size:11px;font-variant-numeric:tabular-nums}.qz-ticket-progress progress{width:min(54px,40%);height:5px;accent-color:var(--qz-ok);border:0;border-radius:6px;overflow:hidden}.qz-ticket-progress progress::-webkit-progress-bar{background:var(--qz-border)}.qz-ticket-progress progress::-webkit-progress-value{border-radius:6px;background:var(--qz-ok)}.qz-badge{padding:2px 5px;border-radius:5px;background:color-mix(in srgb,var(--qz-warning) 17%,var(--qz-surface));font-size:11px;overflow-wrap:anywhere}.qz-ticket-footer{position:relative;padding:5px;border-top:1px solid var(--qz-border)}.qz-ticket-status{padding-inline-end:39px}.qz-ticket-status .qz-input{width:100%;min-height:32px;padding:3px 4px;border-color:transparent;background:transparent;color:var(--qz-muted)}.qz-ticket-status .qz-input:not(:disabled):hover{background:var(--qz-surface);border-color:var(--qz-border)}.qz-ticket-actions summary{position:absolute;inset-block-start:5px;inset-inline-end:5px;min-height:32px;list-style:none}.qz-ticket-actions summary::-webkit-details-marker{display:none}.qz-ticket-action-list{display:grid;gap:1px;margin-top:5px;padding-top:5px;border-top:1px solid var(--qz-border)}.qz-ticket-action-list .qz-button{justify-content:start;min-height:32px;text-align:start}.qz-ticket-action-list .qz-destructive:not(:disabled){color:var(--qz-danger)}.qz-ticket-form{display:grid;gap:12px;max-width:630px;padding:16px}.qz-ticket-form h3{font-size:17px;font-weight:650}.qz-note-preview{max-height:180px;margin:0;padding:10px;overflow:auto;background:var(--qz-canvas);white-space:pre-wrap;overflow-wrap:anywhere}.qz-todos{width:100%;max-width:1100px;margin-inline:auto}.qz-todo-filters{display:flex;flex-wrap:wrap;gap:12px;padding:12px}.qz-todo-filters .qz-field{flex:1 1 135px}.qz-todo-filters .qz-field:first-child{flex:3 1 245px}.qz-search{position:relative;display:block}.qz-search .qz-icon{position:absolute;inset-block-start:10px;inset-inline-start:9px;color:var(--qz-muted);pointer-events:none}.qz-search .qz-input{padding-inline-start:32px}.qz-todo-header{display:flex;align-items:center;gap:10px;min-width:0;padding:12px 14px}.qz-todo-identity{flex:1;min-width:0}.qz-todo-identity h3{display:flex;align-items:center;flex-wrap:wrap;gap:5px 9px;font-size:15px;font-weight:650;overflow-wrap:anywhere}.qz-todo-meta{display:flex;align-items:baseline;gap:6px;color:var(--qz-muted);font-size:12px}.qz-todo-meta>span:first-child{min-width:0;overflow-wrap:anywhere}.qz-status-pill{--qz-status: var(--qz-muted);display:inline-flex;align-items:center;gap:5px;padding:1px 7px;border-radius:999px;background:color-mix(in srgb,var(--qz-status) 13%,var(--qz-surface));font-size:11px;font-weight:500}.qz-status-pill .qz-dot{width:6px;height:6px}.qz-todo-row{display:flex;align-items:center;border-top:1px solid var(--qz-border)}.qz-todo-row:hover,.qz-todo-row:focus-within{background:var(--qz-elevated)}.qz-todo-row:last-child{border-radius:0 0 12px 12px}.qz-todo-check{display:flex;align-items:baseline;gap:10px;flex:1;min-width:0;padding:10px 14px;overflow-wrap:anywhere;cursor:pointer}.qz-todo-check input{flex:none;align-self:start;width:16px;height:16px;margin:2px 0 0}.qz-todo-check:has(input:disabled){cursor:default}.qz-todo-row[data-checked=true] .qz-todo-check span{color:var(--qz-muted);text-decoration:line-through}.qz-todo-row>.qz-button{margin-inline-end:6px}@container qz-app (max-width: 650px){.qz-board{grid-auto-columns:clamp(170px,65cqi,244px)}}@container qz-app (max-width: 520px){.qz-header{gap:14px;padding-bottom:14px}.qz-tabs{width:100%}.qz-tabs button{flex:1;gap:5px;padding-inline:5px}.qz-content{padding-top:18px}.qz-section-title{font-size:24px}.qz-inline-field{width:100%}.qz-inline-field .qz-input{flex:1;max-width:none}.qz-board-meta>.qz-actions{margin-inline-start:0}.qz-todo-filters .qz-field:first-child{flex-basis:100%}.qz-todo-header{padding-inline:10px}.qz-todo-header .qz-note-icon{display:none}}@media (pointer: coarse){.qz-app :is(.qz-button,.qz-tabs button,.qz-input,.qz-ticket-status .qz-input,.qz-ticket-actions summary){min-height:42px}}", H = [
  { id: "tasks", label: "Tasks", icon: "board" },
  { id: "todos", label: "TODOs", icon: "checklist" },
  { id: "settings", label: "Settings", icon: "settings" }
];
function Ct() {
  const t = De(), [n, a] = m("tasks"), s = L(null), o = (i) => {
    var c;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(i.key)) return;
    i.preventDefault();
    const p = H.findIndex((f) => f.id === n), z = i.key === "Home" ? H[0] : i.key === "End" ? H[H.length - 1] : H[(p + (i.key === "ArrowRight" ? 1 : H.length - 1)) % H.length];
    a(z.id), (c = i.currentTarget.querySelector(`#qz-tab-${z.id}`)) == null || c.focus();
  }, u = () => {
    var i, p;
    a("settings"), (p = (i = s.current) == null ? void 0 : i.querySelector("#qz-tab-settings")) == null || p.focus();
  };
  return /* @__PURE__ */ r("div", { className: "qz-app", children: [
    /* @__PURE__ */ e("style", { children: kt }),
    /* @__PURE__ */ r("header", { className: "qz-header", children: [
      /* @__PURE__ */ r("div", { className: "qz-brand", children: [
        /* @__PURE__ */ e("span", { className: "qz-mark", children: /* @__PURE__ */ e(T, { name: "gem" }) }),
        /* @__PURE__ */ r("div", { children: [
          /* @__PURE__ */ e("h1", { children: "Quartizo" }),
          /* @__PURE__ */ e("p", { children: "Kiro Notes companion" })
        ] })
      ] }),
      /* @__PURE__ */ e("div", { className: "qz-tabs", ref: s, role: "tablist", "aria-label": "Quartizo", onKeyDown: o, children: H.map((i) => /* @__PURE__ */ r(
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
      /* @__PURE__ */ e("div", { hidden: n !== "tasks", children: /* @__PURE__ */ e(dt, { api: t, active: n === "tasks", onSettings: u }) }),
      n === "todos" && /* @__PURE__ */ e(mt, { api: t, onSettings: u }),
      n === "settings" && /* @__PURE__ */ e(zt, { api: t })
    ] })
  ] });
}
export {
  Ct as default
};
