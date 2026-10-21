import { jsx as r, jsxs as d, Fragment as P } from "react/jsx-runtime";
import { useNavigate as U, useAppApi as ne } from "@kirocrew/app-sdk";
import { Btn as C, PageHeader as re } from "@kirocrew/app-sdk/ui";
import { useState as b, useEffect as S, useMemo as H, useRef as O, useCallback as oe } from "react";
const R = "/apps/quartizo/api", ae = 15e3, ie = ["backlog", "ready", "in_progress", "review", "done"], Q = {
  backlog: "Backlog",
  ready: "Ready",
  in_progress: "In Progress",
  review: "Review",
  done: "Done"
};
function E(t) {
  const e = t;
  if ((e == null ? void 0 : e.name) === "AppApiPermissionError")
    return { code: "permission_denied", message: "Quartizo has not declared access to this API in app.json." };
  const n = typeof (e == null ? void 0 : e.status) == "number" ? e.status : void 0;
  let o;
  if (typeof (e == null ? void 0 : e.body) == "string" && e.body)
    try {
      const c = JSON.parse(e.body);
      c && typeof c == "object" && !Array.isArray(c) && (o = c);
    } catch {
    }
  const a = typeof (o == null ? void 0 : o.code) == "string" ? o.code : void 0, i = typeof (o == null ? void 0 : o.error) == "string" ? o.error : typeof (e == null ? void 0 : e.message) == "string" ? e.message : String(t);
  return { status: n, code: a, message: i };
}
function B(t, e = ae) {
  let n;
  const o = new Promise((a, i) => {
    n = setTimeout(() => i(new Error(`request timed out after ${Math.round(e / 1e3)} s`)), e);
  });
  return Promise.race([t, o]).finally(() => clearTimeout(n));
}
function se(t) {
  const e = Object.entries(t).filter((n) => n[1] !== void 0 && n[1] !== "").map(([n, o]) => `${encodeURIComponent(n)}=${encodeURIComponent(o)}`);
  return e.length ? `?${e.join("&")}` : "";
}
async function le(t) {
  return (await t.get(`${R}/workspaces`)).workspaces;
}
async function ce(t, e, n) {
  return (await t.post(`${R}/workspaces`, n ? { path: e, name: n, companion: !0 } : { path: e, companion: !0 })).workspace;
}
async function de(t, e) {
  await t.del(`${R}/workspaces/${e}`);
}
const K = `${R}/companion`;
function ue(t) {
  return t.get(K);
}
function pe(t, e, n) {
  return t.put(`${R}/workspaces/${e}/companion`, { enabled: n });
}
function W(t, e = {}) {
  const n = {};
  return e.workspaceId !== void 0 && (n.workspaceId = e.workspaceId), e.rebuild && (n.rebuild = !0), e.manual && (n.manual = !0), t.post(`${K}/refresh`, n);
}
function me(t, e) {
  return t.get(`${R}/workspaces/${e}/board`);
}
function fe(t, e, n) {
  return t.get(`${K}/todos${se({ workspace: n === void 0 ? void 0 : String(n), state: e })}`);
}
const V = [...ie, "repair"], _ = { ...Q, repair: "Needs repair" };
function he(t) {
  const e = Object.fromEntries(V.map((n) => [n, []]));
  for (const n of t) (e[n.lane] ?? e.repair).push(n);
  return e;
}
function ge(t) {
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
function be(t, e = Date.now()) {
  var n;
  if (!t) return "";
  if (t.state === "scanning") {
    const o = (n = t.progress) == null ? void 0 : n.notes;
    return t.progress ? `Scanning… ${o} note(s) read${t.progress.rebuild ? " (rebuild)" : ""}` : "Scan queued…";
  }
  return t.indexedAt ? `${t.files ?? 0} note(s) indexed ${ye(t.indexedAt, e)}` : "";
}
function ye(t, e) {
  const n = Math.max(0, Math.round((e - t) / 1e3));
  if (n < 5) return "just now";
  if (n < 60) return `${n} s ago`;
  const o = Math.round(n / 60);
  return o < 60 ? `${o} min ago` : new Date(t).toLocaleString();
}
function xe(t, e) {
  const n = e.trim().toLocaleLowerCase();
  if (!n) return [...t];
  const o = [];
  for (const a of t) {
    const c = `${a.title}
${a.path}`.toLocaleLowerCase().includes(n) ? a.items : a.items.filter((p) => `${p.text}
${p.heading ?? ""}`.toLocaleLowerCase().includes(n));
    c.length && o.push({ ...a, items: c });
  }
  return o;
}
function q(t) {
  return t.trim() || "(empty)";
}
const G = "/md-notebook";
function we(t) {
  return (t.split("/").pop() ?? t).replace(/\.md$/i, "");
}
const k = {
  column: { display: "flex", flexDirection: "column", gap: 8, minHeight: 0, minWidth: 0 },
  row: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" },
  input: { padding: "4px 6px", border: "1px solid rgba(128,128,128,.4)", borderRadius: 4, background: "transparent", color: "inherit" },
  box: { padding: 8, borderRadius: 4, border: "1px solid rgba(128,128,128,.35)", display: "flex", flexDirection: "column", gap: 6 },
  notice: { padding: 8, borderRadius: 4, border: "1px solid rgba(220,120,0,.6)", display: "flex", flexDirection: "column", gap: 6 },
  badge: { fontSize: 11, padding: "0 4px", borderRadius: 3, border: "1px solid rgba(220,120,0,.7)" },
  mono: { fontFamily: "ui-monospace, monospace", fontSize: 12, wordBreak: "break-all" }
};
function T({ failure: t }) {
  return t ? /* @__PURE__ */ r("div", { role: "alert", className: "text-sm text-danger", "data-code": t.code, children: t.message }) : null;
}
function F() {
  try {
    return window.localStorage;
  } catch {
    return;
  }
}
const ve = 1500, ke = 3e4, M = "quartizo:workspace", g = {
  ...k,
  board: { display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(170px, 1fr)", gap: 8, overflowX: "auto", minHeight: 0, flex: 1 },
  lane: { display: "flex", flexDirection: "column", gap: 6, minHeight: 120, padding: 6, borderRadius: 4, border: "1px solid rgba(128,128,128,.25)" },
  cards: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 },
  card: { display: "flex", alignItems: "flex-start", gap: 4, padding: 6, borderRadius: 4, border: "1px solid rgba(128,128,128,.35)" },
  open: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2, padding: 0, background: "transparent", color: "inherit", border: "none", textAlign: "left", cursor: "pointer" },
  todoRow: { display: "flex", gap: 6, alignItems: "baseline" },
  copy: { flex: "none", fontSize: 11, padding: "1px 6px", borderRadius: 3, border: "1px solid rgba(128,128,128,.4)", background: "transparent", color: "inherit", cursor: "pointer" }
};
function Ne() {
  const [t, e] = b(() => typeof document > "u" || document.visibilityState !== "hidden");
  return S(() => {
    const n = () => e(document.visibilityState !== "hidden");
    return document.addEventListener("visibilitychange", n), () => document.removeEventListener("visibilitychange", n);
  }, []), t;
}
function X(t) {
  const [e, n] = b(null), [o, a] = b(null);
  return S(() => {
    let i = !1;
    return ue(t).then((c) => {
      i || (n(c.workspaces.filter((p) => p.workspace.companion)), a(c.available ? null : { message: c.error ?? "The Markdown index is unavailable." }));
    }).catch((c) => !i && a(E(c))), () => {
      i = !0;
    };
  }, [t]), { companions: e, failure: o };
}
function Y(t, e, n, o, a) {
  const i = Ne(), [c, p] = b(null), [u, m] = b(null), [y, N] = b(0), [$, s] = b(!1), w = O(null), v = O(n), f = O(o), x = O(a);
  v.current = n, f.current = o, x.current = a, S(() => {
    w.current = null, p(null), m(null);
  }, [e]), S(() => {
    if (!t || !i) return;
    let h = !1, z, I = !0;
    const D = async () => {
      try {
        (I || !w.current || !x.current(w.current)) && await B(f.current(!1));
        const A = await B(v.current());
        if (h) return;
        w.current = A, p(A), m(null);
      } catch (A) {
        h || m(E(A));
      }
      I = !1, h || (z = setTimeout(D, w.current && x.current(w.current) ? ve : ke));
    };
    return D(), () => {
      h = !0, clearTimeout(z);
    };
  }, [t, i, e, y]);
  const l = oe(async () => {
    s(!0);
    try {
      await B(f.current(!0)), m(null), N((h) => h + 1);
    } catch (h) {
      m(E(h));
    } finally {
      s(!1);
    }
  }, []);
  return { data: c, failure: u, busy: $, refresh: l };
}
function J(t) {
  const e = Date.now(), n = t.statuses.map((a) => be(a, e)).filter(Boolean), o = t.statuses.map((a) => ge(a)).filter((a) => !!a);
  return /* @__PURE__ */ d(P, { children: [
    /* @__PURE__ */ d("div", { style: g.row, children: [
      /* @__PURE__ */ r("span", { className: "text-sm text-muted", role: "status", "aria-live": "polite", children: n.join(" · ") }),
      /* @__PURE__ */ r(C, { onClick: t.onRefresh, disabled: t.busy, children: "Refresh" })
    ] }),
    o.map((a) => /* @__PURE__ */ r("div", { role: "note", className: "text-sm", style: g.notice, children: a }, a))
  ] });
}
function Z({ path: t }) {
  const e = we(t), [n, o] = b("idle");
  S(() => {
    if (n === "idle") return;
    const i = setTimeout(() => o("idle"), 1500);
    return () => clearTimeout(i);
  }, [n]);
  const a = async () => {
    try {
      await navigator.clipboard.writeText(e), o("copied");
    } catch {
      o("failed");
    }
  };
  return /* @__PURE__ */ r("button", { type: "button", onClick: () => void a(), "aria-label": `Copy note name “${e}”`, title: e, style: g.copy, children: n === "copied" ? "Copied" : n === "failed" ? "Failed" : "Copy name" });
}
function ee() {
  return /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "No folder is shared with Kiro Notes yet. Add one in Settings." });
}
function Se(t) {
  var c, p;
  const { companions: e, failure: n } = X(t.api), [o, a] = b(() => {
    var m;
    const u = Number((m = F()) == null ? void 0 : m.getItem(M));
    return Number.isInteger(u) && u > 0 ? u : null;
  }), i = ((c = e == null ? void 0 : e.find((u) => u.workspace.id === o)) == null ? void 0 : c.workspace) ?? ((p = e == null ? void 0 : e[0]) == null ? void 0 : p.workspace) ?? null;
  return S(() => {
    var u;
    try {
      i && ((u = F()) == null || u.setItem(M, String(i.id)));
    } catch {
    }
  }, [i]), n ? /* @__PURE__ */ r(T, { failure: n }) : e ? i ? /* @__PURE__ */ d("div", { style: { ...g.column, flex: 1 }, children: [
    e.length > 1 && /* @__PURE__ */ d("div", { style: g.row, children: [
      /* @__PURE__ */ r("label", { className: "text-sm", htmlFor: "qz-board-ws", children: "Workspace" }),
      /* @__PURE__ */ r("select", { id: "qz-board-ws", value: i.id, onChange: (u) => a(Number(u.target.value)), style: g.input, children: e.map((u) => /* @__PURE__ */ r("option", { value: u.workspace.id, children: u.workspace.name }, u.workspace.id)) })
    ] }),
    /* @__PURE__ */ r($e, { api: t.api, workspace: i }, i.id)
  ] }) : /* @__PURE__ */ r(ee, {}) : /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "Loading…" });
}
function $e(t) {
  const { api: e, workspace: n } = t, o = n.id, a = U(), { data: i, failure: c, busy: p, refresh: u } = Y(
    !0,
    String(o),
    () => me(e, o),
    (s) => W(e, { workspaceId: o, manual: s }),
    (s) => s.index.state === "scanning"
  ), m = H(() => he((i == null ? void 0 : i.tickets) ?? []), [i]), y = V.filter((s) => s !== "repair" || m.repair.length > 0), N = O(null), $ = (s) => {
    var I, D;
    const w = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"], v = s.target, f = Number(v.dataset.lane), x = Number(v.dataset.index);
    if (!w.includes(s.key) || Number.isNaN(f) || Number.isNaN(x)) return;
    let l = f, h = x;
    if (s.key === "ArrowUp" && (h = Math.max(0, x - 1)), s.key === "ArrowDown" && (h = x + 1), s.key === "Home" && (h = 0), s.key === "End" && (h = Number.MAX_SAFE_INTEGER), s.key === "ArrowLeft" || s.key === "ArrowRight") {
      const A = s.key === "ArrowLeft" ? -1 : 1;
      do
        l += A;
      while (l >= 0 && l < y.length && m[y[l]].length === 0);
      if (l < 0 || l >= y.length) return;
    }
    const z = m[y[l]];
    h = Math.min(h, z.length - 1), s.preventDefault(), (D = (I = N.current) == null ? void 0 : I.querySelector(`[data-lane="${l}"][data-index="${h}"]`)) == null || D.focus();
  };
  return /* @__PURE__ */ d("div", { style: { ...g.column, flex: 1 }, children: [
    /* @__PURE__ */ r(J, { statuses: i ? [i.index] : [], busy: p, onRefresh: () => void u() }),
    /* @__PURE__ */ r(T, { failure: c }),
    !i && !c && /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "Loading the board…" }),
    i && i.tickets.length === 0 && i.index.state !== "scanning" && /* @__PURE__ */ d("p", { className: "text-sm text-muted", children: [
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
    i && i.tickets.length > 0 && /* @__PURE__ */ r("div", { ref: N, style: g.board, onKeyDown: $, "aria-label": `Board of ${n.name}`, role: "group", children: y.map((s, w) => /* @__PURE__ */ d("section", { "aria-label": _[s], style: g.lane, children: [
      /* @__PURE__ */ d("strong", { className: "text-sm", children: [
        _[s],
        " (",
        m[s].length,
        ")"
      ] }),
      /* @__PURE__ */ r("ul", { style: g.cards, children: m[s].map((v, f) => /* @__PURE__ */ r("li", { children: /* @__PURE__ */ r(Te, { ticket: v, lane: w, index: f, onOpen: () => a(G) }) }, v.path)) })
    ] }, s)) })
  ] });
}
function Te(t) {
  const { ticket: e } = t;
  return /* @__PURE__ */ d("div", { style: g.card, children: [
    /* @__PURE__ */ d(
      "button",
      {
        type: "button",
        "data-lane": t.lane,
        "data-index": t.index,
        "aria-label": `Open Kiro Notes: ${e.title}`,
        onClick: t.onOpen,
        style: g.open,
        children: [
          /* @__PURE__ */ r("span", { className: "text-sm", style: { fontWeight: 600 }, children: e.title }),
          (e.todos.total > 0 || e.diagnostics.length > 0) && /* @__PURE__ */ d("span", { style: g.row, children: [
            e.todos.total > 0 && /* @__PURE__ */ d("span", { className: "text-sm text-muted", children: [
              "☑ ",
              e.todos.done,
              "/",
              e.todos.total
            ] }),
            e.diagnostics.map((n) => /* @__PURE__ */ r("span", { style: g.badge, title: n.message, children: n.code.replace(/_/g, " ") }, n.code))
          ] })
        ]
      }
    ),
    /* @__PURE__ */ r(Z, { path: e.path })
  ] });
}
function Ae(t) {
  const { api: e } = t, n = U(), { companions: o, failure: a } = X(e), [i, c] = b("all"), [p, u] = b("open"), [m, y] = b("");
  S(() => {
    o && i !== "all" && !o.some((l) => l.workspace.id === i) && c("all");
  }, [o, i]);
  const N = i === "all" ? void 0 : i, $ = !!o && o.length > 0, { data: s, failure: w, busy: v, refresh: f } = Y(
    $,
    `${i}:${p}`,
    () => fe(e, p, N),
    (l) => W(e, { workspaceId: N, manual: l }),
    (l) => Object.values(l.index).some((h) => h.state === "scanning")
  ), x = H(() => xe((s == null ? void 0 : s.groups) ?? [], m), [s, m]);
  return a ? /* @__PURE__ */ r(T, { failure: a }) : o ? o.length === 0 ? /* @__PURE__ */ r(ee, {}) : /* @__PURE__ */ d("div", { style: { ...g.column, flex: 1 }, children: [
    /* @__PURE__ */ d("div", { style: g.row, children: [
      o.length > 1 && /* @__PURE__ */ d(
        "select",
        {
          "aria-label": "Workspace",
          value: i,
          onChange: (l) => c(l.target.value === "all" ? "all" : Number(l.target.value)),
          style: g.input,
          children: [
            /* @__PURE__ */ r("option", { value: "all", children: "All workspaces" }),
            o.map((l) => /* @__PURE__ */ r("option", { value: l.workspace.id, children: l.workspace.name }, l.workspace.id))
          ]
        }
      ),
      /* @__PURE__ */ d("select", { "aria-label": "Show", value: p, onChange: (l) => u(l.target.value), style: g.input, children: [
        /* @__PURE__ */ r("option", { value: "open", children: "Open" }),
        /* @__PURE__ */ r("option", { value: "done", children: "Completed" }),
        /* @__PURE__ */ r("option", { value: "all", children: "All" })
      ] }),
      /* @__PURE__ */ r(
        "input",
        {
          "aria-label": "Filter TODOs",
          placeholder: "Filter",
          value: m,
          onChange: (l) => y(l.target.value),
          style: { ...g.input, flex: "1 1 200px" }
        }
      )
    ] }),
    /* @__PURE__ */ r(J, { statuses: s ? Object.values(s.index) : [], busy: v, onRefresh: () => void f() }),
    /* @__PURE__ */ r(T, { failure: w }),
    (s == null ? void 0 : s.truncated) && /* @__PURE__ */ r("div", { role: "note", className: "text-sm", style: g.notice, children: "Only the first items are listed. Narrow it down by workspace, state or filter." }),
    !s && !w && /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "Loading TODOs…" }),
    s && x.length === 0 && /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: m.trim() ? "No TODO matches." : "No TODOs." }),
    /* @__PURE__ */ r("div", { style: { ...g.column, overflowY: "auto" }, children: x.map((l) => /* @__PURE__ */ d("section", { "aria-label": l.title, style: g.box, children: [
      /* @__PURE__ */ d("strong", { className: "text-sm", children: [
        l.title,
        l.ticket && l.status && /* @__PURE__ */ r("span", { className: "text-muted", style: { fontWeight: 400 }, children: ` · ${Q[l.status]}` })
      ] }),
      /* @__PURE__ */ r("ul", { style: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }, children: l.items.map((h) => /* @__PURE__ */ d("li", { style: { ...g.todoRow, paddingLeft: h.depth * 18 }, children: [
        /* @__PURE__ */ d(
          "button",
          {
            type: "button",
            "aria-label": `Open Kiro Notes: ${q(h.text)}`,
            onClick: () => n(G),
            style: { ...g.open, flexDirection: "row", gap: 6 },
            children: [
              /* @__PURE__ */ r("span", { "aria-hidden": "true", children: h.checked ? "☑" : "☐" }),
              /* @__PURE__ */ r("span", { className: "text-sm", style: { textDecoration: h.checked ? "line-through" : void 0 }, children: q(h.text) })
            ]
          }
        ),
        /* @__PURE__ */ r(Z, { path: l.path })
      ] }, h.ordinal)) })
    ] }, `${l.workspaceId}:${l.path}`)) })
  ] }) : /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "Loading…" });
}
const j = { ...k.input, flex: 1, minWidth: 0 };
function te() {
  const [t, e] = b(!1), [n, o] = b(null);
  return { busy: t, failure: n, run: async (i) => {
    e(!0), o(null);
    try {
      return await i(), !0;
    } catch (c) {
      return o(E(c)), !1;
    } finally {
      e(!1);
    }
  } };
}
function Ce(t) {
  const { api: e } = t, [n, o] = b(null), [a, i] = b(null), [c, p] = b(0), [u, m] = b(""), [y, N] = b(""), { busy: $, failure: s, run: w } = te();
  S(() => {
    let f = !1;
    return le(e).then((x) => !f && o(x)).catch((x) => !f && i(E(x))), () => {
      f = !0;
    };
  }, [e, c]);
  const v = async () => {
    await w(() => ce(e, u.trim(), y.trim() || void 0)) && (m(""), N(""), p((f) => f + 1));
  };
  return /* @__PURE__ */ d("div", { style: k.column, children: [
    /* @__PURE__ */ r("strong", { className: "text-sm", children: "Folders" }),
    /* @__PURE__ */ r(T, { failure: a }),
    !n && !a && /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "Loading…" }),
    (n == null ? void 0 : n.length) === 0 && /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "No folder yet. Add the folder you also attached in Kiro Notes." }),
    n == null ? void 0 : n.map((f) => /* @__PURE__ */ r(Re, { api: e, workspace: f, onChanged: () => p((x) => x + 1) }, f.id)),
    /* @__PURE__ */ d("div", { style: k.row, children: [
      /* @__PURE__ */ r(
        "input",
        {
          "aria-label": "Absolute folder path",
          placeholder: "/home/you/notes",
          value: u,
          onChange: (f) => m(f.target.value),
          onKeyDown: (f) => f.key === "Enter" && u.trim() && !$ && void v(),
          style: j
        }
      ),
      /* @__PURE__ */ r("input", { "aria-label": "Name (optional)", placeholder: "Name (optional)", value: y, onChange: (f) => N(f.target.value), style: { ...j, flex: "0 1 180px" } }),
      /* @__PURE__ */ r(C, { onClick: () => void v(), disabled: $ || !u.trim(), children: "Add folder" })
    ] }),
    /* @__PURE__ */ r(T, { failure: s })
  ] });
}
function Re(t) {
  const { api: e, workspace: n } = t, { busy: o, failure: a, run: i } = te(), [c, p] = b(null), [u, m] = b(!1);
  return S(() => {
    if (!c) return;
    const y = setTimeout(() => p(null), 3e3);
    return () => clearTimeout(y);
  }, [c]), /* @__PURE__ */ d("section", { "aria-label": n.name, style: k.box, children: [
    /* @__PURE__ */ d("div", { style: k.row, children: [
      /* @__PURE__ */ r("strong", { className: "text-sm", children: n.name }),
      /* @__PURE__ */ r("span", { className: "text-sm text-muted", style: k.mono, children: n.path })
    ] }),
    /* @__PURE__ */ d("div", { style: k.row, children: [
      /* @__PURE__ */ d("label", { className: "text-sm", style: k.row, children: [
        /* @__PURE__ */ r(
          "input",
          {
            type: "checkbox",
            checked: !!n.companion,
            disabled: o,
            onChange: () => void i(() => pe(e, n.id, !n.companion)).then((y) => y && t.onChanged())
          }
        ),
        "Shared with Kiro Notes"
      ] }),
      /* @__PURE__ */ r("span", { style: { flex: 1 } }),
      n.companion && /* @__PURE__ */ r(
        C,
        {
          onClick: () => void i(() => W(e, { workspaceId: n.id, manual: !0, rebuild: !0 })).then(
            (y) => y && p("Rebuild requested.")
          ),
          disabled: o,
          children: "Rebuild index"
        }
      ),
      !u && /* @__PURE__ */ r(C, { onClick: () => m(!0), disabled: o, children: "Remove…" })
    ] }),
    u && /* @__PURE__ */ d("div", { role: "alertdialog", "aria-label": "Remove folder", style: k.notice, children: [
      /* @__PURE__ */ d("span", { className: "text-sm", children: [
        "Stop showing “",
        n.name,
        "” in Quartizo? The folder and its files are not touched."
      ] }),
      /* @__PURE__ */ d("div", { style: k.row, children: [
        /* @__PURE__ */ r(C, { onClick: () => void i(() => de(e, n.id)).then((y) => y && t.onChanged()), disabled: o, children: "Remove" }),
        /* @__PURE__ */ r(C, { onClick: () => m(!1), disabled: o, children: "Cancel" })
      ] })
    ] }),
    c && /* @__PURE__ */ r("span", { className: "text-sm text-muted", role: "status", children: c }),
    /* @__PURE__ */ r(T, { failure: a })
  ] });
}
const L = [
  { id: "tasks", label: "Tasks" },
  { id: "todos", label: "TODOs" },
  { id: "settings", label: "Settings" }
];
function Ee() {
  const t = ne(), [e, n] = b("tasks");
  return /* @__PURE__ */ d(P, { children: [
    /* @__PURE__ */ r(re, { title: "Quartizo", subtitle: "Kiro Notes board and TODOs" }),
    /* @__PURE__ */ d("div", { className: "px-6 pb-8 flex-1 min-h-0 flex flex-col gap-3", children: [
      /* @__PURE__ */ r("div", { role: "tablist", "aria-label": "Quartizo", onKeyDown: (a) => {
        var p;
        if (a.key !== "ArrowLeft" && a.key !== "ArrowRight") return;
        a.preventDefault();
        const i = L.findIndex((u) => u.id === e), c = L[(i + (a.key === "ArrowRight" ? 1 : L.length - 1)) % L.length];
        n(c.id), (p = document.getElementById(`qz-tab-${c.id}`)) == null || p.focus();
      }, style: { display: "flex", gap: 4 }, children: L.map((a) => /* @__PURE__ */ r(
        "button",
        {
          id: `qz-tab-${a.id}`,
          type: "button",
          role: "tab",
          "aria-selected": e === a.id,
          "aria-controls": "qz-panel",
          tabIndex: e === a.id ? 0 : -1,
          onClick: () => n(a.id),
          style: {
            padding: "4px 12px",
            background: "transparent",
            color: "inherit",
            border: "none",
            borderBottom: e === a.id ? "2px solid currentColor" : "2px solid transparent",
            fontWeight: e === a.id ? 600 : 400,
            cursor: "pointer"
          },
          children: a.label
        },
        a.id
      )) }),
      /* @__PURE__ */ d(
        "div",
        {
          id: "qz-panel",
          role: "tabpanel",
          "aria-labelledby": `qz-tab-${e}`,
          style: { display: "flex", flexDirection: "column", flex: 1, minHeight: 0 },
          children: [
            e === "tasks" && /* @__PURE__ */ r(Se, { api: t }),
            e === "todos" && /* @__PURE__ */ r(Ae, { api: t }),
            e === "settings" && /* @__PURE__ */ r(Ce, { api: t })
          ]
        }
      )
    ] })
  ] });
}
export {
  Ee as default
};
