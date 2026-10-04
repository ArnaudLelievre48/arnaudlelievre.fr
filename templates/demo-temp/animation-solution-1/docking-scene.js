/* Interactive Three.js view. All kinematic values come from DockingModel. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const container=$('canvas-container'), labelsLayer=$('labels-layer');
  function fail(message) {container.insertAdjacentHTML('beforeend','<div class="error-screen">'+message+'</div>');}
  if(!window.THREE||!window.DockingModel) {fail('Conserver les fichiers JavaScript et le dossier vendor à côté du HTML.');return;}
  const M=window.DockingModel,C=M.C,deg=180/Math.PI;
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0x0b1218);
  const camera=new THREE.PerspectiveCamera(42,1,0.1,100);
  let renderer;
  try {renderer=new THREE.WebGLRenderer({antialias:true});} catch(error) {fail('Le rendu nécessite WebGL. Activer l’accélération graphique puis recharger la page.');throw error;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.25;
  renderer.domElement.setAttribute('aria-label','Plateforme, trois vérins, cadre de capture, bras articulé et bouée');
  container.appendChild(renderer.domElement);
  const controls=new THREE.OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.minDistance=4;controls.maxDistance=22;
  controls.target.set(0,1.25,0);camera.position.set(7.4,5.5,9.2);
  scene.add(new THREE.HemisphereLight(0xe4f5ff,0x263d46,1.1));
  const sun=new THREE.DirectionalLight(0xffffff,1.4);sun.position.set(3,9,5);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-5,right:5,top:5,bottom:-5});sun.shadow.bias=-0.0002;scene.add(sun);
  const fill=new THREE.DirectionalLight(0x62c8e8,.65);fill.position.set(-5,3,-4);scene.add(fill);
  function material(color,metalness=.4,roughness=.35) {return new THREE.MeshStandardMaterial({color,metalness,roughness});}
  const mat={steel:material(0x9aafbd,.75),cylinder:material(0x287e81,.55),chrome:material(0xc8e4ec,.95,.15),
    frame:material(0xd75c72,.35),arm:material(0xe5ac54,.55),joint:material(0x405461,.8),
    buoy:material(0xeaa234,.25),neck:material(0xf5bd52,.2),box:material(0x33434f,.65),
    socket:material(0x385f68,.5),pad:material(0x243c46,.1),water:material(0x122e3c,.6,.2)};
  const solids=[];
  function mesh(parent,geometry,material,position=[0,0,0]) {
    const o=new THREE.Mesh(geometry,material);o.position.fromArray(position);o.castShadow=true;o.receiveShadow=true;parent.add(o);
    solids.push({o,material});return o;
  }
  function box(parent,size,position,material) {return mesh(parent,new THREE.BoxGeometry(...size),material,position);}
  function tube(parent,radius,length,position,material) {return mesh(parent,new THREE.CylinderGeometry(radius,radius,length,24),material,position);}
  const v1=new THREE.Vector3(),v2=new THREE.Vector3(),qy=new THREE.Vector3(0,1,0);
  function link(mesh,a,b) {v1.fromArray(a);v2.fromArray(b);mesh.position.copy(v1).add(v2).multiplyScalar(.5);mesh.scale.y=v1.distanceTo(v2);mesh.quaternion.setFromUnitVectors(qy,v2.sub(v1).normalize());}
  function beam(parent,a,b,radius,material) {const o=tube(parent,radius,1,[0,0,0],material);link(o,a,b);return o;}
  function node(parent,position,radius=.09) {return mesh(parent,new THREE.SphereGeometry(radius,20,14),mat.joint,position);}
  const fixed=new THREE.Group();fixed.name='MAIN_PLATFORM_ASSEMBLY';scene.add(fixed);
  const platform1=box(fixed,[5,.16,2.7],[0,C.topY+.12,0],mat.steel);
  // Thin deck and distinct rails maintain visibility of the suspended mechanism.
  for(const z of [-1.31,1.31]) box(fixed,[5,.10,.08],[0,C.topY+.25,z],mat.joint);
  const longeron=tube(fixed,.27,2.2,[-1.8,3.2,0],mat.steel);longeron.rotation.x=Math.PI/2;
  for(const z of [-.8,0,.8]) {
    beam(fixed,[-2.04,C.topY,z],[-1.98,3.39,z],.035,mat.joint);
    beam(fixed,[-1.56,C.topY,z],[-1.62,3.39,z],.035,mat.joint);
  }
  const platform=new THREE.Group();platform.name='PLATFORM_2';scene.add(platform);
  for(const b of M.frameBoxes) box(platform,b.slice(3).map(v=>v*2),b.slice(0,3),mat.frame);
  const jawGroups=[-1,1].map(side=> {
    const g=new THREE.Group();platform.add(g);
    box(g,[.1,.23,.28],[side*.05,0,0],mat.pad);
    box(g,[.22,.065,.065],[side*.18,0,0],mat.chrome);
    box(platform,[.36,.055,.08],[side*.98,.10,0],mat.joint);
    return g;
  });
  const arrowMat=new THREE.LineBasicMaterial({color:0x6be4d3});
  for(const side of [-1,1]) {
    const arrow=new THREE.ArrowHelper(new THREE.Vector3(-side,0,0),new THREE.Vector3(side*.95,.20,0),.28,0x6be4d3,.07,.045);platform.add(arrow);
  }
  const buoy=new THREE.Group();buoy.name='BUOY_ASSEMBLY';scene.add(buoy);
  mesh(buoy,new THREE.CylinderGeometry(.50,.95,.65,48),mat.buoy,[0,-1.325,0]);
  tube(buoy,.95,.35,[0,-1.825,0],mat.buoy);
  tube(buoy,C.neckRadius,C.neckTop-C.neckBottom,[0,(C.neckTop+C.neckBottom)/2,0],mat.neck);
  for(const y of [-.90,.29]) tube(buoy,.511,.06,[0,y,0],mat.joint);
  box(buoy,[.56,C.socketY-C.neckTop,.46],[0,(C.socketY+C.neckTop)/2,0],mat.box);
  const socket=box(buoy,[.50,.015,.40],[0,C.socketY-.0075,0],mat.socket);
  // Simple interface marks, without inventing connector internals.
  box(buoy,[.045,.018,.10],[.20,C.socketY+.001,-.12],mat.arm);
  const root=new THREE.Group();root.position.fromArray(M.base);platform.add(root);
  tube(platform,.09,C.shoulderY,[M.base[0],C.shoulderY/2,0],mat.joint);
  box(platform,[.27,.06,.27],[M.base[0],.10,0],mat.steel);
  function pivot(group) {const p=tube(group,.10,.21,[0,0,0],mat.joint);p.rotation.x=Math.PI/2;return p;}
  pivot(root);box(root,[.12,C.l1,.12],[0,C.l1/2,0],mat.arm);
  const elbow=new THREE.Group();elbow.position.y=C.l1;root.add(elbow);
  pivot(elbow);box(elbow,[.10,C.l2,.10],[0,C.l2/2,0],mat.arm);
  const wrist=new THREE.Group();wrist.position.y=C.l2;elbow.add(wrist);pivot(wrist);
  const terminalLength=C.toolDrop-C.boxHeight;
  tube(wrist,.045,terminalLength,[0,-terminalLength/2,0],mat.chrome);
  const rotor=new THREE.Group();rotor.position.y=-terminalLength;wrist.add(rotor);
  tube(rotor,.095,.08,[0,.04,0],mat.arm);
  const tool=new THREE.Group();tool.name='BOX_1_TCP';tool.position.y=-C.boxHeight;rotor.add(tool);
  box(tool,[C.boxHalfX*2,C.boxHeight,C.boxHalfZ*2],[0,C.boxHeight/2,0],mat.box);
  box(tool,[.045,.03,.10],[.20,.045,-.12],mat.arm);
  const toolFace=box(tool,[.50,.015,.40],[0,.0075,0],mat.socket);
  // A4 arrow rotates with the terminal, in a plane normal to the local wrist axis.
  const arcPoints=Array.from({length:35},(_,i)=>{const a=i/34*Math.PI*1.65;return new THREE.Vector3(.17*Math.cos(a),.06,.17*Math.sin(a));});
  rotor.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPoints),arrowMat));
  const cylinders=M.anchors.map((a,i)=> {
    const body=tube(scene,.085,2.30,[0,0,0],mat.cylinder);
    const rod=tube(scene,.04,1,[0,0,0],mat.chrome);
    const up=node(scene,a.top),low=node(scene,a.bottom);
    return {body,rod,up,low};
  });
  const water=mesh(scene,new THREE.PlaneGeometry(18,18),mat.water,[0,-1.45,0]);water.rotation.x=-Math.PI/2;water.castShadow=false;
  mat.water.transparent=true;mat.water.opacity=.35;
  const grid=new THREE.GridHelper(18,36,0x355665,0x1b3340);grid.position.y=-1.46;scene.add(grid);
  const axes=new THREE.Group();scene.add(axes);
  const origin=new THREE.Vector3(-2.8,-1.44,1.6);
  [[1,0,0],[0,0,-1],[0,1,0]].forEach((direction,i)=>axes.add(new THREE.ArrowHelper(new THREE.Vector3(...direction),origin,.50,[0xfb7185,0x6be4d3,0xf4bc69][i],.07,.035)));
  const skeleton=new THREE.Group();skeleton.visible=false;scene.add(skeleton);
  const lineMat=new THREE.MeshBasicMaterial({color:0x6be4d3,depthTest:false});
  const skeletonLinks=Array.from({length:6},()=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,1,8),lineMat);o.renderOrder=5;skeleton.add(o);return o;});
  const errorLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineDashedMaterial({color:0x6be4d3,dashSize:.06,gapSize:.03}));scene.add(errorLine);
  const dimensions=new THREE.Group();scene.add(dimensions);
  function dimension(a,b) {
    dimensions.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]),new THREE.LineBasicMaterial({color:0x829aa9})));
    for(const p of [a,b]) dimensions.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(p[0],p[1]-.06,p[2]),new THREE.Vector3(p[0],p[1]+.06,p[2])]),arrowMat));
  }
  dimension([-2.5,C.topY+.44,1.42],[2.5,C.topY+.44,1.42]);
  dimension([-1.5,-.22,1.28],[-.5,-.22,1.28]);dimension([.5,-.22,1.28],[1.5,-.22,1.28]);
  dimension([-2.62,0,-1.1],[-2.62,C.topY,-1.1]);
  const labelData=[
    {text:'PLATFORM_1 · 5 m',target:platform1,offset:[0,.40,0]},
    {text:'LONGERON',target:longeron,offset:[0,0,.36]},
    {text:'PLATFORM_2 · CADRE',target:platform,offset:[-1.12,.16,.85]},
    {text:'COL · Ø 1 m',target:buoy,offset:[-.2,-.2,.53]},
    {text:'BOX_2 · BOUÉE',target:buoy,offset:[-.40,C.socketY+.06,.30],kind:'tool'},
    {text:'BOX_1',target:tool,offset:[.55,.35,.22],kind:'tool'},
    {text:'A1',target:root,offset:[0,.15,0]},{text:'A2',target:elbow,offset:[0,.15,0]},
    {text:'A3',target:wrist,offset:[0,.15,0]},{text:'A4 ↻',target:rotor,offset:[.18,.08,0]},
    ...cylinders.map((c,i)=>({text:'VÉRIN '+(i+1),target:c.body,offset:[.15,0,0]})),
    {text:'≈ 1 m',position:[-1,-.22,1.28]},{text:'≈ 1 m',position:[1,-.22,1.28]},
    {text:'3–4 m · nominal',position:[-2.62,1.6,-1.1]},
    {text:'X',position:[-2.23,-1.40,1.6]},{text:'Y',position:[-2.8,-1.40,1.02]},{text:'Z',position:[-2.8,-.85,1.6]}
  ];
  labelData.forEach(l=>{l.element=document.createElement('div');l.element.className='tag-bubble';l.element.textContent=l.text;l.element.dataset.kind=l.kind||'';labelsLayer.appendChild(l.element);});
  let running=false,showLabels=true,schematic=false;
  const state={time:0,speed:1,manual:false,pose:null,strokes:[],joints:[],buoy:{x:0,z:0},clampAmount:0,lockRequested:false,metrics:null};
  const number=(x,digits=1)=>(Math.abs(x)<1e-7?0:x).toLocaleString('fr-FR',{minimumFractionDigits:digits,maximumFractionDigits:digits});
  function buildControls(id,names,prefix,limits,step) {
    $(id).innerHTML=names.map((name,i)=>'<div class="control '+(prefix==='j'?'robot':'')+'"><div class="control-label"><label for="slide-'+prefix+(i+1)+'">'+name+'</label><output id="txt-'+prefix+(i+1)+'"></output></div><input type="range" id="slide-'+prefix+(i+1)+'" min="'+limits[i][0]+'" max="'+limits[i][1]+'" step="'+step+'"><div class="limits"><span>'+limits[i][0]+'</span><span>'+limits[i][1]+(prefix==='j'?' °':' mm · démo')+'</span></div></div>').join('');
  }
  buildControls('actuator-controls',['Vérin 1 · gauche','Vérin 2 · droite','Vérin 3 · arrière'],'s',Array(3).fill([0,C.strokeMax]),1);
  buildControls('joint-controls',['A1 · épaule','A2 · coude','A3 · inclinaison terminale','A4 · rotation axiale'],'j',M.jointLimits,.1);
  let start=0;
  M.phases.forEach((phase,i)=>{const b=document.createElement('button'),t=start;b.title=phase.name;b.setAttribute('aria-label','Aller à l’étape '+(i+1)+' : '+phase.name);b.addEventListener('click',()=>seek(t));$('phase-list').appendChild(b);start+=phase.duration;});
  function draw() {
    const p=state.pose,m=state.metrics;
    platform.position.set(0,p.h,0);platform.rotation.set(p.pitch,0,p.roll);
    buoy.position.set(state.buoy.x,0,state.buoy.z);
    root.rotation.z=state.joints[0]/deg;elbow.rotation.z=state.joints[1]/deg;wrist.rotation.z=state.joints[2]/deg;rotor.rotation.y=state.joints[3]/deg;
    jawGroups.forEach((g,i)=>g.position.set(m.jawFaces[i],0,0));
    cylinders.forEach((c,i)=> {
      const top=M.anchors[i].top,low=M.toWorld(M.anchors[i].bottom,p);
      const delta=low.map((v,k)=>v-top[k]),length=Math.hypot(...delta),bodyEnd=top.map((v,k)=>v+delta[k]*2.30/length);
      link(c.body,top,bodyEnd);c.body.scale.y/=2.30;
      link(c.rod,bodyEnd,low);c.low.position.fromArray(low);
      link(skeletonLinks[i],top,low);
    });
    link(skeletonLinks[3],m.shoulder,m.elbow);link(skeletonLinks[4],m.elbow,m.wrist);link(skeletonLinks[5],m.wrist,m.tcp);
    const pos=errorLine.geometry.attributes.position;pos.setXYZ(0,...m.tcp);pos.setXYZ(1,...m.target);pos.needsUpdate=true;
    errorLine.geometry.computeBoundingSphere();errorLine.computeLineDistances();
    mat.socket.color.setHex(m.connected?0x6be4d3:m.contact?0x62aba2:0x385f68);
    mat.socket.emissive.setHex(m.connected?0x164d42:0);
    scene.updateMatrixWorld(true);
  }
  function updateUI() {
    const m=state.metrics,tr=M.trajectory(state.time);
    $('val-delta-r').textContent=number(m.radial*C.mm);$('val-delta-z').textContent=number(m.gap*C.mm);
    $('val-angle').textContent=number(m.angle);$('key-angle').textContent='Azimut : '+number(m.keyAngle)+'° / 1°';
    $('val-insertion').textContent=number(m.insertion*100,0);$('dock-progress-bar').style.width=(m.insertion*100)+'%';
    $('capture-badge').textContent=m.captured?'● Capture engagée':state.clampAmount>0?'◐ Centrage':'○ Bouée libre';
    $('dock-badge').textContent=m.collision?'Interférence':m.connected?'● Docking verrouillé':m.contact?'● Contact':m.aligned?'Axe aligné':'○ Docking ouvert';
    $('dock-badge').dataset.tone=m.collision?'danger':m.aligned?'':'warn';
    $('pose-height').textContent=number(state.pose.h,3)+' m';$('pose-pitch').textContent=number(state.pose.pitch*deg)+'°';$('pose-roll').textContent=number(-state.pose.roll*deg)+'°';
    const closure=Math.max(...M.lengths(state.pose).map((l,i)=>Math.abs(l-M.minLengths[i]-state.strokes[i]/C.mm)));
    $('closure-error').textContent='Fermeture : '+(closure*C.mm).toExponential(1)+' mm · α projetés : '+m.inclination.map(x=>number(x)+'°').join(' / ');
    state.strokes.forEach((s,i)=>{$('slide-s'+(i+1)).value=s;$('txt-s'+(i+1)).textContent=number(s,0)+' mm';});
    state.joints.forEach((j,i)=>{$('slide-j'+(i+1)).value=j;$('txt-j'+(i+1)).textContent=number(j)+'°';});
    $('slide-clamp').value=state.clampAmount*100;$('txt-clamp').textContent=number(state.clampAmount*100,0)+' %';
    $('mode-label').textContent=state.manual?'COMMANDE MANUELLE':'CYCLE AUTOMATIQUE';
    $('phase-counter').textContent=state.manual?'EXPLORATION DES MOBILITÉS':'Étape '+String(tr.index+1).padStart(2,'0')+' / 11';
    $('phase-name').textContent=state.manual?'Mode manuel':state.time>=M.duration?'Cycle terminé':tr.name;
    $('phase-note').textContent=state.manual?'Les réglages déplacent les pièces selon leurs liaisons. Libérer la capture avant de déplacer le cadre.':M.phases[tr.index].note;
    $('timeline').value=state.time;$('time-value').textContent=number(state.time)+' s';
    [...$('phase-list').children].forEach((b,i)=>{b.classList.toggle('current',!state.manual&&i===tr.index);b.classList.toggle('done',!state.manual&&i<tr.index);b.setAttribute('aria-current',!state.manual&&i===tr.index?'step':'false');});
    $('btn-auto-play').textContent=running?'Ⅱ Pause':state.manual||state.time>=M.duration?'▶ Nouveau cycle':state.time===0?'▶ Lancer le cycle':'▶ Reprendre';
  }
  function commit() {state.metrics=M.inspect(state.joints,state.pose,state);draw();updateUI();}
  function atTime(time) {
    const tr=M.trajectory(time);if(!tr.ok)return tr.reason;
    const m=M.inspect(tr.joints,tr.pose,tr);if(m.collision)return m.collision;
    Object.assign(state,{time,pose:tr.pose,strokes:tr.strokes,joints:tr.joints,buoy:tr.buoy,clampAmount:tr.clampAmount,lockRequested:tr.lockRequested,manual:false});return '';
  }
  function reset() {running=false;$('safety-message').textContent='';atTime(0);commit();}
  function seek(time) {running=false;const error=atTime(time);$('safety-message').textContent=error?'Mouvement arrêté : '+error:'';commit();}
  function togglePlay() {if(state.manual||state.time>=M.duration)reset();running=!running;$('safety-message').textContent='';updateUI();}
  function manual(kind,index,target) {
    running=false;state.manual=true;state.lockRequested=false;
    const origin=kind==='clampAmount'?[state.clampAmount]:state[kind].slice(),diff=target-origin[index];
    const steps=Math.max(1,Math.ceil(Math.abs(diff)/(kind==='strokes'?3:kind==='clampAmount'?.01:.5)));
    let reason='';
    for(let n=1;n<=steps;n++) {
      const values=origin.slice();values[index]+=diff*n/steps;
      const pose=kind==='strokes'?M.solvePlatform(values,state.pose):state.pose;
      if(!pose.ok&&kind==='strokes'){reason=pose.reason;break;}
      const candidate={...state,pose};candidate[kind]=kind==='clampAmount'?values[0]:values;
      // Recentrage automatique des contacts seulement dans le cycle prescrit.
      if(kind==='clampAmount'&&target>0&&(Math.abs(state.buoy.x)>.001||Math.abs(state.buoy.z)>.001)){reason='Centrer la bouée avec le cycle avant le serrage manuel';break;}
      const m=M.inspect(candidate.joints,pose,candidate);if(m.collision){reason=m.collision;break;}
      Object.assign(state,candidate);
    }
    $('safety-message').textContent=reason?'Butée virtuelle : '+reason+'.':'';commit();
  }
  for(let i=0;i<3;i++) $('slide-s'+(i+1)).addEventListener('input',e=>manual('strokes',i,Number(e.target.value)));
  for(let i=0;i<4;i++) $('slide-j'+(i+1)).addEventListener('input',e=>manual('joints',i,Number(e.target.value)));
  $('slide-clamp').addEventListener('input',e=>manual('clampAmount',0,Number(e.target.value)/100));
  $('btn-release').addEventListener('click',()=>manual('clampAmount',0,0));
  $('btn-level').addEventListener('click',()=> {
    running=false;state.manual=true;state.lockRequested=false;
    const initial={...state.pose};let reason='';
    for(let n=1;n<=80;n++) {
      const pose={h:initial.h,pitch:initial.pitch*(1-n/80),roll:initial.roll*(1-n/80)},strokes=M.strokesForPose(pose);
      if(strokes.some(s=>s<0||s>C.strokeMax)){reason='Course de vérin hors limites';break;}
      const m=M.inspect(state.joints,pose,state);if(m.collision){reason=m.collision;break;}
      state.pose=pose;state.strokes=strokes;
    }
    $('safety-message').textContent=reason?'Mise à niveau arrêtée : '+reason:'';commit();
  });
  $('btn-auto-play').addEventListener('click',togglePlay);$('btn-reset').addEventListener('click',reset);$('timeline').addEventListener('input',e=>seek(Number(e.target.value)));
  document.querySelectorAll('[data-speed]').forEach(b=>b.addEventListener('click',()=>{state.speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(x=>x.setAttribute('aria-pressed',x===b));}));
  const ghostCache=new Map();
  $('btn-toggle-mode').addEventListener('click',()=> {
    schematic=!schematic;
    solids.forEach(({o,material})=>{if(!ghostCache.has(material))ghostCache.set(material,new THREE.MeshBasicMaterial({color:material.color,wireframe:true,transparent:true,opacity:.18}));o.material=schematic?ghostCache.get(material):material;});
    water.visible=!schematic;skeleton.visible=schematic;$('btn-toggle-mode').setAttribute('aria-pressed',schematic);
  });
  $('btn-labels').addEventListener('click',()=>{showLabels=!showLabels;labelsLayer.hidden=!showLabels;$('btn-labels').setAttribute('aria-pressed',showLabels);});
  const views={perspective:[7.4,5.5,9.2],front:[0,1.25,12],top:[0,12,.001]};
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{camera.position.fromArray(views[b.dataset.view]);controls.target.set(0,1.25,0);controls.update();document.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',x===b));}));
  const dialog=$('model-dialog');
  document.querySelectorAll('[data-open-model]').forEach(b=>b.addEventListener('click',()=>{running=false;updateUI();dialog.showModal();}));
  $('close-model').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
  document.addEventListener('keydown',e=>{if(e.code==='Space'&&!dialog.open&&!/INPUT|BUTTON|SELECT|TEXTAREA/.test(e.target.tagName)){e.preventDefault();togglePlay();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){running=false;updateUI();}});
  new ResizeObserver(()=> {
    const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;
    camera.aspect=w/h;camera.zoom=w<720?.65:1;
    if(w<720)camera.setViewOffset(w,h,0,20,w,h);else camera.clearViewOffset();
    camera.updateProjectionMatrix();renderer.setSize(w,h);
  }).observe(container);
  function updateLabels() {
    if(!showLabels)return;
    const w=container.clientWidth,h=container.clientHeight,occupied=[];
    labelData.forEach(l=> {
      if(l.target)l.target.localToWorld(v1.fromArray(l.offset||[0,0,0]));else v1.fromArray(l.position);
      v1.project(camera);const x=(v1.x+1)*w/2,y=(1-v1.y)*h/2,width=l.text.length*6.2+14;
      const r={l:x-width/2,r:x+width/2,t:y-23,b:y+2};
      l.element.hidden=v1.z< -1||v1.z>1||r.l<5||r.r>w-5||r.t<(w<=1050?178:143)||r.b>h-(w<=1050?210:155)||occupied.some(b=>r.l<b.r&&r.r>b.l&&r.t<b.b&&r.b>b.t);
      if(!l.element.hidden){occupied.push(r);l.element.style.left=x+'px';l.element.style.top=y+'px';}
    });
  }
  const clock=new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);const delta=Math.min(clock.getDelta(),.10);
    if(running) {const time=Math.min(M.duration,state.time+delta*state.speed),error=atTime(time);if(error){running=false;$('safety-message').textContent='Cycle arrêté : '+error;}if(time>=M.duration)running=false;commit();}
    controls.update();renderer.render(scene,camera);updateLabels();
  }
  reset();animate();
  window.dockingDebug={snapshot:()=> {
    tool.getWorldPosition(v1);const q=new THREE.Quaternion();tool.getWorldQuaternion(q);
    const world=object=>{const v=new THREE.Vector3();object.getWorldPosition(v);return v.toArray();};
    return {time:state.time,running,manual:state.manual,pose:{...state.pose},strokes:[...state.strokes],joints:[...state.joints],
      buoy:{...state.buoy},clampAmount:state.clampAmount,metrics:structuredClone(state.metrics),sceneTCP:v1.toArray(),
      sceneAxis:new THREE.Vector3(0,1,0).applyQuaternion(q).toArray(),sceneXAxis:new THREE.Vector3(1,0,0).applyQuaternion(q).toArray(),
      sceneShoulder:world(root),sceneElbow:world(elbow),sceneWrist:world(wrist),sceneSocket:world(socket),
      lowerAnchors:cylinders.map(c=>world(c.low))};
  }};
})();
