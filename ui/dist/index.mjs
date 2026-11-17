import { jsx as c, jsxs as g, Fragment as pe } from "react/jsx-runtime";
import { useNavigate as za, useChatLauncher as jr, useAppApi as Ur } from "@kirocrew/app-sdk";
import { useRef as ne, useEffect as ie, useState as F, useMemo as Fe, useCallback as Qe, useDeferredValue as Pr, useLayoutEffect as ka, useId as Jr } from "react";
import { SegmentedControl as Wr } from "@kirocrew/app-sdk/ui";
const Ue = "/apps/quartizo/api", Hr = 15e3, xa = { id: "repair", label: "Needs a column" };
function qe(e) {
  const t = e;
  if ((t == null ? void 0 : t.name) === "AppApiPermissionError")
    return { code: "permission_denied", message: "Quartizo has not declared access to this API in app.json." };
  const n = typeof (t == null ? void 0 : t.status) == "number" ? t.status : void 0;
  let a;
  if (typeof (t == null ? void 0 : t.body) == "string" && t.body)
    try {
      const o = JSON.parse(t.body);
      o && typeof o == "object" && !Array.isArray(o) && (a = o);
    } catch {
    }
  const r = typeof (a == null ? void 0 : a.code) == "string" ? a.code : void 0, i = typeof (a == null ? void 0 : a.error) == "string" ? a.error : typeof (t == null ? void 0 : t.message) == "string" ? t.message : String(e);
  return { status: n, code: r, message: i };
}
function ze(e, t = Hr) {
  let n;
  const a = new Promise((r, i) => {
    n = setTimeout(() => i(new Error(`request timed out after ${Math.round(t / 1e3)} s`)), t);
  });
  return Promise.race([e, a]).finally(() => clearTimeout(n));
}
function cn(e) {
  const t = Object.entries(e).filter((n) => n[1] !== void 0 && n[1] !== "").map(([n, a]) => `${encodeURIComponent(n)}=${encodeURIComponent(a)}`);
  return t.length ? `?${t.join("&")}` : "";
}
async function _a(e) {
  return (await e.get(`${Ue}/workspaces`)).workspaces;
}
async function Zr(e, t, n) {
  return (await e.post(`${Ue}/workspaces`, n ? { path: t, name: n, companion: !0 } : { path: t, companion: !0 })).workspace;
}
async function Kr(e, t, n, a) {
  return (await e.put(ke(t, "columns"), { columns: n, columnsVersion: a })).workspace;
}
async function Gr(e, t, n = !1) {
  await e.del(`${Ue}/workspaces/${t}${n ? "?deleteOldTasks=1" : ""}`);
}
const un = `${Ue}/companion`;
function Dt(e) {
  return e.get(un);
}
function Xr(e, t, n) {
  return e.put(`${Ue}/workspaces/${t}/companion`, { enabled: n });
}
function dn(e, t = {}) {
  const n = {};
  return t.workspaceId !== void 0 && (n.workspaceId = t.workspaceId), t.rebuild && (n.rebuild = !0), t.manual && (n.manual = !0), e.post(`${un}/refresh`, n);
}
function Yr(e, t) {
  return e.get(`${Ue}/workspaces/${t}/board`);
}
function Vr(e, t, n) {
  return e.get(`${un}/todos${cn({ workspace: n === void 0 ? void 0 : String(n), state: t })}`);
}
function Qr(e, t) {
  const n = [], a = new Map(e.map((r) => [r.id, []]));
  a.set(xa.id, n);
  for (const r of t) (a.get(r.lane) ?? n).push(r);
  return Object.fromEntries(a);
}
function hn(e) {
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
      const a = e.error && typeof e.error == "object" ? e.error.message : "the last scan failed";
      return e.state === "stale" ? `The last scan failed (${a}); showing the previous scan.` : `Indexing failed: ${a}.`;
    }
  }
  const t = [];
  return e.migrationPending && t.push("Old task migration is unfinished. Resume it in Settings before editing this workspace."), (n = e.maintenance) != null && n.length && t.push("Some columns have unfinished ordering maintenance. Resume it in Tasks before editing those tickets."), e.complete === !1 ? t.push("The last scan was incomplete (a limit was reached or a folder could not be read): notes it did not reach are shown as last indexed, and none were treated as deleted.") : e.retained && t.push(`${e.retained} note(s) could not be read and are shown as last indexed.`), e.outdated && t.push("This index was built by an older version; refresh to update it."), t.length ? t.join(" ") : null;
}
function ei(e, t = Date.now()) {
  if (!e) return "";
  if (e.state === "scanning") {
    if (!e.progress) return "Scan queued…";
    const { notes: a, rebuild: r } = e.progress;
    return `Scanning… ${a} ${a === 1 ? "note" : "notes"} read${r ? " (rebuild)" : ""}`;
  }
  if (!e.indexedAt) return "";
  const n = e.files ?? 0;
  return `${n} ${n === 1 ? "note" : "notes"} indexed ${ti(e.indexedAt, t)}`;
}
function ti(e, t) {
  const n = Math.max(0, Math.round((t - e) / 1e3));
  if (n < 5) return "just now";
  if (n < 60) return `${n} s ago`;
  const a = Math.round(n / 60);
  return a < 60 ? `${a} min ago` : new Date(e).toLocaleString();
}
function ni(e, t) {
  const n = t.trim().toLocaleLowerCase();
  if (!n) return [...e];
  const a = [];
  for (const r of e) {
    const o = `${r.title}
${r.path}`.toLocaleLowerCase().includes(n) ? r.items : r.items.filter((s) => `${s.text}
${s.heading ?? ""}`.toLocaleLowerCase().includes(n));
    o.length && a.push({ ...r, items: o });
  }
  return a;
}
function Ot(e) {
  return e.trim() || "(empty)";
}
function ke(e, t) {
  return `${Ue}/workspaces/${e}/${t}`;
}
function Qt(e, t, n) {
  return e.get(ke(t, "source") + cn({ path: n }));
}
function ai(e, t) {
  return e.get(ke(t, "notes"));
}
function ri(e, t, n) {
  return e.get(ke(t, "backlinks") + cn({ path: n }));
}
function ii(e, t, n) {
  return e.post(ke(t, "notes"), { path: n });
}
function si(e, t, n, a, r) {
  return e.put(ke(t, "source"), { path: n, content: a, expectedHash: r });
}
function oi(e, t, n) {
  return e.post(ke(t, "tickets"), n);
}
function li(e, t, n, a) {
  return e.post(ke(t, "tickets/promote"), { path: n.path, expectedHash: n.hash, ...a === void 0 ? {} : { status: a } });
}
function ci(e, t, n) {
  return e.post(ke(t, "tickets/move"), n);
}
function ui(e, t, n, a) {
  return e.post(ke(t.workspaceId, "todos/toggle"), {
    path: t.path,
    expectedHash: t.hash,
    markerStart: n.markerStart,
    line: n.line,
    column: n.column,
    checked: a
  });
}
function di(e, t, n, a = !1) {
  return e.post(ke(t, "tickets/rebalance"), { status: n, confirm: !0, reconcile: a });
}
function Be(e, t) {
  var n, a;
  return e != null && e.writeBlocked ? e.writeBlocked.message : e != null && e.migrationPending ? "Finish the old task migration in Settings before editing this workspace." : !e || e.state !== "ready" || e.complete !== !0 || e.retained || e.outdated || e.error ? "Wait for a complete, current index before editing. Refresh if needed." : t != null && t.status && ((n = e.maintenance) != null && n.includes(t.status)) ? "This column has unfinished order maintenance. Resume maintenance before moving cards." : t && (!t.hash || t.retained || (a = t.diagnostics) != null && a.some((r) => r.code !== "unconfigured_status")) ? "Repair or refresh this note before editing it." : null;
}
function hi(e, t, n, a) {
  if (!t.hash) throw new Error("Refresh this ticket before moving it.");
  const r = e.filter((u) => u.path !== t.path && u.lane === n);
  if (a !== void 0 && (!Number.isInteger(a) || a < 0 || a > r.length))
    throw new Error("The destination card changed. Refresh before moving this ticket.");
  const i = a ?? r.length, o = r[i - 1], s = r[i], l = (u) => {
    if (!u.hash || u.retained || u.diagnostics.length || !u.id || !u.order) throw new Error("Refresh or repair the destination column before moving cards.");
    return { path: u.path, hash: u.hash };
  };
  return {
    path: t.path,
    expectedHash: t.hash,
    status: n,
    ...o ? { before: l(o) } : {},
    ...s ? { after: l(s) } : {}
  };
}
function pi(e, t) {
  return e.get(ke(t, "migration"));
}
function fi(e, t, n, a = !1) {
  return e.post(ke(t, "migration"), { planHash: n, confirm: !0, ...a ? { acceptCurrent: !0 } : {} });
}
function gi(e, t) {
  return e.get(ke(t, "legacy-tasks"));
}
function mi(e, t, n) {
  return e.post(ke(t, "tickets/demote"), { path: n.path, expectedHash: n.hash });
}
const wa = "/md-notebook";
function bi(e) {
  return (e.split("/").pop() ?? e).replace(/\.md$/i, "");
}
const Bt = "#6757c7", qa = {
  headingColor: "theme",
  headingLines: "theme",
  lineColor: "theme"
};
function Ke(e) {
  return e === "accent" ? "accent" : typeof e == "string" && /^#[\da-f]{6}$/i.test(e) ? e : "theme";
}
function ya(e) {
  return e === "all" || e === "none" ? e : "theme";
}
function He(e) {
  if (e !== "theme")
    return e === "accent" ? "var(--qz-accent)" : e;
}
function Lt(e) {
  const t = e / 255;
  return t <= 0.04045 ? t / 12.92 : ((t + 0.055) / 1.055) ** 2.4;
}
function en(e, t, n) {
  return 0.2126 * Lt(e) + 0.7152 * Lt(t) + 0.0722 * Lt(n);
}
function vi(e) {
  if (!e.startsWith("#")) return;
  const t = parseInt(e.slice(1, 3), 16), n = parseInt(e.slice(3, 5), 16), a = parseInt(e.slice(5, 7), 16);
  return en(t, n, a) >= Math.sqrt(1.05 * 0.05) - 0.05 ? "#000" : "#fff";
}
const zi = {
  gem: /* @__PURE__ */ c("path", { d: "M8 4h8l4.5 5L12 21 3.5 9 8 4Zm-4.5 5h17M8 4l1 5 3 12 3-12 1-5" }),
  board: /* @__PURE__ */ g(pe, { children: [
    /* @__PURE__ */ c("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }),
    /* @__PURE__ */ c("path", { d: "M9 4v16m6-16v16M6 8h.1M12 8h.1m6 0h.1" })
  ] }),
  checklist: /* @__PURE__ */ c("path", { d: "m3 6 2 2 3-4m3 3h10M3 13l2 2 3-4m3 3h10M3 20h5m3 0h10" }),
  settings: /* @__PURE__ */ g(pe, { children: [
    /* @__PURE__ */ c("path", { d: "M4 6h7m4 0h5M4 12h3m4 0h9M4 18h11m4 0h1" }),
    /* @__PURE__ */ c("circle", { cx: "13", cy: "6", r: "2" }),
    /* @__PURE__ */ c("circle", { cx: "9", cy: "12", r: "2" }),
    /* @__PURE__ */ c("circle", { cx: "17", cy: "18", r: "2" })
  ] }),
  plus: /* @__PURE__ */ c("path", { d: "M12 5v14M5 12h14" }),
  note: /* @__PURE__ */ c("path", { d: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M8 13h8m-8 4h6" }),
  external: /* @__PURE__ */ c("path", { d: "M13 5h6v6m0-6-9 9m8-1v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" }),
  refresh: /* @__PURE__ */ c("path", { d: "M20 11a8 8 0 1 0-2.2 6.6M20 4v7h-7" }),
  folder: /* @__PURE__ */ c("path", { d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" }),
  more: /* @__PURE__ */ g(pe, { children: [
    /* @__PURE__ */ c("circle", { cx: "5", cy: "12", r: "1" }),
    /* @__PURE__ */ c("circle", { cx: "12", cy: "12", r: "1" }),
    /* @__PURE__ */ c("circle", { cx: "19", cy: "12", r: "1" })
  ] }),
  copy: /* @__PURE__ */ g(pe, { children: [
    /* @__PURE__ */ c("rect", { x: "8", y: "8", width: "12", height: "12", rx: "2" }),
    /* @__PURE__ */ c("path", { d: "M16 4H6a2 2 0 0 0-2 2v10" })
  ] }),
  search: /* @__PURE__ */ g(pe, { children: [
    /* @__PURE__ */ c("circle", { cx: "10.5", cy: "10.5", r: "5.5" }),
    /* @__PURE__ */ c("path", { d: "m15 15 5 5" })
  ] }),
  up: /* @__PURE__ */ c("path", { d: "m6 14 6-6 6 6" }),
  down: /* @__PURE__ */ c("path", { d: "m6 10 6 6 6-6" }),
  check: /* @__PURE__ */ c("path", { d: "m5 12 4 4L19 6" }),
  edit: /* @__PURE__ */ c("path", { d: "m14 6 4 4M4 20l4.7-1 11-11a2.8 2.8 0 0 0-4-4l-11 11L4 20Z" }),
  minus: /* @__PURE__ */ c("path", { d: "M5 12h14" }),
  back: /* @__PURE__ */ c("path", { d: "M19 12H5m6-6-6 6 6 6" }),
  pin: /* @__PURE__ */ c("path", { d: "m16 3 5 5-3 1-3 4v3l-2 2-3-3-5 5m5-5-4-4 2-2h3l4-3 1-3Z" })
};
function Y({ name: e }) {
  return /* @__PURE__ */ c(
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
      children: zi[e]
    }
  );
}
function de({ failure: e }) {
  const t = ne(null);
  return ie(() => {
    var n, a;
    e && ((a = (n = t.current) == null ? void 0 : n.scrollIntoView) == null || a.call(n, { block: "nearest" }));
  }, [e]), e ? /* @__PURE__ */ c("div", { ref: t, role: "alert", className: "qz-notice qz-error", "data-code": e.code, children: e.message }) : null;
}
function ki({ label: e, icon: t = "more", children: n }) {
  const [a, r] = F(!1), i = ne(null);
  return ie(() => {
    if (!a) return;
    const o = (s) => {
      var l;
      s.target instanceof Node && ((l = i.current) != null && l.contains(s.target)) || r(!1);
    };
    return document.addEventListener("mousedown", o), () => document.removeEventListener("mousedown", o);
  }, [a]), /* @__PURE__ */ g("div", { ref: i, className: "qz-menu", onKeyDown: (o) => {
    var s, l;
    o.key !== "Escape" || !a || (o.stopPropagation(), r(!1), (l = (s = i.current) == null ? void 0 : s.querySelector(".qz-menu-trigger")) == null || l.focus());
  }, children: [
    /* @__PURE__ */ c(
      "button",
      {
        type: "button",
        className: "qz-button qz-icon-button qz-menu-trigger",
        "data-variant": "quiet",
        "aria-label": e,
        title: e,
        "aria-expanded": a,
        onClick: () => r((o) => !o),
        children: /* @__PURE__ */ c(Y, { name: t })
      }
    ),
    a && /* @__PURE__ */ c("div", { className: "qz-menu-list qz-panel-surface", role: "group", "aria-label": e, children: n(() => r(!1)) })
  ] });
}
function _n(e) {
  return e instanceof Element && !!e.closest('[role="alertdialog"]');
}
function ct({ label: e, onCancel: t, className: n = "qz-notice qz-stack", children: a }) {
  const r = ne(null), i = ne(t);
  return i.current = t, ie(() => {
    var s;
    const o = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return (s = r.current) == null || s.focus(), () => {
      o != null && o.isConnected && o.focus();
    };
  }, []), /* @__PURE__ */ c(
    "div",
    {
      ref: r,
      role: "alertdialog",
      "aria-label": e,
      tabIndex: -1,
      className: n,
      onKeyDown: (o) => {
        o.key === "Escape" && (o.preventDefault(), o.stopPropagation(), i.current());
      },
      children: a
    }
  );
}
function Ra() {
  try {
    return window.localStorage;
  } catch {
    return;
  }
}
function Ea() {
  const [e, t] = F(() => typeof document > "u" || document.visibilityState !== "hidden");
  return ie(() => {
    const n = () => t(document.visibilityState !== "hidden");
    return document.addEventListener("visibilitychange", n), () => document.removeEventListener("visibilitychange", n);
  }, []), e;
}
const xi = 1500, _i = 3e3;
function Ca(e, t, n) {
  const [a, r] = F(null), [i, o] = F(null);
  return ie(() => {
    if (!t) return;
    let s = !1;
    return Dt(e).then((l) => {
      s || (r(l.workspaces.filter((u) => u.workspace.companion)), o(l.available ? null : { message: l.error ?? "The Markdown index is unavailable." }));
    }).catch((l) => !s && o(qe(l))), () => {
      s = !0;
    };
  }, [e, t, n]), { companions: a, failure: i };
}
function Na(e, t, n, a, r, i, o) {
  const s = Ea(), [l, u] = F(null), p = (l == null ? void 0 : l.key) === n ? l.data : null, [h, f] = F(null), [m, d] = F(0), [w, k] = F(!1), z = ne(r), _ = ne(i), y = ne(o);
  z.current = r, _.current = i, y.current = o, ie(() => {
    u(null), f(null);
  }, [n]), ie(() => {
    if (!t || !s) return;
    let b = !1, T, D, L;
    const J = async () => {
      let Z = !1;
      try {
        const $ = await ze(Dt(e));
        if (b) return;
        if (!$.available) throw new Error($.error ?? "The Markdown index is unavailable.");
        const j = $.workspaces.filter(({ workspace: R }) => R.companion), V = j.filter(({ workspace: R }) => a === void 0 || R.id === a), te = Object.fromEntries(V.map(({ workspace: R, index: B }) => [R.id, B]));
        Z = V.some(({ index: R }) => R.state === "scanning");
        const N = JSON.stringify(j.map(({ workspace: R, index: B }) => [R.id, R.columnsVersion, B.indexedAt])), I = JSON.stringify(te);
        if (D !== N) {
          const R = await ze(z.current());
          if (b) return;
          u({ key: n, data: R }), D = N, L = void 0;
        } else if (L !== I) {
          const R = y.current;
          u((B) => (B == null ? void 0 : B.key) === n ? { key: n, data: R(B.data, te) } : B), L = I;
        }
        f(null), k(!1);
      } catch ($) {
        b || (f(qe($)), k(!1));
      }
      b || (T = setTimeout(J, Z ? xi : _i));
    };
    return J(), () => {
      b = !0, clearTimeout(T);
    };
  }, [t, e, s, n, m, a]);
  const C = Qe(async () => {
    k(!0);
    try {
      await ze(_.current()), f(null), d((b) => b + 1);
    } catch (b) {
      f(qe(b));
    } finally {
      k(!1);
    }
  }, []), v = Qe(() => {
    k(!0), d((b) => b + 1);
  }, []);
  return { data: p, failure: h, busy: w, refresh: C, reload: v };
}
function Aa({ statuses: e }) {
  const t = Date.now(), n = e.map((a) => ei(a, t)).filter(Boolean);
  return /* @__PURE__ */ c("span", { className: "qz-index", role: "status", children: n.length > 0 && /* @__PURE__ */ g(pe, { children: [
    /* @__PURE__ */ c("span", { className: "qz-dot", "data-attention": e.some((a) => a.state === "scanning" || !!hn(a)) }),
    n.join(" · ")
  ] }) });
}
function Da({ statuses: e }) {
  const t = new Set(e.map(hn).filter(Boolean));
  return /* @__PURE__ */ c(pe, { children: [...t].map((n) => /* @__PURE__ */ c("div", { role: "note", className: "qz-notice", children: n }, n)) });
}
function Sa({ path: e, compact: t = !1 }) {
  const n = bi(e), [a, r] = F("idle");
  ie(() => {
    if (a === "idle") return;
    const o = setTimeout(() => r("idle"), 1500);
    return () => clearTimeout(o);
  }, [a]);
  const i = async () => {
    try {
      await navigator.clipboard.writeText(n), r("copied");
    } catch {
      r("failed");
    }
  };
  return /* @__PURE__ */ g(pe, { children: [
    /* @__PURE__ */ g(
      "button",
      {
        type: "button",
        className: `qz-button${t ? " qz-icon-button" : ""}`,
        "data-variant": "quiet",
        onClick: () => void i(),
        "aria-label": `Copy note name “${n}”`,
        title: `Copy note name “${n}”`,
        children: [
          /* @__PURE__ */ c(Y, { name: a === "copied" ? "check" : "copy" }),
          (!t || a !== "idle") && (a === "copied" ? "Copied" : a === "failed" ? "Copy failed" : "Copy name")
        ]
      }
    ),
    /* @__PURE__ */ c("span", { className: "qz-visually-hidden", role: "status", children: a === "copied" ? "Note name copied." : a === "failed" ? "Could not copy note name." : "" })
  ] });
}
function Ta({ onSettings: e }) {
  return /* @__PURE__ */ g("div", { className: "qz-empty", children: [
    /* @__PURE__ */ c("span", { className: "qz-empty-icon", children: /* @__PURE__ */ c(Y, { name: "folder" }) }),
    /* @__PURE__ */ c("h2", { children: "Get started with Quartizo" }),
    /* @__PURE__ */ g("ol", { className: "qz-start-checklist", children: [
      /* @__PURE__ */ c("li", { children: "Add a folder of Markdown files in Settings." }),
      /* @__PURE__ */ c("li", { children: "Create a note in Notes." }),
      /* @__PURE__ */ c("li", { children: "Create a ticket or turn your note into one in Tasks." })
    ] }),
    /* @__PURE__ */ c("button", { type: "button", className: "qz-button", "data-variant": "primary", onClick: e, children: "Open Settings" })
  ] });
}
function wi(e) {
  var i;
  const t = e.active ?? !0, { companions: n, failure: a } = Ca(e.api, t, e.workspaceId), r = (i = n == null ? void 0 : n.find((o) => o.workspace.id === e.workspaceId)) == null ? void 0 : i.workspace;
  return a && !n ? /* @__PURE__ */ c(de, { failure: a }) : n ? /* @__PURE__ */ g("div", { className: "qz-stack", children: [
    /* @__PURE__ */ c(de, { failure: a }),
    /* @__PURE__ */ c("div", { className: "qz-view-heading", children: /* @__PURE__ */ g("div", { children: [
      /* @__PURE__ */ c("h2", { className: "qz-section-title", children: "Tasks" }),
      /* @__PURE__ */ c("p", { className: "qz-section-description", children: "Plan and track tickets stored in your notes." })
    ] }) }),
    n.length === 0 && /* @__PURE__ */ c(Ta, { onSettings: e.onSettings }),
    n.length > 0 && !r && !a && /* @__PURE__ */ c("p", { className: "qz-muted qz-loading", role: "status", children: "Loading the selected folder…" }),
    n.map(({ workspace: o }) => /* @__PURE__ */ c("div", { hidden: o.id !== (r == null ? void 0 : r.id), children: /* @__PURE__ */ c(
      Ei,
      {
        api: e.api,
        workspace: o,
        active: t && o.id === (r == null ? void 0 : r.id),
        preferences: e.preferences,
        onPreferencesChange: e.onPreferencesChange,
        onSettings: e.onBoardSettings ?? e.onSettings,
        onOpenNote: e.onOpenNote
      }
    ) }, o.uid))
  ] }) : /* @__PURE__ */ c("p", { className: "qz-muted qz-loading", role: "status", children: "Loading folders…" });
}
const qi = [
  ["progress", "Checklist progress"],
  ["path", "Note path"],
  ["badges", "Ticket badges"]
];
function Fa({ preferences: e, onPreferencesChange: t, workspace: n }) {
  return /* @__PURE__ */ g("div", { className: "qz-board-view-settings", children: [
    /* @__PURE__ */ g("label", { className: "qz-field", children: [
      "Card density",
      /* @__PURE__ */ g("select", { className: "qz-input", value: e.boardDensity, onChange: (a) => t({ boardDensity: a.target.value === "compact" ? "compact" : "comfortable" }), children: [
        /* @__PURE__ */ c("option", { value: "comfortable", children: "Comfortable" }),
        /* @__PURE__ */ c("option", { value: "compact", children: "Compact" })
      ] })
    ] }),
    /* @__PURE__ */ g("fieldset", { className: "qz-board-setting-group", children: [
      /* @__PURE__ */ c("legend", { children: "Show on cards" }),
      qi.map(([a, r]) => /* @__PURE__ */ g("label", { className: "qz-check-label", children: [
        /* @__PURE__ */ c("input", { type: "checkbox", checked: e.boardFields[a], onChange: (i) => t({ boardFields: { ...e.boardFields, [a]: i.target.checked } }) }),
        r
      ] }, a))
    ] }),
    /* @__PURE__ */ g("label", { className: "qz-check-label", children: [
      /* @__PURE__ */ c("input", { type: "checkbox", checked: e.hideEmptyLanes, onChange: (a) => t({ hideEmptyLanes: a.target.checked }) }),
      "Hide empty columns"
    ] }),
    n && /* @__PURE__ */ g("fieldset", { className: "qz-board-setting-group qz-board-order-group", children: [
      /* @__PURE__ */ g("legend", { children: [
        "Column order in ",
        n.name
      ] }),
      /* @__PURE__ */ c("div", { className: "qz-board-order-fields", children: n.columns.map((a) => {
        const r = `${n.id}:${a.id}`;
        return /* @__PURE__ */ g("label", { className: "qz-field", children: [
          a.label,
          " order",
          /* @__PURE__ */ g("select", { className: "qz-input", value: e.laneSort[r] ?? "manual", onChange: (i) => {
            t({ laneSort: { [r]: i.target.value === "title" ? "title" : "manual" } });
          }, children: [
            /* @__PURE__ */ c("option", { value: "manual", children: "Manual" }),
            /* @__PURE__ */ c("option", { value: "title", children: "Title (A–Z)" })
          ] })
        ] }, a.id);
      }) }),
      /* @__PURE__ */ c("p", { className: "qz-muted", children: "Select Manual to rearrange cards within a column." })
    ] })
  ] });
}
function pn(e) {
  const [t, n] = F(!1), [a, r] = F(null), i = ne(!0), o = ne(!1);
  return ie(() => (i.current = !0, () => {
    i.current = !1;
  }), []), { pending: t, failure: a, run: async (l) => {
    if (o.current) return !1;
    o.current = !0, n(!0), r(null);
    try {
      return await ze(l()), i.current && e(), !0;
    } catch (u) {
      if (i.current) {
        const p = qe(u);
        p.status === 409 && (p.message += " Refresh to review the current file, then retry your change."), (p.message.includes("timed out") || !p.status) && (p.message += " The result may be unknown; refresh and check the file before retrying."), r(p);
      }
      return !1;
    } finally {
      o.current = !1, i.current && n(!1);
    }
  } };
}
const yi = new Intl.Collator(void 0, { numeric: !0, sensitivity: "base" });
function Ri(e) {
  return e ? { "--qz-status": e } : void 0;
}
function Ma({ name: e, appearance: t }) {
  const n = t && He(t.color);
  return /* @__PURE__ */ g("span", { className: "qz-folder-label", style: n ? { "--qz-folder-label-color": n } : void 0, children: [
    n && /* @__PURE__ */ c("span", { className: "qz-folder-label-dot", "aria-hidden": "true" }),
    (t == null ? void 0 : t.emoji) && /* @__PURE__ */ c("span", { "aria-hidden": "true", children: t.emoji }),
    e
  ] });
}
function Ei(e) {
  var Ne, oe, ae, Re, ve, _e;
  const { api: t, workspace: n, active: a, preferences: r } = e, i = n.id, o = za(), { data: s, failure: l, busy: u, refresh: p, reload: h } = Na(
    t,
    a,
    String(i),
    i,
    () => Yr(t, i),
    () => dn(t, { workspaceId: i, manual: !0 }),
    (x, q) => ({ ...x, index: q[String(i)] ?? x.index })
  ), f = pn(h), m = (s == null ? void 0 : s.workspace.columns) ?? n.columns, { laneSort: d, hideEmptyLanes: w } = r, k = Fe(() => {
    const x = Qr(m, (s == null ? void 0 : s.tickets) ?? []);
    for (const q of m)
      d[`${i}:${q.id}`] === "title" && x[q.id].sort((E, A) => yi.compare(E.title, A.title));
    return x;
  }, [m, s, d, i]), [z, _] = F(!1), [y, C] = F(!1);
  ie(() => {
    C(!1);
  }, [w]);
  const v = m.filter((x) => k[x.id].length === 0).length, b = [
    ...m.filter((x) => !w || y || k[x.id].length > 0),
    ...k.repair.length > 0 ? [xa] : []
  ], T = ne(null), D = ne(null), [L, J] = F({ start: !1, end: !1 }), Z = !!s && b.length > 0;
  ie(() => {
    const x = T.current;
    if (!x) return;
    const q = () => {
      const A = Math.abs(x.scrollLeft) > 1, S = x.scrollWidth - x.clientWidth - Math.abs(x.scrollLeft) > 1;
      J((U) => U.start === A && U.end === S ? U : { start: A, end: S });
    };
    q(), x.addEventListener("scroll", q, { passive: !0 });
    const E = typeof ResizeObserver > "u" ? null : new ResizeObserver(q);
    return E == null || E.observe(x), () => {
      x.removeEventListener("scroll", q), E == null || E.disconnect();
    };
  }, [Z, b.length]);
  const [$, j] = F(null), [V, te] = F(null), [N, I] = F(null), R = ne(null);
  ie(() => {
    var x;
    N && ((x = R.current) == null || x.focus());
  }, [N]);
  const [B, W] = F(!1), P = !a || !!l || u || f.pending || B || !!Be(s == null ? void 0 : s.index), [ee, ce] = F(""), M = ((Ne = m.find((x) => x.id === ee)) == null ? void 0 : Ne.id) ?? ((oe = s == null ? void 0 : s.index.maintenance) == null ? void 0 : oe[0]) ?? m[0].id, [H, G] = F(!1), [xe, me] = F(!1), [Oe, fe] = F(!1), be = s ? [s.index] : [], Ce = Qe((x) => {
    ce(x), fe(!0);
  }, []), [X, ue] = F(null);
  ie(() => {
    var q;
    if (!X || P || !s) return;
    const x = Array.from(((q = T.current) == null ? void 0 : q.querySelectorAll("[data-note-path]")) ?? []).find((E) => E.dataset.notePath === X);
    x == null || x.focus(), ue(null);
  }, [X, P, s]);
  const re = (x, q, E) => {
    var S;
    if (P || Be(s == null ? void 0 : s.index, x) || !s || (S = s.index.maintenance) != null && S.includes(q)) return;
    const A = d[`${i}:${q}`] === "title";
    A && x.lane === q || f.run(() => ci(t, i, hi(s.tickets, x, q, A ? void 0 : E))).then((U) => {
      U && ue(x.path);
    });
  }, De = (x, q) => {
    var S;
    const E = D.current;
    if (P || !E || q === "repair" || E.lane === q && d[`${i}:${q}`] === "title") return;
    x.preventDefault(), x.stopPropagation();
    const A = ((S = x.target.closest("li[data-ticket-path]")) == null ? void 0 : S.getAttribute("data-ticket-path")) ?? void 0;
    j((U) => (U == null ? void 0 : U.lane) === q && U.before === A ? U : { lane: q, before: A });
  }, ge = (x, q, E) => {
    x.preventDefault(), x.stopPropagation();
    const A = D.current;
    if (D.current = null, j(null), !A || (E == null ? void 0 : E.path) === A.path) return;
    const S = E && d[`${i}:${q}`] !== "title" ? k[q].filter((U) => U.path !== A.path).findIndex((U) => U.path === E.path) : void 0;
    S !== void 0 && S < 0 || re(A, q, S);
  }, K = (x) => {
    var se, Ee;
    const q = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"], E = x.target;
    if (!E.hasAttribute("data-lane")) return;
    const A = Number(E.dataset.lane), S = Number(E.dataset.index);
    if (!q.includes(x.key) || Number.isNaN(A) || Number.isNaN(S)) return;
    let U = A, Q = S;
    if (x.key === "ArrowUp" && (Q = Math.max(0, S - 1)), x.key === "ArrowDown" && (Q = S + 1), x.key === "Home" && (Q = 0), x.key === "End" && (Q = Number.MAX_SAFE_INTEGER), x.key === "ArrowLeft" || x.key === "ArrowRight") {
      const $r = x.key === "ArrowLeft" ? -1 : 1;
      do
        U += $r;
      while (U >= 0 && U < b.length && k[b[U].id].length === 0);
      if (U < 0 || U >= b.length) return;
    }
    Q = Math.min(Q, k[b[U].id].length - 1), x.preventDefault(), (Ee = (se = T.current) == null ? void 0 : se.querySelector(`[data-lane="${U}"][data-index="${Q}"]`)) == null || Ee.focus();
  };
  return /* @__PURE__ */ g("div", { className: "qz-stack", children: [
    /* @__PURE__ */ g("div", { className: "qz-toolbar", children: [
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ g(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "primary",
            "aria-expanded": N === "create",
            onClick: () => I(N === "create" ? null : "create"),
            disabled: f.pending || B,
            children: [
              /* @__PURE__ */ c(Y, { name: "plus" }),
              "New ticket"
            ]
          }
        ),
        /* @__PURE__ */ g(
          "button",
          {
            type: "button",
            className: "qz-button",
            "aria-expanded": N === "promote",
            onClick: () => I(N === "promote" ? null : "promote"),
            disabled: f.pending || B,
            children: [
              /* @__PURE__ */ c(Y, { name: "note" }),
              "Use existing note"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ g(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            "aria-expanded": z,
            "aria-controls": `qz-board-view-${i}`,
            onClick: () => _((x) => !x),
            children: [
              /* @__PURE__ */ c(Y, { name: "settings" }),
              "View"
            ]
          }
        ),
        /* @__PURE__ */ c(ki, { label: "More actions", children: (x) => /* @__PURE__ */ g(pe, { children: [
          /* @__PURE__ */ c("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => {
            x(), e.onSettings();
          }, children: "Customize columns" }),
          /* @__PURE__ */ c(
            "button",
            {
              type: "button",
              className: "qz-button",
              "data-variant": "quiet",
              disabled: P,
              onClick: () => {
                x(), fe(!0);
              },
              children: "Rebalance…"
            }
          ),
          /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => {
            x(), o(wa);
          }, children: [
            /* @__PURE__ */ c(Y, { name: "external" }),
            "Open Kiro Notes"
          ] })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ c("section", { id: `qz-board-view-${i}`, className: "qz-panel-surface qz-board-view-panel", "aria-label": "Board view settings", hidden: !z, children: /* @__PURE__ */ c(Fa, { preferences: r, onPreferencesChange: e.onPreferencesChange, workspace: (s == null ? void 0 : s.workspace) ?? n }) }),
    ["create", "promote"].map((x) => /* @__PURE__ */ c("div", { hidden: N !== x, children: /* @__PURE__ */ c(Ci, { mode: x, api: t, workspace: n, columns: m, firstField: N === x ? R : void 0, disabled: !a || !!l || u || f.pending || !!Be(s == null ? void 0 : s.index), maintenance: (s == null ? void 0 : s.index.maintenance) ?? [], onBusy: W, onChanged: h, onClose: () => I(null), onMaintenanceNeeded: Ce }) }, x)),
    /* @__PURE__ */ g("div", { className: "qz-toolbar qz-board-meta", children: [
      s && /* @__PURE__ */ g("span", { className: "qz-result-count", children: [
        s.tickets.length,
        " ",
        s.tickets.length === 1 ? "ticket" : "tickets"
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        s && w && v > 0 && /* @__PURE__ */ c(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            "aria-expanded": y,
            onClick: () => C((x) => !x),
            children: y ? "Hide empty columns" : `Show empty columns (${v})`
          }
        ),
        /* @__PURE__ */ c(Aa, { statuses: be }),
        /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => void p(), disabled: u || f.pending, children: [
          /* @__PURE__ */ c(Y, { name: "refresh" }),
          "Refresh"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ c(Da, { statuses: be }),
    /* @__PURE__ */ c(de, { failure: l }),
    /* @__PURE__ */ c(de, { failure: f.failure }),
    Be(s == null ? void 0 : s.index) && s && /* @__PURE__ */ c("div", { role: "note", className: "qz-notice", children: Be(s.index) }),
    Oe || ((ae = f.failure) == null ? void 0 : ae.code) === "rank_exhausted" || ((Re = f.failure) == null ? void 0 : Re.code) === "maintenance_pending" || (ve = s == null ? void 0 : s.index.maintenance) != null && ve.length ? /* @__PURE__ */ g("div", { className: "qz-notice qz-stack", children: [
      /* @__PURE__ */ c("p", { children: "Rebalance a column to restore space between card positions. Progress is saved if interrupted." }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ c("select", { className: "qz-input", "aria-label": "Column to rebalance", value: M, onChange: (x) => ce(x.target.value), children: m.map((x) => /* @__PURE__ */ c("option", { value: x.id, children: x.label }, x.id)) }),
        /* @__PURE__ */ c("button", { type: "button", className: "qz-button", onClick: () => G(!0), disabled: !a || f.pending || !!(s != null && s.index.writeBlocked), children: "Review column…" })
      ] }),
      H && /* @__PURE__ */ g(ct, { label: "Rebalance column", className: "qz-stack", onCancel: () => G(!1), children: [
        /* @__PURE__ */ c("p", { children: "Update ordering in each note of this column? Other editors may see progress before all files finish." }),
        !!((_e = s == null ? void 0 : s.index.maintenance) != null && _e.includes(M)) && /* @__PURE__ */ g("label", { className: "qz-check-label", children: [
          /* @__PURE__ */ c("input", { type: "checkbox", checked: xe, onChange: (x) => me(x.target.checked), disabled: f.pending }),
          "Keep the latest note contents and resume ordering after an external edit"
        ] }),
        /* @__PURE__ */ g("div", { className: "qz-actions", children: [
          /* @__PURE__ */ c("button", { type: "button", className: "qz-button", disabled: !a || f.pending || !!(s != null && s.index.writeBlocked), onClick: () => void f.run(() => di(t, i, M, xe)).then((x) => {
            x && (G(!1), me(!1));
          }), children: "Rebalance column" }),
          /* @__PURE__ */ c("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: f.pending, onClick: () => G(!1), children: "Cancel" })
        ] })
      ] })
    ] }) : null,
    V && /* @__PURE__ */ g(ct, { label: "Remove ticket", className: "qz-notice qz-stack", onCancel: () => te(null), children: [
      /* @__PURE__ */ g("p", { children: [
        "Remove “",
        V.title,
        "” from the board? Its note and TODOs will remain."
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ c(
          "button",
          {
            type: "button",
            className: "qz-button qz-destructive",
            disabled: f.pending,
            onClick: () => {
              const x = V;
              te(null), f.run(() => mi(t, i, x));
            },
            children: "Remove ticket"
          }
        ),
        /* @__PURE__ */ c("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => te(null), children: "Cancel" })
      ] })
    ] }),
    !s && !l && /* @__PURE__ */ c("p", { className: "qz-muted qz-loading", role: "status", children: "Loading the board…" }),
    s && s.tickets.length === 0 && s.index.state !== "scanning" && /* @__PURE__ */ g("div", { className: "qz-empty", children: [
      /* @__PURE__ */ c("span", { className: "qz-empty-icon", children: /* @__PURE__ */ c(Y, { name: "board" }) }),
      /* @__PURE__ */ g("h3", { children: [
        "No tickets in “",
        n.name,
        "” yet"
      ] }),
      /* @__PURE__ */ c("p", { children: "Create a ticket, or turn an existing note into one." }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "primary", disabled: f.pending || B, onClick: () => I("create"), children: [
          /* @__PURE__ */ c(Y, { name: "plus" }),
          "New ticket"
        ] }),
        /* @__PURE__ */ g("button", { type: "button", className: "qz-button", disabled: f.pending || B, onClick: () => I("promote"), children: [
          /* @__PURE__ */ c(Y, { name: "note" }),
          "Use existing note"
        ] })
      ] })
    ] }),
    s && b.length > 0 && /* @__PURE__ */ c("p", { className: "qz-muted qz-board-hint", children: "Tip: focus a card title, then use the arrow keys to move between cards. Scroll sideways for more columns." }),
    s && b.length > 0 && /* @__PURE__ */ c("div", { className: "qz-board-wrap", "data-more-start": L.start || void 0, "data-more-end": L.end || void 0, children: /* @__PURE__ */ c("div", { ref: T, className: "qz-board", "data-density": r.boardDensity, tabIndex: 0, onKeyDown: K, "aria-label": `Board of ${n.name}`, role: "group", children: b.map(({ id: x, label: q, color: E }, A) => /* @__PURE__ */ g(
      "section",
      {
        "aria-label": q,
        className: "qz-lane",
        "data-lane-status": x,
        style: Ri(E),
        "data-drop-target": ($ == null ? void 0 : $.lane) === x || void 0,
        onDragOver: (S) => De(S, x),
        onDragLeave: (S) => {
          S.relatedTarget instanceof Node && S.currentTarget.contains(S.relatedTarget) || j((U) => (U == null ? void 0 : U.lane) === x ? null : U);
        },
        onDrop: (S) => {
          x !== "repair" && ge(S, x);
        },
        children: [
          /* @__PURE__ */ g("h3", { className: "qz-lane-heading", children: [
            /* @__PURE__ */ c("span", { className: "qz-dot", "aria-hidden": "true" }),
            q,
            /* @__PURE__ */ c("span", { className: "qz-count", children: k[x].length })
          ] }),
          x === "repair" && /* @__PURE__ */ c("p", { className: "qz-lane-help qz-muted", children: "Choose a column for tickets with an old status. Open a note to fix other ticket details." }),
          k[x].length === 0 && /* @__PURE__ */ c("p", { className: "qz-lane-empty", children: "No tickets" }),
          /* @__PURE__ */ c("ul", { className: "qz-cards", children: k[x].map((S, U) => /* @__PURE__ */ c(
            "li",
            {
              "data-ticket-path": S.path,
              "data-drop-before": ($ == null ? void 0 : $.lane) === x && $.before === S.path || void 0,
              draggable: !P && !Be(s.index, S),
              onDragStart: (Q) => {
                D.current = S, Q.dataTransfer.setData("text/plain", S.path), Q.dataTransfer.effectAllowed = "move";
              },
              onDragEnd: () => {
                D.current = null, j(null);
              },
              onDrop: (Q) => {
                x !== "repair" && ge(Q, x, S);
              },
              children: /* @__PURE__ */ c(
                Ni,
                {
                  ticket: S,
                  lane: A,
                  index: U,
                  columns: m,
                  onOpen: () => e.onOpenNote({ workspaceId: i, path: S.path }),
                  disabled: P || !!Be(s.index, S),
                  maintenance: s.index.maintenance ?? [],
                  canReorder: d[`${i}:${x}`] !== "title",
                  fields: r.boardFields,
                  folder: n.name,
                  folderAppearance: r.folderAppearance[String(i)],
                  onMove: (Q, se) => re(S, Q, se),
                  onDemote: () => te(S),
                  count: k[x].length
                }
              )
            },
            S.path
          )) })
        ]
      },
      x
    )) }) })
  ] });
}
function Ci(e) {
  const [t, n] = F(""), [a, r] = F(""), [i, o] = F(""), [s, l] = F(""), u = (e.columns.find(($) => $.id === s) ?? e.columns[0]).id, [p, h] = F(null), [f, m] = F(null), [d, w] = F(!1), k = ne(0), z = ne(!0);
  ie(() => (z.current = !0, () => {
    z.current = !1, k.current++;
  }), []);
  const _ = pn(e.onChanged);
  ie(() => (e.onBusy(_.pending), () => e.onBusy(!1)), [_.pending, e.onBusy]);
  const y = e.disabled || _.pending || d, C = e.maintenance.includes(u);
  ie(() => {
    var $, j;
    ((($ = _.failure) == null ? void 0 : $.code) === "rank_exhausted" || ((j = _.failure) == null ? void 0 : j.code) === "maintenance_pending") && e.onMaintenanceNeeded(u);
  }, [_.failure, e.onMaintenanceNeeded, u]);
  const v = () => {
    k.current++, w(!1), n(""), r(""), o(""), h(null), m(null), e.onClose();
  }, b = t.trim().endsWith(".md") ? t.trim() : `${t.trim()}.md`, T = async () => {
    const $ = ++k.current;
    w(!0), m(null), h(null);
    try {
      const j = await ze(Qt(e.api, e.workspace.id, b));
      z.current && $ === k.current && h(j);
    } catch (j) {
      z.current && $ === k.current && m(qe(j));
    } finally {
      z.current && $ === k.current && w(!1);
    }
  }, D = async () => {
    await _.run(() => e.mode === "create" ? oi(e.api, e.workspace.id, { path: b, title: a.trim(), body: i, status: u }) : li(e.api, e.workspace.id, p, u)) && z.current && (n(""), r(""), o(""), h(null), e.onClose());
  }, L = e.mode === "create", J = L ? "New ticket" : "Use existing note", Z = !y && !C && !!t.trim() && (L ? !!a.trim() : !!p);
  return /* @__PURE__ */ g("section", { className: "qz-panel-surface qz-ticket-form", "aria-label": J, children: [
    /* @__PURE__ */ c("h3", { children: J }),
    /* @__PURE__ */ g("form", { className: "qz-stack", onSubmit: ($) => {
      $.preventDefault(), Z && D();
    }, children: [
      L && /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Title",
        /* @__PURE__ */ c("input", { className: "qz-input", ref: e.firstField, placeholder: "Fix login", value: a, disabled: _.pending, onChange: ($) => r($.target.value) })
      ] }),
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Note path in ",
        e.workspace.name,
        /* @__PURE__ */ c(
          "input",
          {
            className: "qz-input",
            ref: L ? void 0 : e.firstField,
            placeholder: "tickets/fix-login.md",
            value: t,
            disabled: _.pending,
            onChange: ($) => {
              k.current++, w(!1), n($.target.value), h(null);
            }
          }
        )
      ] }),
      L ? /* @__PURE__ */ g("label", { className: "qz-field", children: [
        /* @__PURE__ */ g("span", { children: [
          "Description ",
          /* @__PURE__ */ c("span", { className: "qz-muted", children: "· Optional Markdown" })
        ] }),
        /* @__PURE__ */ c("textarea", { className: "qz-input", placeholder: "What needs to happen?", value: i, disabled: _.pending, onChange: ($) => o($.target.value), rows: 4 })
      ] }) : /* @__PURE__ */ g(pe, { children: [
        /* @__PURE__ */ c("div", { className: "qz-actions", children: /* @__PURE__ */ c("button", { type: "button", className: "qz-button", disabled: y || !t.trim(), onClick: () => void T(), children: "Preview note" }) }),
        p && /* @__PURE__ */ g(pe, { children: [
          /* @__PURE__ */ c("pre", { className: "qz-mono qz-note-preview", children: p.content }),
          /* @__PURE__ */ c("p", { className: "qz-muted", children: "The note’s content and existing properties are preserved." })
        ] })
      ] }),
      (L || p) && /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Initial status",
        /* @__PURE__ */ c("select", { className: "qz-input", value: u, disabled: _.pending, onChange: ($) => l($.target.value), children: e.columns.map(($) => /* @__PURE__ */ c("option", { value: $.id, children: $.label }, $.id)) })
      ] }),
      C && /* @__PURE__ */ c("span", { className: "qz-notice", children: "Resume ordering maintenance for this column before adding a ticket." }),
      /* @__PURE__ */ c(de, { failure: f }),
      /* @__PURE__ */ c(de, { failure: _.failure }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ c("button", { type: "submit", className: "qz-button", "data-variant": "primary", disabled: !Z, children: L ? "Create ticket" : "Add to board" }),
        /* @__PURE__ */ c("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: _.pending, onClick: v, children: "Cancel" })
      ] })
    ] })
  ] });
}
function Ni(e) {
  const { ticket: t, fields: n, folderAppearance: a } = e, r = t.lane === "repair" ? "" : t.lane, i = a && (a.emoji || a.color !== "theme"), o = ne(null);
  return ie(() => {
    const s = (l) => {
      const u = o.current;
      u != null && u.open && !(l.target instanceof Node && u.contains(l.target)) && (u.open = !1);
    };
    return document.addEventListener("mousedown", s), () => document.removeEventListener("mousedown", s);
  }, []), /* @__PURE__ */ g("article", { className: "qz-ticket", children: [
    /* @__PURE__ */ g("div", { className: "qz-ticket-content", children: [
      /* @__PURE__ */ g("button", { type: "button", className: "qz-note-link", "data-lane": e.lane, "data-index": e.index, "data-note-path": t.path, "aria-label": `Open note: ${t.title}`, onClick: e.onOpen, children: [
        t.title,
        /* @__PURE__ */ c(Y, { name: "external" })
      ] }),
      n.path && /* @__PURE__ */ c("span", { className: "qz-mono qz-path", title: t.path, children: t.path }),
      n.progress && t.todos.total > 0 && /* @__PURE__ */ g("div", { className: "qz-ticket-progress", children: [
        /* @__PURE__ */ c("progress", { value: t.todos.done, max: t.todos.total, "aria-label": `Checklist progress for ${t.title}` }),
        /* @__PURE__ */ g("span", { title: "Completed TODOs", children: [
          t.todos.done,
          "/",
          t.todos.total
        ] })
      ] }),
      n.badges && (i || t.diagnostics.length > 0) && /* @__PURE__ */ g("div", { className: "qz-actions qz-ticket-badges", children: [
        i && /* @__PURE__ */ c(Ma, { name: e.folder, appearance: a }),
        t.diagnostics.map((s) => /* @__PURE__ */ c("span", { className: "qz-badge", title: s.message, children: s.code.replace(/_/g, " ") }, s.code))
      ] })
    ] }),
    /* @__PURE__ */ g("div", { className: "qz-ticket-footer", children: [
      /* @__PURE__ */ c("div", { className: "qz-ticket-status", children: /* @__PURE__ */ g(
        "select",
        {
          className: "qz-input",
          "aria-label": `Move ${t.title} to column`,
          title: "Move to column",
          value: r,
          disabled: e.disabled,
          onChange: (s) => e.onMove(s.target.value),
          children: [
            !r && /* @__PURE__ */ c("option", { value: "", disabled: !0, children: t.status ? `No column for ${t.status}` : "Needs repair" }),
            e.columns.map((s) => /* @__PURE__ */ c("option", { value: s.id, disabled: e.maintenance.includes(s.id), children: s.label }, s.id))
          ]
        }
      ) }),
      /* @__PURE__ */ g("details", { ref: o, className: "qz-ticket-actions", onKeyDown: (s) => {
        var l, u;
        s.key !== "Escape" || !((l = o.current) != null && l.open) || (s.stopPropagation(), o.current.open = !1, (u = o.current.querySelector("summary")) == null || u.focus());
      }, children: [
        /* @__PURE__ */ c("summary", { className: "qz-button qz-icon-button", "data-variant": "quiet", "aria-label": `Actions for ${t.title}`, title: "Ticket actions", children: /* @__PURE__ */ c(Y, { name: "more" }) }),
        /* @__PURE__ */ g("div", { className: "qz-ticket-action-list", children: [
          /* @__PURE__ */ c(Sa, { path: t.path }),
          e.canReorder && /* @__PURE__ */ g(pe, { children: [
            /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "quiet", "aria-label": `Move ${t.title} up`, disabled: e.disabled || e.index === 0 || !r, onClick: () => e.onMove(r, e.index - 1), children: [
              /* @__PURE__ */ c(Y, { name: "up" }),
              "Move up"
            ] }),
            /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "quiet", "aria-label": `Move ${t.title} down`, disabled: e.disabled || e.index >= e.count - 1 || !r, onClick: () => e.onMove(r, e.index + 1), children: [
              /* @__PURE__ */ c(Y, { name: "down" }),
              "Move down"
            ] })
          ] }),
          /* @__PURE__ */ g("button", { type: "button", className: "qz-button qz-destructive", "data-variant": "quiet", "aria-label": `Remove ${t.title} from board`, disabled: e.disabled, onClick: e.onDemote, children: [
            /* @__PURE__ */ c(Y, { name: "minus" }),
            "Remove ticket…"
          ] })
        ] })
      ] })
    ] })
  ] });
}
const wn = 20, Ai = 40, Di = 200;
function Si(e) {
  var ce;
  const { api: t, preferences: n, onPreferencesChange: a, workspaceId: r, active: i = !0 } = e, o = za(), { companions: s, failure: l } = Ca(t, i, r), { todoScope: u, todoState: p, todoFilters: h } = n, [f, m] = F(""), d = ne(null), [w, k] = F(""), [z, _] = F(""), y = h.find((M) => M.name.toLocaleLowerCase() === z.trim().toLocaleLowerCase()), C = !!z.trim() && (h.length < wn || !!y), v = h.find((M) => M.name === w), b = (v == null ? void 0 : v.scope) === u && (v == null ? void 0 : v.state) === p && (v == null ? void 0 : v.search) === f ? v.name : "", T = (M) => {
    const H = h.find((G) => G.name === M);
    k(M), H && (a({ todoScope: H.scope, todoState: H.state }), m(H.search));
  }, D = (M) => {
    if (M.preventDefault(), !C) return;
    const H = { name: (y == null ? void 0 : y.name) ?? z.trim(), scope: u, state: p, search: f };
    a({ todoFilters: y ? h.map((G) => G === y ? H : G) : [...h, H] }), k(H.name), _("");
  }, L = () => {
    a({ todoFilters: h.filter((M) => M.name !== b) }), k("");
  }, J = (ce = s == null ? void 0 : s.find((M) => M.workspace.id === r)) == null ? void 0 : ce.workspace.name, Z = u === "workspace" ? r ?? void 0 : void 0, $ = i && !!(s != null && s.length) && (u === "all" || Z !== void 0), { data: j, failure: V, busy: te, refresh: N, reload: I } = Na(
    t,
    $,
    `${u}:${Z ?? ""}:${p}`,
    Z,
    () => Vr(t, p, Z),
    () => dn(t, { workspaceId: Z, manual: !0 }),
    (M, H) => ({ ...M, index: H })
  ), R = Fe(() => ni((j == null ? void 0 : j.groups) ?? [], f), [j, f]), B = R.reduce((M, H) => M + H.items.length, 0), W = j ? Object.values(j.index) : [], P = pn(I), ee = (M, H, G) => {
    !i || P.pending || V || te || Be(j == null ? void 0 : j.index[String(M.workspaceId)], M) || H.markerStart === void 0 || P.run(() => ui(t, M, H, G));
  };
  return l ? /* @__PURE__ */ c(de, { failure: l }) : s ? s.length === 0 ? /* @__PURE__ */ c(Ta, { onSettings: e.onSettings }) : /* @__PURE__ */ g("div", { className: "qz-stack qz-todos", children: [
    /* @__PURE__ */ g("div", { className: "qz-view-heading", children: [
      /* @__PURE__ */ g("div", { children: [
        /* @__PURE__ */ c("h2", { className: "qz-section-title", children: "TODOs" }),
        /* @__PURE__ */ c("p", { className: "qz-section-description", children: "Find and complete Markdown TODOs across your shared folders." })
      ] }),
      /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => o(wa), children: [
        /* @__PURE__ */ c(Y, { name: "external" }),
        "Open Kiro Notes"
      ] })
    ] }),
    /* @__PURE__ */ g("div", { className: "qz-todo-filters qz-panel-surface", children: [
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Search",
        /* @__PURE__ */ g("span", { className: "qz-search", children: [
          /* @__PURE__ */ c(Y, { name: "search" }),
          /* @__PURE__ */ c(
            "input",
            {
              className: "qz-input",
              ref: d,
              type: "search",
              placeholder: "Search tasks or notes…",
              value: f,
              maxLength: Di,
              onChange: (M) => m(M.target.value)
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Folder scope",
        /* @__PURE__ */ g("select", { className: "qz-input", value: u, onChange: (M) => a({ todoScope: M.target.value === "workspace" ? "workspace" : "all" }), children: [
          /* @__PURE__ */ c("option", { value: "all", children: "All folders" }),
          /* @__PURE__ */ c("option", { value: "workspace", children: J ? `Current folder (${J})` : "Current folder" })
        ] })
      ] }),
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Show",
        /* @__PURE__ */ g("select", { className: "qz-input", value: p, onChange: (M) => a({ todoState: M.target.value }), children: [
          /* @__PURE__ */ c("option", { value: "open", children: "Open" }),
          /* @__PURE__ */ c("option", { value: "done", children: "Completed" }),
          /* @__PURE__ */ c("option", { value: "all", children: "All" })
        ] })
      ] }),
      /* @__PURE__ */ g("details", { className: "qz-todo-saved-filters", children: [
        /* @__PURE__ */ c("summary", { className: "qz-button", "data-variant": "quiet", children: "Saved filters" }),
        /* @__PURE__ */ g("div", { className: "qz-todo-saved-controls", children: [
          h.length > 0 && /* @__PURE__ */ g("div", { className: "qz-todo-saved-row", children: [
            /* @__PURE__ */ g("label", { className: "qz-field", children: [
              "Saved filter",
              /* @__PURE__ */ g("select", { className: "qz-input", value: b, onChange: (M) => T(M.target.value), children: [
                /* @__PURE__ */ c("option", { value: "", disabled: !0, children: "Choose a filter" }),
                h.map((M) => /* @__PURE__ */ c("option", { value: M.name, children: M.name }, M.name))
              ] })
            ] }),
            /* @__PURE__ */ c("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: !b, onClick: L, children: "Remove saved filter" })
          ] }),
          /* @__PURE__ */ g("form", { className: "qz-todo-saved-row", onSubmit: D, children: [
            /* @__PURE__ */ g("label", { className: "qz-field", children: [
              "Filter name",
              /* @__PURE__ */ c("input", { className: "qz-input", value: z, maxLength: Ai, onChange: (M) => _(M.target.value) })
            ] }),
            /* @__PURE__ */ c("button", { className: "qz-button", type: "submit", disabled: !C, children: y ? "Update saved filter" : "Save current filter" }),
            h.length >= wn && !y && /* @__PURE__ */ c("p", { className: "qz-muted", children: "Remove a saved filter to add another." })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ g("div", { className: "qz-toolbar qz-board-meta", children: [
      j && /* @__PURE__ */ g("span", { className: "qz-result-count", role: "status", children: [
        B,
        " ",
        B === 1 ? "item" : "items",
        " in ",
        R.length,
        " ",
        R.length === 1 ? "note" : "notes"
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ c(Aa, { statuses: W }),
        /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => void N(), disabled: te || P.pending, children: [
          /* @__PURE__ */ c(Y, { name: "refresh" }),
          "Refresh"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ c(Da, { statuses: W }),
    /* @__PURE__ */ c(de, { failure: V }),
    /* @__PURE__ */ c(de, { failure: P.failure }),
    (j == null ? void 0 : j.truncated) && /* @__PURE__ */ c("div", { role: "note", className: "qz-notice", children: "Only the first items are listed. Narrow the list by folder or completion status." }),
    !j && !V && /* @__PURE__ */ c("p", { className: "qz-muted qz-loading", role: "status", children: "Loading TODOs…" }),
    j && R.length === 0 && /* @__PURE__ */ g("div", { className: "qz-empty", children: [
      /* @__PURE__ */ c("span", { className: "qz-empty-icon", children: /* @__PURE__ */ c(Y, { name: f.trim() ? "search" : "checklist" }) }),
      /* @__PURE__ */ c("h3", { children: f.trim() ? "No matching TODOs" : "No TODOs to show" }),
      /* @__PURE__ */ c("p", { children: f.trim() ? "Try a different search or clear the filter." : "Choose a different folder or completion status to see more." }),
      f.trim() && /* @__PURE__ */ c("button", { type: "button", className: "qz-button", onClick: () => {
        var M;
        m(""), (M = d.current) == null || M.focus();
      }, children: "Clear search" })
    ] }),
    /* @__PURE__ */ c("div", { className: "qz-stack", children: R.map((M) => /* @__PURE__ */ g("section", { "aria-label": M.title, className: "qz-todo-note qz-panel-surface", children: [
      /* @__PURE__ */ g("header", { className: "qz-todo-header", children: [
        /* @__PURE__ */ c("span", { className: "qz-note-icon", children: /* @__PURE__ */ c(Y, { name: "note" }) }),
        /* @__PURE__ */ g("div", { className: "qz-todo-identity", children: [
          /* @__PURE__ */ g("h3", { children: [
            M.title,
            M.ticket && M.status && /* @__PURE__ */ g("span", { className: "qz-status-pill", "data-lane-status": M.status, children: [
              /* @__PURE__ */ c("span", { className: "qz-dot", "aria-hidden": "true" }),
              M.statusLabel ?? M.status
            ] })
          ] }),
          /* @__PURE__ */ g("p", { className: "qz-todo-meta", children: [
            /* @__PURE__ */ c(Ma, { name: M.workspace, appearance: n.folderAppearance[String(M.workspaceId)] }),
            /* @__PURE__ */ c("span", { "aria-hidden": "true", children: "/" }),
            /* @__PURE__ */ c("span", { className: "qz-mono qz-path", title: M.path, children: M.path })
          ] })
        ] }),
        /* @__PURE__ */ c(Sa, { path: M.path, compact: !0 })
      ] }),
      /* @__PURE__ */ c("ul", { className: "qz-todo-list", children: M.items.map((H) => /* @__PURE__ */ g("li", { className: "qz-todo-row", "data-checked": H.checked, style: { paddingInlineStart: `${Math.min(H.depth, 4) * 0.8}rem` }, children: [
        /* @__PURE__ */ g("label", { className: "qz-todo-check", children: [
          /* @__PURE__ */ c(
            "input",
            {
              type: "checkbox",
              "aria-label": `Complete ${Ot(H.text)}`,
              checked: H.checked,
              disabled: P.pending || !!V || te || !!Be(j == null ? void 0 : j.index[String(M.workspaceId)], M) || H.markerStart === void 0,
              onChange: (G) => ee(M, H, G.target.checked)
            }
          ),
          /* @__PURE__ */ c("span", { children: Ot(H.text) })
        ] }),
        /* @__PURE__ */ c(
          "button",
          {
            type: "button",
            title: `Open note · ${M.path}:${H.line}:${H.column}${H.heading ? ` · ${H.heading}` : ""}`,
            "aria-label": `Open note: ${Ot(H.text)}`,
            onClick: () => e.onOpenNote({ workspaceId: M.workspaceId, path: M.path }),
            className: "qz-button qz-icon-button",
            "data-variant": "quiet",
            children: /* @__PURE__ */ c(Y, { name: "external" })
          }
        )
      ] }, H.ordinal)) })
    ] }, `${M.workspaceId}:${M.path}`)) })
  ] }) : /* @__PURE__ */ c("p", { className: "qz-muted qz-loading", role: "status", children: "Loading folders…" });
}
/*! markdown-it 15.0.3 https://github.com/markdown-it/markdown-it @license MIT */
var qn = Object.defineProperty, St = (e, t) => {
  let n = {};
  for (var a in e) qn(n, a, {
    get: e[a],
    enumerable: !0
  });
  return qn(n, Symbol.toStringTag, { value: "Module" }), n;
}, yn = {};
function Ti(e) {
  let t = yn[e];
  if (t) return t;
  t = yn[e] = [];
  for (let n = 0; n < 128; n++) {
    let a = String.fromCharCode(n);
    t.push(a);
  }
  for (let n = 0; n < e.length; n++) {
    let a = e.charCodeAt(n);
    t[a] = "%" + ("0" + a.toString(16).toUpperCase()).slice(-2);
  }
  return t;
}
function it(e, t) {
  typeof t != "string" && (t = it.defaultChars);
  let n = Ti(t);
  return e.replace(/(%[a-f0-9]{2})+/gi, function(a) {
    let r = "";
    for (let i = 0, o = a.length; i < o; i += 3) {
      let s = parseInt(a.slice(i + 1, i + 3), 16);
      if (s < 128) r += n[s];
      else {
        if ((s & 224) == 192 && i + 3 < o) {
          let l = parseInt(a.slice(i + 4, i + 6), 16);
          if ((l & 192) == 128) {
            let u = s << 6 & 1984 | l & 63;
            r += u < 128 ? "��" : String.fromCharCode(u), i += 3;
            continue;
          }
        }
        if ((s & 240) == 224 && i + 6 < o) {
          let l = parseInt(a.slice(i + 4, i + 6), 16), u = parseInt(a.slice(i + 7, i + 9), 16);
          if ((l & 192) == 128 && (u & 192) == 128) {
            let p = s << 12 & 61440 | l << 6 & 4032 | u & 63;
            r += p < 2048 || p >= 55296 && p <= 57343 ? "���" : String.fromCharCode(p), i += 6;
            continue;
          }
        }
        if ((s & 248) == 240 && i + 9 < o) {
          let l = parseInt(a.slice(i + 4, i + 6), 16), u = parseInt(a.slice(i + 7, i + 9), 16), p = parseInt(a.slice(i + 10, i + 12), 16);
          if ((l & 192) == 128 && (u & 192) == 128 && (p & 192) == 128) {
            let h = s << 18 & 1835008 | l << 12 & 258048 | u << 6 & 4032 | p & 63;
            h < 65536 || h > 1114111 ? r += "����" : (h -= 65536, r += String.fromCharCode(55296 + (h >> 10), 56320 + (h & 1023))), i += 9;
            continue;
          }
        }
        r += "�";
      }
    }
    return r;
  });
}
it.defaultChars = ";/?:@&=+$,#", it.componentChars = "";
var Rn = {};
function Fi(e) {
  let t = Rn[e];
  if (t) return t;
  t = Rn[e] = [];
  for (let n = 0; n < 128; n++) {
    let a = String.fromCharCode(n);
    /^[0-9a-z]$/i.test(a) ? t.push(a) : t.push("%" + ("0" + n.toString(16).toUpperCase()).slice(-2));
  }
  for (let n = 0; n < e.length; n++) t[e.charCodeAt(n)] = e[n];
  return t;
}
function Le(e, t, n) {
  typeof t != "string" && (n = t, t = Le.defaultChars), n === void 0 && (n = !0);
  let a = Fi(t), r = "";
  for (let i = 0, o = e.length; i < o; i++) {
    let s = e.charCodeAt(i);
    if (n && s === 37 && i + 2 < o && /^[0-9a-f]{2}$/i.test(e.slice(i + 1, i + 3))) r += e.slice(i, i + 3), i += 2;
    else if (s < 128) r += a[s];
    else if (s >= 55296 && s <= 57343) {
      if (s >= 55296 && s <= 56319 && i + 1 < o) {
        let l = e.charCodeAt(i + 1);
        if (l >= 56320 && l <= 57343) {
          r += encodeURIComponent(e[i] + e[i + 1]), i++;
          continue;
        }
      }
      r += "%EF%BF%BD";
    } else r += encodeURIComponent(e[i]);
  }
  return r;
}
Le.defaultChars = ";/?:@&=+$,-_.!~*'()#", Le.componentChars = "-_.!~*'()";
function tn(e) {
  let t = "";
  return t += e.protocol || "", t += e.slashes ? "//" : "", t += e.auth ? e.auth + "@" : "", e.hostname && e.hostname.indexOf(":") !== -1 ? t += "[" + e.hostname + "]" : t += e.hostname || "", t += e.port ? ":" + e.port : "", t += e.pathname || "", t += e.search || "", t += e.hash || "", t;
}
function yt() {
  this.protocol = null, this.slashes = null, this.auth = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.pathname = null;
}
var Mi = /^([a-z0-9.+-]+:)/i, Ii = /:[0-9]*$/, Oi = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/, En = [
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
], Cn = [
  "/",
  "?",
  "#"
], Bi = 255, Nn = /^[+a-z0-9A-Z_-]{0,63}$/, Li = /^([+a-z0-9A-Z_-]{0,63})(.*)$/, An = {
  javascript: !0,
  "javascript:": !0
}, Dn = {
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
function nn(e, t) {
  if (e && e instanceof yt) return e;
  let n = new yt();
  return n.parse(e, t), n;
}
yt.prototype.parse = function(e, t) {
  let n, a, r, i = e;
  if (i = i.trim(), !t && e.split("#").length === 1) {
    let u = Oi.exec(i);
    if (u) return this.pathname = u[1], u[2] && (this.search = u[2]), this;
  }
  let o = Mi.exec(i);
  if (o && (o = o[0], n = o.toLowerCase(), this.protocol = o, i = i.substr(o.length)), (t || o || i.match(/^\/\/[^@\/]+@[^@\/]+/)) && (r = i.substr(0, 2) === "//", r && !(o && An[o]) && (i = i.substr(2), this.slashes = !0)), !An[o] && (r || o && !Dn[o])) {
    let u = -1;
    for (let d = 0; d < Cn.length; d++) a = i.indexOf(Cn[d]), a !== -1 && (u === -1 || a < u) && (u = a);
    let p, h;
    h = u === -1 ? i.lastIndexOf("@") : i.lastIndexOf("@", u), h !== -1 && (p = i.slice(0, h), i = i.slice(h + 1), this.auth = p), u = -1;
    for (let d = 0; d < En.length; d++) a = i.indexOf(En[d]), a !== -1 && (u === -1 || a < u) && (u = a);
    u === -1 && (u = i.length), i[u - 1] === ":" && u--;
    let f = i.slice(0, u);
    i = i.slice(u), this.parseHost(f), this.hostname = this.hostname || "";
    let m = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
    if (!m) {
      let d = this.hostname.split(/\./);
      for (let w = 0, k = d.length; w < k; w++) {
        let z = d[w];
        if (z && !z.match(Nn)) {
          let _ = "";
          for (let y = 0, C = z.length; y < C; y++) z.charCodeAt(y) > 127 ? _ += "x" : _ += z[y];
          if (!_.match(Nn)) {
            let y = d.slice(0, w), C = d.slice(w + 1), v = z.match(Li);
            v && (y.push(v[1]), C.unshift(v[2])), C.length && (i = C.join(".") + i), this.hostname = y.join(".");
            break;
          }
        }
      }
    }
    this.hostname.length > Bi && (this.hostname = ""), m && (this.hostname = this.hostname.substr(1, this.hostname.length - 2));
  }
  let s = i.indexOf("#");
  s !== -1 && (this.hash = i.substr(s), i = i.slice(0, s));
  let l = i.indexOf("?");
  return l !== -1 && (this.search = i.substr(l), i = i.slice(0, l)), i && (this.pathname = i), Dn[n] && this.hostname && !this.pathname && (this.pathname = ""), this;
}, yt.prototype.parseHost = function(e) {
  let t = Ii.exec(e);
  t && (t = t[0], t !== ":" && (this.port = t.substr(1)), e = e.substr(0, e.length - t.length)), e && (this.hostname = e);
};
var $i = /* @__PURE__ */ St({
  decode: () => it,
  encode: () => Le,
  format: () => tn,
  parse: () => nn
}), ji = /* @__PURE__ */ St({
  Any: () => Ia,
  Cc: () => Oa,
  Cf: () => Ui,
  P: () => fn,
  S: () => Ba,
  Z: () => La
}), Ia = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, Oa = /[\0-\x1F\x7F-\x9F]/, Ui = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/, fn = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B4E\u1B4F\u1B5A-\u1B60\u1B7D-\u1B7F\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDD6E\uDEAD\uDED0\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9\uDFD4\uDFD5\uDFD7\uDFD8]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09\uDFE1]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDD6D-\uDD6F\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD839\uDDFF|\uD83A[\uDD5E\uDD5F]/, Ba = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C1\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2429\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E5\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD803[\uDD8E\uDD8F\uDED1-\uDED8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDC00-\uDCEF\uDCFA-\uDCFC\uDD00-\uDEB3\uDEBA-\uDED0\uDEE0-\uDEF0\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED8\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0-\uDCBB\uDCC0\uDCC1\uDCD0-\uDCD8\uDD00-\uDE57\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF-\uDEF8\uDF00-\uDF92\uDF94-\uDFEF\uDFFA]/, La = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/, Pi = [
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
function Ji(e) {
  return e === 0 || e >= 55296 && e <= 57343 || e > 1114111;
}
function Wi(e) {
  return Ji(e) ? 65533 : e >= 128 && e <= 159 && Pi[e - 128] || e;
}
function Hi(e) {
  return e - 1 >>> 0 < 127 || e - 160 >>> 0 < 55136 ? String.fromCharCode(e) : String.fromCodePoint(Wi(e));
}
var Ae = /* @__PURE__ */ (() => {
  let e = /* @__PURE__ */ new Uint8Array(127), t = 0;
  for (let n = 33; n <= 126; n++) n !== 34 && n !== 36 && n !== 92 && (e[n] = t++);
  return e;
})();
function Zi(e, t, n, a, r, i) {
  let o = e.length, s = i * 90, l = 0, u = () => {
    let D = Ae[e.charCodeAt(l++)];
    return D < i ? D : D * 91 - s + Ae[e.charCodeAt(l++)];
  }, p = n - a, h = n + r, f = new Int32Array(h);
  f.fill(-1, a, i), f.fill(-1, i + p, h);
  let m = new Int32Array(h), d = new Int32Array(h);
  function w(D, L) {
    let J = 0, Z = L, $ = L + D;
    for (; Z < $; ) {
      let j = Ae[e.charCodeAt(l++)];
      if (j < 89) J += j, f[Z++] = J;
      else if (j === 89) {
        let V = Ae[e.charCodeAt(l++)] + 2;
        for (; V--; ) f[Z++] = ++J;
      } else {
        let V = Ae[e.charCodeAt(l++)];
        J += 89 + (V < 90 ? V * 91 + Ae[e.charCodeAt(l++)] : Ae[e.charCodeAt(l++)] * 8281 + Ae[e.charCodeAt(l++)] * 91 + Ae[e.charCodeAt(l++)]), f[Z++] = J;
      }
    }
  }
  w(a, 0), w(p, i);
  let k = new Int32Array(r * 2), z = 0, _ = 0;
  function y(D, L) {
    for (let J = 0; J < D; J++) {
      let Z = L + J, $ = u(), j = u();
      k[_ * 2] = $, k[_ * 2 + 1] = j, _ += 1, m[Z] = z;
      let V = (f[$] < 0 ? d[$] : 1) + (f[j] < 0 ? d[j] : 1);
      d[Z] = V, z += V;
    }
  }
  y(r - i + a, i + p), y(i - a, a);
  let C = new Uint16Array(z), v = 0;
  for (let D = 0; D < _; D++) for (let L = 0; L < 2; L++) {
    let J = k[D * 2 + L], Z = f[J];
    if (Z < 0) {
      let $ = m[J], j = $ + d[J];
      for (; $ < j; ) C[v++] = C[$++];
    } else C[v++] = Z;
  }
  let b = new Uint16Array(t), T = 0;
  for (; l < o; ) {
    let D = Ae[e.charCodeAt(l++)];
    D >= i && (D = D * 91 - s + Ae[e.charCodeAt(l++)]);
    let L = f[D];
    if (L < 0) {
      let J = m[D], Z = J + d[D];
      for (; J < Z; ) b[T++] = C[J++];
    } else b[T++] = L;
  }
  return b;
}
var Ki = /* @__PURE__ */ Zi("!}.&u%}'&}*'~!6*)%&,~!J~!J~%L~y<~!R,~~%Lu~~#GD~~#|)1#%}^%}2%+#.##%##%}&%##%'#%##&%#%#'%#&#%#&#'#%%#&#%##%#)%''%&%#%#'%#%%#%%}%%%#%#&(23#%%#&-%0%('1#(##%#'##+%'*.:1}#%#6-+(%'%%#%%%}#L'2351&('%}&/N'(0(/*-%(%%}#'+&T%7.2}#&%&#%#36/5##%&%%#&#%%#))2%%##%&&'0~!#*+&'%1~!%).'3q?&%'1~!.##%6(~!+%%%(Gw'rT~!E#<nA%#jZ~!H%(~!42##~!*31&~!G%U~#)5~#`3~!J~!Z~%]~%Y~%C~!q~!u~#kz~%#~!6'~!D~!U~!?~#T~!c%~!G#'~%7|~!G~!J~!G&~#pb~(Df}#%}*&}#%##%##%##&#-}&'#'&%#.++}%mI,#,@&(}*%}*'%&##&#%##%}&0}#.},U},%}+%}&%}#%##&}B%(}(%}+%)})%##%#&}&%##%&}<%}>%#%&}*%}(%}9%}/%})%}*%}*%}?&}&%}3%}&*#%})%#%#)}#&#-#+*%E%%'%'#%}#*V##&##I}#&&##%&%#&&Qf%%))w/0+&%#(#.%-''''++++7}>%4'',##1,#%#&%##&#'##&#*#9)%&%}#*}%,#+P(%A&%#'&##wSD',9E00#y#@}(+}&%&>~!#~!X}#*}(&&}(&}(,%}%&#+&}#&}I%#%}%)#(},'%#*}4%%#%}(''}#/##(##),%-##%%)#&}(.}&%#&}%%}*&#%},&&}&%}#%*'#%})%}D&}&%}-&}6&#&}-,%}#%})-(~+`~,=?~I9'9%~!,#%})%})%}@%}?%}(~!?~#<~#pP~#BG~#=1#%K+~#?#~%;)~#A~#mF1~#A'~'X%'~#lR~#N~'N~#r~#m#-~#i'?%#'%~#B%##%,%#~#_%#0%~#]732~,w~2+#:&#%&'0%&>%}#>##F+)#%&&#(+_}4&}-%}(&}@&}O7Fdf0@+/v4}&WU##&/0#&'('B#%}.%}'+#%}#%%&#&%#%##+#&#)#6#'#.},%}c%},%#%##%&#&%#&~#>'*-.%##%##%}#%%}%'~#)D1}#%*&~#_%%'(~#S2%'.}#~#=##*'*-%}&'%'##&&~'E%.#&~#M4}%%##&'%#~#O1##%&#'+~#<B%##%%'%+~#;#@%}#&%#&&%#(~#H1}'%'##&&~#?A}&'~#D#%32}'&&&&~#[}'(#%}'~#;C})&}%%#%~#=&%,3}%'(#%%~#^'#&&)#%'~#Y%-~#d-%'~#^%%&#&&&}#~#b~2t*&'~&(~&@~0%~e~3}%*''0})&}+~!9##-}#%-hD*)1fC#%/&/fB#40~!+#)*4~!+~!K'&:~!/*7~!.#~!H~!L':~%x&~!H#~!*~%1~!I#~!+A~#p'~!F~~#-#~,,(~.Z~!V~%;'B'mq-W~!N~%I%#&&#&}#%},%%}'%}+X#%}#&}(%}'%}<%}#%}%%'}'%}:~![)9@~%>~#UA%-%##&~!C%~!-.9:~!1~!-^2/:a~!y,D*J#-5)/4~%23,~#G~!L1~!0X3`~!2+~!!0-~&E~!W~!o,>Y&]~%cZx_&~#O*9#A#'#+I'%#)~!0B*-5A+-((F&*M#)(-7-5+'-3a5Vi~!Y~!?+[)%3),ERHm~!+:D,VG.+)?fB%%*(%)'(#&80%1'8`K8?`+'Z#&O&'H5#*9)A%%5&3))0%39+.*7#()&&*=4@**L)<'_&*+..;(#*+)./&0#3)%')-8(4ixD(&.}%,('aI:,)%,k2231T)I'#/-W7,/'Q#.'Y24+h')37</31&83##&0#),H(?'&?/1##%#&&#%''-%&&&#(&''&#.-'%#%%(,')*'&#&#'##%(%(#%('#&##%%%%('%#%#%%#%#&%##h>w+v<ayvyvcg.uuhKr}g/v|g>u9i[~>g5uI~=RvdwEg;v/g;uk!!TTSx]@RT!U!#!@VBRUU!'UTe-d0c`e&gSdicedFcrdTaqb.kYcAohdYd@a3e+d}dMdtd.aJ#bqcK`dle/e.e'dwdPdodddjbEb}ogd^ofdpduc6j?l%d{drdqc)d7bacOdQ%T#Y)X.sR[yH>6Vyv3[xwLu>vo'!*.[yBacahoj>6Rew3[xqdZa#!a&#^(X-[yG>6Vyu3[xvg3sEr|g.u/Ri9db0T#^(Xa)!-[y;>6Vylg4wKs{JwNZt3@3r=c4Z([xlg;wKt!cpq's@v7A'*a(a+!-a#[y<3Dt?3Dt'>6Vym3[xmg9rxsNJwLZt4~?r?db1T#`-!(Xa,!0[yS>6Vz%NuQs.g4wKtnJwNZtS@3r>c4Z([y%g;wKtrdga8!a(!#&T*Y-Xa#!a0<or[yc3Dtq>6Vz43[y3JwNZtf@3s!Ju}!%Dti:pm3c_%X#tjB5pkd6q!r]u?voC'*-a.a2!0a&a+[yI3DtI3Ds~3DtH>6Vyw3[xx;:s#~<5pKJwNZtE@3r~d`a)!a2T#a.(!+U.X1[yT3Dt`3Dtv>6Vz&3[y&g9rxwzcxstPu.<rAJwLZtT~?r@dZa%!a.&^*Za(/Reu[ya>6Vz23[y1g3sEr}wkg{NuQRg{ci(U#5@b`~,cg#U(2WnH5wugcRh7dX#T(Y,a'Ta!!a,[yZ<]mj>6Vz,3[y+Pv#5ReZKu+=,%!H}7ABwkaS?Rh:BcW(X#<]mrj:ubv/ARekdg%!(!a.*Ta(Y.X1!#sP>Rl*Dt6[y>>6Vyo3Wf*jOvuumvuRgRJuq*!:9<B@bX~3jVv&v@s@5Re[d/rQt{uAvo&a&a*)a2!,0Wf!3Dt0=Bs'>6Re}3[xy~<5s%JwJZt1~Gs)c;&!#2sJkNuXvzq7rxu,Re8dka4!a8(aEZ+a@Y.X1Xa)[yd=Bs(3DtP>6Vz53[y4cX#X&Re:avRe9~<5s&JwJZtQ~Gs*i^rzvdRg+Jv{%!2sbB@bX}kdga,!Za?&^*T1/!a'Dt+[y6>6Vyf3Wf%g/u;s4hGu6?Rh-JvZ,!c%#&RoX54Rivj7uyvf8RgTKvZB%*!2sGh<vu5Rgq<=C::9bb~#dZ#T&Ta6Y.X*Dt>[y93Wf)coZ(T,6VyifluvRgC@95@B@bX~/hFu34cC#T,k/unq8w8Q5RkUklwQuzunq8w8Q5Rk8d/rJu?v8w9)-&!a0a;a&aIWejg3sEr/h1s<DtDJvyZqY5aws3Jvy!&Wei~Hr1:au5@Bag>23E~5c:Z&bX};kKv?w&unuVu5Rjc;>bs)#~@:Rh.=ay<a]C;b`}Vd6s/t{uAvoaxa()!a,a7%-a#a2Dt,[yF2Wo[>6Vyt3[xuNuPRi&NuPwpi#RoWh?vf8Ri%Jv]!%Ri:KvxD!.'2WeAjZu`q9rxu,Re7woeAg-unLq(qA_/*2Wg_g3u5q^9:4E}/jTrxrzv=Wkkd~0UX#^^Xa-a1a5T&a=U1a'*aEa]!a*aPaA-adok[y54Rn>;:p3~Dp5g9rpsFNvZqjg3uJp4~<5p0Pw;5qlJwNZt*@3p1Pw:5p/Ou!5p2JvG'!6Vye=<qnJvh_[xhg3v,Rh3kOwOw-sDuev/Re^dha[a%!%!a+#Ta7)-5TaCaO!aka!a)sf[yb2>Rl!9ARiq5E}Qg=ucRkBE|oJrJ_@Wk~@Wk{JrJ_@Wk|@WkyJrJ_@Wk}@WkzJvO_[y2g-vMRmiKuYC!)&>Ri;>Ri<@3RkNc](X#@9Rk=g5vuRmhKvDB!+'=]meg3u4Rmgd)#Y'Vz3CARmfd`a+!%T'!+#Ta1Ta6TaM-sTDt9[yA9sYd'%Y#s[[xpj:ueunaXRgEjRq,v-vuqdd2'`#6Rev<32@5>:2<E}5xIo9a*X#Y(;5RePJvD_g>vyRgNj8w)v8<wggs:RgXiZt|vjx,hSq3ah!-(~@:Ro/Ou!5RhWj^v(pyw8unRhUdx-UY#^Ua.a3a70!)%UX1TaDa)'omRiRRhE[y:3Dsz=Br,>6Vyj3[xkg6ruwjcqsrPw;5r*Ku]D'Zt-@3r(~?r.i[vwv]dU1a--U#`a4(g/vsRhPOu!5RhLj:rmu9Wo!~@:wdh@g/vsRiTjXuvvNr}:RhBj^v(pyw8unRn]dz1UYa'a+^Y(!aETZalaRY.Ta?a4[yDJw1!#qLsW>6Vyrfzq-pLflpwRe|Js>%!Dt@3Dt&Jvy_[xs~HrnjMuwpsw'RecKu+D#'!t<~Grl~?rjg5u-x,gwp{ah!-(~@:Rg~Ou!5Rh'jXuvvNr}:Rh#cW#X/c;&!#2sLi[v7u7RgpJv)(!iLrxu,Re6j7v@s@5Se[e7d`aW!Za(a`T.a#!a3!&aDa-!9)Dt_=6s+3[x~~DR|h~DS6avhGun5RkZj3w)v-]mkKunB!&*]kb97R|i<ARk<c:Z(6Vy}Juh'!wziMRoS:F|vkLuauJv5vtvQRh1d='T+Y#VyO~DR|jcF#T'7R|g97R|kJv3'!ay<Rj,Jvh&!:ReXcsa6*a+#a#_aIRf9aLRf?c,Z&Rf5Rf7c.Z&Rf;Rf>cQ#%T'p-Rf8Rf=ct#%'(*!,p,Rf4p+Rf6Rf:Rf<d~'Ua%U*^UYa(!a,-!#a4YaTalaEX0a8a<Weo3Dt/3Dsx=Br93Wen~Dr;~<5p<JwNZt2@3p=Pw:5p;Ou!5r3c7&!#:p>3Ds}KvGB)_6Vyk2sM=<r7x'eovA(!hFu1ARf}cV#X&@r5j6rvwQa^Rf3c=Za'wkghJv__g;unRggA53B9=b^}%j6uduo5Jq;!(hIv%2Re`Ou4ARe_e%a#^^^Xa&!a*a2!&a6YaP!*ad!#a:aE/5Rn?[y@>6Vyp;:pE~DrY~<5pBJwNZt8@3pCh=rt3rWPw:5pAJup_[xoNuPpF9c!#'45pD5ARn)d8#X'X*3@rU72s]h>v<<sSjJpqvewOJq/(!hNw'5ReBk0s2u3w/w'5ReE5@Jq.!a+JQ!&WeU23d(#Y&RjG5]jBk!u7w&u0udARjEe#+^^^Ub#!a2/a`Z(agT1!a-a;|@TaG!aS[yV=Re~fow'RguNuPRe?bz#'>RoUWeL>:Cbb|?JwPZtVg6ruRmzJvD'!6Vz(g/vmRh~Jvy_[y(g9voRgyx*cy(#2>Ri2B9b]~9kIw9u7rluJu3Rg]dI#a%UY'@=p%CAx.gQZ&RhwwygtRm{x5g_Z'+ABqR9Woa=Bp&dV#^*Xa'!&@o{g4v]Rk;Jv{!%Rk[wkkiA5RkiwwfUB=x,fUuqC&*!>RfTg8v0RfV~ARfSd;rJsAuAv9wR'ae+/aO!a@aza/a#[yQ@Wg!2Wemg3sEr0JvB_g>uvReWg2v+Re=KupB_+[y!2AbY~-~Hr2AJwD!(h<~El>h<~El?Kun@+_:9b`}Kg-v/Ri3g;vtwyk_9]k_d=&T#*U.6qh@Ab`|K9:H|CJv[!&3Dtex'fDwC%!Rf[9WlMd[(^X,!a%Z06Vz!@WgBg=v~Rgvg,QRe@awd,#Y+jTv|Q~EfWj]uNr|~FRfXdy#Y&^Ua%!aO.!(a)Ua;=!a@aKap!a-,a!Ta]a[rSa]p?[y82sK=Bq~;:p:~<5p8Pw:5p7d'#Y'Wf(;RnRi[u4w&RgJJvG'!6Vyh=<r#ijuuv/sIKuYD'ZtG@3p9~Gr&d2#`(g<vtRgFj`u5w&rqpxRf2CJuY!+:wfnTOu!5Rg}jNs1ucv&RfwJvA!&3@q|BDcC#T,k/unq8w8Q5RkTklwQuzunq8w8Q5Rk9dga#!a'!a=#a0!:+Tb*b@aO.a4!aba8aFJv^}?!VyR~Dr<g;u%Rn.~<5p[x'e`wNZtR@3p]Pw:5pZhNvjBp.woe_g5u-r4JwF!%DtO3:ooc7&!#:p^3DtpLuGw(!+%)Dtk6Vz#2sd=<r8d'#Y([y#<x3gJt`w@!)%}MRiowzikRij=]ilxAf3,U(#B2Rf#g0v-Rm[ck{`U#]giKv3>)!&6Ri154s,KuGB_%@r68r:dJ|t`#X(9<E|u2@H|rx3gJu?w'!+'1Nu7Reg4=H~+9<wxgY95Rm]xLggZ-`(X}U2:Ri4h<uOawRmsJv__5@bb{jbV~3dka#a'a]!,#a+U=a>b6a3b%!/aKa/)!arwve^VyJ;:pR~DpTg3uJpS~<5pOPw;5qmPw:5pNOu!5pQJvG'!6Vyx=<qoJvA!{~Jup!%@qk7Rn/KvyD!}''[xz;>wkh'?Rh,x8gyt`w5D!&),(SgyccRgztJ@3pPB5p#d'(Y#<]mmifubw&RgoJvE&!82s^JvF&!8Rf,ADb]~;x=h'rNu]vK!,%'*0RnORh)4Rh*AqQg-vaRnNg;wHwkh'ba~4cE#Ta*x3gctyw@'!+%RnFRnD<4Rn@hFvK5RnCxWg[#`&a0Ua()`1Rm75Rg[c]%X#qi8Rg^NvdRj>BwzgZauwji7Rm6A4wgg]d1#&(*,.0a#Rm;Rm<Rm=Rm>Rm?Rm@RmARmBe%#^^^Xaea?aC/b+(,!a+a#!a/!>a&Ta<aKbD!2wphBRnk[yPw}hE|.=Br-3Dtm>6Vy~g6urRf.x,hPrNav!%'RnqRo%Ro#Nu;q[Pw;5r+JwNZtM@3r)d'#Y'Weh;xChL#`&RnmRnoKu}>%(!Rne~Bs-;2wjcussJv+'!aYSO}6@B<5?ba~8LrNvj!.%*ROwungw~ng~:9;Ri^>wtnig;wHRnixDh@|(UZ.x1h@|)!#:2<H|*xHn]#-UX'3Ro)z=iT}6ARns=Bwsn_wpnaRncw]aR(#UXa&Ua*a/=]iPd'#Y&Ro'WnXf{QRm2hNvj]nZd`'T~&1`{|`#9b]{}c:'!#Wl{>@=be}]?cl{{U#:5Abb}Jds#^YaF!a*b4a#a3aPa>&Tb!bH!*a_!Eau?/a&RjY<]gj>6Vz*;:pe~DrZg,QRj1JwNZtX@wihspcJvZ&!VyX9WmOJu|!|N2WmHJvh&!]ht~Bpbcn&T(!#RmQ<s7Nu;padH#X'`+WmJ@>RmKCARhnKup=!)&Wf+:RhqNuPpf9c!#'45pd5AwghpARn(Ls@w!%,)!RmP@Wfe<E|IJva!&WmNg8vsRmLd`*.`#Y'Xa!axRn*]hrA8Rhug5s@rXg8u!RmMd8#X'X*3@rV72smdI*#UY&RmICARho~GsgxVgd)Ta'U-Y&Xa!T#RnEWnA@Wffg1uDRi0hFvK5RnBxGnG&#`%owp)@wsf+bX}Ze-*1!a*^^^Ua|!#a.aq&Ya2!a>.a6!a:aO`aJDtL[y`@Wg#>6Vz12@wzoYRoZNuPRi!NuPRhzg=ucRi,@=b`{Yg=ucRi-ACJvB!&Sh[ebSh]ebi`wUuFRm4Jw2_[y0JvB!.<Ju(!&SoG}6Shd}6<Ju(!&SoH}6She}6Kur@._g5vHRieJvx!{L2G{Kx6gd'T#?Rh82Wi5cZ#X(g1w)Rm5dW-Y(Ta#!a)!#aYa=wnfE=su2>>bU{0j9udv:<svj8uQv-7RgHdE%#^'sq9sp=>Bb_{TJv`!&g/r|snj6v(us5d,#Y(56H}[978H}]Jw5!&g1rushJvB!+j;v{u5?zDhd}6}bj;v{u5?zDhe}6}ce*#`(^^^a[aea!=!a6a*aoXb1a.!aAbL!b>,b'aL!aV@Wf|2Wlg3[y/JwNZt^@3piPw:5pgJunZou3@rsJva&!Vy_g<v~Rm#JvG'!6Vz0=<r{Ju{%!:pj@WfsiXuJu3Rm:JvZ&!WfA~Bph@c4Z&Dtwax5rubx(#:awRk1@d,#Y&RfjRfid1#,Y(@Wfp2Wlrg5s@ryKu[@!,'=]ig9wlk?Rk>g5u-rqJvy'!@9RkQcH(T#=>Ri~@<wkj(Wj(KuZB*!&<7rw@9RkRcH(T#=>Ri}@<wkj)Wj)dg(Ta2Xa9X#`-!a*CARhg@@=I}d9x;c~#X%so=<sj>2@@=aybb}XjWv0Q~EfEj3vLv;<d,#Y(56H}`978H}_dgaPaFa'a/!#a3Y0a_a;a|!1(a7-[yE3[xt;:pJNvZrrg3uJrvJwNZt=@3pIh=rt3rxPw:5pGOu!5rpJvG'!6Vys=<rz@c4Z&Dt(ax5rtJvZ!&~BpH@wsfNg-vaRlNci*U#=<wei<F}a5@Jq.!a*JQ!%@qZ23d(#Y&RjH5]jCk!u7w&u0udARjFd/prq=tyvpaEa(a:.!a1aZ(@@=I}:9wpd%=<sX55w_h}@@=I{t=ay<aU@@=I}T=ay<2@@=I})?C9:9au@9Cb]}DP~=x-fAZ(2Wl1=ay<aU@@=I}>5@d##Y+jTv|vV~EfFj]uNpn~FRfGdgaK!Z2&!a8a-Tb({E!acTbM*!a(DtY[yYd'%Y#sl[y*hHvh>Re5x2c{Z}.j4uCvcawRiMd+#X+_x&d!},<5RkX;2Hzw@x,gavfB-!{CcF&T#Roe;RodwWbBg5urRgaKvHC*_6Vz+<4opieuew&Rmq@d]&Y)X,T#X0Rh}<BqP=4qS9:ReMg/ujReNJw0!/<Jui%!bd{kawwnemRelAxUa?a3#*.&UX(Ya+a/RhvRnQ<o}9Wmtd-#Y&RgSRmw9;Rmxay=Rmyg-vaRmuxEhSrNu,v-voC!%(aR.a(a7+1Ro1>Ro5CE{A9b]{@;5x#eO{:g;urRi+KrNA!%(Ro3>Ro79;Ri_Ku@>{;&!x%gX|{KunA_+g5QRj/g3u5Rj#g>uERj%wio/xRhS&!,!#^1U}wba{8>>@=be}qC@:D5ba{7Ku+A&!}x?ba}t>>@=be}se(aA^^^Uat!b0#{pa+awUazbGa#aLb9bgaWac'a5TbS=Br!d1#`%scp_Jvl!#rT>Re0JvX&!VyN=H{Fcm#U&:pY=ReaJv2&!]h0=]nUJvG'!6Vy|=<r%JrM_=]h2@Wlud'#)U'Wf'b]{i=]h/Jvh!&~BpWg=v]RnMx+ny#'Nu;pVwjnu=]nwxJnx,T#`&Reqwjnt=]nvieu9vrRjLLuYwP(#+!th@wih5pX~Gr'g5v/Rh4KunA'!-CARnP@wwiN:Rm_9x'cvw>!|l=<saKvAA!0&3@q}>w^e1bp#&Re2Re3BDx7gH#T|f5H|eKuZ>!%(:qNAH{]Jv6!+3B2B9=b^{X<5<B92:E{ZLvhwA(a;a%!igQuyRmad+#Y}m@3Rh5d8#X'X*:AqUAHzmaxwbh<aXRnVcF}RT#Nw&cj#U(BWnug/vsRntdka)(a3+.Zb7aYYan1!bVa@Xa}[y^@b[{G=H{+hFu73Rj&Pv#5ReQcK%T#sig1v{Rj'Ku+D#'!t]~Grm~?rkKuMB!01d5#`'Vy.ta3Dtu~Hroc8#'{^45s85AwZbP&!#Rn!wghxWn#KvEA!)&2RlA2RlBx:h|#(T,=]j09Wobz>x]z/@awRoTd+#Y(az]hFhCrm4d,#Y+jTv|Q~EfMj]uNr|~FRfOdCa!Xa9_X#@<plJvf!%b`{(9;Rgwc;.!#2x7cw#T|UDb]|T5Ju={(!=@E{&Jv)&!Ab`{'awJvf!~*>>@=be{#KuY>!+&4Ezyi[ugv&RjIdea+T)#UXa&T-T&a!Rh9auRmW=]kLg5vuRn+g3u4Rn-Ow6ARn,hHus5xNk?#UX(U~)/g8v0RkD~AwkkF?Ri.OuNBwkkA?Ri/d|a2`a*^UYa.!aBTZaTa'Xa;!(!2!-a#b2[yC>6Vyq3[xr2Wi?g1rusVh%s?DtF~<5rbJs;%!DtBfswKtCj[uvuSsEu3RgVx3o:u+wN'*Zt;@3rd~Grh~?rfg8w)Lq)qE&-a%!>bI|`jWv0vV~EfCjTv|vV~Ef@j]uNpn~FRfBcK#T']gWNu7x,k7q4ai(0!hHv8<RhmkMu9vrsBuev/RhlCJvB!,g<v{wchh~@:Rhji[vrv{wchi~@:RhkdS&a5UY#Ta!RgPwwiI5BwciI~@:Rh`x'iJvj'!5]iJPu8Bwch]~@:Rhach)U#h3rp]gLh@t|Ax,hTq3ah!-(~@:Ro0Ou!5RhXj^v(pyw8unRhVd|)`,^UYas!a?/a2Z'a^Ta{Tb7Ta(a#!a,Wf&9sZ3DtAadamov=Bqt3[xig8vsRm~>waiL2b`{QJv*_Ouv2qgj<v]v2BqfdR'X*X#Y-@3qr~Gqv~?p6hHv-]glPup5Lq+q?_%*b_{qF{n9b^{rOu4ARhpKvCD!+&~Bqp:5Dbb}nwoiKl&unuTuBv]v+ueunaXRf0=Jvh!0nKufu8v1w&w7q%w&uHrz:Rgnj5w,uxDJq/(!hNw'5ReCk0s2u3w/w'5ReFd>Za&!*UaA=<wkgsRnSJv^!%Refifw3vyRgOKu_B'!,<]gkiiu:w&Rh<=C@a^<B57@2F{[<B5@aW:=3away9A5aW=<B=C@a^<B57@2F{Ie-#`(^^^bCara.b8aza6!/bZ,!adTbnTbOb+aFaS!aAT9@Wf~2Wli3Dtl2@d,#Y&RfnRfmJwJZtN~GqyJva&!VyMg<v~Rm%iXuJu3Rm9Jv[_=]ih9wlkDRkCd1#`(@Wg>2Wls3cH#T(@<Rj*=>Ri|b~'#23s9h<~El.d'#Y&Dtxi^rzvdRl#d*#U%(o|B2s`hJwSaxRmDKv4B&!1:Rmdd5#`'Vx}to~Hq{x'f1v3(!BA5ba|bJv_&!Wfug1v]ReIdO+U/Y#&G}-8wze=Rh{g1v]ReHg/uQRf/by#)ibQwERl/cH#T(@<Rj+=>Ri{cNu+vlax-!(#a0qa9<Rii2;;bU{H;x<i=&X#Rk`<4wwi=C9H~8xAI(Y#<azRi@45wXI<B9;5bb~7dL(X#Xa(+!aL6Vy{g5QqOau:5au2@ay547EzbxOcU(UX-T#Ta#:Cbb|A?wjh/b_|SOw6ARgtihr}u7Rhy<d1#T)X1@@=I|~=ay<2@@=aybb}Sj3vLv;<d,#Y(56H}A978H}@dGpvs@uAu`vcw9*!aFa+ai%(b!aXa8.a?a[ozWey=sU2@G}Nch&U#Rf_WexKu+D#'!t:~Gr`~?r^j]uNr|~FRg*j^psurwJt|RmcKv)@&!)7Rkv~Br[@wxfO:Rl3co#U'6Rezj_q#vIuavjRltwzeyh@vr5JqD0!>aY?C9:9au@9Cb]}9cl#U*5;5<H||jbuus1ucv&Rfvg1v~d/pppzqFr^a--a~!aMat1(hFv;Wiz@@=Izoj5uuv-7Rix~Cw`fk2WlVcZ#X,k)u3vWs@u2]ktg;wEx'fBq(_2Wg/jTv|vV~EfoJv]!15x'hzqG!(P~EfU~CRl_j6v(us5x4i-#T(2WmZ?C2F|d>Kq<aj1!*jTqIsBv=Wl`~Cw`fi2WlWj`v0u*~>RlR=c>Z,k#u3vWs@u2]kr<c1Z+jTqIsBv=Wla~Cw`fm2WlXdmb3!a{(arZa`bkTa%TbQTa-a9+c'!aM!/[yL=Bqug.w'RifhFvyDRj.g>vgwyk^9]k^Jv3_@WfbAARkhJw2_[x|JvB_wkoIRoKwkoJRoLd'(Y#<]gm=<9<H|yd'%_X#skDtb3awwqkgNulRkgdB#^',9:p'hJwSaxRmEBwVb8@4=H|qLu+w50&!)@3qs~?pU>Awwn;;Rn=c:Z'ARn<=<qwKvC@!/&~BqqJv6!&]eVb^z^xRge'/a%+^`#Sge}6<4Rn3=]n0Pw2>Rn8Jw0!&>Rn:>Rn6cY#a7+!a&=<wkaNw~h3z_c5Z{=wjh#=]nLKv^D!&)Vyz=bW|swYb<WetcG#T(2wxa@qVx@gD#Y&b^|V5JwG&!5bb|pg/w&RgD@x=kHs=uAvn!a%%/'+RmSRh694Ro`g-vaRmRhHv-]mlxCcS#`&ba~.5cD#Ta)P~=d,#Y(56H{>978H{Dd_#{2^Y%_+qbbb{6g3sERhsbU{?dfa.,`a(Xa<!aiX#(55RiG54RiHcI#T'WiU3RiVNvdwtfcRlKNvdd,#Y&RlHRlExQgf.1*^T'X#Sgf}6Wn4=]hfPrk>Rn7Jw0!&>Rn5>Rn9Lunw?&a2!,5<oq@@wqfdRlJj5Q~=d,#Y(~ARfcOuN]fdDKw;ay(}i!547E}j?cI#T(@5bV}iCbV}hdv(^^Tb?a40,b##Tbo!a*bR!a<b|a/!aKai!aU[yK=]o^g:v>ReGJwPZtK<7Rh+h<~El,Pv#5ReR@awwxjCg,ulRjDJv6&!]j!z?aQeeg>w=Sh<eeJw;!&axEzOg,Qosc!#*:wkeJ]eJ>x'h-u(!%Ro.w~h.zPdNZ(X,Ya![x{;9ReY;wkgxRiF:x?ap#Y&RmUg<s2Rkod]+UY0TZ'!a&A9sw<=bczLNvuw{gqzNhJwSaxRmCKuLay!#&s_Rf-55b^{uJvZa!!c%#(55Ri654wmiu5RiuawLu,vp!+}^%b_}Y9;wkgxba}o>A9:=b^}zKuh=a''!3awRk3c*'!#aHRk6c+Z&Rk5Rk4Jv)&!awRjSawd9*`#0?C2@EzMj8u<uJ5RmbjQrquJu3x,k>uq@_+=ayb^|W~ARkEOuN]k@7dhzV^X/X&a-#zRzSb`zXcJzTT#2WkVKvDBzW!%FzY9;5bbzWjQrquJu3Jw3%!b`zU=ayb^zQd:#X(T-a!6Vyywxh}=b]{Jg=u1RiAdGp~qHtzv!w(wA+a+a;<!aJaYai'anasb(=azRmV:Cbb{MLq2vb!%')RjuRjrRjtRjqx3jnqCw3!%')Rk(Rk+Rk&Rk)Lq2vb!%')Rj{RjxRjzRjwLq2vb!%')RjsRjpRjfRjex3jcqCw3!%')Rk'Rk*RjkRjl9<CbbzfOu4ARhxLq2vb!%')RjyRjvRjhRjgx=joq*uKvb!%')+-Rk.Rk%Rj~Rk-Rk#Rj}x=jdq*uKvb!%')+-Rk,Rk!Rj|RjmRjjRjidAq&qKs@uAv8Aa.'*-a@a&0!aM@a5[y73Dsy3Ds|3Dt):wxgI2sHJwJZt.~Gqxwsf0ikrzt}Rl0Jvy_[xj~HqzKv_A|D!&WfP8axRoVcf,U#k(v]v+ueunaXRf1Ju}'!g8u#Ri=jQw!sCunLprq>!,')~<5qeGzq9F{W=c##%s5au:5aU3CBE|;d4#X(D!a&6Vygx(b;#(=]ed?C2F{N<capoq2r[a&!aPa9,'Pw;5s:@@=I|,55w_h|@@=IzcP~=x'fCqB_2Wl2>aU@@=I|1OuNBc1Z+jTqIsBv=Wlc~Cw`fl2WlZ~AcTa%!Z+jTqIsBv=Wlb~Cw`fh2WlYk+uNqJsBv=WlSg,u3dca3#UXaMYa)TaB-=cM|7T#<bI}l5@B932:aV2G{BOuNBJq:|M!5Ezt=<B=C@a^<B57@2F{v>cB{/T#=ay<bI{3Jv6!a.6BKq0ah&+!5E}HP~Ef{978BaU@@=Iza<7d#.Y#978BaU@@=IzH~AJq0!(@@=IzG978BaU@@=IzFe,aU*Y&^^^bvJb,b:bFad!a,c2Ta>aL.bo6!a#CbTa'T#Re{2Wlh2@G{yg6t~Ro_NvdRfticuRQRllJv3&!x&c|zs@Jw3!%RflwpfkRlpKuL;%(!Re<@G|C2GzdhIvuBwgjAg-u0RjAKQB%!(GzZ@G|5NuuRl7d='T+Y#Vy[g<v~Rm!==G|>JvA!)@wma=]m1ifuaw&RmnLs@vT'!|/+[y,g:v>ReTJw1!#qX=x!eC{bLu+wT&)ZtZauq_~Graci&U#F|89:r_Lupvq!.)&2RlG8RfaC=x!eF{_h?rpWlmd&'!#X|&]k::xJey#`'T|+<E|&2@H|%dE#(^,g;u.RiEg6vjRiC9xCkA{O|zY#g=ucRmXKs0@!&*@G|m@awRknJuh!,3d(}gY}eJvj!%Rm):Jw3!%Rm+Rm-Ls0w(&!a(a#@b[|6cZ#X'7RkxWgAOu4ARn'dH'U#Y*Vz-Wm'CARm}d]*#a%^a*T'aK!a<9bV{PC=p*Jw4!&SgxcbB5r]idw(wBRmF7xFkt#&`(Rm/Rm8E|!JuY_9:Rl5=wrgr2:bbxd@xXfB(a*#T+!.X0X1Ta/a'T&RlDRfL>RlyARl9b[z[>RfZ:RlL:RfRwlg/ARl;9;RlxKv,A/!%7s69<74=BA5ba{-8Bde#`a<XaKYa1,a'P~=wxfB2bZ}}?C972@@=I}r8@55B9;5bb}G978B2@@=aybb}3j3vLv;<Jw3&!>Rfk=ayb^}4~Ad1#`*@@=aybb{w2@>==<bbz]dx+UY#^UaF!a9!bB'Ya1.!ajXa#%olRhD[y=3Dt#Ov5BrHKuMB%!(Rf^Wep~HrJwkiQjKr|~FRg)Ku+D#'!t5~GrF~?rDdV)UY,Z/_7RkuG{<~BrBg,rlsO:235B@bX}|d?a1!#`(6Vyn5@d##Y+jTv|vV~EfIj]uNpn~FRfH7Lq2vb1!a9-978BaU@@=Iz9978BbU}#~AJq0!(@@=Iz8978BaU@@=Iz7~AJQ|}!978BbU}!JvkaK!AdUa21-U#`a+(g/vsRn~Ou!5RPj:rmu9WhOjXuvvNr}:RhAj^v(pyw8unRn[kPr}p|u7vwv]RiSBd;pppzq@qHQa?(b.!a.a`@.|xa(hFv;Wiyj5uuv-7Riw~Cw`fg2WlU978BbU|wOuNBJqG!(P~EfD~CRlQcZ#X,k)u3vWs@u2]ksg;wEx'f@q1_2Wg.j]uNpn~FRfqJv]!15x'h{qG!(@@=IzK~CRl^j6v(us5x4i,#T(2WmY?C2F{1>Kq<aj1!*jTqIsBv=Wld~Cw`fj2Wl[j`v0u*~>RlT=c>Z,k#u3vWs@u2]kq<c1Z+jTqIsBv=Wle~Cw`fn2Wl]dn1#c(a(b^a2!b/bAT(bj!aDa7bu,a_a{c0!2T0g:v>ReD2@G{42@G{5~DpM~<5rc=Bx6i>{RT#RnI@zCx]y]z:2Jv[!zr5Awyk]9]k]dD(Y+X#6Vz.g=wKtgwhaCwgmTWj2Lu,w%_+/[y-B;b^xeg3u3Rj-2@bX{*KrJ<!+'@Wg(g?QRlC@Jv`!%b[zIwsfII}8JQ_@w|kW|=Jv(%!AqcOuNBJvEzh!bYzjLs@wP#(0!oy@>RkdJwMZtc3Dtd@BcG#T'9bWxg2@2Fznd*#Y+;2x'c}w<zizixNgwa#Z'U+!/!a'!a+w~g~z6wcn{Rn}wcnzRn|5Rh%=]nJg5vuRmvNvdRlvcprJu}w*az*a#!%.a.'Bot9qT]kj@Wg'ay2Gzv@Jv`!%b[zEwsfHI}1;ck#Ux`<Cbbx_Lu+w!a&0*!wko*wwo,So,}6Juqxf!E}PigQuyRm`d3(`#8>Rn%:A5B;bZ~%KvhCa!a2!x>k7#Uxb@b{#xaRk7Jw0!)>wwhlShl}6>wwhmShm}6CJvB!.x'hhvj{!!5Bwkhhbaz}x'hivjz~!5Bwkhibaz|xEhTrNu,v-vpD!a%&/)a3a.,%Ro2t[CE{)@3re9b]{%wjo09:rgc:Z&Ro6=<riifuaw&RmoKrNA!%(Ro4>Ro89;Ri`dSaL'UYzxZb)7Rka3xRhT&!,!#^1U}vbaz{>>@=be}yC@:D5bazzKu+A&!}{?ba}y>>@=be}wxBh[t`u~vJvr!%a!a()a,a0a4RoC=]o;Ju(!%RoGRhdwjh`=]oAg>w#Ro?g5vuRo=NvdRl|Ku]C.!&;RoEJvB!%RoORoMBx'h[v+_?w~h`}~5?w~hd~!xKh]oiptu-utv.vp!#%&a30a@a'a+(a/aOp(o~p!RoDJu(!%RoHRhewjha=]oBNvdRl}g>w#Ro@g5vuRo>c[#X']o<CauRoRAd-#Y':RkpauRoQKu]C.!&;RoFJvB!%RoNRoPBx'h]v+_?w~ha}t5?w~he}ue!/UbhYacXaW^Tc&a;b:a-c/#b&aja1(!cL+!bKbt!bmcRc9aIc?8[yW3Dtt94Rg`Jv}!&SiRMzBhEebShEMNuPRe>x7gL#TzuwjirRipc<Z&>on;>z=h-MSh.Mwqczx'a7vj&!>Re4@=ResJt__NuPRi*NuPRi)j]uNr|~FRfzKrJ>_+@Wfy@Wf]2WocKrJ<!+'@Wg%g/QRl@@Jv`!&awRl<wsfFIzgLu(w*!.*&ShBMwvhIRhI9;RhNx1hK'!#Sn]Mx1hK~0!#:2<H~7cNu+w7D*'1ZtW>Rn1~?rOc:Z&Rn2=<rQ<7wjh&=BSnLMc]#X(6Vz)w[b=a!U#9wzgMc3#&(RgMRitRis<x,gKt`ax!&+SioM=BSilMc3#&(RgKRinRimKurB,!&SiQMzBhDebShDM6BJQ!(P~Efx978B2@@=I}WLrJw!!,a*&@G}O@9wkibRid@@x'fKwC!&SlDMSfLMjUv~Q~EfKKv3@a+!(hFv-]mpx/hYZ(C5RiWz<o/MwkhY?So/M@x,gbvfB*&!SgEM:SoeeehFu3:Rgbda(,^TZa)X/7Sg[eb:2RgI~BrMC@wgkc:wwkcRerx3h(uUvK!&*,SnOM4Sh*MArRg;wHRh(x=h;rJvPwI!a4',a'0@Wg&=BSh/Mg>w=Rh=g3w*wwgGRgGcW(X#;Sg}M2Gzk@Jv`!&awRl=wsfGIz`dKZ*T'Y-:RhR7RhQg5u-p`j6v(us5d,#Y+~Awkia?RicOuNBwkibba}Ld6p~tyu_vbAa'a+!a/'a3aEa8a!>Sh,ebJv{!&Sh@ebSaReb9;SgwebNuPRi(NvdRl)NuPRi'hHu^<Rm^Jvv_@Wl(g;u1Si/ebKu'B&!*Sh?eb@Wl'z@aPeb95Si.ebcpputyvjB)!,&a+0a%ShAMWeK@G}C@WfJ9;RhMwvhH9w{ia}ix,hJvRA1(!zAn[MRhHx1hJ~*!#hFv(BSn[MBJQ!(@@=I~'978B2@@=I}2db.Ua<'X}+T#a0XaG2G}E;wkg|wuh!Rh!x,hZu,@)!&So0MVy)C5RiXACJvB!&5RiY5RiZg8w)cG}*T#2@bU}=KsA>(!a.3wkhZba~(x,h^u(A!&(SoCMRhb5Bz=h[eb?w~hb~6x,h_u(A!&(SoDMRhc5Bz=h]eb?w~hc~6e)aA1T#T,^^^c-bMb&blcPaP(a/!0!bA=b5c@a(!bfbrc#2afwmhARnjwchORnp2Wlf3DtsNvdRl-2@wpa<]m0bx(#:awRk2@Jw3!%RfhwpfgRlnKQB%!(G{V@G|'NuuRl6d='T+Y#VyUg<v~Rl~==G|<Jv+'!aYShC}6@B<5?ba~8@Jw3'!g2QRljhLrpWlOd+#Y'g.w'rIg>w*wgj@g-u0Rj@Lu+wT&)ZtUauq]~GrGci&U#F|39:rELrNvj!.%*RhCwunfw~nf~:9;Ri]>wtnhg;wHRnhx3hDs@v~!/+'@Wfr@9RkSNu&Rlo=@<5GzoKs0@_+@Wl+@awRkmJuh!-3d(}pY#qWJvj!%Rm(:Jw3!%Rm,Rm*de&!1U-U#`)Re;@G|.@9Ri82@wjfvRlq=@<5GzpLvOvr!).&2RlF8Rf`C=x!eE{.Jw3_g2QRlkhLrpWlPde(!#U{s,UXa*Ta'[y'g:v>ReS;x0PZ&RnlRnn~HrKJw1}f!=x!eB|2w]aP(#Xa&a*Ta.Ua2a7=]iOd'#Y&Ro&WnWg;u.RiDg6vjRiBNvdRlzhNvj]nYJuW_2Wm3x)kFze{9d])!a.!,Y01!#&aC!a3RndC=ox~BrC@2b^{pg,rlse7x'ksuq!%Rm.E{xidw(wBRmGx9o+)X#wwo-So-}69:Rl4@xSf@a#XZ'X)X,Ta(/ARl8b[xc>RfY:RlI:RfQwlg.ARl:9;Rlwdn'#^XafaQa1X1TaHTa)@b[{zcZ#X'7RkwWg@Ou4ARn&x)kG#{,g7u/RkGdH'U#Y*Vz'Wm&CARm|bx#(A]gUbUzJj9Q~=d,#Y(56H}l978H{U7d,0#U*2>ABb_xZ978BbU{e~AJQ{g!978BbU{hxMh?ad{oUYZ.x1h?{l!#:2<H{mx3n[t{vl!,&a%3Ro(z=iS}6ARnr=Bwsn^wvn`Rnbd`*T}B0!#^X'BG{c9b]{a>>@=be}F?JvS!&BG{d7BG}(Bde#`a1X,Ya@!a'P~=wxf@2bZ}I56B2@@=aybb}08@55B9;5bb}<j3vLv;<Jw3&!>Rfg=ayb^}&OuNBKuLA!)a!P~=x#fD{f2@>==<bbzl?C972@@=Ix^d6rSu,v7w*C(0a)a6#B+a%!sQ[y?3Dt%3[xn~<5rLOu!5p@Ku+D#'!t7~GrP~?rNKvlaya7'!h+v-5qMg=t|cd,U#5AAaa5Abb{S@52B5@a[@52B5Gx[iXueu;d<#`a(!/549C;ag>23ExY5@Dah89b^~689Jv)!~2b[~1Lv'w(%*!a#bX|aPrmawRe]keu7uhv-q6rxu,q`xTo]/a5aU!bNaDXbi!b-!ao!b<bwA!#5@B932:aV2G|:d-)Y#hJrL>RhG<7@C5<H|_=Cau:5aj5@B932:bJ|ng>vIbs)#?C2F|9jPv0w.vISh-MKvUaz(.!9ABbb|[5;5<H|Eg>unwfh;9:4E|YjQsBt|vjx'hYq3!(?C2F|J:2<BaY?C2F|GOu!5x,g|p{ah!-(?C2F|c9:4E|OjXuvvNr}:Rh&i[w*t|cd+U#jJvsu)vsSn~Mkfrmu9p}u7vwv]So!McW#Xa!ax5@A5aY:5;5<H|>kJv~vYrquJu3x4ib#T)2@SmZM?C2F|Bj:rmu9@xPhI(a*a#U#`a3-5Abb|L~@:RhK9:4E|0@52B5G|#C::aY?C2F|-:2<BaY?C2F|.5Jvk!a)javYrquJu3x4ia#T)2@SmYM?C2F|HAxPhH(!a#U#`a*-5Abb|4~@:RhJ9:4E|R@52B5G|F:2<BaY?C2F|Sc^#Xa2j=Qq5CJvB!-g<v{z;hhM?C2F|Zi[vrv{z;hiM?C2F|XKsA>!a)-g<v{z;h[eb?C2F|]i[vrv{z;h]eb?C2F|^iZu.vix,hZq3ah!.(?C2F|QOu!5ShXM:2<BaY?C2F|P", 13494, 2713, 49, 25, 61), he;
(function(e) {
  e[e.VALUE_LENGTH = 49152] = "VALUE_LENGTH", e[e.FLAG13 = 8192] = "FLAG13", e[e.BRANCH_LENGTH = 8064] = "BRANCH_LENGTH", e[e.JUMP_TABLE = 127] = "JUMP_TABLE", e[e.VALUE_MASK = 8191] = "VALUE_MASK";
})(he || (he = {}));
function ut(e) {
  "@babel/helpers - typeof";
  return ut = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, ut(e);
}
function Gi(e, t) {
  if (ut(e) != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var a = n.call(e, t);
    if (ut(a) != "object") return a;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Xi(e) {
  var t = Gi(e, "string");
  return ut(t) == "symbol" ? t : t + "";
}
function O(e, t, n) {
  return (t = Xi(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
var we;
(function(e) {
  e[e.AMP = 38] = "AMP", e[e.NUM = 35] = "NUM", e[e.SEMI = 59] = "SEMI", e[e.EQUALS = 61] = "EQUALS", e[e.ZERO = 48] = "ZERO", e[e.NINE = 57] = "NINE", e[e.LOWER_A = 97] = "LOWER_A", e[e.LOWER_X = 120] = "LOWER_X";
})(we || (we = {}));
var Rt = 32, $a = 21, Yi = 2097151, an = 2047, ja = 0;
function Vi(e) {
  let t = e >>> $a;
  return t === an ? ja : t;
}
function Qi(e) {
  return e - we.ZERO >>> 0 <= 9;
}
function es(e) {
  return (e | Rt) - we.LOWER_A >>> 0 <= 5;
}
function ts(e) {
  return (e | Rt) - we.LOWER_A >>> 0 <= 25;
}
var Sn;
(function(e) {
  e[e.EntityStart = 0] = "EntityStart", e[e.NumericStart = 1] = "NumericStart", e[e.NumericDecimal = 2] = "NumericDecimal", e[e.NumericHex = 3] = "NumericHex", e[e.NamedEntity = 4] = "NamedEntity";
})(Sn || (Sn = {}));
var Tn;
(function(e) {
  e[e.Legacy = 0] = "Legacy", e[e.Strict = 1] = "Strict", e[e.Attribute = 2] = "Attribute";
})(Tn || (Tn = {}));
function ns(e, t, n, a) {
  let r = (t & he.BRANCH_LENGTH) >> 7, i = t & he.JUMP_TABLE;
  if (i) {
    if (r === 0) return a === i ? n : -1;
    let l = a - i;
    if (l >>> 0 >= r) return -1;
    let u = e[n + l];
    return u === 0 ? -1 : n + r + u - 1 & 65535;
  }
  if (r === 0) return -1;
  let o = r + 1 >> 1, s = n + o + r;
  for (let l = 0; l < r; l++) {
    let u = e[n + (l >> 1)] >> ((l & 1) << 3) & 255;
    if (u === a) return s + e[n + o + l] & 65535;
    if (u > a) return -1;
  }
  return -1;
}
function Fn(e, t, n) {
  return n === 1 ? String.fromCharCode(e[t] & he.VALUE_MASK) : n === 2 ? String.fromCharCode(e[t + 1]) : String.fromCharCode(e[t + 1], e[t + 2]);
}
function as(e, t, n) {
  let a = t + 1, r = 0, i = a;
  if (a < n && (e.charCodeAt(a) | Rt) === we.LOWER_X) for (a += 1, i = a; a < n; ) {
    let s = e.charCodeAt(a);
    if (Qi(s)) r = r * 16 + (s - we.ZERO);
    else if (es(s)) r = r * 16 + ((s | Rt) - we.LOWER_A + 10);
    else break;
    a += 1;
  }
  else for (; a < n; ) {
    let s = e.charCodeAt(a) - we.ZERO;
    if (s >>> 0 > 9) break;
    r = r * 10 + s, a += 1;
  }
  if (a === i) return 0;
  a < n && e.charCodeAt(a) === we.SEMI && (a += 1), r > 1114111 && (r = 1114112);
  let o = a - t;
  return o >= an && (ja = o, o = an), o << $a | r;
}
function rs(e, t, n) {
  let a = Ki, r = e.indexOf("&");
  if (r < 0) return e;
  let i = e.length, o = 0, s = "", l = a[0], u = l & he.JUMP_TABLE, p = (l & he.BRANCH_LENGTH) >> 7;
  do {
    let h = r + 1, f = e.charCodeAt(h), m, d;
    if (f === we.NUM) {
      let w = as(e, h, i);
      m = Vi(w), m > 0 && e.charCodeAt(h + m - 1) !== we.SEMI && (m = 0), d = m === 0 ? "" : Hi(w & Yi);
    } else if (ts(f)) {
      m = 0, d = "";
      let w = f - u, k;
      if (w >>> 0 < p) {
        let v = a[1 + w];
        k = v === 0 ? -1 : p + v & 65535;
      } else k = -1;
      let z = 0, _ = 0, y = k < 0 ? 0 : a[k], C = h + 1;
      e: for (; C < i; ) {
        for (; !(y & (he.VALUE_LENGTH | he.FLAG13)) && y & he.JUMP_TABLE; ) {
          let D = y & he.JUMP_TABLE, L = (y & he.BRANCH_LENGTH) >> 7;
          if (L === 0) {
            if (e.charCodeAt(C) !== D) break e;
            k += 1;
          } else {
            let J = e.charCodeAt(C) - D;
            if (J >>> 0 >= L) break e;
            let Z = a[k + 1 + J];
            if (Z === 0) break e;
            k = k + L + Z & 65535;
          }
          if (y = a[k], C += 1, C >= i) break e;
        }
        if ((y & (he.VALUE_LENGTH | he.FLAG13)) === he.FLAG13) {
          let D = (y & he.BRANCH_LENGTH) >> 7;
          if (e.charCodeAt(C) !== (y & he.JUMP_TABLE)) break;
          C += 1;
          let L = D - 1, J = k + 1, Z = 0;
          for (; Z + 1 < L; Z += 2) {
            let $ = a[J];
            if (e.charCodeAt(C) !== ($ & 255) || (C += 1, e.charCodeAt(C) !== ($ >> 8 & 255))) break e;
            C += 1, J += 1;
          }
          if (Z < L) {
            if (e.charCodeAt(C) !== (a[J] & 255)) break;
            C += 1;
          }
          k += 1 + (D >> 1), y = a[k];
          continue;
        }
        let v = y >>> 14, b = e.charCodeAt(C);
        if (v !== 0) {
          if (b === we.SEMI) {
            m = C - h + 1, d = v === 1 ? String.fromCharCode(y & he.VALUE_MASK) : Fn(a, k, v);
            break;
          }
          if (v === 1) break;
        }
        let T = ns(a, y, k + (v || 1), b);
        if (T < 0) break;
        k = T, y = a[k], C += 1;
      }
      d === "" && m > 0 && (d = Fn(a, z, _));
    } else m = 0, d = "";
    m === 0 || n ? r = h : (o < r && (s += e.slice(o, r)), s += d, r = o = h + m), e.charCodeAt(r) !== we.AMP && (r = e.indexOf("&", r));
  } while (r >= 0);
  return s + e.slice(o);
}
function Ua(e) {
  return rs(e, !0, !1);
}
var is = /* @__PURE__ */ St({
  arrayReplaceAt: () => ss,
  asciiTrim: () => Ft,
  callable: () => Pa,
  escapeHtml: () => Xe,
  escapeRE: () => ms,
  fromCodePoint: () => dt,
  isMdAsciiPunct: () => ft,
  isPunctChar: () => Wa,
  isPunctCharCode: () => pt,
  isSpace: () => le,
  isValidEntityCode: () => gn,
  isWhiteSpace: () => ht,
  lib: () => bs,
  normalizeReference: () => Tt,
  unescapeAll: () => st,
  unescapeMd: () => us
});
function Pa(e) {
  let t = function(...n) {
    return Reflect.construct(e, n, new.target && new.target !== t ? new.target : e);
  };
  return Object.defineProperty(t, "name", { value: e.name }), Object.setPrototypeOf(t, e), t.prototype = e.prototype, t;
}
function ss(e, t, n) {
  return [].concat(e.slice(0, t), n, e.slice(t + 1));
}
function gn(e) {
  return !(e >= 55296 && e <= 57343 || e >= 64976 && e <= 65007 || (e & 65535) == 65535 || (e & 65535) == 65534 || e >= 0 && e <= 8 || e === 11 || e >= 14 && e <= 31 || e >= 127 && e <= 159 || e > 1114111);
}
function dt(e) {
  if (e > 65535) {
    e -= 65536;
    let t = 55296 + (e >> 10), n = 56320 + (e & 1023);
    return String.fromCharCode(t, n);
  }
  return String.fromCharCode(e);
}
var Ja = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, os = RegExp(`${Ja.source}|&([a-z#][a-z0-9]{1,31});`, "gi"), ls = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function cs(e, t) {
  if (t.charCodeAt(0) === 35 && ls.test(t)) {
    let a = t[1].toLowerCase() === "x" ? parseInt(t.slice(2), 16) : parseInt(t.slice(1), 10);
    return gn(a) ? dt(a) : e;
  }
  let n = Ua(e);
  return n === e ? e : n;
}
function us(e) {
  return e.indexOf("\\") < 0 ? e : e.replace(Ja, "$1");
}
function st(e) {
  return e.indexOf("\\") < 0 && e.indexOf("&") < 0 ? e : e.replace(os, function(t, n, a) {
    return n || cs(t, a);
  });
}
var ds = /[&<>"]/, hs = /[&<>"]/g, ps = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
};
function fs(e) {
  return ps[e];
}
function Xe(e) {
  return ds.test(e) ? e.replace(hs, fs) : e;
}
var gs = /[.?*+^$[\]\\(){}|-]/g;
function ms(e) {
  return e.replace(gs, "\\$&");
}
function le(e) {
  switch (e) {
    case 9:
    case 32:
      return !0;
  }
  return !1;
}
function ht(e) {
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
function Wa(e) {
  return fn.test(e) || Ba.test(e);
}
function pt(e) {
  return Wa(dt(e));
}
function ft(e) {
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
function Tt(e) {
  return e = e.trim().replace(/\s+/g, " "), e.toLowerCase().toUpperCase();
}
function Mn(e) {
  return e === 32 || e === 9 || e === 10 || e === 13;
}
function Ft(e) {
  let t = 0;
  for (; t < e.length && Mn(e.charCodeAt(t)); t++) ;
  let n = e.length - 1;
  for (; n >= t && Mn(e.charCodeAt(n)); n--) ;
  return e.slice(t, n + 1);
}
var bs = {
  mdurl: $i,
  ucmicro: ji
};
function vs(e, t, n) {
  let a, r, i, o, s = e.posMax, l = e.pos;
  for (e.pos = t + 1, a = 1; e.pos < s; ) {
    if (i = e.src.charCodeAt(e.pos), i === 93 && (a--, a === 0)) {
      r = !0;
      break;
    }
    if (o = e.pos, e.md.inline.skipToken(e), i === 91) {
      if (o === e.pos - 1) a++;
      else if (n) return e.pos = l, -1;
    }
  }
  let u = -1;
  return r && (u = e.pos), e.pos = l, u;
}
function zs(e, t, n) {
  let a, r = t, i = {
    ok: !1,
    pos: 0,
    str: ""
  };
  if (e.charCodeAt(r) === 60) {
    for (r++; r < n; ) {
      if (a = e.charCodeAt(r), a === 10 || a === 60) return i;
      if (a === 62) return i.pos = r + 1, i.str = st(e.slice(t + 1, r)), i.ok = !0, i;
      a === 92 && r + 1 < n ? r += 2 : r++;
    }
    return i;
  }
  let o = 0;
  for (; r < n && (a = e.charCodeAt(r), !(a === 32 || a < 32 || a === 127)); ) if (a === 92 && r + 1 < n) {
    if (e.charCodeAt(r + 1) === 32) {
      r++;
      continue;
    }
    r += 2;
  } else {
    if (a === 40 && (o++, o > 32)) return i;
    if (a === 41) {
      if (o === 0) break;
      o--;
    }
    r++;
  }
  return t === r || o !== 0 || (i.str = st(e.slice(t, r)), i.pos = r, i.ok = !0), i;
}
function ks(e, t, n, a) {
  let r, i = t, o = {
    ok: !1,
    can_continue: !1,
    pos: 0,
    str: "",
    marker: 0
  };
  if (a) o.str = a.str, o.marker = a.marker;
  else {
    if (i >= n) return o;
    let s = e.charCodeAt(i);
    if (s !== 34 && s !== 39 && s !== 40) return o;
    t++, i++, s === 40 && (s = 41), o.marker = s;
  }
  for (; i < n; ) {
    if (r = e.charCodeAt(i), r === o.marker) return o.pos = i + 1, o.str += st(e.slice(t, i)), o.ok = !0, o;
    if (r === 40 && o.marker === 41) return o;
    r === 92 && i + 1 < n && i++, i++;
  }
  return o.can_continue = !0, o.str += st(e.slice(t, i)), o;
}
var xs = /* @__PURE__ */ St({
  parseLinkDestination: () => zs,
  parseLinkLabel: () => vs,
  parseLinkTitle: () => ks
}), Ye = class {
  constructor(e, t, n) {
    O(this, "map", null), O(this, "level", 0), O(this, "children", null), O(this, "content", ""), O(this, "markup", ""), O(this, "info", ""), O(this, "block", !1), O(this, "hidden", !1), this.type = e, this.tag = t, this.attrs = null, this.nesting = n, this.meta = null;
  }
  attrIndex(e) {
    if (!this.attrs) return -1;
    let t = this.attrs;
    for (let n = 0, a = t.length; n < a; n++) if (t[n][0] === e) return n;
    return -1;
  }
  attrPush(e) {
    this.attrs ? this.attrs.push(e) : this.attrs = [e];
  }
  attrSet(e, t) {
    let n = this.attrIndex(e), a = [e, t];
    n < 0 ? this.attrPush(a) : this.attrs[n] = a;
  }
  attrGet(e) {
    let t = this.attrIndex(e), n = null;
    return t >= 0 && (n = this.attrs[t][1]), n;
  }
  attrJoin(e, t) {
    let n = this.attrIndex(e);
    n < 0 ? this.attrPush([e, t]) : this.attrs[n][1] = `${this.attrs[n][1]} ${t}`;
  }
}, gt = class {
  constructor() {
    O(this, "__rules__", []), O(this, "__cache__", null);
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
    let a = this.__find__(e);
    if (a === -1) throw Error(`Parser rule not found: ${e}`);
    this.__rules__[a].fn = t, this.__rules__[a].alt = n.alt || [], this.__cache__ = null;
  }
  before(e, t, n, a = {}) {
    let r = this.__find__(e);
    if (r === -1) throw Error(`Parser rule not found: ${e}`);
    this.__rules__.splice(r, 0, {
      name: t,
      enabled: !0,
      fn: n,
      alt: a.alt || []
    }), this.__cache__ = null;
  }
  after(e, t, n, a = {}) {
    let r = this.__find__(e);
    if (r === -1) throw Error(`Parser rule not found: ${e}`);
    this.__rules__.splice(r + 1, 0, {
      name: t,
      enabled: !0,
      fn: n,
      alt: a.alt || []
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
    return e.forEach((a) => {
      let r = this.__find__(a);
      if (r < 0) {
        if (t) return;
        throw Error(`Rules manager: invalid rule name ${a}`);
      }
      this.__rules__[r].enabled = !0, n.push(a);
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
    return e.forEach((a) => {
      let r = this.__find__(a);
      if (r < 0) {
        if (t) return;
        throw Error(`Rules manager: invalid rule name ${a}`);
      }
      this.__rules__[r].enabled = !1, n.push(a);
    }), this.__cache__ = null, n;
  }
  getRules(e) {
    return this.__cache__ || this.__compile__(), this.__cache__[e] || [];
  }
}, Se = {};
Se.code_inline = function(e, t, n, a, r) {
  let i = e[t];
  return `<code${r.renderAttrs(i)}>${Xe(i.content)}</code>`;
}, Se.code_block = function(e, t, n, a, r) {
  let i = e[t];
  return `<pre${r.renderAttrs(i)}><code>${Xe(e[t].content)}</code></pre>
`;
}, Se.fence = function(e, t, n, a, r) {
  let i = e[t], o = i.info ? st(i.info).trim() : "", s = "", l = "";
  if (o) {
    let p = o.split(/(\s+)/g);
    s = p[0], l = p.slice(2).join("");
  }
  let u;
  if (u = n.highlight && n.highlight(i.content, s, l) || Xe(i.content), u.indexOf("<pre") === 0) return u + `
`;
  if (o) {
    let p = i.attrIndex("class"), h = i.attrs ? i.attrs.slice() : [];
    p < 0 ? h.push(["class", `${n.langPrefix}${s}`]) : (h[p] = [h[p][0], h[p][1]], h[p][1] += ` ${n.langPrefix}${s}`);
    let f = { attrs: h };
    return `<pre><code${r.renderAttrs(f)}>${u}</code></pre>
`;
  }
  return `<pre><code${r.renderAttrs(i)}>${u}</code></pre>
`;
}, Se.image = function(e, t, n, a, r) {
  let i = e[t];
  return i.attrs[i.attrIndex("alt")][1] = r.renderInlineAsText(i.children, n, a), r.renderToken(e, t, n);
}, Se.hardbreak = function(e, t, n) {
  return n.xhtmlOut ? `<br />
` : `<br>
`;
}, Se.softbreak = function(e, t, n) {
  return n.breaks ? n.xhtmlOut ? `<br />
` : `<br>
` : `
`;
}, Se.text = function(e, t) {
  return Xe(e[t].content);
}, Se.html_block = function(e, t) {
  return e[t].content;
}, Se.html_inline = function(e, t) {
  return e[t].content;
};
var Ha = class {
  constructor() {
    O(this, "rules", Object.assign({}, Se));
  }
  renderAttrs(e) {
    let t, n, a;
    if (!e.attrs) return "";
    for (a = "", t = 0, n = e.attrs.length; t < n; t++) a += ` ${Xe(e.attrs[t][0])}="${Xe(String(e.attrs[t][1]))}"`;
    return a;
  }
  renderToken(e, t, n) {
    let a = e[t], r = "";
    if (a.hidden) return "";
    let i = t - 1;
    for (; i >= 0 && e[i].hidden && e[i].nesting === 0; ) i--;
    a.block && a.nesting !== -1 && i >= 0 && e[i].hidden && e[i].nesting === -1 && (r += `
`), r += (a.nesting === -1 ? "</" : "<") + a.tag, r += this.renderAttrs(a), a.nesting === 0 && n.xhtmlOut && (r += " /");
    let o = !1;
    if (a.block && (o = !0, a.nesting === 1)) {
      let s = t + 1;
      for (; s < e.length && e[s].hidden && e[s].nesting === 0; ) s++;
      if (s < e.length) {
        let l = e[s];
        (l.type === "inline" || l.hidden || l.nesting === -1 && l.tag === a.tag) && (o = !1);
      }
    }
    return r += o ? `>
` : ">", r;
  }
  renderInline(e, t, n) {
    let a = "", r = this.rules;
    for (let i = 0, o = e.length; i < o; i++) {
      let s = e[i].type;
      r[s] === void 0 ? a += this.renderToken(e, i, t) : a += r[s](e, i, t, n, this);
    }
    return a;
  }
  renderInlineAsText(e, t, n) {
    let a = "";
    for (let r = 0, i = e.length; r < i; r++) switch (e[r].type) {
      case "text":
      case "code_inline":
        a += e[r].content;
        break;
      case "image":
        a += this.renderInlineAsText(e[r].children, t, n);
        break;
      case "html_inline":
      case "html_block":
        a += e[r].content;
        break;
      case "softbreak":
      case "hardbreak":
        a += `
`;
    }
    return a;
  }
  render(e, t, n) {
    let a = "", r = this.rules;
    for (let i = 0, o = e.length; i < o; i++) {
      let s = e[i].type;
      s === "inline" ? a += this.renderInline(e[i].children, t, n) : r[s] === void 0 ? a += this.renderToken(e, i, t) : a += r[s](e, i, t, n, this);
    }
    return a;
  }
}, Za = class {
  constructor(e, t, n) {
    O(this, "tokens", []), O(this, "inlineMode", !1), O(this, "Token", Ye), this.src = e, this.env = n, this.md = t;
  }
}, _s = /\r\n?/g, ws = /\0/g;
function qs(e) {
  let t;
  t = e.src.replace(_s, `
`), t = t.replace(ws, "�"), e.src = t;
}
function ys(e) {
  let t;
  e.inlineMode ? (t = new e.Token("inline", "", 0), t.content = e.src, t.map = [0, 1], t.children = [], e.tokens.push(t)) : e.md.block.parse(e.src, e.md, e.env, e.tokens);
}
function Rs(e) {
  let t = e.tokens, n = 0;
  for (let a = 0; a < t.length; a++) t[a].type !== "reference_definition" && (a !== n && (t[n] = t[a]), n++);
  t.length !== n && (t.length = n);
}
function Es(e) {
  let t = e.tokens;
  for (let n = 0, a = t.length; n < a; n++) {
    let r = t[n];
    r.type === "inline" && e.md.inline.parse(r.content, e.md, e.env, r.children);
  }
}
function Cs(e) {
  return /^<a[>\s]/i.test(e);
}
function Ns(e) {
  return /^<\/a\s*>/i.test(e);
}
function As(e) {
  let t = e.tokens;
  if (e.md.options.linkify) for (let n = 0, a = t.length; n < a; n++) {
    if (t[n].type !== "inline" || !e.md.linkify.test(t[n].content)) continue;
    let r = t[n].children, i = [], o = 0;
    for (let s = r.length - 1; s >= 0; s--) {
      let l = r[s];
      if (l.type === "link_close") for (s--; r[s].level !== l.level && r[s].type !== "link_open"; ) s--;
      else if (l.type === "html_inline" && (Cs(l.content) && o > 0 && o--, Ns(l.content) && o++), !(o > 0) && l.type === "text" && e.md.linkify.test(l.content)) {
        let u = l.content, p = e.md.linkify.match(u), h = [], f = l.level, m = 0;
        p.length > 0 && p[0].index === 0 && s > 0 && r[s - 1].type === "text_special" && (p = p.slice(1));
        for (let d = 0; d < p.length; d++) {
          let w = p[d].url, k = e.md.normalizeLink(w);
          if (!e.md.validateLink(k)) continue;
          let z = p[d].text;
          z = p[d].schema ? p[d].schema === "mailto:" && !/^mailto:/i.test(z) ? e.md.normalizeLinkText(`mailto:${z}`).replace(/^mailto:/, "") : e.md.normalizeLinkText(z) : e.md.normalizeLinkText(`http://${z}`).replace(/^http:\/\//, "");
          let _ = p[d].index;
          if (_ > m) {
            let b = new e.Token("text", "", 0);
            b.content = u.slice(m, _), b.level = f, h.push(b);
          }
          let y = new e.Token("link_open", "a", 1);
          y.attrs = [["href", k]], y.level = f++, y.markup = "linkify", y.info = "auto", h.push(y);
          let C = new e.Token("text", "", 0);
          C.content = z, C.level = f, h.push(C);
          let v = new e.Token("link_close", "a", -1);
          v.level = --f, v.markup = "linkify", v.info = "auto", h.push(v), m = p[d].lastIndex;
        }
        if (m < u.length) {
          let d = new e.Token("text", "", 0);
          d.content = u.slice(m), d.level = f, h.push(d);
        }
        i.push({
          index: s,
          nodes: h
        });
      }
    }
    if (i.length > 0) {
      let s = r.length;
      for (let h of i) s += h.nodes.length - 1;
      let l = Array(s), u = 0, p = 0;
      i.reverse();
      for (let h = 0; h < r.length; h++) {
        let f = i[u];
        if ((f == null ? void 0 : f.index) === h) {
          for (let m of f.nodes) l[p++] = m;
          u++;
        } else l[p++] = r[h];
      }
      t[n].children = l;
    }
  }
}
var Ka = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/, Ds = /\((c|tm|r)\)/i, Ss = /\((c|tm|r)\)/gi, Ts = {
  c: "©",
  r: "®",
  tm: "™"
};
function Fs(e, t) {
  return Ts[t.toLowerCase()];
}
function Ms(e) {
  let t = 0;
  for (let n = e.length - 1; n >= 0; n--) {
    let a = e[n];
    a.type === "text" && !t && (a.content = a.content.replace(Ss, Fs)), a.type === "link_open" && a.info === "auto" && t--, a.type === "link_close" && a.info === "auto" && t++;
  }
}
function Is(e) {
  let t = 0;
  for (let n = e.length - 1; n >= 0; n--) {
    let a = e[n];
    a.type === "text" && !t && Ka.test(a.content) && (a.content = a.content.replace(/\+-/g, "±").replace(/\.{2,}/g, "…").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/gm, "$1—").replace(/(^|\s)--(?=\s|$)/gm, "$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/gm, "$1–")), a.type === "link_open" && a.info === "auto" && t--, a.type === "link_close" && a.info === "auto" && t++;
  }
}
function Os(e) {
  let t;
  if (e.md.options.typographer) for (t = e.tokens.length - 1; t >= 0; t--) e.tokens[t].type === "inline" && (Ds.test(e.tokens[t].content) && Ms(e.tokens[t].children), Ka.test(e.tokens[t].content) && Is(e.tokens[t].children));
}
var Bs = /['"]/, In = /['"]/g, On = "’", Ls = 1e3;
function Bn(e, t, n) {
  for (; e.length > n; ) {
    let a = e.pop();
    a.isSingleQuote ? t.single = a.prevSameQuoteIdx : t.double = a.prevSameQuoteIdx;
  }
}
function zt(e, t, n, a) {
  e[t] || (e[t] = []), e[t].push({
    pos: n,
    ch: a
  });
}
function $s(e, t) {
  let n = "", a = 0;
  t.sort((r, i) => r.pos - i.pos);
  for (let r = 0; r < t.length; r++) {
    let i = t[r];
    n += e.slice(a, i.pos) + i.ch, a = i.pos + 1;
  }
  return n + e.slice(a);
}
function js(e, t) {
  let n, a = [], r = {
    single: -1,
    double: -1
  }, i = {};
  for (let o = 0; o < e.length; o++) {
    let s = e[o], l = e[o].level;
    for (n = a.length - 1; n >= 0 && !(a[n].level <= l); n--) ;
    if (Bn(a, r, n + 1), s.type !== "text") continue;
    let u = s.content, p = 0, h = u.length;
    e: for (; p < h; ) {
      In.lastIndex = p;
      let f = In.exec(u);
      if (!f) break;
      let m = !0, d = !0;
      p = f.index + 1;
      let w = f[0] === "'", k = 32;
      if (f.index - 1 >= 0) k = u.charCodeAt(f.index - 1);
      else for (n = o - 1; n >= 0 && e[n].type !== "softbreak" && e[n].type !== "hardbreak"; n--) if (e[n].content) {
        k = e[n].content.charCodeAt(e[n].content.length - 1);
        break;
      }
      let z = 32;
      if (p < h) z = u.charCodeAt(p);
      else for (n = o + 1; n < e.length && e[n].type !== "softbreak" && e[n].type !== "hardbreak"; n++) if (e[n].content) {
        z = e[n].content.charCodeAt(0);
        break;
      }
      let _ = ft(k) || pt(k), y = ft(z) || pt(z), C = ht(k), v = ht(z);
      if (v ? m = !1 : y && (C || _ || (m = !1)), C ? d = !1 : _ && (v || y || (d = !1)), z === 34 && f[0] === '"' && k >= 48 && k <= 57 && (d = m = !1), m && d && (m = _, d = y), !m && !d) w && zt(i, o, f.index, On);
      else {
        if (d && (n = w ? r.single : r.double, n >= 0 && a[n].level === l)) {
          let b = a[n], T, D;
          w ? (T = t.md.options.quotes[2], D = t.md.options.quotes[3]) : (T = t.md.options.quotes[0], D = t.md.options.quotes[1]), zt(i, o, f.index, D), zt(i, b.tokenIdx, b.contentPos, T), Bn(a, r, n);
          continue e;
        }
        if (m) {
          if (a.length >= Ls) return;
          a.push({
            tokenIdx: o,
            contentPos: f.index,
            isSingleQuote: w,
            level: l,
            prevSameQuoteIdx: w ? r.single : r.double
          }), w ? r.single = a.length - 1 : r.double = a.length - 1;
        } else d && w && zt(i, o, f.index, On);
      }
    }
  }
  Object.keys(i).forEach(function(o) {
    let s = Number(o);
    e[s].content = $s(e[s].content, i[o]);
  });
}
function Us(e) {
  if (e.md.options.typographer) for (let t = e.tokens.length - 1; t >= 0; t--) e.tokens[t].type === "inline" && Bs.test(e.tokens[t].content) && js(e.tokens[t].children, e);
}
function Ps(e) {
  let t, n, a = e.length;
  for (t = 0; t < a; t++) e[t].type === "text_special" && (e[t].type = "text");
  for (t = n = 0; t < a; t++) e[t].type === "text" && t + 1 < a && e[t + 1].type === "text" ? e[t + 1].content = e[t].content + e[t + 1].content : (t !== n && (e[n] = e[t]), n++);
  t !== n && (e.length = n);
}
function Js(e) {
  let t, n, a = e.tokens, r = a.length;
  for (let i = 0; i < r; i++) {
    if (a[i].type !== "inline") continue;
    let o = a[i].children, s = o.length;
    for (t = 0; t < s; t++) o[t].type === "text_special" && (o[t].type = "text"), o[t].children && Ps(o[t].children);
    for (t = n = 0; t < s; t++) o[t].type === "text" && t + 1 < s && o[t + 1].type === "text" ? o[t + 1].content = o[t].content + o[t + 1].content : (t !== n && (o[n] = o[t]), n++);
    t !== n && (o.length = n);
  }
}
var $t = [
  ["normalize", qs],
  ["block", ys],
  ["strip_references", Rs],
  ["inline", Es],
  ["linkify", As],
  ["replacements", Os],
  ["smartquotes", Us],
  ["text_join", Js]
], Ga = class {
  constructor() {
    O(this, "ruler", new gt()), O(this, "State", Za);
    for (let e = 0; e < $t.length; e++) this.ruler.push($t[e][0], $t[e][1]);
  }
  process(e) {
    let t = this.ruler.getRules("");
    for (let n = 0, a = t.length; n < a; n++) t[n](e);
  }
}, Xa = class {
  constructor(e, t, n, a) {
    O(this, "bMarks", []), O(this, "eMarks", []), O(this, "tShift", []), O(this, "sCount", []), O(this, "bsCount", []), O(this, "blkIndent", 0), O(this, "line", 0), O(this, "lineMax", 0), O(this, "tight", !1), O(this, "listIndent", -1), O(this, "parentType", "root"), O(this, "level", 0), O(this, "Token", Ye), this.src = e, this.md = t, this.env = n, this.tokens = a;
    let r = this.src;
    for (let i = 0, o = 0, s = 0, l = 0, u = r.length, p = !1; o < u; o++) {
      let h = r.charCodeAt(o);
      if (!p) {
        if (le(h)) {
          s++, h === 9 ? l += 4 - l % 4 : l++;
          continue;
        }
        p = !0;
      }
      (h === 10 || o === u - 1) && (h !== 10 && o++, this.bMarks.push(i), this.eMarks.push(o), this.tShift.push(s), this.sCount.push(l), this.bsCount.push(0), p = !1, s = 0, l = 0, i = o + 1);
    }
    this.bMarks.push(r.length), this.eMarks.push(r.length), this.tShift.push(0), this.sCount.push(0), this.bsCount.push(0), this.lineMax = this.bMarks.length - 1;
  }
  push(e, t, n) {
    let a = new Ye(e, t, n);
    return a.block = !0, n < 0 && this.level--, a.level = this.level, n > 0 && this.level++, this.tokens.push(a), a;
  }
  isEmpty(e) {
    return this.bMarks[e] + this.tShift[e] >= this.eMarks[e];
  }
  skipEmptyLines(e) {
    for (let t = this.lineMax; e < t && !(this.bMarks[e] + this.tShift[e] < this.eMarks[e]); e++) ;
    return e;
  }
  skipSpaces(e) {
    for (let t = this.src.length; e < t && le(this.src.charCodeAt(e)); e++) ;
    return e;
  }
  skipSpacesBack(e, t) {
    if (e <= t) return e;
    for (; e > t; ) if (!le(this.src.charCodeAt(--e))) return e + 1;
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
  getLines(e, t, n, a) {
    if (e >= t) return "";
    let r = Array(t - e);
    for (let i = 0, o = e; o < t; o++, i++) {
      let s = 0, l = this.bMarks[o], u = l, p;
      for (p = o + 1 < t || a ? this.eMarks[o] + 1 : this.eMarks[o]; u < p && s < n; ) {
        let h = this.src.charCodeAt(u);
        if (le(h)) h === 9 ? s += 4 - (s + this.bsCount[o]) % 4 : s++;
        else if (u - l < this.tShift[o]) s++;
        else break;
        u++;
      }
      s > n ? r[i] = Array(s - n + 1).join(" ") + this.src.slice(u, p) : r[i] = this.src.slice(u, p);
    }
    return r.join("");
  }
}, Ws = 65536;
function jt(e, t) {
  let n = e.bMarks[t] + e.tShift[t], a = e.eMarks[t];
  return e.src.slice(n, a);
}
function Ln(e) {
  let t = [], n = e.length, a = 0, r = e.charCodeAt(a), i = !1, o = 0, s = "";
  for (; a < n; ) r === 124 && (i ? (s += e.substring(o, a - 1), o = a) : (t.push(s + e.substring(o, a)), s = "", o = a + 1)), i = r === 92, a++, r = e.charCodeAt(a);
  return t.push(s + e.substring(o)), t;
}
function Hs(e, t, n, a) {
  if (t + 2 > n) return !1;
  let r = t + 1;
  if (e.sCount[r] < e.blkIndent || e.sCount[r] - e.blkIndent >= 4) return !1;
  let i = e.bMarks[r] + e.tShift[r];
  if (i >= e.eMarks[r]) return !1;
  let o = e.src.charCodeAt(i++);
  if (o !== 124 && o !== 45 && o !== 58 || i >= e.eMarks[r]) return !1;
  let s = e.src.charCodeAt(i++);
  if (s !== 124 && s !== 45 && s !== 58 && !le(s) || o === 45 && le(s)) return !1;
  for (; i < e.eMarks[r]; ) {
    let C = e.src.charCodeAt(i);
    if (C !== 124 && C !== 45 && C !== 58 && !le(C)) return !1;
    i++;
  }
  let l = jt(e, t + 1), u = l.split("|"), p = [];
  for (let C = 0; C < u.length; C++) {
    let v = u[C].trim();
    if (!v) {
      if (C === 0 || C === u.length - 1) continue;
      return !1;
    }
    if (!/^:?-+:?$/.test(v)) return !1;
    v.charCodeAt(v.length - 1) === 58 ? p.push(v.charCodeAt(0) === 58 ? "center" : "right") : v.charCodeAt(0) === 58 ? p.push("left") : p.push("");
  }
  if (l = jt(e, t).trim(), l.indexOf("|") === -1 || e.sCount[t] - e.blkIndent >= 4) return !1;
  u = Ln(l), u.length && u[0] === "" && u.shift(), u.length && u[u.length - 1] === "" && u.pop();
  let h = u.length;
  if (h === 0 || h !== p.length) return !1;
  if (a) return !0;
  let f = e.parentType;
  e.parentType = "table";
  let m = e.md.block.ruler.getRules("blockquote"), d = e.push("table_open", "table", 1), w = [t, 0];
  d.map = w;
  let k = e.push("thead_open", "thead", 1);
  k.map = [t, t + 1];
  let z = e.push("tr_open", "tr", 1);
  z.map = [t, t + 1];
  for (let C = 0; C < u.length; C++) {
    let v = e.push("th_open", "th", 1);
    p[C] && (v.attrs = [["style", `text-align:${p[C]}`]]);
    let b = e.push("inline", "", 0);
    b.content = u[C].trim(), b.children = [], e.push("th_close", "th", -1);
  }
  e.push("tr_close", "tr", -1), e.push("thead_close", "thead", -1);
  let _, y = 0;
  for (r = t + 2; r < n && !(e.sCount[r] < e.blkIndent); r++) {
    let C = !1;
    for (let b = 0, T = m.length; b < T; b++) if (m[b](e, r, n, !0)) {
      C = !0;
      break;
    }
    if (C || (l = jt(e, r).trim(), !l) || e.sCount[r] - e.blkIndent >= 4 || (u = Ln(l), u.length && u[0] === "" && u.shift(), u.length && u[u.length - 1] === "" && u.pop(), y += h - u.length, y > Ws)) break;
    if (r === t + 2) {
      let b = e.push("tbody_open", "tbody", 1);
      b.map = _ = [t + 2, 0];
    }
    let v = e.push("tr_open", "tr", 1);
    v.map = [r, r + 1];
    for (let b = 0; b < h; b++) {
      let T = e.push("td_open", "td", 1);
      p[b] && (T.attrs = [["style", `text-align:${p[b]}`]]);
      let D = e.push("inline", "", 0);
      D.content = u[b] ? u[b].trim() : "", D.children = [], e.push("td_close", "td", -1);
    }
    e.push("tr_close", "tr", -1);
  }
  return _ && (e.push("tbody_close", "tbody", -1), _[1] = r), e.push("table_close", "table", -1), w[1] = r, e.parentType = f, e.line = r, !0;
}
function Zs(e, t, n) {
  if (e.sCount[t] - e.blkIndent < 4) return !1;
  let a = t + 1, r = a;
  for (; a < n; ) if (e.isEmpty(a)) a++;
  else if (e.sCount[a] - e.blkIndent >= 4) a++, r = a;
  else break;
  e.line = r;
  let i = e.push("code_block", "code", 0);
  return i.content = e.getLines(t, r, 4 + e.blkIndent, !1) + `
`, i.map = [t, e.line], !0;
}
function Ks(e, t, n, a) {
  let r = e.bMarks[t] + e.tShift[t], i = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4 || r + 3 > i) return !1;
  let o = e.src.charCodeAt(r);
  if (o !== 126 && o !== 96) return !1;
  let s = r;
  r = e.skipChars(r, o);
  let l = r - s;
  if (l < 3) return !1;
  let u = e.src.slice(s, r), p = e.src.slice(r, i);
  if (o === 96 && p.indexOf(String.fromCharCode(o)) >= 0) return !1;
  if (a) return !0;
  let h = t, f = !1;
  for (; h++, !(h >= n || (r = s = e.bMarks[h] + e.tShift[h], i = e.eMarks[h], r < i && e.sCount[h] < e.blkIndent)); ) if (e.src.charCodeAt(r) === o && !(e.sCount[h] - e.blkIndent >= 4) && (r = e.skipChars(r, o), !(r - s < l) && (r = e.skipSpaces(r), !(r < i)))) {
    f = !0;
    break;
  }
  l = e.sCount[t], e.line = h + +!!f;
  let m = e.push("fence", "code", 0);
  return m.info = p, m.content = e.getLines(t + 1, h, l, !0), m.markup = u, m.map = [t, e.line], !0;
}
function Gs(e, t, n, a) {
  let r = e.bMarks[t] + e.tShift[t], i = e.eMarks[t], o = e.lineMax;
  if (e.sCount[t] - e.blkIndent >= 4 || e.src.charCodeAt(r) !== 62) return !1;
  if (a) return !0;
  let s = [], l = [], u = [], p = [], h = e.md.block.ruler.getRules("blockquote"), f = e.parentType;
  e.parentType = "blockquote";
  let m = !1, d;
  for (d = t; d < n; d++) {
    let y = e.sCount[d] < e.blkIndent;
    if (r = e.bMarks[d] + e.tShift[d], i = e.eMarks[d], r >= i) break;
    if (e.src.charCodeAt(r++) === 62 && !y) {
      let v = e.sCount[d] + 1, b, T;
      e.src.charCodeAt(r) === 32 ? (r++, v++, T = !1, b = !0) : e.src.charCodeAt(r) === 9 ? (b = !0, (e.bsCount[d] + v) % 4 == 3 ? (r++, v++, T = !1) : T = !0) : b = !1;
      let D = v;
      for (s.push(e.bMarks[d]), e.bMarks[d] = r; r < i; ) {
        let L = e.src.charCodeAt(r);
        if (le(L)) L === 9 ? D += 4 - (D + e.bsCount[d] + +!!T) % 4 : D++;
        else break;
        r++;
      }
      m = r >= i, l.push(e.bsCount[d]), e.bsCount[d] = e.sCount[d] + 1 + +!!b, u.push(e.sCount[d]), e.sCount[d] = D - v, p.push(e.tShift[d]), e.tShift[d] = r - e.bMarks[d];
      continue;
    }
    if (m) break;
    let C = !1;
    for (let v = 0, b = h.length; v < b; v++) if (h[v](e, d, n, !0)) {
      C = !0;
      break;
    }
    if (C) {
      e.lineMax = d, e.blkIndent !== 0 && (s.push(e.bMarks[d]), l.push(e.bsCount[d]), p.push(e.tShift[d]), u.push(e.sCount[d]), e.sCount[d] -= e.blkIndent);
      break;
    }
    s.push(e.bMarks[d]), l.push(e.bsCount[d]), p.push(e.tShift[d]), u.push(e.sCount[d]), e.sCount[d] = -1;
  }
  let w = e.blkIndent;
  e.blkIndent = 0;
  let k = e.push("blockquote_open", "blockquote", 1);
  k.markup = ">";
  let z = [t, 0];
  k.map = z, e.md.block.tokenize(e, t, d);
  let _ = e.push("blockquote_close", "blockquote", -1);
  _.markup = ">", e.lineMax = o, e.parentType = f, z[1] = e.line;
  for (let y = 0; y < p.length; y++) e.bMarks[y + t] = s[y], e.tShift[y + t] = p[y], e.sCount[y + t] = u[y], e.bsCount[y + t] = l[y];
  return e.blkIndent = w, !0;
}
function Xs(e, t, n, a) {
  let r = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4) return !1;
  let i = e.bMarks[t] + e.tShift[t], o = e.src.charCodeAt(i++);
  if (o !== 42 && o !== 45 && o !== 95) return !1;
  let s = 1;
  for (; i < r; ) {
    let u = e.src.charCodeAt(i++);
    if (u !== o && !le(u)) return !1;
    u === o && s++;
  }
  if (s < 3) return !1;
  if (a) return !0;
  e.line = t + 1;
  let l = e.push("hr", "hr", 0);
  return l.map = [t, e.line], l.markup = Array(s + 1).join(String.fromCharCode(o)), !0;
}
function $n(e, t) {
  let n = e.eMarks[t], a = e.bMarks[t] + e.tShift[t], r = e.src.charCodeAt(a++);
  return r !== 42 && r !== 45 && r !== 43 || a < n && !le(e.src.charCodeAt(a)) ? -1 : a;
}
function jn(e, t) {
  let n = e.bMarks[t] + e.tShift[t], a = e.eMarks[t], r = n;
  if (r + 1 >= a) return -1;
  let i = e.src.charCodeAt(r++);
  if (i < 48 || i > 57) return -1;
  for (; ; ) {
    if (r >= a) return -1;
    if (i = e.src.charCodeAt(r++), i >= 48 && i <= 57) {
      if (r - n >= 10) return -1;
    } else {
      if (i === 41 || i === 46) break;
      return -1;
    }
  }
  return r < a && (i = e.src.charCodeAt(r), !le(i)) ? -1 : r;
}
function Ys(e, t) {
  let n = e.level + 2;
  for (let a = t + 2, r = e.tokens.length - 2; a < r; a++) e.tokens[a].level === n && e.tokens[a].type === "paragraph_open" && (e.tokens[a + 2].hidden = !0, e.tokens[a].hidden = !0, a += 2);
}
function Vs(e, t, n, a) {
  let r, i, o, s, l = t, u = !0;
  if (e.sCount[l] - e.blkIndent >= 4 || e.listIndent >= 0 && e.sCount[l] - e.listIndent >= 4 && e.sCount[l] < e.blkIndent) return !1;
  let p = !1;
  a && e.parentType === "paragraph" && e.sCount[l] >= e.blkIndent && (p = !0);
  let h, f, m;
  if ((m = jn(e, l)) >= 0) {
    if (h = !0, o = e.bMarks[l] + e.tShift[l], f = Number(e.src.slice(o, m - 1)), p && f !== 1) return !1;
  } else if ((m = $n(e, l)) >= 0) h = !1;
  else return !1;
  if (p && e.skipSpaces(m) >= e.eMarks[l]) return !1;
  if (a) return !0;
  let d = e.src.charCodeAt(m - 1), w = e.tokens.length;
  h ? (s = e.push("ordered_list_open", "ol", 1), f !== 1 && (s.attrs = [["start", f]])) : s = e.push("bullet_list_open", "ul", 1);
  let k = [l, 0];
  s.map = k, s.markup = String.fromCharCode(d);
  let z = !1, _ = e.md.block.ruler.getRules("list"), y = e.parentType;
  for (e.parentType = "list"; l < n; ) {
    i = m, r = e.eMarks[l];
    let C = e.sCount[l] + m - (e.bMarks[l] + e.tShift[l]), v = C;
    for (; i < r; ) {
      let te = e.src.charCodeAt(i);
      if (te === 9) v += 4 - (v + e.bsCount[l]) % 4;
      else if (te === 32) v++;
      else break;
      i++;
    }
    let b = i, T;
    T = b >= r ? 1 : v - C, T > 4 && (T = 1);
    let D = C + T;
    s = e.push("list_item_open", "li", 1), s.markup = String.fromCharCode(d);
    let L = [l, 0];
    s.map = L, h && (s.info = e.src.slice(o, m - 1));
    let J = e.tight, Z = e.tShift[l], $ = e.sCount[l], j = e.listIndent;
    if (e.listIndent = e.blkIndent, e.blkIndent = D, e.tight = !0, e.tShift[l] = b - e.bMarks[l], e.sCount[l] = v, b >= r && e.isEmpty(l + 1) ? e.line = Math.min(e.line + 2, n) : e.md.block.tokenize(e, l, n), (!e.tight || z) && (u = !1), z = e.line - l > 1 && e.isEmpty(e.line - 1), e.blkIndent = e.listIndent, e.listIndent = j, e.tShift[l] = Z, e.sCount[l] = $, e.tight = J, s = e.push("list_item_close", "li", -1), s.markup = String.fromCharCode(d), l = e.line, L[1] = l, l >= n || e.sCount[l] < e.blkIndent || e.sCount[l] - e.blkIndent >= 4) break;
    let V = !1;
    for (let te = 0, N = _.length; te < N; te++) if (_[te](e, l, n, !0)) {
      V = !0;
      break;
    }
    if (V) break;
    if (h) {
      if (m = jn(e, l), m < 0) break;
      o = e.bMarks[l] + e.tShift[l];
    } else if (m = $n(e, l), m < 0) break;
    if (d !== e.src.charCodeAt(m - 1)) break;
  }
  return s = h ? e.push("ordered_list_close", "ol", -1) : e.push("bullet_list_close", "ul", -1), s.markup = String.fromCharCode(d), k[1] = l, e.line = l, e.parentType = y, u && Ys(e, w), !0;
}
var Ut = 999;
function Qs(e) {
  let t = e.length;
  for (let n = 0; n < e.length - 1; n++) {
    let a = e.charCodeAt(n);
    if (a < 55296 || a > 56319) continue;
    let r = e.charCodeAt(n + 1);
    r >= 56320 && r <= 57343 && (t--, n++);
  }
  return t;
}
function lt(e, t) {
  return Math.min(e.eMarks[t] + 1, e.src.length);
}
function kt(e, t) {
  let n = e.lineMax;
  if (t >= n || e.isEmpty(t)) return -1;
  let a = !1;
  if (e.sCount[t] - e.blkIndent > 3 && (a = !0), e.sCount[t] < 0 && (a = !0), !a) {
    let r = e.md.block.ruler.getRules("reference"), i = e.parentType;
    e.parentType = "reference";
    let o = !1;
    for (let s = 0, l = r.length; s < l; s++) if (r[s](e, t, n, !0)) {
      o = !0;
      break;
    }
    if (e.parentType = i, o) return -1;
  }
  return e.bMarks[t] + e.tShift[t];
}
function eo(e, t, n, a) {
  let r = e.src, i = e.bMarks[t] + e.tShift[t], o = t + 1;
  if (e.sCount[t] - e.blkIndent >= 4 || r.charCodeAt(i) !== 91) return !1;
  let s = lt(e, t), l = "", u = -1, p = ++i;
  for (; i < s; ) {
    if (l.length + i - p > Ut * 2) return !1;
    let b = r.charCodeAt(i);
    if (b === 91) return !1;
    if (b === 93) {
      u = i;
      break;
    }
    if (b === 92 && (b = r.charCodeAt(++i)), b === 10 && i < s) {
      let T = kt(e, o);
      if (T < 0) return !1;
      l += r.slice(p, s), i = p = T, s = lt(e, o++);
    } else i++;
  }
  if (u < 0 || r.charCodeAt(u + 1) !== 58 || (l += r.slice(p, u), l.length > Ut && Qs(l) > Ut)) return !1;
  for (i = u + 2; i < s; ) {
    let b = r.charCodeAt(i);
    if (b === 10) {
      let T = kt(e, o);
      if (T < 0) break;
      i = T, s = lt(e, o++);
    } else if (le(b)) i++;
    else break;
  }
  let h = e.md.helpers.parseLinkDestination(r, i, s);
  if (!h.ok) return !1;
  let f = e.md.normalizeLink(h.str);
  if (!e.md.validateLink(f)) return !1;
  i = h.pos;
  let m = i, d = s, w = o;
  for (; i < s; ) {
    let b = r.charCodeAt(i);
    if (b === 10) {
      let T = kt(e, o);
      if (T < 0) break;
      i = T, s = lt(e, o++);
    } else if (le(b)) i++;
    else break;
  }
  let k = i, z = e.md.helpers.parseLinkTitle(r, i, s);
  for (; z.can_continue; ) {
    let b = kt(e, o);
    if (b < 0) break;
    i = b, s = lt(e, o++), z = e.md.helpers.parseLinkTitle(r, i, s, z);
  }
  let _;
  for (k !== m && z.ok ? (_ = z.str, i = z.pos) : (_ = "", i = m, s = d, o = w); i < s && le(r.charCodeAt(i)); ) i++;
  if (i < s && r.charCodeAt(i) !== 10 && _) for (_ = "", i = m, s = d, o = w; i < s && le(r.charCodeAt(i)); ) i++;
  if (i < s && r.charCodeAt(i) !== 10) return !1;
  let y = Tt(l);
  if (!y) return !1;
  if (a) return !0;
  e.env.references === void 0 && (e.env.references = {}), e.env.references[y] === void 0 && (e.env.references[y] = {
    title: _,
    href: f
  });
  let C = e.push("reference_definition", "", 0);
  C.map = [t, o], C.hidden = !0;
  let v = /* @__PURE__ */ Object.create(null);
  return v.label = y, C.meta = v, e.line = o, !0;
}
var to = /* @__PURE__ */ "address.article.aside.base.basefont.blockquote.body.caption.center.col.colgroup.dd.details.dialog.dir.div.dl.dt.fieldset.figcaption.figure.footer.form.frame.frameset.h1.h2.h3.h4.h5.h6.head.header.hr.html.iframe.legend.li.link.main.menu.menuitem.nav.noframes.ol.optgroup.option.p.param.search.section.summary.table.tbody.td.tfoot.th.thead.title.tr.track.ul".split("."), no = `<[A-Za-z][A-Za-z0-9\\-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*"))?)*\\s*\\/?>`, ao = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>", Ya = RegExp(`^(?:${no}|${ao})`), Ge = [
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
    RegExp(`^</?(${to.join("|")})(?=(\\s|/?>|$))`, "i"),
    /^$/,
    !0
  ],
  [
    RegExp(`${Ya.source}\\s*$`),
    /^$/,
    !1
  ]
];
function ro(e, t, n, a) {
  let r = e.bMarks[t] + e.tShift[t], i = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4 || !e.md.options.html || e.src.charCodeAt(r) !== 60) return !1;
  let o = e.src.slice(r, i), s = 0;
  for (; s < Ge.length && !Ge[s][0].test(o); s++) ;
  if (s === Ge.length) return !1;
  if (a) return Ge[s][2];
  let l = t + 1, u = Ge[s][1].test("");
  if (!Ge[s][1].test(o)) {
    for (; l < n && !(e.sCount[l] < e.blkIndent && (u || !e.isEmpty(l))); l++) if (r = e.bMarks[l] + e.tShift[l], i = e.eMarks[l], o = e.src.slice(r, i), Ge[s][1].test(o)) {
      o.length !== 0 && l++;
      break;
    }
  }
  e.line = l;
  let p = e.push("html_block", "", 0);
  return p.map = [t, l], p.content = e.getLines(t, l, e.blkIndent, !0), !0;
}
function io(e, t, n, a) {
  let r = e.bMarks[t] + e.tShift[t], i = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4) return !1;
  let o = e.src.charCodeAt(r);
  if (o !== 35 || r >= i) return !1;
  let s = 1;
  for (o = e.src.charCodeAt(++r); o === 35 && r < i && s <= 6; ) s++, o = e.src.charCodeAt(++r);
  if (s > 6 || r < i && !le(o)) return !1;
  if (a) return !0;
  i = e.skipSpacesBack(i, r);
  let l = e.skipCharsBack(i, 35, r);
  l > r && le(e.src.charCodeAt(l - 1)) && (i = l), e.line = t + 1;
  let u = e.push("heading_open", `h${s}`, 1);
  u.markup = "########".slice(0, s), u.map = [t, e.line];
  let p = e.push("inline", "", 0);
  p.content = Ft(e.src.slice(r, i)), p.map = [t, e.line], p.children = [];
  let h = e.push("heading_close", `h${s}`, -1);
  return h.markup = "########".slice(0, s), !0;
}
function so(e, t, n) {
  let a = e.md.block.ruler.getRules("paragraph");
  if (e.sCount[t] - e.blkIndent >= 4) return !1;
  let r = e.parentType;
  e.parentType = "paragraph";
  let i = 0, o, s = t + 1;
  for (; s < n && !e.isEmpty(s); s++) {
    if (e.sCount[s] - e.blkIndent > 3) continue;
    if (e.sCount[s] >= e.blkIndent) {
      let m = e.bMarks[s] + e.tShift[s], d = e.eMarks[s];
      if (m < d && (o = e.src.charCodeAt(m), (o === 45 || o === 61) && (m = e.skipChars(m, o), m = e.skipSpaces(m), m >= d))) {
        i = o === 61 ? 1 : 2;
        break;
      }
    }
    if (e.sCount[s] < 0) continue;
    let f = !1;
    for (let m = 0, d = a.length; m < d; m++) if (a[m](e, s, n, !0)) {
      f = !0;
      break;
    }
    if (f) break;
  }
  if (!i) return e.parentType = r, !1;
  let l = Ft(e.getLines(t, s, e.blkIndent, !1));
  e.line = s + 1;
  let u = e.push("heading_open", `h${i}`, 1);
  u.markup = String.fromCharCode(o), u.map = [t, e.line];
  let p = e.push("inline", "", 0);
  p.content = l, p.map = [t, e.line - 1], p.children = [];
  let h = e.push("heading_close", `h${i}`, -1);
  return h.markup = String.fromCharCode(o), e.parentType = r, !0;
}
function oo(e, t, n) {
  let a = e.md.block.ruler.getRules("paragraph"), r = e.parentType, i = t + 1;
  for (e.parentType = "paragraph"; i < n && !e.isEmpty(i); i++) {
    if (e.sCount[i] - e.blkIndent > 3 || e.sCount[i] < 0) continue;
    let u = !1;
    for (let p = 0, h = a.length; p < h; p++) if (a[p](e, i, n, !0)) {
      u = !0;
      break;
    }
    if (u) break;
  }
  let o = Ft(e.getLines(t, i, e.blkIndent, !1));
  e.line = i;
  let s = e.push("paragraph_open", "p", 1);
  s.map = [t, e.line];
  let l = e.push("inline", "", 0);
  return l.content = o, l.map = [t, e.line], l.children = [], e.push("paragraph_close", "p", -1), e.parentType = r, !0;
}
var xt = [
  [
    "table",
    Hs,
    ["paragraph", "reference"]
  ],
  ["code", Zs],
  [
    "fence",
    Ks,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "blockquote",
    Gs,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "hr",
    Xs,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "list",
    Vs,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  ["reference", eo],
  [
    "html_block",
    ro,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  [
    "heading",
    io,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  ["lheading", so],
  ["paragraph", oo]
], Va = class {
  constructor() {
    O(this, "ruler", new gt()), O(this, "State", Xa);
    for (let e = 0; e < xt.length; e++) this.ruler.push(xt[e][0], xt[e][1], { alt: (xt[e][2] || []).slice() });
  }
  tokenize(e, t, n) {
    let a = this.ruler.getRules(""), r = a.length, i = e.md.options.maxNesting, o = t, s = !1;
    for (; o < n && (e.line = o = e.skipEmptyLines(o), !(o >= n || e.sCount[o] < e.blkIndent)); ) {
      if (e.level >= i) {
        e.line = n;
        break;
      }
      let l = e.line, u = !1;
      for (let p = 0; p < r; p++) if (u = a[p](e, o, n, !1), u) {
        if (l >= e.line) throw Error("block rule didn't increment state.line");
        break;
      }
      if (!u) throw Error("none of the block rules matched");
      e.tight = !s, e.isEmpty(e.line - 1) && (s = !0), o = e.line, o < n && e.isEmpty(o) && (s = !0, o++, e.line = o);
    }
  }
  parse(e, t, n, a) {
    if (!e) return;
    let r = new this.State(e, t, n, a);
    this.tokenize(r, r.line, r.lineMax);
  }
}, Qa = class {
  constructor(e, t, n, a) {
    O(this, "pos", 0), O(this, "level", 0), O(this, "pending", ""), O(this, "pendingLevel", 0), O(this, "cache", {}), O(this, "backticks", {}), O(this, "backticksScanned", !1), O(this, "skipHtmlSpecial", !1), O(this, "linkLevel", 0), O(this, "delimiters", []), O(this, "_prev_delimiters", []), O(this, "Token", Ye), this.src = e, this.env = n, this.md = t, this.tokens = a, this.tokens_meta = Array(a.length), this.posMax = this.src.length;
  }
  pushPending() {
    let e = new Ye("text", "", 0);
    return e.content = this.pending, e.level = this.pendingLevel, this.tokens.push(e), this.pending = "", e;
  }
  push(e, t, n) {
    this.pending && this.pushPending();
    let a = new Ye(e, t, n), r;
    return n < 0 && (this.level--, this.delimiters = this._prev_delimiters.pop()), a.level = this.level, n > 0 && (this.level++, this._prev_delimiters.push(this.delimiters), this.delimiters = [], r = { delimiters: this.delimiters }), this.pendingLevel = this.level, this.tokens.push(a), this.tokens_meta.push(r), a;
  }
  scanDelims(e, t) {
    let n = this.posMax, a = this.src.charCodeAt(e), r;
    if (e === 0) r = 32;
    else if (e === 1) r = this.src.charCodeAt(0), (r & 63488) == 55296 && (r = 65533);
    else if (r = this.src.charCodeAt(e - 1), (r & 64512) == 56320) {
      let d = this.src.charCodeAt(e - 2);
      r = (d & 64512) == 55296 ? 65536 + (d - 55296 << 10) + (r - 56320) : 65533;
    } else (r & 64512) == 55296 && (r = 65533);
    let i = e;
    for (; i < n && this.src.charCodeAt(i) === a; ) i++;
    let o = i - e, s = i < n ? this.src.charCodeAt(i) : 32;
    if ((s & 64512) == 55296) {
      let d = this.src.charCodeAt(i + 1);
      s = (d & 64512) == 56320 ? 65536 + (s - 55296 << 10) + (d - 56320) : 65533;
    } else (s & 64512) == 56320 && (s = 65533);
    let l = ft(r) || pt(r), u = ft(s) || pt(s), p = ht(r), h = ht(s), f = !h && (!u || p || l), m = !p && (!l || h || u);
    return {
      can_open: f && (t || !m || l),
      can_close: m && (t || !f || u),
      length: o
    };
  }
};
function lo(e) {
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
function co(e, t) {
  let n = e.pos;
  for (; n < e.posMax && !lo(e.src.charCodeAt(n)); ) n++;
  return n !== e.pos && (t || (e.pending += e.src.slice(e.pos, n)), e.pos = n, !0);
}
function uo(e) {
  return e >= 65 && e <= 90 || e >= 97 && e <= 122;
}
function ho(e) {
  return e >= 65 && e <= 90 || e >= 97 && e <= 122 || e >= 48 && e <= 57 || e === 43 || e === 45 || e === 46;
}
function po(e, t) {
  if (!e.md.options.linkify || e.linkLevel > 0) return !1;
  let n = e.pos, a = e.posMax;
  if (n + 3 > a || e.src.charCodeAt(n) !== 58 || e.src.charCodeAt(n + 1) !== 47 || e.src.charCodeAt(n + 2) !== 47) return !1;
  let r = n - Math.min(10, e.pending.length, n), i = n;
  for (; i > r && ho(e.src.charCodeAt(i - 1)); ) i--;
  if (i === n || !uo(e.src.charCodeAt(i))) return !1;
  let o = n - i, s = e.md.linkify.matchAtStart(e.src.slice(i));
  if (!s) return !1;
  let l = s.url;
  if (l.length <= o) return !1;
  let u = l.length;
  for (; u > 0 && l.charCodeAt(u - 1) === 42; ) u--;
  u !== l.length && (l = l.slice(0, u));
  let p = e.md.normalizeLink(l);
  if (!e.md.validateLink(p)) return !1;
  if (!t) {
    e.pending = e.pending.slice(0, -o);
    let h = e.push("link_open", "a", 1);
    h.attrs = [["href", p]], h.markup = "linkify", h.info = "auto";
    let f = e.push("text", "", 0);
    f.content = e.md.normalizeLinkText(l);
    let m = e.push("link_close", "a", -1);
    m.markup = "linkify", m.info = "auto";
  }
  return e.pos += l.length - o, !0;
}
function fo(e, t) {
  let n = e.pos;
  if (e.src.charCodeAt(n) !== 10) return !1;
  let a = e.pending.length - 1, r = e.posMax;
  if (!t)
    if (a >= 0 && e.pending.charCodeAt(a) === 32)
      if (a >= 1 && e.pending.charCodeAt(a - 1) === 32) {
        let i = a - 1;
        for (; i >= 1 && e.pending.charCodeAt(i - 1) === 32; ) i--;
        e.pending = e.pending.slice(0, i), e.push("hardbreak", "br", 0);
      } else e.pending = e.pending.slice(0, -1), e.push("softbreak", "br", 0);
    else e.push("softbreak", "br", 0);
  for (n++; n < r && le(e.src.charCodeAt(n)); ) n++;
  return e.pos = n, !0;
}
var mn = [];
for (let e = 0; e < 256; e++) mn.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(e) {
  mn[e.charCodeAt(0)] = 1;
});
function go(e, t) {
  let n = e.pos, a = e.posMax;
  if (e.src.charCodeAt(n) !== 92 || (n++, n >= a)) return !1;
  let r = e.src.charCodeAt(n);
  if (r === 10) {
    for (t || e.push("hardbreak", "br", 0), n++; n < a && (r = e.src.charCodeAt(n), le(r)); ) n++;
    return e.pos = n, !0;
  }
  if (r === 32) {
    if (!t) {
      let s = e.push("text_special", "", 0);
      s.content = "\\", s.markup = "\\", s.info = "escape";
    }
    return e.pos = n, !0;
  }
  let i = e.src[n];
  if (r >= 55296 && r <= 56319 && n + 1 < a) {
    let s = e.src.charCodeAt(n + 1);
    s >= 56320 && s <= 57343 && (i += e.src[n + 1], n++);
  }
  let o = "\\" + i;
  if (!t) {
    let s = e.push("text_special", "", 0);
    s.content = r < 256 && mn[r] !== 0 ? i : o, s.markup = o, s.info = "escape";
  }
  return e.pos = n + 1, !0;
}
function mo(e) {
  let t = {}, n = 0;
  for (; (n = e.indexOf("`", n)) !== -1; ) {
    let a = n;
    for (; e.charCodeAt(++n) === 96; ) ;
    t[n - a] = a;
  }
  return t;
}
function bo(e, t) {
  var n;
  let a = e.pos;
  if (e.src.charCodeAt(a) !== 96) return !1;
  let r = e.posMax, i = a + 1;
  for (; i < r && e.src.charCodeAt(i) === 96; ) i++;
  let o = e.src.slice(a, i), s = o.length;
  if (e.backticksScanned || (e.backticks = mo(e.src), e.backticksScanned = !0), ((n = e.backticks[s]) == null ? -1 : n) >= i) {
    let l = i, u;
    for (; (u = e.src.indexOf("`", l)) !== -1 && u < r; ) {
      for (l = u + 1; e.src.charCodeAt(l) === 96; ) l++;
      if (l > r) break;
      if (l - u === s) {
        if (!t) {
          let p = e.push("code_inline", "code", 0);
          p.markup = o;
          let h = e.src.slice(i, u).replace(/\n/g, " ");
          h.startsWith(" ") && h.endsWith(" ") && /[^ ]/.test(h) && (h = h.slice(1, -1)), p.content = h;
        }
        return e.pos = l, !0;
      }
    }
  }
  return t || (e.pending += o), e.pos = i, !0;
}
function vo(e, t) {
  let n = e.pos, a = e.src.charCodeAt(n);
  if (t || a !== 126) return !1;
  let r = e.scanDelims(e.pos, !0), i = r.length, o = String.fromCharCode(a);
  if (i < 2) return !1;
  let s;
  i % 2 && (s = e.push("text", "", 0), s.content = o, i--);
  for (let l = 0; l < i; l += 2) s = e.push("text", "", 0), s.content = o + o, e.delimiters.push({
    marker: a,
    length: 0,
    token: e.tokens.length - 1,
    end: -1,
    open: r.can_open,
    close: r.can_close
  });
  return e.pos += r.length, !0;
}
function Un(e, t) {
  let n, a = [], r = t.length;
  for (let i = 0; i < r; i++) {
    let o = t[i];
    if (o.marker !== 126 || o.end === -1) continue;
    let s = t[o.end];
    n = e.tokens[o.token], n.type = "s_open", n.tag = "s", n.nesting = 1, n.markup = "~~", n.content = "", n = e.tokens[s.token], n.type = "s_close", n.tag = "s", n.nesting = -1, n.markup = "~~", n.content = "", e.tokens[s.token - 1].type === "text" && e.tokens[s.token - 1].content === "~" && a.push(s.token - 1);
  }
  for (; a.length; ) {
    let i = a.pop(), o = i + 1;
    for (; o < e.tokens.length && e.tokens[o].type === "s_close"; ) o++;
    o--, i !== o && (n = e.tokens[o], e.tokens[o] = e.tokens[i], e.tokens[i] = n);
  }
}
function zo(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  Un(e, e.delimiters);
  for (let r = 0; r < n; r++) {
    var a;
    let i = (a = t[r]) == null ? void 0 : a.delimiters;
    i && Un(e, i);
  }
}
var er = {
  tokenize: vo,
  postProcess: zo
};
function ko(e, t) {
  let n = e.pos, a = e.src.charCodeAt(n);
  if (t || a !== 95 && a !== 42) return !1;
  let r = e.scanDelims(e.pos, a === 42);
  for (let i = 0; i < r.length; i++) {
    let o = e.push("text", "", 0);
    o.content = String.fromCharCode(a), e.delimiters.push({
      marker: a,
      length: r.length,
      token: e.tokens.length - 1,
      end: -1,
      open: r.can_open,
      close: r.can_close
    });
  }
  return e.pos += r.length, !0;
}
function Pn(e, t) {
  let n = t.length;
  for (let a = n - 1; a >= 0; a--) {
    let r = t[a];
    if (r.marker !== 95 && r.marker !== 42 || r.end === -1) continue;
    let i = t[r.end], o = a > 0 && t[a - 1].end === r.end + 1 && t[a - 1].marker === r.marker && t[a - 1].token === r.token - 1 && t[r.end + 1].token === i.token + 1, s = String.fromCharCode(r.marker), l = e.tokens[r.token];
    l.type = o ? "strong_open" : "em_open", l.tag = o ? "strong" : "em", l.nesting = 1, l.markup = o ? s + s : s, l.content = "";
    let u = e.tokens[i.token];
    u.type = o ? "strong_close" : "em_close", u.tag = o ? "strong" : "em", u.nesting = -1, u.markup = o ? s + s : s, u.content = "", o && (e.tokens[t[a - 1].token].content = "", e.tokens[t[r.end + 1].token].content = "", a--);
  }
}
function xo(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  Pn(e, e.delimiters);
  for (let r = 0; r < n; r++) {
    var a;
    let i = (a = t[r]) == null ? void 0 : a.delimiters;
    i && Pn(e, i);
  }
}
var tr = {
  tokenize: ko,
  postProcess: xo
};
function _o(e, t) {
  let n, a, r, i, o = "", s = "", l = e.pos, u = !0;
  if (e.src.charCodeAt(e.pos) !== 91) return !1;
  let p = e.pos, h = e.posMax, f = e.pos + 1, m = e.md.helpers.parseLinkLabel(e, e.pos, !0);
  if (m < 0) return !1;
  let d = m + 1;
  if (d < h && e.src.charCodeAt(d) === 40) {
    for (u = !1, d++; d < h && (n = e.src.charCodeAt(d), le(n) || n === 10); d++) ;
    if (d >= h) return !1;
    if (l = d, r = e.md.helpers.parseLinkDestination(e.src, d, e.posMax), r.ok) {
      for (o = e.md.normalizeLink(r.str), e.md.validateLink(o) ? d = r.pos : o = "", l = d; d < h && (n = e.src.charCodeAt(d), le(n) || n === 10); d++) ;
      if (r = e.md.helpers.parseLinkTitle(e.src, d, e.posMax), d < h && l !== d && r.ok) for (s = r.str, d = r.pos; d < h && (n = e.src.charCodeAt(d), le(n) || n === 10); d++) ;
    }
    (d >= h || e.src.charCodeAt(d) !== 41) && (u = !0), d++;
  }
  if (u) {
    if (e.env.references === void 0) return !1;
    if (d < h && e.src.charCodeAt(d) === 91 ? (l = d + 1, d = e.md.helpers.parseLinkLabel(e, d), d >= 0 ? a = e.src.slice(l, d++) : d = m + 1) : d = m + 1, a || (a = e.src.slice(f, m)), a = Tt(a), i = e.env.references[a], !i) return e.pos = p, !1;
    o = i.href, s = i.title;
  }
  if (!t) {
    e.pos = f, e.posMax = m;
    let w = e.push("link_open", "a", 1), k = [["href", o]];
    if (w.attrs = k, s && k.push(["title", s]), a) {
      let z = /* @__PURE__ */ Object.create(null);
      z.label = a, w.meta = z;
    }
    e.linkLevel++, e.md.inline.tokenize(e), e.linkLevel--, e.push("link_close", "a", -1);
  }
  return e.pos = d, e.posMax = h, !0;
}
function wo(e, t) {
  let n, a, r, i, o, s, l, u, p = "", h = e.pos, f = e.posMax;
  if (e.src.charCodeAt(e.pos) !== 33 || e.src.charCodeAt(e.pos + 1) !== 91) return !1;
  let m = e.pos + 2, d = e.md.helpers.parseLinkLabel(e, e.pos + 1, !1);
  if (d < 0) return !1;
  if (i = d + 1, i < f && e.src.charCodeAt(i) === 40) {
    for (i++; i < f && (n = e.src.charCodeAt(i), le(n) || n === 10); i++) ;
    if (i >= f) return !1;
    for (u = i, s = e.md.helpers.parseLinkDestination(e.src, i, e.posMax), s.ok && (p = e.md.normalizeLink(s.str), e.md.validateLink(p) ? i = s.pos : p = ""), u = i; i < f && (n = e.src.charCodeAt(i), le(n) || n === 10); i++) ;
    if (s = e.md.helpers.parseLinkTitle(e.src, i, e.posMax), i < f && u !== i && s.ok) for (l = s.str, i = s.pos; i < f && (n = e.src.charCodeAt(i), le(n) || n === 10); i++) ;
    else l = "";
    if (i >= f || e.src.charCodeAt(i) !== 41) return e.pos = h, !1;
    i++;
  } else {
    if (e.env.references === void 0) return !1;
    if (i < f && e.src.charCodeAt(i) === 91 ? (u = i + 1, i = e.md.helpers.parseLinkLabel(e, i), i >= 0 ? r = e.src.slice(u, i++) : i = d + 1) : i = d + 1, r || (r = e.src.slice(m, d)), r = Tt(r), o = e.env.references[r], !o) return e.pos = h, !1;
    p = o.href, l = o.title;
  }
  if (!t) {
    a = e.src.slice(m, d);
    let w = [];
    e.md.inline.parse(a, e.md, e.env, w);
    let k = e.push("image", "img", 0), z = [["src", p], ["alt", ""]];
    if (k.attrs = z, k.children = w, k.content = a, l && z.push(["title", l]), r) {
      let _ = /* @__PURE__ */ Object.create(null);
      _.label = r, k.meta = _;
    }
  }
  return e.pos = i, e.posMax = f, !0;
}
var qo = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/, yo = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function Ro(e, t) {
  let n = e.pos;
  if (e.src.charCodeAt(n) !== 60) return !1;
  let a = e.pos, r = e.posMax;
  for (; ; ) {
    if (++n >= r) return !1;
    let o = e.src.charCodeAt(n);
    if (o === 60) return !1;
    if (o === 62) break;
  }
  let i = e.src.slice(a + 1, n);
  if (yo.test(i)) {
    let o = e.md.normalizeLink(i);
    if (!e.md.validateLink(o)) return !1;
    if (!t) {
      let s = e.push("link_open", "a", 1);
      s.attrs = [["href", o]], s.markup = "autolink", s.info = "auto";
      let l = e.push("text", "", 0);
      l.content = e.md.normalizeLinkText(i);
      let u = e.push("link_close", "a", -1);
      u.markup = "autolink", u.info = "auto";
    }
    return e.pos += i.length + 2, !0;
  }
  if (qo.test(i)) {
    let o = e.md.normalizeLink(`mailto:${i}`);
    if (!e.md.validateLink(o)) return !1;
    if (!t) {
      let s = e.push("link_open", "a", 1);
      s.attrs = [["href", o]], s.markup = "autolink", s.info = "auto";
      let l = e.push("text", "", 0);
      l.content = e.md.normalizeLinkText(i);
      let u = e.push("link_close", "a", -1);
      u.markup = "autolink", u.info = "auto";
    }
    return e.pos += i.length + 2, !0;
  }
  return !1;
}
function Eo(e) {
  return /^<a[>\s]/i.test(e);
}
function Co(e) {
  return /^<\/a\s*>/i.test(e);
}
function nr(e) {
  let t = e | 32;
  return t >= 97 && t <= 122;
}
function No(e, t) {
  let n = e.src, a, r;
  if (n.startsWith("<!--", t)) {
    if (n.startsWith(">", t + 4)) return t + 5;
    if (n.startsWith("->", t + 4)) return t + 6;
    a = t + 4, r = "-->";
  } else if (n.startsWith("<![CDATA[", t)) a = t + 9, r = "]]>";
  else if (n.charCodeAt(t + 1) === 63) a = t + 2, r = "?>";
  else if (nr(n.charCodeAt(t + 2))) a = t + 3, r = ">";
  else return -1;
  if (e.skipHtmlSpecial) return -1;
  let i = n.indexOf(r, a);
  return i < 0 ? (e.skipHtmlSpecial = !0, -1) : i + r.length;
}
function Ao(e, t) {
  if (!e.md.options.html) return !1;
  let n = e.posMax, a = e.pos;
  if (e.src.charCodeAt(a) !== 60 || a + 2 >= n) return !1;
  let r, i = e.src.charCodeAt(a + 1);
  if (i === 33 || i === 63) r = No(e, a);
  else if (i === 47 || nr(i)) {
    let o = e.src.slice(a).match(Ya);
    r = o ? a + o[0].length : -1;
  } else return !1;
  if (r < 0) return !1;
  if (!t) {
    let o = e.push("html_inline", "", 0);
    o.content = e.src.slice(a, r), Eo(o.content) && e.linkLevel++, Co(o.content) && e.linkLevel--;
  }
  return e.pos = r, !0;
}
var Do = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i, So = /^&([a-z][a-z0-9]{1,31});/i;
function To(e, t) {
  let n = e.pos, a = e.posMax;
  if (e.src.charCodeAt(n) !== 38 || n + 1 >= a) return !1;
  if (e.src.charCodeAt(n + 1) === 35) {
    let r = e.src.slice(n).match(Do);
    if (r) {
      if (!t) {
        let i = r[1][0].toLowerCase() === "x" ? parseInt(r[1].slice(1), 16) : parseInt(r[1], 10), o = e.push("text_special", "", 0);
        o.content = gn(i) ? dt(i) : dt(65533), o.markup = r[0], o.info = "entity";
      }
      return e.pos += r[0].length, !0;
    }
  } else {
    let r = e.src.slice(n).match(So);
    if (r) {
      let i = Ua(r[0]);
      if (i !== r[0]) {
        if (!t) {
          let o = e.push("text_special", "", 0);
          o.content = i, o.markup = r[0], o.info = "entity";
        }
        return e.pos += r[0].length, !0;
      }
    }
  }
  return !1;
}
function Jn(e) {
  let t = {}, n = e.length;
  if (!n) return;
  let a = 0, r = -2, i = [];
  for (let o = 0; o < n; o++) {
    let s = e[o];
    if (i.push(0), (e[a].marker !== s.marker || r !== s.token - 1) && (a = o), r = s.token, s.length = s.length || 0, !s.close) continue;
    t.hasOwnProperty(s.marker) || (t[s.marker] = [
      -1,
      -1,
      -1,
      -1,
      -1,
      -1
    ]);
    let l = t[s.marker][(s.open ? 3 : 0) + s.length % 3], u = a - i[a] - 1, p = u;
    for (; u > l; u -= i[u] + 1) {
      let h = e[u];
      if (h.marker === s.marker && h.open && h.end < 0) {
        let f = !1;
        if ((h.close || s.open) && (h.length + s.length) % 3 == 0 && (h.length % 3 != 0 || s.length % 3 != 0) && (f = !0), !f) {
          let m = u > 0 && !e[u - 1].open ? i[u - 1] + 1 : 0;
          i[o] = o - u + m, i[u] = m, s.open = !1, h.end = o, h.close = !1, p = -1, r = -2;
          break;
        }
      }
    }
    p !== -1 && (t[s.marker][(s.open ? 3 : 0) + (s.length || 0) % 3] = p);
  }
}
function Fo(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  Jn(e.delimiters);
  for (let r = 0; r < n; r++) {
    var a;
    let i = (a = t[r]) == null ? void 0 : a.delimiters;
    i && Jn(i);
  }
}
function Mo(e) {
  let t, n, a = 0, r = e.tokens, i = e.tokens.length;
  for (t = n = 0; t < i; t++) r[t].nesting < 0 && a--, r[t].level = a, r[t].nesting > 0 && a++, r[t].type === "text" && t + 1 < i && r[t + 1].type === "text" ? r[t + 1].content = r[t].content + r[t + 1].content : (t !== n && (r[n] = r[t]), n++);
  t !== n && (r.length = n);
}
var Pt = [
  ["text", co],
  ["linkify", po],
  ["newline", fo],
  ["escape", go],
  ["backticks", bo],
  ["strikethrough", er.tokenize],
  ["emphasis", tr.tokenize],
  ["link", _o],
  ["image", wo],
  ["autolink", Ro],
  ["html_inline", Ao],
  ["entity", To]
], Jt = [
  ["balance_pairs", Fo],
  ["strikethrough", er.postProcess],
  ["emphasis", tr.postProcess],
  ["fragments_join", Mo]
], ar = class {
  constructor() {
    O(this, "ruler", new gt()), O(this, "ruler2", new gt()), O(this, "State", Qa);
    for (let e = 0; e < Pt.length; e++) this.ruler.push(Pt[e][0], Pt[e][1]);
    for (let e = 0; e < Jt.length; e++) this.ruler2.push(Jt[e][0], Jt[e][1]);
  }
  skipToken(e) {
    let t = e.pos, n = this.ruler.getRules(""), a = n.length, r = e.md.options.maxNesting, i = e.cache;
    if (i[t] !== void 0) {
      e.pos = i[t];
      return;
    }
    let o = !1;
    if (e.level < r) {
      for (let s = 0; s < a; s++) if (e.level++, o = n[s](e, !0), e.level--, o) {
        if (t >= e.pos) throw Error("inline rule didn't increment state.pos");
        break;
      }
    } else e.pos = e.posMax;
    o || e.pos++, i[t] = e.pos;
  }
  tokenize(e) {
    let t = this.ruler.getRules(""), n = t.length, a = e.posMax, r = e.md.options.maxNesting;
    for (; e.pos < a; ) {
      let i = e.pos, o = !1;
      if (e.level < r) {
        for (let s = 0; s < n; s++) if (o = t[s](e, !1), o) {
          if (i >= e.pos) throw Error("inline rule didn't increment state.pos");
          break;
        }
      }
      if (o) {
        if (e.pos >= a) break;
      } else e.pending += e.src[e.pos++];
    }
    e.pending && e.pushPending();
  }
  parse(e, t, n, a) {
    let r = new this.State(e, t, n, a);
    this.tokenize(r);
    let i = this.ruler2.getRules(""), o = i.length;
    for (let s = 0; s < o; s++) i[s](r);
  }
}, Io = class {
  constructor(e = {}) {
    O(this, "src_Any", Ia.source), O(this, "src_Cc", Oa.source), O(this, "src_Z", La.source), O(this, "src_P", fn.source), O(this, "src_ZPCc", [
      this.src_Z,
      this.src_P,
      this.src_Cc
    ].join("|")), O(this, "src_ZCc", [this.src_Z, this.src_Cc].join("|")), O(this, "cache", {}), O(this, "opts", {
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
    let a = this.escapeRE(e), r = this.escapeRE(t), i = `(?:(?!${this.src_ZCc}|${a}|${r}).)`, o = `${a}${i}{0,1000}${r}`;
    for (let s = 2; s <= n; s++) o = `${a}(?:${i}|${o}){0,1000}${r}`;
    return o;
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
    let n = "[0-9A-Fa-f]{1,4}", a = `(?:(?:${n}:${n})|${this.get_ipv4_addr().source})`;
    return (t = (e = this.cache).src_ip6_addr) == null ? e.src_ip6_addr = RegExp(`(?:(?:${n}:){6}${a}|::(?:${n}:){5}${a}|(?:${n})?::(?:${n}:){4}${a}|(?:(?:${n}:){0,1}${n})?::(?:${n}:){3}${a}|(?:(?:${n}:){0,2}${n})?::(?:${n}:){2}${a}|(?:(?:${n}:){0,3}${n})?::${n}:${a}|(?:(?:${n}:){0,4}${n})?::${a}|(?:(?:${n}:){0,5}${n})?::${n}|(?:(?:${n}:){0,6}${n})?::)`) : t;
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
}, Wt = {
  validate: (e, t, n) => {
    let a = n.re.get_http_validator();
    a.lastIndex = t;
    let r = a.exec(e);
    return r ? r[0].length : 0;
  },
  normalize: (e, t) => t.normalize(e)
}, Oo = {
  "http:": Wt,
  "https:": Wt,
  "ftp:": Wt,
  "//": {
    validate: function(e, t, n) {
      let a = n.re.get_relative_proto_validator();
      a.lastIndex = t;
      let r = a.exec(e);
      return r ? t >= 3 && e[t - 3] === ":" || t >= 3 && e[t - 3] === "/" ? 0 : r[0].length : 0;
    },
    normalize: (e, t) => t.normalize(e)
  },
  "mailto:": {
    validate: function(e, t, n) {
      let a = n.re.get_mailto_validator();
      a.lastIndex = t;
      let r = a.exec(e);
      return r ? r[0].length : 0;
    },
    normalize: (e, t) => t.normalize(e)
  }
}, Bo = "a:cdefgilmnoqrstuwxz|b:abdefghijmnorstvwyz|c:acdfghiklmnoruvwxyz|d:ejkmoz|e:cegrstu|f:ijkmor|g:abdefghilmnpqrstuwy|h:kmnrtu|i:delmnoqrst|j:emop|k:eghimnprwyz|l:abcikrstuvy|m:acdeghklmnopqrstuvwxyz|n:acefgilopruz|o:m|p:aefghklmnrstwy|q:a|r:eosuw|s:abcdeghijklmnortuvxyz|t:cdfghjklmnortvwz|u:agksyz|v:aceginu|w:fs|y:et|z:amw", Lo = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф";
function $o() {
  let e = Lo.split("|");
  return Bo.split("|").forEach((t) => {
    let n = t.indexOf(":"), a = t.slice(0, n);
    for (let r of t.slice(n + 1)) e.push(a + r);
  }), e;
}
var jo = {
  fuzzyLink: !1,
  fuzzyEmail: !0,
  fuzzyIP: !1,
  "---": !1,
  tlds: $o(),
  urlAuth: !1,
  maxLength: 1e4
}, Wn = class {
  constructor(e, t, n, a) {
    O(this, "schema", void 0), O(this, "index", void 0), O(this, "lastIndex", void 0), O(this, "raw", void 0), O(this, "text", void 0), O(this, "url", void 0);
    let r = e.slice(n, a);
    this.schema = t.toLowerCase(), this.index = n, this.lastIndex = a, this.raw = r, this.text = r, this.url = r;
  }
}, Uo = class {
  constructor(e = {}) {
    O(this, "__opts__", void 0), O(this, "__schemas__", void 0), O(this, "re", void 0);
    let { rebuilder: t, ...n } = e;
    this.__opts__ = {
      ...jo,
      ...n
    }, this.__schemas__ = { ...Oo }, this.re = t || new Io(), this.re.set({
      ...this.__opts__,
      schema_names: Object.keys(this.__schemas__)
    });
  }
  add(e, t = null) {
    if (!t) delete this.__schemas__[e];
    else {
      let n = {
        normalize: (a, r) => r.normalize(a),
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
      let a = this.re.get_fuzzy_mail_host_search(), r = this.re.get_mail_name_validator();
      for (a.lastIndex = 0; (t = a.exec(e)) !== null; ) {
        let i = e.slice(Math.max(0, t.index - 65), t.index);
        if (r.test(i)) return !0;
      }
    }
    return !1;
  }
  testSchemaAt(e, t, n) {
    return this.__schemas__[t.toLowerCase()] ? this.__schemas__[t.toLowerCase()].validate(e.slice(0, n + this.__opts__.maxLength), n, this) : 0;
  }
  match(e) {
    let t = [], n = this.re.get_schema_search(), a, r, i, o, s, l, u = !1, p = !1, h = !1, f = 0;
    if (!e.length) return null;
    for (n.lastIndex = 0, this.__opts__.fuzzyLink && this.__schemas__["http:"] && (a = this.re.get_fuzzy_link_search(), a.lastIndex = 0), this.__opts__.fuzzyEmail && this.__schemas__["mailto:"] && (r = this.re.get_fuzzy_mail_host_search(), r.lastIndex = 0, i = this.re.get_mail_name_validator()); ; ) {
      let m = Math.max(f - 1, 0);
      if (r && i && !h && (!s || s.index < f)) for (r.lastIndex < m && (r.lastIndex = m); ; ) {
        let _ = r.exec(e);
        if (!_) {
          h = !0, s = void 0;
          break;
        }
        let y = i.exec(e.slice(Math.max(0, _.index - 65), _.index));
        if (y) {
          if (s = {
            schema: "mailto:",
            index: _.index - y[1].length,
            lastIndex: _.index + _[0].length
          }, s.index >= f) break;
          r.lastIndex < m && (r.lastIndex = m);
        }
      }
      if (a && !p && (!o || o.index < f)) for (a.lastIndex < m && (a.lastIndex = m); ; ) {
        let _ = a.exec(e);
        if (!_) {
          p = !0, o = void 0;
          break;
        }
        if (o = {
          schema: "",
          index: _.index + _[1].length,
          lastIndex: _.index + _[0].length
        }, o.index >= f) break;
        a.lastIndex < m && (a.lastIndex = m);
      }
      let d = s;
      (!d || o && (o.index < d.index || o.index === d.index && o.lastIndex > d.lastIndex)) && (d = o);
      let w;
      if (!u) for (; ; ) {
        if (!l) {
          n.lastIndex < m && (n.lastIndex = m);
          let C = n.exec(e);
          if (!C) {
            u = !0;
            break;
          }
          l = {
            schema: C[2],
            index: C.index + C[1].length,
            lastIndex: C.index + C[0].length
          };
        }
        if (l.index < f) {
          l = void 0;
          continue;
        }
        if (d && l.index > d.index) break;
        let _ = l;
        l = void 0;
        let y = this.testSchemaAt(e, _.schema, _.lastIndex);
        if (y) {
          w = {
            schema: _.schema,
            index: _.index,
            lastIndex: _.lastIndex + y
          };
          break;
        }
      }
      let k = w;
      if ((!k || s && (s.index < k.index || s.index === k.index && s.lastIndex > k.lastIndex)) && (k = s), (!k || o && (o.index < k.index || o.index === k.index && o.lastIndex > k.lastIndex)) && (k = o), !k) break;
      k === s ? s = void 0 : k === o && (o = void 0);
      let z = new Wn(e, k.schema, k.index, k.lastIndex);
      z.schema ? this.__schemas__[z.schema].normalize(z, this) : this.normalize(z), t.push(z), f = k.lastIndex;
    }
    return t.length ? t : null;
  }
  matchAtStart(e) {
    if (!e.length) return null;
    let t = this.re.get_schema_at_start().exec(e);
    if (!t) return null;
    let n = this.testSchemaAt(e, t[2], t[0].length);
    if (!n) return null;
    let a = new Wn(e, t[2], t.index + t[1].length, t.index + t[0].length + n);
    return this.__schemas__[a.schema].normalize(a, this), a;
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
}, rt = 2147483647, $e = 36, rr = 1, Et = 26, Po = 38, Jo = 700, ir = 72, sr = 128, or = "-", Wo = /^xn--/, Ho = /[^\0-\x7F]/, Zo = /[\x2E\u3002\uFF0E\uFF61]/g, Ko = {
  overflow: "Overflow: input needs wider integers to process",
  "not-basic": "Illegal input >= 0x80 (not a basic code point)",
  "invalid-input": "Invalid input"
}, Go = 35, Me = Math.floor, Ht = String.fromCharCode;
function Je(e) {
  throw RangeError(Ko[e]);
}
function Xo(e, t) {
  let n = [], a = e.length;
  for (; a--; ) n[a] = t(e[a]);
  return n;
}
function Hn(e, t) {
  let n = e.split("@"), a = "";
  n.length > 1 && (a = n[0] + "@", e = n[1]), e = e.replace(Zo, ".");
  let r = Xo(e.split("."), t).join(".");
  return a + r;
}
function lr(e) {
  let t = [], n = 0, a = e.length;
  for (; n < a; ) {
    let r = e.charCodeAt(n++);
    if (r >= 55296 && r <= 56319 && n < a) {
      let i = e.charCodeAt(n++);
      (i & 64512) == 56320 ? t.push(((r & 1023) << 10) + (i & 1023) + 65536) : (t.push(r), n--);
    } else t.push(r);
  }
  return t;
}
var Yo = (e) => String.fromCodePoint(...e), Vo = function(e) {
  return e >= 48 && e < 58 ? 26 + (e - 48) : e >= 65 && e < 91 ? e - 65 : e >= 97 && e < 123 ? e - 97 : $e;
}, Zn = function(e, t) {
  return e + 22 + 75 * (e < 26) - ((t != 0) << 5);
}, cr = function(e, t, n) {
  let a = 0;
  for (e = n ? Me(e / Jo) : e >> 1, e += Me(e / t); e > 455; a += $e) e = Me(e / Go);
  return Me(a + 36 * e / (e + Po));
}, Kn = function(e) {
  let t = [], n = e.length, a = 0, r = sr, i = ir, o = e.lastIndexOf(or);
  o < 0 && (o = 0);
  for (let s = 0; s < o; ++s) e.charCodeAt(s) >= 128 && Je("not-basic"), t.push(e.charCodeAt(s));
  for (let s = o > 0 ? o + 1 : 0; s < n; ) {
    let l = a;
    for (let p = 1, h = $e; ; h += $e) {
      s >= n && Je("invalid-input");
      let f = Vo(e.charCodeAt(s++));
      f >= $e && Je("invalid-input"), f > Me((rt - a) / p) && Je("overflow"), a += f * p;
      let m = h <= i ? rr : h >= i + Et ? Et : h - i;
      if (f < m) break;
      let d = $e - m;
      p > Me(rt / d) && Je("overflow"), p *= d;
    }
    let u = t.length + 1;
    i = cr(a - l, u, l == 0), Me(a / u) > rt - r && Je("overflow"), r += Me(a / u), a %= u, t.splice(a++, 0, r);
  }
  return String.fromCodePoint(...t);
}, Gn = function(e) {
  let t = [];
  e = lr(e);
  let n = e.length, a = sr, r = 0, i = ir;
  for (let l of e) l < 128 && t.push(Ht(l));
  let o = t.length, s = o;
  for (o && t.push(or); s < n; ) {
    let l = rt;
    for (let p of e) p >= a && p < l && (l = p);
    let u = s + 1;
    l - a > Me((rt - r) / u) && Je("overflow"), r += (l - a) * u, a = l;
    for (let p of e) if (p < a && ++r > rt && Je("overflow"), p === a) {
      let h = r;
      for (let f = $e; ; f += $e) {
        let m = f <= i ? rr : f >= i + Et ? Et : f - i;
        if (h < m) break;
        let d = h - m, w = $e - m;
        t.push(Ht(Zn(m + d % w, 0))), h = Me(d / w);
      }
      t.push(Ht(Zn(h, 0))), i = cr(r, u, s === o), r = 0, ++s;
    }
    ++r, ++a;
  }
  return t.join("");
}, Xn = {
  version: "2.3.1",
  ucs2: {
    decode: lr,
    encode: Yo
  },
  decode: Kn,
  encode: Gn,
  toASCII: function(e) {
    return Hn(e, function(t) {
      return Ho.test(t) ? "xn--" + Gn(t) : t;
    });
  },
  toUnicode: function(e) {
    return Hn(e, function(t) {
      return Wo.test(t) ? Kn(t.slice(4).toLowerCase()) : t;
    });
  }
}, Qo = {
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
}, el = /^(vbscript|javascript|file|data):/, tl = /^data:image\/(gif|png|jpeg|webp);/, Yn = [
  "http:",
  "https:",
  "mailto:"
], Te = class {
  validateLink(e) {
    let t = e.trim().toLowerCase();
    return !el.test(t) || tl.test(t);
  }
  normalizeLink(e) {
    let t = nn(e, !0);
    if (t.hostname && (!t.protocol || Yn.indexOf(t.protocol) >= 0)) try {
      t.hostname = Xn.toASCII(t.hostname);
    } catch {
    }
    return t.auth && (t.auth = Le(t.auth)), t.hostname && (t.hostname = Le(t.hostname)), t.pathname && (t.pathname = Le(t.pathname)), t.search && (t.search = Le(t.search)), t.hash && (t.hash = Le(t.hash)), tn(t);
  }
  normalizeLinkText(e) {
    let t = nn(e, !0);
    if (t.hostname && (!t.protocol || Yn.indexOf(t.protocol) >= 0)) try {
      t.hostname = Xn.toUnicode(t.hostname);
    } catch {
    }
    return it(tn(t), it.defaultChars + "%");
  }
  constructor(...e) {
    O(this, "inline", new ar()), O(this, "block", new Va()), O(this, "core", new Ga()), O(this, "renderer", new Ha()), O(this, "linkify", new Uo()), O(this, "utils", is), O(this, "helpers", Object.assign({}, xs));
    let [t, n] = e;
    typeof t == "string" ? (this.configure(t), n && this.set(n)) : (this.configure("default"), this.set(t || {}));
  }
  set(e) {
    return Object.assign(this.options, e), this;
  }
  configure(e) {
    let t;
    if (typeof e == "string") {
      let r = e;
      if (t = Qo[r], !t) throw Error(`Wrong 'markdown-it' preset "${r}", check name`);
    } else t = e;
    if (!t) throw Error("Wrong `markdown-it` preset, can't be empty");
    t.options && (this.options = { ...t.options });
    let n = t.components;
    if (n) {
      var a;
      [
        "core",
        "block",
        "inline"
      ].forEach((i) => {
        var o;
        let s = (o = n[i]) == null ? void 0 : o.rules;
        s && this[i].ruler.enableOnly(s);
      });
      let r = (a = n.inline) == null ? void 0 : a.rules2;
      r && this.inline.ruler2.enableOnly(r);
    }
    return this;
  }
  enable(e, t = !1) {
    let n = [];
    Array.isArray(e) || (e = [e]), [
      "core",
      "block",
      "inline"
    ].forEach((r) => {
      n = n.concat(this[r].ruler.enable(e, !0));
    }), n = n.concat(this.inline.ruler2.enable(e, !0));
    let a = e.filter((r) => n.indexOf(r) < 0);
    if (a.length && !t) throw Error(`MarkdownIt. Failed to enable unknown rule(s): ${a}`);
    return this;
  }
  disable(e, t = !1) {
    let n = [];
    Array.isArray(e) || (e = [e]), [
      "core",
      "block",
      "inline"
    ].forEach((r) => {
      n = n.concat(this[r].ruler.disable(e, !0));
    }), n = n.concat(this.inline.ruler2.disable(e, !0));
    let a = e.filter((r) => n.indexOf(r) < 0);
    if (a.length && !t) throw Error(`MarkdownIt. Failed to disable unknown rule(s): ${a}`);
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
O(Te, "Token", Ye), O(Te, "Ruler", gt), O(Te, "Renderer", Ha), O(Te, "ParserCore", Ga), O(Te, "StateCore", Za), O(Te, "ParserBlock", Va), O(Te, "StateBlock", Xa), O(Te, "ParserInline", ar), O(Te, "StateInline", Qa);
var nl = Pa(Te);
function al(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
function ur(e) {
  return e instanceof Map ? e.clear = e.delete = e.set = function() {
    throw new Error("map is read-only");
  } : e instanceof Set && (e.add = e.clear = e.delete = function() {
    throw new Error("set is read-only");
  }), Object.freeze(e), Object.getOwnPropertyNames(e).forEach((t) => {
    const n = e[t], a = typeof n;
    (a === "object" || a === "function") && !Object.isFrozen(n) && ur(n);
  }), e;
}
class Vn {
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
function dr(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}
function Ze(e, ...t) {
  const n = /* @__PURE__ */ Object.create(null);
  for (const a in e)
    n[a] = e[a];
  return t.forEach(function(a) {
    for (const r in a)
      n[r] = a[r];
  }), /** @type {T} */
  n;
}
const rl = "</span>", Qn = (e) => !!e.scope, il = (e, { prefix: t }) => {
  if (e.startsWith("language:"))
    return e.replace("language:", "language-");
  if (e.includes(".")) {
    const n = e.split(".");
    return [
      `${t}${n.shift()}`,
      ...n.map((a, r) => `${a}${"_".repeat(r + 1)}`)
    ].join(" ");
  }
  return `${t}${e}`;
};
class sl {
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
    this.buffer += dr(t);
  }
  /**
   * Adds a node open to the output stream (if needed)
   *
   * @param {Node} node */
  openNode(t) {
    if (!Qn(t)) return;
    const n = il(
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
    Qn(t) && (this.buffer += rl);
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
const ea = (e = {}) => {
  const t = { children: [] };
  return Object.assign(t, e), t;
};
class bn {
  constructor() {
    this.rootNode = ea(), this.stack = [this.rootNode];
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
    const n = ea({ scope: t });
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
    return typeof n == "string" ? t.addText(n) : n.children && (t.openNode(n), n.children.forEach((a) => this._walk(t, a)), t.closeNode(n)), t;
  }
  /**
   * @param {Node} node
   */
  static _collapse(t) {
    typeof t != "string" && t.children && (t.children.every((n) => typeof n == "string") ? t.children = [t.children.join("")] : t.children.forEach((n) => {
      bn._collapse(n);
    }));
  }
}
class ol extends bn {
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
    const a = t.root;
    n && (a.scope = `language:${n}`), this.add(a);
  }
  toHTML() {
    return new sl(this, this.options).value();
  }
  finalize() {
    return this.closeAllNodes(), !0;
  }
}
function mt(e) {
  return e ? typeof e == "string" ? e : e.source : null;
}
function hr(e) {
  return et("(?=", e, ")");
}
function ll(e) {
  return et("(?:", e, ")*");
}
function cl(e) {
  return et("(?:", e, ")?");
}
function et(...e) {
  return e.map((n) => mt(n)).join("");
}
function ul(e) {
  const t = e[e.length - 1];
  return typeof t == "object" && t.constructor === Object ? (e.splice(e.length - 1, 1), t) : {};
}
function vn(...e) {
  return "(" + (ul(e).capture ? "" : "?:") + e.map((a) => mt(a)).join("|") + ")";
}
function pr(e) {
  return new RegExp(e.toString() + "|").exec("").length - 1;
}
function dl(e, t) {
  const n = e && e.exec(t);
  return n && n.index === 0;
}
const hl = /\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;
function zn(e, { joinWith: t }) {
  let n = 0;
  return e.map((a) => {
    n += 1;
    const r = n;
    let i = mt(a), o = "";
    for (; i.length > 0; ) {
      const s = hl.exec(i);
      if (!s) {
        o += i;
        break;
      }
      o += i.substring(0, s.index), i = i.substring(s.index + s[0].length), s[0][0] === "\\" && s[1] ? o += "\\" + String(Number(s[1]) + r) : (o += s[0], s[0] === "(" && n++);
    }
    return o;
  }).map((a) => `(${a})`).join(t);
}
const pl = /\b\B/, fr = "[a-zA-Z]\\w*", kn = "[a-zA-Z_]\\w*", gr = "\\b\\d+(\\.\\d+)?", mr = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)", br = "\\b(0b[01]+)", fl = "!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~", gl = (e = {}) => {
  const t = /^#![ ]*\//;
  return e.binary && (e.begin = et(
    t,
    /.*\b/,
    e.binary,
    /\b.*/
  )), Ze({
    scope: "meta",
    begin: t,
    end: /$/,
    relevance: 0,
    /** @type {ModeCallback} */
    "on:begin": (n, a) => {
      n.index !== 0 && a.ignoreMatch();
    }
  }, e);
}, bt = {
  begin: "\\\\[\\s\\S]",
  relevance: 0
}, ml = {
  scope: "string",
  begin: "'",
  end: "'",
  illegal: "\\n",
  contains: [bt]
}, bl = {
  scope: "string",
  begin: '"',
  end: '"',
  illegal: "\\n",
  contains: [bt]
}, vl = {
  begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
}, Mt = function(e, t, n = {}) {
  const a = Ze(
    {
      scope: "comment",
      begin: e,
      end: t,
      contains: []
    },
    n
  );
  a.contains.push({
    scope: "doctag",
    // hack to avoid the space from being included. the space is necessary to
    // match here to prevent the plain text rule below from gobbling up doctags
    begin: "[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
    end: /(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,
    excludeBegin: !0,
    relevance: 0
  });
  const r = vn(
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
  return a.contains.push(
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
      begin: et(
        /[ ]+/,
        // necessary to prevent us gobbling up doctags like /* @author Bob Mcgill */
        "(",
        r,
        /[.]?[:]?([.][ ]|[ ])/,
        "){3}"
      )
      // look for 3 words in a row
    }
  ), a;
}, zl = Mt("//", "$"), kl = Mt("/\\*", "\\*/"), xl = Mt("#", "$"), _l = {
  scope: "number",
  begin: gr,
  relevance: 0
}, wl = {
  scope: "number",
  begin: mr,
  relevance: 0
}, ql = {
  scope: "number",
  begin: br,
  relevance: 0
}, yl = {
  scope: "regexp",
  begin: /\/(?=[^/\n]*\/)/,
  end: /\/[gimuy]*/,
  contains: [
    bt,
    {
      begin: /\[/,
      end: /\]/,
      relevance: 0,
      contains: [bt]
    }
  ]
}, Rl = {
  scope: "title",
  begin: fr,
  relevance: 0
}, El = {
  scope: "title",
  begin: kn,
  relevance: 0
}, Cl = {
  // excludes method names from keyword processing
  begin: "\\.\\s*" + kn,
  relevance: 0
}, Nl = function(e) {
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
var _t = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  APOS_STRING_MODE: ml,
  BACKSLASH_ESCAPE: bt,
  BINARY_NUMBER_MODE: ql,
  BINARY_NUMBER_RE: br,
  COMMENT: Mt,
  C_BLOCK_COMMENT_MODE: kl,
  C_LINE_COMMENT_MODE: zl,
  C_NUMBER_MODE: wl,
  C_NUMBER_RE: mr,
  END_SAME_AS_BEGIN: Nl,
  HASH_COMMENT_MODE: xl,
  IDENT_RE: fr,
  MATCH_NOTHING_RE: pl,
  METHOD_GUARD: Cl,
  NUMBER_MODE: _l,
  NUMBER_RE: gr,
  PHRASAL_WORDS_MODE: vl,
  QUOTE_STRING_MODE: bl,
  REGEXP_MODE: yl,
  RE_STARTERS_RE: fl,
  SHEBANG: gl,
  TITLE_MODE: Rl,
  UNDERSCORE_IDENT_RE: kn,
  UNDERSCORE_TITLE_MODE: El
});
function Al(e, t) {
  e.input[e.index - 1] === "." && t.ignoreMatch();
}
function Dl(e, t) {
  e.className !== void 0 && (e.scope = e.className, delete e.className);
}
function Sl(e, t) {
  t && e.beginKeywords && (e.begin = "\\b(" + e.beginKeywords.split(" ").join("|") + ")(?!\\.)(?=\\b|\\s)", e.__beforeBegin = Al, e.keywords = e.keywords || e.beginKeywords, delete e.beginKeywords, e.relevance === void 0 && (e.relevance = 0));
}
function Tl(e, t) {
  Array.isArray(e.illegal) && (e.illegal = vn(...e.illegal));
}
function Fl(e, t) {
  if (e.match) {
    if (e.begin || e.end) throw new Error("begin & end are not supported with match");
    e.begin = e.match, delete e.match;
  }
}
function Ml(e, t) {
  e.relevance === void 0 && (e.relevance = 1);
}
const Il = (e, t) => {
  if (!e.beforeMatch) return;
  if (e.starts) throw new Error("beforeMatch cannot be used with starts");
  const n = Object.assign({}, e);
  Object.keys(e).forEach((a) => {
    delete e[a];
  }), e.keywords = n.keywords, e.begin = et(n.beforeMatch, hr(n.begin)), e.starts = {
    relevance: 0,
    contains: [
      Object.assign(n, { endsParent: !0 })
    ]
  }, e.relevance = 0, delete n.beforeMatch;
}, Ol = [
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
], Bl = "keyword";
function vr(e, t, n = Bl) {
  const a = /* @__PURE__ */ Object.create(null);
  return typeof e == "string" ? r(n, e.split(" ")) : Array.isArray(e) ? r(n, e) : Object.keys(e).forEach(function(i) {
    Object.assign(
      a,
      vr(e[i], t, i)
    );
  }), a;
  function r(i, o) {
    t && (o = o.map((s) => s.toLowerCase())), o.forEach(function(s) {
      const l = s.split("|");
      a[l[0]] = [i, Ll(l[0], l[1])];
    });
  }
}
function Ll(e, t) {
  return t ? Number(t) : $l(e) ? 0 : 1;
}
function $l(e) {
  return Ol.includes(e.toLowerCase());
}
const ta = {}, Ve = (e) => {
  console.error(e);
}, na = (e, ...t) => {
  console.log(`WARN: ${e}`, ...t);
}, tt = (e, t) => {
  ta[`${e}/${t}`] || (console.log(`Deprecated as of ${e}. ${t}`), ta[`${e}/${t}`] = !0);
}, Ct = new Error();
function zr(e, t, { key: n }) {
  let a = 0;
  const r = e[n], i = {}, o = {};
  for (let s = 1; s <= t.length; s++)
    o[s + a] = r[s], i[s + a] = !0, a += pr(t[s - 1]);
  e[n] = o, e[n]._emit = i, e[n]._multi = !0;
}
function jl(e) {
  if (Array.isArray(e.begin)) {
    if (e.skip || e.excludeBegin || e.returnBegin)
      throw Ve("skip, excludeBegin, returnBegin not compatible with beginScope: {}"), Ct;
    if (typeof e.beginScope != "object" || e.beginScope === null)
      throw Ve("beginScope must be object"), Ct;
    zr(e, e.begin, { key: "beginScope" }), e.begin = zn(e.begin, { joinWith: "" });
  }
}
function Ul(e) {
  if (Array.isArray(e.end)) {
    if (e.skip || e.excludeEnd || e.returnEnd)
      throw Ve("skip, excludeEnd, returnEnd not compatible with endScope: {}"), Ct;
    if (typeof e.endScope != "object" || e.endScope === null)
      throw Ve("endScope must be object"), Ct;
    zr(e, e.end, { key: "endScope" }), e.end = zn(e.end, { joinWith: "" });
  }
}
function Pl(e) {
  e.scope && typeof e.scope == "object" && e.scope !== null && (e.beginScope = e.scope, delete e.scope);
}
function Jl(e) {
  Pl(e), typeof e.beginScope == "string" && (e.beginScope = { _wrap: e.beginScope }), typeof e.endScope == "string" && (e.endScope = { _wrap: e.endScope }), jl(e), Ul(e);
}
function Wl(e) {
  function t(o, s) {
    return new RegExp(
      mt(o),
      "m" + (e.case_insensitive ? "i" : "") + (e.unicodeRegex ? "u" : "") + (s ? "g" : "")
    );
  }
  class n {
    constructor() {
      this.matchIndexes = {}, this.regexes = [], this.matchAt = 1, this.position = 0;
    }
    // @ts-ignore
    addRule(s, l) {
      l.position = this.position++, this.matchIndexes[this.matchAt] = l, this.regexes.push([l, s]), this.matchAt += pr(s) + 1;
    }
    compile() {
      this.regexes.length === 0 && (this.exec = () => null);
      const s = this.regexes.map((l) => l[1]);
      this.matcherRe = t(zn(s, { joinWith: "|" }), !0), this.lastIndex = 0;
    }
    /** @param {string} s */
    exec(s) {
      this.matcherRe.lastIndex = this.lastIndex;
      const l = this.matcherRe.exec(s);
      if (!l)
        return null;
      const u = l.findIndex((h, f) => f > 0 && h !== void 0), p = this.matchIndexes[u];
      return l.splice(0, u), Object.assign(l, p);
    }
  }
  class a {
    constructor() {
      this.rules = [], this.multiRegexes = [], this.count = 0, this.lastIndex = 0, this.regexIndex = 0;
    }
    // @ts-ignore
    getMatcher(s) {
      if (this.multiRegexes[s]) return this.multiRegexes[s];
      const l = new n();
      return this.rules.slice(s).forEach(([u, p]) => l.addRule(u, p)), l.compile(), this.multiRegexes[s] = l, l;
    }
    resumingScanAtSamePosition() {
      return this.regexIndex !== 0;
    }
    considerAll() {
      this.regexIndex = 0;
    }
    // @ts-ignore
    addRule(s, l) {
      this.rules.push([s, l]), l.type === "begin" && this.count++;
    }
    /** @param {string} s */
    exec(s) {
      const l = this.getMatcher(this.regexIndex);
      l.lastIndex = this.lastIndex;
      let u = l.exec(s);
      if (this.resumingScanAtSamePosition() && !(u && u.index === this.lastIndex)) {
        const p = this.getMatcher(0);
        p.lastIndex = this.lastIndex + 1, u = p.exec(s);
      }
      return u && (this.regexIndex += u.position + 1, this.regexIndex === this.count && this.considerAll()), u;
    }
  }
  function r(o) {
    const s = new a();
    return o.contains.forEach((l) => s.addRule(l.begin, { rule: l, type: "begin" })), o.terminatorEnd && s.addRule(o.terminatorEnd, { type: "end" }), o.illegal && s.addRule(o.illegal, { type: "illegal" }), s;
  }
  function i(o, s) {
    const l = (
      /** @type CompiledMode */
      o
    );
    if (o.isCompiled) return l;
    [
      Dl,
      // do this early so compiler extensions generally don't have to worry about
      // the distinction between match/begin
      Fl,
      Jl,
      Il
    ].forEach((p) => p(o, s)), e.compilerExtensions.forEach((p) => p(o, s)), o.__beforeBegin = null, [
      Sl,
      // do this later so compiler extensions that come earlier have access to the
      // raw array if they wanted to perhaps manipulate it, etc.
      Tl,
      // default to 1 relevance if not specified
      Ml
    ].forEach((p) => p(o, s)), o.isCompiled = !0;
    let u = null;
    return typeof o.keywords == "object" && o.keywords.$pattern && (o.keywords = Object.assign({}, o.keywords), u = o.keywords.$pattern, delete o.keywords.$pattern), u = u || /\w+/, o.keywords && (o.keywords = vr(o.keywords, e.case_insensitive)), l.keywordPatternRe = t(u, !0), s && (o.begin || (o.begin = /\B|\b/), l.beginRe = t(l.begin), !o.end && !o.endsWithParent && (o.end = /\B|\b/), o.end && (l.endRe = t(l.end)), l.terminatorEnd = mt(l.end) || "", o.endsWithParent && s.terminatorEnd && (l.terminatorEnd += (o.end ? "|" : "") + s.terminatorEnd)), o.illegal && (l.illegalRe = t(
      /** @type {RegExp | string} */
      o.illegal
    )), o.contains || (o.contains = []), o.contains = [].concat(...o.contains.map(function(p) {
      return Hl(p === "self" ? o : p);
    })), o.contains.forEach(function(p) {
      i(
        /** @type Mode */
        p,
        l
      );
    }), o.starts && i(o.starts, s), l.matcher = r(l), l;
  }
  if (e.compilerExtensions || (e.compilerExtensions = []), e.contains && e.contains.includes("self"))
    throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");
  return e.classNameAliases = Ze(e.classNameAliases || {}), i(
    /** @type Mode */
    e
  );
}
function kr(e) {
  return e ? e.endsWithParent || kr(e.starts) : !1;
}
function Hl(e) {
  return e.variants && !e.cachedVariants && (e.cachedVariants = e.variants.map(function(t) {
    return Ze(e, { variants: null }, t);
  })), e.cachedVariants ? e.cachedVariants : kr(e) ? Ze(e, { starts: e.starts ? Ze(e.starts) : null }) : Object.isFrozen(e) ? Ze(e) : e;
}
var Zl = "11.11.1";
class Kl extends Error {
  constructor(t, n) {
    super(t), this.name = "HTMLInjectionError", this.html = n;
  }
}
const Zt = dr, aa = Ze, ra = Symbol("nomatch"), Gl = 7, xr = function(e) {
  const t = /* @__PURE__ */ Object.create(null), n = /* @__PURE__ */ Object.create(null), a = [];
  let r = !0;
  const i = "Could not find the language '{}', did you forget to load/include a language module?", o = { disableAutodetect: !0, name: "Plain text", contains: [] };
  let s = {
    ignoreUnescapedHTML: !1,
    throwUnescapedHTML: !1,
    noHighlightRe: /^(no-?highlight)$/i,
    languageDetectRe: /\blang(?:uage)?-([\w-]+)\b/i,
    classPrefix: "hljs-",
    cssSelector: "pre code",
    languages: null,
    // beta configuration options, subject to change, welcome to discuss
    // https://github.com/highlightjs/highlight.js/issues/1086
    __emitter: ol
  };
  function l(N) {
    return s.noHighlightRe.test(N);
  }
  function u(N) {
    let I = N.className + " ";
    I += N.parentNode ? N.parentNode.className : "";
    const R = s.languageDetectRe.exec(I);
    if (R) {
      const B = D(R[1]);
      return B || (na(i.replace("{}", R[1])), na("Falling back to no-highlight mode for this block.", N)), B ? R[1] : "no-highlight";
    }
    return I.split(/\s+/).find((B) => l(B) || D(B));
  }
  function p(N, I, R) {
    let B = "", W = "";
    typeof I == "object" ? (B = N, R = I.ignoreIllegals, W = I.language) : (tt("10.7.0", "highlight(lang, code, ...args) has been deprecated."), tt("10.7.0", `Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`), W = N, B = I), R === void 0 && (R = !0);
    const P = {
      code: B,
      language: W
    };
    V("before:highlight", P);
    const ee = P.result ? P.result : h(P.language, P.code, R);
    return ee.code = P.code, V("after:highlight", ee), ee;
  }
  function h(N, I, R, B) {
    const W = /* @__PURE__ */ Object.create(null);
    function P(q, E) {
      return q.keywords[E];
    }
    function ee() {
      if (!K.keywords) {
        oe.addText(ae);
        return;
      }
      let q = 0;
      K.keywordPatternRe.lastIndex = 0;
      let E = K.keywordPatternRe.exec(ae), A = "";
      for (; E; ) {
        A += ae.substring(q, E.index);
        const S = re.case_insensitive ? E[0].toLowerCase() : E[0], U = P(K, S);
        if (U) {
          const [Q, se] = U;
          if (oe.addText(A), A = "", W[S] = (W[S] || 0) + 1, W[S] <= Gl && (Re += se), Q.startsWith("_"))
            A += E[0];
          else {
            const Ee = re.classNameAliases[Q] || Q;
            H(E[0], Ee);
          }
        } else
          A += E[0];
        q = K.keywordPatternRe.lastIndex, E = K.keywordPatternRe.exec(ae);
      }
      A += ae.substring(q), oe.addText(A);
    }
    function ce() {
      if (ae === "") return;
      let q = null;
      if (typeof K.subLanguage == "string") {
        if (!t[K.subLanguage]) {
          oe.addText(ae);
          return;
        }
        q = h(K.subLanguage, ae, !0, Ne[K.subLanguage]), Ne[K.subLanguage] = /** @type {CompiledMode} */
        q._top;
      } else
        q = m(ae, K.subLanguage.length ? K.subLanguage : null);
      K.relevance > 0 && (Re += q.relevance), oe.__addSublanguage(q._emitter, q.language);
    }
    function M() {
      K.subLanguage != null ? ce() : ee(), ae = "";
    }
    function H(q, E) {
      q !== "" && (oe.startScope(E), oe.addText(q), oe.endScope());
    }
    function G(q, E) {
      let A = 1;
      const S = E.length - 1;
      for (; A <= S; ) {
        if (!q._emit[A]) {
          A++;
          continue;
        }
        const U = re.classNameAliases[q[A]] || q[A], Q = E[A];
        U ? H(Q, U) : (ae = Q, ee(), ae = ""), A++;
      }
    }
    function xe(q, E) {
      return q.scope && typeof q.scope == "string" && oe.openNode(re.classNameAliases[q.scope] || q.scope), q.beginScope && (q.beginScope._wrap ? (H(ae, re.classNameAliases[q.beginScope._wrap] || q.beginScope._wrap), ae = "") : q.beginScope._multi && (G(q.beginScope, E), ae = "")), K = Object.create(q, { parent: { value: K } }), K;
    }
    function me(q, E, A) {
      let S = dl(q.endRe, A);
      if (S) {
        if (q["on:end"]) {
          const U = new Vn(q);
          q["on:end"](E, U), U.isMatchIgnored && (S = !1);
        }
        if (S) {
          for (; q.endsParent && q.parent; )
            q = q.parent;
          return q;
        }
      }
      if (q.endsWithParent)
        return me(q.parent, E, A);
    }
    function Oe(q) {
      return K.matcher.regexIndex === 0 ? (ae += q[0], 1) : (x = !0, 0);
    }
    function fe(q) {
      const E = q[0], A = q.rule, S = new Vn(A), U = [A.__beforeBegin, A["on:begin"]];
      for (const Q of U)
        if (Q && (Q(q, S), S.isMatchIgnored))
          return Oe(E);
      return A.skip ? ae += E : (A.excludeBegin && (ae += E), M(), !A.returnBegin && !A.excludeBegin && (ae = E)), xe(A, q), A.returnBegin ? 0 : E.length;
    }
    function be(q) {
      const E = q[0], A = I.substring(q.index), S = me(K, q, A);
      if (!S)
        return ra;
      const U = K;
      K.endScope && K.endScope._wrap ? (M(), H(E, K.endScope._wrap)) : K.endScope && K.endScope._multi ? (M(), G(K.endScope, q)) : U.skip ? ae += E : (U.returnEnd || U.excludeEnd || (ae += E), M(), U.excludeEnd && (ae = E));
      do
        K.scope && oe.closeNode(), !K.skip && !K.subLanguage && (Re += K.relevance), K = K.parent;
      while (K !== S.parent);
      return S.starts && xe(S.starts, q), U.returnEnd ? 0 : E.length;
    }
    function Ce() {
      const q = [];
      for (let E = K; E !== re; E = E.parent)
        E.scope && q.unshift(E.scope);
      q.forEach((E) => oe.openNode(E));
    }
    let X = {};
    function ue(q, E) {
      const A = E && E[0];
      if (ae += q, A == null)
        return M(), 0;
      if (X.type === "begin" && E.type === "end" && X.index === E.index && A === "") {
        if (ae += I.slice(E.index, E.index + 1), !r) {
          const S = new Error(`0 width match regex (${N})`);
          throw S.languageName = N, S.badRule = X.rule, S;
        }
        return 1;
      }
      if (X = E, E.type === "begin")
        return fe(E);
      if (E.type === "illegal" && !R) {
        const S = new Error('Illegal lexeme "' + A + '" for mode "' + (K.scope || "<unnamed>") + '"');
        throw S.mode = K, S;
      } else if (E.type === "end") {
        const S = be(E);
        if (S !== ra)
          return S;
      }
      if (E.type === "illegal" && A === "")
        return ae += `
`, 1;
      if (_e > 1e5 && _e > E.index * 3)
        throw new Error("potential infinite loop, way more iterations than matches");
      return ae += A, A.length;
    }
    const re = D(N);
    if (!re)
      throw Ve(i.replace("{}", N)), new Error('Unknown language: "' + N + '"');
    const De = Wl(re);
    let ge = "", K = B || De;
    const Ne = {}, oe = new s.__emitter(s);
    Ce();
    let ae = "", Re = 0, ve = 0, _e = 0, x = !1;
    try {
      if (re.__emitTokens)
        re.__emitTokens(I, oe);
      else {
        for (K.matcher.considerAll(); ; ) {
          _e++, x ? x = !1 : K.matcher.considerAll(), K.matcher.lastIndex = ve;
          const q = K.matcher.exec(I);
          if (!q) break;
          const E = I.substring(ve, q.index), A = ue(E, q);
          ve = q.index + A;
        }
        ue(I.substring(ve));
      }
      return oe.finalize(), ge = oe.toHTML(), {
        language: N,
        value: ge,
        relevance: Re,
        illegal: !1,
        _emitter: oe,
        _top: K
      };
    } catch (q) {
      if (q.message && q.message.includes("Illegal"))
        return {
          language: N,
          value: Zt(I),
          illegal: !0,
          relevance: 0,
          _illegalBy: {
            message: q.message,
            index: ve,
            context: I.slice(ve - 100, ve + 100),
            mode: q.mode,
            resultSoFar: ge
          },
          _emitter: oe
        };
      if (r)
        return {
          language: N,
          value: Zt(I),
          illegal: !1,
          relevance: 0,
          errorRaised: q,
          _emitter: oe,
          _top: K
        };
      throw q;
    }
  }
  function f(N) {
    const I = {
      value: Zt(N),
      illegal: !1,
      relevance: 0,
      _top: o,
      _emitter: new s.__emitter(s)
    };
    return I._emitter.addText(N), I;
  }
  function m(N, I) {
    I = I || s.languages || Object.keys(t);
    const R = f(N), B = I.filter(D).filter(J).map(
      (M) => h(M, N, !1)
    );
    B.unshift(R);
    const W = B.sort((M, H) => {
      if (M.relevance !== H.relevance) return H.relevance - M.relevance;
      if (M.language && H.language) {
        if (D(M.language).supersetOf === H.language)
          return 1;
        if (D(H.language).supersetOf === M.language)
          return -1;
      }
      return 0;
    }), [P, ee] = W, ce = P;
    return ce.secondBest = ee, ce;
  }
  function d(N, I, R) {
    const B = I && n[I] || R;
    N.classList.add("hljs"), N.classList.add(`language-${B}`);
  }
  function w(N) {
    let I = null;
    const R = u(N);
    if (l(R)) return;
    if (V(
      "before:highlightElement",
      { el: N, language: R }
    ), N.dataset.highlighted) {
      console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.", N);
      return;
    }
    if (N.children.length > 0 && (s.ignoreUnescapedHTML || (console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."), console.warn("https://github.com/highlightjs/highlight.js/wiki/security"), console.warn("The element with unescaped HTML:"), console.warn(N)), s.throwUnescapedHTML))
      throw new Kl(
        "One of your code blocks includes unescaped HTML.",
        N.innerHTML
      );
    I = N;
    const B = I.textContent, W = R ? p(B, { language: R, ignoreIllegals: !0 }) : m(B);
    N.innerHTML = W.value, N.dataset.highlighted = "yes", d(N, R, W.language), N.result = {
      language: W.language,
      // TODO: remove with version 11.0
      re: W.relevance,
      relevance: W.relevance
    }, W.secondBest && (N.secondBest = {
      language: W.secondBest.language,
      relevance: W.secondBest.relevance
    }), V("after:highlightElement", { el: N, result: W, text: B });
  }
  function k(N) {
    s = aa(s, N);
  }
  const z = () => {
    C(), tt("10.6.0", "initHighlighting() deprecated.  Use highlightAll() now.");
  };
  function _() {
    C(), tt("10.6.0", "initHighlightingOnLoad() deprecated.  Use highlightAll() now.");
  }
  let y = !1;
  function C() {
    function N() {
      C();
    }
    if (document.readyState === "loading") {
      y || window.addEventListener("DOMContentLoaded", N, !1), y = !0;
      return;
    }
    document.querySelectorAll(s.cssSelector).forEach(w);
  }
  function v(N, I) {
    let R = null;
    try {
      R = I(e);
    } catch (B) {
      if (Ve("Language definition for '{}' could not be registered.".replace("{}", N)), r)
        Ve(B);
      else
        throw B;
      R = o;
    }
    R.name || (R.name = N), t[N] = R, R.rawDefinition = I.bind(null, e), R.aliases && L(R.aliases, { languageName: N });
  }
  function b(N) {
    delete t[N];
    for (const I of Object.keys(n))
      n[I] === N && delete n[I];
  }
  function T() {
    return Object.keys(t);
  }
  function D(N) {
    return N = (N || "").toLowerCase(), t[N] || t[n[N]];
  }
  function L(N, { languageName: I }) {
    typeof N == "string" && (N = [N]), N.forEach((R) => {
      n[R.toLowerCase()] = I;
    });
  }
  function J(N) {
    const I = D(N);
    return I && !I.disableAutodetect;
  }
  function Z(N) {
    N["before:highlightBlock"] && !N["before:highlightElement"] && (N["before:highlightElement"] = (I) => {
      N["before:highlightBlock"](
        Object.assign({ block: I.el }, I)
      );
    }), N["after:highlightBlock"] && !N["after:highlightElement"] && (N["after:highlightElement"] = (I) => {
      N["after:highlightBlock"](
        Object.assign({ block: I.el }, I)
      );
    });
  }
  function $(N) {
    Z(N), a.push(N);
  }
  function j(N) {
    const I = a.indexOf(N);
    I !== -1 && a.splice(I, 1);
  }
  function V(N, I) {
    const R = N;
    a.forEach(function(B) {
      B[R] && B[R](I);
    });
  }
  function te(N) {
    return tt("10.7.0", "highlightBlock will be removed entirely in v12.0"), tt("10.7.0", "Please use highlightElement now."), w(N);
  }
  Object.assign(e, {
    highlight: p,
    highlightAuto: m,
    highlightAll: C,
    highlightElement: w,
    // TODO: Remove with v12 API
    highlightBlock: te,
    configure: k,
    initHighlighting: z,
    initHighlightingOnLoad: _,
    registerLanguage: v,
    unregisterLanguage: b,
    listLanguages: T,
    getLanguage: D,
    registerAliases: L,
    autoDetection: J,
    inherit: aa,
    addPlugin: $,
    removePlugin: j
  }), e.debugMode = function() {
    r = !1;
  }, e.safeMode = function() {
    r = !0;
  }, e.versionString = Zl, e.regex = {
    concat: et,
    lookahead: hr,
    either: vn,
    optional: cl,
    anyNumberOfTimes: ll
  };
  for (const N in _t)
    typeof _t[N] == "object" && ur(_t[N]);
  return Object.assign(e, _t), e;
}, ot = xr({});
ot.newInstance = () => xr({});
var Xl = ot;
ot.HighlightJS = ot;
ot.default = ot;
const Yl = /* @__PURE__ */ al(Xl), ia = "[A-Za-z$_][0-9A-Za-z$_]*", Vl = [
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
], Ql = [
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity"
], _r = [
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
], wr = [
  "Error",
  "EvalError",
  "InternalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError"
], qr = [
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
], ec = [
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
], tc = [].concat(
  qr,
  _r,
  wr
);
function nc(e) {
  const t = e.regex, n = (R, { after: B }) => {
    const W = "</" + R[0].slice(1);
    return R.input.indexOf(W, B) !== -1;
  }, a = ia, r = {
    begin: "<>",
    end: "</>"
  }, i = /<[A-Za-z0-9\\._:-]+\s*\/>/, o = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
    /**
     * @param {RegExpMatchArray} match
     * @param {CallbackResponse} response
     */
    isTrulyOpeningTag: (R, B) => {
      const W = R[0].length + R.index, P = R.input[W];
      if (
        // HTML should not include another raw `<` inside a tag
        // nested type?
        // `<Array<Array<number>>`, etc.
        P === "<" || // the , gives away that this is not HTML
        // `<T, A extends keyof T, V>`
        P === ","
      ) {
        B.ignoreMatch();
        return;
      }
      P === ">" && (n(R, { after: W }) || B.ignoreMatch());
      let ee;
      const ce = R.input.substring(W);
      if (ee = ce.match(/^\s*=/)) {
        B.ignoreMatch();
        return;
      }
      if ((ee = ce.match(/^\s+extends\s+/)) && ee.index === 0) {
        B.ignoreMatch();
        return;
      }
    }
  }, s = {
    $pattern: ia,
    keyword: Vl,
    literal: Ql,
    built_in: tc,
    "variable.language": ec
  }, l = "[0-9](_?[0-9])*", u = `\\.(${l})`, p = "0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*", h = {
    className: "number",
    variants: [
      // DecimalLiteral
      { begin: `(\\b(${p})((${u})|\\.)?|(${u}))[eE][+-]?(${l})\\b` },
      { begin: `\\b(${p})\\b((${u})\\b|\\.)?|(${u})\\b` },
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
    keywords: s,
    contains: []
    // defined later
  }, m = {
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
  }, d = {
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
  }, k = {
    className: "string",
    begin: "`",
    end: "`",
    contains: [
      e.BACKSLASH_ESCAPE,
      f
    ]
  }, _ = {
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
                  begin: a + "(?=\\s*(-)|$)",
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
  }, y = [
    e.APOS_STRING_MODE,
    e.QUOTE_STRING_MODE,
    m,
    d,
    w,
    k,
    // Skip numbers when they are part of a variable name
    { match: /\$\d+/ },
    h
    // This is intentional:
    // See https://github.com/highlightjs/highlight.js/issues/3288
    // hljs.REGEXP_MODE
  ];
  f.contains = y.concat({
    // we need to pair up {} inside our subst to prevent
    // it from ending too early by matching another }
    begin: /\{/,
    end: /\}/,
    keywords: s,
    contains: [
      "self"
    ].concat(y)
  });
  const C = [].concat(_, f.contains), v = C.concat([
    // eat recursive parens in sub expressions
    {
      begin: /(\s*)\(/,
      end: /\)/,
      keywords: s,
      contains: ["self"].concat(C)
    }
  ]), b = {
    className: "params",
    // convert this to negative lookbehind in v12
    begin: /(\s*)\(/,
    // to match the parms with
    end: /\)/,
    excludeBegin: !0,
    excludeEnd: !0,
    keywords: s,
    contains: v
  }, T = {
    variants: [
      // class Car extends vehicle
      {
        match: [
          /class/,
          /\s+/,
          a,
          /\s+/,
          /extends/,
          /\s+/,
          t.concat(a, "(", t.concat(/\./, a), ")*")
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
          a
        ],
        scope: {
          1: "keyword",
          3: "title.class"
        }
      }
    ]
  }, D = {
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
        ..._r,
        ...wr
      ]
    }
  }, L = {
    label: "use_strict",
    className: "meta",
    relevance: 10,
    begin: /^\s*['"]use (strict|asm)['"]/
  }, J = {
    variants: [
      {
        match: [
          /function/,
          /\s+/,
          a,
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
  }, Z = {
    relevance: 0,
    match: /\b[A-Z][A-Z_0-9]+\b/,
    className: "variable.constant"
  };
  function $(R) {
    return t.concat("(?!", R.join("|"), ")");
  }
  const j = {
    match: t.concat(
      /\b/,
      $([
        ...qr,
        "super",
        "import"
      ].map((R) => `${R}\\s*\\(`)),
      a,
      t.lookahead(/\s*\(/)
    ),
    className: "title.function",
    relevance: 0
  }, V = {
    begin: t.concat(/\./, t.lookahead(
      t.concat(a, /(?![0-9A-Za-z$_(])/)
    )),
    end: a,
    excludeBegin: !0,
    keywords: "prototype",
    className: "property",
    relevance: 0
  }, te = {
    match: [
      /get|set/,
      /\s+/,
      a,
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
  }, N = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + e.UNDERSCORE_IDENT_RE + ")\\s*=>", I = {
    match: [
      /const|var|let/,
      /\s+/,
      a,
      /\s*/,
      /=\s*/,
      /(async\s*)?/,
      // async is optional
      t.lookahead(N)
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
    keywords: s,
    // this will be extended by TypeScript
    exports: { PARAMS_CONTAINS: v, CLASS_REFERENCE: D },
    illegal: /#(?![$_A-z])/,
    contains: [
      e.SHEBANG({
        label: "shebang",
        binary: "node",
        relevance: 5
      }),
      L,
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE,
      m,
      d,
      w,
      k,
      _,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      h,
      D,
      {
        scope: "attr",
        match: a + t.lookahead(":"),
        relevance: 0
      },
      I,
      {
        // "value" container
        begin: "(" + e.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
        keywords: "return throw case",
        relevance: 0,
        contains: [
          _,
          e.REGEXP_MODE,
          {
            className: "function",
            // we have to count the parens to make sure we actually have the
            // correct bounding ( ) before the =>.  There could be any number of
            // sub-expressions inside also surrounded by parens.
            begin: N,
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
                    keywords: s,
                    contains: v
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
              { begin: r.begin, end: r.end },
              { match: i },
              {
                begin: o.begin,
                // we carefully check the opening tag to see if it truly
                // is a tag and not a false positive
                "on:begin": o.isTrulyOpeningTag,
                end: o.end
              }
            ],
            subLanguage: "xml",
            contains: [
              {
                begin: o.begin,
                end: o.end,
                skip: !0,
                contains: ["self"]
              }
            ]
          }
        ]
      },
      J,
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
          e.inherit(e.TITLE_MODE, { begin: a, className: "title.function" })
        ]
      },
      // catch ... so it won't trigger the property rule below
      {
        match: /\.\.\./,
        relevance: 0
      },
      V,
      // hack: prevents detection of keywords in some circumstances
      // .keyword()
      // $keyword = x
      {
        match: "\\$" + a,
        relevance: 0
      },
      {
        match: [/\bconstructor(?=\s*\()/],
        className: { 1: "title.function" },
        contains: [b]
      },
      j,
      Z,
      T,
      te,
      {
        match: /\$[(.]/
        // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
      }
    ]
  };
}
const Nt = "[A-Za-z$_][0-9A-Za-z$_]*", yr = [
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
], Rr = [
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity"
], Er = [
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
], Cr = [
  "Error",
  "EvalError",
  "InternalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError"
], Nr = [
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
], Ar = [
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
], Dr = [].concat(
  Nr,
  Er,
  Cr
);
function ac(e) {
  const t = e.regex, n = (R, { after: B }) => {
    const W = "</" + R[0].slice(1);
    return R.input.indexOf(W, B) !== -1;
  }, a = Nt, r = {
    begin: "<>",
    end: "</>"
  }, i = /<[A-Za-z0-9\\._:-]+\s*\/>/, o = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
    /**
     * @param {RegExpMatchArray} match
     * @param {CallbackResponse} response
     */
    isTrulyOpeningTag: (R, B) => {
      const W = R[0].length + R.index, P = R.input[W];
      if (
        // HTML should not include another raw `<` inside a tag
        // nested type?
        // `<Array<Array<number>>`, etc.
        P === "<" || // the , gives away that this is not HTML
        // `<T, A extends keyof T, V>`
        P === ","
      ) {
        B.ignoreMatch();
        return;
      }
      P === ">" && (n(R, { after: W }) || B.ignoreMatch());
      let ee;
      const ce = R.input.substring(W);
      if (ee = ce.match(/^\s*=/)) {
        B.ignoreMatch();
        return;
      }
      if ((ee = ce.match(/^\s+extends\s+/)) && ee.index === 0) {
        B.ignoreMatch();
        return;
      }
    }
  }, s = {
    $pattern: Nt,
    keyword: yr,
    literal: Rr,
    built_in: Dr,
    "variable.language": Ar
  }, l = "[0-9](_?[0-9])*", u = `\\.(${l})`, p = "0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*", h = {
    className: "number",
    variants: [
      // DecimalLiteral
      { begin: `(\\b(${p})((${u})|\\.)?|(${u}))[eE][+-]?(${l})\\b` },
      { begin: `\\b(${p})\\b((${u})\\b|\\.)?|(${u})\\b` },
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
    keywords: s,
    contains: []
    // defined later
  }, m = {
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
  }, d = {
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
  }, k = {
    className: "string",
    begin: "`",
    end: "`",
    contains: [
      e.BACKSLASH_ESCAPE,
      f
    ]
  }, _ = {
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
                  begin: a + "(?=\\s*(-)|$)",
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
  }, y = [
    e.APOS_STRING_MODE,
    e.QUOTE_STRING_MODE,
    m,
    d,
    w,
    k,
    // Skip numbers when they are part of a variable name
    { match: /\$\d+/ },
    h
    // This is intentional:
    // See https://github.com/highlightjs/highlight.js/issues/3288
    // hljs.REGEXP_MODE
  ];
  f.contains = y.concat({
    // we need to pair up {} inside our subst to prevent
    // it from ending too early by matching another }
    begin: /\{/,
    end: /\}/,
    keywords: s,
    contains: [
      "self"
    ].concat(y)
  });
  const C = [].concat(_, f.contains), v = C.concat([
    // eat recursive parens in sub expressions
    {
      begin: /(\s*)\(/,
      end: /\)/,
      keywords: s,
      contains: ["self"].concat(C)
    }
  ]), b = {
    className: "params",
    // convert this to negative lookbehind in v12
    begin: /(\s*)\(/,
    // to match the parms with
    end: /\)/,
    excludeBegin: !0,
    excludeEnd: !0,
    keywords: s,
    contains: v
  }, T = {
    variants: [
      // class Car extends vehicle
      {
        match: [
          /class/,
          /\s+/,
          a,
          /\s+/,
          /extends/,
          /\s+/,
          t.concat(a, "(", t.concat(/\./, a), ")*")
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
          a
        ],
        scope: {
          1: "keyword",
          3: "title.class"
        }
      }
    ]
  }, D = {
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
        ...Er,
        ...Cr
      ]
    }
  }, L = {
    label: "use_strict",
    className: "meta",
    relevance: 10,
    begin: /^\s*['"]use (strict|asm)['"]/
  }, J = {
    variants: [
      {
        match: [
          /function/,
          /\s+/,
          a,
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
  }, Z = {
    relevance: 0,
    match: /\b[A-Z][A-Z_0-9]+\b/,
    className: "variable.constant"
  };
  function $(R) {
    return t.concat("(?!", R.join("|"), ")");
  }
  const j = {
    match: t.concat(
      /\b/,
      $([
        ...Nr,
        "super",
        "import"
      ].map((R) => `${R}\\s*\\(`)),
      a,
      t.lookahead(/\s*\(/)
    ),
    className: "title.function",
    relevance: 0
  }, V = {
    begin: t.concat(/\./, t.lookahead(
      t.concat(a, /(?![0-9A-Za-z$_(])/)
    )),
    end: a,
    excludeBegin: !0,
    keywords: "prototype",
    className: "property",
    relevance: 0
  }, te = {
    match: [
      /get|set/,
      /\s+/,
      a,
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
  }, N = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + e.UNDERSCORE_IDENT_RE + ")\\s*=>", I = {
    match: [
      /const|var|let/,
      /\s+/,
      a,
      /\s*/,
      /=\s*/,
      /(async\s*)?/,
      // async is optional
      t.lookahead(N)
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
    keywords: s,
    // this will be extended by TypeScript
    exports: { PARAMS_CONTAINS: v, CLASS_REFERENCE: D },
    illegal: /#(?![$_A-z])/,
    contains: [
      e.SHEBANG({
        label: "shebang",
        binary: "node",
        relevance: 5
      }),
      L,
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE,
      m,
      d,
      w,
      k,
      _,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      h,
      D,
      {
        scope: "attr",
        match: a + t.lookahead(":"),
        relevance: 0
      },
      I,
      {
        // "value" container
        begin: "(" + e.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
        keywords: "return throw case",
        relevance: 0,
        contains: [
          _,
          e.REGEXP_MODE,
          {
            className: "function",
            // we have to count the parens to make sure we actually have the
            // correct bounding ( ) before the =>.  There could be any number of
            // sub-expressions inside also surrounded by parens.
            begin: N,
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
                    keywords: s,
                    contains: v
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
              { begin: r.begin, end: r.end },
              { match: i },
              {
                begin: o.begin,
                // we carefully check the opening tag to see if it truly
                // is a tag and not a false positive
                "on:begin": o.isTrulyOpeningTag,
                end: o.end
              }
            ],
            subLanguage: "xml",
            contains: [
              {
                begin: o.begin,
                end: o.end,
                skip: !0,
                contains: ["self"]
              }
            ]
          }
        ]
      },
      J,
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
          e.inherit(e.TITLE_MODE, { begin: a, className: "title.function" })
        ]
      },
      // catch ... so it won't trigger the property rule below
      {
        match: /\.\.\./,
        relevance: 0
      },
      V,
      // hack: prevents detection of keywords in some circumstances
      // .keyword()
      // $keyword = x
      {
        match: "\\$" + a,
        relevance: 0
      },
      {
        match: [/\bconstructor(?=\s*\()/],
        className: { 1: "title.function" },
        contains: [b]
      },
      j,
      Z,
      T,
      te,
      {
        match: /\$[(.]/
        // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
      }
    ]
  };
}
function rc(e) {
  const t = e.regex, n = ac(e), a = Nt, r = [
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
  }, o = {
    beginKeywords: "interface",
    end: /\{/,
    excludeEnd: !0,
    keywords: {
      keyword: "interface extends",
      built_in: r
    },
    contains: [n.exports.CLASS_REFERENCE]
  }, s = {
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
  ], u = {
    $pattern: Nt,
    keyword: yr.concat(l),
    literal: Rr,
    built_in: Dr.concat(r),
    "variable.language": Ar
  }, p = {
    className: "meta",
    begin: "@" + a
  }, h = (w, k, z) => {
    const _ = w.contains.findIndex((y) => y.label === k);
    if (_ === -1)
      throw new Error("can not find mode to replace");
    w.contains.splice(_, 1, z);
  };
  Object.assign(n.keywords, u), n.exports.PARAMS_CONTAINS.push(p);
  const f = n.contains.find((w) => w.scope === "attr"), m = Object.assign(
    {},
    f,
    { match: t.concat(a, t.lookahead(/\s*\?:/)) }
  );
  n.exports.PARAMS_CONTAINS.push([
    n.exports.CLASS_REFERENCE,
    // class reference for highlighting the params types
    f,
    // highlight the params key
    m
    // Added for optional property assignment highlighting
  ]), n.contains = n.contains.concat([
    p,
    i,
    o,
    m
    // Added for optional property assignment highlighting
  ]), h(n, "shebang", e.SHEBANG()), h(n, "use_strict", s);
  const d = n.contains.find((w) => w.label === "func.def");
  return d.relevance = 0, Object.assign(n, {
    name: "TypeScript",
    aliases: [
      "ts",
      "tsx",
      "mts",
      "cts"
    ]
  }), n;
}
function ic(e) {
  const t = {
    className: "attr",
    begin: /"(\\.|[^\\"\r\n])*"(?=\s*:)/,
    relevance: 1.01
  }, n = {
    match: /[{}[\],:]/,
    className: "punctuation",
    relevance: 0
  }, a = [
    "true",
    "false",
    "null"
  ], r = {
    scope: "literal",
    beginKeywords: a.join(" ")
  };
  return {
    name: "JSON",
    aliases: ["jsonc"],
    keywords: {
      literal: a
    },
    contains: [
      t,
      n,
      e.QUOTE_STRING_MODE,
      r,
      e.C_NUMBER_MODE,
      e.C_LINE_COMMENT_MODE,
      e.C_BLOCK_COMMENT_MODE
    ],
    illegal: "\\S"
  };
}
const sc = (e) => ({
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
}), oc = [
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
], lc = [
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
], cc = [
  ...oc,
  ...lc
], uc = [
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
].sort().reverse(), dc = [
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
].sort().reverse(), hc = [
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
].sort().reverse(), pc = [
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
function fc(e) {
  const t = e.regex, n = sc(e), a = { begin: /-(webkit|moz|ms|o)-(?=[a-z])/ }, r = "and or not only", i = /@-?\w[\w]*(-\w+)*/, o = "[a-zA-Z-][a-zA-Z0-9_-]*", s = [
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
      a,
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
        begin: "\\." + o,
        relevance: 0
      },
      n.ATTRIBUTE_SELECTOR_MODE,
      {
        className: "selector-pseudo",
        variants: [
          { begin: ":(" + dc.join("|") + ")" },
          { begin: ":(:)?(" + hc.join("|") + ")" }
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
        begin: "\\b(" + pc.join("|") + ")\\b"
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
          ...s,
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
              ...s,
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
              keyword: r,
              attribute: uc.join(" ")
            },
            contains: [
              {
                begin: /[a-z-]+(?=:)/,
                className: "attribute"
              },
              ...s,
              n.CSS_NUMBER_MODE
            ]
          }
        ]
      },
      {
        className: "selector-tag",
        begin: "\\b(" + cc.join("|") + ")\\b"
      }
    ]
  };
}
function gc(e) {
  const t = e.regex, n = t.concat(/[\p{L}_]/u, t.optional(/[\p{L}0-9_.-]*:/u), /[\p{L}0-9_.-]*/u), a = /[\p{L}0-9._:-]+/u, r = {
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
  }, o = e.inherit(i, {
    begin: /\(/,
    end: /\)/
  }), s = e.inherit(e.APOS_STRING_MODE, { className: "string" }), l = e.inherit(e.QUOTE_STRING_MODE, { className: "string" }), u = {
    endsWithParent: !0,
    illegal: /</,
    relevance: 0,
    contains: [
      {
        className: "attr",
        begin: a,
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
                contains: [r]
              },
              {
                begin: /'/,
                end: /'/,
                contains: [r]
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
          s,
          o,
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
                  o,
                  l,
                  s
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
      r,
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
        contains: [u],
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
        contains: [u],
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
            starts: u
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
function mc(e) {
  const t = e.regex, n = new RegExp("[\\p{XID_Start}_]\\p{XID_Continue}*", "u"), a = [
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
  ], s = {
    $pattern: /[A-Za-z]\w+|__\w+__/,
    keyword: a,
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
  }, u = {
    className: "subst",
    begin: /\{/,
    end: /\}/,
    keywords: s,
    illegal: /#/
  }, p = {
    begin: /\{\{/,
    relevance: 0
  }, h = {
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
          p,
          u
        ]
      },
      {
        begin: /([fF][rR]|[rR][fF]|[fF])"""/,
        end: /"""/,
        contains: [
          e.BACKSLASH_ESCAPE,
          l,
          p,
          u
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
          p,
          u
        ]
      },
      {
        begin: /([fF][rR]|[rR][fF]|[fF])"/,
        end: /"/,
        contains: [
          e.BACKSLASH_ESCAPE,
          p,
          u
        ]
      },
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE
    ]
  }, f = "[0-9](_?[0-9])*", m = `(\\b(${f}))?\\.(${f})|\\b(${f})\\.`, d = `\\b|${a.join("|")}`, w = {
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
        begin: `(\\b(${f})|(${m}))[eE][+-]?(${f})[jJ]?(?=${d})`
      },
      {
        begin: `(${m})[jJ]?`
      },
      // decinteger, bininteger, octinteger, hexinteger
      // https://docs.python.org/3.9/reference/lexical_analysis.html#integer-literals
      // optionally "long" in Python 2
      // https://docs.python.org/2.7/reference/lexical_analysis.html#integer-and-long-integer-literals
      // decinteger is optionally imaginary
      // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
      {
        begin: `\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?(?=${d})`
      },
      {
        begin: `\\b0[bB](_?[01])+[lL]?(?=${d})`
      },
      {
        begin: `\\b0[oO](_?[0-7])+[lL]?(?=${d})`
      },
      {
        begin: `\\b0[xX](_?[0-9a-fA-F])+[lL]?(?=${d})`
      },
      // imagnumber (digitpart-based)
      // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
      {
        begin: `\\b(${f})[jJ](?=${d})`
      }
    ]
  }, k = {
    className: "comment",
    begin: t.lookahead(/# type:/),
    end: /$/,
    keywords: s,
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
  }, z = {
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
        keywords: s,
        contains: [
          "self",
          l,
          w,
          h,
          e.HASH_COMMENT_MODE
        ]
      }
    ]
  };
  return u.contains = [
    h,
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
    keywords: s,
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
      h,
      k,
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
        contains: [z]
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
          z,
          h
        ]
      }
    ]
  };
}
function bc(e) {
  const t = e.regex, n = {}, a = {
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
      a
    ]
  });
  const r = {
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
  ), o = {
    begin: /<<-?\s*(?=\w+)/,
    starts: { contains: [
      e.END_SAME_AS_BEGIN({
        begin: /(\w+)/,
        end: /(\w+)/,
        className: "string"
      })
    ] }
  }, s = {
    className: "string",
    begin: /"/,
    end: /"/,
    contains: [
      e.BACKSLASH_ESCAPE,
      n,
      r
    ]
  };
  r.contains.push(s);
  const l = {
    match: /\\"/
  }, u = {
    className: "string",
    begin: /'/,
    end: /'/
  }, p = {
    match: /\\'/
  }, h = {
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
  ], m = e.SHEBANG({
    binary: `(${f.join("|")})`,
    relevance: 10
  }), d = {
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
  ], k = [
    "true",
    "false"
  ], z = { match: /(\/[a-z._-]+)+/ }, _ = [
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
  ], y = [
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
  ], C = [
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
  ], v = [
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
      literal: k,
      built_in: [
        ..._,
        ...y,
        // Shell modifiers
        "set",
        "shopt",
        ...C,
        ...v
      ]
    },
    contains: [
      m,
      // to catch known shells and boost relevancy
      e.SHEBANG(),
      // to catch unknown shells but still highlight the shebang
      d,
      h,
      i,
      o,
      z,
      s,
      l,
      u,
      p,
      n
    ]
  };
}
function vc(e) {
  const t = "true false yes no null", n = "[\\w#;/?:@&=+$,.~*'()[\\]]+", a = {
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
  }, r = {
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
  }, o = {
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
      r
    ]
  }, s = e.inherit(o, { variants: [
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
  }, m = {
    end: ",",
    endsWithParent: !0,
    excludeEnd: !0,
    keywords: t,
    relevance: 0
  }, d = {
    begin: /\{/,
    end: /\}/,
    contains: [m],
    illegal: "\\n",
    relevance: 0
  }, w = {
    begin: "\\[",
    end: "\\]",
    contains: [m],
    illegal: "\\n",
    relevance: 0
  }, k = [
    a,
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
    d,
    w,
    i,
    o
  ], z = [...k];
  return z.pop(), z.push(s), m.contains = z, {
    name: "YAML",
    case_insensitive: !0,
    aliases: ["yml"],
    contains: k
  };
}
function zc(e) {
  const t = e.regex, n = e.COMMENT("--", "$"), a = {
    scope: "string",
    variants: [
      {
        begin: /'/,
        end: /'/,
        contains: [{ match: /''/ }]
      }
    ]
  }, r = {
    begin: /"/,
    end: /"/,
    contains: [{ match: /""/ }]
  }, i = [
    "true",
    "false",
    // Not sure it's correct to call NULL literal, and clauses like IS [NOT] NULL look strange that way.
    // "null",
    "unknown"
  ], o = [
    "double precision",
    "large object",
    "with timezone",
    "without timezone"
  ], s = [
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
  ], u = [
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
  ], p = [
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
  ], h = [
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
  ], m = p, d = [
    ...u,
    ...l
  ].filter((v) => !p.includes(v)), w = {
    scope: "variable",
    match: /@[a-z0-9][a-z0-9_]*/
  }, k = {
    scope: "operator",
    match: /[-+*/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?/,
    relevance: 0
  }, z = {
    match: t.concat(/\b/, t.either(...m), /\s*\(/),
    relevance: 0,
    keywords: { built_in: m }
  };
  function _(v) {
    return t.concat(
      /\b/,
      t.either(...v.map((b) => b.replace(/\s+/, "\\s+"))),
      /\b/
    );
  }
  const y = {
    scope: "keyword",
    match: _(f),
    relevance: 0
  };
  function C(v, {
    exceptions: b,
    when: T
  } = {}) {
    const D = T;
    return b = b || [], v.map((L) => L.match(/\|\d+$/) || b.includes(L) ? L : D(L) ? `${L}|0` : L);
  }
  return {
    name: "SQL",
    case_insensitive: !0,
    // does not include {} or HTML tags `</`
    illegal: /[{}]|<\//,
    keywords: {
      $pattern: /\b[\w\.]+/,
      keyword: C(d, { when: (v) => v.length < 3 }),
      literal: i,
      type: s,
      built_in: h
    },
    contains: [
      {
        scope: "type",
        match: _(o)
      },
      y,
      z,
      w,
      a,
      r,
      e.C_NUMBER_MODE,
      e.C_BLOCK_COMMENT_MODE,
      n,
      k
    ]
  };
}
function kc(e) {
  const t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), r = (i, o, s) => {
    const l = o.toLowerCase(), u = i.get(l);
    i.set(l, u === void 0 || (u == null ? void 0 : u.path) === s.path ? s : null);
  };
  for (const i of e) {
    const o = i.path.replace(/\.md$/i, "");
    r(t, o, i), r(n, o.slice(o.lastIndexOf("/") + 1), i), r(a, i.title.trim(), i);
  }
  return (i) => {
    const o = i.trim(), s = o.includes("/") || /\.md$/i.test(o), l = o.replace(/^\//, "").replace(/\.md$/i, "").toLowerCase();
    if (!l || l.split("/").some((p) => !p || p === "." || p === "..")) return null;
    if (s) return t.get(l) ?? null;
    const u = a.get(l);
    return u === void 0 ? n.get(l) ?? null : u;
  };
}
const xc = /^\[\[([^\[\]\r\n]{1,256})\]\]/;
function _c(e) {
  e.inline.ruler.after("image", "wikilink", (t, n) => {
    if (n || t.linkLevel || !t.src.startsWith("[[", t.pos)) return !1;
    const a = xc.exec(t.src.slice(t.pos, Math.min(t.posMax, t.pos + 260)));
    if (!a) return !1;
    const r = a[1].indexOf("|"), i = (r < 0 ? a[1] : a[1].slice(0, r)).trim();
    if (!i) return !1;
    const o = t.env.resolveWikilink, s = o == null ? void 0 : o(i), l = t.push("wikilink", "", 0);
    if (l.content = a[0], s) {
      const u = r < 0 ? "" : a[1].slice(r + 1).trim();
      l.content = u || i, l.attrSet("data-note-path", s.path);
    }
    return t.pos += a[0].length, !0;
  }), e.renderer.rules.wikilink = (t, n) => {
    const a = t[n], r = e.utils.escapeHtml(a.content), i = a.attrGet("data-note-path");
    return typeof i == "string" ? `<button type="button" class="qz-wikilink" data-note-path="${e.utils.escapeHtml(i)}">${r}</button>` : r;
  };
}
const rn = Yl.newInstance();
for (const [e, t] of Object.entries({ javascript: nc, typescript: rc, json: ic, css: fc, xml: gc, python: mc, bash: bc, yaml: vc, sql: zc }))
  rn.registerLanguage(e, t);
const Ie = new nl({ html: !1, highlight: (e, t) => e.length <= 32768 && rn.getLanguage(t) ? rn.highlight(e, { language: t, ignoreIllegals: !0 }).value : "" });
_c(Ie);
Ie.validateLink = (e) => /^(https?:\/\/|mailto:)/i.test(e);
Ie.renderer.rules.image = (e, t) => `<span class="qz-note-image">[image: ${Ie.utils.escapeHtml(e[t].content || "image")}]</span>`;
Ie.renderer.rules.link_open = (e, t, n, a, r) => (e[t].attrSet("target", "_blank"), e[t].attrSet("rel", "noopener noreferrer nofollow"), r.renderToken(e, t, n));
Ie.renderer.rules.note_task = (e, t, n, a, r) => r.renderToken(e, t, n) + " ";
Ie.core.ruler.push("note_tasks", (e) => {
  const { tokens: t, env: n } = e, a = typeof n.lineOffset == "number" ? n.lineOffset : 0, r = e.src.split(`
`);
  for (let i = 0; i < t.length; i++) {
    const o = t[i];
    if (o.type !== "list_item_open" || !o.map) continue;
    const s = o.map[0], l = /^[ \t]*- \[([ x])\] (.*)$/.exec(r[s] || "");
    if (!l) continue;
    const u = t[i + 1], p = t[i + 2], h = p == null ? void 0 : p.children, f = h == null ? void 0 : h[0], m = `[${l[1]}]`;
    if ((u == null ? void 0 : u.type) !== "paragraph_open" || (p == null ? void 0 : p.type) !== "inline" || !h || (f == null ? void 0 : f.type) !== "text" || f.content !== m && !f.content.startsWith(`${m} `)) continue;
    const d = new e.Token("note_task", "input", 0);
    d.attrSet("type", "checkbox"), d.attrSet("class", "qz-note-task-checkbox"), d.attrSet("data-note-task-line", String(s + a)), d.attrSet("aria-label", l[2].trim() || "Task"), n.editable || d.attrSet("disabled", "");
    const w = l[1] === "x";
    w && d.attrSet("checked", ""), o.attrJoin("class", w ? "qz-note-task qz-note-task-completed" : "qz-note-task"), f.content = f.content.slice(4);
    const k = new e.Token("span_open", "span", 1);
    k.attrSet("class", "qz-note-task-text"), h.unshift(d, k), h.push(new e.Token("span_close", "span", -1));
  }
});
function wc(e, t, n = {}) {
  let a = e, r = 0;
  const i = /^---[ \t]*\n/.exec(e);
  if (i) {
    const p = /^---[ \t]*(?:\n|$)/gm;
    p.lastIndex = i[0].length, p.test(e) && (r = (e.slice(0, p.lastIndex).match(/\n/g) || []).length, a = e.slice(p.lastIndex));
  }
  const o = { resolveWikilink: t, editable: n.editable === !0, lineOffset: r }, s = Ie.parse(a, o), l = a.split(`
`), u = [];
  for (let p = 0; p < s.length; ) {
    const h = p, f = s[p++];
    if (f.nesting === 1) {
      let w = 1;
      for (; p < s.length && w > 0; ) w += s[p++].nesting;
    }
    const m = f.map, d = { html: Ie.renderer.render(s.slice(h, p), Ie.options, o) };
    if (m) {
      let w = m[1];
      for (; w > m[0] + 1 && /^[ \t]*$/.test(l[w - 1] ?? ""); ) w--;
      d.start = m[0] + r, d.end = w + r;
    }
    u.push(d);
  }
  return u;
}
function qc(e) {
  const t = { folders: /* @__PURE__ */ new Map(), notes: [] };
  for (const n of e) {
    let a = t;
    for (const r of n.path.split("/").slice(0, -1)) {
      let i = a.folders.get(r);
      i || (i = { folders: /* @__PURE__ */ new Map(), notes: [] }, a.folders.set(r, i)), a = i;
    }
    a.notes.push(n);
  }
  return t;
}
function sn(e) {
  const t = e.content.startsWith("\uFEFF") ? "\uFEFF" : "", n = e.content.slice(t.length), a = n.replace(/\r\n/g, ""), r = a.length !== n.length, i = a.includes("\r") || r && a.includes(`
`) ? "mixed" : r ? `\r
` : `
`;
  return { source: e, text: n.replace(/\r\n?/g, `
`), bom: t, lineEnding: i };
}
function Sr(e) {
  return e.lineEnding === "mixed" ? e.source.content : e.bom + (e.lineEnding === `\r
` ? e.text.replace(/\n/g, `\r
`) : e.text);
}
function Tr(e, t, n) {
  const a = e.split(`
`);
  if (!Number.isInteger(t) || !Number.isInteger(n) || t < 0 || n <= t || n > a.length) return null;
  let r = 0;
  for (let o = 0; o < t; o++) r += a[o].length + 1;
  let i = r + a[t].length;
  for (let o = t + 1; o < n; o++) i += 1 + a[o].length;
  return { from: r, to: i };
}
function yc(e, t, n) {
  const a = Tr(e, t, t + 1);
  if (!a) return e;
  const r = /^([ \t]*- \[)( |x)(\] )/.exec(e.slice(a.from, a.to));
  if (!r) return e;
  const i = a.from + r[1].length;
  return e.slice(0, i) + (n ? "x" : " ") + e.slice(i + 1);
}
const at = { lastNote: null, expanded: [], limit: 500, pinned: [] }, Rc = { color: "theme", emoji: "" }, Ec = {
  appearance: qa,
  accent: "theme",
  highContrast: !1,
  largerInterfaceText: !1,
  motion: "system",
  startOn: "last",
  lastTab: "tasks",
  workspaceId: null,
  noteView: "rendered",
  noteWidth: "standard",
  noteTextSize: "medium",
  rawTextSize: "medium",
  noteLineHeight: "normal",
  noteFont: "theme",
  noteFolders: {},
  folderAppearance: {},
  boardDensity: "comfortable",
  boardFields: { progress: !0, path: !0, badges: !0 },
  hideEmptyLanes: !1,
  laneSort: {},
  todoScope: "all",
  todoState: "open",
  todoFilters: []
}, Cc = {
  narrow: "Narrow",
  standard: "Standard",
  wide: "Wide",
  full: "Full width"
}, sa = ["tasks", "todos", "notes", "settings"];
function je(e) {
  return e && typeof e == "object" && !Array.isArray(e) ? e : {};
}
function ye(e, t, n) {
  return t.includes(e) ? e : n;
}
function xn(e) {
  return typeof e == "number" && Number.isSafeInteger(e) && e > 0 ? e : null;
}
function Fr(e) {
  const t = je(e);
  return {
    headingColor: Ke(t.headingColor),
    headingLines: ya(t.headingLines),
    lineColor: Ke(t.lineColor)
  };
}
function oa(e, t) {
  return Object.fromEntries(Object.entries(je(e)).filter(([n]) => /^[1-9]\d*$/.test(n) && xn(Number(n)) !== null).map(([n, a]) => [n, t(je(a))]));
}
const Mr = (e) => typeof e == "string" && e.length > 0 && (e.length <= 1024 || Array.from(e).length <= 1024), la = (e) => Array.isArray(e) ? [...new Set(e.filter(Mr))] : [], ca = (e) => ye(e, ["all", "workspace"], "all"), ua = (e) => ye(e, ["open", "done", "all"], "open");
function Ir(e) {
  return Array.from(e.replace(/[\u0000-\u001f\u007f]/g, "").trim()).slice(0, 8).join("");
}
function At(e) {
  const t = je(e), n = je(t.boardFields), a = Ke(t.accent);
  return {
    appearance: Fr(t.appearance),
    accent: a === "accent" ? "theme" : a,
    highContrast: t.highContrast === !0,
    largerInterfaceText: t.largerInterfaceText === !0,
    motion: ye(t.motion, ["system", "reduced"], "system"),
    startOn: ye(t.startOn, ["last", ...sa], "last"),
    lastTab: ye(t.lastTab, sa, "tasks"),
    workspaceId: xn(t.workspaceId),
    noteView: ye(t.noteView, ["rendered", "raw"], "rendered"),
    noteWidth: ye(t.noteWidth, ["narrow", "standard", "wide", "full"], "standard"),
    noteTextSize: ye(t.noteTextSize, ["small", "medium", "large"], "medium"),
    rawTextSize: ye(t.rawTextSize, ["small", "medium", "large"], "medium"),
    noteLineHeight: ye(t.noteLineHeight, ["compact", "normal", "relaxed"], "normal"),
    noteFont: ye(t.noteFont, ["theme", "mono"], "theme"),
    noteFolders: oa(t.noteFolders, (r) => ({
      lastNote: Mr(r.lastNote) ? r.lastNote : null,
      expanded: la(r.expanded),
      limit: typeof r.limit == "number" && Number.isSafeInteger(r.limit) ? Math.min(5e4, Math.max(at.limit, r.limit)) : at.limit,
      pinned: la(r.pinned)
    })),
    folderAppearance: oa(t.folderAppearance, (r) => ({
      color: Ke(r.color),
      emoji: typeof r.emoji == "string" ? Ir(r.emoji) : ""
    })),
    boardDensity: ye(t.boardDensity, ["comfortable", "compact"], "comfortable"),
    boardFields: { progress: n.progress !== !1, path: n.path !== !1, badges: n.badges !== !1 },
    hideEmptyLanes: t.hideEmptyLanes === !0,
    laneSort: Object.fromEntries(Object.entries(je(t.laneSort)).filter(([r]) => /^\d+:[a-z][a-z0-9_]{0,31}$/.test(r)).map(([r, i]) => [r, ye(i, ["manual", "title"], "manual")])),
    todoScope: ca(t.todoScope),
    todoState: ua(t.todoState),
    todoFilters: Array.isArray(t.todoFilters) ? t.todoFilters.flatMap((r) => {
      const i = je(r);
      return typeof i.name != "string" || !i.name.trim() ? [] : [{
        name: i.name.trim().slice(0, 40),
        scope: ca(i.scope),
        state: ua(i.state),
        search: typeof i.search == "string" ? i.search.slice(0, 200) : ""
      }];
    }).slice(0, 20) : []
  };
}
function da(e) {
  const t = je(e), n = At(t);
  return Object.fromEntries(Object.entries(n).filter(([a]) => Object.hasOwn(t, a)));
}
const Or = "quartizo-preferences-v1";
function qt(e) {
  var t;
  try {
    return ((t = Ra()) == null ? void 0 : t.getItem(e)) ?? null;
  } catch {
    return null;
  }
}
function ha(e) {
  try {
    return JSON.parse(qt(e) ?? "null");
  } catch {
    return null;
  }
}
function Nc() {
  const e = ha(Or);
  if (e && typeof e == "object") {
    const { values: o, pending: s, legacy: l } = je(e);
    return { values: At(o), pending: da(s), legacy: da(l) };
  }
  const t = {}, n = ha("quartizo-notes-appearance"), a = qt("quartizo-notes-view"), r = qt("quartizo-notes-full-width"), i = xn(Number(qt("quartizo:workspace")));
  return n && (t.appearance = Fr(n)), (a === "raw" || a === "rendered") && (t.noteView = a), (r === "true" || r === "false") && (t.noteWidth = r === "true" ? "full" : "standard"), i !== null && (t.workspaceId = i), { values: { ...Ec, ...t }, pending: {}, legacy: t };
}
function pa(e) {
  try {
    const t = Ra();
    return t ? (t.setItem(Or, JSON.stringify(e)), !0) : !1;
  } catch {
    return !1;
  }
}
function Kt(e) {
  return e && (e.conflict || Sr(e) !== e.source.content) ? e : void 0;
}
function on(e) {
  return `${e.workspaceId}:${e.path}`;
}
function Ac(e, t) {
  const [n, a] = F(() => /* @__PURE__ */ new Map()), r = ne(n), i = ne(/* @__PURE__ */ new Map());
  function o(p, h) {
    const f = new Map(r.current);
    f.set(p, h(f.get(p) ?? {})), r.current = f, a(f);
  }
  function s(p, h, f) {
    var m;
    f !== void 0 && (((m = r.current.get(p)) == null ? void 0 : m.draft) ?? null) !== f || o(p, (d) => {
      const w = d.draft ?? d.saved, k = h && w ? { ...h, source: w.source, conflict: w.conflict } : h ?? void 0;
      return { ...d, draft: d.saving ? k : Kt(k), didSave: !1, failure: h ? d.failure : void 0 };
    });
  }
  function l(p, h) {
    var f;
    h && ((f = r.current.get(p)) == null ? void 0 : f.saved) === h && o(p, (m) => ({ ...m, saved: void 0 }));
  }
  async function u(p) {
    var w, k;
    const h = on(p), f = (w = r.current.get(h)) == null ? void 0 : w.draft;
    if (!f || f.conflict || f.lineEnding === "mixed") return;
    const m = i.current.get(h);
    if (m) {
      m.next = f;
      return;
    }
    const d = { next: f };
    i.current.set(h, d), o(h, (z) => ({ ...z, saving: !0, didSave: !1, failure: void 0 }));
    try {
      let z;
      for (; z = d.next; ) {
        d.next = void 0;
        const _ = Sr(z);
        if (_ === z.source.content) continue;
        const y = await ze(si(e, p.workspaceId, p.path, _, z.source.hash)), C = sn({ ...y, content: _ }), v = (k = i.current.get(h)) == null ? void 0 : k.next;
        v && (d.next = { ...v, source: C.source }), o(h, (b) => ({
          ...b,
          saved: C,
          draft: Kt(b.draft && { ...b.draft, source: C.source }),
          didSave: !0
        })), t();
      }
    } catch (z) {
      const _ = qe(z);
      o(h, (y) => _.code === "conflict" && y.draft ? { ...y, draft: { ...y.draft, conflict: !0 } } : { ...y, failure: _ });
    } finally {
      i.current.delete(h), o(h, (z) => ({ ...z, saving: !1, draft: Kt(z.draft) }));
    }
  }
  return { edits: n, edit: s, loaded: l, save: u };
}
const Dc = 3e3, Sc = typeof navigator < "u" && /Mac|iPhone|iPad/.test(navigator.platform), Gt = [], ln = 25, Tc = 5e4;
function fa(e, t) {
  const n = t.split("/").slice(0, -1), a = n.map((r, i) => `${n.slice(0, i + 1).join("/")}/`);
  return [...e.filter((r) => !a.includes(r)), ...a].slice(-50);
}
function Fc(e, t, n) {
  const a = Ea(), [r, i] = F(null), [o, s] = F(null), [l, u] = F(null), [p, h] = F(0);
  ie(() => {
    if (!t || !a) return;
    let m = !1, d, w, k;
    const z = async () => {
      try {
        const _ = await ze(Dt(e));
        if (m) return;
        const y = _.workspaces.filter((b) => b.workspace.companion), C = JSON.stringify(y);
        k !== C && (i(y), k = C);
        const v = y.find((b) => b.workspace.id === n);
        if (!_.available) throw new Error(_.error ?? "The Markdown index is unavailable.");
        if (v) {
          const b = `${v.workspace.id}:${v.index.indexedAt ?? ""}`;
          if (b !== w) {
            const T = await ze(ai(e, v.workspace.id));
            if (m) return;
            s({ workspaceId: v.workspace.id, notes: T.notes }), w = b;
          }
        } else
          s(null);
        u(null);
      } catch (_) {
        m || u(qe(_));
      } finally {
        m || (d = setTimeout(z, Dc));
      }
    };
    return z(), () => {
      m = !0, clearTimeout(d);
    };
  }, [t, e, p, a, n]);
  const f = r == null ? void 0 : r.find((m) => m.workspace.id === n);
  return {
    current: f,
    failure: l,
    workspaces: r,
    notes: f && (o == null ? void 0 : o.workspaceId) === f.workspace.id ? o.notes : null,
    refresh: () => h((m) => m + 1),
    visible: a
  };
}
function Mc({ api: e, active: t, workspaceId: n, request: a, preferences: r, onPreferencesChange: i, onSettings: o }) {
  var _e;
  const [s, l] = F(null), [u, p] = F(""), [h, f] = F(!1), [m, d] = F(""), [w, k] = F(null), [z, _] = F(!1), y = ne(!1), { workspaces: C, current: v, notes: b, failure: T, refresh: D, visible: L } = Fc(e, t, n), { edits: J, edit: Z, loaded: $, save: j } = Ac(e, D), V = ne(null), te = ne(null), N = ne(null), I = ne(null), R = ne(r.noteFolders), B = ne(n), W = ne("standard"), P = r.noteFolders[String(n)] ?? at, { limit: ee } = P, ce = Fe(() => new Set(P.pinned), [P.pinned]), M = Fe(() => new Set(P.expanded), [P.expanded]), H = Pr(u.trim().toLowerCase()), G = Fe(() => H ? (b ?? Gt).filter((x) => x.title.toLowerCase().includes(H) || x.path.toLowerCase().includes(H)) : b ?? Gt, [b, H]), xe = Fe(() => G.filter((x) => ce.has(x.path)), [G, ce]), me = Fe(() => G.filter((x) => !ce.has(x.path)), [G, ce]), Oe = Fe(() => qc(me.slice(0, ee)), [me, ee]), fe = (_e = v == null ? void 0 : v.index.writeBlocked) == null ? void 0 : _e.message;
  ka(() => {
    R.current = r.noteFolders, B.current = n, r.noteWidth !== "full" && (W.current = r.noteWidth);
  }, [r.noteFolders, r.noteWidth, n]);
  const be = Qe((x, q) => {
    const E = R.current[x] ?? at, A = q(E);
    R.current = { ...R.current, [x]: A }, i({ noteFolders: { [x]: A } });
  }, [i]), Ce = Qe((x, q = !1) => {
    l(q ? on(x) : null), be(x.workspaceId, (E) => ({
      ...E,
      lastNote: x.path,
      expanded: fa(E.expanded, x.path)
    }));
  }, [be]);
  if (ie(() => {
    p(""), f(!1), d(""), k(null), l(null);
  }, [n]), ie(() => {
    !t || !a || a.workspaceId !== n || a === I.current || (I.current = a, Ce(a), p(""), f(!1));
  }, [t, a, Ce, n]), ie(() => {
    var x;
    h && ((x = te.current) == null || x.focus());
  }, [h]), ie(() => {
    if (!t || !v) return;
    const x = (q) => {
      var A, S, U, Q;
      if (q.defaultPrevented || q.isComposing || q.altKey) return;
      const E = q.target instanceof Element ? q.target : null;
      if (!(E && E !== document.body && !((S = (A = V.current) == null ? void 0 : A.closest(".qz-app")) != null && S.contains(E)))) {
        if (q.key === "/" && !q.metaKey && !q.ctrlKey) {
          if (E != null && E.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
          q.preventDefault(), (U = N.current) == null || U.focus();
        }
        !q.shiftKey && q.key.toLowerCase() === "n" && (q.metaKey || q.ctrlKey) && !z && !fe && (q.preventDefault(), f(!0), k(null), (Q = te.current) == null || Q.focus());
      }
    };
    return document.addEventListener("keydown", x), () => document.removeEventListener("keydown", x);
  }, [t, z, v, fe]), !C) return T ? /* @__PURE__ */ c(de, { failure: T }) : /* @__PURE__ */ c("p", { className: "qz-muted qz-loading", role: "status", children: "Loading folders…" });
  if (!v) return /* @__PURE__ */ g("div", { className: "qz-stack", children: [
    /* @__PURE__ */ c(de, { failure: T }),
    /* @__PURE__ */ g("div", { className: "qz-empty", children: [
      /* @__PURE__ */ c("span", { className: "qz-empty-icon", children: /* @__PURE__ */ c(Y, { name: "folder" }) }),
      /* @__PURE__ */ c("h2", { children: "Connect a notes folder" }),
      /* @__PURE__ */ c("p", { children: "Add a folder of Markdown files in Settings to browse and edit your notes." }),
      /* @__PURE__ */ c("button", { type: "button", className: "qz-button", "data-variant": "primary", onClick: o, children: "Open Settings" })
    ] })
  ] });
  const X = v.workspace.id, ue = P.lastNote ? { workspaceId: X, path: P.lastNote } : null, re = ue ? on(ue) : "", De = (x) => Ce({ workspaceId: X, path: x }), ge = r.folderAppearance[X], K = ge && He(ge.color), Ne = hn(v.index), oe = (x) => be(X, (q) => ({
    ...q,
    expanded: q.expanded.includes(x) ? q.expanded.filter((E) => E !== x) : fa(q.expanded, x)
  })), ae = (x) => be(X, (q) => ({
    ...q,
    pinned: q.pinned.includes(x) ? q.pinned.filter((E) => E !== x) : [...q.pinned, x].slice(0, ln)
  })), Re = () => be(X, (x) => ({
    ...x,
    limit: Math.min(Tc, x.limit + at.limit)
  })), ve = async () => {
    const x = m.trim();
    if (!(!x || y.current || fe)) {
      y.current = !0, _(!0), k(null);
      try {
        const q = await ze(ii(e, X, x));
        B.current === X && (d(""), f(!1), (R.current[X] ?? at).lastNote === P.lastNote && Ce({ workspaceId: X, path: q.path }, !0)), D();
      } catch (q) {
        B.current === X && k(qe(q));
      } finally {
        y.current = !1, _(!1);
      }
    }
  };
  return /* @__PURE__ */ g("section", { ref: V, className: "qz-stack qz-notes-view", "aria-label": "Notes", children: [
    /* @__PURE__ */ g("div", { className: "qz-view-heading", children: [
      /* @__PURE__ */ c("h2", { className: "qz-section-title", children: "Notes" }),
      /* @__PURE__ */ g(
        "button",
        {
          type: "button",
          className: "qz-button",
          "data-variant": "primary",
          "aria-expanded": h,
          "aria-keyshortcuts": "Meta+N Control+N",
          title: "New note (Cmd/Ctrl+N)",
          onClick: () => {
            f((x) => !x), k(null);
          },
          disabled: z || !!fe,
          children: [
            /* @__PURE__ */ c(Y, { name: "plus" }),
            "New note"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ c(de, { failure: T }),
    Ne && /* @__PURE__ */ c("div", { className: "qz-notice", role: "note", children: Ne }),
    h && /* @__PURE__ */ g("form", { className: "qz-note-create qz-panel-surface", onSubmit: (x) => {
      x.preventDefault(), ve();
    }, children: [
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Note path",
        /* @__PURE__ */ c(
          "input",
          {
            ref: te,
            className: "qz-input",
            value: m,
            placeholder: "projects/launch.md",
            disabled: z,
            onChange: (x) => d(x.target.value),
            required: !0
          }
        )
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ c("button", { type: "submit", className: "qz-button", "data-variant": "primary", disabled: !m.trim() || z || !!fe, children: "Create note" }),
        /* @__PURE__ */ c("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: z, onClick: () => f(!1), children: "Cancel" })
      ] }),
      /* @__PURE__ */ c(de, { failure: w })
    ] }),
    /* @__PURE__ */ g("div", { className: "qz-notes-layout", children: [
      /* @__PURE__ */ g("aside", { className: "qz-note-browser qz-panel-surface", "aria-label": "Notes browser", children: [
        /* @__PURE__ */ g("h3", { className: "qz-note-browser-heading", children: [
          K && /* @__PURE__ */ c("span", { className: "qz-folder-dot", "aria-hidden": "true", style: { backgroundColor: K } }),
          /* @__PURE__ */ c("span", { className: "qz-note-browser-icon", "aria-hidden": "true", style: { color: K }, children: (ge == null ? void 0 : ge.emoji) || /* @__PURE__ */ c(Y, { name: "folder" }) }),
          v.workspace.name
        ] }),
        /* @__PURE__ */ g("label", { className: "qz-field", children: [
          "Search notes",
          /* @__PURE__ */ c(
            "input",
            {
              ref: N,
              type: "search",
              className: "qz-input",
              value: u,
              placeholder: "Title or path (press / to focus)",
              "aria-keyshortcuts": "/",
              onChange: (x) => p(x.target.value)
            }
          )
        ] }),
        b === null && !T && /* @__PURE__ */ c("p", { role: "status", className: "qz-muted qz-loading", children: "Loading notes…" }),
        b !== null && G.length === 0 && /* @__PURE__ */ c("p", { className: "qz-muted", children: H ? "No notes match your search." : v.index.state === "scanning" ? "Indexing notes…" : "No notes in this folder yet." }),
        xe.length > 0 && /* @__PURE__ */ g("section", { className: "qz-note-pins", "aria-labelledby": "qz-pinned-notes", children: [
          /* @__PURE__ */ c("h4", { id: "qz-pinned-notes", children: "Pinned notes" }),
          /* @__PURE__ */ c("ul", { className: "qz-note-tree", children: xe.map((x) => /* @__PURE__ */ c(Br, { note: x, icon: "pin", selected: ue == null ? void 0 : ue.path, onOpen: De }, x.path)) })
        ] }),
        me.length > 0 && /* @__PURE__ */ c(
          Lr,
          {
            branch: Oe,
            prefix: "",
            selected: ue == null ? void 0 : ue.path,
            searching: !!H,
            expanded: M,
            onOpen: De,
            onToggle: oe
          },
          H ? "search" : "browse"
        ),
        me.length > ee && /* @__PURE__ */ g(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            onClick: Re,
            children: [
              "Show more notes (",
              Math.min(ee, me.length),
              " of ",
              me.length,
              " shown)"
            ]
          }
        )
      ] }),
      ue ? /* @__PURE__ */ c(
        Ic,
        {
          api: e,
          active: t,
          location: ue,
          edits: J.get(re),
          onDraft: (x, q) => Z(re, x, q),
          onLoaded: (x) => $(re, x),
          onSave: () => {
            fe || j(ue);
          },
          writeBlocked: !!fe,
          notes: b ?? Gt,
          onOpen: De,
          loadBacklinks: t && L,
          indexRevision: v.index.indexedAt,
          view: s === re ? "raw" : r.noteView,
          focusEditor: s === re,
          width: r.noteWidth,
          pinned: ce.has(ue.path),
          pinLimitReached: P.pinned.length >= ln,
          onPin: () => ae(ue.path),
          onViewChange: (x) => {
            l(null), i({ noteView: x });
          },
          onWidthChange: () => i({ noteWidth: r.noteWidth === "full" ? W.current : "full" })
        },
        re
      ) : /* @__PURE__ */ g("div", { className: "qz-empty", children: [
        /* @__PURE__ */ c("span", { className: "qz-empty-icon", children: /* @__PURE__ */ c(Y, { name: "note" }) }),
        /* @__PURE__ */ c("h3", { children: "Open a note" }),
        /* @__PURE__ */ c("p", { children: "Choose one from the folder tree or create a new note." })
      ] })
    ] })
  ] });
}
function Br({ note: e, icon: t = "note", selected: n, onOpen: a }) {
  return /* @__PURE__ */ c("li", { children: /* @__PURE__ */ g(
    "button",
    {
      type: "button",
      "aria-current": e.path === n ? "true" : void 0,
      title: e.path,
      onClick: () => a(e.path),
      children: [
        /* @__PURE__ */ c(Y, { name: t }),
        e.title
      ]
    }
  ) });
}
function Lr({ branch: e, prefix: t, selected: n, searching: a, expanded: r, onOpen: i, onToggle: o }) {
  return /* @__PURE__ */ g("ul", { className: "qz-note-tree", children: [
    [...e.folders].map(([s, l]) => {
      const u = `${t}${s}/`;
      return /* @__PURE__ */ c("li", { children: /* @__PURE__ */ g("details", { open: a || r.has(u), children: [
        /* @__PURE__ */ g("summary", { title: s, onClick: (p) => {
          a || (p.preventDefault(), o(u));
        }, children: [
          /* @__PURE__ */ c("span", { className: "qz-note-tree-arrow", children: /* @__PURE__ */ c(Y, { name: "down" }) }),
          /* @__PURE__ */ c(Y, { name: "folder" }),
          /* @__PURE__ */ c("span", { className: "qz-note-tree-name", children: s })
        ] }),
        /* @__PURE__ */ c(
          Lr,
          {
            branch: l,
            prefix: u,
            selected: n,
            searching: a,
            expanded: r,
            onOpen: i,
            onToggle: o
          }
        )
      ] }) }, u);
    }),
    e.notes.map((s) => /* @__PURE__ */ c(Br, { note: s, selected: n, onOpen: i }, s.path))
  ] });
}
function Ic({ api: e, active: t, location: n, edits: a, onDraft: r, onLoaded: i, onSave: o, writeBlocked: s, notes: l, onOpen: u, loadBacklinks: p, indexRevision: h, view: f, focusEditor: m, width: d, pinned: w, pinLimitReached: k, onPin: z, onViewChange: _, onWidthChange: y }) {
  const { workspaceId: C, path: v } = n, { draft: b, saved: T, saving: D } = a ?? {}, [L, J] = F(null), Z = f === "rendered", [$, j] = F(""), [V, te] = F(null), [N, I] = F(!1), [R, B] = F(!1), [W, P] = F(!1), [ee, ce] = F(null), [M, H] = F(null), [G, xe] = F(null), me = ne(!1), Oe = ne(null), fe = ne(null), be = ne(null), Ce = !!b, X = b ?? T ?? L, ue = X == null ? void 0 : X.text, re = N || R || s || (X == null ? void 0 : X.lineEnding) === "mixed", De = G && ue !== void 0 ? ue.slice(G.from, ue.length - (G.original.length - G.to)) : "", ge = (G == null ? void 0 : G.original) ?? ue, K = !re && !G, Ne = Fe(() => kc(l), [l]), oe = Fe(
    () => Z && ge !== void 0 ? wc(ge, Ne, { editable: !re }) : [],
    [Z, ge, Ne, re]
  ), ae = `qz-note-column qz-note-column-${d}`, Re = `Up to ${ln} notes can be pinned per folder. Unpin one first.`;
  ka(() => {
    var S;
    const E = be.current;
    if (!E) return;
    be.current = null;
    const A = ((S = fe.current) == null ? void 0 : S.querySelector(E)) ?? fe.current;
    A == null || A.focus({ preventScroll: !0 });
  }, [oe]), ie(() => {
    const E = t && !me.current;
    if (me.current = t, !t || Ce || D) return;
    if (T && !E && L) {
      J(T), i(T);
      return;
    }
    let A = !1;
    return I(!0), te(null), ze(Qt(e, C, v)).then((S) => {
      A || (J(sn(S)), i(T), (X == null ? void 0 : X.source.hash) !== S.hash && xe(null));
    }).catch((S) => {
      A || te(qe(S));
    }).finally(() => {
      A || I(!1);
    }), () => {
      A = !0, I(!1);
    };
  }, [t, e, Ce, v, D, C]), ie(() => {
    if (!p || h == null) return;
    let E = !1;
    return ze(ri(e, C, v)).then((A) => {
      E || (ce(A), H(null));
    }).catch((A) => {
      E || (ce(null), H(qe(A)));
    }), () => {
      E = !0;
    };
  }, [e, h, p, v, C]);
  const ve = async (E = !1) => {
    if (!(N || D || R)) {
      if (b && !E) {
        P(!0);
        return;
      }
      P(!1), B(!0), te(null), j("");
      try {
        J(sn(await ze(Qt(e, C, v)))), r(null, b ?? null), i(T), xe(null), j("Note reloaded.");
      } catch (A) {
        te(qe(A));
      } finally {
        B(!1);
      }
    }
  }, _e = (E) => {
    !X || re || E === X.text || (j(""), r({ ...X, text: E }));
  }, x = (E, A) => {
    if (re || G || !X) return;
    const S = Tr(X.text, E, A);
    S && xe({ start: E, end: A, ...S, original: X.text });
  }, q = (E, A = !0) => {
    G && (E ? _e(G.original) : re || o(), A && (be.current = `[data-edit-start="${G.start}"]`), xe(null));
  };
  return /* @__PURE__ */ g("section", { className: "qz-note-editor qz-panel-surface", "aria-label": "Note editor", children: [
    /* @__PURE__ */ g("div", { className: "qz-toolbar qz-note-toolbar", children: [
      /* @__PURE__ */ g("div", { className: "qz-note-toolbar-file", children: [
        /* @__PURE__ */ c("code", { className: "qz-mono qz-path", title: v, children: v }),
        /* @__PURE__ */ c(
          "button",
          {
            type: "button",
            className: "qz-button qz-note-pin-button",
            "data-variant": "quiet",
            "aria-label": "Pin note",
            "aria-pressed": w,
            "aria-disabled": !w && k ? !0 : void 0,
            "aria-describedby": !w && k ? "qz-pin-limit" : void 0,
            title: w ? "Unpin note" : k ? Re : "Pin note",
            onClick: () => {
              (w || !k) && z();
            },
            children: /* @__PURE__ */ c(Y, { name: "pin" })
          }
        ),
        !w && k && /* @__PURE__ */ c("span", { id: "qz-pin-limit", className: "qz-muted qz-note-message", role: "status", children: Re })
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-actions", role: "group", "aria-label": "Reading options", children: [
        /* @__PURE__ */ c(
          Wr,
          {
            segments: [{ key: "rendered", label: "Rendered" }, { key: "raw", label: "Raw" }],
            value: f,
            onChange: (E) => {
              G ? q(!1, !1) : re || o(), _(E);
            },
            ariaLabel: "Note view",
            collapse: !1
          }
        ),
        /* @__PURE__ */ c(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            "aria-pressed": d === "full",
            onClick: y,
            children: "Full width"
          }
        )
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-actions", role: "group", "aria-label": "Note actions", children: [
        /* @__PURE__ */ c("span", { className: "qz-muted qz-note-message qz-note-save-status", role: "status", children: D ? "Saving note…" : b ? "Unsaved changes" : $ || (a != null && a.didSave ? "Note saved." : "") }),
        /* @__PURE__ */ c(
          "button",
          {
            ref: Oe,
            type: "button",
            className: "qz-button qz-icon-button",
            "data-variant": "quiet",
            "aria-label": "Reload from disk",
            title: "Reload from disk",
            disabled: N || D || R,
            onMouseDown: (E) => E.preventDefault(),
            onClick: () => void ve(),
            children: /* @__PURE__ */ c(Y, { name: "refresh" })
          }
        ),
        /* @__PURE__ */ c(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "primary",
            disabled: !b || b.conflict || re,
            onClick: () => {
              G ? q(!1) : o();
            },
            children: "Save note"
          }
        )
      ] })
    ] }),
    W && b && /* @__PURE__ */ g(ct, { label: "Replace unsaved draft", onCancel: () => P(!1), children: [
      /* @__PURE__ */ c("p", { children: "Replace your unsaved draft with the version on disk?" }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ c("button", { type: "button", className: "qz-button qz-destructive", onClick: () => void ve(!0), children: "Replace draft" }),
        /* @__PURE__ */ c("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => P(!1), children: "Keep draft" })
      ] })
    ] }),
    /* @__PURE__ */ c(de, { failure: V ?? (a == null ? void 0 : a.failure) ?? null }),
    N && !X && /* @__PURE__ */ c("p", { className: "qz-muted", role: "status", children: "Loading note…" }),
    (b == null ? void 0 : b.conflict) && /* @__PURE__ */ c("div", { className: "qz-notice", role: "alert", children: "The note changed on disk. Your draft is still here. Copy or review your changes before reloading from disk." }),
    (X == null ? void 0 : X.lineEnding) === "mixed" && /* @__PURE__ */ c("div", { className: "qz-notice", role: "note", children: "This note has mixed line endings and opens read-only to preserve them." }),
    X && (Z ? /* @__PURE__ */ g(
      "div",
      {
        ref: fe,
        className: `qz-notes-rendered qz-note-headings ${ae}`,
        "aria-label": "Markdown preview",
        tabIndex: -1,
        onClick: (E) => {
          if (!(E.target instanceof Element)) return;
          const A = E.target.closest("button.qz-wikilink[data-note-path]"), S = A == null ? void 0 : A.dataset.notePath;
          S && l.some((Q) => Q.path === S) && u(S);
          const U = E.target.closest("input.qz-note-task-checkbox[data-note-task-line]");
          if (U && !re) {
            let Q = Number(U.dataset.noteTaskLine);
            G && Q >= G.end && (Q += De.split(`
`).length - (G.end - G.start));
            const se = yc(X.text, Q, U.checked);
            se !== X.text && (be.current = `input[data-note-task-line="${Q}"]`, xe(null), _e(se), o());
          }
        },
        children: [
          !oe.length && /* @__PURE__ */ c("p", { className: "qz-muted", children: "No content yet." }),
          oe.map(({ html: E, start: A, end: S }, U) => {
            if (G && A === G.start)
              return /* @__PURE__ */ g("div", { className: "qz-note-block-editor", onBlur: (se) => {
                const Ee = se.relatedTarget;
                Ee === Oe.current || _n(Ee) || Ee instanceof Node && se.currentTarget.contains(Ee) || q(!1, !1);
              }, children: [
                /* @__PURE__ */ c(
                  "textarea",
                  {
                    "aria-label": "Block Markdown",
                    className: "qz-input qz-note-block-text",
                    autoFocus: !0,
                    spellCheck: !1,
                    rows: Math.max(2, (S ?? A + 1) - A),
                    readOnly: re,
                    value: De,
                    onChange: (se) => _e(G.original.slice(0, G.from) + se.target.value + G.original.slice(G.to)),
                    onKeyDown: (se) => {
                      se.nativeEvent.isComposing || (se.key === "Escape" || se.key === "Enter" && (se.metaKey || se.ctrlKey)) && (se.preventDefault(), se.stopPropagation(), q(se.key === "Escape"));
                    }
                  }
                ),
                /* @__PURE__ */ g("div", { className: "qz-actions", children: [
                  /* @__PURE__ */ g("span", { className: "qz-muted qz-note-message qz-block-hint", children: [
                    "Esc cancels · ",
                    Sc ? "⌘" : "Ctrl",
                    "+Enter saves"
                  ] }),
                  /* @__PURE__ */ c(
                    "button",
                    {
                      type: "button",
                      className: "qz-button",
                      onMouseDown: (se) => se.preventDefault(),
                      onClick: () => q(!1),
                      children: "Done"
                    }
                  ),
                  /* @__PURE__ */ c(
                    "button",
                    {
                      type: "button",
                      className: "qz-button",
                      "data-variant": "quiet",
                      onMouseDown: (se) => se.preventDefault(),
                      onClick: () => q(!0),
                      children: "Cancel"
                    }
                  )
                ] })
              ] }, U);
            const Q = K && A !== void 0 && S !== void 0;
            return /* @__PURE__ */ g("div", { className: "qz-note-block", children: [
              /* @__PURE__ */ c(
                "div",
                {
                  className: Q ? "qz-note-block-content" : void 0,
                  onClick: Q ? (se) => {
                    var Ee;
                    se.target instanceof Element && !se.target.closest("a, button, input, summary") && !((Ee = window.getSelection()) != null && Ee.toString()) && x(A, S);
                  } : void 0,
                  dangerouslySetInnerHTML: { __html: E }
                }
              ),
              Q && /* @__PURE__ */ c(
                "button",
                {
                  type: "button",
                  className: "qz-button qz-note-edit-block",
                  "data-edit-start": A,
                  "aria-label": `Edit block at line ${A + 1}`,
                  title: "Edit block",
                  onClick: () => x(A, S),
                  children: /* @__PURE__ */ c(Y, { name: "edit" })
                }
              )
            ] }, U);
          })
        ]
      }
    ) : /* @__PURE__ */ g("label", { className: `qz-field qz-note-source ${ae}`, children: [
      "Note Markdown",
      /* @__PURE__ */ c(
        "textarea",
        {
          autoFocus: m,
          className: "qz-input qz-note-text",
          spellCheck: !1,
          value: X.text,
          readOnly: re,
          onChange: (E) => _e(E.target.value),
          onBlur: (E) => {
            !re && E.relatedTarget !== Oe.current && !_n(E.relatedTarget) && o();
          }
        }
      )
    ] })),
    X && (M || !!(ee != null && ee.notes.length)) && /* @__PURE__ */ g("section", { className: "qz-note-backlinks", "aria-label": "Backlinks", children: [
      /* @__PURE__ */ c("h3", { children: "Backlinks" }),
      /* @__PURE__ */ c(de, { failure: M }),
      ee && /* @__PURE__ */ c("ul", { children: ee.notes.map((E) => /* @__PURE__ */ c("li", { children: /* @__PURE__ */ c("button", { type: "button", className: "qz-wikilink", title: E.path, onClick: () => u(E.path), children: E.title }) }, E.path)) }),
      (ee == null ? void 0 : ee.truncated) && /* @__PURE__ */ g("p", { className: "qz-muted", children: [
        "Only the first ",
        ee.notes.length,
        " backlinks are shown."
      ] })
    ] })
  ] });
}
function Oc(e, t) {
  const n = t[0].id, a = t.map((r) => `- ${r.id} (${JSON.stringify(r.label)})`).join(`
`);
  return `Work with Quartizo notes by editing Markdown files in the connected folder ${JSON.stringify(e)}.

- Keep note operations within this exact folder. If you delegate, pass the absolute path to the worker and have it verify that its changes land in that folder.
- Find and read the current note before updating it. Use a new, unused .md path inside the folder for new notes. Use UTF-8 with LF line endings for new files. Preserve existing line endings, unrelated text, and YAML properties when editing. Re-read before saving if the file may have changed, and stop if the edit conflicts with another writer.
- A regular note can start with a # Title heading and needs no ticket metadata. Create a ticket only when asked for a board card. Put its YAML frontmatter at the very start of the file. Generate a fresh UUID for each new ticket and preserve existing ticket IDs.

Use these ticket status IDs, listed in board order.
${a}

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
const Bc = [
  ["Indigo", "#6757c7"],
  ["Blue", "#19589f"],
  ["Teal", "#147864"],
  ["Rose", "#ad3563"]
];
function Lc(e, t) {
  const n = document.createElement("canvas");
  n.width = n.height = 1;
  const a = n.getContext("2d", { willReadFrequently: !0 });
  if (!a) return null;
  a.fillStyle = t, a.fillRect(0, 0, 1, 1);
  const [r, i, o] = a.getImageData(0, 0, 1, 1).data;
  a.fillStyle = e, a.fillRect(0, 0, 1, 1);
  const [s, l, u] = a.getImageData(0, 0, 1, 1).data, p = en(r, i, o), h = en(s, l, u);
  return (Math.max(p, h) + 0.05) / (Math.min(p, h) + 0.05);
}
function vt({ label: e, value: t, onChange: n, disabled: a, allowAccent: r = !0, checkContrast: i = !1 }) {
  const o = Jr(), s = t !== "theme" && t !== "accent", [l, u] = F(s ? t : ""), [p, h] = F(null), f = ne(null);
  ie(() => u(s ? t : ""), [t, s]), ie(() => {
    const w = f.current;
    if (!w || t === "theme" || a) return;
    const k = () => {
      const y = getComputedStyle(w);
      h(Lc(y.color, y.backgroundColor));
    };
    k();
    const z = new MutationObserver(k);
    for (let y = w.parentElement; y; y = y.parentElement)
      z.observe(y, { attributes: !0, attributeFilter: ["class", "style", "data-theme", "data-color-scheme"] });
    const _ = matchMedia("(prefers-color-scheme: dark)");
    return _.addEventListener("change", k), () => {
      z.disconnect(), _.removeEventListener("change", k);
    };
  }, [a, t]);
  const m = s && !/^#?[0-9a-f]{6}$/i.test(l), d = i && t !== "theme" && !a && p !== null && p < 4.5;
  return /* @__PURE__ */ g("div", { className: "qz-settings-color-field", children: [
    /* @__PURE__ */ g("div", { className: "qz-settings-color-mode", children: [
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        e,
        /* @__PURE__ */ g(
          "select",
          {
            className: "qz-input",
            value: s ? "custom" : t,
            disabled: a,
            "aria-describedby": d ? `${o}-contrast` : void 0,
            onChange: (w) => n(w.currentTarget.value === "custom" ? Bt : Ke(w.currentTarget.value)),
            children: [
              /* @__PURE__ */ c("option", { value: "theme", children: "Theme default" }),
              r && /* @__PURE__ */ c("option", { value: "accent", children: "Theme accent" }),
              /* @__PURE__ */ c("option", { value: "custom", children: "Custom color" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ c(
        "button",
        {
          className: "qz-button",
          "data-variant": "quiet",
          type: "button",
          disabled: a || t === "theme",
          "aria-label": `Reset ${e.toLowerCase()}`,
          onClick: () => n("theme"),
          children: "Reset"
        }
      )
    ] }),
    s && /* @__PURE__ */ g(pe, { children: [
      /* @__PURE__ */ g("div", { className: "qz-settings-color-mode", children: [
        /* @__PURE__ */ g("label", { className: "qz-field", children: [
          "Hex color",
          /* @__PURE__ */ c(
            "input",
            {
              className: "qz-input qz-mono",
              "aria-label": `${e} hex`,
              value: l,
              disabled: a,
              placeholder: Bt,
              maxLength: 7,
              spellCheck: !1,
              "aria-invalid": m || void 0,
              "aria-describedby": m ? `${o}-format` : void 0,
              onChange: (w) => {
                const k = w.currentTarget.value;
                u(k);
                const z = k.match(/^#?([0-9a-f]{6})$/i);
                z && n(Ke(`#${z[1].toLowerCase()}`));
              }
            }
          )
        ] }),
        /* @__PURE__ */ c(
          "input",
          {
            className: "qz-input",
            type: "color",
            "aria-label": `Custom ${e.toLowerCase()}`,
            value: t,
            disabled: a,
            onChange: (w) => n(Ke(w.currentTarget.value))
          }
        )
      ] }),
      m && /* @__PURE__ */ g("p", { id: `${o}-format`, className: "qz-muted", children: [
        "Use six hexadecimal digits, for example ",
        Bt,
        "."
      ] }),
      /* @__PURE__ */ c("div", { className: "qz-color-swatches", role: "group", "aria-label": `${e} swatches`, children: Bc.map(([w, k]) => /* @__PURE__ */ c(
        "button",
        {
          type: "button",
          title: w,
          "aria-label": w,
          "aria-pressed": t === k,
          disabled: a,
          style: { backgroundColor: k },
          onClick: () => n(k)
        },
        k
      )) })
    ] }),
    i && /* @__PURE__ */ c("span", { hidden: !0, ref: f, style: { color: He(t), backgroundColor: "var(--qz-canvas)" } }),
    d && /* @__PURE__ */ g("p", { id: `${o}-contrast`, className: "qz-notice", role: "status", children: [
      "Low contrast on the current background (",
      p.toFixed(2),
      ":1). Aim for at least 4.5:1."
    ] })
  ] });
}
function It() {
  const [e, t] = F(!1), [n, a] = F(null);
  return { busy: e, failure: n, run: async (i) => {
    t(!0), a(null);
    try {
      return await i(), !0;
    } catch (o) {
      return a(qe(o)), !1;
    } finally {
      t(!1);
    }
  } };
}
const ga = {
  defaults: "Defaults",
  appearance: "Appearance",
  notes: "Notes",
  board: "Board",
  folders: "Folders"
}, $c = {
  loading: "Loading preferences…",
  saving: "Saving…",
  saved: "Saved",
  local: "Saved in this browser. Waiting to sync.",
  unavailable: "Preferences couldn’t be saved."
}, jc = { tasks: "Tasks", todos: "TODOs", notes: "Notes", settings: "Settings" };
function Uc({
  api: e,
  preferences: t,
  onPreferencesChange: n,
  status: a,
  section: r,
  onSectionChange: i,
  workspaceId: o,
  onWorkspaceChange: s,
  onWorkspacesChanged: l
}) {
  const [u, p] = F(null), [h, f] = F(null), [m, d] = F(null), [w, k] = F(0), z = r ?? (u != null && u.length ? "defaults" : "folders"), _ = (u == null ? void 0 : u.filter((v) => v.companion)) ?? [], y = _.find((v) => v.id === o), C = () => {
    k((v) => v + 1), l();
  };
  return ie(() => {
    let v = !1;
    return Promise.all([_a(e), Dt(e)]).then(([b, T]) => {
      v || (p(b), d(T.writeBlocked ?? null), f(null));
    }).catch((b) => !v && f(qe(b))), () => {
      v = !0;
    };
  }, [e, w]), /* @__PURE__ */ g("div", { className: "qz-settings", children: [
    /* @__PURE__ */ g("header", { className: "qz-settings-header", children: [
      /* @__PURE__ */ c("h2", { className: "qz-section-title", children: "Settings" }),
      /* @__PURE__ */ c("span", { className: "qz-muted qz-settings-saved", role: "status", children: $c[a] })
    ] }),
    /* @__PURE__ */ c("nav", { "aria-label": "Settings sections", className: "qz-settings-nav", children: Object.keys(ga).map((v) => /* @__PURE__ */ c(
      "button",
      {
        type: "button",
        className: "qz-button",
        "aria-current": z === v ? "true" : void 0,
        onClick: () => i(v),
        children: ga[v]
      },
      v
    )) }),
    /* @__PURE__ */ c(de, { failure: h }),
    /* @__PURE__ */ c(de, { failure: m }),
    z === "defaults" && /* @__PURE__ */ g(nt, { title: "Defaults", children: [
      /* @__PURE__ */ g("div", { className: "qz-settings-fields", children: [
        /* @__PURE__ */ c(
          We,
          {
            label: "Start on",
            value: t.startOn,
            options: { last: "Last used tab", ...jc },
            onChange: (v) => n({ startOn: v })
          }
        ),
        /* @__PURE__ */ g("label", { className: "qz-field", children: [
          "Default workspace",
          /* @__PURE__ */ g("select", { className: "qz-input", value: t.workspaceId && _.some((v) => v.id === t.workspaceId) ? String(t.workspaceId) : "", onChange: (v) => s(Number(v.currentTarget.value) || null), children: [
            /* @__PURE__ */ c("option", { value: "", children: "First connected folder" }),
            _.map((v) => {
              var b;
              return /* @__PURE__ */ c("option", { value: v.id, children: [(b = t.folderAppearance[v.id]) == null ? void 0 : b.emoji, v.name].filter(Boolean).join(" ") }, v.id);
            })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ c("p", { className: "qz-muted", children: "Changing the workspace here or in the header remembers that folder for your next visit." })
    ] }),
    z === "appearance" && /* @__PURE__ */ c(nt, { title: "Appearance", children: /* @__PURE__ */ g("div", { className: "qz-settings-fields", children: [
      /* @__PURE__ */ c(
        vt,
        {
          label: "Accent color",
          value: t.accent,
          allowAccent: !1,
          checkContrast: !0,
          onChange: (v) => n({ accent: v })
        }
      ),
      /* @__PURE__ */ g("div", { className: "qz-stack", children: [
        /* @__PURE__ */ g("label", { className: "qz-settings-check", children: [
          /* @__PURE__ */ c(
            "input",
            {
              className: "qz-settings-toggle",
              type: "checkbox",
              role: "switch",
              checked: t.highContrast,
              onChange: (v) => n({ highContrast: v.currentTarget.checked })
            }
          ),
          "High contrast"
        ] }),
        /* @__PURE__ */ g("label", { className: "qz-settings-check", children: [
          /* @__PURE__ */ c(
            "input",
            {
              className: "qz-settings-toggle",
              type: "checkbox",
              role: "switch",
              checked: t.largerInterfaceText,
              onChange: (v) => n({ largerInterfaceText: v.currentTarget.checked })
            }
          ),
          "Larger interface text"
        ] }),
        /* @__PURE__ */ c(
          We,
          {
            label: "Motion",
            value: t.motion,
            options: { system: "Follow system", reduced: "Reduce motion" },
            onChange: (v) => n({ motion: v })
          }
        )
      ] })
    ] }) }),
    z === "notes" && /* @__PURE__ */ c(Jc, { preferences: t, onPreferencesChange: n }),
    /* @__PURE__ */ g("div", { className: "qz-stack", hidden: z !== "board", children: [
      /* @__PURE__ */ c(nt, { title: "Board view", children: /* @__PURE__ */ c(Fa, { preferences: t, onPreferencesChange: n, workspace: y }) }),
      /* @__PURE__ */ g(nt, { title: "Board columns", children: [
        /* @__PURE__ */ c("p", { className: "qz-muted", children: "Customize columns for each enabled folder. Use Save columns to apply your changes." }),
        !_.length && /* @__PURE__ */ c("button", { className: "qz-button", type: "button", onClick: () => i("folders"), children: "Manage folders" }),
        _.map((v) => /* @__PURE__ */ g("section", { "aria-label": v.name, className: "qz-settings-board-folder", children: [
          /* @__PURE__ */ c("h4", { children: v.name }),
          /* @__PURE__ */ c(
            Hc,
            {
              api: e,
              workspace: v,
              onSaved: (b) => p((T) => (T == null ? void 0 : T.map((D) => D.id === b.id ? { ...D, ...b } : D)) ?? null)
            }
          )
        ] }, v.id))
      ] })
    ] }),
    z === "folders" && /* @__PURE__ */ g("div", { className: "qz-settings-grid", "data-empty": (u == null ? void 0 : u.length) === 0 || void 0, children: [
      (u == null ? void 0 : u.length) !== 0 && /* @__PURE__ */ g("section", { className: "qz-settings-folders", "aria-labelledby": "qz-settings-folders", children: [
        /* @__PURE__ */ c("div", { className: "qz-settings-heading", children: /* @__PURE__ */ c("h3", { id: "qz-settings-folders", children: "Connected folders" }) }),
        !u && !h && /* @__PURE__ */ c("p", { className: "qz-muted", role: "status", children: "Loading folders…" }),
        u == null ? void 0 : u.map((v) => /* @__PURE__ */ c(
          Wc,
          {
            api: e,
            workspace: v,
            writeBlocked: m,
            onChanged: C,
            preferences: t,
            onPreferencesChange: n
          },
          v.id
        ))
      ] }),
      /* @__PURE__ */ c(Pc, { api: e, onAdded: (v) => {
        s(v.id), C();
      } }),
      (u == null ? void 0 : u.length) === 0 && /* @__PURE__ */ c(nt, { title: "Get started", children: /* @__PURE__ */ g("ol", { className: "qz-onboarding", children: [
        /* @__PURE__ */ c("li", { children: "Add a folder that contains or will hold Markdown files." }),
        /* @__PURE__ */ c("li", { children: "Open Notes and create your first note." }),
        /* @__PURE__ */ c("li", { children: "Open Tasks and create a ticket or turn an existing note into one." })
      ] }) })
    ] })
  ] });
}
function nt({ title: e, children: t }) {
  return /* @__PURE__ */ g("section", { className: "qz-panel-surface qz-settings-panel", "aria-label": e, children: [
    /* @__PURE__ */ c("div", { className: "qz-settings-heading", children: /* @__PURE__ */ c("h3", { children: e }) }),
    t
  ] });
}
function We({ label: e, value: t, options: n, onChange: a }) {
  return /* @__PURE__ */ g("label", { className: "qz-field", children: [
    e,
    /* @__PURE__ */ c("select", { className: "qz-input", value: t, onChange: (r) => a(r.currentTarget.value), children: Object.entries(n).map(([r, i]) => /* @__PURE__ */ c("option", { value: r, children: i }, r)) })
  ] });
}
function Pc({ api: e, onAdded: t }) {
  var k;
  const [n, a] = F(""), [r, i] = F(""), [o, s] = F(null), { busy: l, failure: u, run: p } = It(), h = n.trim(), f = h.startsWith("/"), m = (o == null ? void 0 : o.path) === h ? o : null, d = h && !f ? "Enter an absolute folder path starting with /." : (k = m == null ? void 0 : m.failure) == null ? void 0 : k.message;
  ie(() => {
    if (!f) return;
    const z = new AbortController(), _ = setTimeout(() => {
      e.post(`${Ue}/workspaces/validate`, { path: h }, { signal: z.signal }).then(() => {
        z.signal.aborted || s({ path: h, failure: null });
      }).catch((y) => {
        if (z.signal.aborted) return;
        const C = qe(y);
        C.code && C.status && C.status < 500 && C.code !== "not_found" && s({ path: h, failure: C });
      });
    }, 300);
    return () => {
      clearTimeout(_), z.abort();
    };
  }, [e, f, h]);
  const w = () => p(async () => {
    const z = await Zr(e, h, r.trim() || void 0);
    a(""), i(""), s(null), t(z);
  });
  return /* @__PURE__ */ g(
    "form",
    {
      className: "qz-panel-surface qz-settings-add",
      "aria-labelledby": "qz-settings-add",
      "aria-busy": l,
      onSubmit: (z) => {
        z.preventDefault(), f && !d && !l && w();
      },
      children: [
        /* @__PURE__ */ g("div", { children: [
          /* @__PURE__ */ c("h3", { id: "qz-settings-add", children: "Add a folder" }),
          /* @__PURE__ */ c("p", { className: "qz-muted", children: "Enter the path to a local folder. To use the same files in Kiro Notes, attach it there too." })
        ] }),
        /* @__PURE__ */ g("div", { children: [
          /* @__PURE__ */ g("label", { className: "qz-field", children: [
            "Folder path",
            /* @__PURE__ */ c(
              "input",
              {
                className: "qz-input",
                placeholder: "/home/you/notes",
                value: n,
                disabled: l,
                "aria-invalid": !!d,
                "aria-describedby": "qz-folder-path-check",
                onChange: (z) => {
                  a(z.target.value), s(null);
                }
              }
            )
          ] }),
          /* @__PURE__ */ c("p", { className: "qz-muted", id: "qz-folder-path-check", role: "status", children: d || (m ? "Folder is ready to connect." : "") })
        ] }),
        /* @__PURE__ */ g("label", { className: "qz-field", children: [
          /* @__PURE__ */ g("span", { children: [
            "Name ",
            /* @__PURE__ */ c("span", { className: "qz-muted", children: "(optional)" })
          ] }),
          /* @__PURE__ */ c("input", { className: "qz-input", placeholder: "e.g. Project notes", value: r, disabled: l, onChange: (z) => i(z.target.value) })
        ] }),
        /* @__PURE__ */ c("button", { className: "qz-button", "data-variant": "primary", type: "submit", disabled: l || !f || !!d, children: "Add folder" }),
        /* @__PURE__ */ c(de, { failure: u })
      ]
    }
  );
}
const ma = { small: "Small", medium: "Medium", large: "Large" };
function Jc({ preferences: e, onPreferencesChange: t }) {
  const { appearance: n } = e, a = (i) => t({ appearance: { ...n, ...i } }), r = n.headingColor === "theme" && n.headingLines === "theme" && n.lineColor === "theme";
  return /* @__PURE__ */ g(pe, { children: [
    /* @__PURE__ */ c(nt, { title: "Reading and editing", children: /* @__PURE__ */ g("div", { className: "qz-settings-fields", children: [
      /* @__PURE__ */ c(
        We,
        {
          label: "Note view",
          value: e.noteView,
          options: { rendered: "Rendered", raw: "Raw" },
          onChange: (i) => t({ noteView: i })
        }
      ),
      /* @__PURE__ */ c(
        We,
        {
          label: "Reading width",
          value: e.noteWidth,
          options: Cc,
          onChange: (i) => t({ noteWidth: i })
        }
      ),
      /* @__PURE__ */ c(
        We,
        {
          label: "Reading text size",
          value: e.noteTextSize,
          options: ma,
          onChange: (i) => t({ noteTextSize: i })
        }
      ),
      /* @__PURE__ */ c(
        We,
        {
          label: "Raw editor text size",
          value: e.rawTextSize,
          options: ma,
          onChange: (i) => t({ rawTextSize: i })
        }
      ),
      /* @__PURE__ */ c(
        We,
        {
          label: "Line spacing",
          value: e.noteLineHeight,
          options: { compact: "Compact", normal: "Normal", relaxed: "Relaxed" },
          onChange: (i) => t({ noteLineHeight: i })
        }
      ),
      /* @__PURE__ */ c(
        We,
        {
          label: "Reading font",
          value: e.noteFont,
          options: { theme: "Theme default", mono: "Monospace" },
          onChange: (i) => t({ noteFont: i })
        }
      )
    ] }) }),
    /* @__PURE__ */ g("section", { className: "qz-panel-surface qz-settings-panel", "aria-labelledby": "qz-note-appearance", children: [
      /* @__PURE__ */ g("div", { className: "qz-settings-heading", children: [
        /* @__PURE__ */ c("h3", { id: "qz-note-appearance", children: "Notes appearance" }),
        /* @__PURE__ */ c(
          "button",
          {
            className: "qz-button",
            type: "button",
            "data-variant": "quiet",
            disabled: r,
            onClick: () => t({ appearance: qa }),
            children: "Reset defaults"
          }
        )
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-settings-fields", children: [
        /* @__PURE__ */ c(vt, { label: "Heading text color", value: n.headingColor, checkContrast: !0, onChange: (i) => a({ headingColor: i }) }),
        /* @__PURE__ */ g("div", { className: "qz-settings-color-mode", children: [
          /* @__PURE__ */ g("label", { className: "qz-field", children: [
            "Heading lines",
            /* @__PURE__ */ g("select", { className: "qz-input", value: n.headingLines, onChange: (i) => a({ headingLines: ya(i.currentTarget.value) }), children: [
              /* @__PURE__ */ c("option", { value: "theme", children: "Theme default" }),
              /* @__PURE__ */ c("option", { value: "all", children: "Under every heading" }),
              /* @__PURE__ */ c("option", { value: "none", children: "None" })
            ] })
          ] }),
          /* @__PURE__ */ c(
            "button",
            {
              className: "qz-button",
              type: "button",
              "data-variant": "quiet",
              "aria-label": "Reset heading lines",
              disabled: n.headingLines === "theme",
              onClick: () => a({ headingLines: "theme" }),
              children: "Reset"
            }
          )
        ] }),
        /* @__PURE__ */ c(
          vt,
          {
            label: "Heading line color",
            value: n.lineColor,
            disabled: n.headingLines === "none",
            checkContrast: !0,
            onChange: (i) => a({ lineColor: i })
          }
        )
      ] }),
      /* @__PURE__ */ c("div", { className: "qz-settings-fields", children: ["Light", "Dark"].map((i) => /* @__PURE__ */ g(
        "div",
        {
          "data-preview-theme": i.toLowerCase(),
          className: "qz-note-headings qz-settings-panel-preview",
          role: "group",
          "aria-label": `${i} background preview`,
          children: [
            /* @__PURE__ */ g("span", { children: [
              i,
              " background"
            ] }),
            /* @__PURE__ */ c("h2", { children: "Project notes" }),
            /* @__PURE__ */ c("h3", { children: "Next steps" }),
            /* @__PURE__ */ c("p", { children: "Draft the plan and share it with the team." })
          ]
        },
        i
      )) })
    ] })
  ] });
}
function Wc(e) {
  const { api: t, workspace: n, preferences: a, onPreferencesChange: r } = e, i = a.folderAppearance[n.id] ?? Rc, o = (d) => {
    r({ folderAppearance: { [n.id]: { ...i, ...d } } });
  }, { busy: s, failure: l, run: u } = It(), [p, h] = F(null), [f, m] = F(!1);
  return ie(() => {
    if (!p) return;
    const d = setTimeout(() => h(null), 3e3);
    return () => clearTimeout(d);
  }, [p]), /* @__PURE__ */ g("section", { "aria-label": n.name, className: "qz-panel-surface qz-settings-folder", children: [
    /* @__PURE__ */ g("div", { className: "qz-settings-folder-identity", children: [
      /* @__PURE__ */ c("span", { className: "qz-settings-folder-icon", "aria-hidden": "true", style: { color: He(i.color) }, children: i.emoji || /* @__PURE__ */ c(Y, { name: "folder" }) }),
      /* @__PURE__ */ g("div", { children: [
        /* @__PURE__ */ c("h4", { children: n.name }),
        /* @__PURE__ */ c("code", { className: "qz-mono qz-muted", children: n.path })
      ] })
    ] }),
    /* @__PURE__ */ g("div", { className: "qz-settings-folder-controls", children: [
      /* @__PURE__ */ g("label", { className: "qz-settings-check", children: [
        /* @__PURE__ */ c(
          "input",
          {
            className: "qz-settings-toggle",
            type: "checkbox",
            role: "switch",
            checked: !!n.companion,
            disabled: s,
            onChange: () => void u(() => Xr(t, n.id, !n.companion)).then((d) => d && e.onChanged())
          }
        ),
        "Include in Tasks, Notes, and TODOs"
      ] }),
      /* @__PURE__ */ c("div", { className: "qz-settings-actions", children: !f && /* @__PURE__ */ c("button", { className: "qz-button", "data-variant": "quiet", type: "button", onClick: () => m(!0), disabled: s, children: "Remove…" }) })
    ] }),
    /* @__PURE__ */ g("div", { className: "qz-settings-fields", children: [
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Folder emoji",
        /* @__PURE__ */ c(
          "input",
          {
            className: "qz-input",
            placeholder: "Optional",
            value: i.emoji,
            maxLength: 16,
            onChange: (d) => o({ emoji: Ir(d.currentTarget.value) })
          }
        )
      ] }),
      /* @__PURE__ */ c(vt, { label: "Folder color", value: i.color, onChange: (d) => o({ color: d }) })
    ] }),
    /* @__PURE__ */ g("details", { className: "qz-settings-disclosure", children: [
      /* @__PURE__ */ c("summary", { children: "Advanced" }),
      /* @__PURE__ */ g("div", { className: "qz-stack", children: [
        n.companion && /* @__PURE__ */ g("div", { className: "qz-stack", children: [
          /* @__PURE__ */ c("p", { className: "qz-muted", children: "Rescan all notes if Tasks, Notes, or TODOs is missing recent changes." }),
          /* @__PURE__ */ c("div", { children: /* @__PURE__ */ c(
            "button",
            {
              className: "qz-button",
              "data-variant": "quiet",
              type: "button",
              disabled: s,
              onClick: () => void u(() => dn(t, { workspaceId: n.id, manual: !0, rebuild: !0 })).then((d) => d && h("Folder rescan requested.")),
              children: "Rescan folder"
            }
          ) })
        ] }),
        /* @__PURE__ */ c(Zc, { workspace: n }),
        !!n.oldTasks && /* @__PURE__ */ c(Kc, { api: t, workspace: n, writeBlocked: e.writeBlocked, onChanged: e.onChanged })
      ] })
    ] }),
    f && /* @__PURE__ */ g(ct, { label: "Remove folder", className: "qz-notice qz-settings-notice", onCancel: () => m(!1), children: [
      /* @__PURE__ */ g("p", { children: [
        "Stop showing “",
        n.name,
        "” in Quartizo? Your folder and files stay on disk.",
        !!n.oldTasks && ` Removing this folder also deletes its ${n.oldTasks} saved task(s) from the old Quartizo board.`
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ c(
          "button",
          {
            className: "qz-button",
            "data-destructive": !0,
            type: "button",
            onClick: () => void u(() => Gr(t, n.id, !!n.oldTasks)).then((d) => d && e.onChanged()),
            disabled: s,
            children: n.oldTasks ? `Remove and delete ${n.oldTasks} task(s)` : "Remove"
          }
        ),
        /* @__PURE__ */ c("button", { className: "qz-button", "data-variant": "quiet", type: "button", onClick: () => m(!1), disabled: s, children: "Cancel" })
      ] })
    ] }),
    p && /* @__PURE__ */ c("span", { className: "qz-muted", role: "status", children: p }),
    /* @__PURE__ */ c(de, { failure: l })
  ] });
}
function Hc({ api: e, workspace: t, onSaved: n }) {
  const [a, r] = F(null), [i, o] = F(""), [s, l] = F(null), [u, p] = F(""), { busy: h, failure: f, run: m } = It(), d = (a == null ? void 0 : a.columns) ?? t.columns, w = s ?? i.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 32), k = d.length < 20 && !!i.trim() && /^[a-z][a-z0-9_]{0,31}$/.test(w) && w !== "repair" && !d.some((b) => b.id === w), z = t.columns.some((b) => !d.some((T) => T.id === b.id)), _ = (b) => {
    r({ columns: b, version: (a == null ? void 0 : a.version) ?? t.columnsVersion }), p("");
  }, y = (b, T) => {
    const D = [...d], [L] = D.splice(b, 1);
    D.splice(b + T, 0, L), _(D);
  }, C = () => m(async () => {
    if (!a) return;
    const b = await Kr(e, t.id, d, a.version);
    n(b), r(null), p("Board columns saved.");
  }), v = JSON.stringify(d) !== JSON.stringify(t.columns);
  return /* @__PURE__ */ c(pe, { children: /* @__PURE__ */ c(pe, { children: /* @__PURE__ */ g("div", { className: "qz-stack", children: [
    /* @__PURE__ */ c("p", { className: "qz-muted", children: "The first column is the default for new tickets." }),
    /* @__PURE__ */ c("ul", { className: "qz-column-list", children: d.map((b, T) => /* @__PURE__ */ g("li", { className: "qz-column-row", children: [
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        /* @__PURE__ */ c("span", { className: "qz-mono", children: b.id }),
        /* @__PURE__ */ c(
          "input",
          {
            className: "qz-input",
            "aria-label": `Name for ${b.id}`,
            value: b.label,
            maxLength: 40,
            disabled: h,
            onChange: (D) => _(d.map((L) => L.id === b.id ? { ...L, label: D.target.value } : L))
          }
        )
      ] }),
      /* @__PURE__ */ c(
        vt,
        {
          label: `Color for ${b.id}`,
          value: Ke(b.color),
          allowAccent: !1,
          disabled: h,
          onChange: (D) => _(d.map((L) => L.id !== b.id ? L : D === "theme" ? { id: L.id, label: L.label } : { ...L, color: D }))
        }
      ),
      /* @__PURE__ */ g("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ c("button", { className: "qz-button", type: "button", "aria-label": `Move column ${b.id} up`, disabled: h || T === 0, onClick: () => y(T, -1), children: /* @__PURE__ */ c(Y, { name: "up" }) }),
        /* @__PURE__ */ c("button", { className: "qz-button", type: "button", "aria-label": `Move column ${b.id} down`, disabled: h || T === d.length - 1, onClick: () => y(T, 1), children: /* @__PURE__ */ c(Y, { name: "down" }) }),
        /* @__PURE__ */ c("button", { className: "qz-button", type: "button", "aria-label": `Remove column ${b.id}`, disabled: h || d.length === 1, onClick: () => _(d.filter((D) => D.id !== b.id)), children: "Remove" })
      ] })
    ] }, b.id)) }),
    d.length < 20 && /* @__PURE__ */ g("form", { className: "qz-column-row", onSubmit: (b) => {
      b.preventDefault(), !(h || !k) && (_([...d, { id: w, label: i.trim() }]), o(""), l(null));
    }, children: [
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "New column name",
        /* @__PURE__ */ c("input", { className: "qz-input", value: i, maxLength: 40, disabled: h, onChange: (b) => o(b.target.value) })
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-stack", children: [
        /* @__PURE__ */ g("label", { className: "qz-field", children: [
          "New status value",
          /* @__PURE__ */ c(
            "input",
            {
              className: "qz-input qz-mono",
              value: w,
              maxLength: 32,
              disabled: h,
              "aria-describedby": `qz-column-id-${t.id}`,
              onChange: (b) => l(b.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ c("p", { className: "qz-muted", id: `qz-column-id-${t.id}`, children: "The status value is saved as “status:” in your Markdown notes. Quartizo suggests it from the name. Use lowercase letters, digits and underscores, starting with a letter." })
      ] }),
      /* @__PURE__ */ c("button", { className: "qz-button", type: "submit", disabled: h || !k, children: "Add column" })
    ] }),
    z && /* @__PURE__ */ c("p", { className: "qz-notice", children: "Tickets in removed columns move to Needs repair. Move those tickets to an active column or restore the old status ID." }),
    /* @__PURE__ */ g("div", { className: "qz-settings-actions", children: [
      /* @__PURE__ */ c("button", { className: "qz-button", "data-variant": "primary", type: "button", disabled: h || !v || d.some((b) => !b.label.trim()), onClick: () => void C(), children: "Save columns" }),
      v && /* @__PURE__ */ c("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: h, onClick: () => {
        r(null), p("");
      }, children: "Discard changes" }),
      /* @__PURE__ */ c("span", { className: "qz-muted", role: "status", children: u })
    ] }),
    /* @__PURE__ */ c(de, { failure: f })
  ] }) }) });
}
function Zc({ workspace: e }) {
  const { openChat: t } = jr(), n = Oc(e.path, e.columns), a = ne(null), [r, i] = F(""), o = async () => {
    var s, l;
    try {
      await navigator.clipboard.writeText(n), i("Agent prompt copied.");
    } catch {
      (s = a.current) == null || s.focus(), (l = a.current) == null || l.select(), i("Copy the selected text to use the prompt.");
    }
  };
  return /* @__PURE__ */ g("div", { className: "qz-stack", children: [
    /* @__PURE__ */ c("div", { className: "qz-settings-actions", children: /* @__PURE__ */ g(
      "button",
      {
        type: "button",
        className: "qz-button",
        "data-variant": "primary",
        disabled: !e.companion,
        onClick: () => t({ message: n, autoSend: !1 }),
        children: [
          /* @__PURE__ */ c(Y, { name: "external" }),
          "Ask a Bot or agent"
        ]
      }
    ) }),
    e.companion ? /* @__PURE__ */ g("details", { className: "qz-settings-disclosure", children: [
      /* @__PURE__ */ c("summary", { children: "Agent instructions" }),
      /* @__PURE__ */ g("div", { className: "qz-stack", children: [
        /* @__PURE__ */ c("p", { className: "qz-muted", children: "Pick a Bot or agent in the KiroCrew chat composer, then add your request and send it. The agent needs access to this folder." }),
        /* @__PURE__ */ c("textarea", { ref: a, className: "qz-input qz-mono qz-agent-prompt", "aria-label": "Agent prompt", value: n, rows: 8, readOnly: !0 }),
        /* @__PURE__ */ g("div", { className: "qz-settings-actions", children: [
          /* @__PURE__ */ g("button", { type: "button", className: "qz-button", onClick: () => void o(), children: [
            /* @__PURE__ */ c(Y, { name: "copy" }),
            "Copy agent prompt"
          ] }),
          /* @__PURE__ */ c("span", { className: "qz-muted", role: "status", children: r })
        ] })
      ] })
    ] }) : /* @__PURE__ */ c("p", { className: "qz-muted", children: "Enable this folder to ask a Bot about its notes and tickets." })
  ] });
}
function Kc({ api: e, workspace: t, writeBlocked: n, onChanged: a }) {
  const [r, i] = F(null), [o, s] = F(null), [l, u] = F(!1), [p, h] = F(!1), { busy: f, failure: m, run: d } = It(), w = async () => {
    const z = await gi(e, t.id), _ = URL.createObjectURL(new Blob([JSON.stringify(z, null, 2)], { type: "application/json" })), y = document.createElement("a");
    y.href = _, y.download = `quartizo-old-tasks-${t.id}.json`, y.click(), setTimeout(() => URL.revokeObjectURL(_), 1e3), u(!0);
  }, k = async () => {
    if (!r) return;
    const z = await fi(e, t.id, r.planHash, p);
    s(z), i(null), a();
  };
  return /* @__PURE__ */ g("section", { className: "qz-settings-migration", "aria-label": `Old tasks in ${t.name}`, children: [
    /* @__PURE__ */ c("strong", { children: "Old task migration" }),
    /* @__PURE__ */ g("p", { className: "qz-muted", children: [
      "Convert ",
      t.oldTasks,
      " saved ",
      t.oldTasks === 1 ? "task" : "tasks",
      " from the old board into Markdown ticket notes."
    ] }),
    /* @__PURE__ */ g("div", { className: "qz-settings-actions", children: [
      /* @__PURE__ */ c("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: f, onClick: () => void d(w), children: "Export old tasks" }),
      /* @__PURE__ */ c("button", { className: "qz-button", type: "button", disabled: f || !t.companion, onClick: () => void d(async () => {
        i(await pi(e, t.id)), s(null), h(!1);
      }), children: "Preview migration" })
    ] }),
    l && /* @__PURE__ */ c("span", { className: "qz-muted", role: "status", children: "Export downloaded." }),
    r && /* @__PURE__ */ g(ct, { label: "Confirm old task migration", className: "qz-notice qz-settings-notice", onCancel: () => i(null), children: [
      /* @__PURE__ */ g("strong", { children: [
        "Create ",
        r.tasks.filter((z) => !z.migrated).length,
        " ticket note(s)"
      ] }),
      /* @__PURE__ */ c("p", { children: "Quartizo backs up the database tasks before writing each ticket to a new file." }),
      r.warnings.map((z, _) => /* @__PURE__ */ c("p", { children: z }, _)),
      /* @__PURE__ */ c("ul", { className: "qz-settings-migration-files", children: r.tasks.map((z) => /* @__PURE__ */ g("li", { children: [
        z.title,
        " → ",
        /* @__PURE__ */ c("code", { children: z.path }),
        " (",
        z.status,
        ")",
        z.migrated && " · already migrated",
        z.noteRef && /* @__PURE__ */ g("span", { children: [
          " · linked note: ",
          z.noteRef
        ] }),
        z.slotId && /* @__PURE__ */ g("span", { children: [
          " · session: ",
          z.slotId
        ] })
      ] }, z.uid)) }),
      r.tasks.some((z) => z.changed) && !r.complete && /* @__PURE__ */ g("label", { className: "qz-settings-check", children: [
        /* @__PURE__ */ c("input", { type: "checkbox", checked: p, onChange: (z) => h(z.target.checked), disabled: f }),
        "I reviewed the changed converted notes; keep their latest contents when resuming"
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ c("button", { className: "qz-button", "data-variant": "primary", type: "button", disabled: f || !!n || r.complete || !r.tasks.length, onClick: () => void d(k), children: r.backup ? "Resume and verify migration" : "Back up and migrate" }),
        /* @__PURE__ */ c("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: f, onClick: () => i(null), children: "Cancel" })
      ] })
    ] }),
    o && /* @__PURE__ */ g("div", { className: "qz-settings-notice qz-settings-result", role: "status", children: [
      /* @__PURE__ */ g("p", { children: [
        o.migrated.length,
        " ticket note(s) migrated. ",
        o.complete ? "Migration verified." : `${o.remaining} task(s) remain; preview again to continue.`
      ] }),
      /* @__PURE__ */ g("code", { className: "qz-mono qz-muted", children: [
        "Backup: ",
        o.backup.directory
      ] })
    ] }),
    /* @__PURE__ */ c(de, { failure: m })
  ] });
}
const Xt = `${Ue}/preferences`, Yt = 5e3, Gc = 3e4;
function wt(e, t) {
  return {
    ...e,
    ...t,
    ...t.noteFolders && { noteFolders: { ...e.noteFolders, ...t.noteFolders } },
    ...t.folderAppearance && { folderAppearance: { ...e.folderAppearance, ...t.folderAppearance } },
    ...t.laneSort && { laneSort: { ...e.laneSort, ...t.laneSort } }
  };
}
function Vt(e, t) {
  const n = Object.entries(t).filter(([a, r]) => (e == null ? void 0 : e[a]) !== r);
  return n.length ? Object.fromEntries(n) : void 0;
}
function ba(e, t) {
  const { noteFolders: n, folderAppearance: a, laneSort: r, ...i } = t, o = Object.fromEntries(Object.entries(i).filter(([p, h]) => e[p] !== h)), s = n && Vt(e.noteFolders, n), l = a && Vt(e.folderAppearance, a), u = r && Vt(e.laneSort, r);
  return s && (o.noteFolders = s), l && (o.folderAppearance = l), u && (o.laneSort = u), o;
}
function Xc(e) {
  const [t, n] = F(Nc), a = ne(t), r = ne(), [i, o] = F("loading"), [s, l] = F(!1), u = Qe((h) => (a.current = h, n(h), pa(h)), []), p = Qe((h) => {
    var d;
    const f = a.current, m = ba(f.values, h);
    Object.keys(m).length && (u({ ...f, values: wt(f.values, m), pending: wt(f.pending, m) }), (d = r.current) == null || d.call(r));
  }, [u]);
  return ie(() => {
    let h = !1, f = !1, m = !1, d;
    const w = () => ({ signal: AbortSignal.timeout(Yt) }), k = async () => {
      if (!(h || f)) {
        clearTimeout(d), f = !0;
        try {
          if (!m) {
            const { legacy: z } = a.current, _ = await ze(Object.keys(z).length ? e.patch(Xt, { changes: z, onlyIfMissing: !0 }, w()) : e.get(Xt, w()), Yt);
            if (h) return;
            const { pending: y } = a.current;
            u({ values: wt(At(_.preferences), y), pending: y, legacy: {} }), m = !0;
          }
          for (; Object.keys(a.current.pending).length; ) {
            o("saving");
            const z = a.current.pending, _ = await ze(e.patch(Xt, { changes: z }, w()), Yt);
            if (h) return;
            const y = ba(z, a.current.pending);
            u({ values: wt(At(_.preferences), y), pending: y, legacy: {} });
          }
          o("saved");
        } catch {
          if (h) return;
          o(pa(a.current) ? "local" : "unavailable"), d = setTimeout(() => void k(), Gc);
        } finally {
          f = !1, h || l(!0);
        }
      }
    };
    return r.current = () => void k(), k(), () => {
      h = !0, clearTimeout(d), r.current = void 0;
    };
  }, [e, u]), { preferences: t.values, status: i, ready: s, update: p };
}
const Yc = '.qz-app{--qz-canvas: var(--bg, Canvas);--qz-surface: var(--card, Canvas);--qz-elevated: var(--bg-elevated, Canvas);--qz-border: var(--border, color-mix(in srgb, CanvasText 18%, Canvas));--qz-text: var(--text-strong, CanvasText);--qz-muted: color-mix(in srgb, var(--muted, CanvasText) 78%, var(--qz-text));--qz-scale: 1;--qz-action-size: 32px;--qz-accent: var(--qz-accent-override, var(--accent, LinkText));--qz-accent-soft: var(--accent-subtle, color-mix(in srgb, var(--qz-accent) 13%, transparent));--qz-ok: var(--ok, #4e9a6b);--qz-warning: var(--warn, #ad7628);--qz-danger: var(--danger, #c7465d);--qz-info: var(--info, var(--qz-accent));container:qz-app / inline-size;width:100%;max-width:1560px;min-width:0;margin-inline:auto;padding:24px clamp(16px,3%,40px) 36px;color:var(--qz-text)}.qz-app,.qz-app *{box-sizing:border-box}.qz-app [hidden]{display:none!important}.qz-app[data-contrast=high]{--qz-border: var(--qz-text);--qz-muted: var(--qz-text)}.qz-app[data-accent=custom]{--qz-accent-soft: color-mix(in srgb, var(--qz-accent) 13%, transparent)}.qz-app[data-motion=reduced] :where(*,*:before,*:after){animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}@media (prefers-reduced-motion: reduce){.qz-app :where(*,*:before,*:after){animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}.qz-app :where(h1,h2,h3,p,ul){margin:0}.qz-app :where(button,input,textarea,select){font:inherit}.qz-app :is(button,summary,input,textarea,select,.qz-board):focus-visible{outline:2px solid var(--qz-accent);outline-offset:2px}.qz-app :is(button,input,textarea,select):disabled{opacity:.55;cursor:default}.qz-app input[type=checkbox]{accent-color:var(--qz-accent)}.qz-icon{width:1rem;height:1rem;flex:none}.qz-header,.qz-brand,.qz-tabs,.qz-view-heading,.qz-toolbar,.qz-actions,.qz-inline-field{display:flex;align-items:center;min-width:0}.qz-header,.qz-view-heading,.qz-toolbar{justify-content:space-between;flex-wrap:wrap;gap:12px 20px}.qz-header{padding:0 0 12px;border-bottom:1px solid var(--qz-border)}.qz-brand{gap:9px}.qz-mark{display:grid;place-items:center;flex:none;width:36px;height:36px;border:1px solid color-mix(in srgb,var(--qz-accent) 34%,var(--qz-border));border-radius:13px;background:linear-gradient(145deg,var(--qz-accent-soft),var(--qz-surface));color:var(--qz-accent)}.qz-mark .qz-icon{width:21px;height:21px}.qz-brand h1{font-size:calc(21px * var(--qz-scale, 1));font-weight:700;letter-spacing:-.035em;line-height:1.1}.qz-workspace{flex:0 1 auto;max-width:100%}.qz-workspace .qz-input{max-width:min(240px,65vw)}.qz-folder-dot{width:12px;height:12px;flex:none;border:1px solid var(--qz-border);border-radius:50%}.qz-return{justify-self:start;margin-block-end:6px}.qz-preference-notice{margin-block-end:12px}.qz-tabs{max-width:100%;gap:3px;padding:4px;border:1px solid var(--qz-border);border-radius:12px;background:var(--qz-surface)}.qz-tabs button{display:flex;align-items:center;justify-content:center;gap:7px;min-height:36px;padding:6px 12px;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--qz-muted);font-size:calc(13px * var(--qz-scale, 1));font-weight:600;cursor:pointer}.qz-tabs button:hover{color:var(--qz-text);background:var(--qz-elevated)}.qz-tabs button[aria-selected=true]{border-color:color-mix(in srgb,var(--qz-accent) 25%,var(--qz-border));background:var(--qz-accent-soft);color:var(--qz-text)}.qz-tabs button[aria-selected=true] .qz-icon{color:var(--qz-accent)}.qz-content{padding-top:24px}.qz-stack{display:grid;gap:14px;min-width:0}.qz-section-title{font-size:calc(27px * var(--qz-scale, 1));font-weight:700;letter-spacing:-.032em;line-height:1.17}.qz-section-description{margin-top:5px;color:var(--qz-muted)}.qz-muted{color:var(--qz-muted);font-weight:400}.qz-mono{font:400 calc(12px * var(--qz-scale, 1))/1.5 var(--mono, ui-monospace, monospace)}.qz-path{display:block;min-width:0;overflow:hidden;color:var(--qz-muted);text-overflow:ellipsis;white-space:nowrap}.qz-note-headings :is(h1,h2,h3,h4,h5,h6){color:var(--qz-note-heading-color, var(--qz-preview-text, var(--qz-text)));line-height:1.25;font-weight:600}.qz-note-headings h1{font-size:1.802em;font-weight:700}.qz-note-headings h2{font-size:1.602em}.qz-note-headings h3{font-size:1.422em}.qz-note-headings h4{font-size:1.278em}.qz-note-headings h5{font-size:1.121em}.qz-note-headings h6{font-size:1em}.qz-app[data-note-heading-lines=theme] .qz-note-headings :is(h1,h2),.qz-app[data-note-heading-lines=all] .qz-note-headings :is(h1,h2,h3,h4,h5,h6){padding-block-end:.25em;border-block-end:1px solid var(--qz-note-line-color, var(--mdnb-heading-rule-soft, var(--qz-border)))}.qz-app[data-note-heading-lines=theme] .qz-note-headings :is(h3,h4,h5,h6){padding-inline-start:8px;margin-inline-start:-10px;border-inline-start:2px solid var(--qz-note-line-color, var(--mdnb-heading-rail, var(--qz-border)))}.qz-actions{gap:6px;flex-wrap:wrap}.qz-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;max-width:100%;min-height:36px;padding:5px 11px;border:1px solid var(--qz-border);border-radius:8px;background:var(--qz-surface);color:var(--qz-text);font-size:calc(13px * var(--qz-scale, 1));font-weight:600;text-align:center;cursor:pointer}.qz-button:not(:disabled):hover{background:var(--qz-elevated);border-color:var(--border-strong, var(--qz-muted))}.qz-button[data-variant=primary]{border-color:var(--qz-accent);background:var(--qz-accent);color:var(--accent-fg, var(--qz-canvas))}.qz-button[data-variant=primary]:not(:disabled):hover{border-color:var(--accent-hover, var(--qz-accent));background:var(--accent-hover, var(--qz-accent))}.qz-app[data-accent=custom] .qz-button[data-variant=primary]{color:var(--qz-accent-foreground, var(--qz-canvas))}.qz-app[data-accent=custom] .qz-button[data-variant=primary]:not(:disabled):hover{border-color:var(--qz-accent);background:color-mix(in srgb,var(--qz-accent) 90%,var(--qz-canvas))}.qz-button[data-variant=quiet]{border-color:transparent;background:transparent;color:var(--qz-muted)}.qz-button[data-variant=quiet]:not(:disabled):hover{color:var(--qz-text)}.qz-icon-button{min-width:36px;padding-inline:8px}.qz-input{min-width:0;max-width:100%;min-height:36px;padding:6px 9px;border:1px solid var(--qz-border);border-radius:8px;background:var(--qz-elevated);color:var(--qz-text);font-size:calc(13px * var(--qz-scale, 1))}.qz-input::placeholder{color:var(--qz-muted);opacity:1}.qz-field{display:grid;gap:5px;min-width:0;font-size:calc(13px * var(--qz-scale, 1));font-weight:600}.qz-field .qz-input{width:100%;font-weight:400}.qz-inline-field{gap:8px;color:var(--qz-muted);font-size:calc(13px * var(--qz-scale, 1))}.qz-inline-field .qz-input{max-width:min(36ch,52%);font-weight:600}.qz-check-label{display:flex;align-items:center;gap:8px}.qz-panel-surface{min-width:0;border:1px solid var(--qz-border);border-radius:12px;background:var(--qz-surface)}.qz-notice{padding:11px 13px;border:1px solid color-mix(in srgb,var(--qz-warning) 42%,var(--qz-border));border-radius:9px;background:color-mix(in srgb,var(--qz-warning) 7%,var(--qz-surface));font-size:calc(13px * var(--qz-scale, 1));overflow-wrap:anywhere}.qz-notice[data-variant=neutral]{border-color:var(--qz-border);background:var(--qz-surface)}.qz-notice.qz-error{border-color:color-mix(in srgb,var(--qz-danger) 53%,var(--qz-border));background:color-mix(in srgb,var(--qz-danger) 9%,var(--qz-surface))}.qz-empty{display:grid;place-items:center;gap:8px;padding:28px 16px;border:1px dashed var(--qz-border);border-radius:12px;color:var(--qz-muted);text-align:center}.qz-empty :is(h2,h3){color:var(--qz-text);font-size:calc(17px * var(--qz-scale, 1));font-weight:650}.qz-empty .qz-button{margin-top:4px}.qz-empty-icon,.qz-note-icon{display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:9px;background:var(--qz-accent-soft);color:var(--qz-accent)}.qz-visually-hidden{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.qz-board-meta{gap:2px 12px;padding-block:2px}.qz-board-meta>.qz-actions{margin-inline-start:auto}.qz-result-count{color:var(--qz-muted);font-size:calc(12px * var(--qz-scale, 1));font-weight:600}.qz-index{display:inline-flex;align-items:baseline;gap:7px;color:var(--qz-muted);font-size:calc(12px * var(--qz-scale, 1))}.qz-index:empty{display:none}.qz-board{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(172px,1fr);gap:10px;min-width:0;padding:2px 2px 10px;overflow-x:auto;overscroll-behavior-inline:contain}.qz-lane{--qz-status: var(--qz-muted);min-width:0;min-height:308px;padding:9px;border:1px solid color-mix(in srgb,var(--qz-status) 20%,var(--qz-border));border-radius:12px;background:linear-gradient(180deg,color-mix(in srgb,var(--qz-status) 7%,var(--qz-surface)),var(--qz-surface) 105px)}.qz-app [data-lane-status=ready]{--qz-status: var(--qz-info)}.qz-app [data-lane-status=in_progress]{--qz-status: var(--qz-accent)}.qz-app [data-lane-status=review]{--qz-status: var(--qz-warning)}.qz-app [data-lane-status=done]{--qz-status: var(--qz-ok)}.qz-app [data-lane-status=repair]{--qz-status: var(--qz-danger)}.qz-lane-heading{display:flex;align-items:center;gap:7px;padding:3px 2px 10px;font-size:calc(13px * var(--qz-scale, 1));font-weight:650;overflow-wrap:anywhere}.qz-dot{width:8px;height:8px;flex:none;border-radius:50%;background:var(--qz-status, var(--qz-ok))}.qz-dot[data-attention=true]{background:var(--qz-warning)}.qz-count{margin-inline-start:auto;padding:1px 6px;border:1px solid var(--qz-border);border-radius:999px;color:var(--qz-muted);font-size:calc(12px * var(--qz-scale, 1));font-variant-numeric:tabular-nums}.qz-lane-empty{padding:11px;border:1px dashed var(--qz-border);border-radius:8px;color:var(--qz-muted);font-size:calc(12px * var(--qz-scale, 1));text-align:center}.qz-cards,.qz-todo-list{list-style:none;padding:0}.qz-cards{display:grid;gap:8px}.qz-cards li{min-width:0}.qz-cards li[draggable=true]{cursor:grab}.qz-cards li[draggable=true]:active{cursor:grabbing}.qz-ticket{border:1px solid var(--qz-border);border-radius:9px;background:var(--qz-elevated);box-shadow:var(--shadow-sm, none)}.qz-ticket:hover,.qz-ticket:focus-within{border-color:var(--border-strong, var(--qz-muted))}.qz-ticket-content{display:grid;gap:5px;padding:10px 10px 8px}.qz-note-link{display:flex;align-items:start;justify-content:space-between;gap:6px;padding:0;border:0;background:transparent;color:var(--qz-text);font-size:calc(14px * var(--qz-scale, 1));font-weight:650;line-height:1.4;text-align:start;overflow-wrap:anywhere;cursor:pointer}.qz-note-link .qz-icon{width:13px;height:13px;margin-top:3px;color:var(--qz-muted)}.qz-note-link:hover{text-decoration:underline}.qz-ticket-progress{display:flex;align-items:center;gap:8px;margin-top:3px;color:var(--qz-muted);font-size:calc(12px * var(--qz-scale, 1));font-variant-numeric:tabular-nums}.qz-ticket-progress progress{width:min(54px,40%);height:5px;accent-color:var(--qz-ok);border:0;border-radius:6px;overflow:hidden}.qz-ticket-progress progress::-webkit-progress-bar{background:var(--qz-border)}.qz-ticket-progress progress::-webkit-progress-value{border-radius:6px;background:var(--qz-ok)}.qz-badge{padding:2px 5px;border-radius:5px;background:color-mix(in srgb,var(--qz-warning) 17%,var(--qz-surface));font-size:calc(12px * var(--qz-scale, 1));overflow-wrap:anywhere}.qz-ticket-footer{position:relative;padding:5px;border-top:1px solid var(--qz-border)}.qz-ticket-status{padding-inline-end:calc(var(--qz-action-size) + 7px)}.qz-ticket-status .qz-input{width:100%;min-height:var(--qz-action-size);padding:3px 6px;border-color:var(--qz-border);background:var(--qz-surface);color:var(--qz-text)}.qz-ticket-status .qz-input:not(:disabled):hover{background:var(--qz-elevated);border-color:var(--border-strong, var(--qz-muted))}.qz-ticket-actions summary{position:absolute;inset-block-start:5px;inset-inline-end:5px;min-height:var(--qz-action-size);min-width:var(--qz-action-size);list-style:none}.qz-ticket-actions summary::-webkit-details-marker{display:none}.qz-ticket-action-list{display:grid;gap:1px;margin-top:5px;padding-top:5px;border-top:1px solid var(--qz-border)}.qz-ticket-action-list .qz-button{justify-content:start;min-height:32px;text-align:start}.qz-ticket-action-list .qz-destructive:not(:disabled),.qz-notice .qz-destructive:not(:disabled){color:var(--qz-danger)}.qz-app [role=alertdialog]:focus-visible{outline:2px solid var(--qz-accent);outline-offset:2px}.qz-lane[data-drop-target]{border-color:var(--qz-accent);box-shadow:0 0 0 2px var(--qz-accent-soft),inset 0 0 0 1px var(--qz-accent)}.qz-cards li[data-drop-before]{box-shadow:0 -3px 0 -1px var(--qz-accent)}.qz-cards li[data-drop-before]{position:relative}.qz-cards li[data-drop-before]:before{content:"";position:absolute;inset-inline:0;inset-block-start:-6px;height:3px;border-radius:2px;background:var(--qz-accent)}.qz-ticket-form{display:grid;gap:12px;max-width:630px;padding:16px}.qz-ticket-form h3{font-size:calc(17px * var(--qz-scale, 1));font-weight:650}.qz-note-preview{max-height:180px;margin:0;padding:10px;overflow:auto;background:var(--qz-canvas);white-space:pre-wrap;overflow-wrap:anywhere}.qz-todos{width:100%;max-width:1100px;margin-inline:auto}.qz-todo-filters{display:flex;flex-wrap:wrap;gap:12px;padding:12px}.qz-todo-filters .qz-field{flex:1 1 135px}.qz-todo-filters .qz-field:first-child{flex:3 1 245px}.qz-search{position:relative;display:block}.qz-search .qz-icon{position:absolute;inset-block-start:10px;inset-inline-start:9px;color:var(--qz-muted);pointer-events:none}.qz-search .qz-input{padding-inline-start:32px}.qz-todo-header{display:flex;align-items:center;gap:10px;min-width:0;padding:12px 14px}.qz-todo-identity{flex:1;min-width:0}.qz-todo-identity h3{display:flex;align-items:center;flex-wrap:wrap;gap:5px 9px;font-size:calc(15px * var(--qz-scale, 1));font-weight:650;overflow-wrap:anywhere}.qz-todo-meta{display:flex;align-items:baseline;gap:6px;color:var(--qz-muted);font-size:calc(12px * var(--qz-scale, 1))}.qz-todo-meta>span:first-child{min-width:0;overflow-wrap:anywhere}.qz-status-pill{--qz-status: var(--qz-muted);display:inline-flex;align-items:center;gap:5px;padding:1px 7px;border-radius:999px;background:color-mix(in srgb,var(--qz-status) 13%,var(--qz-surface));font-size:calc(12px * var(--qz-scale, 1));font-weight:500}.qz-status-pill .qz-dot{width:6px;height:6px}.qz-todo-row{display:flex;align-items:center;border-top:1px solid var(--qz-border)}.qz-todo-row:hover,.qz-todo-row:focus-within{background:var(--qz-elevated)}.qz-todo-row:last-child{border-radius:0 0 12px 12px}.qz-todo-check{display:flex;align-items:baseline;gap:10px;flex:1;min-width:0;padding:10px 14px;overflow-wrap:anywhere;cursor:pointer}.qz-todo-check input{flex:none;align-self:start;width:16px;height:16px;margin:2px 0 0}.qz-todo-check:has(input:disabled){cursor:default}.qz-todo-row[data-checked=true] .qz-todo-check span{color:var(--qz-muted);text-decoration:line-through}.qz-todo-row>.qz-button{margin-inline-end:6px}@container qz-app (max-width: 650px){.qz-board{grid-auto-columns:clamp(170px,65cqi,244px)}}@container qz-app (max-width: 520px){.qz-header{gap:14px;padding-bottom:14px}.qz-tabs{width:100%;order:1}.qz-tabs button{flex:1;gap:5px;padding-inline:5px}.qz-content{padding-top:18px}.qz-section-title{font-size:calc(24px * var(--qz-scale, 1))}.qz-inline-field{width:100%}.qz-inline-field .qz-input{flex:1;max-width:none}.qz-board-meta>.qz-actions{margin-inline-start:0}.qz-todo-filters .qz-field:first-child{flex-basis:100%}.qz-todo-header{padding-inline:10px}.qz-todo-header .qz-note-icon{display:none}}@media (pointer: coarse){.qz-app{--qz-action-size: 44px}.qz-app :is(.qz-button,.qz-tabs button,.qz-input,.qz-ticket-status .qz-input,.qz-ticket-actions summary,.qz-note-tree :is(summary,button),.qz-todo-check,.qz-settings-check){min-height:44px}.qz-app :is(.qz-icon-button,.qz-color-swatches button){min-width:44px}.qz-color-swatches button{min-height:44px}.qz-todo-check input{width:22px;height:22px}}@media (hover: none){.qz-note-block .qz-note-edit-block{opacity:1}}@container qz-app (max-width: 360px){.qz-tabs .qz-icon{display:none}.qz-workspace .qz-input{max-width:min(140px,40vw)}}.qz-app[data-interface-text=large]{--qz-scale: 1.2}.qz-loading{padding:8px 2px}.qz-board-hint{font-size:calc(12px * var(--qz-scale, 1))}.qz-menu{position:relative}.qz-menu-list{position:absolute;inset-block-start:calc(100% + 4px);inset-inline-end:0;z-index:5;display:grid;gap:2px;min-width:200px;padding:4px;background:var(--qz-elevated);box-shadow:var(--shadow-md, 0 6px 20px rgb(0 0 0 / .18))}.qz-menu-list .qz-button{justify-content:start;width:100%;text-align:start}.qz-board-wrap{position:relative;min-width:0}.qz-board-wrap:before,.qz-board-wrap:after{content:"";position:absolute;inset-block:0;z-index:1;width:28px;opacity:0;pointer-events:none;transition:opacity .15s}.qz-board-wrap:before{inset-inline-start:0;background:linear-gradient(to right,var(--qz-canvas),transparent)}.qz-board-wrap:after{inset-inline-end:0;background:linear-gradient(to left,var(--qz-canvas),transparent)}.qz-board-wrap[data-more-start]:before,.qz-board-wrap[data-more-end]:after{opacity:.9}', Vc = '.qz-start-checklist{margin:0;padding-inline-start:1.5em;text-align:start}.qz-board-view-panel{padding:14px}.qz-board-view-settings{display:flex;flex-wrap:wrap;align-items:start;gap:16px 24px;font-size:calc(13px * var(--qz-scale, 1))}.qz-board-view-settings>.qz-check-label{align-self:center}.qz-board-setting-group{display:grid;gap:8px;min-inline-size:0;margin:0;padding:0;border:0}.qz-board-setting-group legend{margin-bottom:6px;padding:0;font-weight:600}.qz-board-order-group{flex-basis:100%}.qz-board-order-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,145px),1fr));gap:8px 12px}.qz-board[data-density=compact]{gap:6px}.qz-board[data-density=compact] .qz-lane{padding:6px}.qz-board[data-density=compact] .qz-lane-heading{padding-block-end:6px}.qz-board[data-density=compact] .qz-cards{gap:4px}.qz-board[data-density=compact] .qz-ticket-content{gap:2px;padding:6px}.qz-board[data-density=compact] .qz-ticket-footer{padding-block:2px}.qz-board[data-density=compact] .qz-ticket-actions summary{inset-block-start:2px}.qz-lane-help{margin:0 2px 8px;font-size:calc(12px * var(--qz-scale, 1))}.qz-folder-label{display:inline-flex;align-items:center;gap:4px;overflow-wrap:anywhere}.qz-folder-label-dot{flex:none;width:.55em;height:.55em;border-radius:50%;background:var(--qz-folder-label-color)}.qz-ticket-badges{flex-wrap:wrap}.qz-ticket-badges .qz-folder-label{padding:2px 5px;border:1px solid var(--qz-border);border-radius:5px;font-size:calc(12px * var(--qz-scale, 1))}.qz-todo-saved-filters{flex-basis:100%}.qz-todo-saved-filters summary{display:inline-flex;width:fit-content;list-style:none}.qz-todo-saved-filters summary::-webkit-details-marker{display:none}.qz-todo-saved-filters summary:after{content:"▾";color:var(--qz-muted)}.qz-todo-saved-filters[open] summary:after{content:"▴"}.qz-todo-saved-controls{display:grid;gap:8px;padding-block-start:10px}.qz-todo-saved-row{display:flex;flex-wrap:wrap;align-items:end;gap:8px}.qz-todo-filters .qz-todo-saved-row .qz-field{flex:0 1 240px}.qz-todo-saved-row>p{flex-basis:100%;font-size:calc(13px * var(--qz-scale, 1))}', Qc = ".qz-notes-layout{display:grid;grid-template-columns:minmax(190px,1fr) minmax(0,3fr);gap:14px;align-items:start}.qz-note-browser,.qz-note-editor,.qz-note-create{display:grid;gap:12px;padding:14px}.qz-note-browser{max-height:72vh;overflow:auto}.qz-note-browser-heading{display:flex;align-items:center;gap:8px;min-width:0;font-size:calc(15px * var(--qz-scale, 1));overflow-wrap:anywhere}.qz-note-browser-icon{display:inline-flex;flex:none;color:var(--qz-accent)}.qz-note-pins{display:grid;gap:5px}.qz-note-pins h4{margin:0;font-size:calc(13px * var(--qz-scale, 1))}.qz-note-create{grid-template-columns:minmax(0,1fr) auto;align-items:end}.qz-note-create .qz-error{grid-column:1 / -1}.qz-note-tree{display:grid;gap:3px;padding:0;list-style:none}.qz-note-tree .qz-note-tree{margin-inline-start:10px}.qz-note-tree :is(summary,button){width:100%;min-height:32px;padding:5px 7px;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--qz-text);text-align:start;overflow-wrap:anywhere;cursor:pointer}.qz-note-tree :is(summary,button){display:flex;align-items:center;gap:7px}.qz-note-tree summary{list-style:none}.qz-note-tree summary::-webkit-details-marker{display:none}.qz-note-tree-arrow{display:flex;flex:none;transform:rotate(-90deg)}.qz-note-tree details[open]>summary>.qz-note-tree-arrow{transform:none}.qz-note-tree-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.qz-note-tree :is(summary,button):hover{background:var(--qz-elevated)}.qz-note-tree button[aria-current=true]{border-color:color-mix(in srgb,var(--qz-accent) 26%,var(--qz-border));background:var(--qz-accent-soft)}.qz-note-toolbar{gap:8px}.qz-note-toolbar-file{display:flex;flex:1 1 18ch;align-items:center;gap:6px;min-width:0}.qz-note-toolbar-file .qz-path{min-width:0}.qz-note-toolbar .qz-note-pin-button{flex:none;padding-inline:8px}.qz-note-pin-button[aria-pressed=true]{color:var(--qz-accent);background:var(--qz-accent-soft)}.qz-note-column{width:100%;max-width:800px;margin-inline:auto;padding-inline:20px}.qz-note-column-narrow{max-width:620px}.qz-note-column-wide{max-width:1000px}.qz-note-column-full{max-width:none}.qz-note-text,.qz-note-block-text{resize:vertical;font:400 var(--qz-note-raw-size, 16px)/var(--qz-note-line-height, 1.55) var(--mono, ui-monospace, monospace)}.qz-app:has(.qz-notes-tab:not([hidden]) .qz-note-source),.qz-content:has(>.qz-notes-tab:not([hidden]) .qz-note-source),.qz-notes-tab:has(.qz-note-source),.qz-notes-view:has(.qz-note-source),.qz-note-editor:has(.qz-note-source),.qz-note-source{display:flex;flex:1;flex-direction:column}.qz-notes-layout:has(.qz-note-source){flex:1}.qz-note-editor:has(.qz-note-source){align-self:stretch}.qz-note-text{flex:1 0 auto;min-height:360px}.qz-note-message{font-size:calc(12px * var(--qz-scale, 1))}.qz-note-message:empty{display:none}.qz-note-save-status{white-space:nowrap}.qz-note-pin-button[aria-disabled=true]{opacity:.55;cursor:default}.qz-notes-rendered{min-width:0;min-height:360px;padding-block:14px 32px;font:400 var(--qz-note-text-size, 16px)/var(--qz-note-line-height, 1.55) var(--qz-note-font, var(--font-body, sans-serif));overflow-wrap:anywhere}.qz-notes-rendered :is(p,ul,ol,pre,blockquote,table,h1,h2,h3,h4,h5,h6){margin:0 0 .9em}.qz-notes-rendered :is(ul,ol){padding-inline-start:1.5em}.qz-notes-rendered :is(code,pre){font-family:var(--mono, ui-monospace, monospace);font-size:.9em}.qz-notes-rendered pre code{font-size:inherit}.qz-notes-rendered pre{overflow-x:auto;padding:10px;border:1px solid var(--qz-border);border-radius:6px;background:var(--qz-elevated)}.qz-notes-rendered blockquote{padding:6px 12px;border-inline-start:3px solid var(--qz-border)}.qz-notes-rendered blockquote>:last-child{margin-block-end:0}.qz-notes-rendered :not(pre)>code{padding:.1em .3em;border-radius:4px;background:var(--qz-elevated)}.qz-notes-rendered :is(.hljs-keyword,.hljs-selector-tag,.hljs-meta){color:color-mix(in srgb,var(--qz-accent) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-string,.hljs-regexp){color:color-mix(in srgb,var(--qz-ok) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-number,.hljs-literal,.hljs-variable){color:color-mix(in srgb,var(--qz-warning) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-title,.hljs-attr,.hljs-built_in,.hljs-attribute){color:color-mix(in srgb,var(--qz-info) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-comment,.hljs-quote){color:var(--qz-muted);font-style:italic}.qz-notes-rendered table{display:block;border-collapse:collapse;overflow-x:auto}.qz-notes-rendered :is(th,td){padding:5px 8px;border:1px solid var(--qz-border)}.qz-notes-rendered a{color:var(--qz-accent)}.qz-note-task{list-style:none}.qz-note-task-checkbox{accent-color:var(--qz-accent);margin-inline:0 .25em}.qz-note-task-completed>.qz-note-task-text,.qz-note-task-completed>p>.qz-note-task-text{color:var(--qz-muted);text-decoration:line-through}.qz-note-block{position:relative;display:flow-root}.qz-note-block-content{cursor:text}.qz-note-block .qz-note-edit-block{position:absolute;inset-block-start:0;inset-inline-end:-20px;min-height:24px;width:24px;padding:2px;color:var(--qz-muted);opacity:0}.qz-note-block:hover .qz-note-edit-block,.qz-note-edit-block:focus-visible{opacity:1}.qz-note-block-editor{display:grid;gap:6px;margin-block-end:.9em}.qz-note-block-editor .qz-actions{justify-content:end}.qz-block-hint{margin-inline-end:auto}.qz-wikilink{max-width:100%;padding:0;border:0;background:transparent;color:var(--qz-accent);font:inherit;text-align:start;text-decoration:underline;overflow-wrap:anywhere;cursor:pointer}.qz-note-backlinks{border-top:1px solid var(--qz-border);padding-top:12px}.qz-note-backlinks h3{margin:0 0 6px;font-size:calc(14px * var(--qz-scale, 1))}.qz-note-backlinks ul{display:grid;gap:4px;margin:0;padding-inline-start:1.25em}.qz-note-image{color:var(--qz-muted)}@container qz-app (max-width: 680px){.qz-notes-layout,.qz-note-create{grid-template-columns:minmax(0,1fr)}.qz-notes-layout:has(.qz-note-source){grid-template-rows:auto 1fr}.qz-note-browser{max-height:35vh}}", eu = '.qz-settings{display:grid;align-content:start;gap:20px;width:100%;max-width:1100px;min-width:0;margin-inline:auto;container:qz-settings / inline-size}.qz-settings .qz-settings-grid,.qz-settings-fields{display:grid;align-items:start;gap:20px}.qz-settings-fields{grid-template-columns:repeat(auto-fit,minmax(min(100%,245px),1fr))}.qz-settings-grid[data-empty]{align-items:start}.qz-settings-header{position:sticky;inset-block-start:0;z-index:2;padding-block:8px;background:var(--qz-canvas)}.qz-settings-header,.qz-settings-nav{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.qz-settings-header{justify-content:space-between}.qz-settings-saved{font-size:calc(13px * var(--qz-scale, 1))}.qz-settings-nav .qz-button[aria-current=true]{border-color:var(--qz-accent);background:var(--qz-accent-soft)}.qz-onboarding{display:grid;gap:8px;padding-inline-start:20px;margin-block:0}.qz-settings-panel{display:grid;gap:12px;padding:16px}.qz-settings-panel .qz-settings-heading{justify-content:space-between}.qz-settings-panel .qz-settings-heading .qz-button{min-height:32px}.qz-settings-color-field{display:grid;gap:8px;min-width:0;font-size:calc(13px * var(--qz-scale, 1))}.qz-settings-color-mode{display:flex;align-items:end;gap:6px;min-width:0}.qz-settings-color-mode .qz-field{flex:1}.qz-settings-color-field input[type=color]{flex:none;width:40px;padding:4px;cursor:pointer}.qz-color-swatches{display:flex;flex-wrap:wrap;gap:7px}.qz-color-swatches button{width:32px;height:32px;padding:0;border:1px solid var(--qz-border);border-radius:8px;cursor:pointer}.qz-color-swatches button[aria-pressed=true]{box-shadow:inset 0 0 0 2px #fff,inset 0 0 0 3px #000}.qz-settings-panel-preview{display:grid;gap:8px;min-width:0;padding:16px 20px;border:1px solid var(--qz-border);border-radius:8px;color:var(--qz-preview-text);background:var(--qz-preview-background);font-family:var(--qz-note-font, var(--font-body, sans-serif));font-size:var(--qz-note-text-size);line-height:var(--qz-note-line-height)}.qz-settings-panel-preview[data-preview-theme=light]{--qz-preview-background: #fff;--qz-preview-text: #20232a}.qz-settings-panel-preview[data-preview-theme=dark]{--qz-preview-background: #17191e;--qz-preview-text: #ececf0}.qz-settings-panel-preview>span{font-size:calc(13px * var(--qz-scale, 1))}@container qz-settings (min-width: 760px){.qz-settings .qz-settings-grid{grid-template-columns:minmax(0,1fr) minmax(260px,330px)}.qz-settings .qz-settings-grid[data-empty]{grid-template-columns:repeat(2,minmax(0,1fr))}}.qz-settings .qz-settings-folders,.qz-settings .qz-settings-add,.qz-settings .qz-settings-folder,.qz-settings .qz-settings-migration,.qz-settings .qz-settings-notice{display:grid;min-width:0;gap:12px}.qz-settings .qz-settings-add,.qz-settings .qz-settings-folder{padding:16px}.qz-settings .qz-settings-add p{margin-block-start:4px}.qz-settings .qz-settings-add .qz-input{width:100%}.qz-settings .qz-settings-add>.qz-button{justify-self:start}.qz-settings .qz-settings-heading,.qz-settings .qz-settings-folder-identity,.qz-settings .qz-settings-folder-controls,.qz-settings .qz-settings-actions,.qz-settings .qz-settings-check{display:flex;align-items:center}.qz-settings .qz-settings-heading,.qz-settings .qz-settings-folder-identity,.qz-settings .qz-settings-check{gap:10px}.qz-settings .qz-settings-heading h3,.qz-settings .qz-settings-add h3,.qz-settings .qz-settings-folder h4{margin:0;color:var(--qz-text);font-size:calc(15px * var(--qz-scale, 1));font-weight:650}.qz-settings .qz-settings-count{padding:1px 7px;border:1px solid var(--qz-border);border-radius:999px;color:var(--qz-muted);font-size:calc(12px * var(--qz-scale, 1));font-variant-numeric:tabular-nums}.qz-settings .qz-settings-folder-icon{display:grid;flex:none;width:36px;height:36px;place-items:center;border-radius:9px;background:var(--qz-accent-soft);color:var(--qz-accent)}.qz-settings .qz-settings-folder-identity>div{display:grid;min-width:0;gap:3px;overflow-wrap:anywhere}.qz-settings .qz-settings-folder-controls{justify-content:space-between;flex-wrap:wrap;gap:8px 12px;padding-block-start:10px;border-top:1px solid var(--qz-border)}.qz-settings .qz-settings-actions{flex-wrap:wrap;gap:4px}.qz-settings .qz-settings-check{min-height:32px;font-size:calc(13px * var(--qz-scale, 1));cursor:pointer}.qz-settings .qz-settings-check input{flex:none;accent-color:var(--qz-accent)}.qz-settings .qz-settings-toggle{display:inline-grid;align-items:center;justify-items:start;-webkit-appearance:none;-moz-appearance:none;appearance:none;width:34px;height:20px;padding:2px;margin:0;border:1px solid var(--qz-muted);border-radius:999px;background:var(--qz-elevated);cursor:inherit}.qz-settings .qz-settings-toggle:before{width:12px;height:12px;border-radius:50%;background:var(--qz-muted);content:""}.qz-settings .qz-settings-toggle:checked{justify-items:end;border-color:var(--qz-accent);background:var(--qz-accent-soft)}.qz-settings .qz-settings-toggle:checked:before{background:var(--qz-accent)}.qz-settings .qz-settings-toggle:disabled{opacity:.6;cursor:default}@media (forced-colors: active){.qz-settings .qz-settings-toggle{display:inline-block;-webkit-appearance:auto;-moz-appearance:auto;appearance:auto;width:16px;height:16px}}.qz-settings .qz-settings-migration,.qz-settings .qz-settings-result{padding:12px;border:1px solid var(--qz-border);border-radius:9px;background:var(--qz-canvas);font-size:calc(13px * var(--qz-scale, 1))}.qz-settings .qz-settings-migration{gap:6px}.qz-settings .qz-settings-notice{gap:8px;overflow-wrap:anywhere}.qz-settings .qz-settings-migration-files{max-height:200px;margin:0;padding-inline-start:20px;overflow-y:auto;list-style:disc}.qz-settings .qz-button[data-destructive]{color:var(--qz-danger)}.qz-settings-disclosure{border-top:1px solid var(--qz-border);font-size:calc(13px * var(--qz-scale, 1))}.qz-settings-disclosure>summary{padding-block:8px;font-weight:650;cursor:pointer}.qz-column-list{display:grid;gap:8px;padding:0;list-style:none}.qz-column-row{display:flex;flex-wrap:wrap;align-items:end;gap:6px 10px}.qz-column-row .qz-field{flex:1 1 140px}.qz-column-row .qz-field>span{overflow-wrap:anywhere}.qz-column-row .qz-input,.qz-agent-prompt{width:100%}.qz-column-row .qz-settings-actions{align-items:end}.qz-column-row>.qz-stack{flex:1 1 160px;gap:4px}.qz-settings-board-folder h4{margin-block:0 6px}', Pe = [
  { id: "tasks", label: "Tasks", icon: "board" },
  { id: "todos", label: "TODOs", icon: "checklist" },
  { id: "notes", label: "Notes", icon: "note" },
  { id: "settings", label: "Settings", icon: "settings" }
], va = { small: "14px", medium: "16px", large: "19px" }, tu = { compact: 1.45, normal: 1.65, relaxed: 1.9 };
function su() {
  const e = Ur(), { preferences: t, status: n, ready: a, update: r } = Xc(e), [i, o] = F(null), [s, l] = F(null), [u, p] = F(null), [h, f] = F(null), [m, d] = F(null), [w, k] = F(0), z = ne(null);
  ie(() => {
    let R = !1, B = !1, W;
    const P = async () => {
      if (!(R || B)) {
        B = !0, clearTimeout(W);
        try {
          const ee = await ze(_a(e));
          R || d(ee);
        } catch {
          R || (W = setTimeout(() => void P(), 3e3));
        } finally {
          B = !1;
        }
      }
    };
    return P(), window.addEventListener("focus", P), () => {
      R = !0, clearTimeout(W), window.removeEventListener("focus", P);
    };
  }, [e, w]);
  const _ = i ?? (t.startOn === "last" ? t.lastTab : t.startOn), y = (m == null ? void 0 : m.filter((R) => R.companion)) ?? [], C = y.find((R) => R.id === t.workspaceId) ?? y[0], v = _ === "notes" && u ? y.find((R) => R.id === u.workspaceId) ?? C : C, b = v ? t.folderAppearance[v.id] : void 0, T = (v == null ? void 0 : v.id) ?? null, D = t.appearance, L = {
    "--qz-accent-override": He(t.accent),
    "--qz-accent-foreground": vi(t.accent),
    "--qz-note-heading-color": He(D.headingColor),
    "--qz-note-line-color": He(D.lineColor),
    "--qz-note-text-size": va[t.noteTextSize],
    "--qz-note-raw-size": va[t.rawTextSize],
    "--qz-note-line-height": tu[t.noteLineHeight],
    "--qz-note-font": t.noteFont === "mono" ? "var(--mono, ui-monospace, monospace)" : void 0
  }, J = (R) => {
    o(R), R !== "notes" && (p(null), f(null)), r({ lastTab: R });
  }, Z = (R) => {
    var B, W;
    return (W = (B = z.current) == null ? void 0 : B.querySelector(`#qz-tab-${R}`)) == null ? void 0 : W.focus();
  }, $ = (R) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(R.key)) return;
    R.preventDefault();
    const B = Pe.findIndex((P) => P.id === _), W = R.key === "Home" ? Pe[0] : R.key === "End" ? Pe[Pe.length - 1] : Pe[(B + (R.key === "ArrowRight" ? 1 : Pe.length - 1)) % Pe.length];
    J(W.id), Z(W.id);
  }, j = (R) => {
    l(R), J("settings"), Z("settings");
  }, V = (R) => {
    (_ === "tasks" || _ === "todos") && f({ tab: _, workspaceId: t.workspaceId }), p(R), J("notes"), Z("notes");
  }, te = () => {
    h && (r({ workspaceId: h.workspaceId }), J(h.tab), Z(h.tab));
  }, N = (R) => {
    p(null), r({ workspaceId: R });
  }, I = () => j("folders");
  return /* @__PURE__ */ g(
    "div",
    {
      className: "qz-app",
      "data-note-heading-lines": D.headingLines,
      style: L,
      "data-contrast": t.highContrast ? "high" : void 0,
      "data-motion": t.motion,
      "data-interface-text": t.largerInterfaceText ? "large" : void 0,
      "data-accent": t.accent !== "theme" ? "custom" : void 0,
      children: [
        /* @__PURE__ */ c("style", { children: Yc }),
        /* @__PURE__ */ c("style", { children: Vc }),
        /* @__PURE__ */ c("style", { children: Qc }),
        /* @__PURE__ */ c("style", { children: eu }),
        /* @__PURE__ */ g("header", { className: "qz-header", children: [
          /* @__PURE__ */ g("div", { className: "qz-brand", children: [
            /* @__PURE__ */ c("span", { className: "qz-mark", children: /* @__PURE__ */ c(Y, { name: "gem" }) }),
            /* @__PURE__ */ c("h1", { children: "Quartizo" })
          ] }),
          /* @__PURE__ */ c("div", { className: "qz-tabs", ref: z, role: "tablist", "aria-label": "Quartizo", onKeyDown: $, children: Pe.map((R) => /* @__PURE__ */ g(
            "button",
            {
              id: `qz-tab-${R.id}`,
              type: "button",
              role: "tab",
              "aria-selected": _ === R.id,
              "aria-controls": "qz-panel",
              tabIndex: _ === R.id ? 0 : -1,
              onClick: () => J(R.id),
              children: [
                /* @__PURE__ */ c(Y, { name: R.icon }),
                R.label
              ]
            },
            R.id
          )) }),
          (_ !== "settings" || s === "board") && /* @__PURE__ */ g("label", { className: "qz-workspace qz-inline-field", children: [
            (b == null ? void 0 : b.color) && b.color !== "theme" && /* @__PURE__ */ c(
              "span",
              {
                "aria-hidden": "true",
                className: "qz-folder-dot",
                style: { backgroundColor: He(b.color) }
              }
            ),
            /* @__PURE__ */ c("span", { children: "Workspace" }),
            /* @__PURE__ */ g(
              "select",
              {
                className: "qz-input",
                value: T ?? "",
                disabled: !y.length || !a,
                onChange: (R) => N(Number(R.currentTarget.value)),
                children: [
                  !v && /* @__PURE__ */ c("option", { value: "", children: m === null ? "Loading folders…" : "No folders connected" }),
                  y.map((R) => {
                    var W;
                    const B = (W = t.folderAppearance[R.id]) == null ? void 0 : W.emoji;
                    return /* @__PURE__ */ c("option", { value: R.id, children: B ? `${B} ${R.name}` : R.name }, R.id);
                  })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ g("div", { className: "qz-content", id: "qz-panel", role: "tabpanel", "aria-labelledby": `qz-tab-${_}`, children: [
          n === "unavailable" && /* @__PURE__ */ c("p", { className: "qz-notice qz-preference-notice", role: "status", children: "Quartizo can’t save preferences. Changes are kept until you close or reload this page." }),
          /* @__PURE__ */ g(pe, { children: [
            /* @__PURE__ */ c("div", { hidden: _ !== "tasks", children: /* @__PURE__ */ c(
              wi,
              {
                api: e,
                active: _ === "tasks",
                workspaceId: (C == null ? void 0 : C.id) ?? null,
                preferences: t,
                onPreferencesChange: r,
                onSettings: I,
                onBoardSettings: () => j("board"),
                onOpenNote: V
              }
            ) }),
            /* @__PURE__ */ c("div", { hidden: _ !== "todos", children: /* @__PURE__ */ c(
              Si,
              {
                api: e,
                active: _ === "todos",
                workspaceId: (C == null ? void 0 : C.id) ?? null,
                preferences: t,
                onPreferencesChange: r,
                onSettings: I,
                onOpenNote: V
              }
            ) }),
            /* @__PURE__ */ g("div", { className: "qz-notes-tab", hidden: _ !== "notes", children: [
              h && /* @__PURE__ */ g("button", { className: "qz-button qz-return", type: "button", "data-variant": "quiet", onClick: te, children: [
                /* @__PURE__ */ c(Y, { name: "back" }),
                h.tab === "tasks" ? "Back to board" : "Back to TODOs"
              ] }),
              /* @__PURE__ */ c(
                Mc,
                {
                  api: e,
                  active: _ === "notes",
                  workspaceId: T,
                  request: u,
                  preferences: t,
                  onPreferencesChange: r,
                  onSettings: I
                }
              )
            ] }),
            _ === "settings" && /* @__PURE__ */ c(
              Uc,
              {
                api: e,
                preferences: t,
                onPreferencesChange: r,
                status: n,
                section: s,
                onSectionChange: l,
                workspaceId: T,
                onWorkspaceChange: N,
                onWorkspacesChanged: () => k((R) => R + 1)
              }
            )
          ] })
        ] })
      ]
    }
  );
}
export {
  su as default
};
