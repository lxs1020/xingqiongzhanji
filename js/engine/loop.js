/* loop.js —— requestAnimationFrame + 固定时间步长，全局 NS.Loop */
(function () {
'use strict';
window.NS = window.NS || {};

class Loop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.step = 1 / 60;
    this.acc = 0;
    this.last = 0;
    this.running = false;
    this.timeScale = 1;
    this._raf = this._raf.bind(this);
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._raf);
  }
  stop() { this.running = false; }
  _raf(now) {
    if (!this.running) return;
    let frame = (now - this.last) / 1000;
    this.last = now;
    if (frame > 0.25) frame = 0.25; // 切后台后防大跳
    this.acc += frame;
    let n = 0;
    while (this.acc >= this.step && n < 5) {
      // 单帧逻辑异常不得杀死 rAF 循环
      try {
        this.update(this.step * this.timeScale, this.step);
      } catch (err) {
        console.error('[loop] frame error:', err);
      }
      this.acc -= this.step;
      n++;
    }
    this.render();
    requestAnimationFrame(this._raf);
  }
}

NS.Loop = Loop;
})();
