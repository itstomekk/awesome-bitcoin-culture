"""Add mini-gallery pictures (shared/works/*.webp, not thumbnails) to app/lum.js so their banners get
the right wash and tint when a work is the picture of the day. Existing keys are left as they are.

    python scripts/lum_works.py
"""
import colorsys
import json
import math
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
LUM = ROOT / "app" / "lum.js"


def measure(path):
    """[mean luminance 0-1, accent hue 0-360 or -1, accent saturation 0-100]"""
    im = Image.open(path).convert("RGB").resize((64, 64))
    px = list(im.get_flattened_data()) if hasattr(im, "get_flattened_data") else list(im.getdata())
    if px and not isinstance(px[0], tuple):  # flattened to r,g,b,r,g,b...
        px = list(zip(px[0::3], px[1::3], px[2::3]))
    lum = sum((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 for r, g, b in px) / len(px)
    hls = [colorsys.rgb_to_hls(r / 255, g / 255, b / 255) for r, g, b in px]
    vivid = [(h, s) for h, l, s in hls if s > 0.25 and 0.15 < l < 0.85]
    if len(vivid) < len(px) * 0.05:
        return [round(lum, 2), -1, -1]
    x = sum(math.cos(h * 2 * math.pi) * s for h, s in vivid)
    y = sum(math.sin(h * 2 * math.pi) * s for h, s in vivid)
    hue = round((math.degrees(math.atan2(y, x)) + 360) % 360)
    return [round(lum, 2), hue, round(sum(s for _, s in vivid) / len(vivid) * 100)]


def main():
    text = LUM.read_text(encoding="utf-8")
    head, body = text.split("window.R3_LUM=", 1)
    data = json.loads(body.strip().rstrip(";"))
    added = 0
    for f in sorted((ROOT / "shared" / "works").glob("*.webp")):
        if f.name.endswith(".t.webp") or ("i:" + f.name) in data:
            continue
        data["i:" + f.name] = measure(f); added += 1
    keep = {k: v for k, v in data.items() if not re.fullmatch(r"i:.+-\d+\.webp", k) or (ROOT / "shared/works" / k[2:]).exists()
            or (ROOT / "shared/img" / k[2:]).exists()}  # drop works that were removed
    LUM.write_text(head + "window.R3_LUM=" + json.dumps(keep, separators=(",", ":")) + ";\r\n", encoding="utf-8")
    print(f"lum.js: {added} works added, {len(data) - len(keep)} stale works dropped, {len(keep)} keys")


if __name__ == "__main__":
    main()
