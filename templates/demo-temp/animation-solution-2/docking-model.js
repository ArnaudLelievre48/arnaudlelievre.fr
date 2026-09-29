/* Geometric demonstrator: specification_liaisons_docking_3D.md.
 * Mechanical coordinates X right, Y towards observer, Z up; arbitrary units.
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
    platformMinX: -3.8, platformMaxX: 1.8, platformZ: 3.15,
    platformThickness: 0.2, platformWidth: 2.7,
    base: Object.freeze([0.15, 0, 3.85]), lengths: Object.freeze([1.9, 3, 2, 0.45]),
    boxHeight: 0.34, boxWidth: 0.62, boxDepth: 0.5,
    captureX: 3.6, collarZ: 0.78, collarRadius: 1.02, collarThickness: 0.12,
    socketZ: 1.62, jawZ: 0.66, jawInner: 0.88, jawOuter: 1.16,
    jawThickness: 0.12, jawPivotRadius: 1.22, jawMaxAngle: 65,
    tripodCenter: Object.freeze([0.35, 0, 1.85]), upperRadius: 1.12, lowerRadius: 0.42,
    radialTolerance: 0.015, seatTolerance: 0.005, angleTolerance: 1,
    homeTCP: Object.freeze([4.65, 0, 3.6]),
    jointLimits: Object.freeze([[-20, 130], [-170, 80], [-155, 155], [-170, 170], [-180, 180]])
  });
  // T3-B: three rigid SS branches plus a DISTINCT structural central mast.
  const anchors = [30, 150, 270].map(deg => {
    const a = deg * rad;
    const top = [C.tripodCenter[0] + C.upperRadius * Math.cos(a), C.upperRadius * Math.sin(a), 3.05];
    const bottom = [C.tripodCenter[0] + C.lowerRadius * Math.cos(a), C.lowerRadius * Math.sin(a), C.tripodCenter[2]];
    return Object.freeze({ top: Object.freeze(top), bottom: Object.freeze(bottom), length: norm(sub(top, bottom)) });
  });
  const buoyProfile = Object.freeze([
    [-1.65, 0.18], [-1.15, 0.23], [-0.5, 0.53], [0.24, 0.86],
    [0.5, 0.86], [0.66, 0.8], [0.84, 0.27], [1.28, 0.27]
  ].map(p => Object.freeze(p)));
  function buoyRadius(z) {
    if (z < buoyProfile[0][0] || z > buoyProfile.at(-1)[0]) return 0;
    for (let i = 1; i < buoyProfile.length; i++) {
      const [z1, r1] = buoyProfile[i - 1], [z2, r2] = buoyProfile[i];
      if (z <= z2) return r1 + (r2 - r1) * (z - z1) / (z2 - z1);
    }
    return 0;
  }
  const neutralBuoy = () => ({ x: C.captureX, y: 0, lift: 0, heading: 18 });
  const receiver = b => [b.x, b.y, C.socketZ + b.lift];
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
  function captureCheck(buoy, opening) {
    const lateral = Math.hypot(buoy.x - C.captureX, buoy.y), height = Math.abs(buoy.lift);
    return { lateral, height, ready: lateral <= 0.025 && height <= 0.02 && opening <= 0.01 };
  }
  // Both half-jaws share a fixed vertical hinge behind the buoy (platform side).
  // The upper/lower halves in XY rotate by opposite angles, like embracing arms.
  function jawPose(jaw, opening) {
    return { pivot: [C.captureX - C.jawPivotRadius, 0, C.jawZ],
      angle: (jaw === 0 ? 1 : -1) * clamp(opening, 0, 1) * C.jawMaxAngle };
  }
  function jawPoint(jaw, arcAngle, radius, opening) {
    const pose = jawPose(jaw, opening), angle = pose.angle * rad;
    const x = C.jawPivotRadius + radius * Math.cos(arcAngle), y = radius * Math.sin(arcAngle);
    return [pose.pivot[0] + x * Math.cos(angle) - y * Math.sin(angle),
      pose.pivot[1] + x * Math.sin(angle) + y * Math.cos(angle), pose.pivot[2]];
  }
  function gripperHitsBuoy(buoy, opening) {
    const low = C.jawZ - C.jawThickness / 2 - buoy.lift;
    const high = C.jawZ + C.jawThickness / 2 - buoy.lift;
    let radius = Math.max(buoyRadius(low), buoyRadius(high));
    for (const [z, r] of buoyProfile) if (z >= low && z <= high) radius = Math.max(radius, r);
    // Exact contact with the collar underside is allowed; overlap is not.
    if (high > C.collarZ - C.collarThickness / 2 + 1e-8 && low < C.collarZ + C.collarThickness / 2 - 1e-8) radius = Math.max(radius, C.collarRadius);
    if (radius === 0) return false;
    for (let jaw = 0; jaw < 2; jaw++) {
      for (let tick = 0; tick <= 64; tick++) {
        const angle = jaw * Math.PI + tick / 64 * Math.PI;
        for (const r of [C.jawInner, (C.jawInner + C.jawOuter) / 2, C.jawOuter]) {
          const [x, y] = jawPoint(jaw, angle, r, opening);
          if (Math.hypot(x - buoy.x, y - buoy.y) < radius + 0.02) return true;
        }
      }
    }
    return false;
  }
  function inspect(joints, buoy, opening = 1, capture = 'OPEN', dock = 'OPEN') {
    const f = forward(joints), target = receiver(buoy);
    const gap = f.tcp[2] - target[2], radial = Math.hypot(f.tcp[0] - target[0], f.tcp[1] - target[1]);
    const angle = Math.acos(clamp(-f.axis[2], -1, 1)) / rad;
    const keyAngle = Math.acos(clamp(dot(f.xAxis, [Math.cos(buoy.heading * rad), Math.sin(buoy.heading * rad), 0]), -1, 1)) / rad;
    const aligned = radial <= C.radialTolerance && angle <= C.angleTolerance && keyAngle <= C.angleTolerance;
    let collision = '';
    const platformMin = [C.platformMinX, -C.platformWidth / 2, C.platformZ - C.platformThickness / 2];
    const platformMax = [C.platformMaxX, C.platformWidth / 2, C.platformZ + C.platformThickness / 2];
    for (let i = 0; i < 4; i++) {
      const a = f.points[i], b = f.points[i + 1], r = i === 3 ? 0.06 : 0.1;
      if (segmentHitsBox(a, b, platformMin, platformMax, r)) collision = 'Bras / plateforme';
      const count = Math.ceil(norm(sub(b, a)) / 0.025);
      for (let n = 0; n <= count; n++) {
        const p = mix(a, b, n / count), z = p[2] - buoy.lift;
        let bodyRadius = buoyRadius(z);
        if (Math.abs(z - C.collarZ) <= C.collarThickness / 2 + r) bodyRadius = C.collarRadius;
        if (bodyRadius > 0 && Math.hypot(p[0] - buoy.x, p[1] - buoy.y) < bodyRadius + r) collision = 'Bras / bouée';
      }
    }
    const back = sub(f.tcp, scale(f.axis, C.boxHeight));
    if (segmentHitsBox(f.tcp, back, platformMin, platformMax, Math.hypot(C.boxWidth, C.boxDepth) / 2)) collision = 'BOX_1 / plateforme';
    const lowest = Math.min(f.tcp[2], back[2]) - C.boxWidth / 2 * Math.abs(f.xAxis[2]) - C.boxDepth / 2 * Math.abs(f.depthAxis[2]);
    const overlaps = radial < Math.hypot(C.boxWidth, C.boxDepth);
    if (overlaps && lowest < target[2] - C.seatTolerance && !aligned) collision = 'Boîtes désalignées au contact';
    if (overlaps && gap < -C.seatTolerance) collision = 'Dépassement du plan de contact';
    if (lowest < buoy.lift + 1.28 && radial < 0.27 + Math.hypot(C.boxWidth, C.boxDepth) / 2) collision = 'BOX_1 / col de bouée';
    const cap = captureCheck(buoy, opening);
    if (gripperHitsBuoy(buoy, opening)) collision = 'Pince / corps de bouée';
    if (opening < 0.1 && (cap.lateral > 0.08 || cap.height > 0.05)) collision = 'Pince / collerette désalignée';
    const contact = !collision && aligned && Math.abs(gap) <= C.seatTolerance;
    const canCapture = !collision && cap.ready, canDock = contact && capture === 'ENGAGED';
    return { ...f, target, gap, radial, angle, keyAngle, aligned, collision, contact, canCapture, canDock,
      captureValid: capture !== 'ENGAGED' || canCapture, dockValid: dock !== 'LOCKED' || canDock,
      captureOffset: cap.lateral, approach: aligned && !collision ? clamp(1 - Math.max(0, gap) / 0.35, 0, 1) : 0 };
  }
  const phases = [
    { name: 'Bouée libre', duration: 2, note: 'La bouée flotte indépendamment. BOX_2 suit son corps rigide ; le bras reste dégagé.' },
    { name: 'Approche', duration: 4, note: 'La bouée entre entre les mors ouverts. Son déplacement est prescrit pour illustrer la capture.' },
    { name: 'Capture grossière', duration: 3, note: 'Les deux demi-pinces pivotent en sens opposés autour de leur axe Z commun pour envelopper la bouée sous sa collerette.' },
    { name: 'Verrouillage pince', duration: 1, note: 'La contrainte GRIPPER / BUOY_COLLAR est engagée. Les positions latérale et verticale sont retenues.' },
    { name: 'Stabilisation', duration: 2, note: 'La capture maintient la bouée. La rotation autour de Z reste permise jusqu’au verrouillage des boîtes.' },
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
    const wave = tt => ({ x: 5.05 + 0.055 * Math.sin(1.4 * tt), y: 0.08 * Math.sin(1.1 * tt), lift: 0.055 * Math.sin(1.7 * tt), heading: 18 + 4 * Math.sin(0.9 * tt) });
    let buoy = neutralBuoy(), opening = 1, capture = 'OPEN', dock = 'OPEN';
    if (index === 0) buoy = wave(t);
    if (index === 1) {
      const start = wave(2), end = neutralBuoy();
      buoy = Object.fromEntries(Object.keys(end).map(k => [k, start[k] + (end[k] - start[k]) * s]));
    }
    if (index === 2) opening = 1 - s;
    if (index >= 3) { opening = 0; capture = 'ENGAGED'; }
    let tcp = C.homeTCP.slice(), heading = -35, shoulder = 70;
    if (index === 5) { tcp = mix(C.homeTCP, [C.captureX, 0, C.socketZ + 0.35], s); shoulder = 70 - 8 * s; }
    if (index >= 6) { tcp = [C.captureX, 0, C.socketZ + 0.35]; shoulder = 62; }
    if (index === 6) heading = -35 + (buoy.heading + 35) * s;
    if (index >= 7) heading = buoy.heading;
    if (index === 7) tcp[2] = C.socketZ + 0.35 * (1 - s);
    if (index === 8) { tcp[2] = C.socketZ; dock = 'LOCKED'; }
    const ik = inverse(tcp, heading, shoulder);
    const metrics = ik.ok ? inspect(ik.joints, buoy, opening, capture, dock) : null;
    return { index, name: phases[index].name, fraction, time: t, buoy, opening, capture, dock, tcp, ...ik, metrics };
  }
  const api = { C, anchors, buoyProfile, buoyRadius, neutralBuoy, receiver, forward, inverse, inspect,
    captureCheck, jawPose, jawPoint, gripperHitsBuoy, trajectory, phases, duration, segmentHitsBox, smooth, toScene: p => [p[0], p[2], -p[1]] };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DockingModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
