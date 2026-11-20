import { jsx as l, jsxs as g, Fragment as ve } from "react/jsx-runtime";
import { useChatLauncher as Zr, useNavigate as ya, useAppApi as Kr } from "@kirocrew/app-sdk";
import { useRef as re, useEffect as oe, useState as S, useMemo as Oe, useCallback as Ye, useDeferredValue as Gr, useLayoutEffect as Ea, useId as Xr } from "react";
import { SegmentedControl as Yr } from "@kirocrew/app-sdk/ui";
function Vr(e, t) {
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
function Qr(e, t) {
  const n = t.map((a) => `${a.id} (${JSON.stringify(a.label)})`).join(", ");
  return `Folder: ${e}
Board columns, in order: ${n}

My request: `;
}
const ei = {
  gem: /* @__PURE__ */ l("path", { d: "M8 4h8l4.5 5L12 21 3.5 9 8 4Zm-4.5 5h17M8 4l1 5 3 12 3-12 1-5" }),
  board: /* @__PURE__ */ g(ve, { children: [
    /* @__PURE__ */ l("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }),
    /* @__PURE__ */ l("path", { d: "M9 4v16m6-16v16M6 8h.1M12 8h.1m6 0h.1" })
  ] }),
  checklist: /* @__PURE__ */ l("path", { d: "m3 6 2 2 3-4m3 3h10M3 13l2 2 3-4m3 3h10M3 20h5m3 0h10" }),
  settings: /* @__PURE__ */ g(ve, { children: [
    /* @__PURE__ */ l("path", { d: "M4 6h7m4 0h5M4 12h3m4 0h9M4 18h11m4 0h1" }),
    /* @__PURE__ */ l("circle", { cx: "13", cy: "6", r: "2" }),
    /* @__PURE__ */ l("circle", { cx: "9", cy: "12", r: "2" }),
    /* @__PURE__ */ l("circle", { cx: "17", cy: "18", r: "2" })
  ] }),
  plus: /* @__PURE__ */ l("path", { d: "M12 5v14M5 12h14" }),
  note: /* @__PURE__ */ l("path", { d: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M8 13h8m-8 4h6" }),
  external: /* @__PURE__ */ l("path", { d: "M13 5h6v6m0-6-9 9m8-1v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" }),
  refresh: /* @__PURE__ */ l("path", { d: "M20 11a8 8 0 1 0-2.2 6.6M20 4v7h-7" }),
  folder: /* @__PURE__ */ l("path", { d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" }),
  more: /* @__PURE__ */ g(ve, { children: [
    /* @__PURE__ */ l("circle", { cx: "5", cy: "12", r: "1" }),
    /* @__PURE__ */ l("circle", { cx: "12", cy: "12", r: "1" }),
    /* @__PURE__ */ l("circle", { cx: "19", cy: "12", r: "1" })
  ] }),
  copy: /* @__PURE__ */ g(ve, { children: [
    /* @__PURE__ */ l("rect", { x: "8", y: "8", width: "12", height: "12", rx: "2" }),
    /* @__PURE__ */ l("path", { d: "M16 4H6a2 2 0 0 0-2 2v10" })
  ] }),
  search: /* @__PURE__ */ g(ve, { children: [
    /* @__PURE__ */ l("circle", { cx: "10.5", cy: "10.5", r: "5.5" }),
    /* @__PURE__ */ l("path", { d: "m15 15 5 5" })
  ] }),
  up: /* @__PURE__ */ l("path", { d: "m6 14 6-6 6 6" }),
  down: /* @__PURE__ */ l("path", { d: "m6 10 6 6 6-6" }),
  check: /* @__PURE__ */ l("path", { d: "m5 12 4 4L19 6" }),
  edit: /* @__PURE__ */ l("path", { d: "m14 6 4 4M4 20l4.7-1 11-11a2.8 2.8 0 0 0-4-4l-11 11L4 20Z" }),
  minus: /* @__PURE__ */ l("path", { d: "M5 12h14" }),
  back: /* @__PURE__ */ l("path", { d: "M19 12H5m6-6-6 6 6 6" }),
  pin: /* @__PURE__ */ l("path", { d: "m16 3 5 5-3 1-3 4v3l-2 2-3-3-5 5m5-5-4-4 2-2h3l4-3 1-3Z" })
};
function te({ name: e }) {
  return /* @__PURE__ */ l(
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
      children: ei[e]
    }
  );
}
function me({ failure: e }) {
  const t = re(null);
  return oe(() => {
    var n, a;
    e && ((a = (n = t.current) == null ? void 0 : n.scrollIntoView) == null || a.call(n, { block: "nearest" }));
  }, [e]), e ? /* @__PURE__ */ l("div", { ref: t, role: "alert", className: "qz-notice qz-error", "data-code": e.code, children: e.message }) : null;
}
function ti({ label: e, icon: t = "more", children: n }) {
  const [a, r] = S(!1), i = re(null);
  return oe(() => {
    if (!a) return;
    const o = (s) => {
      var c;
      s.target instanceof Node && ((c = i.current) != null && c.contains(s.target)) || r(!1);
    };
    return document.addEventListener("mousedown", o), () => document.removeEventListener("mousedown", o);
  }, [a]), /* @__PURE__ */ g("div", { ref: i, className: "qz-menu", onKeyDown: (o) => {
    var s, c;
    o.key !== "Escape" || !a || (o.stopPropagation(), r(!1), (c = (s = i.current) == null ? void 0 : s.querySelector(".qz-menu-trigger")) == null || c.focus());
  }, children: [
    /* @__PURE__ */ l(
      "button",
      {
        type: "button",
        className: "qz-button qz-icon-button qz-menu-trigger",
        "data-variant": "quiet",
        "aria-label": e,
        title: e,
        "aria-expanded": a,
        onClick: () => r((o) => !o),
        children: /* @__PURE__ */ l(te, { name: t })
      }
    ),
    a && /* @__PURE__ */ l("div", { className: "qz-menu-list qz-panel-surface", role: "group", "aria-label": e, children: n(() => r(!1)) })
  ] });
}
function Rn(e) {
  return e instanceof Element && !!e.closest('[role="alertdialog"]');
}
function ht({ label: e, onCancel: t, className: n = "qz-notice qz-stack", children: a }) {
  const r = re(null), i = re(t);
  return i.current = t, oe(() => {
    var s;
    const o = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return (s = r.current) == null || s.focus(), () => {
      o != null && o.isConnected && o.focus();
    };
  }, []), /* @__PURE__ */ l(
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
function Ca() {
  const [e, t] = S(() => typeof document > "u" || document.visibilityState !== "hidden");
  return oe(() => {
    const n = () => t(document.visibilityState !== "hidden");
    return document.addEventListener("visibilitychange", n), () => document.removeEventListener("visibilitychange", n);
  }, []), e;
}
const ni = "quartizo-notes";
function pn({ workspace: e, variant: t, onOpen: n }) {
  const { openChat: a } = Zr();
  return /* @__PURE__ */ g(
    "button",
    {
      type: "button",
      className: "qz-button",
      "data-variant": t,
      disabled: !e.companion,
      "aria-label": `Ask a Bot or agent about ${e.name}`,
      title: `Opens a KiroCrew chat with the Quartizo notes agent for ${e.name}. Nothing is sent until you press Send.`,
      onClick: () => {
        n == null || n(), a({ agent: ni, message: Qr(e.path, e.columns), autoSend: !1 });
      },
      children: [
        /* @__PURE__ */ l(te, { name: "external" }),
        "Ask a Bot or agent"
      ]
    }
  );
}
const Je = "/apps/quartizo/api", ai = 15e3, Na = { id: "repair", label: "Needs a column" };
function Ce(e) {
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
function _e(e, t = ai) {
  let n;
  const a = new Promise((r, i) => {
    n = setTimeout(() => i(new Error(`request timed out after ${Math.round(t / 1e3)} s`)), t);
  });
  return Promise.race([e, a]).finally(() => clearTimeout(n));
}
function fn(e) {
  const t = Object.entries(e).filter((n) => n[1] !== void 0 && n[1] !== "").map(([n, a]) => `${encodeURIComponent(n)}=${encodeURIComponent(a)}`);
  return t.length ? `?${t.join("&")}` : "";
}
async function Aa(e) {
  return (await e.get(`${Je}/workspaces`)).workspaces;
}
async function ri(e, t, n) {
  return (await e.post(`${Je}/workspaces`, n ? { path: t, name: n, companion: !0 } : { path: t, companion: !0 })).workspace;
}
async function ii(e, t, n, a) {
  return (await e.put(ye(t, "columns"), { columns: n, columnsVersion: a })).workspace;
}
async function si(e, t, n = !1) {
  await e.del(`${Je}/workspaces/${t}${n ? "?deleteOldTasks=1" : ""}`);
}
const gn = `${Je}/companion`;
function Mt(e) {
  return e.get(gn);
}
function oi(e, t, n) {
  return e.put(`${Je}/workspaces/${t}/companion`, { enabled: n });
}
function mn(e, t = {}) {
  const n = {};
  return t.workspaceId !== void 0 && (n.workspaceId = t.workspaceId), t.rebuild && (n.rebuild = !0), t.manual && (n.manual = !0), e.post(`${gn}/refresh`, n);
}
function li(e, t) {
  return e.get(`${Je}/workspaces/${t}/board`);
}
function ci(e, t, n) {
  return e.get(`${gn}/todos${fn({ workspace: n === void 0 ? void 0 : String(n), state: t })}`);
}
function ui(e, t) {
  const n = [], a = new Map(e.map((r) => [r.id, []]));
  a.set(Na.id, n);
  for (const r of t) (a.get(r.lane) ?? n).push(r);
  return Object.fromEntries(a);
}
function bn(e) {
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
function di(e, t = Date.now()) {
  if (!e) return "";
  if (e.state === "scanning") {
    if (!e.progress) return "Scan queued…";
    const { notes: a, rebuild: r } = e.progress;
    return `Scanning… ${a} ${a === 1 ? "note" : "notes"} read${r ? " (rebuild)" : ""}`;
  }
  if (!e.indexedAt) return "";
  const n = e.files ?? 0;
  return `${n} ${n === 1 ? "note" : "notes"} indexed ${hi(e.indexedAt, t)}`;
}
function hi(e, t) {
  const n = Math.max(0, Math.round((t - e) / 1e3));
  if (n < 5) return "just now";
  if (n < 60) return `${n} s ago`;
  const a = Math.round(n / 60);
  return a < 60 ? `${a} min ago` : new Date(e).toLocaleString();
}
function pi(e, t) {
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
function jt(e) {
  return e.trim() || "(empty)";
}
function ye(e, t) {
  return `${Je}/workspaces/${e}/${t}`;
}
function an(e, t, n) {
  return e.get(ye(t, "source") + fn({ path: n }));
}
function fi(e, t) {
  return e.get(ye(t, "notes"));
}
function gi(e, t, n) {
  return e.get(ye(t, "backlinks") + fn({ path: n }));
}
function mi(e, t, n) {
  return e.post(ye(t, "notes"), { path: n });
}
function bi(e, t, n, a, r) {
  return e.put(ye(t, "source"), { path: n, content: a, expectedHash: r });
}
function vi(e, t, n) {
  return e.post(ye(t, "tickets"), n);
}
function zi(e, t, n, a) {
  return e.post(ye(t, "tickets/promote"), { path: n.path, expectedHash: n.hash, ...a === void 0 ? {} : { status: a } });
}
function ki(e, t, n) {
  return e.post(ye(t, "tickets/move"), n);
}
function xi(e, t, n, a) {
  return e.post(ye(t.workspaceId, "todos/toggle"), {
    path: t.path,
    expectedHash: t.hash,
    markerStart: n.markerStart,
    line: n.line,
    column: n.column,
    checked: a
  });
}
function wi(e, t, n, a = !1) {
  return e.post(ye(t, "tickets/rebalance"), { status: n, confirm: !0, reconcile: a });
}
function $e(e, t) {
  var n, a;
  return e != null && e.writeBlocked ? e.writeBlocked.message : e != null && e.migrationPending ? "Finish the old task migration in Settings before editing this workspace." : !e || e.state !== "ready" || e.complete !== !0 || e.retained || e.outdated || e.error ? "Wait for a complete, current index before editing. Refresh if needed." : t != null && t.status && ((n = e.maintenance) != null && n.includes(t.status)) ? "This column has unfinished order maintenance. Resume maintenance before moving cards." : t && (!t.hash || t.retained || (a = t.diagnostics) != null && a.some((r) => r.code !== "unconfigured_status")) ? "Repair or refresh this note before editing it." : null;
}
function qi(e, t, n, a) {
  if (!t.hash) throw new Error("Refresh this ticket before moving it.");
  const r = e.filter((u) => u.path !== t.path && u.lane === n);
  if (a !== void 0 && (!Number.isInteger(a) || a < 0 || a > r.length))
    throw new Error("The destination card changed. Refresh before moving this ticket.");
  const i = a ?? r.length, o = r[i - 1], s = r[i], c = (u) => {
    if (!u.hash || u.retained || u.diagnostics.length || !u.id || !u.order) throw new Error("Refresh or repair the destination column before moving cards.");
    return { path: u.path, hash: u.hash };
  };
  return {
    path: t.path,
    expectedHash: t.hash,
    status: n,
    ...o ? { before: c(o) } : {},
    ...s ? { after: c(s) } : {}
  };
}
function _i(e, t) {
  return e.get(ye(t, "migration"));
}
function yi(e, t, n, a = !1) {
  return e.post(ye(t, "migration"), { planHash: n, confirm: !0, ...a ? { acceptCurrent: !0 } : {} });
}
function Ei(e, t) {
  return e.get(ye(t, "legacy-tasks"));
}
function Ri(e, t, n) {
  return e.post(ye(t, "tickets/demote"), { path: n.path, expectedHash: n.hash });
}
const Da = "/md-notebook";
function Ci(e) {
  return (e.split("/").pop() ?? e).replace(/\.md$/i, "");
}
const Pt = "#6757c7", Sa = {
  headingColor: "theme",
  headingLines: "theme",
  lineColor: "theme"
};
function Xe(e) {
  return e === "accent" ? "accent" : typeof e == "string" && /^#[\da-f]{6}$/i.test(e) ? e : "theme";
}
function Ta(e) {
  return e === "all" || e === "none" ? e : "theme";
}
function Ke(e) {
  if (e !== "theme")
    return e === "accent" ? "var(--qz-accent)" : e;
}
function Ut(e) {
  const t = e / 255;
  return t <= 0.04045 ? t / 12.92 : ((t + 0.055) / 1.055) ** 2.4;
}
function rn(e, t, n) {
  return 0.2126 * Ut(e) + 0.7152 * Ut(t) + 0.0722 * Ut(n);
}
function Ni(e) {
  if (!e.startsWith("#")) return;
  const t = parseInt(e.slice(1, 3), 16), n = parseInt(e.slice(3, 5), 16), a = parseInt(e.slice(5, 7), 16);
  return rn(t, n, a) >= Math.sqrt(1.05 * 0.05) - 0.05 ? "#000" : "#fff";
}
const Ai = 1500, Di = 3e3;
function Fa(e, t, n) {
  const [a, r] = S(null), [i, o] = S(null);
  return oe(() => {
    if (!t) return;
    let s = !1;
    return Mt(e).then((c) => {
      s || (r(c.workspaces.filter((u) => u.workspace.companion)), o(c.available ? null : { message: c.error ?? "The Markdown index is unavailable." }));
    }).catch((c) => !s && o(Ce(c))), () => {
      s = !0;
    };
  }, [e, t, n]), { companions: a, failure: i };
}
function Ma(e, t, n, a, r, i, o) {
  const s = Ca(), [c, u] = S(null), p = (c == null ? void 0 : c.key) === n ? c.data : null, [d, f] = S(null), [m, h] = S(0), [x, k] = S(!1), v = re(r), q = re(i), w = re(o);
  v.current = r, q.current = i, w.current = o, oe(() => {
    u(null), f(null);
  }, [n]), oe(() => {
    if (!t || !s) return;
    let b = !1, M, y, T;
    const U = async () => {
      let B = !1;
      try {
        const Y = await _e(Mt(e));
        if (b) return;
        if (!Y.available) throw new Error(Y.error ?? "The Markdown index is unavailable.");
        const Z = Y.workspaces.filter(({ workspace: D }) => D.companion), ne = Z.filter(({ workspace: D }) => a === void 0 || D.id === a), P = Object.fromEntries(ne.map(({ workspace: D, index: N }) => [D.id, N]));
        B = ne.some(({ index: D }) => D.state === "scanning");
        const R = JSON.stringify(Z.map(({ workspace: D, index: N }) => [D.id, D.columnsVersion, N.indexedAt])), L = JSON.stringify(P);
        if (y !== R) {
          const D = await _e(v.current());
          if (b) return;
          u({ key: n, data: D }), y = R, T = void 0;
        } else if (T !== L) {
          const D = w.current;
          u((N) => (N == null ? void 0 : N.key) === n ? { key: n, data: D(N.data, P) } : N), T = L;
        }
        f(null), k(!1);
      } catch (Y) {
        b || (f(Ce(Y)), k(!1));
      }
      b || (M = setTimeout(U, B ? Ai : Di));
    };
    return U(), () => {
      b = !0, clearTimeout(M);
    };
  }, [t, e, s, n, m, a]);
  const _ = Ye(async () => {
    k(!0);
    try {
      await _e(q.current()), f(null), h((b) => b + 1);
    } catch (b) {
      f(Ce(b));
    } finally {
      k(!1);
    }
  }, []), E = Ye(() => {
    k(!0), h((b) => b + 1);
  }, []);
  return { data: p, failure: d, busy: x, refresh: _, reload: E };
}
function Ia({ statuses: e }) {
  const t = Date.now(), n = e.map((a) => di(a, t)).filter(Boolean);
  return /* @__PURE__ */ l("span", { className: "qz-index", role: "status", children: n.length > 0 && /* @__PURE__ */ g(ve, { children: [
    /* @__PURE__ */ l("span", { className: "qz-dot", "data-attention": e.some((a) => a.state === "scanning" || !!bn(a)) }),
    n.join(" · ")
  ] }) });
}
function Oa({ statuses: e, names: t, onSettings: n }) {
  const a = new Set(e.map((i, o) => {
    const s = bn(i);
    return s && (t != null && t[o]) ? `${t[o]}: ${s}` : s;
  }).filter(Boolean)), r = e.some((i) => i.state === "stale" || i.state === "error");
  return /* @__PURE__ */ l(ve, { children: [...a].map((i) => /* @__PURE__ */ g("div", { role: "note", className: "qz-notice qz-notice-action", children: [
    /* @__PURE__ */ l("span", { children: i }),
    r && n && /* @__PURE__ */ l("button", { type: "button", className: "qz-button", onClick: n, children: "Check folders in Settings" })
  ] }, i)) });
}
function Si() {
  const [e, t] = S("");
  return oe(() => {
    if (!e) return;
    const n = setTimeout(() => t(""), 4e3);
    return () => clearTimeout(n);
  }, [e]), [e, t];
}
function Ba({ path: e, compact: t = !1 }) {
  const n = Ci(e), [a, r] = S("idle");
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
  return /* @__PURE__ */ g(ve, { children: [
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
          /* @__PURE__ */ l(te, { name: a === "copied" ? "check" : "copy" }),
          (!t || a !== "idle") && (a === "copied" ? "Copied" : a === "failed" ? "Copy failed" : "Copy name")
        ]
      }
    ),
    /* @__PURE__ */ l("span", { className: "qz-visually-hidden", role: "status", children: a === "copied" ? "Note name copied." : a === "failed" ? "Could not copy note name." : "" })
  ] });
}
function La({ onSettings: e }) {
  return /* @__PURE__ */ g("div", { className: "qz-empty", children: [
    /* @__PURE__ */ l("span", { className: "qz-empty-icon", children: /* @__PURE__ */ l(te, { name: "folder" }) }),
    /* @__PURE__ */ l("h2", { children: "Get started with Quartizo" }),
    /* @__PURE__ */ g("ol", { className: "qz-start-checklist", children: [
      /* @__PURE__ */ l("li", { children: "Add a folder of Markdown files in Settings." }),
      /* @__PURE__ */ l("li", { children: "Create a note in Notes." }),
      /* @__PURE__ */ l("li", { children: "Create a ticket or turn your note into one in Tasks." })
    ] }),
    /* @__PURE__ */ l("button", { type: "button", className: "qz-button", "data-variant": "primary", onClick: e, children: "Open Settings" })
  ] });
}
function Ti(e) {
  var i;
  const t = e.active ?? !0, { companions: n, failure: a } = Fa(e.api, t, e.workspaceId), r = (i = n == null ? void 0 : n.find((o) => o.workspace.id === e.workspaceId)) == null ? void 0 : i.workspace;
  return a && !n ? /* @__PURE__ */ l(me, { failure: a }) : n ? /* @__PURE__ */ g("div", { className: "qz-stack", children: [
    /* @__PURE__ */ l(me, { failure: a }),
    /* @__PURE__ */ l("div", { className: "qz-view-heading", children: /* @__PURE__ */ g("div", { children: [
      /* @__PURE__ */ l("h2", { className: "qz-section-title", children: "Tasks" }),
      /* @__PURE__ */ l("p", { className: "qz-section-description", children: "Plan and track tickets stored in your notes." })
    ] }) }),
    n.length === 0 && /* @__PURE__ */ l(La, { onSettings: e.onSettings }),
    n.length > 0 && !r && !a && /* @__PURE__ */ l("p", { className: "qz-muted qz-loading", role: "status", children: "Loading the selected folder…" }),
    n.map(({ workspace: o }) => /* @__PURE__ */ l("div", { hidden: o.id !== (r == null ? void 0 : r.id), children: /* @__PURE__ */ l(
      Oi,
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
  ] }) : /* @__PURE__ */ l("p", { className: "qz-muted qz-loading", role: "status", children: "Loading folders…" });
}
const Fi = [
  ["progress", "Checklist progress"],
  ["path", "Note path"],
  ["badges", "Ticket badges"]
];
function $a({ preferences: e, onPreferencesChange: t, workspace: n }) {
  return /* @__PURE__ */ g("div", { className: "qz-board-view-settings", children: [
    /* @__PURE__ */ g("label", { className: "qz-field", children: [
      "Card density",
      /* @__PURE__ */ g("select", { className: "qz-input", value: e.boardDensity, onChange: (a) => t({ boardDensity: a.target.value === "compact" ? "compact" : "comfortable" }), children: [
        /* @__PURE__ */ l("option", { value: "comfortable", children: "Comfortable" }),
        /* @__PURE__ */ l("option", { value: "compact", children: "Compact" })
      ] })
    ] }),
    /* @__PURE__ */ g("fieldset", { className: "qz-board-setting-group", children: [
      /* @__PURE__ */ l("legend", { children: "Show on cards" }),
      Fi.map(([a, r]) => /* @__PURE__ */ g("label", { className: "qz-check-label", children: [
        /* @__PURE__ */ l("input", { type: "checkbox", checked: e.boardFields[a], onChange: (i) => t({ boardFields: { ...e.boardFields, [a]: i.target.checked } }) }),
        r
      ] }, a))
    ] }),
    /* @__PURE__ */ g("label", { className: "qz-check-label", children: [
      /* @__PURE__ */ l("input", { type: "checkbox", checked: e.hideEmptyLanes, onChange: (a) => t({ hideEmptyLanes: a.target.checked }) }),
      "Hide empty columns"
    ] }),
    n && /* @__PURE__ */ g("fieldset", { className: "qz-board-setting-group qz-board-order-group", children: [
      /* @__PURE__ */ g("legend", { children: [
        "Column order in ",
        n.name
      ] }),
      /* @__PURE__ */ l("div", { className: "qz-board-order-fields", children: n.columns.map((a) => {
        const r = `${n.id}:${a.id}`;
        return /* @__PURE__ */ g("label", { className: "qz-field", children: [
          a.label,
          " order",
          /* @__PURE__ */ g("select", { className: "qz-input", value: e.laneSort[r] ?? "manual", onChange: (i) => {
            t({ laneSort: { [r]: i.target.value === "title" ? "title" : "manual" } });
          }, children: [
            /* @__PURE__ */ l("option", { value: "manual", children: "Manual" }),
            /* @__PURE__ */ l("option", { value: "title", children: "Title (A–Z)" })
          ] })
        ] }, a.id);
      }) }),
      /* @__PURE__ */ l("p", { className: "qz-muted", children: "Select Manual to rearrange cards within a column." })
    ] })
  ] });
}
function vn(e) {
  const [t, n] = S(!1), [a, r] = S(null), i = re(!0), o = re(!1);
  oe(() => (i.current = !0, () => {
    i.current = !1;
  }), []);
  const s = async (u) => {
    if (o.current) return !1;
    o.current = !0, n(!0), r(null);
    try {
      return await _e(u()), i.current && e(), !0;
    } catch (p) {
      if (i.current) {
        const d = Ce(p);
        d.status === 409 && (d.message += " Refresh to review the current file, then retry your change."), (d.message.includes("timed out") || !d.status) && (d.message += " The result may be unknown; refresh and check the file before retrying."), r(d);
      }
      return !1;
    } finally {
      o.current = !1, i.current && n(!1);
    }
  }, c = Ye(() => r(null), []);
  return { pending: t, failure: a, run: s, clear: c };
}
const Mi = new Intl.Collator(void 0, { numeric: !0, sensitivity: "base" });
function Ii(e) {
  return e ? { "--qz-status": e } : void 0;
}
function ja({ name: e, appearance: t }) {
  const n = t && Ke(t.color);
  return /* @__PURE__ */ g("span", { className: "qz-folder-label", style: n ? { "--qz-folder-label-color": n } : void 0, children: [
    n && /* @__PURE__ */ l("span", { className: "qz-folder-label-dot", "aria-hidden": "true" }),
    (t == null ? void 0 : t.emoji) && /* @__PURE__ */ l("span", { "aria-hidden": "true", children: t.emoji }),
    e
  ] });
}
function Oi(e) {
  var qe, Ee, j, C, A, I;
  const { api: t, workspace: n, active: a, preferences: r } = e, i = n.id, o = ya(), { data: s, failure: c, busy: u, refresh: p, reload: d } = Ma(
    t,
    a,
    String(i),
    i,
    () => li(t, i),
    () => mn(t, { workspaceId: i, manual: !0 }),
    (z, $) => ({ ...z, index: $[String(i)] ?? z.index })
  ), f = vn(d), [m, h] = Si(), x = (s == null ? void 0 : s.workspace.columns) ?? n.columns, { laneSort: k, hideEmptyLanes: v } = r, q = Oe(() => {
    const z = ui(x, (s == null ? void 0 : s.tickets) ?? []);
    for (const $ of x)
      k[`${i}:${$.id}`] === "title" && z[$.id].sort((G, Q) => Mi.compare(G.title, Q.title));
    return z;
  }, [x, s, k, i]), [w, _] = S(!1), E = re(null), [b, M] = S(!1);
  oe(() => {
    M(!1);
  }, [v]);
  const y = x.filter((z) => q[z.id].length === 0).length, T = [
    ...x.filter((z) => !v || b || q[z.id].length > 0),
    ...q.repair.length > 0 ? [Na] : []
  ], U = re(null), B = re(null), [Y, Z] = S({ start: !1, end: !1 }), ne = !!s && T.length > 0;
  oe(() => {
    const z = U.current;
    if (!z) return;
    const $ = () => {
      const Q = Math.abs(z.scrollLeft) > 1, X = z.scrollWidth - z.clientWidth - Math.abs(z.scrollLeft) > 1;
      Z((le) => le.start === Q && le.end === X ? le : { start: Q, end: X });
    };
    $(), z.addEventListener("scroll", $, { passive: !0 });
    const G = typeof ResizeObserver > "u" ? null : new ResizeObserver($);
    return G == null || G.observe(z), () => {
      z.removeEventListener("scroll", $), G == null || G.disconnect();
    };
  }, [ne, T.length]);
  const [P, R] = S(null), [L, D] = S(null), [N, J] = S(null), H = re(null);
  oe(() => {
    var z;
    N && ((z = H.current) == null || z.focus());
  }, [N]);
  const [V, ue] = S(!1), ce = !a || !!c || u || f.pending || V || !!$e(s == null ? void 0 : s.index), [he, ae] = S(""), ze = ((qe = x.find((z) => z.id === he)) == null ? void 0 : qe.id) ?? ((Ee = s == null ? void 0 : s.index.maintenance) == null ? void 0 : Ee[0]) ?? x[0].id, [ke, F] = S(!1), [W, de] = S(!1), [De, ee] = S(!1), pe = s ? [s.index] : [], se = Ye((z) => {
    ae(z), ee(!0);
  }, []), [Ae, xe] = S(null);
  oe(() => {
    var $;
    if (!Ae || ce || !s) return;
    const z = Array.from((($ = U.current) == null ? void 0 : $.querySelectorAll("[data-note-path]")) ?? []).find((G) => G.dataset.notePath === Ae);
    z == null || z.focus(), xe(null);
  }, [Ae, ce, s]);
  const K = (z, $, G) => {
    var X;
    if (ce || $e(s == null ? void 0 : s.index, z) || !s || (X = s.index.maintenance) != null && X.includes($)) return;
    const Q = k[`${i}:${$}`] === "title";
    Q && z.lane === $ || f.run(() => ki(t, i, qi(s.tickets, z, $, Q ? void 0 : G))).then((le) => {
      var Ve;
      if (!le) return;
      xe(z.path);
      const we = ((Ve = x.find((wt) => wt.id === $)) == null ? void 0 : Ve.label) ?? $;
      h(z.lane === $ ? `Reordered “${z.title}”.` : `Moved “${z.title}” to ${we}.`);
    });
  }, Fe = (z) => () => {
    f.clear(), h(z), J(null), d();
  }, ge = (z, $) => {
    var X;
    const G = B.current;
    if (ce || !G || $ === "repair" || G.lane === $ && k[`${i}:${$}`] === "title") return;
    z.preventDefault(), z.stopPropagation();
    const Q = ((X = z.target.closest("li[data-ticket-path]")) == null ? void 0 : X.getAttribute("data-ticket-path")) ?? void 0;
    R((le) => (le == null ? void 0 : le.lane) === $ && le.before === Q ? le : { lane: $, before: Q });
  }, ie = (z, $, G) => {
    z.preventDefault(), z.stopPropagation();
    const Q = B.current;
    if (B.current = null, R(null), !Q || (G == null ? void 0 : G.path) === Q.path) return;
    const X = G && k[`${i}:${$}`] !== "title" ? q[$].filter((le) => le.path !== Q.path).findIndex((le) => le.path === G.path) : void 0;
    X !== void 0 && X < 0 || K(Q, $, X);
  }, Se = (z) => {
    var Ve, wt;
    const $ = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"], G = z.target;
    if (!G.hasAttribute("data-lane")) return;
    const Q = Number(G.dataset.lane), X = Number(G.dataset.index);
    if (!$.includes(z.key) || Number.isNaN(Q) || Number.isNaN(X)) return;
    let le = Q, we = X;
    if (z.key === "ArrowUp" && (we = Math.max(0, X - 1)), z.key === "ArrowDown" && (we = X + 1), z.key === "Home" && (we = 0), z.key === "End" && (we = Number.MAX_SAFE_INTEGER), z.key === "ArrowLeft" || z.key === "ArrowRight") {
      const Hr = z.key === "ArrowLeft" ? -1 : 1;
      do
        le += Hr;
      while (le >= 0 && le < T.length && q[T[le].id].length === 0);
      if (le < 0 || le >= T.length) return;
    }
    we = Math.min(we, q[T[le].id].length - 1), z.preventDefault(), (wt = (Ve = U.current) == null ? void 0 : Ve.querySelector(`[data-lane="${le}"][data-index="${we}"]`)) == null || wt.focus();
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
            onClick: () => {
              _(!1), J(N === "create" ? null : "create");
            },
            disabled: f.pending || V,
            children: [
              /* @__PURE__ */ l(te, { name: "plus" }),
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
            onClick: () => {
              _(!1), J(N === "promote" ? null : "promote");
            },
            disabled: f.pending || V,
            children: [
              /* @__PURE__ */ l(te, { name: "note" }),
              "Use existing note"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ g(
          "button",
          {
            ref: E,
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            "aria-expanded": w,
            "aria-controls": `qz-board-view-${i}`,
            onClick: () => {
              J(null), _((z) => !z);
            },
            onKeyDown: (z) => {
              z.key === "Escape" && w && (z.stopPropagation(), _(!1));
            },
            children: [
              /* @__PURE__ */ l(te, { name: "settings" }),
              "View"
            ]
          }
        ),
        /* @__PURE__ */ l(ti, { label: "More actions", children: (z) => /* @__PURE__ */ g(ve, { children: [
          /* @__PURE__ */ l("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => {
            z(), e.onSettings();
          }, children: "Customize columns" }),
          /* @__PURE__ */ l(
            "button",
            {
              type: "button",
              className: "qz-button",
              "data-variant": "quiet",
              disabled: ce,
              onClick: () => {
                z(), ee(!0);
              },
              children: "Rebalance…"
            }
          ),
          /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => {
            z(), o(Da);
          }, children: [
            /* @__PURE__ */ l(te, { name: "external" }),
            "Open Kiro Notes"
          ] }),
          /* @__PURE__ */ l(pn, { workspace: (s == null ? void 0 : s.workspace) ?? n, variant: "quiet", onOpen: z })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ l(
      "section",
      {
        id: `qz-board-view-${i}`,
        className: "qz-panel-surface qz-board-view-panel",
        "aria-label": "Board view settings",
        hidden: !w,
        onKeyDown: (z) => {
          var $;
          z.key === "Escape" && (z.stopPropagation(), _(!1), ($ = E.current) == null || $.focus());
        },
        children: /* @__PURE__ */ l($a, { preferences: r, onPreferencesChange: e.onPreferencesChange, workspace: (s == null ? void 0 : s.workspace) ?? n })
      }
    ),
    ["create", "promote"].map((z) => /* @__PURE__ */ l("div", { hidden: N !== z, children: /* @__PURE__ */ l(Li, { mode: z, api: t, workspace: n, columns: x, firstField: N === z ? H : void 0, disabled: !a || !!c || u || f.pending || !!$e(s == null ? void 0 : s.index), maintenance: (s == null ? void 0 : s.index.maintenance) ?? [], onBusy: ue, onChanged: Fe(z === "create" ? "Ticket created. It is in the first column." : "Note added to the board."), onClose: () => J(null), onMaintenanceNeeded: se }) }, z)),
    /* @__PURE__ */ g("div", { className: "qz-toolbar qz-board-meta", children: [
      s && /* @__PURE__ */ g("span", { className: "qz-result-count", children: [
        s.tickets.length,
        " ",
        s.tickets.length === 1 ? "ticket" : "tickets"
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        s && v && y > 0 && /* @__PURE__ */ l(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            "aria-expanded": b,
            onClick: () => M((z) => !z),
            children: b ? "Hide empty columns" : `Show empty columns (${y})`
          }
        ),
        /* @__PURE__ */ l(Ia, { statuses: pe }),
        /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => void p(), disabled: u || f.pending, children: [
          /* @__PURE__ */ l(te, { name: "refresh" }),
          "Refresh"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ l(Oa, { statuses: pe, names: [n.name], onSettings: e.onSettings }),
    /* @__PURE__ */ l(me, { failure: c }),
    /* @__PURE__ */ l(me, { failure: f.failure }),
    m && !f.failure && /* @__PURE__ */ g("p", { className: "qz-success", role: "status", children: [
      /* @__PURE__ */ l(te, { name: "check" }),
      m
    ] }),
    $e(s == null ? void 0 : s.index) && s && /* @__PURE__ */ l("div", { role: "note", className: "qz-notice", children: $e(s.index) }),
    De || ((j = f.failure) == null ? void 0 : j.code) === "rank_exhausted" || ((C = f.failure) == null ? void 0 : C.code) === "maintenance_pending" || (A = s == null ? void 0 : s.index.maintenance) != null && A.length ? /* @__PURE__ */ g("div", { className: "qz-notice qz-stack", children: [
      /* @__PURE__ */ l("p", { children: "Rebalance a column to restore space between card positions. Progress is saved if interrupted." }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ l("select", { className: "qz-input", "aria-label": "Column to rebalance", value: ze, onChange: (z) => ae(z.target.value), children: x.map((z) => /* @__PURE__ */ l("option", { value: z.id, children: z.label }, z.id)) }),
        /* @__PURE__ */ l("button", { type: "button", className: "qz-button", onClick: () => F(!0), disabled: !a || f.pending || !!(s != null && s.index.writeBlocked), children: "Review column…" })
      ] }),
      ke && /* @__PURE__ */ g(ht, { label: "Rebalance column", className: "qz-stack", onCancel: () => F(!1), children: [
        /* @__PURE__ */ l("p", { children: "Update ordering in each note of this column? Other editors may see progress before all files finish." }),
        !!((I = s == null ? void 0 : s.index.maintenance) != null && I.includes(ze)) && /* @__PURE__ */ g("label", { className: "qz-check-label", children: [
          /* @__PURE__ */ l("input", { type: "checkbox", checked: W, onChange: (z) => de(z.target.checked), disabled: f.pending }),
          "Keep the latest note contents and resume ordering after an external edit"
        ] }),
        /* @__PURE__ */ g("div", { className: "qz-actions", children: [
          /* @__PURE__ */ l("button", { type: "button", className: "qz-button", disabled: !a || f.pending || !!(s != null && s.index.writeBlocked), onClick: () => void f.run(() => wi(t, i, ze, W)).then((z) => {
            z && (F(!1), de(!1));
          }), children: "Rebalance column" }),
          /* @__PURE__ */ l("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: f.pending, onClick: () => F(!1), children: "Cancel" })
        ] })
      ] })
    ] }) : null,
    L && /* @__PURE__ */ g(ht, { label: "Remove ticket", className: "qz-notice qz-stack", onCancel: () => D(null), children: [
      /* @__PURE__ */ g("p", { children: [
        "Remove “",
        L.title,
        "” from the board? Its note and TODOs will remain."
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ l(
          "button",
          {
            type: "button",
            className: "qz-button qz-destructive",
            disabled: f.pending,
            onClick: () => {
              const z = L;
              D(null), f.run(() => Ri(t, i, z)).then(($) => {
                $ && h(`Removed “${z.title}” from the board. The note is untouched.`);
              });
            },
            children: "Remove ticket"
          }
        ),
        /* @__PURE__ */ l("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => D(null), children: "Cancel" })
      ] })
    ] }),
    !s && !c && /* @__PURE__ */ l("p", { className: "qz-muted qz-loading", role: "status", children: "Loading the board…" }),
    s && s.tickets.length === 0 && s.index.state !== "scanning" && /* @__PURE__ */ g("div", { className: "qz-empty", children: [
      /* @__PURE__ */ l("span", { className: "qz-empty-icon", children: /* @__PURE__ */ l(te, { name: "board" }) }),
      /* @__PURE__ */ g("h3", { children: [
        "No tickets in “",
        n.name,
        "” yet"
      ] }),
      /* @__PURE__ */ l("p", { children: "Create a ticket, or turn an existing note into one." }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "primary", disabled: f.pending || V, onClick: () => J("create"), children: [
          /* @__PURE__ */ l(te, { name: "plus" }),
          "New ticket"
        ] }),
        /* @__PURE__ */ g("button", { type: "button", className: "qz-button", disabled: f.pending || V, onClick: () => J("promote"), children: [
          /* @__PURE__ */ l(te, { name: "note" }),
          "Use existing note"
        ] })
      ] })
    ] }),
    s && T.length > 0 && /* @__PURE__ */ l("p", { className: "qz-muted qz-board-hint", children: "Tip: focus a card title, then use the arrow keys to move between cards. Scroll sideways for more columns." }),
    s && T.length > 0 && /* @__PURE__ */ l("div", { className: "qz-board-wrap", "data-more-start": Y.start || void 0, "data-more-end": Y.end || void 0, children: /* @__PURE__ */ l("div", { ref: U, className: "qz-board", "data-density": r.boardDensity, tabIndex: 0, onKeyDown: Se, "aria-label": `Board of ${n.name}`, role: "group", children: T.map(({ id: z, label: $, color: G }, Q) => /* @__PURE__ */ g(
      "section",
      {
        "aria-label": $,
        className: "qz-lane",
        "data-lane-status": z,
        style: Ii(G),
        "data-drop-target": (P == null ? void 0 : P.lane) === z || void 0,
        onDragOver: (X) => ge(X, z),
        onDragLeave: (X) => {
          X.relatedTarget instanceof Node && X.currentTarget.contains(X.relatedTarget) || R((le) => (le == null ? void 0 : le.lane) === z ? null : le);
        },
        onDrop: (X) => {
          z !== "repair" && ie(X, z);
        },
        children: [
          /* @__PURE__ */ g("h3", { className: "qz-lane-heading", children: [
            /* @__PURE__ */ l("span", { className: "qz-dot", "aria-hidden": "true" }),
            $,
            /* @__PURE__ */ l("span", { className: "qz-count", children: q[z].length })
          ] }),
          z === "repair" && /* @__PURE__ */ l("p", { className: "qz-lane-help qz-muted", children: "Choose a column for tickets with an old status. Open a note to fix other ticket details." }),
          q[z].length === 0 && /* @__PURE__ */ l("p", { className: "qz-lane-empty", children: "No tickets" }),
          /* @__PURE__ */ l("ul", { className: "qz-cards", children: q[z].map((X, le) => /* @__PURE__ */ l(
            "li",
            {
              "data-ticket-path": X.path,
              "data-drop-before": (P == null ? void 0 : P.lane) === z && P.before === X.path || void 0,
              draggable: !ce && !$e(s.index, X),
              onDragStart: (we) => {
                B.current = X, we.dataTransfer.setData("text/plain", X.path), we.dataTransfer.effectAllowed = "move";
              },
              onDragEnd: () => {
                B.current = null, R(null);
              },
              onDrop: (we) => {
                z !== "repair" && ie(we, z, X);
              },
              children: /* @__PURE__ */ l(
                $i,
                {
                  ticket: X,
                  lane: Q,
                  index: le,
                  columns: x,
                  onOpen: () => e.onOpenNote({ workspaceId: i, path: X.path }),
                  disabled: ce || !!$e(s.index, X),
                  maintenance: s.index.maintenance ?? [],
                  canReorder: k[`${i}:${z}`] !== "title",
                  fields: r.boardFields,
                  folder: n.name,
                  folderAppearance: r.folderAppearance[String(i)],
                  onMove: (we, Ve) => K(X, we, Ve),
                  onDemote: () => D(X),
                  count: q[z].length
                }
              )
            },
            X.path
          )) })
        ]
      },
      z
    )) }) })
  ] });
}
function Bi(e) {
  const t = e.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "");
  return t ? `tickets/${t}.md` : "";
}
function Li(e) {
  const [t, n] = S(""), [a, r] = S(!1), [i, o] = S(""), [s, c] = S(""), [u, p] = S(""), d = (e.columns.find((P) => P.id === u) ?? e.columns[0]).id, [f, m] = S(null), [h, x] = S(null), [k, v] = S(!1), q = re(0), w = re(!0);
  oe(() => (w.current = !0, () => {
    w.current = !1, q.current++;
  }), []);
  const _ = vn(e.onChanged);
  oe(() => (e.onBusy(_.pending), () => e.onBusy(!1)), [_.pending, e.onBusy]);
  const E = e.disabled || _.pending || k, b = e.maintenance.includes(d);
  oe(() => {
    var P, R;
    (((P = _.failure) == null ? void 0 : P.code) === "rank_exhausted" || ((R = _.failure) == null ? void 0 : R.code) === "maintenance_pending") && e.onMaintenanceNeeded(d);
  }, [_.failure, e.onMaintenanceNeeded, d]);
  const M = () => {
    q.current++, v(!1), n(""), r(!1), o(""), c(""), m(null), x(null), e.onClose();
  }, y = t.trim().endsWith(".md") ? t.trim() : `${t.trim()}.md`, T = async () => {
    const P = ++q.current;
    v(!0), x(null), m(null);
    try {
      const R = await _e(an(e.api, e.workspace.id, y));
      w.current && P === q.current && m(R);
    } catch (R) {
      w.current && P === q.current && x(Ce(R));
    } finally {
      w.current && P === q.current && v(!1);
    }
  }, U = async () => {
    await _.run(() => e.mode === "create" ? vi(e.api, e.workspace.id, { path: y, title: i.trim(), body: s, status: d }) : zi(e.api, e.workspace.id, f, d)) && w.current && (n(""), r(!1), o(""), c(""), m(null), e.onClose());
  }, B = e.mode === "create", Y = B ? "New ticket" : "Use existing note", Z = !E && !b && !!t.trim() && (B ? !!i.trim() : !!f), ne = B ? i.trim() ? t.trim() ? "" : "Enter a note path" : "Enter a title" : t.trim() ? f ? "" : "Preview the note first" : "Enter the note’s path";
  return /* @__PURE__ */ g("section", { className: "qz-panel-surface qz-ticket-form", "aria-label": Y, children: [
    /* @__PURE__ */ l("h3", { children: Y }),
    /* @__PURE__ */ g("form", { className: "qz-stack", onSubmit: (P) => {
      P.preventDefault(), Z && U();
    }, children: [
      B && /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Title",
        /* @__PURE__ */ l(
          "input",
          {
            className: "qz-input",
            ref: e.firstField,
            placeholder: "Fix login",
            value: i,
            disabled: _.pending,
            onChange: (P) => {
              o(P.target.value), a || n(Bi(P.target.value));
            }
          }
        )
      ] }),
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Note path in ",
        e.workspace.name,
        /* @__PURE__ */ l(
          "input",
          {
            className: "qz-input",
            ref: B ? void 0 : e.firstField,
            placeholder: "tickets/fix-login.md",
            value: t,
            disabled: _.pending,
            onChange: (P) => {
              q.current++, v(!1), n(P.target.value), r(!!P.target.value), m(null);
            }
          }
        ),
        B && !a && !!t && /* @__PURE__ */ l("span", { className: "qz-muted qz-field-hint", children: "Suggested from the title. Edit it to choose another location." })
      ] }),
      B ? /* @__PURE__ */ g("label", { className: "qz-field", children: [
        /* @__PURE__ */ g("span", { children: [
          "Description ",
          /* @__PURE__ */ l("span", { className: "qz-muted", children: "· Optional Markdown" })
        ] }),
        /* @__PURE__ */ l("textarea", { className: "qz-input", placeholder: "What needs to happen?", value: s, disabled: _.pending, onChange: (P) => c(P.target.value), rows: 4 })
      ] }) : /* @__PURE__ */ g(ve, { children: [
        /* @__PURE__ */ l("div", { className: "qz-actions", children: /* @__PURE__ */ l("button", { type: "button", className: "qz-button", disabled: E || !t.trim(), onClick: () => void T(), children: "Preview note" }) }),
        f && /* @__PURE__ */ g(ve, { children: [
          /* @__PURE__ */ l("pre", { className: "qz-mono qz-note-preview", children: f.content }),
          /* @__PURE__ */ l("p", { className: "qz-muted", children: "The note’s content and existing properties are preserved." })
        ] })
      ] }),
      (B || f) && /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Initial status",
        /* @__PURE__ */ l("select", { className: "qz-input", value: d, disabled: _.pending, onChange: (P) => p(P.target.value), children: e.columns.map((P) => /* @__PURE__ */ l("option", { value: P.id, children: P.label }, P.id)) })
      ] }),
      b && /* @__PURE__ */ l("span", { className: "qz-notice", children: "Resume ordering maintenance for this column before adding a ticket." }),
      /* @__PURE__ */ l(me, { failure: h }),
      /* @__PURE__ */ l(me, { failure: _.failure }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ l("button", { type: "submit", className: "qz-button", "data-variant": "primary", disabled: !Z, children: B ? "Create ticket" : "Add to board" }),
        /* @__PURE__ */ l("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: _.pending, onClick: M, children: "Cancel" }),
        !Z && ne && /* @__PURE__ */ g("span", { className: "qz-muted qz-form-hint", children: [
          ne,
          " to continue."
        ] })
      ] })
    ] })
  ] });
}
function $i(e) {
  const { ticket: t, fields: n, folderAppearance: a } = e, r = t.lane === "repair" ? "" : t.lane, i = a && (a.emoji || a.color !== "theme"), o = re(null);
  return oe(() => {
    const s = (c) => {
      const u = o.current;
      u != null && u.open && !(c.target instanceof Node && u.contains(c.target)) && (u.open = !1);
    };
    return document.addEventListener("mousedown", s), () => document.removeEventListener("mousedown", s);
  }, []), /* @__PURE__ */ g("article", { className: "qz-ticket", children: [
    /* @__PURE__ */ g("div", { className: "qz-ticket-content", children: [
      /* @__PURE__ */ g("button", { type: "button", className: "qz-note-link", "data-lane": e.lane, "data-index": e.index, "data-note-path": t.path, "aria-label": `Open note: ${t.title}`, onClick: e.onOpen, children: [
        t.title,
        /* @__PURE__ */ l(te, { name: "external" })
      ] }),
      n.path && /* @__PURE__ */ l("span", { className: "qz-mono qz-path", title: t.path, children: t.path }),
      n.progress && t.todos.total > 0 && /* @__PURE__ */ g("div", { className: "qz-ticket-progress", children: [
        /* @__PURE__ */ l("progress", { value: t.todos.done, max: t.todos.total, "aria-label": `Checklist progress for ${t.title}` }),
        /* @__PURE__ */ g("span", { title: "Completed TODOs", children: [
          t.todos.done,
          "/",
          t.todos.total
        ] })
      ] }),
      n.badges && (i || t.diagnostics.length > 0) && /* @__PURE__ */ g("div", { className: "qz-actions qz-ticket-badges", children: [
        i && /* @__PURE__ */ l(ja, { name: e.folder, appearance: a }),
        t.diagnostics.map((s) => /* @__PURE__ */ l("span", { className: "qz-badge", title: s.message, children: s.code.replace(/_/g, " ") }, s.code))
      ] })
    ] }),
    /* @__PURE__ */ g("div", { className: "qz-ticket-footer", children: [
      /* @__PURE__ */ l("div", { className: "qz-ticket-status", children: /* @__PURE__ */ g(
        "select",
        {
          className: "qz-input",
          "aria-label": `Move ${t.title} to column`,
          title: "Move to column",
          value: r,
          disabled: e.disabled,
          onChange: (s) => e.onMove(s.target.value),
          children: [
            !r && /* @__PURE__ */ l("option", { value: "", disabled: !0, children: t.status ? `No column for ${t.status}` : "Needs repair" }),
            e.columns.map((s) => /* @__PURE__ */ l("option", { value: s.id, disabled: e.maintenance.includes(s.id), children: s.label }, s.id))
          ]
        }
      ) }),
      /* @__PURE__ */ g("details", { ref: o, className: "qz-ticket-actions", onKeyDown: (s) => {
        var c, u;
        s.key !== "Escape" || !((c = o.current) != null && c.open) || (s.stopPropagation(), o.current.open = !1, (u = o.current.querySelector("summary")) == null || u.focus());
      }, children: [
        /* @__PURE__ */ l("summary", { className: "qz-button qz-icon-button", "data-variant": "quiet", "aria-label": `Actions for ${t.title}`, title: "Ticket actions", children: /* @__PURE__ */ l(te, { name: "more" }) }),
        /* @__PURE__ */ g("div", { className: "qz-ticket-action-list", children: [
          /* @__PURE__ */ l(Ba, { path: t.path }),
          e.canReorder && /* @__PURE__ */ g(ve, { children: [
            /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "quiet", "aria-label": `Move ${t.title} up`, disabled: e.disabled || e.index === 0 || !r, onClick: () => e.onMove(r, e.index - 1), children: [
              /* @__PURE__ */ l(te, { name: "up" }),
              "Move up"
            ] }),
            /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "quiet", "aria-label": `Move ${t.title} down`, disabled: e.disabled || e.index >= e.count - 1 || !r, onClick: () => e.onMove(r, e.index + 1), children: [
              /* @__PURE__ */ l(te, { name: "down" }),
              "Move down"
            ] })
          ] }),
          /* @__PURE__ */ g("button", { type: "button", className: "qz-button qz-destructive", "data-variant": "quiet", "aria-label": `Remove ${t.title} from board`, disabled: e.disabled, onClick: e.onDemote, children: [
            /* @__PURE__ */ l(te, { name: "minus" }),
            "Remove ticket…"
          ] })
        ] })
      ] })
    ] })
  ] });
}
const Cn = 20, ji = 40, Pi = 200;
function Ui(e) {
  var ke;
  const { api: t, preferences: n, onPreferencesChange: a, workspaceId: r, active: i = !0 } = e, o = ya(), { companions: s, failure: c } = Fa(t, i, r), { todoScope: u, todoState: p, todoFilters: d } = n, [f, m] = S(""), h = re(null), [x, k] = S(""), [v, q] = S(""), w = d.find((F) => F.name.toLocaleLowerCase() === v.trim().toLocaleLowerCase()), _ = !!v.trim() && (d.length < Cn || !!w), E = d.find((F) => F.name === x), b = (E == null ? void 0 : E.scope) === u && (E == null ? void 0 : E.state) === p && (E == null ? void 0 : E.search) === f ? E.name : "", M = (F) => {
    const W = d.find((de) => de.name === F);
    k(F), W && (a({ todoScope: W.scope, todoState: W.state }), m(W.search));
  }, y = (F) => {
    if (F.preventDefault(), !_) return;
    const W = { name: (w == null ? void 0 : w.name) ?? v.trim(), scope: u, state: p, search: f };
    a({ todoFilters: w ? d.map((de) => de === w ? W : de) : [...d, W] }), k(W.name), q("");
  }, T = () => {
    a({ todoFilters: d.filter((F) => F.name !== b) }), k("");
  }, U = (ke = s == null ? void 0 : s.find((F) => F.workspace.id === r)) == null ? void 0 : ke.workspace.name, B = u === "workspace" ? r ?? void 0 : void 0, Y = i && !!(s != null && s.length) && (u === "all" || B !== void 0), { data: Z, failure: ne, busy: P, refresh: R, reload: L } = Ma(
    t,
    Y,
    `${u}:${B ?? ""}:${p}`,
    B,
    () => ci(t, p, B),
    () => mn(t, { workspaceId: B, manual: !0 }),
    (F, W) => ({ ...F, index: W })
  ), D = Oe(() => pi((Z == null ? void 0 : Z.groups) ?? [], f), [Z, f]), N = D.reduce((F, W) => F + W.items.length, 0), J = Z ? Object.entries(Z.index) : [], H = J.map(([, F]) => F), V = J.map(([F]) => {
    var W;
    return (W = s == null ? void 0 : s.find((de) => String(de.workspace.id) === F)) == null ? void 0 : W.workspace.name;
  }), ue = vn(L), [ce, he] = S(null), ae = (F, W) => `${F.workspaceId}:${F.path}:${W.ordinal}`, ze = (F, W, de) => {
    !i || ue.pending || ne || P || $e(Z == null ? void 0 : Z.index[String(F.workspaceId)], F) || W.markerStart === void 0 || (he(ae(F, W)), ue.run(() => xi(t, F, W, de)).finally(() => he(null)));
  };
  return c ? /* @__PURE__ */ l(me, { failure: c }) : s ? s.length === 0 ? /* @__PURE__ */ l(La, { onSettings: e.onSettings }) : /* @__PURE__ */ g("div", { className: "qz-stack qz-todos", children: [
    /* @__PURE__ */ g("div", { className: "qz-view-heading", children: [
      /* @__PURE__ */ g("div", { children: [
        /* @__PURE__ */ l("h2", { className: "qz-section-title", children: "TODOs" }),
        /* @__PURE__ */ l("p", { className: "qz-section-description", children: "Find and complete Markdown TODOs across your shared folders." })
      ] }),
      /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => o(Da), children: [
        /* @__PURE__ */ l(te, { name: "external" }),
        "Open Kiro Notes"
      ] })
    ] }),
    /* @__PURE__ */ g("div", { className: "qz-todo-filters qz-panel-surface", children: [
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Search",
        /* @__PURE__ */ g("span", { className: "qz-search", children: [
          /* @__PURE__ */ l(te, { name: "search" }),
          /* @__PURE__ */ l(
            "input",
            {
              className: "qz-input",
              ref: h,
              type: "search",
              placeholder: "Search tasks or notes…",
              value: f,
              maxLength: Pi,
              onChange: (F) => m(F.target.value)
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Folder scope",
        /* @__PURE__ */ g("select", { className: "qz-input", value: u, onChange: (F) => a({ todoScope: F.target.value === "workspace" ? "workspace" : "all" }), children: [
          /* @__PURE__ */ l("option", { value: "all", children: "All folders" }),
          /* @__PURE__ */ l("option", { value: "workspace", children: U ? `Current folder (${U})` : "Current folder" })
        ] })
      ] }),
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Show",
        /* @__PURE__ */ g("select", { className: "qz-input", value: p, onChange: (F) => a({ todoState: F.target.value }), children: [
          /* @__PURE__ */ l("option", { value: "open", children: "Open" }),
          /* @__PURE__ */ l("option", { value: "done", children: "Completed" }),
          /* @__PURE__ */ l("option", { value: "all", children: "All" })
        ] })
      ] }),
      /* @__PURE__ */ g("details", { className: "qz-todo-saved-filters", children: [
        /* @__PURE__ */ l("summary", { className: "qz-button", "data-variant": "quiet", children: "Saved filters" }),
        /* @__PURE__ */ g("div", { className: "qz-todo-saved-controls", children: [
          d.length > 0 && /* @__PURE__ */ g("div", { className: "qz-todo-saved-row", children: [
            /* @__PURE__ */ g("label", { className: "qz-field", children: [
              "Saved filter",
              /* @__PURE__ */ g("select", { className: "qz-input", value: b, onChange: (F) => M(F.target.value), children: [
                /* @__PURE__ */ l("option", { value: "", disabled: !0, children: "Choose a filter" }),
                d.map((F) => /* @__PURE__ */ l("option", { value: F.name, children: F.name }, F.name))
              ] })
            ] }),
            /* @__PURE__ */ l("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: !b, onClick: T, children: "Remove saved filter" })
          ] }),
          /* @__PURE__ */ g("form", { className: "qz-todo-saved-row", onSubmit: y, children: [
            /* @__PURE__ */ g("label", { className: "qz-field", children: [
              "Filter name",
              /* @__PURE__ */ l("input", { className: "qz-input", value: v, maxLength: ji, onChange: (F) => q(F.target.value) })
            ] }),
            /* @__PURE__ */ l("button", { className: "qz-button", type: "submit", disabled: !_, children: w ? "Update saved filter" : "Save current filter" }),
            d.length >= Cn && !w && /* @__PURE__ */ l("p", { className: "qz-muted", children: "Remove a saved filter to add another." })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ g("div", { className: "qz-toolbar qz-board-meta", children: [
      Z && /* @__PURE__ */ g("span", { className: "qz-result-count", role: "status", children: [
        N,
        " ",
        N === 1 ? "item" : "items",
        " in ",
        D.length,
        " ",
        D.length === 1 ? "note" : "notes"
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ l(Ia, { statuses: H }),
        /* @__PURE__ */ g("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => void R(), disabled: P || ue.pending, children: [
          /* @__PURE__ */ l(te, { name: "refresh" }),
          "Refresh"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ l(Oa, { statuses: H, names: V, onSettings: e.onSettings }),
    /* @__PURE__ */ l(me, { failure: ne }),
    /* @__PURE__ */ l(me, { failure: ue.failure }),
    (Z == null ? void 0 : Z.truncated) && /* @__PURE__ */ l("div", { role: "note", className: "qz-notice", children: "Only the first items are listed. Narrow the list by folder or completion status." }),
    !Z && !ne && /* @__PURE__ */ l("p", { className: "qz-muted qz-loading", role: "status", children: "Loading TODOs…" }),
    Z && D.length === 0 && /* @__PURE__ */ g("div", { className: "qz-empty", children: [
      /* @__PURE__ */ l("span", { className: "qz-empty-icon", children: /* @__PURE__ */ l(te, { name: f.trim() ? "search" : "checklist" }) }),
      /* @__PURE__ */ l("h3", { children: f.trim() ? "No matching TODOs" : "No TODOs to show" }),
      /* @__PURE__ */ l("p", { children: f.trim() ? "Try a different search or clear the filter." : "Choose a different folder or completion status to see more." }),
      f.trim() && /* @__PURE__ */ l("button", { type: "button", className: "qz-button", onClick: () => {
        var F;
        m(""), (F = h.current) == null || F.focus();
      }, children: "Clear search" })
    ] }),
    /* @__PURE__ */ l("div", { className: "qz-stack", children: D.map((F) => /* @__PURE__ */ g("section", { "aria-label": F.title, className: "qz-todo-note qz-panel-surface", children: [
      /* @__PURE__ */ g("header", { className: "qz-todo-header", children: [
        /* @__PURE__ */ l("span", { className: "qz-note-icon", children: /* @__PURE__ */ l(te, { name: "note" }) }),
        /* @__PURE__ */ g("div", { className: "qz-todo-identity", children: [
          /* @__PURE__ */ g("h3", { children: [
            F.title,
            F.ticket && F.status && /* @__PURE__ */ g("span", { className: "qz-status-pill", "data-lane-status": F.status, children: [
              /* @__PURE__ */ l("span", { className: "qz-dot", "aria-hidden": "true" }),
              F.statusLabel ?? F.status
            ] })
          ] }),
          /* @__PURE__ */ g("p", { className: "qz-todo-meta", children: [
            /* @__PURE__ */ l(ja, { name: F.workspace, appearance: n.folderAppearance[String(F.workspaceId)] }),
            /* @__PURE__ */ l("span", { "aria-hidden": "true", children: "/" }),
            /* @__PURE__ */ l("span", { className: "qz-mono qz-path", title: F.path, children: F.path })
          ] })
        ] }),
        /* @__PURE__ */ l(Ba, { path: F.path, compact: !0 })
      ] }),
      /* @__PURE__ */ l("ul", { className: "qz-todo-list", children: F.items.map((W) => /* @__PURE__ */ g("li", { className: "qz-todo-row", "data-checked": W.checked, style: { paddingInlineStart: `${Math.min(W.depth, 4) * 0.8}rem` }, children: [
        /* @__PURE__ */ g("label", { className: "qz-todo-check", children: [
          /* @__PURE__ */ l(
            "input",
            {
              type: "checkbox",
              "aria-label": `Complete ${jt(W.text)}`,
              checked: W.checked,
              disabled: ce === ae(F, W) || !!ne || !!$e(Z == null ? void 0 : Z.index[String(F.workspaceId)], F) || W.markerStart === void 0,
              "aria-busy": ce === ae(F, W) || void 0,
              onChange: (de) => ze(F, W, de.target.checked)
            }
          ),
          /* @__PURE__ */ g("span", { children: [
            jt(W.text),
            W.heading && /* @__PURE__ */ g("span", { className: "qz-todo-heading", children: [
              " · ",
              W.heading
            ] })
          ] })
        ] }),
        /* @__PURE__ */ l(
          "button",
          {
            type: "button",
            title: `Open note · ${F.path}:${W.line}:${W.column}${W.heading ? ` · ${W.heading}` : ""}`,
            "aria-label": `Open note: ${jt(W.text)}`,
            onClick: () => e.onOpenNote({ workspaceId: F.workspaceId, path: F.path }),
            className: "qz-button qz-icon-button",
            "data-variant": "quiet",
            children: /* @__PURE__ */ l(te, { name: "external" })
          }
        )
      ] }, W.ordinal)) })
    ] }, `${F.workspaceId}:${F.path}`)) })
  ] }) : /* @__PURE__ */ l("p", { className: "qz-muted qz-loading", role: "status", children: "Loading folders…" });
}
/*! markdown-it 15.0.3 https://github.com/markdown-it/markdown-it @license MIT */
var Nn = Object.defineProperty, It = (e, t) => {
  let n = {};
  for (var a in e) Nn(n, a, {
    get: e[a],
    enumerable: !0
  });
  return Nn(n, Symbol.toStringTag, { value: "Module" }), n;
}, An = {};
function Ji(e) {
  let t = An[e];
  if (t) return t;
  t = An[e] = [];
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
function lt(e, t) {
  typeof t != "string" && (t = lt.defaultChars);
  let n = Ji(t);
  return e.replace(/(%[a-f0-9]{2})+/gi, function(a) {
    let r = "";
    for (let i = 0, o = a.length; i < o; i += 3) {
      let s = parseInt(a.slice(i + 1, i + 3), 16);
      if (s < 128) r += n[s];
      else {
        if ((s & 224) == 192 && i + 3 < o) {
          let c = parseInt(a.slice(i + 4, i + 6), 16);
          if ((c & 192) == 128) {
            let u = s << 6 & 1984 | c & 63;
            r += u < 128 ? "��" : String.fromCharCode(u), i += 3;
            continue;
          }
        }
        if ((s & 240) == 224 && i + 6 < o) {
          let c = parseInt(a.slice(i + 4, i + 6), 16), u = parseInt(a.slice(i + 7, i + 9), 16);
          if ((c & 192) == 128 && (u & 192) == 128) {
            let p = s << 12 & 61440 | c << 6 & 4032 | u & 63;
            r += p < 2048 || p >= 55296 && p <= 57343 ? "���" : String.fromCharCode(p), i += 6;
            continue;
          }
        }
        if ((s & 248) == 240 && i + 9 < o) {
          let c = parseInt(a.slice(i + 4, i + 6), 16), u = parseInt(a.slice(i + 7, i + 9), 16), p = parseInt(a.slice(i + 10, i + 12), 16);
          if ((c & 192) == 128 && (u & 192) == 128 && (p & 192) == 128) {
            let d = s << 18 & 1835008 | c << 12 & 258048 | u << 6 & 4032 | p & 63;
            d < 65536 || d > 1114111 ? r += "����" : (d -= 65536, r += String.fromCharCode(55296 + (d >> 10), 56320 + (d & 1023))), i += 9;
            continue;
          }
        }
        r += "�";
      }
    }
    return r;
  });
}
lt.defaultChars = ";/?:@&=+$,#", lt.componentChars = "";
var Dn = {};
function Wi(e) {
  let t = Dn[e];
  if (t) return t;
  t = Dn[e] = [];
  for (let n = 0; n < 128; n++) {
    let a = String.fromCharCode(n);
    /^[0-9a-z]$/i.test(a) ? t.push(a) : t.push("%" + ("0" + n.toString(16).toUpperCase()).slice(-2));
  }
  for (let n = 0; n < e.length; n++) t[e.charCodeAt(n)] = e[n];
  return t;
}
function je(e, t, n) {
  typeof t != "string" && (n = t, t = je.defaultChars), n === void 0 && (n = !0);
  let a = Wi(t), r = "";
  for (let i = 0, o = e.length; i < o; i++) {
    let s = e.charCodeAt(i);
    if (n && s === 37 && i + 2 < o && /^[0-9a-f]{2}$/i.test(e.slice(i + 1, i + 3))) r += e.slice(i, i + 3), i += 2;
    else if (s < 128) r += a[s];
    else if (s >= 55296 && s <= 57343) {
      if (s >= 55296 && s <= 56319 && i + 1 < o) {
        let c = e.charCodeAt(i + 1);
        if (c >= 56320 && c <= 57343) {
          r += encodeURIComponent(e[i] + e[i + 1]), i++;
          continue;
        }
      }
      r += "%EF%BF%BD";
    } else r += encodeURIComponent(e[i]);
  }
  return r;
}
je.defaultChars = ";/?:@&=+$,-_.!~*'()#", je.componentChars = "-_.!~*'()";
function sn(e) {
  let t = "";
  return t += e.protocol || "", t += e.slashes ? "//" : "", t += e.auth ? e.auth + "@" : "", e.hostname && e.hostname.indexOf(":") !== -1 ? t += "[" + e.hostname + "]" : t += e.hostname || "", t += e.port ? ":" + e.port : "", t += e.pathname || "", t += e.search || "", t += e.hash || "", t;
}
function Nt() {
  this.protocol = null, this.slashes = null, this.auth = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.pathname = null;
}
var Hi = /^([a-z0-9.+-]+:)/i, Zi = /:[0-9]*$/, Ki = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/, Sn = [
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
], Tn = [
  "/",
  "?",
  "#"
], Gi = 255, Fn = /^[+a-z0-9A-Z_-]{0,63}$/, Xi = /^([+a-z0-9A-Z_-]{0,63})(.*)$/, Mn = {
  javascript: !0,
  "javascript:": !0
}, In = {
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
function on(e, t) {
  if (e && e instanceof Nt) return e;
  let n = new Nt();
  return n.parse(e, t), n;
}
Nt.prototype.parse = function(e, t) {
  let n, a, r, i = e;
  if (i = i.trim(), !t && e.split("#").length === 1) {
    let u = Ki.exec(i);
    if (u) return this.pathname = u[1], u[2] && (this.search = u[2]), this;
  }
  let o = Hi.exec(i);
  if (o && (o = o[0], n = o.toLowerCase(), this.protocol = o, i = i.substr(o.length)), (t || o || i.match(/^\/\/[^@\/]+@[^@\/]+/)) && (r = i.substr(0, 2) === "//", r && !(o && Mn[o]) && (i = i.substr(2), this.slashes = !0)), !Mn[o] && (r || o && !In[o])) {
    let u = -1;
    for (let h = 0; h < Tn.length; h++) a = i.indexOf(Tn[h]), a !== -1 && (u === -1 || a < u) && (u = a);
    let p, d;
    d = u === -1 ? i.lastIndexOf("@") : i.lastIndexOf("@", u), d !== -1 && (p = i.slice(0, d), i = i.slice(d + 1), this.auth = p), u = -1;
    for (let h = 0; h < Sn.length; h++) a = i.indexOf(Sn[h]), a !== -1 && (u === -1 || a < u) && (u = a);
    u === -1 && (u = i.length), i[u - 1] === ":" && u--;
    let f = i.slice(0, u);
    i = i.slice(u), this.parseHost(f), this.hostname = this.hostname || "";
    let m = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
    if (!m) {
      let h = this.hostname.split(/\./);
      for (let x = 0, k = h.length; x < k; x++) {
        let v = h[x];
        if (v && !v.match(Fn)) {
          let q = "";
          for (let w = 0, _ = v.length; w < _; w++) v.charCodeAt(w) > 127 ? q += "x" : q += v[w];
          if (!q.match(Fn)) {
            let w = h.slice(0, x), _ = h.slice(x + 1), E = v.match(Xi);
            E && (w.push(E[1]), _.unshift(E[2])), _.length && (i = _.join(".") + i), this.hostname = w.join(".");
            break;
          }
        }
      }
    }
    this.hostname.length > Gi && (this.hostname = ""), m && (this.hostname = this.hostname.substr(1, this.hostname.length - 2));
  }
  let s = i.indexOf("#");
  s !== -1 && (this.hash = i.substr(s), i = i.slice(0, s));
  let c = i.indexOf("?");
  return c !== -1 && (this.search = i.substr(c), i = i.slice(0, c)), i && (this.pathname = i), In[n] && this.hostname && !this.pathname && (this.pathname = ""), this;
}, Nt.prototype.parseHost = function(e) {
  let t = Zi.exec(e);
  t && (t = t[0], t !== ":" && (this.port = t.substr(1)), e = e.substr(0, e.length - t.length)), e && (this.hostname = e);
};
var Yi = /* @__PURE__ */ It({
  decode: () => lt,
  encode: () => je,
  format: () => sn,
  parse: () => on
}), Vi = /* @__PURE__ */ It({
  Any: () => Pa,
  Cc: () => Ua,
  Cf: () => Qi,
  P: () => zn,
  S: () => Ja,
  Z: () => Wa
}), Pa = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, Ua = /[\0-\x1F\x7F-\x9F]/, Qi = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/, zn = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B4E\u1B4F\u1B5A-\u1B60\u1B7D-\u1B7F\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDD6E\uDEAD\uDED0\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9\uDFD4\uDFD5\uDFD7\uDFD8]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09\uDFE1]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDD6D-\uDD6F\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD839\uDDFF|\uD83A[\uDD5E\uDD5F]/, Ja = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C1\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2429\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E5\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD803[\uDD8E\uDD8F\uDED1-\uDED8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDC00-\uDCEF\uDCFA-\uDCFC\uDD00-\uDEB3\uDEBA-\uDED0\uDEE0-\uDEF0\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED8\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0-\uDCBB\uDCC0\uDCC1\uDCD0-\uDCD8\uDD00-\uDE57\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF-\uDEF8\uDF00-\uDF92\uDF94-\uDFEF\uDFFA]/, Wa = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/, es = [
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
function ts(e) {
  return e === 0 || e >= 55296 && e <= 57343 || e > 1114111;
}
function ns(e) {
  return ts(e) ? 65533 : e >= 128 && e <= 159 && es[e - 128] || e;
}
function as(e) {
  return e - 1 >>> 0 < 127 || e - 160 >>> 0 < 55136 ? String.fromCharCode(e) : String.fromCodePoint(ns(e));
}
var Te = /* @__PURE__ */ (() => {
  let e = /* @__PURE__ */ new Uint8Array(127), t = 0;
  for (let n = 33; n <= 126; n++) n !== 34 && n !== 36 && n !== 92 && (e[n] = t++);
  return e;
})();
function rs(e, t, n, a, r, i) {
  let o = e.length, s = i * 90, c = 0, u = () => {
    let y = Te[e.charCodeAt(c++)];
    return y < i ? y : y * 91 - s + Te[e.charCodeAt(c++)];
  }, p = n - a, d = n + r, f = new Int32Array(d);
  f.fill(-1, a, i), f.fill(-1, i + p, d);
  let m = new Int32Array(d), h = new Int32Array(d);
  function x(y, T) {
    let U = 0, B = T, Y = T + y;
    for (; B < Y; ) {
      let Z = Te[e.charCodeAt(c++)];
      if (Z < 89) U += Z, f[B++] = U;
      else if (Z === 89) {
        let ne = Te[e.charCodeAt(c++)] + 2;
        for (; ne--; ) f[B++] = ++U;
      } else {
        let ne = Te[e.charCodeAt(c++)];
        U += 89 + (ne < 90 ? ne * 91 + Te[e.charCodeAt(c++)] : Te[e.charCodeAt(c++)] * 8281 + Te[e.charCodeAt(c++)] * 91 + Te[e.charCodeAt(c++)]), f[B++] = U;
      }
    }
  }
  x(a, 0), x(p, i);
  let k = new Int32Array(r * 2), v = 0, q = 0;
  function w(y, T) {
    for (let U = 0; U < y; U++) {
      let B = T + U, Y = u(), Z = u();
      k[q * 2] = Y, k[q * 2 + 1] = Z, q += 1, m[B] = v;
      let ne = (f[Y] < 0 ? h[Y] : 1) + (f[Z] < 0 ? h[Z] : 1);
      h[B] = ne, v += ne;
    }
  }
  w(r - i + a, i + p), w(i - a, a);
  let _ = new Uint16Array(v), E = 0;
  for (let y = 0; y < q; y++) for (let T = 0; T < 2; T++) {
    let U = k[y * 2 + T], B = f[U];
    if (B < 0) {
      let Y = m[U], Z = Y + h[U];
      for (; Y < Z; ) _[E++] = _[Y++];
    } else _[E++] = B;
  }
  let b = new Uint16Array(t), M = 0;
  for (; c < o; ) {
    let y = Te[e.charCodeAt(c++)];
    y >= i && (y = y * 91 - s + Te[e.charCodeAt(c++)]);
    let T = f[y];
    if (T < 0) {
      let U = m[y], B = U + h[y];
      for (; U < B; ) b[M++] = _[U++];
    } else b[M++] = T;
  }
  return b;
}
var is = /* @__PURE__ */ rs("!}.&u%}'&}*'~!6*)%&,~!J~!J~%L~y<~!R,~~%Lu~~#GD~~#|)1#%}^%}2%+#.##%##%}&%##%'#%##&%#%#'%#&#%#&#'#%%#&#%##%#)%''%&%#%#'%#%%#%%}%%%#%#&(23#%%#&-%0%('1#(##%#'##+%'*.:1}#%#6-+(%'%%#%%%}#L'2351&('%}&/N'(0(/*-%(%%}#'+&T%7.2}#&%&#%#36/5##%&%%#&#%%#))2%%##%&&'0~!#*+&'%1~!%).'3q?&%'1~!.##%6(~!+%%%(Gw'rT~!E#<nA%#jZ~!H%(~!42##~!*31&~!G%U~#)5~#`3~!J~!Z~%]~%Y~%C~!q~!u~#kz~%#~!6'~!D~!U~!?~#T~!c%~!G#'~%7|~!G~!J~!G&~#pb~(Df}#%}*&}#%##%##%##&#-}&'#'&%#.++}%mI,#,@&(}*%}*'%&##&#%##%}&0}#.},U},%}+%}&%}#%##&}B%(}(%}+%)})%##%#&}&%##%&}<%}>%#%&}*%}(%}9%}/%})%}*%}*%}?&}&%}3%}&*#%})%#%#)}#&#-#+*%E%%'%'#%}#*V##&##I}#&&##%&%#&&Qf%%))w/0+&%#(#.%-''''++++7}>%4'',##1,#%#&%##&#'##&#*#9)%&%}#*}%,#+P(%A&%#'&##wSD',9E00#y#@}(+}&%&>~!#~!X}#*}(&&}(&}(,%}%&#+&}#&}I%#%}%)#(},'%#*}4%%#%}(''}#/##(##),%-##%%)#&}(.}&%#&}%%}*&#%},&&}&%}#%*'#%})%}D&}&%}-&}6&#&}-,%}#%})-(~+`~,=?~I9'9%~!,#%})%})%}@%}?%}(~!?~#<~#pP~#BG~#=1#%K+~#?#~%;)~#A~#mF1~#A'~'X%'~#lR~#N~'N~#r~#m#-~#i'?%#'%~#B%##%,%#~#_%#0%~#]732~,w~2+#:&#%&'0%&>%}#>##F+)#%&&#(+_}4&}-%}(&}@&}O7Fdf0@+/v4}&WU##&/0#&'('B#%}.%}'+#%}#%%&#&%#%##+#&#)#6#'#.},%}c%},%#%##%&#&%#&~#>'*-.%##%##%}#%%}%'~#)D1}#%*&~#_%%'(~#S2%'.}#~#=##*'*-%}&'%'##&&~'E%.#&~#M4}%%##&'%#~#O1##%&#'+~#<B%##%%'%+~#;#@%}#&%#&&%#(~#H1}'%'##&&~#?A}&'~#D#%32}'&&&&~#[}'(#%}'~#;C})&}%%#%~#=&%,3}%'(#%%~#^'#&&)#%'~#Y%-~#d-%'~#^%%&#&&&}#~#b~2t*&'~&(~&@~0%~e~3}%*''0})&}+~!9##-}#%-hD*)1fC#%/&/fB#40~!+#)*4~!+~!K'&:~!/*7~!.#~!H~!L':~%x&~!H#~!*~%1~!I#~!+A~#p'~!F~~#-#~,,(~.Z~!V~%;'B'mq-W~!N~%I%#&&#&}#%},%%}'%}+X#%}#&}(%}'%}<%}#%}%%'}'%}:~![)9@~%>~#UA%-%##&~!C%~!-.9:~!1~!-^2/:a~!y,D*J#-5)/4~%23,~#G~!L1~!0X3`~!2+~!!0-~&E~!W~!o,>Y&]~%cZx_&~#O*9#A#'#+I'%#)~!0B*-5A+-((F&*M#)(-7-5+'-3a5Vi~!Y~!?+[)%3),ERHm~!+:D,VG.+)?fB%%*(%)'(#&80%1'8`K8?`+'Z#&O&'H5#*9)A%%5&3))0%39+.*7#()&&*=4@**L)<'_&*+..;(#*+)./&0#3)%')-8(4ixD(&.}%,('aI:,)%,k2231T)I'#/-W7,/'Q#.'Y24+h')37</31&83##&0#),H(?'&?/1##%#&&#%''-%&&&#(&''&#.-'%#%%(,')*'&#&#'##%(%(#%('#&##%%%%('%#%#%%#%#&%##h>w+v<ayvyvcg.uuhKr}g/v|g>u9i[~>g5uI~=RvdwEg;v/g;uk!!TTSx]@RT!U!#!@VBRUU!'UTe-d0c`e&gSdicedFcrdTaqb.kYcAohdYd@a3e+d}dMdtd.aJ#bqcK`dle/e.e'dwdPdodddjbEb}ogd^ofdpduc6j?l%d{drdqc)d7bacOdQ%T#Y)X.sR[yH>6Vyv3[xwLu>vo'!*.[yBacahoj>6Rew3[xqdZa#!a&#^(X-[yG>6Vyu3[xvg3sEr|g.u/Ri9db0T#^(Xa)!-[y;>6Vylg4wKs{JwNZt3@3r=c4Z([xlg;wKt!cpq's@v7A'*a(a+!-a#[y<3Dt?3Dt'>6Vym3[xmg9rxsNJwLZt4~?r?db1T#`-!(Xa,!0[yS>6Vz%NuQs.g4wKtnJwNZtS@3r>c4Z([y%g;wKtrdga8!a(!#&T*Y-Xa#!a0<or[yc3Dtq>6Vz43[y3JwNZtf@3s!Ju}!%Dti:pm3c_%X#tjB5pkd6q!r]u?voC'*-a.a2!0a&a+[yI3DtI3Ds~3DtH>6Vyw3[xx;:s#~<5pKJwNZtE@3r~d`a)!a2T#a.(!+U.X1[yT3Dt`3Dtv>6Vz&3[y&g9rxwzcxstPu.<rAJwLZtT~?r@dZa%!a.&^*Za(/Reu[ya>6Vz23[y1g3sEr}wkg{NuQRg{ci(U#5@b`~,cg#U(2WnH5wugcRh7dX#T(Y,a'Ta!!a,[yZ<]mj>6Vz,3[y+Pv#5ReZKu+=,%!H}7ABwkaS?Rh:BcW(X#<]mrj:ubv/ARekdg%!(!a.*Ta(Y.X1!#sP>Rl*Dt6[y>>6Vyo3Wf*jOvuumvuRgRJuq*!:9<B@bX~3jVv&v@s@5Re[d/rQt{uAvo&a&a*)a2!,0Wf!3Dt0=Bs'>6Re}3[xy~<5s%JwJZt1~Gs)c;&!#2sJkNuXvzq7rxu,Re8dka4!a8(aEZ+a@Y.X1Xa)[yd=Bs(3DtP>6Vz53[y4cX#X&Re:avRe9~<5s&JwJZtQ~Gs*i^rzvdRg+Jv{%!2sbB@bX}kdga,!Za?&^*T1/!a'Dt+[y6>6Vyf3Wf%g/u;s4hGu6?Rh-JvZ,!c%#&RoX54Rivj7uyvf8RgTKvZB%*!2sGh<vu5Rgq<=C::9bb~#dZ#T&Ta6Y.X*Dt>[y93Wf)coZ(T,6VyifluvRgC@95@B@bX~/hFu34cC#T,k/unq8w8Q5RkUklwQuzunq8w8Q5Rk8d/rJu?v8w9)-&!a0a;a&aIWejg3sEr/h1s<DtDJvyZqY5aws3Jvy!&Wei~Hr1:au5@Bag>23E~5c:Z&bX};kKv?w&unuVu5Rjc;>bs)#~@:Rh.=ay<a]C;b`}Vd6s/t{uAvoaxa()!a,a7%-a#a2Dt,[yF2Wo[>6Vyt3[xuNuPRi&NuPwpi#RoWh?vf8Ri%Jv]!%Ri:KvxD!.'2WeAjZu`q9rxu,Re7woeAg-unLq(qA_/*2Wg_g3u5q^9:4E}/jTrxrzv=Wkkd~0UX#^^Xa-a1a5T&a=U1a'*aEa]!a*aPaA-adok[y54Rn>;:p3~Dp5g9rpsFNvZqjg3uJp4~<5p0Pw;5qlJwNZt*@3p1Pw:5p/Ou!5p2JvG'!6Vye=<qnJvh_[xhg3v,Rh3kOwOw-sDuev/Re^dha[a%!%!a+#Ta7)-5TaCaO!aka!a)sf[yb2>Rl!9ARiq5E}Qg=ucRkBE|oJrJ_@Wk~@Wk{JrJ_@Wk|@WkyJrJ_@Wk}@WkzJvO_[y2g-vMRmiKuYC!)&>Ri;>Ri<@3RkNc](X#@9Rk=g5vuRmhKvDB!+'=]meg3u4Rmgd)#Y'Vz3CARmfd`a+!%T'!+#Ta1Ta6TaM-sTDt9[yA9sYd'%Y#s[[xpj:ueunaXRgEjRq,v-vuqdd2'`#6Rev<32@5>:2<E}5xIo9a*X#Y(;5RePJvD_g>vyRgNj8w)v8<wggs:RgXiZt|vjx,hSq3ah!-(~@:Ro/Ou!5RhWj^v(pyw8unRhUdx-UY#^Ua.a3a70!)%UX1TaDa)'omRiRRhE[y:3Dsz=Br,>6Vyj3[xkg6ruwjcqsrPw;5r*Ku]D'Zt-@3r(~?r.i[vwv]dU1a--U#`a4(g/vsRhPOu!5RhLj:rmu9Wo!~@:wdh@g/vsRiTjXuvvNr}:RhBj^v(pyw8unRn]dz1UYa'a+^Y(!aETZalaRY.Ta?a4[yDJw1!#qLsW>6Vyrfzq-pLflpwRe|Js>%!Dt@3Dt&Jvy_[xs~HrnjMuwpsw'RecKu+D#'!t<~Grl~?rjg5u-x,gwp{ah!-(~@:Rg~Ou!5Rh'jXuvvNr}:Rh#cW#X/c;&!#2sLi[v7u7RgpJv)(!iLrxu,Re6j7v@s@5Se[e7d`aW!Za(a`T.a#!a3!&aDa-!9)Dt_=6s+3[x~~DR|h~DS6avhGun5RkZj3w)v-]mkKunB!&*]kb97R|i<ARk<c:Z(6Vy}Juh'!wziMRoS:F|vkLuauJv5vtvQRh1d='T+Y#VyO~DR|jcF#T'7R|g97R|kJv3'!ay<Rj,Jvh&!:ReXcsa6*a+#a#_aIRf9aLRf?c,Z&Rf5Rf7c.Z&Rf;Rf>cQ#%T'p-Rf8Rf=ct#%'(*!,p,Rf4p+Rf6Rf:Rf<d~'Ua%U*^UYa(!a,-!#a4YaTalaEX0a8a<Weo3Dt/3Dsx=Br93Wen~Dr;~<5p<JwNZt2@3p=Pw:5p;Ou!5r3c7&!#:p>3Ds}KvGB)_6Vyk2sM=<r7x'eovA(!hFu1ARf}cV#X&@r5j6rvwQa^Rf3c=Za'wkghJv__g;unRggA53B9=b^}%j6uduo5Jq;!(hIv%2Re`Ou4ARe_e%a#^^^Xa&!a*a2!&a6YaP!*ad!#a:aE/5Rn?[y@>6Vyp;:pE~DrY~<5pBJwNZt8@3pCh=rt3rWPw:5pAJup_[xoNuPpF9c!#'45pD5ARn)d8#X'X*3@rU72s]h>v<<sSjJpqvewOJq/(!hNw'5ReBk0s2u3w/w'5ReE5@Jq.!a+JQ!&WeU23d(#Y&RjG5]jBk!u7w&u0udARjEe#+^^^Ub#!a2/a`Z(agT1!a-a;|@TaG!aS[yV=Re~fow'RguNuPRe?bz#'>RoUWeL>:Cbb|?JwPZtVg6ruRmzJvD'!6Vz(g/vmRh~Jvy_[y(g9voRgyx*cy(#2>Ri2B9b]~9kIw9u7rluJu3Rg]dI#a%UY'@=p%CAx.gQZ&RhwwygtRm{x5g_Z'+ABqR9Woa=Bp&dV#^*Xa'!&@o{g4v]Rk;Jv{!%Rk[wkkiA5RkiwwfUB=x,fUuqC&*!>RfTg8v0RfV~ARfSd;rJsAuAv9wR'ae+/aO!a@aza/a#[yQ@Wg!2Wemg3sEr0JvB_g>uvReWg2v+Re=KupB_+[y!2AbY~-~Hr2AJwD!(h<~El>h<~El?Kun@+_:9b`}Kg-v/Ri3g;vtwyk_9]k_d=&T#*U.6qh@Ab`|K9:H|CJv[!&3Dtex'fDwC%!Rf[9WlMd[(^X,!a%Z06Vz!@WgBg=v~Rgvg,QRe@awd,#Y+jTv|Q~EfWj]uNr|~FRfXdy#Y&^Ua%!aO.!(a)Ua;=!a@aKap!a-,a!Ta]a[rSa]p?[y82sK=Bq~;:p:~<5p8Pw:5p7d'#Y'Wf(;RnRi[u4w&RgJJvG'!6Vyh=<r#ijuuv/sIKuYD'ZtG@3p9~Gr&d2#`(g<vtRgFj`u5w&rqpxRf2CJuY!+:wfnTOu!5Rg}jNs1ucv&RfwJvA!&3@q|BDcC#T,k/unq8w8Q5RkTklwQuzunq8w8Q5Rk9dga#!a'!a=#a0!:+Tb*b@aO.a4!aba8aFJv^}?!VyR~Dr<g;u%Rn.~<5p[x'e`wNZtR@3p]Pw:5pZhNvjBp.woe_g5u-r4JwF!%DtO3:ooc7&!#:p^3DtpLuGw(!+%)Dtk6Vz#2sd=<r8d'#Y([y#<x3gJt`w@!)%}MRiowzikRij=]ilxAf3,U(#B2Rf#g0v-Rm[ck{`U#]giKv3>)!&6Ri154s,KuGB_%@r68r:dJ|t`#X(9<E|u2@H|rx3gJu?w'!+'1Nu7Reg4=H~+9<wxgY95Rm]xLggZ-`(X}U2:Ri4h<uOawRmsJv__5@bb{jbV~3dka#a'a]!,#a+U=a>b6a3b%!/aKa/)!arwve^VyJ;:pR~DpTg3uJpS~<5pOPw;5qmPw:5pNOu!5pQJvG'!6Vyx=<qoJvA!{~Jup!%@qk7Rn/KvyD!}''[xz;>wkh'?Rh,x8gyt`w5D!&),(SgyccRgztJ@3pPB5p#d'(Y#<]mmifubw&RgoJvE&!82s^JvF&!8Rf,ADb]~;x=h'rNu]vK!,%'*0RnORh)4Rh*AqQg-vaRnNg;wHwkh'ba~4cE#Ta*x3gctyw@'!+%RnFRnD<4Rn@hFvK5RnCxWg[#`&a0Ua()`1Rm75Rg[c]%X#qi8Rg^NvdRj>BwzgZauwji7Rm6A4wgg]d1#&(*,.0a#Rm;Rm<Rm=Rm>Rm?Rm@RmARmBe%#^^^Xaea?aC/b+(,!a+a#!a/!>a&Ta<aKbD!2wphBRnk[yPw}hE|.=Br-3Dtm>6Vy~g6urRf.x,hPrNav!%'RnqRo%Ro#Nu;q[Pw;5r+JwNZtM@3r)d'#Y'Weh;xChL#`&RnmRnoKu}>%(!Rne~Bs-;2wjcussJv+'!aYSO}6@B<5?ba~8LrNvj!.%*ROwungw~ng~:9;Ri^>wtnig;wHRnixDh@|(UZ.x1h@|)!#:2<H|*xHn]#-UX'3Ro)z=iT}6ARns=Bwsn_wpnaRncw]aR(#UXa&Ua*a/=]iPd'#Y&Ro'WnXf{QRm2hNvj]nZd`'T~&1`{|`#9b]{}c:'!#Wl{>@=be}]?cl{{U#:5Abb}Jds#^YaF!a*b4a#a3aPa>&Tb!bH!*a_!Eau?/a&RjY<]gj>6Vz*;:pe~DrZg,QRj1JwNZtX@wihspcJvZ&!VyX9WmOJu|!|N2WmHJvh&!]ht~Bpbcn&T(!#RmQ<s7Nu;padH#X'`+WmJ@>RmKCARhnKup=!)&Wf+:RhqNuPpf9c!#'45pd5AwghpARn(Ls@w!%,)!RmP@Wfe<E|IJva!&WmNg8vsRmLd`*.`#Y'Xa!axRn*]hrA8Rhug5s@rXg8u!RmMd8#X'X*3@rV72smdI*#UY&RmICARho~GsgxVgd)Ta'U-Y&Xa!T#RnEWnA@Wffg1uDRi0hFvK5RnBxGnG&#`%owp)@wsf+bX}Ze-*1!a*^^^Ua|!#a.aq&Ya2!a>.a6!a:aO`aJDtL[y`@Wg#>6Vz12@wzoYRoZNuPRi!NuPRhzg=ucRi,@=b`{Yg=ucRi-ACJvB!&Sh[ebSh]ebi`wUuFRm4Jw2_[y0JvB!.<Ju(!&SoG}6Shd}6<Ju(!&SoH}6She}6Kur@._g5vHRieJvx!{L2G{Kx6gd'T#?Rh82Wi5cZ#X(g1w)Rm5dW-Y(Ta#!a)!#aYa=wnfE=su2>>bU{0j9udv:<svj8uQv-7RgHdE%#^'sq9sp=>Bb_{TJv`!&g/r|snj6v(us5d,#Y(56H}[978H}]Jw5!&g1rushJvB!+j;v{u5?zDhd}6}bj;v{u5?zDhe}6}ce*#`(^^^a[aea!=!a6a*aoXb1a.!aAbL!b>,b'aL!aV@Wf|2Wlg3[y/JwNZt^@3piPw:5pgJunZou3@rsJva&!Vy_g<v~Rm#JvG'!6Vz0=<r{Ju{%!:pj@WfsiXuJu3Rm:JvZ&!WfA~Bph@c4Z&Dtwax5rubx(#:awRk1@d,#Y&RfjRfid1#,Y(@Wfp2Wlrg5s@ryKu[@!,'=]ig9wlk?Rk>g5u-rqJvy'!@9RkQcH(T#=>Ri~@<wkj(Wj(KuZB*!&<7rw@9RkRcH(T#=>Ri}@<wkj)Wj)dg(Ta2Xa9X#`-!a*CARhg@@=I}d9x;c~#X%so=<sj>2@@=aybb}XjWv0Q~EfEj3vLv;<d,#Y(56H}`978H}_dgaPaFa'a/!#a3Y0a_a;a|!1(a7-[yE3[xt;:pJNvZrrg3uJrvJwNZt=@3pIh=rt3rxPw:5pGOu!5rpJvG'!6Vys=<rz@c4Z&Dt(ax5rtJvZ!&~BpH@wsfNg-vaRlNci*U#=<wei<F}a5@Jq.!a*JQ!%@qZ23d(#Y&RjH5]jCk!u7w&u0udARjFd/prq=tyvpaEa(a:.!a1aZ(@@=I}:9wpd%=<sX55w_h}@@=I{t=ay<aU@@=I}T=ay<2@@=I})?C9:9au@9Cb]}DP~=x-fAZ(2Wl1=ay<aU@@=I}>5@d##Y+jTv|vV~EfFj]uNpn~FRfGdgaK!Z2&!a8a-Tb({E!acTbM*!a(DtY[yYd'%Y#sl[y*hHvh>Re5x2c{Z}.j4uCvcawRiMd+#X+_x&d!},<5RkX;2Hzw@x,gavfB-!{CcF&T#Roe;RodwWbBg5urRgaKvHC*_6Vz+<4opieuew&Rmq@d]&Y)X,T#X0Rh}<BqP=4qS9:ReMg/ujReNJw0!/<Jui%!bd{kawwnemRelAxUa?a3#*.&UX(Ya+a/RhvRnQ<o}9Wmtd-#Y&RgSRmw9;Rmxay=Rmyg-vaRmuxEhSrNu,v-voC!%(aR.a(a7+1Ro1>Ro5CE{A9b]{@;5x#eO{:g;urRi+KrNA!%(Ro3>Ro79;Ri_Ku@>{;&!x%gX|{KunA_+g5QRj/g3u5Rj#g>uERj%wio/xRhS&!,!#^1U}wba{8>>@=be}qC@:D5ba{7Ku+A&!}x?ba}t>>@=be}se(aA^^^Uat!b0#{pa+awUazbGa#aLb9bgaWac'a5TbS=Br!d1#`%scp_Jvl!#rT>Re0JvX&!VyN=H{Fcm#U&:pY=ReaJv2&!]h0=]nUJvG'!6Vy|=<r%JrM_=]h2@Wlud'#)U'Wf'b]{i=]h/Jvh!&~BpWg=v]RnMx+ny#'Nu;pVwjnu=]nwxJnx,T#`&Reqwjnt=]nvieu9vrRjLLuYwP(#+!th@wih5pX~Gr'g5v/Rh4KunA'!-CARnP@wwiN:Rm_9x'cvw>!|l=<saKvAA!0&3@q}>w^e1bp#&Re2Re3BDx7gH#T|f5H|eKuZ>!%(:qNAH{]Jv6!+3B2B9=b^{X<5<B92:E{ZLvhwA(a;a%!igQuyRmad+#Y}m@3Rh5d8#X'X*:AqUAHzmaxwbh<aXRnVcF}RT#Nw&cj#U(BWnug/vsRntdka)(a3+.Zb7aYYan1!bVa@Xa}[y^@b[{G=H{+hFu73Rj&Pv#5ReQcK%T#sig1v{Rj'Ku+D#'!t]~Grm~?rkKuMB!01d5#`'Vy.ta3Dtu~Hroc8#'{^45s85AwZbP&!#Rn!wghxWn#KvEA!)&2RlA2RlBx:h|#(T,=]j09Wobz>x]z/@awRoTd+#Y(az]hFhCrm4d,#Y+jTv|Q~EfMj]uNr|~FRfOdCa!Xa9_X#@<plJvf!%b`{(9;Rgwc;.!#2x7cw#T|UDb]|T5Ju={(!=@E{&Jv)&!Ab`{'awJvf!~*>>@=be{#KuY>!+&4Ezyi[ugv&RjIdea+T)#UXa&T-T&a!Rh9auRmW=]kLg5vuRn+g3u4Rn-Ow6ARn,hHus5xNk?#UX(U~)/g8v0RkD~AwkkF?Ri.OuNBwkkA?Ri/d|a2`a*^UYa.!aBTZaTa'Xa;!(!2!-a#b2[yC>6Vyq3[xr2Wi?g1rusVh%s?DtF~<5rbJs;%!DtBfswKtCj[uvuSsEu3RgVx3o:u+wN'*Zt;@3rd~Grh~?rfg8w)Lq)qE&-a%!>bI|`jWv0vV~EfCjTv|vV~Ef@j]uNpn~FRfBcK#T']gWNu7x,k7q4ai(0!hHv8<RhmkMu9vrsBuev/RhlCJvB!,g<v{wchh~@:Rhji[vrv{wchi~@:RhkdS&a5UY#Ta!RgPwwiI5BwciI~@:Rh`x'iJvj'!5]iJPu8Bwch]~@:Rhach)U#h3rp]gLh@t|Ax,hTq3ah!-(~@:Ro0Ou!5RhXj^v(pyw8unRhVd|)`,^UYas!a?/a2Z'a^Ta{Tb7Ta(a#!a,Wf&9sZ3DtAadamov=Bqt3[xig8vsRm~>waiL2b`{QJv*_Ouv2qgj<v]v2BqfdR'X*X#Y-@3qr~Gqv~?p6hHv-]glPup5Lq+q?_%*b_{qF{n9b^{rOu4ARhpKvCD!+&~Bqp:5Dbb}nwoiKl&unuTuBv]v+ueunaXRf0=Jvh!0nKufu8v1w&w7q%w&uHrz:Rgnj5w,uxDJq/(!hNw'5ReCk0s2u3w/w'5ReFd>Za&!*UaA=<wkgsRnSJv^!%Refifw3vyRgOKu_B'!,<]gkiiu:w&Rh<=C@a^<B57@2F{[<B5@aW:=3away9A5aW=<B=C@a^<B57@2F{Ie-#`(^^^bCara.b8aza6!/bZ,!adTbnTbOb+aFaS!aAT9@Wf~2Wli3Dtl2@d,#Y&RfnRfmJwJZtN~GqyJva&!VyMg<v~Rm%iXuJu3Rm9Jv[_=]ih9wlkDRkCd1#`(@Wg>2Wls3cH#T(@<Rj*=>Ri|b~'#23s9h<~El.d'#Y&Dtxi^rzvdRl#d*#U%(o|B2s`hJwSaxRmDKv4B&!1:Rmdd5#`'Vx}to~Hq{x'f1v3(!BA5ba|bJv_&!Wfug1v]ReIdO+U/Y#&G}-8wze=Rh{g1v]ReHg/uQRf/by#)ibQwERl/cH#T(@<Rj+=>Ri{cNu+vlax-!(#a0qa9<Rii2;;bU{H;x<i=&X#Rk`<4wwi=C9H~8xAI(Y#<azRi@45wXI<B9;5bb~7dL(X#Xa(+!aL6Vy{g5QqOau:5au2@ay547EzbxOcU(UX-T#Ta#:Cbb|A?wjh/b_|SOw6ARgtihr}u7Rhy<d1#T)X1@@=I|~=ay<2@@=aybb}Sj3vLv;<d,#Y(56H}A978H}@dGpvs@uAu`vcw9*!aFa+ai%(b!aXa8.a?a[ozWey=sU2@G}Nch&U#Rf_WexKu+D#'!t:~Gr`~?r^j]uNr|~FRg*j^psurwJt|RmcKv)@&!)7Rkv~Br[@wxfO:Rl3co#U'6Rezj_q#vIuavjRltwzeyh@vr5JqD0!>aY?C9:9au@9Cb]}9cl#U*5;5<H||jbuus1ucv&Rfvg1v~d/pppzqFr^a--a~!aMat1(hFv;Wiz@@=Izoj5uuv-7Rix~Cw`fk2WlVcZ#X,k)u3vWs@u2]ktg;wEx'fBq(_2Wg/jTv|vV~EfoJv]!15x'hzqG!(P~EfU~CRl_j6v(us5x4i-#T(2WmZ?C2F|d>Kq<aj1!*jTqIsBv=Wl`~Cw`fi2WlWj`v0u*~>RlR=c>Z,k#u3vWs@u2]kr<c1Z+jTqIsBv=Wla~Cw`fm2WlXdmb3!a{(arZa`bkTa%TbQTa-a9+c'!aM!/[yL=Bqug.w'RifhFvyDRj.g>vgwyk^9]k^Jv3_@WfbAARkhJw2_[x|JvB_wkoIRoKwkoJRoLd'(Y#<]gm=<9<H|yd'%_X#skDtb3awwqkgNulRkgdB#^',9:p'hJwSaxRmEBwVb8@4=H|qLu+w50&!)@3qs~?pU>Awwn;;Rn=c:Z'ARn<=<qwKvC@!/&~BqqJv6!&]eVb^z^xRge'/a%+^`#Sge}6<4Rn3=]n0Pw2>Rn8Jw0!&>Rn:>Rn6cY#a7+!a&=<wkaNw~h3z_c5Z{=wjh#=]nLKv^D!&)Vyz=bW|swYb<WetcG#T(2wxa@qVx@gD#Y&b^|V5JwG&!5bb|pg/w&RgD@x=kHs=uAvn!a%%/'+RmSRh694Ro`g-vaRmRhHv-]mlxCcS#`&ba~.5cD#Ta)P~=d,#Y(56H{>978H{Dd_#{2^Y%_+qbbb{6g3sERhsbU{?dfa.,`a(Xa<!aiX#(55RiG54RiHcI#T'WiU3RiVNvdwtfcRlKNvdd,#Y&RlHRlExQgf.1*^T'X#Sgf}6Wn4=]hfPrk>Rn7Jw0!&>Rn5>Rn9Lunw?&a2!,5<oq@@wqfdRlJj5Q~=d,#Y(~ARfcOuN]fdDKw;ay(}i!547E}j?cI#T(@5bV}iCbV}hdv(^^Tb?a40,b##Tbo!a*bR!a<b|a/!aKai!aU[yK=]o^g:v>ReGJwPZtK<7Rh+h<~El,Pv#5ReR@awwxjCg,ulRjDJv6&!]j!z?aQeeg>w=Sh<eeJw;!&axEzOg,Qosc!#*:wkeJ]eJ>x'h-u(!%Ro.w~h.zPdNZ(X,Ya![x{;9ReY;wkgxRiF:x?ap#Y&RmUg<s2Rkod]+UY0TZ'!a&A9sw<=bczLNvuw{gqzNhJwSaxRmCKuLay!#&s_Rf-55b^{uJvZa!!c%#(55Ri654wmiu5RiuawLu,vp!+}^%b_}Y9;wkgxba}o>A9:=b^}zKuh=a''!3awRk3c*'!#aHRk6c+Z&Rk5Rk4Jv)&!awRjSawd9*`#0?C2@EzMj8u<uJ5RmbjQrquJu3x,k>uq@_+=ayb^|W~ARkEOuN]k@7dhzV^X/X&a-#zRzSb`zXcJzTT#2WkVKvDBzW!%FzY9;5bbzWjQrquJu3Jw3%!b`zU=ayb^zQd:#X(T-a!6Vyywxh}=b]{Jg=u1RiAdGp~qHtzv!w(wA+a+a;<!aJaYai'anasb(=azRmV:Cbb{MLq2vb!%')RjuRjrRjtRjqx3jnqCw3!%')Rk(Rk+Rk&Rk)Lq2vb!%')Rj{RjxRjzRjwLq2vb!%')RjsRjpRjfRjex3jcqCw3!%')Rk'Rk*RjkRjl9<CbbzfOu4ARhxLq2vb!%')RjyRjvRjhRjgx=joq*uKvb!%')+-Rk.Rk%Rj~Rk-Rk#Rj}x=jdq*uKvb!%')+-Rk,Rk!Rj|RjmRjjRjidAq&qKs@uAv8Aa.'*-a@a&0!aM@a5[y73Dsy3Ds|3Dt):wxgI2sHJwJZt.~Gqxwsf0ikrzt}Rl0Jvy_[xj~HqzKv_A|D!&WfP8axRoVcf,U#k(v]v+ueunaXRf1Ju}'!g8u#Ri=jQw!sCunLprq>!,')~<5qeGzq9F{W=c##%s5au:5aU3CBE|;d4#X(D!a&6Vygx(b;#(=]ed?C2F{N<capoq2r[a&!aPa9,'Pw;5s:@@=I|,55w_h|@@=IzcP~=x'fCqB_2Wl2>aU@@=I|1OuNBc1Z+jTqIsBv=Wlc~Cw`fl2WlZ~AcTa%!Z+jTqIsBv=Wlb~Cw`fh2WlYk+uNqJsBv=WlSg,u3dca3#UXaMYa)TaB-=cM|7T#<bI}l5@B932:aV2G{BOuNBJq:|M!5Ezt=<B=C@a^<B57@2F{v>cB{/T#=ay<bI{3Jv6!a.6BKq0ah&+!5E}HP~Ef{978BaU@@=Iza<7d#.Y#978BaU@@=IzH~AJq0!(@@=IzG978BaU@@=IzFe,aU*Y&^^^bvJb,b:bFad!a,c2Ta>aL.bo6!a#CbTa'T#Re{2Wlh2@G{yg6t~Ro_NvdRfticuRQRllJv3&!x&c|zs@Jw3!%RflwpfkRlpKuL;%(!Re<@G|C2GzdhIvuBwgjAg-u0RjAKQB%!(GzZ@G|5NuuRl7d='T+Y#Vy[g<v~Rm!==G|>JvA!)@wma=]m1ifuaw&RmnLs@vT'!|/+[y,g:v>ReTJw1!#qX=x!eC{bLu+wT&)ZtZauq_~Graci&U#F|89:r_Lupvq!.)&2RlG8RfaC=x!eF{_h?rpWlmd&'!#X|&]k::xJey#`'T|+<E|&2@H|%dE#(^,g;u.RiEg6vjRiC9xCkA{O|zY#g=ucRmXKs0@!&*@G|m@awRknJuh!,3d(}gY}eJvj!%Rm):Jw3!%Rm+Rm-Ls0w(&!a(a#@b[|6cZ#X'7RkxWgAOu4ARn'dH'U#Y*Vz-Wm'CARm}d]*#a%^a*T'aK!a<9bV{PC=p*Jw4!&SgxcbB5r]idw(wBRmF7xFkt#&`(Rm/Rm8E|!JuY_9:Rl5=wrgr2:bbxd@xXfB(a*#T+!.X0X1Ta/a'T&RlDRfL>RlyARl9b[z[>RfZ:RlL:RfRwlg/ARl;9;RlxKv,A/!%7s69<74=BA5ba{-8Bde#`a<XaKYa1,a'P~=wxfB2bZ}}?C972@@=I}r8@55B9;5bb}G978B2@@=aybb}3j3vLv;<Jw3&!>Rfk=ayb^}4~Ad1#`*@@=aybb{w2@>==<bbz]dx+UY#^UaF!a9!bB'Ya1.!ajXa#%olRhD[y=3Dt#Ov5BrHKuMB%!(Rf^Wep~HrJwkiQjKr|~FRg)Ku+D#'!t5~GrF~?rDdV)UY,Z/_7RkuG{<~BrBg,rlsO:235B@bX}|d?a1!#`(6Vyn5@d##Y+jTv|vV~EfIj]uNpn~FRfH7Lq2vb1!a9-978BaU@@=Iz9978BbU}#~AJq0!(@@=Iz8978BaU@@=Iz7~AJQ|}!978BbU}!JvkaK!AdUa21-U#`a+(g/vsRn~Ou!5RPj:rmu9WhOjXuvvNr}:RhAj^v(pyw8unRn[kPr}p|u7vwv]RiSBd;pppzq@qHQa?(b.!a.a`@.|xa(hFv;Wiyj5uuv-7Riw~Cw`fg2WlU978BbU|wOuNBJqG!(P~EfD~CRlQcZ#X,k)u3vWs@u2]ksg;wEx'f@q1_2Wg.j]uNpn~FRfqJv]!15x'h{qG!(@@=IzK~CRl^j6v(us5x4i,#T(2WmY?C2F{1>Kq<aj1!*jTqIsBv=Wld~Cw`fj2Wl[j`v0u*~>RlT=c>Z,k#u3vWs@u2]kq<c1Z+jTqIsBv=Wle~Cw`fn2Wl]dn1#c(a(b^a2!b/bAT(bj!aDa7bu,a_a{c0!2T0g:v>ReD2@G{42@G{5~DpM~<5rc=Bx6i>{RT#RnI@zCx]y]z:2Jv[!zr5Awyk]9]k]dD(Y+X#6Vz.g=wKtgwhaCwgmTWj2Lu,w%_+/[y-B;b^xeg3u3Rj-2@bX{*KrJ<!+'@Wg(g?QRlC@Jv`!%b[zIwsfII}8JQ_@w|kW|=Jv(%!AqcOuNBJvEzh!bYzjLs@wP#(0!oy@>RkdJwMZtc3Dtd@BcG#T'9bWxg2@2Fznd*#Y+;2x'c}w<zizixNgwa#Z'U+!/!a'!a+w~g~z6wcn{Rn}wcnzRn|5Rh%=]nJg5vuRmvNvdRlvcprJu}w*az*a#!%.a.'Bot9qT]kj@Wg'ay2Gzv@Jv`!%b[zEwsfHI}1;ck#Ux`<Cbbx_Lu+w!a&0*!wko*wwo,So,}6Juqxf!E}PigQuyRm`d3(`#8>Rn%:A5B;bZ~%KvhCa!a2!x>k7#Uxb@b{#xaRk7Jw0!)>wwhlShl}6>wwhmShm}6CJvB!.x'hhvj{!!5Bwkhhbaz}x'hivjz~!5Bwkhibaz|xEhTrNu,v-vpD!a%&/)a3a.,%Ro2t[CE{)@3re9b]{%wjo09:rgc:Z&Ro6=<riifuaw&RmoKrNA!%(Ro4>Ro89;Ri`dSaL'UYzxZb)7Rka3xRhT&!,!#^1U}vbaz{>>@=be}yC@:D5bazzKu+A&!}{?ba}y>>@=be}wxBh[t`u~vJvr!%a!a()a,a0a4RoC=]o;Ju(!%RoGRhdwjh`=]oAg>w#Ro?g5vuRo=NvdRl|Ku]C.!&;RoEJvB!%RoORoMBx'h[v+_?w~h`}~5?w~hd~!xKh]oiptu-utv.vp!#%&a30a@a'a+(a/aOp(o~p!RoDJu(!%RoHRhewjha=]oBNvdRl}g>w#Ro@g5vuRo>c[#X']o<CauRoRAd-#Y':RkpauRoQKu]C.!&;RoFJvB!%RoNRoPBx'h]v+_?w~ha}t5?w~he}ue!/UbhYacXaW^Tc&a;b:a-c/#b&aja1(!cL+!bKbt!bmcRc9aIc?8[yW3Dtt94Rg`Jv}!&SiRMzBhEebShEMNuPRe>x7gL#TzuwjirRipc<Z&>on;>z=h-MSh.Mwqczx'a7vj&!>Re4@=ResJt__NuPRi*NuPRi)j]uNr|~FRfzKrJ>_+@Wfy@Wf]2WocKrJ<!+'@Wg%g/QRl@@Jv`!&awRl<wsfFIzgLu(w*!.*&ShBMwvhIRhI9;RhNx1hK'!#Sn]Mx1hK~0!#:2<H~7cNu+w7D*'1ZtW>Rn1~?rOc:Z&Rn2=<rQ<7wjh&=BSnLMc]#X(6Vz)w[b=a!U#9wzgMc3#&(RgMRitRis<x,gKt`ax!&+SioM=BSilMc3#&(RgKRinRimKurB,!&SiQMzBhDebShDM6BJQ!(P~Efx978B2@@=I}WLrJw!!,a*&@G}O@9wkibRid@@x'fKwC!&SlDMSfLMjUv~Q~EfKKv3@a+!(hFv-]mpx/hYZ(C5RiWz<o/MwkhY?So/M@x,gbvfB*&!SgEM:SoeeehFu3:Rgbda(,^TZa)X/7Sg[eb:2RgI~BrMC@wgkc:wwkcRerx3h(uUvK!&*,SnOM4Sh*MArRg;wHRh(x=h;rJvPwI!a4',a'0@Wg&=BSh/Mg>w=Rh=g3w*wwgGRgGcW(X#;Sg}M2Gzk@Jv`!&awRl=wsfGIz`dKZ*T'Y-:RhR7RhQg5u-p`j6v(us5d,#Y+~Awkia?RicOuNBwkibba}Ld6p~tyu_vbAa'a+!a/'a3aEa8a!>Sh,ebJv{!&Sh@ebSaReb9;SgwebNuPRi(NvdRl)NuPRi'hHu^<Rm^Jvv_@Wl(g;u1Si/ebKu'B&!*Sh?eb@Wl'z@aPeb95Si.ebcpputyvjB)!,&a+0a%ShAMWeK@G}C@WfJ9;RhMwvhH9w{ia}ix,hJvRA1(!zAn[MRhHx1hJ~*!#hFv(BSn[MBJQ!(@@=I~'978B2@@=I}2db.Ua<'X}+T#a0XaG2G}E;wkg|wuh!Rh!x,hZu,@)!&So0MVy)C5RiXACJvB!&5RiY5RiZg8w)cG}*T#2@bU}=KsA>(!a.3wkhZba~(x,h^u(A!&(SoCMRhb5Bz=h[eb?w~hb~6x,h_u(A!&(SoDMRhc5Bz=h]eb?w~hc~6e)aA1T#T,^^^c-bMb&blcPaP(a/!0!bA=b5c@a(!bfbrc#2afwmhARnjwchORnp2Wlf3DtsNvdRl-2@wpa<]m0bx(#:awRk2@Jw3!%RfhwpfgRlnKQB%!(G{V@G|'NuuRl6d='T+Y#VyUg<v~Rl~==G|<Jv+'!aYShC}6@B<5?ba~8@Jw3'!g2QRljhLrpWlOd+#Y'g.w'rIg>w*wgj@g-u0Rj@Lu+wT&)ZtUauq]~GrGci&U#F|39:rELrNvj!.%*RhCwunfw~nf~:9;Ri]>wtnhg;wHRnhx3hDs@v~!/+'@Wfr@9RkSNu&Rlo=@<5GzoKs0@_+@Wl+@awRkmJuh!-3d(}pY#qWJvj!%Rm(:Jw3!%Rm,Rm*de&!1U-U#`)Re;@G|.@9Ri82@wjfvRlq=@<5GzpLvOvr!).&2RlF8Rf`C=x!eE{.Jw3_g2QRlkhLrpWlPde(!#U{s,UXa*Ta'[y'g:v>ReS;x0PZ&RnlRnn~HrKJw1}f!=x!eB|2w]aP(#Xa&a*Ta.Ua2a7=]iOd'#Y&Ro&WnWg;u.RiDg6vjRiBNvdRlzhNvj]nYJuW_2Wm3x)kFze{9d])!a.!,Y01!#&aC!a3RndC=ox~BrC@2b^{pg,rlse7x'ksuq!%Rm.E{xidw(wBRmGx9o+)X#wwo-So-}69:Rl4@xSf@a#XZ'X)X,Ta(/ARl8b[xc>RfY:RlI:RfQwlg.ARl:9;Rlwdn'#^XafaQa1X1TaHTa)@b[{zcZ#X'7RkwWg@Ou4ARn&x)kG#{,g7u/RkGdH'U#Y*Vz'Wm&CARm|bx#(A]gUbUzJj9Q~=d,#Y(56H}l978H{U7d,0#U*2>ABb_xZ978BbU{e~AJQ{g!978BbU{hxMh?ad{oUYZ.x1h?{l!#:2<H{mx3n[t{vl!,&a%3Ro(z=iS}6ARnr=Bwsn^wvn`Rnbd`*T}B0!#^X'BG{c9b]{a>>@=be}F?JvS!&BG{d7BG}(Bde#`a1X,Ya@!a'P~=wxf@2bZ}I56B2@@=aybb}08@55B9;5bb}<j3vLv;<Jw3&!>Rfg=ayb^}&OuNBKuLA!)a!P~=x#fD{f2@>==<bbzl?C972@@=Ix^d6rSu,v7w*C(0a)a6#B+a%!sQ[y?3Dt%3[xn~<5rLOu!5p@Ku+D#'!t7~GrP~?rNKvlaya7'!h+v-5qMg=t|cd,U#5AAaa5Abb{S@52B5@a[@52B5Gx[iXueu;d<#`a(!/549C;ag>23ExY5@Dah89b^~689Jv)!~2b[~1Lv'w(%*!a#bX|aPrmawRe]keu7uhv-q6rxu,q`xTo]/a5aU!bNaDXbi!b-!ao!b<bwA!#5@B932:aV2G|:d-)Y#hJrL>RhG<7@C5<H|_=Cau:5aj5@B932:bJ|ng>vIbs)#?C2F|9jPv0w.vISh-MKvUaz(.!9ABbb|[5;5<H|Eg>unwfh;9:4E|YjQsBt|vjx'hYq3!(?C2F|J:2<BaY?C2F|GOu!5x,g|p{ah!-(?C2F|c9:4E|OjXuvvNr}:Rh&i[w*t|cd+U#jJvsu)vsSn~Mkfrmu9p}u7vwv]So!McW#Xa!ax5@A5aY:5;5<H|>kJv~vYrquJu3x4ib#T)2@SmZM?C2F|Bj:rmu9@xPhI(a*a#U#`a3-5Abb|L~@:RhK9:4E|0@52B5G|#C::aY?C2F|-:2<BaY?C2F|.5Jvk!a)javYrquJu3x4ia#T)2@SmYM?C2F|HAxPhH(!a#U#`a*-5Abb|4~@:RhJ9:4E|R@52B5G|F:2<BaY?C2F|Sc^#Xa2j=Qq5CJvB!-g<v{z;hhM?C2F|Zi[vrv{z;hiM?C2F|XKsA>!a)-g<v{z;h[eb?C2F|]i[vrv{z;h]eb?C2F|^iZu.vix,hZq3ah!.(?C2F|QOu!5ShXM:2<BaY?C2F|P", 13494, 2713, 49, 25, 61), be;
(function(e) {
  e[e.VALUE_LENGTH = 49152] = "VALUE_LENGTH", e[e.FLAG13 = 8192] = "FLAG13", e[e.BRANCH_LENGTH = 8064] = "BRANCH_LENGTH", e[e.JUMP_TABLE = 127] = "JUMP_TABLE", e[e.VALUE_MASK = 8191] = "VALUE_MASK";
})(be || (be = {}));
function pt(e) {
  "@babel/helpers - typeof";
  return pt = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, pt(e);
}
function ss(e, t) {
  if (pt(e) != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var a = n.call(e, t);
    if (pt(a) != "object") return a;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function os(e) {
  var t = ss(e, "string");
  return pt(t) == "symbol" ? t : t + "";
}
function O(e, t, n) {
  return (t = os(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
var Re;
(function(e) {
  e[e.AMP = 38] = "AMP", e[e.NUM = 35] = "NUM", e[e.SEMI = 59] = "SEMI", e[e.EQUALS = 61] = "EQUALS", e[e.ZERO = 48] = "ZERO", e[e.NINE = 57] = "NINE", e[e.LOWER_A = 97] = "LOWER_A", e[e.LOWER_X = 120] = "LOWER_X";
})(Re || (Re = {}));
var At = 32, Ha = 21, ls = 2097151, ln = 2047, Za = 0;
function cs(e) {
  let t = e >>> Ha;
  return t === ln ? Za : t;
}
function us(e) {
  return e - Re.ZERO >>> 0 <= 9;
}
function ds(e) {
  return (e | At) - Re.LOWER_A >>> 0 <= 5;
}
function hs(e) {
  return (e | At) - Re.LOWER_A >>> 0 <= 25;
}
var On;
(function(e) {
  e[e.EntityStart = 0] = "EntityStart", e[e.NumericStart = 1] = "NumericStart", e[e.NumericDecimal = 2] = "NumericDecimal", e[e.NumericHex = 3] = "NumericHex", e[e.NamedEntity = 4] = "NamedEntity";
})(On || (On = {}));
var Bn;
(function(e) {
  e[e.Legacy = 0] = "Legacy", e[e.Strict = 1] = "Strict", e[e.Attribute = 2] = "Attribute";
})(Bn || (Bn = {}));
function ps(e, t, n, a) {
  let r = (t & be.BRANCH_LENGTH) >> 7, i = t & be.JUMP_TABLE;
  if (i) {
    if (r === 0) return a === i ? n : -1;
    let c = a - i;
    if (c >>> 0 >= r) return -1;
    let u = e[n + c];
    return u === 0 ? -1 : n + r + u - 1 & 65535;
  }
  if (r === 0) return -1;
  let o = r + 1 >> 1, s = n + o + r;
  for (let c = 0; c < r; c++) {
    let u = e[n + (c >> 1)] >> ((c & 1) << 3) & 255;
    if (u === a) return s + e[n + o + c] & 65535;
    if (u > a) return -1;
  }
  return -1;
}
function Ln(e, t, n) {
  return n === 1 ? String.fromCharCode(e[t] & be.VALUE_MASK) : n === 2 ? String.fromCharCode(e[t + 1]) : String.fromCharCode(e[t + 1], e[t + 2]);
}
function fs(e, t, n) {
  let a = t + 1, r = 0, i = a;
  if (a < n && (e.charCodeAt(a) | At) === Re.LOWER_X) for (a += 1, i = a; a < n; ) {
    let s = e.charCodeAt(a);
    if (us(s)) r = r * 16 + (s - Re.ZERO);
    else if (ds(s)) r = r * 16 + ((s | At) - Re.LOWER_A + 10);
    else break;
    a += 1;
  }
  else for (; a < n; ) {
    let s = e.charCodeAt(a) - Re.ZERO;
    if (s >>> 0 > 9) break;
    r = r * 10 + s, a += 1;
  }
  if (a === i) return 0;
  a < n && e.charCodeAt(a) === Re.SEMI && (a += 1), r > 1114111 && (r = 1114112);
  let o = a - t;
  return o >= ln && (Za = o, o = ln), o << Ha | r;
}
function gs(e, t, n) {
  let a = is, r = e.indexOf("&");
  if (r < 0) return e;
  let i = e.length, o = 0, s = "", c = a[0], u = c & be.JUMP_TABLE, p = (c & be.BRANCH_LENGTH) >> 7;
  do {
    let d = r + 1, f = e.charCodeAt(d), m, h;
    if (f === Re.NUM) {
      let x = fs(e, d, i);
      m = cs(x), m > 0 && e.charCodeAt(d + m - 1) !== Re.SEMI && (m = 0), h = m === 0 ? "" : as(x & ls);
    } else if (hs(f)) {
      m = 0, h = "";
      let x = f - u, k;
      if (x >>> 0 < p) {
        let E = a[1 + x];
        k = E === 0 ? -1 : p + E & 65535;
      } else k = -1;
      let v = 0, q = 0, w = k < 0 ? 0 : a[k], _ = d + 1;
      e: for (; _ < i; ) {
        for (; !(w & (be.VALUE_LENGTH | be.FLAG13)) && w & be.JUMP_TABLE; ) {
          let y = w & be.JUMP_TABLE, T = (w & be.BRANCH_LENGTH) >> 7;
          if (T === 0) {
            if (e.charCodeAt(_) !== y) break e;
            k += 1;
          } else {
            let U = e.charCodeAt(_) - y;
            if (U >>> 0 >= T) break e;
            let B = a[k + 1 + U];
            if (B === 0) break e;
            k = k + T + B & 65535;
          }
          if (w = a[k], _ += 1, _ >= i) break e;
        }
        if ((w & (be.VALUE_LENGTH | be.FLAG13)) === be.FLAG13) {
          let y = (w & be.BRANCH_LENGTH) >> 7;
          if (e.charCodeAt(_) !== (w & be.JUMP_TABLE)) break;
          _ += 1;
          let T = y - 1, U = k + 1, B = 0;
          for (; B + 1 < T; B += 2) {
            let Y = a[U];
            if (e.charCodeAt(_) !== (Y & 255) || (_ += 1, e.charCodeAt(_) !== (Y >> 8 & 255))) break e;
            _ += 1, U += 1;
          }
          if (B < T) {
            if (e.charCodeAt(_) !== (a[U] & 255)) break;
            _ += 1;
          }
          k += 1 + (y >> 1), w = a[k];
          continue;
        }
        let E = w >>> 14, b = e.charCodeAt(_);
        if (E !== 0) {
          if (b === Re.SEMI) {
            m = _ - d + 1, h = E === 1 ? String.fromCharCode(w & be.VALUE_MASK) : Ln(a, k, E);
            break;
          }
          if (E === 1) break;
        }
        let M = ps(a, w, k + (E || 1), b);
        if (M < 0) break;
        k = M, w = a[k], _ += 1;
      }
      h === "" && m > 0 && (h = Ln(a, v, q));
    } else m = 0, h = "";
    m === 0 || n ? r = d : (o < r && (s += e.slice(o, r)), s += h, r = o = d + m), e.charCodeAt(r) !== Re.AMP && (r = e.indexOf("&", r));
  } while (r >= 0);
  return s + e.slice(o);
}
function Ka(e) {
  return gs(e, !0, !1);
}
var ms = /* @__PURE__ */ It({
  arrayReplaceAt: () => bs,
  asciiTrim: () => Bt,
  callable: () => Ga,
  escapeHtml: () => tt,
  escapeRE: () => Rs,
  fromCodePoint: () => ft,
  isMdAsciiPunct: () => bt,
  isPunctChar: () => Ya,
  isPunctCharCode: () => mt,
  isSpace: () => fe,
  isValidEntityCode: () => kn,
  isWhiteSpace: () => gt,
  lib: () => Cs,
  normalizeReference: () => Ot,
  unescapeAll: () => ct,
  unescapeMd: () => xs
});
function Ga(e) {
  let t = function(...n) {
    return Reflect.construct(e, n, new.target && new.target !== t ? new.target : e);
  };
  return Object.defineProperty(t, "name", { value: e.name }), Object.setPrototypeOf(t, e), t.prototype = e.prototype, t;
}
function bs(e, t, n) {
  return [].concat(e.slice(0, t), n, e.slice(t + 1));
}
function kn(e) {
  return !(e >= 55296 && e <= 57343 || e >= 64976 && e <= 65007 || (e & 65535) == 65535 || (e & 65535) == 65534 || e >= 0 && e <= 8 || e === 11 || e >= 14 && e <= 31 || e >= 127 && e <= 159 || e > 1114111);
}
function ft(e) {
  if (e > 65535) {
    e -= 65536;
    let t = 55296 + (e >> 10), n = 56320 + (e & 1023);
    return String.fromCharCode(t, n);
  }
  return String.fromCharCode(e);
}
var Xa = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, vs = RegExp(`${Xa.source}|&([a-z#][a-z0-9]{1,31});`, "gi"), zs = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function ks(e, t) {
  if (t.charCodeAt(0) === 35 && zs.test(t)) {
    let a = t[1].toLowerCase() === "x" ? parseInt(t.slice(2), 16) : parseInt(t.slice(1), 10);
    return kn(a) ? ft(a) : e;
  }
  let n = Ka(e);
  return n === e ? e : n;
}
function xs(e) {
  return e.indexOf("\\") < 0 ? e : e.replace(Xa, "$1");
}
function ct(e) {
  return e.indexOf("\\") < 0 && e.indexOf("&") < 0 ? e : e.replace(vs, function(t, n, a) {
    return n || ks(t, a);
  });
}
var ws = /[&<>"]/, qs = /[&<>"]/g, _s = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
};
function ys(e) {
  return _s[e];
}
function tt(e) {
  return ws.test(e) ? e.replace(qs, ys) : e;
}
var Es = /[.?*+^$[\]\\(){}|-]/g;
function Rs(e) {
  return e.replace(Es, "\\$&");
}
function fe(e) {
  switch (e) {
    case 9:
    case 32:
      return !0;
  }
  return !1;
}
function gt(e) {
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
function Ya(e) {
  return zn.test(e) || Ja.test(e);
}
function mt(e) {
  return Ya(ft(e));
}
function bt(e) {
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
function Ot(e) {
  return e = e.trim().replace(/\s+/g, " "), e.toLowerCase().toUpperCase();
}
function $n(e) {
  return e === 32 || e === 9 || e === 10 || e === 13;
}
function Bt(e) {
  let t = 0;
  for (; t < e.length && $n(e.charCodeAt(t)); t++) ;
  let n = e.length - 1;
  for (; n >= t && $n(e.charCodeAt(n)); n--) ;
  return e.slice(t, n + 1);
}
var Cs = {
  mdurl: Yi,
  ucmicro: Vi
};
function Ns(e, t, n) {
  let a, r, i, o, s = e.posMax, c = e.pos;
  for (e.pos = t + 1, a = 1; e.pos < s; ) {
    if (i = e.src.charCodeAt(e.pos), i === 93 && (a--, a === 0)) {
      r = !0;
      break;
    }
    if (o = e.pos, e.md.inline.skipToken(e), i === 91) {
      if (o === e.pos - 1) a++;
      else if (n) return e.pos = c, -1;
    }
  }
  let u = -1;
  return r && (u = e.pos), e.pos = c, u;
}
function As(e, t, n) {
  let a, r = t, i = {
    ok: !1,
    pos: 0,
    str: ""
  };
  if (e.charCodeAt(r) === 60) {
    for (r++; r < n; ) {
      if (a = e.charCodeAt(r), a === 10 || a === 60) return i;
      if (a === 62) return i.pos = r + 1, i.str = ct(e.slice(t + 1, r)), i.ok = !0, i;
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
  return t === r || o !== 0 || (i.str = ct(e.slice(t, r)), i.pos = r, i.ok = !0), i;
}
function Ds(e, t, n, a) {
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
    if (r = e.charCodeAt(i), r === o.marker) return o.pos = i + 1, o.str += ct(e.slice(t, i)), o.ok = !0, o;
    if (r === 40 && o.marker === 41) return o;
    r === 92 && i + 1 < n && i++, i++;
  }
  return o.can_continue = !0, o.str += ct(e.slice(t, i)), o;
}
var Ss = /* @__PURE__ */ It({
  parseLinkDestination: () => As,
  parseLinkLabel: () => Ns,
  parseLinkTitle: () => Ds
}), nt = class {
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
}, vt = class {
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
}, Me = {};
Me.code_inline = function(e, t, n, a, r) {
  let i = e[t];
  return `<code${r.renderAttrs(i)}>${tt(i.content)}</code>`;
}, Me.code_block = function(e, t, n, a, r) {
  let i = e[t];
  return `<pre${r.renderAttrs(i)}><code>${tt(e[t].content)}</code></pre>
`;
}, Me.fence = function(e, t, n, a, r) {
  let i = e[t], o = i.info ? ct(i.info).trim() : "", s = "", c = "";
  if (o) {
    let p = o.split(/(\s+)/g);
    s = p[0], c = p.slice(2).join("");
  }
  let u;
  if (u = n.highlight && n.highlight(i.content, s, c) || tt(i.content), u.indexOf("<pre") === 0) return u + `
`;
  if (o) {
    let p = i.attrIndex("class"), d = i.attrs ? i.attrs.slice() : [];
    p < 0 ? d.push(["class", `${n.langPrefix}${s}`]) : (d[p] = [d[p][0], d[p][1]], d[p][1] += ` ${n.langPrefix}${s}`);
    let f = { attrs: d };
    return `<pre><code${r.renderAttrs(f)}>${u}</code></pre>
`;
  }
  return `<pre><code${r.renderAttrs(i)}>${u}</code></pre>
`;
}, Me.image = function(e, t, n, a, r) {
  let i = e[t];
  return i.attrs[i.attrIndex("alt")][1] = r.renderInlineAsText(i.children, n, a), r.renderToken(e, t, n);
}, Me.hardbreak = function(e, t, n) {
  return n.xhtmlOut ? `<br />
` : `<br>
`;
}, Me.softbreak = function(e, t, n) {
  return n.breaks ? n.xhtmlOut ? `<br />
` : `<br>
` : `
`;
}, Me.text = function(e, t) {
  return tt(e[t].content);
}, Me.html_block = function(e, t) {
  return e[t].content;
}, Me.html_inline = function(e, t) {
  return e[t].content;
};
var Va = class {
  constructor() {
    O(this, "rules", Object.assign({}, Me));
  }
  renderAttrs(e) {
    let t, n, a;
    if (!e.attrs) return "";
    for (a = "", t = 0, n = e.attrs.length; t < n; t++) a += ` ${tt(e.attrs[t][0])}="${tt(String(e.attrs[t][1]))}"`;
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
        let c = e[s];
        (c.type === "inline" || c.hidden || c.nesting === -1 && c.tag === a.tag) && (o = !1);
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
}, Qa = class {
  constructor(e, t, n) {
    O(this, "tokens", []), O(this, "inlineMode", !1), O(this, "Token", nt), this.src = e, this.env = n, this.md = t;
  }
}, Ts = /\r\n?/g, Fs = /\0/g;
function Ms(e) {
  let t;
  t = e.src.replace(Ts, `
`), t = t.replace(Fs, "�"), e.src = t;
}
function Is(e) {
  let t;
  e.inlineMode ? (t = new e.Token("inline", "", 0), t.content = e.src, t.map = [0, 1], t.children = [], e.tokens.push(t)) : e.md.block.parse(e.src, e.md, e.env, e.tokens);
}
function Os(e) {
  let t = e.tokens, n = 0;
  for (let a = 0; a < t.length; a++) t[a].type !== "reference_definition" && (a !== n && (t[n] = t[a]), n++);
  t.length !== n && (t.length = n);
}
function Bs(e) {
  let t = e.tokens;
  for (let n = 0, a = t.length; n < a; n++) {
    let r = t[n];
    r.type === "inline" && e.md.inline.parse(r.content, e.md, e.env, r.children);
  }
}
function Ls(e) {
  return /^<a[>\s]/i.test(e);
}
function $s(e) {
  return /^<\/a\s*>/i.test(e);
}
function js(e) {
  let t = e.tokens;
  if (e.md.options.linkify) for (let n = 0, a = t.length; n < a; n++) {
    if (t[n].type !== "inline" || !e.md.linkify.test(t[n].content)) continue;
    let r = t[n].children, i = [], o = 0;
    for (let s = r.length - 1; s >= 0; s--) {
      let c = r[s];
      if (c.type === "link_close") for (s--; r[s].level !== c.level && r[s].type !== "link_open"; ) s--;
      else if (c.type === "html_inline" && (Ls(c.content) && o > 0 && o--, $s(c.content) && o++), !(o > 0) && c.type === "text" && e.md.linkify.test(c.content)) {
        let u = c.content, p = e.md.linkify.match(u), d = [], f = c.level, m = 0;
        p.length > 0 && p[0].index === 0 && s > 0 && r[s - 1].type === "text_special" && (p = p.slice(1));
        for (let h = 0; h < p.length; h++) {
          let x = p[h].url, k = e.md.normalizeLink(x);
          if (!e.md.validateLink(k)) continue;
          let v = p[h].text;
          v = p[h].schema ? p[h].schema === "mailto:" && !/^mailto:/i.test(v) ? e.md.normalizeLinkText(`mailto:${v}`).replace(/^mailto:/, "") : e.md.normalizeLinkText(v) : e.md.normalizeLinkText(`http://${v}`).replace(/^http:\/\//, "");
          let q = p[h].index;
          if (q > m) {
            let b = new e.Token("text", "", 0);
            b.content = u.slice(m, q), b.level = f, d.push(b);
          }
          let w = new e.Token("link_open", "a", 1);
          w.attrs = [["href", k]], w.level = f++, w.markup = "linkify", w.info = "auto", d.push(w);
          let _ = new e.Token("text", "", 0);
          _.content = v, _.level = f, d.push(_);
          let E = new e.Token("link_close", "a", -1);
          E.level = --f, E.markup = "linkify", E.info = "auto", d.push(E), m = p[h].lastIndex;
        }
        if (m < u.length) {
          let h = new e.Token("text", "", 0);
          h.content = u.slice(m), h.level = f, d.push(h);
        }
        i.push({
          index: s,
          nodes: d
        });
      }
    }
    if (i.length > 0) {
      let s = r.length;
      for (let d of i) s += d.nodes.length - 1;
      let c = Array(s), u = 0, p = 0;
      i.reverse();
      for (let d = 0; d < r.length; d++) {
        let f = i[u];
        if ((f == null ? void 0 : f.index) === d) {
          for (let m of f.nodes) c[p++] = m;
          u++;
        } else c[p++] = r[d];
      }
      t[n].children = c;
    }
  }
}
var er = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/, Ps = /\((c|tm|r)\)/i, Us = /\((c|tm|r)\)/gi, Js = {
  c: "©",
  r: "®",
  tm: "™"
};
function Ws(e, t) {
  return Js[t.toLowerCase()];
}
function Hs(e) {
  let t = 0;
  for (let n = e.length - 1; n >= 0; n--) {
    let a = e[n];
    a.type === "text" && !t && (a.content = a.content.replace(Us, Ws)), a.type === "link_open" && a.info === "auto" && t--, a.type === "link_close" && a.info === "auto" && t++;
  }
}
function Zs(e) {
  let t = 0;
  for (let n = e.length - 1; n >= 0; n--) {
    let a = e[n];
    a.type === "text" && !t && er.test(a.content) && (a.content = a.content.replace(/\+-/g, "±").replace(/\.{2,}/g, "…").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/gm, "$1—").replace(/(^|\s)--(?=\s|$)/gm, "$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/gm, "$1–")), a.type === "link_open" && a.info === "auto" && t--, a.type === "link_close" && a.info === "auto" && t++;
  }
}
function Ks(e) {
  let t;
  if (e.md.options.typographer) for (t = e.tokens.length - 1; t >= 0; t--) e.tokens[t].type === "inline" && (Ps.test(e.tokens[t].content) && Hs(e.tokens[t].children), er.test(e.tokens[t].content) && Zs(e.tokens[t].children));
}
var Gs = /['"]/, jn = /['"]/g, Pn = "’", Xs = 1e3;
function Un(e, t, n) {
  for (; e.length > n; ) {
    let a = e.pop();
    a.isSingleQuote ? t.single = a.prevSameQuoteIdx : t.double = a.prevSameQuoteIdx;
  }
}
function qt(e, t, n, a) {
  e[t] || (e[t] = []), e[t].push({
    pos: n,
    ch: a
  });
}
function Ys(e, t) {
  let n = "", a = 0;
  t.sort((r, i) => r.pos - i.pos);
  for (let r = 0; r < t.length; r++) {
    let i = t[r];
    n += e.slice(a, i.pos) + i.ch, a = i.pos + 1;
  }
  return n + e.slice(a);
}
function Vs(e, t) {
  let n, a = [], r = {
    single: -1,
    double: -1
  }, i = {};
  for (let o = 0; o < e.length; o++) {
    let s = e[o], c = e[o].level;
    for (n = a.length - 1; n >= 0 && !(a[n].level <= c); n--) ;
    if (Un(a, r, n + 1), s.type !== "text") continue;
    let u = s.content, p = 0, d = u.length;
    e: for (; p < d; ) {
      jn.lastIndex = p;
      let f = jn.exec(u);
      if (!f) break;
      let m = !0, h = !0;
      p = f.index + 1;
      let x = f[0] === "'", k = 32;
      if (f.index - 1 >= 0) k = u.charCodeAt(f.index - 1);
      else for (n = o - 1; n >= 0 && e[n].type !== "softbreak" && e[n].type !== "hardbreak"; n--) if (e[n].content) {
        k = e[n].content.charCodeAt(e[n].content.length - 1);
        break;
      }
      let v = 32;
      if (p < d) v = u.charCodeAt(p);
      else for (n = o + 1; n < e.length && e[n].type !== "softbreak" && e[n].type !== "hardbreak"; n++) if (e[n].content) {
        v = e[n].content.charCodeAt(0);
        break;
      }
      let q = bt(k) || mt(k), w = bt(v) || mt(v), _ = gt(k), E = gt(v);
      if (E ? m = !1 : w && (_ || q || (m = !1)), _ ? h = !1 : q && (E || w || (h = !1)), v === 34 && f[0] === '"' && k >= 48 && k <= 57 && (h = m = !1), m && h && (m = q, h = w), !m && !h) x && qt(i, o, f.index, Pn);
      else {
        if (h && (n = x ? r.single : r.double, n >= 0 && a[n].level === c)) {
          let b = a[n], M, y;
          x ? (M = t.md.options.quotes[2], y = t.md.options.quotes[3]) : (M = t.md.options.quotes[0], y = t.md.options.quotes[1]), qt(i, o, f.index, y), qt(i, b.tokenIdx, b.contentPos, M), Un(a, r, n);
          continue e;
        }
        if (m) {
          if (a.length >= Xs) return;
          a.push({
            tokenIdx: o,
            contentPos: f.index,
            isSingleQuote: x,
            level: c,
            prevSameQuoteIdx: x ? r.single : r.double
          }), x ? r.single = a.length - 1 : r.double = a.length - 1;
        } else h && x && qt(i, o, f.index, Pn);
      }
    }
  }
  Object.keys(i).forEach(function(o) {
    let s = Number(o);
    e[s].content = Ys(e[s].content, i[o]);
  });
}
function Qs(e) {
  if (e.md.options.typographer) for (let t = e.tokens.length - 1; t >= 0; t--) e.tokens[t].type === "inline" && Gs.test(e.tokens[t].content) && Vs(e.tokens[t].children, e);
}
function eo(e) {
  let t, n, a = e.length;
  for (t = 0; t < a; t++) e[t].type === "text_special" && (e[t].type = "text");
  for (t = n = 0; t < a; t++) e[t].type === "text" && t + 1 < a && e[t + 1].type === "text" ? e[t + 1].content = e[t].content + e[t + 1].content : (t !== n && (e[n] = e[t]), n++);
  t !== n && (e.length = n);
}
function to(e) {
  let t, n, a = e.tokens, r = a.length;
  for (let i = 0; i < r; i++) {
    if (a[i].type !== "inline") continue;
    let o = a[i].children, s = o.length;
    for (t = 0; t < s; t++) o[t].type === "text_special" && (o[t].type = "text"), o[t].children && eo(o[t].children);
    for (t = n = 0; t < s; t++) o[t].type === "text" && t + 1 < s && o[t + 1].type === "text" ? o[t + 1].content = o[t].content + o[t + 1].content : (t !== n && (o[n] = o[t]), n++);
    t !== n && (o.length = n);
  }
}
var Jt = [
  ["normalize", Ms],
  ["block", Is],
  ["strip_references", Os],
  ["inline", Bs],
  ["linkify", js],
  ["replacements", Ks],
  ["smartquotes", Qs],
  ["text_join", to]
], tr = class {
  constructor() {
    O(this, "ruler", new vt()), O(this, "State", Qa);
    for (let e = 0; e < Jt.length; e++) this.ruler.push(Jt[e][0], Jt[e][1]);
  }
  process(e) {
    let t = this.ruler.getRules("");
    for (let n = 0, a = t.length; n < a; n++) t[n](e);
  }
}, nr = class {
  constructor(e, t, n, a) {
    O(this, "bMarks", []), O(this, "eMarks", []), O(this, "tShift", []), O(this, "sCount", []), O(this, "bsCount", []), O(this, "blkIndent", 0), O(this, "line", 0), O(this, "lineMax", 0), O(this, "tight", !1), O(this, "listIndent", -1), O(this, "parentType", "root"), O(this, "level", 0), O(this, "Token", nt), this.src = e, this.md = t, this.env = n, this.tokens = a;
    let r = this.src;
    for (let i = 0, o = 0, s = 0, c = 0, u = r.length, p = !1; o < u; o++) {
      let d = r.charCodeAt(o);
      if (!p) {
        if (fe(d)) {
          s++, d === 9 ? c += 4 - c % 4 : c++;
          continue;
        }
        p = !0;
      }
      (d === 10 || o === u - 1) && (d !== 10 && o++, this.bMarks.push(i), this.eMarks.push(o), this.tShift.push(s), this.sCount.push(c), this.bsCount.push(0), p = !1, s = 0, c = 0, i = o + 1);
    }
    this.bMarks.push(r.length), this.eMarks.push(r.length), this.tShift.push(0), this.sCount.push(0), this.bsCount.push(0), this.lineMax = this.bMarks.length - 1;
  }
  push(e, t, n) {
    let a = new nt(e, t, n);
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
    for (let t = this.src.length; e < t && fe(this.src.charCodeAt(e)); e++) ;
    return e;
  }
  skipSpacesBack(e, t) {
    if (e <= t) return e;
    for (; e > t; ) if (!fe(this.src.charCodeAt(--e))) return e + 1;
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
      let s = 0, c = this.bMarks[o], u = c, p;
      for (p = o + 1 < t || a ? this.eMarks[o] + 1 : this.eMarks[o]; u < p && s < n; ) {
        let d = this.src.charCodeAt(u);
        if (fe(d)) d === 9 ? s += 4 - (s + this.bsCount[o]) % 4 : s++;
        else if (u - c < this.tShift[o]) s++;
        else break;
        u++;
      }
      s > n ? r[i] = Array(s - n + 1).join(" ") + this.src.slice(u, p) : r[i] = this.src.slice(u, p);
    }
    return r.join("");
  }
}, no = 65536;
function Wt(e, t) {
  let n = e.bMarks[t] + e.tShift[t], a = e.eMarks[t];
  return e.src.slice(n, a);
}
function Jn(e) {
  let t = [], n = e.length, a = 0, r = e.charCodeAt(a), i = !1, o = 0, s = "";
  for (; a < n; ) r === 124 && (i ? (s += e.substring(o, a - 1), o = a) : (t.push(s + e.substring(o, a)), s = "", o = a + 1)), i = r === 92, a++, r = e.charCodeAt(a);
  return t.push(s + e.substring(o)), t;
}
function ao(e, t, n, a) {
  if (t + 2 > n) return !1;
  let r = t + 1;
  if (e.sCount[r] < e.blkIndent || e.sCount[r] - e.blkIndent >= 4) return !1;
  let i = e.bMarks[r] + e.tShift[r];
  if (i >= e.eMarks[r]) return !1;
  let o = e.src.charCodeAt(i++);
  if (o !== 124 && o !== 45 && o !== 58 || i >= e.eMarks[r]) return !1;
  let s = e.src.charCodeAt(i++);
  if (s !== 124 && s !== 45 && s !== 58 && !fe(s) || o === 45 && fe(s)) return !1;
  for (; i < e.eMarks[r]; ) {
    let _ = e.src.charCodeAt(i);
    if (_ !== 124 && _ !== 45 && _ !== 58 && !fe(_)) return !1;
    i++;
  }
  let c = Wt(e, t + 1), u = c.split("|"), p = [];
  for (let _ = 0; _ < u.length; _++) {
    let E = u[_].trim();
    if (!E) {
      if (_ === 0 || _ === u.length - 1) continue;
      return !1;
    }
    if (!/^:?-+:?$/.test(E)) return !1;
    E.charCodeAt(E.length - 1) === 58 ? p.push(E.charCodeAt(0) === 58 ? "center" : "right") : E.charCodeAt(0) === 58 ? p.push("left") : p.push("");
  }
  if (c = Wt(e, t).trim(), c.indexOf("|") === -1 || e.sCount[t] - e.blkIndent >= 4) return !1;
  u = Jn(c), u.length && u[0] === "" && u.shift(), u.length && u[u.length - 1] === "" && u.pop();
  let d = u.length;
  if (d === 0 || d !== p.length) return !1;
  if (a) return !0;
  let f = e.parentType;
  e.parentType = "table";
  let m = e.md.block.ruler.getRules("blockquote"), h = e.push("table_open", "table", 1), x = [t, 0];
  h.map = x;
  let k = e.push("thead_open", "thead", 1);
  k.map = [t, t + 1];
  let v = e.push("tr_open", "tr", 1);
  v.map = [t, t + 1];
  for (let _ = 0; _ < u.length; _++) {
    let E = e.push("th_open", "th", 1);
    p[_] && (E.attrs = [["style", `text-align:${p[_]}`]]);
    let b = e.push("inline", "", 0);
    b.content = u[_].trim(), b.children = [], e.push("th_close", "th", -1);
  }
  e.push("tr_close", "tr", -1), e.push("thead_close", "thead", -1);
  let q, w = 0;
  for (r = t + 2; r < n && !(e.sCount[r] < e.blkIndent); r++) {
    let _ = !1;
    for (let b = 0, M = m.length; b < M; b++) if (m[b](e, r, n, !0)) {
      _ = !0;
      break;
    }
    if (_ || (c = Wt(e, r).trim(), !c) || e.sCount[r] - e.blkIndent >= 4 || (u = Jn(c), u.length && u[0] === "" && u.shift(), u.length && u[u.length - 1] === "" && u.pop(), w += d - u.length, w > no)) break;
    if (r === t + 2) {
      let b = e.push("tbody_open", "tbody", 1);
      b.map = q = [t + 2, 0];
    }
    let E = e.push("tr_open", "tr", 1);
    E.map = [r, r + 1];
    for (let b = 0; b < d; b++) {
      let M = e.push("td_open", "td", 1);
      p[b] && (M.attrs = [["style", `text-align:${p[b]}`]]);
      let y = e.push("inline", "", 0);
      y.content = u[b] ? u[b].trim() : "", y.children = [], e.push("td_close", "td", -1);
    }
    e.push("tr_close", "tr", -1);
  }
  return q && (e.push("tbody_close", "tbody", -1), q[1] = r), e.push("table_close", "table", -1), x[1] = r, e.parentType = f, e.line = r, !0;
}
function ro(e, t, n) {
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
function io(e, t, n, a) {
  let r = e.bMarks[t] + e.tShift[t], i = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4 || r + 3 > i) return !1;
  let o = e.src.charCodeAt(r);
  if (o !== 126 && o !== 96) return !1;
  let s = r;
  r = e.skipChars(r, o);
  let c = r - s;
  if (c < 3) return !1;
  let u = e.src.slice(s, r), p = e.src.slice(r, i);
  if (o === 96 && p.indexOf(String.fromCharCode(o)) >= 0) return !1;
  if (a) return !0;
  let d = t, f = !1;
  for (; d++, !(d >= n || (r = s = e.bMarks[d] + e.tShift[d], i = e.eMarks[d], r < i && e.sCount[d] < e.blkIndent)); ) if (e.src.charCodeAt(r) === o && !(e.sCount[d] - e.blkIndent >= 4) && (r = e.skipChars(r, o), !(r - s < c) && (r = e.skipSpaces(r), !(r < i)))) {
    f = !0;
    break;
  }
  c = e.sCount[t], e.line = d + +!!f;
  let m = e.push("fence", "code", 0);
  return m.info = p, m.content = e.getLines(t + 1, d, c, !0), m.markup = u, m.map = [t, e.line], !0;
}
function so(e, t, n, a) {
  let r = e.bMarks[t] + e.tShift[t], i = e.eMarks[t], o = e.lineMax;
  if (e.sCount[t] - e.blkIndent >= 4 || e.src.charCodeAt(r) !== 62) return !1;
  if (a) return !0;
  let s = [], c = [], u = [], p = [], d = e.md.block.ruler.getRules("blockquote"), f = e.parentType;
  e.parentType = "blockquote";
  let m = !1, h;
  for (h = t; h < n; h++) {
    let w = e.sCount[h] < e.blkIndent;
    if (r = e.bMarks[h] + e.tShift[h], i = e.eMarks[h], r >= i) break;
    if (e.src.charCodeAt(r++) === 62 && !w) {
      let E = e.sCount[h] + 1, b, M;
      e.src.charCodeAt(r) === 32 ? (r++, E++, M = !1, b = !0) : e.src.charCodeAt(r) === 9 ? (b = !0, (e.bsCount[h] + E) % 4 == 3 ? (r++, E++, M = !1) : M = !0) : b = !1;
      let y = E;
      for (s.push(e.bMarks[h]), e.bMarks[h] = r; r < i; ) {
        let T = e.src.charCodeAt(r);
        if (fe(T)) T === 9 ? y += 4 - (y + e.bsCount[h] + +!!M) % 4 : y++;
        else break;
        r++;
      }
      m = r >= i, c.push(e.bsCount[h]), e.bsCount[h] = e.sCount[h] + 1 + +!!b, u.push(e.sCount[h]), e.sCount[h] = y - E, p.push(e.tShift[h]), e.tShift[h] = r - e.bMarks[h];
      continue;
    }
    if (m) break;
    let _ = !1;
    for (let E = 0, b = d.length; E < b; E++) if (d[E](e, h, n, !0)) {
      _ = !0;
      break;
    }
    if (_) {
      e.lineMax = h, e.blkIndent !== 0 && (s.push(e.bMarks[h]), c.push(e.bsCount[h]), p.push(e.tShift[h]), u.push(e.sCount[h]), e.sCount[h] -= e.blkIndent);
      break;
    }
    s.push(e.bMarks[h]), c.push(e.bsCount[h]), p.push(e.tShift[h]), u.push(e.sCount[h]), e.sCount[h] = -1;
  }
  let x = e.blkIndent;
  e.blkIndent = 0;
  let k = e.push("blockquote_open", "blockquote", 1);
  k.markup = ">";
  let v = [t, 0];
  k.map = v, e.md.block.tokenize(e, t, h);
  let q = e.push("blockquote_close", "blockquote", -1);
  q.markup = ">", e.lineMax = o, e.parentType = f, v[1] = e.line;
  for (let w = 0; w < p.length; w++) e.bMarks[w + t] = s[w], e.tShift[w + t] = p[w], e.sCount[w + t] = u[w], e.bsCount[w + t] = c[w];
  return e.blkIndent = x, !0;
}
function oo(e, t, n, a) {
  let r = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4) return !1;
  let i = e.bMarks[t] + e.tShift[t], o = e.src.charCodeAt(i++);
  if (o !== 42 && o !== 45 && o !== 95) return !1;
  let s = 1;
  for (; i < r; ) {
    let u = e.src.charCodeAt(i++);
    if (u !== o && !fe(u)) return !1;
    u === o && s++;
  }
  if (s < 3) return !1;
  if (a) return !0;
  e.line = t + 1;
  let c = e.push("hr", "hr", 0);
  return c.map = [t, e.line], c.markup = Array(s + 1).join(String.fromCharCode(o)), !0;
}
function Wn(e, t) {
  let n = e.eMarks[t], a = e.bMarks[t] + e.tShift[t], r = e.src.charCodeAt(a++);
  return r !== 42 && r !== 45 && r !== 43 || a < n && !fe(e.src.charCodeAt(a)) ? -1 : a;
}
function Hn(e, t) {
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
  return r < a && (i = e.src.charCodeAt(r), !fe(i)) ? -1 : r;
}
function lo(e, t) {
  let n = e.level + 2;
  for (let a = t + 2, r = e.tokens.length - 2; a < r; a++) e.tokens[a].level === n && e.tokens[a].type === "paragraph_open" && (e.tokens[a + 2].hidden = !0, e.tokens[a].hidden = !0, a += 2);
}
function co(e, t, n, a) {
  let r, i, o, s, c = t, u = !0;
  if (e.sCount[c] - e.blkIndent >= 4 || e.listIndent >= 0 && e.sCount[c] - e.listIndent >= 4 && e.sCount[c] < e.blkIndent) return !1;
  let p = !1;
  a && e.parentType === "paragraph" && e.sCount[c] >= e.blkIndent && (p = !0);
  let d, f, m;
  if ((m = Hn(e, c)) >= 0) {
    if (d = !0, o = e.bMarks[c] + e.tShift[c], f = Number(e.src.slice(o, m - 1)), p && f !== 1) return !1;
  } else if ((m = Wn(e, c)) >= 0) d = !1;
  else return !1;
  if (p && e.skipSpaces(m) >= e.eMarks[c]) return !1;
  if (a) return !0;
  let h = e.src.charCodeAt(m - 1), x = e.tokens.length;
  d ? (s = e.push("ordered_list_open", "ol", 1), f !== 1 && (s.attrs = [["start", f]])) : s = e.push("bullet_list_open", "ul", 1);
  let k = [c, 0];
  s.map = k, s.markup = String.fromCharCode(h);
  let v = !1, q = e.md.block.ruler.getRules("list"), w = e.parentType;
  for (e.parentType = "list"; c < n; ) {
    i = m, r = e.eMarks[c];
    let _ = e.sCount[c] + m - (e.bMarks[c] + e.tShift[c]), E = _;
    for (; i < r; ) {
      let P = e.src.charCodeAt(i);
      if (P === 9) E += 4 - (E + e.bsCount[c]) % 4;
      else if (P === 32) E++;
      else break;
      i++;
    }
    let b = i, M;
    M = b >= r ? 1 : E - _, M > 4 && (M = 1);
    let y = _ + M;
    s = e.push("list_item_open", "li", 1), s.markup = String.fromCharCode(h);
    let T = [c, 0];
    s.map = T, d && (s.info = e.src.slice(o, m - 1));
    let U = e.tight, B = e.tShift[c], Y = e.sCount[c], Z = e.listIndent;
    if (e.listIndent = e.blkIndent, e.blkIndent = y, e.tight = !0, e.tShift[c] = b - e.bMarks[c], e.sCount[c] = E, b >= r && e.isEmpty(c + 1) ? e.line = Math.min(e.line + 2, n) : e.md.block.tokenize(e, c, n), (!e.tight || v) && (u = !1), v = e.line - c > 1 && e.isEmpty(e.line - 1), e.blkIndent = e.listIndent, e.listIndent = Z, e.tShift[c] = B, e.sCount[c] = Y, e.tight = U, s = e.push("list_item_close", "li", -1), s.markup = String.fromCharCode(h), c = e.line, T[1] = c, c >= n || e.sCount[c] < e.blkIndent || e.sCount[c] - e.blkIndent >= 4) break;
    let ne = !1;
    for (let P = 0, R = q.length; P < R; P++) if (q[P](e, c, n, !0)) {
      ne = !0;
      break;
    }
    if (ne) break;
    if (d) {
      if (m = Hn(e, c), m < 0) break;
      o = e.bMarks[c] + e.tShift[c];
    } else if (m = Wn(e, c), m < 0) break;
    if (h !== e.src.charCodeAt(m - 1)) break;
  }
  return s = d ? e.push("ordered_list_close", "ol", -1) : e.push("bullet_list_close", "ul", -1), s.markup = String.fromCharCode(h), k[1] = c, e.line = c, e.parentType = w, u && lo(e, x), !0;
}
var Ht = 999;
function uo(e) {
  let t = e.length;
  for (let n = 0; n < e.length - 1; n++) {
    let a = e.charCodeAt(n);
    if (a < 55296 || a > 56319) continue;
    let r = e.charCodeAt(n + 1);
    r >= 56320 && r <= 57343 && (t--, n++);
  }
  return t;
}
function dt(e, t) {
  return Math.min(e.eMarks[t] + 1, e.src.length);
}
function _t(e, t) {
  let n = e.lineMax;
  if (t >= n || e.isEmpty(t)) return -1;
  let a = !1;
  if (e.sCount[t] - e.blkIndent > 3 && (a = !0), e.sCount[t] < 0 && (a = !0), !a) {
    let r = e.md.block.ruler.getRules("reference"), i = e.parentType;
    e.parentType = "reference";
    let o = !1;
    for (let s = 0, c = r.length; s < c; s++) if (r[s](e, t, n, !0)) {
      o = !0;
      break;
    }
    if (e.parentType = i, o) return -1;
  }
  return e.bMarks[t] + e.tShift[t];
}
function ho(e, t, n, a) {
  let r = e.src, i = e.bMarks[t] + e.tShift[t], o = t + 1;
  if (e.sCount[t] - e.blkIndent >= 4 || r.charCodeAt(i) !== 91) return !1;
  let s = dt(e, t), c = "", u = -1, p = ++i;
  for (; i < s; ) {
    if (c.length + i - p > Ht * 2) return !1;
    let b = r.charCodeAt(i);
    if (b === 91) return !1;
    if (b === 93) {
      u = i;
      break;
    }
    if (b === 92 && (b = r.charCodeAt(++i)), b === 10 && i < s) {
      let M = _t(e, o);
      if (M < 0) return !1;
      c += r.slice(p, s), i = p = M, s = dt(e, o++);
    } else i++;
  }
  if (u < 0 || r.charCodeAt(u + 1) !== 58 || (c += r.slice(p, u), c.length > Ht && uo(c) > Ht)) return !1;
  for (i = u + 2; i < s; ) {
    let b = r.charCodeAt(i);
    if (b === 10) {
      let M = _t(e, o);
      if (M < 0) break;
      i = M, s = dt(e, o++);
    } else if (fe(b)) i++;
    else break;
  }
  let d = e.md.helpers.parseLinkDestination(r, i, s);
  if (!d.ok) return !1;
  let f = e.md.normalizeLink(d.str);
  if (!e.md.validateLink(f)) return !1;
  i = d.pos;
  let m = i, h = s, x = o;
  for (; i < s; ) {
    let b = r.charCodeAt(i);
    if (b === 10) {
      let M = _t(e, o);
      if (M < 0) break;
      i = M, s = dt(e, o++);
    } else if (fe(b)) i++;
    else break;
  }
  let k = i, v = e.md.helpers.parseLinkTitle(r, i, s);
  for (; v.can_continue; ) {
    let b = _t(e, o);
    if (b < 0) break;
    i = b, s = dt(e, o++), v = e.md.helpers.parseLinkTitle(r, i, s, v);
  }
  let q;
  for (k !== m && v.ok ? (q = v.str, i = v.pos) : (q = "", i = m, s = h, o = x); i < s && fe(r.charCodeAt(i)); ) i++;
  if (i < s && r.charCodeAt(i) !== 10 && q) for (q = "", i = m, s = h, o = x; i < s && fe(r.charCodeAt(i)); ) i++;
  if (i < s && r.charCodeAt(i) !== 10) return !1;
  let w = Ot(c);
  if (!w) return !1;
  if (a) return !0;
  e.env.references === void 0 && (e.env.references = {}), e.env.references[w] === void 0 && (e.env.references[w] = {
    title: q,
    href: f
  });
  let _ = e.push("reference_definition", "", 0);
  _.map = [t, o], _.hidden = !0;
  let E = /* @__PURE__ */ Object.create(null);
  return E.label = w, _.meta = E, e.line = o, !0;
}
var po = /* @__PURE__ */ "address.article.aside.base.basefont.blockquote.body.caption.center.col.colgroup.dd.details.dialog.dir.div.dl.dt.fieldset.figcaption.figure.footer.form.frame.frameset.h1.h2.h3.h4.h5.h6.head.header.hr.html.iframe.legend.li.link.main.menu.menuitem.nav.noframes.ol.optgroup.option.p.param.search.section.summary.table.tbody.td.tfoot.th.thead.title.tr.track.ul".split("."), fo = `<[A-Za-z][A-Za-z0-9\\-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*"))?)*\\s*\\/?>`, go = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>", ar = RegExp(`^(?:${fo}|${go})`), Qe = [
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
    RegExp(`^</?(${po.join("|")})(?=(\\s|/?>|$))`, "i"),
    /^$/,
    !0
  ],
  [
    RegExp(`${ar.source}\\s*$`),
    /^$/,
    !1
  ]
];
function mo(e, t, n, a) {
  let r = e.bMarks[t] + e.tShift[t], i = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4 || !e.md.options.html || e.src.charCodeAt(r) !== 60) return !1;
  let o = e.src.slice(r, i), s = 0;
  for (; s < Qe.length && !Qe[s][0].test(o); s++) ;
  if (s === Qe.length) return !1;
  if (a) return Qe[s][2];
  let c = t + 1, u = Qe[s][1].test("");
  if (!Qe[s][1].test(o)) {
    for (; c < n && !(e.sCount[c] < e.blkIndent && (u || !e.isEmpty(c))); c++) if (r = e.bMarks[c] + e.tShift[c], i = e.eMarks[c], o = e.src.slice(r, i), Qe[s][1].test(o)) {
      o.length !== 0 && c++;
      break;
    }
  }
  e.line = c;
  let p = e.push("html_block", "", 0);
  return p.map = [t, c], p.content = e.getLines(t, c, e.blkIndent, !0), !0;
}
function bo(e, t, n, a) {
  let r = e.bMarks[t] + e.tShift[t], i = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4) return !1;
  let o = e.src.charCodeAt(r);
  if (o !== 35 || r >= i) return !1;
  let s = 1;
  for (o = e.src.charCodeAt(++r); o === 35 && r < i && s <= 6; ) s++, o = e.src.charCodeAt(++r);
  if (s > 6 || r < i && !fe(o)) return !1;
  if (a) return !0;
  i = e.skipSpacesBack(i, r);
  let c = e.skipCharsBack(i, 35, r);
  c > r && fe(e.src.charCodeAt(c - 1)) && (i = c), e.line = t + 1;
  let u = e.push("heading_open", `h${s}`, 1);
  u.markup = "########".slice(0, s), u.map = [t, e.line];
  let p = e.push("inline", "", 0);
  p.content = Bt(e.src.slice(r, i)), p.map = [t, e.line], p.children = [];
  let d = e.push("heading_close", `h${s}`, -1);
  return d.markup = "########".slice(0, s), !0;
}
function vo(e, t, n) {
  let a = e.md.block.ruler.getRules("paragraph");
  if (e.sCount[t] - e.blkIndent >= 4) return !1;
  let r = e.parentType;
  e.parentType = "paragraph";
  let i = 0, o, s = t + 1;
  for (; s < n && !e.isEmpty(s); s++) {
    if (e.sCount[s] - e.blkIndent > 3) continue;
    if (e.sCount[s] >= e.blkIndent) {
      let m = e.bMarks[s] + e.tShift[s], h = e.eMarks[s];
      if (m < h && (o = e.src.charCodeAt(m), (o === 45 || o === 61) && (m = e.skipChars(m, o), m = e.skipSpaces(m), m >= h))) {
        i = o === 61 ? 1 : 2;
        break;
      }
    }
    if (e.sCount[s] < 0) continue;
    let f = !1;
    for (let m = 0, h = a.length; m < h; m++) if (a[m](e, s, n, !0)) {
      f = !0;
      break;
    }
    if (f) break;
  }
  if (!i) return e.parentType = r, !1;
  let c = Bt(e.getLines(t, s, e.blkIndent, !1));
  e.line = s + 1;
  let u = e.push("heading_open", `h${i}`, 1);
  u.markup = String.fromCharCode(o), u.map = [t, e.line];
  let p = e.push("inline", "", 0);
  p.content = c, p.map = [t, e.line - 1], p.children = [];
  let d = e.push("heading_close", `h${i}`, -1);
  return d.markup = String.fromCharCode(o), e.parentType = r, !0;
}
function zo(e, t, n) {
  let a = e.md.block.ruler.getRules("paragraph"), r = e.parentType, i = t + 1;
  for (e.parentType = "paragraph"; i < n && !e.isEmpty(i); i++) {
    if (e.sCount[i] - e.blkIndent > 3 || e.sCount[i] < 0) continue;
    let u = !1;
    for (let p = 0, d = a.length; p < d; p++) if (a[p](e, i, n, !0)) {
      u = !0;
      break;
    }
    if (u) break;
  }
  let o = Bt(e.getLines(t, i, e.blkIndent, !1));
  e.line = i;
  let s = e.push("paragraph_open", "p", 1);
  s.map = [t, e.line];
  let c = e.push("inline", "", 0);
  return c.content = o, c.map = [t, e.line], c.children = [], e.push("paragraph_close", "p", -1), e.parentType = r, !0;
}
var yt = [
  [
    "table",
    ao,
    ["paragraph", "reference"]
  ],
  ["code", ro],
  [
    "fence",
    io,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "blockquote",
    so,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "hr",
    oo,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "list",
    co,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  ["reference", ho],
  [
    "html_block",
    mo,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  [
    "heading",
    bo,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  ["lheading", vo],
  ["paragraph", zo]
], rr = class {
  constructor() {
    O(this, "ruler", new vt()), O(this, "State", nr);
    for (let e = 0; e < yt.length; e++) this.ruler.push(yt[e][0], yt[e][1], { alt: (yt[e][2] || []).slice() });
  }
  tokenize(e, t, n) {
    let a = this.ruler.getRules(""), r = a.length, i = e.md.options.maxNesting, o = t, s = !1;
    for (; o < n && (e.line = o = e.skipEmptyLines(o), !(o >= n || e.sCount[o] < e.blkIndent)); ) {
      if (e.level >= i) {
        e.line = n;
        break;
      }
      let c = e.line, u = !1;
      for (let p = 0; p < r; p++) if (u = a[p](e, o, n, !1), u) {
        if (c >= e.line) throw Error("block rule didn't increment state.line");
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
}, ir = class {
  constructor(e, t, n, a) {
    O(this, "pos", 0), O(this, "level", 0), O(this, "pending", ""), O(this, "pendingLevel", 0), O(this, "cache", {}), O(this, "backticks", {}), O(this, "backticksScanned", !1), O(this, "skipHtmlSpecial", !1), O(this, "linkLevel", 0), O(this, "delimiters", []), O(this, "_prev_delimiters", []), O(this, "Token", nt), this.src = e, this.env = n, this.md = t, this.tokens = a, this.tokens_meta = Array(a.length), this.posMax = this.src.length;
  }
  pushPending() {
    let e = new nt("text", "", 0);
    return e.content = this.pending, e.level = this.pendingLevel, this.tokens.push(e), this.pending = "", e;
  }
  push(e, t, n) {
    this.pending && this.pushPending();
    let a = new nt(e, t, n), r;
    return n < 0 && (this.level--, this.delimiters = this._prev_delimiters.pop()), a.level = this.level, n > 0 && (this.level++, this._prev_delimiters.push(this.delimiters), this.delimiters = [], r = { delimiters: this.delimiters }), this.pendingLevel = this.level, this.tokens.push(a), this.tokens_meta.push(r), a;
  }
  scanDelims(e, t) {
    let n = this.posMax, a = this.src.charCodeAt(e), r;
    if (e === 0) r = 32;
    else if (e === 1) r = this.src.charCodeAt(0), (r & 63488) == 55296 && (r = 65533);
    else if (r = this.src.charCodeAt(e - 1), (r & 64512) == 56320) {
      let h = this.src.charCodeAt(e - 2);
      r = (h & 64512) == 55296 ? 65536 + (h - 55296 << 10) + (r - 56320) : 65533;
    } else (r & 64512) == 55296 && (r = 65533);
    let i = e;
    for (; i < n && this.src.charCodeAt(i) === a; ) i++;
    let o = i - e, s = i < n ? this.src.charCodeAt(i) : 32;
    if ((s & 64512) == 55296) {
      let h = this.src.charCodeAt(i + 1);
      s = (h & 64512) == 56320 ? 65536 + (s - 55296 << 10) + (h - 56320) : 65533;
    } else (s & 64512) == 56320 && (s = 65533);
    let c = bt(r) || mt(r), u = bt(s) || mt(s), p = gt(r), d = gt(s), f = !d && (!u || p || c), m = !p && (!c || d || u);
    return {
      can_open: f && (t || !m || c),
      can_close: m && (t || !f || u),
      length: o
    };
  }
};
function ko(e) {
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
function xo(e, t) {
  let n = e.pos;
  for (; n < e.posMax && !ko(e.src.charCodeAt(n)); ) n++;
  return n !== e.pos && (t || (e.pending += e.src.slice(e.pos, n)), e.pos = n, !0);
}
function wo(e) {
  return e >= 65 && e <= 90 || e >= 97 && e <= 122;
}
function qo(e) {
  return e >= 65 && e <= 90 || e >= 97 && e <= 122 || e >= 48 && e <= 57 || e === 43 || e === 45 || e === 46;
}
function _o(e, t) {
  if (!e.md.options.linkify || e.linkLevel > 0) return !1;
  let n = e.pos, a = e.posMax;
  if (n + 3 > a || e.src.charCodeAt(n) !== 58 || e.src.charCodeAt(n + 1) !== 47 || e.src.charCodeAt(n + 2) !== 47) return !1;
  let r = n - Math.min(10, e.pending.length, n), i = n;
  for (; i > r && qo(e.src.charCodeAt(i - 1)); ) i--;
  if (i === n || !wo(e.src.charCodeAt(i))) return !1;
  let o = n - i, s = e.md.linkify.matchAtStart(e.src.slice(i));
  if (!s) return !1;
  let c = s.url;
  if (c.length <= o) return !1;
  let u = c.length;
  for (; u > 0 && c.charCodeAt(u - 1) === 42; ) u--;
  u !== c.length && (c = c.slice(0, u));
  let p = e.md.normalizeLink(c);
  if (!e.md.validateLink(p)) return !1;
  if (!t) {
    e.pending = e.pending.slice(0, -o);
    let d = e.push("link_open", "a", 1);
    d.attrs = [["href", p]], d.markup = "linkify", d.info = "auto";
    let f = e.push("text", "", 0);
    f.content = e.md.normalizeLinkText(c);
    let m = e.push("link_close", "a", -1);
    m.markup = "linkify", m.info = "auto";
  }
  return e.pos += c.length - o, !0;
}
function yo(e, t) {
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
  for (n++; n < r && fe(e.src.charCodeAt(n)); ) n++;
  return e.pos = n, !0;
}
var xn = [];
for (let e = 0; e < 256; e++) xn.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(e) {
  xn[e.charCodeAt(0)] = 1;
});
function Eo(e, t) {
  let n = e.pos, a = e.posMax;
  if (e.src.charCodeAt(n) !== 92 || (n++, n >= a)) return !1;
  let r = e.src.charCodeAt(n);
  if (r === 10) {
    for (t || e.push("hardbreak", "br", 0), n++; n < a && (r = e.src.charCodeAt(n), fe(r)); ) n++;
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
    s.content = r < 256 && xn[r] !== 0 ? i : o, s.markup = o, s.info = "escape";
  }
  return e.pos = n + 1, !0;
}
function Ro(e) {
  let t = {}, n = 0;
  for (; (n = e.indexOf("`", n)) !== -1; ) {
    let a = n;
    for (; e.charCodeAt(++n) === 96; ) ;
    t[n - a] = a;
  }
  return t;
}
function Co(e, t) {
  var n;
  let a = e.pos;
  if (e.src.charCodeAt(a) !== 96) return !1;
  let r = e.posMax, i = a + 1;
  for (; i < r && e.src.charCodeAt(i) === 96; ) i++;
  let o = e.src.slice(a, i), s = o.length;
  if (e.backticksScanned || (e.backticks = Ro(e.src), e.backticksScanned = !0), ((n = e.backticks[s]) == null ? -1 : n) >= i) {
    let c = i, u;
    for (; (u = e.src.indexOf("`", c)) !== -1 && u < r; ) {
      for (c = u + 1; e.src.charCodeAt(c) === 96; ) c++;
      if (c > r) break;
      if (c - u === s) {
        if (!t) {
          let p = e.push("code_inline", "code", 0);
          p.markup = o;
          let d = e.src.slice(i, u).replace(/\n/g, " ");
          d.startsWith(" ") && d.endsWith(" ") && /[^ ]/.test(d) && (d = d.slice(1, -1)), p.content = d;
        }
        return e.pos = c, !0;
      }
    }
  }
  return t || (e.pending += o), e.pos = i, !0;
}
function No(e, t) {
  let n = e.pos, a = e.src.charCodeAt(n);
  if (t || a !== 126) return !1;
  let r = e.scanDelims(e.pos, !0), i = r.length, o = String.fromCharCode(a);
  if (i < 2) return !1;
  let s;
  i % 2 && (s = e.push("text", "", 0), s.content = o, i--);
  for (let c = 0; c < i; c += 2) s = e.push("text", "", 0), s.content = o + o, e.delimiters.push({
    marker: a,
    length: 0,
    token: e.tokens.length - 1,
    end: -1,
    open: r.can_open,
    close: r.can_close
  });
  return e.pos += r.length, !0;
}
function Zn(e, t) {
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
function Ao(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  Zn(e, e.delimiters);
  for (let r = 0; r < n; r++) {
    var a;
    let i = (a = t[r]) == null ? void 0 : a.delimiters;
    i && Zn(e, i);
  }
}
var sr = {
  tokenize: No,
  postProcess: Ao
};
function Do(e, t) {
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
function Kn(e, t) {
  let n = t.length;
  for (let a = n - 1; a >= 0; a--) {
    let r = t[a];
    if (r.marker !== 95 && r.marker !== 42 || r.end === -1) continue;
    let i = t[r.end], o = a > 0 && t[a - 1].end === r.end + 1 && t[a - 1].marker === r.marker && t[a - 1].token === r.token - 1 && t[r.end + 1].token === i.token + 1, s = String.fromCharCode(r.marker), c = e.tokens[r.token];
    c.type = o ? "strong_open" : "em_open", c.tag = o ? "strong" : "em", c.nesting = 1, c.markup = o ? s + s : s, c.content = "";
    let u = e.tokens[i.token];
    u.type = o ? "strong_close" : "em_close", u.tag = o ? "strong" : "em", u.nesting = -1, u.markup = o ? s + s : s, u.content = "", o && (e.tokens[t[a - 1].token].content = "", e.tokens[t[r.end + 1].token].content = "", a--);
  }
}
function So(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  Kn(e, e.delimiters);
  for (let r = 0; r < n; r++) {
    var a;
    let i = (a = t[r]) == null ? void 0 : a.delimiters;
    i && Kn(e, i);
  }
}
var or = {
  tokenize: Do,
  postProcess: So
};
function To(e, t) {
  let n, a, r, i, o = "", s = "", c = e.pos, u = !0;
  if (e.src.charCodeAt(e.pos) !== 91) return !1;
  let p = e.pos, d = e.posMax, f = e.pos + 1, m = e.md.helpers.parseLinkLabel(e, e.pos, !0);
  if (m < 0) return !1;
  let h = m + 1;
  if (h < d && e.src.charCodeAt(h) === 40) {
    for (u = !1, h++; h < d && (n = e.src.charCodeAt(h), fe(n) || n === 10); h++) ;
    if (h >= d) return !1;
    if (c = h, r = e.md.helpers.parseLinkDestination(e.src, h, e.posMax), r.ok) {
      for (o = e.md.normalizeLink(r.str), e.md.validateLink(o) ? h = r.pos : o = "", c = h; h < d && (n = e.src.charCodeAt(h), fe(n) || n === 10); h++) ;
      if (r = e.md.helpers.parseLinkTitle(e.src, h, e.posMax), h < d && c !== h && r.ok) for (s = r.str, h = r.pos; h < d && (n = e.src.charCodeAt(h), fe(n) || n === 10); h++) ;
    }
    (h >= d || e.src.charCodeAt(h) !== 41) && (u = !0), h++;
  }
  if (u) {
    if (e.env.references === void 0) return !1;
    if (h < d && e.src.charCodeAt(h) === 91 ? (c = h + 1, h = e.md.helpers.parseLinkLabel(e, h), h >= 0 ? a = e.src.slice(c, h++) : h = m + 1) : h = m + 1, a || (a = e.src.slice(f, m)), a = Ot(a), i = e.env.references[a], !i) return e.pos = p, !1;
    o = i.href, s = i.title;
  }
  if (!t) {
    e.pos = f, e.posMax = m;
    let x = e.push("link_open", "a", 1), k = [["href", o]];
    if (x.attrs = k, s && k.push(["title", s]), a) {
      let v = /* @__PURE__ */ Object.create(null);
      v.label = a, x.meta = v;
    }
    e.linkLevel++, e.md.inline.tokenize(e), e.linkLevel--, e.push("link_close", "a", -1);
  }
  return e.pos = h, e.posMax = d, !0;
}
function Fo(e, t) {
  let n, a, r, i, o, s, c, u, p = "", d = e.pos, f = e.posMax;
  if (e.src.charCodeAt(e.pos) !== 33 || e.src.charCodeAt(e.pos + 1) !== 91) return !1;
  let m = e.pos + 2, h = e.md.helpers.parseLinkLabel(e, e.pos + 1, !1);
  if (h < 0) return !1;
  if (i = h + 1, i < f && e.src.charCodeAt(i) === 40) {
    for (i++; i < f && (n = e.src.charCodeAt(i), fe(n) || n === 10); i++) ;
    if (i >= f) return !1;
    for (u = i, s = e.md.helpers.parseLinkDestination(e.src, i, e.posMax), s.ok && (p = e.md.normalizeLink(s.str), e.md.validateLink(p) ? i = s.pos : p = ""), u = i; i < f && (n = e.src.charCodeAt(i), fe(n) || n === 10); i++) ;
    if (s = e.md.helpers.parseLinkTitle(e.src, i, e.posMax), i < f && u !== i && s.ok) for (c = s.str, i = s.pos; i < f && (n = e.src.charCodeAt(i), fe(n) || n === 10); i++) ;
    else c = "";
    if (i >= f || e.src.charCodeAt(i) !== 41) return e.pos = d, !1;
    i++;
  } else {
    if (e.env.references === void 0) return !1;
    if (i < f && e.src.charCodeAt(i) === 91 ? (u = i + 1, i = e.md.helpers.parseLinkLabel(e, i), i >= 0 ? r = e.src.slice(u, i++) : i = h + 1) : i = h + 1, r || (r = e.src.slice(m, h)), r = Ot(r), o = e.env.references[r], !o) return e.pos = d, !1;
    p = o.href, c = o.title;
  }
  if (!t) {
    a = e.src.slice(m, h);
    let x = [];
    e.md.inline.parse(a, e.md, e.env, x);
    let k = e.push("image", "img", 0), v = [["src", p], ["alt", ""]];
    if (k.attrs = v, k.children = x, k.content = a, c && v.push(["title", c]), r) {
      let q = /* @__PURE__ */ Object.create(null);
      q.label = r, k.meta = q;
    }
  }
  return e.pos = i, e.posMax = f, !0;
}
var Mo = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/, Io = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function Oo(e, t) {
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
  if (Io.test(i)) {
    let o = e.md.normalizeLink(i);
    if (!e.md.validateLink(o)) return !1;
    if (!t) {
      let s = e.push("link_open", "a", 1);
      s.attrs = [["href", o]], s.markup = "autolink", s.info = "auto";
      let c = e.push("text", "", 0);
      c.content = e.md.normalizeLinkText(i);
      let u = e.push("link_close", "a", -1);
      u.markup = "autolink", u.info = "auto";
    }
    return e.pos += i.length + 2, !0;
  }
  if (Mo.test(i)) {
    let o = e.md.normalizeLink(`mailto:${i}`);
    if (!e.md.validateLink(o)) return !1;
    if (!t) {
      let s = e.push("link_open", "a", 1);
      s.attrs = [["href", o]], s.markup = "autolink", s.info = "auto";
      let c = e.push("text", "", 0);
      c.content = e.md.normalizeLinkText(i);
      let u = e.push("link_close", "a", -1);
      u.markup = "autolink", u.info = "auto";
    }
    return e.pos += i.length + 2, !0;
  }
  return !1;
}
function Bo(e) {
  return /^<a[>\s]/i.test(e);
}
function Lo(e) {
  return /^<\/a\s*>/i.test(e);
}
function lr(e) {
  let t = e | 32;
  return t >= 97 && t <= 122;
}
function $o(e, t) {
  let n = e.src, a, r;
  if (n.startsWith("<!--", t)) {
    if (n.startsWith(">", t + 4)) return t + 5;
    if (n.startsWith("->", t + 4)) return t + 6;
    a = t + 4, r = "-->";
  } else if (n.startsWith("<![CDATA[", t)) a = t + 9, r = "]]>";
  else if (n.charCodeAt(t + 1) === 63) a = t + 2, r = "?>";
  else if (lr(n.charCodeAt(t + 2))) a = t + 3, r = ">";
  else return -1;
  if (e.skipHtmlSpecial) return -1;
  let i = n.indexOf(r, a);
  return i < 0 ? (e.skipHtmlSpecial = !0, -1) : i + r.length;
}
function jo(e, t) {
  if (!e.md.options.html) return !1;
  let n = e.posMax, a = e.pos;
  if (e.src.charCodeAt(a) !== 60 || a + 2 >= n) return !1;
  let r, i = e.src.charCodeAt(a + 1);
  if (i === 33 || i === 63) r = $o(e, a);
  else if (i === 47 || lr(i)) {
    let o = e.src.slice(a).match(ar);
    r = o ? a + o[0].length : -1;
  } else return !1;
  if (r < 0) return !1;
  if (!t) {
    let o = e.push("html_inline", "", 0);
    o.content = e.src.slice(a, r), Bo(o.content) && e.linkLevel++, Lo(o.content) && e.linkLevel--;
  }
  return e.pos = r, !0;
}
var Po = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i, Uo = /^&([a-z][a-z0-9]{1,31});/i;
function Jo(e, t) {
  let n = e.pos, a = e.posMax;
  if (e.src.charCodeAt(n) !== 38 || n + 1 >= a) return !1;
  if (e.src.charCodeAt(n + 1) === 35) {
    let r = e.src.slice(n).match(Po);
    if (r) {
      if (!t) {
        let i = r[1][0].toLowerCase() === "x" ? parseInt(r[1].slice(1), 16) : parseInt(r[1], 10), o = e.push("text_special", "", 0);
        o.content = kn(i) ? ft(i) : ft(65533), o.markup = r[0], o.info = "entity";
      }
      return e.pos += r[0].length, !0;
    }
  } else {
    let r = e.src.slice(n).match(Uo);
    if (r) {
      let i = Ka(r[0]);
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
function Gn(e) {
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
    let c = t[s.marker][(s.open ? 3 : 0) + s.length % 3], u = a - i[a] - 1, p = u;
    for (; u > c; u -= i[u] + 1) {
      let d = e[u];
      if (d.marker === s.marker && d.open && d.end < 0) {
        let f = !1;
        if ((d.close || s.open) && (d.length + s.length) % 3 == 0 && (d.length % 3 != 0 || s.length % 3 != 0) && (f = !0), !f) {
          let m = u > 0 && !e[u - 1].open ? i[u - 1] + 1 : 0;
          i[o] = o - u + m, i[u] = m, s.open = !1, d.end = o, d.close = !1, p = -1, r = -2;
          break;
        }
      }
    }
    p !== -1 && (t[s.marker][(s.open ? 3 : 0) + (s.length || 0) % 3] = p);
  }
}
function Wo(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  Gn(e.delimiters);
  for (let r = 0; r < n; r++) {
    var a;
    let i = (a = t[r]) == null ? void 0 : a.delimiters;
    i && Gn(i);
  }
}
function Ho(e) {
  let t, n, a = 0, r = e.tokens, i = e.tokens.length;
  for (t = n = 0; t < i; t++) r[t].nesting < 0 && a--, r[t].level = a, r[t].nesting > 0 && a++, r[t].type === "text" && t + 1 < i && r[t + 1].type === "text" ? r[t + 1].content = r[t].content + r[t + 1].content : (t !== n && (r[n] = r[t]), n++);
  t !== n && (r.length = n);
}
var Zt = [
  ["text", xo],
  ["linkify", _o],
  ["newline", yo],
  ["escape", Eo],
  ["backticks", Co],
  ["strikethrough", sr.tokenize],
  ["emphasis", or.tokenize],
  ["link", To],
  ["image", Fo],
  ["autolink", Oo],
  ["html_inline", jo],
  ["entity", Jo]
], Kt = [
  ["balance_pairs", Wo],
  ["strikethrough", sr.postProcess],
  ["emphasis", or.postProcess],
  ["fragments_join", Ho]
], cr = class {
  constructor() {
    O(this, "ruler", new vt()), O(this, "ruler2", new vt()), O(this, "State", ir);
    for (let e = 0; e < Zt.length; e++) this.ruler.push(Zt[e][0], Zt[e][1]);
    for (let e = 0; e < Kt.length; e++) this.ruler2.push(Kt[e][0], Kt[e][1]);
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
}, Zo = class {
  constructor(e = {}) {
    O(this, "src_Any", Pa.source), O(this, "src_Cc", Ua.source), O(this, "src_Z", Wa.source), O(this, "src_P", zn.source), O(this, "src_ZPCc", [
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
}, Gt = {
  validate: (e, t, n) => {
    let a = n.re.get_http_validator();
    a.lastIndex = t;
    let r = a.exec(e);
    return r ? r[0].length : 0;
  },
  normalize: (e, t) => t.normalize(e)
}, Ko = {
  "http:": Gt,
  "https:": Gt,
  "ftp:": Gt,
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
}, Go = "a:cdefgilmnoqrstuwxz|b:abdefghijmnorstvwyz|c:acdfghiklmnoruvwxyz|d:ejkmoz|e:cegrstu|f:ijkmor|g:abdefghilmnpqrstuwy|h:kmnrtu|i:delmnoqrst|j:emop|k:eghimnprwyz|l:abcikrstuvy|m:acdeghklmnopqrstuvwxyz|n:acefgilopruz|o:m|p:aefghklmnrstwy|q:a|r:eosuw|s:abcdeghijklmnortuvxyz|t:cdfghjklmnortvwz|u:agksyz|v:aceginu|w:fs|y:et|z:amw", Xo = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф";
function Yo() {
  let e = Xo.split("|");
  return Go.split("|").forEach((t) => {
    let n = t.indexOf(":"), a = t.slice(0, n);
    for (let r of t.slice(n + 1)) e.push(a + r);
  }), e;
}
var Vo = {
  fuzzyLink: !1,
  fuzzyEmail: !0,
  fuzzyIP: !1,
  "---": !1,
  tlds: Yo(),
  urlAuth: !1,
  maxLength: 1e4
}, Xn = class {
  constructor(e, t, n, a) {
    O(this, "schema", void 0), O(this, "index", void 0), O(this, "lastIndex", void 0), O(this, "raw", void 0), O(this, "text", void 0), O(this, "url", void 0);
    let r = e.slice(n, a);
    this.schema = t.toLowerCase(), this.index = n, this.lastIndex = a, this.raw = r, this.text = r, this.url = r;
  }
}, Qo = class {
  constructor(e = {}) {
    O(this, "__opts__", void 0), O(this, "__schemas__", void 0), O(this, "re", void 0);
    let { rebuilder: t, ...n } = e;
    this.__opts__ = {
      ...Vo,
      ...n
    }, this.__schemas__ = { ...Ko }, this.re = t || new Zo(), this.re.set({
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
    let t = [], n = this.re.get_schema_search(), a, r, i, o, s, c, u = !1, p = !1, d = !1, f = 0;
    if (!e.length) return null;
    for (n.lastIndex = 0, this.__opts__.fuzzyLink && this.__schemas__["http:"] && (a = this.re.get_fuzzy_link_search(), a.lastIndex = 0), this.__opts__.fuzzyEmail && this.__schemas__["mailto:"] && (r = this.re.get_fuzzy_mail_host_search(), r.lastIndex = 0, i = this.re.get_mail_name_validator()); ; ) {
      let m = Math.max(f - 1, 0);
      if (r && i && !d && (!s || s.index < f)) for (r.lastIndex < m && (r.lastIndex = m); ; ) {
        let q = r.exec(e);
        if (!q) {
          d = !0, s = void 0;
          break;
        }
        let w = i.exec(e.slice(Math.max(0, q.index - 65), q.index));
        if (w) {
          if (s = {
            schema: "mailto:",
            index: q.index - w[1].length,
            lastIndex: q.index + q[0].length
          }, s.index >= f) break;
          r.lastIndex < m && (r.lastIndex = m);
        }
      }
      if (a && !p && (!o || o.index < f)) for (a.lastIndex < m && (a.lastIndex = m); ; ) {
        let q = a.exec(e);
        if (!q) {
          p = !0, o = void 0;
          break;
        }
        if (o = {
          schema: "",
          index: q.index + q[1].length,
          lastIndex: q.index + q[0].length
        }, o.index >= f) break;
        a.lastIndex < m && (a.lastIndex = m);
      }
      let h = s;
      (!h || o && (o.index < h.index || o.index === h.index && o.lastIndex > h.lastIndex)) && (h = o);
      let x;
      if (!u) for (; ; ) {
        if (!c) {
          n.lastIndex < m && (n.lastIndex = m);
          let _ = n.exec(e);
          if (!_) {
            u = !0;
            break;
          }
          c = {
            schema: _[2],
            index: _.index + _[1].length,
            lastIndex: _.index + _[0].length
          };
        }
        if (c.index < f) {
          c = void 0;
          continue;
        }
        if (h && c.index > h.index) break;
        let q = c;
        c = void 0;
        let w = this.testSchemaAt(e, q.schema, q.lastIndex);
        if (w) {
          x = {
            schema: q.schema,
            index: q.index,
            lastIndex: q.lastIndex + w
          };
          break;
        }
      }
      let k = x;
      if ((!k || s && (s.index < k.index || s.index === k.index && s.lastIndex > k.lastIndex)) && (k = s), (!k || o && (o.index < k.index || o.index === k.index && o.lastIndex > k.lastIndex)) && (k = o), !k) break;
      k === s ? s = void 0 : k === o && (o = void 0);
      let v = new Xn(e, k.schema, k.index, k.lastIndex);
      v.schema ? this.__schemas__[v.schema].normalize(v, this) : this.normalize(v), t.push(v), f = k.lastIndex;
    }
    return t.length ? t : null;
  }
  matchAtStart(e) {
    if (!e.length) return null;
    let t = this.re.get_schema_at_start().exec(e);
    if (!t) return null;
    let n = this.testSchemaAt(e, t[2], t[0].length);
    if (!n) return null;
    let a = new Xn(e, t[2], t.index + t[1].length, t.index + t[0].length + n);
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
}, ot = 2147483647, Pe = 36, ur = 1, Dt = 26, el = 38, tl = 700, dr = 72, hr = 128, pr = "-", nl = /^xn--/, al = /[^\0-\x7F]/, rl = /[\x2E\u3002\uFF0E\uFF61]/g, il = {
  overflow: "Overflow: input needs wider integers to process",
  "not-basic": "Illegal input >= 0x80 (not a basic code point)",
  "invalid-input": "Invalid input"
}, sl = 35, Be = Math.floor, Xt = String.fromCharCode;
function He(e) {
  throw RangeError(il[e]);
}
function ol(e, t) {
  let n = [], a = e.length;
  for (; a--; ) n[a] = t(e[a]);
  return n;
}
function Yn(e, t) {
  let n = e.split("@"), a = "";
  n.length > 1 && (a = n[0] + "@", e = n[1]), e = e.replace(rl, ".");
  let r = ol(e.split("."), t).join(".");
  return a + r;
}
function fr(e) {
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
var ll = (e) => String.fromCodePoint(...e), cl = function(e) {
  return e >= 48 && e < 58 ? 26 + (e - 48) : e >= 65 && e < 91 ? e - 65 : e >= 97 && e < 123 ? e - 97 : Pe;
}, Vn = function(e, t) {
  return e + 22 + 75 * (e < 26) - ((t != 0) << 5);
}, gr = function(e, t, n) {
  let a = 0;
  for (e = n ? Be(e / tl) : e >> 1, e += Be(e / t); e > 455; a += Pe) e = Be(e / sl);
  return Be(a + 36 * e / (e + el));
}, Qn = function(e) {
  let t = [], n = e.length, a = 0, r = hr, i = dr, o = e.lastIndexOf(pr);
  o < 0 && (o = 0);
  for (let s = 0; s < o; ++s) e.charCodeAt(s) >= 128 && He("not-basic"), t.push(e.charCodeAt(s));
  for (let s = o > 0 ? o + 1 : 0; s < n; ) {
    let c = a;
    for (let p = 1, d = Pe; ; d += Pe) {
      s >= n && He("invalid-input");
      let f = cl(e.charCodeAt(s++));
      f >= Pe && He("invalid-input"), f > Be((ot - a) / p) && He("overflow"), a += f * p;
      let m = d <= i ? ur : d >= i + Dt ? Dt : d - i;
      if (f < m) break;
      let h = Pe - m;
      p > Be(ot / h) && He("overflow"), p *= h;
    }
    let u = t.length + 1;
    i = gr(a - c, u, c == 0), Be(a / u) > ot - r && He("overflow"), r += Be(a / u), a %= u, t.splice(a++, 0, r);
  }
  return String.fromCodePoint(...t);
}, ea = function(e) {
  let t = [];
  e = fr(e);
  let n = e.length, a = hr, r = 0, i = dr;
  for (let c of e) c < 128 && t.push(Xt(c));
  let o = t.length, s = o;
  for (o && t.push(pr); s < n; ) {
    let c = ot;
    for (let p of e) p >= a && p < c && (c = p);
    let u = s + 1;
    c - a > Be((ot - r) / u) && He("overflow"), r += (c - a) * u, a = c;
    for (let p of e) if (p < a && ++r > ot && He("overflow"), p === a) {
      let d = r;
      for (let f = Pe; ; f += Pe) {
        let m = f <= i ? ur : f >= i + Dt ? Dt : f - i;
        if (d < m) break;
        let h = d - m, x = Pe - m;
        t.push(Xt(Vn(m + h % x, 0))), d = Be(h / x);
      }
      t.push(Xt(Vn(d, 0))), i = gr(r, u, s === o), r = 0, ++s;
    }
    ++r, ++a;
  }
  return t.join("");
}, ta = {
  version: "2.3.1",
  ucs2: {
    decode: fr,
    encode: ll
  },
  decode: Qn,
  encode: ea,
  toASCII: function(e) {
    return Yn(e, function(t) {
      return al.test(t) ? "xn--" + ea(t) : t;
    });
  },
  toUnicode: function(e) {
    return Yn(e, function(t) {
      return nl.test(t) ? Qn(t.slice(4).toLowerCase()) : t;
    });
  }
}, ul = {
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
}, dl = /^(vbscript|javascript|file|data):/, hl = /^data:image\/(gif|png|jpeg|webp);/, na = [
  "http:",
  "https:",
  "mailto:"
], Ie = class {
  validateLink(e) {
    let t = e.trim().toLowerCase();
    return !dl.test(t) || hl.test(t);
  }
  normalizeLink(e) {
    let t = on(e, !0);
    if (t.hostname && (!t.protocol || na.indexOf(t.protocol) >= 0)) try {
      t.hostname = ta.toASCII(t.hostname);
    } catch {
    }
    return t.auth && (t.auth = je(t.auth)), t.hostname && (t.hostname = je(t.hostname)), t.pathname && (t.pathname = je(t.pathname)), t.search && (t.search = je(t.search)), t.hash && (t.hash = je(t.hash)), sn(t);
  }
  normalizeLinkText(e) {
    let t = on(e, !0);
    if (t.hostname && (!t.protocol || na.indexOf(t.protocol) >= 0)) try {
      t.hostname = ta.toUnicode(t.hostname);
    } catch {
    }
    return lt(sn(t), lt.defaultChars + "%");
  }
  constructor(...e) {
    O(this, "inline", new cr()), O(this, "block", new rr()), O(this, "core", new tr()), O(this, "renderer", new Va()), O(this, "linkify", new Qo()), O(this, "utils", ms), O(this, "helpers", Object.assign({}, Ss));
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
      if (t = ul[r], !t) throw Error(`Wrong 'markdown-it' preset "${r}", check name`);
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
O(Ie, "Token", nt), O(Ie, "Ruler", vt), O(Ie, "Renderer", Va), O(Ie, "ParserCore", tr), O(Ie, "StateCore", Qa), O(Ie, "ParserBlock", rr), O(Ie, "StateBlock", nr), O(Ie, "ParserInline", cr), O(Ie, "StateInline", ir);
var pl = Ga(Ie);
function fl(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
function mr(e) {
  return e instanceof Map ? e.clear = e.delete = e.set = function() {
    throw new Error("map is read-only");
  } : e instanceof Set && (e.add = e.clear = e.delete = function() {
    throw new Error("set is read-only");
  }), Object.freeze(e), Object.getOwnPropertyNames(e).forEach((t) => {
    const n = e[t], a = typeof n;
    (a === "object" || a === "function") && !Object.isFrozen(n) && mr(n);
  }), e;
}
class aa {
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
function br(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}
function Ge(e, ...t) {
  const n = /* @__PURE__ */ Object.create(null);
  for (const a in e)
    n[a] = e[a];
  return t.forEach(function(a) {
    for (const r in a)
      n[r] = a[r];
  }), /** @type {T} */
  n;
}
const gl = "</span>", ra = (e) => !!e.scope, ml = (e, { prefix: t }) => {
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
class bl {
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
    this.buffer += br(t);
  }
  /**
   * Adds a node open to the output stream (if needed)
   *
   * @param {Node} node */
  openNode(t) {
    if (!ra(t)) return;
    const n = ml(
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
    ra(t) && (this.buffer += gl);
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
const ia = (e = {}) => {
  const t = { children: [] };
  return Object.assign(t, e), t;
};
class wn {
  constructor() {
    this.rootNode = ia(), this.stack = [this.rootNode];
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
    const n = ia({ scope: t });
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
      wn._collapse(n);
    }));
  }
}
class vl extends wn {
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
    return new bl(this, this.options).value();
  }
  finalize() {
    return this.closeAllNodes(), !0;
  }
}
function zt(e) {
  return e ? typeof e == "string" ? e : e.source : null;
}
function vr(e) {
  return rt("(?=", e, ")");
}
function zl(e) {
  return rt("(?:", e, ")*");
}
function kl(e) {
  return rt("(?:", e, ")?");
}
function rt(...e) {
  return e.map((n) => zt(n)).join("");
}
function xl(e) {
  const t = e[e.length - 1];
  return typeof t == "object" && t.constructor === Object ? (e.splice(e.length - 1, 1), t) : {};
}
function qn(...e) {
  return "(" + (xl(e).capture ? "" : "?:") + e.map((a) => zt(a)).join("|") + ")";
}
function zr(e) {
  return new RegExp(e.toString() + "|").exec("").length - 1;
}
function wl(e, t) {
  const n = e && e.exec(t);
  return n && n.index === 0;
}
const ql = /\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;
function _n(e, { joinWith: t }) {
  let n = 0;
  return e.map((a) => {
    n += 1;
    const r = n;
    let i = zt(a), o = "";
    for (; i.length > 0; ) {
      const s = ql.exec(i);
      if (!s) {
        o += i;
        break;
      }
      o += i.substring(0, s.index), i = i.substring(s.index + s[0].length), s[0][0] === "\\" && s[1] ? o += "\\" + String(Number(s[1]) + r) : (o += s[0], s[0] === "(" && n++);
    }
    return o;
  }).map((a) => `(${a})`).join(t);
}
const _l = /\b\B/, kr = "[a-zA-Z]\\w*", yn = "[a-zA-Z_]\\w*", xr = "\\b\\d+(\\.\\d+)?", wr = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)", qr = "\\b(0b[01]+)", yl = "!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~", El = (e = {}) => {
  const t = /^#![ ]*\//;
  return e.binary && (e.begin = rt(
    t,
    /.*\b/,
    e.binary,
    /\b.*/
  )), Ge({
    scope: "meta",
    begin: t,
    end: /$/,
    relevance: 0,
    /** @type {ModeCallback} */
    "on:begin": (n, a) => {
      n.index !== 0 && a.ignoreMatch();
    }
  }, e);
}, kt = {
  begin: "\\\\[\\s\\S]",
  relevance: 0
}, Rl = {
  scope: "string",
  begin: "'",
  end: "'",
  illegal: "\\n",
  contains: [kt]
}, Cl = {
  scope: "string",
  begin: '"',
  end: '"',
  illegal: "\\n",
  contains: [kt]
}, Nl = {
  begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
}, Lt = function(e, t, n = {}) {
  const a = Ge(
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
  const r = qn(
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
      begin: rt(
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
}, Al = Lt("//", "$"), Dl = Lt("/\\*", "\\*/"), Sl = Lt("#", "$"), Tl = {
  scope: "number",
  begin: xr,
  relevance: 0
}, Fl = {
  scope: "number",
  begin: wr,
  relevance: 0
}, Ml = {
  scope: "number",
  begin: qr,
  relevance: 0
}, Il = {
  scope: "regexp",
  begin: /\/(?=[^/\n]*\/)/,
  end: /\/[gimuy]*/,
  contains: [
    kt,
    {
      begin: /\[/,
      end: /\]/,
      relevance: 0,
      contains: [kt]
    }
  ]
}, Ol = {
  scope: "title",
  begin: kr,
  relevance: 0
}, Bl = {
  scope: "title",
  begin: yn,
  relevance: 0
}, Ll = {
  // excludes method names from keyword processing
  begin: "\\.\\s*" + yn,
  relevance: 0
}, $l = function(e) {
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
var Et = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  APOS_STRING_MODE: Rl,
  BACKSLASH_ESCAPE: kt,
  BINARY_NUMBER_MODE: Ml,
  BINARY_NUMBER_RE: qr,
  COMMENT: Lt,
  C_BLOCK_COMMENT_MODE: Dl,
  C_LINE_COMMENT_MODE: Al,
  C_NUMBER_MODE: Fl,
  C_NUMBER_RE: wr,
  END_SAME_AS_BEGIN: $l,
  HASH_COMMENT_MODE: Sl,
  IDENT_RE: kr,
  MATCH_NOTHING_RE: _l,
  METHOD_GUARD: Ll,
  NUMBER_MODE: Tl,
  NUMBER_RE: xr,
  PHRASAL_WORDS_MODE: Nl,
  QUOTE_STRING_MODE: Cl,
  REGEXP_MODE: Il,
  RE_STARTERS_RE: yl,
  SHEBANG: El,
  TITLE_MODE: Ol,
  UNDERSCORE_IDENT_RE: yn,
  UNDERSCORE_TITLE_MODE: Bl
});
function jl(e, t) {
  e.input[e.index - 1] === "." && t.ignoreMatch();
}
function Pl(e, t) {
  e.className !== void 0 && (e.scope = e.className, delete e.className);
}
function Ul(e, t) {
  t && e.beginKeywords && (e.begin = "\\b(" + e.beginKeywords.split(" ").join("|") + ")(?!\\.)(?=\\b|\\s)", e.__beforeBegin = jl, e.keywords = e.keywords || e.beginKeywords, delete e.beginKeywords, e.relevance === void 0 && (e.relevance = 0));
}
function Jl(e, t) {
  Array.isArray(e.illegal) && (e.illegal = qn(...e.illegal));
}
function Wl(e, t) {
  if (e.match) {
    if (e.begin || e.end) throw new Error("begin & end are not supported with match");
    e.begin = e.match, delete e.match;
  }
}
function Hl(e, t) {
  e.relevance === void 0 && (e.relevance = 1);
}
const Zl = (e, t) => {
  if (!e.beforeMatch) return;
  if (e.starts) throw new Error("beforeMatch cannot be used with starts");
  const n = Object.assign({}, e);
  Object.keys(e).forEach((a) => {
    delete e[a];
  }), e.keywords = n.keywords, e.begin = rt(n.beforeMatch, vr(n.begin)), e.starts = {
    relevance: 0,
    contains: [
      Object.assign(n, { endsParent: !0 })
    ]
  }, e.relevance = 0, delete n.beforeMatch;
}, Kl = [
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
], Gl = "keyword";
function _r(e, t, n = Gl) {
  const a = /* @__PURE__ */ Object.create(null);
  return typeof e == "string" ? r(n, e.split(" ")) : Array.isArray(e) ? r(n, e) : Object.keys(e).forEach(function(i) {
    Object.assign(
      a,
      _r(e[i], t, i)
    );
  }), a;
  function r(i, o) {
    t && (o = o.map((s) => s.toLowerCase())), o.forEach(function(s) {
      const c = s.split("|");
      a[c[0]] = [i, Xl(c[0], c[1])];
    });
  }
}
function Xl(e, t) {
  return t ? Number(t) : Yl(e) ? 0 : 1;
}
function Yl(e) {
  return Kl.includes(e.toLowerCase());
}
const sa = {}, at = (e) => {
  console.error(e);
}, oa = (e, ...t) => {
  console.log(`WARN: ${e}`, ...t);
}, it = (e, t) => {
  sa[`${e}/${t}`] || (console.log(`Deprecated as of ${e}. ${t}`), sa[`${e}/${t}`] = !0);
}, St = new Error();
function yr(e, t, { key: n }) {
  let a = 0;
  const r = e[n], i = {}, o = {};
  for (let s = 1; s <= t.length; s++)
    o[s + a] = r[s], i[s + a] = !0, a += zr(t[s - 1]);
  e[n] = o, e[n]._emit = i, e[n]._multi = !0;
}
function Vl(e) {
  if (Array.isArray(e.begin)) {
    if (e.skip || e.excludeBegin || e.returnBegin)
      throw at("skip, excludeBegin, returnBegin not compatible with beginScope: {}"), St;
    if (typeof e.beginScope != "object" || e.beginScope === null)
      throw at("beginScope must be object"), St;
    yr(e, e.begin, { key: "beginScope" }), e.begin = _n(e.begin, { joinWith: "" });
  }
}
function Ql(e) {
  if (Array.isArray(e.end)) {
    if (e.skip || e.excludeEnd || e.returnEnd)
      throw at("skip, excludeEnd, returnEnd not compatible with endScope: {}"), St;
    if (typeof e.endScope != "object" || e.endScope === null)
      throw at("endScope must be object"), St;
    yr(e, e.end, { key: "endScope" }), e.end = _n(e.end, { joinWith: "" });
  }
}
function ec(e) {
  e.scope && typeof e.scope == "object" && e.scope !== null && (e.beginScope = e.scope, delete e.scope);
}
function tc(e) {
  ec(e), typeof e.beginScope == "string" && (e.beginScope = { _wrap: e.beginScope }), typeof e.endScope == "string" && (e.endScope = { _wrap: e.endScope }), Vl(e), Ql(e);
}
function nc(e) {
  function t(o, s) {
    return new RegExp(
      zt(o),
      "m" + (e.case_insensitive ? "i" : "") + (e.unicodeRegex ? "u" : "") + (s ? "g" : "")
    );
  }
  class n {
    constructor() {
      this.matchIndexes = {}, this.regexes = [], this.matchAt = 1, this.position = 0;
    }
    // @ts-ignore
    addRule(s, c) {
      c.position = this.position++, this.matchIndexes[this.matchAt] = c, this.regexes.push([c, s]), this.matchAt += zr(s) + 1;
    }
    compile() {
      this.regexes.length === 0 && (this.exec = () => null);
      const s = this.regexes.map((c) => c[1]);
      this.matcherRe = t(_n(s, { joinWith: "|" }), !0), this.lastIndex = 0;
    }
    /** @param {string} s */
    exec(s) {
      this.matcherRe.lastIndex = this.lastIndex;
      const c = this.matcherRe.exec(s);
      if (!c)
        return null;
      const u = c.findIndex((d, f) => f > 0 && d !== void 0), p = this.matchIndexes[u];
      return c.splice(0, u), Object.assign(c, p);
    }
  }
  class a {
    constructor() {
      this.rules = [], this.multiRegexes = [], this.count = 0, this.lastIndex = 0, this.regexIndex = 0;
    }
    // @ts-ignore
    getMatcher(s) {
      if (this.multiRegexes[s]) return this.multiRegexes[s];
      const c = new n();
      return this.rules.slice(s).forEach(([u, p]) => c.addRule(u, p)), c.compile(), this.multiRegexes[s] = c, c;
    }
    resumingScanAtSamePosition() {
      return this.regexIndex !== 0;
    }
    considerAll() {
      this.regexIndex = 0;
    }
    // @ts-ignore
    addRule(s, c) {
      this.rules.push([s, c]), c.type === "begin" && this.count++;
    }
    /** @param {string} s */
    exec(s) {
      const c = this.getMatcher(this.regexIndex);
      c.lastIndex = this.lastIndex;
      let u = c.exec(s);
      if (this.resumingScanAtSamePosition() && !(u && u.index === this.lastIndex)) {
        const p = this.getMatcher(0);
        p.lastIndex = this.lastIndex + 1, u = p.exec(s);
      }
      return u && (this.regexIndex += u.position + 1, this.regexIndex === this.count && this.considerAll()), u;
    }
  }
  function r(o) {
    const s = new a();
    return o.contains.forEach((c) => s.addRule(c.begin, { rule: c, type: "begin" })), o.terminatorEnd && s.addRule(o.terminatorEnd, { type: "end" }), o.illegal && s.addRule(o.illegal, { type: "illegal" }), s;
  }
  function i(o, s) {
    const c = (
      /** @type CompiledMode */
      o
    );
    if (o.isCompiled) return c;
    [
      Pl,
      // do this early so compiler extensions generally don't have to worry about
      // the distinction between match/begin
      Wl,
      tc,
      Zl
    ].forEach((p) => p(o, s)), e.compilerExtensions.forEach((p) => p(o, s)), o.__beforeBegin = null, [
      Ul,
      // do this later so compiler extensions that come earlier have access to the
      // raw array if they wanted to perhaps manipulate it, etc.
      Jl,
      // default to 1 relevance if not specified
      Hl
    ].forEach((p) => p(o, s)), o.isCompiled = !0;
    let u = null;
    return typeof o.keywords == "object" && o.keywords.$pattern && (o.keywords = Object.assign({}, o.keywords), u = o.keywords.$pattern, delete o.keywords.$pattern), u = u || /\w+/, o.keywords && (o.keywords = _r(o.keywords, e.case_insensitive)), c.keywordPatternRe = t(u, !0), s && (o.begin || (o.begin = /\B|\b/), c.beginRe = t(c.begin), !o.end && !o.endsWithParent && (o.end = /\B|\b/), o.end && (c.endRe = t(c.end)), c.terminatorEnd = zt(c.end) || "", o.endsWithParent && s.terminatorEnd && (c.terminatorEnd += (o.end ? "|" : "") + s.terminatorEnd)), o.illegal && (c.illegalRe = t(
      /** @type {RegExp | string} */
      o.illegal
    )), o.contains || (o.contains = []), o.contains = [].concat(...o.contains.map(function(p) {
      return ac(p === "self" ? o : p);
    })), o.contains.forEach(function(p) {
      i(
        /** @type Mode */
        p,
        c
      );
    }), o.starts && i(o.starts, s), c.matcher = r(c), c;
  }
  if (e.compilerExtensions || (e.compilerExtensions = []), e.contains && e.contains.includes("self"))
    throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");
  return e.classNameAliases = Ge(e.classNameAliases || {}), i(
    /** @type Mode */
    e
  );
}
function Er(e) {
  return e ? e.endsWithParent || Er(e.starts) : !1;
}
function ac(e) {
  return e.variants && !e.cachedVariants && (e.cachedVariants = e.variants.map(function(t) {
    return Ge(e, { variants: null }, t);
  })), e.cachedVariants ? e.cachedVariants : Er(e) ? Ge(e, { starts: e.starts ? Ge(e.starts) : null }) : Object.isFrozen(e) ? Ge(e) : e;
}
var rc = "11.11.1";
class ic extends Error {
  constructor(t, n) {
    super(t), this.name = "HTMLInjectionError", this.html = n;
  }
}
const Yt = br, la = Ge, ca = Symbol("nomatch"), sc = 7, Rr = function(e) {
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
    __emitter: vl
  };
  function c(R) {
    return s.noHighlightRe.test(R);
  }
  function u(R) {
    let L = R.className + " ";
    L += R.parentNode ? R.parentNode.className : "";
    const D = s.languageDetectRe.exec(L);
    if (D) {
      const N = y(D[1]);
      return N || (oa(i.replace("{}", D[1])), oa("Falling back to no-highlight mode for this block.", R)), N ? D[1] : "no-highlight";
    }
    return L.split(/\s+/).find((N) => c(N) || y(N));
  }
  function p(R, L, D) {
    let N = "", J = "";
    typeof L == "object" ? (N = R, D = L.ignoreIllegals, J = L.language) : (it("10.7.0", "highlight(lang, code, ...args) has been deprecated."), it("10.7.0", `Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`), J = R, N = L), D === void 0 && (D = !0);
    const H = {
      code: N,
      language: J
    };
    ne("before:highlight", H);
    const V = H.result ? H.result : d(H.language, H.code, D);
    return V.code = H.code, ne("after:highlight", V), V;
  }
  function d(R, L, D, N) {
    const J = /* @__PURE__ */ Object.create(null);
    function H(C, A) {
      return C.keywords[A];
    }
    function V() {
      if (!K.keywords) {
        ge.addText(ie);
        return;
      }
      let C = 0;
      K.keywordPatternRe.lastIndex = 0;
      let A = K.keywordPatternRe.exec(ie), I = "";
      for (; A; ) {
        I += ie.substring(C, A.index);
        const z = se.case_insensitive ? A[0].toLowerCase() : A[0], $ = H(K, z);
        if ($) {
          const [G, Q] = $;
          if (ge.addText(I), I = "", J[z] = (J[z] || 0) + 1, J[z] <= sc && (Se += Q), G.startsWith("_"))
            I += A[0];
          else {
            const X = se.classNameAliases[G] || G;
            he(A[0], X);
          }
        } else
          I += A[0];
        C = K.keywordPatternRe.lastIndex, A = K.keywordPatternRe.exec(ie);
      }
      I += ie.substring(C), ge.addText(I);
    }
    function ue() {
      if (ie === "") return;
      let C = null;
      if (typeof K.subLanguage == "string") {
        if (!t[K.subLanguage]) {
          ge.addText(ie);
          return;
        }
        C = d(K.subLanguage, ie, !0, Fe[K.subLanguage]), Fe[K.subLanguage] = /** @type {CompiledMode} */
        C._top;
      } else
        C = m(ie, K.subLanguage.length ? K.subLanguage : null);
      K.relevance > 0 && (Se += C.relevance), ge.__addSublanguage(C._emitter, C.language);
    }
    function ce() {
      K.subLanguage != null ? ue() : V(), ie = "";
    }
    function he(C, A) {
      C !== "" && (ge.startScope(A), ge.addText(C), ge.endScope());
    }
    function ae(C, A) {
      let I = 1;
      const z = A.length - 1;
      for (; I <= z; ) {
        if (!C._emit[I]) {
          I++;
          continue;
        }
        const $ = se.classNameAliases[C[I]] || C[I], G = A[I];
        $ ? he(G, $) : (ie = G, V(), ie = ""), I++;
      }
    }
    function ze(C, A) {
      return C.scope && typeof C.scope == "string" && ge.openNode(se.classNameAliases[C.scope] || C.scope), C.beginScope && (C.beginScope._wrap ? (he(ie, se.classNameAliases[C.beginScope._wrap] || C.beginScope._wrap), ie = "") : C.beginScope._multi && (ae(C.beginScope, A), ie = "")), K = Object.create(C, { parent: { value: K } }), K;
    }
    function ke(C, A, I) {
      let z = wl(C.endRe, I);
      if (z) {
        if (C["on:end"]) {
          const $ = new aa(C);
          C["on:end"](A, $), $.isMatchIgnored && (z = !1);
        }
        if (z) {
          for (; C.endsParent && C.parent; )
            C = C.parent;
          return C;
        }
      }
      if (C.endsWithParent)
        return ke(C.parent, A, I);
    }
    function F(C) {
      return K.matcher.regexIndex === 0 ? (ie += C[0], 1) : (j = !0, 0);
    }
    function W(C) {
      const A = C[0], I = C.rule, z = new aa(I), $ = [I.__beforeBegin, I["on:begin"]];
      for (const G of $)
        if (G && (G(C, z), z.isMatchIgnored))
          return F(A);
      return I.skip ? ie += A : (I.excludeBegin && (ie += A), ce(), !I.returnBegin && !I.excludeBegin && (ie = A)), ze(I, C), I.returnBegin ? 0 : A.length;
    }
    function de(C) {
      const A = C[0], I = L.substring(C.index), z = ke(K, C, I);
      if (!z)
        return ca;
      const $ = K;
      K.endScope && K.endScope._wrap ? (ce(), he(A, K.endScope._wrap)) : K.endScope && K.endScope._multi ? (ce(), ae(K.endScope, C)) : $.skip ? ie += A : ($.returnEnd || $.excludeEnd || (ie += A), ce(), $.excludeEnd && (ie = A));
      do
        K.scope && ge.closeNode(), !K.skip && !K.subLanguage && (Se += K.relevance), K = K.parent;
      while (K !== z.parent);
      return z.starts && ze(z.starts, C), $.returnEnd ? 0 : A.length;
    }
    function De() {
      const C = [];
      for (let A = K; A !== se; A = A.parent)
        A.scope && C.unshift(A.scope);
      C.forEach((A) => ge.openNode(A));
    }
    let ee = {};
    function pe(C, A) {
      const I = A && A[0];
      if (ie += C, I == null)
        return ce(), 0;
      if (ee.type === "begin" && A.type === "end" && ee.index === A.index && I === "") {
        if (ie += L.slice(A.index, A.index + 1), !r) {
          const z = new Error(`0 width match regex (${R})`);
          throw z.languageName = R, z.badRule = ee.rule, z;
        }
        return 1;
      }
      if (ee = A, A.type === "begin")
        return W(A);
      if (A.type === "illegal" && !D) {
        const z = new Error('Illegal lexeme "' + I + '" for mode "' + (K.scope || "<unnamed>") + '"');
        throw z.mode = K, z;
      } else if (A.type === "end") {
        const z = de(A);
        if (z !== ca)
          return z;
      }
      if (A.type === "illegal" && I === "")
        return ie += `
`, 1;
      if (Ee > 1e5 && Ee > A.index * 3)
        throw new Error("potential infinite loop, way more iterations than matches");
      return ie += I, I.length;
    }
    const se = y(R);
    if (!se)
      throw at(i.replace("{}", R)), new Error('Unknown language: "' + R + '"');
    const Ae = nc(se);
    let xe = "", K = N || Ae;
    const Fe = {}, ge = new s.__emitter(s);
    De();
    let ie = "", Se = 0, qe = 0, Ee = 0, j = !1;
    try {
      if (se.__emitTokens)
        se.__emitTokens(L, ge);
      else {
        for (K.matcher.considerAll(); ; ) {
          Ee++, j ? j = !1 : K.matcher.considerAll(), K.matcher.lastIndex = qe;
          const C = K.matcher.exec(L);
          if (!C) break;
          const A = L.substring(qe, C.index), I = pe(A, C);
          qe = C.index + I;
        }
        pe(L.substring(qe));
      }
      return ge.finalize(), xe = ge.toHTML(), {
        language: R,
        value: xe,
        relevance: Se,
        illegal: !1,
        _emitter: ge,
        _top: K
      };
    } catch (C) {
      if (C.message && C.message.includes("Illegal"))
        return {
          language: R,
          value: Yt(L),
          illegal: !0,
          relevance: 0,
          _illegalBy: {
            message: C.message,
            index: qe,
            context: L.slice(qe - 100, qe + 100),
            mode: C.mode,
            resultSoFar: xe
          },
          _emitter: ge
        };
      if (r)
        return {
          language: R,
          value: Yt(L),
          illegal: !1,
          relevance: 0,
          errorRaised: C,
          _emitter: ge,
          _top: K
        };
      throw C;
    }
  }
  function f(R) {
    const L = {
      value: Yt(R),
      illegal: !1,
      relevance: 0,
      _top: o,
      _emitter: new s.__emitter(s)
    };
    return L._emitter.addText(R), L;
  }
  function m(R, L) {
    L = L || s.languages || Object.keys(t);
    const D = f(R), N = L.filter(y).filter(U).map(
      (ce) => d(ce, R, !1)
    );
    N.unshift(D);
    const J = N.sort((ce, he) => {
      if (ce.relevance !== he.relevance) return he.relevance - ce.relevance;
      if (ce.language && he.language) {
        if (y(ce.language).supersetOf === he.language)
          return 1;
        if (y(he.language).supersetOf === ce.language)
          return -1;
      }
      return 0;
    }), [H, V] = J, ue = H;
    return ue.secondBest = V, ue;
  }
  function h(R, L, D) {
    const N = L && n[L] || D;
    R.classList.add("hljs"), R.classList.add(`language-${N}`);
  }
  function x(R) {
    let L = null;
    const D = u(R);
    if (c(D)) return;
    if (ne(
      "before:highlightElement",
      { el: R, language: D }
    ), R.dataset.highlighted) {
      console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.", R);
      return;
    }
    if (R.children.length > 0 && (s.ignoreUnescapedHTML || (console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."), console.warn("https://github.com/highlightjs/highlight.js/wiki/security"), console.warn("The element with unescaped HTML:"), console.warn(R)), s.throwUnescapedHTML))
      throw new ic(
        "One of your code blocks includes unescaped HTML.",
        R.innerHTML
      );
    L = R;
    const N = L.textContent, J = D ? p(N, { language: D, ignoreIllegals: !0 }) : m(N);
    R.innerHTML = J.value, R.dataset.highlighted = "yes", h(R, D, J.language), R.result = {
      language: J.language,
      // TODO: remove with version 11.0
      re: J.relevance,
      relevance: J.relevance
    }, J.secondBest && (R.secondBest = {
      language: J.secondBest.language,
      relevance: J.secondBest.relevance
    }), ne("after:highlightElement", { el: R, result: J, text: N });
  }
  function k(R) {
    s = la(s, R);
  }
  const v = () => {
    _(), it("10.6.0", "initHighlighting() deprecated.  Use highlightAll() now.");
  };
  function q() {
    _(), it("10.6.0", "initHighlightingOnLoad() deprecated.  Use highlightAll() now.");
  }
  let w = !1;
  function _() {
    function R() {
      _();
    }
    if (document.readyState === "loading") {
      w || window.addEventListener("DOMContentLoaded", R, !1), w = !0;
      return;
    }
    document.querySelectorAll(s.cssSelector).forEach(x);
  }
  function E(R, L) {
    let D = null;
    try {
      D = L(e);
    } catch (N) {
      if (at("Language definition for '{}' could not be registered.".replace("{}", R)), r)
        at(N);
      else
        throw N;
      D = o;
    }
    D.name || (D.name = R), t[R] = D, D.rawDefinition = L.bind(null, e), D.aliases && T(D.aliases, { languageName: R });
  }
  function b(R) {
    delete t[R];
    for (const L of Object.keys(n))
      n[L] === R && delete n[L];
  }
  function M() {
    return Object.keys(t);
  }
  function y(R) {
    return R = (R || "").toLowerCase(), t[R] || t[n[R]];
  }
  function T(R, { languageName: L }) {
    typeof R == "string" && (R = [R]), R.forEach((D) => {
      n[D.toLowerCase()] = L;
    });
  }
  function U(R) {
    const L = y(R);
    return L && !L.disableAutodetect;
  }
  function B(R) {
    R["before:highlightBlock"] && !R["before:highlightElement"] && (R["before:highlightElement"] = (L) => {
      R["before:highlightBlock"](
        Object.assign({ block: L.el }, L)
      );
    }), R["after:highlightBlock"] && !R["after:highlightElement"] && (R["after:highlightElement"] = (L) => {
      R["after:highlightBlock"](
        Object.assign({ block: L.el }, L)
      );
    });
  }
  function Y(R) {
    B(R), a.push(R);
  }
  function Z(R) {
    const L = a.indexOf(R);
    L !== -1 && a.splice(L, 1);
  }
  function ne(R, L) {
    const D = R;
    a.forEach(function(N) {
      N[D] && N[D](L);
    });
  }
  function P(R) {
    return it("10.7.0", "highlightBlock will be removed entirely in v12.0"), it("10.7.0", "Please use highlightElement now."), x(R);
  }
  Object.assign(e, {
    highlight: p,
    highlightAuto: m,
    highlightAll: _,
    highlightElement: x,
    // TODO: Remove with v12 API
    highlightBlock: P,
    configure: k,
    initHighlighting: v,
    initHighlightingOnLoad: q,
    registerLanguage: E,
    unregisterLanguage: b,
    listLanguages: M,
    getLanguage: y,
    registerAliases: T,
    autoDetection: U,
    inherit: la,
    addPlugin: Y,
    removePlugin: Z
  }), e.debugMode = function() {
    r = !1;
  }, e.safeMode = function() {
    r = !0;
  }, e.versionString = rc, e.regex = {
    concat: rt,
    lookahead: vr,
    either: qn,
    optional: kl,
    anyNumberOfTimes: zl
  };
  for (const R in Et)
    typeof Et[R] == "object" && mr(Et[R]);
  return Object.assign(e, Et), e;
}, ut = Rr({});
ut.newInstance = () => Rr({});
var oc = ut;
ut.HighlightJS = ut;
ut.default = ut;
const lc = /* @__PURE__ */ fl(oc), ua = "[A-Za-z$_][0-9A-Za-z$_]*", cc = [
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
], uc = [
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity"
], Cr = [
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
], Nr = [
  "Error",
  "EvalError",
  "InternalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError"
], Ar = [
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
], dc = [
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
], hc = [].concat(
  Ar,
  Cr,
  Nr
);
function pc(e) {
  const t = e.regex, n = (D, { after: N }) => {
    const J = "</" + D[0].slice(1);
    return D.input.indexOf(J, N) !== -1;
  }, a = ua, r = {
    begin: "<>",
    end: "</>"
  }, i = /<[A-Za-z0-9\\._:-]+\s*\/>/, o = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
    /**
     * @param {RegExpMatchArray} match
     * @param {CallbackResponse} response
     */
    isTrulyOpeningTag: (D, N) => {
      const J = D[0].length + D.index, H = D.input[J];
      if (
        // HTML should not include another raw `<` inside a tag
        // nested type?
        // `<Array<Array<number>>`, etc.
        H === "<" || // the , gives away that this is not HTML
        // `<T, A extends keyof T, V>`
        H === ","
      ) {
        N.ignoreMatch();
        return;
      }
      H === ">" && (n(D, { after: J }) || N.ignoreMatch());
      let V;
      const ue = D.input.substring(J);
      if (V = ue.match(/^\s*=/)) {
        N.ignoreMatch();
        return;
      }
      if ((V = ue.match(/^\s+extends\s+/)) && V.index === 0) {
        N.ignoreMatch();
        return;
      }
    }
  }, s = {
    $pattern: ua,
    keyword: cc,
    literal: uc,
    built_in: hc,
    "variable.language": dc
  }, c = "[0-9](_?[0-9])*", u = `\\.(${c})`, p = "0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*", d = {
    className: "number",
    variants: [
      // DecimalLiteral
      { begin: `(\\b(${p})((${u})|\\.)?|(${u}))[eE][+-]?(${c})\\b` },
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
  }, x = {
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
  }, q = {
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
  }, w = [
    e.APOS_STRING_MODE,
    e.QUOTE_STRING_MODE,
    m,
    h,
    x,
    k,
    // Skip numbers when they are part of a variable name
    { match: /\$\d+/ },
    d
    // This is intentional:
    // See https://github.com/highlightjs/highlight.js/issues/3288
    // hljs.REGEXP_MODE
  ];
  f.contains = w.concat({
    // we need to pair up {} inside our subst to prevent
    // it from ending too early by matching another }
    begin: /\{/,
    end: /\}/,
    keywords: s,
    contains: [
      "self"
    ].concat(w)
  });
  const _ = [].concat(q, f.contains), E = _.concat([
    // eat recursive parens in sub expressions
    {
      begin: /(\s*)\(/,
      end: /\)/,
      keywords: s,
      contains: ["self"].concat(_)
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
    contains: E
  }, M = {
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
  }, y = {
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
        ...Cr,
        ...Nr
      ]
    }
  }, T = {
    label: "use_strict",
    className: "meta",
    relevance: 10,
    begin: /^\s*['"]use (strict|asm)['"]/
  }, U = {
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
  }, B = {
    relevance: 0,
    match: /\b[A-Z][A-Z_0-9]+\b/,
    className: "variable.constant"
  };
  function Y(D) {
    return t.concat("(?!", D.join("|"), ")");
  }
  const Z = {
    match: t.concat(
      /\b/,
      Y([
        ...Ar,
        "super",
        "import"
      ].map((D) => `${D}\\s*\\(`)),
      a,
      t.lookahead(/\s*\(/)
    ),
    className: "title.function",
    relevance: 0
  }, ne = {
    begin: t.concat(/\./, t.lookahead(
      t.concat(a, /(?![0-9A-Za-z$_(])/)
    )),
    end: a,
    excludeBegin: !0,
    keywords: "prototype",
    className: "property",
    relevance: 0
  }, P = {
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
  }, R = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + e.UNDERSCORE_IDENT_RE + ")\\s*=>", L = {
    match: [
      /const|var|let/,
      /\s+/,
      a,
      /\s*/,
      /=\s*/,
      /(async\s*)?/,
      // async is optional
      t.lookahead(R)
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
    exports: { PARAMS_CONTAINS: E, CLASS_REFERENCE: y },
    illegal: /#(?![$_A-z])/,
    contains: [
      e.SHEBANG({
        label: "shebang",
        binary: "node",
        relevance: 5
      }),
      T,
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE,
      m,
      h,
      x,
      k,
      q,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      d,
      y,
      {
        scope: "attr",
        match: a + t.lookahead(":"),
        relevance: 0
      },
      L,
      {
        // "value" container
        begin: "(" + e.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
        keywords: "return throw case",
        relevance: 0,
        contains: [
          q,
          e.REGEXP_MODE,
          {
            className: "function",
            // we have to count the parens to make sure we actually have the
            // correct bounding ( ) before the =>.  There could be any number of
            // sub-expressions inside also surrounded by parens.
            begin: R,
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
                    contains: E
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
      U,
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
      ne,
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
      B,
      M,
      P,
      {
        match: /\$[(.]/
        // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
      }
    ]
  };
}
const Tt = "[A-Za-z$_][0-9A-Za-z$_]*", Dr = [
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
], Sr = [
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity"
], Tr = [
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
], Fr = [
  "Error",
  "EvalError",
  "InternalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError"
], Mr = [
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
], Ir = [
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
], Or = [].concat(
  Mr,
  Tr,
  Fr
);
function fc(e) {
  const t = e.regex, n = (D, { after: N }) => {
    const J = "</" + D[0].slice(1);
    return D.input.indexOf(J, N) !== -1;
  }, a = Tt, r = {
    begin: "<>",
    end: "</>"
  }, i = /<[A-Za-z0-9\\._:-]+\s*\/>/, o = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
    /**
     * @param {RegExpMatchArray} match
     * @param {CallbackResponse} response
     */
    isTrulyOpeningTag: (D, N) => {
      const J = D[0].length + D.index, H = D.input[J];
      if (
        // HTML should not include another raw `<` inside a tag
        // nested type?
        // `<Array<Array<number>>`, etc.
        H === "<" || // the , gives away that this is not HTML
        // `<T, A extends keyof T, V>`
        H === ","
      ) {
        N.ignoreMatch();
        return;
      }
      H === ">" && (n(D, { after: J }) || N.ignoreMatch());
      let V;
      const ue = D.input.substring(J);
      if (V = ue.match(/^\s*=/)) {
        N.ignoreMatch();
        return;
      }
      if ((V = ue.match(/^\s+extends\s+/)) && V.index === 0) {
        N.ignoreMatch();
        return;
      }
    }
  }, s = {
    $pattern: Tt,
    keyword: Dr,
    literal: Sr,
    built_in: Or,
    "variable.language": Ir
  }, c = "[0-9](_?[0-9])*", u = `\\.(${c})`, p = "0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*", d = {
    className: "number",
    variants: [
      // DecimalLiteral
      { begin: `(\\b(${p})((${u})|\\.)?|(${u}))[eE][+-]?(${c})\\b` },
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
  }, x = {
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
  }, q = {
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
  }, w = [
    e.APOS_STRING_MODE,
    e.QUOTE_STRING_MODE,
    m,
    h,
    x,
    k,
    // Skip numbers when they are part of a variable name
    { match: /\$\d+/ },
    d
    // This is intentional:
    // See https://github.com/highlightjs/highlight.js/issues/3288
    // hljs.REGEXP_MODE
  ];
  f.contains = w.concat({
    // we need to pair up {} inside our subst to prevent
    // it from ending too early by matching another }
    begin: /\{/,
    end: /\}/,
    keywords: s,
    contains: [
      "self"
    ].concat(w)
  });
  const _ = [].concat(q, f.contains), E = _.concat([
    // eat recursive parens in sub expressions
    {
      begin: /(\s*)\(/,
      end: /\)/,
      keywords: s,
      contains: ["self"].concat(_)
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
    contains: E
  }, M = {
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
  }, y = {
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
        ...Tr,
        ...Fr
      ]
    }
  }, T = {
    label: "use_strict",
    className: "meta",
    relevance: 10,
    begin: /^\s*['"]use (strict|asm)['"]/
  }, U = {
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
  }, B = {
    relevance: 0,
    match: /\b[A-Z][A-Z_0-9]+\b/,
    className: "variable.constant"
  };
  function Y(D) {
    return t.concat("(?!", D.join("|"), ")");
  }
  const Z = {
    match: t.concat(
      /\b/,
      Y([
        ...Mr,
        "super",
        "import"
      ].map((D) => `${D}\\s*\\(`)),
      a,
      t.lookahead(/\s*\(/)
    ),
    className: "title.function",
    relevance: 0
  }, ne = {
    begin: t.concat(/\./, t.lookahead(
      t.concat(a, /(?![0-9A-Za-z$_(])/)
    )),
    end: a,
    excludeBegin: !0,
    keywords: "prototype",
    className: "property",
    relevance: 0
  }, P = {
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
  }, R = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + e.UNDERSCORE_IDENT_RE + ")\\s*=>", L = {
    match: [
      /const|var|let/,
      /\s+/,
      a,
      /\s*/,
      /=\s*/,
      /(async\s*)?/,
      // async is optional
      t.lookahead(R)
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
    exports: { PARAMS_CONTAINS: E, CLASS_REFERENCE: y },
    illegal: /#(?![$_A-z])/,
    contains: [
      e.SHEBANG({
        label: "shebang",
        binary: "node",
        relevance: 5
      }),
      T,
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE,
      m,
      h,
      x,
      k,
      q,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      d,
      y,
      {
        scope: "attr",
        match: a + t.lookahead(":"),
        relevance: 0
      },
      L,
      {
        // "value" container
        begin: "(" + e.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
        keywords: "return throw case",
        relevance: 0,
        contains: [
          q,
          e.REGEXP_MODE,
          {
            className: "function",
            // we have to count the parens to make sure we actually have the
            // correct bounding ( ) before the =>.  There could be any number of
            // sub-expressions inside also surrounded by parens.
            begin: R,
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
                    contains: E
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
      U,
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
      ne,
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
      B,
      M,
      P,
      {
        match: /\$[(.]/
        // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
      }
    ]
  };
}
function gc(e) {
  const t = e.regex, n = fc(e), a = Tt, r = [
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
  }, c = [
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
    $pattern: Tt,
    keyword: Dr.concat(c),
    literal: Sr,
    built_in: Or.concat(r),
    "variable.language": Ir
  }, p = {
    className: "meta",
    begin: "@" + a
  }, d = (x, k, v) => {
    const q = x.contains.findIndex((w) => w.label === k);
    if (q === -1)
      throw new Error("can not find mode to replace");
    x.contains.splice(q, 1, v);
  };
  Object.assign(n.keywords, u), n.exports.PARAMS_CONTAINS.push(p);
  const f = n.contains.find((x) => x.scope === "attr"), m = Object.assign(
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
  ]), d(n, "shebang", e.SHEBANG()), d(n, "use_strict", s);
  const h = n.contains.find((x) => x.label === "func.def");
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
function mc(e) {
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
const bc = (e) => ({
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
}), vc = [
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
], zc = [
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
], kc = [
  ...vc,
  ...zc
], xc = [
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
].sort().reverse(), wc = [
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
].sort().reverse(), qc = [
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
].sort().reverse(), _c = [
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
function yc(e) {
  const t = e.regex, n = bc(e), a = { begin: /-(webkit|moz|ms|o)-(?=[a-z])/ }, r = "and or not only", i = /@-?\w[\w]*(-\w+)*/, o = "[a-zA-Z-][a-zA-Z0-9_-]*", s = [
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
          { begin: ":(" + wc.join("|") + ")" },
          { begin: ":(:)?(" + qc.join("|") + ")" }
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
        begin: "\\b(" + _c.join("|") + ")\\b"
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
              attribute: xc.join(" ")
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
        begin: "\\b(" + kc.join("|") + ")\\b"
      }
    ]
  };
}
function Ec(e) {
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
  }), s = e.inherit(e.APOS_STRING_MODE, { className: "string" }), c = e.inherit(e.QUOTE_STRING_MODE, { className: "string" }), u = {
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
          c,
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
                  c,
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
              c
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
function Rc(e) {
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
  }, c = {
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
  }, d = {
    className: "string",
    contains: [e.BACKSLASH_ESCAPE],
    variants: [
      {
        begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/,
        end: /'''/,
        contains: [
          e.BACKSLASH_ESCAPE,
          c
        ],
        relevance: 10
      },
      {
        begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/,
        end: /"""/,
        contains: [
          e.BACKSLASH_ESCAPE,
          c
        ],
        relevance: 10
      },
      {
        begin: /([fF][rR]|[rR][fF]|[fF])'''/,
        end: /'''/,
        contains: [
          e.BACKSLASH_ESCAPE,
          c,
          p,
          u
        ]
      },
      {
        begin: /([fF][rR]|[rR][fF]|[fF])"""/,
        end: /"""/,
        contains: [
          e.BACKSLASH_ESCAPE,
          c,
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
  }, f = "[0-9](_?[0-9])*", m = `(\\b(${f}))?\\.(${f})|\\b(${f})\\.`, h = `\\b|${a.join("|")}`, x = {
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
        begin: `(\\b(${f})|(${m}))[eE][+-]?(${f})[jJ]?(?=${h})`
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
        keywords: s,
        contains: [
          "self",
          c,
          x,
          d,
          e.HASH_COMMENT_MODE
        ]
      }
    ]
  };
  return u.contains = [
    d,
    x,
    c
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
      c,
      x,
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
      d,
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
          x,
          v,
          d
        ]
      }
    ]
  };
}
function Cc(e) {
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
  const c = {
    match: /\\"/
  }, u = {
    className: "string",
    begin: /'/,
    end: /'/
  }, p = {
    match: /\\'/
  }, d = {
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
  }), h = {
    className: "function",
    begin: /\w[\w\d_]*\s*\(\s*\)\s*\{/,
    returnBegin: !0,
    contains: [e.inherit(e.TITLE_MODE, { begin: /\w[\w\d_]*/ })],
    relevance: 0
  }, x = [
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
  ], v = { match: /(\/[a-z._-]+)+/ }, q = [
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
  ], w = [
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
  ], _ = [
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
  ], E = [
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
      keyword: x,
      literal: k,
      built_in: [
        ...q,
        ...w,
        // Shell modifiers
        "set",
        "shopt",
        ..._,
        ...E
      ]
    },
    contains: [
      m,
      // to catch known shells and boost relevancy
      e.SHEBANG(),
      // to catch unknown shells but still highlight the shebang
      h,
      d,
      i,
      o,
      v,
      s,
      c,
      u,
      p,
      n
    ]
  };
}
function Nc(e) {
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
  }, h = {
    begin: /\{/,
    end: /\}/,
    contains: [m],
    illegal: "\\n",
    relevance: 0
  }, x = {
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
    h,
    x,
    i,
    o
  ], v = [...k];
  return v.pop(), v.push(s), m.contains = v, {
    name: "YAML",
    case_insensitive: !0,
    aliases: ["yml"],
    contains: k
  };
}
function Ac(e) {
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
  ], c = [
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
  ], d = [
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
  ], m = p, h = [
    ...u,
    ...c
  ].filter((E) => !p.includes(E)), x = {
    scope: "variable",
    match: /@[a-z0-9][a-z0-9_]*/
  }, k = {
    scope: "operator",
    match: /[-+*/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?/,
    relevance: 0
  }, v = {
    match: t.concat(/\b/, t.either(...m), /\s*\(/),
    relevance: 0,
    keywords: { built_in: m }
  };
  function q(E) {
    return t.concat(
      /\b/,
      t.either(...E.map((b) => b.replace(/\s+/, "\\s+"))),
      /\b/
    );
  }
  const w = {
    scope: "keyword",
    match: q(f),
    relevance: 0
  };
  function _(E, {
    exceptions: b,
    when: M
  } = {}) {
    const y = M;
    return b = b || [], E.map((T) => T.match(/\|\d+$/) || b.includes(T) ? T : y(T) ? `${T}|0` : T);
  }
  return {
    name: "SQL",
    case_insensitive: !0,
    // does not include {} or HTML tags `</`
    illegal: /[{}]|<\//,
    keywords: {
      $pattern: /\b[\w\.]+/,
      keyword: _(h, { when: (E) => E.length < 3 }),
      literal: i,
      type: s,
      built_in: d
    },
    contains: [
      {
        scope: "type",
        match: q(o)
      },
      w,
      v,
      x,
      a,
      r,
      e.C_NUMBER_MODE,
      e.C_BLOCK_COMMENT_MODE,
      n,
      k
    ]
  };
}
function Dc(e) {
  const t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), r = (i, o, s) => {
    const c = o.toLowerCase(), u = i.get(c);
    i.set(c, u === void 0 || (u == null ? void 0 : u.path) === s.path ? s : null);
  };
  for (const i of e) {
    const o = i.path.replace(/\.md$/i, "");
    r(t, o, i), r(n, o.slice(o.lastIndexOf("/") + 1), i), r(a, i.title.trim(), i);
  }
  return (i) => {
    const o = i.trim(), s = o.includes("/") || /\.md$/i.test(o), c = o.replace(/^\//, "").replace(/\.md$/i, "").toLowerCase();
    if (!c || c.split("/").some((p) => !p || p === "." || p === "..")) return null;
    if (s) return t.get(c) ?? null;
    const u = a.get(c);
    return u === void 0 ? n.get(c) ?? null : u;
  };
}
const Sc = /^\[\[([^\[\]\r\n]{1,256})\]\]/;
function Tc(e) {
  e.inline.ruler.after("image", "wikilink", (t, n) => {
    if (n || t.linkLevel || !t.src.startsWith("[[", t.pos)) return !1;
    const a = Sc.exec(t.src.slice(t.pos, Math.min(t.posMax, t.pos + 260)));
    if (!a) return !1;
    const r = a[1].indexOf("|"), i = (r < 0 ? a[1] : a[1].slice(0, r)).trim();
    if (!i) return !1;
    const o = t.env.resolveWikilink, s = o == null ? void 0 : o(i), c = t.push("wikilink", "", 0);
    if (c.content = a[0], s) {
      const u = r < 0 ? "" : a[1].slice(r + 1).trim();
      c.content = u || (i.includes("/") || /\.md$/i.test(i) ? s.title : i), c.attrSet("data-note-path", s.path);
    }
    return t.pos += a[0].length, !0;
  }), e.renderer.rules.wikilink = (t, n) => {
    const a = t[n], r = e.utils.escapeHtml(a.content), i = a.attrGet("data-note-path");
    return typeof i == "string" ? `<button type="button" class="qz-wikilink" data-note-path="${e.utils.escapeHtml(i)}">${r}</button>` : r;
  };
}
const cn = lc.newInstance();
for (const [e, t] of Object.entries({ javascript: pc, typescript: gc, json: mc, css: yc, xml: Ec, python: Rc, bash: Cc, yaml: Nc, sql: Ac }))
  cn.registerLanguage(e, t);
const Le = new pl({ html: !1, highlight: (e, t) => e.length <= 32768 && cn.getLanguage(t) ? cn.highlight(e, { language: t, ignoreIllegals: !0 }).value : "" });
Tc(Le);
Le.validateLink = (e) => /^(https?:\/\/|mailto:)/i.test(e);
Le.renderer.rules.image = (e, t) => `<span class="qz-note-image">[image: ${Le.utils.escapeHtml(e[t].content || "image")}]</span>`;
Le.renderer.rules.link_open = (e, t, n, a, r) => (e[t].attrSet("target", "_blank"), e[t].attrSet("rel", "noopener noreferrer nofollow"), r.renderToken(e, t, n));
Le.renderer.rules.note_task = (e, t, n, a, r) => r.renderToken(e, t, n) + " ";
Le.core.ruler.push("note_tasks", (e) => {
  const { tokens: t, env: n } = e, a = typeof n.lineOffset == "number" ? n.lineOffset : 0, r = e.src.split(`
`);
  for (let i = 0; i < t.length; i++) {
    const o = t[i];
    if (o.type !== "list_item_open" || !o.map) continue;
    const s = o.map[0], c = /^[ \t]*- \[([ x])\] (.*)$/.exec(r[s] || "");
    if (!c) continue;
    const u = t[i + 1], p = t[i + 2], d = p == null ? void 0 : p.children, f = d == null ? void 0 : d[0], m = `[${c[1]}]`;
    if ((u == null ? void 0 : u.type) !== "paragraph_open" || (p == null ? void 0 : p.type) !== "inline" || !d || (f == null ? void 0 : f.type) !== "text" || f.content !== m && !f.content.startsWith(`${m} `)) continue;
    const h = new e.Token("note_task", "input", 0);
    h.attrSet("type", "checkbox"), h.attrSet("class", "qz-note-task-checkbox"), h.attrSet("data-note-task-line", String(s + a)), h.attrSet("aria-label", c[2].trim() || "Task"), n.editable || h.attrSet("disabled", "");
    const x = c[1] === "x";
    x && h.attrSet("checked", ""), o.attrJoin("class", x ? "qz-note-task qz-note-task-completed" : "qz-note-task"), f.content = f.content.slice(4);
    const k = new e.Token("span_open", "span", 1);
    k.attrSet("class", "qz-note-task-text"), d.unshift(h, k), d.push(new e.Token("span_close", "span", -1));
  }
});
function Fc(e, t, n = {}) {
  let a = e, r = 0;
  const i = /^---[ \t]*\n/.exec(e);
  if (i) {
    const p = /^---[ \t]*(?:\n|$)/gm;
    p.lastIndex = i[0].length, p.test(e) && (r = (e.slice(0, p.lastIndex).match(/\n/g) || []).length, a = e.slice(p.lastIndex));
  }
  const o = { resolveWikilink: t, editable: n.editable === !0, lineOffset: r }, s = Le.parse(a, o), c = a.split(`
`), u = [];
  for (let p = 0; p < s.length; ) {
    const d = p, f = s[p++];
    if (f.nesting === 1) {
      let x = 1;
      for (; p < s.length && x > 0; ) x += s[p++].nesting;
    }
    const m = f.map, h = { html: Le.renderer.render(s.slice(d, p), Le.options, o) };
    if (m) {
      let x = m[1];
      for (; x > m[0] + 1 && /^[ \t]*$/.test(c[x - 1] ?? ""); ) x--;
      h.start = m[0] + r, h.end = x + r;
    }
    u.push(h);
  }
  return u;
}
function Mc(e) {
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
function un(e) {
  const t = e.content.startsWith("\uFEFF") ? "\uFEFF" : "", n = e.content.slice(t.length), a = n.replace(/\r\n/g, ""), r = a.length !== n.length, i = a.includes("\r") || r && a.includes(`
`) ? "mixed" : r ? `\r
` : `
`;
  return { source: e, text: n.replace(/\r\n?/g, `
`), bom: t, lineEnding: i };
}
function Br(e) {
  return e.lineEnding === "mixed" ? e.source.content : e.bom + (e.lineEnding === `\r
` ? e.text.replace(/\n/g, `\r
`) : e.text);
}
function Lr(e, t, n) {
  const a = e.split(`
`);
  if (!Number.isInteger(t) || !Number.isInteger(n) || t < 0 || n <= t || n > a.length) return null;
  let r = 0;
  for (let o = 0; o < t; o++) r += a[o].length + 1;
  let i = r + a[t].length;
  for (let o = t + 1; o < n; o++) i += 1 + a[o].length;
  return { from: r, to: i };
}
function Ic(e, t, n) {
  const a = Lr(e, t, t + 1);
  if (!a) return e;
  const r = /^([ \t]*- \[)( |x)(\] )/.exec(e.slice(a.from, a.to));
  if (!r) return e;
  const i = a.from + r[1].length;
  return e.slice(0, i) + (n ? "x" : " ") + e.slice(i + 1);
}
const st = { lastNote: null, expanded: [], limit: 500, pinned: [] }, Oc = { color: "theme", emoji: "" }, Bc = {
  appearance: Sa,
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
}, Lc = {
  narrow: "Narrow",
  standard: "Standard",
  wide: "Wide",
  full: "Full width"
}, da = ["tasks", "todos", "notes", "settings"];
function Ue(e) {
  return e && typeof e == "object" && !Array.isArray(e) ? e : {};
}
function Ne(e, t, n) {
  return t.includes(e) ? e : n;
}
function En(e) {
  return typeof e == "number" && Number.isSafeInteger(e) && e > 0 ? e : null;
}
function $r(e) {
  const t = Ue(e);
  return {
    headingColor: Xe(t.headingColor),
    headingLines: Ta(t.headingLines),
    lineColor: Xe(t.lineColor)
  };
}
function ha(e, t) {
  return Object.fromEntries(Object.entries(Ue(e)).filter(([n]) => /^[1-9]\d*$/.test(n) && En(Number(n)) !== null).map(([n, a]) => [n, t(Ue(a))]));
}
const jr = (e) => typeof e == "string" && e.length > 0 && (e.length <= 1024 || Array.from(e).length <= 1024), pa = (e) => Array.isArray(e) ? [...new Set(e.filter(jr))] : [], fa = (e) => Ne(e, ["all", "workspace"], "all"), ga = (e) => Ne(e, ["open", "done", "all"], "open");
function Pr(e) {
  return Array.from(e.replace(/[\u0000-\u001f\u007f]/g, "").trim()).slice(0, 8).join("");
}
function Ft(e) {
  const t = Ue(e), n = Ue(t.boardFields), a = Xe(t.accent);
  return {
    appearance: $r(t.appearance),
    accent: a === "accent" ? "theme" : a,
    highContrast: t.highContrast === !0,
    largerInterfaceText: t.largerInterfaceText === !0,
    motion: Ne(t.motion, ["system", "reduced"], "system"),
    startOn: Ne(t.startOn, ["last", ...da], "last"),
    lastTab: Ne(t.lastTab, da, "tasks"),
    workspaceId: En(t.workspaceId),
    noteView: Ne(t.noteView, ["rendered", "raw"], "rendered"),
    noteWidth: Ne(t.noteWidth, ["narrow", "standard", "wide", "full"], "standard"),
    noteTextSize: Ne(t.noteTextSize, ["small", "medium", "large"], "medium"),
    rawTextSize: Ne(t.rawTextSize, ["small", "medium", "large"], "medium"),
    noteLineHeight: Ne(t.noteLineHeight, ["compact", "normal", "relaxed"], "normal"),
    noteFont: Ne(t.noteFont, ["theme", "mono"], "theme"),
    noteFolders: ha(t.noteFolders, (r) => ({
      lastNote: jr(r.lastNote) ? r.lastNote : null,
      expanded: pa(r.expanded),
      limit: typeof r.limit == "number" && Number.isSafeInteger(r.limit) ? Math.min(5e4, Math.max(st.limit, r.limit)) : st.limit,
      pinned: pa(r.pinned)
    })),
    folderAppearance: ha(t.folderAppearance, (r) => ({
      color: Xe(r.color),
      emoji: typeof r.emoji == "string" ? Pr(r.emoji) : ""
    })),
    boardDensity: Ne(t.boardDensity, ["comfortable", "compact"], "comfortable"),
    boardFields: { progress: n.progress !== !1, path: n.path !== !1, badges: n.badges !== !1 },
    hideEmptyLanes: t.hideEmptyLanes === !0,
    laneSort: Object.fromEntries(Object.entries(Ue(t.laneSort)).filter(([r]) => /^\d+:[a-z][a-z0-9_]{0,31}$/.test(r)).map(([r, i]) => [r, Ne(i, ["manual", "title"], "manual")])),
    todoScope: fa(t.todoScope),
    todoState: ga(t.todoState),
    todoFilters: Array.isArray(t.todoFilters) ? t.todoFilters.flatMap((r) => {
      const i = Ue(r);
      return typeof i.name != "string" || !i.name.trim() ? [] : [{
        name: i.name.trim().slice(0, 40),
        scope: fa(i.scope),
        state: ga(i.state),
        search: typeof i.search == "string" ? i.search.slice(0, 200) : ""
      }];
    }).slice(0, 20) : []
  };
}
function ma(e) {
  const t = Ue(e), n = Ft(t);
  return Object.fromEntries(Object.entries(n).filter(([a]) => Object.hasOwn(t, a)));
}
const Ur = "quartizo-preferences-v1";
function Ct(e) {
  var t;
  try {
    return ((t = Ra()) == null ? void 0 : t.getItem(e)) ?? null;
  } catch {
    return null;
  }
}
function ba(e) {
  try {
    return JSON.parse(Ct(e) ?? "null");
  } catch {
    return null;
  }
}
function $c() {
  const e = ba(Ur);
  if (e && typeof e == "object") {
    const { values: o, pending: s, legacy: c } = Ue(e);
    return { values: Ft(o), pending: ma(s), legacy: ma(c) };
  }
  const t = {}, n = ba("quartizo-notes-appearance"), a = Ct("quartizo-notes-view"), r = Ct("quartizo-notes-full-width"), i = En(Number(Ct("quartizo:workspace")));
  return n && (t.appearance = $r(n)), (a === "raw" || a === "rendered") && (t.noteView = a), (r === "true" || r === "false") && (t.noteWidth = r === "true" ? "full" : "standard"), i !== null && (t.workspaceId = i), { values: { ...Bc, ...t }, pending: {}, legacy: t };
}
function va(e) {
  try {
    const t = Ra();
    return t ? (t.setItem(Ur, JSON.stringify(e)), !0) : !1;
  } catch {
    return !1;
  }
}
function Vt(e) {
  return e && (e.conflict || Br(e) !== e.source.content) ? e : void 0;
}
function dn(e) {
  return `${e.workspaceId}:${e.path}`;
}
function jc(e, t) {
  const [n, a] = S(() => /* @__PURE__ */ new Map()), r = re(n), i = re(/* @__PURE__ */ new Map());
  function o(p, d) {
    const f = new Map(r.current);
    f.set(p, d(f.get(p) ?? {})), r.current = f, a(f);
  }
  function s(p, d, f) {
    var m;
    f !== void 0 && (((m = r.current.get(p)) == null ? void 0 : m.draft) ?? null) !== f || o(p, (h) => {
      const x = h.draft ?? h.saved, k = d && x ? { ...d, source: x.source, conflict: x.conflict } : d ?? void 0;
      return { ...h, draft: h.saving ? k : Vt(k), didSave: !1, failure: d ? h.failure : void 0 };
    });
  }
  function c(p, d) {
    var f;
    d && ((f = r.current.get(p)) == null ? void 0 : f.saved) === d && o(p, (m) => ({ ...m, saved: void 0 }));
  }
  async function u(p) {
    var x, k;
    const d = dn(p), f = (x = r.current.get(d)) == null ? void 0 : x.draft;
    if (!f || f.conflict || f.lineEnding === "mixed") return;
    const m = i.current.get(d);
    if (m) {
      m.next = f;
      return;
    }
    const h = { next: f };
    i.current.set(d, h), o(d, (v) => ({ ...v, saving: !0, didSave: !1, failure: void 0 }));
    try {
      let v;
      for (; v = h.next; ) {
        h.next = void 0;
        const q = Br(v);
        if (q === v.source.content) continue;
        const w = await _e(bi(e, p.workspaceId, p.path, q, v.source.hash)), _ = un({ ...w, content: q }), E = (k = i.current.get(d)) == null ? void 0 : k.next;
        E && (h.next = { ...E, source: _.source }), o(d, (b) => ({
          ...b,
          saved: _,
          draft: Vt(b.draft && { ...b.draft, source: _.source }),
          didSave: !0
        })), t();
      }
    } catch (v) {
      const q = Ce(v);
      o(d, (w) => q.code === "conflict" && w.draft ? { ...w, draft: { ...w.draft, conflict: !0 } } : { ...w, failure: q });
    } finally {
      i.current.delete(d), o(d, (v) => ({ ...v, saving: !1, draft: Vt(v.draft) }));
    }
  }
  return { edits: n, edit: s, loaded: c, save: u };
}
const Pc = 3e3, Uc = typeof navigator < "u" && /Mac|iPhone|iPad/.test(navigator.platform), Qt = [], hn = 25, Jc = 5e4;
function za(e, t) {
  const n = t.split("/").slice(0, -1), a = n.map((r, i) => `${n.slice(0, i + 1).join("/")}/`);
  return [...e.filter((r) => !a.includes(r)), ...a].slice(-50);
}
function Wc(e, t, n) {
  const a = Ca(), [r, i] = S(null), [o, s] = S(null), [c, u] = S(null), [p, d] = S(0);
  oe(() => {
    if (!t || !a) return;
    let m = !1, h, x, k;
    const v = async () => {
      try {
        const q = await _e(Mt(e));
        if (m) return;
        const w = q.workspaces.filter((b) => b.workspace.companion), _ = JSON.stringify(w);
        k !== _ && (i(w), k = _);
        const E = w.find((b) => b.workspace.id === n);
        if (!q.available) throw new Error(q.error ?? "The Markdown index is unavailable.");
        if (E) {
          const b = `${E.workspace.id}:${E.index.indexedAt ?? ""}`;
          if (b !== x) {
            const M = await _e(fi(e, E.workspace.id));
            if (m) return;
            s({ workspaceId: E.workspace.id, notes: M.notes }), x = b;
          }
        } else
          s(null);
        u(null);
      } catch (q) {
        m || u(Ce(q));
      } finally {
        m || (h = setTimeout(v, Pc));
      }
    };
    return v(), () => {
      m = !0, clearTimeout(h);
    };
  }, [t, e, p, a, n]);
  const f = r == null ? void 0 : r.find((m) => m.workspace.id === n);
  return {
    current: f,
    failure: c,
    workspaces: r,
    notes: f && (o == null ? void 0 : o.workspaceId) === f.workspace.id ? o.notes : null,
    refresh: () => d((m) => m + 1),
    visible: a
  };
}
function Hc({ api: e, active: t, workspaceId: n, request: a, preferences: r, onPreferencesChange: i, onSettings: o }) {
  var Ee;
  const [s, c] = S(null), [u, p] = S(""), [d, f] = S(!1), [m, h] = S(""), [x, k] = S(null), [v, q] = S(!1), w = re(!1), { workspaces: _, current: E, notes: b, failure: M, refresh: y, visible: T } = Wc(e, t, n), { edits: U, edit: B, loaded: Y, save: Z } = jc(e, y), ne = re(null), P = re(null), R = re(null), L = re(null), D = re(r.noteFolders), N = re(n), J = re("standard"), H = r.noteFolders[String(n)] ?? st, { limit: V } = H, ue = Oe(() => new Set(H.pinned), [H.pinned]), ce = Oe(() => new Set(H.expanded), [H.expanded]), he = Gr(u.trim().toLowerCase()), ae = Oe(() => he ? (b ?? Qt).filter((j) => j.title.toLowerCase().includes(he) || j.path.toLowerCase().includes(he)) : b ?? Qt, [b, he]), ze = Oe(() => ae.filter((j) => ue.has(j.path)), [ae, ue]), ke = Oe(() => ae.filter((j) => !ue.has(j.path)), [ae, ue]), F = Oe(() => Mc(ke.slice(0, V)), [ke, V]), W = (Ee = E == null ? void 0 : E.index.writeBlocked) == null ? void 0 : Ee.message;
  Ea(() => {
    D.current = r.noteFolders, N.current = n, r.noteWidth !== "full" && (J.current = r.noteWidth);
  }, [r.noteFolders, r.noteWidth, n]);
  const de = Ye((j, C) => {
    const A = D.current[j] ?? st, I = C(A);
    D.current = { ...D.current, [j]: I }, i({ noteFolders: { [j]: I } });
  }, [i]), De = Ye((j, C = !1) => {
    c(C ? dn(j) : null), de(j.workspaceId, (A) => ({
      ...A,
      lastNote: j.path,
      expanded: za(A.expanded, j.path)
    }));
  }, [de]);
  if (oe(() => {
    p(""), f(!1), h(""), k(null), c(null);
  }, [n]), oe(() => {
    !t || !a || a.workspaceId !== n || a === L.current || (L.current = a, De(a), p(""), f(!1));
  }, [t, a, De, n]), oe(() => {
    var j;
    d && ((j = P.current) == null || j.focus());
  }, [d]), oe(() => {
    if (!t || !E) return;
    const j = (C) => {
      var I, z, $, G;
      if (C.defaultPrevented || C.isComposing || C.altKey) return;
      const A = C.target instanceof Element ? C.target : null;
      if (!(A && A !== document.body && !((z = (I = ne.current) == null ? void 0 : I.closest(".qz-app")) != null && z.contains(A)))) {
        if (C.key === "/" && !C.metaKey && !C.ctrlKey) {
          if (A != null && A.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
          C.preventDefault(), ($ = R.current) == null || $.focus();
        }
        !C.shiftKey && C.key.toLowerCase() === "n" && (C.metaKey || C.ctrlKey) && !v && !W && (C.preventDefault(), f(!0), k(null), (G = P.current) == null || G.focus());
      }
    };
    return document.addEventListener("keydown", j), () => document.removeEventListener("keydown", j);
  }, [t, v, E, W]), !_) return M ? /* @__PURE__ */ l(me, { failure: M }) : /* @__PURE__ */ l("p", { className: "qz-muted qz-loading", role: "status", children: "Loading folders…" });
  if (!E) return /* @__PURE__ */ g("div", { className: "qz-stack", children: [
    /* @__PURE__ */ l(me, { failure: M }),
    /* @__PURE__ */ g("div", { className: "qz-empty", children: [
      /* @__PURE__ */ l("span", { className: "qz-empty-icon", children: /* @__PURE__ */ l(te, { name: "folder" }) }),
      /* @__PURE__ */ l("h2", { children: "Connect a notes folder" }),
      /* @__PURE__ */ l("p", { children: "Add a folder of Markdown files in Settings to browse and edit your notes." }),
      /* @__PURE__ */ l("button", { type: "button", className: "qz-button", "data-variant": "primary", onClick: o, children: "Open Settings" })
    ] })
  ] });
  const ee = E.workspace.id, pe = H.lastNote ? { workspaceId: ee, path: H.lastNote } : null, se = pe ? dn(pe) : "", Ae = (j) => De({ workspaceId: ee, path: j }), xe = r.folderAppearance[ee], K = xe && Ke(xe.color), Fe = bn(E.index), ge = (j) => de(ee, (C) => ({
    ...C,
    expanded: C.expanded.includes(j) ? C.expanded.filter((A) => A !== j) : za(C.expanded, j)
  })), ie = (j) => de(ee, (C) => ({
    ...C,
    pinned: C.pinned.includes(j) ? C.pinned.filter((A) => A !== j) : [...C.pinned, j].slice(0, hn)
  })), Se = () => de(ee, (j) => ({
    ...j,
    limit: Math.min(Jc, j.limit + st.limit)
  })), qe = async () => {
    const j = m.trim();
    if (!(!j || w.current || W)) {
      w.current = !0, q(!0), k(null);
      try {
        const C = await _e(mi(e, ee, j));
        N.current === ee && (h(""), f(!1), (D.current[ee] ?? st).lastNote === H.lastNote && De({ workspaceId: ee, path: C.path }, !0)), y();
      } catch (C) {
        N.current === ee && k(Ce(C));
      } finally {
        w.current = !1, q(!1);
      }
    }
  };
  return /* @__PURE__ */ g("section", { ref: ne, className: "qz-stack qz-notes-view", "aria-label": "Notes", children: [
    /* @__PURE__ */ g("div", { className: "qz-view-heading", children: [
      /* @__PURE__ */ l("h2", { className: "qz-section-title", children: "Notes" }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        E && /* @__PURE__ */ l(pn, { workspace: E.workspace, variant: "quiet" }),
        /* @__PURE__ */ g(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "primary",
            "aria-expanded": d,
            "aria-keyshortcuts": "Meta+N Control+N",
            title: "New note (Cmd/Ctrl+N)",
            onClick: () => {
              f((j) => !j), k(null);
            },
            disabled: v || !!W,
            children: [
              /* @__PURE__ */ l(te, { name: "plus" }),
              "New note"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ l(me, { failure: M }),
    Fe && /* @__PURE__ */ l("div", { className: "qz-notice", role: "note", children: Fe }),
    d && /* @__PURE__ */ g("form", { className: "qz-note-create qz-panel-surface", onSubmit: (j) => {
      j.preventDefault(), qe();
    }, children: [
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Note path",
        /* @__PURE__ */ l(
          "input",
          {
            ref: P,
            className: "qz-input",
            value: m,
            placeholder: "projects/launch.md",
            disabled: v,
            onChange: (j) => h(j.target.value),
            required: !0
          }
        )
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ l("button", { type: "submit", className: "qz-button", "data-variant": "primary", disabled: !m.trim() || v || !!W, children: "Create note" }),
        /* @__PURE__ */ l("button", { type: "button", className: "qz-button", "data-variant": "quiet", disabled: v, onClick: () => f(!1), children: "Cancel" })
      ] }),
      /* @__PURE__ */ l(me, { failure: x })
    ] }),
    /* @__PURE__ */ g("div", { className: "qz-notes-layout", "data-note-open": pe ? "" : void 0, children: [
      pe && /* @__PURE__ */ g(
        "button",
        {
          type: "button",
          className: "qz-button qz-notes-back",
          "data-variant": "quiet",
          onClick: () => de(ee, (j) => ({ ...j, lastNote: null })),
          children: [
            /* @__PURE__ */ l(te, { name: "back" }),
            "All notes"
          ]
        }
      ),
      /* @__PURE__ */ g("aside", { className: "qz-note-browser qz-panel-surface", "aria-label": "Notes browser", children: [
        /* @__PURE__ */ g("h3", { className: "qz-note-browser-heading", children: [
          K && /* @__PURE__ */ l("span", { className: "qz-folder-dot", "aria-hidden": "true", style: { backgroundColor: K } }),
          /* @__PURE__ */ l("span", { className: "qz-note-browser-icon", "aria-hidden": "true", style: { color: K }, children: (xe == null ? void 0 : xe.emoji) || /* @__PURE__ */ l(te, { name: "folder" }) }),
          E.workspace.name
        ] }),
        /* @__PURE__ */ g("label", { className: "qz-field", children: [
          "Search notes",
          /* @__PURE__ */ l(
            "input",
            {
              ref: R,
              type: "search",
              className: "qz-input",
              value: u,
              placeholder: "Title or path (press / to focus)",
              "aria-keyshortcuts": "/",
              onChange: (j) => p(j.target.value)
            }
          )
        ] }),
        b === null && !M && /* @__PURE__ */ l("p", { role: "status", className: "qz-muted qz-loading", children: "Loading notes…" }),
        b !== null && ae.length === 0 && /* @__PURE__ */ l("p", { className: "qz-muted", children: he ? "No notes match your search." : E.index.state === "scanning" ? "Indexing notes…" : "No notes in this folder yet." }),
        ze.length > 0 && /* @__PURE__ */ g("section", { className: "qz-note-pins", "aria-labelledby": "qz-pinned-notes", children: [
          /* @__PURE__ */ l("h4", { id: "qz-pinned-notes", children: "Pinned notes" }),
          /* @__PURE__ */ l("ul", { className: "qz-note-tree", children: ze.map((j) => /* @__PURE__ */ l(Jr, { note: j, icon: "pin", selected: pe == null ? void 0 : pe.path, onOpen: Ae }, j.path)) })
        ] }),
        ke.length > 0 && /* @__PURE__ */ l(
          Wr,
          {
            branch: F,
            prefix: "",
            selected: pe == null ? void 0 : pe.path,
            searching: !!he,
            expanded: ce,
            onOpen: Ae,
            onToggle: ge
          },
          he ? "search" : "browse"
        ),
        ke.length > V && /* @__PURE__ */ g(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            onClick: Se,
            children: [
              "Show more notes (",
              Math.min(V, ke.length),
              " of ",
              ke.length,
              " shown)"
            ]
          }
        )
      ] }),
      pe ? /* @__PURE__ */ l(
        Zc,
        {
          api: e,
          active: t,
          location: pe,
          edits: U.get(se),
          onDraft: (j, C) => B(se, j, C),
          onLoaded: (j) => Y(se, j),
          onSave: () => {
            W || Z(pe);
          },
          writeBlocked: !!W,
          notes: b ?? Qt,
          onOpen: Ae,
          loadBacklinks: t && T,
          indexRevision: E.index.indexedAt,
          view: s === se ? "raw" : r.noteView,
          focusEditor: s === se,
          width: r.noteWidth,
          pinned: ue.has(pe.path),
          pinLimitReached: H.pinned.length >= hn,
          onPin: () => ie(pe.path),
          onViewChange: (j) => {
            c(null), i({ noteView: j });
          },
          onWidthChange: () => i({ noteWidth: r.noteWidth === "full" ? J.current : "full" })
        },
        se
      ) : /* @__PURE__ */ g("div", { className: "qz-empty", children: [
        /* @__PURE__ */ l("span", { className: "qz-empty-icon", children: /* @__PURE__ */ l(te, { name: "note" }) }),
        /* @__PURE__ */ l("h3", { children: "Open a note" }),
        /* @__PURE__ */ l("p", { children: "Choose one from the folder tree or create a new note." })
      ] })
    ] })
  ] });
}
function Jr({ note: e, icon: t = "note", selected: n, onOpen: a }) {
  return /* @__PURE__ */ l("li", { children: /* @__PURE__ */ g(
    "button",
    {
      type: "button",
      "aria-current": e.path === n ? "true" : void 0,
      title: e.path,
      onClick: () => a(e.path),
      children: [
        /* @__PURE__ */ l(te, { name: t }),
        e.title
      ]
    }
  ) });
}
function Wr({ branch: e, prefix: t, selected: n, searching: a, expanded: r, onOpen: i, onToggle: o }) {
  return /* @__PURE__ */ g("ul", { className: "qz-note-tree", children: [
    [...e.folders].map(([s, c]) => {
      const u = `${t}${s}/`;
      return /* @__PURE__ */ l("li", { children: /* @__PURE__ */ g("details", { open: a || r.has(u), children: [
        /* @__PURE__ */ g("summary", { title: s, onClick: (p) => {
          a || (p.preventDefault(), o(u));
        }, children: [
          /* @__PURE__ */ l("span", { className: "qz-note-tree-arrow", children: /* @__PURE__ */ l(te, { name: "down" }) }),
          /* @__PURE__ */ l(te, { name: "folder" }),
          /* @__PURE__ */ l("span", { className: "qz-note-tree-name", children: s })
        ] }),
        /* @__PURE__ */ l(
          Wr,
          {
            branch: c,
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
    e.notes.map((s) => /* @__PURE__ */ l(Jr, { note: s, selected: n, onOpen: i }, s.path))
  ] });
}
function Zc({ api: e, active: t, location: n, edits: a, onDraft: r, onLoaded: i, onSave: o, writeBlocked: s, notes: c, onOpen: u, loadBacklinks: p, indexRevision: d, view: f, focusEditor: m, width: h, pinned: x, pinLimitReached: k, onPin: v, onViewChange: q, onWidthChange: w }) {
  const { workspaceId: _, path: E } = n, { draft: b, saved: M, saving: y } = a ?? {}, [T, U] = S(null), B = f === "rendered", [Y, Z] = S(""), [ne, P] = S(null), [R, L] = S(!1), [D, N] = S(!1), [J, H] = S(!1), [V, ue] = S(null), [ce, he] = S(null), [ae, ze] = S(null), ke = re(!1), F = re(null), W = re(null), de = re(null), De = !!b, ee = b ?? M ?? T, pe = ee == null ? void 0 : ee.text, se = R || D || s || (ee == null ? void 0 : ee.lineEnding) === "mixed", Ae = ae && pe !== void 0 ? pe.slice(ae.from, pe.length - (ae.original.length - ae.to)) : "", xe = (ae == null ? void 0 : ae.original) ?? pe, K = !se && !ae, Fe = Oe(() => Dc(c), [c]), ge = Oe(
    () => B && xe !== void 0 ? Fc(xe, Fe, { editable: !se }) : [],
    [B, xe, Fe, se]
  ), ie = `qz-note-column qz-note-column-${h}`, Se = `Up to ${hn} notes can be pinned per folder. Unpin one first.`;
  Ea(() => {
    var z;
    const A = de.current;
    if (!A) return;
    de.current = null;
    const I = ((z = W.current) == null ? void 0 : z.querySelector(A)) ?? W.current;
    I == null || I.focus({ preventScroll: !0 });
  }, [ge]), oe(() => {
    const A = t && !ke.current;
    if (ke.current = t, !t || De || y) return;
    if (M && !A && T) {
      U(M), i(M);
      return;
    }
    let I = !1;
    return L(!0), P(null), _e(an(e, _, E)).then((z) => {
      I || (U(un(z)), i(M), (ee == null ? void 0 : ee.source.hash) !== z.hash && ze(null));
    }).catch((z) => {
      I || P(Ce(z));
    }).finally(() => {
      I || L(!1);
    }), () => {
      I = !0, L(!1);
    };
  }, [t, e, De, E, y, _]), oe(() => {
    if (!p || d == null) return;
    let A = !1;
    return _e(gi(e, _, E)).then((I) => {
      A || (ue(I), he(null));
    }).catch((I) => {
      A || (ue(null), he(Ce(I)));
    }), () => {
      A = !0;
    };
  }, [e, d, p, E, _]);
  const qe = async (A = !1) => {
    if (!(R || y || D)) {
      if (b && !A) {
        H(!0);
        return;
      }
      H(!1), N(!0), P(null), Z("");
      try {
        U(un(await _e(an(e, _, E)))), r(null, b ?? null), i(M), ze(null), Z("Note reloaded.");
      } catch (I) {
        P(Ce(I));
      } finally {
        N(!1);
      }
    }
  }, Ee = (A) => {
    !ee || se || A === ee.text || (Z(""), r({ ...ee, text: A }));
  }, j = (A, I) => {
    if (se || ae || !ee) return;
    const z = Lr(ee.text, A, I);
    z && ze({ start: A, end: I, ...z, original: ee.text });
  }, C = (A, I = !0) => {
    ae && (A ? Ee(ae.original) : se || o(), I && (de.current = `[data-edit-start="${ae.start}"]`), ze(null));
  };
  return /* @__PURE__ */ g("section", { className: "qz-note-editor qz-panel-surface", "aria-label": "Note editor", children: [
    /* @__PURE__ */ g("div", { className: "qz-toolbar qz-note-toolbar", children: [
      /* @__PURE__ */ g("div", { className: "qz-note-toolbar-file", children: [
        /* @__PURE__ */ l("code", { className: "qz-mono qz-path", title: E, children: E }),
        /* @__PURE__ */ l(
          "button",
          {
            type: "button",
            className: "qz-button qz-note-pin-button",
            "data-variant": "quiet",
            "aria-label": "Pin note",
            "aria-pressed": x,
            "aria-disabled": !x && k ? !0 : void 0,
            "aria-describedby": !x && k ? "qz-pin-limit" : void 0,
            title: x ? "Unpin note" : k ? Se : "Pin note",
            onClick: () => {
              (x || !k) && v();
            },
            children: /* @__PURE__ */ l(te, { name: "pin" })
          }
        ),
        !x && k && /* @__PURE__ */ l("span", { id: "qz-pin-limit", className: "qz-muted qz-note-message", role: "status", children: Se })
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-actions", role: "group", "aria-label": "Reading options", children: [
        /* @__PURE__ */ l(
          Yr,
          {
            segments: [{ key: "rendered", label: "Rendered" }, { key: "raw", label: "Raw" }],
            value: f,
            onChange: (A) => {
              ae ? C(!1, !1) : se || o(), q(A);
            },
            ariaLabel: "Note view",
            collapse: !1
          }
        ),
        /* @__PURE__ */ l(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "quiet",
            "aria-pressed": h === "full",
            title: h === "full" ? "Full width is on. Click to return to reading width" : "Use the full width of the page",
            onClick: w,
            children: "Full width"
          }
        )
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-actions", role: "group", "aria-label": "Note actions", children: [
        /* @__PURE__ */ l("span", { className: "qz-muted qz-note-message qz-note-save-status", role: "status", children: y ? "Saving note…" : b ? "Unsaved changes" : Y || (a != null && a.didSave ? "Note saved." : "") }),
        /* @__PURE__ */ l(
          "button",
          {
            ref: F,
            type: "button",
            className: "qz-button qz-icon-button",
            "data-variant": "quiet",
            "aria-label": "Reload from disk",
            title: "Reload from disk",
            disabled: R || y || D,
            onMouseDown: (A) => A.preventDefault(),
            onClick: () => void qe(),
            children: /* @__PURE__ */ l(te, { name: "refresh" })
          }
        ),
        /* @__PURE__ */ l(
          "button",
          {
            type: "button",
            className: "qz-button",
            "data-variant": "primary",
            disabled: !b || b.conflict || se,
            onClick: () => {
              ae ? C(!1) : o();
            },
            children: "Save note"
          }
        )
      ] })
    ] }),
    J && b && /* @__PURE__ */ g(ht, { label: "Replace unsaved draft", onCancel: () => H(!1), children: [
      /* @__PURE__ */ l("p", { children: "Replace your unsaved draft with the version on disk?" }),
      /* @__PURE__ */ g("div", { className: "qz-actions", children: [
        /* @__PURE__ */ l("button", { type: "button", className: "qz-button qz-destructive", onClick: () => void qe(!0), children: "Replace draft" }),
        /* @__PURE__ */ l("button", { type: "button", className: "qz-button", "data-variant": "quiet", onClick: () => H(!1), children: "Keep draft" })
      ] })
    ] }),
    /* @__PURE__ */ l(me, { failure: ne ?? (a == null ? void 0 : a.failure) ?? null }),
    R && !ee && /* @__PURE__ */ l("p", { className: "qz-muted", role: "status", children: "Loading note…" }),
    (b == null ? void 0 : b.conflict) && /* @__PURE__ */ l("div", { className: "qz-notice", role: "alert", children: "The note changed on disk. Your draft is still here. Copy or review your changes before reloading from disk." }),
    (ee == null ? void 0 : ee.lineEnding) === "mixed" && /* @__PURE__ */ l("div", { className: "qz-notice", role: "note", children: "This note has mixed line endings and opens read-only to preserve them." }),
    ee && (B ? /* @__PURE__ */ g(
      "div",
      {
        ref: W,
        className: `qz-notes-rendered qz-note-headings ${ie}`,
        "aria-label": "Markdown preview",
        tabIndex: -1,
        onClick: (A) => {
          if (!(A.target instanceof Element)) return;
          const I = A.target.closest("button.qz-wikilink[data-note-path]"), z = I == null ? void 0 : I.dataset.notePath;
          z && c.some((G) => G.path === z) && u(z);
          const $ = A.target.closest("input.qz-note-task-checkbox[data-note-task-line]");
          if ($ && !se) {
            let G = Number($.dataset.noteTaskLine);
            ae && G >= ae.end && (G += Ae.split(`
`).length - (ae.end - ae.start));
            const Q = Ic(ee.text, G, $.checked);
            Q !== ee.text && (de.current = `input[data-note-task-line="${G}"]`, ze(null), Ee(Q), o());
          }
        },
        children: [
          !ge.length && /* @__PURE__ */ l("p", { className: "qz-muted", children: "No content yet." }),
          ge.map(({ html: A, start: I, end: z }, $) => {
            if (ae && I === ae.start)
              return /* @__PURE__ */ g("div", { className: "qz-note-block-editor", onBlur: (Q) => {
                const X = Q.relatedTarget;
                X === F.current || Rn(X) || X instanceof Node && Q.currentTarget.contains(X) || C(!1, !1);
              }, children: [
                /* @__PURE__ */ l(
                  "textarea",
                  {
                    "aria-label": "Block Markdown",
                    className: "qz-input qz-note-block-text",
                    autoFocus: !0,
                    spellCheck: !1,
                    rows: Math.max(2, (z ?? I + 1) - I),
                    readOnly: se,
                    value: Ae,
                    onChange: (Q) => Ee(ae.original.slice(0, ae.from) + Q.target.value + ae.original.slice(ae.to)),
                    onKeyDown: (Q) => {
                      Q.nativeEvent.isComposing || (Q.key === "Escape" || Q.key === "Enter" && (Q.metaKey || Q.ctrlKey)) && (Q.preventDefault(), Q.stopPropagation(), C(Q.key === "Escape"));
                    }
                  }
                ),
                /* @__PURE__ */ g("div", { className: "qz-actions", children: [
                  /* @__PURE__ */ g("span", { className: "qz-muted qz-note-message qz-block-hint", children: [
                    "Esc cancels · ",
                    Uc ? "⌘" : "Ctrl",
                    "+Enter saves"
                  ] }),
                  /* @__PURE__ */ l(
                    "button",
                    {
                      type: "button",
                      className: "qz-button",
                      onMouseDown: (Q) => Q.preventDefault(),
                      onClick: () => C(!1),
                      children: "Done"
                    }
                  ),
                  /* @__PURE__ */ l(
                    "button",
                    {
                      type: "button",
                      className: "qz-button",
                      "data-variant": "quiet",
                      onMouseDown: (Q) => Q.preventDefault(),
                      onClick: () => C(!0),
                      children: "Cancel"
                    }
                  )
                ] })
              ] }, $);
            const G = K && I !== void 0 && z !== void 0;
            return /* @__PURE__ */ g("div", { className: "qz-note-block", children: [
              /* @__PURE__ */ l(
                "div",
                {
                  className: G ? "qz-note-block-content" : void 0,
                  onClick: G ? (Q) => {
                    var X;
                    Q.target instanceof Element && !Q.target.closest("a, button, input, summary") && !((X = window.getSelection()) != null && X.toString()) && j(I, z);
                  } : void 0,
                  dangerouslySetInnerHTML: { __html: A }
                }
              ),
              G && /* @__PURE__ */ l(
                "button",
                {
                  type: "button",
                  className: "qz-button qz-note-edit-block",
                  "data-edit-start": I,
                  "aria-label": `Edit block at line ${I + 1}`,
                  title: "Edit block",
                  onClick: () => j(I, z),
                  children: /* @__PURE__ */ l(te, { name: "edit" })
                }
              )
            ] }, $);
          })
        ]
      }
    ) : /* @__PURE__ */ g("label", { className: `qz-field qz-note-source ${ie}`, children: [
      "Note Markdown",
      /* @__PURE__ */ l(
        "textarea",
        {
          autoFocus: m,
          className: "qz-input qz-note-text",
          spellCheck: !1,
          value: ee.text,
          readOnly: se,
          onChange: (A) => Ee(A.target.value),
          onBlur: (A) => {
            !se && A.relatedTarget !== F.current && !Rn(A.relatedTarget) && o();
          }
        }
      )
    ] })),
    ee && (ce || !!(V != null && V.notes.length)) && /* @__PURE__ */ g("section", { className: "qz-note-backlinks", "aria-label": "Backlinks", children: [
      /* @__PURE__ */ l("h3", { children: "Backlinks" }),
      /* @__PURE__ */ l(me, { failure: ce }),
      V && /* @__PURE__ */ l("ul", { children: V.notes.map((A) => /* @__PURE__ */ l("li", { children: /* @__PURE__ */ l("button", { type: "button", className: "qz-wikilink", title: A.path, onClick: () => u(A.path), children: A.title }) }, A.path)) }),
      (V == null ? void 0 : V.truncated) && /* @__PURE__ */ g("p", { className: "qz-muted", children: [
        "Only the first ",
        V.notes.length,
        " backlinks are shown."
      ] })
    ] })
  ] });
}
const Kc = [
  ["Indigo", "#6757c7"],
  ["Blue", "#19589f"],
  ["Teal", "#147864"],
  ["Rose", "#ad3563"]
];
function Gc(e, t) {
  const n = document.createElement("canvas");
  n.width = n.height = 1;
  const a = n.getContext("2d", { willReadFrequently: !0 });
  if (!a) return null;
  a.fillStyle = t, a.fillRect(0, 0, 1, 1);
  const [r, i, o] = a.getImageData(0, 0, 1, 1).data;
  a.fillStyle = e, a.fillRect(0, 0, 1, 1);
  const [s, c, u] = a.getImageData(0, 0, 1, 1).data, p = rn(r, i, o), d = rn(s, c, u);
  return (Math.max(p, d) + 0.05) / (Math.min(p, d) + 0.05);
}
function xt({ label: e, value: t, onChange: n, disabled: a, allowAccent: r = !0, checkContrast: i = !1 }) {
  const o = Xr(), s = t !== "theme" && t !== "accent", [c, u] = S(s ? t : ""), [p, d] = S(null), f = re(null);
  oe(() => u(s ? t : ""), [t, s]), oe(() => {
    const x = f.current;
    if (!x || t === "theme" || a) return;
    const k = () => {
      const w = getComputedStyle(x);
      d(Gc(w.color, w.backgroundColor));
    };
    k();
    const v = new MutationObserver(k);
    for (let w = x.parentElement; w; w = w.parentElement)
      v.observe(w, { attributes: !0, attributeFilter: ["class", "style", "data-theme", "data-color-scheme"] });
    const q = matchMedia("(prefers-color-scheme: dark)");
    return q.addEventListener("change", k), () => {
      v.disconnect(), q.removeEventListener("change", k);
    };
  }, [a, t]);
  const m = s && !/^#?[0-9a-f]{6}$/i.test(c), h = i && t !== "theme" && !a && p !== null && p < 4.5;
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
            "aria-describedby": h ? `${o}-contrast` : void 0,
            onChange: (x) => n(x.currentTarget.value === "custom" ? Pt : Xe(x.currentTarget.value)),
            children: [
              /* @__PURE__ */ l("option", { value: "theme", children: "Theme default" }),
              r && /* @__PURE__ */ l("option", { value: "accent", children: "Theme accent" }),
              /* @__PURE__ */ l("option", { value: "custom", children: "Custom color" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ l(
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
    s && /* @__PURE__ */ g(ve, { children: [
      /* @__PURE__ */ g("div", { className: "qz-settings-color-mode", children: [
        /* @__PURE__ */ g("label", { className: "qz-field", children: [
          "Hex color",
          /* @__PURE__ */ l(
            "input",
            {
              className: "qz-input qz-mono",
              "aria-label": `${e} hex`,
              value: c,
              disabled: a,
              placeholder: Pt,
              maxLength: 7,
              spellCheck: !1,
              "aria-invalid": m || void 0,
              "aria-describedby": m ? `${o}-format` : void 0,
              onChange: (x) => {
                const k = x.currentTarget.value;
                u(k);
                const v = k.match(/^#?([0-9a-f]{6})$/i);
                v && n(Xe(`#${v[1].toLowerCase()}`));
              }
            }
          )
        ] }),
        /* @__PURE__ */ l(
          "input",
          {
            className: "qz-input",
            type: "color",
            "aria-label": `Custom ${e.toLowerCase()}`,
            value: t,
            disabled: a,
            onChange: (x) => n(Xe(x.currentTarget.value))
          }
        )
      ] }),
      m && /* @__PURE__ */ g("p", { id: `${o}-format`, className: "qz-muted", children: [
        "Use six hexadecimal digits, for example ",
        Pt,
        "."
      ] }),
      /* @__PURE__ */ l("div", { className: "qz-color-swatches", role: "group", "aria-label": `${e} swatches`, children: Kc.map(([x, k]) => /* @__PURE__ */ l(
        "button",
        {
          type: "button",
          title: x,
          "aria-label": x,
          "aria-pressed": t === k,
          disabled: a,
          style: { backgroundColor: k },
          onClick: () => n(k)
        },
        k
      )) })
    ] }),
    i && /* @__PURE__ */ l("span", { hidden: !0, ref: f, style: { color: Ke(t), backgroundColor: "var(--qz-canvas)" } }),
    h && /* @__PURE__ */ g("p", { id: `${o}-contrast`, className: "qz-notice", role: "status", children: [
      "Low contrast on the current background (",
      p.toFixed(2),
      ":1). Aim for at least 4.5:1."
    ] })
  ] });
}
function $t() {
  const [e, t] = S(!1), [n, a] = S(null);
  return { busy: e, failure: n, run: async (i) => {
    t(!0), a(null);
    try {
      return await i(), !0;
    } catch (o) {
      return a(Ce(o)), !1;
    } finally {
      t(!1);
    }
  } };
}
const ka = {
  defaults: "Defaults",
  appearance: "Appearance",
  notes: "Notes",
  board: "Board",
  folders: "Folders",
  agents: "Bots & agents"
}, Xc = {
  loading: "Loading preferences…",
  saving: "Saving…",
  saved: "Saved",
  local: "Saved in this browser. Waiting to sync.",
  unavailable: "Preferences couldn’t be saved."
}, Yc = { tasks: "Tasks", todos: "TODOs", notes: "Notes", settings: "Settings" };
function Vc({
  api: e,
  preferences: t,
  onPreferencesChange: n,
  status: a,
  section: r,
  onSectionChange: i,
  workspaceId: o,
  onWorkspaceChange: s,
  onWorkspacesChanged: c
}) {
  var M;
  const [u, p] = S(null), [d, f] = S(null), [m, h] = S(null), [x, k] = S(/* @__PURE__ */ new Set()), [v, q] = S(0), w = r ?? (u === null ? d ? "folders" : null : u.length ? "defaults" : "folders"), _ = (u == null ? void 0 : u.filter((y) => y.companion)) ?? [], E = _.find((y) => y.id === o), b = () => {
    q((y) => y + 1), c();
  };
  return oe(() => {
    let y = !1;
    return Promise.all([Aa(e), Mt(e)]).then(([T, U]) => {
      y || (p(T), h(U.writeBlocked ?? null), k(/* @__PURE__ */ new Set([
        ...T.filter((B) => B.missing).map((B) => B.id),
        ...U.workspaces.filter(({ index: B }) => {
          var Y;
          return typeof B.error == "object" && ((Y = B.error) == null ? void 0 : Y.code) === "root_missing";
        }).map(({ workspace: B }) => B.id)
      ])), f(null));
    }).catch((T) => !y && f(Ce(T))), () => {
      y = !0;
    };
  }, [e, v]), /* @__PURE__ */ g("div", { className: "qz-settings", children: [
    /* @__PURE__ */ g("header", { className: "qz-settings-header", children: [
      /* @__PURE__ */ l("h2", { className: "qz-section-title", children: "Settings" }),
      /* @__PURE__ */ l("span", { className: "qz-muted qz-settings-saved", role: "status", children: Xc[a] })
    ] }),
    /* @__PURE__ */ l("nav", { "aria-label": "Settings sections", className: "qz-settings-nav", children: Object.keys(ka).map((y) => /* @__PURE__ */ l(
      "button",
      {
        type: "button",
        className: "qz-button",
        "aria-current": w === y ? "true" : void 0,
        onClick: () => i(y),
        children: ka[y]
      },
      y
    )) }),
    /* @__PURE__ */ l(me, { failure: d }),
    /* @__PURE__ */ l(me, { failure: m }),
    !w && /* @__PURE__ */ l("p", { className: "qz-muted qz-loading", role: "status", children: "Loading settings…" }),
    w === "defaults" && /* @__PURE__ */ g(et, { title: "Defaults", children: [
      /* @__PURE__ */ g("div", { className: "qz-settings-fields", children: [
        /* @__PURE__ */ l(
          Ze,
          {
            label: "Start on",
            value: t.startOn,
            options: { last: "Last used tab", ...Yc },
            onChange: (y) => n({ startOn: y })
          }
        ),
        /* @__PURE__ */ g("label", { className: "qz-field", children: [
          "Default workspace",
          /* @__PURE__ */ g("select", { className: "qz-input", value: t.workspaceId && _.some((y) => y.id === t.workspaceId) ? String(t.workspaceId) : "", onChange: (y) => s(Number(y.currentTarget.value) || null), children: [
            /* @__PURE__ */ l("option", { value: "", children: "First connected folder" }),
            _.map((y) => {
              var T;
              return /* @__PURE__ */ l("option", { value: y.id, children: [(T = t.folderAppearance[y.id]) == null ? void 0 : T.emoji, y.name].filter(Boolean).join(" ") }, y.id);
            })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ l("p", { className: "qz-muted", children: "Changing the workspace here or in the header remembers that folder for your next visit." })
    ] }),
    w === "appearance" && /* @__PURE__ */ l(et, { title: "Appearance", children: /* @__PURE__ */ g("div", { className: "qz-settings-fields", children: [
      /* @__PURE__ */ l(
        xt,
        {
          label: "Accent color",
          value: t.accent,
          allowAccent: !1,
          checkContrast: !0,
          onChange: (y) => n({ accent: y })
        }
      ),
      /* @__PURE__ */ g("div", { className: "qz-stack", children: [
        /* @__PURE__ */ g("label", { className: "qz-settings-check", children: [
          /* @__PURE__ */ l(
            "input",
            {
              className: "qz-settings-toggle",
              type: "checkbox",
              role: "switch",
              checked: t.highContrast,
              onChange: (y) => n({ highContrast: y.currentTarget.checked })
            }
          ),
          "High contrast"
        ] }),
        /* @__PURE__ */ g("label", { className: "qz-settings-check", children: [
          /* @__PURE__ */ l(
            "input",
            {
              className: "qz-settings-toggle",
              type: "checkbox",
              role: "switch",
              checked: t.largerInterfaceText,
              onChange: (y) => n({ largerInterfaceText: y.currentTarget.checked })
            }
          ),
          "Larger interface text"
        ] }),
        /* @__PURE__ */ l(
          Ze,
          {
            label: "Motion",
            value: t.motion,
            options: { system: "Follow system", reduced: "Reduce motion" },
            onChange: (y) => n({ motion: y })
          }
        )
      ] })
    ] }) }),
    w === "notes" && /* @__PURE__ */ l(eu, { preferences: t, onPreferencesChange: n }),
    /* @__PURE__ */ g("div", { className: "qz-stack", hidden: w !== "board", children: [
      /* @__PURE__ */ l(et, { title: "Board view", children: /* @__PURE__ */ l($a, { preferences: t, onPreferencesChange: n, workspace: E }) }),
      /* @__PURE__ */ g(et, { title: "Board columns", children: [
        /* @__PURE__ */ l("p", { className: "qz-muted", children: "Customize columns for each enabled folder. Use Save columns to apply your changes." }),
        !_.length && /* @__PURE__ */ l("button", { className: "qz-button", type: "button", onClick: () => i("folders"), children: "Manage folders" }),
        _.map((y) => /* @__PURE__ */ g("section", { "aria-label": y.name, className: "qz-settings-board-folder", children: [
          /* @__PURE__ */ l("h4", { children: y.name }),
          /* @__PURE__ */ l(
            nu,
            {
              api: e,
              workspace: y,
              onSaved: (T) => p((U) => (U == null ? void 0 : U.map((B) => B.id === T.id ? { ...B, ...T } : B)) ?? null)
            }
          )
        ] }, y.id))
      ] })
    ] }),
    w === "agents" && /* @__PURE__ */ l(et, { title: "Bots & agents", children: /* @__PURE__ */ l(au, { defaultFolder: ((M = _.find((y) => y.id === t.workspaceId) ?? _[0]) == null ? void 0 : M.name) ?? null }) }),
    w === "folders" && /* @__PURE__ */ g("div", { className: "qz-settings-grid", "data-empty": (u == null ? void 0 : u.length) === 0 || void 0, children: [
      (u == null ? void 0 : u.length) !== 0 && /* @__PURE__ */ g("section", { className: "qz-settings-folders", "aria-labelledby": "qz-settings-folders", children: [
        /* @__PURE__ */ l("div", { className: "qz-settings-heading", children: /* @__PURE__ */ l("h3", { id: "qz-settings-folders", children: "Connected folders" }) }),
        !u && !d && /* @__PURE__ */ l("p", { className: "qz-muted", role: "status", children: "Loading folders…" }),
        u == null ? void 0 : u.map((y) => /* @__PURE__ */ l(
          tu,
          {
            api: e,
            workspace: y,
            writeBlocked: m,
            missing: x.has(y.id),
            onChanged: b,
            preferences: t,
            onPreferencesChange: n
          },
          y.id
        ))
      ] }),
      /* @__PURE__ */ l(Qc, { api: e, onAdded: (y) => {
        s(y.id), b();
      } }),
      (u == null ? void 0 : u.length) === 0 && /* @__PURE__ */ l(et, { title: "Get started", children: /* @__PURE__ */ g("ol", { className: "qz-onboarding", children: [
        /* @__PURE__ */ l("li", { children: "Add a folder that contains or will hold Markdown files." }),
        /* @__PURE__ */ l("li", { children: "Open Notes and create your first note." }),
        /* @__PURE__ */ l("li", { children: "Open Tasks and create a ticket or turn an existing note into one." })
      ] }) })
    ] })
  ] });
}
function et({ title: e, children: t }) {
  return /* @__PURE__ */ g("section", { className: "qz-panel-surface qz-settings-panel", "aria-label": e, children: [
    /* @__PURE__ */ l("div", { className: "qz-settings-heading", children: /* @__PURE__ */ l("h3", { children: e }) }),
    t
  ] });
}
function Ze({ label: e, value: t, options: n, onChange: a }) {
  return /* @__PURE__ */ g("label", { className: "qz-field", children: [
    e,
    /* @__PURE__ */ l("select", { className: "qz-input", value: t, onChange: (r) => a(r.currentTarget.value), children: Object.entries(n).map(([r, i]) => /* @__PURE__ */ l("option", { value: r, children: i }, r)) })
  ] });
}
function Qc({ api: e, onAdded: t }) {
  var k;
  const [n, a] = S(""), [r, i] = S(""), [o, s] = S(null), { busy: c, failure: u, run: p } = $t(), d = n.trim(), f = d.startsWith("/"), m = (o == null ? void 0 : o.path) === d ? o : null, h = d && !f ? "Enter an absolute folder path starting with /." : (k = m == null ? void 0 : m.failure) == null ? void 0 : k.message;
  oe(() => {
    if (!f) return;
    const v = new AbortController(), q = setTimeout(() => {
      e.post(`${Je}/workspaces/validate`, { path: d }, { signal: v.signal }).then(() => {
        v.signal.aborted || s({ path: d, failure: null });
      }).catch((w) => {
        if (v.signal.aborted) return;
        const _ = Ce(w);
        _.code && _.status && _.status < 500 && _.code !== "not_found" && s({ path: d, failure: _ });
      });
    }, 300);
    return () => {
      clearTimeout(q), v.abort();
    };
  }, [e, f, d]);
  const x = () => p(async () => {
    const v = await ri(e, d, r.trim() || void 0);
    a(""), i(""), s(null), t(v);
  });
  return /* @__PURE__ */ g(
    "form",
    {
      className: "qz-panel-surface qz-settings-add",
      "aria-labelledby": "qz-settings-add",
      "aria-busy": c,
      onSubmit: (v) => {
        v.preventDefault(), f && !h && !c && x();
      },
      children: [
        /* @__PURE__ */ g("div", { children: [
          /* @__PURE__ */ l("h3", { id: "qz-settings-add", children: "Add a folder" }),
          /* @__PURE__ */ l("p", { className: "qz-muted", children: "Enter the path to a local folder. To use the same files in Kiro Notes, attach it there too." })
        ] }),
        /* @__PURE__ */ g("div", { children: [
          /* @__PURE__ */ g("label", { className: "qz-field", children: [
            "Folder path",
            /* @__PURE__ */ l(
              "input",
              {
                className: "qz-input",
                placeholder: "/home/you/notes",
                value: n,
                disabled: c,
                "aria-invalid": !!h,
                "aria-describedby": "qz-folder-path-check",
                onChange: (v) => {
                  a(v.target.value), s(null);
                }
              }
            )
          ] }),
          /* @__PURE__ */ l("p", { className: "qz-muted", id: "qz-folder-path-check", role: "status", children: h || (m ? "Folder is ready to connect." : "") })
        ] }),
        /* @__PURE__ */ g("label", { className: "qz-field", children: [
          /* @__PURE__ */ g("span", { children: [
            "Name ",
            /* @__PURE__ */ l("span", { className: "qz-muted", children: "(optional)" })
          ] }),
          /* @__PURE__ */ l("input", { className: "qz-input", placeholder: "e.g. Project notes", value: r, disabled: c, onChange: (v) => i(v.target.value) })
        ] }),
        /* @__PURE__ */ l("button", { className: "qz-button", "data-variant": "primary", type: "submit", disabled: c || !f || !!h, children: "Add folder" }),
        /* @__PURE__ */ l(me, { failure: u })
      ]
    }
  );
}
const xa = { small: "Small", medium: "Medium", large: "Large" };
function eu({ preferences: e, onPreferencesChange: t }) {
  const { appearance: n } = e, a = (i) => t({ appearance: { ...n, ...i } }), r = n.headingColor === "theme" && n.headingLines === "theme" && n.lineColor === "theme";
  return /* @__PURE__ */ g(ve, { children: [
    /* @__PURE__ */ l(et, { title: "Reading and editing", children: /* @__PURE__ */ g("div", { className: "qz-settings-fields", children: [
      /* @__PURE__ */ l(
        Ze,
        {
          label: "Note view",
          value: e.noteView,
          options: { rendered: "Rendered", raw: "Raw" },
          onChange: (i) => t({ noteView: i })
        }
      ),
      /* @__PURE__ */ l(
        Ze,
        {
          label: "Reading width",
          value: e.noteWidth,
          options: Lc,
          onChange: (i) => t({ noteWidth: i })
        }
      ),
      /* @__PURE__ */ l(
        Ze,
        {
          label: "Reading text size",
          value: e.noteTextSize,
          options: xa,
          onChange: (i) => t({ noteTextSize: i })
        }
      ),
      /* @__PURE__ */ l(
        Ze,
        {
          label: "Raw editor text size",
          value: e.rawTextSize,
          options: xa,
          onChange: (i) => t({ rawTextSize: i })
        }
      ),
      /* @__PURE__ */ l(
        Ze,
        {
          label: "Line spacing",
          value: e.noteLineHeight,
          options: { compact: "Compact", normal: "Normal", relaxed: "Relaxed" },
          onChange: (i) => t({ noteLineHeight: i })
        }
      ),
      /* @__PURE__ */ l(
        Ze,
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
        /* @__PURE__ */ l("h3", { id: "qz-note-appearance", children: "Notes appearance" }),
        /* @__PURE__ */ l(
          "button",
          {
            className: "qz-button",
            type: "button",
            "data-variant": "quiet",
            disabled: r,
            onClick: () => t({ appearance: Sa }),
            children: "Reset defaults"
          }
        )
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-settings-fields", children: [
        /* @__PURE__ */ l(xt, { label: "Heading text color", value: n.headingColor, checkContrast: !0, onChange: (i) => a({ headingColor: i }) }),
        /* @__PURE__ */ g("div", { className: "qz-settings-color-mode", children: [
          /* @__PURE__ */ g("label", { className: "qz-field", children: [
            "Heading lines",
            /* @__PURE__ */ g("select", { className: "qz-input", value: n.headingLines, onChange: (i) => a({ headingLines: Ta(i.currentTarget.value) }), children: [
              /* @__PURE__ */ l("option", { value: "theme", children: "Theme default" }),
              /* @__PURE__ */ l("option", { value: "all", children: "Under every heading" }),
              /* @__PURE__ */ l("option", { value: "none", children: "None" })
            ] })
          ] }),
          /* @__PURE__ */ l(
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
        /* @__PURE__ */ l(
          xt,
          {
            label: "Heading line color",
            value: n.lineColor,
            disabled: n.headingLines === "none",
            checkContrast: !0,
            onChange: (i) => a({ lineColor: i })
          }
        )
      ] }),
      /* @__PURE__ */ l("div", { className: "qz-settings-fields", children: ["Light", "Dark"].map((i) => /* @__PURE__ */ g(
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
            /* @__PURE__ */ l("h2", { children: "Project notes" }),
            /* @__PURE__ */ l("h3", { children: "Next steps" }),
            /* @__PURE__ */ l("p", { children: "Draft the plan and share it with the team." })
          ]
        },
        i
      )) })
    ] })
  ] });
}
function tu(e) {
  const { api: t, workspace: n, preferences: a, onPreferencesChange: r } = e, i = a.folderAppearance[n.id] ?? Oc, o = (h) => {
    r({ folderAppearance: { [n.id]: { ...i, ...h } } });
  }, { busy: s, failure: c, run: u } = $t(), [p, d] = S(null), [f, m] = S(!1);
  return oe(() => {
    if (!p) return;
    const h = setTimeout(() => d(null), 3e3);
    return () => clearTimeout(h);
  }, [p]), /* @__PURE__ */ g("section", { "aria-label": n.name, className: "qz-panel-surface qz-settings-folder", children: [
    /* @__PURE__ */ g("div", { className: "qz-settings-folder-identity", children: [
      /* @__PURE__ */ l("span", { className: "qz-settings-folder-icon", "aria-hidden": "true", style: { color: Ke(i.color) }, children: i.emoji || /* @__PURE__ */ l(te, { name: "folder" }) }),
      /* @__PURE__ */ g("div", { children: [
        /* @__PURE__ */ l("h4", { children: n.name }),
        /* @__PURE__ */ l("code", { className: "qz-mono qz-muted", children: n.path })
      ] })
    ] }),
    e.missing && /* @__PURE__ */ g("div", { role: "note", className: "qz-notice qz-error qz-settings-missing", children: [
      /* @__PURE__ */ l("strong", { children: "This folder is missing." }),
      " ",
      n.path,
      " no longer exists on disk. Restore or reconnect it, or remove it here.",
      n.companion && " Turn off “Include in Tasks, Notes, and TODOs” to hide it from the other views."
    ] }),
    /* @__PURE__ */ g("div", { className: "qz-settings-folder-controls", children: [
      /* @__PURE__ */ g("label", { className: "qz-settings-check", children: [
        /* @__PURE__ */ l(
          "input",
          {
            className: "qz-settings-toggle",
            type: "checkbox",
            role: "switch",
            checked: !!n.companion,
            disabled: s,
            onChange: () => void u(() => oi(t, n.id, !n.companion)).then((h) => h && e.onChanged())
          }
        ),
        "Include in Tasks, Notes, and TODOs"
      ] }),
      /* @__PURE__ */ l("div", { className: "qz-settings-actions", children: !f && /* @__PURE__ */ l("button", { className: "qz-button", "data-variant": "quiet", type: "button", onClick: () => m(!0), disabled: s, children: "Remove…" }) })
    ] }),
    /* @__PURE__ */ g("div", { className: "qz-settings-fields", children: [
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "Folder emoji",
        /* @__PURE__ */ l(
          "input",
          {
            className: "qz-input",
            placeholder: "Optional",
            value: i.emoji,
            maxLength: 16,
            onChange: (h) => o({ emoji: Pr(h.currentTarget.value) })
          }
        )
      ] }),
      /* @__PURE__ */ l(xt, { label: "Folder color", value: i.color, onChange: (h) => o({ color: h }) })
    ] }),
    /* @__PURE__ */ g("details", { className: "qz-settings-disclosure", children: [
      /* @__PURE__ */ l("summary", { children: "Advanced" }),
      /* @__PURE__ */ g("div", { className: "qz-stack", children: [
        n.companion && /* @__PURE__ */ g("div", { className: "qz-stack", children: [
          /* @__PURE__ */ l("p", { className: "qz-muted", children: "Rescan all notes if Tasks, Notes, or TODOs is missing recent changes." }),
          /* @__PURE__ */ l("div", { children: /* @__PURE__ */ l(
            "button",
            {
              className: "qz-button",
              "data-variant": "quiet",
              type: "button",
              disabled: s,
              onClick: () => void u(() => mn(t, { workspaceId: n.id, manual: !0, rebuild: !0 })).then((h) => h && d("Folder rescan requested.")),
              children: "Rescan folder"
            }
          ) })
        ] }),
        /* @__PURE__ */ l(ru, { workspace: n }),
        !!n.oldTasks && /* @__PURE__ */ l(iu, { api: t, workspace: n, writeBlocked: e.writeBlocked, onChanged: e.onChanged })
      ] })
    ] }),
    f && /* @__PURE__ */ g(ht, { label: "Remove folder", className: "qz-notice qz-settings-notice", onCancel: () => m(!1), children: [
      /* @__PURE__ */ g("p", { children: [
        "Stop showing “",
        n.name,
        "” in Quartizo? Your folder and files stay on disk.",
        !!n.oldTasks && ` Removing this folder also deletes its ${n.oldTasks} saved task(s) from the old Quartizo board.`
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ l(
          "button",
          {
            className: "qz-button",
            "data-destructive": !0,
            type: "button",
            onClick: () => void u(() => si(t, n.id, !!n.oldTasks)).then((h) => h && e.onChanged()),
            disabled: s,
            children: n.oldTasks ? `Remove and delete ${n.oldTasks} task(s)` : "Remove"
          }
        ),
        /* @__PURE__ */ l("button", { className: "qz-button", "data-variant": "quiet", type: "button", onClick: () => m(!1), disabled: s, children: "Cancel" })
      ] })
    ] }),
    p && /* @__PURE__ */ l("span", { className: "qz-muted", role: "status", children: p }),
    /* @__PURE__ */ l(me, { failure: c })
  ] });
}
function nu({ api: e, workspace: t, onSaved: n }) {
  const [a, r] = S(null), [i, o] = S(""), [s, c] = S(null), [u, p] = S(""), { busy: d, failure: f, run: m } = $t(), h = (a == null ? void 0 : a.columns) ?? t.columns, x = s ?? i.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 32), k = h.length < 20 && !!i.trim() && /^[a-z][a-z0-9_]{0,31}$/.test(x) && x !== "repair" && !h.some((b) => b.id === x), v = t.columns.some((b) => !h.some((M) => M.id === b.id)), q = (b) => {
    r({ columns: b, version: (a == null ? void 0 : a.version) ?? t.columnsVersion }), p("");
  }, w = (b, M) => {
    const y = [...h], [T] = y.splice(b, 1);
    y.splice(b + M, 0, T), q(y);
  }, _ = () => m(async () => {
    if (!a) return;
    const b = await ii(e, t.id, h, a.version);
    n(b), r(null), p("Board columns saved.");
  }), E = JSON.stringify(h) !== JSON.stringify(t.columns);
  return /* @__PURE__ */ l(ve, { children: /* @__PURE__ */ l(ve, { children: /* @__PURE__ */ g("div", { className: "qz-stack", children: [
    /* @__PURE__ */ l("p", { className: "qz-muted", children: "The first column is the default for new tickets." }),
    /* @__PURE__ */ l("ul", { className: "qz-column-list", children: h.map((b, M) => /* @__PURE__ */ g("li", { className: "qz-column-row", children: [
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        /* @__PURE__ */ l("span", { className: "qz-mono", children: b.id }),
        /* @__PURE__ */ l(
          "input",
          {
            className: "qz-input",
            "aria-label": `Name for ${b.id}`,
            value: b.label,
            maxLength: 40,
            disabled: d,
            onChange: (y) => q(h.map((T) => T.id === b.id ? { ...T, label: y.target.value } : T))
          }
        )
      ] }),
      /* @__PURE__ */ l(
        xt,
        {
          label: `Color for ${b.id}`,
          value: Xe(b.color),
          allowAccent: !1,
          disabled: d,
          onChange: (y) => q(h.map((T) => T.id !== b.id ? T : y === "theme" ? { id: T.id, label: T.label } : { ...T, color: y }))
        }
      ),
      /* @__PURE__ */ g("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ l("button", { className: "qz-button", type: "button", "aria-label": `Move column ${b.id} up`, disabled: d || M === 0, onClick: () => w(M, -1), children: /* @__PURE__ */ l(te, { name: "up" }) }),
        /* @__PURE__ */ l("button", { className: "qz-button", type: "button", "aria-label": `Move column ${b.id} down`, disabled: d || M === h.length - 1, onClick: () => w(M, 1), children: /* @__PURE__ */ l(te, { name: "down" }) }),
        /* @__PURE__ */ l("button", { className: "qz-button", type: "button", "aria-label": `Remove column ${b.id}`, disabled: d || h.length === 1, onClick: () => q(h.filter((y) => y.id !== b.id)), children: "Remove" })
      ] })
    ] }, b.id)) }),
    h.length < 20 && /* @__PURE__ */ g("form", { className: "qz-column-row", onSubmit: (b) => {
      b.preventDefault(), !(d || !k) && (q([...h, { id: x, label: i.trim() }]), o(""), c(null));
    }, children: [
      /* @__PURE__ */ g("label", { className: "qz-field", children: [
        "New column name",
        /* @__PURE__ */ l("input", { className: "qz-input", value: i, maxLength: 40, disabled: d, onChange: (b) => o(b.target.value) })
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-stack", children: [
        /* @__PURE__ */ g("label", { className: "qz-field", children: [
          "New status value",
          /* @__PURE__ */ l(
            "input",
            {
              className: "qz-input qz-mono",
              value: x,
              maxLength: 32,
              disabled: d,
              "aria-describedby": `qz-column-id-${t.id}`,
              onChange: (b) => c(b.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ l("p", { className: "qz-muted", id: `qz-column-id-${t.id}`, children: "The status value is saved as “status:” in your Markdown notes. Quartizo suggests it from the name. Use lowercase letters, digits and underscores, starting with a letter." })
      ] }),
      /* @__PURE__ */ l("button", { className: "qz-button", type: "submit", disabled: d || !k, children: "Add column" })
    ] }),
    v && /* @__PURE__ */ l("p", { className: "qz-notice", children: "Tickets in removed columns move to Needs repair. Move those tickets to an active column or restore the old status ID." }),
    /* @__PURE__ */ g("div", { className: "qz-settings-actions", children: [
      /* @__PURE__ */ l("button", { className: "qz-button", "data-variant": "primary", type: "button", disabled: d || !E || h.some((b) => !b.label.trim()), onClick: () => void _(), children: "Save columns" }),
      E && /* @__PURE__ */ l("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: d, onClick: () => {
        r(null), p("");
      }, children: "Discard changes" }),
      /* @__PURE__ */ l("span", { className: "qz-muted", role: "status", children: u })
    ] }),
    /* @__PURE__ */ l(me, { failure: f })
  ] }) }) });
}
const wa = `kirocrew agent create --name notes --display-name "Notes"
kirocrew agent update notes --kiro-agent quartizo-notes`;
function au({ defaultFolder: e }) {
  const [t, n] = S(""), a = re(null), r = async () => {
    var i, o;
    try {
      await navigator.clipboard.writeText(wa), n("Commands copied.");
    } catch {
      (i = a.current) == null || i.focus(), (o = a.current) == null || o.select(), n("Copy the selected commands.");
    }
  };
  return /* @__PURE__ */ g("div", { className: "qz-stack", children: [
    /* @__PURE__ */ g("p", { children: [
      "Quartizo installs the ",
      /* @__PURE__ */ l("strong", { children: "quartizo-notes" }),
      " agent. Use it from ",
      /* @__PURE__ */ l("strong", { children: "Ask a Bot or agent" }),
      ", the KiroCrew Command Bar, or the chat agent picker."
    ] }),
    /* @__PURE__ */ g("p", { className: "qz-muted", children: [
      e ? /* @__PURE__ */ g(ve, { children: [
        "When you don’t name a folder, it works in your default workspace, now ",
        /* @__PURE__ */ l("strong", { children: e }),
        ". Change it under Defaults."
      ] }) : "Connect a folder under Folders so the agent has somewhere to work.",
      " ",
      "Add an ",
      /* @__PURE__ */ l("code", { children: "AGENTS.md" }),
      " at a folder’s root to tell it how that vault works."
    ] }),
    /* @__PURE__ */ l("h4", { children: "Keep it as a Bot" }),
    /* @__PURE__ */ g("p", { className: "qz-muted", children: [
      "A Bot built on this agent has its own chat, memory and name, and stays current when Quartizo updates. In KiroCrew, open ",
      /* @__PURE__ */ l("strong", { children: "Customize → Bots" }),
      " and choose ",
      /* @__PURE__ */ l("strong", { children: "New Bot" }),
      ". Once it’s created, click its card and set ",
      /* @__PURE__ */ l("strong", { children: "Built from" }),
      " (under General, last option) to ",
      /* @__PURE__ */ l("strong", { children: "quartizo-notes" }),
      ". It saves right away. Or run:"
    ] }),
    /* @__PURE__ */ l("textarea", { ref: a, className: "qz-input qz-mono qz-agent-prompt", "aria-label": "Bot commands", value: wa, rows: 2, readOnly: !0 }),
    /* @__PURE__ */ g("div", { className: "qz-settings-actions", children: [
      /* @__PURE__ */ g("button", { type: "button", className: "qz-button", onClick: () => void r(), children: [
        /* @__PURE__ */ l(te, { name: "copy" }),
        "Copy commands"
      ] }),
      /* @__PURE__ */ l("span", { className: "qz-muted", role: "status", children: t })
    ] })
  ] });
}
function ru({ workspace: e }) {
  const t = Vr(e.path, e.columns), n = re(null), [a, r] = S(""), i = async () => {
    var o, s;
    try {
      await navigator.clipboard.writeText(t), r("Agent prompt copied.");
    } catch {
      (o = n.current) == null || o.focus(), (s = n.current) == null || s.select(), r("Copy the selected text to use the prompt.");
    }
  };
  return /* @__PURE__ */ g("div", { className: "qz-stack", children: [
    /* @__PURE__ */ l("div", { className: "qz-settings-actions", children: /* @__PURE__ */ l(pn, { workspace: e, variant: "primary" }) }),
    e.companion ? /* @__PURE__ */ g("details", { className: "qz-settings-disclosure", children: [
      /* @__PURE__ */ l("summary", { children: "Agent instructions" }),
      /* @__PURE__ */ g("div", { className: "qz-stack", children: [
        /* @__PURE__ */ l("p", { className: "qz-muted", children: "Pick a Bot or agent in the KiroCrew chat composer, then add your request and send it. The agent needs access to this folder." }),
        /* @__PURE__ */ l("textarea", { ref: n, className: "qz-input qz-mono qz-agent-prompt", "aria-label": "Agent prompt", value: t, rows: 8, readOnly: !0 }),
        /* @__PURE__ */ g("div", { className: "qz-settings-actions", children: [
          /* @__PURE__ */ g("button", { type: "button", className: "qz-button", onClick: () => void i(), children: [
            /* @__PURE__ */ l(te, { name: "copy" }),
            "Copy agent prompt"
          ] }),
          /* @__PURE__ */ l("span", { className: "qz-muted", role: "status", children: a })
        ] })
      ] })
    ] }) : /* @__PURE__ */ l("p", { className: "qz-muted", children: "Enable this folder to ask a Bot about its notes and tickets." })
  ] });
}
function iu({ api: e, workspace: t, writeBlocked: n, onChanged: a }) {
  const [r, i] = S(null), [o, s] = S(null), [c, u] = S(!1), [p, d] = S(!1), { busy: f, failure: m, run: h } = $t(), x = async () => {
    const v = await Ei(e, t.id), q = URL.createObjectURL(new Blob([JSON.stringify(v, null, 2)], { type: "application/json" })), w = document.createElement("a");
    w.href = q, w.download = `quartizo-old-tasks-${t.id}.json`, w.click(), setTimeout(() => URL.revokeObjectURL(q), 1e3), u(!0);
  }, k = async () => {
    if (!r) return;
    const v = await yi(e, t.id, r.planHash, p);
    s(v), i(null), a();
  };
  return /* @__PURE__ */ g("section", { className: "qz-settings-migration", "aria-label": `Old tasks in ${t.name}`, children: [
    /* @__PURE__ */ l("strong", { children: "Old task migration" }),
    /* @__PURE__ */ g("p", { className: "qz-muted", children: [
      "Convert ",
      t.oldTasks,
      " saved ",
      t.oldTasks === 1 ? "task" : "tasks",
      " from the old board into Markdown ticket notes."
    ] }),
    /* @__PURE__ */ g("div", { className: "qz-settings-actions", children: [
      /* @__PURE__ */ l("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: f, onClick: () => void h(x), children: "Export old tasks" }),
      /* @__PURE__ */ l("button", { className: "qz-button", type: "button", disabled: f || !t.companion, onClick: () => void h(async () => {
        i(await _i(e, t.id)), s(null), d(!1);
      }), children: "Preview migration" })
    ] }),
    c && /* @__PURE__ */ l("span", { className: "qz-muted", role: "status", children: "Export downloaded." }),
    r && /* @__PURE__ */ g(ht, { label: "Confirm old task migration", className: "qz-notice qz-settings-notice", onCancel: () => i(null), children: [
      /* @__PURE__ */ g("strong", { children: [
        "Create ",
        r.tasks.filter((v) => !v.migrated).length,
        " ticket note(s)"
      ] }),
      /* @__PURE__ */ l("p", { children: "Quartizo backs up the database tasks before writing each ticket to a new file." }),
      r.warnings.map((v, q) => /* @__PURE__ */ l("p", { children: v }, q)),
      /* @__PURE__ */ l("ul", { className: "qz-settings-migration-files", children: r.tasks.map((v) => /* @__PURE__ */ g("li", { children: [
        v.title,
        " → ",
        /* @__PURE__ */ l("code", { children: v.path }),
        " (",
        v.status,
        ")",
        v.migrated && " · already migrated",
        v.noteRef && /* @__PURE__ */ g("span", { children: [
          " · linked note: ",
          v.noteRef
        ] }),
        v.slotId && /* @__PURE__ */ g("span", { children: [
          " · session: ",
          v.slotId
        ] })
      ] }, v.uid)) }),
      r.tasks.some((v) => v.changed) && !r.complete && /* @__PURE__ */ g("label", { className: "qz-settings-check", children: [
        /* @__PURE__ */ l("input", { type: "checkbox", checked: p, onChange: (v) => d(v.target.checked), disabled: f }),
        "I reviewed the changed converted notes; keep their latest contents when resuming"
      ] }),
      /* @__PURE__ */ g("div", { className: "qz-settings-actions", children: [
        /* @__PURE__ */ l("button", { className: "qz-button", "data-variant": "primary", type: "button", disabled: f || !!n || r.complete || !r.tasks.length, onClick: () => void h(k), children: r.backup ? "Resume and verify migration" : "Back up and migrate" }),
        /* @__PURE__ */ l("button", { className: "qz-button", "data-variant": "quiet", type: "button", disabled: f, onClick: () => i(null), children: "Cancel" })
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
    /* @__PURE__ */ l(me, { failure: m })
  ] });
}
const en = `${Je}/preferences`, tn = 5e3, su = 3e4;
function Rt(e, t) {
  return {
    ...e,
    ...t,
    ...t.noteFolders && { noteFolders: { ...e.noteFolders, ...t.noteFolders } },
    ...t.folderAppearance && { folderAppearance: { ...e.folderAppearance, ...t.folderAppearance } },
    ...t.laneSort && { laneSort: { ...e.laneSort, ...t.laneSort } }
  };
}
function nn(e, t) {
  const n = Object.entries(t).filter(([a, r]) => (e == null ? void 0 : e[a]) !== r);
  return n.length ? Object.fromEntries(n) : void 0;
}
function qa(e, t) {
  const { noteFolders: n, folderAppearance: a, laneSort: r, ...i } = t, o = Object.fromEntries(Object.entries(i).filter(([p, d]) => e[p] !== d)), s = n && nn(e.noteFolders, n), c = a && nn(e.folderAppearance, a), u = r && nn(e.laneSort, r);
  return s && (o.noteFolders = s), c && (o.folderAppearance = c), u && (o.laneSort = u), o;
}
const ou = /* @__PURE__ */ new Set(["lastTab"]);
function lu(e) {
  const [t, n] = S($c), a = re(t), r = re(), [i, o] = S("loading"), [s, c] = S(!1), u = Ye((d) => (a.current = d, n(d), va(d)), []), p = Ye((d) => {
    var h;
    const f = a.current, m = qa(f.values, d);
    Object.keys(m).length && (u({ ...f, values: Rt(f.values, m), pending: Rt(f.pending, m) }), (h = r.current) == null || h.call(r));
  }, [u]);
  return oe(() => {
    let d = !1, f = !1, m = !1, h;
    const x = () => ({ signal: AbortSignal.timeout(tn) }), k = async () => {
      if (!(d || f)) {
        clearTimeout(h), f = !0;
        try {
          if (!m) {
            const { legacy: v } = a.current, q = await _e(Object.keys(v).length ? e.patch(en, { changes: v, onlyIfMissing: !0 }, x()) : e.get(en, x()), tn);
            if (d) return;
            const { pending: w } = a.current;
            u({ values: Rt(Ft(q.preferences), w), pending: w, legacy: {} }), m = !0;
          }
          for (; Object.keys(a.current.pending).length; ) {
            const v = a.current.pending;
            Object.keys(v).some((_) => !ou.has(_)) && o("saving");
            const q = await _e(e.patch(en, { changes: v }, x()), tn);
            if (d) return;
            const w = qa(v, a.current.pending);
            u({ values: Rt(Ft(q.preferences), w), pending: w, legacy: {} });
          }
          o("saved");
        } catch {
          if (d) return;
          o(va(a.current) ? "local" : "unavailable"), h = setTimeout(() => void k(), su);
        } finally {
          f = !1, d || c(!0);
        }
      }
    };
    return r.current = () => void k(), k(), () => {
      d = !0, clearTimeout(h), r.current = void 0;
    };
  }, [e, u]), { preferences: t.values, status: i, ready: s, update: p };
}
const cu = '.qz-app{--qz-canvas: var(--bg, Canvas);--qz-surface: var(--card, Canvas);--qz-elevated: var(--bg-elevated, Canvas);--qz-border: var(--border, color-mix(in srgb, CanvasText 18%, Canvas));--qz-text: var(--text-strong, CanvasText);--qz-muted: color-mix(in srgb, var(--muted, CanvasText) 78%, var(--qz-text));--qz-scale: 1;--qz-action-size: 32px;--qz-accent: var(--qz-accent-override, var(--accent, LinkText));--qz-accent-soft: var(--accent-subtle, color-mix(in srgb, var(--qz-accent) 13%, transparent));--qz-link: color-mix(in srgb, var(--qz-accent) 70%, var(--qz-text));--qz-ok: var(--ok, #4e9a6b);--qz-warning: var(--warn, #ad7628);--qz-danger: var(--danger, #c7465d);--qz-info: var(--info, var(--qz-accent));container:qz-app / inline-size;width:100%;max-width:1560px;min-width:0;margin-inline:auto;padding:24px clamp(16px,3%,40px) 36px;color:var(--qz-text)}.qz-app,.qz-app *{box-sizing:border-box}.qz-app [hidden]{display:none!important}.qz-app[data-contrast=high]{--qz-border: var(--qz-text);--qz-muted: var(--qz-text)}.qz-app[data-accent=custom]{--qz-accent-soft: color-mix(in srgb, var(--qz-accent) 13%, transparent)}.qz-app[data-motion=reduced] :where(*,*:before,*:after){animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}@media (prefers-reduced-motion: reduce){.qz-app :where(*,*:before,*:after){animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}.qz-app :where(h1,h2,h3,p,ul){margin:0}.qz-app :where(button,input,textarea,select){font:inherit}.qz-app :is(button,summary,input,textarea,select,.qz-board):focus-visible{outline:2px solid var(--qz-accent);outline-offset:2px}.qz-app :is(button,input,textarea,select):disabled{opacity:.55;cursor:default}.qz-app input[type=checkbox]{accent-color:var(--qz-accent)}.qz-icon{width:1rem;height:1rem;flex:none}.qz-header,.qz-brand,.qz-tabs,.qz-view-heading,.qz-toolbar,.qz-actions,.qz-inline-field{display:flex;align-items:center;min-width:0}.qz-header,.qz-view-heading,.qz-toolbar{justify-content:space-between;flex-wrap:wrap;gap:12px 20px}.qz-header{padding:0 0 12px;border-bottom:1px solid var(--qz-border)}.qz-brand{gap:9px}.qz-mark{display:grid;place-items:center;flex:none;width:36px;height:36px;border:1px solid color-mix(in srgb,var(--qz-accent) 34%,var(--qz-border));border-radius:13px;background:linear-gradient(145deg,var(--qz-accent-soft),var(--qz-surface));color:var(--qz-accent)}.qz-mark .qz-icon{width:21px;height:21px}.qz-brand h1{font-size:calc(21px * var(--qz-scale, 1));font-weight:700;letter-spacing:-.035em;line-height:1.1}.qz-workspace{flex:0 1 auto;max-width:100%}.qz-workspace .qz-input{max-width:min(240px,65vw)}.qz-folder-dot{width:12px;height:12px;flex:none;border:1px solid var(--qz-border);border-radius:50%}.qz-return{justify-self:start;margin-block-end:6px}.qz-preference-notice{margin-block-end:12px}.qz-tabs{max-width:100%;gap:3px;padding:4px;border:1px solid var(--qz-border);border-radius:12px;background:var(--qz-surface)}.qz-tabs button{display:flex;align-items:center;justify-content:center;gap:7px;min-height:36px;padding:6px 12px;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--qz-muted);font-size:calc(13px * var(--qz-scale, 1));font-weight:600;cursor:pointer}.qz-tabs button:hover{color:var(--qz-text);background:var(--qz-elevated)}.qz-tabs button[aria-selected=true]{border-color:color-mix(in srgb,var(--qz-accent) 25%,var(--qz-border));background:var(--qz-accent-soft);color:var(--qz-text)}.qz-tabs button[aria-selected=true] .qz-icon{color:var(--qz-accent)}.qz-content{padding-top:24px}.qz-stack{display:grid;gap:14px;min-width:0}.qz-section-title{font-size:calc(27px * var(--qz-scale, 1));font-weight:700;letter-spacing:-.032em;line-height:1.17}.qz-section-description{margin-top:5px;color:var(--qz-muted)}.qz-muted{color:var(--qz-muted);font-weight:400}.qz-mono{font:400 calc(12px * var(--qz-scale, 1))/1.5 var(--mono, ui-monospace, monospace)}.qz-path{display:block;min-width:0;overflow:hidden;color:var(--qz-muted);text-overflow:ellipsis;white-space:nowrap}.qz-note-headings :is(h1,h2,h3,h4,h5,h6){color:var(--qz-note-heading-color, var(--qz-preview-text, var(--qz-text)));line-height:1.25;font-weight:600}.qz-note-headings h1{font-size:1.802em;font-weight:700}.qz-note-headings h2{font-size:1.602em}.qz-note-headings h3{font-size:1.422em}.qz-note-headings h4{font-size:1.278em}.qz-note-headings h5{font-size:1.121em}.qz-note-headings h6{font-size:1em}.qz-app[data-note-heading-lines=theme] .qz-note-headings :is(h1,h2),.qz-app[data-note-heading-lines=all] .qz-note-headings :is(h1,h2,h3,h4,h5,h6){padding-block-end:.25em;border-block-end:1px solid var(--qz-note-line-color, var(--mdnb-heading-rule-soft, var(--qz-border)))}.qz-app[data-note-heading-lines=theme] .qz-note-headings :is(h3,h4,h5,h6){padding-inline-start:8px;margin-inline-start:-10px;border-inline-start:2px solid var(--qz-note-line-color, var(--mdnb-heading-rail, var(--qz-border)))}.qz-actions{gap:6px;flex-wrap:wrap}.qz-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;max-width:100%;min-height:36px;padding:5px 11px;border:1px solid var(--qz-border);border-radius:8px;background:var(--qz-surface);color:var(--qz-text);font-size:calc(13px * var(--qz-scale, 1));font-weight:600;text-align:center;cursor:pointer}.qz-button:not(:disabled):hover{background:var(--qz-elevated);border-color:var(--border-strong, var(--qz-muted))}.qz-button[data-variant=primary]{border-color:var(--qz-accent);background:var(--qz-accent);color:var(--accent-fg, var(--qz-canvas))}.qz-button[data-variant=primary]:not(:disabled):hover{border-color:var(--accent-hover, var(--qz-accent));background:var(--accent-hover, var(--qz-accent))}.qz-app[data-accent=custom] .qz-button[data-variant=primary]{color:var(--qz-accent-foreground, var(--qz-canvas))}.qz-app[data-accent=custom] .qz-button[data-variant=primary]:not(:disabled):hover{border-color:var(--qz-accent);background:color-mix(in srgb,var(--qz-accent) 90%,var(--qz-canvas))}.qz-button[data-variant=quiet]{border-color:transparent;background:transparent;color:var(--qz-muted)}.qz-button[data-variant=quiet]:not(:disabled):hover{color:var(--qz-text)}.qz-icon-button{min-width:36px;padding-inline:8px}.qz-input{min-width:0;max-width:100%;min-height:36px;padding:6px 9px;border:1px solid var(--qz-border);border-radius:8px;background:var(--qz-elevated);color:var(--qz-text);font-size:calc(13px * var(--qz-scale, 1))}.qz-input::placeholder{color:var(--qz-muted);opacity:1}.qz-field{display:grid;gap:5px;min-width:0;font-size:calc(13px * var(--qz-scale, 1));font-weight:600}.qz-field .qz-input{width:100%;font-weight:400}.qz-inline-field{gap:8px;color:var(--qz-muted);font-size:calc(13px * var(--qz-scale, 1))}.qz-inline-field .qz-input{max-width:min(36ch,52%);font-weight:600}.qz-check-label{display:flex;align-items:center;gap:8px}.qz-panel-surface{min-width:0;border:1px solid var(--qz-border);border-radius:12px;background:var(--qz-surface)}.qz-notice{padding:11px 13px;border:1px solid color-mix(in srgb,var(--qz-warning) 42%,var(--qz-border));border-radius:9px;background:color-mix(in srgb,var(--qz-warning) 7%,var(--qz-surface));font-size:calc(13px * var(--qz-scale, 1));overflow-wrap:anywhere}.qz-notice[data-variant=neutral]{border-color:var(--qz-border);background:var(--qz-surface)}.qz-notice.qz-error{border-color:color-mix(in srgb,var(--qz-danger) 53%,var(--qz-border));background:color-mix(in srgb,var(--qz-danger) 9%,var(--qz-surface))}.qz-empty{display:grid;place-items:center;gap:8px;padding:28px 16px;border:1px dashed var(--qz-border);border-radius:12px;color:var(--qz-muted);text-align:center}.qz-empty :is(h2,h3){color:var(--qz-text);font-size:calc(17px * var(--qz-scale, 1));font-weight:650}.qz-empty .qz-button{margin-top:4px}.qz-empty-icon,.qz-note-icon{display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:9px;background:var(--qz-accent-soft);color:var(--qz-accent)}.qz-visually-hidden{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.qz-board-meta{gap:2px 12px;padding-block:2px}.qz-board-meta>.qz-actions{margin-inline-start:auto}.qz-result-count{color:var(--qz-muted);font-size:calc(12px * var(--qz-scale, 1));font-weight:600}.qz-index{display:inline-flex;align-items:baseline;gap:7px;color:var(--qz-muted);font-size:calc(12px * var(--qz-scale, 1))}.qz-index:empty{display:none}.qz-board{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(172px,1fr);gap:10px;min-width:0;padding:2px 2px 10px;overflow-x:auto;overscroll-behavior-inline:contain}.qz-lane{--qz-status: var(--qz-muted);min-width:0;min-height:308px;padding:9px;border:1px solid color-mix(in srgb,var(--qz-status) 20%,var(--qz-border));border-radius:12px;background:linear-gradient(180deg,color-mix(in srgb,var(--qz-status) 7%,var(--qz-surface)),var(--qz-surface) 105px)}.qz-app [data-lane-status=ready]{--qz-status: var(--qz-info)}.qz-app [data-lane-status=in_progress]{--qz-status: var(--qz-accent)}.qz-app [data-lane-status=review]{--qz-status: var(--qz-warning)}.qz-app [data-lane-status=done]{--qz-status: var(--qz-ok)}.qz-app [data-lane-status=repair]{--qz-status: var(--qz-danger)}.qz-lane-heading{display:flex;align-items:center;gap:7px;padding:3px 2px 10px;font-size:calc(13px * var(--qz-scale, 1));font-weight:650;overflow-wrap:anywhere}.qz-dot{width:8px;height:8px;flex:none;border-radius:50%;background:var(--qz-status, var(--qz-ok))}.qz-dot[data-attention=true]{background:var(--qz-warning)}.qz-count{margin-inline-start:auto;padding:1px 6px;border:1px solid var(--qz-border);border-radius:999px;color:var(--qz-muted);font-size:calc(12px * var(--qz-scale, 1));font-variant-numeric:tabular-nums}.qz-lane-empty{padding:11px;border:1px dashed var(--qz-border);border-radius:8px;color:var(--qz-muted);font-size:calc(12px * var(--qz-scale, 1));text-align:center}.qz-cards,.qz-todo-list{list-style:none;padding:0}.qz-cards{display:grid;gap:8px}.qz-cards li{min-width:0}.qz-cards li[draggable=true]{cursor:grab}.qz-cards li[draggable=true]:active{cursor:grabbing}.qz-ticket{border:1px solid var(--qz-border);border-radius:9px;background:var(--qz-elevated);box-shadow:var(--shadow-sm, none)}.qz-ticket:hover,.qz-ticket:focus-within{border-color:var(--border-strong, var(--qz-muted))}.qz-ticket-content{display:grid;gap:5px;padding:10px 10px 8px}.qz-note-link{display:flex;align-items:start;justify-content:space-between;gap:6px;padding:0;border:0;background:transparent;color:var(--qz-text);font-size:calc(14px * var(--qz-scale, 1));font-weight:650;line-height:1.4;text-align:start;overflow-wrap:anywhere;cursor:pointer}.qz-note-link .qz-icon{width:13px;height:13px;margin-top:3px;color:var(--qz-muted)}.qz-note-link:hover{text-decoration:underline}.qz-ticket-progress{display:flex;align-items:center;gap:8px;margin-top:3px;color:var(--qz-muted);font-size:calc(12px * var(--qz-scale, 1));font-variant-numeric:tabular-nums}.qz-ticket-progress progress{width:min(54px,40%);height:5px;accent-color:var(--qz-ok);border:0;border-radius:6px;overflow:hidden}.qz-ticket-progress progress::-webkit-progress-bar{background:var(--qz-border)}.qz-ticket-progress progress::-webkit-progress-value{border-radius:6px;background:var(--qz-ok)}.qz-badge{padding:2px 5px;border-radius:5px;background:color-mix(in srgb,var(--qz-warning) 17%,var(--qz-surface));font-size:calc(12px * var(--qz-scale, 1));overflow-wrap:anywhere}.qz-ticket-footer{position:relative;padding:5px;border-top:1px solid var(--qz-border)}.qz-ticket-status{padding-inline-end:calc(var(--qz-action-size) + 7px)}.qz-ticket-status .qz-input{width:100%;min-height:var(--qz-action-size);padding:3px 6px;border-color:var(--qz-border);background:var(--qz-surface);color:var(--qz-text)}.qz-ticket-status .qz-input:not(:disabled):hover{background:var(--qz-elevated);border-color:var(--border-strong, var(--qz-muted))}.qz-ticket-actions summary{position:absolute;inset-block-start:5px;inset-inline-end:5px;min-height:var(--qz-action-size);min-width:var(--qz-action-size);list-style:none}.qz-ticket-actions summary::-webkit-details-marker{display:none}.qz-ticket-action-list{display:grid;gap:1px;margin-top:5px;padding-top:5px;border-top:1px solid var(--qz-border)}.qz-ticket-action-list .qz-button{justify-content:start;min-height:32px;text-align:start}.qz-ticket-action-list .qz-destructive:not(:disabled),.qz-notice .qz-destructive:not(:disabled){color:var(--qz-danger)}.qz-app [role=alertdialog]:focus-visible{outline:2px solid var(--qz-accent);outline-offset:2px}.qz-lane[data-drop-target]{border-color:var(--qz-accent);box-shadow:0 0 0 2px var(--qz-accent-soft),inset 0 0 0 1px var(--qz-accent)}.qz-cards li[data-drop-before]{box-shadow:0 -3px 0 -1px var(--qz-accent)}.qz-cards li[data-drop-before]{position:relative}.qz-cards li[data-drop-before]:before{content:"";position:absolute;inset-inline:0;inset-block-start:-6px;height:3px;border-radius:2px;background:var(--qz-accent)}.qz-ticket-form{display:grid;gap:12px;max-width:630px;padding:16px}.qz-ticket-form h3{font-size:calc(17px * var(--qz-scale, 1));font-weight:650}.qz-note-preview{max-height:180px;margin:0;padding:10px;overflow:auto;background:var(--qz-canvas);white-space:pre-wrap;overflow-wrap:anywhere}.qz-todos{width:100%;max-width:1100px;margin-inline:auto}.qz-todo-filters{display:flex;flex-wrap:wrap;gap:12px;padding:12px}.qz-todo-filters .qz-field{flex:1 1 135px}.qz-todo-filters .qz-field:first-child{flex:3 1 245px}.qz-search{position:relative;display:block}.qz-search .qz-icon{position:absolute;inset-block-start:10px;inset-inline-start:9px;color:var(--qz-muted);pointer-events:none}.qz-search .qz-input{padding-inline-start:32px}.qz-todo-header{display:flex;align-items:center;gap:10px;min-width:0;padding:12px 14px}.qz-todo-identity{flex:1;min-width:0}.qz-todo-identity h3{display:flex;align-items:center;flex-wrap:wrap;gap:5px 9px;font-size:calc(15px * var(--qz-scale, 1));font-weight:650;overflow-wrap:anywhere}.qz-todo-meta{display:flex;align-items:baseline;gap:6px;color:var(--qz-muted);font-size:calc(12px * var(--qz-scale, 1))}.qz-todo-meta>span:first-child{min-width:0;overflow-wrap:anywhere}.qz-status-pill{--qz-status: var(--qz-muted);display:inline-flex;align-items:center;gap:5px;padding:1px 7px;border-radius:999px;background:color-mix(in srgb,var(--qz-status) 13%,var(--qz-surface));font-size:calc(12px * var(--qz-scale, 1));font-weight:500}.qz-status-pill .qz-dot{width:6px;height:6px}.qz-todo-row{display:flex;align-items:center;border-top:1px solid var(--qz-border)}.qz-todo-row:hover,.qz-todo-row:focus-within{background:var(--qz-elevated)}.qz-todo-row:last-child{border-radius:0 0 12px 12px}.qz-todo-check{display:flex;align-items:baseline;gap:10px;flex:1;min-width:0;padding:10px 14px;overflow-wrap:anywhere;cursor:pointer}.qz-todo-check input{flex:none;align-self:start;width:16px;height:16px;margin:2px 0 0}.qz-todo-check:has(input:disabled){cursor:default}.qz-todo-row[data-checked=true] .qz-todo-check span{color:var(--qz-muted);text-decoration:line-through}.qz-todo-row>.qz-button{margin-inline-end:6px}@container qz-app (max-width: 650px){.qz-board{grid-auto-columns:clamp(170px,65cqi,244px)}}@container qz-app (max-width: 520px){.qz-header{gap:14px;padding-bottom:14px}.qz-tabs{width:100%;order:1}.qz-tabs button{flex:1;gap:5px;padding-inline:5px}.qz-content{padding-top:18px}.qz-section-title{font-size:calc(24px * var(--qz-scale, 1))}.qz-inline-field{width:100%}.qz-inline-field .qz-input{flex:1;max-width:none}.qz-board-meta>.qz-actions{margin-inline-start:0}.qz-todo-filters .qz-field:first-child{flex-basis:100%}.qz-todo-header{padding-inline:10px}.qz-todo-header .qz-note-icon{display:none}}@media (pointer: coarse){.qz-app{--qz-action-size: 44px}.qz-app :is(.qz-button,.qz-tabs button,.qz-input,.qz-ticket-status .qz-input,.qz-ticket-actions summary,.qz-note-tree :is(summary,button),.qz-todo-check,.qz-settings-check,.qz-note-link){min-height:44px}.qz-app :is(.qz-icon-button,.qz-color-swatches button){min-width:44px}.qz-color-swatches button{min-height:44px}.qz-todo-check input{width:22px;height:22px}.qz-note-link{align-items:center}}@media (hover: none){.qz-note-block .qz-note-edit-block{opacity:1}}@container qz-app (max-width: 360px){.qz-tabs .qz-icon{display:none}.qz-workspace .qz-input{max-width:min(140px,40vw)}}.qz-app[data-interface-text=large]{--qz-scale: 1.2}.qz-loading{padding:8px 2px}.qz-board-hint{font-size:calc(12px * var(--qz-scale, 1))}.qz-menu{position:relative}.qz-menu-list{position:absolute;inset-block-start:calc(100% + 4px);inset-inline-end:0;z-index:5;display:grid;gap:2px;min-width:200px;padding:4px;background:var(--qz-elevated);box-shadow:var(--shadow-md, 0 6px 20px rgb(0 0 0 / .18))}.qz-menu-list .qz-button{justify-content:start;width:100%;text-align:start}.qz-board-wrap{position:relative;min-width:0}.qz-board-wrap:before,.qz-board-wrap:after{content:"";position:absolute;inset-block:0;z-index:1;width:28px;opacity:0;pointer-events:none;transition:opacity .15s}.qz-board-wrap:before{inset-inline-start:0;background:linear-gradient(to right,var(--qz-canvas),transparent)}.qz-board-wrap:after{inset-inline-end:0;background:linear-gradient(to left,var(--qz-canvas),transparent)}.qz-board-wrap[data-more-start]:before,.qz-board-wrap[data-more-end]:after{opacity:.9}', uu = '.qz-start-checklist{margin:0;padding-inline-start:1.5em;text-align:start}.qz-board-view-panel{padding:14px}.qz-board-view-settings{display:flex;flex-wrap:wrap;align-items:start;gap:16px 24px;font-size:calc(13px * var(--qz-scale, 1))}.qz-board-view-settings>.qz-check-label{align-self:center}.qz-board-setting-group{display:grid;gap:8px;min-inline-size:0;margin:0;padding:0;border:0}.qz-board-setting-group legend{margin-bottom:6px;padding:0;font-weight:600}.qz-board-order-group{flex-basis:100%}.qz-board-order-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,145px),1fr));gap:8px 12px}.qz-board[data-density=compact]{gap:6px}.qz-board[data-density=compact] .qz-lane{padding:6px}.qz-board[data-density=compact] .qz-lane-heading{padding-block-end:6px}.qz-board[data-density=compact] .qz-cards{gap:4px}.qz-board[data-density=compact] .qz-ticket-content{gap:2px;padding:6px}.qz-board[data-density=compact] .qz-ticket-footer{padding-block:2px}.qz-board[data-density=compact] .qz-ticket-actions summary{inset-block-start:2px}.qz-lane-help{margin:0 2px 8px;font-size:calc(12px * var(--qz-scale, 1))}.qz-folder-label{display:inline-flex;align-items:center;gap:4px;overflow-wrap:anywhere}.qz-folder-label-dot{flex:none;width:.55em;height:.55em;border-radius:50%;background:var(--qz-folder-label-color)}.qz-ticket-badges{flex-wrap:wrap}.qz-ticket-badges .qz-folder-label{padding:2px 5px;border:1px solid var(--qz-border);border-radius:5px;font-size:calc(12px * var(--qz-scale, 1))}.qz-todo-saved-filters{flex-basis:100%}.qz-todo-saved-filters summary{display:inline-flex;width:fit-content;list-style:none}.qz-todo-saved-filters summary::-webkit-details-marker{display:none}.qz-todo-saved-filters summary:after{content:"▾";color:var(--qz-muted)}.qz-todo-saved-filters[open] summary:after{content:"▴"}.qz-todo-saved-controls{display:grid;gap:8px;padding-block-start:10px}.qz-todo-saved-row{display:flex;flex-wrap:wrap;align-items:end;gap:8px}.qz-todo-filters .qz-todo-saved-row .qz-field{flex:0 1 240px}.qz-todo-saved-row>p{flex-basis:100%;font-size:calc(13px * var(--qz-scale, 1))}.qz-header{display:grid;grid-template-columns:1fr auto 1fr;align-items:center}.qz-header>.qz-workspace{justify-self:end}@container qz-app (max-width: 860px){.qz-header{display:flex}}.qz-success{display:flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid color-mix(in srgb,var(--qz-ok) 45%,var(--qz-border));border-radius:9px;background:color-mix(in srgb,var(--qz-ok) 9%,var(--qz-surface));font-size:calc(13px * var(--qz-scale, 1))}.qz-success .qz-icon{color:var(--qz-ok)}.qz-notice-action{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px}.qz-form-hint,.qz-field-hint{font-size:calc(12px * var(--qz-scale, 1));font-weight:400}.qz-todo-heading{color:var(--qz-muted);font-size:.9em}@media (pointer: coarse){.qz-board-hint{display:none}}', du = ".qz-notes-layout{display:grid;grid-template-columns:minmax(190px,1fr) minmax(0,3fr);gap:14px;align-items:start}.qz-note-browser,.qz-note-editor,.qz-note-create{display:grid;gap:12px;padding:14px}.qz-note-browser{max-height:72vh;overflow:auto}.qz-note-browser-heading{display:flex;align-items:center;gap:8px;min-width:0;font-size:calc(15px * var(--qz-scale, 1));overflow-wrap:anywhere}.qz-note-browser-icon{display:inline-flex;flex:none;color:var(--qz-accent)}.qz-note-pins{display:grid;gap:5px}.qz-note-pins h4{margin:0;font-size:calc(13px * var(--qz-scale, 1))}.qz-note-create{grid-template-columns:minmax(0,1fr) auto;align-items:end}.qz-note-create .qz-error{grid-column:1 / -1}.qz-note-tree{display:grid;gap:3px;padding:0;list-style:none}.qz-note-tree .qz-note-tree{margin-inline-start:10px}.qz-note-tree :is(summary,button){width:100%;min-height:32px;padding:5px 7px;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--qz-text);text-align:start;overflow-wrap:anywhere;cursor:pointer}.qz-note-tree :is(summary,button){display:flex;align-items:center;gap:7px}.qz-note-tree summary{list-style:none}.qz-note-tree summary::-webkit-details-marker{display:none}.qz-note-tree-arrow{display:flex;flex:none;transform:rotate(-90deg)}.qz-note-tree details[open]>summary>.qz-note-tree-arrow{transform:none}.qz-note-tree-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.qz-note-tree :is(summary,button):hover{background:var(--qz-elevated)}.qz-note-tree button[aria-current=true]{border-color:color-mix(in srgb,var(--qz-accent) 26%,var(--qz-border));background:var(--qz-accent-soft)}.qz-note-toolbar{gap:8px}.qz-note-toolbar-file{display:flex;flex:1 1 18ch;align-items:center;gap:6px;min-width:0}.qz-note-toolbar-file .qz-path{min-width:0}.qz-note-toolbar .qz-note-pin-button{flex:none;padding-inline:8px}.qz-note-pin-button[aria-pressed=true]{color:var(--qz-accent);background:var(--qz-accent-soft)}.qz-note-column{width:100%;max-width:800px;margin-inline:auto;padding-inline:20px}.qz-note-column-narrow{max-width:620px}.qz-note-column-wide{max-width:1000px}.qz-note-column-full{max-width:none}.qz-note-text,.qz-note-block-text{resize:vertical;font:400 var(--qz-note-raw-size, 16px)/var(--qz-note-line-height, 1.55) var(--mono, ui-monospace, monospace)}.qz-app:has(.qz-notes-tab:not([hidden]) .qz-note-source),.qz-content:has(>.qz-notes-tab:not([hidden]) .qz-note-source),.qz-notes-tab:has(.qz-note-source),.qz-notes-view:has(.qz-note-source),.qz-note-editor:has(.qz-note-source),.qz-note-source{display:flex;flex:1;flex-direction:column}.qz-notes-layout:has(.qz-note-source){flex:1}.qz-note-editor:has(.qz-note-source){align-self:stretch}.qz-note-text{flex:1 0 auto;min-height:360px}.qz-note-message{font-size:calc(12px * var(--qz-scale, 1))}.qz-note-message:empty{display:none}.qz-note-save-status{white-space:nowrap}.qz-note-pin-button[aria-disabled=true]{opacity:.55;cursor:default}.qz-notes-rendered{min-width:0;min-height:360px;padding-block:14px 32px;font:400 var(--qz-note-text-size, 16px)/var(--qz-note-line-height, 1.55) var(--qz-note-font, var(--font-body, sans-serif));overflow-wrap:anywhere}.qz-notes-rendered :is(p,ul,ol,pre,blockquote,table,h1,h2,h3,h4,h5,h6){margin:0 0 .9em}.qz-notes-rendered :is(ul,ol){padding-inline-start:1.5em}.qz-notes-rendered :is(code,pre){font-family:var(--mono, ui-monospace, monospace);font-size:.9em}.qz-notes-rendered pre code{font-size:inherit}.qz-notes-rendered pre{overflow-x:auto;padding:10px;border:1px solid var(--qz-border);border-radius:6px;background:var(--qz-elevated)}.qz-notes-rendered blockquote{padding:6px 12px;border-inline-start:3px solid var(--qz-border)}.qz-notes-rendered blockquote>:last-child{margin-block-end:0}.qz-notes-rendered :not(pre)>code{padding:.1em .3em;border-radius:4px;background:var(--qz-elevated)}.qz-notes-rendered :is(.hljs-keyword,.hljs-selector-tag,.hljs-meta){color:color-mix(in srgb,var(--qz-accent) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-string,.hljs-regexp){color:color-mix(in srgb,var(--qz-ok) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-number,.hljs-literal,.hljs-variable){color:color-mix(in srgb,var(--qz-warning) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-title,.hljs-attr,.hljs-built_in,.hljs-attribute){color:color-mix(in srgb,var(--qz-info) 65%,var(--qz-text))}.qz-notes-rendered :is(.hljs-comment,.hljs-quote){color:var(--qz-muted);font-style:italic}.qz-notes-rendered table{display:block;border-collapse:collapse;overflow-x:auto}.qz-notes-rendered :is(th,td){padding:5px 8px;border:1px solid var(--qz-border)}.qz-notes-rendered a{color:var(--qz-link)}.qz-note-task{list-style:none}.qz-note-task-checkbox{accent-color:var(--qz-accent);margin-inline:0 .25em}.qz-note-task-completed>.qz-note-task-text,.qz-note-task-completed>p>.qz-note-task-text{color:var(--qz-muted);text-decoration:line-through}.qz-note-block{position:relative;display:flow-root}.qz-note-block-content{cursor:text}.qz-note-block .qz-note-edit-block{position:absolute;inset-block-start:0;inset-inline-end:-20px;min-height:24px;width:24px;padding:2px;color:var(--qz-muted);opacity:0}.qz-note-block:hover .qz-note-edit-block,.qz-note-edit-block:focus-visible{opacity:1}.qz-note-block-editor{display:grid;gap:6px;margin-block-end:.9em}.qz-note-block-editor .qz-actions{justify-content:end}.qz-block-hint{margin-inline-end:auto}.qz-wikilink{max-width:100%;padding:0;border:0;background:transparent;color:var(--qz-link);font:inherit;text-align:start;text-decoration:underline;overflow-wrap:anywhere;cursor:pointer}.qz-note-backlinks{border-top:1px solid var(--qz-border);padding-top:12px}.qz-note-backlinks h3{margin:0 0 6px;font-size:calc(14px * var(--qz-scale, 1))}.qz-note-backlinks ul{display:grid;gap:4px;margin:0;padding-inline-start:1.25em}.qz-note-image{color:var(--qz-muted)}.qz-notes-back{display:none;justify-self:start}@container qz-app (max-width: 680px){.qz-notes-layout,.qz-note-create{grid-template-columns:minmax(0,1fr)}.qz-notes-layout:has(.qz-note-source){grid-template-rows:auto 1fr}.qz-note-browser{max-height:none}.qz-notes-layout[data-note-open]>.qz-note-browser{display:none}.qz-notes-layout[data-note-open]>.qz-notes-back{display:inline-flex}}", hu = '.qz-settings{display:grid;align-content:start;gap:20px;width:100%;max-width:1100px;min-width:0;margin-inline:auto;container:qz-settings / inline-size}.qz-settings .qz-settings-grid,.qz-settings-fields{display:grid;align-items:start;gap:20px}.qz-settings-fields{grid-template-columns:repeat(auto-fit,minmax(min(100%,245px),1fr))}.qz-settings-grid[data-empty]{align-items:start}.qz-settings-header{position:sticky;inset-block-start:0;z-index:2;padding-block:8px;background:var(--qz-canvas)}.qz-settings-header,.qz-settings-nav{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.qz-settings-header{justify-content:space-between}.qz-settings-saved{font-size:calc(13px * var(--qz-scale, 1))}.qz-settings-nav .qz-button[aria-current=true]{border-color:var(--qz-accent);background:var(--qz-accent-soft)}.qz-onboarding{display:grid;gap:8px;padding-inline-start:20px;margin-block:0}.qz-settings-panel{display:grid;gap:12px;padding:16px}.qz-settings-panel .qz-settings-heading{justify-content:space-between}.qz-settings-panel .qz-settings-heading .qz-button{min-height:32px}.qz-settings-color-field{display:grid;gap:8px;min-width:0;font-size:calc(13px * var(--qz-scale, 1))}.qz-settings-color-mode{display:flex;align-items:end;gap:6px;min-width:0}.qz-settings-color-mode .qz-field{flex:1}.qz-settings-color-field input[type=color]{flex:none;width:40px;padding:4px;cursor:pointer}.qz-color-swatches{display:flex;flex-wrap:wrap;gap:7px}.qz-color-swatches button{width:32px;height:32px;padding:0;border:1px solid var(--qz-border);border-radius:8px;cursor:pointer}.qz-color-swatches button[aria-pressed=true]{box-shadow:inset 0 0 0 2px #fff,inset 0 0 0 3px #000}.qz-settings-panel-preview{display:grid;gap:8px;min-width:0;padding:16px 20px;border:1px solid var(--qz-border);border-radius:8px;color:var(--qz-preview-text);background:var(--qz-preview-background);font-family:var(--qz-note-font, var(--font-body, sans-serif));font-size:var(--qz-note-text-size);line-height:var(--qz-note-line-height)}.qz-settings-panel-preview[data-preview-theme=light]{--qz-preview-background: #fff;--qz-preview-text: #20232a}.qz-settings-panel-preview[data-preview-theme=dark]{--qz-preview-background: #17191e;--qz-preview-text: #ececf0}.qz-settings-panel-preview>span{font-size:calc(13px * var(--qz-scale, 1))}@container qz-settings (min-width: 760px){.qz-settings .qz-settings-grid{grid-template-columns:minmax(0,1fr) minmax(260px,330px)}.qz-settings .qz-settings-grid[data-empty]{grid-template-columns:repeat(2,minmax(0,1fr))}}.qz-settings .qz-settings-folders,.qz-settings .qz-settings-add,.qz-settings .qz-settings-folder,.qz-settings .qz-settings-migration,.qz-settings .qz-settings-notice{display:grid;min-width:0;gap:12px}.qz-settings .qz-settings-add,.qz-settings .qz-settings-folder{padding:16px}.qz-settings .qz-settings-add p{margin-block-start:4px}.qz-settings .qz-settings-add .qz-input{width:100%}.qz-settings .qz-settings-add>.qz-button{justify-self:start}.qz-settings .qz-settings-heading,.qz-settings .qz-settings-folder-identity,.qz-settings .qz-settings-folder-controls,.qz-settings .qz-settings-actions,.qz-settings .qz-settings-check{display:flex;align-items:center}.qz-settings .qz-settings-heading,.qz-settings .qz-settings-folder-identity,.qz-settings .qz-settings-check{gap:10px}.qz-settings .qz-settings-heading h3,.qz-settings .qz-settings-add h3,.qz-settings .qz-settings-folder h4{margin:0;color:var(--qz-text);font-size:calc(15px * var(--qz-scale, 1));font-weight:650}.qz-settings .qz-settings-count{padding:1px 7px;border:1px solid var(--qz-border);border-radius:999px;color:var(--qz-muted);font-size:calc(12px * var(--qz-scale, 1));font-variant-numeric:tabular-nums}.qz-settings .qz-settings-folder-icon{display:grid;flex:none;width:36px;height:36px;place-items:center;border-radius:9px;background:var(--qz-accent-soft);color:var(--qz-accent)}.qz-settings .qz-settings-folder-identity>div{display:grid;min-width:0;gap:3px;overflow-wrap:anywhere}.qz-settings .qz-settings-folder-controls{justify-content:space-between;flex-wrap:wrap;gap:8px 12px;padding-block-start:10px;border-top:1px solid var(--qz-border)}.qz-settings .qz-settings-actions{flex-wrap:wrap;gap:4px}.qz-settings .qz-settings-check{min-height:32px;font-size:calc(13px * var(--qz-scale, 1));cursor:pointer}.qz-settings .qz-settings-check input{flex:none;accent-color:var(--qz-accent)}.qz-settings .qz-settings-toggle{display:inline-grid;align-items:center;justify-items:start;-webkit-appearance:none;-moz-appearance:none;appearance:none;width:34px;height:20px;padding:2px;margin:0;border:1px solid var(--qz-muted);border-radius:999px;background:var(--qz-elevated);cursor:inherit}.qz-settings .qz-settings-toggle:before{width:12px;height:12px;border-radius:50%;background:var(--qz-muted);content:""}.qz-settings .qz-settings-toggle:checked{justify-items:end;border-color:var(--qz-accent);background:var(--qz-accent-soft)}.qz-settings .qz-settings-toggle:checked:before{background:var(--qz-accent)}.qz-settings .qz-settings-toggle:disabled{opacity:.6;cursor:default}@media (forced-colors: active){.qz-settings .qz-settings-toggle{display:inline-block;-webkit-appearance:auto;-moz-appearance:auto;appearance:auto;width:16px;height:16px}}.qz-settings .qz-settings-migration,.qz-settings .qz-settings-result{padding:12px;border:1px solid var(--qz-border);border-radius:9px;background:var(--qz-canvas);font-size:calc(13px * var(--qz-scale, 1))}.qz-settings .qz-settings-migration{gap:6px}.qz-settings .qz-settings-notice{gap:8px;overflow-wrap:anywhere}.qz-settings .qz-settings-migration-files{max-height:200px;margin:0;padding-inline-start:20px;overflow-y:auto;list-style:disc}.qz-settings .qz-button[data-destructive]{color:var(--qz-danger)}.qz-settings-disclosure{border-top:1px solid var(--qz-border);font-size:calc(13px * var(--qz-scale, 1))}.qz-settings-disclosure>summary{padding-block:8px;font-weight:650;cursor:pointer}.qz-column-list{display:grid;gap:8px;padding:0;list-style:none}.qz-column-row{display:flex;flex-wrap:wrap;align-items:end;gap:6px 10px}.qz-column-row .qz-field{flex:1 1 140px}.qz-column-row .qz-field>span{overflow-wrap:anywhere}.qz-column-row .qz-input,.qz-agent-prompt{width:100%}.qz-column-row .qz-settings-actions{align-items:end}.qz-column-row>.qz-stack{flex:1 1 160px;gap:4px}.qz-settings-board-folder h4{margin-block:0 6px}.qz-settings-panel h4{margin-block:8px 0}', We = [
  { id: "tasks", label: "Tasks", icon: "board" },
  { id: "todos", label: "TODOs", icon: "checklist" },
  { id: "notes", label: "Notes", icon: "note" },
  { id: "settings", label: "Settings", icon: "settings" }
], _a = { small: "14px", medium: "16px", large: "19px" }, pu = { compact: 1.45, normal: 1.65, relaxed: 1.9 };
function vu() {
  const e = Kr(), { preferences: t, status: n, ready: a, update: r } = lu(e), [i, o] = S(null), [s, c] = S(null), [u, p] = S(null), [d, f] = S(null), [m, h] = S(null), [x, k] = S(0), v = re(null);
  oe(() => {
    let N = !1, J = !1, H;
    const V = async () => {
      if (!(N || J)) {
        J = !0, clearTimeout(H);
        try {
          const ue = await _e(Aa(e));
          N || h(ue);
        } catch {
          N || (H = setTimeout(() => void V(), 3e3));
        } finally {
          J = !1;
        }
      }
    };
    return V(), window.addEventListener("focus", V), () => {
      N = !0, clearTimeout(H), window.removeEventListener("focus", V);
    };
  }, [e, x]);
  const q = i ?? (t.startOn === "last" ? t.lastTab : t.startOn), w = (m == null ? void 0 : m.filter((N) => N.companion)) ?? [], _ = w.find((N) => N.id === t.workspaceId) ?? w[0], E = q === "notes" && u ? w.find((N) => N.id === u.workspaceId) ?? _ : _, b = E ? t.folderAppearance[E.id] : void 0, M = (E == null ? void 0 : E.id) ?? null, y = t.appearance, T = {
    "--qz-accent-override": Ke(t.accent),
    "--qz-accent-foreground": Ni(t.accent),
    "--qz-note-heading-color": Ke(y.headingColor),
    "--qz-note-line-color": Ke(y.lineColor),
    "--qz-note-text-size": _a[t.noteTextSize],
    "--qz-note-raw-size": _a[t.rawTextSize],
    "--qz-note-line-height": pu[t.noteLineHeight],
    "--qz-note-font": t.noteFont === "mono" ? "var(--mono, ui-monospace, monospace)" : void 0
  }, U = q === "settings" ? s === "board" : !(q === "todos" && t.todoScope === "all"), B = (N) => {
    o(N), N !== "notes" && (p(null), f(null)), r({ lastTab: N });
  }, Y = (N) => {
    var J, H;
    return (H = (J = v.current) == null ? void 0 : J.querySelector(`#qz-tab-${N}`)) == null ? void 0 : H.focus();
  }, Z = (N) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(N.key)) return;
    N.preventDefault();
    const J = We.findIndex((V) => V.id === q), H = N.key === "Home" ? We[0] : N.key === "End" ? We[We.length - 1] : We[(J + (N.key === "ArrowRight" ? 1 : We.length - 1)) % We.length];
    B(H.id), Y(H.id);
  }, ne = (N) => {
    c(N), B("settings"), Y("settings");
  }, P = (N) => {
    (q === "tasks" || q === "todos") && f({ tab: q, workspaceId: t.workspaceId }), p(N), B("notes"), Y("notes");
  }, R = () => {
    d && (r({ workspaceId: d.workspaceId }), B(d.tab), Y(d.tab));
  }, L = (N) => {
    p(null), r({ workspaceId: N });
  }, D = () => ne("folders");
  return /* @__PURE__ */ g(
    "div",
    {
      className: "qz-app",
      "data-note-heading-lines": y.headingLines,
      style: T,
      "data-contrast": t.highContrast ? "high" : void 0,
      "data-motion": t.motion,
      "data-interface-text": t.largerInterfaceText ? "large" : void 0,
      "data-accent": t.accent !== "theme" ? "custom" : void 0,
      children: [
        /* @__PURE__ */ l("style", { children: cu }),
        /* @__PURE__ */ l("style", { children: uu }),
        /* @__PURE__ */ l("style", { children: du }),
        /* @__PURE__ */ l("style", { children: hu }),
        /* @__PURE__ */ g("header", { className: "qz-header", children: [
          /* @__PURE__ */ g("div", { className: "qz-brand", children: [
            /* @__PURE__ */ l("span", { className: "qz-mark", children: /* @__PURE__ */ l(te, { name: "gem" }) }),
            /* @__PURE__ */ l("h1", { children: "Quartizo" })
          ] }),
          /* @__PURE__ */ l("div", { className: "qz-tabs", ref: v, role: "tablist", "aria-label": "Quartizo", onKeyDown: Z, children: We.map((N) => /* @__PURE__ */ g(
            "button",
            {
              id: `qz-tab-${N.id}`,
              type: "button",
              role: "tab",
              "aria-selected": q === N.id,
              "aria-controls": "qz-panel",
              tabIndex: q === N.id ? 0 : -1,
              onClick: () => B(N.id),
              children: [
                /* @__PURE__ */ l(te, { name: N.icon }),
                N.label
              ]
            },
            N.id
          )) }),
          U && /* @__PURE__ */ g("label", { className: "qz-workspace qz-inline-field", children: [
            (b == null ? void 0 : b.color) && b.color !== "theme" && /* @__PURE__ */ l(
              "span",
              {
                "aria-hidden": "true",
                className: "qz-folder-dot",
                style: { backgroundColor: Ke(b.color) }
              }
            ),
            /* @__PURE__ */ l("span", { children: "Workspace" }),
            /* @__PURE__ */ g(
              "select",
              {
                className: "qz-input",
                value: M ?? "",
                disabled: !w.length || !a,
                onChange: (N) => L(Number(N.currentTarget.value)),
                children: [
                  !E && /* @__PURE__ */ l("option", { value: "", children: m === null ? "Loading folders…" : "No folders connected" }),
                  w.map((N) => {
                    var H;
                    const J = (H = t.folderAppearance[N.id]) == null ? void 0 : H.emoji;
                    return /* @__PURE__ */ l("option", { value: N.id, children: J ? `${J} ${N.name}` : N.name }, N.id);
                  })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ g("div", { className: "qz-content", id: "qz-panel", role: "tabpanel", "aria-labelledby": `qz-tab-${q}`, children: [
          n === "unavailable" && /* @__PURE__ */ l("p", { className: "qz-notice qz-preference-notice", role: "status", children: "Quartizo can’t save preferences. Changes are kept until you close or reload this page." }),
          /* @__PURE__ */ g(ve, { children: [
            /* @__PURE__ */ l("div", { hidden: q !== "tasks", children: /* @__PURE__ */ l(
              Ti,
              {
                api: e,
                active: q === "tasks",
                workspaceId: (_ == null ? void 0 : _.id) ?? null,
                preferences: t,
                onPreferencesChange: r,
                onSettings: D,
                onBoardSettings: () => ne("board"),
                onOpenNote: P
              }
            ) }),
            /* @__PURE__ */ l("div", { hidden: q !== "todos", children: /* @__PURE__ */ l(
              Ui,
              {
                api: e,
                active: q === "todos",
                workspaceId: (_ == null ? void 0 : _.id) ?? null,
                preferences: t,
                onPreferencesChange: r,
                onSettings: D,
                onOpenNote: P
              }
            ) }),
            /* @__PURE__ */ g("div", { className: "qz-notes-tab", hidden: q !== "notes", children: [
              d && /* @__PURE__ */ g("button", { className: "qz-button qz-return", type: "button", "data-variant": "quiet", onClick: R, children: [
                /* @__PURE__ */ l(te, { name: "back" }),
                d.tab === "tasks" ? "Back to board" : "Back to TODOs"
              ] }),
              /* @__PURE__ */ l(
                Hc,
                {
                  api: e,
                  active: q === "notes",
                  workspaceId: M,
                  request: u,
                  preferences: t,
                  onPreferencesChange: r,
                  onSettings: D
                }
              )
            ] }),
            q === "settings" && /* @__PURE__ */ l(
              Vc,
              {
                api: e,
                preferences: t,
                onPreferencesChange: r,
                status: n,
                section: s,
                onSectionChange: c,
                workspaceId: M,
                onWorkspaceChange: L,
                onWorkspacesChanged: () => k((N) => N + 1)
              }
            )
          ] })
        ] })
      ]
    }
  );
}
export {
  vu as default
};
