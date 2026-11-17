import { jsx as c, jsxs as g, Fragment as ke } from "react/jsx-runtime";
import { useNavigate as va, useChatLauncher as Lr, useAppApi as $r } from "@kirocrew/app-sdk";
import { useState as F, useEffect as oe, useRef as ae, useMemo as Te, useCallback as Qe, useDeferredValue as jr, useLayoutEffect as ka, useId as Ur } from "react";
import { SegmentedControl as Pr } from "@kirocrew/app-sdk/ui";
const Ue = "/apps/quartizo/api", Jr = 15e3, za = { id: "repair", label: "Needs repair" };
function ye(e) {
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
function ze(e, t = Jr) {
  let n;
  const a = new Promise((r, i) => {
    n = setTimeout(() => i(new Error(`request timed out after ${Math.round(t / 1e3)} s`)), t);
  });
  return Promise.race([e, a]).finally(() => clearTimeout(n));
}
function ln(e) {
  const t = Object.entries(e).filter((n) => n[1] !== void 0 && n[1] !== "").map(([n, a]) => `${encodeURIComponent(n)}=${encodeURIComponent(a)}`);
  return t.length ? `?${t.join("&")}` : "";
}
async function xa(e) {
  return (await e.get(`${Ue}/workspaces`)).workspaces;
}
async function Wr(e, t, n) {
  return (await e.post(`${Ue}/workspaces`, n ? { path: t, name: n, companion: !0 } : { path: t, companion: !0 })).workspace;
}
async function Hr(e, t, n, a) {
  return (await e.put(xe(t, "columns"), { columns: n, columnsVersion: a })).workspace;
}
async function Zr(e, t, n = !1) {
  await e.del(`${Ue}/workspaces/${t}${n ? "?deleteOldTasks=1" : ""}`);
}
const cn = `${Ue}/companion`;
function Dt(e) {
  return e.get(cn);
}
function Kr(e, t, n) {
  return e.put(`${Ue}/workspaces/${t}/companion`, { enabled: n });
}
function un(e, t = {}) {
  const n = {};
  return t.workspaceId !== void 0 && (n.workspaceId = t.workspaceId), t.rebuild && (n.rebuild = !0), t.manual && (n.manual = !0), e.post(`${cn}/refresh`, n);
}
function Gr(e, t) {
  return e.get(`${Ue}/workspaces/${t}/board`);
}
function Xr(e, t, n) {
  return e.get(`${cn}/todos${ln({ workspace: n === void 0 ? void 0 : String(n), state: t })}`);
}
function Yr(e, t) {
  const n = [], a = new Map(e.map((r) => [r.id, []]));
  a.set(za.id, n);
  for (const r of t) (a.get(r.lane) ?? n).push(r);
  return Object.fromEntries(a);
}
function dn(e) {
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
function Vr(e, t = Date.now()) {
  if (!e) return "";
  if (e.state === "scanning") {
    if (!e.progress) return "Scan queued…";
    const { notes: a, rebuild: r } = e.progress;
    return `Scanning… ${a} ${a === 1 ? "note" : "notes"} read${r ? " (rebuild)" : ""}`;
  }
  if (!e.indexedAt) return "";
  const n = e.files ?? 0;
  return `${n} ${n === 1 ? "note" : "notes"} indexed ${Qr(e.indexedAt, t)}`;
}
function Qr(e, t) {
  const n = Math.max(0, Math.round((t - e) / 1e3));
  if (n < 5) return "just now";
  if (n < 60) return `${n} s ago`;
  const a = Math.round(n / 60);
  return a < 60 ? `${a} min ago` : new Date(e).toLocaleString();
}
function ei(e, t) {
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
function xe(e, t) {
  return `${Ue}/workspaces/${e}/${t}`;
}
function Vt(e, t, n) {
  return e.get(xe(t, "source") + ln({ path: n }));
}
function ti(e, t) {
  return e.get(xe(t, "notes"));
}
function ni(e, t, n) {
  return e.get(xe(t, "backlinks") + ln({ path: n }));
}
function ai(e, t, n) {
  return e.post(xe(t, "notes"), { path: n });
}
function ri(e, t, n, a, r) {
  return e.put(xe(t, "source"), { path: n, content: a, expectedHash: r });
}
function ii(e, t, n) {
  return e.post(xe(t, "tickets"), n);
}
function si(e, t, n, a) {
  return e.post(xe(t, "tickets/promote"), { path: n.path, expectedHash: n.hash, ...a === void 0 ? {} : { status: a } });
}
function oi(e, t, n) {
  return e.post(xe(t, "tickets/move"), n);
}
function li(e, t, n, a) {
  return e.post(xe(t.workspaceId, "todos/toggle"), {
    path: t.path,
    expectedHash: t.hash,
    markerStart: n.markerStart,
    line: n.line,
    column: n.column,
    checked: a
  });
}
function ci(e, t, n, a = !1) {
  return e.post(xe(t, "tickets/rebalance"), { status: n, confirm: !0, reconcile: a });
}
function Be(e, t) {
  var n, a;
  return e != null && e.writeBlocked ? e.writeBlocked.message : e != null && e.migrationPending ? "Finish the old task migration in Settings before editing this workspace." : !e || e.state !== "ready" || e.complete !== !0 || e.retained || e.outdated || e.error ? "Wait for a complete, current index before editing. Refresh if needed." : t != null && t.status && ((n = e.maintenance) != null && n.includes(t.status)) ? "This column has unfinished order maintenance. Resume maintenance before moving cards." : t && (!t.hash || t.retained || (a = t.diagnostics) != null && a.some((r) => r.code !== "unconfigured_status")) ? "Repair or refresh this note before editing it." : null;
}
function ui(e, t, n, a) {
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
function di(e, t) {
  return e.get(xe(t, "migration"));
}
function hi(e, t, n, a = !1) {
  return e.post(xe(t, "migration"), { planHash: n, confirm: !0, ...a ? { acceptCurrent: !0 } : {} });
}
function pi(e, t) {
  return e.get(xe(t, "legacy-tasks"));
}
function fi(e, t, n) {
  return e.post(xe(t, "tickets/demote"), { path: n.path, expectedHash: n.hash });
}
const _a = "/md-notebook";
function gi(e) {
  return (e.split("/").pop() ?? e).replace(/\.md$/i, "");
}
const wa = {
  headingColor: "theme",
  headingLines: "theme",
  lineColor: "theme"
};
function Xe(e) {
  return e === "accent" ? "accent" : typeof e == "string" && /^#[\da-f]{6}$/i.test(e) ? e : "theme";
}
function ya(e) {
  return e === "all" || e === "none" ? e : "theme";
}
function He(e) {
  if (e !== "theme")
    return e === "accent" ? "var(--qz-accent)" : e;
}
function Bt(e) {
  const t = e / 255;
  return t <= 0.04045 ? t / 12.92 : ((t + 0.055) / 1.055) ** 2.4;
}
function Qt(e, t, n) {
  return 0.2126 * Bt(e) + 0.7152 * Bt(t) + 0.0722 * Bt(n);
}
function mi(e) {
  if (!e.startsWith("#")) return;
  const t = parseInt(e.slice(1, 3), 16), n = parseInt(e.slice(3, 5), 16), a = parseInt(e.slice(5, 7), 16);
  return Qt(t, n, a) >= Math.sqrt(1.05 * 0.05) - 0.05 ? "#000" : "#fff";
}
const bi = {
  gem: /* @__PURE__ */ c("path", { d: "M8 4h8l4.5 5L12 21 3.5 9 8 4Zm-4.5 5h17M8 4l1 5 3 12 3-12 1-5" }),
  board: /* @__PURE__ */ g(ke, { children: [
    /* @__PURE__ */ c("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }),
    /* @__PURE__ */ c("path", { d: "M9 4v16m6-16v16M6 8h.1M12 8h.1m6 0h.1" })
  ] }),
  checklist: /* @__PURE__ */ c("path", { d: "m3 6 2 2 3-4m3 3h10M3 13l2 2 3-4m3 3h10M3 20h5m3 0h10" }),
  settings: /* @__PURE__ */ g(ke, { children: [
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
  more: /* @__PURE__ */ g(ke, { children: [
    /* @__PURE__ */ c("circle", { cx: "5", cy: "12", r: "1" }),
    /* @__PURE__ */ c("circle", { cx: "12", cy: "12", r: "1" }),
    /* @__PURE__ */ c("circle", { cx: "19", cy: "12", r: "1" })
  ] }),
  copy: /* @__PURE__ */ g(ke, { children: [
    /* @__PURE__ */ c("rect", { x: "8", y: "8", width: "12", height: "12", rx: "2" }),
    /* @__PURE__ */ c("path", { d: "M16 4H6a2 2 0 0 0-2 2v10" })
  ] }),
  search: /* @__PURE__ */ g(ke, { children: [
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
function Q({ name: e }) {
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
      children: bi[e]
    }
  );
}
function fe({ failure: e }) {
  return e ? /* @__PURE__ */ c("div", { role: "alert", className: "qz-notice qz-error", "data-code": e.code, children: e.message }) : null;
}
function xn(e) {
  return e instanceof Element && !!e.closest('[role="alertdialog"]');
}
function ct({ label: e, onCancel: t, className: n = "qz-notice qz-stack", children: a }) {
  const r = ae(null), i = ae(t);
  return i.current = t, oe(() => {
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
function qa() {
  try {
    return window.localStorage;
  } catch {
    return;
  }
}
function Ra() {
  const [e, t] = F(() => typeof document > "u" || document.visibilityState !== "hidden");
  return oe(() => {
    const n = () => t(document.visibilityState !== "hidden");
    return document.addEventListener("visibilitychange", n), () => document.removeEventListener("visibilitychange", n);
  }, []), e;
}
const vi = 1500, ki = 3e3;
function Ea(e, t, n) {
  const [a, r] = F(null), [i, o] = F(null);
  return oe(() => {
    if (!t) return;
    let s = !1;
    return Dt(e).then((l) => {
      s || (r(l.workspaces.filter((u) => u.workspace.companion)), o(l.available ? null : { message: l.error ?? "The Markdown index is unavailable." }));
    }).catch((l) => !s && o(ye(l))), () => {
      s = !0;
    };
  }, [e, t, n]), { companions: a, failure: i };
}
function Ca(e, t, n, a, r, i, o) {
  const s = Ra(), [l, u] = F(null), p = (l == null ? void 0 : l.key) === n ? l.data : null, [h, f] = F(null), [m, d] = F(0), [w, z] = F(!1), k = ae(r), x = ae(i), y = ae(o);
  k.current = r, x.current = i, y.current = o, oe(() => {
    u(null), f(null);
  }, [n]), oe(() => {
    if (!t || !s) return;
    let b = !1, T, A, L;
    const j = async () => {
      let H = !1;
      try {
        const M = await ze(Dt(e));
        if (b) return;
        if (!M.available) throw new Error(M.error ?? "The Markdown index is unavailable.");
        const Z = M.workspaces.filter(({ workspace: q }) => q.companion), Y = Z.filter(({ workspace: q }) => a === void 0 || q.id === a), re = Object.fromEntries(Y.map(({ workspace: q, index: $ }) => [q.id, $]));
        H = Y.some(({ index: q }) => q.state === "scanning");
        const C = JSON.stringify(Z.map(({ workspace: q, index: $ }) => [q.id, q.columnsVersion, $.indexedAt])), I = JSON.stringify(re);
        if (A !== C) {
          const q = await ze(k.current());
          if (b) return;
          u({ key: n, data: q }), A = C, L = void 0;
        } else if (L !== I) {
          const q = y.current;
          u(($) => ($ == null ? void 0 : $.key) === n ? { key: n, data: q($.data, re) } : $), L = I;
        }
        f(null), z(!1);
      } catch (M) {
        b || (f(ye(M)), z(!1));
      }
      b || (T = setTimeout(j, H ? vi : ki));
    };
    return j(), () => {
      b = !0, clearTimeout(T);
    };
  }, [t, e, s, n, m, a]);
  const E = Qe(async () => {
    z(!0);
    try {
      await ze(x.current()), f(null), d((b) => b + 1);
    } catch (b) {
      f(ye(b));
    } finally {
      z(!1);
    }
  }, []), v = Qe(() => {
    z(!0), d((b) => b + 1);
  }, []);
  return { data: p, failure: h, busy: w, refresh: E, reload: v };
}
function Aa({ statuses: e }) {
  const t = Date.now(), n = e.map((a) => Vr(a, t)).filter(Boolean);
  return /* @__PURE__ */ c("span", { className: "qz-index", role: "status", children: n.length > 0 && /* @__PURE__ */ g(ke, { children: [
    /* @__PURE__ */ c("span", { className: "qz-dot", "data-attention": e.some((a) => a.state === "scanning" || !!dn(a)) }),
    n.join(" · ")
  ] }) });
}
function Na({ statuses: e }) {
  const t = new Set(e.map(dn).filter(Boolean));
  return /* @__PURE__ */ c(ke, { children: [...t].map((n) => /* @__PURE__ */ c("div", { role: "note", className: "qz-notice", children: n }, n)) });
}
function Da({ path: e, compact: t = !1 }) {
  const n = gi(e), [a, r] = F("idle");
  oe(() => {
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
  return /* @__PURE__ */ g(ke, { children: [
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
          /* @__PURE__ */ c(Q, { name: a === "copied" ? "check" : "copy" }),
          (!t || a !== "idle") && (a === "copied" ? "Copied" : a === "failed" ? "Copy failed" : "Copy name")
        ]
      }
    ),
    /* @__PURE__ */ c("span", { className: "qz-visually-hidden", role: "status", children: a === "copied" ? "Note name copied." : a === "failed" ? "Could not copy note name." : "" })
  ] });
}
function Sa({ onSettings: e }) {
  return /* @__PURE__ */ g("div", { className: "qz-empty", children: [
    /* @__PURE__ */ c("span", { className: "qz-empty-icon", children: /* @__PURE__ */ c(Q, { name: "folder" }) }),
    /* @__PURE__ */ c("h2", { children: "Get started with Quartizo" }),
    /* @__PURE__ */ g("ol", { className: "qz-start-checklist", children: [
      /* @__PURE__ */ c("li", { children: "Add a folder of Markdown files in Settings." }),
      /* @__PURE__ */ c("li", { children: "Create a note in Notes." }),
      /* @__PURE__ */ c("li", { children: "Create a ticket or turn your note into one in Tasks." })
    ] }),
    /* @__PURE__ */ c("button", { type: "button", className: "qz-button", "data-variant": "primary", onClick: e, children: "Open Settings" })
  ] });
}
function zi(e) {
  var i;
  const t = e.active ?? !0, { companions: n, failure: a } = Ea(e.api, t, e.workspaceId), r = (i = n == null ? void 0 : n.find((o) => o.workspace.id === e.workspaceId)) == null ? void 0 : i.workspace;
  return a && !n ? /* @__PURE__ */ c(fe, { failure: a }) : n ? /* @__PURE__ */ g("div", { className: "qz-stack", children: [
    /* @__PURE__ */ c(fe, { failure: a }),
    /* @__PURE__ */ c("div", { className: "qz-view-heading", children: /* @__PURE__ */ g("div", { children: [
      /* @__PURE__ */ c("h2", { className: "qz-section-title", children: "Task board" }),
      /* @__PURE__ */ c("p", { className: "qz-section-description", children: "Plan and track tickets stored in your notes." })
    ] }) }),
    n.length === 0 && /* @__PURE__ */ c(Sa, { onSettings: e.onSettings }),
    n.length > 0 && !r && !a && /* @__PURE__ */ c("p", { className: "qz-empty", role: "status", children: "Loading the selected folder…" }),
    n.map(({ workspace: o }) => /* @__PURE__ */ c("div", { hidden: o.id !== (r == null ? void 0 : r.id), children: /* @__PURE__ */ c(
      yi,
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
  ] }) : /* @__PURE__ */ c("p", { className: "qz-empty", role: "status", children: "Loading folders…" });
}
const xi = [
  ["progress", "Checklist progress"],
  ["path", "Note path"],
  ["badges", "Ticket badges"]
];
function Ta({ preferences: e, onPreferencesChange: t, workspace: n }) {
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
      xi.map(([a, r]) => /* @__PURE__ */ g("label", { className: "qz-check-label", children: [
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
function hn(e) {
  const [t, n] = F(!1), [a, r] = F(null), i = ae(!0), o = ae(!1);
  return oe(() => (i.current = !0, () => {
    i.current = !1;
  }), []), { pending: t, failure: a, run: async (l) => {
    if (o.current) return !1;
    o.current = !0, n(!0), r(null);
    try {
      return await ze(l()), i.current && e(), !0;
    } catch (u) {
      if (i.current) {
        const p = ye(u);
        p.status === 409 && (p.message += " Refresh to review the current file, then retry your change."), (p.message.includes("timed out") || !p.status) && (p.message += " The result may be unknown; refresh and check the file before retrying."), r(p);
      }
      return !1;
    } finally {
      o.current = !1, i.current && n(!1);
    }
  } };
}
const _i = new Intl.Collator(void 0, { numeric: !0, sensitivity: "base" });
function wi(e) {
  return e ? { "--qz-status": e } : void 0;
}
function Fa({ name: e, appearance: t }) {
  const n = t && He(t.color);
  return /* @__PURE__ */ g("span", { className: "qz-folder-label", style: n ? { "--qz-folder-label-color": n } : void 0, children: [
    n && /* @__PURE__ */ c("span", { className: "qz-folder-label-dot", "aria-hidden": "true" }),
    (t == null ? void 0 : t.emoji) && /* @__PURE__ */ c("span", { "aria-hidden": "true", children: t.emoji }),
    e
  ] });
}
function yi(e) {
  var Ce, ge, W, Ae, le, ee;
  const { api: t, workspace: n, active: a, preferences: r } = e, i = n.id, o = va(), { data: s, failure: l, busy: u, refresh: p, reload: h } = Ca(
    t,
    a,
    String(i),
    i,
    () => Gr(t, i),
    () => un(t, { workspaceId: i, manual: !0 }),
    (N, X) => ({ ...N, index: X[String(i)] ?? N.index })
  ), f = hn(h), m = (s == null ? void 0 : s.workspace.columns) ?? n.columns, { laneSort: d, hideEmptyLanes: w } = r, z = Te(() => {
    const N = Yr(m, (s == null ? void 0 : s.tickets) ?? []);
    for (const X of m)
      d[`${i}:${X.id}`] === "title" && N[X.id].sort((ne, O) => _i.compare(ne.title, O.title));
    return N;
  }, [m, s, d, i]), [k, x] = F(!1), [y, E] = F(!1);
  oe(() => {
    E(!1);
  }, [w]);
  const v = m.filter((N) => z[N.id].length === 0).length, b = [
    ...m.filter((N) => !w || y || z[N.id].length > 0),
    ...z.repair.length > 0 ? [za] : []
  ], T = ae(null), A = ae(null), [L, j] = F(null), [H, M] = F(null), [Z, Y] = F(null), re = ae(null);
  oe(() => {
    var N;
    Z && ((N = re.current) == null || N.focus());
  }, [Z]);
  const [C, I] = F(!1), q = !a || !!l || u || f.pending || C || !!Be(s == null ? void 0 : s.index), [$, U] = F(""), K = ((Ce = m.find((N) => N.id === $)) == null ? void 0 : Ce.id) ?? ((ge = s == null ? void 0 : s.index.maintenance) == null ? void 0 : ge[0]) ?? m[0].id, [S, J] = F(!1), [ie, he] = F(!1), [V, _e] = F(!1), qe = s ? [s.index] : [], Ie = Qe((N) => {
    U(N), _e(!0);
  }, []), [be, ve] = F(null);
  oe(() => {
    var X;
    if (!be || q || !s) return;
    const N = Array.from(((X = T.current) == null ? void 0 : X.querySelectorAll("[data-note-path]")) ?? []).find((ne) => ne.dataset.notePath === be);
    N == null || N.focus(), ve(null);
  }, [be, q, s]);
  const Ee = (N, X, ne) => {
    var _;
    if (q || Be(s == null ? void 0 : s.index, N) || !s || (_ = s.index.maintenance) != null && _.includes(X)) return;
    const O = d[`${i}:${X}`] === "title";
    O && N.lane === X || f.run(() => oi(t, i, ui(s.tickets, N, X, O ? void 0 : ne))).then((R) => {
      R && ve(N.path);
    });
  }, G = (N, X) => {
    var _;
    const ne = A.current;
    if (q || !ne || X === "repair" || ne.lane === X && d[`${i}:${X}`] === "title") return;
    N.preventDefault(), N.stopPropagation();
    const O = ((_ = N.target.closest("li[data-ticket-path]")) == null ? void 0 : _.getAttribute("data-ticket-path")) ?? void 0;
    j((R) => (R == null ? void 0 : R.lane) === X && R.before === O ? R : { lane: X, before: O });
  }, pe = (N, X, ne) => {
    N.preventDefault(), N.stopPropagation();
    const O = A.current;
    if (A.current = null, j(null), !O || (ne == null ? void 0 : ne.path) === O.path) return;
    const _ = ne && d[`${i}:${X}`] !== "title" ? z[X].filter((R) => R.path !== O.path).findIndex((R) => R.path === ne.path) : void 0;
    _ !== void 0 && _ < 0 || Ee(O, X, _);
  }, te = (N) => {
    var P, se;
    const X = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"], ne = N.target;
    if (!ne.hasAttribute("data-lane")) return;
    const O = Number(ne.dataset.lane), _ = Number(ne.dataset.index);
    if (!X.includes(N.key) || Number.isNaN(O) || Number.isNaN(_)) return;
    let R = O, D = _;
    if (N.key === "ArrowUp" && (D = Math.max(0, _ - 1)), N.key === "ArrowDown" && (D = _ + 1), N.key === "Home" && (D = 0), N.key === "End" && (D = Number.MAX_SAFE_INTEGER), N.key === "ArrowLeft" || N.key === "ArrowRight") {
      const ue = N.key === "ArrowLeft" ? -1 : 1;
      do
        R += ue;
      while (R >= 0 && R < b.length && z[b[R].id].length === 0);
      if (R < 0 || R >= b.length) return;
    }
    D = Math.min(D, z[b[R].id].length - 1), N.preventDefault(), (se = (P = T.current) == null ? void 0 : P.querySelector(`[data-lane="${R}"][data-index="${D}"]`)) == null || se.focus();
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
            "aria-expanded": Z === "create",
            onClick: () => Y(Z === "create" ? null : "create"),
            disabled: f.pending || C,
            children: [
              /* @__PURE__ */ c(Q, { name: "plus" }),
              "New ticket"
            ]
          }
        ),
        /* @__PURE__ */ g(
          "button",
          {
            type: "button",
            className: "qz-button",
            "aria-expanded": Z === "promote",
            onClick: () => Y(Z === "promote" ? null : "promote"),
            disabled: f.pending || C,
            children: [
              /* @__PURE__ */ c(Q, { name: "note" }),
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
            "aria-expanded": k,
            "aria-controls": `qz-board-view-${i}`,
            onClick: () => x((N) => !N),
            children: [
              /* @__PURE__ */ c(Q, { name: "settings" }),
              "View"
            ]
          }
        ),
        /* @__PURE__ */ c("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: e.onSettings, children: "Customize columns" }),
        /* @__PURE__ */ c(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            "aria-expanded": V,
            onClick: () => _e((N) => !N),
            disabled: q,
            children: "Rebalance…"
          }
        ),
        /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => o(_a), children: [
          /* @__PURE__ */ c(Q, { name: "external" }),
          "Open Kiro Notes"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ c("section", { id: `qz-board-view-${i}`, className: "qz-panel-surface qz-board-view-panel", "aria-label": "Board view settings", hidden: !k, children: /* @__PURE__ */ c(Ta, { preferences: r, onPreferencesChange: e.onPreferencesChange, workspace: (s == null ? void 0 : s.workspace) ?? n }) }),
    ["create", "promote"].map((N) => /* @__PURE__ */ c("div", { hidden: Z !== N, children: /* @__PURE__ */ c(qi, { mode: N, api: t, workspace: n, columns: m, firstField: Z === N ? re : void 0, disabled: !a || !!l || u || f.pending || !!Be(s == null ? void 0 : s.index), maintenance: (s == null ? void 0 : s.index.maintenance) ?? [], onBusy: I, onChanged: h, onClose: () => Y(null), onMaintenanceNeeded: Ie }) }, N)),
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
            onClick: () => E((N) => !N),
            children: y ? "Hide empty columns" : `Show empty columns (${v})`
          }
        ),
        /* @__PURE__ */ c(Aa, { statuses: qe }),
        /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => void p(), disabled: u || f.pending, children: [
          /* @__PURE__ */ c(Q, { name: "refresh" }),
          "Refresh"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ c(Na, { statuses: qe }),
    /* @__PURE__ */ c(fe, { failure: l }),
    /* @__PURE__ */ c(fe, { failure: f.failure }),
    Be(s == null ? void 0 : s.index) && s && /* @__PURE__ */ c("div", { role: "note", className: "qz-notice", children: Be(s.index) }),
    V || ((W = f.failure) == null ? void 0 : W.code) === "rank_exhausted" || ((Ae = f.failure) == null ? void 0 : Ae.code) === "maintenance_pending" || (le = s == null ? void 0 : s.index.maintenance) != null && le.length ? /* @__PURE__ */ g("div", { className: "qz-notice qz-stack", children: [
      /* @__PURE__ */ c("p", { children: "Rebalance a column to restore space between card positions. Progress is saved if interrupted." }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ c("select", { className: "qz-input", "aria-label": "Column to rebalance", value: K, onChange: (N) => U(N.target.value), children: m.map((N) => /* @__PURE__ */ c("option", { value: N.id, children: N.label }, N.id)) }),
        /* @__PURE__ */ c("button", { type: "button", className: "qz-button", onClick: () => J(!0), disabled: !a || f.pending || !!(s != null && s.index.writeBlocked), children: "Review column…" })
      ] }),
      S && /* @__PURE__ */ g(ct, { label: "Rebalance column", className: "qz-stack", onCancel: () => J(!1), children: [
        /* @__PURE__ */ c("p", { children: "Update ordering in each note of this column? Other editors may see progress before all files finish." }),
        !!((ee = s == null ? void 0 : s.index.maintenance) != null && ee.includes(K)) && /* @__PURE__ */ g("label", { className: "qz-check-label", children: [
          /* @__PURE__ */ c("input", { type: "checkbox", checked: ie, onChange: (N) => he(N.target.checked), disabled: f.pending }),
          "Keep the latest note contents and resume ordering after an external edit"
        ] }),
        /* @__PURE__ */ g("div", { className: "qz-actions", children: [
          /* @__PURE__ */ c("button", { type: "button", className: "qz-button", disabled: !a || f.pending || !!(s != null && s.index.writeBlocked), onClick: () => void f.run(() => ci(t, i, K, ie)).then((N) => {
            N && (J(!1), he(!1));
          }), children: "Rebalance column" }),
          /* @__PURE__ */ c("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: f.pending, onClick: () => J(!1), children: "Cancel" })
        ] })
      ] })
    ] }) : null,
    H && /* @__PURE__ */ g(ct, { label: "Remove ticket", className: "qz-notice qz-stack", onCancel: () => M(null), children: [
      /* @__PURE__ */ g("p", { children: [
        "Remove “",
        H.title,
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
              const N = H;
              M(null), f.run(() => fi(t, i, N));
            },
            children: "Remove ticket"
          }
        ),
        /* @__PURE__ */ c("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => M(null), children: "Cancel" })
      ] })
    ] }),
    !s && !l && /* @__PURE__ */ c("p", { className: "qz-empty", role: "status", children: "Loading the board…" }),
    s && s.tickets.length === 0 && s.index.state !== "scanning" && /* @__PURE__ */ g("p", { className: "qz-notice", "data-variant": "neutral", children: [
      "No tickets in “",
      n.name,
      "” yet. Create a ticket or use an existing note."
    ] }),
    s && b.length > 0 && /* @__PURE__ */ c("div", { ref: T, className: "qz-board", "data-density": r.boardDensity, tabIndex: 0, onKeyDown: te, "aria-label": `Board of ${n.name}`, role: "group", children: b.map(({ id: N, label: X, color: ne }, O) => /* @__PURE__ */ g(
      "section",
      {
        "aria-label": X,
        className: "qz-lane",
        "data-lane-status": N,
        style: wi(ne),
        "data-drop-target": (L == null ? void 0 : L.lane) === N || void 0,
        onDragOver: (_) => G(_, N),
        onDragLeave: (_) => {
          _.relatedTarget instanceof Node && _.currentTarget.contains(_.relatedTarget) || j((R) => (R == null ? void 0 : R.lane) === N ? null : R);
        },
        onDrop: (_) => {
          N !== "repair" && pe(_, N);
        },
        children: [
          /* @__PURE__ */ g("h3", { className: "qz-lane-heading", children: [
            /* @__PURE__ */ c("span", { className: "qz-dot", "aria-hidden": "true" }),
            X,
            /* @__PURE__ */ c("span", { className: "qz-count", children: z[N].length })
          ] }),
          N === "repair" && /* @__PURE__ */ c("p", { className: "qz-lane-help qz-muted", children: "Choose a column for tickets with an old status. Open a note to fix other ticket details." }),
          z[N].length === 0 && /* @__PURE__ */ c("p", { className: "qz-lane-empty", children: "No tickets" }),
          /* @__PURE__ */ c("ul", { className: "qz-cards", children: z[N].map((_, R) => /* @__PURE__ */ c(
            "li",
            {
              "data-ticket-path": _.path,
              "data-drop-before": (L == null ? void 0 : L.lane) === N && L.before === _.path || void 0,
              draggable: !q && !Be(s.index, _),
              onDragStart: (D) => {
                A.current = _, D.dataTransfer.setData("text/plain", _.path), D.dataTransfer.effectAllowed = "move";
              },
              onDragEnd: () => {
                A.current = null, j(null);
              },
              onDrop: (D) => {
                N !== "repair" && pe(D, N, _);
              },
              children: /* @__PURE__ */ c(
                Ri,
                {
                  ticket: _,
                  lane: O,
                  index: R,
                  columns: m,
                  onOpen: () => e.onOpenNote({ workspaceId: i, path: _.path }),
                  disabled: q || !!Be(s.index, _),
                  maintenance: s.index.maintenance ?? [],
                  canReorder: d[`${i}:${N}`] !== "title",
                  fields: r.boardFields,
                  folder: n.name,
                  folderAppearance: r.folderAppearance[String(i)],
                  onMove: (D, P) => Ee(_, D, P),
                  onDemote: () => M(_),
                  count: z[N].length
                }
              )
            },
            _.path
          )) })
        ]
      },
      N
    )) })
  ] });
}
function qi(e) {
  const [t, n] = F(""), [a, r] = F(""), [i, o] = F(""), [s, l] = F(""), u = (e.columns.find((M) => M.id === s) ?? e.columns[0]).id, [p, h] = F(null), [f, m] = F(null), [d, w] = F(!1), z = ae(0), k = ae(!0);
  oe(() => (k.current = !0, () => {
    k.current = !1, z.current++;
  }), []);
  const x = hn(e.onChanged);
  oe(() => (e.onBusy(x.pending), () => e.onBusy(!1)), [x.pending, e.onBusy]);
  const y = e.disabled || x.pending || d, E = e.maintenance.includes(u);
  oe(() => {
    var M, Z;
    (((M = x.failure) == null ? void 0 : M.code) === "rank_exhausted" || ((Z = x.failure) == null ? void 0 : Z.code) === "maintenance_pending") && e.onMaintenanceNeeded(u);
  }, [x.failure, e.onMaintenanceNeeded, u]);
  const v = () => {
    z.current++, w(!1), n(""), r(""), o(""), h(null), m(null), e.onClose();
  }, b = t.trim().endsWith(".md") ? t.trim() : `${t.trim()}.md`, T = async () => {
    const M = ++z.current;
    w(!0), m(null), h(null);
    try {
      const Z = await ze(Vt(e.api, e.workspace.id, b));
      k.current && M === z.current && h(Z);
    } catch (Z) {
      k.current && M === z.current && m(ye(Z));
    } finally {
      k.current && M === z.current && w(!1);
    }
  }, A = async () => {
    await x.run(() => e.mode === "create" ? ii(e.api, e.workspace.id, { path: b, title: a.trim(), body: i, status: u }) : si(e.api, e.workspace.id, p, u)) && k.current && (n(""), r(""), o(""), h(null), e.onClose());
  }, L = e.mode === "create", j = L ? "New ticket" : "Use existing note", H = !y && !E && !!t.trim() && (L ? !!a.trim() : !!p);
  return /* @__PURE__ */ g("section", { className: "qz-panel-surface qz-ticket-form", "aria-label": j, children: [
    /* @__PURE__ */ c("h3", { children: j }),
    /* @__PURE__ */ g("form", { className: "qz-stack", onSubmit: (M) => {
      M.preventDefault(), H && A();
    }, children: [
      L && /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Title",
        /* @__PURE__ */ c("input", { className: "qz-input", ref: e.firstField, placeholder: "Fix login", value: a, disabled: x.pending, onChange: (M) => r(M.target.value) })
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
            disabled: x.pending,
            onChange: (M) => {
              z.current++, w(!1), n(M.target.value), h(null);
            }
          }
        )
      ] }),
      L ? /* @__PURE__ */ g("label", { className: "qz-field", children: [
        /* @__PURE__ */ g("span", { children: [
          "Description ",
          /* @__PURE__ */ c("span", { className: "qz-muted", children: "· Optional Markdown" })
        ] }),
        /* @__PURE__ */ c("textarea", { className: "qz-input", placeholder: "What needs to happen?", value: i, disabled: x.pending, onChange: (M) => o(M.target.value), rows: 4 })
      ] }) : /* @__PURE__ */ g(ke, { children: [
        /* @__PURE__ */ c("div", { className: "qz-actions", children: /* @__PURE__ */ c("button", { type: "button", className: "qz-button", disabled: y || !t.trim(), onClick: () => void T(), children: "Preview note" }) }),
        p && /* @__PURE__ */ g(ke, { children: [
          /* @__PURE__ */ c("pre", { className: "qz-mono qz-note-preview", children: p.content }),
          /* @__PURE__ */ c("p", { className: "qz-muted", children: "The note’s content and existing properties are preserved." })
        ] })
      ] }),
      (L || p) && /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Initial status",
        /* @__PURE__ */ c("select", { className: "qz-input", value: u, disabled: x.pending, onChange: (M) => l(M.target.value), children: e.columns.map((M) => /* @__PURE__ */ c("option", { value: M.id, children: M.label }, M.id)) })
      ] }),
      E && /* @__PURE__ */ c("span", { className: "qz-notice", children: "Resume ordering maintenance for this column before adding a ticket." }),
      /* @__PURE__ */ c(fe, { failure: f }),
      /* @__PURE__ */ c(fe, { failure: x.failure }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ c("button", { type: "submit", className: "qz-button", "data-variant": "primary", disabled: !H, children: L ? "Create ticket" : "Make ticket" }),
        /* @__PURE__ */ c("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: x.pending, onClick: v, children: "Cancel" })
      ] })
    ] })
  ] });
}
function Ri(e) {
  const { ticket: t, fields: n, folderAppearance: a } = e, r = t.lane === "repair" ? "" : t.lane, i = a && (a.emoji || a.color !== "theme");
  return /* @__PURE__ */ g("article", { className: "qz-ticket", children: [
    /* @__PURE__ */ g("div", { className: "qz-ticket-content", children: [
      /* @__PURE__ */ g("button", { type: "button", className: "qz-note-link", "data-lane": e.lane, "data-index": e.index, "data-note-path": t.path, "aria-label": `Open note: ${t.title}`, onClick: e.onOpen, children: [
        t.title,
        /* @__PURE__ */ c(Q, { name: "external" })
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
        i && /* @__PURE__ */ c(Fa, { name: e.folder, appearance: a }),
        t.diagnostics.map((o) => /* @__PURE__ */ c("span", { className: "qz-badge", title: o.message, children: o.code.replace(/_/g, " ") }, o.code))
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
          onChange: (o) => e.onMove(o.target.value),
          children: [
            !r && /* @__PURE__ */ c("option", { value: "", disabled: !0, children: t.status ? `No column for ${t.status}` : "Needs repair" }),
            e.columns.map((o) => /* @__PURE__ */ c("option", { value: o.id, disabled: e.maintenance.includes(o.id), children: o.label }, o.id))
          ]
        }
      ) }),
      /* @__PURE__ */ g("details", { className: "qz-ticket-actions", children: [
        /* @__PURE__ */ c("summary", { className: "qz-button qz-icon-button", "data-variant": "quiet", "aria-label": `Actions for ${t.title}`, title: "Ticket actions", children: /* @__PURE__ */ c(Q, { name: "more" }) }),
        /* @__PURE__ */ g("div", { className: "qz-ticket-action-list", children: [
          /* @__PURE__ */ c(Da, { path: t.path }),
          e.canReorder && /* @__PURE__ */ g(ke, { children: [
            /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "quiet", "aria-label": `Move ${t.title} up`, disabled: e.disabled || e.index === 0 || !r, onClick: () => e.onMove(r, e.index - 1), children: [
              /* @__PURE__ */ c(Q, { name: "up" }),
              "Move up"
            ] }),
            /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "quiet", "aria-label": `Move ${t.title} down`, disabled: e.disabled || e.index >= e.count - 1 || !r, onClick: () => e.onMove(r, e.index + 1), children: [
              /* @__PURE__ */ c(Q, { name: "down" }),
              "Move down"
            ] })
          ] }),
          /* @__PURE__ */ g("button", { type: "button", className: "qz-button qz-destructive", "data-variant": "quiet", "aria-label": `Remove ${t.title} from board`, disabled: e.disabled, onClick: e.onDemote, children: [
            /* @__PURE__ */ c(Q, { name: "minus" }),
            "Remove ticket…"
          ] })
        ] })
      ] })
    ] })
  ] });
}
const _n = 20, Ei = 40, Ci = 200;
function Ai(e) {
  const { api: t, preferences: n, onPreferencesChange: a, workspaceId: r, active: i = !0 } = e, o = va(), { companions: s, failure: l } = Ea(t, i, r), { todoScope: u, todoState: p, todoFilters: h } = n, [f, m] = F(""), d = ae(null), [w, z] = F(""), [k, x] = F(""), y = h.find((S) => S.name.toLocaleLowerCase() === k.trim().toLocaleLowerCase()), E = !!k.trim() && (h.length < _n || !!y), v = h.find((S) => S.name === w), b = (v == null ? void 0 : v.scope) === u && (v == null ? void 0 : v.state) === p && (v == null ? void 0 : v.search) === f ? v.name : "", T = (S) => {
    const J = h.find((ie) => ie.name === S);
    z(S), J && (a({ todoScope: J.scope, todoState: J.state }), m(J.search));
  }, A = (S) => {
    if (S.preventDefault(), !E) return;
    const J = { name: (y == null ? void 0 : y.name) ?? k.trim(), scope: u, state: p, search: f };
    a({ todoFilters: y ? h.map((ie) => ie === y ? J : ie) : [...h, J] }), z(J.name), x("");
  }, L = () => {
    a({ todoFilters: h.filter((S) => S.name !== b) }), z("");
  }, j = u === "workspace" ? r ?? void 0 : void 0, H = i && !!(s != null && s.length) && (u === "all" || j !== void 0), { data: M, failure: Z, busy: Y, refresh: re, reload: C } = Ca(
    t,
    H,
    `${u}:${j ?? ""}:${p}`,
    j,
    () => Xr(t, p, j),
    () => un(t, { workspaceId: j, manual: !0 }),
    (S, J) => ({ ...S, index: J })
  ), I = Te(() => ei((M == null ? void 0 : M.groups) ?? [], f), [M, f]), q = I.reduce((S, J) => S + J.items.length, 0), $ = M ? Object.values(M.index) : [], U = hn(C), K = (S, J, ie) => {
    !i || U.pending || Z || Y || Be(M == null ? void 0 : M.index[String(S.workspaceId)], S) || J.markerStart === void 0 || U.run(() => li(t, S, J, ie));
  };
  return l ? /* @__PURE__ */ c(fe, { failure: l }) : s ? s.length === 0 ? /* @__PURE__ */ c(Sa, { onSettings: e.onSettings }) : /* @__PURE__ */ g("div", { className: "qz-stack qz-todos", children: [
    /* @__PURE__ */ g("div", { className: "qz-view-heading", children: [
      /* @__PURE__ */ g("div", { children: [
        /* @__PURE__ */ c("h2", { className: "qz-section-title", children: "Note checklists" }),
        /* @__PURE__ */ c("p", { className: "qz-section-description", children: "Find and complete Markdown TODOs across your shared folders." })
      ] }),
      /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => o(_a), children: [
        /* @__PURE__ */ c(Q, { name: "external" }),
        "Open Kiro Notes"
      ] })
    ] }),
    /* @__PURE__ */ g("div", { className: "qz-todo-filters qz-panel-surface", children: [
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Search",
        /* @__PURE__ */ g("span", { className: "qz-search", children: [
          /* @__PURE__ */ c(Q, { name: "search" }),
          /* @__PURE__ */ c(
            "input",
            {
              className: "qz-input",
              ref: d,
              type: "search",
              placeholder: "Search tasks or notes…",
              value: f,
              maxLength: Ci,
              onChange: (S) => m(S.target.value)
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Folder scope",
        /* @__PURE__ */ g("select", { className: "qz-input", value: u, onChange: (S) => a({ todoScope: S.target.value === "workspace" ? "workspace" : "all" }), children: [
          /* @__PURE__ */ c("option", { value: "all", children: "All folders" }),
          /* @__PURE__ */ c("option", { value: "workspace", children: "Current folder" })
        ] })
      ] }),
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Show",
        /* @__PURE__ */ g("select", { className: "qz-input", value: p, onChange: (S) => a({ todoState: S.target.value }), children: [
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
              /* @__PURE__ */ g("select", { className: "qz-input", value: b, onChange: (S) => T(S.target.value), children: [
                /* @__PURE__ */ c("option", { value: "", disabled: !0, children: "Choose a filter" }),
                h.map((S) => /* @__PURE__ */ c("option", { value: S.name, children: S.name }, S.name))
              ] })
            ] }),
            /* @__PURE__ */ c("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: !b, onClick: L, children: "Remove saved filter" })
          ] }),
          /* @__PURE__ */ g("form", { className: "qz-todo-saved-row", onSubmit: A, children: [
            /* @__PURE__ */ g("label", { className: "qz-field", children: [
              "Filter name",
              /* @__PURE__ */ c("input", { className: "qz-input", value: k, maxLength: Ei, onChange: (S) => x(S.target.value) })
            ] }),
            /* @__PURE__ */ c("button", { className: "qz-button", type: "submit", disabled: !E, children: y ? "Update saved filter" : "Save current filter" }),
            h.length >= _n && !y && /* @__PURE__ */ c("p", { className: "qz-muted", children: "Remove a saved filter to add another." })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ g("div", { className: "qz-toolbar qz-board-meta", children: [
      M && /* @__PURE__ */ g("span", { className: "qz-result-count", role: "status", children: [
        q,
        " ",
        q === 1 ? "item" : "items",
        " in ",
        I.length,
        " ",
        I.length === 1 ? "note" : "notes"
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ c(Aa, { statuses: $ }),
        /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => void re(), disabled: Y || U.pending, children: [
          /* @__PURE__ */ c(Q, { name: "refresh" }),
          "Refresh"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ c(Na, { statuses: $ }),
    /* @__PURE__ */ c(fe, { failure: Z }),
    /* @__PURE__ */ c(fe, { failure: U.failure }),
    (M == null ? void 0 : M.truncated) && /* @__PURE__ */ c("div", { role: "note", className: "qz-notice", children: "Only the first items are listed. Narrow the list by folder or completion status." }),
    !M && !Z && /* @__PURE__ */ c("p", { className: "qz-empty", role: "status", children: "Loading TODOs…" }),
    M && I.length === 0 && /* @__PURE__ */ g("div", { className: "qz-empty", children: [
      /* @__PURE__ */ c("span", { className: "qz-empty-icon", children: /* @__PURE__ */ c(Q, { name: f.trim() ? "search" : "checklist" }) }),
      /* @__PURE__ */ c("h3", { children: f.trim() ? "No matching TODOs" : "No TODOs to show" }),
      /* @__PURE__ */ c("p", { children: f.trim() ? "Try a different search or clear the filter." : "Choose a different folder or completion status to see more." }),
      f.trim() && /* @__PURE__ */ c("button", { type: "button", className: "qz-button", onClick: () => {
        var S;
        m(""), (S = d.current) == null || S.focus();
      }, children: "Clear search" })
    ] }),
    /* @__PURE__ */ c("div", { className: "qz-stack", children: I.map((S) => /* @__PURE__ */ g("section", { "aria-label": S.title, className: "qz-todo-note qz-panel-surface", children: [
      /* @__PURE__ */ g("header", { className: "qz-todo-header", children: [
        /* @__PURE__ */ c("span", { className: "qz-note-icon", children: /* @__PURE__ */ c(Q, { name: "note" }) }),
        /* @__PURE__ */ g("div", { className: "qz-todo-identity", children: [
          /* @__PURE__ */ g("h3", { children: [
            S.title,
            S.ticket && S.status && /* @__PURE__ */ g("span", { className: "qz-status-pill", "data-lane-status": S.status, children: [
              /* @__PURE__ */ c("span", { className: "qz-dot", "aria-hidden": "true" }),
              S.statusLabel ?? S.status
            ] })
          ] }),
          /* @__PURE__ */ g("p", { className: "qz-todo-meta", children: [
            /* @__PURE__ */ c(Fa, { name: S.workspace, appearance: n.folderAppearance[String(S.workspaceId)] }),
            /* @__PURE__ */ c("span", { "aria-hidden": "true", children: "/" }),
            /* @__PURE__ */ c("span", { className: "qz-mono qz-path", title: S.path, children: S.path })
          ] })
        ] }),
        /* @__PURE__ */ c(Da, { path: S.path, compact: !0 })
      ] }),
      /* @__PURE__ */ c("ul", { className: "qz-todo-list", children: S.items.map((J) => /* @__PURE__ */ g("li", { className: "qz-todo-row", "data-checked": J.checked, style: { paddingInlineStart: `${Math.min(J.depth, 4) * 0.8}rem` }, children: [
        /* @__PURE__ */ g("label", { className: "qz-todo-check", children: [
          /* @__PURE__ */ c(
            "input",
            {
              type: "checkbox",
              "aria-label": `Complete ${Ot(J.text)}`,
              checked: J.checked,
              disabled: U.pending || !!Z || Y || !!Be(M == null ? void 0 : M.index[String(S.workspaceId)], S) || J.markerStart === void 0,
              onChange: (ie) => K(S, J, ie.target.checked)
            }
          ),
          /* @__PURE__ */ c("span", { children: Ot(J.text) })
        ] }),
        /* @__PURE__ */ c(
          "button",
          {
            type: "button",
            title: `Open note · ${S.path}:${J.line}:${J.column}${J.heading ? ` · ${J.heading}` : ""}`,
            "aria-label": `Open note: ${Ot(J.text)}`,
            onClick: () => e.onOpenNote({ workspaceId: S.workspaceId, path: S.path }),
            className: "qz-button qz-icon-button",
            "data-variant": "quiet",
            children: /* @__PURE__ */ c(Q, { name: "external" })
          }
        )
      ] }, J.ordinal)) })
    ] }, `${S.workspaceId}:${S.path}`)) })
  ] }) : /* @__PURE__ */ c("p", { className: "qz-empty", role: "status", children: "Loading folders…" });
}
/*! markdown-it 15.0.3 https://github.com/markdown-it/markdown-it @license MIT */
var wn = Object.defineProperty, St = (e, t) => {
  let n = {};
  for (var a in e) wn(n, a, {
    get: e[a],
    enumerable: !0
  });
  return wn(n, Symbol.toStringTag, { value: "Module" }), n;
}, yn = {};
function Ni(e) {
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
  let n = Ni(t);
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
var qn = {};
function Di(e) {
  let t = qn[e];
  if (t) return t;
  t = qn[e] = [];
  for (let n = 0; n < 128; n++) {
    let a = String.fromCharCode(n);
    /^[0-9a-z]$/i.test(a) ? t.push(a) : t.push("%" + ("0" + n.toString(16).toUpperCase()).slice(-2));
  }
  for (let n = 0; n < e.length; n++) t[e.charCodeAt(n)] = e[n];
  return t;
}
function Le(e, t, n) {
  typeof t != "string" && (n = t, t = Le.defaultChars), n === void 0 && (n = !0);
  let a = Di(t), r = "";
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
function en(e) {
  let t = "";
  return t += e.protocol || "", t += e.slashes ? "//" : "", t += e.auth ? e.auth + "@" : "", e.hostname && e.hostname.indexOf(":") !== -1 ? t += "[" + e.hostname + "]" : t += e.hostname || "", t += e.port ? ":" + e.port : "", t += e.pathname || "", t += e.search || "", t += e.hash || "", t;
}
function yt() {
  this.protocol = null, this.slashes = null, this.auth = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.pathname = null;
}
var Si = /^([a-z0-9.+-]+:)/i, Ti = /:[0-9]*$/, Fi = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/, Rn = [
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
], En = [
  "/",
  "?",
  "#"
], Mi = 255, Cn = /^[+a-z0-9A-Z_-]{0,63}$/, Ii = /^([+a-z0-9A-Z_-]{0,63})(.*)$/, An = {
  javascript: !0,
  "javascript:": !0
}, Nn = {
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
function tn(e, t) {
  if (e && e instanceof yt) return e;
  let n = new yt();
  return n.parse(e, t), n;
}
yt.prototype.parse = function(e, t) {
  let n, a, r, i = e;
  if (i = i.trim(), !t && e.split("#").length === 1) {
    let u = Fi.exec(i);
    if (u) return this.pathname = u[1], u[2] && (this.search = u[2]), this;
  }
  let o = Si.exec(i);
  if (o && (o = o[0], n = o.toLowerCase(), this.protocol = o, i = i.substr(o.length)), (t || o || i.match(/^\/\/[^@\/]+@[^@\/]+/)) && (r = i.substr(0, 2) === "//", r && !(o && An[o]) && (i = i.substr(2), this.slashes = !0)), !An[o] && (r || o && !Nn[o])) {
    let u = -1;
    for (let d = 0; d < En.length; d++) a = i.indexOf(En[d]), a !== -1 && (u === -1 || a < u) && (u = a);
    let p, h;
    h = u === -1 ? i.lastIndexOf("@") : i.lastIndexOf("@", u), h !== -1 && (p = i.slice(0, h), i = i.slice(h + 1), this.auth = p), u = -1;
    for (let d = 0; d < Rn.length; d++) a = i.indexOf(Rn[d]), a !== -1 && (u === -1 || a < u) && (u = a);
    u === -1 && (u = i.length), i[u - 1] === ":" && u--;
    let f = i.slice(0, u);
    i = i.slice(u), this.parseHost(f), this.hostname = this.hostname || "";
    let m = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
    if (!m) {
      let d = this.hostname.split(/\./);
      for (let w = 0, z = d.length; w < z; w++) {
        let k = d[w];
        if (k && !k.match(Cn)) {
          let x = "";
          for (let y = 0, E = k.length; y < E; y++) k.charCodeAt(y) > 127 ? x += "x" : x += k[y];
          if (!x.match(Cn)) {
            let y = d.slice(0, w), E = d.slice(w + 1), v = k.match(Ii);
            v && (y.push(v[1]), E.unshift(v[2])), E.length && (i = E.join(".") + i), this.hostname = y.join(".");
            break;
          }
        }
      }
    }
    this.hostname.length > Mi && (this.hostname = ""), m && (this.hostname = this.hostname.substr(1, this.hostname.length - 2));
  }
  let s = i.indexOf("#");
  s !== -1 && (this.hash = i.substr(s), i = i.slice(0, s));
  let l = i.indexOf("?");
  return l !== -1 && (this.search = i.substr(l), i = i.slice(0, l)), i && (this.pathname = i), Nn[n] && this.hostname && !this.pathname && (this.pathname = ""), this;
}, yt.prototype.parseHost = function(e) {
  let t = Ti.exec(e);
  t && (t = t[0], t !== ":" && (this.port = t.substr(1)), e = e.substr(0, e.length - t.length)), e && (this.hostname = e);
};
var Oi = /* @__PURE__ */ St({
  decode: () => it,
  encode: () => Le,
  format: () => en,
  parse: () => tn
}), Bi = /* @__PURE__ */ St({
  Any: () => Ma,
  Cc: () => Ia,
  Cf: () => Li,
  P: () => pn,
  S: () => Oa,
  Z: () => Ba
}), Ma = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, Ia = /[\0-\x1F\x7F-\x9F]/, Li = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/, pn = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B4E\u1B4F\u1B5A-\u1B60\u1B7D-\u1B7F\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDD6E\uDEAD\uDED0\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9\uDFD4\uDFD5\uDFD7\uDFD8]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09\uDFE1]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDD6D-\uDD6F\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD839\uDDFF|\uD83A[\uDD5E\uDD5F]/, Oa = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C1\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2429\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E5\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD803[\uDD8E\uDD8F\uDED1-\uDED8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDC00-\uDCEF\uDCFA-\uDCFC\uDD00-\uDEB3\uDEBA-\uDED0\uDEE0-\uDEF0\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED8\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0-\uDCBB\uDCC0\uDCC1\uDCD0-\uDCD8\uDD00-\uDE57\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF-\uDEF8\uDF00-\uDF92\uDF94-\uDFEF\uDFFA]/, Ba = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/, $i = [
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
function ji(e) {
  return e === 0 || e >= 55296 && e <= 57343 || e > 1114111;
}
function Ui(e) {
  return ji(e) ? 65533 : e >= 128 && e <= 159 && $i[e - 128] || e;
}
function Pi(e) {
  return e - 1 >>> 0 < 127 || e - 160 >>> 0 < 55136 ? String.fromCharCode(e) : String.fromCodePoint(Ui(e));
}
var Ne = /* @__PURE__ */ (() => {
  let e = /* @__PURE__ */ new Uint8Array(127), t = 0;
  for (let n = 33; n <= 126; n++) n !== 34 && n !== 36 && n !== 92 && (e[n] = t++);
  return e;
})();
function Ji(e, t, n, a, r, i) {
  let o = e.length, s = i * 90, l = 0, u = () => {
    let A = Ne[e.charCodeAt(l++)];
    return A < i ? A : A * 91 - s + Ne[e.charCodeAt(l++)];
  }, p = n - a, h = n + r, f = new Int32Array(h);
  f.fill(-1, a, i), f.fill(-1, i + p, h);
  let m = new Int32Array(h), d = new Int32Array(h);
  function w(A, L) {
    let j = 0, H = L, M = L + A;
    for (; H < M; ) {
      let Z = Ne[e.charCodeAt(l++)];
      if (Z < 89) j += Z, f[H++] = j;
      else if (Z === 89) {
        let Y = Ne[e.charCodeAt(l++)] + 2;
        for (; Y--; ) f[H++] = ++j;
      } else {
        let Y = Ne[e.charCodeAt(l++)];
        j += 89 + (Y < 90 ? Y * 91 + Ne[e.charCodeAt(l++)] : Ne[e.charCodeAt(l++)] * 8281 + Ne[e.charCodeAt(l++)] * 91 + Ne[e.charCodeAt(l++)]), f[H++] = j;
      }
    }
  }
  w(a, 0), w(p, i);
  let z = new Int32Array(r * 2), k = 0, x = 0;
  function y(A, L) {
    for (let j = 0; j < A; j++) {
      let H = L + j, M = u(), Z = u();
      z[x * 2] = M, z[x * 2 + 1] = Z, x += 1, m[H] = k;
      let Y = (f[M] < 0 ? d[M] : 1) + (f[Z] < 0 ? d[Z] : 1);
      d[H] = Y, k += Y;
    }
  }
  y(r - i + a, i + p), y(i - a, a);
  let E = new Uint16Array(k), v = 0;
  for (let A = 0; A < x; A++) for (let L = 0; L < 2; L++) {
    let j = z[A * 2 + L], H = f[j];
    if (H < 0) {
      let M = m[j], Z = M + d[j];
      for (; M < Z; ) E[v++] = E[M++];
    } else E[v++] = H;
  }
  let b = new Uint16Array(t), T = 0;
  for (; l < o; ) {
    let A = Ne[e.charCodeAt(l++)];
    A >= i && (A = A * 91 - s + Ne[e.charCodeAt(l++)]);
    let L = f[A];
    if (L < 0) {
      let j = m[A], H = j + d[A];
      for (; j < H; ) b[T++] = E[j++];
    } else b[T++] = L;
  }
  return b;
}
var Wi = /* @__PURE__ */ Ji("!}.&u%}'&}*'~!6*)%&,~!J~!J~%L~y<~!R,~~%Lu~~#GD~~#|)1#%}^%}2%+#.##%##%}&%##%'#%##&%#%#'%#&#%#&#'#%%#&#%##%#)%''%&%#%#'%#%%#%%}%%%#%#&(23#%%#&-%0%('1#(##%#'##+%'*.:1}#%#6-+(%'%%#%%%}#L'2351&('%}&/N'(0(/*-%(%%}#'+&T%7.2}#&%&#%#36/5##%&%%#&#%%#))2%%##%&&'0~!#*+&'%1~!%).'3q?&%'1~!.##%6(~!+%%%(Gw'rT~!E#<nA%#jZ~!H%(~!42##~!*31&~!G%U~#)5~#`3~!J~!Z~%]~%Y~%C~!q~!u~#kz~%#~!6'~!D~!U~!?~#T~!c%~!G#'~%7|~!G~!J~!G&~#pb~(Df}#%}*&}#%##%##%##&#-}&'#'&%#.++}%mI,#,@&(}*%}*'%&##&#%##%}&0}#.},U},%}+%}&%}#%##&}B%(}(%}+%)})%##%#&}&%##%&}<%}>%#%&}*%}(%}9%}/%})%}*%}*%}?&}&%}3%}&*#%})%#%#)}#&#-#+*%E%%'%'#%}#*V##&##I}#&&##%&%#&&Qf%%))w/0+&%#(#.%-''''++++7}>%4'',##1,#%#&%##&#'##&#*#9)%&%}#*}%,#+P(%A&%#'&##wSD',9E00#y#@}(+}&%&>~!#~!X}#*}(&&}(&}(,%}%&#+&}#&}I%#%}%)#(},'%#*}4%%#%}(''}#/##(##),%-##%%)#&}(.}&%#&}%%}*&#%},&&}&%}#%*'#%})%}D&}&%}-&}6&#&}-,%}#%})-(~+`~,=?~I9'9%~!,#%})%})%}@%}?%}(~!?~#<~#pP~#BG~#=1#%K+~#?#~%;)~#A~#mF1~#A'~'X%'~#lR~#N~'N~#r~#m#-~#i'?%#'%~#B%##%,%#~#_%#0%~#]732~,w~2+#:&#%&'0%&>%}#>##F+)#%&&#(+_}4&}-%}(&}@&}O7Fdf0@+/v4}&WU##&/0#&'('B#%}.%}'+#%}#%%&#&%#%##+#&#)#6#'#.},%}c%},%#%##%&#&%#&~#>'*-.%##%##%}#%%}%'~#)D1}#%*&~#_%%'(~#S2%'.}#~#=##*'*-%}&'%'##&&~'E%.#&~#M4}%%##&'%#~#O1##%&#'+~#<B%##%%'%+~#;#@%}#&%#&&%#(~#H1}'%'##&&~#?A}&'~#D#%32}'&&&&~#[}'(#%}'~#;C})&}%%#%~#=&%,3}%'(#%%~#^'#&&)#%'~#Y%-~#d-%'~#^%%&#&&&}#~#b~2t*&'~&(~&@~0%~e~3}%*''0})&}+~!9##-}#%-hD*)1fC#%/&/fB#40~!+#)*4~!+~!K'&:~!/*7~!.#~!H~!L':~%x&~!H#~!*~%1~!I#~!+A~#p'~!F~~#-#~,,(~.Z~!V~%;'B'mq-W~!N~%I%#&&#&}#%},%%}'%}+X#%}#&}(%}'%}<%}#%}%%'}'%}:~![)9@~%>~#UA%-%##&~!C%~!-.9:~!1~!-^2/:a~!y,D*J#-5)/4~%23,~#G~!L1~!0X3`~!2+~!!0-~&E~!W~!o,>Y&]~%cZx_&~#O*9#A#'#+I'%#)~!0B*-5A+-((F&*M#)(-7-5+'-3a5Vi~!Y~!?+[)%3),ERHm~!+:D,VG.+)?fB%%*(%)'(#&80%1'8`K8?`+'Z#&O&'H5#*9)A%%5&3))0%39+.*7#()&&*=4@**L)<'_&*+..;(#*+)./&0#3)%')-8(4ixD(&.}%,('aI:,)%,k2231T)I'#/-W7,/'Q#.'Y24+h')37</31&83##&0#),H(?'&?/1##%#&&#%''-%&&&#(&''&#.-'%#%%(,')*'&#&#'##%(%(#%('#&##%%%%('%#%#%%#%#&%##h>w+v<ayvyvcg.uuhKr}g/v|g>u9i[~>g5uI~=RvdwEg;v/g;uk!!TTSx]@RT!U!#!@VBRUU!'UTe-d0c`e&gSdicedFcrdTaqb.kYcAohdYd@a3e+d}dMdtd.aJ#bqcK`dle/e.e'dwdPdodddjbEb}ogd^ofdpduc6j?l%d{drdqc)d7bacOdQ%T#Y)X.sR[yH>6Vyv3[xwLu>vo'!*.[yBacahoj>6Rew3[xqdZa#!a&#^(X-[yG>6Vyu3[xvg3sEr|g.u/Ri9db0T#^(Xa)!-[y;>6Vylg4wKs{JwNZt3@3r=c4Z([xlg;wKt!cpq's@v7A'*a(a+!-a#[y<3Dt?3Dt'>6Vym3[xmg9rxsNJwLZt4~?r?db1T#`-!(Xa,!0[yS>6Vz%NuQs.g4wKtnJwNZtS@3r>c4Z([y%g;wKtrdga8!a(!#&T*Y-Xa#!a0<or[yc3Dtq>6Vz43[y3JwNZtf@3s!Ju}!%Dti:pm3c_%X#tjB5pkd6q!r]u?voC'*-a.a2!0a&a+[yI3DtI3Ds~3DtH>6Vyw3[xx;:s#~<5pKJwNZtE@3r~d`a)!a2T#a.(!+U.X1[yT3Dt`3Dtv>6Vz&3[y&g9rxwzcxstPu.<rAJwLZtT~?r@dZa%!a.&^*Za(/Reu[ya>6Vz23[y1g3sEr}wkg{NuQRg{ci(U#5@b`~,cg#U(2WnH5wugcRh7dX#T(Y,a'Ta!!a,[yZ<]mj>6Vz,3[y+Pv#5ReZKu+=,%!H}7ABwkaS?Rh:BcW(X#<]mrj:ubv/ARekdg%!(!a.*Ta(Y.X1!#sP>Rl*Dt6[y>>6Vyo3Wf*jOvuumvuRgRJuq*!:9<B@bX~3jVv&v@s@5Re[d/rQt{uAvo&a&a*)a2!,0Wf!3Dt0=Bs'>6Re}3[xy~<5s%JwJZt1~Gs)c;&!#2sJkNuXvzq7rxu,Re8dka4!a8(aEZ+a@Y.X1Xa)[yd=Bs(3DtP>6Vz53[y4cX#X&Re:avRe9~<5s&JwJZtQ~Gs*i^rzvdRg+Jv{%!2sbB@bX}kdga,!Za?&^*T1/!a'Dt+[y6>6Vyf3Wf%g/u;s4hGu6?Rh-JvZ,!c%#&RoX54Rivj7uyvf8RgTKvZB%*!2sGh<vu5Rgq<=C::9bb~#dZ#T&Ta6Y.X*Dt>[y93Wf)coZ(T,6VyifluvRgC@95@B@bX~/hFu34cC#T,k/unq8w8Q5RkUklwQuzunq8w8Q5Rk8d/rJu?v8w9)-&!a0a;a&aIWejg3sEr/h1s<DtDJvyZqY5aws3Jvy!&Wei~Hr1:au5@Bag>23E~5c:Z&bX};kKv?w&unuVu5Rjc;>bs)#~@:Rh.=ay<a]C;b`}Vd6s/t{uAvoaxa()!a,a7%-a#a2Dt,[yF2Wo[>6Vyt3[xuNuPRi&NuPwpi#RoWh?vf8Ri%Jv]!%Ri:KvxD!.'2WeAjZu`q9rxu,Re7woeAg-unLq(qA_/*2Wg_g3u5q^9:4E}/jTrxrzv=Wkkd~0UX#^^Xa-a1a5T&a=U1a'*aEa]!a*aPaA-adok[y54Rn>;:p3~Dp5g9rpsFNvZqjg3uJp4~<5p0Pw;5qlJwNZt*@3p1Pw:5p/Ou!5p2JvG'!6Vye=<qnJvh_[xhg3v,Rh3kOwOw-sDuev/Re^dha[a%!%!a+#Ta7)-5TaCaO!aka!a)sf[yb2>Rl!9ARiq5E}Qg=ucRkBE|oJrJ_@Wk~@Wk{JrJ_@Wk|@WkyJrJ_@Wk}@WkzJvO_[y2g-vMRmiKuYC!)&>Ri;>Ri<@3RkNc](X#@9Rk=g5vuRmhKvDB!+'=]meg3u4Rmgd)#Y'Vz3CARmfd`a+!%T'!+#Ta1Ta6TaM-sTDt9[yA9sYd'%Y#s[[xpj:ueunaXRgEjRq,v-vuqdd2'`#6Rev<32@5>:2<E}5xIo9a*X#Y(;5RePJvD_g>vyRgNj8w)v8<wggs:RgXiZt|vjx,hSq3ah!-(~@:Ro/Ou!5RhWj^v(pyw8unRhUdx-UY#^Ua.a3a70!)%UX1TaDa)'omRiRRhE[y:3Dsz=Br,>6Vyj3[xkg6ruwjcqsrPw;5r*Ku]D'Zt-@3r(~?r.i[vwv]dU1a--U#`a4(g/vsRhPOu!5RhLj:rmu9Wo!~@:wdh@g/vsRiTjXuvvNr}:RhBj^v(pyw8unRn]dz1UYa'a+^Y(!aETZalaRY.Ta?a4[yDJw1!#qLsW>6Vyrfzq-pLflpwRe|Js>%!Dt@3Dt&Jvy_[xs~HrnjMuwpsw'RecKu+D#'!t<~Grl~?rjg5u-x,gwp{ah!-(~@:Rg~Ou!5Rh'jXuvvNr}:Rh#cW#X/c;&!#2sLi[v7u7RgpJv)(!iLrxu,Re6j7v@s@5Se[e7d`aW!Za(a`T.a#!a3!&aDa-!9)Dt_=6s+3[x~~DR|h~DS6avhGun5RkZj3w)v-]mkKunB!&*]kb97R|i<ARk<c:Z(6Vy}Juh'!wziMRoS:F|vkLuauJv5vtvQRh1d='T+Y#VyO~DR|jcF#T'7R|g97R|kJv3'!ay<Rj,Jvh&!:ReXcsa6*a+#a#_aIRf9aLRf?c,Z&Rf5Rf7c.Z&Rf;Rf>cQ#%T'p-Rf8Rf=ct#%'(*!,p,Rf4p+Rf6Rf:Rf<d~'Ua%U*^UYa(!a,-!#a4YaTalaEX0a8a<Weo3Dt/3Dsx=Br93Wen~Dr;~<5p<JwNZt2@3p=Pw:5p;Ou!5r3c7&!#:p>3Ds}KvGB)_6Vyk2sM=<r7x'eovA(!hFu1ARf}cV#X&@r5j6rvwQa^Rf3c=Za'wkghJv__g;unRggA53B9=b^}%j6uduo5Jq;!(hIv%2Re`Ou4ARe_e%a#^^^Xa&!a*a2!&a6YaP!*ad!#a:aE/5Rn?[y@>6Vyp;:pE~DrY~<5pBJwNZt8@3pCh=rt3rWPw:5pAJup_[xoNuPpF9c!#'45pD5ARn)d8#X'X*3@rU72s]h>v<<sSjJpqvewOJq/(!hNw'5ReBk0s2u3w/w'5ReE5@Jq.!a+JQ!&WeU23d(#Y&RjG5]jBk!u7w&u0udARjEe#+^^^Ub#!a2/a`Z(agT1!a-a;|@TaG!aS[yV=Re~fow'RguNuPRe?bz#'>RoUWeL>:Cbb|?JwPZtVg6ruRmzJvD'!6Vz(g/vmRh~Jvy_[y(g9voRgyx*cy(#2>Ri2B9b]~9kIw9u7rluJu3Rg]dI#a%UY'@=p%CAx.gQZ&RhwwygtRm{x5g_Z'+ABqR9Woa=Bp&dV#^*Xa'!&@o{g4v]Rk;Jv{!%Rk[wkkiA5RkiwwfUB=x,fUuqC&*!>RfTg8v0RfV~ARfSd;rJsAuAv9wR'ae+/aO!a@aza/a#[yQ@Wg!2Wemg3sEr0JvB_g>uvReWg2v+Re=KupB_+[y!2AbY~-~Hr2AJwD!(h<~El>h<~El?Kun@+_:9b`}Kg-v/Ri3g;vtwyk_9]k_d=&T#*U.6qh@Ab`|K9:H|CJv[!&3Dtex'fDwC%!Rf[9WlMd[(^X,!a%Z06Vz!@WgBg=v~Rgvg,QRe@awd,#Y+jTv|Q~EfWj]uNr|~FRfXdy#Y&^Ua%!aO.!(a)Ua;=!a@aKap!a-,a!Ta]a[rSa]p?[y82sK=Bq~;:p:~<5p8Pw:5p7d'#Y'Wf(;RnRi[u4w&RgJJvG'!6Vyh=<r#ijuuv/sIKuYD'ZtG@3p9~Gr&d2#`(g<vtRgFj`u5w&rqpxRf2CJuY!+:wfnTOu!5Rg}jNs1ucv&RfwJvA!&3@q|BDcC#T,k/unq8w8Q5RkTklwQuzunq8w8Q5Rk9dga#!a'!a=#a0!:+Tb*b@aO.a4!aba8aFJv^}?!VyR~Dr<g;u%Rn.~<5p[x'e`wNZtR@3p]Pw:5pZhNvjBp.woe_g5u-r4JwF!%DtO3:ooc7&!#:p^3DtpLuGw(!+%)Dtk6Vz#2sd=<r8d'#Y([y#<x3gJt`w@!)%}MRiowzikRij=]ilxAf3,U(#B2Rf#g0v-Rm[ck{`U#]giKv3>)!&6Ri154s,KuGB_%@r68r:dJ|t`#X(9<E|u2@H|rx3gJu?w'!+'1Nu7Reg4=H~+9<wxgY95Rm]xLggZ-`(X}U2:Ri4h<uOawRmsJv__5@bb{jbV~3dka#a'a]!,#a+U=a>b6a3b%!/aKa/)!arwve^VyJ;:pR~DpTg3uJpS~<5pOPw;5qmPw:5pNOu!5pQJvG'!6Vyx=<qoJvA!{~Jup!%@qk7Rn/KvyD!}''[xz;>wkh'?Rh,x8gyt`w5D!&),(SgyccRgztJ@3pPB5p#d'(Y#<]mmifubw&RgoJvE&!82s^JvF&!8Rf,ADb]~;x=h'rNu]vK!,%'*0RnORh)4Rh*AqQg-vaRnNg;wHwkh'ba~4cE#Ta*x3gctyw@'!+%RnFRnD<4Rn@hFvK5RnCxWg[#`&a0Ua()`1Rm75Rg[c]%X#qi8Rg^NvdRj>BwzgZauwji7Rm6A4wgg]d1#&(*,.0a#Rm;Rm<Rm=Rm>Rm?Rm@RmARmBe%#^^^Xaea?aC/b+(,!a+a#!a/!>a&Ta<aKbD!2wphBRnk[yPw}hE|.=Br-3Dtm>6Vy~g6urRf.x,hPrNav!%'RnqRo%Ro#Nu;q[Pw;5r+JwNZtM@3r)d'#Y'Weh;xChL#`&RnmRnoKu}>%(!Rne~Bs-;2wjcussJv+'!aYSO}6@B<5?ba~8LrNvj!.%*ROwungw~ng~:9;Ri^>wtnig;wHRnixDh@|(UZ.x1h@|)!#:2<H|*xHn]#-UX'3Ro)z=iT}6ARns=Bwsn_wpnaRncw]aR(#UXa&Ua*a/=]iPd'#Y&Ro'WnXf{QRm2hNvj]nZd`'T~&1`{|`#9b]{}c:'!#Wl{>@=be}]?cl{{U#:5Abb}Jds#^YaF!a*b4a#a3aPa>&Tb!bH!*a_!Eau?/a&RjY<]gj>6Vz*;:pe~DrZg,QRj1JwNZtX@wihspcJvZ&!VyX9WmOJu|!|N2WmHJvh&!]ht~Bpbcn&T(!#RmQ<s7Nu;padH#X'`+WmJ@>RmKCARhnKup=!)&Wf+:RhqNuPpf9c!#'45pd5AwghpARn(Ls@w!%,)!RmP@Wfe<E|IJva!&WmNg8vsRmLd`*.`#Y'Xa!axRn*]hrA8Rhug5s@rXg8u!RmMd8#X'X*3@rV72smdI*#UY&RmICARho~GsgxVgd)Ta'U-Y&Xa!T#RnEWnA@Wffg1uDRi0hFvK5RnBxGnG&#`%owp)@wsf+bX}Ze-*1!a*^^^Ua|!#a.aq&Ya2!a>.a6!a:aO`aJDtL[y`@Wg#>6Vz12@wzoYRoZNuPRi!NuPRhzg=ucRi,@=b`{Yg=ucRi-ACJvB!&Sh[ebSh]ebi`wUuFRm4Jw2_[y0JvB!.<Ju(!&SoG}6Shd}6<Ju(!&SoH}6She}6Kur@._g5vHRieJvx!{L2G{Kx6gd'T#?Rh82Wi5cZ#X(g1w)Rm5dW-Y(Ta#!a)!#aYa=wnfE=su2>>bU{0j9udv:<svj8uQv-7RgHdE%#^'sq9sp=>Bb_{TJv`!&g/r|snj6v(us5d,#Y(56H}[978H}]Jw5!&g1rushJvB!+j;v{u5?zDhd}6}bj;v{u5?zDhe}6}ce*#`(^^^a[aea!=!a6a*aoXb1a.!aAbL!b>,b'aL!aV@Wf|2Wlg3[y/JwNZt^@3piPw:5pgJunZou3@rsJva&!Vy_g<v~Rm#JvG'!6Vz0=<r{Ju{%!:pj@WfsiXuJu3Rm:JvZ&!WfA~Bph@c4Z&Dtwax5rubx(#:awRk1@d,#Y&RfjRfid1#,Y(@Wfp2Wlrg5s@ryKu[@!,'=]ig9wlk?Rk>g5u-rqJvy'!@9RkQcH(T#=>Ri~@<wkj(Wj(KuZB*!&<7rw@9RkRcH(T#=>Ri}@<wkj)Wj)dg(Ta2Xa9X#`-!a*CARhg@@=I}d9x;c~#X%so=<sj>2@@=aybb}XjWv0Q~EfEj3vLv;<d,#Y(56H}`978H}_dgaPaFa'a/!#a3Y0a_a;a|!1(a7-[yE3[xt;:pJNvZrrg3uJrvJwNZt=@3pIh=rt3rxPw:5pGOu!5rpJvG'!6Vys=<rz@c4Z&Dt(ax5rtJvZ!&~BpH@wsfNg-vaRlNci*U#=<wei<F}a5@Jq.!a*JQ!%@qZ23d(#Y&RjH5]jCk!u7w&u0udARjFd/prq=tyvpaEa(a:.!a1aZ(@@=I}:9wpd%=<sX55w_h}@@=I{t=ay<aU@@=I}T=ay<2@@=I})?C9:9au@9Cb]}DP~=x-fAZ(2Wl1=ay<aU@@=I}>5@d##Y+jTv|vV~EfFj]uNpn~FRfGdgaK!Z2&!a8a-Tb({E!acTbM*!a(DtY[yYd'%Y#sl[y*hHvh>Re5x2c{Z}.j4uCvcawRiMd+#X+_x&d!},<5RkX;2Hzw@x,gavfB-!{CcF&T#Roe;RodwWbBg5urRgaKvHC*_6Vz+<4opieuew&Rmq@d]&Y)X,T#X0Rh}<BqP=4qS9:ReMg/ujReNJw0!/<Jui%!bd{kawwnemRelAxUa?a3#*.&UX(Ya+a/RhvRnQ<o}9Wmtd-#Y&RgSRmw9;Rmxay=Rmyg-vaRmuxEhSrNu,v-voC!%(aR.a(a7+1Ro1>Ro5CE{A9b]{@;5x#eO{:g;urRi+KrNA!%(Ro3>Ro79;Ri_Ku@>{;&!x%gX|{KunA_+g5QRj/g3u5Rj#g>uERj%wio/xRhS&!,!#^1U}wba{8>>@=be}qC@:D5ba{7Ku+A&!}x?ba}t>>@=be}se(aA^^^Uat!b0#{pa+awUazbGa#aLb9bgaWac'a5TbS=Br!d1#`%scp_Jvl!#rT>Re0JvX&!VyN=H{Fcm#U&:pY=ReaJv2&!]h0=]nUJvG'!6Vy|=<r%JrM_=]h2@Wlud'#)U'Wf'b]{i=]h/Jvh!&~BpWg=v]RnMx+ny#'Nu;pVwjnu=]nwxJnx,T#`&Reqwjnt=]nvieu9vrRjLLuYwP(#+!th@wih5pX~Gr'g5v/Rh4KunA'!-CARnP@wwiN:Rm_9x'cvw>!|l=<saKvAA!0&3@q}>w^e1bp#&Re2Re3BDx7gH#T|f5H|eKuZ>!%(:qNAH{]Jv6!+3B2B9=b^{X<5<B92:E{ZLvhwA(a;a%!igQuyRmad+#Y}m@3Rh5d8#X'X*:AqUAHzmaxwbh<aXRnVcF}RT#Nw&cj#U(BWnug/vsRntdka)(a3+.Zb7aYYan1!bVa@Xa}[y^@b[{G=H{+hFu73Rj&Pv#5ReQcK%T#sig1v{Rj'Ku+D#'!t]~Grm~?rkKuMB!01d5#`'Vy.ta3Dtu~Hroc8#'{^45s85AwZbP&!#Rn!wghxWn#KvEA!)&2RlA2RlBx:h|#(T,=]j09Wobz>x]z/@awRoTd+#Y(az]hFhCrm4d,#Y+jTv|Q~EfMj]uNr|~FRfOdCa!Xa9_X#@<plJvf!%b`{(9;Rgwc;.!#2x7cw#T|UDb]|T5Ju={(!=@E{&Jv)&!Ab`{'awJvf!~*>>@=be{#KuY>!+&4Ezyi[ugv&RjIdea+T)#UXa&T-T&a!Rh9auRmW=]kLg5vuRn+g3u4Rn-Ow6ARn,hHus5xNk?#UX(U~)/g8v0RkD~AwkkF?Ri.OuNBwkkA?Ri/d|a2`a*^UYa.!aBTZaTa'Xa;!(!2!-a#b2[yC>6Vyq3[xr2Wi?g1rusVh%s?DtF~<5rbJs;%!DtBfswKtCj[uvuSsEu3RgVx3o:u+wN'*Zt;@3rd~Grh~?rfg8w)Lq)qE&-a%!>bI|`jWv0vV~EfCjTv|vV~Ef@j]uNpn~FRfBcK#T']gWNu7x,k7q4ai(0!hHv8<RhmkMu9vrsBuev/RhlCJvB!,g<v{wchh~@:Rhji[vrv{wchi~@:RhkdS&a5UY#Ta!RgPwwiI5BwciI~@:Rh`x'iJvj'!5]iJPu8Bwch]~@:Rhach)U#h3rp]gLh@t|Ax,hTq3ah!-(~@:Ro0Ou!5RhXj^v(pyw8unRhVd|)`,^UYas!a?/a2Z'a^Ta{Tb7Ta(a#!a,Wf&9sZ3DtAadamov=Bqt3[xig8vsRm~>waiL2b`{QJv*_Ouv2qgj<v]v2BqfdR'X*X#Y-@3qr~Gqv~?p6hHv-]glPup5Lq+q?_%*b_{qF{n9b^{rOu4ARhpKvCD!+&~Bqp:5Dbb}nwoiKl&unuTuBv]v+ueunaXRf0=Jvh!0nKufu8v1w&w7q%w&uHrz:Rgnj5w,uxDJq/(!hNw'5ReCk0s2u3w/w'5ReFd>Za&!*UaA=<wkgsRnSJv^!%Refifw3vyRgOKu_B'!,<]gkiiu:w&Rh<=C@a^<B57@2F{[<B5@aW:=3away9A5aW=<B=C@a^<B57@2F{Ie-#`(^^^bCara.b8aza6!/bZ,!adTbnTbOb+aFaS!aAT9@Wf~2Wli3Dtl2@d,#Y&RfnRfmJwJZtN~GqyJva&!VyMg<v~Rm%iXuJu3Rm9Jv[_=]ih9wlkDRkCd1#`(@Wg>2Wls3cH#T(@<Rj*=>Ri|b~'#23s9h<~El.d'#Y&Dtxi^rzvdRl#d*#U%(o|B2s`hJwSaxRmDKv4B&!1:Rmdd5#`'Vx}to~Hq{x'f1v3(!BA5ba|bJv_&!Wfug1v]ReIdO+U/Y#&G}-8wze=Rh{g1v]ReHg/uQRf/by#)ibQwERl/cH#T(@<Rj+=>Ri{cNu+vlax-!(#a0qa9<Rii2;;bU{H;x<i=&X#Rk`<4wwi=C9H~8xAI(Y#<azRi@45wXI<B9;5bb~7dL(X#Xa(+!aL6Vy{g5QqOau:5au2@ay547EzbxOcU(UX-T#Ta#:Cbb|A?wjh/b_|SOw6ARgtihr}u7Rhy<d1#T)X1@@=I|~=ay<2@@=aybb}Sj3vLv;<d,#Y(56H}A978H}@dGpvs@uAu`vcw9*!aFa+ai%(b!aXa8.a?a[ozWey=sU2@G}Nch&U#Rf_WexKu+D#'!t:~Gr`~?r^j]uNr|~FRg*j^psurwJt|RmcKv)@&!)7Rkv~Br[@wxfO:Rl3co#U'6Rezj_q#vIuavjRltwzeyh@vr5JqD0!>aY?C9:9au@9Cb]}9cl#U*5;5<H||jbuus1ucv&Rfvg1v~d/pppzqFr^a--a~!aMat1(hFv;Wiz@@=Izoj5uuv-7Rix~Cw`fk2WlVcZ#X,k)u3vWs@u2]ktg;wEx'fBq(_2Wg/jTv|vV~EfoJv]!15x'hzqG!(P~EfU~CRl_j6v(us5x4i-#T(2WmZ?C2F|d>Kq<aj1!*jTqIsBv=Wl`~Cw`fi2WlWj`v0u*~>RlR=c>Z,k#u3vWs@u2]kr<c1Z+jTqIsBv=Wla~Cw`fm2WlXdmb3!a{(arZa`bkTa%TbQTa-a9+c'!aM!/[yL=Bqug.w'RifhFvyDRj.g>vgwyk^9]k^Jv3_@WfbAARkhJw2_[x|JvB_wkoIRoKwkoJRoLd'(Y#<]gm=<9<H|yd'%_X#skDtb3awwqkgNulRkgdB#^',9:p'hJwSaxRmEBwVb8@4=H|qLu+w50&!)@3qs~?pU>Awwn;;Rn=c:Z'ARn<=<qwKvC@!/&~BqqJv6!&]eVb^z^xRge'/a%+^`#Sge}6<4Rn3=]n0Pw2>Rn8Jw0!&>Rn:>Rn6cY#a7+!a&=<wkaNw~h3z_c5Z{=wjh#=]nLKv^D!&)Vyz=bW|swYb<WetcG#T(2wxa@qVx@gD#Y&b^|V5JwG&!5bb|pg/w&RgD@x=kHs=uAvn!a%%/'+RmSRh694Ro`g-vaRmRhHv-]mlxCcS#`&ba~.5cD#Ta)P~=d,#Y(56H{>978H{Dd_#{2^Y%_+qbbb{6g3sERhsbU{?dfa.,`a(Xa<!aiX#(55RiG54RiHcI#T'WiU3RiVNvdwtfcRlKNvdd,#Y&RlHRlExQgf.1*^T'X#Sgf}6Wn4=]hfPrk>Rn7Jw0!&>Rn5>Rn9Lunw?&a2!,5<oq@@wqfdRlJj5Q~=d,#Y(~ARfcOuN]fdDKw;ay(}i!547E}j?cI#T(@5bV}iCbV}hdv(^^Tb?a40,b##Tbo!a*bR!a<b|a/!aKai!aU[yK=]o^g:v>ReGJwPZtK<7Rh+h<~El,Pv#5ReR@awwxjCg,ulRjDJv6&!]j!z?aQeeg>w=Sh<eeJw;!&axEzOg,Qosc!#*:wkeJ]eJ>x'h-u(!%Ro.w~h.zPdNZ(X,Ya![x{;9ReY;wkgxRiF:x?ap#Y&RmUg<s2Rkod]+UY0TZ'!a&A9sw<=bczLNvuw{gqzNhJwSaxRmCKuLay!#&s_Rf-55b^{uJvZa!!c%#(55Ri654wmiu5RiuawLu,vp!+}^%b_}Y9;wkgxba}o>A9:=b^}zKuh=a''!3awRk3c*'!#aHRk6c+Z&Rk5Rk4Jv)&!awRjSawd9*`#0?C2@EzMj8u<uJ5RmbjQrquJu3x,k>uq@_+=ayb^|W~ARkEOuN]k@7dhzV^X/X&a-#zRzSb`zXcJzTT#2WkVKvDBzW!%FzY9;5bbzWjQrquJu3Jw3%!b`zU=ayb^zQd:#X(T-a!6Vyywxh}=b]{Jg=u1RiAdGp~qHtzv!w(wA+a+a;<!aJaYai'anasb(=azRmV:Cbb{MLq2vb!%')RjuRjrRjtRjqx3jnqCw3!%')Rk(Rk+Rk&Rk)Lq2vb!%')Rj{RjxRjzRjwLq2vb!%')RjsRjpRjfRjex3jcqCw3!%')Rk'Rk*RjkRjl9<CbbzfOu4ARhxLq2vb!%')RjyRjvRjhRjgx=joq*uKvb!%')+-Rk.Rk%Rj~Rk-Rk#Rj}x=jdq*uKvb!%')+-Rk,Rk!Rj|RjmRjjRjidAq&qKs@uAv8Aa.'*-a@a&0!aM@a5[y73Dsy3Ds|3Dt):wxgI2sHJwJZt.~Gqxwsf0ikrzt}Rl0Jvy_[xj~HqzKv_A|D!&WfP8axRoVcf,U#k(v]v+ueunaXRf1Ju}'!g8u#Ri=jQw!sCunLprq>!,')~<5qeGzq9F{W=c##%s5au:5aU3CBE|;d4#X(D!a&6Vygx(b;#(=]ed?C2F{N<capoq2r[a&!aPa9,'Pw;5s:@@=I|,55w_h|@@=IzcP~=x'fCqB_2Wl2>aU@@=I|1OuNBc1Z+jTqIsBv=Wlc~Cw`fl2WlZ~AcTa%!Z+jTqIsBv=Wlb~Cw`fh2WlYk+uNqJsBv=WlSg,u3dca3#UXaMYa)TaB-=cM|7T#<bI}l5@B932:aV2G{BOuNBJq:|M!5Ezt=<B=C@a^<B57@2F{v>cB{/T#=ay<bI{3Jv6!a.6BKq0ah&+!5E}HP~Ef{978BaU@@=Iza<7d#.Y#978BaU@@=IzH~AJq0!(@@=IzG978BaU@@=IzFe,aU*Y&^^^bvJb,b:bFad!a,c2Ta>aL.bo6!a#CbTa'T#Re{2Wlh2@G{yg6t~Ro_NvdRfticuRQRllJv3&!x&c|zs@Jw3!%RflwpfkRlpKuL;%(!Re<@G|C2GzdhIvuBwgjAg-u0RjAKQB%!(GzZ@G|5NuuRl7d='T+Y#Vy[g<v~Rm!==G|>JvA!)@wma=]m1ifuaw&RmnLs@vT'!|/+[y,g:v>ReTJw1!#qX=x!eC{bLu+wT&)ZtZauq_~Graci&U#F|89:r_Lupvq!.)&2RlG8RfaC=x!eF{_h?rpWlmd&'!#X|&]k::xJey#`'T|+<E|&2@H|%dE#(^,g;u.RiEg6vjRiC9xCkA{O|zY#g=ucRmXKs0@!&*@G|m@awRknJuh!,3d(}gY}eJvj!%Rm):Jw3!%Rm+Rm-Ls0w(&!a(a#@b[|6cZ#X'7RkxWgAOu4ARn'dH'U#Y*Vz-Wm'CARm}d]*#a%^a*T'aK!a<9bV{PC=p*Jw4!&SgxcbB5r]idw(wBRmF7xFkt#&`(Rm/Rm8E|!JuY_9:Rl5=wrgr2:bbxd@xXfB(a*#T+!.X0X1Ta/a'T&RlDRfL>RlyARl9b[z[>RfZ:RlL:RfRwlg/ARl;9;RlxKv,A/!%7s69<74=BA5ba{-8Bde#`a<XaKYa1,a'P~=wxfB2bZ}}?C972@@=I}r8@55B9;5bb}G978B2@@=aybb}3j3vLv;<Jw3&!>Rfk=ayb^}4~Ad1#`*@@=aybb{w2@>==<bbz]dx+UY#^UaF!a9!bB'Ya1.!ajXa#%olRhD[y=3Dt#Ov5BrHKuMB%!(Rf^Wep~HrJwkiQjKr|~FRg)Ku+D#'!t5~GrF~?rDdV)UY,Z/_7RkuG{<~BrBg,rlsO:235B@bX}|d?a1!#`(6Vyn5@d##Y+jTv|vV~EfIj]uNpn~FRfH7Lq2vb1!a9-978BaU@@=Iz9978BbU}#~AJq0!(@@=Iz8978BaU@@=Iz7~AJQ|}!978BbU}!JvkaK!AdUa21-U#`a+(g/vsRn~Ou!5RPj:rmu9WhOjXuvvNr}:RhAj^v(pyw8unRn[kPr}p|u7vwv]RiSBd;pppzq@qHQa?(b.!a.a`@.|xa(hFv;Wiyj5uuv-7Riw~Cw`fg2WlU978BbU|wOuNBJqG!(P~EfD~CRlQcZ#X,k)u3vWs@u2]ksg;wEx'f@q1_2Wg.j]uNpn~FRfqJv]!15x'h{qG!(@@=IzK~CRl^j6v(us5x4i,#T(2WmY?C2F{1>Kq<aj1!*jTqIsBv=Wld~Cw`fj2Wl[j`v0u*~>RlT=c>Z,k#u3vWs@u2]kq<c1Z+jTqIsBv=Wle~Cw`fn2Wl]dn1#c(a(b^a2!b/bAT(bj!aDa7bu,a_a{c0!2T0g:v>ReD2@G{42@G{5~DpM~<5rc=Bx6i>{RT#RnI@zCx]y]z:2Jv[!zr5Awyk]9]k]dD(Y+X#6Vz.g=wKtgwhaCwgmTWj2Lu,w%_+/[y-B;b^xeg3u3Rj-2@bX{*KrJ<!+'@Wg(g?QRlC@Jv`!%b[zIwsfII}8JQ_@w|kW|=Jv(%!AqcOuNBJvEzh!bYzjLs@wP#(0!oy@>RkdJwMZtc3Dtd@BcG#T'9bWxg2@2Fznd*#Y+;2x'c}w<zizixNgwa#Z'U+!/!a'!a+w~g~z6wcn{Rn}wcnzRn|5Rh%=]nJg5vuRmvNvdRlvcprJu}w*az*a#!%.a.'Bot9qT]kj@Wg'ay2Gzv@Jv`!%b[zEwsfHI}1;ck#Ux`<Cbbx_Lu+w!a&0*!wko*wwo,So,}6Juqxf!E}PigQuyRm`d3(`#8>Rn%:A5B;bZ~%KvhCa!a2!x>k7#Uxb@b{#xaRk7Jw0!)>wwhlShl}6>wwhmShm}6CJvB!.x'hhvj{!!5Bwkhhbaz}x'hivjz~!5Bwkhibaz|xEhTrNu,v-vpD!a%&/)a3a.,%Ro2t[CE{)@3re9b]{%wjo09:rgc:Z&Ro6=<riifuaw&RmoKrNA!%(Ro4>Ro89;Ri`dSaL'UYzxZb)7Rka3xRhT&!,!#^1U}vbaz{>>@=be}yC@:D5bazzKu+A&!}{?ba}y>>@=be}wxBh[t`u~vJvr!%a!a()a,a0a4RoC=]o;Ju(!%RoGRhdwjh`=]oAg>w#Ro?g5vuRo=NvdRl|Ku]C.!&;RoEJvB!%RoORoMBx'h[v+_?w~h`}~5?w~hd~!xKh]oiptu-utv.vp!#%&a30a@a'a+(a/aOp(o~p!RoDJu(!%RoHRhewjha=]oBNvdRl}g>w#Ro@g5vuRo>c[#X']o<CauRoRAd-#Y':RkpauRoQKu]C.!&;RoFJvB!%RoNRoPBx'h]v+_?w~ha}t5?w~he}ue!/UbhYacXaW^Tc&a;b:a-c/#b&aja1(!cL+!bKbt!bmcRc9aIc?8[yW3Dtt94Rg`Jv}!&SiRMzBhEebShEMNuPRe>x7gL#TzuwjirRipc<Z&>on;>z=h-MSh.Mwqczx'a7vj&!>Re4@=ResJt__NuPRi*NuPRi)j]uNr|~FRfzKrJ>_+@Wfy@Wf]2WocKrJ<!+'@Wg%g/QRl@@Jv`!&awRl<wsfFIzgLu(w*!.*&ShBMwvhIRhI9;RhNx1hK'!#Sn]Mx1hK~0!#:2<H~7cNu+w7D*'1ZtW>Rn1~?rOc:Z&Rn2=<rQ<7wjh&=BSnLMc]#X(6Vz)w[b=a!U#9wzgMc3#&(RgMRitRis<x,gKt`ax!&+SioM=BSilMc3#&(RgKRinRimKurB,!&SiQMzBhDebShDM6BJQ!(P~Efx978B2@@=I}WLrJw!!,a*&@G}O@9wkibRid@@x'fKwC!&SlDMSfLMjUv~Q~EfKKv3@a+!(hFv-]mpx/hYZ(C5RiWz<o/MwkhY?So/M@x,gbvfB*&!SgEM:SoeeehFu3:Rgbda(,^TZa)X/7Sg[eb:2RgI~BrMC@wgkc:wwkcRerx3h(uUvK!&*,SnOM4Sh*MArRg;wHRh(x=h;rJvPwI!a4',a'0@Wg&=BSh/Mg>w=Rh=g3w*wwgGRgGcW(X#;Sg}M2Gzk@Jv`!&awRl=wsfGIz`dKZ*T'Y-:RhR7RhQg5u-p`j6v(us5d,#Y+~Awkia?RicOuNBwkibba}Ld6p~tyu_vbAa'a+!a/'a3aEa8a!>Sh,ebJv{!&Sh@ebSaReb9;SgwebNuPRi(NvdRl)NuPRi'hHu^<Rm^Jvv_@Wl(g;u1Si/ebKu'B&!*Sh?eb@Wl'z@aPeb95Si.ebcpputyvjB)!,&a+0a%ShAMWeK@G}C@WfJ9;RhMwvhH9w{ia}ix,hJvRA1(!zAn[MRhHx1hJ~*!#hFv(BSn[MBJQ!(@@=I~'978B2@@=I}2db.Ua<'X}+T#a0XaG2G}E;wkg|wuh!Rh!x,hZu,@)!&So0MVy)C5RiXACJvB!&5RiY5RiZg8w)cG}*T#2@bU}=KsA>(!a.3wkhZba~(x,h^u(A!&(SoCMRhb5Bz=h[eb?w~hb~6x,h_u(A!&(SoDMRhc5Bz=h]eb?w~hc~6e)aA1T#T,^^^c-bMb&blcPaP(a/!0!bA=b5c@a(!bfbrc#2afwmhARnjwchORnp2Wlf3DtsNvdRl-2@wpa<]m0bx(#:awRk2@Jw3!%RfhwpfgRlnKQB%!(G{V@G|'NuuRl6d='T+Y#VyUg<v~Rl~==G|<Jv+'!aYShC}6@B<5?ba~8@Jw3'!g2QRljhLrpWlOd+#Y'g.w'rIg>w*wgj@g-u0Rj@Lu+wT&)ZtUauq]~GrGci&U#F|39:rELrNvj!.%*RhCwunfw~nf~:9;Ri]>wtnhg;wHRnhx3hDs@v~!/+'@Wfr@9RkSNu&Rlo=@<5GzoKs0@_+@Wl+@awRkmJuh!-3d(}pY#qWJvj!%Rm(:Jw3!%Rm,Rm*de&!1U-U#`)Re;@G|.@9Ri82@wjfvRlq=@<5GzpLvOvr!).&2RlF8Rf`C=x!eE{.Jw3_g2QRlkhLrpWlPde(!#U{s,UXa*Ta'[y'g:v>ReS;x0PZ&RnlRnn~HrKJw1}f!=x!eB|2w]aP(#Xa&a*Ta.Ua2a7=]iOd'#Y&Ro&WnWg;u.RiDg6vjRiBNvdRlzhNvj]nYJuW_2Wm3x)kFze{9d])!a.!,Y01!#&aC!a3RndC=ox~BrC@2b^{pg,rlse7x'ksuq!%Rm.E{xidw(wBRmGx9o+)X#wwo-So-}69:Rl4@xSf@a#XZ'X)X,Ta(/ARl8b[xc>RfY:RlI:RfQwlg.ARl:9;Rlwdn'#^XafaQa1X1TaHTa)@b[{zcZ#X'7RkwWg@Ou4ARn&x)kG#{,g7u/RkGdH'U#Y*Vz'Wm&CARm|bx#(A]gUbUzJj9Q~=d,#Y(56H}l978H{U7d,0#U*2>ABb_xZ978BbU{e~AJQ{g!978BbU{hxMh?ad{oUYZ.x1h?{l!#:2<H{mx3n[t{vl!,&a%3Ro(z=iS}6ARnr=Bwsn^wvn`Rnbd`*T}B0!#^X'BG{c9b]{a>>@=be}F?JvS!&BG{d7BG}(Bde#`a1X,Ya@!a'P~=wxf@2bZ}I56B2@@=aybb}08@55B9;5bb}<j3vLv;<Jw3&!>Rfg=ayb^}&OuNBKuLA!)a!P~=x#fD{f2@>==<bbzl?C972@@=Ix^d6rSu,v7w*C(0a)a6#B+a%!sQ[y?3Dt%3[xn~<5rLOu!5p@Ku+D#'!t7~GrP~?rNKvlaya7'!h+v-5qMg=t|cd,U#5AAaa5Abb{S@52B5@a[@52B5Gx[iXueu;d<#`a(!/549C;ag>23ExY5@Dah89b^~689Jv)!~2b[~1Lv'w(%*!a#bX|aPrmawRe]keu7uhv-q6rxu,q`xTo]/a5aU!bNaDXbi!b-!ao!b<bwA!#5@B932:aV2G|:d-)Y#hJrL>RhG<7@C5<H|_=Cau:5aj5@B932:bJ|ng>vIbs)#?C2F|9jPv0w.vISh-MKvUaz(.!9ABbb|[5;5<H|Eg>unwfh;9:4E|YjQsBt|vjx'hYq3!(?C2F|J:2<BaY?C2F|GOu!5x,g|p{ah!-(?C2F|c9:4E|OjXuvvNr}:Rh&i[w*t|cd+U#jJvsu)vsSn~Mkfrmu9p}u7vwv]So!McW#Xa!ax5@A5aY:5;5<H|>kJv~vYrquJu3x4ib#T)2@SmZM?C2F|Bj:rmu9@xPhI(a*a#U#`a3-5Abb|L~@:RhK9:4E|0@52B5G|#C::aY?C2F|-:2<BaY?C2F|.5Jvk!a)javYrquJu3x4ia#T)2@SmYM?C2F|HAxPhH(!a#U#`a*-5Abb|4~@:RhJ9:4E|R@52B5G|F:2<BaY?C2F|Sc^#Xa2j=Qq5CJvB!-g<v{z;hhM?C2F|Zi[vrv{z;hiM?C2F|XKsA>!a)-g<v{z;h[eb?C2F|]i[vrv{z;h]eb?C2F|^iZu.vix,hZq3ah!.(?C2F|QOu!5ShXM:2<BaY?C2F|P", 13494, 2713, 49, 25, 61), me;
(function(e) {
  e[e.VALUE_LENGTH = 49152] = "VALUE_LENGTH", e[e.FLAG13 = 8192] = "FLAG13", e[e.BRANCH_LENGTH = 8064] = "BRANCH_LENGTH", e[e.JUMP_TABLE = 127] = "JUMP_TABLE", e[e.VALUE_MASK = 8191] = "VALUE_MASK";
})(me || (me = {}));
function ut(e) {
  "@babel/helpers - typeof";
  return ut = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, ut(e);
}
function Hi(e, t) {
  if (ut(e) != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var a = n.call(e, t);
    if (ut(a) != "object") return a;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Zi(e) {
  var t = Hi(e, "string");
  return ut(t) == "symbol" ? t : t + "";
}
function B(e, t, n) {
  return (t = Zi(t)) in e ? Object.defineProperty(e, t, {
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
var qt = 32, La = 21, Ki = 2097151, nn = 2047, $a = 0;
function Gi(e) {
  let t = e >>> La;
  return t === nn ? $a : t;
}
function Xi(e) {
  return e - we.ZERO >>> 0 <= 9;
}
function Yi(e) {
  return (e | qt) - we.LOWER_A >>> 0 <= 5;
}
function Vi(e) {
  return (e | qt) - we.LOWER_A >>> 0 <= 25;
}
var Dn;
(function(e) {
  e[e.EntityStart = 0] = "EntityStart", e[e.NumericStart = 1] = "NumericStart", e[e.NumericDecimal = 2] = "NumericDecimal", e[e.NumericHex = 3] = "NumericHex", e[e.NamedEntity = 4] = "NamedEntity";
})(Dn || (Dn = {}));
var Sn;
(function(e) {
  e[e.Legacy = 0] = "Legacy", e[e.Strict = 1] = "Strict", e[e.Attribute = 2] = "Attribute";
})(Sn || (Sn = {}));
function Qi(e, t, n, a) {
  let r = (t & me.BRANCH_LENGTH) >> 7, i = t & me.JUMP_TABLE;
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
function Tn(e, t, n) {
  return n === 1 ? String.fromCharCode(e[t] & me.VALUE_MASK) : n === 2 ? String.fromCharCode(e[t + 1]) : String.fromCharCode(e[t + 1], e[t + 2]);
}
function es(e, t, n) {
  let a = t + 1, r = 0, i = a;
  if (a < n && (e.charCodeAt(a) | qt) === we.LOWER_X) for (a += 1, i = a; a < n; ) {
    let s = e.charCodeAt(a);
    if (Xi(s)) r = r * 16 + (s - we.ZERO);
    else if (Yi(s)) r = r * 16 + ((s | qt) - we.LOWER_A + 10);
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
  return o >= nn && ($a = o, o = nn), o << La | r;
}
function ts(e, t, n) {
  let a = Wi, r = e.indexOf("&");
  if (r < 0) return e;
  let i = e.length, o = 0, s = "", l = a[0], u = l & me.JUMP_TABLE, p = (l & me.BRANCH_LENGTH) >> 7;
  do {
    let h = r + 1, f = e.charCodeAt(h), m, d;
    if (f === we.NUM) {
      let w = es(e, h, i);
      m = Gi(w), m > 0 && e.charCodeAt(h + m - 1) !== we.SEMI && (m = 0), d = m === 0 ? "" : Pi(w & Ki);
    } else if (Vi(f)) {
      m = 0, d = "";
      let w = f - u, z;
      if (w >>> 0 < p) {
        let v = a[1 + w];
        z = v === 0 ? -1 : p + v & 65535;
      } else z = -1;
      let k = 0, x = 0, y = z < 0 ? 0 : a[z], E = h + 1;
      e: for (; E < i; ) {
        for (; !(y & (me.VALUE_LENGTH | me.FLAG13)) && y & me.JUMP_TABLE; ) {
          let A = y & me.JUMP_TABLE, L = (y & me.BRANCH_LENGTH) >> 7;
          if (L === 0) {
            if (e.charCodeAt(E) !== A) break e;
            z += 1;
          } else {
            let j = e.charCodeAt(E) - A;
            if (j >>> 0 >= L) break e;
            let H = a[z + 1 + j];
            if (H === 0) break e;
            z = z + L + H & 65535;
          }
          if (y = a[z], E += 1, E >= i) break e;
        }
        if ((y & (me.VALUE_LENGTH | me.FLAG13)) === me.FLAG13) {
          let A = (y & me.BRANCH_LENGTH) >> 7;
          if (e.charCodeAt(E) !== (y & me.JUMP_TABLE)) break;
          E += 1;
          let L = A - 1, j = z + 1, H = 0;
          for (; H + 1 < L; H += 2) {
            let M = a[j];
            if (e.charCodeAt(E) !== (M & 255) || (E += 1, e.charCodeAt(E) !== (M >> 8 & 255))) break e;
            E += 1, j += 1;
          }
          if (H < L) {
            if (e.charCodeAt(E) !== (a[j] & 255)) break;
            E += 1;
          }
          z += 1 + (A >> 1), y = a[z];
          continue;
        }
        let v = y >>> 14, b = e.charCodeAt(E);
        if (v !== 0) {
          if (b === we.SEMI) {
            m = E - h + 1, d = v === 1 ? String.fromCharCode(y & me.VALUE_MASK) : Tn(a, z, v);
            break;
          }
          if (v === 1) break;
        }
        let T = Qi(a, y, z + (v || 1), b);
        if (T < 0) break;
        z = T, y = a[z], E += 1;
      }
      d === "" && m > 0 && (d = Tn(a, k, x));
    } else m = 0, d = "";
    m === 0 || n ? r = h : (o < r && (s += e.slice(o, r)), s += d, r = o = h + m), e.charCodeAt(r) !== we.AMP && (r = e.indexOf("&", r));
  } while (r >= 0);
  return s + e.slice(o);
}
function ja(e) {
  return ts(e, !0, !1);
}
var ns = /* @__PURE__ */ St({
  arrayReplaceAt: () => as,
  asciiTrim: () => Ft,
  callable: () => Ua,
  escapeHtml: () => Ge,
  escapeRE: () => ps,
  fromCodePoint: () => dt,
  isMdAsciiPunct: () => ft,
  isPunctChar: () => Ja,
  isPunctCharCode: () => pt,
  isSpace: () => ce,
  isValidEntityCode: () => fn,
  isWhiteSpace: () => ht,
  lib: () => fs,
  normalizeReference: () => Tt,
  unescapeAll: () => st,
  unescapeMd: () => os
});
function Ua(e) {
  let t = function(...n) {
    return Reflect.construct(e, n, new.target && new.target !== t ? new.target : e);
  };
  return Object.defineProperty(t, "name", { value: e.name }), Object.setPrototypeOf(t, e), t.prototype = e.prototype, t;
}
function as(e, t, n) {
  return [].concat(e.slice(0, t), n, e.slice(t + 1));
}
function fn(e) {
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
var Pa = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, rs = RegExp(`${Pa.source}|&([a-z#][a-z0-9]{1,31});`, "gi"), is = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function ss(e, t) {
  if (t.charCodeAt(0) === 35 && is.test(t)) {
    let a = t[1].toLowerCase() === "x" ? parseInt(t.slice(2), 16) : parseInt(t.slice(1), 10);
    return fn(a) ? dt(a) : e;
  }
  let n = ja(e);
  return n === e ? e : n;
}
function os(e) {
  return e.indexOf("\\") < 0 ? e : e.replace(Pa, "$1");
}
function st(e) {
  return e.indexOf("\\") < 0 && e.indexOf("&") < 0 ? e : e.replace(rs, function(t, n, a) {
    return n || ss(t, a);
  });
}
var ls = /[&<>"]/, cs = /[&<>"]/g, us = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
};
function ds(e) {
  return us[e];
}
function Ge(e) {
  return ls.test(e) ? e.replace(cs, ds) : e;
}
var hs = /[.?*+^$[\]\\(){}|-]/g;
function ps(e) {
  return e.replace(hs, "\\$&");
}
function ce(e) {
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
function Ja(e) {
  return pn.test(e) || Oa.test(e);
}
function pt(e) {
  return Ja(dt(e));
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
function Fn(e) {
  return e === 32 || e === 9 || e === 10 || e === 13;
}
function Ft(e) {
  let t = 0;
  for (; t < e.length && Fn(e.charCodeAt(t)); t++) ;
  let n = e.length - 1;
  for (; n >= t && Fn(e.charCodeAt(n)); n--) ;
  return e.slice(t, n + 1);
}
var fs = {
  mdurl: Oi,
  ucmicro: Bi
};
function gs(e, t, n) {
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
function ms(e, t, n) {
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
function bs(e, t, n, a) {
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
var vs = /* @__PURE__ */ St({
  parseLinkDestination: () => ms,
  parseLinkLabel: () => gs,
  parseLinkTitle: () => bs
}), Ye = class {
  constructor(e, t, n) {
    B(this, "map", null), B(this, "level", 0), B(this, "children", null), B(this, "content", ""), B(this, "markup", ""), B(this, "info", ""), B(this, "block", !1), B(this, "hidden", !1), this.type = e, this.tag = t, this.attrs = null, this.nesting = n, this.meta = null;
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
    B(this, "__rules__", []), B(this, "__cache__", null);
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
}, De = {};
De.code_inline = function(e, t, n, a, r) {
  let i = e[t];
  return `<code${r.renderAttrs(i)}>${Ge(i.content)}</code>`;
}, De.code_block = function(e, t, n, a, r) {
  let i = e[t];
  return `<pre${r.renderAttrs(i)}><code>${Ge(e[t].content)}</code></pre>
`;
}, De.fence = function(e, t, n, a, r) {
  let i = e[t], o = i.info ? st(i.info).trim() : "", s = "", l = "";
  if (o) {
    let p = o.split(/(\s+)/g);
    s = p[0], l = p.slice(2).join("");
  }
  let u;
  if (u = n.highlight && n.highlight(i.content, s, l) || Ge(i.content), u.indexOf("<pre") === 0) return u + `
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
}, De.image = function(e, t, n, a, r) {
  let i = e[t];
  return i.attrs[i.attrIndex("alt")][1] = r.renderInlineAsText(i.children, n, a), r.renderToken(e, t, n);
}, De.hardbreak = function(e, t, n) {
  return n.xhtmlOut ? `<br />
` : `<br>
`;
}, De.softbreak = function(e, t, n) {
  return n.breaks ? n.xhtmlOut ? `<br />
` : `<br>
` : `
`;
}, De.text = function(e, t) {
  return Ge(e[t].content);
}, De.html_block = function(e, t) {
  return e[t].content;
}, De.html_inline = function(e, t) {
  return e[t].content;
};
var Wa = class {
  constructor() {
    B(this, "rules", Object.assign({}, De));
  }
  renderAttrs(e) {
    let t, n, a;
    if (!e.attrs) return "";
    for (a = "", t = 0, n = e.attrs.length; t < n; t++) a += ` ${Ge(e.attrs[t][0])}="${Ge(String(e.attrs[t][1]))}"`;
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
}, Ha = class {
  constructor(e, t, n) {
    B(this, "tokens", []), B(this, "inlineMode", !1), B(this, "Token", Ye), this.src = e, this.env = n, this.md = t;
  }
}, ks = /\r\n?/g, zs = /\0/g;
function xs(e) {
  let t;
  t = e.src.replace(ks, `
`), t = t.replace(zs, "�"), e.src = t;
}
function _s(e) {
  let t;
  e.inlineMode ? (t = new e.Token("inline", "", 0), t.content = e.src, t.map = [0, 1], t.children = [], e.tokens.push(t)) : e.md.block.parse(e.src, e.md, e.env, e.tokens);
}
function ws(e) {
  let t = e.tokens, n = 0;
  for (let a = 0; a < t.length; a++) t[a].type !== "reference_definition" && (a !== n && (t[n] = t[a]), n++);
  t.length !== n && (t.length = n);
}
function ys(e) {
  let t = e.tokens;
  for (let n = 0, a = t.length; n < a; n++) {
    let r = t[n];
    r.type === "inline" && e.md.inline.parse(r.content, e.md, e.env, r.children);
  }
}
function qs(e) {
  return /^<a[>\s]/i.test(e);
}
function Rs(e) {
  return /^<\/a\s*>/i.test(e);
}
function Es(e) {
  let t = e.tokens;
  if (e.md.options.linkify) for (let n = 0, a = t.length; n < a; n++) {
    if (t[n].type !== "inline" || !e.md.linkify.test(t[n].content)) continue;
    let r = t[n].children, i = [], o = 0;
    for (let s = r.length - 1; s >= 0; s--) {
      let l = r[s];
      if (l.type === "link_close") for (s--; r[s].level !== l.level && r[s].type !== "link_open"; ) s--;
      else if (l.type === "html_inline" && (qs(l.content) && o > 0 && o--, Rs(l.content) && o++), !(o > 0) && l.type === "text" && e.md.linkify.test(l.content)) {
        let u = l.content, p = e.md.linkify.match(u), h = [], f = l.level, m = 0;
        p.length > 0 && p[0].index === 0 && s > 0 && r[s - 1].type === "text_special" && (p = p.slice(1));
        for (let d = 0; d < p.length; d++) {
          let w = p[d].url, z = e.md.normalizeLink(w);
          if (!e.md.validateLink(z)) continue;
          let k = p[d].text;
          k = p[d].schema ? p[d].schema === "mailto:" && !/^mailto:/i.test(k) ? e.md.normalizeLinkText(`mailto:${k}`).replace(/^mailto:/, "") : e.md.normalizeLinkText(k) : e.md.normalizeLinkText(`http://${k}`).replace(/^http:\/\//, "");
          let x = p[d].index;
          if (x > m) {
            let b = new e.Token("text", "", 0);
            b.content = u.slice(m, x), b.level = f, h.push(b);
          }
          let y = new e.Token("link_open", "a", 1);
          y.attrs = [["href", z]], y.level = f++, y.markup = "linkify", y.info = "auto", h.push(y);
          let E = new e.Token("text", "", 0);
          E.content = k, E.level = f, h.push(E);
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
var Za = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/, Cs = /\((c|tm|r)\)/i, As = /\((c|tm|r)\)/gi, Ns = {
  c: "©",
  r: "®",
  tm: "™"
};
function Ds(e, t) {
  return Ns[t.toLowerCase()];
}
function Ss(e) {
  let t = 0;
  for (let n = e.length - 1; n >= 0; n--) {
    let a = e[n];
    a.type === "text" && !t && (a.content = a.content.replace(As, Ds)), a.type === "link_open" && a.info === "auto" && t--, a.type === "link_close" && a.info === "auto" && t++;
  }
}
function Ts(e) {
  let t = 0;
  for (let n = e.length - 1; n >= 0; n--) {
    let a = e[n];
    a.type === "text" && !t && Za.test(a.content) && (a.content = a.content.replace(/\+-/g, "±").replace(/\.{2,}/g, "…").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/gm, "$1—").replace(/(^|\s)--(?=\s|$)/gm, "$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/gm, "$1–")), a.type === "link_open" && a.info === "auto" && t--, a.type === "link_close" && a.info === "auto" && t++;
  }
}
function Fs(e) {
  let t;
  if (e.md.options.typographer) for (t = e.tokens.length - 1; t >= 0; t--) e.tokens[t].type === "inline" && (Cs.test(e.tokens[t].content) && Ss(e.tokens[t].children), Za.test(e.tokens[t].content) && Ts(e.tokens[t].children));
}
var Ms = /['"]/, Mn = /['"]/g, In = "’", Is = 1e3;
function On(e, t, n) {
  for (; e.length > n; ) {
    let a = e.pop();
    a.isSingleQuote ? t.single = a.prevSameQuoteIdx : t.double = a.prevSameQuoteIdx;
  }
}
function vt(e, t, n, a) {
  e[t] || (e[t] = []), e[t].push({
    pos: n,
    ch: a
  });
}
function Os(e, t) {
  let n = "", a = 0;
  t.sort((r, i) => r.pos - i.pos);
  for (let r = 0; r < t.length; r++) {
    let i = t[r];
    n += e.slice(a, i.pos) + i.ch, a = i.pos + 1;
  }
  return n + e.slice(a);
}
function Bs(e, t) {
  let n, a = [], r = {
    single: -1,
    double: -1
  }, i = {};
  for (let o = 0; o < e.length; o++) {
    let s = e[o], l = e[o].level;
    for (n = a.length - 1; n >= 0 && !(a[n].level <= l); n--) ;
    if (On(a, r, n + 1), s.type !== "text") continue;
    let u = s.content, p = 0, h = u.length;
    e: for (; p < h; ) {
      Mn.lastIndex = p;
      let f = Mn.exec(u);
      if (!f) break;
      let m = !0, d = !0;
      p = f.index + 1;
      let w = f[0] === "'", z = 32;
      if (f.index - 1 >= 0) z = u.charCodeAt(f.index - 1);
      else for (n = o - 1; n >= 0 && e[n].type !== "softbreak" && e[n].type !== "hardbreak"; n--) if (e[n].content) {
        z = e[n].content.charCodeAt(e[n].content.length - 1);
        break;
      }
      let k = 32;
      if (p < h) k = u.charCodeAt(p);
      else for (n = o + 1; n < e.length && e[n].type !== "softbreak" && e[n].type !== "hardbreak"; n++) if (e[n].content) {
        k = e[n].content.charCodeAt(0);
        break;
      }
      let x = ft(z) || pt(z), y = ft(k) || pt(k), E = ht(z), v = ht(k);
      if (v ? m = !1 : y && (E || x || (m = !1)), E ? d = !1 : x && (v || y || (d = !1)), k === 34 && f[0] === '"' && z >= 48 && z <= 57 && (d = m = !1), m && d && (m = x, d = y), !m && !d) w && vt(i, o, f.index, In);
      else {
        if (d && (n = w ? r.single : r.double, n >= 0 && a[n].level === l)) {
          let b = a[n], T, A;
          w ? (T = t.md.options.quotes[2], A = t.md.options.quotes[3]) : (T = t.md.options.quotes[0], A = t.md.options.quotes[1]), vt(i, o, f.index, A), vt(i, b.tokenIdx, b.contentPos, T), On(a, r, n);
          continue e;
        }
        if (m) {
          if (a.length >= Is) return;
          a.push({
            tokenIdx: o,
            contentPos: f.index,
            isSingleQuote: w,
            level: l,
            prevSameQuoteIdx: w ? r.single : r.double
          }), w ? r.single = a.length - 1 : r.double = a.length - 1;
        } else d && w && vt(i, o, f.index, In);
      }
    }
  }
  Object.keys(i).forEach(function(o) {
    let s = Number(o);
    e[s].content = Os(e[s].content, i[o]);
  });
}
function Ls(e) {
  if (e.md.options.typographer) for (let t = e.tokens.length - 1; t >= 0; t--) e.tokens[t].type === "inline" && Ms.test(e.tokens[t].content) && Bs(e.tokens[t].children, e);
}
function $s(e) {
  let t, n, a = e.length;
  for (t = 0; t < a; t++) e[t].type === "text_special" && (e[t].type = "text");
  for (t = n = 0; t < a; t++) e[t].type === "text" && t + 1 < a && e[t + 1].type === "text" ? e[t + 1].content = e[t].content + e[t + 1].content : (t !== n && (e[n] = e[t]), n++);
  t !== n && (e.length = n);
}
function js(e) {
  let t, n, a = e.tokens, r = a.length;
  for (let i = 0; i < r; i++) {
    if (a[i].type !== "inline") continue;
    let o = a[i].children, s = o.length;
    for (t = 0; t < s; t++) o[t].type === "text_special" && (o[t].type = "text"), o[t].children && $s(o[t].children);
    for (t = n = 0; t < s; t++) o[t].type === "text" && t + 1 < s && o[t + 1].type === "text" ? o[t + 1].content = o[t].content + o[t + 1].content : (t !== n && (o[n] = o[t]), n++);
    t !== n && (o.length = n);
  }
}
var Lt = [
  ["normalize", xs],
  ["block", _s],
  ["strip_references", ws],
  ["inline", ys],
  ["linkify", Es],
  ["replacements", Fs],
  ["smartquotes", Ls],
  ["text_join", js]
], Ka = class {
  constructor() {
    B(this, "ruler", new gt()), B(this, "State", Ha);
    for (let e = 0; e < Lt.length; e++) this.ruler.push(Lt[e][0], Lt[e][1]);
  }
  process(e) {
    let t = this.ruler.getRules("");
    for (let n = 0, a = t.length; n < a; n++) t[n](e);
  }
}, Ga = class {
  constructor(e, t, n, a) {
    B(this, "bMarks", []), B(this, "eMarks", []), B(this, "tShift", []), B(this, "sCount", []), B(this, "bsCount", []), B(this, "blkIndent", 0), B(this, "line", 0), B(this, "lineMax", 0), B(this, "tight", !1), B(this, "listIndent", -1), B(this, "parentType", "root"), B(this, "level", 0), B(this, "Token", Ye), this.src = e, this.md = t, this.env = n, this.tokens = a;
    let r = this.src;
    for (let i = 0, o = 0, s = 0, l = 0, u = r.length, p = !1; o < u; o++) {
      let h = r.charCodeAt(o);
      if (!p) {
        if (ce(h)) {
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
    for (let t = this.src.length; e < t && ce(this.src.charCodeAt(e)); e++) ;
    return e;
  }
  skipSpacesBack(e, t) {
    if (e <= t) return e;
    for (; e > t; ) if (!ce(this.src.charCodeAt(--e))) return e + 1;
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
        if (ce(h)) h === 9 ? s += 4 - (s + this.bsCount[o]) % 4 : s++;
        else if (u - l < this.tShift[o]) s++;
        else break;
        u++;
      }
      s > n ? r[i] = Array(s - n + 1).join(" ") + this.src.slice(u, p) : r[i] = this.src.slice(u, p);
    }
    return r.join("");
  }
}, Us = 65536;
function $t(e, t) {
  let n = e.bMarks[t] + e.tShift[t], a = e.eMarks[t];
  return e.src.slice(n, a);
}
function Bn(e) {
  let t = [], n = e.length, a = 0, r = e.charCodeAt(a), i = !1, o = 0, s = "";
  for (; a < n; ) r === 124 && (i ? (s += e.substring(o, a - 1), o = a) : (t.push(s + e.substring(o, a)), s = "", o = a + 1)), i = r === 92, a++, r = e.charCodeAt(a);
  return t.push(s + e.substring(o)), t;
}
function Ps(e, t, n, a) {
  if (t + 2 > n) return !1;
  let r = t + 1;
  if (e.sCount[r] < e.blkIndent || e.sCount[r] - e.blkIndent >= 4) return !1;
  let i = e.bMarks[r] + e.tShift[r];
  if (i >= e.eMarks[r]) return !1;
  let o = e.src.charCodeAt(i++);
  if (o !== 124 && o !== 45 && o !== 58 || i >= e.eMarks[r]) return !1;
  let s = e.src.charCodeAt(i++);
  if (s !== 124 && s !== 45 && s !== 58 && !ce(s) || o === 45 && ce(s)) return !1;
  for (; i < e.eMarks[r]; ) {
    let E = e.src.charCodeAt(i);
    if (E !== 124 && E !== 45 && E !== 58 && !ce(E)) return !1;
    i++;
  }
  let l = $t(e, t + 1), u = l.split("|"), p = [];
  for (let E = 0; E < u.length; E++) {
    let v = u[E].trim();
    if (!v) {
      if (E === 0 || E === u.length - 1) continue;
      return !1;
    }
    if (!/^:?-+:?$/.test(v)) return !1;
    v.charCodeAt(v.length - 1) === 58 ? p.push(v.charCodeAt(0) === 58 ? "center" : "right") : v.charCodeAt(0) === 58 ? p.push("left") : p.push("");
  }
  if (l = $t(e, t).trim(), l.indexOf("|") === -1 || e.sCount[t] - e.blkIndent >= 4) return !1;
  u = Bn(l), u.length && u[0] === "" && u.shift(), u.length && u[u.length - 1] === "" && u.pop();
  let h = u.length;
  if (h === 0 || h !== p.length) return !1;
  if (a) return !0;
  let f = e.parentType;
  e.parentType = "table";
  let m = e.md.block.ruler.getRules("blockquote"), d = e.push("table_open", "table", 1), w = [t, 0];
  d.map = w;
  let z = e.push("thead_open", "thead", 1);
  z.map = [t, t + 1];
  let k = e.push("tr_open", "tr", 1);
  k.map = [t, t + 1];
  for (let E = 0; E < u.length; E++) {
    let v = e.push("th_open", "th", 1);
    p[E] && (v.attrs = [["style", `text-align:${p[E]}`]]);
    let b = e.push("inline", "", 0);
    b.content = u[E].trim(), b.children = [], e.push("th_close", "th", -1);
  }
  e.push("tr_close", "tr", -1), e.push("thead_close", "thead", -1);
  let x, y = 0;
  for (r = t + 2; r < n && !(e.sCount[r] < e.blkIndent); r++) {
    let E = !1;
    for (let b = 0, T = m.length; b < T; b++) if (m[b](e, r, n, !0)) {
      E = !0;
      break;
    }
    if (E || (l = $t(e, r).trim(), !l) || e.sCount[r] - e.blkIndent >= 4 || (u = Bn(l), u.length && u[0] === "" && u.shift(), u.length && u[u.length - 1] === "" && u.pop(), y += h - u.length, y > Us)) break;
    if (r === t + 2) {
      let b = e.push("tbody_open", "tbody", 1);
      b.map = x = [t + 2, 0];
    }
    let v = e.push("tr_open", "tr", 1);
    v.map = [r, r + 1];
    for (let b = 0; b < h; b++) {
      let T = e.push("td_open", "td", 1);
      p[b] && (T.attrs = [["style", `text-align:${p[b]}`]]);
      let A = e.push("inline", "", 0);
      A.content = u[b] ? u[b].trim() : "", A.children = [], e.push("td_close", "td", -1);
    }
    e.push("tr_close", "tr", -1);
  }
  return x && (e.push("tbody_close", "tbody", -1), x[1] = r), e.push("table_close", "table", -1), w[1] = r, e.parentType = f, e.line = r, !0;
}
function Js(e, t, n) {
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
function Ws(e, t, n, a) {
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
function Hs(e, t, n, a) {
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
      let A = v;
      for (s.push(e.bMarks[d]), e.bMarks[d] = r; r < i; ) {
        let L = e.src.charCodeAt(r);
        if (ce(L)) L === 9 ? A += 4 - (A + e.bsCount[d] + +!!T) % 4 : A++;
        else break;
        r++;
      }
      m = r >= i, l.push(e.bsCount[d]), e.bsCount[d] = e.sCount[d] + 1 + +!!b, u.push(e.sCount[d]), e.sCount[d] = A - v, p.push(e.tShift[d]), e.tShift[d] = r - e.bMarks[d];
      continue;
    }
    if (m) break;
    let E = !1;
    for (let v = 0, b = h.length; v < b; v++) if (h[v](e, d, n, !0)) {
      E = !0;
      break;
    }
    if (E) {
      e.lineMax = d, e.blkIndent !== 0 && (s.push(e.bMarks[d]), l.push(e.bsCount[d]), p.push(e.tShift[d]), u.push(e.sCount[d]), e.sCount[d] -= e.blkIndent);
      break;
    }
    s.push(e.bMarks[d]), l.push(e.bsCount[d]), p.push(e.tShift[d]), u.push(e.sCount[d]), e.sCount[d] = -1;
  }
  let w = e.blkIndent;
  e.blkIndent = 0;
  let z = e.push("blockquote_open", "blockquote", 1);
  z.markup = ">";
  let k = [t, 0];
  z.map = k, e.md.block.tokenize(e, t, d);
  let x = e.push("blockquote_close", "blockquote", -1);
  x.markup = ">", e.lineMax = o, e.parentType = f, k[1] = e.line;
  for (let y = 0; y < p.length; y++) e.bMarks[y + t] = s[y], e.tShift[y + t] = p[y], e.sCount[y + t] = u[y], e.bsCount[y + t] = l[y];
  return e.blkIndent = w, !0;
}
function Zs(e, t, n, a) {
  let r = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4) return !1;
  let i = e.bMarks[t] + e.tShift[t], o = e.src.charCodeAt(i++);
  if (o !== 42 && o !== 45 && o !== 95) return !1;
  let s = 1;
  for (; i < r; ) {
    let u = e.src.charCodeAt(i++);
    if (u !== o && !ce(u)) return !1;
    u === o && s++;
  }
  if (s < 3) return !1;
  if (a) return !0;
  e.line = t + 1;
  let l = e.push("hr", "hr", 0);
  return l.map = [t, e.line], l.markup = Array(s + 1).join(String.fromCharCode(o)), !0;
}
function Ln(e, t) {
  let n = e.eMarks[t], a = e.bMarks[t] + e.tShift[t], r = e.src.charCodeAt(a++);
  return r !== 42 && r !== 45 && r !== 43 || a < n && !ce(e.src.charCodeAt(a)) ? -1 : a;
}
function $n(e, t) {
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
  return r < a && (i = e.src.charCodeAt(r), !ce(i)) ? -1 : r;
}
function Ks(e, t) {
  let n = e.level + 2;
  for (let a = t + 2, r = e.tokens.length - 2; a < r; a++) e.tokens[a].level === n && e.tokens[a].type === "paragraph_open" && (e.tokens[a + 2].hidden = !0, e.tokens[a].hidden = !0, a += 2);
}
function Gs(e, t, n, a) {
  let r, i, o, s, l = t, u = !0;
  if (e.sCount[l] - e.blkIndent >= 4 || e.listIndent >= 0 && e.sCount[l] - e.listIndent >= 4 && e.sCount[l] < e.blkIndent) return !1;
  let p = !1;
  a && e.parentType === "paragraph" && e.sCount[l] >= e.blkIndent && (p = !0);
  let h, f, m;
  if ((m = $n(e, l)) >= 0) {
    if (h = !0, o = e.bMarks[l] + e.tShift[l], f = Number(e.src.slice(o, m - 1)), p && f !== 1) return !1;
  } else if ((m = Ln(e, l)) >= 0) h = !1;
  else return !1;
  if (p && e.skipSpaces(m) >= e.eMarks[l]) return !1;
  if (a) return !0;
  let d = e.src.charCodeAt(m - 1), w = e.tokens.length;
  h ? (s = e.push("ordered_list_open", "ol", 1), f !== 1 && (s.attrs = [["start", f]])) : s = e.push("bullet_list_open", "ul", 1);
  let z = [l, 0];
  s.map = z, s.markup = String.fromCharCode(d);
  let k = !1, x = e.md.block.ruler.getRules("list"), y = e.parentType;
  for (e.parentType = "list"; l < n; ) {
    i = m, r = e.eMarks[l];
    let E = e.sCount[l] + m - (e.bMarks[l] + e.tShift[l]), v = E;
    for (; i < r; ) {
      let re = e.src.charCodeAt(i);
      if (re === 9) v += 4 - (v + e.bsCount[l]) % 4;
      else if (re === 32) v++;
      else break;
      i++;
    }
    let b = i, T;
    T = b >= r ? 1 : v - E, T > 4 && (T = 1);
    let A = E + T;
    s = e.push("list_item_open", "li", 1), s.markup = String.fromCharCode(d);
    let L = [l, 0];
    s.map = L, h && (s.info = e.src.slice(o, m - 1));
    let j = e.tight, H = e.tShift[l], M = e.sCount[l], Z = e.listIndent;
    if (e.listIndent = e.blkIndent, e.blkIndent = A, e.tight = !0, e.tShift[l] = b - e.bMarks[l], e.sCount[l] = v, b >= r && e.isEmpty(l + 1) ? e.line = Math.min(e.line + 2, n) : e.md.block.tokenize(e, l, n), (!e.tight || k) && (u = !1), k = e.line - l > 1 && e.isEmpty(e.line - 1), e.blkIndent = e.listIndent, e.listIndent = Z, e.tShift[l] = H, e.sCount[l] = M, e.tight = j, s = e.push("list_item_close", "li", -1), s.markup = String.fromCharCode(d), l = e.line, L[1] = l, l >= n || e.sCount[l] < e.blkIndent || e.sCount[l] - e.blkIndent >= 4) break;
    let Y = !1;
    for (let re = 0, C = x.length; re < C; re++) if (x[re](e, l, n, !0)) {
      Y = !0;
      break;
    }
    if (Y) break;
    if (h) {
      if (m = $n(e, l), m < 0) break;
      o = e.bMarks[l] + e.tShift[l];
    } else if (m = Ln(e, l), m < 0) break;
    if (d !== e.src.charCodeAt(m - 1)) break;
  }
  return s = h ? e.push("ordered_list_close", "ol", -1) : e.push("bullet_list_close", "ul", -1), s.markup = String.fromCharCode(d), z[1] = l, e.line = l, e.parentType = y, u && Ks(e, w), !0;
}
var jt = 999;
function Xs(e) {
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
function Ys(e, t, n, a) {
  let r = e.src, i = e.bMarks[t] + e.tShift[t], o = t + 1;
  if (e.sCount[t] - e.blkIndent >= 4 || r.charCodeAt(i) !== 91) return !1;
  let s = lt(e, t), l = "", u = -1, p = ++i;
  for (; i < s; ) {
    if (l.length + i - p > jt * 2) return !1;
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
  if (u < 0 || r.charCodeAt(u + 1) !== 58 || (l += r.slice(p, u), l.length > jt && Xs(l) > jt)) return !1;
  for (i = u + 2; i < s; ) {
    let b = r.charCodeAt(i);
    if (b === 10) {
      let T = kt(e, o);
      if (T < 0) break;
      i = T, s = lt(e, o++);
    } else if (ce(b)) i++;
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
    } else if (ce(b)) i++;
    else break;
  }
  let z = i, k = e.md.helpers.parseLinkTitle(r, i, s);
  for (; k.can_continue; ) {
    let b = kt(e, o);
    if (b < 0) break;
    i = b, s = lt(e, o++), k = e.md.helpers.parseLinkTitle(r, i, s, k);
  }
  let x;
  for (z !== m && k.ok ? (x = k.str, i = k.pos) : (x = "", i = m, s = d, o = w); i < s && ce(r.charCodeAt(i)); ) i++;
  if (i < s && r.charCodeAt(i) !== 10 && x) for (x = "", i = m, s = d, o = w; i < s && ce(r.charCodeAt(i)); ) i++;
  if (i < s && r.charCodeAt(i) !== 10) return !1;
  let y = Tt(l);
  if (!y) return !1;
  if (a) return !0;
  e.env.references === void 0 && (e.env.references = {}), e.env.references[y] === void 0 && (e.env.references[y] = {
    title: x,
    href: f
  });
  let E = e.push("reference_definition", "", 0);
  E.map = [t, o], E.hidden = !0;
  let v = /* @__PURE__ */ Object.create(null);
  return v.label = y, E.meta = v, e.line = o, !0;
}
var Vs = /* @__PURE__ */ "address.article.aside.base.basefont.blockquote.body.caption.center.col.colgroup.dd.details.dialog.dir.div.dl.dt.fieldset.figcaption.figure.footer.form.frame.frameset.h1.h2.h3.h4.h5.h6.head.header.hr.html.iframe.legend.li.link.main.menu.menuitem.nav.noframes.ol.optgroup.option.p.param.search.section.summary.table.tbody.td.tfoot.th.thead.title.tr.track.ul".split("."), Qs = `<[A-Za-z][A-Za-z0-9\\-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*"))?)*\\s*\\/?>`, eo = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>", Xa = RegExp(`^(?:${Qs}|${eo})`), Ke = [
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
    RegExp(`^</?(${Vs.join("|")})(?=(\\s|/?>|$))`, "i"),
    /^$/,
    !0
  ],
  [
    RegExp(`${Xa.source}\\s*$`),
    /^$/,
    !1
  ]
];
function to(e, t, n, a) {
  let r = e.bMarks[t] + e.tShift[t], i = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4 || !e.md.options.html || e.src.charCodeAt(r) !== 60) return !1;
  let o = e.src.slice(r, i), s = 0;
  for (; s < Ke.length && !Ke[s][0].test(o); s++) ;
  if (s === Ke.length) return !1;
  if (a) return Ke[s][2];
  let l = t + 1, u = Ke[s][1].test("");
  if (!Ke[s][1].test(o)) {
    for (; l < n && !(e.sCount[l] < e.blkIndent && (u || !e.isEmpty(l))); l++) if (r = e.bMarks[l] + e.tShift[l], i = e.eMarks[l], o = e.src.slice(r, i), Ke[s][1].test(o)) {
      o.length !== 0 && l++;
      break;
    }
  }
  e.line = l;
  let p = e.push("html_block", "", 0);
  return p.map = [t, l], p.content = e.getLines(t, l, e.blkIndent, !0), !0;
}
function no(e, t, n, a) {
  let r = e.bMarks[t] + e.tShift[t], i = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4) return !1;
  let o = e.src.charCodeAt(r);
  if (o !== 35 || r >= i) return !1;
  let s = 1;
  for (o = e.src.charCodeAt(++r); o === 35 && r < i && s <= 6; ) s++, o = e.src.charCodeAt(++r);
  if (s > 6 || r < i && !ce(o)) return !1;
  if (a) return !0;
  i = e.skipSpacesBack(i, r);
  let l = e.skipCharsBack(i, 35, r);
  l > r && ce(e.src.charCodeAt(l - 1)) && (i = l), e.line = t + 1;
  let u = e.push("heading_open", `h${s}`, 1);
  u.markup = "########".slice(0, s), u.map = [t, e.line];
  let p = e.push("inline", "", 0);
  p.content = Ft(e.src.slice(r, i)), p.map = [t, e.line], p.children = [];
  let h = e.push("heading_close", `h${s}`, -1);
  return h.markup = "########".slice(0, s), !0;
}
function ao(e, t, n) {
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
function ro(e, t, n) {
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
var zt = [
  [
    "table",
    Ps,
    ["paragraph", "reference"]
  ],
  ["code", Js],
  [
    "fence",
    Ws,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "blockquote",
    Hs,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "hr",
    Zs,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "list",
    Gs,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  ["reference", Ys],
  [
    "html_block",
    to,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  [
    "heading",
    no,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  ["lheading", ao],
  ["paragraph", ro]
], Ya = class {
  constructor() {
    B(this, "ruler", new gt()), B(this, "State", Ga);
    for (let e = 0; e < zt.length; e++) this.ruler.push(zt[e][0], zt[e][1], { alt: (zt[e][2] || []).slice() });
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
}, Va = class {
  constructor(e, t, n, a) {
    B(this, "pos", 0), B(this, "level", 0), B(this, "pending", ""), B(this, "pendingLevel", 0), B(this, "cache", {}), B(this, "backticks", {}), B(this, "backticksScanned", !1), B(this, "skipHtmlSpecial", !1), B(this, "linkLevel", 0), B(this, "delimiters", []), B(this, "_prev_delimiters", []), B(this, "Token", Ye), this.src = e, this.env = n, this.md = t, this.tokens = a, this.tokens_meta = Array(a.length), this.posMax = this.src.length;
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
function io(e) {
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
function so(e, t) {
  let n = e.pos;
  for (; n < e.posMax && !io(e.src.charCodeAt(n)); ) n++;
  return n !== e.pos && (t || (e.pending += e.src.slice(e.pos, n)), e.pos = n, !0);
}
function oo(e) {
  return e >= 65 && e <= 90 || e >= 97 && e <= 122;
}
function lo(e) {
  return e >= 65 && e <= 90 || e >= 97 && e <= 122 || e >= 48 && e <= 57 || e === 43 || e === 45 || e === 46;
}
function co(e, t) {
  if (!e.md.options.linkify || e.linkLevel > 0) return !1;
  let n = e.pos, a = e.posMax;
  if (n + 3 > a || e.src.charCodeAt(n) !== 58 || e.src.charCodeAt(n + 1) !== 47 || e.src.charCodeAt(n + 2) !== 47) return !1;
  let r = n - Math.min(10, e.pending.length, n), i = n;
  for (; i > r && lo(e.src.charCodeAt(i - 1)); ) i--;
  if (i === n || !oo(e.src.charCodeAt(i))) return !1;
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
function uo(e, t) {
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
  for (n++; n < r && ce(e.src.charCodeAt(n)); ) n++;
  return e.pos = n, !0;
}
var gn = [];
for (let e = 0; e < 256; e++) gn.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(e) {
  gn[e.charCodeAt(0)] = 1;
});
function ho(e, t) {
  let n = e.pos, a = e.posMax;
  if (e.src.charCodeAt(n) !== 92 || (n++, n >= a)) return !1;
  let r = e.src.charCodeAt(n);
  if (r === 10) {
    for (t || e.push("hardbreak", "br", 0), n++; n < a && (r = e.src.charCodeAt(n), ce(r)); ) n++;
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
    s.content = r < 256 && gn[r] !== 0 ? i : o, s.markup = o, s.info = "escape";
  }
  return e.pos = n + 1, !0;
}
function po(e) {
  let t = {}, n = 0;
  for (; (n = e.indexOf("`", n)) !== -1; ) {
    let a = n;
    for (; e.charCodeAt(++n) === 96; ) ;
    t[n - a] = a;
  }
  return t;
}
function fo(e, t) {
  var n;
  let a = e.pos;
  if (e.src.charCodeAt(a) !== 96) return !1;
  let r = e.posMax, i = a + 1;
  for (; i < r && e.src.charCodeAt(i) === 96; ) i++;
  let o = e.src.slice(a, i), s = o.length;
  if (e.backticksScanned || (e.backticks = po(e.src), e.backticksScanned = !0), ((n = e.backticks[s]) == null ? -1 : n) >= i) {
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
function go(e, t) {
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
function jn(e, t) {
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
function mo(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  jn(e, e.delimiters);
  for (let r = 0; r < n; r++) {
    var a;
    let i = (a = t[r]) == null ? void 0 : a.delimiters;
    i && jn(e, i);
  }
}
var Qa = {
  tokenize: go,
  postProcess: mo
};
function bo(e, t) {
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
function Un(e, t) {
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
function vo(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  Un(e, e.delimiters);
  for (let r = 0; r < n; r++) {
    var a;
    let i = (a = t[r]) == null ? void 0 : a.delimiters;
    i && Un(e, i);
  }
}
var er = {
  tokenize: bo,
  postProcess: vo
};
function ko(e, t) {
  let n, a, r, i, o = "", s = "", l = e.pos, u = !0;
  if (e.src.charCodeAt(e.pos) !== 91) return !1;
  let p = e.pos, h = e.posMax, f = e.pos + 1, m = e.md.helpers.parseLinkLabel(e, e.pos, !0);
  if (m < 0) return !1;
  let d = m + 1;
  if (d < h && e.src.charCodeAt(d) === 40) {
    for (u = !1, d++; d < h && (n = e.src.charCodeAt(d), ce(n) || n === 10); d++) ;
    if (d >= h) return !1;
    if (l = d, r = e.md.helpers.parseLinkDestination(e.src, d, e.posMax), r.ok) {
      for (o = e.md.normalizeLink(r.str), e.md.validateLink(o) ? d = r.pos : o = "", l = d; d < h && (n = e.src.charCodeAt(d), ce(n) || n === 10); d++) ;
      if (r = e.md.helpers.parseLinkTitle(e.src, d, e.posMax), d < h && l !== d && r.ok) for (s = r.str, d = r.pos; d < h && (n = e.src.charCodeAt(d), ce(n) || n === 10); d++) ;
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
    let w = e.push("link_open", "a", 1), z = [["href", o]];
    if (w.attrs = z, s && z.push(["title", s]), a) {
      let k = /* @__PURE__ */ Object.create(null);
      k.label = a, w.meta = k;
    }
    e.linkLevel++, e.md.inline.tokenize(e), e.linkLevel--, e.push("link_close", "a", -1);
  }
  return e.pos = d, e.posMax = h, !0;
}
function zo(e, t) {
  let n, a, r, i, o, s, l, u, p = "", h = e.pos, f = e.posMax;
  if (e.src.charCodeAt(e.pos) !== 33 || e.src.charCodeAt(e.pos + 1) !== 91) return !1;
  let m = e.pos + 2, d = e.md.helpers.parseLinkLabel(e, e.pos + 1, !1);
  if (d < 0) return !1;
  if (i = d + 1, i < f && e.src.charCodeAt(i) === 40) {
    for (i++; i < f && (n = e.src.charCodeAt(i), ce(n) || n === 10); i++) ;
    if (i >= f) return !1;
    for (u = i, s = e.md.helpers.parseLinkDestination(e.src, i, e.posMax), s.ok && (p = e.md.normalizeLink(s.str), e.md.validateLink(p) ? i = s.pos : p = ""), u = i; i < f && (n = e.src.charCodeAt(i), ce(n) || n === 10); i++) ;
    if (s = e.md.helpers.parseLinkTitle(e.src, i, e.posMax), i < f && u !== i && s.ok) for (l = s.str, i = s.pos; i < f && (n = e.src.charCodeAt(i), ce(n) || n === 10); i++) ;
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
    let z = e.push("image", "img", 0), k = [["src", p], ["alt", ""]];
    if (z.attrs = k, z.children = w, z.content = a, l && k.push(["title", l]), r) {
      let x = /* @__PURE__ */ Object.create(null);
      x.label = r, z.meta = x;
    }
  }
  return e.pos = i, e.posMax = f, !0;
}
var xo = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/, _o = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function wo(e, t) {
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
  if (_o.test(i)) {
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
  if (xo.test(i)) {
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
function yo(e) {
  return /^<a[>\s]/i.test(e);
}
function qo(e) {
  return /^<\/a\s*>/i.test(e);
}
function tr(e) {
  let t = e | 32;
  return t >= 97 && t <= 122;
}
function Ro(e, t) {
  let n = e.src, a, r;
  if (n.startsWith("<!--", t)) {
    if (n.startsWith(">", t + 4)) return t + 5;
    if (n.startsWith("->", t + 4)) return t + 6;
    a = t + 4, r = "-->";
  } else if (n.startsWith("<![CDATA[", t)) a = t + 9, r = "]]>";
  else if (n.charCodeAt(t + 1) === 63) a = t + 2, r = "?>";
  else if (tr(n.charCodeAt(t + 2))) a = t + 3, r = ">";
  else return -1;
  if (e.skipHtmlSpecial) return -1;
  let i = n.indexOf(r, a);
  return i < 0 ? (e.skipHtmlSpecial = !0, -1) : i + r.length;
}
function Eo(e, t) {
  if (!e.md.options.html) return !1;
  let n = e.posMax, a = e.pos;
  if (e.src.charCodeAt(a) !== 60 || a + 2 >= n) return !1;
  let r, i = e.src.charCodeAt(a + 1);
  if (i === 33 || i === 63) r = Ro(e, a);
  else if (i === 47 || tr(i)) {
    let o = e.src.slice(a).match(Xa);
    r = o ? a + o[0].length : -1;
  } else return !1;
  if (r < 0) return !1;
  if (!t) {
    let o = e.push("html_inline", "", 0);
    o.content = e.src.slice(a, r), yo(o.content) && e.linkLevel++, qo(o.content) && e.linkLevel--;
  }
  return e.pos = r, !0;
}
var Co = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i, Ao = /^&([a-z][a-z0-9]{1,31});/i;
function No(e, t) {
  let n = e.pos, a = e.posMax;
  if (e.src.charCodeAt(n) !== 38 || n + 1 >= a) return !1;
  if (e.src.charCodeAt(n + 1) === 35) {
    let r = e.src.slice(n).match(Co);
    if (r) {
      if (!t) {
        let i = r[1][0].toLowerCase() === "x" ? parseInt(r[1].slice(1), 16) : parseInt(r[1], 10), o = e.push("text_special", "", 0);
        o.content = fn(i) ? dt(i) : dt(65533), o.markup = r[0], o.info = "entity";
      }
      return e.pos += r[0].length, !0;
    }
  } else {
    let r = e.src.slice(n).match(Ao);
    if (r) {
      let i = ja(r[0]);
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
function Pn(e) {
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
function Do(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  Pn(e.delimiters);
  for (let r = 0; r < n; r++) {
    var a;
    let i = (a = t[r]) == null ? void 0 : a.delimiters;
    i && Pn(i);
  }
}
function So(e) {
  let t, n, a = 0, r = e.tokens, i = e.tokens.length;
  for (t = n = 0; t < i; t++) r[t].nesting < 0 && a--, r[t].level = a, r[t].nesting > 0 && a++, r[t].type === "text" && t + 1 < i && r[t + 1].type === "text" ? r[t + 1].content = r[t].content + r[t + 1].content : (t !== n && (r[n] = r[t]), n++);
  t !== n && (r.length = n);
}
var Ut = [
  ["text", so],
  ["linkify", co],
  ["newline", uo],
  ["escape", ho],
  ["backticks", fo],
  ["strikethrough", Qa.tokenize],
  ["emphasis", er.tokenize],
  ["link", ko],
  ["image", zo],
  ["autolink", wo],
  ["html_inline", Eo],
  ["entity", No]
], Pt = [
  ["balance_pairs", Do],
  ["strikethrough", Qa.postProcess],
  ["emphasis", er.postProcess],
  ["fragments_join", So]
], nr = class {
  constructor() {
    B(this, "ruler", new gt()), B(this, "ruler2", new gt()), B(this, "State", Va);
    for (let e = 0; e < Ut.length; e++) this.ruler.push(Ut[e][0], Ut[e][1]);
    for (let e = 0; e < Pt.length; e++) this.ruler2.push(Pt[e][0], Pt[e][1]);
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
}, To = class {
  constructor(e = {}) {
    B(this, "src_Any", Ma.source), B(this, "src_Cc", Ia.source), B(this, "src_Z", Ba.source), B(this, "src_P", pn.source), B(this, "src_ZPCc", [
      this.src_Z,
      this.src_P,
      this.src_Cc
    ].join("|")), B(this, "src_ZCc", [this.src_Z, this.src_Cc].join("|")), B(this, "cache", {}), B(this, "opts", {
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
}, Jt = {
  validate: (e, t, n) => {
    let a = n.re.get_http_validator();
    a.lastIndex = t;
    let r = a.exec(e);
    return r ? r[0].length : 0;
  },
  normalize: (e, t) => t.normalize(e)
}, Fo = {
  "http:": Jt,
  "https:": Jt,
  "ftp:": Jt,
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
}, Mo = "a:cdefgilmnoqrstuwxz|b:abdefghijmnorstvwyz|c:acdfghiklmnoruvwxyz|d:ejkmoz|e:cegrstu|f:ijkmor|g:abdefghilmnpqrstuwy|h:kmnrtu|i:delmnoqrst|j:emop|k:eghimnprwyz|l:abcikrstuvy|m:acdeghklmnopqrstuvwxyz|n:acefgilopruz|o:m|p:aefghklmnrstwy|q:a|r:eosuw|s:abcdeghijklmnortuvxyz|t:cdfghjklmnortvwz|u:agksyz|v:aceginu|w:fs|y:et|z:amw", Io = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф";
function Oo() {
  let e = Io.split("|");
  return Mo.split("|").forEach((t) => {
    let n = t.indexOf(":"), a = t.slice(0, n);
    for (let r of t.slice(n + 1)) e.push(a + r);
  }), e;
}
var Bo = {
  fuzzyLink: !1,
  fuzzyEmail: !0,
  fuzzyIP: !1,
  "---": !1,
  tlds: Oo(),
  urlAuth: !1,
  maxLength: 1e4
}, Jn = class {
  constructor(e, t, n, a) {
    B(this, "schema", void 0), B(this, "index", void 0), B(this, "lastIndex", void 0), B(this, "raw", void 0), B(this, "text", void 0), B(this, "url", void 0);
    let r = e.slice(n, a);
    this.schema = t.toLowerCase(), this.index = n, this.lastIndex = a, this.raw = r, this.text = r, this.url = r;
  }
}, Lo = class {
  constructor(e = {}) {
    B(this, "__opts__", void 0), B(this, "__schemas__", void 0), B(this, "re", void 0);
    let { rebuilder: t, ...n } = e;
    this.__opts__ = {
      ...Bo,
      ...n
    }, this.__schemas__ = { ...Fo }, this.re = t || new To(), this.re.set({
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
        let x = r.exec(e);
        if (!x) {
          h = !0, s = void 0;
          break;
        }
        let y = i.exec(e.slice(Math.max(0, x.index - 65), x.index));
        if (y) {
          if (s = {
            schema: "mailto:",
            index: x.index - y[1].length,
            lastIndex: x.index + x[0].length
          }, s.index >= f) break;
          r.lastIndex < m && (r.lastIndex = m);
        }
      }
      if (a && !p && (!o || o.index < f)) for (a.lastIndex < m && (a.lastIndex = m); ; ) {
        let x = a.exec(e);
        if (!x) {
          p = !0, o = void 0;
          break;
        }
        if (o = {
          schema: "",
          index: x.index + x[1].length,
          lastIndex: x.index + x[0].length
        }, o.index >= f) break;
        a.lastIndex < m && (a.lastIndex = m);
      }
      let d = s;
      (!d || o && (o.index < d.index || o.index === d.index && o.lastIndex > d.lastIndex)) && (d = o);
      let w;
      if (!u) for (; ; ) {
        if (!l) {
          n.lastIndex < m && (n.lastIndex = m);
          let E = n.exec(e);
          if (!E) {
            u = !0;
            break;
          }
          l = {
            schema: E[2],
            index: E.index + E[1].length,
            lastIndex: E.index + E[0].length
          };
        }
        if (l.index < f) {
          l = void 0;
          continue;
        }
        if (d && l.index > d.index) break;
        let x = l;
        l = void 0;
        let y = this.testSchemaAt(e, x.schema, x.lastIndex);
        if (y) {
          w = {
            schema: x.schema,
            index: x.index,
            lastIndex: x.lastIndex + y
          };
          break;
        }
      }
      let z = w;
      if ((!z || s && (s.index < z.index || s.index === z.index && s.lastIndex > z.lastIndex)) && (z = s), (!z || o && (o.index < z.index || o.index === z.index && o.lastIndex > z.lastIndex)) && (z = o), !z) break;
      z === s ? s = void 0 : z === o && (o = void 0);
      let k = new Jn(e, z.schema, z.index, z.lastIndex);
      k.schema ? this.__schemas__[k.schema].normalize(k, this) : this.normalize(k), t.push(k), f = z.lastIndex;
    }
    return t.length ? t : null;
  }
  matchAtStart(e) {
    if (!e.length) return null;
    let t = this.re.get_schema_at_start().exec(e);
    if (!t) return null;
    let n = this.testSchemaAt(e, t[2], t[0].length);
    if (!n) return null;
    let a = new Jn(e, t[2], t.index + t[1].length, t.index + t[0].length + n);
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
}, rt = 2147483647, $e = 36, ar = 1, Rt = 26, $o = 38, jo = 700, rr = 72, ir = 128, sr = "-", Uo = /^xn--/, Po = /[^\0-\x7F]/, Jo = /[\x2E\u3002\uFF0E\uFF61]/g, Wo = {
  overflow: "Overflow: input needs wider integers to process",
  "not-basic": "Illegal input >= 0x80 (not a basic code point)",
  "invalid-input": "Invalid input"
}, Ho = 35, Fe = Math.floor, Wt = String.fromCharCode;
function Je(e) {
  throw RangeError(Wo[e]);
}
function Zo(e, t) {
  let n = [], a = e.length;
  for (; a--; ) n[a] = t(e[a]);
  return n;
}
function Wn(e, t) {
  let n = e.split("@"), a = "";
  n.length > 1 && (a = n[0] + "@", e = n[1]), e = e.replace(Jo, ".");
  let r = Zo(e.split("."), t).join(".");
  return a + r;
}
function or(e) {
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
var Ko = (e) => String.fromCodePoint(...e), Go = function(e) {
  return e >= 48 && e < 58 ? 26 + (e - 48) : e >= 65 && e < 91 ? e - 65 : e >= 97 && e < 123 ? e - 97 : $e;
}, Hn = function(e, t) {
  return e + 22 + 75 * (e < 26) - ((t != 0) << 5);
}, lr = function(e, t, n) {
  let a = 0;
  for (e = n ? Fe(e / jo) : e >> 1, e += Fe(e / t); e > 455; a += $e) e = Fe(e / Ho);
  return Fe(a + 36 * e / (e + $o));
}, Zn = function(e) {
  let t = [], n = e.length, a = 0, r = ir, i = rr, o = e.lastIndexOf(sr);
  o < 0 && (o = 0);
  for (let s = 0; s < o; ++s) e.charCodeAt(s) >= 128 && Je("not-basic"), t.push(e.charCodeAt(s));
  for (let s = o > 0 ? o + 1 : 0; s < n; ) {
    let l = a;
    for (let p = 1, h = $e; ; h += $e) {
      s >= n && Je("invalid-input");
      let f = Go(e.charCodeAt(s++));
      f >= $e && Je("invalid-input"), f > Fe((rt - a) / p) && Je("overflow"), a += f * p;
      let m = h <= i ? ar : h >= i + Rt ? Rt : h - i;
      if (f < m) break;
      let d = $e - m;
      p > Fe(rt / d) && Je("overflow"), p *= d;
    }
    let u = t.length + 1;
    i = lr(a - l, u, l == 0), Fe(a / u) > rt - r && Je("overflow"), r += Fe(a / u), a %= u, t.splice(a++, 0, r);
  }
  return String.fromCodePoint(...t);
}, Kn = function(e) {
  let t = [];
  e = or(e);
  let n = e.length, a = ir, r = 0, i = rr;
  for (let l of e) l < 128 && t.push(Wt(l));
  let o = t.length, s = o;
  for (o && t.push(sr); s < n; ) {
    let l = rt;
    for (let p of e) p >= a && p < l && (l = p);
    let u = s + 1;
    l - a > Fe((rt - r) / u) && Je("overflow"), r += (l - a) * u, a = l;
    for (let p of e) if (p < a && ++r > rt && Je("overflow"), p === a) {
      let h = r;
      for (let f = $e; ; f += $e) {
        let m = f <= i ? ar : f >= i + Rt ? Rt : f - i;
        if (h < m) break;
        let d = h - m, w = $e - m;
        t.push(Wt(Hn(m + d % w, 0))), h = Fe(d / w);
      }
      t.push(Wt(Hn(h, 0))), i = lr(r, u, s === o), r = 0, ++s;
    }
    ++r, ++a;
  }
  return t.join("");
}, Gn = {
  version: "2.3.1",
  ucs2: {
    decode: or,
    encode: Ko
  },
  decode: Zn,
  encode: Kn,
  toASCII: function(e) {
    return Wn(e, function(t) {
      return Po.test(t) ? "xn--" + Kn(t) : t;
    });
  },
  toUnicode: function(e) {
    return Wn(e, function(t) {
      return Uo.test(t) ? Zn(t.slice(4).toLowerCase()) : t;
    });
  }
}, Xo = {
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
}, Yo = /^(vbscript|javascript|file|data):/, Vo = /^data:image\/(gif|png|jpeg|webp);/, Xn = [
  "http:",
  "https:",
  "mailto:"
], Se = class {
  validateLink(e) {
    let t = e.trim().toLowerCase();
    return !Yo.test(t) || Vo.test(t);
  }
  normalizeLink(e) {
    let t = tn(e, !0);
    if (t.hostname && (!t.protocol || Xn.indexOf(t.protocol) >= 0)) try {
      t.hostname = Gn.toASCII(t.hostname);
    } catch {
    }
    return t.auth && (t.auth = Le(t.auth)), t.hostname && (t.hostname = Le(t.hostname)), t.pathname && (t.pathname = Le(t.pathname)), t.search && (t.search = Le(t.search)), t.hash && (t.hash = Le(t.hash)), en(t);
  }
  normalizeLinkText(e) {
    let t = tn(e, !0);
    if (t.hostname && (!t.protocol || Xn.indexOf(t.protocol) >= 0)) try {
      t.hostname = Gn.toUnicode(t.hostname);
    } catch {
    }
    return it(en(t), it.defaultChars + "%");
  }
  constructor(...e) {
    B(this, "inline", new nr()), B(this, "block", new Ya()), B(this, "core", new Ka()), B(this, "renderer", new Wa()), B(this, "linkify", new Lo()), B(this, "utils", ns), B(this, "helpers", Object.assign({}, vs));
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
      if (t = Xo[r], !t) throw Error(`Wrong 'markdown-it' preset "${r}", check name`);
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
B(Se, "Token", Ye), B(Se, "Ruler", gt), B(Se, "Renderer", Wa), B(Se, "ParserCore", Ka), B(Se, "StateCore", Ha), B(Se, "ParserBlock", Ya), B(Se, "StateBlock", Ga), B(Se, "ParserInline", nr), B(Se, "StateInline", Va);
var Qo = Ua(Se);
function el(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
function cr(e) {
  return e instanceof Map ? e.clear = e.delete = e.set = function() {
    throw new Error("map is read-only");
  } : e instanceof Set && (e.add = e.clear = e.delete = function() {
    throw new Error("set is read-only");
  }), Object.freeze(e), Object.getOwnPropertyNames(e).forEach((t) => {
    const n = e[t], a = typeof n;
    (a === "object" || a === "function") && !Object.isFrozen(n) && cr(n);
  }), e;
}
class Yn {
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
function ur(e) {
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
const tl = "</span>", Vn = (e) => !!e.scope, nl = (e, { prefix: t }) => {
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
class al {
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
    this.buffer += ur(t);
  }
  /**
   * Adds a node open to the output stream (if needed)
   *
   * @param {Node} node */
  openNode(t) {
    if (!Vn(t)) return;
    const n = nl(
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
    Vn(t) && (this.buffer += tl);
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
const Qn = (e = {}) => {
  const t = { children: [] };
  return Object.assign(t, e), t;
};
class mn {
  constructor() {
    this.rootNode = Qn(), this.stack = [this.rootNode];
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
    const n = Qn({ scope: t });
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
      mn._collapse(n);
    }));
  }
}
class rl extends mn {
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
    return new al(this, this.options).value();
  }
  finalize() {
    return this.closeAllNodes(), !0;
  }
}
function mt(e) {
  return e ? typeof e == "string" ? e : e.source : null;
}
function dr(e) {
  return et("(?=", e, ")");
}
function il(e) {
  return et("(?:", e, ")*");
}
function sl(e) {
  return et("(?:", e, ")?");
}
function et(...e) {
  return e.map((n) => mt(n)).join("");
}
function ol(e) {
  const t = e[e.length - 1];
  return typeof t == "object" && t.constructor === Object ? (e.splice(e.length - 1, 1), t) : {};
}
function bn(...e) {
  return "(" + (ol(e).capture ? "" : "?:") + e.map((a) => mt(a)).join("|") + ")";
}
function hr(e) {
  return new RegExp(e.toString() + "|").exec("").length - 1;
}
function ll(e, t) {
  const n = e && e.exec(t);
  return n && n.index === 0;
}
const cl = /\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;
function vn(e, { joinWith: t }) {
  let n = 0;
  return e.map((a) => {
    n += 1;
    const r = n;
    let i = mt(a), o = "";
    for (; i.length > 0; ) {
      const s = cl.exec(i);
      if (!s) {
        o += i;
        break;
      }
      o += i.substring(0, s.index), i = i.substring(s.index + s[0].length), s[0][0] === "\\" && s[1] ? o += "\\" + String(Number(s[1]) + r) : (o += s[0], s[0] === "(" && n++);
    }
    return o;
  }).map((a) => `(${a})`).join(t);
}
const ul = /\b\B/, pr = "[a-zA-Z]\\w*", kn = "[a-zA-Z_]\\w*", fr = "\\b\\d+(\\.\\d+)?", gr = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)", mr = "\\b(0b[01]+)", dl = "!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~", hl = (e = {}) => {
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
}, pl = {
  scope: "string",
  begin: "'",
  end: "'",
  illegal: "\\n",
  contains: [bt]
}, fl = {
  scope: "string",
  begin: '"',
  end: '"',
  illegal: "\\n",
  contains: [bt]
}, gl = {
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
  const r = bn(
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
}, ml = Mt("//", "$"), bl = Mt("/\\*", "\\*/"), vl = Mt("#", "$"), kl = {
  scope: "number",
  begin: fr,
  relevance: 0
}, zl = {
  scope: "number",
  begin: gr,
  relevance: 0
}, xl = {
  scope: "number",
  begin: mr,
  relevance: 0
}, _l = {
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
}, wl = {
  scope: "title",
  begin: pr,
  relevance: 0
}, yl = {
  scope: "title",
  begin: kn,
  relevance: 0
}, ql = {
  // excludes method names from keyword processing
  begin: "\\.\\s*" + kn,
  relevance: 0
}, Rl = function(e) {
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
var xt = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  APOS_STRING_MODE: pl,
  BACKSLASH_ESCAPE: bt,
  BINARY_NUMBER_MODE: xl,
  BINARY_NUMBER_RE: mr,
  COMMENT: Mt,
  C_BLOCK_COMMENT_MODE: bl,
  C_LINE_COMMENT_MODE: ml,
  C_NUMBER_MODE: zl,
  C_NUMBER_RE: gr,
  END_SAME_AS_BEGIN: Rl,
  HASH_COMMENT_MODE: vl,
  IDENT_RE: pr,
  MATCH_NOTHING_RE: ul,
  METHOD_GUARD: ql,
  NUMBER_MODE: kl,
  NUMBER_RE: fr,
  PHRASAL_WORDS_MODE: gl,
  QUOTE_STRING_MODE: fl,
  REGEXP_MODE: _l,
  RE_STARTERS_RE: dl,
  SHEBANG: hl,
  TITLE_MODE: wl,
  UNDERSCORE_IDENT_RE: kn,
  UNDERSCORE_TITLE_MODE: yl
});
function El(e, t) {
  e.input[e.index - 1] === "." && t.ignoreMatch();
}
function Cl(e, t) {
  e.className !== void 0 && (e.scope = e.className, delete e.className);
}
function Al(e, t) {
  t && e.beginKeywords && (e.begin = "\\b(" + e.beginKeywords.split(" ").join("|") + ")(?!\\.)(?=\\b|\\s)", e.__beforeBegin = El, e.keywords = e.keywords || e.beginKeywords, delete e.beginKeywords, e.relevance === void 0 && (e.relevance = 0));
}
function Nl(e, t) {
  Array.isArray(e.illegal) && (e.illegal = bn(...e.illegal));
}
function Dl(e, t) {
  if (e.match) {
    if (e.begin || e.end) throw new Error("begin & end are not supported with match");
    e.begin = e.match, delete e.match;
  }
}
function Sl(e, t) {
  e.relevance === void 0 && (e.relevance = 1);
}
const Tl = (e, t) => {
  if (!e.beforeMatch) return;
  if (e.starts) throw new Error("beforeMatch cannot be used with starts");
  const n = Object.assign({}, e);
  Object.keys(e).forEach((a) => {
    delete e[a];
  }), e.keywords = n.keywords, e.begin = et(n.beforeMatch, dr(n.begin)), e.starts = {
    relevance: 0,
    contains: [
      Object.assign(n, { endsParent: !0 })
    ]
  }, e.relevance = 0, delete n.beforeMatch;
}, Fl = [
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
], Ml = "keyword";
function br(e, t, n = Ml) {
  const a = /* @__PURE__ */ Object.create(null);
  return typeof e == "string" ? r(n, e.split(" ")) : Array.isArray(e) ? r(n, e) : Object.keys(e).forEach(function(i) {
    Object.assign(
      a,
      br(e[i], t, i)
    );
  }), a;
  function r(i, o) {
    t && (o = o.map((s) => s.toLowerCase())), o.forEach(function(s) {
      const l = s.split("|");
      a[l[0]] = [i, Il(l[0], l[1])];
    });
  }
}
function Il(e, t) {
  return t ? Number(t) : Ol(e) ? 0 : 1;
}
function Ol(e) {
  return Fl.includes(e.toLowerCase());
}
const ea = {}, Ve = (e) => {
  console.error(e);
}, ta = (e, ...t) => {
  console.log(`WARN: ${e}`, ...t);
}, tt = (e, t) => {
  ea[`${e}/${t}`] || (console.log(`Deprecated as of ${e}. ${t}`), ea[`${e}/${t}`] = !0);
}, Et = new Error();
function vr(e, t, { key: n }) {
  let a = 0;
  const r = e[n], i = {}, o = {};
  for (let s = 1; s <= t.length; s++)
    o[s + a] = r[s], i[s + a] = !0, a += hr(t[s - 1]);
  e[n] = o, e[n]._emit = i, e[n]._multi = !0;
}
function Bl(e) {
  if (Array.isArray(e.begin)) {
    if (e.skip || e.excludeBegin || e.returnBegin)
      throw Ve("skip, excludeBegin, returnBegin not compatible with beginScope: {}"), Et;
    if (typeof e.beginScope != "object" || e.beginScope === null)
      throw Ve("beginScope must be object"), Et;
    vr(e, e.begin, { key: "beginScope" }), e.begin = vn(e.begin, { joinWith: "" });
  }
}
function Ll(e) {
  if (Array.isArray(e.end)) {
    if (e.skip || e.excludeEnd || e.returnEnd)
      throw Ve("skip, excludeEnd, returnEnd not compatible with endScope: {}"), Et;
    if (typeof e.endScope != "object" || e.endScope === null)
      throw Ve("endScope must be object"), Et;
    vr(e, e.end, { key: "endScope" }), e.end = vn(e.end, { joinWith: "" });
  }
}
function $l(e) {
  e.scope && typeof e.scope == "object" && e.scope !== null && (e.beginScope = e.scope, delete e.scope);
}
function jl(e) {
  $l(e), typeof e.beginScope == "string" && (e.beginScope = { _wrap: e.beginScope }), typeof e.endScope == "string" && (e.endScope = { _wrap: e.endScope }), Bl(e), Ll(e);
}
function Ul(e) {
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
      l.position = this.position++, this.matchIndexes[this.matchAt] = l, this.regexes.push([l, s]), this.matchAt += hr(s) + 1;
    }
    compile() {
      this.regexes.length === 0 && (this.exec = () => null);
      const s = this.regexes.map((l) => l[1]);
      this.matcherRe = t(vn(s, { joinWith: "|" }), !0), this.lastIndex = 0;
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
      Cl,
      // do this early so compiler extensions generally don't have to worry about
      // the distinction between match/begin
      Dl,
      jl,
      Tl
    ].forEach((p) => p(o, s)), e.compilerExtensions.forEach((p) => p(o, s)), o.__beforeBegin = null, [
      Al,
      // do this later so compiler extensions that come earlier have access to the
      // raw array if they wanted to perhaps manipulate it, etc.
      Nl,
      // default to 1 relevance if not specified
      Sl
    ].forEach((p) => p(o, s)), o.isCompiled = !0;
    let u = null;
    return typeof o.keywords == "object" && o.keywords.$pattern && (o.keywords = Object.assign({}, o.keywords), u = o.keywords.$pattern, delete o.keywords.$pattern), u = u || /\w+/, o.keywords && (o.keywords = br(o.keywords, e.case_insensitive)), l.keywordPatternRe = t(u, !0), s && (o.begin || (o.begin = /\B|\b/), l.beginRe = t(l.begin), !o.end && !o.endsWithParent && (o.end = /\B|\b/), o.end && (l.endRe = t(l.end)), l.terminatorEnd = mt(l.end) || "", o.endsWithParent && s.terminatorEnd && (l.terminatorEnd += (o.end ? "|" : "") + s.terminatorEnd)), o.illegal && (l.illegalRe = t(
      /** @type {RegExp | string} */
      o.illegal
    )), o.contains || (o.contains = []), o.contains = [].concat(...o.contains.map(function(p) {
      return Pl(p === "self" ? o : p);
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
function Pl(e) {
  return e.variants && !e.cachedVariants && (e.cachedVariants = e.variants.map(function(t) {
    return Ze(e, { variants: null }, t);
  })), e.cachedVariants ? e.cachedVariants : kr(e) ? Ze(e, { starts: e.starts ? Ze(e.starts) : null }) : Object.isFrozen(e) ? Ze(e) : e;
}
var Jl = "11.11.1";
class Wl extends Error {
  constructor(t, n) {
    super(t), this.name = "HTMLInjectionError", this.html = n;
  }
}
const Ht = ur, na = Ze, aa = Symbol("nomatch"), Hl = 7, zr = function(e) {
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
    __emitter: rl
  };
  function l(C) {
    return s.noHighlightRe.test(C);
  }
  function u(C) {
    let I = C.className + " ";
    I += C.parentNode ? C.parentNode.className : "";
    const q = s.languageDetectRe.exec(I);
    if (q) {
      const $ = A(q[1]);
      return $ || (ta(i.replace("{}", q[1])), ta("Falling back to no-highlight mode for this block.", C)), $ ? q[1] : "no-highlight";
    }
    return I.split(/\s+/).find(($) => l($) || A($));
  }
  function p(C, I, q) {
    let $ = "", U = "";
    typeof I == "object" ? ($ = C, q = I.ignoreIllegals, U = I.language) : (tt("10.7.0", "highlight(lang, code, ...args) has been deprecated."), tt("10.7.0", `Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`), U = C, $ = I), q === void 0 && (q = !0);
    const K = {
      code: $,
      language: U
    };
    Y("before:highlight", K);
    const S = K.result ? K.result : h(K.language, K.code, q);
    return S.code = K.code, Y("after:highlight", S), S;
  }
  function h(C, I, q, $) {
    const U = /* @__PURE__ */ Object.create(null);
    function K(_, R) {
      return _.keywords[R];
    }
    function S() {
      if (!W.keywords) {
        le.addText(ee);
        return;
      }
      let _ = 0;
      W.keywordPatternRe.lastIndex = 0;
      let R = W.keywordPatternRe.exec(ee), D = "";
      for (; R; ) {
        D += ee.substring(_, R.index);
        const P = te.case_insensitive ? R[0].toLowerCase() : R[0], se = K(W, P);
        if (se) {
          const [ue, de] = se;
          if (le.addText(D), D = "", U[P] = (U[P] || 0) + 1, U[P] <= Hl && (N += de), ue.startsWith("_"))
            D += R[0];
          else {
            const Oe = te.classNameAliases[ue] || ue;
            he(R[0], Oe);
          }
        } else
          D += R[0];
        _ = W.keywordPatternRe.lastIndex, R = W.keywordPatternRe.exec(ee);
      }
      D += ee.substring(_), le.addText(D);
    }
    function J() {
      if (ee === "") return;
      let _ = null;
      if (typeof W.subLanguage == "string") {
        if (!t[W.subLanguage]) {
          le.addText(ee);
          return;
        }
        _ = h(W.subLanguage, ee, !0, Ae[W.subLanguage]), Ae[W.subLanguage] = /** @type {CompiledMode} */
        _._top;
      } else
        _ = m(ee, W.subLanguage.length ? W.subLanguage : null);
      W.relevance > 0 && (N += _.relevance), le.__addSublanguage(_._emitter, _.language);
    }
    function ie() {
      W.subLanguage != null ? J() : S(), ee = "";
    }
    function he(_, R) {
      _ !== "" && (le.startScope(R), le.addText(_), le.endScope());
    }
    function V(_, R) {
      let D = 1;
      const P = R.length - 1;
      for (; D <= P; ) {
        if (!_._emit[D]) {
          D++;
          continue;
        }
        const se = te.classNameAliases[_[D]] || _[D], ue = R[D];
        se ? he(ue, se) : (ee = ue, S(), ee = ""), D++;
      }
    }
    function _e(_, R) {
      return _.scope && typeof _.scope == "string" && le.openNode(te.classNameAliases[_.scope] || _.scope), _.beginScope && (_.beginScope._wrap ? (he(ee, te.classNameAliases[_.beginScope._wrap] || _.beginScope._wrap), ee = "") : _.beginScope._multi && (V(_.beginScope, R), ee = "")), W = Object.create(_, { parent: { value: W } }), W;
    }
    function qe(_, R, D) {
      let P = ll(_.endRe, D);
      if (P) {
        if (_["on:end"]) {
          const se = new Yn(_);
          _["on:end"](R, se), se.isMatchIgnored && (P = !1);
        }
        if (P) {
          for (; _.endsParent && _.parent; )
            _ = _.parent;
          return _;
        }
      }
      if (_.endsWithParent)
        return qe(_.parent, R, D);
    }
    function Ie(_) {
      return W.matcher.regexIndex === 0 ? (ee += _[0], 1) : (O = !0, 0);
    }
    function be(_) {
      const R = _[0], D = _.rule, P = new Yn(D), se = [D.__beforeBegin, D["on:begin"]];
      for (const ue of se)
        if (ue && (ue(_, P), P.isMatchIgnored))
          return Ie(R);
      return D.skip ? ee += R : (D.excludeBegin && (ee += R), ie(), !D.returnBegin && !D.excludeBegin && (ee = R)), _e(D, _), D.returnBegin ? 0 : R.length;
    }
    function ve(_) {
      const R = _[0], D = I.substring(_.index), P = qe(W, _, D);
      if (!P)
        return aa;
      const se = W;
      W.endScope && W.endScope._wrap ? (ie(), he(R, W.endScope._wrap)) : W.endScope && W.endScope._multi ? (ie(), V(W.endScope, _)) : se.skip ? ee += R : (se.returnEnd || se.excludeEnd || (ee += R), ie(), se.excludeEnd && (ee = R));
      do
        W.scope && le.closeNode(), !W.skip && !W.subLanguage && (N += W.relevance), W = W.parent;
      while (W !== P.parent);
      return P.starts && _e(P.starts, _), se.returnEnd ? 0 : R.length;
    }
    function Ee() {
      const _ = [];
      for (let R = W; R !== te; R = R.parent)
        R.scope && _.unshift(R.scope);
      _.forEach((R) => le.openNode(R));
    }
    let G = {};
    function pe(_, R) {
      const D = R && R[0];
      if (ee += _, D == null)
        return ie(), 0;
      if (G.type === "begin" && R.type === "end" && G.index === R.index && D === "") {
        if (ee += I.slice(R.index, R.index + 1), !r) {
          const P = new Error(`0 width match regex (${C})`);
          throw P.languageName = C, P.badRule = G.rule, P;
        }
        return 1;
      }
      if (G = R, R.type === "begin")
        return be(R);
      if (R.type === "illegal" && !q) {
        const P = new Error('Illegal lexeme "' + D + '" for mode "' + (W.scope || "<unnamed>") + '"');
        throw P.mode = W, P;
      } else if (R.type === "end") {
        const P = ve(R);
        if (P !== aa)
          return P;
      }
      if (R.type === "illegal" && D === "")
        return ee += `
`, 1;
      if (ne > 1e5 && ne > R.index * 3)
        throw new Error("potential infinite loop, way more iterations than matches");
      return ee += D, D.length;
    }
    const te = A(C);
    if (!te)
      throw Ve(i.replace("{}", C)), new Error('Unknown language: "' + C + '"');
    const Ce = Ul(te);
    let ge = "", W = $ || Ce;
    const Ae = {}, le = new s.__emitter(s);
    Ee();
    let ee = "", N = 0, X = 0, ne = 0, O = !1;
    try {
      if (te.__emitTokens)
        te.__emitTokens(I, le);
      else {
        for (W.matcher.considerAll(); ; ) {
          ne++, O ? O = !1 : W.matcher.considerAll(), W.matcher.lastIndex = X;
          const _ = W.matcher.exec(I);
          if (!_) break;
          const R = I.substring(X, _.index), D = pe(R, _);
          X = _.index + D;
        }
        pe(I.substring(X));
      }
      return le.finalize(), ge = le.toHTML(), {
        language: C,
        value: ge,
        relevance: N,
        illegal: !1,
        _emitter: le,
        _top: W
      };
    } catch (_) {
      if (_.message && _.message.includes("Illegal"))
        return {
          language: C,
          value: Ht(I),
          illegal: !0,
          relevance: 0,
          _illegalBy: {
            message: _.message,
            index: X,
            context: I.slice(X - 100, X + 100),
            mode: _.mode,
            resultSoFar: ge
          },
          _emitter: le
        };
      if (r)
        return {
          language: C,
          value: Ht(I),
          illegal: !1,
          relevance: 0,
          errorRaised: _,
          _emitter: le,
          _top: W
        };
      throw _;
    }
  }
  function f(C) {
    const I = {
      value: Ht(C),
      illegal: !1,
      relevance: 0,
      _top: o,
      _emitter: new s.__emitter(s)
    };
    return I._emitter.addText(C), I;
  }
  function m(C, I) {
    I = I || s.languages || Object.keys(t);
    const q = f(C), $ = I.filter(A).filter(j).map(
      (ie) => h(ie, C, !1)
    );
    $.unshift(q);
    const U = $.sort((ie, he) => {
      if (ie.relevance !== he.relevance) return he.relevance - ie.relevance;
      if (ie.language && he.language) {
        if (A(ie.language).supersetOf === he.language)
          return 1;
        if (A(he.language).supersetOf === ie.language)
          return -1;
      }
      return 0;
    }), [K, S] = U, J = K;
    return J.secondBest = S, J;
  }
  function d(C, I, q) {
    const $ = I && n[I] || q;
    C.classList.add("hljs"), C.classList.add(`language-${$}`);
  }
  function w(C) {
    let I = null;
    const q = u(C);
    if (l(q)) return;
    if (Y(
      "before:highlightElement",
      { el: C, language: q }
    ), C.dataset.highlighted) {
      console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.", C);
      return;
    }
    if (C.children.length > 0 && (s.ignoreUnescapedHTML || (console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."), console.warn("https://github.com/highlightjs/highlight.js/wiki/security"), console.warn("The element with unescaped HTML:"), console.warn(C)), s.throwUnescapedHTML))
      throw new Wl(
        "One of your code blocks includes unescaped HTML.",
        C.innerHTML
      );
    I = C;
    const $ = I.textContent, U = q ? p($, { language: q, ignoreIllegals: !0 }) : m($);
    C.innerHTML = U.value, C.dataset.highlighted = "yes", d(C, q, U.language), C.result = {
      language: U.language,
      // TODO: remove with version 11.0
      re: U.relevance,
      relevance: U.relevance
    }, U.secondBest && (C.secondBest = {
      language: U.secondBest.language,
      relevance: U.secondBest.relevance
    }), Y("after:highlightElement", { el: C, result: U, text: $ });
  }
  function z(C) {
    s = na(s, C);
  }
  const k = () => {
    E(), tt("10.6.0", "initHighlighting() deprecated.  Use highlightAll() now.");
  };
  function x() {
    E(), tt("10.6.0", "initHighlightingOnLoad() deprecated.  Use highlightAll() now.");
  }
  let y = !1;
  function E() {
    function C() {
      E();
    }
    if (document.readyState === "loading") {
      y || window.addEventListener("DOMContentLoaded", C, !1), y = !0;
      return;
    }
    document.querySelectorAll(s.cssSelector).forEach(w);
  }
  function v(C, I) {
    let q = null;
    try {
      q = I(e);
    } catch ($) {
      if (Ve("Language definition for '{}' could not be registered.".replace("{}", C)), r)
        Ve($);
      else
        throw $;
      q = o;
    }
    q.name || (q.name = C), t[C] = q, q.rawDefinition = I.bind(null, e), q.aliases && L(q.aliases, { languageName: C });
  }
  function b(C) {
    delete t[C];
    for (const I of Object.keys(n))
      n[I] === C && delete n[I];
  }
  function T() {
    return Object.keys(t);
  }
  function A(C) {
    return C = (C || "").toLowerCase(), t[C] || t[n[C]];
  }
  function L(C, { languageName: I }) {
    typeof C == "string" && (C = [C]), C.forEach((q) => {
      n[q.toLowerCase()] = I;
    });
  }
  function j(C) {
    const I = A(C);
    return I && !I.disableAutodetect;
  }
  function H(C) {
    C["before:highlightBlock"] && !C["before:highlightElement"] && (C["before:highlightElement"] = (I) => {
      C["before:highlightBlock"](
        Object.assign({ block: I.el }, I)
      );
    }), C["after:highlightBlock"] && !C["after:highlightElement"] && (C["after:highlightElement"] = (I) => {
      C["after:highlightBlock"](
        Object.assign({ block: I.el }, I)
      );
    });
  }
  function M(C) {
    H(C), a.push(C);
  }
  function Z(C) {
    const I = a.indexOf(C);
    I !== -1 && a.splice(I, 1);
  }
  function Y(C, I) {
    const q = C;
    a.forEach(function($) {
      $[q] && $[q](I);
    });
  }
  function re(C) {
    return tt("10.7.0", "highlightBlock will be removed entirely in v12.0"), tt("10.7.0", "Please use highlightElement now."), w(C);
  }
  Object.assign(e, {
    highlight: p,
    highlightAuto: m,
    highlightAll: E,
    highlightElement: w,
    // TODO: Remove with v12 API
    highlightBlock: re,
    configure: z,
    initHighlighting: k,
    initHighlightingOnLoad: x,
    registerLanguage: v,
    unregisterLanguage: b,
    listLanguages: T,
    getLanguage: A,
    registerAliases: L,
    autoDetection: j,
    inherit: na,
    addPlugin: M,
    removePlugin: Z
  }), e.debugMode = function() {
    r = !1;
  }, e.safeMode = function() {
    r = !0;
  }, e.versionString = Jl, e.regex = {
    concat: et,
    lookahead: dr,
    either: bn,
    optional: sl,
    anyNumberOfTimes: il
  };
  for (const C in xt)
    typeof xt[C] == "object" && cr(xt[C]);
  return Object.assign(e, xt), e;
}, ot = zr({});
ot.newInstance = () => zr({});
var Zl = ot;
ot.HighlightJS = ot;
ot.default = ot;
const Kl = /* @__PURE__ */ el(Zl), ra = "[A-Za-z$_][0-9A-Za-z$_]*", Gl = [
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
], Xl = [
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity"
], xr = [
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
], _r = [
  "Error",
  "EvalError",
  "InternalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError"
], wr = [
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
], Yl = [
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
], Vl = [].concat(
  wr,
  xr,
  _r
);
function Ql(e) {
  const t = e.regex, n = (q, { after: $ }) => {
    const U = "</" + q[0].slice(1);
    return q.input.indexOf(U, $) !== -1;
  }, a = ra, r = {
    begin: "<>",
    end: "</>"
  }, i = /<[A-Za-z0-9\\._:-]+\s*\/>/, o = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
    /**
     * @param {RegExpMatchArray} match
     * @param {CallbackResponse} response
     */
    isTrulyOpeningTag: (q, $) => {
      const U = q[0].length + q.index, K = q.input[U];
      if (
        // HTML should not include another raw `<` inside a tag
        // nested type?
        // `<Array<Array<number>>`, etc.
        K === "<" || // the , gives away that this is not HTML
        // `<T, A extends keyof T, V>`
        K === ","
      ) {
        $.ignoreMatch();
        return;
      }
      K === ">" && (n(q, { after: U }) || $.ignoreMatch());
      let S;
      const J = q.input.substring(U);
      if (S = J.match(/^\s*=/)) {
        $.ignoreMatch();
        return;
      }
      if ((S = J.match(/^\s+extends\s+/)) && S.index === 0) {
        $.ignoreMatch();
        return;
      }
    }
  }, s = {
    $pattern: ra,
    keyword: Gl,
    literal: Xl,
    built_in: Vl,
    "variable.language": Yl
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
  }, z = {
    className: "string",
    begin: "`",
    end: "`",
    contains: [
      e.BACKSLASH_ESCAPE,
      f
    ]
  }, x = {
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
    z,
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
  const E = [].concat(x, f.contains), v = E.concat([
    // eat recursive parens in sub expressions
    {
      begin: /(\s*)\(/,
      end: /\)/,
      keywords: s,
      contains: ["self"].concat(E)
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
  }, A = {
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
        ...xr,
        ..._r
      ]
    }
  }, L = {
    label: "use_strict",
    className: "meta",
    relevance: 10,
    begin: /^\s*['"]use (strict|asm)['"]/
  }, j = {
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
  }, H = {
    relevance: 0,
    match: /\b[A-Z][A-Z_0-9]+\b/,
    className: "variable.constant"
  };
  function M(q) {
    return t.concat("(?!", q.join("|"), ")");
  }
  const Z = {
    match: t.concat(
      /\b/,
      M([
        ...wr,
        "super",
        "import"
      ].map((q) => `${q}\\s*\\(`)),
      a,
      t.lookahead(/\s*\(/)
    ),
    className: "title.function",
    relevance: 0
  }, Y = {
    begin: t.concat(/\./, t.lookahead(
      t.concat(a, /(?![0-9A-Za-z$_(])/)
    )),
    end: a,
    excludeBegin: !0,
    keywords: "prototype",
    className: "property",
    relevance: 0
  }, re = {
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
  }, C = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + e.UNDERSCORE_IDENT_RE + ")\\s*=>", I = {
    match: [
      /const|var|let/,
      /\s+/,
      a,
      /\s*/,
      /=\s*/,
      /(async\s*)?/,
      // async is optional
      t.lookahead(C)
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
    exports: { PARAMS_CONTAINS: v, CLASS_REFERENCE: A },
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
      z,
      x,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      h,
      A,
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
          x,
          e.REGEXP_MODE,
          {
            className: "function",
            // we have to count the parens to make sure we actually have the
            // correct bounding ( ) before the =>.  There could be any number of
            // sub-expressions inside also surrounded by parens.
            begin: C,
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
      j,
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
      Y,
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
      Z,
      H,
      T,
      re,
      {
        match: /\$[(.]/
        // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
      }
    ]
  };
}
const Ct = "[A-Za-z$_][0-9A-Za-z$_]*", yr = [
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
], qr = [
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity"
], Rr = [
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
], Er = [
  "Error",
  "EvalError",
  "InternalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError"
], Cr = [
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
], Nr = [].concat(
  Cr,
  Rr,
  Er
);
function ec(e) {
  const t = e.regex, n = (q, { after: $ }) => {
    const U = "</" + q[0].slice(1);
    return q.input.indexOf(U, $) !== -1;
  }, a = Ct, r = {
    begin: "<>",
    end: "</>"
  }, i = /<[A-Za-z0-9\\._:-]+\s*\/>/, o = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
    /**
     * @param {RegExpMatchArray} match
     * @param {CallbackResponse} response
     */
    isTrulyOpeningTag: (q, $) => {
      const U = q[0].length + q.index, K = q.input[U];
      if (
        // HTML should not include another raw `<` inside a tag
        // nested type?
        // `<Array<Array<number>>`, etc.
        K === "<" || // the , gives away that this is not HTML
        // `<T, A extends keyof T, V>`
        K === ","
      ) {
        $.ignoreMatch();
        return;
      }
      K === ">" && (n(q, { after: U }) || $.ignoreMatch());
      let S;
      const J = q.input.substring(U);
      if (S = J.match(/^\s*=/)) {
        $.ignoreMatch();
        return;
      }
      if ((S = J.match(/^\s+extends\s+/)) && S.index === 0) {
        $.ignoreMatch();
        return;
      }
    }
  }, s = {
    $pattern: Ct,
    keyword: yr,
    literal: qr,
    built_in: Nr,
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
  }, z = {
    className: "string",
    begin: "`",
    end: "`",
    contains: [
      e.BACKSLASH_ESCAPE,
      f
    ]
  }, x = {
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
    z,
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
  const E = [].concat(x, f.contains), v = E.concat([
    // eat recursive parens in sub expressions
    {
      begin: /(\s*)\(/,
      end: /\)/,
      keywords: s,
      contains: ["self"].concat(E)
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
  }, A = {
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
        ...Rr,
        ...Er
      ]
    }
  }, L = {
    label: "use_strict",
    className: "meta",
    relevance: 10,
    begin: /^\s*['"]use (strict|asm)['"]/
  }, j = {
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
  }, H = {
    relevance: 0,
    match: /\b[A-Z][A-Z_0-9]+\b/,
    className: "variable.constant"
  };
  function M(q) {
    return t.concat("(?!", q.join("|"), ")");
  }
  const Z = {
    match: t.concat(
      /\b/,
      M([
        ...Cr,
        "super",
        "import"
      ].map((q) => `${q}\\s*\\(`)),
      a,
      t.lookahead(/\s*\(/)
    ),
    className: "title.function",
    relevance: 0
  }, Y = {
    begin: t.concat(/\./, t.lookahead(
      t.concat(a, /(?![0-9A-Za-z$_(])/)
    )),
    end: a,
    excludeBegin: !0,
    keywords: "prototype",
    className: "property",
    relevance: 0
  }, re = {
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
  }, C = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + e.UNDERSCORE_IDENT_RE + ")\\s*=>", I = {
    match: [
      /const|var|let/,
      /\s+/,
      a,
      /\s*/,
      /=\s*/,
      /(async\s*)?/,
      // async is optional
      t.lookahead(C)
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
    exports: { PARAMS_CONTAINS: v, CLASS_REFERENCE: A },
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
      z,
      x,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      h,
      A,
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
          x,
          e.REGEXP_MODE,
          {
            className: "function",
            // we have to count the parens to make sure we actually have the
            // correct bounding ( ) before the =>.  There could be any number of
            // sub-expressions inside also surrounded by parens.
            begin: C,
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
      j,
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
      Y,
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
      Z,
      H,
      T,
      re,
      {
        match: /\$[(.]/
        // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
      }
    ]
  };
}
function tc(e) {
  const t = e.regex, n = ec(e), a = Ct, r = [
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
    $pattern: Ct,
    keyword: yr.concat(l),
    literal: qr,
    built_in: Nr.concat(r),
    "variable.language": Ar
  }, p = {
    className: "meta",
    begin: "@" + a
  }, h = (w, z, k) => {
    const x = w.contains.findIndex((y) => y.label === z);
    if (x === -1)
      throw new Error("can not find mode to replace");
    w.contains.splice(x, 1, k);
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
function nc(e) {
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
const ac = (e) => ({
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
}), rc = [
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
], ic = [
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
], sc = [
  ...rc,
  ...ic
], oc = [
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
].sort().reverse(), lc = [
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
].sort().reverse(), cc = [
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
].sort().reverse(), uc = [
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
function dc(e) {
  const t = e.regex, n = ac(e), a = { begin: /-(webkit|moz|ms|o)-(?=[a-z])/ }, r = "and or not only", i = /@-?\w[\w]*(-\w+)*/, o = "[a-zA-Z-][a-zA-Z0-9_-]*", s = [
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
          { begin: ":(" + lc.join("|") + ")" },
          { begin: ":(:)?(" + cc.join("|") + ")" }
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
        begin: "\\b(" + uc.join("|") + ")\\b"
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
              attribute: oc.join(" ")
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
        begin: "\\b(" + sc.join("|") + ")\\b"
      }
    ]
  };
}
function hc(e) {
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
function pc(e) {
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
  }, z = {
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
  }, k = {
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
      z,
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
        contains: [k]
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
          k,
          h
        ]
      }
    ]
  };
}
function fc(e) {
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
  ], z = [
    "true",
    "false"
  ], k = { match: /(\/[a-z._-]+)+/ }, x = [
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
  ], E = [
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
      literal: z,
      built_in: [
        ...x,
        ...y,
        // Shell modifiers
        "set",
        "shopt",
        ...E,
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
      k,
      s,
      l,
      u,
      p,
      n
    ]
  };
}
function gc(e) {
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
  }, z = [
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
  ], k = [...z];
  return k.pop(), k.push(s), m.contains = k, {
    name: "YAML",
    case_insensitive: !0,
    aliases: ["yml"],
    contains: z
  };
}
function mc(e) {
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
  }, z = {
    scope: "operator",
    match: /[-+*/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?/,
    relevance: 0
  }, k = {
    match: t.concat(/\b/, t.either(...m), /\s*\(/),
    relevance: 0,
    keywords: { built_in: m }
  };
  function x(v) {
    return t.concat(
      /\b/,
      t.either(...v.map((b) => b.replace(/\s+/, "\\s+"))),
      /\b/
    );
  }
  const y = {
    scope: "keyword",
    match: x(f),
    relevance: 0
  };
  function E(v, {
    exceptions: b,
    when: T
  } = {}) {
    const A = T;
    return b = b || [], v.map((L) => L.match(/\|\d+$/) || b.includes(L) ? L : A(L) ? `${L}|0` : L);
  }
  return {
    name: "SQL",
    case_insensitive: !0,
    // does not include {} or HTML tags `</`
    illegal: /[{}]|<\//,
    keywords: {
      $pattern: /\b[\w\.]+/,
      keyword: E(d, { when: (v) => v.length < 3 }),
      literal: i,
      type: s,
      built_in: h
    },
    contains: [
      {
        scope: "type",
        match: x(o)
      },
      y,
      k,
      w,
      a,
      r,
      e.C_NUMBER_MODE,
      e.C_BLOCK_COMMENT_MODE,
      n,
      z
    ]
  };
}
function bc(e) {
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
const vc = /^\[\[([^\[\]\r\n]{1,256})\]\]/;
function kc(e) {
  e.inline.ruler.after("image", "wikilink", (t, n) => {
    if (n || t.linkLevel || !t.src.startsWith("[[", t.pos)) return !1;
    const a = vc.exec(t.src.slice(t.pos, Math.min(t.posMax, t.pos + 260)));
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
const an = Kl.newInstance();
for (const [e, t] of Object.entries({ javascript: Ql, typescript: tc, json: nc, css: dc, xml: hc, python: pc, bash: fc, yaml: gc, sql: mc }))
  an.registerLanguage(e, t);
const Me = new Qo({ html: !1, highlight: (e, t) => e.length <= 32768 && an.getLanguage(t) ? an.highlight(e, { language: t, ignoreIllegals: !0 }).value : "" });
kc(Me);
Me.validateLink = (e) => /^(https?:\/\/|mailto:)/i.test(e);
Me.renderer.rules.image = (e, t) => `<span class="qz-note-image">[image: ${Me.utils.escapeHtml(e[t].content || "image")}]</span>`;
Me.renderer.rules.link_open = (e, t, n, a, r) => (e[t].attrSet("target", "_blank"), e[t].attrSet("rel", "noopener noreferrer nofollow"), r.renderToken(e, t, n));
Me.renderer.rules.note_task = (e, t, n, a, r) => r.renderToken(e, t, n) + " ";
Me.core.ruler.push("note_tasks", (e) => {
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
    const z = new e.Token("span_open", "span", 1);
    z.attrSet("class", "qz-note-task-text"), h.unshift(d, z), h.push(new e.Token("span_close", "span", -1));
  }
});
function zc(e, t, n = {}) {
  let a = e, r = 0;
  const i = /^---[ \t]*\n/.exec(e);
  if (i) {
    const p = /^---[ \t]*(?:\n|$)/gm;
    p.lastIndex = i[0].length, p.test(e) && (r = (e.slice(0, p.lastIndex).match(/\n/g) || []).length, a = e.slice(p.lastIndex));
  }
  const o = { resolveWikilink: t, editable: n.editable === !0, lineOffset: r }, s = Me.parse(a, o), l = a.split(`
`), u = [];
  for (let p = 0; p < s.length; ) {
    const h = p, f = s[p++];
    if (f.nesting === 1) {
      let w = 1;
      for (; p < s.length && w > 0; ) w += s[p++].nesting;
    }
    const m = f.map, d = { html: Me.renderer.render(s.slice(h, p), Me.options, o) };
    if (m) {
      let w = m[1];
      for (; w > m[0] + 1 && /^[ \t]*$/.test(l[w - 1] ?? ""); ) w--;
      d.start = m[0] + r, d.end = w + r;
    }
    u.push(d);
  }
  return u;
}
function xc(e) {
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
function rn(e) {
  const t = e.content.startsWith("\uFEFF") ? "\uFEFF" : "", n = e.content.slice(t.length), a = n.replace(/\r\n/g, ""), r = a.length !== n.length, i = a.includes("\r") || r && a.includes(`
`) ? "mixed" : r ? `\r
` : `
`;
  return { source: e, text: n.replace(/\r\n?/g, `
`), bom: t, lineEnding: i };
}
function Dr(e) {
  return e.lineEnding === "mixed" ? e.source.content : e.bom + (e.lineEnding === `\r
` ? e.text.replace(/\n/g, `\r
`) : e.text);
}
function Sr(e, t, n) {
  const a = e.split(`
`);
  if (!Number.isInteger(t) || !Number.isInteger(n) || t < 0 || n <= t || n > a.length) return null;
  let r = 0;
  for (let o = 0; o < t; o++) r += a[o].length + 1;
  let i = r + a[t].length;
  for (let o = t + 1; o < n; o++) i += 1 + a[o].length;
  return { from: r, to: i };
}
function _c(e, t, n) {
  const a = Sr(e, t, t + 1);
  if (!a) return e;
  const r = /^([ \t]*- \[)( |x)(\] )/.exec(e.slice(a.from, a.to));
  if (!r) return e;
  const i = a.from + r[1].length;
  return e.slice(0, i) + (n ? "x" : " ") + e.slice(i + 1);
}
const at = { lastNote: null, expanded: [], limit: 500, pinned: [] }, wc = { color: "theme", emoji: "" }, yc = {
  appearance: wa,
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
}, qc = {
  narrow: "Narrow",
  standard: "Standard",
  wide: "Wide",
  full: "Full width"
}, ia = ["tasks", "todos", "notes", "settings"];
function je(e) {
  return e && typeof e == "object" && !Array.isArray(e) ? e : {};
}
function Re(e, t, n) {
  return t.includes(e) ? e : n;
}
function zn(e) {
  return typeof e == "number" && Number.isSafeInteger(e) && e > 0 ? e : null;
}
function Tr(e) {
  const t = je(e);
  return {
    headingColor: Xe(t.headingColor),
    headingLines: ya(t.headingLines),
    lineColor: Xe(t.lineColor)
  };
}
function sa(e, t) {
  return Object.fromEntries(Object.entries(je(e)).filter(([n]) => /^[1-9]\d*$/.test(n) && zn(Number(n)) !== null).map(([n, a]) => [n, t(je(a))]));
}
const Fr = (e) => typeof e == "string" && e.length > 0 && (e.length <= 1024 || Array.from(e).length <= 1024), oa = (e) => Array.isArray(e) ? [...new Set(e.filter(Fr))] : [], la = (e) => Re(e, ["all", "workspace"], "all"), ca = (e) => Re(e, ["open", "done", "all"], "open");
function Mr(e) {
  return Array.from(e.replace(/[\u0000-\u001f\u007f]/g, "").trim()).slice(0, 8).join("");
}
function At(e) {
  const t = je(e), n = je(t.boardFields), a = Xe(t.accent);
  return {
    appearance: Tr(t.appearance),
    accent: a === "accent" ? "theme" : a,
    highContrast: t.highContrast === !0,
    largerInterfaceText: t.largerInterfaceText === !0,
    motion: Re(t.motion, ["system", "reduced"], "system"),
    startOn: Re(t.startOn, ["last", ...ia], "last"),
    lastTab: Re(t.lastTab, ia, "tasks"),
    workspaceId: zn(t.workspaceId),
    noteView: Re(t.noteView, ["rendered", "raw"], "rendered"),
    noteWidth: Re(t.noteWidth, ["narrow", "standard", "wide", "full"], "standard"),
    noteTextSize: Re(t.noteTextSize, ["small", "medium", "large"], "medium"),
    rawTextSize: Re(t.rawTextSize, ["small", "medium", "large"], "medium"),
    noteLineHeight: Re(t.noteLineHeight, ["compact", "normal", "relaxed"], "normal"),
    noteFont: Re(t.noteFont, ["theme", "mono"], "theme"),
    noteFolders: sa(t.noteFolders, (r) => ({
      lastNote: Fr(r.lastNote) ? r.lastNote : null,
      expanded: oa(r.expanded),
      limit: typeof r.limit == "number" && Number.isSafeInteger(r.limit) ? Math.min(5e4, Math.max(at.limit, r.limit)) : at.limit,
      pinned: oa(r.pinned)
    })),
    folderAppearance: sa(t.folderAppearance, (r) => ({
      color: Xe(r.color),
      emoji: typeof r.emoji == "string" ? Mr(r.emoji) : ""
    })),
    boardDensity: Re(t.boardDensity, ["comfortable", "compact"], "comfortable"),
    boardFields: { progress: n.progress !== !1, path: n.path !== !1, badges: n.badges !== !1 },
    hideEmptyLanes: t.hideEmptyLanes === !0,
    laneSort: Object.fromEntries(Object.entries(je(t.laneSort)).filter(([r]) => /^\d+:[a-z][a-z0-9_]{0,31}$/.test(r)).map(([r, i]) => [r, Re(i, ["manual", "title"], "manual")])),
    todoScope: la(t.todoScope),
    todoState: ca(t.todoState),
    todoFilters: Array.isArray(t.todoFilters) ? t.todoFilters.flatMap((r) => {
      const i = je(r);
      return typeof i.name != "string" || !i.name.trim() ? [] : [{
        name: i.name.trim().slice(0, 40),
        scope: la(i.scope),
        state: ca(i.state),
        search: typeof i.search == "string" ? i.search.slice(0, 200) : ""
      }];
    }).slice(0, 20) : []
  };
}
function ua(e) {
  const t = je(e), n = At(t);
  return Object.fromEntries(Object.entries(n).filter(([a]) => Object.hasOwn(t, a)));
}
const Ir = "quartizo-preferences-v1";
function wt(e) {
  var t;
  try {
    return ((t = qa()) == null ? void 0 : t.getItem(e)) ?? null;
  } catch {
    return null;
  }
}
function da(e) {
  try {
    return JSON.parse(wt(e) ?? "null");
  } catch {
    return null;
  }
}
function Rc() {
  const e = da(Ir);
  if (e && typeof e == "object") {
    const { values: o, pending: s, legacy: l } = je(e);
    return { values: At(o), pending: ua(s), legacy: ua(l) };
  }
  const t = {}, n = da("quartizo-notes-appearance"), a = wt("quartizo-notes-view"), r = wt("quartizo-notes-full-width"), i = zn(Number(wt("quartizo:workspace")));
  return n && (t.appearance = Tr(n)), (a === "raw" || a === "rendered") && (t.noteView = a), (r === "true" || r === "false") && (t.noteWidth = r === "true" ? "full" : "standard"), i !== null && (t.workspaceId = i), { values: { ...yc, ...t }, pending: {}, legacy: t };
}
function ha(e) {
  try {
    const t = qa();
    return t ? (t.setItem(Ir, JSON.stringify(e)), !0) : !1;
  } catch {
    return !1;
  }
}
function Zt(e) {
  return e && (e.conflict || Dr(e) !== e.source.content) ? e : void 0;
}
function sn(e) {
  return `${e.workspaceId}:${e.path}`;
}
function Ec(e, t) {
  const [n, a] = F(() => /* @__PURE__ */ new Map()), r = ae(n), i = ae(/* @__PURE__ */ new Map());
  function o(p, h) {
    const f = new Map(r.current);
    f.set(p, h(f.get(p) ?? {})), r.current = f, a(f);
  }
  function s(p, h, f) {
    var m;
    f !== void 0 && (((m = r.current.get(p)) == null ? void 0 : m.draft) ?? null) !== f || o(p, (d) => {
      const w = d.draft ?? d.saved, z = h && w ? { ...h, source: w.source, conflict: w.conflict } : h ?? void 0;
      return { ...d, draft: d.saving ? z : Zt(z), didSave: !1, failure: h ? d.failure : void 0 };
    });
  }
  function l(p, h) {
    var f;
    h && ((f = r.current.get(p)) == null ? void 0 : f.saved) === h && o(p, (m) => ({ ...m, saved: void 0 }));
  }
  async function u(p) {
    var w, z;
    const h = sn(p), f = (w = r.current.get(h)) == null ? void 0 : w.draft;
    if (!f || f.conflict || f.lineEnding === "mixed") return;
    const m = i.current.get(h);
    if (m) {
      m.next = f;
      return;
    }
    const d = { next: f };
    i.current.set(h, d), o(h, (k) => ({ ...k, saving: !0, didSave: !1, failure: void 0 }));
    try {
      let k;
      for (; k = d.next; ) {
        d.next = void 0;
        const x = Dr(k);
        if (x === k.source.content) continue;
        const y = await ze(ri(e, p.workspaceId, p.path, x, k.source.hash)), E = rn({ ...y, content: x }), v = (z = i.current.get(h)) == null ? void 0 : z.next;
        v && (d.next = { ...v, source: E.source }), o(h, (b) => ({
          ...b,
          saved: E,
          draft: Zt(b.draft && { ...b.draft, source: E.source }),
          didSave: !0
        })), t();
      }
    } catch (k) {
      const x = ye(k);
      o(h, (y) => x.code === "conflict" && y.draft ? { ...y, draft: { ...y.draft, conflict: !0 } } : { ...y, failure: x });
    } finally {
      i.current.delete(h), o(h, (k) => ({ ...k, saving: !1, draft: Zt(k.draft) }));
    }
  }
  return { edits: n, edit: s, loaded: l, save: u };
}
const Cc = ".qz-notes-layout{display:grid;grid-template-columns:minmax(190px,1fr) minmax(0,3fr);gap:14px;align-items:start}.qz-note-browser,.qz-note-editor,.qz-note-create{display:grid;gap:12px;padding:14px}.qz-note-browser{max-height:72vh;overflow:auto}.qz-note-browser-heading{display:flex;align-items:center;gap:8px;min-width:0;font-size:15px;overflow-wrap:anywhere}.qz-note-browser-icon{display:inline-flex;flex:none;color:var(--qz-accent)}.qz-note-pins{display:grid;gap:5px}.qz-note-pins h4{margin:0;font-size:13px}.qz-note-create{grid-template-columns:minmax(0,1fr) auto;align-items:end}.qz-note-create .qz-error{grid-column:1 / -1}.qz-note-tree{display:grid;gap:3px;padding:0;list-style:none}.qz-note-tree .qz-note-tree{margin-inline-start:10px}.qz-note-tree :is(summary,button){width:100%;min-height:32px;padding:5px 7px;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--qz-text);text-align:start;overflow-wrap:anywhere;cursor:pointer}.qz-note-tree :is(summary,button){display:flex;align-items:center;gap:7px}.qz-note-tree summary{list-style:none}.qz-note-tree summary::-webkit-details-marker{display:none}.qz-note-tree-arrow{display:flex;flex:none;transform:rotate(-90deg)}.qz-note-tree details[open]>summary>.qz-note-tree-arrow{transform:none}.qz-note-tree-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.qz-note-tree :is(summary,button):hover{background:var(--qz-elevated)}.qz-note-tree button[aria-current=true]{border-color:color-mix(in srgb,var(--qz-accent) 26%,var(--qz-border));background:var(--qz-accent-soft)}.qz-note-toolbar{gap:8px}.qz-note-toolbar-file{display:flex;flex:1 1 18ch;align-items:center;gap:6px;min-width:0}.qz-note-toolbar-file .qz-path{min-width:0}.qz-note-toolbar .qz-note-pin-button{flex:none;padding-inline:8px}.qz-note-pin-button[aria-pressed=true]{color:var(--qz-accent);background:var(--qz-accent-soft)}.qz-note-column{width:100%;max-width:800px;margin-inline:auto;padding-inline:20px}.qz-note-column-narrow{max-width:620px}.qz-note-column-wide{max-width:1000px}.qz-note-column-full{max-width:none}.qz-note-text,.qz-note-block-text{resize:vertical;font:400 var(--qz-note-raw-size, 16px)/var(--qz-note-line-height, 1.55) var(--mono, ui-monospace, monospace)}.qz-app:has(.qz-notes-tab:not([hidden]) .qz-note-source),.qz-content:has(>.qz-notes-tab:not([hidden]) .qz-note-source),.qz-notes-tab:has(.qz-note-source),.qz-notes-view:has(.qz-note-source),.qz-note-editor:has(.qz-note-source),.qz-note-source{display:flex;flex:1;flex-direction:column}.qz-notes-layout:has(.qz-note-source){flex:1}.qz-note-editor:has(.qz-note-source){align-self:stretch}.qz-note-text{flex:1 0 auto;min-height:360px}.qz-note-message{font-size:12px}.qz-note-message:empty{display:none}.qz-note-save-status{white-space:nowrap}.qz-note-pin-button[aria-disabled=true]{opacity:.55;cursor:default}.qz-notes-rendered{min-width:0;min-height:360px;padding-block:14px 32px;font:400 var(--qz-note-text-size, 16px)/var(--qz-note-line-height, 1.55) var(--qz-note-font, var(--font-body, sans-serif));overflow-wrap:anywhere}.qz-notes-rendered :is(p,ul,ol,pre,blockquote,table,h1,h2,h3,h4,h5,h6){margin:0 0 .9em}.qz-notes-rendered :is(ul,ol){padding-inline-start:1.5em}.qz-notes-rendered :is(code,pre){font-family:var(--mono, ui-monospace, monospace);font-size:.9em}.qz-notes-rendered pre code{font-size:inherit}.qz-notes-rendered pre{overflow-x:auto;padding:10px;border:1px solid var(--qz-border);border-radius:6px;background:var(--qz-elevated)}.qz-notes-rendered blockquote{padding:6px 12px;border-inline-start:3px solid var(--qz-border)}.qz-notes-rendered blockquote>:last-child{margin-block-end:0}.qz-notes-rendered :not(pre)>code{padding:.1em .3em;border-radius:4px;background:var(--qz-elevated)}.qz-notes-rendered :is(.hljs-keyword,.hljs-selector-tag,.hljs-meta){color:color-mix(in srgb,var(--qz-accent) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-string,.hljs-regexp){color:color-mix(in srgb,var(--qz-ok) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-number,.hljs-literal,.hljs-variable){color:color-mix(in srgb,var(--qz-warning) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-title,.hljs-attr,.hljs-built_in,.hljs-attribute){color:color-mix(in srgb,var(--qz-info) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-comment,.hljs-quote){color:var(--qz-muted);font-style:italic}.qz-notes-rendered table{display:block;border-collapse:collapse;overflow-x:auto}.qz-notes-rendered :is(th,td){padding:5px 8px;border:1px solid var(--qz-border)}.qz-notes-rendered a{color:var(--qz-accent)}.qz-note-task{list-style:none}.qz-note-task-checkbox{accent-color:var(--qz-accent);margin-inline:0 .25em}.qz-note-task-completed>.qz-note-task-text,.qz-note-task-completed>p>.qz-note-task-text{color:var(--qz-muted);text-decoration:line-through}.qz-note-block{position:relative;display:flow-root}.qz-note-block-content{cursor:text}.qz-note-block .qz-note-edit-block{position:absolute;inset-block-start:0;inset-inline-end:-20px;min-height:24px;width:24px;padding:2px;color:var(--qz-muted);opacity:0}.qz-note-block:hover .qz-note-edit-block,.qz-note-edit-block:focus-visible{opacity:1}.qz-note-block-editor{display:grid;gap:6px;margin-block-end:.9em}.qz-note-block-editor .qz-actions{justify-content:end}.qz-wikilink{max-width:100%;padding:0;border:0;background:transparent;color:var(--qz-accent);font:inherit;text-align:start;text-decoration:underline;overflow-wrap:anywhere;cursor:pointer}.qz-note-backlinks{border-top:1px solid var(--qz-border);padding-top:12px}.qz-note-backlinks h3{margin:0 0 6px;font-size:14px}.qz-note-backlinks ul{display:grid;gap:4px;margin:0;padding-inline-start:1.25em}.qz-note-image{color:var(--qz-muted)}@container qz-app (max-width: 680px){.qz-notes-layout,.qz-note-create{grid-template-columns:minmax(0,1fr)}.qz-notes-layout:has(.qz-note-source){grid-template-rows:auto 1fr}.qz-note-browser{max-height:35vh}}", Ac = 3e3, Kt = [], on = 25, Nc = 5e4;
function pa(e, t) {
  const n = t.split("/").slice(0, -1), a = n.map((r, i) => `${n.slice(0, i + 1).join("/")}/`);
  return [...e.filter((r) => !a.includes(r)), ...a].slice(-50);
}
function Dc(e, t, n) {
  const a = Ra(), [r, i] = F(null), [o, s] = F(null), [l, u] = F(null), [p, h] = F(0);
  oe(() => {
    if (!t || !a) return;
    let m = !1, d, w, z;
    const k = async () => {
      try {
        const x = await ze(Dt(e));
        if (m) return;
        const y = x.workspaces.filter((b) => b.workspace.companion), E = JSON.stringify(y);
        z !== E && (i(y), z = E);
        const v = y.find((b) => b.workspace.id === n);
        if (!x.available) throw new Error(x.error ?? "The Markdown index is unavailable.");
        if (v) {
          const b = `${v.workspace.id}:${v.index.indexedAt ?? ""}`;
          if (b !== w) {
            const T = await ze(ti(e, v.workspace.id));
            if (m) return;
            s({ workspaceId: v.workspace.id, notes: T.notes }), w = b;
          }
        } else
          s(null);
        u(null);
      } catch (x) {
        m || u(ye(x));
      } finally {
        m || (d = setTimeout(k, Ac));
      }
    };
    return k(), () => {
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
function Sc({ api: e, active: t, workspaceId: n, request: a, preferences: r, onPreferencesChange: i, onSettings: o }) {
  var ne;
  const [s, l] = F(null), [u, p] = F(""), [h, f] = F(!1), [m, d] = F(""), [w, z] = F(null), [k, x] = F(!1), y = ae(!1), { workspaces: E, current: v, notes: b, failure: T, refresh: A, visible: L } = Dc(e, t, n), { edits: j, edit: H, loaded: M, save: Z } = Ec(e, A), Y = ae(null), re = ae(null), C = ae(null), I = ae(null), q = ae(r.noteFolders), $ = ae(n), U = ae("standard"), K = r.noteFolders[String(n)] ?? at, { limit: S } = K, J = Te(() => new Set(K.pinned), [K.pinned]), ie = Te(() => new Set(K.expanded), [K.expanded]), he = jr(u.trim().toLowerCase()), V = Te(() => he ? (b ?? Kt).filter((O) => O.title.toLowerCase().includes(he) || O.path.toLowerCase().includes(he)) : b ?? Kt, [b, he]), _e = Te(() => V.filter((O) => J.has(O.path)), [V, J]), qe = Te(() => V.filter((O) => !J.has(O.path)), [V, J]), Ie = Te(() => xc(qe.slice(0, S)), [qe, S]), be = (ne = v == null ? void 0 : v.index.writeBlocked) == null ? void 0 : ne.message;
  ka(() => {
    q.current = r.noteFolders, $.current = n, r.noteWidth !== "full" && (U.current = r.noteWidth);
  }, [r.noteFolders, r.noteWidth, n]);
  const ve = Qe((O, _) => {
    const R = q.current[O] ?? at, D = _(R);
    q.current = { ...q.current, [O]: D }, i({ noteFolders: { [O]: D } });
  }, [i]), Ee = Qe((O, _ = !1) => {
    l(_ ? sn(O) : null), ve(O.workspaceId, (R) => ({
      ...R,
      lastNote: O.path,
      expanded: pa(R.expanded, O.path)
    }));
  }, [ve]);
  if (oe(() => {
    p(""), f(!1), d(""), z(null), l(null);
  }, [n]), oe(() => {
    !t || !a || a.workspaceId !== n || a === I.current || (I.current = a, Ee(a), p(""), f(!1));
  }, [t, a, Ee, n]), oe(() => {
    var O;
    h && ((O = re.current) == null || O.focus());
  }, [h]), oe(() => {
    if (!t || !v) return;
    const O = (_) => {
      var D, P, se, ue;
      if (_.defaultPrevented || _.isComposing || _.altKey) return;
      const R = _.target instanceof Element ? _.target : null;
      if (!(R && R !== document.body && !((P = (D = Y.current) == null ? void 0 : D.closest(".qz-app")) != null && P.contains(R)))) {
        if (_.key === "/" && !_.metaKey && !_.ctrlKey) {
          if (R != null && R.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
          _.preventDefault(), (se = C.current) == null || se.focus();
        }
        !_.shiftKey && _.key.toLowerCase() === "n" && (_.metaKey || _.ctrlKey) && !k && !be && (_.preventDefault(), f(!0), z(null), (ue = re.current) == null || ue.focus());
      }
    };
    return document.addEventListener("keydown", O), () => document.removeEventListener("keydown", O);
  }, [t, k, v, be]), !E) return T ? /* @__PURE__ */ c(fe, { failure: T }) : /* @__PURE__ */ c("p", { className: "qz-empty", role: "status", children: "Loading folders…" });
  if (!v) return /* @__PURE__ */ g("div", { className: "qz-stack", children: [
    /* @__PURE__ */ c(fe, { failure: T }),
    /* @__PURE__ */ g("div", { className: "qz-empty", children: [
      /* @__PURE__ */ c("span", { className: "qz-empty-icon", children: /* @__PURE__ */ c(Q, { name: "folder" }) }),
      /* @__PURE__ */ c("h2", { children: "Connect a notes folder" }),
      /* @__PURE__ */ c("p", { children: "Add a folder of Markdown files in Settings to browse and edit your notes." }),
      /* @__PURE__ */ c("button", { type: "button", className: "qz-button", "data-variant": "primary", onClick: o, children: "Open Settings" })
    ] })
  ] });
  const G = v.workspace.id, pe = K.lastNote ? { workspaceId: G, path: K.lastNote } : null, te = pe ? sn(pe) : "", Ce = (O) => Ee({ workspaceId: G, path: O }), ge = r.folderAppearance[G], W = ge && He(ge.color), Ae = dn(v.index), le = (O) => ve(G, (_) => ({
    ..._,
    expanded: _.expanded.includes(O) ? _.expanded.filter((R) => R !== O) : pa(_.expanded, O)
  })), ee = (O) => ve(G, (_) => ({
    ..._,
    pinned: _.pinned.includes(O) ? _.pinned.filter((R) => R !== O) : [..._.pinned, O].slice(0, on)
  })), N = () => ve(G, (O) => ({
    ...O,
    limit: Math.min(Nc, O.limit + at.limit)
  })), X = async () => {
    const O = m.trim();
    if (!(!O || y.current || be)) {
      y.current = !0, x(!0), z(null);
      try {
        const _ = await ze(ai(e, G, O));
        $.current === G && (d(""), f(!1), (q.current[G] ?? at).lastNote === K.lastNote && Ee({ workspaceId: G, path: _.path }, !0)), A();
      } catch (_) {
        $.current === G && z(ye(_));
      } finally {
        y.current = !1, x(!1);
      }
    }
  };
  return /* @__PURE__ */ g("section", { ref: Y, className: "qz-stack qz-notes-view", "aria-label": "Notes", children: [
    /* @__PURE__ */ c("style", { children: Cc }),
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
          onClick: () => {
            f((O) => !O), z(null);
          },
          disabled: k || !!be,
          children: [
            /* @__PURE__ */ c(Q, { name: "plus" }),
            "New note"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ c(fe, { failure: T }),
    Ae && /* @__PURE__ */ c("div", { className: "qz-notice", role: "note", children: Ae }),
    h && /* @__PURE__ */ g("form", { className: "qz-note-create qz-panel-surface", onSubmit: (O) => {
      O.preventDefault(), X();
    }, children: [
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Note path",
        /* @__PURE__ */ c(
          "input",
          {
            ref: re,
            className: "qz-input",
            value: m,
            placeholder: "projects/launch.md",
            disabled: k,
            onChange: (O) => d(O.target.value),
            required: !0
          }
        )
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ c("button", { type: "submit", className: "qz-button", "data-variant": "primary", disabled: !m.trim() || k || !!be, children: "Create note" }),
        /* @__PURE__ */ c("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: k, onClick: () => f(!1), children: "Cancel" })
      ] }),
      /* @__PURE__ */ c(fe, { failure: w })
    ] }),
    /* @__PURE__ */ g("div", { className: "qz-notes-layout", children: [
      /* @__PURE__ */ g("aside", { className: "qz-note-browser qz-panel-surface", "aria-label": "Notes browser", children: [
        /* @__PURE__ */ g("h3", { className: "qz-note-browser-heading", children: [
          (ge == null ? void 0 : ge.emoji) && W && /* @__PURE__ */ c("span", { className: "qz-folder-dot", "aria-hidden": "true", style: { backgroundColor: W } }),
          /* @__PURE__ */ c("span", { className: "qz-note-browser-icon", "aria-hidden": "true", style: { color: W }, children: (ge == null ? void 0 : ge.emoji) || /* @__PURE__ */ c(Q, { name: "folder" }) }),
          v.workspace.name
        ] }),
        /* @__PURE__ */ g("label", { className: "qz-field", children: [
          "Search notes",
          /* @__PURE__ */ c(
            "input",
            {
              ref: C,
              type: "search",
              className: "qz-input",
              value: u,
              placeholder: "Title or path",
              "aria-keyshortcuts": "/",
              onChange: (O) => p(O.target.value)
            }
          )
        ] }),
        b === null && !T && /* @__PURE__ */ c("p", { role: "status", className: "qz-muted", children: "Loading notes…" }),
        b !== null && V.length === 0 && /* @__PURE__ */ c("p", { className: "qz-muted", children: he ? "No notes match your search." : v.index.state === "scanning" ? "Indexing notes…" : "No notes in this folder yet." }),
        _e.length > 0 && /* @__PURE__ */ g("section", { className: "qz-note-pins", "aria-labelledby": "qz-pinned-notes", children: [
          /* @__PURE__ */ c("h4", { id: "qz-pinned-notes", children: "Pinned notes" }),
          /* @__PURE__ */ c("ul", { className: "qz-note-tree", children: _e.map((O) => /* @__PURE__ */ c(Or, { note: O, icon: "pin", selected: pe == null ? void 0 : pe.path, onOpen: Ce }, O.path)) })
        ] }),
        qe.length > 0 && /* @__PURE__ */ c(
          Br,
          {
            branch: Ie,
            prefix: "",
            selected: pe == null ? void 0 : pe.path,
            searching: !!he,
            expanded: ie,
            onOpen: Ce,
            onToggle: le
          },
          he ? "search" : "browse"
        ),
        qe.length > S && /* @__PURE__ */ c(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            onClick: N,
            children: "Show more notes"
          }
        )
      ] }),
      pe ? /* @__PURE__ */ c(
        Tc,
        {
          api: e,
          active: t,
          location: pe,
          edits: j.get(te),
          onDraft: (O, _) => H(te, O, _),
          onLoaded: (O) => M(te, O),
          onSave: () => {
            be || Z(pe);
          },
          writeBlocked: !!be,
          notes: b ?? Kt,
          onOpen: Ce,
          loadBacklinks: t && L,
          indexRevision: v.index.indexedAt,
          view: s === te ? "raw" : r.noteView,
          focusEditor: s === te,
          width: r.noteWidth,
          pinned: J.has(pe.path),
          pinLimitReached: K.pinned.length >= on,
          onPin: () => ee(pe.path),
          onViewChange: (O) => {
            l(null), i({ noteView: O });
          },
          onWidthChange: () => i({ noteWidth: r.noteWidth === "full" ? U.current : "full" })
        },
        te
      ) : /* @__PURE__ */ g("div", { className: "qz-empty", children: [
        /* @__PURE__ */ c("span", { className: "qz-empty-icon", children: /* @__PURE__ */ c(Q, { name: "note" }) }),
        /* @__PURE__ */ c("h3", { children: "Open a note" }),
        /* @__PURE__ */ c("p", { children: "Choose one from the folder tree or create a new note." })
      ] })
    ] })
  ] });
}
function Or({ note: e, icon: t = "note", selected: n, onOpen: a }) {
  return /* @__PURE__ */ c("li", { children: /* @__PURE__ */ g(
    "button",
    {
      type: "button",
      "aria-current": e.path === n ? "true" : void 0,
      title: e.path,
      onClick: () => a(e.path),
      children: [
        /* @__PURE__ */ c(Q, { name: t }),
        e.title
      ]
    }
  ) });
}
function Br({ branch: e, prefix: t, selected: n, searching: a, expanded: r, onOpen: i, onToggle: o }) {
  return /* @__PURE__ */ g("ul", { className: "qz-note-tree", children: [
    [...e.folders].map(([s, l]) => {
      const u = `${t}${s}/`;
      return /* @__PURE__ */ c("li", { children: /* @__PURE__ */ g("details", { open: a || r.has(u), children: [
        /* @__PURE__ */ g("summary", { title: s, onClick: (p) => {
          a || (p.preventDefault(), o(u));
        }, children: [
          /* @__PURE__ */ c("span", { className: "qz-note-tree-arrow", children: /* @__PURE__ */ c(Q, { name: "down" }) }),
          /* @__PURE__ */ c(Q, { name: "folder" }),
          /* @__PURE__ */ c("span", { className: "qz-note-tree-name", children: s })
        ] }),
        /* @__PURE__ */ c(
          Br,
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
    e.notes.map((s) => /* @__PURE__ */ c(Or, { note: s, selected: n, onOpen: i }, s.path))
  ] });
}
function Tc({ api: e, active: t, location: n, edits: a, onDraft: r, onLoaded: i, onSave: o, writeBlocked: s, notes: l, onOpen: u, loadBacklinks: p, indexRevision: h, view: f, focusEditor: m, width: d, pinned: w, pinLimitReached: z, onPin: k, onViewChange: x, onWidthChange: y }) {
  const { workspaceId: E, path: v } = n, { draft: b, saved: T, saving: A } = a ?? {}, [L, j] = F(null), H = f === "rendered", [M, Z] = F(""), [Y, re] = F(null), [C, I] = F(!1), [q, $] = F(!1), [U, K] = F(!1), [S, J] = F(null), [ie, he] = F(null), [V, _e] = F(null), qe = ae(!1), Ie = ae(null), be = ae(null), ve = ae(null), Ee = !!b, G = b ?? T ?? L, pe = G == null ? void 0 : G.text, te = C || q || s || (G == null ? void 0 : G.lineEnding) === "mixed", Ce = V && pe !== void 0 ? pe.slice(V.from, pe.length - (V.original.length - V.to)) : "", ge = (V == null ? void 0 : V.original) ?? pe, W = !te && !V, Ae = Te(() => bc(l), [l]), le = Te(
    () => H && ge !== void 0 ? zc(ge, Ae, { editable: !te }) : [],
    [H, ge, Ae, te]
  ), ee = `qz-note-column qz-note-column-${d}`, N = `Up to ${on} notes can be pinned per folder. Unpin one first.`;
  ka(() => {
    var P;
    const R = ve.current;
    if (!R) return;
    ve.current = null;
    const D = ((P = be.current) == null ? void 0 : P.querySelector(R)) ?? be.current;
    D == null || D.focus({ preventScroll: !0 });
  }, [le]), oe(() => {
    const R = t && !qe.current;
    if (qe.current = t, !t || Ee || A) return;
    if (T && !R && L) {
      j(T), i(T);
      return;
    }
    let D = !1;
    return I(!0), re(null), ze(Vt(e, E, v)).then((P) => {
      D || (j(rn(P)), i(T), (G == null ? void 0 : G.source.hash) !== P.hash && _e(null));
    }).catch((P) => {
      D || re(ye(P));
    }).finally(() => {
      D || I(!1);
    }), () => {
      D = !0, I(!1);
    };
  }, [t, e, Ee, v, A, E]), oe(() => {
    if (!p || h == null) return;
    let R = !1;
    return ze(ni(e, E, v)).then((D) => {
      R || (J(D), he(null));
    }).catch((D) => {
      R || (J(null), he(ye(D)));
    }), () => {
      R = !0;
    };
  }, [e, h, p, v, E]);
  const X = async (R = !1) => {
    if (!(C || A || q)) {
      if (b && !R) {
        K(!0);
        return;
      }
      K(!1), $(!0), re(null), Z("");
      try {
        j(rn(await ze(Vt(e, E, v)))), r(null, b ?? null), i(T), _e(null), Z("Note reloaded.");
      } catch (D) {
        re(ye(D));
      } finally {
        $(!1);
      }
    }
  }, ne = (R) => {
    !G || te || R === G.text || (Z(""), r({ ...G, text: R }));
  }, O = (R, D) => {
    if (te || V || !G) return;
    const P = Sr(G.text, R, D);
    P && _e({ start: R, end: D, ...P, original: G.text });
  }, _ = (R, D = !0) => {
    V && (R ? ne(V.original) : te || o(), D && (ve.current = `[data-edit-start="${V.start}"]`), _e(null));
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
            "aria-disabled": !w && z ? !0 : void 0,
            "aria-describedby": !w && z ? "qz-pin-limit" : void 0,
            title: w ? "Unpin note" : z ? N : "Pin note",
            onClick: () => {
              (w || !z) && k();
            },
            children: /* @__PURE__ */ c(Q, { name: "pin" })
          }
        ),
        !w && z && /* @__PURE__ */ c("span", { id: "qz-pin-limit", className: "qz-muted qz-note-message", role: "status", children: N })
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-actions", role: "group", "aria-label": "Reading options", children: [
        /* @__PURE__ */ c(
          Pr,
          {
            segments: [{ key: "rendered", label: "Rendered" }, { key: "raw", label: "Raw" }],
            value: f,
            onChange: (R) => {
              V ? _(!1, !1) : te || o(), x(R);
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
            children: d === "full" ? "Full width" : "Reading width"
          }
        )
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-actions", role: "group", "aria-label": "Note actions", children: [
        /* @__PURE__ */ c("span", { className: "qz-muted qz-note-message qz-note-save-status", role: "status", children: A ? "Saving note…" : b ? "Unsaved changes" : M || (a != null && a.didSave ? "Note saved." : "") }),
        /* @__PURE__ */ c(
          "button",
          {
            ref: Ie,
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            disabled: C || A || q,
            onMouseDown: (R) => R.preventDefault(),
            onClick: () => void X(),
            children: "Reload from disk"
          }
        ),
        /* @__PURE__ */ c(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "primary",
            disabled: !b || b.conflict || te,
            onClick: () => {
              V ? _(!1) : o();
            },
            children: "Save note"
          }
        )
      ] })
    ] }),
    U && b && /* @__PURE__ */ g(ct, { label: "Replace unsaved draft", onCancel: () => K(!1), children: [
      /* @__PURE__ */ c("p", { children: "Replace your unsaved draft with the version on disk?" }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ c("button", { type: "button", className: "qz-button qz-destructive", onClick: () => void X(!0), children: "Replace draft" }),
        /* @__PURE__ */ c("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => K(!1), children: "Keep draft" })
      ] })
    ] }),
    /* @__PURE__ */ c(fe, { failure: Y ?? (a == null ? void 0 : a.failure) ?? null }),
    C && !G && /* @__PURE__ */ c("p", { className: "qz-muted", role: "status", children: "Loading note…" }),
    (b == null ? void 0 : b.conflict) && /* @__PURE__ */ c("div", { className: "qz-notice", role: "alert", children: "The note changed on disk. Your draft is still here. Copy or review your changes before reloading from disk." }),
    (G == null ? void 0 : G.lineEnding) === "mixed" && /* @__PURE__ */ c("div", { className: "qz-notice", role: "note", children: "This note has mixed line endings and opens read-only to preserve them." }),
    G && (H ? /* @__PURE__ */ g(
      "div",
      {
        ref: be,
        className: `qz-notes-rendered qz-note-headings ${ee}`,
        "aria-label": "Markdown preview",
        tabIndex: -1,
        onClick: (R) => {
          if (!(R.target instanceof Element)) return;
          const D = R.target.closest("button.qz-wikilink[data-note-path]"), P = D == null ? void 0 : D.dataset.notePath;
          P && l.some((ue) => ue.path === P) && u(P);
          const se = R.target.closest("input.qz-note-task-checkbox[data-note-task-line]");
          if (se && !te) {
            let ue = Number(se.dataset.noteTaskLine);
            V && ue >= V.end && (ue += Ce.split(`
`).length - (V.end - V.start));
            const de = _c(G.text, ue, se.checked);
            de !== G.text && (ve.current = `input[data-note-task-line="${ue}"]`, _e(null), ne(de), o());
          }
        },
        children: [
          !le.length && /* @__PURE__ */ c("p", { className: "qz-muted", children: "No content yet." }),
          le.map(({ html: R, start: D, end: P }, se) => {
            if (V && D === V.start)
              return /* @__PURE__ */ g("div", { className: "qz-note-block-editor", onBlur: (de) => {
                const Oe = de.relatedTarget;
                Oe === Ie.current || xn(Oe) || Oe instanceof Node && de.currentTarget.contains(Oe) || _(!1, !1);
              }, children: [
                /* @__PURE__ */ c(
                  "textarea",
                  {
                    "aria-label": "Block Markdown",
                    className: "qz-input qz-note-block-text",
                    autoFocus: !0,
                    spellCheck: !1,
                    rows: Math.max(2, (P ?? D + 1) - D),
                    readOnly: te,
                    value: Ce,
                    onChange: (de) => ne(V.original.slice(0, V.from) + de.target.value + V.original.slice(V.to)),
                    onKeyDown: (de) => {
                      de.nativeEvent.isComposing || (de.key === "Escape" || de.key === "Enter" && (de.metaKey || de.ctrlKey)) && (de.preventDefault(), de.stopPropagation(), _(de.key === "Escape"));
                    }
                  }
                ),
                /* @__PURE__ */ g("div", { className: "qz-actions", children: [
                  /* @__PURE__ */ c(
                    "button",
                    {
                      type: "button",
                      className: "qz-button",
                      onMouseDown: (de) => de.preventDefault(),
                      onClick: () => _(!1),
                      children: "Done"
                    }
                  ),
                  /* @__PURE__ */ c(
                    "button",
                    {
                      type: "button",
                      className: "qz-button",
                      "data-variant": "quiet",
                      onMouseDown: (de) => de.preventDefault(),
                      onClick: () => _(!0),
                      children: "Cancel"
                    }
                  )
                ] })
              ] }, se);
            const ue = W && D !== void 0 && P !== void 0;
            return /* @__PURE__ */ g("div", { className: "qz-note-block", children: [
              /* @__PURE__ */ c(
                "div",
                {
                  className: ue ? "qz-note-block-content" : void 0,
                  onClick: ue ? (de) => {
                    var Oe;
                    de.target instanceof Element && !de.target.closest("a, button, input, summary") && !((Oe = window.getSelection()) != null && Oe.toString()) && O(D, P);
                  } : void 0,
                  dangerouslySetInnerHTML: { __html: R }
                }
              ),
              ue && /* @__PURE__ */ c(
                "button",
                {
                  type: "button",
                  className: "qz-button qz-note-edit-block",
                  "data-edit-start": D,
                  "aria-label": `Edit block at line ${D + 1}`,
                  title: "Edit block",
                  onClick: () => O(D, P),
                  children: /* @__PURE__ */ c(Q, { name: "edit" })
                }
              )
            ] }, se);
          })
        ]
      }
    ) : /* @__PURE__ */ g("label", { className: `qz-field qz-note-source ${ee}`, children: [
      "Note Markdown",
      /* @__PURE__ */ c(
        "textarea",
        {
          autoFocus: m,
          className: "qz-input qz-note-text",
          spellCheck: !1,
          value: G.text,
          readOnly: te,
          onChange: (R) => ne(R.target.value),
          onBlur: (R) => {
            !te && R.relatedTarget !== Ie.current && !xn(R.relatedTarget) && o();
          }
        }
      )
    ] })),
    G && (ie || !!(S != null && S.notes.length)) && /* @__PURE__ */ g("section", { className: "qz-note-backlinks", "aria-label": "Backlinks", children: [
      /* @__PURE__ */ c("h3", { children: "Backlinks" }),
      /* @__PURE__ */ c(fe, { failure: ie }),
      S && /* @__PURE__ */ c("ul", { children: S.notes.map((R) => /* @__PURE__ */ c("li", { children: /* @__PURE__ */ c("button", { type: "button", className: "qz-wikilink", title: R.path, onClick: () => u(R.path), children: R.title }) }, R.path)) }),
      (S == null ? void 0 : S.truncated) && /* @__PURE__ */ g("p", { className: "qz-muted", children: [
        "Only the first ",
        S.notes.length,
        " backlinks are shown."
      ] })
    ] })
  ] });
}
function Fc(e, t) {
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
const Mc = [
  ["Indigo", "#6757c7"],
  ["Blue", "#19589f"],
  ["Teal", "#147864"],
  ["Rose", "#ad3563"]
];
function Ic(e, t) {
  const n = document.createElement("canvas");
  n.width = n.height = 1;
  const a = n.getContext("2d", { willReadFrequently: !0 });
  if (!a) return null;
  a.fillStyle = t, a.fillRect(0, 0, 1, 1);
  const [r, i, o] = a.getImageData(0, 0, 1, 1).data;
  a.fillStyle = e, a.fillRect(0, 0, 1, 1);
  const [s, l, u] = a.getImageData(0, 0, 1, 1).data, p = Qt(r, i, o), h = Qt(s, l, u);
  return (Math.max(p, h) + 0.05) / (Math.min(p, h) + 0.05);
}
function Nt({ label: e, value: t, onChange: n, disabled: a, allowAccent: r = !0, checkContrast: i = !1 }) {
  const o = Ur(), s = t !== "theme" && t !== "accent", [l, u] = F(s ? t : ""), [p, h] = F(null), f = ae(null);
  oe(() => u(s ? t : ""), [t, s]), oe(() => {
    const w = f.current;
    if (!w || t === "theme" || a) return;
    const z = () => {
      const y = getComputedStyle(w);
      h(Ic(y.color, y.backgroundColor));
    };
    z();
    const k = new MutationObserver(z);
    for (let y = w.parentElement; y; y = y.parentElement)
      k.observe(y, { attributes: !0, attributeFilter: ["class", "style", "data-theme", "data-color-scheme"] });
    const x = matchMedia("(prefers-color-scheme: dark)");
    return x.addEventListener("change", z), () => {
      k.disconnect(), x.removeEventListener("change", z);
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
            onChange: (w) => n(w.currentTarget.value === "custom" ? "#6757c7" : Xe(w.currentTarget.value)),
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
    s && /* @__PURE__ */ g(ke, { children: [
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
              placeholder: "#6757c7",
              maxLength: 7,
              spellCheck: !1,
              "aria-invalid": m || void 0,
              "aria-describedby": m ? `${o}-format` : void 0,
              onChange: (w) => {
                const z = w.currentTarget.value;
                u(z);
                const k = z.match(/^#?([0-9a-f]{6})$/i);
                k && n(Xe(`#${k[1].toLowerCase()}`));
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
            onChange: (w) => n(Xe(w.currentTarget.value))
          }
        )
      ] }),
      m && /* @__PURE__ */ c("p", { id: `${o}-format`, className: "qz-muted", children: "Use six hexadecimal digits, for example #6757c7." }),
      /* @__PURE__ */ c("div", { className: "qz-color-swatches", role: "group", "aria-label": `${e} swatches`, children: Mc.map(([w, z]) => /* @__PURE__ */ c(
        "button",
        {
          type: "button",
          title: w,
          "aria-label": w,
          "aria-pressed": t === z,
          disabled: a,
          style: { backgroundColor: z },
          onClick: () => n(z)
        },
        z
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
const Oc = '.qz-settings{display:grid;align-content:start;gap:20px;width:100%;max-width:1100px;min-width:0;margin-inline:auto;container:qz-settings / inline-size}.qz-settings .qz-settings-grid,.qz-settings-fields{display:grid;align-items:start;gap:20px}.qz-settings-fields{grid-template-columns:repeat(auto-fit,minmax(min(100%,245px),1fr))}.qz-settings-grid[data-empty]{align-items:start}.qz-settings-header,.qz-settings-nav{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.qz-settings-header{justify-content:space-between}.qz-settings-saved{font-size:13px}.qz-settings-nav .qz-button[aria-current=true]{border-color:var(--qz-accent);background:var(--qz-accent-soft)}.qz-onboarding{display:grid;gap:8px;padding-inline-start:20px;margin-block:0}.qz-settings-appearance{display:grid;gap:12px;padding:16px}.qz-settings-appearance .qz-settings-heading{justify-content:space-between}.qz-settings-appearance .qz-settings-heading .qz-button{min-height:32px}.qz-settings-color-field{display:grid;gap:8px;min-width:0;font-size:13px}.qz-settings-color-mode{display:flex;align-items:end;gap:6px;min-width:0}.qz-settings-color-mode .qz-field{flex:1}.qz-settings-color-field input[type=color]{flex:none;width:40px;padding:4px;cursor:pointer}.qz-color-swatches{display:flex;flex-wrap:wrap;gap:7px}.qz-color-swatches button{width:32px;height:32px;padding:0;border:1px solid var(--qz-border);border-radius:8px;cursor:pointer}.qz-color-swatches button[aria-pressed=true]{box-shadow:inset 0 0 0 2px #fff,inset 0 0 0 3px #000}.qz-settings-appearance-preview{display:grid;gap:8px;min-width:0;padding:16px 20px;border:1px solid var(--qz-border);border-radius:8px;color:var(--qz-preview-text);background:var(--qz-preview-background);font-family:var(--qz-note-font, var(--font-body, sans-serif));font-size:var(--qz-note-text-size);line-height:var(--qz-note-line-height)}.qz-settings-appearance-preview[data-preview-theme=light]{--qz-preview-background: #fff;--qz-preview-text: #20232a}.qz-settings-appearance-preview[data-preview-theme=dark]{--qz-preview-background: #17191e;--qz-preview-text: #ececf0}.qz-settings-appearance-preview>span{font-size:13px}@container qz-settings (min-width: 760px){.qz-settings .qz-settings-grid{grid-template-columns:minmax(0,1fr) minmax(260px,330px)}.qz-settings .qz-settings-grid[data-empty]{grid-template-columns:repeat(2,minmax(0,1fr))}}.qz-settings .qz-settings-folders,.qz-settings .qz-settings-add,.qz-settings .qz-settings-folder,.qz-settings .qz-settings-migration,.qz-settings .qz-settings-notice{display:grid;min-width:0;gap:12px}.qz-settings .qz-settings-add,.qz-settings .qz-settings-folder{padding:16px}.qz-settings .qz-settings-add p{margin-block-start:4px}.qz-settings .qz-settings-add .qz-input{width:100%}.qz-settings .qz-settings-add>.qz-button{justify-self:start}.qz-settings .qz-settings-heading,.qz-settings .qz-settings-folder-identity,.qz-settings .qz-settings-folder-controls,.qz-settings .qz-settings-actions,.qz-settings .qz-settings-check{display:flex;align-items:center}.qz-settings .qz-settings-heading,.qz-settings .qz-settings-folder-identity,.qz-settings .qz-settings-check{gap:10px}.qz-settings .qz-settings-heading h3,.qz-settings .qz-settings-add h3,.qz-settings .qz-settings-folder h4{margin:0;color:var(--qz-text);font-size:15px;font-weight:650}.qz-settings .qz-settings-count{padding:1px 7px;border:1px solid var(--qz-border);border-radius:999px;color:var(--qz-muted);font-size:12px;font-variant-numeric:tabular-nums}.qz-settings .qz-settings-folder-icon{display:grid;flex:none;width:36px;height:36px;place-items:center;border-radius:9px;background:var(--qz-accent-soft);color:var(--qz-accent)}.qz-settings .qz-settings-folder-identity>div{display:grid;min-width:0;gap:3px;overflow-wrap:anywhere}.qz-settings .qz-settings-folder-controls{justify-content:space-between;flex-wrap:wrap;gap:8px 12px;padding-block-start:10px;border-top:1px solid var(--qz-border)}.qz-settings .qz-settings-actions{flex-wrap:wrap;gap:4px}.qz-settings .qz-settings-check{min-height:32px;font-size:13px;cursor:pointer}.qz-settings .qz-settings-check input{flex:none;accent-color:var(--qz-accent)}.qz-settings .qz-settings-toggle{display:inline-grid;align-items:center;justify-items:start;-webkit-appearance:none;-moz-appearance:none;appearance:none;width:34px;height:20px;padding:2px;margin:0;border:1px solid var(--qz-muted);border-radius:999px;background:var(--qz-elevated);cursor:inherit}.qz-settings .qz-settings-toggle:before{width:12px;height:12px;border-radius:50%;background:var(--qz-muted);content:""}.qz-settings .qz-settings-toggle:checked{justify-items:end;border-color:var(--qz-accent);background:var(--qz-accent-soft)}.qz-settings .qz-settings-toggle:checked:before{background:var(--qz-accent)}.qz-settings .qz-settings-toggle:disabled{opacity:.6;cursor:default}@media (forced-colors: active){.qz-settings .qz-settings-toggle{display:inline-block;-webkit-appearance:auto;-moz-appearance:auto;appearance:auto;width:16px;height:16px}}.qz-settings .qz-settings-migration,.qz-settings .qz-settings-result{padding:12px;border:1px solid var(--qz-border);border-radius:9px;background:var(--qz-canvas);font-size:13px}.qz-settings .qz-settings-migration{gap:6px}.qz-settings .qz-settings-notice{gap:8px;overflow-wrap:anywhere}.qz-settings .qz-settings-migration-files{max-height:200px;margin:0;padding-inline-start:20px;overflow-y:auto;list-style:disc}.qz-settings .qz-button[data-destructive]{color:var(--qz-danger)}.qz-settings-disclosure{border-top:1px solid var(--qz-border);font-size:13px}.qz-settings-disclosure>summary{padding-block:8px;font-weight:650;cursor:pointer}.qz-column-list{display:grid;gap:8px;padding:0;list-style:none}.qz-column-row{display:flex;flex-wrap:wrap;align-items:end;gap:6px 10px}.qz-column-row .qz-field{flex:1 1 140px}.qz-column-row .qz-field>span{overflow-wrap:anywhere}.qz-column-row .qz-input,.qz-agent-prompt{width:100%}.qz-column-row .qz-column-color{width:44px;padding:4px}.qz-column-row .qz-settings-actions{align-items:end}.qz-column-row>.qz-stack{flex:1 1 160px;gap:4px}.qz-settings-board-folder h4{margin-block:0 6px}';
function It() {
  const [e, t] = F(!1), [n, a] = F(null);
  return { busy: e, failure: n, run: async (i) => {
    t(!0), a(null);
    try {
      return await i(), !0;
    } catch (o) {
      return a(ye(o)), !1;
    } finally {
      t(!1);
    }
  } };
}
const fa = {
  defaults: "Defaults",
  appearance: "Appearance",
  notes: "Notes",
  board: "Board",
  folders: "Folders"
}, Bc = {
  loading: "Loading preferences…",
  saving: "Saving…",
  saved: "Saved",
  local: "Saved in this browser. Waiting to sync.",
  unavailable: "Preferences couldn’t be saved."
}, Lc = { tasks: "Tasks", todos: "TODOs", notes: "Notes", settings: "Settings" };
function $c({
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
  const [u, p] = F(null), [h, f] = F(null), [m, d] = F(null), [w, z] = F(0), k = r ?? (u != null && u.length ? "defaults" : "folders"), x = (u == null ? void 0 : u.filter((v) => v.companion)) ?? [], y = x.find((v) => v.id === o), E = () => {
    z((v) => v + 1), l();
  };
  return oe(() => {
    let v = !1;
    return Promise.all([xa(e), Dt(e)]).then(([b, T]) => {
      v || (p(b), d(T.writeBlocked ?? null), f(null));
    }).catch((b) => !v && f(ye(b))), () => {
      v = !0;
    };
  }, [e, w]), /* @__PURE__ */ g("div", { className: "qz-settings", children: [
    /* @__PURE__ */ c("style", { children: Oc }),
    /* @__PURE__ */ g("header", { className: "qz-settings-header", children: [
      /* @__PURE__ */ c("h2", { className: "qz-section-title", children: "Settings" }),
      /* @__PURE__ */ c("span", { className: "qz-muted qz-settings-saved", role: "status", children: Bc[a] })
    ] }),
    /* @__PURE__ */ c("nav", { "aria-label": "Settings sections", className: "qz-settings-nav", children: Object.keys(fa).map((v) => /* @__PURE__ */ c(
      "button",
      {
        type: "button",
        className: "qz-button",
        "aria-current": k === v ? "true" : void 0,
        onClick: () => i(v),
        children: fa[v]
      },
      v
    )) }),
    /* @__PURE__ */ c(fe, { failure: h }),
    /* @__PURE__ */ c(fe, { failure: m }),
    k === "defaults" && /* @__PURE__ */ g(nt, { title: "Defaults", children: [
      /* @__PURE__ */ g("div", { className: "qz-settings-fields", children: [
        /* @__PURE__ */ c(
          We,
          {
            label: "Start on",
            value: t.startOn,
            options: { last: "Last used tab", ...Lc },
            onChange: (v) => n({ startOn: v })
          }
        ),
        /* @__PURE__ */ g("label", { className: "qz-field", children: [
          "Default workspace",
          /* @__PURE__ */ g("select", { className: "qz-input", value: t.workspaceId && x.some((v) => v.id === t.workspaceId) ? String(t.workspaceId) : "", onChange: (v) => s(Number(v.currentTarget.value) || null), children: [
            /* @__PURE__ */ c("option", { value: "", children: "First connected folder" }),
            x.map((v) => {
              var b;
              return /* @__PURE__ */ c("option", { value: v.id, children: [(b = t.folderAppearance[v.id]) == null ? void 0 : b.emoji, v.name].filter(Boolean).join(" ") }, v.id);
            })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ c("p", { className: "qz-muted", children: "Changing the workspace here or in the header remembers that folder for your next visit." })
    ] }),
    k === "appearance" && /* @__PURE__ */ c(nt, { title: "Appearance", children: /* @__PURE__ */ g("div", { className: "qz-settings-fields", children: [
      /* @__PURE__ */ c(
        Nt,
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
              type: "checkbox",
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
              type: "checkbox",
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
    k === "notes" && /* @__PURE__ */ c(Uc, { preferences: t, onPreferencesChange: n }),
    /* @__PURE__ */ g("div", { className: "qz-stack", hidden: k !== "board", children: [
      /* @__PURE__ */ c(nt, { title: "Board view", children: /* @__PURE__ */ c(Ta, { preferences: t, onPreferencesChange: n, workspace: y }) }),
      /* @__PURE__ */ g(nt, { title: "Board columns", children: [
        /* @__PURE__ */ c("p", { className: "qz-muted", children: "Customize columns for each enabled folder. Use Save columns to apply your changes." }),
        !x.length && /* @__PURE__ */ c("button", { className: "qz-button", type: "button", onClick: () => i("folders"), children: "Manage folders" }),
        x.map((v) => /* @__PURE__ */ g("section", { "aria-label": v.name, className: "qz-settings-board-folder", children: [
          /* @__PURE__ */ c("h4", { children: v.name }),
          /* @__PURE__ */ c(
            Jc,
            {
              api: e,
              workspace: v,
              onSaved: (b) => p((T) => (T == null ? void 0 : T.map((A) => A.id === b.id ? { ...A, ...b } : A)) ?? null)
            }
          )
        ] }, v.id))
      ] })
    ] }),
    k === "folders" && /* @__PURE__ */ g("div", { className: "qz-settings-grid", "data-empty": (u == null ? void 0 : u.length) === 0 || void 0, children: [
      (u == null ? void 0 : u.length) !== 0 && /* @__PURE__ */ g("section", { className: "qz-settings-folders", "aria-labelledby": "qz-settings-folders", children: [
        /* @__PURE__ */ c("div", { className: "qz-settings-heading", children: /* @__PURE__ */ c("h3", { id: "qz-settings-folders", children: "Connected folders" }) }),
        !u && !h && /* @__PURE__ */ c("p", { className: "qz-muted", role: "status", children: "Loading folders…" }),
        u == null ? void 0 : u.map((v) => /* @__PURE__ */ c(
          Pc,
          {
            api: e,
            workspace: v,
            writeBlocked: m,
            onChanged: E,
            preferences: t,
            onPreferencesChange: n
          },
          v.id
        ))
      ] }),
      /* @__PURE__ */ c(jc, { api: e, onAdded: (v) => {
        s(v.id), E();
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
  return /* @__PURE__ */ g("section", { className: "qz-panel-surface qz-settings-appearance", "aria-label": e, children: [
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
function jc({ api: e, onAdded: t }) {
  var z;
  const [n, a] = F(""), [r, i] = F(""), [o, s] = F(null), { busy: l, failure: u, run: p } = It(), h = n.trim(), f = h.startsWith("/"), m = (o == null ? void 0 : o.path) === h ? o : null, d = h && !f ? "Enter an absolute folder path starting with /." : (z = m == null ? void 0 : m.failure) == null ? void 0 : z.message;
  oe(() => {
    if (!f) return;
    const k = new AbortController(), x = setTimeout(() => {
      e.post(`${Ue}/workspaces/validate`, { path: h }, { signal: k.signal }).then(() => {
        k.signal.aborted || s({ path: h, failure: null });
      }).catch((y) => {
        if (k.signal.aborted) return;
        const E = ye(y);
        E.code && E.status && E.status < 500 && E.code !== "not_found" && s({ path: h, failure: E });
      });
    }, 300);
    return () => {
      clearTimeout(x), k.abort();
    };
  }, [e, f, h]);
  const w = () => p(async () => {
    const k = await Wr(e, h, r.trim() || void 0);
    a(""), i(""), s(null), t(k);
  });
  return /* @__PURE__ */ g(
    "form",
    {
      className: "qz-panel-surface qz-settings-add",
      "aria-labelledby": "qz-settings-add",
      "aria-busy": l,
      onSubmit: (k) => {
        k.preventDefault(), f && !d && !l && w();
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
                onChange: (k) => {
                  a(k.target.value), s(null);
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
          /* @__PURE__ */ c("input", { className: "qz-input", placeholder: "e.g. Project notes", value: r, disabled: l, onChange: (k) => i(k.target.value) })
        ] }),
        /* @__PURE__ */ c("button", { className: "qz-button", "data-variant": "primary", type: "submit", disabled: l || !f || !!d, children: "Add folder" }),
        /* @__PURE__ */ c(fe, { failure: u })
      ]
    }
  );
}
const ga = { small: "Small", medium: "Medium", large: "Large" };
function Uc({ preferences: e, onPreferencesChange: t }) {
  const { appearance: n } = e, a = (i) => t({ appearance: { ...n, ...i } }), r = n.headingColor === "theme" && n.headingLines === "theme" && n.lineColor === "theme";
  return /* @__PURE__ */ g(ke, { children: [
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
          options: qc,
          onChange: (i) => t({ noteWidth: i })
        }
      ),
      /* @__PURE__ */ c(
        We,
        {
          label: "Reading text size",
          value: e.noteTextSize,
          options: ga,
          onChange: (i) => t({ noteTextSize: i })
        }
      ),
      /* @__PURE__ */ c(
        We,
        {
          label: "Raw editor text size",
          value: e.rawTextSize,
          options: ga,
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
    /* @__PURE__ */ g("section", { className: "qz-panel-surface qz-settings-appearance", "aria-labelledby": "qz-note-appearance", children: [
      /* @__PURE__ */ g("div", { className: "qz-settings-heading", children: [
        /* @__PURE__ */ c("h3", { id: "qz-note-appearance", children: "Notes appearance" }),
        /* @__PURE__ */ c(
          "button",
          {
            className: "qz-button",
            type: "button",
            "data-variant": "quiet",
            disabled: r,
            onClick: () => t({ appearance: wa }),
            children: "Reset defaults"
          }
        )
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-settings-fields", children: [
        /* @__PURE__ */ c(Nt, { label: "Heading text color", value: n.headingColor, checkContrast: !0, onChange: (i) => a({ headingColor: i }) }),
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
          Nt,
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
          className: "qz-note-headings qz-settings-appearance-preview",
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
function Pc(e) {
  const { api: t, workspace: n, preferences: a, onPreferencesChange: r } = e, i = a.folderAppearance[n.id] ?? wc, o = (d) => {
    r({ folderAppearance: { [n.id]: { ...i, ...d } } });
  }, { busy: s, failure: l, run: u } = It(), [p, h] = F(null), [f, m] = F(!1);
  return oe(() => {
    if (!p) return;
    const d = setTimeout(() => h(null), 3e3);
    return () => clearTimeout(d);
  }, [p]), /* @__PURE__ */ g("section", { "aria-label": n.name, className: "qz-panel-surface qz-settings-folder", children: [
    /* @__PURE__ */ g("div", { className: "qz-settings-folder-identity", children: [
      /* @__PURE__ */ c("span", { className: "qz-settings-folder-icon", "aria-hidden": "true", style: { color: He(i.color) }, children: i.emoji || /* @__PURE__ */ c(Q, { name: "folder" }) }),
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
            checked: !!n.companion,
            disabled: s,
            onChange: () => void u(() => Kr(t, n.id, !n.companion)).then((d) => d && e.onChanged())
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
            onChange: (d) => o({ emoji: Mr(d.currentTarget.value) })
          }
        )
      ] }),
      /* @__PURE__ */ c(Nt, { label: "Folder color", value: i.color, onChange: (d) => o({ color: d }) })
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
              onClick: () => void u(() => un(t, { workspaceId: n.id, manual: !0, rebuild: !0 })).then((d) => d && h("Folder rescan requested.")),
              children: "Rescan folder"
            }
          ) })
        ] }),
        /* @__PURE__ */ c(Wc, { workspace: n }),
        !!n.oldTasks && /* @__PURE__ */ c(Hc, { api: t, workspace: n, writeBlocked: e.writeBlocked, onChanged: e.onChanged })
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
            onClick: () => void u(() => Zr(t, n.id, !!n.oldTasks)).then((d) => d && e.onChanged()),
            disabled: s,
            children: n.oldTasks ? `Remove and delete ${n.oldTasks} task(s)` : "Remove"
          }
        ),
        /* @__PURE__ */ c("button", { className: "qz-button", "data-variant": "quiet", type: "button", onClick: () => m(!1), disabled: s, children: "Cancel" })
      ] })
    ] }),
    p && /* @__PURE__ */ c("span", { className: "qz-muted", role: "status", children: p }),
    /* @__PURE__ */ c(fe, { failure: l })
  ] });
}
function Jc({ api: e, workspace: t, onSaved: n }) {
  const [a, r] = F(null), [i, o] = F(""), [s, l] = F(null), [u, p] = F(""), { busy: h, failure: f, run: m } = It(), d = (a == null ? void 0 : a.columns) ?? t.columns, w = s ?? i.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 32), z = d.length < 20 && !!i.trim() && /^[a-z][a-z0-9_]{0,31}$/.test(w) && w !== "repair" && !d.some((b) => b.id === w), k = t.columns.some((b) => !d.some((T) => T.id === b.id)), x = (b) => {
    r({ columns: b, version: (a == null ? void 0 : a.version) ?? t.columnsVersion }), p("");
  }, y = (b, T) => {
    const A = [...d], [L] = A.splice(b, 1);
    A.splice(b + T, 0, L), x(A);
  }, E = () => m(async () => {
    if (!a) return;
    const b = await Hr(e, t.id, d, a.version);
    n(b), r(null), p("Board columns saved.");
  }), v = JSON.stringify(d) !== JSON.stringify(t.columns);
  return /* @__PURE__ */ c(ke, { children: /* @__PURE__ */ g("details", { className: "qz-settings-disclosure", children: [
    /* @__PURE__ */ c("summary", { children: "Board columns" }),
    /* @__PURE__ */ g("div", { className: "qz-stack", children: [
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
              onChange: (A) => x(d.map((L) => L.id === b.id ? { ...L, label: A.target.value } : L))
            }
          )
        ] }),
        /* @__PURE__ */ g("div", { className: "qz-settings-actions", children: [
          /* @__PURE__ */ g("label", { className: "qz-field", children: [
            "Color",
            /* @__PURE__ */ c(
              "input",
              {
                className: "qz-input qz-column-color",
                type: "color",
                "aria-label": `Color for ${b.id}`,
                value: b.color ?? "#6757c7",
                disabled: h,
                onChange: (A) => {
                  const L = A.currentTarget.value;
                  x(d.map((j) => j.id === b.id ? { ...j, color: L } : j));
                }
              }
            )
          ] }),
          /* @__PURE__ */ c(
            "button",
            {
              className: "qz-button",
              type: "button",
              "aria-label": `Reset color for ${b.id}`,
              disabled: h || !b.color,
              onClick: () => x(d.map((A) => A.id === b.id ? { id: A.id, label: A.label } : A)),
              children: "Reset color"
            }
          ),
          /* @__PURE__ */ c("button", { className: "qz-button", type: "button", "aria-label": `Move column ${b.id} up`, disabled: h || T === 0, onClick: () => y(T, -1), children: /* @__PURE__ */ c(Q, { name: "up" }) }),
          /* @__PURE__ */ c("button", { className: "qz-button", type: "button", "aria-label": `Move column ${b.id} down`, disabled: h || T === d.length - 1, onClick: () => y(T, 1), children: /* @__PURE__ */ c(Q, { name: "down" }) }),
          /* @__PURE__ */ c("button", { className: "qz-button", type: "button", "aria-label": `Remove column ${b.id}`, disabled: h || d.length === 1, onClick: () => x(d.filter((A) => A.id !== b.id)), children: "Remove" })
        ] })
      ] }, b.id)) }),
      d.length < 20 && /* @__PURE__ */ g("form", { className: "qz-column-row", onSubmit: (b) => {
        b.preventDefault(), !(h || !z) && (x([...d, { id: w, label: i.trim() }]), o(""), l(null));
      }, children: [
        /* @__PURE__ */ g("label", { className: "qz-field", children: [
          "New column name",
          /* @__PURE__ */ c("input", { className: "qz-input", value: i, maxLength: 40, disabled: h, onChange: (b) => o(b.target.value) })
        ] }),
        /* @__PURE__ */ g("div", { className: "qz-stack", children: [
          /* @__PURE__ */ g("label", { className: "qz-field", children: [
            "New status ID",
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
          /* @__PURE__ */ c("p", { className: "qz-muted", id: `qz-column-id-${t.id}`, children: "This value is written to Markdown notes. Quartizo suggests it from the name. You can use lowercase letters, digits, and underscores, starting with a letter." })
        ] }),
        /* @__PURE__ */ c("button", { className: "qz-button", type: "submit", disabled: h || !z, children: "Add column" })
      ] }),
      k && /* @__PURE__ */ c("p", { className: "qz-notice", children: "Tickets in removed columns move to Needs repair. Move those tickets to an active column or restore the old status ID." }),
      /* @__PURE__ */ g("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ c("button", { className: "qz-button", "data-variant": "primary", type: "button", disabled: h || !v || d.some((b) => !b.label.trim()), onClick: () => void E(), children: "Save columns" }),
        v && /* @__PURE__ */ c("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: h, onClick: () => {
          r(null), p("");
        }, children: "Discard changes" }),
        /* @__PURE__ */ c("span", { className: "qz-muted", role: "status", children: u })
      ] }),
      /* @__PURE__ */ c(fe, { failure: f })
    ] })
  ] }) });
}
function Wc({ workspace: e }) {
  const { openChat: t } = Lr(), n = Fc(e.path, e.columns), a = ae(null), [r, i] = F(""), o = async () => {
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
          /* @__PURE__ */ c(Q, { name: "external" }),
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
            /* @__PURE__ */ c(Q, { name: "copy" }),
            "Copy agent prompt"
          ] }),
          /* @__PURE__ */ c("span", { className: "qz-muted", role: "status", children: r })
        ] })
      ] })
    ] }) : /* @__PURE__ */ c("p", { className: "qz-muted", children: "Enable this folder to ask a Bot about its notes and tickets." })
  ] });
}
function Hc({ api: e, workspace: t, writeBlocked: n, onChanged: a }) {
  const [r, i] = F(null), [o, s] = F(null), [l, u] = F(!1), [p, h] = F(!1), { busy: f, failure: m, run: d } = It(), w = async () => {
    const k = await pi(e, t.id), x = URL.createObjectURL(new Blob([JSON.stringify(k, null, 2)], { type: "application/json" })), y = document.createElement("a");
    y.href = x, y.download = `quartizo-old-tasks-${t.id}.json`, y.click(), setTimeout(() => URL.revokeObjectURL(x), 1e3), u(!0);
  }, z = async () => {
    if (!r) return;
    const k = await hi(e, t.id, r.planHash, p);
    s(k), i(null), a();
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
        i(await di(e, t.id)), s(null), h(!1);
      }), children: "Preview migration" })
    ] }),
    l && /* @__PURE__ */ c("span", { className: "qz-muted", role: "status", children: "Export downloaded." }),
    r && /* @__PURE__ */ g(ct, { label: "Confirm old task migration", className: "qz-notice qz-settings-notice", onCancel: () => i(null), children: [
      /* @__PURE__ */ g("strong", { children: [
        "Create ",
        r.tasks.filter((k) => !k.migrated).length,
        " ticket note(s)"
      ] }),
      /* @__PURE__ */ c("p", { children: "Quartizo backs up the database tasks before writing each ticket to a new file." }),
      r.warnings.map((k, x) => /* @__PURE__ */ c("p", { children: k }, x)),
      /* @__PURE__ */ c("ul", { className: "qz-settings-migration-files", children: r.tasks.map((k) => /* @__PURE__ */ g("li", { children: [
        k.title,
        " → ",
        /* @__PURE__ */ c("code", { children: k.path }),
        " (",
        k.status,
        ")",
        k.migrated && " · already migrated",
        k.noteRef && /* @__PURE__ */ g("span", { children: [
          " · linked note: ",
          k.noteRef
        ] }),
        k.slotId && /* @__PURE__ */ g("span", { children: [
          " · session: ",
          k.slotId
        ] })
      ] }, k.uid)) }),
      r.tasks.some((k) => k.changed) && !r.complete && /* @__PURE__ */ g("label", { className: "qz-settings-check", children: [
        /* @__PURE__ */ c("input", { type: "checkbox", checked: p, onChange: (k) => h(k.target.checked), disabled: f }),
        "I reviewed the changed converted notes; keep their latest contents when resuming"
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ c("button", { className: "qz-button", "data-variant": "primary", type: "button", disabled: f || !!n || r.complete || !r.tasks.length, onClick: () => void d(z), children: r.backup ? "Resume and verify migration" : "Back up and migrate" }),
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
    /* @__PURE__ */ c(fe, { failure: m })
  ] });
}
const Gt = `${Ue}/preferences`, Xt = 5e3, Zc = 3e4;
function _t(e, t) {
  return {
    ...e,
    ...t,
    ...t.noteFolders && { noteFolders: { ...e.noteFolders, ...t.noteFolders } },
    ...t.folderAppearance && { folderAppearance: { ...e.folderAppearance, ...t.folderAppearance } },
    ...t.laneSort && { laneSort: { ...e.laneSort, ...t.laneSort } }
  };
}
function Yt(e, t) {
  const n = Object.entries(t).filter(([a, r]) => (e == null ? void 0 : e[a]) !== r);
  return n.length ? Object.fromEntries(n) : void 0;
}
function ma(e, t) {
  const { noteFolders: n, folderAppearance: a, laneSort: r, ...i } = t, o = Object.fromEntries(Object.entries(i).filter(([p, h]) => e[p] !== h)), s = n && Yt(e.noteFolders, n), l = a && Yt(e.folderAppearance, a), u = r && Yt(e.laneSort, r);
  return s && (o.noteFolders = s), l && (o.folderAppearance = l), u && (o.laneSort = u), o;
}
function Kc(e) {
  const [t, n] = F(Rc), a = ae(t), r = ae(), [i, o] = F("loading"), [s, l] = F(!1), u = Qe((h) => (a.current = h, n(h), ha(h)), []), p = Qe((h) => {
    var d;
    const f = a.current, m = ma(f.values, h);
    Object.keys(m).length && (u({ ...f, values: _t(f.values, m), pending: _t(f.pending, m) }), (d = r.current) == null || d.call(r));
  }, [u]);
  return oe(() => {
    let h = !1, f = !1, m = !1, d;
    const w = () => ({ signal: AbortSignal.timeout(Xt) }), z = async () => {
      if (!(h || f)) {
        clearTimeout(d), f = !0;
        try {
          if (!m) {
            const { legacy: k } = a.current, x = await ze(Object.keys(k).length ? e.patch(Gt, { changes: k, onlyIfMissing: !0 }, w()) : e.get(Gt, w()), Xt);
            if (h) return;
            const { pending: y } = a.current;
            u({ values: _t(At(x.preferences), y), pending: y, legacy: {} }), m = !0;
          }
          for (; Object.keys(a.current.pending).length; ) {
            o("saving");
            const k = a.current.pending, x = await ze(e.patch(Gt, { changes: k }, w()), Xt);
            if (h) return;
            const y = ma(k, a.current.pending);
            u({ values: _t(At(x.preferences), y), pending: y, legacy: {} });
          }
          o("saved");
        } catch {
          if (h) return;
          o(ha(a.current) ? "local" : "unavailable"), d = setTimeout(() => void z(), Zc);
        } finally {
          f = !1, h || l(!0);
        }
      }
    };
    return r.current = () => void z(), z(), () => {
      h = !0, clearTimeout(d), r.current = void 0;
    };
  }, [e, u]), { preferences: t.values, status: i, ready: s, update: p };
}
const Gc = '.qz-app{--qz-canvas: var(--bg, Canvas);--qz-surface: var(--card, Canvas);--qz-elevated: var(--bg-elevated, Canvas);--qz-border: var(--border, color-mix(in srgb, CanvasText 18%, Canvas));--qz-text: var(--text-strong, CanvasText);--qz-muted: color-mix(in srgb, var(--muted, CanvasText) 87%, var(--qz-text));--qz-accent: var(--qz-accent-override, var(--accent, LinkText));--qz-accent-soft: var(--accent-subtle, color-mix(in srgb, var(--qz-accent) 13%, transparent));--qz-ok: var(--ok, #4e9a6b);--qz-warning: var(--warn, #ad7628);--qz-danger: var(--danger, #c7465d);--qz-info: var(--info, var(--qz-accent));container:qz-app / inline-size;width:100%;max-width:1560px;min-width:0;margin-inline:auto;padding:24px clamp(16px,3%,40px) 36px;color:var(--qz-text)}.qz-app,.qz-app *{box-sizing:border-box}.qz-app [hidden]{display:none!important}.qz-app[data-contrast=high]{--qz-border: var(--qz-text);--qz-muted: var(--qz-text)}.qz-app[data-accent=custom]{--qz-accent-soft: color-mix(in srgb, var(--qz-accent) 13%, transparent)}.qz-app[data-motion=reduced] :where(*,*:before,*:after){animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}@media (prefers-reduced-motion: reduce){.qz-app :where(*,*:before,*:after){animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}.qz-app :where(h1,h2,h3,p,ul){margin:0}.qz-app :where(button,input,textarea,select){font:inherit}.qz-app :is(button,summary,input,textarea,select,.qz-board):focus-visible{outline:2px solid var(--qz-accent);outline-offset:2px}.qz-app :is(button,input,textarea,select):disabled{opacity:.55;cursor:default}.qz-app input[type=checkbox]{accent-color:var(--qz-accent)}.qz-icon{width:1rem;height:1rem;flex:none}.qz-header,.qz-brand,.qz-tabs,.qz-view-heading,.qz-toolbar,.qz-actions,.qz-inline-field{display:flex;align-items:center;min-width:0}.qz-header,.qz-view-heading,.qz-toolbar{justify-content:space-between;flex-wrap:wrap;gap:12px 20px}.qz-header{padding:0 0 12px;border-bottom:1px solid var(--qz-border)}.qz-brand{gap:9px}.qz-mark{display:grid;place-items:center;flex:none;width:36px;height:36px;border:1px solid color-mix(in srgb,var(--qz-accent) 34%,var(--qz-border));border-radius:13px;background:linear-gradient(145deg,var(--qz-accent-soft),var(--qz-surface));color:var(--qz-accent)}.qz-mark .qz-icon{width:21px;height:21px}.qz-brand h1{font-size:21px;font-weight:700;letter-spacing:-.035em;line-height:1.1}.qz-workspace{flex:0 1 auto;max-width:100%}.qz-workspace .qz-input{max-width:min(240px,65vw)}.qz-folder-dot{width:12px;height:12px;flex:none;border:1px solid var(--qz-border);border-radius:50%}.qz-return{justify-self:start;margin-block-end:6px}.qz-preference-notice{margin-block-end:12px}.qz-tabs{max-width:100%;gap:3px;padding:4px;border:1px solid var(--qz-border);border-radius:12px;background:var(--qz-surface)}.qz-tabs button{display:flex;align-items:center;justify-content:center;gap:7px;min-height:36px;padding:6px 12px;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--qz-muted);font-size:13px;font-weight:600;cursor:pointer}.qz-tabs button:hover{color:var(--qz-text);background:var(--qz-elevated)}.qz-tabs button[aria-selected=true]{border-color:color-mix(in srgb,var(--qz-accent) 25%,var(--qz-border));background:var(--qz-accent-soft);color:var(--qz-text)}.qz-tabs button[aria-selected=true] .qz-icon{color:var(--qz-accent)}.qz-content{padding-top:24px}.qz-stack{display:grid;gap:14px;min-width:0}.qz-section-title{font-size:27px;font-weight:700;letter-spacing:-.032em;line-height:1.17}.qz-section-description{margin-top:5px;color:var(--qz-muted)}.qz-muted{color:var(--qz-muted);font-weight:400}.qz-mono{font:400 12px/1.5 var(--mono, ui-monospace, monospace)}.qz-path{display:block;min-width:0;overflow:hidden;color:var(--qz-muted);text-overflow:ellipsis;white-space:nowrap}.qz-note-headings :is(h1,h2,h3,h4,h5,h6){color:var(--qz-note-heading-color, var(--qz-preview-text, var(--qz-text)));line-height:1.25;font-weight:600}.qz-note-headings h1{font-size:1.802em;font-weight:700}.qz-note-headings h2{font-size:1.602em}.qz-note-headings h3{font-size:1.422em}.qz-note-headings h4{font-size:1.278em}.qz-note-headings h5{font-size:1.121em}.qz-note-headings h6{font-size:1em}.qz-app[data-note-heading-lines=theme] .qz-note-headings :is(h1,h2),.qz-app[data-note-heading-lines=all] .qz-note-headings :is(h1,h2,h3,h4,h5,h6){padding-block-end:.25em;border-block-end:1px solid var(--qz-note-line-color, var(--mdnb-heading-rule-soft, var(--qz-border)))}.qz-app[data-note-heading-lines=theme] .qz-note-headings :is(h3,h4,h5,h6){padding-inline-start:8px;margin-inline-start:-10px;border-inline-start:2px solid var(--qz-note-line-color, var(--mdnb-heading-rail, var(--qz-border)))}.qz-actions{gap:6px;flex-wrap:wrap}.qz-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;max-width:100%;min-height:36px;padding:5px 11px;border:1px solid var(--qz-border);border-radius:8px;background:var(--qz-surface);color:var(--qz-text);font-size:13px;font-weight:600;text-align:center;cursor:pointer}.qz-button:not(:disabled):hover{background:var(--qz-elevated);border-color:var(--border-strong, var(--qz-muted))}.qz-button[data-variant=primary]{border-color:var(--qz-accent);background:var(--qz-accent);color:var(--accent-fg, var(--qz-canvas))}.qz-button[data-variant=primary]:not(:disabled):hover{border-color:var(--accent-hover, var(--qz-accent));background:var(--accent-hover, var(--qz-accent))}.qz-app[data-accent=custom] .qz-button[data-variant=primary]{color:var(--qz-accent-foreground, var(--qz-canvas))}.qz-app[data-accent=custom] .qz-button[data-variant=primary]:not(:disabled):hover{border-color:var(--qz-accent);background:color-mix(in srgb,var(--qz-accent) 90%,var(--qz-canvas))}.qz-button[data-variant=quiet]{border-color:transparent;background:transparent;color:var(--qz-muted)}.qz-button[data-variant=quiet]:not(:disabled):hover{color:var(--qz-text)}.qz-icon-button{min-width:36px;padding-inline:8px}.qz-input{min-width:0;max-width:100%;min-height:36px;padding:6px 9px;border:1px solid var(--qz-border);border-radius:8px;background:var(--qz-elevated);color:var(--qz-text);font-size:13px}.qz-input::placeholder{color:var(--qz-muted);opacity:1}.qz-field{display:grid;gap:5px;min-width:0;font-size:13px;font-weight:600}.qz-field .qz-input{width:100%;font-weight:400}.qz-inline-field{gap:8px;color:var(--qz-muted);font-size:13px}.qz-inline-field .qz-input{max-width:min(36ch,52%);font-weight:600}.qz-check-label{display:flex;align-items:center;gap:8px}.qz-panel-surface{min-width:0;border:1px solid var(--qz-border);border-radius:12px;background:var(--qz-surface)}.qz-notice{padding:11px 13px;border:1px solid color-mix(in srgb,var(--qz-warning) 42%,var(--qz-border));border-radius:9px;background:color-mix(in srgb,var(--qz-warning) 7%,var(--qz-surface));font-size:13px;overflow-wrap:anywhere}.qz-notice[data-variant=neutral]{border-color:var(--qz-border);background:var(--qz-surface)}.qz-notice.qz-error{border-color:color-mix(in srgb,var(--qz-danger) 53%,var(--qz-border));background:color-mix(in srgb,var(--qz-danger) 9%,var(--qz-surface))}.qz-empty{display:grid;place-items:center;gap:8px;padding:28px 16px;border:1px dashed var(--qz-border);border-radius:12px;color:var(--qz-muted);text-align:center}.qz-empty :is(h2,h3){color:var(--qz-text);font-size:17px;font-weight:650}.qz-empty .qz-button{margin-top:4px}.qz-empty-icon,.qz-note-icon{display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:9px;background:var(--qz-accent-soft);color:var(--qz-accent)}.qz-visually-hidden{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.qz-board-meta{gap:2px 12px;padding-block:2px}.qz-board-meta>.qz-actions{margin-inline-start:auto}.qz-result-count{color:var(--qz-muted);font-size:12px;font-weight:600}.qz-index{display:inline-flex;align-items:baseline;gap:7px;color:var(--qz-muted);font-size:12px}.qz-index:empty{display:none}.qz-board{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(172px,1fr);gap:10px;min-width:0;padding:2px 2px 10px;overflow-x:auto;overscroll-behavior-inline:contain}.qz-lane{--qz-status: var(--qz-muted);min-width:0;min-height:308px;padding:9px;border:1px solid color-mix(in srgb,var(--qz-status) 20%,var(--qz-border));border-radius:12px;background:linear-gradient(180deg,color-mix(in srgb,var(--qz-status) 7%,var(--qz-surface)),var(--qz-surface) 105px)}.qz-app [data-lane-status=ready]{--qz-status: var(--qz-info)}.qz-app [data-lane-status=in_progress]{--qz-status: var(--qz-accent)}.qz-app [data-lane-status=review]{--qz-status: var(--qz-warning)}.qz-app [data-lane-status=done]{--qz-status: var(--qz-ok)}.qz-app [data-lane-status=repair]{--qz-status: var(--qz-danger)}.qz-lane-heading{display:flex;align-items:center;gap:7px;padding:3px 2px 10px;font-size:13px;font-weight:650;overflow-wrap:anywhere}.qz-dot{width:8px;height:8px;flex:none;border-radius:50%;background:var(--qz-status, var(--qz-ok))}.qz-dot[data-attention=true]{background:var(--qz-warning)}.qz-count{margin-inline-start:auto;padding:1px 6px;border:1px solid var(--qz-border);border-radius:999px;color:var(--qz-muted);font-size:11px;font-variant-numeric:tabular-nums}.qz-lane-empty{padding:11px;border:1px dashed var(--qz-border);border-radius:8px;color:var(--qz-muted);font-size:12px;text-align:center}.qz-cards,.qz-todo-list{list-style:none;padding:0}.qz-cards{display:grid;gap:8px}.qz-cards li{min-width:0}.qz-cards li[draggable=true]{cursor:grab}.qz-cards li[draggable=true]:active{cursor:grabbing}.qz-ticket{border:1px solid var(--qz-border);border-radius:9px;background:var(--qz-elevated);box-shadow:var(--shadow-sm, none)}.qz-ticket:hover,.qz-ticket:focus-within{border-color:var(--border-strong, var(--qz-muted))}.qz-ticket-content{display:grid;gap:5px;padding:10px 10px 8px}.qz-note-link{display:flex;align-items:start;justify-content:space-between;gap:6px;padding:0;border:0;background:transparent;color:var(--qz-text);font-size:14px;font-weight:650;line-height:1.4;text-align:start;overflow-wrap:anywhere;cursor:pointer}.qz-note-link .qz-icon{width:13px;height:13px;margin-top:3px;color:var(--qz-muted)}.qz-note-link:hover{text-decoration:underline}.qz-ticket-progress{display:flex;align-items:center;gap:8px;margin-top:3px;color:var(--qz-muted);font-size:11px;font-variant-numeric:tabular-nums}.qz-ticket-progress progress{width:min(54px,40%);height:5px;accent-color:var(--qz-ok);border:0;border-radius:6px;overflow:hidden}.qz-ticket-progress progress::-webkit-progress-bar{background:var(--qz-border)}.qz-ticket-progress progress::-webkit-progress-value{border-radius:6px;background:var(--qz-ok)}.qz-badge{padding:2px 5px;border-radius:5px;background:color-mix(in srgb,var(--qz-warning) 17%,var(--qz-surface));font-size:11px;overflow-wrap:anywhere}.qz-ticket-footer{position:relative;padding:5px;border-top:1px solid var(--qz-border)}.qz-ticket-status{padding-inline-end:39px}.qz-ticket-status .qz-input{width:100%;min-height:32px;padding:3px 4px;border-color:transparent;background:transparent;color:var(--qz-muted)}.qz-ticket-status .qz-input:not(:disabled):hover{background:var(--qz-surface);border-color:var(--qz-border)}.qz-ticket-actions summary{position:absolute;inset-block-start:5px;inset-inline-end:5px;min-height:32px;list-style:none}.qz-ticket-actions summary::-webkit-details-marker{display:none}.qz-ticket-action-list{display:grid;gap:1px;margin-top:5px;padding-top:5px;border-top:1px solid var(--qz-border)}.qz-ticket-action-list .qz-button{justify-content:start;min-height:32px;text-align:start}.qz-ticket-action-list .qz-destructive:not(:disabled),.qz-notice .qz-destructive:not(:disabled){color:var(--qz-danger)}.qz-app [role=alertdialog]:focus-visible{outline:2px solid var(--qz-accent);outline-offset:2px}.qz-lane[data-drop-target]{border-color:var(--qz-accent);box-shadow:0 0 0 2px var(--qz-accent-soft),inset 0 0 0 1px var(--qz-accent)}.qz-cards li[data-drop-before]{box-shadow:0 -3px 0 -1px var(--qz-accent)}.qz-cards li[data-drop-before]{position:relative}.qz-cards li[data-drop-before]:before{content:"";position:absolute;inset-inline:0;inset-block-start:-6px;height:3px;border-radius:2px;background:var(--qz-accent)}.qz-ticket-form{display:grid;gap:12px;max-width:630px;padding:16px}.qz-ticket-form h3{font-size:17px;font-weight:650}.qz-note-preview{max-height:180px;margin:0;padding:10px;overflow:auto;background:var(--qz-canvas);white-space:pre-wrap;overflow-wrap:anywhere}.qz-todos{width:100%;max-width:1100px;margin-inline:auto}.qz-todo-filters{display:flex;flex-wrap:wrap;gap:12px;padding:12px}.qz-todo-filters .qz-field{flex:1 1 135px}.qz-todo-filters .qz-field:first-child{flex:3 1 245px}.qz-search{position:relative;display:block}.qz-search .qz-icon{position:absolute;inset-block-start:10px;inset-inline-start:9px;color:var(--qz-muted);pointer-events:none}.qz-search .qz-input{padding-inline-start:32px}.qz-todo-header{display:flex;align-items:center;gap:10px;min-width:0;padding:12px 14px}.qz-todo-identity{flex:1;min-width:0}.qz-todo-identity h3{display:flex;align-items:center;flex-wrap:wrap;gap:5px 9px;font-size:15px;font-weight:650;overflow-wrap:anywhere}.qz-todo-meta{display:flex;align-items:baseline;gap:6px;color:var(--qz-muted);font-size:12px}.qz-todo-meta>span:first-child{min-width:0;overflow-wrap:anywhere}.qz-status-pill{--qz-status: var(--qz-muted);display:inline-flex;align-items:center;gap:5px;padding:1px 7px;border-radius:999px;background:color-mix(in srgb,var(--qz-status) 13%,var(--qz-surface));font-size:11px;font-weight:500}.qz-status-pill .qz-dot{width:6px;height:6px}.qz-todo-row{display:flex;align-items:center;border-top:1px solid var(--qz-border)}.qz-todo-row:hover,.qz-todo-row:focus-within{background:var(--qz-elevated)}.qz-todo-row:last-child{border-radius:0 0 12px 12px}.qz-todo-check{display:flex;align-items:baseline;gap:10px;flex:1;min-width:0;padding:10px 14px;overflow-wrap:anywhere;cursor:pointer}.qz-todo-check input{flex:none;align-self:start;width:16px;height:16px;margin:2px 0 0}.qz-todo-check:has(input:disabled){cursor:default}.qz-todo-row[data-checked=true] .qz-todo-check span{color:var(--qz-muted);text-decoration:line-through}.qz-todo-row>.qz-button{margin-inline-end:6px}@container qz-app (max-width: 650px){.qz-board{grid-auto-columns:clamp(170px,65cqi,244px)}}@container qz-app (max-width: 520px){.qz-header{gap:14px;padding-bottom:14px}.qz-tabs{width:100%;order:1}.qz-tabs button{flex:1;gap:5px;padding-inline:5px}.qz-content{padding-top:18px}.qz-section-title{font-size:24px}.qz-inline-field{width:100%}.qz-inline-field .qz-input{flex:1;max-width:none}.qz-board-meta>.qz-actions{margin-inline-start:0}.qz-todo-filters .qz-field:first-child{flex-basis:100%}.qz-todo-header{padding-inline:10px}.qz-todo-header .qz-note-icon{display:none}}@media (pointer: coarse){.qz-app :is(.qz-button,.qz-tabs button,.qz-input,.qz-ticket-status .qz-input,.qz-ticket-actions summary){min-height:42px}}@container qz-app (max-width: 360px){.qz-tabs .qz-icon{display:none}.qz-workspace .qz-input{max-width:min(140px,40vw)}}.qz-app[data-interface-text=large] :is(.qz-tabs button,.qz-button,.qz-input,.qz-field,.qz-inline-field,.qz-result-count,.qz-index,.qz-lane-heading,.qz-count,.qz-lane-empty,.qz-badge,.qz-ticket-progress,.qz-ticket-badges .qz-folder-label,.qz-todo-meta,.qz-status-pill,.qz-settings-check,.qz-settings-disclosure,.qz-settings-saved){font-size:15px}', Xc = '.qz-start-checklist{margin:0;padding-inline-start:1.5em;text-align:start}.qz-board-view-panel{padding:14px}.qz-board-view-settings{display:flex;flex-wrap:wrap;align-items:start;gap:16px 24px;font-size:13px}.qz-board-view-settings>.qz-check-label{align-self:center}.qz-board-setting-group{display:grid;gap:8px;min-inline-size:0;margin:0;padding:0;border:0}.qz-board-setting-group legend{margin-bottom:6px;padding:0;font-weight:600}.qz-board-order-group{flex-basis:100%}.qz-board-order-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,145px),1fr));gap:8px 12px}.qz-board[data-density=compact]{gap:6px}.qz-board[data-density=compact] .qz-lane{padding:6px}.qz-board[data-density=compact] .qz-lane-heading{padding-block-end:6px}.qz-board[data-density=compact] .qz-cards{gap:4px}.qz-board[data-density=compact] .qz-ticket-content{gap:2px;padding:6px}.qz-board[data-density=compact] .qz-ticket-footer{padding-block:2px}.qz-board[data-density=compact] .qz-ticket-actions summary{inset-block-start:2px}.qz-lane-help{margin:0 2px 8px;font-size:12px}.qz-folder-label{display:inline-flex;align-items:center;gap:4px;overflow-wrap:anywhere}.qz-folder-label-dot{flex:none;width:.55em;height:.55em;border-radius:50%;background:var(--qz-folder-label-color)}.qz-ticket-badges{flex-wrap:wrap}.qz-ticket-badges .qz-folder-label{padding:2px 5px;border:1px solid var(--qz-border);border-radius:5px;font-size:11px}.qz-todo-saved-filters{flex-basis:100%}.qz-todo-saved-filters summary{display:inline-flex;width:fit-content;list-style:none}.qz-todo-saved-filters summary::-webkit-details-marker{display:none}.qz-todo-saved-filters summary:after{content:"▾";color:var(--qz-muted)}.qz-todo-saved-filters[open] summary:after{content:"▴"}.qz-todo-saved-controls{display:grid;gap:8px;padding-block-start:10px}.qz-todo-saved-row{display:flex;flex-wrap:wrap;align-items:end;gap:8px}.qz-todo-filters .qz-todo-saved-row .qz-field{flex:0 1 240px}.qz-todo-saved-row>p{flex-basis:100%;font-size:13px}', Pe = [
  { id: "tasks", label: "Tasks", icon: "board" },
  { id: "todos", label: "TODOs", icon: "checklist" },
  { id: "notes", label: "Notes", icon: "note" },
  { id: "settings", label: "Settings", icon: "settings" }
], ba = { small: "14px", medium: "16px", large: "19px" }, Yc = { compact: 1.45, normal: 1.65, relaxed: 1.9 };
function nu() {
  const e = $r(), { preferences: t, status: n, ready: a, update: r } = Kc(e), [i, o] = F(null), [s, l] = F(null), [u, p] = F(null), [h, f] = F(null), [m, d] = F(null), [w, z] = F(0), k = ae(null);
  oe(() => {
    let q = !1, $ = !1, U;
    const K = async () => {
      if (!(q || $)) {
        $ = !0, clearTimeout(U);
        try {
          const S = await ze(xa(e));
          q || d(S);
        } catch {
          q || (U = setTimeout(() => void K(), 3e3));
        } finally {
          $ = !1;
        }
      }
    };
    return K(), window.addEventListener("focus", K), () => {
      q = !0, clearTimeout(U), window.removeEventListener("focus", K);
    };
  }, [e, w]);
  const x = i ?? (t.startOn === "last" ? t.lastTab : t.startOn), y = (m == null ? void 0 : m.filter((q) => q.companion)) ?? [], E = y.find((q) => q.id === t.workspaceId) ?? y[0], v = x === "notes" && u ? y.find((q) => q.id === u.workspaceId) ?? E : E, b = v ? t.folderAppearance[v.id] : void 0, T = (v == null ? void 0 : v.id) ?? null, A = t.appearance, L = {
    "--qz-accent-override": He(t.accent),
    "--qz-accent-foreground": mi(t.accent),
    "--qz-note-heading-color": He(A.headingColor),
    "--qz-note-line-color": He(A.lineColor),
    "--qz-note-text-size": ba[t.noteTextSize],
    "--qz-note-raw-size": ba[t.rawTextSize],
    "--qz-note-line-height": Yc[t.noteLineHeight],
    "--qz-note-font": t.noteFont === "mono" ? "var(--mono, ui-monospace, monospace)" : void 0
  }, j = (q) => {
    o(q), q !== "notes" && (p(null), f(null)), r({ lastTab: q });
  }, H = (q) => {
    var $, U;
    return (U = ($ = k.current) == null ? void 0 : $.querySelector(`#qz-tab-${q}`)) == null ? void 0 : U.focus();
  }, M = (q) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(q.key)) return;
    q.preventDefault();
    const $ = Pe.findIndex((K) => K.id === x), U = q.key === "Home" ? Pe[0] : q.key === "End" ? Pe[Pe.length - 1] : Pe[($ + (q.key === "ArrowRight" ? 1 : Pe.length - 1)) % Pe.length];
    j(U.id), H(U.id);
  }, Z = (q) => {
    l(q), j("settings"), H("settings");
  }, Y = (q) => {
    (x === "tasks" || x === "todos") && f({ tab: x, workspaceId: t.workspaceId }), p(q), j("notes"), H("notes");
  }, re = () => {
    h && (r({ workspaceId: h.workspaceId }), j(h.tab), H(h.tab));
  }, C = (q) => {
    p(null), r({ workspaceId: q });
  }, I = () => Z("folders");
  return /* @__PURE__ */ g(
    "div",
    {
      className: "qz-app",
      "data-note-heading-lines": A.headingLines,
      style: L,
      "data-contrast": t.highContrast ? "high" : void 0,
      "data-motion": t.motion,
      "data-interface-text": t.largerInterfaceText ? "large" : void 0,
      "data-accent": t.accent !== "theme" ? "custom" : void 0,
      children: [
        /* @__PURE__ */ c("style", { children: Gc }),
        /* @__PURE__ */ c("style", { children: Xc }),
        /* @__PURE__ */ g("header", { className: "qz-header", children: [
          /* @__PURE__ */ g("div", { className: "qz-brand", children: [
            /* @__PURE__ */ c("span", { className: "qz-mark", children: /* @__PURE__ */ c(Q, { name: "gem" }) }),
            /* @__PURE__ */ c("h1", { children: "Quartizo" })
          ] }),
          /* @__PURE__ */ c("div", { className: "qz-tabs", ref: k, role: "tablist", "aria-label": "Quartizo", onKeyDown: M, children: Pe.map((q) => /* @__PURE__ */ g(
            "button",
            {
              id: `qz-tab-${q.id}`,
              type: "button",
              role: "tab",
              "aria-selected": x === q.id,
              "aria-controls": "qz-panel",
              tabIndex: x === q.id ? 0 : -1,
              onClick: () => j(q.id),
              children: [
                /* @__PURE__ */ c(Q, { name: q.icon }),
                q.label
              ]
            },
            q.id
          )) }),
          /* @__PURE__ */ g("label", { className: "qz-workspace qz-inline-field", children: [
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
                onChange: (q) => C(Number(q.currentTarget.value)),
                children: [
                  !v && /* @__PURE__ */ c("option", { value: "", children: m === null ? "Loading folders…" : "No folders connected" }),
                  y.map((q) => {
                    var U;
                    const $ = (U = t.folderAppearance[q.id]) == null ? void 0 : U.emoji;
                    return /* @__PURE__ */ c("option", { value: q.id, children: $ ? `${$} ${q.name}` : q.name }, q.id);
                  })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ g("div", { className: "qz-content", id: "qz-panel", role: "tabpanel", "aria-labelledby": `qz-tab-${x}`, children: [
          n === "unavailable" && /* @__PURE__ */ c("p", { className: "qz-notice qz-preference-notice", role: "status", children: "Quartizo can’t save preferences. Changes are kept until you close or reload this page." }),
          /* @__PURE__ */ g(ke, { children: [
            /* @__PURE__ */ c("div", { hidden: x !== "tasks", children: /* @__PURE__ */ c(
              zi,
              {
                api: e,
                active: x === "tasks",
                workspaceId: (E == null ? void 0 : E.id) ?? null,
                preferences: t,
                onPreferencesChange: r,
                onSettings: I,
                onBoardSettings: () => Z("board"),
                onOpenNote: Y
              }
            ) }),
            /* @__PURE__ */ c("div", { hidden: x !== "todos", children: /* @__PURE__ */ c(
              Ai,
              {
                api: e,
                active: x === "todos",
                workspaceId: (E == null ? void 0 : E.id) ?? null,
                preferences: t,
                onPreferencesChange: r,
                onSettings: I,
                onOpenNote: Y
              }
            ) }),
            /* @__PURE__ */ g("div", { className: "qz-notes-tab", hidden: x !== "notes", children: [
              h && /* @__PURE__ */ g("button", { className: "qz-button qz-return", type: "button", "data-variant": "quiet", onClick: re, children: [
                /* @__PURE__ */ c(Q, { name: "back" }),
                h.tab === "tasks" ? "Back to board" : "Back to TODOs"
              ] }),
              /* @__PURE__ */ c(
                Sc,
                {
                  api: e,
                  active: x === "notes",
                  workspaceId: T,
                  request: u,
                  preferences: t,
                  onPreferencesChange: r,
                  onSettings: I
                }
              )
            ] }),
            x === "settings" && /* @__PURE__ */ c(
              $c,
              {
                api: e,
                preferences: t,
                onPreferencesChange: r,
                status: n,
                section: s,
                onSectionChange: l,
                workspaceId: T,
                onWorkspaceChange: C,
                onWorkspacesChanged: () => z((q) => q + 1)
              }
            )
          ] })
        ] })
      ]
    }
  );
}
export {
  nu as default
};
