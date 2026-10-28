/* "Support" button: a Nostr zap goal (NIP-75) counted live from zap receipts (NIP-57).
   Donations are anonymous zaps to the goal event, paid from any Lightning wallet by QR code.
   No server and no keys: the zap request below is pre-signed by a throwaway key and carries no
   amount, so one request serves every donation; Alby signs a public receipt for each payment. */
(function () {
  "use strict";
  var GOAL = "00b146056c2b799308be9a94a4c4a37e4d72c5c061168a93473d0527a98484d1";
  var TARGET = 100000; // sats, same as the goal event's amount tag
  var LNURL = "https://getalby.com/.well-known/lnurlp/itstomekk";
  var ZAPPER = "79f00d3f5a19ec806189fcab03c1be4ff81d18ee4f653c88fac41fe03570f432"; // Alby's receipt key
  var RELAYS = ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net", "wss://nostr.mom"];
  var NEVENT = "nevent1qqsqpv2xq4kzk7vnpzlf499ycj3huntjchqxz952jdrn6pf84xzgf5gpz3mhxue69uhhyetvv9ujuerpd46hxtnfduqs6amnwvaz7tmwdaejumr0dspzqe92j6v552234kpadjp7rxaeg47czapp7n860jnnn44w3cc2p377qvzqqqpr2yhmjav0";
  var NPUB = "npub1vj4fdx2299g6mq7keqlpnwu52lvpwsslfna8efee66hguv9qcl0qe5ufj0";
  var ZAP_REQUEST = '{"id":"aba8c6a5a207a4af32483fc9fe74984d1194b7b7862fdd85f164ad3add22b300","pubkey":"e4601b66413bec8fd83ec1bdc6c4caf519cae04c6c539811ef48d50ad41d3470","created_at":1792793818,"kind":9734,"tags":[["p","64aa96994a2951ad83d6c83e19bb9457d817421f4cfa7ca739d6ae8e30a0c7de"],["e","00b146056c2b799308be9a94a4c4a37e4d72c5c061168a93473d0527a98484d1"],["relays","wss://relay.damus.io","wss://nos.lol","wss://relay.primal.net","wss://nostr.mom"]],"content":"","sig":"6b2f5b40f7ee74a6b955b881370648aa699a6fe06e5ffa64830d75c91837b1af50522bbf6a267d725fd6f3db90cb579dfb486b99f00ede33f097010955636ff4"}';
  var AMOUNTS = [1000, 5000, 21000, 100000];

  var btn = document.getElementById("sup");
  if (!btn) return;
  var raised = null, count = 0, seen = {};

  function fmt(n) { return Math.round(n).toLocaleString("en-US"); }
  function short(n) { return n >= 1000 ? (n >= 10000 || n % 1000 === 0 ? Math.floor(n / 1000) : (Math.floor(n / 100) / 10)) + "k" : String(Math.floor(n)); }
  function pct() { return raised == null ? 0 : Math.min(100, raised / TARGET * 100); }
  // text bar of n cells: empty cells are light shade, a part-filled cell darkens, full cells are solid
  function ascii(n) {
    var f = pct() / 100 * n, on = "", off = "";
    for (var i = 0; i < n; i++) {
      var c = Math.max(0, Math.min(1, f - i));
      if (c >= 1) on += "\u2588"; else if (c >= 0.5) on += "\u2593"; else if (c > 0 || (i === 0 && raised > 0)) on += "\u2592"; else off += "\u2591";
    }
    return '<span class="on">' + on + '</span><span class="off">' + off + "</span>";
  }

  // amount of a BOLT11 invoice in sats, from its human-readable part
  function bolt11Sats(pr) {
    var m = /^ln(?:bc|tb|bcrt|tbs)(\d+)([munp]?)1/i.exec(pr || "");
    if (!m) return 0;
    var mult = { "": 1e8, m: 1e5, u: 100, n: 0.1, p: 1e-4 }[m[2].toLowerCase()];
    return Number(m[1]) * mult;
  }

  function addReceipt(ev) {
    if (!ev || ev.kind !== 9735 || ev.pubkey !== ZAPPER || seen[ev.id]) return false;
    var pr = null, onGoal = false;
    (ev.tags || []).forEach(function (t) { if (t[0] === "bolt11") pr = t[1]; if (t[0] === "e" && t[1] === GOAL) onGoal = true; });
    var sats = bolt11Sats(pr);
    if (!onGoal || !sats) return false;
    seen[ev.id] = 1; raised = (raised || 0) + sats; count++;
    return true;
  }

  // as many cells as fit the free width of the button (the bar fills the bottom bar)
  var cw = 0;
  function cells() {
    var a = btn.querySelector(".supa");
    if (!cw) { var s = document.createElement("span"); s.textContent = "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588"; s.style.visibility = "hidden"; s.style.position = "absolute"; a.appendChild(s); cw = s.getBoundingClientRect().width / 10; a.removeChild(s); }
    return cw ? Math.max(6, Math.floor(a.clientWidth / cw)) : 10;
  }
  var rz = 0;
  window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { cw = 0; if (raised != null) paint(); }, 120); });

  function paint() {
    var t = btn.querySelector(".supn");
    if (raised != null) {
      btn.querySelector(".supa").innerHTML = ascii(cells());
      t.textContent = short(raised) + " / " + short(TARGET);
      btn.title = "Support the list: " + fmt(raised) + " of " + fmt(TARGET) + " sats raised";
    }
    var d = document.getElementById("supDlg");
    if (d) {
      d.querySelector(".sup-bar").innerHTML = raised == null ? "" : ascii(24);
      d.querySelector(".sup-raised").textContent = raised == null ? "…" : fmt(raised);
      d.querySelector(".sup-count").textContent = raised == null ? "" : count === 0 ? "Be the first to zap" : count === 1 ? "1 zap so far" : count + " zaps so far";
    }
  }

  // read the receipts once from every relay; live updates while the dialog is open
  var socks = [];
  function load(live) {
    RELAYS.forEach(function (url) {
      var ws;
      try { ws = new WebSocket(url); } catch (e) { return; }
      socks.push(ws);
      var timer = setTimeout(function () { if (!live) ws.close(); }, 8000);
      ws.onopen = function () { ws.send(JSON.stringify(["REQ", "g", { kinds: [9735], "#e": [GOAL], limit: 1000 }])); };
      ws.onmessage = function (m) {
        var msg; try { msg = JSON.parse(m.data); } catch (e) { return; }
        if (msg[0] === "EVENT" && msg[1] === "g") { if (addReceipt(msg[2])) paint(); }
        else if (msg[0] === "EOSE") { if (raised == null) { raised = 0; paint(); } if (!live) { clearTimeout(timer); ws.close(); } }
      };
      ws.onerror = function () { clearTimeout(timer); };
    });
  }
  function closeSocks() { socks.forEach(function (s) { try { s.close(); } catch (e) {} }); socks = []; }

  // ---------- dialog ----------
  var dlg = null, lastFocus = null, poll = null, lnurlMeta = null, chosen = 21000;

  function qrLib(cb) {
    if (window.qrcode) return cb();
    var s = document.createElement("script"); s.src = "vendor/qrcode.js"; s.onload = cb; document.head.appendChild(s);
  }
  function getMeta() {
    if (lnurlMeta) return Promise.resolve(lnurlMeta);
    return fetch(LNURL).then(function (r) { return r.json(); }).then(function (j) { lnurlMeta = j; return j; });
  }

  function build() {
    dlg = document.createElement("div");
    dlg.className = "sup"; dlg.id = "supDlg"; dlg.hidden = true;
    dlg.innerHTML =
      '<div class="sup-scrim" data-x></div>' +
      '<div class="sup-card" role="dialog" aria-modal="true" aria-labelledby="supT" tabindex="-1">' +
        '<div class="sup-head"><p class="sup-kick">Support the list</p><h2 id="supT">Keep it running</h2>' +
          '<button type="button" class="sup-x" data-x aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button></div>' +
        '<div class="sup-body">' +
          '<p class="sup-lede">Awesome Bitcoin Culture is free, open source and curated by hand. Zaps pay for the domain, hosting and curation time.</p>' +
          '<div class="sup-goal"><p><b class="sup-raised">…</b> / ' + fmt(TARGET) + ' sats</p><div class="sup-bar" aria-hidden="true"></div><p class="sup-count"></p></div>' +
          '<div class="sup-pick" role="group" aria-label="Amount in sats">' +
            AMOUNTS.map(function (a) { return '<button type="button" data-a="' + a + '">' + short(a) + '</button>'; }).join("") +
            '<label class="sup-own"><span class="vh">Other amount in sats</span><input type="number" min="1" step="1" inputmode="numeric" placeholder="other"></label>' +
          '</div>' +
          '<button type="button" class="sup-go">Zap <span class="sup-amt"></span> sats</button>' +
          '<div class="sup-pay" hidden><a class="sup-qr" target="_blank" rel="noopener" aria-label="Open the invoice in your Lightning wallet"></a>' +
            '<div class="sup-acts"><a class="sup-wallet" href="#">Open wallet</a><button type="button" class="sup-copy">Copy invoice</button><button type="button" class="sup-webln" hidden>Pay with browser wallet</button></div>' +
            '<p class="sup-st" role="status" aria-live="polite">Scan with any Lightning wallet. Waiting for payment…</p></div>' +
          '<p class="sup-fine">Paid to <b>itstomekk@getalby.com</b> as an anonymous zap on our <a href="https://njump.me/' + NEVENT + '" target="_blank" rel="noopener">Nostr goal</a>. ' +
            'On Nostr? Zap the goal or follow <a href="https://njump.me/' + NPUB + '" target="_blank" rel="noopener">@awesomebitcoinculture</a>.</p>' +
        '</div></div>';
    document.body.appendChild(dlg);
    dlg.addEventListener("click", function (e) {
      if (e.target.closest("[data-x]")) return close();
      var a = e.target.closest("[data-a]"); if (a) { setAmt(+a.dataset.a); dlg.querySelector(".sup-own input").value = ""; }
    });
    dlg.querySelector(".sup-own input").addEventListener("input", function () { var v = Math.floor(+this.value); if (v > 0) setAmt(v, true); });
    dlg.querySelector(".sup-go").addEventListener("click", invoice);
    dlg.querySelector(".sup-copy").addEventListener("click", function () {
      var pr = dlg.dataset.pr, b = this;
      (navigator.clipboard ? navigator.clipboard.writeText(pr) : Promise.reject()).then(function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy invoice"; }, 1600); }, function () {});
    });
    dlg.querySelector(".sup-webln").addEventListener("click", function () {
      window.webln.enable().then(function () { return window.webln.sendPayment(dlg.dataset.pr); }).catch(function () { status("The browser wallet did not pay. Scan the code instead."); });
    });
    document.addEventListener("keydown", function (e) {
      if (!dlg || dlg.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); close(); }
      if (e.key === "Tab") { // keep focus inside
        var f = [].slice.call(dlg.querySelectorAll("button,a[href],input")).filter(function (x) { return x.offsetParent; });
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    setAmt(chosen);
  }

  function setAmt(a, own) {
    chosen = a; resetPay();
    [].forEach.call(dlg.querySelectorAll("[data-a]"), function (b) { b.setAttribute("aria-pressed", String(!own && +b.dataset.a === a)); });
    dlg.querySelector(".sup-amt").textContent = fmt(a);
  }
  function status(t) { dlg.querySelector(".sup-st").textContent = t; }
  function resetPay() {
    clearInterval(poll); poll = null;
    dlg.querySelector(".sup-pay").hidden = true;
    dlg.querySelector(".sup-go").hidden = false;
    dlg.querySelector(".sup-go").disabled = false;
  }

  function invoice() {
    var go = dlg.querySelector(".sup-go"); go.disabled = true; go.textContent = "Creating invoice…";
    var amt = chosen;
    getMeta().then(function (m) {
      var msat = amt * 1000;
      if (msat < m.minSendable || msat > m.maxSendable) throw new Error("range");
      var u = m.callback + (m.callback.indexOf("?") < 0 ? "?" : "&") + "amount=" + msat + "&nostr=" + encodeURIComponent(ZAP_REQUEST);
      return fetch(u).then(function (r) { return r.json(); });
    }).then(function (j) {
      if (!j.pr || bolt11Sats(j.pr) !== amt) throw new Error("bad invoice");
      qrLib(function () { show(j.pr, j.verify); });
    }).catch(function (e) {
      go.disabled = false;
      go.innerHTML = e && e.message === "range" ? "Amount not accepted, try another" : "Could not create an invoice, try again";
      setTimeout(function () { go.innerHTML = 'Zap <span class="sup-amt">' + fmt(chosen) + "</span> sats"; }, 2600);
    });
  }

  function show(pr, verify) {
    var go = dlg.querySelector(".sup-go");
    go.hidden = true; go.innerHTML = 'Zap <span class="sup-amt">' + fmt(chosen) + "</span> sats";
    dlg.dataset.pr = pr;
    var qr = window.qrcode(0, "M"); qr.addData("LIGHTNING:" + pr.toUpperCase(), "Alphanumeric"); qr.make();
    var box = dlg.querySelector(".sup-qr");
    box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true, alt: "Lightning invoice QR code" });
    box.href = "lightning:" + pr;
    dlg.querySelector(".sup-wallet").href = "lightning:" + pr;
    dlg.querySelector(".sup-webln").hidden = !window.webln;
    dlg.querySelector(".sup-pay").hidden = false;
    box.focus();
    status("Scan with any Lightning wallet. Waiting for payment…");
    if (verify) poll = setInterval(function () {
      fetch(verify).then(function (r) { return r.json(); }).then(function (v) {
        if (v && v.settled) { clearInterval(poll); poll = null; paid(); }
      }).catch(function () {});
    }, 2500);
  }

  function paid() {
    dlg.querySelector(".sup-pay").classList.add("is-paid");
    status("Paid. Thank you! ⚡");
    // the receipt reaches the relays a moment later; the live subscription picks it up
  }

  function open() {
    if (!dlg) build();
    lastFocus = document.activeElement;
    dlg.hidden = false; document.documentElement.classList.add("sup-open");
    requestAnimationFrame(function () { dlg.classList.add("is-in"); });
    paint();
    closeSocks(); load(true);
    dlg.querySelector(".sup-card").focus();
  }
  function close() {
    resetPay(); closeSocks();
    dlg.classList.remove("is-in"); dlg.querySelector(".sup-pay").classList.remove("is-paid");
    document.documentElement.classList.remove("sup-open");
    dlg.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  btn.addEventListener("click", open);
  load(false);
  if (location.hash === "#support") open();
})();
