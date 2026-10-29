# Waiting room

Entries parked off the list for now. They are not on the README or the site, but nothing about them
is deleted, so any of them can come back later.

| Who | Links | Status | Parked |
|---|---|---|---|
| HACKZERO | https://x.com/hack355 | Was listed in Illustration & Digital Art ("AI/Midjourney promptcraft, prolific Bitcoin imagery."). Removed from the list. | 2026-10-29 |
| Moozi | https://x.com/l3itc0in | Was listed in Illustration & Digital Art ("Custom-trained AI models, Persian-inspired painterly style."). Removed from the list. | 2026-10-29 |
| archjourney | Issue #5, https://nostr.build/creators/creator/?user=675, npub1qhjxfxpjm7udr0agr6nuhuwf9383e4g9907g64r9hf6y4fh6t6uqpcp36k | Suggested in issue #5, never added. The issue stays open and untouched (Tomek: wait a few days before replying). No portfolio yet: only a nostr.build upload page (348 images, 107 videos) and a Nostr profile. | 2026-10-29 |

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

## Removed 2026-10-29 (podcast cut)

Tomek removed these 10 podcasts from the list. Unlike the parked entries above, their pictures and data were deleted too.

| Who | Link | Was listed as |
|---|---|---|
| Bitcoiners - Live From Bitcoin Beach | https://livefrombitcoinbeach.buzzsprout.com/ | Podcasts: "Conversations with Bitcoiners passing through El Zonte, El Salvador." |
| Dr Bitcoin - The Man Who Wasn't Satoshi Nakamoto | https://drbitcoinpod.com/ | Podcasts: "Narrative series on Craig Wright's Satoshi claim and the court case that exposed it." |
| Flirting With Bitcoin | https://www.flirtingwithbitcoin.com/podcast/ | Podcasts: "Ian and his wife Mandana talk Bitcoin as a couple, light and personal (121 episodes, 2022-2025)." |
| Local Bitcoiners | https://localbitcoiners.com/ | Podcasts: "Interviews with meetup organizers about building local Bitcoin communities." |
| Rabbit Hole Stories | https://podcasts.apple.com/us/podcast/rabbit-hole-stories/id1661401080 | Podcasts: "Plebs tell how they fell down the Bitcoin rabbit hole, hosted by Joël Kai Lenz and Ian Scanlon (2021-2025)." |
| The Anita Posch Show | https://anita.onl/ | Podcasts: "Bitcoin, human rights, and financial freedom, with a focus on adoption in Africa." |
| The Staying Free Podcast | https://podcasts.apple.com/us/podcast/the-staying-free-podcast/id1598397645 | Podcasts: "Real people around the world on staying free, sovereign, and sane (100 episodes, 2021-2025)." |
| The Transformation of Value | https://www.thetransformationofvalue.com/ | Podcasts: "Cody Ellingham explores freedom, money, and creativity through conversations." |
| Women & Bitcoin | https://bt.cx/en/women-and-bitcoin | Podcasts: "Sweden's first Bitcoin podcast for women, hosted by Rebecka and Hani." |
| Your Bitcoin Story | https://podcasts.apple.com/us/podcast/your-bitcoin-story/id1697280071 | Podcasts: "Personal Bitcoin stories, one guest and one story at a time." |

To bring one back, restore its README line and its data and files from commit `852bfa8` (the last commit that had them), then run `build.py --no-fetch` and `check_parity.py`.
