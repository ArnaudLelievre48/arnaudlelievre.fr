(() => {
  'use strict';

  const tour = document.querySelector('.tour');
  const canvas = document.querySelector('.tour-canvas');
  const enterButton = document.querySelector('.enter-button');
  const statusPosition = document.querySelector('.status-position');
  const statusAngle = document.querySelector('.status-angle');
  const loaderProgress = document.querySelector('.loader-progress');
  const boundaryMessage = document.querySelector('.boundary-message');
  const keyButtons = [...document.querySelectorAll('[data-action]')];
  const webglError = document.querySelector('.webgl-error');
  const manifestUrl = tour.dataset.manifest;

  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    powerPreference: 'high-performance'
  });

  if (!gl) {
    tour.classList.remove('is-loading');
    webglError.hidden = false;
    return;
  }

  const vertexSource = `#version 300 es
    in vec2 aPosition;
    out vec2 vPosition;
    void main() {
      vPosition = aPosition;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragmentSource = `#version 300 es
    precision highp float;
    in vec2 vPosition;
    out vec4 outColor;
    uniform sampler2D uCurrent;
    uniform sampler2D uNext;
    uniform vec2 uResolution;
    uniform float uYaw;
    uniform float uPitch;
    uniform float uFov;
    uniform float uTransition;

    const float PI = 3.14159265358979323846;

    vec2 panoramaUv(vec3 direction) {
      float longitude = atan(direction.y, direction.x);
      float latitude = acos(clamp(direction.z, -1.0, 1.0));
      return vec2(fract(longitude / (2.0 * PI) + 0.5), latitude / PI);
    }

    void main() {
      float aspect = uResolution.x / max(uResolution.y, 1.0);
      float scale = tan(uFov * 0.5);
      vec2 screen = vec2(vPosition.x * aspect, vPosition.y) * scale;

      float cy = cos(uYaw);
      float sy = sin(uYaw);
      float cp = cos(uPitch);
      float sp = sin(uPitch);
      vec3 forward = vec3(cp * cy, cp * sy, sp);
      vec3 right = vec3(-sy, cy, 0.0);
      vec3 up = vec3(-sp * cy, -sp * sy, cp);
      vec3 direction = normalize(forward + screen.x * right + screen.y * up);
      vec2 uv = panoramaUv(direction);

      vec3 currentColor = texture(uCurrent, uv).rgb;
      vec3 nextColor = texture(uNext, uv).rgb;
      float blend = smoothstep(0.0, 1.0, uTransition);
      outColor = vec4(mix(currentColor, nextColor, blend), 1.0);
    }
  `;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }
  gl.useProgram(program);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const positionLocation = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {
    current: gl.getUniformLocation(program, 'uCurrent'),
    next: gl.getUniformLocation(program, 'uNext'),
    resolution: gl.getUniformLocation(program, 'uResolution'),
    yaw: gl.getUniformLocation(program, 'uYaw'),
    pitch: gl.getUniformLocation(program, 'uPitch'),
    fov: gl.getUniformLocation(program, 'uFov'),
    transition: gl.getUniformLocation(program, 'uTransition')
  };

  let manifest;
  let currentPosition;
  let currentTexture;
  let nextTexture;
  let transitionStarted = 0;
  let transitionValue = 1;
  let yaw = Math.PI / 2;
  let pitch = -7 * Math.PI / 180;
  let fov = 70 * Math.PI / 180;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let activated = false;
  let renderRequested = true;
  let boundaryTimer;
  const textures = new Map();

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const degrees = radians => radians * 180 / Math.PI;
  const wrapDegrees = radians => ((Math.round(degrees(radians)) % 360) + 360) % 360;

  function placeholderTexture(color = [1, 3, 8, 255]) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(color));
    return texture;
  }

  currentTexture = placeholderTexture();
  nextTexture = currentTexture;

  function configureTexture(image) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    return texture;
  }

  function loadTexture(position, loadedCount) {
    if (textures.has(position.id)) return textures.get(position.id);
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        const texture = configureTexture(image);
        loadedCount.value += 1;
        loaderProgress.textContent = `${loadedCount.value} / ${manifest.positions.length} panoramas`;
        resolve(texture);
      };
      image.onerror = () => reject(new Error(`Could not load ${position.image}`));
      image.src = position.image;
    });
    textures.set(position.id, promise);
    return promise;
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      renderRequested = true;
    }
  }

  function updateStatus() {
    if (currentPosition) statusPosition.textContent = currentPosition.label;
    const pitchValue = Math.round(degrees(pitch));
    const pitchLabel = `${pitchValue < 0 ? '−' : '+'}${String(Math.abs(pitchValue)).padStart(2, '0')}°`;
    statusAngle.textContent = `${String(wrapDegrees(yaw)).padStart(3, '0')}° / ${pitchLabel}`;
  }

  function draw(now) {
    resize();
    if (transitionValue < 1) {
      transitionValue = clamp((now - transitionStarted) / 420, 0, 1);
      renderRequested = true;
      if (transitionValue === 1) currentTexture = nextTexture;
    }

    if (renderRequested) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, currentTexture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, nextTexture);
      gl.uniform1i(uniforms.current, 0);
      gl.uniform1i(uniforms.next, 1);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.yaw, yaw);
      gl.uniform1f(uniforms.pitch, pitch);
      gl.uniform1f(uniforms.fov, fov);
      gl.uniform1f(uniforms.transition, transitionValue);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      renderRequested = transitionValue < 1;
    }
    requestAnimationFrame(draw);
  }

  function look(deltaX, deltaY) {
    yaw += deltaX * 0.00235;
    pitch = clamp(pitch - deltaY * 0.002, -Math.PI * 0.485, Math.PI * 0.485);
    renderRequested = true;
    updateStatus();
  }

  function directionFor(action) {
    if (action === 'up') return [0, 0, 1];
    if (action === 'down') return [0, 0, -1];
    const forward = [Math.cos(yaw), Math.sin(yaw), 0];
    const right = [-Math.sin(yaw), Math.cos(yaw), 0];
    if (action === 'forward') return forward;
    if (action === 'back') return forward.map(value => -value);
    if (action === 'right') return right;
    return right.map(value => -value);
  }

  function targetFor(action) {
    const desired = directionFor(action);
    let best = null;
    let bestScore = -1;
    for (const candidate of manifest.positions) {
      if (candidate.id === currentPosition.id) continue;
      const delta = [
        candidate.x - currentPosition.x,
        candidate.y - currentPosition.y,
        candidate.z - currentPosition.z
      ];
      const distance = Math.hypot(...delta);
      if (Math.abs(distance - manifest.step) > manifest.step * 0.2) continue;
      const score = delta.reduce((sum, value, index) => sum + value / distance * desired[index], 0);
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
    return bestScore > 0.72 ? best : null;
  }

  function pulse(action, blocked = false) {
    keyButtons.filter(button => button.dataset.action === action).forEach(button => {
      button.classList.toggle('is-blocked', blocked);
      button.classList.add('is-active');
      window.setTimeout(() => button.classList.remove('is-active', 'is-blocked'), 220);
    });
  }

  function showBoundary(action) {
    pulse(action, true);
    boundaryMessage.textContent = 'No precomputed frame in that direction';
    clearTimeout(boundaryTimer);
    boundaryTimer = window.setTimeout(() => { boundaryMessage.textContent = ''; }, 1600);
  }

  async function move(action) {
    if (!manifest || transitionValue < 0.8) return;
    const target = targetFor(action);
    if (!target) {
      showBoundary(action);
      return;
    }

    pulse(action);
    const previousTexture = transitionValue < 1 ? nextTexture : currentTexture;
    try {
      nextTexture = await textures.get(target.id);
      currentTexture = previousTexture;
      currentPosition = target;
      transitionStarted = performance.now();
      transitionValue = 0;
      tour.classList.add('is-moving');
      window.setTimeout(() => tour.classList.remove('is-moving'), 430);
      updateStatus();
      renderRequested = true;
    } catch (error) {
      boundaryMessage.textContent = error.message;
    }
  }

  function activate() {
    activated = true;
    tour.classList.add('has-started');
    if (matchMedia('(pointer: fine)').matches) canvas.requestPointerLock?.();
  }

  enterButton.addEventListener('click', activate);
  canvas.addEventListener('click', () => {
    if (activated && matchMedia('(pointer: fine)').matches && document.pointerLockElement !== canvas) {
      canvas.requestPointerLock?.();
    }
  });

  document.addEventListener('pointerlockchange', () => {
    tour.classList.toggle('has-pointer-lock', document.pointerLockElement === canvas);
  });

  document.addEventListener('mousemove', event => {
    if (document.pointerLockElement === canvas) look(event.movementX, event.movementY);
  });

  canvas.addEventListener('pointerdown', event => {
    if (document.pointerLockElement === canvas) return;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture?.(event.pointerId);
  });

  canvas.addEventListener('pointermove', event => {
    if (!dragging || document.pointerLockElement === canvas) return;
    const deltaX = event.clientX - lastX;
    const deltaY = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    look(deltaX, deltaY);
  });

  const stopDragging = event => {
    dragging = false;
    canvas.releasePointerCapture?.(event.pointerId);
  };
  canvas.addEventListener('pointerup', stopDragging);
  canvas.addEventListener('pointercancel', stopDragging);

  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    fov = clamp(fov + event.deltaY * 0.00045, 42 * Math.PI / 180, 92 * Math.PI / 180);
    renderRequested = true;
  }, { passive: false });

  document.addEventListener('keydown', event => {
    const action = {
      z: 'forward', q: 'left', s: 'back', d: 'right',
      ' ': 'up', shift: 'down'
    }[event.key.toLowerCase()];
    if (!action || event.repeat) return;
    event.preventDefault();
    move(action);
  });

  keyButtons.forEach(button => button.addEventListener('click', () => move(button.dataset.action)));
  window.addEventListener('resize', resize);

  fetch(manifestUrl)
    .then(response => {
      if (!response.ok) throw new Error(`Manifest returned ${response.status}`);
      return response.json();
    })
    .then(async data => {
      if (data.projection !== 'equirectangular') throw new Error('Unsupported panorama projection');
      manifest = data;
      yaw = manifest.initialYaw * Math.PI / 180;
      pitch = manifest.initialPitch * Math.PI / 180;
      currentPosition = manifest.positions.find(position => position.id === manifest.initialPosition) || manifest.positions[0];
      const loadedCount = { value: 0 };
      manifest.positions.forEach(position => loadTexture(position, loadedCount));
      currentTexture = await textures.get(currentPosition.id);
      nextTexture = currentTexture;
      transitionValue = 1;
      updateStatus();
      renderRequested = true;
      tour.classList.remove('is-loading');
    })
    .catch(error => {
      tour.classList.remove('is-loading');
      webglError.hidden = false;
      webglError.querySelector('strong').textContent = 'Could not load the 360° tour.';
      webglError.querySelector('span').textContent = error.message;
      console.error(error);
    });

  requestAnimationFrame(draw);
})();
