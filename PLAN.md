# PLAN — awesome-bitcoin-culture

**Program:** `bitcoin-filmfest` (BFF-adjacent, standalone repo — see PORTFOLIO.md)
**Goal:** A GitHub "awesome list" cataloging human creative work about Bitcoin — film, visual art,
sculpture, literature, music, events — distinct from the many `awesome-bitcoin` dev/tool lists.
Gives BFF and Tomek's other projects a natural place to be cited from, self-maintained.

## Phases

### Phase 1 — Scaffold (done this session)
- Local project folder + git repo initialized.
- README.md: manifesto, inclusion criteria, category structure, seeded with all entries found
  in the 2026-09-21 research pass (handoff doc).
- CONTRIBUTING.md, LICENSE (CC0, matching sindresorhus convention).
- Public GitHub repo at `itstomekk/awesome-bitcoin-culture` (visibility verified 2026-09-30).

### Phase 2 — Gap-filling (ongoing)
- [x] Recheck the current Timechain Art Magazine artist directory and BFF 2025-2026 program for missing creative work.
- [x] Add four verified candidates: Tynka (illustration), Frédéric Guimont / *Ratel* (comics), Aaron Koenig (*Laser Eyes*), and Roger9000 (Bitcoin-focused music). Each has a first-party work page and a gallery image.
- [x] Repair/verify link exceptions: Psyfer points to the live Timechain artist page; Bitcoiners points to its live official film page; Street Cyber's README link is its live artist profile on X. The old Street Cyber domain currently returns 503.
- [x] BFF film decision: Hotel Bitcoin is sufficient; do not add *Revolución Bitcoin*.
- [x] Fiction and prior user-approved additions are published on public master; current gallery parity passes.
- `awesome-lint` is an optional Markdown style checker, not a content-quality test. Current run: 60 errors and 5 warnings, unchanged from the prior baseline. Do not add it as a CI gate or bulk-rewrite the curated README unless Tomek asks.
- Keep other leads out until a qualifying work page is verified and the project meets the inclusion criteria.

### Phase 3 — Review & sign-off
- [x] Tomek confirmed the manifesto/criteria and category review was already done.
- [x] Events link out to `awesome-bitcoin-events` rather than duplicating.
- [x] Memes & Internet Culture retains its agreed relaxed attribution rule.

### Phase 4 — Launch
- [x] Repository is public at `itstomekk/awesome-bitcoin-culture`; master has been published.
- Optional: add cross-links from `awesome-bitcoin-events` and the BFF site; submit to meta-indexes only if desired.

### Phase 5 — Maintenance (ongoing)
- GitHub issue form for community suggestions is implemented at `.github/ISSUE_TEMPLATE/suggest-entry.yml` and linked from `CONTRIBUTING.md`.
- Periodic top-up from BFF network as new artists/films/music surface.

### Phase 6: Creator outreach (planned 2026-10-28, not started)
Goal: start a lasting conversation with the listed creators, not a one-off campaign.
1. **Social posts first.** Post about the list and about featured entries (tagging creators) on Tomek's socials before any email goes out, so the email lands on something they may already have seen.
2. **Then email, pilot first.** Pilot of ~10 creators, then a few a day (small batches, never everyone at once). Review the results after each batch and improve the message before the next.
3. Sender: tomek@bitcoinfilmfest.com. Every batch starts as Gmail drafts and goes out only after Tomek's yes.
4. Corrections come from email replies and the site's suggest form. Replies become ongoing conversations, logged per person.
5. Contacts are only those creators published themselves. Contact data stays private and outside this repo.

Detailed plan (outside the repo): `C:\Users\Lenovo\Hermes\.hermes\plans\2026-10-28_120000-abc-artist-outreach.md`.

## Status
Phase 1 and launch are complete. Phase 2 remains ongoing as maintenance, not a blocker: the public README generates 300 gallery entries in 8 rooms, and `gallery/scripts/check_parity.py` passes. Four verified entries and image assets were added in the current local change. The requested link audit and BFF checks are complete. Phase 3 review is complete. Awesome-lint findings are informational; no CI gate is adopted. Do not push the current local changes until Tomek explicitly asks.
