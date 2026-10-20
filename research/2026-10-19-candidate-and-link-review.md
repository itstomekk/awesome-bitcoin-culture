# Candidate and link review — 2026-10-19

## Method

Re-enumerated the current Timechain Art Magazine artist directory and reviewed Bitcoin FilmFest 2025-2026 pages and first-party work pages. Candidate URLs were fetched with a browser-like GET and their page text was read before inclusion. The README remains canonical; the gallery was rebuilt from it.

## Added to the README

- **Tynka** — [official portfolio](https://bitcoinillustration.com/). The page describes “At the Market” as buying fresh produce with Lightning; its artwork visibly depicts the Bitcoin payment. Gallery image: the official “Bitcoin Market” illustration.
- **Frédéric Guimont / Ratel** — [official samples](https://ratelcomic.com/samples.html) show sequential-art pages; [About](https://ratelcomic.com/about.html) identifies Guimont and describes a Bitcoin-powered superhero story. Its progress page says penciling, inking, and coloring are in progress. Gallery image: a sample page from the official samples page.
- **Aaron Koenig** — [official *Laser Eyes* album page](https://aaron-koenig.net/albums/laser-eyes/) says it consists of 13 original songs about Bitcoin and liberty and enumerates the tracks. Gallery image: the album cover on the official page.
- **Roger9000** — [official EPK](https://www.roger9000.com/roger9000-epk) describes Bitcoin, Satoshi, and timechain themes; the page links his music videos. His official videos include “Satoshi Set Me Free” and “Ode to Satoshi.” Gallery image: the official video thumbnail for “Satoshi Set Me Free.”

All four entries have local gallery images and metadata. The generated gallery has 300 entries in 8 rooms; parity passes.

## Link checks

- [Bitcoiners official film page](https://bitcoinersmovie.com/product/bitcoiners-movie/) returns HTTP 200; README now uses this work-specific page instead of the generic homepage.
- [Psyfer's current Timechain profile](https://timechainartmagazine.com/artist/psyfer/) returns HTTP 200; the old `psyferpunkart.com/about` returns 404 and is no longer the README link.
- The existing [Street Cyber X profile](https://x.com/streetcyber_art) returns HTTP 200. The former website `https://www.streetcyber.art/` returns 503; it is not used in the README.

## Checked but not added

- **Longy** — event/streaming profiles were discoverable, but the sources checked did not establish a Bitcoin-themed creative work suitable for this list.
- **DOT Dominus** — evidence found was a festival performance listing, not a Bitcoin-focused body of creative work.
- **AgiChoote and Shadrah** — the BFF program identifies the artists, but no qualifying first-party work page was established in this pass.
- **Revolución Bitcoin** — not added; Tomek confirmed Hotel Bitcoin is sufficient.

These are dispositions for this scan, not a rejection of future primary-source evidence.

## awesome-lint, in plain terms

`awesome-lint` checks whether a Markdown README follows common Awesome-list conventions. It checks mechanical form (for example, table-of-contents anchors, list link/description separators, repeated URLs, and Markdown references). It does not check whether an entry is genuinely Bitcoin culture, whether its source is trustworthy, or whether it belongs in this list. The current run produced 60 errors and 5 warnings, the same totals as the earlier baseline. No CI gate or bulk-format rewrite was applied.
