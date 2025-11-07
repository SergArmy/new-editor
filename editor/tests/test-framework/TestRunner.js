export class TestRunner {
  constructor() {
    this.suites = [];
    this.progressCallbacks = [];
    this.completeCallbacks = [];
  }

  registerSuite(suite) {
    this.suites.push(suite);
  }

  onProgress(cb) { this.progressCallbacks.push(cb); }
  onComplete(cb) { this.completeCallbacks.push(cb); }

  async run(filter = '') {
    const results = { total: 0, passed: 0, failed: 0, suites: [] };
    for (const suite of this.suites) {
      if (filter && !suite.name.toLowerCase().includes(filter.toLowerCase())) continue;
      const suiteResult = await this.runSuiteInstance(suite);
      results.suites.push({ name: suite.name, ...suiteResult });
      results.total += suiteResult.total;
      results.passed += suiteResult.passed;
      results.failed += suiteResult.failed;
      this.progressCallbacks.forEach(cb => cb(results));
    }
    this.completeCallbacks.forEach(cb => cb(results));
    return results;
  }

  async runSuite(name) {
    const suite = this.suites.find(s => s.name === name);
    if (!suite) throw new Error(`Suite not found: ${name}`);
    return this.runSuiteInstance(suite);
  }

  async runSuiteInstance(suite) {
    const only = suite.tests.filter(t => t.only);
    const runnable = (only.length ? only : suite.tests).filter(t => !t.skip);
    const res = { total: 0, passed: 0, failed: 0, tests: [] };

    for (const hook of suite.hooks.beforeAll) await hook();
    for (const t of runnable) {
      for (const hook of suite.hooks.beforeEach) await hook();
      try {
        await t.fn();
        res.tests.push({ name: t.name, status: 'pass' });
        res.passed++;
      } catch (e) {
        res.tests.push({ name: t.name, status: 'fail', error: String(e && e.stack || e) });
        res.failed++;
      } finally {
        res.total++;
      }
      for (const hook of suite.hooks.afterEach) await hook();
    }
    for (const hook of suite.hooks.afterAll) await hook();
    return res;
  }
}


