/* particle.js —— 粒子特效（对象池）+ 星空背景，全局 NS.FX / NS.StarField */
(function () {
'use strict';
window.NS = window.NS || {};
const { rand, TAU } = NS.U;

/* ---------------- FX 粒子系统 ---------------- */
class FX {
  constructor() { this.list = []; }
  _spawn(o) {
    const cap = NS.CONFIG.caps.particle;
    if (this.list.length >= cap) this.list.shift();
    this.list.push(o);
  }
  burst(x, y, color, n, speed, life, size) {
    if (NS.Save.settings.quality === 'low') n = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) {
      const a = rand(TAU), s = rand(speed * 0.3, speed);
      this._spawn({ type:'dot', x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s,
        life: rand(life * 0.6, life), max: life, size: rand(size * 0.6, size), color, drag: 2.2 });
    }
  }
  ring(x, y, color, maxR = 40) {
    this._spawn({ type:'ring', x, y, vx:0, vy:0, life:0.35, max:0.35, size:4, maxR, color, drag:0 });
  }
  text(x, y, str, color) {
    this._spawn({ type:'text', x, y, vx:0, vy:-46, life:0.8, max:0.8, size:13, color, text:str, drag:0 });
  }
  // 尾焰
  thruster(x, y, color) {
    this._spawn({ type:'dot', x: x + rand(-2, 2), y, vx:rand(-14, 14), vy:rand(70, 140),
      life:0.3, max:0.3, size:rand(2, 3.5), color, drag:1 });
  }
  smallBoom(x, y) {
    this.burst(x, y, '#FF9500', 20, 200, 0.5, 3.5);
    this.burst(x, y, '#FFD700', 8, 120, 0.35, 2.5);
    this.ring(x, y, '#FFB347', 34);
  }
  bigBoom(x, y) {
    this.burst(x, y, '#FF9500', 40, 280, 0.7, 4);
    this.burst(x, y, '#FFFFFF', 14, 200, 0.4, 3);
    this.ring(x, y, '#FFD700', 60);
    setTimeout(() => this.ring(x, y, '#FF9500', 80), 60);
  }
  update(dt) {
    const a = this.list;
    for (let i = a.length - 1; i >= 0; i--) {
      const p = a[i];
      p.life -= dt;
      if (p.life <= 0) { a.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.drag) { p.vx *= (1 - p.drag * dt); p.vy *= (1 - p.drag * dt); }
    }
  }
  render(ctx) {
    for (const p of this.list) {
      const t = p.life / p.max;
      ctx.globalAlpha = Math.max(0, t);
      if (p.type === 'dot') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * t + 0.4, 0, TAU); ctx.fill();
      } else if (p.type === 'ring') {
        ctx.strokeStyle = p.color; ctx.lineWidth = 2.5 * t;
        ctx.shadowColor = p.color; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.maxR * (1 - t) + 4, 0, TAU); ctx.stroke();
      } else if (p.type === 'text') {
        ctx.font = 'bold 13px Segoe UI, sans-serif';
        ctx.fillStyle = p.color; ctx.textAlign = 'center';
        ctx.shadowColor = p.color; ctx.shadowBlur = 8;
        ctx.fillText(p.text, p.x, p.y);
      }
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }
}

/* ---------------- 三层视差星空 + 透视网格 ---------------- */
class StarField {
  constructor() {
    this.layers = [
      { n: 80, s: 10,  r: 1,   c: 'rgba(180,210,255,0.5)', stars: [] },
      { n: 50, s: 25,  r: 2,   c: 'rgba(200,230,255,0.75)', stars: [] },
      { n: 30, s: 50,  r: 2.6, c: '#00F0FF', glow: true, stars: [] }
    ];
    for (const l of this.layers)
      for (let i = 0; i < l.n; i++) l.stars.push({ x: rand(480), y: rand(800) });
    this.gridOff = 0;
  }
  update(dt, speedMul = 1) {
    for (const l of this.layers) {
      for (const st of l.stars) {
        st.y += l.s * speedMul * dt;
        if (st.y > 800) { st.y = -2; st.x = rand(480); }
      }
    }
    this.gridOff = (this.gridOff + 30 * speedMul * dt) % 60;
  }
  render(ctx, theme) {
    const g = ctx.createLinearGradient(0, 0, 0, 800);
    g.addColorStop(0, NS.CONFIG.colors.bg1);
    g.addColorStop(1, NS.CONFIG.colors.bg0);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 480, 800);

    // 透视网格
    ctx.strokeStyle = 'rgba(0,240,255,0.10)'; ctx.lineWidth = 1;
    ctx.beginPath();
    const cx = 240, hor = 360;
    for (let i = -8; i <= 8; i++) {
      ctx.moveTo(cx + i * 16, hor); ctx.lineTo(cx + i * 90, 800);
    }
    for (let y = hor; y < 800; y += 60) {
      const yy = y + this.gridOff;
      if (yy < 800) { ctx.moveTo(0, yy); ctx.lineTo(480, yy); }
    }
    ctx.stroke();

    // 星星
    for (const l of this.layers) {
      ctx.fillStyle = l.c;
      if (l.glow) { ctx.shadowColor = '#00F0FF'; ctx.shadowBlur = 6; }
      for (const st of l.stars) {
        ctx.beginPath(); ctx.arc(st.x, st.y, l.r, 0, TAU); ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    // 关卡主题雾色（10%）
    if (theme) {
      const tg = ctx.createLinearGradient(0, 0, 0, 800);
      tg.addColorStop(0, theme + '1A');
      tg.addColorStop(1, theme + '08');
      ctx.fillStyle = tg; ctx.fillRect(0, 0, 480, 800);
    }
  }
}

NS.FX = FX;
NS.StarField = StarField;
})();
