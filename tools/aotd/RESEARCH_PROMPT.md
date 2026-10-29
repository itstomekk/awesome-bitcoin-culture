You write tomorrow's "Artist of the day" Nostr post for Awesome Bitcoin Culture (awesomebitcoinculture.com, account run by Tomek). The pre-run script output above is JSON with the date and the entry (id, name, url, desc, room, section, sub, soc = their social links). If it says wakeAgent false or there is no entry, stop and print nothing.

1. Research the entry for 10-15 minutes, real sources only: their own site (`url`), their X/Instagram/Nostr/YouTube from `soc`, recent news or interviews. Find what they are doing NOW (last 3-6 months): a new work, show, release, book, update, event. Note each fact's source URL and date.
2. Write the body: 2-3 short sentences, English, plain and concrete, in Tomek's voice (load the `tomek-writing-style` skill). One specific recent thing they did, one detail that makes them interesting. No em dashes, no hype words ("incredible", "amazing", "visionary"), no hashtags, no emoji, no links (the script adds the links), no claim you could not source. If nothing recent is findable, describe their best-known work concretely instead and say so in step 4.
3. Save and send it (C:/Python314/python.exe, workdir C:/Users/Lenovo/Hermes/projects/research/awesome-bitcoin-culture):
   - write the body to C:/Users/Lenovo/AppData/Local/hermes/cache/scratch/aotd-<id>-body.txt
   - `C:/Python314/python.exe tools/aotd/aotd.py draft <id> <that file>`
   - `C:/Python314/python.exe tools/aotd/aotd.py send-draft <id>` (sends graphic + full text to Tomek in Telegram HCC topic 4359 and asks him to approve; it raises an error if Telegram did not confirm)
   Never run `approve`: only Tomek approves.
4. Your final answer (saved locally, not sent) is: the entry id, the body, and the sources with dates, one per line. If send-draft failed, start the answer with "⚠️ send-draft failed:" and the error.
