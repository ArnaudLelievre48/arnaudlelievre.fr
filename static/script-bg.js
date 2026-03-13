const canvas = document.getElementById("fluidCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas(){
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();


/* ---------- PARAMETERS (same as python) ---------- */

const N = 50;

let Nx = canvas.width;
let Ny = canvas.height;

const power1 = 6;
const power2 = 7;

let r0 = 1.2 * Nx * (Nx + Ny)/(2*N);

const A = 500000000;
let B = A*(r0**(power2-power1));

const v0 = 3;
const v_max = 8;
const damp = 0.002;

const dt = 0.5;


/* ---------- PARTICLES ---------- */

let particles = [];

for(let p=0;p<N;p++){
  particles.push({
    x:Math.random()*Nx,
    y:Math.random()*Ny,
    vx:Math.random()*v0,
    vy:Math.random()*v0
  });
}

let mouse = { x: 0, y: 0, vx: 0, vy: 0 };
let mousePrev = { x: 0, y: 0 };

window.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

/* ---------- FUNCTIONS ---------- */

function dist(x1,y1,x2,y2){
  return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
}


function acceleration(p1,p2){

  let dx = p2.x - p1.x;
  let dy = p2.y - p1.y;

  let r = Math.sqrt(dx*dx + dy*dy);
  if(r === 0.0) return {x:10,y:10};

  let factor = (A / Math.pow(r, power1+1) - B / Math.pow(r, power2+1));

  return {
    x: factor*dx,
    y: factor*dy
  };
}


/* ---------- SIMULATION STEP ---------- */

function step(){

  Nx = canvas.width;
  Ny = canvas.height;


  // Compute mouse velocity per frame
  mouse.vx = mouse.x - mousePrev.x;
  mouse.vy = mouse.y - mousePrev.y;
  mousePrev.x = mouse.x;
  mousePrev.y = mouse.y;

  let new_particles = [];

  for(let p=0;p<N;p++){

    let part = particles[p];

    let x = part.x;
    let y = part.y;
    let vx = part.vx;
    let vy = part.vy;

    let ax = 0;
    let ay = 0;

    for(let q=0;q<N;q++){

      if(p===q) continue;

      let other = particles[q];


      let a = acceleration(part,other);

      ax += a.x;
      ay += a.y;
    }


    // Mouse repulsion
    let dxm = part.x - mouse.x;
    let dym = part.y - mouse.y;
    let rm = Math.sqrt(dxm*dxm + dym*dym);

    if(rm < 300){ // radius of influence
      let mouseSpeed = Math.sqrt(mouse.vx**2 + mouse.vy**2);
      let f = 10 * mouseSpeed*mouseSpeed / (rm + 10); // scale for effect
      if(f > 1000) f = 1000; // max force cap

      ax += f * dxm / rm;
      ay += f * dym / rm;
      console.log(f)
    }


    v2 = Math.sqrt(vx*vx + vy*vy)
    vx += ax*dt - damp*v2*vx*dt;
    vy += ay*dt  - damp*v2*vy*dt;

    vx = Math.min(v_max,Math.max(-v_max,vx));
    vy = Math.min(v_max,Math.max(-v_max,vy));

    x += vx*dt + Math.random()*(v0/5)*dt;
    y += vy*dt + Math.random()*(v0/5)*dt;

    if(x<0 || x>Nx){
      vx *= -0.8;
      x = Math.min(Nx,Math.max(0,x));
    }

    if(y<0 || y>Ny){
      vy *= -0.8;
      y = Math.min(Ny,Math.max(0,y));
    }

    new_particles.push({
      x:x,
      y:y,
      vx:vx,
      vy:vy
    });

  }

  particles = new_particles;
}


/* ---------- DRAW ---------- */

function draw(){

  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "#919174";

  for(let p of particles){

    ctx.beginPath();
    ctx.arc(p.x,p.y,5,0,Math.PI*2);
    ctx.fill();

  }
}


/* ---------- MAIN LOOP ---------- */

function animate(){

  step();
  draw();

  requestAnimationFrame(animate);
}

animate();
