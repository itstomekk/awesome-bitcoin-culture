# HANDOFF — awesome-bitcoin-culture

**Last updated:** 2026-10-12.

## State right now

- Local project folder: `Projects\Awesome Bitcoin Culture` — git repo initialized.
- GitHub repo: `itstomekk/awesome-bitcoin-culture`, **public** (verified against GitHub on 2026-09-30), branch `master`.
  https://github.com/itstomekk/awesome-bitcoin-culture
- Files: `README.md` (manifesto + criteria + all categories seeded from the research handoff),
  `CONTRIBUTING.md`, `LICENSE` (CC0 1.0), `PLAN.md`.
- Community submissions can use `.github/ISSUE_TEMPLATE/suggest-entry.yml`; the form asks for the actual work link, creator, category, fit rationale, and supporting sources. `CONTRIBUTING.md` links to it.
- The issue-form and documentation changes are local and uncommitted; they have not been pushed to GitHub.
- Local README additions not yet committed/published: StackChain Magazine, Proof of Work, and Bitcoin Shipshow in Publications & Media. The three official source pages were checked; Shipshow is described as a monthly online live-demo show with published episodes.
- 2026-10-15: Games section rebuilt and pushed (commit `286edd3`): 38 games Tomek approved in the Bitcoin Games review were added, and the section was split into Video Games / Board & Card Games / Digital Board & Card Games / Wagering & Casino (Tomek chose a separate casino subsection). Source of truth for game research: Google Sheet "Bitcoin District: Bitcoin Games research" (column "In Awesome Bitcoin Culture?"), project `C:\Users\Lenovo\Hermes\projects\research\bitcoin-games`. Games Tomek marked Skip must not be added here.
- `PORTFOLIO.md` updated with a `bff-awesome-culture` row under program `bitcoin-filmfest`.

## Decisions Tomek made this session

1. The repo was originally planned to stay private until the README had enough content; GitHub currently reports it public. Treat the public launch as already done, not as a pending action.
2. **Events** section links out to `awesome-bitcoin-events` rather than duplicating. Paid
   discussion-group products (e.g. Bitcoin Book Club) are **excluded**.
3. **Memes & Internet Culture** gets its own section with a relaxed, no-named-creator-required
   rule — separate from the strict attribution rule everywhere else.

## What's seeded vs. what's thin

Strong: Visual Art (Artists + Institutions), Film & Documentary, Sculpture, Publications.
Thin, flagged in README: Literature (3 entries; added *The Genesis Code: Block One* and *South of Market* on 2026-10-12), Music (3 entries), Memes (placeholder only, no
real entries yet — needs research).

## Next steps (Phase 2, see PLAN.md)

1. Review link-audit exceptions. A sweep of 120 unique README URLs flagged several HTTP errors, but some were false positives from HEAD requests or anti-bot blocks. The Psyfer `/about` URL returned 404; find a work-bearing replacement before editing it.
2. Ask Tomek to personally vouch for researched candidates before adding them. BFF25 sources surfaced *Hotel Bitcoin* and *Revolución Bitcoin*; the latter is available as a full YouTube film. Research does not itself satisfy the list's personal-vouch criterion.
3. `npx --yes awesome-lint README.md` currently reports 145 findings (including repeated links, separator style, ToC anchors, and list-format expectations). Decide whether strict compatibility is a project goal before attempting broad edits or adding a CI gate.
4. Continue gap-filling for literature, music, and memes, and rerun link checks using GET-aware handling to distinguish dead URLs from bot-blocked sites.
5. Review public launch and cross-links; the repository is already public.

## Update 2026-10-16 (structure + import)

- Restored from the unmerged branch `add-missing-bitcoin-artists`: Fzero, Zazawowow, Ivy Lumi, Tynka. Ninefold stays out (agency, not creative work; Ivy Lumi and Fzero co-founded it).
- Imported the 25 artists of the Timechain Art Magazine directory (82 profiles on 2026-10-16) that were missing from the README. Held back: Shamshad (mainly Bible-text art, Bitcoin whitepaper is a one-off). Zazawowow.co.uk and buridanova.com failed TLS from this machine; links kept, verify from another network.
- Removed the "BFTA partners & collaborators" subsection.
- Structure now: Visual Art (Collectives, Painters, Digital & Graphic, Mixed Media, Sculpture, Studio) / Film / Literature / Music / Games / Institutions & Spaces (Galleries & Museums, Grants, Publications & Media, Platforms & Marketplaces) / Events / Memes. Bitcoin Magazine and Bitcoin Magazine - Culture merged. Memes now also holds Bitcoin Cartoons, MrHansel, Pepelangelo, Pepenardo.
- The gallery is 1:1 with the README (8 rooms, subsection headings); the old "Media" and "Scene" rooms were a builder invention and are gone. `gallery/scripts/check_parity.py` guards it. The gallery in this repo is now the source: do not run `export_to_repo.py` from `Hermes/projects/websites/abc-gallery` again, it would overwrite this version.
- Dropped earlier for lack of own links, still unrestored: Sarah Foster, Andy Risquez (elRAiSE), Juliette Garzón (Juls), Anik Todd. Cut during trimming: Longy, The Higher Low, Roger 9000, early films (The Bitcoin Experiment, The Blockchain and Us, Banking on Bitcoin, The Bitcoin Gospel, Magic Money), Hummingbird, Bitcoin Shooter.
- Local commits only; nothing pushed.

## Gallery pictures (2026-10-16)
- Every one of the 205 entries now has a picture except Bitcoin the Card Game (generated tile; its listing pages have no image). 193 use a real graphic: 177 wide images (artist artwork, product/cover/poster, game art, film stills), 3 square X avatars (HACKZERO, Moozi, Shipwreck Sean), the rest are site snapshots.
- Method: harvested candidates per entry (page images, Timechain Art Magazine artist pages, iTunes/Steam/YouTube/Wikipedia/GitHub-README sources), rejected blank, cookie, login, error and logo-only frames, picked by eye on contact sheets, then composed to 720px-wide webp (tall/square art gets a blurred backdrop). Picked images are flagged `manual` in `gallery/data/images.json`, so `fetch_images.py` will not overwrite them.
- Dead links found while harvesting: Cyber / Street Cyber (streetcyber.art, "website has expired"), Psyfer (psyferpunkart.com/about, domain not connected), Bitcoiners (video unavailable on the linked page). They show a snapshot of the error page; replace or drop the entries.
- Images come from each project's own pages; owners can ask for removal (see gallery/README.md). Check permissions before any promotion beyond the list.

## Update 2026-10-17

- Added user-requested entries to `README.md`: `$BLEEP` and `Bitcoin & Friends` under Film & Documentary; Zaza under Visual Art. Used their own project pages (`9fold.co/worlds/bleep`, `btcandfriends.com`, and `9fold.co/worlds/zaza`).
- Rebuilt the gallery from the README. It now has 238 entries; `$BLEEP` and Zaza have page images, while Bitcoin & Friends has no fetched image yet. Parity check passes.
- Changes are local and uncommitted; the existing unrelated `PLAN.md` edit was left untouched.


## Update 2026-10-19 (BFTA gap scan)

- Scanned bitcoinforthearts.org (artists, stories, awards, programming) against the README. Added: The Bitcoin Executor (Film), Matt Finlay (Music), Hitomi Matsui (Mixed Media), Beth Alta Fletcher (Digital), Machakos Bitcoin Academy: Visima 21 (Collectives, in progress), Share Your Bitcoin Journey (Podcasts > Stories & People), Benjamin Ella in a new "Dance & Performing Arts" section. BFTA entry now names Bitcoin Arts Park at the Midwest Bitcoin Summit.
- Dance entry first got its own section, then merged with Music into "Music & Performing Arts" (subsections Music / Dance & Stage), so the gallery keeps 8 rooms.
- Not added: Art + Zap Weekend (date unconfirmed, venue is a bar; belongs in awesome-bitcoin-events if it happened). Benjamin Ella and Beth Alta Fletcher link to Instagram (no own site) and use generated tiles; Matt Finlay too (Bandcamp snapshot was a cookie wall).
- Local, uncommitted.
