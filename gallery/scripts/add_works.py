"""Add picked candidates to an entry's mini gallery ("works").

    python scripts/add_works.py CAND_DIR <id> 4,9,14,16      # numbers from CAND_DIR/<id>/sheet.jpg
    python scripts/add_works.py CAND_DIR <id> --clear         # remove the entry's works

Writes shared/works/<id>-<n>.webp (max 1200px on the long side), a 240px thumbnail <id>-<n>.t.webp, and data/works.json
{id: [{"img": "<id>-1.webp", "w": .., "h": .., "src": original URL}]}. The entry's main picture
(shared/img) stays first in the panel; works follow in the given order. Re-running replaces the list.
Then: python scripts/lum_works.py && python scripts/build.py --no-fetch
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "shared" / "works"
DB = ROOT / "data" / "works.json"
LONG = 1200


def main():
    cand_dir, eid, picks = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
    db = json.loads(DB.read_text(encoding="utf-8")) if DB.exists() else {}
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob(f"{eid}-*.webp"):
        if re.fullmatch(re.escape(eid) + r"-\d+(\.t)?\.webp", old.name):  # not another id that shares the prefix
            old.unlink()
    if picks == "--clear":
        db.pop(eid, None)
    else:
        info = json.loads((cand_dir / eid / "candidates.json").read_text(encoding="utf-8"))
        by_n = {c["n"]: c for c in info["cands"]}
        items = []
        for k, n in enumerate(int(x) for x in picks.split(",")):
            c = by_n[n]
            im = Image.open(c["file"])
            im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
            im.thumbnail((LONG, LONG), Image.LANCZOS)
            name = f"{eid}-{k + 1}.webp"
            im.save(OUT / name, "WEBP", quality=80, method=6)
            th = im.copy(); th.thumbnail((240, 240), Image.LANCZOS)
            th.save(OUT / name.replace(".webp", ".t.webp"), "WEBP", quality=72, method=6)
            items.append({"img": name, "w": im.width, "h": im.height, "src": c["url"]})
        db[eid] = items
    DB.write_text(json.dumps(dict(sorted(db.items())), indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(eid, len(db.get(eid, [])), "works")


if __name__ == "__main__":
    main()
