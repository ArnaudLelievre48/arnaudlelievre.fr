/* Local-only Three.js scene and controls. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id), container=$('canvas-container');
  function fail(message) {
    const p=document.createElement('p'); p.className='error-screen'; p.textContent=message; container.appendChild(p);
  }
  if(!window.THREE || !window.DockingModel) { fail('Les fichiers locaux de l’animation sont manquants. Conserver vendor/ et les fichiers docking à côté du HTML.'); return; }
  const M=window.DockingModel,C=M.C;
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0x0b151e);
  const camera=new THREE.PerspectiveCamera(40,1,0.05,100);
  let renderer;
  try { renderer=new THREE.WebGLRenderer({antialias:true}); }
  catch(error) { fail('Le navigateur ne peut pas démarrer WebGL. Activer l’accélération graphique pour afficher l’animation.'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  const controls=new THREE.OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true; controls.minDistance=2; controls.maxDistance=25;
  controls.maxPolarAngle=Math.PI*0.94;
  scene.add(new THREE.HemisphereLight(0xdceeff,0x273647,1.15));
  const key=new THREE.DirectionalLight(0xfff3df,2); key.position.set(2,8,6); scene.add(key);
  const fill=new THREE.DirectionalLight(0x80bcff,1); fill.position.set(-5,3,-5); scene.add(fill);
  const ground=new THREE.GridHelper(24,48,0x27465a,0x172c3b); ground.position.y=-2.7; scene.add(ground);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(24,24),new THREE.MeshBasicMaterial({color:0x185373,transparent:true,opacity:0.09,depthWrite:false,side:THREE.DoubleSide}));
  water.rotation.x=-Math.PI/2; water.position.y=-1.35; scene.add(water);
  const materials={
    steel:new THREE.MeshStandardMaterial({color:0x627e91,metalness:0.65,roughness:0.35}),
    deck:new THREE.MeshStandardMaterial({color:0x7893a4,metalness:0.55,roughness:0.45,transparent:true,opacity:0.38,depthWrite:false}),
    longeron:new THREE.MeshStandardMaterial({color:0x3a5b71,metalness:0.4,roughness:0.42}),
    frame:new THREE.MeshStandardMaterial({color:0xea7a92,metalness:0.55,roughness:0.38}),
    barrel:new THREE.MeshStandardMaterial({color:0x58d5bf,metalness:0.5,roughness:0.28}),
    chrome:new THREE.MeshStandardMaterial({color:0xe0ebef,metalness:0.85,roughness:0.2}),
    joint:new THREE.MeshStandardMaterial({color:0xeff6f7,metalness:0.72,roughness:0.24}),
    fine:new THREE.MeshStandardMaterial({color:0xf1b758,metalness:0.55,roughness:0.32}),
    buoy:new THREE.MeshStandardMaterial({color:0x4b97d3,metalness:0.4,roughness:0.33}),
    box2:new THREE.MeshStandardMaterial({color:0x3374ac,metalness:0.6,roughness:0.32}),
    contact:new THREE.MeshStandardMaterial({color:0x6be4d3,metalness:0.2,roughness:0.3,emissive:0x124738,emissiveIntensity:0.2})
  };
  const solids=[];
  function mesh(geometry,material,parent,name) {
    const o=new THREE.Mesh(geometry,material); o.name=name||''; o.castShadow=true; o.receiveShadow=true; parent.add(o);
    const ghost=material.clone(); ghost.transparent=true; ghost.opacity=0.12; ghost.depthWrite=false;
    solids.push({o,material,ghost}); return o;
  }
  function box(parent,size,pos,mat,name) { const o=mesh(new THREE.BoxGeometry(...size),mat,parent,name); o.position.set(...pos); return o; }
  function cylinder(parent,r1,r2,length,pos,mat,name) { const o=mesh(new THREE.CylinderGeometry(r1,r2,length,32),mat,parent,name); o.position.set(...pos); return o; }
  const up=new THREE.Vector3(0,1,0);
  function beam(parent,a,b,r,mat,name) {
    const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),o=cylinder(parent,r,r,A.distanceTo(B),[0,0,0],mat,name);
    o.position.copy(A).add(B).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(up,B.sub(A).normalize()); return o;
  }
  function outline(o,color=0xa0bbc8) {
    const edge=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry),new THREE.LineBasicMaterial({color,transparent:true,opacity:0.38})); o.add(edge);
  }
  const main=new THREE.Group(); main.name='MAIN_PLATFORM_ASSEMBLY'; scene.add(main);
  const deck=box(main,[7.6,0.18,3.8],[-0.8,3.72,0],materials.deck,'PLATFORM_1'); outline(deck);
  for(const z of [-1.86,1.86]) box(main,[7.6,0.12,0.08],[-0.8,3.63,z],materials.steel);
  const longeron=cylinder(main,0.56,0.56,3.7,[-3.45,2.87,0],materials.longeron,'LONGERON'); longeron.rotation.x=Math.PI/2;
  for(const z of [-1.35,1.35]) {
    beam(main,[-3.85,3.63,z],[-3.83,3.12,z],0.055,materials.steel,'LONGERON_SUPPORTS');
    beam(main,[-3.04,3.63,z],[-3.07,3.12,z],0.055,materials.steel,'LONGERON_SUPPORTS');
    const collar=mesh(new THREE.TorusGeometry(0.575,0.035,10,48),materials.steel,main); collar.position.set(-3.45,2.87,z);
  }
  const frame=new THREE.Group(); frame.name='LOWER_MOVING_FRAME'; scene.add(frame);
  const ring=new THREE.Shape(); ring.absarc(0,0,C.radius,0,2*Math.PI,false);
  const hole=new THREE.Path(); hole.absarc(0,0,C.hole,0,2*Math.PI,true); ring.holes.push(hole);
  const ringGeo=new THREE.ExtrudeGeometry(ring,{depth:C.thickness,bevelEnabled:false,curveSegments:72});
  ringGeo.rotateX(-Math.PI/2); ringGeo.translate(0,-C.thickness/2,0);
  const p2=mesh(ringGeo,materials.frame,frame,'PLATFORM_2'); outline(p2,0xffc7d4);
  for(const r of [C.radius,C.hole]) {
    const rim=mesh(new THREE.TorusGeometry(r,0.025,10,80),materials.frame,frame);
    rim.rotation.x=Math.PI/2; rim.position.y=C.thickness/2;
  }
  // P2 has a fixed load-bearing frame and two moving semicircular collars.
  // Their horizontal cylinders are separate from the three suspension legs.
  const clampParts=[-1,1].map((side,i)=>{
    const collar=new THREE.Group();collar.name=`P2_CLAMP_HALF_${i+1}`;frame.add(collar);
    const shape=new THREE.Shape();
    const start=side===1?-Math.PI/2:Math.PI/2,end=start+Math.PI;
    shape.absarc(0,0,C.clampOuter,start,end,false);
    shape.lineTo(C.buoyRadius*Math.cos(end),C.buoyRadius*Math.sin(end));
    shape.absarc(0,0,C.buoyRadius,end,start,true);shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:0.12,bevelEnabled:false,curveSegments:48});
    geometry.rotateX(-Math.PI/2);geometry.translate(0,-0.06,0);
    const half=mesh(geometry,materials.fine,collar,`P2_JAW_${i+1}`);outline(half,0xffdfad);
    for(const z of [-0.28,0.28]) {
      box(frame,[0.56,0.04,0.05],[side*0.94,0.08,z],materials.steel,'P2_CLAMP_GUIDE');
      box(collar,[0.18,0.06,0.055],[side*0.62,-0.05,z],materials.steel);
    }
    const actuator=new THREE.Group();actuator.name=`CENTERING_CYLINDER_${i+1}`;
    actuator.position.set(side*1.37,C.clampY,0);
    actuator.quaternion.setFromUnitVectors(up,new THREE.Vector3(-side,0,0));frame.add(actuator);
    cylinder(actuator,0.07,0.07,0.32,[0,0.17,0],materials.barrel,`CENTERING_CYLINDER_${i+1}_BODY`);
    cylinder(actuator,0.08,0.08,0.04,[0,0.33,0],materials.steel);
    const rod=cylinder(actuator,0.033,0.033,1,[0,0,0],materials.chrome,`CENTERING_CYLINDER_${i+1}_ROD`);
    return {side,collar,actuator,rod};
  });
  for(const x of [-0.88,0.88]) for(const z of [-0.74,0.74]) {
    box(frame,[0.075,C.platform3Y,0.075],[x,C.platform3Y/2,z],materials.frame,'FRAME_UPRIGHTS');
    box(frame,[0.18,0.045,0.18],[x,0.09,z],materials.steel);
  }
  const p3=box(frame,[2.1,0.14,1.9],[0,C.platform3Y,0],materials.frame,'PLATFORM_3'); outline(p3,0xffc7d4);
  const cylinders=M.anchors.map((a,i)=>{
    cylinder(main,0.12,0.12,0.08,[a.top[0],3.6,a.top[2]],materials.steel);
    const topBall=mesh(new THREE.SphereGeometry(0.095,20,16),materials.joint,scene,`C${i+1}_UP`); topBall.position.set(...a.top);
    const lowBall=mesh(new THREE.SphereGeometry(0.095,20,16),materials.joint,frame,`C${i+1}_LOW`); lowBall.position.set(...a.bottom);
    const g=new THREE.Group(); g.name=`CYLINDER_${i+1}`; scene.add(g);
    cylinder(g,0.087,0.087,2.05,[0,1.1,0],materials.barrel,`CYLINDER_${i+1}_BODY`);
    cylinder(g,0.104,0.104,0.12,[0,2.08,0],materials.steel);
    const rod=cylinder(g,0.043,0.043,1,[0,0,0],materials.chrome,`CYLINDER_${i+1}_ROD`);
    return {g,rod,lowBall};
  });
  cylinder(frame,0.135,0.135,0.26,[0,1.4,0],materials.fine,'FINE_STAGE_SLIDER');
  const fineRod=cylinder(frame,0.04,0.04,1,[0,0,0],materials.chrome,'FINE_Z');
  const rotator=new THREE.Group(); rotator.name='FINE_STAGE_ROTATOR'; frame.add(rotator);
  cylinder(rotator,0.15,0.15,0.08,[0,C.boxHeight+0.04,0],materials.fine,'FINE_RZ');
  const box1=box(rotator,[C.boxWidth,C.boxHeight,C.boxDepth],[0,C.boxHeight/2,0],materials.fine,'BOX_1'); outline(box1,0xffe4ad);
  // Visual azimuth marks only; the document does not specify connector internals.
  box(rotator,[0.08,0.055,0.012],[-0.105,0.10,C.boxDepth/2+0.008],materials.chrome);
  const face1=box(rotator,[C.boxWidth,0.012,C.boxDepth],[0,0.006,0],materials.contact);
  const buoyGroup=new THREE.Group(); buoyGroup.name='BUOY_ASSEMBLY'; scene.add(buoyGroup);
  cylinder(buoyGroup,C.buoyRadius,C.buoyRadius,1.35,[0,-0.225,0],materials.buoy,'BUOY_UPPER_BODY');
  cylinder(buoyGroup,C.buoyRadius,0.22,0.65,[0,-1.225,0],materials.buoy,'BUOY_MAIN_BODY');
  cylinder(buoyGroup,0.22,0.22,0.65,[0,-1.875,0],materials.buoy);
  for(const y of [0.35,-0.8]) cylinder(buoyGroup,0.508,0.508,0.055,[0,y,0],materials.steel);
  const box2=box(buoyGroup,[C.boxWidth,0.2,C.boxDepth],[0,0.55,0],materials.box2,'BOX_2'); outline(box2,0xadcff0);
  box(buoyGroup,[0.08,0.055,0.012],[-0.105,0.55,C.boxDepth/2+0.008],materials.chrome);
  const face2=box(buoyGroup,[C.boxWidth,0.012,C.boxDepth],[0,C.socketY-0.006,0],materials.contact);
  const axisGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-0.85,0),new THREE.Vector3(0,1.7,0)]);
  const axis=new THREE.Line(axisGeo,new THREE.LineDashedMaterial({color:0x7295a8,dashSize:0.09,gapSize:0.06,transparent:true,opacity:0.6})); axis.computeLineDistances(); frame.add(axis);

  const skeleton=new THREE.Group(); skeleton.visible=false; scene.add(skeleton);
  function simpleLine(parent,points,color,dashed=false) {
    const geometry=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));
    const material=dashed?new THREE.LineDashedMaterial({color,dashSize:0.08,gapSize:0.055}):new THREE.LineBasicMaterial({color});
    const line=new THREE.Line(geometry,material); if(dashed) line.computeLineDistances(); parent.add(line); return line;
  }
  const legLines=M.anchors.map(()=>simpleLine(skeleton,[[0,0,0],[0,0,0]],0x6be4d3));
  const skeletonFrame=new THREE.Group(); skeleton.add(skeletonFrame);
  for(const x of [-0.88,0.88]) for(const z of [-0.74,0.74]) simpleLine(skeletonFrame,[[x,0,z],[x,1.6,z]],0xff839c);
  const fineLine=simpleLine(skeletonFrame,[[0,1.6,0],[0,0.94,0]],0xffce7a);
  const captureLines=clampParts.map(()=>simpleLine(skeletonFrame,[[0,0,0],[0,0,0]],0x6be4d3));
  const fineArrow=new THREE.ArrowHelper(new THREE.Vector3(0,-1,0),new THREE.Vector3(0.3,1.4,0),0.45,0xf4bc69,0.09,0.05); skeletonFrame.add(fineArrow);
  const turnPoints=Array.from({length:41},(_,i)=>[0.27*Math.cos(i/40*Math.PI*1.6),1.12,0.27*Math.sin(i/40*Math.PI*1.6)]);
  simpleLine(skeletonFrame,turnPoints,0xf4bc69);
  const arcEnd=turnPoints[40],arcPrev=turnPoints[39];
  skeletonFrame.add(new THREE.ArrowHelper(new THREE.Vector3(...arcEnd).sub(new THREE.Vector3(...arcPrev)).normalize(),new THREE.Vector3(...arcEnd),0.07,0xf4bc69,0.07,0.045));
  const jointNodes=M.anchors.flatMap(a=>[a.top,a.bottom]).map(()=>{
    const node=new THREE.Mesh(new THREE.SphereGeometry(0.075,12,12),new THREE.MeshBasicMaterial({color:0xeafaff})); skeleton.add(node); return node;
  });
  // Mechanical coordinate axes, including positive Y towards the observer in view XZ.
  const origin=new THREE.Vector3(-2.5,-2.3,1.5);
  [[new THREE.Vector3(1,0,0),0xf28b8b],[new THREE.Vector3(0,0,1),0x78d8bf],[up,0x89baff]].forEach(([v,c])=>scene.add(new THREE.ArrowHelper(v,origin,0.5,c,0.08,0.045)));

  const dimensionGroup=new THREE.Group(); dimensionGroup.visible=false; scene.add(dimensionGroup);
  const frameDimensions=new THREE.Group(); frameDimensions.visible=false; frame.add(frameDimensions);
  const buoyDimensions=new THREE.Group(); buoyDimensions.visible=false; buoyGroup.add(buoyDimensions);
  function dimension(parent,a,b) {
    simpleLine(parent,[a,b],0xd6d8b8);
    for(const point of [a,b]) simpleLine(parent,[[point[0]-0.05,point[1]-0.05,point[2]],[point[0]+0.05,point[1]+0.05,point[2]]],0xd6d8b8);
  }
  dimension(dimensionGroup,[2.98,0,-0.2],[2.98,3.5,-0.2]);
  dimension(frameDimensions,[-1.5,-0.17,1.65],[-0.5,-0.17,1.65]);
  dimension(frameDimensions,[0.5,-0.17,1.65],[1.5,-0.17,1.65]);
  dimension(buoyDimensions,[-0.5,-0.55,0.65],[0.5,-0.55,0.65]);

  let schematic=false,showLabels=true,showDimensions=false;
  const labels=[];
  function label(text,parent,point,kind,dimensionOnly=false) {
    const anchor=new THREE.Object3D(); anchor.position.set(...point); parent.add(anchor);
    const el=document.createElement('span'); el.className='tag-bubble'; el.textContent=text; el.dataset.kind=kind||''; $('labels-layer').appendChild(el);
    labels.push({text,anchor,el,dimensionOnly});
  }
  label('PLATFORM_1',main,[-1,3.84,-1.5]);
  label('Longeron · axe Y',main,[-3.45,2.85,1.92]);
  label('PLATFORM_2',frame,[-1.1,0.12,0.8]);
  label('PLATFORM_3',frame,[-0.8,1.71,0.7]);
  label('FINE_Z + FINE_RZ',frame,[0.25,1.35,0],'tool');
  label('BOX_1',rotator,[0.28,0.16,0.2],'tool');
  label('BOX_2',buoyGroup,[0.3,0.55,0.19],'tool');
  label('Bouée · BOX_2 solidaire',buoyGroup,[0,-0.65,0.52]);
  label('P2 · demi-colliers mobiles',clampParts[0].collar,[-0.5,0.1,0.3],'tool');
  label('Vérin de centrage',clampParts[1].actuator,[0.08,0.18,0.1],'tool');
  cylinders.forEach((c,i)=>label(`Vérin ${i+1}${i===2?' · arrière*':''}`,c.g,[0.14,1.45,0],'tool'));
  label('X',scene,origin.clone().add(new THREE.Vector3(0.59,0,0)).toArray());
  label('Y',scene,origin.clone().add(new THREE.Vector3(0,0,0.59)).toArray());
  label('Z',scene,origin.clone().add(new THREE.Vector3(0,0.59,0)).toArray());
  label('≈ 3–4 m*',dimensionGroup,[3.1,1.75,-0.2],null,true);
  label('≈ 1 m',frameDimensions,[-1,-0.17,1.65],null,true);
  label('≈ 1 m',frameDimensions,[1,-0.17,1.65],null,true);
  label('Ø ≈ 1 m',buoyDimensions,[0,-0.55,0.65],null,true);
  const projected=new THREE.Vector3();
  function updateLabels() {
    const width=container.clientWidth,height=container.clientHeight,occupied=[];
    labels.forEach(l=>{
      if((l.dimensionOnly?!showDimensions:!showLabels)) {l.el.hidden=true;return;}
      l.anchor.getWorldPosition(projected); projected.project(camera);
      const x=(projected.x+1)*width/2,y=(1-projected.y)*height/2;
      const w=l.el.offsetWidth||l.text.length*6.5+14,rect={left:x-w/2,right:x+w/2,top:y-25,bottom:y};
      const hidden=projected.z<-1||projected.z>1||rect.left<4||rect.right>width-4||rect.top<165||rect.bottom>height-170||
        occupied.some(r=>rect.left<r.right&&rect.right>r.left&&rect.top<r.bottom&&rect.bottom>r.top);
      l.el.hidden=hidden; if(!hidden) {l.el.style.left=x+'px';l.el.style.top=y+'px';occupied.push(rect);}
    });
  }
  const state={time:0,running:false,manual:false,speed:1,pose:null,strokes:[],fine:null,buoy:null,dock:'OPEN',clamp:0,captureState:'OPEN',metrics:null,message:''};
  const number=(x,d=1)=>(Math.abs(x)<1e-8?0:x).toLocaleString('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d});
  function buildControl(parent,id,name,min,max,unit,cls='') {
    const div=document.createElement('div');div.className='control '+cls;
    div.innerHTML=`<div class="control-label"><label for="slide-${id}">${name}</label><output id="txt-${id}" for="slide-${id}"></output></div><input id="slide-${id}" type="range" min="${min}" max="${max}" step="0.1"><div class="limits"><span>${min} ${unit}</span><span>${max} ${unit}</span></div>`;
    $(parent).appendChild(div);
  }
  ['Vérin 1 · gauche','Vérin 2 · droit incliné','Vérin 3 · arrière (hypothèse)'].forEach((name,i)=>buildControl('actuator-controls','s'+(i+1),name,0,C.strokeMax,'mm'));
  buildControl('fine-controls','fine-z','FINE_Z · descente axiale',0,C.fineMax,'mm','robot');
  buildControl('fine-controls','fine-rz','FINE_RZ · rotation locale',-180,180,'°','robot');
  buildControl('capture-controls','clamp','Fermeture des deux demi-colliers',0,100,'%');
  let cumulative=0;
  M.phases.forEach((p,i)=>{
    const b=document.createElement('button'),start=cumulative;
    b.title=`${i+1}. ${p.name}`; b.setAttribute('aria-label',b.title); b.addEventListener('click',()=>seek(start));
    $('phase-list').appendChild(b); cumulative+=p.duration;
  });
  function setLine(line,a,b) { const attr=line.geometry.attributes.position; attr.setXYZ(0,...a);attr.setXYZ(1,...b);attr.needsUpdate=true;line.geometry.computeBoundingSphere(); }
  function draw() {
    const p=state.pose;
    // R = Rx(pitch) Rz(roll), identical to DockingModel.rotate.
    frame.position.y=p.h; frame.rotation.set(p.pitch,0,p.roll,'XYZ');
    skeletonFrame.position.copy(frame.position); skeletonFrame.quaternion.copy(frame.quaternion);
    rotator.position.y=C.homeFaceY-state.fine.z/C.mm; rotator.rotation.y=state.fine.rz*M.rad;
    const bottom=rotator.position.y+C.boxHeight,rodLength=1.28-bottom;
    fineRod.scale.y=rodLength; fineRod.position.y=(1.28+bottom)/2;
    buoyGroup.position.set(state.buoy.x,state.buoy.h,state.buoy.z);
    const jawGap=C.clampTravel*(1-state.clamp);
    clampParts.forEach((c,i)=>{
      c.collar.position.set(c.side*jawGap,C.clampY,0);
      const end=1.37-C.clampOuter-jawGap;
      c.rod.scale.y=end-0.30;c.rod.position.y=(0.30+end)/2;
      setLine(captureLines[i],[c.side*1.37,C.clampY,0],[c.side*(C.clampOuter+jawGap),C.clampY,0]);
    });
    cylinders.forEach((c,i)=>{
      const a=new THREE.Vector3(...M.anchors[i].top),b=new THREE.Vector3(...M.toWorld(M.anchors[i].bottom,p));
      const length=a.distanceTo(b);
      c.g.position.copy(a); c.g.quaternion.setFromUnitVectors(up,b.clone().sub(a).normalize());
      // Constant barrel; the rod slides inside it and ends exactly at the lower ball.
      c.rod.scale.y=length-1.9; c.rod.position.y=(1.9+length)/2;
      setLine(legLines[i],a.toArray(),b.toArray()); jointNodes[i*2].position.copy(a);jointNodes[i*2+1].position.copy(b);
    });
    setLine(fineLine,[0,C.platform3Y,0],[0,rotator.position.y,0]);
    const locked=state.dock==='LOCKED';
    materials.contact.emissiveIntensity=locked?0.9:0.2;
    scene.updateMatrixWorld(true);
  }
  function updateUI() {
    const tr=M.trajectory(state.time),m=state.metrics,locked=state.dock==='LOCKED';
    $('phase-counter').textContent=`Étape ${String(tr.index+1).padStart(2,'0')} / ${M.phases.length}`;
    $('phase-name').textContent=state.manual?'Exploration manuelle':tr.name;
    $('phase-note').textContent=state.manual?'Régler le bâti et le mécanisme fin. La bouée conserve sa hauteur ; les vérins règlent le niveau de P2/P3.':M.phases[tr.index].note;
    $('mode-label').textContent=state.manual?'MODE MANUEL':'CYCLE ILLUSTRATIF';
    Array.from($('phase-list').children).forEach((b,i)=>{b.className=i===tr.index?'current':i<tr.index?'done':'';b.setAttribute('aria-current',String(i===tr.index));});
    $('timeline').value=state.time; $('time-value').textContent=number(state.time)+' s';
    $('btn-auto-play').textContent=state.running?'Ⅱ Pause':state.time>0&&!state.manual&&state.time<M.duration?'▶ Reprendre':'▶ Lancer le cycle';
    $('val-delta-r').textContent=number(m.radial*C.mm); $('val-delta-z').textContent=number(m.gap*C.mm);
    $('val-angle').textContent=number(m.angle); $('val-key').textContent=number(m.keyAngle);
    $('dock-badge').textContent=locked?'LOCKED · Liaison temporaire':m.contact?'OPEN · Faces en contact':'OPEN · Interfaces libres';
    $('dock-badge').dataset.tone=m.collision?'danger':locked?'ok':'warn';
    const values=[...state.strokes,state.fine.z,state.fine.rz];
    ['s1','s2','s3','fine-z','fine-rz'].forEach((id,i)=>{
      const held=state.clamp>0 && ['s1','s2','s3'].includes(id);
      $('slide-'+id).value=values[i]; $('slide-'+id).disabled=locked||held;
      $('txt-'+id).textContent=number(values[i],id==='fine-rz'?1:0)+(id==='fine-rz'?' °':' mm');
    });
    $('pose-height').textContent=number(state.pose.h*C.mm,0)+' mm';
    $('pose-pitch').textContent=number(state.pose.pitch/M.rad)+'°'; $('pose-roll').textContent=number(state.pose.roll/M.rad)+'°';
    $('closure-error').textContent='Erreur de fermeture : '+number(state.pose.residual*C.mm,6)+' mm';
    $('clearance-value').textContent='Jeu radial conservateur dans P2 : '+number(m.clearance*C.mm,0)+' mm';
    $('slide-clamp').value=state.clamp*100;$('slide-clamp').disabled=locked||state.fine.z>0;
    $('txt-clamp').textContent=number(state.clamp*100,0)+' %';
    $('capture-status').textContent=m.capture.centered?'CENTERED · P2 / P3 / bouée coaxiales':state.clamp>0?(m.capture.state==='OPENING'?'Ouverture de P2':'Fermeture de P2')+' · '+number(state.clamp*100,0)+' % fermé':'OPEN · Bouée libre';
    $('capture-stroke').textContent='Course de chaque vérin de centrage : '+number(state.clamp*C.clampTravel*C.mm,0)+' mm';
    $('btn-clamp').textContent=state.clamp>0?'Ouvrir P2 / libérer la bouée':'Fermer P2 / centrer la bouée';
    $('btn-clamp').disabled=locked||state.fine.z>0||(state.clamp===0&&!m.capture.ready);
    $('btn-level').disabled=locked||state.clamp>0;
    $('btn-lock').disabled=!locked&&(!m.contact||!m.capture.centered);
    $('btn-lock').textContent=locked?'Déverrouiller BOX_1 ↔ BOX_2':'Verrouiller BOX_1 ↔ BOX_2';
    $('safety-message').textContent=state.message||(locked?'Réglages immobilisés pendant la liaison temporaire.':state.clamp>0?'P2 maintient le bâti centré. Remonter BOX_1 avant de rouvrir P2.':showDimensions?'* Hauteur indicative : références de la cote du croquis inconnues.':'');
  }
  function commit() { state.metrics=M.inspect(state.pose,state.fine,state.buoy,state.clamp,state.captureState);draw();updateUI(); }
  function atTime(time) {
    const tr=M.trajectory(time),pose=M.solvePlatform(tr.strokes,tr.pose);
    if(!pose.ok) return pose.reason;
    const m=M.inspect(pose,tr.fine,tr.buoy,tr.clamp,tr.captureState);
    if(m.collision) return m.collision;
    if(tr.dock==='LOCKED'&&(!m.contact||!m.capture.centered)) return 'Les interfaces ne peuvent pas être verrouillées';
    Object.assign(state,{time,pose,strokes:tr.strokes,fine:tr.fine,buoy:tr.buoy,dock:tr.dock,clamp:tr.clamp,captureState:tr.captureState,metrics:m});
    return '';
  }
  function reset() { state.running=false;state.manual=false;state.message='';atTime(0);commit(); }
  function seek(time) {
    state.running=false;state.manual=false;state.message=atTime(Number(time));commit();
  }
  function togglePlay() {
    if(state.running) state.running=false;
    else { if(state.manual||state.time>=M.duration) reset();state.running=true;state.message=''; }
    updateUI();
  }
  function applyManual(target) {
    if(state.dock==='LOCKED') return;
    state.running=false;state.manual=true;state.message='';
    if(state.clamp>0&&target.strokes) {
      state.message='Ouvrir complètement P2 avant de déplacer le bâti.';updateUI();return;
    }
    if(target.fine&&target.fine.z>state.fine.z&&!state.metrics.capture.centered) {
      state.message='Fermer P2 et centrer la bouée avant la descente de BOX_1.';updateUI();return;
    }
    const from={strokes:state.strokes.slice(),fine:{...state.fine}};
    const to={strokes:target.strokes||from.strokes,fine:target.fine||from.fine};
    const delta=Math.max(...from.strokes.map((s,i)=>Math.abs(to.strokes[i]-s)),Math.abs(to.fine.z-from.fine.z),Math.abs(to.fine.rz-from.fine.rz));
    const steps=Math.max(1,Math.ceil(delta));
    for(let n=1;n<=steps;n++) {
      const u=n/steps,blend=(a,b)=>Object.fromEntries(Object.keys(a).map(k=>[k,a[k]+(b[k]-a[k])*u]));
      const strokes=from.strokes.map((s,i)=>s+(to.strokes[i]-s)*u),fine=blend(from.fine,to.fine),buoy=state.buoy;
      const pose=M.solvePlatform(strokes,state.pose);
      if(!pose.ok) {state.message=pose.reason;break;}
      const m=M.inspect(pose,fine,buoy,state.clamp);
      if(m.collision) {state.message='Butée virtuelle : '+m.collision+'.';break;}
      Object.assign(state,{strokes,pose,fine,buoy,metrics:m});
    }
    commit();
  }
  function applyClamp(target) {
    if(state.dock==='LOCKED') return;
    state.running=false;state.manual=true;state.message='';
    if(state.fine.z>0) {state.message='Remonter complètement BOX_1 avant de modifier la fermeture de P2.';updateUI();return;}
    if(target>state.clamp&&!state.metrics.capture.ready) {state.message='Mettre P2 au niveau de la bouée et corriger son assiette avant fermeture.';updateUI();return;}
    const from=state.clamp,origin={...state.buoy},steps=Math.max(1,Math.ceil(Math.abs(target-from)*200));
    for(let n=1;n<=steps;n++) {
      const clamp=from+(target-from)*n/steps;
      // Illustrative floating-buoy recentering as the opposed collars close.
      // P3 remains fixed to the frame; no independent lateral motor is added.
      const factor=target>from?(1-clamp)/(1-from):1;
      const buoy={...origin,x:origin.x*factor,z:origin.z*factor};
      const direction=target>from?'CLOSING':'OPENING';
      const m=M.inspect(state.pose,state.fine,buoy,clamp,direction);
      if(m.collision) {state.message='Butée virtuelle : '+m.collision+'.';break;}
      Object.assign(state,{clamp,buoy,captureState:m.capture.state,metrics:m});
    }
    commit();
  }
  ['s1','s2','s3'].forEach((id,i)=>$('slide-'+id).addEventListener('input',e=>{
    const strokes=state.strokes.slice();strokes[i]=Number(e.target.value);applyManual({strokes});
  }));
  $('slide-fine-z').addEventListener('input',e=>applyManual({fine:{...state.fine,z:Number(e.target.value)}}));
  $('slide-fine-rz').addEventListener('input',e=>applyManual({fine:{...state.fine,rz:Number(e.target.value)}}));
  $('slide-clamp').addEventListener('input',e=>applyClamp(Number(e.target.value)/100));
  $('btn-clamp').addEventListener('click',()=>applyClamp(state.clamp>0?0:1));
  $('btn-level').addEventListener('click',()=>applyManual({strokes:M.strokesForPose({h:state.pose.h,pitch:0,roll:0})}));
  $('btn-lock').addEventListener('click',()=>{
    if(state.dock==='LOCKED') state.dock='OPEN';
    else if(state.metrics.contact&&state.metrics.capture.centered) state.dock='LOCKED';
    else return;
    state.running=false;state.manual=true;state.message='';commit();
  });
  $('btn-auto-play').addEventListener('click',togglePlay); $('btn-reset').addEventListener('click',reset);
  $('timeline').addEventListener('input',e=>seek(e.target.value));
  document.querySelectorAll('[data-speed]').forEach(b=>b.addEventListener('click',()=>{
    state.speed=Number(b.dataset.speed); document.querySelectorAll('[data-speed]').forEach(v=>v.setAttribute('aria-pressed',String(v===b)));
  }));
  $('btn-toggle-mode').addEventListener('click',()=>{
    schematic=!schematic;skeleton.visible=schematic;solids.forEach(s=>s.o.material=schematic?s.ghost:s.material);
    $('btn-toggle-mode').setAttribute('aria-pressed',String(schematic));
  });
  $('btn-labels').addEventListener('click',()=>{showLabels=!showLabels;$('btn-labels').setAttribute('aria-pressed',String(showLabels));});
  $('btn-dimensions').addEventListener('click',()=>{
    showDimensions=!showDimensions;[dimensionGroup,frameDimensions,buoyDimensions].forEach(g=>g.visible=showDimensions);
    $('btn-dimensions').setAttribute('aria-pressed',String(showDimensions));updateUI();
  });
  const views={perspective:{pos:[9.5,5,12.8],target:[-0.65,0.35,0]},front:{pos:[-0.65,0.2,15.5],target:[-0.65,0.2,0]},top:{pos:[-0.5,16,0.001],target:[-0.5,0.7,0]},centering:{pos:[3.4,2.3,4.2],target:[0,0.15,0]},docking:{pos:[2.4,2.1,3.2],target:[0,0.95,0]}};
  function setView(name) {
    const v=views[name];camera.position.set(...v.pos);controls.target.set(...v.target);controls.update();
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));
  }
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  const dialog=$('model-dialog');
  document.querySelectorAll('[data-open-model]').forEach(b=>b.addEventListener('click',()=>dialog.showModal()));
  $('close-model').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
  document.addEventListener('keydown',e=>{if(e.code==='Space'&&!dialog.open&&!e.target.matches('input,button,textarea,select,a')){e.preventDefault();togglePlay();}});
  function resize() {
    const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;
    // Keep the whole mechanism legible when the viewport becomes narrow.
    camera.fov=w<600?53:40;camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container); resize();setView('perspective');reset();
  const clock=new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);const delta=Math.min(clock.getDelta(),0.1);
    if(state.running) {
      const next=Math.min(M.duration,state.time+delta*state.speed),error=atTime(next);
      if(error){state.message=error;state.running=false;}
      if(next>=M.duration)state.running=false;
      commit();
    }
    controls.update();scene.updateMatrixWorld(true);updateLabels();renderer.render(scene,camera);
  }
  window.dockingDebug={snapshot:()=>{
    const tcp=rotator.localToWorld(new THREE.Vector3(0,0,0));
    const sceneAxis=new THREE.Vector3(0,1,0).transformDirection(rotator.matrixWorld);
    const sceneX=new THREE.Vector3(1,0,0).transformDirection(rotator.matrixWorld);
    const receiver=buoyGroup.localToWorld(new THREE.Vector3(0,C.socketY,0));
    return JSON.parse(JSON.stringify({...state,schematic,sceneTCP:tcp.toArray(),sceneAxis:sceneAxis.toArray(),sceneX:sceneX.toArray(),sceneReceiver:receiver.toArray(),
      sceneAnchors:cylinders.map(c=>c.lowBall.getWorldPosition(new THREE.Vector3()).toArray()),
      sceneClampCenters:clampParts.map(c=>c.collar.getWorldPosition(new THREE.Vector3()).toArray()),
      centeringCylinderCount:clampParts.length,
      members:['PLATFORM_1','LONGERON','PLATFORM_2','PLATFORM_3','FRAME_UPRIGHTS','BOX_1','BOX_2','BUOY_ASSEMBLY'],cylinderCount:cylinders.length}));
  }};
  animate();
})();
