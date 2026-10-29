"""Make a 1200x630 link-preview card per entry: shared/og/<id>.jpg (used by the /a/<id>/ pages from assemble.py).

Cards are HTML rendered by Playwright Firefox. Logo = the favicon's bulgy A / ₿ / C (scripts/og/glyph-*.png, used
as CSS masks) + Archivo Black, ending in "!". Every card ends with the domain at the bottom.

Each entry gets one of three layouts, picked from a hash of its id so it never changes between runs:
  1 split       artwork panel left, stacked logo + pill + name + description right
  3 main-og     stacked logo top left, pill + name + url bottom left, framed artwork right (like app/og.jpg)
  6 full-bleed  logo across the top, pill + name bottom left, url bottom right
If scripts/og/bg/<id>.webp exists (a GPT collage of the entry's other works, see --import), it is the background;
otherwise the entry's own image is blurred (1, 3) or used full-bleed (6). The backgrounds are git-ignored (~40 MB);
the PNG masters live in C:/Users/Lenovo/Hermes/image-gen/2026-10-28-abc-share-cards/bg2/.

Run locally after build.py (the cards are committed; CI does not render them). Entries without a card fall back
to the site-wide og.jpg, so a missing card never breaks a deploy.

    python scripts/og_cards.py                     # all entries
    python scripts/og_cards.py pegah-rug           # just these ids
    python scripts/og_cards.py --import DIR        # copy DIR/<id>.png collages into scripts/og/bg/<id>.webp
"""
import hashlib
import html as H
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "shared" / "og"
ASSETS = Path(__file__).resolve().parent / "og"
BGDIR = ASSETS / "bg"
URL = "awesomebitcoinculture.com"
OR, CREAM, DARK = "#f7931a", "#f2f0e9", "#15110f"
ROOM = {"art": OR, "film": "#ee4a35", "institutions": "#2f5be0", "literature": "#7fc232", "music": "#f0468f",
        "podcasts": "#1f9bdc", "games": "#8a44d8", "events": "#14ab9f", "memes": "#f5cf2c"}
WHITE_INK = {"institutions", "games"}
GW = {k: Image.open(ASSETS / f"glyph-{k}.png").size for k in "ABC"}

CSS = f'''@font-face{{font-family:AB;src:url("{(ASSETS / 'fonts/ArchivoBlack.ttf').as_uri()}")}}
@font-face{{font-family:SM;src:url("{(ASSETS / 'fonts/SpaceMono-Bold.ttf').as_uri()}")}}
*{{box-sizing:border-box}}body{{margin:0;width:1200px;height:630px;overflow:hidden;background:{DARK};color:{CREAM};position:relative;font-family:SM}}
.pill{{display:inline-block;font:700 19px/1 SM;padding:9px 14px;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}}
.name{{font-family:AB;letter-spacing:-1px;line-height:1.02;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}}
.desc{{font:400 19px/1.4 SM;color:#cfc8ba;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden}}
.url{{font:700 20px/1 SM;color:{OR};letter-spacing:.5px;white-space:nowrap}}
.blur{{position:absolute;inset:-40px;background-size:cover;background-position:center;filter:blur(30px) brightness(.45)}}
.art{{position:absolute;display:flex;align-items:center;justify-content:center}}
.art img{{max-width:100%;max-height:100%;box-shadow:0 10px 40px rgba(0,0,0,.5)}}'''


def glyph(k, fs, colour):
    h_ac = fs * 0.80  # bulgy A/C a touch taller than Archivo Black caps; ₿ taller still, centred on the line
    h = h_ac * GW[k][1] / GW["A"][1]
    w = h * GW[k][0] / GW[k][1]
    drop = (h - h_ac) / 2 + h_ac * 0.02
    m = f"url('{(ASSETS / f'glyph-{k}.png').as_uri()}') center/contain no-repeat"
    return (f'<span style="display:inline-block;width:{w:.1f}px;height:{h:.1f}px;vertical-align:-{drop:.1f}px;'
            f'margin-right:{fs * 0.03:.1f}px;background:{colour};mask:{m}"></span>')


def logo(fs, stacked=True):
    parts = [glyph("A", fs, CREAM) + "wesome", glyph("B", fs, OR) + "itcoin",
             glyph("C", fs, CREAM) + f'ulture<span style="color:{OR}">!</span>']
    st = f"font:{fs}px/{1.07 if stacked else 1.2} AB;letter-spacing:{-fs / 44:.1f}px;color:{CREAM};white-space:nowrap"
    if stacked:
        return f'<div style="{st}">' + "".join(f'<span style="display:block">{p}</span>' for p in parts) + "</div>"
    return f'<div style="{st}">' + " ".join(parts) + "</div>"


def pill(en, rooms):
    c = ROOM.get(en["room"], OR)
    ink = "#fff" if en["room"] in WHITE_INK else "#111"
    lab = rooms.get(en["room"], en["section"]) + (f" · {en['sub']}" if en["sub"] else "")
    return f'<span class="pill" style="background:{c};color:{ink}">{H.escape(lab)}</span>', c


def nsize(name, base):
    n = len(name)
    return base if n <= 14 else max(int(base * 0.55), int(base * (14 / n) ** 0.55))


def nm(en, size, extra=""):
    return f'<div class="name" style="font-size:{size}px;{extra}">{H.escape(en["name"])}</div>'


def desc(en, lines, extra=""):
    d = " ".join(en["desc"].split())
    return f'<div class="desc" style="-webkit-line-clamp:{lines};{extra}">{H.escape(d)}</div>' if d else ""


def url(extra=""):
    return f'<div class="url" style="{extra}">{URL}</div>'


def cover(src, pos="center"):
    return f'<div style="position:absolute;inset:0;background:url(\'{src}\') {pos}/cover"></div>'


def blur(src):
    return f'<div class="blur" style="background-image:url(\'{src}\')"></div>'


def l1(en, rooms, im, bg):
    p, c = pill(en, rooms)
    panel = (cover(bg, "right center") + '<div style="position:absolute;inset:0;background:rgba(21,17,15,.15)"></div>'
             f'<div class="art" style="inset:64px"><img src="{im}" style="outline:4px solid {c};outline-offset:5px"></div>'
             if bg else blur(im) + f'<div class="art" style="inset:30px"><img src="{im}"></div>')
    return (f'<div style="position:absolute;left:0;top:0;width:600px;bottom:0;overflow:hidden">{panel}</div>'
            f'<div style="position:absolute;left:600px;top:0;width:8px;height:630px;background:{c}"></div>'
            '<div style="position:absolute;left:656px;right:48px;top:44px;bottom:40px;display:flex;flex-direction:column;align-items:flex-start">'
            f'{logo(58)}<div style="margin-top:26px">{p}</div>{nm(en, nsize(en["name"], 58), "margin-top:18px")}'
            f'{desc(en, 3, "margin-top:12px")}{url("margin-top:auto")}</div>')


def l3(en, rooms, im, bg):
    p, c = pill(en, rooms)
    back = (cover(bg, "right center") + '<div style="position:absolute;inset:0;background:linear-gradient(90deg,'
            'rgba(21,17,15,.88) 0,rgba(21,17,15,.7) 40%,rgba(21,17,15,.1) 75%,rgba(21,17,15,0) 100%)"></div>'
            if bg else blur(im) + '<div style="position:absolute;inset:0;background:linear-gradient(90deg,'
            'rgba(21,17,15,.97) 0,rgba(21,17,15,.9) 45%,rgba(21,17,15,.35) 100%)"></div>')
    return (back + f'<div class="art" style="left:660px;right:48px;top:48px;bottom:48px"><img src="{im}" style="outline:4px solid {c};outline-offset:6px"></div>'
            '<div style="position:absolute;left:56px;width:560px;top:50px;bottom:44px;display:flex;flex-direction:column;align-items:flex-start">'
            f'{logo(56)}<div style="margin-top:auto">{p}</div>{nm(en, nsize(en["name"], 60), "margin-top:16px")}{url("margin-top:22px")}</div>')


def l6(en, rooms, im, bg):
    p, c = pill(en, rooms)
    if bg:
        back = (cover(bg) + '<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(21,17,15,.75) 0,rgba(21,17,15,.35) 50%,rgba(21,17,15,0) 70%)"></div>'
                '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(21,17,15,.92) 0,rgba(21,17,15,.6) 18%,rgba(21,17,15,0) 32%,rgba(21,17,15,0) 55%,rgba(21,17,15,.92) 100%)"></div>'
                f'<div class="art" style="right:56px;top:120px;width:400px;bottom:104px"><img src="{im}" style="outline:4px solid {c};outline-offset:5px"></div>')
        width = "620px"
    else:
        back = (cover(im) + '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(21,17,15,.94) 0,rgba(21,17,15,.6) 24%,'
                'rgba(21,17,15,0) 42%,rgba(21,17,15,0) 48%,rgba(21,17,15,.9) 78%,rgba(21,17,15,.97) 100%)"></div>')
        width = "760px"
    return (back + f'<div style="position:absolute;left:52px;top:38px">{logo(56, stacked=False)}</div>'
            f'<div style="position:absolute;left:52px;width:{width};bottom:40px;display:flex;flex-direction:column;align-items:flex-start">'
            f'{p}{nm(en, nsize(en["name"], 66), "margin-top:14px")}</div>'
            f'{url("position:absolute;right:56px;bottom:46px")}')


LAYOUTS = [l1, l3, l6]


def layout(en):
    return LAYOUTS[int(hashlib.sha1(en["id"].encode()).hexdigest(), 16) % len(LAYOUTS)]


USE_WORK = {"superama"}  # main img is a site screenshot with a popup baked in


def frame_src(en):
    """Main image for the frame; the first work instead when the main image is near-black or listed in USE_WORK."""
    src = ROOT / "shared" / "img" / (en.get("img") or "")
    wk = ROOT / "shared" / "works" / en["wk"][0][0] if en.get("wk") else None
    if en.get("img") and src.exists():
        from PIL import Image, ImageStat
        dark = sum(ImageStat.Stat(Image.open(src).convert("L")).mean) < 30
        if not ((dark or en["id"] in USE_WORK) and wk and wk.exists()):
            return src
    return wk if wk and wk.exists() else ROOT / "app" / "og.jpg"


def page(en, rooms):
    im = frame_src(en).as_uri()
    bgf = BGDIR / (en["id"] + ".webp")
    body = layout(en)(en, rooms, im, bgf.as_uri() if bgf.exists() else None)
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{body}</body></html>'


def import_bg(src_dir):
    BGDIR.mkdir(parents=True, exist_ok=True)
    n = 0
    for f in sorted(Path(src_dir).glob("*.png")):
        im = Image.open(f).convert("RGB")
        im = im.resize((1280, round(1280 * im.height / im.width)), Image.LANCZOS)
        im.save(BGDIR / (f.stem + ".webp"), "WEBP", quality=80, method=6)
        n += 1
    size = sum(f.stat().st_size for f in BGDIR.glob("*.webp")) / 1e6
    print(f"backgrounds: {n} imported, {size:.1f} MB in {BGDIR}")


def main(ids):
    from playwright.sync_api import sync_playwright

    t = (ROOT / "shared" / "data.js").read_text(encoding="utf-8")
    data = json.loads(t[t.index("=") + 1:].strip().rstrip(";"))
    rooms = {r["id"]: r["label"] for r in data["rooms"]}
    OUT.mkdir(exist_ok=True)
    tmp = ASSETS / "_render.html"
    keep = {en["id"] + ".jpg" for en in data["entries"]}
    todo = [en for en in data["entries"] if not ids or en["id"] in ids]
    with sync_playwright() as p:
        b = p.firefox.launch()
        pg = b.new_page(viewport={"width": 1200, "height": 630})
        for en in todo:
            tmp.write_text(page(en, rooms), encoding="utf-8")
            pg.goto(tmp.as_uri())
            pg.evaluate("document.fonts.ready")
            pg.wait_for_load_state("load")
            pg.wait_for_timeout(150)
            pg.screenshot(path=str(OUT / (en["id"] + ".jpg")), type="jpeg", quality=84)
        b.close()
    tmp.unlink(missing_ok=True)
    stale = [f for f in OUT.glob("*.jpg") if f.name not in keep]
    for f in stale:
        f.unlink()
    size = sum(f.stat().st_size for f in OUT.glob("*.jpg")) / 1e6
    print(f"og cards: {len(todo)} written, {len(stale)} stale removed, {size:.1f} MB in shared/og/")


if __name__ == "__main__":
    if sys.argv[1:2] == ["--import"]:
        import_bg(sys.argv[2])
    else:
        main(set(sys.argv[1:]))
