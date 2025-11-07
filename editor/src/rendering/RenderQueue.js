export class RenderQueue {
  constructor() {
    this._queue = [];
    this._isFlushing = false;
  }

  add(task, priority = 'normal') {
    const p = priorityRank(priority);
    this._queue.push({ task, p });
    this._queue.sort((a, b) => a.p - b.p);
    this.flush();
  }

  flush() {
    if (this._isFlushing) return;
    this._isFlushing = true;
    const run = () => {
      const start = performance.now();
      while (this._queue.length) {
        const { task } = this._queue.shift();
        task();
        if (performance.now() - start > 8) break; // keep frame budget
      }
      if (this._queue.length) requestAnimationFrame(run);
      else this._isFlushing = false;
    };
    requestAnimationFrame(run);
  }
}

function priorityRank(priority) {
  switch (priority) {
    case 'critical': return 0;
    case 'high': return 1;
    case 'normal': return 2;
    case 'low': return 3;
    default: return 2;
  }
}


