const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../docking-model.js');
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const level={h:0,pitch:0,roll:0};
const at=(tcp,pose=level,context={})=>{const ik=M.inverse(tcp,pose);assert.ok(ik.ok,ik.reason);return M.inspect(ik.joints,pose,context);};

test('les trois branches spatiales ferment pour les poses et les courses admissibles',()=>{
  for(const h of [0,.3,.62])for(const pitch of [-.06,0,.06])for(const roll of [-.05,0,.05]){
    const expected={h,pitch,roll},strokes=M.strokesForPose(expected),pose=M.solvePlatform(strokes);
    assert.ok(pose.ok);['h','pitch','roll'].forEach(k=>near(pose[k],expected[k]));
    M.lengths(pose).forEach((l,i)=>near(l,M.minLengths[i]+strokes[i]/1000));
  }
  for(const s1 of [0,550,1100])for(const s2 of [0,550,1100])for(const s3 of [0,550,1100])assert.ok(M.solvePlatform([s1,s2,s3]).ok);
  const [a,b,c]=M.anchors.map(a=>a.top);
  assert.ok(Math.abs((b[0]-a[0])*(c[2]-a[2])-(c[0]-a[0])*(b[2]-a[2]))>1);
  assert.equal(M.solvePlatform([-1,0,0]).ok,false);
  assert.equal(M.solvePlatform([0,1101,0]).ok,false);
});

test('le bras possède exactement trois pivots plans et une rotation terminale axiale',()=>{
  for(const pose of [level,{h:.4,pitch:.06,roll:-.04}])for(const local of [[.65,1.35,0],[0,.8,0],[0,.6,0]]){
    const tcp=M.toWorld(local,pose),ik=M.inverse(tcp,pose,40);assert.ok(ik.ok);
    const f=M.forward(ik.joints,pose);f.tcp.forEach((x,i)=>near(x,tcp[i]));
    const turned=M.forward([...ik.joints.slice(0,3),-70],pose);
    turned.tcp.forEach((x,i)=>near(x,f.tcp[i]));turned.axis.forEach((x,i)=>near(x,f.axis[i]));
    assert.ok(Math.hypot(...turned.xAxis.map((x,i)=>x-f.xAxis[i]))>1);
    const tilted=M.forward([ik.joints[0],ik.joints[1],ik.joints[2]+15,ik.joints[3]],pose);
    assert.ok(Math.hypot(...tilted.axis.map((x,i)=>x-f.axis[i]))>.2);
  }
  assert.equal(M.inverse([0,.8,.1],level).ok,false,'pas de tourelle pour compenser Y');
  assert.equal(M.inverse([10,0,0],level).ok,false);
});

test('le cycle est continu, accessible, sans interférence modélisée et respecte les deux captures',()=>{
  let previous,seenCapture=false,seenContact=false,seenLock=false;
  for(let tick=0;tick<=1700;tick++){
    const t=tick/50,tr=M.trajectory(t);assert.ok(tr.ok,`t=${t}`);
    const solved=M.solvePlatform(tr.strokes);assert.ok(solved.ok);
    const m=M.inspect(tr.joints,tr.pose,tr);assert.equal(m.collision,'',`t=${t}: ${m.collision}`);
    m.tcp.forEach((x,i)=>near(x,tr.tcp[i]));
    if(previous){
      assert.ok(Math.hypot(...m.tcp.map((v,i)=>v-previous.metrics.tcp[i]))<.016,`TCP discontinu à ${t}`);
      assert.ok(Math.abs(tr.clampAmount-previous.tr.clampAmount)<.015);
      tr.joints.forEach((x,i)=>assert.ok(Math.abs(x-previous.tr.joints[i])<2,`A${i+1} discontinu à ${t}`));
    }
    if(tr.index>=4&&tr.index<=8){assert.ok(m.captured);seenCapture=true;}
    if(m.connected){assert.ok(m.captured&&m.contact);assert.equal(tr.index,7);seenLock=true;}
    if(m.contact&&!m.connected)seenContact=true;
    previous={tr,metrics:m};
  }
  assert.ok(seenCapture&&seenContact&&seenLock);
  assert.equal(M.trajectory(0).clampAmount,0);
  const last=M.trajectory(M.duration),m=M.inspect(last.joints,last.pose,last);
  assert.equal(m.captureState,'FREE');assert.equal(m.dockState,'OPEN');
});

test('le contact et le verrouillage exigent centrage, inclinaison et orientation axiale',()=>{
  const dock=M.inverse([0,M.C.socketY,0],level).joints;
  const unlocked=M.inspect(dock,level);assert.ok(unlocked.contact);assert.equal(unlocked.connected,false);
  assert.equal(unlocked.dockState,'CONTACT');
  assert.ok(M.inspect(dock,level,{clampAmount:1,lockRequested:true}).connected);
  assert.equal(M.inspect(dock,level,{lockRequested:true}).connected,false);
  assert.equal(M.inspect([...dock.slice(0,3),12],level,{clampAmount:1,lockRequested:true}).connected,false);
  assert.equal(at([0,M.C.socketY+.01,0]).contact,false);
  assert.match(at([0,M.C.socketY-.1,0]).collision,/butée/);
  assert.match(at([.04,M.C.socketY-.01,0]).collision,/contact|butée/);
  assert.match(M.inspect(dock,{h:.10,pitch:0,roll:0},{clampAmount:1}).collision,/Capture engagée/);
});

test('le cadre garde une ouverture et les collisions de la maquette arrêtent les interférences',()=>{
  assert.ok(M.C.hole>M.C.neckRadius);
  assert.equal(M.C.frameHalfX-M.C.neckRadius,1);
  assert.match(at([-.90,.02,0]).collision,/cadre/);
  assert.match(at([0,.20,0]).collision,/bouée|butée/);
  const pose={h:1.2,pitch:0,roll:0};
  assert.match(M.inspect([0,0,0,0],pose).collision,/supérieure/);
  near(M.jawPositions(1)[0],-.5);near(M.jawPositions(1)[1],.5);
});
