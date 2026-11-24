/* hud.js —— 战斗 HUD（DOM），全局 NS.Screens.hud */
(function () {
'use strict';
window.NS = window.NS || {};
const $ = (id) => document.getElementById(id);
const { pad } = NS.U;

const HUD = {
  el: {},
  init() {
    this.el = {
      hud: $('hud'), score: $('score'), combo: $('combo'), coins: $('coins-hud'),
      hp: $('hp-fill'), pips: $('shield-pips'), hyper: $('hyper-fill'),
      bombs: $('bombs-hud'), lives: $('lives-hud'),
      bossbar: $('bossbar'), bossName: $('boss-name'), bossFill: $('boss-fill'),
      stage: $('stage-label'), skill: $('skill-hud')
    };
  },
  show() { this.el.hud.classList.remove('hidden'); },
  hide() { this.el.hud.classList.add('hidden'); this.el.bossbar.classList.add('hidden'); },
  setStage(text) { this.el.stage.textContent = text; },

  comboMult(combo) {
    let m = 1;
    for (const t of NS.CONFIG.player.comboTiers) if (combo >= t.n) m = t.m;
    return m;
  },

  update(g) {
    const p = g.player;
    this.el.score.textContent = pad(Math.floor(g.score), 8);
    this.el.coins.textContent = '⛁ ' + g.coinsEarned;

    if (g.combo >= 10) {
      this.el.combo.classList.remove('hidden');
      this.el.combo.textContent = g.combo + ' ×' + this.comboMult(g.combo);
    } else this.el.combo.classList.add('hidden');

    if (p.alive) {
      const hpR = Math.max(0, p.hp / p.maxHp);
      this.el.hp.style.width = (hpR * 100) + '%';
      this.el.hp.classList.toggle('low', hpR < 0.3);
    }
    // 护盾层
    let html = '';
    for (let i = 0; i < p.maxShields; i++)
      html += '<span class="pip"' + (i >= p.shields ? ' style="opacity:.25"' : '') + '></span>';
    this.el.pips.innerHTML = html;

    // HYPER
    if (p.hyperActive) {
      this.el.hyper.style.width = '100%';
      this.el.hyper.style.opacity = (Math.sin(performance.now() / 80) > 0 ? 1 : 0.4);
    } else {
      this.el.hyper.style.width = p.hyper + '%';
      this.el.hyper.style.opacity = 1;
    }

    this.el.bombs.textContent = '💣 ×' + p.bombs;
    let lives = '';
    for (let i = 0; i < p.lives; i++) lives += '✈ ';
    this.el.lives.textContent = lives.trim();

    // 技能状态
    const sk = p.cfg.skill;
    if (sk && this.el.skill) {
      this.el.skill.classList.remove('hidden');
      if (p.skillActiveT > 0) {
        this.el.skill.textContent = sk.name + ' ' + p.skillActiveT.toFixed(1) + 's';
        this.el.skill.classList.add('ready');
      } else if (p.skillT > 0) {
        this.el.skill.textContent = 'CD ' + p.skillT.toFixed(1) + 's';
        this.el.skill.classList.remove('ready');
      } else {
        this.el.skill.textContent = sk.name + ' [X]';
        this.el.skill.classList.add('ready');
      }
    } else if (this.el.skill) {
      this.el.skill.classList.add('hidden');
    }

    // Boss 血条
    if (g.boss && g.boss.entered && !g.boss.dead) {
      this.el.bossbar.classList.remove('hidden');
      this.el.bossName.textContent = g.boss.name;
      this.el.bossFill.style.width = (g.boss.ratio * 100) + '%';
    } else this.el.bossbar.classList.add('hidden');
  }
};

NS.Screens = NS.Screens || {};
NS.Screens.hud = HUD;
})();
