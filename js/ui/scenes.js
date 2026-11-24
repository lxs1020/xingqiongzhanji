/* scenes.js —— DOM 菜单/面板场景管理，全局 NS.Screens */
(function () {
'use strict';
window.NS = window.NS || {};
const $ = (id) => document.getElementById(id);
const C = () => NS.CONFIG;

const SCREEN_IDS = ['menu', 'ships', 'upgrade', 'rank', 'settings', 'pause', 'result', 'levels', 'help', 'shop'];

const Scenes = {
  app: null,

  init(app) {
    this.app = app;
    NS.Screens.hud.init();

    // 全局按钮事件委托
    document.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab]');
      if (tab) {
        NS.Audio.ui();
        document.querySelectorAll('.help-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.help-pane').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const pane = $('help-' + tab.dataset.tab);
        if (pane) pane.classList.add('active');
        return;
      }
      const dot = e.target.closest('[data-shipdot]');
      if (dot) { this._shipGoTo(+dot.dataset.shipdot); return; }
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      NS.Audio.ui();
      const a = btn.dataset.action;
      switch (a) {
        case 'start-campaign': app.startRun('campaign'); break;
        case 'start-endless': app.startRun('endless', 0, null, +btn.dataset.world || 1); break;
        case 'go-menu': this.show('menu'); this.refreshMenu(); break;
        case 'go-levels': this.show('levels'); this.renderLevels(); break;
        case 'go-ships':
          this._shipIdx = Math.max(0, this._shipIds.indexOf(NS.Save.selected));
          this.show('ships'); this.renderShips(); break;
        case 'go-upgrade': this.show('upgrade'); this.renderUpgrades(); break;
        case 'go-rank': this.show('rank'); this.renderRank(); break;
        case 'go-help': this.show('help'); break;
        case 'go-settings': this.show('settings'); this.syncSettings(); break;
        case 'resume': app.resume(); break;
        case 'restart': app.restart(); break;
        case 'quit': app.quitToMenu(); break;
      }
    });

    const on = (id, ev, fn) => { const el = $(id); if (el) el.addEventListener(ev, fn); };
    on('pause-btn', 'click', () => app.togglePause());
    on('tut-ok', 'click', () => {
      $('tutorial').classList.add('hidden');
      NS.Save.settings.tutorial = true;
      NS.Save.write();
      app._beginRun();
    });
    on('record-save', 'click', () => this.saveRecord());

    // 道具购买
    on('shop-clear', 'click', () => {
      NS.Audio.ui();
      this._selectedShop = null;
      document.querySelectorAll('.shop-item').forEach(r => r.classList.remove('selected'));
    });
    on('shop-confirm', 'click', () => {
      NS.Audio.ui();
      const it = this._selectedShop;
      if (it) {
        NS.Save.coins -= it.price;
        NS.Save.write();
      }
      this.app.startRun('campaign', this._pendingLevelIdx || 0, it);
    });

    // 战机轮播：箭头 + 横向拉杆
    on('ship-prev', 'click', () => this._shipGoTo(this._shipIdx - 1));
    on('ship-next', 'click', () => this._shipGoTo(this._shipIdx + 1));
    on('ship-slider', 'input', (e) => this._shipGoTo(+e.target.value, false));

    // 设置项
    on('set-music', 'input', (e) => {
      NS.Save.settings.music = e.target.value / 100; NS.Save.write(); NS.Audio.applyVolumes();
    });
    on('set-sfx', 'input', (e) => {
      NS.Save.settings.sfx = e.target.value / 100; NS.Save.write(); NS.Audio.applyVolumes();
    });
    on('set-quality', 'change', (e) => {
      NS.Save.settings.quality = e.target.checked ? 'low' : 'high';
      NS.Save.write();
      document.getElementById('stage').classList.toggle('low', e.target.checked);
    });
    on('set-mute', 'click', () => {
      NS.Save.settings.muted = !NS.Save.settings.muted;
      NS.Save.write(); NS.Audio.applyVolumes();
      const b = $('#set-mute');
      if (b) b.textContent = '静音：' + (NS.Save.settings.muted ? '开' : '关');
    });
  },

  show(name) {
    for (const id of SCREEN_IDS) $('screen-' + id).classList.add('hidden');
    if (name) $('screen-' + name).classList.remove('hidden');
  },
  hideAll() { for (const id of SCREEN_IDS) $('screen-' + id).classList.add('hidden'); },

  refreshMenu() {
    $('high-score').textContent = 'HI-SCORE ' + String(NS.Save.highscore).padStart(8, '0');
  },

  /* ---------------- 关卡选择 ---------------- */
  renderLevels() {
    const box = $('level-list');
    if (!box) return;
    box.innerHTML = '';
    const levels = C().levels;
    const cleared = NS.Save.cleared || 0;   // 已通关数量 → 可解锁到 cleared 关（索引）
    levels.forEach((lv, i) => {
      const locked = i > cleared;
      const done = i < cleared;
      const row = document.createElement('div');
      row.className = 'level-item' + (locked ? ' locked' : '');
      const bossName = lv.boss ? (C().bosses[lv.boss] && C().bosses[lv.boss].name || lv.boss) : '';
      const state = locked ? '🔒 通关上一关解锁' : done ? '✓ 已通关' : '可挑战';
      row.innerHTML =
        '<div class="lv-no">' + (i + 1) + '</div>' +
        '<div class="lv-info">' +
          '<div class="lv-name">' + lv.name + '</div>' +
          '<div class="lv-boss">BOSS: ' + bossName + ' · ' + lv.duration + 's</div>' +
        '</div>' +
        '<div class="lv-state ' + (locked ? 'locked' : done ? 'cleared' : 'open') + '">' + state + '</div>';
      if (!locked) {
        row.addEventListener('click', () => {
          NS.Audio.ui();
          this._pendingLevelIdx = i;
          this.show('shop');
          this.renderShop();
        });
      }
      box.appendChild(row);
    });
  },

  /* ---------------- 道具购买 ---------------- */
  renderShop() {
    $('shop-coins').textContent = '⛁ ' + NS.Save.coins;
    const box = $('shop-list');
    box.innerHTML = '';
    this._selectedShop = null;
    for (const it of C().shopItems) {
      const afford = NS.Save.coins >= it.price;
      const row = document.createElement('div');
      row.className = 'shop-item' + (afford ? '' : ' disabled');
      row.innerHTML =
        '<div><div class="sname">' + it.name + '</div>' +
        '<div class="sdesc">' + it.desc + '</div></div>' +
        '<div class="sprice">⛁ ' + it.price + '</div>';
      if (afford) {
        row.addEventListener('click', () => {
          NS.Audio.ui();
          document.querySelectorAll('.shop-item').forEach(r => r.classList.remove('selected'));
          row.classList.add('selected');
          this._selectedShop = it;
        });
      }
      box.appendChild(row);
    }
  },

  /* ---------------- 选机（轮播） ---------------- */
  _shipIds: ['A', 'B', 'C', 'D', 'E'],
  _shipIdx: 0,

  _shipGoTo(i, playSound) {
    const n = Math.max(0, Math.min(this._shipIds.length - 1, i));
    if (n === this._shipIdx) return;
    this._shipIdx = n;
    if (playSound !== false) NS.Audio.ui();
    this._syncShipCarousel();
  },

  _syncShipCarousel() {
    const track = $('ship-cards');
    if (track) track.style.transform = 'translateX(' + (-this._shipIdx * 100) + '%)';
    const dots = $('ship-dots');
    if (dots) {
      dots.innerHTML = this._shipIds.map((_, i) =>
        '<button class="ship-dot' + (i === this._shipIdx ? ' active' : '') + '" data-shipdot="' + i + '"></button>'
      ).join('');
    }
    const slider = $('ship-slider');
    if (slider) slider.value = this._shipIdx;
    const prev = $('ship-prev'), next = $('ship-next');
    if (prev) prev.disabled = this._shipIdx === 0;
    if (next) next.disabled = this._shipIdx === this._shipIds.length - 1;
  },

  renderShips() {
    const box = $('ship-cards');
    box.innerHTML = '';
    for (const id of this._shipIds) {
      const s = C().ships[id];
      const unlocked = !!NS.Save.unlocks[id];
      const selected = NS.Save.selected === id;
      const card = document.createElement('div');
      card.className = 'ship-card' + (selected ? ' selected' : '') + (unlocked ? '' : ' locked');
      card.innerHTML =
        '<canvas class="ship-canvas" width="140" height="110"></canvas>' +
        '<div class="ship-name">' + s.name + '</div>' +
        '<div class="ship-en">' + s.en + '</div>' +
        '<div class="stars">' +
          ['速度', '火力', '生存'].map((n, i) => n + ' ' + '★'.repeat(s.stars[i]) + '☆'.repeat(5 - s.stars[i])).join('<br>') +
        '</div>' +
        '<div class="ship-desc">' + s.desc + '</div>' +
        (s.skill ? '<div class="ship-skill-tag">专属技能：' + s.skill.name + ' [X键]</div>'
                 : '<div class="ship-skill-tag" style="color:#8B9DC3">无专属技能</div>') +
        (unlocked
          ? (selected ? '<div class="tag-sel">已选择</div><div class="ship-price" style="color:#00F0FF">点击设为出战</div>'
                      : '<div class="ship-price" style="color:#00F0FF">点击选择</div>')
          : '<div class="ship-price">⛁ ' + s.price + '</div>');
      const cv = card.querySelector('canvas');
      this._drawShipPreview(cv, s.color, id);
      card.addEventListener('click', () => {
        NS.Audio.ui();
        if (unlocked) {
          NS.Save.selected = id; NS.Save.write();
          this.renderShips();
        } else if (NS.Save.coins >= s.price) {
          NS.Save.coins -= s.price;
          NS.Save.unlocks[id] = true;
          NS.Save.selected = id;
          NS.Save.write();
          this.renderShips();
        } else {
          this.flashCoin(card);
        }
      });
      box.appendChild(card);
    }
    this._syncShipCarousel();
  },
  _drawShipPreview(cv, col, id) {
    const ctx = cv.getContext('2d');
    ctx.save(); ctx.translate(cv.width / 2, cv.height / 2);
    ctx.scale(1.9, 1.9);
    ctx.shadowColor = col; ctx.shadowBlur = 12;
    ctx.strokeStyle = col; ctx.fillStyle = 'rgba(8,14,36,.95)'; ctx.lineWidth = 2;
    ctx.beginPath();
    if (id === 'B') {
      ctx.moveTo(0, -18); ctx.lineTo(-22, 15); ctx.lineTo(-8, 13); ctx.lineTo(0, 18);
      ctx.lineTo(8, 13); ctx.lineTo(22, 15);
    } else if (id === 'C') {
      ctx.moveTo(0, -22); ctx.lineTo(-10, 16); ctx.lineTo(0, 12); ctx.lineTo(10, 16);
    } else if (id === 'D') {
      ctx.moveTo(0, -22); ctx.lineTo(-6, -4); ctx.lineTo(-16, 14);
      ctx.lineTo(-6, 10); ctx.lineTo(0, 18); ctx.lineTo(6, 10);
      ctx.lineTo(16, 14); ctx.lineTo(6, -4);
    } else if (id === 'E') {
      ctx.moveTo(0, -20); ctx.lineTo(-10, -6); ctx.lineTo(-20, 10);
      ctx.lineTo(-20, 18); ctx.lineTo(-8, 14); ctx.lineTo(0, 20);
      ctx.lineTo(8, 14); ctx.lineTo(20, 18); ctx.lineTo(20, 10);
      ctx.lineTo(10, -6);
    } else {
      ctx.moveTo(0, -20); ctx.lineTo(-17, 15); ctx.lineTo(0, 9); ctx.lineTo(17, 15);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#E6F1FF';
    ctx.beginPath(); ctx.ellipse(0, -5, 2.5, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  flashCoin(el) {
    el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 220 });
  },

  /* ---------------- 升级 ---------------- */
  renderUpgrades() {
    $('upgrade-coins').textContent = '⛁ ' + NS.Save.coins;
    const list = $('upgrade-list');
    list.innerHTML = '';
    for (const u of C().upgrades) {
      const lv = NS.Save.upgrades[u.id];
      const maxed = lv >= u.max;
      const price = maxed ? 0 : u.price[lv];
      const row = document.createElement('div');
      row.className = 'up-item';
      row.innerHTML =
        '<div class="up-info"><div class="up-name">' + u.name + '</div>' +
        '<div class="up-desc">' + u.desc + '</div></div>' +
        '<div class="up-level">' + '▰'.repeat(lv) + '▱'.repeat(u.max - lv) + '</div>' +
        '<button class="btn up-buy"' + (maxed || NS.Save.coins < price ? ' disabled' : '') + '>' +
        (maxed ? 'MAX' : '⛁' + price) + '</button>';
      row.querySelector('button').addEventListener('click', () => {
        if (maxed || NS.Save.coins < price) return;
        NS.Save.coins -= price;
        NS.Save.upgrades[u.id] = lv + 1;
        NS.Save.write();
        NS.Audio.pick();
        this.renderUpgrades();
      });
      list.appendChild(row);
    }
  },

  /* ---------------- 排行榜 ---------------- */
  renderRank() {
    const box = $('rank-list');
    box.innerHTML = '';
    const rank = NS.Save.rank;
    if (!rank.length) {
      box.innerHTML = '<div class="rank-empty">暂无记录，先去打一局吧！</div>';
      return;
    }
    rank.forEach((r, i) => {
      const row = document.createElement('div');
      row.className = 'rank-row' + (r.me ? ' me' : '');
      row.innerHTML =
        '<span class="rank-no">' + (i + 1) + '</span>' +
        '<span class="rank-name">' + r.name + '</span>' +
        '<span class="rank-score">' + String(r.score).padStart(8, '0') + '</span>' +
        '<span class="rank-mode">' + (r.mode === 'endless' ? '无尽' : '闯关') + '·' + r.ship + '</span>';
      box.appendChild(row);
    });
  },

  /* ---------------- 设置 ---------------- */
  syncSettings() {
    const s = NS.Save.settings;
    if ($('#set-music')) $('#set-music').value = Math.round(s.music * 100);
    if ($('#set-sfx')) $('#set-sfx').value = Math.round(s.sfx * 100);
    if ($('#set-quality')) $('#set-quality').checked = s.quality === 'low';
    $('#set-mute').textContent = '静音：' + (s.muted ? '开' : '关');
  },

  /* ---------------- 警报 / Toast / 暂停 ---------------- */
  warning(name) {
    $('warn-sub').textContent = name;
    const w = $('warning');
    w.classList.remove('hidden');
    NS.Audio.warn();
  },
  hideWarning() { $('warning').classList.add('hidden'); },
  toast(text) {
    const t = $('toast');
    t.textContent = text;
    t.classList.remove('hidden');
    // 重启动画
    void t.offsetWidth;
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => t.classList.add('hidden'), 2400);
  },

  /* ---------------- 结算 ---------------- */
  result(d) {
    $('result-title').textContent = d.win ? 'MISSION COMPLETE' : 'GAME OVER';
    $('result-title').classList.toggle('fail', !d.win);
    $('result-rank-grade').textContent = d.grade;
    $('r-score').textContent = Math.floor(d.score).toLocaleString();
    $('r-kills').textContent = d.kills;
    $('r-graze').textContent = d.grazes;
    $('r-combo').textContent = d.maxCombo;
    $('r-coins').textContent = '+' + d.coins;
    // 新纪录输入
    const nr = $('new-record'), rn = $('#record-name');
    if (d.newRecord && nr) {
      nr.classList.remove('hidden');
      if (rn) rn.value = 'AAA';
      this._pendingRecord = d;
    } else if (nr) nr.classList.add('hidden');
    this.show('result');
  },
  saveRecord() {
    if (!this._pendingRecord) return;
    const rn = $('#record-name');
    let name = 'AAA';
    if (rn) name = (rn.value || 'AAA').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'AAA';
    const d = this._pendingRecord;
    NS.Save.rank.push({ name, score: Math.floor(d.score), ship: d.ship, mode: d.mode });
    NS.Save.rank.sort((a, b) => b.score - a.score);
    NS.Save.rank = NS.Save.rank.slice(0, 10);
    NS.Save.write();
    this._pendingRecord = null;
    $('new-record').classList.add('hidden');
  }
};

NS.Screens = Object.assign(NS.Screens || {}, Scenes);
})();
