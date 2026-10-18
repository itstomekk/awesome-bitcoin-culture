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


## Update 2026-10-17 (quick structure fixes)

- Moved Kontext (Music) and Jimmy Song (Publications & Media) to Literature; Bitcoin Shipshow to Events & Festivals (intro now says "A few exceptions"); 2140Art from the one-entry Collectives subsection to Publications & Media.
- Folded Bitchair and Bitcoin Trading Cards (Other / Studio & Sidework) into Mixed Media & Other Artists, and the two Narrative Series podcasts into Stories & People. Removed the empty Collectives, Other / Studio & Sidework and Narrative Series headings and their ToC lines.
- Fzero now mentions $BLEEP (Zaza already mentioned his films).
- Gallery rebuilt: 238 entries, parity check passes. Not pushed.
- Still open: the bigger Visual Art regrouping (Painting & Muralism / Digital & Illustration / Comics / Sculpture & Objects / Mixed Media & Craft / Design & Merch) and Moving Image / Sound / Words grouping, awaiting Tomek's go.

## Update 2026-10-17 (Visual Art regrouping)

- Jimmy Song removed (Tomek's call). 237 entries now.
- Visual Art subsections replaced: Painting, Drawing & Street Art (31) / Illustration & Digital Art (16) / Comics & Picture Books (3) / Sculpture & Objects (12) / Mixed Media & Craft (21) / Design & Merch (9) / Memes & Internet Culture (5, unchanged). Every entry kept, alphabetical within each group. Bitchair is in Design & Merch with Bitcoin Trading Cards, Lena, Lucho Poletti, Le Pleb Royale, Mr.Crown, Sea Is Medicine, Tom Badley, World of Rusty. Kialara and Kanuto are in Sculpture & Objects.
- Top-level sections (Literature, Music, Podcasts, Film, Games, Institutions, Events) were left as they are. Merging Music+Podcasts or splitting Publications & Media would change the 8 gallery rooms; not done.
- Gallery rebuilt, parity OK. Local commits only, not pushed.

## Update 2026-10-18 (fiction research)

- Researched six candidates against primary work/author pages: *The Nakamoto Consensus*, *24*, *Walking Banks*, *Satoshi’s Fortune*, *The Hunt for Satoshi*, and *Satoshi Wedding Murders*. Evidence, caveats, and two sequel leads are in `research/2026-10-18-bitcoin-fiction-books.md`.
- Candidates are not added to the canonical list yet: personal-vouch/selection approval is pending. Suggested first picks: *The Nakamoto Consensus*, *24*, *Walking Banks*.
- Verified Jimmy Song is already absent from the local README and generated gallery entries. Read back GitHub `master`: he is still present there, so the removal is not published. No commit or push in this pass; existing local commits and unrelated research were preserved.
- Primary page extraction succeeded for all six; direct HTTP returned 406 for Arlo Fox's site, so do not mark it dead on that basis.

## Update 2026-10-18 (approved books added)

- Tomek approved all books, including *July 18* and *Satoshi’s Inquisition: A Novel*. Added all eight titles to Literature in six entries, grouping the two sequels with their first books and linking each pair to its author's book/series page.
- Rebuilt gallery entries, image metadata, shared data, and local deployable output. Four new entries received fetched images; the two without images use existing generated-tile fallbacks.
- Build, assembly, parity check, and explicit assertions for all eight titles passed. README and gallery now match at 243 entries in eight rooms, including 12 Literature entries. Jimmy Song remains absent from the README, gallery data, and assembled HTML.
- Changes are local and uncommitted. No push or public deployment was requested; public GitHub still has the previously noted Jimmy Song entry until publishing is approved.

## Update 2026-10-18 (Timechain Art Magazine group diff, additions)

- Read the Timechain Art Magazine Telegram group (14,482 messages) and diffed it against the list; report in `research/2026-10-17-timechain-art-magazine-telegram-diff.md` (hosted copy under the itstomekk Pages project, `/abc-research/timechain-art-magazine-diff/`). The magazine's featured-artist roster is already fully covered.
- Added at Tomek's request: Tesi Cypher Painter (Painting, Drawing & Street Art); Go Brrr and Ronin 21 (Design & Merch); Cyphermunk House (Institutions & Spaces, subsection renamed "Galleries, Museums & Hubs"); Bitcoin Graffiti Jam (link is its Geyser campaign page) and TAA (Events & Festivals); Behemoth (Literature, Fanfares audio page; author shown only as "Pleb", real name unknown).
- Escape Inflation is the screening title of No More Inflation, already listed; the entry now notes the alias.
- Not added: Paul Birken (site has no Bitcoin content), Eden Weeks (stub page). Section B candidates in the report still need own pages or a vouch.
- Gallery rebuilt: 250 entries, parity OK. The same commit also carries the eight fiction titles from the 2026-10-18 books pass (README, gallery data), which were still uncommitted. `research/2026-10-18-bitcoin-fiction-books.md` is left untracked for its own session. Not pushed.
