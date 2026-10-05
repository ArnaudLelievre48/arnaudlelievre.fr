const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../docking-model.js');
const { C } = M;
const near = (a,b,tolerance=1e-8) => assert.ok(Math.abs(a-b)<tolerance, `${a} != ${b}`);
const nearVector = (a,b) => a.forEach((v,i)=>near(v,b[i]));
const distance = (a,b) => Math.hypot(...a.map((v,i)=>v-b[i]));
const buoy = M.neutralBuoy();
const pose = (target, heading=18, tilt=0) => {
  const ik=M.inverse(target,heading,62,tilt-90); assert.ok(ik.ok,ik.reason); return ik.joints;
};

test('cotes indicatives : plateforme 5 m, capture 4 m, séparation verticale dans la plage 3–4 m',()=>{
  near(C.platformMaxX-C.platformMinX,5); near(2*C.jawInner,4);
  assert.ok(C.platformZ-C.socketZ>=3 && C.platformZ-C.socketZ<=4);
  nearVector(M.supportForward().center,[C.captureX,0,C.jawZ]);
});

test('porte-pince encastré au longeron, D1 sur sa surface, seul G4 déplace D2',()=>{
  const neutral=M.supportForward();
  for(const g4 of [-18,-6,0,6,18]) {
    const p=M.supportForward([g4]); assert.ok(p.ok);
    nearVector(p.mount,C.carrierMount); nearVector(p.g4,neutral.g4); nearVector(p.d1,C.damperD1);
    near(distance(p.mount,p.g4),C.carrierLength);
    near(distance(p.g4,p.d2),Math.hypot(...C.damperLever));
    near(distance(p.g4,p.center),C.gripperOffset);
    near(distance(p.d1,p.d2),p.length);
    near(p.extension,p.length-neutral.length);
    near(p.tilt,g4);
    nearVector(p.d2,M.gripperToWorld(C.damperLever,[g4]));
  }
  for(const anchor of [C.longeronMount,C.damperD1]) {
    near(Math.hypot(anchor[0]-C.longeronCenter[0],anchor[2]-C.longeronCenter[2]),C.longeronRadius);
    assert.ok(Math.abs(anchor[1]-C.longeronCenter[1])<C.longeronLength/2);
  }
  assert.ok(Math.abs(M.supportForward([18]).length-neutral.length)>.05);
  assert.equal(M.supportForward([19]).ok,false);
  assert.equal(M.supportForward([-19]).ok,false);
  assert.equal(M.supportForward([0,5]).ok,false,'Aucune seconde mobilité en G1.');
});

test('la bouée capturée suit G4, le porte-pince reste encastré au longeron',()=>{
  const home=M.trajectory(0).joints;
  for(const angles of [[0],[1],[-1],[5]]) {
    const b=M.capturedBuoy(angles,33), p=M.supportForward(angles);
    nearVector(M.buoyToWorld([0,0,C.collarZ],b),p.center);
    const m=M.inspect(home,b,0,'ENGAGED','OPEN',angles);
    assert.ok(m.captureValid,m.collision); assert.equal(m.collision,'');
    nearVector(M.buoyToLocal(M.receiver(b),b),[0,0,C.socketZ]);
    if(angles[0]!==0) assert.ok(distance(M.receiver(b),M.receiver(buoy))>.05);
    const yawed={...b,heading:80}; assert.ok(M.captureCheck(yawed,0,angles).ready);
  }
  assert.equal(M.captureCheck(buoy,0,[5]).ready,false,'Une bouée immobile ne suit pas une pince déplacée.');
});

test('bras 4R + A5 : position et orientation suivent les boîtes, y compris inclinées',()=>{
  for(const angles of [[0],[1],[-1],[4]]) {
    const b=M.capturedBuoy(angles,33), target=M.receiver(b);
    const joints=pose(target,b.heading,b.tilt), f=M.forward(joints);
    nearVector(f.tcp,target); nearVector(f.axis,M.buoyRotate([0,0,-1],b));
    nearVector(f.xAxis,M.buoyRotate([1,0,0],b));
    f.points.slice(1).forEach((p,i)=>near(distance(p,f.points[i]),C.lengths[i]));
    assert.ok(M.inspect(joints,b,0,'ENGAGED','LOCKED',angles).dockValid);
  }
  assert.equal(M.inverse([C.captureX,.1,C.socketZ]).ok,false);
  assert.equal(M.inverse([100,0,0]).ok,false);
});

test('3 001 poses du cycle : continuité, oscillation amortie, course valide et capture avant docking',()=>{
  let previous, maxAngle=0, extensionRange=[],seen=new Set();
  for(let tick=0;tick<=3000;tick++) {
    const p=M.trajectory(tick/100); assert.ok(p.ok,`t=${p.time}: ${p.reason}`);
    assert.equal(p.metrics.collision,'',`t=${p.time}: ${p.metrics.collision}`);
    assert.ok(p.metrics.captureValid && p.metrics.dockValid);
    nearVector(p.metrics.tcp,p.tcp); seen.add(p.index);
    if(previous) {
      assert.ok(distance(p.tcp,previous.tcp)<.012);
      assert.ok(Math.abs(p.buoy.x-previous.buoy.x)<.02);
      assert.ok(Math.max(...p.joints.map((v,i)=>Math.abs(v-previous.joints[i])))<.6);
    }
    if(p.index===4){ maxAngle=Math.max(maxAngle,Math.abs(p.supportAngles[0])); extensionRange.push(p.metrics.support.length); }
    if(p.dock==='LOCKED'){assert.equal(p.capture,'ENGAGED');assert.ok(p.metrics.contact);}
    previous=p;
  }
  assert.equal(seen.size,9);assert.ok(maxAngle>4);
  assert.ok(Math.max(...extensionRange)-Math.min(...extensionRange)>.05);
  const early=Math.max(...Array.from({length:100},(_,i)=>Math.abs(M.trajectory(10+i/100).supportAngles[0])));
  const late=Math.max(...Array.from({length:100},(_,i)=>Math.abs(M.trajectory(14+i/100).supportAngles[0])));
  assert.ok(late<early*.4,'L’amplitude décroît pendant la stabilisation.');
  assert.equal(M.trajectory(9).capture,'ENGAGED');
  assert.equal(M.trajectory(26.99).dock,'OPEN');assert.equal(M.trajectory(27).dock,'LOCKED');
});

test('contact, capture et docking sont distincts et refusent les défauts d’alignement',()=>{
  const joints=pose(M.receiver(buoy));
  assert.ok(M.inspect(joints,buoy,0).contact);
  assert.equal(M.inspect(joints,buoy,0).canDock,false);
  assert.ok(M.inspect(joints,buoy,0,'ENGAGED').canDock);
  assert.equal(M.inspect(joints,buoy,1,'ENGAGED').captureValid,false);
  assert.equal(M.inspect(joints,buoy,0,'OPEN','LOCKED').dockValid,false);
  assert.equal(M.inspect(joints,{...buoy,heading:33},0,'ENGAGED','LOCKED').dockValid,false);
  const below=M.inspect(pose([C.captureX,0,C.socketZ-.08]),buoy);
  assert.ok(below.gap<0);assert.match(below.collision,/contact/);
  assert.equal(M.inspect(pose([C.captureX+.03,0,C.socketZ]),buoy).contact,false);
  const tilted=joints.slice();tilted[3]+=8;assert.equal(M.inspect(tilted,buoy).contact,false);
});

test('les demi-pinces se referment autour de leur charnière portée par G4 sans pénétrer la bouée',()=>{
  const r=(C.jawInner+C.jawOuter)/2;
  for(const support of [[0],[5],[-5]]) {
    const b=M.capturedBuoy(support), hinge=M.supportForward(support).hinge;
    for(let tick=0;tick<=50;tick++) {
      const opening=tick/50,p=M.jawPose(0,opening,support),q=M.jawPose(1,opening,support);
      nearVector(p.pivot,hinge);nearVector(q.pivot,hinge);near(p.angle,-q.angle);
      const front=M.jawPoint(0,0,r,opening,support),back=M.jawPoint(1,2*Math.PI,r,opening,support);
      near(front[0],back[0]);near(front[1],-back[1]);near(front[2],back[2]);
      near(distance(front,hinge),C.jawPivotRadius+r);
      near(distance(front,M.jawPoint(0,Math.PI/2,r,opening,support)),Math.SQRT2*r);
      assert.equal(M.gripperHitsBuoy(b,opening,support),false);
    }
  }
  assert.equal(M.gripperHitsBuoy({...buoy,y:.3},0),true);
  assert.ok(C.jawInner>M.buoyRadius(C.collarZ));
});

test('les collisions avec la plateforme et les butées du support sont détectées',()=>{
  assert.match(M.inspect([-90,0,0,0,0],buoy).collision,/plateforme/);
  assert.match(M.inspect(M.trajectory(0).joints,buoy,1,'OPEN','OPEN',[19]).collision,/Butée/);
  assert.equal(M.segmentHitsBox([0,0,7],[0,0,0],[-1,-1,5],[1,1,6]),true);
});


test('vérin à rotules : fermeture par rétraction, attaches solidaires des bras et course indépendante de G4',()=>{
  let previous=0;
  for(let tick=0;tick<=100;tick++) {
    const opening=tick/100, neutral=M.actuatorForward(opening);
    assert.ok(neutral.ok);assert.ok(neutral.length>previous);previous=neutral.length;
    const alpha=opening*C.jawMaxAngle*Math.PI/180;
    near(neutral.length,Math.hypot(2*(.85*Math.sin(alpha)+.35*Math.cos(alpha)),.8));
    assert.ok(neutral.extension<C.actuatorBodyLength);
    for(const g4 of [-18,0,18]) {
      const p=M.actuatorForward(opening,[g4]),hinge=M.supportForward([g4]).hinge;
      near(p.length,neutral.length);
      for(const [jaw,anchor] of [[0,p.v1],[1,p.v2]]) {
        near(distance(anchor,hinge),Math.hypot(...C.actuatorAnchors[jaw]));
        const local=M.rotateXZ(anchor.map((v,i)=>v-hinge[i]),-g4);
        const a=M.jawPose(jaw,opening).angle*Math.PI/180;
        nearVector([local[0]*Math.cos(a)+local[1]*Math.sin(a),-local[0]*Math.sin(a)+local[1]*Math.cos(a),local[2]],C.actuatorAnchors[jaw]);
      }
    }
  }
  near(M.actuatorForward(0).length,Math.hypot(.7,.8));
  near(M.actuatorForward(0).extension,0);
  assert.ok(M.actuatorForward(1).extension>.94);
  assert.ok(M.actuatorForward(1).length<C.actuatorMax);
  for(const t of [6,7,8,9]) {
    const pose=M.trajectory(t);near(pose.metrics.actuator.length,M.actuatorForward(pose.opening,pose.supportAngles).length);
    if(t>6) assert.ok(pose.metrics.actuator.length<M.trajectory(t-1).metrics.actuator.length);
  }
});
