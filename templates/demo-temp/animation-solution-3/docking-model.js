/* Kinematic reconstruction of the supplied specification. One scene unit = 1 m.
 * Coordinates here are Three.js (x,y,z); sketch (X,Y,Z) = (x,z,y).
 * Thus positive Y points towards the observer in the default XZ view.
 * The lateral position and yaw of the frame are prescribed, not solved by 3 SPS legs.
 */
(function (root) {
  'use strict';
  const rad = Math.PI / 180;
  const C = Object.freeze({ mm: 1000, topY: 3.5, radius: 1.5, hole: 0.82,
    thickness: 0.12, platform3Y: 1.6, boxHeight: 0.22, boxWidth: 0.42,
    boxDepth: 0.34, homeFaceY: 0.94, socketY: 0.65, buoyRadius: 0.5,
    buoyUpperBottom: -0.9, buoyUpperTop: 0.45, strokeMax: 1500, neutralStroke: 1300, fineMax: 450,
    radialTolerance: 0.003, seatTolerance: 0.001, angleTolerance: 1,
    clampTravel: 0.16, clampOuter: 0.64, clampY: 0.16,
    captureHeightTolerance: 0.025, captureAngleTolerance: 0.2 });
  const limit = (v, a, b) => Math.max(a, Math.min(b, v));
  const add = (a,b) => a.map((v,i) => v+b[i]);
  const sub = (a,b) => a.map((v,i) => v-b[i]);
  const norm = a => Math.hypot(...a);
  // Asymmetric triangle: C1 nearly vertical, C2 inclined leftwards, C3 behind.
  // This spatial placement is a demonstration choice, not measured from the sketch.
  const anchors = [
    { top: [-1.5, C.topY, 0.62], bottom: [-1.42, 0, 0.46] },
    { top: [2.7, C.topY, 0.62], bottom: [1.42, 0, 0.46] },
    { top: [0, C.topY, -1.65], bottom: [0, 0, -1.49] }
  ];
  function rotate(v,p) {
    const [x,y,z] = v, cx=Math.cos(p.pitch), sx=Math.sin(p.pitch);
    const cz=Math.cos(p.roll), sz=Math.sin(p.roll), yy=sz*x+cz*y;
    return [cz*x-sz*y, cx*yy-sx*z, sx*yy+cx*z];
  }
  function unrotate(v,p) {
    const [x,y,z]=v, cx=Math.cos(p.pitch), sx=Math.sin(p.pitch);
    const cz=Math.cos(p.roll), sz=Math.sin(p.roll), yy=cx*y+sx*z;
    return [cz*x+sz*yy, -sz*x+cz*yy, -sx*y+cx*z];
  }
  const toWorld = (v,p) => add(rotate(v,p), [0,p.h,0]);
  const toLocal = (v,p) => unrotate(sub(v,[0,p.h,0]),p);
  const lengths = p => anchors.map(a=>norm(sub(toWorld(a.bottom,p),a.top)));
  const neutral = { h:0, pitch:0, roll:0 };
  const restLengths = lengths(neutral).map(l=>l-C.neutralStroke/C.mm);
  const strokesForPose = p => lengths(p).map((l,i)=>(l-restLengths[i])*C.mm);
  function linearSolve(matrix,rhs) {
    const a=matrix.map((row,i)=>[...row,rhs[i]]);
    for(let k=0;k<3;k++) {
      let pivot=k;
      for(let i=k+1;i<3;i++) if(Math.abs(a[i][k])>Math.abs(a[pivot][k])) pivot=i;
      [a[k],a[pivot]]=[a[pivot],a[k]];
      if(Math.abs(a[k][k])<1e-12) return null;
      const d=a[k][k]; for(let j=k;j<4;j++) a[k][j]/=d;
      for(let i=0;i<3;i++) if(i!==k) { const f=a[i][k]; for(let j=k;j<4;j++) a[i][j]-=f*a[k][j]; }
    }
    return a.map(row=>row[3]);
  }
  function solvePlatform(strokes,seed=neutral) {
    if(strokes.length!==3 || strokes.some(s=>!Number.isFinite(s)||s<0||s>C.strokeMax))
      return {ok:false,reason:'Course de vérin hors limites de démonstration'};
    const target=strokes.map((s,i)=>restLengths[i]+s/C.mm), p={...seed};
    const keys=['h','pitch','roll'];
    for(let n=0;n<40;n++) {
      const current=lengths(p), error=current.map((l,i)=>l-target[i]);
      const residual=Math.max(...error.map(Math.abs));
      if(residual<1e-10) return {...p,ok:true,residual,lengths:current};
      const cols=keys.map(k=>lengths({...p,[k]:p[k]+1e-6}).map((l,i)=>(l-current[i])/1e-6));
      const delta=linearSolve(keys.map((_,i)=>cols.map(c=>c[i])),error);
      if(!delta) break;
      const damping=Math.min(1,0.2/Math.max(...delta.map(Math.abs)));
      keys.forEach((k,i)=>p[k]-=damping*delta[i]);
    }
    return {ok:false,reason:'Configuration de suspension non résolue'};
  }
  function yaw(v,angle) {
    const c=Math.cos(angle),s=Math.sin(angle);
    return [c*v[0]+s*v[2],v[1],-s*v[0]+c*v[2]];
  }
  function forward(pose,fine) {
    const localY=C.homeFaceY-fine.z/C.mm, a=fine.rz*rad;
    return {tcp:toWorld([0,localY,0],pose), axis:rotate([0,1,0],pose),
      xAxis:rotate(yaw([1,0,0],a),pose), zAxis:rotate(yaw([0,0,1],a),pose),
      boxCenter:toWorld([0,localY+C.boxHeight/2,0],pose)};
  }
  function centering(pose,buoy,clamp=0,direction='CLOSING') {
    const local=toLocal([buoy.x,buoy.h+C.clampY,buoy.z],pose);
    const angle=Math.acos(Math.cos(pose.pitch)*Math.cos(pose.roll))/rad;
    const offset=Math.hypot(buoy.x,buoy.z);
    const ready=Math.abs(pose.h-buoy.h)<=C.captureHeightTolerance && angle<=C.captureAngleTolerance && offset<=0.12;
    const centered=clamp>=1-1e-8 && ready && offset<=C.radialTolerance;
    const gap=C.clampTravel*(1-clamp);
    // Two translating semicircular collars. Minimum inner-surface clearance
    // to the buoy cylinder, sampled along both half circles at capture height.
    let clearance=Infinity;
    for(const side of [-1,1]) for(let i=0;i<=64;i++) {
      const a=-Math.PI/2+i*Math.PI/64;
      const x=side*(gap+C.buoyRadius*Math.cos(a)),z=C.buoyRadius*Math.sin(a);
      clearance=Math.min(clearance,Math.hypot(x-local[0],z-local[2])-C.buoyRadius);
    }
    let reason='';
    if(clamp<0||clamp>1||!Number.isFinite(clamp)) reason='Fermeture de P2 hors limites';
    else if(clamp>0 && !ready) reason='Mettre P2 au niveau de la bouée et corriger son assiette avant fermeture';
    else if(clamp>0 && clearance<-1e-6) reason='Les demi-colliers de P2 pénètrent dans la bouée';
    return {ready,centered,clearance,gap,reason,state:centered?'CENTERED':clamp>0?(direction==='OPENING'?'OPENING':'CLOSING'):'OPEN'};
  }
  function inspect(pose,fine,buoy,clamp=0,direction='CLOSING') {
    const f=forward(pose,fine), receiver=[buoy.x,buoy.h+C.socketY,buoy.z];
    const gap=f.tcp[1]-receiver[1], radial=Math.hypot(f.tcp[0]-receiver[0],f.tcp[2]-receiver[2]);
    const angle=Math.acos(limit(f.axis[1],-1,1))/rad;
    const keyAngle=Math.acos(limit(f.xAxis[0],-1,1))/rad;
    const aligned=radial<=C.radialTolerance && angle<=C.angleTolerance && keyAngle<=C.angleTolerance;
    const lowest=f.tcp[1]-C.boxWidth/2*Math.abs(f.xAxis[1])-C.boxDepth/2*Math.abs(f.zAxis[1]);
    let collision='';
    if(Math.abs(f.tcp[0]-receiver[0])<C.boxWidth && Math.abs(f.tcp[2]-receiver[2])<C.boxDepth) {
      if(lowest<receiver[1]-C.seatTolerance) collision='BOX_1 dépasse la face de BOX_2';
      else if(lowest<=receiver[1]+C.seatTolerance && !aligned) collision='Boîtes désalignées au contact';
    }
    // Vertical buoy cylinder / tilted annular slab, using a conservative ellipse bound.
    const axisLocal=unrotate([0,1,0],pose);
    const centerLocal=toLocal([buoy.x,buoy.h,buoy.z],pose);
    const axisParameter=-centerLocal[1]/axisLocal[1];
    const ringY=buoy.h+axisParameter;
    const centerAtPlane=add(centerLocal,axisLocal.map(v=>v*axisParameter));
    const tiltCos=Math.abs(axisLocal[1]);
    const footprint=C.buoyRadius/tiltCos + Math.hypot(centerAtPlane[0],centerAtPlane[2])
      + C.thickness/2*Math.sqrt(1-tiltCos**2)/tiltCos;
    const clearance=C.hole-footprint;
    if(ringY+C.thickness/2>=buoy.h+C.buoyUpperBottom && ringY-C.thickness/2<=buoy.h+C.buoyUpperTop && clearance<0)
      collision='PLATFORM_2 touche le corps de la bouée';
    const capture=centering(pose,buoy,clamp,direction);
    if(capture.reason) collision=capture.reason;
    const contact=aligned && Math.abs(gap)<=C.seatTolerance && !collision;
    return {...f,receiver,gap,radial,angle,keyAngle,clearance,aligned,collision,contact,capture};
  }
  const startPose={h:1.2,pitch:2.5*rad,roll:-2.5*rad};
  const initial={pose:startPose,fine:{z:0,rz:35},buoy:{h:0,x:0.08,z:0},dock:'OPEN',clamp:0};
  const phases=[
    {name:'Libre',duration:2,note:'La bouée reste à hauteur constante ; le bâti P2/P3 est suspendu au-dessus.'},
    {name:'Descente du bâti',duration:3,note:'Les trois vérins s’étendent et abaissent P2/P3 vers la bouée, qui reste à la même altitude.'},
    {name:'Correction de l’assiette',duration:4,note:'Les trois vérins poursuivent la descente et mettent le bâti à plat au-dessus de la bouée.'},
    {name:'Mise au niveau de la bouée',duration:2,note:'Les vérins s’allongent jusqu’au niveau de fermeture de P2. La bouée ne monte pas.'},
    {name:'Fermeture et centrage de P2',duration:3,note:'Deux vérins horizontaux referment P2 sur la bouée. Les axes de P2, P3 et de la bouée coïncident.'},
    {name:'Approche verticale fine',duration:3,note:'FINE_Z descend BOX_1 en conservant un jeu de 20 mm avant contact.'},
    {name:'Alignement en rotation',duration:3,note:'FINE_RZ aligne les boîtes autour de l’axe vertical local.'},
    {name:'Contact des interfaces',duration:1,note:'Les faces opposées de BOX_1 et BOX_2 viennent en contact.'},
    {name:'Verrouillage temporaire',duration:3,note:'BOX_DOCK = LOCKED : liaison fixe détachable, hypothèse de modélisation.'},
    {name:'Déverrouillage',duration:1,note:'BOX_DOCK = OPEN : la liaison temporaire est libérée avant le retrait.'},
    {name:'Retrait de BOX_1',duration:3,note:'BOX_1 remonte ; P2 reste fermée et maintient le centrage de P3 sur la bouée.'},
    {name:'Ouverture de P2',duration:2,note:'Les vérins de centrage écartent les demi-colliers et libèrent la bouée.'},
    {name:'Dégagement du bâti',duration:2,note:'Après ouverture complète de P2, le bâti suspendu reprend de la hauteur.'}
  ];
  const levelPose={h:0.1,pitch:0,roll:0}, offsetBuoy={h:0,x:0.08,z:0}, buoy={h:0,x:0,z:0};
  const nodes=[initial,
    initial,
    {...initial,pose:{...startPose,h:0.35},buoy:offsetBuoy},
    {pose:levelPose,fine:initial.fine,buoy:offsetBuoy,dock:'OPEN',clamp:0},
    {pose:neutral,fine:initial.fine,buoy:offsetBuoy,dock:'OPEN',clamp:0},
    {pose:neutral,fine:initial.fine,buoy,dock:'OPEN',clamp:1},
    {pose:neutral,fine:{z:270,rz:35},buoy,dock:'OPEN',clamp:1},
    {pose:neutral,fine:{z:270,rz:0},buoy,dock:'OPEN',clamp:1},
    {pose:neutral,fine:{z:290,rz:0},buoy,dock:'OPEN',clamp:1},
    {pose:neutral,fine:{z:290,rz:0},buoy,dock:'LOCKED',clamp:1},
    {pose:neutral,fine:{z:290,rz:0},buoy,dock:'OPEN',clamp:1},
    {pose:neutral,fine:{z:0,rz:0},buoy,dock:'OPEN',clamp:1},
    {pose:neutral,fine:{z:0,rz:0},buoy,dock:'OPEN',clamp:0},
    {pose:{h:startPose.h,pitch:0,roll:0},fine:{z:0,rz:0},buoy,dock:'OPEN',clamp:0}
  ];
  const duration=phases.reduce((s,p)=>s+p.duration,0);
  function trajectory(time) {
    let t=limit(time,0,duration),index=0;
    while(index<phases.length-1 && t>=phases[index].duration) t-=phases[index++].duration;
    const u=limit(t/phases[index].duration,0,1),s=u*u*u*(10-15*u+6*u*u);
    const blend=(a,b)=>Object.fromEntries(Object.keys(a).map(k=>[k,a[k]+(b[k]-a[k])*s]));
    const a=nodes[index],b=nodes[index+1];
    const pose=blend(a.pose,b.pose),fine=blend(a.fine,b.fine),buoy=blend(a.buoy,b.buoy);
    const dock=index===8?'LOCKED':'OPEN',clamp=a.clamp+(b.clamp-a.clamp)*s;
    const captureState=clamp===0?'OPEN':clamp===1?'CENTERED':index===11?'OPENING':'CLOSING';
    return {index,name:phases[index].name,fraction:u,pose,fine,buoy,dock,clamp,captureState,strokes:strokesForPose(pose)};
  }
  const api={C,rad,anchors,restLengths,neutral,initial,rotate,unrotate,toWorld,toLocal,lengths,
    strokesForPose,solvePlatform,forward,centering,inspect,phases,duration,trajectory};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.DockingModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
