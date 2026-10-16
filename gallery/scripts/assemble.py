"""Assemble the deployable site into dist/ (used locally and by the GitHub Pages workflow).

Layout in the repo:  gallery/app/ (page)  +  gallery/shared/ (data, images, common.js)
Output:              dist/index.html ... dist/shared/...   with '../shared/' rewritten to 'shared/'.
"""
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    shutil.copytree(ROOT / "app", DIST)
    shutil.copytree(ROOT / "shared", DIST / "shared")
    (DIST / ".nojekyll").write_text("", encoding="utf-8")
    n = 0
    for f in DIST.rglob("*"):
        if f.suffix in (".html", ".js", ".css") and f.is_file():
            t = f.read_text(encoding="utf-8")
            if "../shared/" in t:
                f.write_text(t.replace("../shared/", "shared/"), encoding="utf-8")
                n += 1
    size = sum(f.stat().st_size for f in DIST.rglob("*") if f.is_file()) / 1e6
    print(f"dist/ ready: {n} files rewritten, {size:.1f} MB")


if __name__ == "__main__":
    main()
