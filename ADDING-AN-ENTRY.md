# Adding an entry

Run everything from `gallery/`. The README is the source of truth; `data/entries.json` is generated from it.

1. **README:** add the line under the right section (`README.md`).
2. **Parse and build:** `python scripts/parse_readme.py`, then `python scripts/build.py` (fetches the main picture into `shared/img/<id>.webp`; use `--no-fetch` to skip).
3. **Socials (public links only):** add `id -> {x, nostr, instagram, youtube}` URLs to `data/socials.json`.
4. **Works strip:** `C:/Python314/python.exe scripts/harvest_works.py <scratch> <id>`, pick pictures by eye from the numbered `sheet.jpg`, then `python scripts/add_works.py <scratch> ...` and `python scripts/lum_works.py`.
5. **Private contact:** only what the creator published themselves goes into `C:\Users\Lenovo\.secrets\awesome-bitcoin-culture\contacts.csv` and `reach.csv`. Never in the repo.
6. **Check:** `python scripts/check_parity.py` (must say OK), then `python scripts/assemble.py`.
7. **Share card:** `C:/Python314/python.exe scripts/og_cards.py <id>` (always pass ids: it deletes cards of parked entries; restore with `git checkout`). Commit the card. Bump `?v=` in `assemble.py` only if the design changed.
8. **Look at it:** open the built `dist/` in Firefox, check the row, the panel, `/a/<id>/` and the card.
9. **Deploy:** push `master` only when Tomek says so. The nsite is a separate step (see `HANDOFF.md`).
