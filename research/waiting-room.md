# Waiting room

Entries parked off the list for now. They are not on the README or the site, but nothing about them
is deleted, so any of them can come back later.

| Who | Links | Status | Parked |
|---|---|---|---|
| HACKZERO | https://x.com/hack355 | Was listed in Illustration & Digital Art ("AI/Midjourney promptcraft, prolific Bitcoin imagery."). Removed from the list. | 2026-10-29 |
| Moozi | https://x.com/l3itc0in | Was listed in Illustration & Digital Art ("Custom-trained AI models, Persian-inspired painterly style."). Removed from the list. | 2026-10-29 |
| archjourney | Issue #5, https://nostr.build/creators/creator/?user=675, npub1qhjxfxpjm7udr0agr6nuhuwf9383e4g9907g64r9hf6y4fh6t6uqpcp36k | Suggested in issue #5, never added. The issue stays open. | 2026-10-29 |

Reason: Tomek decided to keep AI-made work off the list for now.

## Bringing one back

- HACKZERO and Moozi still have their banner (`gallery/shared/img/`), share card (`gallery/shared/og/`),
  works (`gallery/shared/works/`) and data (`images.json`, `works.json`, `socials.json`). To restore one,
  put their README line back in Illustration & Digital Art (alphabetical), then run `build.py --no-fetch`
  and `check_parity.py`. Until then `build.py` prints a warning about their stale socials/works ids. That
  warning is expected.
- Do not run `og_cards.py` while they are parked. It removes cards for entries that are not in the README.
- Their artist-of-the-day dates (Moozi 2026-12-18, HACKZERO 2027-01-27) were removed from
  `gallery/data/featured.json`. On those days the site picks a stable random Visual Art entry instead.
