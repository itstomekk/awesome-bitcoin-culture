"""Render the Bitcoin white paper page (English) -> gallery/app/bitcoin-whitepaper/index.html.

Source text: data/whitepaper-en.json (structured copy of the paper; wording is not edited).
Figures: app/bitcoin-whitepaper/fig/*.png (crops of the PDF pages). PDF: app/bitcoin.pdf (served at /bitcoin.pdf).
Styles: app/whitepaper.css on top of app/style.css tokens. Run `python scripts/whitepaper_page.py` after editing; the
output is committed, so the Pages workflow needs no extra step.
"""
import html
import json
import re
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "app" / "bitcoin-whitepaper"
SITE = "https://awesomebitcoinculture.com"
PAGE_URL = SITE + "/bitcoin-whitepaper/"
SHA = "b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553"
SIZE = "180 KB"
OG = SITE + "/bitcoin-whitepaper/whitepaper-18-abc-og.jpg"
TITLE = "Bitcoin: A Peer-to-Peer Electronic Cash System"
DESC = ("The Bitcoin white paper by Satoshi Nakamoto, published 31 October 2008: full text with figures, equations "
        "and references, plus the original PDF.")
PL_URL = "https://dwadziesciajeden.pl/bitcoin-whitepaper/"
FIG_SCALE = 1.7  # PNGs are cropped at 2.5x; shown at about 1.5 CSS px per PDF point

e = html.escape

FIG_ALT = {
    "transactions": "Diagram of a chain of transactions. Each owner signs with their private key the hash of the previous transaction together with the next owner's public key. The signature is verified with the previous owner's public key.",
    "timestamp": "A chain of timestamps. The hash of a block of items is published, and each block contains the hash of the previous one.",
    "pow": "Two blocks linked in a chain. Each block holds the previous block's hash, a nonce and transactions.",
    "merkle": "On the left, transactions Tx0 to Tx3 hashed in a Merkle tree, with the root in the block header. On the right, the same tree after pruning Tx0 to Tx2: only the hashes needed for Tx3 remain.",
    "spv": "The longest proof-of-work chain: three block headers with the previous hash, nonce and Merkle root. A Merkle branch links transaction Tx3 to the root of one block.",
    "split": "A transaction with several inputs and outputs.",
    "privacy": "Two privacy models. In the traditional one, identities, transactions, a trusted third party and the counterparty are kept apart from the public. In the new one the public sees the transactions, but not the identities.",
}


# ------------------------------------------------------------------ equations (MathML)
def _frac(a, b):
    return f"<mfrac><mi>{a}</mi><mi>{b}</mi></mfrac>"


QP = f"<mrow><mo>(</mo>{_frac('q', 'p')}<mo>)</mo></mrow>"
QPZK = f"<msup>{QP}<mrow><mi>z</mi><mo>&#8722;</mo><mi>k</mi></mrow></msup>"
POIS = ("<mfrac><mrow><msup><mi>&#955;</mi><mi>k</mi></msup><msup><mi>e</mi><mrow><mo>&#8722;</mo><mi>&#955;</mi></mrow></msup></mrow>"
        "<mrow><mi>k</mi><mo>!</mo></mrow></mfrac>")
EQ = {
    "q": ("q_z = 1 if p ≤ q; (q/p)^z if p > q",
          "<msub><mi>q</mi><mi>z</mi></msub><mo>=</mo><mrow><mo>{</mo><mtable columnalign=\"left left\">"
          "<mtr><mtd><mn>1</mn></mtd><mtd><mtext>if&#160;</mtext><mi>p</mi><mo>&#8804;</mo><mi>q</mi></mtd></mtr>"
          f"<mtr><mtd><msup>{QP}<mi>z</mi></msup></mtd><mtd><mtext>if&#160;</mtext><mi>p</mi><mo>&gt;</mo><mi>q</mi></mtd></mtr>"
          "</mtable></mrow>"),
    "lambda": ("lambda = z q/p", f"<mi>&#955;</mi><mo>=</mo><mi>z</mi>{_frac('q', 'p')}"),
    "sum": ("sum for k from 0 to infinity of (lambda^k e^-lambda / k!) times (q/p)^(z-k) if k <= z, 1 if k > z",
            "<munderover><mo>&#8721;</mo><mrow><mi>k</mi><mo>=</mo><mn>0</mn></mrow><mi>&#8734;</mi></munderover>"
            f"{POIS}<mo>&#8901;</mo><mrow><mo>{{</mo><mtable columnalign=\"left left\">"
            f"<mtr><mtd>{QPZK}</mtd><mtd><mtext>if&#160;</mtext><mi>k</mi><mo>&#8804;</mo><mi>z</mi></mtd></mtr>"
            "<mtr><mtd><mn>1</mn></mtd><mtd><mtext>if&#160;</mtext><mi>k</mi><mo>&gt;</mo><mi>z</mi></mtd></mtr>"
            "</mtable></mrow>"),
    "tail": ("1 - sum for k from 0 to z of (lambda^k e^-lambda / k!) times (1 - (q/p)^(z-k))",
             "<mn>1</mn><mo>&#8722;</mo><munderover><mo>&#8721;</mo><mrow><mi>k</mi><mo>=</mo><mn>0</mn></mrow><mi>z</mi></munderover>"
             f"{POIS}<mrow><mo>(</mo><mn>1</mn><mo>&#8722;</mo>{QPZK}<mo>)</mo></mrow>"),
}


def eq_html(eid):
    alt, body = EQ[eid]
    return f'<div class="wp-eq"><math display="block" alttext="{e(alt)}">{body}</math></div>'


# ------------------------------------------------------------------ text
def inline(text):
    s = e(text)
    s = re.sub("\U0001d467(?=[A-Za-z\u0104-\u017c])", "<var>z</var> ", s)
    s = s.replace("\U0001d467", "<var>z</var>")
    s = re.sub(r"\[(\d+)(?:-(\d+))?\]", lambda m: f'<a class="wp-cite" href="#ref-{m.group(1)}">{m.group(0)}</a>', s)
    return s


def url_links(text):
    s = e(text)
    return re.sub(r"(https?://[^\s,]+)", lambda m: f'<a href="{m.group(1)}" rel="noopener">{m.group(1)}</a>', s)


def defs_html(lines):
    out = []
    for ln in lines:
        left, _, right = ln.partition(" = ")
        name = {"p": "<var>p</var>", "q": "<var>q</var>", "qz": "<var>q</var><sub><var>z</var></sub>"}[left.strip()]
        out.append(f"<dt>{name}</dt><dd>{inline(right)}</dd>")
    return '<dl class="wp-defs">' + "".join(out) + "</dl>"


def png_size(path):
    with open(path, "rb") as f:
        h = f.read(24)
    return struct.unpack(">II", h[16:24])


def figure_html(name):
    w, h = png_size(OUT / "fig" / f"{name}.png")
    return (f'<figure class="wp-fig"><img src="/bitcoin-whitepaper/fig/{name}.png" width="{round(w / FIG_SCALE)}" '
            f'height="{round(h / FIG_SCALE)}" alt="{e(FIG_ALT[name])}" loading="lazy"></figure>')


def sec_id(n):
    return f"section-{n}"


def toc_html(d):
    items = "".join(f'<a href="#{sec_id(s["n"])}"><i>{s["n"]:02d}</i><span>{e(s["title"])}</span></a>' for s in d["sections"])
    items += '<a href="#references"><i>Ref</i><span>References</span></a>'
    return f'<nav class="wp-toc" aria-label="Contents">{items}</nav>'


def paper_html(d):
    ab = d["abstract"]
    assert ab.startswith("Abstract."), ab[:20]
    out = [f'<p class="wp-abstract"><strong>Abstract.</strong>{inline(ab[len("Abstract."):])}</p>']
    for s in d["sections"]:
        out.append(f'<section class="wp-sec" id="{sec_id(s["n"])}"><h3><i>{s["n"]:02d}</i>{e(s["title"])}</h3>')
        for blk in s["blocks"]:
            k = blk["type"]
            if k == "p":
                out.append(f"<p>{inline(blk['text'])}</p>")
            elif k == "list":
                out.append('<ol class="wp-steps">' + "".join(
                    f"<li>{inline(re.sub(r'^\d\) ', '', x))}</li>" for x in blk["items"]) + "</ol>")
            elif k == "fig":
                out.append(figure_html(blk["id"]))
            elif k == "eq":
                out.append(eq_html(blk["id"]))
            elif k == "defs":
                out.append(defs_html(blk["lines"]))
            elif k == "pre":
                out.append(f'<pre class="wp-pre" tabindex="0"><code>{e(blk["text"])}</code></pre>')
        out.append("</section>")
    refs = []
    for r in d["references"]:
        m = re.match(r"^\[(\d+)\]\s*(.*)$", r)
        refs.append(f'<li id="ref-{m.group(1)}"><span class="wp-ref-n">[{m.group(1)}]</span> {url_links(m.group(2))}</li>')
    out.append(f'<section class="wp-sec" id="references"><h3><i>Ref</i>References</h3><ol class="wp-refs">{"".join(refs)}</ol></section>')
    return '<div class="wp-paper">' + "".join(out) + "</div>"


GH = ('<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 '
      '7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 '
      '1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 '
      '0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 '
      '2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>')

THEME_BTN = ('<button type="button" id="theme" class="theme" aria-pressed="true" title="Switch theme"><span class="sr">Dark mode</span>'
             '<span class="lt" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="4.5"/>'
             '<path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" '
             'style="fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"/></svg></span>'
             '<span class="dk" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1z"/></svg></span></button>')


def page(d):
    ld = {"@context": "https://schema.org", "@type": "ScholarlyArticle", "headline": TITLE, "url": PAGE_URL,
          "inLanguage": "en", "datePublished": "2008-10-31", "image": OG, "description": DESC,
          "author": {"@type": "Person", "name": "Satoshi Nakamoto"},
          "isPartOf": {"@type": "WebSite", "name": "Awesome Bitcoin Culture", "url": SITE + "/"},
          "encoding": {"@type": "MediaObject", "contentUrl": SITE + "/bitcoin.pdf", "encodingFormat": "application/pdf",
                       "sha256": SHA}}
    ld_s = json.dumps(ld, ensure_ascii=False).replace("</", "<\\/")
    return f'''<!doctype html>
<html lang="en" data-theme="dark" data-bar="art">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Bitcoin white paper - Awesome Bitcoin Culture</title>
<meta name="description" content="{e(DESC, quote=True)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="canonical" href="{PAGE_URL}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Awesome Bitcoin Culture">
<meta property="og:title" content="{e(TITLE, quote=True)}">
<meta property="og:description" content="{e(DESC, quote=True)}">
<meta property="og:url" content="{PAGE_URL}">
<meta property="og:image" content="{OG}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The Bitcoin white paper turns 18: 31 October 2008 to 31 October 2026">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(TITLE, quote=True)}">
<meta name="twitter:description" content="{e(DESC, quote=True)}">
<meta name="twitter:image" content="{OG}">
<meta name="twitter:image:alt" content="The Bitcoin white paper turns 18: 31 October 2008 to 31 October 2026">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#f7931a">
<script>
/* theme before first paint: saved choice, else dark (same key as the gallery) */
(function () {{
  var t = null;
  try {{ t = localStorage.getItem("abc-theme"); }} catch (e) {{}}
  if (t !== "light" && t !== "dark") t = "dark";
  document.documentElement.setAttribute("data-theme", t);
}})();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
<link rel="stylesheet" href="/whitepaper.css">
<script type="application/ld+json">{ld_s}</script>
</head>
<body class="wp">
<a class="skip" href="#paper">Skip to the paper</a>

<header class="top" id="top">
  <p class="mark"><a href="/" aria-label="Awesome Bitcoin Culture, home"><span><span class="ini">A</span>wesome <span class="ini btc">B</span>itcoin <span class="ini">C</span>ulture</span></a></p>
  <a class="wpnav" href="/">All entries</a>
  <a class="wpnav" href="/bitcoin.pdf">PDF</a>
  <a class="src" href="https://github.com/itstomekk/awesome-bitcoin-culture" target="_blank" rel="noopener" aria-label="Source list on GitHub (opens in a new tab)">{GH}</a>
  {THEME_BTN}
</header>

<main id="main">
  <section class="wp-hero">
    <p class="wp-kicker">Bitcoin white paper &middot; 18 years &middot; <span class="nw">31 October 2008</span></p>
    <h1>{e(d["title"])}</h1>
    <p class="wp-byline">{e(d["author"])} &middot; {e(d["email"])} &middot; <a href="https://{e(d["site"])}" rel="noopener">{e(d["site"])}</a></p>
    <p class="wp-lede">On 31 October 2008 an unknown author, Satoshi Nakamoto, sent nine pages to a cryptography mailing list. They described money that moves between people without a bank in the middle. Eighteen years later the paper is still the clearest account of why Bitcoin works, and the starting point for the art, films, books and music in this list.</p>
    <a class="wp-dl" href="/bitcoin.pdf" download>
      <span class="wp-dl__t">Download the original PDF</span>
      <span class="wp-dl__m">bitcoin.pdf &middot; {SIZE} &middot; 9 pages &middot; unmodified</span>
      <span class="wp-dl__h" title="SHA-256">sha256 <code>{SHA[:16]}&hellip;{SHA[-8:]}</code></span>
    </a>
  </section>

  <div class="wp-wrap">
    <h2 class="wp-h">Contents</h2>
    {toc_html(d)}
    <article id="paper" class="wp-article" lang="en">
      {paper_html(d)}
    </article>
    <aside class="wp-note">
      <p class="wp-note__thanks">Thank you, Satoshi Nakamoto, for Bitcoin and for the nine pages that described it.</p>
      <p>Original PDF: <a href="/bitcoin.pdf">bitcoin.pdf</a>, {SIZE}, unmodified, SHA-256 <code>{SHA}</code>.</p>
      <p>Polish reading version: <a href="{PL_URL}" rel="noopener">{PL_URL.replace("https://", "")}</a> (translation by meeDamian).</p>
    </aside>
  </div>

  <footer class="foot">
    <span>Source: <a href="https://github.com/itstomekk/awesome-bitcoin-culture" target="_blank" rel="noopener">{GH}<span>github.com/itstomekk/awesome-bitcoin-culture</span></a></span>
    <span><a href="/">Awesome Bitcoin Culture</a></span>
  </footer>
</main>

<script>
(function () {{
  var root = document.documentElement, btn = document.getElementById("theme");
  btn.setAttribute("aria-pressed", String(root.getAttribute("data-theme") === "dark"));
  btn.addEventListener("click", function () {{
    var t = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", t);
    btn.setAttribute("aria-pressed", String(t === "dark"));
    try {{ localStorage.setItem("abc-theme", t); }} catch (e) {{}}
  }});
}})();
</script>
<script data-goatcounter="https://awesomebtcculture.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</body>
</html>
'''


def main():
    d = json.loads((ROOT / "data" / "whitepaper-en.json").read_text(encoding="utf-8"))
    (OUT / "index.html").write_text(page(d), encoding="utf-8", newline="\n")
    print("wrote", OUT / "index.html")


if __name__ == "__main__":
    main()
