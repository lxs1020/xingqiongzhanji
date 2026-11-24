/* endless.js —— 无尽模式波次导演，全局 NS.Endless */
(function () {
'use strict';
window.NS = window.NS || {};
const { choice } = NS.U;
const E = NS.CONFIG.endless;

NS.Endless = {
  start(g) {
    g.levelIdx = -1;
    g.wave = 1;
    g.waveT = 0;
    g.groupT = 1.5;
    g.bossArmed = false;
    g.bossCount = 0;
    g.diff = E.difficulty(1);
    g.bg.theme = '#00F0FF';
    NS.Screens.hud.setStage('ENDLESS · WAVE 1');
  },

  _pool(wave) {
    const p = ['scout', 'striker'];
    if (wave >= 2) p.push('spreader');
    if (wave >= 3) p.push('hunter');
    if (wave >= 4) p.push('kamikaze');
    if (wave >= 5) p.push('guard');
    if (wave >= 7) p.push('carrier');
    return p;
  },

  update(dt, g) {
    if (g.phase === 'warn' || g.phase === 'boss') return;

    // 波次推进
    g.waveT += dt;
    if (g.waveT >= E.waveLen) {
      g.waveT = 0;
      g.wave++;
      g.diff = E.difficulty(g.wave);
      NS.Screens.hud.setStage('ENDLESS · WAVE ' + g.wave);
      g.fx.text(240, 300, 'WAVE ' + g.wave, '#00F0FF');
      if (g.wave % E.bossEvery === 0) {
        const id = E.bossCycle[g.bossCount % E.bossCycle.length];
        g.bossCount++;
        g.requestBoss(id, g.diff);
        return;
      }
    }

    // 编队刷新
    g.groupT -= dt;
    if (g.groupT <= 0) {
      g.groupT = Math.max(0.8, E.groupEvery - g.wave * 0.03);
      const kind = choice(this._pool(g.wave));
      const formation = choice(['line', 'v', 'stream', 'sides']);
      const n = NS.U.randInt(3, Math.min(6, 3 + Math.floor(g.wave / 3)));
      g.spawnFormation(kind, formation, n);
    }
  }
};
})();
