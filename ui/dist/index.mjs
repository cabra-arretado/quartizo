import { jsx as u, jsxs as m, Fragment as se } from "react/jsx-runtime";
import { useNavigate as Vt, useChatLauncher as $n, useAppApi as Jn } from "@kirocrew/app-sdk";
import { useState as D, useEffect as X, useRef as K, useMemo as Ce, useCallback as st, useDeferredValue as Ln } from "react";
const _e = "/apps/quartizo/api", On = 15e3, Qt = { id: "repair", label: "Needs repair" };
function ne(e) {
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
function re(e, t = On) {
  let n;
  const r = new Promise((a, i) => {
    n = setTimeout(() => i(new Error(`request timed out after ${Math.round(t / 1e3)} s`)), t);
  });
  return Promise.race([e, r]).finally(() => clearTimeout(n));
}
function dt(e) {
  const t = Object.entries(e).filter((n) => n[1] !== void 0 && n[1] !== "").map(([n, r]) => `${encodeURIComponent(n)}=${encodeURIComponent(r)}`);
  return t.length ? `?${t.join("&")}` : "";
}
async function Wn(e) {
  return (await e.get(`${_e}/workspaces`)).workspaces;
}
async function Un(e, t, n) {
  return (await e.post(`${_e}/workspaces`, n ? { path: t, name: n, companion: !0 } : { path: t, companion: !0 })).workspace;
}
async function Pn(e, t, n, r) {
  return (await e.put(V(t, "columns"), { columns: n, columnsVersion: r })).workspace;
}
async function Zn(e, t, n = !1) {
  await e.del(`${_e}/workspaces/${t}${n ? "?deleteOldTasks=1" : ""}`);
}
const ht = `${_e}/companion`;
function Pe(e) {
  return e.get(ht);
}
function Xn(e, t, n) {
  return e.put(`${_e}/workspaces/${t}/companion`, { enabled: n });
}
function pt(e, t = {}) {
  const n = {};
  return t.workspaceId !== void 0 && (n.workspaceId = t.workspaceId), t.rebuild && (n.rebuild = !0), t.manual && (n.manual = !0), e.post(`${ht}/refresh`, n);
}
function Yn(e, t) {
  return e.get(`${_e}/workspaces/${t}/board`);
}
function Kn(e, t, n) {
  return e.get(`${ht}/todos${dt({ workspace: n === void 0 ? void 0 : String(n), state: t })}`);
}
function Hn(e, t) {
  const n = [], r = new Map(e.map((a) => [a.id, []]));
  r.set(Qt.id, n);
  for (const a of t) (r.get(a.lane) ?? n).push(a);
  return Object.fromEntries(r);
}
function ft(e) {
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
function Gn(e, t = Date.now()) {
  if (!e) return "";
  if (e.state === "scanning") {
    if (!e.progress) return "Scan queued…";
    const { notes: r, rebuild: a } = e.progress;
    return `Scanning… ${r} ${r === 1 ? "note" : "notes"} read${a ? " (rebuild)" : ""}`;
  }
  if (!e.indexedAt) return "";
  const n = e.files ?? 0;
  return `${n} ${n === 1 ? "note" : "notes"} indexed ${Vn(e.indexedAt, t)}`;
}
function Vn(e, t) {
  const n = Math.max(0, Math.round((t - e) / 1e3));
  if (n < 5) return "just now";
  if (n < 60) return `${n} s ago`;
  const r = Math.round(n / 60);
  return r < 60 ? `${r} min ago` : new Date(e).toLocaleString();
}
function Qn(e, t) {
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
function He(e) {
  return e.trim() || "(empty)";
}
function V(e, t) {
  return `${_e}/workspaces/${e}/${t}`;
}
function ot(e, t, n) {
  return e.get(V(t, "source") + dt({ path: n }));
}
function er(e, t) {
  return e.get(V(t, "notes"));
}
function tr(e, t, n) {
  return e.get(V(t, "backlinks") + dt({ path: n }));
}
function nr(e, t, n) {
  return e.post(V(t, "notes"), { path: n });
}
function rr(e, t, n, r, a) {
  return e.put(V(t, "source"), { path: n, content: r, expectedHash: a });
}
function ar(e, t, n) {
  return e.post(V(t, "tickets"), n);
}
function ir(e, t, n, r) {
  return e.post(V(t, "tickets/promote"), { path: n.path, expectedHash: n.hash, ...r === void 0 ? {} : { status: r } });
}
function sr(e, t, n) {
  return e.post(V(t, "tickets/move"), n);
}
function or(e, t, n, r) {
  return e.post(V(t.workspaceId, "todos/toggle"), {
    path: t.path,
    expectedHash: t.hash,
    markerStart: n.markerStart,
    line: n.line,
    column: n.column,
    checked: r
  });
}
function lr(e, t, n, r = !1) {
  return e.post(V(t, "tickets/rebalance"), { status: n, confirm: !0, reconcile: r });
}
function fe(e, t) {
  var n, r;
  return e != null && e.writeBlocked ? e.writeBlocked.message : e != null && e.migrationPending ? "Finish the old task migration in Settings before editing this workspace." : !e || e.state !== "ready" || e.complete !== !0 || e.retained || e.outdated || e.error ? "Wait for a complete, current index before editing. Refresh if needed." : t != null && t.status && ((n = e.maintenance) != null && n.includes(t.status)) ? "This column has unfinished order maintenance. Resume maintenance before moving cards." : t && (!t.hash || t.retained || (r = t.diagnostics) != null && r.some((a) => a.code !== "unconfigured_status")) ? "Repair or refresh this note before editing it." : null;
}
function cr(e, t, n, r) {
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
function ur(e, t) {
  return e.get(V(t, "migration"));
}
function dr(e, t, n, r = !1) {
  return e.post(V(t, "migration"), { planHash: n, confirm: !0, ...r ? { acceptCurrent: !0 } : {} });
}
function hr(e, t) {
  return e.get(V(t, "legacy-tasks"));
}
function pr(e, t, n) {
  return e.post(V(t, "tickets/demote"), { path: n.path, expectedHash: n.hash });
}
const en = "/md-notebook";
function fr(e) {
  return (e.split("/").pop() ?? e).replace(/\.md$/i, "");
}
const mr = {
  gem: /* @__PURE__ */ u("path", { d: "M8 4h8l4.5 5L12 21 3.5 9 8 4Zm-4.5 5h17M8 4l1 5 3 12 3-12 1-5" }),
  board: /* @__PURE__ */ m(se, { children: [
    /* @__PURE__ */ u("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }),
    /* @__PURE__ */ u("path", { d: "M9 4v16m6-16v16M6 8h.1M12 8h.1m6 0h.1" })
  ] }),
  checklist: /* @__PURE__ */ u("path", { d: "m3 6 2 2 3-4m3 3h10M3 13l2 2 3-4m3 3h10M3 20h5m3 0h10" }),
  settings: /* @__PURE__ */ m(se, { children: [
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
  more: /* @__PURE__ */ m(se, { children: [
    /* @__PURE__ */ u("circle", { cx: "5", cy: "12", r: "1" }),
    /* @__PURE__ */ u("circle", { cx: "12", cy: "12", r: "1" }),
    /* @__PURE__ */ u("circle", { cx: "19", cy: "12", r: "1" })
  ] }),
  copy: /* @__PURE__ */ m(se, { children: [
    /* @__PURE__ */ u("rect", { x: "8", y: "8", width: "12", height: "12", rx: "2" }),
    /* @__PURE__ */ u("path", { d: "M16 4H6a2 2 0 0 0-2 2v10" })
  ] }),
  search: /* @__PURE__ */ m(se, { children: [
    /* @__PURE__ */ u("circle", { cx: "10.5", cy: "10.5", r: "5.5" }),
    /* @__PURE__ */ u("path", { d: "m15 15 5 5" })
  ] }),
  up: /* @__PURE__ */ u("path", { d: "m6 14 6-6 6 6" }),
  down: /* @__PURE__ */ u("path", { d: "m6 10 6 6 6-6" }),
  check: /* @__PURE__ */ u("path", { d: "m5 12 4 4L19 6" }),
  minus: /* @__PURE__ */ u("path", { d: "M5 12h14" })
};
function j({ name: e }) {
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
      children: mr[e]
    }
  );
}
function Z({ failure: e }) {
  return e ? /* @__PURE__ */ u("div", { role: "alert", className: "qz-notice qz-error", "data-code": e.code, children: e.message }) : null;
}
function xt() {
  try {
    return window.localStorage;
  } catch {
    return;
  }
}
function tn() {
  const [e, t] = D(() => typeof document > "u" || document.visibilityState !== "hidden");
  return X(() => {
    const n = () => t(document.visibilityState !== "hidden");
    return document.addEventListener("visibilitychange", n), () => document.removeEventListener("visibilitychange", n);
  }, []), e;
}
const gr = 1500, br = 3e3, qt = "quartizo:workspace";
function nn(e, t = !0) {
  const [n, r] = D(null), [a, i] = D(null);
  return X(() => {
    if (!t) return;
    let s = !1;
    return Pe(e).then((o) => {
      s || (r(o.workspaces.filter((l) => l.workspace.companion)), i(o.available ? null : { message: o.error ?? "The Markdown index is unavailable." }));
    }).catch((o) => !s && i(ne(o))), () => {
      s = !0;
    };
  }, [e, t]), { companions: n, failure: a };
}
function rn(e, t, n, r, a, i, s) {
  const o = tn(), [l, c] = D(null), [p, h] = D(null), [g, f] = D(0), [d, R] = D(!1), q = K(a), z = K(i), v = K(s);
  q.current = a, z.current = i, v.current = s, X(() => {
    c(null), h(null);
  }, [n]), X(() => {
    if (!t || !o) return;
    let _ = !1, b, F, k;
    const y = async () => {
      let E = !1;
      try {
        const B = await re(Pe(e));
        if (_) return;
        if (!B.available) throw new Error(B.error ?? "The Markdown index is unavailable.");
        const N = B.workspaces.filter(({ workspace: O }) => O.companion), T = N.filter(({ workspace: O }) => r === void 0 || O.id === r), $ = Object.fromEntries(T.map(({ workspace: O, index: U }) => [O.id, U]));
        E = T.some(({ index: O }) => O.state === "scanning");
        const I = JSON.stringify(N.map(({ workspace: O, index: U }) => [O.id, O.columnsVersion, U.indexedAt])), ee = JSON.stringify($);
        if (F !== I) {
          const O = await re(q.current());
          if (_) return;
          c(O), F = I, k = void 0;
        } else if (k !== ee) {
          const O = v.current;
          c((U) => U && O(U, $)), k = ee;
        }
        h(null), R(!1);
      } catch (B) {
        _ || (h(ne(B)), R(!1));
      }
      _ || (b = setTimeout(y, E ? gr : br));
    };
    return y(), () => {
      _ = !0, clearTimeout(b);
    };
  }, [t, e, o, n, g, r]);
  const w = st(async () => {
    R(!0);
    try {
      await re(z.current()), h(null), f((_) => _ + 1);
    } catch (_) {
      h(ne(_));
    } finally {
      R(!1);
    }
  }, []), x = st(() => {
    R(!0), f((_) => _ + 1);
  }, []);
  return { data: l, failure: p, busy: d, refresh: w, reload: x };
}
function an({ statuses: e }) {
  const t = Date.now(), n = e.map((r) => Gn(r, t)).filter(Boolean);
  return /* @__PURE__ */ u("span", { className: "qz-index", role: "status", children: n.length > 0 && /* @__PURE__ */ m(se, { children: [
    /* @__PURE__ */ u("span", { className: "qz-dot", "data-attention": e.some((r) => r.state === "scanning" || !!ft(r)) }),
    n.join(" · ")
  ] }) });
}
function sn({ statuses: e }) {
  const t = new Set(e.map(ft).filter(Boolean));
  return /* @__PURE__ */ u(se, { children: [...t].map((n) => /* @__PURE__ */ u("div", { role: "note", className: "qz-notice", children: n }, n)) });
}
function on({ path: e, compact: t = !1 }) {
  const n = fr(e), [r, a] = D("idle");
  X(() => {
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
  return /* @__PURE__ */ m(se, { children: [
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
          /* @__PURE__ */ u(j, { name: r === "copied" ? "check" : "copy" }),
          (!t || r !== "idle") && (r === "copied" ? "Copied" : r === "failed" ? "Copy failed" : "Copy name")
        ]
      }
    ),
    /* @__PURE__ */ u("span", { className: "qz-visually-hidden", role: "status", children: r === "copied" ? "Note name copied." : r === "failed" ? "Could not copy note name." : "" })
  ] });
}
function ln({ onSettings: e }) {
  return /* @__PURE__ */ m("div", { className: "qz-empty", children: [
    /* @__PURE__ */ u("span", { className: "qz-empty-icon", children: /* @__PURE__ */ u(j, { name: "folder" }) }),
    /* @__PURE__ */ u("h2", { children: "Connect a notes folder" }),
    /* @__PURE__ */ u("p", { children: "Add a folder of Markdown files to see its tickets and TODOs here." }),
    /* @__PURE__ */ u("button", { type: "button", className: "qz-button", "data-variant": "primary", onClick: e, children: "Open Settings" })
  ] });
}
function vr(e) {
  var o, l;
  const t = e.active ?? !0, { companions: n, failure: r } = nn(e.api, t), [a, i] = D(() => {
    var p;
    const c = Number((p = xt()) == null ? void 0 : p.getItem(qt));
    return Number.isInteger(c) && c > 0 ? c : null;
  }), s = ((o = n == null ? void 0 : n.find((c) => c.workspace.id === a)) == null ? void 0 : o.workspace) ?? ((l = n == null ? void 0 : n[0]) == null ? void 0 : l.workspace) ?? null;
  return X(() => {
    var c;
    try {
      s && ((c = xt()) == null || c.setItem(qt, String(s.id)));
    } catch {
    }
  }, [s]), r && !n ? /* @__PURE__ */ u(Z, { failure: r }) : n ? s ? /* @__PURE__ */ m("div", { className: "qz-stack", children: [
    /* @__PURE__ */ u(Z, { failure: r }),
    /* @__PURE__ */ m("div", { className: "qz-view-heading", children: [
      /* @__PURE__ */ m("div", { children: [
        /* @__PURE__ */ u("h2", { className: "qz-section-title", children: "Task board" }),
        /* @__PURE__ */ u("p", { className: "qz-section-description", children: "Plan and track tickets stored in your notes." })
      ] }),
      /* @__PURE__ */ m("label", { className: "qz-inline-field", children: [
        /* @__PURE__ */ u(j, { name: "folder" }),
        /* @__PURE__ */ u("span", { children: "Workspace" }),
        /* @__PURE__ */ u("select", { className: "qz-input", value: s.id, onChange: (c) => i(Number(c.target.value)), children: n.map((c) => /* @__PURE__ */ u("option", { value: c.workspace.id, children: c.workspace.name }, c.workspace.id)) })
      ] })
    ] }),
    n.map(({ workspace: c }) => /* @__PURE__ */ u("div", { hidden: c.id !== s.id, children: /* @__PURE__ */ u(
      kr,
      {
        api: e.api,
        workspace: c,
        active: t && c.id === s.id,
        onSettings: e.onSettings,
        onOpenNote: e.onOpenNote
      }
    ) }, c.uid))
  ] }) : /* @__PURE__ */ u(ln, { onSettings: e.onSettings }) : /* @__PURE__ */ u("p", { className: "qz-empty", role: "status", children: "Loading workspaces…" });
}
function mt(e) {
  const [t, n] = D(!1), [r, a] = D(null), i = K(!0), s = K(!1);
  return X(() => (i.current = !0, () => {
    i.current = !1;
  }), []), { pending: t, failure: r, run: async (l) => {
    if (s.current) return !1;
    s.current = !0, n(!0), a(null);
    try {
      return await re(l()), i.current && e(), !0;
    } catch (c) {
      if (i.current) {
        const p = ne(c);
        p.status === 409 && (p.message += " Refresh to review the current file, then retry your change."), (p.message.includes("timed out") || !p.status) && (p.message += " The result may be unknown; refresh and check the file before retrying."), a(p);
      }
      return !1;
    } finally {
      s.current = !1, i.current && n(!1);
    }
  } };
}
function kr(e) {
  var ae, Re, Fe, M, he, pe;
  const { api: t, workspace: n, active: r } = e, a = n.id, i = Vt(), { data: s, failure: o, busy: l, refresh: c, reload: p } = rn(
    t,
    r,
    String(a),
    a,
    () => Yn(t, a),
    () => pt(t, { workspaceId: a, manual: !0 }),
    (A, H) => ({ ...A, index: H[String(a)] ?? A.index })
  ), h = mt(p), g = (s == null ? void 0 : s.workspace.columns) ?? n.columns, f = Ce(() => Hn(g, (s == null ? void 0 : s.tickets) ?? []), [g, s]), d = f.repair.length > 0 ? [...g, Qt] : g, R = K(null), q = K(null), [z, v] = D(null), w = K(null);
  X(() => {
    var A;
    z && ((A = w.current) == null || A.focus());
  }, [z]);
  const [x, _] = D(!1), b = !r || !!o || l || h.pending || x || !!fe(s == null ? void 0 : s.index), [F, k] = D(""), y = ((ae = g.find((A) => A.id === F)) == null ? void 0 : ae.id) ?? ((Re = s == null ? void 0 : s.index.maintenance) == null ? void 0 : Re[0]) ?? g[0].id, [E, B] = D(!1), [N, T] = D(!1), [$, I] = D(!1), ee = s ? [s.index] : [], O = st((A) => {
    k(A), I(!0);
  }, []), [U, oe] = D(null);
  X(() => {
    var H;
    if (!U || b || !s) return;
    const A = Array.from(((H = R.current) == null ? void 0 : H.querySelectorAll("[data-note-path]")) ?? []).find((G) => G.dataset.notePath === U);
    A == null || A.focus(), oe(null);
  }, [U, b, s]);
  const ke = (A, H, G) => {
    var J;
    b || fe(s == null ? void 0 : s.index, A) || !s || (J = s.index.maintenance) != null && J.includes(H) || h.run(() => sr(t, a, cr(s.tickets, A, H, G))).then((le) => {
      le && oe(A.path);
    });
  }, S = (A, H, G) => {
    A.preventDefault(), A.stopPropagation();
    const J = q.current;
    if (q.current = null, !J || (G == null ? void 0 : G.path) === J.path) return;
    const le = f[H].filter((te) => te.path !== J.path), P = G ? le.findIndex((te) => te.path === G.path) : void 0;
    P !== void 0 && P < 0 || ke(J, H, P);
  }, W = (A) => {
    var kt, zt;
    const H = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"], G = A.target;
    if (!G.hasAttribute("data-lane")) return;
    const J = Number(G.dataset.lane), le = Number(G.dataset.index);
    if (!H.includes(A.key) || Number.isNaN(J) || Number.isNaN(le)) return;
    let P = J, te = le;
    if (A.key === "ArrowUp" && (te = Math.max(0, le - 1)), A.key === "ArrowDown" && (te = le + 1), A.key === "Home" && (te = 0), A.key === "End" && (te = Number.MAX_SAFE_INTEGER), A.key === "ArrowLeft" || A.key === "ArrowRight") {
      const jn = A.key === "ArrowLeft" ? -1 : 1;
      do
        P += jn;
      while (P >= 0 && P < d.length && f[d[P].id].length === 0);
      if (P < 0 || P >= d.length) return;
    }
    te = Math.min(te, f[d[P].id].length - 1), A.preventDefault(), (zt = (kt = R.current) == null ? void 0 : kt.querySelector(`[data-lane="${P}"][data-index="${te}"]`)) == null || zt.focus();
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
            "aria-expanded": z === "create",
            onClick: () => v(z === "create" ? null : "create"),
            disabled: h.pending || x,
            children: [
              /* @__PURE__ */ u(j, { name: "plus" }),
              "New ticket"
            ]
          }
        ),
        /* @__PURE__ */ m(
          "button",
          {
            type: "button",
            className: "qz-button",
            "aria-expanded": z === "promote",
            onClick: () => v(z === "promote" ? null : "promote"),
            disabled: h.pending || x,
            children: [
              /* @__PURE__ */ u(j, { name: "note" }),
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
            "aria-expanded": $,
            onClick: () => I((A) => !A),
            disabled: b,
            children: "Rebalance…"
          }
        ),
        /* @__PURE__ */ m("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => i(en), children: [
          /* @__PURE__ */ u(j, { name: "external" }),
          "Open Kiro Notes"
        ] })
      ] })
    ] }),
    ["create", "promote"].map((A) => /* @__PURE__ */ u("div", { hidden: z !== A, children: /* @__PURE__ */ u(zr, { mode: A, api: t, workspace: n, columns: g, firstField: z === A ? w : void 0, disabled: !r || !!o || l || h.pending || !!fe(s == null ? void 0 : s.index), maintenance: (s == null ? void 0 : s.index.maintenance) ?? [], onBusy: _, onChanged: p, onClose: () => v(null), onMaintenanceNeeded: O }) }, A)),
    /* @__PURE__ */ m("div", { className: "qz-toolbar qz-board-meta", children: [
      s && /* @__PURE__ */ m("span", { className: "qz-result-count", children: [
        s.tickets.length,
        " ",
        s.tickets.length === 1 ? "ticket" : "tickets"
      ] }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ u(an, { statuses: ee }),
        /* @__PURE__ */ m("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => void c(), disabled: l || h.pending, children: [
          /* @__PURE__ */ u(j, { name: "refresh" }),
          "Refresh"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ u(sn, { statuses: ee }),
    /* @__PURE__ */ u(Z, { failure: o }),
    /* @__PURE__ */ u(Z, { failure: h.failure }),
    fe(s == null ? void 0 : s.index) && s && /* @__PURE__ */ u("div", { role: "note", className: "qz-notice", children: fe(s.index) }),
    $ || ((Fe = h.failure) == null ? void 0 : Fe.code) === "rank_exhausted" || ((M = h.failure) == null ? void 0 : M.code) === "maintenance_pending" || (he = s == null ? void 0 : s.index.maintenance) != null && he.length ? /* @__PURE__ */ m("div", { className: "qz-notice qz-stack", children: [
      /* @__PURE__ */ u("p", { children: "Rebalance a column to restore space between card positions. Progress is saved if interrupted." }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ u("select", { className: "qz-input", "aria-label": "Column to rebalance", value: y, onChange: (A) => k(A.target.value), children: g.map((A) => /* @__PURE__ */ u("option", { value: A.id, children: A.label }, A.id)) }),
        /* @__PURE__ */ u("button", { type: "button", className: "qz-button", onClick: () => B(!0), disabled: !r || h.pending || !!(s != null && s.index.writeBlocked), children: "Review column…" })
      ] }),
      E && /* @__PURE__ */ m("div", { className: "qz-stack", role: "alertdialog", "aria-label": "Rebalance column", children: [
        /* @__PURE__ */ u("p", { children: "Update ordering in each note of this column? Other editors may see progress before all files finish." }),
        !!((pe = s == null ? void 0 : s.index.maintenance) != null && pe.includes(y)) && /* @__PURE__ */ m("label", { className: "qz-check-label", children: [
          /* @__PURE__ */ u("input", { type: "checkbox", checked: N, onChange: (A) => T(A.target.checked), disabled: h.pending }),
          "Keep the latest note contents and resume ordering after an external edit"
        ] }),
        /* @__PURE__ */ m("div", { className: "qz-actions", children: [
          /* @__PURE__ */ u("button", { type: "button", className: "qz-button", disabled: !r || h.pending || !!(s != null && s.index.writeBlocked), onClick: () => void h.run(() => lr(t, a, y, N)).then((A) => {
            A && (B(!1), T(!1));
          }), children: "Rebalance column" }),
          /* @__PURE__ */ u("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: h.pending, onClick: () => B(!1), children: "Cancel" })
        ] })
      ] })
    ] }) : null,
    !s && !o && /* @__PURE__ */ u("p", { className: "qz-empty", role: "status", children: "Loading the board…" }),
    s && s.tickets.length === 0 && s.index.state !== "scanning" && /* @__PURE__ */ m("p", { className: "qz-notice", "data-variant": "neutral", children: [
      "No tickets in “",
      n.name,
      "” yet. Create a ticket or use an existing note."
    ] }),
    s && /* @__PURE__ */ u("div", { ref: R, className: "qz-board", tabIndex: 0, onKeyDown: W, "aria-label": `Board of ${n.name}`, role: "group", children: d.map(({ id: A, label: H }, G) => /* @__PURE__ */ m(
      "section",
      {
        "aria-label": H,
        className: "qz-lane",
        "data-lane-status": A,
        onDragOver: (J) => {
          !b && A !== "repair" && J.preventDefault();
        },
        onDrop: (J) => {
          A !== "repair" && S(J, A);
        },
        children: [
          /* @__PURE__ */ m("h3", { className: "qz-lane-heading", children: [
            /* @__PURE__ */ u("span", { className: "qz-dot" }),
            H,
            /* @__PURE__ */ u("span", { className: "qz-count", children: f[A].length })
          ] }),
          f[A].length === 0 && /* @__PURE__ */ u("p", { className: "qz-lane-empty", children: "No tickets" }),
          /* @__PURE__ */ u("ul", { className: "qz-cards", children: f[A].map((J, le) => /* @__PURE__ */ u(
            "li",
            {
              draggable: !b && !fe(s.index, J),
              onDragStart: (P) => {
                q.current = J, P.dataTransfer.setData("text/plain", J.path), P.dataTransfer.effectAllowed = "move";
              },
              onDragEnd: () => {
                q.current = null;
              },
              onDragOver: (P) => {
                !b && A !== "repair" && P.preventDefault();
              },
              onDrop: (P) => {
                A !== "repair" && S(P, A, J);
              },
              children: /* @__PURE__ */ u(
                xr,
                {
                  ticket: J,
                  lane: G,
                  index: le,
                  columns: g,
                  onOpen: () => e.onOpenNote({ workspaceId: a, path: J.path }),
                  disabled: b || !!fe(s.index, J),
                  maintenance: s.index.maintenance ?? [],
                  onMove: (P, te) => ke(J, P, te),
                  onDemote: () => {
                    window.confirm(`Remove “${J.title}” from the board? Its note and TODOs will remain.`) && h.run(() => pr(t, a, J));
                  },
                  count: f[A].length
                }
              )
            },
            J.path
          )) })
        ]
      },
      A
    )) })
  ] });
}
function zr(e) {
  const [t, n] = D(""), [r, a] = D(""), [i, s] = D(""), [o, l] = D(""), c = (e.columns.find((N) => N.id === o) ?? e.columns[0]).id, [p, h] = D(null), [g, f] = D(null), [d, R] = D(!1), q = K(0), z = K(!0);
  X(() => (z.current = !0, () => {
    z.current = !1, q.current++;
  }), []);
  const v = mt(e.onChanged);
  X(() => (e.onBusy(v.pending), () => e.onBusy(!1)), [v.pending, e.onBusy]);
  const w = e.disabled || v.pending || d, x = e.maintenance.includes(c);
  X(() => {
    var N, T;
    (((N = v.failure) == null ? void 0 : N.code) === "rank_exhausted" || ((T = v.failure) == null ? void 0 : T.code) === "maintenance_pending") && e.onMaintenanceNeeded(c);
  }, [v.failure, e.onMaintenanceNeeded, c]);
  const _ = () => {
    q.current++, R(!1), n(""), a(""), s(""), h(null), f(null), e.onClose();
  }, b = t.trim().endsWith(".md") ? t.trim() : `${t.trim()}.md`, F = async () => {
    const N = ++q.current;
    R(!0), f(null), h(null);
    try {
      const T = await re(ot(e.api, e.workspace.id, b));
      z.current && N === q.current && h(T);
    } catch (T) {
      z.current && N === q.current && f(ne(T));
    } finally {
      z.current && N === q.current && R(!1);
    }
  }, k = async () => {
    await v.run(() => e.mode === "create" ? ar(e.api, e.workspace.id, { path: b, title: r.trim(), body: i, status: c }) : ir(e.api, e.workspace.id, p, c)) && z.current && (n(""), a(""), s(""), h(null), e.onClose());
  }, y = e.mode === "create", E = y ? "New ticket" : "Use existing note", B = !w && !x && !!t.trim() && (y ? !!r.trim() : !!p);
  return /* @__PURE__ */ m("section", { className: "qz-panel-surface qz-ticket-form", "aria-label": E, children: [
    /* @__PURE__ */ u("h3", { children: E }),
    /* @__PURE__ */ m("form", { className: "qz-stack", onSubmit: (N) => {
      N.preventDefault(), B && k();
    }, children: [
      y && /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Title",
        /* @__PURE__ */ u("input", { className: "qz-input", ref: e.firstField, "aria-label": "Ticket title", placeholder: "Fix login", value: r, disabled: v.pending, onChange: (N) => a(N.target.value) })
      ] }),
      /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Note path in ",
        e.workspace.name,
        /* @__PURE__ */ u(
          "input",
          {
            className: "qz-input",
            ref: y ? void 0 : e.firstField,
            "aria-label": "Ticket note path",
            placeholder: "tickets/fix-login.md",
            value: t,
            disabled: v.pending,
            onChange: (N) => {
              q.current++, R(!1), n(N.target.value), h(null);
            }
          }
        )
      ] }),
      y ? /* @__PURE__ */ m("label", { className: "qz-field", children: [
        /* @__PURE__ */ m("span", { children: [
          "Description ",
          /* @__PURE__ */ u("span", { className: "qz-muted", children: "· Optional Markdown" })
        ] }),
        /* @__PURE__ */ u("textarea", { className: "qz-input", "aria-label": "Ticket description", placeholder: "What needs to happen?", value: i, disabled: v.pending, onChange: (N) => s(N.target.value), rows: 4 })
      ] }) : /* @__PURE__ */ m(se, { children: [
        /* @__PURE__ */ u("div", { className: "qz-actions", children: /* @__PURE__ */ u("button", { type: "button", className: "qz-button", disabled: w || !t.trim(), onClick: () => void F(), children: "Preview note" }) }),
        p && /* @__PURE__ */ m(se, { children: [
          /* @__PURE__ */ u("pre", { className: "qz-mono qz-note-preview", children: p.content }),
          /* @__PURE__ */ u("p", { className: "qz-muted", children: "The note’s content and existing properties are preserved." })
        ] })
      ] }),
      (y || p) && /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Initial status",
        /* @__PURE__ */ u("select", { className: "qz-input", value: c, disabled: v.pending, onChange: (N) => l(N.target.value), children: e.columns.map((N) => /* @__PURE__ */ u("option", { value: N.id, children: N.label }, N.id)) })
      ] }),
      x && /* @__PURE__ */ u("span", { className: "qz-notice", children: "Resume ordering maintenance for this column before adding a ticket." }),
      /* @__PURE__ */ u(Z, { failure: g }),
      /* @__PURE__ */ u(Z, { failure: v.failure }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ u("button", { type: "submit", className: "qz-button", "data-variant": "primary", disabled: !B, children: y ? "Create ticket" : "Make ticket" }),
        /* @__PURE__ */ u("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: v.pending, onClick: _, children: "Cancel" })
      ] })
    ] })
  ] });
}
function xr(e) {
  const { ticket: t } = e, n = t.lane === "repair" ? "" : t.lane;
  return /* @__PURE__ */ m("article", { className: "qz-ticket", children: [
    /* @__PURE__ */ m("div", { className: "qz-ticket-content", children: [
      /* @__PURE__ */ m("button", { type: "button", className: "qz-note-link", "data-lane": e.lane, "data-index": e.index, "data-note-path": t.path, "aria-label": `Open note: ${t.title}`, onClick: e.onOpen, children: [
        t.title,
        /* @__PURE__ */ u(j, { name: "external" })
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
        /* @__PURE__ */ u("summary", { className: "qz-button qz-icon-button", "data-variant": "quiet", "aria-label": `Actions for ${t.title}`, title: "Ticket actions", children: /* @__PURE__ */ u(j, { name: "more" }) }),
        /* @__PURE__ */ m("div", { className: "qz-ticket-action-list", children: [
          /* @__PURE__ */ u(on, { path: t.path }),
          /* @__PURE__ */ m("button", { type: "button", className: "qz-button", "data-variant": "quiet", "aria-label": `Move ${t.title} up`, disabled: e.disabled || e.index === 0 || !n, onClick: () => e.onMove(n, e.index - 1), children: [
            /* @__PURE__ */ u(j, { name: "up" }),
            "Move up"
          ] }),
          /* @__PURE__ */ m("button", { type: "button", className: "qz-button", "data-variant": "quiet", "aria-label": `Move ${t.title} down`, disabled: e.disabled || e.index >= e.count - 1 || !n, onClick: () => e.onMove(n, e.index + 1), children: [
            /* @__PURE__ */ u(j, { name: "down" }),
            "Move down"
          ] }),
          /* @__PURE__ */ m("button", { type: "button", className: "qz-button qz-destructive", "data-variant": "quiet", "aria-label": `Remove ${t.title} from board`, disabled: e.disabled, onClick: e.onDemote, children: [
            /* @__PURE__ */ u(j, { name: "minus" }),
            "Remove ticket…"
          ] })
        ] })
      ] })
    ] })
  ] });
}
function qr(e) {
  const { api: t } = e, n = Vt(), { companions: r, failure: a } = nn(t), [i, s] = D("all"), [o, l] = D("open"), [c, p] = D(""), h = K(null);
  X(() => {
    r && i !== "all" && !r.some((k) => k.workspace.id === i) && s("all");
  }, [r, i]);
  const g = i === "all" ? void 0 : i, f = !!r && r.length > 0, { data: d, failure: R, busy: q, refresh: z, reload: v } = rn(
    t,
    f,
    `${i}:${o}`,
    g,
    () => Kn(t, o, g),
    () => pt(t, { workspaceId: g, manual: !0 }),
    (k, y) => ({ ...k, index: y })
  ), w = Ce(() => Qn((d == null ? void 0 : d.groups) ?? [], c), [d, c]), x = w.reduce((k, y) => k + y.items.length, 0), _ = d ? Object.values(d.index) : [], b = mt(v), F = (k, y, E) => {
    b.pending || R || q || fe(d == null ? void 0 : d.index[String(k.workspaceId)], k) || y.markerStart === void 0 || b.run(() => or(t, k, y, E));
  };
  return a ? /* @__PURE__ */ u(Z, { failure: a }) : r ? r.length === 0 ? /* @__PURE__ */ u(ln, { onSettings: e.onSettings }) : /* @__PURE__ */ m("div", { className: "qz-stack qz-todos", children: [
    /* @__PURE__ */ m("div", { className: "qz-view-heading", children: [
      /* @__PURE__ */ m("div", { children: [
        /* @__PURE__ */ u("h2", { className: "qz-section-title", children: "Note checklists" }),
        /* @__PURE__ */ u("p", { className: "qz-section-description", children: "Find and complete Markdown TODOs across your shared folders." })
      ] }),
      /* @__PURE__ */ m("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => n(en), children: [
        /* @__PURE__ */ u(j, { name: "external" }),
        "Open Kiro Notes"
      ] })
    ] }),
    /* @__PURE__ */ m("div", { className: "qz-todo-filters qz-panel-surface", children: [
      /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Search",
        /* @__PURE__ */ m("span", { className: "qz-search", children: [
          /* @__PURE__ */ u(j, { name: "search" }),
          /* @__PURE__ */ u("input", { className: "qz-input", ref: h, type: "search", "aria-label": "Filter TODOs", placeholder: "Search tasks or notes…", value: c, onChange: (k) => p(k.target.value) })
        ] })
      ] }),
      r.length > 1 && /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Workspace",
        /* @__PURE__ */ m("select", { className: "qz-input", value: i, onChange: (k) => s(k.target.value === "all" ? "all" : Number(k.target.value)), children: [
          /* @__PURE__ */ u("option", { value: "all", children: "All workspaces" }),
          r.map((k) => /* @__PURE__ */ u("option", { value: k.workspace.id, children: k.workspace.name }, k.workspace.id))
        ] })
      ] }),
      /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Show",
        /* @__PURE__ */ m("select", { className: "qz-input", value: o, onChange: (k) => l(k.target.value), children: [
          /* @__PURE__ */ u("option", { value: "open", children: "Open" }),
          /* @__PURE__ */ u("option", { value: "done", children: "Completed" }),
          /* @__PURE__ */ u("option", { value: "all", children: "All" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ m("div", { className: "qz-toolbar qz-board-meta", children: [
      d && /* @__PURE__ */ m("span", { className: "qz-result-count", role: "status", children: [
        x,
        " ",
        x === 1 ? "item" : "items",
        " in ",
        w.length,
        " ",
        w.length === 1 ? "note" : "notes"
      ] }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ u(an, { statuses: _ }),
        /* @__PURE__ */ m("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => void z(), disabled: q || b.pending, children: [
          /* @__PURE__ */ u(j, { name: "refresh" }),
          "Refresh"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ u(sn, { statuses: _ }),
    /* @__PURE__ */ u(Z, { failure: R }),
    /* @__PURE__ */ u(Z, { failure: b.failure }),
    (d == null ? void 0 : d.truncated) && /* @__PURE__ */ u("div", { role: "note", className: "qz-notice", children: "Only the first items are listed. Narrow the list by workspace or completion status." }),
    !d && !R && /* @__PURE__ */ u("p", { className: "qz-empty", role: "status", children: "Loading TODOs…" }),
    d && w.length === 0 && /* @__PURE__ */ m("div", { className: "qz-empty", children: [
      /* @__PURE__ */ u("span", { className: "qz-empty-icon", children: /* @__PURE__ */ u(j, { name: c.trim() ? "search" : "checklist" }) }),
      /* @__PURE__ */ u("h3", { children: c.trim() ? "No matching TODOs" : "No TODOs to show" }),
      /* @__PURE__ */ u("p", { children: c.trim() ? "Try a different search or clear the filter." : "Choose a different workspace or completion status to see more." }),
      c.trim() && /* @__PURE__ */ u("button", { type: "button", className: "qz-button", onClick: () => {
        var k;
        p(""), (k = h.current) == null || k.focus();
      }, children: "Clear search" })
    ] }),
    /* @__PURE__ */ u("div", { className: "qz-stack", children: w.map((k) => /* @__PURE__ */ m("section", { "aria-label": k.title, className: "qz-todo-note qz-panel-surface", children: [
      /* @__PURE__ */ m("header", { className: "qz-todo-header", children: [
        /* @__PURE__ */ u("span", { className: "qz-note-icon", children: /* @__PURE__ */ u(j, { name: "note" }) }),
        /* @__PURE__ */ m("div", { className: "qz-todo-identity", children: [
          /* @__PURE__ */ m("h3", { children: [
            k.title,
            k.ticket && k.status && /* @__PURE__ */ m("span", { className: "qz-status-pill", "data-lane-status": k.status, children: [
              /* @__PURE__ */ u("span", { className: "qz-dot" }),
              k.statusLabel ?? k.status
            ] })
          ] }),
          /* @__PURE__ */ m("p", { className: "qz-todo-meta", children: [
            /* @__PURE__ */ u("span", { children: k.workspace }),
            /* @__PURE__ */ u("span", { "aria-hidden": "true", children: "/" }),
            /* @__PURE__ */ u("span", { className: "qz-mono qz-path", title: k.path, children: k.path })
          ] })
        ] }),
        /* @__PURE__ */ u(on, { path: k.path, compact: !0 })
      ] }),
      /* @__PURE__ */ u("ul", { className: "qz-todo-list", children: k.items.map((y) => /* @__PURE__ */ m("li", { className: "qz-todo-row", "data-checked": y.checked, style: { paddingInlineStart: `${Math.min(y.depth, 4) * 0.8}rem` }, children: [
        /* @__PURE__ */ m("label", { className: "qz-todo-check", children: [
          /* @__PURE__ */ u(
            "input",
            {
              type: "checkbox",
              "aria-label": `Complete ${He(y.text)}`,
              checked: y.checked,
              disabled: b.pending || !!R || q || !!fe(d == null ? void 0 : d.index[String(k.workspaceId)], k) || y.markerStart === void 0,
              onChange: (E) => F(k, y, E.target.checked)
            }
          ),
          /* @__PURE__ */ u("span", { children: He(y.text) })
        ] }),
        /* @__PURE__ */ u(
          "button",
          {
            type: "button",
            title: `Open note · ${k.path}:${y.line}:${y.column}${y.heading ? ` · ${y.heading}` : ""}`,
            "aria-label": `Open note: ${He(y.text)}`,
            onClick: () => e.onOpenNote({ workspaceId: k.workspaceId, path: k.path }),
            className: "qz-button qz-icon-button",
            "data-variant": "quiet",
            children: /* @__PURE__ */ u(j, { name: "external" })
          }
        )
      ] }, y.ordinal)) })
    ] }, `${k.workspaceId}:${k.path}`)) })
  ] }) : /* @__PURE__ */ u("p", { className: "qz-empty", role: "status", children: "Loading workspaces…" });
}
/*! markdown-it 15.0.3 https://github.com/markdown-it/markdown-it @license MIT */
var wt = Object.defineProperty, Ze = (e, t) => {
  let n = {};
  for (var r in e) wt(n, r, {
    get: e[r],
    enumerable: !0
  });
  return wt(n, Symbol.toStringTag, { value: "Module" }), n;
}, _t = {};
function wr(e) {
  let t = _t[e];
  if (t) return t;
  t = _t[e] = [];
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
function De(e, t) {
  typeof t != "string" && (t = De.defaultChars);
  let n = wr(t);
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
            let p = o << 12 & 61440 | l << 6 & 4032 | c & 63;
            a += p < 2048 || p >= 55296 && p <= 57343 ? "���" : String.fromCharCode(p), i += 6;
            continue;
          }
        }
        if ((o & 248) == 240 && i + 9 < s) {
          let l = parseInt(r.slice(i + 4, i + 6), 16), c = parseInt(r.slice(i + 7, i + 9), 16), p = parseInt(r.slice(i + 10, i + 12), 16);
          if ((l & 192) == 128 && (c & 192) == 128 && (p & 192) == 128) {
            let h = o << 18 & 1835008 | l << 12 & 258048 | c << 6 & 4032 | p & 63;
            h < 65536 || h > 1114111 ? a += "����" : (h -= 65536, a += String.fromCharCode(55296 + (h >> 10), 56320 + (h & 1023))), i += 9;
            continue;
          }
        }
        a += "�";
      }
    }
    return a;
  });
}
De.defaultChars = ";/?:@&=+$,#", De.componentChars = "";
var Rt = {};
function _r(e) {
  let t = Rt[e];
  if (t) return t;
  t = Rt[e] = [];
  for (let n = 0; n < 128; n++) {
    let r = String.fromCharCode(n);
    /^[0-9a-z]$/i.test(r) ? t.push(r) : t.push("%" + ("0" + n.toString(16).toUpperCase()).slice(-2));
  }
  for (let n = 0; n < e.length; n++) t[e.charCodeAt(n)] = e[n];
  return t;
}
function me(e, t, n) {
  typeof t != "string" && (n = t, t = me.defaultChars), n === void 0 && (n = !0);
  let r = _r(t), a = "";
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
me.defaultChars = ";/?:@&=+$,-_.!~*'()#", me.componentChars = "-_.!~*'()";
function lt(e) {
  let t = "";
  return t += e.protocol || "", t += e.slashes ? "//" : "", t += e.auth ? e.auth + "@" : "", e.hostname && e.hostname.indexOf(":") !== -1 ? t += "[" + e.hostname + "]" : t += e.hostname || "", t += e.port ? ":" + e.port : "", t += e.pathname || "", t += e.search || "", t += e.hash || "", t;
}
function Oe() {
  this.protocol = null, this.slashes = null, this.auth = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.pathname = null;
}
var Rr = /^([a-z0-9.+-]+:)/i, yr = /:[0-9]*$/, Cr = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/, yt = [
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
], Ct = [
  "/",
  "?",
  "#"
], Dr = 255, Dt = /^[+a-z0-9A-Z_-]{0,63}$/, Ar = /^([+a-z0-9A-Z_-]{0,63})(.*)$/, At = {
  javascript: !0,
  "javascript:": !0
}, Ft = {
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
function ct(e, t) {
  if (e && e instanceof Oe) return e;
  let n = new Oe();
  return n.parse(e, t), n;
}
Oe.prototype.parse = function(e, t) {
  let n, r, a, i = e;
  if (i = i.trim(), !t && e.split("#").length === 1) {
    let c = Cr.exec(i);
    if (c) return this.pathname = c[1], c[2] && (this.search = c[2]), this;
  }
  let s = Rr.exec(i);
  if (s && (s = s[0], n = s.toLowerCase(), this.protocol = s, i = i.substr(s.length)), (t || s || i.match(/^\/\/[^@\/]+@[^@\/]+/)) && (a = i.substr(0, 2) === "//", a && !(s && At[s]) && (i = i.substr(2), this.slashes = !0)), !At[s] && (a || s && !Ft[s])) {
    let c = -1;
    for (let d = 0; d < Ct.length; d++) r = i.indexOf(Ct[d]), r !== -1 && (c === -1 || r < c) && (c = r);
    let p, h;
    h = c === -1 ? i.lastIndexOf("@") : i.lastIndexOf("@", c), h !== -1 && (p = i.slice(0, h), i = i.slice(h + 1), this.auth = p), c = -1;
    for (let d = 0; d < yt.length; d++) r = i.indexOf(yt[d]), r !== -1 && (c === -1 || r < c) && (c = r);
    c === -1 && (c = i.length), i[c - 1] === ":" && c--;
    let g = i.slice(0, c);
    i = i.slice(c), this.parseHost(g), this.hostname = this.hostname || "";
    let f = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
    if (!f) {
      let d = this.hostname.split(/\./);
      for (let R = 0, q = d.length; R < q; R++) {
        let z = d[R];
        if (z && !z.match(Dt)) {
          let v = "";
          for (let w = 0, x = z.length; w < x; w++) z.charCodeAt(w) > 127 ? v += "x" : v += z[w];
          if (!v.match(Dt)) {
            let w = d.slice(0, R), x = d.slice(R + 1), _ = z.match(Ar);
            _ && (w.push(_[1]), x.unshift(_[2])), x.length && (i = x.join(".") + i), this.hostname = w.join(".");
            break;
          }
        }
      }
    }
    this.hostname.length > Dr && (this.hostname = ""), f && (this.hostname = this.hostname.substr(1, this.hostname.length - 2));
  }
  let o = i.indexOf("#");
  o !== -1 && (this.hash = i.substr(o), i = i.slice(0, o));
  let l = i.indexOf("?");
  return l !== -1 && (this.search = i.substr(l), i = i.slice(0, l)), i && (this.pathname = i), Ft[n] && this.hostname && !this.pathname && (this.pathname = ""), this;
}, Oe.prototype.parseHost = function(e) {
  let t = yr.exec(e);
  t && (t = t[0], t !== ":" && (this.port = t.substr(1)), e = e.substr(0, e.length - t.length)), e && (this.hostname = e);
};
var Fr = /* @__PURE__ */ Ze({
  decode: () => De,
  encode: () => me,
  format: () => lt,
  parse: () => ct
}), Nr = /* @__PURE__ */ Ze({
  Any: () => cn,
  Cc: () => un,
  Cf: () => Er,
  P: () => gt,
  S: () => dn,
  Z: () => hn
}), cn = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, un = /[\0-\x1F\x7F-\x9F]/, Er = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/, gt = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B4E\u1B4F\u1B5A-\u1B60\u1B7D-\u1B7F\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDD6E\uDEAD\uDED0\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9\uDFD4\uDFD5\uDFD7\uDFD8]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09\uDFE1]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDD6D-\uDD6F\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD839\uDDFF|\uD83A[\uDD5E\uDD5F]/, dn = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C1\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2429\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E5\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD803[\uDD8E\uDD8F\uDED1-\uDED8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDC00-\uDCEF\uDCFA-\uDCFC\uDD00-\uDEB3\uDEBA-\uDED0\uDEE0-\uDEF0\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED8\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0-\uDCBB\uDCC0\uDCC1\uDCD0-\uDCD8\uDD00-\uDE57\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF-\uDEF8\uDF00-\uDF92\uDF94-\uDFEF\uDFFA]/, hn = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/, Br = [
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
function Tr(e) {
  return e === 0 || e >= 55296 && e <= 57343 || e > 1114111;
}
function Sr(e) {
  return Tr(e) ? 65533 : e >= 128 && e <= 159 && Br[e - 128] || e;
}
function Ir(e) {
  return e - 1 >>> 0 < 127 || e - 160 >>> 0 < 55136 ? String.fromCharCode(e) : String.fromCodePoint(Sr(e));
}
var ie = /* @__PURE__ */ (() => {
  let e = /* @__PURE__ */ new Uint8Array(127), t = 0;
  for (let n = 33; n <= 126; n++) n !== 34 && n !== 36 && n !== 92 && (e[n] = t++);
  return e;
})();
function Mr(e, t, n, r, a, i) {
  let s = e.length, o = i * 90, l = 0, c = () => {
    let k = ie[e.charCodeAt(l++)];
    return k < i ? k : k * 91 - o + ie[e.charCodeAt(l++)];
  }, p = n - r, h = n + a, g = new Int32Array(h);
  g.fill(-1, r, i), g.fill(-1, i + p, h);
  let f = new Int32Array(h), d = new Int32Array(h);
  function R(k, y) {
    let E = 0, B = y, N = y + k;
    for (; B < N; ) {
      let T = ie[e.charCodeAt(l++)];
      if (T < 89) E += T, g[B++] = E;
      else if (T === 89) {
        let $ = ie[e.charCodeAt(l++)] + 2;
        for (; $--; ) g[B++] = ++E;
      } else {
        let $ = ie[e.charCodeAt(l++)];
        E += 89 + ($ < 90 ? $ * 91 + ie[e.charCodeAt(l++)] : ie[e.charCodeAt(l++)] * 8281 + ie[e.charCodeAt(l++)] * 91 + ie[e.charCodeAt(l++)]), g[B++] = E;
      }
    }
  }
  R(r, 0), R(p, i);
  let q = new Int32Array(a * 2), z = 0, v = 0;
  function w(k, y) {
    for (let E = 0; E < k; E++) {
      let B = y + E, N = c(), T = c();
      q[v * 2] = N, q[v * 2 + 1] = T, v += 1, f[B] = z;
      let $ = (g[N] < 0 ? d[N] : 1) + (g[T] < 0 ? d[T] : 1);
      d[B] = $, z += $;
    }
  }
  w(a - i + r, i + p), w(i - r, r);
  let x = new Uint16Array(z), _ = 0;
  for (let k = 0; k < v; k++) for (let y = 0; y < 2; y++) {
    let E = q[k * 2 + y], B = g[E];
    if (B < 0) {
      let N = f[E], T = N + d[E];
      for (; N < T; ) x[_++] = x[N++];
    } else x[_++] = B;
  }
  let b = new Uint16Array(t), F = 0;
  for (; l < s; ) {
    let k = ie[e.charCodeAt(l++)];
    k >= i && (k = k * 91 - o + ie[e.charCodeAt(l++)]);
    let y = g[k];
    if (y < 0) {
      let E = f[k], B = E + d[k];
      for (; E < B; ) b[F++] = x[E++];
    } else b[F++] = y;
  }
  return b;
}
var jr = /* @__PURE__ */ Mr("!}.&u%}'&}*'~!6*)%&,~!J~!J~%L~y<~!R,~~%Lu~~#GD~~#|)1#%}^%}2%+#.##%##%}&%##%'#%##&%#%#'%#&#%#&#'#%%#&#%##%#)%''%&%#%#'%#%%#%%}%%%#%#&(23#%%#&-%0%('1#(##%#'##+%'*.:1}#%#6-+(%'%%#%%%}#L'2351&('%}&/N'(0(/*-%(%%}#'+&T%7.2}#&%&#%#36/5##%&%%#&#%%#))2%%##%&&'0~!#*+&'%1~!%).'3q?&%'1~!.##%6(~!+%%%(Gw'rT~!E#<nA%#jZ~!H%(~!42##~!*31&~!G%U~#)5~#`3~!J~!Z~%]~%Y~%C~!q~!u~#kz~%#~!6'~!D~!U~!?~#T~!c%~!G#'~%7|~!G~!J~!G&~#pb~(Df}#%}*&}#%##%##%##&#-}&'#'&%#.++}%mI,#,@&(}*%}*'%&##&#%##%}&0}#.},U},%}+%}&%}#%##&}B%(}(%}+%)})%##%#&}&%##%&}<%}>%#%&}*%}(%}9%}/%})%}*%}*%}?&}&%}3%}&*#%})%#%#)}#&#-#+*%E%%'%'#%}#*V##&##I}#&&##%&%#&&Qf%%))w/0+&%#(#.%-''''++++7}>%4'',##1,#%#&%##&#'##&#*#9)%&%}#*}%,#+P(%A&%#'&##wSD',9E00#y#@}(+}&%&>~!#~!X}#*}(&&}(&}(,%}%&#+&}#&}I%#%}%)#(},'%#*}4%%#%}(''}#/##(##),%-##%%)#&}(.}&%#&}%%}*&#%},&&}&%}#%*'#%})%}D&}&%}-&}6&#&}-,%}#%})-(~+`~,=?~I9'9%~!,#%})%})%}@%}?%}(~!?~#<~#pP~#BG~#=1#%K+~#?#~%;)~#A~#mF1~#A'~'X%'~#lR~#N~'N~#r~#m#-~#i'?%#'%~#B%##%,%#~#_%#0%~#]732~,w~2+#:&#%&'0%&>%}#>##F+)#%&&#(+_}4&}-%}(&}@&}O7Fdf0@+/v4}&WU##&/0#&'('B#%}.%}'+#%}#%%&#&%#%##+#&#)#6#'#.},%}c%},%#%##%&#&%#&~#>'*-.%##%##%}#%%}%'~#)D1}#%*&~#_%%'(~#S2%'.}#~#=##*'*-%}&'%'##&&~'E%.#&~#M4}%%##&'%#~#O1##%&#'+~#<B%##%%'%+~#;#@%}#&%#&&%#(~#H1}'%'##&&~#?A}&'~#D#%32}'&&&&~#[}'(#%}'~#;C})&}%%#%~#=&%,3}%'(#%%~#^'#&&)#%'~#Y%-~#d-%'~#^%%&#&&&}#~#b~2t*&'~&(~&@~0%~e~3}%*''0})&}+~!9##-}#%-hD*)1fC#%/&/fB#40~!+#)*4~!+~!K'&:~!/*7~!.#~!H~!L':~%x&~!H#~!*~%1~!I#~!+A~#p'~!F~~#-#~,,(~.Z~!V~%;'B'mq-W~!N~%I%#&&#&}#%},%%}'%}+X#%}#&}(%}'%}<%}#%}%%'}'%}:~![)9@~%>~#UA%-%##&~!C%~!-.9:~!1~!-^2/:a~!y,D*J#-5)/4~%23,~#G~!L1~!0X3`~!2+~!!0-~&E~!W~!o,>Y&]~%cZx_&~#O*9#A#'#+I'%#)~!0B*-5A+-((F&*M#)(-7-5+'-3a5Vi~!Y~!?+[)%3),ERHm~!+:D,VG.+)?fB%%*(%)'(#&80%1'8`K8?`+'Z#&O&'H5#*9)A%%5&3))0%39+.*7#()&&*=4@**L)<'_&*+..;(#*+)./&0#3)%')-8(4ixD(&.}%,('aI:,)%,k2231T)I'#/-W7,/'Q#.'Y24+h')37</31&83##&0#),H(?'&?/1##%#&&#%''-%&&&#(&''&#.-'%#%%(,')*'&#&#'##%(%(#%('#&##%%%%('%#%#%%#%#&%##h>w+v<ayvyvcg.uuhKr}g/v|g>u9i[~>g5uI~=RvdwEg;v/g;uk!!TTSx]@RT!U!#!@VBRUU!'UTe-d0c`e&gSdicedFcrdTaqb.kYcAohdYd@a3e+d}dMdtd.aJ#bqcK`dle/e.e'dwdPdodddjbEb}ogd^ofdpduc6j?l%d{drdqc)d7bacOdQ%T#Y)X.sR[yH>6Vyv3[xwLu>vo'!*.[yBacahoj>6Rew3[xqdZa#!a&#^(X-[yG>6Vyu3[xvg3sEr|g.u/Ri9db0T#^(Xa)!-[y;>6Vylg4wKs{JwNZt3@3r=c4Z([xlg;wKt!cpq's@v7A'*a(a+!-a#[y<3Dt?3Dt'>6Vym3[xmg9rxsNJwLZt4~?r?db1T#`-!(Xa,!0[yS>6Vz%NuQs.g4wKtnJwNZtS@3r>c4Z([y%g;wKtrdga8!a(!#&T*Y-Xa#!a0<or[yc3Dtq>6Vz43[y3JwNZtf@3s!Ju}!%Dti:pm3c_%X#tjB5pkd6q!r]u?voC'*-a.a2!0a&a+[yI3DtI3Ds~3DtH>6Vyw3[xx;:s#~<5pKJwNZtE@3r~d`a)!a2T#a.(!+U.X1[yT3Dt`3Dtv>6Vz&3[y&g9rxwzcxstPu.<rAJwLZtT~?r@dZa%!a.&^*Za(/Reu[ya>6Vz23[y1g3sEr}wkg{NuQRg{ci(U#5@b`~,cg#U(2WnH5wugcRh7dX#T(Y,a'Ta!!a,[yZ<]mj>6Vz,3[y+Pv#5ReZKu+=,%!H}7ABwkaS?Rh:BcW(X#<]mrj:ubv/ARekdg%!(!a.*Ta(Y.X1!#sP>Rl*Dt6[y>>6Vyo3Wf*jOvuumvuRgRJuq*!:9<B@bX~3jVv&v@s@5Re[d/rQt{uAvo&a&a*)a2!,0Wf!3Dt0=Bs'>6Re}3[xy~<5s%JwJZt1~Gs)c;&!#2sJkNuXvzq7rxu,Re8dka4!a8(aEZ+a@Y.X1Xa)[yd=Bs(3DtP>6Vz53[y4cX#X&Re:avRe9~<5s&JwJZtQ~Gs*i^rzvdRg+Jv{%!2sbB@bX}kdga,!Za?&^*T1/!a'Dt+[y6>6Vyf3Wf%g/u;s4hGu6?Rh-JvZ,!c%#&RoX54Rivj7uyvf8RgTKvZB%*!2sGh<vu5Rgq<=C::9bb~#dZ#T&Ta6Y.X*Dt>[y93Wf)coZ(T,6VyifluvRgC@95@B@bX~/hFu34cC#T,k/unq8w8Q5RkUklwQuzunq8w8Q5Rk8d/rJu?v8w9)-&!a0a;a&aIWejg3sEr/h1s<DtDJvyZqY5aws3Jvy!&Wei~Hr1:au5@Bag>23E~5c:Z&bX};kKv?w&unuVu5Rjc;>bs)#~@:Rh.=ay<a]C;b`}Vd6s/t{uAvoaxa()!a,a7%-a#a2Dt,[yF2Wo[>6Vyt3[xuNuPRi&NuPwpi#RoWh?vf8Ri%Jv]!%Ri:KvxD!.'2WeAjZu`q9rxu,Re7woeAg-unLq(qA_/*2Wg_g3u5q^9:4E}/jTrxrzv=Wkkd~0UX#^^Xa-a1a5T&a=U1a'*aEa]!a*aPaA-adok[y54Rn>;:p3~Dp5g9rpsFNvZqjg3uJp4~<5p0Pw;5qlJwNZt*@3p1Pw:5p/Ou!5p2JvG'!6Vye=<qnJvh_[xhg3v,Rh3kOwOw-sDuev/Re^dha[a%!%!a+#Ta7)-5TaCaO!aka!a)sf[yb2>Rl!9ARiq5E}Qg=ucRkBE|oJrJ_@Wk~@Wk{JrJ_@Wk|@WkyJrJ_@Wk}@WkzJvO_[y2g-vMRmiKuYC!)&>Ri;>Ri<@3RkNc](X#@9Rk=g5vuRmhKvDB!+'=]meg3u4Rmgd)#Y'Vz3CARmfd`a+!%T'!+#Ta1Ta6TaM-sTDt9[yA9sYd'%Y#s[[xpj:ueunaXRgEjRq,v-vuqdd2'`#6Rev<32@5>:2<E}5xIo9a*X#Y(;5RePJvD_g>vyRgNj8w)v8<wggs:RgXiZt|vjx,hSq3ah!-(~@:Ro/Ou!5RhWj^v(pyw8unRhUdx-UY#^Ua.a3a70!)%UX1TaDa)'omRiRRhE[y:3Dsz=Br,>6Vyj3[xkg6ruwjcqsrPw;5r*Ku]D'Zt-@3r(~?r.i[vwv]dU1a--U#`a4(g/vsRhPOu!5RhLj:rmu9Wo!~@:wdh@g/vsRiTjXuvvNr}:RhBj^v(pyw8unRn]dz1UYa'a+^Y(!aETZalaRY.Ta?a4[yDJw1!#qLsW>6Vyrfzq-pLflpwRe|Js>%!Dt@3Dt&Jvy_[xs~HrnjMuwpsw'RecKu+D#'!t<~Grl~?rjg5u-x,gwp{ah!-(~@:Rg~Ou!5Rh'jXuvvNr}:Rh#cW#X/c;&!#2sLi[v7u7RgpJv)(!iLrxu,Re6j7v@s@5Se[e7d`aW!Za(a`T.a#!a3!&aDa-!9)Dt_=6s+3[x~~DR|h~DS6avhGun5RkZj3w)v-]mkKunB!&*]kb97R|i<ARk<c:Z(6Vy}Juh'!wziMRoS:F|vkLuauJv5vtvQRh1d='T+Y#VyO~DR|jcF#T'7R|g97R|kJv3'!ay<Rj,Jvh&!:ReXcsa6*a+#a#_aIRf9aLRf?c,Z&Rf5Rf7c.Z&Rf;Rf>cQ#%T'p-Rf8Rf=ct#%'(*!,p,Rf4p+Rf6Rf:Rf<d~'Ua%U*^UYa(!a,-!#a4YaTalaEX0a8a<Weo3Dt/3Dsx=Br93Wen~Dr;~<5p<JwNZt2@3p=Pw:5p;Ou!5r3c7&!#:p>3Ds}KvGB)_6Vyk2sM=<r7x'eovA(!hFu1ARf}cV#X&@r5j6rvwQa^Rf3c=Za'wkghJv__g;unRggA53B9=b^}%j6uduo5Jq;!(hIv%2Re`Ou4ARe_e%a#^^^Xa&!a*a2!&a6YaP!*ad!#a:aE/5Rn?[y@>6Vyp;:pE~DrY~<5pBJwNZt8@3pCh=rt3rWPw:5pAJup_[xoNuPpF9c!#'45pD5ARn)d8#X'X*3@rU72s]h>v<<sSjJpqvewOJq/(!hNw'5ReBk0s2u3w/w'5ReE5@Jq.!a+JQ!&WeU23d(#Y&RjG5]jBk!u7w&u0udARjEe#+^^^Ub#!a2/a`Z(agT1!a-a;|@TaG!aS[yV=Re~fow'RguNuPRe?bz#'>RoUWeL>:Cbb|?JwPZtVg6ruRmzJvD'!6Vz(g/vmRh~Jvy_[y(g9voRgyx*cy(#2>Ri2B9b]~9kIw9u7rluJu3Rg]dI#a%UY'@=p%CAx.gQZ&RhwwygtRm{x5g_Z'+ABqR9Woa=Bp&dV#^*Xa'!&@o{g4v]Rk;Jv{!%Rk[wkkiA5RkiwwfUB=x,fUuqC&*!>RfTg8v0RfV~ARfSd;rJsAuAv9wR'ae+/aO!a@aza/a#[yQ@Wg!2Wemg3sEr0JvB_g>uvReWg2v+Re=KupB_+[y!2AbY~-~Hr2AJwD!(h<~El>h<~El?Kun@+_:9b`}Kg-v/Ri3g;vtwyk_9]k_d=&T#*U.6qh@Ab`|K9:H|CJv[!&3Dtex'fDwC%!Rf[9WlMd[(^X,!a%Z06Vz!@WgBg=v~Rgvg,QRe@awd,#Y+jTv|Q~EfWj]uNr|~FRfXdy#Y&^Ua%!aO.!(a)Ua;=!a@aKap!a-,a!Ta]a[rSa]p?[y82sK=Bq~;:p:~<5p8Pw:5p7d'#Y'Wf(;RnRi[u4w&RgJJvG'!6Vyh=<r#ijuuv/sIKuYD'ZtG@3p9~Gr&d2#`(g<vtRgFj`u5w&rqpxRf2CJuY!+:wfnTOu!5Rg}jNs1ucv&RfwJvA!&3@q|BDcC#T,k/unq8w8Q5RkTklwQuzunq8w8Q5Rk9dga#!a'!a=#a0!:+Tb*b@aO.a4!aba8aFJv^}?!VyR~Dr<g;u%Rn.~<5p[x'e`wNZtR@3p]Pw:5pZhNvjBp.woe_g5u-r4JwF!%DtO3:ooc7&!#:p^3DtpLuGw(!+%)Dtk6Vz#2sd=<r8d'#Y([y#<x3gJt`w@!)%}MRiowzikRij=]ilxAf3,U(#B2Rf#g0v-Rm[ck{`U#]giKv3>)!&6Ri154s,KuGB_%@r68r:dJ|t`#X(9<E|u2@H|rx3gJu?w'!+'1Nu7Reg4=H~+9<wxgY95Rm]xLggZ-`(X}U2:Ri4h<uOawRmsJv__5@bb{jbV~3dka#a'a]!,#a+U=a>b6a3b%!/aKa/)!arwve^VyJ;:pR~DpTg3uJpS~<5pOPw;5qmPw:5pNOu!5pQJvG'!6Vyx=<qoJvA!{~Jup!%@qk7Rn/KvyD!}''[xz;>wkh'?Rh,x8gyt`w5D!&),(SgyccRgztJ@3pPB5p#d'(Y#<]mmifubw&RgoJvE&!82s^JvF&!8Rf,ADb]~;x=h'rNu]vK!,%'*0RnORh)4Rh*AqQg-vaRnNg;wHwkh'ba~4cE#Ta*x3gctyw@'!+%RnFRnD<4Rn@hFvK5RnCxWg[#`&a0Ua()`1Rm75Rg[c]%X#qi8Rg^NvdRj>BwzgZauwji7Rm6A4wgg]d1#&(*,.0a#Rm;Rm<Rm=Rm>Rm?Rm@RmARmBe%#^^^Xaea?aC/b+(,!a+a#!a/!>a&Ta<aKbD!2wphBRnk[yPw}hE|.=Br-3Dtm>6Vy~g6urRf.x,hPrNav!%'RnqRo%Ro#Nu;q[Pw;5r+JwNZtM@3r)d'#Y'Weh;xChL#`&RnmRnoKu}>%(!Rne~Bs-;2wjcussJv+'!aYSO}6@B<5?ba~8LrNvj!.%*ROwungw~ng~:9;Ri^>wtnig;wHRnixDh@|(UZ.x1h@|)!#:2<H|*xHn]#-UX'3Ro)z=iT}6ARns=Bwsn_wpnaRncw]aR(#UXa&Ua*a/=]iPd'#Y&Ro'WnXf{QRm2hNvj]nZd`'T~&1`{|`#9b]{}c:'!#Wl{>@=be}]?cl{{U#:5Abb}Jds#^YaF!a*b4a#a3aPa>&Tb!bH!*a_!Eau?/a&RjY<]gj>6Vz*;:pe~DrZg,QRj1JwNZtX@wihspcJvZ&!VyX9WmOJu|!|N2WmHJvh&!]ht~Bpbcn&T(!#RmQ<s7Nu;padH#X'`+WmJ@>RmKCARhnKup=!)&Wf+:RhqNuPpf9c!#'45pd5AwghpARn(Ls@w!%,)!RmP@Wfe<E|IJva!&WmNg8vsRmLd`*.`#Y'Xa!axRn*]hrA8Rhug5s@rXg8u!RmMd8#X'X*3@rV72smdI*#UY&RmICARho~GsgxVgd)Ta'U-Y&Xa!T#RnEWnA@Wffg1uDRi0hFvK5RnBxGnG&#`%owp)@wsf+bX}Ze-*1!a*^^^Ua|!#a.aq&Ya2!a>.a6!a:aO`aJDtL[y`@Wg#>6Vz12@wzoYRoZNuPRi!NuPRhzg=ucRi,@=b`{Yg=ucRi-ACJvB!&Sh[ebSh]ebi`wUuFRm4Jw2_[y0JvB!.<Ju(!&SoG}6Shd}6<Ju(!&SoH}6She}6Kur@._g5vHRieJvx!{L2G{Kx6gd'T#?Rh82Wi5cZ#X(g1w)Rm5dW-Y(Ta#!a)!#aYa=wnfE=su2>>bU{0j9udv:<svj8uQv-7RgHdE%#^'sq9sp=>Bb_{TJv`!&g/r|snj6v(us5d,#Y(56H}[978H}]Jw5!&g1rushJvB!+j;v{u5?zDhd}6}bj;v{u5?zDhe}6}ce*#`(^^^a[aea!=!a6a*aoXb1a.!aAbL!b>,b'aL!aV@Wf|2Wlg3[y/JwNZt^@3piPw:5pgJunZou3@rsJva&!Vy_g<v~Rm#JvG'!6Vz0=<r{Ju{%!:pj@WfsiXuJu3Rm:JvZ&!WfA~Bph@c4Z&Dtwax5rubx(#:awRk1@d,#Y&RfjRfid1#,Y(@Wfp2Wlrg5s@ryKu[@!,'=]ig9wlk?Rk>g5u-rqJvy'!@9RkQcH(T#=>Ri~@<wkj(Wj(KuZB*!&<7rw@9RkRcH(T#=>Ri}@<wkj)Wj)dg(Ta2Xa9X#`-!a*CARhg@@=I}d9x;c~#X%so=<sj>2@@=aybb}XjWv0Q~EfEj3vLv;<d,#Y(56H}`978H}_dgaPaFa'a/!#a3Y0a_a;a|!1(a7-[yE3[xt;:pJNvZrrg3uJrvJwNZt=@3pIh=rt3rxPw:5pGOu!5rpJvG'!6Vys=<rz@c4Z&Dt(ax5rtJvZ!&~BpH@wsfNg-vaRlNci*U#=<wei<F}a5@Jq.!a*JQ!%@qZ23d(#Y&RjH5]jCk!u7w&u0udARjFd/prq=tyvpaEa(a:.!a1aZ(@@=I}:9wpd%=<sX55w_h}@@=I{t=ay<aU@@=I}T=ay<2@@=I})?C9:9au@9Cb]}DP~=x-fAZ(2Wl1=ay<aU@@=I}>5@d##Y+jTv|vV~EfFj]uNpn~FRfGdgaK!Z2&!a8a-Tb({E!acTbM*!a(DtY[yYd'%Y#sl[y*hHvh>Re5x2c{Z}.j4uCvcawRiMd+#X+_x&d!},<5RkX;2Hzw@x,gavfB-!{CcF&T#Roe;RodwWbBg5urRgaKvHC*_6Vz+<4opieuew&Rmq@d]&Y)X,T#X0Rh}<BqP=4qS9:ReMg/ujReNJw0!/<Jui%!bd{kawwnemRelAxUa?a3#*.&UX(Ya+a/RhvRnQ<o}9Wmtd-#Y&RgSRmw9;Rmxay=Rmyg-vaRmuxEhSrNu,v-voC!%(aR.a(a7+1Ro1>Ro5CE{A9b]{@;5x#eO{:g;urRi+KrNA!%(Ro3>Ro79;Ri_Ku@>{;&!x%gX|{KunA_+g5QRj/g3u5Rj#g>uERj%wio/xRhS&!,!#^1U}wba{8>>@=be}qC@:D5ba{7Ku+A&!}x?ba}t>>@=be}se(aA^^^Uat!b0#{pa+awUazbGa#aLb9bgaWac'a5TbS=Br!d1#`%scp_Jvl!#rT>Re0JvX&!VyN=H{Fcm#U&:pY=ReaJv2&!]h0=]nUJvG'!6Vy|=<r%JrM_=]h2@Wlud'#)U'Wf'b]{i=]h/Jvh!&~BpWg=v]RnMx+ny#'Nu;pVwjnu=]nwxJnx,T#`&Reqwjnt=]nvieu9vrRjLLuYwP(#+!th@wih5pX~Gr'g5v/Rh4KunA'!-CARnP@wwiN:Rm_9x'cvw>!|l=<saKvAA!0&3@q}>w^e1bp#&Re2Re3BDx7gH#T|f5H|eKuZ>!%(:qNAH{]Jv6!+3B2B9=b^{X<5<B92:E{ZLvhwA(a;a%!igQuyRmad+#Y}m@3Rh5d8#X'X*:AqUAHzmaxwbh<aXRnVcF}RT#Nw&cj#U(BWnug/vsRntdka)(a3+.Zb7aYYan1!bVa@Xa}[y^@b[{G=H{+hFu73Rj&Pv#5ReQcK%T#sig1v{Rj'Ku+D#'!t]~Grm~?rkKuMB!01d5#`'Vy.ta3Dtu~Hroc8#'{^45s85AwZbP&!#Rn!wghxWn#KvEA!)&2RlA2RlBx:h|#(T,=]j09Wobz>x]z/@awRoTd+#Y(az]hFhCrm4d,#Y+jTv|Q~EfMj]uNr|~FRfOdCa!Xa9_X#@<plJvf!%b`{(9;Rgwc;.!#2x7cw#T|UDb]|T5Ju={(!=@E{&Jv)&!Ab`{'awJvf!~*>>@=be{#KuY>!+&4Ezyi[ugv&RjIdea+T)#UXa&T-T&a!Rh9auRmW=]kLg5vuRn+g3u4Rn-Ow6ARn,hHus5xNk?#UX(U~)/g8v0RkD~AwkkF?Ri.OuNBwkkA?Ri/d|a2`a*^UYa.!aBTZaTa'Xa;!(!2!-a#b2[yC>6Vyq3[xr2Wi?g1rusVh%s?DtF~<5rbJs;%!DtBfswKtCj[uvuSsEu3RgVx3o:u+wN'*Zt;@3rd~Grh~?rfg8w)Lq)qE&-a%!>bI|`jWv0vV~EfCjTv|vV~Ef@j]uNpn~FRfBcK#T']gWNu7x,k7q4ai(0!hHv8<RhmkMu9vrsBuev/RhlCJvB!,g<v{wchh~@:Rhji[vrv{wchi~@:RhkdS&a5UY#Ta!RgPwwiI5BwciI~@:Rh`x'iJvj'!5]iJPu8Bwch]~@:Rhach)U#h3rp]gLh@t|Ax,hTq3ah!-(~@:Ro0Ou!5RhXj^v(pyw8unRhVd|)`,^UYas!a?/a2Z'a^Ta{Tb7Ta(a#!a,Wf&9sZ3DtAadamov=Bqt3[xig8vsRm~>waiL2b`{QJv*_Ouv2qgj<v]v2BqfdR'X*X#Y-@3qr~Gqv~?p6hHv-]glPup5Lq+q?_%*b_{qF{n9b^{rOu4ARhpKvCD!+&~Bqp:5Dbb}nwoiKl&unuTuBv]v+ueunaXRf0=Jvh!0nKufu8v1w&w7q%w&uHrz:Rgnj5w,uxDJq/(!hNw'5ReCk0s2u3w/w'5ReFd>Za&!*UaA=<wkgsRnSJv^!%Refifw3vyRgOKu_B'!,<]gkiiu:w&Rh<=C@a^<B57@2F{[<B5@aW:=3away9A5aW=<B=C@a^<B57@2F{Ie-#`(^^^bCara.b8aza6!/bZ,!adTbnTbOb+aFaS!aAT9@Wf~2Wli3Dtl2@d,#Y&RfnRfmJwJZtN~GqyJva&!VyMg<v~Rm%iXuJu3Rm9Jv[_=]ih9wlkDRkCd1#`(@Wg>2Wls3cH#T(@<Rj*=>Ri|b~'#23s9h<~El.d'#Y&Dtxi^rzvdRl#d*#U%(o|B2s`hJwSaxRmDKv4B&!1:Rmdd5#`'Vx}to~Hq{x'f1v3(!BA5ba|bJv_&!Wfug1v]ReIdO+U/Y#&G}-8wze=Rh{g1v]ReHg/uQRf/by#)ibQwERl/cH#T(@<Rj+=>Ri{cNu+vlax-!(#a0qa9<Rii2;;bU{H;x<i=&X#Rk`<4wwi=C9H~8xAI(Y#<azRi@45wXI<B9;5bb~7dL(X#Xa(+!aL6Vy{g5QqOau:5au2@ay547EzbxOcU(UX-T#Ta#:Cbb|A?wjh/b_|SOw6ARgtihr}u7Rhy<d1#T)X1@@=I|~=ay<2@@=aybb}Sj3vLv;<d,#Y(56H}A978H}@dGpvs@uAu`vcw9*!aFa+ai%(b!aXa8.a?a[ozWey=sU2@G}Nch&U#Rf_WexKu+D#'!t:~Gr`~?r^j]uNr|~FRg*j^psurwJt|RmcKv)@&!)7Rkv~Br[@wxfO:Rl3co#U'6Rezj_q#vIuavjRltwzeyh@vr5JqD0!>aY?C9:9au@9Cb]}9cl#U*5;5<H||jbuus1ucv&Rfvg1v~d/pppzqFr^a--a~!aMat1(hFv;Wiz@@=Izoj5uuv-7Rix~Cw`fk2WlVcZ#X,k)u3vWs@u2]ktg;wEx'fBq(_2Wg/jTv|vV~EfoJv]!15x'hzqG!(P~EfU~CRl_j6v(us5x4i-#T(2WmZ?C2F|d>Kq<aj1!*jTqIsBv=Wl`~Cw`fi2WlWj`v0u*~>RlR=c>Z,k#u3vWs@u2]kr<c1Z+jTqIsBv=Wla~Cw`fm2WlXdmb3!a{(arZa`bkTa%TbQTa-a9+c'!aM!/[yL=Bqug.w'RifhFvyDRj.g>vgwyk^9]k^Jv3_@WfbAARkhJw2_[x|JvB_wkoIRoKwkoJRoLd'(Y#<]gm=<9<H|yd'%_X#skDtb3awwqkgNulRkgdB#^',9:p'hJwSaxRmEBwVb8@4=H|qLu+w50&!)@3qs~?pU>Awwn;;Rn=c:Z'ARn<=<qwKvC@!/&~BqqJv6!&]eVb^z^xRge'/a%+^`#Sge}6<4Rn3=]n0Pw2>Rn8Jw0!&>Rn:>Rn6cY#a7+!a&=<wkaNw~h3z_c5Z{=wjh#=]nLKv^D!&)Vyz=bW|swYb<WetcG#T(2wxa@qVx@gD#Y&b^|V5JwG&!5bb|pg/w&RgD@x=kHs=uAvn!a%%/'+RmSRh694Ro`g-vaRmRhHv-]mlxCcS#`&ba~.5cD#Ta)P~=d,#Y(56H{>978H{Dd_#{2^Y%_+qbbb{6g3sERhsbU{?dfa.,`a(Xa<!aiX#(55RiG54RiHcI#T'WiU3RiVNvdwtfcRlKNvdd,#Y&RlHRlExQgf.1*^T'X#Sgf}6Wn4=]hfPrk>Rn7Jw0!&>Rn5>Rn9Lunw?&a2!,5<oq@@wqfdRlJj5Q~=d,#Y(~ARfcOuN]fdDKw;ay(}i!547E}j?cI#T(@5bV}iCbV}hdv(^^Tb?a40,b##Tbo!a*bR!a<b|a/!aKai!aU[yK=]o^g:v>ReGJwPZtK<7Rh+h<~El,Pv#5ReR@awwxjCg,ulRjDJv6&!]j!z?aQeeg>w=Sh<eeJw;!&axEzOg,Qosc!#*:wkeJ]eJ>x'h-u(!%Ro.w~h.zPdNZ(X,Ya![x{;9ReY;wkgxRiF:x?ap#Y&RmUg<s2Rkod]+UY0TZ'!a&A9sw<=bczLNvuw{gqzNhJwSaxRmCKuLay!#&s_Rf-55b^{uJvZa!!c%#(55Ri654wmiu5RiuawLu,vp!+}^%b_}Y9;wkgxba}o>A9:=b^}zKuh=a''!3awRk3c*'!#aHRk6c+Z&Rk5Rk4Jv)&!awRjSawd9*`#0?C2@EzMj8u<uJ5RmbjQrquJu3x,k>uq@_+=ayb^|W~ARkEOuN]k@7dhzV^X/X&a-#zRzSb`zXcJzTT#2WkVKvDBzW!%FzY9;5bbzWjQrquJu3Jw3%!b`zU=ayb^zQd:#X(T-a!6Vyywxh}=b]{Jg=u1RiAdGp~qHtzv!w(wA+a+a;<!aJaYai'anasb(=azRmV:Cbb{MLq2vb!%')RjuRjrRjtRjqx3jnqCw3!%')Rk(Rk+Rk&Rk)Lq2vb!%')Rj{RjxRjzRjwLq2vb!%')RjsRjpRjfRjex3jcqCw3!%')Rk'Rk*RjkRjl9<CbbzfOu4ARhxLq2vb!%')RjyRjvRjhRjgx=joq*uKvb!%')+-Rk.Rk%Rj~Rk-Rk#Rj}x=jdq*uKvb!%')+-Rk,Rk!Rj|RjmRjjRjidAq&qKs@uAv8Aa.'*-a@a&0!aM@a5[y73Dsy3Ds|3Dt):wxgI2sHJwJZt.~Gqxwsf0ikrzt}Rl0Jvy_[xj~HqzKv_A|D!&WfP8axRoVcf,U#k(v]v+ueunaXRf1Ju}'!g8u#Ri=jQw!sCunLprq>!,')~<5qeGzq9F{W=c##%s5au:5aU3CBE|;d4#X(D!a&6Vygx(b;#(=]ed?C2F{N<capoq2r[a&!aPa9,'Pw;5s:@@=I|,55w_h|@@=IzcP~=x'fCqB_2Wl2>aU@@=I|1OuNBc1Z+jTqIsBv=Wlc~Cw`fl2WlZ~AcTa%!Z+jTqIsBv=Wlb~Cw`fh2WlYk+uNqJsBv=WlSg,u3dca3#UXaMYa)TaB-=cM|7T#<bI}l5@B932:aV2G{BOuNBJq:|M!5Ezt=<B=C@a^<B57@2F{v>cB{/T#=ay<bI{3Jv6!a.6BKq0ah&+!5E}HP~Ef{978BaU@@=Iza<7d#.Y#978BaU@@=IzH~AJq0!(@@=IzG978BaU@@=IzFe,aU*Y&^^^bvJb,b:bFad!a,c2Ta>aL.bo6!a#CbTa'T#Re{2Wlh2@G{yg6t~Ro_NvdRfticuRQRllJv3&!x&c|zs@Jw3!%RflwpfkRlpKuL;%(!Re<@G|C2GzdhIvuBwgjAg-u0RjAKQB%!(GzZ@G|5NuuRl7d='T+Y#Vy[g<v~Rm!==G|>JvA!)@wma=]m1ifuaw&RmnLs@vT'!|/+[y,g:v>ReTJw1!#qX=x!eC{bLu+wT&)ZtZauq_~Graci&U#F|89:r_Lupvq!.)&2RlG8RfaC=x!eF{_h?rpWlmd&'!#X|&]k::xJey#`'T|+<E|&2@H|%dE#(^,g;u.RiEg6vjRiC9xCkA{O|zY#g=ucRmXKs0@!&*@G|m@awRknJuh!,3d(}gY}eJvj!%Rm):Jw3!%Rm+Rm-Ls0w(&!a(a#@b[|6cZ#X'7RkxWgAOu4ARn'dH'U#Y*Vz-Wm'CARm}d]*#a%^a*T'aK!a<9bV{PC=p*Jw4!&SgxcbB5r]idw(wBRmF7xFkt#&`(Rm/Rm8E|!JuY_9:Rl5=wrgr2:bbxd@xXfB(a*#T+!.X0X1Ta/a'T&RlDRfL>RlyARl9b[z[>RfZ:RlL:RfRwlg/ARl;9;RlxKv,A/!%7s69<74=BA5ba{-8Bde#`a<XaKYa1,a'P~=wxfB2bZ}}?C972@@=I}r8@55B9;5bb}G978B2@@=aybb}3j3vLv;<Jw3&!>Rfk=ayb^}4~Ad1#`*@@=aybb{w2@>==<bbz]dx+UY#^UaF!a9!bB'Ya1.!ajXa#%olRhD[y=3Dt#Ov5BrHKuMB%!(Rf^Wep~HrJwkiQjKr|~FRg)Ku+D#'!t5~GrF~?rDdV)UY,Z/_7RkuG{<~BrBg,rlsO:235B@bX}|d?a1!#`(6Vyn5@d##Y+jTv|vV~EfIj]uNpn~FRfH7Lq2vb1!a9-978BaU@@=Iz9978BbU}#~AJq0!(@@=Iz8978BaU@@=Iz7~AJQ|}!978BbU}!JvkaK!AdUa21-U#`a+(g/vsRn~Ou!5RPj:rmu9WhOjXuvvNr}:RhAj^v(pyw8unRn[kPr}p|u7vwv]RiSBd;pppzq@qHQa?(b.!a.a`@.|xa(hFv;Wiyj5uuv-7Riw~Cw`fg2WlU978BbU|wOuNBJqG!(P~EfD~CRlQcZ#X,k)u3vWs@u2]ksg;wEx'f@q1_2Wg.j]uNpn~FRfqJv]!15x'h{qG!(@@=IzK~CRl^j6v(us5x4i,#T(2WmY?C2F{1>Kq<aj1!*jTqIsBv=Wld~Cw`fj2Wl[j`v0u*~>RlT=c>Z,k#u3vWs@u2]kq<c1Z+jTqIsBv=Wle~Cw`fn2Wl]dn1#c(a(b^a2!b/bAT(bj!aDa7bu,a_a{c0!2T0g:v>ReD2@G{42@G{5~DpM~<5rc=Bx6i>{RT#RnI@zCx]y]z:2Jv[!zr5Awyk]9]k]dD(Y+X#6Vz.g=wKtgwhaCwgmTWj2Lu,w%_+/[y-B;b^xeg3u3Rj-2@bX{*KrJ<!+'@Wg(g?QRlC@Jv`!%b[zIwsfII}8JQ_@w|kW|=Jv(%!AqcOuNBJvEzh!bYzjLs@wP#(0!oy@>RkdJwMZtc3Dtd@BcG#T'9bWxg2@2Fznd*#Y+;2x'c}w<zizixNgwa#Z'U+!/!a'!a+w~g~z6wcn{Rn}wcnzRn|5Rh%=]nJg5vuRmvNvdRlvcprJu}w*az*a#!%.a.'Bot9qT]kj@Wg'ay2Gzv@Jv`!%b[zEwsfHI}1;ck#Ux`<Cbbx_Lu+w!a&0*!wko*wwo,So,}6Juqxf!E}PigQuyRm`d3(`#8>Rn%:A5B;bZ~%KvhCa!a2!x>k7#Uxb@b{#xaRk7Jw0!)>wwhlShl}6>wwhmShm}6CJvB!.x'hhvj{!!5Bwkhhbaz}x'hivjz~!5Bwkhibaz|xEhTrNu,v-vpD!a%&/)a3a.,%Ro2t[CE{)@3re9b]{%wjo09:rgc:Z&Ro6=<riifuaw&RmoKrNA!%(Ro4>Ro89;Ri`dSaL'UYzxZb)7Rka3xRhT&!,!#^1U}vbaz{>>@=be}yC@:D5bazzKu+A&!}{?ba}y>>@=be}wxBh[t`u~vJvr!%a!a()a,a0a4RoC=]o;Ju(!%RoGRhdwjh`=]oAg>w#Ro?g5vuRo=NvdRl|Ku]C.!&;RoEJvB!%RoORoMBx'h[v+_?w~h`}~5?w~hd~!xKh]oiptu-utv.vp!#%&a30a@a'a+(a/aOp(o~p!RoDJu(!%RoHRhewjha=]oBNvdRl}g>w#Ro@g5vuRo>c[#X']o<CauRoRAd-#Y':RkpauRoQKu]C.!&;RoFJvB!%RoNRoPBx'h]v+_?w~ha}t5?w~he}ue!/UbhYacXaW^Tc&a;b:a-c/#b&aja1(!cL+!bKbt!bmcRc9aIc?8[yW3Dtt94Rg`Jv}!&SiRMzBhEebShEMNuPRe>x7gL#TzuwjirRipc<Z&>on;>z=h-MSh.Mwqczx'a7vj&!>Re4@=ResJt__NuPRi*NuPRi)j]uNr|~FRfzKrJ>_+@Wfy@Wf]2WocKrJ<!+'@Wg%g/QRl@@Jv`!&awRl<wsfFIzgLu(w*!.*&ShBMwvhIRhI9;RhNx1hK'!#Sn]Mx1hK~0!#:2<H~7cNu+w7D*'1ZtW>Rn1~?rOc:Z&Rn2=<rQ<7wjh&=BSnLMc]#X(6Vz)w[b=a!U#9wzgMc3#&(RgMRitRis<x,gKt`ax!&+SioM=BSilMc3#&(RgKRinRimKurB,!&SiQMzBhDebShDM6BJQ!(P~Efx978B2@@=I}WLrJw!!,a*&@G}O@9wkibRid@@x'fKwC!&SlDMSfLMjUv~Q~EfKKv3@a+!(hFv-]mpx/hYZ(C5RiWz<o/MwkhY?So/M@x,gbvfB*&!SgEM:SoeeehFu3:Rgbda(,^TZa)X/7Sg[eb:2RgI~BrMC@wgkc:wwkcRerx3h(uUvK!&*,SnOM4Sh*MArRg;wHRh(x=h;rJvPwI!a4',a'0@Wg&=BSh/Mg>w=Rh=g3w*wwgGRgGcW(X#;Sg}M2Gzk@Jv`!&awRl=wsfGIz`dKZ*T'Y-:RhR7RhQg5u-p`j6v(us5d,#Y+~Awkia?RicOuNBwkibba}Ld6p~tyu_vbAa'a+!a/'a3aEa8a!>Sh,ebJv{!&Sh@ebSaReb9;SgwebNuPRi(NvdRl)NuPRi'hHu^<Rm^Jvv_@Wl(g;u1Si/ebKu'B&!*Sh?eb@Wl'z@aPeb95Si.ebcpputyvjB)!,&a+0a%ShAMWeK@G}C@WfJ9;RhMwvhH9w{ia}ix,hJvRA1(!zAn[MRhHx1hJ~*!#hFv(BSn[MBJQ!(@@=I~'978B2@@=I}2db.Ua<'X}+T#a0XaG2G}E;wkg|wuh!Rh!x,hZu,@)!&So0MVy)C5RiXACJvB!&5RiY5RiZg8w)cG}*T#2@bU}=KsA>(!a.3wkhZba~(x,h^u(A!&(SoCMRhb5Bz=h[eb?w~hb~6x,h_u(A!&(SoDMRhc5Bz=h]eb?w~hc~6e)aA1T#T,^^^c-bMb&blcPaP(a/!0!bA=b5c@a(!bfbrc#2afwmhARnjwchORnp2Wlf3DtsNvdRl-2@wpa<]m0bx(#:awRk2@Jw3!%RfhwpfgRlnKQB%!(G{V@G|'NuuRl6d='T+Y#VyUg<v~Rl~==G|<Jv+'!aYShC}6@B<5?ba~8@Jw3'!g2QRljhLrpWlOd+#Y'g.w'rIg>w*wgj@g-u0Rj@Lu+wT&)ZtUauq]~GrGci&U#F|39:rELrNvj!.%*RhCwunfw~nf~:9;Ri]>wtnhg;wHRnhx3hDs@v~!/+'@Wfr@9RkSNu&Rlo=@<5GzoKs0@_+@Wl+@awRkmJuh!-3d(}pY#qWJvj!%Rm(:Jw3!%Rm,Rm*de&!1U-U#`)Re;@G|.@9Ri82@wjfvRlq=@<5GzpLvOvr!).&2RlF8Rf`C=x!eE{.Jw3_g2QRlkhLrpWlPde(!#U{s,UXa*Ta'[y'g:v>ReS;x0PZ&RnlRnn~HrKJw1}f!=x!eB|2w]aP(#Xa&a*Ta.Ua2a7=]iOd'#Y&Ro&WnWg;u.RiDg6vjRiBNvdRlzhNvj]nYJuW_2Wm3x)kFze{9d])!a.!,Y01!#&aC!a3RndC=ox~BrC@2b^{pg,rlse7x'ksuq!%Rm.E{xidw(wBRmGx9o+)X#wwo-So-}69:Rl4@xSf@a#XZ'X)X,Ta(/ARl8b[xc>RfY:RlI:RfQwlg.ARl:9;Rlwdn'#^XafaQa1X1TaHTa)@b[{zcZ#X'7RkwWg@Ou4ARn&x)kG#{,g7u/RkGdH'U#Y*Vz'Wm&CARm|bx#(A]gUbUzJj9Q~=d,#Y(56H}l978H{U7d,0#U*2>ABb_xZ978BbU{e~AJQ{g!978BbU{hxMh?ad{oUYZ.x1h?{l!#:2<H{mx3n[t{vl!,&a%3Ro(z=iS}6ARnr=Bwsn^wvn`Rnbd`*T}B0!#^X'BG{c9b]{a>>@=be}F?JvS!&BG{d7BG}(Bde#`a1X,Ya@!a'P~=wxf@2bZ}I56B2@@=aybb}08@55B9;5bb}<j3vLv;<Jw3&!>Rfg=ayb^}&OuNBKuLA!)a!P~=x#fD{f2@>==<bbzl?C972@@=Ix^d6rSu,v7w*C(0a)a6#B+a%!sQ[y?3Dt%3[xn~<5rLOu!5p@Ku+D#'!t7~GrP~?rNKvlaya7'!h+v-5qMg=t|cd,U#5AAaa5Abb{S@52B5@a[@52B5Gx[iXueu;d<#`a(!/549C;ag>23ExY5@Dah89b^~689Jv)!~2b[~1Lv'w(%*!a#bX|aPrmawRe]keu7uhv-q6rxu,q`xTo]/a5aU!bNaDXbi!b-!ao!b<bwA!#5@B932:aV2G|:d-)Y#hJrL>RhG<7@C5<H|_=Cau:5aj5@B932:bJ|ng>vIbs)#?C2F|9jPv0w.vISh-MKvUaz(.!9ABbb|[5;5<H|Eg>unwfh;9:4E|YjQsBt|vjx'hYq3!(?C2F|J:2<BaY?C2F|GOu!5x,g|p{ah!-(?C2F|c9:4E|OjXuvvNr}:Rh&i[w*t|cd+U#jJvsu)vsSn~Mkfrmu9p}u7vwv]So!McW#Xa!ax5@A5aY:5;5<H|>kJv~vYrquJu3x4ib#T)2@SmZM?C2F|Bj:rmu9@xPhI(a*a#U#`a3-5Abb|L~@:RhK9:4E|0@52B5G|#C::aY?C2F|-:2<BaY?C2F|.5Jvk!a)javYrquJu3x4ia#T)2@SmYM?C2F|HAxPhH(!a#U#`a*-5Abb|4~@:RhJ9:4E|R@52B5G|F:2<BaY?C2F|Sc^#Xa2j=Qq5CJvB!-g<v{z;hhM?C2F|Zi[vrv{z;hiM?C2F|XKsA>!a)-g<v{z;h[eb?C2F|]i[vrv{z;h]eb?C2F|^iZu.vix,hZq3ah!.(?C2F|QOu!5ShXM:2<BaY?C2F|P", 13494, 2713, 49, 25, 61), Y;
(function(e) {
  e[e.VALUE_LENGTH = 49152] = "VALUE_LENGTH", e[e.FLAG13 = 8192] = "FLAG13", e[e.BRANCH_LENGTH = 8064] = "BRANCH_LENGTH", e[e.JUMP_TABLE = 127] = "JUMP_TABLE", e[e.VALUE_MASK = 8191] = "VALUE_MASK";
})(Y || (Y = {}));
function Be(e) {
  "@babel/helpers - typeof";
  return Be = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Be(e);
}
function $r(e, t) {
  if (Be(e) != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (Be(r) != "object") return r;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Jr(e) {
  var t = $r(e, "string");
  return Be(t) == "symbol" ? t : t + "";
}
function C(e, t, n) {
  return (t = Jr(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
var Q;
(function(e) {
  e[e.AMP = 38] = "AMP", e[e.NUM = 35] = "NUM", e[e.SEMI = 59] = "SEMI", e[e.EQUALS = 61] = "EQUALS", e[e.ZERO = 48] = "ZERO", e[e.NINE = 57] = "NINE", e[e.LOWER_A = 97] = "LOWER_A", e[e.LOWER_X = 120] = "LOWER_X";
})(Q || (Q = {}));
var We = 32, pn = 21, Lr = 2097151, ut = 2047, fn = 0;
function Or(e) {
  let t = e >>> pn;
  return t === ut ? fn : t;
}
function Wr(e) {
  return e - Q.ZERO >>> 0 <= 9;
}
function Ur(e) {
  return (e | We) - Q.LOWER_A >>> 0 <= 5;
}
function Pr(e) {
  return (e | We) - Q.LOWER_A >>> 0 <= 25;
}
var Nt;
(function(e) {
  e[e.EntityStart = 0] = "EntityStart", e[e.NumericStart = 1] = "NumericStart", e[e.NumericDecimal = 2] = "NumericDecimal", e[e.NumericHex = 3] = "NumericHex", e[e.NamedEntity = 4] = "NamedEntity";
})(Nt || (Nt = {}));
var Et;
(function(e) {
  e[e.Legacy = 0] = "Legacy", e[e.Strict = 1] = "Strict", e[e.Attribute = 2] = "Attribute";
})(Et || (Et = {}));
function Zr(e, t, n, r) {
  let a = (t & Y.BRANCH_LENGTH) >> 7, i = t & Y.JUMP_TABLE;
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
function Bt(e, t, n) {
  return n === 1 ? String.fromCharCode(e[t] & Y.VALUE_MASK) : n === 2 ? String.fromCharCode(e[t + 1]) : String.fromCharCode(e[t + 1], e[t + 2]);
}
function Xr(e, t, n) {
  let r = t + 1, a = 0, i = r;
  if (r < n && (e.charCodeAt(r) | We) === Q.LOWER_X) for (r += 1, i = r; r < n; ) {
    let o = e.charCodeAt(r);
    if (Wr(o)) a = a * 16 + (o - Q.ZERO);
    else if (Ur(o)) a = a * 16 + ((o | We) - Q.LOWER_A + 10);
    else break;
    r += 1;
  }
  else for (; r < n; ) {
    let o = e.charCodeAt(r) - Q.ZERO;
    if (o >>> 0 > 9) break;
    a = a * 10 + o, r += 1;
  }
  if (r === i) return 0;
  r < n && e.charCodeAt(r) === Q.SEMI && (r += 1), a > 1114111 && (a = 1114112);
  let s = r - t;
  return s >= ut && (fn = s, s = ut), s << pn | a;
}
function Yr(e, t, n) {
  let r = jr, a = e.indexOf("&");
  if (a < 0) return e;
  let i = e.length, s = 0, o = "", l = r[0], c = l & Y.JUMP_TABLE, p = (l & Y.BRANCH_LENGTH) >> 7;
  do {
    let h = a + 1, g = e.charCodeAt(h), f, d;
    if (g === Q.NUM) {
      let R = Xr(e, h, i);
      f = Or(R), f > 0 && e.charCodeAt(h + f - 1) !== Q.SEMI && (f = 0), d = f === 0 ? "" : Ir(R & Lr);
    } else if (Pr(g)) {
      f = 0, d = "";
      let R = g - c, q;
      if (R >>> 0 < p) {
        let _ = r[1 + R];
        q = _ === 0 ? -1 : p + _ & 65535;
      } else q = -1;
      let z = 0, v = 0, w = q < 0 ? 0 : r[q], x = h + 1;
      e: for (; x < i; ) {
        for (; !(w & (Y.VALUE_LENGTH | Y.FLAG13)) && w & Y.JUMP_TABLE; ) {
          let k = w & Y.JUMP_TABLE, y = (w & Y.BRANCH_LENGTH) >> 7;
          if (y === 0) {
            if (e.charCodeAt(x) !== k) break e;
            q += 1;
          } else {
            let E = e.charCodeAt(x) - k;
            if (E >>> 0 >= y) break e;
            let B = r[q + 1 + E];
            if (B === 0) break e;
            q = q + y + B & 65535;
          }
          if (w = r[q], x += 1, x >= i) break e;
        }
        if ((w & (Y.VALUE_LENGTH | Y.FLAG13)) === Y.FLAG13) {
          let k = (w & Y.BRANCH_LENGTH) >> 7;
          if (e.charCodeAt(x) !== (w & Y.JUMP_TABLE)) break;
          x += 1;
          let y = k - 1, E = q + 1, B = 0;
          for (; B + 1 < y; B += 2) {
            let N = r[E];
            if (e.charCodeAt(x) !== (N & 255) || (x += 1, e.charCodeAt(x) !== (N >> 8 & 255))) break e;
            x += 1, E += 1;
          }
          if (B < y) {
            if (e.charCodeAt(x) !== (r[E] & 255)) break;
            x += 1;
          }
          q += 1 + (k >> 1), w = r[q];
          continue;
        }
        let _ = w >>> 14, b = e.charCodeAt(x);
        if (_ !== 0) {
          if (b === Q.SEMI) {
            f = x - h + 1, d = _ === 1 ? String.fromCharCode(w & Y.VALUE_MASK) : Bt(r, q, _);
            break;
          }
          if (_ === 1) break;
        }
        let F = Zr(r, w, q + (_ || 1), b);
        if (F < 0) break;
        q = F, w = r[q], x += 1;
      }
      d === "" && f > 0 && (d = Bt(r, z, v));
    } else f = 0, d = "";
    f === 0 || n ? a = h : (s < a && (o += e.slice(s, a)), o += d, a = s = h + f), e.charCodeAt(a) !== Q.AMP && (a = e.indexOf("&", a));
  } while (a >= 0);
  return o + e.slice(s);
}
function mn(e) {
  return Yr(e, !0, !1);
}
var Kr = /* @__PURE__ */ Ze({
  arrayReplaceAt: () => Hr,
  asciiTrim: () => Ye,
  callable: () => gn,
  escapeHtml: () => xe,
  escapeRE: () => sa,
  fromCodePoint: () => Te,
  isMdAsciiPunct: () => Me,
  isPunctChar: () => vn,
  isPunctCharCode: () => Ie,
  isSpace: () => L,
  isValidEntityCode: () => bt,
  isWhiteSpace: () => Se,
  lib: () => oa,
  normalizeReference: () => Xe,
  unescapeAll: () => Ae,
  unescapeMd: () => ea
});
function gn(e) {
  let t = function(...n) {
    return Reflect.construct(e, n, new.target && new.target !== t ? new.target : e);
  };
  return Object.defineProperty(t, "name", { value: e.name }), Object.setPrototypeOf(t, e), t.prototype = e.prototype, t;
}
function Hr(e, t, n) {
  return [].concat(e.slice(0, t), n, e.slice(t + 1));
}
function bt(e) {
  return !(e >= 55296 && e <= 57343 || e >= 64976 && e <= 65007 || (e & 65535) == 65535 || (e & 65535) == 65534 || e >= 0 && e <= 8 || e === 11 || e >= 14 && e <= 31 || e >= 127 && e <= 159 || e > 1114111);
}
function Te(e) {
  if (e > 65535) {
    e -= 65536;
    let t = 55296 + (e >> 10), n = 56320 + (e & 1023);
    return String.fromCharCode(t, n);
  }
  return String.fromCharCode(e);
}
var bn = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, Gr = RegExp(`${bn.source}|&([a-z#][a-z0-9]{1,31});`, "gi"), Vr = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function Qr(e, t) {
  if (t.charCodeAt(0) === 35 && Vr.test(t)) {
    let r = t[1].toLowerCase() === "x" ? parseInt(t.slice(2), 16) : parseInt(t.slice(1), 10);
    return bt(r) ? Te(r) : e;
  }
  let n = mn(e);
  return n === e ? e : n;
}
function ea(e) {
  return e.indexOf("\\") < 0 ? e : e.replace(bn, "$1");
}
function Ae(e) {
  return e.indexOf("\\") < 0 && e.indexOf("&") < 0 ? e : e.replace(Gr, function(t, n, r) {
    return n || Qr(t, r);
  });
}
var ta = /[&<>"]/, na = /[&<>"]/g, ra = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
};
function aa(e) {
  return ra[e];
}
function xe(e) {
  return ta.test(e) ? e.replace(na, aa) : e;
}
var ia = /[.?*+^$[\]\\(){}|-]/g;
function sa(e) {
  return e.replace(ia, "\\$&");
}
function L(e) {
  switch (e) {
    case 9:
    case 32:
      return !0;
  }
  return !1;
}
function Se(e) {
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
function vn(e) {
  return gt.test(e) || dn.test(e);
}
function Ie(e) {
  return vn(Te(e));
}
function Me(e) {
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
function Xe(e) {
  return e = e.trim().replace(/\s+/g, " "), e.toLowerCase().toUpperCase();
}
function Tt(e) {
  return e === 32 || e === 9 || e === 10 || e === 13;
}
function Ye(e) {
  let t = 0;
  for (; t < e.length && Tt(e.charCodeAt(t)); t++) ;
  let n = e.length - 1;
  for (; n >= t && Tt(e.charCodeAt(n)); n--) ;
  return e.slice(t, n + 1);
}
var oa = {
  mdurl: Fr,
  ucmicro: Nr
};
function la(e, t, n) {
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
function ca(e, t, n) {
  let r, a = t, i = {
    ok: !1,
    pos: 0,
    str: ""
  };
  if (e.charCodeAt(a) === 60) {
    for (a++; a < n; ) {
      if (r = e.charCodeAt(a), r === 10 || r === 60) return i;
      if (r === 62) return i.pos = a + 1, i.str = Ae(e.slice(t + 1, a)), i.ok = !0, i;
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
  return t === a || s !== 0 || (i.str = Ae(e.slice(t, a)), i.pos = a, i.ok = !0), i;
}
function ua(e, t, n, r) {
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
    if (a = e.charCodeAt(i), a === s.marker) return s.pos = i + 1, s.str += Ae(e.slice(t, i)), s.ok = !0, s;
    if (a === 40 && s.marker === 41) return s;
    a === 92 && i + 1 < n && i++, i++;
  }
  return s.can_continue = !0, s.str += Ae(e.slice(t, i)), s;
}
var da = /* @__PURE__ */ Ze({
  parseLinkDestination: () => ca,
  parseLinkLabel: () => la,
  parseLinkTitle: () => ua
}), qe = class {
  constructor(e, t, n) {
    C(this, "map", null), C(this, "level", 0), C(this, "children", null), C(this, "content", ""), C(this, "markup", ""), C(this, "info", ""), C(this, "block", !1), C(this, "hidden", !1), this.type = e, this.tag = t, this.attrs = null, this.nesting = n, this.meta = null;
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
}, je = class {
  constructor() {
    C(this, "__rules__", []), C(this, "__cache__", null);
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
}, ce = {};
ce.code_inline = function(e, t, n, r, a) {
  let i = e[t];
  return `<code${a.renderAttrs(i)}>${xe(i.content)}</code>`;
}, ce.code_block = function(e, t, n, r, a) {
  let i = e[t];
  return `<pre${a.renderAttrs(i)}><code>${xe(e[t].content)}</code></pre>
`;
}, ce.fence = function(e, t, n, r, a) {
  let i = e[t], s = i.info ? Ae(i.info).trim() : "", o = "", l = "";
  if (s) {
    let p = s.split(/(\s+)/g);
    o = p[0], l = p.slice(2).join("");
  }
  let c;
  if (c = n.highlight && n.highlight(i.content, o, l) || xe(i.content), c.indexOf("<pre") === 0) return c + `
`;
  if (s) {
    let p = i.attrIndex("class"), h = i.attrs ? i.attrs.slice() : [];
    p < 0 ? h.push(["class", `${n.langPrefix}${o}`]) : (h[p] = [h[p][0], h[p][1]], h[p][1] += ` ${n.langPrefix}${o}`);
    let g = { attrs: h };
    return `<pre><code${a.renderAttrs(g)}>${c}</code></pre>
`;
  }
  return `<pre><code${a.renderAttrs(i)}>${c}</code></pre>
`;
}, ce.image = function(e, t, n, r, a) {
  let i = e[t];
  return i.attrs[i.attrIndex("alt")][1] = a.renderInlineAsText(i.children, n, r), a.renderToken(e, t, n);
}, ce.hardbreak = function(e, t, n) {
  return n.xhtmlOut ? `<br />
` : `<br>
`;
}, ce.softbreak = function(e, t, n) {
  return n.breaks ? n.xhtmlOut ? `<br />
` : `<br>
` : `
`;
}, ce.text = function(e, t) {
  return xe(e[t].content);
}, ce.html_block = function(e, t) {
  return e[t].content;
}, ce.html_inline = function(e, t) {
  return e[t].content;
};
var kn = class {
  constructor() {
    C(this, "rules", Object.assign({}, ce));
  }
  renderAttrs(e) {
    let t, n, r;
    if (!e.attrs) return "";
    for (r = "", t = 0, n = e.attrs.length; t < n; t++) r += ` ${xe(e.attrs[t][0])}="${xe(String(e.attrs[t][1]))}"`;
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
}, zn = class {
  constructor(e, t, n) {
    C(this, "tokens", []), C(this, "inlineMode", !1), C(this, "Token", qe), this.src = e, this.env = n, this.md = t;
  }
}, ha = /\r\n?/g, pa = /\0/g;
function fa(e) {
  let t;
  t = e.src.replace(ha, `
`), t = t.replace(pa, "�"), e.src = t;
}
function ma(e) {
  let t;
  e.inlineMode ? (t = new e.Token("inline", "", 0), t.content = e.src, t.map = [0, 1], t.children = [], e.tokens.push(t)) : e.md.block.parse(e.src, e.md, e.env, e.tokens);
}
function ga(e) {
  let t = e.tokens, n = 0;
  for (let r = 0; r < t.length; r++) t[r].type !== "reference_definition" && (r !== n && (t[n] = t[r]), n++);
  t.length !== n && (t.length = n);
}
function ba(e) {
  let t = e.tokens;
  for (let n = 0, r = t.length; n < r; n++) {
    let a = t[n];
    a.type === "inline" && e.md.inline.parse(a.content, e.md, e.env, a.children);
  }
}
function va(e) {
  return /^<a[>\s]/i.test(e);
}
function ka(e) {
  return /^<\/a\s*>/i.test(e);
}
function za(e) {
  let t = e.tokens;
  if (e.md.options.linkify) for (let n = 0, r = t.length; n < r; n++) {
    if (t[n].type !== "inline" || !e.md.linkify.test(t[n].content)) continue;
    let a = t[n].children, i = [], s = 0;
    for (let o = a.length - 1; o >= 0; o--) {
      let l = a[o];
      if (l.type === "link_close") for (o--; a[o].level !== l.level && a[o].type !== "link_open"; ) o--;
      else if (l.type === "html_inline" && (va(l.content) && s > 0 && s--, ka(l.content) && s++), !(s > 0) && l.type === "text" && e.md.linkify.test(l.content)) {
        let c = l.content, p = e.md.linkify.match(c), h = [], g = l.level, f = 0;
        p.length > 0 && p[0].index === 0 && o > 0 && a[o - 1].type === "text_special" && (p = p.slice(1));
        for (let d = 0; d < p.length; d++) {
          let R = p[d].url, q = e.md.normalizeLink(R);
          if (!e.md.validateLink(q)) continue;
          let z = p[d].text;
          z = p[d].schema ? p[d].schema === "mailto:" && !/^mailto:/i.test(z) ? e.md.normalizeLinkText(`mailto:${z}`).replace(/^mailto:/, "") : e.md.normalizeLinkText(z) : e.md.normalizeLinkText(`http://${z}`).replace(/^http:\/\//, "");
          let v = p[d].index;
          if (v > f) {
            let b = new e.Token("text", "", 0);
            b.content = c.slice(f, v), b.level = g, h.push(b);
          }
          let w = new e.Token("link_open", "a", 1);
          w.attrs = [["href", q]], w.level = g++, w.markup = "linkify", w.info = "auto", h.push(w);
          let x = new e.Token("text", "", 0);
          x.content = z, x.level = g, h.push(x);
          let _ = new e.Token("link_close", "a", -1);
          _.level = --g, _.markup = "linkify", _.info = "auto", h.push(_), f = p[d].lastIndex;
        }
        if (f < c.length) {
          let d = new e.Token("text", "", 0);
          d.content = c.slice(f), d.level = g, h.push(d);
        }
        i.push({
          index: o,
          nodes: h
        });
      }
    }
    if (i.length > 0) {
      let o = a.length;
      for (let h of i) o += h.nodes.length - 1;
      let l = Array(o), c = 0, p = 0;
      i.reverse();
      for (let h = 0; h < a.length; h++) {
        let g = i[c];
        if ((g == null ? void 0 : g.index) === h) {
          for (let f of g.nodes) l[p++] = f;
          c++;
        } else l[p++] = a[h];
      }
      t[n].children = l;
    }
  }
}
var xn = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/, xa = /\((c|tm|r)\)/i, qa = /\((c|tm|r)\)/gi, wa = {
  c: "©",
  r: "®",
  tm: "™"
};
function _a(e, t) {
  return wa[t.toLowerCase()];
}
function Ra(e) {
  let t = 0;
  for (let n = e.length - 1; n >= 0; n--) {
    let r = e[n];
    r.type === "text" && !t && (r.content = r.content.replace(qa, _a)), r.type === "link_open" && r.info === "auto" && t--, r.type === "link_close" && r.info === "auto" && t++;
  }
}
function ya(e) {
  let t = 0;
  for (let n = e.length - 1; n >= 0; n--) {
    let r = e[n];
    r.type === "text" && !t && xn.test(r.content) && (r.content = r.content.replace(/\+-/g, "±").replace(/\.{2,}/g, "…").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/gm, "$1—").replace(/(^|\s)--(?=\s|$)/gm, "$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/gm, "$1–")), r.type === "link_open" && r.info === "auto" && t--, r.type === "link_close" && r.info === "auto" && t++;
  }
}
function Ca(e) {
  let t;
  if (e.md.options.typographer) for (t = e.tokens.length - 1; t >= 0; t--) e.tokens[t].type === "inline" && (xa.test(e.tokens[t].content) && Ra(e.tokens[t].children), xn.test(e.tokens[t].content) && ya(e.tokens[t].children));
}
var Da = /['"]/, St = /['"]/g, It = "’", Aa = 1e3;
function Mt(e, t, n) {
  for (; e.length > n; ) {
    let r = e.pop();
    r.isSingleQuote ? t.single = r.prevSameQuoteIdx : t.double = r.prevSameQuoteIdx;
  }
}
function $e(e, t, n, r) {
  e[t] || (e[t] = []), e[t].push({
    pos: n,
    ch: r
  });
}
function Fa(e, t) {
  let n = "", r = 0;
  t.sort((a, i) => a.pos - i.pos);
  for (let a = 0; a < t.length; a++) {
    let i = t[a];
    n += e.slice(r, i.pos) + i.ch, r = i.pos + 1;
  }
  return n + e.slice(r);
}
function Na(e, t) {
  let n, r = [], a = {
    single: -1,
    double: -1
  }, i = {};
  for (let s = 0; s < e.length; s++) {
    let o = e[s], l = e[s].level;
    for (n = r.length - 1; n >= 0 && !(r[n].level <= l); n--) ;
    if (Mt(r, a, n + 1), o.type !== "text") continue;
    let c = o.content, p = 0, h = c.length;
    e: for (; p < h; ) {
      St.lastIndex = p;
      let g = St.exec(c);
      if (!g) break;
      let f = !0, d = !0;
      p = g.index + 1;
      let R = g[0] === "'", q = 32;
      if (g.index - 1 >= 0) q = c.charCodeAt(g.index - 1);
      else for (n = s - 1; n >= 0 && e[n].type !== "softbreak" && e[n].type !== "hardbreak"; n--) if (e[n].content) {
        q = e[n].content.charCodeAt(e[n].content.length - 1);
        break;
      }
      let z = 32;
      if (p < h) z = c.charCodeAt(p);
      else for (n = s + 1; n < e.length && e[n].type !== "softbreak" && e[n].type !== "hardbreak"; n++) if (e[n].content) {
        z = e[n].content.charCodeAt(0);
        break;
      }
      let v = Me(q) || Ie(q), w = Me(z) || Ie(z), x = Se(q), _ = Se(z);
      if (_ ? f = !1 : w && (x || v || (f = !1)), x ? d = !1 : v && (_ || w || (d = !1)), z === 34 && g[0] === '"' && q >= 48 && q <= 57 && (d = f = !1), f && d && (f = v, d = w), !f && !d) R && $e(i, s, g.index, It);
      else {
        if (d && (n = R ? a.single : a.double, n >= 0 && r[n].level === l)) {
          let b = r[n], F, k;
          R ? (F = t.md.options.quotes[2], k = t.md.options.quotes[3]) : (F = t.md.options.quotes[0], k = t.md.options.quotes[1]), $e(i, s, g.index, k), $e(i, b.tokenIdx, b.contentPos, F), Mt(r, a, n);
          continue e;
        }
        if (f) {
          if (r.length >= Aa) return;
          r.push({
            tokenIdx: s,
            contentPos: g.index,
            isSingleQuote: R,
            level: l,
            prevSameQuoteIdx: R ? a.single : a.double
          }), R ? a.single = r.length - 1 : a.double = r.length - 1;
        } else d && R && $e(i, s, g.index, It);
      }
    }
  }
  Object.keys(i).forEach(function(s) {
    let o = Number(s);
    e[o].content = Fa(e[o].content, i[s]);
  });
}
function Ea(e) {
  if (e.md.options.typographer) for (let t = e.tokens.length - 1; t >= 0; t--) e.tokens[t].type === "inline" && Da.test(e.tokens[t].content) && Na(e.tokens[t].children, e);
}
function Ba(e) {
  let t, n, r = e.length;
  for (t = 0; t < r; t++) e[t].type === "text_special" && (e[t].type = "text");
  for (t = n = 0; t < r; t++) e[t].type === "text" && t + 1 < r && e[t + 1].type === "text" ? e[t + 1].content = e[t].content + e[t + 1].content : (t !== n && (e[n] = e[t]), n++);
  t !== n && (e.length = n);
}
function Ta(e) {
  let t, n, r = e.tokens, a = r.length;
  for (let i = 0; i < a; i++) {
    if (r[i].type !== "inline") continue;
    let s = r[i].children, o = s.length;
    for (t = 0; t < o; t++) s[t].type === "text_special" && (s[t].type = "text"), s[t].children && Ba(s[t].children);
    for (t = n = 0; t < o; t++) s[t].type === "text" && t + 1 < o && s[t + 1].type === "text" ? s[t + 1].content = s[t].content + s[t + 1].content : (t !== n && (s[n] = s[t]), n++);
    t !== n && (s.length = n);
  }
}
var Ge = [
  ["normalize", fa],
  ["block", ma],
  ["strip_references", ga],
  ["inline", ba],
  ["linkify", za],
  ["replacements", Ca],
  ["smartquotes", Ea],
  ["text_join", Ta]
], qn = class {
  constructor() {
    C(this, "ruler", new je()), C(this, "State", zn);
    for (let e = 0; e < Ge.length; e++) this.ruler.push(Ge[e][0], Ge[e][1]);
  }
  process(e) {
    let t = this.ruler.getRules("");
    for (let n = 0, r = t.length; n < r; n++) t[n](e);
  }
}, wn = class {
  constructor(e, t, n, r) {
    C(this, "bMarks", []), C(this, "eMarks", []), C(this, "tShift", []), C(this, "sCount", []), C(this, "bsCount", []), C(this, "blkIndent", 0), C(this, "line", 0), C(this, "lineMax", 0), C(this, "tight", !1), C(this, "listIndent", -1), C(this, "parentType", "root"), C(this, "level", 0), C(this, "Token", qe), this.src = e, this.md = t, this.env = n, this.tokens = r;
    let a = this.src;
    for (let i = 0, s = 0, o = 0, l = 0, c = a.length, p = !1; s < c; s++) {
      let h = a.charCodeAt(s);
      if (!p) {
        if (L(h)) {
          o++, h === 9 ? l += 4 - l % 4 : l++;
          continue;
        }
        p = !0;
      }
      (h === 10 || s === c - 1) && (h !== 10 && s++, this.bMarks.push(i), this.eMarks.push(s), this.tShift.push(o), this.sCount.push(l), this.bsCount.push(0), p = !1, o = 0, l = 0, i = s + 1);
    }
    this.bMarks.push(a.length), this.eMarks.push(a.length), this.tShift.push(0), this.sCount.push(0), this.bsCount.push(0), this.lineMax = this.bMarks.length - 1;
  }
  push(e, t, n) {
    let r = new qe(e, t, n);
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
    for (let t = this.src.length; e < t && L(this.src.charCodeAt(e)); e++) ;
    return e;
  }
  skipSpacesBack(e, t) {
    if (e <= t) return e;
    for (; e > t; ) if (!L(this.src.charCodeAt(--e))) return e + 1;
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
      let o = 0, l = this.bMarks[s], c = l, p;
      for (p = s + 1 < t || r ? this.eMarks[s] + 1 : this.eMarks[s]; c < p && o < n; ) {
        let h = this.src.charCodeAt(c);
        if (L(h)) h === 9 ? o += 4 - (o + this.bsCount[s]) % 4 : o++;
        else if (c - l < this.tShift[s]) o++;
        else break;
        c++;
      }
      o > n ? a[i] = Array(o - n + 1).join(" ") + this.src.slice(c, p) : a[i] = this.src.slice(c, p);
    }
    return a.join("");
  }
}, Sa = 65536;
function Ve(e, t) {
  let n = e.bMarks[t] + e.tShift[t], r = e.eMarks[t];
  return e.src.slice(n, r);
}
function jt(e) {
  let t = [], n = e.length, r = 0, a = e.charCodeAt(r), i = !1, s = 0, o = "";
  for (; r < n; ) a === 124 && (i ? (o += e.substring(s, r - 1), s = r) : (t.push(o + e.substring(s, r)), o = "", s = r + 1)), i = a === 92, r++, a = e.charCodeAt(r);
  return t.push(o + e.substring(s)), t;
}
function Ia(e, t, n, r) {
  if (t + 2 > n) return !1;
  let a = t + 1;
  if (e.sCount[a] < e.blkIndent || e.sCount[a] - e.blkIndent >= 4) return !1;
  let i = e.bMarks[a] + e.tShift[a];
  if (i >= e.eMarks[a]) return !1;
  let s = e.src.charCodeAt(i++);
  if (s !== 124 && s !== 45 && s !== 58 || i >= e.eMarks[a]) return !1;
  let o = e.src.charCodeAt(i++);
  if (o !== 124 && o !== 45 && o !== 58 && !L(o) || s === 45 && L(o)) return !1;
  for (; i < e.eMarks[a]; ) {
    let x = e.src.charCodeAt(i);
    if (x !== 124 && x !== 45 && x !== 58 && !L(x)) return !1;
    i++;
  }
  let l = Ve(e, t + 1), c = l.split("|"), p = [];
  for (let x = 0; x < c.length; x++) {
    let _ = c[x].trim();
    if (!_) {
      if (x === 0 || x === c.length - 1) continue;
      return !1;
    }
    if (!/^:?-+:?$/.test(_)) return !1;
    _.charCodeAt(_.length - 1) === 58 ? p.push(_.charCodeAt(0) === 58 ? "center" : "right") : _.charCodeAt(0) === 58 ? p.push("left") : p.push("");
  }
  if (l = Ve(e, t).trim(), l.indexOf("|") === -1 || e.sCount[t] - e.blkIndent >= 4) return !1;
  c = jt(l), c.length && c[0] === "" && c.shift(), c.length && c[c.length - 1] === "" && c.pop();
  let h = c.length;
  if (h === 0 || h !== p.length) return !1;
  if (r) return !0;
  let g = e.parentType;
  e.parentType = "table";
  let f = e.md.block.ruler.getRules("blockquote"), d = e.push("table_open", "table", 1), R = [t, 0];
  d.map = R;
  let q = e.push("thead_open", "thead", 1);
  q.map = [t, t + 1];
  let z = e.push("tr_open", "tr", 1);
  z.map = [t, t + 1];
  for (let x = 0; x < c.length; x++) {
    let _ = e.push("th_open", "th", 1);
    p[x] && (_.attrs = [["style", `text-align:${p[x]}`]]);
    let b = e.push("inline", "", 0);
    b.content = c[x].trim(), b.children = [], e.push("th_close", "th", -1);
  }
  e.push("tr_close", "tr", -1), e.push("thead_close", "thead", -1);
  let v, w = 0;
  for (a = t + 2; a < n && !(e.sCount[a] < e.blkIndent); a++) {
    let x = !1;
    for (let b = 0, F = f.length; b < F; b++) if (f[b](e, a, n, !0)) {
      x = !0;
      break;
    }
    if (x || (l = Ve(e, a).trim(), !l) || e.sCount[a] - e.blkIndent >= 4 || (c = jt(l), c.length && c[0] === "" && c.shift(), c.length && c[c.length - 1] === "" && c.pop(), w += h - c.length, w > Sa)) break;
    if (a === t + 2) {
      let b = e.push("tbody_open", "tbody", 1);
      b.map = v = [t + 2, 0];
    }
    let _ = e.push("tr_open", "tr", 1);
    _.map = [a, a + 1];
    for (let b = 0; b < h; b++) {
      let F = e.push("td_open", "td", 1);
      p[b] && (F.attrs = [["style", `text-align:${p[b]}`]]);
      let k = e.push("inline", "", 0);
      k.content = c[b] ? c[b].trim() : "", k.children = [], e.push("td_close", "td", -1);
    }
    e.push("tr_close", "tr", -1);
  }
  return v && (e.push("tbody_close", "tbody", -1), v[1] = a), e.push("table_close", "table", -1), R[1] = a, e.parentType = g, e.line = a, !0;
}
function Ma(e, t, n) {
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
function ja(e, t, n, r) {
  let a = e.bMarks[t] + e.tShift[t], i = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4 || a + 3 > i) return !1;
  let s = e.src.charCodeAt(a);
  if (s !== 126 && s !== 96) return !1;
  let o = a;
  a = e.skipChars(a, s);
  let l = a - o;
  if (l < 3) return !1;
  let c = e.src.slice(o, a), p = e.src.slice(a, i);
  if (s === 96 && p.indexOf(String.fromCharCode(s)) >= 0) return !1;
  if (r) return !0;
  let h = t, g = !1;
  for (; h++, !(h >= n || (a = o = e.bMarks[h] + e.tShift[h], i = e.eMarks[h], a < i && e.sCount[h] < e.blkIndent)); ) if (e.src.charCodeAt(a) === s && !(e.sCount[h] - e.blkIndent >= 4) && (a = e.skipChars(a, s), !(a - o < l) && (a = e.skipSpaces(a), !(a < i)))) {
    g = !0;
    break;
  }
  l = e.sCount[t], e.line = h + +!!g;
  let f = e.push("fence", "code", 0);
  return f.info = p, f.content = e.getLines(t + 1, h, l, !0), f.markup = c, f.map = [t, e.line], !0;
}
function $a(e, t, n, r) {
  let a = e.bMarks[t] + e.tShift[t], i = e.eMarks[t], s = e.lineMax;
  if (e.sCount[t] - e.blkIndent >= 4 || e.src.charCodeAt(a) !== 62) return !1;
  if (r) return !0;
  let o = [], l = [], c = [], p = [], h = e.md.block.ruler.getRules("blockquote"), g = e.parentType;
  e.parentType = "blockquote";
  let f = !1, d;
  for (d = t; d < n; d++) {
    let w = e.sCount[d] < e.blkIndent;
    if (a = e.bMarks[d] + e.tShift[d], i = e.eMarks[d], a >= i) break;
    if (e.src.charCodeAt(a++) === 62 && !w) {
      let _ = e.sCount[d] + 1, b, F;
      e.src.charCodeAt(a) === 32 ? (a++, _++, F = !1, b = !0) : e.src.charCodeAt(a) === 9 ? (b = !0, (e.bsCount[d] + _) % 4 == 3 ? (a++, _++, F = !1) : F = !0) : b = !1;
      let k = _;
      for (o.push(e.bMarks[d]), e.bMarks[d] = a; a < i; ) {
        let y = e.src.charCodeAt(a);
        if (L(y)) y === 9 ? k += 4 - (k + e.bsCount[d] + +!!F) % 4 : k++;
        else break;
        a++;
      }
      f = a >= i, l.push(e.bsCount[d]), e.bsCount[d] = e.sCount[d] + 1 + +!!b, c.push(e.sCount[d]), e.sCount[d] = k - _, p.push(e.tShift[d]), e.tShift[d] = a - e.bMarks[d];
      continue;
    }
    if (f) break;
    let x = !1;
    for (let _ = 0, b = h.length; _ < b; _++) if (h[_](e, d, n, !0)) {
      x = !0;
      break;
    }
    if (x) {
      e.lineMax = d, e.blkIndent !== 0 && (o.push(e.bMarks[d]), l.push(e.bsCount[d]), p.push(e.tShift[d]), c.push(e.sCount[d]), e.sCount[d] -= e.blkIndent);
      break;
    }
    o.push(e.bMarks[d]), l.push(e.bsCount[d]), p.push(e.tShift[d]), c.push(e.sCount[d]), e.sCount[d] = -1;
  }
  let R = e.blkIndent;
  e.blkIndent = 0;
  let q = e.push("blockquote_open", "blockquote", 1);
  q.markup = ">";
  let z = [t, 0];
  q.map = z, e.md.block.tokenize(e, t, d);
  let v = e.push("blockquote_close", "blockquote", -1);
  v.markup = ">", e.lineMax = s, e.parentType = g, z[1] = e.line;
  for (let w = 0; w < p.length; w++) e.bMarks[w + t] = o[w], e.tShift[w + t] = p[w], e.sCount[w + t] = c[w], e.bsCount[w + t] = l[w];
  return e.blkIndent = R, !0;
}
function Ja(e, t, n, r) {
  let a = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4) return !1;
  let i = e.bMarks[t] + e.tShift[t], s = e.src.charCodeAt(i++);
  if (s !== 42 && s !== 45 && s !== 95) return !1;
  let o = 1;
  for (; i < a; ) {
    let c = e.src.charCodeAt(i++);
    if (c !== s && !L(c)) return !1;
    c === s && o++;
  }
  if (o < 3) return !1;
  if (r) return !0;
  e.line = t + 1;
  let l = e.push("hr", "hr", 0);
  return l.map = [t, e.line], l.markup = Array(o + 1).join(String.fromCharCode(s)), !0;
}
function $t(e, t) {
  let n = e.eMarks[t], r = e.bMarks[t] + e.tShift[t], a = e.src.charCodeAt(r++);
  return a !== 42 && a !== 45 && a !== 43 || r < n && !L(e.src.charCodeAt(r)) ? -1 : r;
}
function Jt(e, t) {
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
  return a < r && (i = e.src.charCodeAt(a), !L(i)) ? -1 : a;
}
function La(e, t) {
  let n = e.level + 2;
  for (let r = t + 2, a = e.tokens.length - 2; r < a; r++) e.tokens[r].level === n && e.tokens[r].type === "paragraph_open" && (e.tokens[r + 2].hidden = !0, e.tokens[r].hidden = !0, r += 2);
}
function Oa(e, t, n, r) {
  let a, i, s, o, l = t, c = !0;
  if (e.sCount[l] - e.blkIndent >= 4 || e.listIndent >= 0 && e.sCount[l] - e.listIndent >= 4 && e.sCount[l] < e.blkIndent) return !1;
  let p = !1;
  r && e.parentType === "paragraph" && e.sCount[l] >= e.blkIndent && (p = !0);
  let h, g, f;
  if ((f = Jt(e, l)) >= 0) {
    if (h = !0, s = e.bMarks[l] + e.tShift[l], g = Number(e.src.slice(s, f - 1)), p && g !== 1) return !1;
  } else if ((f = $t(e, l)) >= 0) h = !1;
  else return !1;
  if (p && e.skipSpaces(f) >= e.eMarks[l]) return !1;
  if (r) return !0;
  let d = e.src.charCodeAt(f - 1), R = e.tokens.length;
  h ? (o = e.push("ordered_list_open", "ol", 1), g !== 1 && (o.attrs = [["start", g]])) : o = e.push("bullet_list_open", "ul", 1);
  let q = [l, 0];
  o.map = q, o.markup = String.fromCharCode(d);
  let z = !1, v = e.md.block.ruler.getRules("list"), w = e.parentType;
  for (e.parentType = "list"; l < n; ) {
    i = f, a = e.eMarks[l];
    let x = e.sCount[l] + f - (e.bMarks[l] + e.tShift[l]), _ = x;
    for (; i < a; ) {
      let I = e.src.charCodeAt(i);
      if (I === 9) _ += 4 - (_ + e.bsCount[l]) % 4;
      else if (I === 32) _++;
      else break;
      i++;
    }
    let b = i, F;
    F = b >= a ? 1 : _ - x, F > 4 && (F = 1);
    let k = x + F;
    o = e.push("list_item_open", "li", 1), o.markup = String.fromCharCode(d);
    let y = [l, 0];
    o.map = y, h && (o.info = e.src.slice(s, f - 1));
    let E = e.tight, B = e.tShift[l], N = e.sCount[l], T = e.listIndent;
    if (e.listIndent = e.blkIndent, e.blkIndent = k, e.tight = !0, e.tShift[l] = b - e.bMarks[l], e.sCount[l] = _, b >= a && e.isEmpty(l + 1) ? e.line = Math.min(e.line + 2, n) : e.md.block.tokenize(e, l, n), (!e.tight || z) && (c = !1), z = e.line - l > 1 && e.isEmpty(e.line - 1), e.blkIndent = e.listIndent, e.listIndent = T, e.tShift[l] = B, e.sCount[l] = N, e.tight = E, o = e.push("list_item_close", "li", -1), o.markup = String.fromCharCode(d), l = e.line, y[1] = l, l >= n || e.sCount[l] < e.blkIndent || e.sCount[l] - e.blkIndent >= 4) break;
    let $ = !1;
    for (let I = 0, ee = v.length; I < ee; I++) if (v[I](e, l, n, !0)) {
      $ = !0;
      break;
    }
    if ($) break;
    if (h) {
      if (f = Jt(e, l), f < 0) break;
      s = e.bMarks[l] + e.tShift[l];
    } else if (f = $t(e, l), f < 0) break;
    if (d !== e.src.charCodeAt(f - 1)) break;
  }
  return o = h ? e.push("ordered_list_close", "ol", -1) : e.push("bullet_list_close", "ul", -1), o.markup = String.fromCharCode(d), q[1] = l, e.line = l, e.parentType = w, c && La(e, R), !0;
}
var Qe = 999;
function Wa(e) {
  let t = e.length;
  for (let n = 0; n < e.length - 1; n++) {
    let r = e.charCodeAt(n);
    if (r < 55296 || r > 56319) continue;
    let a = e.charCodeAt(n + 1);
    a >= 56320 && a <= 57343 && (t--, n++);
  }
  return t;
}
function Ne(e, t) {
  return Math.min(e.eMarks[t] + 1, e.src.length);
}
function Je(e, t) {
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
function Ua(e, t, n, r) {
  let a = e.src, i = e.bMarks[t] + e.tShift[t], s = t + 1;
  if (e.sCount[t] - e.blkIndent >= 4 || a.charCodeAt(i) !== 91) return !1;
  let o = Ne(e, t), l = "", c = -1, p = ++i;
  for (; i < o; ) {
    if (l.length + i - p > Qe * 2) return !1;
    let b = a.charCodeAt(i);
    if (b === 91) return !1;
    if (b === 93) {
      c = i;
      break;
    }
    if (b === 92 && (b = a.charCodeAt(++i)), b === 10 && i < o) {
      let F = Je(e, s);
      if (F < 0) return !1;
      l += a.slice(p, o), i = p = F, o = Ne(e, s++);
    } else i++;
  }
  if (c < 0 || a.charCodeAt(c + 1) !== 58 || (l += a.slice(p, c), l.length > Qe && Wa(l) > Qe)) return !1;
  for (i = c + 2; i < o; ) {
    let b = a.charCodeAt(i);
    if (b === 10) {
      let F = Je(e, s);
      if (F < 0) break;
      i = F, o = Ne(e, s++);
    } else if (L(b)) i++;
    else break;
  }
  let h = e.md.helpers.parseLinkDestination(a, i, o);
  if (!h.ok) return !1;
  let g = e.md.normalizeLink(h.str);
  if (!e.md.validateLink(g)) return !1;
  i = h.pos;
  let f = i, d = o, R = s;
  for (; i < o; ) {
    let b = a.charCodeAt(i);
    if (b === 10) {
      let F = Je(e, s);
      if (F < 0) break;
      i = F, o = Ne(e, s++);
    } else if (L(b)) i++;
    else break;
  }
  let q = i, z = e.md.helpers.parseLinkTitle(a, i, o);
  for (; z.can_continue; ) {
    let b = Je(e, s);
    if (b < 0) break;
    i = b, o = Ne(e, s++), z = e.md.helpers.parseLinkTitle(a, i, o, z);
  }
  let v;
  for (q !== f && z.ok ? (v = z.str, i = z.pos) : (v = "", i = f, o = d, s = R); i < o && L(a.charCodeAt(i)); ) i++;
  if (i < o && a.charCodeAt(i) !== 10 && v) for (v = "", i = f, o = d, s = R; i < o && L(a.charCodeAt(i)); ) i++;
  if (i < o && a.charCodeAt(i) !== 10) return !1;
  let w = Xe(l);
  if (!w) return !1;
  if (r) return !0;
  e.env.references === void 0 && (e.env.references = {}), e.env.references[w] === void 0 && (e.env.references[w] = {
    title: v,
    href: g
  });
  let x = e.push("reference_definition", "", 0);
  x.map = [t, s], x.hidden = !0;
  let _ = /* @__PURE__ */ Object.create(null);
  return _.label = w, x.meta = _, e.line = s, !0;
}
var Pa = /* @__PURE__ */ "address.article.aside.base.basefont.blockquote.body.caption.center.col.colgroup.dd.details.dialog.dir.div.dl.dt.fieldset.figcaption.figure.footer.form.frame.frameset.h1.h2.h3.h4.h5.h6.head.header.hr.html.iframe.legend.li.link.main.menu.menuitem.nav.noframes.ol.optgroup.option.p.param.search.section.summary.table.tbody.td.tfoot.th.thead.title.tr.track.ul".split("."), Za = `<[A-Za-z][A-Za-z0-9\\-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*"))?)*\\s*\\/?>`, Xa = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>", _n = RegExp(`^(?:${Za}|${Xa})`), ze = [
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
    RegExp(`^</?(${Pa.join("|")})(?=(\\s|/?>|$))`, "i"),
    /^$/,
    !0
  ],
  [
    RegExp(`${_n.source}\\s*$`),
    /^$/,
    !1
  ]
];
function Ya(e, t, n, r) {
  let a = e.bMarks[t] + e.tShift[t], i = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4 || !e.md.options.html || e.src.charCodeAt(a) !== 60) return !1;
  let s = e.src.slice(a, i), o = 0;
  for (; o < ze.length && !ze[o][0].test(s); o++) ;
  if (o === ze.length) return !1;
  if (r) return ze[o][2];
  let l = t + 1, c = ze[o][1].test("");
  if (!ze[o][1].test(s)) {
    for (; l < n && !(e.sCount[l] < e.blkIndent && (c || !e.isEmpty(l))); l++) if (a = e.bMarks[l] + e.tShift[l], i = e.eMarks[l], s = e.src.slice(a, i), ze[o][1].test(s)) {
      s.length !== 0 && l++;
      break;
    }
  }
  e.line = l;
  let p = e.push("html_block", "", 0);
  return p.map = [t, l], p.content = e.getLines(t, l, e.blkIndent, !0), !0;
}
function Ka(e, t, n, r) {
  let a = e.bMarks[t] + e.tShift[t], i = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4) return !1;
  let s = e.src.charCodeAt(a);
  if (s !== 35 || a >= i) return !1;
  let o = 1;
  for (s = e.src.charCodeAt(++a); s === 35 && a < i && o <= 6; ) o++, s = e.src.charCodeAt(++a);
  if (o > 6 || a < i && !L(s)) return !1;
  if (r) return !0;
  i = e.skipSpacesBack(i, a);
  let l = e.skipCharsBack(i, 35, a);
  l > a && L(e.src.charCodeAt(l - 1)) && (i = l), e.line = t + 1;
  let c = e.push("heading_open", `h${o}`, 1);
  c.markup = "########".slice(0, o), c.map = [t, e.line];
  let p = e.push("inline", "", 0);
  p.content = Ye(e.src.slice(a, i)), p.map = [t, e.line], p.children = [];
  let h = e.push("heading_close", `h${o}`, -1);
  return h.markup = "########".slice(0, o), !0;
}
function Ha(e, t, n) {
  let r = e.md.block.ruler.getRules("paragraph");
  if (e.sCount[t] - e.blkIndent >= 4) return !1;
  let a = e.parentType;
  e.parentType = "paragraph";
  let i = 0, s, o = t + 1;
  for (; o < n && !e.isEmpty(o); o++) {
    if (e.sCount[o] - e.blkIndent > 3) continue;
    if (e.sCount[o] >= e.blkIndent) {
      let f = e.bMarks[o] + e.tShift[o], d = e.eMarks[o];
      if (f < d && (s = e.src.charCodeAt(f), (s === 45 || s === 61) && (f = e.skipChars(f, s), f = e.skipSpaces(f), f >= d))) {
        i = s === 61 ? 1 : 2;
        break;
      }
    }
    if (e.sCount[o] < 0) continue;
    let g = !1;
    for (let f = 0, d = r.length; f < d; f++) if (r[f](e, o, n, !0)) {
      g = !0;
      break;
    }
    if (g) break;
  }
  if (!i) return e.parentType = a, !1;
  let l = Ye(e.getLines(t, o, e.blkIndent, !1));
  e.line = o + 1;
  let c = e.push("heading_open", `h${i}`, 1);
  c.markup = String.fromCharCode(s), c.map = [t, e.line];
  let p = e.push("inline", "", 0);
  p.content = l, p.map = [t, e.line - 1], p.children = [];
  let h = e.push("heading_close", `h${i}`, -1);
  return h.markup = String.fromCharCode(s), e.parentType = a, !0;
}
function Ga(e, t, n) {
  let r = e.md.block.ruler.getRules("paragraph"), a = e.parentType, i = t + 1;
  for (e.parentType = "paragraph"; i < n && !e.isEmpty(i); i++) {
    if (e.sCount[i] - e.blkIndent > 3 || e.sCount[i] < 0) continue;
    let c = !1;
    for (let p = 0, h = r.length; p < h; p++) if (r[p](e, i, n, !0)) {
      c = !0;
      break;
    }
    if (c) break;
  }
  let s = Ye(e.getLines(t, i, e.blkIndent, !1));
  e.line = i;
  let o = e.push("paragraph_open", "p", 1);
  o.map = [t, e.line];
  let l = e.push("inline", "", 0);
  return l.content = s, l.map = [t, e.line], l.children = [], e.push("paragraph_close", "p", -1), e.parentType = a, !0;
}
var Le = [
  [
    "table",
    Ia,
    ["paragraph", "reference"]
  ],
  ["code", Ma],
  [
    "fence",
    ja,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "blockquote",
    $a,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "hr",
    Ja,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "list",
    Oa,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  ["reference", Ua],
  [
    "html_block",
    Ya,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  [
    "heading",
    Ka,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  ["lheading", Ha],
  ["paragraph", Ga]
], Rn = class {
  constructor() {
    C(this, "ruler", new je()), C(this, "State", wn);
    for (let e = 0; e < Le.length; e++) this.ruler.push(Le[e][0], Le[e][1], { alt: (Le[e][2] || []).slice() });
  }
  tokenize(e, t, n) {
    let r = this.ruler.getRules(""), a = r.length, i = e.md.options.maxNesting, s = t, o = !1;
    for (; s < n && (e.line = s = e.skipEmptyLines(s), !(s >= n || e.sCount[s] < e.blkIndent)); ) {
      if (e.level >= i) {
        e.line = n;
        break;
      }
      let l = e.line, c = !1;
      for (let p = 0; p < a; p++) if (c = r[p](e, s, n, !1), c) {
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
}, yn = class {
  constructor(e, t, n, r) {
    C(this, "pos", 0), C(this, "level", 0), C(this, "pending", ""), C(this, "pendingLevel", 0), C(this, "cache", {}), C(this, "backticks", {}), C(this, "backticksScanned", !1), C(this, "skipHtmlSpecial", !1), C(this, "linkLevel", 0), C(this, "delimiters", []), C(this, "_prev_delimiters", []), C(this, "Token", qe), this.src = e, this.env = n, this.md = t, this.tokens = r, this.tokens_meta = Array(r.length), this.posMax = this.src.length;
  }
  pushPending() {
    let e = new qe("text", "", 0);
    return e.content = this.pending, e.level = this.pendingLevel, this.tokens.push(e), this.pending = "", e;
  }
  push(e, t, n) {
    this.pending && this.pushPending();
    let r = new qe(e, t, n), a;
    return n < 0 && (this.level--, this.delimiters = this._prev_delimiters.pop()), r.level = this.level, n > 0 && (this.level++, this._prev_delimiters.push(this.delimiters), this.delimiters = [], a = { delimiters: this.delimiters }), this.pendingLevel = this.level, this.tokens.push(r), this.tokens_meta.push(a), r;
  }
  scanDelims(e, t) {
    let n = this.posMax, r = this.src.charCodeAt(e), a;
    if (e === 0) a = 32;
    else if (e === 1) a = this.src.charCodeAt(0), (a & 63488) == 55296 && (a = 65533);
    else if (a = this.src.charCodeAt(e - 1), (a & 64512) == 56320) {
      let d = this.src.charCodeAt(e - 2);
      a = (d & 64512) == 55296 ? 65536 + (d - 55296 << 10) + (a - 56320) : 65533;
    } else (a & 64512) == 55296 && (a = 65533);
    let i = e;
    for (; i < n && this.src.charCodeAt(i) === r; ) i++;
    let s = i - e, o = i < n ? this.src.charCodeAt(i) : 32;
    if ((o & 64512) == 55296) {
      let d = this.src.charCodeAt(i + 1);
      o = (d & 64512) == 56320 ? 65536 + (o - 55296 << 10) + (d - 56320) : 65533;
    } else (o & 64512) == 56320 && (o = 65533);
    let l = Me(a) || Ie(a), c = Me(o) || Ie(o), p = Se(a), h = Se(o), g = !h && (!c || p || l), f = !p && (!l || h || c);
    return {
      can_open: g && (t || !f || l),
      can_close: f && (t || !g || c),
      length: s
    };
  }
};
function Va(e) {
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
function Qa(e, t) {
  let n = e.pos;
  for (; n < e.posMax && !Va(e.src.charCodeAt(n)); ) n++;
  return n !== e.pos && (t || (e.pending += e.src.slice(e.pos, n)), e.pos = n, !0);
}
function ei(e) {
  return e >= 65 && e <= 90 || e >= 97 && e <= 122;
}
function ti(e) {
  return e >= 65 && e <= 90 || e >= 97 && e <= 122 || e >= 48 && e <= 57 || e === 43 || e === 45 || e === 46;
}
function ni(e, t) {
  if (!e.md.options.linkify || e.linkLevel > 0) return !1;
  let n = e.pos, r = e.posMax;
  if (n + 3 > r || e.src.charCodeAt(n) !== 58 || e.src.charCodeAt(n + 1) !== 47 || e.src.charCodeAt(n + 2) !== 47) return !1;
  let a = n - Math.min(10, e.pending.length, n), i = n;
  for (; i > a && ti(e.src.charCodeAt(i - 1)); ) i--;
  if (i === n || !ei(e.src.charCodeAt(i))) return !1;
  let s = n - i, o = e.md.linkify.matchAtStart(e.src.slice(i));
  if (!o) return !1;
  let l = o.url;
  if (l.length <= s) return !1;
  let c = l.length;
  for (; c > 0 && l.charCodeAt(c - 1) === 42; ) c--;
  c !== l.length && (l = l.slice(0, c));
  let p = e.md.normalizeLink(l);
  if (!e.md.validateLink(p)) return !1;
  if (!t) {
    e.pending = e.pending.slice(0, -s);
    let h = e.push("link_open", "a", 1);
    h.attrs = [["href", p]], h.markup = "linkify", h.info = "auto";
    let g = e.push("text", "", 0);
    g.content = e.md.normalizeLinkText(l);
    let f = e.push("link_close", "a", -1);
    f.markup = "linkify", f.info = "auto";
  }
  return e.pos += l.length - s, !0;
}
function ri(e, t) {
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
  for (n++; n < a && L(e.src.charCodeAt(n)); ) n++;
  return e.pos = n, !0;
}
var vt = [];
for (let e = 0; e < 256; e++) vt.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(e) {
  vt[e.charCodeAt(0)] = 1;
});
function ai(e, t) {
  let n = e.pos, r = e.posMax;
  if (e.src.charCodeAt(n) !== 92 || (n++, n >= r)) return !1;
  let a = e.src.charCodeAt(n);
  if (a === 10) {
    for (t || e.push("hardbreak", "br", 0), n++; n < r && (a = e.src.charCodeAt(n), L(a)); ) n++;
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
    o.content = a < 256 && vt[a] !== 0 ? i : s, o.markup = s, o.info = "escape";
  }
  return e.pos = n + 1, !0;
}
function ii(e) {
  let t = {}, n = 0;
  for (; (n = e.indexOf("`", n)) !== -1; ) {
    let r = n;
    for (; e.charCodeAt(++n) === 96; ) ;
    t[n - r] = r;
  }
  return t;
}
function si(e, t) {
  var n;
  let r = e.pos;
  if (e.src.charCodeAt(r) !== 96) return !1;
  let a = e.posMax, i = r + 1;
  for (; i < a && e.src.charCodeAt(i) === 96; ) i++;
  let s = e.src.slice(r, i), o = s.length;
  if (e.backticksScanned || (e.backticks = ii(e.src), e.backticksScanned = !0), ((n = e.backticks[o]) == null ? -1 : n) >= i) {
    let l = i, c;
    for (; (c = e.src.indexOf("`", l)) !== -1 && c < a; ) {
      for (l = c + 1; e.src.charCodeAt(l) === 96; ) l++;
      if (l > a) break;
      if (l - c === o) {
        if (!t) {
          let p = e.push("code_inline", "code", 0);
          p.markup = s;
          let h = e.src.slice(i, c).replace(/\n/g, " ");
          h.startsWith(" ") && h.endsWith(" ") && /[^ ]/.test(h) && (h = h.slice(1, -1)), p.content = h;
        }
        return e.pos = l, !0;
      }
    }
  }
  return t || (e.pending += s), e.pos = i, !0;
}
function oi(e, t) {
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
function Lt(e, t) {
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
function li(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  Lt(e, e.delimiters);
  for (let a = 0; a < n; a++) {
    var r;
    let i = (r = t[a]) == null ? void 0 : r.delimiters;
    i && Lt(e, i);
  }
}
var Cn = {
  tokenize: oi,
  postProcess: li
};
function ci(e, t) {
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
function Ot(e, t) {
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
function ui(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  Ot(e, e.delimiters);
  for (let a = 0; a < n; a++) {
    var r;
    let i = (r = t[a]) == null ? void 0 : r.delimiters;
    i && Ot(e, i);
  }
}
var Dn = {
  tokenize: ci,
  postProcess: ui
};
function di(e, t) {
  let n, r, a, i, s = "", o = "", l = e.pos, c = !0;
  if (e.src.charCodeAt(e.pos) !== 91) return !1;
  let p = e.pos, h = e.posMax, g = e.pos + 1, f = e.md.helpers.parseLinkLabel(e, e.pos, !0);
  if (f < 0) return !1;
  let d = f + 1;
  if (d < h && e.src.charCodeAt(d) === 40) {
    for (c = !1, d++; d < h && (n = e.src.charCodeAt(d), L(n) || n === 10); d++) ;
    if (d >= h) return !1;
    if (l = d, a = e.md.helpers.parseLinkDestination(e.src, d, e.posMax), a.ok) {
      for (s = e.md.normalizeLink(a.str), e.md.validateLink(s) ? d = a.pos : s = "", l = d; d < h && (n = e.src.charCodeAt(d), L(n) || n === 10); d++) ;
      if (a = e.md.helpers.parseLinkTitle(e.src, d, e.posMax), d < h && l !== d && a.ok) for (o = a.str, d = a.pos; d < h && (n = e.src.charCodeAt(d), L(n) || n === 10); d++) ;
    }
    (d >= h || e.src.charCodeAt(d) !== 41) && (c = !0), d++;
  }
  if (c) {
    if (e.env.references === void 0) return !1;
    if (d < h && e.src.charCodeAt(d) === 91 ? (l = d + 1, d = e.md.helpers.parseLinkLabel(e, d), d >= 0 ? r = e.src.slice(l, d++) : d = f + 1) : d = f + 1, r || (r = e.src.slice(g, f)), r = Xe(r), i = e.env.references[r], !i) return e.pos = p, !1;
    s = i.href, o = i.title;
  }
  if (!t) {
    e.pos = g, e.posMax = f;
    let R = e.push("link_open", "a", 1), q = [["href", s]];
    if (R.attrs = q, o && q.push(["title", o]), r) {
      let z = /* @__PURE__ */ Object.create(null);
      z.label = r, R.meta = z;
    }
    e.linkLevel++, e.md.inline.tokenize(e), e.linkLevel--, e.push("link_close", "a", -1);
  }
  return e.pos = d, e.posMax = h, !0;
}
function hi(e, t) {
  let n, r, a, i, s, o, l, c, p = "", h = e.pos, g = e.posMax;
  if (e.src.charCodeAt(e.pos) !== 33 || e.src.charCodeAt(e.pos + 1) !== 91) return !1;
  let f = e.pos + 2, d = e.md.helpers.parseLinkLabel(e, e.pos + 1, !1);
  if (d < 0) return !1;
  if (i = d + 1, i < g && e.src.charCodeAt(i) === 40) {
    for (i++; i < g && (n = e.src.charCodeAt(i), L(n) || n === 10); i++) ;
    if (i >= g) return !1;
    for (c = i, o = e.md.helpers.parseLinkDestination(e.src, i, e.posMax), o.ok && (p = e.md.normalizeLink(o.str), e.md.validateLink(p) ? i = o.pos : p = ""), c = i; i < g && (n = e.src.charCodeAt(i), L(n) || n === 10); i++) ;
    if (o = e.md.helpers.parseLinkTitle(e.src, i, e.posMax), i < g && c !== i && o.ok) for (l = o.str, i = o.pos; i < g && (n = e.src.charCodeAt(i), L(n) || n === 10); i++) ;
    else l = "";
    if (i >= g || e.src.charCodeAt(i) !== 41) return e.pos = h, !1;
    i++;
  } else {
    if (e.env.references === void 0) return !1;
    if (i < g && e.src.charCodeAt(i) === 91 ? (c = i + 1, i = e.md.helpers.parseLinkLabel(e, i), i >= 0 ? a = e.src.slice(c, i++) : i = d + 1) : i = d + 1, a || (a = e.src.slice(f, d)), a = Xe(a), s = e.env.references[a], !s) return e.pos = h, !1;
    p = s.href, l = s.title;
  }
  if (!t) {
    r = e.src.slice(f, d);
    let R = [];
    e.md.inline.parse(r, e.md, e.env, R);
    let q = e.push("image", "img", 0), z = [["src", p], ["alt", ""]];
    if (q.attrs = z, q.children = R, q.content = r, l && z.push(["title", l]), a) {
      let v = /* @__PURE__ */ Object.create(null);
      v.label = a, q.meta = v;
    }
  }
  return e.pos = i, e.posMax = g, !0;
}
var pi = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/, fi = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function mi(e, t) {
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
  if (fi.test(i)) {
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
  if (pi.test(i)) {
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
function gi(e) {
  return /^<a[>\s]/i.test(e);
}
function bi(e) {
  return /^<\/a\s*>/i.test(e);
}
function An(e) {
  let t = e | 32;
  return t >= 97 && t <= 122;
}
function vi(e, t) {
  let n = e.src, r, a;
  if (n.startsWith("<!--", t)) {
    if (n.startsWith(">", t + 4)) return t + 5;
    if (n.startsWith("->", t + 4)) return t + 6;
    r = t + 4, a = "-->";
  } else if (n.startsWith("<![CDATA[", t)) r = t + 9, a = "]]>";
  else if (n.charCodeAt(t + 1) === 63) r = t + 2, a = "?>";
  else if (An(n.charCodeAt(t + 2))) r = t + 3, a = ">";
  else return -1;
  if (e.skipHtmlSpecial) return -1;
  let i = n.indexOf(a, r);
  return i < 0 ? (e.skipHtmlSpecial = !0, -1) : i + a.length;
}
function ki(e, t) {
  if (!e.md.options.html) return !1;
  let n = e.posMax, r = e.pos;
  if (e.src.charCodeAt(r) !== 60 || r + 2 >= n) return !1;
  let a, i = e.src.charCodeAt(r + 1);
  if (i === 33 || i === 63) a = vi(e, r);
  else if (i === 47 || An(i)) {
    let s = e.src.slice(r).match(_n);
    a = s ? r + s[0].length : -1;
  } else return !1;
  if (a < 0) return !1;
  if (!t) {
    let s = e.push("html_inline", "", 0);
    s.content = e.src.slice(r, a), gi(s.content) && e.linkLevel++, bi(s.content) && e.linkLevel--;
  }
  return e.pos = a, !0;
}
var zi = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i, xi = /^&([a-z][a-z0-9]{1,31});/i;
function qi(e, t) {
  let n = e.pos, r = e.posMax;
  if (e.src.charCodeAt(n) !== 38 || n + 1 >= r) return !1;
  if (e.src.charCodeAt(n + 1) === 35) {
    let a = e.src.slice(n).match(zi);
    if (a) {
      if (!t) {
        let i = a[1][0].toLowerCase() === "x" ? parseInt(a[1].slice(1), 16) : parseInt(a[1], 10), s = e.push("text_special", "", 0);
        s.content = bt(i) ? Te(i) : Te(65533), s.markup = a[0], s.info = "entity";
      }
      return e.pos += a[0].length, !0;
    }
  } else {
    let a = e.src.slice(n).match(xi);
    if (a) {
      let i = mn(a[0]);
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
function Wt(e) {
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
    let l = t[o.marker][(o.open ? 3 : 0) + o.length % 3], c = r - i[r] - 1, p = c;
    for (; c > l; c -= i[c] + 1) {
      let h = e[c];
      if (h.marker === o.marker && h.open && h.end < 0) {
        let g = !1;
        if ((h.close || o.open) && (h.length + o.length) % 3 == 0 && (h.length % 3 != 0 || o.length % 3 != 0) && (g = !0), !g) {
          let f = c > 0 && !e[c - 1].open ? i[c - 1] + 1 : 0;
          i[s] = s - c + f, i[c] = f, o.open = !1, h.end = s, h.close = !1, p = -1, a = -2;
          break;
        }
      }
    }
    p !== -1 && (t[o.marker][(o.open ? 3 : 0) + (o.length || 0) % 3] = p);
  }
}
function wi(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  Wt(e.delimiters);
  for (let a = 0; a < n; a++) {
    var r;
    let i = (r = t[a]) == null ? void 0 : r.delimiters;
    i && Wt(i);
  }
}
function _i(e) {
  let t, n, r = 0, a = e.tokens, i = e.tokens.length;
  for (t = n = 0; t < i; t++) a[t].nesting < 0 && r--, a[t].level = r, a[t].nesting > 0 && r++, a[t].type === "text" && t + 1 < i && a[t + 1].type === "text" ? a[t + 1].content = a[t].content + a[t + 1].content : (t !== n && (a[n] = a[t]), n++);
  t !== n && (a.length = n);
}
var et = [
  ["text", Qa],
  ["linkify", ni],
  ["newline", ri],
  ["escape", ai],
  ["backticks", si],
  ["strikethrough", Cn.tokenize],
  ["emphasis", Dn.tokenize],
  ["link", di],
  ["image", hi],
  ["autolink", mi],
  ["html_inline", ki],
  ["entity", qi]
], tt = [
  ["balance_pairs", wi],
  ["strikethrough", Cn.postProcess],
  ["emphasis", Dn.postProcess],
  ["fragments_join", _i]
], Fn = class {
  constructor() {
    C(this, "ruler", new je()), C(this, "ruler2", new je()), C(this, "State", yn);
    for (let e = 0; e < et.length; e++) this.ruler.push(et[e][0], et[e][1]);
    for (let e = 0; e < tt.length; e++) this.ruler2.push(tt[e][0], tt[e][1]);
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
}, Ri = class {
  constructor(e = {}) {
    C(this, "src_Any", cn.source), C(this, "src_Cc", un.source), C(this, "src_Z", hn.source), C(this, "src_P", gt.source), C(this, "src_ZPCc", [
      this.src_Z,
      this.src_P,
      this.src_Cc
    ].join("|")), C(this, "src_ZCc", [this.src_Z, this.src_Cc].join("|")), C(this, "cache", {}), C(this, "opts", {
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
}, nt = {
  validate: (e, t, n) => {
    let r = n.re.get_http_validator();
    r.lastIndex = t;
    let a = r.exec(e);
    return a ? a[0].length : 0;
  },
  normalize: (e, t) => t.normalize(e)
}, yi = {
  "http:": nt,
  "https:": nt,
  "ftp:": nt,
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
}, Ci = "a:cdefgilmnoqrstuwxz|b:abdefghijmnorstvwyz|c:acdfghiklmnoruvwxyz|d:ejkmoz|e:cegrstu|f:ijkmor|g:abdefghilmnpqrstuwy|h:kmnrtu|i:delmnoqrst|j:emop|k:eghimnprwyz|l:abcikrstuvy|m:acdeghklmnopqrstuvwxyz|n:acefgilopruz|o:m|p:aefghklmnrstwy|q:a|r:eosuw|s:abcdeghijklmnortuvxyz|t:cdfghjklmnortvwz|u:agksyz|v:aceginu|w:fs|y:et|z:amw", Di = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф";
function Ai() {
  let e = Di.split("|");
  return Ci.split("|").forEach((t) => {
    let n = t.indexOf(":"), r = t.slice(0, n);
    for (let a of t.slice(n + 1)) e.push(r + a);
  }), e;
}
var Fi = {
  fuzzyLink: !1,
  fuzzyEmail: !0,
  fuzzyIP: !1,
  "---": !1,
  tlds: Ai(),
  urlAuth: !1,
  maxLength: 1e4
}, Ut = class {
  constructor(e, t, n, r) {
    C(this, "schema", void 0), C(this, "index", void 0), C(this, "lastIndex", void 0), C(this, "raw", void 0), C(this, "text", void 0), C(this, "url", void 0);
    let a = e.slice(n, r);
    this.schema = t.toLowerCase(), this.index = n, this.lastIndex = r, this.raw = a, this.text = a, this.url = a;
  }
}, Ni = class {
  constructor(e = {}) {
    C(this, "__opts__", void 0), C(this, "__schemas__", void 0), C(this, "re", void 0);
    let { rebuilder: t, ...n } = e;
    this.__opts__ = {
      ...Fi,
      ...n
    }, this.__schemas__ = { ...yi }, this.re = t || new Ri(), this.re.set({
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
    let t = [], n = this.re.get_schema_search(), r, a, i, s, o, l, c = !1, p = !1, h = !1, g = 0;
    if (!e.length) return null;
    for (n.lastIndex = 0, this.__opts__.fuzzyLink && this.__schemas__["http:"] && (r = this.re.get_fuzzy_link_search(), r.lastIndex = 0), this.__opts__.fuzzyEmail && this.__schemas__["mailto:"] && (a = this.re.get_fuzzy_mail_host_search(), a.lastIndex = 0, i = this.re.get_mail_name_validator()); ; ) {
      let f = Math.max(g - 1, 0);
      if (a && i && !h && (!o || o.index < g)) for (a.lastIndex < f && (a.lastIndex = f); ; ) {
        let v = a.exec(e);
        if (!v) {
          h = !0, o = void 0;
          break;
        }
        let w = i.exec(e.slice(Math.max(0, v.index - 65), v.index));
        if (w) {
          if (o = {
            schema: "mailto:",
            index: v.index - w[1].length,
            lastIndex: v.index + v[0].length
          }, o.index >= g) break;
          a.lastIndex < f && (a.lastIndex = f);
        }
      }
      if (r && !p && (!s || s.index < g)) for (r.lastIndex < f && (r.lastIndex = f); ; ) {
        let v = r.exec(e);
        if (!v) {
          p = !0, s = void 0;
          break;
        }
        if (s = {
          schema: "",
          index: v.index + v[1].length,
          lastIndex: v.index + v[0].length
        }, s.index >= g) break;
        r.lastIndex < f && (r.lastIndex = f);
      }
      let d = o;
      (!d || s && (s.index < d.index || s.index === d.index && s.lastIndex > d.lastIndex)) && (d = s);
      let R;
      if (!c) for (; ; ) {
        if (!l) {
          n.lastIndex < f && (n.lastIndex = f);
          let x = n.exec(e);
          if (!x) {
            c = !0;
            break;
          }
          l = {
            schema: x[2],
            index: x.index + x[1].length,
            lastIndex: x.index + x[0].length
          };
        }
        if (l.index < g) {
          l = void 0;
          continue;
        }
        if (d && l.index > d.index) break;
        let v = l;
        l = void 0;
        let w = this.testSchemaAt(e, v.schema, v.lastIndex);
        if (w) {
          R = {
            schema: v.schema,
            index: v.index,
            lastIndex: v.lastIndex + w
          };
          break;
        }
      }
      let q = R;
      if ((!q || o && (o.index < q.index || o.index === q.index && o.lastIndex > q.lastIndex)) && (q = o), (!q || s && (s.index < q.index || s.index === q.index && s.lastIndex > q.lastIndex)) && (q = s), !q) break;
      q === o ? o = void 0 : q === s && (s = void 0);
      let z = new Ut(e, q.schema, q.index, q.lastIndex);
      z.schema ? this.__schemas__[z.schema].normalize(z, this) : this.normalize(z), t.push(z), g = q.lastIndex;
    }
    return t.length ? t : null;
  }
  matchAtStart(e) {
    if (!e.length) return null;
    let t = this.re.get_schema_at_start().exec(e);
    if (!t) return null;
    let n = this.testSchemaAt(e, t[2], t[0].length);
    if (!n) return null;
    let r = new Ut(e, t[2], t.index + t[1].length, t.index + t[0].length + n);
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
}, ye = 2147483647, ge = 36, Nn = 1, Ue = 26, Ei = 38, Bi = 700, En = 72, Bn = 128, Tn = "-", Ti = /^xn--/, Si = /[^\0-\x7F]/, Ii = /[\x2E\u3002\uFF0E\uFF61]/g, Mi = {
  overflow: "Overflow: input needs wider integers to process",
  "not-basic": "Illegal input >= 0x80 (not a basic code point)",
  "invalid-input": "Invalid input"
}, ji = 35, de = Math.floor, rt = String.fromCharCode;
function ve(e) {
  throw RangeError(Mi[e]);
}
function $i(e, t) {
  let n = [], r = e.length;
  for (; r--; ) n[r] = t(e[r]);
  return n;
}
function Pt(e, t) {
  let n = e.split("@"), r = "";
  n.length > 1 && (r = n[0] + "@", e = n[1]), e = e.replace(Ii, ".");
  let a = $i(e.split("."), t).join(".");
  return r + a;
}
function Sn(e) {
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
var Ji = (e) => String.fromCodePoint(...e), Li = function(e) {
  return e >= 48 && e < 58 ? 26 + (e - 48) : e >= 65 && e < 91 ? e - 65 : e >= 97 && e < 123 ? e - 97 : ge;
}, Zt = function(e, t) {
  return e + 22 + 75 * (e < 26) - ((t != 0) << 5);
}, In = function(e, t, n) {
  let r = 0;
  for (e = n ? de(e / Bi) : e >> 1, e += de(e / t); e > 455; r += ge) e = de(e / ji);
  return de(r + 36 * e / (e + Ei));
}, Xt = function(e) {
  let t = [], n = e.length, r = 0, a = Bn, i = En, s = e.lastIndexOf(Tn);
  s < 0 && (s = 0);
  for (let o = 0; o < s; ++o) e.charCodeAt(o) >= 128 && ve("not-basic"), t.push(e.charCodeAt(o));
  for (let o = s > 0 ? s + 1 : 0; o < n; ) {
    let l = r;
    for (let p = 1, h = ge; ; h += ge) {
      o >= n && ve("invalid-input");
      let g = Li(e.charCodeAt(o++));
      g >= ge && ve("invalid-input"), g > de((ye - r) / p) && ve("overflow"), r += g * p;
      let f = h <= i ? Nn : h >= i + Ue ? Ue : h - i;
      if (g < f) break;
      let d = ge - f;
      p > de(ye / d) && ve("overflow"), p *= d;
    }
    let c = t.length + 1;
    i = In(r - l, c, l == 0), de(r / c) > ye - a && ve("overflow"), a += de(r / c), r %= c, t.splice(r++, 0, a);
  }
  return String.fromCodePoint(...t);
}, Yt = function(e) {
  let t = [];
  e = Sn(e);
  let n = e.length, r = Bn, a = 0, i = En;
  for (let l of e) l < 128 && t.push(rt(l));
  let s = t.length, o = s;
  for (s && t.push(Tn); o < n; ) {
    let l = ye;
    for (let p of e) p >= r && p < l && (l = p);
    let c = o + 1;
    l - r > de((ye - a) / c) && ve("overflow"), a += (l - r) * c, r = l;
    for (let p of e) if (p < r && ++a > ye && ve("overflow"), p === r) {
      let h = a;
      for (let g = ge; ; g += ge) {
        let f = g <= i ? Nn : g >= i + Ue ? Ue : g - i;
        if (h < f) break;
        let d = h - f, R = ge - f;
        t.push(rt(Zt(f + d % R, 0))), h = de(d / R);
      }
      t.push(rt(Zt(h, 0))), i = In(a, c, o === s), a = 0, ++o;
    }
    ++a, ++r;
  }
  return t.join("");
}, Kt = {
  version: "2.3.1",
  ucs2: {
    decode: Sn,
    encode: Ji
  },
  decode: Xt,
  encode: Yt,
  toASCII: function(e) {
    return Pt(e, function(t) {
      return Si.test(t) ? "xn--" + Yt(t) : t;
    });
  },
  toUnicode: function(e) {
    return Pt(e, function(t) {
      return Ti.test(t) ? Xt(t.slice(4).toLowerCase()) : t;
    });
  }
}, Oi = {
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
}, Wi = /^(vbscript|javascript|file|data):/, Ui = /^data:image\/(gif|png|jpeg|webp);/, Ht = [
  "http:",
  "https:",
  "mailto:"
], ue = class {
  validateLink(e) {
    let t = e.trim().toLowerCase();
    return !Wi.test(t) || Ui.test(t);
  }
  normalizeLink(e) {
    let t = ct(e, !0);
    if (t.hostname && (!t.protocol || Ht.indexOf(t.protocol) >= 0)) try {
      t.hostname = Kt.toASCII(t.hostname);
    } catch {
    }
    return t.auth && (t.auth = me(t.auth)), t.hostname && (t.hostname = me(t.hostname)), t.pathname && (t.pathname = me(t.pathname)), t.search && (t.search = me(t.search)), t.hash && (t.hash = me(t.hash)), lt(t);
  }
  normalizeLinkText(e) {
    let t = ct(e, !0);
    if (t.hostname && (!t.protocol || Ht.indexOf(t.protocol) >= 0)) try {
      t.hostname = Kt.toUnicode(t.hostname);
    } catch {
    }
    return De(lt(t), De.defaultChars + "%");
  }
  constructor(...e) {
    C(this, "inline", new Fn()), C(this, "block", new Rn()), C(this, "core", new qn()), C(this, "renderer", new kn()), C(this, "linkify", new Ni()), C(this, "utils", Kr), C(this, "helpers", Object.assign({}, da));
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
      if (t = Oi[a], !t) throw Error(`Wrong 'markdown-it' preset "${a}", check name`);
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
C(ue, "Token", qe), C(ue, "Ruler", je), C(ue, "Renderer", kn), C(ue, "ParserCore", qn), C(ue, "StateCore", zn), C(ue, "ParserBlock", Rn), C(ue, "StateBlock", wn), C(ue, "ParserInline", Fn), C(ue, "StateInline", yn);
var Pi = gn(ue);
function Zi(e) {
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
    if (!l || l.split("/").some((p) => !p || p === "." || p === "..")) return null;
    if (o) return t.get(l) ?? null;
    const c = r.get(l);
    return c === void 0 ? n.get(l) ?? null : c;
  };
}
const Xi = /^\[\[([^\[\]\r\n]{1,256})\]\]/;
function Yi(e) {
  e.inline.ruler.after("image", "wikilink", (t, n) => {
    if (n || t.linkLevel || !t.src.startsWith("[[", t.pos)) return !1;
    const r = Xi.exec(t.src.slice(t.pos, Math.min(t.posMax, t.pos + 260)));
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
const we = new Pi({ html: !1 });
Yi(we);
we.validateLink = (e) => /^(https?:\/\/|mailto:)/i.test(e);
we.renderer.rules.image = (e, t) => `<span class="qz-note-image">[image: ${we.utils.escapeHtml(e[t].content || "image")}]</span>`;
we.renderer.rules.link_open = (e, t, n, r, a) => (e[t].attrSet("target", "_blank"), e[t].attrSet("rel", "noopener noreferrer nofollow"), a.renderToken(e, t, n));
function Ki(e, t) {
  const n = { resolveWikilink: t }, r = /^---[ \t]*\n/.exec(e);
  if (!r) return we.render(e, n);
  const a = /^---[ \t]*(?:\n|$)/gm;
  return a.lastIndex = r[0].length, we.render(a.test(e) ? e.slice(a.lastIndex) : e, n);
}
function Hi(e) {
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
function at(e) {
  const t = e.content.startsWith("\uFEFF") ? "\uFEFF" : "", n = e.content.slice(t.length), r = n.replace(/\r\n/g, ""), a = r.length !== n.length, i = r.includes("\r") || a && r.includes(`
`) ? "mixed" : a ? `\r
` : `
`;
  return { source: e, text: n.replace(/\r\n?/g, `
`), bom: t, lineEnding: i };
}
function Gt(e) {
  return e.lineEnding === "mixed" ? e.source.content : e.bom + (e.lineEnding === `\r
` ? e.text.replace(/\n/g, `\r
`) : e.text);
}
const Gi = ".qz-notes-layout{display:grid;grid-template-columns:minmax(190px,1fr) minmax(0,3fr);gap:14px;align-items:start}.qz-note-browser,.qz-note-editor,.qz-note-create{display:grid;gap:12px;padding:14px}.qz-note-browser{max-height:72vh;overflow:auto}.qz-note-create{grid-template-columns:minmax(0,1fr) auto;align-items:end}.qz-note-create .qz-error{grid-column:1 / -1}.qz-note-tree{display:grid;gap:3px;padding:0;list-style:none}.qz-note-tree .qz-note-tree{margin-inline-start:10px}.qz-note-tree :is(summary,button){width:100%;min-height:32px;padding:5px 7px;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--qz-text);text-align:start;overflow-wrap:anywhere;cursor:pointer}.qz-note-tree button{display:flex;align-items:center;gap:7px}.qz-note-tree summary .qz-icon{vertical-align:text-bottom;margin-inline:3px 6px}.qz-note-tree :is(summary,button):hover{background:var(--qz-elevated)}.qz-note-tree button[aria-current=true]{border-color:color-mix(in srgb,var(--qz-accent) 26%,var(--qz-border));background:var(--qz-accent-soft)}.qz-note-editor .qz-path{flex:1 1 15ch}.qz-note-text{min-height:360px;resize:vertical;font:400 13px/1.55 var(--mono, ui-monospace, monospace)}.qz-note-message{font-size:12px}.qz-note-message:empty{display:none}.qz-notes-rendered{min-width:0;min-height:360px;padding:4px;overflow-wrap:anywhere}.qz-notes-rendered :is(p,ul,ol,pre,blockquote,table,h1,h2,h3,h4,h5,h6){margin:0 0 .9em}.qz-notes-rendered :is(ul,ol){padding-inline-start:1.5em}.qz-notes-rendered :is(pre,blockquote){padding:10px;border:1px solid var(--qz-border);border-radius:6px;background:var(--qz-elevated)}.qz-notes-rendered pre{overflow-x:auto}.qz-notes-rendered table{display:block;border-collapse:collapse;overflow-x:auto}.qz-notes-rendered :is(th,td){padding:5px 8px;border:1px solid var(--qz-border)}.qz-notes-rendered a{color:var(--qz-accent)}.qz-wikilink{max-width:100%;padding:0;border:0;background:transparent;color:var(--qz-accent);font:inherit;text-align:start;text-decoration:underline;overflow-wrap:anywhere;cursor:pointer}.qz-note-backlinks{border-top:1px solid var(--qz-border);padding-top:12px}.qz-note-backlinks h3{margin:0 0 6px;font-size:14px}.qz-note-backlinks ul{display:grid;gap:4px;margin:0;padding-inline-start:1.25em}.qz-note-image{color:var(--qz-muted)}@container qz-app (max-width: 680px){.qz-notes-layout,.qz-note-create{grid-template-columns:minmax(0,1fr)}.qz-note-browser{max-height:35vh}}", Vi = 3e3, Ee = 500, it = [];
function Qi(e) {
  return `${e.workspaceId}:${e.path}`;
}
function es(e, t, n) {
  const r = tn(), [a, i] = D(null), [s, o] = D(null), [l, c] = D(null), [p, h] = D(0);
  X(() => {
    if (!t || !r) return;
    let f = !1, d, R, q;
    const z = async () => {
      try {
        const v = await re(Pe(e));
        if (f) return;
        const w = v.workspaces.filter((b) => b.workspace.companion), x = JSON.stringify(w);
        q !== x && (i(w), q = x);
        const _ = w.find((b) => b.workspace.id === n) ?? w[0];
        if (!v.available) throw new Error(v.error ?? "The Markdown index is unavailable.");
        if (_) {
          const b = `${_.workspace.id}:${_.index.indexedAt ?? ""}`;
          if (b !== R) {
            const F = await re(er(e, _.workspace.id));
            if (f) return;
            o({ workspaceId: _.workspace.id, notes: F.notes }), R = b;
          }
        } else
          o(null);
        c(null);
      } catch (v) {
        f || c(ne(v));
      } finally {
        f || (d = setTimeout(z, Vi));
      }
    };
    return z(), () => {
      f = !0, clearTimeout(d);
    };
  }, [t, e, p, r, n]);
  const g = (a == null ? void 0 : a.find((f) => f.workspace.id === n)) ?? (a == null ? void 0 : a[0]);
  return {
    current: g,
    failure: l,
    workspaces: a,
    notes: g && (s == null ? void 0 : s.workspaceId) === g.workspace.id ? s.notes : null,
    refresh: () => h((f) => f + 1),
    visible: r
  };
}
function ts({ api: e, active: t, request: n, onSettings: r }) {
  var Fe;
  const [a, i] = D(null), [s, o] = D(null), [l, c] = D(() => /* @__PURE__ */ new Map()), [p, h] = D(""), [g, f] = D(Ee), [d, R] = D(!1), [q, z] = D(""), [v, w] = D(null), [x, _] = D(!1), b = K(!1), { workspaces: F, current: k, notes: y, failure: E, refresh: B, visible: N } = es(e, t, a), T = K(null), $ = Ln(p.trim().toLowerCase()), I = Ce(() => $ ? (y ?? it).filter((M) => M.title.toLowerCase().includes($) || M.path.toLowerCase().includes($)) : y ?? it, [y, $]), ee = Ce(() => Hi(I.slice(0, g)), [I, g]);
  if (X(() => {
    n && (i(n.workspaceId), o(n), h(""), f(Ee), R(!1));
  }, [n]), X(() => {
    var M;
    d && ((M = T.current) == null || M.focus());
  }, [d]), !F) return E ? /* @__PURE__ */ u(Z, { failure: E }) : /* @__PURE__ */ u("p", { className: "qz-empty", role: "status", children: "Loading folders…" });
  if (!k) return /* @__PURE__ */ m("div", { className: "qz-stack", children: [
    /* @__PURE__ */ u(Z, { failure: E }),
    /* @__PURE__ */ m("div", { className: "qz-empty", children: [
      /* @__PURE__ */ u("span", { className: "qz-empty-icon", children: /* @__PURE__ */ u(j, { name: "folder" }) }),
      /* @__PURE__ */ u("h2", { children: "Connect a notes folder" }),
      /* @__PURE__ */ u("p", { children: "Add a folder of Markdown files in Settings to browse and edit your notes." }),
      /* @__PURE__ */ u("button", { type: "button", className: "qz-button", "data-variant": "primary", onClick: r, children: "Open Settings" })
    ] })
  ] });
  const O = k.workspace.id, U = (s == null ? void 0 : s.workspaceId) === O ? s : null, oe = U ? Qi(U) : "", ke = (M) => o({ workspaceId: O, path: M }), S = (Fe = k.index.writeBlocked) == null ? void 0 : Fe.message, W = ft(k.index), ae = (M, he) => {
    c((pe) => {
      if (he !== void 0 && (pe.get(oe) ?? null) !== he) return pe;
      const A = new Map(pe);
      return M ? A.set(oe, M) : A.delete(oe), A;
    });
  }, Re = async () => {
    const M = q.trim();
    if (!(!M || b.current || S)) {
      b.current = !0, _(!0), w(null);
      try {
        const he = await re(nr(e, O, M));
        z(""), R(!1), o((pe) => pe === s ? { workspaceId: O, path: he.path } : pe), B();
      } catch (he) {
        w(ne(he));
      } finally {
        b.current = !1, _(!1);
      }
    }
  };
  return /* @__PURE__ */ m("section", { className: "qz-stack", "aria-label": "Notes", children: [
    /* @__PURE__ */ u("style", { children: Gi }),
    /* @__PURE__ */ m("div", { className: "qz-view-heading", children: [
      /* @__PURE__ */ m("div", { children: [
        /* @__PURE__ */ u("h2", { className: "qz-section-title", children: "Notes" }),
        /* @__PURE__ */ u("p", { className: "qz-section-description", children: "Browse and edit the Markdown files behind your tasks and TODOs." })
      ] }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ m("label", { className: "qz-inline-field", children: [
          /* @__PURE__ */ u(j, { name: "folder" }),
          /* @__PURE__ */ u("span", { children: "Notes folder" }),
          /* @__PURE__ */ u("select", { className: "qz-input", value: O, disabled: x, onChange: (M) => {
            i(Number(M.target.value)), o(null), h(""), f(Ee), R(!1);
          }, children: F.map(({ workspace: M }) => /* @__PURE__ */ u("option", { value: M.id, children: M.name }, M.id)) })
        ] }),
        /* @__PURE__ */ m(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "primary",
            "aria-expanded": d,
            onClick: () => {
              R((M) => !M), w(null);
            },
            disabled: x || !!S,
            children: [
              /* @__PURE__ */ u(j, { name: "plus" }),
              "New note"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ u(Z, { failure: E }),
    W && /* @__PURE__ */ u("div", { className: "qz-notice", role: "note", children: W }),
    d && /* @__PURE__ */ m("form", { className: "qz-note-create qz-panel-surface", onSubmit: (M) => {
      M.preventDefault(), Re();
    }, children: [
      /* @__PURE__ */ m("label", { className: "qz-field", children: [
        "Note path",
        /* @__PURE__ */ u(
          "input",
          {
            ref: T,
            className: "qz-input",
            value: q,
            placeholder: "projects/launch.md",
            disabled: x,
            onChange: (M) => z(M.target.value),
            required: !0
          }
        )
      ] }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ u("button", { type: "submit", className: "qz-button", "data-variant": "primary", disabled: !q.trim() || x || !!S, children: "Create note" }),
        /* @__PURE__ */ u("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: x, onClick: () => R(!1), children: "Cancel" })
      ] }),
      /* @__PURE__ */ u(Z, { failure: v })
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
              value: p,
              placeholder: "Title or path",
              onChange: (M) => {
                h(M.target.value), f(Ee);
              }
            }
          )
        ] }),
        y === null && !E && /* @__PURE__ */ u("p", { role: "status", className: "qz-muted", children: "Loading notes…" }),
        y !== null && I.length === 0 && /* @__PURE__ */ u("p", { className: "qz-muted", children: $ ? "No notes match your search." : k.index.state === "scanning" ? "Indexing notes…" : "No notes in this folder yet." }),
        I.length > 0 && /* @__PURE__ */ u(
          Mn,
          {
            branch: ee,
            prefix: "",
            selected: U == null ? void 0 : U.path,
            query: $,
            onOpen: ke
          }
        ),
        I.length > g && /* @__PURE__ */ u(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            onClick: () => f((M) => M + Ee),
            children: "Show more notes"
          }
        )
      ] }),
      U ? /* @__PURE__ */ u(
        ns,
        {
          api: e,
          active: t,
          location: U,
          draft: l.get(oe),
          onDraft: ae,
          onSaved: B,
          writeBlocked: !!S,
          notes: y ?? it,
          onOpen: ke,
          loadBacklinks: t && N,
          indexRevision: k.index.indexedAt
        },
        oe
      ) : /* @__PURE__ */ m("div", { className: "qz-empty", children: [
        /* @__PURE__ */ u("span", { className: "qz-empty-icon", children: /* @__PURE__ */ u(j, { name: "note" }) }),
        /* @__PURE__ */ u("h3", { children: "Open a note" }),
        /* @__PURE__ */ u("p", { children: "Choose one from the folder tree or create a new note." })
      ] })
    ] })
  ] });
}
function Mn({ branch: e, prefix: t, selected: n, query: r, onOpen: a }) {
  return /* @__PURE__ */ m("ul", { className: "qz-note-tree", children: [
    [...e.folders].map(([i, s]) => {
      const o = `${t}${i}/`;
      return /* @__PURE__ */ u("li", { children: /* @__PURE__ */ m("details", { open: r || n != null && n.startsWith(o) ? !0 : void 0, children: [
        /* @__PURE__ */ m("summary", { children: [
          /* @__PURE__ */ u(j, { name: "folder" }),
          i
        ] }),
        /* @__PURE__ */ u(Mn, { branch: s, prefix: o, selected: n, query: r, onOpen: a })
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
          /* @__PURE__ */ u(j, { name: "note" }),
          i.title
        ]
      }
    ) }, i.path))
  ] });
}
function ns({ api: e, active: t, location: n, draft: r, onDraft: a, onSaved: i, writeBlocked: s, notes: o, onOpen: l, loadBacklinks: c, indexRevision: p }) {
  const { workspaceId: h, path: g } = n, [f, d] = D(null), [R, q] = D(!1), [z, v] = D(""), [w, x] = D(null), [_, b] = D(!1), [F, k] = D(!1), [y, E] = D(null), [B, N] = D(null), T = K(!1), $ = !!r, I = r ?? f, ee = I == null ? void 0 : I.text, O = Ce(() => Zi(o), [o]), U = Ce(
    () => R && ee !== void 0 ? Ki(ee, O) : "",
    [R, ee, O]
  );
  X(() => {
    if (!t || $) return;
    let S = !1;
    return b(!0), x(null), re(ot(e, h, g)).then((W) => {
      S || d(at(W));
    }).catch((W) => {
      S || x(ne(W));
    }).finally(() => {
      S || b(!1);
    }), () => {
      S = !0, b(!1);
    };
  }, [t, e, $, g, h]), X(() => {
    if (!c || p == null) return;
    let S = !1;
    return re(tr(e, h, g)).then((W) => {
      S || (E(W), N(null));
    }).catch((W) => {
      S || (E(null), N(ne(W)));
    }), () => {
      S = !0;
    };
  }, [e, p, c, g, h]);
  const oe = async () => {
    if (T.current || !r || r.conflict || s || r.lineEnding === "mixed") return;
    T.current = !0, k(!0), x(null), v("");
    const S = Gt(r);
    try {
      const W = await re(rr(e, h, g, S, r.source.hash));
      d(at({ ...W, content: S })), a(null, r), v("Note saved."), i();
    } catch (W) {
      const ae = ne(W);
      ae.code === "conflict" ? a({ ...r, conflict: !0 }, r) : x(ae);
    } finally {
      T.current = !1, k(!1);
    }
  }, ke = async () => {
    if (!(T.current || r && !window.confirm("Replace your unsaved draft with the version on disk?"))) {
      T.current = !0, k(!0), x(null), v("");
      try {
        d(at(await re(ot(e, h, g)))), a(null, r ?? null), v("Note reloaded.");
      } catch (S) {
        x(ne(S));
      } finally {
        T.current = !1, k(!1);
      }
    }
  };
  return /* @__PURE__ */ m("section", { className: "qz-note-editor qz-panel-surface", "aria-label": "Note editor", children: [
    /* @__PURE__ */ m("div", { className: "qz-toolbar", children: [
      /* @__PURE__ */ u("code", { className: "qz-mono qz-path", title: g, children: g }),
      /* @__PURE__ */ m("div", { className: "qz-actions", children: [
        /* @__PURE__ */ u(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            disabled: !I,
            onClick: () => q((S) => !S),
            children: R ? "Edit Markdown" : "Preview"
          }
        ),
        /* @__PURE__ */ u(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            disabled: _ || F,
            onClick: () => void ke(),
            children: "Reload from disk"
          }
        ),
        /* @__PURE__ */ u(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "primary",
            disabled: !r || r.conflict || _ || F || s || r.lineEnding === "mixed",
            onClick: () => void oe(),
            children: "Save note"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ u(Z, { failure: w }),
    _ && !I && /* @__PURE__ */ u("p", { className: "qz-muted", role: "status", children: "Loading note…" }),
    (r == null ? void 0 : r.conflict) && /* @__PURE__ */ u("div", { className: "qz-notice", role: "alert", children: "The note changed on disk. Your draft is still here. Copy or review your changes before reloading from disk." }),
    (I == null ? void 0 : I.lineEnding) === "mixed" && /* @__PURE__ */ u("div", { className: "qz-notice", role: "note", children: "This note has mixed line endings and opens read-only to preserve them." }),
    I && (R ? /* @__PURE__ */ u(
      "div",
      {
        className: "qz-notes-rendered",
        "aria-label": "Markdown preview",
        onClick: (S) => {
          const W = S.target instanceof Element ? S.target.closest("button.qz-wikilink[data-note-path]") : null, ae = W == null ? void 0 : W.dataset.notePath;
          ae && o.some((Re) => Re.path === ae) && l(ae);
        },
        dangerouslySetInnerHTML: { __html: U || "<p>No content yet.</p>" }
      }
    ) : /* @__PURE__ */ m("label", { className: "qz-field", children: [
      "Note Markdown",
      /* @__PURE__ */ u(
        "textarea",
        {
          className: "qz-input qz-note-text",
          spellCheck: !1,
          value: I.text,
          readOnly: F || _ || s || I.lineEnding === "mixed",
          onChange: (S) => {
            const W = { ...I, text: S.target.value };
            v(""), a(!W.conflict && Gt(W) === W.source.content ? null : W);
          }
        }
      )
    ] })),
    /* @__PURE__ */ u("span", { className: "qz-muted qz-note-message", role: "status", children: z || (r ? "Unsaved changes" : "") }),
    I && (B || !!(y != null && y.notes.length)) && /* @__PURE__ */ m("section", { className: "qz-note-backlinks", "aria-label": "Backlinks", children: [
      /* @__PURE__ */ u("h3", { children: "Backlinks" }),
      /* @__PURE__ */ u(Z, { failure: B }),
      y && /* @__PURE__ */ u("ul", { children: y.notes.map((S) => /* @__PURE__ */ u("li", { children: /* @__PURE__ */ u("button", { type: "button", className: "qz-wikilink", title: S.path, onClick: () => l(S.path), children: S.title }) }, S.path)) }),
      (y == null ? void 0 : y.truncated) && /* @__PURE__ */ m("p", { className: "qz-muted", children: [
        "Only the first ",
        y.notes.length,
        " backlinks are shown."
      ] })
    ] })
  ] });
}
function rs(e, t) {
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
const as = '.qz-settings{display:grid;align-content:start;gap:20px;width:100%;max-width:1100px;min-width:0;margin-inline:auto;container:qz-settings / inline-size}.qz-settings .qz-settings-grid{display:grid;align-items:start;gap:20px}@container qz-settings (min-width: 760px){.qz-settings .qz-settings-grid{grid-template-columns:minmax(0,1fr) minmax(260px,330px)}}.qz-settings .qz-settings-folders,.qz-settings .qz-settings-add,.qz-settings .qz-settings-folder,.qz-settings .qz-settings-migration,.qz-settings .qz-settings-notice{display:grid;min-width:0;gap:12px}.qz-settings .qz-settings-add,.qz-settings .qz-settings-folder{padding:16px}.qz-settings .qz-settings-add p{margin-block-start:4px}.qz-settings .qz-settings-add .qz-input{width:100%}.qz-settings .qz-settings-add>.qz-button{justify-self:start}.qz-settings .qz-settings-heading,.qz-settings .qz-settings-folder-identity,.qz-settings .qz-settings-folder-controls,.qz-settings .qz-settings-actions,.qz-settings .qz-settings-check{display:flex;align-items:center}.qz-settings .qz-settings-heading,.qz-settings .qz-settings-folder-identity,.qz-settings .qz-settings-check{gap:10px}.qz-settings .qz-settings-heading h3,.qz-settings .qz-settings-add h3,.qz-settings .qz-settings-folder h4{margin:0;color:var(--qz-text);font-size:15px;font-weight:650}.qz-settings .qz-settings-count{padding:1px 7px;border:1px solid var(--qz-border);border-radius:999px;color:var(--qz-muted);font-size:12px;font-variant-numeric:tabular-nums}.qz-settings .qz-settings-folder-icon{display:grid;flex:none;width:36px;height:36px;place-items:center;border-radius:9px;background:var(--qz-accent-soft);color:var(--qz-accent)}.qz-settings .qz-settings-folder-identity>div{display:grid;min-width:0;gap:3px;overflow-wrap:anywhere}.qz-settings .qz-settings-folder-controls{justify-content:space-between;flex-wrap:wrap;gap:8px 12px;padding-block-start:10px;border-top:1px solid var(--qz-border)}.qz-settings .qz-settings-actions{flex-wrap:wrap;gap:4px}.qz-settings .qz-settings-check{min-height:32px;font-size:13px;cursor:pointer}.qz-settings .qz-settings-check input{flex:none;accent-color:var(--qz-accent)}.qz-settings .qz-settings-toggle{display:inline-grid;align-items:center;justify-items:start;-webkit-appearance:none;-moz-appearance:none;appearance:none;width:34px;height:20px;padding:2px;margin:0;border:1px solid var(--qz-muted);border-radius:999px;background:var(--qz-elevated);cursor:inherit}.qz-settings .qz-settings-toggle:before{width:12px;height:12px;border-radius:50%;background:var(--qz-muted);content:""}.qz-settings .qz-settings-toggle:checked{justify-items:end;border-color:var(--qz-accent);background:var(--qz-accent-soft)}.qz-settings .qz-settings-toggle:checked:before{background:var(--qz-accent)}.qz-settings .qz-settings-toggle:disabled{opacity:.6;cursor:default}@media (forced-colors: active){.qz-settings .qz-settings-toggle{display:inline-block;-webkit-appearance:auto;-moz-appearance:auto;appearance:auto;width:16px;height:16px}}.qz-settings .qz-settings-migration,.qz-settings .qz-settings-result{padding:12px;border:1px solid var(--qz-border);border-radius:9px;background:var(--qz-canvas);font-size:13px}.qz-settings .qz-settings-migration{gap:6px}.qz-settings .qz-settings-notice{gap:8px;overflow-wrap:anywhere}.qz-settings .qz-settings-migration-files{max-height:200px;margin:0;padding-inline-start:20px;overflow-y:auto;list-style:disc}.qz-settings .qz-button[data-destructive]{color:var(--qz-danger)}.qz-settings-disclosure{border-top:1px solid var(--qz-border);font-size:13px}.qz-settings-disclosure>summary{padding-block:8px;font-weight:650;cursor:pointer}.qz-column-list{display:grid;gap:8px;padding:0;list-style:none}.qz-column-row{display:flex;flex-wrap:wrap;align-items:end;gap:6px 10px}.qz-column-row .qz-field{flex:1 1 140px}.qz-column-row .qz-field>span{overflow-wrap:anywhere}.qz-column-row .qz-input,.qz-agent-prompt{width:100%}';
function Ke() {
  const [e, t] = D(!1), [n, r] = D(null);
  return { busy: e, failure: n, run: async (i) => {
    t(!0), r(null);
    try {
      return await i(), !0;
    } catch (s) {
      return r(ne(s)), !1;
    } finally {
      t(!1);
    }
  } };
}
function is(e) {
  const { api: t } = e, [n, r] = D(null), [a, i] = D(null), [s, o] = D(null), [l, c] = D(0), [p, h] = D(""), [g, f] = D(""), { busy: d, failure: R, run: q } = Ke();
  X(() => {
    let v = !1;
    return Promise.all([Wn(t), Pe(t)]).then(([w, x]) => {
      v || (r(w), o(x.writeBlocked ?? null), i(null));
    }).catch((w) => !v && i(ne(w))), () => {
      v = !0;
    };
  }, [t, l]);
  const z = async () => {
    await q(() => Un(t, p.trim(), g.trim() || void 0)) && (h(""), f(""), c((v) => v + 1));
  };
  return /* @__PURE__ */ m("div", { className: "qz-settings", children: [
    /* @__PURE__ */ u("style", { children: as }),
    /* @__PURE__ */ m("header", { children: [
      /* @__PURE__ */ u("h2", { className: "qz-section-title", children: "Settings" }),
      /* @__PURE__ */ u("p", { className: "qz-section-description", children: "Manage connected folders and board columns, or start a notes request in KiroCrew." })
    ] }),
    /* @__PURE__ */ u(Z, { failure: a }),
    /* @__PURE__ */ u(Z, { failure: s }),
    /* @__PURE__ */ m("div", { className: "qz-settings-grid", children: [
      /* @__PURE__ */ m("section", { className: "qz-settings-folders", "aria-labelledby": "qz-settings-folders", children: [
        /* @__PURE__ */ m("div", { className: "qz-settings-heading", children: [
          /* @__PURE__ */ u("h3", { id: "qz-settings-folders", children: "Connected folders" }),
          n && /* @__PURE__ */ u("span", { className: "qz-settings-count", children: n.length })
        ] }),
        !n && !a && /* @__PURE__ */ u("p", { className: "qz-muted", role: "status", children: "Loading folders…" }),
        (n == null ? void 0 : n.length) === 0 && /* @__PURE__ */ u("p", { className: "qz-empty", children: "Add a folder to see its notes, tickets, and TODOs." }),
        n == null ? void 0 : n.map((v) => /* @__PURE__ */ u(
          ss,
          {
            api: t,
            workspace: v,
            writeBlocked: s,
            onChanged: () => c((w) => w + 1),
            onColumnsSaved: (w) => r((x) => (x == null ? void 0 : x.map((_) => _.id === w.id ? { ..._, ...w } : _)) ?? null)
          },
          v.id
        ))
      ] }),
      /* @__PURE__ */ m(
        "form",
        {
          className: "qz-panel-surface qz-settings-add",
          "aria-labelledby": "qz-settings-add",
          "aria-busy": d,
          onSubmit: (v) => {
            v.preventDefault(), p.trim() && !d && z();
          },
          children: [
            /* @__PURE__ */ m("div", { children: [
              /* @__PURE__ */ u("h3", { id: "qz-settings-add", children: "Add a folder" }),
              /* @__PURE__ */ u("p", { className: "qz-muted", children: "Use any local folder of Markdown files. To use the same files in Kiro Notes, attach the folder there separately." })
            ] }),
            /* @__PURE__ */ m("label", { className: "qz-field", children: [
              "Absolute folder path",
              /* @__PURE__ */ u("input", { className: "qz-input", placeholder: "/home/you/notes", value: p, onChange: (v) => h(v.target.value) })
            ] }),
            /* @__PURE__ */ m("label", { className: "qz-field", children: [
              /* @__PURE__ */ m("span", { children: [
                "Name ",
                /* @__PURE__ */ u("span", { className: "qz-muted", children: "(optional)" })
              ] }),
              /* @__PURE__ */ u("input", { className: "qz-input", placeholder: "e.g. Project notes", value: g, onChange: (v) => f(v.target.value) })
            ] }),
            /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "primary", type: "submit", disabled: d || !p.trim(), children: "Add folder" }),
            /* @__PURE__ */ u(Z, { failure: R })
          ]
        }
      )
    ] })
  ] });
}
function ss(e) {
  const { api: t, workspace: n } = e, { busy: r, failure: a, run: i } = Ke(), [s, o] = D(null), [l, c] = D(!1);
  return X(() => {
    if (!s) return;
    const p = setTimeout(() => o(null), 3e3);
    return () => clearTimeout(p);
  }, [s]), /* @__PURE__ */ m("section", { "aria-label": n.name, className: "qz-panel-surface qz-settings-folder", children: [
    /* @__PURE__ */ m("div", { className: "qz-settings-folder-identity", children: [
      /* @__PURE__ */ u("span", { className: "qz-settings-folder-icon", children: /* @__PURE__ */ u(j, { name: "folder" }) }),
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
            onChange: () => void i(() => Xn(t, n.id, !n.companion)).then((p) => p && e.onChanged())
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
            onClick: () => void i(() => pt(t, { workspaceId: n.id, manual: !0, rebuild: !0 })).then(
              (p) => p && o("Rebuild requested.")
            ),
            disabled: r,
            children: "Rebuild index"
          }
        ),
        !l && /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "quiet", type: "button", onClick: () => c(!0), disabled: r, children: "Remove…" })
      ] })
    ] }),
    n.companion && /* @__PURE__ */ u(os, { api: t, workspace: n, onSaved: e.onColumnsSaved }),
    /* @__PURE__ */ u(ls, { workspace: n }),
    !!n.oldTasks && /* @__PURE__ */ u(cs, { api: t, workspace: n, writeBlocked: e.writeBlocked, onChanged: e.onChanged }),
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
            onClick: () => void i(() => Zn(t, n.id, !!n.oldTasks)).then((p) => p && e.onChanged()),
            disabled: r,
            children: n.oldTasks ? `Remove and delete ${n.oldTasks} task(s)` : "Remove"
          }
        ),
        /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "quiet", type: "button", onClick: () => c(!1), disabled: r, children: "Cancel" })
      ] })
    ] }),
    s && /* @__PURE__ */ u("span", { className: "qz-muted", role: "status", children: s }),
    /* @__PURE__ */ u(Z, { failure: a })
  ] });
}
function os({ api: e, workspace: t, onSaved: n }) {
  const [r, a] = D(null), [i, s] = D(""), [o, l] = D(null), [c, p] = D(""), { busy: h, failure: g, run: f } = Ke(), d = (r == null ? void 0 : r.columns) ?? t.columns, R = o ?? i.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 32), q = d.length < 20 && !!i.trim() && /^[a-z][a-z0-9_]{0,31}$/.test(R) && R !== "repair" && !d.some((b) => b.id === R), z = t.columns.some((b) => !d.some((F) => F.id === b.id)), v = (b) => {
    a({ columns: b, version: (r == null ? void 0 : r.version) ?? t.columnsVersion }), p("");
  }, w = (b, F) => {
    const k = [...d], [y] = k.splice(b, 1);
    k.splice(b + F, 0, y), v(k);
  }, x = () => f(async () => {
    if (!r) return;
    const b = await Pn(e, t.id, d, r.version);
    n(b), a(null), p("Board columns saved.");
  }), _ = JSON.stringify(d) !== JSON.stringify(t.columns);
  return /* @__PURE__ */ u(se, { children: /* @__PURE__ */ m("details", { className: "qz-settings-disclosure", children: [
    /* @__PURE__ */ u("summary", { children: "Board columns" }),
    /* @__PURE__ */ m("div", { className: "qz-stack", children: [
      /* @__PURE__ */ u("p", { className: "qz-muted", children: "Rename, reorder, add, or remove columns for this folder. The first column is the default for new tickets." }),
      /* @__PURE__ */ u("ul", { className: "qz-column-list", children: d.map((b, F) => /* @__PURE__ */ m("li", { className: "qz-column-row", children: [
        /* @__PURE__ */ m("label", { className: "qz-field", children: [
          /* @__PURE__ */ u("span", { className: "qz-mono", children: b.id }),
          /* @__PURE__ */ u(
            "input",
            {
              className: "qz-input",
              "aria-label": `Name for ${b.id}`,
              value: b.label,
              maxLength: 40,
              disabled: h,
              onChange: (k) => v(d.map((y) => y.id === b.id ? { ...y, label: k.target.value } : y))
            }
          )
        ] }),
        /* @__PURE__ */ m("div", { className: "qz-settings-actions", children: [
          /* @__PURE__ */ u("button", { className: "qz-button", type: "button", "aria-label": `Move column ${b.id} up`, disabled: h || F === 0, onClick: () => w(F, -1), children: /* @__PURE__ */ u(j, { name: "up" }) }),
          /* @__PURE__ */ u("button", { className: "qz-button", type: "button", "aria-label": `Move column ${b.id} down`, disabled: h || F === d.length - 1, onClick: () => w(F, 1), children: /* @__PURE__ */ u(j, { name: "down" }) }),
          /* @__PURE__ */ u("button", { className: "qz-button", type: "button", "aria-label": `Remove column ${b.id}`, disabled: h || d.length === 1, onClick: () => v(d.filter((k) => k.id !== b.id)), children: "Remove" })
        ] })
      ] }, b.id)) }),
      d.length < 20 && /* @__PURE__ */ m("form", { className: "qz-column-row", onSubmit: (b) => {
        b.preventDefault(), !(h || !q) && (v([...d, { id: R, label: i.trim() }]), s(""), l(null));
      }, children: [
        /* @__PURE__ */ m("label", { className: "qz-field", children: [
          "New column name",
          /* @__PURE__ */ u("input", { className: "qz-input", value: i, maxLength: 40, disabled: h, onChange: (b) => s(b.target.value) })
        ] }),
        /* @__PURE__ */ m("label", { className: "qz-field", children: [
          "New status ID",
          /* @__PURE__ */ u("input", { className: "qz-input qz-mono", value: R, maxLength: 32, disabled: h, onChange: (b) => l(b.target.value) })
        ] }),
        /* @__PURE__ */ u("button", { className: "qz-button", type: "submit", disabled: h || !q, children: "Add column" })
      ] }),
      /* @__PURE__ */ u("p", { className: "qz-muted", children: "Status IDs are saved in notes. Use a unique ID starting with a lowercase letter, followed by lowercase letters, digits, or underscores." }),
      z && /* @__PURE__ */ u("p", { className: "qz-notice", children: "Tickets in removed columns will appear in Needs repair until you move them or restore the column with the same status ID." }),
      /* @__PURE__ */ m("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "primary", type: "button", disabled: h || !_ || d.some((b) => !b.label.trim()), onClick: () => void x(), children: "Save columns" }),
        _ && /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: h, onClick: () => {
          a(null), p("");
        }, children: "Discard changes" }),
        /* @__PURE__ */ u("span", { className: "qz-muted", role: "status", children: c })
      ] }),
      /* @__PURE__ */ u(Z, { failure: g })
    ] })
  ] }) });
}
function ls({ workspace: e }) {
  const { openChat: t } = $n(), n = rs(e.path, e.columns), r = K(null), [a, i] = D(""), s = async () => {
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
          /* @__PURE__ */ u(j, { name: "external" }),
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
            /* @__PURE__ */ u(j, { name: "copy" }),
            "Copy agent prompt"
          ] }),
          /* @__PURE__ */ u("span", { className: "qz-muted", role: "status", children: a })
        ] })
      ] })
    ] }) : /* @__PURE__ */ u("p", { className: "qz-muted", children: "Turn on Show in Quartizo to ask a Bot about this folder." })
  ] });
}
function cs({ api: e, workspace: t, writeBlocked: n, onChanged: r }) {
  const [a, i] = D(null), [s, o] = D(null), [l, c] = D(!1), [p, h] = D(!1), { busy: g, failure: f, run: d } = Ke(), R = async () => {
    const z = await hr(e, t.id), v = URL.createObjectURL(new Blob([JSON.stringify(z, null, 2)], { type: "application/json" })), w = document.createElement("a");
    w.href = v, w.download = `quartizo-old-tasks-${t.id}.json`, w.click(), setTimeout(() => URL.revokeObjectURL(v), 1e3), c(!0);
  }, q = async () => {
    if (!a) return;
    const z = await dr(e, t.id, a.planHash, p);
    o(z), i(null), r();
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
      /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: g, onClick: () => void d(R), children: "Export old tasks" }),
      /* @__PURE__ */ u("button", { className: "qz-button", type: "button", disabled: g || !t.companion, onClick: () => void d(async () => {
        i(await ur(e, t.id)), o(null), h(!1);
      }), children: "Preview migration" })
    ] }),
    l && /* @__PURE__ */ u("span", { className: "qz-muted", role: "status", children: "Export downloaded." }),
    a && /* @__PURE__ */ m("div", { role: "alertdialog", "aria-label": "Confirm old task migration", className: "qz-notice qz-settings-notice", children: [
      /* @__PURE__ */ m("strong", { children: [
        "Create ",
        a.tasks.filter((z) => !z.migrated).length,
        " ticket note(s)"
      ] }),
      /* @__PURE__ */ u("p", { children: "Quartizo backs up the database tasks before writing each ticket to a new file." }),
      a.warnings.map((z, v) => /* @__PURE__ */ u("p", { children: z }, v)),
      /* @__PURE__ */ u("ul", { className: "qz-settings-migration-files", children: a.tasks.map((z) => /* @__PURE__ */ m("li", { children: [
        z.title,
        " → ",
        /* @__PURE__ */ u("code", { children: z.path }),
        " (",
        z.status,
        ")",
        z.migrated && " · already migrated",
        z.noteRef && /* @__PURE__ */ m("span", { children: [
          " · linked note: ",
          z.noteRef
        ] }),
        z.slotId && /* @__PURE__ */ m("span", { children: [
          " · session: ",
          z.slotId
        ] })
      ] }, z.uid)) }),
      a.tasks.some((z) => z.changed) && !a.complete && /* @__PURE__ */ m("label", { className: "qz-settings-check", children: [
        /* @__PURE__ */ u("input", { type: "checkbox", checked: p, onChange: (z) => h(z.target.checked), disabled: g }),
        "I reviewed the changed converted notes; keep their latest contents when resuming"
      ] }),
      /* @__PURE__ */ m("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ u("button", { className: "qz-button", "data-variant": "primary", type: "button", disabled: g || !!n || a.complete || !a.tasks.length, onClick: () => void d(q), children: a.backup ? "Resume and verify migration" : "Back up and migrate" }),
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
    /* @__PURE__ */ u(Z, { failure: f })
  ] });
}
const us = ".qz-app{--qz-canvas: var(--bg, Canvas);--qz-surface: var(--card, Canvas);--qz-elevated: var(--bg-elevated, Canvas);--qz-border: var(--border, color-mix(in srgb, CanvasText 18%, Canvas));--qz-text: var(--text-strong, CanvasText);--qz-muted: color-mix(in srgb, var(--muted, CanvasText) 87%, var(--qz-text));--qz-accent: var(--accent, LinkText);--qz-accent-soft: var(--accent-subtle, color-mix(in srgb, var(--qz-accent) 13%, transparent));--qz-ok: var(--ok, #4e9a6b);--qz-warning: var(--warn, #ad7628);--qz-danger: var(--danger, #c7465d);--qz-info: var(--info, var(--qz-accent));container:qz-app / inline-size;width:100%;max-width:1560px;min-width:0;margin-inline:auto;padding:24px clamp(16px,3%,40px) 36px;color:var(--qz-text)}.qz-app,.qz-app *{box-sizing:border-box}.qz-app [hidden]{display:none!important}.qz-app :where(h1,h2,h3,p,ul){margin:0}.qz-app :where(button,input,textarea,select){font:inherit}.qz-app :is(button,summary,input,textarea,select,.qz-board):focus-visible{outline:2px solid var(--qz-accent);outline-offset:2px}.qz-app :is(button,input,textarea,select):disabled{opacity:.55;cursor:default}.qz-app input[type=checkbox]{accent-color:var(--qz-accent)}.qz-icon{width:1rem;height:1rem;flex:none}.qz-header,.qz-brand,.qz-tabs,.qz-view-heading,.qz-toolbar,.qz-actions,.qz-inline-field{display:flex;align-items:center;min-width:0}.qz-header,.qz-view-heading,.qz-toolbar{justify-content:space-between;flex-wrap:wrap;gap:12px 20px}.qz-header{padding:0 0 20px;border-bottom:1px solid var(--qz-border)}.qz-brand{gap:12px}.qz-mark{display:grid;place-items:center;flex:none;width:46px;height:46px;border:1px solid color-mix(in srgb,var(--qz-accent) 34%,var(--qz-border));border-radius:13px;background:linear-gradient(145deg,var(--qz-accent-soft),var(--qz-surface));color:var(--qz-accent)}.qz-mark .qz-icon{width:26px;height:26px}.qz-brand h1{font-size:24px;font-weight:700;letter-spacing:-.035em;line-height:1.1}.qz-brand p{margin-top:3px;color:var(--qz-muted);font-size:12px}.qz-tabs{max-width:100%;gap:3px;padding:4px;border:1px solid var(--qz-border);border-radius:12px;background:var(--qz-surface)}.qz-tabs button{display:flex;align-items:center;justify-content:center;gap:7px;min-height:36px;padding:6px 12px;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--qz-muted);font-size:13px;font-weight:600;cursor:pointer}.qz-tabs button:hover{color:var(--qz-text);background:var(--qz-elevated)}.qz-tabs button[aria-selected=true]{border-color:color-mix(in srgb,var(--qz-accent) 25%,var(--qz-border));background:var(--qz-accent-soft);color:var(--qz-text)}.qz-tabs button[aria-selected=true] .qz-icon{color:var(--qz-accent)}.qz-content{padding-top:24px}.qz-stack{display:grid;gap:14px;min-width:0}.qz-section-title{font-size:27px;font-weight:700;letter-spacing:-.032em;line-height:1.17}.qz-section-description{margin-top:5px;color:var(--qz-muted)}.qz-muted{color:var(--qz-muted);font-weight:400}.qz-mono{font:400 12px/1.5 var(--mono, ui-monospace, monospace)}.qz-path{display:block;min-width:0;overflow:hidden;color:var(--qz-muted);text-overflow:ellipsis;white-space:nowrap}.qz-actions{gap:6px;flex-wrap:wrap}.qz-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;max-width:100%;min-height:36px;padding:5px 11px;border:1px solid var(--qz-border);border-radius:8px;background:var(--qz-surface);color:var(--qz-text);font-size:13px;font-weight:600;text-align:center;cursor:pointer}.qz-button:not(:disabled):hover{background:var(--qz-elevated);border-color:var(--border-strong, var(--qz-muted))}.qz-button[data-variant=primary]{border-color:var(--qz-accent);background:var(--qz-accent);color:var(--accent-fg, var(--qz-canvas))}.qz-button[data-variant=primary]:not(:disabled):hover{border-color:var(--accent-hover, var(--qz-accent));background:var(--accent-hover, var(--qz-accent))}.qz-button[data-variant=quiet]{border-color:transparent;background:transparent;color:var(--qz-muted)}.qz-button[data-variant=quiet]:not(:disabled):hover{color:var(--qz-text)}.qz-icon-button{min-width:36px;padding-inline:8px}.qz-input{min-width:0;max-width:100%;min-height:36px;padding:6px 9px;border:1px solid var(--qz-border);border-radius:8px;background:var(--qz-elevated);color:var(--qz-text);font-size:13px}.qz-input::placeholder{color:var(--qz-muted);opacity:1}.qz-field{display:grid;gap:5px;min-width:0;font-size:13px;font-weight:600}.qz-field .qz-input{width:100%;font-weight:400}.qz-inline-field{gap:8px;color:var(--qz-muted);font-size:13px}.qz-inline-field .qz-input{max-width:min(36ch,52%);font-weight:600}.qz-check-label{display:flex;align-items:center;gap:8px}.qz-panel-surface{min-width:0;border:1px solid var(--qz-border);border-radius:12px;background:var(--qz-surface)}.qz-notice{padding:11px 13px;border:1px solid color-mix(in srgb,var(--qz-warning) 42%,var(--qz-border));border-radius:9px;background:color-mix(in srgb,var(--qz-warning) 7%,var(--qz-surface));font-size:13px;overflow-wrap:anywhere}.qz-notice[data-variant=neutral]{border-color:var(--qz-border);background:var(--qz-surface)}.qz-notice.qz-error{border-color:color-mix(in srgb,var(--qz-danger) 53%,var(--qz-border));background:color-mix(in srgb,var(--qz-danger) 9%,var(--qz-surface))}.qz-empty{display:grid;place-items:center;gap:8px;padding:28px 16px;border:1px dashed var(--qz-border);border-radius:12px;color:var(--qz-muted);text-align:center}.qz-empty :is(h2,h3){color:var(--qz-text);font-size:17px;font-weight:650}.qz-empty .qz-button{margin-top:4px}.qz-empty-icon,.qz-note-icon{display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:9px;background:var(--qz-accent-soft);color:var(--qz-accent)}.qz-visually-hidden{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.qz-board-meta{gap:2px 12px;padding-block:2px}.qz-board-meta>.qz-actions{margin-inline-start:auto}.qz-result-count{color:var(--qz-muted);font-size:12px;font-weight:600}.qz-index{display:inline-flex;align-items:baseline;gap:7px;color:var(--qz-muted);font-size:12px}.qz-index:empty{display:none}.qz-board{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(172px,1fr);gap:10px;min-width:0;padding:2px 2px 10px;overflow-x:auto;overscroll-behavior-inline:contain}.qz-lane{--qz-status: var(--qz-muted);min-width:0;min-height:308px;padding:9px;border:1px solid color-mix(in srgb,var(--qz-status) 20%,var(--qz-border));border-radius:12px;background:linear-gradient(180deg,color-mix(in srgb,var(--qz-status) 7%,var(--qz-surface)),var(--qz-surface) 105px)}.qz-app [data-lane-status=ready]{--qz-status: var(--qz-info)}.qz-app [data-lane-status=in_progress]{--qz-status: var(--qz-accent)}.qz-app [data-lane-status=review]{--qz-status: var(--qz-warning)}.qz-app [data-lane-status=done]{--qz-status: var(--qz-ok)}.qz-app [data-lane-status=repair]{--qz-status: var(--qz-danger)}.qz-lane-heading{display:flex;align-items:center;gap:7px;padding:3px 2px 10px;font-size:13px;font-weight:650;overflow-wrap:anywhere}.qz-dot{width:8px;height:8px;flex:none;border-radius:50%;background:var(--qz-status, var(--qz-ok))}.qz-dot[data-attention=true]{background:var(--qz-warning)}.qz-count{margin-inline-start:auto;padding:1px 6px;border:1px solid var(--qz-border);border-radius:999px;color:var(--qz-muted);font-size:11px;font-variant-numeric:tabular-nums}.qz-lane-empty{padding:11px;border:1px dashed var(--qz-border);border-radius:8px;color:var(--qz-muted);font-size:12px;text-align:center}.qz-cards,.qz-todo-list{list-style:none;padding:0}.qz-cards{display:grid;gap:8px}.qz-cards li{min-width:0}.qz-cards li[draggable=true]{cursor:grab}.qz-cards li[draggable=true]:active{cursor:grabbing}.qz-ticket{border:1px solid var(--qz-border);border-radius:9px;background:var(--qz-elevated);box-shadow:var(--shadow-sm, none)}.qz-ticket:hover,.qz-ticket:focus-within{border-color:var(--border-strong, var(--qz-muted))}.qz-ticket-content{display:grid;gap:5px;padding:10px 10px 8px}.qz-note-link{display:flex;align-items:start;justify-content:space-between;gap:6px;padding:0;border:0;background:transparent;color:var(--qz-text);font-size:14px;font-weight:650;line-height:1.4;text-align:start;overflow-wrap:anywhere;cursor:pointer}.qz-note-link .qz-icon{width:13px;height:13px;margin-top:3px;color:var(--qz-muted)}.qz-note-link:hover{text-decoration:underline}.qz-ticket-progress{display:flex;align-items:center;gap:8px;margin-top:3px;color:var(--qz-muted);font-size:11px;font-variant-numeric:tabular-nums}.qz-ticket-progress progress{width:min(54px,40%);height:5px;accent-color:var(--qz-ok);border:0;border-radius:6px;overflow:hidden}.qz-ticket-progress progress::-webkit-progress-bar{background:var(--qz-border)}.qz-ticket-progress progress::-webkit-progress-value{border-radius:6px;background:var(--qz-ok)}.qz-badge{padding:2px 5px;border-radius:5px;background:color-mix(in srgb,var(--qz-warning) 17%,var(--qz-surface));font-size:11px;overflow-wrap:anywhere}.qz-ticket-footer{position:relative;padding:5px;border-top:1px solid var(--qz-border)}.qz-ticket-status{padding-inline-end:39px}.qz-ticket-status .qz-input{width:100%;min-height:32px;padding:3px 4px;border-color:transparent;background:transparent;color:var(--qz-muted)}.qz-ticket-status .qz-input:not(:disabled):hover{background:var(--qz-surface);border-color:var(--qz-border)}.qz-ticket-actions summary{position:absolute;inset-block-start:5px;inset-inline-end:5px;min-height:32px;list-style:none}.qz-ticket-actions summary::-webkit-details-marker{display:none}.qz-ticket-action-list{display:grid;gap:1px;margin-top:5px;padding-top:5px;border-top:1px solid var(--qz-border)}.qz-ticket-action-list .qz-button{justify-content:start;min-height:32px;text-align:start}.qz-ticket-action-list .qz-destructive:not(:disabled){color:var(--qz-danger)}.qz-ticket-form{display:grid;gap:12px;max-width:630px;padding:16px}.qz-ticket-form h3{font-size:17px;font-weight:650}.qz-note-preview{max-height:180px;margin:0;padding:10px;overflow:auto;background:var(--qz-canvas);white-space:pre-wrap;overflow-wrap:anywhere}.qz-todos{width:100%;max-width:1100px;margin-inline:auto}.qz-todo-filters{display:flex;flex-wrap:wrap;gap:12px;padding:12px}.qz-todo-filters .qz-field{flex:1 1 135px}.qz-todo-filters .qz-field:first-child{flex:3 1 245px}.qz-search{position:relative;display:block}.qz-search .qz-icon{position:absolute;inset-block-start:10px;inset-inline-start:9px;color:var(--qz-muted);pointer-events:none}.qz-search .qz-input{padding-inline-start:32px}.qz-todo-header{display:flex;align-items:center;gap:10px;min-width:0;padding:12px 14px}.qz-todo-identity{flex:1;min-width:0}.qz-todo-identity h3{display:flex;align-items:center;flex-wrap:wrap;gap:5px 9px;font-size:15px;font-weight:650;overflow-wrap:anywhere}.qz-todo-meta{display:flex;align-items:baseline;gap:6px;color:var(--qz-muted);font-size:12px}.qz-todo-meta>span:first-child{min-width:0;overflow-wrap:anywhere}.qz-status-pill{--qz-status: var(--qz-muted);display:inline-flex;align-items:center;gap:5px;padding:1px 7px;border-radius:999px;background:color-mix(in srgb,var(--qz-status) 13%,var(--qz-surface));font-size:11px;font-weight:500}.qz-status-pill .qz-dot{width:6px;height:6px}.qz-todo-row{display:flex;align-items:center;border-top:1px solid var(--qz-border)}.qz-todo-row:hover,.qz-todo-row:focus-within{background:var(--qz-elevated)}.qz-todo-row:last-child{border-radius:0 0 12px 12px}.qz-todo-check{display:flex;align-items:baseline;gap:10px;flex:1;min-width:0;padding:10px 14px;overflow-wrap:anywhere;cursor:pointer}.qz-todo-check input{flex:none;align-self:start;width:16px;height:16px;margin:2px 0 0}.qz-todo-check:has(input:disabled){cursor:default}.qz-todo-row[data-checked=true] .qz-todo-check span{color:var(--qz-muted);text-decoration:line-through}.qz-todo-row>.qz-button{margin-inline-end:6px}@container qz-app (max-width: 650px){.qz-board{grid-auto-columns:clamp(170px,65cqi,244px)}}@container qz-app (max-width: 520px){.qz-header{gap:14px;padding-bottom:14px}.qz-tabs{width:100%}.qz-tabs button{flex:1;gap:5px;padding-inline:5px}.qz-content{padding-top:18px}.qz-section-title{font-size:24px}.qz-inline-field{width:100%}.qz-inline-field .qz-input{flex:1;max-width:none}.qz-board-meta>.qz-actions{margin-inline-start:0}.qz-todo-filters .qz-field:first-child{flex-basis:100%}.qz-todo-header{padding-inline:10px}.qz-todo-header .qz-note-icon{display:none}}@media (pointer: coarse){.qz-app :is(.qz-button,.qz-tabs button,.qz-input,.qz-ticket-status .qz-input,.qz-ticket-actions summary){min-height:42px}}@container qz-app (max-width: 360px){.qz-tabs .qz-icon{display:none}}", be = [
  { id: "tasks", label: "Tasks", icon: "board" },
  { id: "todos", label: "TODOs", icon: "checklist" },
  { id: "notes", label: "Notes", icon: "note" },
  { id: "settings", label: "Settings", icon: "settings" }
];
function fs() {
  const e = Jn(), [t, n] = D("tasks"), [r, a] = D(null), i = K(null), s = (c) => {
    var g;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(c.key)) return;
    c.preventDefault();
    const p = be.findIndex((f) => f.id === t), h = c.key === "Home" ? be[0] : c.key === "End" ? be[be.length - 1] : be[(p + (c.key === "ArrowRight" ? 1 : be.length - 1)) % be.length];
    n(h.id), (g = c.currentTarget.querySelector(`#qz-tab-${h.id}`)) == null || g.focus();
  }, o = () => {
    var c, p;
    n("settings"), (p = (c = i.current) == null ? void 0 : c.querySelector("#qz-tab-settings")) == null || p.focus();
  }, l = (c) => {
    var p, h;
    a(c), n("notes"), (h = (p = i.current) == null ? void 0 : p.querySelector("#qz-tab-notes")) == null || h.focus();
  };
  return /* @__PURE__ */ m("div", { className: "qz-app", children: [
    /* @__PURE__ */ u("style", { children: us }),
    /* @__PURE__ */ m("header", { className: "qz-header", children: [
      /* @__PURE__ */ m("div", { className: "qz-brand", children: [
        /* @__PURE__ */ u("span", { className: "qz-mark", children: /* @__PURE__ */ u(j, { name: "gem" }) }),
        /* @__PURE__ */ m("div", { children: [
          /* @__PURE__ */ u("h1", { children: "Quartizo" }),
          /* @__PURE__ */ u("p", { children: "Notes, tasks, and TODOs" })
        ] })
      ] }),
      /* @__PURE__ */ u("div", { className: "qz-tabs", ref: i, role: "tablist", "aria-label": "Quartizo", onKeyDown: s, children: be.map((c) => /* @__PURE__ */ m(
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
            /* @__PURE__ */ u(j, { name: c.icon }),
            c.label
          ]
        },
        c.id
      )) })
    ] }),
    /* @__PURE__ */ m("div", { className: "qz-content", id: "qz-panel", role: "tabpanel", "aria-labelledby": `qz-tab-${t}`, children: [
      /* @__PURE__ */ u("div", { hidden: t !== "tasks", children: /* @__PURE__ */ u(vr, { api: e, active: t === "tasks", onSettings: o, onOpenNote: l }) }),
      t === "todos" && /* @__PURE__ */ u(qr, { api: e, onSettings: o, onOpenNote: l }),
      /* @__PURE__ */ u("div", { hidden: t !== "notes", children: /* @__PURE__ */ u(ts, { api: e, active: t === "notes", request: r, onSettings: o }) }),
      t === "settings" && /* @__PURE__ */ u(is, { api: e })
    ] })
  ] });
}
export {
  fs as default
};
