/* level.js —— 闯关模式时间轴波次导演，全局 NS.Level */
(function () {
'use strict';
window.NS = window.NS || {};

NS.Level = {
  start(g, idx) {
    const cfg = NS.CONFIG.levels[idx];
    g.levelCfg = cfg;
    g.levelIdx = idx;
    g.elapsed = 0;
    // 应用 spawnRate 时间压缩 + hpScale 血量倍率
    const sr = cfg.spawnRate || 1;
    const hs = cfg.hpScale || 1;
    g.queue = cfg.waves.map(w => [w[0] * sr, w[1], w[2], w[3]]);
    g.levelHpScale = hs;
    g.eliteHp = cfg.eliteHp || 1;   // 精英/强化/大型机额外血量倍率（二三四关 +25%）
    g.bossArmed = false;
    g.extraBoss = cfg.dualBoss || null;
    g.diff = hs;
    g.bg.theme = cfg.theme;
    NS.Screens.hud.setStage(cfg.name);
  },

  update(dt, g) {
    if (g.phase === 'warn' || g.phase === 'boss' || g.phase === 'clear') return;
    g.elapsed += dt;

    while (g.queue.length && g.queue[0][0] <= g.elapsed) {
      const [, kind, formation, n] = g.queue.shift();
      g.spawnFormation(kind, formation, n);
    }

    if (!g.bossArmed && g.queue.length === 0 && g.elapsed >= NS.CONFIG.levels[g.levelIdx].duration) {
      g.bossArmed = true;
      g.requestBoss(NS.CONFIG.levels[g.levelIdx].boss, NS.CONFIG.levels[g.levelIdx].bossScale);
    }
  }
};

/* ---------------- 编队生成（关卡与无尽共用） ---------------- */
NS.formations = {
  // 横排
  line(g, kind, n) {
    const gap = Math.min(70, 380 / Math.max(1, n - 1));
    const total = gap * (n - 1);
    for (let i = 0; i < n; i++)
      g.spawnEnemyAt(kind, 240 - total / 2 + i * gap, -30);
  },
  // V 字
  v(g, kind, n) {
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1;
      const k = Math.ceil(i / 2);
      g.schedule(0.06 * i, () => g.spawnEnemyAt(kind, 240 + side * 36 * k, -30 - k * 36));
    }
  },
  // 左右夹击
  sides(g, kind, n) {
    for (let i = 0; i < n; i++) {
      const left = i % 2 === 0;
      g.schedule(0.12 * i, () => {
        const e = g.spawnEnemyAt(kind, left ? -20 : 500, 80 + 40 * Math.floor(i / 2));
        e.vx = (left ? 1 : -1) * e.speed * 0.7;
        e.vy = e.speed * 0.7;
      });
    }
  },
  // 单线鱼贯
  stream(g, kind, n) {
    for (let i = 0; i < n; i++)
      g.schedule(0.55 * i, () => g.spawnEnemyAt(kind, NS.U.rand(60, 420), -30));
  }
};
})();
