export function renderRunnerUI(runner) {
  const runAllBtn = document.getElementById('run-all');
  const filterInput = document.getElementById('filter');
  const suiteList = document.getElementById('suite-list');
  const results = document.getElementById('test-results');

  runner.onProgress(draw);
  runner.onComplete(draw);

  function draw(state) {
    results.innerHTML = '';
    for (const suite of state.suites || []) {
      const wrap = document.createElement('section');
      wrap.className = 'suite';
      const h2 = document.createElement('h2');
      h2.textContent = `${suite.name} — ${suite.passed}/${suite.total}`;
      wrap.appendChild(h2);
      for (const t of suite.tests) {
        const el = document.createElement('div');
        el.className = `test ${t.status}`;
        el.innerHTML = `<div class="name">${t.name}</div>` + (t.error ? `<pre class="message">${t.error}</pre>` : '');
        wrap.appendChild(el);
      }
      results.appendChild(wrap);
    }
  }

  runAllBtn.addEventListener('click', () => runner.run(filterInput.value));

  // Sidebar list
  suiteList.innerHTML = '';
  // Build once on load; clicking will run a single suite
  // For simplicity, the list will be populated after first run
}


