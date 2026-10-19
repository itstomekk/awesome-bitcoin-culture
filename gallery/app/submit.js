/* "Suggest an entry": slide-in form, live README line + banner preview, duplicate check, pre-filled GitHub issue.
   No backend, no tracking, no network calls: the only thing that leaves the page is the GitHub link the visitor opens. */
(function () {
  "use strict";
  var A = window.ABC;
  if (!A) return;
  var R4 = window.R4 || { getSuggest: function () { return null; }, setSuggest: function () {}, showEntry: function () {} };
  var root = document.documentElement;
  var REPO = "itstomekk/awesome-bitcoin-culture";
  var BASE = "https://github.com/" + REPO + "/issues/new?template=suggest-entry.yml";
  var MAXURL = 6000, SOFT = 140, KEY = "abc-suggest-draft-v1";
  var CAT = { art: "Visual Art", literature: "Literature", music: "Music", performing: "Dance & Performing Arts", film: "Film & Documentary", games: "Games", events: "Events & Festivals" };
  var SUBS = ["Galleries & Museums", "Grants, Funders & Patronage", "Publications & Media", "Platforms & Marketplaces"];
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var esc = A.esc;

  function categoryFor(room, sub) {
    if (room === "institutions") return sub || "";
    if (room === "unsure") return "Not sure";
    return CAT[room] || "";
  }
  function roomLabel(id) { var r = A.roomById[id]; return r ? r.label : ""; }

  /* ---------- link + text helpers ---------- */
  function normLink(raw) {
    var s = String(raw || "").trim();
    if (!s) return { ok: false, empty: true };
    if (/\s/.test(s)) return { ok: false };
    if (/^\/\//.test(s)) s = "https:" + s;
    else if (!/^https?:\/\//i.test(s)) {
      if (/^[a-z][a-z0-9+.\-]*:(?!\d)/i.test(s)) return { ok: false };
      s = "https://" + s;
    }
    var u;
    try { u = new URL(s); } catch (e) { return { ok: false }; }
    if (!/^https?:$/.test(u.protocol) || !/^[a-z0-9\-]+(\.[a-z0-9\-]+)*\.[a-z0-9\-]{2,}$/i.test(u.hostname)) return { ok: false };
    return { ok: true, url: s, host: u.hostname.toLowerCase().replace(/^www\./, ""), path: u.pathname.replace(/\/+$/, "").toLowerCase() };
  }
  function profileHost(n) { // soft warning: a profile or link-in-bio rather than the work itself
    if (!n.ok) return false;
    var h = n.host, p = n.path;
    if (/^(linktr\.ee|bio\.link|beacons\.ai|linkin\.bio)$/.test(h)) return true;
    if (/^(x\.com|twitter\.com|mobile\.twitter\.com|instagram\.com|facebook\.com|m\.facebook\.com|tiktok\.com)$/.test(h)) return !/\/(status|p|reel|reels|video|posts|watch|photo|tv)(\/|$)/.test(p);
    if (/^(youtube\.com|m\.youtube\.com)$/.test(h)) return /^\/(@|channel\/|c\/|user\/)/.test(p);
    return false;
  }
  function squash(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
  function oneLine(s) { s = squash(s).replace(/[.\s]+$/, ""); return s ? s + "." : ""; }
  function mdName(s) { return squash(s).replace(/([\[\]\\])/g, "\\$1"); }
  function mdUrl(s) { return s.replace(/\(/g, "%28").replace(/\)/g, "%29"); }
  function normName(s) { return String(s || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ""); }
  function hostPath(url) {
    var m = /^(?:[a-z][a-z0-9+.\-]*:)?\/*(?:www\.)?([^\/?#]+)([^?#]*)/i.exec(String(url || "").trim());
    return m ? { host: m[1].toLowerCase().replace(/:\d+$/, ""), path: m[2].replace(/\/+$/, "").toLowerCase() } : { host: "", path: "" };
  }
  var DUPS = A.entries.map(function (e) { var hp = hostPath(e.url); return { e: e, nn: normName(e.name), host: hp.host, path: hp.path }; });
  function findDups(name, link) {
    var nn = normName(name), hp = link ? hostPath(link) : null, out = [];
    DUPS.forEach(function (d) {
      var rank = 9, why = "";
      if (nn && d.nn === nn) { rank = 0; why = "same"; }
      else if (hp && hp.host && d.host === hp.host && d.path === hp.path) { rank = 1; why = "same"; }
      else if (nn.length >= 5 && d.nn.length >= 5 && (d.nn.indexOf(nn) >= 0 || nn.indexOf(d.nn) >= 0)) { rank = 2; why = "close"; }
      if (rank < 9) out.push({ e: d.e, rank: rank, why: why });
    });
    out.sort(function (a, b) { return a.rank - b.rank; });
    return out.slice(0, 3);
  }

  /* ---------- state ---------- */
  var BLANK = { room: "", sub: "", name: "", link: "", creator: "", desc: "", why: "", evidence: "", rules: false };
  var F = Object.assign({}, BLANK);
  var touched = {}, attempted = false, isOpen = false, isDone = false, trigger = null, lastUrl = "", storageOk = true;
  var saveT = 0, hideT = 0, copyT = 0;
  function readDraft() {
    try {
      var j = JSON.parse(localStorage.getItem(KEY) || "null");
      if (j && typeof j === "object") Object.keys(BLANK).forEach(function (k) { if (k in j) F[k] = k === "rules" ? !!j[k] : String(j[k] || ""); });
    } catch (e) { storageOk = false; }
  }
  function writeDraft() {
    if (isDone) return;
    try { if (hasText() || F.room) localStorage.setItem(KEY, JSON.stringify(F)); else localStorage.removeItem(KEY); storageOk = true; } catch (e) { storageOk = false; }
  }
  function clearDraft() { try { localStorage.removeItem(KEY); } catch (e) { /* private mode */ } }
  function hasText() { return !!(F.name.trim() || F.link.trim() || F.creator.trim() || F.desc.trim() || F.why.trim() || F.evidence.trim()); }

  /* ---------- markup ---------- */
  var ICON_BAD = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10"/><path d="M9 4.5h2v7H9zM9 13h2v2.3H9z"/></svg>';
  var ICON_INFO = '<svg viewBox="0 0 20 20" aria-hidden="true"><polygon points="10,1 19.5,18 0.5,18"/><path d="M9.1 7h1.8v5.5H9.1zM9.1 13.6h1.8v1.9H9.1z"/></svg>';
  var CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8.5l3.6 3.6L13.5 4"/></svg>';
  function chip(id, label, n) {
    return '<label class="sg-chip" data-room="' + id + '"><input type="radio" name="sgroom" value="' + id + '"><span class="sg-chip-in"><span class="sg-chip-t">' + esc(label) + '</span><span class="sg-chip-n">' + (n != null ? n + " works" : "Maintainers place it") + '</span></span><span class="sg-chk">' + CHECK + "</span></label>";
  }
  function field(id, label, help, control, extra) {
    return '<div class="sg-f" data-f="' + id + '"><label class="sg-lab" for="sg-' + id + '"><span>' + label + "</span>" + (extra || "") + "</label>" +
      '<p class="sg-help" id="sg-' + id + '-h">' + help + "</p>" + control +
      '<p class="sg-msg" id="sg-' + id + '-e" hidden>' + ICON_BAD + "<span></span></p></div>";
  }
  function inp(id, attrs) { return '<input class="sg-in" id="sg-' + id + '" ' + attrs + ' aria-describedby="sg-' + id + '-h sg-' + id + '-e" autocomplete="off">'; }
  function area(id, rows, attrs) { return '<textarea class="sg-in" id="sg-' + id + '" rows="' + rows + '" ' + attrs + ' aria-describedby="sg-' + id + '-h sg-' + id + '-e" autocomplete="off"></textarea>'; }

  function build() {
    var chips = A.rooms.map(function (r) { return chip(r.id, r.label, r.count); }).join("") + chip("unsure", "Not sure", null);
    var subs = SUBS.map(function (s) { return '<label class="sg-pill"><input type="radio" name="sgsub" value="' + esc(s) + '"><span>' + esc(s) + "</span></label>"; }).join("");
    var el = document.createElement("div");
    el.className = "sg"; el.id = "sg"; el.hidden = true;
    el.innerHTML =
      '<div class="sg-scrim" id="sgScrim"></div>' +
      '<div class="sg-panel" id="sgPanel" role="dialog" aria-modal="true" aria-labelledby="sgTitle" data-room="none" tabindex="-1">' +
      '<div class="sg-top"><p class="sg-kick" aria-hidden="true">Awesome Bitcoin Culture / New entry</p>' +
      '<button type="button" class="sg-x" id="sgX" aria-label="Close the form"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3l14 14M17 3L3 17"/></svg></button></div>' +
      '<div class="sg-body" id="sgBody">' +
      '<header class="sg-head">' +
      '<h2 id="sgTitle" tabindex="-1"><span>Suggest</span> <span>an entry</span></h2>' +
      '<p class="sg-lede" id="sgLede">Found creative work about Bitcoin that belongs here? Tell us about it. A maintainer reviews every suggestion.</p></header>' +
      '<form class="sg-form" id="sgForm" novalidate>' +
      '<section class="sg-sec" aria-labelledby="sgH1"><h3 class="sg-h" id="sgH1"><i>1</i>Which room?</h3>' +
      '<p class="sg-sub-h">Pick the closest fit. Maintainers can move it.</p>' +
      '<div class="sg-f" data-f="room"><fieldset role="radiogroup" aria-describedby="sg-room-e"><legend class="sr">Room</legend><div class="sg-chips" id="sgChips">' + chips + "</div>" +
      '<div class="sg-sub" id="sgSub" data-room="institutions" inert><div class="sg-sub-in"><div class="sg-subbox" role="group" aria-labelledby="sgSubLab"><p class="sg-lab" id="sgSubLab">What kind of Institutions &amp; Spaces entry?</p><div class="sg-subs" id="sgSubs">' + subs + "</div></div></div></div></fieldset>" +
      '<p class="sg-msg" id="sg-room-e" hidden>' + ICON_BAD + "<span></span></p></div></section>" +
      '<section class="sg-sec" aria-labelledby="sgH2"><h3 class="sg-h" id="sgH2"><i>2</i>The work</h3>' +
      field("name", "Name", "Name as it should appear in the list (an artist, work, studio or resource).", inp("name", 'type="text" maxlength="120" placeholder="e.g. Rebel Money"')) +
      field("link", "Link to the actual work", "A page where the work can be seen, read or heard. Not just a profile.", inp("link", 'type="text" inputmode="url" autocapitalize="none" spellcheck="false" maxlength="500" placeholder="https://"')) +
      '<div class="sg-dup" id="sgDup" role="status" hidden></div>' +
      field("creator", "Creator or studio", "Who made it? A named person or collective. (Memes are the one exception.)", inp("creator", 'type="text" maxlength="120"')) +
      field("desc", "One-line description", "Medium and what makes it notable. No marketing words. This becomes the line in the list.", inp("desc", 'type="text" maxlength="400"'), '<em id="sgCount" aria-hidden="true">0 / ' + SOFT + "</em>") +
      "</section>" +
      '<section class="sg-sec" aria-labelledby="sgH3"><h3 class="sg-h" id="sgH3"><i>3</i>The case for it</h3>' +
      field("why", "Why it fits", "How does it connect to Bitcoin? Keep it factual.", area("why", 4, 'maxlength="1500"')) +
      field("evidence", "Supporting sources", "Links that confirm the work and its details (creator site, organiser, publisher).", area("evidence", 3, 'maxlength="1500" placeholder="One link per line"')) +
      "</section>" +
      '<section class="sg-sec" aria-labelledby="sgH4"><h3 class="sg-h" id="sgH4"><i>4</i>How it will look</h3><p class="sg-sub-h">Updates as you type.</p>' +
      '<p class="sg-pvh"><span>README line</span></p>' +
      '<div class="sg-code"><code id="sgLine"></code><button type="button" class="sg-copy" id="sgCopy">Copy</button></div>' +
      '<p class="sg-pvh"><span>On the page</span></p>' +
      '<div class="sg-pv" id="sgPv" data-pat="0" aria-hidden="true"><div class="sg-pvg"></div><div class="sg-pvb"><span class="sg-pvn" id="sgPvN"></span><span class="sg-pvm"><b class="c" id="sgPvT"></b><span class="c host" id="sgPvH"></span></span></div></div>' +
      '<p class="sg-pvcap">A maintainer adds a picture. Until then the row wears a generated tint.</p></section>' +
      '<section class="sg-sec" aria-labelledby="sgH5"><h3 class="sg-h" id="sgH5"><i>5</i>Before you send</h3>' +
      '<details class="sg-rules" id="sgRulesD"><summary>The list rules</summary><div class="sg-rules-in"><ol>' +
      "<li>Primary intent is creative, not financial.</li>" +
      "<li>Made by a named human creator or an identifiable studio or collective (meme art is the exception).</li>" +
      "<li>Publicly viewable or verifiable.</li>" +
      "<li>Someone can vouch for it.</li>" +
      "<li>Active or complete, not an abandoned stub.</li></ol>" +
      "<p><b>Left out:</b> NFT or ordinals PFP collections, exchange marketing, meme coins, bulk AI slop.</p></div></details>" +
      '<div class="sg-f" data-f="rules"><label class="sg-check"><input type="checkbox" id="sg-rules" aria-describedby="sg-rules-e"><span class="sg-box">' + CHECK + "</span><span>I read the rules and this fits.</span></label>" +
      '<p class="sg-msg" id="sg-rules-e" hidden>' + ICON_BAD + "<span></span></p></div></section>" +
      "</form>" +
      '<section class="sg-done" id="sgDone" hidden><ol class="sg-steps"><li><span>GitHub opened in a new tab.</span></li><li><span>Press <b>Submit new issue</b> there (a free GitHub account is needed).</span></li><li><span>A maintainer reviews it.</span></li></ol>' +
      '<p class="sg-fallback">Nothing opened? <a id="sgFb" href="#" target="_blank" rel="noopener">Open the GitHub page</a> yourself.</p>' +
      '<div class="sg-acts"><button type="button" class="sg-b pri" id="sgAgain">Open it again</button><button type="button" class="sg-b" id="sgText">Copy as text</button><button type="button" class="sg-b" id="sgNew">Suggest another</button></div></section>' +
      "</div>" +
      '<div class="sg-foot" id="sgFoot"><p class="sg-stat" id="sgStat"></p>' +
      '<button type="button" class="sg-go is-off" id="sgGo" aria-disabled="true"><span id="sgGoT">Open on GitHub</span><span aria-hidden="true">&#8599;</span></button>' +
      '<div class="sg-confirm" id="sgConfirm" role="alert" hidden><p>Close the form? Your draft stays saved on this device.</p><button type="button" class="pri" id="sgKeep">Keep editing</button><button type="button" id="sgLeave">Close</button></div></div>' +
      '<p class="sr" id="sgLive" role="status" aria-live="polite"></p>' +
      "</div>";
    document.body.appendChild(el);
    return el;
  }
  var host = build();
  var $ = function (id) { return document.getElementById(id); };
  var panel = $("sgPanel"), body = $("sgBody"), form = $("sgForm"), foot = $("sgFoot"), goBtn = $("sgGo"), stat = $("sgStat"), live = $("sgLive");
  var IN = { name: $("sg-name"), link: $("sg-link"), creator: $("sg-creator"), desc: $("sg-desc"), why: $("sg-why"), evidence: $("sg-evidence") };
  var rulesBox = $("sg-rules");
  var note = document.createElement("p");
  note.className = "sg-note"; note.id = "sgLinkNote"; note.hidden = true;
  note.innerHTML = ICON_INFO + "<span>This looks like a profile. If there is a page showing the actual work, use that.</span>";
  $("sg-link-e").insertAdjacentElement("afterend", note);

  /* ---------- validation ---------- */
  function check() {
    var e = {}, n = normLink(F.link);
    if (!F.room) e.room = "Pick a room, or choose Not sure.";
    else if (F.room === "institutions" && !F.sub) e.room = "Pick what kind of Institutions & Spaces entry this is.";
    if (squash(F.name).length < 2) e.name = "Add a name for the list.";
    if (n.empty) e.link = "Add a link to the work.";
    else if (!n.ok) e.link = "That does not look like a web link. Try https://example.com/the-work";
    if (squash(F.creator).length < 2) e.creator = "Say who made it. A named person or collective.";
    if (squash(F.desc).length < 12) e.desc = squash(F.desc) ? "Add a little more: the medium and what makes it notable." : "Add a one-line description.";
    if (squash(F.why).length < 20) e.why = squash(F.why) ? "Add a little more. At least 20 characters, please." : "Explain how it connects to Bitcoin.";
    if (squash(F.evidence).length < 8) e.evidence = "Add at least one link or source that confirms the work.";
    if (!F.rules) e.rules = "Tick the box to confirm you read the rules.";
    return e;
  }
  var ORDER = ["room", "name", "link", "creator", "desc", "why", "evidence", "rules"];
  function setMsg(k, msg) {
    var wrap = host.querySelector('[data-f="' + k + '"]'), m = $("sg-" + k + "-e"); if (!wrap || !m) return;
    wrap.classList.toggle("is-bad", !!msg);
    m.hidden = !msg; m.lastElementChild.textContent = msg || "";
    var c = IN[k] || (k === "rules" ? rulesBox : null);
    if (c) { if (msg) c.setAttribute("aria-invalid", "true"); else c.removeAttribute("aria-invalid"); }
    if (k === "room") { $("sgChips").classList.toggle("is-bad", !!msg && !F.room); $("sgSubs").classList.toggle("is-bad", !!msg && !!F.room); }
  }
  function paintErrors() {
    var e = check();
    ORDER.forEach(function (k) { setMsg(k, (attempted || touched[k]) ? e[k] : ""); });
    return e;
  }
  function paintNotes() {
    note.hidden = !profileHost(normLink(F.link));
    var len = squash(F.desc).length, c = $("sgCount");
    c.textContent = len > SOFT ? len + " / " + SOFT + " (a bit long)" : len + " / " + SOFT;
    c.classList.toggle("is-over", len > SOFT);
  }
  function paintDup() {
    var box = $("sgDup"), n = normLink(F.link), list = (squash(F.name) || n.ok) ? findDups(F.name, n.ok ? n.url : "") : [];
    if (!list.length) { box.hidden = true; box.innerHTML = ""; box.dataset.h = ""; return; }
    box.hidden = false;
    var html = ICON_INFO + "<div>" + list.map(function (d) {
      return "<p>" + (d.why === "same" ? "<b>Already in the list:</b> " : "<b>Looks close to:</b> ") + esc(d.e.name) + " (" + esc(roomLabel(d.e.room)) + ')<button type="button" class="sg-show" data-id="' + esc(d.e.id) + '">Show it</button></p>';
    }).join("") + "</div>";
    if (box.dataset.h !== html) { box.dataset.h = html; box.innerHTML = html; } // keep the button alive between mousedown and click
  }
  function paintGo(e) {
    var bad = Object.keys(e).length, dup = !$("sgDup").hidden;
    goBtn.classList.toggle("is-off", !!bad);
    goBtn.setAttribute("aria-disabled", bad ? "true" : "false");
    $("sgGoT").textContent = dup && !bad ? "Suggest anyway" : "Open on GitHub";
    stat.textContent = bad ? (bad === 1 ? "1 thing left to fill in" : bad + " things left to fill in") : (dup ? "Listed already? You can still send it" : "Ready. Opens GitHub in a new tab");
  }

  /* ---------- preview ---------- */
  function readmeLine() {
    var n = normLink(F.link), name = mdName(F.name), d = oneLine(F.desc);
    return "- [" + (name || "Name") + "](" + (n.ok ? mdUrl(n.url) : "https://example.com") + ") - " + (d || "Description.");
  }
  function paintPreview() {
    var n = normLink(F.link), name = squash(F.name), line = $("sgLine"), d = oneLine(F.desc);
    line.textContent = readmeLine();
    var full = !!(name && n.ok && d);
    line.classList.toggle("is-ph", !full);
    $("sgCopy").disabled = !full;
    var pn = $("sgPvN"), t = $("sgPvT"), shown = name || "Your entry name";
    pn.textContent = shown; pn.classList.toggle("is-ph", !name);
    pn.style.setProperty("--c", Math.max(7, shown.length));
    t.textContent = F.room === "institutions" && F.sub ? F.sub : F.room === "unsure" ? "Not sure" : F.room ? roomLabel(F.room) : "Room";
    $("sgPvH").textContent = n.ok ? n.host : "example.com";
    $("sgPv").setAttribute("data-pat", String(A.hash(name || "x") % 4));
  }

  function paint() {
    panel.setAttribute("data-room", F.room || "none");
    var sc = F.room === "institutions", sub = $("sgSub");
    sub.classList.toggle("is-on", sc);
    if (sc) sub.removeAttribute("inert"); else sub.setAttribute("inert", "");
    paintNotes(); paintDup(); paintPreview();
    paintGo(paintErrors());
  }
  function toDom() {
    Array.prototype.forEach.call(host.querySelectorAll('input[name="sgroom"]'), function (r) { r.checked = r.value === F.room; });
    Array.prototype.forEach.call(host.querySelectorAll('input[name="sgsub"]'), function (r) { r.checked = r.value === F.sub; });
    Object.keys(IN).forEach(function (k) { IN[k].value = F[k]; });
    rulesBox.checked = !!F.rules;
  }
  function validRoom(r) { return r === "unsure" || !!A.roomById[r]; }

  /* ---------- events: fields ---------- */
  form.addEventListener("input", function (ev) {
    var t = ev.target;
    if (t.name === "sgroom") { F.room = t.value; if (F.room !== "institutions") F.sub = ""; touched.room = true; }
    else if (t.name === "sgsub") { F.sub = t.value; touched.room = true; }
    else if (t === rulesBox) { F.rules = rulesBox.checked; touched.rules = true; }
    else Object.keys(IN).forEach(function (k) { if (IN[k] === t) F[k] = t.value; });
    clearTimeout(saveT); saveT = setTimeout(writeDraft, 200);
    paint();
  });
  form.addEventListener("focusout", function (ev) {
    var t = ev.target;
    Object.keys(IN).forEach(function (k) {
      if (IN[k] !== t) return;
      touched[k] = true;
      if (k === "link") { var n = normLink(t.value); if (n.ok && n.url !== t.value) t.value = n.url; }
      F[k] = t.value;
    });
    paint(); writeDraft();
  });
  form.addEventListener("submit", function (ev) { ev.preventDefault(); submit(); });
  $("sgDup").addEventListener("click", function (ev) {
    var b = ev.target.closest(".sg-show"); if (!b) return;
    var id = b.dataset.id;
    close({ noFocus: true });
    R4.showEntry(id);
  });

  /* ---------- copy ---------- */
  function copyText(txt) {
    return new Promise(function (res, rej) {
      var fallback = function () {
        try {
          var ta = document.createElement("textarea"); ta.value = txt; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
          document.body.appendChild(ta); ta.select(); var ok = document.execCommand("copy"); ta.remove(); if (ok) res(); else rej();
        } catch (e) { rej(e); }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(res, fallback); else fallback();
    });
  }
  function flash(btn, done, msg) {
    var old = btn.dataset.l || btn.textContent; btn.dataset.l = old;
    btn.textContent = done ? "Copied" : "Copy failed"; btn.classList.toggle("is-ok", done);
    live.textContent = done ? (msg || "Copied") : "Could not copy. Select the text and copy it by hand.";
    clearTimeout(copyT); copyT = setTimeout(function () { btn.textContent = old; btn.classList.remove("is-ok"); }, 1700);
  }
  $("sgCopy").addEventListener("click", function () { var b = this; copyText(readmeLine()).then(function () { flash(b, true, "README line copied"); }, function () { flash(b, false); }); });
  $("sgText").addEventListener("click", function () { var b = this; copyText(plainText()).then(function () { flash(b, true, "Copied as text"); }, function () { flash(b, false); }); });
  function roomText() { return F.room === "institutions" ? "Institutions & Spaces (" + (F.sub || "?") + ")" : F.room === "unsure" ? "Not sure" : roomLabel(F.room); }
  function plainText() {
    var n = normLink(F.link);
    return ["Suggestion for Awesome Bitcoin Culture (https://github.com/" + REPO + ")", "",
      "Name: " + squash(F.name), "Room: " + roomText(), "Link to the work: " + (n.ok ? n.url : F.link.trim()), "Creator or studio: " + squash(F.creator),
      "Description for the list: " + oneLine(F.desc), "", "Why it fits:", F.why.trim(), "", "Supporting sources:", F.evidence.trim(), "", "README line:", readmeLine()].join("\n");
  }

  /* ---------- issue URL ---------- */
  function q(s) { return encodeURIComponent(s).replace(/%20/g, "+"); }
  function trimTo(s, keep) { return s.slice(0, Math.max(0, keep)).replace(/\s+\S*$/, "").replace(/[\s,;:]+$/, "") + "\u2026"; }
  function buildUrl() {
    var n = normLink(F.link), name = squash(F.name), dl = oneLine(F.desc);
    var why = F.why.trim(), src = F.evidence.trim(), rl = roomText();
    function make() {
      return BASE + "&title=" + q("[List suggestion] " + name) + "&entry=" + q(name) + "&category=" + q(categoryFor(F.room, F.sub)) +
        "&work-link=" + q(n.url) + "&creator=" + q(squash(F.creator)) + "&why=" + q(why + "\n\nRoom: " + rl) +
        "&evidence=" + q(src + "\n\nDescription for the list: " + dl);
    }
    var url = make(), guard = 0;
    while (url.length > MAXURL && guard++ < 80) { // trim the longest free-text field
      if (q(why).length >= q(src).length) why = trimTo(why, Math.floor(why.length * 0.85) - 20);
      else src = trimTo(src, Math.floor(src.length * 0.85) - 20);
      url = make();
    }
    return url;
  }

  /* ---------- submit ---------- */
  function firstBad(e) { for (var i = 0; i < ORDER.length; i++) if (e[ORDER[i]]) return ORDER[i]; return null; }
  function focusField(k) {
    var el = k === "room" ? (F.room === "institutions" && !F.sub ? host.querySelector('input[name="sgsub"]') : (host.querySelector('input[name="sgroom"]:checked') || host.querySelector('input[name="sgroom"]')))
      : k === "rules" ? rulesBox : IN[k];
    if (!el) return;
    el.focus({ preventScroll: true });
    var wrap = el.closest(".sg-f") || el, r = wrap.getBoundingClientRect(), br = body.getBoundingClientRect();
    if (r.top < br.top + 16 || r.bottom > br.bottom - foot.offsetHeight - 16) body.scrollTo({ top: body.scrollTop + r.top - br.top - 28, behavior: reduce.matches ? "auto" : "smooth" });
  }
  function submit() {
    attempted = true;
    var e = paintErrors();
    paintGo(e);
    var bad = firstBad(e);
    if (bad) { focusField(bad); live.textContent = e[bad]; return; }
    lastUrl = buildUrl();
    window.open(lastUrl, "_blank", "noopener");
    clearDraft();
    showDone();
  }
  function showDone() {
    isDone = true;
    form.hidden = true; $("sgDone").hidden = false; foot.hidden = true;
    $("sgTitle").innerHTML = "<span>Almost</span> <span>done</span>";
    $("sgLede").textContent = "Your suggestion is filled in on GitHub. It only needs your click.";
    $("sgFb").href = lastUrl;
    body.scrollTop = 0;
    $("sgTitle").focus({ preventScroll: true });
  }
  function showForm() {
    isDone = false;
    form.hidden = false; $("sgDone").hidden = true; foot.hidden = false;
    $("sgTitle").innerHTML = "<span>Suggest</span> <span>an entry</span>";
    $("sgLede").textContent = "Found creative work about Bitcoin that belongs here? Tell us about it. A maintainer reviews every suggestion.";
  }
  function resetForm() {
    F = Object.assign({}, BLANK); touched = {}; attempted = false; lastUrl = "";
    clearDraft(); toDom(); showForm(); paint();
  }
  goBtn.addEventListener("click", submit);
  $("sgAgain").addEventListener("click", function () { if (lastUrl) window.open(lastUrl, "_blank", "noopener"); });
  $("sgNew").addEventListener("click", function () { resetForm(); body.scrollTop = 0; $("sgTitle").focus({ preventScroll: true }); });

  /* ---------- open / close ---------- */
  var kids = [];
  function lockPage(on) {
    root.classList.toggle("sg-open", on);
    if (on) {
      kids = Array.prototype.filter.call(document.body.children, function (c) { return c !== host && !/^(SCRIPT|LINK|STYLE)$/.test(c.tagName) && !c.hasAttribute("inert"); });
      kids.forEach(function (c) { c.setAttribute("inert", ""); });
    } else { kids.forEach(function (c) { c.removeAttribute("inert"); }); kids = []; }
  }
  function open(opts) {
    opts = opts || {};
    var want = opts.room && validRoom(opts.room) ? opts.room : "";
    if (isOpen) { if (want) { F.room = want; if (want !== "institutions") F.sub = ""; toDom(); paint(); } return; }
    trigger = opts.trigger || (document.activeElement && document.activeElement !== document.body ? document.activeElement : null);
    clearTimeout(hideT);
    readDraft();
    if (want) { F.room = want; if (want !== "institutions") F.sub = ""; }
    touched = {}; attempted = false; showForm(); toDom(); paint();
    dismissConfirm();
    host.hidden = false; isOpen = true;
    lockPage(true);
    body.scrollTop = 0;
    void host.offsetWidth;
    host.classList.add("is-in");
    if (!opts.fromHash) R4.setSuggest(want || "");
    var target = F.room ? host.querySelector('input[name="sgroom"]:checked') : null;
    (target || $("sgTitle")).focus({ preventScroll: true });
    body.scrollTop = 0;
  }
  function needsConfirm(viaScrim) { return hasText() && !isDone && (viaScrim || !storageOk); }
  function askClose() {
    $("sgConfirm").hidden = false; stat.hidden = true; goBtn.hidden = true;
    $("sgKeep").focus();
  }
  function dismissConfirm() { $("sgConfirm").hidden = true; stat.hidden = false; goBtn.hidden = false; }
  function close(opts) {
    opts = opts || {};
    if (!isOpen) return;
    isOpen = false;
    writeDraft();
    host.classList.remove("is-in");
    lockPage(false);
    if (!opts.keepHash) R4.setSuggest(null);
    var done = isDone;
    var fin = function () { host.hidden = true; if (done) resetForm(); };
    clearTimeout(hideT);
    if (reduce.matches) fin(); else hideT = setTimeout(fin, 340);
    if (!opts.noFocus) {
      var t = trigger && document.body.contains(trigger) ? trigger : $("sgOpen");
      if (t) t.focus({ preventScroll: true });
    }
    trigger = null;
  }
  function tryClose(viaScrim) { if (needsConfirm(viaScrim)) askClose(); else close(); }
  $("sgX").addEventListener("click", function () { tryClose(false); });
  $("sgScrim").addEventListener("click", function () { tryClose(true); });
  $("sgKeep").addEventListener("click", function () { dismissConfirm(); IN.name.focus(); });
  $("sgLeave").addEventListener("click", function () { close(); });
  $("sgOpen").addEventListener("click", function () { open({ trigger: this }); });

  /* ---------- keyboard: Esc, Tab trap, S ---------- */
  function focusables() {
    var sel = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';
    return Array.prototype.filter.call(panel.querySelectorAll(sel), function (el) {
      if (el.closest("[hidden],[inert]")) return false;
      if (el.type === "radio" && !el.checked && host.querySelector('input[name="' + el.name + '"]:checked')) return false;
      return el.getClientRects().length > 0;
    });
  }
  document.addEventListener("keydown", function (ev) {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    var t = ev.target, typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    if (!isOpen) {
      if ((ev.key === "s" || ev.key === "S") && !typing) { ev.preventDefault(); open({ trigger: document.activeElement !== document.body ? document.activeElement : $("sgOpen") }); }
      return;
    }
    if (ev.key === "Escape") {
      ev.preventDefault();
      if (!$("sgConfirm").hidden) dismissConfirm(); else tryClose(false);
      return;
    }
    if (ev.key === "Tab") {
      var f = focusables(); if (!f.length) { ev.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1], a = document.activeElement;
      if (!panel.contains(a) || a === panel) { ev.preventDefault(); (ev.shiftKey ? last : first).focus(); return; }
      if (ev.shiftKey && (a === first || a === $("sgTitle"))) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && a === last) { ev.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener("focusin", function (ev) {
    if (isOpen && !panel.contains(ev.target)) { var f = focusables(); if (f[0]) f[0].focus({ preventScroll: true }); }
  });

  /* ---------- hash (#suggest, #suggest=music) ---------- */
  function sync(v) {
    if (v !== null && v !== undefined) open({ room: v, fromHash: true });
    else if (isOpen) close({ keepHash: true });
  }
  window.R4Suggest = {
    open: open, close: close, sync: sync, categoryFor: categoryFor, normLink: normLink, findDups: findDups, buildUrl: buildUrl,
    categories: function () { return A.rooms.map(function (r) { return categoryFor(r.id, ""); }).filter(Boolean).concat(SUBS, ["Not sure"]); }
  };
  var h0 = R4.getSuggest();
  if (h0 !== null && h0 !== undefined) open({ room: h0, fromHash: true });
})();
