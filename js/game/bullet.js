/* bullet.js —— 子弹（玩家/敌方），全局 NS.Bullet / NS.B */
(function () {
'use strict';
window.NS = window.NS || {};
const { angTo, clamp } = NS.U;

class Bullet {
  constructor() { this.alive = false; }
  reset(o) { Object.assign(this, {
    x:0, y:0, vx:0, vy:0, r:5, dmg:1, side:'e', color:'#FF2E88',
    life:6, kind:'orb', pierce:0, splash:0, turn:0, htime:0,
    grazed:false, hits:null, len:10
  }, o); this.alive = true; }

  update(dt, g) {
    // 记录上一帧位置（高速激光防穿透）
    this.px = this.x; this.py = this.y;
    // 追踪
    if (this.htime > 0) {
      let tx, ty;
      if (this.side === 'p') {
        // 玩家导弹：锁最近敌机/Boss
        let best = null, bd = 1e9;
        for (const e of g.enemies) { const d = (e.x-this.x)**2+(e.y-this.y)**2; if (d < bd) { bd = d; best = e; } }
        if (g.boss && g.boss.alive && !g.boss.dying) { const d = (g.boss.x-this.x)**2+(g.boss.y-this.y)**2; if (d < bd) best = g.boss; }
        if (best) { tx = best.x; ty = best.y; }
      } else { tx = g.player.x; ty = g.player.y; }
      if (tx !== undefined) {
        const want = angTo(this.x, this.y, tx, ty);
        let cur = Math.atan2(this.vy, this.vx);
        let diff = want - cur;
        while (diff > Math.PI) diff -= NS.U.TAU;
        while (diff < -Math.PI) diff += NS.U.TAU;
        const sp = Math.hypot(this.vx, this.vy);
        cur += clamp(diff, -this.turn * dt, this.turn * dt);
        this.vx = Math.cos(cur) * sp; this.vy = Math.sin(cur) * sp;
      }
      this.htime -= dt;
    }
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.life -= dt;

    if (this.kind === 'missile') g.fx.thruster(this.x, this.y + 6, '#FF9500');

    if (this.life <= 0 || this.x < -60 || this.x > 540 || this.y < -100 || this.y > 900) this.alive = false;
  }

  render(ctx) {
    ctx.shadowColor = this.color; ctx.shadowBlur = 8;
    if (this.kind === 'laser') {
      // 穿透激光：沿速度方向拉长
      const a = Math.atan2(this.vy, this.vx);
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(a);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-14, -1.6, 28, 3.2);
      ctx.fillStyle = this.color;
      ctx.fillRect(-14, -3.5, 28, 7);
      ctx.restore();
    } else if (this.kind === 'missile') {
      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, NS.U.TAU); ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r * 0.45, 0, NS.U.TAU); ctx.fill();
    } else if (this.side === 'p') {
      // 玩家普通弹：竖向胶囊
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, 3, this.len / 2 + 2, 0, 0, NS.U.TAU);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(this.x, this.y - 1, 1.6, 0, NS.U.TAU); ctx.fill();
    } else {
      // 敌弹：发光圆球
      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, NS.U.TAU); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r * 0.4, 0, NS.U.TAU); ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}

/* 生成辅助 */
NS.B = {
  // 玩家子弹：angle 0 = 正上方
  p(g, x, y, angle, speed, dmg, color, opts = {}) {
    if (g.pbullets.length >= NS.CONFIG.caps.pbullet) return;
    const a = angle - Math.PI / 2;
    const b = g.bulletPool.acquire();
    b.reset(Object.assign({
      x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      r: 4, dmg, side: 'p', color, len: 12
    }, opts));
    if (b.pierce && !opts.hits) b.hits = [];
    g.pbullets.push(b);
  },
  // 敌方子弹
  e(g, x, y, angle, speed, opts = {}) {
    if (g.ebullets.length >= NS.CONFIG.caps.ebullet) return;
    const b = g.bulletPool.acquire();
    b.reset(Object.assign({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      r: 5, dmg: 1, side: 'e', color: NS.CONFIG.colors.magenta
    }, opts));
    g.ebullets.push(b);
  }
};

NS.Bullet = Bullet;
})();
