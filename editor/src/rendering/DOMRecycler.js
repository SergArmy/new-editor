export class DOMRecycler {
  constructor() {
    this.pools = new Map();
  }

  acquire(tag = 'div', className = '') {
    const key = `${tag}|${className}`;
    const pool = this.pools.get(key) || [];
    const el = pool.pop() || document.createElement(tag);
    el.className = className;
    this.pools.set(key, pool);
    return el;
  }

  release(el) {
    if (!el) return;
    const key = `${el.tagName.toLowerCase()}|${el.className}`;
    resetElement(el);
    if (!this.pools.has(key)) this.pools.set(key, []);
    this.pools.get(key).push(el);
  }
}

function resetElement(el) {
  el.textContent = '';
  // remove children
  while (el.firstChild) el.removeChild(el.firstChild);
}


