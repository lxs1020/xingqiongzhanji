/* item.js —— 掉落道具 P/S/B/M/coin/magnet，全局 NS.Item */
(function () {
'use strict';
window.NS = window.NS || {};
const { rand, TAU, chance } = NS.U;

const META = {
  P:      { color:'#FF9500', label:'P' },
  S:      { color:'#4D7CFE', label:'S' },
  B:      { color:'#FF3131', label:'B' },
  M:      { color:'#B537F2', label:'M' },
  coin:   { color:'#FFD700', label:'¥' },
  magnet: { color:'#E6F1FF', label:'U' }
};

class Item {
  constructor(kind, x, y, value) {
    this.kind = kind; this.x = x; this.y = y;
    this.vx = 0; this.vy = NS.CONFIG.drop.fallSpeed;
    this.r = 12; this.alive = true;
    this.t = rand(TAU); this.life = NS.CONFIG.drop.itemLife;
    this.value = value || 0;
    this.attracted = false;
  }

  update(dt, g) {
    this.t += dt * 3;
    this.life -= dt;
    const pr = g.player;
    const radius = NS.CONFIG.magnetRadii[NS.Save.upgrades.magnet];
    const near = NS.U.dist2(this.x, this.y, pr.x, pr.y) < radius * radius || g.magnetTimer > 0;
    if (near && pr.alive) {
      // 磁吸
      const a = NS.U.angTo(this.x, this.y, pr.x, pr.y);
      const pull = 320;
      this.vx = Math.cos(a) * pull; this.vy = Math.sin(a) * pull;
      this.attracted = true;
    } else if (!this.attracted) {
      this.vx = Math.sin(this.t) * 30;
      this.vy = NS.CONFIG.drop.fallSpeed;
    }
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (this.y > 830 || this.life <= 0) this.alive = false;
  }

  render(ctx) {
    const m = META[this.kind];
    const blink = this.life < 2 ? (Math.sin(this.t * 10) > 0 ? 0.35 : 1) : 1;
    ctx.globalAlpha = blink;
    ctx.shadowColor = m.color; ctx.shadowBlur = 12;
    ctx.strokeStyle = m.color; ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(5,10,28,0.85)';
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = m.color;
    ctx.font = 'bold 13px Segoe UI, sans-serif'; ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 6;
    ctx.fillText(m.label, this.x, this.y + 1);
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    ctx.textBaseline = 'alphabetic';
  }
}

/* 掉落判定：g.spawnDrop(x,y,rate,forceKind) */
NS.rollDrop = function (g, x, y, rate, forceKind) {
  if (g.items.length >= NS.CONFIG.caps.item) return;
  let kind = forceKind || null;
  if (!kind && chance(rate)) {
    const table = NS.CONFIG.drop.table;
    let total = 0; for (const [, w] of table) total += w;
    let roll = rand(total);
    for (const [k, w] of table) { roll -= w; if (roll <= 0) { kind = k; break; } }
  }
  if (!kind) return;
  let value = 0;
  if (kind === 'coin') value = NS.U.choice(NS.CONFIG.drop.coinValue);
  g.items.push(new Item(kind, x, y, value));
};

NS.Item = Item;
NS.ITEM_META = META;
})();
