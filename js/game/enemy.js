/* enemy.js —— 7 种敌机及行为 AI，全局 NS.Enemy */
(function () {
'use strict';
window.NS = window.NS || {};
const { angTo, rand, TAU, clamp, dist } = NS.U;

class Enemy {
  // tier: 0=普通 1=精英 2=强化（血量/体型/外观随档位提升）；tierHpMul: 高档额外血量倍率
  constructor(kind, x, y, hpScale = 1, tier = 0, tierHpMul = 1) {
    const cfg = NS.CONFIG.enemies[kind];
    this.kind = kind; this.cfg = cfg;
    this.tier = clamp(tier, 0, cfg.tiers.length - 1);
    const T = cfg.tiers[this.tier];
    this.rMul = T.rMul;
    this.x = x; this.y = y; this.r = cfg.r * T.rMul;
    this.hp = Math.round(cfg.hp * T.hpMul * hpScale * tierHpMul);
    this.maxHp = this.hp;
    // tier 0(普通)速度不变；tier 1/2(精英/强化)速度 ×0.85
    this.speed = cfg.speed * (this.tier === 0 ? 1 : 0.85) * (0.95 + 0.1 * hpScale);
    this.color = T.color || cfg.color;
    this.score = Math.round(cfg.score * (1 + this.tier));
    this.alive = true; this.t = 0;
    this.fireT = rand(0.5, 2);
    this.phase = 'enter';
    this.spawned = 0; this.hoverT = 0;
    this.vx = 0; this.vy = cfg.speed;
    this.hitFlash = 0;
    this.seed = rand(TAU);
  }

  // 精英盾卫正面减伤：子弹从下方 120° 锥内打来 → 减伤 90%
  dmgMod(sx, sy) {
    if (this.kind !== 'guard') return 1;
    const a = angTo(this.x, this.y, sx, sy);
    let d = Math.abs(a - Math.PI / 2);
    if (d > Math.PI) d = TAU - d;
    return d < Math.PI / 3 ? 0.1 : 1;
  }

  // 朝玩家开火
  _aim(g, speed, spread = 0) {
    const a0 = angTo(this.x, this.y, g.player.x, g.player.y);
    NS.B.e(g, this.x, this.y + this.r, a0 + spread, speed * g.diff);
  }

  update(dt, g) {
    this.t += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    const p = g.player;

    switch (this.kind) {
      case 'scout':
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        break;

      case 'striker':
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.fireT -= dt;
        if (this.fireT <= 0 && this.y > 0 && this.y < 500 && p.alive) {
          this.fireT = 2;
          this._aim(g, 220);
        }
        break;

      case 'spreader':
        if (this.phase === 'enter') {
          this.y += this.speed * dt;
          if (this.y >= 150) { this.phase = 'hover'; this.hoverT = 1.5; this.vy = 0; this.fireT = 0.8; }
        } else if (this.phase === 'hover') {
          this.hoverT -= dt;
          this.fireT -= dt;
          if (this.fireT <= 0 && !this.fired) {
            this.fired = true;
            const base = angTo(this.x, this.y, p.x, p.y);
            for (const off of [-0.26, 0, 0.26])
              NS.B.e(g, this.x, this.y + this.r, base + off, 180 * g.diff);
          }
          if (this.hoverT <= 0) this.phase = 'dive';
        } else {
          this.y += this.speed * 2.2 * dt;
        }
        break;

      case 'hunter': {
        // S 形逼近
        this.vx = Math.sin(this.t * 3 + this.seed) * 130;
        if (p.alive) this.vx += clamp((p.x - this.x) * 0.5, -60, 60);
        this.x += this.vx * dt;
        this.y += this.speed * dt;
        this.x = clamp(this.x, 20, 460);
        this.fireT -= dt;
        if (this.fireT <= 0 && this.y > 0 && this.y < 520 && p.alive) {
          this.fireT = 2.2;
          for (const off of [-0.12, 0.12])
            NS.B.e(g, this.x, this.y + this.r, angTo(this.x, this.y, p.x, p.y) + off,
              170 * g.diff, { htime: 2, turn: 1.05, color: '#C724B1' });
        }
        break;
      }

      case 'kamikaze': {
        const d = dist(this.x, this.y, p.x, p.y);
        if (p.alive && d < 300) {
          const a = angTo(this.x, this.y, p.x, p.y);
          this.vx = Math.cos(a) * 420; this.vy = Math.sin(a) * 420;
        } else {
          this.vx = 0; this.vy = this.speed;
        }
        this.x += this.vx * dt; this.y += this.vy * dt;
        break;
      }

      case 'carrier':
        if (this.y < 90) { this.y += this.speed * dt; }
        else {
          if (this.vx === 0) this.vx = this.speed;
          this.x += this.vx * dt;
          if (this.x < 60) this.vx = Math.abs(this.vx);
          if (this.x > 420) this.vx = -Math.abs(this.vx);
          this.fireT -= dt;
          if (this.fireT <= 0 && this.spawned < 8) {
            this.fireT = 2.5; this.spawned += 2;
            for (const ox of [-24, 24]) {
              if (g.enemies.length < NS.CONFIG.caps.enemy)
                g.spawnEnemyAt('scout', clamp(this.x + ox, 20, 460), this.y + 30);
            }
          }
        }
        if (this.t > 16) this.alive = false;
        break;

      case 'guard':
        if (this.y < 200) { this.y += this.speed * dt; }
        else if (p.alive) {
          this.x += clamp((p.x - this.x) * 0.6, -50, 50) * dt;
          this.fireT -= dt;
          if (this.fireT <= 0) {
            this.fireT = 1.6;
            const base = angTo(this.x, this.y, p.x, p.y);
            for (const off of [-0.3, 0, 0.3])
              NS.B.e(g, this.x, this.y + this.r, base + off, 190 * g.diff, { color: '#B537F2' });
          }
        }
        break;
    }

    if (this.y > 860 || this.x < -80 || this.x > 560) this.alive = false;
  }

  render(ctx) {
    const flash = this.hitFlash > 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.rMul, this.rMul);   // 高血量档位体型更大
    ctx.shadowColor = this.color; ctx.shadowBlur = 10 + this.tier * 4;
    ctx.strokeStyle = flash ? '#FFFFFF' : this.color;
    ctx.fillStyle = flash ? 'rgba(255,255,255,.6)' : 'rgba(20,6,24,.9)';
    ctx.lineWidth = 2;

    switch (this.kind) {
      case 'scout':
        ctx.rotate(Math.PI);
        ctx.beginPath(); ctx.moveTo(0,-12); ctx.lineTo(10,10); ctx.lineTo(-10,10); ctx.closePath();
        break;
      case 'striker':
        ctx.rotate(Math.PI);
        ctx.beginPath(); ctx.moveTo(0,-14); ctx.lineTo(8,8); ctx.lineTo(0,3); ctx.lineTo(-8,8); ctx.closePath();
        break;
      case 'spreader':
        ctx.rotate(Math.PI);
        ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(20,4); ctx.lineTo(14,12); ctx.lineTo(-14,12); ctx.lineTo(-20,4); ctx.closePath();
        break;
      case 'hunter':
        ctx.beginPath(); ctx.moveTo(0,14); ctx.lineTo(6,0); ctx.lineTo(0,-14); ctx.lineTo(-6,0); ctx.closePath();
        break;
      case 'kamikaze': {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * TAU + this.t * 1.5;
          const rr = i % 2 ? 8 : 14;
          ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath();
        break;
      }
      case 'carrier':
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = i / 6 * TAU;
          ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 34, Math.sin(a) * 22);
        }
        ctx.closePath();
        break;
      case 'guard':
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = i / 6 * TAU + Math.PI / 6;
          ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 20, Math.sin(a) * 20);
        }
        ctx.closePath();
        break;
    }
    ctx.fill(); ctx.stroke();

    // 核心光点（血量档位越高核心越大越亮）
    ctx.fillStyle = flash ? '#FFF' : this.color;
    ctx.beginPath(); ctx.arc(0, 0, 3 + this.tier, 0, TAU); ctx.fill();
    if (this.tier >= 2) {
      ctx.fillStyle = '#FFF';
      ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, TAU); ctx.fill();
    }

    // 高血量档位装甲环：精英单环 / 强化金双环
    if (this.tier >= 1) {
      const rr = this.r / this.rMul + 5;
      ctx.shadowBlur = 6; ctx.shadowColor = this.color;
      ctx.strokeStyle = this.tier >= 2 ? '#FFD700' : this.color;
      ctx.globalAlpha = 0.75; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke();
      if (this.tier >= 2) {
        ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.arc(0, 0, rr + 3.5, 0, TAU); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // 精英/强化敌机：迷你血条
    if (this.tier >= 1 && this.hp < this.maxHp) {
      const w = this.r * 1.6, ratio = this.hp / this.maxHp;
      ctx.fillStyle = 'rgba(10,16,40,.8)';
      ctx.fillRect(this.x - w / 2, this.y - this.r - 9, w, 3.5);
      ctx.fillStyle = this.tier >= 2 ? '#FFD700' : this.color;
      ctx.fillRect(this.x - w / 2, this.y - this.r - 9, w * ratio, 3.5);
    }

    // 精英盾卫：正面能量护盾弧
    if (this.kind === 'guard') {
      ctx.strokeStyle = 'rgba(77,124,254,.8)';
      ctx.shadowColor = '#4D7CFE'; ctx.shadowBlur = 10; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(this.x, this.y, 27 * this.rMul, Math.PI / 2 - Math.PI / 3, Math.PI / 2 + Math.PI / 3);
      ctx.stroke(); ctx.shadowBlur = 0;
    }
  }
}

/* 自爆蜂自爆：8 向弹 */
NS.kamikazeBurst = function (g, e) {
  for (let i = 0; i < 8; i++)
    NS.B.e(g, e.x, e.y, i / 8 * TAU, 150 * g.diff, { color: '#FF6A3D', r: 5 });
};

NS.Enemy = Enemy;
})();
