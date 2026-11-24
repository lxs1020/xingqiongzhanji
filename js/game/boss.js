/* boss.js —— 3 个多阶段 Boss 与弹幕模式，全局 NS.Boss */
/* 弹幕参数严格对应技术文档 5.3；角度单位弧度，0=右，PI/2=下 */
(function () {
'use strict';
window.NS = window.NS || {};
const { rand, randInt, clamp, lerp, angTo, TAU, segDist2 } = NS.U;
const C = () => NS.CONFIG;

class Boss {
  constructor(id, scale = 1) {
    this.id = id;
    this.cfg = C().bosses[id];
    this.scale = scale;
    this.hp = this.maxHp = Math.round(this.cfg.hp * scale);
    this.x = 240; this.y = -150; this.targetY = 120;
    this.r = 46;
    this.alive = true; this.dying = false; this.dead = false;
    this.phase = -1;                 // -1=入场
    this.invT = 0; this.t = 0;
    this.fireT = 0; this.fireT2 = 0; this.reinT = 6;
    this.ringA = 0; this.spinA = 0;
    this.burstT = 0; this.burstOn = true; this.dir = 1;
    this.petal = false;
    this.wallsT = 5;
    this.overloadT = 0; this.overloadCD = 15;
    this.fenceT = 0;
    this.beams = [];
    this.name = this.cfg.name;
    if (id === 'weaver') {
      const w = this.cfg.wingHp * scale;
      this.wings = [{ hp: w, max: w, alive: true }, { hp: w, max: w, alive: true }];
    }
  }

  get ratio() { return clamp(this.hp / this.maxHp, 0, 1); }
  get entered() { return this.phase >= 0; }
  get coreOpen() {
    if (this.id === 'sentinel') return this.phase === 1;
    if (this.id === 'oblivion') return this.overloadT > 0;
    return false;
  }

  hit(g, dmg, sx, sy) {
    if (!this.alive || this.dying || !this.entered || this.invT > 0) return;
    // 编织者：两翼优先承伤
    if (this.id === 'weaver') {
      for (let i = 0; i < 2; i++) {
        const w = this.wings[i];
        if (w.alive && Math.abs(sy - (this.y + 6)) < 38 &&
            Math.abs(sx - (this.x + (i === 0 ? -62 : 62))) < 38) {
          w.hp -= dmg;
          if (w.hp <= 0) {
            w.alive = false;
            g.fx.bigBoom(sx, sy); g.shake(5, 0.25); NS.Audio.boom(true);
          }
          return;
        }
      }
    }
    let d = dmg;
    if (this.coreOpen) d *= (this.id === 'oblivion' ? 3 : 2);
    this.hp -= d;
    this._checkPhase(g);
  }

  _checkPhase(g) {
    const r = this.ratio;
    let want = 0;
    if (r <= 0.4) want = 2;
    else if (r <= 0.7) want = 1;
    if (want > this.phase) {
      this.phase = want;
      this.invT = 1;
      this.beams = [];
      this.fencesOn = false;
      g.clearEnemyBullets();
      g.shake(8, 0.3);
      g.fx.burst(this.x, this.y, this.cfg.color, 30, 260, 0.6, 4);
      g.fx.ring(this.x, this.y, this.cfg.color, 80);
      NS.Audio.phase();
      g.fx.text(this.x, this.y - 50, 'PHASE ' + (want + 1), this.cfg.color);
    }
    if (this.hp <= 0) this._startDie(g);
  }

  _startDie(g) {
    if (this.dying) return;
    this.dying = true; this.dieT = 0; this.explosions = 0;
    this.beams = [];
    g.loop.timeScale = 0.2;
    NS.Audio.bomb();
  }

  /* ---------------- 主更新 ---------------- */
  update(dt, rawDt, g) {
    if (this.dead) return;
    this.t += dt;
    if (this.invT > 0) this.invT -= dt;

    if (this.dying) { this._updateDie(rawDt, g); return; }

    // 入场缓降
    if (this.phase === -1) {
      this.y += 80 * dt;
      if (this.y >= this.targetY) { this.y = this.targetY; this.phase = 0; this.invT = 0.5; }
      return;
    }
    // 小幅悬浮
    this.x = 240 + Math.sin(this.t * 0.8) * 30;

    if (this.id === 'sentinel') this._sentinel(dt, g);
    else if (this.id === 'weaver') this._weaver(dt, g);
    else this._oblivion(dt, g);

    this._updateBeams(dt, g);
  }

  _updateDie(rawDt, g) {
    this.dieT += rawDt;
    const n = Math.min(8, Math.floor(this.dieT / 0.12));
    while (this.explosions < n) {
      this.explosions++;
      const ex = this.x + rand(-70, 70), ey = this.y + rand(-40, 50);
      g.fx.bigBoom(ex, ey);
      NS.Audio.boom(true);
    }
    g.shake(4, 0.1);
    if (this.dieT > 1.1) {
      this.dead = true; this.alive = false;
      g.fx.bigBoom(this.x, this.y);
    }
  }

  /* ============ Boss 1 哨戒者 ============ */
  _sentinel(dt, g) {
    const p = g.player;
    this.reinT -= dt;
    if (this.phase === 0) {
      // 炮塔交替扇形 3 弹
      this.fireT -= dt;
      if (this.fireT <= 0) {
        this.fireT = 0.5;
        this._side = !this._side;
        const tx = this.x + (this._side ? -50 : 50);
        const base = angTo(tx, this.y, p.x, p.y);
        for (const off of [-0.21, 0, 0.21])
          NS.B.e(g, tx, this.y + 12, base + off, 180 * g.diff, { color: '#00F0FF' });
      }
      if (this.reinT <= 0) {
        this.reinT = 6;
        for (let i = 0; i < 3; i++) g.spawnEnemyAt('scout', 60 + i * 180, -20 - i * 30);
      }
    } else if (this.phase === 1) {
      // 旋转环形 16 弹，每波 +7°
      this.fireT -= dt;
      if (this.fireT <= 0) {
        this.fireT = 1.2;
        this.ringA += 0.122;
        for (let i = 0; i < 16; i++)
          NS.B.e(g, this.x, this.y, i / 16 * TAU + this.ringA, 150 * g.diff, { color: '#3DF4FF' });
      }
    } else {
      // 扇形 5 弹压制 + 周期横扫激光
      this.fireT -= dt; this.fireT2 -= dt;
      if (this.fireT <= 0) {
        this.fireT = 0.9;
        const base = angTo(this.x, this.y, p.x, p.y);
        for (const off of [-0.4, -0.2, 0, 0.2, 0.4])
          NS.B.e(g, this.x, this.y + 20, base + off, 190 * g.diff, { color: '#00F0FF' });
      }
      if (this.fireT2 <= 0) {
        this.fireT2 = 7;
        // 两段横扫激光先后扫向中间汇合，各扫 60°
        const mid = Math.PI / 2;
        const half = Math.PI / 3; // 60°
        // 第一段：从左 60° 外扫到中间（左→中）
        this.beams.push({ type:'sweep', x:this.x, y:this.y + 10, delay:0,
          warn:0.8, dur:1.2, w:24, from:mid + half, to:mid, prog:0, len:900 });
        // 第二段：从右 60° 外往左扫到中间（右→中）
        this.beams.push({ type:'sweep', x:this.x, y:this.y + 10, delay:2.6,
          warn:0.8, dur:1.2, w:24, from:mid - half, to:mid, prog:0, len:900 });
        NS.Audio.laser();
      }
    }
  }

  /* ============ Boss 2 编织者 ============ */
  _wingPos(side) { return { x: this.x + side * 62, y: this.y + 6 }; }

  _weaver(dt, g) {
    const p = g.player;
    if (this.phase === 0) {
      this.fireT -= dt;
      if (this.fireT <= 0) {
        this.fireT = 0.6;
        this._side = !this._side;
        const side = this._side ? 1 : -1;
        const idx = side < 0 ? 0 : 1;
        if (this.wings[idx].alive) {
          const wp = this._wingPos(side);
          const base = angTo(wp.x, wp.y, p.x, p.y);
          for (const off of [-0.35, -0.175, 0, 0.175, 0.35])
            NS.B.e(g, wp.x, wp.y, base + off, 200 * g.diff, { color: '#FF5C9E' });
        }
      }
    } else if (this.phase === 1) {
      // 双旋螺旋：6s 开火 / 2s 停歇，每轮反转
      this.burstT -= dt;
      if (this.burstOn) {
        if (this.burstT <= 0) { this.burstT = 2; this.burstOn = false; this.dir *= -1; }
        this.fireT -= dt;
        if (this.fireT <= 0) {
          this.fireT = 0.12;
          this.spinA += 0.139 * this.dir;
          for (let s = 0; s < 2; s++) {
            if (!this.wings[s].alive) continue;
            const wp = this._wingPos(s === 0 ? -1 : 1);
            const a = Math.PI / 2 + (s === 0 ? this.spinA : -this.spinA);
            NS.B.e(g, wp.x, wp.y, a, 160 * g.diff, { color: s ? '#FF2E88' : '#FF8AC0' });
          }
        }
      } else {
        if (this.burstT <= 0) { this.burstT = 6; this.burstOn = true; this.spinA = 0; }
      }
    } else {
      // 随机缺口弹幕墙 + 追踪弹
      this.fireT -= dt; this.fireT2 -= dt;
      if (this.fireT <= 0) {
        this.fireT = 2.2;
        const gaps = [randInt(1, 5), randInt(6, 10)];
        for (let i = 0; i < 12; i++) {
          if (gaps.includes(i)) continue;
          NS.B.e(g, 30 + i * 38, this.y + 30, Math.PI / 2, 140 * g.diff, { color: '#FF2E88', r: 6 });
        }
      }
      if (this.fireT2 <= 0) {
        this.fireT2 = 3;
        const base = angTo(this.x, this.y, p.x, p.y);
        for (const off of [-0.18, 0, 0.18])
          NS.B.e(g, this.x, this.y + 20, base + off, 180 * g.diff,
            { htime: 1.5, turn: 1.4, color: '#C724B1' });
      }
    }
  }

  /* ============ Boss 3 湮灭核心 ============ */
  _oblivion(dt, g) {
    const p = g.player;
    this.fireT -= dt; this.fireT2 -= dt;
    if (this.phase === 0) {
      if (this.fireT <= 0) {
        this.fireT = 1.5; this.ringA += 0.18;
        for (let i = 0; i < 24; i++)
          NS.B.e(g, this.x, this.y, i / 24 * TAU + this.ringA, 150 * g.diff, { color: '#FFD700', r: 5 });
      }
      this.fireT2 -= dt;
      if (this.fireT2 <= 0) {
        this.fireT2 = 2;
        const base = angTo(this.x, this.y, p.x, p.y);
        for (const off of [-0.12, 0, 0.12])
          NS.B.e(g, this.x, this.y + 24, base + off, 240 * g.diff, { color: '#FF6A3D' });
      }
    } else if (this.phase === 1) {
      // 花瓣弹 + 激光栅栏
      if (this.fireT <= 0) {
        this.fireT = 0.9;
        this.petal = !this.petal;
        this.ringA += 0.22;
        const spd = (this.petal ? 130 : 170) * g.diff;
        for (let i = 0; i < 20; i++)
          NS.B.e(g, this.x, this.y, i / 20 * TAU + this.ringA, spd, { color: '#FFD700', r: 5 });
      }
      this._updateFences(dt, g);
    } else {
      // 狂暴：旋转弧弹（45°/s，每 0.08s 四向）+ 弹幕墙 + 追踪弹 + 周期过载弱点
      this.rotA = (this.rotA || 0) + 0.785 * dt;
      this.fireT -= dt;
      if (this.fireT <= 0) {
        this.fireT = 0.08;
        for (let i = 0; i < 4; i++)
          NS.B.e(g, this.x, this.y, this.rotA + i * Math.PI / 2, 165 * g.diff,
            { color: '#FFB347', r: 5 });
      }
      this.wallsT -= dt;
      if (this.wallsT <= 0) {
        this.wallsT = 5;
        const gaps = [randInt(0, 4), randInt(5, 9)];
        for (let i = 0; i < 10; i++) {
          if (gaps.includes(i)) continue;
          NS.B.e(g, 40 + i * 44, this.y + 30, Math.PI / 2, 150 * g.diff, { color: '#FFD700', r: 6 });
        }
      }
      this.fireT2 -= dt;
      if (this.fireT2 <= 0) {
        this.fireT2 = 8;
        const base = angTo(this.x, this.y, p.x, p.y);
        for (const off of [-0.15, 0, 0.15])
          NS.B.e(g, this.x, this.y + 24, base + off, 200 * g.diff,
            { htime: 1.6, turn: 1.5, color: '#FF2E88' });
      }
      // 核心过载窗口
      this.overloadCD -= dt;
      if (this.overloadCD <= 0) { this.overloadT = 3; this.overloadCD = 15;
        g.fx.text(this.x, this.y - 70, 'CORE OVERLOAD ×3', '#FFD700'); NS.Audio.warn(); }
      if (this.overloadT > 0) this.overloadT -= dt;
      this._updateFences(dt, g);
    }
  }

  // 激光栅栏：两侧竖束向中间压缩（留 120px）后张开
  _updateFences(dt, g) {
    if (!this.fencesOn) {
      this.fencesOn = true; this.fenceT = 0;
      this.beams.push({ type:'v', x:40, y:0, warn:1, dur:99, w:16, side:-1 });
      this.beams.push({ type:'v', x:440, y:0, warn:1, dur:99, w:16, side:1 });
      NS.Audio.laser();
    }
    this.fenceT += dt;
    const cyc = this.fenceT % 11;
    let gap;
    if (cyc < 2) gap = lerp(400, 120, cyc / 2);
    else if (cyc < 5) gap = 120;
    else if (cyc < 7) gap = lerp(120, 400, (cyc - 5) / 2);
    else gap = 400;
    for (const b of this.beams) if (b.type === 'v') b.x = b.side < 0 ? 240 - gap / 2 : 240 + gap / 2;
  }

  _updateBeams(dt, g) {
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      if (b.delay && b.delay > 0) { b.delay -= dt; continue; }
      if (b.warn > 0) b.warn -= dt;
      else if (b.dur !== 99) { b.dur -= dt; if (b.dur <= 0) { this.beams.splice(i, 1); continue; } }
      if (b.type === 'sweep' && b.warn <= 0) b.prog = clamp(b.prog + dt / 1.2, 0, 1);
    }
  }

  // 激光对玩家的伤害判定
  hurtPlayer(g) {
    const p = g.player;
    if (!p.alive) return;
    for (const b of this.beams) {
      if (b.warn > 0) continue;
      if (b.type === 'sweep') {
        const a = lerp(b.from, b.to, b.prog);
        const ex = b.x + Math.cos(a) * b.len, ey = b.y + Math.sin(a) * b.len;
        if (segDist2(p.x, p.y, b.x, b.y, ex, ey) < (b.w / 2 + 3) ** 2) { p.damage(g); return; }
      } else if (b.type === 'v') {
        if (Math.abs(p.x - b.x) < b.w / 2 + 3 && p.y > b.y) { p.damage(g); return; }
      }
    }
  }

  /* ---------------- 渲染 ---------------- */
  render(ctx) {
    if (this.dead) return;
    const col = this.cfg.color;
    const flick = this.invT > 0 && Math.floor(this.invT * 12) % 2 === 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (flick) ctx.globalAlpha = 0.5;
    ctx.shadowColor = col; ctx.shadowBlur = 16;
    ctx.strokeStyle = col; ctx.fillStyle = 'rgba(12,10,24,.95)'; ctx.lineWidth = 2.5;

    if (this.id === 'sentinel') {
      // 梯形主体 + 双炮塔
      ctx.beginPath();
      ctx.moveTo(-70, -18); ctx.lineTo(70, -18); ctx.lineTo(50, 26); ctx.lineTo(-50, 26);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      for (const sx of [-50, 50]) {
        ctx.beginPath(); ctx.arc(sx, 14, 16, 0, TAU); ctx.fill(); ctx.stroke();
      }
      this._core(ctx, 0, 4, 12);
    } else if (this.id === 'weaver') {
      // 中央机身 + 双翼
      for (let s = 0; s < 2; s++) {
        if (this.wings[s].alive) {
          const side = s === 0 ? -1 : 1;
          ctx.save(); ctx.translate(side * 62, 6);
          ctx.strokeStyle = col; ctx.fillStyle = 'rgba(30,8,24,.9)';
          ctx.beginPath(); ctx.ellipse(0, 0, 26, 16, side * 0.3, 0, TAU);
          ctx.fill(); ctx.stroke();
          // 翼伤裂痕
          const wr = this.wings[s].hp / this.wings[s].max;
          if (wr < 0.5) {
            ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(8, 6); ctx.stroke();
          }
          ctx.restore();
        }
      }
      ctx.strokeStyle = col; ctx.fillStyle = 'rgba(12,10,24,.95)';
      ctx.beginPath();
      ctx.moveTo(0, -30); ctx.lineTo(26, 10); ctx.lineTo(0, 30); ctx.lineTo(-26, 10);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      this._core(ctx, 0, 2, 10);
    } else {
      // 三层环形装甲
      for (let i = 3; i >= 1; i--) {
        ctx.beginPath(); ctx.arc(0, 0, i * 30, 0, TAU);
        ctx.fill(); ctx.stroke();
      }
      const open = this.coreOpen;
      ctx.shadowBlur = open ? 30 : 12;
      ctx.fillStyle = open ? '#FFFFFF' : '#FFD700';
      ctx.beginPath(); ctx.arc(0, 0, open ? 22 + Math.sin(this.t * 20) * 4 : 12, 0, TAU);
      ctx.fill();
      // 装甲尖刺
      ctx.strokeStyle = col;
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * TAU + this.t * 0.5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 70, Math.sin(a) * 70);
        ctx.lineTo(Math.cos(a) * 92, Math.sin(a) * 92);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 激光
    for (const b of this.beams) {
      if (b.type === 'sweep') {
        const a = lerp(b.from, b.to, b.prog);
        const ex = b.x + Math.cos(a) * b.len, ey = b.y + Math.sin(a) * b.len;
        if (b.warn > 0) {
          ctx.strokeStyle = 'rgba(255,49,49,' + (Math.sin(this.t * 20) > 0 ? 0.9 : 0.3) + ')';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = '#FF3131'; ctx.lineWidth = b.w; ctx.shadowColor = '#FF3131'; ctx.shadowBlur = 24;
        }
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = b.warn > 0 ? 1 : 6; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(ex, ey); ctx.stroke();
      } else if (b.type === 'v') {
        if (b.warn > 0) {
          ctx.strokeStyle = 'rgba(255,49,49,' + (Math.sin(this.t * 20) > 0 ? 0.9 : 0.3) + ')';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = '#FF3131'; ctx.lineWidth = b.w; ctx.shadowColor = '#FF3131'; ctx.shadowBlur = 24;
        }
        ctx.beginPath(); ctx.moveTo(b.x, -160); ctx.lineTo(b.x, 820); ctx.stroke();
        if (b.warn <= 0) {
          ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(b.x, -160); ctx.lineTo(b.x, 820); ctx.stroke();
        }
      }
    }
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }

  _core(ctx, x, y, r) {
    const open = this.coreOpen;
    ctx.fillStyle = open ? '#FFFFFF' : this.cfg.color;
    ctx.shadowColor = this.cfg.color; ctx.shadowBlur = open ? 26 : 8;
    ctx.beginPath(); ctx.arc(x, y, open ? r + 5 + Math.sin(this.t * 16) * 3 : r * 0.55, 0, TAU);
    ctx.fill();
  }
}

NS.Boss = Boss;
})();
