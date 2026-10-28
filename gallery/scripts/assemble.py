"""Assemble the deployable site into dist/ (used locally and by the GitHub Pages workflow).

Layout in the repo:  gallery/app/ (page)  +  gallery/shared/ (data, images, common.js)
Output:              dist/index.html ... dist/shared/...   with '../shared/' rewritten to 'shared/'.

SEO layer, generated from shared/data.js so it can never drift from the README:
  - a plain HTML list of every entry inside #rows (app.js replaces it on load; crawlers and no-JS readers keep it)
  - JSON-LD (WebSite + CollectionPage/ItemList) in <head>
  - sitemap.xml, robots.txt, llms.txt, 404.html
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
REPO = "https://github.com/itstomekk/awesome-bitcoin-culture"
RAW = "https://raw.githubusercontent.com/itstomekk/awesome-bitcoin-culture/master"
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


def llms_txt(data):
    """llms.txt (llmstxt.org): title, summary, key links, then one H2 per room/subsection listing every entry."""
    lines = [
        "# Awesome Bitcoin Culture", "",
        f"> {DESC[:-1]}. {len(data['entries'])} hand-picked entries, each linking to the creator's own page.", "",
        "The list covers work where Bitcoin is the subject or inspiration, made by a named creator, studio or "
        "collective. It excludes NFT/PFP collections, exchange marketing, meme coins and anonymous bulk AI output. "
        "The canonical source is the README on GitHub; this site and this file are generated from it on every change.", "",
        f"Last updated: {date.today().isoformat()}", "",
        "## About", "",
        f"- [Website]({SITE}): searchable gallery of every entry, with images",
        f"- [Source list]({REPO}/blob/master/README.md): the canonical Markdown list",
        f"- [Raw Markdown]({RAW}/README.md): the same list as plain Markdown",
        f"- [Inclusion criteria and suggestions]({REPO}/blob/master/CONTRIBUTING.md): how entries are chosen and how to suggest one",
        "- License: CC0 1.0 (public domain)", "",
    ]
    for room in data["rooms"]:
        sub = object()
        for en in (x for x in data["entries"] if x["room"] == room["id"]):
            if en["sub"] != sub:
                sub = en["sub"]
                lines += ["", f"## {room['label']}" + (f": {sub}" if sub else ""), ""]
            desc = " ".join(en["desc"].split())
            lines.append(f"- [{en['name']}]({en['url']})" + (f": {desc}" if desc else ""))
    return "\n".join(lines).replace("\n\n\n", "\n\n").strip() + "\n"


def entry_pages(data):
    """dist/a/<id>/index.html: one shareable URL per entry with its own title, description and og:image
    (shared/og/<id>.jpg from og_cards.py, else the site card). Link-preview bots read the tags; people are sent
    straight on to /#<id>, because '#' links alone can never carry their own preview."""
    e = html.escape
    for en in data["entries"]:
        url = f"{SITE}a/{en['id']}/"
        card = DIST / "shared" / "og" / (en["id"] + ".jpg")
        img = f"{SITE}shared/og/{en['id']}.jpg" if card.exists() else f"{SITE}og.jpg?v=2"
        where = data_room(data, en)
        title = f"{en['name']} - Awesome Bitcoin Culture"
        desc = " ".join(en["desc"].split()) or f"{en['name']} in {where} on Awesome Bitcoin Culture."
        dest = "/#" + en["id"]
        page = (
            '<!doctype html><html lang="en"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width, initial-scale=1">'
            f"<title>{e(title)}</title>"
            f'<meta name="description" content="{e(desc, quote=True)}">'
            f'<link rel="canonical" href="{url}"><link rel="icon" href="/favicon.svg">'
            '<meta property="og:type" content="website"><meta property="og:site_name" content="Awesome Bitcoin Culture">'
            f'<meta property="og:title" content="{e(en["name"], quote=True)}">'
            f'<meta property="og:description" content="{e(desc, quote=True)}">'
            f'<meta property="og:url" content="{url}">'
            f'<meta property="og:image" content="{img}">'
            '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
            f'<meta property="og:image:alt" content="{e(en["name"], quote=True)} on Awesome Bitcoin Culture">'
            '<meta name="twitter:card" content="summary_large_image">'
            f'<meta name="twitter:title" content="{e(en["name"], quote=True)}">'
            f'<meta name="twitter:description" content="{e(desc, quote=True)}">'
            f'<meta name="twitter:image" content="{img}">'
            f'<script>location.replace("{dest}"+(location.search||""));</script>'
            f'<noscript><meta http-equiv="refresh" content="0;url={dest}"></noscript>'
            '</head><body style="font-family:system-ui,sans-serif;max-width:36rem;margin:12vh auto;padding:0 1rem">'
            f'<p><a href="/">Awesome Bitcoin Culture</a> &rsaquo; {e(where)}</p>'
            f'<h1>{e(en["name"])}</h1><p>{e(desc)}</p>'
            f'<p><a href="{e(tagged(en["url"]), quote=True)}" rel="noopener">{e(en["host"] or en["url"])}</a></p>'
            f'<p><a href="{dest}">Open in the gallery</a></p></body></html>\n')
        d = DIST / "a" / en["id"]
        d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(page, encoding="utf-8")


def data_room(data, en):
    label = next((r["label"] for r in data["rooms"] if r["id"] == en["room"]), en["section"])
    return label + (f" / {en['sub']}" if en["sub"] else "")


def seo(data):
    entry_pages(data)
    p = DIST / "index.html"
    t = p.read_text(encoding="utf-8")
    assert '<div id="rows"></div>' in t, "index.html: #rows placeholder not found"
    t = t.replace('<div id="rows"></div>', '<div id="rows">' + static_list(data) + "</div>", 1)
    t = t.replace("</head>", json_ld(data) + "</head>", 1)
    p.write_text(t, encoding="utf-8")
    today = date.today().isoformat()
    (DIST / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"  <url><loc>{SITE}</loc><lastmod>{today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>\n"
        + "".join(f"  <url><loc>{SITE}a/{en['id']}/</loc><priority>0.6</priority></url>\n" for en in data["entries"])
        + "</urlset>\n",
        encoding="utf-8")
    (DIST / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE}sitemap.xml\n", encoding="utf-8")
    (DIST / "llms.txt").write_text(llms_txt(data), encoding="utf-8")
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
