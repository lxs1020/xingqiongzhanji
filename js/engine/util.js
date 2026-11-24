/* util.js —— 数学/随机工具，全局 NS.U */
(function () {
'use strict';
window.NS = window.NS || {};

const U = {
  TAU: Math.PI * 2,
  clamp(v, a, b) { return v < a ? a : (v > b ? b : v); },
  rand(a, b) {
    if (b === undefined) { b = a; a = 0; }
    return a + Math.random() * (b - a);
  },
  randInt(a, b) { return Math.floor(U.rand(a, b + 1)); },
  choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  chance(p) { return Math.random() < p; },
  dist2(x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1; return dx * dx + dy * dy; },
  dist(x1, y1, x2, y2) { return Math.sqrt(U.dist2(x1, y1, x2, y2)); },
  lerp(a, b, t) { return a + (b - a) * t; },
  angTo(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); },
  // 点到线段距离²
  segDist2(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
    t = U.clamp(t, 0, 1);
    const cx = x1 + t * dx, cy = y1 + t * dy;
    return U.dist2(px, py, cx, cy);
  },
  pad(n, len) { return String(n).padStart(len, '0'); },
  // 可注入种子的随机（调试用）
  rng(seed) {
    let s = seed >>> 0;
    return function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
};

NS.U = U;
})();
