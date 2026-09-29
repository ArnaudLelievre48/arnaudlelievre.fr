const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../docking-model.js');
const neutral = M.solvePlatform([100, 100, 100]);
const near = (actual, expected, tolerance = 1e-7) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test('la suspension ferme géométriquement ses trois branches, y compris aux courses extrêmes', () => {
  for (const s1 of [0, 50, 100, 150, 200]) for (const s2 of [0, 50, 100, 150, 200]) for (const s3 of [0, 50, 100, 150, 200]) {
    const strokes = [s1, s2, s3], p = M.solvePlatform(strokes);
    assert.ok(p.ok, JSON.stringify(strokes));
    M.lengths(p).forEach((l, i) => near(l, M.C.length0 + strokes[i] / M.C.mm));
  }
  near(neutral.h, 0.45);
  assert.equal(M.solvePlatform([-1, 100, 100]).ok, false);
  assert.equal(M.solvePlatform([100, 201, 100]).ok, false);
});

test('cinématiques directe et inverse concordent sur une plateforme inclinée', () => {
  for (const strokes of [[100,100,100], [85,115,100], [120,95,90]]) {
    const pose = M.solvePlatform(strokes);
    for (const target of [[0, 1.25, 0], [0.2, 0.6, -0.1], [0, M.C.socketY, 0]]) {
      const ik = M.inverse(target, pose);
      assert.ok(ik.ok);
      const actual = M.forward(ik.joints, pose);
      actual.tcp.forEach((x, i) => near(x, target[i]));
      near(actual.axis[1], 1);
    }
  }
  assert.equal(M.inverse([100,0,0], neutral).ok, false);
});

test('le cycle complet est continu, atteignable et sans interférence modélisée', () => {
  let previous, connected = false;
  for (let tick = 0; tick <= 3600; tick++) {
    const t = tick / 200, tr = M.trajectory(t), ik = M.inverse(tr.tcp, neutral);
    assert.ok(ik.ok, `t=${t}`);
    const m = M.inspect(ik.joints, neutral);
    assert.equal(m.collision, '', `t=${t}: ${m.collision}`);
    m.tcp.forEach((x,i) => near(x, tr.tcp[i]));
    if (previous) assert.ok(Math.hypot(...tr.tcp.map((v,i) => v - previous[i])) < 0.006);
    previous = tr.tcp;
    if (tr.name === 'Connecté') { assert.ok(m.connected); connected = true; }
  }
  assert.ok(connected);
  assert.equal(M.trajectory(M.duration).name, 'Retrait');
});

test('le contact exige centrage, orientation et écart axial signé corrects', () => {
  const at = target => M.inspect(M.inverse(target, neutral).joints, neutral);
  assert.ok(at([0,M.C.socketY,0]).connected);
  assert.equal(at([0,M.C.socketY + 0.01,0]).connected, false);
  const below = at([0,M.C.socketY - 0.1,0]);
  assert.ok(below.gap < 0);
  assert.equal(below.connected, false);
  assert.match(below.collision, /butée/);
  const offset = at([0.1,M.C.socketY,0]);
  assert.equal(offset.connected, false);
  assert.match(offset.collision, /désaligné/);
  const dock = M.inverse([0,M.C.socketY,0], neutral);
  const rigid = M.inspect(dock.joints, neutral, false);
  assert.ok(rigid.angle > 90);
  assert.equal(rigid.connected, false);
});

test('une fiche qui traverse la matière de l’anneau est détectée', () => {
  const ik = M.inverse([0.6, neutral.h, 0], neutral);
  assert.ok(ik.ok);
  assert.match(M.inspect(ik.joints, neutral).collision, /anneau/);
});

test('le taux d’insertion correspond aux 5 mm utiles des broches', () => {
  for (const [gap, expected] of [[0.12,0],[0.05,0],[0.025,0.5],[0,1]]) {
    const ik = M.inverse([0,M.C.socketY + gap,0], neutral);
    near(M.inspect(ik.joints, neutral).insertion, expected);
  }
});
