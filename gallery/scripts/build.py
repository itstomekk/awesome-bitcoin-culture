"""One-command rebuild: README -> entries -> images (new entries only) -> shared/data.js.

    python scripts/build.py            # parse README, fetch images for new entries, write data.js
    python scripts/build.py --force    # refetch every image
    python scripts/build.py --no-fetch # parse + data.js only

Every page in the gallery reads shared/data.js, so rebuilding the data refreshes all five variants.
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PY = sys.executable

# One room per README section (## heading), same order; README subsections (###) show as headings inside a room.
ROOM_OF = {
    "Visual Art": "art",
    "Literature": "literature",
    "Music": "music",
    "Film & Documentary": "film",
    "Podcasts": "podcasts",
    "Games": "games",
    "Institutions & Spaces": "institutions",
    "Events & Festivals": "events",
}
ROOMS = [
    ("art", "Visual Art", "Painting, illustration, comics, sculpture, design and memes"),
    ("literature", "Literature", "Books and long reads"),
    ("music", "Music", "Sats-per-stream sound"),
    ("film", "Film", "Film & Documentary: documentaries and features"),
    ("podcasts", "Podcasts", "Bitcoin culture in conversation: creators, stories, communities, ideas"),
    ("games", "Games", "Play for the story, or for sats"),
    ("institutions", "Institutions", "Institutions & Spaces: galleries, funders, magazines, platforms"),
    ("events", "Events", "Events & Festivals: culture-first gatherings"),
]


def run(*args):
    print(">", " ".join(args))
    subprocess.run([PY, *args], check=True, cwd=ROOT)


def main():
    flags = set(sys.argv[1:])
    run("scripts/parse_readme.py")
    if "--no-fetch" not in flags:
        run("scripts/fetch_images.py", *(["--force"] if "--force" in flags else []))

    entries = json.loads((ROOT / "data/entries.json").read_text(encoding="utf-8"))
    missing = {e["room"] for e in entries} - set(ROOM_OF)
    assert not missing, f"README sections without a room: {missing}"
    images = json.loads((ROOT / "data/images.json").read_text(encoding="utf-8")) if (ROOT / "data/images.json").exists() else {}
    shots_path = ROOT / "data/shots.json"
    shots = json.loads(shots_path.read_text(encoding="utf-8")) if shots_path.exists() else {}
    out = []
    for e in entries:
        info = images.get(e["id"], {})
        img = info.get("img")
        out.append({
            "id": e["id"],
            "name": e["name"],
            "url": e["url"],
            "host": e["host"],
            "desc": e["desc"],
            "room": ROOM_OF[e["room"]],
            "section": e["room"],
            "sub": e["sub"],
            "img": img.split("/", 1)[1] if img else None,
            "shot": shots.get(e["id"], {}).get("shot"),
            "w": info.get("w"),
            "h": info.get("h"),
            "color": info.get("color"),
        })
    rooms = []
    for rid, label, blurb in ROOMS:
        n = sum(1 for e in out if e["room"] == rid)
        rooms.append({"id": rid, "label": label, "blurb": blurb, "count": n})
    data = {"rooms": rooms, "entries": out, "total": len(out)}
    js = "window.ABC_DATA = " + json.dumps(data, ensure_ascii=False) + ";\n"
    (ROOT / "shared").mkdir(exist_ok=True)
    (ROOT / "shared/data.js").write_text(js, encoding="utf-8")
    print(f"shared/data.js: {len(out)} entries, {sum(1 for e in out if e['img'])} with og images, "
          f"{sum(1 for e in out if e['shot'])} with page snapshots")


if __name__ == "__main__":
    main()
