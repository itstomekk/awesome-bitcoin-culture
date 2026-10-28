(function () {
  "use strict";
  var A = window.ABC;
  var $ = function (s) { return document.querySelector(s); };
  var root = document.documentElement;
  var rowsEl = $("#rows"), railEl = $("#rail"), railItems = $("#railItems"), qEl = $("#q");
  var topEl = $("#top"), ctlEl = $("#ctl"), themeEl = $("#theme");
  var byId = {};
  A.entries.forEach(function (e) { byId[e.id] = e; });
  var roomIdx = {};
  A.rooms.forEach(function (r, i) { roomIdx[r.id] = i; });
  var SUB_ORDER = {}; // README subsection order per room (entries arrive in README order)
  A.entries.forEach(function (e) { var a = (SUB_ORDER[e.room] = SUB_ORDER[e.room] || []); if (a.indexOf(e.sub || "") < 0) a.push(e.sub || ""); });

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
    var c = b && b.alt ? null : hexHsl(e.color); // a mini-gallery work: its own accent, not the main picture's colour
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
  // banner picture: entries with a mini gallery show a different one of their works each day (same for every visitor that day)
  function dayIdx(e, n) { return n > 1 ? A.hash(dayKey() + ":" + e.id) % n : 0; }
  function bannerOf(e) {
    if (!e.wk) return bestOf(e);
    var it = galItems(e), i = dayIdx(e, it.length);
    return { src: it[i].src, kind: "og", alt: it[i].src.indexOf(WK) === 0 };
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
    var b = bannerOf(e), kind = el.dataset.kind;
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
    var raw = location.hash.replace(/^#/, "");
    try { raw = decodeURIComponent(raw); } catch (_) { /* keep as is */ }
    if (byId.hasOwnProperty(raw)) raw = "open=" + raw; // short entry anchor: #tj-murphy
    var p = new URLSearchParams(raw);
    var r = (p.get("room") || "").split(",")[0];
    state.room = roomIdx.hasOwnProperty(r) ? r : null;
    pinned = !!state.room;
    state.q = p.get("q") || "";
    state.open = p.get("open") || null;
    if (state.open && !byId.hasOwnProperty(state.open)) state.open = null;
    if (state.open && !state.q) { state.room = byId[state.open].room; pinned = true; }
    state.suggest = p.has("suggest") ? (p.get("suggest") || "") : null;
  }
  function hashString() {
    var p = [];
    // one open entry and nothing else: the short anchor (#tj-murphy)
    if (state.open && !state.q && state.sort !== "shuffle" && state.img && state.suggest === null) return "#" + state.open;
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
  var SOC = [
    ["x", "X", "0 0 24 24", "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"],
    ["instagram", "Instagram", "0 0 24 24", "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"],
    ["youtube", "YouTube", "0 0 24 24", "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"],
    ["nostr", "Nostr", "46 40 170 170", "M210.8 199.4c0 3.1-2.5 5.7-5.7 5.7h-68c-3.1 0-5.7-2.5-5.7-5.7v-15.5c.3-19 2.3-37.2 6.5-45.5 2.5-5 6.7-7.7 11.5-9.1 9.1-2.7 24.9-.9 31.7-1.2 0 0 20.4.8 20.4-10.7s-9.1-8.6-9.1-8.6c-10 .3-17.7-.4-22.6-2.4-8.3-3.3-8.6-9.2-8.6-11.2-.4-23.1-34.5-25.9-64.5-20.1-32.8 6.2.4 53.3.4 116.1v8.4c0 3.1-2.6 5.6-5.7 5.6H57.7c-3.1 0-5.7-2.5-5.7-5.7v-144c0-3.1 2.5-5.7 5.7-5.7h31.7c3.1 0 5.7 2.5 5.7 5.7 0 4.7 5.2 7.2 9 4.5 11.4-8.2 26-12.5 42.4-12.5 36.6 0 64.4 21.4 64.4 68.7v83.2ZM150 99.3c0-6.7-5.4-12.1-12.1-12.1s-12.1 5.4-12.1 12.1 5.4 12.1 12.1 12.1S150 106 150 99.3Z"]
  ];
  function socIcon(s) { return '<svg viewBox="' + s[2] + '" aria-hidden="true" focusable="false"><path d="' + s[3] + '"/></svg>'; }
  // social icons on the row head: inside the head <button>, so they are spans opened by the click handler; the panel has real links
  function socHtml(e) {
    if (!e.soc) return "";
    var h = "";
    SOC.forEach(function (s) { var u = e.soc[s[0]]; if (u) h += '<span class="si" data-href="' + A.esc(u) + '" title="' + A.esc(e.name + " on " + s[1]) + '">' + socIcon(s) + "</span>"; });
    return h ? '<span class="soc">' + h + "</span>" : "";
  }
  function socLinks(e) {
    if (!e.soc) return "";
    var h = "";
    SOC.forEach(function (s) { var u = e.soc[s[0]]; if (u) h += '<a class="sl" href="' + A.esc(u) + '" target="_blank" rel="noopener me" aria-label="' + A.esc(e.name + " on " + s[1]) + '">' + socIcon(s) + "<span>" + s[1] + "</span></a>"; });
    return h ? '<div><dt>Social</dt><dd class="socl">' + h + "</dd></div>" : "";
  }
  function rowHtml(e) {
    var b = bannerOf(e), kind = b ? b.kind : "gen";
    var open = state.open === e.id;
    var dk = b && kind !== "icon" && lumOf(e, b) < DK ? ' data-dk="1"' : "";
    var lab = e.sub || e.section;
    return '<li class="row' + (open ? " is-open" : "") + '" data-id="' + A.esc(e.id) + '" data-kind="' + kind + '"' + dk + ">" +
      '<button type="button" class="head" id="h-' + A.esc(e.id) + '" aria-expanded="' + open + '" aria-controls="p-' + A.esc(e.id) + '">' +
      (state.img ? '<span class="bn" aria-hidden="true" data-id="' + A.esc(e.id) + '" data-kind="' + kind + '" style="' + A.esc(bnStyle(e, b)) + '"></span>' : "") +
      '<span class="name" style="--c:' + Math.max(7, e.name.length) + '">' + A.esc(e.name) + "</span>" +
      '<span class="meta"><b class="c" title="' + A.esc(lab) + '">' + A.esc(lab) + '</b><span class="c host">' + A.esc(e.host) + "</span>" + socHtml(e) + "</span>" +
      '<span class="pm" aria-hidden="true"></span></button>' +
      '<div class="panel" id="p-' + A.esc(e.id) + '" role="region" aria-labelledby="h-' + A.esc(e.id) + '"' + (open ? "" : " hidden") + ">" + (open ? panelHtml(e) : "") + "</div></li>";
  }
  function panelPic(e) {
    var b = bestOf(e);
    if (e.wk) return galPic(e, b);
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
  /* ---------- mini gallery: main picture + up to 4 more works (data/works.json) ---------- */
  var WK = "../shared/works/";
  function galItems(e) { // the main picture leads when it is real art (wide, or a large square); logos and site snapshots are left out
    var b = bestOf(e), out = [];
    if (b && b.kind === "og") out.push({ src: b.src, th: b.src, w: e.w, h: e.h });
    else if (e.img && e.w >= 500) out.push({ src: A.src(e), th: A.src(e), w: e.w, h: e.h });
    e.wk.forEach(function (x) { out.push({ src: WK + x[0], th: WK + x[0].replace(/\.webp$/, ".t.webp"), w: x[1], h: x[2] }); });
    return out;
  }
  function galPic(e) {
    var it = galItems(e), n = it.length, s = dayIdx(e, n), f = it[s]; // opens on the banner's picture of the day
    var h = '<div class="shot gm"><button type="button" class="gz" data-gi="' + s + '" aria-label="Enlarge picture ' + (s + 1) + " of " + n + '">' +
      '<img src="' + A.esc(f.src) + '" alt="' + A.esc(e.name + ", work " + (s + 1) + " of " + n) + '" decoding="async" width="' + f.w + '" height="' + f.h + '"></button></div>' +
      '<div class="thumbs">';
    it.forEach(function (x, i) {
      h += '<button type="button" class="th' + (i === s ? " on" : "") + '" data-gi="' + i + '" aria-label="Show work ' + (i + 1) + " of " + n + '"' + (i === s ? ' aria-current="true"' : "") + ">" +
        '<img src="' + A.esc(x.th) + '" alt="" loading="lazy" decoding="async"></button>';
    });
    return h + "</div>";
  }
  function galShow(li, i) {
    var e = byId[li.dataset.id], it = galItems(e), x = it[i]; if (!x) return;
    var z = li.querySelector(".gz"), img = z.querySelector("img");
    img.src = x.src; img.width = x.w; img.height = x.h; img.alt = e.name + ", work " + (i + 1) + " of " + it.length;
    z.dataset.gi = i; z.setAttribute("aria-label", "Enlarge picture " + (i + 1) + " of " + it.length);
    Array.prototype.forEach.call(li.querySelectorAll(".th"), function (t, k) {
      t.classList.toggle("on", k === i);
      if (k === i) t.setAttribute("aria-current", "true"); else t.removeAttribute("aria-current");
    });
  }
  // full-screen viewer
  var lb = null, lbAt = { id: null, i: 0, from: null };
  function lbDraw() {
    var e = byId[lbAt.id], it = galItems(e), x = it[lbAt.i];
    var img = lb.querySelector("img");
    img.src = x.src; img.alt = e.name + ", work " + (lbAt.i + 1) + " of " + it.length;
    lb.querySelector(".lbn").textContent = e.name + "  " + (lbAt.i + 1) + " / " + it.length;
  }
  function lbOpen(id, i, from) {
    if (!lb) {
      lb = document.createElement("div");
      lb.id = "lb"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Picture viewer");
      lb.innerHTML = '<img alt=""><p class="lbn"></p>' +
        '<button type="button" class="lbp" aria-label="Previous picture">&#8249;</button>' +
        '<button type="button" class="lbx" aria-label="Close viewer">&#215;</button>' +
        '<button type="button" class="lbf" aria-label="Next picture">&#8250;</button>';
      document.body.appendChild(lb);
      lb.addEventListener("click", function (ev) {
        if (ev.target.closest(".lbp")) lbStep(-1);
        else if (ev.target.closest(".lbf")) lbStep(1);
        else if (ev.target.tagName !== "IMG") lbClose();
      });
    }
    lbAt = { id: id, i: i, from: from };
    lbDraw();
    lb.hidden = false; root.classList.add("lb-open");
    lb.querySelector(".lbx").focus();
  }
  function lbStep(d) { var n = galItems(byId[lbAt.id]).length; lbAt.i = (lbAt.i + d + n) % n; lbDraw(); }
  function lbClose() {
    lb.hidden = true; root.classList.remove("lb-open");
    var li = rowsEl.querySelector('.row[data-id="' + lbAt.id + '"]');
    if (li) galShow(li, lbAt.i); // the panel follows what was viewed last
    if (lbAt.from && document.contains(lbAt.from)) lbAt.from.focus();
  }
  // capture phase: while the viewer is open no other shortcut (Escape closing the panel, T, R, /) runs
  window.addEventListener("keydown", function (ev) {
    if (!lb || lb.hidden) return;
    if (ev.key === "Escape") lbClose();
    else if (ev.key === "ArrowLeft") lbStep(-1);
    else if (ev.key === "ArrowRight") lbStep(1);
    else if (ev.key === "Tab") { // keep focus inside the viewer
      var bs = lb.querySelectorAll("button"), k = Array.prototype.indexOf.call(bs, document.activeElement);
      bs[(k + (ev.shiftKey ? bs.length - 1 : 1)) % bs.length].focus();
    } else return;
    ev.preventDefault(); ev.stopImmediatePropagation();
  }, true);

  function panelHtml(e) {
    var room = A.roomById[e.room];
    return '<div class="pin"><figure class="fig">' + panelPic(e) + "</figure>" +
      '<div class="info"><p class="desc">' + A.esc(e.desc) + "</p>" +
      '<dl class="facts"><div><dt>Room</dt><dd>' + A.esc(room.label) + "</dd></div>" +
      (e.sub ? "<div><dt>Section</dt><dd>" + A.esc(e.sub) + "</dd></div>" : "") +
      '<div><dt>Host</dt><dd class="l">' + A.esc(e.host) + "</dd></div>" + socLinks(e) + "</dl>" +
      '<a class="open" href="' + A.esc(A.out(e.url)) + '" target="_blank" rel="noopener">Open work &#8599;</a>' +
      '<a class="cplink" href="#' + A.esc(e.id) + '" data-copy="' + A.esc(e.id) + '">Copy link</a></div></div>';
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
          '<span class="gc">' + g.length + "<em>" + (g.length === r.count ? "works" : "of " + r.count) + "</em></span></h2>";
        var bySub = {};
        g.forEach(function (e) { (bySub[e.sub || ""] = bySub[e.sub || ""] || []).push(e); });
        (SUB_ORDER[r.id] || [""]).forEach(function (sn) {
          var ge = bySub[sn]; if (!ge) return;
          if (sn) html += '<h3 class="sub">' + A.esc(sn) + "<em>" + ge.length + "</em></h3>";
          html += "<ol>";
          ge.forEach(function (e) { html += rowHtml(e); });
          html += "</ol>";
        });
        html += '<button type="button" class="sgcta" data-room="' + r.id + '"><span class="q">Missing something in ' + A.esc(r.label) + '?</span><span class="a">Suggest an entry <b aria-hidden="true">+</b></span></button></section>';
      });
    }
    rowsEl.innerHTML = html;
    if (state.room && !counts[state.room]) state.room = null;
    syncControls();
    observeBanners();
    setupSpy();
  }
  function syncControls() {
    if (qEl.value !== state.q) qEl.value = state.q;
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
  var aim = null; // entry id a deep link (#tj-murphy) should land on; cleared by user input
  function holdLock(ms) {
    lock = true; clearTimeout(lockT);
    lockT = setTimeout(releaseLock, ms || 200);
  }
  function releaseLock() {
    var sec = state.room && document.getElementById("room-" + state.room);
    var ah = aim && headOf(aim), ali = ah && ah.parentNode;
    if ((ali || sec) && driftTries < 5) { // rows above the target are not rendered yet, so correct any estimate drift
      var d = ali ? ali.getBoundingClientRect().top - chrome(ali) : sec.getBoundingClientRect().top - stickTop();
      if (Math.abs(d) > 3) { driftTries++; window.scrollBy({ top: d, behavior: "auto" }); holdLock(120); return; }
    }
    lock = false; driftTries = 0;
    resolveSpy();
  }
  window.addEventListener("scroll", function () { if (lock) { clearTimeout(lockT); lockT = setTimeout(releaseLock, 150); } }, { passive: true });
  ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (t) { window.addEventListener(t, function () { userInput = true; aim = null; }, { passive: true }); });

  function jumpTo(id, instant) {
    var sec = document.getElementById("room-" + id); if (!sec) return;
    aim = null;
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
    var si = ev.target.closest(".si");
    if (si) { ev.preventDefault(); ev.stopPropagation(); window.open(si.dataset.href, "_blank", "noopener"); return; }
    var cp = ev.target.closest(".cplink");
    var th = ev.target.closest(".th");
    if (th) { galShow(th.closest(".row"), +th.dataset.gi); return; }
    var gz = ev.target.closest(".gz");
    if (gz) { lbOpen(gz.closest(".row").dataset.id, +gz.dataset.gi, gz); return; }
    if (cp) {
      ev.preventDefault();
      // share the /a/<id>/ page (has its own preview card, then forwards to #<id>); local file previews keep '#'
      var u = /^https?:$/.test(location.protocol) ? location.origin + "/a/" + cp.dataset.copy + "/" : location.href.split("#")[0] + "#" + cp.dataset.copy;
      var done = function () { cp.textContent = "Link copied"; setTimeout(function () { cp.textContent = "Copy link"; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(done, function () { window.prompt("Link", u); });
      else window.prompt("Link", u);
      return;
    }
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
  // an opened entry always lands with its name row just under the sticky chrome
  function reveal(li) {
    var align = function () {
      var dy = li.getBoundingClientRect().top - chrome(li);
      if (Math.abs(dy) > 1) window.scrollBy(0, dy);
    };
    align();
    requestAnimationFrame(align); // again after the closed panel and new panel settle
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
    // floor, not offsetHeight's rounding: a 54.67px bar must give 54, or a sub-pixel gap shows under it
    var bt = Math.floor(topEl.getBoundingClientRect().height), cbh = Math.floor(ctlEl.getBoundingClientRect().height);
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

  /* phones: the title bar (with search) hides while scrolling down and comes back on scrolling up */
  var lastY = window.scrollY, topHid = false;
  function hideTop(h) { if (h !== topHid) { topHid = h; root.classList.toggle("tophid", h); } }
  window.addEventListener("scroll", function () {
    var y = window.scrollY, dy = y - lastY; lastY = y;
    if (!phone.matches || y < topEl.offsetHeight || document.activeElement === qEl) hideTop(false);
    else if (lock || dy > 4) hideTop(true);   // reading down, or a jump to a room/entry
    else if (dy < -4) hideTop(false);
  }, { passive: true });
  qEl.addEventListener("focus", function () { hideTop(false); });
  totop.addEventListener("click", function () { window.scrollTo(0, 0); qEl.blur(); });

  function onNav() {
    if ((location.hash || "") === lastHash) return;
    lastHash = location.hash || "";
    var prevRoom = state.room;
    readHash(); render();
    if (state.open) showEntry(state.open);
    else if (state.room) jumpTo(state.room, true);
    if (window.R4Suggest) window.R4Suggest.sync(state.suggest);
  }
  window.addEventListener("popstate", onNav);
  window.addEventListener("hashchange", onNav);

  /* ---------- hooks for submit.js (the suggestion form) ---------- */
  function showEntry(id) { // close any search, open that row and scroll to it
    var e = byId[id]; if (!e) return;
    state.q = ""; state.open = id; state.room = e.room; pinned = true;
    render(); jumpTo(e.room, true);
    aim = id; // releaseLock keeps correcting toward this row until layout settles
    var tries = 0, go = function () {
      var h = headOf(id); if (!h || aim !== id) return;
      var li = h.parentNode;
      driftTries = 0; holdLock(120);
      window.scrollBy(0, li.getBoundingClientRect().top - chrome(li));
      h.focus({ preventScroll: true });
      if (++tries < 3) setTimeout(go, 160);
    };
    setTimeout(go, 120);
  }
  window.R4 = {
    getSuggest: function () { return state.suggest; },
    setSuggest: function (v) { state.suggest = v; writeHash(); },
    showEntry: showEntry
  };
  /* ---------- discover: artist of the day (data/featured.json schedule) and a random entry ---------- */
  function dayKey() {
    var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  function artistOfDay() {
    var k = dayKey(), id = A.featured[k];
    if (id && byId[id]) return id;
    var art = A.entries.filter(function (e) { return e.room === "art"; }); // no scheduled pick: a stable one per day
    return art.length ? art[A.hash(k) % art.length].id : null;
  }
  function randomEntry() {
    var l = A.entries, id;
    do { id = l[Math.floor(Math.random() * l.length)].id; } while (l.length > 1 && id === state.open);
    showEntry(id);
  }
  var aotdEl = $("#aotd"), rndEl = $("#rnd");
  if (aotdEl) {
    var todayId = artistOfDay();
    if (todayId) aotdEl.title = "Artist of the day: " + byId[todayId].name;
    aotdEl.addEventListener("click", function () { var id = artistOfDay(); if (id) showEntry(id); });
  }
  if (rndEl) rndEl.addEventListener("click", randomEntry);
  document.addEventListener("keydown", function (ev) {
    var t = ev.target;
    if ((ev.key === "r" || ev.key === "R") && !ev.metaKey && !ev.ctrlKey && !ev.altKey && t.tagName !== "INPUT" && t.tagName !== "TEXTAREA" && !root.classList.contains("sg-open")) { ev.preventDefault(); randomEntry(); }
  });
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
    var again = function () {
      if (userInput || !state.room) return;
      if (state.open) { if (aim === state.open) showEntry(state.open); }
      else jumpTo(state.room, true);
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(again);
    window.addEventListener("load", again);
  }
  if (state.open) { var oid = state.open; setTimeout(function () { if (!userInput && state.open === oid) showEntry(oid); }, 50); }
})();
