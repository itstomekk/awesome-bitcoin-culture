/* Shared helpers for every gallery variant. Pages live one folder below shared/. */
(function () {
  const D = window.ABC_DATA;
  const IMG = "../shared/img/";

  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function rand(seed) { // small deterministic PRNG
    let t = seed >>> 0;
    return function () {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  const byRoom = {};
  D.rooms.forEach((r) => (byRoom[r.id] = D.entries.filter((e) => e.room === r.id)));
  const roomById = Object.fromEntries(D.rooms.map((r) => [r.id, r]));

  window.ABC = {
    rooms: D.rooms,
    entries: D.entries,
    total: D.total,
    byRoom,
    roomById,
    hash, esc, rand,
    src: (e) => (e.img ? IMG + e.img : null),
    // Best available picture: a real wide og:image, else a page snapshot (720x450), else the small icon, else null.
    // kind: 'og' (wide artwork), 'shot' (website snapshot), 'icon' (small/square logo)
    best: (e) => {
      const wide = e.img && e.w >= 400 && e.w / e.h >= 1.15;
      if (wide) return { src: IMG + e.img, kind: "og" };
      if (e.shot) return { src: "../shared/shots/" + e.shot, kind: "shot" };
      if (e.img) return { src: IMG + e.img, kind: "icon" };
      return null;
    },
    initials: (name) => name.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "₿",
    search: (list, q) => {
      q = q.trim().toLowerCase();
      if (!q) return list;
      return list.filter((e) => (e.name + " " + e.desc + " " + e.sub + " " + e.host).toLowerCase().includes(q));
    },
    subs: (list) => [...new Set(list.map((e) => e.sub).filter(Boolean))],
  };
})();
