/* audio.js —— Web Audio 程序合成音效 + 步进 BGM，全局 NS.Audio */
(function () {
'use strict';
window.NS = window.NS || {};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicTimer = null;
    this.step = 0;
    this.boss = false;
    this.lastShoot = 0;
  }

  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.connect(this.ctx.destination);
    this.sfxGain.connect(this.ctx.destination);
    this.applyVolumes();
  }

  applyVolumes() {
    if (!this.ctx) return;
    const s = NS.Save.settings;
    const m = s.muted ? 0 : 1;
    this.musicGain.gain.value = s.music * 0.35 * m;
    this.sfxGain.gain.value = s.sfx * 0.5 * m;
  }

  _blip(freq, dur, type, vol, slideTo) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }

  _noise(dur, vol, freqFrom, freqTo) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(freqFrom, t);
    f.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start(t);
  }

  shoot() {
    const now = performance.now();
    if (now - this.lastShoot < 45) return;  // 防吵：每 45ms 最多一声
    this.lastShoot = now;
    this._blip(880, 0.05, 'square', 0.12, 440);
  }
  hit() {
    const now = performance.now();
    if (now - (this.lastHit || 0) < 50) return;
    this.lastHit = now;
    this._blip(200, 0.06, 'sine', 0.18, 120);
  }
  boom(big) {
    this._noise(big ? 0.6 : 0.3, big ? 0.5 : 0.3, 800, 100);
    if (big) this._blip(60, 0.5, 'sine', 0.4, 30);
  }
  pick() { this._blip(660, 0.06, 'triangle', 0.25, 660); setTimeout(() => this._blip(990, 0.08, 'triangle', 0.25), 60); }
  graze() { this._blip(2000, 0.03, 'triangle', 0.08, 1800); }
  warn() {
    for (let i = 0; i < 3; i++) setTimeout(() => this._blip(i % 2 ? 554 : 440, 0.4, 'sawtooth', 0.3), i * 500);
  }
  laser() { this._blip(1200, 0.5, 'sawtooth', 0.15, 200); }
  bomb() { this._noise(0.8, 0.6, 1200, 60); this._blip(50, 0.7, 'sine', 0.5, 28); }
  phase() { this._noise(0.4, 0.4, 900, 120); this._blip(160, 0.4, 'square', 0.3, 60); }
  ui() { this._blip(700, 0.05, 'square', 0.15, 900); }

  startMusic(boss) {
    this.ensure();
    if (!this.ctx) return;
    this.stopMusic();
    this.boss = !!boss;
    this.step = 0;
    // 16 步进：普通 128BPM(117ms/步)，Boss 140BPM(107ms/步)
    const interval = this.boss ? 107 : 117;
    const arpN = [0, 4, 7, 12, 7, 4, 0, 7, 2, 7, 12, 16, 12, 7, 2, 7];
    const arpBoss = [0, 3, 7, 10, 7, 3, 0, 3, -2, 3, 7, 12, 10, 7, 3, 7];
    const base = this.boss ? 196 : 220;
    this.musicTimer = setInterval(() => {
      if (!this.ctx) return;
      const s = this.step % 16;
      const semis = (this.boss ? arpBoss : arpN)[s];
      const f = base * Math.pow(2, semis / 12);
      this._blip(f, 0.14, 'triangle', 0.16);
      if (s % 4 === 0) this._blip(base / 2, 0.22, 'square', 0.14);
      if (this.boss && s % 2 === 1) this._blip(base / 4, 0.1, 'sawtooth', 0.1);
      this.step++;
    }, interval);
  }
  stopMusic() { if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; } }
}

NS.Audio = new AudioEngine();
})();
