/* Geometric demonstrator: specification_liaisons_docking_solution_2.md.
 * Mechanical coordinates X right, Y towards observer, Z up; metres (illustrative dimensions).
 * No inferred actuators, base turret, vertical slide, dynamics or electrical model.
 */
(function (root) {
  'use strict';
  const rad = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const add = (a, b) => a.map((v, i) => v + b[i]);
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const scale = (a, s) => a.map(v => v * s);
  const norm = v => Math.hypot(...v);
  const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
  const smooth = u => { u = clamp(u, 0, 1); return u ** 3 * (10 - 15 * u + 6 * u * u); };
  const mix = (a, b, s) => a.map((v, i) => v + (b[i] - v) * s);
  const C = Object.freeze({
    platformMinX: -4, platformMaxX: 1, platformZ: 6,
    platformThickness: 0.2, platformWidth: 2.7,
    longeronCenter: Object.freeze([-1.75, 0, 3.55]), longeronRadius: 2.2, longeronLength: 3.25,
    base: Object.freeze([0, 0, 6.75]), lengths: Object.freeze([1.9, 3.4, 3.6, 0.45]),
    boxHeight: 0.34, boxWidth: 0.62, boxDepth: 0.5,
    captureX: 3.43, collarZ: 0.7, collarRadius: 1.86,
    socketZ: 2.5, neckTop: 2.16, jawZ: 0.7, jawInner: 2, jawOuter: 2.2,
    jawThickness: 0.12, jawPivotRadius: 2.38, jawMaxAngle: 65,
    carrierMount: Object.freeze([0.85, 0, 1.85]), carrierLength: 1.15,
    longeronMount: Object.freeze([-0.2, 0, 3.55 - Math.sqrt(2.2 ** 2 - 1.55 ** 2)]),
    damperD1: Object.freeze([-1.75 + Math.sqrt(2.2 ** 2 - 0.65 ** 2), 0, 2.9]),
    damperLever: Object.freeze([0.65, 0, 0.65]),
    gripperOffset: 2.58, hingeOffset: 0.2, supportLimits: Object.freeze([[-18, 18]]),
    damperMin: 1.6, damperMax: 2.3, damperBodyLength: 1.3,
    radialTolerance: 0.015, seatTolerance: 0.005, angleTolerance: 1,
    homeTCP: Object.freeze([4.45, 0, 4.53]),
    jointLimits: Object.freeze([[-20, 130], [-170, 80], [-155, 155], [-170, 170], [-180, 180]])
  });
  const buoyProfile = Object.freeze([
    [-1.65, 0.42], [-0.85, 0.42], [0.25, 1.65], [0.52, 1.86],
    [0.78, 1.86], [1.16, 0.48], [C.neckTop, 0.48]
  ].map(p => Object.freeze(p)));
  // The carrier is fixed to LONGERON. Only G4 rotates about Y; positive angles raise X.
  function rotateXZ(p, degrees) {
    const a = degrees * rad, c = Math.cos(a), s = Math.sin(a);
    return [c * p[0] - s * p[2], p[1], s * p[0] + c * p[2]];
  }
  function supportForward(angles = [0]) {
    const [g4] = angles, tilt = g4;
    const root = add(C.carrierMount, [0, 0, -C.carrierLength]);
    const d2 = add(root, rotateXZ(C.damperLever, g4));
    const center = add(root, rotateXZ([C.gripperOffset, 0, 0], tilt));
    const hinge = add(root, rotateXZ([C.hingeOffset, 0, 0], tilt));
    const length = norm(sub(d2, C.damperD1));
    const neutralLength = norm(sub(add(root, C.damperLever), C.damperD1));
    const ok = angles.length === 1 && Number.isFinite(g4) && g4 >= C.supportLimits[0][0] && g4 <= C.supportLimits[0][1] && length >= C.damperMin && length <= C.damperMax;
    return { mount: C.carrierMount.slice(), g4: root, d1: C.damperD1.slice(), d2, center, hinge, tilt, length,
      extension: length - neutralLength, neutralLength, ok };
  }
  const gripperToWorld = (point, angles = [0]) => {
    const p = supportForward(angles); return add(p.g4, rotateXZ(point, p.tilt));
  };
  function buoyRotate(p, b) {
    const a = b.heading * rad, c = Math.cos(a), s = Math.sin(a);
    return rotateXZ([c * p[0] - s * p[1], s * p[0] + c * p[1], p[2]], b.tilt || 0);
  }
  const buoyToWorld = (p, b) => add(buoyRotate(p, b), [b.x, b.y, b.lift]);
  function buoyToLocal(p, b) {
    const v = rotateXZ(sub(p, [b.x, b.y, b.lift]), -(b.tilt || 0)), a = b.heading * rad;
    return [Math.cos(a) * v[0] + Math.sin(a) * v[1], -Math.sin(a) * v[0] + Math.cos(a) * v[1], v[2]];
  }
  function capturedBuoy(angles = [0], heading = 18) {
    const p = supportForward(angles), offset = rotateXZ([0, 0, C.collarZ], p.tilt);
    return { x: p.center[0] - offset[0], y: p.center[1], lift: p.center[2] - offset[2], heading, tilt: p.tilt };
  }
  function buoyRadius(z) {
    if (z < buoyProfile[0][0] || z > buoyProfile.at(-1)[0]) return 0;
    for (let i = 1; i < buoyProfile.length; i++) {
      const [z1, r1] = buoyProfile[i - 1], [z2, r2] = buoyProfile[i];
      if (z <= z2) return r1 + (r2 - r1) * (z - z1) / (z2 - z1);
    }
    return 0;
  }
  const neutralBuoy = () => capturedBuoy();
  const receiver = b => buoyToWorld([0, 0, C.socketZ], b);
  function forward(joints) {
    let angle = 0, p = C.base.slice();
    const points = [p];
    for (let i = 0; i < 4; i++) {
      angle += joints[i] * rad;
      p = add(p, [C.lengths[i] * Math.cos(angle), 0, C.lengths[i] * Math.sin(angle)]);
      points.push(p);
    }
    const h = joints[4] * rad, c = Math.cos(angle), s = Math.sin(angle);
    const axis = [c, 0, s]; // Outward normal of BOX_1 mating face.
    const xAxis = [-s * Math.cos(h), Math.sin(h), c * Math.cos(h)];
    const depthAxis = [-s * Math.sin(h), -Math.cos(h), c * Math.sin(h)];
    return { points, tcp: add(p, scale(axis, C.boxHeight)), axis, xAxis, depthAxis, terminalAngle: angle / rad };
  }
  // A1 selects posture; A2/A3 solve a planar 2R; A4 sets the terminal axis;
  // A5 sets heading. The tool orientation comes entirely from these real joints.
  function inverse(tcp, heading = 18, shoulder = 62, terminalAngle = -90, elbowBranch = -1) {
    if (Math.abs(tcp[1]) > 1e-8) return { ok: false, reason: 'Cible hors du plan XZ : le bras ne possède pas de tourelle.' };
    const beta = terminalAngle * rad;
    const wrist = sub(tcp, scale([Math.cos(beta), 0, Math.sin(beta)], C.lengths[3] + C.boxHeight));
    const elbow = add(C.base, [C.lengths[0] * Math.cos(shoulder * rad), 0, C.lengths[0] * Math.sin(shoulder * rad)]);
    const d = sub(wrist, elbow), l2 = C.lengths[1], l3 = C.lengths[2];
    const cos = (d[0] ** 2 + d[2] ** 2 - l2 ** 2 - l3 ** 2) / (2 * l2 * l3);
    if (cos < -1 - 1e-10 || cos > 1 + 1e-10) return { ok: false, reason: 'Cible hors de portée du bras.' };
    const a3 = (elbowBranch > 0 ? 1 : -1) * Math.acos(clamp(cos, -1, 1));
    const a2Absolute = Math.atan2(d[2], d[0]) - Math.atan2(l3 * Math.sin(a3), l2 + l3 * Math.cos(a3));
    const joints = [shoulder, a2Absolute / rad - shoulder, a3 / rad, terminalAngle - a2Absolute / rad - a3 / rad, heading];
    if (joints.some((v, i) => v < C.jointLimits[i][0] || v > C.jointLimits[i][1]))
      return { ok: false, reason: 'Limite articulaire de démonstration atteinte.' };
    return { ok: true, joints };
  }
  function segmentHitsBox(a, b, min, max, radius = 0) {
    let lo = 0, hi = 1;
    for (let i = 0; i < 3; i++) {
      const d = b[i] - a[i], low = min[i] - radius, high = max[i] + radius;
      if (Math.abs(d) < 1e-12) { if (a[i] < low || a[i] > high) return false; }
      else {
        const t1 = (low - a[i]) / d, t2 = (high - a[i]) / d;
        lo = Math.max(lo, Math.min(t1, t2)); hi = Math.min(hi, Math.max(t1, t2));
        if (lo > hi) return false;
      }
    }
    return true;
  }
  function captureCheck(buoy, opening, angles = [0]) {
    const p = supportForward(angles), delta = sub(buoyToWorld([0, 0, C.collarZ], buoy), p.center);
    const local = rotateXZ(delta, -p.tilt), lateral = Math.hypot(local[0], local[1]), height = Math.abs(local[2]);
    const tiltError = Math.abs((buoy.tilt || 0) - p.tilt);
    return { lateral, height, tiltError, ready: lateral <= 0.025 && height <= 0.02 && tiltError <= 1 && opening <= 0.01 };
  }
  // The earlier two-half-jaw design is retained as an explicit opening hypothesis.
  // Its hinge belongs to the G4 gripper; the local vertical component is separate.
  function jawPose(jaw, opening, angles = [0]) {
    const p = supportForward(angles);
    return { pivot: p.hinge, tilt: p.tilt, angle: (jaw === 0 ? 1 : -1) * clamp(opening, 0, 1) * C.jawMaxAngle };
  }
  function jawPoint(jaw, arcAngle, radius, opening, angles = [0], height = 0) {
    const pose = jawPose(jaw, opening, angles), angle = pose.angle * rad;
    const x = C.jawPivotRadius + radius * Math.cos(arcAngle), y = radius * Math.sin(arcAngle);
    return add(pose.pivot, rotateXZ([x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle), height], pose.tilt));
  }
  function gripperHitsBuoy(buoy, opening, angles = [0]) {
    for (let jaw = 0; jaw < 2; jaw++) {
      for (let tick = 0; tick <= 48; tick++) {
        const angle = jaw * Math.PI + tick / 48 * Math.PI;
        for (const r of [C.jawInner, (C.jawInner + C.jawOuter) / 2, C.jawOuter]) {
          for (const height of [-C.jawThickness / 2, C.jawThickness / 2]) {
            const p = buoyToLocal(jawPoint(jaw, angle, r, opening, angles, height), buoy);
            const radius = buoyRadius(p[2]);
            if (radius > 0 && Math.hypot(p[0], p[1]) < radius + 0.02) return true;
          }
        }
      }
    }
    return false;
  }
  function inspect(joints, buoy, opening = 1, capture = 'OPEN', dock = 'OPEN', angles = [0]) {
    const f = forward(joints), target = receiver(buoy), normal = buoyRotate([0, 0, 1], buoy);
    const delta = sub(f.tcp, target), gap = dot(delta, normal), radial = norm(sub(delta, scale(normal, gap)));
    const angle = Math.acos(clamp(dot(scale(f.axis, -1), normal), -1, 1)) / rad;
    const keyAngle = Math.acos(clamp(dot(f.xAxis, buoyRotate([1, 0, 0], buoy)), -1, 1)) / rad;
    const aligned = radial <= C.radialTolerance && angle <= C.angleTolerance && keyAngle <= C.angleTolerance;
    let collision = '';
    const platformMin = [C.platformMinX, -C.platformWidth / 2, C.platformZ - C.platformThickness / 2];
    const platformMax = [C.platformMaxX, C.platformWidth / 2, C.platformZ + C.platformThickness / 2];
    const support = supportForward(angles);
    if (!support.ok) collision = 'Butée du support ou course de l’amortisseur';
    for (let i = 0; i < 4; i++) {
      const a = f.points[i], b = f.points[i + 1], r = i === 3 ? 0.06 : 0.1;
      if (segmentHitsBox(a, b, platformMin, platformMax, r)) collision = 'Bras / plateforme';
      const count = Math.max(1, Math.ceil(norm(sub(b, a)) / 0.04));
      for (let n = 0; n <= count; n++) {
        const p = buoyToLocal(mix(a, b, n / count), buoy), bodyRadius = buoyRadius(p[2]);
        if (bodyRadius > 0 && Math.hypot(p[0], p[1]) < bodyRadius + r) collision = 'Bras / bouée';
      }
    }
    const back = sub(f.tcp, scale(f.axis, C.boxHeight));
    if (segmentHitsBox(f.tcp, back, platformMin, platformMax, Math.hypot(C.boxWidth, C.boxDepth) / 2)) collision = 'BOX_1 / plateforme';
    const lowest = Math.min(gap, dot(sub(back, target), normal)) - C.boxWidth / 2 * Math.abs(dot(f.xAxis, normal)) - C.boxDepth / 2 * Math.abs(dot(f.depthAxis, normal));
    const overlaps = radial < Math.hypot(C.boxWidth, C.boxDepth);
    if (overlaps && lowest < -C.seatTolerance && !aligned) collision = 'Boîtes désalignées au contact';
    if (overlaps && gap < -C.seatTolerance) collision = 'Dépassement du plan de contact';
    if (overlaps && lowest < C.neckTop - C.socketZ) collision = 'BOX_1 / col de bouée';
    const cap = captureCheck(buoy, opening, angles);
    if (gripperHitsBuoy(buoy, opening, angles)) collision = 'Pince / corps de bouée';
    if (opening < 0.1 && (cap.lateral > 0.08 || cap.height > 0.05 || cap.tiltError > 3)) collision = 'Pince / zone de capture désalignée';
    const contact = !collision && aligned && Math.abs(gap) <= C.seatTolerance;
    const canCapture = !collision && cap.ready, canDock = contact && capture === 'ENGAGED';
    return { ...f, target, normal, gap, radial, angle, keyAngle, aligned, collision, contact, canCapture, canDock, support,
      captureValid: capture !== 'ENGAGED' || canCapture, dockValid: dock !== 'LOCKED' || canDock,
      captureOffset: cap.lateral, approach: aligned && !collision ? clamp(1 - Math.max(0, gap) / 0.35, 0, 1) : 0 };
  }
  const phases = [
    { name: 'Bouée libre', duration: 2, note: 'La bouée flotte indépendamment. BOX_2 suit son corps rigide ; le bras reste dégagé.' },
    { name: 'Approche', duration: 4, note: 'La bouée entre entre les mors ouverts. Son déplacement est prescrit pour illustrer la capture.' },
    { name: 'Capture grossière', duration: 3, note: 'Les deux demi-pinces pivotent en sens opposés autour de leur axe Z commun pour envelopper la bouée sous sa collerette.' },
    { name: 'Verrouillage pince', duration: 1, note: 'La capture retient la bouée dans la pince. Le porte-pince est encastré dans le longeron ; G4 conserve l’inclinaison de la pince.' },
    { name: 'Stabilisation amortie', duration: 6, note: 'La pince oscille autour de G4. D1 reste sur le longeron, D2 suit le levier de la pince et l’amortisseur change de longueur. Mouvement décroissant prescrit, sans calcul des efforts.' },
    { name: 'Approche du bras', duration: 5, note: 'A1–A4 amènent BOX_1 au-dessus de BOX_2. A4 garde l’axe terminal vertical.' },
    { name: 'Alignement fin', duration: 3, note: 'A5 ajuste l’azimut local du connecteur. Aucun pivot de tourelle n’est ajouté à l’embase.' },
    { name: 'Contact des interfaces', duration: 3, note: 'Descente axiale jusqu’à l’opposition des faces. Le contact et le verrouillage sont deux états distincts.' },
    { name: 'Docking verrouillé', duration: 3, note: 'BOX_1 / BOX_2 est verrouillée par une liaison démontable supposée rigide ; la pince reste engagée.' }
  ];
  const duration = phases.reduce((sum, p) => sum + p.duration, 0);
  function trajectory(time) {
    const t = clamp(time, 0, duration);
    let elapsed = t, index = 0;
    while (index < phases.length - 1 && elapsed >= phases[index].duration) elapsed -= phases[index++].duration;
    const fraction = clamp(elapsed / phases[index].duration, 0, 1), s = smooth(fraction);
    const wave = tt => ({ tilt: 0, x: 5.75 + 0.055 * Math.sin(1.4 * tt), y: 0.08 * Math.sin(1.1 * tt), lift: 0.055 * Math.sin(1.7 * tt), heading: 18 + 4 * Math.sin(0.9 * tt) });
    let buoy = neutralBuoy(), opening = 1, capture = 'OPEN', dock = 'OPEN', supportAngles = [0];
    if (index === 0) buoy = wave(t);
    if (index === 1) {
      const start = wave(2), end = neutralBuoy();
      buoy = Object.fromEntries(Object.keys(end).map(k => [k, start[k] + (end[k] - start[k]) * s]));
    }
    if (index === 2) opening = 1 - s;
    if (index >= 3) { opening = 0; capture = 'ENGAGED'; }
    if (index === 4) {
      const oscillation = 10 * Math.exp(-0.5 * elapsed) * Math.sin(2.8 * elapsed) * smooth(elapsed / 0.6) * smooth((6 - elapsed) / 0.6);
      supportAngles = [oscillation];
      buoy = capturedBuoy(supportAngles);
    }
    let tcp = C.homeTCP.slice(), heading = -35, shoulder = 70;
    if (index === 5) { tcp = mix(C.homeTCP, [C.captureX, 0, C.socketZ + 0.35], s); shoulder = 70 - 8 * s; }
    if (index >= 6) { tcp = [C.captureX, 0, C.socketZ + 0.35]; shoulder = 62; }
    if (index === 6) heading = -35 + (buoy.heading + 35) * s;
    if (index >= 7) heading = buoy.heading;
    if (index === 7) tcp[2] = C.socketZ + 0.35 * (1 - s);
    if (index === 8) { tcp[2] = C.socketZ; dock = 'LOCKED'; }
    const ik = inverse(tcp, heading, shoulder);
    const metrics = ik.ok ? inspect(ik.joints, buoy, opening, capture, dock, supportAngles) : null;
    return { index, name: phases[index].name, fraction, time: t, buoy, opening, capture, dock, supportAngles, tcp, ...ik, metrics };
  }
  const api = { C, supportForward, rotateXZ, gripperToWorld, capturedBuoy, buoyRotate, buoyToWorld, buoyToLocal, buoyProfile, buoyRadius, neutralBuoy, receiver, forward, inverse, inspect,
    captureCheck, jawPose, jawPoint, gripperHitsBuoy, trajectory, phases, duration, segmentHitsBox, smooth, toScene: p => [p[0], p[2], -p[1]] };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DockingModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
