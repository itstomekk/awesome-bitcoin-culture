# HANDOFF — awesome-bitcoin-culture

**Last updated:** 2026-10-29.

## Update 2026-10-29 (works pass 6 + podcast cut, pushed)

- Pass 6 searched the 41 entries that still had only the main picture, using new sources (podcast RSS episode art, own YouTube thumbnails, Wayback, Nostr, GitHub). 18 picks for 13 entries; Tomek approved 8 pictures for 6 entries (statue-of-satoshi, behemoth, money-electric-the-bitcoin-mystery, the-great-reset-and-the-rise-of-bitcoin, the-cultural-tutor x2, lightning-poker x2) via `abc-works-harvest/add_all_to_gallery.py --pass6` (reads `picks/pass6-approved.json`). Drops: `abc-works-harvest/logs/pass6/review-drops.txt`. The other 28 entries have no further own pictures; Tomek chose to keep just the main picture there (no generated images, no placeholders, no "send pictures" link).
- `works.json`: 275 entries, 964 pictures. Built with `lum_works.py`, `build.py --no-fetch`, `check_parity.py` (OK, 304 entries), `assemble.py`; Firefox check 0 broken images, no JS errors.

## Update 2026-10-29 (10 podcasts removed, pushed)

- Tomek removed 10 podcasts: Bitcoiners - Live From Bitcoin Beach, Dr Bitcoin - The Man Who Wasn't Satoshi Nakamoto, Flirting With Bitcoin, Local Bitcoiners, Rabbit Hole Stories, The Anita Posch Show, The Staying Free Podcast, The Transformation of Value, Women & Bitcoin, Your Bitcoin Story. Their README rows, images, share cards, shots, works, socials and lum keys are deleted. Bitcoin Beach's description no longer points to its podcast. The list is in `research/waiting-room.md` with restore steps (from commit `852bfa8`).
- 304 entries, Podcasts 19. `check_parity.py` OK; awesome-lint shows the same 8 errors and 6 warnings as before (line numbers only).

## Update 2026-10-29 (works pass 5, pushed)

- Pass 5 searched again all 130 entries that had only 1 or 2 pictures (main + 0 or 1 works). Tomek approved the contact sheets. 117 pictures were added to 50 entries via `abc-works-harvest/add_all_to_gallery.py --pass5` (the new flag adds only pass 5). 10 weak picks were dropped in review (popups, landing pages, text-heavy screenshots, plus satoshi-gallery #15, which duplicated valentina-picozzi #40); the list is in `abc-works-harvest/logs/pass5/review-drops.txt`. 8 repeats were skipped by source URL.
- `works.json` now has 275 entries and 970 pictures; site total is 1,286 pictures. Pictures per entry: 1 = 41 (was 56), 2 = 47 (was 74), 3 = 38, 4 = 24, 5 = 55, 6 = 111. Backup: `abc-works-harvest/logs/works.json.bak-20261029-093256`.
- Built with `lum_works.py` (117 added), `build.py --no-fetch`, `check_parity.py` (OK), `assemble.py`. Local Firefox check (blu3baer, hotel-bitcoin, maximalist-episode-1, fountain): 6 pictures in each strip, 0 broken images, no JS errors. Committed from a clean worktree on top of origin/master (local master's unpushed aotd thread commit 3b15265 was left out).

## Update 2026-10-28 (TJ Murphy issues #2-#4, pushed a1485df, live)

- Issues #2-#4 were opened by TJ Murphy himself (GitHub @timothyjosephmurphy) and asked for his works to be used as the gallery row background. Permission covers the gallery only; ask him before using the images elsewhere.
- Main picture is now "Honeybadger and Cub with Genesis Block" (720x405 on a blurred backdrop, `manual`, replaces the Esperanza hero). Warszawska Syrenka and El Zonte at Dawn were already works 3 and 5. README description names Syrenka. Share card re-rendered. Issues closed with thank-you comments.
- 2026-10-29: Tomek parked AI-made work for now. HACKZERO and Moozi were removed from the list, and archjourney (#5, issue left open) was not added. All three are in `research/waiting-room.md`, which also explains how to restore them. Don't run `og_cards.py` while they are parked. PR #1: all artists are on main except Ninefold, which stays excluded.

## Update 2026-10-28 (creator outreach plan, nothing sent)

- Planned only; see PLAN.md Phase 6 and `C:\Users\Lenovo\Hermes\.hermes\plans\2026-10-28_120000-abc-artist-outreach.md`.
- Order decided by Tomek: social posts first, then email. Email starts with a ~10-person pilot, then a few a day, improving the message after each batch.
- Corrections come by email reply and the site's suggest form; the people get an ongoing conversation, not a one-off email.
- Contacts (only what creators published themselves) are private: `C:\Users\Lenovo\.secrets\awesome-bitcoin-culture\` (`contacts.csv`, `reach.csv`). 312 of 314 entries have a channel. Never copy contact data into this repo.
- Pilot candidates (10, all with own email + X, one per section mix): `pilot.csv` in the same private folder. Tomek picks the first few for social posts.

## Update 2026-10-28 (artist of the day on Nostr, top/bottom bar tweaks)

- Zap alerts: `tools/nostr/zap_notify.py` sends Tomek's personal npub (npub14wxts...) an encrypted Nostr DM (NIP-04) from the ABC account for every new zap receipt on the support goal. Cron `ae4d043a3746` every 15m via `$HERMES_HOME/scripts/abc_zap_dm.py`; only problems go to HCC topic 4359. Seen receipts: `C:\Users\Lenovo\.secrets\abc-nostr\zap-notify-state.json` (marked only after a relay accepts the DM). `--test` resends the latest zap as a [TEST] DM.

- Pushed `7df8d05`: bars (below) plus Artist of the day 29.10 PBOY, 30.10 Tatiana Moroz, 31.10 Hashteroids in `featured.json` (moved btc-monk to 2027-01-05, x3n0533d and chiefmonkey to 2027-02-21/22). Live.
- Matching Nostr posts from the ABC account, one per day at 15:00 UTC: cron `4123415edbc7` (every 15m, script `$HERMES_HOME/scripts/abc_aotd_nostr.py`, reports to HCC topic 4359). Approved event files, images and research live in `C:\Users\Lenovo\.secrets\awesome-bitcoin-culture\posts-pilot\`; each publishes once (marker `<file>.published.json`), sha256-locked to the approved text. Images on blossom.band.
- Post format Tomek approved: intro line about the list + "Artist of the day", 2-3 researched sentences, image, links to the creator's own site/socials, then the share page `/a/<id>/`. Research each creator (recent posts, what they do now) before drafting.
- Pushed on Tomek's ok: title initials A, B, C in cream with Bitcoin ticks on the B (`.mark .ini`, `.btc`), borderless search (underline only on focus), Support button borderless in the bottom bar with 10% side margin (4% phone), zap icon between the bar and the 1k count, its zap counter now fills the free width (cell count follows the width, `support.js` `cells()`). Dark theme is the default (no system-preference switch); a saved choice still wins. Search has a light underline always. Phone top: title centred on its own row, then search (230px), + and GitHub on one row.

## Update 2026-10-28 (bars, pushed in 7df8d05)

- Room band label shrunk to the site title size (`--gfs` 19px desktop, 15px phone; count at 0.8x).
- Bottom control bar thinner: 55px -> 43px desktop, 51px -> 41px phone (smaller paddings).
- 1px gap under the top bar fixed: `setVars()` in `app.js` floors the bar heights (Chromium/Edge bar is 54.67px, `offsetHeight` rounded up to 55 and left a sub-pixel strip). Verified in Edge at 100/110/125/150% and phone.

## Update 2026-10-26 (mini gallery pilot, local only)

- Opened entries can show a mini gallery: the main picture plus up to 4 more works, thumbnail strip under the big picture, click the big picture for a full-screen viewer (arrows, Esc). Data: `gallery/data/works.json` -> `wk` in `shared/data.js`; files in `gallery/shared/works/<id>-<n>.webp` (1200px) + `.t.webp` thumbs. Entries without works are unchanged.
- Pilot (Tomek chose: ~10 artists, review, then all 121 Visual Art): tj-murphy, pascal-boyart-pboy, lady-block-jane, coldie, tynka, cryptograffiti, rare-scrilla, gareth-eckley (5 pictures each), studio-zeitwerk, the-great-print (4; their pages have no more distinct works). Bitcoin-themed works preferred where the artist has them.
- Workflow: `C:/Python314/python.exe scripts/harvest_works.py <scratch dir> <ids>` (Firefox; upgrades Wix/Shopify/Squarespace/WP/cdn-cgi URLs to large renditions; drops small and duplicate images; writes a numbered `sheet.jpg`) -> pick by eye -> `python scripts/add_works.py <scratch dir> <id> 4,9,14,16` -> `python scripts/build.py --no-fetch`. Always check a main+works review sheet: a main picture composed on a blurred backdrop can slip past the duplicate check (4 caught in the pilot).
- Daily banner: an entry with works shows a different one of its pictures (main + works) as its row banner each day, same for every visitor (`bannerOf`/`dayIdx` in app.js, hash of date + id); its panel opens on that picture. After adding works run `python scripts/lum_works.py` so the new pictures get luminance/hue in `app/lum.js` (existing keys untouched).
- Phone category strip: each tab has a 4px top line in its room colour (was a neutral line).
- Open issue: Rare Scrilla's existing main picture is a text-only "Memetik Artefaktes" slab.
- Full Visual Art run (2026-10-27): 101 entries have works, 350 pictures (73 entries with 4, 12 with 3, 6 with 2, 10 with 1, 20 with none). Harvest workspace outside the repo: `C:/Users/Lenovo/Hermes/projects/research/abc-works-harvest/` (candidates, picks, review sheets). Rule learned: only first-party pages (own site, own creator page on scarce.city/Timechain, single-artwork pages credited to the artist). Shop/catalogue/artist-grid pages on multi-artist sites and X accounts gave other artists' work, so `harvest_works.py` no longer follows links on those and records the source `page` per candidate. 20 entries without works only link to X/Instagram or have a dead site.
- All-rooms run (2026-10-28, deployed with the update above): passes 3 and 4 added 495 pictures to 225 entries via `abc-works-harvest/add_all_to_gallery.py` (appends to existing works; `add_works.py` would replace them). `works.json` now 258 entries, 845 pictures. Pass 4 allowed the project's own social posts and screenshots of its own pages (17 screenshots). 35 picks were skipped as repeats of existing works (same source URL). `works.json` backup in `abc-works-harvest/logs/`. Built with `lum_works.py`, `build.py --no-fetch`, `check_parity.py` (OK), `assemble.py`.

## Update 2026-10-28 (nsite mirror on Nostr)

- Live as a NIP-5A root site signed by the project account: https://npub1vj4fdx2299g6mq7keqlpnwu52lvpwsslfna8efee66hguv9qcl0qe5ufj0.nsite.lol/ (also `.nsite.run`). Built from commit `cd7b754` (first publish `7df8d05`, then an update that uploaded only 5 changed files) in a clean worktree (not this working tree), 2,825 files, 133.6 MB, on Blossom servers blossom.primal.net, nostr.download, cdn.hzrd149.com. Server list (kind 10063) published. The domain on GitHub Pages stays canonical (page canonical/og URLs still point there).
- Slim nsite (since commit `a96596a`): the nsite keeps every entry but one picture each. `C:/Users/Lenovo/Hermes/tools/nsyte/slim_abc.py <gallery/dist> <out>` drops `shared/og/` and the mini galleries (entries whose main picture is art keep just it; the 10 whose main picture is a logo keep their first work), keeps `img/` and `shots/`. 824 files, 18 MB (full site: 2,825 files, 134 MB). The full gallery with all works stays on the domain; more pictures can be added to the nsite later.
- Update: in a clean checkout run `build.py --no-fetch`, `check_parity.py`, `assemble.py`, then `slim_abc.py`, then `python C:/Users/Lenovo/Hermes/tools/nsyte/deploy_nsite.py C:/Users/Lenovo/.secrets/abc-nostr/nsec.dpapi <slim dir> --skip-secrets-scan`. Only changed files upload. The secrets scan only flags public 64-hex values (pubkeys, zap goal id); the nsec was checked absent from dist. Details: `C:/Users/Lenovo/Hermes/tools/nsyte/README.md`.
- Relays: the slim manifest (832 tags, 93 KB) is accepted by damus, primal, relay.nsite.lol, purplepag.es, relay.ditto.pub, relay.snort.social and relay.dreamith.to. nos.lol and nostr.mom refuse events over ~64 KB. The first full manifest (2,835 tags, 318 KB) was too big for most relays.

## Update 2026-10-28 (artist of the day calendar)

- `tools/aotd/aotd.py` runs the calendar (commands in its docstring and in the `abc-artist-of-the-day` skill). State per entry in `C:/Users/Lenovo/.secrets/awesome-bitcoin-culture/aotd/<id>/`, so moves only edit `featured.json`.
- D-7 graphics (share card) + preview sheet to HCC topic 4359, and D-day publishing of approved posts at 15:00 UTC: both in cron `4123415edbc7` (`abc_aotd_nostr.py`, every 15m). D-1 research and draft: cron `48e2e33fca19` (10:00 and 15:00 local, gate `abc_aotd_gate.py`, prompt `tools/aotd/RESEARCH_PROMPT.md`, sonnet pinned). Only Tomek approves (`aotd.py approve <date>`).
- Starts with 01.11 (29-31.10 stay on the old posts-pilot items).

## Update 2026-10-28 (collage share cards)

- `gallery/scripts/og_cards.py` renders all 316 `shared/og/<id>.jpg` cards (1200x630) via Playwright Firefox: layouts 1/3/6 picked by id hash, A/₿/C glyph logo (`scripts/og/glyph-*.png`, fonts in `scripts/og/fonts/`). 154 entries have a GPT collage background of their works (`scripts/og/bg/`, git-ignored; masters in `C:/Users/Lenovo/Hermes/image-gen/2026-10-28-abc-share-cards/bg2/`, import with `--import <dir>`). Moderation blocked 4 (missatoshi-girl, pepelangelo, jure-kastelic, einundzwanzig-der-bitcoin-podcast); they and entries without enough works use their own image.
- Framed picture: the main image, or the first work when the main image is near-black or listed in `USE_WORK` (`frame_src`).
- og:image URLs carry `?v=2`; bump it in `assemble.py` when the card design changes. Cards are committed (CI has no fonts). `python scripts/og_cards.py [ids]` re-renders.
- Open: the collages are AI derivatives of artists' works (consent not asked yet). Sarah Foster's card (lips close-up) kept as is.

## Update 2026-10-28 (per-entry share links with preview cards)

- `/a/<id>/` page per entry (generated by `assemble.py`, also in sitemap.xml): own title, description, og:image and twitter card, then forwards to `/#<id>`. Copy link now copies this URL. Old `#` links still work.
- Cards: `gallery/scripts/og_cards.py` makes 1200x630 JPEGs in `gallery/shared/og/` (artwork left, room pill, name, description, footer). Uses Windows fonts, so run it locally after adding or editing entries and commit the cards; entries without a card fall back to `og.jpg`. Visitors never load the cards, only link-preview bots.

## Update 2026-10-28 (Purple Painter, Pegah Rug, No Good Kid fix, deploy)

- Added at Tomek's request, both Nostr-only (URL = primal.net profile): Purple Painter (Visual Art > Painters, npub1tx5ccp...) and Pegah Rug (Visual Art > Mixed Media & Craft, npub1wf0chc...). Main pictures and 4 works each are from their own Nostr posts (manual `images.json` entries, `src` = blossom URL).
- No Good Kid asked us to remove NoGood's pictures from his profile (two different artists: nogoodkid.com vs nogood.studio). Works 2-5 came from nogood.studio; replaced with his own Dribbble case studies (Nocoiner Syndrome, Top 10 Bitcoin F*ck Ups, Nostr Community Zine, Dark Forest #00; top 1600x1200 frame of each). Work 1 (Tamers of Entropy evidence bag, nogoodkid.com) kept. Old lum keys for no-good-kid-* were dropped and re-measured.
- Rule: a works source host that belongs to another listing is a red flag. A host check on 2026-10-28 also flagged madmunky (3 pictures from 2140art.com), not yet reviewed.
- Deployed with the earlier unpublished work (Valentina Picozzi, Satoshi Gallery, Bugle News, the all-rooms works run).

## Update 2026-10-23 (Nostr account, Support goal)

- Nostr account: `npub1vj4fdx2299g6mq7keqlpnwu52lvpwsslfna8efee66hguv9qcl0qe5ufj0` (hex `64aa9699...c7de`), NIP-05 `_@awesomebitcoinculture.com` (`gallery/app/.well-known/nostr.json`), lud16 `_@awesomebitcoinculture.com` since 2026-10-28 (`gallery/app/.well-known/lnurlp/_`, a static copy of Alby's `itstomekk` LNURL document; keep its metadata byte-identical or every payment fails the description-hash check; GitHub Pages serves it with CORS `*`; was `itstomekk@getalby.com`), follows Tomek (kind 3), avatar/banner in `gallery/app/nostr/`. Key: DPAPI file `C:\Users\Lenovo\.secrets\abc-nostr\nsec.dpapi`; sign and publish with `tools/nostr/abc_nostr.py` (usage in its docstring). Relays: damus, nos.lol, primal, nostr.mom.
- Zap goal (NIP-75 kind 9041): `00b146056c2b799308be9a94a4c4a37e4d72c5c061168a93473d0527a98484d1`, 100,000 sats. The Support button (`gallery/app/support.js`, `support.css`, QR via vendored `vendor/qrcode.js`, MIT) sums kind 9735 receipts tagged with that goal and signed by Alby's key `79f00d3f...f432`. Donations use one pre-signed anonymous zap request (no amount tag) so the site needs no keys; payment is confirmed through the LUD-21 verify URL. `#support` opens the dialog. A new goal means new constants in support.js and a new zap request.
- README has a hero image linking to the site and a Support section. Repo homepage and description point at the domain.

## Update 2026-10-23 (custom domain)

- Live domain: https://awesomebitcoinculture.com/ (Namecheap, account `kolotom`, DNS on Namecheap BasicDNS). Records set via the Namecheap API: 4 A + 4 AAAA GitHub Pages addresses on `@`, CNAME `www` -> `itstomekk.github.io.`; email forwarding left as is. API key in `C:\Users\Lenovo\.secrets\namecheap-api.txt`, whitelisted IP 74.244.65.4. Note: `setHosts` replaces the whole record set, so always send every record.
- Pages custom domain set via `gh api -X PUT repos/itstomekk/awesome-bitcoin-culture/pages -f cname=...` (workflow build, so no CNAME file). The old github.io URL redirects. Canonical, og:url, sitemap, robots and the 404 page now use the domain root (`SITE` in `gallery/scripts/assemble.py`, `gallery/app/index.html`).
- To do: GitHub domain verification TXT (`_github-pages-challenge-itstomekk`) from account Pages settings.

## Update 2026-10-27 (events link, outgoing-click counting, GoatCounter access)

- Awesome Bitcoin Events link now points at its site https://itstomekk.github.io/awesome-bitcoin-events/ instead of the GitHub repo (README and gallery card; the gallery adds utm_source=awesome-bitcoin-culture at render time).
- `gallery/shared/common.js` `trackOut`: every click on a link that leaves the site (plain links and the `.si` social icons) is sent to GoatCounter as an event with path `out/<host><path>` and title `<entry-id>: <link text>`. Tested in Firefox with a stubbed `window.goatcounter.count`: both link types counted, no page errors.
- GoatCounter moved to site code `awesomebtcculture` (id 124859). The old `awesomebitcoinculture` was created through the roatanlive host, so it became a child of roatanlive instead of the account root `roatantomek`; GoatCounter cannot log in to or read such nested sites (API `unknown token`, missing from the dashboard). Its 2026-10-23..28 hits are unreachable. New sites must be created via `https://roatantomek.goatcounter.com/api/v0/sites` (PUT). Read stats with the token in `.secrets/cookies/goatcounter-abc-apikey.txt`.
- GitHub traffic 2026-10-13..27: awesome-bitcoin-events repo 12 views / 11 unique (Google 2, github.com 1, none from this list); awesome-bitcoin-culture repo 7 / 6.

## Update 2026-10-23 (llms.txt, GoatCounter, search engines)

- `assemble.py` now writes `dist/llms.txt` (llmstxt.org format: summary, key links, then one H2 per room/subsection with every entry and its own URL, no utm tag). Live: https://awesomebitcoinculture.com/llms.txt
- GoatCounter site code `awesomebtcculture` since 2026-10-27 (was `awesomebitcoinculture`, see the 2026-10-27 update); snippet before `</body>` in `gallery/app/index.html`. Dashboard: https://awesomebitcoinculture.goatcounter.com/
- Google Search Console: URL-prefix property https://awesomebitcoinculture.com/ verified by the existing `google13edf74c50675ea1.html` file (keep it); sitemap.xml submitted, status Success. Bing Webmaster: site added and verified by the existing `msvalidate.01` meta tag (keep it); sitemap submitted. IndexNow (key file `47715f842d8561133625cd1a5a383604.txt`, see `seo/`) pinged with `/` and `/llms.txt`: indexnow.org 202, Bing 200, Yandex 202.


## Update 2026-10-23 (outgoing link tag)

- "Open work" links and the static SEO list add `utm_source=awesome-bitcoin-culture` to each entry's own site (`ABC.out` in `gallery/shared/common.js`, `tagged()` in `gallery/scripts/assemble.py`; keep both rules equal). Social and link-hub hosts (x.com, instagram, youtube, facebook, tiktok, linktr.ee, primal, t.me) and URLs that already carry a utm_source are left alone. The README keeps clean URLs. All 291 tagged URLs returned the same HTTP status as the untagged ones.

## Update 2026-10-23 (Free Market Simpson)

- Added Free Market Simpson (Polish painter, https://free-market-simpson.is/home/) to Visual Art > Painters at Tomek's request. Paintings are free-market and crypto-anarchist themed; no painting shows Bitcoin imagery directly, the Bitcoin tie is the "Crypto Anarchy" canvas, a Bitcoin article and 21 Bitcoin Polska on the contact page. Image: "Crypto Anarchy" (manual). Instagram @freemarketsimpson verified by og:title. Artist of the day: 2027-02-20.

## Update 2026-10-23 (social icons, discover buttons)

- Social profiles (X, Instagram, Nostr, YouTube) were researched for all 308 entries in `research/socials/` (harvest, scripted probes, a deep per-entry agent check, Instagram og:title probe). Results: `research/socials/final.csv`; Tomek approved every found account, including medium-confidence and creator-owned ones (a film or game without its own account shows its creator's or studio's account).
- `gallery/data/socials.json` (id -> platform URL, 284 entries: X 250, Nostr 174, Instagram 145, YouTube 140) is folded into `shared/data.js` by `build.py` as `soc`. Rows show small icons as the third line of the right-hand meta column (under section tag and host); the open panel lists them as real links.
- Header has "Artist of the day" and "Random" (also key R). The schedule is `gallery/data/featured.json` ("YYYY-MM-DD" -> entry id), filled randomly with all 120 Visual Art entries from 2026-10-23 to 2027-02-19; Tomek will name picks, edit that file. A date without a pick falls back to a stable per-day Visual Art entry.

## Current status (2026-10-19)

- Repository: `itstomekk/awesome-bitcoin-culture`, public, branch `master`; latest published base is `0faae1e`.
- README is canonical. The generated gallery has 300 entries across 8 rooms; README-to-gallery parity passes. Four entries added in the current local change each have a verified image. There are 44 other entries without a mapped image, carried over from the existing gallery baseline.
- Current local work includes README/link changes, gallery rebuild, the candidate-review note, and this plan/handoff update. `research/2026-10-18-bitcoin-fiction-books.md` remains unrelated and unstaged.
- Community suggestions use `.github/ISSUE_TEMPLATE/suggest-entry.yml`, linked from `CONTRIBUTING.md`.
- Ninefold remains excluded. Do not merge the unmerged `add-missing-bitcoin-artists` branch wholesale.
- Do not push unless Tomek explicitly asks in the current message.

## Historical snapshot (2026-10-12)

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

## Current review and next steps

- Link repair/check is complete: Psyfer's README link resolves to the live Timechain artist page; Bitcoiners now links to its live official film page; the existing Street Cyber entry links to its live X profile. The old `www.streetcyber.art` domain returns 503, so it is not used as the list link.
- BFF film decision is complete: Hotel Bitcoin is enough; *Revolución Bitcoin* is not added.
- The 2026-10-19 candidate scan added Tynka, Frédéric Guimont / *Ratel*, Aaron Koenig, and Roger9000 after checking their official work pages. Findings and non-added leads are in `research/2026-10-19-candidate-and-link-review.md`.
- Tomek confirmed the criteria/category review was already done. Events and Memes decisions are closed; do not ask again.
- `awesome-lint` is a Markdown style checker. The current run reports 60 errors and 5 warnings, unchanged from the previous baseline. This is not a content-quality score and is not a CI gate; broad remediation is not authorized.
- Remaining routine work: optional cross-links/meta-list submissions, periodic source scans, and the 44 pre-existing unmapped gallery images. None blocks the current change.

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
- These BFTA additions are already present on public master `0faae1e`.


## Update 2026-10-19 (link repair, candidate scan, approvals)

- Fixed the README Bitcoiners link to `https://bitcoinersmovie.com/product/bitcoiners-movie/` (GET 200). Verified Psyfer's current Timechain page (200), Street Cyber's current X profile (200), and recorded that the old Street Cyber domain returns 503.
- Added Tynka, Frédéric Guimont / *Ratel*, Aaron Koenig, and Roger9000 to the README. Their work pages were fetched; the gallery now has a manually selected image for each. Tynka had appeared on `origin/add-missing-bitcoin-artists`; restored only the candidate, not the branch (Ninefold remains excluded).
- Additional scan dispositions: *Ratel* has public sequential-art samples and a progress page marked in progress; BFF music listings without a Bitcoin-themed body of work or a first-party work page were held out. *Hotel Bitcoin* is sufficient; *Revolución Bitcoin* stays out.
- `npx -y awesome-lint README.md`: 60 errors and 5 warnings, unchanged from the earlier baseline. The report is formatting-oriented (including repeated links across art subcategories, ToC anchors, list spacing, and one undefined-reference parse); no CI lint gate was added.
- `gallery/scripts/build.py --no-fetch`, `gallery/scripts/check_parity.py`, and `gallery/scripts/assemble.py` completed; 300 entries in 8 rooms, parity OK. The four added entries have images.
- Phase 3 review and sign-off is complete per Tomek. Current changes remain local until fresh push approval.

## Update 2026-10-20 (BFTA deep scan)

- Scanned bitcoinforthearts.org (66 sitemap pages plus /midwest/schedule and /midwest/auction), 23 Substack posts, 27 beehiiv newsletter issues, and all 17 *Share Your Bitcoin Journey* episodes (YouTube channel feed).
- Added 10 entries Tomek approved as "strong": Lady Block Jane (Painters), Mr Meadow and No Good Kid (Digital & Graphic), Proof of Ink (Studio & Sidework), Hash Power Music, Rock'n'Roll Breakheart, Sara Jade, The Higher Low (Music), Bigger Than Bitcoin and Hummingbird: The Bitcoin Jungle Story (Documentaries). The Higher Low and Hummingbird had been cut earlier; Tomek approved restoring them.
- Gallery images set manually where noted. Manual images (flagged `manual`): Lady Block Jane (Unbroken Chain), Rock'n'Roll Breakheart (Midnight Breakheart cover), Sara Jade (press photo), Bigger Than Bitcoin (documentary thumbnail).
- Not added, borderline (Bitcoiners whose work is not about Bitcoin): Andrea Arghinenti, Thomas Forsyth, James Kintore, Nadia Vaeh (*One Poop Scoop Away*), Jason R. Johnston (*Till My Last Breath*), Ethan Turer, Ahmed Klink (Lebanese Hodl), Dion Wilson.
- Not added, out of scope: *Solution to Poverty* (Liberty International), Proof of Print (mining hardware), Short North Stage (*Sweeney Todd*), *The Six Billion Dollar Man*, Camp Nakamoto (event), curators and board advisors, Nostr quote authors (FuzzyNibs, sunavaunt, unit).
- Open fixes, not applied: MEAR ONE links to store.bitcoinmagazine.com instead of his own store.mearone.com; Amy DiGi is described as an oil painter while BFTA calls her a hand-generated digital artist; artistsovereignremnant.com (Asanoha) does not resolve from this machine.

## Update 2026-10-20 (rosters, collectives, lost entries)

- History audit: Longy, Roger 9000, Here Comes Bitcoin and Bitcoin Castle were never removed on purpose; they lived inside other entries' descriptions and vanished when descriptions were shortened (4cf82fc, c9db5df). All four restored.
- Added Bitcoin Design (Collectives).
- Roster scan of BMAG exhibitors, Bitcoin Art Gallery Wynwood, Hash Power Music, Revolution.Rocks, Bitcoin Atlantis gallery, BTC Prague / Timechain Artifacts, Noderunners. Rule (Tomek): own website plus real Bitcoin art; no NFT, Ordinals-only, altcoin or merch. Galleries themselves not added.
- Added 16: Crypsi (Collectives), Noderunners (Community Spaces), April Popko, Josie Bellini, Sarah Foster (Painters), Todd Gray (Sculpture), Hodlxhold, Volatile21 (Mixed Media), Zap Zide (Digital & Graphic), The Trusted, Vicious Clay, The Retrograde, Circle the Earth, Josh Rogan, Longy, Roger 9000 (Music). Images set manually from each act's own page.
- Skipped, borderline: Rupture (mostly Ordinals; Remains paintings bound to inscriptions), Greg Mike (Bitcoin is a few conference murals), Marco Santini, Curtis William Readel (currency, not Bitcoin). Re-check later: certainorange.com (HTTP 522), Matt Habel is already listed as Crayonsmell, Kenneth Moon at BMAG is the listed Kenneth Burris.
- Skipped for no own site: Gonkx, Remster, Nik Cant Mine, Shepa Art, Snowy Owl, MOOKY, Kazuki Tokaji, The Velvicks, Isabella Kay, Abstract Mirror, Giwdul, Jordan Wilk, VenusRose, Lilian, i11 (domain expired), Hadaikum, and the BMAG Pepe/Counterparty/token artists.
- Literature lead not checked: Ubel Owl Studios (*Kiki & Rufus: The Secret of Money*).
- Bitcoin Castle image: film still from the BFF Notion film database export (image_157.png). Replayed onto the restructured master (cccbf80): Digital & Graphic -> Illustration & Digital Art, Mixed Media -> Mixed Media & Craft, Sculpture -> Sculpture & Objects, Proof of Ink -> Mixed Media & Craft, Here Comes Bitcoin -> Illustration & Digital Art; Roger 9000 skipped because master already lists Roger9000. Gallery 328 entries, parity OK; awesome-lint 60 errors, 5 warnings, same as the master baseline.

## Update 2026-10-20 (search engine submission)

- Google Search Console: URL-prefix property `https://itstomekk.github.io/awesome-bitcoin-culture/` verified (kolotom@gmail.com) with `gallery/app/google13edf74c50675ea1.html`. Do not delete that file. Sitemap submitted; indexing of the homepage requested.
- Bing Webmaster Tools: site added and verified with the `msvalidate.01` meta tag in `gallery/app/index.html`; sitemap submitted.
- IndexNow: key `47715f842d8561133625cd1a5a383604` (copy in `seo/indexnow-key.txt`), key file `gallery/app/<key>.txt`; homepage accepted (202) by api.indexnow.org and bing.com. Resubmit after big list updates.
- `itstomekk.github.io/robots.txt` is 404 (project site, not the user root), so the `Sitemap:` line in our robots.txt is never read. Sitemaps must be submitted by hand, as done above.
- Sitemap lists one URL; the gallery is a single page. Per-category pages would give search engines more to rank.

## Update 2026-10-21

- Added Bitcoin Fiction for Sats (Andrew Westhead, six free novels, Lightning tips) to Literature at Tomek's request. Page fetched (200, all six titles and author shown). Gallery image: manual strip of the six covers from the site's own `covers/`. Gallery 306 entries, parity OK; awesome-lint unchanged vs HEAD.

## Update 2026-10-22 (entry anchors)

- Added TJ Murphy (https://tjm.art/) to Visual Art > Painters.
- Gallery: every entry now has a short anchor, `#<entry-id>` (for example `#tj-murphy`). Opening it expands the row and scrolls to it; the old `#room=...&open=<id>` links still work and are rewritten to the short form. Each open panel has a "Copy link" control. Code: `gallery/app/app.js` (readHash, hashString, showEntry, releaseLock `aim`), style in `gallery/app/style.css` (`.cplink`).

## Update 2026-10-22

- Added Brad Mills to Publications & Media at Tomek's request (host of the Magic Internet Money Podcast, producer of the documentary *This Machine Greens*). Source: https://www.bradmills.ca/ (GET 200, title "Brad Mills"). The AI-experimentation wording comes from Tomek, not the page.
- Gallery image: ASCII coin artwork from the site (`brad_ascii.png`), not the portrait. Saved as `gallery/shared/img/brad-mills.webp`, flagged `manual` in `images.json`. Gallery 308 entries, parity OK, awesome-lint 0 errors / 5 pre-existing warnings.
- The no-fetch build rewrote `gallery/app/favicon.svg` and `index.html` and created two untracked icon files. Reverted them; they are not part of this change.
## Update 2026-10-22 (open items from Brad Mills pass)

- Amy DiGi: merged the two descriptions into one oil-first line. Verified on Timechain Art Magazine (oil on canvas, "Genesis Slice", "Bullish") and her site (giclee prints). The earlier "hand-generated digital artist" claim could not be re-verified; her other digital work is NFT sales, which the list excludes, so it is not in the description.
- Brad Mills: wording "recently experimenting with AI" confirmed by Tomek. No poster for *This Machine Greens* exists on bitcoinfilmfest.com or locally; the thegreensdocumentary.com poster is a different film (*The Greens*, Cabrini Green) and is not used. The Magic Internet Money episode art is an ASCII generative piece with edition numbers, not used. Image decision pending.
- Ubel Owl Studios (*Kiki & Rufus*) stays an open literature lead. certainorange.com re-check and IndexNow resubmission deferred by Tomek.
