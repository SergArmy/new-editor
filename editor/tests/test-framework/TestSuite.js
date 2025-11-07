export class TestSuite {
  constructor(name, description = '') {
    this.name = name;
    this.description = description;
    this.tests = [];
    this.hooks = { beforeAll: [], afterAll: [], beforeEach: [], afterEach: [] };
  }

  beforeAll(fn) { this.hooks.beforeAll.push(fn); }
  afterAll(fn) { this.hooks.afterAll.push(fn); }
  beforeEach(fn) { this.hooks.beforeEach.push(fn); }
  afterEach(fn) { this.hooks.afterEach.push(fn); }
  test(name, fn) { this.tests.push({ name, fn, skip: false, only: false }); }
  skip(name, fn) { this.tests.push({ name, fn, skip: true, only: false }); }
  only(name, fn) { this.tests.push({ name, fn, skip: false, only: true }); }
}


