// ============================================
// MOB1S — Carbon Telemetry Engine
// WebGL spark field · mask reveal · chat
// ============================================

import * as THREE from 'three';
import { animate, stagger } from 'animejs';

console.log('[MOB1S] Engine starting...');

/* =============================================
   0. Chat Config & Conversation State
   ============================================= */
const ChatConfig = {
  apiEndpoint: '/api/chat',
  enabled: true,
  buildPayload(messages) { return { messages }; },
  parseResponse(data) { return data?.reply || ''; },
};

// Conversation history (role-based, sent to backend)
// Starts with bot's protocol greeting so every request includes full context
let chatHistory = [
  { role: 'assistant', content: '你好，你是谁？' },
];

// Track if user has identified themselves to avoid re-asking
let userIdentified = false;

/* =============================================
   1. WebGL Spark Field
   ============================================= */
let scene, camera, renderer, particleSystem, geometry, material;
let PARTICLE_COUNT = 0;
let homePositions, velocities;

const canvas = document.getElementById('particle-canvas');

if (canvas && typeof THREE.WebGLRenderer === 'function') {
  try {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 20;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const dimColor = new THREE.Color('#88aa44');
    const brightNeon = new THREE.Color('#d4ff33');
    const warmColor = new THREE.Color('#ccff66');

    PARTICLE_COUNT = 800;
    geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    homePositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 22;
      const z = (Math.random() - 0.5) * 18;
      positions[i * 3] = x;     homePositions[i * 3] = x;
      positions[i * 3 + 1] = y; homePositions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z; homePositions[i * 3 + 2] = z;

      const distFromCenter = Math.sqrt(x * x + y * y) / 24;
      const t = Math.min(distFromCenter, 1);
      const c = dimColor.clone().lerp(brightNeon, 1 - t).lerp(warmColor, t * 0.4);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      sizes[i] = 0.06 + Math.random() * 0.3;
      if (Math.random() < 0.12) sizes[i] += 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    velocities = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT * 3; i++) velocities[i] = (Math.random() - 0.5) * 0.005;

    const vertexShader = /* glsl */ `
      attribute float size; varying vec3 vColor;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (520.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition; vColor = color;
      }
    `;
    const fragmentShader = /* glsl */ `
      varying vec3 vColor;
      void main() {
        float dist = length(gl_PointCoord - 0.5) * 2.0;
        float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
        alpha = pow(alpha, 1.2);
        alpha += exp(-dist * 2.2) * 0.55;
        alpha *= 0.95;
        gl_FragColor = vec4(vColor, alpha);
      }
    `;

    material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader, fragmentShader,
      blending: THREE.AdditiveBlending,
      depthWrite: false, depthTest: false,
      transparent: true, vertexColors: true,
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
    console.log('[Particles] OK — ' + PARTICLE_COUNT + ' particles ready');
  } catch (err) {
    console.warn('[Particles] WebGL init failed:', err.message);
    if (canvas) { canvas.style.display = 'none'; }
  }
} else if (canvas) {
  console.warn('[Particles] No WebGL support, hiding canvas');
  canvas.style.display = 'none';
}

/* =============================================
   2. Content Clone — Bottom Layer
   ============================================= */
(function cloneContent() {
  const bottomInner = document.getElementById('layerBottomInner');
  const main = document.querySelector('main.sections-container');
  const footer = document.querySelector('footer.footer');

  if (!bottomInner) return;

  if (main) {
    const mainClone = main.cloneNode(true);
    mainClone.querySelectorAll('[id]').forEach(function(el) { el.removeAttribute('id'); });
    bottomInner.appendChild(mainClone);
  }
  if (footer) {
    const footerClone = footer.cloneNode(true);
    footerClone.querySelectorAll('[id]').forEach(function(el) { el.removeAttribute('id'); });
    bottomInner.appendChild(footerClone);
  }

  bottomInner.setAttribute('aria-hidden', 'true');
  console.log('[Clone] Content cloned to bottom layer');
})();

/* =============================================
   3. Mouse / Scroll / Touch Tracking
   ============================================= */
const layerTop = document.getElementById('layerTop');
const layerBottomInner = document.getElementById('layerBottomInner');

// WebGL (normalized -1..1)
const mouse = { x: 0, y: 0 };
const targetMouse = { x: 0, y: 0 };

// Mask (pixel coords)
let maskX = window.innerWidth / 2;
let maskY = window.innerHeight / 2;
let targetMaskX = maskX;
let targetMaskY = maskY;

function handleMouseMove(e) {
  // WebGL
  targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  // Mask
  targetMaskX = e.clientX;
  targetMaskY = e.clientY;
}

let maskVisible = false;
let maskSuspended = false; // true when easter egg modal is open
let maskSuppressedByArea = false; // true when over map or chat areas
let maskInitialized = false;

document.addEventListener('mousemove', function(e) {
  maskVisible = true;

  // Suppress mask over map container and chat terminal — the circular
  // hole obscures small provinces and is distracting in text-dense areas
  var mapCtr = document.getElementById('mapContainer');
  var chatTerm = document.querySelector('.chat-terminal');
  maskSuppressedByArea = !!((mapCtr && mapCtr.contains(e.target)) ||
                            (chatTerm && chatTerm.contains(e.target)));

  handleMouseMove(e);
  if (!maskInitialized) {
    maskX = targetMaskX;
    maskY = targetMaskY;
    maskInitialized = true;
  }
});
document.addEventListener('mouseleave', function() { maskVisible = false; });

document.addEventListener('touchmove', function(e) {
  var t = e.touches[0];
  maskVisible = true;

  var mapCtr = document.getElementById('mapContainer');
  var chatTerm = document.querySelector('.chat-terminal');
  maskSuppressedByArea = !!((mapCtr && mapCtr.contains(e.target)) ||
                            (chatTerm && chatTerm.contains(e.target)));

  handleMouseMove(t);
  if (!maskInitialized) {
    maskX = targetMaskX;
    maskY = targetMaskY;
    maskInitialized = true;
  }
}, { passive: true });

document.addEventListener('touchend', function() { maskVisible = false; });

window.addEventListener('resize', function() {
  targetMaskX = window.innerWidth / 2;
  targetMaskY = window.innerHeight / 2;
});

/* =============================================
   4. FPS counter
   ============================================= */
let frameCount = 0;
let lastFpsTime = performance.now();
const fpsEl = document.getElementById('tel-fps');

/* =============================================
   5. Render loop (WebGL + mask + scroll sync)
   ============================================= */
const clock = new THREE.Clock();
const mouse3D = new THREE.Vector3(0, 0, 0);
const prevMouse3D = new THREE.Vector3(0, 0, 0);

function updateMouse3D() {
  if (!camera) return;
  const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
  const halfW = halfH * camera.aspect;
  prevMouse3D.copy(mouse3D);
  mouse3D.set(mouse.x * halfW, mouse.y * halfH, 0);
}

const docHeight = function() { return Math.max(document.documentElement.scrollHeight - window.innerHeight, 1); };

function animateLoop(timestamp) {
  requestAnimationFrame(animateLoop);

  const dt = Math.min(clock.getDelta(), 0.1);

  // FPS
  frameCount++;
  if (timestamp - lastFpsTime >= 1000) {
    const fps = Math.round(frameCount / ((timestamp - lastFpsTime) / 1000));
    if (fpsEl) fpsEl.textContent = fps;
    frameCount = 0; lastFpsTime = timestamp;
  }

  // Smooth mouse for WebGL
  mouse.x += (targetMouse.x - mouse.x) * 0.05;
  mouse.y += (targetMouse.y - mouse.y) * 0.05;

  updateMouse3D();

  // Particle physics
  if (scene && geometry && particleSystem && velocities && homePositions) {
    const mouseVel = new THREE.Vector3().subVectors(mouse3D, prevMouse3D);
    const posArray = geometry.attributes.position.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const px = posArray[i3], py = posArray[i3 + 1], pz = posArray[i3 + 2];

      let dx = px - mouse3D.x, dy = py - mouse3D.y, dz = pz - mouse3D.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.06;
      dx /= dist; dy /= dist; dz /= dist;

      const influenceRadius = 8;
      const rep = dist < influenceRadius ? (1 - dist / influenceRadius) * 1.0 : 0;
      const wake = dist < influenceRadius ? (1 - dist / influenceRadius) * 0.25 : 0;

      velocities[i3]     += dx * rep + mouseVel.x * wake;
      velocities[i3 + 1] += dy * rep + mouseVel.y * wake;
      velocities[i3 + 2] += dz * rep * 0.5;

      const springK = 0.010;
      velocities[i3]     += (homePositions[i3]     - px) * springK;
      velocities[i3 + 1] += (homePositions[i3 + 1] - py) * springK;
      velocities[i3 + 2] += (homePositions[i3 + 2] - pz) * springK;

      const t = timestamp * 0.001;
      velocities[i3]     += Math.sin(t * 0.5 + i * 0.33) * 0.0003;
      velocities[i3 + 1] += Math.cos(t * 0.45 + i * 0.37) * 0.0003;
      velocities[i3 + 2] += Math.sin(t * 0.35 + i * 0.4)  * 0.0002;

      velocities[i3] *= 0.88; velocities[i3 + 1] *= 0.88; velocities[i3 + 2] *= 0.88;

      const speed = Math.sqrt(velocities[i3]**2 + velocities[i3+1]**2 + velocities[i3+2]**2);
      const maxSpeed = 0.55;
      if (speed > maxSpeed) { const s = maxSpeed / speed; velocities[i3]*=s; velocities[i3+1]*=s; velocities[i3+2]*=s; }

      posArray[i3] += velocities[i3];
      posArray[i3 + 1] += velocities[i3 + 1];
      posArray[i3 + 2] += velocities[i3 + 2];
    }
    geometry.attributes.position.needsUpdate = true;

    camera.position.x += (mouse.x * 3.8 - camera.position.x) * 0.02;
    camera.position.y += (-mouse.y * 2.0 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    const scrollNorm = window.scrollY / docHeight();
    particleSystem.scale.setScalar(1 + scrollNorm * 0.25);
    particleSystem.rotation.y = scrollNorm * 0.35;
    material.uniforms.uTime.value = timestamp * 0.001;

    renderer.render(scene, camera);
  }

  // === Mask reveal update ===
  maskX += (targetMaskX - maskX) * 0.08;
  maskY += (targetMaskY - maskY) * 0.08;

  if (layerTop) {
    if (maskVisible && !maskSuspended && !maskSuppressedByArea) {
      var adjustedY = maskY + window.scrollY;
      var maskVal = 'radial-gradient(circle 60px at ' + maskX.toFixed(1) + 'px ' + adjustedY.toFixed(1) + 'px, transparent 60px, black 60px)';
      layerTop.style.webkitMaskImage = maskVal;
      layerTop.style.maskImage = maskVal;
    } else {
      layerTop.style.webkitMaskImage = 'none';
      layerTop.style.maskImage = 'none';
    }
  }

  // Scroll sync for bottom layer clone
  if (layerBottomInner) {
    layerBottomInner.style.transform = 'translateY(' + (-window.scrollY).toFixed(1) + 'px)';
  }
}

/* =============================================
   6. Chat terminal logic
   ============================================= */
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const chatMessages = document.getElementById('chatMessages');
const sysStatus = document.getElementById('sysStatus');

function addChatMessage(text, sender) {
  if (!chatMessages) return;
  const line = document.createElement('div');
  line.className = 'term-line ' + sender;
  const prompt = document.createElement('span');
  prompt.className = 'term-prompt';
  prompt.textContent = sender === 'bot' ? '>' : '$';
  const span = document.createElement('span');
  span.textContent = text;
  line.appendChild(prompt); line.appendChild(span);
  chatMessages.appendChild(line);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setTypingIndicator(show) {
  var existing = chatMessages && chatMessages.querySelector('.term-line.typing');
  if (show) {
    if (!existing) {
      var line = document.createElement('div');
      line.className = 'term-line bot typing';
      var prompt = document.createElement('span');
      prompt.className = 'term-prompt';
      prompt.textContent = '>';
      var dots = document.createElement('span');
      dots.className = 'typing-dots';
      dots.textContent = '...';
      line.appendChild(prompt); line.appendChild(dots);
      chatMessages.appendChild(line);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  } else {
    if (existing) existing.remove();
  }
}

function enableChatInputs() {
  if (chatInput) { chatInput.disabled = false; chatInput.placeholder = '输入消息…'; }
  if (chatSendBtn) chatSendBtn.disabled = false;
  if (sysStatus) { sysStatus.textContent = 'ONLINE'; sysStatus.style.color = 'var(--neon)'; sysStatus.style.animation = 'none'; }
}

async function sendMessage(text) {
  if (!text.trim()) return;
  addChatMessage(text, 'user');
  chatHistory.push({ role: 'user', content: text });
  if (chatInput) chatInput.value = '';

  setTypingIndicator(true);
  if (chatInput) chatInput.disabled = true;
  if (chatSendBtn) chatSendBtn.disabled = true;

  try {
    const response = await fetch(ChatConfig.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ChatConfig.buildPayload(chatHistory)),
    });

    setTypingIndicator(false);

    if (!response.ok) {
      var errData;
      try { errData = await response.json(); } catch (e) { errData = {}; }
      addChatMessage(errData.error || 'AI 服务暂时不可用，稍后再试吧。', 'bot');
    } else {
      var data = await response.json();
      var reply = ChatConfig.parseResponse(data);
      if (reply) {
        addChatMessage(reply, 'bot');
        chatHistory.push({ role: 'assistant', content: reply });
      }
    }
  } catch (err) {
    setTypingIndicator(false);
    addChatMessage('网络错误，请检查后端是否启动。', 'bot');
  }

  if (chatInput) chatInput.disabled = false;
  if (chatSendBtn) chatSendBtn.disabled = false;
  chatInput && chatInput.focus();
}

// Initialize: show persona greeting, enable input
(function initChat() {
  if (!chatMessages) return;

  // Clear placeholder messages
  chatMessages.innerHTML = '';

  // Protocol greeting
  addChatMessage('你好，你是谁？', 'bot');
  addChatMessage('（如果你是我认识的人，告诉我你的名字；不认识也没关系，随便聊聊）', 'bot');

  enableChatInputs();
})();

if (chatSendBtn) chatSendBtn.addEventListener('click', function() { sendMessage(chatInput ? chatInput.value : ''); });
if (chatInput) {
  chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatInput.value);
    }
  });
}

/* =============================================
   7. Resize handler
   ============================================= */
window.addEventListener('resize', function() {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});

/* =============================================
   8. Page entrance animation (Anime.js)
   ============================================= */
function animateHeroEntrance() {
  animate('.hero-eyebrow', { opacity: { from: 0 }, y: { from: 20 }, duration: 600, ease: 'outExpo' });
  animate('.title-block', { opacity: { from: 0 }, y: { from: 80 }, scale: { from: 0.92 }, duration: 1000, delay: 100, ease: 'outExpo' });
  animate('.hero-subtitle', { opacity: { from: 0 }, y: { from: 24 }, duration: 700, delay: 300, ease: 'outExpo' });
}

/* =============================================
   9. Scroll-triggered animations
   ============================================= */
function initScrollAnimations() {
  var onEnter = function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;

      if (el.matches('.section-header')) {
        animate(el.querySelector('.section-index'), { opacity: { from: 0 }, y: { from: 16 }, duration: 500, ease: 'outExpo' });
        animate(el.querySelector('.section-title'), { opacity: { from: 0 }, y: { from: 50 }, duration: 800, delay: 80, ease: 'outExpo' });
        animate(el.querySelector('.header-ruler'), { width: { from: 0 }, duration: 600, delay: 200, ease: 'outExpo' });
      }
      if (el.matches('.about-intro')) {
        animate(el, { opacity: { from: 0 }, x: { from: -30 }, duration: 800, ease: 'outExpo' });
      }
      if (el.matches('.tel-card')) {
        animate(el, { opacity: { from: 0 }, scale: { from: 0.95 }, y: { from: 20 }, duration: 800, delay: 150, ease: 'outExpo' });
      }
      if (el.matches('.hobby-panel')) {
        var code = el.querySelector('.panel-code');
        var title = el.querySelector('.panel-title');
        var desc = el.querySelector('.panel-desc');
        var cards = el.querySelectorAll('.driver-card');
        if (code) animate(code, { opacity: { from: 0 }, x: { from: -12 }, duration: 400, ease: 'outExpo' });
        if (title) animate(title, { opacity: { from: 0 }, x: { from: -12 }, duration: 400, delay: 60, ease: 'outExpo' });
        if (desc) animate(desc, { opacity: { from: 0 }, y: { from: 15 }, duration: 500, delay: 120, ease: 'outExpo' });
        if (cards.length) animate(cards, { opacity: { from: 0 }, y: { from: 25 }, delay: stagger(100, { start: 200 }), duration: 600, ease: 'outExpo' });
      }
      if (el.matches('.chat-intro')) {
        var children = el.querySelectorAll('.chat-tagline, .chat-desc, .chat-sysinfo');
        animate(children, { opacity: { from: 0 }, y: { from: 20 }, delay: stagger(100), duration: 600, ease: 'outExpo' });
      }
      if (el.matches('.chat-terminal')) {
        animate(el, { opacity: { from: 0 }, y: { from: 25 }, duration: 700, delay: 200, ease: 'outExpo' });
      }
      if (el.matches('.map-container')) {
        initMyMap();
        animate(el, { opacity: { from: 0 }, y: { from: 25 }, duration: 800, delay: 100, ease: 'outExpo' });
      }
      observer.unobserve(el);
    });
  };

  var observer = new IntersectionObserver(onEnter, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  var targets = ['.section-header', '.about-intro', '.tel-card', '.hobby-panel', '.chat-intro', '.chat-terminal', '.map-container'];
  document.querySelectorAll(targets.join(',')).forEach(function(el) { observer.observe(el); });
}

/* =============================================
   9.4 Track Easter Egg
   ============================================= */
(function initTrackEasterEgg() {
  var heroSection = document.getElementById('hero');
  if (!heroSection) return;

  var svg = heroSection.querySelector('.monza-track');
  if (!svg) return;

  var sourcePath = svg.querySelector('path');
  if (!sourcePath) return;

  // Create detect path (CSS handles pointer-events and cursor)
  var detectPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  detectPath.setAttribute('d', sourcePath.getAttribute('d'));
  detectPath.setAttribute('fill', 'none');
  detectPath.setAttribute('stroke', 'transparent');
  detectPath.setAttribute('stroke-width', '22');
  detectPath.classList.add('track-detect');
  svg.appendChild(detectPath);

  // Setup checkpoints
  var CHECKPOINT_COUNT = 8;
  var CHECKPOINT_RADIUS = 22;
  var totalLength = detectPath.getTotalLength();
  var checkpoints = [];
  for (var i = 0; i < CHECKPOINT_COUNT; i++) {
    var pt = detectPath.getPointAtLength((totalLength / CHECKPOINT_COUNT) * i);
    checkpoints.push({ x: pt.x, y: pt.y, hit: false });
  }

  // Sample path points for proximity detection
  var PROXIMITY_TOLERANCE = 30;
  var pathSamples = [];
  var sampleStep = 30;
  for (var d = 0; d <= totalLength; d += sampleStep) {
    var sp = detectPath.getPointAtLength(d);
    pathSamples.push({ x: sp.x, y: sp.y });
  }

  // Generate dots
  var dotsContainer = document.getElementById('trackEggDots');
  var dots = [];
  for (var i = 0; i < CHECKPOINT_COUNT; i++) {
    var dot = document.createElement('div');
    dot.className = 'track-egg-dot';
    dotsContainer.appendChild(dot);
    dots.push(dot);
  }

  // DOM refs
  var hint = document.getElementById('trackEggHint');
  var modalOverlay = document.getElementById('trackEggModalOverlay');
  var modalClose = document.getElementById('trackEggModalClose');
  var hintFaded = false;
  var completed = false;

  // Convert screen coords to SVG coords
  function screenToSVG(clientX, clientY) {
    var pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    var ctm = svg.getScreenCTM();
    if (!ctm) return null;
    return pt.matrixTransform(ctm.inverse());
  }

  // Check if an SVG point is near the path
  function isNearPath(svgPt) {
    for (var i = 0; i < pathSamples.length; i++) {
      var dx = svgPt.x - pathSamples[i].x;
      var dy = svgPt.y - pathSamples[i].y;
      if (Math.sqrt(dx * dx + dy * dy) < PROXIMITY_TOLERANCE) return true;
    }
    return false;
  }

  function resetProgress() {
    completed = false;
    for (var i = 0; i < checkpoints.length; i++) {
      checkpoints[i].hit = false;
      dots[i].classList.remove('hit');
    }
  }

  function checkCompletion() {
    for (var i = 0; i < checkpoints.length; i++) {
      if (!checkpoints[i].hit) return;
    }
    if (completed) return;
    completed = true;
    setTimeout(showModal, 300);
  }

  function showModal() {
    maskSuspended = true;
    layerTop.style.webkitMaskImage = 'none';
    layerTop.style.maskImage = 'none';
    modalOverlay.classList.add('active');
  }

  function hideModal() {
    modalOverlay.classList.remove('active');
    maskSuspended = false;
    resetProgress();
  }

  // Events on heroSection (not detectPath) — avoids mouseleave when crossing over text
  heroSection.addEventListener('mousemove', function(e) {
    var svgPt = screenToSVG(e.clientX, e.clientY);
    if (!svgPt) return;

    if (!isNearPath(svgPt)) {
      if (!completed) resetProgress();
      return;
    }

    if (!hintFaded) {
      hintFaded = true;
      hint.classList.add('faded');
    }

    for (var i = 0; i < checkpoints.length; i++) {
      if (checkpoints[i].hit) continue;
      if (i > 0 && !checkpoints[i - 1].hit) break;

      var dx = svgPt.x - checkpoints[i].x;
      var dy = svgPt.y - checkpoints[i].y;
      if (Math.sqrt(dx * dx + dy * dy) < CHECKPOINT_RADIUS) {
        checkpoints[i].hit = true;
        dots[i].classList.add('hit');
        checkCompletion();
      }
    }
  });

  heroSection.addEventListener('mouseleave', function() {
    if (!completed) resetProgress();
  });

  modalClose.addEventListener('click', hideModal);
  modalOverlay.addEventListener('click', function(e) {
    if (e.target === modalOverlay) hideModal();
  });
})();

/* =============================================
   10. My Map — China Travel Tracker
   ============================================= */
var mapInitialized = false;

async function initMyMap() {
  if (mapInitialized) return;
  var mapContainer = document.getElementById('mapContainer');
  if (!mapContainer) return;
  mapInitialized = true;

  var mod = await import('./map-data.js');
  var CHINA_PROVINCES = mod.CHINA_PROVINCES;
  var NINE_DASH_PATH = mod.NINE_DASH_PATH;
  var NINE_DASH_INSET_PATH = mod.NINE_DASH_INSET_PATH;
  var SOUTH_CHINA_SEA_ISLANDS = mod.SOUTH_CHINA_SEA_ISLANDS;
  var MAP_VIEWBOX = mod.MAP_VIEWBOX;
  var INSET = mod.INSET_VIEWBOX;

  var TRAVELED_CITIES = mod.TRAVELED_CITIES;
  var svg = document.getElementById('chinaMap');
  var tooltip = document.getElementById('mapTooltip');
  if (!svg) return;

  svg.setAttribute('viewBox', MAP_VIEWBOX);

  // Determine which provinces have traveled cities
  var traveledProvinces = {};
  Object.keys(TRAVELED_CITIES).forEach(function(key) {
    var adcode = key.split('_')[0];
    traveledProvinces[adcode] = true;
  });

  function getTraveledCount() {
    return Object.keys(traveledProvinces).length;
  }

  function updateStatsUI() {
    var count = getTraveledCount();
    var pct = Math.round((count / 34) * 100);
    var countEl = document.getElementById('mapProvinceCount');
    var barEl = document.getElementById('mapProgressBar');
    var pctEl = document.getElementById('mapPercent');
    if (countEl) countEl.innerHTML = count + '<span class="unit">/34</span>';
    if (barEl) barEl.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
  }

  // Render province paths
  CHINA_PROVINCES.forEach(function(prov) {
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', prov.path);
    path.classList.add('province-path');
    path.dataset.adcode = prov.adcode;
    path.dataset.name = prov.name;

    var isTraveled = traveledProvinces[prov.adcode];
    if (isTraveled) path.classList.add('visited');

    path.addEventListener('mouseenter', function() {
      tooltip.textContent = prov.shortName + (isTraveled ? ' · 足迹' : '');
      tooltip.classList.add('visible');
    });
    path.addEventListener('mousemove', function(e) {
      var rect = mapContainer.getBoundingClientRect();
      tooltip.style.left = (e.clientX - rect.left) + 'px';
      tooltip.style.top = (e.clientY - rect.top) + 'px';
    });
    path.addEventListener('mouseleave', function() {
      tooltip.classList.remove('visible');
    });
    path.addEventListener('click', function() {
      window.location.href = 'map-detail.html?id=' + prov.adcode;
    });

    svg.appendChild(path);
  });

  // Nine-dash line
  if (NINE_DASH_PATH) {
    var dashPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    dashPath.setAttribute('d', NINE_DASH_PATH);
    dashPath.classList.add('nine-dash-line');
    svg.appendChild(dashPath);
  }

  // Islands
  SOUTH_CHINA_SEA_ISLANDS.forEach(function(isl) {
    var LNG_MIN = 73, LNG_MAX = 136, LAT_MIN = 3, LAT_MAX = 54;
    var SVG_W = 900, SVG_H = 850;
    var x = ((isl.center[0] - LNG_MIN) / (LNG_MAX - LNG_MIN)) * SVG_W;
    var y = ((LAT_MAX - isl.center[1]) / (LAT_MAX - LAT_MIN)) * SVG_H;
    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', 3);
    circle.classList.add('island-marker');
    svg.appendChild(circle);
    var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x + 6);
    text.setAttribute('y', y + 3);
    text.classList.add('island-label');
    text.textContent = isl.name;
    svg.appendChild(text);
  });

  // HK / Macau markers — paths too small at full scale
  CHINA_PROVINCES.forEach(function(prov) {
    if (prov.adcode !== 810000 && prov.adcode !== 820000) return;
    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', prov.labelX);
    circle.setAttribute('cy', prov.labelY);
    circle.setAttribute('r', 5);
    circle.classList.add('province-dot');
    if (traveledProvinces[prov.adcode]) circle.classList.add('visited');
    circle.addEventListener('click', function() {
      window.location.href = 'map-detail.html?id=' + prov.adcode;
    });
    svg.appendChild(circle);
  });

  // South China Sea inset
  if (INSET) {
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', INSET.x);
    rect.setAttribute('y', INSET.y);
    rect.setAttribute('width', INSET.w);
    rect.setAttribute('height', INSET.h);
    rect.classList.add('inset-box');
    svg.appendChild(rect);

    var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', INSET.x + INSET.w / 2);
    label.setAttribute('y', INSET.y + 14);
    label.classList.add('inset-label');
    label.textContent = '南海诸岛';
    svg.appendChild(label);

    // Hainan in inset
    var hainan = CHINA_PROVINCES.find(function(p) { return p.name === '海南省'; });
    if (hainan && hainan.insetPath) {
      var hPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hPath.setAttribute('d', hainan.insetPath);
      hPath.style.fill = '#1a2332';
      hPath.style.stroke = '#2a3a4a';
      hPath.style.strokeWidth = '0.5';
      svg.appendChild(hPath);
    }

    // Nine-dash in inset
    if (NINE_DASH_INSET_PATH) {
      var dashInset = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      dashInset.setAttribute('d', NINE_DASH_INSET_PATH);
      dashInset.style.fill = 'none';
      dashInset.style.stroke = 'rgba(100, 160, 220, 0.4)';
      dashInset.style.strokeWidth = '0.5';
      dashInset.style.strokeDasharray = '3,1.5';
      svg.appendChild(dashInset);
    }
  }

  updateStatsUI();

  // Sync the populated map to the bottom layer clone so both layers align
  var bottomSvg = document.querySelector('#layerBottomInner .map-container svg');
  if (bottomSvg && svg) {
    bottomSvg.setAttribute('viewBox', svg.getAttribute('viewBox') || '');
    bottomSvg.innerHTML = svg.innerHTML;
  }
}

// Map state is now based on TRAVELED_CITIES (hardcoded), no localStorage refresh needed

/* =============================================
   11. Start
   ============================================= */
console.log('[MOB1S] Starting render & animations...');
animateHeroEntrance();
initScrollAnimations();
requestAnimationFrame(animateLoop);
