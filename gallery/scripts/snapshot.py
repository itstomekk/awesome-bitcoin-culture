"""Snapshot the landing page of entries that lack a good og:image.

Targets: entries with no image, plus entries whose image is a small/square logo.
Writes shared/shots/<id>.webp (720px wide, top of the page at 1280x800) and data/shots.json.
Needs Playwright + Firefox (Chromium hangs on this machine). Re-runnable: existing shots are kept.

    python scripts/snapshot.py            # only missing
    python scripts/snapshot.py --force
"""
import asyncio
import io
import json
import sys
from pathlib import Path

from PIL import Image
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "shared" / "shots"
SKIP = ("x.com/", "twitter.com/", "linktr.ee", "instagram.com", "facebook.com", "youtube.com/watch")
WALL = ("security verification", "just a moment", "attention required", "access denied", "verify you are human",
        "enable javascript and cookies", "checking your browser", "are you a robot", "captcha", "403 forbidden",
        "error 404", "404 not found", "page not found", "this site can't be reached", "domain for sale", "account suspended")
HIDE_JS = """
() => {
  const kill = /cookie|consent|gdpr|newsletter|popup|modal|overlay|banner/i;
  for (const el of document.querySelectorAll('div,section,aside,dialog')) {
    const cs = getComputedStyle(el);
    if ((cs.position === 'fixed' || cs.position === 'sticky') && (kill.test(el.id + ' ' + el.className) || el.getBoundingClientRect().height > innerHeight * 0.5)) {
      el.style.display = 'none';
    }
  }
  document.body.style.overflow = 'hidden';
}
"""


def want(e, info):
    if any(s in e["url"] for s in SKIP):
        return False
    if not info.get("img"):
        return True
    w, h = info.get("w") or 0, info.get("h") or 1
    return w < 400 or w / h < 1.15 or h < 250


async def grab(browser, sem, e, results):
    async with sem:
        ctx = await browser.new_context(viewport={"width": 1280, "height": 800}, locale="en-US")
        page = await ctx.new_page()
        try:
            await page.goto(e["url"], wait_until="domcontentloaded", timeout=20000)
            await page.wait_for_timeout(3500)
            try:
                await page.keyboard.press("Escape")  # close promo modals
                await page.evaluate(HIDE_JS)
            except Exception:  # noqa: BLE001
                pass
            probe = ((await page.title()) + " " + (await page.evaluate("document.body ? document.body.innerText.slice(0, 600) : ''"))).lower()
            if any(w in probe for w in WALL):
                results[e["id"]] = {"shot": None, "why": "bot-wall"}
                (OUT / f"{e['id']}.webp").unlink(missing_ok=True)
                print(e["id"], results[e["id"]], flush=True)
                return
            png = await page.screenshot(type="png", timeout=15000)
            im = Image.open(io.BytesIO(png)).convert("RGB")
            # reject near-blank pages (single colour)
            small = im.resize((32, 20))
            px = list(small.get_flattened_data()) if hasattr(small, "get_flattened_data") else list(small.getdata())
            spread = max(max(p[i] for p in px) - min(p[i] for p in px) for i in range(3))
            if spread < 24:
                results[e["id"]] = {"shot": None, "why": "blank"}
            else:
                im = im.resize((720, 450), Image.LANCZOS)
                im.save(OUT / f"{e['id']}.webp", "WEBP", quality=78)
                results[e["id"]] = {"shot": f"{e['id']}.webp"}
        except Exception as ex:  # noqa: BLE001
            results[e["id"]] = {"shot": None, "why": type(ex).__name__}
        finally:
            await ctx.close()
        print(e["id"], results[e["id"]], flush=True)


async def main():
    force = "--force" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    entries = json.loads((ROOT / "data/entries.json").read_text(encoding="utf-8"))
    images = json.loads((ROOT / "data/images.json").read_text(encoding="utf-8"))
    path = ROOT / "data/shots.json"
    old = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    todo = [e for e in entries if want(e, images.get(e["id"], {})) and (force or not old.get(e["id"], {}).get("shot"))]
    print(len(todo), "to snapshot", flush=True)
    results = dict(old)
    sem = asyncio.Semaphore(4)
    async with async_playwright() as p:
        browser = await p.firefox.launch()
        await asyncio.gather(*(grab(browser, sem, e, results) for e in todo))
        await browser.close()
    path.write_text(json.dumps(results, indent=1), encoding="utf-8")
    print("shots:", sum(1 for v in results.values() if v.get("shot")), "of", len(todo))


if __name__ == "__main__":
    asyncio.run(main())
