"""Optional native filesystem events. The index worker owns registration and cleanup."""
from __future__ import annotations

import os
from collections.abc import Callable
from pathlib import PurePath

from workspace import ApiError, Workspace, open_root


class FolderWatcher:
    """Use watchdog's FSEvents/inotify observer, or let the index poll metadata."""

    def __init__(self) -> None:
        self.observer = None
        self.watches: dict[str, tuple[tuple[int, int], object]] = {}
        try:
            from watchdog.observers import Observer
            from watchdog.observers.polling import PollingObserver

            observer = Observer()
            if not isinstance(observer, PollingObserver):
                observer.start()
                self.observer = observer
        except (ImportError, OSError, RuntimeError, SystemError):
            pass

    def ensure(self, ws: Workspace, notify: Callable[[tuple[str, ...], bool], None]) -> tuple[bool, bool]:
        """Return (watch active, newly attached) for the current directory inode."""
        observer = self.observer
        if observer is None or not observer.is_alive():
            return False, False

        try:
            fd = open_root(ws.path)
            try:
                st = os.fstat(fd)
                identity = (st.st_dev, st.st_ino)
            finally:
                os.close(fd)
        except (ApiError, OSError):
            self.remove(ws.uid)
            return False, False

        previous = self.watches.get(ws.uid)
        if previous and previous[0] == identity:
            if any(emitter.watch == previous[1] and emitter.is_alive() for emitter in observer.emitters):
                return True, False
        self.remove(ws.uid)

        from watchdog.events import FileSystemEventHandler

        class Handler(FileSystemEventHandler):
            def on_any_event(self, event):
                paths, probe = affected_paths(ws.path, event.event_type, event.is_directory,
                                              event.src_path, event.dest_path)
                if paths or probe:
                    notify(paths, probe)

        try:
            watch = observer.schedule(Handler(), ws.path, recursive=True)
        except SystemError:
            # FSEvents is denied in some sandboxes. Use stat polling instead
            # of repeatedly trying to start a native stream in this process.
            self.close()
            return False, False
        except (OSError, RuntimeError):
            return False, False
        self.watches[ws.uid] = (identity, watch)
        return True, True

    def remove(self, uid: str) -> None:
        previous = self.watches.pop(uid, None)
        if previous and self.observer is not None:
            try:
                self.observer.unschedule(previous[1])
            except KeyError:
                pass  # the observer has already dropped this watch

    def close(self) -> None:
        if self.observer is not None:
            self.observer.stop()
            self.observer.join()
            self.observer = None
            self.watches.clear()


def affected_paths(root: str, kind: str, directory: bool, *absolute: str | bytes) -> tuple[tuple[str, ...], bool]:
    """Filter filesystem events to note paths and structural folder changes."""
    if kind not in ("created", "deleted", "modified", "moved") or (directory and kind == "modified"):
        return (), False
    relative = []
    prefix = root + os.sep
    for path in map(os.fsdecode, absolute):
        if path == root:
            return (), True
        if not path.startswith(prefix):
            continue
        rel = path[len(prefix):]
        if any(part.startswith(".") for part in PurePath(rel).parts):
            continue
        relative.append(rel)
    return ((), bool(relative)) if directory else (tuple(relative), False)
