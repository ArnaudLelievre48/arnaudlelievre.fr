const canvas = document.getElementById("fluidCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const PARTICLE_COUNT = 300;
const particles = [];

// Initialize particles
for (let i = 0; i < PARTICLE_COUNT; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.7,
    vy: (Math.random() - 0.5) * 0.7,
    radius: 2 + Math.random()*1.5,
    alpha: 0.6 + Math.random()*0.4
  });
}

const damping = 0.93;
const maxSpeed = 2;

function animate() {
  // Clear canvas to transparent
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let p of particles) {
    // Update position
    p.x += p.vx;
    p.y += p.vy;

    // Random jitter
    p.vx += (Math.random() - 0.5) * 0.85;
    p.vy += (Math.random() - 0.5) * 0.85;

    // Damping
    p.vx *= damping;
    p.vy *= damping;

    // Cap speed
    let speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
    if (speed > maxSpeed) {
      p.vx = (p.vx / speed) * maxSpeed;
      p.vy = (p.vy / speed) * maxSpeed;
    }

    // Wrap around edges
    if (p.x < 0) p.x += canvas.width;
    if (p.x > canvas.width) p.x -= canvas.width;
    if (p.y < 0) p.y += canvas.height;
    if (p.y > canvas.height) p.y -= canvas.height;

    // Draw particle
    ctx.fillStyle = `rgba(145, 145, 116, ${p.alpha})`; // site accent color
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(animate);
}

animate();
