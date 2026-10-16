# Gallery

A browsable web gallery generated from this repository's `README.md`: every entry becomes a banner with its
artwork or a snapshot of its site, grouped into rooms, with a light and a dark mode.

The site mirrors the README 1:1: one room per `##` section, one heading per `###`/`####` subsection, one banner per entry. `python scripts/check_parity.py` fails if an entry, room or subsection drifts; the Pages workflow runs it before publishing.

Live: https://itstomekk.github.io/awesome-bitcoin-culture/

The README is the only source of truth. The gallery never edits it.

## How it updates

On every push that touches `README.md` or `gallery/`, the GitHub Actions workflow
(`.github/workflows/pages.yml`) re-parses the README, rebuilds `shared/data.js` and publishes the site.
A new entry appears immediately with a generated tile. To give it a picture, run locally:

```
cd gallery
python scripts/build.py              # parse README, fetch images for NEW entries only, rewrite shared/data.js
python scripts/snapshot.py           # website snapshots for entries without a usable image (needs Playwright + Firefox)
python scripts/build.py --no-fetch   # fold the snapshots into shared/data.js
python scripts/check_parity.py       # site must match the README 1:1
python scripts/assemble.py           # optional: build dist/ locally
```

then commit `gallery/shared` and `gallery/data`.

## Layout

- `app/` the page (index.html, style.css, app.js, lum.js)
- `shared/` generated data (`data.js`), helpers (`common.js`), `img/` (og images) and `shots/` (site snapshots)
- `scripts/` parser, image fetcher, snapshotter, site assembler
- `data/` intermediate JSON

Pictures come from each project's own page metadata or homepage. If you are an owner and want yours removed,
open an issue and it will be taken out.
