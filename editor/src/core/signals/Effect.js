export function effect(fn, deps = []) {
  let cleanup = null;
  const run = () => {
    if (typeof cleanup === 'function') try { cleanup(); } catch {}
    cleanup = fn();
  };
  const unsubs = deps.map(d => d.subscribe(run));
  run();
  return () => { unsubs.forEach(u => u()); if (typeof cleanup === 'function') cleanup(); };
}


