// Run the actual scene controller with real Three.js geometry and a minimal DOM.
// WebGL drawing and browser layout still require browser_smoke.py.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const Three=require('../vendor/three.min.js');
const M=require('../docking-model.js');
const root=path.resolve(__dirname,'..');
const near=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);

function loadScene() {
  const ids=new Map(),views=[],speeds=[],openButtons=[];
  class Element {
    constructor(id='') {this.id=id;this.children=[];this.listeners={};this.dataset={};this.style={};this.attrs={};this.clientWidth=1090;this.clientHeight=923;this.value=0;this.open=false;this.className='';}
    set innerHTML(html) {for(const match of html.matchAll(/id="([^"]+)"/g)) ids.set(match[1],new Element(match[1]));}
    get offsetWidth(){return (this.textContent||'').length*6.5+14;}
    appendChild(el){this.children.push(el);}
    setAttribute(key,value){this.attrs[key]=value;}
    addEventListener(type,cb){(this.listeners[type]||=([])).push(cb);}
    fire(type){for(const cb of this.listeners[type]||[])cb({target:this,clientX:0,clientY:0});}
    getBoundingClientRect(){return {left:0,right:1000,top:0,bottom:800};}
    showModal(){this.open=true;}
    close(){this.open=false;}
    matches(){return false;}
  }
  const html=fs.readFileSync(path.join(root,'sch_ma_cin_matique_3d_interactif.html'),'utf8');
  for(const match of html.matchAll(/id="([^"]+)"/g))ids.set(match[1],new Element(match[1]));
  for(const name of ['perspective','front','top','centering','docking']) {const el=new Element();el.dataset.view=name;views.push(el);}
  for(const speed of ['0.5','1','2']) {const el=new Element();el.dataset.speed=speed;speeds.push(el);}
  openButtons.push(new Element(),new Element());
  const document={getElementById:id=>ids.get(id),createElement:()=>new Element(),
    querySelectorAll:s=>s==='[data-view]'?views:s==='[data-speed]'?speeds:openButtons,addEventListener:()=>{}};
  let frameCallback;
  const THREE={...Three,WebGLRenderer:class {constructor(){this.domElement=new Element();this.shadowMap={};}setPixelRatio(){}setSize(){}render(){}},
    OrbitControls:class {constructor(camera){this.camera=camera;this.target=new Three.Vector3();}update(){this.camera.lookAt(this.target);}},
    Clock:class {getDelta(){return 0.05;}}};
  const window={THREE,DockingModel:M,devicePixelRatio:1};
  const context={window,THREE,document,ResizeObserver:class {observe(){}},requestAnimationFrame:cb=>{frameCallback=cb;}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'docking-scene.js'),'utf8'),context,{filename:'docking-scene.js'});
  const snapshot=()=>window.dockingDebug.snapshot();
  const seek=t=>{const el=ids.get('timeline');el.value=t;el.fire('input');};
  const slide=(id,v)=>{const el=ids.get('slide-'+id);el.value=v;el.fire('input');};
  return {snapshot,seek,slide,ids,views,openButtons,tick:()=>frameCallback()};
}
function geometryMatches(s) {
  s.sceneTCP.forEach((v,i)=>near(v,s.metrics.tcp[i]));
  s.sceneAxis.forEach((v,i)=>near(v,s.metrics.axis[i]));
  s.sceneX.forEach((v,i)=>near(v,s.metrics.xAxis[i]));
  s.sceneReceiver.forEach((v,i)=>near(v,s.metrics.receiver[i]));
  s.sceneClampCenters.forEach((a,i)=>a.forEach((v,k)=>near(v,M.toWorld([(i===0?-1:1)*M.C.clampTravel*(1-s.clamp),M.C.clampY,0],s.pose)[k])));
  s.sceneAnchors.forEach((a,i)=>a.forEach((v,k)=>near(v,M.toWorld(M.anchors[i].bottom,s.pose)[k])));
}

test('la scène réelle concorde avec les calculs, sur le cycle et les poses manuelles',()=>{
  const app=loadScene();
  for(let t=0;t<=M.duration;t+=0.1) {app.seek(t);const s=app.snapshot();geometryMatches(s);assert.equal(s.metrics.collision,'');}
  app.seek(0);app.slide('s1',150);let s=app.snapshot();
  assert.ok(s.manual);assert.ok(Math.abs(s.pose.roll)>0.001);geometryMatches(s);
  app.ids.get('btn-level').fire('click');s=app.snapshot();near(s.pose.pitch,0);near(s.pose.roll,0);geometryMatches(s);
  assert.equal(s.cylinderCount,3);
});

test('verrouillage temporaire : commandes figées, puis bouée et BOX_1 indépendantes',()=>{
  const app=loadScene();app.seek(22);let s=app.snapshot();
  assert.equal(s.dock,'LOCKED');assert.ok(s.metrics.contact);
  for(const id of ['s1','s2','s3','fine-z','fine-rz','clamp'])assert.ok(app.ids.get('slide-'+id).disabled);
  const before=s.sceneTCP;app.slide('fine-z',0);assert.deepEqual(app.snapshot().sceneTCP,before);
  app.ids.get('btn-lock').fire('click');assert.equal(app.snapshot().dock,'OPEN');
  app.slide('fine-z',0);app.ids.get('btn-clamp').fire('click');s=app.snapshot();
  assert.equal(s.dock,'OPEN');assert.ok(!s.metrics.contact);near(s.sceneReceiver[1],0.65);geometryMatches(s);
  app.seek(21);app.ids.get('btn-lock').fire('click');app.ids.get('btn-lock').fire('click');assert.equal(app.snapshot().dock,'LOCKED');
});

test('butées de contact, pause, fin du cycle, vues, schéma et dialogue',()=>{
  const app=loadScene();app.seek(17);app.slide('fine-z',400);
  let s=app.snapshot();assert.equal(s.metrics.collision,'');assert.ok(s.fine.z<400);assert.match(s.message,/Butée/);
  app.seek(0);app.ids.get('btn-auto-play').fire('click');app.tick();
  assert.ok(app.snapshot().time>0);app.ids.get('btn-auto-play').fire('click');const t=app.snapshot().time;app.tick();near(app.snapshot().time,t);
  app.seek(M.duration-0.01);app.ids.get('btn-auto-play').fire('click');app.tick();assert.equal(app.snapshot().time,M.duration);assert.equal(app.snapshot().running,false);
  app.ids.get('btn-toggle-mode').fire('click');assert.equal(app.snapshot().schematic,true);
  app.ids.get('btn-dimensions').fire('click');app.tick();
  for(const view of app.views){view.fire('click');app.tick();}
  app.openButtons[0].fire('click');assert.ok(app.ids.get('model-dialog').open);
  app.ids.get('close-model').fire('click');assert.equal(app.ids.get('model-dialog').open,false);
  app.ids.get('btn-reset').fire('click');assert.equal(app.snapshot().time,0);assert.equal(app.snapshot().manual,false);
});


test('P2 ferme et centre avant le docking ; libération seulement après remontée de BOX_1',()=>{
  const app=loadScene();app.ids.get('btn-clamp').fire('click');
  assert.equal(app.snapshot().clamp,0);assert.match(app.snapshot().message,/niveau/);
  app.slide('fine-z',100);assert.equal(app.snapshot().fine.z,0);assert.match(app.snapshot().message,/Fermer P2/);
  app.seek(11);app.slide('clamp',50);let s=app.snapshot();
  near(s.clamp,0.5);near(s.buoy.x,0.04);geometryMatches(s);
  assert.equal(s.centeringCylinderCount,2);
  const h=s.pose.h;app.slide('s1',400);near(app.snapshot().pose.h,h);
  app.slide('clamp',100);s=app.snapshot();assert.ok(s.metrics.capture.centered);near(s.buoy.x,0);geometryMatches(s);
  app.slide('fine-z',100);assert.equal(app.snapshot().fine.z,100);
  app.ids.get('btn-clamp').fire('click');assert.equal(app.snapshot().clamp,1);assert.match(app.snapshot().message,/Remonter/);
  app.slide('fine-z',0);app.ids.get('btn-clamp').fire('click');assert.equal(app.snapshot().clamp,0);
  app.seek(29);assert.equal(app.snapshot().metrics.capture.state,'OPENING');
  app.seek(30);
  near(app.snapshot().buoy.h,0);
});


test('descente visible du bâti : altitude de BOX_2 constante, trois tiges allongées',()=>{
  const app=loadScene();app.seek(2);const high=app.snapshot();
  app.seek(5);const middle=app.snapshot();app.seek(11);const low=app.snapshot();
  for(const s of [high,middle,low]) {near(s.sceneReceiver[1],0.65);geometryMatches(s);}
  assert.ok(high.pose.h>middle.pose.h&&middle.pose.h>low.pose.h);
  high.sceneAnchors.forEach((a,i)=>{
    assert.ok(low.sceneAnchors[i][1]<a[1]);
    const length=p=>Math.hypot(...p.map((v,k)=>v-M.anchors[i].top[k]));
    assert.ok(length(low.sceneAnchors[i])-length(a)>1);
  });
});
