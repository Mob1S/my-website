// ============================================
// Mob1S Homepage — WebGL Particles & UI Logic
// Racing / speed theme with Three.js
// ============================================

import * as THREE from 'three';
import { animate, stagger } from 'animejs';

/* =============================================
   0. Chat API Config (接口预留)
   =============================================
   接入真实AI后端时，修改以下配置：
   - apiEndpoint: 你的后端API地址
   - buildPayload(): 按你的API格式组装请求体
   - 启用 enableChat() 激活输入框
   ============================================= */
const ChatConfig = {
  apiEndpoint: '', // TODO: 填入你的AI后端地址
  enabled: false,

  /** 组装发送给AI的请求体 */
  buildPayload(message) {
    return {
      message,
      // 按你的API需求添加字段，例如：
      // persona: 'mob1s',
      // conversation_id: this.conversationId,
    };
  },

  /** 解析AI返回的响应文本 */
  parseResponse(data) {
    // TODO: 按你的API响应格式提取文本
    return data?.reply || data?.text || data?.content || '';
  },
};

/* =============================================
   1. WebGL Mouse-Reactive Particle Field
      Norris-style "lite" — particles ripple
      away from cursor, spring back home
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

const neonColor = new THREE.Color('#c8ff00');
const brightNeon = new THREE.Color('#e4ff33');
const dimColor = new THREE.Color('#334411');
const warmColor = new THREE.Color('#aacc22');

// ======== Mouse-reactive particle field ========
const PARTICLE_COUNT = 2500;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(PARTICLE_COUNT * 3);
const homePositions = new Float32Array(PARTICLE_COUNT * 3); // rest positions
const colors = new Float32Array(PARTICLE_COUNT * 3);
const sizes = new Float32Array(PARTICLE_COUNT);

// Spread particles in a wide, slightly flattened 3D volume
for (let i = 0; i < PARTICLE_COUNT; i++) {
  const x = (Math.random() - 0.5) * 36;
  const y = (Math.random() - 0.5) * 20;
  const z = (Math.random() - 0.5) * 16;

  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;
  homePositions[i * 3] = x;
  homePositions[i * 3 + 1] = y;
  homePositions[i * 3 + 2] = z;

  // Color: warmer/brighter near center, dimmer at edges
  const distFromCenter = Math.sqrt(x * x + y * y) / 22;
  const t = Math.min(distFromCenter, 1);
  const c = dimColor.clone().lerp(brightNeon, 1 - t).lerp(warmColor, t * 0.3);
  colors[i * 3] = c.r;
  colors[i * 3 + 1] = c.g;
  colors[i * 3 + 2] = c.b;

  // Size variation — some bigger bright specks
  sizes[i] = 0.04 + Math.random() * 0.2;
  // A few extra-bright larger particles
  if (Math.random() < 0.08) sizes[i] += 0.25;
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

// Glow shader with soft falloff
const vertexShader = /* glsl */ `
  attribute float size;
  varying vec3 vColor;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (350.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    vColor = color;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float dist = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
    alpha = pow(alpha, 1.4);
    // Outer glow halo
    float glow = exp(-dist * 3.0) * 0.3;
    alpha += glow;
    alpha *= 0.85;
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

// ======== Per-particle physics state ========
const velocities = new Float32Array(PARTICLE_COUNT * 3);
// Initialize with tiny random velocities for liveliness
for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
  velocities[i] = (Math.random() - 0.5) * 0.01;
}

// 3D mouse influence point (updated each frame)
const mouse3D = new THREE.Vector3(0, 0, 0);
// Previous mouse for velocity-based effects
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

window.addEventListener(
  'scroll',
  () => {
    targetScrollY = window.scrollY;
  },
  { passive: true },
);

/* =============================================
   4. Parallax effect on DOM elements
   ============================================= */

const parallaxElements = document.querySelectorAll('[data-parallax]');

function updateParallax() {
  const vh = window.innerHeight;
  parallaxElements.forEach((el) => {
    const factor = parseFloat(el.dataset.parallax) || 0.1;
    const rect = el.getBoundingClientRect();
    const centerOffset = (rect.top + rect.height / 2 - vh / 2) / vh;
    const translateY = centerOffset * factor * 60;
    el.style.transform = `translateY(${translateY}px)`;
  });
}

/* =============================================
   5. Navbar active state
   ============================================= */

const navSections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');
const navbar = document.querySelector('.navbar');

function updateActiveNav() {
  const vh = window.innerHeight;
  let current = '';

  navSections.forEach((sec) => {
    const rect = sec.getBoundingClientRect();
    if (rect.top <= vh * 0.4 && rect.bottom >= vh * 0.4) {
      current = sec.id;
    }
  });

  navLinks.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });

  navbar.classList.toggle('scrolled', scrollY > 60);
}

/* =============================================
   6. Smooth scroll buttons
   ============================================= */

document.querySelectorAll('[data-scroll-to]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.scrollTo;
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  });
});

/* =============================================
   7. Chat UI logic
   ============================================= */

const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const chatMessages = document.getElementById('chatMessages');

function enableChat() {
  ChatConfig.enabled = true;
  chatInput.disabled = false;
  chatSendBtn.disabled = false;
  chatInput.placeholder = '输入消息…';
  // Update status indicator
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');
  if (statusDot) statusDot.style.background = '#4f0';
  if (statusText) statusText.textContent = 'AI 已就绪，开始对话';
}

function disableChat() {
  ChatConfig.enabled = false;
  chatInput.disabled = true;
  chatSendBtn.disabled = true;
  chatInput.placeholder = '输入消息…（AI 尚未接入）';
}

/** 在聊天窗口中添加一条消息 */
function addChatMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${sender}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = sender === 'bot' ? 'M' : 'U';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  const p = document.createElement('p');
  p.textContent = text;
  bubble.appendChild(p);

  // Bot messages: avatar on left; User messages: avatar on right (CSS handles via flex-direction)
  msgDiv.appendChild(avatar);
  msgDiv.appendChild(bubble);
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/** 处理发送消息 — 接入真实API时替换此函数 */
async function sendMessage(text) {
  if (!text.trim()) return;

  // 显示用户消息
  addChatMessage(text, 'user');
  chatInput.value = '';

  if (!ChatConfig.apiEndpoint) {
    // 没有配置后端 — 模拟延迟后回复占位消息
    chatInput.disabled = true;
    chatSendBtn.disabled = true;
    await new Promise((r) => setTimeout(r, 800));
    addChatMessage('抱歉，AI 后端尚未接入。请配置 ChatConfig.apiEndpoint。', 'bot');
    chatInput.disabled = false;
    chatSendBtn.disabled = false;
    return;
  }

  // --- 接入真实API ---
  try {
    const response = await fetch(ChatConfig.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ChatConfig.buildPayload(text)),
    });
    const data = await response.json();
    const reply = ChatConfig.parseResponse(data);
    if (reply) {
      addChatMessage(reply, 'bot');
    }
  } catch (err) {
    addChatMessage('网络错误，请稍后重试。', 'bot');
    console.error('Chat API error:', err);
  }
}

// 发送按钮点击
chatSendBtn.addEventListener('click', () => {
  sendMessage(chatInput.value);
});

// 回车发送
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (ChatConfig.enabled || ChatConfig.apiEndpoint) {
      sendMessage(chatInput.value);
    }
  }
});

/* =============================================
   8. Render loop — mouse-reactive physics
   ============================================= */

const clock = new THREE.Clock();

// Map normalized mouse coords → 3D world position on z=0 plane
function updateMouse3D() {
  // Camera frustum half-height at z=0 (camera at z=20, FOV=60°)
  const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
  const halfW = halfH * camera.aspect;
  prevMouse3D.copy(mouse3D);
  mouse3D.set(mouse.x * halfW, mouse.y * halfH, 0);
}

function animate(timestamp) {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.1);

  // Smooth scroll
  scrollY += (targetScrollY - scrollY) * 0.08;

  // Smooth mouse (heavy easing for organic trail feel)
  mouse.x += (targetMouse.x - mouse.x) * 0.06;
  mouse.y += (targetMouse.y - mouse.y) * 0.06;

  updateMouse3D();

  // Mouse velocity vector (for directional push)
  const mouseVel = new THREE.Vector3().subVectors(mouse3D, prevMouse3D);

  // --- Update particle physics ---
  const posArray = geometry.attributes.position.array;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const px = posArray[i3];
    const py = posArray[i3 + 1];
    const pz = posArray[i3 + 2];

    // Vector from particle to mouse influence point
    let dx = px - mouse3D.x;
    let dy = py - mouse3D.y;
    let dz = pz - mouse3D.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.08;

    // Normalise direction
    dx /= dist;
    dy /= dist;
    dz /= dist;

    // Repulsion force — strong nearby, fades with distance
    const influenceRadius = 10;
    const repulsionStrength = dist < influenceRadius
      ? (1 - dist / influenceRadius) * 1.8
      : 0;
    // Add directional push from mouse velocity (wake effect)
    const wakeStrength = dist < influenceRadius
      ? (1 - dist / influenceRadius) * 0.5
      : 0;

    velocities[i3]     += dx * repulsionStrength + mouseVel.x * wakeStrength;
    velocities[i3 + 1] += dy * repulsionStrength + mouseVel.y * wakeStrength;
    velocities[i3 + 2] += dz * repulsionStrength * 0.6;

    // Spring force toward home
    const springK = 0.015;
    velocities[i3]     += (homePositions[i3]     - px) * springK;
    velocities[i3 + 1] += (homePositions[i3 + 1] - py) * springK;
    velocities[i3 + 2] += (homePositions[i3 + 2] - pz) * springK;

    // Idle micro-drift (keeps field alive when mouse is still)
    const t = timestamp * 0.001;
    velocities[i3]     += Math.sin(t * 0.7 + i * 0.3) * 0.0006;
    velocities[i3 + 1] += Math.cos(t * 0.6 + i * 0.4) * 0.0006;
    velocities[i3 + 2] += Math.sin(t * 0.5 + i * 0.35) * 0.0004;

    // Damping
    velocities[i3]     *= 0.94;
    velocities[i3 + 1] *= 0.94;
    velocities[i3 + 2] *= 0.94;

    // Clamp velocity
    const speed = Math.sqrt(
      velocities[i3] ** 2 + velocities[i3 + 1] ** 2 + velocities[i3 + 2] ** 2
    );
    const maxSpeed = 0.5;
    if (speed > maxSpeed) {
      const s = maxSpeed / speed;
      velocities[i3] *= s;
      velocities[i3 + 1] *= s;
      velocities[i3 + 2] *= s;
    }

    // Update position
    posArray[i3]     += velocities[i3];
    posArray[i3 + 1] += velocities[i3 + 1];
    posArray[i3 + 2] += velocities[i3 + 2];
  }
  geometry.attributes.position.needsUpdate = true;

  // --- Camera subtle tilt toward mouse ---
  camera.position.x += (mouse.x * 3.5 - camera.position.x) * 0.02;
  camera.position.y += (-mouse.y * 1.8 - camera.position.y) * 0.02;
  camera.lookAt(0, 0, 0);

  // --- Scroll-driven subtle zoom ---
  const scrollNorm = scrollY / Math.max(docHeight(), 1);
  const zoom = 1 + scrollNorm * 0.2;
  particleSystem.scale.setScalar(zoom);

  // --- Gentle auto-rotation on scroll ---
  particleSystem.rotation.y = scrollNorm * 0.3;

  material.uniforms.uTime.value = timestamp * 0.001;

  renderer.render(scene, camera);

  // --- DOM updates ---
  updateParallax();
  updateActiveNav();
}

/* =============================================
   9. Resize handler
   ============================================= */

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* =============================================
   10. Page entrance & scroll animations (Anime.js)
   ============================================= */

function animateHeroEntrance() {
  animate('.hero-badge', {
    opacity: { from: 0 },
    y: { from: 30 },
    duration: 700,
    ease: 'outExpo',
  });

  animate('.title-line', {
    opacity: { from: 0 },
    y: { from: 60 },
    delay: stagger(120),
    duration: 900,
    ease: 'outExpo',
  });

  animate('.hero-subtitle', {
    opacity: { from: 0 },
    y: { from: 20 },
    duration: 700,
    delay: 350,
    ease: 'outExpo',
  });

  animate('.hero-cta', {
    opacity: { from: 0 },
    y: { from: 20 },
    duration: 700,
    delay: 500,
    ease: 'outExpo',
  });

  animate('.scroll-indicator', {
    opacity: { from: 0 },
    duration: 600,
    delay: 900,
    ease: 'outExpo',
  });
}

function initScrollAnimations() {
  const onEnter = (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;

      // Section titles — fade up
      if (el.matches('.section-title')) {
        animate(el, {
          opacity: { from: 0 },
          y: { from: 50 },
          duration: 800,
          ease: 'outExpo',
        });
      }

      // About text — slide in from left
      if (el.matches('.about-text')) {
        animate(el, {
          opacity: { from: 0 },
          x: { from: -30 },
          duration: 800,
          ease: 'outExpo',
        });
      }

      // Glow card — scale + fade in
      if (el.matches('.glow-card')) {
        animate(el, {
          opacity: { from: 0 },
          scale: { from: 0.92 },
          duration: 800,
          delay: 200,
          ease: 'outExpo',
        });
      }

      // Hobby rows — staggered children entrance
      if (el.matches('.hobby-row')) {
        const num = el.querySelector('.hobby-num');
        const name = el.querySelector('.hobby-name');
        const desc = el.querySelector('.hobby-desc');
        const cards = el.querySelectorAll('.icon-card');

        if (num) animate(num, { opacity: { from: 0 }, y: { from: 20 }, duration: 450, ease: 'outExpo' });
        if (name) animate(name, { opacity: { from: 0 }, y: { from: 20 }, duration: 450, delay: 80, ease: 'outExpo' });
        if (desc) animate(desc, { opacity: { from: 0 }, y: { from: 16 }, duration: 500, delay: 160, ease: 'outExpo' });
        if (cards.length) {
          animate(cards, {
            opacity: { from: 0 },
            y: { from: 30 },
            delay: stagger(100, { start: 240 }),
            duration: 600,
            ease: 'outExpo',
          });
        }
      }

      // Chat intro — staggered children
      if (el.matches('.chat-intro')) {
        const children = el.querySelectorAll('.chat-lead, p, .chat-status');
        animate(children, {
          opacity: { from: 0 },
          y: { from: 24 },
          delay: stagger(100),
          duration: 600,
          ease: 'outExpo',
        });
      }

      // Chat window — fade up
      if (el.matches('.chat-window')) {
        animate(el, {
          opacity: { from: 0 },
          y: { from: 30 },
          duration: 700,
          delay: 200,
          ease: 'outExpo',
        });
      }

      observer.unobserve(el);
    });
  };

  const observer = new IntersectionObserver(onEnter, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  });

  const targets = [
    '.section-title',
    '.about-text',
    '.glow-card',
    '.hobby-row',
    '.chat-intro',
    '.chat-window',
  ];

  document.querySelectorAll(targets.join(',')).forEach((el) => {
    observer.observe(el);
  });
}

/* =============================================
   11. Start
   ============================================= */

animateHeroEntrance();
initScrollAnimations();
requestAnimationFrame(animate);
