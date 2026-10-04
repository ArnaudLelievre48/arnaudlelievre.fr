/* Maquette géométrique de la spécification 3 vérins + bras articulé.
 * Coordonnées de rendu : [X, Z mécanique, -Y mécanique], en mètres.
 * Les dimensions non cotées, courses et seuils sont des hypothèses de démonstration.
 */
(function (root) {
  'use strict';
  const C = Object.freeze({ mm: 1000, topY: 3.65, platformLength: 5,
    frameHalfX: 1.5, frameHalfZ: 1.1, hole: 0.70, thickness: 0.14,
    shoulderY: 0.35, l1: 1.30, l2: 0.95, toolDrop: 0.50,
    neckRadius: 0.50, neckTop: 0.42, neckBottom: -1.0,
    socketY: 0.60, boxHeight: 0.24, boxHalfX: 0.25, boxHalfZ: 0.20,
    strokeMax: 1100, radialTolerance: 0.008, angleTolerance: 1,
    seatTolerance: 0.002, contactTravel: 0.02 });
  const rad = Math.PI / 180, clamp = (x,a,b) => Math.max(a,Math.min(b,x));
  const add = (a,b) => a.map((v,i) => v+b[i]);
  const sub = (a,b) => a.map((v,i) => v-b[i]);
  const norm = v => Math.hypot(...v);
  const base = [1.25,C.shoulderY,0];
  const anchors = [
    {top:[-2.1,C.topY,0.70],bottom:[-1.40,0,0.78]},
    {top:[2.1,C.topY,0.70],bottom:[1.40,0,0.78]},
    {top:[0,C.topY,-1.0],bottom:[0,0,-0.98]}
  ];
  function rotate(v,p) {
    const [x,y,z]=v, cx=Math.cos(p.pitch), sx=Math.sin(p.pitch), cz=Math.cos(p.roll), sz=Math.sin(p.roll);
    const yy=sz*x+cz*y;
    return [cz*x-sz*y,cx*yy-sx*z,sx*yy+cx*z];
  }
  function unrotate(v,p) {
    const [x,y,z]=v, cx=Math.cos(p.pitch), sx=Math.sin(p.pitch), cz=Math.cos(p.roll), sz=Math.sin(p.roll);
    const yy=cx*y+sx*z;
    return [cz*x+sz*yy,-sz*x+cz*yy,-sx*y+cx*z];
  }
  const toWorld=(v,p)=>add(rotate(v,p),[0,p.h,0]);
  const toLocal=(v,p)=>unrotate(sub(v,[0,p.h,0]),p);
  const lengths=p=>anchors.map(a=>norm(sub(toWorld(a.bottom,p),a.top)));
  const minLengths=lengths({h:0.72,pitch:0,roll:0}).map(l=>l-0.12);
  const strokesForPose=p=>lengths(p).map((l,i)=>(l-minLengths[i])*C.mm);
  function linearSolve(matrix,rhs) {
    const a=matrix.map((r,i)=>[...r,rhs[i]]);
    for(let k=0;k<3;k++) {
      let pivot=k;
      for(let i=k+1;i<3;i++) if(Math.abs(a[i][k])>Math.abs(a[pivot][k])) pivot=i;
      [a[k],a[pivot]]=[a[pivot],a[k]];
      if(Math.abs(a[k][k])<1e-10) return null;
      const d=a[k][k]; for(let j=k;j<4;j++) a[k][j]/=d;
      for(let i=0;i<3;i++) if(i!==k) { const f=a[i][k]; for(let j=k;j<4;j++) a[i][j]-=f*a[k][j]; }
    }
    return a.map(r=>r[3]);
  }
  function solvePlatform(strokes,seed={h:0.3,pitch:0,roll:0}) {
    if(strokes.length!==3 || strokes.some(s=>!Number.isFinite(s)||s<0||s>C.strokeMax)) return {ok:false,reason:'Course de vérin hors limites'};
    const target=strokes.map((s,i)=>minLengths[i]+s/C.mm), p={h:seed.h,pitch:seed.pitch,roll:seed.roll}, keys=['h','pitch','roll'];
    for(let n=0;n<45;n++) {
      const current=lengths(p), error=current.map((l,i)=>l-target[i]);
      const residual=Math.max(...error.map(Math.abs));
      if(residual<1e-9) return {...p,ok:true,residual,lengths:current};
      const cols=keys.map(k=>lengths({...p,[k]:p[k]+1e-5}).map((l,i)=>(l-current[i])/1e-5));
      const delta=linearSolve(keys.map((_,i)=>cols.map(c=>c[i])),error);
      if(!delta) break;
      const damping=Math.min(1,0.25/Math.max(...delta.map(Math.abs)));
      keys.forEach((k,i)=>p[k]-=damping*delta[i]);
    }
    return {ok:false,reason:'Fermeture de suspension impossible'};
  }
  const planar=(v,a)=>[Math.cos(a)*v[0]-Math.sin(a)*v[1],Math.sin(a)*v[0]+Math.cos(a)*v[1],v[2]];
  function forward(joints,pose) {
    const [a,b,c,d]=joints.map(j=>j*rad), tilt=a+b+c;
    const elbow=add(base,planar([0,C.l1,0],a));
    const wrist=add(elbow,planar([0,C.l2,0],a+b));
    const axis=rotate(planar([0,1,0],tilt),pose);
    const xAxis=rotate(planar([Math.cos(d),0,-Math.sin(d)],tilt),pose);
    const zAxis=rotate(planar([Math.sin(d),0,Math.cos(d)],tilt),pose);
    const w=toWorld(wrist,pose), tcp=sub(w,axis.map(v=>v*C.toolDrop));
    return {shoulder:toWorld(base,pose),elbow:toWorld(elbow,pose),wrist:w,tcp,axis,xAxis,zAxis};
  }
  // A1-A3 are strictly planar. A4 only rotates the box about its local axis.
  function inverse(tcp,pose,azimuth=0,terminalTilt=0) {
    const local=toLocal(tcp,pose), direction=planar([0,1,0],terminalTilt*rad);
    const d=sub(add(local,direction.map(v=>v*C.toolDrop)),base);
    if(Math.abs(d[2])>1e-7) return {ok:false,reason:'Cible hors du plan du bras A1–A3'};
    const cosB=(d[0]**2+d[1]**2-C.l1**2-C.l2**2)/(2*C.l1*C.l2);
    if(cosB < -1-1e-10 || cosB > 1+1e-10) return {ok:false,reason:'Cible hors de portée du bras'};
    const b=Math.acos(clamp(cosB,-1,1));
    const a=Math.atan2(-d[0],d[1])-Math.atan2(C.l2*Math.sin(b),C.l1+C.l2*Math.cos(b));
    const joints=[a/rad,b/rad,terminalTilt-(a+b)/rad,azimuth];
    if(joints.some((v,i)=>v<jointLimits[i][0]||v>jointLimits[i][1])) return {ok:false,reason:'Butée articulaire atteinte'};
    return {ok:true,joints};
  }
  const jointLimits=[[-90,140],[0,155],[-180,90],[-180,180]];
  const buoyDefault={x:0,z:0};
  function socket(buoy=buoyDefault) { return [buoy.x,C.socketY,buoy.z]; }
  function jawPositions(clampAmount,buoy=buoyDefault) {
    // Inner faces open at +/-0.66 m; end exactly on the cylindrical neck.
    const surface=C.neckRadius;
    return [-0.66+(buoy.x-surface+0.66)*clampAmount,0.66+(buoy.x+surface-0.66)*clampAmount];
  }
  function pointSegmentDistance(p,a,b) {
    const d=sub(b,a), q=sub(p,a), t=clamp(q.reduce((s,x,i)=>s+x*d[i],0)/(norm(d)**2||1),0,1);
    return norm(sub(p,add(a,d.map(v=>v*t))));
  }
  const frameBoxes=[[-1.10,0,0,0.40,C.thickness/2,1.10],[1.10,0,0,0.40,C.thickness/2,1.10],
    [0,0,-0.90,0.70,C.thickness/2,0.20],[0,0,0.90,0.70,C.thickness/2,0.20]];
  function inBox(v,box,r=0) {return v.every((x,i)=>Math.abs(x-box[i])<=box[i+3]+r);}
  function sampleSegment(a,b,r,hit) {
    const n=Math.max(1,Math.ceil(norm(sub(b,a))/0.012));
    for(let i=0;i<=n;i++) if(hit(a.map((v,k)=>v+(b[k]-v)*i/n),r+0.006)) return true;
    return false;
  }
  function inspect(joints,pose,context={}) {
    const buoy=context.buoy||buoyDefault, clampAmount=context.clampAmount||0;
    const f=forward(joints,pose), target=socket(buoy), gap=f.tcp[1]-target[1];
    const radial=Math.hypot(f.tcp[0]-target[0],f.tcp[2]-target[2]);
    const angle=Math.acos(clamp(f.axis[1],-1,1))/rad;
    const keyAngle=Math.acos(clamp(f.xAxis[0],-1,1))/rad;
    const aligned=radial<=C.radialTolerance&&angle<=C.angleTolerance&&keyAngle<=C.angleTolerance;
    let collision='';
    const neckHit=(v,r)=>v[1]>=C.neckBottom-r&&v[1]<=C.neckTop+r&&Math.hypot(v[0]-buoy.x,v[2]-buoy.z)<C.neckRadius+r;
    const frameHit=(v,r)=>frameBoxes.some(box=>inBox(toLocal(v,pose),box,r));
    // Sample the frame volume against the neck, including tilted configurations.
    for(const box of frameBoxes) {
      for(let x=-box[3];x<=box[3]+1e-6;x+=0.04) for(let z=-box[5];z<=box[5]+1e-6;z+=0.04) {
        if(neckHit(toWorld([box[0]+x,0,box[2]+z],pose),C.thickness/2)) collision='Cadre / bouée';
      }
    }
    const segments=[[f.shoulder,f.elbow,0.07],[f.elbow,f.wrist,0.06],
      [f.wrist,add(f.tcp,f.axis.map(v=>v*C.boxHeight)),0.045]];
    for(const [a,b,r] of segments) {
      if(sampleSegment(a,b,r,neckHit)) collision='Bras / bouée';
      if(sampleSegment(a,b,r,frameHit)) collision='Bras / cadre';
      if(sampleSegment(a,b,r,(v,rr)=>v[1]+rr>=C.topY&&Math.abs(v[0])<2.5&&Math.abs(v[2])<1.35)) collision='Bras / plateforme supérieure';
      if(sampleSegment(a,b,r,(v,rr)=>pointSegmentDistance(v,[-1.8,3.20,-1.1],[-1.8,3.20,1.1])<0.27+rr)) collision='Bras / longeron';
      if(sampleSegment(a,b,r,(v,rr)=>anchors.some(anchor=>pointSegmentDistance(v,anchor.top,toWorld(anchor.bottom,pose))<0.09+rr))) collision='Bras / vérin';
    }
    // Box vertices and interior grid: oriented rigid box, never a fictitious gimbal.
    for(let ix=-1;ix<=1;ix++) for(let iy=0;iy<=2;iy++) for(let iz=-1;iz<=1;iz++) {
      const v=add(add(add(f.tcp,f.xAxis.map(x=>x*ix*C.boxHalfX)),f.axis.map(x=>x*iy*C.boxHeight/2)),f.zAxis.map(x=>x*iz*C.boxHalfZ));
      if(neckHit(v,0)) collision='BOX_1 / bouée';
      if(frameHit(v,0)) collision='BOX_1 / cadre';
      if(v[1]>C.topY) collision='BOX_1 / plateforme supérieure';
      if(Math.abs(v[0]-buoy.x)<0.28&&Math.abs(v[2]-buoy.z)<0.23&&v[1]<C.socketY-1e-6&&v[1]>C.neckTop) collision='Connecteur désaligné au contact';
    }
    if(radial<0.53&&gap < -C.seatTolerance) collision='Dépassement de la butée axiale';
    const faces=jawPositions(clampAmount,buoy);
    const captured=clampAmount>=0.999&&Math.abs(pose.pitch)<1e-6&&Math.abs(pose.roll)<1e-6&&Math.abs(pose.h)<0.01&&Math.abs(buoy.x)<0.001&&Math.abs(buoy.z)<0.001;
    // Capture lock is a temporary constraint; release it before changing pose.
    if(clampAmount>0.001&&(Math.abs(pose.pitch)>1e-6||Math.abs(pose.roll)>1e-6||Math.abs(pose.h)>0.01)) collision='Capture engagée : libérer les mâchoires avant de déplacer le cadre';
    const contact=!collision&&aligned&&Math.abs(gap)<=C.seatTolerance;
    const connected=contact&&captured&&!!context.lockRequested;
    const inclination=anchors.map(a=>{const d=sub(toWorld(a.bottom,pose),a.top);return Math.atan2(Math.abs(d[0]),Math.abs(d[1]))/rad;});
    return {...f,target,gap,radial,angle,keyAngle,aligned,collision,captured,contact,connected,
      captureState:captured?'ENGAGED':clampAmount>0?'CENTERING':'FREE',
      dockState:connected?'LOCKED':contact?'CONTACT':'OPEN',jawFaces:faces,inclination,
      insertion:aligned&&!collision?clamp((C.contactTravel-gap)/C.contactTravel,0,1):0};
  }
  const phases=[
    {name:'Approche',duration:3,note:'La bouée est indépendante ; le bras reste dégagé.'},
    {name:'Descente du cadre',duration:4,note:'Les trois vérins amènent le cadre autour du col de la bouée.'},
    {name:'Mise à niveau',duration:3,note:'Des courses différentielles annulent l’inclinaison du cadre.'},
    {name:'Capture grossière',duration:3,note:'Les contacts latéraux recentrent la bouée. Mâchoires mobiles : hypothèse.'},
    {name:'Approche du bras',duration:4,note:'A1–A3 positionnent BOX_1 au-dessus de BOX_2.'},
    {name:'Orientation A4',duration:2,note:'Le poignet axial aligne l’azimut des deux boîtiers.'},
    {name:'Contact',duration:2,note:'Le bras descend jusqu’au contact des faces.'},
    {name:'Docking verrouillé',duration:3,note:'Les interfaces de capture et de docking sont engagées séparément.'},
    {name:'Retrait du bras',duration:3,note:'Le docking est déverrouillé ; le bras dégage BOX_2.'},
    {name:'Libération',duration:3,note:'Les contacts latéraux s’ouvrent ; la bouée redevient indépendante.'},
    {name:'Remontée',duration:4,note:'Les vérins remontent le cadre en gardant l’ouverture libre.'}
  ];
  const duration=phases.reduce((s,p)=>s+p.duration,0), smooth=u=>u*u*u*(10-15*u+6*u*u);
  const lerp=(a,b,u)=>a+(b-a)*u;
  function trajectory(time) {
    let t=clamp(time,0,duration), index=0;
    while(index<phases.length-1&&t>=phases[index].duration) t-=phases[index++].duration;
    const fraction=clamp(t/phases[index].duration,0,1), s=smooth(fraction);
    let pose={h:0.62,pitch:4*rad,roll:-3*rad}, buoy={x:0.12,z:0.06}, clampAmount=0, azimuth=40;
    let localTCP=[0.65,1.35,0], lockRequested=false;
    if(index===0) buoy={x:lerp(0.35,0.12,s),z:lerp(0.12,0.06,s)};
    if(index===1) pose.h=lerp(0.62,0.10,s);
    if(index>=2) pose={h:0,pitch:0,roll:0};
    if(index===2) pose={h:lerp(0.10,0,s),pitch:4*rad*(1-s),roll:-3*rad*(1-s)};
    if(index>=3) buoy={x:0,z:0};
    if(index===3) {buoy={x:0.12*(1-s),z:0.06*(1-s)};clampAmount=s;}
    if(index>=4&&index<=8) clampAmount=1;
    if(index===4) localTCP=[lerp(0.65,0,s),lerp(1.35,C.socketY+0.20,s),0];
    if(index>=5&&index<=7) localTCP=[0,C.socketY+0.20,0];
    if(index===5) azimuth=40*(1-s);
    if(index>=6&&index<=8) azimuth=0;
    if(index===6) localTCP[1]=lerp(C.socketY+0.20,C.socketY,s);
    if(index===7) {localTCP[1]=C.socketY;lockRequested=true;}
    if(index===8) localTCP=[lerp(0,0.65,s),lerp(C.socketY,1.35,s),0];
    if(index>=9) azimuth=0;
    if(index===9) clampAmount=1-s;
    if(index===10) pose.h=lerp(0,0.62,s);
    const tcp=toWorld(localTCP,pose), ik=inverse(tcp,pose,azimuth);
    return {index,name:phases[index].name,fraction,pose,buoy,clampAmount,azimuth,lockRequested,tcp,
      strokes:strokesForPose(pose),joints:ik.joints,ok:ik.ok,reason:ik.reason};
  }
  const api={C,anchors,base,minLengths,jointLimits,rotate,toWorld,toLocal,lengths,strokesForPose,solvePlatform,
    forward,inverse,inspect,socket,jawPositions,frameBoxes,trajectory,phases,duration};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.DockingModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
