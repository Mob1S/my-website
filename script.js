// ============================================
// MOB1S — Carbon Telemetry Engine
// WebGL spark field · scroll effects · chat
// ============================================

import * as THREE from 'three';
import { animate, stagger } from 'animejs';

/* =============================================
   0. Chat Config (API placeholder)
   ============================================= */
const ChatConfig = {
  apiEndpoint: '',
  enabled: false,

  buildPayload(message) {
    return { message };
  },

  parseResponse(data) {
    return data?.reply || data?.text || data?.content || '';
  },
};

/* =============================================
   1. WebGL Spark Field
      High-energy particle system — sparks
      that ripple away from cursor
   ============================================= */

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.z = 20;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('particle-canvas'),
  antialias: true,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const neonColor = new THREE.Color('#bfff00');
const brightNeon = new THREE.Color('#d4ff33');
const dimColor = new THREE.Color('#223311');
const warmColor = new THREE.Color('#889922');

const PARTICLE_COUNT = 3000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(PARTICLE_COUNT * 3);
const homePositions = new Float32Array(PARTICLE_COUNT * 3);
const colors = new Float32Array(PARTICLE_COUNT * 3);
const sizes = new Float32Array(PARTICLE_COUNT);

// Wide, flat volume like a track
for (let i = 0; i < PARTICLE_COUNT; i++) {
  const x = (Math.random() - 0.5) * 40;
  const y = (Math.random() - 0.5) * 22;
  const z = (Math.random() - 0.5) * 18;

  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;
  homePositions[i * 3] = x;
  homePositions[i * 3 + 1] = y;
  homePositions[i * 3 + 2] = z;

  const distFromCenter = Math.sqrt(x * x + y * y) / 24;
  const t = Math.min(distFromCenter, 1);
  const c = dimColor.clone().lerp(brightNeon, 1 - t).lerp(warmColor, t * 0.25);
  colors[i * 3] = c.r;
  colors[i * 3 + 1] = c.g;
  colors[i * 3 + 2] = c.b;

  sizes[i] = 0.03 + Math.random() * 0.18;
  if (Math.random() < 0.06) sizes[i] += 0.3;
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const vertexShader = /* glsl */ `
  attribute float size;
  varying vec3 vColor;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (380.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    vColor = color;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float dist = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
    alpha = pow(alpha, 1.5);
    float glow = exp(-dist * 2.8) * 0.35;
    alpha += glow;
    alpha *= 0.8;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

const material = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 } },
  vertexShader,
  fragmentShader,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  depthTest: false,
  transparent: true,
  vertexColors: true,
});

const particleSystem = new THREE.Points(geometry, material);
scene.add(particleSystem);

// Per-particle velocity state
const velocities = new Float32Array(PARTICLE_COUNT * 3);
for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
  velocities[i] = (Math.random() - 0.5) * 0.012;
}

const mouse3D = new THREE.Vector3(0, 0, 0);
const prevMouse3D = new THREE.Vector3(0, 0, 0);

/* =============================================
   2. Mouse tracking
   ============================================= */
const mouse = { x: 0, y: 0 };
const targetMouse = { x: 0, y: 0 };

document.addEventListener('mousemove', (e) => {
  targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

/* =============================================
   3. Scroll tracking
   ============================================= */
let scrollY = 0;
let targetScrollY = 0;
const docHeight = () => document.documentElement.scrollHeight - window.innerHeight;

window.addEventListener('scroll', () => {
  targetScrollY = window.scrollY;
}, { passive: true });

/* =============================================
   4. Parallax
   ============================================= */
const parallaxElements = document.querySelectorAll('[data-parallax]');

function updateParallax() {
  const vh = window.innerHeight;
  parallaxElements.forEach((el) => {
    const factor = parseFloat(el.dataset.parallax) || 0.1;
    const rect = el.getBoundingClientRect();
    const centerOffset = (rect.top + rect.height / 2 - vh / 2) / vh;
    const translateY = centerOffset * factor * 50;
    el.style.transform = `translateY(${translateY}px)`;
  });
}

/* =============================================
   5. Chat terminal logic
   ============================================= */
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const chatMessages = document.getElementById('chatMessages');

function addChatMessage(text, sender) {
  const line = document.createElement('div');
  line.className = `term-line ${sender}`;
  const prompt = document.createElement('span');
  prompt.className = 'term-prompt';
  prompt.textContent = sender === 'bot' ? '>' : '$';
  const span = document.createElement('span');
  span.textContent = text;
  line.appendChild(prompt);
  line.appendChild(span);
  chatMessages.appendChild(line);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage(text) {
  if (!text.trim()) return;

  addChatMessage(text, 'user');
  chatInput.value = '';

  if (!ChatConfig.apiEndpoint) {
    chatInput.disabled = true;
    chatSendBtn.disabled = true;
    await new Promise((r) => setTimeout(r, 800));
    addChatMessage('抱歉，AI 后端尚未接入。请配置 ChatConfig.apiEndpoint。', 'bot');
    chatInput.disabled = false;
    chatSendBtn.disabled = false;
    return;
  }

  try {
    const response = await fetch(ChatConfig.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ChatConfig.buildPayload(text)),
    });
    const data = await response.json();
    const reply = ChatConfig.parseResponse(data);
    if (reply) addChatMessage(reply, 'bot');
  } catch (err) {
    addChatMessage('网络错误，请稍后重试。', 'bot');
    console.error('Chat API error:', err);
  }
}

chatSendBtn.addEventListener('click', () => sendMessage(chatInput.value));

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (ChatConfig.enabled || ChatConfig.apiEndpoint) {
      sendMessage(chatInput.value);
    }
  }
});

/* =============================================
   6. FPS counter
   ============================================= */
let frameCount = 0;
let lastFpsTime = performance.now();
const fpsEl = document.getElementById('tel-fps');

/* =============================================
   7. Render loop — spark physics
   ============================================= */
const clock = new THREE.Clock();

function updateMouse3D() {
  const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
  const halfW = halfH * camera.aspect;
  prevMouse3D.copy(mouse3D);
  mouse3D.set(mouse.x * halfW, mouse.y * halfH, 0);
}

function animateLoop(timestamp) {
  requestAnimationFrame(animateLoop);

  const dt = Math.min(clock.getDelta(), 0.1);

  // FPS
  frameCount++;
  if (timestamp - lastFpsTime >= 1000) {
    const fps = Math.round(frameCount / ((timestamp - lastFpsTime) / 1000));
    if (fpsEl) fpsEl.textContent = fps;
    frameCount = 0;
    lastFpsTime = timestamp;
  }

  // Smooth scroll
  scrollY += (targetScrollY - scrollY) * 0.08;

  // Smooth mouse
  mouse.x += (targetMouse.x - mouse.x) * 0.05;
  mouse.y += (targetMouse.y - mouse.y) * 0.05;

  updateMouse3D();

  const mouseVel = new THREE.Vector3().subVectors(mouse3D, prevMouse3D);

  // Update particles
  const posArray = geometry.attributes.position.array;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const px = posArray[i3];
    const py = posArray[i3 + 1];
    const pz = posArray[i3 + 2];

    let dx = px - mouse3D.x;
    let dy = py - mouse3D.y;
    let dz = pz - mouse3D.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.06;

    dx /= dist;
    dy /= dist;
    dz /= dist;

    const influenceRadius = 11;
    const repulsionStrength = dist < influenceRadius
      ? (1 - dist / influenceRadius) * 2.2
      : 0;
    const wakeStrength = dist < influenceRadius
      ? (1 - dist / influenceRadius) * 0.6
      : 0;

    velocities[i3]     += dx * repulsionStrength + mouseVel.x * wakeStrength;
    velocities[i3 + 1] += dy * repulsionStrength + mouseVel.y * wakeStrength;
    velocities[i3 + 2] += dz * repulsionStrength * 0.5;

    // Spring toward home
    const springK = 0.018;
    velocities[i3]     += (homePositions[i3]     - px) * springK;
    velocities[i3 + 1] += (homePositions[i3 + 1] - py) * springK;
    velocities[i3 + 2] += (homePositions[i3 + 2] - pz) * springK;

    // Micro-drift
    const t = timestamp * 0.001;
    velocities[i3]     += Math.sin(t * 0.8 + i * 0.33) * 0.0007;
    velocities[i3 + 1] += Math.cos(t * 0.7 + i * 0.37) * 0.0007;
    velocities[i3 + 2] += Math.sin(t * 0.55 + i * 0.4) * 0.0005;

    // Damping
    velocities[i3]     *= 0.93;
    velocities[i3 + 1] *= 0.93;
    velocities[i3 + 2] *= 0.93;

    // Clamp
    const speed = Math.sqrt(
      velocities[i3] ** 2 + velocities[i3 + 1] ** 2 + velocities[i3 + 2] ** 2
    );
    const maxSpeed = 0.55;
    if (speed > maxSpeed) {
      const s = maxSpeed / speed;
      velocities[i3] *= s;
      velocities[i3 + 1] *= s;
      velocities[i3 + 2] *= s;
    }

    posArray[i3]     += velocities[i3];
    posArray[i3 + 1] += velocities[i3 + 1];
    posArray[i3 + 2] += velocities[i3 + 2];
  }
  geometry.attributes.position.needsUpdate = true;

  // Camera tilt
  camera.position.x += (mouse.x * 3.8 - camera.position.x) * 0.02;
  camera.position.y += (-mouse.y * 2.0 - camera.position.y) * 0.02;
  camera.lookAt(0, 0, 0);

  // Scroll zoom
  const scrollNorm = scrollY / Math.max(docHeight(), 1);
  const zoom = 1 + scrollNorm * 0.25;
  particleSystem.scale.setScalar(zoom);
  particleSystem.rotation.y = scrollNorm * 0.35;

  material.uniforms.uTime.value = timestamp * 0.001;

  renderer.render(scene, camera);

  updateParallax();
}

/* =============================================
   8. Resize handler
   ============================================= */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* =============================================
   9. Page entrance animation (Anime.js)
   ============================================= */
function animateHeroEntrance() {
  animate('.hero-eyebrow', {
    opacity: { from: 0 },
    y: { from: 20 },
    duration: 600,
    ease: 'outExpo',
  });

  animate('.title-block', {
    opacity: { from: 0 },
    y: { from: 80 },
    scale: { from: 0.92 },
    duration: 1000,
    delay: 100,
    ease: 'outExpo',
  });

  animate('.hero-subtitle', {
    opacity: { from: 0 },
    y: { from: 24 },
    duration: 700,
    delay: 300,
    ease: 'outExpo',
  });

  animate('.hero-actions', {
    opacity: { from: 0 },
    y: { from: 20 },
    duration: 700,
    delay: 500,
    ease: 'outExpo',
  });

  animate('.scroll-flag', {
    opacity: { from: 0 },
    duration: 600,
    delay: 1000,
    ease: 'outExpo',
  });

  animate('.speed-trace', {
    opacity: { from: 0 },
    duration: 800,
    delay: 400,
    ease: 'outExpo',
  });
}

/* =============================================
   10. Scroll-triggered animations
   ============================================= */
function initScrollAnimations() {
  const onEnter = (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;

      // Section headers
      if (el.matches('.section-header')) {
        animate(el.querySelector('.section-index'), {
          opacity: { from: 0 }, y: { from: 16 }, duration: 500, ease: 'outExpo',
        });
        animate(el.querySelector('.section-title'), {
          opacity: { from: 0 }, y: { from: 50 }, duration: 800, delay: 80, ease: 'outExpo',
        });
        animate(el.querySelector('.header-ruler'), {
          width: { from: 0 }, duration: 600, delay: 200, ease: 'outExpo',
        });
      }

      // About intro
      if (el.matches('.about-intro')) {
        animate(el, {
          opacity: { from: 0 }, x: { from: -30 }, duration: 800, ease: 'outExpo',
        });
      }

      // Telemetry card
      if (el.matches('.tel-card')) {
        animate(el, {
          opacity: { from: 0 }, scale: { from: 0.95 }, y: { from: 20 },
          duration: 800, delay: 150, ease: 'outExpo',
        });
      }

      // Hobby panels
      if (el.matches('.hobby-panel')) {
        const code = el.querySelector('.panel-code');
        const title = el.querySelector('.panel-title');
        const desc = el.querySelector('.panel-desc');
        const cards = el.querySelectorAll('.driver-card');

        if (code) animate(code, { opacity: { from: 0 }, x: { from: -12 }, duration: 400, ease: 'outExpo' });
        if (title) animate(title, { opacity: { from: 0 }, x: { from: -12 }, duration: 400, delay: 60, ease: 'outExpo' });
        if (desc) animate(desc, { opacity: { from: 0 }, y: { from: 15 }, duration: 500, delay: 120, ease: 'outExpo' });
        if (cards.length) {
          animate(cards, {
            opacity: { from: 0 }, y: { from: 25 },
            delay: stagger(100, { start: 200 }),
            duration: 600, ease: 'outExpo',
          });
        }
      }

      // Chat intro
      if (el.matches('.chat-intro')) {
        const children = el.querySelectorAll('.chat-tagline, .chat-desc, .chat-sysinfo');
        animate(children, {
          opacity: { from: 0 }, y: { from: 20 },
          delay: stagger(100),
          duration: 600, ease: 'outExpo',
        });
      }

      // Chat terminal
      if (el.matches('.chat-terminal')) {
        animate(el, {
          opacity: { from: 0 }, y: { from: 25 },
          duration: 700, delay: 200, ease: 'outExpo',
        });
      }

      observer.unobserve(el);
    });
  };

  const observer = new IntersectionObserver(onEnter, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  });

  const targets = [
    '.section-header',
    '.about-intro',
    '.tel-card',
    '.hobby-panel',
    '.chat-intro',
    '.chat-terminal',
  ];

  document.querySelectorAll(targets.join(',')).forEach((el) => observer.observe(el));
}

/* =============================================
   11. Start
   ============================================= */
animateHeroEntrance();
initScrollAnimations();
requestAnimationFrame(animateLoop);
