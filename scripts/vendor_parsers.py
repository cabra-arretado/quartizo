"""Re-create backend/_vendor from exact, hash-pinned PyPI wheels.

The backend runs under the gateway's interpreter with ``python -I`` and installs
nothing, so its two parsers (and markdown-it-py's one dependency) are vendored:
copied unchanged from the published wheels, with their licenses. Run this only
to change a pin, then review the diff and commit it:

    python3 scripts/vendor_parsers.py

Every wheel is checked against the sha256 below before anything is extracted.
``backend/_vendor/MANIFEST.sha256`` records every vendored file;
tests/backend/test_vendor.py fails if the tree drifts from it.
"""
from __future__ import annotations

import hashlib
import io
import shutil
import sys
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VENDOR = ROOT / "backend" / "_vendor"

# (distribution, version, wheel URL, wheel sha256, top-level package dir, license files in the wheel)
WHEELS = (
    ("ruamel.yaml", "0.19.1",
     "https://files.pythonhosted.org/packages/b8/0c/51f6841f1d84f404f92463fc2b1ba0da357ca1e3db6b7fbda26956c3b82a/ruamel_yaml-0.19.1-py3-none-any.whl",
     "27592957fedf6e0b62f281e96effd28043345e0e66001f97683aa9a40c667c93",
     "ruamel/yaml/", ("ruamel_yaml-0.19.1.dist-info/licenses/LICENSE",)),
    ("markdown-it-py", "4.0.0",
     "https://files.pythonhosted.org/packages/94/54/e7d793b573f298e1c9013b8c4dade17d481164aa517d1d7148619c2cedbf/markdown_it_py-4.0.0-py3-none-any.whl",
     "87327c59b172c5011896038353a81343b6754500a08cd7a4973bb48c6d578147",
     "markdown_it/", ("markdown_it_py-4.0.0.dist-info/licenses/LICENSE",
                      "markdown_it_py-4.0.0.dist-info/licenses/LICENSE.markdown-it")),
    ("mdurl", "0.1.2",
     "https://files.pythonhosted.org/packages/b3/38/89ba8ad64ae25be8de66a6d463314cf1eb366222074cfda9ee839c56a4b4/mdurl-0.1.2-py3-none-any.whl",
     "84008a41e51615a49fc9966191ff91509e3c40b939176e643fd50a5c2196b8f8",
     "mdurl/", ("mdurl-0.1.2.dist-info/LICENSE",)),
)
# Not runtime code: ruamel.yaml's wheel carries the build script of its optional
# C extension (it imports setuptools), and markdown-it-py ships a CLI.
EXCLUDED = ("ruamel/yaml/clibz/", "markdown_it/cli/")
MAX_WHEEL_BYTES = 1 << 20


def fetch(url: str, digest: str) -> bytes:
    with urllib.request.urlopen(url, timeout=60) as response:  # noqa: S310 - fixed https URLs above
        data = response.read(MAX_WHEEL_BYTES + 1)
    if len(data) > MAX_WHEEL_BYTES:
        raise SystemExit(f"{url}: larger than expected")
    if hashlib.sha256(data).hexdigest() != digest:
        raise SystemExit(f"{url}: sha256 mismatch; refusing to vendor it")
    return data


def manifest_lines(root: Path) -> list[str]:
    lines = []
    for path in sorted(p for p in root.rglob("*") if p.is_file()):
        rel = path.relative_to(root).as_posix()
        if rel in ("MANIFEST.sha256", "README.md") or "__pycache__" in rel.split("/"):
            continue
        lines.append(f"{hashlib.sha256(path.read_bytes()).hexdigest()}  {rel}")
    return lines


def main() -> None:
    staging = VENDOR.with_name("_vendor.new")
    shutil.rmtree(staging, ignore_errors=True)
    (staging / "licenses").mkdir(parents=True)
    for dist, version, url, digest, package, licenses in WHEELS:
        with zipfile.ZipFile(io.BytesIO(fetch(url, digest))) as wheel:
            for info in wheel.infolist():
                name = info.filename
                if info.is_dir() or not name.startswith(package) or name.startswith(EXCLUDED):
                    continue
                if name.startswith("/") or ".." in name.split("/"):
                    raise SystemExit(f"{dist}: unsafe member {name!r}")
                target = staging / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(wheel.read(info))
            for member in licenses:
                suffix = member.rsplit("/", 1)[-1]
                (staging / "licenses" / f"{dist}-{version}-{suffix}").write_bytes(wheel.read(member))
    (staging / "MANIFEST.sha256").write_text("\n".join(manifest_lines(staging)) + "\n", encoding="utf-8")
    readme = VENDOR / "README.md"
    if readme.exists():
        shutil.copy2(readme, staging / "README.md")
    shutil.rmtree(VENDOR, ignore_errors=True)
    staging.rename(VENDOR)
    print(f"vendored {len(WHEELS)} wheels into {VENDOR.relative_to(ROOT)}", file=sys.stderr)


if __name__ == "__main__":
    main()
