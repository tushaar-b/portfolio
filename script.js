/**
 * TUSHAAR BHARARA — 3D PORTFOLIO
 * ES Module: Three.js + GLTFLoader + GSAP + AnimationMixer
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* ============================================================
   GSAP is loaded as a classic script before this module runs.
   Access it via window.gsap / window.ScrollTrigger.
   ============================================================ */
const gsap           = window.gsap;
const ScrollTrigger  = window.ScrollTrigger;

/* ============================
   1. LOADER SCREEN
   ============================ */
const loader     = document.getElementById('loader');
const loaderBar  = document.getElementById('loader-bar');
const loaderText = document.getElementById('loader-text');

const messages = ['Initializing…', 'Loading 3D model…', 'Lighting the scene…', 'Almost ready…'];
let mi = 0;
const msgTimer = setInterval(() => { if (mi < messages.length) loaderText.textContent = messages[mi++]; }, 500);

let prog = 0;
const progTimer = setInterval(() => {
  prog += Math.random() * 16;
  if (prog >= 90) { prog = 90; clearInterval(progTimer); }
  loaderBar.style.width = prog + '%';
}, 130);

let loaderFinished = false;
function finishLoader() {
  if (loaderFinished) return;
  loaderFinished = true;
  clearInterval(msgTimer);
  clearInterval(progTimer);
  loaderBar.style.width = '100%';
  setTimeout(() => {
    loader.classList.add('hidden');
    initAnimations();
  }, 500);
}
// Hard fallback — always hide loader after 8 s no matter what
setTimeout(finishLoader, 8000);

/* ============================
   2. SHARED MOUSE
   ============================ */
const mouse = { x: 0, y: 0, nx: 0.5, ny: 0.5 };
document.addEventListener('mousemove', e => {
  mouse.x  = e.clientX;
  mouse.y  = e.clientY;
  mouse.nx = e.clientX / window.innerWidth;
  mouse.ny = e.clientY / window.innerHeight;
});

/* ============================
   3. BACKGROUND PARTICLES
   ============================ */
function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  // Starfield
  const N   = 1800;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const pal = [new THREE.Color(0x7c3aed), new THREE.Color(0x06b6d4), new THREE.Color(0xddddff), new THREE.Color(0x5b21b6)];
  for (let i = 0; i < N; i++) {
    pos[i*3]   = (Math.random() - 0.5) * 200;
    pos[i*3+1] = (Math.random() - 0.5) * 200;
    pos[i*3+2] = (Math.random() - 0.5) * 200;
    const c = pal[Math.floor(Math.random() * pal.length)];
    col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  const pMesh = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.35, vertexColors: true, transparent: true, opacity: 0.6,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  scene.add(pMesh);

  // Wireframe accent shapes
  const octaGeo  = new THREE.OctahedronGeometry(8, 0);
  const octaMesh = new THREE.Mesh(octaGeo, new THREE.MeshBasicMaterial({ color: 0x7c3aed, wireframe: true, transparent: true, opacity: 0.05 }));
  octaMesh.position.set(20, 2, -20);
  scene.add(octaMesh);

  const torusGeo  = new THREE.TorusGeometry(12, 0.5, 6, 40);
  const torusMesh = new THREE.Mesh(torusGeo, new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.04 }));
  torusMesh.position.set(20, 2, -20);
  scene.add(torusMesh);

  const clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    pMesh.rotation.y      = t * 0.02;
    octaMesh.rotation.y   = t * 0.14;
    octaMesh.rotation.x   = t * 0.09;
    torusMesh.rotation.y  = t * 0.10;
    torusMesh.rotation.z  = t * 0.06;
    camera.position.x += ((mouse.nx - 0.5) * 4 - camera.position.x) * 0.03;
    camera.position.y += (-(mouse.ny - 0.5) * 3 - camera.position.y) * 0.03;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
initBackground();

/* ============================
   4. GLB CHARACTER
   ============================ */
function initCharacter() {
  const wrap = document.getElementById('hero-char-wrap');
  if (!wrap) return;

  /* ---- RENDERER ---- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled    = true;
  renderer.shadowMap.type       = THREE.PCFSoftShadowMap;
  renderer.toneMapping          = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure  = 1.4;
  renderer.setClearColor(0x000000, 0);

  const W = wrap.clientWidth  || 480;
  const H = wrap.clientHeight || 560;
  renderer.setSize(W, H);
  Object.assign(renderer.domElement.style, {
    position: 'absolute', top: '0', left: '0',
    width: '100%', height: '100%', pointerEvents: 'none', zIndex: '1'
  });
  wrap.appendChild(renderer.domElement);

  /* ---- SCENE & CAMERA ---- */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);

  /* ---- LIGHTS — cinematic studio look ---- */
  scene.add(new THREE.AmbientLight(0xffe8cc, 1.2));

  const keyLight = new THREE.DirectionalLight(0xfff5e0, 3.8);
  keyLight.position.set(3, 6, 6);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const frontFill = new THREE.DirectionalLight(0xffffff, 2.4);
  frontFill.position.set(0, 1, 10);
  scene.add(frontFill);

  const rimLight = new THREE.PointLight(0x06b6d4, 8, 14);
  rimLight.position.set(4, 3, -3);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0x7c3aed, 6, 14);
  fillLight.position.set(-4, 1, 1);
  scene.add(fillLight);

  const chinLight = new THREE.PointLight(0xffa060, 2.5, 8);
  chinLight.position.set(0, -3, 3);
  scene.add(chinLight);

  /* ---- PLATFORM RINGS ---- */
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x7c3aed, emissive: 0x7c3aed, emissiveIntensity: 0.7, roughness: 0, metalness: 0.5
  });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.025, 8, 64), ringMat);
  ring1.rotation.x = -Math.PI / 2;
  scene.add(ring1);

  const ring2Mat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.5, roughness: 0, metalness: 0.5
  });
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.014, 8, 52), ring2Mat);
  ring2.rotation.x = -Math.PI / 2;
  ring2.position.y = 0.01;
  scene.add(ring2);

  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.92, 36),
    new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.18, depthWrite: false })
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = -0.01;
  scene.add(shadowDisc);

  /* ---- ORBIT PARTICLES ---- */
  const orbits = [];
  for (let i = 0; i < 14; i++) {
    const col  = Math.random() > 0.5 ? 0x7c3aed : 0x06b6d4;
    const size = 0.018 + Math.random() * 0.032;
    const orb  = new THREE.Mesh(
      new THREE.SphereGeometry(size, 8, 8),
      new THREE.MeshBasicMaterial({ color: col })
    );
    orbits.push({
      mesh:   orb,
      angle:  (i / 14) * Math.PI * 2,
      radius: 1.0 + Math.random() * 0.6,
      height: (Math.random() - 0.5) * 2.2,
      speed:  0.28 + Math.random() * 0.38,
      phase:  Math.random() * Math.PI * 2
    });
    scene.add(orb);
  }

  /* ---- LOAD GLB MODEL ---- */
  const gltfLoader = new GLTFLoader();
  const modelUrl = 'character.glb';
  gltfLoader.load(
    modelUrl,

    /* onLoad */
    (gltf) => {
      const model = gltf.scene;

      model.traverse(child => {
        if (child.isMesh) {
          const ln = child.name.toLowerCase();
          
          child.castShadow = true;
          child.receiveShadow = true;
          
          if (child.material) {
            const m = child.material;
            
            // Set clothing colors (clone materials so they don't overwrite each other if shared)
            if (ln.includes('shirt') || (m.name && m.name.toLowerCase().includes('shirt'))) {
               const newMat = m.clone();
               newMat.map = null; // Strip texture for a completely solid appearance
               newMat.color.set("#777777"); // solid grey
               newMat.needsUpdate = true;
               child.material = newMat;
            } else if (ln.includes('pant') || ln.includes('bottom') || (m.name && m.name.toLowerCase().includes('pant'))) {
               const newMat = m.clone();
               newMat.map = null; // Strip texture for completely solid appearance
               newMat.color.set("#ffffff"); 
               newMat.needsUpdate = true;
               child.material = newMat;
            }

            // Improve cap visibility
            if (ln.includes('cap') || ln.includes('hat') || (m.name && (m.name.toLowerCase().includes('cap') || m.name.toLowerCase().includes('hat')))) {
               m.roughness = 0.3;
               m.emissive = new THREE.Color(0x404040);
               m.emissiveIntensity = 0.6; // brighter cap front
            }

            // Eyes / head areas get extra brightness for visibility
            if (m.name && (m.name.toLowerCase().includes('eye') || m.name.toLowerCase().includes('head'))) {
              m.emissive = new THREE.Color(0x222244);
              m.emissiveIntensity = 0.3;
            }
          }
        }
      });

      // Auto-center & scale model so it fills the frame nicely
      const box    = new THREE.Box3().setFromObject(model);
      const size   = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Scale so tallest dimension = 2.2 units
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale  = 2.2 / maxDim;
      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));

      // Shift down so feet are at y=0 (ring level)
      const box2   = new THREE.Box3().setFromObject(model);
      model.position.y -= box2.min.y;

      // Ensure the model stays at the desk-typing angle facing slightly left
      model.rotation.y = -Math.PI / 4.5; // Roughly -40 degrees

      // Wrap in root group for mouse-look without disturbing position
      const root = new THREE.Group();
      root.add(model);
      scene.add(root);

      // Camera: frame head+shoulders — portrait crop like the reference
      const box3   = new THREE.Box3().setFromObject(model);
      const top    = box3.max.y;
      const focusY = top * 0.72;   // look at ~upper-chest / neck area
      camera.position.set(0, focusY, 3.8);
      camera.lookAt(0, focusY * 0.58, 0);

      /* Make character visible & finish loader */
      wrap.style.opacity   = '1';
      wrap.style.transform = 'translateX(0)';
      finishLoader();

      /* ---- ANIMATION ---- */
      const clock = new THREE.Clock();
      let tgtRY = 0, curRY = 0, tgtRX = 0, curRX = 0;

      let mixer = null;
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        // Play 'typing' or default animation
        const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'typing')
                      || THREE.AnimationClip.findByName(gltf.animations, 'Idle')
                      || gltf.animations[0];
        if (idleClip) {
          const action = mixer.clipAction(idleClip);
          action.play();
        }
      }


      (function animate() {
        requestAnimationFrame(animate);
        const dt = clock.getDelta();
        const t  = clock.elapsedTime;

        if (mixer) mixer.update(dt);

        /* Idle float */
        root.position.y = Math.sin(t * 0.7) * 0.03;

        /* Mouse-driven look */
        const rect = wrap.getBoundingClientRect();
        const dx   = (mouse.x - (rect.left + rect.width  / 2)) / (rect.width  / 2);
        const dy   = (mouse.y - (rect.top  + rect.height / 2)) / (rect.height / 2);
        tgtRY = dx * 0.45;
        tgtRX = -dy * 0.2;
        curRY += (tgtRY - curRY) * 0.055;
        curRX += (tgtRX - curRX) * 0.055;
        root.rotation.y = curRY;
        root.rotation.x = curRX;

        /* Ring pulse */
        ringMat.emissiveIntensity  = 0.55 + Math.sin(t * 2.0) * 0.2;
        ring2Mat.emissiveIntensity = 0.35 + Math.sin(t * 2.5) * 0.2;
        shadowDisc.material.opacity = 0.12 + Math.sin(t * 1.2) * 0.05;

        /* Orbit lights */
        fillLight.position.set(Math.cos(t * 0.4) * 5,  1, Math.sin(t * 0.4) * 4);
        rimLight.position.set( Math.cos(t * 0.4 + Math.PI) * 5, 3, Math.sin(t * 0.4 + Math.PI) * 4);

        /* Orbit particles */
        orbits.forEach(o => {
          o.angle += o.speed * 0.01;
          o.mesh.position.set(
            Math.cos(o.angle) * o.radius,
            o.height + Math.sin(t * 0.8 + o.phase) * 0.3,
            Math.sin(o.angle) * o.radius
          );
        });

        renderer.render(scene, camera);
      })();

      new ResizeObserver(() => {
        const w = wrap.clientWidth, h = wrap.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }).observe(wrap);
    },

    /* onProgress */
    undefined,

    /* onError */
    (err) => {
      console.warn('character.glb failed to load:', err);
      finishLoader();
      wrap.style.opacity   = '1';
      wrap.style.transform = 'translateX(0)';
    }
  );
}
initCharacter();

/* ============================
   5. CUSTOM CURSOR
   ============================ */
(function initCursor() {
  if (window.innerWidth <= 768) return;
  const cursor   = document.getElementById('cursor');
  const follower = document.getElementById('cursor-follower');
  if (!cursor || !follower) return;
  let fx = 0, fy = 0;
  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });
  (function move() {
    fx += ((parseFloat(cursor.style.left) || 0) - fx) * 0.12;
    fy += ((parseFloat(cursor.style.top)  || 0) - fy) * 0.12;
    follower.style.left = fx + 'px';
    follower.style.top  = fy + 'px';
    requestAnimationFrame(move);
  })();
  document.querySelectorAll('a, button, .card-3d, .project-card, .course-card').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
})();

/* ============================
   6. NAVIGATION
   ============================ */
(function initNav() {
  const nav = document.getElementById('nav');
  const ham = document.getElementById('hamburger');
  const mob = document.getElementById('mobile-menu');
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 20));
  if (ham && mob) {
    ham.addEventListener('click', () => { ham.classList.toggle('open'); mob.classList.toggle('open'); });
    mob.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', () => {
      ham.classList.remove('open'); mob.classList.remove('open');
    }));
  }
})();

/* ============================
   7. GSAP SCROLL ANIMATIONS
   ============================ */
function initAnimations() {
  if (!gsap) { initIO(); return; }
  if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  // Hero entrance
  document.querySelectorAll('.hero-section .reveal-up, .hero-section .reveal-right').forEach(el => {
    const dm = { 'delay-1': 0.1, 'delay-2': 0.2, 'delay-3': 0.3, 'delay-4': 0.4, 'delay-5': 0.5, 'delay-6': 0.6 };
    let d = 0;
    el.classList.forEach(c => { if (dm[c]) d = dm[c]; });
    gsap.to(el, { opacity: 1, x: 0, y: 0, duration: 0.9, delay: 0.5 + d, ease: 'power3.out' });
  });

  if (ScrollTrigger) {
    document.querySelectorAll('.section .reveal-up, .section .reveal-right').forEach(el => {
      const dm = { 'delay-1': 0.1, 'delay-2': 0.2, 'delay-3': 0.3, 'delay-4': 0.4, 'delay-5': 0.5 };
      let d = 0;
      el.classList.forEach(c => { if (dm[c]) d = dm[c]; });
      gsap.to(el, {
        opacity: 1, x: 0, y: 0, duration: 0.85, delay: d, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
    document.querySelectorAll('.skill-fill').forEach(bar => {
      gsap.to(bar, {
        width: bar.getAttribute('data-width') + '%', duration: 1.4, ease: 'power3.out',
        scrollTrigger: { trigger: bar, start: 'top 90%', once: true }
      });
    });
  }
}

function initIO() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal-up, .reveal-right').forEach(el => obs.observe(el));
  document.querySelectorAll('.skill-fill').forEach(bar => {
    const o = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { bar.style.width = bar.getAttribute('data-width') + '%'; o.unobserve(e.target); } });
    }, { threshold: 0.1 });
    o.observe(bar);
  });
}

/* ============================
   8. 3D CARD TILT
   ============================ */
document.querySelectorAll('.card-3d').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r  = card.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
    const dy = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
    card.style.transform = `perspective(900px) rotateX(${dy * -7}deg) rotateY(${dx * 7}deg) translateZ(8px)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

/* ============================
   9. SCROLL PROGRESS BAR
   ============================ */
const bar = document.createElement('div');
bar.style.cssText = 'position:fixed;top:0;left:0;height:2px;width:0%;background:linear-gradient(90deg,#7c3aed,#06b6d4);z-index:10001;pointer-events:none;';
document.body.appendChild(bar);
window.addEventListener('scroll', () => {
  bar.style.width = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100) + '%';
});

/* ============================
   10. SMOOTH SCROLL
   ============================ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

/* ============================
   11. STAT COUNTERS
   ============================ */
const cObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target, text = el.textContent.trim();
    if (/^\d+/.test(text)) {
      const end = parseInt(text.replace(/\D/g, ''));
      const t0  = performance.now();
      const tick = now => {
        const p = Math.min((now - t0) / 1200, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * end) + (text.includes('+') ? '+' : '');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    cObs.unobserve(el);
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-num').forEach(el => cObs.observe(el));