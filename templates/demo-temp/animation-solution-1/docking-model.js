/* Pure geometric model. Scene unit = 100 mm. No dynamics or contact forces. */
(function (root) {
  'use strict';
  const C = Object.freeze({ mm: 100, topY: 3.75, topRadius: 2.9, radius: 2.45,
    hole: 0.95, thickness: 0.14, baseRadius: 1.95, baseAngle: Math.PI / 12,
    shoulderY: 0.55, l1: 1.6, l2: 2.15, toolDrop: 0.75,
    socketY: -1.31, pinDepth: 0.05, homeY: 1.25,
    length0: Math.hypot(3.3, 0.45) - 1,
    radialTolerance: 0.015, angleTolerance: 1, seatTolerance: 0.005 });
  const rad = Math.PI / 180, clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const add = (a, b) => a.map((v, i) => v + b[i]);
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const norm = a => Math.hypot(...a);
  const anchors = [0, 2 * Math.PI / 3, 4 * Math.PI / 3].map(a =>
    ({ top: [C.topRadius * Math.cos(a), C.topY, -C.topRadius * Math.sin(a)],
      bottom: [C.radius * Math.cos(a), 0, -C.radius * Math.sin(a)] }));
  function rotate(v, p) {
    const [x, y, z] = v, cx = Math.cos(p.pitch), sx = Math.sin(p.pitch);
    const cz = Math.cos(p.roll), sz = Math.sin(p.roll), yy = sz * x + cz * y;
    return [cz * x - sz * y, cx * yy - sx * z, sx * yy + cx * z];
  }
  function unrotate(v, p) {
    const [x, y, z] = v, cx = Math.cos(p.pitch), sx = Math.sin(p.pitch);
    const cz = Math.cos(p.roll), sz = Math.sin(p.roll), yy = cx * y + sx * z;
    return [cz * x + sz * yy, -sz * x + cz * yy, -sx * y + cx * z];
  }
  const toWorld = (v, p) => add(rotate(v, p), [0, p.h, 0]);
  const toLocal = (v, p) => unrotate(sub(v, [0, p.h, 0]), p);
  const lengths = p => anchors.map(a => norm(sub(toWorld(a.bottom, p), a.top)));
  function linearSolve(matrix, rhs) {
    const a = matrix.map((row, i) => [...row, rhs[i]]);
    for (let k = 0; k < 3; k++) {
      let pivot = k;
      for (let i = k + 1; i < 3; i++) if (Math.abs(a[i][k]) > Math.abs(a[pivot][k])) pivot = i;
      [a[k], a[pivot]] = [a[pivot], a[k]];
      if (Math.abs(a[k][k]) < 1e-10) return null;
      const d = a[k][k];
      for (let j = k; j < 4; j++) a[k][j] /= d;
      for (let i = 0; i < 3; i++) if (i !== k) {
        const factor = a[i][k];
        for (let j = k; j < 4; j++) a[i][j] -= factor * a[k][j];
      }
    }
    return a.map(row => row[3]);
  }
  function solvePlatform(strokes, seed = { h: 0.45, pitch: 0, roll: 0 }) {
    if (strokes.some(s => !Number.isFinite(s) || s < 0 || s > 200)) return { ok: false, reason: 'Course de vérin hors limites' };
    const target = strokes.map(s => C.length0 + s / C.mm), p = { ...seed };
    const keys = ['h', 'pitch', 'roll'];
    for (let n = 0; n < 30; n++) {
      const current = lengths(p), error = current.map((l, i) => l - target[i]);
      const residual = Math.max(...error.map(Math.abs));
      if (residual < 1e-8) return { ...p, ok: true, residual, lengths: current };
      const columns = keys.map(k => lengths({ ...p, [k]: p[k] + 1e-5 }).map((l, i) => (l - current[i]) / 1e-5));
      const delta = linearSolve(keys.map((_, i) => columns.map(c => c[i])), error);
      if (!delta) break;
      const damping = Math.min(1, 0.35 / Math.max(...delta.map(Math.abs)));
      keys.forEach((k, i) => p[k] -= damping * delta[i]);
    }
    return { ok: false, reason: 'La suspension ne converge pas sur cette configuration' };
  }
  const base = [C.baseRadius * Math.cos(C.baseAngle), C.shoulderY, C.baseRadius * Math.sin(C.baseAngle)];
  function yaw(v, angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]];
  }
  function forward(joints, pose, compensated = true) {
    const [a, b, c] = joints.map(j => j * rad);
    const first = [-C.l1 * Math.sin(b), C.l1 * Math.cos(b), 0];
    const second = [-C.l2 * Math.sin(b + c), C.l2 * Math.cos(b + c), 0];
    const elbow = add(base, yaw(first, a));
    const wrist = toWorld(add(elbow, yaw(second, a)), pose);
    const axis = compensated ? [0, 1, 0] : rotate(yaw([-Math.sin(b + c), Math.cos(b + c), 0], a), pose);
    const xAxis = compensated ? [1, 0, 0] : rotate(yaw([Math.cos(b + c), Math.sin(b + c), 0], a), pose);
    const zAxis = compensated ? [0, 0, 1] : rotate(yaw([0, 0, 1], a), pose);
    return { shoulder: toWorld(base, pose), elbow: toWorld(elbow, pose), wrist,
      tcp: sub(wrist, axis.map(v => v * C.toolDrop)), axis, xAxis, zAxis };
  }
  function inverse(tcp, pose) {
    const target = toLocal(add(tcp, [0, C.toolDrop, 0]), pose), d = sub(target, base);
    const r = Math.hypot(d[0], d[2]), cosElbow = (r * r + d[1] * d[1] - C.l1 ** 2 - C.l2 ** 2) / (2 * C.l1 * C.l2);
    if (cosElbow < -1 || cosElbow > 1) return { ok: false, reason: 'Cible hors de portée du bras' };
    const j3 = Math.acos(cosElbow);
    const j2 = Math.atan2(r, d[1]) - Math.atan2(C.l2 * Math.sin(j3), C.l1 + C.l2 * Math.cos(j3));
    const joints = [Math.atan2(d[2], -d[0]) / rad, j2 / rad, j3 / rad];
    if (joints[1] < -90 || joints[1] > 160 || joints[2] > 150) return { ok: false, reason: 'Butée articulaire atteinte' };
    return { ok: true, joints };
  }
  function segmentHitsRing(a, b, pose, radius) {
    a = toLocal(a, pose); b = toLocal(b, pose);
    const dy = b[1] - a[1], h = C.thickness / 2 + radius;
    let lo = 0, hi = 1;
    if (Math.abs(dy) < 1e-10) { if (Math.abs(a[1]) > h) return false; }
    else {
      const t1 = (-h - a[1]) / dy, t2 = (h - a[1]) / dy;
      lo = Math.max(0, Math.min(t1, t2)); hi = Math.min(1, Math.max(t1, t2));
      if (lo > hi) return false;
    }
    const dx = b[0] - a[0], dz = b[2] - a[2];
    const rr = t => Math.hypot(a[0] + dx * t, a[2] + dz * t);
    const nearest = clamp(-(a[0] * dx + a[2] * dz) / (dx * dx + dz * dz || 1), lo, hi);
    return Math.max(rr(lo), rr(hi)) >= C.hole - radius && rr(nearest) <= C.radius + radius;
  }
  function inspect(joints, pose, compensated = true) {
    const f = forward(joints, pose, compensated), gap = f.tcp[1] - C.socketY;
    const radial = Math.hypot(f.tcp[0], f.tcp[2]);
    const angle = Math.acos(clamp(f.axis[1], -1, 1)) / rad;
    const keyAngle = Math.acos(clamp(f.xAxis[0], -1, 1)) / rad;
    // Conservative spherical envelope for the connector swept along its height.
    const boxTop = add(f.tcp, f.axis.map(v => v * 0.55));
    let collision = segmentHitsRing(f.tcp, boxTop, pose, Math.hypot(0.45, 0.4)) ? 'Boîtier / anneau' : '';
    if (segmentHitsRing(f.shoulder, f.elbow, pose, 0.15) || segmentHitsRing(f.elbow, f.wrist, pose, 0.13)) collision = 'Bras / anneau';
    const aligned = radial <= C.radialTolerance && angle <= C.angleTolerance && keyAngle <= C.angleTolerance;
    // Check lowest tool corner, including pins, against the receiver plane.
    const lowest = Math.min(f.tcp[1], boxTop[1]) - 0.45 * Math.abs(f.xAxis[1]) - 0.4 * Math.abs(f.zAxis[1]) - C.pinDepth;
    const overlapsReceiver = Math.abs(f.tcp[0]) < 0.95 && Math.abs(f.tcp[2]) < 0.85;
    if (overlapsReceiver && lowest < C.socketY && !aligned) collision = 'Connecteur désaligné au contact';
    if (overlapsReceiver && gap < -C.seatTolerance) collision = 'Dépassement de la butée axiale';
    const connected = !collision && aligned && Math.abs(gap) <= C.seatTolerance;
    return { ...f, gap, radial, angle, keyAngle, aligned, collision, connected, insertion: clamp((C.pinDepth - gap) / C.pinDepth, 0, 1) };
  }
  const phases = [
    { name: 'Centrage', duration: 3, from: [0.38, C.homeY, 0.10], to: [0, C.homeY, 0] },
    { name: 'Approche', duration: 5, from: [0, C.homeY, 0], to: [0, C.socketY + 0.12, 0] },
    { name: 'Insertion', duration: 3, from: [0, C.socketY + 0.12, 0], to: [0, C.socketY, 0] },
    { name: 'Connecté', duration: 2, from: [0, C.socketY, 0], to: [0, C.socketY, 0] },
    { name: 'Retrait', duration: 5, from: [0, C.socketY, 0], to: [0, C.homeY, 0] }
  ];
  const duration = phases.reduce((sum, p) => sum + p.duration, 0);
  function trajectory(time) {
    let t = clamp(time, 0, duration), index = 0;
    while (index < phases.length - 1 && t > phases[index].duration) t -= phases[index++].duration;
    const p = phases[index], u = clamp(t / p.duration, 0, 1), s = u * u * u * (10 - 15 * u + 6 * u * u);
    return { index, name: p.name, tcp: p.from.map((x, i) => x + (p.to[i] - x) * s), fraction: u };
  }
  const api = { C, anchors, base, solvePlatform, lengths, rotate, toWorld, toLocal, forward, inverse, inspect, trajectory, phases, duration };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DockingModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
