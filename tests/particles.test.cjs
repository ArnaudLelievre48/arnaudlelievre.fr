const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../static/script-bg.js'), 'utf8');

function simulation(randomOverride) {
  let seed = 2718;
  const math = Object.create(Math);
  math.random = randomOverride ?? (() => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  });
  let active = true;
  let hidden = false;
  let mutation;
  let resize;
  let mediaChange;
  let nextId = 0;
  let time = 0;
  let drawn = [];
  const callbacks = new Map();
  const events = {};
  const media = { matches: false, addEventListener: (_, callback) => { mediaChange = callback; } };
  const canvas = {
    clientWidth: 334, clientHeight: 380, width: 300, height: 150,
    getBoundingClientRect: () => ({left: 0, top: 0}),
    getContext: () => ({
      clearRect() { drawn = []; },
      setTransform() {}, beginPath() {}, fill() {},
      arc(x, y, radius) {
        assert.ok([x, y, radius].every(Number.isFinite), 'a particle acquired invalid coordinates');
        assert.ok(radius >= 1.5, 'particles should remain visible on a small screen');
        drawn.push({x, y});
      }
    })
  };
  const home = { classList: { contains: () => active } };
  const document = {
    getElementById: id => id === 'fluidCanvas' ? canvas : home,
    get hidden() { return hidden; },
    addEventListener: (name, callback) => { events[name] = callback; }
  };
  const context = vm.createContext({
    document, Math: math,
    window: {
      devicePixelRatio: 3, matchMedia: () => media,
      addEventListener: (name, callback) => { events[name] = callback; }
    },
    ResizeObserver: class { constructor(callback) { resize = callback; } observe() {} },
    MutationObserver: class { constructor(callback) { mutation = callback; } observe() {} },
    requestAnimationFrame(callback) { callbacks.set(++nextId, callback); return nextId; },
    cancelAnimationFrame(id) { callbacks.delete(id); }
  });
  vm.runInContext(source, context);
  return {
    canvas,
    advance(count) {
      for (let index = 0; index < count; index++) {
        time += 1000 / 60;
        const scheduled = [...callbacks.values()];
        callbacks.clear();
        scheduled.forEach(callback => callback(time));
      }
    },
    pointer(x, y, pointerType = 'mouse') { events.pointermove({clientX: x, clientY: y, pointerType}); },
    resize(width, height) { canvas.clientWidth = width; canvas.clientHeight = height; resize(); },
    active(value) { active = value; mutation(); },
    hidden(value) { hidden = value; events.visibilitychange(); },
    reduced(value) { media.matches = value; mediaChange(); },
    get drawn() { return drawn; },
    get pending() { return callbacks.size; }
  };
}

test('all 50 particles remain finite, visible and spread out after a minute on mobile', () => {
  const sim = simulation();
  sim.advance(3600);
  assert.equal(sim.drawn.length, 50);
  assert.ok(sim.drawn.filter(p => p.x > 8 && p.x < 326 && p.y > 8 && p.y < 372).length > 30);
  assert.equal(sim.canvas.width, 668, 'Retina rendering must not change the physics dimensions');
});

test('coincident particles and a pointer exactly on a particle cannot poison the simulation', () => {
  const sim = simulation(() => 0);
  sim.advance(120);
  sim.pointer(50, 50);
  sim.advance(1);
  const point = sim.drawn[0];
  sim.pointer(point.x, point.y);
  sim.advance(600);
  sim.pointer(0, 0, 'touch');
  sim.advance(600);
  assert.equal(sim.drawn.length, 50);
});

test('resize, hidden tabs and reduced motion preserve the particles and a single animation loop', () => {
  const sim = simulation();
  sim.advance(60);
  sim.active(false);
  assert.equal(sim.pending, 0);
  sim.resize(0, 0);
  sim.resize(393, 280);
  sim.active(true);
  sim.advance(120);
  assert.equal(sim.drawn.length, 50);
  assert.ok(sim.drawn.every(p => p.x >= 0 && p.x <= 393 && p.y >= 0 && p.y <= 280));
  sim.hidden(true);
  assert.equal(sim.pending, 0);
  sim.hidden(false);
  assert.equal(sim.pending, 1);
  sim.reduced(true);
  assert.equal(sim.pending, 0);
  assert.equal(sim.drawn.length, 50);
  sim.reduced(false);
  assert.equal(sim.pending, 1);
});
