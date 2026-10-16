"""Parse the Awesome Bitcoin Culture README into data/entries.json.

Usage: python scripts/parse_readme.py [path/to/README.md]
Source of truth stays the README; this output is generated and read-only.
"""
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
# Inside the repo the gallery lives in gallery/, so the README is one level up.
_REPO_README = ROOT.parent / "README.md"
DEFAULT = _REPO_README if _REPO_README.exists() else Path(
    r"C:\Users\Lenovo\Documents\Claude\Projects\Awesome Bitcoin Culture\README.md")

# room id -> (short label, accent colour used by some variants)
ROOMS = {
    "Visual Art": "Visual Art",
    "Film & Documentary": "Film & Documentary",
    "Literature": "Literature",
    "Music": "Music",
    "Podcasts": "Podcasts",
    "Games": "Games",
    "Institutions & Spaces": "Institutions & Spaces",
    "Events & Festivals": "Events & Festivals",
    "Memes & Internet Culture": "Memes & Internet Culture",
}

H2 = re.compile(r"^##\s+(\S+)\s+(.*)$")
H3 = re.compile(r"^#{3,4}\s+(.*)$")  # README ### subsections and the #### Games folds
ITEM = re.compile(r"^- \[(?P<name>[^\]]+)\]\((?P<url>[^)\s]+)\)\s*-?\s*(?P<desc>.*)$")


def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def clean(text: str) -> str:
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)  # inline links -> text
    text = re.sub(r"[*_`]", "", text)
    return re.sub(r"\s+", " ", text).strip()


def parse(md: str):
    entries, room, icon, sub = [], None, "", ""
    cur = None
    for raw in md.replace("\r\n", "\n").split("\n"):
        line = raw.rstrip()
        m = H2.match(line)
        if m:
            title = m.group(2).strip()
            if title in ROOMS:
                room, icon, sub, cur = title, m.group(1), "", None
            else:
                room, cur = None, None
            continue
        if room is None:
            continue
        m = H3.match(line)
        if m:
            sub, cur = m.group(1).strip(), None
            continue
        m = ITEM.match(line)
        if m:
            cur = {
                "id": "",
                "name": m.group("name").strip(),
                "url": m.group("url"),
                "desc": m.group("desc").strip(),
                "room": room,
                "roomLabel": ROOMS[room],
                "roomIcon": icon,
                "sub": sub,
            }
            entries.append(cur)
            continue
        if cur is not None and line.startswith("  ") and line.strip():
            cur["desc"] = (cur["desc"] + " " + line.strip()).strip()
        elif not line.strip():
            cur = None
    seen = {}
    for e in entries:
        e["desc"] = clean(e["desc"])
        e["host"] = urlparse(e["url"]).netloc.replace("www.", "")
        base = slug(e["name"]) or "entry"
        seen[base] = seen.get(base, 0) + 1
        e["id"] = base if seen[base] == 1 else f"{base}-{seen[base]}"
    return entries


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT
    entries = parse(src.read_text(encoding="utf-8"))
    out = ROOT / "data" / "entries.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(entries, ensure_ascii=False, indent=1), encoding="utf-8")
    by_room = {}
    for e in entries:
        by_room[e["room"]] = by_room.get(e["room"], 0) + 1
    print(len(entries), "entries ->", out)
    for k, v in by_room.items():
        print(f"  {v:3d}  {k}")


if __name__ == "__main__":
    main()
