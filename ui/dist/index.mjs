import { jsx as u, jsxs as m, Fragment as ye } from "react/jsx-runtime";
import { useNavigate as jn, useChatLauncher as ea, useAppApi as ta } from "@kirocrew/app-sdk";
import { useState as T, useEffect as pe, useRef as de, useMemo as He, useCallback as Mt, useDeferredValue as na, useLayoutEffect as ra } from "react";
import { SegmentedControl as aa } from "@kirocrew/app-sdk/ui";
const je = "/apps/quartizo/api", ia = 15e3, Jn = { id: "repair", label: "Needs repair" };
function xe(e) {
  const t = e;
  if ((t == null ? void 0 : t.name) === "AppApiPermissionError")
    return { code: "permission_denied", message: "Quartizo has not declared access to this API in app.json." };
  const n = typeof (t == null ? void 0 : t.status) == "number" ? t.status : void 0;
  let r;
  if (typeof (t == null ? void 0 : t.body) == "string" && t.body)
    try {
      const s = JSON.parse(t.body);
      s && typeof s == "object" && !Array.isArray(s) && (r = s);
    } catch {
    }
  const a = typeof (r == null ? void 0 : r.code) == "string" ? r.code : void 0, i = typeof (r == null ? void 0 : r.error) == "string" ? r.error : typeof (t == null ? void 0 : t.message) == "string" ? t.message : String(e);
  return { status: n, code: a, message: i };
}
function we(e, t = ia) {
  let n;
  const r = new Promise((a, i) => {
    n = setTimeout(() => i(new Error(`request timed out after ${Math.round(t / 1e3)} s`)), t);
  });
  return Promise.race([e, r]).finally(() => clearTimeout(n));
}
function jt(e) {
  const t = Object.entries(e).filter((n) => n[1] !== void 0 && n[1] !== "").map(([n, r]) => `${encodeURIComponent(n)}=${encodeURIComponent(r)}`);
  return t.length ? `?${t.join("&")}` : "";
}
async function sa(e) {
  return (await e.get(`${je}/workspaces`)).workspaces;
}
async function oa(e, t, n) {
  return (await e.post(`${je}/workspaces`, n ? { path: t, name: n, companion: !0 } : { path: t, companion: !0 })).workspace;
}
async function la(e, t, n, r) {
  return (await e.put(ve(t, "columns"), { columns: n, columnsVersion: r })).workspace;
}
async function ca(e, t, n = !1) {
  await e.del(`${je}/workspaces/${t}${n ? "?deleteOldTasks=1" : ""}`);
}
const Jt = `${je}/companion`;
function vt(e) {
  return e.get(Jt);
}
function ua(e, t, n) {
  return e.put(`${je}/workspaces/${t}/companion`, { enabled: n });
}
function Wt(e, t = {}) {
  const n = {};
  return t.workspaceId !== void 0 && (n.workspaceId = t.workspaceId), t.rebuild && (n.rebuild = !0), t.manual && (n.manual = !0), e.post(`${Jt}/refresh`, n);
}
function da(e, t) {
  return e.get(`${je}/workspaces/${t}/board`);
}
function ha(e, t, n) {
  return e.get(`${Jt}/todos${jt({ workspace: n === void 0 ? void 0 : String(n), state: t })}`);
}
function pa(e, t) {
  const n = [], r = new Map(e.map((a) => [a.id, []]));
  r.set(Jn.id, n);
  for (const a of t) (r.get(a.lane) ?? n).push(a);
  return Object.fromEntries(r);
}
function Zt(e) {
  var n;
  if (!e) return null;
  if (e.writeBlocked) return e.writeBlocked.message;
  switch (e.state) {
    case "off":
      return "This folder is hidden in Quartizo.";
    case "unavailable":
      return `The Markdown index is unavailable: ${typeof e.error == "string" ? e.error : "parsers failed to load"}.`;
    case "unindexed":
      return "Not indexed yet.";
    case "error":
    case "stale": {
      const r = e.error && typeof e.error == "object" ? e.error.message : "the last scan failed";
      return e.state === "stale" ? `The last scan failed (${r}); showing the previous scan.` : `Indexing failed: ${r}.`;
    }
  }
  const t = [];
  return e.migrationPending && t.push("Old task migration is unfinished. Resume it in Settings before editing this workspace."), (n = e.maintenance) != null && n.length && t.push("Some columns have unfinished ordering maintenance. Resume it in Tasks before editing those tickets."), e.complete === !1 ? t.push("The last scan was incomplete (a limit was reached or a folder could not be read): notes it did not reach are shown as last indexed, and none were treated as deleted.") : e.retained && t.push(`${e.retained} note(s) could not be read and are shown as last indexed.`), e.outdated && t.push("This index was built by an older version; refresh to update it."), t.length ? t.join(" ") : null;
}
function fa(e, t = Date.now()) {
  if (!e) return "";
  if (e.state === "scanning") {
    if (!e.progress) return "Scan queued…";
    const { notes: r, rebuild: a } = e.progress;
    return `Scanning… ${r} ${r === 1 ? "note" : "notes"} read${a ? " (rebuild)" : ""}`;
  }
  if (!e.indexedAt) return "";
  const n = e.files ?? 0;
  return `${n} ${n === 1 ? "note" : "notes"} indexed ${ga(e.indexedAt, t)}`;
}
function ga(e, t) {
  const n = Math.max(0, Math.round((t - e) / 1e3));
  if (n < 5) return "just now";
  if (n < 60) return `${n} s ago`;
  const r = Math.round(n / 60);
  return r < 60 ? `${r} min ago` : new Date(e).toLocaleString();
}
function ma(e, t) {
  const n = t.trim().toLocaleLowerCase();
  if (!n) return [...e];
  const r = [];
  for (const a of e) {
    const s = `${a.title}
${a.path}`.toLocaleLowerCase().includes(n) ? a.items : a.items.filter((o) => `${o.text}
${o.heading ?? ""}`.toLocaleLowerCase().includes(n));
    s.length && r.push({ ...a, items: s });
  }
  return r;
}
function yt(e) {
  return e.trim() || "(empty)";
}
function ve(e, t) {
  return `${je}/workspaces/${e}/${t}`;
}
function It(e, t, n) {
  return e.get(ve(t, "source") + jt({ path: n }));
}
function ba(e, t) {
  return e.get(ve(t, "notes"));
}
function va(e, t, n) {
  return e.get(ve(t, "backlinks") + jt({ path: n }));
}
function ka(e, t, n) {
  return e.post(ve(t, "notes"), { path: n });
}
function _a(e, t, n, r, a) {
  return e.put(ve(t, "source"), { path: n, content: r, expectedHash: a });
}
function xa(e, t, n) {
  return e.post(ve(t, "tickets"), n);
}
function wa(e, t, n, r) {
  return e.post(ve(t, "tickets/promote"), { path: n.path, expectedHash: n.hash, ...r === void 0 ? {} : { status: r } });
}
function za(e, t, n) {
  return e.post(ve(t, "tickets/move"), n);
}
function ya(e, t, n, r) {
  return e.post(ve(t.workspaceId, "todos/toggle"), {
    path: t.path,
    expectedHash: t.hash,
    markerStart: n.markerStart,
    line: n.line,
    column: n.column,
    checked: r
  });
}
function Ra(e, t, n, r = !1) {
  return e.post(ve(t, "tickets/rebalance"), { status: n, confirm: !0, reconcile: r });
}
function Se(e, t) {
  var n, r;
  return e != null && e.writeBlocked ? e.writeBlocked.message : e != null && e.migrationPending ? "Finish the old task migration in Settings before editing this workspace." : !e || e.state !== "ready" || e.complete !== !0 || e.retained || e.outdated || e.error ? "Wait for a complete, current index before editing. Refresh if needed." : t != null && t.status && ((n = e.maintenance) != null && n.includes(t.status)) ? "This column has unfinished order maintenance. Resume maintenance before moving cards." : t && (!t.hash || t.retained || (r = t.diagnostics) != null && r.some((a) => a.code !== "unconfigured_status")) ? "Repair or refresh this note before editing it." : null;
}
function Ea(e, t, n, r) {
  if (!t.hash) throw new Error("Refresh this ticket before moving it.");
  const a = e.filter((c) => c.path !== t.path && c.lane === n);
  if (r !== void 0 && (!Number.isInteger(r) || r < 0 || r > a.length))
    throw new Error("The destination card changed. Refresh before moving this ticket.");
  const i = r ?? a.length, s = a[i - 1], o = a[i], l = (c) => {
    if (!c.hash || c.retained || c.diagnostics.length || !c.id || !c.order) throw new Error("Refresh or repair the destination column before moving cards.");
    return { path: c.path, hash: c.hash };
  };
  return {
    path: t.path,
    expectedHash: t.hash,
    status: n,
    ...s ? { before: l(s) } : {},
    ...o ? { after: l(o) } : {}
  };
}
function qa(e, t) {
  return e.get(ve(t, "migration"));
}
function Ca(e, t, n, r = !1) {
  return e.post(ve(t, "migration"), { planHash: n, confirm: !0, ...r ? { acceptCurrent: !0 } : {} });
}
function Aa(e, t) {
  return e.get(ve(t, "legacy-tasks"));
}
function Na(e, t, n) {
  return e.post(ve(t, "tickets/demote"), { path: n.path, expectedHash: n.hash });
}
const Wn = "/md-notebook";
function Da(e) {
  return (e.split("/").pop() ?? e).replace(/\.md$/i, "");
}
const Sa = {
  gem: /* @__PURE__ */ u("path", { d: "M8 4h8l4.5 5L12 21 3.5 9 8 4Zm-4.5 5h17M8 4l1 5 3 12 3-12 1-5" }),
  board: /* @__PURE__ */ m(ye, { children: [
    /* @__PURE__ */ u("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }),
    /* @__PURE__ */ u("path", { d: "M9 4v16m6-16v16M6 8h.1M12 8h.1m6 0h.1" })
  ] }),
  checklist: /* @__PURE__ */ u("path", { d: "m3 6 2 2 3-4m3 3h10M3 13l2 2 3-4m3 3h10M3 20h5m3 0h10" }),
  settings: /* @__PURE__ */ m(ye, { children: [
    /* @__PURE__ */ u("path", { d: "M4 6h7m4 0h5M4 12h3m4 0h9M4 18h11m4 0h1" }),
    /* @__PURE__ */ u("circle", { cx: "13", cy: "6", r: "2" }),
    /* @__PURE__ */ u("circle", { cx: "9", cy: "12", r: "2" }),
    /* @__PURE__ */ u("circle", { cx: "17", cy: "18", r: "2" })
  ] }),
  plus: /* @__PURE__ */ u("path", { d: "M12 5v14M5 12h14" }),
  note: /* @__PURE__ */ u("path", { d: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M8 13h8m-8 4h6" }),
  external: /* @__PURE__ */ u("path", { d: "M13 5h6v6m0-6-9 9m8-1v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" }),
  refresh: /* @__PURE__ */ u("path", { d: "M20 11a8 8 0 1 0-2.2 6.6M20 4v7h-7" }),
  folder: /* @__PURE__ */ u("path", { d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" }),
  more: /* @__PURE__ */ m(ye, { children: [
    /* @__PURE__ */ u("circle", { cx: "5", cy: "12", r: "1" }),
    /* @__PURE__ */ u("circle", { cx: "12", cy: "12", r: "1" }),
    /* @__PURE__ */ u("circle", { cx: "19", cy: "12", r: "1" })
  ] }),
  copy: /* @__PURE__ */ m(ye, { children: [
    /* @__PURE__ */ u("rect", { x: "8", y: "8", width: "12", height: "12", rx: "2" }),
    /* @__PURE__ */ u("path", { d: "M16 4H6a2 2 0 0 0-2 2v10" })
  ] }),
  search: /* @__PURE__ */ m(ye, { children: [
    /* @__PURE__ */ u("circle", { cx: "10.5", cy: "10.5", r: "5.5" }),
    /* @__PURE__ */ u("path", { d: "m15 15 5 5" })
  ] }),
  up: /* @__PURE__ */ u("path", { d: "m6 14 6-6 6 6" }),
  down: /* @__PURE__ */ u("path", { d: "m6 10 6 6 6-6" }),
  check: /* @__PURE__ */ u("path", { d: "m5 12 4 4L19 6" }),
  edit: /* @__PURE__ */ u("path", { d: "m14 6 4 4M4 20l4.7-1 11-11a2.8 2.8 0 0 0-4-4l-11 11L4 20Z" }),
  minus: /* @__PURE__ */ u("path", { d: "M5 12h14" })
};
function Q({ name: e }) {
  return /* @__PURE__ */ u(
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
      children: Sa[e]
    }
  );
}
function he({ failure: e }) {
  return e ? /* @__PURE__ */ u("div", { role: "alert", className: "qz-notice qz-error", "data-code": e.code, children: e.message }) : null;
}
function ht() {
  try {
    return window.localStorage;
  } catch {
    return;
  }
}
function Zn() {
  const [e, t] = T(() => typeof document > "u" || document.visibilityState !== "hidden");
  return pe(() => {
    const n = () => t(document.visibilityState !== "hidden");
    return document.addEventListener("visibilitychange", n), () => document.removeEventListener("visibilitychange", n);
  }, []), e;
}
const Ta = 1500, Fa = 3e3, tn = "quartizo:workspace";
function Hn(e, t = !0) {
  const [n, r] = T(null), [a, i] = T(null);
  return pe(() => {
    if (!t) return;
    let s = !1;
    return vt(e).then((o) => {
      s || (r(o.workspaces.filter((l) => l.workspace.companion)), i(o.available ? null : { message: o.error ?? "The Markdown index is unavailable." }));
    }).catch((o) => !s && i(xe(o))), () => {
      s = !0;
    };
  }, [e, t]), { companions: n, failure: a };
}
function Kn(e, t, n, r, a, i, s) {
  const o = Zn(), [l, c] = T(null), [d, p] = T(null), [f, g] = T(0), [h, w] = T(!1), x = de(a), v = de(i), b = de(s);
  x.current = a, v.current = i, b.current = s, pe(() => {
    c(null), p(null);
  }, [n]), pe(() => {
    if (!t || !o) return;
    let R = !1, k, F, z;
    const A = async () => {
      let O = !1;
      try {
        const j = await we(vt(e));
        if (R) return;
        if (!j.available) throw new Error(j.error ?? "The Markdown index is unavailable.");
        const B = j.workspaces.filter(({ workspace: C }) => C.companion), J = B.filter(({ workspace: C }) => r === void 0 || C.id === r), H = Object.fromEntries(J.map(({ workspace: C, index: D }) => [C.id, D]));
        O = J.some(({ index: C }) => C.state === "scanning");
        const ie = JSON.stringify(B.map(({ workspace: C, index: D }) => [C.id, C.columnsVersion, D.indexedAt])), E = JSON.stringify(H);
        if (F !== ie) {
          const C = await we(x.current());
          if (R) return;
          c(C), F = ie, z = void 0;
        } else if (z !== E) {
          const C = b.current;
          c((D) => D && C(D, H)), z = E;
        }
        p(null), w(!1);
      } catch (j) {
        R || (p(xe(j)), w(!1));
      }
      R || (k = setTimeout(A, O ? Ta : Fa));
    };
    return A(), () => {
      R = !0, clearTimeout(k);
    };
  }, [t, e, o, n, f, r]);
  const _ = Mt(async () => {
    w(!0);
    try {
      await we(v.current()), p(null), g((R) => R + 1);
    } catch (R) {
      p(xe(R));
    } finally {
      w(!1);
    }
  }, []), y = Mt(() => {
    w(!0), g((R) => R + 1);
  }, []);
  return { data: l, failure: d, busy: h, refresh: _, reload: y };
}
function Gn({ statuses: e }) {
  const t = Date.now(), n = e.map((r) => fa(r, t)).filter(Boolean);
  return /* @__PURE__ */ u("span", { className: "qz-index", role: "status", children: n.length > 0 && /* @__PURE__ */ m(ye, { children: [
    /* @__PURE__ */ u("span", { className: "qz-dot", "data-attention": e.some((r) => r.state === "scanning" || !!Zt(r)) }),
    n.join(" · ")
  ] }) });
}
function Yn({ statuses: e }) {
  const t = new Set(e.map(Zt).filter(Boolean));
  return /* @__PURE__ */ u(ye, { children: [...t].map((n) => /* @__PURE__ */ u("div", { role: "note", className: "qz-notice", children: n }, n)) });
}
function Xn({ path: e, compact: t = !1 }) {
  const n = Da(e), [r, a] = T("idle");
  pe(() => {
    if (r === "idle") return;
    const s = setTimeout(() => a("idle"), 1500);
    return () => clearTimeout(s);
  }, [r]);
  const i = async () => {
    try {
      await navigator.clipboard.writeText(n), a("copied");
    } catch {
      a("failed");
    }
  };
  return /* @__PURE__ */ m(ye, { children: [
    /* @__PURE__ */ m(
      "button",
      {
        type: "button",
        className: `qz-button${t ? " qz-icon-button" : ""}`,
        "data-variant": "quiet",
        onClick: () => void i(),
        "aria-label": `Copy note name “${n}”`,
        title: `Copy note name “${n}”`,
        children: [
          /* @__PURE__ */ u(Q, { name: r === "copied" ? "check" : "copy" }),
          (!t || r !== "idle") && (r === "copied" ? "Copied" : r === "failed" ? "Copy failed" : "Copy name")
        ]
      }
    ),
    /* @__PURE__ */ u("span", { className: "qz-visually-hidden", role: "status", children: r === "copied" ? "Note name copied." : r === "failed" ? "Could not copy note name." : "" })
  ] });
}
function Vn({ onSettings: e }) {
  return /* @__PURE__ */ m("div", { className: "qz-empty", children: [
    /* @__PURE__ */ u("span", { className: "qz-empty-icon", children: /* @__PURE__ */ u(Q, { name: "folder" }) }),
    /* @__PURE__ */ u("h2", { children: "Connect a notes folder" }),
    /* @__PURE__ */ u("p", { children: "Add a folder of Markdown files to see its tickets and TODOs here." }),
    /* @__PURE__ */ u("button", { type: "button", className: "qz-button", "data-variant": "primary", onClick: e, children: "Open Settings" })
  ] });
}
function Ma(e) {
  var o, l;
  const t = e.active ?? !0, { companions: n, failure: r } = Hn(e.api, t), [a, i] = T(() => {
    var d;
    const c = Number((d = ht()) == null ? void 0 : d.getItem(tn));
    return Number.isInteger(c) && c > 0 ? c : null;
  }), s = ((o = n == null ? void 0 : n.find((c) => c.workspace.id === a)) == null ? void 0 : o.workspace) ?? ((l = n == null ? void 0 : n[0]) == null ? void 0 : l.workspace) ?? null;
  return pe(() => {
    var c;
    try {
      s && ((c = ht()) == null || c.setItem(tn, String(s.id)));
    } catch {
    }
  }, [s]), r && !n ? /* @__PURE__ */ u(he, { failure: r }) : n ? s ? /* @__PURE__ */ m("div", { className: "qz-stack", children: [
    /* @__PURE__ */ u(he, { failure: r }),
    /* @__PURE__ */ m("div", { className: "qz-view-heading", children: [
      /* @__PURE__ */ m("div", { children: [
        /* @__PURE__ */ u("h2", { className: "qz-section-title", children: "Task board" }),
        /* @__PURE__ */ u("p", { className: "qz-section-description", children: "Plan and track tickets stored in your notes." })
      ] }),
      /* @__PURE__ */ m("label", { className: "qz-inline-field", children: [
        /* @__PURE__ */ u(Q, { name: "folder" }),
        /* @__PURE__ */ u("span", { children: "Workspace" }),
        /* @__PURE__ */ u("select", { className: "qz-input", value: s.id, onChange: (c) => i(Number(c.target.value)), children: n.map((c) => /* @__PURE__ */ u("option", { value: c.workspace.id, children: c.workspace.name }, c.workspace.id)) })
      ] })
    ] }),
    n.map(({ workspace: c }) => /* @__PURE__ */ u("div", { hidden: c.id !== s.id, children: /* @__PURE__ */ u(
      Ia,
      {
        api: e.api,
        workspace: c,
        active: t && c.id === s.id,
        onSettings: e.onSettings,
        onOpenNote: e.onOpenNote
      }
    ) }, c.uid))
  ] }) : /* @__PURE__ */ u(Vn, { onSettings: e.onSettings }) : /* @__PURE__ */ u("p", { className: "qz-empty", role: "status", children: "Loading workspaces…" });
}
function Ht(e) {
  const [t, n] = T(!1), [r, a] = T(null), i = de(!0), s = de(!1);
  return pe(() => (i.current = !0, () => {
    i.current = !1;
  }), []), { pending: t, failure: r, run: async (l) => {
    if (s.current) return !1;
    s.current = !0, n(!0), a(null);
    try {
      return await we(l()), i.current && e(), !0;
    } catch (c) {
      if (i.current) {
        const d = xe(c);
        d.status === 409 && (d.message += " Refresh to review the current file, then retry your change."), (d.message.includes("timed out") || !d.status) && (d.message += " The result may be unknown; refresh and check the file before retrying."), a(d);
      }
      return !1;
    } finally {
      s.current = !1, i.current && n(!1);
    }
  } };
}
function Ia(e) {
  var le, ce, oe, fe, be, Y;
  const { api: t, workspace: n, active: r } = e, a = n.id, i = jn(), { data: s, failure: o, busy: l, refresh: c, reload: d } = Kn(
    t,
    r,
    String(a),
    a,
    () => da(t, a),
    () => Wt(t, { workspaceId: a, manual: !0 }),
    (S, X) => ({ ...S, index: X[String(a)] ?? S.index })
  ), p = Ht(d), f = (s == null ? void 0 : s.workspace.columns) ?? n.columns, g = He(() => pa(f, (s == null ? void 0 : s.tickets) ?? []), [f, s]), h = g.repair.length > 0 ? [...f, Jn] : f, w = de(null), x = de(null), [v, b] = T(null), _ = de(null);
  pe(() => {
    var S;
    v && ((S = _.current) == null || S.focus());
  }, [v]);
  const [y, R] = T(!1), k = !r || !!o || l || p.pending || y || !!Se(s == null ? void 0 : s.index), [F, z] = T(""), A = ((le = f.find((S) => S.id === F)) == null ? void 0 : le.id) ?? ((ce = s == null ? void 0 : s.index.maintenance) == null ? void 0 : ce[0]) ?? f[0].id, [O, j] = T(!1), [B, J] = T(!1), [H, ie] = T(!1), E = s ? [s.index] : [], C = Mt((S) => {
    z(S), ie(!0);
  }, []), [D, P] = T(null);
  pe(() => {
    var X;
    if (!D || k || !s) return;
    const S = Array.from(((X = w.current) == null ? void 0 : X.querySelectorAll("[data-note-path]")) ?? []).find((ue) => ue.dataset.notePath === D);
    S == null || S.focus(), P(null);
  }, [D, k, s]);
  const W = (S, X, ue) => {
    var K;
    k || Se(s == null ? void 0 : s.index, S) || !s || (K = s.index.maintenance) != null && K.includes(X) || p.run(() => za(t, a, Ea(s.tickets, S, X, ue))).then(($) => {
      $ && P(S.path);
    });
  }, L = (S, X, ue) => {
    S.preventDefault(), S.stopPropagation();
    const K = x.current;
    if (x.current = null, !K || (ue == null ? void 0 : ue.path) === K.path) return;
    const $ = g[X].filter((te) => te.path !== K.path), V = ue ? $.findIndex((te) => te.path === ue.path) : void 0;
    V !== void 0 && V < 0 || W(K, X, V);
  }, ee = (S) => {
    var Re, Me;
    const X = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"], ue = S.target;
    if (!ue.hasAttribute("data-lane")) return;
    const K = Number(ue.dataset.lane), $ = Number(ue.dataset.index);
    if (!X.includes(S.key) || Number.isNaN(K) || Number.isNaN($)) return;
    let V = K, te = $;
    if (S.key === "ArrowUp" && (te = Math.max(0, $ - 1)), S.key === "ArrowDown" && (te = $ + 1), S.key === "Home" && (te = 0), S.key === "End" && (te = Number.MAX_SAFE_INTEGER), S.key === "ArrowLeft" || S.key === "ArrowRight") {
      const U = S.key === "ArrowLeft" ? -1 : 1;
      do
        V += U;
      while (V >= 0 && V < h.length && g[h[V].id].length === 0);
      if (V < 0 || V >= h.length) return;
    }
    te = Math.min(te, g[h[V].id].length - 1), S.preventDefault(), (Me = (Re = w.current) == null ? void 0 : Re.querySelector(`[data-lane="${V}"][data-index="${te}"]`)) == null || Me.focus();
  };
  return /* @__PURE__ */ m("div", { className: "qz-stack", children: [
    /* @__PURE__ */ m("div", { className: "qz-toolbar", children: [
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ m(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "primary",
            "aria-expanded": v === "create",
            onClick: () => b(v === "create" ? null : "create"),
            disabled: p.pending || y,
            children: [
              /* @__PURE__ */ u(Q, { name: "plus" }),
              "New ticket"
            ]
          }
        ),
        /* @__PURE__ */ m(
          "button",
          {
            type: "button",
            className: "qz-button",
            "aria-expanded": v === "promote",
            onClick: () => b(v === "promote" ? null : "promote"),
            disabled: p.pending || y,
            children: [
              /* @__PURE__ */ u(Q, { name: "note" }),
              "Use existing note"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ u("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: e.onSettings, children: "Customize columns" }),
        /* @__PURE__ */ u(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            "aria-expanded": H,
            onClick: () => ie((S) => !S),
            disabled: k,
            children: "Rebalance…"
          }
        ),
        /* @__PURE__ */ m("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => i(Wn), children: [
          /* @__PURE__ */ u(Q, { name: "external" }),
          "Open Kiro Notes"
        ] })
      ] })
    ] }),
    ["create", "promote"].map((S) => /* @__PURE__ */ u("div", { hidden: v !== S, children: /* @__PURE__ */ u(Ba, { mode: S, api: t, workspace: n, columns: f, firstField: v === S ? _ : void 0, disabled: !r || !!o || l || p.pending || !!Se(s == null ? void 0 : s.index), maintenance: (s == null ? void 0 : s.index.maintenance) ?? [], onBusy: R, onChanged: d, onClose: () => b(null), onMaintenanceNeeded: C }) }, S)),
    /* @__PURE__ */ m("div", { className: "qz-toolbar qz-board-meta", children: [
      s && /* @__PURE__ */ m("span", { className: "qz-result-count", children: [
        s.tickets.length,
        " ",
        s.tickets.length === 1 ? "ticket" : "tickets"
      ] }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ u(Gn, { statuses: E }),
        /* @__PURE__ */ m("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => void c(), disabled: l || p.pending, children: [
          /* @__PURE__ */ u(Q, { name: "refresh" }),
          "Refresh"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ u(Yn, { statuses: E }),
    /* @__PURE__ */ u(he, { failure: o }),
    /* @__PURE__ */ u(he, { failure: p.failure }),
    Se(s == null ? void 0 : s.index) && s && /* @__PURE__ */ u("div", { role: "note", className: "qz-notice", children: Se(s.index) }),
    H || ((oe = p.failure) == null ? void 0 : oe.code) === "rank_exhausted" || ((fe = p.failure) == null ? void 0 : fe.code) === "maintenance_pending" || (be = s == null ? void 0 : s.index.maintenance) != null && be.length ? /* @__PURE__ */ m("div", { className: "qz-notice qz-stack", children: [
      /* @__PURE__ */ u("p", { children: "Rebalance a column to restore space between card positions. Progress is saved if interrupted." }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ u("select", { className: "qz-input", "aria-label": "Column to rebalance", value: A, onChange: (S) => z(S.target.value), children: f.map((S) => /* @__PURE__ */ u("option", { value: S.id, children: S.label }, S.id)) }),
        /* @__PURE__ */ u("button", { type: "button", className: "qz-button", onClick: () => j(!0), disabled: !r || p.pending || !!(s != null && s.index.writeBlocked), children: "Review column…" })
      ] }),
      O && /* @__PURE__ */ m("div", { className: "qz-stack", role: "alertdialog", "aria-label": "Rebalance column", children: [
        /* @__PURE__ */ u("p", { children: "Update ordering in each note of this column? Other editors may see progress before all files finish." }),
        !!((Y = s == null ? void 0 : s.index.maintenance) != null && Y.includes(A)) && /* @__PURE__ */ m("label", { className: "qz-check-label", children: [
          /* @__PURE__ */ u("input", { type: "checkbox", checked: B, onChange: (S) => J(S.target.checked), disabled: p.pending }),
          "Keep the latest note contents and resume ordering after an external edit"
        ] }),
        /* @__PURE__ */ m("div", { className: "qz-actions", children: [
          /* @__PURE__ */ u("button", { type: "button", className: "qz-button", disabled: !r || p.pending || !!(s != null && s.index.writeBlocked), onClick: () => void p.run(() => Ra(t, a, A, B)).then((S) => {
            S && (j(!1), J(!1));
          }), children: "Rebalance column" }),
          /* @__PURE__ */ u("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: p.pending, onClick: () => j(!1), children: "Cancel" })
        ] })
      ] })
    ] }) : null,
    !s && !o && /* @__PURE__ */ u("p", { className: "qz-empty", role: "status", children: "Loading the board…" }),
    s && s.tickets.length === 0 && s.index.state !== "scanning" && /* @__PURE__ */ m("p", { className: "qz-notice", "data-variant": "neutral", children: [
      "No tickets in “",
      n.name,
      "” yet. Create a ticket or use an existing note."
    ] }),
    s && /* @__PURE__ */ u("div", { ref: w, className: "qz-board", tabIndex: 0, onKeyDown: ee, "aria-label": `Board of ${n.name}`, role: "group", children: h.map(({ id: S, label: X }, ue) => /* @__PURE__ */ m(
      "section",
      {
        "aria-label": X,
        className: "qz-lane",
        "data-lane-status": S,
        onDragOver: (K) => {
          !k && S !== "repair" && K.preventDefault();
        },
        onDrop: (K) => {
          S !== "repair" && L(K, S);
        },
        children: [
          /* @__PURE__ */ m("h3", { className: "qz-lane-heading", children: [
            /* @__PURE__ */ u("span", { className: "qz-dot" }),
            X,
            /* @__PURE__ */ u("span", { className: "qz-count", children: g[S].length })
          ] }),
          g[S].length === 0 && /* @__PURE__ */ u("p", { className: "qz-lane-empty", children: "No tickets" }),
          /* @__PURE__ */ u("ul", { className: "qz-cards", children: g[S].map((K, $) => /* @__PURE__ */ u(
            "li",
            {
              draggable: !k && !Se(s.index, K),
              onDragStart: (V) => {
                x.current = K, V.dataTransfer.setData("text/plain", K.path), V.dataTransfer.effectAllowed = "move";
              },
              onDragEnd: () => {
                x.current = null;
              },
              onDragOver: (V) => {
                !k && S !== "repair" && V.preventDefault();
              },
              onDrop: (V) => {
                S !== "repair" && L(V, S, K);
              },
              children: /* @__PURE__ */ u(
                Oa,
                {
                  ticket: K,
                  lane: ue,
                  index: $,
                  columns: f,
                  onOpen: () => e.onOpenNote({ workspaceId: a, path: K.path }),
                  disabled: k || !!Se(s.index, K),
                  maintenance: s.index.maintenance ?? [],
                  onMove: (V, te) => W(K, V, te),
                  onDemote: () => {
                    window.confirm(`Remove “${K.title}” from the board? Its note and TODOs will remain.`) && p.run(() => Na(t, a, K));
                  },
                  count: g[S].length
                }
              )
            },
            K.path
          )) })
        ]
      },
      S
    )) })
  ] });
}
function Ba(e) {
  const [t, n] = T(""), [r, a] = T(""), [i, s] = T(""), [o, l] = T(""), c = (e.columns.find((B) => B.id === o) ?? e.columns[0]).id, [d, p] = T(null), [f, g] = T(null), [h, w] = T(!1), x = de(0), v = de(!0);
  pe(() => (v.current = !0, () => {
    v.current = !1, x.current++;
  }), []);
  const b = Ht(e.onChanged);
  pe(() => (e.onBusy(b.pending), () => e.onBusy(!1)), [b.pending, e.onBusy]);
  const _ = e.disabled || b.pending || h, y = e.maintenance.includes(c);
  pe(() => {
    var B, J;
    (((B = b.failure) == null ? void 0 : B.code) === "rank_exhausted" || ((J = b.failure) == null ? void 0 : J.code) === "maintenance_pending") && e.onMaintenanceNeeded(c);
  }, [b.failure, e.onMaintenanceNeeded, c]);
  const R = () => {
    x.current++, w(!1), n(""), a(""), s(""), p(null), g(null), e.onClose();
  }, k = t.trim().endsWith(".md") ? t.trim() : `${t.trim()}.md`, F = async () => {
    const B = ++x.current;
    w(!0), g(null), p(null);
    try {
      const J = await we(It(e.api, e.workspace.id, k));
      v.current && B === x.current && p(J);
    } catch (J) {
      v.current && B === x.current && g(xe(J));
    } finally {
      v.current && B === x.current && w(!1);
    }
  }, z = async () => {
    await b.run(() => e.mode === "create" ? xa(e.api, e.workspace.id, { path: k, title: r.trim(), body: i, status: c }) : wa(e.api, e.workspace.id, d, c)) && v.current && (n(""), a(""), s(""), p(null), e.onClose());
  }, A = e.mode === "create", O = A ? "New ticket" : "Use existing note", j = !_ && !y && !!t.trim() && (A ? !!r.trim() : !!d);
  return /* @__PURE__ */ m("section", { className: "qz-panel-surface qz-ticket-form", "aria-label": O, children: [
    /* @__PURE__ */ u("h3", { children: O }),
    /* @__PURE__ */ m("form", { className: "qz-stack", onSubmit: (B) => {
      B.preventDefault(), j && z();
    }, children: [
      A && /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Title",
        /* @__PURE__ */ u("input", { className: "qz-input", ref: e.firstField, "aria-label": "Ticket title", placeholder: "Fix login", value: r, disabled: b.pending, onChange: (B) => a(B.target.value) })
      ] }),
      /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Note path in ",
        e.workspace.name,
        /* @__PURE__ */ u(
          "input",
          {
            className: "qz-input",
            ref: A ? void 0 : e.firstField,
            "aria-label": "Ticket note path",
            placeholder: "tickets/fix-login.md",
            value: t,
            disabled: b.pending,
            onChange: (B) => {
              x.current++, w(!1), n(B.target.value), p(null);
            }
          }
        )
      ] }),
      A ? /* @__PURE__ */ m("label", { className: "qz-field", children: [
        /* @__PURE__ */ m("span", { children: [
          "Description ",
          /* @__PURE__ */ u("span", { className: "qz-muted", children: "· Optional Markdown" })
        ] }),
        /* @__PURE__ */ u("textarea", { className: "qz-input", "aria-label": "Ticket description", placeholder: "What needs to happen?", value: i, disabled: b.pending, onChange: (B) => s(B.target.value), rows: 4 })
      ] }) : /* @__PURE__ */ m(ye, { children: [
        /* @__PURE__ */ u("div", { className: "qz-actions", children: /* @__PURE__ */ u("button", { type: "button", className: "qz-button", disabled: _ || !t.trim(), onClick: () => void F(), children: "Preview note" }) }),
        d && /* @__PURE__ */ m(ye, { children: [
          /* @__PURE__ */ u("pre", { className: "qz-mono qz-note-preview", children: d.content }),
          /* @__PURE__ */ u("p", { className: "qz-muted", children: "The note’s content and existing properties are preserved." })
        ] })
      ] }),
      (A || d) && /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Initial status",
        /* @__PURE__ */ u("select", { className: "qz-input", value: c, disabled: b.pending, onChange: (B) => l(B.target.value), children: e.columns.map((B) => /* @__PURE__ */ u("option", { value: B.id, children: B.label }, B.id)) })
      ] }),
      y && /* @__PURE__ */ u("span", { className: "qz-notice", children: "Resume ordering maintenance for this column before adding a ticket." }),
      /* @__PURE__ */ u(he, { failure: f }),
      /* @__PURE__ */ u(he, { failure: b.failure }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ u("button", { type: "submit", className: "qz-button", "data-variant": "primary", disabled: !j, children: A ? "Create ticket" : "Make ticket" }),
        /* @__PURE__ */ u("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: b.pending, onClick: R, children: "Cancel" })
      ] })
    ] })
  ] });
}
function Oa(e) {
  const { ticket: t } = e, n = t.lane === "repair" ? "" : t.lane;
  return /* @__PURE__ */ m("article", { className: "qz-ticket", children: [
    /* @__PURE__ */ m("div", { className: "qz-ticket-content", children: [
      /* @__PURE__ */ m("button", { type: "button", className: "qz-note-link", "data-lane": e.lane, "data-index": e.index, "data-note-path": t.path, "aria-label": `Open note: ${t.title}`, onClick: e.onOpen, children: [
        t.title,
        /* @__PURE__ */ u(Q, { name: "external" })
      ] }),
      /* @__PURE__ */ u("span", { className: "qz-mono qz-path", title: t.path, children: t.path }),
      t.todos.total > 0 && /* @__PURE__ */ m("div", { className: "qz-ticket-progress", children: [
        /* @__PURE__ */ u("progress", { value: t.todos.done, max: t.todos.total, "aria-label": `Checklist progress for ${t.title}` }),
        /* @__PURE__ */ m("span", { title: "Completed TODOs", children: [
          t.todos.done,
          "/",
          t.todos.total
        ] })
      ] }),
      t.diagnostics.length > 0 && /* @__PURE__ */ u("div", { className: "qz-actions", children: t.diagnostics.map((r) => /* @__PURE__ */ u("span", { className: "qz-badge", title: r.message, children: r.code.replace(/_/g, " ") }, r.code)) })
    ] }),
    /* @__PURE__ */ m("div", { className: "qz-ticket-footer", children: [
      /* @__PURE__ */ u("div", { className: "qz-ticket-status", children: /* @__PURE__ */ m(
        "select",
        {
          className: "qz-input",
          "aria-label": `Move ${t.title} to column`,
          title: "Move to column",
          value: n,
          disabled: e.disabled,
          onChange: (r) => e.onMove(r.target.value),
          children: [
            !n && /* @__PURE__ */ u("option", { value: "", disabled: !0, children: t.status ? `No column for ${t.status}` : "Needs repair" }),
            e.columns.map((r) => /* @__PURE__ */ u("option", { value: r.id, disabled: e.maintenance.includes(r.id), children: r.label }, r.id))
          ]
        }
      ) }),
      /* @__PURE__ */ m("details", { className: "qz-ticket-actions", children: [
        /* @__PURE__ */ u("summary", { className: "qz-button qz-icon-button", "data-variant": "quiet", "aria-label": `Actions for ${t.title}`, title: "Ticket actions", children: /* @__PURE__ */ u(Q, { name: "more" }) }),
        /* @__PURE__ */ m("div", { className: "qz-ticket-action-list", children: [
          /* @__PURE__ */ u(Xn, { path: t.path }),
          /* @__PURE__ */ m("button", { type: "button", className: "qz-button", "data-variant": "quiet", "aria-label": `Move ${t.title} up`, disabled: e.disabled || e.index === 0 || !n, onClick: () => e.onMove(n, e.index - 1), children: [
            /* @__PURE__ */ u(Q, { name: "up" }),
            "Move up"
          ] }),
          /* @__PURE__ */ m("button", { type: "button", className: "qz-button", "data-variant": "quiet", "aria-label": `Move ${t.title} down`, disabled: e.disabled || e.index >= e.count - 1 || !n, onClick: () => e.onMove(n, e.index + 1), children: [
            /* @__PURE__ */ u(Q, { name: "down" }),
            "Move down"
          ] }),
          /* @__PURE__ */ m("button", { type: "button", className: "qz-button qz-destructive", "data-variant": "quiet", "aria-label": `Remove ${t.title} from board`, disabled: e.disabled, onClick: e.onDemote, children: [
            /* @__PURE__ */ u(Q, { name: "minus" }),
            "Remove ticket…"
          ] })
        ] })
      ] })
    ] })
  ] });
}
function La(e) {
  const { api: t } = e, n = jn(), { companions: r, failure: a } = Hn(t), [i, s] = T("all"), [o, l] = T("open"), [c, d] = T(""), p = de(null);
  pe(() => {
    r && i !== "all" && !r.some((z) => z.workspace.id === i) && s("all");
  }, [r, i]);
  const f = i === "all" ? void 0 : i, g = !!r && r.length > 0, { data: h, failure: w, busy: x, refresh: v, reload: b } = Kn(
    t,
    g,
    `${i}:${o}`,
    f,
    () => ha(t, o, f),
    () => Wt(t, { workspaceId: f, manual: !0 }),
    (z, A) => ({ ...z, index: A })
  ), _ = He(() => ma((h == null ? void 0 : h.groups) ?? [], c), [h, c]), y = _.reduce((z, A) => z + A.items.length, 0), R = h ? Object.values(h.index) : [], k = Ht(b), F = (z, A, O) => {
    k.pending || w || x || Se(h == null ? void 0 : h.index[String(z.workspaceId)], z) || A.markerStart === void 0 || k.run(() => ya(t, z, A, O));
  };
  return a ? /* @__PURE__ */ u(he, { failure: a }) : r ? r.length === 0 ? /* @__PURE__ */ u(Vn, { onSettings: e.onSettings }) : /* @__PURE__ */ m("div", { className: "qz-stack qz-todos", children: [
    /* @__PURE__ */ m("div", { className: "qz-view-heading", children: [
      /* @__PURE__ */ m("div", { children: [
        /* @__PURE__ */ u("h2", { className: "qz-section-title", children: "Note checklists" }),
        /* @__PURE__ */ u("p", { className: "qz-section-description", children: "Find and complete Markdown TODOs across your shared folders." })
      ] }),
      /* @__PURE__ */ m("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => n(Wn), children: [
        /* @__PURE__ */ u(Q, { name: "external" }),
        "Open Kiro Notes"
      ] })
    ] }),
    /* @__PURE__ */ m("div", { className: "qz-todo-filters qz-panel-surface", children: [
      /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Search",
        /* @__PURE__ */ m("span", { className: "qz-search", children: [
          /* @__PURE__ */ u(Q, { name: "search" }),
          /* @__PURE__ */ u("input", { className: "qz-input", ref: p, type: "search", "aria-label": "Filter TODOs", placeholder: "Search tasks or notes…", value: c, onChange: (z) => d(z.target.value) })
        ] })
      ] }),
      r.length > 1 && /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Workspace",
        /* @__PURE__ */ m("select", { className: "qz-input", value: i, onChange: (z) => s(z.target.value === "all" ? "all" : Number(z.target.value)), children: [
          /* @__PURE__ */ u("option", { value: "all", children: "All workspaces" }),
          r.map((z) => /* @__PURE__ */ u("option", { value: z.workspace.id, children: z.workspace.name }, z.workspace.id))
        ] })
      ] }),
      /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Show",
        /* @__PURE__ */ m("select", { className: "qz-input", value: o, onChange: (z) => l(z.target.value), children: [
          /* @__PURE__ */ u("option", { value: "open", children: "Open" }),
          /* @__PURE__ */ u("option", { value: "done", children: "Completed" }),
          /* @__PURE__ */ u("option", { value: "all", children: "All" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ m("div", { className: "qz-toolbar qz-board-meta", children: [
      h && /* @__PURE__ */ m("span", { className: "qz-result-count", role: "status", children: [
        y,
        " ",
        y === 1 ? "item" : "items",
        " in ",
        _.length,
        " ",
        _.length === 1 ? "note" : "notes"
      ] }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ u(Gn, { statuses: R }),
        /* @__PURE__ */ m("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => void v(), disabled: x || k.pending, children: [
          /* @__PURE__ */ u(Q, { name: "refresh" }),
          "Refresh"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ u(Yn, { statuses: R }),
    /* @__PURE__ */ u(he, { failure: w }),
    /* @__PURE__ */ u(he, { failure: k.failure }),
    (h == null ? void 0 : h.truncated) && /* @__PURE__ */ u("div", { role: "note", className: "qz-notice", children: "Only the first items are listed. Narrow the list by workspace or completion status." }),
    !h && !w && /* @__PURE__ */ u("p", { className: "qz-empty", role: "status", children: "Loading TODOs…" }),
    h && _.length === 0 && /* @__PURE__ */ m("div", { className: "qz-empty", children: [
      /* @__PURE__ */ u("span", { className: "qz-empty-icon", children: /* @__PURE__ */ u(Q, { name: c.trim() ? "search" : "checklist" }) }),
      /* @__PURE__ */ u("h3", { children: c.trim() ? "No matching TODOs" : "No TODOs to show" }),
      /* @__PURE__ */ u("p", { children: c.trim() ? "Try a different search or clear the filter." : "Choose a different workspace or completion status to see more." }),
      c.trim() && /* @__PURE__ */ u("button", { type: "button", className: "qz-button", onClick: () => {
        var z;
        d(""), (z = p.current) == null || z.focus();
      }, children: "Clear search" })
    ] }),
    /* @__PURE__ */ u("div", { className: "qz-stack", children: _.map((z) => /* @__PURE__ */ m("section", { "aria-label": z.title, className: "qz-todo-note qz-panel-surface", children: [
      /* @__PURE__ */ m("header", { className: "qz-todo-header", children: [
        /* @__PURE__ */ u("span", { className: "qz-note-icon", children: /* @__PURE__ */ u(Q, { name: "note" }) }),
        /* @__PURE__ */ m("div", { className: "qz-todo-identity", children: [
          /* @__PURE__ */ m("h3", { children: [
            z.title,
            z.ticket && z.status && /* @__PURE__ */ m("span", { className: "qz-status-pill", "data-lane-status": z.status, children: [
              /* @__PURE__ */ u("span", { className: "qz-dot" }),
              z.statusLabel ?? z.status
            ] })
          ] }),
          /* @__PURE__ */ m("p", { className: "qz-todo-meta", children: [
            /* @__PURE__ */ u("span", { children: z.workspace }),
            /* @__PURE__ */ u("span", { "aria-hidden": "true", children: "/" }),
            /* @__PURE__ */ u("span", { className: "qz-mono qz-path", title: z.path, children: z.path })
          ] })
        ] }),
        /* @__PURE__ */ u(Xn, { path: z.path, compact: !0 })
      ] }),
      /* @__PURE__ */ u("ul", { className: "qz-todo-list", children: z.items.map((A) => /* @__PURE__ */ m("li", { className: "qz-todo-row", "data-checked": A.checked, style: { paddingInlineStart: `${Math.min(A.depth, 4) * 0.8}rem` }, children: [
        /* @__PURE__ */ m("label", { className: "qz-todo-check", children: [
          /* @__PURE__ */ u(
            "input",
            {
              type: "checkbox",
              "aria-label": `Complete ${yt(A.text)}`,
              checked: A.checked,
              disabled: k.pending || !!w || x || !!Se(h == null ? void 0 : h.index[String(z.workspaceId)], z) || A.markerStart === void 0,
              onChange: (O) => F(z, A, O.target.checked)
            }
          ),
          /* @__PURE__ */ u("span", { children: yt(A.text) })
        ] }),
        /* @__PURE__ */ u(
          "button",
          {
            type: "button",
            title: `Open note · ${z.path}:${A.line}:${A.column}${A.heading ? ` · ${A.heading}` : ""}`,
            "aria-label": `Open note: ${yt(A.text)}`,
            onClick: () => e.onOpenNote({ workspaceId: z.workspaceId, path: z.path }),
            className: "qz-button qz-icon-button",
            "data-variant": "quiet",
            children: /* @__PURE__ */ u(Q, { name: "external" })
          }
        )
      ] }, A.ordinal)) })
    ] }, `${z.workspaceId}:${z.path}`)) })
  ] }) : /* @__PURE__ */ u("p", { className: "qz-empty", role: "status", children: "Loading workspaces…" });
}
/*! markdown-it 15.0.3 https://github.com/markdown-it/markdown-it @license MIT */
var nn = Object.defineProperty, kt = (e, t) => {
  let n = {};
  for (var r in e) nn(n, r, {
    get: e[r],
    enumerable: !0
  });
  return nn(n, Symbol.toStringTag, { value: "Module" }), n;
}, rn = {};
function $a(e) {
  let t = rn[e];
  if (t) return t;
  t = rn[e] = [];
  for (let n = 0; n < 128; n++) {
    let r = String.fromCharCode(n);
    t.push(r);
  }
  for (let n = 0; n < e.length; n++) {
    let r = e.charCodeAt(n);
    t[r] = "%" + ("0" + r.toString(16).toUpperCase()).slice(-2);
  }
  return t;
}
function Ke(e, t) {
  typeof t != "string" && (t = Ke.defaultChars);
  let n = $a(t);
  return e.replace(/(%[a-f0-9]{2})+/gi, function(r) {
    let a = "";
    for (let i = 0, s = r.length; i < s; i += 3) {
      let o = parseInt(r.slice(i + 1, i + 3), 16);
      if (o < 128) a += n[o];
      else {
        if ((o & 224) == 192 && i + 3 < s) {
          let l = parseInt(r.slice(i + 4, i + 6), 16);
          if ((l & 192) == 128) {
            let c = o << 6 & 1984 | l & 63;
            a += c < 128 ? "��" : String.fromCharCode(c), i += 3;
            continue;
          }
        }
        if ((o & 240) == 224 && i + 6 < s) {
          let l = parseInt(r.slice(i + 4, i + 6), 16), c = parseInt(r.slice(i + 7, i + 9), 16);
          if ((l & 192) == 128 && (c & 192) == 128) {
            let d = o << 12 & 61440 | l << 6 & 4032 | c & 63;
            a += d < 2048 || d >= 55296 && d <= 57343 ? "���" : String.fromCharCode(d), i += 6;
            continue;
          }
        }
        if ((o & 248) == 240 && i + 9 < s) {
          let l = parseInt(r.slice(i + 4, i + 6), 16), c = parseInt(r.slice(i + 7, i + 9), 16), d = parseInt(r.slice(i + 10, i + 12), 16);
          if ((l & 192) == 128 && (c & 192) == 128 && (d & 192) == 128) {
            let p = o << 18 & 1835008 | l << 12 & 258048 | c << 6 & 4032 | d & 63;
            p < 65536 || p > 1114111 ? a += "����" : (p -= 65536, a += String.fromCharCode(55296 + (p >> 10), 56320 + (p & 1023))), i += 9;
            continue;
          }
        }
        a += "�";
      }
    }
    return a;
  });
}
Ke.defaultChars = ";/?:@&=+$,#", Ke.componentChars = "";
var an = {};
function Ua(e) {
  let t = an[e];
  if (t) return t;
  t = an[e] = [];
  for (let n = 0; n < 128; n++) {
    let r = String.fromCharCode(n);
    /^[0-9a-z]$/i.test(r) ? t.push(r) : t.push("%" + ("0" + n.toString(16).toUpperCase()).slice(-2));
  }
  for (let n = 0; n < e.length; n++) t[e.charCodeAt(n)] = e[n];
  return t;
}
function Te(e, t, n) {
  typeof t != "string" && (n = t, t = Te.defaultChars), n === void 0 && (n = !0);
  let r = Ua(t), a = "";
  for (let i = 0, s = e.length; i < s; i++) {
    let o = e.charCodeAt(i);
    if (n && o === 37 && i + 2 < s && /^[0-9a-f]{2}$/i.test(e.slice(i + 1, i + 3))) a += e.slice(i, i + 3), i += 2;
    else if (o < 128) a += r[o];
    else if (o >= 55296 && o <= 57343) {
      if (o >= 55296 && o <= 56319 && i + 1 < s) {
        let l = e.charCodeAt(i + 1);
        if (l >= 56320 && l <= 57343) {
          a += encodeURIComponent(e[i] + e[i + 1]), i++;
          continue;
        }
      }
      a += "%EF%BF%BD";
    } else a += encodeURIComponent(e[i]);
  }
  return a;
}
Te.defaultChars = ";/?:@&=+$,-_.!~*'()#", Te.componentChars = "-_.!~*'()";
function Bt(e) {
  let t = "";
  return t += e.protocol || "", t += e.slashes ? "//" : "", t += e.auth ? e.auth + "@" : "", e.hostname && e.hostname.indexOf(":") !== -1 ? t += "[" + e.hostname + "]" : t += e.hostname || "", t += e.port ? ":" + e.port : "", t += e.pathname || "", t += e.search || "", t += e.hash || "", t;
}
function pt() {
  this.protocol = null, this.slashes = null, this.auth = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.pathname = null;
}
var Pa = /^([a-z0-9.+-]+:)/i, ja = /:[0-9]*$/, Ja = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/, sn = [
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
], on = [
  "/",
  "?",
  "#"
], Wa = 255, ln = /^[+a-z0-9A-Z_-]{0,63}$/, Za = /^([+a-z0-9A-Z_-]{0,63})(.*)$/, cn = {
  javascript: !0,
  "javascript:": !0
}, un = {
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
function Ot(e, t) {
  if (e && e instanceof pt) return e;
  let n = new pt();
  return n.parse(e, t), n;
}
pt.prototype.parse = function(e, t) {
  let n, r, a, i = e;
  if (i = i.trim(), !t && e.split("#").length === 1) {
    let c = Ja.exec(i);
    if (c) return this.pathname = c[1], c[2] && (this.search = c[2]), this;
  }
  let s = Pa.exec(i);
  if (s && (s = s[0], n = s.toLowerCase(), this.protocol = s, i = i.substr(s.length)), (t || s || i.match(/^\/\/[^@\/]+@[^@\/]+/)) && (a = i.substr(0, 2) === "//", a && !(s && cn[s]) && (i = i.substr(2), this.slashes = !0)), !cn[s] && (a || s && !un[s])) {
    let c = -1;
    for (let h = 0; h < on.length; h++) r = i.indexOf(on[h]), r !== -1 && (c === -1 || r < c) && (c = r);
    let d, p;
    p = c === -1 ? i.lastIndexOf("@") : i.lastIndexOf("@", c), p !== -1 && (d = i.slice(0, p), i = i.slice(p + 1), this.auth = d), c = -1;
    for (let h = 0; h < sn.length; h++) r = i.indexOf(sn[h]), r !== -1 && (c === -1 || r < c) && (c = r);
    c === -1 && (c = i.length), i[c - 1] === ":" && c--;
    let f = i.slice(0, c);
    i = i.slice(c), this.parseHost(f), this.hostname = this.hostname || "";
    let g = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
    if (!g) {
      let h = this.hostname.split(/\./);
      for (let w = 0, x = h.length; w < x; w++) {
        let v = h[w];
        if (v && !v.match(ln)) {
          let b = "";
          for (let _ = 0, y = v.length; _ < y; _++) v.charCodeAt(_) > 127 ? b += "x" : b += v[_];
          if (!b.match(ln)) {
            let _ = h.slice(0, w), y = h.slice(w + 1), R = v.match(Za);
            R && (_.push(R[1]), y.unshift(R[2])), y.length && (i = y.join(".") + i), this.hostname = _.join(".");
            break;
          }
        }
      }
    }
    this.hostname.length > Wa && (this.hostname = ""), g && (this.hostname = this.hostname.substr(1, this.hostname.length - 2));
  }
  let o = i.indexOf("#");
  o !== -1 && (this.hash = i.substr(o), i = i.slice(0, o));
  let l = i.indexOf("?");
  return l !== -1 && (this.search = i.substr(l), i = i.slice(0, l)), i && (this.pathname = i), un[n] && this.hostname && !this.pathname && (this.pathname = ""), this;
}, pt.prototype.parseHost = function(e) {
  let t = ja.exec(e);
  t && (t = t[0], t !== ":" && (this.port = t.substr(1)), e = e.substr(0, e.length - t.length)), e && (this.hostname = e);
};
var Ha = /* @__PURE__ */ kt({
  decode: () => Ke,
  encode: () => Te,
  format: () => Bt,
  parse: () => Ot
}), Ka = /* @__PURE__ */ kt({
  Any: () => Qn,
  Cc: () => er,
  Cf: () => Ga,
  P: () => Kt,
  S: () => tr,
  Z: () => nr
}), Qn = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, er = /[\0-\x1F\x7F-\x9F]/, Ga = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/, Kt = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B4E\u1B4F\u1B5A-\u1B60\u1B7D-\u1B7F\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDD6E\uDEAD\uDED0\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9\uDFD4\uDFD5\uDFD7\uDFD8]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09\uDFE1]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDD6D-\uDD6F\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD839\uDDFF|\uD83A[\uDD5E\uDD5F]/, tr = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C1\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2429\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E5\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD803[\uDD8E\uDD8F\uDED1-\uDED8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDC00-\uDCEF\uDCFA-\uDCFC\uDD00-\uDEB3\uDEBA-\uDED0\uDEE0-\uDEF0\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED8\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0-\uDCBB\uDCC0\uDCC1\uDCD0-\uDCD8\uDD00-\uDE57\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF-\uDEF8\uDF00-\uDF92\uDF94-\uDFEF\uDFFA]/, nr = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/, Ya = [
  8364,
  0,
  8218,
  402,
  8222,
  8230,
  8224,
  8225,
  710,
  8240,
  352,
  8249,
  338,
  0,
  381,
  0,
  0,
  8216,
  8217,
  8220,
  8221,
  8226,
  8211,
  8212,
  732,
  8482,
  353,
  8250,
  339,
  0,
  382,
  376
];
function Xa(e) {
  return e === 0 || e >= 55296 && e <= 57343 || e > 1114111;
}
function Va(e) {
  return Xa(e) ? 65533 : e >= 128 && e <= 159 && Ya[e - 128] || e;
}
function Qa(e) {
  return e - 1 >>> 0 < 127 || e - 160 >>> 0 < 55136 ? String.fromCharCode(e) : String.fromCodePoint(Va(e));
}
var ze = /* @__PURE__ */ (() => {
  let e = /* @__PURE__ */ new Uint8Array(127), t = 0;
  for (let n = 33; n <= 126; n++) n !== 34 && n !== 36 && n !== 92 && (e[n] = t++);
  return e;
})();
function ei(e, t, n, r, a, i) {
  let s = e.length, o = i * 90, l = 0, c = () => {
    let z = ze[e.charCodeAt(l++)];
    return z < i ? z : z * 91 - o + ze[e.charCodeAt(l++)];
  }, d = n - r, p = n + a, f = new Int32Array(p);
  f.fill(-1, r, i), f.fill(-1, i + d, p);
  let g = new Int32Array(p), h = new Int32Array(p);
  function w(z, A) {
    let O = 0, j = A, B = A + z;
    for (; j < B; ) {
      let J = ze[e.charCodeAt(l++)];
      if (J < 89) O += J, f[j++] = O;
      else if (J === 89) {
        let H = ze[e.charCodeAt(l++)] + 2;
        for (; H--; ) f[j++] = ++O;
      } else {
        let H = ze[e.charCodeAt(l++)];
        O += 89 + (H < 90 ? H * 91 + ze[e.charCodeAt(l++)] : ze[e.charCodeAt(l++)] * 8281 + ze[e.charCodeAt(l++)] * 91 + ze[e.charCodeAt(l++)]), f[j++] = O;
      }
    }
  }
  w(r, 0), w(d, i);
  let x = new Int32Array(a * 2), v = 0, b = 0;
  function _(z, A) {
    for (let O = 0; O < z; O++) {
      let j = A + O, B = c(), J = c();
      x[b * 2] = B, x[b * 2 + 1] = J, b += 1, g[j] = v;
      let H = (f[B] < 0 ? h[B] : 1) + (f[J] < 0 ? h[J] : 1);
      h[j] = H, v += H;
    }
  }
  _(a - i + r, i + d), _(i - r, r);
  let y = new Uint16Array(v), R = 0;
  for (let z = 0; z < b; z++) for (let A = 0; A < 2; A++) {
    let O = x[z * 2 + A], j = f[O];
    if (j < 0) {
      let B = g[O], J = B + h[O];
      for (; B < J; ) y[R++] = y[B++];
    } else y[R++] = j;
  }
  let k = new Uint16Array(t), F = 0;
  for (; l < s; ) {
    let z = ze[e.charCodeAt(l++)];
    z >= i && (z = z * 91 - o + ze[e.charCodeAt(l++)]);
    let A = f[z];
    if (A < 0) {
      let O = g[z], j = O + h[z];
      for (; O < j; ) k[F++] = y[O++];
    } else k[F++] = A;
  }
  return k;
}
var ti = /* @__PURE__ */ ei("!}.&u%}'&}*'~!6*)%&,~!J~!J~%L~y<~!R,~~%Lu~~#GD~~#|)1#%}^%}2%+#.##%##%}&%##%'#%##&%#%#'%#&#%#&#'#%%#&#%##%#)%''%&%#%#'%#%%#%%}%%%#%#&(23#%%#&-%0%('1#(##%#'##+%'*.:1}#%#6-+(%'%%#%%%}#L'2351&('%}&/N'(0(/*-%(%%}#'+&T%7.2}#&%&#%#36/5##%&%%#&#%%#))2%%##%&&'0~!#*+&'%1~!%).'3q?&%'1~!.##%6(~!+%%%(Gw'rT~!E#<nA%#jZ~!H%(~!42##~!*31&~!G%U~#)5~#`3~!J~!Z~%]~%Y~%C~!q~!u~#kz~%#~!6'~!D~!U~!?~#T~!c%~!G#'~%7|~!G~!J~!G&~#pb~(Df}#%}*&}#%##%##%##&#-}&'#'&%#.++}%mI,#,@&(}*%}*'%&##&#%##%}&0}#.},U},%}+%}&%}#%##&}B%(}(%}+%)})%##%#&}&%##%&}<%}>%#%&}*%}(%}9%}/%})%}*%}*%}?&}&%}3%}&*#%})%#%#)}#&#-#+*%E%%'%'#%}#*V##&##I}#&&##%&%#&&Qf%%))w/0+&%#(#.%-''''++++7}>%4'',##1,#%#&%##&#'##&#*#9)%&%}#*}%,#+P(%A&%#'&##wSD',9E00#y#@}(+}&%&>~!#~!X}#*}(&&}(&}(,%}%&#+&}#&}I%#%}%)#(},'%#*}4%%#%}(''}#/##(##),%-##%%)#&}(.}&%#&}%%}*&#%},&&}&%}#%*'#%})%}D&}&%}-&}6&#&}-,%}#%})-(~+`~,=?~I9'9%~!,#%})%})%}@%}?%}(~!?~#<~#pP~#BG~#=1#%K+~#?#~%;)~#A~#mF1~#A'~'X%'~#lR~#N~'N~#r~#m#-~#i'?%#'%~#B%##%,%#~#_%#0%~#]732~,w~2+#:&#%&'0%&>%}#>##F+)#%&&#(+_}4&}-%}(&}@&}O7Fdf0@+/v4}&WU##&/0#&'('B#%}.%}'+#%}#%%&#&%#%##+#&#)#6#'#.},%}c%},%#%##%&#&%#&~#>'*-.%##%##%}#%%}%'~#)D1}#%*&~#_%%'(~#S2%'.}#~#=##*'*-%}&'%'##&&~'E%.#&~#M4}%%##&'%#~#O1##%&#'+~#<B%##%%'%+~#;#@%}#&%#&&%#(~#H1}'%'##&&~#?A}&'~#D#%32}'&&&&~#[}'(#%}'~#;C})&}%%#%~#=&%,3}%'(#%%~#^'#&&)#%'~#Y%-~#d-%'~#^%%&#&&&}#~#b~2t*&'~&(~&@~0%~e~3}%*''0})&}+~!9##-}#%-hD*)1fC#%/&/fB#40~!+#)*4~!+~!K'&:~!/*7~!.#~!H~!L':~%x&~!H#~!*~%1~!I#~!+A~#p'~!F~~#-#~,,(~.Z~!V~%;'B'mq-W~!N~%I%#&&#&}#%},%%}'%}+X#%}#&}(%}'%}<%}#%}%%'}'%}:~![)9@~%>~#UA%-%##&~!C%~!-.9:~!1~!-^2/:a~!y,D*J#-5)/4~%23,~#G~!L1~!0X3`~!2+~!!0-~&E~!W~!o,>Y&]~%cZx_&~#O*9#A#'#+I'%#)~!0B*-5A+-((F&*M#)(-7-5+'-3a5Vi~!Y~!?+[)%3),ERHm~!+:D,VG.+)?fB%%*(%)'(#&80%1'8`K8?`+'Z#&O&'H5#*9)A%%5&3))0%39+.*7#()&&*=4@**L)<'_&*+..;(#*+)./&0#3)%')-8(4ixD(&.}%,('aI:,)%,k2231T)I'#/-W7,/'Q#.'Y24+h')37</31&83##&0#),H(?'&?/1##%#&&#%''-%&&&#(&''&#.-'%#%%(,')*'&#&#'##%(%(#%('#&##%%%%('%#%#%%#%#&%##h>w+v<ayvyvcg.uuhKr}g/v|g>u9i[~>g5uI~=RvdwEg;v/g;uk!!TTSx]@RT!U!#!@VBRUU!'UTe-d0c`e&gSdicedFcrdTaqb.kYcAohdYd@a3e+d}dMdtd.aJ#bqcK`dle/e.e'dwdPdodddjbEb}ogd^ofdpduc6j?l%d{drdqc)d7bacOdQ%T#Y)X.sR[yH>6Vyv3[xwLu>vo'!*.[yBacahoj>6Rew3[xqdZa#!a&#^(X-[yG>6Vyu3[xvg3sEr|g.u/Ri9db0T#^(Xa)!-[y;>6Vylg4wKs{JwNZt3@3r=c4Z([xlg;wKt!cpq's@v7A'*a(a+!-a#[y<3Dt?3Dt'>6Vym3[xmg9rxsNJwLZt4~?r?db1T#`-!(Xa,!0[yS>6Vz%NuQs.g4wKtnJwNZtS@3r>c4Z([y%g;wKtrdga8!a(!#&T*Y-Xa#!a0<or[yc3Dtq>6Vz43[y3JwNZtf@3s!Ju}!%Dti:pm3c_%X#tjB5pkd6q!r]u?voC'*-a.a2!0a&a+[yI3DtI3Ds~3DtH>6Vyw3[xx;:s#~<5pKJwNZtE@3r~d`a)!a2T#a.(!+U.X1[yT3Dt`3Dtv>6Vz&3[y&g9rxwzcxstPu.<rAJwLZtT~?r@dZa%!a.&^*Za(/Reu[ya>6Vz23[y1g3sEr}wkg{NuQRg{ci(U#5@b`~,cg#U(2WnH5wugcRh7dX#T(Y,a'Ta!!a,[yZ<]mj>6Vz,3[y+Pv#5ReZKu+=,%!H}7ABwkaS?Rh:BcW(X#<]mrj:ubv/ARekdg%!(!a.*Ta(Y.X1!#sP>Rl*Dt6[y>>6Vyo3Wf*jOvuumvuRgRJuq*!:9<B@bX~3jVv&v@s@5Re[d/rQt{uAvo&a&a*)a2!,0Wf!3Dt0=Bs'>6Re}3[xy~<5s%JwJZt1~Gs)c;&!#2sJkNuXvzq7rxu,Re8dka4!a8(aEZ+a@Y.X1Xa)[yd=Bs(3DtP>6Vz53[y4cX#X&Re:avRe9~<5s&JwJZtQ~Gs*i^rzvdRg+Jv{%!2sbB@bX}kdga,!Za?&^*T1/!a'Dt+[y6>6Vyf3Wf%g/u;s4hGu6?Rh-JvZ,!c%#&RoX54Rivj7uyvf8RgTKvZB%*!2sGh<vu5Rgq<=C::9bb~#dZ#T&Ta6Y.X*Dt>[y93Wf)coZ(T,6VyifluvRgC@95@B@bX~/hFu34cC#T,k/unq8w8Q5RkUklwQuzunq8w8Q5Rk8d/rJu?v8w9)-&!a0a;a&aIWejg3sEr/h1s<DtDJvyZqY5aws3Jvy!&Wei~Hr1:au5@Bag>23E~5c:Z&bX};kKv?w&unuVu5Rjc;>bs)#~@:Rh.=ay<a]C;b`}Vd6s/t{uAvoaxa()!a,a7%-a#a2Dt,[yF2Wo[>6Vyt3[xuNuPRi&NuPwpi#RoWh?vf8Ri%Jv]!%Ri:KvxD!.'2WeAjZu`q9rxu,Re7woeAg-unLq(qA_/*2Wg_g3u5q^9:4E}/jTrxrzv=Wkkd~0UX#^^Xa-a1a5T&a=U1a'*aEa]!a*aPaA-adok[y54Rn>;:p3~Dp5g9rpsFNvZqjg3uJp4~<5p0Pw;5qlJwNZt*@3p1Pw:5p/Ou!5p2JvG'!6Vye=<qnJvh_[xhg3v,Rh3kOwOw-sDuev/Re^dha[a%!%!a+#Ta7)-5TaCaO!aka!a)sf[yb2>Rl!9ARiq5E}Qg=ucRkBE|oJrJ_@Wk~@Wk{JrJ_@Wk|@WkyJrJ_@Wk}@WkzJvO_[y2g-vMRmiKuYC!)&>Ri;>Ri<@3RkNc](X#@9Rk=g5vuRmhKvDB!+'=]meg3u4Rmgd)#Y'Vz3CARmfd`a+!%T'!+#Ta1Ta6TaM-sTDt9[yA9sYd'%Y#s[[xpj:ueunaXRgEjRq,v-vuqdd2'`#6Rev<32@5>:2<E}5xIo9a*X#Y(;5RePJvD_g>vyRgNj8w)v8<wggs:RgXiZt|vjx,hSq3ah!-(~@:Ro/Ou!5RhWj^v(pyw8unRhUdx-UY#^Ua.a3a70!)%UX1TaDa)'omRiRRhE[y:3Dsz=Br,>6Vyj3[xkg6ruwjcqsrPw;5r*Ku]D'Zt-@3r(~?r.i[vwv]dU1a--U#`a4(g/vsRhPOu!5RhLj:rmu9Wo!~@:wdh@g/vsRiTjXuvvNr}:RhBj^v(pyw8unRn]dz1UYa'a+^Y(!aETZalaRY.Ta?a4[yDJw1!#qLsW>6Vyrfzq-pLflpwRe|Js>%!Dt@3Dt&Jvy_[xs~HrnjMuwpsw'RecKu+D#'!t<~Grl~?rjg5u-x,gwp{ah!-(~@:Rg~Ou!5Rh'jXuvvNr}:Rh#cW#X/c;&!#2sLi[v7u7RgpJv)(!iLrxu,Re6j7v@s@5Se[e7d`aW!Za(a`T.a#!a3!&aDa-!9)Dt_=6s+3[x~~DR|h~DS6avhGun5RkZj3w)v-]mkKunB!&*]kb97R|i<ARk<c:Z(6Vy}Juh'!wziMRoS:F|vkLuauJv5vtvQRh1d='T+Y#VyO~DR|jcF#T'7R|g97R|kJv3'!ay<Rj,Jvh&!:ReXcsa6*a+#a#_aIRf9aLRf?c,Z&Rf5Rf7c.Z&Rf;Rf>cQ#%T'p-Rf8Rf=ct#%'(*!,p,Rf4p+Rf6Rf:Rf<d~'Ua%U*^UYa(!a,-!#a4YaTalaEX0a8a<Weo3Dt/3Dsx=Br93Wen~Dr;~<5p<JwNZt2@3p=Pw:5p;Ou!5r3c7&!#:p>3Ds}KvGB)_6Vyk2sM=<r7x'eovA(!hFu1ARf}cV#X&@r5j6rvwQa^Rf3c=Za'wkghJv__g;unRggA53B9=b^}%j6uduo5Jq;!(hIv%2Re`Ou4ARe_e%a#^^^Xa&!a*a2!&a6YaP!*ad!#a:aE/5Rn?[y@>6Vyp;:pE~DrY~<5pBJwNZt8@3pCh=rt3rWPw:5pAJup_[xoNuPpF9c!#'45pD5ARn)d8#X'X*3@rU72s]h>v<<sSjJpqvewOJq/(!hNw'5ReBk0s2u3w/w'5ReE5@Jq.!a+JQ!&WeU23d(#Y&RjG5]jBk!u7w&u0udARjEe#+^^^Ub#!a2/a`Z(agT1!a-a;|@TaG!aS[yV=Re~fow'RguNuPRe?bz#'>RoUWeL>:Cbb|?JwPZtVg6ruRmzJvD'!6Vz(g/vmRh~Jvy_[y(g9voRgyx*cy(#2>Ri2B9b]~9kIw9u7rluJu3Rg]dI#a%UY'@=p%CAx.gQZ&RhwwygtRm{x5g_Z'+ABqR9Woa=Bp&dV#^*Xa'!&@o{g4v]Rk;Jv{!%Rk[wkkiA5RkiwwfUB=x,fUuqC&*!>RfTg8v0RfV~ARfSd;rJsAuAv9wR'ae+/aO!a@aza/a#[yQ@Wg!2Wemg3sEr0JvB_g>uvReWg2v+Re=KupB_+[y!2AbY~-~Hr2AJwD!(h<~El>h<~El?Kun@+_:9b`}Kg-v/Ri3g;vtwyk_9]k_d=&T#*U.6qh@Ab`|K9:H|CJv[!&3Dtex'fDwC%!Rf[9WlMd[(^X,!a%Z06Vz!@WgBg=v~Rgvg,QRe@awd,#Y+jTv|Q~EfWj]uNr|~FRfXdy#Y&^Ua%!aO.!(a)Ua;=!a@aKap!a-,a!Ta]a[rSa]p?[y82sK=Bq~;:p:~<5p8Pw:5p7d'#Y'Wf(;RnRi[u4w&RgJJvG'!6Vyh=<r#ijuuv/sIKuYD'ZtG@3p9~Gr&d2#`(g<vtRgFj`u5w&rqpxRf2CJuY!+:wfnTOu!5Rg}jNs1ucv&RfwJvA!&3@q|BDcC#T,k/unq8w8Q5RkTklwQuzunq8w8Q5Rk9dga#!a'!a=#a0!:+Tb*b@aO.a4!aba8aFJv^}?!VyR~Dr<g;u%Rn.~<5p[x'e`wNZtR@3p]Pw:5pZhNvjBp.woe_g5u-r4JwF!%DtO3:ooc7&!#:p^3DtpLuGw(!+%)Dtk6Vz#2sd=<r8d'#Y([y#<x3gJt`w@!)%}MRiowzikRij=]ilxAf3,U(#B2Rf#g0v-Rm[ck{`U#]giKv3>)!&6Ri154s,KuGB_%@r68r:dJ|t`#X(9<E|u2@H|rx3gJu?w'!+'1Nu7Reg4=H~+9<wxgY95Rm]xLggZ-`(X}U2:Ri4h<uOawRmsJv__5@bb{jbV~3dka#a'a]!,#a+U=a>b6a3b%!/aKa/)!arwve^VyJ;:pR~DpTg3uJpS~<5pOPw;5qmPw:5pNOu!5pQJvG'!6Vyx=<qoJvA!{~Jup!%@qk7Rn/KvyD!}''[xz;>wkh'?Rh,x8gyt`w5D!&),(SgyccRgztJ@3pPB5p#d'(Y#<]mmifubw&RgoJvE&!82s^JvF&!8Rf,ADb]~;x=h'rNu]vK!,%'*0RnORh)4Rh*AqQg-vaRnNg;wHwkh'ba~4cE#Ta*x3gctyw@'!+%RnFRnD<4Rn@hFvK5RnCxWg[#`&a0Ua()`1Rm75Rg[c]%X#qi8Rg^NvdRj>BwzgZauwji7Rm6A4wgg]d1#&(*,.0a#Rm;Rm<Rm=Rm>Rm?Rm@RmARmBe%#^^^Xaea?aC/b+(,!a+a#!a/!>a&Ta<aKbD!2wphBRnk[yPw}hE|.=Br-3Dtm>6Vy~g6urRf.x,hPrNav!%'RnqRo%Ro#Nu;q[Pw;5r+JwNZtM@3r)d'#Y'Weh;xChL#`&RnmRnoKu}>%(!Rne~Bs-;2wjcussJv+'!aYSO}6@B<5?ba~8LrNvj!.%*ROwungw~ng~:9;Ri^>wtnig;wHRnixDh@|(UZ.x1h@|)!#:2<H|*xHn]#-UX'3Ro)z=iT}6ARns=Bwsn_wpnaRncw]aR(#UXa&Ua*a/=]iPd'#Y&Ro'WnXf{QRm2hNvj]nZd`'T~&1`{|`#9b]{}c:'!#Wl{>@=be}]?cl{{U#:5Abb}Jds#^YaF!a*b4a#a3aPa>&Tb!bH!*a_!Eau?/a&RjY<]gj>6Vz*;:pe~DrZg,QRj1JwNZtX@wihspcJvZ&!VyX9WmOJu|!|N2WmHJvh&!]ht~Bpbcn&T(!#RmQ<s7Nu;padH#X'`+WmJ@>RmKCARhnKup=!)&Wf+:RhqNuPpf9c!#'45pd5AwghpARn(Ls@w!%,)!RmP@Wfe<E|IJva!&WmNg8vsRmLd`*.`#Y'Xa!axRn*]hrA8Rhug5s@rXg8u!RmMd8#X'X*3@rV72smdI*#UY&RmICARho~GsgxVgd)Ta'U-Y&Xa!T#RnEWnA@Wffg1uDRi0hFvK5RnBxGnG&#`%owp)@wsf+bX}Ze-*1!a*^^^Ua|!#a.aq&Ya2!a>.a6!a:aO`aJDtL[y`@Wg#>6Vz12@wzoYRoZNuPRi!NuPRhzg=ucRi,@=b`{Yg=ucRi-ACJvB!&Sh[ebSh]ebi`wUuFRm4Jw2_[y0JvB!.<Ju(!&SoG}6Shd}6<Ju(!&SoH}6She}6Kur@._g5vHRieJvx!{L2G{Kx6gd'T#?Rh82Wi5cZ#X(g1w)Rm5dW-Y(Ta#!a)!#aYa=wnfE=su2>>bU{0j9udv:<svj8uQv-7RgHdE%#^'sq9sp=>Bb_{TJv`!&g/r|snj6v(us5d,#Y(56H}[978H}]Jw5!&g1rushJvB!+j;v{u5?zDhd}6}bj;v{u5?zDhe}6}ce*#`(^^^a[aea!=!a6a*aoXb1a.!aAbL!b>,b'aL!aV@Wf|2Wlg3[y/JwNZt^@3piPw:5pgJunZou3@rsJva&!Vy_g<v~Rm#JvG'!6Vz0=<r{Ju{%!:pj@WfsiXuJu3Rm:JvZ&!WfA~Bph@c4Z&Dtwax5rubx(#:awRk1@d,#Y&RfjRfid1#,Y(@Wfp2Wlrg5s@ryKu[@!,'=]ig9wlk?Rk>g5u-rqJvy'!@9RkQcH(T#=>Ri~@<wkj(Wj(KuZB*!&<7rw@9RkRcH(T#=>Ri}@<wkj)Wj)dg(Ta2Xa9X#`-!a*CARhg@@=I}d9x;c~#X%so=<sj>2@@=aybb}XjWv0Q~EfEj3vLv;<d,#Y(56H}`978H}_dgaPaFa'a/!#a3Y0a_a;a|!1(a7-[yE3[xt;:pJNvZrrg3uJrvJwNZt=@3pIh=rt3rxPw:5pGOu!5rpJvG'!6Vys=<rz@c4Z&Dt(ax5rtJvZ!&~BpH@wsfNg-vaRlNci*U#=<wei<F}a5@Jq.!a*JQ!%@qZ23d(#Y&RjH5]jCk!u7w&u0udARjFd/prq=tyvpaEa(a:.!a1aZ(@@=I}:9wpd%=<sX55w_h}@@=I{t=ay<aU@@=I}T=ay<2@@=I})?C9:9au@9Cb]}DP~=x-fAZ(2Wl1=ay<aU@@=I}>5@d##Y+jTv|vV~EfFj]uNpn~FRfGdgaK!Z2&!a8a-Tb({E!acTbM*!a(DtY[yYd'%Y#sl[y*hHvh>Re5x2c{Z}.j4uCvcawRiMd+#X+_x&d!},<5RkX;2Hzw@x,gavfB-!{CcF&T#Roe;RodwWbBg5urRgaKvHC*_6Vz+<4opieuew&Rmq@d]&Y)X,T#X0Rh}<BqP=4qS9:ReMg/ujReNJw0!/<Jui%!bd{kawwnemRelAxUa?a3#*.&UX(Ya+a/RhvRnQ<o}9Wmtd-#Y&RgSRmw9;Rmxay=Rmyg-vaRmuxEhSrNu,v-voC!%(aR.a(a7+1Ro1>Ro5CE{A9b]{@;5x#eO{:g;urRi+KrNA!%(Ro3>Ro79;Ri_Ku@>{;&!x%gX|{KunA_+g5QRj/g3u5Rj#g>uERj%wio/xRhS&!,!#^1U}wba{8>>@=be}qC@:D5ba{7Ku+A&!}x?ba}t>>@=be}se(aA^^^Uat!b0#{pa+awUazbGa#aLb9bgaWac'a5TbS=Br!d1#`%scp_Jvl!#rT>Re0JvX&!VyN=H{Fcm#U&:pY=ReaJv2&!]h0=]nUJvG'!6Vy|=<r%JrM_=]h2@Wlud'#)U'Wf'b]{i=]h/Jvh!&~BpWg=v]RnMx+ny#'Nu;pVwjnu=]nwxJnx,T#`&Reqwjnt=]nvieu9vrRjLLuYwP(#+!th@wih5pX~Gr'g5v/Rh4KunA'!-CARnP@wwiN:Rm_9x'cvw>!|l=<saKvAA!0&3@q}>w^e1bp#&Re2Re3BDx7gH#T|f5H|eKuZ>!%(:qNAH{]Jv6!+3B2B9=b^{X<5<B92:E{ZLvhwA(a;a%!igQuyRmad+#Y}m@3Rh5d8#X'X*:AqUAHzmaxwbh<aXRnVcF}RT#Nw&cj#U(BWnug/vsRntdka)(a3+.Zb7aYYan1!bVa@Xa}[y^@b[{G=H{+hFu73Rj&Pv#5ReQcK%T#sig1v{Rj'Ku+D#'!t]~Grm~?rkKuMB!01d5#`'Vy.ta3Dtu~Hroc8#'{^45s85AwZbP&!#Rn!wghxWn#KvEA!)&2RlA2RlBx:h|#(T,=]j09Wobz>x]z/@awRoTd+#Y(az]hFhCrm4d,#Y+jTv|Q~EfMj]uNr|~FRfOdCa!Xa9_X#@<plJvf!%b`{(9;Rgwc;.!#2x7cw#T|UDb]|T5Ju={(!=@E{&Jv)&!Ab`{'awJvf!~*>>@=be{#KuY>!+&4Ezyi[ugv&RjIdea+T)#UXa&T-T&a!Rh9auRmW=]kLg5vuRn+g3u4Rn-Ow6ARn,hHus5xNk?#UX(U~)/g8v0RkD~AwkkF?Ri.OuNBwkkA?Ri/d|a2`a*^UYa.!aBTZaTa'Xa;!(!2!-a#b2[yC>6Vyq3[xr2Wi?g1rusVh%s?DtF~<5rbJs;%!DtBfswKtCj[uvuSsEu3RgVx3o:u+wN'*Zt;@3rd~Grh~?rfg8w)Lq)qE&-a%!>bI|`jWv0vV~EfCjTv|vV~Ef@j]uNpn~FRfBcK#T']gWNu7x,k7q4ai(0!hHv8<RhmkMu9vrsBuev/RhlCJvB!,g<v{wchh~@:Rhji[vrv{wchi~@:RhkdS&a5UY#Ta!RgPwwiI5BwciI~@:Rh`x'iJvj'!5]iJPu8Bwch]~@:Rhach)U#h3rp]gLh@t|Ax,hTq3ah!-(~@:Ro0Ou!5RhXj^v(pyw8unRhVd|)`,^UYas!a?/a2Z'a^Ta{Tb7Ta(a#!a,Wf&9sZ3DtAadamov=Bqt3[xig8vsRm~>waiL2b`{QJv*_Ouv2qgj<v]v2BqfdR'X*X#Y-@3qr~Gqv~?p6hHv-]glPup5Lq+q?_%*b_{qF{n9b^{rOu4ARhpKvCD!+&~Bqp:5Dbb}nwoiKl&unuTuBv]v+ueunaXRf0=Jvh!0nKufu8v1w&w7q%w&uHrz:Rgnj5w,uxDJq/(!hNw'5ReCk0s2u3w/w'5ReFd>Za&!*UaA=<wkgsRnSJv^!%Refifw3vyRgOKu_B'!,<]gkiiu:w&Rh<=C@a^<B57@2F{[<B5@aW:=3away9A5aW=<B=C@a^<B57@2F{Ie-#`(^^^bCara.b8aza6!/bZ,!adTbnTbOb+aFaS!aAT9@Wf~2Wli3Dtl2@d,#Y&RfnRfmJwJZtN~GqyJva&!VyMg<v~Rm%iXuJu3Rm9Jv[_=]ih9wlkDRkCd1#`(@Wg>2Wls3cH#T(@<Rj*=>Ri|b~'#23s9h<~El.d'#Y&Dtxi^rzvdRl#d*#U%(o|B2s`hJwSaxRmDKv4B&!1:Rmdd5#`'Vx}to~Hq{x'f1v3(!BA5ba|bJv_&!Wfug1v]ReIdO+U/Y#&G}-8wze=Rh{g1v]ReHg/uQRf/by#)ibQwERl/cH#T(@<Rj+=>Ri{cNu+vlax-!(#a0qa9<Rii2;;bU{H;x<i=&X#Rk`<4wwi=C9H~8xAI(Y#<azRi@45wXI<B9;5bb~7dL(X#Xa(+!aL6Vy{g5QqOau:5au2@ay547EzbxOcU(UX-T#Ta#:Cbb|A?wjh/b_|SOw6ARgtihr}u7Rhy<d1#T)X1@@=I|~=ay<2@@=aybb}Sj3vLv;<d,#Y(56H}A978H}@dGpvs@uAu`vcw9*!aFa+ai%(b!aXa8.a?a[ozWey=sU2@G}Nch&U#Rf_WexKu+D#'!t:~Gr`~?r^j]uNr|~FRg*j^psurwJt|RmcKv)@&!)7Rkv~Br[@wxfO:Rl3co#U'6Rezj_q#vIuavjRltwzeyh@vr5JqD0!>aY?C9:9au@9Cb]}9cl#U*5;5<H||jbuus1ucv&Rfvg1v~d/pppzqFr^a--a~!aMat1(hFv;Wiz@@=Izoj5uuv-7Rix~Cw`fk2WlVcZ#X,k)u3vWs@u2]ktg;wEx'fBq(_2Wg/jTv|vV~EfoJv]!15x'hzqG!(P~EfU~CRl_j6v(us5x4i-#T(2WmZ?C2F|d>Kq<aj1!*jTqIsBv=Wl`~Cw`fi2WlWj`v0u*~>RlR=c>Z,k#u3vWs@u2]kr<c1Z+jTqIsBv=Wla~Cw`fm2WlXdmb3!a{(arZa`bkTa%TbQTa-a9+c'!aM!/[yL=Bqug.w'RifhFvyDRj.g>vgwyk^9]k^Jv3_@WfbAARkhJw2_[x|JvB_wkoIRoKwkoJRoLd'(Y#<]gm=<9<H|yd'%_X#skDtb3awwqkgNulRkgdB#^',9:p'hJwSaxRmEBwVb8@4=H|qLu+w50&!)@3qs~?pU>Awwn;;Rn=c:Z'ARn<=<qwKvC@!/&~BqqJv6!&]eVb^z^xRge'/a%+^`#Sge}6<4Rn3=]n0Pw2>Rn8Jw0!&>Rn:>Rn6cY#a7+!a&=<wkaNw~h3z_c5Z{=wjh#=]nLKv^D!&)Vyz=bW|swYb<WetcG#T(2wxa@qVx@gD#Y&b^|V5JwG&!5bb|pg/w&RgD@x=kHs=uAvn!a%%/'+RmSRh694Ro`g-vaRmRhHv-]mlxCcS#`&ba~.5cD#Ta)P~=d,#Y(56H{>978H{Dd_#{2^Y%_+qbbb{6g3sERhsbU{?dfa.,`a(Xa<!aiX#(55RiG54RiHcI#T'WiU3RiVNvdwtfcRlKNvdd,#Y&RlHRlExQgf.1*^T'X#Sgf}6Wn4=]hfPrk>Rn7Jw0!&>Rn5>Rn9Lunw?&a2!,5<oq@@wqfdRlJj5Q~=d,#Y(~ARfcOuN]fdDKw;ay(}i!547E}j?cI#T(@5bV}iCbV}hdv(^^Tb?a40,b##Tbo!a*bR!a<b|a/!aKai!aU[yK=]o^g:v>ReGJwPZtK<7Rh+h<~El,Pv#5ReR@awwxjCg,ulRjDJv6&!]j!z?aQeeg>w=Sh<eeJw;!&axEzOg,Qosc!#*:wkeJ]eJ>x'h-u(!%Ro.w~h.zPdNZ(X,Ya![x{;9ReY;wkgxRiF:x?ap#Y&RmUg<s2Rkod]+UY0TZ'!a&A9sw<=bczLNvuw{gqzNhJwSaxRmCKuLay!#&s_Rf-55b^{uJvZa!!c%#(55Ri654wmiu5RiuawLu,vp!+}^%b_}Y9;wkgxba}o>A9:=b^}zKuh=a''!3awRk3c*'!#aHRk6c+Z&Rk5Rk4Jv)&!awRjSawd9*`#0?C2@EzMj8u<uJ5RmbjQrquJu3x,k>uq@_+=ayb^|W~ARkEOuN]k@7dhzV^X/X&a-#zRzSb`zXcJzTT#2WkVKvDBzW!%FzY9;5bbzWjQrquJu3Jw3%!b`zU=ayb^zQd:#X(T-a!6Vyywxh}=b]{Jg=u1RiAdGp~qHtzv!w(wA+a+a;<!aJaYai'anasb(=azRmV:Cbb{MLq2vb!%')RjuRjrRjtRjqx3jnqCw3!%')Rk(Rk+Rk&Rk)Lq2vb!%')Rj{RjxRjzRjwLq2vb!%')RjsRjpRjfRjex3jcqCw3!%')Rk'Rk*RjkRjl9<CbbzfOu4ARhxLq2vb!%')RjyRjvRjhRjgx=joq*uKvb!%')+-Rk.Rk%Rj~Rk-Rk#Rj}x=jdq*uKvb!%')+-Rk,Rk!Rj|RjmRjjRjidAq&qKs@uAv8Aa.'*-a@a&0!aM@a5[y73Dsy3Ds|3Dt):wxgI2sHJwJZt.~Gqxwsf0ikrzt}Rl0Jvy_[xj~HqzKv_A|D!&WfP8axRoVcf,U#k(v]v+ueunaXRf1Ju}'!g8u#Ri=jQw!sCunLprq>!,')~<5qeGzq9F{W=c##%s5au:5aU3CBE|;d4#X(D!a&6Vygx(b;#(=]ed?C2F{N<capoq2r[a&!aPa9,'Pw;5s:@@=I|,55w_h|@@=IzcP~=x'fCqB_2Wl2>aU@@=I|1OuNBc1Z+jTqIsBv=Wlc~Cw`fl2WlZ~AcTa%!Z+jTqIsBv=Wlb~Cw`fh2WlYk+uNqJsBv=WlSg,u3dca3#UXaMYa)TaB-=cM|7T#<bI}l5@B932:aV2G{BOuNBJq:|M!5Ezt=<B=C@a^<B57@2F{v>cB{/T#=ay<bI{3Jv6!a.6BKq0ah&+!5E}HP~Ef{978BaU@@=Iza<7d#.Y#978BaU@@=IzH~AJq0!(@@=IzG978BaU@@=IzFe,aU*Y&^^^bvJb,b:bFad!a,c2Ta>aL.bo6!a#CbTa'T#Re{2Wlh2@G{yg6t~Ro_NvdRfticuRQRllJv3&!x&c|zs@Jw3!%RflwpfkRlpKuL;%(!Re<@G|C2GzdhIvuBwgjAg-u0RjAKQB%!(GzZ@G|5NuuRl7d='T+Y#Vy[g<v~Rm!==G|>JvA!)@wma=]m1ifuaw&RmnLs@vT'!|/+[y,g:v>ReTJw1!#qX=x!eC{bLu+wT&)ZtZauq_~Graci&U#F|89:r_Lupvq!.)&2RlG8RfaC=x!eF{_h?rpWlmd&'!#X|&]k::xJey#`'T|+<E|&2@H|%dE#(^,g;u.RiEg6vjRiC9xCkA{O|zY#g=ucRmXKs0@!&*@G|m@awRknJuh!,3d(}gY}eJvj!%Rm):Jw3!%Rm+Rm-Ls0w(&!a(a#@b[|6cZ#X'7RkxWgAOu4ARn'dH'U#Y*Vz-Wm'CARm}d]*#a%^a*T'aK!a<9bV{PC=p*Jw4!&SgxcbB5r]idw(wBRmF7xFkt#&`(Rm/Rm8E|!JuY_9:Rl5=wrgr2:bbxd@xXfB(a*#T+!.X0X1Ta/a'T&RlDRfL>RlyARl9b[z[>RfZ:RlL:RfRwlg/ARl;9;RlxKv,A/!%7s69<74=BA5ba{-8Bde#`a<XaKYa1,a'P~=wxfB2bZ}}?C972@@=I}r8@55B9;5bb}G978B2@@=aybb}3j3vLv;<Jw3&!>Rfk=ayb^}4~Ad1#`*@@=aybb{w2@>==<bbz]dx+UY#^UaF!a9!bB'Ya1.!ajXa#%olRhD[y=3Dt#Ov5BrHKuMB%!(Rf^Wep~HrJwkiQjKr|~FRg)Ku+D#'!t5~GrF~?rDdV)UY,Z/_7RkuG{<~BrBg,rlsO:235B@bX}|d?a1!#`(6Vyn5@d##Y+jTv|vV~EfIj]uNpn~FRfH7Lq2vb1!a9-978BaU@@=Iz9978BbU}#~AJq0!(@@=Iz8978BaU@@=Iz7~AJQ|}!978BbU}!JvkaK!AdUa21-U#`a+(g/vsRn~Ou!5RPj:rmu9WhOjXuvvNr}:RhAj^v(pyw8unRn[kPr}p|u7vwv]RiSBd;pppzq@qHQa?(b.!a.a`@.|xa(hFv;Wiyj5uuv-7Riw~Cw`fg2WlU978BbU|wOuNBJqG!(P~EfD~CRlQcZ#X,k)u3vWs@u2]ksg;wEx'f@q1_2Wg.j]uNpn~FRfqJv]!15x'h{qG!(@@=IzK~CRl^j6v(us5x4i,#T(2WmY?C2F{1>Kq<aj1!*jTqIsBv=Wld~Cw`fj2Wl[j`v0u*~>RlT=c>Z,k#u3vWs@u2]kq<c1Z+jTqIsBv=Wle~Cw`fn2Wl]dn1#c(a(b^a2!b/bAT(bj!aDa7bu,a_a{c0!2T0g:v>ReD2@G{42@G{5~DpM~<5rc=Bx6i>{RT#RnI@zCx]y]z:2Jv[!zr5Awyk]9]k]dD(Y+X#6Vz.g=wKtgwhaCwgmTWj2Lu,w%_+/[y-B;b^xeg3u3Rj-2@bX{*KrJ<!+'@Wg(g?QRlC@Jv`!%b[zIwsfII}8JQ_@w|kW|=Jv(%!AqcOuNBJvEzh!bYzjLs@wP#(0!oy@>RkdJwMZtc3Dtd@BcG#T'9bWxg2@2Fznd*#Y+;2x'c}w<zizixNgwa#Z'U+!/!a'!a+w~g~z6wcn{Rn}wcnzRn|5Rh%=]nJg5vuRmvNvdRlvcprJu}w*az*a#!%.a.'Bot9qT]kj@Wg'ay2Gzv@Jv`!%b[zEwsfHI}1;ck#Ux`<Cbbx_Lu+w!a&0*!wko*wwo,So,}6Juqxf!E}PigQuyRm`d3(`#8>Rn%:A5B;bZ~%KvhCa!a2!x>k7#Uxb@b{#xaRk7Jw0!)>wwhlShl}6>wwhmShm}6CJvB!.x'hhvj{!!5Bwkhhbaz}x'hivjz~!5Bwkhibaz|xEhTrNu,v-vpD!a%&/)a3a.,%Ro2t[CE{)@3re9b]{%wjo09:rgc:Z&Ro6=<riifuaw&RmoKrNA!%(Ro4>Ro89;Ri`dSaL'UYzxZb)7Rka3xRhT&!,!#^1U}vbaz{>>@=be}yC@:D5bazzKu+A&!}{?ba}y>>@=be}wxBh[t`u~vJvr!%a!a()a,a0a4RoC=]o;Ju(!%RoGRhdwjh`=]oAg>w#Ro?g5vuRo=NvdRl|Ku]C.!&;RoEJvB!%RoORoMBx'h[v+_?w~h`}~5?w~hd~!xKh]oiptu-utv.vp!#%&a30a@a'a+(a/aOp(o~p!RoDJu(!%RoHRhewjha=]oBNvdRl}g>w#Ro@g5vuRo>c[#X']o<CauRoRAd-#Y':RkpauRoQKu]C.!&;RoFJvB!%RoNRoPBx'h]v+_?w~ha}t5?w~he}ue!/UbhYacXaW^Tc&a;b:a-c/#b&aja1(!cL+!bKbt!bmcRc9aIc?8[yW3Dtt94Rg`Jv}!&SiRMzBhEebShEMNuPRe>x7gL#TzuwjirRipc<Z&>on;>z=h-MSh.Mwqczx'a7vj&!>Re4@=ResJt__NuPRi*NuPRi)j]uNr|~FRfzKrJ>_+@Wfy@Wf]2WocKrJ<!+'@Wg%g/QRl@@Jv`!&awRl<wsfFIzgLu(w*!.*&ShBMwvhIRhI9;RhNx1hK'!#Sn]Mx1hK~0!#:2<H~7cNu+w7D*'1ZtW>Rn1~?rOc:Z&Rn2=<rQ<7wjh&=BSnLMc]#X(6Vz)w[b=a!U#9wzgMc3#&(RgMRitRis<x,gKt`ax!&+SioM=BSilMc3#&(RgKRinRimKurB,!&SiQMzBhDebShDM6BJQ!(P~Efx978B2@@=I}WLrJw!!,a*&@G}O@9wkibRid@@x'fKwC!&SlDMSfLMjUv~Q~EfKKv3@a+!(hFv-]mpx/hYZ(C5RiWz<o/MwkhY?So/M@x,gbvfB*&!SgEM:SoeeehFu3:Rgbda(,^TZa)X/7Sg[eb:2RgI~BrMC@wgkc:wwkcRerx3h(uUvK!&*,SnOM4Sh*MArRg;wHRh(x=h;rJvPwI!a4',a'0@Wg&=BSh/Mg>w=Rh=g3w*wwgGRgGcW(X#;Sg}M2Gzk@Jv`!&awRl=wsfGIz`dKZ*T'Y-:RhR7RhQg5u-p`j6v(us5d,#Y+~Awkia?RicOuNBwkibba}Ld6p~tyu_vbAa'a+!a/'a3aEa8a!>Sh,ebJv{!&Sh@ebSaReb9;SgwebNuPRi(NvdRl)NuPRi'hHu^<Rm^Jvv_@Wl(g;u1Si/ebKu'B&!*Sh?eb@Wl'z@aPeb95Si.ebcpputyvjB)!,&a+0a%ShAMWeK@G}C@WfJ9;RhMwvhH9w{ia}ix,hJvRA1(!zAn[MRhHx1hJ~*!#hFv(BSn[MBJQ!(@@=I~'978B2@@=I}2db.Ua<'X}+T#a0XaG2G}E;wkg|wuh!Rh!x,hZu,@)!&So0MVy)C5RiXACJvB!&5RiY5RiZg8w)cG}*T#2@bU}=KsA>(!a.3wkhZba~(x,h^u(A!&(SoCMRhb5Bz=h[eb?w~hb~6x,h_u(A!&(SoDMRhc5Bz=h]eb?w~hc~6e)aA1T#T,^^^c-bMb&blcPaP(a/!0!bA=b5c@a(!bfbrc#2afwmhARnjwchORnp2Wlf3DtsNvdRl-2@wpa<]m0bx(#:awRk2@Jw3!%RfhwpfgRlnKQB%!(G{V@G|'NuuRl6d='T+Y#VyUg<v~Rl~==G|<Jv+'!aYShC}6@B<5?ba~8@Jw3'!g2QRljhLrpWlOd+#Y'g.w'rIg>w*wgj@g-u0Rj@Lu+wT&)ZtUauq]~GrGci&U#F|39:rELrNvj!.%*RhCwunfw~nf~:9;Ri]>wtnhg;wHRnhx3hDs@v~!/+'@Wfr@9RkSNu&Rlo=@<5GzoKs0@_+@Wl+@awRkmJuh!-3d(}pY#qWJvj!%Rm(:Jw3!%Rm,Rm*de&!1U-U#`)Re;@G|.@9Ri82@wjfvRlq=@<5GzpLvOvr!).&2RlF8Rf`C=x!eE{.Jw3_g2QRlkhLrpWlPde(!#U{s,UXa*Ta'[y'g:v>ReS;x0PZ&RnlRnn~HrKJw1}f!=x!eB|2w]aP(#Xa&a*Ta.Ua2a7=]iOd'#Y&Ro&WnWg;u.RiDg6vjRiBNvdRlzhNvj]nYJuW_2Wm3x)kFze{9d])!a.!,Y01!#&aC!a3RndC=ox~BrC@2b^{pg,rlse7x'ksuq!%Rm.E{xidw(wBRmGx9o+)X#wwo-So-}69:Rl4@xSf@a#XZ'X)X,Ta(/ARl8b[xc>RfY:RlI:RfQwlg.ARl:9;Rlwdn'#^XafaQa1X1TaHTa)@b[{zcZ#X'7RkwWg@Ou4ARn&x)kG#{,g7u/RkGdH'U#Y*Vz'Wm&CARm|bx#(A]gUbUzJj9Q~=d,#Y(56H}l978H{U7d,0#U*2>ABb_xZ978BbU{e~AJQ{g!978BbU{hxMh?ad{oUYZ.x1h?{l!#:2<H{mx3n[t{vl!,&a%3Ro(z=iS}6ARnr=Bwsn^wvn`Rnbd`*T}B0!#^X'BG{c9b]{a>>@=be}F?JvS!&BG{d7BG}(Bde#`a1X,Ya@!a'P~=wxf@2bZ}I56B2@@=aybb}08@55B9;5bb}<j3vLv;<Jw3&!>Rfg=ayb^}&OuNBKuLA!)a!P~=x#fD{f2@>==<bbzl?C972@@=Ix^d6rSu,v7w*C(0a)a6#B+a%!sQ[y?3Dt%3[xn~<5rLOu!5p@Ku+D#'!t7~GrP~?rNKvlaya7'!h+v-5qMg=t|cd,U#5AAaa5Abb{S@52B5@a[@52B5Gx[iXueu;d<#`a(!/549C;ag>23ExY5@Dah89b^~689Jv)!~2b[~1Lv'w(%*!a#bX|aPrmawRe]keu7uhv-q6rxu,q`xTo]/a5aU!bNaDXbi!b-!ao!b<bwA!#5@B932:aV2G|:d-)Y#hJrL>RhG<7@C5<H|_=Cau:5aj5@B932:bJ|ng>vIbs)#?C2F|9jPv0w.vISh-MKvUaz(.!9ABbb|[5;5<H|Eg>unwfh;9:4E|YjQsBt|vjx'hYq3!(?C2F|J:2<BaY?C2F|GOu!5x,g|p{ah!-(?C2F|c9:4E|OjXuvvNr}:Rh&i[w*t|cd+U#jJvsu)vsSn~Mkfrmu9p}u7vwv]So!McW#Xa!ax5@A5aY:5;5<H|>kJv~vYrquJu3x4ib#T)2@SmZM?C2F|Bj:rmu9@xPhI(a*a#U#`a3-5Abb|L~@:RhK9:4E|0@52B5G|#C::aY?C2F|-:2<BaY?C2F|.5Jvk!a)javYrquJu3x4ia#T)2@SmYM?C2F|HAxPhH(!a#U#`a*-5Abb|4~@:RhJ9:4E|R@52B5G|F:2<BaY?C2F|Sc^#Xa2j=Qq5CJvB!-g<v{z;hhM?C2F|Zi[vrv{z;hiM?C2F|XKsA>!a)-g<v{z;h[eb?C2F|]i[vrv{z;h]eb?C2F|^iZu.vix,hZq3ah!.(?C2F|QOu!5ShXM:2<BaY?C2F|P", 13494, 2713, 49, 25, 61), ge;
(function(e) {
  e[e.VALUE_LENGTH = 49152] = "VALUE_LENGTH", e[e.FLAG13 = 8192] = "FLAG13", e[e.BRANCH_LENGTH = 8064] = "BRANCH_LENGTH", e[e.JUMP_TABLE = 127] = "JUMP_TABLE", e[e.VALUE_MASK = 8191] = "VALUE_MASK";
})(ge || (ge = {}));
function et(e) {
  "@babel/helpers - typeof";
  return et = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, et(e);
}
function ni(e, t) {
  if (et(e) != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (et(r) != "object") return r;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function ri(e) {
  var t = ni(e, "string");
  return et(t) == "symbol" ? t : t + "";
}
function N(e, t, n) {
  return (t = ri(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
var _e;
(function(e) {
  e[e.AMP = 38] = "AMP", e[e.NUM = 35] = "NUM", e[e.SEMI = 59] = "SEMI", e[e.EQUALS = 61] = "EQUALS", e[e.ZERO = 48] = "ZERO", e[e.NINE = 57] = "NINE", e[e.LOWER_A = 97] = "LOWER_A", e[e.LOWER_X = 120] = "LOWER_X";
})(_e || (_e = {}));
var ft = 32, rr = 21, ai = 2097151, Lt = 2047, ar = 0;
function ii(e) {
  let t = e >>> rr;
  return t === Lt ? ar : t;
}
function si(e) {
  return e - _e.ZERO >>> 0 <= 9;
}
function oi(e) {
  return (e | ft) - _e.LOWER_A >>> 0 <= 5;
}
function li(e) {
  return (e | ft) - _e.LOWER_A >>> 0 <= 25;
}
var dn;
(function(e) {
  e[e.EntityStart = 0] = "EntityStart", e[e.NumericStart = 1] = "NumericStart", e[e.NumericDecimal = 2] = "NumericDecimal", e[e.NumericHex = 3] = "NumericHex", e[e.NamedEntity = 4] = "NamedEntity";
})(dn || (dn = {}));
var hn;
(function(e) {
  e[e.Legacy = 0] = "Legacy", e[e.Strict = 1] = "Strict", e[e.Attribute = 2] = "Attribute";
})(hn || (hn = {}));
function ci(e, t, n, r) {
  let a = (t & ge.BRANCH_LENGTH) >> 7, i = t & ge.JUMP_TABLE;
  if (i) {
    if (a === 0) return r === i ? n : -1;
    let l = r - i;
    if (l >>> 0 >= a) return -1;
    let c = e[n + l];
    return c === 0 ? -1 : n + a + c - 1 & 65535;
  }
  if (a === 0) return -1;
  let s = a + 1 >> 1, o = n + s + a;
  for (let l = 0; l < a; l++) {
    let c = e[n + (l >> 1)] >> ((l & 1) << 3) & 255;
    if (c === r) return o + e[n + s + l] & 65535;
    if (c > r) return -1;
  }
  return -1;
}
function pn(e, t, n) {
  return n === 1 ? String.fromCharCode(e[t] & ge.VALUE_MASK) : n === 2 ? String.fromCharCode(e[t + 1]) : String.fromCharCode(e[t + 1], e[t + 2]);
}
function ui(e, t, n) {
  let r = t + 1, a = 0, i = r;
  if (r < n && (e.charCodeAt(r) | ft) === _e.LOWER_X) for (r += 1, i = r; r < n; ) {
    let o = e.charCodeAt(r);
    if (si(o)) a = a * 16 + (o - _e.ZERO);
    else if (oi(o)) a = a * 16 + ((o | ft) - _e.LOWER_A + 10);
    else break;
    r += 1;
  }
  else for (; r < n; ) {
    let o = e.charCodeAt(r) - _e.ZERO;
    if (o >>> 0 > 9) break;
    a = a * 10 + o, r += 1;
  }
  if (r === i) return 0;
  r < n && e.charCodeAt(r) === _e.SEMI && (r += 1), a > 1114111 && (a = 1114112);
  let s = r - t;
  return s >= Lt && (ar = s, s = Lt), s << rr | a;
}
function di(e, t, n) {
  let r = ti, a = e.indexOf("&");
  if (a < 0) return e;
  let i = e.length, s = 0, o = "", l = r[0], c = l & ge.JUMP_TABLE, d = (l & ge.BRANCH_LENGTH) >> 7;
  do {
    let p = a + 1, f = e.charCodeAt(p), g, h;
    if (f === _e.NUM) {
      let w = ui(e, p, i);
      g = ii(w), g > 0 && e.charCodeAt(p + g - 1) !== _e.SEMI && (g = 0), h = g === 0 ? "" : Qa(w & ai);
    } else if (li(f)) {
      g = 0, h = "";
      let w = f - c, x;
      if (w >>> 0 < d) {
        let R = r[1 + w];
        x = R === 0 ? -1 : d + R & 65535;
      } else x = -1;
      let v = 0, b = 0, _ = x < 0 ? 0 : r[x], y = p + 1;
      e: for (; y < i; ) {
        for (; !(_ & (ge.VALUE_LENGTH | ge.FLAG13)) && _ & ge.JUMP_TABLE; ) {
          let z = _ & ge.JUMP_TABLE, A = (_ & ge.BRANCH_LENGTH) >> 7;
          if (A === 0) {
            if (e.charCodeAt(y) !== z) break e;
            x += 1;
          } else {
            let O = e.charCodeAt(y) - z;
            if (O >>> 0 >= A) break e;
            let j = r[x + 1 + O];
            if (j === 0) break e;
            x = x + A + j & 65535;
          }
          if (_ = r[x], y += 1, y >= i) break e;
        }
        if ((_ & (ge.VALUE_LENGTH | ge.FLAG13)) === ge.FLAG13) {
          let z = (_ & ge.BRANCH_LENGTH) >> 7;
          if (e.charCodeAt(y) !== (_ & ge.JUMP_TABLE)) break;
          y += 1;
          let A = z - 1, O = x + 1, j = 0;
          for (; j + 1 < A; j += 2) {
            let B = r[O];
            if (e.charCodeAt(y) !== (B & 255) || (y += 1, e.charCodeAt(y) !== (B >> 8 & 255))) break e;
            y += 1, O += 1;
          }
          if (j < A) {
            if (e.charCodeAt(y) !== (r[O] & 255)) break;
            y += 1;
          }
          x += 1 + (z >> 1), _ = r[x];
          continue;
        }
        let R = _ >>> 14, k = e.charCodeAt(y);
        if (R !== 0) {
          if (k === _e.SEMI) {
            g = y - p + 1, h = R === 1 ? String.fromCharCode(_ & ge.VALUE_MASK) : pn(r, x, R);
            break;
          }
          if (R === 1) break;
        }
        let F = ci(r, _, x + (R || 1), k);
        if (F < 0) break;
        x = F, _ = r[x], y += 1;
      }
      h === "" && g > 0 && (h = pn(r, v, b));
    } else g = 0, h = "";
    g === 0 || n ? a = p : (s < a && (o += e.slice(s, a)), o += h, a = s = p + g), e.charCodeAt(a) !== _e.AMP && (a = e.indexOf("&", a));
  } while (a >= 0);
  return o + e.slice(s);
}
function ir(e) {
  return di(e, !0, !1);
}
var hi = /* @__PURE__ */ kt({
  arrayReplaceAt: () => pi,
  asciiTrim: () => xt,
  callable: () => sr,
  escapeHtml: () => $e,
  escapeRE: () => zi,
  fromCodePoint: () => tt,
  isMdAsciiPunct: () => at,
  isPunctChar: () => lr,
  isPunctCharCode: () => rt,
  isSpace: () => ae,
  isValidEntityCode: () => Gt,
  isWhiteSpace: () => nt,
  lib: () => yi,
  normalizeReference: () => _t,
  unescapeAll: () => Ge,
  unescapeMd: () => bi
});
function sr(e) {
  let t = function(...n) {
    return Reflect.construct(e, n, new.target && new.target !== t ? new.target : e);
  };
  return Object.defineProperty(t, "name", { value: e.name }), Object.setPrototypeOf(t, e), t.prototype = e.prototype, t;
}
function pi(e, t, n) {
  return [].concat(e.slice(0, t), n, e.slice(t + 1));
}
function Gt(e) {
  return !(e >= 55296 && e <= 57343 || e >= 64976 && e <= 65007 || (e & 65535) == 65535 || (e & 65535) == 65534 || e >= 0 && e <= 8 || e === 11 || e >= 14 && e <= 31 || e >= 127 && e <= 159 || e > 1114111);
}
function tt(e) {
  if (e > 65535) {
    e -= 65536;
    let t = 55296 + (e >> 10), n = 56320 + (e & 1023);
    return String.fromCharCode(t, n);
  }
  return String.fromCharCode(e);
}
var or = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, fi = RegExp(`${or.source}|&([a-z#][a-z0-9]{1,31});`, "gi"), gi = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function mi(e, t) {
  if (t.charCodeAt(0) === 35 && gi.test(t)) {
    let r = t[1].toLowerCase() === "x" ? parseInt(t.slice(2), 16) : parseInt(t.slice(1), 10);
    return Gt(r) ? tt(r) : e;
  }
  let n = ir(e);
  return n === e ? e : n;
}
function bi(e) {
  return e.indexOf("\\") < 0 ? e : e.replace(or, "$1");
}
function Ge(e) {
  return e.indexOf("\\") < 0 && e.indexOf("&") < 0 ? e : e.replace(fi, function(t, n, r) {
    return n || mi(t, r);
  });
}
var vi = /[&<>"]/, ki = /[&<>"]/g, _i = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
};
function xi(e) {
  return _i[e];
}
function $e(e) {
  return vi.test(e) ? e.replace(ki, xi) : e;
}
var wi = /[.?*+^$[\]\\(){}|-]/g;
function zi(e) {
  return e.replace(wi, "\\$&");
}
function ae(e) {
  switch (e) {
    case 9:
    case 32:
      return !0;
  }
  return !1;
}
function nt(e) {
  if (e >= 8192 && e <= 8202) return !0;
  switch (e) {
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
function lr(e) {
  return Kt.test(e) || tr.test(e);
}
function rt(e) {
  return lr(tt(e));
}
function at(e) {
  switch (e) {
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
function _t(e) {
  return e = e.trim().replace(/\s+/g, " "), e.toLowerCase().toUpperCase();
}
function fn(e) {
  return e === 32 || e === 9 || e === 10 || e === 13;
}
function xt(e) {
  let t = 0;
  for (; t < e.length && fn(e.charCodeAt(t)); t++) ;
  let n = e.length - 1;
  for (; n >= t && fn(e.charCodeAt(n)); n--) ;
  return e.slice(t, n + 1);
}
var yi = {
  mdurl: Ha,
  ucmicro: Ka
};
function Ri(e, t, n) {
  let r, a, i, s, o = e.posMax, l = e.pos;
  for (e.pos = t + 1, r = 1; e.pos < o; ) {
    if (i = e.src.charCodeAt(e.pos), i === 93 && (r--, r === 0)) {
      a = !0;
      break;
    }
    if (s = e.pos, e.md.inline.skipToken(e), i === 91) {
      if (s === e.pos - 1) r++;
      else if (n) return e.pos = l, -1;
    }
  }
  let c = -1;
  return a && (c = e.pos), e.pos = l, c;
}
function Ei(e, t, n) {
  let r, a = t, i = {
    ok: !1,
    pos: 0,
    str: ""
  };
  if (e.charCodeAt(a) === 60) {
    for (a++; a < n; ) {
      if (r = e.charCodeAt(a), r === 10 || r === 60) return i;
      if (r === 62) return i.pos = a + 1, i.str = Ge(e.slice(t + 1, a)), i.ok = !0, i;
      r === 92 && a + 1 < n ? a += 2 : a++;
    }
    return i;
  }
  let s = 0;
  for (; a < n && (r = e.charCodeAt(a), !(r === 32 || r < 32 || r === 127)); ) if (r === 92 && a + 1 < n) {
    if (e.charCodeAt(a + 1) === 32) {
      a++;
      continue;
    }
    a += 2;
  } else {
    if (r === 40 && (s++, s > 32)) return i;
    if (r === 41) {
      if (s === 0) break;
      s--;
    }
    a++;
  }
  return t === a || s !== 0 || (i.str = Ge(e.slice(t, a)), i.pos = a, i.ok = !0), i;
}
function qi(e, t, n, r) {
  let a, i = t, s = {
    ok: !1,
    can_continue: !1,
    pos: 0,
    str: "",
    marker: 0
  };
  if (r) s.str = r.str, s.marker = r.marker;
  else {
    if (i >= n) return s;
    let o = e.charCodeAt(i);
    if (o !== 34 && o !== 39 && o !== 40) return s;
    t++, i++, o === 40 && (o = 41), s.marker = o;
  }
  for (; i < n; ) {
    if (a = e.charCodeAt(i), a === s.marker) return s.pos = i + 1, s.str += Ge(e.slice(t, i)), s.ok = !0, s;
    if (a === 40 && s.marker === 41) return s;
    a === 92 && i + 1 < n && i++, i++;
  }
  return s.can_continue = !0, s.str += Ge(e.slice(t, i)), s;
}
var Ci = /* @__PURE__ */ kt({
  parseLinkDestination: () => Ei,
  parseLinkLabel: () => Ri,
  parseLinkTitle: () => qi
}), Ue = class {
  constructor(e, t, n) {
    N(this, "map", null), N(this, "level", 0), N(this, "children", null), N(this, "content", ""), N(this, "markup", ""), N(this, "info", ""), N(this, "block", !1), N(this, "hidden", !1), this.type = e, this.tag = t, this.attrs = null, this.nesting = n, this.meta = null;
  }
  attrIndex(e) {
    if (!this.attrs) return -1;
    let t = this.attrs;
    for (let n = 0, r = t.length; n < r; n++) if (t[n][0] === e) return n;
    return -1;
  }
  attrPush(e) {
    this.attrs ? this.attrs.push(e) : this.attrs = [e];
  }
  attrSet(e, t) {
    let n = this.attrIndex(e), r = [e, t];
    n < 0 ? this.attrPush(r) : this.attrs[n] = r;
  }
  attrGet(e) {
    let t = this.attrIndex(e), n = null;
    return t >= 0 && (n = this.attrs[t][1]), n;
  }
  attrJoin(e, t) {
    let n = this.attrIndex(e);
    n < 0 ? this.attrPush([e, t]) : this.attrs[n][1] = `${this.attrs[n][1]} ${t}`;
  }
}, it = class {
  constructor() {
    N(this, "__rules__", []), N(this, "__cache__", null);
  }
  __find__(e) {
    for (let t = 0; t < this.__rules__.length; t++) if (this.__rules__[t].name === e) return t;
    return -1;
  }
  __compile__() {
    let e = /* @__PURE__ */ new Set();
    this.__rules__.forEach((t) => {
      t.enabled && t.alt.forEach((n) => {
        n && e.add(n);
      });
    }), this.__cache__ = /* @__PURE__ */ Object.create(null), this.__cache__[""] = [], this.__rules__.forEach((t) => {
      t.enabled && this.__cache__[""].push(t.fn);
    }), e.forEach((t) => {
      this.__cache__[t] = [], this.__rules__.forEach((n) => {
        n.enabled && n.alt.indexOf(t) >= 0 && this.__cache__[t].push(n.fn);
      });
    });
  }
  at(e, t, n = {}) {
    let r = this.__find__(e);
    if (r === -1) throw Error(`Parser rule not found: ${e}`);
    this.__rules__[r].fn = t, this.__rules__[r].alt = n.alt || [], this.__cache__ = null;
  }
  before(e, t, n, r = {}) {
    let a = this.__find__(e);
    if (a === -1) throw Error(`Parser rule not found: ${e}`);
    this.__rules__.splice(a, 0, {
      name: t,
      enabled: !0,
      fn: n,
      alt: r.alt || []
    }), this.__cache__ = null;
  }
  after(e, t, n, r = {}) {
    let a = this.__find__(e);
    if (a === -1) throw Error(`Parser rule not found: ${e}`);
    this.__rules__.splice(a + 1, 0, {
      name: t,
      enabled: !0,
      fn: n,
      alt: r.alt || []
    }), this.__cache__ = null;
  }
  push(e, t, n = {}) {
    this.__rules__.push({
      name: e,
      enabled: !0,
      fn: t,
      alt: n.alt || []
    }), this.__cache__ = null;
  }
  enable(e, t = !1) {
    Array.isArray(e) || (e = [e]);
    let n = [];
    return e.forEach((r) => {
      let a = this.__find__(r);
      if (a < 0) {
        if (t) return;
        throw Error(`Rules manager: invalid rule name ${r}`);
      }
      this.__rules__[a].enabled = !0, n.push(r);
    }), this.__cache__ = null, n;
  }
  enableOnly(e, t = !1) {
    Array.isArray(e) || (e = [e]), this.__rules__.forEach((n) => {
      n.enabled = !1;
    }), this.enable(e, t);
  }
  disable(e, t = !1) {
    Array.isArray(e) || (e = [e]);
    let n = [];
    return e.forEach((r) => {
      let a = this.__find__(r);
      if (a < 0) {
        if (t) return;
        throw Error(`Rules manager: invalid rule name ${r}`);
      }
      this.__rules__[a].enabled = !1, n.push(r);
    }), this.__cache__ = null, n;
  }
  getRules(e) {
    return this.__cache__ || this.__compile__(), this.__cache__[e] || [];
  }
}, qe = {};
qe.code_inline = function(e, t, n, r, a) {
  let i = e[t];
  return `<code${a.renderAttrs(i)}>${$e(i.content)}</code>`;
}, qe.code_block = function(e, t, n, r, a) {
  let i = e[t];
  return `<pre${a.renderAttrs(i)}><code>${$e(e[t].content)}</code></pre>
`;
}, qe.fence = function(e, t, n, r, a) {
  let i = e[t], s = i.info ? Ge(i.info).trim() : "", o = "", l = "";
  if (s) {
    let d = s.split(/(\s+)/g);
    o = d[0], l = d.slice(2).join("");
  }
  let c;
  if (c = n.highlight && n.highlight(i.content, o, l) || $e(i.content), c.indexOf("<pre") === 0) return c + `
`;
  if (s) {
    let d = i.attrIndex("class"), p = i.attrs ? i.attrs.slice() : [];
    d < 0 ? p.push(["class", `${n.langPrefix}${o}`]) : (p[d] = [p[d][0], p[d][1]], p[d][1] += ` ${n.langPrefix}${o}`);
    let f = { attrs: p };
    return `<pre><code${a.renderAttrs(f)}>${c}</code></pre>
`;
  }
  return `<pre><code${a.renderAttrs(i)}>${c}</code></pre>
`;
}, qe.image = function(e, t, n, r, a) {
  let i = e[t];
  return i.attrs[i.attrIndex("alt")][1] = a.renderInlineAsText(i.children, n, r), a.renderToken(e, t, n);
}, qe.hardbreak = function(e, t, n) {
  return n.xhtmlOut ? `<br />
` : `<br>
`;
}, qe.softbreak = function(e, t, n) {
  return n.breaks ? n.xhtmlOut ? `<br />
` : `<br>
` : `
`;
}, qe.text = function(e, t) {
  return $e(e[t].content);
}, qe.html_block = function(e, t) {
  return e[t].content;
}, qe.html_inline = function(e, t) {
  return e[t].content;
};
var cr = class {
  constructor() {
    N(this, "rules", Object.assign({}, qe));
  }
  renderAttrs(e) {
    let t, n, r;
    if (!e.attrs) return "";
    for (r = "", t = 0, n = e.attrs.length; t < n; t++) r += ` ${$e(e.attrs[t][0])}="${$e(String(e.attrs[t][1]))}"`;
    return r;
  }
  renderToken(e, t, n) {
    let r = e[t], a = "";
    if (r.hidden) return "";
    let i = t - 1;
    for (; i >= 0 && e[i].hidden && e[i].nesting === 0; ) i--;
    r.block && r.nesting !== -1 && i >= 0 && e[i].hidden && e[i].nesting === -1 && (a += `
`), a += (r.nesting === -1 ? "</" : "<") + r.tag, a += this.renderAttrs(r), r.nesting === 0 && n.xhtmlOut && (a += " /");
    let s = !1;
    if (r.block && (s = !0, r.nesting === 1)) {
      let o = t + 1;
      for (; o < e.length && e[o].hidden && e[o].nesting === 0; ) o++;
      if (o < e.length) {
        let l = e[o];
        (l.type === "inline" || l.hidden || l.nesting === -1 && l.tag === r.tag) && (s = !1);
      }
    }
    return a += s ? `>
` : ">", a;
  }
  renderInline(e, t, n) {
    let r = "", a = this.rules;
    for (let i = 0, s = e.length; i < s; i++) {
      let o = e[i].type;
      a[o] === void 0 ? r += this.renderToken(e, i, t) : r += a[o](e, i, t, n, this);
    }
    return r;
  }
  renderInlineAsText(e, t, n) {
    let r = "";
    for (let a = 0, i = e.length; a < i; a++) switch (e[a].type) {
      case "text":
      case "code_inline":
        r += e[a].content;
        break;
      case "image":
        r += this.renderInlineAsText(e[a].children, t, n);
        break;
      case "html_inline":
      case "html_block":
        r += e[a].content;
        break;
      case "softbreak":
      case "hardbreak":
        r += `
`;
    }
    return r;
  }
  render(e, t, n) {
    let r = "", a = this.rules;
    for (let i = 0, s = e.length; i < s; i++) {
      let o = e[i].type;
      o === "inline" ? r += this.renderInline(e[i].children, t, n) : a[o] === void 0 ? r += this.renderToken(e, i, t) : r += a[o](e, i, t, n, this);
    }
    return r;
  }
}, ur = class {
  constructor(e, t, n) {
    N(this, "tokens", []), N(this, "inlineMode", !1), N(this, "Token", Ue), this.src = e, this.env = n, this.md = t;
  }
}, Ai = /\r\n?/g, Ni = /\0/g;
function Di(e) {
  let t;
  t = e.src.replace(Ai, `
`), t = t.replace(Ni, "�"), e.src = t;
}
function Si(e) {
  let t;
  e.inlineMode ? (t = new e.Token("inline", "", 0), t.content = e.src, t.map = [0, 1], t.children = [], e.tokens.push(t)) : e.md.block.parse(e.src, e.md, e.env, e.tokens);
}
function Ti(e) {
  let t = e.tokens, n = 0;
  for (let r = 0; r < t.length; r++) t[r].type !== "reference_definition" && (r !== n && (t[n] = t[r]), n++);
  t.length !== n && (t.length = n);
}
function Fi(e) {
  let t = e.tokens;
  for (let n = 0, r = t.length; n < r; n++) {
    let a = t[n];
    a.type === "inline" && e.md.inline.parse(a.content, e.md, e.env, a.children);
  }
}
function Mi(e) {
  return /^<a[>\s]/i.test(e);
}
function Ii(e) {
  return /^<\/a\s*>/i.test(e);
}
function Bi(e) {
  let t = e.tokens;
  if (e.md.options.linkify) for (let n = 0, r = t.length; n < r; n++) {
    if (t[n].type !== "inline" || !e.md.linkify.test(t[n].content)) continue;
    let a = t[n].children, i = [], s = 0;
    for (let o = a.length - 1; o >= 0; o--) {
      let l = a[o];
      if (l.type === "link_close") for (o--; a[o].level !== l.level && a[o].type !== "link_open"; ) o--;
      else if (l.type === "html_inline" && (Mi(l.content) && s > 0 && s--, Ii(l.content) && s++), !(s > 0) && l.type === "text" && e.md.linkify.test(l.content)) {
        let c = l.content, d = e.md.linkify.match(c), p = [], f = l.level, g = 0;
        d.length > 0 && d[0].index === 0 && o > 0 && a[o - 1].type === "text_special" && (d = d.slice(1));
        for (let h = 0; h < d.length; h++) {
          let w = d[h].url, x = e.md.normalizeLink(w);
          if (!e.md.validateLink(x)) continue;
          let v = d[h].text;
          v = d[h].schema ? d[h].schema === "mailto:" && !/^mailto:/i.test(v) ? e.md.normalizeLinkText(`mailto:${v}`).replace(/^mailto:/, "") : e.md.normalizeLinkText(v) : e.md.normalizeLinkText(`http://${v}`).replace(/^http:\/\//, "");
          let b = d[h].index;
          if (b > g) {
            let k = new e.Token("text", "", 0);
            k.content = c.slice(g, b), k.level = f, p.push(k);
          }
          let _ = new e.Token("link_open", "a", 1);
          _.attrs = [["href", x]], _.level = f++, _.markup = "linkify", _.info = "auto", p.push(_);
          let y = new e.Token("text", "", 0);
          y.content = v, y.level = f, p.push(y);
          let R = new e.Token("link_close", "a", -1);
          R.level = --f, R.markup = "linkify", R.info = "auto", p.push(R), g = d[h].lastIndex;
        }
        if (g < c.length) {
          let h = new e.Token("text", "", 0);
          h.content = c.slice(g), h.level = f, p.push(h);
        }
        i.push({
          index: o,
          nodes: p
        });
      }
    }
    if (i.length > 0) {
      let o = a.length;
      for (let p of i) o += p.nodes.length - 1;
      let l = Array(o), c = 0, d = 0;
      i.reverse();
      for (let p = 0; p < a.length; p++) {
        let f = i[c];
        if ((f == null ? void 0 : f.index) === p) {
          for (let g of f.nodes) l[d++] = g;
          c++;
        } else l[d++] = a[p];
      }
      t[n].children = l;
    }
  }
}
var dr = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/, Oi = /\((c|tm|r)\)/i, Li = /\((c|tm|r)\)/gi, $i = {
  c: "©",
  r: "®",
  tm: "™"
};
function Ui(e, t) {
  return $i[t.toLowerCase()];
}
function Pi(e) {
  let t = 0;
  for (let n = e.length - 1; n >= 0; n--) {
    let r = e[n];
    r.type === "text" && !t && (r.content = r.content.replace(Li, Ui)), r.type === "link_open" && r.info === "auto" && t--, r.type === "link_close" && r.info === "auto" && t++;
  }
}
function ji(e) {
  let t = 0;
  for (let n = e.length - 1; n >= 0; n--) {
    let r = e[n];
    r.type === "text" && !t && dr.test(r.content) && (r.content = r.content.replace(/\+-/g, "±").replace(/\.{2,}/g, "…").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/gm, "$1—").replace(/(^|\s)--(?=\s|$)/gm, "$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/gm, "$1–")), r.type === "link_open" && r.info === "auto" && t--, r.type === "link_close" && r.info === "auto" && t++;
  }
}
function Ji(e) {
  let t;
  if (e.md.options.typographer) for (t = e.tokens.length - 1; t >= 0; t--) e.tokens[t].type === "inline" && (Oi.test(e.tokens[t].content) && Pi(e.tokens[t].children), dr.test(e.tokens[t].content) && ji(e.tokens[t].children));
}
var Wi = /['"]/, gn = /['"]/g, mn = "’", Zi = 1e3;
function bn(e, t, n) {
  for (; e.length > n; ) {
    let r = e.pop();
    r.isSingleQuote ? t.single = r.prevSameQuoteIdx : t.double = r.prevSameQuoteIdx;
  }
}
function lt(e, t, n, r) {
  e[t] || (e[t] = []), e[t].push({
    pos: n,
    ch: r
  });
}
function Hi(e, t) {
  let n = "", r = 0;
  t.sort((a, i) => a.pos - i.pos);
  for (let a = 0; a < t.length; a++) {
    let i = t[a];
    n += e.slice(r, i.pos) + i.ch, r = i.pos + 1;
  }
  return n + e.slice(r);
}
function Ki(e, t) {
  let n, r = [], a = {
    single: -1,
    double: -1
  }, i = {};
  for (let s = 0; s < e.length; s++) {
    let o = e[s], l = e[s].level;
    for (n = r.length - 1; n >= 0 && !(r[n].level <= l); n--) ;
    if (bn(r, a, n + 1), o.type !== "text") continue;
    let c = o.content, d = 0, p = c.length;
    e: for (; d < p; ) {
      gn.lastIndex = d;
      let f = gn.exec(c);
      if (!f) break;
      let g = !0, h = !0;
      d = f.index + 1;
      let w = f[0] === "'", x = 32;
      if (f.index - 1 >= 0) x = c.charCodeAt(f.index - 1);
      else for (n = s - 1; n >= 0 && e[n].type !== "softbreak" && e[n].type !== "hardbreak"; n--) if (e[n].content) {
        x = e[n].content.charCodeAt(e[n].content.length - 1);
        break;
      }
      let v = 32;
      if (d < p) v = c.charCodeAt(d);
      else for (n = s + 1; n < e.length && e[n].type !== "softbreak" && e[n].type !== "hardbreak"; n++) if (e[n].content) {
        v = e[n].content.charCodeAt(0);
        break;
      }
      let b = at(x) || rt(x), _ = at(v) || rt(v), y = nt(x), R = nt(v);
      if (R ? g = !1 : _ && (y || b || (g = !1)), y ? h = !1 : b && (R || _ || (h = !1)), v === 34 && f[0] === '"' && x >= 48 && x <= 57 && (h = g = !1), g && h && (g = b, h = _), !g && !h) w && lt(i, s, f.index, mn);
      else {
        if (h && (n = w ? a.single : a.double, n >= 0 && r[n].level === l)) {
          let k = r[n], F, z;
          w ? (F = t.md.options.quotes[2], z = t.md.options.quotes[3]) : (F = t.md.options.quotes[0], z = t.md.options.quotes[1]), lt(i, s, f.index, z), lt(i, k.tokenIdx, k.contentPos, F), bn(r, a, n);
          continue e;
        }
        if (g) {
          if (r.length >= Zi) return;
          r.push({
            tokenIdx: s,
            contentPos: f.index,
            isSingleQuote: w,
            level: l,
            prevSameQuoteIdx: w ? a.single : a.double
          }), w ? a.single = r.length - 1 : a.double = r.length - 1;
        } else h && w && lt(i, s, f.index, mn);
      }
    }
  }
  Object.keys(i).forEach(function(s) {
    let o = Number(s);
    e[o].content = Hi(e[o].content, i[s]);
  });
}
function Gi(e) {
  if (e.md.options.typographer) for (let t = e.tokens.length - 1; t >= 0; t--) e.tokens[t].type === "inline" && Wi.test(e.tokens[t].content) && Ki(e.tokens[t].children, e);
}
function Yi(e) {
  let t, n, r = e.length;
  for (t = 0; t < r; t++) e[t].type === "text_special" && (e[t].type = "text");
  for (t = n = 0; t < r; t++) e[t].type === "text" && t + 1 < r && e[t + 1].type === "text" ? e[t + 1].content = e[t].content + e[t + 1].content : (t !== n && (e[n] = e[t]), n++);
  t !== n && (e.length = n);
}
function Xi(e) {
  let t, n, r = e.tokens, a = r.length;
  for (let i = 0; i < a; i++) {
    if (r[i].type !== "inline") continue;
    let s = r[i].children, o = s.length;
    for (t = 0; t < o; t++) s[t].type === "text_special" && (s[t].type = "text"), s[t].children && Yi(s[t].children);
    for (t = n = 0; t < o; t++) s[t].type === "text" && t + 1 < o && s[t + 1].type === "text" ? s[t + 1].content = s[t].content + s[t + 1].content : (t !== n && (s[n] = s[t]), n++);
    t !== n && (s.length = n);
  }
}
var Rt = [
  ["normalize", Di],
  ["block", Si],
  ["strip_references", Ti],
  ["inline", Fi],
  ["linkify", Bi],
  ["replacements", Ji],
  ["smartquotes", Gi],
  ["text_join", Xi]
], hr = class {
  constructor() {
    N(this, "ruler", new it()), N(this, "State", ur);
    for (let e = 0; e < Rt.length; e++) this.ruler.push(Rt[e][0], Rt[e][1]);
  }
  process(e) {
    let t = this.ruler.getRules("");
    for (let n = 0, r = t.length; n < r; n++) t[n](e);
  }
}, pr = class {
  constructor(e, t, n, r) {
    N(this, "bMarks", []), N(this, "eMarks", []), N(this, "tShift", []), N(this, "sCount", []), N(this, "bsCount", []), N(this, "blkIndent", 0), N(this, "line", 0), N(this, "lineMax", 0), N(this, "tight", !1), N(this, "listIndent", -1), N(this, "parentType", "root"), N(this, "level", 0), N(this, "Token", Ue), this.src = e, this.md = t, this.env = n, this.tokens = r;
    let a = this.src;
    for (let i = 0, s = 0, o = 0, l = 0, c = a.length, d = !1; s < c; s++) {
      let p = a.charCodeAt(s);
      if (!d) {
        if (ae(p)) {
          o++, p === 9 ? l += 4 - l % 4 : l++;
          continue;
        }
        d = !0;
      }
      (p === 10 || s === c - 1) && (p !== 10 && s++, this.bMarks.push(i), this.eMarks.push(s), this.tShift.push(o), this.sCount.push(l), this.bsCount.push(0), d = !1, o = 0, l = 0, i = s + 1);
    }
    this.bMarks.push(a.length), this.eMarks.push(a.length), this.tShift.push(0), this.sCount.push(0), this.bsCount.push(0), this.lineMax = this.bMarks.length - 1;
  }
  push(e, t, n) {
    let r = new Ue(e, t, n);
    return r.block = !0, n < 0 && this.level--, r.level = this.level, n > 0 && this.level++, this.tokens.push(r), r;
  }
  isEmpty(e) {
    return this.bMarks[e] + this.tShift[e] >= this.eMarks[e];
  }
  skipEmptyLines(e) {
    for (let t = this.lineMax; e < t && !(this.bMarks[e] + this.tShift[e] < this.eMarks[e]); e++) ;
    return e;
  }
  skipSpaces(e) {
    for (let t = this.src.length; e < t && ae(this.src.charCodeAt(e)); e++) ;
    return e;
  }
  skipSpacesBack(e, t) {
    if (e <= t) return e;
    for (; e > t; ) if (!ae(this.src.charCodeAt(--e))) return e + 1;
    return e;
  }
  skipChars(e, t) {
    for (let n = this.src.length; e < n && this.src.charCodeAt(e) === t; e++) ;
    return e;
  }
  skipCharsBack(e, t, n) {
    if (e <= n) return e;
    for (; e > n; ) if (t !== this.src.charCodeAt(--e)) return e + 1;
    return e;
  }
  getLines(e, t, n, r) {
    if (e >= t) return "";
    let a = Array(t - e);
    for (let i = 0, s = e; s < t; s++, i++) {
      let o = 0, l = this.bMarks[s], c = l, d;
      for (d = s + 1 < t || r ? this.eMarks[s] + 1 : this.eMarks[s]; c < d && o < n; ) {
        let p = this.src.charCodeAt(c);
        if (ae(p)) p === 9 ? o += 4 - (o + this.bsCount[s]) % 4 : o++;
        else if (c - l < this.tShift[s]) o++;
        else break;
        c++;
      }
      o > n ? a[i] = Array(o - n + 1).join(" ") + this.src.slice(c, d) : a[i] = this.src.slice(c, d);
    }
    return a.join("");
  }
}, Vi = 65536;
function Et(e, t) {
  let n = e.bMarks[t] + e.tShift[t], r = e.eMarks[t];
  return e.src.slice(n, r);
}
function vn(e) {
  let t = [], n = e.length, r = 0, a = e.charCodeAt(r), i = !1, s = 0, o = "";
  for (; r < n; ) a === 124 && (i ? (o += e.substring(s, r - 1), s = r) : (t.push(o + e.substring(s, r)), o = "", s = r + 1)), i = a === 92, r++, a = e.charCodeAt(r);
  return t.push(o + e.substring(s)), t;
}
function Qi(e, t, n, r) {
  if (t + 2 > n) return !1;
  let a = t + 1;
  if (e.sCount[a] < e.blkIndent || e.sCount[a] - e.blkIndent >= 4) return !1;
  let i = e.bMarks[a] + e.tShift[a];
  if (i >= e.eMarks[a]) return !1;
  let s = e.src.charCodeAt(i++);
  if (s !== 124 && s !== 45 && s !== 58 || i >= e.eMarks[a]) return !1;
  let o = e.src.charCodeAt(i++);
  if (o !== 124 && o !== 45 && o !== 58 && !ae(o) || s === 45 && ae(o)) return !1;
  for (; i < e.eMarks[a]; ) {
    let y = e.src.charCodeAt(i);
    if (y !== 124 && y !== 45 && y !== 58 && !ae(y)) return !1;
    i++;
  }
  let l = Et(e, t + 1), c = l.split("|"), d = [];
  for (let y = 0; y < c.length; y++) {
    let R = c[y].trim();
    if (!R) {
      if (y === 0 || y === c.length - 1) continue;
      return !1;
    }
    if (!/^:?-+:?$/.test(R)) return !1;
    R.charCodeAt(R.length - 1) === 58 ? d.push(R.charCodeAt(0) === 58 ? "center" : "right") : R.charCodeAt(0) === 58 ? d.push("left") : d.push("");
  }
  if (l = Et(e, t).trim(), l.indexOf("|") === -1 || e.sCount[t] - e.blkIndent >= 4) return !1;
  c = vn(l), c.length && c[0] === "" && c.shift(), c.length && c[c.length - 1] === "" && c.pop();
  let p = c.length;
  if (p === 0 || p !== d.length) return !1;
  if (r) return !0;
  let f = e.parentType;
  e.parentType = "table";
  let g = e.md.block.ruler.getRules("blockquote"), h = e.push("table_open", "table", 1), w = [t, 0];
  h.map = w;
  let x = e.push("thead_open", "thead", 1);
  x.map = [t, t + 1];
  let v = e.push("tr_open", "tr", 1);
  v.map = [t, t + 1];
  for (let y = 0; y < c.length; y++) {
    let R = e.push("th_open", "th", 1);
    d[y] && (R.attrs = [["style", `text-align:${d[y]}`]]);
    let k = e.push("inline", "", 0);
    k.content = c[y].trim(), k.children = [], e.push("th_close", "th", -1);
  }
  e.push("tr_close", "tr", -1), e.push("thead_close", "thead", -1);
  let b, _ = 0;
  for (a = t + 2; a < n && !(e.sCount[a] < e.blkIndent); a++) {
    let y = !1;
    for (let k = 0, F = g.length; k < F; k++) if (g[k](e, a, n, !0)) {
      y = !0;
      break;
    }
    if (y || (l = Et(e, a).trim(), !l) || e.sCount[a] - e.blkIndent >= 4 || (c = vn(l), c.length && c[0] === "" && c.shift(), c.length && c[c.length - 1] === "" && c.pop(), _ += p - c.length, _ > Vi)) break;
    if (a === t + 2) {
      let k = e.push("tbody_open", "tbody", 1);
      k.map = b = [t + 2, 0];
    }
    let R = e.push("tr_open", "tr", 1);
    R.map = [a, a + 1];
    for (let k = 0; k < p; k++) {
      let F = e.push("td_open", "td", 1);
      d[k] && (F.attrs = [["style", `text-align:${d[k]}`]]);
      let z = e.push("inline", "", 0);
      z.content = c[k] ? c[k].trim() : "", z.children = [], e.push("td_close", "td", -1);
    }
    e.push("tr_close", "tr", -1);
  }
  return b && (e.push("tbody_close", "tbody", -1), b[1] = a), e.push("table_close", "table", -1), w[1] = a, e.parentType = f, e.line = a, !0;
}
function es(e, t, n) {
  if (e.sCount[t] - e.blkIndent < 4) return !1;
  let r = t + 1, a = r;
  for (; r < n; ) if (e.isEmpty(r)) r++;
  else if (e.sCount[r] - e.blkIndent >= 4) r++, a = r;
  else break;
  e.line = a;
  let i = e.push("code_block", "code", 0);
  return i.content = e.getLines(t, a, 4 + e.blkIndent, !1) + `
`, i.map = [t, e.line], !0;
}
function ts(e, t, n, r) {
  let a = e.bMarks[t] + e.tShift[t], i = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4 || a + 3 > i) return !1;
  let s = e.src.charCodeAt(a);
  if (s !== 126 && s !== 96) return !1;
  let o = a;
  a = e.skipChars(a, s);
  let l = a - o;
  if (l < 3) return !1;
  let c = e.src.slice(o, a), d = e.src.slice(a, i);
  if (s === 96 && d.indexOf(String.fromCharCode(s)) >= 0) return !1;
  if (r) return !0;
  let p = t, f = !1;
  for (; p++, !(p >= n || (a = o = e.bMarks[p] + e.tShift[p], i = e.eMarks[p], a < i && e.sCount[p] < e.blkIndent)); ) if (e.src.charCodeAt(a) === s && !(e.sCount[p] - e.blkIndent >= 4) && (a = e.skipChars(a, s), !(a - o < l) && (a = e.skipSpaces(a), !(a < i)))) {
    f = !0;
    break;
  }
  l = e.sCount[t], e.line = p + +!!f;
  let g = e.push("fence", "code", 0);
  return g.info = d, g.content = e.getLines(t + 1, p, l, !0), g.markup = c, g.map = [t, e.line], !0;
}
function ns(e, t, n, r) {
  let a = e.bMarks[t] + e.tShift[t], i = e.eMarks[t], s = e.lineMax;
  if (e.sCount[t] - e.blkIndent >= 4 || e.src.charCodeAt(a) !== 62) return !1;
  if (r) return !0;
  let o = [], l = [], c = [], d = [], p = e.md.block.ruler.getRules("blockquote"), f = e.parentType;
  e.parentType = "blockquote";
  let g = !1, h;
  for (h = t; h < n; h++) {
    let _ = e.sCount[h] < e.blkIndent;
    if (a = e.bMarks[h] + e.tShift[h], i = e.eMarks[h], a >= i) break;
    if (e.src.charCodeAt(a++) === 62 && !_) {
      let R = e.sCount[h] + 1, k, F;
      e.src.charCodeAt(a) === 32 ? (a++, R++, F = !1, k = !0) : e.src.charCodeAt(a) === 9 ? (k = !0, (e.bsCount[h] + R) % 4 == 3 ? (a++, R++, F = !1) : F = !0) : k = !1;
      let z = R;
      for (o.push(e.bMarks[h]), e.bMarks[h] = a; a < i; ) {
        let A = e.src.charCodeAt(a);
        if (ae(A)) A === 9 ? z += 4 - (z + e.bsCount[h] + +!!F) % 4 : z++;
        else break;
        a++;
      }
      g = a >= i, l.push(e.bsCount[h]), e.bsCount[h] = e.sCount[h] + 1 + +!!k, c.push(e.sCount[h]), e.sCount[h] = z - R, d.push(e.tShift[h]), e.tShift[h] = a - e.bMarks[h];
      continue;
    }
    if (g) break;
    let y = !1;
    for (let R = 0, k = p.length; R < k; R++) if (p[R](e, h, n, !0)) {
      y = !0;
      break;
    }
    if (y) {
      e.lineMax = h, e.blkIndent !== 0 && (o.push(e.bMarks[h]), l.push(e.bsCount[h]), d.push(e.tShift[h]), c.push(e.sCount[h]), e.sCount[h] -= e.blkIndent);
      break;
    }
    o.push(e.bMarks[h]), l.push(e.bsCount[h]), d.push(e.tShift[h]), c.push(e.sCount[h]), e.sCount[h] = -1;
  }
  let w = e.blkIndent;
  e.blkIndent = 0;
  let x = e.push("blockquote_open", "blockquote", 1);
  x.markup = ">";
  let v = [t, 0];
  x.map = v, e.md.block.tokenize(e, t, h);
  let b = e.push("blockquote_close", "blockquote", -1);
  b.markup = ">", e.lineMax = s, e.parentType = f, v[1] = e.line;
  for (let _ = 0; _ < d.length; _++) e.bMarks[_ + t] = o[_], e.tShift[_ + t] = d[_], e.sCount[_ + t] = c[_], e.bsCount[_ + t] = l[_];
  return e.blkIndent = w, !0;
}
function rs(e, t, n, r) {
  let a = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4) return !1;
  let i = e.bMarks[t] + e.tShift[t], s = e.src.charCodeAt(i++);
  if (s !== 42 && s !== 45 && s !== 95) return !1;
  let o = 1;
  for (; i < a; ) {
    let c = e.src.charCodeAt(i++);
    if (c !== s && !ae(c)) return !1;
    c === s && o++;
  }
  if (o < 3) return !1;
  if (r) return !0;
  e.line = t + 1;
  let l = e.push("hr", "hr", 0);
  return l.map = [t, e.line], l.markup = Array(o + 1).join(String.fromCharCode(s)), !0;
}
function kn(e, t) {
  let n = e.eMarks[t], r = e.bMarks[t] + e.tShift[t], a = e.src.charCodeAt(r++);
  return a !== 42 && a !== 45 && a !== 43 || r < n && !ae(e.src.charCodeAt(r)) ? -1 : r;
}
function _n(e, t) {
  let n = e.bMarks[t] + e.tShift[t], r = e.eMarks[t], a = n;
  if (a + 1 >= r) return -1;
  let i = e.src.charCodeAt(a++);
  if (i < 48 || i > 57) return -1;
  for (; ; ) {
    if (a >= r) return -1;
    if (i = e.src.charCodeAt(a++), i >= 48 && i <= 57) {
      if (a - n >= 10) return -1;
    } else {
      if (i === 41 || i === 46) break;
      return -1;
    }
  }
  return a < r && (i = e.src.charCodeAt(a), !ae(i)) ? -1 : a;
}
function as(e, t) {
  let n = e.level + 2;
  for (let r = t + 2, a = e.tokens.length - 2; r < a; r++) e.tokens[r].level === n && e.tokens[r].type === "paragraph_open" && (e.tokens[r + 2].hidden = !0, e.tokens[r].hidden = !0, r += 2);
}
function is(e, t, n, r) {
  let a, i, s, o, l = t, c = !0;
  if (e.sCount[l] - e.blkIndent >= 4 || e.listIndent >= 0 && e.sCount[l] - e.listIndent >= 4 && e.sCount[l] < e.blkIndent) return !1;
  let d = !1;
  r && e.parentType === "paragraph" && e.sCount[l] >= e.blkIndent && (d = !0);
  let p, f, g;
  if ((g = _n(e, l)) >= 0) {
    if (p = !0, s = e.bMarks[l] + e.tShift[l], f = Number(e.src.slice(s, g - 1)), d && f !== 1) return !1;
  } else if ((g = kn(e, l)) >= 0) p = !1;
  else return !1;
  if (d && e.skipSpaces(g) >= e.eMarks[l]) return !1;
  if (r) return !0;
  let h = e.src.charCodeAt(g - 1), w = e.tokens.length;
  p ? (o = e.push("ordered_list_open", "ol", 1), f !== 1 && (o.attrs = [["start", f]])) : o = e.push("bullet_list_open", "ul", 1);
  let x = [l, 0];
  o.map = x, o.markup = String.fromCharCode(h);
  let v = !1, b = e.md.block.ruler.getRules("list"), _ = e.parentType;
  for (e.parentType = "list"; l < n; ) {
    i = g, a = e.eMarks[l];
    let y = e.sCount[l] + g - (e.bMarks[l] + e.tShift[l]), R = y;
    for (; i < a; ) {
      let ie = e.src.charCodeAt(i);
      if (ie === 9) R += 4 - (R + e.bsCount[l]) % 4;
      else if (ie === 32) R++;
      else break;
      i++;
    }
    let k = i, F;
    F = k >= a ? 1 : R - y, F > 4 && (F = 1);
    let z = y + F;
    o = e.push("list_item_open", "li", 1), o.markup = String.fromCharCode(h);
    let A = [l, 0];
    o.map = A, p && (o.info = e.src.slice(s, g - 1));
    let O = e.tight, j = e.tShift[l], B = e.sCount[l], J = e.listIndent;
    if (e.listIndent = e.blkIndent, e.blkIndent = z, e.tight = !0, e.tShift[l] = k - e.bMarks[l], e.sCount[l] = R, k >= a && e.isEmpty(l + 1) ? e.line = Math.min(e.line + 2, n) : e.md.block.tokenize(e, l, n), (!e.tight || v) && (c = !1), v = e.line - l > 1 && e.isEmpty(e.line - 1), e.blkIndent = e.listIndent, e.listIndent = J, e.tShift[l] = j, e.sCount[l] = B, e.tight = O, o = e.push("list_item_close", "li", -1), o.markup = String.fromCharCode(h), l = e.line, A[1] = l, l >= n || e.sCount[l] < e.blkIndent || e.sCount[l] - e.blkIndent >= 4) break;
    let H = !1;
    for (let ie = 0, E = b.length; ie < E; ie++) if (b[ie](e, l, n, !0)) {
      H = !0;
      break;
    }
    if (H) break;
    if (p) {
      if (g = _n(e, l), g < 0) break;
      s = e.bMarks[l] + e.tShift[l];
    } else if (g = kn(e, l), g < 0) break;
    if (h !== e.src.charCodeAt(g - 1)) break;
  }
  return o = p ? e.push("ordered_list_close", "ol", -1) : e.push("bullet_list_close", "ul", -1), o.markup = String.fromCharCode(h), x[1] = l, e.line = l, e.parentType = _, c && as(e, w), !0;
}
var qt = 999;
function ss(e) {
  let t = e.length;
  for (let n = 0; n < e.length - 1; n++) {
    let r = e.charCodeAt(n);
    if (r < 55296 || r > 56319) continue;
    let a = e.charCodeAt(n + 1);
    a >= 56320 && a <= 57343 && (t--, n++);
  }
  return t;
}
function Ve(e, t) {
  return Math.min(e.eMarks[t] + 1, e.src.length);
}
function ct(e, t) {
  let n = e.lineMax;
  if (t >= n || e.isEmpty(t)) return -1;
  let r = !1;
  if (e.sCount[t] - e.blkIndent > 3 && (r = !0), e.sCount[t] < 0 && (r = !0), !r) {
    let a = e.md.block.ruler.getRules("reference"), i = e.parentType;
    e.parentType = "reference";
    let s = !1;
    for (let o = 0, l = a.length; o < l; o++) if (a[o](e, t, n, !0)) {
      s = !0;
      break;
    }
    if (e.parentType = i, s) return -1;
  }
  return e.bMarks[t] + e.tShift[t];
}
function os(e, t, n, r) {
  let a = e.src, i = e.bMarks[t] + e.tShift[t], s = t + 1;
  if (e.sCount[t] - e.blkIndent >= 4 || a.charCodeAt(i) !== 91) return !1;
  let o = Ve(e, t), l = "", c = -1, d = ++i;
  for (; i < o; ) {
    if (l.length + i - d > qt * 2) return !1;
    let k = a.charCodeAt(i);
    if (k === 91) return !1;
    if (k === 93) {
      c = i;
      break;
    }
    if (k === 92 && (k = a.charCodeAt(++i)), k === 10 && i < o) {
      let F = ct(e, s);
      if (F < 0) return !1;
      l += a.slice(d, o), i = d = F, o = Ve(e, s++);
    } else i++;
  }
  if (c < 0 || a.charCodeAt(c + 1) !== 58 || (l += a.slice(d, c), l.length > qt && ss(l) > qt)) return !1;
  for (i = c + 2; i < o; ) {
    let k = a.charCodeAt(i);
    if (k === 10) {
      let F = ct(e, s);
      if (F < 0) break;
      i = F, o = Ve(e, s++);
    } else if (ae(k)) i++;
    else break;
  }
  let p = e.md.helpers.parseLinkDestination(a, i, o);
  if (!p.ok) return !1;
  let f = e.md.normalizeLink(p.str);
  if (!e.md.validateLink(f)) return !1;
  i = p.pos;
  let g = i, h = o, w = s;
  for (; i < o; ) {
    let k = a.charCodeAt(i);
    if (k === 10) {
      let F = ct(e, s);
      if (F < 0) break;
      i = F, o = Ve(e, s++);
    } else if (ae(k)) i++;
    else break;
  }
  let x = i, v = e.md.helpers.parseLinkTitle(a, i, o);
  for (; v.can_continue; ) {
    let k = ct(e, s);
    if (k < 0) break;
    i = k, o = Ve(e, s++), v = e.md.helpers.parseLinkTitle(a, i, o, v);
  }
  let b;
  for (x !== g && v.ok ? (b = v.str, i = v.pos) : (b = "", i = g, o = h, s = w); i < o && ae(a.charCodeAt(i)); ) i++;
  if (i < o && a.charCodeAt(i) !== 10 && b) for (b = "", i = g, o = h, s = w; i < o && ae(a.charCodeAt(i)); ) i++;
  if (i < o && a.charCodeAt(i) !== 10) return !1;
  let _ = _t(l);
  if (!_) return !1;
  if (r) return !0;
  e.env.references === void 0 && (e.env.references = {}), e.env.references[_] === void 0 && (e.env.references[_] = {
    title: b,
    href: f
  });
  let y = e.push("reference_definition", "", 0);
  y.map = [t, s], y.hidden = !0;
  let R = /* @__PURE__ */ Object.create(null);
  return R.label = _, y.meta = R, e.line = s, !0;
}
var ls = /* @__PURE__ */ "address.article.aside.base.basefont.blockquote.body.caption.center.col.colgroup.dd.details.dialog.dir.div.dl.dt.fieldset.figcaption.figure.footer.form.frame.frameset.h1.h2.h3.h4.h5.h6.head.header.hr.html.iframe.legend.li.link.main.menu.menuitem.nav.noframes.ol.optgroup.option.p.param.search.section.summary.table.tbody.td.tfoot.th.thead.title.tr.track.ul".split("."), cs = `<[A-Za-z][A-Za-z0-9\\-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*"))?)*\\s*\\/?>`, us = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>", fr = RegExp(`^(?:${cs}|${us})`), Le = [
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
    RegExp(`^</?(${ls.join("|")})(?=(\\s|/?>|$))`, "i"),
    /^$/,
    !0
  ],
  [
    RegExp(`${fr.source}\\s*$`),
    /^$/,
    !1
  ]
];
function ds(e, t, n, r) {
  let a = e.bMarks[t] + e.tShift[t], i = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4 || !e.md.options.html || e.src.charCodeAt(a) !== 60) return !1;
  let s = e.src.slice(a, i), o = 0;
  for (; o < Le.length && !Le[o][0].test(s); o++) ;
  if (o === Le.length) return !1;
  if (r) return Le[o][2];
  let l = t + 1, c = Le[o][1].test("");
  if (!Le[o][1].test(s)) {
    for (; l < n && !(e.sCount[l] < e.blkIndent && (c || !e.isEmpty(l))); l++) if (a = e.bMarks[l] + e.tShift[l], i = e.eMarks[l], s = e.src.slice(a, i), Le[o][1].test(s)) {
      s.length !== 0 && l++;
      break;
    }
  }
  e.line = l;
  let d = e.push("html_block", "", 0);
  return d.map = [t, l], d.content = e.getLines(t, l, e.blkIndent, !0), !0;
}
function hs(e, t, n, r) {
  let a = e.bMarks[t] + e.tShift[t], i = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4) return !1;
  let s = e.src.charCodeAt(a);
  if (s !== 35 || a >= i) return !1;
  let o = 1;
  for (s = e.src.charCodeAt(++a); s === 35 && a < i && o <= 6; ) o++, s = e.src.charCodeAt(++a);
  if (o > 6 || a < i && !ae(s)) return !1;
  if (r) return !0;
  i = e.skipSpacesBack(i, a);
  let l = e.skipCharsBack(i, 35, a);
  l > a && ae(e.src.charCodeAt(l - 1)) && (i = l), e.line = t + 1;
  let c = e.push("heading_open", `h${o}`, 1);
  c.markup = "########".slice(0, o), c.map = [t, e.line];
  let d = e.push("inline", "", 0);
  d.content = xt(e.src.slice(a, i)), d.map = [t, e.line], d.children = [];
  let p = e.push("heading_close", `h${o}`, -1);
  return p.markup = "########".slice(0, o), !0;
}
function ps(e, t, n) {
  let r = e.md.block.ruler.getRules("paragraph");
  if (e.sCount[t] - e.blkIndent >= 4) return !1;
  let a = e.parentType;
  e.parentType = "paragraph";
  let i = 0, s, o = t + 1;
  for (; o < n && !e.isEmpty(o); o++) {
    if (e.sCount[o] - e.blkIndent > 3) continue;
    if (e.sCount[o] >= e.blkIndent) {
      let g = e.bMarks[o] + e.tShift[o], h = e.eMarks[o];
      if (g < h && (s = e.src.charCodeAt(g), (s === 45 || s === 61) && (g = e.skipChars(g, s), g = e.skipSpaces(g), g >= h))) {
        i = s === 61 ? 1 : 2;
        break;
      }
    }
    if (e.sCount[o] < 0) continue;
    let f = !1;
    for (let g = 0, h = r.length; g < h; g++) if (r[g](e, o, n, !0)) {
      f = !0;
      break;
    }
    if (f) break;
  }
  if (!i) return e.parentType = a, !1;
  let l = xt(e.getLines(t, o, e.blkIndent, !1));
  e.line = o + 1;
  let c = e.push("heading_open", `h${i}`, 1);
  c.markup = String.fromCharCode(s), c.map = [t, e.line];
  let d = e.push("inline", "", 0);
  d.content = l, d.map = [t, e.line - 1], d.children = [];
  let p = e.push("heading_close", `h${i}`, -1);
  return p.markup = String.fromCharCode(s), e.parentType = a, !0;
}
function fs(e, t, n) {
  let r = e.md.block.ruler.getRules("paragraph"), a = e.parentType, i = t + 1;
  for (e.parentType = "paragraph"; i < n && !e.isEmpty(i); i++) {
    if (e.sCount[i] - e.blkIndent > 3 || e.sCount[i] < 0) continue;
    let c = !1;
    for (let d = 0, p = r.length; d < p; d++) if (r[d](e, i, n, !0)) {
      c = !0;
      break;
    }
    if (c) break;
  }
  let s = xt(e.getLines(t, i, e.blkIndent, !1));
  e.line = i;
  let o = e.push("paragraph_open", "p", 1);
  o.map = [t, e.line];
  let l = e.push("inline", "", 0);
  return l.content = s, l.map = [t, e.line], l.children = [], e.push("paragraph_close", "p", -1), e.parentType = a, !0;
}
var ut = [
  [
    "table",
    Qi,
    ["paragraph", "reference"]
  ],
  ["code", es],
  [
    "fence",
    ts,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "blockquote",
    ns,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "hr",
    rs,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "list",
    is,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  ["reference", os],
  [
    "html_block",
    ds,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  [
    "heading",
    hs,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  ["lheading", ps],
  ["paragraph", fs]
], gr = class {
  constructor() {
    N(this, "ruler", new it()), N(this, "State", pr);
    for (let e = 0; e < ut.length; e++) this.ruler.push(ut[e][0], ut[e][1], { alt: (ut[e][2] || []).slice() });
  }
  tokenize(e, t, n) {
    let r = this.ruler.getRules(""), a = r.length, i = e.md.options.maxNesting, s = t, o = !1;
    for (; s < n && (e.line = s = e.skipEmptyLines(s), !(s >= n || e.sCount[s] < e.blkIndent)); ) {
      if (e.level >= i) {
        e.line = n;
        break;
      }
      let l = e.line, c = !1;
      for (let d = 0; d < a; d++) if (c = r[d](e, s, n, !1), c) {
        if (l >= e.line) throw Error("block rule didn't increment state.line");
        break;
      }
      if (!c) throw Error("none of the block rules matched");
      e.tight = !o, e.isEmpty(e.line - 1) && (o = !0), s = e.line, s < n && e.isEmpty(s) && (o = !0, s++, e.line = s);
    }
  }
  parse(e, t, n, r) {
    if (!e) return;
    let a = new this.State(e, t, n, r);
    this.tokenize(a, a.line, a.lineMax);
  }
}, mr = class {
  constructor(e, t, n, r) {
    N(this, "pos", 0), N(this, "level", 0), N(this, "pending", ""), N(this, "pendingLevel", 0), N(this, "cache", {}), N(this, "backticks", {}), N(this, "backticksScanned", !1), N(this, "skipHtmlSpecial", !1), N(this, "linkLevel", 0), N(this, "delimiters", []), N(this, "_prev_delimiters", []), N(this, "Token", Ue), this.src = e, this.env = n, this.md = t, this.tokens = r, this.tokens_meta = Array(r.length), this.posMax = this.src.length;
  }
  pushPending() {
    let e = new Ue("text", "", 0);
    return e.content = this.pending, e.level = this.pendingLevel, this.tokens.push(e), this.pending = "", e;
  }
  push(e, t, n) {
    this.pending && this.pushPending();
    let r = new Ue(e, t, n), a;
    return n < 0 && (this.level--, this.delimiters = this._prev_delimiters.pop()), r.level = this.level, n > 0 && (this.level++, this._prev_delimiters.push(this.delimiters), this.delimiters = [], a = { delimiters: this.delimiters }), this.pendingLevel = this.level, this.tokens.push(r), this.tokens_meta.push(a), r;
  }
  scanDelims(e, t) {
    let n = this.posMax, r = this.src.charCodeAt(e), a;
    if (e === 0) a = 32;
    else if (e === 1) a = this.src.charCodeAt(0), (a & 63488) == 55296 && (a = 65533);
    else if (a = this.src.charCodeAt(e - 1), (a & 64512) == 56320) {
      let h = this.src.charCodeAt(e - 2);
      a = (h & 64512) == 55296 ? 65536 + (h - 55296 << 10) + (a - 56320) : 65533;
    } else (a & 64512) == 55296 && (a = 65533);
    let i = e;
    for (; i < n && this.src.charCodeAt(i) === r; ) i++;
    let s = i - e, o = i < n ? this.src.charCodeAt(i) : 32;
    if ((o & 64512) == 55296) {
      let h = this.src.charCodeAt(i + 1);
      o = (h & 64512) == 56320 ? 65536 + (o - 55296 << 10) + (h - 56320) : 65533;
    } else (o & 64512) == 56320 && (o = 65533);
    let l = at(a) || rt(a), c = at(o) || rt(o), d = nt(a), p = nt(o), f = !p && (!c || d || l), g = !d && (!l || p || c);
    return {
      can_open: f && (t || !g || l),
      can_close: g && (t || !f || c),
      length: s
    };
  }
};
function gs(e) {
  switch (e) {
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
function ms(e, t) {
  let n = e.pos;
  for (; n < e.posMax && !gs(e.src.charCodeAt(n)); ) n++;
  return n !== e.pos && (t || (e.pending += e.src.slice(e.pos, n)), e.pos = n, !0);
}
function bs(e) {
  return e >= 65 && e <= 90 || e >= 97 && e <= 122;
}
function vs(e) {
  return e >= 65 && e <= 90 || e >= 97 && e <= 122 || e >= 48 && e <= 57 || e === 43 || e === 45 || e === 46;
}
function ks(e, t) {
  if (!e.md.options.linkify || e.linkLevel > 0) return !1;
  let n = e.pos, r = e.posMax;
  if (n + 3 > r || e.src.charCodeAt(n) !== 58 || e.src.charCodeAt(n + 1) !== 47 || e.src.charCodeAt(n + 2) !== 47) return !1;
  let a = n - Math.min(10, e.pending.length, n), i = n;
  for (; i > a && vs(e.src.charCodeAt(i - 1)); ) i--;
  if (i === n || !bs(e.src.charCodeAt(i))) return !1;
  let s = n - i, o = e.md.linkify.matchAtStart(e.src.slice(i));
  if (!o) return !1;
  let l = o.url;
  if (l.length <= s) return !1;
  let c = l.length;
  for (; c > 0 && l.charCodeAt(c - 1) === 42; ) c--;
  c !== l.length && (l = l.slice(0, c));
  let d = e.md.normalizeLink(l);
  if (!e.md.validateLink(d)) return !1;
  if (!t) {
    e.pending = e.pending.slice(0, -s);
    let p = e.push("link_open", "a", 1);
    p.attrs = [["href", d]], p.markup = "linkify", p.info = "auto";
    let f = e.push("text", "", 0);
    f.content = e.md.normalizeLinkText(l);
    let g = e.push("link_close", "a", -1);
    g.markup = "linkify", g.info = "auto";
  }
  return e.pos += l.length - s, !0;
}
function _s(e, t) {
  let n = e.pos;
  if (e.src.charCodeAt(n) !== 10) return !1;
  let r = e.pending.length - 1, a = e.posMax;
  if (!t)
    if (r >= 0 && e.pending.charCodeAt(r) === 32)
      if (r >= 1 && e.pending.charCodeAt(r - 1) === 32) {
        let i = r - 1;
        for (; i >= 1 && e.pending.charCodeAt(i - 1) === 32; ) i--;
        e.pending = e.pending.slice(0, i), e.push("hardbreak", "br", 0);
      } else e.pending = e.pending.slice(0, -1), e.push("softbreak", "br", 0);
    else e.push("softbreak", "br", 0);
  for (n++; n < a && ae(e.src.charCodeAt(n)); ) n++;
  return e.pos = n, !0;
}
var Yt = [];
for (let e = 0; e < 256; e++) Yt.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(e) {
  Yt[e.charCodeAt(0)] = 1;
});
function xs(e, t) {
  let n = e.pos, r = e.posMax;
  if (e.src.charCodeAt(n) !== 92 || (n++, n >= r)) return !1;
  let a = e.src.charCodeAt(n);
  if (a === 10) {
    for (t || e.push("hardbreak", "br", 0), n++; n < r && (a = e.src.charCodeAt(n), ae(a)); ) n++;
    return e.pos = n, !0;
  }
  if (a === 32) {
    if (!t) {
      let o = e.push("text_special", "", 0);
      o.content = "\\", o.markup = "\\", o.info = "escape";
    }
    return e.pos = n, !0;
  }
  let i = e.src[n];
  if (a >= 55296 && a <= 56319 && n + 1 < r) {
    let o = e.src.charCodeAt(n + 1);
    o >= 56320 && o <= 57343 && (i += e.src[n + 1], n++);
  }
  let s = "\\" + i;
  if (!t) {
    let o = e.push("text_special", "", 0);
    o.content = a < 256 && Yt[a] !== 0 ? i : s, o.markup = s, o.info = "escape";
  }
  return e.pos = n + 1, !0;
}
function ws(e) {
  let t = {}, n = 0;
  for (; (n = e.indexOf("`", n)) !== -1; ) {
    let r = n;
    for (; e.charCodeAt(++n) === 96; ) ;
    t[n - r] = r;
  }
  return t;
}
function zs(e, t) {
  var n;
  let r = e.pos;
  if (e.src.charCodeAt(r) !== 96) return !1;
  let a = e.posMax, i = r + 1;
  for (; i < a && e.src.charCodeAt(i) === 96; ) i++;
  let s = e.src.slice(r, i), o = s.length;
  if (e.backticksScanned || (e.backticks = ws(e.src), e.backticksScanned = !0), ((n = e.backticks[o]) == null ? -1 : n) >= i) {
    let l = i, c;
    for (; (c = e.src.indexOf("`", l)) !== -1 && c < a; ) {
      for (l = c + 1; e.src.charCodeAt(l) === 96; ) l++;
      if (l > a) break;
      if (l - c === o) {
        if (!t) {
          let d = e.push("code_inline", "code", 0);
          d.markup = s;
          let p = e.src.slice(i, c).replace(/\n/g, " ");
          p.startsWith(" ") && p.endsWith(" ") && /[^ ]/.test(p) && (p = p.slice(1, -1)), d.content = p;
        }
        return e.pos = l, !0;
      }
    }
  }
  return t || (e.pending += s), e.pos = i, !0;
}
function ys(e, t) {
  let n = e.pos, r = e.src.charCodeAt(n);
  if (t || r !== 126) return !1;
  let a = e.scanDelims(e.pos, !0), i = a.length, s = String.fromCharCode(r);
  if (i < 2) return !1;
  let o;
  i % 2 && (o = e.push("text", "", 0), o.content = s, i--);
  for (let l = 0; l < i; l += 2) o = e.push("text", "", 0), o.content = s + s, e.delimiters.push({
    marker: r,
    length: 0,
    token: e.tokens.length - 1,
    end: -1,
    open: a.can_open,
    close: a.can_close
  });
  return e.pos += a.length, !0;
}
function xn(e, t) {
  let n, r = [], a = t.length;
  for (let i = 0; i < a; i++) {
    let s = t[i];
    if (s.marker !== 126 || s.end === -1) continue;
    let o = t[s.end];
    n = e.tokens[s.token], n.type = "s_open", n.tag = "s", n.nesting = 1, n.markup = "~~", n.content = "", n = e.tokens[o.token], n.type = "s_close", n.tag = "s", n.nesting = -1, n.markup = "~~", n.content = "", e.tokens[o.token - 1].type === "text" && e.tokens[o.token - 1].content === "~" && r.push(o.token - 1);
  }
  for (; r.length; ) {
    let i = r.pop(), s = i + 1;
    for (; s < e.tokens.length && e.tokens[s].type === "s_close"; ) s++;
    s--, i !== s && (n = e.tokens[s], e.tokens[s] = e.tokens[i], e.tokens[i] = n);
  }
}
function Rs(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  xn(e, e.delimiters);
  for (let a = 0; a < n; a++) {
    var r;
    let i = (r = t[a]) == null ? void 0 : r.delimiters;
    i && xn(e, i);
  }
}
var br = {
  tokenize: ys,
  postProcess: Rs
};
function Es(e, t) {
  let n = e.pos, r = e.src.charCodeAt(n);
  if (t || r !== 95 && r !== 42) return !1;
  let a = e.scanDelims(e.pos, r === 42);
  for (let i = 0; i < a.length; i++) {
    let s = e.push("text", "", 0);
    s.content = String.fromCharCode(r), e.delimiters.push({
      marker: r,
      length: a.length,
      token: e.tokens.length - 1,
      end: -1,
      open: a.can_open,
      close: a.can_close
    });
  }
  return e.pos += a.length, !0;
}
function wn(e, t) {
  let n = t.length;
  for (let r = n - 1; r >= 0; r--) {
    let a = t[r];
    if (a.marker !== 95 && a.marker !== 42 || a.end === -1) continue;
    let i = t[a.end], s = r > 0 && t[r - 1].end === a.end + 1 && t[r - 1].marker === a.marker && t[r - 1].token === a.token - 1 && t[a.end + 1].token === i.token + 1, o = String.fromCharCode(a.marker), l = e.tokens[a.token];
    l.type = s ? "strong_open" : "em_open", l.tag = s ? "strong" : "em", l.nesting = 1, l.markup = s ? o + o : o, l.content = "";
    let c = e.tokens[i.token];
    c.type = s ? "strong_close" : "em_close", c.tag = s ? "strong" : "em", c.nesting = -1, c.markup = s ? o + o : o, c.content = "", s && (e.tokens[t[r - 1].token].content = "", e.tokens[t[a.end + 1].token].content = "", r--);
  }
}
function qs(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  wn(e, e.delimiters);
  for (let a = 0; a < n; a++) {
    var r;
    let i = (r = t[a]) == null ? void 0 : r.delimiters;
    i && wn(e, i);
  }
}
var vr = {
  tokenize: Es,
  postProcess: qs
};
function Cs(e, t) {
  let n, r, a, i, s = "", o = "", l = e.pos, c = !0;
  if (e.src.charCodeAt(e.pos) !== 91) return !1;
  let d = e.pos, p = e.posMax, f = e.pos + 1, g = e.md.helpers.parseLinkLabel(e, e.pos, !0);
  if (g < 0) return !1;
  let h = g + 1;
  if (h < p && e.src.charCodeAt(h) === 40) {
    for (c = !1, h++; h < p && (n = e.src.charCodeAt(h), ae(n) || n === 10); h++) ;
    if (h >= p) return !1;
    if (l = h, a = e.md.helpers.parseLinkDestination(e.src, h, e.posMax), a.ok) {
      for (s = e.md.normalizeLink(a.str), e.md.validateLink(s) ? h = a.pos : s = "", l = h; h < p && (n = e.src.charCodeAt(h), ae(n) || n === 10); h++) ;
      if (a = e.md.helpers.parseLinkTitle(e.src, h, e.posMax), h < p && l !== h && a.ok) for (o = a.str, h = a.pos; h < p && (n = e.src.charCodeAt(h), ae(n) || n === 10); h++) ;
    }
    (h >= p || e.src.charCodeAt(h) !== 41) && (c = !0), h++;
  }
  if (c) {
    if (e.env.references === void 0) return !1;
    if (h < p && e.src.charCodeAt(h) === 91 ? (l = h + 1, h = e.md.helpers.parseLinkLabel(e, h), h >= 0 ? r = e.src.slice(l, h++) : h = g + 1) : h = g + 1, r || (r = e.src.slice(f, g)), r = _t(r), i = e.env.references[r], !i) return e.pos = d, !1;
    s = i.href, o = i.title;
  }
  if (!t) {
    e.pos = f, e.posMax = g;
    let w = e.push("link_open", "a", 1), x = [["href", s]];
    if (w.attrs = x, o && x.push(["title", o]), r) {
      let v = /* @__PURE__ */ Object.create(null);
      v.label = r, w.meta = v;
    }
    e.linkLevel++, e.md.inline.tokenize(e), e.linkLevel--, e.push("link_close", "a", -1);
  }
  return e.pos = h, e.posMax = p, !0;
}
function As(e, t) {
  let n, r, a, i, s, o, l, c, d = "", p = e.pos, f = e.posMax;
  if (e.src.charCodeAt(e.pos) !== 33 || e.src.charCodeAt(e.pos + 1) !== 91) return !1;
  let g = e.pos + 2, h = e.md.helpers.parseLinkLabel(e, e.pos + 1, !1);
  if (h < 0) return !1;
  if (i = h + 1, i < f && e.src.charCodeAt(i) === 40) {
    for (i++; i < f && (n = e.src.charCodeAt(i), ae(n) || n === 10); i++) ;
    if (i >= f) return !1;
    for (c = i, o = e.md.helpers.parseLinkDestination(e.src, i, e.posMax), o.ok && (d = e.md.normalizeLink(o.str), e.md.validateLink(d) ? i = o.pos : d = ""), c = i; i < f && (n = e.src.charCodeAt(i), ae(n) || n === 10); i++) ;
    if (o = e.md.helpers.parseLinkTitle(e.src, i, e.posMax), i < f && c !== i && o.ok) for (l = o.str, i = o.pos; i < f && (n = e.src.charCodeAt(i), ae(n) || n === 10); i++) ;
    else l = "";
    if (i >= f || e.src.charCodeAt(i) !== 41) return e.pos = p, !1;
    i++;
  } else {
    if (e.env.references === void 0) return !1;
    if (i < f && e.src.charCodeAt(i) === 91 ? (c = i + 1, i = e.md.helpers.parseLinkLabel(e, i), i >= 0 ? a = e.src.slice(c, i++) : i = h + 1) : i = h + 1, a || (a = e.src.slice(g, h)), a = _t(a), s = e.env.references[a], !s) return e.pos = p, !1;
    d = s.href, l = s.title;
  }
  if (!t) {
    r = e.src.slice(g, h);
    let w = [];
    e.md.inline.parse(r, e.md, e.env, w);
    let x = e.push("image", "img", 0), v = [["src", d], ["alt", ""]];
    if (x.attrs = v, x.children = w, x.content = r, l && v.push(["title", l]), a) {
      let b = /* @__PURE__ */ Object.create(null);
      b.label = a, x.meta = b;
    }
  }
  return e.pos = i, e.posMax = f, !0;
}
var Ns = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/, Ds = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function Ss(e, t) {
  let n = e.pos;
  if (e.src.charCodeAt(n) !== 60) return !1;
  let r = e.pos, a = e.posMax;
  for (; ; ) {
    if (++n >= a) return !1;
    let s = e.src.charCodeAt(n);
    if (s === 60) return !1;
    if (s === 62) break;
  }
  let i = e.src.slice(r + 1, n);
  if (Ds.test(i)) {
    let s = e.md.normalizeLink(i);
    if (!e.md.validateLink(s)) return !1;
    if (!t) {
      let o = e.push("link_open", "a", 1);
      o.attrs = [["href", s]], o.markup = "autolink", o.info = "auto";
      let l = e.push("text", "", 0);
      l.content = e.md.normalizeLinkText(i);
      let c = e.push("link_close", "a", -1);
      c.markup = "autolink", c.info = "auto";
    }
    return e.pos += i.length + 2, !0;
  }
  if (Ns.test(i)) {
    let s = e.md.normalizeLink(`mailto:${i}`);
    if (!e.md.validateLink(s)) return !1;
    if (!t) {
      let o = e.push("link_open", "a", 1);
      o.attrs = [["href", s]], o.markup = "autolink", o.info = "auto";
      let l = e.push("text", "", 0);
      l.content = e.md.normalizeLinkText(i);
      let c = e.push("link_close", "a", -1);
      c.markup = "autolink", c.info = "auto";
    }
    return e.pos += i.length + 2, !0;
  }
  return !1;
}
function Ts(e) {
  return /^<a[>\s]/i.test(e);
}
function Fs(e) {
  return /^<\/a\s*>/i.test(e);
}
function kr(e) {
  let t = e | 32;
  return t >= 97 && t <= 122;
}
function Ms(e, t) {
  let n = e.src, r, a;
  if (n.startsWith("<!--", t)) {
    if (n.startsWith(">", t + 4)) return t + 5;
    if (n.startsWith("->", t + 4)) return t + 6;
    r = t + 4, a = "-->";
  } else if (n.startsWith("<![CDATA[", t)) r = t + 9, a = "]]>";
  else if (n.charCodeAt(t + 1) === 63) r = t + 2, a = "?>";
  else if (kr(n.charCodeAt(t + 2))) r = t + 3, a = ">";
  else return -1;
  if (e.skipHtmlSpecial) return -1;
  let i = n.indexOf(a, r);
  return i < 0 ? (e.skipHtmlSpecial = !0, -1) : i + a.length;
}
function Is(e, t) {
  if (!e.md.options.html) return !1;
  let n = e.posMax, r = e.pos;
  if (e.src.charCodeAt(r) !== 60 || r + 2 >= n) return !1;
  let a, i = e.src.charCodeAt(r + 1);
  if (i === 33 || i === 63) a = Ms(e, r);
  else if (i === 47 || kr(i)) {
    let s = e.src.slice(r).match(fr);
    a = s ? r + s[0].length : -1;
  } else return !1;
  if (a < 0) return !1;
  if (!t) {
    let s = e.push("html_inline", "", 0);
    s.content = e.src.slice(r, a), Ts(s.content) && e.linkLevel++, Fs(s.content) && e.linkLevel--;
  }
  return e.pos = a, !0;
}
var Bs = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i, Os = /^&([a-z][a-z0-9]{1,31});/i;
function Ls(e, t) {
  let n = e.pos, r = e.posMax;
  if (e.src.charCodeAt(n) !== 38 || n + 1 >= r) return !1;
  if (e.src.charCodeAt(n + 1) === 35) {
    let a = e.src.slice(n).match(Bs);
    if (a) {
      if (!t) {
        let i = a[1][0].toLowerCase() === "x" ? parseInt(a[1].slice(1), 16) : parseInt(a[1], 10), s = e.push("text_special", "", 0);
        s.content = Gt(i) ? tt(i) : tt(65533), s.markup = a[0], s.info = "entity";
      }
      return e.pos += a[0].length, !0;
    }
  } else {
    let a = e.src.slice(n).match(Os);
    if (a) {
      let i = ir(a[0]);
      if (i !== a[0]) {
        if (!t) {
          let s = e.push("text_special", "", 0);
          s.content = i, s.markup = a[0], s.info = "entity";
        }
        return e.pos += a[0].length, !0;
      }
    }
  }
  return !1;
}
function zn(e) {
  let t = {}, n = e.length;
  if (!n) return;
  let r = 0, a = -2, i = [];
  for (let s = 0; s < n; s++) {
    let o = e[s];
    if (i.push(0), (e[r].marker !== o.marker || a !== o.token - 1) && (r = s), a = o.token, o.length = o.length || 0, !o.close) continue;
    t.hasOwnProperty(o.marker) || (t[o.marker] = [
      -1,
      -1,
      -1,
      -1,
      -1,
      -1
    ]);
    let l = t[o.marker][(o.open ? 3 : 0) + o.length % 3], c = r - i[r] - 1, d = c;
    for (; c > l; c -= i[c] + 1) {
      let p = e[c];
      if (p.marker === o.marker && p.open && p.end < 0) {
        let f = !1;
        if ((p.close || o.open) && (p.length + o.length) % 3 == 0 && (p.length % 3 != 0 || o.length % 3 != 0) && (f = !0), !f) {
          let g = c > 0 && !e[c - 1].open ? i[c - 1] + 1 : 0;
          i[s] = s - c + g, i[c] = g, o.open = !1, p.end = s, p.close = !1, d = -1, a = -2;
          break;
        }
      }
    }
    d !== -1 && (t[o.marker][(o.open ? 3 : 0) + (o.length || 0) % 3] = d);
  }
}
function $s(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  zn(e.delimiters);
  for (let a = 0; a < n; a++) {
    var r;
    let i = (r = t[a]) == null ? void 0 : r.delimiters;
    i && zn(i);
  }
}
function Us(e) {
  let t, n, r = 0, a = e.tokens, i = e.tokens.length;
  for (t = n = 0; t < i; t++) a[t].nesting < 0 && r--, a[t].level = r, a[t].nesting > 0 && r++, a[t].type === "text" && t + 1 < i && a[t + 1].type === "text" ? a[t + 1].content = a[t].content + a[t + 1].content : (t !== n && (a[n] = a[t]), n++);
  t !== n && (a.length = n);
}
var Ct = [
  ["text", ms],
  ["linkify", ks],
  ["newline", _s],
  ["escape", xs],
  ["backticks", zs],
  ["strikethrough", br.tokenize],
  ["emphasis", vr.tokenize],
  ["link", Cs],
  ["image", As],
  ["autolink", Ss],
  ["html_inline", Is],
  ["entity", Ls]
], At = [
  ["balance_pairs", $s],
  ["strikethrough", br.postProcess],
  ["emphasis", vr.postProcess],
  ["fragments_join", Us]
], _r = class {
  constructor() {
    N(this, "ruler", new it()), N(this, "ruler2", new it()), N(this, "State", mr);
    for (let e = 0; e < Ct.length; e++) this.ruler.push(Ct[e][0], Ct[e][1]);
    for (let e = 0; e < At.length; e++) this.ruler2.push(At[e][0], At[e][1]);
  }
  skipToken(e) {
    let t = e.pos, n = this.ruler.getRules(""), r = n.length, a = e.md.options.maxNesting, i = e.cache;
    if (i[t] !== void 0) {
      e.pos = i[t];
      return;
    }
    let s = !1;
    if (e.level < a) {
      for (let o = 0; o < r; o++) if (e.level++, s = n[o](e, !0), e.level--, s) {
        if (t >= e.pos) throw Error("inline rule didn't increment state.pos");
        break;
      }
    } else e.pos = e.posMax;
    s || e.pos++, i[t] = e.pos;
  }
  tokenize(e) {
    let t = this.ruler.getRules(""), n = t.length, r = e.posMax, a = e.md.options.maxNesting;
    for (; e.pos < r; ) {
      let i = e.pos, s = !1;
      if (e.level < a) {
        for (let o = 0; o < n; o++) if (s = t[o](e, !1), s) {
          if (i >= e.pos) throw Error("inline rule didn't increment state.pos");
          break;
        }
      }
      if (s) {
        if (e.pos >= r) break;
      } else e.pending += e.src[e.pos++];
    }
    e.pending && e.pushPending();
  }
  parse(e, t, n, r) {
    let a = new this.State(e, t, n, r);
    this.tokenize(a);
    let i = this.ruler2.getRules(""), s = i.length;
    for (let o = 0; o < s; o++) i[o](a);
  }
}, Ps = class {
  constructor(e = {}) {
    N(this, "src_Any", Qn.source), N(this, "src_Cc", er.source), N(this, "src_Z", nr.source), N(this, "src_P", Kt.source), N(this, "src_ZPCc", [
      this.src_Z,
      this.src_P,
      this.src_Cc
    ].join("|")), N(this, "src_ZCc", [this.src_Z, this.src_Cc].join("|")), N(this, "cache", {}), N(this, "opts", {
      maxLength: 1e4,
      urlAuth: !1,
      schema_names: []
    }), this.opts = {
      ...this.opts,
      ...e
    };
  }
  set(e = {}) {
    return this.opts = {
      ...this.opts,
      ...e
    }, this.cache = {}, this;
  }
  escapeRE(e) {
    return e.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
  }
  nestedPairRE(e, t, n = 4) {
    let r = this.escapeRE(e), a = this.escapeRE(t), i = `(?:(?!${this.src_ZCc}|${r}|${a}).)`, s = `${r}${i}{0,1000}${a}`;
    for (let o = 2; o <= n; o++) s = `${r}(?:${i}|${s}){0,1000}${a}`;
    return s;
  }
  get_text_separators() {
    var e, t;
    return (t = (e = this.cache).text_separators) == null ? e.text_separators = /[><\uff5c]/ : t;
  }
  get_pseudo_letter() {
    var e, t;
    return (t = (e = this.cache).src_pseudo_letter) == null ? e.src_pseudo_letter = RegExp(`(?:(?!${this.get_text_separators().source}|${this.src_ZPCc})${this.src_Any})`) : t;
  }
  get_ipv4_addr() {
    var e, t;
    return (t = (e = this.cache).src_ip4) == null ? e.src_ip4 = /* @__PURE__ */ RegExp("(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])[.]){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])") : t;
  }
  get_ipv6_addr() {
    var e, t;
    let n = "[0-9A-Fa-f]{1,4}", r = `(?:(?:${n}:${n})|${this.get_ipv4_addr().source})`;
    return (t = (e = this.cache).src_ip6_addr) == null ? e.src_ip6_addr = RegExp(`(?:(?:${n}:){6}${r}|::(?:${n}:){5}${r}|(?:${n})?::(?:${n}:){4}${r}|(?:(?:${n}:){0,1}${n})?::(?:${n}:){3}${r}|(?:(?:${n}:){0,2}${n})?::(?:${n}:){2}${r}|(?:(?:${n}:){0,3}${n})?::${n}:${r}|(?:(?:${n}:){0,4}${n})?::${r}|(?:(?:${n}:){0,5}${n})?::${n}|(?:(?:${n}:){0,6}${n})?::)`) : t;
  }
  get_ipv6_url_host() {
    var e, t;
    return (t = (e = this.cache).src_ip6_host) == null ? e.src_ip6_host = RegExp(`\\[${this.get_ipv6_addr().source}\\]`) : t;
  }
  get_ipv6_mail_host() {
    var e, t;
    return (t = (e = this.cache).src_ipv6_mail_host) == null ? e.src_ipv6_mail_host = RegExp(`\\[IPv6:${this.get_ipv6_addr().source}\\]`) : t;
  }
  get_auth() {
    var e, t;
    return (t = (e = this.cache).src_auth) == null ? e.src_auth = RegExp(`(?:(?:(?!${this.src_ZCc}|[@/\\[\\]()]).){1,50}@)?`) : t;
  }
  get_port() {
    var e, t;
    return (t = (e = this.cache).src_port) == null ? e.src_port = /* @__PURE__ */ RegExp("(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?") : t;
  }
  get_host_terminator() {
    var e, t;
    return (t = (e = this.cache).src_host_terminator) == null ? e.src_host_terminator = RegExp(`(?=$|${this.get_text_separators().source}|${this.src_ZPCc})(?!${this.opts["---"] ? "-(?!--)|" : "-|"}_|:\\d|\\.-|\\.(?!$|${this.src_ZPCc}))`) : t;
  }
  get_path_terminator() {
    var e, t;
    return (t = (e = this.cache).src_path_terminator) == null ? e.src_path_terminator = RegExp(`${this.src_ZPCc}|${this.get_text_separators().source}`) : t;
  }
  get_path() {
    var e, t;
    return (t = (e = this.cache).src_path) == null ? e.src_path = RegExp(`(?:[/?#](?:${this.nestedPairRE("[", "]")}|${this.nestedPairRE("(", ")")}|${this.nestedPairRE("{", "}")}|\\"(?:(?!${this.src_ZCc}|["]).){1,100}\\"|\\'(?:(?!${this.src_ZCc}|[']).){1,100}\\'|\\'(?=${this.get_pseudo_letter().source}|[-])|\\.{2,20}[:]?[a-zA-Z0-9%/&]|\\.(?!${this.src_ZCc}|[.]|$)|` + (this.opts["---"] ? "\\-(?!--(?:[^-]|$))(?:-{0,19})|" : "\\-{1,20}|") + `,(?!${this.src_ZCc}|$)|;(?!${this.src_ZCc}|$)|\\!{1,20}(?!${this.src_ZCc}|[!]|$)|\\?(?!${this.src_ZCc}|[?]|$)|` + this.get_path_extra().source + `[\\\\/:%@#&=_~*]|(?!${this.get_path_terminator().source}).){1,${this.opts.maxLength}}|\\/)?`) : t;
  }
  get_mail_name() {
    var e, t;
    return (t = (e = this.cache).src_mail_name) == null ? e.src_mail_name = /* @__PURE__ */ RegExp("[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9](?:[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9]|[.](?=[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9])){0,63}") : t;
  }
  get_xn() {
    var e, t;
    return (t = (e = this.cache).src_xn) == null ? e.src_xn = /* @__PURE__ */ RegExp("xn--[a-z0-9\\-]{1,59}") : t;
  }
  get_tld() {
    if (this.cache.tld) return this.cache.tld;
    let e = [...new Set(this.opts.tlds || [])].sort().reverse().join("|");
    return this.cache.tld = RegExp(`${e || "$#none#$"}|${this.get_xn().source}`), this.cache.tld;
  }
  get_domain_root() {
    var e, t;
    return (t = (e = this.cache).src_domain_root) == null ? e.src_domain_root = RegExp("(?:" + this.get_xn().source + `|${this.get_pseudo_letter().source}{1,63})`) : t;
  }
  get_domain() {
    var e, t;
    return (t = (e = this.cache).src_domain) == null ? e.src_domain = RegExp("(?:" + this.get_xn().source + `|(?:${this.get_pseudo_letter().source})|(?:${this.get_pseudo_letter().source}(?:-|${this.get_pseudo_letter().source}){0,61}${this.get_pseudo_letter().source}))`) : t;
  }
  get_url_host_port() {
    var e, t;
    return (t = (e = this.cache).url_host_port) == null ? e.url_host_port = RegExp("(?:" + this.get_ipv6_url_host().source + `|(?:(?:(?:${this.get_domain().source})\\.){0,10}${this.get_domain().source}))` + this.get_port().source + this.get_host_terminator().source) : t;
  }
  get_fuzzy_url_host_port() {
    var e, t;
    return (t = (e = this.cache).fuzzy_url_host_port) == null ? e.fuzzy_url_host_port = RegExp("(?:" + (this.opts.fuzzyIP ? this.get_ipv4_addr().source + "|" : "") + `(?:(?:(?:${this.get_domain().source})\\.){1,10}(?:${this.get_tld().source})))` + this.get_host_terminator().source) : t;
  }
  get_mail_host() {
    var e, t;
    return (t = (e = this.cache).src_mail_host) == null ? e.src_mail_host = RegExp("(?:" + this.get_ipv6_mail_host().source + `|(?:(?:(?:${this.get_domain().source})\\.){0,4}${this.get_domain().source}))` + this.get_host_terminator().source) : t;
  }
  get_fuzzy_mail_host() {
    var e, t;
    return (t = (e = this.cache).src_fuzzy_mail_host) == null ? e.src_fuzzy_mail_host = RegExp("(?:" + this.get_ipv6_mail_host().source + `|(?:(?:(?:${this.get_domain().source})[.]){1,4}${this.get_domain_root().source}))` + this.get_host_terminator().source) : t;
  }
  get_path_extra() {
    var e, t;
    return (t = (e = this.cache).src_path_extra) == null ? e.src_path_extra = /* @__PURE__ */ RegExp("") : t;
  }
  get_fuzzy_mail_host_search() {
    var e, t;
    return (t = (e = this.cache).mail_fuzzy_host_search) == null ? e.mail_fuzzy_host_search = RegExp(`@${this.get_fuzzy_mail_host().source}`, "ig") : t;
  }
  get_fuzzy_link_search() {
    var e, t;
    return (t = (e = this.cache).link_fuzzy_search) == null ? e.link_fuzzy_search = RegExp(`(^|(?![.:/\\-_@])(?:[$+<=>^\`|｜]|${this.src_ZPCc}))(?:(?![$+<=>^\`|｜])${this.get_fuzzy_url_host_port().source}${this.get_path().source})`, "ig") : t;
  }
  get_http_validator() {
    var e, t;
    return (t = (e = this.cache).http_validator) == null ? e.http_validator = RegExp("\\/\\/" + (this.opts.urlAuth ? this.get_auth().source : "") + this.get_url_host_port().source + this.get_path().source, "iy") : t;
  }
  get_relative_proto_validator() {
    var e, t;
    return (t = (e = this.cache).relative_proto_validator) == null ? e.relative_proto_validator = RegExp((this.opts.urlAuth ? this.get_auth().source : "") + `(?:localhost|${this.get_ipv6_url_host().source}|(?:(?:${this.get_domain().source})[.]){1,10}${this.get_domain_root().source})` + this.get_port().source + this.get_host_terminator().source + this.get_path().source, "iy") : t;
  }
  get_mail_name_validator() {
    var e, t;
    return (t = (e = this.cache).mail_name_validator) == null ? e.mail_name_validator = RegExp(`(?:^|${this.get_text_separators().source}|"|\\(|${this.src_ZCc})(${this.get_mail_name().source})$`) : t;
  }
  get_mailto_validator() {
    var e, t;
    return (t = (e = this.cache).mailto_validator) == null ? e.mailto_validator = RegExp(`${this.get_mail_name().source}@${this.get_mail_host().source}`, "iy") : t;
  }
  get_schema_names() {
    var e, t;
    return (t = (e = this.cache).schema_names) == null ? e.schema_names = new RegExp((this.opts.schema_names || []).map((n) => this.escapeRE(n)).join("|")) : t;
  }
  get_schema_search() {
    var e, t;
    return (t = (e = this.cache).schema_search) == null ? e.schema_search = RegExp(`(^|(?!_)(?:[><｜]|${this.src_ZPCc}))(${this.get_schema_names().source})`, "ig") : t;
  }
  get_schema_at_start() {
    var e, t;
    return (t = (e = this.cache).schema_at_start) == null ? e.schema_at_start = RegExp(`^${this.get_schema_search().source}`, "i") : t;
  }
}, Nt = {
  validate: (e, t, n) => {
    let r = n.re.get_http_validator();
    r.lastIndex = t;
    let a = r.exec(e);
    return a ? a[0].length : 0;
  },
  normalize: (e, t) => t.normalize(e)
}, js = {
  "http:": Nt,
  "https:": Nt,
  "ftp:": Nt,
  "//": {
    validate: function(e, t, n) {
      let r = n.re.get_relative_proto_validator();
      r.lastIndex = t;
      let a = r.exec(e);
      return a ? t >= 3 && e[t - 3] === ":" || t >= 3 && e[t - 3] === "/" ? 0 : a[0].length : 0;
    },
    normalize: (e, t) => t.normalize(e)
  },
  "mailto:": {
    validate: function(e, t, n) {
      let r = n.re.get_mailto_validator();
      r.lastIndex = t;
      let a = r.exec(e);
      return a ? a[0].length : 0;
    },
    normalize: (e, t) => t.normalize(e)
  }
}, Js = "a:cdefgilmnoqrstuwxz|b:abdefghijmnorstvwyz|c:acdfghiklmnoruvwxyz|d:ejkmoz|e:cegrstu|f:ijkmor|g:abdefghilmnpqrstuwy|h:kmnrtu|i:delmnoqrst|j:emop|k:eghimnprwyz|l:abcikrstuvy|m:acdeghklmnopqrstuvwxyz|n:acefgilopruz|o:m|p:aefghklmnrstwy|q:a|r:eosuw|s:abcdeghijklmnortuvxyz|t:cdfghjklmnortvwz|u:agksyz|v:aceginu|w:fs|y:et|z:amw", Ws = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф";
function Zs() {
  let e = Ws.split("|");
  return Js.split("|").forEach((t) => {
    let n = t.indexOf(":"), r = t.slice(0, n);
    for (let a of t.slice(n + 1)) e.push(r + a);
  }), e;
}
var Hs = {
  fuzzyLink: !1,
  fuzzyEmail: !0,
  fuzzyIP: !1,
  "---": !1,
  tlds: Zs(),
  urlAuth: !1,
  maxLength: 1e4
}, yn = class {
  constructor(e, t, n, r) {
    N(this, "schema", void 0), N(this, "index", void 0), N(this, "lastIndex", void 0), N(this, "raw", void 0), N(this, "text", void 0), N(this, "url", void 0);
    let a = e.slice(n, r);
    this.schema = t.toLowerCase(), this.index = n, this.lastIndex = r, this.raw = a, this.text = a, this.url = a;
  }
}, Ks = class {
  constructor(e = {}) {
    N(this, "__opts__", void 0), N(this, "__schemas__", void 0), N(this, "re", void 0);
    let { rebuilder: t, ...n } = e;
    this.__opts__ = {
      ...Hs,
      ...n
    }, this.__schemas__ = { ...js }, this.re = t || new Ps(), this.re.set({
      ...this.__opts__,
      schema_names: Object.keys(this.__schemas__)
    });
  }
  add(e, t = null) {
    if (!t) delete this.__schemas__[e];
    else {
      let n = {
        normalize: (r, a) => a.normalize(r),
        ...t
      };
      this.__schemas__[e] = n;
    }
    return this.re.set({
      ...this.__opts__,
      schema_names: Object.keys(this.__schemas__)
    }), this;
  }
  set(e = {}) {
    return this.__opts__ = {
      ...this.__opts__,
      ...e
    }, this.re.set({
      ...this.__opts__,
      schema_names: Object.keys(this.__schemas__)
    }), this;
  }
  test(e) {
    if (!e.length) return !1;
    let t, n;
    for (n = this.re.get_schema_search(), n.lastIndex = 0; (t = n.exec(e)) !== null; ) if (this.testSchemaAt(e, t[2], n.lastIndex)) return !0;
    if (this.__opts__.fuzzyLink && this.__schemas__["http:"] && (n = this.re.get_fuzzy_link_search(), n.lastIndex = 0, n.exec(e) !== null)) return !0;
    if (this.__opts__.fuzzyEmail && this.__schemas__["mailto:"] && e.indexOf("@") >= 0) {
      let r = this.re.get_fuzzy_mail_host_search(), a = this.re.get_mail_name_validator();
      for (r.lastIndex = 0; (t = r.exec(e)) !== null; ) {
        let i = e.slice(Math.max(0, t.index - 65), t.index);
        if (a.test(i)) return !0;
      }
    }
    return !1;
  }
  testSchemaAt(e, t, n) {
    return this.__schemas__[t.toLowerCase()] ? this.__schemas__[t.toLowerCase()].validate(e.slice(0, n + this.__opts__.maxLength), n, this) : 0;
  }
  match(e) {
    let t = [], n = this.re.get_schema_search(), r, a, i, s, o, l, c = !1, d = !1, p = !1, f = 0;
    if (!e.length) return null;
    for (n.lastIndex = 0, this.__opts__.fuzzyLink && this.__schemas__["http:"] && (r = this.re.get_fuzzy_link_search(), r.lastIndex = 0), this.__opts__.fuzzyEmail && this.__schemas__["mailto:"] && (a = this.re.get_fuzzy_mail_host_search(), a.lastIndex = 0, i = this.re.get_mail_name_validator()); ; ) {
      let g = Math.max(f - 1, 0);
      if (a && i && !p && (!o || o.index < f)) for (a.lastIndex < g && (a.lastIndex = g); ; ) {
        let b = a.exec(e);
        if (!b) {
          p = !0, o = void 0;
          break;
        }
        let _ = i.exec(e.slice(Math.max(0, b.index - 65), b.index));
        if (_) {
          if (o = {
            schema: "mailto:",
            index: b.index - _[1].length,
            lastIndex: b.index + b[0].length
          }, o.index >= f) break;
          a.lastIndex < g && (a.lastIndex = g);
        }
      }
      if (r && !d && (!s || s.index < f)) for (r.lastIndex < g && (r.lastIndex = g); ; ) {
        let b = r.exec(e);
        if (!b) {
          d = !0, s = void 0;
          break;
        }
        if (s = {
          schema: "",
          index: b.index + b[1].length,
          lastIndex: b.index + b[0].length
        }, s.index >= f) break;
        r.lastIndex < g && (r.lastIndex = g);
      }
      let h = o;
      (!h || s && (s.index < h.index || s.index === h.index && s.lastIndex > h.lastIndex)) && (h = s);
      let w;
      if (!c) for (; ; ) {
        if (!l) {
          n.lastIndex < g && (n.lastIndex = g);
          let y = n.exec(e);
          if (!y) {
            c = !0;
            break;
          }
          l = {
            schema: y[2],
            index: y.index + y[1].length,
            lastIndex: y.index + y[0].length
          };
        }
        if (l.index < f) {
          l = void 0;
          continue;
        }
        if (h && l.index > h.index) break;
        let b = l;
        l = void 0;
        let _ = this.testSchemaAt(e, b.schema, b.lastIndex);
        if (_) {
          w = {
            schema: b.schema,
            index: b.index,
            lastIndex: b.lastIndex + _
          };
          break;
        }
      }
      let x = w;
      if ((!x || o && (o.index < x.index || o.index === x.index && o.lastIndex > x.lastIndex)) && (x = o), (!x || s && (s.index < x.index || s.index === x.index && s.lastIndex > x.lastIndex)) && (x = s), !x) break;
      x === o ? o = void 0 : x === s && (s = void 0);
      let v = new yn(e, x.schema, x.index, x.lastIndex);
      v.schema ? this.__schemas__[v.schema].normalize(v, this) : this.normalize(v), t.push(v), f = x.lastIndex;
    }
    return t.length ? t : null;
  }
  matchAtStart(e) {
    if (!e.length) return null;
    let t = this.re.get_schema_at_start().exec(e);
    if (!t) return null;
    let n = this.testSchemaAt(e, t[2], t[0].length);
    if (!n) return null;
    let r = new yn(e, t[2], t.index + t[1].length, t.index + t[0].length + n);
    return this.__schemas__[r.schema].normalize(r, this), r;
  }
  tlds(e, t = !1) {
    return e = Array.isArray(e) ? e : [e], t ? this.__opts__.tlds = this.__opts__.tlds.concat(e) : this.__opts__.tlds = e, this.re.set({
      ...this.__opts__,
      schema_names: Object.keys(this.__schemas__)
    }), this;
  }
  normalize(e) {
    e.schema || (e.url = `http://${e.url}`), e.schema === "mailto:" && !/^mailto:/i.test(e.url) && (e.url = `mailto:${e.url}`);
  }
}, Ze = 2147483647, Fe = 36, xr = 1, gt = 26, Gs = 38, Ys = 700, wr = 72, zr = 128, yr = "-", Xs = /^xn--/, Vs = /[^\0-\x7F]/, Qs = /[\x2E\u3002\uFF0E\uFF61]/g, eo = {
  overflow: "Overflow: input needs wider integers to process",
  "not-basic": "Illegal input >= 0x80 (not a basic code point)",
  "invalid-input": "Invalid input"
}, to = 35, Ae = Math.floor, Dt = String.fromCharCode;
function Be(e) {
  throw RangeError(eo[e]);
}
function no(e, t) {
  let n = [], r = e.length;
  for (; r--; ) n[r] = t(e[r]);
  return n;
}
function Rn(e, t) {
  let n = e.split("@"), r = "";
  n.length > 1 && (r = n[0] + "@", e = n[1]), e = e.replace(Qs, ".");
  let a = no(e.split("."), t).join(".");
  return r + a;
}
function Rr(e) {
  let t = [], n = 0, r = e.length;
  for (; n < r; ) {
    let a = e.charCodeAt(n++);
    if (a >= 55296 && a <= 56319 && n < r) {
      let i = e.charCodeAt(n++);
      (i & 64512) == 56320 ? t.push(((a & 1023) << 10) + (i & 1023) + 65536) : (t.push(a), n--);
    } else t.push(a);
  }
  return t;
}
var ro = (e) => String.fromCodePoint(...e), ao = function(e) {
  return e >= 48 && e < 58 ? 26 + (e - 48) : e >= 65 && e < 91 ? e - 65 : e >= 97 && e < 123 ? e - 97 : Fe;
}, En = function(e, t) {
  return e + 22 + 75 * (e < 26) - ((t != 0) << 5);
}, Er = function(e, t, n) {
  let r = 0;
  for (e = n ? Ae(e / Ys) : e >> 1, e += Ae(e / t); e > 455; r += Fe) e = Ae(e / to);
  return Ae(r + 36 * e / (e + Gs));
}, qn = function(e) {
  let t = [], n = e.length, r = 0, a = zr, i = wr, s = e.lastIndexOf(yr);
  s < 0 && (s = 0);
  for (let o = 0; o < s; ++o) e.charCodeAt(o) >= 128 && Be("not-basic"), t.push(e.charCodeAt(o));
  for (let o = s > 0 ? s + 1 : 0; o < n; ) {
    let l = r;
    for (let d = 1, p = Fe; ; p += Fe) {
      o >= n && Be("invalid-input");
      let f = ao(e.charCodeAt(o++));
      f >= Fe && Be("invalid-input"), f > Ae((Ze - r) / d) && Be("overflow"), r += f * d;
      let g = p <= i ? xr : p >= i + gt ? gt : p - i;
      if (f < g) break;
      let h = Fe - g;
      d > Ae(Ze / h) && Be("overflow"), d *= h;
    }
    let c = t.length + 1;
    i = Er(r - l, c, l == 0), Ae(r / c) > Ze - a && Be("overflow"), a += Ae(r / c), r %= c, t.splice(r++, 0, a);
  }
  return String.fromCodePoint(...t);
}, Cn = function(e) {
  let t = [];
  e = Rr(e);
  let n = e.length, r = zr, a = 0, i = wr;
  for (let l of e) l < 128 && t.push(Dt(l));
  let s = t.length, o = s;
  for (s && t.push(yr); o < n; ) {
    let l = Ze;
    for (let d of e) d >= r && d < l && (l = d);
    let c = o + 1;
    l - r > Ae((Ze - a) / c) && Be("overflow"), a += (l - r) * c, r = l;
    for (let d of e) if (d < r && ++a > Ze && Be("overflow"), d === r) {
      let p = a;
      for (let f = Fe; ; f += Fe) {
        let g = f <= i ? xr : f >= i + gt ? gt : f - i;
        if (p < g) break;
        let h = p - g, w = Fe - g;
        t.push(Dt(En(g + h % w, 0))), p = Ae(h / w);
      }
      t.push(Dt(En(p, 0))), i = Er(a, c, o === s), a = 0, ++o;
    }
    ++a, ++r;
  }
  return t.join("");
}, An = {
  version: "2.3.1",
  ucs2: {
    decode: Rr,
    encode: ro
  },
  decode: qn,
  encode: Cn,
  toASCII: function(e) {
    return Rn(e, function(t) {
      return Vs.test(t) ? "xn--" + Cn(t) : t;
    });
  },
  toUnicode: function(e) {
    return Rn(e, function(t) {
      return Xs.test(t) ? qn(t.slice(4).toLowerCase()) : t;
    });
  }
}, io = {
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
}, so = /^(vbscript|javascript|file|data):/, oo = /^data:image\/(gif|png|jpeg|webp);/, Nn = [
  "http:",
  "https:",
  "mailto:"
], Ce = class {
  validateLink(e) {
    let t = e.trim().toLowerCase();
    return !so.test(t) || oo.test(t);
  }
  normalizeLink(e) {
    let t = Ot(e, !0);
    if (t.hostname && (!t.protocol || Nn.indexOf(t.protocol) >= 0)) try {
      t.hostname = An.toASCII(t.hostname);
    } catch {
    }
    return t.auth && (t.auth = Te(t.auth)), t.hostname && (t.hostname = Te(t.hostname)), t.pathname && (t.pathname = Te(t.pathname)), t.search && (t.search = Te(t.search)), t.hash && (t.hash = Te(t.hash)), Bt(t);
  }
  normalizeLinkText(e) {
    let t = Ot(e, !0);
    if (t.hostname && (!t.protocol || Nn.indexOf(t.protocol) >= 0)) try {
      t.hostname = An.toUnicode(t.hostname);
    } catch {
    }
    return Ke(Bt(t), Ke.defaultChars + "%");
  }
  constructor(...e) {
    N(this, "inline", new _r()), N(this, "block", new gr()), N(this, "core", new hr()), N(this, "renderer", new cr()), N(this, "linkify", new Ks()), N(this, "utils", hi), N(this, "helpers", Object.assign({}, Ci));
    let [t, n] = e;
    typeof t == "string" ? (this.configure(t), n && this.set(n)) : (this.configure("default"), this.set(t || {}));
  }
  set(e) {
    return Object.assign(this.options, e), this;
  }
  configure(e) {
    let t;
    if (typeof e == "string") {
      let a = e;
      if (t = io[a], !t) throw Error(`Wrong 'markdown-it' preset "${a}", check name`);
    } else t = e;
    if (!t) throw Error("Wrong `markdown-it` preset, can't be empty");
    t.options && (this.options = { ...t.options });
    let n = t.components;
    if (n) {
      var r;
      [
        "core",
        "block",
        "inline"
      ].forEach((i) => {
        var s;
        let o = (s = n[i]) == null ? void 0 : s.rules;
        o && this[i].ruler.enableOnly(o);
      });
      let a = (r = n.inline) == null ? void 0 : r.rules2;
      a && this.inline.ruler2.enableOnly(a);
    }
    return this;
  }
  enable(e, t = !1) {
    let n = [];
    Array.isArray(e) || (e = [e]), [
      "core",
      "block",
      "inline"
    ].forEach((a) => {
      n = n.concat(this[a].ruler.enable(e, !0));
    }), n = n.concat(this.inline.ruler2.enable(e, !0));
    let r = e.filter((a) => n.indexOf(a) < 0);
    if (r.length && !t) throw Error(`MarkdownIt. Failed to enable unknown rule(s): ${r}`);
    return this;
  }
  disable(e, t = !1) {
    let n = [];
    Array.isArray(e) || (e = [e]), [
      "core",
      "block",
      "inline"
    ].forEach((a) => {
      n = n.concat(this[a].ruler.disable(e, !0));
    }), n = n.concat(this.inline.ruler2.disable(e, !0));
    let r = e.filter((a) => n.indexOf(a) < 0);
    if (r.length && !t) throw Error(`MarkdownIt. Failed to disable unknown rule(s): ${r}`);
    return this;
  }
  use(e, ...t) {
    return e.apply(e, [this, ...t]), this;
  }
  parse(e, t) {
    if (typeof e != "string") throw Error("Input data should be a String");
    let n = new this.core.State(e, this, t);
    return this.core.process(n), n.tokens;
  }
  render(e, t = {}) {
    return this.renderer.render(this.parse(e, t), this.options, t);
  }
  parseInline(e, t) {
    let n = new this.core.State(e, this, t);
    return n.inlineMode = !0, this.core.process(n), n.tokens;
  }
  renderInline(e, t = {}) {
    return this.renderer.render(this.parseInline(e, t), this.options, t);
  }
};
N(Ce, "Token", Ue), N(Ce, "Ruler", it), N(Ce, "Renderer", cr), N(Ce, "ParserCore", hr), N(Ce, "StateCore", ur), N(Ce, "ParserBlock", gr), N(Ce, "StateBlock", pr), N(Ce, "ParserInline", _r), N(Ce, "StateInline", mr);
var lo = sr(Ce);
function co(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
function qr(e) {
  return e instanceof Map ? e.clear = e.delete = e.set = function() {
    throw new Error("map is read-only");
  } : e instanceof Set && (e.add = e.clear = e.delete = function() {
    throw new Error("set is read-only");
  }), Object.freeze(e), Object.getOwnPropertyNames(e).forEach((t) => {
    const n = e[t], r = typeof n;
    (r === "object" || r === "function") && !Object.isFrozen(n) && qr(n);
  }), e;
}
class Dn {
  /**
   * @param {CompiledMode} mode
   */
  constructor(t) {
    t.data === void 0 && (t.data = {}), this.data = t.data, this.isMatchIgnored = !1;
  }
  ignoreMatch() {
    this.isMatchIgnored = !0;
  }
}
function Cr(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}
function Oe(e, ...t) {
  const n = /* @__PURE__ */ Object.create(null);
  for (const r in e)
    n[r] = e[r];
  return t.forEach(function(r) {
    for (const a in r)
      n[a] = r[a];
  }), /** @type {T} */
  n;
}
const uo = "</span>", Sn = (e) => !!e.scope, ho = (e, { prefix: t }) => {
  if (e.startsWith("language:"))
    return e.replace("language:", "language-");
  if (e.includes(".")) {
    const n = e.split(".");
    return [
      `${t}${n.shift()}`,
      ...n.map((r, a) => `${r}${"_".repeat(a + 1)}`)
    ].join(" ");
  }
  return `${t}${e}`;
};
class po {
  /**
   * Creates a new HTMLRenderer
   *
   * @param {Tree} parseTree - the parse tree (must support `walk` API)
   * @param {{classPrefix: string}} options
   */
  constructor(t, n) {
    this.buffer = "", this.classPrefix = n.classPrefix, t.walk(this);
  }
  /**
   * Adds texts to the output stream
   *
   * @param {string} text */
  addText(t) {
    this.buffer += Cr(t);
  }
  /**
   * Adds a node open to the output stream (if needed)
   *
   * @param {Node} node */
  openNode(t) {
    if (!Sn(t)) return;
    const n = ho(
      t.scope,
      { prefix: this.classPrefix }
    );
    this.span(n);
  }
  /**
   * Adds a node close to the output stream (if needed)
   *
   * @param {Node} node */
  closeNode(t) {
    Sn(t) && (this.buffer += uo);
  }
  /**
   * returns the accumulated buffer
  */
  value() {
    return this.buffer;
  }
  // helpers
  /**
   * Builds a span element
   *
   * @param {string} className */
  span(t) {
    this.buffer += `<span class="${t}">`;
  }
}
const Tn = (e = {}) => {
  const t = { children: [] };
  return Object.assign(t, e), t;
};
class Xt {
  constructor() {
    this.rootNode = Tn(), this.stack = [this.rootNode];
  }
  get top() {
    return this.stack[this.stack.length - 1];
  }
  get root() {
    return this.rootNode;
  }
  /** @param {Node} node */
  add(t) {
    this.top.children.push(t);
  }
  /** @param {string} scope */
  openNode(t) {
    const n = Tn({ scope: t });
    this.add(n), this.stack.push(n);
  }
  closeNode() {
    if (this.stack.length > 1)
      return this.stack.pop();
  }
  closeAllNodes() {
    for (; this.closeNode(); ) ;
  }
  toJSON() {
    return JSON.stringify(this.rootNode, null, 4);
  }
  /**
   * @typedef { import("./html_renderer").Renderer } Renderer
   * @param {Renderer} builder
   */
  walk(t) {
    return this.constructor._walk(t, this.rootNode);
  }
  /**
   * @param {Renderer} builder
   * @param {Node} node
   */
  static _walk(t, n) {
    return typeof n == "string" ? t.addText(n) : n.children && (t.openNode(n), n.children.forEach((r) => this._walk(t, r)), t.closeNode(n)), t;
  }
  /**
   * @param {Node} node
   */
  static _collapse(t) {
    typeof t != "string" && t.children && (t.children.every((n) => typeof n == "string") ? t.children = [t.children.join("")] : t.children.forEach((n) => {
      Xt._collapse(n);
    }));
  }
}
class fo extends Xt {
  /**
   * @param {*} options
   */
  constructor(t) {
    super(), this.options = t;
  }
  /**
   * @param {string} text
   */
  addText(t) {
    t !== "" && this.add(t);
  }
  /** @param {string} scope */
  startScope(t) {
    this.openNode(t);
  }
  endScope() {
    this.closeNode();
  }
  /**
   * @param {Emitter & {root: DataNode}} emitter
   * @param {string} name
   */
  __addSublanguage(t, n) {
    const r = t.root;
    n && (r.scope = `language:${n}`), this.add(r);
  }
  toHTML() {
    return new po(this, this.options).value();
  }
  finalize() {
    return this.closeAllNodes(), !0;
  }
}
function st(e) {
  return e ? typeof e == "string" ? e : e.source : null;
}
function Ar(e) {
  return Je("(?=", e, ")");
}
function go(e) {
  return Je("(?:", e, ")*");
}
function mo(e) {
  return Je("(?:", e, ")?");
}
function Je(...e) {
  return e.map((n) => st(n)).join("");
}
function bo(e) {
  const t = e[e.length - 1];
  return typeof t == "object" && t.constructor === Object ? (e.splice(e.length - 1, 1), t) : {};
}
function Vt(...e) {
  return "(" + (bo(e).capture ? "" : "?:") + e.map((r) => st(r)).join("|") + ")";
}
function Nr(e) {
  return new RegExp(e.toString() + "|").exec("").length - 1;
}
function vo(e, t) {
  const n = e && e.exec(t);
  return n && n.index === 0;
}
const ko = /\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;
function Qt(e, { joinWith: t }) {
  let n = 0;
  return e.map((r) => {
    n += 1;
    const a = n;
    let i = st(r), s = "";
    for (; i.length > 0; ) {
      const o = ko.exec(i);
      if (!o) {
        s += i;
        break;
      }
      s += i.substring(0, o.index), i = i.substring(o.index + o[0].length), o[0][0] === "\\" && o[1] ? s += "\\" + String(Number(o[1]) + a) : (s += o[0], o[0] === "(" && n++);
    }
    return s;
  }).map((r) => `(${r})`).join(t);
}
const _o = /\b\B/, Dr = "[a-zA-Z]\\w*", en = "[a-zA-Z_]\\w*", Sr = "\\b\\d+(\\.\\d+)?", Tr = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)", Fr = "\\b(0b[01]+)", xo = "!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~", wo = (e = {}) => {
  const t = /^#![ ]*\//;
  return e.binary && (e.begin = Je(
    t,
    /.*\b/,
    e.binary,
    /\b.*/
  )), Oe({
    scope: "meta",
    begin: t,
    end: /$/,
    relevance: 0,
    /** @type {ModeCallback} */
    "on:begin": (n, r) => {
      n.index !== 0 && r.ignoreMatch();
    }
  }, e);
}, ot = {
  begin: "\\\\[\\s\\S]",
  relevance: 0
}, zo = {
  scope: "string",
  begin: "'",
  end: "'",
  illegal: "\\n",
  contains: [ot]
}, yo = {
  scope: "string",
  begin: '"',
  end: '"',
  illegal: "\\n",
  contains: [ot]
}, Ro = {
  begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
}, wt = function(e, t, n = {}) {
  const r = Oe(
    {
      scope: "comment",
      begin: e,
      end: t,
      contains: []
    },
    n
  );
  r.contains.push({
    scope: "doctag",
    // hack to avoid the space from being included. the space is necessary to
    // match here to prevent the plain text rule below from gobbling up doctags
    begin: "[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
    end: /(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,
    excludeBegin: !0,
    relevance: 0
  });
  const a = Vt(
    // list of common 1 and 2 letter words in English
    "I",
    "a",
    "is",
    "so",
    "us",
    "to",
    "at",
    "if",
    "in",
    "it",
    "on",
    // note: this is not an exhaustive list of contractions, just popular ones
    /[A-Za-z]+['](d|ve|re|ll|t|s|n)/,
    // contractions - can't we'd they're let's, etc
    /[A-Za-z]+[-][a-z]+/,
    // `no-way`, etc.
    /[A-Za-z][a-z]{2,}/
    // allow capitalized words at beginning of sentences
  );
  return r.contains.push(
    {
      // TODO: how to include ", (, ) without breaking grammars that use these for
      // comment delimiters?
      // begin: /[ ]+([()"]?([A-Za-z'-]{3,}|is|a|I|so|us|[tT][oO]|at|if|in|it|on)[.]?[()":]?([.][ ]|[ ]|\))){3}/
      // ---
      // this tries to find sequences of 3 english words in a row (without any
      // "programming" type syntax) this gives us a strong signal that we've
      // TRULY found a comment - vs perhaps scanning with the wrong language.
      // It's possible to find something that LOOKS like the start of the
      // comment - but then if there is no readable text - good chance it is a
      // false match and not a comment.
      //
      // for a visual example please see:
      // https://github.com/highlightjs/highlight.js/issues/2827
      begin: Je(
        /[ ]+/,
        // necessary to prevent us gobbling up doctags like /* @author Bob Mcgill */
        "(",
        a,
        /[.]?[:]?([.][ ]|[ ])/,
        "){3}"
      )
      // look for 3 words in a row
    }
  ), r;
}, Eo = wt("//", "$"), qo = wt("/\\*", "\\*/"), Co = wt("#", "$"), Ao = {
  scope: "number",
  begin: Sr,
  relevance: 0
}, No = {
  scope: "number",
  begin: Tr,
  relevance: 0
}, Do = {
  scope: "number",
  begin: Fr,
  relevance: 0
}, So = {
  scope: "regexp",
  begin: /\/(?=[^/\n]*\/)/,
  end: /\/[gimuy]*/,
  contains: [
    ot,
    {
      begin: /\[/,
      end: /\]/,
      relevance: 0,
      contains: [ot]
    }
  ]
}, To = {
  scope: "title",
  begin: Dr,
  relevance: 0
}, Fo = {
  scope: "title",
  begin: en,
  relevance: 0
}, Mo = {
  // excludes method names from keyword processing
  begin: "\\.\\s*" + en,
  relevance: 0
}, Io = function(e) {
  return Object.assign(
    e,
    {
      /** @type {ModeCallback} */
      "on:begin": (t, n) => {
        n.data._beginMatch = t[1];
      },
      /** @type {ModeCallback} */
      "on:end": (t, n) => {
        n.data._beginMatch !== t[1] && n.ignoreMatch();
      }
    }
  );
};
var dt = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  APOS_STRING_MODE: zo,
  BACKSLASH_ESCAPE: ot,
  BINARY_NUMBER_MODE: Do,
  BINARY_NUMBER_RE: Fr,
  COMMENT: wt,
  C_BLOCK_COMMENT_MODE: qo,
  C_LINE_COMMENT_MODE: Eo,
  C_NUMBER_MODE: No,
  C_NUMBER_RE: Tr,
  END_SAME_AS_BEGIN: Io,
  HASH_COMMENT_MODE: Co,
  IDENT_RE: Dr,
  MATCH_NOTHING_RE: _o,
  METHOD_GUARD: Mo,
  NUMBER_MODE: Ao,
  NUMBER_RE: Sr,
  PHRASAL_WORDS_MODE: Ro,
  QUOTE_STRING_MODE: yo,
  REGEXP_MODE: So,
  RE_STARTERS_RE: xo,
  SHEBANG: wo,
  TITLE_MODE: To,
  UNDERSCORE_IDENT_RE: en,
  UNDERSCORE_TITLE_MODE: Fo
});
function Bo(e, t) {
  e.input[e.index - 1] === "." && t.ignoreMatch();
}
function Oo(e, t) {
  e.className !== void 0 && (e.scope = e.className, delete e.className);
}
function Lo(e, t) {
  t && e.beginKeywords && (e.begin = "\\b(" + e.beginKeywords.split(" ").join("|") + ")(?!\\.)(?=\\b|\\s)", e.__beforeBegin = Bo, e.keywords = e.keywords || e.beginKeywords, delete e.beginKeywords, e.relevance === void 0 && (e.relevance = 0));
}
function $o(e, t) {
  Array.isArray(e.illegal) && (e.illegal = Vt(...e.illegal));
}
function Uo(e, t) {
  if (e.match) {
    if (e.begin || e.end) throw new Error("begin & end are not supported with match");
    e.begin = e.match, delete e.match;
  }
}
function Po(e, t) {
  e.relevance === void 0 && (e.relevance = 1);
}
const jo = (e, t) => {
  if (!e.beforeMatch) return;
  if (e.starts) throw new Error("beforeMatch cannot be used with starts");
  const n = Object.assign({}, e);
  Object.keys(e).forEach((r) => {
    delete e[r];
  }), e.keywords = n.keywords, e.begin = Je(n.beforeMatch, Ar(n.begin)), e.starts = {
    relevance: 0,
    contains: [
      Object.assign(n, { endsParent: !0 })
    ]
  }, e.relevance = 0, delete n.beforeMatch;
}, Jo = [
  "of",
  "and",
  "for",
  "in",
  "not",
  "or",
  "if",
  "then",
  "parent",
  // common variable name
  "list",
  // common variable name
  "value"
  // common variable name
], Wo = "keyword";
function Mr(e, t, n = Wo) {
  const r = /* @__PURE__ */ Object.create(null);
  return typeof e == "string" ? a(n, e.split(" ")) : Array.isArray(e) ? a(n, e) : Object.keys(e).forEach(function(i) {
    Object.assign(
      r,
      Mr(e[i], t, i)
    );
  }), r;
  function a(i, s) {
    t && (s = s.map((o) => o.toLowerCase())), s.forEach(function(o) {
      const l = o.split("|");
      r[l[0]] = [i, Zo(l[0], l[1])];
    });
  }
}
function Zo(e, t) {
  return t ? Number(t) : Ho(e) ? 0 : 1;
}
function Ho(e) {
  return Jo.includes(e.toLowerCase());
}
const Fn = {}, Pe = (e) => {
  console.error(e);
}, Mn = (e, ...t) => {
  console.log(`WARN: ${e}`, ...t);
}, We = (e, t) => {
  Fn[`${e}/${t}`] || (console.log(`Deprecated as of ${e}. ${t}`), Fn[`${e}/${t}`] = !0);
}, mt = new Error();
function Ir(e, t, { key: n }) {
  let r = 0;
  const a = e[n], i = {}, s = {};
  for (let o = 1; o <= t.length; o++)
    s[o + r] = a[o], i[o + r] = !0, r += Nr(t[o - 1]);
  e[n] = s, e[n]._emit = i, e[n]._multi = !0;
}
function Ko(e) {
  if (Array.isArray(e.begin)) {
    if (e.skip || e.excludeBegin || e.returnBegin)
      throw Pe("skip, excludeBegin, returnBegin not compatible with beginScope: {}"), mt;
    if (typeof e.beginScope != "object" || e.beginScope === null)
      throw Pe("beginScope must be object"), mt;
    Ir(e, e.begin, { key: "beginScope" }), e.begin = Qt(e.begin, { joinWith: "" });
  }
}
function Go(e) {
  if (Array.isArray(e.end)) {
    if (e.skip || e.excludeEnd || e.returnEnd)
      throw Pe("skip, excludeEnd, returnEnd not compatible with endScope: {}"), mt;
    if (typeof e.endScope != "object" || e.endScope === null)
      throw Pe("endScope must be object"), mt;
    Ir(e, e.end, { key: "endScope" }), e.end = Qt(e.end, { joinWith: "" });
  }
}
function Yo(e) {
  e.scope && typeof e.scope == "object" && e.scope !== null && (e.beginScope = e.scope, delete e.scope);
}
function Xo(e) {
  Yo(e), typeof e.beginScope == "string" && (e.beginScope = { _wrap: e.beginScope }), typeof e.endScope == "string" && (e.endScope = { _wrap: e.endScope }), Ko(e), Go(e);
}
function Vo(e) {
  function t(s, o) {
    return new RegExp(
      st(s),
      "m" + (e.case_insensitive ? "i" : "") + (e.unicodeRegex ? "u" : "") + (o ? "g" : "")
    );
  }
  class n {
    constructor() {
      this.matchIndexes = {}, this.regexes = [], this.matchAt = 1, this.position = 0;
    }
    // @ts-ignore
    addRule(o, l) {
      l.position = this.position++, this.matchIndexes[this.matchAt] = l, this.regexes.push([l, o]), this.matchAt += Nr(o) + 1;
    }
    compile() {
      this.regexes.length === 0 && (this.exec = () => null);
      const o = this.regexes.map((l) => l[1]);
      this.matcherRe = t(Qt(o, { joinWith: "|" }), !0), this.lastIndex = 0;
    }
    /** @param {string} s */
    exec(o) {
      this.matcherRe.lastIndex = this.lastIndex;
      const l = this.matcherRe.exec(o);
      if (!l)
        return null;
      const c = l.findIndex((p, f) => f > 0 && p !== void 0), d = this.matchIndexes[c];
      return l.splice(0, c), Object.assign(l, d);
    }
  }
  class r {
    constructor() {
      this.rules = [], this.multiRegexes = [], this.count = 0, this.lastIndex = 0, this.regexIndex = 0;
    }
    // @ts-ignore
    getMatcher(o) {
      if (this.multiRegexes[o]) return this.multiRegexes[o];
      const l = new n();
      return this.rules.slice(o).forEach(([c, d]) => l.addRule(c, d)), l.compile(), this.multiRegexes[o] = l, l;
    }
    resumingScanAtSamePosition() {
      return this.regexIndex !== 0;
    }
    considerAll() {
      this.regexIndex = 0;
    }
    // @ts-ignore
    addRule(o, l) {
      this.rules.push([o, l]), l.type === "begin" && this.count++;
    }
    /** @param {string} s */
    exec(o) {
      const l = this.getMatcher(this.regexIndex);
      l.lastIndex = this.lastIndex;
      let c = l.exec(o);
      if (this.resumingScanAtSamePosition() && !(c && c.index === this.lastIndex)) {
        const d = this.getMatcher(0);
        d.lastIndex = this.lastIndex + 1, c = d.exec(o);
      }
      return c && (this.regexIndex += c.position + 1, this.regexIndex === this.count && this.considerAll()), c;
    }
  }
  function a(s) {
    const o = new r();
    return s.contains.forEach((l) => o.addRule(l.begin, { rule: l, type: "begin" })), s.terminatorEnd && o.addRule(s.terminatorEnd, { type: "end" }), s.illegal && o.addRule(s.illegal, { type: "illegal" }), o;
  }
  function i(s, o) {
    const l = (
      /** @type CompiledMode */
      s
    );
    if (s.isCompiled) return l;
    [
      Oo,
      // do this early so compiler extensions generally don't have to worry about
      // the distinction between match/begin
      Uo,
      Xo,
      jo
    ].forEach((d) => d(s, o)), e.compilerExtensions.forEach((d) => d(s, o)), s.__beforeBegin = null, [
      Lo,
      // do this later so compiler extensions that come earlier have access to the
      // raw array if they wanted to perhaps manipulate it, etc.
      $o,
      // default to 1 relevance if not specified
      Po
    ].forEach((d) => d(s, o)), s.isCompiled = !0;
    let c = null;
    return typeof s.keywords == "object" && s.keywords.$pattern && (s.keywords = Object.assign({}, s.keywords), c = s.keywords.$pattern, delete s.keywords.$pattern), c = c || /\w+/, s.keywords && (s.keywords = Mr(s.keywords, e.case_insensitive)), l.keywordPatternRe = t(c, !0), o && (s.begin || (s.begin = /\B|\b/), l.beginRe = t(l.begin), !s.end && !s.endsWithParent && (s.end = /\B|\b/), s.end && (l.endRe = t(l.end)), l.terminatorEnd = st(l.end) || "", s.endsWithParent && o.terminatorEnd && (l.terminatorEnd += (s.end ? "|" : "") + o.terminatorEnd)), s.illegal && (l.illegalRe = t(
      /** @type {RegExp | string} */
      s.illegal
    )), s.contains || (s.contains = []), s.contains = [].concat(...s.contains.map(function(d) {
      return Qo(d === "self" ? s : d);
    })), s.contains.forEach(function(d) {
      i(
        /** @type Mode */
        d,
        l
      );
    }), s.starts && i(s.starts, o), l.matcher = a(l), l;
  }
  if (e.compilerExtensions || (e.compilerExtensions = []), e.contains && e.contains.includes("self"))
    throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");
  return e.classNameAliases = Oe(e.classNameAliases || {}), i(
    /** @type Mode */
    e
  );
}
function Br(e) {
  return e ? e.endsWithParent || Br(e.starts) : !1;
}
function Qo(e) {
  return e.variants && !e.cachedVariants && (e.cachedVariants = e.variants.map(function(t) {
    return Oe(e, { variants: null }, t);
  })), e.cachedVariants ? e.cachedVariants : Br(e) ? Oe(e, { starts: e.starts ? Oe(e.starts) : null }) : Object.isFrozen(e) ? Oe(e) : e;
}
var el = "11.11.1";
class tl extends Error {
  constructor(t, n) {
    super(t), this.name = "HTMLInjectionError", this.html = n;
  }
}
const St = Cr, In = Oe, Bn = Symbol("nomatch"), nl = 7, Or = function(e) {
  const t = /* @__PURE__ */ Object.create(null), n = /* @__PURE__ */ Object.create(null), r = [];
  let a = !0;
  const i = "Could not find the language '{}', did you forget to load/include a language module?", s = { disableAutodetect: !0, name: "Plain text", contains: [] };
  let o = {
    ignoreUnescapedHTML: !1,
    throwUnescapedHTML: !1,
    noHighlightRe: /^(no-?highlight)$/i,
    languageDetectRe: /\blang(?:uage)?-([\w-]+)\b/i,
    classPrefix: "hljs-",
    cssSelector: "pre code",
    languages: null,
    // beta configuration options, subject to change, welcome to discuss
    // https://github.com/highlightjs/highlight.js/issues/1086
    __emitter: fo
  };
  function l(E) {
    return o.noHighlightRe.test(E);
  }
  function c(E) {
    let C = E.className + " ";
    C += E.parentNode ? E.parentNode.className : "";
    const D = o.languageDetectRe.exec(C);
    if (D) {
      const P = z(D[1]);
      return P || (Mn(i.replace("{}", D[1])), Mn("Falling back to no-highlight mode for this block.", E)), P ? D[1] : "no-highlight";
    }
    return C.split(/\s+/).find((P) => l(P) || z(P));
  }
  function d(E, C, D) {
    let P = "", W = "";
    typeof C == "object" ? (P = E, D = C.ignoreIllegals, W = C.language) : (We("10.7.0", "highlight(lang, code, ...args) has been deprecated."), We("10.7.0", `Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`), W = E, P = C), D === void 0 && (D = !0);
    const L = {
      code: P,
      language: W
    };
    H("before:highlight", L);
    const ee = L.result ? L.result : p(L.language, L.code, D);
    return ee.code = L.code, H("after:highlight", ee), ee;
  }
  function p(E, C, D, P) {
    const W = /* @__PURE__ */ Object.create(null);
    function L(q, I) {
      return q.keywords[I];
    }
    function ee() {
      if (!U.keywords) {
        se.addText(M);
        return;
      }
      let q = 0;
      U.keywordPatternRe.lastIndex = 0;
      let I = U.keywordPatternRe.exec(M), Z = "";
      for (; I; ) {
        Z += M.substring(q, I.index);
        const ne = te.case_insensitive ? I[0].toLowerCase() : I[0], me = L(U, ne);
        if (me) {
          const [De, Vr] = me;
          if (se.addText(Z), Z = "", W[ne] = (W[ne] || 0) + 1, W[ne] <= nl && (G += Vr), De.startsWith("_"))
            Z += I[0];
          else {
            const Qr = te.classNameAliases[De] || De;
            oe(I[0], Qr);
          }
        } else
          Z += I[0];
        q = U.keywordPatternRe.lastIndex, I = U.keywordPatternRe.exec(M);
      }
      Z += M.substring(q), se.addText(Z);
    }
    function le() {
      if (M === "") return;
      let q = null;
      if (typeof U.subLanguage == "string") {
        if (!t[U.subLanguage]) {
          se.addText(M);
          return;
        }
        q = p(U.subLanguage, M, !0, Xe[U.subLanguage]), Xe[U.subLanguage] = /** @type {CompiledMode} */
        q._top;
      } else
        q = g(M, U.subLanguage.length ? U.subLanguage : null);
      U.relevance > 0 && (G += q.relevance), se.__addSublanguage(q._emitter, q.language);
    }
    function ce() {
      U.subLanguage != null ? le() : ee(), M = "";
    }
    function oe(q, I) {
      q !== "" && (se.startScope(I), se.addText(q), se.endScope());
    }
    function fe(q, I) {
      let Z = 1;
      const ne = I.length - 1;
      for (; Z <= ne; ) {
        if (!q._emit[Z]) {
          Z++;
          continue;
        }
        const me = te.classNameAliases[q[Z]] || q[Z], De = I[Z];
        me ? oe(De, me) : (M = De, ee(), M = ""), Z++;
      }
    }
    function be(q, I) {
      return q.scope && typeof q.scope == "string" && se.openNode(te.classNameAliases[q.scope] || q.scope), q.beginScope && (q.beginScope._wrap ? (oe(M, te.classNameAliases[q.beginScope._wrap] || q.beginScope._wrap), M = "") : q.beginScope._multi && (fe(q.beginScope, I), M = "")), U = Object.create(q, { parent: { value: U } }), U;
    }
    function Y(q, I, Z) {
      let ne = vo(q.endRe, Z);
      if (ne) {
        if (q["on:end"]) {
          const me = new Dn(q);
          q["on:end"](I, me), me.isMatchIgnored && (ne = !1);
        }
        if (ne) {
          for (; q.endsParent && q.parent; )
            q = q.parent;
          return q;
        }
      }
      if (q.endsWithParent)
        return Y(q.parent, I, Z);
    }
    function S(q) {
      return U.matcher.regexIndex === 0 ? (M += q[0], 1) : (ke = !0, 0);
    }
    function X(q) {
      const I = q[0], Z = q.rule, ne = new Dn(Z), me = [Z.__beforeBegin, Z["on:begin"]];
      for (const De of me)
        if (De && (De(q, ne), ne.isMatchIgnored))
          return S(I);
      return Z.skip ? M += I : (Z.excludeBegin && (M += I), ce(), !Z.returnBegin && !Z.excludeBegin && (M = I)), be(Z, q), Z.returnBegin ? 0 : I.length;
    }
    function ue(q) {
      const I = q[0], Z = C.substring(q.index), ne = Y(U, q, Z);
      if (!ne)
        return Bn;
      const me = U;
      U.endScope && U.endScope._wrap ? (ce(), oe(I, U.endScope._wrap)) : U.endScope && U.endScope._multi ? (ce(), fe(U.endScope, q)) : me.skip ? M += I : (me.returnEnd || me.excludeEnd || (M += I), ce(), me.excludeEnd && (M = I));
      do
        U.scope && se.closeNode(), !U.skip && !U.subLanguage && (G += U.relevance), U = U.parent;
      while (U !== ne.parent);
      return ne.starts && be(ne.starts, q), me.returnEnd ? 0 : I.length;
    }
    function K() {
      const q = [];
      for (let I = U; I !== te; I = I.parent)
        I.scope && q.unshift(I.scope);
      q.forEach((I) => se.openNode(I));
    }
    let $ = {};
    function V(q, I) {
      const Z = I && I[0];
      if (M += q, Z == null)
        return ce(), 0;
      if ($.type === "begin" && I.type === "end" && $.index === I.index && Z === "") {
        if (M += C.slice(I.index, I.index + 1), !a) {
          const ne = new Error(`0 width match regex (${E})`);
          throw ne.languageName = E, ne.badRule = $.rule, ne;
        }
        return 1;
      }
      if ($ = I, I.type === "begin")
        return X(I);
      if (I.type === "illegal" && !D) {
        const ne = new Error('Illegal lexeme "' + Z + '" for mode "' + (U.scope || "<unnamed>") + '"');
        throw ne.mode = U, ne;
      } else if (I.type === "end") {
        const ne = ue(I);
        if (ne !== Bn)
          return ne;
      }
      if (I.type === "illegal" && Z === "")
        return M += `
`, 1;
      if (Ee > 1e5 && Ee > I.index * 3)
        throw new Error("potential infinite loop, way more iterations than matches");
      return M += Z, Z.length;
    }
    const te = z(E);
    if (!te)
      throw Pe(i.replace("{}", E)), new Error('Unknown language: "' + E + '"');
    const Re = Vo(te);
    let Me = "", U = P || Re;
    const Xe = {}, se = new o.__emitter(o);
    K();
    let M = "", G = 0, re = 0, Ee = 0, ke = !1;
    try {
      if (te.__emitTokens)
        te.__emitTokens(C, se);
      else {
        for (U.matcher.considerAll(); ; ) {
          Ee++, ke ? ke = !1 : U.matcher.considerAll(), U.matcher.lastIndex = re;
          const q = U.matcher.exec(C);
          if (!q) break;
          const I = C.substring(re, q.index), Z = V(I, q);
          re = q.index + Z;
        }
        V(C.substring(re));
      }
      return se.finalize(), Me = se.toHTML(), {
        language: E,
        value: Me,
        relevance: G,
        illegal: !1,
        _emitter: se,
        _top: U
      };
    } catch (q) {
      if (q.message && q.message.includes("Illegal"))
        return {
          language: E,
          value: St(C),
          illegal: !0,
          relevance: 0,
          _illegalBy: {
            message: q.message,
            index: re,
            context: C.slice(re - 100, re + 100),
            mode: q.mode,
            resultSoFar: Me
          },
          _emitter: se
        };
      if (a)
        return {
          language: E,
          value: St(C),
          illegal: !1,
          relevance: 0,
          errorRaised: q,
          _emitter: se,
          _top: U
        };
      throw q;
    }
  }
  function f(E) {
    const C = {
      value: St(E),
      illegal: !1,
      relevance: 0,
      _top: s,
      _emitter: new o.__emitter(o)
    };
    return C._emitter.addText(E), C;
  }
  function g(E, C) {
    C = C || o.languages || Object.keys(t);
    const D = f(E), P = C.filter(z).filter(O).map(
      (ce) => p(ce, E, !1)
    );
    P.unshift(D);
    const W = P.sort((ce, oe) => {
      if (ce.relevance !== oe.relevance) return oe.relevance - ce.relevance;
      if (ce.language && oe.language) {
        if (z(ce.language).supersetOf === oe.language)
          return 1;
        if (z(oe.language).supersetOf === ce.language)
          return -1;
      }
      return 0;
    }), [L, ee] = W, le = L;
    return le.secondBest = ee, le;
  }
  function h(E, C, D) {
    const P = C && n[C] || D;
    E.classList.add("hljs"), E.classList.add(`language-${P}`);
  }
  function w(E) {
    let C = null;
    const D = c(E);
    if (l(D)) return;
    if (H(
      "before:highlightElement",
      { el: E, language: D }
    ), E.dataset.highlighted) {
      console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.", E);
      return;
    }
    if (E.children.length > 0 && (o.ignoreUnescapedHTML || (console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."), console.warn("https://github.com/highlightjs/highlight.js/wiki/security"), console.warn("The element with unescaped HTML:"), console.warn(E)), o.throwUnescapedHTML))
      throw new tl(
        "One of your code blocks includes unescaped HTML.",
        E.innerHTML
      );
    C = E;
    const P = C.textContent, W = D ? d(P, { language: D, ignoreIllegals: !0 }) : g(P);
    E.innerHTML = W.value, E.dataset.highlighted = "yes", h(E, D, W.language), E.result = {
      language: W.language,
      // TODO: remove with version 11.0
      re: W.relevance,
      relevance: W.relevance
    }, W.secondBest && (E.secondBest = {
      language: W.secondBest.language,
      relevance: W.secondBest.relevance
    }), H("after:highlightElement", { el: E, result: W, text: P });
  }
  function x(E) {
    o = In(o, E);
  }
  const v = () => {
    y(), We("10.6.0", "initHighlighting() deprecated.  Use highlightAll() now.");
  };
  function b() {
    y(), We("10.6.0", "initHighlightingOnLoad() deprecated.  Use highlightAll() now.");
  }
  let _ = !1;
  function y() {
    function E() {
      y();
    }
    if (document.readyState === "loading") {
      _ || window.addEventListener("DOMContentLoaded", E, !1), _ = !0;
      return;
    }
    document.querySelectorAll(o.cssSelector).forEach(w);
  }
  function R(E, C) {
    let D = null;
    try {
      D = C(e);
    } catch (P) {
      if (Pe("Language definition for '{}' could not be registered.".replace("{}", E)), a)
        Pe(P);
      else
        throw P;
      D = s;
    }
    D.name || (D.name = E), t[E] = D, D.rawDefinition = C.bind(null, e), D.aliases && A(D.aliases, { languageName: E });
  }
  function k(E) {
    delete t[E];
    for (const C of Object.keys(n))
      n[C] === E && delete n[C];
  }
  function F() {
    return Object.keys(t);
  }
  function z(E) {
    return E = (E || "").toLowerCase(), t[E] || t[n[E]];
  }
  function A(E, { languageName: C }) {
    typeof E == "string" && (E = [E]), E.forEach((D) => {
      n[D.toLowerCase()] = C;
    });
  }
  function O(E) {
    const C = z(E);
    return C && !C.disableAutodetect;
  }
  function j(E) {
    E["before:highlightBlock"] && !E["before:highlightElement"] && (E["before:highlightElement"] = (C) => {
      E["before:highlightBlock"](
        Object.assign({ block: C.el }, C)
      );
    }), E["after:highlightBlock"] && !E["after:highlightElement"] && (E["after:highlightElement"] = (C) => {
      E["after:highlightBlock"](
        Object.assign({ block: C.el }, C)
      );
    });
  }
  function B(E) {
    j(E), r.push(E);
  }
  function J(E) {
    const C = r.indexOf(E);
    C !== -1 && r.splice(C, 1);
  }
  function H(E, C) {
    const D = E;
    r.forEach(function(P) {
      P[D] && P[D](C);
    });
  }
  function ie(E) {
    return We("10.7.0", "highlightBlock will be removed entirely in v12.0"), We("10.7.0", "Please use highlightElement now."), w(E);
  }
  Object.assign(e, {
    highlight: d,
    highlightAuto: g,
    highlightAll: y,
    highlightElement: w,
    // TODO: Remove with v12 API
    highlightBlock: ie,
    configure: x,
    initHighlighting: v,
    initHighlightingOnLoad: b,
    registerLanguage: R,
    unregisterLanguage: k,
    listLanguages: F,
    getLanguage: z,
    registerAliases: A,
    autoDetection: O,
    inherit: In,
    addPlugin: B,
    removePlugin: J
  }), e.debugMode = function() {
    a = !1;
  }, e.safeMode = function() {
    a = !0;
  }, e.versionString = el, e.regex = {
    concat: Je,
    lookahead: Ar,
    either: Vt,
    optional: mo,
    anyNumberOfTimes: go
  };
  for (const E in dt)
    typeof dt[E] == "object" && qr(dt[E]);
  return Object.assign(e, dt), e;
}, Ye = Or({});
Ye.newInstance = () => Or({});
var rl = Ye;
Ye.HighlightJS = Ye;
Ye.default = Ye;
const al = /* @__PURE__ */ co(rl), On = "[A-Za-z$_][0-9A-Za-z$_]*", il = [
  "as",
  // for exports
  "in",
  "of",
  "if",
  "for",
  "while",
  "finally",
  "var",
  "new",
  "function",
  "do",
  "return",
  "void",
  "else",
  "break",
  "catch",
  "instanceof",
  "with",
  "throw",
  "case",
  "default",
  "try",
  "switch",
  "continue",
  "typeof",
  "delete",
  "let",
  "yield",
  "const",
  "class",
  // JS handles these with a special rule
  // "get",
  // "set",
  "debugger",
  "async",
  "await",
  "static",
  "import",
  "from",
  "export",
  "extends",
  // It's reached stage 3, which is "recommended for implementation":
  "using"
], sl = [
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity"
], Lr = [
  // Fundamental objects
  "Object",
  "Function",
  "Boolean",
  "Symbol",
  // numbers and dates
  "Math",
  "Date",
  "Number",
  "BigInt",
  // text
  "String",
  "RegExp",
  // Indexed collections
  "Array",
  "Float32Array",
  "Float64Array",
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Int32Array",
  "Uint16Array",
  "Uint32Array",
  "BigInt64Array",
  "BigUint64Array",
  // Keyed collections
  "Set",
  "Map",
  "WeakSet",
  "WeakMap",
  // Structured data
  "ArrayBuffer",
  "SharedArrayBuffer",
  "Atomics",
  "DataView",
  "JSON",
  // Control abstraction objects
  "Promise",
  "Generator",
  "GeneratorFunction",
  "AsyncFunction",
  // Reflection
  "Reflect",
  "Proxy",
  // Internationalization
  "Intl",
  // WebAssembly
  "WebAssembly"
], $r = [
  "Error",
  "EvalError",
  "InternalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError"
], Ur = [
  "setInterval",
  "setTimeout",
  "clearInterval",
  "clearTimeout",
  "require",
  "exports",
  "eval",
  "isFinite",
  "isNaN",
  "parseFloat",
  "parseInt",
  "decodeURI",
  "decodeURIComponent",
  "encodeURI",
  "encodeURIComponent",
  "escape",
  "unescape"
], ol = [
  "arguments",
  "this",
  "super",
  "console",
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "module",
  "global"
  // Node.js
], ll = [].concat(
  Ur,
  Lr,
  $r
);
function cl(e) {
  const t = e.regex, n = (D, { after: P }) => {
    const W = "</" + D[0].slice(1);
    return D.input.indexOf(W, P) !== -1;
  }, r = On, a = {
    begin: "<>",
    end: "</>"
  }, i = /<[A-Za-z0-9\\._:-]+\s*\/>/, s = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
    /**
     * @param {RegExpMatchArray} match
     * @param {CallbackResponse} response
     */
    isTrulyOpeningTag: (D, P) => {
      const W = D[0].length + D.index, L = D.input[W];
      if (
        // HTML should not include another raw `<` inside a tag
        // nested type?
        // `<Array<Array<number>>`, etc.
        L === "<" || // the , gives away that this is not HTML
        // `<T, A extends keyof T, V>`
        L === ","
      ) {
        P.ignoreMatch();
        return;
      }
      L === ">" && (n(D, { after: W }) || P.ignoreMatch());
      let ee;
      const le = D.input.substring(W);
      if (ee = le.match(/^\s*=/)) {
        P.ignoreMatch();
        return;
      }
      if ((ee = le.match(/^\s+extends\s+/)) && ee.index === 0) {
        P.ignoreMatch();
        return;
      }
    }
  }, o = {
    $pattern: On,
    keyword: il,
    literal: sl,
    built_in: ll,
    "variable.language": ol
  }, l = "[0-9](_?[0-9])*", c = `\\.(${l})`, d = "0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*", p = {
    className: "number",
    variants: [
      // DecimalLiteral
      { begin: `(\\b(${d})((${c})|\\.)?|(${c}))[eE][+-]?(${l})\\b` },
      { begin: `\\b(${d})\\b((${c})\\b|\\.)?|(${c})\\b` },
      // DecimalBigIntegerLiteral
      { begin: "\\b(0|[1-9](_?[0-9])*)n\\b" },
      // NonDecimalIntegerLiteral
      { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
      { begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
      { begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
      // LegacyOctalIntegerLiteral (does not include underscore separators)
      // https://tc39.es/ecma262/#sec-additional-syntax-numeric-literals
      { begin: "\\b0[0-7]+n?\\b" }
    ],
    relevance: 0
  }, f = {
    className: "subst",
    begin: "\\$\\{",
    end: "\\}",
    keywords: o,
    contains: []
    // defined later
  }, g = {
    begin: ".?html`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        e.BACKSLASH_ESCAPE,
        f
      ],
      subLanguage: "xml"
    }
  }, h = {
    begin: ".?css`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        e.BACKSLASH_ESCAPE,
        f
      ],
      subLanguage: "css"
    }
  }, w = {
    begin: ".?gql`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        e.BACKSLASH_ESCAPE,
        f
      ],
      subLanguage: "graphql"
    }
  }, x = {
    className: "string",
    begin: "`",
    end: "`",
    contains: [
      e.BACKSLASH_ESCAPE,
      f
    ]
  }, b = {
    className: "comment",
    variants: [
      e.COMMENT(
        /\/\*\*(?!\/)/,
        "\\*/",
        {
          relevance: 0,
          contains: [
            {
              begin: "(?=@[A-Za-z]+)",
              relevance: 0,
              contains: [
                {
                  className: "doctag",
                  begin: "@[A-Za-z]+"
                },
                {
                  className: "type",
                  begin: "\\{",
                  end: "\\}",
                  excludeEnd: !0,
                  excludeBegin: !0,
                  relevance: 0
                },
                {
                  className: "variable",
                  begin: r + "(?=\\s*(-)|$)",
                  endsParent: !0,
                  relevance: 0
                },
                // eat spaces (not newlines) so we can find
                // types or variables
                {
                  begin: /(?=[^\n])\s/,
                  relevance: 0
                }
              ]
            }
          ]
        }
      ),
      e.C_BLOCK_COMMENT_MODE,
      e.C_LINE_COMMENT_MODE
    ]
  }, _ = [
    e.APOS_STRING_MODE,
    e.QUOTE_STRING_MODE,
    g,
    h,
    w,
    x,
    // Skip numbers when they are part of a variable name
    { match: /\$\d+/ },
    p
    // This is intentional:
    // See https://github.com/highlightjs/highlight.js/issues/3288
    // hljs.REGEXP_MODE
  ];
  f.contains = _.concat({
    // we need to pair up {} inside our subst to prevent
    // it from ending too early by matching another }
    begin: /\{/,
    end: /\}/,
    keywords: o,
    contains: [
      "self"
    ].concat(_)
  });
  const y = [].concat(b, f.contains), R = y.concat([
    // eat recursive parens in sub expressions
    {
      begin: /(\s*)\(/,
      end: /\)/,
      keywords: o,
      contains: ["self"].concat(y)
    }
  ]), k = {
    className: "params",
    // convert this to negative lookbehind in v12
    begin: /(\s*)\(/,
    // to match the parms with
    end: /\)/,
    excludeBegin: !0,
    excludeEnd: !0,
    keywords: o,
    contains: R
  }, F = {
    variants: [
      // class Car extends vehicle
      {
        match: [
          /class/,
          /\s+/,
          r,
          /\s+/,
          /extends/,
          /\s+/,
          t.concat(r, "(", t.concat(/\./, r), ")*")
        ],
        scope: {
          1: "keyword",
          3: "title.class",
          5: "keyword",
          7: "title.class.inherited"
        }
      },
      // class Car
      {
        match: [
          /class/,
          /\s+/,
          r
        ],
        scope: {
          1: "keyword",
          3: "title.class"
        }
      }
    ]
  }, z = {
    relevance: 0,
    match: t.either(
      // Hard coded exceptions
      /\bJSON/,
      // Float32Array, OutT
      /\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,
      // CSSFactory, CSSFactoryT
      /\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,
      // FPs, FPsT
      /\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/
      // P
      // single letters are not highlighted
      // BLAH
      // this will be flagged as a UPPER_CASE_CONSTANT instead
    ),
    className: "title.class",
    keywords: {
      _: [
        // se we still get relevance credit for JS library classes
        ...Lr,
        ...$r
      ]
    }
  }, A = {
    label: "use_strict",
    className: "meta",
    relevance: 10,
    begin: /^\s*['"]use (strict|asm)['"]/
  }, O = {
    variants: [
      {
        match: [
          /function/,
          /\s+/,
          r,
          /(?=\s*\()/
        ]
      },
      // anonymous function
      {
        match: [
          /function/,
          /\s*(?=\()/
        ]
      }
    ],
    className: {
      1: "keyword",
      3: "title.function"
    },
    label: "func.def",
    contains: [k],
    illegal: /%/
  }, j = {
    relevance: 0,
    match: /\b[A-Z][A-Z_0-9]+\b/,
    className: "variable.constant"
  };
  function B(D) {
    return t.concat("(?!", D.join("|"), ")");
  }
  const J = {
    match: t.concat(
      /\b/,
      B([
        ...Ur,
        "super",
        "import"
      ].map((D) => `${D}\\s*\\(`)),
      r,
      t.lookahead(/\s*\(/)
    ),
    className: "title.function",
    relevance: 0
  }, H = {
    begin: t.concat(/\./, t.lookahead(
      t.concat(r, /(?![0-9A-Za-z$_(])/)
    )),
    end: r,
    excludeBegin: !0,
    keywords: "prototype",
    className: "property",
    relevance: 0
  }, ie = {
    match: [
      /get|set/,
      /\s+/,
      r,
      /(?=\()/
    ],
    className: {
      1: "keyword",
      3: "title.function"
    },
    contains: [
      {
        // eat to avoid empty params
        begin: /\(\)/
      },
      k
    ]
  }, E = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + e.UNDERSCORE_IDENT_RE + ")\\s*=>", C = {
    match: [
      /const|var|let/,
      /\s+/,
      r,
      /\s*/,
      /=\s*/,
      /(async\s*)?/,
      // async is optional
      t.lookahead(E)
    ],
    keywords: "async",
    className: {
      1: "keyword",
      3: "title.function"
    },
    contains: [
      k
    ]
  };
  return {
    name: "JavaScript",
    aliases: ["js", "jsx", "mjs", "cjs"],
    keywords: o,
    // this will be extended by TypeScript
    exports: { PARAMS_CONTAINS: R, CLASS_REFERENCE: z },
    illegal: /#(?![$_A-z])/,
    contains: [
      e.SHEBANG({
        label: "shebang",
        binary: "node",
        relevance: 5
      }),
      A,
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE,
      g,
      h,
      w,
      x,
      b,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      p,
      z,
      {
        scope: "attr",
        match: r + t.lookahead(":"),
        relevance: 0
      },
      C,
      {
        // "value" container
        begin: "(" + e.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
        keywords: "return throw case",
        relevance: 0,
        contains: [
          b,
          e.REGEXP_MODE,
          {
            className: "function",
            // we have to count the parens to make sure we actually have the
            // correct bounding ( ) before the =>.  There could be any number of
            // sub-expressions inside also surrounded by parens.
            begin: E,
            returnBegin: !0,
            end: "\\s*=>",
            contains: [
              {
                className: "params",
                variants: [
                  {
                    begin: e.UNDERSCORE_IDENT_RE,
                    relevance: 0
                  },
                  {
                    className: null,
                    begin: /\(\s*\)/,
                    skip: !0
                  },
                  {
                    begin: /(\s*)\(/,
                    end: /\)/,
                    excludeBegin: !0,
                    excludeEnd: !0,
                    keywords: o,
                    contains: R
                  }
                ]
              }
            ]
          },
          {
            // could be a comma delimited list of params to a function call
            begin: /,/,
            relevance: 0
          },
          {
            match: /\s+/,
            relevance: 0
          },
          {
            // JSX
            variants: [
              { begin: a.begin, end: a.end },
              { match: i },
              {
                begin: s.begin,
                // we carefully check the opening tag to see if it truly
                // is a tag and not a false positive
                "on:begin": s.isTrulyOpeningTag,
                end: s.end
              }
            ],
            subLanguage: "xml",
            contains: [
              {
                begin: s.begin,
                end: s.end,
                skip: !0,
                contains: ["self"]
              }
            ]
          }
        ]
      },
      O,
      {
        // prevent this from getting swallowed up by function
        // since they appear "function like"
        beginKeywords: "while if switch catch for"
      },
      {
        // we have to count the parens to make sure we actually have the correct
        // bounding ( ).  There could be any number of sub-expressions inside
        // also surrounded by parens.
        begin: "\\b(?!function)" + e.UNDERSCORE_IDENT_RE + "\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
        // end parens
        returnBegin: !0,
        label: "func.def",
        contains: [
          k,
          e.inherit(e.TITLE_MODE, { begin: r, className: "title.function" })
        ]
      },
      // catch ... so it won't trigger the property rule below
      {
        match: /\.\.\./,
        relevance: 0
      },
      H,
      // hack: prevents detection of keywords in some circumstances
      // .keyword()
      // $keyword = x
      {
        match: "\\$" + r,
        relevance: 0
      },
      {
        match: [/\bconstructor(?=\s*\()/],
        className: { 1: "title.function" },
        contains: [k]
      },
      J,
      j,
      F,
      ie,
      {
        match: /\$[(.]/
        // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
      }
    ]
  };
}
const bt = "[A-Za-z$_][0-9A-Za-z$_]*", Pr = [
  "as",
  // for exports
  "in",
  "of",
  "if",
  "for",
  "while",
  "finally",
  "var",
  "new",
  "function",
  "do",
  "return",
  "void",
  "else",
  "break",
  "catch",
  "instanceof",
  "with",
  "throw",
  "case",
  "default",
  "try",
  "switch",
  "continue",
  "typeof",
  "delete",
  "let",
  "yield",
  "const",
  "class",
  // JS handles these with a special rule
  // "get",
  // "set",
  "debugger",
  "async",
  "await",
  "static",
  "import",
  "from",
  "export",
  "extends",
  // It's reached stage 3, which is "recommended for implementation":
  "using"
], jr = [
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity"
], Jr = [
  // Fundamental objects
  "Object",
  "Function",
  "Boolean",
  "Symbol",
  // numbers and dates
  "Math",
  "Date",
  "Number",
  "BigInt",
  // text
  "String",
  "RegExp",
  // Indexed collections
  "Array",
  "Float32Array",
  "Float64Array",
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Int32Array",
  "Uint16Array",
  "Uint32Array",
  "BigInt64Array",
  "BigUint64Array",
  // Keyed collections
  "Set",
  "Map",
  "WeakSet",
  "WeakMap",
  // Structured data
  "ArrayBuffer",
  "SharedArrayBuffer",
  "Atomics",
  "DataView",
  "JSON",
  // Control abstraction objects
  "Promise",
  "Generator",
  "GeneratorFunction",
  "AsyncFunction",
  // Reflection
  "Reflect",
  "Proxy",
  // Internationalization
  "Intl",
  // WebAssembly
  "WebAssembly"
], Wr = [
  "Error",
  "EvalError",
  "InternalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError"
], Zr = [
  "setInterval",
  "setTimeout",
  "clearInterval",
  "clearTimeout",
  "require",
  "exports",
  "eval",
  "isFinite",
  "isNaN",
  "parseFloat",
  "parseInt",
  "decodeURI",
  "decodeURIComponent",
  "encodeURI",
  "encodeURIComponent",
  "escape",
  "unescape"
], Hr = [
  "arguments",
  "this",
  "super",
  "console",
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "module",
  "global"
  // Node.js
], Kr = [].concat(
  Zr,
  Jr,
  Wr
);
function ul(e) {
  const t = e.regex, n = (D, { after: P }) => {
    const W = "</" + D[0].slice(1);
    return D.input.indexOf(W, P) !== -1;
  }, r = bt, a = {
    begin: "<>",
    end: "</>"
  }, i = /<[A-Za-z0-9\\._:-]+\s*\/>/, s = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
    /**
     * @param {RegExpMatchArray} match
     * @param {CallbackResponse} response
     */
    isTrulyOpeningTag: (D, P) => {
      const W = D[0].length + D.index, L = D.input[W];
      if (
        // HTML should not include another raw `<` inside a tag
        // nested type?
        // `<Array<Array<number>>`, etc.
        L === "<" || // the , gives away that this is not HTML
        // `<T, A extends keyof T, V>`
        L === ","
      ) {
        P.ignoreMatch();
        return;
      }
      L === ">" && (n(D, { after: W }) || P.ignoreMatch());
      let ee;
      const le = D.input.substring(W);
      if (ee = le.match(/^\s*=/)) {
        P.ignoreMatch();
        return;
      }
      if ((ee = le.match(/^\s+extends\s+/)) && ee.index === 0) {
        P.ignoreMatch();
        return;
      }
    }
  }, o = {
    $pattern: bt,
    keyword: Pr,
    literal: jr,
    built_in: Kr,
    "variable.language": Hr
  }, l = "[0-9](_?[0-9])*", c = `\\.(${l})`, d = "0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*", p = {
    className: "number",
    variants: [
      // DecimalLiteral
      { begin: `(\\b(${d})((${c})|\\.)?|(${c}))[eE][+-]?(${l})\\b` },
      { begin: `\\b(${d})\\b((${c})\\b|\\.)?|(${c})\\b` },
      // DecimalBigIntegerLiteral
      { begin: "\\b(0|[1-9](_?[0-9])*)n\\b" },
      // NonDecimalIntegerLiteral
      { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
      { begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
      { begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
      // LegacyOctalIntegerLiteral (does not include underscore separators)
      // https://tc39.es/ecma262/#sec-additional-syntax-numeric-literals
      { begin: "\\b0[0-7]+n?\\b" }
    ],
    relevance: 0
  }, f = {
    className: "subst",
    begin: "\\$\\{",
    end: "\\}",
    keywords: o,
    contains: []
    // defined later
  }, g = {
    begin: ".?html`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        e.BACKSLASH_ESCAPE,
        f
      ],
      subLanguage: "xml"
    }
  }, h = {
    begin: ".?css`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        e.BACKSLASH_ESCAPE,
        f
      ],
      subLanguage: "css"
    }
  }, w = {
    begin: ".?gql`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        e.BACKSLASH_ESCAPE,
        f
      ],
      subLanguage: "graphql"
    }
  }, x = {
    className: "string",
    begin: "`",
    end: "`",
    contains: [
      e.BACKSLASH_ESCAPE,
      f
    ]
  }, b = {
    className: "comment",
    variants: [
      e.COMMENT(
        /\/\*\*(?!\/)/,
        "\\*/",
        {
          relevance: 0,
          contains: [
            {
              begin: "(?=@[A-Za-z]+)",
              relevance: 0,
              contains: [
                {
                  className: "doctag",
                  begin: "@[A-Za-z]+"
                },
                {
                  className: "type",
                  begin: "\\{",
                  end: "\\}",
                  excludeEnd: !0,
                  excludeBegin: !0,
                  relevance: 0
                },
                {
                  className: "variable",
                  begin: r + "(?=\\s*(-)|$)",
                  endsParent: !0,
                  relevance: 0
                },
                // eat spaces (not newlines) so we can find
                // types or variables
                {
                  begin: /(?=[^\n])\s/,
                  relevance: 0
                }
              ]
            }
          ]
        }
      ),
      e.C_BLOCK_COMMENT_MODE,
      e.C_LINE_COMMENT_MODE
    ]
  }, _ = [
    e.APOS_STRING_MODE,
    e.QUOTE_STRING_MODE,
    g,
    h,
    w,
    x,
    // Skip numbers when they are part of a variable name
    { match: /\$\d+/ },
    p
    // This is intentional:
    // See https://github.com/highlightjs/highlight.js/issues/3288
    // hljs.REGEXP_MODE
  ];
  f.contains = _.concat({
    // we need to pair up {} inside our subst to prevent
    // it from ending too early by matching another }
    begin: /\{/,
    end: /\}/,
    keywords: o,
    contains: [
      "self"
    ].concat(_)
  });
  const y = [].concat(b, f.contains), R = y.concat([
    // eat recursive parens in sub expressions
    {
      begin: /(\s*)\(/,
      end: /\)/,
      keywords: o,
      contains: ["self"].concat(y)
    }
  ]), k = {
    className: "params",
    // convert this to negative lookbehind in v12
    begin: /(\s*)\(/,
    // to match the parms with
    end: /\)/,
    excludeBegin: !0,
    excludeEnd: !0,
    keywords: o,
    contains: R
  }, F = {
    variants: [
      // class Car extends vehicle
      {
        match: [
          /class/,
          /\s+/,
          r,
          /\s+/,
          /extends/,
          /\s+/,
          t.concat(r, "(", t.concat(/\./, r), ")*")
        ],
        scope: {
          1: "keyword",
          3: "title.class",
          5: "keyword",
          7: "title.class.inherited"
        }
      },
      // class Car
      {
        match: [
          /class/,
          /\s+/,
          r
        ],
        scope: {
          1: "keyword",
          3: "title.class"
        }
      }
    ]
  }, z = {
    relevance: 0,
    match: t.either(
      // Hard coded exceptions
      /\bJSON/,
      // Float32Array, OutT
      /\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,
      // CSSFactory, CSSFactoryT
      /\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,
      // FPs, FPsT
      /\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/
      // P
      // single letters are not highlighted
      // BLAH
      // this will be flagged as a UPPER_CASE_CONSTANT instead
    ),
    className: "title.class",
    keywords: {
      _: [
        // se we still get relevance credit for JS library classes
        ...Jr,
        ...Wr
      ]
    }
  }, A = {
    label: "use_strict",
    className: "meta",
    relevance: 10,
    begin: /^\s*['"]use (strict|asm)['"]/
  }, O = {
    variants: [
      {
        match: [
          /function/,
          /\s+/,
          r,
          /(?=\s*\()/
        ]
      },
      // anonymous function
      {
        match: [
          /function/,
          /\s*(?=\()/
        ]
      }
    ],
    className: {
      1: "keyword",
      3: "title.function"
    },
    label: "func.def",
    contains: [k],
    illegal: /%/
  }, j = {
    relevance: 0,
    match: /\b[A-Z][A-Z_0-9]+\b/,
    className: "variable.constant"
  };
  function B(D) {
    return t.concat("(?!", D.join("|"), ")");
  }
  const J = {
    match: t.concat(
      /\b/,
      B([
        ...Zr,
        "super",
        "import"
      ].map((D) => `${D}\\s*\\(`)),
      r,
      t.lookahead(/\s*\(/)
    ),
    className: "title.function",
    relevance: 0
  }, H = {
    begin: t.concat(/\./, t.lookahead(
      t.concat(r, /(?![0-9A-Za-z$_(])/)
    )),
    end: r,
    excludeBegin: !0,
    keywords: "prototype",
    className: "property",
    relevance: 0
  }, ie = {
    match: [
      /get|set/,
      /\s+/,
      r,
      /(?=\()/
    ],
    className: {
      1: "keyword",
      3: "title.function"
    },
    contains: [
      {
        // eat to avoid empty params
        begin: /\(\)/
      },
      k
    ]
  }, E = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + e.UNDERSCORE_IDENT_RE + ")\\s*=>", C = {
    match: [
      /const|var|let/,
      /\s+/,
      r,
      /\s*/,
      /=\s*/,
      /(async\s*)?/,
      // async is optional
      t.lookahead(E)
    ],
    keywords: "async",
    className: {
      1: "keyword",
      3: "title.function"
    },
    contains: [
      k
    ]
  };
  return {
    name: "JavaScript",
    aliases: ["js", "jsx", "mjs", "cjs"],
    keywords: o,
    // this will be extended by TypeScript
    exports: { PARAMS_CONTAINS: R, CLASS_REFERENCE: z },
    illegal: /#(?![$_A-z])/,
    contains: [
      e.SHEBANG({
        label: "shebang",
        binary: "node",
        relevance: 5
      }),
      A,
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE,
      g,
      h,
      w,
      x,
      b,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      p,
      z,
      {
        scope: "attr",
        match: r + t.lookahead(":"),
        relevance: 0
      },
      C,
      {
        // "value" container
        begin: "(" + e.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
        keywords: "return throw case",
        relevance: 0,
        contains: [
          b,
          e.REGEXP_MODE,
          {
            className: "function",
            // we have to count the parens to make sure we actually have the
            // correct bounding ( ) before the =>.  There could be any number of
            // sub-expressions inside also surrounded by parens.
            begin: E,
            returnBegin: !0,
            end: "\\s*=>",
            contains: [
              {
                className: "params",
                variants: [
                  {
                    begin: e.UNDERSCORE_IDENT_RE,
                    relevance: 0
                  },
                  {
                    className: null,
                    begin: /\(\s*\)/,
                    skip: !0
                  },
                  {
                    begin: /(\s*)\(/,
                    end: /\)/,
                    excludeBegin: !0,
                    excludeEnd: !0,
                    keywords: o,
                    contains: R
                  }
                ]
              }
            ]
          },
          {
            // could be a comma delimited list of params to a function call
            begin: /,/,
            relevance: 0
          },
          {
            match: /\s+/,
            relevance: 0
          },
          {
            // JSX
            variants: [
              { begin: a.begin, end: a.end },
              { match: i },
              {
                begin: s.begin,
                // we carefully check the opening tag to see if it truly
                // is a tag and not a false positive
                "on:begin": s.isTrulyOpeningTag,
                end: s.end
              }
            ],
            subLanguage: "xml",
            contains: [
              {
                begin: s.begin,
                end: s.end,
                skip: !0,
                contains: ["self"]
              }
            ]
          }
        ]
      },
      O,
      {
        // prevent this from getting swallowed up by function
        // since they appear "function like"
        beginKeywords: "while if switch catch for"
      },
      {
        // we have to count the parens to make sure we actually have the correct
        // bounding ( ).  There could be any number of sub-expressions inside
        // also surrounded by parens.
        begin: "\\b(?!function)" + e.UNDERSCORE_IDENT_RE + "\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
        // end parens
        returnBegin: !0,
        label: "func.def",
        contains: [
          k,
          e.inherit(e.TITLE_MODE, { begin: r, className: "title.function" })
        ]
      },
      // catch ... so it won't trigger the property rule below
      {
        match: /\.\.\./,
        relevance: 0
      },
      H,
      // hack: prevents detection of keywords in some circumstances
      // .keyword()
      // $keyword = x
      {
        match: "\\$" + r,
        relevance: 0
      },
      {
        match: [/\bconstructor(?=\s*\()/],
        className: { 1: "title.function" },
        contains: [k]
      },
      J,
      j,
      F,
      ie,
      {
        match: /\$[(.]/
        // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
      }
    ]
  };
}
function dl(e) {
  const t = e.regex, n = ul(e), r = bt, a = [
    "any",
    "void",
    "number",
    "boolean",
    "string",
    "object",
    "never",
    "symbol",
    "bigint",
    "unknown"
  ], i = {
    begin: [
      /namespace/,
      /\s+/,
      e.IDENT_RE
    ],
    beginScope: {
      1: "keyword",
      3: "title.class"
    }
  }, s = {
    beginKeywords: "interface",
    end: /\{/,
    excludeEnd: !0,
    keywords: {
      keyword: "interface extends",
      built_in: a
    },
    contains: [n.exports.CLASS_REFERENCE]
  }, o = {
    className: "meta",
    relevance: 10,
    begin: /^\s*['"]use strict['"]/
  }, l = [
    "type",
    // "namespace",
    "interface",
    "public",
    "private",
    "protected",
    "implements",
    "declare",
    "abstract",
    "readonly",
    "enum",
    "override",
    "satisfies"
  ], c = {
    $pattern: bt,
    keyword: Pr.concat(l),
    literal: jr,
    built_in: Kr.concat(a),
    "variable.language": Hr
  }, d = {
    className: "meta",
    begin: "@" + r
  }, p = (w, x, v) => {
    const b = w.contains.findIndex((_) => _.label === x);
    if (b === -1)
      throw new Error("can not find mode to replace");
    w.contains.splice(b, 1, v);
  };
  Object.assign(n.keywords, c), n.exports.PARAMS_CONTAINS.push(d);
  const f = n.contains.find((w) => w.scope === "attr"), g = Object.assign(
    {},
    f,
    { match: t.concat(r, t.lookahead(/\s*\?:/)) }
  );
  n.exports.PARAMS_CONTAINS.push([
    n.exports.CLASS_REFERENCE,
    // class reference for highlighting the params types
    f,
    // highlight the params key
    g
    // Added for optional property assignment highlighting
  ]), n.contains = n.contains.concat([
    d,
    i,
    s,
    g
    // Added for optional property assignment highlighting
  ]), p(n, "shebang", e.SHEBANG()), p(n, "use_strict", o);
  const h = n.contains.find((w) => w.label === "func.def");
  return h.relevance = 0, Object.assign(n, {
    name: "TypeScript",
    aliases: [
      "ts",
      "tsx",
      "mts",
      "cts"
    ]
  }), n;
}
function hl(e) {
  const t = {
    className: "attr",
    begin: /"(\\.|[^\\"\r\n])*"(?=\s*:)/,
    relevance: 1.01
  }, n = {
    match: /[{}[\],:]/,
    className: "punctuation",
    relevance: 0
  }, r = [
    "true",
    "false",
    "null"
  ], a = {
    scope: "literal",
    beginKeywords: r.join(" ")
  };
  return {
    name: "JSON",
    aliases: ["jsonc"],
    keywords: {
      literal: r
    },
    contains: [
      t,
      n,
      e.QUOTE_STRING_MODE,
      a,
      e.C_NUMBER_MODE,
      e.C_LINE_COMMENT_MODE,
      e.C_BLOCK_COMMENT_MODE
    ],
    illegal: "\\S"
  };
}
const pl = (e) => ({
  IMPORTANT: {
    scope: "meta",
    begin: "!important"
  },
  BLOCK_COMMENT: e.C_BLOCK_COMMENT_MODE,
  HEXCOLOR: {
    scope: "number",
    begin: /#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/
  },
  FUNCTION_DISPATCH: {
    className: "built_in",
    begin: /[\w-]+(?=\()/
  },
  ATTRIBUTE_SELECTOR_MODE: {
    scope: "selector-attr",
    begin: /\[/,
    end: /\]/,
    illegal: "$",
    contains: [
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE
    ]
  },
  CSS_NUMBER_MODE: {
    scope: "number",
    begin: e.NUMBER_RE + "(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
    relevance: 0
  },
  CSS_VARIABLE: {
    className: "attr",
    begin: /--[A-Za-z_][A-Za-z0-9_-]*/
  }
}), fl = [
  "a",
  "abbr",
  "address",
  "article",
  "aside",
  "audio",
  "b",
  "blockquote",
  "body",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "dd",
  "del",
  "details",
  "dfn",
  "div",
  "dl",
  "dt",
  "em",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hgroup",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "main",
  "mark",
  "menu",
  "nav",
  "object",
  "ol",
  "optgroup",
  "option",
  "p",
  "picture",
  "q",
  "quote",
  "samp",
  "section",
  "select",
  "source",
  "span",
  "strong",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "tr",
  "ul",
  "var",
  "video"
], gl = [
  "defs",
  "g",
  "marker",
  "mask",
  "pattern",
  "svg",
  "switch",
  "symbol",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feFlood",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMorphology",
  "feOffset",
  "feSpecularLighting",
  "feTile",
  "feTurbulence",
  "linearGradient",
  "radialGradient",
  "stop",
  "circle",
  "ellipse",
  "image",
  "line",
  "path",
  "polygon",
  "polyline",
  "rect",
  "text",
  "use",
  "textPath",
  "tspan",
  "foreignObject",
  "clipPath"
], ml = [
  ...fl,
  ...gl
], bl = [
  "any-hover",
  "any-pointer",
  "aspect-ratio",
  "color",
  "color-gamut",
  "color-index",
  "device-aspect-ratio",
  "device-height",
  "device-width",
  "display-mode",
  "forced-colors",
  "grid",
  "height",
  "hover",
  "inverted-colors",
  "monochrome",
  "orientation",
  "overflow-block",
  "overflow-inline",
  "pointer",
  "prefers-color-scheme",
  "prefers-contrast",
  "prefers-reduced-motion",
  "prefers-reduced-transparency",
  "resolution",
  "scan",
  "scripting",
  "update",
  "width",
  // TODO: find a better solution?
  "min-width",
  "max-width",
  "min-height",
  "max-height"
].sort().reverse(), vl = [
  "active",
  "any-link",
  "blank",
  "checked",
  "current",
  "default",
  "defined",
  "dir",
  // dir()
  "disabled",
  "drop",
  "empty",
  "enabled",
  "first",
  "first-child",
  "first-of-type",
  "fullscreen",
  "future",
  "focus",
  "focus-visible",
  "focus-within",
  "has",
  // has()
  "host",
  // host or host()
  "host-context",
  // host-context()
  "hover",
  "indeterminate",
  "in-range",
  "invalid",
  "is",
  // is()
  "lang",
  // lang()
  "last-child",
  "last-of-type",
  "left",
  "link",
  "local-link",
  "not",
  // not()
  "nth-child",
  // nth-child()
  "nth-col",
  // nth-col()
  "nth-last-child",
  // nth-last-child()
  "nth-last-col",
  // nth-last-col()
  "nth-last-of-type",
  //nth-last-of-type()
  "nth-of-type",
  //nth-of-type()
  "only-child",
  "only-of-type",
  "optional",
  "out-of-range",
  "past",
  "placeholder-shown",
  "read-only",
  "read-write",
  "required",
  "right",
  "root",
  "scope",
  "target",
  "target-within",
  "user-invalid",
  "valid",
  "visited",
  "where"
  // where()
].sort().reverse(), kl = [
  "after",
  "backdrop",
  "before",
  "cue",
  "cue-region",
  "first-letter",
  "first-line",
  "grammar-error",
  "marker",
  "part",
  "placeholder",
  "selection",
  "slotted",
  "spelling-error"
].sort().reverse(), _l = [
  "accent-color",
  "align-content",
  "align-items",
  "align-self",
  "alignment-baseline",
  "all",
  "anchor-name",
  "animation",
  "animation-composition",
  "animation-delay",
  "animation-direction",
  "animation-duration",
  "animation-fill-mode",
  "animation-iteration-count",
  "animation-name",
  "animation-play-state",
  "animation-range",
  "animation-range-end",
  "animation-range-start",
  "animation-timeline",
  "animation-timing-function",
  "appearance",
  "aspect-ratio",
  "backdrop-filter",
  "backface-visibility",
  "background",
  "background-attachment",
  "background-blend-mode",
  "background-clip",
  "background-color",
  "background-image",
  "background-origin",
  "background-position",
  "background-position-x",
  "background-position-y",
  "background-repeat",
  "background-size",
  "baseline-shift",
  "block-size",
  "border",
  "border-block",
  "border-block-color",
  "border-block-end",
  "border-block-end-color",
  "border-block-end-style",
  "border-block-end-width",
  "border-block-start",
  "border-block-start-color",
  "border-block-start-style",
  "border-block-start-width",
  "border-block-style",
  "border-block-width",
  "border-bottom",
  "border-bottom-color",
  "border-bottom-left-radius",
  "border-bottom-right-radius",
  "border-bottom-style",
  "border-bottom-width",
  "border-collapse",
  "border-color",
  "border-end-end-radius",
  "border-end-start-radius",
  "border-image",
  "border-image-outset",
  "border-image-repeat",
  "border-image-slice",
  "border-image-source",
  "border-image-width",
  "border-inline",
  "border-inline-color",
  "border-inline-end",
  "border-inline-end-color",
  "border-inline-end-style",
  "border-inline-end-width",
  "border-inline-start",
  "border-inline-start-color",
  "border-inline-start-style",
  "border-inline-start-width",
  "border-inline-style",
  "border-inline-width",
  "border-left",
  "border-left-color",
  "border-left-style",
  "border-left-width",
  "border-radius",
  "border-right",
  "border-right-color",
  "border-right-style",
  "border-right-width",
  "border-spacing",
  "border-start-end-radius",
  "border-start-start-radius",
  "border-style",
  "border-top",
  "border-top-color",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-top-style",
  "border-top-width",
  "border-width",
  "bottom",
  "box-align",
  "box-decoration-break",
  "box-direction",
  "box-flex",
  "box-flex-group",
  "box-lines",
  "box-ordinal-group",
  "box-orient",
  "box-pack",
  "box-shadow",
  "box-sizing",
  "break-after",
  "break-before",
  "break-inside",
  "caption-side",
  "caret-color",
  "clear",
  "clip",
  "clip-path",
  "clip-rule",
  "color",
  "color-interpolation",
  "color-interpolation-filters",
  "color-profile",
  "color-rendering",
  "color-scheme",
  "column-count",
  "column-fill",
  "column-gap",
  "column-rule",
  "column-rule-color",
  "column-rule-style",
  "column-rule-width",
  "column-span",
  "column-width",
  "columns",
  "contain",
  "contain-intrinsic-block-size",
  "contain-intrinsic-height",
  "contain-intrinsic-inline-size",
  "contain-intrinsic-size",
  "contain-intrinsic-width",
  "container",
  "container-name",
  "container-type",
  "content",
  "content-visibility",
  "counter-increment",
  "counter-reset",
  "counter-set",
  "cue",
  "cue-after",
  "cue-before",
  "cursor",
  "cx",
  "cy",
  "direction",
  "display",
  "dominant-baseline",
  "empty-cells",
  "enable-background",
  "field-sizing",
  "fill",
  "fill-opacity",
  "fill-rule",
  "filter",
  "flex",
  "flex-basis",
  "flex-direction",
  "flex-flow",
  "flex-grow",
  "flex-shrink",
  "flex-wrap",
  "float",
  "flood-color",
  "flood-opacity",
  "flow",
  "font",
  "font-display",
  "font-family",
  "font-feature-settings",
  "font-kerning",
  "font-language-override",
  "font-optical-sizing",
  "font-palette",
  "font-size",
  "font-size-adjust",
  "font-smooth",
  "font-smoothing",
  "font-stretch",
  "font-style",
  "font-synthesis",
  "font-synthesis-position",
  "font-synthesis-small-caps",
  "font-synthesis-style",
  "font-synthesis-weight",
  "font-variant",
  "font-variant-alternates",
  "font-variant-caps",
  "font-variant-east-asian",
  "font-variant-emoji",
  "font-variant-ligatures",
  "font-variant-numeric",
  "font-variant-position",
  "font-variation-settings",
  "font-weight",
  "forced-color-adjust",
  "gap",
  "glyph-orientation-horizontal",
  "glyph-orientation-vertical",
  "grid",
  "grid-area",
  "grid-auto-columns",
  "grid-auto-flow",
  "grid-auto-rows",
  "grid-column",
  "grid-column-end",
  "grid-column-start",
  "grid-gap",
  "grid-row",
  "grid-row-end",
  "grid-row-start",
  "grid-template",
  "grid-template-areas",
  "grid-template-columns",
  "grid-template-rows",
  "hanging-punctuation",
  "height",
  "hyphenate-character",
  "hyphenate-limit-chars",
  "hyphens",
  "icon",
  "image-orientation",
  "image-rendering",
  "image-resolution",
  "ime-mode",
  "initial-letter",
  "initial-letter-align",
  "inline-size",
  "inset",
  "inset-area",
  "inset-block",
  "inset-block-end",
  "inset-block-start",
  "inset-inline",
  "inset-inline-end",
  "inset-inline-start",
  "isolation",
  "justify-content",
  "justify-items",
  "justify-self",
  "kerning",
  "left",
  "letter-spacing",
  "lighting-color",
  "line-break",
  "line-height",
  "line-height-step",
  "list-style",
  "list-style-image",
  "list-style-position",
  "list-style-type",
  "margin",
  "margin-block",
  "margin-block-end",
  "margin-block-start",
  "margin-bottom",
  "margin-inline",
  "margin-inline-end",
  "margin-inline-start",
  "margin-left",
  "margin-right",
  "margin-top",
  "margin-trim",
  "marker",
  "marker-end",
  "marker-mid",
  "marker-start",
  "marks",
  "mask",
  "mask-border",
  "mask-border-mode",
  "mask-border-outset",
  "mask-border-repeat",
  "mask-border-slice",
  "mask-border-source",
  "mask-border-width",
  "mask-clip",
  "mask-composite",
  "mask-image",
  "mask-mode",
  "mask-origin",
  "mask-position",
  "mask-repeat",
  "mask-size",
  "mask-type",
  "masonry-auto-flow",
  "math-depth",
  "math-shift",
  "math-style",
  "max-block-size",
  "max-height",
  "max-inline-size",
  "max-width",
  "min-block-size",
  "min-height",
  "min-inline-size",
  "min-width",
  "mix-blend-mode",
  "nav-down",
  "nav-index",
  "nav-left",
  "nav-right",
  "nav-up",
  "none",
  "normal",
  "object-fit",
  "object-position",
  "offset",
  "offset-anchor",
  "offset-distance",
  "offset-path",
  "offset-position",
  "offset-rotate",
  "opacity",
  "order",
  "orphans",
  "outline",
  "outline-color",
  "outline-offset",
  "outline-style",
  "outline-width",
  "overflow",
  "overflow-anchor",
  "overflow-block",
  "overflow-clip-margin",
  "overflow-inline",
  "overflow-wrap",
  "overflow-x",
  "overflow-y",
  "overlay",
  "overscroll-behavior",
  "overscroll-behavior-block",
  "overscroll-behavior-inline",
  "overscroll-behavior-x",
  "overscroll-behavior-y",
  "padding",
  "padding-block",
  "padding-block-end",
  "padding-block-start",
  "padding-bottom",
  "padding-inline",
  "padding-inline-end",
  "padding-inline-start",
  "padding-left",
  "padding-right",
  "padding-top",
  "page",
  "page-break-after",
  "page-break-before",
  "page-break-inside",
  "paint-order",
  "pause",
  "pause-after",
  "pause-before",
  "perspective",
  "perspective-origin",
  "place-content",
  "place-items",
  "place-self",
  "pointer-events",
  "position",
  "position-anchor",
  "position-visibility",
  "print-color-adjust",
  "quotes",
  "r",
  "resize",
  "rest",
  "rest-after",
  "rest-before",
  "right",
  "rotate",
  "row-gap",
  "ruby-align",
  "ruby-position",
  "scale",
  "scroll-behavior",
  "scroll-margin",
  "scroll-margin-block",
  "scroll-margin-block-end",
  "scroll-margin-block-start",
  "scroll-margin-bottom",
  "scroll-margin-inline",
  "scroll-margin-inline-end",
  "scroll-margin-inline-start",
  "scroll-margin-left",
  "scroll-margin-right",
  "scroll-margin-top",
  "scroll-padding",
  "scroll-padding-block",
  "scroll-padding-block-end",
  "scroll-padding-block-start",
  "scroll-padding-bottom",
  "scroll-padding-inline",
  "scroll-padding-inline-end",
  "scroll-padding-inline-start",
  "scroll-padding-left",
  "scroll-padding-right",
  "scroll-padding-top",
  "scroll-snap-align",
  "scroll-snap-stop",
  "scroll-snap-type",
  "scroll-timeline",
  "scroll-timeline-axis",
  "scroll-timeline-name",
  "scrollbar-color",
  "scrollbar-gutter",
  "scrollbar-width",
  "shape-image-threshold",
  "shape-margin",
  "shape-outside",
  "shape-rendering",
  "speak",
  "speak-as",
  "src",
  // @font-face
  "stop-color",
  "stop-opacity",
  "stroke",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "stroke-width",
  "tab-size",
  "table-layout",
  "text-align",
  "text-align-all",
  "text-align-last",
  "text-anchor",
  "text-combine-upright",
  "text-decoration",
  "text-decoration-color",
  "text-decoration-line",
  "text-decoration-skip",
  "text-decoration-skip-ink",
  "text-decoration-style",
  "text-decoration-thickness",
  "text-emphasis",
  "text-emphasis-color",
  "text-emphasis-position",
  "text-emphasis-style",
  "text-indent",
  "text-justify",
  "text-orientation",
  "text-overflow",
  "text-rendering",
  "text-shadow",
  "text-size-adjust",
  "text-transform",
  "text-underline-offset",
  "text-underline-position",
  "text-wrap",
  "text-wrap-mode",
  "text-wrap-style",
  "timeline-scope",
  "top",
  "touch-action",
  "transform",
  "transform-box",
  "transform-origin",
  "transform-style",
  "transition",
  "transition-behavior",
  "transition-delay",
  "transition-duration",
  "transition-property",
  "transition-timing-function",
  "translate",
  "unicode-bidi",
  "user-modify",
  "user-select",
  "vector-effect",
  "vertical-align",
  "view-timeline",
  "view-timeline-axis",
  "view-timeline-inset",
  "view-timeline-name",
  "view-transition-name",
  "visibility",
  "voice-balance",
  "voice-duration",
  "voice-family",
  "voice-pitch",
  "voice-range",
  "voice-rate",
  "voice-stress",
  "voice-volume",
  "white-space",
  "white-space-collapse",
  "widows",
  "width",
  "will-change",
  "word-break",
  "word-spacing",
  "word-wrap",
  "writing-mode",
  "x",
  "y",
  "z-index",
  "zoom"
].sort().reverse();
function xl(e) {
  const t = e.regex, n = pl(e), r = { begin: /-(webkit|moz|ms|o)-(?=[a-z])/ }, a = "and or not only", i = /@-?\w[\w]*(-\w+)*/, s = "[a-zA-Z-][a-zA-Z0-9_-]*", o = [
    e.APOS_STRING_MODE,
    e.QUOTE_STRING_MODE
  ];
  return {
    name: "CSS",
    case_insensitive: !0,
    illegal: /[=|'\$]/,
    keywords: { keyframePosition: "from to" },
    classNameAliases: {
      // for visual continuity with `tag {}` and because we
      // don't have a great class for this?
      keyframePosition: "selector-tag"
    },
    contains: [
      n.BLOCK_COMMENT,
      r,
      // to recognize keyframe 40% etc which are outside the scope of our
      // attribute value mode
      n.CSS_NUMBER_MODE,
      {
        className: "selector-id",
        begin: /#[A-Za-z0-9_-]+/,
        relevance: 0
      },
      {
        className: "selector-class",
        begin: "\\." + s,
        relevance: 0
      },
      n.ATTRIBUTE_SELECTOR_MODE,
      {
        className: "selector-pseudo",
        variants: [
          { begin: ":(" + vl.join("|") + ")" },
          { begin: ":(:)?(" + kl.join("|") + ")" }
        ]
      },
      // we may actually need this (12/2020)
      // { // pseudo-selector params
      //   begin: /\(/,
      //   end: /\)/,
      //   contains: [ hljs.CSS_NUMBER_MODE ]
      // },
      n.CSS_VARIABLE,
      {
        className: "attribute",
        begin: "\\b(" + _l.join("|") + ")\\b"
      },
      // attribute values
      {
        begin: /:/,
        end: /[;}{]/,
        contains: [
          n.BLOCK_COMMENT,
          n.HEXCOLOR,
          n.IMPORTANT,
          n.CSS_NUMBER_MODE,
          ...o,
          // needed to highlight these as strings and to avoid issues with
          // illegal characters that might be inside urls that would tigger the
          // languages illegal stack
          {
            begin: /(url|data-uri)\(/,
            end: /\)/,
            relevance: 0,
            // from keywords
            keywords: { built_in: "url data-uri" },
            contains: [
              ...o,
              {
                className: "string",
                // any character other than `)` as in `url()` will be the start
                // of a string, which ends with `)` (from the parent mode)
                begin: /[^)]/,
                endsWithParent: !0,
                excludeEnd: !0
              }
            ]
          },
          n.FUNCTION_DISPATCH
        ]
      },
      {
        begin: t.lookahead(/@/),
        end: "[{;]",
        relevance: 0,
        illegal: /:/,
        // break on Less variables @var: ...
        contains: [
          {
            className: "keyword",
            begin: i
          },
          {
            begin: /\s/,
            endsWithParent: !0,
            excludeEnd: !0,
            relevance: 0,
            keywords: {
              $pattern: /[a-z-]+/,
              keyword: a,
              attribute: bl.join(" ")
            },
            contains: [
              {
                begin: /[a-z-]+(?=:)/,
                className: "attribute"
              },
              ...o,
              n.CSS_NUMBER_MODE
            ]
          }
        ]
      },
      {
        className: "selector-tag",
        begin: "\\b(" + ml.join("|") + ")\\b"
      }
    ]
  };
}
function wl(e) {
  const t = e.regex, n = t.concat(/[\p{L}_]/u, t.optional(/[\p{L}0-9_.-]*:/u), /[\p{L}0-9_.-]*/u), r = /[\p{L}0-9._:-]+/u, a = {
    className: "symbol",
    begin: /&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/
  }, i = {
    begin: /\s/,
    contains: [
      {
        className: "keyword",
        begin: /#?[a-z_][a-z1-9_-]+/,
        illegal: /\n/
      }
    ]
  }, s = e.inherit(i, {
    begin: /\(/,
    end: /\)/
  }), o = e.inherit(e.APOS_STRING_MODE, { className: "string" }), l = e.inherit(e.QUOTE_STRING_MODE, { className: "string" }), c = {
    endsWithParent: !0,
    illegal: /</,
    relevance: 0,
    contains: [
      {
        className: "attr",
        begin: r,
        relevance: 0
      },
      {
        begin: /=\s*/,
        relevance: 0,
        contains: [
          {
            className: "string",
            endsParent: !0,
            variants: [
              {
                begin: /"/,
                end: /"/,
                contains: [a]
              },
              {
                begin: /'/,
                end: /'/,
                contains: [a]
              },
              { begin: /[^\s"'=<>`]+/ }
            ]
          }
        ]
      }
    ]
  };
  return {
    name: "HTML, XML",
    aliases: [
      "html",
      "xhtml",
      "rss",
      "atom",
      "xjb",
      "xsd",
      "xsl",
      "plist",
      "wsf",
      "svg"
    ],
    case_insensitive: !0,
    unicodeRegex: !0,
    contains: [
      {
        className: "meta",
        begin: /<![a-z]/,
        end: />/,
        relevance: 10,
        contains: [
          i,
          l,
          o,
          s,
          {
            begin: /\[/,
            end: /\]/,
            contains: [
              {
                className: "meta",
                begin: /<![a-z]/,
                end: />/,
                contains: [
                  i,
                  s,
                  l,
                  o
                ]
              }
            ]
          }
        ]
      },
      e.COMMENT(
        /<!--/,
        /-->/,
        { relevance: 10 }
      ),
      {
        begin: /<!\[CDATA\[/,
        end: /\]\]>/,
        relevance: 10
      },
      a,
      // xml processing instructions
      {
        className: "meta",
        end: /\?>/,
        variants: [
          {
            begin: /<\?xml/,
            relevance: 10,
            contains: [
              l
            ]
          },
          {
            begin: /<\?[a-z][a-z0-9]+/
          }
        ]
      },
      {
        className: "tag",
        /*
        The lookahead pattern (?=...) ensures that 'begin' only matches
        '<style' as a single word, followed by a whitespace or an
        ending bracket.
        */
        begin: /<style(?=\s|>)/,
        end: />/,
        keywords: { name: "style" },
        contains: [c],
        starts: {
          end: /<\/style>/,
          returnEnd: !0,
          subLanguage: [
            "css",
            "xml"
          ]
        }
      },
      {
        className: "tag",
        // See the comment in the <style tag about the lookahead pattern
        begin: /<script(?=\s|>)/,
        end: />/,
        keywords: { name: "script" },
        contains: [c],
        starts: {
          end: /<\/script>/,
          returnEnd: !0,
          subLanguage: [
            "javascript",
            "handlebars",
            "xml"
          ]
        }
      },
      // we need this for now for jSX
      {
        className: "tag",
        begin: /<>|<\/>/
      },
      // open tag
      {
        className: "tag",
        begin: t.concat(
          /</,
          t.lookahead(t.concat(
            n,
            // <tag/>
            // <tag>
            // <tag ...
            t.either(/\/>/, />/, /\s/)
          ))
        ),
        end: /\/?>/,
        contains: [
          {
            className: "name",
            begin: n,
            relevance: 0,
            starts: c
          }
        ]
      },
      // close tag
      {
        className: "tag",
        begin: t.concat(
          /<\//,
          t.lookahead(t.concat(
            n,
            />/
          ))
        ),
        contains: [
          {
            className: "name",
            begin: n,
            relevance: 0
          },
          {
            begin: />/,
            relevance: 0,
            endsParent: !0
          }
        ]
      }
    ]
  };
}
function zl(e) {
  const t = e.regex, n = new RegExp("[\\p{XID_Start}_]\\p{XID_Continue}*", "u"), r = [
    "and",
    "as",
    "assert",
    "async",
    "await",
    "break",
    "case",
    "class",
    "continue",
    "def",
    "del",
    "elif",
    "else",
    "except",
    "finally",
    "for",
    "from",
    "global",
    "if",
    "import",
    "in",
    "is",
    "lambda",
    "match",
    "nonlocal|10",
    "not",
    "or",
    "pass",
    "raise",
    "return",
    "try",
    "while",
    "with",
    "yield"
  ], o = {
    $pattern: /[A-Za-z]\w+|__\w+__/,
    keyword: r,
    built_in: [
      "__import__",
      "abs",
      "all",
      "any",
      "ascii",
      "bin",
      "bool",
      "breakpoint",
      "bytearray",
      "bytes",
      "callable",
      "chr",
      "classmethod",
      "compile",
      "complex",
      "delattr",
      "dict",
      "dir",
      "divmod",
      "enumerate",
      "eval",
      "exec",
      "filter",
      "float",
      "format",
      "frozenset",
      "getattr",
      "globals",
      "hasattr",
      "hash",
      "help",
      "hex",
      "id",
      "input",
      "int",
      "isinstance",
      "issubclass",
      "iter",
      "len",
      "list",
      "locals",
      "map",
      "max",
      "memoryview",
      "min",
      "next",
      "object",
      "oct",
      "open",
      "ord",
      "pow",
      "print",
      "property",
      "range",
      "repr",
      "reversed",
      "round",
      "set",
      "setattr",
      "slice",
      "sorted",
      "staticmethod",
      "str",
      "sum",
      "super",
      "tuple",
      "type",
      "vars",
      "zip"
    ],
    literal: [
      "__debug__",
      "Ellipsis",
      "False",
      "None",
      "NotImplemented",
      "True"
    ],
    type: [
      "Any",
      "Callable",
      "Coroutine",
      "Dict",
      "List",
      "Literal",
      "Generic",
      "Optional",
      "Sequence",
      "Set",
      "Tuple",
      "Type",
      "Union"
    ]
  }, l = {
    className: "meta",
    begin: /^(>>>|\.\.\.) /
  }, c = {
    className: "subst",
    begin: /\{/,
    end: /\}/,
    keywords: o,
    illegal: /#/
  }, d = {
    begin: /\{\{/,
    relevance: 0
  }, p = {
    className: "string",
    contains: [e.BACKSLASH_ESCAPE],
    variants: [
      {
        begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/,
        end: /'''/,
        contains: [
          e.BACKSLASH_ESCAPE,
          l
        ],
        relevance: 10
      },
      {
        begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/,
        end: /"""/,
        contains: [
          e.BACKSLASH_ESCAPE,
          l
        ],
        relevance: 10
      },
      {
        begin: /([fF][rR]|[rR][fF]|[fF])'''/,
        end: /'''/,
        contains: [
          e.BACKSLASH_ESCAPE,
          l,
          d,
          c
        ]
      },
      {
        begin: /([fF][rR]|[rR][fF]|[fF])"""/,
        end: /"""/,
        contains: [
          e.BACKSLASH_ESCAPE,
          l,
          d,
          c
        ]
      },
      {
        begin: /([uU]|[rR])'/,
        end: /'/,
        relevance: 10
      },
      {
        begin: /([uU]|[rR])"/,
        end: /"/,
        relevance: 10
      },
      {
        begin: /([bB]|[bB][rR]|[rR][bB])'/,
        end: /'/
      },
      {
        begin: /([bB]|[bB][rR]|[rR][bB])"/,
        end: /"/
      },
      {
        begin: /([fF][rR]|[rR][fF]|[fF])'/,
        end: /'/,
        contains: [
          e.BACKSLASH_ESCAPE,
          d,
          c
        ]
      },
      {
        begin: /([fF][rR]|[rR][fF]|[fF])"/,
        end: /"/,
        contains: [
          e.BACKSLASH_ESCAPE,
          d,
          c
        ]
      },
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE
    ]
  }, f = "[0-9](_?[0-9])*", g = `(\\b(${f}))?\\.(${f})|\\b(${f})\\.`, h = `\\b|${r.join("|")}`, w = {
    className: "number",
    relevance: 0,
    variants: [
      // exponentfloat, pointfloat
      // https://docs.python.org/3.9/reference/lexical_analysis.html#floating-point-literals
      // optionally imaginary
      // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
      // Note: no leading \b because floats can start with a decimal point
      // and we don't want to mishandle e.g. `fn(.5)`,
      // no trailing \b for pointfloat because it can end with a decimal point
      // and we don't want to mishandle e.g. `0..hex()`; this should be safe
      // because both MUST contain a decimal point and so cannot be confused with
      // the interior part of an identifier
      {
        begin: `(\\b(${f})|(${g}))[eE][+-]?(${f})[jJ]?(?=${h})`
      },
      {
        begin: `(${g})[jJ]?`
      },
      // decinteger, bininteger, octinteger, hexinteger
      // https://docs.python.org/3.9/reference/lexical_analysis.html#integer-literals
      // optionally "long" in Python 2
      // https://docs.python.org/2.7/reference/lexical_analysis.html#integer-and-long-integer-literals
      // decinteger is optionally imaginary
      // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
      {
        begin: `\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?(?=${h})`
      },
      {
        begin: `\\b0[bB](_?[01])+[lL]?(?=${h})`
      },
      {
        begin: `\\b0[oO](_?[0-7])+[lL]?(?=${h})`
      },
      {
        begin: `\\b0[xX](_?[0-9a-fA-F])+[lL]?(?=${h})`
      },
      // imagnumber (digitpart-based)
      // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
      {
        begin: `\\b(${f})[jJ](?=${h})`
      }
    ]
  }, x = {
    className: "comment",
    begin: t.lookahead(/# type:/),
    end: /$/,
    keywords: o,
    contains: [
      {
        // prevent keywords from coloring `type`
        begin: /# type:/
      },
      // comment within a datatype comment includes no keywords
      {
        begin: /#/,
        end: /\b\B/,
        endsWithParent: !0
      }
    ]
  }, v = {
    className: "params",
    variants: [
      // Exclude params in functions without params
      {
        className: "",
        begin: /\(\s*\)/,
        skip: !0
      },
      {
        begin: /\(/,
        end: /\)/,
        excludeBegin: !0,
        excludeEnd: !0,
        keywords: o,
        contains: [
          "self",
          l,
          w,
          p,
          e.HASH_COMMENT_MODE
        ]
      }
    ]
  };
  return c.contains = [
    p,
    w,
    l
  ], {
    name: "Python",
    aliases: [
      "py",
      "gyp",
      "ipython"
    ],
    unicodeRegex: !0,
    keywords: o,
    illegal: /(<\/|\?)|=>/,
    contains: [
      l,
      w,
      {
        // very common convention
        scope: "variable.language",
        match: /\bself\b/
      },
      {
        // eat "if" prior to string so that it won't accidentally be
        // labeled as an f-string
        beginKeywords: "if",
        relevance: 0
      },
      { match: /\bor\b/, scope: "keyword" },
      p,
      x,
      e.HASH_COMMENT_MODE,
      {
        match: [
          /\bdef/,
          /\s+/,
          n
        ],
        scope: {
          1: "keyword",
          3: "title.function"
        },
        contains: [v]
      },
      {
        variants: [
          {
            match: [
              /\bclass/,
              /\s+/,
              n,
              /\s*/,
              /\(\s*/,
              n,
              /\s*\)/
            ]
          },
          {
            match: [
              /\bclass/,
              /\s+/,
              n
            ]
          }
        ],
        scope: {
          1: "keyword",
          3: "title.class",
          6: "title.class.inherited"
        }
      },
      {
        className: "meta",
        begin: /^[\t ]*@/,
        end: /(?=#)|$/,
        contains: [
          w,
          v,
          p
        ]
      }
    ]
  };
}
function yl(e) {
  const t = e.regex, n = {}, r = {
    begin: /\$\{/,
    end: /\}/,
    contains: [
      "self",
      {
        begin: /:-/,
        contains: [n]
      }
      // default values
    ]
  };
  Object.assign(n, {
    className: "variable",
    variants: [
      { begin: t.concat(
        /\$[\w\d#@][\w\d_]*/,
        // negative look-ahead tries to avoid matching patterns that are not
        // Perl at all like $ident$, @ident@, etc.
        "(?![\\w\\d])(?![$])"
      ) },
      r
    ]
  });
  const a = {
    className: "subst",
    begin: /\$\(/,
    end: /\)/,
    contains: [e.BACKSLASH_ESCAPE]
  }, i = e.inherit(
    e.COMMENT(),
    {
      match: [
        /(^|\s)/,
        /#.*$/
      ],
      scope: {
        2: "comment"
      }
    }
  ), s = {
    begin: /<<-?\s*(?=\w+)/,
    starts: { contains: [
      e.END_SAME_AS_BEGIN({
        begin: /(\w+)/,
        end: /(\w+)/,
        className: "string"
      })
    ] }
  }, o = {
    className: "string",
    begin: /"/,
    end: /"/,
    contains: [
      e.BACKSLASH_ESCAPE,
      n,
      a
    ]
  };
  a.contains.push(o);
  const l = {
    match: /\\"/
  }, c = {
    className: "string",
    begin: /'/,
    end: /'/
  }, d = {
    match: /\\'/
  }, p = {
    begin: /\$?\(\(/,
    end: /\)\)/,
    contains: [
      {
        begin: /\d+#[0-9a-f]+/,
        className: "number"
      },
      e.NUMBER_MODE,
      n
    ]
  }, f = [
    "fish",
    "bash",
    "zsh",
    "sh",
    "csh",
    "ksh",
    "tcsh",
    "dash",
    "scsh"
  ], g = e.SHEBANG({
    binary: `(${f.join("|")})`,
    relevance: 10
  }), h = {
    className: "function",
    begin: /\w[\w\d_]*\s*\(\s*\)\s*\{/,
    returnBegin: !0,
    contains: [e.inherit(e.TITLE_MODE, { begin: /\w[\w\d_]*/ })],
    relevance: 0
  }, w = [
    "if",
    "then",
    "else",
    "elif",
    "fi",
    "time",
    "for",
    "while",
    "until",
    "in",
    "do",
    "done",
    "case",
    "esac",
    "coproc",
    "function",
    "select"
  ], x = [
    "true",
    "false"
  ], v = { match: /(\/[a-z._-]+)+/ }, b = [
    "break",
    "cd",
    "continue",
    "eval",
    "exec",
    "exit",
    "export",
    "getopts",
    "hash",
    "pwd",
    "readonly",
    "return",
    "shift",
    "test",
    "times",
    "trap",
    "umask",
    "unset"
  ], _ = [
    "alias",
    "bind",
    "builtin",
    "caller",
    "command",
    "declare",
    "echo",
    "enable",
    "help",
    "let",
    "local",
    "logout",
    "mapfile",
    "printf",
    "read",
    "readarray",
    "source",
    "sudo",
    "type",
    "typeset",
    "ulimit",
    "unalias"
  ], y = [
    "autoload",
    "bg",
    "bindkey",
    "bye",
    "cap",
    "chdir",
    "clone",
    "comparguments",
    "compcall",
    "compctl",
    "compdescribe",
    "compfiles",
    "compgroups",
    "compquote",
    "comptags",
    "comptry",
    "compvalues",
    "dirs",
    "disable",
    "disown",
    "echotc",
    "echoti",
    "emulate",
    "fc",
    "fg",
    "float",
    "functions",
    "getcap",
    "getln",
    "history",
    "integer",
    "jobs",
    "kill",
    "limit",
    "log",
    "noglob",
    "popd",
    "print",
    "pushd",
    "pushln",
    "rehash",
    "sched",
    "setcap",
    "setopt",
    "stat",
    "suspend",
    "ttyctl",
    "unfunction",
    "unhash",
    "unlimit",
    "unsetopt",
    "vared",
    "wait",
    "whence",
    "where",
    "which",
    "zcompile",
    "zformat",
    "zftp",
    "zle",
    "zmodload",
    "zparseopts",
    "zprof",
    "zpty",
    "zregexparse",
    "zsocket",
    "zstyle",
    "ztcp"
  ], R = [
    "chcon",
    "chgrp",
    "chown",
    "chmod",
    "cp",
    "dd",
    "df",
    "dir",
    "dircolors",
    "ln",
    "ls",
    "mkdir",
    "mkfifo",
    "mknod",
    "mktemp",
    "mv",
    "realpath",
    "rm",
    "rmdir",
    "shred",
    "sync",
    "touch",
    "truncate",
    "vdir",
    "b2sum",
    "base32",
    "base64",
    "cat",
    "cksum",
    "comm",
    "csplit",
    "cut",
    "expand",
    "fmt",
    "fold",
    "head",
    "join",
    "md5sum",
    "nl",
    "numfmt",
    "od",
    "paste",
    "ptx",
    "pr",
    "sha1sum",
    "sha224sum",
    "sha256sum",
    "sha384sum",
    "sha512sum",
    "shuf",
    "sort",
    "split",
    "sum",
    "tac",
    "tail",
    "tr",
    "tsort",
    "unexpand",
    "uniq",
    "wc",
    "arch",
    "basename",
    "chroot",
    "date",
    "dirname",
    "du",
    "echo",
    "env",
    "expr",
    "factor",
    // "false", // keyword literal already
    "groups",
    "hostid",
    "id",
    "link",
    "logname",
    "nice",
    "nohup",
    "nproc",
    "pathchk",
    "pinky",
    "printenv",
    "printf",
    "pwd",
    "readlink",
    "runcon",
    "seq",
    "sleep",
    "stat",
    "stdbuf",
    "stty",
    "tee",
    "test",
    "timeout",
    // "true", // keyword literal already
    "tty",
    "uname",
    "unlink",
    "uptime",
    "users",
    "who",
    "whoami",
    "yes"
  ];
  return {
    name: "Bash",
    aliases: [
      "sh",
      "zsh"
    ],
    keywords: {
      $pattern: /\b[a-z][a-z0-9._-]+\b/,
      keyword: w,
      literal: x,
      built_in: [
        ...b,
        ..._,
        // Shell modifiers
        "set",
        "shopt",
        ...y,
        ...R
      ]
    },
    contains: [
      g,
      // to catch known shells and boost relevancy
      e.SHEBANG(),
      // to catch unknown shells but still highlight the shebang
      h,
      p,
      i,
      s,
      v,
      o,
      l,
      c,
      d,
      n
    ]
  };
}
function Rl(e) {
  const t = "true false yes no null", n = "[\\w#;/?:@&=+$,.~*'()[\\]]+", r = {
    className: "attr",
    variants: [
      // added brackets support and special char support
      { begin: /[\w*@][\w*@ :()\./-]*:(?=[ \t]|$)/ },
      {
        // double quoted keys - with brackets and special char support
        begin: /"[\w*@][\w*@ :()\./-]*":(?=[ \t]|$)/
      },
      {
        // single quoted keys - with brackets and special char support
        begin: /'[\w*@][\w*@ :()\./-]*':(?=[ \t]|$)/
      }
    ]
  }, a = {
    className: "template-variable",
    variants: [
      {
        // jinja templates Ansible
        begin: /\{\{/,
        end: /\}\}/
      },
      {
        // Ruby i18n
        begin: /%\{/,
        end: /\}/
      }
    ]
  }, i = {
    className: "string",
    relevance: 0,
    begin: /'/,
    end: /'/,
    contains: [
      {
        match: /''/,
        scope: "char.escape",
        relevance: 0
      }
    ]
  }, s = {
    className: "string",
    relevance: 0,
    variants: [
      {
        begin: /"/,
        end: /"/
      },
      { begin: /\S+/ }
    ],
    contains: [
      e.BACKSLASH_ESCAPE,
      a
    ]
  }, o = e.inherit(s, { variants: [
    {
      begin: /'/,
      end: /'/,
      contains: [
        {
          begin: /''/,
          relevance: 0
        }
      ]
    },
    {
      begin: /"/,
      end: /"/
    },
    { begin: /[^\s,{}[\]]+/ }
  ] }), f = {
    className: "number",
    begin: "\\b" + "[0-9]{4}(-[0-9][0-9]){0,2}" + "([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?" + "(\\.[0-9]*)?" + "([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?" + "\\b"
  }, g = {
    end: ",",
    endsWithParent: !0,
    excludeEnd: !0,
    keywords: t,
    relevance: 0
  }, h = {
    begin: /\{/,
    end: /\}/,
    contains: [g],
    illegal: "\\n",
    relevance: 0
  }, w = {
    begin: "\\[",
    end: "\\]",
    contains: [g],
    illegal: "\\n",
    relevance: 0
  }, x = [
    r,
    {
      className: "meta",
      begin: "^---\\s*$",
      relevance: 10
    },
    {
      // multi line string
      // Blocks start with a | or > followed by a newline
      //
      // Indentation of subsequent lines must be the same to
      // be considered part of the block
      className: "string",
      begin: "[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*"
    },
    {
      // Ruby/Rails erb
      begin: "<%[%=-]?",
      end: "[%-]?%>",
      subLanguage: "ruby",
      excludeBegin: !0,
      excludeEnd: !0,
      relevance: 0
    },
    {
      // named tags
      className: "type",
      begin: "!\\w+!" + n
    },
    // https://yaml.org/spec/1.2/spec.html#id2784064
    {
      // verbatim tags
      className: "type",
      begin: "!<" + n + ">"
    },
    {
      // primary tags
      className: "type",
      begin: "!" + n
    },
    {
      // secondary tags
      className: "type",
      begin: "!!" + n
    },
    {
      // fragment id &ref
      className: "meta",
      begin: "&" + e.UNDERSCORE_IDENT_RE + "$"
    },
    {
      // fragment reference *ref
      className: "meta",
      begin: "\\*" + e.UNDERSCORE_IDENT_RE + "$"
    },
    {
      // array listing
      className: "bullet",
      // TODO: remove |$ hack when we have proper look-ahead support
      begin: "-(?=[ ]|$)",
      relevance: 0
    },
    e.HASH_COMMENT_MODE,
    {
      beginKeywords: t,
      keywords: { literal: t }
    },
    f,
    // numbers are any valid C-style number that
    // sit isolated from other words
    {
      className: "number",
      begin: e.C_NUMBER_RE + "\\b",
      relevance: 0
    },
    h,
    w,
    i,
    s
  ], v = [...x];
  return v.pop(), v.push(o), g.contains = v, {
    name: "YAML",
    case_insensitive: !0,
    aliases: ["yml"],
    contains: x
  };
}
function El(e) {
  const t = e.regex, n = e.COMMENT("--", "$"), r = {
    scope: "string",
    variants: [
      {
        begin: /'/,
        end: /'/,
        contains: [{ match: /''/ }]
      }
    ]
  }, a = {
    begin: /"/,
    end: /"/,
    contains: [{ match: /""/ }]
  }, i = [
    "true",
    "false",
    // Not sure it's correct to call NULL literal, and clauses like IS [NOT] NULL look strange that way.
    // "null",
    "unknown"
  ], s = [
    "double precision",
    "large object",
    "with timezone",
    "without timezone"
  ], o = [
    "bigint",
    "binary",
    "blob",
    "boolean",
    "char",
    "character",
    "clob",
    "date",
    "dec",
    "decfloat",
    "decimal",
    "float",
    "int",
    "integer",
    "interval",
    "nchar",
    "nclob",
    "national",
    "numeric",
    "real",
    "row",
    "smallint",
    "time",
    "timestamp",
    "varchar",
    "varying",
    // modifier (character varying)
    "varbinary"
  ], l = [
    "add",
    "asc",
    "collation",
    "desc",
    "final",
    "first",
    "last",
    "view"
  ], c = [
    "abs",
    "acos",
    "all",
    "allocate",
    "alter",
    "and",
    "any",
    "are",
    "array",
    "array_agg",
    "array_max_cardinality",
    "as",
    "asensitive",
    "asin",
    "asymmetric",
    "at",
    "atan",
    "atomic",
    "authorization",
    "avg",
    "begin",
    "begin_frame",
    "begin_partition",
    "between",
    "bigint",
    "binary",
    "blob",
    "boolean",
    "both",
    "by",
    "call",
    "called",
    "cardinality",
    "cascaded",
    "case",
    "cast",
    "ceil",
    "ceiling",
    "char",
    "char_length",
    "character",
    "character_length",
    "check",
    "classifier",
    "clob",
    "close",
    "coalesce",
    "collate",
    "collect",
    "column",
    "commit",
    "condition",
    "connect",
    "constraint",
    "contains",
    "convert",
    "copy",
    "corr",
    "corresponding",
    "cos",
    "cosh",
    "count",
    "covar_pop",
    "covar_samp",
    "create",
    "cross",
    "cube",
    "cume_dist",
    "current",
    "current_catalog",
    "current_date",
    "current_default_transform_group",
    "current_path",
    "current_role",
    "current_row",
    "current_schema",
    "current_time",
    "current_timestamp",
    "current_path",
    "current_role",
    "current_transform_group_for_type",
    "current_user",
    "cursor",
    "cycle",
    "date",
    "day",
    "deallocate",
    "dec",
    "decimal",
    "decfloat",
    "declare",
    "default",
    "define",
    "delete",
    "dense_rank",
    "deref",
    "describe",
    "deterministic",
    "disconnect",
    "distinct",
    "double",
    "drop",
    "dynamic",
    "each",
    "element",
    "else",
    "empty",
    "end",
    "end_frame",
    "end_partition",
    "end-exec",
    "equals",
    "escape",
    "every",
    "except",
    "exec",
    "execute",
    "exists",
    "exp",
    "external",
    "extract",
    "false",
    "fetch",
    "filter",
    "first_value",
    "float",
    "floor",
    "for",
    "foreign",
    "frame_row",
    "free",
    "from",
    "full",
    "function",
    "fusion",
    "get",
    "global",
    "grant",
    "group",
    "grouping",
    "groups",
    "having",
    "hold",
    "hour",
    "identity",
    "in",
    "indicator",
    "initial",
    "inner",
    "inout",
    "insensitive",
    "insert",
    "int",
    "integer",
    "intersect",
    "intersection",
    "interval",
    "into",
    "is",
    "join",
    "json_array",
    "json_arrayagg",
    "json_exists",
    "json_object",
    "json_objectagg",
    "json_query",
    "json_table",
    "json_table_primitive",
    "json_value",
    "lag",
    "language",
    "large",
    "last_value",
    "lateral",
    "lead",
    "leading",
    "left",
    "like",
    "like_regex",
    "listagg",
    "ln",
    "local",
    "localtime",
    "localtimestamp",
    "log",
    "log10",
    "lower",
    "match",
    "match_number",
    "match_recognize",
    "matches",
    "max",
    "member",
    "merge",
    "method",
    "min",
    "minute",
    "mod",
    "modifies",
    "module",
    "month",
    "multiset",
    "national",
    "natural",
    "nchar",
    "nclob",
    "new",
    "no",
    "none",
    "normalize",
    "not",
    "nth_value",
    "ntile",
    "null",
    "nullif",
    "numeric",
    "octet_length",
    "occurrences_regex",
    "of",
    "offset",
    "old",
    "omit",
    "on",
    "one",
    "only",
    "open",
    "or",
    "order",
    "out",
    "outer",
    "over",
    "overlaps",
    "overlay",
    "parameter",
    "partition",
    "pattern",
    "per",
    "percent",
    "percent_rank",
    "percentile_cont",
    "percentile_disc",
    "period",
    "portion",
    "position",
    "position_regex",
    "power",
    "precedes",
    "precision",
    "prepare",
    "primary",
    "procedure",
    "ptf",
    "range",
    "rank",
    "reads",
    "real",
    "recursive",
    "ref",
    "references",
    "referencing",
    "regr_avgx",
    "regr_avgy",
    "regr_count",
    "regr_intercept",
    "regr_r2",
    "regr_slope",
    "regr_sxx",
    "regr_sxy",
    "regr_syy",
    "release",
    "result",
    "return",
    "returns",
    "revoke",
    "right",
    "rollback",
    "rollup",
    "row",
    "row_number",
    "rows",
    "running",
    "savepoint",
    "scope",
    "scroll",
    "search",
    "second",
    "seek",
    "select",
    "sensitive",
    "session_user",
    "set",
    "show",
    "similar",
    "sin",
    "sinh",
    "skip",
    "smallint",
    "some",
    "specific",
    "specifictype",
    "sql",
    "sqlexception",
    "sqlstate",
    "sqlwarning",
    "sqrt",
    "start",
    "static",
    "stddev_pop",
    "stddev_samp",
    "submultiset",
    "subset",
    "substring",
    "substring_regex",
    "succeeds",
    "sum",
    "symmetric",
    "system",
    "system_time",
    "system_user",
    "table",
    "tablesample",
    "tan",
    "tanh",
    "then",
    "time",
    "timestamp",
    "timezone_hour",
    "timezone_minute",
    "to",
    "trailing",
    "translate",
    "translate_regex",
    "translation",
    "treat",
    "trigger",
    "trim",
    "trim_array",
    "true",
    "truncate",
    "uescape",
    "union",
    "unique",
    "unknown",
    "unnest",
    "update",
    "upper",
    "user",
    "using",
    "value",
    "values",
    "value_of",
    "var_pop",
    "var_samp",
    "varbinary",
    "varchar",
    "varying",
    "versioning",
    "when",
    "whenever",
    "where",
    "width_bucket",
    "window",
    "with",
    "within",
    "without",
    "year"
  ], d = [
    "abs",
    "acos",
    "array_agg",
    "asin",
    "atan",
    "avg",
    "cast",
    "ceil",
    "ceiling",
    "coalesce",
    "corr",
    "cos",
    "cosh",
    "count",
    "covar_pop",
    "covar_samp",
    "cume_dist",
    "dense_rank",
    "deref",
    "element",
    "exp",
    "extract",
    "first_value",
    "floor",
    "json_array",
    "json_arrayagg",
    "json_exists",
    "json_object",
    "json_objectagg",
    "json_query",
    "json_table",
    "json_table_primitive",
    "json_value",
    "lag",
    "last_value",
    "lead",
    "listagg",
    "ln",
    "log",
    "log10",
    "lower",
    "max",
    "min",
    "mod",
    "nth_value",
    "ntile",
    "nullif",
    "percent_rank",
    "percentile_cont",
    "percentile_disc",
    "position",
    "position_regex",
    "power",
    "rank",
    "regr_avgx",
    "regr_avgy",
    "regr_count",
    "regr_intercept",
    "regr_r2",
    "regr_slope",
    "regr_sxx",
    "regr_sxy",
    "regr_syy",
    "row_number",
    "sin",
    "sinh",
    "sqrt",
    "stddev_pop",
    "stddev_samp",
    "substring",
    "substring_regex",
    "sum",
    "tan",
    "tanh",
    "translate",
    "translate_regex",
    "treat",
    "trim",
    "trim_array",
    "unnest",
    "upper",
    "value_of",
    "var_pop",
    "var_samp",
    "width_bucket"
  ], p = [
    "current_catalog",
    "current_date",
    "current_default_transform_group",
    "current_path",
    "current_role",
    "current_schema",
    "current_transform_group_for_type",
    "current_user",
    "session_user",
    "system_time",
    "system_user",
    "current_time",
    "localtime",
    "current_timestamp",
    "localtimestamp"
  ], f = [
    "create table",
    "insert into",
    "primary key",
    "foreign key",
    "not null",
    "alter table",
    "add constraint",
    "grouping sets",
    "on overflow",
    "character set",
    "respect nulls",
    "ignore nulls",
    "nulls first",
    "nulls last",
    "depth first",
    "breadth first"
  ], g = d, h = [
    ...c,
    ...l
  ].filter((R) => !d.includes(R)), w = {
    scope: "variable",
    match: /@[a-z0-9][a-z0-9_]*/
  }, x = {
    scope: "operator",
    match: /[-+*/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?/,
    relevance: 0
  }, v = {
    match: t.concat(/\b/, t.either(...g), /\s*\(/),
    relevance: 0,
    keywords: { built_in: g }
  };
  function b(R) {
    return t.concat(
      /\b/,
      t.either(...R.map((k) => k.replace(/\s+/, "\\s+"))),
      /\b/
    );
  }
  const _ = {
    scope: "keyword",
    match: b(f),
    relevance: 0
  };
  function y(R, {
    exceptions: k,
    when: F
  } = {}) {
    const z = F;
    return k = k || [], R.map((A) => A.match(/\|\d+$/) || k.includes(A) ? A : z(A) ? `${A}|0` : A);
  }
  return {
    name: "SQL",
    case_insensitive: !0,
    // does not include {} or HTML tags `</`
    illegal: /[{}]|<\//,
    keywords: {
      $pattern: /\b[\w\.]+/,
      keyword: y(h, { when: (R) => R.length < 3 }),
      literal: i,
      type: o,
      built_in: p
    },
    contains: [
      {
        scope: "type",
        match: b(s)
      },
      _,
      v,
      w,
      r,
      a,
      e.C_NUMBER_MODE,
      e.C_BLOCK_COMMENT_MODE,
      n,
      x
    ]
  };
}
function ql(e) {
  const t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), a = (i, s, o) => {
    const l = s.toLowerCase(), c = i.get(l);
    i.set(l, c === void 0 || (c == null ? void 0 : c.path) === o.path ? o : null);
  };
  for (const i of e) {
    const s = i.path.replace(/\.md$/i, "");
    a(t, s, i), a(n, s.slice(s.lastIndexOf("/") + 1), i), a(r, i.title.trim(), i);
  }
  return (i) => {
    const s = i.trim(), o = s.includes("/") || /\.md$/i.test(s), l = s.replace(/^\//, "").replace(/\.md$/i, "").toLowerCase();
    if (!l || l.split("/").some((d) => !d || d === "." || d === "..")) return null;
    if (o) return t.get(l) ?? null;
    const c = r.get(l);
    return c === void 0 ? n.get(l) ?? null : c;
  };
}
const Cl = /^\[\[([^\[\]\r\n]{1,256})\]\]/;
function Al(e) {
  e.inline.ruler.after("image", "wikilink", (t, n) => {
    if (n || t.linkLevel || !t.src.startsWith("[[", t.pos)) return !1;
    const r = Cl.exec(t.src.slice(t.pos, Math.min(t.posMax, t.pos + 260)));
    if (!r) return !1;
    const a = r[1].indexOf("|"), i = (a < 0 ? r[1] : r[1].slice(0, a)).trim();
    if (!i) return !1;
    const s = t.env.resolveWikilink, o = s == null ? void 0 : s(i), l = t.push("wikilink", "", 0);
    if (l.content = r[0], o) {
      const c = a < 0 ? "" : r[1].slice(a + 1).trim();
      l.content = c || i, l.attrSet("data-note-path", o.path);
    }
    return t.pos += r[0].length, !0;
  }), e.renderer.rules.wikilink = (t, n) => {
    const r = t[n], a = e.utils.escapeHtml(r.content), i = r.attrGet("data-note-path");
    return typeof i == "string" ? `<button type="button" class="qz-wikilink" data-note-path="${e.utils.escapeHtml(i)}">${a}</button>` : a;
  };
}
const $t = al.newInstance();
for (const [e, t] of Object.entries({ javascript: cl, typescript: dl, json: hl, css: xl, xml: wl, python: zl, bash: yl, yaml: Rl, sql: El }))
  $t.registerLanguage(e, t);
const Ne = new lo({ html: !1, highlight: (e, t) => e.length <= 32768 && $t.getLanguage(t) ? $t.highlight(e, { language: t, ignoreIllegals: !0 }).value : "" });
Al(Ne);
Ne.validateLink = (e) => /^(https?:\/\/|mailto:)/i.test(e);
Ne.renderer.rules.image = (e, t) => `<span class="qz-note-image">[image: ${Ne.utils.escapeHtml(e[t].content || "image")}]</span>`;
Ne.renderer.rules.link_open = (e, t, n, r, a) => (e[t].attrSet("target", "_blank"), e[t].attrSet("rel", "noopener noreferrer nofollow"), a.renderToken(e, t, n));
Ne.renderer.rules.note_task = (e, t, n, r, a) => a.renderToken(e, t, n) + " ";
Ne.core.ruler.push("note_tasks", (e) => {
  const { tokens: t, env: n } = e, r = typeof n.lineOffset == "number" ? n.lineOffset : 0, a = e.src.split(`
`);
  for (let i = 0; i < t.length; i++) {
    const s = t[i];
    if (s.type !== "list_item_open" || !s.map) continue;
    const o = s.map[0], l = /^[ \t]*- \[([ x])\] (.*)$/.exec(a[o] || "");
    if (!l) continue;
    const c = t[i + 1], d = t[i + 2], p = d == null ? void 0 : d.children, f = p == null ? void 0 : p[0], g = `[${l[1]}]`;
    if ((c == null ? void 0 : c.type) !== "paragraph_open" || (d == null ? void 0 : d.type) !== "inline" || !p || (f == null ? void 0 : f.type) !== "text" || f.content !== g && !f.content.startsWith(`${g} `)) continue;
    const h = new e.Token("note_task", "input", 0);
    h.attrSet("type", "checkbox"), h.attrSet("class", "qz-note-task-checkbox"), h.attrSet("data-note-task-line", String(o + r)), h.attrSet("aria-label", l[2].trim() || "Task"), n.editable || h.attrSet("disabled", "");
    const w = l[1] === "x";
    w && h.attrSet("checked", ""), s.attrJoin("class", w ? "qz-note-task qz-note-task-completed" : "qz-note-task"), f.content = f.content.slice(4);
    const x = new e.Token("span_open", "span", 1);
    x.attrSet("class", "qz-note-task-text"), p.unshift(h, x), p.push(new e.Token("span_close", "span", -1));
  }
});
function Nl(e, t, n = {}) {
  let r = e, a = 0;
  const i = /^---[ \t]*\n/.exec(e);
  if (i) {
    const d = /^---[ \t]*(?:\n|$)/gm;
    d.lastIndex = i[0].length, d.test(e) && (a = (e.slice(0, d.lastIndex).match(/\n/g) || []).length, r = e.slice(d.lastIndex));
  }
  const s = { resolveWikilink: t, editable: n.editable === !0, lineOffset: a }, o = Ne.parse(r, s), l = r.split(`
`), c = [];
  for (let d = 0; d < o.length; ) {
    const p = d, f = o[d++];
    if (f.nesting === 1) {
      let w = 1;
      for (; d < o.length && w > 0; ) w += o[d++].nesting;
    }
    const g = f.map, h = { html: Ne.renderer.render(o.slice(p, d), Ne.options, s) };
    if (g) {
      let w = g[1];
      for (; w > g[0] + 1 && /^[ \t]*$/.test(l[w - 1] ?? ""); ) w--;
      h.start = g[0] + a, h.end = w + a;
    }
    c.push(h);
  }
  return c;
}
function Dl(e) {
  const t = { folders: /* @__PURE__ */ new Map(), notes: [] };
  for (const n of e) {
    let r = t;
    for (const a of n.path.split("/").slice(0, -1)) {
      let i = r.folders.get(a);
      i || (i = { folders: /* @__PURE__ */ new Map(), notes: [] }, r.folders.set(a, i)), r = i;
    }
    r.notes.push(n);
  }
  return t;
}
function Ut(e) {
  const t = e.content.startsWith("\uFEFF") ? "\uFEFF" : "", n = e.content.slice(t.length), r = n.replace(/\r\n/g, ""), a = r.length !== n.length, i = r.includes("\r") || a && r.includes(`
`) ? "mixed" : a ? `\r
` : `
`;
  return { source: e, text: n.replace(/\r\n?/g, `
`), bom: t, lineEnding: i };
}
function Gr(e) {
  return e.lineEnding === "mixed" ? e.source.content : e.bom + (e.lineEnding === `\r
` ? e.text.replace(/\n/g, `\r
`) : e.text);
}
function Yr(e, t, n) {
  const r = e.split(`
`);
  if (!Number.isInteger(t) || !Number.isInteger(n) || t < 0 || n <= t || n > r.length) return null;
  let a = 0;
  for (let s = 0; s < t; s++) a += r[s].length + 1;
  let i = a + r[t].length;
  for (let s = t + 1; s < n; s++) i += 1 + r[s].length;
  return { from: a, to: i };
}
function Sl(e, t, n) {
  const r = Yr(e, t, t + 1);
  if (!r) return e;
  const a = /^([ \t]*- \[)( |x)(\] )/.exec(e.slice(r.from, r.to));
  if (!a) return e;
  const i = r.from + a[1].length;
  return e.slice(0, i) + (n ? "x" : " ") + e.slice(i + 1);
}
function Tt(e) {
  return e && (e.conflict || Gr(e) !== e.source.content) ? e : void 0;
}
function Pt(e) {
  return `${e.workspaceId}:${e.path}`;
}
function Tl(e, t) {
  const [n, r] = T(() => /* @__PURE__ */ new Map()), a = de(n), i = de(/* @__PURE__ */ new Map());
  function s(d, p) {
    const f = new Map(a.current);
    f.set(d, p(f.get(d) ?? {})), a.current = f, r(f);
  }
  function o(d, p, f) {
    var g;
    f !== void 0 && (((g = a.current.get(d)) == null ? void 0 : g.draft) ?? null) !== f || s(d, (h) => {
      const w = h.draft ?? h.saved, x = p && w ? { ...p, source: w.source, conflict: w.conflict } : p ?? void 0;
      return { ...h, draft: h.saving ? x : Tt(x), didSave: !1, failure: p ? h.failure : void 0 };
    });
  }
  function l(d, p) {
    var f;
    p && ((f = a.current.get(d)) == null ? void 0 : f.saved) === p && s(d, (g) => ({ ...g, saved: void 0 }));
  }
  async function c(d) {
    var w, x;
    const p = Pt(d), f = (w = a.current.get(p)) == null ? void 0 : w.draft;
    if (!f || f.conflict || f.lineEnding === "mixed") return;
    const g = i.current.get(p);
    if (g) {
      g.next = f;
      return;
    }
    const h = { next: f };
    i.current.set(p, h), s(p, (v) => ({ ...v, saving: !0, didSave: !1, failure: void 0 }));
    try {
      let v;
      for (; v = h.next; ) {
        h.next = void 0;
        const b = Gr(v);
        if (b === v.source.content) continue;
        const _ = await we(_a(e, d.workspaceId, d.path, b, v.source.hash)), y = Ut({ ..._, content: b }), R = (x = i.current.get(p)) == null ? void 0 : x.next;
        R && (h.next = { ...R, source: y.source }), s(p, (k) => ({
          ...k,
          saved: y,
          draft: Tt(k.draft && { ...k.draft, source: y.source }),
          didSave: !0
        })), t();
      }
    } catch (v) {
      const b = xe(v);
      s(p, (_) => b.code === "conflict" && _.draft ? { ..._, draft: { ..._.draft, conflict: !0 } } : { ..._, failure: b });
    } finally {
      i.current.delete(p), s(p, (v) => ({ ...v, saving: !1, draft: Tt(v.draft) }));
    }
  }
  return { edits: n, edit: o, loaded: l, save: c };
}
const Fl = ".qz-notes-layout{display:grid;grid-template-columns:minmax(190px,1fr) minmax(0,3fr);gap:14px;align-items:start}.qz-note-browser,.qz-note-editor,.qz-note-create{display:grid;gap:12px;padding:14px}.qz-note-browser{max-height:72vh;overflow:auto}.qz-note-create{grid-template-columns:minmax(0,1fr) auto;align-items:end}.qz-note-create .qz-error{grid-column:1 / -1}.qz-note-tree{display:grid;gap:3px;padding:0;list-style:none}.qz-note-tree .qz-note-tree{margin-inline-start:10px}.qz-note-tree :is(summary,button){width:100%;min-height:32px;padding:5px 7px;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--qz-text);text-align:start;overflow-wrap:anywhere;cursor:pointer}.qz-note-tree :is(summary,button){display:flex;align-items:center;gap:7px}.qz-note-tree summary{list-style:none}.qz-note-tree summary::-webkit-details-marker{display:none}.qz-note-tree-arrow{display:flex;flex:none;transform:rotate(-90deg)}.qz-note-tree details[open]>summary>.qz-note-tree-arrow{transform:none}.qz-note-tree-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.qz-note-tree :is(summary,button):hover{background:var(--qz-elevated)}.qz-note-tree button[aria-current=true]{border-color:color-mix(in srgb,var(--qz-accent) 26%,var(--qz-border));background:var(--qz-accent-soft)}.qz-note-editor .qz-path{flex:1 1 15ch}.qz-note-toolbar{gap:8px}.qz-note-column{width:100%;max-width:800px;margin-inline:auto;padding-inline:20px}.qz-note-column-full{max-width:none}.qz-note-text,.qz-note-block-text{resize:vertical;font:400 16px/1.55 var(--mono, ui-monospace, monospace)}.qz-app:has(.qz-notes-tab:not([hidden]) .qz-note-source),.qz-content:has(>.qz-notes-tab:not([hidden]) .qz-note-source),.qz-notes-tab:has(.qz-note-source),.qz-notes-view:has(.qz-note-source),.qz-note-editor:has(.qz-note-source),.qz-note-source{display:flex;flex:1;flex-direction:column}.qz-notes-layout:has(.qz-note-source){flex:1}.qz-note-editor:has(.qz-note-source){align-self:stretch}.qz-note-text{flex:1 0 auto;min-height:360px}.qz-note-message{font-size:12px}.qz-note-message:empty{display:none}.qz-notes-rendered{min-width:0;min-height:360px;padding-block:14px 32px;font:400 16px/1.55 var(--font-body, sans-serif);overflow-wrap:anywhere}.qz-notes-rendered :is(p,ul,ol,pre,blockquote,table,h1,h2,h3,h4,h5,h6){margin:0 0 .9em}.qz-notes-rendered :is(ul,ol){padding-inline-start:1.5em}.qz-notes-rendered :is(h1,h2,h3,h4,h5,h6){color:var(--text-strong, var(--qz-text));line-height:1.25;font-weight:600}.qz-notes-rendered h1{font-size:1.802em;font-weight:700}.qz-notes-rendered h2{font-size:1.602em}.qz-notes-rendered h3{font-size:1.422em}.qz-notes-rendered h4{font-size:1.278em}.qz-notes-rendered h5{font-size:1.121em}.qz-notes-rendered h6{font-size:1em}.qz-notes-rendered :is(h1,h2){padding-block-end:.25em;border-block-end:1px solid var(--mdnb-heading-rule-soft, var(--qz-border))}.qz-notes-rendered :is(h3,h4,h5,h6){padding-inline-start:8px;margin-inline-start:-10px;border-inline-start:2px solid var(--mdnb-heading-rail, var(--qz-border))}.qz-notes-rendered :is(code,pre){font-family:var(--mono, ui-monospace, monospace);font-size:.9em}.qz-notes-rendered pre code{font-size:inherit}.qz-notes-rendered pre{overflow-x:auto;padding:10px;border:1px solid var(--qz-border);border-radius:6px;background:var(--qz-elevated)}.qz-notes-rendered blockquote{padding:6px 12px;border-inline-start:3px solid var(--qz-border)}.qz-notes-rendered blockquote>:last-child{margin-block-end:0}.qz-notes-rendered :not(pre)>code{padding:.1em .3em;border-radius:4px;background:var(--qz-elevated)}.qz-notes-rendered :is(.hljs-keyword,.hljs-selector-tag,.hljs-meta){color:color-mix(in srgb,var(--qz-accent) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-string,.hljs-regexp){color:color-mix(in srgb,var(--qz-ok) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-number,.hljs-literal,.hljs-variable){color:color-mix(in srgb,var(--qz-warning) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-title,.hljs-attr,.hljs-built_in,.hljs-attribute){color:color-mix(in srgb,var(--qz-info) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-comment,.hljs-quote){color:var(--qz-muted);font-style:italic}.qz-notes-rendered table{display:block;border-collapse:collapse;overflow-x:auto}.qz-notes-rendered :is(th,td){padding:5px 8px;border:1px solid var(--qz-border)}.qz-notes-rendered a{color:var(--qz-accent)}.qz-note-task{list-style:none}.qz-note-task-checkbox{accent-color:var(--qz-accent);margin-inline:0 .25em}.qz-note-task-completed>.qz-note-task-text,.qz-note-task-completed>p>.qz-note-task-text{color:var(--qz-muted);text-decoration:line-through}.qz-note-block{position:relative;display:flow-root}.qz-note-block-content{cursor:text}.qz-note-block .qz-note-edit-block{position:absolute;inset-block-start:0;inset-inline-end:-20px;min-height:24px;width:24px;padding:2px;color:var(--qz-muted);opacity:0}.qz-note-block:hover .qz-note-edit-block,.qz-note-edit-block:focus-visible{opacity:1}.qz-note-block-editor{display:grid;gap:6px;margin-block-end:.9em}.qz-note-block-editor .qz-actions{justify-content:end}.qz-wikilink{max-width:100%;padding:0;border:0;background:transparent;color:var(--qz-accent);font:inherit;text-align:start;text-decoration:underline;overflow-wrap:anywhere;cursor:pointer}.qz-note-backlinks{border-top:1px solid var(--qz-border);padding-top:12px}.qz-note-backlinks h3{margin:0 0 6px;font-size:14px}.qz-note-backlinks ul{display:grid;gap:4px;margin:0;padding-inline-start:1.25em}.qz-note-image{color:var(--qz-muted)}@container qz-app (max-width: 680px){.qz-notes-layout,.qz-note-create{grid-template-columns:minmax(0,1fr)}.qz-notes-layout:has(.qz-note-source){grid-template-rows:auto 1fr}.qz-note-browser{max-height:35vh}}", Ml = 3e3, Qe = 500, Ft = [], Ln = "quartizo-notes-view", $n = "quartizo-notes-full-width";
function Un(e) {
  var t;
  try {
    return ((t = ht()) == null ? void 0 : t.getItem(e)) ?? null;
  } catch {
    return null;
  }
}
function Pn(e, t) {
  var n;
  try {
    (n = ht()) == null || n.setItem(e, t);
  } catch {
  }
}
function Il(e, t, n) {
  const r = Zn(), [a, i] = T(null), [s, o] = T(null), [l, c] = T(null), [d, p] = T(0);
  pe(() => {
    if (!t || !r) return;
    let g = !1, h, w, x;
    const v = async () => {
      try {
        const b = await we(vt(e));
        if (g) return;
        const _ = b.workspaces.filter((k) => k.workspace.companion), y = JSON.stringify(_);
        x !== y && (i(_), x = y);
        const R = _.find((k) => k.workspace.id === n) ?? _[0];
        if (!b.available) throw new Error(b.error ?? "The Markdown index is unavailable.");
        if (R) {
          const k = `${R.workspace.id}:${R.index.indexedAt ?? ""}`;
          if (k !== w) {
            const F = await we(ba(e, R.workspace.id));
            if (g) return;
            o({ workspaceId: R.workspace.id, notes: F.notes }), w = k;
          }
        } else
          o(null);
        c(null);
      } catch (b) {
        g || c(xe(b));
      } finally {
        g || (h = setTimeout(v, Ml));
      }
    };
    return v(), () => {
      g = !0, clearTimeout(h);
    };
  }, [t, e, d, r, n]);
  const f = (a == null ? void 0 : a.find((g) => g.workspace.id === n)) ?? (a == null ? void 0 : a[0]);
  return {
    current: f,
    failure: l,
    workspaces: a,
    notes: f && (s == null ? void 0 : s.workspaceId) === f.workspace.id ? s.notes : null,
    refresh: () => p((g) => g + 1),
    visible: r
  };
}
function Bl({ api: e, active: t, request: n, onSettings: r }) {
  var K;
  const [a, i] = T(null), [s, o] = T(null), [l, c] = T(() => Un(Ln) === "raw" ? "raw" : "rendered"), [d, p] = T(() => Un($n) === "true"), [f, g] = T(null), [h, w] = T(""), [x, v] = T(Qe), [b, _] = T(!1), [y, R] = T(""), [k, F] = T(null), [z, A] = T(!1), O = de(!1), { workspaces: j, current: B, notes: J, failure: H, refresh: ie, visible: E } = Il(e, t, a), { edits: C, edit: D, loaded: P, save: W } = Tl(e, ie), L = de(null), ee = na(h.trim().toLowerCase()), le = He(() => ee ? (J ?? Ft).filter(($) => $.title.toLowerCase().includes(ee) || $.path.toLowerCase().includes(ee)) : J ?? Ft, [J, ee]), ce = He(() => Dl(le.slice(0, x)), [le, x]);
  if (pe(() => {
    n && (i(n.workspaceId), o(n), g(null), w(""), v(Qe), _(!1));
  }, [n]), pe(() => {
    var $;
    b && (($ = L.current) == null || $.focus());
  }, [b]), !j) return H ? /* @__PURE__ */ u(he, { failure: H }) : /* @__PURE__ */ u("p", { className: "qz-empty", role: "status", children: "Loading folders…" });
  if (!B) return /* @__PURE__ */ m("div", { className: "qz-stack", children: [
    /* @__PURE__ */ u(he, { failure: H }),
    /* @__PURE__ */ m("div", { className: "qz-empty", children: [
      /* @__PURE__ */ u("span", { className: "qz-empty-icon", children: /* @__PURE__ */ u(Q, { name: "folder" }) }),
      /* @__PURE__ */ u("h2", { children: "Connect a notes folder" }),
      /* @__PURE__ */ u("p", { children: "Add a folder of Markdown files in Settings to browse and edit your notes." }),
      /* @__PURE__ */ u("button", { type: "button", className: "qz-button", "data-variant": "primary", onClick: r, children: "Open Settings" })
    ] })
  ] });
  const oe = B.workspace.id, fe = (s == null ? void 0 : s.workspaceId) === oe ? s : null, be = fe ? Pt(fe) : "", Y = ($) => {
    g(null), o({ workspaceId: oe, path: $ });
  }, S = (K = B.index.writeBlocked) == null ? void 0 : K.message, X = Zt(B.index), ue = async () => {
    const $ = y.trim();
    if (!(!$ || O.current || S)) {
      O.current = !0, A(!0), F(null);
      try {
        const V = await we(ka(e, oe, $));
        R(""), _(!1);
        const te = { workspaceId: oe, path: V.path };
        g(Pt(te)), o((Re) => Re === s ? te : Re), ie();
      } catch (V) {
        F(xe(V));
      } finally {
        O.current = !1, A(!1);
      }
    }
  };
  return /* @__PURE__ */ m("section", { className: "qz-stack qz-notes-view", "aria-label": "Notes", children: [
    /* @__PURE__ */ u("style", { children: Fl }),
    /* @__PURE__ */ m("div", { className: "qz-view-heading", children: [
      /* @__PURE__ */ u("div", { children: /* @__PURE__ */ u("h2", { className: "qz-section-title", children: "Notes" }) }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ m("label", { className: "qz-inline-field", children: [
          /* @__PURE__ */ u(Q, { name: "folder" }),
          /* @__PURE__ */ u("span", { children: "Notes folder" }),
          /* @__PURE__ */ u("select", { className: "qz-input", value: oe, disabled: z, onChange: ($) => {
            i(Number($.target.value)), o(null), w(""), v(Qe), _(!1);
          }, children: j.map(({ workspace: $ }) => /* @__PURE__ */ u("option", { value: $.id, children: $.name }, $.id)) })
        ] }),
        /* @__PURE__ */ m(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "primary",
            "aria-expanded": b,
            onClick: () => {
              _(($) => !$), F(null);
            },
            disabled: z || !!S,
            children: [
              /* @__PURE__ */ u(Q, { name: "plus" }),
              "New note"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ u(he, { failure: H }),
    X && /* @__PURE__ */ u("div", { className: "qz-notice", role: "note", children: X }),
    b && /* @__PURE__ */ m("form", { className: "qz-note-create qz-panel-surface", onSubmit: ($) => {
      $.preventDefault(), ue();
    }, children: [
      /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Note path",
        /* @__PURE__ */ u(
          "input",
          {
            ref: L,
            className: "qz-input",
            value: y,
            placeholder: "projects/launch.md",
            disabled: z,
            onChange: ($) => R($.target.value),
            required: !0
          }
        )
      ] }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ u("button", { type: "submit", className: "qz-button", "data-variant": "primary", disabled: !y.trim() || z || !!S, children: "Create note" }),
        /* @__PURE__ */ u("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: z, onClick: () => _(!1), children: "Cancel" })
      ] }),
      /* @__PURE__ */ u(he, { failure: k })
    ] }),
    /* @__PURE__ */ m("div", { className: "qz-notes-layout", children: [
      /* @__PURE__ */ m("aside", { className: "qz-note-browser qz-panel-surface", "aria-label": "Notes browser", children: [
        /* @__PURE__ */ m("label", { className: "qz-field", children: [
          "Search notes",
          /* @__PURE__ */ u(
            "input",
            {
              type: "search",
              className: "qz-input",
              value: h,
              placeholder: "Title or path",
              onChange: ($) => {
                w($.target.value), v(Qe);
              }
            }
          )
        ] }),
        J === null && !H && /* @__PURE__ */ u("p", { role: "status", className: "qz-muted", children: "Loading notes…" }),
        J !== null && le.length === 0 && /* @__PURE__ */ u("p", { className: "qz-muted", children: ee ? "No notes match your search." : B.index.state === "scanning" ? "Indexing notes…" : "No notes in this folder yet." }),
        le.length > 0 && /* @__PURE__ */ u(
          Xr,
          {
            branch: ce,
            prefix: "",
            selected: fe == null ? void 0 : fe.path,
            query: ee,
            onOpen: Y
          }
        ),
        le.length > x && /* @__PURE__ */ u(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            onClick: () => v(($) => $ + Qe),
            children: "Show more notes"
          }
        )
      ] }),
      fe ? /* @__PURE__ */ u(
        Ol,
        {
          api: e,
          active: t,
          location: fe,
          edits: C.get(be),
          onDraft: ($, V) => D(be, $, V),
          onLoaded: ($) => P(be, $),
          onSave: () => {
            S || W(fe);
          },
          writeBlocked: !!S,
          notes: J ?? Ft,
          onOpen: Y,
          loadBacklinks: t && E,
          indexRevision: B.index.indexedAt,
          view: f === be ? "raw" : l,
          focusEditor: f === be,
          fullWidth: d,
          onViewChange: ($) => {
            g(null), c($), Pn(Ln, $);
          },
          onWidthChange: () => {
            p(!d), Pn($n, String(!d));
          }
        },
        be
      ) : /* @__PURE__ */ m("div", { className: "qz-empty", children: [
        /* @__PURE__ */ u("span", { className: "qz-empty-icon", children: /* @__PURE__ */ u(Q, { name: "note" }) }),
        /* @__PURE__ */ u("h3", { children: "Open a note" }),
        /* @__PURE__ */ u("p", { children: "Choose one from the folder tree or create a new note." })
      ] })
    ] })
  ] });
}
function Xr({ branch: e, prefix: t, selected: n, query: r, onOpen: a }) {
  return /* @__PURE__ */ m("ul", { className: "qz-note-tree", children: [
    [...e.folders].map(([i, s]) => {
      const o = `${t}${i}/`;
      return /* @__PURE__ */ u("li", { children: /* @__PURE__ */ m("details", { open: r || n != null && n.startsWith(o) ? !0 : void 0, children: [
        /* @__PURE__ */ m("summary", { title: i, children: [
          /* @__PURE__ */ u("span", { className: "qz-note-tree-arrow", children: /* @__PURE__ */ u(Q, { name: "down" }) }),
          /* @__PURE__ */ u(Q, { name: "folder" }),
          /* @__PURE__ */ u("span", { className: "qz-note-tree-name", children: i })
        ] }),
        /* @__PURE__ */ u(Xr, { branch: s, prefix: o, selected: n, query: r, onOpen: a })
      ] }) }, o);
    }),
    e.notes.map((i) => /* @__PURE__ */ u("li", { children: /* @__PURE__ */ m(
      "button",
      {
        type: "button",
        "aria-current": i.path === n ? "true" : void 0,
        title: i.path,
        onClick: () => a(i.path),
        children: [
          /* @__PURE__ */ u(Q, { name: "note" }),
          i.title
        ]
      }
    ) }, i.path))
  ] });
}
function Ol({ api: e, active: t, location: n, edits: r, onDraft: a, onLoaded: i, onSave: s, writeBlocked: o, notes: l, onOpen: c, loadBacklinks: d, indexRevision: p, view: f, focusEditor: g, fullWidth: h, onViewChange: w, onWidthChange: x }) {
  const { workspaceId: v, path: b } = n, { draft: _, saved: y, saving: R } = r ?? {}, [k, F] = T(null), z = f === "rendered", [A, O] = T(""), [j, B] = T(null), [J, H] = T(!1), [ie, E] = T(!1), [C, D] = T(null), [P, W] = T(null), [L, ee] = T(null), le = de(!1), ce = de(null), oe = de(null), fe = de(null), be = !!_, Y = _ ?? y ?? k, S = Y == null ? void 0 : Y.text, X = J || ie || o || (Y == null ? void 0 : Y.lineEnding) === "mixed", ue = L && S !== void 0 ? S.slice(L.from, S.length - (L.original.length - L.to)) : "", K = (L == null ? void 0 : L.original) ?? S, $ = !X && !L, V = He(() => ql(l), [l]), te = He(
    () => z && K !== void 0 ? Nl(K, V, { editable: !X }) : [],
    [z, K, V, X]
  ), Re = `qz-note-column${h ? " qz-note-column-full" : ""}`;
  ra(() => {
    var re;
    const M = fe.current;
    if (!M) return;
    fe.current = null;
    const G = ((re = oe.current) == null ? void 0 : re.querySelector(M)) ?? oe.current;
    G == null || G.focus({ preventScroll: !0 });
  }, [te]), pe(() => {
    const M = t && !le.current;
    if (le.current = t, !t || be || R) return;
    if (y && !M && k) {
      F(y), i(y);
      return;
    }
    let G = !1;
    return H(!0), B(null), we(It(e, v, b)).then((re) => {
      G || (F(Ut(re)), i(y), (Y == null ? void 0 : Y.source.hash) !== re.hash && ee(null));
    }).catch((re) => {
      G || B(xe(re));
    }).finally(() => {
      G || H(!1);
    }), () => {
      G = !0, H(!1);
    };
  }, [t, e, be, b, R, v]), pe(() => {
    if (!d || p == null) return;
    let M = !1;
    return we(va(e, v, b)).then((G) => {
      M || (D(G), W(null));
    }).catch((G) => {
      M || (D(null), W(xe(G)));
    }), () => {
      M = !0;
    };
  }, [e, p, d, b, v]);
  const Me = async () => {
    if (!(J || R || ie || _ && !window.confirm("Replace your unsaved draft with the version on disk?"))) {
      E(!0), B(null), O("");
      try {
        F(Ut(await we(It(e, v, b)))), a(null, _ ?? null), i(y), ee(null), O("Note reloaded.");
      } catch (M) {
        B(xe(M));
      } finally {
        E(!1);
      }
    }
  }, U = (M) => {
    !Y || X || M === Y.text || (O(""), a({ ...Y, text: M }));
  }, Xe = (M, G) => {
    if (X || L || !Y) return;
    const re = Yr(Y.text, M, G);
    re && ee({ start: M, end: G, ...re, original: Y.text });
  }, se = (M, G = !0) => {
    L && (M ? U(L.original) : X || s(), G && (fe.current = `[data-edit-start="${L.start}"]`), ee(null));
  };
  return /* @__PURE__ */ m("section", { className: "qz-note-editor qz-panel-surface", "aria-label": "Note editor", children: [
    /* @__PURE__ */ m("div", { className: "qz-toolbar qz-note-toolbar", children: [
      /* @__PURE__ */ u("code", { className: "qz-mono qz-path", title: b, children: b }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ u(
          aa,
          {
            segments: [{ key: "rendered", label: "Rendered" }, { key: "raw", label: "Raw" }],
            value: f,
            onChange: (M) => {
              L ? se(!1, !1) : X || s(), w(M);
            },
            ariaLabel: "Note view",
            collapse: !1
          }
        ),
        /* @__PURE__ */ u(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            "aria-pressed": h,
            onClick: x,
            children: h ? "Full width" : "Reading width"
          }
        ),
        /* @__PURE__ */ u(
          "button",
          {
            ref: ce,
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            disabled: J || R || ie,
            onMouseDown: (M) => M.preventDefault(),
            onClick: () => void Me(),
            children: "Reload from disk"
          }
        ),
        /* @__PURE__ */ u(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "primary",
            disabled: !_ || _.conflict || X,
            onClick: () => {
              L ? se(!1) : s();
            },
            children: "Save note"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ u(he, { failure: j ?? (r == null ? void 0 : r.failure) ?? null }),
    J && !Y && /* @__PURE__ */ u("p", { className: "qz-muted", role: "status", children: "Loading note…" }),
    (_ == null ? void 0 : _.conflict) && /* @__PURE__ */ u("div", { className: "qz-notice", role: "alert", children: "The note changed on disk. Your draft is still here. Copy or review your changes before reloading from disk." }),
    (Y == null ? void 0 : Y.lineEnding) === "mixed" && /* @__PURE__ */ u("div", { className: "qz-notice", role: "note", children: "This note has mixed line endings and opens read-only to preserve them." }),
    Y && (z ? /* @__PURE__ */ m(
      "div",
      {
        ref: oe,
        className: `qz-notes-rendered ${Re}`,
        "aria-label": "Markdown preview",
        tabIndex: -1,
        onClick: (M) => {
          if (!(M.target instanceof Element)) return;
          const G = M.target.closest("button.qz-wikilink[data-note-path]"), re = G == null ? void 0 : G.dataset.notePath;
          re && l.some((ke) => ke.path === re) && c(re);
          const Ee = M.target.closest("input.qz-note-task-checkbox[data-note-task-line]");
          if (Ee && !X) {
            let ke = Number(Ee.dataset.noteTaskLine);
            L && ke >= L.end && (ke += ue.split(`
`).length - (L.end - L.start));
            const q = Sl(Y.text, ke, Ee.checked);
            q !== Y.text && (fe.current = `input[data-note-task-line="${ke}"]`, ee(null), U(q), s());
          }
        },
        children: [
          !te.length && /* @__PURE__ */ u("p", { className: "qz-muted", children: "No content yet." }),
          te.map(({ html: M, start: G, end: re }, Ee) => {
            if (L && G === L.start)
              return /* @__PURE__ */ m("div", { className: "qz-note-block-editor", onBlur: (q) => {
                const I = q.relatedTarget;
                I === ce.current || I instanceof Node && q.currentTarget.contains(I) || se(!1, !1);
              }, children: [
                /* @__PURE__ */ u(
                  "textarea",
                  {
                    "aria-label": "Block Markdown",
                    className: "qz-input qz-note-block-text",
                    autoFocus: !0,
                    spellCheck: !1,
                    rows: Math.max(2, (re ?? G + 1) - G),
                    readOnly: X,
                    value: ue,
                    onChange: (q) => U(L.original.slice(0, L.from) + q.target.value + L.original.slice(L.to)),
                    onKeyDown: (q) => {
                      q.nativeEvent.isComposing || (q.key === "Escape" || q.key === "Enter" && (q.metaKey || q.ctrlKey)) && (q.preventDefault(), q.stopPropagation(), se(q.key === "Escape"));
                    }
                  }
                ),
                /* @__PURE__ */ m("div", { className: "qz-actions", children: [
                  /* @__PURE__ */ u(
                    "button",
                    {
                      type: "button",
                      className: "qz-button",
                      onMouseDown: (q) => q.preventDefault(),
                      onClick: () => se(!1),
                      children: "Done"
                    }
                  ),
                  /* @__PURE__ */ u(
                    "button",
                    {
                      type: "button",
                      className: "qz-button",
                      "data-variant": "quiet",
                      onMouseDown: (q) => q.preventDefault(),
                      onClick: () => se(!0),
                      children: "Cancel"
                    }
                  )
                ] })
              ] }, Ee);
            const ke = $ && G !== void 0 && re !== void 0;
            return /* @__PURE__ */ m("div", { className: "qz-note-block", children: [
              /* @__PURE__ */ u(
                "div",
                {
                  className: ke ? "qz-note-block-content" : void 0,
                  onClick: ke ? (q) => {
                    var I;
                    q.target instanceof Element && !q.target.closest("a, button, input, summary") && !((I = window.getSelection()) != null && I.toString()) && Xe(G, re);
                  } : void 0,
                  dangerouslySetInnerHTML: { __html: M }
                }
              ),
              ke && /* @__PURE__ */ u(
                "button",
                {
                  type: "button",
                  className: "qz-button qz-note-edit-block",
                  "data-edit-start": G,
                  "aria-label": `Edit block at line ${G + 1}`,
                  title: "Edit block",
                  onClick: () => Xe(G, re),
                  children: /* @__PURE__ */ u(Q, { name: "edit" })
                }
              )
            ] }, Ee);
          })
        ]
      }
    ) : /* @__PURE__ */ m("label", { className: `qz-field qz-note-source ${Re}`, children: [
      "Note Markdown",
      /* @__PURE__ */ u(
        "textarea",
        {
          autoFocus: g,
          className: "qz-input qz-note-text",
          spellCheck: !1,
          value: Y.text,
          readOnly: X,
          onChange: (M) => U(M.target.value),
          onBlur: (M) => {
            !X && M.relatedTarget !== ce.current && s();
          }
        }
      )
    ] })),
    /* @__PURE__ */ u("span", { className: "qz-muted qz-note-message", role: "status", children: R ? "Saving note…" : _ ? "Unsaved changes" : A || (r != null && r.didSave ? "Note saved." : "") }),
    Y && (P || !!(C != null && C.notes.length)) && /* @__PURE__ */ m("section", { className: "qz-note-backlinks", "aria-label": "Backlinks", children: [
      /* @__PURE__ */ u("h3", { children: "Backlinks" }),
      /* @__PURE__ */ u(he, { failure: P }),
      C && /* @__PURE__ */ u("ul", { children: C.notes.map((M) => /* @__PURE__ */ u("li", { children: /* @__PURE__ */ u("button", { type: "button", className: "qz-wikilink", title: M.path, onClick: () => c(M.path), children: M.title }) }, M.path)) }),
      (C == null ? void 0 : C.truncated) && /* @__PURE__ */ m("p", { className: "qz-muted", children: [
        "Only the first ",
        C.notes.length,
        " backlinks are shown."
      ] })
    ] })
  ] });
}
function Ll(e, t) {
  const n = t[0].id, r = t.map((a) => `- ${a.id} (${JSON.stringify(a.label)})`).join(`
`);
  return `Work with Quartizo notes by editing Markdown files in the connected folder ${JSON.stringify(e)}.

- Keep note operations within this exact folder. If you delegate, pass the absolute path to the worker and have it verify that its changes land in that folder.
- Find and read the current note before updating it. Use a new, unused .md path inside the folder for new notes. Use UTF-8 with LF line endings for new files. Preserve existing line endings, unrelated text, and YAML properties when editing. Re-read before saving if the file may have changed, and stop if the edit conflicts with another writer.
- A regular note can start with a # Title heading and needs no ticket metadata. Create a ticket only when asked for a board card. Put its YAML frontmatter at the very start of the file. Generate a fresh UUID for each new ticket and preserve existing ticket IDs.

Use these ticket status IDs, listed in board order.
${r}

Use this template for a new ticket. Replace the example UUID and calculate the order before saving.

\`\`\`markdown
---
id: "8423e295-12ce-4b61-a281-d719c1fa86f6"
type: ticket
status: "${n}"
order: "7fffffffffffffffffffffffffffffff"
---

# Ticket title

- [ ] An actionable TODO
\`\`\`

- Use the first status unless the user specifies a column. Append a new or moved card by inspecting the destination column's current ticket notes. With exact integer arithmetic, take the floor of (largest order + 0xffffffffffffffffffffffffffffffff) / 2, using 0 as the largest order for an empty column. Write the result as a quoted, zero-padded, 32-character lowercase hex string. If the midpoint equals the largest order or the column has invalid metadata, stop and report that it needs repair or rebalancing in Quartizo. Preserve status and order on ordinary note edits.
- Add TODOs to the relevant note as \`- [ ] text\` lines outside tables and code fences. Use lowercase \`- [x] text\` for completed items. To complete or reopen an existing TODO, change only that item's checkbox marker. Keep checklist completion independent of ticket status. If an existing note uses CRLF, explain that its TODOs need LF and ask before converting the note.
- Verify the resulting Markdown and report the note paths you changed. Quartizo picks up edits from the connected folder.`;
}
const $l = '.qz-settings{display:grid;align-content:start;gap:20px;width:100%;max-width:1100px;min-width:0;margin-inline:auto;container:qz-settings / inline-size}.qz-settings .qz-settings-grid{display:grid;align-items:start;gap:20px}@container qz-settings (min-width: 760px){.qz-settings .qz-settings-grid{grid-template-columns:minmax(0,1fr) minmax(260px,330px)}}.qz-settings .qz-settings-folders,.qz-settings .qz-settings-add,.qz-settings .qz-settings-folder,.qz-settings .qz-settings-migration,.qz-settings .qz-settings-notice{display:grid;min-width:0;gap:12px}.qz-settings .qz-settings-add,.qz-settings .qz-settings-folder{padding:16px}.qz-settings .qz-settings-add p{margin-block-start:4px}.qz-settings .qz-settings-add .qz-input{width:100%}.qz-settings .qz-settings-add>.qz-button{justify-self:start}.qz-settings .qz-settings-heading,.qz-settings .qz-settings-folder-identity,.qz-settings .qz-settings-folder-controls,.qz-settings .qz-settings-actions,.qz-settings .qz-settings-check{display:flex;align-items:center}.qz-settings .qz-settings-heading,.qz-settings .qz-settings-folder-identity,.qz-settings .qz-settings-check{gap:10px}.qz-settings .qz-settings-heading h3,.qz-settings .qz-settings-add h3,.qz-settings .qz-settings-folder h4{margin:0;color:var(--qz-text);font-size:15px;font-weight:650}.qz-settings .qz-settings-count{padding:1px 7px;border:1px solid var(--qz-border);border-radius:999px;color:var(--qz-muted);font-size:12px;font-variant-numeric:tabular-nums}.qz-settings .qz-settings-folder-icon{display:grid;flex:none;width:36px;height:36px;place-items:center;border-radius:9px;background:var(--qz-accent-soft);color:var(--qz-accent)}.qz-settings .qz-settings-folder-identity>div{display:grid;min-width:0;gap:3px;overflow-wrap:anywhere}.qz-settings .qz-settings-folder-controls{justify-content:space-between;flex-wrap:wrap;gap:8px 12px;padding-block-start:10px;border-top:1px solid var(--qz-border)}.qz-settings .qz-settings-actions{flex-wrap:wrap;gap:4px}.qz-settings .qz-settings-check{min-height:32px;font-size:13px;cursor:pointer}.qz-settings .qz-settings-check input{flex:none;accent-color:var(--qz-accent)}.qz-settings .qz-settings-toggle{display:inline-grid;align-items:center;justify-items:start;-webkit-appearance:none;-moz-appearance:none;appearance:none;width:34px;height:20px;padding:2px;margin:0;border:1px solid var(--qz-muted);border-radius:999px;background:var(--qz-elevated);cursor:inherit}.qz-settings .qz-settings-toggle:before{width:12px;height:12px;border-radius:50%;background:var(--qz-muted);content:""}.qz-settings .qz-settings-toggle:checked{justify-items:end;border-color:var(--qz-accent);background:var(--qz-accent-soft)}.qz-settings .qz-settings-toggle:checked:before{background:var(--qz-accent)}.qz-settings .qz-settings-toggle:disabled{opacity:.6;cursor:default}@media (forced-colors: active){.qz-settings .qz-settings-toggle{display:inline-block;-webkit-appearance:auto;-moz-appearance:auto;appearance:auto;width:16px;height:16px}}.qz-settings .qz-settings-migration,.qz-settings .qz-settings-result{padding:12px;border:1px solid var(--qz-border);border-radius:9px;background:var(--qz-canvas);font-size:13px}.qz-settings .qz-settings-migration{gap:6px}.qz-settings .qz-settings-notice{gap:8px;overflow-wrap:anywhere}.qz-settings .qz-settings-migration-files{max-height:200px;margin:0;padding-inline-start:20px;overflow-y:auto;list-style:disc}.qz-settings .qz-button[data-destructive]{color:var(--qz-danger)}.qz-settings-disclosure{border-top:1px solid var(--qz-border);font-size:13px}.qz-settings-disclosure>summary{padding-block:8px;font-weight:650;cursor:pointer}.qz-column-list{display:grid;gap:8px;padding:0;list-style:none}.qz-column-row{display:flex;flex-wrap:wrap;align-items:end;gap:6px 10px}.qz-column-row .qz-field{flex:1 1 140px}.qz-column-row .qz-field>span{overflow-wrap:anywhere}.qz-column-row .qz-input,.qz-agent-prompt{width:100%}';
function zt() {
  const [e, t] = T(!1), [n, r] = T(null);
  return { busy: e, failure: n, run: async (i) => {
    t(!0), r(null);
    try {
      return await i(), !0;
    } catch (s) {
      return r(xe(s)), !1;
    } finally {
      t(!1);
    }
  } };
}
function Ul(e) {
  const { api: t } = e, [n, r] = T(null), [a, i] = T(null), [s, o] = T(null), [l, c] = T(0), [d, p] = T(""), [f, g] = T(""), { busy: h, failure: w, run: x } = zt();
  pe(() => {
    let b = !1;
    return Promise.all([sa(t), vt(t)]).then(([_, y]) => {
      b || (r(_), o(y.writeBlocked ?? null), i(null));
    }).catch((_) => !b && i(xe(_))), () => {
      b = !0;
    };
  }, [t, l]);
  const v = async () => {
    await x(() => oa(t, d.trim(), f.trim() || void 0)) && (p(""), g(""), c((b) => b + 1));
  };
  return /* @__PURE__ */ m("div", { className: "qz-settings", children: [
    /* @__PURE__ */ u("style", { children: $l }),
    /* @__PURE__ */ m("header", { children: [
      /* @__PURE__ */ u("h2", { className: "qz-section-title", children: "Settings" }),
      /* @__PURE__ */ u("p", { className: "qz-section-description", children: "Manage connected folders and board columns, or start a notes request in KiroCrew." })
    ] }),
    /* @__PURE__ */ u(he, { failure: a }),
    /* @__PURE__ */ u(he, { failure: s }),
    /* @__PURE__ */ m("div", { className: "qz-settings-grid", children: [
      /* @__PURE__ */ m("section", { className: "qz-settings-folders", "aria-labelledby": "qz-settings-folders", children: [
        /* @__PURE__ */ m("div", { className: "qz-settings-heading", children: [
          /* @__PURE__ */ u("h3", { id: "qz-settings-folders", children: "Connected folders" }),
          n && /* @__PURE__ */ u("span", { className: "qz-settings-count", children: n.length })
        ] }),
        !n && !a && /* @__PURE__ */ u("p", { className: "qz-muted", role: "status", children: "Loading folders…" }),
        (n == null ? void 0 : n.length) === 0 && /* @__PURE__ */ u("p", { className: "qz-empty", children: "Add a folder to see its notes, tickets, and TODOs." }),
        n == null ? void 0 : n.map((b) => /* @__PURE__ */ u(
          Pl,
          {
            api: t,
            workspace: b,
            writeBlocked: s,
            onChanged: () => c((_) => _ + 1),
            onColumnsSaved: (_) => r((y) => (y == null ? void 0 : y.map((R) => R.id === _.id ? { ...R, ..._ } : R)) ?? null)
          },
          b.id
        ))
      ] }),
      /* @__PURE__ */ m(
        "form",
        {
          className: "qz-panel-surface qz-settings-add",
          "aria-labelledby": "qz-settings-add",
          "aria-busy": h,
          onSubmit: (b) => {
            b.preventDefault(), d.trim() && !h && v();
          },
          children: [
            /* @__PURE__ */ m("div", { children: [
              /* @__PURE__ */ u("h3", { id: "qz-settings-add", children: "Add a folder" }),
              /* @__PURE__ */ u("p", { className: "qz-muted", children: "Use any local folder of Markdown files. To use the same files in Kiro Notes, attach the folder there separately." })
            ] }),
            /* @__PURE__ */ m("label", { className: "qz-field", children: [
              "Absolute folder path",
              /* @__PURE__ */ u("input", { className: "qz-input", placeholder: "/home/you/notes", value: d, onChange: (b) => p(b.target.value) })
            ] }),
            /* @__PURE__ */ m("label", { className: "qz-field", children: [
              /* @__PURE__ */ m("span", { children: [
                "Name ",
                /* @__PURE__ */ u("span", { className: "qz-muted", children: "(optional)" })
              ] }),
              /* @__PURE__ */ u("input", { className: "qz-input", placeholder: "e.g. Project notes", value: f, onChange: (b) => g(b.target.value) })
            ] }),
            /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "primary", type: "submit", disabled: h || !d.trim(), children: "Add folder" }),
            /* @__PURE__ */ u(he, { failure: w })
          ]
        }
      )
    ] })
  ] });
}
function Pl(e) {
  const { api: t, workspace: n } = e, { busy: r, failure: a, run: i } = zt(), [s, o] = T(null), [l, c] = T(!1);
  return pe(() => {
    if (!s) return;
    const d = setTimeout(() => o(null), 3e3);
    return () => clearTimeout(d);
  }, [s]), /* @__PURE__ */ m("section", { "aria-label": n.name, className: "qz-panel-surface qz-settings-folder", children: [
    /* @__PURE__ */ m("div", { className: "qz-settings-folder-identity", children: [
      /* @__PURE__ */ u("span", { className: "qz-settings-folder-icon", children: /* @__PURE__ */ u(Q, { name: "folder" }) }),
      /* @__PURE__ */ m("div", { children: [
        /* @__PURE__ */ u("h4", { children: n.name }),
        /* @__PURE__ */ u("code", { className: "qz-mono qz-muted", children: n.path })
      ] })
    ] }),
    /* @__PURE__ */ m("div", { className: "qz-settings-folder-controls", children: [
      /* @__PURE__ */ m("label", { className: "qz-settings-check", children: [
        /* @__PURE__ */ u(
          "input",
          {
            className: "qz-settings-toggle",
            type: "checkbox",
            checked: !!n.companion,
            disabled: r,
            onChange: () => void i(() => ua(t, n.id, !n.companion)).then((d) => d && e.onChanged())
          }
        ),
        "Show in Quartizo"
      ] }),
      /* @__PURE__ */ m("div", { className: "qz-settings-actions", children: [
        n.companion && /* @__PURE__ */ u(
          "button",
          {
            className: "qz-button",
            "data-variant": "quiet",
            type: "button",
            onClick: () => void i(() => Wt(t, { workspaceId: n.id, manual: !0, rebuild: !0 })).then(
              (d) => d && o("Rebuild requested.")
            ),
            disabled: r,
            children: "Rebuild index"
          }
        ),
        !l && /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "quiet", type: "button", onClick: () => c(!0), disabled: r, children: "Remove…" })
      ] })
    ] }),
    n.companion && /* @__PURE__ */ u(jl, { api: t, workspace: n, onSaved: e.onColumnsSaved }),
    /* @__PURE__ */ u(Jl, { workspace: n }),
    !!n.oldTasks && /* @__PURE__ */ u(Wl, { api: t, workspace: n, writeBlocked: e.writeBlocked, onChanged: e.onChanged }),
    l && /* @__PURE__ */ m("div", { role: "alertdialog", "aria-label": "Remove folder", className: "qz-notice qz-settings-notice", children: [
      /* @__PURE__ */ m("p", { children: [
        "Stop showing “",
        n.name,
        "” in Quartizo? Your folder and files stay on disk.",
        !!n.oldTasks && ` Removing this folder also deletes its ${n.oldTasks} saved task(s) from the old Quartizo board.`
      ] }),
      /* @__PURE__ */ m("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ u(
          "button",
          {
            className: "qz-button",
            "data-destructive": !0,
            type: "button",
            onClick: () => void i(() => ca(t, n.id, !!n.oldTasks)).then((d) => d && e.onChanged()),
            disabled: r,
            children: n.oldTasks ? `Remove and delete ${n.oldTasks} task(s)` : "Remove"
          }
        ),
        /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "quiet", type: "button", onClick: () => c(!1), disabled: r, children: "Cancel" })
      ] })
    ] }),
    s && /* @__PURE__ */ u("span", { className: "qz-muted", role: "status", children: s }),
    /* @__PURE__ */ u(he, { failure: a })
  ] });
}
function jl({ api: e, workspace: t, onSaved: n }) {
  const [r, a] = T(null), [i, s] = T(""), [o, l] = T(null), [c, d] = T(""), { busy: p, failure: f, run: g } = zt(), h = (r == null ? void 0 : r.columns) ?? t.columns, w = o ?? i.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 32), x = h.length < 20 && !!i.trim() && /^[a-z][a-z0-9_]{0,31}$/.test(w) && w !== "repair" && !h.some((k) => k.id === w), v = t.columns.some((k) => !h.some((F) => F.id === k.id)), b = (k) => {
    a({ columns: k, version: (r == null ? void 0 : r.version) ?? t.columnsVersion }), d("");
  }, _ = (k, F) => {
    const z = [...h], [A] = z.splice(k, 1);
    z.splice(k + F, 0, A), b(z);
  }, y = () => g(async () => {
    if (!r) return;
    const k = await la(e, t.id, h, r.version);
    n(k), a(null), d("Board columns saved.");
  }), R = JSON.stringify(h) !== JSON.stringify(t.columns);
  return /* @__PURE__ */ u(ye, { children: /* @__PURE__ */ m("details", { className: "qz-settings-disclosure", children: [
    /* @__PURE__ */ u("summary", { children: "Board columns" }),
    /* @__PURE__ */ m("div", { className: "qz-stack", children: [
      /* @__PURE__ */ u("p", { className: "qz-muted", children: "Rename, reorder, add, or remove columns for this folder. The first column is the default for new tickets." }),
      /* @__PURE__ */ u("ul", { className: "qz-column-list", children: h.map((k, F) => /* @__PURE__ */ m("li", { className: "qz-column-row", children: [
        /* @__PURE__ */ m("label", { className: "qz-field", children: [
          /* @__PURE__ */ u("span", { className: "qz-mono", children: k.id }),
          /* @__PURE__ */ u(
            "input",
            {
              className: "qz-input",
              "aria-label": `Name for ${k.id}`,
              value: k.label,
              maxLength: 40,
              disabled: p,
              onChange: (z) => b(h.map((A) => A.id === k.id ? { ...A, label: z.target.value } : A))
            }
          )
        ] }),
        /* @__PURE__ */ m("div", { className: "qz-settings-actions", children: [
          /* @__PURE__ */ u("button", { className: "qz-button", type: "button", "aria-label": `Move column ${k.id} up`, disabled: p || F === 0, onClick: () => _(F, -1), children: /* @__PURE__ */ u(Q, { name: "up" }) }),
          /* @__PURE__ */ u("button", { className: "qz-button", type: "button", "aria-label": `Move column ${k.id} down`, disabled: p || F === h.length - 1, onClick: () => _(F, 1), children: /* @__PURE__ */ u(Q, { name: "down" }) }),
          /* @__PURE__ */ u("button", { className: "qz-button", type: "button", "aria-label": `Remove column ${k.id}`, disabled: p || h.length === 1, onClick: () => b(h.filter((z) => z.id !== k.id)), children: "Remove" })
        ] })
      ] }, k.id)) }),
      h.length < 20 && /* @__PURE__ */ m("form", { className: "qz-column-row", onSubmit: (k) => {
        k.preventDefault(), !(p || !x) && (b([...h, { id: w, label: i.trim() }]), s(""), l(null));
      }, children: [
        /* @__PURE__ */ m("label", { className: "qz-field", children: [
          "New column name",
          /* @__PURE__ */ u("input", { className: "qz-input", value: i, maxLength: 40, disabled: p, onChange: (k) => s(k.target.value) })
        ] }),
        /* @__PURE__ */ m("label", { className: "qz-field", children: [
          "New status ID",
          /* @__PURE__ */ u("input", { className: "qz-input qz-mono", value: w, maxLength: 32, disabled: p, onChange: (k) => l(k.target.value) })
        ] }),
        /* @__PURE__ */ u("button", { className: "qz-button", type: "submit", disabled: p || !x, children: "Add column" })
      ] }),
      /* @__PURE__ */ u("p", { className: "qz-muted", children: "Status IDs are saved in notes. Use a unique ID starting with a lowercase letter, followed by lowercase letters, digits, or underscores." }),
      v && /* @__PURE__ */ u("p", { className: "qz-notice", children: "Tickets in removed columns will appear in Needs repair until you move them or restore the column with the same status ID." }),
      /* @__PURE__ */ m("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "primary", type: "button", disabled: p || !R || h.some((k) => !k.label.trim()), onClick: () => void y(), children: "Save columns" }),
        R && /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: p, onClick: () => {
          a(null), d("");
        }, children: "Discard changes" }),
        /* @__PURE__ */ u("span", { className: "qz-muted", role: "status", children: c })
      ] }),
      /* @__PURE__ */ u(he, { failure: f })
    ] })
  ] }) });
}
function Jl({ workspace: e }) {
  const { openChat: t } = ea(), n = Ll(e.path, e.columns), r = de(null), [a, i] = T(""), s = async () => {
    var o, l;
    try {
      await navigator.clipboard.writeText(n), i("Agent prompt copied.");
    } catch {
      (o = r.current) == null || o.focus(), (l = r.current) == null || l.select(), i("Copy the selected text to use the prompt.");
    }
  };
  return /* @__PURE__ */ m("div", { className: "qz-stack", children: [
    /* @__PURE__ */ u("div", { className: "qz-settings-actions", children: /* @__PURE__ */ m(
      "button",
      {
        type: "button",
        className: "qz-button",
        "data-variant": "primary",
        disabled: !e.companion,
        onClick: () => t({ message: n, autoSend: !1 }),
        children: [
          /* @__PURE__ */ u(Q, { name: "external" }),
          "Ask a Bot or agent"
        ]
      }
    ) }),
    e.companion ? /* @__PURE__ */ m("details", { className: "qz-settings-disclosure", children: [
      /* @__PURE__ */ u("summary", { children: "Agent instructions" }),
      /* @__PURE__ */ m("div", { className: "qz-stack", children: [
        /* @__PURE__ */ u("p", { className: "qz-muted", children: "Pick a Bot or agent in the KiroCrew chat composer, then add your request and send it. The agent needs access to this folder." }),
        /* @__PURE__ */ u("textarea", { ref: r, className: "qz-input qz-mono qz-agent-prompt", "aria-label": "Agent prompt", value: n, rows: 8, readOnly: !0 }),
        /* @__PURE__ */ m("div", { className: "qz-settings-actions", children: [
          /* @__PURE__ */ m("button", { type: "button", className: "qz-button", onClick: () => void s(), children: [
            /* @__PURE__ */ u(Q, { name: "copy" }),
            "Copy agent prompt"
          ] }),
          /* @__PURE__ */ u("span", { className: "qz-muted", role: "status", children: a })
        ] })
      ] })
    ] }) : /* @__PURE__ */ u("p", { className: "qz-muted", children: "Turn on Show in Quartizo to ask a Bot about this folder." })
  ] });
}
function Wl({ api: e, workspace: t, writeBlocked: n, onChanged: r }) {
  const [a, i] = T(null), [s, o] = T(null), [l, c] = T(!1), [d, p] = T(!1), { busy: f, failure: g, run: h } = zt(), w = async () => {
    const v = await Aa(e, t.id), b = URL.createObjectURL(new Blob([JSON.stringify(v, null, 2)], { type: "application/json" })), _ = document.createElement("a");
    _.href = b, _.download = `quartizo-old-tasks-${t.id}.json`, _.click(), setTimeout(() => URL.revokeObjectURL(b), 1e3), c(!0);
  }, x = async () => {
    if (!a) return;
    const v = await Ca(e, t.id, a.planHash, d);
    o(v), i(null), r();
  };
  return /* @__PURE__ */ m("section", { className: "qz-settings-migration", "aria-label": `Old tasks in ${t.name}`, children: [
    /* @__PURE__ */ u("strong", { children: "Old task migration" }),
    /* @__PURE__ */ m("p", { className: "qz-muted", children: [
      "Convert ",
      t.oldTasks,
      " saved ",
      t.oldTasks === 1 ? "task" : "tasks",
      " from the old board into Markdown ticket notes."
    ] }),
    /* @__PURE__ */ m("div", { className: "qz-settings-actions", children: [
      /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: f, onClick: () => void h(w), children: "Export old tasks" }),
      /* @__PURE__ */ u("button", { className: "qz-button", type: "button", disabled: f || !t.companion, onClick: () => void h(async () => {
        i(await qa(e, t.id)), o(null), p(!1);
      }), children: "Preview migration" })
    ] }),
    l && /* @__PURE__ */ u("span", { className: "qz-muted", role: "status", children: "Export downloaded." }),
    a && /* @__PURE__ */ m("div", { role: "alertdialog", "aria-label": "Confirm old task migration", className: "qz-notice qz-settings-notice", children: [
      /* @__PURE__ */ m("strong", { children: [
        "Create ",
        a.tasks.filter((v) => !v.migrated).length,
        " ticket note(s)"
      ] }),
      /* @__PURE__ */ u("p", { children: "Quartizo backs up the database tasks before writing each ticket to a new file." }),
      a.warnings.map((v, b) => /* @__PURE__ */ u("p", { children: v }, b)),
      /* @__PURE__ */ u("ul", { className: "qz-settings-migration-files", children: a.tasks.map((v) => /* @__PURE__ */ m("li", { children: [
        v.title,
        " → ",
        /* @__PURE__ */ u("code", { children: v.path }),
        " (",
        v.status,
        ")",
        v.migrated && " · already migrated",
        v.noteRef && /* @__PURE__ */ m("span", { children: [
          " · linked note: ",
          v.noteRef
        ] }),
        v.slotId && /* @__PURE__ */ m("span", { children: [
          " · session: ",
          v.slotId
        ] })
      ] }, v.uid)) }),
      a.tasks.some((v) => v.changed) && !a.complete && /* @__PURE__ */ m("label", { className: "qz-settings-check", children: [
        /* @__PURE__ */ u("input", { type: "checkbox", checked: d, onChange: (v) => p(v.target.checked), disabled: f }),
        "I reviewed the changed converted notes; keep their latest contents when resuming"
      ] }),
      /* @__PURE__ */ m("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "primary", type: "button", disabled: f || !!n || a.complete || !a.tasks.length, onClick: () => void h(x), children: a.backup ? "Resume and verify migration" : "Back up and migrate" }),
        /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: f, onClick: () => i(null), children: "Cancel" })
      ] })
    ] }),
    s && /* @__PURE__ */ m("div", { className: "qz-settings-notice qz-settings-result", role: "status", children: [
      /* @__PURE__ */ m("p", { children: [
        s.migrated.length,
        " ticket note(s) migrated. ",
        s.complete ? "Migration verified." : `${s.remaining} task(s) remain; preview again to continue.`
      ] }),
      /* @__PURE__ */ m("code", { className: "qz-mono qz-muted", children: [
        "Backup: ",
        s.backup.directory
      ] })
    ] }),
    /* @__PURE__ */ u(he, { failure: g })
  ] });
}
const Zl = ".qz-app{--qz-canvas: var(--bg, Canvas);--qz-surface: var(--card, Canvas);--qz-elevated: var(--bg-elevated, Canvas);--qz-border: var(--border, color-mix(in srgb, CanvasText 18%, Canvas));--qz-text: var(--text-strong, CanvasText);--qz-muted: color-mix(in srgb, var(--muted, CanvasText) 87%, var(--qz-text));--qz-accent: var(--accent, LinkText);--qz-accent-soft: var(--accent-subtle, color-mix(in srgb, var(--qz-accent) 13%, transparent));--qz-ok: var(--ok, #4e9a6b);--qz-warning: var(--warn, #ad7628);--qz-danger: var(--danger, #c7465d);--qz-info: var(--info, var(--qz-accent));container:qz-app / inline-size;width:100%;max-width:1560px;min-width:0;margin-inline:auto;padding:24px clamp(16px,3%,40px) 36px;color:var(--qz-text)}.qz-app,.qz-app *{box-sizing:border-box}.qz-app [hidden]{display:none!important}.qz-app :where(h1,h2,h3,p,ul){margin:0}.qz-app :where(button,input,textarea,select){font:inherit}.qz-app :is(button,summary,input,textarea,select,.qz-board):focus-visible{outline:2px solid var(--qz-accent);outline-offset:2px}.qz-app :is(button,input,textarea,select):disabled{opacity:.55;cursor:default}.qz-app input[type=checkbox]{accent-color:var(--qz-accent)}.qz-icon{width:1rem;height:1rem;flex:none}.qz-header,.qz-brand,.qz-tabs,.qz-view-heading,.qz-toolbar,.qz-actions,.qz-inline-field{display:flex;align-items:center;min-width:0}.qz-header,.qz-view-heading,.qz-toolbar{justify-content:space-between;flex-wrap:wrap;gap:12px 20px}.qz-header{padding:0 0 20px;border-bottom:1px solid var(--qz-border)}.qz-brand{gap:12px}.qz-mark{display:grid;place-items:center;flex:none;width:46px;height:46px;border:1px solid color-mix(in srgb,var(--qz-accent) 34%,var(--qz-border));border-radius:13px;background:linear-gradient(145deg,var(--qz-accent-soft),var(--qz-surface));color:var(--qz-accent)}.qz-mark .qz-icon{width:26px;height:26px}.qz-brand h1{font-size:24px;font-weight:700;letter-spacing:-.035em;line-height:1.1}.qz-brand p{margin-top:3px;color:var(--qz-muted);font-size:12px}.qz-tabs{max-width:100%;gap:3px;padding:4px;border:1px solid var(--qz-border);border-radius:12px;background:var(--qz-surface)}.qz-tabs button{display:flex;align-items:center;justify-content:center;gap:7px;min-height:36px;padding:6px 12px;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--qz-muted);font-size:13px;font-weight:600;cursor:pointer}.qz-tabs button:hover{color:var(--qz-text);background:var(--qz-elevated)}.qz-tabs button[aria-selected=true]{border-color:color-mix(in srgb,var(--qz-accent) 25%,var(--qz-border));background:var(--qz-accent-soft);color:var(--qz-text)}.qz-tabs button[aria-selected=true] .qz-icon{color:var(--qz-accent)}.qz-content{padding-top:24px}.qz-stack{display:grid;gap:14px;min-width:0}.qz-section-title{font-size:27px;font-weight:700;letter-spacing:-.032em;line-height:1.17}.qz-section-description{margin-top:5px;color:var(--qz-muted)}.qz-muted{color:var(--qz-muted);font-weight:400}.qz-mono{font:400 12px/1.5 var(--mono, ui-monospace, monospace)}.qz-path{display:block;min-width:0;overflow:hidden;color:var(--qz-muted);text-overflow:ellipsis;white-space:nowrap}.qz-actions{gap:6px;flex-wrap:wrap}.qz-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;max-width:100%;min-height:36px;padding:5px 11px;border:1px solid var(--qz-border);border-radius:8px;background:var(--qz-surface);color:var(--qz-text);font-size:13px;font-weight:600;text-align:center;cursor:pointer}.qz-button:not(:disabled):hover{background:var(--qz-elevated);border-color:var(--border-strong, var(--qz-muted))}.qz-button[data-variant=primary]{border-color:var(--qz-accent);background:var(--qz-accent);color:var(--accent-fg, var(--qz-canvas))}.qz-button[data-variant=primary]:not(:disabled):hover{border-color:var(--accent-hover, var(--qz-accent));background:var(--accent-hover, var(--qz-accent))}.qz-button[data-variant=quiet]{border-color:transparent;background:transparent;color:var(--qz-muted)}.qz-button[data-variant=quiet]:not(:disabled):hover{color:var(--qz-text)}.qz-icon-button{min-width:36px;padding-inline:8px}.qz-input{min-width:0;max-width:100%;min-height:36px;padding:6px 9px;border:1px solid var(--qz-border);border-radius:8px;background:var(--qz-elevated);color:var(--qz-text);font-size:13px}.qz-input::placeholder{color:var(--qz-muted);opacity:1}.qz-field{display:grid;gap:5px;min-width:0;font-size:13px;font-weight:600}.qz-field .qz-input{width:100%;font-weight:400}.qz-inline-field{gap:8px;color:var(--qz-muted);font-size:13px}.qz-inline-field .qz-input{max-width:min(36ch,52%);font-weight:600}.qz-check-label{display:flex;align-items:center;gap:8px}.qz-panel-surface{min-width:0;border:1px solid var(--qz-border);border-radius:12px;background:var(--qz-surface)}.qz-notice{padding:11px 13px;border:1px solid color-mix(in srgb,var(--qz-warning) 42%,var(--qz-border));border-radius:9px;background:color-mix(in srgb,var(--qz-warning) 7%,var(--qz-surface));font-size:13px;overflow-wrap:anywhere}.qz-notice[data-variant=neutral]{border-color:var(--qz-border);background:var(--qz-surface)}.qz-notice.qz-error{border-color:color-mix(in srgb,var(--qz-danger) 53%,var(--qz-border));background:color-mix(in srgb,var(--qz-danger) 9%,var(--qz-surface))}.qz-empty{display:grid;place-items:center;gap:8px;padding:28px 16px;border:1px dashed var(--qz-border);border-radius:12px;color:var(--qz-muted);text-align:center}.qz-empty :is(h2,h3){color:var(--qz-text);font-size:17px;font-weight:650}.qz-empty .qz-button{margin-top:4px}.qz-empty-icon,.qz-note-icon{display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:9px;background:var(--qz-accent-soft);color:var(--qz-accent)}.qz-visually-hidden{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.qz-board-meta{gap:2px 12px;padding-block:2px}.qz-board-meta>.qz-actions{margin-inline-start:auto}.qz-result-count{color:var(--qz-muted);font-size:12px;font-weight:600}.qz-index{display:inline-flex;align-items:baseline;gap:7px;color:var(--qz-muted);font-size:12px}.qz-index:empty{display:none}.qz-board{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(172px,1fr);gap:10px;min-width:0;padding:2px 2px 10px;overflow-x:auto;overscroll-behavior-inline:contain}.qz-lane{--qz-status: var(--qz-muted);min-width:0;min-height:308px;padding:9px;border:1px solid color-mix(in srgb,var(--qz-status) 20%,var(--qz-border));border-radius:12px;background:linear-gradient(180deg,color-mix(in srgb,var(--qz-status) 7%,var(--qz-surface)),var(--qz-surface) 105px)}.qz-app [data-lane-status=ready]{--qz-status: var(--qz-info)}.qz-app [data-lane-status=in_progress]{--qz-status: var(--qz-accent)}.qz-app [data-lane-status=review]{--qz-status: var(--qz-warning)}.qz-app [data-lane-status=done]{--qz-status: var(--qz-ok)}.qz-app [data-lane-status=repair]{--qz-status: var(--qz-danger)}.qz-lane-heading{display:flex;align-items:center;gap:7px;padding:3px 2px 10px;font-size:13px;font-weight:650;overflow-wrap:anywhere}.qz-dot{width:8px;height:8px;flex:none;border-radius:50%;background:var(--qz-status, var(--qz-ok))}.qz-dot[data-attention=true]{background:var(--qz-warning)}.qz-count{margin-inline-start:auto;padding:1px 6px;border:1px solid var(--qz-border);border-radius:999px;color:var(--qz-muted);font-size:11px;font-variant-numeric:tabular-nums}.qz-lane-empty{padding:11px;border:1px dashed var(--qz-border);border-radius:8px;color:var(--qz-muted);font-size:12px;text-align:center}.qz-cards,.qz-todo-list{list-style:none;padding:0}.qz-cards{display:grid;gap:8px}.qz-cards li{min-width:0}.qz-cards li[draggable=true]{cursor:grab}.qz-cards li[draggable=true]:active{cursor:grabbing}.qz-ticket{border:1px solid var(--qz-border);border-radius:9px;background:var(--qz-elevated);box-shadow:var(--shadow-sm, none)}.qz-ticket:hover,.qz-ticket:focus-within{border-color:var(--border-strong, var(--qz-muted))}.qz-ticket-content{display:grid;gap:5px;padding:10px 10px 8px}.qz-note-link{display:flex;align-items:start;justify-content:space-between;gap:6px;padding:0;border:0;background:transparent;color:var(--qz-text);font-size:14px;font-weight:650;line-height:1.4;text-align:start;overflow-wrap:anywhere;cursor:pointer}.qz-note-link .qz-icon{width:13px;height:13px;margin-top:3px;color:var(--qz-muted)}.qz-note-link:hover{text-decoration:underline}.qz-ticket-progress{display:flex;align-items:center;gap:8px;margin-top:3px;color:var(--qz-muted);font-size:11px;font-variant-numeric:tabular-nums}.qz-ticket-progress progress{width:min(54px,40%);height:5px;accent-color:var(--qz-ok);border:0;border-radius:6px;overflow:hidden}.qz-ticket-progress progress::-webkit-progress-bar{background:var(--qz-border)}.qz-ticket-progress progress::-webkit-progress-value{border-radius:6px;background:var(--qz-ok)}.qz-badge{padding:2px 5px;border-radius:5px;background:color-mix(in srgb,var(--qz-warning) 17%,var(--qz-surface));font-size:11px;overflow-wrap:anywhere}.qz-ticket-footer{position:relative;padding:5px;border-top:1px solid var(--qz-border)}.qz-ticket-status{padding-inline-end:39px}.qz-ticket-status .qz-input{width:100%;min-height:32px;padding:3px 4px;border-color:transparent;background:transparent;color:var(--qz-muted)}.qz-ticket-status .qz-input:not(:disabled):hover{background:var(--qz-surface);border-color:var(--qz-border)}.qz-ticket-actions summary{position:absolute;inset-block-start:5px;inset-inline-end:5px;min-height:32px;list-style:none}.qz-ticket-actions summary::-webkit-details-marker{display:none}.qz-ticket-action-list{display:grid;gap:1px;margin-top:5px;padding-top:5px;border-top:1px solid var(--qz-border)}.qz-ticket-action-list .qz-button{justify-content:start;min-height:32px;text-align:start}.qz-ticket-action-list .qz-destructive:not(:disabled){color:var(--qz-danger)}.qz-ticket-form{display:grid;gap:12px;max-width:630px;padding:16px}.qz-ticket-form h3{font-size:17px;font-weight:650}.qz-note-preview{max-height:180px;margin:0;padding:10px;overflow:auto;background:var(--qz-canvas);white-space:pre-wrap;overflow-wrap:anywhere}.qz-todos{width:100%;max-width:1100px;margin-inline:auto}.qz-todo-filters{display:flex;flex-wrap:wrap;gap:12px;padding:12px}.qz-todo-filters .qz-field{flex:1 1 135px}.qz-todo-filters .qz-field:first-child{flex:3 1 245px}.qz-search{position:relative;display:block}.qz-search .qz-icon{position:absolute;inset-block-start:10px;inset-inline-start:9px;color:var(--qz-muted);pointer-events:none}.qz-search .qz-input{padding-inline-start:32px}.qz-todo-header{display:flex;align-items:center;gap:10px;min-width:0;padding:12px 14px}.qz-todo-identity{flex:1;min-width:0}.qz-todo-identity h3{display:flex;align-items:center;flex-wrap:wrap;gap:5px 9px;font-size:15px;font-weight:650;overflow-wrap:anywhere}.qz-todo-meta{display:flex;align-items:baseline;gap:6px;color:var(--qz-muted);font-size:12px}.qz-todo-meta>span:first-child{min-width:0;overflow-wrap:anywhere}.qz-status-pill{--qz-status: var(--qz-muted);display:inline-flex;align-items:center;gap:5px;padding:1px 7px;border-radius:999px;background:color-mix(in srgb,var(--qz-status) 13%,var(--qz-surface));font-size:11px;font-weight:500}.qz-status-pill .qz-dot{width:6px;height:6px}.qz-todo-row{display:flex;align-items:center;border-top:1px solid var(--qz-border)}.qz-todo-row:hover,.qz-todo-row:focus-within{background:var(--qz-elevated)}.qz-todo-row:last-child{border-radius:0 0 12px 12px}.qz-todo-check{display:flex;align-items:baseline;gap:10px;flex:1;min-width:0;padding:10px 14px;overflow-wrap:anywhere;cursor:pointer}.qz-todo-check input{flex:none;align-self:start;width:16px;height:16px;margin:2px 0 0}.qz-todo-check:has(input:disabled){cursor:default}.qz-todo-row[data-checked=true] .qz-todo-check span{color:var(--qz-muted);text-decoration:line-through}.qz-todo-row>.qz-button{margin-inline-end:6px}@container qz-app (max-width: 650px){.qz-board{grid-auto-columns:clamp(170px,65cqi,244px)}}@container qz-app (max-width: 520px){.qz-header{gap:14px;padding-bottom:14px}.qz-tabs{width:100%}.qz-tabs button{flex:1;gap:5px;padding-inline:5px}.qz-content{padding-top:18px}.qz-section-title{font-size:24px}.qz-inline-field{width:100%}.qz-inline-field .qz-input{flex:1;max-width:none}.qz-board-meta>.qz-actions{margin-inline-start:0}.qz-todo-filters .qz-field:first-child{flex-basis:100%}.qz-todo-header{padding-inline:10px}.qz-todo-header .qz-note-icon{display:none}}@media (pointer: coarse){.qz-app :is(.qz-button,.qz-tabs button,.qz-input,.qz-ticket-status .qz-input,.qz-ticket-actions summary){min-height:42px}}@container qz-app (max-width: 360px){.qz-tabs .qz-icon{display:none}}", Ie = [
  { id: "tasks", label: "Tasks", icon: "board" },
  { id: "todos", label: "TODOs", icon: "checklist" },
  { id: "notes", label: "Notes", icon: "note" },
  { id: "settings", label: "Settings", icon: "settings" }
];
function Xl() {
  const e = ta(), [t, n] = T("tasks"), [r, a] = T(null), i = de(null), s = (c) => {
    var f;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(c.key)) return;
    c.preventDefault();
    const d = Ie.findIndex((g) => g.id === t), p = c.key === "Home" ? Ie[0] : c.key === "End" ? Ie[Ie.length - 1] : Ie[(d + (c.key === "ArrowRight" ? 1 : Ie.length - 1)) % Ie.length];
    n(p.id), (f = c.currentTarget.querySelector(`#qz-tab-${p.id}`)) == null || f.focus();
  }, o = () => {
    var c, d;
    n("settings"), (d = (c = i.current) == null ? void 0 : c.querySelector("#qz-tab-settings")) == null || d.focus();
  }, l = (c) => {
    var d, p;
    a(c), n("notes"), (p = (d = i.current) == null ? void 0 : d.querySelector("#qz-tab-notes")) == null || p.focus();
  };
  return /* @__PURE__ */ m("div", { className: "qz-app", children: [
    /* @__PURE__ */ u("style", { children: Zl }),
    /* @__PURE__ */ m("header", { className: "qz-header", children: [
      /* @__PURE__ */ m("div", { className: "qz-brand", children: [
        /* @__PURE__ */ u("span", { className: "qz-mark", children: /* @__PURE__ */ u(Q, { name: "gem" }) }),
        /* @__PURE__ */ m("div", { children: [
          /* @__PURE__ */ u("h1", { children: "Quartizo" }),
          /* @__PURE__ */ u("p", { children: "Notes, tasks, and TODOs" })
        ] })
      ] }),
      /* @__PURE__ */ u("div", { className: "qz-tabs", ref: i, role: "tablist", "aria-label": "Quartizo", onKeyDown: s, children: Ie.map((c) => /* @__PURE__ */ m(
        "button",
        {
          id: `qz-tab-${c.id}`,
          type: "button",
          role: "tab",
          "aria-selected": t === c.id,
          "aria-controls": "qz-panel",
          tabIndex: t === c.id ? 0 : -1,
          onClick: () => n(c.id),
          children: [
            /* @__PURE__ */ u(Q, { name: c.icon }),
            c.label
          ]
        },
        c.id
      )) })
    ] }),
    /* @__PURE__ */ m("div", { className: "qz-content", id: "qz-panel", role: "tabpanel", "aria-labelledby": `qz-tab-${t}`, children: [
      /* @__PURE__ */ u("div", { hidden: t !== "tasks", children: /* @__PURE__ */ u(Ma, { api: e, active: t === "tasks", onSettings: o, onOpenNote: l }) }),
      t === "todos" && /* @__PURE__ */ u(La, { api: e, onSettings: o, onOpenNote: l }),
      /* @__PURE__ */ u("div", { className: "qz-notes-tab", hidden: t !== "notes", children: /* @__PURE__ */ u(Bl, { api: e, active: t === "notes", request: r, onSettings: o }) }),
      t === "settings" && /* @__PURE__ */ u(Ul, { api: e })
    ] })
  ] });
}
export {
  Xl as default
};
