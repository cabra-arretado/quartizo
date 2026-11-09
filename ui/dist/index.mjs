import { jsx as i, jsxs as c, Fragment as Q } from "react/jsx-runtime";
import { useNavigate as ve, useAppApi as Le } from "@kirocrew/app-sdk";
import { Btn as I, PageHeader as Pe } from "@kirocrew/app-sdk/ui";
import { useState as f, useEffect as B, useMemo as we, useRef as _, useCallback as Z } from "react";
const H = "/apps/quartizo/api", Fe = 15e3, G = ["backlog", "ready", "in_progress", "review", "done"], Y = {
  backlog: "Backlog",
  ready: "Ready",
  in_progress: "In Progress",
  review: "Review",
  done: "Done"
};
function j(e) {
  const t = e;
  if ((t == null ? void 0 : t.name) === "AppApiPermissionError")
    return { code: "permission_denied", message: "Quartizo has not declared access to this API in app.json." };
  const n = typeof (t == null ? void 0 : t.status) == "number" ? t.status : void 0;
  let a;
  if (typeof (t == null ? void 0 : t.body) == "string" && t.body)
    try {
      const r = JSON.parse(t.body);
      r && typeof r == "object" && !Array.isArray(r) && (a = r);
    } catch {
    }
  const o = typeof (a == null ? void 0 : a.code) == "string" ? a.code : void 0, d = typeof (a == null ? void 0 : a.error) == "string" ? a.error : typeof (t == null ? void 0 : t.message) == "string" ? t.message : String(e);
  return { status: n, code: o, message: d };
}
function V(e, t = Fe) {
  let n;
  const a = new Promise((o, d) => {
    n = setTimeout(() => d(new Error(`request timed out after ${Math.round(t / 1e3)} s`)), t);
  });
  return Promise.race([e, a]).finally(() => clearTimeout(n));
}
function xe(e) {
  const t = Object.entries(e).filter((n) => n[1] !== void 0 && n[1] !== "").map(([n, a]) => `${encodeURIComponent(n)}=${encodeURIComponent(a)}`);
  return t.length ? `?${t.join("&")}` : "";
}
async function We(e) {
  return (await e.get(`${H}/workspaces`)).workspaces;
}
async function _e(e, t, n) {
  return (await e.post(`${H}/workspaces`, n ? { path: t, name: n, companion: !0 } : { path: t, companion: !0 })).workspace;
}
async function ze(e, t, n = !1) {
  await e.del(`${H}/workspaces/${t}${n ? "?deleteOldTasks=1" : ""}`);
}
const te = `${H}/companion`;
function Ne(e) {
  return e.get(te);
}
function qe(e, t, n) {
  return e.put(`${H}/workspaces/${t}/companion`, { enabled: n });
}
function ne(e, t = {}) {
  const n = {};
  return t.workspaceId !== void 0 && (n.workspaceId = t.workspaceId), t.rebuild && (n.rebuild = !0), t.manual && (n.manual = !0), e.post(`${te}/refresh`, n);
}
function Ke(e, t) {
  return e.get(`${H}/workspaces/${t}/board`);
}
function je(e, t, n) {
  return e.get(`${te}/todos${xe({ workspace: n === void 0 ? void 0 : String(n), state: t })}`);
}
const Ce = [...G, "repair"], ge = { ...Y, repair: "Needs repair" };
function He(e) {
  const t = Object.fromEntries(Ce.map((n) => [n, []]));
  for (const n of e) (t[n.lane] ?? t.repair).push(n);
  return t;
}
function Ue(e) {
  var n;
  if (!e) return null;
  if (e.writeBlocked) return e.writeBlocked.message;
  switch (e.state) {
    case "off":
      return "This workspace is not in Kiro Notes companion mode.";
    case "unavailable":
      return `The Markdown index is unavailable: ${typeof e.error == "string" ? e.error : "parsers failed to load"}.`;
    case "unindexed":
      return "Not indexed yet.";
    case "error":
    case "stale": {
      const a = e.error && typeof e.error == "object" ? e.error.message : "the last scan failed";
      return e.state === "stale" ? `The last scan failed (${a}); showing the previous scan.` : `Indexing failed: ${a}.`;
    }
  }
  const t = [];
  return e.migrationPending && t.push("Old task migration is unfinished. Resume it in Settings before editing this workspace."), (n = e.maintenance) != null && n.length && t.push("Some columns have unfinished ordering maintenance. Resume it in Tasks before editing those tickets."), e.complete === !1 ? t.push("The last scan was incomplete (a limit was reached or a folder could not be read): notes it did not reach are shown as last indexed, and none were treated as deleted.") : e.retained && t.push(`${e.retained} note(s) could not be read and are shown as last indexed.`), e.outdated && t.push("This index was built by an older version; refresh to update it."), t.length ? t.join(" ") : null;
}
function Qe(e, t = Date.now()) {
  var n;
  if (!e) return "";
  if (e.state === "scanning") {
    const a = (n = e.progress) == null ? void 0 : n.notes;
    return e.progress ? `Scanning… ${a} note(s) read${e.progress.rebuild ? " (rebuild)" : ""}` : "Scan queued…";
  }
  return e.indexedAt ? `${e.files ?? 0} note(s) indexed ${Ve(e.indexedAt, t)}` : "";
}
function Ve(e, t) {
  const n = Math.max(0, Math.round((t - e) / 1e3));
  if (n < 5) return "just now";
  if (n < 60) return `${n} s ago`;
  const a = Math.round(n / 60);
  return a < 60 ? `${a} min ago` : new Date(e).toLocaleString();
}
function Ye(e, t) {
  const n = t.trim().toLocaleLowerCase();
  if (!n) return [...e];
  const a = [];
  for (const o of e) {
    const r = `${o.title}
${o.path}`.toLocaleLowerCase().includes(n) ? o.items : o.items.filter((m) => `${m.text}
${m.heading ?? ""}`.toLocaleLowerCase().includes(n));
    r.length && a.push({ ...o, items: r });
  }
  return a;
}
function X(e) {
  return e.trim() || "(empty)";
}
function z(e, t) {
  return `${H}/workspaces/${e}/${t}`;
}
function Ge(e, t, n) {
  return e.get(z(t, "source") + xe({ path: n }));
}
function Je(e, t, n) {
  return e.post(z(t, "tickets"), n);
}
function Xe(e, t, n) {
  return e.post(z(t, "tickets/promote"), { path: n.path, expectedHash: n.hash });
}
function Ze(e, t, n) {
  return e.post(z(t, "tickets/move"), n);
}
function et(e, t, n, a) {
  return e.post(z(t.workspaceId, "todos/toggle"), {
    path: t.path,
    expectedHash: t.hash,
    markerStart: n.markerStart,
    line: n.line,
    column: n.column,
    checked: a
  });
}
function tt(e, t, n, a = !1) {
  return e.post(z(t, "tickets/rebalance"), { status: n, confirm: !0, reconcile: a });
}
function K(e, t) {
  var n, a;
  return e != null && e.writeBlocked ? e.writeBlocked.message : e != null && e.migrationPending ? "Finish the old task migration in Settings before editing this workspace." : !e || e.state !== "ready" || e.complete !== !0 || e.retained || e.outdated || e.error ? "Wait for a complete, current index before editing. Refresh if needed." : t != null && t.status && ((n = e.maintenance) != null && n.includes(t.status)) ? "This column has unfinished order maintenance. Resume maintenance before moving cards." : t && (!t.hash || t.retained || (a = t.diagnostics) != null && a.length) ? "Repair or refresh this note before editing it." : null;
}
function nt(e, t, n, a) {
  if (!t.hash) throw new Error("Refresh this ticket before moving it.");
  const o = e.filter((s) => s.path !== t.path && s.lane === n);
  if (a !== void 0 && (!Number.isInteger(a) || a < 0 || a > o.length))
    throw new Error("The destination card changed. Refresh before moving this ticket.");
  const d = a ?? o.length, r = o[d - 1], m = o[d], v = (s) => {
    if (!s.hash || s.retained || s.diagnostics.length || !s.id || !s.order) throw new Error("Refresh or repair the destination column before moving cards.");
    return { path: s.path, hash: s.hash };
  };
  return {
    path: t.path,
    expectedHash: t.hash,
    status: n,
    ...r ? { before: v(r) } : {},
    ...m ? { after: v(m) } : {}
  };
}
function it(e, t) {
  return e.get(z(t, "migration"));
}
function rt(e, t, n, a = !1) {
  return e.post(z(t, "migration"), { planHash: n, confirm: !0, ...a ? { acceptCurrent: !0 } : {} });
}
function at(e, t) {
  return e.get(z(t, "legacy-tasks"));
}
function ot(e, t, n) {
  return e.post(z(t, "tickets/demote"), { path: n.path, expectedHash: n.hash });
}
const ee = "/md-notebook";
function Te(e) {
  return (e.split("/").pop() ?? e).replace(/\.md$/i, "");
}
const M = {
  column: { display: "flex", flexDirection: "column", gap: 8, minHeight: 0, minWidth: 0 },
  row: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" },
  input: { padding: "4px 6px", border: "1px solid rgba(128,128,128,.4)", borderRadius: 4, background: "transparent", color: "inherit" },
  box: { padding: 8, borderRadius: 4, border: "1px solid rgba(128,128,128,.35)", display: "flex", flexDirection: "column", gap: 6 },
  notice: { padding: 8, borderRadius: 4, border: "1px solid rgba(220,120,0,.6)", display: "flex", flexDirection: "column", gap: 6 },
  badge: { fontSize: 11, padding: "0 4px", borderRadius: 3, border: "1px solid rgba(220,120,0,.7)" },
  mono: { fontFamily: "ui-monospace, monospace", fontSize: 12, wordBreak: "break-all" }
};
function E({ failure: e }) {
  return e ? /* @__PURE__ */ i("div", { role: "alert", className: "text-sm text-danger", "data-code": e.code, children: e.message }) : null;
}
function be() {
  try {
    return window.localStorage;
  } catch {
    return;
  }
}
const st = 1500, lt = 3e4, ye = "quartizo:workspace", p = {
  ...M,
  board: { display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(170px, 1fr)", gap: 8, overflowX: "auto", minHeight: 0, flex: 1 },
  lane: { display: "flex", flexDirection: "column", gap: 6, minHeight: 120, padding: 6, borderRadius: 4, border: "1px solid rgba(128,128,128,.25)" },
  cards: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 },
  card: { display: "flex", alignItems: "flex-start", gap: 4, padding: 6, borderRadius: 4, border: "1px solid rgba(128,128,128,.35)" },
  open: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2, padding: 0, background: "transparent", color: "inherit", border: "none", textAlign: "left", cursor: "pointer" },
  todoRow: { display: "flex", gap: 6, alignItems: "baseline" },
  fileName: { fontFamily: "ui-monospace, monospace", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" },
  copy: { flex: "none", fontSize: 11, padding: "1px 6px", borderRadius: 3, border: "1px solid rgba(128,128,128,.4)", background: "transparent", color: "inherit", cursor: "pointer" }
};
function ct() {
  const [e, t] = f(() => typeof document > "u" || document.visibilityState !== "hidden");
  return B(() => {
    const n = () => t(document.visibilityState !== "hidden");
    return document.addEventListener("visibilitychange", n), () => document.removeEventListener("visibilitychange", n);
  }, []), e;
}
function Se(e, t = !0) {
  const [n, a] = f(null), [o, d] = f(null);
  return B(() => {
    if (!t) return;
    let r = !1;
    return Ne(e).then((m) => {
      r || (a(m.workspaces.filter((v) => v.workspace.companion)), d(m.available ? null : { message: m.error ?? "The Markdown index is unavailable." }));
    }).catch((m) => !r && d(j(m))), () => {
      r = !0;
    };
  }, [e, t]), { companions: n, failure: o };
}
function Re(e, t, n, a, o) {
  const d = ct(), [r, m] = f(null), [v, s] = f(null), [g, k] = f(0), [S, b] = f(!1), N = _(null), R = _(n), A = _(a), u = _(o);
  R.current = n, A.current = a, u.current = o, B(() => {
    N.current = null, m(null), s(null);
  }, [t]), B(() => {
    if (!e || !d) return;
    let T = !1, h, C = !0;
    const W = async () => {
      try {
        (C || !N.current || !u.current(N.current)) && await V(A.current(!1));
        const w = await V(R.current());
        if (T) return;
        N.current = w, m(w), s(null), b(!1);
      } catch (w) {
        T || (s(j(w)), b(!1));
      }
      C = !1, T || (h = setTimeout(W, N.current && u.current(N.current) ? st : lt));
    };
    return W(), () => {
      T = !0, clearTimeout(h);
    };
  }, [e, d, t, g]);
  const y = Z(async () => {
    b(!0);
    try {
      await V(A.current(!0)), s(null), k((T) => T + 1);
    } catch (T) {
      s(j(T));
    } finally {
      b(!1);
    }
  }, []), $ = Z(() => {
    N.current = null, b(!0), k((T) => T + 1);
  }, []);
  return { data: r, failure: v, busy: S, refresh: y, reload: $ };
}
function $e(e) {
  const t = Date.now(), n = e.statuses.map((o) => Qe(o, t)).filter(Boolean), a = e.statuses.map((o) => Ue(o)).filter((o) => !!o);
  return /* @__PURE__ */ c(Q, { children: [
    /* @__PURE__ */ c("div", { style: p.row, children: [
      /* @__PURE__ */ i("span", { className: "text-sm text-muted", role: "status", "aria-live": "polite", children: n.join(" · ") }),
      /* @__PURE__ */ i(I, { onClick: e.onRefresh, disabled: e.busy, children: "Refresh" })
    ] }),
    a.map((o) => /* @__PURE__ */ i("div", { role: "note", className: "text-sm", style: p.notice, children: o }, o))
  ] });
}
function Ae({ path: e }) {
  const t = Te(e), [n, a] = f("idle");
  B(() => {
    if (n === "idle") return;
    const d = setTimeout(() => a("idle"), 1500);
    return () => clearTimeout(d);
  }, [n]);
  const o = async () => {
    try {
      await navigator.clipboard.writeText(t), a("copied");
    } catch {
      a("failed");
    }
  };
  return /* @__PURE__ */ i("button", { type: "button", onClick: () => void o(), "aria-label": `Copy note name “${t}”`, title: t, style: p.copy, children: n === "copied" ? "Copied" : n === "failed" ? "Failed" : "Copy name" });
}
function Ie({ path: e, title: t }) {
  const n = Te(e);
  return n === t ? null : /* @__PURE__ */ i("span", { className: "text-sm text-muted", title: n, style: p.fileName, children: n });
}
function De() {
  return /* @__PURE__ */ i("p", { className: "text-sm text-muted", children: "No folder is shared with Kiro Notes yet. Add one in Settings." });
}
function dt(e) {
  var m, v;
  const t = e.active ?? !0, { companions: n, failure: a } = Se(e.api, t), [o, d] = f(() => {
    var g;
    const s = Number((g = be()) == null ? void 0 : g.getItem(ye));
    return Number.isInteger(s) && s > 0 ? s : null;
  }), r = ((m = n == null ? void 0 : n.find((s) => s.workspace.id === o)) == null ? void 0 : m.workspace) ?? ((v = n == null ? void 0 : n[0]) == null ? void 0 : v.workspace) ?? null;
  return B(() => {
    var s;
    try {
      r && ((s = be()) == null || s.setItem(ye, String(r.id)));
    } catch {
    }
  }, [r]), a && !n ? /* @__PURE__ */ i(E, { failure: a }) : n ? r ? /* @__PURE__ */ c("div", { style: { ...p.column, flex: 1 }, children: [
    /* @__PURE__ */ i(E, { failure: a }),
    n.length > 1 && /* @__PURE__ */ c("div", { style: p.row, children: [
      /* @__PURE__ */ i("label", { className: "text-sm", htmlFor: "qz-board-ws", children: "Workspace" }),
      /* @__PURE__ */ i("select", { id: "qz-board-ws", value: r.id, onChange: (s) => d(Number(s.target.value)), style: p.input, children: n.map((s) => /* @__PURE__ */ i("option", { value: s.workspace.id, children: s.workspace.name }, s.workspace.id)) })
    ] }),
    n.map(({ workspace: s }) => /* @__PURE__ */ i(
      "div",
      {
        hidden: s.id !== r.id,
        style: { display: s.id === r.id ? "flex" : "none", flex: 1, minHeight: 0 },
        children: /* @__PURE__ */ i(ut, { api: e.api, workspace: s, active: t && s.id === r.id })
      },
      s.uid
    ))
  ] }) : /* @__PURE__ */ i(De, {}) : /* @__PURE__ */ i("p", { className: "text-sm text-muted", children: "Loading…" });
}
function ie(e) {
  const [t, n] = f(!1), [a, o] = f(null), d = _(!0), r = _(!1);
  return B(() => (d.current = !0, () => {
    d.current = !1;
  }), []), { pending: t, failure: a, run: async (v) => {
    if (r.current) return !1;
    r.current = !0, n(!0), o(null);
    try {
      return await V(v()), d.current && e(), !0;
    } catch (s) {
      if (d.current) {
        const g = j(s);
        g.status === 409 && (g.message += " Refresh to review the current file, then retry your change."), (g.message.includes("timed out") || !g.status) && (g.message += " The result may be unknown; refresh and check the file before retrying."), o(g);
      }
      return !1;
    } finally {
      r.current = !1, d.current && n(!1);
    }
  } };
}
function ut(e) {
  var de, ue, he, me;
  const { api: t, workspace: n, active: a } = e, o = n.id, d = ve(), { data: r, failure: m, busy: v, refresh: s, reload: g } = Re(
    a,
    String(o),
    () => Ke(t, o),
    (l) => ne(t, { workspaceId: o, manual: l }),
    (l) => l.index.state === "scanning"
  ), k = ie(g), S = we(() => He((r == null ? void 0 : r.tickets) ?? []), [r]), b = Ce.filter((l) => l !== "repair" || S.repair.length > 0), N = _(null), R = _(null), [A, u] = f(null), [y, $] = f(!1), T = !a || !!m || v || k.pending || y || !!K(r == null ? void 0 : r.index), [h, C] = f("backlog"), [W, w] = f(!1), [q, ae] = f(!1), [Me, oe] = f(!1), Oe = Z((l) => {
    C(l), oe(!0);
  }, []), [J, se] = f(null);
  B(() => {
    var L;
    if (!J || T || !r) return;
    const l = Array.from(((L = N.current) == null ? void 0 : L.querySelectorAll("[data-note-path]")) ?? []).find((x) => x.dataset.notePath === J);
    l == null || l.focus(), se(null);
  }, [J, T, r]);
  const le = (l, L, x) => {
    var P;
    T || K(r == null ? void 0 : r.index, l) || !r || (P = r.index.maintenance) != null && P.includes(L) || k.run(() => Ze(t, o, nt(r.tickets, l, L, x))).then((D) => {
      D && se(l.path);
    });
  }, ce = (l, L, x) => {
    l.preventDefault(), l.stopPropagation();
    const P = R.current;
    if (R.current = null, !P || (x == null ? void 0 : x.path) === P.path) return;
    const D = S[L].filter((F) => F.path !== P.path), O = x ? D.findIndex((F) => F.path === x.path) : void 0;
    O !== void 0 && O < 0 || le(P, L, O);
  }, Be = (l) => {
    var fe, pe;
    const L = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"], x = l.target;
    if (!x.hasAttribute("data-lane")) return;
    const P = Number(x.dataset.lane), D = Number(x.dataset.index);
    if (!L.includes(l.key) || Number.isNaN(P) || Number.isNaN(D)) return;
    let O = P, F = D;
    if (l.key === "ArrowUp" && (F = Math.max(0, D - 1)), l.key === "ArrowDown" && (F = D + 1), l.key === "Home" && (F = 0), l.key === "End" && (F = Number.MAX_SAFE_INTEGER), l.key === "ArrowLeft" || l.key === "ArrowRight") {
      const Ee = l.key === "ArrowLeft" ? -1 : 1;
      do
        O += Ee;
      while (O >= 0 && O < b.length && S[b[O]].length === 0);
      if (O < 0 || O >= b.length) return;
    }
    F = Math.min(F, S[b[O]].length - 1), l.preventDefault(), (pe = (fe = N.current) == null ? void 0 : fe.querySelector(`[data-lane="${O}"][data-index="${F}"]`)) == null || pe.focus();
  };
  return /* @__PURE__ */ c("div", { style: { ...p.column, flex: 1 }, children: [
    /* @__PURE__ */ c("div", { style: p.row, children: [
      /* @__PURE__ */ i(I, { onClick: () => u(A === "create" ? null : "create"), disabled: k.pending || y, children: "New ticket" }),
      /* @__PURE__ */ i(I, { onClick: () => u(A === "promote" ? null : "promote"), disabled: k.pending || y, children: "Use existing note" }),
      /* @__PURE__ */ i(I, { onClick: () => oe((l) => !l), disabled: T, children: "Rebalance…" }),
      /* @__PURE__ */ i(I, { onClick: () => d(ee), children: "Open Kiro Notes" })
    ] }),
    ["create", "promote"].map((l) => /* @__PURE__ */ i("div", { hidden: A !== l, style: { display: A === l ? "block" : "none" }, children: /* @__PURE__ */ i(ht, { mode: l, api: t, workspace: n, disabled: !a || !!m || v || k.pending || !!K(r == null ? void 0 : r.index), maintenance: (r == null ? void 0 : r.index.maintenance) ?? [], onBusy: $, onChanged: g, onClose: () => u(null), onMaintenanceNeeded: Oe }) }, l)),
    /* @__PURE__ */ i($e, { statuses: r ? [r.index] : [], busy: v || k.pending, onRefresh: () => void s() }),
    /* @__PURE__ */ i(E, { failure: m }),
    /* @__PURE__ */ i(E, { failure: k.failure }),
    K(r == null ? void 0 : r.index) && r && /* @__PURE__ */ i("div", { role: "note", className: "text-sm", children: K(r.index) }),
    Me || ((de = k.failure) == null ? void 0 : de.code) === "rank_exhausted" || ((ue = k.failure) == null ? void 0 : ue.code) === "maintenance_pending" || (he = r == null ? void 0 : r.index.maintenance) != null && he.length ? /* @__PURE__ */ c("div", { style: p.notice, children: [
      /* @__PURE__ */ i("span", { className: "text-sm", children: "Rebalance a column to restore space between card positions. Progress is saved if interrupted." }),
      /* @__PURE__ */ c("div", { style: p.row, children: [
        /* @__PURE__ */ i("select", { "aria-label": "Column to rebalance", value: h, onChange: (l) => C(l.target.value), style: p.input, children: G.map((l) => /* @__PURE__ */ i("option", { value: l, children: Y[l] }, l)) }),
        /* @__PURE__ */ i(I, { onClick: () => w(!0), disabled: !a || k.pending || !!(r != null && r.index.writeBlocked), children: "Review column…" })
      ] }),
      W && /* @__PURE__ */ c("div", { role: "alertdialog", "aria-label": "Rebalance column", children: [
        /* @__PURE__ */ i("p", { className: "text-sm", children: "Update ordering in each note of this column? Other editors may see progress before all files finish." }),
        !!((me = r == null ? void 0 : r.index.maintenance) != null && me.includes(h)) && /* @__PURE__ */ c("label", { className: "text-sm", children: [
          /* @__PURE__ */ i("input", { type: "checkbox", checked: q, onChange: (l) => ae(l.target.checked), disabled: k.pending }),
          "Keep the latest note contents and resume ordering after an external edit"
        ] }),
        /* @__PURE__ */ i(I, { disabled: !a || k.pending || !!(r != null && r.index.writeBlocked), onClick: () => void k.run(() => tt(t, o, h, q)).then((l) => {
          l && (w(!1), ae(!1));
        }), children: "Rebalance column" }),
        /* @__PURE__ */ i(I, { disabled: k.pending, onClick: () => w(!1), children: "Cancel" })
      ] })
    ] }) : null,
    !r && !m && /* @__PURE__ */ i("p", { className: "text-sm text-muted", children: "Loading the board…" }),
    r && r.tickets.length === 0 && r.index.state !== "scanning" && /* @__PURE__ */ c("p", { className: "text-sm text-muted", children: [
      "No tickets in “",
      n.name,
      "” yet. Create a ticket or use an existing note."
    ] }),
    r && /* @__PURE__ */ i("div", { ref: N, style: p.board, onKeyDown: Be, "aria-label": `Board of ${n.name}`, role: "group", children: b.map((l, L) => /* @__PURE__ */ c(
      "section",
      {
        "aria-label": ge[l],
        style: p.lane,
        onDragOver: (x) => {
          !T && l !== "repair" && x.preventDefault();
        },
        onDrop: (x) => {
          l !== "repair" && ce(x, l);
        },
        children: [
          /* @__PURE__ */ c("strong", { className: "text-sm", children: [
            ge[l],
            " (",
            S[l].length,
            ")"
          ] }),
          /* @__PURE__ */ i("ul", { style: p.cards, children: S[l].map((x, P) => /* @__PURE__ */ i(
            "li",
            {
              draggable: !T && !K(r.index, x),
              onDragStart: (D) => {
                R.current = x, D.dataTransfer.setData("text/plain", x.path), D.dataTransfer.effectAllowed = "move";
              },
              onDragEnd: () => {
                R.current = null;
              },
              onDragOver: (D) => {
                !T && l !== "repair" && D.preventDefault();
              },
              onDrop: (D) => {
                l !== "repair" && ce(D, l, x);
              },
              children: /* @__PURE__ */ i(
                mt,
                {
                  ticket: x,
                  lane: L,
                  index: P,
                  onOpen: () => d(ee),
                  disabled: T || !!K(r.index, x),
                  maintenance: r.index.maintenance ?? [],
                  onMove: (D, O) => le(x, D, O),
                  onDemote: () => {
                    window.confirm(`Remove “${x.title}” from the board? Its note and TODOs will remain.`) && k.run(() => ot(t, o, x));
                  },
                  count: S[l].length
                }
              )
            },
            x.path
          )) })
        ]
      },
      l
    )) })
  ] });
}
function ht(e) {
  const [t, n] = f(""), [a, o] = f(""), [d, r] = f(""), [m, v] = f("backlog"), [s, g] = f(null), [k, S] = f(null), [b, N] = f(!1), R = _(0), A = _(!0);
  B(() => (A.current = !0, () => {
    A.current = !1, R.current++;
  }), []);
  const u = ie(e.onChanged);
  B(() => (e.onBusy(u.pending), () => e.onBusy(!1)), [u.pending, e.onBusy]);
  const y = e.disabled || u.pending || b, $ = e.maintenance.includes(e.mode === "promote" ? "backlog" : m);
  B(() => {
    var w, q;
    (((w = u.failure) == null ? void 0 : w.code) === "rank_exhausted" || ((q = u.failure) == null ? void 0 : q.code) === "maintenance_pending") && e.onMaintenanceNeeded(e.mode === "promote" ? "backlog" : m);
  }, [u.failure, e.mode, e.onMaintenanceNeeded, m]);
  const T = () => {
    n(""), o(""), r(""), g(null), S(null), e.onClose();
  }, h = t.trim().endsWith(".md") ? t.trim() : `${t.trim()}.md`, C = async () => {
    const w = ++R.current;
    N(!0), S(null), g(null);
    try {
      const q = await V(Ge(e.api, e.workspace.id, h));
      A.current && w === R.current && g(q);
    } catch (q) {
      A.current && w === R.current && S(j(q));
    } finally {
      A.current && w === R.current && N(!1);
    }
  }, W = async () => {
    await u.run(() => e.mode === "create" ? Je(e.api, e.workspace.id, { path: h, title: a.trim(), body: d, status: m }) : Xe(e.api, e.workspace.id, s)) && A.current && (n(""), o(""), r(""), g(null), e.onClose());
  };
  return /* @__PURE__ */ c("section", { style: p.box, "aria-label": e.mode === "create" ? "New ticket" : "Use existing note", children: [
    /* @__PURE__ */ c("label", { className: "text-sm", children: [
      "Note path in ",
      e.workspace.name,
      /* @__PURE__ */ i(
        "input",
        {
          "aria-label": "Ticket note path",
          placeholder: "tickets/fix-login.md",
          value: t,
          disabled: u.pending,
          onChange: (w) => {
            R.current++, N(!1), n(w.target.value), g(null);
          },
          style: { ...p.input, marginLeft: 6 }
        }
      )
    ] }),
    e.mode === "create" ? /* @__PURE__ */ c(Q, { children: [
      /* @__PURE__ */ i("input", { "aria-label": "Ticket title", placeholder: "Ticket title", value: a, disabled: u.pending, onChange: (w) => o(w.target.value), style: p.input }),
      /* @__PURE__ */ i("textarea", { "aria-label": "Ticket description", placeholder: "Description (Markdown)", value: d, disabled: u.pending, onChange: (w) => r(w.target.value), rows: 4, style: p.input }),
      /* @__PURE__ */ i("select", { "aria-label": "Initial status", value: m, disabled: u.pending, onChange: (w) => v(w.target.value), style: p.input, children: G.map((w) => /* @__PURE__ */ i("option", { value: w, children: Y[w] }, w)) })
    ] }) : /* @__PURE__ */ c(Q, { children: [
      /* @__PURE__ */ i(I, { disabled: y || !t.trim(), onClick: () => void C(), children: "Preview note" }),
      s && /* @__PURE__ */ c(Q, { children: [
        /* @__PURE__ */ i("pre", { style: { ...p.mono, maxHeight: 180, overflow: "auto", whiteSpace: "pre-wrap" }, children: s.content }),
        /* @__PURE__ */ i("p", { className: "text-sm", children: "Add ticket fields with Backlog status. Existing note content and unrelated properties are preserved." })
      ] })
    ] }),
    $ && /* @__PURE__ */ i("span", { className: "text-sm", children: "Resume ordering maintenance for this column before adding a ticket." }),
    /* @__PURE__ */ i(E, { failure: k }),
    /* @__PURE__ */ i(E, { failure: u.failure }),
    /* @__PURE__ */ c("div", { style: p.row, children: [
      /* @__PURE__ */ i(I, { disabled: y || $ || !t.trim() || (e.mode === "create" ? !a.trim() : !s), onClick: () => void W(), children: e.mode === "create" ? "Create ticket" : "Make ticket" }),
      /* @__PURE__ */ i(I, { disabled: u.pending, onClick: T, children: "Cancel" })
    ] })
  ] });
}
function mt(e) {
  const { ticket: t } = e;
  return /* @__PURE__ */ c("div", { style: { ...p.card, flexDirection: "column" }, children: [
    /* @__PURE__ */ c("div", { style: { ...p.row, width: "100%", alignItems: "flex-start" }, children: [
      /* @__PURE__ */ c("button", { type: "button", "data-lane": e.lane, "data-index": e.index, "data-note-path": t.path, "aria-label": `Open Kiro Notes: ${t.title}`, onClick: e.onOpen, style: p.open, children: [
        /* @__PURE__ */ i("span", { className: "text-sm", style: { fontWeight: 600 }, children: t.title }),
        /* @__PURE__ */ i(Ie, { path: t.path, title: t.title }),
        /* @__PURE__ */ i("span", { className: "text-sm text-muted", style: { overflowWrap: "anywhere" }, children: t.path }),
        t.todos.total > 0 && /* @__PURE__ */ c("span", { className: "text-sm text-muted", children: [
          "☑ ",
          t.todos.done,
          "/",
          t.todos.total
        ] }),
        t.diagnostics.map((n) => /* @__PURE__ */ i("span", { style: p.badge, title: n.message, children: n.code.replace(/_/g, " ") }, n.code))
      ] }),
      /* @__PURE__ */ i(Ae, { path: t.path })
    ] }),
    /* @__PURE__ */ c("div", { style: p.row, children: [
      /* @__PURE__ */ c(
        "select",
        {
          "aria-label": `Move ${t.title} to column`,
          value: t.status ?? "",
          disabled: e.disabled,
          style: p.input,
          onChange: (n) => e.onMove(n.target.value),
          children: [
            !t.status && /* @__PURE__ */ i("option", { value: "", children: "Needs repair" }),
            G.map((n) => /* @__PURE__ */ i("option", { value: n, disabled: e.maintenance.includes(n), children: Y[n] }, n))
          ]
        }
      ),
      /* @__PURE__ */ i("button", { type: "button", "aria-label": `Move ${t.title} up`, disabled: e.disabled || e.index === 0 || !t.status, onClick: () => t.status && e.onMove(t.status, e.index - 1), style: p.copy, children: "↑" }),
      /* @__PURE__ */ i("button", { type: "button", "aria-label": `Remove ${t.title} from board`, disabled: e.disabled, onClick: e.onDemote, style: p.copy, children: "Remove ticket…" }),
      /* @__PURE__ */ i("button", { type: "button", "aria-label": `Move ${t.title} down`, disabled: e.disabled || e.index >= e.count - 1 || !t.status, onClick: () => t.status && e.onMove(t.status, e.index + 1), style: p.copy, children: "↓" })
    ] })
  ] });
}
function ft(e) {
  const { api: t } = e, n = ve(), { companions: a, failure: o } = Se(t), [d, r] = f("all"), [m, v] = f("open"), [s, g] = f("");
  B(() => {
    a && d !== "all" && !a.some((h) => h.workspace.id === d) && r("all");
  }, [a, d]);
  const k = d === "all" ? void 0 : d, S = !!a && a.length > 0, { data: b, failure: N, busy: R, refresh: A, reload: u } = Re(
    S,
    `${d}:${m}`,
    () => je(t, m, k),
    (h) => ne(t, { workspaceId: k, manual: h }),
    (h) => Object.values(h.index).some((C) => C.state === "scanning")
  ), y = we(() => Ye((b == null ? void 0 : b.groups) ?? [], s), [b, s]), $ = ie(u), T = (h, C, W) => {
    $.pending || N || R || K(b == null ? void 0 : b.index[String(h.workspaceId)], h) || C.markerStart === void 0 || $.run(() => et(t, h, C, W));
  };
  return o ? /* @__PURE__ */ i(E, { failure: o }) : a ? a.length === 0 ? /* @__PURE__ */ i(De, {}) : /* @__PURE__ */ c("div", { style: { ...p.column, flex: 1 }, children: [
    /* @__PURE__ */ c("div", { style: p.row, children: [
      a.length > 1 && /* @__PURE__ */ c(
        "select",
        {
          "aria-label": "Workspace",
          value: d,
          onChange: (h) => r(h.target.value === "all" ? "all" : Number(h.target.value)),
          style: p.input,
          children: [
            /* @__PURE__ */ i("option", { value: "all", children: "All workspaces" }),
            a.map((h) => /* @__PURE__ */ i("option", { value: h.workspace.id, children: h.workspace.name }, h.workspace.id))
          ]
        }
      ),
      /* @__PURE__ */ c("select", { "aria-label": "Show", value: m, onChange: (h) => v(h.target.value), style: p.input, children: [
        /* @__PURE__ */ i("option", { value: "open", children: "Open" }),
        /* @__PURE__ */ i("option", { value: "done", children: "Completed" }),
        /* @__PURE__ */ i("option", { value: "all", children: "All" })
      ] }),
      /* @__PURE__ */ i(
        "input",
        {
          "aria-label": "Filter TODOs",
          placeholder: "Filter",
          value: s,
          onChange: (h) => g(h.target.value),
          style: { ...p.input, flex: "1 1 200px" }
        }
      )
    ] }),
    /* @__PURE__ */ i($e, { statuses: b ? Object.values(b.index) : [], busy: R || $.pending, onRefresh: () => void A() }),
    /* @__PURE__ */ i(E, { failure: N }),
    /* @__PURE__ */ i(E, { failure: $.failure }),
    (b == null ? void 0 : b.truncated) && /* @__PURE__ */ i("div", { role: "note", className: "text-sm", style: p.notice, children: "Only the first items are listed. Narrow it down by workspace, state or filter." }),
    !b && !N && /* @__PURE__ */ i("p", { className: "text-sm text-muted", children: "Loading TODOs…" }),
    b && y.length === 0 && /* @__PURE__ */ i("p", { className: "text-sm text-muted", children: s.trim() ? "No TODO matches." : "No TODOs." }),
    /* @__PURE__ */ i("div", { style: { ...p.column, overflowY: "auto" }, children: y.map((h) => /* @__PURE__ */ c("section", { "aria-label": h.title, style: p.box, children: [
      /* @__PURE__ */ c("strong", { className: "text-sm", children: [
        h.title,
        h.ticket && h.status && /* @__PURE__ */ i("span", { className: "text-muted", style: { fontWeight: 400 }, children: ` · ${Y[h.status]}` })
      ] }),
      /* @__PURE__ */ i(Ie, { path: h.path, title: h.title }),
      /* @__PURE__ */ c("span", { className: "text-sm text-muted", style: p.mono, children: [
        h.workspace,
        " · ",
        h.path
      ] }),
      /* @__PURE__ */ i("ul", { style: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }, children: h.items.map((C) => /* @__PURE__ */ c("li", { style: { ...p.todoRow, paddingLeft: C.depth * 18 }, children: [
        /* @__PURE__ */ i(
          "input",
          {
            type: "checkbox",
            "aria-label": `Complete ${X(C.text)}`,
            checked: C.checked,
            disabled: $.pending || !!N || R || !!K(b == null ? void 0 : b.index[String(h.workspaceId)], h) || C.markerStart === void 0,
            onChange: (W) => T(h, C, W.target.checked)
          }
        ),
        /* @__PURE__ */ i(
          "button",
          {
            type: "button",
            title: `${h.path}:${C.line}:${C.column}${C.heading ? ` · ${C.heading}` : ""}`,
            "aria-label": `Open Kiro Notes: ${X(C.text)}`,
            onClick: () => n(ee),
            style: { ...p.open, flexDirection: "row", gap: 6 },
            children: /* @__PURE__ */ i("span", { className: "text-sm", style: { textDecoration: C.checked ? "line-through" : void 0 }, children: X(C.text) })
          }
        ),
        /* @__PURE__ */ i(Ae, { path: h.path })
      ] }, C.ordinal)) })
    ] }, `${h.workspaceId}:${h.path}`)) })
  ] }) : /* @__PURE__ */ i("p", { className: "text-sm text-muted", children: "Loading…" });
}
const ke = { ...M.input, flex: 1, minWidth: 0 };
function re() {
  const [e, t] = f(!1), [n, a] = f(null);
  return { busy: e, failure: n, run: async (d) => {
    t(!0), a(null);
    try {
      return await d(), !0;
    } catch (r) {
      return a(j(r)), !1;
    } finally {
      t(!1);
    }
  } };
}
function pt(e) {
  const { api: t } = e, [n, a] = f(null), [o, d] = f(null), [r, m] = f(null), [v, s] = f(0), [g, k] = f(""), [S, b] = f(""), { busy: N, failure: R, run: A } = re();
  B(() => {
    let y = !1;
    return Promise.all([We(t), Ne(t)]).then(([$, T]) => {
      y || (a($), m(T.writeBlocked ?? null), d(null));
    }).catch(($) => !y && d(j($))), () => {
      y = !0;
    };
  }, [t, v]);
  const u = async () => {
    await A(() => _e(t, g.trim(), S.trim() || void 0)) && (k(""), b(""), s((y) => y + 1));
  };
  return /* @__PURE__ */ c("div", { style: M.column, children: [
    /* @__PURE__ */ i("strong", { className: "text-sm", children: "Folders" }),
    /* @__PURE__ */ i(E, { failure: o }),
    /* @__PURE__ */ i(E, { failure: r }),
    !n && !o && /* @__PURE__ */ i("p", { className: "text-sm text-muted", children: "Loading…" }),
    (n == null ? void 0 : n.length) === 0 && /* @__PURE__ */ i("p", { className: "text-sm text-muted", children: "No folder yet. Add the folder you also attached in Kiro Notes." }),
    n == null ? void 0 : n.map((y) => /* @__PURE__ */ i(gt, { api: t, workspace: y, writeBlocked: r, onChanged: () => s(($) => $ + 1) }, y.id)),
    /* @__PURE__ */ c("div", { style: M.row, children: [
      /* @__PURE__ */ i(
        "input",
        {
          "aria-label": "Absolute folder path",
          placeholder: "/home/you/notes",
          value: g,
          onChange: (y) => k(y.target.value),
          onKeyDown: (y) => y.key === "Enter" && g.trim() && !N && void u(),
          style: ke
        }
      ),
      /* @__PURE__ */ i("input", { "aria-label": "Name (optional)", placeholder: "Name (optional)", value: S, onChange: (y) => b(y.target.value), style: { ...ke, flex: "0 1 180px" } }),
      /* @__PURE__ */ i(I, { onClick: () => void u(), disabled: N || !g.trim(), children: "Add folder" })
    ] }),
    /* @__PURE__ */ i(E, { failure: R })
  ] });
}
function gt(e) {
  const { api: t, workspace: n } = e, { busy: a, failure: o, run: d } = re(), [r, m] = f(null), [v, s] = f(!1);
  return B(() => {
    if (!r) return;
    const g = setTimeout(() => m(null), 3e3);
    return () => clearTimeout(g);
  }, [r]), /* @__PURE__ */ c("section", { "aria-label": n.name, style: M.box, children: [
    /* @__PURE__ */ c("div", { style: M.row, children: [
      /* @__PURE__ */ i("strong", { className: "text-sm", children: n.name }),
      /* @__PURE__ */ i("span", { className: "text-sm text-muted", style: M.mono, children: n.path })
    ] }),
    /* @__PURE__ */ c("div", { style: M.row, children: [
      /* @__PURE__ */ c("label", { className: "text-sm", style: M.row, children: [
        /* @__PURE__ */ i(
          "input",
          {
            type: "checkbox",
            checked: !!n.companion,
            disabled: a,
            onChange: () => void d(() => qe(t, n.id, !n.companion)).then((g) => g && e.onChanged())
          }
        ),
        "Shared with Kiro Notes"
      ] }),
      /* @__PURE__ */ i("span", { style: { flex: 1 } }),
      n.companion && /* @__PURE__ */ i(
        I,
        {
          onClick: () => void d(() => ne(t, { workspaceId: n.id, manual: !0, rebuild: !0 })).then(
            (g) => g && m("Rebuild requested.")
          ),
          disabled: a,
          children: "Rebuild index"
        }
      ),
      !v && /* @__PURE__ */ i(I, { onClick: () => s(!0), disabled: a, children: "Remove…" })
    ] }),
    !!n.oldTasks && /* @__PURE__ */ i(bt, { api: t, workspace: n, writeBlocked: e.writeBlocked, onChanged: e.onChanged }),
    v && /* @__PURE__ */ c("div", { role: "alertdialog", "aria-label": "Remove folder", style: M.notice, children: [
      /* @__PURE__ */ c("span", { className: "text-sm", children: [
        "Stop showing “",
        n.name,
        "” in Quartizo? The folder and its files are not touched.",
        !!n.oldTasks && ` It still has ${n.oldTasks} task(s) from Quartizo's old task board, which no view shows any more: removing the folder deletes them.`
      ] }),
      /* @__PURE__ */ c("div", { style: M.row, children: [
        /* @__PURE__ */ i(
          I,
          {
            onClick: () => void d(() => ze(t, n.id, !!n.oldTasks)).then((g) => g && e.onChanged()),
            disabled: a,
            children: n.oldTasks ? `Remove and delete ${n.oldTasks} task(s)` : "Remove"
          }
        ),
        /* @__PURE__ */ i(I, { onClick: () => s(!1), disabled: a, children: "Cancel" })
      ] })
    ] }),
    r && /* @__PURE__ */ i("span", { className: "text-sm text-muted", role: "status", children: r }),
    /* @__PURE__ */ i(E, { failure: o })
  ] });
}
function bt({ api: e, workspace: t, writeBlocked: n, onChanged: a }) {
  const [o, d] = f(null), [r, m] = f(null), [v, s] = f(!1), [g, k] = f(!1), { busy: S, failure: b, run: N } = re(), R = async () => {
    const u = await at(e, t.id), y = URL.createObjectURL(new Blob([JSON.stringify(u, null, 2)], { type: "application/json" })), $ = document.createElement("a");
    $.href = y, $.download = `quartizo-old-tasks-${t.id}.json`, $.click(), setTimeout(() => URL.revokeObjectURL(y), 1e3), s(!0);
  }, A = async () => {
    if (!o) return;
    const u = await rt(e, t.id, o.planHash, g);
    m(u), d(null), a();
  };
  return /* @__PURE__ */ c("section", { style: M.box, "aria-label": `Old tasks in ${t.name}`, children: [
    /* @__PURE__ */ c("span", { className: "text-sm", children: [
      t.oldTasks,
      " old database task(s) are preserved. Convert them to Markdown ticket notes to show them on the board."
    ] }),
    /* @__PURE__ */ c("div", { style: M.row, children: [
      /* @__PURE__ */ i(I, { disabled: S, onClick: () => void N(R), children: "Export old tasks" }),
      /* @__PURE__ */ i(I, { disabled: S || !t.companion, onClick: () => void N(async () => {
        d(await it(e, t.id)), m(null), k(!1);
      }), children: "Preview migration" })
    ] }),
    v && /* @__PURE__ */ i("span", { className: "text-sm", role: "status", children: "Export downloaded." }),
    o && /* @__PURE__ */ c("div", { role: "alertdialog", "aria-label": "Confirm old task migration", style: M.notice, children: [
      /* @__PURE__ */ c("strong", { className: "text-sm", children: [
        "Create ",
        o.tasks.filter((u) => !u.migrated).length,
        " ticket note(s)"
      ] }),
      /* @__PURE__ */ i("span", { className: "text-sm", children: "A backup is saved before writing. Existing database tasks remain preserved; no existing note is overwritten." }),
      o.warnings.map((u, y) => /* @__PURE__ */ i("span", { className: "text-sm", children: u }, y)),
      /* @__PURE__ */ i("ul", { style: { maxHeight: 200, overflowY: "auto" }, children: o.tasks.map((u) => /* @__PURE__ */ c("li", { className: "text-sm", children: [
        u.title,
        " → ",
        /* @__PURE__ */ i("code", { children: u.path }),
        " (",
        u.status,
        ")",
        u.migrated && " · already migrated",
        u.noteRef && /* @__PURE__ */ c("span", { children: [
          " · linked note: ",
          u.noteRef
        ] }),
        u.slotId && /* @__PURE__ */ c("span", { children: [
          " · session: ",
          u.slotId
        ] })
      ] }, u.uid)) }),
      o.tasks.some((u) => u.changed) && !o.complete && /* @__PURE__ */ c("label", { className: "text-sm", children: [
        /* @__PURE__ */ i("input", { type: "checkbox", checked: g, onChange: (u) => k(u.target.checked), disabled: S }),
        "I reviewed the changed converted notes; keep their latest contents when resuming"
      ] }),
      /* @__PURE__ */ c("div", { style: M.row, children: [
        /* @__PURE__ */ i(I, { disabled: S || !!n || o.complete || !o.tasks.length, onClick: () => void N(A), children: o.backup ? "Resume and verify migration" : "Back up and migrate" }),
        /* @__PURE__ */ i(I, { disabled: S, onClick: () => d(null), children: "Cancel" })
      ] })
    ] }),
    r && /* @__PURE__ */ c("div", { style: M.notice, role: "status", children: [
      /* @__PURE__ */ c("span", { className: "text-sm", children: [
        r.migrated.length,
        " ticket note(s) migrated. ",
        r.complete ? "Migration verified." : `${r.remaining} task(s) remain; preview again to continue.`
      ] }),
      /* @__PURE__ */ c("span", { className: "text-sm", style: M.mono, children: [
        "Backup: ",
        r.backup.directory
      ] })
    ] }),
    /* @__PURE__ */ i(E, { failure: b })
  ] });
}
const U = [
  { id: "tasks", label: "Tasks" },
  { id: "todos", label: "TODOs" },
  { id: "settings", label: "Settings" }
];
function xt() {
  const e = Le(), [t, n] = f("tasks");
  return /* @__PURE__ */ c(Q, { children: [
    /* @__PURE__ */ i(Pe, { title: "Quartizo", subtitle: "Kiro Notes board and TODOs" }),
    /* @__PURE__ */ c("div", { className: "px-6 pb-8 flex-1 min-h-0 flex flex-col gap-3", children: [
      /* @__PURE__ */ i("div", { role: "tablist", "aria-label": "Quartizo", onKeyDown: (o) => {
        var m;
        if (o.key !== "ArrowLeft" && o.key !== "ArrowRight") return;
        o.preventDefault();
        const d = U.findIndex((v) => v.id === t), r = U[(d + (o.key === "ArrowRight" ? 1 : U.length - 1)) % U.length];
        n(r.id), (m = document.getElementById(`qz-tab-${r.id}`)) == null || m.focus();
      }, style: { display: "flex", gap: 4 }, children: U.map((o) => /* @__PURE__ */ i(
        "button",
        {
          id: `qz-tab-${o.id}`,
          type: "button",
          role: "tab",
          "aria-selected": t === o.id,
          "aria-controls": "qz-panel",
          tabIndex: t === o.id ? 0 : -1,
          onClick: () => n(o.id),
          style: {
            padding: "4px 12px",
            background: "transparent",
            color: "inherit",
            border: "none",
            borderBottom: t === o.id ? "2px solid currentColor" : "2px solid transparent",
            fontWeight: t === o.id ? 600 : 400,
            cursor: "pointer"
          },
          children: o.label
        },
        o.id
      )) }),
      /* @__PURE__ */ c(
        "div",
        {
          id: "qz-panel",
          role: "tabpanel",
          "aria-labelledby": `qz-tab-${t}`,
          style: { display: "flex", flexDirection: "column", flex: 1, minHeight: 0 },
          children: [
            /* @__PURE__ */ i("div", { hidden: t !== "tasks", style: { display: t === "tasks" ? "flex" : "none", flex: 1, minHeight: 0 }, children: /* @__PURE__ */ i(dt, { api: e, active: t === "tasks" }) }),
            t === "todos" && /* @__PURE__ */ i(ft, { api: e }),
            t === "settings" && /* @__PURE__ */ i(pt, { api: e })
          ]
        }
      )
    ] })
  ] });
}
export {
  xt as default
};
