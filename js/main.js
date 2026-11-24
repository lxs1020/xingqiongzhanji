/* ============================================================
 * main.js —— 存档 / 主控 App / Play 对局编排（状态机 + 碰撞 + 渲染）
 * ============================================================ */
(function () {
'use strict';
window.NS = window.NS || {};
const C = () => NS.CONFIG;
const { clamp, dist, dist2, pad } = NS.U;

/* ---------------- 存档 ---------------- */
NS.Save = {
  coins: 0, upgrades: {}, unlocks: {}, selected: 'A', highscore: 0, rank: [], settings: {},
  load() {
    const D = NS.DEFAULT_SAVE, K = NS.KEYS;
    const j = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
    this.coins = +(localStorage.getItem(K.coins) ?? D.coins);
    this.upgrades = Object.assign({}, D.upgrades, j(K.upgrades, {}));
    this.unlocks = Object.assign({}, D.unlocks, j(K.unlocks, {}));
    this.selected = localStorage.getItem(K.selected) || D.selected;
    this.highscore = +(localStorage.getItem(K.highscore) ?? 0);
    this.rank = j(K.rank, []);
    this.settings = Object.assign({}, D.settings, j(K.settings, {}));
    this.cleared = +(localStorage.getItem(K.cleared) ?? D.cleared);
  },
  write() {
    const K = NS.KEYS;
    localStorage.setItem(K.coins, this.coins);
    localStorage.setItem(K.upgrades, JSON.stringify(this.upgrades));
    localStorage.setItem(K.unlocks, JSON.stringify(this.unlocks));
    localStorage.setItem(K.selected, this.selected);
    localStorage.setItem(K.highscore, this.highscore);
    localStorage.setItem(K.rank, JSON.stringify(this.rank));
    localStorage.setItem(K.settings, JSON.stringify(this.settings));
    localStorage.setItem(K.cleared, this.cleared);
  }
};

/* ---------------- 对局 ---------------- */
class Play {
  constructor(mode, startLevelIdx) {
    this.mode = mode;
    this.loop = App.loop;
    this.fx = new NS.FX();
    this.bg = new NS.StarField();
    this.player = new NS.Player(NS.Save.selected);
    this.enemies = [];
    this.pbullets = [];
    this.ebullets = [];
    this.items = [];
    this.boss = null;
    this.bulletPool = new NS.Pool(() => new NS.Bullet());
    this.timers = [];

    this.score = 0; this.combo = 0; this.comboT = 0; this.maxCombo = 0;
    this.kills = 0; this.grazes = 0; this.crashes = 0;
    this.coinsEarned = 0; this.deathsOnHit = 0;
    this.magnetTimer = 0;
    this.respawnT = 0;
    this.shakeMag = 0; this.shakeT = 0;
    this.redFlash = 0; this.whiteFlash = 0;
    this.hitSndT = 0;
    this.nextLifeAt = C().player.lifeScoreEvery;
    this.phase = 'wave';        // wave | warn | boss | clear | over
    this.diff = 1;
    this.warnT = 0; this._pendingBoss = null;
    this.input = App.input;
    // 技能与道具状态
    this.timeSlow = 0;          // 时空锁定剩余时间（全局减速）
    this.greedHeal = false;     // 贪婪磁场主动回血开关
    this.shopEffect = null;     // 开局携带道具效果
    this.talismanUsed = false;  // 保命符是否已用
    this.endlessWorld = NS.Save.endlessWorld || 1;  // 无尽世界
    this.rainKillCounter = 0;   // 世界1金币雨击杀计数
    this.elapsedTime = 0;       // 世界2时间累计
    this.coinDropBonus = 0;     // 金币掉落梯度加成

    if (mode === 'campaign') NS.Level.start(this, startLevelIdx || 0);
    else NS.Endless.start(this);
  }

  /* ---------- 通用辅助 ---------- */
  schedule(t, fn) { this.timers.push({ t, fn }); }
  shake(mag, t) { this.shakeMag = Math.max(this.shakeMag, mag); this.shakeT = Math.max(this.shakeT, t); }

  // 按进度随机出血量档位：0=普通 1=精英 2=强化（关卡越后/无尽波越高，高档越多）
  rollTier() {
    const base = this.mode === 'endless' ? (this.wave || 1) * 0.02 : (this.levelIdx || 0) * 0.06;
    const r = Math.random();
    if (r < 0.06 + base) return 2;
    if (r < 0.28 + base) return 1;
    return 0;
  }

  spawnEnemyAt(kind, x, y, scale, tier) {
    if (this.enemies.length >= C().caps.enemy) return null;
    const t = tier === undefined ? this.rollTier() : tier;
    // 高档敌机额外血量：精英(tier1)/强化(tier2)及大型机（carrier/guard）
    const big = kind === 'carrier' || kind === 'guard';
    const hpBonus = (t >= 1 || big) ? (this.eliteHp || 1) : 1;
    const e = new NS.Enemy(kind, x, y, scale || this.diff, t, hpBonus);
    this.enemies.push(e);
    return e;
  }
  spawnFormation(kind, formation, n) {
    const f = NS.formations[formation] || NS.formations.line;
    f(this, kind, n);
  }

  requestBoss(id, scale) {
    this.phase = 'warn';
    this._pendingBoss = { id, scale };
    this.warnT = 1.5;
    App.loop.timeScale = 0.3;
    NS.Screens.warning(C().bosses[id].name);
  }

  clearEnemyBullets() {
    for (const b of this.ebullets) {
      this.fx.burst(b.x, b.y, b.color, 2, 80, 0.2, 2);
      this.bulletPool.release(b);
    }
    this.ebullets.length = 0;
  }

  comboMult() { return NS.Screens.hud.comboMult(this.combo); }

  addScore(base, x, y) {
    const mult = this.comboMult() * (this.player.hyperActive ? 2 : 1);
    const got = Math.round(base * mult);
    this.score += got;
    if (this.score >= this.nextLifeAt) {
      this.player.lives = Math.min(9, this.player.lives + 1);
      this.fx.text(240, 400, 'EXTRA LIFE!', '#FFD700');
      NS.Audio.pick();
      this.nextLifeAt += C().player.lifeScoreEvery;
    }
  }

  /* ---------- 击杀 / 掉落 ---------- */
  killEnemy(e) {
    e.alive = false;
    this.kills++;
    this.combo++; this.comboT = C().player.comboWindow;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.addScore(e.score, e.x, e.y);

    const big = e.kind === 'carrier' || e.kind === 'guard';
    if (big) { this.fx.bigBoom(e.x, e.y); this.shake(4, 0.15); NS.Audio.boom(true); }
    else { this.fx.smallBoom(e.x, e.y); this.shake(2, 0.1); NS.Audio.boom(false); }

    // 金币掉落梯度：闯关随关卡、无尽随波次提升
    const tierBonus = this.mode === 'campaign'
      ? (this.levelIdx || 0) * 0.05
      : (this.wave || 1) * 0.02;
    let rate = e.kind === 'carrier' ? C().drop.carrier
      : (e.kind === 'guard' ? C().drop.elite : C().drop.normal);
    rate = Math.min(1, rate + tierBonus + this.coinDropBonus);
    // 金币概率提升道具
    if (this.shopEffect && this.shopEffect.type === 'coinrate')
      rate = Math.min(1, rate * (1 + this.shopEffect.val));

    NS.rollDrop(this, e.x, e.y, rate);
    if (e.kind === 'carrier') NS.rollDrop(this, e.x + 14, e.y, 1, 'P');
    if (e.kind === 'kamikaze') NS.kamikazeBurst(this, e);

    // 掠夺者被动：30% 概率双倍金币
    if (this.player.shipId === 'E' && Math.random() < 0.3) {
      NS.rollDrop(this, e.x + 10, e.y, 1, 'coin');
    }
    // 掠夺者主动：击杀回血
    if (this.greedHeal) {
      this.player.heal(3);
      this.fx.burst(this.player.x, this.player.y, '#4ADE80', 6, 60, 0.3, 2);
    }
    // 金币翻倍券
    if (this.shopEffect && this.shopEffect.type === 'coindouble') {
      NS.rollDrop(this, e.x - 10, e.y, rate, 'coin');
    }

    // 无尽世界1：每击杀25个敌人触发金币雨或双倍掉落
    if (this.mode === 'endless' && this.endlessWorld === 1) {
      this.rainKillCounter++;
      const per = C().endless.worlds[1].killPerRain;
      if (this.rainKillCounter >= per) {
        this.rainKillCounter = 0;
        if (Math.random() < 0.5) {
          // 金币雨
          for (let i = 0; i < 8; i++)
            NS.rollDrop(this, NS.U.rand(40, 440), NS.U.rand(100, 400), 1, 'coin');
          this.fx.text(240, 350, '金币雨!', '#FFD700');
        } else {
          // 双倍掉落：接下来的掉落概率翻倍（用 shopEffect 模拟一次性）
          for (let i = 0; i < 6; i++)
            NS.rollDrop(this, NS.U.rand(40, 440), NS.U.rand(100, 400), 1, 'coin');
          this.fx.text(240, 350, '双倍掉落!', '#FF9500');
        }
      }
    }
  }

  /* ---------- 炸弹 ---------- */
  detonateBomb() {
    const p = this.player;
    if (p.bombs <= 0 || !p.alive) return;
    p.bombs--;
    p.inv = Math.max(p.inv, C().player.bombInv);
    this.clearEnemyBullets();
    this.fx.ring(p.x, p.y, '#00F0FF', 500);
    this.fx.burst(p.x, p.y, '#FFFFFF', 40, 400, 0.6, 4);
    this.shake(10, 0.4);
    NS.Audio.bomb();
    for (const e of this.enemies) {
      e.hp -= C().player.bombDmg;
      if (e.hp <= 0) this.killEnemy(e);
    }
    if (this.boss && this.boss.entered) this.boss.hit(this, C().player.bombDmg, this.boss.x, this.boss.y);
    this.whiteFlash = 0.15;
  }

  /* ---------- 玩家坠机 ---------- */
  onPlayerDead() {
    this.crashes++;
    this.respawnT = 1.2;
  }

  /* ---------- 道具生效 ---------- */
  applyItem(it) {
    const p = this.player;
    NS.Audio.pick();
    switch (it.kind) {
      case 'P':
        if (p.weaponLevel >= 5) this.addScore(500);
        else { p.weaponLevel++; this.fx.text(p.x, p.y - 30, 'POWER UP!', '#FF9500'); }
        break;
      case 'S':
        p.shields = Math.min(p.maxShields, p.shields + 1);
        this.fx.text(p.x, p.y - 30, 'SHIELD', '#4D7CFE'); break;
      case 'B':
        if (p.bombs >= C().player.bombMax) this.addScore(500);
        else { p.bombs++; this.fx.text(p.x, p.y - 30, 'BOMB +1', '#FF3131'); }
        break;
      case 'M':
        p.option = p.option === 'missile' ? 'wing' : 'missile';
        this.fx.text(p.x, p.y - 30, p.option === 'missile' ? 'MISSILE' : 'WINGMAN', '#B537F2');
        break;
      case 'coin':
        this.coinsEarned += it.value;
        this.fx.burst(it.x, it.y, '#FFD700', 6, 120, 0.35, 2.5);
        break;
      case 'magnet':
        this.magnetTimer = 6;
        this.fx.text(p.x, p.y - 30, 'MAGNET 6s', '#E6F1FF'); break;
    }
  }

  /* ---------- Boss 死亡处理 ---------- */
  onBossDead() {
    const b = this.boss;
    App.loop.timeScale = 1;
    this.score += b.cfg.score;
    this.coinsEarned += 300;
    this.fx.text(b.x, b.y - 60, 'DESTROYED  +' + b.cfg.score, '#FFD700');
    this.fx.burst(b.x, b.y, '#FFD700', 60, 340, 0.9, 4);
    NS.rollDrop(this, b.x, b.y, 1, 'P');
    this.boss = null;
    NS.Screens.hud.el.bossbar.classList.add('hidden');

    if (this.mode === 'endless') {
      this.phase = 'wave';
      NS.Audio.startMusic(false);
      return;
    }
    // 第 4 关双 Boss 连战
    if (this.extraBoss) {
      const second = this.extraBoss; this.extraBoss = null;
      this.schedule(1.2, () => this.requestBoss(second, 1.25));
      this.phase = 'wave';
      return;
    }
    // 关卡制：通关当前所选关卡 → 记录进度并结算
    this.phase = 'clear';
    this.player.heal(30);
    NS.Screens.toast('STAGE CLEAR');
    if (this.levelIdx >= (NS.Save.cleared || 0)) {
      NS.Save.cleared = Math.min(this.levelIdx + 1, C().levels.length);
      NS.Save.write();
    }
    this.schedule(2.6, () => this.endRun(true));
  }

  endRun(win) {
    if (this.phase === 'over') return;
    this.phase = 'over';
    App.loop.timeScale = 1;
    NS.Screens.hideWarning();
    NS.Audio.stopMusic();

    NS.Save.coins += this.coinsEarned;
    const score = Math.floor(this.score);
    const newRecord = score > 0 &&
      (NS.Save.rank.length < 10 || score > (NS.Save.rank[NS.Save.rank.length - 1]?.score || 0));
    if (score > NS.Save.highscore) NS.Save.highscore = score;
    NS.Save.rank.forEach(r => r.me = false);
    NS.Save.write();

    NS.Screens.hud.hide();
    NS.Screens.result({
      win, score,
      kills: this.kills, grazes: this.grazes, maxCombo: this.maxCombo,
      coins: this.coinsEarned,
      grade: C().grade(this.crashes),
      newRecord,
      mode: this.mode,
      ship: this.player.shipId
    });
  }

  /* ================= 主更新 ================= */
  update(dt, rawDt) {
    if (this.phase === 'over') {
      this.bg.update(dt); this.fx.update(dt);
      return;
    }

    // 导演
    if (this.mode === 'campaign') NS.Level.update(dt, this);
    else NS.Endless.update(dt, this);

    // 警报（按真实时间）
    if (this.phase === 'warn') {
      this.warnT -= rawDt;
      // 警报期间敌人继续行动，玩家可走位
      if (this.warnT <= 0) {
        const pb = this._pendingBoss;
        this.boss = new NS.Boss(pb.id, pb.scale);
        this.phase = 'boss';
        App.loop.timeScale = 1;
        NS.Screens.hideWarning();
        NS.Audio.startMusic(true);
      }
    }

    // 炸弹输入
    if (this.input.consumeBomb()) this.detonateBomb();
    // 技能输入（X 键）
    if (this.input.consumeSkill() && this.player.alive) this.player.useSkill(this);

    // 时空锁定全局减速递减
    if (this.timeSlow > 0) this.timeSlow -= dt;
    const slowMul = this.timeSlow > 0 ? 0.5 : 1;
    // 世界2：金币掉落随时间递增（小幅度）
    if (this.mode === 'endless' && this.endlessWorld === 2) {
      this.elapsedTime += dt;
      this.coinDropBonus = Math.min(1, this.elapsedTime * C().endless.worlds[2].growthRate);
    }

    // 计时器
    this.magnetTimer = Math.max(0, this.magnetTimer - dt);
    this.comboT -= dt;
    if (this.comboT <= 0) this.combo = 0;
    this.redFlash = Math.max(0, this.redFlash - rawDt);
    this.whiteFlash = Math.max(0, this.whiteFlash - rawDt);
    if (this.shakeT > 0) { this.shakeT -= rawDt; if (this.shakeT <= 0) this.shakeMag = 0; }
    this.hitSndT -= dt;

    // 实体
    if (!this.player.alive) {
      this.respawnT -= dt;
      if (this.respawnT <= 0 && this.player.lives >= 0) this.player.respawn(this);
      else if (this.player.lives < 0) { this.endRun(false); return; }
    }
    if (this.player.alive || this.respawnT > 0) this.player.update(dt, this);
    const edt = dt * slowMul;   // 时空锁定：敌人/敌弹全局减速
    for (const e of this.enemies) e.update(edt, this);
    if (this.boss) {
      this.boss.update(edt, rawDt, this);
      this.boss.hurtPlayer(this);
      if (this.boss.dead) this.onBossDead();
    }
    for (const b of this.pbullets) b.update(dt, this);
    for (const b of this.ebullets) b.update(edt, this);
    for (const it of this.items) it.update(dt, this);

    this.timers = this.timers.filter(ts => { ts.t -= dt; if (ts.t <= 0) ts.fn(); return ts.t > 0; });

    this._collisions();
    this._compact();
    this.bg.update(dt);
    this.fx.update(dt);
    NS.Screens.hud.update(this);
  }

  /* ---------------- 碰撞 ---------------- */
  _collisions() {
    const p = this.player;

    // --- 玩家子弹 vs 敌机（64px 网格空间分区）---
    const CELL = 64;
    const grid = new Map();
    for (const e of this.enemies) {
      const key = Math.floor(e.x / CELL) + ',' + Math.floor(e.y / CELL);
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(e);
    }
    const hitCells = (b) => {
      const cx = Math.floor(b.x / CELL), cy = Math.floor(b.y / CELL);
      for (let gx = cx - 1; gx <= cx + 1; gx++)
        for (let gy = cy - 1; gy <= cy + 1; gy++) {
          const arr = grid.get(gx + ',' + gy);
          if (!arr) continue;
          for (const e of arr) {
            if (!e.alive) continue;
            if (b.hits && b.hits.includes(e)) continue;
            const rr = e.r + b.r;
            if (NS.U.segDist2(e.x, e.y, b.px, b.py, b.x, b.y) < rr * rr) {
              const dmg = b.dmg * e.dmgMod(b.x, b.y);
              e.hp -= dmg; e.hitFlash = 0.06;
              this.fx.burst(b.x, b.y, e.color, 3, 100, 0.2, 2);
              if (this.hitSndT <= 0) { NS.Audio.hit(); this.hitSndT = 0.05; }
              if (b.kind === 'missile' && b.splash) {
                for (const o of this.enemies)
                  if (o !== e && o.alive && dist2(b.x, b.y, o.x, o.y) < b.splash * b.splash) o.hp -= b.dmg * 0.5;
              }
              if (b.pierce > 0) { b.hits.push(e); b.pierce--; }
              else b.alive = false;
              if (e.hp <= 0) this.killEnemy(e);
              if (!b.alive) return;
            }
          }
        }
    };
    for (const b of this.pbullets) if (b.alive) hitCells(b);

    // --- 玩家子弹 vs Boss ---
    if (this.boss && this.boss.entered && !this.boss.dying) {
      const bs = this.boss;
      for (const b of this.pbullets) {
        if (!b.alive) continue;
        if (b.hits && b.hits.includes(bs)) continue;
        const rr = bs.r + b.r;
        if (NS.U.segDist2(bs.x, bs.y, b.px, b.py, b.x, b.y) < rr * rr) {
          bs.hit(this, b.dmg, b.x, b.y);
          this.fx.burst(b.x, b.y, bs.cfg.color, 3, 100, 0.2, 2);
          if (this.hitSndT <= 0) { NS.Audio.hit(); this.hitSndT = 0.05; }
          if (b.pierce > 0) { b.hits.push(bs); b.pierce--; }
          else b.alive = false;
        }
      }
    }

    if (!p.alive) return;

    // --- 敌弹 vs 玩家（3px 命中 / 16px 擦弹）---
    const P = C().player;
    for (const b of this.ebullets) {
      if (!b.alive) continue;
      const d = dist(b.x, b.y, p.x, p.y);
      if (d < b.r + P.hitR) {
        b.alive = false;
        p.damage(this);
      } else if (!b.grazed && d < b.r + P.grazeR) {
        b.grazed = true;
        this.grazes++;
        this.score += 10;
        p.addEnergy(P.hyperGainGraze);
        this.fx.burst(b.x, b.y, '#FFFFFF', 3, 90, 0.2, 2);
        NS.Audio.graze();
      }
    }

    // --- 敌机撞玩家 ---
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const rr = e.r + P.hitR + 4;
      if (dist2(e.x, e.y, p.x, p.y) < rr * rr) {
        if (e.kind === 'kamikaze') NS.kamikazeBurst(this, e);
        p.damage(this);
        e.hp = 0;
        this.killEnemy(e);
      }
    }

    // --- Boss 本体碰撞 ---
    if (this.boss && this.boss.entered && !this.boss.dying) {
      const rr = this.boss.r + P.hitR;
      if (dist2(this.boss.x, this.boss.y, p.x, p.y) < rr * rr) p.damage(this);
    }

    // --- 道具拾取 ---
    const radius = C().magnetRadii[NS.Save.upgrades.magnet];
    for (const it of this.items) {
      if (!it.alive) continue;
      if (dist2(it.x, it.y, p.x, p.y) < (radius + 8) * (radius + 8)) {
        it.alive = false;
        this.applyItem(it);
      }
    }
  }

  _compact() {
    const rm = (arr, release) => {
      for (let i = arr.length - 1; i >= 0; i--)
        if (!arr[i].alive) { if (release) this.bulletPool.release(arr[i]); arr.splice(i, 1); }
    };
    rm(this.pbullets, true);
    rm(this.ebullets, true);
    rm(this.enemies, false);
    rm(this.items, false);
  }

  /* ================= 渲染 ================= */
  render(ctx) {
    ctx.save();
    if (this.shakeT > 0)
      ctx.translate((Math.random() - 0.5) * this.shakeMag, (Math.random() - 0.5) * this.shakeMag);

    this.bg.render(ctx, this.levelCfg ? this.levelCfg.theme : (this.mode === 'endless' ? this.bg.theme : null));

    for (const it of this.items) it.render(ctx);
    for (const e of this.enemies) e.render(ctx);
    if (this.boss) this.boss.render(ctx);
    for (const b of this.pbullets) b.render(ctx);
    for (const b of this.ebullets) b.render(ctx);
    this.player.render(ctx);
    this.fx.render(ctx);
    ctx.restore();

    // 受击红边 & 全屏闪白
    if (this.redFlash > 0) {
      ctx.fillStyle = 'rgba(255,49,49,' + (this.redFlash * 0.5) + ')';
      const g = ctx.createRadialGradient(240, 400, 200, 240, 400, 460);
      g.addColorStop(0, 'rgba(255,49,49,0)');
      g.addColorStop(1, 'rgba(255,49,49,' + (this.redFlash * 1.2) + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 480, 800);
    }
    if (this.whiteFlash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + this.whiteFlash + ')';
      ctx.fillRect(0, 0, 480, 800);
    }
  }
}

/* ---------------- App ---------------- */
const App = NS.App = {
  canvas: null, ctx: null, input: null, loop: null,
  play: null, paused: false, pendingMode: null,
  menuBg: null,

  init() {
    if (this.inited) return;   // 防止合成/重复 DOMContentLoaded 造成提前二次初始化
    this.inited = true;
    NS.Save.load();
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.input = new NS.Input(this.canvas);
    this.input.onPause = () => this.togglePause();
    this.menuBg = new NS.StarField();

    NS.Screens.init(this);
    NS.Screens.refreshMenu();
    NS.Screens.show('menu');
    if (NS.Save.settings.quality === 'low') document.getElementById('stage').classList.add('low');

    this.loop = new NS.Loop((dt, raw) => this.step(dt, raw), () => this.render());
    this.loop.start();
    window.addEventListener('resize', () => this.resize());
    this.resize();
  },

  resize() {
    const s = Math.min(window.innerWidth / 480, window.innerHeight / 800);
    const stage = document.getElementById('stage');
    stage.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
  },

  startRun(mode, levelIdx, shopItem, world) {
    this.pendingMode = mode;
    this.pendingLevel = levelIdx || 0;
    this.pendingShop = shopItem || null;
    if (world) NS.Save.endlessWorld = world;
    if (!NS.Save.settings.tutorial) {
      document.getElementById('tutorial').classList.remove('hidden');
      return;
    }
    this._beginRun();
  },
  _beginRun() {
    document.getElementById('tutorial').classList.add('hidden');
    NS.Screens.hideAll();
    this.play = new Play(this.pendingMode || 'campaign', this.pendingLevel || 0);
    if (this.pendingShop) this.play.shopEffect = this.pendingShop.effect;
    this.pendingShop = null;
    this.paused = false;
    this.loop.timeScale = 1;
    NS.Screens.hud.show();
    NS.Audio.startMusic(false);
  },
  restart() {
    const mode = this.play ? this.play.mode : 'campaign';
    if (mode === 'campaign' && this.play) this.startRun('campaign', this.play.levelIdx || 0);
    else this.startRun(mode);
  },
  quitToMenu() {
    NS.Audio.stopMusic();
    this.loop.timeScale = 1;
    this.play = null; this.paused = false;
    NS.Screens.hideWarning();
    NS.Screens.hud.hide();
    NS.Screens.show('menu');
    NS.Screens.refreshMenu();
  },
  togglePause() {
    if (!this.play || this.play.phase === 'over' || document.getElementById('tutorial').classList.contains('hidden') === false) return;
    if (document.getElementById('screen-pause').classList.contains('hidden') === false) { this.resume(); return; }
    this.paused = true;
    NS.Screens.show('pause');
  },
  resume() {
    this.paused = false;
    NS.Screens.hideAll();
    NS.Screens.hud.show();
  },

  step(dt, raw) {
    if (this.play) {
      if (!this.paused) this.play.update(dt, raw);
    } else {
      this.menuBg.update(dt);
    }
  },
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 480, 800);
    if (this.play) this.play.render(ctx);
    else this.menuBg.render(ctx, null);
  }
};

// 脚本位于 body 末尾：此时其上方所有 DOM 元素均已解析，直接初始化（不等 DOMContentLoaded，
// 避免某些注入环境合成/提前触发该事件时 DOM 尚未构建完成）
App.init();
})();
