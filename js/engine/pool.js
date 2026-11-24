/* pool.js —— 通用对象池，全局 NS.Pool */
(function () {
'use strict';
window.NS = window.NS || {};

class Pool {
  constructor(factory) { this.factory = factory; this.free = []; }
  acquire() {
    const o = this.free.pop();
    return o ? o : this.factory();
  }
  release(o) { this.free.push(o); }
  get size() { return this.free.length; }
}

NS.Pool = Pool;
})();
