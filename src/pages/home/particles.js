import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  MathUtils,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const gauss = () => (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2;
const randDir = () => {
  const u = Math.random() * 2 - 1;
  const th = Math.random() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return [s * Math.cos(th), u, s * Math.sin(th)];
};

// 00 Mulai: the AIGrowth ∞ — three parallel strands with pixel gaps, like the logo
function shapeInfinity(n) {
  const a = new Float32Array(n * 3);
  const A = 3.0;
  const lem = (t) => {
    const s = Math.sin(t);
    const c = Math.cos(t);
    const d = 1 + s * s;
    return [(A * c) / d, (A * s * c) / d];
  };
  for (let i = 0; i < n; i++) {
    let x;
    let y;
    let z;
    if (Math.random() < 0.9) {
      const t = Math.random() * Math.PI * 2;
      const [px, py] = lem(t);
      const [qx, qy] = lem(t + 0.001);
      let tx = qx - px;
      let ty = qy - py;
      const l = Math.hypot(tx, ty) || 1;
      tx /= l;
      ty /= l;
      const lane = (Math.floor(Math.random() * 3) - 1) * 0.2;
      let off = lane + gauss() * 0.022;
      let oz = gauss() * 0.08;
      const seg = (t / (Math.PI * 2)) * 64 + lane * 4;
      if (seg - Math.floor(seg) < 0.18) {
        off += gauss() * 0.4;
        oz += gauss() * 0.4;
      }
      x = px - ty * off;
      y = py + tx * off;
      z = oz;
    } else {
      const d = randDir();
      const r = 1.5 + Math.random() * 3.5;
      x = d[0] * r * 1.2;
      y = d[1] * r * 0.5;
      z = d[2] * r;
    }
    a[i * 3] = x;
    a[i * 3 + 1] = y;
    a[i * 3 + 2] = z;
  }
  return a;
}

// 01 Belajar: neural network
function shapeNetwork(n) {
  const M = 38;
  const nodes = [];
  for (let i = 0; i < M; i++) {
    const d = randDir();
    const r = 2.75 * Math.cbrt(Math.random() * 0.85 + 0.15);
    nodes.push([d[0] * r * 1.15, d[1] * r * 0.85, d[2] * r]);
  }
  const edges = [];
  const seen = new Set();
  nodes.forEach((p, i) => {
    nodes
      .map((q, j) => [j, (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2])
      .filter((x) => x[0] !== i)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .forEach(([j]) => {
        const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push([i, j]);
        }
      });
  });
  const weights = nodes.map(() => 0.4 + Math.random() * 1.6);
  const total = weights.reduce((s, v) => s + v, 0);
  const pick = () => {
    let r = Math.random() * total;
    for (let i = 0; i < M; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return M - 1;
  };
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = Math.random();
    let x;
    let y;
    let z;
    if (r < 0.4) {
      const node = nodes[pick()];
      const s = 0.12 + Math.random() * 0.22;
      x = node[0] + gauss() * s;
      y = node[1] + gauss() * s;
      z = node[2] + gauss() * s;
    } else if (r < 0.94) {
      const e = edges[(Math.random() * edges.length) | 0];
      const p = nodes[e[0]];
      const q = nodes[e[1]];
      const u = Math.random();
      x = p[0] + (q[0] - p[0]) * u + gauss() * 0.025;
      y = p[1] + (q[1] - p[1]) * u + gauss() * 0.025;
      z = p[2] + (q[2] - p[2]) * u + gauss() * 0.025;
    } else {
      const d = randDir();
      const rr = 3 + Math.random() * 2.2;
      x = d[0] * rr;
      y = d[1] * rr * 0.8;
      z = d[2] * rr;
    }
    a[i * 3] = x;
    a[i * 3 + 1] = y;
    a[i * 3 + 2] = z;
  }
  return a;
}

// 02 Praktik: flowing data surface
function shapeWave(n) {
  const a = new Float32Array(n * 3);
  const rows = 38;
  const W = 3.6;
  const D = 2.6;
  const tilt = 0.62;
  const f = (x, z) => 0.55 * Math.sin(x * 1.05 + z * 0.7) + 0.32 * Math.cos(z * 1.6 - x * 0.45) + 0.12 * Math.sin(x * 3.1);
  for (let i = 0; i < n; i++) {
    let x;
    let z;
    let r;
    let tries = 0;
    do {
      r = Math.random();
      if (r < 0.8) {
        const row = (Math.random() * rows) | 0;
        z = -D + (row / (rows - 1)) * 2 * D;
        x = (Math.random() * 2 - 1) * W;
      } else {
        x = (Math.random() * 2 - 1) * W;
        z = (Math.random() * 2 - 1) * D;
      }
    } while (++tries < 6 && Math.random() < Math.pow(Math.max(Math.abs(x) / W, Math.abs(z) / D), 4));
    let y = f(x, z);
    if (r > 0.96) y += 0.3 + Math.random() * 1.8;
    a[i * 3] = x;
    a[i * 3 + 1] = y * Math.cos(tilt) - z * Math.sin(tilt);
    a[i * 3 + 2] = y * Math.sin(tilt) + z * Math.cos(tilt);
  }
  return a;
}

// 03 Tumbuh: rising growth spiral
function shapeSpiral(n) {
  const a = new Float32Array(n * 3);
  const H = 4.4;
  const y0 = -2.2;
  for (let i = 0; i < n; i++) {
    const r = Math.random();
    let x;
    let y;
    let z;
    if (r < 0.72) {
      const t = Math.random();
      const strand = Math.random() < 0.5 ? 0 : Math.PI;
      const rad = 0.3 + t * 1.95;
      const th = t * Math.PI * 5 + strand;
      x = Math.cos(th) * rad + gauss() * 0.07;
      z = Math.sin(th) * rad + gauss() * 0.07;
      y = y0 + t * H + gauss() * 0.05;
    } else if (r < 0.9) {
      const t = Math.pow(Math.random(), 0.7);
      const rad = (0.3 + t * 1.95) * Math.sqrt(Math.random());
      const th = Math.random() * Math.PI * 2;
      x = Math.cos(th) * rad;
      z = Math.sin(th) * rad;
      y = y0 + t * H;
    } else {
      const rad = Math.random() * 2.4;
      const th = Math.random() * Math.PI * 2;
      x = Math.cos(th) * rad;
      z = Math.sin(th) * rad;
      y = y0 + H * 0.75 + Math.random() * 1.8;
    }
    a[i * 3] = x;
    a[i * 3 + 1] = y;
    a[i * 3 + 2] = z;
  }
  return a;
}

// w = shape width (world units); fx/fy = offset as a fraction of half the viewport; a = opacity
const SHAPES = [
  { w: 6.9, desk: { fx: 0, fy: -0.04, fit: 1.62, a: 1 }, mob: { fx: 0, fy: -0.6, fit: 1.0, a: 0.95 }, rot: (t, mx, my) => [0.1 + my * 0.1, Math.sin(t * 0.3) * 0.22 + mx * 0.2] },
  { w: 6.4, desk: { fx: 0.48, fy: 0, fit: 1.05, a: 1 }, mob: { fx: 0, fy: 0.46, fit: 0.98, a: 1 }, rot: (t, mx, my) => [0.2 + my * 0.2, Math.sin(t * 0.12) * 1.4 + mx * 0.4] },
  { w: 7.2, desk: { fx: -0.46, fy: -0.02, fit: 1.0, a: 1 }, mob: { fx: 0, fy: 0.5, fit: 1.0, a: 1 }, rot: (t, mx, my) => [my * 0.15, Math.sin(t * 0.25) * 0.25 + mx * 0.3 + 0.35] },
  { w: 4.6, desk: { fx: 0, fy: 0.42, fit: 0.46, a: 1 }, mob: { fx: 0, fy: 0.42, fit: 0.88, a: 1 }, rot: (t, mx, my) => [0.3 + my * 0.1, Math.sin(t * 0.18) * 2.4 + mx * 0.3] },
];

export function createParticles({ canvas, sticky, haze, reduced }) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 12;

  const mobile = window.innerWidth < 900;
  const N = mobile ? 9000 : 15000;
  const shapes = [shapeInfinity(N), shapeNetwork(N), shapeWave(N), shapeSpiral(N)];

  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const size = new Float32Array(N);
  const rnd = new Float32Array(N * 3);
  const phase = new Float32Array(N);
  const delay = new Float32Array(N);
  // brand palette: cyan, blue, light cyan, royal blue, white
  const palette = [[0, 0.82, 1], [0.227, 0.482, 0.835], [0.545, 0.914, 1], [0.145, 0.388, 0.922], [0.92, 0.97, 1]];
  for (let i = 0; i < N; i++) {
    const r = Math.random();
    const c = r < 0.38 ? palette[0] : r < 0.6 ? palette[1] : r < 0.8 ? palette[2] : r < 0.93 ? palette[3] : palette[4];
    col.set(c, i * 3);
    const sr = Math.random();
    size[i] = sr < 0.75 ? 0.7 + Math.random() * 0.6 : sr < 0.97 ? 1.4 + Math.random() * 0.8 : 2.4 + Math.random() * 1.4;
    const d = randDir();
    const m = 0.5 + Math.random() * 1.2;
    rnd[i * 3] = d[0] * m;
    rnd[i * 3 + 1] = d[1] * m;
    rnd[i * 3 + 2] = d[2] * m;
    phase[i] = Math.random() * Math.PI * 2;
    delay[i] = Math.random() * 0.3;
  }
  pos.set(shapes[0]);

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('color', new BufferAttribute(col, 3));
  geo.setAttribute('aSize', new BufferAttribute(size, 1));
  const mat = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uPR: { value: renderer.getPixelRatio() }, uSize: { value: mobile ? 1.5 : 1.8 }, uOpacity: { value: 1 } },
    vertexShader: `attribute float aSize; attribute vec3 color; varying vec3 vC; varying float vD; uniform float uPR; uniform float uSize;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; vC = color; vD = clamp((-mv.z - 8.0) / 8.0, 0.0, 1.0);
      gl_PointSize = max(1.0, aSize * uSize * uPR * (12.0 / -mv.z)); }`,
    fragmentShader: `varying vec3 vC; varying float vD; uniform float uOpacity;
      void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; float a = smoothstep(0.5, 0.0, d) * uOpacity * (1.0 - vD * 0.6); gl_FragColor = vec4(vC, a * 0.75); }`,
  });
  const points = new Points(geo, mat);
  scene.add(points);

  let halfH = 0;
  let halfW = 0;
  let vw = 0;
  let vh = 0;
  let isMob = mobile;
  let lastW = 0;
  let lastH = 0;
  function resize(force) {
    const w = sticky.clientWidth;
    const h = sticky.clientHeight;
    // mobile URL bars change the height constantly; only react to real size changes
    if (!force && w === lastW && Math.abs(h - lastH) < 120) return;
    lastW = vw = w;
    lastH = vh = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    halfH = Math.tan(MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    halfW = halfH * camera.aspect;
    isMob = window.innerWidth < 900;
  }
  resize(true);

  const place = (k) => {
    const shape = SHAPES[k];
    const c = isMob ? shape.mob : shape.desk;
    const s = isMob ? Math.min(1, (c.fit * 2 * halfW) / shape.w) : Math.min(1.6, (c.fit * halfW) / shape.w);
    return { x: c.fx * halfW, y: c.fy * halfH, s, a: c.a };
  };

  let mx = 0;
  let my = 0;
  let tmx = 0;
  let tmy = 0;
  const onMove = (e) => {
    tmx = (e.clientX / window.innerWidth) * 2 - 1;
    tmy = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  function frame(t, s) {
    mx += (tmx - mx) * 0.04;
    my += (tmy - my) * 0.04;
    const n = shapes.length;
    const i = Math.min(n - 1, Math.floor(s));
    const j = Math.min(n - 1, i + 1);
    const tt = i === j ? 0 : smooth(0.2, 0.8, s - i);
    const A = shapes[i];
    const B = shapes[j];
    const wob = reduced ? 0 : 0.03;
    for (let k = 0; k < N; k++) {
      let lt = clamp(tt * 1.3 - delay[k]);
      lt = lt * lt * (3 - 2 * lt);
      const ex = Math.sin(Math.PI * lt);
      const o = k * 3;
      const ph = phase[k];
      pos[o] = A[o] + (B[o] - A[o]) * lt + rnd[o] * ex + Math.sin(t * 0.7 + ph) * wob;
      pos[o + 1] = A[o + 1] + (B[o + 1] - A[o + 1]) * lt + rnd[o + 1] * ex + Math.cos(t * 0.6 + ph) * wob;
      pos[o + 2] = A[o + 2] + (B[o + 2] - A[o + 2]) * lt + rnd[o + 2] * ex;
    }
    geo.attributes.position.needsUpdate = true;
    const pa = place(i);
    const pb = place(j);
    const ra = SHAPES[i].rot(t, mx, my);
    const rb = SHAPES[j].rot(t, mx, my);
    const px = lerp(pa.x, pb.x, tt);
    const py = lerp(pa.y, pb.y, tt);
    points.position.set(px, py, 0);
    points.scale.setScalar(lerp(pa.s, pb.s, tt));
    points.rotation.set(lerp(ra[0], rb[0], tt), lerp(ra[1], rb[1], tt), 0);
    mat.uniforms.uOpacity.value = lerp(pa.a, pb.a, tt);
    if (haze) {
      const sx = vw / 2 + (px / halfW) * (vw / 2);
      const sy = vh / 2 - (py / halfH) * (vh / 2);
      haze.style.transform = `translate3d(${(sx - 410).toFixed(1)}px,${(sy - 410).toFixed(1)}px,0)`;
    }
    renderer.render(scene, camera);
  }

  function dispose() {
    window.removeEventListener('pointermove', onMove);
    geo.dispose();
    mat.dispose();
    renderer.dispose();
  }

  return { frame, resize, dispose };
}
