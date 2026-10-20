"""QTZ-010/011: repo registry policy, hardened read-only git, status/diff, caps, not-mutated, HTTP auth.

Every test uses real git in temp dirs. The hostile-config tests first prove
that the hostile setting is live (plain git, run the way a user would, writes
the marker), then that no Quartizo endpoint lets it run.
"""
from __future__ import annotations

import hashlib
import os
import shutil
import stat
import subprocess
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

from tests.backend.signing import load_server
from tests.backend.test_http import SECRET, _request, _start
from tests.backend.test_workspace import signed_json

srv = load_server()
import gitrepo  # noqa: E402
import workspace  # noqa: E402
from workspace import ApiError, Registry  # noqa: E402

GIT = shutil.which("git")


def git_version() -> tuple[int, int]:
    out = subprocess.run([GIT, "--version"], capture_output=True, text=True).stdout
    major, minor = out.split()[2].split(".")[:2]
    return int(major), int(minor)


class GitTree(unittest.TestCase):
    """A temp tree with a protected KiroCrew home and a RepoStore over it."""

    def setUp(self):
        if GIT is None:
            self.skipTest("git is not installed")
        self.tmp = Path(tempfile.mkdtemp(prefix="quartizo-git-")).resolve()
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.crew = self.tmp / "crew"
        self.registry = Registry(self.crew / "apps" / "quartizo" / "data", protected=(str(self.crew),))
        self.runner = gitrepo.GitRunner(home=str(self.registry.data_dir / "git-home"))
        self.store = gitrepo.RepoStore(self.registry, self.runner)
        # Setup git (never the code under test): no user or system config.
        self.setup_home = self.tmp / "setup-home"
        self.setup_home.mkdir()
        self.markers = self.tmp / "markers"
        self.markers.mkdir()

    # -- helpers -------------------------------------------------------------

    def git(self, cwd, *args, check=True, env=None):
        full_env = {"PATH": os.environ.get("PATH", "/usr/bin:/bin"), "HOME": str(self.setup_home),
                    "GIT_CONFIG_NOSYSTEM": "1", "GIT_CONFIG_GLOBAL": os.devnull, "LC_ALL": "C",
                    "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@example.invalid",
                    "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@example.invalid",
                    **(env or {})}
        res = subprocess.run([GIT, *args], cwd=cwd, env=full_env, capture_output=True,
                             stdin=subprocess.DEVNULL, timeout=30)
        if check and res.returncode != 0:
            raise AssertionError(f"git {args} failed: {res.stderr.decode()}")
        return res

    def make_repo(self, name="repo", files=None, branch="main") -> Path:
        root = self.tmp / name
        root.mkdir(parents=True)
        root.chmod(0o755)
        self.git(root, "init", "-q", "-b", branch)
        for rel, content in (files if files is not None else {"a.txt": "one\n"}).items():
            p = root / rel
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(content if isinstance(content, bytes) else content.encode())
        if files != {}:
            self.git(root, "add", "-A")
            self.git(root, "commit", "-q", "-m", "init")
        return root

    def register(self, root, name=None):
        return self.store.register(str(root), name)

    def refused(self, fn, *args, status=None, code=None):
        with self.assertRaises(ApiError) as ctx:
            fn(*args)
        if status is not None:
            self.assertEqual(ctx.exception.status, status, ctx.exception.message)
        if code is not None:
            self.assertEqual(ctx.exception.code, code, ctx.exception.message)
        return ctx.exception

    def hook(self, name: str, *, passthrough: bool = True) -> Path:
        """An executable that writes markers/<name> when run (and copies stdin, for filters)."""
        script = self.tmp / "hooks" / name
        script.parent.mkdir(exist_ok=True)
        script.write_text(f"#!/bin/sh\ntouch '{self.markers}/{name}'\n" + ("cat\n" if passthrough else "exit 1\n"))
        script.chmod(0o755)
        return script

    def marked(self) -> list[str]:
        return sorted(os.listdir(self.markers))

    def clear_markers(self):
        for m in self.marked():
            os.unlink(self.markers / m)

    def make_stat_dirty(self, path: Path):
        """Same size, new mtime: git must compare content (and would run a clean filter)."""
        t = time.time() - 3600
        os.utime(path, (t, t))

    def all_endpoints(self, repo, paths=("a.txt",)):
        """Call every read endpoint; refusals are fine, side effects are not."""
        results = []
        for fn, args in [(self.store.info, ()), (self.store.status, ())] + [
                (self.store.diff, (p, m)) for p in paths for m in gitrepo.DIFF_MODES]:
            try:
                results.append(fn(repo.id, *args))
            except ApiError as err:
                results.append(err)
        return results


def snapshot(root: Path) -> dict:
    """Every entry under *root* (.git included): type, mode, size, mtime, content hash."""
    out = {}
    for dirpath, dirnames, filenames in os.walk(root):
        for name in dirnames + filenames:
            p = os.path.join(dirpath, name)
            st = os.lstat(p)
            entry = (stat.S_IFMT(st.st_mode), st.st_mode & 0o7777, st.st_size, st.st_mtime_ns, st.st_ino)
            if stat.S_ISREG(st.st_mode):
                with open(p, "rb") as f:
                    entry += (hashlib.sha256(f.read()).hexdigest(),)
            elif stat.S_ISLNK(st.st_mode):
                entry += (os.readlink(p),)
            out[os.path.relpath(p, root)] = entry
    st = os.lstat(root)
    out["."] = (st.st_mode, st.st_mtime_ns)
    return out


# --------------------------------------------------------------------------
# Registry policy
# --------------------------------------------------------------------------

class RegistryPolicyTests(GitTree):
    def test_register_list_get_unregister(self):
        root = self.make_repo()
        repo = self.register(root, "My repo")
        self.assertRegex(repo.uid, r"^[0-9a-f]{32}$")
        self.assertEqual((repo.name, repo.path), ("My repo", str(root)))
        self.assertEqual(self.store.list(), [repo])
        self.assertEqual(self.store.get(repo.id), repo)
        self.store.unregister(repo.id)
        self.refused(self.store.get, repo.id, status=404, code="repo_not_found")
        self.refused(self.store.unregister, repo.id, status=404, code="repo_not_found")
        again = self.register(root)
        self.assertGreater(again.id, repo.id)  # ids are never reused
        self.assertNotEqual(again.uid, repo.uid)
        self.assertEqual(again.name, "repo")
        self.assertTrue((root / "a.txt").exists())  # unregister touches nothing

    def test_same_root_policy_as_workspaces(self):
        plain_file = self.tmp / "f.txt"
        plain_file.write_text("x")
        for raw, code in (("", "bad_root"), ("relative/repo", "bad_root"), (str(self.tmp / "missing"), "bad_root"),
                          (str(plain_file), "bad_root"), ("/", "root_refused"), ("//", "root_refused"),
                          ("/proc/self", "root_refused"), ("/dev", "root_refused"), ("/sys", "root_refused"),
                          (str(self.tmp) + "\x00", "bad_root"), (None, "bad_root"), (5, "bad_root")):
            with self.subTest(raw=raw):
                self.refused(self.register, raw, status=400, code=code)

    def test_home_dir_itself_is_refused(self):
        home = self.make_repo("home")
        with mock.patch.dict(os.environ, {"HOME": str(home)}):
            self.refused(self.register, home, status=400, code="root_refused")

    def test_kirocrew_home_and_data_dir_overlap_refused(self):
        inside = self.crew / "apps" / "proj"
        inside.mkdir(parents=True)
        inside.chmod(0o755)
        self.git(inside, "init", "-q")
        self.refused(self.register, inside, status=400, code="root_refused")
        # A repo that contains the KiroCrew home (and so the data dir).
        self.git(self.tmp, "init", "-q")
        self.tmp.chmod(0o755)
        self.refused(self.register, self.tmp, status=400, code="root_refused")

    def test_not_owned_and_writable_by_others_refused(self):
        root = self.make_repo()
        root.chmod(0o775)
        self.refused(self.register, root, status=400, code="root_writable_by_others")
        root.chmod(0o755)
        with mock.patch.object(workspace.os, "getuid", return_value=os.getuid() + 1):
            self.refused(self.register, root, status=400, code="root_not_owned")

    def test_must_be_the_work_tree_top_level(self):
        plain = self.tmp / "plain"
        plain.mkdir()
        self.refused(self.register, plain, status=400, code="not_a_repo")
        root = self.make_repo(files={"sub/x.txt": "x\n"})
        self.refused(self.register, root / "sub", status=400, code="not_repo_toplevel")
        self.refused(self.register, root / ".git", status=400, code="not_repo_toplevel")
        bare = self.tmp / "bare.git"
        self.git(self.tmp, "init", "-q", "--bare", str(bare))
        self.refused(self.register, bare, status=400, code="not_a_repo")

    def test_git_symlink_refused(self):
        real = self.make_repo("real")
        alias = self.tmp / "alias"
        alias.mkdir()
        (alias / ".git").symlink_to(real / ".git")
        self.refused(self.register, alias, status=409, code="git_link_refused")

    def test_duplicates_refused_but_nesting_and_notes_overlap_allowed(self):
        root = self.make_repo()
        repo = self.register(root)
        err = self.refused(self.register, root, status=409, code="repo_exists")
        self.assertEqual(err.extra["repoId"], repo.id)
        link = self.tmp / "link"
        link.symlink_to(root)
        self.refused(self.register, link, status=409, code="repo_exists")  # realpath alias
        # A nested, independent repo is its own registration.
        nested = root / "nested"
        nested.mkdir()
        self.git(nested, "init", "-q")
        self.assertEqual(self.register(nested).path, str(nested))
        # A notes workspace inside the repo, and the repo as a workspace too: allowed.
        (root / "notes").mkdir()
        self.registry.register(str(root / "notes"))
        other = self.make_repo("other")
        self.registry.register(str(other))
        self.register(other)

    def test_names(self):
        root = self.make_repo()
        for bad in ("x" * 81, "a\nb", 5, ["x"]):
            with self.subTest(bad=bad):
                self.refused(self.register, root, bad, status=400, code="bad_name")
        self.assertEqual(self.register(root, "  ").name, "repo")

    def test_root_swapped_for_symlink_after_registration(self):
        root = self.make_repo()
        repo = self.register(root)
        moved = self.tmp / "moved"
        root.rename(moved)
        root.symlink_to(moved)
        self.refused(self.store.status, repo.id, status=409, code="root_changed")
        root.unlink()
        self.refused(self.store.status, repo.id, status=404, code="root_missing")
        moved.rename(root)
        shutil.rmtree(root / ".git")
        self.refused(self.store.status, repo.id, status=409, code="not_a_repo")


class MigrationTests(unittest.TestCase):
    def test_m3_database_gains_repos_and_keeps_tasks(self):
        import sqlite3

        import db
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / db.DB_FILENAME
            conn = sqlite3.connect(path, isolation_level=None)
            conn.execute("CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL)")
            for version, sql in enumerate(db.MIGRATIONS[:3], start=1):
                for statement in filter(str.strip, sql.split(";")):
                    conn.execute(statement)
                conn.execute("INSERT INTO schema_migrations VALUES (?, 0)", (version,))
            conn.execute("INSERT INTO workspaces (uid, name, path, created_at) VALUES (?, 'w', '/x/w', 0)", ("a" * 32,))
            conn.execute("INSERT INTO tasks (uid, project_id, title, status, sort_order, created_at, updated_at) "
                         "VALUES (?, ?, 't', 'backlog', 0, 0, 0)", ("b" * 32, "a" * 32))
            conn.close()
            conn = db.connect(path)
            try:
                self.assertEqual([r[0] for r in conn.execute("SELECT version FROM schema_migrations")], [1, 2, 3, 4])
                self.assertEqual(conn.execute("SELECT COUNT(*) FROM tasks").fetchone()[0], 1)
                cols = {r[1] for r in conn.execute("PRAGMA table_info(repos)")}
                self.assertEqual(cols, {"id", "uid", "name", "path", "created_at"})
            finally:
                conn.close()


# --------------------------------------------------------------------------
# Hostile repository config
# --------------------------------------------------------------------------

class HostileConfigTests(GitTree):
    def hostile_repo(self, name="evil"):
        root = self.make_repo(name, files={"a.txt": "one\n", "b.bin": b"\x00\x01data\n", "c.txt": "keep\n"})
        repo = self.register(root)
        (root / "a.txt").write_text("two\n")  # unstaged change
        (root / "c.txt").write_text("KEEP\n")
        self.git(root, "add", "c.txt")  # staged change
        (root / "b.bin").write_bytes(b"\x00\x01DATA\n")
        return root, repo

    def assert_no_marker_from_any_endpoint(self, root, repo, paths=("a.txt", "b.bin", "c.txt")):
        self.clear_markers()
        for p in paths:
            if (root / p).exists():
                self.make_stat_dirty(root / p)
        before = snapshot(root)
        results = self.all_endpoints(repo, paths)
        self.assertEqual(self.marked(), [], "a hostile command ran")
        self.assertEqual(snapshot(root), before)
        return results

    def test_fsmonitor_hook(self):
        root, repo = self.hostile_repo()
        self.git(root, "config", "core.fsmonitor", str(self.hook("fsmonitor")))
        self.git(root, "status")
        self.assertEqual(self.marked(), ["fsmonitor"])  # control: the hook is live
        results = self.assert_no_marker_from_any_endpoint(root, repo)
        self.assertIsInstance(results[1], dict)  # status still works

    def test_hooks_path(self):
        root, repo = self.hostile_repo()
        hooks = self.tmp / "hooks"
        for name in ("post-index-change", "post-checkout", "pre-commit", "reference-transaction",
                     "post-rewrite", "fsmonitor-watchman"):
            self.hook(name)
        self.git(root, "config", "core.hooksPath", str(hooks))
        self.make_stat_dirty(root / "a.txt")
        self.git(root, "status")  # plain status refreshes and writes the index
        self.assertIn("post-index-change", self.marked())  # control
        self.assert_no_marker_from_any_endpoint(root, repo)

    def test_textconv_and_external_diff(self):
        root, repo = self.hostile_repo()
        (root / ".gitattributes").write_text("*.txt diff=evil\n*.bin diff=evil\n")
        self.git(root, "config", "diff.evil.textconv", str(self.hook("textconv")))
        self.git(root, "config", "diff.evil.command", str(self.hook("diffcmd")))
        self.git(root, "config", "diff.external", str(self.hook("external")))
        self.git(root, "diff")
        self.assertTrue(self.marked())  # control: plain `git diff` runs them
        results = self.assert_no_marker_from_any_endpoint(root, repo)
        diffs = [r for r in results if isinstance(r, dict) and "diff" in r]
        self.assertTrue(any("+two" in d["diff"] for d in diffs))
        self.assertTrue(any(d["binary"] for d in diffs if d["path"] == "b.bin"))

    def _filter_repo(self, *, via_info_attributes=False):
        root, repo = self.hostile_repo()
        attrs = "*.txt filter=evil\n*.bin filter=other\n"
        if via_info_attributes:
            (root / ".git" / "info").mkdir(exist_ok=True)
            (root / ".git" / "info" / "attributes").write_text(attrs)
        else:
            (root / ".gitattributes").write_text(attrs)
        self.git(root, "config", "filter.evil.clean", str(self.hook("clean")))
        self.git(root, "config", "filter.evil.smudge", str(self.hook("smudge")))
        self.git(root, "config", "filter.evil.required", "true")
        self.git(root, "config", "filter.other.process", str(self.hook("process")))
        self.make_stat_dirty(root / "c.txt")
        # Control: plain status (index refresh) and diff-files run the clean filter.
        self.git(root, "--no-optional-locks", "status", env={"GIT_OPTIONAL_LOCKS": "0"}, check=False)
        self.assertIn("clean", self.marked())
        return root, repo

    def test_filter_drivers(self):
        for via_info in (False, True):
            with self.subTest(info_attributes=via_info):
                root, repo = self._filter_repo(via_info_attributes=via_info)
                results = self.assert_no_marker_from_any_endpoint(root, repo)
                self.assertIsInstance(results[1], dict, results[1])  # blanked, so status works
                self.store.unregister(repo.id)
                shutil.rmtree(root)

    def test_filters_blocked_by_each_layer_alone(self):
        root, repo = self._filter_repo()
        # Layer 3 off (as if a driver were added between enumeration and the
        # call): the no-spawn limit alone stops it.
        with mock.patch.object(gitrepo.RepoStore, "filter_overrides", return_value={"GIT_CONFIG_COUNT": "0"}):
            self.assert_no_marker_from_any_endpoint(root, repo)
        # Layer 4 off: blanking the drivers alone stops it.
        self.runner.no_spawn = False
        self.assert_no_marker_from_any_endpoint(root, repo)

    def test_fsmonitor_and_hooks_blocked_by_flags_alone(self):
        root, repo = self.hostile_repo()
        self.git(root, "config", "core.fsmonitor", str(self.hook("fsmonitor")))
        self.git(root, "config", "core.hooksPath", str(self.tmp / "hooks"))
        self.hook("post-index-change")
        self.runner.no_spawn = False
        self.assert_no_marker_from_any_endpoint(root, repo)

    def test_pager(self):
        root, repo = self.hostile_repo()
        pager = str(self.hook("pager"))
        for key in ("core.pager", "pager.status", "pager.diff", "pager.diff-files", "pager.diff-index",
                    "pager.ls-files", "pager.config", "pager.rev-parse"):
            self.git(root, "config", key, pager)
        if shutil.which("script"):  # control needs a tty
            subprocess.run(["script", "-qc", f"{GIT} -C '{root}' log -1", os.devnull],
                           capture_output=True, timeout=30, env={**os.environ, "HOME": str(self.setup_home)})
            self.assertEqual(self.marked(), ["pager"])
        self.assert_no_marker_from_any_endpoint(root, repo)

    def test_ssh_command_and_lazy_fetch(self):
        root = self.make_repo("partial", files={"f.txt": "one\n"})
        blob = self.git(root, "rev-parse", "HEAD:f.txt").stdout.decode().strip()
        (root / "f.txt").write_text("two\n")
        self.git(root, "add", "f.txt")
        (root / ".git" / "objects" / blob[:2] / blob[2:]).unlink()  # a "promised" object
        for key, value in (("core.repositoryformatversion", "1"), ("extensions.partialClone", "origin"),
                           ("remote.origin.url", "ssh://example.invalid/x"), ("remote.origin.promisor", "true"),
                           ("protocol.ssh.allow", "always"), ("protocol.allow", "always"),
                           ("core.sshCommand", str(self.hook("ssh", passthrough=False))),
                           ("credential.helper", str(self.hook("credential", passthrough=False))),
                           ("core.askPass", str(self.hook("askpass", passthrough=False)))):
            self.git(root, "config", key, value)
        self.git(root, "diff-index", "--cached", "-p", "HEAD", check=False)
        self.assertIn("ssh", self.marked())  # control: lazy fetch runs core.sshCommand
        repo = self.register(root)
        results = self.assert_no_marker_from_any_endpoint(root, repo, paths=("f.txt",))
        staged = [r for r in results if isinstance(r, ApiError)]
        self.assertTrue(any(e.code == "git_failed" for e in staged))  # the missing blob is an error, not a fetch

    def test_hostile_worktree_config_cannot_point_elsewhere(self):
        root, repo = self.hostile_repo()
        elsewhere = self.tmp / "elsewhere"
        elsewhere.mkdir()
        (elsewhere / "secret.txt").write_text("secret\n")
        self.git(root, "config", "core.worktree", str(elsewhere))
        self.git(root, "config", "core.bare", "true")
        st = self.store.status(repo.id)
        self.assertNotIn("secret.txt", [e["path"] for e in st["entries"]])
        self.assertIn("a.txt", [e["path"] for e in st["entries"]])

    def test_too_many_filter_drivers(self):
        root, repo = self.hostile_repo()
        with open(root / ".git" / "config", "a") as f:
            for i in range(gitrepo.MAX_FILTER_DRIVERS + 1):
                f.write(f'[filter "d{i}"]\n\tclean = x\n')
        self.refused(self.store.status, repo.id, status=409, code="too_many_filters")

    def test_hostile_submodule_config_is_not_descended(self):
        sub = self.make_repo("subsrc", files={"s.txt": "s\n"})
        sup = self.make_repo("super", files={"top.txt": "t\n"})
        self.git(sup, "-c", "protocol.file.allow=always", "submodule", "-q", "add", str(sub), "sm")
        self.git(sup, "commit", "-q", "-m", "add sm")
        modules_cfg = sup / ".git" / "modules" / "sm"
        self.git(sup / "sm", "config", "core.fsmonitor", str(self.hook("sub-fsmonitor")))
        (sup / "sm" / "s.txt").write_text("dirty\n")
        self.git(sup / "sm", "status")
        self.assertEqual(self.marked(), ["sub-fsmonitor"])  # control
        self.assertTrue(modules_cfg.is_dir())
        repo = self.register(sup)
        self.clear_markers()
        before = snapshot(sup)
        st = self.store.status(repo.id)
        self.store.diff(repo.id, "sm", "worktree")
        self.assertEqual(self.marked(), [])
        self.assertEqual(snapshot(sup), before)
        self.assertEqual(st["entries"], [])  # dirty content inside the submodule is not looked at


# --------------------------------------------------------------------------
# Argument injection through the pathspec / mode
# --------------------------------------------------------------------------

class InjectionTests(GitTree):
    def setUp(self):
        super().setUp()
        self.root = self.make_repo(files={"a.txt": "one\n", "b.txt": "two\n", "-c": "dash\n",
                                          "--output=x": "out\n", "*": "star\n", ":(glob)x": "magic\n",
                                          ".gitignore": "ignored.txt\n", ".github/w.yml": "on: push\n"})
        self.repo = self.register(self.root)
        for name in ("a.txt", "b.txt", "-c", "--output=x", "*", ":(glob)x", ".gitignore", ".github/w.yml"):
            (self.root / name).write_text((self.root / name).read_text() + "changed\n")

    def test_bad_paths_are_400(self):
        for bad in ("", "/etc/passwd", "../x", "a/../b", "./a.txt", "a//b", "a\\b", "a\x00b", "a\nb",
                    ".git/config", ".GIT/config", "x/.git/HEAD", ".Git", None, 5, "x" * 1100):
            with self.subTest(bad=bad):
                self.refused(self.store.diff, self.repo.id, bad, "worktree", status=400, code="bad_path")

    def test_bad_modes_are_400(self):
        for bad in ("--cached", "worktree --output=/tmp/x", "", None, "WORKTREE", ["staged"]):
            with self.subTest(bad=bad):
                self.refused(self.store.diff, self.repo.id, "a.txt", bad, status=400, code="bad_mode")
        self.refused(self.store.diff, self.repo.id, "a.txt", "worktree", "b.txt", status=400, code="bad_orig")
        self.refused(self.store.diff, self.repo.id, "a.txt", "staged", "../x", status=400, code="bad_path")

    def test_option_like_paths_are_only_paths(self):
        pwned = self.tmp / "pwned"
        before = snapshot(self.root)
        for path in ("--output=x", "-c", f"--output={pwned}", "-cfoo=bar", "--exec=touch", "-p",
                     "--no-index", "-O/etc/passwd"):
            for mode in gitrepo.DIFF_MODES:
                with self.subTest(path=path, mode=mode):
                    try:
                        res = self.store.diff(self.repo.id, path, mode)
                    except ApiError as err:
                        self.assertEqual((err.status, err.code), (404, "not_changed"))
                        continue
                    if mode == "worktree" and path in ("--output=x", "-c"):
                        self.assertIn(f"+++ b/{path}", res["diff"])
                        self.assertIn("+changed", res["diff"])
                    self.assertNotIn("a.txt", res["diff"])
        self.assertFalse(pwned.exists())
        self.assertEqual(snapshot(self.root), before)

    def test_glob_and_magic_are_literal(self):
        res = self.store.diff(self.repo.id, "*", "worktree")
        self.assertIn("+++ b/*", res["diff"])
        self.assertNotIn("a.txt", res["diff"])
        res = self.store.diff(self.repo.id, ":(glob)x", "worktree")
        self.assertIn("magic", res["diff"])
        self.assertNotIn("a.txt", res["diff"])
        self.refused(self.store.diff, self.repo.id, "*.txt", "worktree", status=404, code="not_changed")

    def test_dot_files_are_diffable(self):
        for path in (".gitignore", ".github/w.yml"):
            with self.subTest(path=path):
                self.assertIn("+changed", self.store.diff(self.repo.id, path, "worktree")["diff"])

    def test_directory_pathspec_does_not_widen(self):
        # `.github` is a directory: the exact-path index lookup finds nothing, so no diff of its files.
        self.refused(self.store.diff, self.repo.id, ".github", "worktree", status=404, code="not_changed")

    def test_argv_shape(self):
        argv = self.runner.argv(str(self.root), ["status"], work_tree=True)
        i = argv.index(GIT)
        self.assertEqual(argv[:i], [os.sys.executable, "-I", "-S", "-c", gitrepo._NO_SPAWN])
        cmd = argv[i + 1:]
        for flag in ("core.fsmonitor=false", "core.hooksPath=/dev/null", "diff.external=", "core.pager=cat",
                     "protocol.allow=never"):
            self.assertEqual(cmd[cmd.index(flag) - 1], "-c")
        self.assertIn("--no-pager", cmd)
        self.assertIn("--no-optional-locks", cmd)
        self.assertIn(f"--work-tree={self.root}", cmd)
        env = self.runner._env(str(self.root), {})
        for key in ("GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_CONFIG_PARAMETERS", "SSH_AUTH_SOCK"):
            self.assertNotIn(key, env)
        self.assertEqual((env["GIT_CONFIG_NOSYSTEM"], env["GIT_TERMINAL_PROMPT"], env["GIT_OPTIONAL_LOCKS"],
                          env["LC_ALL"]), ("1", "0", "0", "C"))
        self.assertEqual(env["HOME"], str(self.registry.data_dir / "git-home"))
        self.assertEqual(os.listdir(env["HOME"]), [])

    def test_inherited_git_env_is_ignored(self):
        other = self.make_repo("other", files={"other.txt": "o\n"})
        with mock.patch.dict(os.environ, {"GIT_DIR": str(other / ".git"), "GIT_WORK_TREE": str(other),
                                          "GIT_INDEX_FILE": str(other / ".git" / "index")}):
            paths = [e["path"] for e in self.store.status(self.repo.id)["entries"]]
        self.assertIn("a.txt", paths)
        self.assertNotIn("other.txt", paths)


# --------------------------------------------------------------------------
# Timeouts, output and size caps
# --------------------------------------------------------------------------

class CapsTests(GitTree):
    def fake_git(self, body: str) -> str:
        script = self.tmp / "fakegit"
        script.write_text("#!/bin/sh\n"
                          'case " $* " in *" --version "*) echo "git version 2.53.0"; exit 0;; esac\n'
                          f"echo $$ > '{self.tmp}/fake.pid'\n{body}\n")
        script.chmod(0o755)
        return str(script)

    def test_timeout_kills_git(self):
        root = self.make_repo()
        runner = gitrepo.GitRunner(home=self.runner.home, git=self.fake_git("exec sleep 30"), timeout=0.5)
        started = time.monotonic()
        with self.assertRaises(ApiError) as ctx:
            runner.run(str(root), ["status"])
        self.assertEqual((ctx.exception.status, ctx.exception.code), (504, "git_timeout"))
        self.assertLess(time.monotonic() - started, 5)
        pid = int((self.tmp / "fake.pid").read_text())
        with self.assertRaises(ProcessLookupError):
            os.kill(pid, 0)

    def test_output_cap_kills_git(self):
        root = self.make_repo()
        runner = gitrepo.GitRunner(home=self.runner.home, git=self.fake_git("exec yes"), timeout=5)
        res = runner.run(str(root), ["status"], limit=10000)
        self.assertTrue(res.truncated)
        self.assertEqual(len(res.stdout), 10000)
        pid = int((self.tmp / "fake.pid").read_text())
        with self.assertRaises(ProcessLookupError):
            os.kill(pid, 0)

    def test_status_too_large(self):
        root = self.make_repo()
        repo = self.register(root)
        with mock.patch.object(gitrepo, "MAX_STATUS_BYTES", 10):
            (root / "untracked-with-a-long-name.txt").write_text("x")
            self.refused(self.store.status, repo.id, status=413, code="status_too_large")

    def test_status_entry_cap(self):
        data = b"".join(b"? f%d\0" % i for i in range(30))
        parsed = gitrepo.parse_status(data, max_entries=10)
        self.assertEqual((len(parsed["entries"]), parsed["truncated"]), (10, True))

    def test_diff_is_bounded_at_a_line(self):
        root = self.make_repo(files={"big.txt": "".join(f"old line {i}\n" for i in range(60000))})
        repo = self.register(root)
        (root / "big.txt").write_text("".join(f"new line {i}\n" for i in range(60000)))
        res = self.store.diff(repo.id, "big.txt", "worktree")
        self.assertTrue(res["truncated"])
        self.assertLessEqual(len(res["diff"].encode()), gitrepo.MAX_DIFF_BYTES)
        self.assertTrue(res["diff"].endswith("\n"))
        self.assertGreater(len(res["diff"].encode()), gitrepo.MAX_DIFF_BYTES - 200)

    def test_files_over_the_cap_are_refused(self):
        root = self.make_repo(files={"small.txt": "x\n"})
        repo = self.register(root)
        big = root / "big.dat"
        with open(big, "wb") as f:
            f.truncate(gitrepo.MAX_DIFF_FILE_BYTES + 1)
        self.refused(self.store.diff, repo.id, "big.dat", "worktree", status=413, code="file_too_large")  # untracked
        self.git(root, "add", "big.dat")
        for mode in gitrepo.DIFF_MODES:
            with self.subTest(mode=mode):
                self.refused(self.store.diff, repo.id, "big.dat", mode, status=413, code="file_too_large")
        # A small working copy of a big indexed file is still refused (the index side is big).
        big.write_text("now small\n")
        self.refused(self.store.diff, repo.id, "big.dat", "worktree", status=413, code="file_too_large")

    def test_binary_and_untracked(self):
        root = self.make_repo(files={"bin.dat": b"\x00\x01\x02", ".gitignore": "*.log\n"})
        repo = self.register(root)
        (root / "bin.dat").write_bytes(b"\x00\x01\x03")
        self.assertTrue(self.store.diff(repo.id, "bin.dat", "worktree")["binary"])
        (root / "new.txt").write_text("hello\nworld")
        res = self.store.diff(repo.id, "new.txt", "worktree")
        self.assertTrue(res["untracked"])
        self.assertEqual(res["diff"], "diff --git a/new.txt b/new.txt\nnew file mode 100644\n--- /dev/null\n"
                                      "+++ b/new.txt\n@@ -0,0 +1,2 @@\n+hello\n+world\n\\ No newline at end of file\n")
        (root / "new.bin").write_bytes(b"a\x00b")
        self.assertTrue(self.store.diff(repo.id, "new.bin", "worktree")["binary"])
        (root / "debug.log").write_text("secret\n")
        self.refused(self.store.diff, repo.id, "debug.log", "worktree", status=404, code="not_changed")
        self.assertNotIn("debug.log", [e["path"] for e in self.store.status(repo.id)["entries"]])
        (root / "link").symlink_to("/etc/passwd")
        res = self.store.diff(repo.id, "link", "worktree")
        self.assertIn("new file mode 120000", res["diff"])
        self.assertIn("+/etc/passwd", res["diff"])
        self.assertNotIn("root:", res["diff"])  # the link target is shown, never followed

    def test_git_missing_or_too_old(self):
        root = self.make_repo()
        runner = gitrepo.GitRunner(home=self.runner.home, git=str(self.tmp / "no-such-git"))
        with self.assertRaises(ApiError) as ctx:
            runner.run(str(root), ["status"])
        self.assertEqual(ctx.exception.code, "git_unavailable")
        old = self.tmp / "oldgit"
        old.write_text('#!/bin/sh\necho "git version 2.20.1"\n')
        old.chmod(0o755)
        with self.assertRaises(ApiError) as ctx:
            gitrepo.GitRunner(home=self.runner.home, git=str(old)).run(str(root), ["status"])
        self.assertEqual((ctx.exception.status, ctx.exception.code), (503, "git_too_old"))

    def test_installed_git_is_supported(self):
        self.assertGreaterEqual(git_version(), gitrepo.MIN_GIT_VERSION)


# --------------------------------------------------------------------------
# Repository layouts and status semantics
# --------------------------------------------------------------------------

class LayoutTests(GitTree):
    def test_status_entries(self):
        root = self.make_repo(files={"a.txt": "a\n", "b.txt": "b\n", "c.txt": "c\n", "d.txt": "d\n",
                                     ".gitignore": "*.log\n"})
        repo = self.register(root)
        (root / "a.txt").write_text("a2\n")
        self.git(root, "mv", "b.txt", "b2.txt")
        (root / "c.txt").unlink()
        (root / "d.txt").write_text("d2\n")
        self.git(root, "add", "d.txt")
        (root / "d.txt").write_text("d3\n")
        (root / "new.txt").write_text("n\n")
        (root / "newdir").mkdir()
        (root / "newdir" / "x.txt").write_text("x\n")
        (root / "x.log").write_text("ignored\n")
        st = self.store.status(repo.id)
        by = {e["path"]: e for e in st["entries"]}
        self.assertEqual(sorted(by), ["a.txt", "b2.txt", "c.txt", "d.txt", "new.txt", "newdir/"])
        self.assertEqual((by["a.txt"]["index"], by["a.txt"]["worktree"], by["a.txt"]["staged"],
                          by["a.txt"]["unstaged"]), (".", "M", False, True))
        self.assertEqual((by["b2.txt"]["kind"], by["b2.txt"]["origPath"], by["b2.txt"]["index"],
                          by["b2.txt"]["score"]), ("renamed", "b.txt", "R", 100))
        self.assertEqual(by["c.txt"]["worktree"], "D")
        self.assertEqual((by["d.txt"]["staged"], by["d.txt"]["unstaged"]), (True, True))
        self.assertEqual((by["new.txt"]["kind"], by["newdir/"]["diffable"]), ("untracked", False))
        self.assertEqual(st["counts"], {"staged": 2, "unstaged": 3, "untracked": 2, "conflicted": 0})
        self.assertEqual(st["head"]["branch"], "main")
        self.assertFalse(st["clean"])
        rename = self.store.diff(repo.id, "b2.txt", "staged", "b.txt")["diff"]
        self.assertIn("rename from b.txt", rename)
        self.assertIn("rename to b2.txt", rename)
        self.assertIn("+d2", self.store.diff(repo.id, "d.txt", "staged")["diff"])
        self.assertIn("+d3", self.store.diff(repo.id, "d.txt", "worktree")["diff"])
        self.assertIn("-c", self.store.diff(repo.id, "c.txt", "worktree")["diff"])

    def test_clean_unborn_detached_and_upstream(self):
        root = self.make_repo(files={})
        repo = self.register(root)
        info = self.store.info(repo.id)
        self.assertEqual((info["head"]["unborn"], info["head"]["branch"], info["head"]["oid"], info["clean"]),
                         (True, "main", None, True))
        (root / "first.txt").write_text("1\n")
        self.git(root, "add", "first.txt")
        self.assertIn("+1", self.store.diff(repo.id, "first.txt", "staged")["diff"])  # vs the empty tree
        self.git(root, "commit", "-q", "-m", "c1")
        c1 = self.git(root, "rev-parse", "HEAD").stdout.decode().strip()
        (root / "first.txt").write_text("2\n")
        self.git(root, "commit", "-qam", "c2")
        self.git(root, "update-ref", "refs/remotes/origin/main", c1)
        self.git(root, "config", "remote.origin.url", "https://example.invalid/x")
        self.git(root, "config", "remote.origin.fetch", "+refs/heads/*:refs/remotes/origin/*")
        self.git(root, "config", "branch.main.remote", "origin")
        self.git(root, "config", "branch.main.merge", "refs/heads/main")
        info = self.store.info(repo.id)
        self.assertEqual((info["head"]["upstream"], info["head"]["ahead"], info["head"]["behind"], info["clean"]),
                         ("origin/main", 1, 0, True))
        self.git(root, "checkout", "-q", "--detach", c1)
        head = self.store.info(repo.id)["head"]
        self.assertEqual((head["detached"], head["branch"], head["oid"]), (True, None, c1))

    def test_linked_worktree(self):
        main = self.make_repo("main-repo")
        wt = self.tmp / "wt"
        self.git(main, "worktree", "add", "-q", "-b", "feature", str(wt))
        wt.chmod(0o755)
        repo = self.register(wt)
        (wt / "a.txt").write_text("feature edit\n")
        info = self.store.info(repo.id)
        self.assertEqual((info["gitDir"], info["head"]["branch"]), ("linked-worktree", "feature"))
        self.assertIn("+feature edit", self.store.diff(repo.id, "a.txt", "worktree")["diff"])
        self.assertEqual(self.store.info(self.register(main).id)["gitDir"], "directory")

    def test_submodule_shown_not_descended(self):
        sub = self.make_repo("subsrc", files={"s.txt": "s\n"})
        sup = self.make_repo("super", files={"top.txt": "t\n"})
        self.git(sup, "-c", "protocol.file.allow=always", "submodule", "-q", "add", str(sub), "sm")
        self.git(sup, "commit", "-q", "-m", "add sm")
        repo = self.register(sup)
        (sup / "sm" / "s.txt").write_text("dirty\n")
        (sup / "sm" / "untracked.txt").write_text("u\n")
        self.assertEqual(self.store.status(repo.id)["entries"], [])  # dirt inside is not looked at
        self.git(sup / "sm", "commit", "-qam", "moved")
        st = self.store.status(repo.id)
        self.assertEqual([(e["path"], e["submodule"], e["submoduleCommitChanged"]) for e in st["entries"]],
                         [("sm", True, True)])
        self.assertIn("Subproject commit", self.store.diff(repo.id, "sm", "worktree")["diff"])
        # The submodule can be registered as its own repo.
        sm_repo = self.register(sup / "sm")
        self.assertEqual(self.store.info(sm_repo.id)["gitDir"], "gitfile")
        self.assertEqual([e["path"] for e in self.store.status(sm_repo.id)["entries"]], ["untracked.txt"])

    def test_nested_repo_is_listed_not_descended(self):
        root = self.make_repo()
        nested = self.make_repo("repo/inner", files={"i.txt": "i\n"})
        (nested / "i.txt").write_text("changed\n")
        repo = self.register(root)
        self.assertEqual([e["path"] for e in self.store.status(repo.id)["entries"]], ["inner/"])

    def test_non_utf8_and_odd_names(self):
        root = self.make_repo()
        repo = self.register(root)
        (root / os.fsdecode(b"bad-\xff.txt")).write_text("x\n")
        (root / "sp ace & 'q'.txt").write_text("y\n")
        st = self.store.status(repo.id)
        by = {e["path"]: e for e in st["entries"]}
        self.assertFalse(by["bad-�.txt"]["diffable"])
        self.assertTrue(by["sp ace & 'q'.txt"]["diffable"])
        self.assertIn("+y", self.store.diff(repo.id, "sp ace & 'q'.txt", "worktree")["diff"])

    def test_merge_conflict(self):
        root = self.make_repo(files={"m.txt": "base\n"})
        self.git(root, "checkout", "-q", "-b", "other")
        (root / "m.txt").write_text("other\n")
        self.git(root, "commit", "-qam", "other")
        self.git(root, "checkout", "-q", "main")
        (root / "m.txt").write_text("mine\n")
        self.git(root, "commit", "-qam", "mine")
        self.git(root, "merge", "-q", "other", check=False)
        repo = self.register(root)
        st = self.store.status(repo.id)
        self.assertEqual([(e["path"], e["kind"]) for e in st["entries"]], [("m.txt", "unmerged")])
        self.assertEqual(st["counts"]["conflicted"], 1)
        self.store.diff(repo.id, "m.txt", "worktree")  # does not fail


# --------------------------------------------------------------------------
# Read-only invariant
# --------------------------------------------------------------------------

class NotMutatedTests(GitTree):
    def test_no_endpoint_changes_index_refs_or_work_tree(self):
        sub = self.make_repo("subsrc", files={"s.txt": "s\n"})
        root = self.make_repo(files={"a.txt": "a\n", "b.txt": "b\n", "c.txt": "c\n", "same.txt": "same\n"})
        self.git(root, "-c", "protocol.file.allow=always", "submodule", "-q", "add", str(sub), "sm")
        self.git(root, "commit", "-q", "-m", "sm")
        self.git(root, "config", "core.untrackedCache", "true")
        self.git(root, "update-index", "--untracked-cache")
        repo = self.register(root)
        (root / "a.txt").write_text("a2\n")
        self.git(root, "mv", "b.txt", "b2.txt")
        (root / "c.txt").write_text("c2\n")
        self.git(root, "add", "c.txt")
        (root / "new.txt").write_text("new\n")
        (root / "sm" / "s.txt").write_text("dirty\n")
        time.sleep(0.01)
        self.make_stat_dirty(root / "same.txt")  # tempts an index refresh
        before = snapshot(root)
        index_before = (root / ".git" / "index").read_bytes()
        calls = [
            (self.store.info, (repo.id,)), (self.store.status, (repo.id,)),
            (self.store.get, (repo.id,)), (self.store.list, ()),
        ]
        for path in ("a.txt", "b2.txt", "c.txt", "same.txt", "new.txt", "sm", "missing.txt"):
            for mode in gitrepo.DIFF_MODES:
                calls.append((self.store.diff, (repo.id, path, mode)))
        calls.append((self.store.diff, (repo.id, "b2.txt", "staged", "b.txt")))
        for fn, args in calls:
            with self.subTest(fn=fn.__name__, args=args):
                try:
                    fn(*args)
                except ApiError:
                    pass
                self.assertEqual((root / ".git" / "index").read_bytes(), index_before)
                self.assertEqual(snapshot(root), before)


# --------------------------------------------------------------------------
# HTTP: routes and auth
# --------------------------------------------------------------------------

class GitHttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if GIT is None:
            raise unittest.SkipTest("git is not installed")
        cls.tmp = tempfile.TemporaryDirectory(prefix="quartizo-git-http-")
        base = Path(cls.tmp.name).resolve()
        cls.root = base / "repo"
        cls.root.mkdir()
        cls.root.chmod(0o755)
        env = {"PATH": os.environ.get("PATH", ""), "HOME": str(base), "GIT_CONFIG_GLOBAL": os.devnull,
               "GIT_CONFIG_NOSYSTEM": "1", "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@x.invalid",
               "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@x.invalid"}
        for args in (["init", "-q", "-b", "main"], ["commit", "-q", "--allow-empty", "-m", "c0"]):
            subprocess.run([GIT, *args], cwd=cls.root, env=env, check=True, capture_output=True)
        (cls.root / "a.txt").write_text("hello\n")
        cls.proc, cls.port = _start(SECRET, home=str(base / "crew"))

    @classmethod
    def tearDownClass(cls):
        cls.proc.terminate()
        cls.proc.communicate(timeout=5)
        cls.tmp.cleanup()

    def call(self, method, target, payload=None, **kw):
        return signed_json(self.port, method, target, payload, **kw)

    def test_round_trip(self):
        status, body = self.call("POST", "/api/repos", {"path": str(self.root), "name": "R"})
        self.assertEqual(status, 201, body)
        rid = body["repo"]["id"]
        self.assertEqual(self.call("GET", "/api/repos")[1]["repos"][0]["name"], "R")
        self.assertEqual(self.call("GET", f"/api/repos/{rid}")[0], 200)
        status, info = self.call("GET", f"/api/repos/{rid}/info")
        self.assertEqual((status, info["head"]["branch"], info["clean"]), (200, "main", False))
        status, st = self.call("GET", f"/api/repos/{rid}/status")
        self.assertEqual([e["path"] for e in st["entries"]], ["a.txt"])
        status, diff = self.call("GET", f"/api/repos/{rid}/diff?path=a.txt&mode=worktree")
        self.assertEqual((status, diff["untracked"]), (200, True))
        self.assertIn("+hello", diff["diff"])
        status, err = self.call("GET", f"/api/repos/{rid}/diff?path=..%2Fx&mode=worktree")
        self.assertEqual((status, err["code"]), (400, "bad_path"))
        status, err = self.call("GET", f"/api/repos/{rid}/diff?path=a.txt&mode=--cached")
        self.assertEqual((status, err["code"]), (400, "bad_mode"))
        status, err = self.call("POST", "/api/repos", {"path": str(self.root)})
        self.assertEqual((status, err["code"]), (409, "repo_exists"))
        for method, target in (("GET", "/api/repos/abc"), ("PUT", "/api/repos"), ("POST", f"/api/repos/{rid}/status"),
                               ("GET", f"/api/repos/{rid}/nope"), ("GET", f"/api/repos/{rid}/diff/x"),
                               ("GET", "/api/repos/999/status")):
            with self.subTest(method=method, target=target):
                self.assertEqual(self.call(method, target, {} if method != "GET" else None)[0], 404)
        self.assertEqual(self.call("DELETE", f"/api/repos/{rid}")[0], 200)
        self.assertEqual(self.call("GET", f"/api/repos/{rid}")[0], 404)
        self.assertTrue((self.root / "a.txt").exists())

    def test_every_repo_route_needs_auth_and_owner(self):
        routes = (("GET", "/api/repos"), ("POST", "/api/repos"), ("GET", "/api/repos/1"),
                  ("DELETE", "/api/repos/1"), ("GET", "/api/repos/1/info"), ("GET", "/api/repos/1/status"),
                  ("GET", "/api/repos/1/diff?path=a.txt&mode=worktree"))
        for method, target in routes:
            with self.subTest(method=method, target=target):
                for kind in ("app-token", "agent-tool", "none"):
                    status, body = self.call(method, target, kind=kind, owner_id="")
                    self.assertEqual((status, body["code"]), (403, "owner_session_required"))
                status, body = _request(self.port, method, target)
                self.assertEqual((status, body["code"]), (401, "proxy_auth_failed"))


if __name__ == "__main__":
    unittest.main()
