import { jsx as r, jsxs as d, Fragment as P } from "react/jsx-runtime";
import { useNavigate as U, useAppApi as oe } from "@kirocrew/app-sdk";
import { Btn as C, PageHeader as ae } from "@kirocrew/app-sdk/ui";
import { useState as b, useEffect as T, useMemo as H, useRef as O, useCallback as se } from "react";
const R = "/apps/quartizo/api", ie = 15e3, le = ["backlog", "ready", "in_progress", "review", "done"], Q = {
  backlog: "Backlog",
  ready: "Ready",
  in_progress: "In Progress",
  review: "Review",
  done: "Done"
};
function E(n) {
  const e = n;
  if ((e == null ? void 0 : e.name) === "AppApiPermissionError")
    return { code: "permission_denied", message: "Quartizo has not declared access to this API in app.json." };
  const t = typeof (e == null ? void 0 : e.status) == "number" ? e.status : void 0;
  let o;
  if (typeof (e == null ? void 0 : e.body) == "string" && e.body)
    try {
      const c = JSON.parse(e.body);
      c && typeof c == "object" && !Array.isArray(c) && (o = c);
    } catch {
    }
  const s = typeof (o == null ? void 0 : o.code) == "string" ? o.code : void 0, a = typeof (o == null ? void 0 : o.error) == "string" ? o.error : typeof (e == null ? void 0 : e.message) == "string" ? e.message : String(n);
  return { status: t, code: s, message: a };
}
function B(n, e = ie) {
  let t;
  const o = new Promise((s, a) => {
    t = setTimeout(() => a(new Error(`request timed out after ${Math.round(e / 1e3)} s`)), e);
  });
  return Promise.race([n, o]).finally(() => clearTimeout(t));
}
function ce(n) {
  const e = Object.entries(n).filter((t) => t[1] !== void 0 && t[1] !== "").map(([t, o]) => `${encodeURIComponent(t)}=${encodeURIComponent(o)}`);
  return e.length ? `?${e.join("&")}` : "";
}
async function de(n) {
  return (await n.get(`${R}/workspaces`)).workspaces;
}
async function ue(n, e, t) {
  return (await n.post(`${R}/workspaces`, t ? { path: e, name: t, companion: !0 } : { path: e, companion: !0 })).workspace;
}
async function pe(n, e, t = !1) {
  await n.del(`${R}/workspaces/${e}${t ? "?deleteOldTasks=1" : ""}`);
}
const F = `${R}/companion`;
function me(n) {
  return n.get(F);
}
function fe(n, e, t) {
  return n.put(`${R}/workspaces/${e}/companion`, { enabled: t });
}
function K(n, e = {}) {
  const t = {};
  return e.workspaceId !== void 0 && (t.workspaceId = e.workspaceId), e.rebuild && (t.rebuild = !0), e.manual && (t.manual = !0), n.post(`${F}/refresh`, t);
}
function he(n, e) {
  return n.get(`${R}/workspaces/${e}/board`);
}
function ge(n, e, t) {
  return n.get(`${F}/todos${ce({ workspace: t === void 0 ? void 0 : String(t), state: e })}`);
}
const V = [...le, "repair"], W = { ...Q, repair: "Needs repair" };
function be(n) {
  const e = Object.fromEntries(V.map((t) => [t, []]));
  for (const t of n) (e[t.lane] ?? e.repair).push(t);
  return e;
}
function ye(n) {
  if (!n) return null;
  switch (n.state) {
    case "off":
      return "This workspace is not in Kiro Notes companion mode.";
    case "unavailable":
      return `The Markdown index is unavailable: ${typeof n.error == "string" ? n.error : "parsers failed to load"}.`;
    case "unindexed":
      return "Not indexed yet.";
    case "error":
    case "stale": {
      const t = n.error && typeof n.error == "object" ? n.error.message : "the last scan failed";
      return n.state === "stale" ? `The last scan failed (${t}); showing the previous scan.` : `Indexing failed: ${t}.`;
    }
  }
  const e = [];
  return n.complete === !1 ? e.push("The last scan was incomplete (a limit was reached or a folder could not be read): notes it did not reach are shown as last indexed, and none were treated as deleted.") : n.retained && e.push(`${n.retained} note(s) could not be read and are shown as last indexed.`), n.outdated && e.push("This index was built by an older version; refresh to update it."), e.length ? e.join(" ") : null;
}
function xe(n, e = Date.now()) {
  var t;
  if (!n) return "";
  if (n.state === "scanning") {
    const o = (t = n.progress) == null ? void 0 : t.notes;
    return n.progress ? `Scanning… ${o} note(s) read${n.progress.rebuild ? " (rebuild)" : ""}` : "Scan queued…";
  }
  return n.indexedAt ? `${n.files ?? 0} note(s) indexed ${we(n.indexedAt, e)}` : "";
}
function we(n, e) {
  const t = Math.max(0, Math.round((e - n) / 1e3));
  if (t < 5) return "just now";
  if (t < 60) return `${t} s ago`;
  const o = Math.round(t / 60);
  return o < 60 ? `${o} min ago` : new Date(n).toLocaleString();
}
function ke(n, e) {
  const t = e.trim().toLocaleLowerCase();
  if (!t) return [...n];
  const o = [];
  for (const s of n) {
    const c = `${s.title}
${s.path}`.toLocaleLowerCase().includes(t) ? s.items : s.items.filter((p) => `${p.text}
${p.heading ?? ""}`.toLocaleLowerCase().includes(t));
    c.length && o.push({ ...s, items: c });
  }
  return o;
}
function _(n) {
  return n.trim() || "(empty)";
}
const G = "/md-notebook";
function X(n) {
  return (n.split("/").pop() ?? n).replace(/\.md$/i, "");
}
const v = {
  column: { display: "flex", flexDirection: "column", gap: 8, minHeight: 0, minWidth: 0 },
  row: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" },
  input: { padding: "4px 6px", border: "1px solid rgba(128,128,128,.4)", borderRadius: 4, background: "transparent", color: "inherit" },
  box: { padding: 8, borderRadius: 4, border: "1px solid rgba(128,128,128,.35)", display: "flex", flexDirection: "column", gap: 6 },
  notice: { padding: 8, borderRadius: 4, border: "1px solid rgba(220,120,0,.6)", display: "flex", flexDirection: "column", gap: 6 },
  badge: { fontSize: 11, padding: "0 4px", borderRadius: 3, border: "1px solid rgba(220,120,0,.7)" },
  mono: { fontFamily: "ui-monospace, monospace", fontSize: 12, wordBreak: "break-all" }
};
function $({ failure: n }) {
  return n ? /* @__PURE__ */ r("div", { role: "alert", className: "text-sm text-danger", "data-code": n.code, children: n.message }) : null;
}
function q() {
  try {
    return window.localStorage;
  } catch {
    return;
  }
}
const ve = 1500, Ne = 3e4, M = "quartizo:workspace", g = {
  ...v,
  board: { display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(170px, 1fr)", gap: 8, overflowX: "auto", minHeight: 0, flex: 1 },
  lane: { display: "flex", flexDirection: "column", gap: 6, minHeight: 120, padding: 6, borderRadius: 4, border: "1px solid rgba(128,128,128,.25)" },
  cards: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 },
  card: { display: "flex", alignItems: "flex-start", gap: 4, padding: 6, borderRadius: 4, border: "1px solid rgba(128,128,128,.35)" },
  open: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2, padding: 0, background: "transparent", color: "inherit", border: "none", textAlign: "left", cursor: "pointer" },
  todoRow: { display: "flex", gap: 6, alignItems: "baseline" },
  copy: { flex: "none", fontSize: 11, padding: "1px 6px", borderRadius: 3, border: "1px solid rgba(128,128,128,.4)", background: "transparent", color: "inherit", cursor: "pointer" }
};
function Te() {
  const [n, e] = b(() => typeof document > "u" || document.visibilityState !== "hidden");
  return T(() => {
    const t = () => e(document.visibilityState !== "hidden");
    return document.addEventListener("visibilitychange", t), () => document.removeEventListener("visibilitychange", t);
  }, []), n;
}
function Y(n) {
  const [e, t] = b(null), [o, s] = b(null);
  return T(() => {
    let a = !1;
    return me(n).then((c) => {
      a || (t(c.workspaces.filter((p) => p.workspace.companion)), s(c.available ? null : { message: c.error ?? "The Markdown index is unavailable." }));
    }).catch((c) => !a && s(E(c))), () => {
      a = !0;
    };
  }, [n]), { companions: e, failure: o };
}
function J(n, e, t, o, s) {
  const a = Te(), [c, p] = b(null), [u, m] = b(null), [y, N] = b(0), [S, i] = b(!1), w = O(null), k = O(t), f = O(o), x = O(s);
  k.current = t, f.current = o, x.current = s, T(() => {
    w.current = null, p(null), m(null);
  }, [e]), T(() => {
    if (!n || !a) return;
    let h = !1, z, I = !0;
    const D = async () => {
      try {
        (I || !w.current || !x.current(w.current)) && await B(f.current(!1));
        const A = await B(k.current());
        if (h) return;
        w.current = A, p(A), m(null);
      } catch (A) {
        h || m(E(A));
      }
      I = !1, h || (z = setTimeout(D, w.current && x.current(w.current) ? ve : Ne));
    };
    return D(), () => {
      h = !0, clearTimeout(z);
    };
  }, [n, a, e, y]);
  const l = se(async () => {
    i(!0);
    try {
      await B(f.current(!0)), m(null), N((h) => h + 1);
    } catch (h) {
      m(E(h));
    } finally {
      i(!1);
    }
  }, []);
  return { data: c, failure: u, busy: S, refresh: l };
}
function Z(n) {
  const e = Date.now(), t = n.statuses.map((s) => xe(s, e)).filter(Boolean), o = n.statuses.map((s) => ye(s)).filter((s) => !!s);
  return /* @__PURE__ */ d(P, { children: [
    /* @__PURE__ */ d("div", { style: g.row, children: [
      /* @__PURE__ */ r("span", { className: "text-sm text-muted", role: "status", "aria-live": "polite", children: t.join(" · ") }),
      /* @__PURE__ */ r(C, { onClick: n.onRefresh, disabled: n.busy, children: "Refresh" })
    ] }),
    o.map((s) => /* @__PURE__ */ r("div", { role: "note", className: "text-sm", style: g.notice, children: s }, s))
  ] });
}
function ee({ path: n }) {
  const e = X(n), [t, o] = b("idle");
  T(() => {
    if (t === "idle") return;
    const a = setTimeout(() => o("idle"), 1500);
    return () => clearTimeout(a);
  }, [t]);
  const s = async () => {
    try {
      await navigator.clipboard.writeText(e), o("copied");
    } catch {
      o("failed");
    }
  };
  return /* @__PURE__ */ r("button", { type: "button", onClick: () => void s(), "aria-label": `Copy note name “${e}”`, title: e, style: g.copy, children: t === "copied" ? "Copied" : t === "failed" ? "Failed" : "Copy name" });
}
function te({ path: n, title: e }) {
  const t = X(n);
  return t === e ? null : /* @__PURE__ */ r("span", { className: "text-sm text-muted", style: g.mono, children: t });
}
function ne() {
  return /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "No folder is shared with Kiro Notes yet. Add one in Settings." });
}
function Se(n) {
  var c, p;
  const { companions: e, failure: t } = Y(n.api), [o, s] = b(() => {
    var m;
    const u = Number((m = q()) == null ? void 0 : m.getItem(M));
    return Number.isInteger(u) && u > 0 ? u : null;
  }), a = ((c = e == null ? void 0 : e.find((u) => u.workspace.id === o)) == null ? void 0 : c.workspace) ?? ((p = e == null ? void 0 : e[0]) == null ? void 0 : p.workspace) ?? null;
  return T(() => {
    var u;
    try {
      a && ((u = q()) == null || u.setItem(M, String(a.id)));
    } catch {
    }
  }, [a]), t ? /* @__PURE__ */ r($, { failure: t }) : e ? a ? /* @__PURE__ */ d("div", { style: { ...g.column, flex: 1 }, children: [
    e.length > 1 && /* @__PURE__ */ d("div", { style: g.row, children: [
      /* @__PURE__ */ r("label", { className: "text-sm", htmlFor: "qz-board-ws", children: "Workspace" }),
      /* @__PURE__ */ r("select", { id: "qz-board-ws", value: a.id, onChange: (u) => s(Number(u.target.value)), style: g.input, children: e.map((u) => /* @__PURE__ */ r("option", { value: u.workspace.id, children: u.workspace.name }, u.workspace.id)) })
    ] }),
    /* @__PURE__ */ r($e, { api: n.api, workspace: a }, a.id)
  ] }) : /* @__PURE__ */ r(ne, {}) : /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "Loading…" });
}
function $e(n) {
  const { api: e, workspace: t } = n, o = t.id, s = U(), { data: a, failure: c, busy: p, refresh: u } = J(
    !0,
    String(o),
    () => he(e, o),
    (i) => K(e, { workspaceId: o, manual: i }),
    (i) => i.index.state === "scanning"
  ), m = H(() => be((a == null ? void 0 : a.tickets) ?? []), [a]), y = V.filter((i) => i !== "repair" || m.repair.length > 0), N = O(null), S = (i) => {
    var I, D;
    const w = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"], k = i.target, f = Number(k.dataset.lane), x = Number(k.dataset.index);
    if (!w.includes(i.key) || Number.isNaN(f) || Number.isNaN(x)) return;
    let l = f, h = x;
    if (i.key === "ArrowUp" && (h = Math.max(0, x - 1)), i.key === "ArrowDown" && (h = x + 1), i.key === "Home" && (h = 0), i.key === "End" && (h = Number.MAX_SAFE_INTEGER), i.key === "ArrowLeft" || i.key === "ArrowRight") {
      const A = i.key === "ArrowLeft" ? -1 : 1;
      do
        l += A;
      while (l >= 0 && l < y.length && m[y[l]].length === 0);
      if (l < 0 || l >= y.length) return;
    }
    const z = m[y[l]];
    h = Math.min(h, z.length - 1), i.preventDefault(), (D = (I = N.current) == null ? void 0 : I.querySelector(`[data-lane="${l}"][data-index="${h}"]`)) == null || D.focus();
  };
  return /* @__PURE__ */ d("div", { style: { ...g.column, flex: 1 }, children: [
    /* @__PURE__ */ r(Z, { statuses: a ? [a.index] : [], busy: p, onRefresh: () => void u() }),
    /* @__PURE__ */ r($, { failure: c }),
    !a && !c && /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "Loading the board…" }),
    a && a.tickets.length === 0 && a.index.state !== "scanning" && /* @__PURE__ */ d("p", { className: "text-sm text-muted", children: [
      "No ticket notes in “",
      t.name,
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
    a && a.tickets.length > 0 && /* @__PURE__ */ r("div", { ref: N, style: g.board, onKeyDown: S, "aria-label": `Board of ${t.name}`, role: "group", children: y.map((i, w) => /* @__PURE__ */ d("section", { "aria-label": W[i], style: g.lane, children: [
      /* @__PURE__ */ d("strong", { className: "text-sm", children: [
        W[i],
        " (",
        m[i].length,
        ")"
      ] }),
      /* @__PURE__ */ r("ul", { style: g.cards, children: m[i].map((k, f) => /* @__PURE__ */ r("li", { children: /* @__PURE__ */ r(Ae, { ticket: k, lane: w, index: f, onOpen: () => s(G) }) }, k.path)) })
    ] }, i)) })
  ] });
}
function Ae(n) {
  const { ticket: e } = n;
  return /* @__PURE__ */ d("div", { style: g.card, children: [
    /* @__PURE__ */ d(
      "button",
      {
        type: "button",
        "data-lane": n.lane,
        "data-index": n.index,
        "aria-label": `Open Kiro Notes: ${e.title}`,
        onClick: n.onOpen,
        style: g.open,
        children: [
          /* @__PURE__ */ r("span", { className: "text-sm", style: { fontWeight: 600 }, children: e.title }),
          /* @__PURE__ */ r(te, { path: e.path, title: e.title }),
          (e.todos.total > 0 || e.diagnostics.length > 0) && /* @__PURE__ */ d("span", { style: g.row, children: [
            e.todos.total > 0 && /* @__PURE__ */ d("span", { className: "text-sm text-muted", children: [
              "☑ ",
              e.todos.done,
              "/",
              e.todos.total
            ] }),
            e.diagnostics.map((t) => /* @__PURE__ */ r("span", { style: g.badge, title: t.message, children: t.code.replace(/_/g, " ") }, t.code))
          ] })
        ]
      }
    ),
    /* @__PURE__ */ r(ee, { path: e.path })
  ] });
}
function Ce(n) {
  const { api: e } = n, t = U(), { companions: o, failure: s } = Y(e), [a, c] = b("all"), [p, u] = b("open"), [m, y] = b("");
  T(() => {
    o && a !== "all" && !o.some((l) => l.workspace.id === a) && c("all");
  }, [o, a]);
  const N = a === "all" ? void 0 : a, S = !!o && o.length > 0, { data: i, failure: w, busy: k, refresh: f } = J(
    S,
    `${a}:${p}`,
    () => ge(e, p, N),
    (l) => K(e, { workspaceId: N, manual: l }),
    (l) => Object.values(l.index).some((h) => h.state === "scanning")
  ), x = H(() => ke((i == null ? void 0 : i.groups) ?? [], m), [i, m]);
  return s ? /* @__PURE__ */ r($, { failure: s }) : o ? o.length === 0 ? /* @__PURE__ */ r(ne, {}) : /* @__PURE__ */ d("div", { style: { ...g.column, flex: 1 }, children: [
    /* @__PURE__ */ d("div", { style: g.row, children: [
      o.length > 1 && /* @__PURE__ */ d(
        "select",
        {
          "aria-label": "Workspace",
          value: a,
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
    /* @__PURE__ */ r(Z, { statuses: i ? Object.values(i.index) : [], busy: k, onRefresh: () => void f() }),
    /* @__PURE__ */ r($, { failure: w }),
    (i == null ? void 0 : i.truncated) && /* @__PURE__ */ r("div", { role: "note", className: "text-sm", style: g.notice, children: "Only the first items are listed. Narrow it down by workspace, state or filter." }),
    !i && !w && /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "Loading TODOs…" }),
    i && x.length === 0 && /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: m.trim() ? "No TODO matches." : "No TODOs." }),
    /* @__PURE__ */ r("div", { style: { ...g.column, overflowY: "auto" }, children: x.map((l) => /* @__PURE__ */ d("section", { "aria-label": l.title, style: g.box, children: [
      /* @__PURE__ */ d("strong", { className: "text-sm", children: [
        l.title,
        l.ticket && l.status && /* @__PURE__ */ r("span", { className: "text-muted", style: { fontWeight: 400 }, children: ` · ${Q[l.status]}` })
      ] }),
      /* @__PURE__ */ r(te, { path: l.path, title: l.title }),
      /* @__PURE__ */ r("ul", { style: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }, children: l.items.map((h) => /* @__PURE__ */ d("li", { style: { ...g.todoRow, paddingLeft: h.depth * 18 }, children: [
        /* @__PURE__ */ d(
          "button",
          {
            type: "button",
            "aria-label": `Open Kiro Notes: ${_(h.text)}`,
            onClick: () => t(G),
            style: { ...g.open, flexDirection: "row", gap: 6 },
            children: [
              /* @__PURE__ */ r("span", { "aria-hidden": "true", children: h.checked ? "☑" : "☐" }),
              /* @__PURE__ */ r("span", { className: "text-sm", style: { textDecoration: h.checked ? "line-through" : void 0 }, children: _(h.text) })
            ]
          }
        ),
        /* @__PURE__ */ r(ee, { path: l.path })
      ] }, h.ordinal)) })
    ] }, `${l.workspaceId}:${l.path}`)) })
  ] }) : /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "Loading…" });
}
const j = { ...v.input, flex: 1, minWidth: 0 };
function re() {
  const [n, e] = b(!1), [t, o] = b(null);
  return { busy: n, failure: t, run: async (a) => {
    e(!0), o(null);
    try {
      return await a(), !0;
    } catch (c) {
      return o(E(c)), !1;
    } finally {
      e(!1);
    }
  } };
}
function Re(n) {
  const { api: e } = n, [t, o] = b(null), [s, a] = b(null), [c, p] = b(0), [u, m] = b(""), [y, N] = b(""), { busy: S, failure: i, run: w } = re();
  T(() => {
    let f = !1;
    return de(e).then((x) => {
      f || (o(x), a(null));
    }).catch((x) => !f && a(E(x))), () => {
      f = !0;
    };
  }, [e, c]);
  const k = async () => {
    await w(() => ue(e, u.trim(), y.trim() || void 0)) && (m(""), N(""), p((f) => f + 1));
  };
  return /* @__PURE__ */ d("div", { style: v.column, children: [
    /* @__PURE__ */ r("strong", { className: "text-sm", children: "Folders" }),
    /* @__PURE__ */ r($, { failure: s }),
    !t && !s && /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "Loading…" }),
    (t == null ? void 0 : t.length) === 0 && /* @__PURE__ */ r("p", { className: "text-sm text-muted", children: "No folder yet. Add the folder you also attached in Kiro Notes." }),
    t == null ? void 0 : t.map((f) => /* @__PURE__ */ r(Ie, { api: e, workspace: f, onChanged: () => p((x) => x + 1) }, f.id)),
    /* @__PURE__ */ d("div", { style: v.row, children: [
      /* @__PURE__ */ r(
        "input",
        {
          "aria-label": "Absolute folder path",
          placeholder: "/home/you/notes",
          value: u,
          onChange: (f) => m(f.target.value),
          onKeyDown: (f) => f.key === "Enter" && u.trim() && !S && void k(),
          style: j
        }
      ),
      /* @__PURE__ */ r("input", { "aria-label": "Name (optional)", placeholder: "Name (optional)", value: y, onChange: (f) => N(f.target.value), style: { ...j, flex: "0 1 180px" } }),
      /* @__PURE__ */ r(C, { onClick: () => void k(), disabled: S || !u.trim(), children: "Add folder" })
    ] }),
    /* @__PURE__ */ r($, { failure: i })
  ] });
}
function Ie(n) {
  const { api: e, workspace: t } = n, { busy: o, failure: s, run: a } = re(), [c, p] = b(null), [u, m] = b(!1);
  return T(() => {
    if (!c) return;
    const y = setTimeout(() => p(null), 3e3);
    return () => clearTimeout(y);
  }, [c]), /* @__PURE__ */ d("section", { "aria-label": t.name, style: v.box, children: [
    /* @__PURE__ */ d("div", { style: v.row, children: [
      /* @__PURE__ */ r("strong", { className: "text-sm", children: t.name }),
      /* @__PURE__ */ r("span", { className: "text-sm text-muted", style: v.mono, children: t.path })
    ] }),
    /* @__PURE__ */ d("div", { style: v.row, children: [
      /* @__PURE__ */ d("label", { className: "text-sm", style: v.row, children: [
        /* @__PURE__ */ r(
          "input",
          {
            type: "checkbox",
            checked: !!t.companion,
            disabled: o,
            onChange: () => void a(() => fe(e, t.id, !t.companion)).then((y) => y && n.onChanged())
          }
        ),
        "Shared with Kiro Notes"
      ] }),
      /* @__PURE__ */ r("span", { style: { flex: 1 } }),
      t.companion && /* @__PURE__ */ r(
        C,
        {
          onClick: () => void a(() => K(e, { workspaceId: t.id, manual: !0, rebuild: !0 })).then(
            (y) => y && p("Rebuild requested.")
          ),
          disabled: o,
          children: "Rebuild index"
        }
      ),
      !u && /* @__PURE__ */ r(C, { onClick: () => m(!0), disabled: o, children: "Remove…" })
    ] }),
    u && /* @__PURE__ */ d("div", { role: "alertdialog", "aria-label": "Remove folder", style: v.notice, children: [
      /* @__PURE__ */ d("span", { className: "text-sm", children: [
        "Stop showing “",
        t.name,
        "” in Quartizo? The folder and its files are not touched.",
        !!t.oldTasks && ` It still has ${t.oldTasks} task(s) from Quartizo's old task board, which no view shows any more: removing the folder deletes them.`
      ] }),
      /* @__PURE__ */ d("div", { style: v.row, children: [
        /* @__PURE__ */ r(
          C,
          {
            onClick: () => void a(() => pe(e, t.id, !!t.oldTasks)).then((y) => y && n.onChanged()),
            disabled: o,
            children: t.oldTasks ? `Remove and delete ${t.oldTasks} task(s)` : "Remove"
          }
        ),
        /* @__PURE__ */ r(C, { onClick: () => m(!1), disabled: o, children: "Cancel" })
      ] })
    ] }),
    c && /* @__PURE__ */ r("span", { className: "text-sm text-muted", role: "status", children: c }),
    /* @__PURE__ */ r($, { failure: s })
  ] });
}
const L = [
  { id: "tasks", label: "Tasks" },
  { id: "todos", label: "TODOs" },
  { id: "settings", label: "Settings" }
];
function ze() {
  const n = oe(), [e, t] = b("tasks");
  return /* @__PURE__ */ d(P, { children: [
    /* @__PURE__ */ r(ae, { title: "Quartizo", subtitle: "Kiro Notes board and TODOs" }),
    /* @__PURE__ */ d("div", { className: "px-6 pb-8 flex-1 min-h-0 flex flex-col gap-3", children: [
      /* @__PURE__ */ r("div", { role: "tablist", "aria-label": "Quartizo", onKeyDown: (s) => {
        var p;
        if (s.key !== "ArrowLeft" && s.key !== "ArrowRight") return;
        s.preventDefault();
        const a = L.findIndex((u) => u.id === e), c = L[(a + (s.key === "ArrowRight" ? 1 : L.length - 1)) % L.length];
        t(c.id), (p = document.getElementById(`qz-tab-${c.id}`)) == null || p.focus();
      }, style: { display: "flex", gap: 4 }, children: L.map((s) => /* @__PURE__ */ r(
        "button",
        {
          id: `qz-tab-${s.id}`,
          type: "button",
          role: "tab",
          "aria-selected": e === s.id,
          "aria-controls": "qz-panel",
          tabIndex: e === s.id ? 0 : -1,
          onClick: () => t(s.id),
          style: {
            padding: "4px 12px",
            background: "transparent",
            color: "inherit",
            border: "none",
            borderBottom: e === s.id ? "2px solid currentColor" : "2px solid transparent",
            fontWeight: e === s.id ? 600 : 400,
            cursor: "pointer"
          },
          children: s.label
        },
        s.id
      )) }),
      /* @__PURE__ */ d(
        "div",
        {
          id: "qz-panel",
          role: "tabpanel",
          "aria-labelledby": `qz-tab-${e}`,
          style: { display: "flex", flexDirection: "column", flex: 1, minHeight: 0 },
          children: [
            e === "tasks" && /* @__PURE__ */ r(Se, { api: n }),
            e === "todos" && /* @__PURE__ */ r(Ce, { api: n }),
            e === "settings" && /* @__PURE__ */ r(Re, { api: n })
          ]
        }
      )
    ] })
  ] });
}
export {
  ze as default
};
