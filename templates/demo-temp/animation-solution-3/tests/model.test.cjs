const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../docking-model.js');
const near=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
const neutral=M.solvePlatform([M.C.neutralStroke,M.C.neutralStroke,M.C.neutralStroke]);
const fine={z:290,rz:0},buoy={h:0,x:0,z:0};

test('fermeture des trois vérins sur 125 configurations au niveau de la bouée, troisième ancrage hors du plan',()=>{
  for(const a of [1100,1200,1300,1400,1500])for(const b of [1100,1200,1300,1400,1500])for(const c of [1100,1200,1300,1400,1500]) {
    const strokes=[a,b,c],p=M.solvePlatform(strokes);
    assert.ok(p.ok,JSON.stringify(strokes));
    M.anchors.forEach((anchor,i)=>{
      const bottom=M.toWorld(anchor.bottom,p);
      const distance=Math.hypot(...bottom.map((v,k)=>v-anchor.top[k]));
      near(distance,M.restLengths[i]+strokes[i]/1000);
    });
  }
  near(neutral.h,0);near(neutral.pitch,0);near(neutral.roll,0);
  assert.ok(M.anchors[2].bottom[2]<-1);
  assert.ok(M.anchors[1].top[0]>M.anchors[1].bottom[0]);
  for(const strokes of [[-1,300,300],[300,M.C.strokeMax+1,300],[NaN,300,300],[300,300]])assert.equal(M.solvePlatform(strokes).ok,false);
});

test('P2 et P3 restent rigides ; les deux mouvements fins sont indépendants et locaux',()=>{
  const pose=M.solvePlatform([180,380,240]);
  const p2=M.toWorld([0,0,0],pose),p3=M.toWorld([0,M.C.platform3Y,0],pose);
  near(Math.hypot(...p3.map((v,i)=>v-p2[i])),M.C.platform3Y);
  const a=M.forward(pose,{z:0,rz:0}),b=M.forward(pose,{z:200,rz:0}),c=M.forward(pose,{z:0,rz:75});
  b.tcp.forEach((v,i)=>near(v-a.tcp[i],-0.2*a.axis[i]));
  b.axis.forEach((v,i)=>near(v,a.axis[i]));
  c.tcp.forEach((v,i)=>near(v,a.tcp[i]));
  assert.ok(Math.hypot(...c.xAxis.map((v,i)=>v-a.xAxis[i]))>1);
  const point=[0.23,1.36,-0.72];M.toLocal(M.toWorld(point,pose),pose).forEach((v,i)=>near(v,point[i]));
});

test('cycle complet : 6 401 poses continues, courses valides, contact avant verrouillage',()=>{
  let previous,previousStrokes,previousHeight,locked=0;
  for(let tick=0;tick<=6400;tick++) {
    const t=tick/200,tr=M.trajectory(t),pose=M.solvePlatform(tr.strokes,tr.pose);
    assert.ok(pose.ok,`t=${t}`);
    near(tr.buoy.h,0);
    if(t<=11 && previousStrokes) {
      assert.ok(tr.pose.h<=previousHeight+1e-10,`frame must descend t=${t}`);
      tr.strokes.forEach((stroke,i)=>assert.ok(stroke>=previousStrokes[i]-1e-7,`leg ${i+1} must extend t=${t}`));
    }
    previousStrokes=tr.strokes;previousHeight=tr.pose.h;
    const m=M.inspect(pose,tr.fine,tr.buoy,tr.clamp,tr.captureState);
    assert.equal(m.collision,'',`t=${t}: ${m.collision}`);
    assert.ok(tr.strokes.every(s=>s>=0&&s<=M.C.strokeMax));
    assert.ok(tr.fine.z>=0&&tr.fine.z<=M.C.fineMax);
    if(previous)assert.ok(Math.hypot(...m.tcp.map((v,i)=>v-previous[i]))<0.01,`discontinuity t=${t}`);
    previous=m.tcp;
    if(tr.fine.z>0) assert.ok(m.capture.centered,`P2 must be centered before fine docking t=${t}`);
    if(tr.dock==='LOCKED') { assert.ok(m.contact,`t=${t}`);assert.ok(m.capture.centered);near(m.gap,0);near(m.radial,0);near(tr.fine.rz,0);locked++; }
  }
  assert.ok(locked>500);
  assert.equal(M.trajectory(20.9).dock,'OPEN');
  assert.equal(M.trajectory(21).dock,'LOCKED');
  assert.equal(M.trajectory(24).dock,'OPEN');
  assert.equal(M.trajectory(32).name,'Dégagement du bâti');
  assert.ok(M.inspect(M.trajectory(32).pose,M.trajectory(32).fine,buoy).gap>0.4);
});

test('contact exige coaxialité, orientation et faces opposées sans pénétration',()=>{
  assert.ok(M.inspect(neutral,fine,buoy).contact);
  assert.equal(M.inspect(neutral,{z:280,rz:0},buoy).contact,false);
  assert.equal(M.inspect(neutral,{z:290,rz:15},buoy).contact,false);
  assert.equal(M.inspect({...neutral,pitch:5*M.rad},fine,buoy).contact,false);
  assert.equal(M.inspect(neutral,fine,{...buoy,x:0.01}).contact,false);
  const below=M.inspect(neutral,{z:340,rz:0},buoy);
  assert.ok(below.gap<0);assert.match(below.collision,/dépasse/);assert.equal(below.contact,false);
});

test('la bouée est indépendante ; P2 conserve un passage de diamètre supérieur à 1 m',()=>{
  assert.ok(M.C.hole*2>M.C.buoyRadius*2);
  const a=M.inspect(neutral,{z:0,rz:0},buoy);
  const b=M.inspect(neutral,{z:0,rz:0},{...buoy,h:-1});
  a.tcp.forEach((v,i)=>near(v,b.tcp[i]));near(b.receiver[1]-a.receiver[1],-1);near(b.gap-a.gap,1);
  assert.equal(a.collision,'');assert.ok(a.clearance>0);
  assert.match(M.inspect(neutral,{z:0,rz:0},{...buoy,x:0.45}).collision,/PLATFORM_2/);
});


test('fermeture de P2 : niveau requis, centrage progressif, contact radial sans pénétration',()=>{
  const early=M.centering({...neutral,h:0.1},buoy,0.5);
  assert.equal(early.ready,false);assert.match(early.reason,/niveau/);
  const inclined=M.centering({...neutral,pitch:3*M.rad},buoy,0.5);
  assert.equal(inclined.ready,false);
  for(const q of [0,0.25,0.5,0.75,1]) {
    const m=M.centering(neutral,{...buoy,x:0.08*(1-q)},q);
    assert.equal(m.reason,'');assert.ok(m.clearance>=-1e-8);
    assert.equal(m.centered,q===1);
  }
  assert.match(M.centering(neutral,{...buoy,x:0.04},1).reason,/pénètrent/);
  assert.match(M.centering(neutral,buoy,1.1).reason,/limites/);
  const before=M.trajectory(11),after=M.trajectory(14);
  assert.equal(before.clamp,0);assert.ok(before.buoy.x>0);
  assert.equal(after.clamp,1);near(after.buoy.x,0);
  assert.deepEqual(before.pose,after.pose);
  const retracted=M.trajectory(28),released=M.trajectory(30);
  assert.equal(retracted.fine.z,0);assert.equal(retracted.clamp,1);
  assert.equal(released.clamp,0);near(released.pose.h,0);
  assert.equal(M.trajectory(29).captureState,'OPENING');
});


test('la bouée reste en hauteur ; les trois vérins s’étendent pour abaisser P2/P3',()=>{
  const high=M.trajectory(2),low=M.trajectory(11);
  near(high.pose.h,1.2);near(low.pose.h,0);near(high.buoy.h,low.buoy.h);
  high.strokes.forEach((s,i)=>assert.ok(low.strokes[i]-s>1000));
  near(high.fine.z,0);near(low.fine.z,0);
  near(M.toWorld([0,M.C.platform3Y,0],low.pose)[1],M.C.platform3Y);
  const free=M.trajectory(M.duration);
  near(free.buoy.h,0);near(free.pose.h,1.2);
  free.strokes.forEach((s,i)=>assert.ok(s<low.strokes[i]));
});
