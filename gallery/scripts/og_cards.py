"""Make a 1200x630 link-preview card per entry: shared/og/<id>.jpg (used by the /a/<id>/ pages from assemble.py).

Run locally after build.py (the cards are committed; CI does not have these fonts). Entries without a card fall
back to the site-wide og.jpg, so a missing card never breaks a deploy. Output is deterministic, so unchanged
entries produce byte-identical files and no git noise.

    python scripts/og_cards.py            # all entries
    python scripts/og_cards.py pegah-rug  # just these ids
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "shared" / "og"
FONTS = Path("C:/Windows/Fonts")
W, H, ART = 1200, 630, 600          # card size; the artwork takes the left ART px
PAD = 52
BG, INK, DIM, ORANGE = (17, 17, 17), (243, 238, 228), (196, 189, 176), (247, 147, 26)
ROOM = {"art": "#f7931a", "film": "#ee4a35", "institutions": "#2f5be0", "literature": "#7fc232", "music": "#f0468f",
        "podcasts": "#1f9bdc", "games": "#8a44d8", "events": "#14ab9f", "memes": "#f5cf2c"}
ROOM_INK = {"institutions": (255, 255, 255), "games": (255, 255, 255)}


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)


def wrap(draw, text, f, width, max_lines):
    words, lines = text.split(), []
    while words and len(lines) < max_lines:
        line = words.pop(0)
        while words and draw.textlength(line + " " + words[0], font=f) <= width:
            line += " " + words.pop(0)
        lines.append(line)
    if words:  # truncated: ellipsis on the last line
        last = lines[-1]
        while last and draw.textlength(last + "…", font=f) > width:
            last = last.rsplit(" ", 1)[0] if " " in last else last[:-1]
        lines[-1] = last.rstrip(" ,;:-") + "…"
    return lines


def art_panel(src):
    im = Image.open(src).convert("RGB")
    bg = im.copy()
    s = max(ART / bg.width, H / bg.height)
    bg = bg.resize((round(bg.width * s) + 1, round(bg.height * s) + 1), Image.LANCZOS)
    l, t = (bg.width - ART) // 2, (bg.height - H) // 2
    bg = bg.crop((l, t, l + ART, t + H)).filter(ImageFilter.GaussianBlur(28))
    bg = Image.blend(bg, Image.new("RGB", bg.size, BG), 0.55)
    s = min((ART - 60) / im.width, (H - 60) / im.height)
    fg = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    bg.paste(fg, ((ART - fg.width) // 2, (H - fg.height) // 2))
    return bg


def card(en, rooms):
    c = Image.new("RGB", (W, H), BG)
    src = ROOT / "shared" / "img" / en["img"]
    if src.exists():
        c.paste(art_panel(src), (0, 0))
    d = ImageDraw.Draw(c)
    accent = ROOM.get(en["room"], "#f7931a")
    d.rectangle((ART, 0, ART + 8, H), fill=accent)
    x, width = ART + 8 + PAD, W - (ART + 8) - 2 * PAD

    # room / section pill
    label = rooms.get(en["room"], en["section"]).upper() + (f"  ·  {en['sub'].upper()}" if en["sub"] else "")
    fl = font("consolab.ttf", 20)
    label = wrap(d, label, fl, width - 28, 1)[0]
    lw = d.textlength(label, font=fl)
    d.rectangle((x, PAD, x + lw + 28, PAD + 40), fill=accent)
    d.text((x + 14, PAD + 20), label, font=fl, fill=ROOM_INK.get(en["room"], BG), anchor="lm")

    # name (largest size that fits in 3 lines) + description, centred vertically between pill and footer
    for size in (72, 64, 56, 50, 44, 40):
        fn = font("seguibl.ttf", size)
        lines = wrap(d, en["name"], fn, width, 3)
        if not lines[-1].endswith("…") or size == 40:
            break
    lh, dh, gap = round(size * 1.08), 35, 22
    top, bottom = PAD + 40 + 36, H - PAD - 64
    fd = font("segoeui.ttf", 26)
    n = max(0, (bottom - top - lh * len(lines) - gap) // dh)
    desc = wrap(d, " ".join(en["desc"].split()), fd, width, min(n, 6)) if n and en["desc"] else []
    block = lh * len(lines) + (gap + dh * len(desc) if desc else 0)
    y = top + max(0, (bottom - top - block) // 2) - round(size * 0.12)
    for ln in lines:
        d.text((x, y), ln, font=fn, fill=INK)
        y += lh
    y += gap
    for ln in desc:
        d.text((x, y), ln, font=fd, fill=DIM)
        y += dh

    # footer
    ff = font("consolab.ttf", 22)
    d.text((x, H - PAD), "₿", font=font("seguibl.ttf", 30), fill=ORANGE, anchor="ls")
    d.text((x + 30, H - PAD), "awesomebitcoinculture.com", font=ff, fill=ORANGE, anchor="ls")
    return c


def main(ids):
    t = (ROOT / "shared" / "data.js").read_text(encoding="utf-8")
    data = json.loads(t[t.index("=") + 1:].strip().rstrip(";"))
    rooms = {r["id"]: r["label"] for r in data["rooms"]}
    OUT.mkdir(exist_ok=True)
    keep = {en["id"] + ".jpg" for en in data["entries"]}
    n = 0
    for en in data["entries"]:
        if ids and en["id"] not in ids:
            continue
        card(en, rooms).save(OUT / (en["id"] + ".jpg"), "JPEG", quality=84, optimize=True, progressive=True)
        n += 1
    stale = [f for f in OUT.glob("*.jpg") if f.name not in keep]
    for f in stale:
        f.unlink()
    size = sum(f.stat().st_size for f in OUT.glob("*.jpg")) / 1e6
    print(f"og cards: {n} written, {len(stale)} stale removed, {size:.1f} MB in shared/og/")


if __name__ == "__main__":
    main(set(sys.argv[1:]))
