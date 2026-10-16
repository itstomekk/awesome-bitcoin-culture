"""Fetch a representative image for every entry (og:image > twitter:image > icon).

Reads data/entries.json, writes shared/img/<id>.webp (max 720px wide) and
data/images.json {id: {"img": "img/<id>.webp"|null, "color": "#rrggbb", "w":, "h":}}.
Existing images are kept (re-run is cheap); pass --force to refetch.
Pure stdlib + Pillow. Failures are recorded, never invented.
"""
import concurrent.futures as cf
import io
import json
import re
import sys
import urllib.request
from pathlib import Path
from urllib.parse import urljoin

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "shared" / "img"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/126.0 Safari/537.36")
META = re.compile(r"<meta\s[^>]*>", re.I)
ATTR = re.compile(r'([a-zA-Z:_-]+)\s*=\s*("([^"]*)"|\'([^\']*)\'|([^\s>]+))')
LINK = re.compile(r"<link\s[^>]*>", re.I)


def get(url, limit=3_000_000, timeout=9):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(limit), r.headers.get("Content-Type", ""), r.geturl()


def attrs(tag):
    out = {}
    for m in ATTR.finditer(tag):
        out[m.group(1).lower()] = m.group(3) or m.group(4) or m.group(5) or ""
    return out


def candidates(html, base):
    imgs, icons = [], []
    for tag in META.findall(html):
        a = attrs(tag)
        key = (a.get("property") or a.get("name") or "").lower()
        if key in ("og:image", "og:image:url", "og:image:secure_url", "twitter:image", "twitter:image:src"):
            if a.get("content"):
                imgs.append(urljoin(base, a["content"].replace("&amp;", "&")))
    for tag in LINK.findall(html):
        a = attrs(tag)
        rel = a.get("rel", "").lower()
        if "apple-touch-icon" in rel and a.get("href"):
            icons.append(urljoin(base, a["href"]))
    return imgs + icons


def avg_color(im):
    small = im.convert("RGB").resize((24, 24))
    px = list(small.getdata())
    r = sum(p[0] for p in px) // len(px)
    g = sum(p[1] for p in px) // len(px)
    b = sum(p[2] for p in px) // len(px)
    return f"#{r:02x}{g:02x}{b:02x}"


def process(entry):
    eid, url = entry["id"], entry["url"]
    dest = IMG_DIR / f"{eid}.webp"
    if any(h in url for h in ("x.com/", "twitter.com/", "linktr.ee")):
        # login-walled / generic: no usable image
        return eid, {"img": None, "color": None, "why": "blocked-host"}
    try:
        body, ctype, final = get(url)
        html = body.decode("utf-8", "ignore")
        cands = candidates(html, final)
    except Exception as e:  # noqa: BLE001
        return eid, {"img": None, "color": None, "why": f"page:{type(e).__name__}"}
    for c in cands[:4]:
        try:
            data, ct, _ = get(c)
            im = Image.open(io.BytesIO(data))
            im.load()
            if im.width < 120 or im.height < 90:
                continue
            color = avg_color(im)
            if im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGBA" if "transparency" in im.info else "RGB")
            if im.width > 720:
                im = im.resize((720, round(im.height * 720 / im.width)), Image.LANCZOS)
            im.save(dest, "WEBP", quality=80)
            return eid, {"img": f"img/{eid}.webp", "color": color, "w": im.width, "h": im.height, "src": c}
        except Exception:  # noqa: BLE001
            continue
    return eid, {"img": None, "color": None, "why": "no-image" if not cands else "image-failed"}


def main():
    force = "--force" in sys.argv
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    entries = json.loads((ROOT / "data" / "entries.json").read_text(encoding="utf-8"))
    out_path = ROOT / "data" / "images.json"
    old = json.loads(out_path.read_text(encoding="utf-8")) if out_path.exists() else {}
    todo = [e for e in entries if not old.get(e["id"], {}).get("manual") and (force or not old.get(e["id"], {}).get("img"))]
    print(f"{len(todo)} to fetch of {len(entries)}")
    result = dict(old)
    with cf.ThreadPoolExecutor(max_workers=12) as ex:
        for i, (eid, info) in enumerate(ex.map(process, todo), 1):
            result[eid] = info
            if i % 20 == 0:
                print(" ", i, "done")
    out_path.write_text(json.dumps(result, indent=1), encoding="utf-8")
    ok = sum(1 for e in entries if result.get(e["id"], {}).get("img"))
    print(f"images: {ok}/{len(entries)}")


if __name__ == "__main__":
    main()
