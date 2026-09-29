const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../docking-model.js');
const { C } = M;
const near = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const nearVector = (a, b) => a.forEach((v, i) => near(v, b[i]));
const buoy = M.neutralBuoy();
const pose = (target, heading = buoy.heading) => {
  const ik = M.inverse(target, heading);
  assert.ok(ik.ok, ik.reason);
  return ik.joints;
};

test('tripode spatial : trois bielles rigides, six points et une branche arrière distincte du mât', () => {
  assert.equal(M.anchors.length, 3);
  const a = M.anchors;
  for (const branch of a) {
    near(Math.hypot(...branch.top.map((v, i) => v - branch.bottom[i])), branch.length);
    near(branch.length, a[0].length);
    assert.ok(Math.hypot(branch.bottom[0] - C.tripodCenter[0], branch.bottom[1]) > 0.4);
  }
  const u = a[1].top.map((v, i) => v - a[0].top[i]), v = a[2].top.map((x, i) => x - a[0].top[i]);
  assert.ok(Math.abs(u[0] * v[1] - u[1] * v[0]) > 1, 'Les ancrages hauts ne sont pas colinéaires.');
  assert.ok(Math.abs(a[2].top[1]) > 1, 'La branche arrière ne disparaît pas dans le mât central.');
});

test('cinématique 4 pivots Y + A5 : position, longueurs et orientation cohérentes', () => {
  for (const target of [[C.captureX, 0, C.socketZ], [4.1, 0, 2.8], C.homeTCP]) {
    for (const heading of [-175, -35, 0, 18, 90, 179]) {
      const f = M.forward(pose(target, heading));
      nearVector(f.tcp, target);
      nearVector(f.axis, [0, 0, -1]);
      nearVector(f.xAxis, [Math.cos(heading * Math.PI / 180), Math.sin(heading * Math.PI / 180), 0]);
      f.points.slice(1).forEach((p, i) => near(Math.hypot(...p.map((v, j) => v - f.points[i][j])), C.lengths[i]));
      f.points.forEach(p => near(p[1], 0));
    }
  }
  assert.equal(M.inverse([C.captureX, 0.1, C.socketZ]).ok, false, 'Aucune tourelle pour atteindre Y ≠ 0.');
  assert.equal(M.inverse([100, 0, 0]).ok, false);
  const joints = pose([C.captureX, 0, C.socketZ + 0.35]);
  const tilted = joints.slice(); tilted[3] += 15;
  near(M.inspect(tilted, buoy).angle, 15);
  assert.ok(Math.hypot(...M.forward(tilted).tcp.map((v, i) => v - M.forward(joints).tcp[i])) > 0.1);
  const rotated = joints.slice(); rotated[4] += 45;
  nearVector(M.forward(rotated).tcp, M.forward(joints).tcp);
  near(M.inspect(rotated, buoy).keyAngle, 45);
});

test('5 201 poses : cycle continu, neuf étapes, capture avant docking, aucune interférence contrôlée', () => {
  let previous, seen = new Set();
  for (let tick = 0; tick <= 5200; tick++) {
    const p = M.trajectory(tick / 200);
    assert.ok(p.ok, `t=${p.time}: ${p.reason}`);
    assert.equal(p.metrics.collision, '', `t=${p.time}: ${p.metrics.collision}`);
    assert.ok(p.metrics.captureValid && p.metrics.dockValid, `t=${p.time}`);
    nearVector(p.metrics.tcp, p.tcp); seen.add(p.index);
    if (previous) {
      assert.ok(Math.hypot(...p.tcp.map((v, i) => v - previous.tcp[i])) < 0.008);
      assert.ok(Math.abs(p.buoy.x - previous.buoy.x) < 0.006);
      assert.ok(Math.max(...p.joints.map((v, i) => Math.abs(v - previous.joints[i]))) < 0.2);
    }
    if (p.dock === 'LOCKED') { assert.equal(p.capture, 'ENGAGED'); assert.ok(p.metrics.contact); }
    previous = p;
  }
  assert.equal(seen.size, 9);
  assert.equal(M.trajectory(0).capture, 'OPEN');
  assert.equal(M.trajectory(9).capture, 'ENGAGED');
  assert.equal(M.trajectory(22.99).dock, 'OPEN');
  assert.equal(M.trajectory(23).dock, 'LOCKED');
  assert.equal(M.trajectory(M.duration).name, 'Docking verrouillé');
});

test('contact géométrique, capture et verrouillage sont des états distincts', () => {
  const joints = pose([C.captureX, 0, C.socketZ]);
  const open = M.inspect(joints, buoy, 0, 'OPEN');
  assert.ok(open.contact && open.canCapture);
  assert.equal(open.canDock, false);
  assert.ok(M.inspect(joints, buoy, 0, 'ENGAGED').canDock);
  assert.equal(M.inspect(joints, buoy, 1, 'ENGAGED').captureValid, false);
  assert.equal(M.inspect(joints, buoy, 0, 'OPEN', 'LOCKED').dockValid, false);
  assert.equal(M.inspect(joints, { ...buoy, x: buoy.x + 0.05 }, 0, 'ENGAGED').captureValid, false);
  const yawed = { ...buoy, heading: buoy.heading + 20 };
  assert.ok(M.inspect(joints, yawed, 0, 'ENGAGED').captureValid, 'La capture permet encore la rotation Z.');
  assert.equal(M.inspect(joints, yawed, 0, 'ENGAGED', 'LOCKED').dockValid, false);
});

test('l’accostage refuse erreurs axiales, radiales, d’inclinaison et d’azimut', () => {
  const contact = [C.captureX, 0, C.socketZ], joints = pose(contact);
  assert.ok(M.inspect(joints, buoy, 0, 'ENGAGED').contact);
  assert.equal(M.inspect(pose([C.captureX, 0, C.socketZ + 0.02]), buoy).contact, false);
  const below = M.inspect(pose([C.captureX, 0, C.socketZ - 0.08]), buoy);
  assert.ok(below.gap < 0); assert.match(below.collision, /contact/);
  assert.equal(M.inspect(pose([C.captureX + 0.03, 0, C.socketZ]), buoy).contact, false);
  const wrongKey = M.inspect(pose(contact, 35), buoy);
  assert.equal(wrongKey.contact, false); near(wrongKey.keyAngle, 17);
  const tilt = joints.slice(); tilt[3] += 8;
  assert.equal(M.inspect(tilt, buoy).contact, false);
  assert.ok(M.inspect(tilt, buoy).angle > 7);
  assert.equal(M.inspect(joints, { ...buoy, y: 0.1 }).contact, false);
});

test('les demi-pinces se referment par rotations opposées autour d’un pivot fixe', () => {
  const radius = (C.jawInner + C.jawOuter) / 2;
  const pivot = [C.captureX - C.jawPivotRadius, 0, C.jawZ];
  let previousGap = -1;
  for (let tick = 0; tick <= 100; tick++) {
    const opening = tick / 100, poses = [M.jawPose(0, opening), M.jawPose(1, opening)];
    nearVector(poses[0].pivot, pivot); nearVector(poses[1].pivot, pivot);
    near(poses[0].angle, -poses[1].angle);
    const front = M.jawPoint(0, 0, radius, opening), back = M.jawPoint(1, 2 * Math.PI, radius, opening);
    near(front[0], back[0]); near(front[1], -back[1]);
    near(Math.hypot(...front.map((v, i) => v - pivot[i])), C.jawPivotRadius + radius);
    const gap = front[1] - back[1];
    assert.ok(gap > previousGap, 'Les pointes s’écartent progressivement en ouvrant.');
    previousGap = gap;
    assert.equal(M.gripperHitsBuoy(buoy, opening), false, `Ouverture=${opening}`);
    // Distances between material points stay constant throughout the rotation.
    const p = M.jawPoint(0, Math.PI / 2, radius, opening);
    near(Math.hypot(...front.map((v, i) => v - p[i])), Math.SQRT2 * radius);
  }
  nearVector(M.jawPoint(0, 0, radius, 0), [C.captureX + radius, 0, C.jawZ]);
  assert.ok(M.jawPoint(0, 0, radius, 1)[0] < C.captureX, 'Les bras ouverts dégagent l’entrée côté bouée.');
});

test('les demi-pinces fermées restent à l’extérieur du corps et sous la collerette', () => {
  assert.ok(C.jawInner > M.buoyRadius(C.jawZ - C.jawThickness / 2));
  assert.ok(C.jawInner > M.buoyRadius(C.jawZ + C.jawThickness / 2));
  assert.ok(C.jawInner < C.collarRadius, 'Le bord inférieur retient la collerette.');
  near(C.jawZ + C.jawThickness / 2, C.collarZ - C.collarThickness / 2);
  assert.equal(M.gripperHitsBuoy(buoy, 0), false);
  assert.equal(M.gripperHitsBuoy({ ...buoy, y: 0.25 }, 0.1), true);
  const joints = M.trajectory(0).joints;
  assert.match(M.inspect(joints, { ...buoy, x: buoy.x + 0.25 }, 0).collision, /Pince/);
});

test('les collisions avec la plateforme arrêtent les poses traversant le bâti', () => {
  assert.match(M.inspect([-90, 0, 0, 0, 0], buoy).collision, /plateforme/);
  assert.equal(M.segmentHitsBox([0, 0, 5], [0, 0, 0], [-1, -1, 3], [1, 1, 4]), true);
  assert.equal(M.segmentHitsBox([2, 0, 5], [2, 0, 0], [-1, -1, 3], [1, 1, 4]), false);
});
