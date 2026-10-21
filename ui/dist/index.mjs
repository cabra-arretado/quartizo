import { jsx as r, jsxs as p, Fragment as j } from "react/jsx-runtime";
import { useNavigate as q, useAppApi as te } from "@kirocrew/app-sdk";
import { Btn as A, PageHeader as ne } from "@kirocrew/app-sdk/ui";
import { useState as g, useEffect as C, useMemo as H, useRef as L, useCallback as re } from "react";
const R = "/apps/quartizo/api";
function ae(t) {
  const e = Object.entries(t).filter((n) => n[1] !== void 0 && n[1] !== "").map(([n, a]) => `${encodeURIComponent(n)}=${encodeURIComponent(a)}`);
  return e.length ? `?${e.join("&")}` : "";
}
async function oe(t) {
  return (await t.get(`${R}/workspaces`)).workspaces;
}
async function ie(t, e, n) {
  return (await t.post(`${R}/workspaces`, n ? { path: e, name: n } : { path: e })).workspace;
}
function T(t) {
  const e = t;
  if ((e == null ? void 0 : e.name) === "AppApiPermissionError")
    return { code: "permission_denied", message: "Quartizo has not declared access to this API in app.json." };
  const n = typeof (e == null ? void 0 : e.status) == "number" ? e.status : void 0;
  let a;
  if (typeof (e == null ? void 0 : e.body) == "string" && e.body)
    try {
      const c = JSON.parse(e.body);
      c && typeof c == "object" && !Array.isArray(c) && (a = c);
    } catch {
    }
  const o = typeof (a == null ? void 0 : a.code) == "string" ? a.code : void 0, i = typeof (a == null ? void 0 : a.error) == "string" ? a.error : typeof (e == null ? void 0 : e.message) == "string" ? e.message : String(t), m = { status: n, code: o, message: i };
  if (o === "conflict") {
    const c = a == null ? void 0 : a.currentHash;
    m.currentHash = typeof c == "string" ? c : null;
  }
  return m;
}
const se = ["backlog", "ready", "in_progress", "review", "done"], P = {
  backlog: "Backlog",
  ready: "Ready",
  in_progress: "In Progress",
  review: "Review",
  done: "Done"
};
async function le(t, e, n = !1) {
  await t.del(`${R}/workspaces/${e}${n ? "?deleteTasks=1" : ""}`);
}
function ce(t) {
  const e = T(t), n = t == null ? void 0 : t.body;
  if (typeof n != "string") return e;
  try {
    const a = JSON.parse(n);
    e.code === "stale" && a.task && typeof a.task == "object" && (e.current = a.task), typeof a.taskCount == "number" && (e.taskCount = a.taskCount);
  } catch {
  }
  return e;
}
const _ = `${R}/companion`;
function de(t) {
  return t.get(_);
}
function U(t, e, n) {
  return t.put(`${R}/workspaces/${e}/companion`, { enabled: n });
}
function z(t, e = {}) {
  const n = {};
  return e.workspaceId !== void 0 && (n.workspaceId = e.workspaceId), e.rebuild && (n.rebuild = !0), e.manual && (n.manual = !0), t.post(`${_}/refresh`, n);
}
function ue(t, e) {
  return t.get(`${R}/workspaces/${e}/board`);
}
function pe(t, e, n) {
  return t.get(`${_}/todos${ae({ workspace: n === void 0 ? void 0 : String(n), state: e })}`);
}
const Q = [...se, "repair"], B = { ...P, repair: "Needs repair" };
function me(t) {
  const e = Object.fromEntries(Q.map((n) => [n, []]));
  for (const n of t) (e[n.lane] ?? e.repair).push(n);
  return e;
}
function fe(t) {
  if (!t) return null;
  switch (t.state) {
    case "off":
      return "This workspace is not in Kiro Notes companion mode.";
    case "unavailable":
      return `The Markdown index is unavailable: ${typeof t.error == "string" ? t.error : "parsers failed to load"}.`;
    case "unindexed":
      return "Not indexed yet.";
    case "error":
    case "stale": {
      const n = t.error && typeof t.error == "object" ? t.error.message : "the last scan failed";
      return t.state === "stale" ? `The last scan failed (${n}); showing the previous scan.` : `Indexing failed: ${n}.`;
    }
  }
  const e = [];
  return t.complete === !1 ? e.push("The last scan was incomplete (a limit was reached or a folder could not be read): notes it did not reach are shown as last indexed, and none were treated as deleted.") : t.retained && e.push(`${t.retained} note(s) could not be read and are shown as last indexed.`), t.outdated && e.push("This index was built by an older version; refresh to update it."), e.length ? e.join(" ") : null;
}
function he(t, e = Date.now()) {
  var n;
  if (!t) return "";
  if (t.state === "scanning") {
    const a = (n = t.progress) == null ? void 0 : n.notes;
    return t.progress ? `Scanning… ${a} note(s) read${t.progress.rebuild ? " (rebuild)" : ""}` : "Scan queued…";
  }
  return t.indexedAt ? `${t.files ?? 0} note(s) indexed ${ge(t.indexedAt, e)}` : "";
}
function ge(t, e) {
  const n = Math.max(0, Math.round((e - t) / 1e3));
  if (n < 5) return "just now";
  if (n < 60) return `${n} s ago`;
  const a = Math.round(n / 60);
  return a < 60 ? `${a} min ago` : new Date(t).toLocaleString();
}
function ye(t, e) {
  const n = e.trim().toLocaleLowerCase();
  if (!n) return [...t];
  const a = [];
  for (const o of t) {
    const m = `${o.title}
${o.path}`.toLocaleLowerCase().includes(n) ? o.items : o.items.filter((c) => `${c.text}
${c.heading ?? ""}`.toLocaleLowerCase().includes(n));
    m.length && a.push({ ...o, items: m });
  }
  return a;
}
function K(t) {
  return t.trim() || "(empty)";
}
const be = 15e3;
function W(t, e = be) {
  let n;
  const a = new Promise((o, i) => {
    n = setTimeout(() => i(new Error(`request timed out after ${Math.round(e / 1e3)} s`)), e);
  });
  return Promise.race([t, a]).finally(() => clearTimeout(n));
}
const V = "/md-notebook";
function xe(t) {
  return (t.split("/").pop() ?? t).replace(/\.md$/i, "");
}
const we = 1500, ve = 3e4, F = "quartizo:workspace", h = {
  column: { display: "flex", flexDirection: "column", gap: 8, minHeight: 0, minWidth: 0 },
  row: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" },
  input: { padding: "4px 6px", border: "1px solid rgba(128,128,128,.4)", borderRadius: 4, background: "transparent", color: "inherit" },
  board: { display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(170px, 1fr)", gap: 8, overflowX: "auto", minHeight: 0, flex: 1 },
  lane: { display: "flex", flexDirection: "column", gap: 6, minHeight: 120, padding: 6, borderRadius: 4, border: "1px solid rgba(128,128,128,.25)" },
  cards: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 },
  card: { display: "flex", alignItems: "flex-start", gap: 4, padding: 6, borderRadius: 4, border: "1px solid rgba(128,128,128,.35)" },
  open: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2, padding: 0, background: "transparent", color: "inherit", border: "none", textAlign: "left", cursor: "pointer" },
  notice: { padding: 8, borderRadius: 4, border: "1px solid rgba(220,120,0,.6)" },
  group: { padding: 8, borderRadius: 4, border: "1px solid rgba(128,128,128,.35)", display: "flex", flexDirection: "column", gap: 4 },
  badge: { fontSize: 11, padding: "0 4px", borderRadius: 3, border: "1px solid rgba(220,120,0,.7)" },
  todoRow: { display: "flex", gap: 6, alignItems: "baseline" },
  copy: { flex: "none", fontSize: 11, padding: "1px 6px", borderRadius: 3, border: "1px solid rgba(128,128,128,.4)", background: "transparent", color: "inherit", cursor: "pointer" }
};
function M() {
  try {
    return window.localStorage;
  } catch {
    return;
  }
}
function E({ failure: t }) {
  return t ? /* @__PURE__ */ r("div", { role: "alert", className: "text-sm text-danger", "data-code": t.code, children: t.message }) : null;
}
function ke() {
  const [t, e] = g(() => typeof document > "u" || document.visibilityState !== "hidden");
  return C(() => {
    const n = () => e(document.visibilityState !== "hidden");
    return document.addEventListener("visibilitychange", n), () => document.removeEventListener("visibilitychange", n);
  }, []), t;
}
function G(t, e) {
  const [n, a] = g(null), [o, i] = g(null);
  return C(() => {
    if (!e) return;
    let m = !1;
    return de(t).then((c) => {
      m || (a(c.workspaces.filter((u) => u.workspace.companion)), i(c.available ? null : { message: c.error ?? "The Markdown index is unavailable." }));
    }).catch((c) => !m && i(T(c))), () => {
      m = !0;
    };
  }, [t, e]), { companions: n, failure: o };
}
function J(t, e, n, a, o) {
  const i = ke(), [m, c] = g(null), [u, f] = g(null), [v, w] = g(0), [$, l] = g(!1), x = L(null), d = L(n), y = L(a);
  d.current = n, y.current = a, C(() => {
    x.current = null, c(null), f(null);
  }, [e]), C(() => {
    if (!t || !i) return;
    let s = !1, b, O = !0;
    const I = async () => {
      try {
        (O || !x.current || !o(x.current)) && await W(y.current(!1));
        const S = await W(d.current());
        if (s) return;
        x.current = S, c(S), f(null);
      } catch (S) {
        s || f(T(S));
      }
      O = !1, s || (b = setTimeout(I, x.current && o(x.current) ? we : ve));
    };
    return I(), () => {
      s = !0, clearTimeout(b);
    };
  }, [t, i, e, v]);
  const k = re(async () => {
    l(!0);
    try {
      await W(y.current(!0)), f(null), w((s) => s + 1);
    } catch (s) {
      f(T(s));
    } finally {
      l(!1);
    }
  }, []);
  return { data: m, failure: u, busy: $, refresh: k };
}
function X(t) {
  const e = Date.now(), n = t.statuses.map((o) => he(o, e)).filter(Boolean), a = t.statuses.map((o) => fe(o)).filter((o) => !!o);
  return /* @__PURE__ */ p(j, { children: [
    /* @__PURE__ */ p("div", { style: h.row, children: [
      /* @__PURE__ */ r("span", { className: "text-sm text-muted", role: "status", "aria-live": "polite", children: n.join(" · ") }),
      /* @__PURE__ */ r(A, { onClick: t.onRefresh, disabled: t.busy, children: "Refresh" })
    ] }),
    a.map((o) => /* @__PURE__ */ r("div", { role: "note", className: "text-sm", style: h.notice, children: o }, o))
  ] });
}
function Y({ path: t }) {
  const e = xe(t), [n, a] = g("idle");
  C(() => {
    if (n === "idle") return;
    const i = setTimeout(() => a("idle"), 1500);
    return () => clearTimeout(i);
  }, [n]);
  const o = async () => {
    try {
      await navigator.clipboard.writeText(e), a("copied");
    } catch {
      a("failed");
    }
  };
  return /* @__PURE__ */ r("button", { type: "button", onClick: () => void o(), "aria-label": `Copy note name “${e}”`, title: e, style: h.copy, children: n === "copied" ? "Copied" : n === "failed" ? "Failed" : "Copy name" });
}
function Z() {
  return /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "No folder is shared with Kiro Notes yet. Add one in Settings." });
}
function Ne(t) {
  var m, c;
  const { companions: e, failure: n } = G(t.api, t.active), [a, o] = g(() => {
    var f;
    const u = Number((f = M()) == null ? void 0 : f.getItem(F));
    return Number.isInteger(u) && u > 0 ? u : null;
  }), i = ((m = e == null ? void 0 : e.find((u) => u.workspace.id === a)) == null ? void 0 : m.workspace) ?? ((c = e == null ? void 0 : e[0]) == null ? void 0 : c.workspace) ?? null;
  return C(() => {
    var u;
    try {
      i && ((u = M()) == null || u.setItem(F, String(i.id)));
    } catch {
    }
  }, [i]), n ? /* @__PURE__ */ r(E, { failure: n }) : e ? i ? /* @__PURE__ */ p("div", { style: { ...h.column, flex: 1 }, children: [
    e.length > 1 && /* @__PURE__ */ p("div", { style: h.row, children: [
      /* @__PURE__ */ r("label", { className: "text-sm", htmlFor: "qz-board-ws", children: "Workspace" }),
      /* @__PURE__ */ r("select", { id: "qz-board-ws", value: i.id, onChange: (u) => o(Number(u.target.value)), style: h.input, children: e.map((u) => /* @__PURE__ */ r("option", { value: u.workspace.id, children: u.workspace.name }, u.workspace.id)) })
    ] }),
    /* @__PURE__ */ r($e, { api: t.api, workspace: i, active: t.active }, i.id)
  ] }) : /* @__PURE__ */ r(Z, {}) : /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "Loading…" });
}
function $e(t) {
  const { api: e, workspace: n } = t, a = n.id, o = q(), { data: i, failure: m, busy: c, refresh: u } = J(
    t.active,
    String(a),
    () => ue(e, a),
    (l) => z(e, { workspaceId: a, manual: l }),
    (l) => l.index.state === "scanning"
  ), f = H(() => me((i == null ? void 0 : i.tickets) ?? []), [i]), v = Q.filter((l) => l !== "repair" || f.repair.length > 0), w = L(null), $ = (l) => {
    var I, S;
    const x = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"], d = l.target, y = Number(d.dataset.lane), k = Number(d.dataset.index);
    if (!x.includes(l.key) || Number.isNaN(y) || Number.isNaN(k)) return;
    let s = y, b = k;
    if (l.key === "ArrowUp" && (b = Math.max(0, k - 1)), l.key === "ArrowDown" && (b = k + 1), l.key === "Home" && (b = 0), l.key === "End" && (b = Number.MAX_SAFE_INTEGER), l.key === "ArrowLeft" || l.key === "ArrowRight") {
      const ee = l.key === "ArrowLeft" ? -1 : 1;
      do
        s += ee;
      while (s >= 0 && s < v.length && f[v[s]].length === 0);
      if (s < 0 || s >= v.length) return;
    }
    const O = f[v[s]];
    b = Math.min(b, O.length - 1), l.preventDefault(), (S = (I = w.current) == null ? void 0 : I.querySelector(`[data-lane="${s}"][data-index="${b}"]`)) == null || S.focus();
  };
  return /* @__PURE__ */ p("div", { style: { ...h.column, flex: 1 }, children: [
    /* @__PURE__ */ r(X, { statuses: i ? [i.index] : [], busy: c, onRefresh: () => void u() }),
    /* @__PURE__ */ r(E, { failure: m }),
    !i && !m && /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "Loading the board…" }),
    i && i.tickets.length === 0 && i.index.state !== "scanning" && /* @__PURE__ */ p("p", { className: "text-sm text-muted", children: [
      "No ticket notes in “",
      n.name,
      "” yet. In Kiro Notes, give a note ",
      /* @__PURE__ */ r("code", { children: "type: ticket" }),
      ", an ",
      /* @__PURE__ */ r("code", { children: "id" }),
      ", a",
      " ",
      /* @__PURE__ */ r("code", { children: "status" }),
      " and an ",
      /* @__PURE__ */ r("code", { children: "order" }),
      " in its frontmatter."
    ] }),
    i && i.tickets.length > 0 && /* @__PURE__ */ r("div", { ref: w, style: h.board, onKeyDown: $, "aria-label": `Board of ${n.name}`, role: "group", children: v.map((l, x) => /* @__PURE__ */ p("section", { "aria-label": B[l], style: h.lane, children: [
      /* @__PURE__ */ p("strong", { className: "text-sm", children: [
        B[l],
        " (",
        f[l].length,
        ")"
      ] }),
      /* @__PURE__ */ r("ul", { style: h.cards, children: f[l].map((d, y) => /* @__PURE__ */ r("li", { children: /* @__PURE__ */ r(Ce, { ticket: d, lane: x, index: y, onOpen: () => o(V) }) }, d.path)) })
    ] }, l)) })
  ] });
}
function Ce(t) {
  const { ticket: e } = t;
  return /* @__PURE__ */ p("div", { style: h.card, children: [
    /* @__PURE__ */ p(
      "button",
      {
        type: "button",
        "data-lane": t.lane,
        "data-index": t.index,
        "aria-label": `Open Kiro Notes: ${e.title}`,
        onClick: t.onOpen,
        style: h.open,
        children: [
          /* @__PURE__ */ r("span", { className: "text-sm", style: { fontWeight: 600 }, children: e.title }),
          (e.todos.total > 0 || e.diagnostics.length > 0) && /* @__PURE__ */ p("span", { style: h.row, children: [
            e.todos.total > 0 && /* @__PURE__ */ p("span", { className: "text-sm text-muted", children: [
              "☑ ",
              e.todos.done,
              "/",
              e.todos.total
            ] }),
            e.diagnostics.map((n) => /* @__PURE__ */ r("span", { style: h.badge, title: n.message, children: n.code.replace(/_/g, " ") }, n.code))
          ] })
        ]
      }
    ),
    /* @__PURE__ */ r(Y, { path: e.path })
  ] });
}
function Se(t) {
  const { api: e } = t, n = q(), { companions: a, failure: o } = G(e, t.active), [i, m] = g("all"), [c, u] = g("open"), [f, v] = g("");
  C(() => {
    a && i !== "all" && !a.some((s) => s.workspace.id === i) && m("all");
  }, [a, i]);
  const w = i === "all" ? void 0 : i, $ = t.active && !!a && a.length > 0, { data: l, failure: x, busy: d, refresh: y } = J(
    $,
    `${i}:${c}`,
    () => pe(e, c, w),
    (s) => z(e, { workspaceId: w, manual: s }),
    (s) => Object.values(s.index).some((b) => b.state === "scanning")
  ), k = H(() => ye((l == null ? void 0 : l.groups) ?? [], f), [l, f]);
  return o ? /* @__PURE__ */ r(E, { failure: o }) : a ? a.length === 0 ? /* @__PURE__ */ r(Z, {}) : /* @__PURE__ */ p("div", { style: { ...h.column, flex: 1 }, children: [
    /* @__PURE__ */ p("div", { style: h.row, children: [
      a.length > 1 && /* @__PURE__ */ p(
        "select",
        {
          "aria-label": "Workspace",
          value: i,
          onChange: (s) => m(s.target.value === "all" ? "all" : Number(s.target.value)),
          style: h.input,
          children: [
            /* @__PURE__ */ r("option", { value: "all", children: "All workspaces" }),
            a.map((s) => /* @__PURE__ */ r("option", { value: s.workspace.id, children: s.workspace.name }, s.workspace.id))
          ]
        }
      ),
      /* @__PURE__ */ p("select", { "aria-label": "Show", value: c, onChange: (s) => u(s.target.value), style: h.input, children: [
        /* @__PURE__ */ r("option", { value: "open", children: "Open" }),
        /* @__PURE__ */ r("option", { value: "done", children: "Completed" }),
        /* @__PURE__ */ r("option", { value: "all", children: "All" })
      ] }),
      /* @__PURE__ */ r(
        "input",
        {
          "aria-label": "Filter TODOs",
          placeholder: "Filter",
          value: f,
          onChange: (s) => v(s.target.value),
          style: { ...h.input, flex: "1 1 200px" }
        }
      )
    ] }),
    /* @__PURE__ */ r(X, { statuses: l ? Object.values(l.index) : [], busy: d, onRefresh: () => void y() }),
    /* @__PURE__ */ r(E, { failure: x }),
    (l == null ? void 0 : l.truncated) && /* @__PURE__ */ r("div", { role: "note", className: "text-sm", style: h.notice, children: "Only the first items are listed. Narrow it down by workspace, state or filter." }),
    !l && !x && /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "Loading TODOs…" }),
    l && k.length === 0 && /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: f.trim() ? "No TODO matches." : "No TODOs." }),
    /* @__PURE__ */ r("div", { style: { ...h.column, overflowY: "auto" }, children: k.map((s) => /* @__PURE__ */ p("section", { "aria-label": s.title, style: h.group, children: [
      /* @__PURE__ */ p("strong", { className: "text-sm", children: [
        s.title,
        s.ticket && s.status && /* @__PURE__ */ r("span", { className: "text-muted", style: { fontWeight: 400 }, children: ` · ${P[s.status]}` })
      ] }),
      /* @__PURE__ */ r("ul", { style: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }, children: s.items.map((b) => /* @__PURE__ */ p("li", { style: { ...h.todoRow, paddingLeft: b.depth * 18 }, children: [
        /* @__PURE__ */ p(
          "button",
          {
            type: "button",
            "aria-label": `Open Kiro Notes: ${K(b.text)}`,
            onClick: () => n(V),
            style: { ...h.open, flexDirection: "row", gap: 6 },
            children: [
              /* @__PURE__ */ r("span", { "aria-hidden": "true", children: b.checked ? "☑" : "☐" }),
              /* @__PURE__ */ r("span", { className: "text-sm", style: { textDecoration: b.checked ? "line-through" : void 0 }, children: K(b.text) })
            ]
          }
        ),
        /* @__PURE__ */ r(Y, { path: s.path })
      ] }, b.ordinal)) })
    ] }, `${s.workspaceId}:${s.path}`)) })
  ] }) : /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "Loading…" });
}
const N = {
  column: { display: "flex", flexDirection: "column", gap: 8, minWidth: 0 },
  row: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" },
  input: { flex: 1, minWidth: 0, padding: "4px 6px", border: "1px solid rgba(128,128,128,.4)", borderRadius: 4, background: "transparent", color: "inherit" },
  item: { padding: 8, borderRadius: 4, border: "1px solid rgba(128,128,128,.35)", display: "flex", flexDirection: "column", gap: 6 },
  notice: { padding: 8, borderRadius: 4, border: "1px solid rgba(220,120,0,.6)", display: "flex", flexDirection: "column", gap: 6 },
  mono: { fontFamily: "ui-monospace, monospace", fontSize: 12, wordBreak: "break-all" }
};
function Te(t) {
  const { api: e } = t, [n, a] = g(null), [o, i] = g(null), [m, c] = g(0), [u, f] = g(""), [v, w] = g(""), [$, l] = g(!1);
  C(() => {
    if (!t.active) return;
    let d = !1;
    return oe(e).then((y) => !d && a(y)).catch((y) => !d && i(T(y))), () => {
      d = !0;
    };
  }, [e, t.active, m]);
  const x = async () => {
    l(!0), i(null);
    try {
      const d = await ie(e, u.trim(), v.trim() || void 0);
      await U(e, d.id, !0), f(""), w(""), c((y) => y + 1);
    } catch (d) {
      i(T(d));
    } finally {
      l(!1);
    }
  };
  return /* @__PURE__ */ p("div", { style: N.column, children: [
    /* @__PURE__ */ r("strong", { className: "text-sm", children: "Folders" }),
    !n && !o && /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "Loading…" }),
    (n == null ? void 0 : n.length) === 0 && /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "No folder yet. Add the folder you also attached in Kiro Notes." }),
    n == null ? void 0 : n.map((d) => /* @__PURE__ */ r(Ae, { api: e, workspace: d, onChanged: () => c((y) => y + 1) }, d.id)),
    /* @__PURE__ */ p("div", { style: N.row, children: [
      /* @__PURE__ */ r(
        "input",
        {
          "aria-label": "Absolute folder path",
          placeholder: "/home/you/notes",
          value: u,
          onChange: (d) => f(d.target.value),
          onKeyDown: (d) => d.key === "Enter" && u.trim() && void x(),
          style: N.input
        }
      ),
      /* @__PURE__ */ r("input", { "aria-label": "Name (optional)", placeholder: "Name (optional)", value: v, onChange: (d) => w(d.target.value), style: { ...N.input, flex: "0 1 180px" } }),
      /* @__PURE__ */ r(A, { onClick: () => void x(), disabled: $ || !u.trim(), children: "Add folder" })
    ] }),
    o && /* @__PURE__ */ r("div", { role: "alert", className: "text-sm text-danger", "data-code": o.code, children: o.message })
  ] });
}
function Ae(t) {
  const { api: e, workspace: n } = t, [a, o] = g(!1), [i, m] = g(null), [c, u] = g(null), [f, v] = g(!1), [w, $] = g(null), l = async (d, y) => {
    o(!0), m(null), u(null);
    try {
      return await d(), y && u(y), !0;
    } catch (k) {
      return m(T(k)), !1;
    } finally {
      o(!1);
    }
  }, x = async (d = !1) => {
    o(!0), m(null);
    try {
      await le(e, n.id, d), t.onChanged();
    } catch (y) {
      const k = ce(y);
      k.code === "project_has_tasks" && !d ? $(k.taskCount ?? 0) : m(k);
    } finally {
      o(!1);
    }
  };
  return /* @__PURE__ */ p("section", { "aria-label": n.name, style: N.item, children: [
    /* @__PURE__ */ p("div", { style: N.row, children: [
      /* @__PURE__ */ r("strong", { className: "text-sm", children: n.name }),
      /* @__PURE__ */ r("span", { className: "text-sm text-muted", style: N.mono, children: n.path })
    ] }),
    /* @__PURE__ */ p("div", { style: N.row, children: [
      /* @__PURE__ */ p("label", { className: "text-sm", style: N.row, children: [
        /* @__PURE__ */ r(
          "input",
          {
            type: "checkbox",
            checked: !!n.companion,
            disabled: a,
            onChange: () => void l(() => U(e, n.id, !n.companion)).then((d) => d && t.onChanged())
          }
        ),
        "Shared with Kiro Notes"
      ] }),
      /* @__PURE__ */ r("span", { style: { flex: 1 } }),
      n.companion && /* @__PURE__ */ r(A, { onClick: () => void l(() => z(e, { workspaceId: n.id, manual: !0, rebuild: !0 }), "Rebuilding the index…"), disabled: a, children: "Rebuild index" }),
      !f && /* @__PURE__ */ r(A, { onClick: () => v(!0), disabled: a, children: "Remove…" })
    ] }),
    f && /* @__PURE__ */ p("div", { role: "alertdialog", "aria-label": "Remove folder", style: N.notice, children: [
      /* @__PURE__ */ r("span", { className: "text-sm", children: w === null ? `Stop showing “${n.name}” in Quartizo? The folder and its files are not touched.` : `“${n.name}” still has ${w} task(s) in Quartizo's own database. Removing it also deletes them.` }),
      /* @__PURE__ */ p("div", { style: N.row, children: [
        /* @__PURE__ */ r(A, { onClick: () => void x(w !== null), disabled: a, children: w === null ? "Remove" : `Remove and delete ${w} task(s)` }),
        /* @__PURE__ */ r(
          A,
          {
            onClick: () => {
              v(!1), $(null);
            },
            disabled: a,
            children: "Cancel"
          }
        )
      ] })
    ] }),
    c && /* @__PURE__ */ r("span", { className: "text-sm text-muted", role: "status", children: c }),
    i && /* @__PURE__ */ r("div", { role: "alert", className: "text-sm text-danger", "data-code": i.code, children: i.message })
  ] });
}
const D = [
  { id: "tasks", label: "Tasks" },
  { id: "todos", label: "TODOs" },
  { id: "settings", label: "Settings" }
];
function Le() {
  const t = te(), [e, n] = g("tasks");
  return /* @__PURE__ */ p(j, { children: [
    /* @__PURE__ */ r(ne, { title: "Quartizo", subtitle: "Kiro Notes board and TODOs" }),
    /* @__PURE__ */ p("div", { className: "px-6 pb-8 flex-1 min-h-0 flex flex-col gap-3", children: [
      /* @__PURE__ */ r("div", { role: "tablist", "aria-label": "Quartizo", onKeyDown: (o) => {
        var c;
        if (o.key !== "ArrowLeft" && o.key !== "ArrowRight") return;
        o.preventDefault();
        const i = D.findIndex((u) => u.id === e), m = D[(i + (o.key === "ArrowRight" ? 1 : D.length - 1)) % D.length];
        n(m.id), (c = document.getElementById(`qz-tab-${m.id}`)) == null || c.focus();
      }, style: { display: "flex", gap: 4 }, children: D.map((o) => /* @__PURE__ */ r(
        "button",
        {
          id: `qz-tab-${o.id}`,
          type: "button",
          role: "tab",
          "aria-selected": e === o.id,
          "aria-controls": "qz-panel",
          tabIndex: e === o.id ? 0 : -1,
          onClick: () => n(o.id),
          style: {
            padding: "4px 12px",
            background: "transparent",
            color: "inherit",
            border: "none",
            borderBottom: e === o.id ? "2px solid currentColor" : "2px solid transparent",
            fontWeight: e === o.id ? 600 : 400,
            cursor: "pointer"
          },
          children: o.label
        },
        o.id
      )) }),
      /* @__PURE__ */ p(
        "div",
        {
          id: "qz-panel",
          role: "tabpanel",
          "aria-labelledby": `qz-tab-${e}`,
          style: { display: "flex", flexDirection: "column", flex: 1, minHeight: 0 },
          children: [
            e === "tasks" && /* @__PURE__ */ r(Ne, { api: t, active: !0 }),
            e === "todos" && /* @__PURE__ */ r(Se, { api: t, active: !0 }),
            e === "settings" && /* @__PURE__ */ r(Te, { api: t, active: !0 })
          ]
        }
      )
    ] })
  ] });
}
export {
  Le as default
};
