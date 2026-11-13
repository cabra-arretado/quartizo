import { jsx as e, jsxs as s, Fragment as F } from "react/jsx-runtime";
import { useNavigate as xe, useChatLauncher as Le, useAppApi as Be } from "@kirocrew/app-sdk";
import { useState as m, useEffect as D, useRef as B, useMemo as we, useCallback as te } from "react";
const V = "/apps/quartizo/api", Pe = 15e3, ke = { id: "repair", label: "Needs repair" };
function Q(t) {
  const n = t;
  if ((n == null ? void 0 : n.name) === "AppApiPermissionError")
    return { code: "permission_denied", message: "Quartizo has not declared access to this API in app.json." };
  const a = typeof (n == null ? void 0 : n.status) == "number" ? n.status : void 0;
  let i;
  if (typeof (n == null ? void 0 : n.body) == "string" && n.body)
    try {
      const r = JSON.parse(n.body);
      r && typeof r == "object" && !Array.isArray(r) && (i = r);
    } catch {
    }
  const o = typeof (i == null ? void 0 : i.code) == "string" ? i.code : void 0, u = typeof (i == null ? void 0 : i.error) == "string" ? i.error : typeof (n == null ? void 0 : n.message) == "string" ? n.message : String(t);
  return { status: a, code: o, message: u };
}
function Y(t, n = Pe) {
  let a;
  const i = new Promise((o, u) => {
    a = setTimeout(() => u(new Error(`request timed out after ${Math.round(n / 1e3)} s`)), n);
  });
  return Promise.race([t, i]).finally(() => clearTimeout(a));
}
function ye(t) {
  const n = Object.entries(t).filter((a) => a[1] !== void 0 && a[1] !== "").map(([a, i]) => `${encodeURIComponent(a)}=${encodeURIComponent(i)}`);
  return n.length ? `?${n.join("&")}` : "";
}
async function Ee(t) {
  return (await t.get(`${V}/workspaces`)).workspaces;
}
async function Fe(t, n, a) {
  return (await t.post(`${V}/workspaces`, a ? { path: n, name: a, companion: !0 } : { path: n, companion: !0 })).workspace;
}
async function je(t, n, a, i) {
  return (await t.put(j(n, "columns"), { columns: a, columnsVersion: i })).workspace;
}
async function Ue(t, n, a = !1) {
  await t.del(`${V}/workspaces/${n}${a ? "?deleteOldTasks=1" : ""}`);
}
const ne = `${V}/companion`;
function Ne(t) {
  return t.get(ne);
}
function Ke(t, n, a) {
  return t.put(`${V}/workspaces/${n}/companion`, { enabled: a });
}
function ae(t, n = {}) {
  const a = {};
  return n.workspaceId !== void 0 && (a.workspaceId = n.workspaceId), n.rebuild && (a.rebuild = !0), n.manual && (a.manual = !0), t.post(`${ne}/refresh`, a);
}
function _e(t, n) {
  return t.get(`${V}/workspaces/${n}/board`);
}
function We(t, n, a) {
  return t.get(`${ne}/todos${ye({ workspace: a === void 0 ? void 0 : String(a), state: n })}`);
}
function He(t, n) {
  const a = [], i = new Map(t.map((o) => [o.id, []]));
  i.set(ke.id, a);
  for (const o of n) (i.get(o.lane) ?? a).push(o);
  return Object.fromEntries(i);
}
function Ce(t) {
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
      const i = t.error && typeof t.error == "object" ? t.error.message : "the last scan failed";
      return t.state === "stale" ? `The last scan failed (${i}); showing the previous scan.` : `Indexing failed: ${i}.`;
    }
  }
  const n = [];
  return t.migrationPending && n.push("Old task migration is unfinished. Resume it in Settings before editing this workspace."), (a = t.maintenance) != null && a.length && n.push("Some columns have unfinished ordering maintenance. Resume it in Tasks before editing those tickets."), t.complete === !1 ? n.push("The last scan was incomplete (a limit was reached or a folder could not be read): notes it did not reach are shown as last indexed, and none were treated as deleted.") : t.retained && n.push(`${t.retained} note(s) could not be read and are shown as last indexed.`), t.outdated && n.push("This index was built by an older version; refresh to update it."), n.length ? n.join(" ") : null;
}
function Qe(t, n = Date.now()) {
  if (!t) return "";
  if (t.state === "scanning") {
    if (!t.progress) return "Scan queued…";
    const { notes: i, rebuild: o } = t.progress;
    return `Scanning… ${i} ${i === 1 ? "note" : "notes"} read${o ? " (rebuild)" : ""}`;
  }
  if (!t.indexedAt) return "";
  const a = t.files ?? 0;
  return `${a} ${a === 1 ? "note" : "notes"} indexed ${Ve(t.indexedAt, n)}`;
}
function Ve(t, n) {
  const a = Math.max(0, Math.round((n - t) / 1e3));
  if (a < 5) return "just now";
  if (a < 60) return `${a} s ago`;
  const i = Math.round(a / 60);
  return i < 60 ? `${i} min ago` : new Date(t).toLocaleString();
}
function Je(t, n) {
  const a = n.trim().toLocaleLowerCase();
  if (!a) return [...t];
  const i = [];
  for (const o of t) {
    const r = `${o.title}
${o.path}`.toLocaleLowerCase().includes(a) ? o.items : o.items.filter((g) => `${g.text}
${g.heading ?? ""}`.toLocaleLowerCase().includes(a));
    r.length && i.push({ ...o, items: r });
  }
  return i;
}
function ee(t) {
  return t.trim() || "(empty)";
}
function j(t, n) {
  return `${V}/workspaces/${t}/${n}`;
}
function Ye(t, n, a) {
  return t.get(j(n, "source") + ye({ path: a }));
}
function Ge(t, n, a) {
  return t.post(j(n, "tickets"), a);
}
function Ze(t, n, a, i) {
  return t.post(j(n, "tickets/promote"), { path: a.path, expectedHash: a.hash, ...i === void 0 ? {} : { status: i } });
}
function Xe(t, n, a) {
  return t.post(j(n, "tickets/move"), a);
}
function et(t, n, a, i) {
  return t.post(j(n.workspaceId, "todos/toggle"), {
    path: n.path,
    expectedHash: n.hash,
    markerStart: a.markerStart,
    line: a.line,
    column: a.column,
    checked: i
  });
}
function tt(t, n, a, i = !1) {
  return t.post(j(n, "tickets/rebalance"), { status: a, confirm: !0, reconcile: i });
}
function _(t, n) {
  var a, i;
  return t != null && t.writeBlocked ? t.writeBlocked.message : t != null && t.migrationPending ? "Finish the old task migration in Settings before editing this workspace." : !t || t.state !== "ready" || t.complete !== !0 || t.retained || t.outdated || t.error ? "Wait for a complete, current index before editing. Refresh if needed." : n != null && n.status && ((a = t.maintenance) != null && a.includes(n.status)) ? "This column has unfinished order maintenance. Resume maintenance before moving cards." : n && (!n.hash || n.retained || (i = n.diagnostics) != null && i.some((o) => o.code !== "unconfigured_status")) ? "Repair or refresh this note before editing it." : null;
}
function nt(t, n, a, i) {
  if (!n.hash) throw new Error("Refresh this ticket before moving it.");
  const o = t.filter((l) => l.path !== n.path && l.lane === a);
  if (i !== void 0 && (!Number.isInteger(i) || i < 0 || i > o.length))
    throw new Error("The destination card changed. Refresh before moving this ticket.");
  const u = i ?? o.length, r = o[u - 1], g = o[u], x = (l) => {
    if (!l.hash || l.retained || l.diagnostics.length || !l.id || !l.order) throw new Error("Refresh or repair the destination column before moving cards.");
    return { path: l.path, hash: l.hash };
  };
  return {
    path: n.path,
    expectedHash: n.hash,
    status: a,
    ...r ? { before: x(r) } : {},
    ...g ? { after: x(g) } : {}
  };
}
function at(t, n) {
  return t.get(j(n, "migration"));
}
function it(t, n, a, i = !1) {
  return t.post(j(n, "migration"), { planHash: a, confirm: !0, ...i ? { acceptCurrent: !0 } : {} });
}
function rt(t, n) {
  return t.get(j(n, "legacy-tasks"));
}
function st(t, n, a) {
  return t.post(j(n, "tickets/demote"), { path: a.path, expectedHash: a.hash });
}
const G = "/md-notebook";
function ot(t) {
  return (t.split("/").pop() ?? t).replace(/\.md$/i, "");
}
const lt = {
  gem: /* @__PURE__ */ e("path", { d: "M8 4h8l4.5 5L12 21 3.5 9 8 4Zm-4.5 5h17M8 4l1 5 3 12 3-12 1-5" }),
  board: /* @__PURE__ */ s(F, { children: [
    /* @__PURE__ */ e("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }),
    /* @__PURE__ */ e("path", { d: "M9 4v16m6-16v16M6 8h.1M12 8h.1m6 0h.1" })
  ] }),
  checklist: /* @__PURE__ */ e("path", { d: "m3 6 2 2 3-4m3 3h10M3 13l2 2 3-4m3 3h10M3 20h5m3 0h10" }),
  settings: /* @__PURE__ */ s(F, { children: [
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
  more: /* @__PURE__ */ s(F, { children: [
    /* @__PURE__ */ e("circle", { cx: "5", cy: "12", r: "1" }),
    /* @__PURE__ */ e("circle", { cx: "12", cy: "12", r: "1" }),
    /* @__PURE__ */ e("circle", { cx: "19", cy: "12", r: "1" })
  ] }),
  copy: /* @__PURE__ */ s(F, { children: [
    /* @__PURE__ */ e("rect", { x: "8", y: "8", width: "12", height: "12", rx: "2" }),
    /* @__PURE__ */ e("path", { d: "M16 4H6a2 2 0 0 0-2 2v10" })
  ] }),
  search: /* @__PURE__ */ s(F, { children: [
    /* @__PURE__ */ e("circle", { cx: "10.5", cy: "10.5", r: "5.5" }),
    /* @__PURE__ */ e("path", { d: "m15 15 5 5" })
  ] }),
  up: /* @__PURE__ */ e("path", { d: "m6 14 6-6 6 6" }),
  down: /* @__PURE__ */ e("path", { d: "m6 10 6 6 6-6" }),
  check: /* @__PURE__ */ e("path", { d: "m5 12 4 4L19 6" }),
  minus: /* @__PURE__ */ e("path", { d: "M5 12h14" })
};
function M({ name: t }) {
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
      children: lt[t]
    }
  );
}
function L({ failure: t }) {
  return t ? /* @__PURE__ */ e("div", { role: "alert", className: "qz-notice qz-error", "data-code": t.code, children: t.message }) : null;
}
function be() {
  try {
    return window.localStorage;
  } catch {
    return;
  }
}
const ct = 1500, dt = 3e4, ve = "quartizo:workspace";
function ut() {
  const [t, n] = m(() => typeof document > "u" || document.visibilityState !== "hidden");
  return D(() => {
    const a = () => n(document.visibilityState !== "hidden");
    return document.addEventListener("visibilitychange", a), () => document.removeEventListener("visibilitychange", a);
  }, []), t;
}
function Te(t, n = !0) {
  const [a, i] = m(null), [o, u] = m(null);
  return D(() => {
    if (!n) return;
    let r = !1;
    return Ne(t).then((g) => {
      r || (i(g.workspaces.filter((x) => x.workspace.companion)), u(g.available ? null : { message: g.error ?? "The Markdown index is unavailable." }));
    }).catch((g) => !r && u(Q(g))), () => {
      r = !0;
    };
  }, [t, n]), { companions: a, failure: o };
}
function Se(t, n, a, i, o) {
  const u = ut(), [r, g] = m(null), [x, l] = m(null), [q, b] = m(0), [y, N] = m(!1), p = B(null), T = B(a), C = B(i), f = B(o);
  T.current = a, C.current = i, f.current = o, D(() => {
    p.current = null, g(null), l(null);
  }, [n]), D(() => {
    if (!t || !u) return;
    let k = !1, I, h = !0;
    const R = async () => {
      try {
        (h || !p.current || !f.current(p.current)) && await Y(C.current(!1));
        const c = await Y(T.current());
        if (k) return;
        p.current = c, g(c), l(null), N(!1);
      } catch (c) {
        k || (l(Q(c)), N(!1));
      }
      h = !1, k || (I = setTimeout(R, p.current && f.current(p.current) ? ct : dt));
    };
    return R(), () => {
      k = !0, clearTimeout(I);
    };
  }, [t, u, n, q]);
  const z = te(async () => {
    N(!0);
    try {
      await Y(C.current(!0)), l(null), b((k) => k + 1);
    } catch (k) {
      l(Q(k));
    } finally {
      N(!1);
    }
  }, []), w = te(() => {
    p.current = null, N(!0), b((k) => k + 1);
  }, []);
  return { data: r, failure: x, busy: y, refresh: z, reload: w };
}
function $e({ statuses: t }) {
  const n = Date.now(), a = t.map((i) => Qe(i, n)).filter(Boolean);
  return /* @__PURE__ */ e("span", { className: "qz-index", role: "status", children: a.length > 0 && /* @__PURE__ */ s(F, { children: [
    /* @__PURE__ */ e("span", { className: "qz-dot", "data-attention": t.some((i) => i.state === "scanning" || !!Ce(i)) }),
    a.join(" · ")
  ] }) });
}
function Me({ statuses: t }) {
  const n = new Set(t.map(Ce).filter(Boolean));
  return /* @__PURE__ */ e(F, { children: [...n].map((a) => /* @__PURE__ */ e("div", { role: "note", className: "qz-notice", children: a }, a)) });
}
function Oe({ path: t, compact: n = !1 }) {
  const a = ot(t), [i, o] = m("idle");
  D(() => {
    if (i === "idle") return;
    const r = setTimeout(() => o("idle"), 1500);
    return () => clearTimeout(r);
  }, [i]);
  const u = async () => {
    try {
      await navigator.clipboard.writeText(a), o("copied");
    } catch {
      o("failed");
    }
  };
  return /* @__PURE__ */ s(F, { children: [
    /* @__PURE__ */ s(
      "button",
      {
        type: "button",
        className: `qz-button${n ? " qz-icon-button" : ""}`,
        "data-variant": "quiet",
        onClick: () => void u(),
        "aria-label": `Copy note name “${a}”`,
        title: `Copy note name “${a}”`,
        children: [
          /* @__PURE__ */ e(M, { name: i === "copied" ? "check" : "copy" }),
          (!n || i !== "idle") && (i === "copied" ? "Copied" : i === "failed" ? "Copy failed" : "Copy name")
        ]
      }
    ),
    /* @__PURE__ */ e("span", { className: "qz-visually-hidden", role: "status", children: i === "copied" ? "Note name copied." : i === "failed" ? "Could not copy note name." : "" })
  ] });
}
function Re({ onSettings: t }) {
  return /* @__PURE__ */ s("div", { className: "qz-empty", children: [
    /* @__PURE__ */ e("span", { className: "qz-empty-icon", children: /* @__PURE__ */ e(M, { name: "folder" }) }),
    /* @__PURE__ */ e("h2", { children: "Connect a notes folder" }),
    /* @__PURE__ */ e("p", { children: "Share a folder from Kiro Notes to see its tickets and TODOs here." }),
    /* @__PURE__ */ e("button", { type: "button", className: "qz-button", "data-variant": "primary", onClick: t, children: "Open Settings" })
  ] });
}
function pt(t) {
  var g, x;
  const n = t.active ?? !0, { companions: a, failure: i } = Te(t.api, n), [o, u] = m(() => {
    var q;
    const l = Number((q = be()) == null ? void 0 : q.getItem(ve));
    return Number.isInteger(l) && l > 0 ? l : null;
  }), r = ((g = a == null ? void 0 : a.find((l) => l.workspace.id === o)) == null ? void 0 : g.workspace) ?? ((x = a == null ? void 0 : a[0]) == null ? void 0 : x.workspace) ?? null;
  return D(() => {
    var l;
    try {
      r && ((l = be()) == null || l.setItem(ve, String(r.id)));
    } catch {
    }
  }, [r]), i && !a ? /* @__PURE__ */ e(L, { failure: i }) : a ? r ? /* @__PURE__ */ s("div", { className: "qz-stack", children: [
    /* @__PURE__ */ e(L, { failure: i }),
    /* @__PURE__ */ s("div", { className: "qz-view-heading", children: [
      /* @__PURE__ */ s("div", { children: [
        /* @__PURE__ */ e("h2", { className: "qz-section-title", children: "Task board" }),
        /* @__PURE__ */ e("p", { className: "qz-section-description", children: "Plan and track tickets stored in Kiro Notes." })
      ] }),
      /* @__PURE__ */ s("label", { className: "qz-inline-field", children: [
        /* @__PURE__ */ e(M, { name: "folder" }),
        /* @__PURE__ */ e("span", { children: "Workspace" }),
        /* @__PURE__ */ e("select", { className: "qz-input", value: r.id, onChange: (l) => u(Number(l.target.value)), children: a.map((l) => /* @__PURE__ */ e("option", { value: l.workspace.id, children: l.workspace.name }, l.workspace.id)) })
      ] })
    ] }),
    a.map(({ workspace: l }) => /* @__PURE__ */ e("div", { hidden: l.id !== r.id, children: /* @__PURE__ */ e(ht, { api: t.api, workspace: l, active: n && l.id === r.id, onSettings: t.onSettings }) }, l.uid))
  ] }) : /* @__PURE__ */ e(Re, { onSettings: t.onSettings }) : /* @__PURE__ */ e("p", { className: "qz-empty", role: "status", children: "Loading workspaces…" });
}
function ie(t) {
  const [n, a] = m(!1), [i, o] = m(null), u = B(!0), r = B(!1);
  return D(() => (u.current = !0, () => {
    u.current = !1;
  }), []), { pending: n, failure: i, run: async (x) => {
    if (r.current) return !1;
    r.current = !0, a(!0), o(null);
    try {
      return await Y(x()), u.current && t(), !0;
    } catch (l) {
      if (u.current) {
        const q = Q(l);
        q.status === 409 && (q.message += " Refresh to review the current file, then retry your change."), (q.message.includes("timed out") || !q.status) && (q.message += " The result may be unknown; refresh and check the file before retrying."), o(q);
      }
      return !1;
    } finally {
      r.current = !1, u.current && a(!1);
    }
  } };
}
function ht(t) {
  var ue, pe, he, me, ge, fe;
  const { api: n, workspace: a, active: i } = t, o = a.id, u = xe(), { data: r, failure: g, busy: x, refresh: l, reload: q } = Se(
    i,
    String(o),
    () => _e(n, o),
    (d) => ae(n, { workspaceId: o, manual: d }),
    (d) => d.index.state === "scanning"
  ), b = ie(q), y = (r == null ? void 0 : r.workspace.columns) ?? a.columns, N = we(() => He(y, (r == null ? void 0 : r.tickets) ?? []), [y, r]), p = N.repair.length > 0 ? [...y, ke] : y, T = B(null), C = B(null), [f, z] = m(null), w = B(null);
  D(() => {
    var d;
    f && ((d = w.current) == null || d.focus());
  }, [f]);
  const [k, I] = m(!1), h = !i || !!g || x || b.pending || k || !!_(r == null ? void 0 : r.index), [R, c] = m(""), v = ((ue = y.find((d) => d.id === R)) == null ? void 0 : ue.id) ?? ((pe = r == null ? void 0 : r.index.maintenance) == null ? void 0 : pe[0]) ?? y[0].id, [W, J] = m(!1), [S, K] = m(!1), [re, se] = m(!1), oe = r ? [r.index] : [], Ie = te((d) => {
    c(d), se(!0);
  }, []), [X, le] = m(null);
  D(() => {
    var P;
    if (!X || h || !r) return;
    const d = Array.from(((P = T.current) == null ? void 0 : P.querySelectorAll("[data-note-path]")) ?? []).find((A) => A.dataset.notePath === X);
    d == null || d.focus(), le(null);
  }, [X, h, r]);
  const ce = (d, P, A) => {
    var $;
    h || _(r == null ? void 0 : r.index, d) || !r || ($ = r.index.maintenance) != null && $.includes(P) || b.run(() => Xe(n, o, nt(r.tickets, d, P, A))).then((U) => {
      U && le(d.path);
    });
  }, de = (d, P, A) => {
    d.preventDefault(), d.stopPropagation();
    const $ = C.current;
    if (C.current = null, !$ || (A == null ? void 0 : A.path) === $.path) return;
    const U = N[P].filter((E) => E.path !== $.path), O = A ? U.findIndex((E) => E.path === A.path) : void 0;
    O !== void 0 && O < 0 || ce($, P, O);
  }, Ae = (d) => {
    var ze, qe;
    const P = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"], A = d.target;
    if (!A.hasAttribute("data-lane")) return;
    const $ = Number(A.dataset.lane), U = Number(A.dataset.index);
    if (!P.includes(d.key) || Number.isNaN($) || Number.isNaN(U)) return;
    let O = $, E = U;
    if (d.key === "ArrowUp" && (E = Math.max(0, U - 1)), d.key === "ArrowDown" && (E = U + 1), d.key === "Home" && (E = 0), d.key === "End" && (E = Number.MAX_SAFE_INTEGER), d.key === "ArrowLeft" || d.key === "ArrowRight") {
      const De = d.key === "ArrowLeft" ? -1 : 1;
      do
        O += De;
      while (O >= 0 && O < p.length && N[p[O].id].length === 0);
      if (O < 0 || O >= p.length) return;
    }
    E = Math.min(E, N[p[O].id].length - 1), d.preventDefault(), (qe = (ze = T.current) == null ? void 0 : ze.querySelector(`[data-lane="${O}"][data-index="${E}"]`)) == null || qe.focus();
  };
  return /* @__PURE__ */ s("div", { className: "qz-stack", children: [
    /* @__PURE__ */ s("div", { className: "qz-toolbar", children: [
      /* @__PURE__ */ s("div", { className: "qz-actions", children: [
        /* @__PURE__ */ s(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "primary",
            "aria-expanded": f === "create",
            onClick: () => z(f === "create" ? null : "create"),
            disabled: b.pending || k,
            children: [
              /* @__PURE__ */ e(M, { name: "plus" }),
              "New ticket"
            ]
          }
        ),
        /* @__PURE__ */ s(
          "button",
          {
            type: "button",
            className: "qz-button",
            "aria-expanded": f === "promote",
            onClick: () => z(f === "promote" ? null : "promote"),
            disabled: b.pending || k,
            children: [
              /* @__PURE__ */ e(M, { name: "note" }),
              "Use existing note"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ s("div", { className: "qz-actions", children: [
        /* @__PURE__ */ e("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: t.onSettings, children: "Customize columns" }),
        /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            "aria-expanded": re,
            onClick: () => se((d) => !d),
            disabled: h,
            children: "Rebalance…"
          }
        ),
        /* @__PURE__ */ s("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => u(G), children: [
          /* @__PURE__ */ e(M, { name: "external" }),
          "Open Kiro Notes"
        ] })
      ] })
    ] }),
    ["create", "promote"].map((d) => /* @__PURE__ */ e("div", { hidden: f !== d, children: /* @__PURE__ */ e(mt, { mode: d, api: n, workspace: a, columns: y, firstField: f === d ? w : void 0, disabled: !i || !!g || x || b.pending || !!_(r == null ? void 0 : r.index), maintenance: (r == null ? void 0 : r.index.maintenance) ?? [], onBusy: I, onChanged: q, onClose: () => z(null), onMaintenanceNeeded: Ie }) }, d)),
    /* @__PURE__ */ s("div", { className: "qz-toolbar qz-board-meta", children: [
      r && /* @__PURE__ */ s("span", { className: "qz-result-count", children: [
        r.tickets.length,
        " ",
        r.tickets.length === 1 ? "ticket" : "tickets"
      ] }),
      /* @__PURE__ */ s("div", { className: "qz-actions", children: [
        /* @__PURE__ */ e($e, { statuses: oe }),
        /* @__PURE__ */ s("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => void l(), disabled: x || b.pending, children: [
          /* @__PURE__ */ e(M, { name: "refresh" }),
          "Refresh"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ e(Me, { statuses: oe }),
    /* @__PURE__ */ e(L, { failure: g }),
    /* @__PURE__ */ e(L, { failure: b.failure }),
    _(r == null ? void 0 : r.index) && r && /* @__PURE__ */ e("div", { role: "note", className: "qz-notice", children: _(r.index) }),
    re || ((he = b.failure) == null ? void 0 : he.code) === "rank_exhausted" || ((me = b.failure) == null ? void 0 : me.code) === "maintenance_pending" || (ge = r == null ? void 0 : r.index.maintenance) != null && ge.length ? /* @__PURE__ */ s("div", { className: "qz-notice qz-stack", children: [
      /* @__PURE__ */ e("p", { children: "Rebalance a column to restore space between card positions. Progress is saved if interrupted." }),
      /* @__PURE__ */ s("div", { className: "qz-actions", children: [
        /* @__PURE__ */ e("select", { className: "qz-input", "aria-label": "Column to rebalance", value: v, onChange: (d) => c(d.target.value), children: y.map((d) => /* @__PURE__ */ e("option", { value: d.id, children: d.label }, d.id)) }),
        /* @__PURE__ */ e("button", { type: "button", className: "qz-button", onClick: () => J(!0), disabled: !i || b.pending || !!(r != null && r.index.writeBlocked), children: "Review column…" })
      ] }),
      W && /* @__PURE__ */ s("div", { className: "qz-stack", role: "alertdialog", "aria-label": "Rebalance column", children: [
        /* @__PURE__ */ e("p", { children: "Update ordering in each note of this column? Other editors may see progress before all files finish." }),
        !!((fe = r == null ? void 0 : r.index.maintenance) != null && fe.includes(v)) && /* @__PURE__ */ s("label", { className: "qz-check-label", children: [
          /* @__PURE__ */ e("input", { type: "checkbox", checked: S, onChange: (d) => K(d.target.checked), disabled: b.pending }),
          "Keep the latest note contents and resume ordering after an external edit"
        ] }),
        /* @__PURE__ */ s("div", { className: "qz-actions", children: [
          /* @__PURE__ */ e("button", { type: "button", className: "qz-button", disabled: !i || b.pending || !!(r != null && r.index.writeBlocked), onClick: () => void b.run(() => tt(n, o, v, S)).then((d) => {
            d && (J(!1), K(!1));
          }), children: "Rebalance column" }),
          /* @__PURE__ */ e("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: b.pending, onClick: () => J(!1), children: "Cancel" })
        ] })
      ] })
    ] }) : null,
    !r && !g && /* @__PURE__ */ e("p", { className: "qz-empty", role: "status", children: "Loading the board…" }),
    r && r.tickets.length === 0 && r.index.state !== "scanning" && /* @__PURE__ */ s("p", { className: "qz-notice", "data-variant": "neutral", children: [
      "No tickets in “",
      a.name,
      "” yet. Create a ticket or use an existing note."
    ] }),
    r && /* @__PURE__ */ e("div", { ref: T, className: "qz-board", tabIndex: 0, onKeyDown: Ae, "aria-label": `Board of ${a.name}`, role: "group", children: p.map(({ id: d, label: P }, A) => /* @__PURE__ */ s(
      "section",
      {
        "aria-label": P,
        className: "qz-lane",
        "data-lane-status": d,
        onDragOver: ($) => {
          !h && d !== "repair" && $.preventDefault();
        },
        onDrop: ($) => {
          d !== "repair" && de($, d);
        },
        children: [
          /* @__PURE__ */ s("h3", { className: "qz-lane-heading", children: [
            /* @__PURE__ */ e("span", { className: "qz-dot" }),
            P,
            /* @__PURE__ */ e("span", { className: "qz-count", children: N[d].length })
          ] }),
          N[d].length === 0 && /* @__PURE__ */ e("p", { className: "qz-lane-empty", children: "No tickets" }),
          /* @__PURE__ */ e("ul", { className: "qz-cards", children: N[d].map(($, U) => /* @__PURE__ */ e(
            "li",
            {
              draggable: !h && !_(r.index, $),
              onDragStart: (O) => {
                C.current = $, O.dataTransfer.setData("text/plain", $.path), O.dataTransfer.effectAllowed = "move";
              },
              onDragEnd: () => {
                C.current = null;
              },
              onDragOver: (O) => {
                !h && d !== "repair" && O.preventDefault();
              },
              onDrop: (O) => {
                d !== "repair" && de(O, d, $);
              },
              children: /* @__PURE__ */ e(
                gt,
                {
                  ticket: $,
                  lane: A,
                  index: U,
                  columns: y,
                  onOpen: () => u(G),
                  disabled: h || !!_(r.index, $),
                  maintenance: r.index.maintenance ?? [],
                  onMove: (O, E) => ce($, O, E),
                  onDemote: () => {
                    window.confirm(`Remove “${$.title}” from the board? Its note and TODOs will remain.`) && b.run(() => st(n, o, $));
                  },
                  count: N[d].length
                }
              )
            },
            $.path
          )) })
        ]
      },
      d
    )) })
  ] });
}
function mt(t) {
  const [n, a] = m(""), [i, o] = m(""), [u, r] = m(""), [g, x] = m(""), l = (t.columns.find((S) => S.id === g) ?? t.columns[0]).id, [q, b] = m(null), [y, N] = m(null), [p, T] = m(!1), C = B(0), f = B(!0);
  D(() => (f.current = !0, () => {
    f.current = !1, C.current++;
  }), []);
  const z = ie(t.onChanged);
  D(() => (t.onBusy(z.pending), () => t.onBusy(!1)), [z.pending, t.onBusy]);
  const w = t.disabled || z.pending || p, k = t.maintenance.includes(l);
  D(() => {
    var S, K;
    (((S = z.failure) == null ? void 0 : S.code) === "rank_exhausted" || ((K = z.failure) == null ? void 0 : K.code) === "maintenance_pending") && t.onMaintenanceNeeded(l);
  }, [z.failure, t.onMaintenanceNeeded, l]);
  const I = () => {
    C.current++, T(!1), a(""), o(""), r(""), b(null), N(null), t.onClose();
  }, h = n.trim().endsWith(".md") ? n.trim() : `${n.trim()}.md`, R = async () => {
    const S = ++C.current;
    T(!0), N(null), b(null);
    try {
      const K = await Y(Ye(t.api, t.workspace.id, h));
      f.current && S === C.current && b(K);
    } catch (K) {
      f.current && S === C.current && N(Q(K));
    } finally {
      f.current && S === C.current && T(!1);
    }
  }, c = async () => {
    await z.run(() => t.mode === "create" ? Ge(t.api, t.workspace.id, { path: h, title: i.trim(), body: u, status: l }) : Ze(t.api, t.workspace.id, q, l)) && f.current && (a(""), o(""), r(""), b(null), t.onClose());
  }, v = t.mode === "create", W = v ? "New ticket" : "Use existing note", J = !w && !k && !!n.trim() && (v ? !!i.trim() : !!q);
  return /* @__PURE__ */ s("section", { className: "qz-panel-surface qz-ticket-form", "aria-label": W, children: [
    /* @__PURE__ */ e("h3", { children: W }),
    /* @__PURE__ */ s("form", { className: "qz-stack", onSubmit: (S) => {
      S.preventDefault(), J && c();
    }, children: [
      v && /* @__PURE__ */ s("label", { className: "qz-field", children: [
        "Title",
        /* @__PURE__ */ e("input", { className: "qz-input", ref: t.firstField, "aria-label": "Ticket title", placeholder: "Fix login", value: i, disabled: z.pending, onChange: (S) => o(S.target.value) })
      ] }),
      /* @__PURE__ */ s("label", { className: "qz-field", children: [
        "Note path in ",
        t.workspace.name,
        /* @__PURE__ */ e(
          "input",
          {
            className: "qz-input",
            ref: v ? void 0 : t.firstField,
            "aria-label": "Ticket note path",
            placeholder: "tickets/fix-login.md",
            value: n,
            disabled: z.pending,
            onChange: (S) => {
              C.current++, T(!1), a(S.target.value), b(null);
            }
          }
        )
      ] }),
      v ? /* @__PURE__ */ s("label", { className: "qz-field", children: [
        /* @__PURE__ */ s("span", { children: [
          "Description ",
          /* @__PURE__ */ e("span", { className: "qz-muted", children: "· Optional Markdown" })
        ] }),
        /* @__PURE__ */ e("textarea", { className: "qz-input", "aria-label": "Ticket description", placeholder: "What needs to happen?", value: u, disabled: z.pending, onChange: (S) => r(S.target.value), rows: 4 })
      ] }) : /* @__PURE__ */ s(F, { children: [
        /* @__PURE__ */ e("div", { className: "qz-actions", children: /* @__PURE__ */ e("button", { type: "button", className: "qz-button", disabled: w || !n.trim(), onClick: () => void R(), children: "Preview note" }) }),
        q && /* @__PURE__ */ s(F, { children: [
          /* @__PURE__ */ e("pre", { className: "qz-mono qz-note-preview", children: q.content }),
          /* @__PURE__ */ e("p", { className: "qz-muted", children: "The note’s content and existing properties are preserved." })
        ] })
      ] }),
      (v || q) && /* @__PURE__ */ s("label", { className: "qz-field", children: [
        "Initial status",
        /* @__PURE__ */ e("select", { className: "qz-input", value: l, disabled: z.pending, onChange: (S) => x(S.target.value), children: t.columns.map((S) => /* @__PURE__ */ e("option", { value: S.id, children: S.label }, S.id)) })
      ] }),
      k && /* @__PURE__ */ e("span", { className: "qz-notice", children: "Resume ordering maintenance for this column before adding a ticket." }),
      /* @__PURE__ */ e(L, { failure: y }),
      /* @__PURE__ */ e(L, { failure: z.failure }),
      /* @__PURE__ */ s("div", { className: "qz-actions", children: [
        /* @__PURE__ */ e("button", { type: "submit", className: "qz-button", "data-variant": "primary", disabled: !J, children: v ? "Create ticket" : "Make ticket" }),
        /* @__PURE__ */ e("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: z.pending, onClick: I, children: "Cancel" })
      ] })
    ] })
  ] });
}
function gt(t) {
  const { ticket: n } = t, a = n.lane === "repair" ? "" : n.lane;
  return /* @__PURE__ */ s("article", { className: "qz-ticket", children: [
    /* @__PURE__ */ s("div", { className: "qz-ticket-content", children: [
      /* @__PURE__ */ s("button", { type: "button", className: "qz-note-link", "data-lane": t.lane, "data-index": t.index, "data-note-path": n.path, "aria-label": `Open Kiro Notes: ${n.title}`, onClick: t.onOpen, children: [
        n.title,
        /* @__PURE__ */ e(M, { name: "external" })
      ] }),
      /* @__PURE__ */ e("span", { className: "qz-mono qz-path", title: n.path, children: n.path }),
      n.todos.total > 0 && /* @__PURE__ */ s("div", { className: "qz-ticket-progress", children: [
        /* @__PURE__ */ e("progress", { value: n.todos.done, max: n.todos.total, "aria-label": `Checklist progress for ${n.title}` }),
        /* @__PURE__ */ s("span", { title: "Completed TODOs", children: [
          n.todos.done,
          "/",
          n.todos.total
        ] })
      ] }),
      n.diagnostics.length > 0 && /* @__PURE__ */ e("div", { className: "qz-actions", children: n.diagnostics.map((i) => /* @__PURE__ */ e("span", { className: "qz-badge", title: i.message, children: i.code.replace(/_/g, " ") }, i.code)) })
    ] }),
    /* @__PURE__ */ s("div", { className: "qz-ticket-footer", children: [
      /* @__PURE__ */ e("div", { className: "qz-ticket-status", children: /* @__PURE__ */ s(
        "select",
        {
          className: "qz-input",
          "aria-label": `Move ${n.title} to column`,
          title: "Move to column",
          value: a,
          disabled: t.disabled,
          onChange: (i) => t.onMove(i.target.value),
          children: [
            !a && /* @__PURE__ */ e("option", { value: "", disabled: !0, children: n.status ? `No column for ${n.status}` : "Needs repair" }),
            t.columns.map((i) => /* @__PURE__ */ e("option", { value: i.id, disabled: t.maintenance.includes(i.id), children: i.label }, i.id))
          ]
        }
      ) }),
      /* @__PURE__ */ s("details", { className: "qz-ticket-actions", children: [
        /* @__PURE__ */ e("summary", { className: "qz-button qz-icon-button", "data-variant": "quiet", "aria-label": `Actions for ${n.title}`, title: "Ticket actions", children: /* @__PURE__ */ e(M, { name: "more" }) }),
        /* @__PURE__ */ s("div", { className: "qz-ticket-action-list", children: [
          /* @__PURE__ */ e(Oe, { path: n.path }),
          /* @__PURE__ */ s("button", { type: "button", className: "qz-button", "data-variant": "quiet", "aria-label": `Move ${n.title} up`, disabled: t.disabled || t.index === 0 || !a, onClick: () => t.onMove(a, t.index - 1), children: [
            /* @__PURE__ */ e(M, { name: "up" }),
            "Move up"
          ] }),
          /* @__PURE__ */ s("button", { type: "button", className: "qz-button", "data-variant": "quiet", "aria-label": `Move ${n.title} down`, disabled: t.disabled || t.index >= t.count - 1 || !a, onClick: () => t.onMove(a, t.index + 1), children: [
            /* @__PURE__ */ e(M, { name: "down" }),
            "Move down"
          ] }),
          /* @__PURE__ */ s("button", { type: "button", className: "qz-button qz-destructive", "data-variant": "quiet", "aria-label": `Remove ${n.title} from board`, disabled: t.disabled, onClick: t.onDemote, children: [
            /* @__PURE__ */ e(M, { name: "minus" }),
            "Remove ticket…"
          ] })
        ] })
      ] })
    ] })
  ] });
}
function ft(t) {
  const { api: n } = t, a = xe(), { companions: i, failure: o } = Te(n), [u, r] = m("all"), [g, x] = m("open"), [l, q] = m(""), b = B(null);
  D(() => {
    i && u !== "all" && !i.some((c) => c.workspace.id === u) && r("all");
  }, [i, u]);
  const y = u === "all" ? void 0 : u, N = !!i && i.length > 0, { data: p, failure: T, busy: C, refresh: f, reload: z } = Se(
    N,
    `${u}:${g}`,
    () => We(n, g, y),
    (c) => ae(n, { workspaceId: y, manual: c }),
    (c) => Object.values(c.index).some((v) => v.state === "scanning")
  ), w = we(() => Je((p == null ? void 0 : p.groups) ?? [], l), [p, l]), k = w.reduce((c, v) => c + v.items.length, 0), I = p ? Object.values(p.index) : [], h = ie(z), R = (c, v, W) => {
    h.pending || T || C || _(p == null ? void 0 : p.index[String(c.workspaceId)], c) || v.markerStart === void 0 || h.run(() => et(n, c, v, W));
  };
  return o ? /* @__PURE__ */ e(L, { failure: o }) : i ? i.length === 0 ? /* @__PURE__ */ e(Re, { onSettings: t.onSettings }) : /* @__PURE__ */ s("div", { className: "qz-stack qz-todos", children: [
    /* @__PURE__ */ s("div", { className: "qz-view-heading", children: [
      /* @__PURE__ */ s("div", { children: [
        /* @__PURE__ */ e("h2", { className: "qz-section-title", children: "Note checklists" }),
        /* @__PURE__ */ e("p", { className: "qz-section-description", children: "Find and complete Markdown TODOs across your shared folders." })
      ] }),
      /* @__PURE__ */ s("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => a(G), children: [
        /* @__PURE__ */ e(M, { name: "external" }),
        "Open Kiro Notes"
      ] })
    ] }),
    /* @__PURE__ */ s("div", { className: "qz-todo-filters qz-panel-surface", children: [
      /* @__PURE__ */ s("label", { className: "qz-field", children: [
        "Search",
        /* @__PURE__ */ s("span", { className: "qz-search", children: [
          /* @__PURE__ */ e(M, { name: "search" }),
          /* @__PURE__ */ e("input", { className: "qz-input", ref: b, type: "search", "aria-label": "Filter TODOs", placeholder: "Search tasks or notes…", value: l, onChange: (c) => q(c.target.value) })
        ] })
      ] }),
      i.length > 1 && /* @__PURE__ */ s("label", { className: "qz-field", children: [
        "Workspace",
        /* @__PURE__ */ s("select", { className: "qz-input", value: u, onChange: (c) => r(c.target.value === "all" ? "all" : Number(c.target.value)), children: [
          /* @__PURE__ */ e("option", { value: "all", children: "All workspaces" }),
          i.map((c) => /* @__PURE__ */ e("option", { value: c.workspace.id, children: c.workspace.name }, c.workspace.id))
        ] })
      ] }),
      /* @__PURE__ */ s("label", { className: "qz-field", children: [
        "Show",
        /* @__PURE__ */ s("select", { className: "qz-input", value: g, onChange: (c) => x(c.target.value), children: [
          /* @__PURE__ */ e("option", { value: "open", children: "Open" }),
          /* @__PURE__ */ e("option", { value: "done", children: "Completed" }),
          /* @__PURE__ */ e("option", { value: "all", children: "All" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ s("div", { className: "qz-toolbar qz-board-meta", children: [
      p && /* @__PURE__ */ s("span", { className: "qz-result-count", role: "status", children: [
        k,
        " ",
        k === 1 ? "item" : "items",
        " in ",
        w.length,
        " ",
        w.length === 1 ? "note" : "notes"
      ] }),
      /* @__PURE__ */ s("div", { className: "qz-actions", children: [
        /* @__PURE__ */ e($e, { statuses: I }),
        /* @__PURE__ */ s("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => void f(), disabled: C || h.pending, children: [
          /* @__PURE__ */ e(M, { name: "refresh" }),
          "Refresh"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ e(Me, { statuses: I }),
    /* @__PURE__ */ e(L, { failure: T }),
    /* @__PURE__ */ e(L, { failure: h.failure }),
    (p == null ? void 0 : p.truncated) && /* @__PURE__ */ e("div", { role: "note", className: "qz-notice", children: "Only the first items are listed. Narrow the list by workspace or completion status." }),
    !p && !T && /* @__PURE__ */ e("p", { className: "qz-empty", role: "status", children: "Loading TODOs…" }),
    p && w.length === 0 && /* @__PURE__ */ s("div", { className: "qz-empty", children: [
      /* @__PURE__ */ e("span", { className: "qz-empty-icon", children: /* @__PURE__ */ e(M, { name: l.trim() ? "search" : "checklist" }) }),
      /* @__PURE__ */ e("h3", { children: l.trim() ? "No matching TODOs" : "No TODOs to show" }),
      /* @__PURE__ */ e("p", { children: l.trim() ? "Try a different search or clear the filter." : "Choose a different workspace or completion status to see more." }),
      l.trim() && /* @__PURE__ */ e("button", { type: "button", className: "qz-button", onClick: () => {
        var c;
        q(""), (c = b.current) == null || c.focus();
      }, children: "Clear search" })
    ] }),
    /* @__PURE__ */ e("div", { className: "qz-stack", children: w.map((c) => /* @__PURE__ */ s("section", { "aria-label": c.title, className: "qz-todo-note qz-panel-surface", children: [
      /* @__PURE__ */ s("header", { className: "qz-todo-header", children: [
        /* @__PURE__ */ e("span", { className: "qz-note-icon", children: /* @__PURE__ */ e(M, { name: "note" }) }),
        /* @__PURE__ */ s("div", { className: "qz-todo-identity", children: [
          /* @__PURE__ */ s("h3", { children: [
            c.title,
            c.ticket && c.status && /* @__PURE__ */ s("span", { className: "qz-status-pill", "data-lane-status": c.status, children: [
              /* @__PURE__ */ e("span", { className: "qz-dot" }),
              c.statusLabel ?? c.status
            ] })
          ] }),
          /* @__PURE__ */ s("p", { className: "qz-todo-meta", children: [
            /* @__PURE__ */ e("span", { children: c.workspace }),
            /* @__PURE__ */ e("span", { "aria-hidden": "true", children: "/" }),
            /* @__PURE__ */ e("span", { className: "qz-mono qz-path", title: c.path, children: c.path })
          ] })
        ] }),
        /* @__PURE__ */ e(Oe, { path: c.path, compact: !0 })
      ] }),
      /* @__PURE__ */ e("ul", { className: "qz-todo-list", children: c.items.map((v) => /* @__PURE__ */ s("li", { className: "qz-todo-row", "data-checked": v.checked, style: { paddingInlineStart: `${Math.min(v.depth, 4) * 0.8}rem` }, children: [
        /* @__PURE__ */ s("label", { className: "qz-todo-check", children: [
          /* @__PURE__ */ e(
            "input",
            {
              type: "checkbox",
              "aria-label": `Complete ${ee(v.text)}`,
              checked: v.checked,
              disabled: h.pending || !!T || C || !!_(p == null ? void 0 : p.index[String(c.workspaceId)], c) || v.markerStart === void 0,
              onChange: (W) => R(c, v, W.target.checked)
            }
          ),
          /* @__PURE__ */ e("span", { children: ee(v.text) })
        ] }),
        /* @__PURE__ */ e(
          "button",
          {
            type: "button",
            title: `Open Kiro Notes · ${c.path}:${v.line}:${v.column}${v.heading ? ` · ${v.heading}` : ""}`,
            "aria-label": `Open Kiro Notes: ${ee(v.text)}`,
            onClick: () => a(G),
            className: "qz-button qz-icon-button",
            "data-variant": "quiet",
            children: /* @__PURE__ */ e(M, { name: "external" })
          }
        )
      ] }, v.ordinal)) })
    ] }, `${c.workspaceId}:${c.path}`)) })
  ] }) : /* @__PURE__ */ e("p", { className: "qz-empty", role: "status", children: "Loading workspaces…" });
}
function zt(t, n) {
  const a = n[0].id, i = n.map((o) => `- ${o.id} (${JSON.stringify(o.label)})`).join(`
`);
  return `Work with Quartizo and Kiro Notes by editing Markdown files in the connected folder ${JSON.stringify(t)}.

- Keep note operations within this exact folder. If you delegate, pass the absolute path to the worker and have it verify that its changes land in that folder.
- Find and read the current note before updating it. Use a new, unused .md path inside the folder for new notes. Use UTF-8 with LF line endings for new files. Preserve existing line endings, unrelated text, and YAML properties when editing. Re-read before saving if the file may have changed, and stop if the edit conflicts with another writer.
- A regular note can start with a # Title heading and needs no ticket metadata. Create a ticket only when asked for a board card. Put its YAML frontmatter at the very start of the file. Generate a fresh UUID for each new ticket and preserve existing ticket IDs.

Use these ticket status IDs, listed in board order.
${i}

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
const qt = '.qz-settings{display:grid;align-content:start;gap:20px;width:100%;max-width:1100px;min-width:0;margin-inline:auto;container:qz-settings / inline-size}.qz-settings .qz-settings-grid{display:grid;align-items:start;gap:20px}@container qz-settings (min-width: 760px){.qz-settings .qz-settings-grid{grid-template-columns:minmax(0,1fr) minmax(260px,330px)}}.qz-settings .qz-settings-folders,.qz-settings .qz-settings-add,.qz-settings .qz-settings-folder,.qz-settings .qz-settings-migration,.qz-settings .qz-settings-notice{display:grid;min-width:0;gap:12px}.qz-settings .qz-settings-add,.qz-settings .qz-settings-folder{padding:16px}.qz-settings .qz-settings-add p{margin-block-start:4px}.qz-settings .qz-settings-add .qz-input{width:100%}.qz-settings .qz-settings-add>.qz-button{justify-self:start}.qz-settings .qz-settings-heading,.qz-settings .qz-settings-folder-identity,.qz-settings .qz-settings-folder-controls,.qz-settings .qz-settings-actions,.qz-settings .qz-settings-check{display:flex;align-items:center}.qz-settings .qz-settings-heading,.qz-settings .qz-settings-folder-identity,.qz-settings .qz-settings-check{gap:10px}.qz-settings .qz-settings-heading h3,.qz-settings .qz-settings-add h3,.qz-settings .qz-settings-folder h4{margin:0;color:var(--qz-text);font-size:15px;font-weight:650}.qz-settings .qz-settings-count{padding:1px 7px;border:1px solid var(--qz-border);border-radius:999px;color:var(--qz-muted);font-size:12px;font-variant-numeric:tabular-nums}.qz-settings .qz-settings-folder-icon{display:grid;flex:none;width:36px;height:36px;place-items:center;border-radius:9px;background:var(--qz-accent-soft);color:var(--qz-accent)}.qz-settings .qz-settings-folder-identity>div{display:grid;min-width:0;gap:3px;overflow-wrap:anywhere}.qz-settings .qz-settings-folder-controls{justify-content:space-between;flex-wrap:wrap;gap:8px 12px;padding-block-start:10px;border-top:1px solid var(--qz-border)}.qz-settings .qz-settings-actions{flex-wrap:wrap;gap:4px}.qz-settings .qz-settings-check{min-height:32px;font-size:13px;cursor:pointer}.qz-settings .qz-settings-check input{flex:none;accent-color:var(--qz-accent)}.qz-settings .qz-settings-toggle{display:inline-grid;align-items:center;justify-items:start;-webkit-appearance:none;-moz-appearance:none;appearance:none;width:34px;height:20px;padding:2px;margin:0;border:1px solid var(--qz-muted);border-radius:999px;background:var(--qz-elevated);cursor:inherit}.qz-settings .qz-settings-toggle:before{width:12px;height:12px;border-radius:50%;background:var(--qz-muted);content:""}.qz-settings .qz-settings-toggle:checked{justify-items:end;border-color:var(--qz-accent);background:var(--qz-accent-soft)}.qz-settings .qz-settings-toggle:checked:before{background:var(--qz-accent)}.qz-settings .qz-settings-toggle:disabled{opacity:.6;cursor:default}@media (forced-colors: active){.qz-settings .qz-settings-toggle{display:inline-block;-webkit-appearance:auto;-moz-appearance:auto;appearance:auto;width:16px;height:16px}}.qz-settings .qz-settings-migration,.qz-settings .qz-settings-result{padding:12px;border:1px solid var(--qz-border);border-radius:9px;background:var(--qz-canvas);font-size:13px}.qz-settings .qz-settings-migration{gap:6px}.qz-settings .qz-settings-notice{gap:8px;overflow-wrap:anywhere}.qz-settings .qz-settings-migration-files{max-height:200px;margin:0;padding-inline-start:20px;overflow-y:auto;list-style:disc}.qz-settings .qz-button[data-destructive]{color:var(--qz-danger)}.qz-settings-disclosure{border-top:1px solid var(--qz-border);font-size:13px}.qz-settings-disclosure>summary{padding-block:8px;font-weight:650;cursor:pointer}.qz-column-list{display:grid;gap:8px;padding:0;list-style:none}.qz-column-row{display:flex;flex-wrap:wrap;align-items:end;gap:6px 10px}.qz-column-row .qz-field{flex:1 1 140px}.qz-column-row .qz-field>span{overflow-wrap:anywhere}.qz-column-row .qz-input,.qz-agent-prompt{width:100%}';
function Z() {
  const [t, n] = m(!1), [a, i] = m(null);
  return { busy: t, failure: a, run: async (u) => {
    n(!0), i(null);
    try {
      return await u(), !0;
    } catch (r) {
      return i(Q(r)), !1;
    } finally {
      n(!1);
    }
  } };
}
function bt(t) {
  const { api: n } = t, [a, i] = m(null), [o, u] = m(null), [r, g] = m(null), [x, l] = m(0), [q, b] = m(""), [y, N] = m(""), { busy: p, failure: T, run: C } = Z();
  D(() => {
    let z = !1;
    return Promise.all([Ee(n), Ne(n)]).then(([w, k]) => {
      z || (i(w), g(k.writeBlocked ?? null), u(null));
    }).catch((w) => !z && u(Q(w))), () => {
      z = !0;
    };
  }, [n, x]);
  const f = async () => {
    await C(() => Fe(n, q.trim(), y.trim() || void 0)) && (b(""), N(""), l((z) => z + 1));
  };
  return /* @__PURE__ */ s("div", { className: "qz-settings", children: [
    /* @__PURE__ */ e("style", { children: qt }),
    /* @__PURE__ */ s("header", { children: [
      /* @__PURE__ */ e("h2", { className: "qz-section-title", children: "Settings" }),
      /* @__PURE__ */ e("p", { className: "qz-section-description", children: "Manage connected folders and board columns, or start a notes request in KiroCrew." })
    ] }),
    /* @__PURE__ */ e(L, { failure: o }),
    /* @__PURE__ */ e(L, { failure: r }),
    /* @__PURE__ */ s("div", { className: "qz-settings-grid", children: [
      /* @__PURE__ */ s("section", { className: "qz-settings-folders", "aria-labelledby": "qz-settings-folders", children: [
        /* @__PURE__ */ s("div", { className: "qz-settings-heading", children: [
          /* @__PURE__ */ e("h3", { id: "qz-settings-folders", children: "Connected folders" }),
          a && /* @__PURE__ */ e("span", { className: "qz-settings-count", children: a.length })
        ] }),
        !a && !o && /* @__PURE__ */ e("p", { className: "qz-muted", role: "status", children: "Loading folders…" }),
        (a == null ? void 0 : a.length) === 0 && /* @__PURE__ */ e("p", { className: "qz-empty", children: "Add a folder to start viewing its tickets and TODOs." }),
        a == null ? void 0 : a.map((z) => /* @__PURE__ */ e(
          vt,
          {
            api: n,
            workspace: z,
            writeBlocked: r,
            onChanged: () => l((w) => w + 1),
            onColumnsSaved: (w) => i((k) => (k == null ? void 0 : k.map((I) => I.id === w.id ? { ...I, ...w } : I)) ?? null)
          },
          z.id
        ))
      ] }),
      /* @__PURE__ */ s(
        "form",
        {
          className: "qz-panel-surface qz-settings-add",
          "aria-labelledby": "qz-settings-add",
          "aria-busy": p,
          onSubmit: (z) => {
            z.preventDefault(), q.trim() && !p && f();
          },
          children: [
            /* @__PURE__ */ s("div", { children: [
              /* @__PURE__ */ e("h3", { id: "qz-settings-add", children: "Add a folder" }),
              /* @__PURE__ */ e("p", { className: "qz-muted", children: "Use the same folder path you added in Kiro Notes." })
            ] }),
            /* @__PURE__ */ s("label", { className: "qz-field", children: [
              "Absolute folder path",
              /* @__PURE__ */ e("input", { className: "qz-input", placeholder: "/home/you/notes", value: q, onChange: (z) => b(z.target.value) })
            ] }),
            /* @__PURE__ */ s("label", { className: "qz-field", children: [
              /* @__PURE__ */ s("span", { children: [
                "Name ",
                /* @__PURE__ */ e("span", { className: "qz-muted", children: "(optional)" })
              ] }),
              /* @__PURE__ */ e("input", { className: "qz-input", placeholder: "e.g. Project notes", value: y, onChange: (z) => N(z.target.value) })
            ] }),
            /* @__PURE__ */ e("button", { className: "qz-button", "data-variant": "primary", type: "submit", disabled: p || !q.trim(), children: "Add folder" }),
            /* @__PURE__ */ e(L, { failure: T })
          ]
        }
      )
    ] })
  ] });
}
function vt(t) {
  const { api: n, workspace: a } = t, { busy: i, failure: o, run: u } = Z(), [r, g] = m(null), [x, l] = m(!1);
  return D(() => {
    if (!r) return;
    const q = setTimeout(() => g(null), 3e3);
    return () => clearTimeout(q);
  }, [r]), /* @__PURE__ */ s("section", { "aria-label": a.name, className: "qz-panel-surface qz-settings-folder", children: [
    /* @__PURE__ */ s("div", { className: "qz-settings-folder-identity", children: [
      /* @__PURE__ */ e("span", { className: "qz-settings-folder-icon", children: /* @__PURE__ */ e(M, { name: "folder" }) }),
      /* @__PURE__ */ s("div", { children: [
        /* @__PURE__ */ e("h4", { children: a.name }),
        /* @__PURE__ */ e("code", { className: "qz-mono qz-muted", children: a.path })
      ] })
    ] }),
    /* @__PURE__ */ s("div", { className: "qz-settings-folder-controls", children: [
      /* @__PURE__ */ s("label", { className: "qz-settings-check", children: [
        /* @__PURE__ */ e(
          "input",
          {
            className: "qz-settings-toggle",
            type: "checkbox",
            checked: !!a.companion,
            disabled: i,
            onChange: () => void u(() => Ke(n, a.id, !a.companion)).then((q) => q && t.onChanged())
          }
        ),
        "Shared with Kiro Notes"
      ] }),
      /* @__PURE__ */ s("div", { className: "qz-settings-actions", children: [
        a.companion && /* @__PURE__ */ e(
          "button",
          {
            className: "qz-button",
            "data-variant": "quiet",
            type: "button",
            onClick: () => void u(() => ae(n, { workspaceId: a.id, manual: !0, rebuild: !0 })).then(
              (q) => q && g("Rebuild requested.")
            ),
            disabled: i,
            children: "Rebuild index"
          }
        ),
        !x && /* @__PURE__ */ e("button", { className: "qz-button", "data-variant": "quiet", type: "button", onClick: () => l(!0), disabled: i, children: "Remove…" })
      ] })
    ] }),
    a.companion && /* @__PURE__ */ e(xt, { api: n, workspace: a, onSaved: t.onColumnsSaved }),
    !!a.oldTasks && /* @__PURE__ */ e(kt, { api: n, workspace: a, writeBlocked: t.writeBlocked, onChanged: t.onChanged }),
    x && /* @__PURE__ */ s("div", { role: "alertdialog", "aria-label": "Remove folder", className: "qz-notice qz-settings-notice", children: [
      /* @__PURE__ */ s("p", { children: [
        "Stop showing “",
        a.name,
        "” in Quartizo? Your folder and files stay on disk.",
        !!a.oldTasks && ` Removing this folder also deletes its ${a.oldTasks} saved task(s) from the old Quartizo board.`
      ] }),
      /* @__PURE__ */ s("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ e(
          "button",
          {
            className: "qz-button",
            "data-destructive": !0,
            type: "button",
            onClick: () => void u(() => Ue(n, a.id, !!a.oldTasks)).then((q) => q && t.onChanged()),
            disabled: i,
            children: a.oldTasks ? `Remove and delete ${a.oldTasks} task(s)` : "Remove"
          }
        ),
        /* @__PURE__ */ e("button", { className: "qz-button", "data-variant": "quiet", type: "button", onClick: () => l(!1), disabled: i, children: "Cancel" })
      ] })
    ] }),
    r && /* @__PURE__ */ e("span", { className: "qz-muted", role: "status", children: r }),
    /* @__PURE__ */ e(L, { failure: o })
  ] });
}
function xt({ api: t, workspace: n, onSaved: a }) {
  const [i, o] = m(null), [u, r] = m(""), [g, x] = m(null), [l, q] = m(""), { busy: b, failure: y, run: N } = Z(), p = (i == null ? void 0 : i.columns) ?? n.columns, T = g ?? u.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 32), C = p.length < 20 && !!u.trim() && /^[a-z][a-z0-9_]{0,31}$/.test(T) && T !== "repair" && !p.some((h) => h.id === T), f = n.columns.some((h) => !p.some((R) => R.id === h.id)), z = (h) => {
    o({ columns: h, version: (i == null ? void 0 : i.version) ?? n.columnsVersion }), q("");
  }, w = (h, R) => {
    const c = [...p], [v] = c.splice(h, 1);
    c.splice(h + R, 0, v), z(c);
  }, k = () => N(async () => {
    if (!i) return;
    const h = await je(t, n.id, p, i.version);
    a(h), o(null), q("Board columns saved.");
  }), I = JSON.stringify(p) !== JSON.stringify(n.columns);
  return /* @__PURE__ */ s(F, { children: [
    /* @__PURE__ */ s("details", { className: "qz-settings-disclosure", children: [
      /* @__PURE__ */ e("summary", { children: "Board columns" }),
      /* @__PURE__ */ s("div", { className: "qz-stack", children: [
        /* @__PURE__ */ e("p", { className: "qz-muted", children: "Rename, reorder, add, or remove columns for this folder. The first column is the default for new tickets." }),
        /* @__PURE__ */ e("ul", { className: "qz-column-list", children: p.map((h, R) => /* @__PURE__ */ s("li", { className: "qz-column-row", children: [
          /* @__PURE__ */ s("label", { className: "qz-field", children: [
            /* @__PURE__ */ e("span", { className: "qz-mono", children: h.id }),
            /* @__PURE__ */ e(
              "input",
              {
                className: "qz-input",
                "aria-label": `Name for ${h.id}`,
                value: h.label,
                maxLength: 40,
                disabled: b,
                onChange: (c) => z(p.map((v) => v.id === h.id ? { ...v, label: c.target.value } : v))
              }
            )
          ] }),
          /* @__PURE__ */ s("div", { className: "qz-settings-actions", children: [
            /* @__PURE__ */ e("button", { className: "qz-button", type: "button", "aria-label": `Move column ${h.id} up`, disabled: b || R === 0, onClick: () => w(R, -1), children: /* @__PURE__ */ e(M, { name: "up" }) }),
            /* @__PURE__ */ e("button", { className: "qz-button", type: "button", "aria-label": `Move column ${h.id} down`, disabled: b || R === p.length - 1, onClick: () => w(R, 1), children: /* @__PURE__ */ e(M, { name: "down" }) }),
            /* @__PURE__ */ e("button", { className: "qz-button", type: "button", "aria-label": `Remove column ${h.id}`, disabled: b || p.length === 1, onClick: () => z(p.filter((c) => c.id !== h.id)), children: "Remove" })
          ] })
        ] }, h.id)) }),
        p.length < 20 && /* @__PURE__ */ s("form", { className: "qz-column-row", onSubmit: (h) => {
          h.preventDefault(), !(b || !C) && (z([...p, { id: T, label: u.trim() }]), r(""), x(null));
        }, children: [
          /* @__PURE__ */ s("label", { className: "qz-field", children: [
            "New column name",
            /* @__PURE__ */ e("input", { className: "qz-input", value: u, maxLength: 40, disabled: b, onChange: (h) => r(h.target.value) })
          ] }),
          /* @__PURE__ */ s("label", { className: "qz-field", children: [
            "New status ID",
            /* @__PURE__ */ e("input", { className: "qz-input qz-mono", value: T, maxLength: 32, disabled: b, onChange: (h) => x(h.target.value) })
          ] }),
          /* @__PURE__ */ e("button", { className: "qz-button", type: "submit", disabled: b || !C, children: "Add column" })
        ] }),
        /* @__PURE__ */ e("p", { className: "qz-muted", children: "Status IDs are saved in notes. Use a unique ID starting with a lowercase letter, followed by lowercase letters, digits, or underscores." }),
        f && /* @__PURE__ */ e("p", { className: "qz-notice", children: "Tickets in removed columns will appear in Needs repair until you move them or restore the column with the same status ID." }),
        /* @__PURE__ */ s("div", { className: "qz-settings-actions", children: [
          /* @__PURE__ */ e("button", { className: "qz-button", "data-variant": "primary", type: "button", disabled: b || !I || p.some((h) => !h.label.trim()), onClick: () => void k(), children: "Save columns" }),
          I && /* @__PURE__ */ e("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: b, onClick: () => {
            o(null), q("");
          }, children: "Discard changes" }),
          /* @__PURE__ */ e("span", { className: "qz-muted", role: "status", children: l })
        ] }),
        /* @__PURE__ */ e(L, { failure: y })
      ] })
    ] }),
    /* @__PURE__ */ e(wt, { workspace: n })
  ] });
}
function wt({ workspace: t }) {
  const { openChat: n } = Le(), a = zt(t.path, t.columns), i = B(null), [o, u] = m(""), r = async () => {
    var g, x;
    try {
      await navigator.clipboard.writeText(a), u("Agent prompt copied.");
    } catch {
      (g = i.current) == null || g.focus(), (x = i.current) == null || x.select(), u("Copy the selected text to use the prompt.");
    }
  };
  return /* @__PURE__ */ s("details", { className: "qz-settings-disclosure", children: [
    /* @__PURE__ */ e("summary", { children: "Work with a Bot or agent" }),
    /* @__PURE__ */ s("div", { className: "qz-stack", children: [
      /* @__PURE__ */ e("p", { className: "qz-muted", children: "Open a draft in KiroCrew, pick a Bot or agent in the chat composer, then add your request and send it. The selected agent needs access to this folder." }),
      /* @__PURE__ */ e("div", { className: "qz-settings-actions", children: /* @__PURE__ */ s("button", { type: "button", className: "qz-button", "data-variant": "primary", onClick: () => n({ message: a, autoSend: !1 }), children: [
        /* @__PURE__ */ e(M, { name: "external" }),
        "Open in KiroCrew chat"
      ] }) }),
      /* @__PURE__ */ e("textarea", { ref: i, className: "qz-input qz-mono qz-agent-prompt", "aria-label": "Agent prompt", value: a, rows: 8, readOnly: !0 }),
      /* @__PURE__ */ s("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ s("button", { type: "button", className: "qz-button", onClick: () => void r(), children: [
          /* @__PURE__ */ e(M, { name: "copy" }),
          "Copy agent prompt"
        ] }),
        /* @__PURE__ */ e("span", { className: "qz-muted", role: "status", children: o })
      ] })
    ] })
  ] });
}
function kt({ api: t, workspace: n, writeBlocked: a, onChanged: i }) {
  const [o, u] = m(null), [r, g] = m(null), [x, l] = m(!1), [q, b] = m(!1), { busy: y, failure: N, run: p } = Z(), T = async () => {
    const f = await rt(t, n.id), z = URL.createObjectURL(new Blob([JSON.stringify(f, null, 2)], { type: "application/json" })), w = document.createElement("a");
    w.href = z, w.download = `quartizo-old-tasks-${n.id}.json`, w.click(), setTimeout(() => URL.revokeObjectURL(z), 1e3), l(!0);
  }, C = async () => {
    if (!o) return;
    const f = await it(t, n.id, o.planHash, q);
    g(f), u(null), i();
  };
  return /* @__PURE__ */ s("section", { className: "qz-settings-migration", "aria-label": `Old tasks in ${n.name}`, children: [
    /* @__PURE__ */ e("strong", { children: "Old task migration" }),
    /* @__PURE__ */ s("p", { className: "qz-muted", children: [
      "Convert ",
      n.oldTasks,
      " saved ",
      n.oldTasks === 1 ? "task" : "tasks",
      " from the old board into Markdown ticket notes."
    ] }),
    /* @__PURE__ */ s("div", { className: "qz-settings-actions", children: [
      /* @__PURE__ */ e("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: y, onClick: () => void p(T), children: "Export old tasks" }),
      /* @__PURE__ */ e("button", { className: "qz-button", type: "button", disabled: y || !n.companion, onClick: () => void p(async () => {
        u(await at(t, n.id)), g(null), b(!1);
      }), children: "Preview migration" })
    ] }),
    x && /* @__PURE__ */ e("span", { className: "qz-muted", role: "status", children: "Export downloaded." }),
    o && /* @__PURE__ */ s("div", { role: "alertdialog", "aria-label": "Confirm old task migration", className: "qz-notice qz-settings-notice", children: [
      /* @__PURE__ */ s("strong", { children: [
        "Create ",
        o.tasks.filter((f) => !f.migrated).length,
        " ticket note(s)"
      ] }),
      /* @__PURE__ */ e("p", { children: "Quartizo backs up the database tasks before writing each ticket to a new file." }),
      o.warnings.map((f, z) => /* @__PURE__ */ e("p", { children: f }, z)),
      /* @__PURE__ */ e("ul", { className: "qz-settings-migration-files", children: o.tasks.map((f) => /* @__PURE__ */ s("li", { children: [
        f.title,
        " → ",
        /* @__PURE__ */ e("code", { children: f.path }),
        " (",
        f.status,
        ")",
        f.migrated && " · already migrated",
        f.noteRef && /* @__PURE__ */ s("span", { children: [
          " · linked note: ",
          f.noteRef
        ] }),
        f.slotId && /* @__PURE__ */ s("span", { children: [
          " · session: ",
          f.slotId
        ] })
      ] }, f.uid)) }),
      o.tasks.some((f) => f.changed) && !o.complete && /* @__PURE__ */ s("label", { className: "qz-settings-check", children: [
        /* @__PURE__ */ e("input", { type: "checkbox", checked: q, onChange: (f) => b(f.target.checked), disabled: y }),
        "I reviewed the changed converted notes; keep their latest contents when resuming"
      ] }),
      /* @__PURE__ */ s("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ e("button", { className: "qz-button", "data-variant": "primary", type: "button", disabled: y || !!a || o.complete || !o.tasks.length, onClick: () => void p(C), children: o.backup ? "Resume and verify migration" : "Back up and migrate" }),
        /* @__PURE__ */ e("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: y, onClick: () => u(null), children: "Cancel" })
      ] })
    ] }),
    r && /* @__PURE__ */ s("div", { className: "qz-settings-notice qz-settings-result", role: "status", children: [
      /* @__PURE__ */ s("p", { children: [
        r.migrated.length,
        " ticket note(s) migrated. ",
        r.complete ? "Migration verified." : `${r.remaining} task(s) remain; preview again to continue.`
      ] }),
      /* @__PURE__ */ s("code", { className: "qz-mono qz-muted", children: [
        "Backup: ",
        r.backup.directory
      ] })
    ] }),
    /* @__PURE__ */ e(L, { failure: N })
  ] });
}
const yt = ".qz-app{--qz-canvas: var(--bg, Canvas);--qz-surface: var(--card, Canvas);--qz-elevated: var(--bg-elevated, Canvas);--qz-border: var(--border, color-mix(in srgb, CanvasText 18%, Canvas));--qz-text: var(--text-strong, CanvasText);--qz-muted: color-mix(in srgb, var(--muted, CanvasText) 87%, var(--qz-text));--qz-accent: var(--accent, LinkText);--qz-accent-soft: var(--accent-subtle, color-mix(in srgb, var(--qz-accent) 13%, transparent));--qz-ok: var(--ok, #4e9a6b);--qz-warning: var(--warn, #ad7628);--qz-danger: var(--danger, #c7465d);--qz-info: var(--info, var(--qz-accent));container:qz-app / inline-size;width:100%;max-width:1560px;min-width:0;margin-inline:auto;padding:24px clamp(16px,3%,40px) 36px;color:var(--qz-text)}.qz-app,.qz-app *{box-sizing:border-box}.qz-app [hidden]{display:none!important}.qz-app :where(h1,h2,h3,p,ul){margin:0}.qz-app :where(button,input,textarea,select){font:inherit}.qz-app :is(button,summary,input,textarea,select,.qz-board):focus-visible{outline:2px solid var(--qz-accent);outline-offset:2px}.qz-app :is(button,input,textarea,select):disabled{opacity:.55;cursor:default}.qz-app input[type=checkbox]{accent-color:var(--qz-accent)}.qz-icon{width:1rem;height:1rem;flex:none}.qz-header,.qz-brand,.qz-tabs,.qz-view-heading,.qz-toolbar,.qz-actions,.qz-inline-field{display:flex;align-items:center;min-width:0}.qz-header,.qz-view-heading,.qz-toolbar{justify-content:space-between;flex-wrap:wrap;gap:12px 20px}.qz-header{padding:0 0 20px;border-bottom:1px solid var(--qz-border)}.qz-brand{gap:12px}.qz-mark{display:grid;place-items:center;flex:none;width:46px;height:46px;border:1px solid color-mix(in srgb,var(--qz-accent) 34%,var(--qz-border));border-radius:13px;background:linear-gradient(145deg,var(--qz-accent-soft),var(--qz-surface));color:var(--qz-accent)}.qz-mark .qz-icon{width:26px;height:26px}.qz-brand h1{font-size:24px;font-weight:700;letter-spacing:-.035em;line-height:1.1}.qz-brand p{margin-top:3px;color:var(--qz-muted);font-size:12px}.qz-tabs{max-width:100%;gap:3px;padding:4px;border:1px solid var(--qz-border);border-radius:12px;background:var(--qz-surface)}.qz-tabs button{display:flex;align-items:center;justify-content:center;gap:7px;min-height:36px;padding:6px 12px;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--qz-muted);font-size:13px;font-weight:600;cursor:pointer}.qz-tabs button:hover{color:var(--qz-text);background:var(--qz-elevated)}.qz-tabs button[aria-selected=true]{border-color:color-mix(in srgb,var(--qz-accent) 25%,var(--qz-border));background:var(--qz-accent-soft);color:var(--qz-text)}.qz-tabs button[aria-selected=true] .qz-icon{color:var(--qz-accent)}.qz-content{padding-top:24px}.qz-stack{display:grid;gap:14px;min-width:0}.qz-section-title{font-size:27px;font-weight:700;letter-spacing:-.032em;line-height:1.17}.qz-section-description{margin-top:5px;color:var(--qz-muted)}.qz-muted{color:var(--qz-muted);font-weight:400}.qz-mono{font:400 12px/1.5 var(--mono, ui-monospace, monospace)}.qz-path{display:block;min-width:0;overflow:hidden;color:var(--qz-muted);text-overflow:ellipsis;white-space:nowrap}.qz-actions{gap:6px;flex-wrap:wrap}.qz-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;max-width:100%;min-height:36px;padding:5px 11px;border:1px solid var(--qz-border);border-radius:8px;background:var(--qz-surface);color:var(--qz-text);font-size:13px;font-weight:600;text-align:center;cursor:pointer}.qz-button:not(:disabled):hover{background:var(--qz-elevated);border-color:var(--border-strong, var(--qz-muted))}.qz-button[data-variant=primary]{border-color:var(--qz-accent);background:var(--qz-accent);color:var(--accent-fg, var(--qz-canvas))}.qz-button[data-variant=primary]:not(:disabled):hover{border-color:var(--accent-hover, var(--qz-accent));background:var(--accent-hover, var(--qz-accent))}.qz-button[data-variant=quiet]{border-color:transparent;background:transparent;color:var(--qz-muted)}.qz-button[data-variant=quiet]:not(:disabled):hover{color:var(--qz-text)}.qz-icon-button{min-width:36px;padding-inline:8px}.qz-input{min-width:0;max-width:100%;min-height:36px;padding:6px 9px;border:1px solid var(--qz-border);border-radius:8px;background:var(--qz-elevated);color:var(--qz-text);font-size:13px}.qz-input::placeholder{color:var(--qz-muted);opacity:1}.qz-field{display:grid;gap:5px;min-width:0;font-size:13px;font-weight:600}.qz-field .qz-input{width:100%;font-weight:400}.qz-inline-field{gap:8px;color:var(--qz-muted);font-size:13px}.qz-inline-field .qz-input{max-width:min(36ch,52%);font-weight:600}.qz-check-label{display:flex;align-items:center;gap:8px}.qz-panel-surface{min-width:0;border:1px solid var(--qz-border);border-radius:12px;background:var(--qz-surface)}.qz-notice{padding:11px 13px;border:1px solid color-mix(in srgb,var(--qz-warning) 42%,var(--qz-border));border-radius:9px;background:color-mix(in srgb,var(--qz-warning) 7%,var(--qz-surface));font-size:13px;overflow-wrap:anywhere}.qz-notice[data-variant=neutral]{border-color:var(--qz-border);background:var(--qz-surface)}.qz-notice.qz-error{border-color:color-mix(in srgb,var(--qz-danger) 53%,var(--qz-border));background:color-mix(in srgb,var(--qz-danger) 9%,var(--qz-surface))}.qz-empty{display:grid;place-items:center;gap:8px;padding:28px 16px;border:1px dashed var(--qz-border);border-radius:12px;color:var(--qz-muted);text-align:center}.qz-empty :is(h2,h3){color:var(--qz-text);font-size:17px;font-weight:650}.qz-empty .qz-button{margin-top:4px}.qz-empty-icon,.qz-note-icon{display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:9px;background:var(--qz-accent-soft);color:var(--qz-accent)}.qz-visually-hidden{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.qz-board-meta{gap:2px 12px;padding-block:2px}.qz-board-meta>.qz-actions{margin-inline-start:auto}.qz-result-count{color:var(--qz-muted);font-size:12px;font-weight:600}.qz-index{display:inline-flex;align-items:baseline;gap:7px;color:var(--qz-muted);font-size:12px}.qz-index:empty{display:none}.qz-board{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(172px,1fr);gap:10px;min-width:0;padding:2px 2px 10px;overflow-x:auto;overscroll-behavior-inline:contain}.qz-lane{--qz-status: var(--qz-muted);min-width:0;min-height:308px;padding:9px;border:1px solid color-mix(in srgb,var(--qz-status) 20%,var(--qz-border));border-radius:12px;background:linear-gradient(180deg,color-mix(in srgb,var(--qz-status) 7%,var(--qz-surface)),var(--qz-surface) 105px)}.qz-app [data-lane-status=ready]{--qz-status: var(--qz-info)}.qz-app [data-lane-status=in_progress]{--qz-status: var(--qz-accent)}.qz-app [data-lane-status=review]{--qz-status: var(--qz-warning)}.qz-app [data-lane-status=done]{--qz-status: var(--qz-ok)}.qz-app [data-lane-status=repair]{--qz-status: var(--qz-danger)}.qz-lane-heading{display:flex;align-items:center;gap:7px;padding:3px 2px 10px;font-size:13px;font-weight:650;overflow-wrap:anywhere}.qz-dot{width:8px;height:8px;flex:none;border-radius:50%;background:var(--qz-status, var(--qz-ok))}.qz-dot[data-attention=true]{background:var(--qz-warning)}.qz-count{margin-inline-start:auto;padding:1px 6px;border:1px solid var(--qz-border);border-radius:999px;color:var(--qz-muted);font-size:11px;font-variant-numeric:tabular-nums}.qz-lane-empty{padding:11px;border:1px dashed var(--qz-border);border-radius:8px;color:var(--qz-muted);font-size:12px;text-align:center}.qz-cards,.qz-todo-list{list-style:none;padding:0}.qz-cards{display:grid;gap:8px}.qz-cards li{min-width:0}.qz-cards li[draggable=true]{cursor:grab}.qz-cards li[draggable=true]:active{cursor:grabbing}.qz-ticket{border:1px solid var(--qz-border);border-radius:9px;background:var(--qz-elevated);box-shadow:var(--shadow-sm, none)}.qz-ticket:hover,.qz-ticket:focus-within{border-color:var(--border-strong, var(--qz-muted))}.qz-ticket-content{display:grid;gap:5px;padding:10px 10px 8px}.qz-note-link{display:flex;align-items:start;justify-content:space-between;gap:6px;padding:0;border:0;background:transparent;color:var(--qz-text);font-size:14px;font-weight:650;line-height:1.4;text-align:start;overflow-wrap:anywhere;cursor:pointer}.qz-note-link .qz-icon{width:13px;height:13px;margin-top:3px;color:var(--qz-muted)}.qz-note-link:hover{text-decoration:underline}.qz-ticket-progress{display:flex;align-items:center;gap:8px;margin-top:3px;color:var(--qz-muted);font-size:11px;font-variant-numeric:tabular-nums}.qz-ticket-progress progress{width:min(54px,40%);height:5px;accent-color:var(--qz-ok);border:0;border-radius:6px;overflow:hidden}.qz-ticket-progress progress::-webkit-progress-bar{background:var(--qz-border)}.qz-ticket-progress progress::-webkit-progress-value{border-radius:6px;background:var(--qz-ok)}.qz-badge{padding:2px 5px;border-radius:5px;background:color-mix(in srgb,var(--qz-warning) 17%,var(--qz-surface));font-size:11px;overflow-wrap:anywhere}.qz-ticket-footer{position:relative;padding:5px;border-top:1px solid var(--qz-border)}.qz-ticket-status{padding-inline-end:39px}.qz-ticket-status .qz-input{width:100%;min-height:32px;padding:3px 4px;border-color:transparent;background:transparent;color:var(--qz-muted)}.qz-ticket-status .qz-input:not(:disabled):hover{background:var(--qz-surface);border-color:var(--qz-border)}.qz-ticket-actions summary{position:absolute;inset-block-start:5px;inset-inline-end:5px;min-height:32px;list-style:none}.qz-ticket-actions summary::-webkit-details-marker{display:none}.qz-ticket-action-list{display:grid;gap:1px;margin-top:5px;padding-top:5px;border-top:1px solid var(--qz-border)}.qz-ticket-action-list .qz-button{justify-content:start;min-height:32px;text-align:start}.qz-ticket-action-list .qz-destructive:not(:disabled){color:var(--qz-danger)}.qz-ticket-form{display:grid;gap:12px;max-width:630px;padding:16px}.qz-ticket-form h3{font-size:17px;font-weight:650}.qz-note-preview{max-height:180px;margin:0;padding:10px;overflow:auto;background:var(--qz-canvas);white-space:pre-wrap;overflow-wrap:anywhere}.qz-todos{width:100%;max-width:1100px;margin-inline:auto}.qz-todo-filters{display:flex;flex-wrap:wrap;gap:12px;padding:12px}.qz-todo-filters .qz-field{flex:1 1 135px}.qz-todo-filters .qz-field:first-child{flex:3 1 245px}.qz-search{position:relative;display:block}.qz-search .qz-icon{position:absolute;inset-block-start:10px;inset-inline-start:9px;color:var(--qz-muted);pointer-events:none}.qz-search .qz-input{padding-inline-start:32px}.qz-todo-header{display:flex;align-items:center;gap:10px;min-width:0;padding:12px 14px}.qz-todo-identity{flex:1;min-width:0}.qz-todo-identity h3{display:flex;align-items:center;flex-wrap:wrap;gap:5px 9px;font-size:15px;font-weight:650;overflow-wrap:anywhere}.qz-todo-meta{display:flex;align-items:baseline;gap:6px;color:var(--qz-muted);font-size:12px}.qz-todo-meta>span:first-child{min-width:0;overflow-wrap:anywhere}.qz-status-pill{--qz-status: var(--qz-muted);display:inline-flex;align-items:center;gap:5px;padding:1px 7px;border-radius:999px;background:color-mix(in srgb,var(--qz-status) 13%,var(--qz-surface));font-size:11px;font-weight:500}.qz-status-pill .qz-dot{width:6px;height:6px}.qz-todo-row{display:flex;align-items:center;border-top:1px solid var(--qz-border)}.qz-todo-row:hover,.qz-todo-row:focus-within{background:var(--qz-elevated)}.qz-todo-row:last-child{border-radius:0 0 12px 12px}.qz-todo-check{display:flex;align-items:baseline;gap:10px;flex:1;min-width:0;padding:10px 14px;overflow-wrap:anywhere;cursor:pointer}.qz-todo-check input{flex:none;align-self:start;width:16px;height:16px;margin:2px 0 0}.qz-todo-check:has(input:disabled){cursor:default}.qz-todo-row[data-checked=true] .qz-todo-check span{color:var(--qz-muted);text-decoration:line-through}.qz-todo-row>.qz-button{margin-inline-end:6px}@container qz-app (max-width: 650px){.qz-board{grid-auto-columns:clamp(170px,65cqi,244px)}}@container qz-app (max-width: 520px){.qz-header{gap:14px;padding-bottom:14px}.qz-tabs{width:100%}.qz-tabs button{flex:1;gap:5px;padding-inline:5px}.qz-content{padding-top:18px}.qz-section-title{font-size:24px}.qz-inline-field{width:100%}.qz-inline-field .qz-input{flex:1;max-width:none}.qz-board-meta>.qz-actions{margin-inline-start:0}.qz-todo-filters .qz-field:first-child{flex-basis:100%}.qz-todo-header{padding-inline:10px}.qz-todo-header .qz-note-icon{display:none}}@media (pointer: coarse){.qz-app :is(.qz-button,.qz-tabs button,.qz-input,.qz-ticket-status .qz-input,.qz-ticket-actions summary){min-height:42px}}", H = [
  { id: "tasks", label: "Tasks", icon: "board" },
  { id: "todos", label: "TODOs", icon: "checklist" },
  { id: "settings", label: "Settings", icon: "settings" }
];
function St() {
  const t = Be(), [n, a] = m("tasks"), i = B(null), o = (r) => {
    var l;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(r.key)) return;
    r.preventDefault();
    const g = H.findIndex((q) => q.id === n), x = r.key === "Home" ? H[0] : r.key === "End" ? H[H.length - 1] : H[(g + (r.key === "ArrowRight" ? 1 : H.length - 1)) % H.length];
    a(x.id), (l = r.currentTarget.querySelector(`#qz-tab-${x.id}`)) == null || l.focus();
  }, u = () => {
    var r, g;
    a("settings"), (g = (r = i.current) == null ? void 0 : r.querySelector("#qz-tab-settings")) == null || g.focus();
  };
  return /* @__PURE__ */ s("div", { className: "qz-app", children: [
    /* @__PURE__ */ e("style", { children: yt }),
    /* @__PURE__ */ s("header", { className: "qz-header", children: [
      /* @__PURE__ */ s("div", { className: "qz-brand", children: [
        /* @__PURE__ */ e("span", { className: "qz-mark", children: /* @__PURE__ */ e(M, { name: "gem" }) }),
        /* @__PURE__ */ s("div", { children: [
          /* @__PURE__ */ e("h1", { children: "Quartizo" }),
          /* @__PURE__ */ e("p", { children: "Kiro Notes companion" })
        ] })
      ] }),
      /* @__PURE__ */ e("div", { className: "qz-tabs", ref: i, role: "tablist", "aria-label": "Quartizo", onKeyDown: o, children: H.map((r) => /* @__PURE__ */ s(
        "button",
        {
          id: `qz-tab-${r.id}`,
          type: "button",
          role: "tab",
          "aria-selected": n === r.id,
          "aria-controls": "qz-panel",
          tabIndex: n === r.id ? 0 : -1,
          onClick: () => a(r.id),
          children: [
            /* @__PURE__ */ e(M, { name: r.icon }),
            r.label
          ]
        },
        r.id
      )) })
    ] }),
    /* @__PURE__ */ s("div", { className: "qz-content", id: "qz-panel", role: "tabpanel", "aria-labelledby": `qz-tab-${n}`, children: [
      /* @__PURE__ */ e("div", { hidden: n !== "tasks", children: /* @__PURE__ */ e(pt, { api: t, active: n === "tasks", onSettings: u }) }),
      n === "todos" && /* @__PURE__ */ e(ft, { api: t, onSettings: u }),
      n === "settings" && /* @__PURE__ */ e(bt, { api: t })
    ] })
  ] });
}
export {
  St as default
};
