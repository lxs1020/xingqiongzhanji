/* input.js —— 键盘 / 鼠标 / 触屏统一输入，全局 NS.Input */
(function () {
'use strict';
window.NS = window.NS || {};
const { clamp } = NS.U;

class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pointer = { x: 240, y: 700, down: false };
    this.lowSpeed = false;
    this.bombQueued = false;
    this.skillQueued = false;
    this.onPause = null;
    this.lastTap = 0;

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
      if (k === 'p' || k === 'escape') { if (this.onPause) this.onPause(); return; }
      if (k === ' ') this.bombQueued = true;
      if (k === 'x') this.skillQueued = true;
      this.keys.add(k);
      NS.Audio.ensure();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());

    const toLocal = (clientX, clientY, touchOffset) => {
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width * 480;
      let y = (clientY - rect.top) / rect.height * 800;
      if (touchOffset) y -= 60; // 触屏时手指在机体上方 60px，避免遮挡
      return { x: clamp(x, 0, 480), y: clamp(y, 0, 800) };
    };

    const down = (x, y, isTouch) => {
      NS.Audio.ensure();
      const p = toLocal(x, y, isTouch);
      this.pointer.x = p.x; this.pointer.y = p.y; this.pointer.down = true;
      const now = performance.now();
      if (now - this.lastTap < 300) this.bombQueued = true;
      this.lastTap = now;
    };
    const move = (x, y, isTouch) => {
      if (!this.pointer.down) return;
      const p = toLocal(x, y, isTouch);
      this.pointer.x = p.x; this.pointer.y = p.y;
    };
    const up = () => { this.pointer.down = false; };

    canvas.addEventListener('mousedown', (e) => down(e.clientX, e.clientY, false));
    canvas.addEventListener('mousemove', (e) => move(e.clientX, e.clientY, false));
    window.addEventListener('mouseup', up);

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0]; down(t.clientX, t.clientY, true);
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0]; move(t.clientX, t.clientY, true);
    }, { passive: false });
    canvas.addEventListener('touchend', up);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // 返回归一化键盘移动向量
  axis() {
    let x = 0, y = 0;
    const k = this.keys;
    if (k.has('a') || k.has('arrowleft')) x -= 1;
    if (k.has('d') || k.has('arrowright')) x += 1;
    if (k.has('w') || k.has('arrowup')) y -= 1;
    if (k.has('s') || k.has('arrowdown')) y += 1;
    this.lowSpeed = k.has('shift');
    if (x && y) { x *= 0.7071; y *= 0.7071; }
    return { x, y };
  }
  consumeBomb() { const b = this.bombQueued; this.bombQueued = false; return b; }
  consumeSkill() { const s = this.skillQueued; this.skillQueued = false; return s; }
}

NS.Input = Input;
})();
