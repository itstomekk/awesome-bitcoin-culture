(function () {
  "use strict";
  var A = window.ABC;
  var $ = function (s) { return document.querySelector(s); };
  var root = document.documentElement;
  var rowsEl = $("#rows"), railEl = $("#rail"), railItems = $("#railItems"), sortEl = $("#sort"), qEl = $("#q");
  var showingEl = $("#showing"), imgsEl = $("#imgs"), topEl = $("#top"), ctlEl = $("#ctl"), themeEl = $("#theme");
  var byId = {};
  A.entries.forEach(function (e) { byId[e.id] = e; });
  var roomIdx = {};
  A.rooms.forEach(function (r, i) { roomIdx[r.id] = i; });

  var state = { q: "", sort: "az", seed: 1, open: null, img: true, room: null, suggest: null }; // suggest: null (closed) | "" | room id (form open, from the hash)
  var pinned = false;           // the hash carries a room (user chose one or scrolled into one)
  var counts = {};              // visible entries per room
  var list = [];
  var LUM = window.R3_LUM || {};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var phone = window.matchMedia("(max-width:799px)");
  if (window.matchMedia("(hover:hover)").matches) root.classList.add("hv");

  /* ---------- colour helpers ---------- */
  function hexHsl(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return null;
    var n = parseInt(m[1], 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, s = 0, h = 0, d = mx - mn;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return [Math.round(h), s * 100, l * 100];
  }
  // hue + saturation for an entry: its own colour if it has a real one, else the accent of its picture, else the name hash
  function hueOf(e, b) {
    var c = hexHsl(e.color);
    if (c && c[1] > 8) return { h: c[0], s: Math.max(30, Math.min(64, c[1])), own: true };
    var p = b && picOf(b);
    if (p && p[1] >= 0) return { h: p[1], s: Math.max(30, Math.min(64, p[2])), own: false };
    return { h: A.hash(e.name) % 360, s: 38, own: false };
  }
  function hsl(h, s, l) { return "hsl(" + h + "," + Math.round(s) + "%," + Math.round(l) + "%)"; }
  function hslc(h, s, l) { return h + "," + Math.round(s) + "%," + Math.round(l) + "%"; } // components, for hsla(var(--x), a)
  function clamp(v, a, z) { return Math.max(a, Math.min(z, v)); }

  /* ---------- picture choice ---------- */
  function bestOf(e) {
    var b = A.best ? A.best(e) : null;
    if (!b && !A.best && e.img) b = { src: A.src(e), kind: e.w >= 420 ? "og" : "icon" };
    return b;
  }
  function picOf(b) { return LUM[(b.kind === "shot" ? "s:" : "i:") + b.src.split("/").pop()] || null; }
  function lumOf(e, b) {
    var p = picOf(b);
    return p ? p[0] : (b.kind === "shot" ? 0.82 : 0.5);
  }
  var DK = 0.16; // below this mean luminance a picture is "very dark": light pages flip that row to a dark band

  /* ---------- generated pattern (calm, tinted by hue, no lettering). Colours come from --gf/--gl/--gt so they follow the theme ---------- */
  function grp(stroke, op, inner, sw) {
    return stroke ? '<g style="fill:none;stroke:var(--gl);stroke-width:' + sw + ";opacity:" + op + '">' + inner + "</g>"
                  : '<g style="fill:var(--gl);opacity:' + op + '">' + inner + "</g>";
  }
  function pattern(h, r, W, H, sw, op) {
    var kind = (h >> 3) % 6, g = "", i;
    switch (kind) {
      case 0: var gap = 12 + Math.floor(r() * 12);
        for (i = -H; i < W + H; i += gap) g += '<line x1="' + i + '" y1="' + H + '" x2="' + (i + H) + '" y2="0"/>';
        return grp(1, op, g, sw);
      case 1: var d = 14 + Math.floor(r() * 8); // halftone, dots grow to the right
        for (var y = d / 2; y < H; y += d) for (var x = d / 2; x < W; x += d) g += '<circle cx="' + x + '" cy="' + y + '" r="' + (0.5 + (x / W) * d * 0.4).toFixed(1) + '"/>';
        return grp(0, op, g);
      case 2: var c = 22 + Math.floor(r() * 20);
        for (i = 0; i <= W; i += c) g += '<line x1="' + i + '" y1="0" x2="' + i + '" y2="' + H + '"/>';
        for (i = 0; i <= H; i += c) g += '<line x1="0" y1="' + i + '" x2="' + W + '" y2="' + i + '"/>';
        return grp(1, op, g, sw);
      case 3: var cx = W * (0.55 + r() * 0.4), cy = H * (0.3 + r() * 0.4), st = 11 + Math.floor(r() * 8);
        for (i = st; i < W; i += st) g += '<circle cx="' + cx.toFixed(0) + '" cy="' + cy.toFixed(0) + '" r="' + i + '"/>';
        return grp(1, op, g, sw);
      case 4: var xx = 0; // fine vertical bars
        while (xx < W) { var bw = 1 + Math.floor(r() * 5); g += '<rect x="' + xx + '" y="0" width="' + bw + '" height="' + H + '"/>'; xx += bw + 4 + Math.floor(r() * 10); }
        return grp(0, op * 0.8, g);
      default: var gy = 8 + Math.floor(r() * 6);
        for (i = gy; i < H; i += gy) g += '<line x1="0" y1="' + i + '" x2="' + W + '" y2="' + i + '"/>';
        return grp(1, op, g, sw);
    }
  }
  function genSvg(e, W, H, cls) {
    var hs = hueOf(e), h = A.hash(e.name), r = A.rand(h);
    var vars = "--gfl:" + hsl(hs.h, hs.s * 0.8, 79 - (h % 3) * 3) + ";--gll:" + hsl(hs.h, hs.s + 12, 40) + ";--gtl:" + hsl(hs.h, hs.s + 10, 22) +
      ";--gfd:" + hsl(hs.h, hs.s * 0.45, 17 + (h % 3) * 2) + ";--gld:" + hsl(hs.h, Math.min(70, hs.s + 10), 50) + ";--gtd:" + hsl(hs.h, hs.s + 10, 74);
    return '<svg class="' + cls + '" style="' + vars + '" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="' + W + '" height="' + H + '" style="fill:var(--gf)"/>' + pattern(h, r, W, H, W > 600 ? 2 : 1.5, 0.36) + "</svg>";
  }
  function tile(e) { // panel picture for entries with no image
    var ini = A.initials(e.name);
    var s = genSvg(e, 320, 240, "tile").replace("</svg>", "");
    return s + '<text x="16" y="212" font-size="' + (ini.length > 1 ? 104 : 130) + '" style="fill:var(--gt)" letter-spacing="-4">' + A.esc(ini) + "</text>" +
      '<text class="lab" x="16" y="28" font-size="11" style="fill:var(--gt)">NO IMAGE YET</text></svg>';
  }

  /* ---------- banners ---------- */
  // inline style: picture normalisation, tint and wash strength, derived from luminance and colour; one set per theme
  function bnStyle(e, b) {
    var hs = hueOf(e, b);
    if (!b) return "--thc-l:" + hslc(hs.h, hs.s, 80) + ";--thc-d:" + hslc(hs.h, hs.s, 46) + ";--wb-l:.18;--wb-d:.3";
    var l = lumOf(e, b), isShot = b.kind === "shot";
    if (b.kind === "icon") {
      return "--fc:" + (e.color && hs.own ? e.color : hsl(hs.h, hs.s, 78)) + ";--thc-l:" + hslc(hs.h, hs.s, 78) + ";--thc-d:" + hslc(hs.h, hs.s, 48) + ";--wb-l:.12;--wb-d:.22";
    }
    var v = [], p = function (k, x) { v.push("--" + k + ":" + x); };
    var vdark = l < DK;
    // light page
    p("bf-l", clamp(1 + (0.56 - l) * 0.6, 0.84, 1.32).toFixed(2));
    p("cf-l", clamp(1.04 + (l - 0.5) * 0.22, 0.96, 1.16).toFixed(2));
    p("sf-l", isShot ? "0.85" : "0.92");
    p("po-l", clamp(1 - (0.55 - l) * 0.9, 0.62, 1).toFixed(2));
    p("to-l", vdark ? "0" : clamp(0.5 + (l - 0.4) * 0.8, 0.5, 0.95).toFixed(2));
    p("wb-l", vdark ? "0.5" : clamp((isShot ? 0.3 : 0.24) + (0.72 - l) * 0.7, isShot ? 0.3 : 0.24, 0.6).toFixed(2));
    p("thc-l", hslc(hs.h, Math.max(hs.s, 40), l > 0.7 ? 66 : 74));
    // dark page: pale pictures are held back so they do not glare, dark ones get a lift
    p("bf-d", clamp(1.04 - (l - 0.5) * 0.55, 0.72, 1.28).toFixed(2));
    p("cf-d", "1.04");
    p("sf-d", "0.9");
    p("po-d", clamp(0.98 - (l - 0.6) * 0.4, 0.78, 1).toFixed(2));
    p("to-d", l > 0.6 ? "0.62" : "0.32");
    p("wb-d", clamp(0.4 + (l - 0.3) * 0.6, 0.4, 0.74).toFixed(2));
    p("thc-d", hslc(hs.h, Math.max(hs.s, 40), 48));
    return v.join(";");
  }
  function fillBanner(el) {
    var e = byId[el.dataset.id]; if (!e || el.dataset.done) return;
    el.dataset.done = "1";
    var b = bestOf(e), kind = el.dataset.kind;
    if (!b || kind === "gen") {
      el.dataset.kind = "gen";
      el.innerHTML = '<span class="pw">' + genSvg(e, 1200, 200, "gen") + "</span>";
      el.classList.add("ld"); return;
    }
    var src = A.esc(b.src), fb = ' data-bn="' + A.esc(e.id) + '"';
    if (kind === "icon") {
      el.innerHTML = '<span class="pw"><img class="pic" src="' + src + '" alt="" decoding="async"' + fb + "></span>" +
        '<span class="tint"></span><span class="ibox"><img class="ico" src="' + src + '" alt="" decoding="async"' + (e.w ? ' width="' + e.w + '" height="' + e.h + '"' : "") + fb + "></span>";
    } else {
      el.innerHTML = '<span class="pw"><img class="pic" src="' + src + '" alt="" decoding="async"' + fb + "></span>" +
        '<span class="tint"></span>';
    }
    var img = el.querySelector(".pic");
    var ok = function () { el.classList.add("ld"); };
    if (img.complete && img.naturalWidth) ok(); else img.addEventListener("load", ok, { once: true });
  }
  document.addEventListener("error", function (ev) {
    var t = ev.target;
    if (!t || t.tagName !== "IMG") return;
    if (t.dataset.bn) { // banner picture failed: fall back to the generated pattern
      var bn = t.closest(".bn"), eb = byId[t.dataset.bn];
      if (bn && eb) { bn.dataset.kind = "gen"; bn.innerHTML = '<span class="pw">' + genSvg(eb, 1200, 200, "gen") + "</span>"; bn.classList.add("ld"); }
      return;
    }
    if (t.dataset.fb) {
      var e = byId[t.dataset.fb], tmp = document.createElement("div");
      tmp.innerHTML = tile(e);
      var fig = t.closest(".shot"); if (fig) fig.className = "shot";
      t.replaceWith(tmp.firstChild);
    }
  }, true);
  var io = window.IntersectionObserver ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { fillBanner(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "900px 0px" }) : null;
  function observeBanners() {
    if (io) io.disconnect();
    if (!state.img) return;
    Array.prototype.forEach.call(rowsEl.querySelectorAll(".bn"), function (el) { if (io) io.observe(el); else fillBanner(el); });
  }

  /* ---------- state <-> hash ---------- */
  function readHash() {
    var p = new URLSearchParams(location.hash.replace(/^#/, ""));
    var r = (p.get("room") || "").split(",")[0];
    state.room = roomIdx.hasOwnProperty(r) ? r : null;
    pinned = !!state.room;
    state.q = p.get("q") || "";
    state.sort = p.get("sort") === "shuffle" ? "shuffle" : "az";
    state.seed = parseInt(p.get("seed"), 10) || 1;
    state.open = p.get("open") || null;
    state.img = p.get("img") !== "0";
    state.suggest = p.has("suggest") ? (p.get("suggest") || "") : null;
  }
  function hashString() {
    var p = [];
    if (pinned && state.room) p.push("room=" + state.room);
    if (state.q) p.push("q=" + encodeURIComponent(state.q));
    if (state.sort === "shuffle") p.push("sort=shuffle", "seed=" + state.seed);
    if (state.open) p.push("open=" + encodeURIComponent(state.open));
    if (!state.img) p.push("img=0");
    if (state.suggest !== null) p.push(state.suggest ? "suggest=" + encodeURIComponent(state.suggest) : "suggest");
    return p.length ? "#" + p.join("&") : "";
  }
  var lastHash = "";
  function writeHash() {
    var h = hashString();
    if (h === (location.hash || "")) { lastHash = h; return; }
    try { history.replaceState(null, "", h || (location.pathname + location.search)); }
    catch (_) { /* file:// quirks: leave the address as is */ }
    lastHash = location.hash || "";
  }

  /* ---------- data ---------- */
  function compute() {
    var l = A.search(A.entries, state.q).slice();
    var cmp = function (a, b) { return a.name.localeCompare(b.name, "en", { numeric: true, sensitivity: "base" }); };
    if (state.sort === "az") l.sort(cmp);
    else l.sort(function (a, b) { return A.hash(a.id + ":" + state.seed) - A.hash(b.id + ":" + state.seed) || cmp(a, b); });
    return l;
  }

  /* ---------- render ---------- */
  function rowHtml(e) {
    var b = bestOf(e), kind = b ? b.kind : "gen";
    var open = state.open === e.id;
    var dk = b && kind !== "icon" && lumOf(e, b) < DK ? ' data-dk="1"' : "";
    var lab = e.sub || e.section;
    return '<li class="row' + (open ? " is-open" : "") + '" data-id="' + A.esc(e.id) + '" data-kind="' + kind + '"' + dk + ">" +
      '<button type="button" class="head" id="h-' + A.esc(e.id) + '" aria-expanded="' + open + '" aria-controls="p-' + A.esc(e.id) + '">' +
      (state.img ? '<span class="bn" aria-hidden="true" data-id="' + A.esc(e.id) + '" data-kind="' + kind + '" style="' + A.esc(bnStyle(e, b)) + '"></span>' : "") +
      '<span class="name" style="--c:' + Math.max(7, e.name.length) + '">' + A.esc(e.name) + "</span>" +
      '<span class="meta"><b class="c" title="' + A.esc(lab) + '">' + A.esc(lab) + '</b><span class="c host">' + A.esc(e.host) + "</span></span>" +
      '<span class="pm" aria-hidden="true"></span></button>' +
      '<div class="panel" id="p-' + A.esc(e.id) + '" role="region" aria-labelledby="h-' + A.esc(e.id) + '"' + (open ? "" : " hidden") + ">" + (open ? panelHtml(e) : "") + "</div></li>";
  }
  function panelPic(e) {
    var b = bestOf(e);
    if (!b) return '<div class="shot">' + tile(e) + "</div>";
    var alt = A.esc(e.name + (b.kind === "shot" ? " website snapshot" : " preview")), fb = ' data-fb="' + A.esc(e.id) + '"';
    if (b.kind === "shot")
      return '<div class="shot is-site"><img src="' + A.esc(b.src) + '" alt="' + alt + '" decoding="async"' + fb + "></div>" +
        '<p class="cap">Snapshot of the project homepage</p>';
    if (b.kind === "icon") {
      var hs = hueOf(e, b);
      return '<div class="shot is-icon" style="--fc:' + (hs.own ? e.color : hsl(hs.h, hs.s, 78)) + '"><img src="' + A.esc(b.src) + '" alt="' + alt + '" decoding="async"' + fb + (e.w ? ' width="' + e.w + '" height="' + e.h + '"' : "") + "></div>";
    }
    return '<div class="shot"><img src="' + A.esc(b.src) + '" alt="' + alt + '" decoding="async"' + fb + (e.w ? ' width="' + e.w + '" height="' + e.h + '"' : "") + "></div>";
  }
  function panelHtml(e) {
    var room = A.roomById[e.room];
    return '<div class="pin"><figure class="fig">' + panelPic(e) + "</figure>" +
      '<div class="info"><p class="desc">' + A.esc(e.desc) + "</p>" +
      '<dl class="facts"><div><dt>Room</dt><dd>' + A.esc(room.label) + "</dd></div>" +
      (e.sub ? "<div><dt>Section</dt><dd>" + A.esc(e.sub) + "</dd></div>" : "") +
      '<div><dt>Host</dt><dd class="l">' + A.esc(e.host) + "</dd></div></dl>" +
      '<a class="open" href="' + A.esc(e.url) + '" target="_blank" rel="noopener">Open work &#8599;</a></div></div>';
  }
  function render() {
    list = compute();
    if (state.open && !list.some(function (e) { return e.id === state.open; })) state.open = null;
    var groups = {};
    counts = {};
    list.forEach(function (e) { (groups[e.room] = groups[e.room] || []).push(e); });
    A.rooms.forEach(function (r) { counts[r.id] = (groups[r.id] || []).length; });
    var html = "";
    if (!list.length) {
      html = '<div class="none"><p>No matches</p><button type="button" id="reset">Reset search</button></div>';
    } else {
      A.rooms.forEach(function (r, i) {
        var g = groups[r.id]; if (!g) return;
        html += '<section class="grp" id="room-' + r.id + '" data-room="' + r.id + '" aria-labelledby="g-' + r.id + '">' +
          '<h2 id="g-' + r.id + '"><span class="gl">' + A.esc(r.label) + "</span><small>" + A.esc(r.blurb) + "</small>" +
          '<span class="gc">' + g.length + "<em>" + (g.length === r.count ? "works" : "of " + r.count) + "</em></span></h2><ol>";
        g.forEach(function (e) { html += rowHtml(e); });
        html += '</ol><button type="button" class="sgcta" data-room="' + r.id + '"><span class="q">Missing something in ' + A.esc(r.label) + '?</span><span class="a">Suggest an entry <b aria-hidden="true">+</b></span></button></section>';
      });
    }
    rowsEl.innerHTML = html;
    showingEl.innerHTML = "Showing <b>" + list.length + "</b> of " + A.total;
    if (state.room && !counts[state.room]) state.room = null;
    syncControls();
    observeBanners();
    setupSpy();
  }
  function syncControls() {
    Array.prototype.forEach.call(sortEl.children, function (b) { b.setAttribute("aria-pressed", String(b.dataset.sort === state.sort)); });
    if (qEl.value !== state.q) qEl.value = state.q;
    imgsEl.setAttribute("aria-pressed", String(state.img));
    imgsEl.lastElementChild.textContent = state.img ? "on" : "off";
    document.body.classList.toggle("noimg", !state.img);
    Array.prototype.forEach.call(railItems.children, function (a) {
      var n = counts[a.dataset.room] || 0;
      a.lastElementChild.textContent = n;
      if (n) a.removeAttribute("aria-disabled"); else a.setAttribute("aria-disabled", "true");
      a.tabIndex = n ? 0 : -1;
    });
    markRail();
  }

  /* ---------- rail ---------- */
  function buildRail() {
    var h = "";
    A.rooms.forEach(function (r, i) {
      h += '<a href="#room=' + r.id + '" data-room="' + r.id + '"><span class="n">' + String(i + 1).padStart(2, "0") + '</span><span class="t">' + A.esc(r.label) + "</span><i>" + r.count + "</i></a>";
    });
    railItems.innerHTML = h;
  }
  function markRail() {
    var cur = state.room;
    if (!cur) { // above the first room: show the first one that has matches
      for (var i = 0; i < A.rooms.length; i++) if (counts[A.rooms[i].id]) { cur = A.rooms[i].id; break; }
    }
    var act = null;
    Array.prototype.forEach.call(railItems.children, function (a) {
      var on = a.dataset.room === cur;
      if (on) { a.setAttribute("aria-current", "true"); act = a; } else a.removeAttribute("aria-current");
    });
    if (act) keepInRail(act);
    if (cur) setBar(cur);
  }
  /* top and bottom bars take the colour of the room being read */
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function syncThemeColor() {
    var id = root.getAttribute("data-bar") || "art";
    var c = getComputedStyle(root).getPropertyValue("--room-" + id).trim();
    if (c && themeMeta) themeMeta.setAttribute("content", c);
  }
  function setBar(id) {
    if (root.getAttribute("data-bar") !== id) root.setAttribute("data-bar", id);
    syncThemeColor();
  }
  function keepInRail(a) { // keep the active item visible inside the rail without ever scrolling the page
    var beh = reduce.matches ? "auto" : "smooth";
    if (phone.matches) {
      var left = a.offsetLeft - (railEl.clientWidth - a.offsetWidth) / 2;
      if (Math.abs(railEl.scrollLeft - left) > 2) railEl.scrollTo({ left: left, behavior: beh });
    } else if (railEl.scrollHeight > railEl.clientHeight) {
      var top = a.offsetTop - (railEl.clientHeight - a.offsetHeight) / 2;
      railEl.scrollTo({ top: top, behavior: beh });
    }
  }
  function bottomChrome() {
    var v = parseFloat(root.style.getPropertyValue("--bb"));
    return isNaN(v) ? 54 : v;
  }
  function stickTop() {
    var v = parseFloat(root.style.getPropertyValue("--st"));
    return isNaN(v) ? 48 : v;
  }
  /* programmatic scrolling: scroll-spy is paused until the scroll settles */
  var lock = false, lockT = 0, driftTries = 0, userInput = false;
  function holdLock(ms) {
    lock = true; clearTimeout(lockT);
    lockT = setTimeout(releaseLock, ms || 200);
  }
  function releaseLock() {
    var sec = state.room && document.getElementById("room-" + state.room);
    if (sec && driftTries < 3) { // rows above the target are not rendered yet, so correct any estimate drift
      var d = sec.getBoundingClientRect().top - stickTop();
      if (Math.abs(d) > 3) { driftTries++; window.scrollBy({ top: d, behavior: "auto" }); holdLock(120); return; }
    }
    lock = false; driftTries = 0;
    resolveSpy();
  }
  window.addEventListener("scroll", function () { if (lock) { clearTimeout(lockT); lockT = setTimeout(releaseLock, 150); } }, { passive: true });
  ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (t) { window.addEventListener(t, function () { userInput = true; }, { passive: true }); });

  function jumpTo(id, instant) {
    var sec = document.getElementById("room-" + id); if (!sec) return;
    var y = sec.getBoundingClientRect().top + window.scrollY - stickTop();
    state.room = id; pinned = true;
    markRail(); writeHash();
    var smooth = !instant && !reduce.matches;
    driftTries = 0;
    holdLock(smooth ? 260 : 60);
    window.scrollTo({ top: Math.max(0, y), behavior: smooth ? "smooth" : "auto" });
  }
  railItems.addEventListener("click", function (ev) {
    var a = ev.target.closest("a"); if (!a) return;
    ev.preventDefault();
    if (a.getAttribute("aria-disabled") === "true") return;
    jumpTo(a.dataset.room, false);
  });

  /* ---------- scroll-spy: a 1px band just under the sticky chrome ---------- */
  var spy = null, spyMap = {};
  function setupSpy() {
    if (spy) spy.disconnect();
    spyMap = {};
    if (!window.IntersectionObserver) return;
    var line = Math.round(stickTop() + 10), bottom = Math.max(0, innerHeight - line - 1);
    spy = new IntersectionObserver(function (es) {
      es.forEach(function (en) { spyMap[en.target.dataset.room] = en.isIntersecting; });
      resolveSpy();
    }, { rootMargin: "-" + line + "px 0px -" + bottom + "px 0px", threshold: 0 });
    Array.prototype.forEach.call(rowsEl.querySelectorAll(".grp"), function (s) { spy.observe(s); });
  }
  function resolveSpy() {
    if (lock) return;
    var act = null;
    A.rooms.forEach(function (r) { if (spyMap[r.id]) act = r.id; });
    var changed = act !== (pinned ? state.room : null);
    if (!changed) return;
    if (act) { state.room = act; pinned = true; } else { pinned = false; }
    markRail(); writeHash();
  }

  /* ---------- controls ---------- */
  function afterReflow() { // content height changed: land on the same room again
    var id = state.room || firstRoom();
    if (id) jumpTo(id, true);
  }
  function firstRoom() { for (var i = 0; i < A.rooms.length; i++) if (counts[A.rooms[i].id]) return A.rooms[i].id; return null; }
  sortEl.addEventListener("click", function (ev) {
    var b = ev.target.closest("button"); if (!b) return;
    var s = b.dataset.sort;
    if (s === "shuffle") state.seed = 1 + Math.floor(Math.random() * 1e6);
    state.sort = s;
    var keep = pinned ? state.room : null;
    render();
    if (keep) afterReflow(); else writeHash();
  });
  imgsEl.addEventListener("click", function () {
    state.img = !state.img;
    var keep = pinned ? state.room : null;
    render();
    if (keep) afterReflow(); else writeHash();
  });
  qEl.addEventListener("input", function () {
    state.q = qEl.value;
    var first = rowsEl.getBoundingClientRect().top + window.scrollY - stickTop();
    render();
    if (window.scrollY > first) window.scrollTo({ top: Math.max(0, first), behavior: "auto" }); // results changed: start from their top
    pinned = false; state.room = null; markRail();
    writeHash();
    holdLock(120);
  });
  rowsEl.addEventListener("click", function (ev) {
    if (ev.target.id === "reset") { state.q = ""; render(); writeHash(); qEl.focus(); return; }
    var head = ev.target.closest(".head"); if (!head) return;
    toggle(head.parentNode.dataset.id);
  });

  function headOf(id) { return document.getElementById("h-" + id); }
  function closeOpen() {
    if (!state.open) return null;
    var id = state.open, head = headOf(id);
    state.open = null;
    if (head) {
      head.parentNode.classList.remove("is-open");
      head.setAttribute("aria-expanded", "false");
      var p = head.nextElementSibling; p.hidden = true; p.innerHTML = "";
    }
    return id;
  }
  function toggle(id) {
    var was = state.open === id;
    closeOpen();
    if (!was) {
      state.open = id;
      var head = headOf(id), p = head.nextElementSibling;
      p.innerHTML = panelHtml(byId[id]); p.hidden = false;
      head.setAttribute("aria-expanded", "true");
      head.parentNode.classList.add("is-open");
      reveal(head.parentNode);
    }
    writeHash();
  }
  // pixels hidden under the sticky chrome (bar or rail strip, room header)
  function chrome(li) {
    var g = li && li.closest(".grp") && li.closest(".grp").querySelector("h2");
    return stickTop() + (g ? g.offsetHeight : 0) + 6;
  }
  function reveal(li) {
    var top = chrome(li), r = li.getBoundingClientRect(), dy = 0;
    if (r.top < top) dy = r.top - top;
    else if (r.bottom > innerHeight - bottomChrome()) dy = Math.min(r.bottom - innerHeight + bottomChrome() + 8, r.top - top);
    if (dy) window.scrollBy(0, dy);
  }

  /* ---------- theme ---------- */
  function applyTheme(t, persist) {
    root.setAttribute("data-theme", t);
    themeEl.setAttribute("aria-pressed", String(t === "dark"));
    syncThemeColor();
    if (persist) { try { localStorage.setItem("abc-theme", t); } catch (e) { /* file:// may block storage */ } }
  }
  function stored() { try { var t = localStorage.getItem("abc-theme"); return t === "light" || t === "dark" ? t : null; } catch (e) { return null; } }
  themeEl.addEventListener("click", function () { applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true); });
  var sysDark = window.matchMedia("(prefers-color-scheme: dark)");
  var onSys = function (ev) { if (!stored()) applyTheme(ev.matches ? "dark" : "light", false); };
  if (sysDark.addEventListener) sysDark.addEventListener("change", onSys); else if (sysDark.addListener) sysDark.addListener(onSys);

  /* ---------- keyboard ---------- */
  document.addEventListener("keydown", function (ev) {
    var t = ev.target, typing = t.tagName === "INPUT" || t.tagName === "TEXTAREA";
    if (root.classList.contains("sg-open")) return; // the suggestion form handles its own keys
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    if (ev.key === "/" && !typing) { ev.preventDefault(); qEl.focus(); qEl.select(); return; }
    if ((ev.key === "t" || ev.key === "T") && !typing) { ev.preventDefault(); themeEl.click(); return; }
    if (ev.key === "Escape") {
      if (state.open) { var id = closeOpen(); writeHash(); var h = headOf(id); if (h) h.focus(); }
      else if (typing && qEl.value) { qEl.value = ""; state.q = ""; render(); writeHash(); }
      else if (typing) qEl.blur();
      return;
    }
    var heads = function () { return Array.prototype.slice.call(rowsEl.querySelectorAll(".head")); };
    if (t === qEl && ev.key === "ArrowDown") { var f = heads()[0]; if (f) { ev.preventDefault(); f.focus({ preventScroll: true }); keepVisible(f); } return; }
    if (t.classList && t.classList.contains("head")) {
      var hs = heads(), i = hs.indexOf(t), n = null;
      if (ev.key === "ArrowDown") n = hs[Math.min(i + 1, hs.length - 1)];
      else if (ev.key === "ArrowUp") { if (i === 0) { ev.preventDefault(); qEl.focus(); return; } n = hs[i - 1]; }
      else if (ev.key === "Home") n = hs[0];
      else if (ev.key === "End") n = hs[hs.length - 1];
      if (n) { ev.preventDefault(); n.focus({ preventScroll: true }); keepVisible(n); }
    }
  });
  function keepVisible(el) {
    var li = el.parentNode, r = el.getBoundingClientRect(), top = chrome(li);
    if (r.top < top) window.scrollBy(0, r.top - top);
    else if (r.bottom > innerHeight - bottomChrome() - 10) window.scrollBy(0, r.bottom - innerHeight + bottomChrome() + 10);
  }

  /* ---------- layout vars, misc ---------- */
  function setVars() {
    var bt = topEl.offsetHeight, cbh = ctlEl.offsetHeight;
    var bb = phone.matches ? cbh + railEl.offsetHeight : cbh; // bottom chrome: controls (+ room strip on phones)
    var rs = root.style;
    var st = phone.matches ? 0 : bt; // on phones the title bar scrolls away
    rs.setProperty("--bt", bt + "px"); rs.setProperty("--st", st + "px");
    qEl.placeholder = phone.matches ? "Search" : "Search name, host, text";
    rs.setProperty("--cbh", cbh + "px"); rs.setProperty("--bb", bb + "px");
  }
  var rzT = 0;
  function onResize() { setVars(); clearTimeout(rzT); rzT = setTimeout(setupSpy, 120); }
  if (window.ResizeObserver) { var ro = new ResizeObserver(setVars); ro.observe(topEl); ro.observe(ctlEl); ro.observe(railEl); }
  window.addEventListener("resize", onResize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setVars(); setupSpy(); });

  var totop = $("#totop");
  window.addEventListener("scroll", function () { totop.classList.toggle("on", scrollY > 500); }, { passive: true });
  totop.addEventListener("click", function () { window.scrollTo(0, 0); qEl.blur(); });

  function onNav() {
    if ((location.hash || "") === lastHash) return;
    lastHash = location.hash || "";
    var prevRoom = state.room;
    readHash(); render();
    if (state.room) jumpTo(state.room, true);
    if (window.R4Suggest) window.R4Suggest.sync(state.suggest);
  }
  window.addEventListener("popstate", onNav);
  window.addEventListener("hashchange", onNav);

  /* ---------- hooks for submit.js (the suggestion form) ---------- */
  function showEntry(id) { // close any search, open that row and scroll to it
    var e = byId[id]; if (!e) return;
    state.q = ""; state.open = id; state.room = e.room; pinned = true;
    render(); jumpTo(e.room, true);
    var tries = 0, go = function () {
      var h = headOf(id); if (!h) return;
      reveal(h.parentNode); h.focus({ preventScroll: true });
      if (++tries < 3) setTimeout(go, 160);
    };
    setTimeout(go, 120);
  }
  window.R4 = {
    getSuggest: function () { return state.suggest; },
    setSuggest: function (v) { state.suggest = v; writeHash(); },
    showEntry: showEntry
  };
  rowsEl.addEventListener("click", function (ev) {
    var c = ev.target.closest(".sgcta");
    if (c && window.R4Suggest) window.R4Suggest.open({ room: c.dataset.room, trigger: c });
  });

  /* ---------- go ---------- */
  applyTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light", false);
  buildRail();
  readHash();
  setVars();
  render();
  lastHash = location.hash || "";
  if (state.room) {
    jumpTo(state.room, true);
    var again = function () { if (!userInput && state.room) jumpTo(state.room, true); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(again);
    window.addEventListener("load", again);
  }
  if (state.open) { var hh = headOf(state.open); if (hh) setTimeout(function () { reveal(hh.parentNode); }, 50); }
})();
