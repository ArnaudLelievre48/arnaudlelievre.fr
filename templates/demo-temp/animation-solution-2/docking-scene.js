/* Local Three.js scene and controls. All mechanical computations live in docking-model.js. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const container = $('canvas-container');
  if (!window.THREE || !window.DockingModel) {
    container.insertAdjacentHTML('beforeend', '<div class="error-screen">Dépendances manquantes. Conserver vendor/, docking-model.js, docking-scene.js et docking.css à côté du HTML.</div>');
    return;
  }
  const M = window.DockingModel, C = M.C, rad = Math.PI / 180;
  const vector = p => new THREE.Vector3(...M.toScene(p));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a121c);
  scene.fog = new THREE.FogExp2(0x0a121c, 0.013);
  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 100);
  const target = new THREE.Vector3(0.8, 2.05, 0);
  const views = { perspective: [10.8, 8.3, 14.5], front: [0.8, 2.05, 18.5], top: [0.8, 20, 0.001] };
  camera.position.fromArray(views.perspective);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
  catch (error) {
    container.insertAdjacentHTML('beforeend', '<div class="error-screen">Le rendu 3D nécessite WebGL. Activer l’accélération graphique du navigateur puis recharger.</div>');
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.setAttribute('aria-label', 'Plateforme, bras A1–A5, tripode spatial, pince et bouée');
  container.appendChild(renderer.domElement);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.copy(target); controls.enableDamping = true; controls.dampingFactor = 0.07;
  controls.minDistance = 5; controls.maxDistance = 35;
  scene.add(new THREE.HemisphereLight(0xd6edff, 0x233444, 0.9));
  const light = new THREE.DirectionalLight(0xfff3df, 1.3);
  light.position.set(4, 12, 7); light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  Object.assign(light.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 });
  light.shadow.bias = -0.0003; scene.add(light);
  const fill = new THREE.DirectionalLight(0x70c8ff, 0.55); fill.position.set(-8, 5, -6); scene.add(fill);
  const solids = [], skeleton = new THREE.Group(); scene.add(skeleton); skeleton.visible = false;
  const mat = (color, metalness = 0.45) => new THREE.MeshStandardMaterial({ color, metalness, roughness: 0.36 });
  const materials = {
    structure: mat(0x8195a7, 0.75), dark: mat(0x253d51), arm: mat(0xf4bc69, 0.55),
    joint: mat(0x253444, 0.8), tripod: mat(0x6be4d3, 0.6), buoy: mat(0xe96c80, 0.25),
    collar: mat(0xffc3aa, 0.45), upper: mat(0xe7eff2), lower: mat(0x315766), chrome: mat(0xb5d5dd, 0.9)
  };
  function mesh(geometry, material, parent = scene, position) {
    const o = new THREE.Mesh(geometry, material);
    o.castShadow = true; o.receiveShadow = true;
    if (position) o.position.copy(vector(position));
    parent.add(o);
    const ghost = material.clone(); ghost.transparent = true; ghost.opacity = 0.14; ghost.depthWrite = false;
    solids.push({ o, material, ghost }); return o;
  }
  function box(size, position, material, parent = scene) {
    return mesh(new THREE.BoxGeometry(size[0], size[2], size[1]), material, parent, position);
  }
  function segment(a, b, radius, material, parent = scene, schematic = true) {
    const av = vector(a), bv = vector(b), d = bv.clone().sub(av);
    const o = mesh(new THREE.CylinderGeometry(radius, radius, d.length(), 16), material, parent);
    o.position.copy(av).add(bv).multiplyScalar(0.5);
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    if (schematic && parent === scene) skeletonSegment(a, b, material.color);
    return o;
  }
  function skeletonSegment(a, b, color, parent = skeleton) {
    const av = vector(a), bv = vector(b), d = bv.clone().sub(av);
    const o = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, d.length(), 8),
      new THREE.MeshBasicMaterial({ color, depthTest: false }));
    o.position.copy(av).add(bv).multiplyScalar(0.5);
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    o.renderOrder = 5; parent.add(o); return o;
  }
  function jointNode(p) {
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), new THREE.MeshBasicMaterial({ color: 0xe5f6f6, depthTest: false }));
    o.position.copy(vector(p)); o.renderOrder = 6; skeleton.add(o); return o;
  }
  // Rigid composite platform: real Y width, cylinder axis Y and triangulated struts.
  const platform = new THREE.Group(); platform.name = 'PLATFORM_ASSEMBLY'; scene.add(platform);
  box([5.6, C.platformWidth, C.platformThickness], [-1, 0, C.platformZ], materials.structure, platform);
  [-1.14, 1.14].forEach(y => box([5.6, 0.07, 0.1], [-1, y, 3.32], materials.chrome, platform));
  const longeron = mesh(new THREE.CylinderGeometry(0.87, 0.87, 3.25, 48), materials.dark, platform, [-2.6, 0, 1.4]);
  longeron.name = 'LONGERON'; longeron.rotation.x = Math.PI / 2;
  for (const y of [-1.12, 1.12]) {
    segment([-3.15, y, 3.04], [-3.16, y, 2.06], 0.065, materials.structure, platform);
    segment([-2.0, y, 3.04], [-2.1, y, 2.08], 0.065, materials.structure, platform);
    segment([-3.3, y, 3.04], [-2.1, y, 2.08], 0.045, materials.chrome, platform);
  }
  box([0.5, 0.52, 0.12], [C.base[0], 0, 3.32], materials.dark, platform);
  segment([C.base[0], 0, 3.38], C.base, 0.14, materials.arm);
  // Four Y pivots. Each link's local longitudinal direction is +x.
  const arm = new THREE.Group(); arm.name = 'ARTICULATED_ARM'; arm.position.copy(vector(C.base)); scene.add(arm);
  const pivots = [], pivotSchematic = [], linkSchematic = [];
  let parent = arm;
  C.lengths.forEach((length, i) => {
    const pivot = new THREE.Group(); pivot.name = 'A' + (i + 1); parent.add(pivot); pivots.push(pivot);
    const pin = mesh(new THREE.CylinderGeometry(i === 3 ? 0.12 : 0.17, i === 3 ? 0.12 : 0.17, 0.39, 24), materials.joint, pivot);
    pin.rotation.x = Math.PI / 2;
    box([length, i === 3 ? 0.12 : 0.2, i === 3 ? 0.1 : 0.18], [length / 2, 0, 0], i === 3 ? materials.chrome : materials.arm, pivot);
    const next = new THREE.Group(); next.position.x = length; pivot.add(next); parent = next;
    linkSchematic.push(skeletonSegment([0, 0, 0], [length, 0, 0], 0xf4bc69));
    pivotSchematic.push(jointNode([0, 0, 0]));
  });
  const rotator = new THREE.Group(); rotator.name = 'A5'; parent.add(rotator);
  const axial = mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.12, 24), materials.tripod, rotator);
  axial.rotation.z = Math.PI / 2;
  const a5Ring = mesh(new THREE.TorusGeometry(0.17, 0.018, 8, 40), materials.tripod, parent);
  a5Ring.rotation.y = Math.PI / 2;
  // BOX_1 shares the A5 transform. No world-orientation overrides.
  const tool = new THREE.Group(); tool.name = 'BOX_1'; rotator.add(tool);
  tool.position.x = C.boxHeight;
  mesh(new THREE.BoxGeometry(C.boxHeight, C.boxWidth, C.boxDepth), materials.upper, tool).position.x = -C.boxHeight / 2;
  const upperFace = mesh(new THREE.BoxGeometry(0.012, C.boxWidth * 0.83, C.boxDepth * 0.82), materials.lower, tool);
  upperFace.position.x = -0.006;
  const upperKey = mesh(new THREE.BoxGeometry(0.02, 0.09, 0.11), materials.arm, tool); upperKey.position.set(-0.017, C.boxWidth / 2 - 0.065, 0);
  const toolNode = jointNode([0, 0, 0]), a5Node = jointNode([0, 0, 0]);
  // Spatial tripod with exactly three fixed-length bars and all six end joints.
  const tripod = new THREE.Group(); tripod.name = 'TRIPOD_GRIPPER_ASSEMBLY'; scene.add(tripod);
  M.anchors.forEach((a, i) => {
    segment(a.top, a.bottom, 0.075, materials.tripod);
    const top = mesh(new THREE.SphereGeometry(0.14, 20, 16), materials.chrome, tripod, a.top);
    const bottom = mesh(new THREE.SphereGeometry(0.13, 20, 16), materials.chrome, tripod, a.bottom);
    top.name = 'T_UP_' + (i + 1); bottom.name = 'T_LOW_' + (i + 1);
    jointNode(a.top); jointNode(a.bottom);
  });
  mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.13, 40), materials.dark, tripod, C.tripodCenter);
  // Central member explicitly distinct from rear branch, rigid in variant T3-B.
  segment([0.35, 0, 3.04], [0.35, 0, 0.54], 0.085, materials.structure);
  // A single rigid carrier ends at the common vertical hinge, on the platform side.
  const jawPivot = M.jawPose(0, 0).pivot;
  segment([0.35, 0, 0.54], [0.75, 0, 0.46], 0.08, materials.tripod);
  segment([0.75, 0, 0.46], jawPivot, 0.085, materials.tripod);
  const hingePin = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.43, 24), materials.chrome, scene, jawPivot);
  hingePin.name = 'GRIPPER_PIVOT_Z';
  for (const dz of [-0.21, 0.21]) box([0.25, 0.28, 0.04], [jawPivot[0], 0, C.jawZ + dz], materials.joint);
  jointNode(jawPivot);
  function halfRing(start, end) {
    const shape = new THREE.Shape();
    shape.moveTo(C.jawOuter * Math.cos(start), C.jawOuter * Math.sin(start));
    shape.absarc(0, 0, C.jawOuter, start, end, false);
    shape.lineTo(C.jawInner * Math.cos(end), C.jawInner * Math.sin(end));
    shape.absarc(0, 0, C.jawInner, end, start, true); shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: C.jawThickness, bevelEnabled: false, curveSegments: 40 });
    geo.rotateX(-Math.PI / 2);
    geo.translate(C.jawPivotRadius, -C.jawThickness / 2, 0); return geo;
  }
  const jaws = [0, Math.PI].map((a, i) => {
    const g = new THREE.Group(); g.name = 'GRIPPER_JAW_' + (i + 1); scene.add(g);
    mesh(halfRing(a, a + Math.PI), materials.tripod, g);
    // Stacked hinge eyes share the same pin; each rigid jaw keeps its curved arm.
    const eyeHeight = (i === 0 ? 1 : -1) * 0.11;
    const eye = mesh(new THREE.TorusGeometry(0.105, 0.035, 12, 32), materials.tripod, g, [0, 0, eyeHeight]);
    eye.rotation.x = Math.PI / 2;
    const attachAngle = Math.PI + (i === 0 ? -0.16 : 0.16), r = (C.jawInner + C.jawOuter) / 2;
    segment([0.075, 0, eyeHeight], [C.jawPivotRadius + r * Math.cos(attachAngle), r * Math.sin(attachAngle), 0], 0.055, materials.tripod, g, false);
    return g;
  });
  const jawOutlines = [0, Math.PI].map(a => {
    const r = (C.jawInner + C.jawOuter) / 2;
    const points = Array.from({ length: 65 }, (_, i) => new THREE.Vector3(C.jawPivotRadius + Math.cos(a + i / 64 * Math.PI) * r, 0, -Math.sin(a + i / 64 * Math.PI) * r));
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x6be4d3, depthTest: false }));
    line.renderOrder = 5; skeleton.add(line); return line;
  });
  // Buoy is a separate WORLD child. All its components, including BOX_2, are rigid children.
  const buoyGroup = new THREE.Group(); buoyGroup.name = 'BUOY_ASSEMBLY'; scene.add(buoyGroup);
  const profile = M.buoyProfile.map(([z, r]) => new THREE.Vector2(r, z));
  mesh(new THREE.LatheGeometry(profile, 64), materials.buoy, buoyGroup);
  mesh(new THREE.CylinderGeometry(C.collarRadius, C.collarRadius, C.collarThickness, 64), materials.collar, buoyGroup, [0, 0, C.collarZ]);
  const collarRim = mesh(new THREE.TorusGeometry(C.collarRadius, 0.025, 10, 64), materials.chrome, buoyGroup, [0, 0, C.collarZ]);
  collarRim.rotation.x = Math.PI / 2;
  const receiverGroup = new THREE.Group(); receiverGroup.name = 'BOX_2'; receiverGroup.position.y = C.socketZ; buoyGroup.add(receiverGroup);
  box([C.boxWidth, C.boxDepth, C.boxHeight], [0, 0, -C.boxHeight / 2], materials.dark, receiverGroup);
  const receiverFaceMaterial = mat(0x427780);
  box([C.boxWidth * 0.83, C.boxDepth * 0.82, 0.012], [0, 0, -0.006], receiverFaceMaterial, receiverGroup);
  box([0.09, 0.11, 0.02], [C.boxWidth / 2 - 0.065, 0, -0.017], materials.arm, receiverGroup);
  const buoyAxis = skeletonSegment([0, 0, -1.65], [0, 0, C.socketZ], 0xfb7185);
  // Water is a visual surface only, with a separate visibility toggle.
  const water = new THREE.Group(); scene.add(water);
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(32, 26), new THREE.MeshStandardMaterial({ color: 0x15576d, transparent: true, opacity: 0.24, roughness: 0.33, metalness: 0.4, side: THREE.DoubleSide, depthWrite: false }));
  surface.rotation.x = -Math.PI / 2; surface.receiveShadow = true; water.add(surface);
  const waterGrid = new THREE.GridHelper(28, 28, 0x28536a, 0x173349); waterGrid.position.y = -0.02; water.add(waterGrid);
  for (let z = -8; z <= 8; z += 2) {
    const wave = Array.from({ length: 90 }, (_, i) => new THREE.Vector3(-13 + i * 0.3, 0.013, z + 0.065 * Math.sin(i * 0.7)));
    water.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(wave), new THREE.LineBasicMaterial({ color: 0x30627a, transparent: true, opacity: 0.32 })));
  }
  const floor = new THREE.GridHelper(24, 24, 0x304451, 0x182731); floor.position.y = -2; scene.add(floor);
  const axesOrigin = [-3.9, 1.8, -1.9];
  [[1, 0, 0, 0xf4bc69], [0, 1, 0, 0x6be4d3], [0, 0, 1, 0xfb7185]].forEach(([x, y, z, color]) => {
    const dir = vector([x, y, z]); scene.add(new THREE.ArrowHelper(dir, vector(axesOrigin), 0.65, color, 0.13, 0.07));
  });
  const errorLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xf4bc69 })); scene.add(errorLine);
  let running = false, schematic = false, labelsVisible = true;
  const state = { time: 0, speed: 1, manual: false, joints: [], buoy: M.neutralBuoy(), opening: 1, capture: 'OPEN', dock: 'OPEN', metrics: null };
  const number = (v, digits = 2) => (Math.abs(v) < 1e-9 ? 0 : v).toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const labels = [];
  function label(text, object, position, kind = '') {
    const element = document.createElement('div'); element.className = 'tag-bubble'; element.textContent = text; element.dataset.kind = kind;
    $('labels-layer').appendChild(element); labels.push({ text, object, position, element });
  }
  label('BOX_1', tool, [0, 0.36, 0], 'tool'); label('BOX_2', receiverGroup, [0, 0.19, 0.42], 'tool');
  pivots.forEach((p, i) => label('A' + (i + 1) + ' · PIVOT Y', p, [0, 0.27, 0]));
  label('A5 · ROTATION LOCALE', rotator, [0, 0.28, 0]);
  label('PLATEFORME', platform, [-2.7, 3.45, -0.7]); label('LONGERON · AXE Y', longeron, [0, -0.6, 0]);
  label('BOUÉE', buoyGroup, [0.4, -0.3, 0.5]); label('COLLERETTE', buoyGroup, [0.5, C.collarZ + 0.15, 0.75]);
  label('PINCE PÉRIPHÉRIQUE', jaws[1], [C.jawPivotRadius, 0.12, 0.8], 'tool');
  label('PIVOT PINCE · Z', hingePin, [0, 0.32, 0], 'tool'); label('MÂT CENTRAL · FIXE', null, vector([0.35, 0, 2.4]).toArray());
  M.anchors.forEach((a, i) => {
    label('T_UP_' + (i + 1), null, vector(a.top).add(new THREE.Vector3(0, 0.15, 0)).toArray());
    label('T_LOW_' + (i + 1), null, vector(a.bottom).add(new THREE.Vector3(0, -0.18, 0)).toArray());
  });
  label('EAU · Z = 0', null, [-3.4, 0.04, 2.2]);
  label('X', null, vector([-3.15, 1.8, -1.9]).toArray());
  label('Y', null, vector([-3.9, 2.55, -1.9]).toArray());
  label('Z', null, vector([-3.9, 1.8, -1.15]).toArray());
  function updateLabels() {
    $('labels-layer').hidden = !labelsVisible;
    if (!labelsVisible) return;
    const width = container.clientWidth, height = container.clientHeight, occupied = [];
    const v = new THREE.Vector3();
    labels.forEach(l => {
      v.fromArray(l.position); if (l.object) l.object.localToWorld(v); v.project(camera);
      const x = (v.x + 1) * width / 2, y = (1 - v.y) * height / 2, w = l.text.length * 6.2 + 14;
      const bounds = { l: x - w / 2, r: x + w / 2, t: y - 24, b: y + 2 };
      const hidden = v.z < -1 || v.z > 1 || bounds.l < 5 || bounds.r > width - 5 || bounds.t < (width < 450 ? 210 : width < 750 ? 175 : 125) || bounds.b > height - (width < 750 ? 215 : 160) ||
        occupied.some(b => bounds.l < b.r && bounds.r > b.l && bounds.t < b.b && bounds.b > b.t);
      l.element.hidden = hidden || (l.text.startsWith('EAU') && !water.visible);
      if (!hidden) { occupied.push(bounds); l.element.style.left = x + 'px'; l.element.style.top = y + 'px'; }
    });
  }
  function draw() {
    pivots.forEach((p, i) => p.rotation.z = state.joints[i] * rad);
    rotator.rotation.x = -state.joints[4] * rad;
    buoyGroup.position.set(state.buoy.x, state.buoy.lift, -state.buoy.y);
    buoyGroup.rotation.y = state.buoy.heading * rad;
    jaws.forEach((g, i) => {
      const pose = M.jawPose(i, state.opening);
      g.position.copy(vector(pose.pivot)); g.rotation.y = pose.angle * rad;
      jawOutlines[i].position.copy(g.position); jawOutlines[i].rotation.copy(g.rotation);
    });
    scene.updateMatrixWorld(true);
    state.metrics.points.slice(0, 4).forEach((a, i) => {
      const av = vector(a), bv = vector(state.metrics.points[i + 1]);
      linkSchematic[i].position.copy(av).add(bv).multiplyScalar(0.5);
      linkSchematic[i].quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bv.sub(av).normalize());
      pivotSchematic[i].position.copy(vector(a));
    });
    toolNode.position.copy(vector(state.metrics.tcp)); rotator.getWorldPosition(a5Node.position);
    buoyAxis.position.copy(buoyGroup.position); buoyAxis.position.y += (C.socketZ - 1.65) / 2;
    const positions = errorLine.geometry.attributes.position;
    const a = vector(state.metrics.tcp), b = vector(state.metrics.target);
    positions.setXYZ(0, a.x, a.y, a.z); positions.setXYZ(1, b.x, b.y, b.z); positions.needsUpdate = true; errorLine.geometry.computeBoundingSphere();
    receiverFaceMaterial.color.setHex(state.dock === 'LOCKED' ? 0x6be4d3 : state.metrics.contact ? 0xf4bc69 : 0x427780);
    receiverFaceMaterial.emissive.setHex(state.dock === 'LOCKED' ? 0x18564c : 0);
  }
  function buildControls(targetId, items, prefix) {
    $(targetId).innerHTML = items.map((item, i) => '<div class="control ' + (prefix === 'j' ? 'robot' : '') + '"><div class="control-label"><label for="slide-' + prefix + (i + 1) + '">' + item.name + '</label><output id="txt-' + prefix + (i + 1) + '"></output></div><input id="slide-' + prefix + (i + 1) + '" type="range" min="' + item.min + '" max="' + item.max + '" step="' + item.step + '"><div class="limits"><span>' + item.min + ' ' + item.unit + '</span><span>' + item.max + ' ' + item.unit + '</span></div></div>').join('');
  }
  buildControls('joint-controls', ['A1 · épaule', 'A2 · articulation haute', 'A3 · retour du bras', 'A4 · orientation terminale', 'A5 · rotation axiale'].map((name, i) => ({ name, min: C.jointLimits[i][0], max: C.jointLimits[i][1], step: 0.1, unit: '°' })), 'j');
  const buoyItems = [
    { name: 'Position X', key: 'x', min: 2.9, max: 5.8, step: 0.01, unit: 'u' },
    { name: 'Position Y', key: 'y', min: -0.5, max: 0.5, step: 0.01, unit: 'u' },
    { name: 'Déplacement Z', key: 'lift', min: -0.3, max: 0.3, step: 0.01, unit: 'u' },
    { name: 'Rotation autour de Z', key: 'heading', min: -180, max: 180, step: 0.1, unit: '°' }
  ];
  buildControls('buoy-controls', buoyItems, 'b');
  let start = 0;
  M.phases.forEach((p, i) => {
    const button = document.createElement('button'), time = start; button.title = p.name;
    button.setAttribute('aria-label', 'Aller à l’étape ' + (i + 1) + ' : ' + p.name); button.addEventListener('click', () => seek(time));
    $('phase-list').appendChild(button); start += p.duration;
  });
  function updateUI() {
    const m = state.metrics, p = M.trajectory(state.time);
    $('val-delta-r').textContent = number(m.radial, 3); $('val-delta-z').textContent = number(m.gap, 3);
    $('val-angle').textContent = number(m.angle, 1); $('val-key-angle').textContent = number(m.keyAngle, 1);
    $('dock-progress-bar').style.width = m.approach * 100 + '%';
    $('dock-badge').textContent = m.collision ? 'Interférence' : state.dock === 'LOCKED' ? '● Docking verrouillé' : m.contact ? 'Contact · interface ouverte' : m.aligned ? 'Faces alignées' : 'Interface ouverte · à aligner';
    $('dock-badge').dataset.tone = m.collision ? 'danger' : m.aligned ? '' : 'warn';
    $('capture-state').textContent = state.capture; $('dock-state').textContent = state.dock;
    $('capture-state').dataset.engaged = state.capture === 'ENGAGED'; $('dock-state').dataset.engaged = state.dock === 'LOCKED';
    $('constraint-note').textContent = state.dock === 'LOCKED' ? 'Les deux liaisons sont engagées. Déverrouiller les boîtes avant tout mouvement.' : state.capture === 'ENGAGED' ? 'Bouée retenue en translation ; sa rotation Z reste libre.' : 'Bouée indépendante de la plateforme.';
    state.joints.forEach((v, i) => { $('slide-j' + (i + 1)).value = v; $('txt-j' + (i + 1)).textContent = number(v, 1) + '°'; $('slide-j' + (i + 1)).disabled = state.dock === 'LOCKED'; });
    buoyItems.forEach((item, i) => { $('slide-b' + (i + 1)).value = state.buoy[item.key]; $('txt-b' + (i + 1)).textContent = number(state.buoy[item.key], item.unit === '°' ? 1 : 2) + ' ' + item.unit; $('slide-b' + (i + 1)).disabled = state.dock === 'LOCKED' || (state.capture === 'ENGAGED' && item.key !== 'heading'); });
    $('slide-opening').value = state.opening; $('txt-opening').textContent = number(state.opening * C.jawMaxAngle, 1) + '° / demi-pince'; $('slide-opening').disabled = state.capture === 'ENGAGED';
    $('btn-position').disabled = state.capture === 'ENGAGED'; $('btn-capture').disabled = state.capture === 'ENGAGED' || !m.canCapture;
    $('btn-align').disabled = state.dock === 'LOCKED'; $('btn-dock').disabled = state.dock !== 'LOCKED' && !m.canDock;
    $('btn-dock').textContent = state.dock === 'LOCKED' ? 'Déverrouiller les boîtes' : 'Verrouiller les boîtes';
    $('btn-retreat').disabled = state.dock === 'LOCKED'; $('btn-release').disabled = state.capture !== 'ENGAGED' || state.dock === 'LOCKED';
    $('btn-contact').disabled = state.dock === 'LOCKED' || state.capture !== 'ENGAGED';
    $('mode-label').textContent = state.manual ? 'COMMANDE MANUELLE' : 'TRAJECTOIRE CALCULÉE';
    $('phase-counter').textContent = state.manual ? 'EXPLORATION DES MOBILITÉS' : 'Étape ' + String(p.index + 1).padStart(2, '0') + ' / 09';
    $('phase-name').textContent = state.manual ? 'Mode manuel' : p.name;
    $('phase-note').textContent = state.manual ? 'Les deux verrouillages imposent leurs contraintes. Les changements sont arrêtés aux interférences contrôlées.' : M.phases[p.index].note;
    $('timeline').value = state.time; $('time-value').textContent = number(state.time, 1) + ' s';
    [...$('phase-list').children].forEach((b, i) => { b.classList.toggle('current', !state.manual && i === p.index); b.classList.toggle('done', !state.manual && i < p.index); b.setAttribute('aria-current', !state.manual && i === p.index ? 'step' : 'false'); });
    $('btn-auto-play').textContent = running ? 'Ⅱ Pause' : state.manual || state.time >= M.duration ? '▶ Nouveau cycle' : state.time === 0 ? '▶ Lancer le cycle' : '▶ Reprendre';
  }
  function commit() { state.metrics = M.inspect(state.joints, state.buoy, state.opening, state.capture, state.dock); draw(); updateUI(); }
  function validate(candidate) {
    const m = M.inspect(candidate.joints, candidate.buoy, candidate.opening, candidate.capture, candidate.dock);
    return m.collision || (!m.captureValid ? 'La pince engagée retient la bouée.' : !m.dockValid ? 'Les boîtes verrouillées doivent rester solidaires.' : '');
  }
  function atTime(time) {
    const p = M.trajectory(time);
    if (!p.ok) return p.reason;
    const reason = validate(p); if (reason) return reason;
    Object.assign(state, { time: p.time, joints: p.joints, buoy: p.buoy, opening: p.opening, capture: p.capture, dock: p.dock }); return '';
  }
  function reset() { running = false; state.manual = false; atTime(0); $('safety-message').textContent = ''; commit(); }
  function seek(time) { running = false; state.manual = false; const reason = atTime(time); $('safety-message').textContent = reason ? 'Mouvement arrêté : ' + reason : ''; commit(); }
  function togglePlay() { if (state.manual || state.time >= M.duration) reset(); running = !running; updateUI(); }
  function manualStart() { running = false; state.manual = true; $('safety-message').textContent = ''; }
  function manualChange(kind, key, value) {
    manualStart();
    if (state.dock === 'LOCKED' || (state.capture === 'ENGAGED' && (kind === 'opening' || (kind === 'buoy' && key !== 'heading')))) {
      $('safety-message').textContent = 'Libérer la liaison temporaire avant de modifier cette mobilité.'; commit(); return;
    }
    const initial = kind === 'joints' ? state.joints[key] : kind === 'buoy' ? state.buoy[key] : state.opening;
    const step = kind === 'joints' || key === 'heading' ? 0.2 : 0.005;
    const count = Math.max(1, Math.ceil(Math.abs(value - initial) / step));
    for (let n = 1; n <= count; n++) {
      const v = initial + (value - initial) * n / count;
      const candidate = { ...state, joints: state.joints.slice(), buoy: { ...state.buoy } };
      if (kind === 'joints') candidate.joints[key] = v; else if (kind === 'buoy') candidate.buoy[key] = v; else candidate.opening = v;
      const reason = validate(candidate);
      if (reason) { $('safety-message').textContent = 'Butée virtuelle : ' + reason; break; }
      Object.assign(state, { joints: candidate.joints, buoy: candidate.buoy, opening: candidate.opening });
    }
    commit();
  }
  // Commands traverse intermediate IK poses and stop at the last safe pose.
  function moveTool(targetTCP, heading) {
    const origin = M.forward(state.joints).tcp, heading0 = state.joints[4], a10 = state.joints[0];
    const beta0 = state.joints.slice(0, 4).reduce((sum, v) => sum + v, 0), branch = state.joints[2] > 0 ? 1 : -1;
    for (let n = 1; n <= 160; n++) {
      const u = n / 160, tcp = origin.map((v, i) => v + (targetTCP[i] - v) * u);
      const ik = M.inverse(tcp, heading0 + (heading - heading0) * u, a10 + (62 - a10) * u, beta0 + (-90 - beta0) * u, branch);
      const reason = ik.ok ? validate({ ...state, joints: ik.joints }) : ik.reason;
      if (reason) { $('safety-message').textContent = 'Mouvement arrêté : ' + reason; return false; }
      state.joints = ik.joints;
    }
    return true;
  }
  for (let i = 0; i < 5; i++) $('slide-j' + (i + 1)).addEventListener('input', e => manualChange('joints', i, Number(e.target.value)));
  buoyItems.forEach((item, i) => $('slide-b' + (i + 1)).addEventListener('input', e => manualChange('buoy', item.key, Number(e.target.value))));
  $('slide-opening').addEventListener('input', e => manualChange('opening', null, Number(e.target.value)));
  $('btn-position').addEventListener('click', () => {
    manualStart(); const candidate = { ...state, buoy: M.neutralBuoy() }; const reason = validate(candidate);
    if (reason) $('safety-message').textContent = 'Pose refusée : ' + reason; else state.buoy = candidate.buoy; commit();
  });
  $('btn-capture').addEventListener('click', () => { manualStart(); if (state.metrics.canCapture) state.capture = 'ENGAGED'; commit(); });
  $('btn-align').addEventListener('click', () => {
    manualStart(); const targetTCP = M.receiver(state.buoy); targetTCP[2] += 0.35;
    if (moveTool(targetTCP, state.buoy.heading)) $('safety-message').textContent = 'Faces alignées à 0,35 u. Utiliser « Accoster » pour atteindre le contact.';
    commit();
  });
  // The contact button is created explicitly to distinguish contact from locking.
  const contactButton = document.createElement('button'); contactButton.id = 'btn-contact'; contactButton.textContent = 'Accoster';
  $('btn-dock').before(contactButton);
  contactButton.addEventListener('click', () => {
    manualStart();
    if (state.capture !== 'ENGAGED') $('safety-message').textContent = 'Engager la pince avant l’accostage fin.';
    else moveTool(M.receiver(state.buoy), state.buoy.heading);
    commit();
  });
  $('btn-dock').addEventListener('click', () => { manualStart(); if (state.dock === 'LOCKED') state.dock = 'OPEN'; else if (state.metrics.canDock) state.dock = 'LOCKED'; commit(); });
  $('btn-retreat').addEventListener('click', () => {
    manualStart(); const up = M.forward(state.joints).tcp; up[2] = Math.max(up[2], C.socketZ + state.buoy.lift + 0.5);
    if (moveTool(up, state.joints[4])) moveTool(C.homeTCP, state.joints[4]); commit();
  });
  $('btn-release').addEventListener('click', () => {
    manualStart(); const m = state.metrics;
    if (m.radial < 0.9 && m.gap < 0.3) $('safety-message').textContent = 'Reculer le bras avant de libérer la bouée.';
    else { state.capture = 'OPEN'; state.opening = 1; } commit();
  });
  $('btn-auto-play').addEventListener('click', togglePlay); $('btn-reset').addEventListener('click', reset);
  $('timeline').addEventListener('input', e => seek(Number(e.target.value)));
  document.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click', () => { state.speed = Number(b.dataset.speed); document.querySelectorAll('[data-speed]').forEach(a => a.setAttribute('aria-pressed', a === b)); }));
  $('btn-toggle-mode').addEventListener('click', () => { schematic = !schematic; solids.forEach(s => s.o.material = schematic ? s.ghost : s.material); skeleton.visible = schematic; $('btn-toggle-mode').setAttribute('aria-pressed', schematic); });
  $('btn-labels').addEventListener('click', () => { labelsVisible = !labelsVisible; $('btn-labels').setAttribute('aria-pressed', labelsVisible); updateLabels(); });
  $('btn-water').addEventListener('click', () => { water.visible = !water.visible; $('btn-water').setAttribute('aria-pressed', water.visible); });
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
    camera.position.fromArray(views[b.dataset.view]); controls.target.copy(target); controls.update();
    document.querySelectorAll('[data-view]').forEach(a => a.setAttribute('aria-pressed', a === b));
  }));
  const dialog = $('model-dialog');
  document.querySelectorAll('[data-open-model]').forEach(b => b.addEventListener('click', () => { running = false; updateUI(); dialog.showModal(); }));
  $('close-model').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); });
  document.addEventListener('keydown', e => { if (e.code === 'Space' && !dialog.open && !/INPUT|BUTTON|SELECT|TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); togglePlay(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { running = false; updateUI(); } });
  new ResizeObserver(() => {
    const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return;
    camera.aspect = w / h; camera.zoom = w < 720 ? 0.59 : 0.91;
    if (w < 720) camera.setViewOffset(w, h, 0, 38, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix(); renderer.setSize(w, h);
  }).observe(container);
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (running) {
      const next = Math.min(M.duration, state.time + dt * state.speed), reason = atTime(next);
      if (reason) { running = false; $('safety-message').textContent = 'Cycle arrêté : ' + reason; }
      if (next >= M.duration) running = false;
      commit();
    }
    controls.update(); renderer.render(scene, camera); updateLabels();
  }
  reset(); animate();
  // Read-only diagnostics compare independently transformed scene joints and model.
  window.dockingDebug = { snapshot: () => {
    scene.updateMatrixWorld(true);
    const q = tool.getWorldQuaternion(new THREE.Quaternion());
    const toMechanical = v => [v.x, -v.z, v.y];
    const sceneTCP = toMechanical(tool.getWorldPosition(new THREE.Vector3()));
    const sceneAxis = toMechanical(new THREE.Vector3(1, 0, 0).applyQuaternion(q));
    const sceneXAxis = toMechanical(new THREE.Vector3(0, 1, 0).applyQuaternion(q));
    return { time: state.time, running, manual: state.manual, joints: state.joints.slice(), buoy: { ...state.buoy }, opening: state.opening,
      capture: state.capture, dock: state.dock, metrics: structuredClone(state.metrics), sceneTCP, sceneAxis, sceneXAxis,
      sceneReceiver: toMechanical(receiverGroup.getWorldPosition(new THREE.Vector3())),
      scenePivots: pivots.map(p => toMechanical(p.getWorldPosition(new THREE.Vector3()))),
      sceneJawPivots: jaws.map(g => toMechanical(g.getWorldPosition(new THREE.Vector3()))),
      sceneJawTips: jaws.map(g => toMechanical(g.localToWorld(new THREE.Vector3(C.jawPivotRadius + (C.jawInner + C.jawOuter) / 2, 0, 0)))),
      jawAngles: jaws.map(g => g.rotation.y / rad),
      tripod: M.anchors.map(a => ({ length: a.length, top: a.top.slice(), bottom: a.bottom.slice() })) };
  } };
})();
