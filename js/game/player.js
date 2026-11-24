/* player.js —— 玩家战机（3 机型 / 5 级武器 / 副武器 / 护盾 / 暴走），全局 NS.Player */
(function () {
'use strict';
window.NS = window.NS || {};
const { clamp, rand } = NS.U;
const C = () => NS.CONFIG;

class Player {
  constructor(shipId) {
    const up = NS.Save.upgrades;
    this.cfg = C().ships[shipId];
    this.shipId = shipId;
    this.x = 240; this.y = 680;
    this.maxHp = this.cfg.hp;
    this.hp = this.maxHp;
    this.speed = this.cfg.speed;
    this.r = C().player.hitR;
    this.alive = true;
    this.weaponLevel = clamp(1 + up.fire, 1, 5);
    this.shields = 0;
    this.maxShields = 1 + up.shield;
    this.bombs = Math.min(C().player.bombStart + up.bomb, C().player.bombMax);
    this.lives = C().player.livesStart;
    this.fireT = 0; this.misT = 0.4; this.subT = 0; this._wingFireT = 0;
    this.inv = 0; this.flash = 0;
    this.option = null;               // 'missile' | 'wing'
    this.wings = [{ x: 210, y: 650 }, { x: 270, y: 650 }];
    this.hyper = 0; this.hyperT = 0;
    this.engineT = 0;
    // 机型独有技能
    this.skillT = 0;            // 剩余冷却
    this.skillActiveT = 0;      // 技能剩余持续时间
    this.phaseLock = false;     // 虚化期间禁射
    this.stunT = 0;             // 时空锁定结束后的僵硬
    this.greedActiveT = 0;      // 贪婪磁场主动持续
  }

  get hasSkill() { return !!this.cfg.skill; }
  get skillReady() { return this.hasSkill && this.skillT <= 0 && this.skillActiveT <= 0 && this.stunT <= 0; }

  useSkill(g) {
    if (!this.skillReady) return;
    const sk = this.cfg.skill;
    this.skillT = sk.cd;
    this.skillActiveT = sk.dur;
    if (sk.type === 'phase') {
      this.phaseLock = true;
      this.inv = Math.max(this.inv, sk.dur);
    } else if (sk.type === 'timelock') {
      g.timeSlow = sk.dur;
    } else if (sk.type === 'greed') {
      this.greedActiveT = sk.dur;
      g.magnetTimer = Math.max(g.magnetTimer, sk.dur);
      g.greedHeal = true;
    }
    NS.Audio.ui();
  }

  get hyperActive() { return this.hyperT > 0; }
  get level() { return this.hyperActive ? 5 : this.weaponLevel; }

  addEnergy(v) {
    if (this.hyperActive) return;
    this.hyper = clamp(this.hyper + v, 0, 100);
    if (this.hyper >= 100) this._startHyper();
  }
  _startHyper() {
    this.hyper = 0; this.hyperT = C().player.hyperTime;
  }

  update(dt, g) {
    if (!this.alive) return;
    const P = C().player;
    if (this.inv > 0) this.inv -= dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.hyperT > 0) this.hyperT -= dt;
    if (this.skillT > 0) this.skillT -= dt;
    if (this.stunT > 0) this.stunT -= dt;
    // 技能持续计时
    if (this.skillActiveT > 0) {
      this.skillActiveT -= dt;
      if (this.skillActiveT <= 0) {
        const sk = this.cfg.skill;
        if (sk && sk.type === 'phase') this.phaseLock = false;
        if (sk && sk.type === 'timelock') this.stunT = 1;   // 结束后1秒僵硬
        if (sk && sk.type === 'greed') g.greedHeal = false;
      }
    }
    if (this.greedActiveT > 0) this.greedActiveT -= dt;

    // 时空锁定触发全局减速：敌人和子弹速度 ×0.5
    const slowMul = g.timeSlow > 0 ? 0.5 : 1;

    /* ---- 移动：键盘优先，其次指针；僵硬时无法移动 ---- */
    const ax = this.stunT > 0 ? {x:0, y:0} : g.input.axis();
    const spd = this.speed * (g.input.lowSpeed ? 0.39 : 1);
    if (ax.x || ax.y) {
      this.x = clamp(this.x + ax.x * spd * dt, 16, 464);
      this.y = clamp(this.y + ax.y * spd * dt, 30, 780);
    } else if (g.input.pointer.down && this.stunT <= 0) {
      const t = 0.22;
      this.x = clamp(this.x + (g.input.pointer.x - this.x) * t, 16, 464);
      this.y = clamp(this.y + (g.input.pointer.y - this.y) * t, 30, 780);
    }

    /* ---- 引擎尾焰 ---- */
    this.engineT += dt;
    if (this.engineT > 0.016) {
      this.engineT = 0;
      const col = this.hyperActive ? '#FF9500' : this.cfg.color;
      g.fx.thruster(this.x - 5, this.y + 14, col);
      g.fx.thruster(this.x + 5, this.y + 14, col);
    }

    /* ---- 主武器开火：按住鼠标左键 / 触屏按住 / Z·J 键 ---- */
    const w = this.cfg.weapons[this.level - 1];
    // 全局攻击力：闯关降低 40%（×0.6）；无尽模式在此基础上提升 20%（×0.72）
    const dmgMul = g.mode === 'endless' ? 0.72 : 0.6;
    const cdMul = g.shopEffect && g.shopEffect.type === 'cdcut' ? (1 - g.shopEffect.val) : 1;
    const wantFire = (g.input.pointer.down || g.input.keys.has('z') || g.input.keys.has('j'))
      && !this.phaseLock && this.stunT <= 0;
    this.fireT -= dt;
    if (wantFire && this.fireT <= 0) {
      this.fireT = (1 / w.rate) * cdMul;
      const col = this.hyperActive ? '#FFD700' : this.cfg.color;
      // 齐射衰减：一次射出的子弹越多，单发伤害越低（n 发单伤 ×1/(1+0.35(n-1))）
      const n = w.shots.length;
      const multiMul = n > 1 ? 1 / (1 + 0.35 * (n - 1)) : 1;
      for (const s of w.shots) {
        NS.B.p(g, this.x, this.y - 16, s.a, s.kind === 'laser' ? 1500 : 620,
          s.dmg * dmgMul * multiMul, s.kind === 'laser' ? this.cfg.color : col,
          { kind: s.kind || 'orb', pierce: s.pierce || 0, r: s.kind === 'laser' ? 3 : 4 });
      }
      NS.Audio.shoot();
    } else if (!wantFire && this.fireT < 0) {
      this.fireT = 0;   // 松开开火键后立刻可再次开火
    }

    /* ---- 副武器：追踪导弹 ---- */
    this.misT -= dt;
    if (w.missile && this.option === 'missile' && this.misT <= 0) {
      this.misT = 0.8;
      for (const ox of [-12, 12])
        NS.B.p(g, this.x + ox, this.y, ox < 0 ? 2.2 : 1.0, 460, 25 * dmgMul, '#FF9500',
          { kind: 'missile', r: 4, htime: 3, turn: 5, splash: 30 });
    }
    /* ---- C 机 Lv5 追踪副炮 ---- */
    this.subT -= dt;
    if (w.homingSub && this.subT <= 0) {
      this.subT = 1;
      for (const ox of [-14, 14])
        NS.B.p(g, this.x + ox, this.y - 6, ox < 0 ? 2.6 : 0.5, 520, 15 * dmgMul, '#E6B8FF',
          { kind: 'missile', r: 3.5, htime: 2, turn: 6 });
    }

    /* ---- 僚机跟随与射击 ---- */
    if (this.option === 'wing') {
      const targets = [{ x: this.x - 30, y: this.y + 24 }, { x: this.x + 30, y: this.y + 24 }];
      for (let i = 0; i < 2; i++) {
        this.wings[i].x += (targets[i].x - this.wings[i].x) * 0.18;
        this.wings[i].y += (targets[i].y - this.wings[i].y) * 0.18;
      }
      this._wingFireT -= dt;
      if (this._wingFireT <= 0) {
        this._wingFireT = 0.4;
        for (const wp of this.wings) NS.B.p(g, wp.x, wp.y - 10, 0, 600, 8 * dmgMul, '#4D7CFE', { r: 3 });
      }
    }
  }

  damage(g) {
    if (!this.alive || this.inv > 0) return;
    if (this.shields > 0) {
      this.shields--;
      this.inv = 1;
      g.fx.burst(this.x, this.y, '#4D7CFE', 18, 180, 0.4, 3);
      g.fx.ring(this.x, this.y, '#4D7CFE', 40);
      NS.Audio.hit();
      return;
    }
    const P = C().player;
    const levelBeforeHit = this.weaponLevel;   // 记录受伤前火力等级，用于死亡复活保留
    this.hp -= P.hitDmg;
    this.weaponLevel = Math.max(1, this.weaponLevel - 1);
    this.inv = P.invincible; this.flash = 0.25;
    g.shake(6, 0.2);
    g.redFlash = 0.3;
    g.combo = 0;
    g.fx.burst(this.x, this.y, '#FF3131', 15, 220, 0.5, 3.5);
    g.deathsOnHit = (g.deathsOnHit || 0) + 1;
    NS.Audio.boom(false);
    if (this.hp <= 0) {
      // 保命符：血量见底时恢复一定百分比
      if (g.shopEffect && g.shopEffect.type === 'talisman' && !g.talismanUsed) {
        g.talismanUsed = true;
        this.hp = Math.round(this.maxHp * g.shopEffect.pct);
        this.inv = 2;
        g.fx.ring(this.x, this.y, '#FFD700', 80);
        g.fx.text(this.x, this.y - 40, '保命符!', '#FFD700');
        NS.Audio.pick();
        return;
      }
      this.die(g, levelBeforeHit);
    }
  }

  die(g, keepWeaponLevel) {
    this.lives--;
    this.alive = false;
    // 死亡保留火力加成：复活时恢复到死亡前的火力等级（而非初始等级）
    this._savedWeaponLevel = keepWeaponLevel;
    g.fx.bigBoom(this.x, this.y);
    g.shake(10, 0.5);
    g.clearEnemyBullets();
    NS.Audio.boom(true);
    g.onPlayerDead();
  }

  respawn(g) {
    this.x = 240; this.y = 680;
    this.hp = this.maxHp;
    // 保留死亡前吃到的火力加成；没有记录时（理论上不会）回退到局外养成初始等级
    this.weaponLevel = clamp(this._savedWeaponLevel || 1 + NS.Save.upgrades.fire, 1, 5);
    this._savedWeaponLevel = null;
    this.shields = 0;
    this.inv = C().player.respawnInv;
    this.hyperT = 0; this.hyper = 0;
    this.alive = true;
  }

  heal(v) { this.hp = clamp(this.hp + v, 0, this.maxHp); }

  render(ctx) {
    if (!this.alive) {
      // 僚机在死亡期间隐藏
      return;
    }
    if (this.inv > 0 && Math.floor(this.inv * 12) % 2 === 0) ctx.globalAlpha = 0.35;

    // 僚机
    if (this.option === 'wing') {
      for (const wp of this.wings) this._drawMini(ctx, wp.x, wp.y, '#4D7CFE');
    }

    const col = this.hyperActive ? '#FF9500' : this.cfg.color;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = col; ctx.shadowBlur = 14;
    ctx.strokeStyle = col; ctx.fillStyle = 'rgba(8,14,36,0.95)';
    ctx.lineWidth = 2;

    if (this.shipId === 'A') {
      ctx.beginPath();
      ctx.moveTo(0, -20); ctx.lineTo(-6, -2); ctx.lineTo(-17, 15);
      ctx.lineTo(-7, 10); ctx.lineTo(-3, 16); ctx.lineTo(3, 16);
      ctx.lineTo(7, 10); ctx.lineTo(17, 15); ctx.lineTo(6, -2);
      ctx.closePath();
    } else if (this.shipId === 'B') {
      ctx.beginPath();
      ctx.moveTo(0, -18); ctx.lineTo(-8, 0); ctx.lineTo(-22, 12);
      ctx.lineTo(-22, 18); ctx.lineTo(-8, 13); ctx.lineTo(-4, 18);
      ctx.lineTo(4, 18); ctx.lineTo(8, 13); ctx.lineTo(22, 18);
      ctx.lineTo(22, 12); ctx.lineTo(8, 0);
      ctx.closePath();
    } else if (this.shipId === 'D') {
      // 幻影：菱形核心 + 双尾翼
      ctx.beginPath();
      ctx.moveTo(0, -22); ctx.lineTo(-6, -4); ctx.lineTo(-16, 14);
      ctx.lineTo(-6, 10); ctx.lineTo(0, 18); ctx.lineTo(6, 10);
      ctx.lineTo(16, 14); ctx.lineTo(6, -4);
      ctx.closePath();
    } else if (this.shipId === 'E') {
      // 掠夺者：宽体重甲 + 双炮管
      ctx.beginPath();
      ctx.moveTo(0, -20); ctx.lineTo(-10, -6); ctx.lineTo(-20, 10);
      ctx.lineTo(-20, 18); ctx.lineTo(-8, 14); ctx.lineTo(0, 20);
      ctx.lineTo(8, 14); ctx.lineTo(20, 18); ctx.lineTo(20, 10);
      ctx.lineTo(10, -6);
      ctx.closePath();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -22); ctx.lineTo(-4, -4); ctx.lineTo(-10, 16);
      ctx.lineTo(-3, 12); ctx.lineTo(0, 17); ctx.lineTo(3, 12);
      ctx.lineTo(10, 16); ctx.lineTo(4, -4);
      ctx.closePath();
    }
    ctx.fill(); ctx.stroke();
    // 座舱
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#E6F1FF';
    ctx.beginPath(); ctx.ellipse(0, -5, 2.6, 5, 0, 0, NS.U.TAU); ctx.fill();
    ctx.restore();

    // 护盾环
    if (this.shields > 0) {
      ctx.strokeStyle = '#4D7CFE'; ctx.globalAlpha = 0.55 + 0.2 * Math.sin(performance.now() / 120);
      ctx.shadowColor = '#4D7CFE'; ctx.shadowBlur = 12; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(this.x, this.y, 24, 0, NS.U.TAU); ctx.stroke();
    }

    // 低速精操：显示 3px 判定点
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    if (NS.App && NS.App.input && NS.App.input.lowSpeed) {
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#FF2E88'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, NS.U.TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,46,136,.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(this.x, this.y, C().player.grazeR, 0, NS.U.TAU); ctx.stroke();
    }
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }

  _drawMini(ctx, x, y, col) {
    ctx.save(); ctx.translate(x, y);
    ctx.shadowColor = col; ctx.shadowBlur = 8;
    ctx.strokeStyle = col; ctx.fillStyle = 'rgba(8,14,36,.9)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(-8, 8); ctx.lineTo(0, 5); ctx.lineTo(8, 8);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

NS.Player = Player;
})();
