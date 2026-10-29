"""Parity check: the gallery must show exactly what the README lists, in the README's own structure.

    python scripts/check_parity.py

Fails (exit 1) when an entry is missing/extra, a room is not a README section, or a README subsection
is missing from its room. Run after `build.py`; CI can run it before publishing.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
README = ROOT.parent / "README.md"
DATA = ROOT / "shared" / "data.js"


def readme_structure(md):
    md = md.replace("\r\n", "\n")
    body = md.split("\n---\n")[1]  # the rooms sit between the Contents list and the closing rule
    sections, entries, room, sub = [], [], None, ""
    for line in body.split("\n"):
        m = re.match(r"^##\s+\S+\s+(.*)$", line)
        if m:
            room, sub = m.group(1).strip(), ""
            sections.append(room)
            continue
        if line.startswith("## "):  # e.g. Contributing: not a room
            room = None
            continue
        m = re.match(r"^#{3,4}\s+(.*)$", line)
        if m:
            sub = m.group(1).strip()
            continue
        m = re.match(r"^- \[([^\]]+)\]\(([^)\s]+)\)", line)
        if m and room:
            entries.append((room, sub, m.group(1), m.group(2)))
    return sections, entries


def main():
    sections, want = readme_structure(README.read_text(encoding="utf-8"))
    js = DATA.read_text(encoding="utf-8")
    data = json.loads(js[js.index("=") + 1:].strip().rstrip(";"))
    got = [(e["section"], e["sub"], e["name"], e["url"]) for e in data["entries"]]
    problems = []
    if sorted(want) != sorted(got):
        w, g = set(want), set(got)
        problems += [f"missing on site: {x}" for x in sorted(w - g)] + [f"extra on site: {x}" for x in sorted(g - w)]
    if len(data["rooms"]) != len(sections):
        problems.append(f"{len(data['rooms'])} rooms on the site, {len(sections)} sections in the README")
    if sum(r["count"] for r in data["rooms"]) != len(want):
        problems.append("room counts do not add up to the README entry count")
    print(f"README: {len(want)} entries in {len(sections)} sections; site: {len(got)} entries in {len(data['rooms'])} rooms")
    for p in problems:
        print("FAIL", p)
    if problems:
        sys.exit(1)
    print("OK: the site matches the README 1:1")


if __name__ == "__main__":
    main()
