(() => {
  const canvas = document.getElementById("fluidCanvas");
  const home = document.getElementById("home-content");
  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const count = 50;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  let width = 0;
  let height = 0;
  let particles = [];
  let frame = null;
  let lastTime = null;
  const pointer = { active: false, x: 0, y: 0, previousX: 0, previousY: 0 };

  function makeParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8
    };
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#919174";
    const radius = clamp(width / 240, 1.5, 2.5);
    for (const particle of particles) {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function resizeCanvas() {
    const nextWidth = canvas.clientWidth;
    const nextHeight = canvas.clientHeight;
    if (!nextWidth || !nextHeight) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const pixelsWide = Math.round(nextWidth * pixelRatio);
    const pixelsHigh = Math.round(nextHeight * pixelRatio);
    if (nextWidth === width && nextHeight === height &&
        canvas.width === pixelsWide && canvas.height === pixelsHigh) return;

    for (const particle of particles) {
      particle.x = clamp(particle.x / width * nextWidth, 0, nextWidth);
      particle.y = clamp(particle.y / height * nextHeight, 0, nextHeight);
    }
    width = nextWidth;
    height = nextHeight;
    canvas.width = pixelsWide;
    canvas.height = pixelsHigh;
    // Keep physics in CSS pixels; Retina resolution only affects the drawing buffer.
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    if (!particles.length) particles = Array.from({ length: count }, makeParticle);
    pointer.active = false;
    draw();
  }

  function step(dt) {
    const forces = particles.map(() => ({ x: 0, y: 0 }));
    const spacing = 0.8 * Math.sqrt(width * height / count);
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = particles[j].x - particles[i].x;
        const dy = particles[j].y - particles[i].y;
        const distance = Math.max(4, Math.hypot(dx, dy));
        // Softening and bounded forces prevent singularities when particles meet.
        const strength = clamp(1e8 * (1 - spacing / distance) / distance ** 6, -0.45, 0.45);
        const ax = strength * dx / distance;
        const ay = strength * dy / distance;
        forces[i].x += ax;
        forces[i].y += ay;
        forces[j].x -= ax;
        forces[j].y -= ay;
      }
    }

    const pointerSpeed = Math.hypot(pointer.x - pointer.previousX, pointer.y - pointer.previousY);
    pointer.previousX = pointer.x;
    pointer.previousY = pointer.y;
    const padding = clamp(width / 240, 1.5, 2.5) + 1;

    particles.forEach((particle, index) => {
      let ax = forces[index].x;
      let ay = forces[index].y;
      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      if (pointer.active && pointerSpeed > 0 && distance > 0.01 && distance < 150) {
        const strength = Math.min(1, 0.02 * pointerSpeed * pointerSpeed / (distance + 10));
        ax += strength * dx / distance;
        ay += strength * dy / distance;
      }

      const damping = Math.pow(0.995, dt);
      particle.vx = clamp((particle.vx + ax * dt) * damping, -2.5, 2.5);
      particle.vy = clamp((particle.vy + ay * dt) * damping, -2.5, 2.5);
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;

      if (![particle.x, particle.y, particle.vx, particle.vy].every(Number.isFinite)) {
        Object.assign(particle, makeParticle());
      }
      if (particle.x < padding || particle.x > width - padding) particle.vx *= -0.8;
      if (particle.y < padding || particle.y > height - padding) particle.vy *= -0.8;
      particle.x = clamp(particle.x, padding, width - padding);
      particle.y = clamp(particle.y, padding, height - padding);
    });
  }

  function isVisible() {
    return !document.hidden && home.classList.contains("active");
  }

  function animate(time) {
    frame = null;
    if (!isVisible() || reducedMotion.matches) return;
    const dt = lastTime === null ? 1 : clamp((time - lastTime) / (1000 / 60), 0, 2);
    lastTime = time;
    step(dt);
    draw();
    frame = requestAnimationFrame(animate);
  }

  function syncAnimation() {
    cancelAnimationFrame(frame);
    frame = null;
    lastTime = null;
    pointer.active = false;
    if (!isVisible()) return;
    resizeCanvas();
    draw();
    if (!reducedMotion.matches) frame = requestAnimationFrame(animate);
  }

  window.addEventListener("pointermove", event => {
    if (event.pointerType === "touch" || !isVisible()) return;
    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const inside = x >= 0 && x <= width && y >= 0 && y <= height;
    if (!pointer.active) {
      pointer.previousX = x;
      pointer.previousY = y;
    }
    pointer.x = x;
    pointer.y = y;
    pointer.active = inside;
  });
  window.addEventListener("blur", () => { pointer.active = false; });
  window.addEventListener("resize", resizeCanvas);
  new ResizeObserver(resizeCanvas).observe(canvas);
  new MutationObserver(syncAnimation).observe(home, { attributes: true, attributeFilter: ["class"] });
  document.addEventListener("visibilitychange", syncAnimation);
  reducedMotion.addEventListener("change", syncAnimation);
  syncAnimation();
})();
