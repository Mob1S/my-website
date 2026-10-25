import * as THREE from 'three';
export function startParticles(canvas, onFps) {
let scene, camera, renderer, particleSystem, geometry, material;
let PARTICLE_COUNT = 0;
let homePositions, velocities;



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


const mouse={x:0,y:0},targetMouse={x:0,y:0};
let frame=0,frameCount=0,lastFpsTime=performance.now();
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
  frame = requestAnimationFrame(animateLoop);

  const dt = Math.min(clock.getDelta(), 0.1);

  // FPS
  frameCount++;
  if (timestamp - lastFpsTime >= 1000) {
    const fps = Math.round(frameCount / ((timestamp - lastFpsTime) / 1000));
    onFps(fps);
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


}
const move=e=>{targetMouse.x=e.clientX/window.innerWidth*2-1;targetMouse.y=1-e.clientY/window.innerHeight*2};
const resize=()=>{if(camera&&renderer){camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight)}};
window.addEventListener('pointermove',move,{passive:true});
window.addEventListener('resize',resize);
frame=requestAnimationFrame(animateLoop);
return ()=>{cancelAnimationFrame(frame);window.removeEventListener('pointermove',move);window.removeEventListener('resize',resize);geometry?.dispose();material?.dispose();renderer?.dispose();renderer?.forceContextLoss()};
}
