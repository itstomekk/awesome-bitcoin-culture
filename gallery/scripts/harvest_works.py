"""Harvest candidate artwork images for the per-entry mini gallery ("works").

For each entry id: open its page (and up to 3 same-site gallery/portfolio pages) in Firefox,
scroll to trigger lazy loading, collect every large <img> (largest srcset variant) and og:image,
download, drop small/duplicate/logo-sized ones, and write a numbered contact sheet.
Candidates go to OUT/<id>/ for picking by eye; nothing in the gallery is changed.

    C:/Python314/python.exe scripts/harvest_works.py OUT_DIR id1 id2 ...
    C:/Python314/python.exe scripts/harvest_works.py OUT_DIR id1 --extra https://page2 https://page3

Pick with scripts/add_works.py afterwards.
"""
import asyncio
import concurrent.futures as cf
import io
import json
import re
import sys
import urllib.request
from pathlib import Path
from urllib.parse import urljoin, urlparse

from PIL import Image, ImageDraw
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0")
MIN_SIDE = 360          # smaller images are icons, buttons, thumbnails
MAX_CAND = 40
GALLERY_HINT = re.compile(r"gallery|portfolio|works?\b|artworks?|paintings?|collection|series|projects?|art\b|shop|catalog|sculpt", re.I)
# multi-artist sites: their shop/catalogue/"more from" pages show OTHER artists' work, so links there are never followed
PLATFORMS = ("timechainartmagazine.com", "scarce.city", "saatchiart.com", "whitecrypt.com", "bitcoinartgallery.com",
             "bitcoinforthearts.org", "xverse.app", "9fold.co", "x.com", "twitter.com", "instagram.com", "facebook.com")
SKIP_HINT = re.compile(r"logo|icon|avatar|favicon|sprite|badge|payment|flag|emoji|placeholder|loader|spinner", re.I)

COLLECT_JS = """
() => {
  const out = [];
  const pick = (img) => {
    let best = img.currentSrc || img.src, bw = img.naturalWidth || 0;
    const ss = img.getAttribute('srcset') || img.getAttribute('data-srcset') || '';
    for (const m of ss.matchAll(/(\\S+)\\s+(\\d+)w/g)) { // URLs may contain commas (cdn-cgi/image/w=..,h=..), so no split(',')
      const u = m[1].replace(/^,/, ''), w = parseInt(m[2]) || 0;
      if (u && w > bw) { best = u; bw = w; }
    }
    const lazy = img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original');
    if (lazy && !best) best = lazy;
    return best;
  };
  for (const img of document.images) {
    const r = img.getBoundingClientRect();
    out.push({u: pick(img), alt: img.alt || '', w: img.naturalWidth, h: img.naturalHeight, dw: r.width, dh: r.height});
  }
  for (const el of document.querySelectorAll('[style*="background-image"]')) {
    const m = /url\\(["']?([^"')]+)/.exec(el.style.backgroundImage || '');
    if (m) { const r = el.getBoundingClientRect(); out.push({u: m[1], alt: '', w: 0, h: 0, dw: r.width, dh: r.height}); }
  }
  const og = document.querySelector('meta[property="og:image"]');
  if (og) out.push({u: og.content, alt: 'og', w: 0, h: 0, dw: 999, dh: 999});
  const links = [...document.querySelectorAll('a[href]')].map(a => ({href: a.href, text: (a.textContent || '').trim().slice(0, 60)}));
  return {imgs: out, links};
}
"""


def get(url, limit=15_000_000, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "image/*,*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(limit)


def upgrade(u):
    """Ask image CDNs for a large rendition instead of the thumbnail the page shows."""
    if "wixstatic.com/media/" in u:
        return re.sub(r"/v1/.*$", "", u)
    if "/cdn-cgi/image/" in u:
        return re.sub(r"/cdn-cgi/image/[^/]+/", "/cdn-cgi/image/format=auto,w=1600/", u)
    if "cdn.shopify.com" in u or "/cdn/shop/" in u:
        u = re.sub(r"_(\d+x\d*|\d*x\d+)(?=\.\w+(\?|$))", "", u)
        return re.sub(r"([?&])width=\d+", r"\1width=1600", u)
    if "squarespace" in u:
        return re.sub(r"format=\d+w", "format=1500w", u) if "format=" in u else u + ("&" if "?" in u else "?") + "format=1500w"
    if "/wp-content/uploads/" in u:
        return re.sub(r"-\d+x\d+(?=\.\w+$)", "", u.split("?")[0])
    return u


def fetch(u):
    for v in dict.fromkeys([upgrade(u), u]):
        try:
            im = Image.open(io.BytesIO(get(v))); im.load()
            return im, v
        except Exception:  # noqa: BLE001
            continue
    return None, u


def ahash(im):
    g = im.convert("L").resize((12, 12))
    px = list(g.getdata()); avg = sum(px) / len(px)
    return int("".join("1" if p > avg else "0" for p in px), 2)


def near(a, b, tol=14):
    return bin(a ^ b).count("1") <= tol


def same_as_main(main_im, im, h):
    """Main pictures of tall/square art are composed onto a blurred wide backdrop, so a plain hash misses
    them: compare against the centre of the main cut to the candidate's aspect ratio (and a little inset)."""
    mw, mh = main_im.size
    ar = im.width / im.height
    for inset in (0, 0.04, 0.08):
        ch = mh * (1 - inset); cw = min(mw, ch * ar)
        if cw >= mw: ch = mw / ar
        box = ((mw - cw) / 2, (mh - ch) / 2, (mw + cw) / 2, (mh + ch) / 2)
        if near(h, ahash(main_im.crop(tuple(round(v) for v in box))), 18):
            return True
    return False


async def scroll(page):
    for _ in range(14):
        await page.mouse.wheel(0, 1400)
        await page.wait_for_timeout(350)
    await page.wait_for_timeout(1200)


async def visit(ctx, url):
    page = await ctx.new_page()
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=45000)
        await page.wait_for_timeout(2500)
        await scroll(page)
        data = await page.evaluate(COLLECT_JS)
        return data, page.url
    except Exception as ex:  # noqa: BLE001
        print("  visit failed", url, type(ex).__name__, str(ex)[:120], flush=True)
        return {"imgs": [], "links": []}, url
    finally:
        await page.close()


def sheet(cands, path):
    cols, cw, ch = 5, 300, 260
    rows = (len(cands) + cols - 1) // cols or 1
    sh = Image.new("RGB", (cols * cw, rows * ch), (28, 28, 28))
    d = ImageDraw.Draw(sh)
    for i, c in enumerate(cands):
        im = Image.open(c["file"]).convert("RGB"); im.thumbnail((cw - 10, ch - 34))
        x, y = (i % cols) * cw, (i // cols) * ch
        sh.paste(im, (x + 5 + (cw - 10 - im.width) // 2, y + 5))
        d.rectangle([x, y + ch - 26, x + cw, y + ch], fill=(0, 0, 0))
        d.text((x + 6, y + ch - 22), f"#{c['n']}  {c['w']}x{c['h']}", fill=(255, 220, 90))
    sh.save(path, quality=82)


async def harvest(ctx, entry, extra, out):
    d = out / entry["id"]; d.mkdir(parents=True, exist_ok=True)
    print(entry["id"], entry["url"], flush=True)
    data, final = await visit(ctx, entry["url"])
    pages = [final] + list(extra)
    host = urlparse(final).netloc
    on_platform = any(host.replace("www.", "").endswith(pf) for pf in PLATFORMS)
    if not extra and not on_platform:
        seen = {final.split("#")[0]}
        for l in data["links"]:
            h = l["href"].split("#")[0]
            if urlparse(h).netloc != host or h in seen:
                continue
            if re.search(r"\.(jpe?g|png|gif|webp|svg|pdf|mp4)(\?|$)", h, re.I):  # a file, not a page
                continue
            if GALLERY_HINT.search(urlparse(h).path + " " + l["text"]) and not re.search(r"cart|login|account|contact|about|privacy|terms|checkout", h, re.I):
                seen.add(h); pages.append(h)
            if len(pages) >= 4:
                break
    imgs = [(final, i) for i in data["imgs"]]
    for p in pages[1:]:
        dd, f = await visit(ctx, p)
        imgs += [(f, i) for i in dd["imgs"]]
    page_of = {}
    urls, cands, hashes = [], [], []
    main = ROOT / "shared" / "img" / f"{entry['id']}.webp"
    main_im = Image.open(main).convert("RGB") if main.exists() else None
    if main_im:
        hashes.append(ahash(main_im))
    for base, i in imgs:
        u = i["u"]
        if not u or u.startswith("data:"):
            continue
        u = urljoin(base, u)
        page_of.setdefault(u, base)
        if u in urls or SKIP_HINT.search(u.split("?")[0].rsplit("/", 1)[-1]):
            continue
        if i["dw"] and i["dw"] < 120 and i["alt"] != "og":
            continue
        urls.append(u)
    def one_url(u):
        im, v = fetch(u)
        return u, im, v

    with cf.ThreadPoolExecutor(8) as pool:  # downloads in parallel, results kept in page order
        got = await asyncio.to_thread(lambda: list(pool.map(one_url, urls[:MAX_CAND * 3])))
    for u, im, v in got:
        if len(cands) >= MAX_CAND:
            break
        if im is None:
            continue
        if min(im.size) < MIN_SIDE:
            continue
        h = ahash(im)
        if any(near(h, o) for o in hashes) or (main_im and same_as_main(main_im, im, h)):
            continue
        hashes.append(h)
        n = len(cands) + 1
        f = d / f"c{n:02d}.png"
        (im.convert("RGB") if im.mode not in ("RGB", "RGBA") else im).save(f)
        cands.append({"n": n, "url": v, "page": page_of.get(u, ""), "file": str(f), "w": im.width, "h": im.height})
    (d / "candidates.json").write_text(json.dumps({"id": entry["id"], "pages": pages, "cands": cands}, indent=1), encoding="utf-8")
    if cands:
        sheet(cands, d / "sheet.jpg")
    print(f"  {entry['id']}: {len(cands)} candidates from {len(pages)} pages", flush=True)


async def main():
    out = Path(sys.argv[1]); args = [a for a in sys.argv[2:] if a != "--resume"]
    extra = []
    if "--extra" in args:
        k = args.index("--extra"); extra = args[k + 1:]; args = args[:k]
    entries = {e["id"]: e for e in json.loads((ROOT / "data/entries.json").read_text(encoding="utf-8"))}
    async with async_playwright() as p:
        st = {}

        async def fresh():  # (re)start Firefox; a crashed browser is replaced instead of failing every later entry
            if st.get("b"):
                try:
                    await st["b"].close()
                except Exception:  # noqa: BLE001
                    pass
            st["b"] = await p.firefox.launch()
            st["ctx"] = await st["b"].new_context(viewport={"width": 1400, "height": 900}, user_agent=UA)
        await fresh()
        sem = asyncio.Semaphore(3)
        lock = asyncio.Lock()

        async def one(i):
            if "--resume" in sys.argv and (out / i / "candidates.json").exists():
                return
            async with sem:
                for attempt in (1, 2):
                    try:  # one broken site must not end the whole run
                        await harvest(st["ctx"], entries[i], extra, out)
                        return
                    except Exception as ex:  # noqa: BLE001
                        print(f"  {i}: FAILED (try {attempt}) {type(ex).__name__} {str(ex)[:160]}", flush=True)
                        if not st["b"].is_connected():
                            async with lock:
                                if not st["b"].is_connected():
                                    await fresh()
                        else:
                            return
        await asyncio.gather(*(one(i) for i in args))
        await st["b"].close()


if __name__ == "__main__":
    asyncio.run(main())
