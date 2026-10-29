"""Artist of the day calendar: graphics ahead, research the day before, approval, Nostr post on the day.

The calendar is gallery/data/featured.json ("YYYY-MM-DD" -> entry id). Per-entry state lives outside the
repo in Q/<id>/ (image.jpg, post.txt, meta.json, event.json), so moving a person between dates only edits
featured.json and their graphic and text travel with them.

  status [days]                 next days with graphic / draft / approved / published state
  graphics [--send]             make graphics for the next AHEAD days (share card by default); with --send,
                                post a preview sheet of the new ones to HCC (silent when nothing is new)
  image <who> card|work:N|<file>  change the graphic (re-sent with the draft)
  draft <who> <body file>       store the 2-3 researched sentences; intro and links are added from the data
  send-draft <who>              send graphic + full post text to HCC for approval
  approve <who>                 upload the graphic to Blossom, write the signed-ready event, lock its sha256
  move <who> <date> [--deploy]  move to a date (swaps with whoever has it); --deploy rebuilds and pushes the site
  swap <date> <date> [--deploy]
  research-gate                 cron gate: {"wakeAgent": false} or the entry the D-1 agent must research
  publish-due                   cron step: publish today's approved post at 15:00 UTC (once, read back)

<who> is an entry id, a date (2026-11-03) or a day.month (03.11).
"""
import hashlib, json, mimetypes, subprocess, sys, urllib.request, uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

PROJ = Path(r"C:/Users/Lenovo/Hermes/projects/research/awesome-bitcoin-culture")
G = PROJ / "gallery"
FEAT = G / "data" / "featured.json"
Q = Path(r"C:/Users/Lenovo/.secrets/awesome-bitcoin-culture/aotd")
ENV = Path(r"C:/Users/Lenovo/AppData/Local/hermes/.env")
UPLOAD = Path(r"C:/Users/Lenovo/Hermes/tools/blossom-upload/upload.js")
PY = r"C:/Python314/python.exe"
CHAT, TOPIC = "-1003646507115", 4359  # HCC, GENERAL 2
AHEAD = 7                             # graphics this many days ahead
LEGACY_UNTIL = date(2026, 10, 31)     # 29-31.10 run from the hand-made posts-pilot items
DUE_H = 15                            # post time, UTC
LATE_H = 20                           # after this many hours late, give up (the site has moved on)
SITE = "https://awesomebitcoinculture.com/"
INTRO = "Awesome Bitcoin Culture is an open list of 300+ Bitcoin artists, books, films, games and places. Artist of the day: {name}."
LINKS = [("instagram", "Instagram"), ("x", "X"), ("nostr", "Nostr"), ("youtube", "YouTube")]


# ---------- data ----------
def feat():
    return json.loads(FEAT.read_text(encoding="utf-8"))


def entries():
    t = (G / "shared" / "data.js").read_text(encoding="utf-8")
    return {e["id"]: e for e in json.loads(t[t.index("=") + 1:].strip().rstrip(";"))["entries"]}


def today():
    return datetime.now(timezone.utc).date()


def parse_date(s):
    if "." in s:
        d, m = (int(x) for x in s.split(".")[:2])
        y = today().year
        c = date(y, m, d)
        return c if c >= today() - timedelta(days=60) else date(y + 1, m, d)
    return date.fromisoformat(s)


def resolve(who):
    f = feat()
    if who in f.values():
        return who, next(d for d, i in f.items() if i == who)
    try:
        d = parse_date(who).isoformat()
    except ValueError:
        sys.exit(f"unknown entry or date: {who}")
    if d not in f:
        sys.exit(f"nobody is scheduled on {d}")
    return f[d], d


def meta(i):
    p = Q / i / "meta.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


def save_meta(i, m):
    (Q / i).mkdir(parents=True, exist_ok=True)
    (Q / i / "meta.json").write_text(json.dumps(m, indent=1), encoding="utf-8")


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def dm(d):
    return datetime.fromisoformat(d).strftime("%a %d.%m")


# ---------- telegram (Bot API, HCC topic) ----------
def _token():
    for line in ENV.read_text(encoding="utf-8").splitlines():
        if line.startswith("TELEGRAM_BOT_TOKEN="):
            return line.split("=", 1)[1].strip().strip('"')
    sys.exit("TELEGRAM_BOT_TOKEN missing")


def tg(method, fields, file=None):
    b = uuid.uuid4().hex
    body = b""
    for k, v in {**fields, "chat_id": CHAT, "message_thread_id": str(TOPIC)}.items():
        body += f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
    if file:
        name, path = file
        ct = mimetypes.guess_type(str(path))[0] or "image/jpeg"
        body += (f'--{b}\r\nContent-Disposition: form-data; name="{name}"; filename="{Path(path).name}"\r\n'
                 f"Content-Type: {ct}\r\n\r\n").encode() + Path(path).read_bytes() + b"\r\n"
    body += f"--{b}--\r\n".encode()
    req = urllib.request.Request(f"https://api.telegram.org/bot{_token()}/{method}", body,
                                 {"Content-Type": f"multipart/form-data; boundary={b}"})
    r = json.loads(urllib.request.urlopen(req, timeout=120).read())
    if not r.get("ok") or r["result"].get("message_thread_id") != TOPIC:
        raise RuntimeError(f"telegram {method} not confirmed in topic {TOPIC}")
    return r["result"]["message_id"]


# ---------- graphics ----------
def set_image(i, src):
    from PIL import Image
    if src == "card":
        p = G / "shared" / "og" / f"{i}.jpg"
    elif src.startswith("work:"):
        wk = entries()[i].get("wk") or []
        n = int(src[5:])
        if not 1 <= n <= len(wk):
            sys.exit(f"{i} has {len(wk)} works")
        p = G / "shared" / "works" / wk[n - 1][0]
    else:
        p = Path(src)
    if not p.exists():
        sys.exit(f"missing {p}")
    im = Image.open(p).convert("RGB")
    im.thumbnail((2400, 2400))
    (Q / i).mkdir(parents=True, exist_ok=True)
    im.save(Q / i / "image.jpg", quality=88)
    m = meta(i)
    m.update(image_src=str(src), previewed=False)
    m.pop("approved_sha", None)  # a new picture needs a new approval
    save_meta(i, m)
    return Q / i / "image.jpg"


def sheet(rows, out):
    from PIL import Image, ImageDraw, ImageFont
    f = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 26)
    W, H = 720, 378
    s = Image.new("RGB", (2 * (W + 10), ((len(rows) + 1) // 2) * (H + 44)), "white")
    d = ImageDraw.Draw(s)
    for k, (label, p) in enumerate(rows):
        im = Image.open(p).convert("RGB")
        im.thumbnail((W, H))
        x, y = k % 2 * (W + 10), k // 2 * (H + 44)
        s.paste(im, (x + (W - im.width) // 2, y))
        d.text((x + 4, y + H + 6), label, fill="black", font=f)
    s.save(out, quality=85)
    return out


def graphics(send):
    f, e, new = feat(), entries(), []
    for k in range(1, AHEAD + 1):
        d = (today() + timedelta(days=k)).isoformat()
        i = f.get(d)
        if not i or date.fromisoformat(d) <= LEGACY_UNTIL:
            continue
        if not (Q / i / "image.jpg").exists():
            set_image(i, "card" if (G / "shared" / "og" / f"{i}.jpg").exists() else "work:1")
        if not meta(i).get("previewed"):
            new.append((d, i))
    if not new:
        return
    rows = [(f"{dm(d)}  {e[i]['name']}", Q / i / "image.jpg") for d, i in new]
    if not send:
        print("\n".join(r[0] for r in rows))
        return
    out = sheet(rows, Q / "_preview.jpg")
    cap = ("❓ Artist of the day graphics, please check:\n" + "\n".join(r[0] for r in rows) +
           "\n\nReply e.g. \"swap 03.11 05.11\", \"move tynka to 10.11\", \"03.11 use work 2\". Text comes the day before.")
    tg("sendPhoto", {"caption": cap[:1024]}, ("photo", out))
    for d, i in new:
        m = meta(i)
        m["previewed"] = True
        save_meta(i, m)


# ---------- text ----------
def compose(i, body):
    en = entries()[i]
    links = [f"Site: {en['url']}"] + [f"{lab}: {(en.get('soc') or {})[k]}" for k, lab in LINKS if (en.get("soc") or {}).get(k)]
    return "\n\n".join([INTRO.format(name=en["name"]), body.strip(), "[IMAGE]",
                        "\n".join(links + [f"On the list: {SITE}a/{i}/"])])


def draft(i, body_file):
    (Q / i).mkdir(parents=True, exist_ok=True)
    (Q / i / "post.txt").write_text(compose(i, Path(body_file).read_text(encoding="utf-8")), encoding="utf-8")
    m = meta(i)
    m["drafted"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    m.pop("approved_sha", None)
    save_meta(i, m)
    print((Q / i / "post.txt").read_text(encoding="utf-8"))


def send_draft(i, d):
    if not (Q / i / "image.jpg").exists():
        set_image(i, "card")
    txt = (Q / i / "post.txt").read_text(encoding="utf-8")
    tg("sendPhoto", {"caption": f"❓ Artist of the day {dm(d)}: {entries()[i]['name']} (graphic + text below)"},
       ("photo", Q / i / "image.jpg"))
    tg("sendMessage", {"text": txt + f"\n\n---\nReply \"approve {dm(d)[4:]}\" or tell me what to change. Posts on Nostr {dm(d)} at 15:00 UTC."})
    m = meta(i)
    m["sent_draft"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    save_meta(i, m)


def approve(i):
    from PIL import Image
    img, post = Q / i / "image.jpg", Q / i / "post.txt"
    if not post.exists():
        sys.exit(f"{i}: no draft yet")
    r = subprocess.run(["node", str(UPLOAD), str(img)], cwd=UPLOAD.parent, capture_output=True, text=True, timeout=180)
    url = (r.stdout.strip().splitlines() or [""])[-1]
    h = sha(img)
    if not url.startswith("https://") or h not in url:
        sys.exit(f"blossom upload failed: {r.stderr.strip()[-300:]}")
    urllib.request.urlopen(urllib.request.Request(url, method="HEAD"), timeout=60)  # read back
    w, hh = Image.open(img).size
    ev = {"kind": 1, "content": post.read_text(encoding="utf-8").replace("[IMAGE]", url),
          "tags": [["imeta", f"url {url}", "m image/jpeg", f"dim {w}x{hh}", f"x {h}"]]}
    (Q / i / "event.json").write_text(json.dumps(ev, ensure_ascii=False, indent=1), encoding="utf-8")
    m = meta(i)
    m.update(approved_sha=sha(Q / i / "event.json"), approved=datetime.now(timezone.utc).isoformat(timespec="seconds"),
             image_url=url)
    m.pop("warned", None)
    save_meta(i, m)
    print(f"approved {i}: {url}")


# ---------- calendar ----------
def deploy(msg):
    for s in (["build.py", "--no-fetch"], ["check_parity.py"]):
        subprocess.run([PY, f"scripts/{s[0]}", *s[1:]], cwd=G, check=True, capture_output=True)
    paths = ["gallery/data/featured.json", "gallery/shared/data.js"]
    subprocess.run(["git", "commit", "-qm", msg, "--", *paths], cwd=PROJ, check=True)
    env = {**__import__("os").environ, "GIT_TERMINAL_PROMPT": "0"}
    auth = ["-c", "credential.helper=", "-c", "credential.helper=!gh auth git-credential"]
    subprocess.run(["git", *auth, "pull", "-q", "--rebase", "--autostash", "origin", "master"], cwd=PROJ, env=env,
                   capture_output=True)  # other sessions push to this repo too
    r = subprocess.run(["git", *auth, "push", "origin", "HEAD"], cwd=PROJ, capture_output=True, text=True, env=env)
    print("pushed" if r.returncode == 0 else f"push failed: {r.stderr.strip()[-300:]}")


def write_feat(f):
    nl = "\r\n" if b"\r\n" in FEAT.read_bytes() else "\n"  # keep the file's line endings
    FEAT.write_bytes((json.dumps(dict(sorted(f.items())), indent=1, ensure_ascii=False) + "\n").replace("\n", nl).encode("utf-8"))


def swap(a, b, dep):
    f = feat()
    a, b = parse_date(a).isoformat(), parse_date(b).isoformat()
    for d in (a, b):
        if date.fromisoformat(d) <= max(today(), LEGACY_UNTIL):
            sys.exit(f"{d} is today, past or a hand-made legacy post; not moved")
    ia, ib = f.get(a), f.get(b)
    if ia is None:
        sys.exit(f"nobody on {a}")
    f[b] = ia
    if ib:
        f[a] = ib
    else:
        del f[a]
    write_feat(f)
    print(f"{b}: {ia}" + (f", {a}: {ib}" if ib else f", {a}: empty"))
    if dep:
        deploy(f"Artist of the day: {ia} to {b}" + (f", {ib} to {a}" if ib else ""))


def status(n):
    f, e = feat(), entries()
    for k in range(0, n + 1):
        d = (today() + timedelta(days=k)).isoformat()
        i = f.get(d)
        if not i:
            print(f"{d}  -")
            continue
        m = meta(i)
        st = ("published" if m.get("published") else "approved" if m.get("approved_sha") else
              "draft sent" if m.get("sent_draft") else "draft" if m.get("drafted") else
              "graphic" if (Q / i / "image.jpg").exists() else "-")
        if date.fromisoformat(d) <= LEGACY_UNTIL:
            st = "legacy posts-pilot item"
        print(f"{d}  {e.get(i, {}).get('name', i):34s} {st}")


# ---------- cron ----------
def research_gate():
    f, e = feat(), entries()
    for k in (0, 1):  # tomorrow, or today if it was missed
        d = (today() + timedelta(days=k)).isoformat()
        i = f.get(d)
        if i and date.fromisoformat(d) > LEGACY_UNTIL and not meta(i).get("drafted"):
            en = e[i]
            ctx = {k2: en.get(k2) for k2 in ("id", "name", "url", "desc", "room", "section", "sub", "soc")}
            print(json.dumps({"wakeAgent": True, "context": json.dumps({"date": d, **ctx}, ensure_ascii=False)}))
            return
    print(json.dumps({"wakeAgent": False}))


def publish_due():
    now = datetime.now(timezone.utc)
    f, e = feat(), entries()
    for k in (0, 1):  # the D-1 research job should have sent a draft by now
        d = now.date() + timedelta(days=k)
        i = f.get(d.isoformat())
        due = datetime(d.year, d.month, d.day, DUE_H, tzinfo=timezone.utc)
        if i and d > LEGACY_UNTIL and due - timedelta(hours=12) <= now < due:
            m = meta(i)
            if not m.get("sent_draft") and not m.get("warned_nodraft"):
                m["warned_nodraft"] = True
                save_meta(i, m)
                print(f"⚠️ ABC artist of the day {dm(d.isoformat())} ({e.get(i, {}).get('name', i)}): no draft was sent yet "
                      f"(the D-1 research job failed or the laptop was off). Ask me to research it now.")
    for k in (-1, 0):
        d = (now.date() + timedelta(days=k))
        i = f.get(d.isoformat())
        if not i or d <= LEGACY_UNTIL:
            continue
        due = datetime(d.year, d.month, d.day, DUE_H, tzinfo=timezone.utc)
        m = meta(i)
        if now < due or m.get("published") or m.get("stopped"):
            continue
        name = e.get(i, {}).get("name", i)
        if now > due + timedelta(hours=LATE_H):
            m["stopped"] = "expired"
            save_meta(i, m)
            print(f"⚠️ ABC artist of the day ({name}, {dm(d.isoformat())}) NOT posted on Nostr: never approved or the laptop was off.")
            continue
        ev = Q / i / "event.json"
        if not m.get("approved_sha"):
            if not m.get("warned"):
                m["warned"] = True
                save_meta(i, m)
                print(f"⚠️ ABC artist of the day {dm(d.isoformat())} ({name}) is due but not approved. Approve it and it goes out within 15 min (until {LATE_H}h late).")
            continue
        if not ev.exists() or sha(ev) != m["approved_sha"]:
            m["stopped"] = "hash mismatch"
            save_meta(i, m)
            print(f"⚠️ ABC artist of the day ({name}) NOT posted: the approved event changed. Needs a fresh approval.")
            continue
        r = subprocess.run(["uv", "run", "--python", "3.11", "--with", "nostr-sdk==0.45.1", "--with", "websockets==15.0.1",
                            "--with", "certifi", "python", "tools/nostr/abc_nostr.py", "publish", str(ev)],
                           cwd=PROJ, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=240)
        try:
            res = json.loads(r.stdout[r.stdout.index("{"):])
        except Exception:
            m["stopped"] = "unreadable output"
            save_meta(i, m)
            print(f"⚠️ ABC artist of the day ({name}): publish output unreadable, NOT retried. Check relays before any resend.")
            continue
        ok = [x["relay"] for x in res.get("relays", []) if x.get("accepted") and x.get("readback")]
        if ok:
            m["published"] = {"id": res["id"], "relays": ok, "at": now.isoformat(timespec="seconds")}
            save_meta(i, m)
            print(f"✅ ABC artist of the day on Nostr: {name}, https://njump.me/{res['id']} (confirmed on {len(ok)} relays)")
        else:
            m["stopped"] = "no relay confirmed"
            save_meta(i, m)
            print(f"⚠️ ABC artist of the day ({name}): no relay confirmed it. Not retried.")


def main(a):
    if not a:
        sys.exit(__doc__)
    c, dep = a[0], "--deploy" in a
    a = [x for x in a if x != "--deploy"]
    if c == "status":
        status(int(a[1]) if len(a) > 1 else 10)
    elif c == "graphics":
        graphics("--send" in a)
    elif c == "image" and len(a) == 3:
        print(set_image(resolve(a[1])[0], a[2]))
    elif c == "draft" and len(a) == 3:
        draft(resolve(a[1])[0], a[2])
    elif c == "send-draft" and len(a) == 2:
        send_draft(*resolve(a[1]))
    elif c == "approve" and len(a) == 2:
        approve(resolve(a[1])[0])
    elif c == "move" and len(a) == 3:
        swap(resolve(a[1])[1], a[2], dep)
    elif c == "swap" and len(a) == 3:
        swap(a[1], a[2], dep)
    elif c == "research-gate":
        research_gate()
    elif c == "publish-due":
        publish_due()
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main(sys.argv[1:])
