import { jsx as u, jsxs as m, Fragment as ye } from "react/jsx-runtime";
import { useNavigate as jn, useChatLauncher as Qr, useAppApi as ea } from "@kirocrew/app-sdk";
import { useState as T, useEffect as he, useRef as fe, useMemo as Ze, useCallback as Mt, useDeferredValue as ta, useLayoutEffect as na } from "react";
import { SegmentedControl as ra } from "@kirocrew/app-sdk/ui";
const Pe = "/apps/quartizo/api", aa = 15e3, Jn = { id: "repair", label: "Needs repair" };
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
function we(e, t = aa) {
  let n;
  const r = new Promise((a, i) => {
    n = setTimeout(() => i(new Error(`request timed out after ${Math.round(t / 1e3)} s`)), t);
  });
  return Promise.race([e, r]).finally(() => clearTimeout(n));
}
function Ut(e) {
  const t = Object.entries(e).filter((n) => n[1] !== void 0 && n[1] !== "").map(([n, r]) => `${encodeURIComponent(n)}=${encodeURIComponent(r)}`);
  return t.length ? `?${t.join("&")}` : "";
}
async function ia(e) {
  return (await e.get(`${Pe}/workspaces`)).workspaces;
}
async function sa(e, t, n) {
  return (await e.post(`${Pe}/workspaces`, n ? { path: t, name: n, companion: !0 } : { path: t, companion: !0 })).workspace;
}
async function oa(e, t, n, r) {
  return (await e.put(me(t, "columns"), { columns: n, columnsVersion: r })).workspace;
}
async function la(e, t, n = !1) {
  await e.del(`${Pe}/workspaces/${t}${n ? "?deleteOldTasks=1" : ""}`);
}
const Pt = `${Pe}/companion`;
function mt(e) {
  return e.get(Pt);
}
function ca(e, t, n) {
  return e.put(`${Pe}/workspaces/${t}/companion`, { enabled: n });
}
function jt(e, t = {}) {
  const n = {};
  return t.workspaceId !== void 0 && (n.workspaceId = t.workspaceId), t.rebuild && (n.rebuild = !0), t.manual && (n.manual = !0), e.post(`${Pt}/refresh`, n);
}
function ua(e, t) {
  return e.get(`${Pe}/workspaces/${t}/board`);
}
function da(e, t, n) {
  return e.get(`${Pt}/todos${Ut({ workspace: n === void 0 ? void 0 : String(n), state: t })}`);
}
function ha(e, t) {
  const n = [], r = new Map(e.map((a) => [a.id, []]));
  r.set(Jn.id, n);
  for (const a of t) (r.get(a.lane) ?? n).push(a);
  return Object.fromEntries(r);
}
function Jt(e) {
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
function pa(e, t = Date.now()) {
  if (!e) return "";
  if (e.state === "scanning") {
    if (!e.progress) return "Scan queued…";
    const { notes: r, rebuild: a } = e.progress;
    return `Scanning… ${r} ${r === 1 ? "note" : "notes"} read${a ? " (rebuild)" : ""}`;
  }
  if (!e.indexedAt) return "";
  const n = e.files ?? 0;
  return `${n} ${n === 1 ? "note" : "notes"} indexed ${fa(e.indexedAt, t)}`;
}
function fa(e, t) {
  const n = Math.max(0, Math.round((t - e) / 1e3));
  if (n < 5) return "just now";
  if (n < 60) return `${n} s ago`;
  const r = Math.round(n / 60);
  return r < 60 ? `${r} min ago` : new Date(e).toLocaleString();
}
function ga(e, t) {
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
function me(e, t) {
  return `${Pe}/workspaces/${e}/${t}`;
}
function It(e, t, n) {
  return e.get(me(t, "source") + Ut({ path: n }));
}
function ma(e, t) {
  return e.get(me(t, "notes"));
}
function ba(e, t, n) {
  return e.get(me(t, "backlinks") + Ut({ path: n }));
}
function va(e, t, n) {
  return e.post(me(t, "notes"), { path: n });
}
function ka(e, t, n, r, a) {
  return e.put(me(t, "source"), { path: n, content: r, expectedHash: a });
}
function _a(e, t, n) {
  return e.post(me(t, "tickets"), n);
}
function xa(e, t, n, r) {
  return e.post(me(t, "tickets/promote"), { path: n.path, expectedHash: n.hash, ...r === void 0 ? {} : { status: r } });
}
function wa(e, t, n) {
  return e.post(me(t, "tickets/move"), n);
}
function za(e, t, n, r) {
  return e.post(me(t.workspaceId, "todos/toggle"), {
    path: t.path,
    expectedHash: t.hash,
    markerStart: n.markerStart,
    line: n.line,
    column: n.column,
    checked: r
  });
}
function ya(e, t, n, r = !1) {
  return e.post(me(t, "tickets/rebalance"), { status: n, confirm: !0, reconcile: r });
}
function De(e, t) {
  var n, r;
  return e != null && e.writeBlocked ? e.writeBlocked.message : e != null && e.migrationPending ? "Finish the old task migration in Settings before editing this workspace." : !e || e.state !== "ready" || e.complete !== !0 || e.retained || e.outdated || e.error ? "Wait for a complete, current index before editing. Refresh if needed." : t != null && t.status && ((n = e.maintenance) != null && n.includes(t.status)) ? "This column has unfinished order maintenance. Resume maintenance before moving cards." : t && (!t.hash || t.retained || (r = t.diagnostics) != null && r.some((a) => a.code !== "unconfigured_status")) ? "Repair or refresh this note before editing it." : null;
}
function Ra(e, t, n, r) {
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
function Ea(e, t) {
  return e.get(me(t, "migration"));
}
function qa(e, t, n, r = !1) {
  return e.post(me(t, "migration"), { planHash: n, confirm: !0, ...r ? { acceptCurrent: !0 } : {} });
}
function Ca(e, t) {
  return e.get(me(t, "legacy-tasks"));
}
function Aa(e, t, n) {
  return e.post(me(t, "tickets/demote"), { path: n.path, expectedHash: n.hash });
}
const Wn = "/md-notebook";
function Na(e) {
  return (e.split("/").pop() ?? e).replace(/\.md$/i, "");
}
const Da = {
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
      children: Da[e]
    }
  );
}
function de({ failure: e }) {
  return e ? /* @__PURE__ */ u("div", { role: "alert", className: "qz-notice qz-error", "data-code": e.code, children: e.message }) : null;
}
function ut() {
  try {
    return window.localStorage;
  } catch {
    return;
  }
}
function Zn() {
  const [e, t] = T(() => typeof document > "u" || document.visibilityState !== "hidden");
  return he(() => {
    const n = () => t(document.visibilityState !== "hidden");
    return document.addEventListener("visibilitychange", n), () => document.removeEventListener("visibilitychange", n);
  }, []), e;
}
const Sa = 1500, Ta = 3e3, Qt = "quartizo:workspace";
function Hn(e, t = !0) {
  const [n, r] = T(null), [a, i] = T(null);
  return he(() => {
    if (!t) return;
    let s = !1;
    return mt(e).then((o) => {
      s || (r(o.workspaces.filter((l) => l.workspace.companion)), i(o.available ? null : { message: o.error ?? "The Markdown index is unavailable." }));
    }).catch((o) => !s && i(xe(o))), () => {
      s = !0;
    };
  }, [e, t]), { companions: n, failure: a };
}
function Kn(e, t, n, r, a, i, s) {
  const o = Zn(), [l, c] = T(null), [d, p] = T(null), [g, f] = T(0), [h, w] = T(!1), _ = fe(a), v = fe(i), k = fe(s);
  _.current = a, v.current = i, k.current = s, he(() => {
    c(null), p(null);
  }, [n]), he(() => {
    if (!t || !o) return;
    let R = !1, b, M, x;
    const q = async () => {
      let L = !1;
      try {
        const U = await we(mt(e));
        if (R) return;
        if (!U.available) throw new Error(U.error ?? "The Markdown index is unavailable.");
        const O = U.workspaces.filter(({ workspace: C }) => C.companion), W = O.filter(({ workspace: C }) => r === void 0 || C.id === r), G = Object.fromEntries(W.map(({ workspace: C, index: A }) => [C.id, A]));
        L = W.some(({ index: C }) => C.state === "scanning");
        const te = JSON.stringify(O.map(({ workspace: C, index: A }) => [C.id, C.columnsVersion, A.indexedAt])), E = JSON.stringify(G);
        if (M !== te) {
          const C = await we(_.current());
          if (R) return;
          c(C), M = te, x = void 0;
        } else if (x !== E) {
          const C = k.current;
          c((A) => A && C(A, G)), x = E;
        }
        p(null), w(!1);
      } catch (U) {
        R || (p(xe(U)), w(!1));
      }
      R || (b = setTimeout(q, L ? Sa : Ta));
    };
    return q(), () => {
      R = !0, clearTimeout(b);
    };
  }, [t, e, o, n, g, r]);
  const z = Mt(async () => {
    w(!0);
    try {
      await we(v.current()), p(null), f((R) => R + 1);
    } catch (R) {
      p(xe(R));
    } finally {
      w(!1);
    }
  }, []), y = Mt(() => {
    w(!0), f((R) => R + 1);
  }, []);
  return { data: l, failure: d, busy: h, refresh: z, reload: y };
}
function Gn({ statuses: e }) {
  const t = Date.now(), n = e.map((r) => pa(r, t)).filter(Boolean);
  return /* @__PURE__ */ u("span", { className: "qz-index", role: "status", children: n.length > 0 && /* @__PURE__ */ m(ye, { children: [
    /* @__PURE__ */ u("span", { className: "qz-dot", "data-attention": e.some((r) => r.state === "scanning" || !!Jt(r)) }),
    n.join(" · ")
  ] }) });
}
function Yn({ statuses: e }) {
  const t = new Set(e.map(Jt).filter(Boolean));
  return /* @__PURE__ */ u(ye, { children: [...t].map((n) => /* @__PURE__ */ u("div", { role: "note", className: "qz-notice", children: n }, n)) });
}
function Xn({ path: e, compact: t = !1 }) {
  const n = Na(e), [r, a] = T("idle");
  he(() => {
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
function Fa(e) {
  var o, l;
  const t = e.active ?? !0, { companions: n, failure: r } = Hn(e.api, t), [a, i] = T(() => {
    var d;
    const c = Number((d = ut()) == null ? void 0 : d.getItem(Qt));
    return Number.isInteger(c) && c > 0 ? c : null;
  }), s = ((o = n == null ? void 0 : n.find((c) => c.workspace.id === a)) == null ? void 0 : o.workspace) ?? ((l = n == null ? void 0 : n[0]) == null ? void 0 : l.workspace) ?? null;
  return he(() => {
    var c;
    try {
      s && ((c = ut()) == null || c.setItem(Qt, String(s.id)));
    } catch {
    }
  }, [s]), r && !n ? /* @__PURE__ */ u(de, { failure: r }) : n ? s ? /* @__PURE__ */ m("div", { className: "qz-stack", children: [
    /* @__PURE__ */ u(de, { failure: r }),
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
      Ma,
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
function Wt(e) {
  const [t, n] = T(!1), [r, a] = T(null), i = fe(!0), s = fe(!1);
  return he(() => (i.current = !0, () => {
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
function Ma(e) {
  var P, ne, Z, be, ve, _e;
  const { api: t, workspace: n, active: r } = e, a = n.id, i = jn(), { data: s, failure: o, busy: l, refresh: c, reload: d } = Kn(
    t,
    r,
    String(a),
    a,
    () => ua(t, a),
    () => jt(t, { workspaceId: a, manual: !0 }),
    (F, le) => ({ ...F, index: le[String(a)] ?? F.index })
  ), p = Wt(d), g = (s == null ? void 0 : s.workspace.columns) ?? n.columns, f = Ze(() => ha(g, (s == null ? void 0 : s.tickets) ?? []), [g, s]), h = f.repair.length > 0 ? [...g, Jn] : g, w = fe(null), _ = fe(null), [v, k] = T(null), z = fe(null);
  he(() => {
    var F;
    v && ((F = z.current) == null || F.focus());
  }, [v]);
  const [y, R] = T(!1), b = !r || !!o || l || p.pending || y || !!De(s == null ? void 0 : s.index), [M, x] = T(""), q = ((P = g.find((F) => F.id === M)) == null ? void 0 : P.id) ?? ((ne = s == null ? void 0 : s.index.maintenance) == null ? void 0 : ne[0]) ?? g[0].id, [L, U] = T(!1), [O, W] = T(!1), [G, te] = T(!1), E = s ? [s.index] : [], C = Mt((F) => {
    x(F), te(!0);
  }, []), [A, $] = T(null);
  he(() => {
    var le;
    if (!A || b || !s) return;
    const F = Array.from(((le = w.current) == null ? void 0 : le.querySelectorAll("[data-note-path]")) ?? []).find((ce) => ce.dataset.notePath === A);
    F == null || F.focus(), $(null);
  }, [A, b, s]);
  const J = (F, le, ce) => {
    var I;
    b || De(s == null ? void 0 : s.index, F) || !s || (I = s.index.maintenance) != null && I.includes(le) || p.run(() => wa(t, a, Ra(s.tickets, F, le, ce))).then((ie) => {
      ie && $(F.path);
    });
  }, Y = (F, le, ce) => {
    F.preventDefault(), F.stopPropagation();
    const I = _.current;
    if (_.current = null, !I || (ce == null ? void 0 : ce.path) === I.path) return;
    const ie = f[le].filter((V) => V.path !== I.path), K = ce ? ie.findIndex((V) => V.path === ce.path) : void 0;
    K !== void 0 && K < 0 || J(I, le, K);
  }, oe = (F) => {
    var Fe, j;
    const le = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"], ce = F.target;
    if (!ce.hasAttribute("data-lane")) return;
    const I = Number(ce.dataset.lane), ie = Number(ce.dataset.index);
    if (!le.includes(F.key) || Number.isNaN(I) || Number.isNaN(ie)) return;
    let K = I, V = ie;
    if (F.key === "ArrowUp" && (V = Math.max(0, ie - 1)), F.key === "ArrowDown" && (V = ie + 1), F.key === "Home" && (V = 0), F.key === "End" && (V = Number.MAX_SAFE_INTEGER), F.key === "ArrowLeft" || F.key === "ArrowRight") {
      const N = F.key === "ArrowLeft" ? -1 : 1;
      do
        K += N;
      while (K >= 0 && K < h.length && f[h[K].id].length === 0);
      if (K < 0 || K >= h.length) return;
    }
    V = Math.min(V, f[h[K].id].length - 1), F.preventDefault(), (j = (Fe = w.current) == null ? void 0 : Fe.querySelector(`[data-lane="${K}"][data-index="${V}"]`)) == null || j.focus();
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
            onClick: () => k(v === "create" ? null : "create"),
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
            onClick: () => k(v === "promote" ? null : "promote"),
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
            "aria-expanded": G,
            onClick: () => te((F) => !F),
            disabled: b,
            children: "Rebalance…"
          }
        ),
        /* @__PURE__ */ m("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => i(Wn), children: [
          /* @__PURE__ */ u(Q, { name: "external" }),
          "Open Kiro Notes"
        ] })
      ] })
    ] }),
    ["create", "promote"].map((F) => /* @__PURE__ */ u("div", { hidden: v !== F, children: /* @__PURE__ */ u(Ia, { mode: F, api: t, workspace: n, columns: g, firstField: v === F ? z : void 0, disabled: !r || !!o || l || p.pending || !!De(s == null ? void 0 : s.index), maintenance: (s == null ? void 0 : s.index.maintenance) ?? [], onBusy: R, onChanged: d, onClose: () => k(null), onMaintenanceNeeded: C }) }, F)),
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
    /* @__PURE__ */ u(de, { failure: o }),
    /* @__PURE__ */ u(de, { failure: p.failure }),
    De(s == null ? void 0 : s.index) && s && /* @__PURE__ */ u("div", { role: "note", className: "qz-notice", children: De(s.index) }),
    G || ((Z = p.failure) == null ? void 0 : Z.code) === "rank_exhausted" || ((be = p.failure) == null ? void 0 : be.code) === "maintenance_pending" || (ve = s == null ? void 0 : s.index.maintenance) != null && ve.length ? /* @__PURE__ */ m("div", { className: "qz-notice qz-stack", children: [
      /* @__PURE__ */ u("p", { children: "Rebalance a column to restore space between card positions. Progress is saved if interrupted." }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ u("select", { className: "qz-input", "aria-label": "Column to rebalance", value: q, onChange: (F) => x(F.target.value), children: g.map((F) => /* @__PURE__ */ u("option", { value: F.id, children: F.label }, F.id)) }),
        /* @__PURE__ */ u("button", { type: "button", className: "qz-button", onClick: () => U(!0), disabled: !r || p.pending || !!(s != null && s.index.writeBlocked), children: "Review column…" })
      ] }),
      L && /* @__PURE__ */ m("div", { className: "qz-stack", role: "alertdialog", "aria-label": "Rebalance column", children: [
        /* @__PURE__ */ u("p", { children: "Update ordering in each note of this column? Other editors may see progress before all files finish." }),
        !!((_e = s == null ? void 0 : s.index.maintenance) != null && _e.includes(q)) && /* @__PURE__ */ m("label", { className: "qz-check-label", children: [
          /* @__PURE__ */ u("input", { type: "checkbox", checked: O, onChange: (F) => W(F.target.checked), disabled: p.pending }),
          "Keep the latest note contents and resume ordering after an external edit"
        ] }),
        /* @__PURE__ */ m("div", { className: "qz-actions", children: [
          /* @__PURE__ */ u("button", { type: "button", className: "qz-button", disabled: !r || p.pending || !!(s != null && s.index.writeBlocked), onClick: () => void p.run(() => ya(t, a, q, O)).then((F) => {
            F && (U(!1), W(!1));
          }), children: "Rebalance column" }),
          /* @__PURE__ */ u("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: p.pending, onClick: () => U(!1), children: "Cancel" })
        ] })
      ] })
    ] }) : null,
    !s && !o && /* @__PURE__ */ u("p", { className: "qz-empty", role: "status", children: "Loading the board…" }),
    s && s.tickets.length === 0 && s.index.state !== "scanning" && /* @__PURE__ */ m("p", { className: "qz-notice", "data-variant": "neutral", children: [
      "No tickets in “",
      n.name,
      "” yet. Create a ticket or use an existing note."
    ] }),
    s && /* @__PURE__ */ u("div", { ref: w, className: "qz-board", tabIndex: 0, onKeyDown: oe, "aria-label": `Board of ${n.name}`, role: "group", children: h.map(({ id: F, label: le }, ce) => /* @__PURE__ */ m(
      "section",
      {
        "aria-label": le,
        className: "qz-lane",
        "data-lane-status": F,
        onDragOver: (I) => {
          !b && F !== "repair" && I.preventDefault();
        },
        onDrop: (I) => {
          F !== "repair" && Y(I, F);
        },
        children: [
          /* @__PURE__ */ m("h3", { className: "qz-lane-heading", children: [
            /* @__PURE__ */ u("span", { className: "qz-dot" }),
            le,
            /* @__PURE__ */ u("span", { className: "qz-count", children: f[F].length })
          ] }),
          f[F].length === 0 && /* @__PURE__ */ u("p", { className: "qz-lane-empty", children: "No tickets" }),
          /* @__PURE__ */ u("ul", { className: "qz-cards", children: f[F].map((I, ie) => /* @__PURE__ */ u(
            "li",
            {
              draggable: !b && !De(s.index, I),
              onDragStart: (K) => {
                _.current = I, K.dataTransfer.setData("text/plain", I.path), K.dataTransfer.effectAllowed = "move";
              },
              onDragEnd: () => {
                _.current = null;
              },
              onDragOver: (K) => {
                !b && F !== "repair" && K.preventDefault();
              },
              onDrop: (K) => {
                F !== "repair" && Y(K, F, I);
              },
              children: /* @__PURE__ */ u(
                Oa,
                {
                  ticket: I,
                  lane: ce,
                  index: ie,
                  columns: g,
                  onOpen: () => e.onOpenNote({ workspaceId: a, path: I.path }),
                  disabled: b || !!De(s.index, I),
                  maintenance: s.index.maintenance ?? [],
                  onMove: (K, V) => J(I, K, V),
                  onDemote: () => {
                    window.confirm(`Remove “${I.title}” from the board? Its note and TODOs will remain.`) && p.run(() => Aa(t, a, I));
                  },
                  count: f[F].length
                }
              )
            },
            I.path
          )) })
        ]
      },
      F
    )) })
  ] });
}
function Ia(e) {
  const [t, n] = T(""), [r, a] = T(""), [i, s] = T(""), [o, l] = T(""), c = (e.columns.find((O) => O.id === o) ?? e.columns[0]).id, [d, p] = T(null), [g, f] = T(null), [h, w] = T(!1), _ = fe(0), v = fe(!0);
  he(() => (v.current = !0, () => {
    v.current = !1, _.current++;
  }), []);
  const k = Wt(e.onChanged);
  he(() => (e.onBusy(k.pending), () => e.onBusy(!1)), [k.pending, e.onBusy]);
  const z = e.disabled || k.pending || h, y = e.maintenance.includes(c);
  he(() => {
    var O, W;
    (((O = k.failure) == null ? void 0 : O.code) === "rank_exhausted" || ((W = k.failure) == null ? void 0 : W.code) === "maintenance_pending") && e.onMaintenanceNeeded(c);
  }, [k.failure, e.onMaintenanceNeeded, c]);
  const R = () => {
    _.current++, w(!1), n(""), a(""), s(""), p(null), f(null), e.onClose();
  }, b = t.trim().endsWith(".md") ? t.trim() : `${t.trim()}.md`, M = async () => {
    const O = ++_.current;
    w(!0), f(null), p(null);
    try {
      const W = await we(It(e.api, e.workspace.id, b));
      v.current && O === _.current && p(W);
    } catch (W) {
      v.current && O === _.current && f(xe(W));
    } finally {
      v.current && O === _.current && w(!1);
    }
  }, x = async () => {
    await k.run(() => e.mode === "create" ? _a(e.api, e.workspace.id, { path: b, title: r.trim(), body: i, status: c }) : xa(e.api, e.workspace.id, d, c)) && v.current && (n(""), a(""), s(""), p(null), e.onClose());
  }, q = e.mode === "create", L = q ? "New ticket" : "Use existing note", U = !z && !y && !!t.trim() && (q ? !!r.trim() : !!d);
  return /* @__PURE__ */ m("section", { className: "qz-panel-surface qz-ticket-form", "aria-label": L, children: [
    /* @__PURE__ */ u("h3", { children: L }),
    /* @__PURE__ */ m("form", { className: "qz-stack", onSubmit: (O) => {
      O.preventDefault(), U && x();
    }, children: [
      q && /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Title",
        /* @__PURE__ */ u("input", { className: "qz-input", ref: e.firstField, "aria-label": "Ticket title", placeholder: "Fix login", value: r, disabled: k.pending, onChange: (O) => a(O.target.value) })
      ] }),
      /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Note path in ",
        e.workspace.name,
        /* @__PURE__ */ u(
          "input",
          {
            className: "qz-input",
            ref: q ? void 0 : e.firstField,
            "aria-label": "Ticket note path",
            placeholder: "tickets/fix-login.md",
            value: t,
            disabled: k.pending,
            onChange: (O) => {
              _.current++, w(!1), n(O.target.value), p(null);
            }
          }
        )
      ] }),
      q ? /* @__PURE__ */ m("label", { className: "qz-field", children: [
        /* @__PURE__ */ m("span", { children: [
          "Description ",
          /* @__PURE__ */ u("span", { className: "qz-muted", children: "· Optional Markdown" })
        ] }),
        /* @__PURE__ */ u("textarea", { className: "qz-input", "aria-label": "Ticket description", placeholder: "What needs to happen?", value: i, disabled: k.pending, onChange: (O) => s(O.target.value), rows: 4 })
      ] }) : /* @__PURE__ */ m(ye, { children: [
        /* @__PURE__ */ u("div", { className: "qz-actions", children: /* @__PURE__ */ u("button", { type: "button", className: "qz-button", disabled: z || !t.trim(), onClick: () => void M(), children: "Preview note" }) }),
        d && /* @__PURE__ */ m(ye, { children: [
          /* @__PURE__ */ u("pre", { className: "qz-mono qz-note-preview", children: d.content }),
          /* @__PURE__ */ u("p", { className: "qz-muted", children: "The note’s content and existing properties are preserved." })
        ] })
      ] }),
      (q || d) && /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Initial status",
        /* @__PURE__ */ u("select", { className: "qz-input", value: c, disabled: k.pending, onChange: (O) => l(O.target.value), children: e.columns.map((O) => /* @__PURE__ */ u("option", { value: O.id, children: O.label }, O.id)) })
      ] }),
      y && /* @__PURE__ */ u("span", { className: "qz-notice", children: "Resume ordering maintenance for this column before adding a ticket." }),
      /* @__PURE__ */ u(de, { failure: g }),
      /* @__PURE__ */ u(de, { failure: k.failure }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ u("button", { type: "submit", className: "qz-button", "data-variant": "primary", disabled: !U, children: q ? "Create ticket" : "Make ticket" }),
        /* @__PURE__ */ u("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: k.pending, onClick: R, children: "Cancel" })
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
function Ba(e) {
  const { api: t } = e, n = jn(), { companions: r, failure: a } = Hn(t), [i, s] = T("all"), [o, l] = T("open"), [c, d] = T(""), p = fe(null);
  he(() => {
    r && i !== "all" && !r.some((x) => x.workspace.id === i) && s("all");
  }, [r, i]);
  const g = i === "all" ? void 0 : i, f = !!r && r.length > 0, { data: h, failure: w, busy: _, refresh: v, reload: k } = Kn(
    t,
    f,
    `${i}:${o}`,
    g,
    () => da(t, o, g),
    () => jt(t, { workspaceId: g, manual: !0 }),
    (x, q) => ({ ...x, index: q })
  ), z = Ze(() => ga((h == null ? void 0 : h.groups) ?? [], c), [h, c]), y = z.reduce((x, q) => x + q.items.length, 0), R = h ? Object.values(h.index) : [], b = Wt(k), M = (x, q, L) => {
    b.pending || w || _ || De(h == null ? void 0 : h.index[String(x.workspaceId)], x) || q.markerStart === void 0 || b.run(() => za(t, x, q, L));
  };
  return a ? /* @__PURE__ */ u(de, { failure: a }) : r ? r.length === 0 ? /* @__PURE__ */ u(Vn, { onSettings: e.onSettings }) : /* @__PURE__ */ m("div", { className: "qz-stack qz-todos", children: [
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
          /* @__PURE__ */ u("input", { className: "qz-input", ref: p, type: "search", "aria-label": "Filter TODOs", placeholder: "Search tasks or notes…", value: c, onChange: (x) => d(x.target.value) })
        ] })
      ] }),
      r.length > 1 && /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Workspace",
        /* @__PURE__ */ m("select", { className: "qz-input", value: i, onChange: (x) => s(x.target.value === "all" ? "all" : Number(x.target.value)), children: [
          /* @__PURE__ */ u("option", { value: "all", children: "All workspaces" }),
          r.map((x) => /* @__PURE__ */ u("option", { value: x.workspace.id, children: x.workspace.name }, x.workspace.id))
        ] })
      ] }),
      /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Show",
        /* @__PURE__ */ m("select", { className: "qz-input", value: o, onChange: (x) => l(x.target.value), children: [
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
        z.length,
        " ",
        z.length === 1 ? "note" : "notes"
      ] }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ u(Gn, { statuses: R }),
        /* @__PURE__ */ m("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => void v(), disabled: _ || b.pending, children: [
          /* @__PURE__ */ u(Q, { name: "refresh" }),
          "Refresh"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ u(Yn, { statuses: R }),
    /* @__PURE__ */ u(de, { failure: w }),
    /* @__PURE__ */ u(de, { failure: b.failure }),
    (h == null ? void 0 : h.truncated) && /* @__PURE__ */ u("div", { role: "note", className: "qz-notice", children: "Only the first items are listed. Narrow the list by workspace or completion status." }),
    !h && !w && /* @__PURE__ */ u("p", { className: "qz-empty", role: "status", children: "Loading TODOs…" }),
    h && z.length === 0 && /* @__PURE__ */ m("div", { className: "qz-empty", children: [
      /* @__PURE__ */ u("span", { className: "qz-empty-icon", children: /* @__PURE__ */ u(Q, { name: c.trim() ? "search" : "checklist" }) }),
      /* @__PURE__ */ u("h3", { children: c.trim() ? "No matching TODOs" : "No TODOs to show" }),
      /* @__PURE__ */ u("p", { children: c.trim() ? "Try a different search or clear the filter." : "Choose a different workspace or completion status to see more." }),
      c.trim() && /* @__PURE__ */ u("button", { type: "button", className: "qz-button", onClick: () => {
        var x;
        d(""), (x = p.current) == null || x.focus();
      }, children: "Clear search" })
    ] }),
    /* @__PURE__ */ u("div", { className: "qz-stack", children: z.map((x) => /* @__PURE__ */ m("section", { "aria-label": x.title, className: "qz-todo-note qz-panel-surface", children: [
      /* @__PURE__ */ m("header", { className: "qz-todo-header", children: [
        /* @__PURE__ */ u("span", { className: "qz-note-icon", children: /* @__PURE__ */ u(Q, { name: "note" }) }),
        /* @__PURE__ */ m("div", { className: "qz-todo-identity", children: [
          /* @__PURE__ */ m("h3", { children: [
            x.title,
            x.ticket && x.status && /* @__PURE__ */ m("span", { className: "qz-status-pill", "data-lane-status": x.status, children: [
              /* @__PURE__ */ u("span", { className: "qz-dot" }),
              x.statusLabel ?? x.status
            ] })
          ] }),
          /* @__PURE__ */ m("p", { className: "qz-todo-meta", children: [
            /* @__PURE__ */ u("span", { children: x.workspace }),
            /* @__PURE__ */ u("span", { "aria-hidden": "true", children: "/" }),
            /* @__PURE__ */ u("span", { className: "qz-mono qz-path", title: x.path, children: x.path })
          ] })
        ] }),
        /* @__PURE__ */ u(Xn, { path: x.path, compact: !0 })
      ] }),
      /* @__PURE__ */ u("ul", { className: "qz-todo-list", children: x.items.map((q) => /* @__PURE__ */ m("li", { className: "qz-todo-row", "data-checked": q.checked, style: { paddingInlineStart: `${Math.min(q.depth, 4) * 0.8}rem` }, children: [
        /* @__PURE__ */ m("label", { className: "qz-todo-check", children: [
          /* @__PURE__ */ u(
            "input",
            {
              type: "checkbox",
              "aria-label": `Complete ${yt(q.text)}`,
              checked: q.checked,
              disabled: b.pending || !!w || _ || !!De(h == null ? void 0 : h.index[String(x.workspaceId)], x) || q.markerStart === void 0,
              onChange: (L) => M(x, q, L.target.checked)
            }
          ),
          /* @__PURE__ */ u("span", { children: yt(q.text) })
        ] }),
        /* @__PURE__ */ u(
          "button",
          {
            type: "button",
            title: `Open note · ${x.path}:${q.line}:${q.column}${q.heading ? ` · ${q.heading}` : ""}`,
            "aria-label": `Open note: ${yt(q.text)}`,
            onClick: () => e.onOpenNote({ workspaceId: x.workspaceId, path: x.path }),
            className: "qz-button qz-icon-button",
            "data-variant": "quiet",
            children: /* @__PURE__ */ u(Q, { name: "external" })
          }
        )
      ] }, q.ordinal)) })
    ] }, `${x.workspaceId}:${x.path}`)) })
  ] }) : /* @__PURE__ */ u("p", { className: "qz-empty", role: "status", children: "Loading workspaces…" });
}
/*! markdown-it 15.0.3 https://github.com/markdown-it/markdown-it @license MIT */
var en = Object.defineProperty, bt = (e, t) => {
  let n = {};
  for (var r in e) en(n, r, {
    get: e[r],
    enumerable: !0
  });
  return en(n, Symbol.toStringTag, { value: "Module" }), n;
}, tn = {};
function La(e) {
  let t = tn[e];
  if (t) return t;
  t = tn[e] = [];
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
function He(e, t) {
  typeof t != "string" && (t = He.defaultChars);
  let n = La(t);
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
He.defaultChars = ";/?:@&=+$,#", He.componentChars = "";
var nn = {};
function $a(e) {
  let t = nn[e];
  if (t) return t;
  t = nn[e] = [];
  for (let n = 0; n < 128; n++) {
    let r = String.fromCharCode(n);
    /^[0-9a-z]$/i.test(r) ? t.push(r) : t.push("%" + ("0" + n.toString(16).toUpperCase()).slice(-2));
  }
  for (let n = 0; n < e.length; n++) t[e.charCodeAt(n)] = e[n];
  return t;
}
function Se(e, t, n) {
  typeof t != "string" && (n = t, t = Se.defaultChars), n === void 0 && (n = !0);
  let r = $a(t), a = "";
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
Se.defaultChars = ";/?:@&=+$,-_.!~*'()#", Se.componentChars = "-_.!~*'()";
function Ot(e) {
  let t = "";
  return t += e.protocol || "", t += e.slashes ? "//" : "", t += e.auth ? e.auth + "@" : "", e.hostname && e.hostname.indexOf(":") !== -1 ? t += "[" + e.hostname + "]" : t += e.hostname || "", t += e.port ? ":" + e.port : "", t += e.pathname || "", t += e.search || "", t += e.hash || "", t;
}
function dt() {
  this.protocol = null, this.slashes = null, this.auth = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.pathname = null;
}
var Ua = /^([a-z0-9.+-]+:)/i, Pa = /:[0-9]*$/, ja = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/, rn = [
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
], an = [
  "/",
  "?",
  "#"
], Ja = 255, sn = /^[+a-z0-9A-Z_-]{0,63}$/, Wa = /^([+a-z0-9A-Z_-]{0,63})(.*)$/, on = {
  javascript: !0,
  "javascript:": !0
}, ln = {
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
function Bt(e, t) {
  if (e && e instanceof dt) return e;
  let n = new dt();
  return n.parse(e, t), n;
}
dt.prototype.parse = function(e, t) {
  let n, r, a, i = e;
  if (i = i.trim(), !t && e.split("#").length === 1) {
    let c = ja.exec(i);
    if (c) return this.pathname = c[1], c[2] && (this.search = c[2]), this;
  }
  let s = Ua.exec(i);
  if (s && (s = s[0], n = s.toLowerCase(), this.protocol = s, i = i.substr(s.length)), (t || s || i.match(/^\/\/[^@\/]+@[^@\/]+/)) && (a = i.substr(0, 2) === "//", a && !(s && on[s]) && (i = i.substr(2), this.slashes = !0)), !on[s] && (a || s && !ln[s])) {
    let c = -1;
    for (let h = 0; h < an.length; h++) r = i.indexOf(an[h]), r !== -1 && (c === -1 || r < c) && (c = r);
    let d, p;
    p = c === -1 ? i.lastIndexOf("@") : i.lastIndexOf("@", c), p !== -1 && (d = i.slice(0, p), i = i.slice(p + 1), this.auth = d), c = -1;
    for (let h = 0; h < rn.length; h++) r = i.indexOf(rn[h]), r !== -1 && (c === -1 || r < c) && (c = r);
    c === -1 && (c = i.length), i[c - 1] === ":" && c--;
    let g = i.slice(0, c);
    i = i.slice(c), this.parseHost(g), this.hostname = this.hostname || "";
    let f = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
    if (!f) {
      let h = this.hostname.split(/\./);
      for (let w = 0, _ = h.length; w < _; w++) {
        let v = h[w];
        if (v && !v.match(sn)) {
          let k = "";
          for (let z = 0, y = v.length; z < y; z++) v.charCodeAt(z) > 127 ? k += "x" : k += v[z];
          if (!k.match(sn)) {
            let z = h.slice(0, w), y = h.slice(w + 1), R = v.match(Wa);
            R && (z.push(R[1]), y.unshift(R[2])), y.length && (i = y.join(".") + i), this.hostname = z.join(".");
            break;
          }
        }
      }
    }
    this.hostname.length > Ja && (this.hostname = ""), f && (this.hostname = this.hostname.substr(1, this.hostname.length - 2));
  }
  let o = i.indexOf("#");
  o !== -1 && (this.hash = i.substr(o), i = i.slice(0, o));
  let l = i.indexOf("?");
  return l !== -1 && (this.search = i.substr(l), i = i.slice(0, l)), i && (this.pathname = i), ln[n] && this.hostname && !this.pathname && (this.pathname = ""), this;
}, dt.prototype.parseHost = function(e) {
  let t = Pa.exec(e);
  t && (t = t[0], t !== ":" && (this.port = t.substr(1)), e = e.substr(0, e.length - t.length)), e && (this.hostname = e);
};
var Za = /* @__PURE__ */ bt({
  decode: () => He,
  encode: () => Se,
  format: () => Ot,
  parse: () => Bt
}), Ha = /* @__PURE__ */ bt({
  Any: () => Qn,
  Cc: () => er,
  Cf: () => Ka,
  P: () => Zt,
  S: () => tr,
  Z: () => nr
}), Qn = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, er = /[\0-\x1F\x7F-\x9F]/, Ka = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/, Zt = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B4E\u1B4F\u1B5A-\u1B60\u1B7D-\u1B7F\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDD6E\uDEAD\uDED0\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9\uDFD4\uDFD5\uDFD7\uDFD8]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09\uDFE1]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDD6D-\uDD6F\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD839\uDDFF|\uD83A[\uDD5E\uDD5F]/, tr = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C1\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2429\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E5\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD803[\uDD8E\uDD8F\uDED1-\uDED8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDC00-\uDCEF\uDCFA-\uDCFC\uDD00-\uDEB3\uDEBA-\uDED0\uDEE0-\uDEF0\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED8\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0-\uDCBB\uDCC0\uDCC1\uDCD0-\uDCD8\uDD00-\uDE57\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF-\uDEF8\uDF00-\uDF92\uDF94-\uDFEF\uDFFA]/, nr = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/, Ga = [
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
function Ya(e) {
  return e === 0 || e >= 55296 && e <= 57343 || e > 1114111;
}
function Xa(e) {
  return Ya(e) ? 65533 : e >= 128 && e <= 159 && Ga[e - 128] || e;
}
function Va(e) {
  return e - 1 >>> 0 < 127 || e - 160 >>> 0 < 55136 ? String.fromCharCode(e) : String.fromCodePoint(Xa(e));
}
var ze = /* @__PURE__ */ (() => {
  let e = /* @__PURE__ */ new Uint8Array(127), t = 0;
  for (let n = 33; n <= 126; n++) n !== 34 && n !== 36 && n !== 92 && (e[n] = t++);
  return e;
})();
function Qa(e, t, n, r, a, i) {
  let s = e.length, o = i * 90, l = 0, c = () => {
    let x = ze[e.charCodeAt(l++)];
    return x < i ? x : x * 91 - o + ze[e.charCodeAt(l++)];
  }, d = n - r, p = n + a, g = new Int32Array(p);
  g.fill(-1, r, i), g.fill(-1, i + d, p);
  let f = new Int32Array(p), h = new Int32Array(p);
  function w(x, q) {
    let L = 0, U = q, O = q + x;
    for (; U < O; ) {
      let W = ze[e.charCodeAt(l++)];
      if (W < 89) L += W, g[U++] = L;
      else if (W === 89) {
        let G = ze[e.charCodeAt(l++)] + 2;
        for (; G--; ) g[U++] = ++L;
      } else {
        let G = ze[e.charCodeAt(l++)];
        L += 89 + (G < 90 ? G * 91 + ze[e.charCodeAt(l++)] : ze[e.charCodeAt(l++)] * 8281 + ze[e.charCodeAt(l++)] * 91 + ze[e.charCodeAt(l++)]), g[U++] = L;
      }
    }
  }
  w(r, 0), w(d, i);
  let _ = new Int32Array(a * 2), v = 0, k = 0;
  function z(x, q) {
    for (let L = 0; L < x; L++) {
      let U = q + L, O = c(), W = c();
      _[k * 2] = O, _[k * 2 + 1] = W, k += 1, f[U] = v;
      let G = (g[O] < 0 ? h[O] : 1) + (g[W] < 0 ? h[W] : 1);
      h[U] = G, v += G;
    }
  }
  z(a - i + r, i + d), z(i - r, r);
  let y = new Uint16Array(v), R = 0;
  for (let x = 0; x < k; x++) for (let q = 0; q < 2; q++) {
    let L = _[x * 2 + q], U = g[L];
    if (U < 0) {
      let O = f[L], W = O + h[L];
      for (; O < W; ) y[R++] = y[O++];
    } else y[R++] = U;
  }
  let b = new Uint16Array(t), M = 0;
  for (; l < s; ) {
    let x = ze[e.charCodeAt(l++)];
    x >= i && (x = x * 91 - o + ze[e.charCodeAt(l++)]);
    let q = g[x];
    if (q < 0) {
      let L = f[x], U = L + h[x];
      for (; L < U; ) b[M++] = y[L++];
    } else b[M++] = q;
  }
  return b;
}
var ei = /* @__PURE__ */ Qa("!}.&u%}'&}*'~!6*)%&,~!J~!J~%L~y<~!R,~~%Lu~~#GD~~#|)1#%}^%}2%+#.##%##%}&%##%'#%##&%#%#'%#&#%#&#'#%%#&#%##%#)%''%&%#%#'%#%%#%%}%%%#%#&(23#%%#&-%0%('1#(##%#'##+%'*.:1}#%#6-+(%'%%#%%%}#L'2351&('%}&/N'(0(/*-%(%%}#'+&T%7.2}#&%&#%#36/5##%&%%#&#%%#))2%%##%&&'0~!#*+&'%1~!%).'3q?&%'1~!.##%6(~!+%%%(Gw'rT~!E#<nA%#jZ~!H%(~!42##~!*31&~!G%U~#)5~#`3~!J~!Z~%]~%Y~%C~!q~!u~#kz~%#~!6'~!D~!U~!?~#T~!c%~!G#'~%7|~!G~!J~!G&~#pb~(Df}#%}*&}#%##%##%##&#-}&'#'&%#.++}%mI,#,@&(}*%}*'%&##&#%##%}&0}#.},U},%}+%}&%}#%##&}B%(}(%}+%)})%##%#&}&%##%&}<%}>%#%&}*%}(%}9%}/%})%}*%}*%}?&}&%}3%}&*#%})%#%#)}#&#-#+*%E%%'%'#%}#*V##&##I}#&&##%&%#&&Qf%%))w/0+&%#(#.%-''''++++7}>%4'',##1,#%#&%##&#'##&#*#9)%&%}#*}%,#+P(%A&%#'&##wSD',9E00#y#@}(+}&%&>~!#~!X}#*}(&&}(&}(,%}%&#+&}#&}I%#%}%)#(},'%#*}4%%#%}(''}#/##(##),%-##%%)#&}(.}&%#&}%%}*&#%},&&}&%}#%*'#%})%}D&}&%}-&}6&#&}-,%}#%})-(~+`~,=?~I9'9%~!,#%})%})%}@%}?%}(~!?~#<~#pP~#BG~#=1#%K+~#?#~%;)~#A~#mF1~#A'~'X%'~#lR~#N~'N~#r~#m#-~#i'?%#'%~#B%##%,%#~#_%#0%~#]732~,w~2+#:&#%&'0%&>%}#>##F+)#%&&#(+_}4&}-%}(&}@&}O7Fdf0@+/v4}&WU##&/0#&'('B#%}.%}'+#%}#%%&#&%#%##+#&#)#6#'#.},%}c%},%#%##%&#&%#&~#>'*-.%##%##%}#%%}%'~#)D1}#%*&~#_%%'(~#S2%'.}#~#=##*'*-%}&'%'##&&~'E%.#&~#M4}%%##&'%#~#O1##%&#'+~#<B%##%%'%+~#;#@%}#&%#&&%#(~#H1}'%'##&&~#?A}&'~#D#%32}'&&&&~#[}'(#%}'~#;C})&}%%#%~#=&%,3}%'(#%%~#^'#&&)#%'~#Y%-~#d-%'~#^%%&#&&&}#~#b~2t*&'~&(~&@~0%~e~3}%*''0})&}+~!9##-}#%-hD*)1fC#%/&/fB#40~!+#)*4~!+~!K'&:~!/*7~!.#~!H~!L':~%x&~!H#~!*~%1~!I#~!+A~#p'~!F~~#-#~,,(~.Z~!V~%;'B'mq-W~!N~%I%#&&#&}#%},%%}'%}+X#%}#&}(%}'%}<%}#%}%%'}'%}:~![)9@~%>~#UA%-%##&~!C%~!-.9:~!1~!-^2/:a~!y,D*J#-5)/4~%23,~#G~!L1~!0X3`~!2+~!!0-~&E~!W~!o,>Y&]~%cZx_&~#O*9#A#'#+I'%#)~!0B*-5A+-((F&*M#)(-7-5+'-3a5Vi~!Y~!?+[)%3),ERHm~!+:D,VG.+)?fB%%*(%)'(#&80%1'8`K8?`+'Z#&O&'H5#*9)A%%5&3))0%39+.*7#()&&*=4@**L)<'_&*+..;(#*+)./&0#3)%')-8(4ixD(&.}%,('aI:,)%,k2231T)I'#/-W7,/'Q#.'Y24+h')37</31&83##&0#),H(?'&?/1##%#&&#%''-%&&&#(&''&#.-'%#%%(,')*'&#&#'##%(%(#%('#&##%%%%('%#%#%%#%#&%##h>w+v<ayvyvcg.uuhKr}g/v|g>u9i[~>g5uI~=RvdwEg;v/g;uk!!TTSx]@RT!U!#!@VBRUU!'UTe-d0c`e&gSdicedFcrdTaqb.kYcAohdYd@a3e+d}dMdtd.aJ#bqcK`dle/e.e'dwdPdodddjbEb}ogd^ofdpduc6j?l%d{drdqc)d7bacOdQ%T#Y)X.sR[yH>6Vyv3[xwLu>vo'!*.[yBacahoj>6Rew3[xqdZa#!a&#^(X-[yG>6Vyu3[xvg3sEr|g.u/Ri9db0T#^(Xa)!-[y;>6Vylg4wKs{JwNZt3@3r=c4Z([xlg;wKt!cpq's@v7A'*a(a+!-a#[y<3Dt?3Dt'>6Vym3[xmg9rxsNJwLZt4~?r?db1T#`-!(Xa,!0[yS>6Vz%NuQs.g4wKtnJwNZtS@3r>c4Z([y%g;wKtrdga8!a(!#&T*Y-Xa#!a0<or[yc3Dtq>6Vz43[y3JwNZtf@3s!Ju}!%Dti:pm3c_%X#tjB5pkd6q!r]u?voC'*-a.a2!0a&a+[yI3DtI3Ds~3DtH>6Vyw3[xx;:s#~<5pKJwNZtE@3r~d`a)!a2T#a.(!+U.X1[yT3Dt`3Dtv>6Vz&3[y&g9rxwzcxstPu.<rAJwLZtT~?r@dZa%!a.&^*Za(/Reu[ya>6Vz23[y1g3sEr}wkg{NuQRg{ci(U#5@b`~,cg#U(2WnH5wugcRh7dX#T(Y,a'Ta!!a,[yZ<]mj>6Vz,3[y+Pv#5ReZKu+=,%!H}7ABwkaS?Rh:BcW(X#<]mrj:ubv/ARekdg%!(!a.*Ta(Y.X1!#sP>Rl*Dt6[y>>6Vyo3Wf*jOvuumvuRgRJuq*!:9<B@bX~3jVv&v@s@5Re[d/rQt{uAvo&a&a*)a2!,0Wf!3Dt0=Bs'>6Re}3[xy~<5s%JwJZt1~Gs)c;&!#2sJkNuXvzq7rxu,Re8dka4!a8(aEZ+a@Y.X1Xa)[yd=Bs(3DtP>6Vz53[y4cX#X&Re:avRe9~<5s&JwJZtQ~Gs*i^rzvdRg+Jv{%!2sbB@bX}kdga,!Za?&^*T1/!a'Dt+[y6>6Vyf3Wf%g/u;s4hGu6?Rh-JvZ,!c%#&RoX54Rivj7uyvf8RgTKvZB%*!2sGh<vu5Rgq<=C::9bb~#dZ#T&Ta6Y.X*Dt>[y93Wf)coZ(T,6VyifluvRgC@95@B@bX~/hFu34cC#T,k/unq8w8Q5RkUklwQuzunq8w8Q5Rk8d/rJu?v8w9)-&!a0a;a&aIWejg3sEr/h1s<DtDJvyZqY5aws3Jvy!&Wei~Hr1:au5@Bag>23E~5c:Z&bX};kKv?w&unuVu5Rjc;>bs)#~@:Rh.=ay<a]C;b`}Vd6s/t{uAvoaxa()!a,a7%-a#a2Dt,[yF2Wo[>6Vyt3[xuNuPRi&NuPwpi#RoWh?vf8Ri%Jv]!%Ri:KvxD!.'2WeAjZu`q9rxu,Re7woeAg-unLq(qA_/*2Wg_g3u5q^9:4E}/jTrxrzv=Wkkd~0UX#^^Xa-a1a5T&a=U1a'*aEa]!a*aPaA-adok[y54Rn>;:p3~Dp5g9rpsFNvZqjg3uJp4~<5p0Pw;5qlJwNZt*@3p1Pw:5p/Ou!5p2JvG'!6Vye=<qnJvh_[xhg3v,Rh3kOwOw-sDuev/Re^dha[a%!%!a+#Ta7)-5TaCaO!aka!a)sf[yb2>Rl!9ARiq5E}Qg=ucRkBE|oJrJ_@Wk~@Wk{JrJ_@Wk|@WkyJrJ_@Wk}@WkzJvO_[y2g-vMRmiKuYC!)&>Ri;>Ri<@3RkNc](X#@9Rk=g5vuRmhKvDB!+'=]meg3u4Rmgd)#Y'Vz3CARmfd`a+!%T'!+#Ta1Ta6TaM-sTDt9[yA9sYd'%Y#s[[xpj:ueunaXRgEjRq,v-vuqdd2'`#6Rev<32@5>:2<E}5xIo9a*X#Y(;5RePJvD_g>vyRgNj8w)v8<wggs:RgXiZt|vjx,hSq3ah!-(~@:Ro/Ou!5RhWj^v(pyw8unRhUdx-UY#^Ua.a3a70!)%UX1TaDa)'omRiRRhE[y:3Dsz=Br,>6Vyj3[xkg6ruwjcqsrPw;5r*Ku]D'Zt-@3r(~?r.i[vwv]dU1a--U#`a4(g/vsRhPOu!5RhLj:rmu9Wo!~@:wdh@g/vsRiTjXuvvNr}:RhBj^v(pyw8unRn]dz1UYa'a+^Y(!aETZalaRY.Ta?a4[yDJw1!#qLsW>6Vyrfzq-pLflpwRe|Js>%!Dt@3Dt&Jvy_[xs~HrnjMuwpsw'RecKu+D#'!t<~Grl~?rjg5u-x,gwp{ah!-(~@:Rg~Ou!5Rh'jXuvvNr}:Rh#cW#X/c;&!#2sLi[v7u7RgpJv)(!iLrxu,Re6j7v@s@5Se[e7d`aW!Za(a`T.a#!a3!&aDa-!9)Dt_=6s+3[x~~DR|h~DS6avhGun5RkZj3w)v-]mkKunB!&*]kb97R|i<ARk<c:Z(6Vy}Juh'!wziMRoS:F|vkLuauJv5vtvQRh1d='T+Y#VyO~DR|jcF#T'7R|g97R|kJv3'!ay<Rj,Jvh&!:ReXcsa6*a+#a#_aIRf9aLRf?c,Z&Rf5Rf7c.Z&Rf;Rf>cQ#%T'p-Rf8Rf=ct#%'(*!,p,Rf4p+Rf6Rf:Rf<d~'Ua%U*^UYa(!a,-!#a4YaTalaEX0a8a<Weo3Dt/3Dsx=Br93Wen~Dr;~<5p<JwNZt2@3p=Pw:5p;Ou!5r3c7&!#:p>3Ds}KvGB)_6Vyk2sM=<r7x'eovA(!hFu1ARf}cV#X&@r5j6rvwQa^Rf3c=Za'wkghJv__g;unRggA53B9=b^}%j6uduo5Jq;!(hIv%2Re`Ou4ARe_e%a#^^^Xa&!a*a2!&a6YaP!*ad!#a:aE/5Rn?[y@>6Vyp;:pE~DrY~<5pBJwNZt8@3pCh=rt3rWPw:5pAJup_[xoNuPpF9c!#'45pD5ARn)d8#X'X*3@rU72s]h>v<<sSjJpqvewOJq/(!hNw'5ReBk0s2u3w/w'5ReE5@Jq.!a+JQ!&WeU23d(#Y&RjG5]jBk!u7w&u0udARjEe#+^^^Ub#!a2/a`Z(agT1!a-a;|@TaG!aS[yV=Re~fow'RguNuPRe?bz#'>RoUWeL>:Cbb|?JwPZtVg6ruRmzJvD'!6Vz(g/vmRh~Jvy_[y(g9voRgyx*cy(#2>Ri2B9b]~9kIw9u7rluJu3Rg]dI#a%UY'@=p%CAx.gQZ&RhwwygtRm{x5g_Z'+ABqR9Woa=Bp&dV#^*Xa'!&@o{g4v]Rk;Jv{!%Rk[wkkiA5RkiwwfUB=x,fUuqC&*!>RfTg8v0RfV~ARfSd;rJsAuAv9wR'ae+/aO!a@aza/a#[yQ@Wg!2Wemg3sEr0JvB_g>uvReWg2v+Re=KupB_+[y!2AbY~-~Hr2AJwD!(h<~El>h<~El?Kun@+_:9b`}Kg-v/Ri3g;vtwyk_9]k_d=&T#*U.6qh@Ab`|K9:H|CJv[!&3Dtex'fDwC%!Rf[9WlMd[(^X,!a%Z06Vz!@WgBg=v~Rgvg,QRe@awd,#Y+jTv|Q~EfWj]uNr|~FRfXdy#Y&^Ua%!aO.!(a)Ua;=!a@aKap!a-,a!Ta]a[rSa]p?[y82sK=Bq~;:p:~<5p8Pw:5p7d'#Y'Wf(;RnRi[u4w&RgJJvG'!6Vyh=<r#ijuuv/sIKuYD'ZtG@3p9~Gr&d2#`(g<vtRgFj`u5w&rqpxRf2CJuY!+:wfnTOu!5Rg}jNs1ucv&RfwJvA!&3@q|BDcC#T,k/unq8w8Q5RkTklwQuzunq8w8Q5Rk9dga#!a'!a=#a0!:+Tb*b@aO.a4!aba8aFJv^}?!VyR~Dr<g;u%Rn.~<5p[x'e`wNZtR@3p]Pw:5pZhNvjBp.woe_g5u-r4JwF!%DtO3:ooc7&!#:p^3DtpLuGw(!+%)Dtk6Vz#2sd=<r8d'#Y([y#<x3gJt`w@!)%}MRiowzikRij=]ilxAf3,U(#B2Rf#g0v-Rm[ck{`U#]giKv3>)!&6Ri154s,KuGB_%@r68r:dJ|t`#X(9<E|u2@H|rx3gJu?w'!+'1Nu7Reg4=H~+9<wxgY95Rm]xLggZ-`(X}U2:Ri4h<uOawRmsJv__5@bb{jbV~3dka#a'a]!,#a+U=a>b6a3b%!/aKa/)!arwve^VyJ;:pR~DpTg3uJpS~<5pOPw;5qmPw:5pNOu!5pQJvG'!6Vyx=<qoJvA!{~Jup!%@qk7Rn/KvyD!}''[xz;>wkh'?Rh,x8gyt`w5D!&),(SgyccRgztJ@3pPB5p#d'(Y#<]mmifubw&RgoJvE&!82s^JvF&!8Rf,ADb]~;x=h'rNu]vK!,%'*0RnORh)4Rh*AqQg-vaRnNg;wHwkh'ba~4cE#Ta*x3gctyw@'!+%RnFRnD<4Rn@hFvK5RnCxWg[#`&a0Ua()`1Rm75Rg[c]%X#qi8Rg^NvdRj>BwzgZauwji7Rm6A4wgg]d1#&(*,.0a#Rm;Rm<Rm=Rm>Rm?Rm@RmARmBe%#^^^Xaea?aC/b+(,!a+a#!a/!>a&Ta<aKbD!2wphBRnk[yPw}hE|.=Br-3Dtm>6Vy~g6urRf.x,hPrNav!%'RnqRo%Ro#Nu;q[Pw;5r+JwNZtM@3r)d'#Y'Weh;xChL#`&RnmRnoKu}>%(!Rne~Bs-;2wjcussJv+'!aYSO}6@B<5?ba~8LrNvj!.%*ROwungw~ng~:9;Ri^>wtnig;wHRnixDh@|(UZ.x1h@|)!#:2<H|*xHn]#-UX'3Ro)z=iT}6ARns=Bwsn_wpnaRncw]aR(#UXa&Ua*a/=]iPd'#Y&Ro'WnXf{QRm2hNvj]nZd`'T~&1`{|`#9b]{}c:'!#Wl{>@=be}]?cl{{U#:5Abb}Jds#^YaF!a*b4a#a3aPa>&Tb!bH!*a_!Eau?/a&RjY<]gj>6Vz*;:pe~DrZg,QRj1JwNZtX@wihspcJvZ&!VyX9WmOJu|!|N2WmHJvh&!]ht~Bpbcn&T(!#RmQ<s7Nu;padH#X'`+WmJ@>RmKCARhnKup=!)&Wf+:RhqNuPpf9c!#'45pd5AwghpARn(Ls@w!%,)!RmP@Wfe<E|IJva!&WmNg8vsRmLd`*.`#Y'Xa!axRn*]hrA8Rhug5s@rXg8u!RmMd8#X'X*3@rV72smdI*#UY&RmICARho~GsgxVgd)Ta'U-Y&Xa!T#RnEWnA@Wffg1uDRi0hFvK5RnBxGnG&#`%owp)@wsf+bX}Ze-*1!a*^^^Ua|!#a.aq&Ya2!a>.a6!a:aO`aJDtL[y`@Wg#>6Vz12@wzoYRoZNuPRi!NuPRhzg=ucRi,@=b`{Yg=ucRi-ACJvB!&Sh[ebSh]ebi`wUuFRm4Jw2_[y0JvB!.<Ju(!&SoG}6Shd}6<Ju(!&SoH}6She}6Kur@._g5vHRieJvx!{L2G{Kx6gd'T#?Rh82Wi5cZ#X(g1w)Rm5dW-Y(Ta#!a)!#aYa=wnfE=su2>>bU{0j9udv:<svj8uQv-7RgHdE%#^'sq9sp=>Bb_{TJv`!&g/r|snj6v(us5d,#Y(56H}[978H}]Jw5!&g1rushJvB!+j;v{u5?zDhd}6}bj;v{u5?zDhe}6}ce*#`(^^^a[aea!=!a6a*aoXb1a.!aAbL!b>,b'aL!aV@Wf|2Wlg3[y/JwNZt^@3piPw:5pgJunZou3@rsJva&!Vy_g<v~Rm#JvG'!6Vz0=<r{Ju{%!:pj@WfsiXuJu3Rm:JvZ&!WfA~Bph@c4Z&Dtwax5rubx(#:awRk1@d,#Y&RfjRfid1#,Y(@Wfp2Wlrg5s@ryKu[@!,'=]ig9wlk?Rk>g5u-rqJvy'!@9RkQcH(T#=>Ri~@<wkj(Wj(KuZB*!&<7rw@9RkRcH(T#=>Ri}@<wkj)Wj)dg(Ta2Xa9X#`-!a*CARhg@@=I}d9x;c~#X%so=<sj>2@@=aybb}XjWv0Q~EfEj3vLv;<d,#Y(56H}`978H}_dgaPaFa'a/!#a3Y0a_a;a|!1(a7-[yE3[xt;:pJNvZrrg3uJrvJwNZt=@3pIh=rt3rxPw:5pGOu!5rpJvG'!6Vys=<rz@c4Z&Dt(ax5rtJvZ!&~BpH@wsfNg-vaRlNci*U#=<wei<F}a5@Jq.!a*JQ!%@qZ23d(#Y&RjH5]jCk!u7w&u0udARjFd/prq=tyvpaEa(a:.!a1aZ(@@=I}:9wpd%=<sX55w_h}@@=I{t=ay<aU@@=I}T=ay<2@@=I})?C9:9au@9Cb]}DP~=x-fAZ(2Wl1=ay<aU@@=I}>5@d##Y+jTv|vV~EfFj]uNpn~FRfGdgaK!Z2&!a8a-Tb({E!acTbM*!a(DtY[yYd'%Y#sl[y*hHvh>Re5x2c{Z}.j4uCvcawRiMd+#X+_x&d!},<5RkX;2Hzw@x,gavfB-!{CcF&T#Roe;RodwWbBg5urRgaKvHC*_6Vz+<4opieuew&Rmq@d]&Y)X,T#X0Rh}<BqP=4qS9:ReMg/ujReNJw0!/<Jui%!bd{kawwnemRelAxUa?a3#*.&UX(Ya+a/RhvRnQ<o}9Wmtd-#Y&RgSRmw9;Rmxay=Rmyg-vaRmuxEhSrNu,v-voC!%(aR.a(a7+1Ro1>Ro5CE{A9b]{@;5x#eO{:g;urRi+KrNA!%(Ro3>Ro79;Ri_Ku@>{;&!x%gX|{KunA_+g5QRj/g3u5Rj#g>uERj%wio/xRhS&!,!#^1U}wba{8>>@=be}qC@:D5ba{7Ku+A&!}x?ba}t>>@=be}se(aA^^^Uat!b0#{pa+awUazbGa#aLb9bgaWac'a5TbS=Br!d1#`%scp_Jvl!#rT>Re0JvX&!VyN=H{Fcm#U&:pY=ReaJv2&!]h0=]nUJvG'!6Vy|=<r%JrM_=]h2@Wlud'#)U'Wf'b]{i=]h/Jvh!&~BpWg=v]RnMx+ny#'Nu;pVwjnu=]nwxJnx,T#`&Reqwjnt=]nvieu9vrRjLLuYwP(#+!th@wih5pX~Gr'g5v/Rh4KunA'!-CARnP@wwiN:Rm_9x'cvw>!|l=<saKvAA!0&3@q}>w^e1bp#&Re2Re3BDx7gH#T|f5H|eKuZ>!%(:qNAH{]Jv6!+3B2B9=b^{X<5<B92:E{ZLvhwA(a;a%!igQuyRmad+#Y}m@3Rh5d8#X'X*:AqUAHzmaxwbh<aXRnVcF}RT#Nw&cj#U(BWnug/vsRntdka)(a3+.Zb7aYYan1!bVa@Xa}[y^@b[{G=H{+hFu73Rj&Pv#5ReQcK%T#sig1v{Rj'Ku+D#'!t]~Grm~?rkKuMB!01d5#`'Vy.ta3Dtu~Hroc8#'{^45s85AwZbP&!#Rn!wghxWn#KvEA!)&2RlA2RlBx:h|#(T,=]j09Wobz>x]z/@awRoTd+#Y(az]hFhCrm4d,#Y+jTv|Q~EfMj]uNr|~FRfOdCa!Xa9_X#@<plJvf!%b`{(9;Rgwc;.!#2x7cw#T|UDb]|T5Ju={(!=@E{&Jv)&!Ab`{'awJvf!~*>>@=be{#KuY>!+&4Ezyi[ugv&RjIdea+T)#UXa&T-T&a!Rh9auRmW=]kLg5vuRn+g3u4Rn-Ow6ARn,hHus5xNk?#UX(U~)/g8v0RkD~AwkkF?Ri.OuNBwkkA?Ri/d|a2`a*^UYa.!aBTZaTa'Xa;!(!2!-a#b2[yC>6Vyq3[xr2Wi?g1rusVh%s?DtF~<5rbJs;%!DtBfswKtCj[uvuSsEu3RgVx3o:u+wN'*Zt;@3rd~Grh~?rfg8w)Lq)qE&-a%!>bI|`jWv0vV~EfCjTv|vV~Ef@j]uNpn~FRfBcK#T']gWNu7x,k7q4ai(0!hHv8<RhmkMu9vrsBuev/RhlCJvB!,g<v{wchh~@:Rhji[vrv{wchi~@:RhkdS&a5UY#Ta!RgPwwiI5BwciI~@:Rh`x'iJvj'!5]iJPu8Bwch]~@:Rhach)U#h3rp]gLh@t|Ax,hTq3ah!-(~@:Ro0Ou!5RhXj^v(pyw8unRhVd|)`,^UYas!a?/a2Z'a^Ta{Tb7Ta(a#!a,Wf&9sZ3DtAadamov=Bqt3[xig8vsRm~>waiL2b`{QJv*_Ouv2qgj<v]v2BqfdR'X*X#Y-@3qr~Gqv~?p6hHv-]glPup5Lq+q?_%*b_{qF{n9b^{rOu4ARhpKvCD!+&~Bqp:5Dbb}nwoiKl&unuTuBv]v+ueunaXRf0=Jvh!0nKufu8v1w&w7q%w&uHrz:Rgnj5w,uxDJq/(!hNw'5ReCk0s2u3w/w'5ReFd>Za&!*UaA=<wkgsRnSJv^!%Refifw3vyRgOKu_B'!,<]gkiiu:w&Rh<=C@a^<B57@2F{[<B5@aW:=3away9A5aW=<B=C@a^<B57@2F{Ie-#`(^^^bCara.b8aza6!/bZ,!adTbnTbOb+aFaS!aAT9@Wf~2Wli3Dtl2@d,#Y&RfnRfmJwJZtN~GqyJva&!VyMg<v~Rm%iXuJu3Rm9Jv[_=]ih9wlkDRkCd1#`(@Wg>2Wls3cH#T(@<Rj*=>Ri|b~'#23s9h<~El.d'#Y&Dtxi^rzvdRl#d*#U%(o|B2s`hJwSaxRmDKv4B&!1:Rmdd5#`'Vx}to~Hq{x'f1v3(!BA5ba|bJv_&!Wfug1v]ReIdO+U/Y#&G}-8wze=Rh{g1v]ReHg/uQRf/by#)ibQwERl/cH#T(@<Rj+=>Ri{cNu+vlax-!(#a0qa9<Rii2;;bU{H;x<i=&X#Rk`<4wwi=C9H~8xAI(Y#<azRi@45wXI<B9;5bb~7dL(X#Xa(+!aL6Vy{g5QqOau:5au2@ay547EzbxOcU(UX-T#Ta#:Cbb|A?wjh/b_|SOw6ARgtihr}u7Rhy<d1#T)X1@@=I|~=ay<2@@=aybb}Sj3vLv;<d,#Y(56H}A978H}@dGpvs@uAu`vcw9*!aFa+ai%(b!aXa8.a?a[ozWey=sU2@G}Nch&U#Rf_WexKu+D#'!t:~Gr`~?r^j]uNr|~FRg*j^psurwJt|RmcKv)@&!)7Rkv~Br[@wxfO:Rl3co#U'6Rezj_q#vIuavjRltwzeyh@vr5JqD0!>aY?C9:9au@9Cb]}9cl#U*5;5<H||jbuus1ucv&Rfvg1v~d/pppzqFr^a--a~!aMat1(hFv;Wiz@@=Izoj5uuv-7Rix~Cw`fk2WlVcZ#X,k)u3vWs@u2]ktg;wEx'fBq(_2Wg/jTv|vV~EfoJv]!15x'hzqG!(P~EfU~CRl_j6v(us5x4i-#T(2WmZ?C2F|d>Kq<aj1!*jTqIsBv=Wl`~Cw`fi2WlWj`v0u*~>RlR=c>Z,k#u3vWs@u2]kr<c1Z+jTqIsBv=Wla~Cw`fm2WlXdmb3!a{(arZa`bkTa%TbQTa-a9+c'!aM!/[yL=Bqug.w'RifhFvyDRj.g>vgwyk^9]k^Jv3_@WfbAARkhJw2_[x|JvB_wkoIRoKwkoJRoLd'(Y#<]gm=<9<H|yd'%_X#skDtb3awwqkgNulRkgdB#^',9:p'hJwSaxRmEBwVb8@4=H|qLu+w50&!)@3qs~?pU>Awwn;;Rn=c:Z'ARn<=<qwKvC@!/&~BqqJv6!&]eVb^z^xRge'/a%+^`#Sge}6<4Rn3=]n0Pw2>Rn8Jw0!&>Rn:>Rn6cY#a7+!a&=<wkaNw~h3z_c5Z{=wjh#=]nLKv^D!&)Vyz=bW|swYb<WetcG#T(2wxa@qVx@gD#Y&b^|V5JwG&!5bb|pg/w&RgD@x=kHs=uAvn!a%%/'+RmSRh694Ro`g-vaRmRhHv-]mlxCcS#`&ba~.5cD#Ta)P~=d,#Y(56H{>978H{Dd_#{2^Y%_+qbbb{6g3sERhsbU{?dfa.,`a(Xa<!aiX#(55RiG54RiHcI#T'WiU3RiVNvdwtfcRlKNvdd,#Y&RlHRlExQgf.1*^T'X#Sgf}6Wn4=]hfPrk>Rn7Jw0!&>Rn5>Rn9Lunw?&a2!,5<oq@@wqfdRlJj5Q~=d,#Y(~ARfcOuN]fdDKw;ay(}i!547E}j?cI#T(@5bV}iCbV}hdv(^^Tb?a40,b##Tbo!a*bR!a<b|a/!aKai!aU[yK=]o^g:v>ReGJwPZtK<7Rh+h<~El,Pv#5ReR@awwxjCg,ulRjDJv6&!]j!z?aQeeg>w=Sh<eeJw;!&axEzOg,Qosc!#*:wkeJ]eJ>x'h-u(!%Ro.w~h.zPdNZ(X,Ya![x{;9ReY;wkgxRiF:x?ap#Y&RmUg<s2Rkod]+UY0TZ'!a&A9sw<=bczLNvuw{gqzNhJwSaxRmCKuLay!#&s_Rf-55b^{uJvZa!!c%#(55Ri654wmiu5RiuawLu,vp!+}^%b_}Y9;wkgxba}o>A9:=b^}zKuh=a''!3awRk3c*'!#aHRk6c+Z&Rk5Rk4Jv)&!awRjSawd9*`#0?C2@EzMj8u<uJ5RmbjQrquJu3x,k>uq@_+=ayb^|W~ARkEOuN]k@7dhzV^X/X&a-#zRzSb`zXcJzTT#2WkVKvDBzW!%FzY9;5bbzWjQrquJu3Jw3%!b`zU=ayb^zQd:#X(T-a!6Vyywxh}=b]{Jg=u1RiAdGp~qHtzv!w(wA+a+a;<!aJaYai'anasb(=azRmV:Cbb{MLq2vb!%')RjuRjrRjtRjqx3jnqCw3!%')Rk(Rk+Rk&Rk)Lq2vb!%')Rj{RjxRjzRjwLq2vb!%')RjsRjpRjfRjex3jcqCw3!%')Rk'Rk*RjkRjl9<CbbzfOu4ARhxLq2vb!%')RjyRjvRjhRjgx=joq*uKvb!%')+-Rk.Rk%Rj~Rk-Rk#Rj}x=jdq*uKvb!%')+-Rk,Rk!Rj|RjmRjjRjidAq&qKs@uAv8Aa.'*-a@a&0!aM@a5[y73Dsy3Ds|3Dt):wxgI2sHJwJZt.~Gqxwsf0ikrzt}Rl0Jvy_[xj~HqzKv_A|D!&WfP8axRoVcf,U#k(v]v+ueunaXRf1Ju}'!g8u#Ri=jQw!sCunLprq>!,')~<5qeGzq9F{W=c##%s5au:5aU3CBE|;d4#X(D!a&6Vygx(b;#(=]ed?C2F{N<capoq2r[a&!aPa9,'Pw;5s:@@=I|,55w_h|@@=IzcP~=x'fCqB_2Wl2>aU@@=I|1OuNBc1Z+jTqIsBv=Wlc~Cw`fl2WlZ~AcTa%!Z+jTqIsBv=Wlb~Cw`fh2WlYk+uNqJsBv=WlSg,u3dca3#UXaMYa)TaB-=cM|7T#<bI}l5@B932:aV2G{BOuNBJq:|M!5Ezt=<B=C@a^<B57@2F{v>cB{/T#=ay<bI{3Jv6!a.6BKq0ah&+!5E}HP~Ef{978BaU@@=Iza<7d#.Y#978BaU@@=IzH~AJq0!(@@=IzG978BaU@@=IzFe,aU*Y&^^^bvJb,b:bFad!a,c2Ta>aL.bo6!a#CbTa'T#Re{2Wlh2@G{yg6t~Ro_NvdRfticuRQRllJv3&!x&c|zs@Jw3!%RflwpfkRlpKuL;%(!Re<@G|C2GzdhIvuBwgjAg-u0RjAKQB%!(GzZ@G|5NuuRl7d='T+Y#Vy[g<v~Rm!==G|>JvA!)@wma=]m1ifuaw&RmnLs@vT'!|/+[y,g:v>ReTJw1!#qX=x!eC{bLu+wT&)ZtZauq_~Graci&U#F|89:r_Lupvq!.)&2RlG8RfaC=x!eF{_h?rpWlmd&'!#X|&]k::xJey#`'T|+<E|&2@H|%dE#(^,g;u.RiEg6vjRiC9xCkA{O|zY#g=ucRmXKs0@!&*@G|m@awRknJuh!,3d(}gY}eJvj!%Rm):Jw3!%Rm+Rm-Ls0w(&!a(a#@b[|6cZ#X'7RkxWgAOu4ARn'dH'U#Y*Vz-Wm'CARm}d]*#a%^a*T'aK!a<9bV{PC=p*Jw4!&SgxcbB5r]idw(wBRmF7xFkt#&`(Rm/Rm8E|!JuY_9:Rl5=wrgr2:bbxd@xXfB(a*#T+!.X0X1Ta/a'T&RlDRfL>RlyARl9b[z[>RfZ:RlL:RfRwlg/ARl;9;RlxKv,A/!%7s69<74=BA5ba{-8Bde#`a<XaKYa1,a'P~=wxfB2bZ}}?C972@@=I}r8@55B9;5bb}G978B2@@=aybb}3j3vLv;<Jw3&!>Rfk=ayb^}4~Ad1#`*@@=aybb{w2@>==<bbz]dx+UY#^UaF!a9!bB'Ya1.!ajXa#%olRhD[y=3Dt#Ov5BrHKuMB%!(Rf^Wep~HrJwkiQjKr|~FRg)Ku+D#'!t5~GrF~?rDdV)UY,Z/_7RkuG{<~BrBg,rlsO:235B@bX}|d?a1!#`(6Vyn5@d##Y+jTv|vV~EfIj]uNpn~FRfH7Lq2vb1!a9-978BaU@@=Iz9978BbU}#~AJq0!(@@=Iz8978BaU@@=Iz7~AJQ|}!978BbU}!JvkaK!AdUa21-U#`a+(g/vsRn~Ou!5RPj:rmu9WhOjXuvvNr}:RhAj^v(pyw8unRn[kPr}p|u7vwv]RiSBd;pppzq@qHQa?(b.!a.a`@.|xa(hFv;Wiyj5uuv-7Riw~Cw`fg2WlU978BbU|wOuNBJqG!(P~EfD~CRlQcZ#X,k)u3vWs@u2]ksg;wEx'f@q1_2Wg.j]uNpn~FRfqJv]!15x'h{qG!(@@=IzK~CRl^j6v(us5x4i,#T(2WmY?C2F{1>Kq<aj1!*jTqIsBv=Wld~Cw`fj2Wl[j`v0u*~>RlT=c>Z,k#u3vWs@u2]kq<c1Z+jTqIsBv=Wle~Cw`fn2Wl]dn1#c(a(b^a2!b/bAT(bj!aDa7bu,a_a{c0!2T0g:v>ReD2@G{42@G{5~DpM~<5rc=Bx6i>{RT#RnI@zCx]y]z:2Jv[!zr5Awyk]9]k]dD(Y+X#6Vz.g=wKtgwhaCwgmTWj2Lu,w%_+/[y-B;b^xeg3u3Rj-2@bX{*KrJ<!+'@Wg(g?QRlC@Jv`!%b[zIwsfII}8JQ_@w|kW|=Jv(%!AqcOuNBJvEzh!bYzjLs@wP#(0!oy@>RkdJwMZtc3Dtd@BcG#T'9bWxg2@2Fznd*#Y+;2x'c}w<zizixNgwa#Z'U+!/!a'!a+w~g~z6wcn{Rn}wcnzRn|5Rh%=]nJg5vuRmvNvdRlvcprJu}w*az*a#!%.a.'Bot9qT]kj@Wg'ay2Gzv@Jv`!%b[zEwsfHI}1;ck#Ux`<Cbbx_Lu+w!a&0*!wko*wwo,So,}6Juqxf!E}PigQuyRm`d3(`#8>Rn%:A5B;bZ~%KvhCa!a2!x>k7#Uxb@b{#xaRk7Jw0!)>wwhlShl}6>wwhmShm}6CJvB!.x'hhvj{!!5Bwkhhbaz}x'hivjz~!5Bwkhibaz|xEhTrNu,v-vpD!a%&/)a3a.,%Ro2t[CE{)@3re9b]{%wjo09:rgc:Z&Ro6=<riifuaw&RmoKrNA!%(Ro4>Ro89;Ri`dSaL'UYzxZb)7Rka3xRhT&!,!#^1U}vbaz{>>@=be}yC@:D5bazzKu+A&!}{?ba}y>>@=be}wxBh[t`u~vJvr!%a!a()a,a0a4RoC=]o;Ju(!%RoGRhdwjh`=]oAg>w#Ro?g5vuRo=NvdRl|Ku]C.!&;RoEJvB!%RoORoMBx'h[v+_?w~h`}~5?w~hd~!xKh]oiptu-utv.vp!#%&a30a@a'a+(a/aOp(o~p!RoDJu(!%RoHRhewjha=]oBNvdRl}g>w#Ro@g5vuRo>c[#X']o<CauRoRAd-#Y':RkpauRoQKu]C.!&;RoFJvB!%RoNRoPBx'h]v+_?w~ha}t5?w~he}ue!/UbhYacXaW^Tc&a;b:a-c/#b&aja1(!cL+!bKbt!bmcRc9aIc?8[yW3Dtt94Rg`Jv}!&SiRMzBhEebShEMNuPRe>x7gL#TzuwjirRipc<Z&>on;>z=h-MSh.Mwqczx'a7vj&!>Re4@=ResJt__NuPRi*NuPRi)j]uNr|~FRfzKrJ>_+@Wfy@Wf]2WocKrJ<!+'@Wg%g/QRl@@Jv`!&awRl<wsfFIzgLu(w*!.*&ShBMwvhIRhI9;RhNx1hK'!#Sn]Mx1hK~0!#:2<H~7cNu+w7D*'1ZtW>Rn1~?rOc:Z&Rn2=<rQ<7wjh&=BSnLMc]#X(6Vz)w[b=a!U#9wzgMc3#&(RgMRitRis<x,gKt`ax!&+SioM=BSilMc3#&(RgKRinRimKurB,!&SiQMzBhDebShDM6BJQ!(P~Efx978B2@@=I}WLrJw!!,a*&@G}O@9wkibRid@@x'fKwC!&SlDMSfLMjUv~Q~EfKKv3@a+!(hFv-]mpx/hYZ(C5RiWz<o/MwkhY?So/M@x,gbvfB*&!SgEM:SoeeehFu3:Rgbda(,^TZa)X/7Sg[eb:2RgI~BrMC@wgkc:wwkcRerx3h(uUvK!&*,SnOM4Sh*MArRg;wHRh(x=h;rJvPwI!a4',a'0@Wg&=BSh/Mg>w=Rh=g3w*wwgGRgGcW(X#;Sg}M2Gzk@Jv`!&awRl=wsfGIz`dKZ*T'Y-:RhR7RhQg5u-p`j6v(us5d,#Y+~Awkia?RicOuNBwkibba}Ld6p~tyu_vbAa'a+!a/'a3aEa8a!>Sh,ebJv{!&Sh@ebSaReb9;SgwebNuPRi(NvdRl)NuPRi'hHu^<Rm^Jvv_@Wl(g;u1Si/ebKu'B&!*Sh?eb@Wl'z@aPeb95Si.ebcpputyvjB)!,&a+0a%ShAMWeK@G}C@WfJ9;RhMwvhH9w{ia}ix,hJvRA1(!zAn[MRhHx1hJ~*!#hFv(BSn[MBJQ!(@@=I~'978B2@@=I}2db.Ua<'X}+T#a0XaG2G}E;wkg|wuh!Rh!x,hZu,@)!&So0MVy)C5RiXACJvB!&5RiY5RiZg8w)cG}*T#2@bU}=KsA>(!a.3wkhZba~(x,h^u(A!&(SoCMRhb5Bz=h[eb?w~hb~6x,h_u(A!&(SoDMRhc5Bz=h]eb?w~hc~6e)aA1T#T,^^^c-bMb&blcPaP(a/!0!bA=b5c@a(!bfbrc#2afwmhARnjwchORnp2Wlf3DtsNvdRl-2@wpa<]m0bx(#:awRk2@Jw3!%RfhwpfgRlnKQB%!(G{V@G|'NuuRl6d='T+Y#VyUg<v~Rl~==G|<Jv+'!aYShC}6@B<5?ba~8@Jw3'!g2QRljhLrpWlOd+#Y'g.w'rIg>w*wgj@g-u0Rj@Lu+wT&)ZtUauq]~GrGci&U#F|39:rELrNvj!.%*RhCwunfw~nf~:9;Ri]>wtnhg;wHRnhx3hDs@v~!/+'@Wfr@9RkSNu&Rlo=@<5GzoKs0@_+@Wl+@awRkmJuh!-3d(}pY#qWJvj!%Rm(:Jw3!%Rm,Rm*de&!1U-U#`)Re;@G|.@9Ri82@wjfvRlq=@<5GzpLvOvr!).&2RlF8Rf`C=x!eE{.Jw3_g2QRlkhLrpWlPde(!#U{s,UXa*Ta'[y'g:v>ReS;x0PZ&RnlRnn~HrKJw1}f!=x!eB|2w]aP(#Xa&a*Ta.Ua2a7=]iOd'#Y&Ro&WnWg;u.RiDg6vjRiBNvdRlzhNvj]nYJuW_2Wm3x)kFze{9d])!a.!,Y01!#&aC!a3RndC=ox~BrC@2b^{pg,rlse7x'ksuq!%Rm.E{xidw(wBRmGx9o+)X#wwo-So-}69:Rl4@xSf@a#XZ'X)X,Ta(/ARl8b[xc>RfY:RlI:RfQwlg.ARl:9;Rlwdn'#^XafaQa1X1TaHTa)@b[{zcZ#X'7RkwWg@Ou4ARn&x)kG#{,g7u/RkGdH'U#Y*Vz'Wm&CARm|bx#(A]gUbUzJj9Q~=d,#Y(56H}l978H{U7d,0#U*2>ABb_xZ978BbU{e~AJQ{g!978BbU{hxMh?ad{oUYZ.x1h?{l!#:2<H{mx3n[t{vl!,&a%3Ro(z=iS}6ARnr=Bwsn^wvn`Rnbd`*T}B0!#^X'BG{c9b]{a>>@=be}F?JvS!&BG{d7BG}(Bde#`a1X,Ya@!a'P~=wxf@2bZ}I56B2@@=aybb}08@55B9;5bb}<j3vLv;<Jw3&!>Rfg=ayb^}&OuNBKuLA!)a!P~=x#fD{f2@>==<bbzl?C972@@=Ix^d6rSu,v7w*C(0a)a6#B+a%!sQ[y?3Dt%3[xn~<5rLOu!5p@Ku+D#'!t7~GrP~?rNKvlaya7'!h+v-5qMg=t|cd,U#5AAaa5Abb{S@52B5@a[@52B5Gx[iXueu;d<#`a(!/549C;ag>23ExY5@Dah89b^~689Jv)!~2b[~1Lv'w(%*!a#bX|aPrmawRe]keu7uhv-q6rxu,q`xTo]/a5aU!bNaDXbi!b-!ao!b<bwA!#5@B932:aV2G|:d-)Y#hJrL>RhG<7@C5<H|_=Cau:5aj5@B932:bJ|ng>vIbs)#?C2F|9jPv0w.vISh-MKvUaz(.!9ABbb|[5;5<H|Eg>unwfh;9:4E|YjQsBt|vjx'hYq3!(?C2F|J:2<BaY?C2F|GOu!5x,g|p{ah!-(?C2F|c9:4E|OjXuvvNr}:Rh&i[w*t|cd+U#jJvsu)vsSn~Mkfrmu9p}u7vwv]So!McW#Xa!ax5@A5aY:5;5<H|>kJv~vYrquJu3x4ib#T)2@SmZM?C2F|Bj:rmu9@xPhI(a*a#U#`a3-5Abb|L~@:RhK9:4E|0@52B5G|#C::aY?C2F|-:2<BaY?C2F|.5Jvk!a)javYrquJu3x4ia#T)2@SmYM?C2F|HAxPhH(!a#U#`a*-5Abb|4~@:RhJ9:4E|R@52B5G|F:2<BaY?C2F|Sc^#Xa2j=Qq5CJvB!-g<v{z;hhM?C2F|Zi[vrv{z;hiM?C2F|XKsA>!a)-g<v{z;h[eb?C2F|]i[vrv{z;h]eb?C2F|^iZu.vix,hZq3ah!.(?C2F|QOu!5ShXM:2<BaY?C2F|P", 13494, 2713, 49, 25, 61), pe;
(function(e) {
  e[e.VALUE_LENGTH = 49152] = "VALUE_LENGTH", e[e.FLAG13 = 8192] = "FLAG13", e[e.BRANCH_LENGTH = 8064] = "BRANCH_LENGTH", e[e.JUMP_TABLE = 127] = "JUMP_TABLE", e[e.VALUE_MASK = 8191] = "VALUE_MASK";
})(pe || (pe = {}));
function Ve(e) {
  "@babel/helpers - typeof";
  return Ve = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Ve(e);
}
function ti(e, t) {
  if (Ve(e) != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (Ve(r) != "object") return r;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function ni(e) {
  var t = ti(e, "string");
  return Ve(t) == "symbol" ? t : t + "";
}
function D(e, t, n) {
  return (t = ni(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
var ke;
(function(e) {
  e[e.AMP = 38] = "AMP", e[e.NUM = 35] = "NUM", e[e.SEMI = 59] = "SEMI", e[e.EQUALS = 61] = "EQUALS", e[e.ZERO = 48] = "ZERO", e[e.NINE = 57] = "NINE", e[e.LOWER_A = 97] = "LOWER_A", e[e.LOWER_X = 120] = "LOWER_X";
})(ke || (ke = {}));
var ht = 32, rr = 21, ri = 2097151, Lt = 2047, ar = 0;
function ai(e) {
  let t = e >>> rr;
  return t === Lt ? ar : t;
}
function ii(e) {
  return e - ke.ZERO >>> 0 <= 9;
}
function si(e) {
  return (e | ht) - ke.LOWER_A >>> 0 <= 5;
}
function oi(e) {
  return (e | ht) - ke.LOWER_A >>> 0 <= 25;
}
var cn;
(function(e) {
  e[e.EntityStart = 0] = "EntityStart", e[e.NumericStart = 1] = "NumericStart", e[e.NumericDecimal = 2] = "NumericDecimal", e[e.NumericHex = 3] = "NumericHex", e[e.NamedEntity = 4] = "NamedEntity";
})(cn || (cn = {}));
var un;
(function(e) {
  e[e.Legacy = 0] = "Legacy", e[e.Strict = 1] = "Strict", e[e.Attribute = 2] = "Attribute";
})(un || (un = {}));
function li(e, t, n, r) {
  let a = (t & pe.BRANCH_LENGTH) >> 7, i = t & pe.JUMP_TABLE;
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
function dn(e, t, n) {
  return n === 1 ? String.fromCharCode(e[t] & pe.VALUE_MASK) : n === 2 ? String.fromCharCode(e[t + 1]) : String.fromCharCode(e[t + 1], e[t + 2]);
}
function ci(e, t, n) {
  let r = t + 1, a = 0, i = r;
  if (r < n && (e.charCodeAt(r) | ht) === ke.LOWER_X) for (r += 1, i = r; r < n; ) {
    let o = e.charCodeAt(r);
    if (ii(o)) a = a * 16 + (o - ke.ZERO);
    else if (si(o)) a = a * 16 + ((o | ht) - ke.LOWER_A + 10);
    else break;
    r += 1;
  }
  else for (; r < n; ) {
    let o = e.charCodeAt(r) - ke.ZERO;
    if (o >>> 0 > 9) break;
    a = a * 10 + o, r += 1;
  }
  if (r === i) return 0;
  r < n && e.charCodeAt(r) === ke.SEMI && (r += 1), a > 1114111 && (a = 1114112);
  let s = r - t;
  return s >= Lt && (ar = s, s = Lt), s << rr | a;
}
function ui(e, t, n) {
  let r = ei, a = e.indexOf("&");
  if (a < 0) return e;
  let i = e.length, s = 0, o = "", l = r[0], c = l & pe.JUMP_TABLE, d = (l & pe.BRANCH_LENGTH) >> 7;
  do {
    let p = a + 1, g = e.charCodeAt(p), f, h;
    if (g === ke.NUM) {
      let w = ci(e, p, i);
      f = ai(w), f > 0 && e.charCodeAt(p + f - 1) !== ke.SEMI && (f = 0), h = f === 0 ? "" : Va(w & ri);
    } else if (oi(g)) {
      f = 0, h = "";
      let w = g - c, _;
      if (w >>> 0 < d) {
        let R = r[1 + w];
        _ = R === 0 ? -1 : d + R & 65535;
      } else _ = -1;
      let v = 0, k = 0, z = _ < 0 ? 0 : r[_], y = p + 1;
      e: for (; y < i; ) {
        for (; !(z & (pe.VALUE_LENGTH | pe.FLAG13)) && z & pe.JUMP_TABLE; ) {
          let x = z & pe.JUMP_TABLE, q = (z & pe.BRANCH_LENGTH) >> 7;
          if (q === 0) {
            if (e.charCodeAt(y) !== x) break e;
            _ += 1;
          } else {
            let L = e.charCodeAt(y) - x;
            if (L >>> 0 >= q) break e;
            let U = r[_ + 1 + L];
            if (U === 0) break e;
            _ = _ + q + U & 65535;
          }
          if (z = r[_], y += 1, y >= i) break e;
        }
        if ((z & (pe.VALUE_LENGTH | pe.FLAG13)) === pe.FLAG13) {
          let x = (z & pe.BRANCH_LENGTH) >> 7;
          if (e.charCodeAt(y) !== (z & pe.JUMP_TABLE)) break;
          y += 1;
          let q = x - 1, L = _ + 1, U = 0;
          for (; U + 1 < q; U += 2) {
            let O = r[L];
            if (e.charCodeAt(y) !== (O & 255) || (y += 1, e.charCodeAt(y) !== (O >> 8 & 255))) break e;
            y += 1, L += 1;
          }
          if (U < q) {
            if (e.charCodeAt(y) !== (r[L] & 255)) break;
            y += 1;
          }
          _ += 1 + (x >> 1), z = r[_];
          continue;
        }
        let R = z >>> 14, b = e.charCodeAt(y);
        if (R !== 0) {
          if (b === ke.SEMI) {
            f = y - p + 1, h = R === 1 ? String.fromCharCode(z & pe.VALUE_MASK) : dn(r, _, R);
            break;
          }
          if (R === 1) break;
        }
        let M = li(r, z, _ + (R || 1), b);
        if (M < 0) break;
        _ = M, z = r[_], y += 1;
      }
      h === "" && f > 0 && (h = dn(r, v, k));
    } else f = 0, h = "";
    f === 0 || n ? a = p : (s < a && (o += e.slice(s, a)), o += h, a = s = p + f), e.charCodeAt(a) !== ke.AMP && (a = e.indexOf("&", a));
  } while (a >= 0);
  return o + e.slice(s);
}
function ir(e) {
  return ui(e, !0, !1);
}
var di = /* @__PURE__ */ bt({
  arrayReplaceAt: () => hi,
  asciiTrim: () => kt,
  callable: () => sr,
  escapeHtml: () => Le,
  escapeRE: () => wi,
  fromCodePoint: () => Qe,
  isMdAsciiPunct: () => nt,
  isPunctChar: () => lr,
  isPunctCharCode: () => tt,
  isSpace: () => re,
  isValidEntityCode: () => Ht,
  isWhiteSpace: () => et,
  lib: () => zi,
  normalizeReference: () => vt,
  unescapeAll: () => Ke,
  unescapeMd: () => mi
});
function sr(e) {
  let t = function(...n) {
    return Reflect.construct(e, n, new.target && new.target !== t ? new.target : e);
  };
  return Object.defineProperty(t, "name", { value: e.name }), Object.setPrototypeOf(t, e), t.prototype = e.prototype, t;
}
function hi(e, t, n) {
  return [].concat(e.slice(0, t), n, e.slice(t + 1));
}
function Ht(e) {
  return !(e >= 55296 && e <= 57343 || e >= 64976 && e <= 65007 || (e & 65535) == 65535 || (e & 65535) == 65534 || e >= 0 && e <= 8 || e === 11 || e >= 14 && e <= 31 || e >= 127 && e <= 159 || e > 1114111);
}
function Qe(e) {
  if (e > 65535) {
    e -= 65536;
    let t = 55296 + (e >> 10), n = 56320 + (e & 1023);
    return String.fromCharCode(t, n);
  }
  return String.fromCharCode(e);
}
var or = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, pi = RegExp(`${or.source}|&([a-z#][a-z0-9]{1,31});`, "gi"), fi = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function gi(e, t) {
  if (t.charCodeAt(0) === 35 && fi.test(t)) {
    let r = t[1].toLowerCase() === "x" ? parseInt(t.slice(2), 16) : parseInt(t.slice(1), 10);
    return Ht(r) ? Qe(r) : e;
  }
  let n = ir(e);
  return n === e ? e : n;
}
function mi(e) {
  return e.indexOf("\\") < 0 ? e : e.replace(or, "$1");
}
function Ke(e) {
  return e.indexOf("\\") < 0 && e.indexOf("&") < 0 ? e : e.replace(pi, function(t, n, r) {
    return n || gi(t, r);
  });
}
var bi = /[&<>"]/, vi = /[&<>"]/g, ki = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
};
function _i(e) {
  return ki[e];
}
function Le(e) {
  return bi.test(e) ? e.replace(vi, _i) : e;
}
var xi = /[.?*+^$[\]\\(){}|-]/g;
function wi(e) {
  return e.replace(xi, "\\$&");
}
function re(e) {
  switch (e) {
    case 9:
    case 32:
      return !0;
  }
  return !1;
}
function et(e) {
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
  return Zt.test(e) || tr.test(e);
}
function tt(e) {
  return lr(Qe(e));
}
function nt(e) {
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
function vt(e) {
  return e = e.trim().replace(/\s+/g, " "), e.toLowerCase().toUpperCase();
}
function hn(e) {
  return e === 32 || e === 9 || e === 10 || e === 13;
}
function kt(e) {
  let t = 0;
  for (; t < e.length && hn(e.charCodeAt(t)); t++) ;
  let n = e.length - 1;
  for (; n >= t && hn(e.charCodeAt(n)); n--) ;
  return e.slice(t, n + 1);
}
var zi = {
  mdurl: Za,
  ucmicro: Ha
};
function yi(e, t, n) {
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
function Ri(e, t, n) {
  let r, a = t, i = {
    ok: !1,
    pos: 0,
    str: ""
  };
  if (e.charCodeAt(a) === 60) {
    for (a++; a < n; ) {
      if (r = e.charCodeAt(a), r === 10 || r === 60) return i;
      if (r === 62) return i.pos = a + 1, i.str = Ke(e.slice(t + 1, a)), i.ok = !0, i;
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
  return t === a || s !== 0 || (i.str = Ke(e.slice(t, a)), i.pos = a, i.ok = !0), i;
}
function Ei(e, t, n, r) {
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
    if (a = e.charCodeAt(i), a === s.marker) return s.pos = i + 1, s.str += Ke(e.slice(t, i)), s.ok = !0, s;
    if (a === 40 && s.marker === 41) return s;
    a === 92 && i + 1 < n && i++, i++;
  }
  return s.can_continue = !0, s.str += Ke(e.slice(t, i)), s;
}
var qi = /* @__PURE__ */ bt({
  parseLinkDestination: () => Ri,
  parseLinkLabel: () => yi,
  parseLinkTitle: () => Ei
}), $e = class {
  constructor(e, t, n) {
    D(this, "map", null), D(this, "level", 0), D(this, "children", null), D(this, "content", ""), D(this, "markup", ""), D(this, "info", ""), D(this, "block", !1), D(this, "hidden", !1), this.type = e, this.tag = t, this.attrs = null, this.nesting = n, this.meta = null;
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
}, rt = class {
  constructor() {
    D(this, "__rules__", []), D(this, "__cache__", null);
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
}, Ee = {};
Ee.code_inline = function(e, t, n, r, a) {
  let i = e[t];
  return `<code${a.renderAttrs(i)}>${Le(i.content)}</code>`;
}, Ee.code_block = function(e, t, n, r, a) {
  let i = e[t];
  return `<pre${a.renderAttrs(i)}><code>${Le(e[t].content)}</code></pre>
`;
}, Ee.fence = function(e, t, n, r, a) {
  let i = e[t], s = i.info ? Ke(i.info).trim() : "", o = "", l = "";
  if (s) {
    let d = s.split(/(\s+)/g);
    o = d[0], l = d.slice(2).join("");
  }
  let c;
  if (c = n.highlight && n.highlight(i.content, o, l) || Le(i.content), c.indexOf("<pre") === 0) return c + `
`;
  if (s) {
    let d = i.attrIndex("class"), p = i.attrs ? i.attrs.slice() : [];
    d < 0 ? p.push(["class", `${n.langPrefix}${o}`]) : (p[d] = [p[d][0], p[d][1]], p[d][1] += ` ${n.langPrefix}${o}`);
    let g = { attrs: p };
    return `<pre><code${a.renderAttrs(g)}>${c}</code></pre>
`;
  }
  return `<pre><code${a.renderAttrs(i)}>${c}</code></pre>
`;
}, Ee.image = function(e, t, n, r, a) {
  let i = e[t];
  return i.attrs[i.attrIndex("alt")][1] = a.renderInlineAsText(i.children, n, r), a.renderToken(e, t, n);
}, Ee.hardbreak = function(e, t, n) {
  return n.xhtmlOut ? `<br />
` : `<br>
`;
}, Ee.softbreak = function(e, t, n) {
  return n.breaks ? n.xhtmlOut ? `<br />
` : `<br>
` : `
`;
}, Ee.text = function(e, t) {
  return Le(e[t].content);
}, Ee.html_block = function(e, t) {
  return e[t].content;
}, Ee.html_inline = function(e, t) {
  return e[t].content;
};
var cr = class {
  constructor() {
    D(this, "rules", Object.assign({}, Ee));
  }
  renderAttrs(e) {
    let t, n, r;
    if (!e.attrs) return "";
    for (r = "", t = 0, n = e.attrs.length; t < n; t++) r += ` ${Le(e.attrs[t][0])}="${Le(String(e.attrs[t][1]))}"`;
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
    D(this, "tokens", []), D(this, "inlineMode", !1), D(this, "Token", $e), this.src = e, this.env = n, this.md = t;
  }
}, Ci = /\r\n?/g, Ai = /\0/g;
function Ni(e) {
  let t;
  t = e.src.replace(Ci, `
`), t = t.replace(Ai, "�"), e.src = t;
}
function Di(e) {
  let t;
  e.inlineMode ? (t = new e.Token("inline", "", 0), t.content = e.src, t.map = [0, 1], t.children = [], e.tokens.push(t)) : e.md.block.parse(e.src, e.md, e.env, e.tokens);
}
function Si(e) {
  let t = e.tokens, n = 0;
  for (let r = 0; r < t.length; r++) t[r].type !== "reference_definition" && (r !== n && (t[n] = t[r]), n++);
  t.length !== n && (t.length = n);
}
function Ti(e) {
  let t = e.tokens;
  for (let n = 0, r = t.length; n < r; n++) {
    let a = t[n];
    a.type === "inline" && e.md.inline.parse(a.content, e.md, e.env, a.children);
  }
}
function Fi(e) {
  return /^<a[>\s]/i.test(e);
}
function Mi(e) {
  return /^<\/a\s*>/i.test(e);
}
function Ii(e) {
  let t = e.tokens;
  if (e.md.options.linkify) for (let n = 0, r = t.length; n < r; n++) {
    if (t[n].type !== "inline" || !e.md.linkify.test(t[n].content)) continue;
    let a = t[n].children, i = [], s = 0;
    for (let o = a.length - 1; o >= 0; o--) {
      let l = a[o];
      if (l.type === "link_close") for (o--; a[o].level !== l.level && a[o].type !== "link_open"; ) o--;
      else if (l.type === "html_inline" && (Fi(l.content) && s > 0 && s--, Mi(l.content) && s++), !(s > 0) && l.type === "text" && e.md.linkify.test(l.content)) {
        let c = l.content, d = e.md.linkify.match(c), p = [], g = l.level, f = 0;
        d.length > 0 && d[0].index === 0 && o > 0 && a[o - 1].type === "text_special" && (d = d.slice(1));
        for (let h = 0; h < d.length; h++) {
          let w = d[h].url, _ = e.md.normalizeLink(w);
          if (!e.md.validateLink(_)) continue;
          let v = d[h].text;
          v = d[h].schema ? d[h].schema === "mailto:" && !/^mailto:/i.test(v) ? e.md.normalizeLinkText(`mailto:${v}`).replace(/^mailto:/, "") : e.md.normalizeLinkText(v) : e.md.normalizeLinkText(`http://${v}`).replace(/^http:\/\//, "");
          let k = d[h].index;
          if (k > f) {
            let b = new e.Token("text", "", 0);
            b.content = c.slice(f, k), b.level = g, p.push(b);
          }
          let z = new e.Token("link_open", "a", 1);
          z.attrs = [["href", _]], z.level = g++, z.markup = "linkify", z.info = "auto", p.push(z);
          let y = new e.Token("text", "", 0);
          y.content = v, y.level = g, p.push(y);
          let R = new e.Token("link_close", "a", -1);
          R.level = --g, R.markup = "linkify", R.info = "auto", p.push(R), f = d[h].lastIndex;
        }
        if (f < c.length) {
          let h = new e.Token("text", "", 0);
          h.content = c.slice(f), h.level = g, p.push(h);
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
        let g = i[c];
        if ((g == null ? void 0 : g.index) === p) {
          for (let f of g.nodes) l[d++] = f;
          c++;
        } else l[d++] = a[p];
      }
      t[n].children = l;
    }
  }
}
var dr = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/, Oi = /\((c|tm|r)\)/i, Bi = /\((c|tm|r)\)/gi, Li = {
  c: "©",
  r: "®",
  tm: "™"
};
function $i(e, t) {
  return Li[t.toLowerCase()];
}
function Ui(e) {
  let t = 0;
  for (let n = e.length - 1; n >= 0; n--) {
    let r = e[n];
    r.type === "text" && !t && (r.content = r.content.replace(Bi, $i)), r.type === "link_open" && r.info === "auto" && t--, r.type === "link_close" && r.info === "auto" && t++;
  }
}
function Pi(e) {
  let t = 0;
  for (let n = e.length - 1; n >= 0; n--) {
    let r = e[n];
    r.type === "text" && !t && dr.test(r.content) && (r.content = r.content.replace(/\+-/g, "±").replace(/\.{2,}/g, "…").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/gm, "$1—").replace(/(^|\s)--(?=\s|$)/gm, "$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/gm, "$1–")), r.type === "link_open" && r.info === "auto" && t--, r.type === "link_close" && r.info === "auto" && t++;
  }
}
function ji(e) {
  let t;
  if (e.md.options.typographer) for (t = e.tokens.length - 1; t >= 0; t--) e.tokens[t].type === "inline" && (Oi.test(e.tokens[t].content) && Ui(e.tokens[t].children), dr.test(e.tokens[t].content) && Pi(e.tokens[t].children));
}
var Ji = /['"]/, pn = /['"]/g, fn = "’", Wi = 1e3;
function gn(e, t, n) {
  for (; e.length > n; ) {
    let r = e.pop();
    r.isSingleQuote ? t.single = r.prevSameQuoteIdx : t.double = r.prevSameQuoteIdx;
  }
}
function st(e, t, n, r) {
  e[t] || (e[t] = []), e[t].push({
    pos: n,
    ch: r
  });
}
function Zi(e, t) {
  let n = "", r = 0;
  t.sort((a, i) => a.pos - i.pos);
  for (let a = 0; a < t.length; a++) {
    let i = t[a];
    n += e.slice(r, i.pos) + i.ch, r = i.pos + 1;
  }
  return n + e.slice(r);
}
function Hi(e, t) {
  let n, r = [], a = {
    single: -1,
    double: -1
  }, i = {};
  for (let s = 0; s < e.length; s++) {
    let o = e[s], l = e[s].level;
    for (n = r.length - 1; n >= 0 && !(r[n].level <= l); n--) ;
    if (gn(r, a, n + 1), o.type !== "text") continue;
    let c = o.content, d = 0, p = c.length;
    e: for (; d < p; ) {
      pn.lastIndex = d;
      let g = pn.exec(c);
      if (!g) break;
      let f = !0, h = !0;
      d = g.index + 1;
      let w = g[0] === "'", _ = 32;
      if (g.index - 1 >= 0) _ = c.charCodeAt(g.index - 1);
      else for (n = s - 1; n >= 0 && e[n].type !== "softbreak" && e[n].type !== "hardbreak"; n--) if (e[n].content) {
        _ = e[n].content.charCodeAt(e[n].content.length - 1);
        break;
      }
      let v = 32;
      if (d < p) v = c.charCodeAt(d);
      else for (n = s + 1; n < e.length && e[n].type !== "softbreak" && e[n].type !== "hardbreak"; n++) if (e[n].content) {
        v = e[n].content.charCodeAt(0);
        break;
      }
      let k = nt(_) || tt(_), z = nt(v) || tt(v), y = et(_), R = et(v);
      if (R ? f = !1 : z && (y || k || (f = !1)), y ? h = !1 : k && (R || z || (h = !1)), v === 34 && g[0] === '"' && _ >= 48 && _ <= 57 && (h = f = !1), f && h && (f = k, h = z), !f && !h) w && st(i, s, g.index, fn);
      else {
        if (h && (n = w ? a.single : a.double, n >= 0 && r[n].level === l)) {
          let b = r[n], M, x;
          w ? (M = t.md.options.quotes[2], x = t.md.options.quotes[3]) : (M = t.md.options.quotes[0], x = t.md.options.quotes[1]), st(i, s, g.index, x), st(i, b.tokenIdx, b.contentPos, M), gn(r, a, n);
          continue e;
        }
        if (f) {
          if (r.length >= Wi) return;
          r.push({
            tokenIdx: s,
            contentPos: g.index,
            isSingleQuote: w,
            level: l,
            prevSameQuoteIdx: w ? a.single : a.double
          }), w ? a.single = r.length - 1 : a.double = r.length - 1;
        } else h && w && st(i, s, g.index, fn);
      }
    }
  }
  Object.keys(i).forEach(function(s) {
    let o = Number(s);
    e[o].content = Zi(e[o].content, i[s]);
  });
}
function Ki(e) {
  if (e.md.options.typographer) for (let t = e.tokens.length - 1; t >= 0; t--) e.tokens[t].type === "inline" && Ji.test(e.tokens[t].content) && Hi(e.tokens[t].children, e);
}
function Gi(e) {
  let t, n, r = e.length;
  for (t = 0; t < r; t++) e[t].type === "text_special" && (e[t].type = "text");
  for (t = n = 0; t < r; t++) e[t].type === "text" && t + 1 < r && e[t + 1].type === "text" ? e[t + 1].content = e[t].content + e[t + 1].content : (t !== n && (e[n] = e[t]), n++);
  t !== n && (e.length = n);
}
function Yi(e) {
  let t, n, r = e.tokens, a = r.length;
  for (let i = 0; i < a; i++) {
    if (r[i].type !== "inline") continue;
    let s = r[i].children, o = s.length;
    for (t = 0; t < o; t++) s[t].type === "text_special" && (s[t].type = "text"), s[t].children && Gi(s[t].children);
    for (t = n = 0; t < o; t++) s[t].type === "text" && t + 1 < o && s[t + 1].type === "text" ? s[t + 1].content = s[t].content + s[t + 1].content : (t !== n && (s[n] = s[t]), n++);
    t !== n && (s.length = n);
  }
}
var Rt = [
  ["normalize", Ni],
  ["block", Di],
  ["strip_references", Si],
  ["inline", Ti],
  ["linkify", Ii],
  ["replacements", ji],
  ["smartquotes", Ki],
  ["text_join", Yi]
], hr = class {
  constructor() {
    D(this, "ruler", new rt()), D(this, "State", ur);
    for (let e = 0; e < Rt.length; e++) this.ruler.push(Rt[e][0], Rt[e][1]);
  }
  process(e) {
    let t = this.ruler.getRules("");
    for (let n = 0, r = t.length; n < r; n++) t[n](e);
  }
}, pr = class {
  constructor(e, t, n, r) {
    D(this, "bMarks", []), D(this, "eMarks", []), D(this, "tShift", []), D(this, "sCount", []), D(this, "bsCount", []), D(this, "blkIndent", 0), D(this, "line", 0), D(this, "lineMax", 0), D(this, "tight", !1), D(this, "listIndent", -1), D(this, "parentType", "root"), D(this, "level", 0), D(this, "Token", $e), this.src = e, this.md = t, this.env = n, this.tokens = r;
    let a = this.src;
    for (let i = 0, s = 0, o = 0, l = 0, c = a.length, d = !1; s < c; s++) {
      let p = a.charCodeAt(s);
      if (!d) {
        if (re(p)) {
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
    let r = new $e(e, t, n);
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
    for (let t = this.src.length; e < t && re(this.src.charCodeAt(e)); e++) ;
    return e;
  }
  skipSpacesBack(e, t) {
    if (e <= t) return e;
    for (; e > t; ) if (!re(this.src.charCodeAt(--e))) return e + 1;
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
        if (re(p)) p === 9 ? o += 4 - (o + this.bsCount[s]) % 4 : o++;
        else if (c - l < this.tShift[s]) o++;
        else break;
        c++;
      }
      o > n ? a[i] = Array(o - n + 1).join(" ") + this.src.slice(c, d) : a[i] = this.src.slice(c, d);
    }
    return a.join("");
  }
}, Xi = 65536;
function Et(e, t) {
  let n = e.bMarks[t] + e.tShift[t], r = e.eMarks[t];
  return e.src.slice(n, r);
}
function mn(e) {
  let t = [], n = e.length, r = 0, a = e.charCodeAt(r), i = !1, s = 0, o = "";
  for (; r < n; ) a === 124 && (i ? (o += e.substring(s, r - 1), s = r) : (t.push(o + e.substring(s, r)), o = "", s = r + 1)), i = a === 92, r++, a = e.charCodeAt(r);
  return t.push(o + e.substring(s)), t;
}
function Vi(e, t, n, r) {
  if (t + 2 > n) return !1;
  let a = t + 1;
  if (e.sCount[a] < e.blkIndent || e.sCount[a] - e.blkIndent >= 4) return !1;
  let i = e.bMarks[a] + e.tShift[a];
  if (i >= e.eMarks[a]) return !1;
  let s = e.src.charCodeAt(i++);
  if (s !== 124 && s !== 45 && s !== 58 || i >= e.eMarks[a]) return !1;
  let o = e.src.charCodeAt(i++);
  if (o !== 124 && o !== 45 && o !== 58 && !re(o) || s === 45 && re(o)) return !1;
  for (; i < e.eMarks[a]; ) {
    let y = e.src.charCodeAt(i);
    if (y !== 124 && y !== 45 && y !== 58 && !re(y)) return !1;
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
  c = mn(l), c.length && c[0] === "" && c.shift(), c.length && c[c.length - 1] === "" && c.pop();
  let p = c.length;
  if (p === 0 || p !== d.length) return !1;
  if (r) return !0;
  let g = e.parentType;
  e.parentType = "table";
  let f = e.md.block.ruler.getRules("blockquote"), h = e.push("table_open", "table", 1), w = [t, 0];
  h.map = w;
  let _ = e.push("thead_open", "thead", 1);
  _.map = [t, t + 1];
  let v = e.push("tr_open", "tr", 1);
  v.map = [t, t + 1];
  for (let y = 0; y < c.length; y++) {
    let R = e.push("th_open", "th", 1);
    d[y] && (R.attrs = [["style", `text-align:${d[y]}`]]);
    let b = e.push("inline", "", 0);
    b.content = c[y].trim(), b.children = [], e.push("th_close", "th", -1);
  }
  e.push("tr_close", "tr", -1), e.push("thead_close", "thead", -1);
  let k, z = 0;
  for (a = t + 2; a < n && !(e.sCount[a] < e.blkIndent); a++) {
    let y = !1;
    for (let b = 0, M = f.length; b < M; b++) if (f[b](e, a, n, !0)) {
      y = !0;
      break;
    }
    if (y || (l = Et(e, a).trim(), !l) || e.sCount[a] - e.blkIndent >= 4 || (c = mn(l), c.length && c[0] === "" && c.shift(), c.length && c[c.length - 1] === "" && c.pop(), z += p - c.length, z > Xi)) break;
    if (a === t + 2) {
      let b = e.push("tbody_open", "tbody", 1);
      b.map = k = [t + 2, 0];
    }
    let R = e.push("tr_open", "tr", 1);
    R.map = [a, a + 1];
    for (let b = 0; b < p; b++) {
      let M = e.push("td_open", "td", 1);
      d[b] && (M.attrs = [["style", `text-align:${d[b]}`]]);
      let x = e.push("inline", "", 0);
      x.content = c[b] ? c[b].trim() : "", x.children = [], e.push("td_close", "td", -1);
    }
    e.push("tr_close", "tr", -1);
  }
  return k && (e.push("tbody_close", "tbody", -1), k[1] = a), e.push("table_close", "table", -1), w[1] = a, e.parentType = g, e.line = a, !0;
}
function Qi(e, t, n) {
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
function es(e, t, n, r) {
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
  let p = t, g = !1;
  for (; p++, !(p >= n || (a = o = e.bMarks[p] + e.tShift[p], i = e.eMarks[p], a < i && e.sCount[p] < e.blkIndent)); ) if (e.src.charCodeAt(a) === s && !(e.sCount[p] - e.blkIndent >= 4) && (a = e.skipChars(a, s), !(a - o < l) && (a = e.skipSpaces(a), !(a < i)))) {
    g = !0;
    break;
  }
  l = e.sCount[t], e.line = p + +!!g;
  let f = e.push("fence", "code", 0);
  return f.info = d, f.content = e.getLines(t + 1, p, l, !0), f.markup = c, f.map = [t, e.line], !0;
}
function ts(e, t, n, r) {
  let a = e.bMarks[t] + e.tShift[t], i = e.eMarks[t], s = e.lineMax;
  if (e.sCount[t] - e.blkIndent >= 4 || e.src.charCodeAt(a) !== 62) return !1;
  if (r) return !0;
  let o = [], l = [], c = [], d = [], p = e.md.block.ruler.getRules("blockquote"), g = e.parentType;
  e.parentType = "blockquote";
  let f = !1, h;
  for (h = t; h < n; h++) {
    let z = e.sCount[h] < e.blkIndent;
    if (a = e.bMarks[h] + e.tShift[h], i = e.eMarks[h], a >= i) break;
    if (e.src.charCodeAt(a++) === 62 && !z) {
      let R = e.sCount[h] + 1, b, M;
      e.src.charCodeAt(a) === 32 ? (a++, R++, M = !1, b = !0) : e.src.charCodeAt(a) === 9 ? (b = !0, (e.bsCount[h] + R) % 4 == 3 ? (a++, R++, M = !1) : M = !0) : b = !1;
      let x = R;
      for (o.push(e.bMarks[h]), e.bMarks[h] = a; a < i; ) {
        let q = e.src.charCodeAt(a);
        if (re(q)) q === 9 ? x += 4 - (x + e.bsCount[h] + +!!M) % 4 : x++;
        else break;
        a++;
      }
      f = a >= i, l.push(e.bsCount[h]), e.bsCount[h] = e.sCount[h] + 1 + +!!b, c.push(e.sCount[h]), e.sCount[h] = x - R, d.push(e.tShift[h]), e.tShift[h] = a - e.bMarks[h];
      continue;
    }
    if (f) break;
    let y = !1;
    for (let R = 0, b = p.length; R < b; R++) if (p[R](e, h, n, !0)) {
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
  let _ = e.push("blockquote_open", "blockquote", 1);
  _.markup = ">";
  let v = [t, 0];
  _.map = v, e.md.block.tokenize(e, t, h);
  let k = e.push("blockquote_close", "blockquote", -1);
  k.markup = ">", e.lineMax = s, e.parentType = g, v[1] = e.line;
  for (let z = 0; z < d.length; z++) e.bMarks[z + t] = o[z], e.tShift[z + t] = d[z], e.sCount[z + t] = c[z], e.bsCount[z + t] = l[z];
  return e.blkIndent = w, !0;
}
function ns(e, t, n, r) {
  let a = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4) return !1;
  let i = e.bMarks[t] + e.tShift[t], s = e.src.charCodeAt(i++);
  if (s !== 42 && s !== 45 && s !== 95) return !1;
  let o = 1;
  for (; i < a; ) {
    let c = e.src.charCodeAt(i++);
    if (c !== s && !re(c)) return !1;
    c === s && o++;
  }
  if (o < 3) return !1;
  if (r) return !0;
  e.line = t + 1;
  let l = e.push("hr", "hr", 0);
  return l.map = [t, e.line], l.markup = Array(o + 1).join(String.fromCharCode(s)), !0;
}
function bn(e, t) {
  let n = e.eMarks[t], r = e.bMarks[t] + e.tShift[t], a = e.src.charCodeAt(r++);
  return a !== 42 && a !== 45 && a !== 43 || r < n && !re(e.src.charCodeAt(r)) ? -1 : r;
}
function vn(e, t) {
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
  return a < r && (i = e.src.charCodeAt(a), !re(i)) ? -1 : a;
}
function rs(e, t) {
  let n = e.level + 2;
  for (let r = t + 2, a = e.tokens.length - 2; r < a; r++) e.tokens[r].level === n && e.tokens[r].type === "paragraph_open" && (e.tokens[r + 2].hidden = !0, e.tokens[r].hidden = !0, r += 2);
}
function as(e, t, n, r) {
  let a, i, s, o, l = t, c = !0;
  if (e.sCount[l] - e.blkIndent >= 4 || e.listIndent >= 0 && e.sCount[l] - e.listIndent >= 4 && e.sCount[l] < e.blkIndent) return !1;
  let d = !1;
  r && e.parentType === "paragraph" && e.sCount[l] >= e.blkIndent && (d = !0);
  let p, g, f;
  if ((f = vn(e, l)) >= 0) {
    if (p = !0, s = e.bMarks[l] + e.tShift[l], g = Number(e.src.slice(s, f - 1)), d && g !== 1) return !1;
  } else if ((f = bn(e, l)) >= 0) p = !1;
  else return !1;
  if (d && e.skipSpaces(f) >= e.eMarks[l]) return !1;
  if (r) return !0;
  let h = e.src.charCodeAt(f - 1), w = e.tokens.length;
  p ? (o = e.push("ordered_list_open", "ol", 1), g !== 1 && (o.attrs = [["start", g]])) : o = e.push("bullet_list_open", "ul", 1);
  let _ = [l, 0];
  o.map = _, o.markup = String.fromCharCode(h);
  let v = !1, k = e.md.block.ruler.getRules("list"), z = e.parentType;
  for (e.parentType = "list"; l < n; ) {
    i = f, a = e.eMarks[l];
    let y = e.sCount[l] + f - (e.bMarks[l] + e.tShift[l]), R = y;
    for (; i < a; ) {
      let te = e.src.charCodeAt(i);
      if (te === 9) R += 4 - (R + e.bsCount[l]) % 4;
      else if (te === 32) R++;
      else break;
      i++;
    }
    let b = i, M;
    M = b >= a ? 1 : R - y, M > 4 && (M = 1);
    let x = y + M;
    o = e.push("list_item_open", "li", 1), o.markup = String.fromCharCode(h);
    let q = [l, 0];
    o.map = q, p && (o.info = e.src.slice(s, f - 1));
    let L = e.tight, U = e.tShift[l], O = e.sCount[l], W = e.listIndent;
    if (e.listIndent = e.blkIndent, e.blkIndent = x, e.tight = !0, e.tShift[l] = b - e.bMarks[l], e.sCount[l] = R, b >= a && e.isEmpty(l + 1) ? e.line = Math.min(e.line + 2, n) : e.md.block.tokenize(e, l, n), (!e.tight || v) && (c = !1), v = e.line - l > 1 && e.isEmpty(e.line - 1), e.blkIndent = e.listIndent, e.listIndent = W, e.tShift[l] = U, e.sCount[l] = O, e.tight = L, o = e.push("list_item_close", "li", -1), o.markup = String.fromCharCode(h), l = e.line, q[1] = l, l >= n || e.sCount[l] < e.blkIndent || e.sCount[l] - e.blkIndent >= 4) break;
    let G = !1;
    for (let te = 0, E = k.length; te < E; te++) if (k[te](e, l, n, !0)) {
      G = !0;
      break;
    }
    if (G) break;
    if (p) {
      if (f = vn(e, l), f < 0) break;
      s = e.bMarks[l] + e.tShift[l];
    } else if (f = bn(e, l), f < 0) break;
    if (h !== e.src.charCodeAt(f - 1)) break;
  }
  return o = p ? e.push("ordered_list_close", "ol", -1) : e.push("bullet_list_close", "ul", -1), o.markup = String.fromCharCode(h), _[1] = l, e.line = l, e.parentType = z, c && rs(e, w), !0;
}
var qt = 999;
function is(e) {
  let t = e.length;
  for (let n = 0; n < e.length - 1; n++) {
    let r = e.charCodeAt(n);
    if (r < 55296 || r > 56319) continue;
    let a = e.charCodeAt(n + 1);
    a >= 56320 && a <= 57343 && (t--, n++);
  }
  return t;
}
function Ye(e, t) {
  return Math.min(e.eMarks[t] + 1, e.src.length);
}
function ot(e, t) {
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
function ss(e, t, n, r) {
  let a = e.src, i = e.bMarks[t] + e.tShift[t], s = t + 1;
  if (e.sCount[t] - e.blkIndent >= 4 || a.charCodeAt(i) !== 91) return !1;
  let o = Ye(e, t), l = "", c = -1, d = ++i;
  for (; i < o; ) {
    if (l.length + i - d > qt * 2) return !1;
    let b = a.charCodeAt(i);
    if (b === 91) return !1;
    if (b === 93) {
      c = i;
      break;
    }
    if (b === 92 && (b = a.charCodeAt(++i)), b === 10 && i < o) {
      let M = ot(e, s);
      if (M < 0) return !1;
      l += a.slice(d, o), i = d = M, o = Ye(e, s++);
    } else i++;
  }
  if (c < 0 || a.charCodeAt(c + 1) !== 58 || (l += a.slice(d, c), l.length > qt && is(l) > qt)) return !1;
  for (i = c + 2; i < o; ) {
    let b = a.charCodeAt(i);
    if (b === 10) {
      let M = ot(e, s);
      if (M < 0) break;
      i = M, o = Ye(e, s++);
    } else if (re(b)) i++;
    else break;
  }
  let p = e.md.helpers.parseLinkDestination(a, i, o);
  if (!p.ok) return !1;
  let g = e.md.normalizeLink(p.str);
  if (!e.md.validateLink(g)) return !1;
  i = p.pos;
  let f = i, h = o, w = s;
  for (; i < o; ) {
    let b = a.charCodeAt(i);
    if (b === 10) {
      let M = ot(e, s);
      if (M < 0) break;
      i = M, o = Ye(e, s++);
    } else if (re(b)) i++;
    else break;
  }
  let _ = i, v = e.md.helpers.parseLinkTitle(a, i, o);
  for (; v.can_continue; ) {
    let b = ot(e, s);
    if (b < 0) break;
    i = b, o = Ye(e, s++), v = e.md.helpers.parseLinkTitle(a, i, o, v);
  }
  let k;
  for (_ !== f && v.ok ? (k = v.str, i = v.pos) : (k = "", i = f, o = h, s = w); i < o && re(a.charCodeAt(i)); ) i++;
  if (i < o && a.charCodeAt(i) !== 10 && k) for (k = "", i = f, o = h, s = w; i < o && re(a.charCodeAt(i)); ) i++;
  if (i < o && a.charCodeAt(i) !== 10) return !1;
  let z = vt(l);
  if (!z) return !1;
  if (r) return !0;
  e.env.references === void 0 && (e.env.references = {}), e.env.references[z] === void 0 && (e.env.references[z] = {
    title: k,
    href: g
  });
  let y = e.push("reference_definition", "", 0);
  y.map = [t, s], y.hidden = !0;
  let R = /* @__PURE__ */ Object.create(null);
  return R.label = z, y.meta = R, e.line = s, !0;
}
var os = /* @__PURE__ */ "address.article.aside.base.basefont.blockquote.body.caption.center.col.colgroup.dd.details.dialog.dir.div.dl.dt.fieldset.figcaption.figure.footer.form.frame.frameset.h1.h2.h3.h4.h5.h6.head.header.hr.html.iframe.legend.li.link.main.menu.menuitem.nav.noframes.ol.optgroup.option.p.param.search.section.summary.table.tbody.td.tfoot.th.thead.title.tr.track.ul".split("."), ls = `<[A-Za-z][A-Za-z0-9\\-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*"))?)*\\s*\\/?>`, cs = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>", fr = RegExp(`^(?:${ls}|${cs})`), Be = [
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
    RegExp(`^</?(${os.join("|")})(?=(\\s|/?>|$))`, "i"),
    /^$/,
    !0
  ],
  [
    RegExp(`${fr.source}\\s*$`),
    /^$/,
    !1
  ]
];
function us(e, t, n, r) {
  let a = e.bMarks[t] + e.tShift[t], i = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4 || !e.md.options.html || e.src.charCodeAt(a) !== 60) return !1;
  let s = e.src.slice(a, i), o = 0;
  for (; o < Be.length && !Be[o][0].test(s); o++) ;
  if (o === Be.length) return !1;
  if (r) return Be[o][2];
  let l = t + 1, c = Be[o][1].test("");
  if (!Be[o][1].test(s)) {
    for (; l < n && !(e.sCount[l] < e.blkIndent && (c || !e.isEmpty(l))); l++) if (a = e.bMarks[l] + e.tShift[l], i = e.eMarks[l], s = e.src.slice(a, i), Be[o][1].test(s)) {
      s.length !== 0 && l++;
      break;
    }
  }
  e.line = l;
  let d = e.push("html_block", "", 0);
  return d.map = [t, l], d.content = e.getLines(t, l, e.blkIndent, !0), !0;
}
function ds(e, t, n, r) {
  let a = e.bMarks[t] + e.tShift[t], i = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4) return !1;
  let s = e.src.charCodeAt(a);
  if (s !== 35 || a >= i) return !1;
  let o = 1;
  for (s = e.src.charCodeAt(++a); s === 35 && a < i && o <= 6; ) o++, s = e.src.charCodeAt(++a);
  if (o > 6 || a < i && !re(s)) return !1;
  if (r) return !0;
  i = e.skipSpacesBack(i, a);
  let l = e.skipCharsBack(i, 35, a);
  l > a && re(e.src.charCodeAt(l - 1)) && (i = l), e.line = t + 1;
  let c = e.push("heading_open", `h${o}`, 1);
  c.markup = "########".slice(0, o), c.map = [t, e.line];
  let d = e.push("inline", "", 0);
  d.content = kt(e.src.slice(a, i)), d.map = [t, e.line], d.children = [];
  let p = e.push("heading_close", `h${o}`, -1);
  return p.markup = "########".slice(0, o), !0;
}
function hs(e, t, n) {
  let r = e.md.block.ruler.getRules("paragraph");
  if (e.sCount[t] - e.blkIndent >= 4) return !1;
  let a = e.parentType;
  e.parentType = "paragraph";
  let i = 0, s, o = t + 1;
  for (; o < n && !e.isEmpty(o); o++) {
    if (e.sCount[o] - e.blkIndent > 3) continue;
    if (e.sCount[o] >= e.blkIndent) {
      let f = e.bMarks[o] + e.tShift[o], h = e.eMarks[o];
      if (f < h && (s = e.src.charCodeAt(f), (s === 45 || s === 61) && (f = e.skipChars(f, s), f = e.skipSpaces(f), f >= h))) {
        i = s === 61 ? 1 : 2;
        break;
      }
    }
    if (e.sCount[o] < 0) continue;
    let g = !1;
    for (let f = 0, h = r.length; f < h; f++) if (r[f](e, o, n, !0)) {
      g = !0;
      break;
    }
    if (g) break;
  }
  if (!i) return e.parentType = a, !1;
  let l = kt(e.getLines(t, o, e.blkIndent, !1));
  e.line = o + 1;
  let c = e.push("heading_open", `h${i}`, 1);
  c.markup = String.fromCharCode(s), c.map = [t, e.line];
  let d = e.push("inline", "", 0);
  d.content = l, d.map = [t, e.line - 1], d.children = [];
  let p = e.push("heading_close", `h${i}`, -1);
  return p.markup = String.fromCharCode(s), e.parentType = a, !0;
}
function ps(e, t, n) {
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
  let s = kt(e.getLines(t, i, e.blkIndent, !1));
  e.line = i;
  let o = e.push("paragraph_open", "p", 1);
  o.map = [t, e.line];
  let l = e.push("inline", "", 0);
  return l.content = s, l.map = [t, e.line], l.children = [], e.push("paragraph_close", "p", -1), e.parentType = a, !0;
}
var lt = [
  [
    "table",
    Vi,
    ["paragraph", "reference"]
  ],
  ["code", Qi],
  [
    "fence",
    es,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "blockquote",
    ts,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "hr",
    ns,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "list",
    as,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  ["reference", ss],
  [
    "html_block",
    us,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  [
    "heading",
    ds,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  ["lheading", hs],
  ["paragraph", ps]
], gr = class {
  constructor() {
    D(this, "ruler", new rt()), D(this, "State", pr);
    for (let e = 0; e < lt.length; e++) this.ruler.push(lt[e][0], lt[e][1], { alt: (lt[e][2] || []).slice() });
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
    D(this, "pos", 0), D(this, "level", 0), D(this, "pending", ""), D(this, "pendingLevel", 0), D(this, "cache", {}), D(this, "backticks", {}), D(this, "backticksScanned", !1), D(this, "skipHtmlSpecial", !1), D(this, "linkLevel", 0), D(this, "delimiters", []), D(this, "_prev_delimiters", []), D(this, "Token", $e), this.src = e, this.env = n, this.md = t, this.tokens = r, this.tokens_meta = Array(r.length), this.posMax = this.src.length;
  }
  pushPending() {
    let e = new $e("text", "", 0);
    return e.content = this.pending, e.level = this.pendingLevel, this.tokens.push(e), this.pending = "", e;
  }
  push(e, t, n) {
    this.pending && this.pushPending();
    let r = new $e(e, t, n), a;
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
    let l = nt(a) || tt(a), c = nt(o) || tt(o), d = et(a), p = et(o), g = !p && (!c || d || l), f = !d && (!l || p || c);
    return {
      can_open: g && (t || !f || l),
      can_close: f && (t || !g || c),
      length: s
    };
  }
};
function fs(e) {
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
function gs(e, t) {
  let n = e.pos;
  for (; n < e.posMax && !fs(e.src.charCodeAt(n)); ) n++;
  return n !== e.pos && (t || (e.pending += e.src.slice(e.pos, n)), e.pos = n, !0);
}
function ms(e) {
  return e >= 65 && e <= 90 || e >= 97 && e <= 122;
}
function bs(e) {
  return e >= 65 && e <= 90 || e >= 97 && e <= 122 || e >= 48 && e <= 57 || e === 43 || e === 45 || e === 46;
}
function vs(e, t) {
  if (!e.md.options.linkify || e.linkLevel > 0) return !1;
  let n = e.pos, r = e.posMax;
  if (n + 3 > r || e.src.charCodeAt(n) !== 58 || e.src.charCodeAt(n + 1) !== 47 || e.src.charCodeAt(n + 2) !== 47) return !1;
  let a = n - Math.min(10, e.pending.length, n), i = n;
  for (; i > a && bs(e.src.charCodeAt(i - 1)); ) i--;
  if (i === n || !ms(e.src.charCodeAt(i))) return !1;
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
    let g = e.push("text", "", 0);
    g.content = e.md.normalizeLinkText(l);
    let f = e.push("link_close", "a", -1);
    f.markup = "linkify", f.info = "auto";
  }
  return e.pos += l.length - s, !0;
}
function ks(e, t) {
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
  for (n++; n < a && re(e.src.charCodeAt(n)); ) n++;
  return e.pos = n, !0;
}
var Kt = [];
for (let e = 0; e < 256; e++) Kt.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(e) {
  Kt[e.charCodeAt(0)] = 1;
});
function _s(e, t) {
  let n = e.pos, r = e.posMax;
  if (e.src.charCodeAt(n) !== 92 || (n++, n >= r)) return !1;
  let a = e.src.charCodeAt(n);
  if (a === 10) {
    for (t || e.push("hardbreak", "br", 0), n++; n < r && (a = e.src.charCodeAt(n), re(a)); ) n++;
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
    o.content = a < 256 && Kt[a] !== 0 ? i : s, o.markup = s, o.info = "escape";
  }
  return e.pos = n + 1, !0;
}
function xs(e) {
  let t = {}, n = 0;
  for (; (n = e.indexOf("`", n)) !== -1; ) {
    let r = n;
    for (; e.charCodeAt(++n) === 96; ) ;
    t[n - r] = r;
  }
  return t;
}
function ws(e, t) {
  var n;
  let r = e.pos;
  if (e.src.charCodeAt(r) !== 96) return !1;
  let a = e.posMax, i = r + 1;
  for (; i < a && e.src.charCodeAt(i) === 96; ) i++;
  let s = e.src.slice(r, i), o = s.length;
  if (e.backticksScanned || (e.backticks = xs(e.src), e.backticksScanned = !0), ((n = e.backticks[o]) == null ? -1 : n) >= i) {
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
function zs(e, t) {
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
function kn(e, t) {
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
function ys(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  kn(e, e.delimiters);
  for (let a = 0; a < n; a++) {
    var r;
    let i = (r = t[a]) == null ? void 0 : r.delimiters;
    i && kn(e, i);
  }
}
var br = {
  tokenize: zs,
  postProcess: ys
};
function Rs(e, t) {
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
function _n(e, t) {
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
function Es(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  _n(e, e.delimiters);
  for (let a = 0; a < n; a++) {
    var r;
    let i = (r = t[a]) == null ? void 0 : r.delimiters;
    i && _n(e, i);
  }
}
var vr = {
  tokenize: Rs,
  postProcess: Es
};
function qs(e, t) {
  let n, r, a, i, s = "", o = "", l = e.pos, c = !0;
  if (e.src.charCodeAt(e.pos) !== 91) return !1;
  let d = e.pos, p = e.posMax, g = e.pos + 1, f = e.md.helpers.parseLinkLabel(e, e.pos, !0);
  if (f < 0) return !1;
  let h = f + 1;
  if (h < p && e.src.charCodeAt(h) === 40) {
    for (c = !1, h++; h < p && (n = e.src.charCodeAt(h), re(n) || n === 10); h++) ;
    if (h >= p) return !1;
    if (l = h, a = e.md.helpers.parseLinkDestination(e.src, h, e.posMax), a.ok) {
      for (s = e.md.normalizeLink(a.str), e.md.validateLink(s) ? h = a.pos : s = "", l = h; h < p && (n = e.src.charCodeAt(h), re(n) || n === 10); h++) ;
      if (a = e.md.helpers.parseLinkTitle(e.src, h, e.posMax), h < p && l !== h && a.ok) for (o = a.str, h = a.pos; h < p && (n = e.src.charCodeAt(h), re(n) || n === 10); h++) ;
    }
    (h >= p || e.src.charCodeAt(h) !== 41) && (c = !0), h++;
  }
  if (c) {
    if (e.env.references === void 0) return !1;
    if (h < p && e.src.charCodeAt(h) === 91 ? (l = h + 1, h = e.md.helpers.parseLinkLabel(e, h), h >= 0 ? r = e.src.slice(l, h++) : h = f + 1) : h = f + 1, r || (r = e.src.slice(g, f)), r = vt(r), i = e.env.references[r], !i) return e.pos = d, !1;
    s = i.href, o = i.title;
  }
  if (!t) {
    e.pos = g, e.posMax = f;
    let w = e.push("link_open", "a", 1), _ = [["href", s]];
    if (w.attrs = _, o && _.push(["title", o]), r) {
      let v = /* @__PURE__ */ Object.create(null);
      v.label = r, w.meta = v;
    }
    e.linkLevel++, e.md.inline.tokenize(e), e.linkLevel--, e.push("link_close", "a", -1);
  }
  return e.pos = h, e.posMax = p, !0;
}
function Cs(e, t) {
  let n, r, a, i, s, o, l, c, d = "", p = e.pos, g = e.posMax;
  if (e.src.charCodeAt(e.pos) !== 33 || e.src.charCodeAt(e.pos + 1) !== 91) return !1;
  let f = e.pos + 2, h = e.md.helpers.parseLinkLabel(e, e.pos + 1, !1);
  if (h < 0) return !1;
  if (i = h + 1, i < g && e.src.charCodeAt(i) === 40) {
    for (i++; i < g && (n = e.src.charCodeAt(i), re(n) || n === 10); i++) ;
    if (i >= g) return !1;
    for (c = i, o = e.md.helpers.parseLinkDestination(e.src, i, e.posMax), o.ok && (d = e.md.normalizeLink(o.str), e.md.validateLink(d) ? i = o.pos : d = ""), c = i; i < g && (n = e.src.charCodeAt(i), re(n) || n === 10); i++) ;
    if (o = e.md.helpers.parseLinkTitle(e.src, i, e.posMax), i < g && c !== i && o.ok) for (l = o.str, i = o.pos; i < g && (n = e.src.charCodeAt(i), re(n) || n === 10); i++) ;
    else l = "";
    if (i >= g || e.src.charCodeAt(i) !== 41) return e.pos = p, !1;
    i++;
  } else {
    if (e.env.references === void 0) return !1;
    if (i < g && e.src.charCodeAt(i) === 91 ? (c = i + 1, i = e.md.helpers.parseLinkLabel(e, i), i >= 0 ? a = e.src.slice(c, i++) : i = h + 1) : i = h + 1, a || (a = e.src.slice(f, h)), a = vt(a), s = e.env.references[a], !s) return e.pos = p, !1;
    d = s.href, l = s.title;
  }
  if (!t) {
    r = e.src.slice(f, h);
    let w = [];
    e.md.inline.parse(r, e.md, e.env, w);
    let _ = e.push("image", "img", 0), v = [["src", d], ["alt", ""]];
    if (_.attrs = v, _.children = w, _.content = r, l && v.push(["title", l]), a) {
      let k = /* @__PURE__ */ Object.create(null);
      k.label = a, _.meta = k;
    }
  }
  return e.pos = i, e.posMax = g, !0;
}
var As = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/, Ns = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function Ds(e, t) {
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
  if (Ns.test(i)) {
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
  if (As.test(i)) {
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
function Ss(e) {
  return /^<a[>\s]/i.test(e);
}
function Ts(e) {
  return /^<\/a\s*>/i.test(e);
}
function kr(e) {
  let t = e | 32;
  return t >= 97 && t <= 122;
}
function Fs(e, t) {
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
function Ms(e, t) {
  if (!e.md.options.html) return !1;
  let n = e.posMax, r = e.pos;
  if (e.src.charCodeAt(r) !== 60 || r + 2 >= n) return !1;
  let a, i = e.src.charCodeAt(r + 1);
  if (i === 33 || i === 63) a = Fs(e, r);
  else if (i === 47 || kr(i)) {
    let s = e.src.slice(r).match(fr);
    a = s ? r + s[0].length : -1;
  } else return !1;
  if (a < 0) return !1;
  if (!t) {
    let s = e.push("html_inline", "", 0);
    s.content = e.src.slice(r, a), Ss(s.content) && e.linkLevel++, Ts(s.content) && e.linkLevel--;
  }
  return e.pos = a, !0;
}
var Is = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i, Os = /^&([a-z][a-z0-9]{1,31});/i;
function Bs(e, t) {
  let n = e.pos, r = e.posMax;
  if (e.src.charCodeAt(n) !== 38 || n + 1 >= r) return !1;
  if (e.src.charCodeAt(n + 1) === 35) {
    let a = e.src.slice(n).match(Is);
    if (a) {
      if (!t) {
        let i = a[1][0].toLowerCase() === "x" ? parseInt(a[1].slice(1), 16) : parseInt(a[1], 10), s = e.push("text_special", "", 0);
        s.content = Ht(i) ? Qe(i) : Qe(65533), s.markup = a[0], s.info = "entity";
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
function xn(e) {
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
        let g = !1;
        if ((p.close || o.open) && (p.length + o.length) % 3 == 0 && (p.length % 3 != 0 || o.length % 3 != 0) && (g = !0), !g) {
          let f = c > 0 && !e[c - 1].open ? i[c - 1] + 1 : 0;
          i[s] = s - c + f, i[c] = f, o.open = !1, p.end = s, p.close = !1, d = -1, a = -2;
          break;
        }
      }
    }
    d !== -1 && (t[o.marker][(o.open ? 3 : 0) + (o.length || 0) % 3] = d);
  }
}
function Ls(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  xn(e.delimiters);
  for (let a = 0; a < n; a++) {
    var r;
    let i = (r = t[a]) == null ? void 0 : r.delimiters;
    i && xn(i);
  }
}
function $s(e) {
  let t, n, r = 0, a = e.tokens, i = e.tokens.length;
  for (t = n = 0; t < i; t++) a[t].nesting < 0 && r--, a[t].level = r, a[t].nesting > 0 && r++, a[t].type === "text" && t + 1 < i && a[t + 1].type === "text" ? a[t + 1].content = a[t].content + a[t + 1].content : (t !== n && (a[n] = a[t]), n++);
  t !== n && (a.length = n);
}
var Ct = [
  ["text", gs],
  ["linkify", vs],
  ["newline", ks],
  ["escape", _s],
  ["backticks", ws],
  ["strikethrough", br.tokenize],
  ["emphasis", vr.tokenize],
  ["link", qs],
  ["image", Cs],
  ["autolink", Ds],
  ["html_inline", Ms],
  ["entity", Bs]
], At = [
  ["balance_pairs", Ls],
  ["strikethrough", br.postProcess],
  ["emphasis", vr.postProcess],
  ["fragments_join", $s]
], _r = class {
  constructor() {
    D(this, "ruler", new rt()), D(this, "ruler2", new rt()), D(this, "State", mr);
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
}, Us = class {
  constructor(e = {}) {
    D(this, "src_Any", Qn.source), D(this, "src_Cc", er.source), D(this, "src_Z", nr.source), D(this, "src_P", Zt.source), D(this, "src_ZPCc", [
      this.src_Z,
      this.src_P,
      this.src_Cc
    ].join("|")), D(this, "src_ZCc", [this.src_Z, this.src_Cc].join("|")), D(this, "cache", {}), D(this, "opts", {
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
}, Ps = {
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
}, js = "a:cdefgilmnoqrstuwxz|b:abdefghijmnorstvwyz|c:acdfghiklmnoruvwxyz|d:ejkmoz|e:cegrstu|f:ijkmor|g:abdefghilmnpqrstuwy|h:kmnrtu|i:delmnoqrst|j:emop|k:eghimnprwyz|l:abcikrstuvy|m:acdeghklmnopqrstuvwxyz|n:acefgilopruz|o:m|p:aefghklmnrstwy|q:a|r:eosuw|s:abcdeghijklmnortuvxyz|t:cdfghjklmnortvwz|u:agksyz|v:aceginu|w:fs|y:et|z:amw", Js = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф";
function Ws() {
  let e = Js.split("|");
  return js.split("|").forEach((t) => {
    let n = t.indexOf(":"), r = t.slice(0, n);
    for (let a of t.slice(n + 1)) e.push(r + a);
  }), e;
}
var Zs = {
  fuzzyLink: !1,
  fuzzyEmail: !0,
  fuzzyIP: !1,
  "---": !1,
  tlds: Ws(),
  urlAuth: !1,
  maxLength: 1e4
}, wn = class {
  constructor(e, t, n, r) {
    D(this, "schema", void 0), D(this, "index", void 0), D(this, "lastIndex", void 0), D(this, "raw", void 0), D(this, "text", void 0), D(this, "url", void 0);
    let a = e.slice(n, r);
    this.schema = t.toLowerCase(), this.index = n, this.lastIndex = r, this.raw = a, this.text = a, this.url = a;
  }
}, Hs = class {
  constructor(e = {}) {
    D(this, "__opts__", void 0), D(this, "__schemas__", void 0), D(this, "re", void 0);
    let { rebuilder: t, ...n } = e;
    this.__opts__ = {
      ...Zs,
      ...n
    }, this.__schemas__ = { ...Ps }, this.re = t || new Us(), this.re.set({
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
    let t = [], n = this.re.get_schema_search(), r, a, i, s, o, l, c = !1, d = !1, p = !1, g = 0;
    if (!e.length) return null;
    for (n.lastIndex = 0, this.__opts__.fuzzyLink && this.__schemas__["http:"] && (r = this.re.get_fuzzy_link_search(), r.lastIndex = 0), this.__opts__.fuzzyEmail && this.__schemas__["mailto:"] && (a = this.re.get_fuzzy_mail_host_search(), a.lastIndex = 0, i = this.re.get_mail_name_validator()); ; ) {
      let f = Math.max(g - 1, 0);
      if (a && i && !p && (!o || o.index < g)) for (a.lastIndex < f && (a.lastIndex = f); ; ) {
        let k = a.exec(e);
        if (!k) {
          p = !0, o = void 0;
          break;
        }
        let z = i.exec(e.slice(Math.max(0, k.index - 65), k.index));
        if (z) {
          if (o = {
            schema: "mailto:",
            index: k.index - z[1].length,
            lastIndex: k.index + k[0].length
          }, o.index >= g) break;
          a.lastIndex < f && (a.lastIndex = f);
        }
      }
      if (r && !d && (!s || s.index < g)) for (r.lastIndex < f && (r.lastIndex = f); ; ) {
        let k = r.exec(e);
        if (!k) {
          d = !0, s = void 0;
          break;
        }
        if (s = {
          schema: "",
          index: k.index + k[1].length,
          lastIndex: k.index + k[0].length
        }, s.index >= g) break;
        r.lastIndex < f && (r.lastIndex = f);
      }
      let h = o;
      (!h || s && (s.index < h.index || s.index === h.index && s.lastIndex > h.lastIndex)) && (h = s);
      let w;
      if (!c) for (; ; ) {
        if (!l) {
          n.lastIndex < f && (n.lastIndex = f);
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
        if (l.index < g) {
          l = void 0;
          continue;
        }
        if (h && l.index > h.index) break;
        let k = l;
        l = void 0;
        let z = this.testSchemaAt(e, k.schema, k.lastIndex);
        if (z) {
          w = {
            schema: k.schema,
            index: k.index,
            lastIndex: k.lastIndex + z
          };
          break;
        }
      }
      let _ = w;
      if ((!_ || o && (o.index < _.index || o.index === _.index && o.lastIndex > _.lastIndex)) && (_ = o), (!_ || s && (s.index < _.index || s.index === _.index && s.lastIndex > _.lastIndex)) && (_ = s), !_) break;
      _ === o ? o = void 0 : _ === s && (s = void 0);
      let v = new wn(e, _.schema, _.index, _.lastIndex);
      v.schema ? this.__schemas__[v.schema].normalize(v, this) : this.normalize(v), t.push(v), g = _.lastIndex;
    }
    return t.length ? t : null;
  }
  matchAtStart(e) {
    if (!e.length) return null;
    let t = this.re.get_schema_at_start().exec(e);
    if (!t) return null;
    let n = this.testSchemaAt(e, t[2], t[0].length);
    if (!n) return null;
    let r = new wn(e, t[2], t.index + t[1].length, t.index + t[0].length + n);
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
}, We = 2147483647, Te = 36, xr = 1, pt = 26, Ks = 38, Gs = 700, wr = 72, zr = 128, yr = "-", Ys = /^xn--/, Xs = /[^\0-\x7F]/, Vs = /[\x2E\u3002\uFF0E\uFF61]/g, Qs = {
  overflow: "Overflow: input needs wider integers to process",
  "not-basic": "Illegal input >= 0x80 (not a basic code point)",
  "invalid-input": "Invalid input"
}, eo = 35, Ce = Math.floor, Dt = String.fromCharCode;
function Ie(e) {
  throw RangeError(Qs[e]);
}
function to(e, t) {
  let n = [], r = e.length;
  for (; r--; ) n[r] = t(e[r]);
  return n;
}
function zn(e, t) {
  let n = e.split("@"), r = "";
  n.length > 1 && (r = n[0] + "@", e = n[1]), e = e.replace(Vs, ".");
  let a = to(e.split("."), t).join(".");
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
var no = (e) => String.fromCodePoint(...e), ro = function(e) {
  return e >= 48 && e < 58 ? 26 + (e - 48) : e >= 65 && e < 91 ? e - 65 : e >= 97 && e < 123 ? e - 97 : Te;
}, yn = function(e, t) {
  return e + 22 + 75 * (e < 26) - ((t != 0) << 5);
}, Er = function(e, t, n) {
  let r = 0;
  for (e = n ? Ce(e / Gs) : e >> 1, e += Ce(e / t); e > 455; r += Te) e = Ce(e / eo);
  return Ce(r + 36 * e / (e + Ks));
}, Rn = function(e) {
  let t = [], n = e.length, r = 0, a = zr, i = wr, s = e.lastIndexOf(yr);
  s < 0 && (s = 0);
  for (let o = 0; o < s; ++o) e.charCodeAt(o) >= 128 && Ie("not-basic"), t.push(e.charCodeAt(o));
  for (let o = s > 0 ? s + 1 : 0; o < n; ) {
    let l = r;
    for (let d = 1, p = Te; ; p += Te) {
      o >= n && Ie("invalid-input");
      let g = ro(e.charCodeAt(o++));
      g >= Te && Ie("invalid-input"), g > Ce((We - r) / d) && Ie("overflow"), r += g * d;
      let f = p <= i ? xr : p >= i + pt ? pt : p - i;
      if (g < f) break;
      let h = Te - f;
      d > Ce(We / h) && Ie("overflow"), d *= h;
    }
    let c = t.length + 1;
    i = Er(r - l, c, l == 0), Ce(r / c) > We - a && Ie("overflow"), a += Ce(r / c), r %= c, t.splice(r++, 0, a);
  }
  return String.fromCodePoint(...t);
}, En = function(e) {
  let t = [];
  e = Rr(e);
  let n = e.length, r = zr, a = 0, i = wr;
  for (let l of e) l < 128 && t.push(Dt(l));
  let s = t.length, o = s;
  for (s && t.push(yr); o < n; ) {
    let l = We;
    for (let d of e) d >= r && d < l && (l = d);
    let c = o + 1;
    l - r > Ce((We - a) / c) && Ie("overflow"), a += (l - r) * c, r = l;
    for (let d of e) if (d < r && ++a > We && Ie("overflow"), d === r) {
      let p = a;
      for (let g = Te; ; g += Te) {
        let f = g <= i ? xr : g >= i + pt ? pt : g - i;
        if (p < f) break;
        let h = p - f, w = Te - f;
        t.push(Dt(yn(f + h % w, 0))), p = Ce(h / w);
      }
      t.push(Dt(yn(p, 0))), i = Er(a, c, o === s), a = 0, ++o;
    }
    ++a, ++r;
  }
  return t.join("");
}, qn = {
  version: "2.3.1",
  ucs2: {
    decode: Rr,
    encode: no
  },
  decode: Rn,
  encode: En,
  toASCII: function(e) {
    return zn(e, function(t) {
      return Xs.test(t) ? "xn--" + En(t) : t;
    });
  },
  toUnicode: function(e) {
    return zn(e, function(t) {
      return Ys.test(t) ? Rn(t.slice(4).toLowerCase()) : t;
    });
  }
}, ao = {
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
}, io = /^(vbscript|javascript|file|data):/, so = /^data:image\/(gif|png|jpeg|webp);/, Cn = [
  "http:",
  "https:",
  "mailto:"
], qe = class {
  validateLink(e) {
    let t = e.trim().toLowerCase();
    return !io.test(t) || so.test(t);
  }
  normalizeLink(e) {
    let t = Bt(e, !0);
    if (t.hostname && (!t.protocol || Cn.indexOf(t.protocol) >= 0)) try {
      t.hostname = qn.toASCII(t.hostname);
    } catch {
    }
    return t.auth && (t.auth = Se(t.auth)), t.hostname && (t.hostname = Se(t.hostname)), t.pathname && (t.pathname = Se(t.pathname)), t.search && (t.search = Se(t.search)), t.hash && (t.hash = Se(t.hash)), Ot(t);
  }
  normalizeLinkText(e) {
    let t = Bt(e, !0);
    if (t.hostname && (!t.protocol || Cn.indexOf(t.protocol) >= 0)) try {
      t.hostname = qn.toUnicode(t.hostname);
    } catch {
    }
    return He(Ot(t), He.defaultChars + "%");
  }
  constructor(...e) {
    D(this, "inline", new _r()), D(this, "block", new gr()), D(this, "core", new hr()), D(this, "renderer", new cr()), D(this, "linkify", new Hs()), D(this, "utils", di), D(this, "helpers", Object.assign({}, qi));
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
      if (t = ao[a], !t) throw Error(`Wrong 'markdown-it' preset "${a}", check name`);
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
D(qe, "Token", $e), D(qe, "Ruler", rt), D(qe, "Renderer", cr), D(qe, "ParserCore", hr), D(qe, "StateCore", ur), D(qe, "ParserBlock", gr), D(qe, "StateBlock", pr), D(qe, "ParserInline", _r), D(qe, "StateInline", mr);
var oo = sr(qe);
function lo(e) {
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
class An {
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
const co = "</span>", Nn = (e) => !!e.scope, uo = (e, { prefix: t }) => {
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
class ho {
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
    if (!Nn(t)) return;
    const n = uo(
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
    Nn(t) && (this.buffer += co);
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
const Dn = (e = {}) => {
  const t = { children: [] };
  return Object.assign(t, e), t;
};
class Gt {
  constructor() {
    this.rootNode = Dn(), this.stack = [this.rootNode];
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
    const n = Dn({ scope: t });
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
      Gt._collapse(n);
    }));
  }
}
class po extends Gt {
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
    return new ho(this, this.options).value();
  }
  finalize() {
    return this.closeAllNodes(), !0;
  }
}
function at(e) {
  return e ? typeof e == "string" ? e : e.source : null;
}
function Ar(e) {
  return je("(?=", e, ")");
}
function fo(e) {
  return je("(?:", e, ")*");
}
function go(e) {
  return je("(?:", e, ")?");
}
function je(...e) {
  return e.map((n) => at(n)).join("");
}
function mo(e) {
  const t = e[e.length - 1];
  return typeof t == "object" && t.constructor === Object ? (e.splice(e.length - 1, 1), t) : {};
}
function Yt(...e) {
  return "(" + (mo(e).capture ? "" : "?:") + e.map((r) => at(r)).join("|") + ")";
}
function Nr(e) {
  return new RegExp(e.toString() + "|").exec("").length - 1;
}
function bo(e, t) {
  const n = e && e.exec(t);
  return n && n.index === 0;
}
const vo = /\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;
function Xt(e, { joinWith: t }) {
  let n = 0;
  return e.map((r) => {
    n += 1;
    const a = n;
    let i = at(r), s = "";
    for (; i.length > 0; ) {
      const o = vo.exec(i);
      if (!o) {
        s += i;
        break;
      }
      s += i.substring(0, o.index), i = i.substring(o.index + o[0].length), o[0][0] === "\\" && o[1] ? s += "\\" + String(Number(o[1]) + a) : (s += o[0], o[0] === "(" && n++);
    }
    return s;
  }).map((r) => `(${r})`).join(t);
}
const ko = /\b\B/, Dr = "[a-zA-Z]\\w*", Vt = "[a-zA-Z_]\\w*", Sr = "\\b\\d+(\\.\\d+)?", Tr = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)", Fr = "\\b(0b[01]+)", _o = "!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~", xo = (e = {}) => {
  const t = /^#![ ]*\//;
  return e.binary && (e.begin = je(
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
}, it = {
  begin: "\\\\[\\s\\S]",
  relevance: 0
}, wo = {
  scope: "string",
  begin: "'",
  end: "'",
  illegal: "\\n",
  contains: [it]
}, zo = {
  scope: "string",
  begin: '"',
  end: '"',
  illegal: "\\n",
  contains: [it]
}, yo = {
  begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
}, _t = function(e, t, n = {}) {
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
  const a = Yt(
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
      begin: je(
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
}, Ro = _t("//", "$"), Eo = _t("/\\*", "\\*/"), qo = _t("#", "$"), Co = {
  scope: "number",
  begin: Sr,
  relevance: 0
}, Ao = {
  scope: "number",
  begin: Tr,
  relevance: 0
}, No = {
  scope: "number",
  begin: Fr,
  relevance: 0
}, Do = {
  scope: "regexp",
  begin: /\/(?=[^/\n]*\/)/,
  end: /\/[gimuy]*/,
  contains: [
    it,
    {
      begin: /\[/,
      end: /\]/,
      relevance: 0,
      contains: [it]
    }
  ]
}, So = {
  scope: "title",
  begin: Dr,
  relevance: 0
}, To = {
  scope: "title",
  begin: Vt,
  relevance: 0
}, Fo = {
  // excludes method names from keyword processing
  begin: "\\.\\s*" + Vt,
  relevance: 0
}, Mo = function(e) {
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
var ct = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  APOS_STRING_MODE: wo,
  BACKSLASH_ESCAPE: it,
  BINARY_NUMBER_MODE: No,
  BINARY_NUMBER_RE: Fr,
  COMMENT: _t,
  C_BLOCK_COMMENT_MODE: Eo,
  C_LINE_COMMENT_MODE: Ro,
  C_NUMBER_MODE: Ao,
  C_NUMBER_RE: Tr,
  END_SAME_AS_BEGIN: Mo,
  HASH_COMMENT_MODE: qo,
  IDENT_RE: Dr,
  MATCH_NOTHING_RE: ko,
  METHOD_GUARD: Fo,
  NUMBER_MODE: Co,
  NUMBER_RE: Sr,
  PHRASAL_WORDS_MODE: yo,
  QUOTE_STRING_MODE: zo,
  REGEXP_MODE: Do,
  RE_STARTERS_RE: _o,
  SHEBANG: xo,
  TITLE_MODE: So,
  UNDERSCORE_IDENT_RE: Vt,
  UNDERSCORE_TITLE_MODE: To
});
function Io(e, t) {
  e.input[e.index - 1] === "." && t.ignoreMatch();
}
function Oo(e, t) {
  e.className !== void 0 && (e.scope = e.className, delete e.className);
}
function Bo(e, t) {
  t && e.beginKeywords && (e.begin = "\\b(" + e.beginKeywords.split(" ").join("|") + ")(?!\\.)(?=\\b|\\s)", e.__beforeBegin = Io, e.keywords = e.keywords || e.beginKeywords, delete e.beginKeywords, e.relevance === void 0 && (e.relevance = 0));
}
function Lo(e, t) {
  Array.isArray(e.illegal) && (e.illegal = Yt(...e.illegal));
}
function $o(e, t) {
  if (e.match) {
    if (e.begin || e.end) throw new Error("begin & end are not supported with match");
    e.begin = e.match, delete e.match;
  }
}
function Uo(e, t) {
  e.relevance === void 0 && (e.relevance = 1);
}
const Po = (e, t) => {
  if (!e.beforeMatch) return;
  if (e.starts) throw new Error("beforeMatch cannot be used with starts");
  const n = Object.assign({}, e);
  Object.keys(e).forEach((r) => {
    delete e[r];
  }), e.keywords = n.keywords, e.begin = je(n.beforeMatch, Ar(n.begin)), e.starts = {
    relevance: 0,
    contains: [
      Object.assign(n, { endsParent: !0 })
    ]
  }, e.relevance = 0, delete n.beforeMatch;
}, jo = [
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
], Jo = "keyword";
function Mr(e, t, n = Jo) {
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
      r[l[0]] = [i, Wo(l[0], l[1])];
    });
  }
}
function Wo(e, t) {
  return t ? Number(t) : Zo(e) ? 0 : 1;
}
function Zo(e) {
  return jo.includes(e.toLowerCase());
}
const Sn = {}, Ue = (e) => {
  console.error(e);
}, Tn = (e, ...t) => {
  console.log(`WARN: ${e}`, ...t);
}, Je = (e, t) => {
  Sn[`${e}/${t}`] || (console.log(`Deprecated as of ${e}. ${t}`), Sn[`${e}/${t}`] = !0);
}, ft = new Error();
function Ir(e, t, { key: n }) {
  let r = 0;
  const a = e[n], i = {}, s = {};
  for (let o = 1; o <= t.length; o++)
    s[o + r] = a[o], i[o + r] = !0, r += Nr(t[o - 1]);
  e[n] = s, e[n]._emit = i, e[n]._multi = !0;
}
function Ho(e) {
  if (Array.isArray(e.begin)) {
    if (e.skip || e.excludeBegin || e.returnBegin)
      throw Ue("skip, excludeBegin, returnBegin not compatible with beginScope: {}"), ft;
    if (typeof e.beginScope != "object" || e.beginScope === null)
      throw Ue("beginScope must be object"), ft;
    Ir(e, e.begin, { key: "beginScope" }), e.begin = Xt(e.begin, { joinWith: "" });
  }
}
function Ko(e) {
  if (Array.isArray(e.end)) {
    if (e.skip || e.excludeEnd || e.returnEnd)
      throw Ue("skip, excludeEnd, returnEnd not compatible with endScope: {}"), ft;
    if (typeof e.endScope != "object" || e.endScope === null)
      throw Ue("endScope must be object"), ft;
    Ir(e, e.end, { key: "endScope" }), e.end = Xt(e.end, { joinWith: "" });
  }
}
function Go(e) {
  e.scope && typeof e.scope == "object" && e.scope !== null && (e.beginScope = e.scope, delete e.scope);
}
function Yo(e) {
  Go(e), typeof e.beginScope == "string" && (e.beginScope = { _wrap: e.beginScope }), typeof e.endScope == "string" && (e.endScope = { _wrap: e.endScope }), Ho(e), Ko(e);
}
function Xo(e) {
  function t(s, o) {
    return new RegExp(
      at(s),
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
      this.matcherRe = t(Xt(o, { joinWith: "|" }), !0), this.lastIndex = 0;
    }
    /** @param {string} s */
    exec(o) {
      this.matcherRe.lastIndex = this.lastIndex;
      const l = this.matcherRe.exec(o);
      if (!l)
        return null;
      const c = l.findIndex((p, g) => g > 0 && p !== void 0), d = this.matchIndexes[c];
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
      $o,
      Yo,
      Po
    ].forEach((d) => d(s, o)), e.compilerExtensions.forEach((d) => d(s, o)), s.__beforeBegin = null, [
      Bo,
      // do this later so compiler extensions that come earlier have access to the
      // raw array if they wanted to perhaps manipulate it, etc.
      Lo,
      // default to 1 relevance if not specified
      Uo
    ].forEach((d) => d(s, o)), s.isCompiled = !0;
    let c = null;
    return typeof s.keywords == "object" && s.keywords.$pattern && (s.keywords = Object.assign({}, s.keywords), c = s.keywords.$pattern, delete s.keywords.$pattern), c = c || /\w+/, s.keywords && (s.keywords = Mr(s.keywords, e.case_insensitive)), l.keywordPatternRe = t(c, !0), o && (s.begin || (s.begin = /\B|\b/), l.beginRe = t(l.begin), !s.end && !s.endsWithParent && (s.end = /\B|\b/), s.end && (l.endRe = t(l.end)), l.terminatorEnd = at(l.end) || "", s.endsWithParent && o.terminatorEnd && (l.terminatorEnd += (s.end ? "|" : "") + o.terminatorEnd)), s.illegal && (l.illegalRe = t(
      /** @type {RegExp | string} */
      s.illegal
    )), s.contains || (s.contains = []), s.contains = [].concat(...s.contains.map(function(d) {
      return Vo(d === "self" ? s : d);
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
function Or(e) {
  return e ? e.endsWithParent || Or(e.starts) : !1;
}
function Vo(e) {
  return e.variants && !e.cachedVariants && (e.cachedVariants = e.variants.map(function(t) {
    return Oe(e, { variants: null }, t);
  })), e.cachedVariants ? e.cachedVariants : Or(e) ? Oe(e, { starts: e.starts ? Oe(e.starts) : null }) : Object.isFrozen(e) ? Oe(e) : e;
}
var Qo = "11.11.1";
class el extends Error {
  constructor(t, n) {
    super(t), this.name = "HTMLInjectionError", this.html = n;
  }
}
const St = Cr, Fn = Oe, Mn = Symbol("nomatch"), tl = 7, Br = function(e) {
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
    __emitter: po
  };
  function l(E) {
    return o.noHighlightRe.test(E);
  }
  function c(E) {
    let C = E.className + " ";
    C += E.parentNode ? E.parentNode.className : "";
    const A = o.languageDetectRe.exec(C);
    if (A) {
      const $ = x(A[1]);
      return $ || (Tn(i.replace("{}", A[1])), Tn("Falling back to no-highlight mode for this block.", E)), $ ? A[1] : "no-highlight";
    }
    return C.split(/\s+/).find(($) => l($) || x($));
  }
  function d(E, C, A) {
    let $ = "", J = "";
    typeof C == "object" ? ($ = E, A = C.ignoreIllegals, J = C.language) : (Je("10.7.0", "highlight(lang, code, ...args) has been deprecated."), Je("10.7.0", `Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`), J = E, $ = C), A === void 0 && (A = !0);
    const Y = {
      code: $,
      language: J
    };
    G("before:highlight", Y);
    const oe = Y.result ? Y.result : p(Y.language, Y.code, A);
    return oe.code = Y.code, G("after:highlight", oe), oe;
  }
  function p(E, C, A, $) {
    const J = /* @__PURE__ */ Object.create(null);
    function Y(S, B) {
      return S.keywords[B];
    }
    function oe() {
      if (!N.keywords) {
        se.addText(X);
        return;
      }
      let S = 0;
      N.keywordPatternRe.lastIndex = 0;
      let B = N.keywordPatternRe.exec(X), H = "";
      for (; B; ) {
        H += X.substring(S, B.index);
        const ee = V.case_insensitive ? B[0].toLowerCase() : B[0], ge = Y(N, ee);
        if (ge) {
          const [Ne, Xr] = ge;
          if (se.addText(H), H = "", J[ee] = (J[ee] || 0) + 1, J[ee] <= tl && (ue += Xr), Ne.startsWith("_"))
            H += B[0];
          else {
            const Vr = V.classNameAliases[Ne] || Ne;
            Z(B[0], Vr);
          }
        } else
          H += B[0];
        S = N.keywordPatternRe.lastIndex, B = N.keywordPatternRe.exec(X);
      }
      H += X.substring(S), se.addText(H);
    }
    function P() {
      if (X === "") return;
      let S = null;
      if (typeof N.subLanguage == "string") {
        if (!t[N.subLanguage]) {
          se.addText(X);
          return;
        }
        S = p(N.subLanguage, X, !0, ae[N.subLanguage]), ae[N.subLanguage] = /** @type {CompiledMode} */
        S._top;
      } else
        S = f(X, N.subLanguage.length ? N.subLanguage : null);
      N.relevance > 0 && (ue += S.relevance), se.__addSublanguage(S._emitter, S.language);
    }
    function ne() {
      N.subLanguage != null ? P() : oe(), X = "";
    }
    function Z(S, B) {
      S !== "" && (se.startScope(B), se.addText(S), se.endScope());
    }
    function be(S, B) {
      let H = 1;
      const ee = B.length - 1;
      for (; H <= ee; ) {
        if (!S._emit[H]) {
          H++;
          continue;
        }
        const ge = V.classNameAliases[S[H]] || S[H], Ne = B[H];
        ge ? Z(Ne, ge) : (X = Ne, oe(), X = ""), H++;
      }
    }
    function ve(S, B) {
      return S.scope && typeof S.scope == "string" && se.openNode(V.classNameAliases[S.scope] || S.scope), S.beginScope && (S.beginScope._wrap ? (Z(X, V.classNameAliases[S.beginScope._wrap] || S.beginScope._wrap), X = "") : S.beginScope._multi && (be(S.beginScope, B), X = "")), N = Object.create(S, { parent: { value: N } }), N;
    }
    function _e(S, B, H) {
      let ee = bo(S.endRe, H);
      if (ee) {
        if (S["on:end"]) {
          const ge = new An(S);
          S["on:end"](B, ge), ge.isMatchIgnored && (ee = !1);
        }
        if (ee) {
          for (; S.endsParent && S.parent; )
            S = S.parent;
          return S;
        }
      }
      if (S.endsWithParent)
        return _e(S.parent, B, H);
    }
    function F(S) {
      return N.matcher.regexIndex === 0 ? (X += S[0], 1) : (zt = !0, 0);
    }
    function le(S) {
      const B = S[0], H = S.rule, ee = new An(H), ge = [H.__beforeBegin, H["on:begin"]];
      for (const Ne of ge)
        if (Ne && (Ne(S, ee), ee.isMatchIgnored))
          return F(B);
      return H.skip ? X += B : (H.excludeBegin && (X += B), ne(), !H.returnBegin && !H.excludeBegin && (X = B)), ve(H, S), H.returnBegin ? 0 : B.length;
    }
    function ce(S) {
      const B = S[0], H = C.substring(S.index), ee = _e(N, S, H);
      if (!ee)
        return Mn;
      const ge = N;
      N.endScope && N.endScope._wrap ? (ne(), Z(B, N.endScope._wrap)) : N.endScope && N.endScope._multi ? (ne(), be(N.endScope, S)) : ge.skip ? X += B : (ge.returnEnd || ge.excludeEnd || (X += B), ne(), ge.excludeEnd && (X = B));
      do
        N.scope && se.closeNode(), !N.skip && !N.subLanguage && (ue += N.relevance), N = N.parent;
      while (N !== ee.parent);
      return ee.starts && ve(ee.starts, S), ge.returnEnd ? 0 : B.length;
    }
    function I() {
      const S = [];
      for (let B = N; B !== V; B = B.parent)
        B.scope && S.unshift(B.scope);
      S.forEach((B) => se.openNode(B));
    }
    let ie = {};
    function K(S, B) {
      const H = B && B[0];
      if (X += S, H == null)
        return ne(), 0;
      if (ie.type === "begin" && B.type === "end" && ie.index === B.index && H === "") {
        if (X += C.slice(B.index, B.index + 1), !a) {
          const ee = new Error(`0 width match regex (${E})`);
          throw ee.languageName = E, ee.badRule = ie.rule, ee;
        }
        return 1;
      }
      if (ie = B, B.type === "begin")
        return le(B);
      if (B.type === "illegal" && !A) {
        const ee = new Error('Illegal lexeme "' + H + '" for mode "' + (N.scope || "<unnamed>") + '"');
        throw ee.mode = N, ee;
      } else if (B.type === "end") {
        const ee = ce(B);
        if (ee !== Mn)
          return ee;
      }
      if (B.type === "illegal" && H === "")
        return X += `
`, 1;
      if (wt > 1e5 && wt > B.index * 3)
        throw new Error("potential infinite loop, way more iterations than matches");
      return X += H, H.length;
    }
    const V = x(E);
    if (!V)
      throw Ue(i.replace("{}", E)), new Error('Unknown language: "' + E + '"');
    const Fe = Xo(V);
    let j = "", N = $ || Fe;
    const ae = {}, se = new o.__emitter(o);
    I();
    let X = "", ue = 0, Re = 0, wt = 0, zt = !1;
    try {
      if (V.__emitTokens)
        V.__emitTokens(C, se);
      else {
        for (N.matcher.considerAll(); ; ) {
          wt++, zt ? zt = !1 : N.matcher.considerAll(), N.matcher.lastIndex = Re;
          const S = N.matcher.exec(C);
          if (!S) break;
          const B = C.substring(Re, S.index), H = K(B, S);
          Re = S.index + H;
        }
        K(C.substring(Re));
      }
      return se.finalize(), j = se.toHTML(), {
        language: E,
        value: j,
        relevance: ue,
        illegal: !1,
        _emitter: se,
        _top: N
      };
    } catch (S) {
      if (S.message && S.message.includes("Illegal"))
        return {
          language: E,
          value: St(C),
          illegal: !0,
          relevance: 0,
          _illegalBy: {
            message: S.message,
            index: Re,
            context: C.slice(Re - 100, Re + 100),
            mode: S.mode,
            resultSoFar: j
          },
          _emitter: se
        };
      if (a)
        return {
          language: E,
          value: St(C),
          illegal: !1,
          relevance: 0,
          errorRaised: S,
          _emitter: se,
          _top: N
        };
      throw S;
    }
  }
  function g(E) {
    const C = {
      value: St(E),
      illegal: !1,
      relevance: 0,
      _top: s,
      _emitter: new o.__emitter(o)
    };
    return C._emitter.addText(E), C;
  }
  function f(E, C) {
    C = C || o.languages || Object.keys(t);
    const A = g(E), $ = C.filter(x).filter(L).map(
      (ne) => p(ne, E, !1)
    );
    $.unshift(A);
    const J = $.sort((ne, Z) => {
      if (ne.relevance !== Z.relevance) return Z.relevance - ne.relevance;
      if (ne.language && Z.language) {
        if (x(ne.language).supersetOf === Z.language)
          return 1;
        if (x(Z.language).supersetOf === ne.language)
          return -1;
      }
      return 0;
    }), [Y, oe] = J, P = Y;
    return P.secondBest = oe, P;
  }
  function h(E, C, A) {
    const $ = C && n[C] || A;
    E.classList.add("hljs"), E.classList.add(`language-${$}`);
  }
  function w(E) {
    let C = null;
    const A = c(E);
    if (l(A)) return;
    if (G(
      "before:highlightElement",
      { el: E, language: A }
    ), E.dataset.highlighted) {
      console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.", E);
      return;
    }
    if (E.children.length > 0 && (o.ignoreUnescapedHTML || (console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."), console.warn("https://github.com/highlightjs/highlight.js/wiki/security"), console.warn("The element with unescaped HTML:"), console.warn(E)), o.throwUnescapedHTML))
      throw new el(
        "One of your code blocks includes unescaped HTML.",
        E.innerHTML
      );
    C = E;
    const $ = C.textContent, J = A ? d($, { language: A, ignoreIllegals: !0 }) : f($);
    E.innerHTML = J.value, E.dataset.highlighted = "yes", h(E, A, J.language), E.result = {
      language: J.language,
      // TODO: remove with version 11.0
      re: J.relevance,
      relevance: J.relevance
    }, J.secondBest && (E.secondBest = {
      language: J.secondBest.language,
      relevance: J.secondBest.relevance
    }), G("after:highlightElement", { el: E, result: J, text: $ });
  }
  function _(E) {
    o = Fn(o, E);
  }
  const v = () => {
    y(), Je("10.6.0", "initHighlighting() deprecated.  Use highlightAll() now.");
  };
  function k() {
    y(), Je("10.6.0", "initHighlightingOnLoad() deprecated.  Use highlightAll() now.");
  }
  let z = !1;
  function y() {
    function E() {
      y();
    }
    if (document.readyState === "loading") {
      z || window.addEventListener("DOMContentLoaded", E, !1), z = !0;
      return;
    }
    document.querySelectorAll(o.cssSelector).forEach(w);
  }
  function R(E, C) {
    let A = null;
    try {
      A = C(e);
    } catch ($) {
      if (Ue("Language definition for '{}' could not be registered.".replace("{}", E)), a)
        Ue($);
      else
        throw $;
      A = s;
    }
    A.name || (A.name = E), t[E] = A, A.rawDefinition = C.bind(null, e), A.aliases && q(A.aliases, { languageName: E });
  }
  function b(E) {
    delete t[E];
    for (const C of Object.keys(n))
      n[C] === E && delete n[C];
  }
  function M() {
    return Object.keys(t);
  }
  function x(E) {
    return E = (E || "").toLowerCase(), t[E] || t[n[E]];
  }
  function q(E, { languageName: C }) {
    typeof E == "string" && (E = [E]), E.forEach((A) => {
      n[A.toLowerCase()] = C;
    });
  }
  function L(E) {
    const C = x(E);
    return C && !C.disableAutodetect;
  }
  function U(E) {
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
  function O(E) {
    U(E), r.push(E);
  }
  function W(E) {
    const C = r.indexOf(E);
    C !== -1 && r.splice(C, 1);
  }
  function G(E, C) {
    const A = E;
    r.forEach(function($) {
      $[A] && $[A](C);
    });
  }
  function te(E) {
    return Je("10.7.0", "highlightBlock will be removed entirely in v12.0"), Je("10.7.0", "Please use highlightElement now."), w(E);
  }
  Object.assign(e, {
    highlight: d,
    highlightAuto: f,
    highlightAll: y,
    highlightElement: w,
    // TODO: Remove with v12 API
    highlightBlock: te,
    configure: _,
    initHighlighting: v,
    initHighlightingOnLoad: k,
    registerLanguage: R,
    unregisterLanguage: b,
    listLanguages: M,
    getLanguage: x,
    registerAliases: q,
    autoDetection: L,
    inherit: Fn,
    addPlugin: O,
    removePlugin: W
  }), e.debugMode = function() {
    a = !1;
  }, e.safeMode = function() {
    a = !0;
  }, e.versionString = Qo, e.regex = {
    concat: je,
    lookahead: Ar,
    either: Yt,
    optional: go,
    anyNumberOfTimes: fo
  };
  for (const E in ct)
    typeof ct[E] == "object" && qr(ct[E]);
  return Object.assign(e, ct), e;
}, Ge = Br({});
Ge.newInstance = () => Br({});
var nl = Ge;
Ge.HighlightJS = Ge;
Ge.default = Ge;
const rl = /* @__PURE__ */ lo(nl), In = "[A-Za-z$_][0-9A-Za-z$_]*", al = [
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
], il = [
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
], sl = [
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
], ol = [].concat(
  Ur,
  Lr,
  $r
);
function ll(e) {
  const t = e.regex, n = (A, { after: $ }) => {
    const J = "</" + A[0].slice(1);
    return A.input.indexOf(J, $) !== -1;
  }, r = In, a = {
    begin: "<>",
    end: "</>"
  }, i = /<[A-Za-z0-9\\._:-]+\s*\/>/, s = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
    /**
     * @param {RegExpMatchArray} match
     * @param {CallbackResponse} response
     */
    isTrulyOpeningTag: (A, $) => {
      const J = A[0].length + A.index, Y = A.input[J];
      if (
        // HTML should not include another raw `<` inside a tag
        // nested type?
        // `<Array<Array<number>>`, etc.
        Y === "<" || // the , gives away that this is not HTML
        // `<T, A extends keyof T, V>`
        Y === ","
      ) {
        $.ignoreMatch();
        return;
      }
      Y === ">" && (n(A, { after: J }) || $.ignoreMatch());
      let oe;
      const P = A.input.substring(J);
      if (oe = P.match(/^\s*=/)) {
        $.ignoreMatch();
        return;
      }
      if ((oe = P.match(/^\s+extends\s+/)) && oe.index === 0) {
        $.ignoreMatch();
        return;
      }
    }
  }, o = {
    $pattern: In,
    keyword: al,
    literal: il,
    built_in: ol,
    "variable.language": sl
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
  }, g = {
    className: "subst",
    begin: "\\$\\{",
    end: "\\}",
    keywords: o,
    contains: []
    // defined later
  }, f = {
    begin: ".?html`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        e.BACKSLASH_ESCAPE,
        g
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
        g
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
        g
      ],
      subLanguage: "graphql"
    }
  }, _ = {
    className: "string",
    begin: "`",
    end: "`",
    contains: [
      e.BACKSLASH_ESCAPE,
      g
    ]
  }, k = {
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
  }, z = [
    e.APOS_STRING_MODE,
    e.QUOTE_STRING_MODE,
    f,
    h,
    w,
    _,
    // Skip numbers when they are part of a variable name
    { match: /\$\d+/ },
    p
    // This is intentional:
    // See https://github.com/highlightjs/highlight.js/issues/3288
    // hljs.REGEXP_MODE
  ];
  g.contains = z.concat({
    // we need to pair up {} inside our subst to prevent
    // it from ending too early by matching another }
    begin: /\{/,
    end: /\}/,
    keywords: o,
    contains: [
      "self"
    ].concat(z)
  });
  const y = [].concat(k, g.contains), R = y.concat([
    // eat recursive parens in sub expressions
    {
      begin: /(\s*)\(/,
      end: /\)/,
      keywords: o,
      contains: ["self"].concat(y)
    }
  ]), b = {
    className: "params",
    // convert this to negative lookbehind in v12
    begin: /(\s*)\(/,
    // to match the parms with
    end: /\)/,
    excludeBegin: !0,
    excludeEnd: !0,
    keywords: o,
    contains: R
  }, M = {
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
  }, x = {
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
  }, q = {
    label: "use_strict",
    className: "meta",
    relevance: 10,
    begin: /^\s*['"]use (strict|asm)['"]/
  }, L = {
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
    contains: [b],
    illegal: /%/
  }, U = {
    relevance: 0,
    match: /\b[A-Z][A-Z_0-9]+\b/,
    className: "variable.constant"
  };
  function O(A) {
    return t.concat("(?!", A.join("|"), ")");
  }
  const W = {
    match: t.concat(
      /\b/,
      O([
        ...Ur,
        "super",
        "import"
      ].map((A) => `${A}\\s*\\(`)),
      r,
      t.lookahead(/\s*\(/)
    ),
    className: "title.function",
    relevance: 0
  }, G = {
    begin: t.concat(/\./, t.lookahead(
      t.concat(r, /(?![0-9A-Za-z$_(])/)
    )),
    end: r,
    excludeBegin: !0,
    keywords: "prototype",
    className: "property",
    relevance: 0
  }, te = {
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
      b
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
      b
    ]
  };
  return {
    name: "JavaScript",
    aliases: ["js", "jsx", "mjs", "cjs"],
    keywords: o,
    // this will be extended by TypeScript
    exports: { PARAMS_CONTAINS: R, CLASS_REFERENCE: x },
    illegal: /#(?![$_A-z])/,
    contains: [
      e.SHEBANG({
        label: "shebang",
        binary: "node",
        relevance: 5
      }),
      q,
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE,
      f,
      h,
      w,
      _,
      k,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      p,
      x,
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
          k,
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
      L,
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
          b,
          e.inherit(e.TITLE_MODE, { begin: r, className: "title.function" })
        ]
      },
      // catch ... so it won't trigger the property rule below
      {
        match: /\.\.\./,
        relevance: 0
      },
      G,
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
        contains: [b]
      },
      W,
      U,
      M,
      te,
      {
        match: /\$[(.]/
        // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
      }
    ]
  };
}
const gt = "[A-Za-z$_][0-9A-Za-z$_]*", Pr = [
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
function cl(e) {
  const t = e.regex, n = (A, { after: $ }) => {
    const J = "</" + A[0].slice(1);
    return A.input.indexOf(J, $) !== -1;
  }, r = gt, a = {
    begin: "<>",
    end: "</>"
  }, i = /<[A-Za-z0-9\\._:-]+\s*\/>/, s = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
    /**
     * @param {RegExpMatchArray} match
     * @param {CallbackResponse} response
     */
    isTrulyOpeningTag: (A, $) => {
      const J = A[0].length + A.index, Y = A.input[J];
      if (
        // HTML should not include another raw `<` inside a tag
        // nested type?
        // `<Array<Array<number>>`, etc.
        Y === "<" || // the , gives away that this is not HTML
        // `<T, A extends keyof T, V>`
        Y === ","
      ) {
        $.ignoreMatch();
        return;
      }
      Y === ">" && (n(A, { after: J }) || $.ignoreMatch());
      let oe;
      const P = A.input.substring(J);
      if (oe = P.match(/^\s*=/)) {
        $.ignoreMatch();
        return;
      }
      if ((oe = P.match(/^\s+extends\s+/)) && oe.index === 0) {
        $.ignoreMatch();
        return;
      }
    }
  }, o = {
    $pattern: gt,
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
  }, g = {
    className: "subst",
    begin: "\\$\\{",
    end: "\\}",
    keywords: o,
    contains: []
    // defined later
  }, f = {
    begin: ".?html`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        e.BACKSLASH_ESCAPE,
        g
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
        g
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
        g
      ],
      subLanguage: "graphql"
    }
  }, _ = {
    className: "string",
    begin: "`",
    end: "`",
    contains: [
      e.BACKSLASH_ESCAPE,
      g
    ]
  }, k = {
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
  }, z = [
    e.APOS_STRING_MODE,
    e.QUOTE_STRING_MODE,
    f,
    h,
    w,
    _,
    // Skip numbers when they are part of a variable name
    { match: /\$\d+/ },
    p
    // This is intentional:
    // See https://github.com/highlightjs/highlight.js/issues/3288
    // hljs.REGEXP_MODE
  ];
  g.contains = z.concat({
    // we need to pair up {} inside our subst to prevent
    // it from ending too early by matching another }
    begin: /\{/,
    end: /\}/,
    keywords: o,
    contains: [
      "self"
    ].concat(z)
  });
  const y = [].concat(k, g.contains), R = y.concat([
    // eat recursive parens in sub expressions
    {
      begin: /(\s*)\(/,
      end: /\)/,
      keywords: o,
      contains: ["self"].concat(y)
    }
  ]), b = {
    className: "params",
    // convert this to negative lookbehind in v12
    begin: /(\s*)\(/,
    // to match the parms with
    end: /\)/,
    excludeBegin: !0,
    excludeEnd: !0,
    keywords: o,
    contains: R
  }, M = {
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
  }, x = {
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
  }, q = {
    label: "use_strict",
    className: "meta",
    relevance: 10,
    begin: /^\s*['"]use (strict|asm)['"]/
  }, L = {
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
    contains: [b],
    illegal: /%/
  }, U = {
    relevance: 0,
    match: /\b[A-Z][A-Z_0-9]+\b/,
    className: "variable.constant"
  };
  function O(A) {
    return t.concat("(?!", A.join("|"), ")");
  }
  const W = {
    match: t.concat(
      /\b/,
      O([
        ...Zr,
        "super",
        "import"
      ].map((A) => `${A}\\s*\\(`)),
      r,
      t.lookahead(/\s*\(/)
    ),
    className: "title.function",
    relevance: 0
  }, G = {
    begin: t.concat(/\./, t.lookahead(
      t.concat(r, /(?![0-9A-Za-z$_(])/)
    )),
    end: r,
    excludeBegin: !0,
    keywords: "prototype",
    className: "property",
    relevance: 0
  }, te = {
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
      b
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
      b
    ]
  };
  return {
    name: "JavaScript",
    aliases: ["js", "jsx", "mjs", "cjs"],
    keywords: o,
    // this will be extended by TypeScript
    exports: { PARAMS_CONTAINS: R, CLASS_REFERENCE: x },
    illegal: /#(?![$_A-z])/,
    contains: [
      e.SHEBANG({
        label: "shebang",
        binary: "node",
        relevance: 5
      }),
      q,
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE,
      f,
      h,
      w,
      _,
      k,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      p,
      x,
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
          k,
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
      L,
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
          b,
          e.inherit(e.TITLE_MODE, { begin: r, className: "title.function" })
        ]
      },
      // catch ... so it won't trigger the property rule below
      {
        match: /\.\.\./,
        relevance: 0
      },
      G,
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
        contains: [b]
      },
      W,
      U,
      M,
      te,
      {
        match: /\$[(.]/
        // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
      }
    ]
  };
}
function ul(e) {
  const t = e.regex, n = cl(e), r = gt, a = [
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
    $pattern: gt,
    keyword: Pr.concat(l),
    literal: jr,
    built_in: Kr.concat(a),
    "variable.language": Hr
  }, d = {
    className: "meta",
    begin: "@" + r
  }, p = (w, _, v) => {
    const k = w.contains.findIndex((z) => z.label === _);
    if (k === -1)
      throw new Error("can not find mode to replace");
    w.contains.splice(k, 1, v);
  };
  Object.assign(n.keywords, c), n.exports.PARAMS_CONTAINS.push(d);
  const g = n.contains.find((w) => w.scope === "attr"), f = Object.assign(
    {},
    g,
    { match: t.concat(r, t.lookahead(/\s*\?:/)) }
  );
  n.exports.PARAMS_CONTAINS.push([
    n.exports.CLASS_REFERENCE,
    // class reference for highlighting the params types
    g,
    // highlight the params key
    f
    // Added for optional property assignment highlighting
  ]), n.contains = n.contains.concat([
    d,
    i,
    s,
    f
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
function dl(e) {
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
const hl = (e) => ({
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
}), pl = [
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
], fl = [
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
], gl = [
  ...pl,
  ...fl
], ml = [
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
].sort().reverse(), bl = [
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
].sort().reverse(), vl = [
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
].sort().reverse(), kl = [
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
function _l(e) {
  const t = e.regex, n = hl(e), r = { begin: /-(webkit|moz|ms|o)-(?=[a-z])/ }, a = "and or not only", i = /@-?\w[\w]*(-\w+)*/, s = "[a-zA-Z-][a-zA-Z0-9_-]*", o = [
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
          { begin: ":(" + bl.join("|") + ")" },
          { begin: ":(:)?(" + vl.join("|") + ")" }
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
        begin: "\\b(" + kl.join("|") + ")\\b"
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
              attribute: ml.join(" ")
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
        begin: "\\b(" + gl.join("|") + ")\\b"
      }
    ]
  };
}
function xl(e) {
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
function wl(e) {
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
  }, g = "[0-9](_?[0-9])*", f = `(\\b(${g}))?\\.(${g})|\\b(${g})\\.`, h = `\\b|${r.join("|")}`, w = {
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
        begin: `(\\b(${g})|(${f}))[eE][+-]?(${g})[jJ]?(?=${h})`
      },
      {
        begin: `(${f})[jJ]?`
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
        begin: `\\b(${g})[jJ](?=${h})`
      }
    ]
  }, _ = {
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
      _,
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
function zl(e) {
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
  }, g = [
    "fish",
    "bash",
    "zsh",
    "sh",
    "csh",
    "ksh",
    "tcsh",
    "dash",
    "scsh"
  ], f = e.SHEBANG({
    binary: `(${g.join("|")})`,
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
  ], _ = [
    "true",
    "false"
  ], v = { match: /(\/[a-z._-]+)+/ }, k = [
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
  ], z = [
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
      literal: _,
      built_in: [
        ...k,
        ...z,
        // Shell modifiers
        "set",
        "shopt",
        ...y,
        ...R
      ]
    },
    contains: [
      f,
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
function yl(e) {
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
  ] }), g = {
    className: "number",
    begin: "\\b" + "[0-9]{4}(-[0-9][0-9]){0,2}" + "([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?" + "(\\.[0-9]*)?" + "([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?" + "\\b"
  }, f = {
    end: ",",
    endsWithParent: !0,
    excludeEnd: !0,
    keywords: t,
    relevance: 0
  }, h = {
    begin: /\{/,
    end: /\}/,
    contains: [f],
    illegal: "\\n",
    relevance: 0
  }, w = {
    begin: "\\[",
    end: "\\]",
    contains: [f],
    illegal: "\\n",
    relevance: 0
  }, _ = [
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
    g,
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
  ], v = [..._];
  return v.pop(), v.push(o), f.contains = v, {
    name: "YAML",
    case_insensitive: !0,
    aliases: ["yml"],
    contains: _
  };
}
function Rl(e) {
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
  ], g = [
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
  ], f = d, h = [
    ...c,
    ...l
  ].filter((R) => !d.includes(R)), w = {
    scope: "variable",
    match: /@[a-z0-9][a-z0-9_]*/
  }, _ = {
    scope: "operator",
    match: /[-+*/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?/,
    relevance: 0
  }, v = {
    match: t.concat(/\b/, t.either(...f), /\s*\(/),
    relevance: 0,
    keywords: { built_in: f }
  };
  function k(R) {
    return t.concat(
      /\b/,
      t.either(...R.map((b) => b.replace(/\s+/, "\\s+"))),
      /\b/
    );
  }
  const z = {
    scope: "keyword",
    match: k(g),
    relevance: 0
  };
  function y(R, {
    exceptions: b,
    when: M
  } = {}) {
    const x = M;
    return b = b || [], R.map((q) => q.match(/\|\d+$/) || b.includes(q) ? q : x(q) ? `${q}|0` : q);
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
        match: k(s)
      },
      z,
      v,
      w,
      r,
      a,
      e.C_NUMBER_MODE,
      e.C_BLOCK_COMMENT_MODE,
      n,
      _
    ]
  };
}
function El(e) {
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
const ql = /^\[\[([^\[\]\r\n]{1,256})\]\]/;
function Cl(e) {
  e.inline.ruler.after("image", "wikilink", (t, n) => {
    if (n || t.linkLevel || !t.src.startsWith("[[", t.pos)) return !1;
    const r = ql.exec(t.src.slice(t.pos, Math.min(t.posMax, t.pos + 260)));
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
const $t = rl.newInstance();
for (const [e, t] of Object.entries({ javascript: ll, typescript: ul, json: dl, css: _l, xml: xl, python: wl, bash: zl, yaml: yl, sql: Rl }))
  $t.registerLanguage(e, t);
const Ae = new oo({ html: !1, highlight: (e, t) => e.length <= 32768 && $t.getLanguage(t) ? $t.highlight(e, { language: t, ignoreIllegals: !0 }).value : "" });
Cl(Ae);
Ae.validateLink = (e) => /^(https?:\/\/|mailto:)/i.test(e);
Ae.renderer.rules.image = (e, t) => `<span class="qz-note-image">[image: ${Ae.utils.escapeHtml(e[t].content || "image")}]</span>`;
Ae.renderer.rules.link_open = (e, t, n, r, a) => (e[t].attrSet("target", "_blank"), e[t].attrSet("rel", "noopener noreferrer nofollow"), a.renderToken(e, t, n));
Ae.renderer.rules.note_task = (e, t, n, r, a) => a.renderToken(e, t, n) + " ";
Ae.core.ruler.push("note_tasks", (e) => {
  const { tokens: t, env: n } = e, r = typeof n.lineOffset == "number" ? n.lineOffset : 0, a = e.src.split(`
`);
  for (let i = 0; i < t.length; i++) {
    const s = t[i];
    if (s.type !== "list_item_open" || !s.map) continue;
    const o = s.map[0], l = /^[ \t]*- \[([ x])\] (.*)$/.exec(a[o] || "");
    if (!l) continue;
    const c = t[i + 1], d = t[i + 2], p = d == null ? void 0 : d.children, g = p == null ? void 0 : p[0], f = `[${l[1]}]`;
    if ((c == null ? void 0 : c.type) !== "paragraph_open" || (d == null ? void 0 : d.type) !== "inline" || !p || (g == null ? void 0 : g.type) !== "text" || g.content !== f && !g.content.startsWith(`${f} `)) continue;
    const h = new e.Token("note_task", "input", 0);
    h.attrSet("type", "checkbox"), h.attrSet("class", "qz-note-task-checkbox"), h.attrSet("data-note-task-line", String(o + r)), h.attrSet("aria-label", l[2].trim() || "Task"), n.editable || h.attrSet("disabled", "");
    const w = l[1] === "x";
    w && h.attrSet("checked", ""), s.attrJoin("class", w ? "qz-note-task qz-note-task-completed" : "qz-note-task"), g.content = g.content.slice(4);
    const _ = new e.Token("span_open", "span", 1);
    _.attrSet("class", "qz-note-task-text"), p.unshift(h, _), p.push(new e.Token("span_close", "span", -1));
  }
});
function Al(e, t, n = {}) {
  let r = e, a = 0;
  const i = /^---[ \t]*\n/.exec(e);
  if (i) {
    const d = /^---[ \t]*(?:\n|$)/gm;
    d.lastIndex = i[0].length, d.test(e) && (a = (e.slice(0, d.lastIndex).match(/\n/g) || []).length, r = e.slice(d.lastIndex));
  }
  const s = { resolveWikilink: t, editable: n.editable === !0, lineOffset: a }, o = Ae.parse(r, s), l = r.split(`
`), c = [];
  for (let d = 0; d < o.length; ) {
    const p = d, g = o[d++];
    if (g.nesting === 1) {
      let w = 1;
      for (; d < o.length && w > 0; ) w += o[d++].nesting;
    }
    const f = g.map, h = { html: Ae.renderer.render(o.slice(p, d), Ae.options, s) };
    if (f) {
      let w = f[1];
      for (; w > f[0] + 1 && /^[ \t]*$/.test(l[w - 1] ?? ""); ) w--;
      h.start = f[0] + a, h.end = w + a;
    }
    c.push(h);
  }
  return c;
}
function Nl(e) {
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
function Tt(e) {
  const t = e.content.startsWith("\uFEFF") ? "\uFEFF" : "", n = e.content.slice(t.length), r = n.replace(/\r\n/g, ""), a = r.length !== n.length, i = r.includes("\r") || a && r.includes(`
`) ? "mixed" : a ? `\r
` : `
`;
  return { source: e, text: n.replace(/\r\n?/g, `
`), bom: t, lineEnding: i };
}
function On(e) {
  return e.lineEnding === "mixed" ? e.source.content : e.bom + (e.lineEnding === `\r
` ? e.text.replace(/\n/g, `\r
`) : e.text);
}
function Gr(e, t, n) {
  const r = e.split(`
`);
  if (!Number.isInteger(t) || !Number.isInteger(n) || t < 0 || n <= t || n > r.length) return null;
  let a = 0;
  for (let s = 0; s < t; s++) a += r[s].length + 1;
  let i = a + r[t].length;
  for (let s = t + 1; s < n; s++) i += 1 + r[s].length;
  return { from: a, to: i };
}
function Dl(e, t, n) {
  const r = Gr(e, t, t + 1);
  if (!r) return e;
  const a = /^([ \t]*- \[)( |x)(\] )/.exec(e.slice(r.from, r.to));
  if (!a) return e;
  const i = r.from + a[1].length;
  return e.slice(0, i) + (n ? "x" : " ") + e.slice(i + 1);
}
const Sl = ".qz-notes-layout{display:grid;grid-template-columns:minmax(190px,1fr) minmax(0,3fr);gap:14px;align-items:start}.qz-note-browser,.qz-note-editor,.qz-note-create{display:grid;gap:12px;padding:14px}.qz-note-browser{max-height:72vh;overflow:auto}.qz-note-create{grid-template-columns:minmax(0,1fr) auto;align-items:end}.qz-note-create .qz-error{grid-column:1 / -1}.qz-note-tree{display:grid;gap:3px;padding:0;list-style:none}.qz-note-tree .qz-note-tree{margin-inline-start:10px}.qz-note-tree :is(summary,button){width:100%;min-height:32px;padding:5px 7px;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--qz-text);text-align:start;overflow-wrap:anywhere;cursor:pointer}.qz-note-tree button{display:flex;align-items:center;gap:7px}.qz-note-tree summary .qz-icon{vertical-align:text-bottom;margin-inline:3px 6px}.qz-note-tree :is(summary,button):hover{background:var(--qz-elevated)}.qz-note-tree button[aria-current=true]{border-color:color-mix(in srgb,var(--qz-accent) 26%,var(--qz-border));background:var(--qz-accent-soft)}.qz-note-editor .qz-path{flex:1 1 15ch}.qz-note-toolbar{gap:8px}.qz-note-column{width:100%;max-width:800px;margin-inline:auto;padding-inline:20px}.qz-note-column-full{max-width:none}.qz-note-text,.qz-note-block-text{resize:vertical;font:400 16px/1.55 var(--mono, ui-monospace, monospace)}.qz-note-text{min-height:360px}.qz-note-message{font-size:12px}.qz-note-message:empty{display:none}.qz-notes-rendered{min-width:0;min-height:360px;padding-block:14px 32px;font:400 16px/1.55 var(--font-body, sans-serif);overflow-wrap:anywhere}.qz-notes-rendered :is(p,ul,ol,pre,blockquote,table,h1,h2,h3,h4,h5,h6){margin:0 0 .9em}.qz-notes-rendered :is(ul,ol){padding-inline-start:1.5em}.qz-notes-rendered :is(h1,h2,h3,h4,h5,h6){color:var(--text-strong, var(--qz-text));line-height:1.25;font-weight:600}.qz-notes-rendered h1{font-size:1.802em;font-weight:700}.qz-notes-rendered h2{font-size:1.602em}.qz-notes-rendered h3{font-size:1.422em}.qz-notes-rendered h4{font-size:1.278em}.qz-notes-rendered h5{font-size:1.121em}.qz-notes-rendered h6{font-size:1em}.qz-notes-rendered :is(h1,h2){padding-block-end:.25em;border-block-end:1px solid var(--mdnb-heading-rule-soft, var(--qz-border))}.qz-notes-rendered :is(h3,h4,h5,h6){padding-inline-start:8px;margin-inline-start:-10px;border-inline-start:2px solid var(--mdnb-heading-rail, var(--qz-border))}.qz-notes-rendered :is(code,pre){font-family:var(--mono, ui-monospace, monospace);font-size:.9em}.qz-notes-rendered pre code{font-size:inherit}.qz-notes-rendered pre{overflow-x:auto;padding:10px;border:1px solid var(--qz-border);border-radius:6px;background:var(--qz-elevated)}.qz-notes-rendered blockquote{padding:6px 12px;border-inline-start:3px solid var(--qz-border)}.qz-notes-rendered blockquote>:last-child{margin-block-end:0}.qz-notes-rendered :not(pre)>code{padding:.1em .3em;border-radius:4px;background:var(--qz-elevated)}.qz-notes-rendered :is(.hljs-keyword,.hljs-selector-tag,.hljs-meta){color:color-mix(in srgb,var(--qz-accent) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-string,.hljs-regexp){color:color-mix(in srgb,var(--qz-ok) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-number,.hljs-literal,.hljs-variable){color:color-mix(in srgb,var(--qz-warning) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-title,.hljs-attr,.hljs-built_in,.hljs-attribute){color:color-mix(in srgb,var(--qz-info) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-comment,.hljs-quote){color:var(--qz-muted);font-style:italic}.qz-notes-rendered table{display:block;border-collapse:collapse;overflow-x:auto}.qz-notes-rendered :is(th,td){padding:5px 8px;border:1px solid var(--qz-border)}.qz-notes-rendered a{color:var(--qz-accent)}.qz-note-task{list-style:none}.qz-note-task-checkbox{accent-color:var(--qz-accent);margin-inline:0 .25em}.qz-note-task-completed>.qz-note-task-text,.qz-note-task-completed>p>.qz-note-task-text{color:var(--qz-muted);text-decoration:line-through}.qz-note-block{position:relative;display:flow-root}.qz-note-block-content{cursor:text}.qz-note-block .qz-note-edit-block{position:absolute;inset-block-start:0;inset-inline-end:-20px;min-height:24px;width:24px;padding:2px;color:var(--qz-muted);opacity:0}.qz-note-block:hover .qz-note-edit-block,.qz-note-edit-block:focus-visible{opacity:1}.qz-note-block-editor{display:grid;gap:6px;margin-block-end:.9em}.qz-note-block-editor .qz-actions{justify-content:end}.qz-wikilink{max-width:100%;padding:0;border:0;background:transparent;color:var(--qz-accent);font:inherit;text-align:start;text-decoration:underline;overflow-wrap:anywhere;cursor:pointer}.qz-note-backlinks{border-top:1px solid var(--qz-border);padding-top:12px}.qz-note-backlinks h3{margin:0 0 6px;font-size:14px}.qz-note-backlinks ul{display:grid;gap:4px;margin:0;padding-inline-start:1.25em}.qz-note-image{color:var(--qz-muted)}@container qz-app (max-width: 680px){.qz-notes-layout,.qz-note-create{grid-template-columns:minmax(0,1fr)}.qz-note-browser{max-height:35vh}}", Tl = 3e3, Xe = 500, Ft = [], Bn = "quartizo-notes-view", Ln = "quartizo-notes-full-width";
function $n(e) {
  var t;
  try {
    return ((t = ut()) == null ? void 0 : t.getItem(e)) ?? null;
  } catch {
    return null;
  }
}
function Un(e, t) {
  var n;
  try {
    (n = ut()) == null || n.setItem(e, t);
  } catch {
  }
}
function Pn(e) {
  return `${e.workspaceId}:${e.path}`;
}
function Fl(e, t, n) {
  const r = Zn(), [a, i] = T(null), [s, o] = T(null), [l, c] = T(null), [d, p] = T(0);
  he(() => {
    if (!t || !r) return;
    let f = !1, h, w, _;
    const v = async () => {
      try {
        const k = await we(mt(e));
        if (f) return;
        const z = k.workspaces.filter((b) => b.workspace.companion), y = JSON.stringify(z);
        _ !== y && (i(z), _ = y);
        const R = z.find((b) => b.workspace.id === n) ?? z[0];
        if (!k.available) throw new Error(k.error ?? "The Markdown index is unavailable.");
        if (R) {
          const b = `${R.workspace.id}:${R.index.indexedAt ?? ""}`;
          if (b !== w) {
            const M = await we(ma(e, R.workspace.id));
            if (f) return;
            o({ workspaceId: R.workspace.id, notes: M.notes }), w = b;
          }
        } else
          o(null);
        c(null);
      } catch (k) {
        f || c(xe(k));
      } finally {
        f || (h = setTimeout(v, Tl));
      }
    };
    return v(), () => {
      f = !0, clearTimeout(h);
    };
  }, [t, e, d, r, n]);
  const g = (a == null ? void 0 : a.find((f) => f.workspace.id === n)) ?? (a == null ? void 0 : a[0]);
  return {
    current: g,
    failure: l,
    workspaces: a,
    notes: g && (s == null ? void 0 : s.workspaceId) === g.workspace.id ? s.notes : null,
    refresh: () => p((f) => f + 1),
    visible: r
  };
}
function Ml({ api: e, active: t, request: n, onSettings: r }) {
  var ce;
  const [a, i] = T(null), [s, o] = T(null), [l, c] = T(() => $n(Bn) === "raw" ? "raw" : "rendered"), [d, p] = T(() => $n(Ln) === "true"), [g, f] = T(null), [h, w] = T(() => /* @__PURE__ */ new Map()), [_, v] = T(""), [k, z] = T(Xe), [y, R] = T(!1), [b, M] = T(""), [x, q] = T(null), [L, U] = T(!1), O = fe(!1), { workspaces: W, current: G, notes: te, failure: E, refresh: C, visible: A } = Fl(e, t, a), $ = fe(null), J = ta(_.trim().toLowerCase()), Y = Ze(() => J ? (te ?? Ft).filter((I) => I.title.toLowerCase().includes(J) || I.path.toLowerCase().includes(J)) : te ?? Ft, [te, J]), oe = Ze(() => Nl(Y.slice(0, k)), [Y, k]);
  if (he(() => {
    n && (i(n.workspaceId), o(n), f(null), v(""), z(Xe), R(!1));
  }, [n]), he(() => {
    var I;
    y && ((I = $.current) == null || I.focus());
  }, [y]), !W) return E ? /* @__PURE__ */ u(de, { failure: E }) : /* @__PURE__ */ u("p", { className: "qz-empty", role: "status", children: "Loading folders…" });
  if (!G) return /* @__PURE__ */ m("div", { className: "qz-stack", children: [
    /* @__PURE__ */ u(de, { failure: E }),
    /* @__PURE__ */ m("div", { className: "qz-empty", children: [
      /* @__PURE__ */ u("span", { className: "qz-empty-icon", children: /* @__PURE__ */ u(Q, { name: "folder" }) }),
      /* @__PURE__ */ u("h2", { children: "Connect a notes folder" }),
      /* @__PURE__ */ u("p", { children: "Add a folder of Markdown files in Settings to browse and edit your notes." }),
      /* @__PURE__ */ u("button", { type: "button", className: "qz-button", "data-variant": "primary", onClick: r, children: "Open Settings" })
    ] })
  ] });
  const P = G.workspace.id, ne = (s == null ? void 0 : s.workspaceId) === P ? s : null, Z = ne ? Pn(ne) : "", be = (I) => {
    f(null), o({ workspaceId: P, path: I });
  }, ve = (ce = G.index.writeBlocked) == null ? void 0 : ce.message, _e = Jt(G.index), F = (I, ie) => {
    w((K) => {
      if (ie !== void 0 && (K.get(Z) ?? null) !== ie) return K;
      const V = new Map(K);
      return I ? V.set(Z, I) : V.delete(Z), V;
    });
  }, le = async () => {
    const I = b.trim();
    if (!(!I || O.current || ve)) {
      O.current = !0, U(!0), q(null);
      try {
        const ie = await we(va(e, P, I));
        M(""), R(!1);
        const K = { workspaceId: P, path: ie.path };
        f(Pn(K)), o((V) => V === s ? K : V), C();
      } catch (ie) {
        q(xe(ie));
      } finally {
        O.current = !1, U(!1);
      }
    }
  };
  return /* @__PURE__ */ m("section", { className: "qz-stack", "aria-label": "Notes", children: [
    /* @__PURE__ */ u("style", { children: Sl }),
    /* @__PURE__ */ m("div", { className: "qz-view-heading", children: [
      /* @__PURE__ */ u("div", { children: /* @__PURE__ */ u("h2", { className: "qz-section-title", children: "Notes" }) }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ m("label", { className: "qz-inline-field", children: [
          /* @__PURE__ */ u(Q, { name: "folder" }),
          /* @__PURE__ */ u("span", { children: "Notes folder" }),
          /* @__PURE__ */ u("select", { className: "qz-input", value: P, disabled: L, onChange: (I) => {
            i(Number(I.target.value)), o(null), v(""), z(Xe), R(!1);
          }, children: W.map(({ workspace: I }) => /* @__PURE__ */ u("option", { value: I.id, children: I.name }, I.id)) })
        ] }),
        /* @__PURE__ */ m(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "primary",
            "aria-expanded": y,
            onClick: () => {
              R((I) => !I), q(null);
            },
            disabled: L || !!ve,
            children: [
              /* @__PURE__ */ u(Q, { name: "plus" }),
              "New note"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ u(de, { failure: E }),
    _e && /* @__PURE__ */ u("div", { className: "qz-notice", role: "note", children: _e }),
    y && /* @__PURE__ */ m("form", { className: "qz-note-create qz-panel-surface", onSubmit: (I) => {
      I.preventDefault(), le();
    }, children: [
      /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Note path",
        /* @__PURE__ */ u(
          "input",
          {
            ref: $,
            className: "qz-input",
            value: b,
            placeholder: "projects/launch.md",
            disabled: L,
            onChange: (I) => M(I.target.value),
            required: !0
          }
        )
      ] }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ u("button", { type: "submit", className: "qz-button", "data-variant": "primary", disabled: !b.trim() || L || !!ve, children: "Create note" }),
        /* @__PURE__ */ u("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: L, onClick: () => R(!1), children: "Cancel" })
      ] }),
      /* @__PURE__ */ u(de, { failure: x })
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
              value: _,
              placeholder: "Title or path",
              onChange: (I) => {
                v(I.target.value), z(Xe);
              }
            }
          )
        ] }),
        te === null && !E && /* @__PURE__ */ u("p", { role: "status", className: "qz-muted", children: "Loading notes…" }),
        te !== null && Y.length === 0 && /* @__PURE__ */ u("p", { className: "qz-muted", children: J ? "No notes match your search." : G.index.state === "scanning" ? "Indexing notes…" : "No notes in this folder yet." }),
        Y.length > 0 && /* @__PURE__ */ u(
          Yr,
          {
            branch: oe,
            prefix: "",
            selected: ne == null ? void 0 : ne.path,
            query: J,
            onOpen: be
          }
        ),
        Y.length > k && /* @__PURE__ */ u(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            onClick: () => z((I) => I + Xe),
            children: "Show more notes"
          }
        )
      ] }),
      ne ? /* @__PURE__ */ u(
        Il,
        {
          api: e,
          active: t,
          location: ne,
          draft: h.get(Z),
          onDraft: F,
          onSaved: C,
          writeBlocked: !!ve,
          notes: te ?? Ft,
          onOpen: be,
          loadBacklinks: t && A,
          indexRevision: G.index.indexedAt,
          view: g === Z ? "raw" : l,
          focusEditor: g === Z,
          fullWidth: d,
          onViewChange: (I) => {
            f(null), c(I), Un(Bn, I);
          },
          onWidthChange: () => {
            p(!d), Un(Ln, String(!d));
          }
        },
        Z
      ) : /* @__PURE__ */ m("div", { className: "qz-empty", children: [
        /* @__PURE__ */ u("span", { className: "qz-empty-icon", children: /* @__PURE__ */ u(Q, { name: "note" }) }),
        /* @__PURE__ */ u("h3", { children: "Open a note" }),
        /* @__PURE__ */ u("p", { children: "Choose one from the folder tree or create a new note." })
      ] })
    ] })
  ] });
}
function Yr({ branch: e, prefix: t, selected: n, query: r, onOpen: a }) {
  return /* @__PURE__ */ m("ul", { className: "qz-note-tree", children: [
    [...e.folders].map(([i, s]) => {
      const o = `${t}${i}/`;
      return /* @__PURE__ */ u("li", { children: /* @__PURE__ */ m("details", { open: r || n != null && n.startsWith(o) ? !0 : void 0, children: [
        /* @__PURE__ */ m("summary", { children: [
          /* @__PURE__ */ u(Q, { name: "folder" }),
          i
        ] }),
        /* @__PURE__ */ u(Yr, { branch: s, prefix: o, selected: n, query: r, onOpen: a })
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
function Il({ api: e, active: t, location: n, draft: r, onDraft: a, onSaved: i, writeBlocked: s, notes: o, onOpen: l, loadBacklinks: c, indexRevision: d, view: p, focusEditor: g, fullWidth: f, onViewChange: h, onWidthChange: w }) {
  const { workspaceId: _, path: v } = n, [k, z] = T(null), y = p === "rendered", [R, b] = T(""), [M, x] = T(null), [q, L] = T(!1), [U, O] = T(!1), [W, G] = T(null), [te, E] = T(null), [C, A] = T(null), $ = fe(!1), J = fe(null), Y = fe(null), oe = !!r, P = r ?? k, ne = P == null ? void 0 : P.text, Z = (C == null ? void 0 : C.sourceHash) === (P == null ? void 0 : P.source.hash) ? C : null, be = q || U || s || (P == null ? void 0 : P.lineEnding) === "mixed", ve = (Z == null ? void 0 : Z.original) ?? ne, _e = !be && !Z, F = Ze(() => El(o), [o]), le = Ze(
    () => y && ve !== void 0 ? Al(ve, F, { editable: _e }) : [],
    [y, ve, F, _e]
  ), ce = `qz-note-column${f ? " qz-note-column-full" : ""}`;
  na(() => {
    var ae;
    const j = Y.current;
    if (!j) return;
    Y.current = null;
    const N = ((ae = J.current) == null ? void 0 : ae.querySelector(j)) ?? J.current;
    N == null || N.focus({ preventScroll: !0 });
  }, [le]), he(() => {
    if (!t || oe) return;
    let j = !1;
    return L(!0), x(null), we(It(e, _, v)).then((N) => {
      j || (z(Tt(N)), A((ae) => (ae == null ? void 0 : ae.sourceHash) === N.hash ? ae : null));
    }).catch((N) => {
      j || x(xe(N));
    }).finally(() => {
      j || L(!1);
    }), () => {
      j = !0, L(!1);
    };
  }, [t, e, oe, v, _]), he(() => {
    if (!c || d == null) return;
    let j = !1;
    return we(ba(e, _, v)).then((N) => {
      j || (G(N), E(null));
    }).catch((N) => {
      j || (G(null), E(xe(N)));
    }), () => {
      j = !0;
    };
  }, [e, d, c, v, _]);
  const I = async () => {
    if ($.current || !r || r.conflict || s || r.lineEnding === "mixed") return;
    $.current = !0, A(null), O(!0), x(null), b("");
    const j = On(r);
    try {
      const N = await we(ka(e, _, v, j, r.source.hash));
      z(Tt({ ...N, content: j })), a(null, r), b("Note saved."), i();
    } catch (N) {
      const ae = xe(N);
      ae.code === "conflict" ? a({ ...r, conflict: !0 }, r) : x(ae);
    } finally {
      $.current = !1, O(!1);
    }
  }, ie = async () => {
    if (!($.current || r && !window.confirm("Replace your unsaved draft with the version on disk?"))) {
      $.current = !0, O(!0), x(null), b("");
      try {
        z(Tt(await we(It(e, _, v)))), a(null, r ?? null), A(null), b("Note reloaded.");
      } catch (j) {
        x(xe(j));
      } finally {
        $.current = !1, O(!1);
      }
    }
  }, K = (j) => {
    if (!P || be || j === P.text) return;
    const N = { ...P, text: j };
    b(""), a(!N.conflict && On(N) === N.source.content ? null : N);
  }, V = (j, N) => {
    if (be || Z || !P) return;
    const ae = Gr(P.text, j, N);
    ae && A({ start: j, ...ae, original: P.text, sourceHash: P.source.hash });
  }, Fe = (j) => {
    Z && (j && K(Z.original), Y.current = `[data-edit-start="${Z.start}"]`, A(null));
  };
  return /* @__PURE__ */ m("section", { className: "qz-note-editor qz-panel-surface", "aria-label": "Note editor", children: [
    /* @__PURE__ */ m("div", { className: "qz-toolbar qz-note-toolbar", children: [
      /* @__PURE__ */ u("code", { className: "qz-mono qz-path", title: v, children: v }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ u(
          ra,
          {
            segments: [{ key: "rendered", label: "Rendered" }, { key: "raw", label: "Raw" }],
            value: p,
            onChange: (j) => {
              A(null), h(j);
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
            "aria-pressed": f,
            onClick: w,
            children: f ? "Full width" : "Reading width"
          }
        ),
        /* @__PURE__ */ u(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            disabled: q || U,
            onClick: () => void ie(),
            children: "Reload from disk"
          }
        ),
        /* @__PURE__ */ u(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "primary",
            disabled: !r || r.conflict || q || U || s || r.lineEnding === "mixed",
            onClick: () => void I(),
            children: "Save note"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ u(de, { failure: M }),
    q && !P && /* @__PURE__ */ u("p", { className: "qz-muted", role: "status", children: "Loading note…" }),
    (r == null ? void 0 : r.conflict) && /* @__PURE__ */ u("div", { className: "qz-notice", role: "alert", children: "The note changed on disk. Your draft is still here. Copy or review your changes before reloading from disk." }),
    (P == null ? void 0 : P.lineEnding) === "mixed" && /* @__PURE__ */ u("div", { className: "qz-notice", role: "note", children: "This note has mixed line endings and opens read-only to preserve them." }),
    P && (y ? /* @__PURE__ */ m(
      "div",
      {
        ref: J,
        className: `qz-notes-rendered ${ce}`,
        "aria-label": "Markdown preview",
        tabIndex: -1,
        onClick: (j) => {
          if (!(j.target instanceof Element)) return;
          const N = j.target.closest("button.qz-wikilink[data-note-path]"), ae = N == null ? void 0 : N.dataset.notePath;
          ae && o.some((X) => X.path === ae) && l(ae);
          const se = j.target.closest("input.qz-note-task-checkbox[data-note-task-line]");
          if (se && _e) {
            const X = Number(se.dataset.noteTaskLine), ue = Dl(P.text, X, se.checked);
            ue !== P.text && (Y.current = `input[data-note-task-line="${X}"]`, K(ue));
          }
        },
        children: [
          !le.length && /* @__PURE__ */ u("p", { className: "qz-muted", children: "No content yet." }),
          le.map(({ html: j, start: N, end: ae }, se) => {
            if (Z && N === Z.start)
              return /* @__PURE__ */ m("div", { className: "qz-note-block-editor", children: [
                /* @__PURE__ */ u(
                  "textarea",
                  {
                    "aria-label": "Block Markdown",
                    className: "qz-input qz-note-block-text",
                    autoFocus: !0,
                    spellCheck: !1,
                    rows: Math.max(2, (ae ?? N + 1) - N),
                    readOnly: be,
                    value: P.text.slice(Z.from, P.text.length - (Z.original.length - Z.to)),
                    onChange: (ue) => K(Z.original.slice(0, Z.from) + ue.target.value + Z.original.slice(Z.to)),
                    onKeyDown: (ue) => {
                      ue.nativeEvent.isComposing || (ue.key === "Escape" || ue.key === "Enter" && (ue.metaKey || ue.ctrlKey)) && (ue.preventDefault(), ue.stopPropagation(), Fe(ue.key === "Escape"));
                    }
                  }
                ),
                /* @__PURE__ */ m("div", { className: "qz-actions", children: [
                  /* @__PURE__ */ u("button", { type: "button", className: "qz-button", onClick: () => Fe(!1), children: "Done" }),
                  /* @__PURE__ */ u("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => Fe(!0), children: "Cancel" })
                ] })
              ] }, se);
            const X = _e && N !== void 0 && ae !== void 0;
            return /* @__PURE__ */ m("div", { className: "qz-note-block", children: [
              /* @__PURE__ */ u(
                "div",
                {
                  className: X ? "qz-note-block-content" : void 0,
                  onClick: X ? (ue) => {
                    var Re;
                    ue.target instanceof Element && !ue.target.closest("a, button, input, summary") && !((Re = window.getSelection()) != null && Re.toString()) && V(N, ae);
                  } : void 0,
                  dangerouslySetInnerHTML: { __html: j }
                }
              ),
              X && /* @__PURE__ */ u(
                "button",
                {
                  type: "button",
                  className: "qz-button qz-note-edit-block",
                  "data-edit-start": N,
                  "aria-label": `Edit block at line ${N + 1}`,
                  title: "Edit block",
                  onClick: () => V(N, ae),
                  children: /* @__PURE__ */ u(Q, { name: "edit" })
                }
              )
            ] }, se);
          })
        ]
      }
    ) : /* @__PURE__ */ m("label", { className: `qz-field ${ce}`, children: [
      "Note Markdown",
      /* @__PURE__ */ u(
        "textarea",
        {
          autoFocus: g,
          className: "qz-input qz-note-text",
          spellCheck: !1,
          value: P.text,
          readOnly: be,
          onChange: (j) => K(j.target.value)
        }
      )
    ] })),
    /* @__PURE__ */ u("span", { className: "qz-muted qz-note-message", role: "status", children: R || (r ? "Unsaved changes" : "") }),
    P && (te || !!(W != null && W.notes.length)) && /* @__PURE__ */ m("section", { className: "qz-note-backlinks", "aria-label": "Backlinks", children: [
      /* @__PURE__ */ u("h3", { children: "Backlinks" }),
      /* @__PURE__ */ u(de, { failure: te }),
      W && /* @__PURE__ */ u("ul", { children: W.notes.map((j) => /* @__PURE__ */ u("li", { children: /* @__PURE__ */ u("button", { type: "button", className: "qz-wikilink", title: j.path, onClick: () => l(j.path), children: j.title }) }, j.path)) }),
      (W == null ? void 0 : W.truncated) && /* @__PURE__ */ m("p", { className: "qz-muted", children: [
        "Only the first ",
        W.notes.length,
        " backlinks are shown."
      ] })
    ] })
  ] });
}
function Ol(e, t) {
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
const Bl = '.qz-settings{display:grid;align-content:start;gap:20px;width:100%;max-width:1100px;min-width:0;margin-inline:auto;container:qz-settings / inline-size}.qz-settings .qz-settings-grid{display:grid;align-items:start;gap:20px}@container qz-settings (min-width: 760px){.qz-settings .qz-settings-grid{grid-template-columns:minmax(0,1fr) minmax(260px,330px)}}.qz-settings .qz-settings-folders,.qz-settings .qz-settings-add,.qz-settings .qz-settings-folder,.qz-settings .qz-settings-migration,.qz-settings .qz-settings-notice{display:grid;min-width:0;gap:12px}.qz-settings .qz-settings-add,.qz-settings .qz-settings-folder{padding:16px}.qz-settings .qz-settings-add p{margin-block-start:4px}.qz-settings .qz-settings-add .qz-input{width:100%}.qz-settings .qz-settings-add>.qz-button{justify-self:start}.qz-settings .qz-settings-heading,.qz-settings .qz-settings-folder-identity,.qz-settings .qz-settings-folder-controls,.qz-settings .qz-settings-actions,.qz-settings .qz-settings-check{display:flex;align-items:center}.qz-settings .qz-settings-heading,.qz-settings .qz-settings-folder-identity,.qz-settings .qz-settings-check{gap:10px}.qz-settings .qz-settings-heading h3,.qz-settings .qz-settings-add h3,.qz-settings .qz-settings-folder h4{margin:0;color:var(--qz-text);font-size:15px;font-weight:650}.qz-settings .qz-settings-count{padding:1px 7px;border:1px solid var(--qz-border);border-radius:999px;color:var(--qz-muted);font-size:12px;font-variant-numeric:tabular-nums}.qz-settings .qz-settings-folder-icon{display:grid;flex:none;width:36px;height:36px;place-items:center;border-radius:9px;background:var(--qz-accent-soft);color:var(--qz-accent)}.qz-settings .qz-settings-folder-identity>div{display:grid;min-width:0;gap:3px;overflow-wrap:anywhere}.qz-settings .qz-settings-folder-controls{justify-content:space-between;flex-wrap:wrap;gap:8px 12px;padding-block-start:10px;border-top:1px solid var(--qz-border)}.qz-settings .qz-settings-actions{flex-wrap:wrap;gap:4px}.qz-settings .qz-settings-check{min-height:32px;font-size:13px;cursor:pointer}.qz-settings .qz-settings-check input{flex:none;accent-color:var(--qz-accent)}.qz-settings .qz-settings-toggle{display:inline-grid;align-items:center;justify-items:start;-webkit-appearance:none;-moz-appearance:none;appearance:none;width:34px;height:20px;padding:2px;margin:0;border:1px solid var(--qz-muted);border-radius:999px;background:var(--qz-elevated);cursor:inherit}.qz-settings .qz-settings-toggle:before{width:12px;height:12px;border-radius:50%;background:var(--qz-muted);content:""}.qz-settings .qz-settings-toggle:checked{justify-items:end;border-color:var(--qz-accent);background:var(--qz-accent-soft)}.qz-settings .qz-settings-toggle:checked:before{background:var(--qz-accent)}.qz-settings .qz-settings-toggle:disabled{opacity:.6;cursor:default}@media (forced-colors: active){.qz-settings .qz-settings-toggle{display:inline-block;-webkit-appearance:auto;-moz-appearance:auto;appearance:auto;width:16px;height:16px}}.qz-settings .qz-settings-migration,.qz-settings .qz-settings-result{padding:12px;border:1px solid var(--qz-border);border-radius:9px;background:var(--qz-canvas);font-size:13px}.qz-settings .qz-settings-migration{gap:6px}.qz-settings .qz-settings-notice{gap:8px;overflow-wrap:anywhere}.qz-settings .qz-settings-migration-files{max-height:200px;margin:0;padding-inline-start:20px;overflow-y:auto;list-style:disc}.qz-settings .qz-button[data-destructive]{color:var(--qz-danger)}.qz-settings-disclosure{border-top:1px solid var(--qz-border);font-size:13px}.qz-settings-disclosure>summary{padding-block:8px;font-weight:650;cursor:pointer}.qz-column-list{display:grid;gap:8px;padding:0;list-style:none}.qz-column-row{display:flex;flex-wrap:wrap;align-items:end;gap:6px 10px}.qz-column-row .qz-field{flex:1 1 140px}.qz-column-row .qz-field>span{overflow-wrap:anywhere}.qz-column-row .qz-input,.qz-agent-prompt{width:100%}';
function xt() {
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
function Ll(e) {
  const { api: t } = e, [n, r] = T(null), [a, i] = T(null), [s, o] = T(null), [l, c] = T(0), [d, p] = T(""), [g, f] = T(""), { busy: h, failure: w, run: _ } = xt();
  he(() => {
    let k = !1;
    return Promise.all([ia(t), mt(t)]).then(([z, y]) => {
      k || (r(z), o(y.writeBlocked ?? null), i(null));
    }).catch((z) => !k && i(xe(z))), () => {
      k = !0;
    };
  }, [t, l]);
  const v = async () => {
    await _(() => sa(t, d.trim(), g.trim() || void 0)) && (p(""), f(""), c((k) => k + 1));
  };
  return /* @__PURE__ */ m("div", { className: "qz-settings", children: [
    /* @__PURE__ */ u("style", { children: Bl }),
    /* @__PURE__ */ m("header", { children: [
      /* @__PURE__ */ u("h2", { className: "qz-section-title", children: "Settings" }),
      /* @__PURE__ */ u("p", { className: "qz-section-description", children: "Manage connected folders and board columns, or start a notes request in KiroCrew." })
    ] }),
    /* @__PURE__ */ u(de, { failure: a }),
    /* @__PURE__ */ u(de, { failure: s }),
    /* @__PURE__ */ m("div", { className: "qz-settings-grid", children: [
      /* @__PURE__ */ m("section", { className: "qz-settings-folders", "aria-labelledby": "qz-settings-folders", children: [
        /* @__PURE__ */ m("div", { className: "qz-settings-heading", children: [
          /* @__PURE__ */ u("h3", { id: "qz-settings-folders", children: "Connected folders" }),
          n && /* @__PURE__ */ u("span", { className: "qz-settings-count", children: n.length })
        ] }),
        !n && !a && /* @__PURE__ */ u("p", { className: "qz-muted", role: "status", children: "Loading folders…" }),
        (n == null ? void 0 : n.length) === 0 && /* @__PURE__ */ u("p", { className: "qz-empty", children: "Add a folder to see its notes, tickets, and TODOs." }),
        n == null ? void 0 : n.map((k) => /* @__PURE__ */ u(
          $l,
          {
            api: t,
            workspace: k,
            writeBlocked: s,
            onChanged: () => c((z) => z + 1),
            onColumnsSaved: (z) => r((y) => (y == null ? void 0 : y.map((R) => R.id === z.id ? { ...R, ...z } : R)) ?? null)
          },
          k.id
        ))
      ] }),
      /* @__PURE__ */ m(
        "form",
        {
          className: "qz-panel-surface qz-settings-add",
          "aria-labelledby": "qz-settings-add",
          "aria-busy": h,
          onSubmit: (k) => {
            k.preventDefault(), d.trim() && !h && v();
          },
          children: [
            /* @__PURE__ */ m("div", { children: [
              /* @__PURE__ */ u("h3", { id: "qz-settings-add", children: "Add a folder" }),
              /* @__PURE__ */ u("p", { className: "qz-muted", children: "Use any local folder of Markdown files. To use the same files in Kiro Notes, attach the folder there separately." })
            ] }),
            /* @__PURE__ */ m("label", { className: "qz-field", children: [
              "Absolute folder path",
              /* @__PURE__ */ u("input", { className: "qz-input", placeholder: "/home/you/notes", value: d, onChange: (k) => p(k.target.value) })
            ] }),
            /* @__PURE__ */ m("label", { className: "qz-field", children: [
              /* @__PURE__ */ m("span", { children: [
                "Name ",
                /* @__PURE__ */ u("span", { className: "qz-muted", children: "(optional)" })
              ] }),
              /* @__PURE__ */ u("input", { className: "qz-input", placeholder: "e.g. Project notes", value: g, onChange: (k) => f(k.target.value) })
            ] }),
            /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "primary", type: "submit", disabled: h || !d.trim(), children: "Add folder" }),
            /* @__PURE__ */ u(de, { failure: w })
          ]
        }
      )
    ] })
  ] });
}
function $l(e) {
  const { api: t, workspace: n } = e, { busy: r, failure: a, run: i } = xt(), [s, o] = T(null), [l, c] = T(!1);
  return he(() => {
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
            onChange: () => void i(() => ca(t, n.id, !n.companion)).then((d) => d && e.onChanged())
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
            onClick: () => void i(() => jt(t, { workspaceId: n.id, manual: !0, rebuild: !0 })).then(
              (d) => d && o("Rebuild requested.")
            ),
            disabled: r,
            children: "Rebuild index"
          }
        ),
        !l && /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "quiet", type: "button", onClick: () => c(!0), disabled: r, children: "Remove…" })
      ] })
    ] }),
    n.companion && /* @__PURE__ */ u(Ul, { api: t, workspace: n, onSaved: e.onColumnsSaved }),
    /* @__PURE__ */ u(Pl, { workspace: n }),
    !!n.oldTasks && /* @__PURE__ */ u(jl, { api: t, workspace: n, writeBlocked: e.writeBlocked, onChanged: e.onChanged }),
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
            onClick: () => void i(() => la(t, n.id, !!n.oldTasks)).then((d) => d && e.onChanged()),
            disabled: r,
            children: n.oldTasks ? `Remove and delete ${n.oldTasks} task(s)` : "Remove"
          }
        ),
        /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "quiet", type: "button", onClick: () => c(!1), disabled: r, children: "Cancel" })
      ] })
    ] }),
    s && /* @__PURE__ */ u("span", { className: "qz-muted", role: "status", children: s }),
    /* @__PURE__ */ u(de, { failure: a })
  ] });
}
function Ul({ api: e, workspace: t, onSaved: n }) {
  const [r, a] = T(null), [i, s] = T(""), [o, l] = T(null), [c, d] = T(""), { busy: p, failure: g, run: f } = xt(), h = (r == null ? void 0 : r.columns) ?? t.columns, w = o ?? i.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 32), _ = h.length < 20 && !!i.trim() && /^[a-z][a-z0-9_]{0,31}$/.test(w) && w !== "repair" && !h.some((b) => b.id === w), v = t.columns.some((b) => !h.some((M) => M.id === b.id)), k = (b) => {
    a({ columns: b, version: (r == null ? void 0 : r.version) ?? t.columnsVersion }), d("");
  }, z = (b, M) => {
    const x = [...h], [q] = x.splice(b, 1);
    x.splice(b + M, 0, q), k(x);
  }, y = () => f(async () => {
    if (!r) return;
    const b = await oa(e, t.id, h, r.version);
    n(b), a(null), d("Board columns saved.");
  }), R = JSON.stringify(h) !== JSON.stringify(t.columns);
  return /* @__PURE__ */ u(ye, { children: /* @__PURE__ */ m("details", { className: "qz-settings-disclosure", children: [
    /* @__PURE__ */ u("summary", { children: "Board columns" }),
    /* @__PURE__ */ m("div", { className: "qz-stack", children: [
      /* @__PURE__ */ u("p", { className: "qz-muted", children: "Rename, reorder, add, or remove columns for this folder. The first column is the default for new tickets." }),
      /* @__PURE__ */ u("ul", { className: "qz-column-list", children: h.map((b, M) => /* @__PURE__ */ m("li", { className: "qz-column-row", children: [
        /* @__PURE__ */ m("label", { className: "qz-field", children: [
          /* @__PURE__ */ u("span", { className: "qz-mono", children: b.id }),
          /* @__PURE__ */ u(
            "input",
            {
              className: "qz-input",
              "aria-label": `Name for ${b.id}`,
              value: b.label,
              maxLength: 40,
              disabled: p,
              onChange: (x) => k(h.map((q) => q.id === b.id ? { ...q, label: x.target.value } : q))
            }
          )
        ] }),
        /* @__PURE__ */ m("div", { className: "qz-settings-actions", children: [
          /* @__PURE__ */ u("button", { className: "qz-button", type: "button", "aria-label": `Move column ${b.id} up`, disabled: p || M === 0, onClick: () => z(M, -1), children: /* @__PURE__ */ u(Q, { name: "up" }) }),
          /* @__PURE__ */ u("button", { className: "qz-button", type: "button", "aria-label": `Move column ${b.id} down`, disabled: p || M === h.length - 1, onClick: () => z(M, 1), children: /* @__PURE__ */ u(Q, { name: "down" }) }),
          /* @__PURE__ */ u("button", { className: "qz-button", type: "button", "aria-label": `Remove column ${b.id}`, disabled: p || h.length === 1, onClick: () => k(h.filter((x) => x.id !== b.id)), children: "Remove" })
        ] })
      ] }, b.id)) }),
      h.length < 20 && /* @__PURE__ */ m("form", { className: "qz-column-row", onSubmit: (b) => {
        b.preventDefault(), !(p || !_) && (k([...h, { id: w, label: i.trim() }]), s(""), l(null));
      }, children: [
        /* @__PURE__ */ m("label", { className: "qz-field", children: [
          "New column name",
          /* @__PURE__ */ u("input", { className: "qz-input", value: i, maxLength: 40, disabled: p, onChange: (b) => s(b.target.value) })
        ] }),
        /* @__PURE__ */ m("label", { className: "qz-field", children: [
          "New status ID",
          /* @__PURE__ */ u("input", { className: "qz-input qz-mono", value: w, maxLength: 32, disabled: p, onChange: (b) => l(b.target.value) })
        ] }),
        /* @__PURE__ */ u("button", { className: "qz-button", type: "submit", disabled: p || !_, children: "Add column" })
      ] }),
      /* @__PURE__ */ u("p", { className: "qz-muted", children: "Status IDs are saved in notes. Use a unique ID starting with a lowercase letter, followed by lowercase letters, digits, or underscores." }),
      v && /* @__PURE__ */ u("p", { className: "qz-notice", children: "Tickets in removed columns will appear in Needs repair until you move them or restore the column with the same status ID." }),
      /* @__PURE__ */ m("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "primary", type: "button", disabled: p || !R || h.some((b) => !b.label.trim()), onClick: () => void y(), children: "Save columns" }),
        R && /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: p, onClick: () => {
          a(null), d("");
        }, children: "Discard changes" }),
        /* @__PURE__ */ u("span", { className: "qz-muted", role: "status", children: c })
      ] }),
      /* @__PURE__ */ u(de, { failure: g })
    ] })
  ] }) });
}
function Pl({ workspace: e }) {
  const { openChat: t } = Qr(), n = Ol(e.path, e.columns), r = fe(null), [a, i] = T(""), s = async () => {
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
function jl({ api: e, workspace: t, writeBlocked: n, onChanged: r }) {
  const [a, i] = T(null), [s, o] = T(null), [l, c] = T(!1), [d, p] = T(!1), { busy: g, failure: f, run: h } = xt(), w = async () => {
    const v = await Ca(e, t.id), k = URL.createObjectURL(new Blob([JSON.stringify(v, null, 2)], { type: "application/json" })), z = document.createElement("a");
    z.href = k, z.download = `quartizo-old-tasks-${t.id}.json`, z.click(), setTimeout(() => URL.revokeObjectURL(k), 1e3), c(!0);
  }, _ = async () => {
    if (!a) return;
    const v = await qa(e, t.id, a.planHash, d);
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
      /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: g, onClick: () => void h(w), children: "Export old tasks" }),
      /* @__PURE__ */ u("button", { className: "qz-button", type: "button", disabled: g || !t.companion, onClick: () => void h(async () => {
        i(await Ea(e, t.id)), o(null), p(!1);
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
      a.warnings.map((v, k) => /* @__PURE__ */ u("p", { children: v }, k)),
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
        /* @__PURE__ */ u("input", { type: "checkbox", checked: d, onChange: (v) => p(v.target.checked), disabled: g }),
        "I reviewed the changed converted notes; keep their latest contents when resuming"
      ] }),
      /* @__PURE__ */ m("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "primary", type: "button", disabled: g || !!n || a.complete || !a.tasks.length, onClick: () => void h(_), children: a.backup ? "Resume and verify migration" : "Back up and migrate" }),
        /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: g, onClick: () => i(null), children: "Cancel" })
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
    /* @__PURE__ */ u(de, { failure: f })
  ] });
}
const Jl = ".qz-app{--qz-canvas: var(--bg, Canvas);--qz-surface: var(--card, Canvas);--qz-elevated: var(--bg-elevated, Canvas);--qz-border: var(--border, color-mix(in srgb, CanvasText 18%, Canvas));--qz-text: var(--text-strong, CanvasText);--qz-muted: color-mix(in srgb, var(--muted, CanvasText) 87%, var(--qz-text));--qz-accent: var(--accent, LinkText);--qz-accent-soft: var(--accent-subtle, color-mix(in srgb, var(--qz-accent) 13%, transparent));--qz-ok: var(--ok, #4e9a6b);--qz-warning: var(--warn, #ad7628);--qz-danger: var(--danger, #c7465d);--qz-info: var(--info, var(--qz-accent));container:qz-app / inline-size;width:100%;max-width:1560px;min-width:0;margin-inline:auto;padding:24px clamp(16px,3%,40px) 36px;color:var(--qz-text)}.qz-app,.qz-app *{box-sizing:border-box}.qz-app [hidden]{display:none!important}.qz-app :where(h1,h2,h3,p,ul){margin:0}.qz-app :where(button,input,textarea,select){font:inherit}.qz-app :is(button,summary,input,textarea,select,.qz-board):focus-visible{outline:2px solid var(--qz-accent);outline-offset:2px}.qz-app :is(button,input,textarea,select):disabled{opacity:.55;cursor:default}.qz-app input[type=checkbox]{accent-color:var(--qz-accent)}.qz-icon{width:1rem;height:1rem;flex:none}.qz-header,.qz-brand,.qz-tabs,.qz-view-heading,.qz-toolbar,.qz-actions,.qz-inline-field{display:flex;align-items:center;min-width:0}.qz-header,.qz-view-heading,.qz-toolbar{justify-content:space-between;flex-wrap:wrap;gap:12px 20px}.qz-header{padding:0 0 20px;border-bottom:1px solid var(--qz-border)}.qz-brand{gap:12px}.qz-mark{display:grid;place-items:center;flex:none;width:46px;height:46px;border:1px solid color-mix(in srgb,var(--qz-accent) 34%,var(--qz-border));border-radius:13px;background:linear-gradient(145deg,var(--qz-accent-soft),var(--qz-surface));color:var(--qz-accent)}.qz-mark .qz-icon{width:26px;height:26px}.qz-brand h1{font-size:24px;font-weight:700;letter-spacing:-.035em;line-height:1.1}.qz-brand p{margin-top:3px;color:var(--qz-muted);font-size:12px}.qz-tabs{max-width:100%;gap:3px;padding:4px;border:1px solid var(--qz-border);border-radius:12px;background:var(--qz-surface)}.qz-tabs button{display:flex;align-items:center;justify-content:center;gap:7px;min-height:36px;padding:6px 12px;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--qz-muted);font-size:13px;font-weight:600;cursor:pointer}.qz-tabs button:hover{color:var(--qz-text);background:var(--qz-elevated)}.qz-tabs button[aria-selected=true]{border-color:color-mix(in srgb,var(--qz-accent) 25%,var(--qz-border));background:var(--qz-accent-soft);color:var(--qz-text)}.qz-tabs button[aria-selected=true] .qz-icon{color:var(--qz-accent)}.qz-content{padding-top:24px}.qz-stack{display:grid;gap:14px;min-width:0}.qz-section-title{font-size:27px;font-weight:700;letter-spacing:-.032em;line-height:1.17}.qz-section-description{margin-top:5px;color:var(--qz-muted)}.qz-muted{color:var(--qz-muted);font-weight:400}.qz-mono{font:400 12px/1.5 var(--mono, ui-monospace, monospace)}.qz-path{display:block;min-width:0;overflow:hidden;color:var(--qz-muted);text-overflow:ellipsis;white-space:nowrap}.qz-actions{gap:6px;flex-wrap:wrap}.qz-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;max-width:100%;min-height:36px;padding:5px 11px;border:1px solid var(--qz-border);border-radius:8px;background:var(--qz-surface);color:var(--qz-text);font-size:13px;font-weight:600;text-align:center;cursor:pointer}.qz-button:not(:disabled):hover{background:var(--qz-elevated);border-color:var(--border-strong, var(--qz-muted))}.qz-button[data-variant=primary]{border-color:var(--qz-accent);background:var(--qz-accent);color:var(--accent-fg, var(--qz-canvas))}.qz-button[data-variant=primary]:not(:disabled):hover{border-color:var(--accent-hover, var(--qz-accent));background:var(--accent-hover, var(--qz-accent))}.qz-button[data-variant=quiet]{border-color:transparent;background:transparent;color:var(--qz-muted)}.qz-button[data-variant=quiet]:not(:disabled):hover{color:var(--qz-text)}.qz-icon-button{min-width:36px;padding-inline:8px}.qz-input{min-width:0;max-width:100%;min-height:36px;padding:6px 9px;border:1px solid var(--qz-border);border-radius:8px;background:var(--qz-elevated);color:var(--qz-text);font-size:13px}.qz-input::placeholder{color:var(--qz-muted);opacity:1}.qz-field{display:grid;gap:5px;min-width:0;font-size:13px;font-weight:600}.qz-field .qz-input{width:100%;font-weight:400}.qz-inline-field{gap:8px;color:var(--qz-muted);font-size:13px}.qz-inline-field .qz-input{max-width:min(36ch,52%);font-weight:600}.qz-check-label{display:flex;align-items:center;gap:8px}.qz-panel-surface{min-width:0;border:1px solid var(--qz-border);border-radius:12px;background:var(--qz-surface)}.qz-notice{padding:11px 13px;border:1px solid color-mix(in srgb,var(--qz-warning) 42%,var(--qz-border));border-radius:9px;background:color-mix(in srgb,var(--qz-warning) 7%,var(--qz-surface));font-size:13px;overflow-wrap:anywhere}.qz-notice[data-variant=neutral]{border-color:var(--qz-border);background:var(--qz-surface)}.qz-notice.qz-error{border-color:color-mix(in srgb,var(--qz-danger) 53%,var(--qz-border));background:color-mix(in srgb,var(--qz-danger) 9%,var(--qz-surface))}.qz-empty{display:grid;place-items:center;gap:8px;padding:28px 16px;border:1px dashed var(--qz-border);border-radius:12px;color:var(--qz-muted);text-align:center}.qz-empty :is(h2,h3){color:var(--qz-text);font-size:17px;font-weight:650}.qz-empty .qz-button{margin-top:4px}.qz-empty-icon,.qz-note-icon{display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:9px;background:var(--qz-accent-soft);color:var(--qz-accent)}.qz-visually-hidden{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.qz-board-meta{gap:2px 12px;padding-block:2px}.qz-board-meta>.qz-actions{margin-inline-start:auto}.qz-result-count{color:var(--qz-muted);font-size:12px;font-weight:600}.qz-index{display:inline-flex;align-items:baseline;gap:7px;color:var(--qz-muted);font-size:12px}.qz-index:empty{display:none}.qz-board{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(172px,1fr);gap:10px;min-width:0;padding:2px 2px 10px;overflow-x:auto;overscroll-behavior-inline:contain}.qz-lane{--qz-status: var(--qz-muted);min-width:0;min-height:308px;padding:9px;border:1px solid color-mix(in srgb,var(--qz-status) 20%,var(--qz-border));border-radius:12px;background:linear-gradient(180deg,color-mix(in srgb,var(--qz-status) 7%,var(--qz-surface)),var(--qz-surface) 105px)}.qz-app [data-lane-status=ready]{--qz-status: var(--qz-info)}.qz-app [data-lane-status=in_progress]{--qz-status: var(--qz-accent)}.qz-app [data-lane-status=review]{--qz-status: var(--qz-warning)}.qz-app [data-lane-status=done]{--qz-status: var(--qz-ok)}.qz-app [data-lane-status=repair]{--qz-status: var(--qz-danger)}.qz-lane-heading{display:flex;align-items:center;gap:7px;padding:3px 2px 10px;font-size:13px;font-weight:650;overflow-wrap:anywhere}.qz-dot{width:8px;height:8px;flex:none;border-radius:50%;background:var(--qz-status, var(--qz-ok))}.qz-dot[data-attention=true]{background:var(--qz-warning)}.qz-count{margin-inline-start:auto;padding:1px 6px;border:1px solid var(--qz-border);border-radius:999px;color:var(--qz-muted);font-size:11px;font-variant-numeric:tabular-nums}.qz-lane-empty{padding:11px;border:1px dashed var(--qz-border);border-radius:8px;color:var(--qz-muted);font-size:12px;text-align:center}.qz-cards,.qz-todo-list{list-style:none;padding:0}.qz-cards{display:grid;gap:8px}.qz-cards li{min-width:0}.qz-cards li[draggable=true]{cursor:grab}.qz-cards li[draggable=true]:active{cursor:grabbing}.qz-ticket{border:1px solid var(--qz-border);border-radius:9px;background:var(--qz-elevated);box-shadow:var(--shadow-sm, none)}.qz-ticket:hover,.qz-ticket:focus-within{border-color:var(--border-strong, var(--qz-muted))}.qz-ticket-content{display:grid;gap:5px;padding:10px 10px 8px}.qz-note-link{display:flex;align-items:start;justify-content:space-between;gap:6px;padding:0;border:0;background:transparent;color:var(--qz-text);font-size:14px;font-weight:650;line-height:1.4;text-align:start;overflow-wrap:anywhere;cursor:pointer}.qz-note-link .qz-icon{width:13px;height:13px;margin-top:3px;color:var(--qz-muted)}.qz-note-link:hover{text-decoration:underline}.qz-ticket-progress{display:flex;align-items:center;gap:8px;margin-top:3px;color:var(--qz-muted);font-size:11px;font-variant-numeric:tabular-nums}.qz-ticket-progress progress{width:min(54px,40%);height:5px;accent-color:var(--qz-ok);border:0;border-radius:6px;overflow:hidden}.qz-ticket-progress progress::-webkit-progress-bar{background:var(--qz-border)}.qz-ticket-progress progress::-webkit-progress-value{border-radius:6px;background:var(--qz-ok)}.qz-badge{padding:2px 5px;border-radius:5px;background:color-mix(in srgb,var(--qz-warning) 17%,var(--qz-surface));font-size:11px;overflow-wrap:anywhere}.qz-ticket-footer{position:relative;padding:5px;border-top:1px solid var(--qz-border)}.qz-ticket-status{padding-inline-end:39px}.qz-ticket-status .qz-input{width:100%;min-height:32px;padding:3px 4px;border-color:transparent;background:transparent;color:var(--qz-muted)}.qz-ticket-status .qz-input:not(:disabled):hover{background:var(--qz-surface);border-color:var(--qz-border)}.qz-ticket-actions summary{position:absolute;inset-block-start:5px;inset-inline-end:5px;min-height:32px;list-style:none}.qz-ticket-actions summary::-webkit-details-marker{display:none}.qz-ticket-action-list{display:grid;gap:1px;margin-top:5px;padding-top:5px;border-top:1px solid var(--qz-border)}.qz-ticket-action-list .qz-button{justify-content:start;min-height:32px;text-align:start}.qz-ticket-action-list .qz-destructive:not(:disabled){color:var(--qz-danger)}.qz-ticket-form{display:grid;gap:12px;max-width:630px;padding:16px}.qz-ticket-form h3{font-size:17px;font-weight:650}.qz-note-preview{max-height:180px;margin:0;padding:10px;overflow:auto;background:var(--qz-canvas);white-space:pre-wrap;overflow-wrap:anywhere}.qz-todos{width:100%;max-width:1100px;margin-inline:auto}.qz-todo-filters{display:flex;flex-wrap:wrap;gap:12px;padding:12px}.qz-todo-filters .qz-field{flex:1 1 135px}.qz-todo-filters .qz-field:first-child{flex:3 1 245px}.qz-search{position:relative;display:block}.qz-search .qz-icon{position:absolute;inset-block-start:10px;inset-inline-start:9px;color:var(--qz-muted);pointer-events:none}.qz-search .qz-input{padding-inline-start:32px}.qz-todo-header{display:flex;align-items:center;gap:10px;min-width:0;padding:12px 14px}.qz-todo-identity{flex:1;min-width:0}.qz-todo-identity h3{display:flex;align-items:center;flex-wrap:wrap;gap:5px 9px;font-size:15px;font-weight:650;overflow-wrap:anywhere}.qz-todo-meta{display:flex;align-items:baseline;gap:6px;color:var(--qz-muted);font-size:12px}.qz-todo-meta>span:first-child{min-width:0;overflow-wrap:anywhere}.qz-status-pill{--qz-status: var(--qz-muted);display:inline-flex;align-items:center;gap:5px;padding:1px 7px;border-radius:999px;background:color-mix(in srgb,var(--qz-status) 13%,var(--qz-surface));font-size:11px;font-weight:500}.qz-status-pill .qz-dot{width:6px;height:6px}.qz-todo-row{display:flex;align-items:center;border-top:1px solid var(--qz-border)}.qz-todo-row:hover,.qz-todo-row:focus-within{background:var(--qz-elevated)}.qz-todo-row:last-child{border-radius:0 0 12px 12px}.qz-todo-check{display:flex;align-items:baseline;gap:10px;flex:1;min-width:0;padding:10px 14px;overflow-wrap:anywhere;cursor:pointer}.qz-todo-check input{flex:none;align-self:start;width:16px;height:16px;margin:2px 0 0}.qz-todo-check:has(input:disabled){cursor:default}.qz-todo-row[data-checked=true] .qz-todo-check span{color:var(--qz-muted);text-decoration:line-through}.qz-todo-row>.qz-button{margin-inline-end:6px}@container qz-app (max-width: 650px){.qz-board{grid-auto-columns:clamp(170px,65cqi,244px)}}@container qz-app (max-width: 520px){.qz-header{gap:14px;padding-bottom:14px}.qz-tabs{width:100%}.qz-tabs button{flex:1;gap:5px;padding-inline:5px}.qz-content{padding-top:18px}.qz-section-title{font-size:24px}.qz-inline-field{width:100%}.qz-inline-field .qz-input{flex:1;max-width:none}.qz-board-meta>.qz-actions{margin-inline-start:0}.qz-todo-filters .qz-field:first-child{flex-basis:100%}.qz-todo-header{padding-inline:10px}.qz-todo-header .qz-note-icon{display:none}}@media (pointer: coarse){.qz-app :is(.qz-button,.qz-tabs button,.qz-input,.qz-ticket-status .qz-input,.qz-ticket-actions summary){min-height:42px}}@container qz-app (max-width: 360px){.qz-tabs .qz-icon{display:none}}", Me = [
  { id: "tasks", label: "Tasks", icon: "board" },
  { id: "todos", label: "TODOs", icon: "checklist" },
  { id: "notes", label: "Notes", icon: "note" },
  { id: "settings", label: "Settings", icon: "settings" }
];
function Gl() {
  const e = ea(), [t, n] = T("tasks"), [r, a] = T(null), i = fe(null), s = (c) => {
    var g;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(c.key)) return;
    c.preventDefault();
    const d = Me.findIndex((f) => f.id === t), p = c.key === "Home" ? Me[0] : c.key === "End" ? Me[Me.length - 1] : Me[(d + (c.key === "ArrowRight" ? 1 : Me.length - 1)) % Me.length];
    n(p.id), (g = c.currentTarget.querySelector(`#qz-tab-${p.id}`)) == null || g.focus();
  }, o = () => {
    var c, d;
    n("settings"), (d = (c = i.current) == null ? void 0 : c.querySelector("#qz-tab-settings")) == null || d.focus();
  }, l = (c) => {
    var d, p;
    a(c), n("notes"), (p = (d = i.current) == null ? void 0 : d.querySelector("#qz-tab-notes")) == null || p.focus();
  };
  return /* @__PURE__ */ m("div", { className: "qz-app", children: [
    /* @__PURE__ */ u("style", { children: Jl }),
    /* @__PURE__ */ m("header", { className: "qz-header", children: [
      /* @__PURE__ */ m("div", { className: "qz-brand", children: [
        /* @__PURE__ */ u("span", { className: "qz-mark", children: /* @__PURE__ */ u(Q, { name: "gem" }) }),
        /* @__PURE__ */ m("div", { children: [
          /* @__PURE__ */ u("h1", { children: "Quartizo" }),
          /* @__PURE__ */ u("p", { children: "Notes, tasks, and TODOs" })
        ] })
      ] }),
      /* @__PURE__ */ u("div", { className: "qz-tabs", ref: i, role: "tablist", "aria-label": "Quartizo", onKeyDown: s, children: Me.map((c) => /* @__PURE__ */ m(
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
      /* @__PURE__ */ u("div", { hidden: t !== "tasks", children: /* @__PURE__ */ u(Fa, { api: e, active: t === "tasks", onSettings: o, onOpenNote: l }) }),
      t === "todos" && /* @__PURE__ */ u(Ba, { api: e, onSettings: o, onOpenNote: l }),
      /* @__PURE__ */ u("div", { hidden: t !== "notes", children: /* @__PURE__ */ u(Ml, { api: e, active: t === "notes", request: r, onSettings: o }) }),
      t === "settings" && /* @__PURE__ */ u(Ll, { api: e })
    ] })
  ] });
}
export {
  Gl as default
};
