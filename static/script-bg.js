const canvas = document.getElementById("wave-bg");
const ctx = canvas.getContext("2d");

/* =========================
   Resize
========================= */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();

/* =========================
   Mouse
========================= */
const mouse = {
  x: 0,
  y: 0,
  px: 0,
  py: 0,
  vx: 0,
  vy: 0
};

window.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

/* =========================
   Particle
========================= */
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.ox = x;
    this.oy = y;

    this.vx = 0;
    this.vy = 0;
    this.pvx = 0;
    this.pvy = 0;

    this.energy = 0;
  }

  update(dt) {
    // store previous velocity FIRST
    this.pvx = this.vx;
    this.pvy = this.vy;

    const spring = 0.2;
    const damping = 0.4;

    this.vx += (this.ox - this.x) * spring * dt;
    this.vy += (this.oy - this.y) * spring * dt;

    this.vx *= damping;
    this.vy *= damping;

    this.x += this.vx;
    this.y += this.vy;
  }
}

/* =========================
   Grid
========================= */
const spacing = 45;
let particles = [];

function createGrid() {
  particles = [];
  for (let y = 0; y < canvas.height; y += spacing) {
    for (let x = 0; x < canvas.width; x += spacing) {
      particles.push(new Particle(x, y));
    }
  }
}

createGrid();
window.addEventListener("resize", () => {
  resize();
  createGrid();
});

/* =========================
   Mouse Force
========================= */
function applyMouseForce(p, dt) {
  const dx = p.x - mouse.x;
  const dy = p.y - mouse.y;
  const dist = dx * dx + dy * dy;
  const radius = 5000;

  const strength = Math.exp(- dist / radius) + Math.min(0.1, (1 / (1 + 0.0005*dist )) );
  const force = strength * 200;

  p.vx += mouse.vx * force * dt;
  p.vy += mouse.vy * force * dt;
}

/* =========================
   Background wave
========================= */
function waveNoise(x, y, t) {
  return ( ( Math.sin(x * 0.015 + t * 0.8) + Math.cos(y * 0.015 + t * 0.6)) * 0.5);
}

function applyAmbientWave(p, dt, t) {
  const n = waveNoise(p.ox, p.oy, t);

  const strength = 30;   // VERY SMALL
  p.vx += Math.cos(n * Math.PI * 2) * strength * dt;
  p.vy += Math.sin(n * Math.PI * 2) * strength * dt;
}


/* =========================
   Animation Loop
========================= */
let last = performance.now();

function animate(t) {
  const rawDt = (t - last) / 1000;
  const dt = Math.max(Math.min(rawDt, 0.02), 0.0001);
  last = t;

  // motion trail
  const fadeAlpha = 1 - Math.exp(-dt * 15);  // dt in seconds
  ctx.fillStyle = `rgba(11,15,26,${fadeAlpha})`;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // mouse velocity
  mouse.vx = Math.min(mouse.x - mouse.px, 100);
  mouse.vy = Math.min(mouse.y - mouse.py, 100);
  mouse.px = mouse.x;
  mouse.py = mouse.y;

  for (const p of particles) {
    applyAmbientWave(p, dt, t * 0.001);
    applyMouseForce(p, dt);
    p.update(dt);

    /* ===== Acceleration-based glow ===== */
    const ax = (p.vx - p.pvx) / dt;
    const ay = (p.vy - p.pvy) / dt;
    const accel = Math.hypot(ax, ay) || 0;

    const speed = Math.hypot(p.vx, p.vy);

    const eAccel = Math.min(accel * 0.002, 1);
    const eSpeed = Math.min(speed * 0.05, 1);

    const targetEnergy = Math.max(eAccel, eSpeed * 0.4);
    p.energy += (targetEnergy - p.energy) * 0.15;

    const radius = 1 + 2*eSpeed + 2 * eAccel * eAccel * eAccel + 0.5 * Math.cos(0.0015*t + 2 * Math.sin(0.015 * p.x + 0.0001 * p.y*p.x) );
    const alpha = 0.3 + p.energy * p.energy * 0.4 + 0.5 * Math.cos(0.0005*t + 3* Math.sin(0.01* p.x + 0.00015 * p.y*p.x) );

    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);

    ctx.fillStyle = `rgba(120,180,255,${alpha})`;
    ctx.fill();
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
