"""Assemble the deployable site into dist/ (used locally and by the GitHub Pages workflow).

Layout in the repo:  gallery/app/ (page)  +  gallery/shared/ (data, images, common.js)
Output:              dist/index.html ... dist/shared/...   with '../shared/' rewritten to 'shared/'.

SEO layer, generated from shared/data.js so it can never drift from the README:
  - a plain HTML list of every entry inside #rows (app.js replaces it on load; crawlers and no-JS readers keep it)
  - JSON-LD (WebSite + CollectionPage/ItemList) in <head>
  - sitemap.xml, robots.txt, 404.html
"""
import html
import json
import re
import shutil
from datetime import date
from pathlib import Path

# Same rule as ABC.out (JS) in shared/common.js: tag outgoing links to an entry's own site.
REF = "utm_source=awesome-bitcoin-culture"
NOTAG = re.compile(r"^https?://([^/]+\.)?(x\.com|twitter\.com|instagram\.com|youtube\.com|youtu\.be|facebook\.com|tiktok\.com|linktr\.ee|primal\.net|t\.me)(/|$)", re.I)


def tagged(u):
    if not re.match(r"^https?://", u, re.I) or NOTAG.match(u) or re.search(r"[?&]utm_source=", u):
        return u
    base, sep, frag = u.partition("#")
    join = "?" if "?" not in base else ("" if base.endswith(("?", "&")) else "&")
    return base + join + REF + sep + frag

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
SITE = "https://awesomebitcoinculture.com/"
NPUB = "npub1vj4fdx2299g6mq7keqlpnwu52lvpwsslfna8efee66hguv9qcl0qe5ufj0"  # the list's Nostr account
DESC = ("A catalogue of human creative work about Bitcoin: art, film, literature, music, podcasts, "
        "games, institutions, events and memes.")


def load_data():
    t = (ROOT / "shared" / "data.js").read_text(encoding="utf-8")
    return json.loads(t[t.index("=") + 1:].strip().rstrip(";"))


def static_list(data):
    """Plain semantic HTML for crawlers and no-JS visitors; app.js overwrites #rows when it runs."""
    e = html.escape
    out = ['<div class="seo-static">']
    for room in data["rooms"]:
        out.append(f'<section><h2>{e(room["label"])}</h2><p>{e(room["blurb"])}</p>')
        sub, open_ul = None, False
        for en in (x for x in data["entries"] if x["room"] == room["id"]):
            if en["sub"] != sub:
                if open_ul:
                    out.append("</ul>")
                sub = en["sub"]
                if sub:
                    out.append(f"<h3>{e(sub)}</h3>")
                out.append("<ul>")
                open_ul = True
            out.append(f'<li><a href="{e(tagged(en["url"]), quote=True)}" rel="noopener">{e(en["name"])}</a> - {e(en["desc"])}</li>')
        if open_ul:
            out.append("</ul>")
        out.append("</section>")
    out.append("</div>")
    return "\n".join(out)


def json_ld(data):
    graph = [
        {"@type": "WebSite", "@id": SITE + "#site", "url": SITE, "name": "Awesome Bitcoin Culture",
         "description": DESC, "inLanguage": "en", "publisher": {"@id": SITE + "#org"}},
        {"@type": "Organization", "@id": SITE + "#org", "name": "Awesome Bitcoin Culture", "url": SITE,
         "logo": SITE + "nostr/avatar.png",
         "sameAs": ["https://github.com/itstomekk/awesome-bitcoin-culture", "https://njump.me/" + NPUB]},
        {"@type": "CollectionPage", "@id": SITE + "#list", "url": SITE, "name": "Awesome Bitcoin Culture",
         "description": DESC, "isPartOf": {"@id": SITE + "#site"},
         "mainEntity": {"@type": "ItemList", "numberOfItems": len(data["entries"]),
                        "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": en["name"], "url": en["url"]}
                                            for i, en in enumerate(data["entries"])]}},
    ]
    blob = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False).replace("</", "<\\/")
    return f'<script type="application/ld+json">{blob}</script>\n'


def seo(data):
    p = DIST / "index.html"
    t = p.read_text(encoding="utf-8")
    assert '<div id="rows"></div>' in t, "index.html: #rows placeholder not found"
    t = t.replace('<div id="rows"></div>', '<div id="rows">' + static_list(data) + "</div>", 1)
    t = t.replace("</head>", json_ld(data) + "</head>", 1)
    p.write_text(t, encoding="utf-8")
    today = date.today().isoformat()
    (DIST / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"  <url><loc>{SITE}</loc><lastmod>{today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>\n</urlset>\n",
        encoding="utf-8")
    (DIST / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE}sitemap.xml\n", encoding="utf-8")
    (DIST / "404.html").write_text(
        '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        '<meta name="robots" content="noindex"><title>Not found - Awesome Bitcoin Culture</title><link rel="icon" href="/favicon.svg">'
        '</head><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1rem">'
        '<h1>Page not found</h1><p><a href="/">Awesome Bitcoin Culture</a> - '
        "art, film, books, music, podcasts and games about Bitcoin.</p></body></html>\n", encoding="utf-8")


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    shutil.copytree(ROOT / "app", DIST)
    shutil.copytree(ROOT / "shared", DIST / "shared")
    (DIST / ".nojekyll").write_text("", encoding="utf-8")
    n = 0
    for f in DIST.rglob("*"):
        if f.suffix in (".html", ".js", ".css") and f.is_file():
            t = f.read_text(encoding="utf-8")
            if "../shared/" in t:
                f.write_text(t.replace("../shared/", "shared/"), encoding="utf-8")
                n += 1
    seo(load_data())
    size = sum(f.stat().st_size for f in DIST.rglob("*") if f.is_file()) / 1e6
    print(f"dist/ ready: {n} files rewritten, {size:.1f} MB, SEO layer added")


if __name__ == "__main__":
    main()
