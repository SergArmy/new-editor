function isObject(v) { return v && typeof v === 'object'; }

export class StateDiff {
  static diff(prev, next) {
    const changes = [];
    walk('', prev, next, changes);
    return { changes };
  }
}

function walk(path, a, b, out) {
  if (a === b) return;
  const aObj = isObject(a);
  const bObj = isObject(b);
  if (!aObj || !bObj) {
    if (!Object.is(a, b)) out.push({ path, type: typeof a === 'undefined' ? 'added' : typeof b === 'undefined' ? 'removed' : 'updated', prev: a, next: b });
    return;
  }
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const k of keys) {
    const p = path ? `${path}.${k}` : k;
    if (!(k in a)) { out.push({ path: p, type: 'added', prev: undefined, next: b[k] }); continue; }
    if (!(k in b)) { out.push({ path: p, type: 'removed', prev: a[k], next: undefined }); continue; }
    if (isObject(a[k]) && isObject(b[k])) walk(p, a[k], b[k], out);
    else if (!Object.is(a[k], b[k])) out.push({ path: p, type: 'updated', prev: a[k], next: b[k] });
  }
}


