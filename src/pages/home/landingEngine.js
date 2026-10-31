import Lenis from 'lenis';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const CHAPTERS = 4;
const PRELOAD_MS = 1500;

/**
 * Wires the imperative parts of the homepage: smooth scroll, the pinned
 * Growth Loop stage with WebGL particles, the horizontal course rail, the
 * "Dulu vs Sekarang" scanner and scroll reveals. React keeps owning the markup;
 * this only toggles classes and inline styles React never sets.
 */
export function initLanding(root, { showPreloader, onChapter, onReady }) {
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const html = document.documentElement;
  const cleanups = [];
  let disposed = false;

  const listen = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    cleanups.push(() => target.removeEventListener(type, fn, opts));
  };
  const later = (fn, ms) => {
    const id = setTimeout(fn, ms);
    cleanups.push(() => clearTimeout(id));
  };

  window.scrollTo({ top: 0, behavior: 'instant' });
  if (showPreloader) html.classList.add('lp-lock');

  let lenis = null;
  if (!reduced) {
    try {
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      if (showPreloader) lenis.stop();
    } catch {
      lenis = null;
    }
  }
  const scrollToY = (y, duration = 1.4) => {
    if (lenis) lenis.scrollTo(y, { duration });
    else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  };

  /* ---------- layout ---------- */
  const stage = $('.lp-stage');
  const chaps = $$('.chap');
  const scanSec = $('.scan');
  const scanSticky = $('.scan-sticky');
  const track = $('.c-track');
  const cSec = $('.courses');
  const cView = $('.c-view');
  const cBar = $('.c-prog i');
  const loopnav = $('.loopnav');
  const loopProg = $('.loopnav .p');
  const tl = { stageTop: 0, stageH: 0, desk: false, maxShift: 0, cTop: 0, cH: 0, scanTop: 0, scanH: 0 };
  const absTop = (el) => el.getBoundingClientRect().top + window.scrollY;
  // scroll position where chapter k sits fully settled
  const chapY = (k) => tl.stageTop + clamp((k + 0.15) / 3.3) * (tl.stageH - window.innerHeight);

  function layout() {
    tl.desk = window.innerWidth > 900;
    if (tl.desk) {
      track.style.transform = 'translate3d(0,0,0)';
      tl.maxShift = Math.max(0, track.scrollWidth - cView.clientWidth);
      cSec.style.height = `${window.innerHeight + tl.maxShift}px`;
    } else {
      cSec.style.height = '';
      track.style.transform = '';
      tl.maxShift = 0;
    }
    tl.stageTop = absTop(stage);
    tl.stageH = stage.offsetHeight;
    tl.cTop = absTop(cSec);
    tl.cH = cSec.offsetHeight;
    tl.scanTop = absTop(scanSec);
    tl.scanH = scanSec.offsetHeight;
  }

  /* ---------- in-page anchors ---------- */
  listen(root, 'click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id.length > 1 && root.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (target.classList.contains('chap')) scrollToY(chapY(Number(target.dataset.k)), 1.6);
    else scrollToY(absTop(target) - 10);
  });

  /* ---------- reveals ---------- */
  const observed = new WeakSet();
  const io = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }),
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );
  cleanups.push(() => io.disconnect());
  function observeReveals() {
    $$('[data-reveal],[data-split]').forEach((el) => {
      if (observed.has(el) || el.closest('.chap')) return;
      observed.add(el);
      io.observe(el);
    });
  }
  observeReveals();

  /* ---------- particles (three.js loads in its own chunk) ---------- */
  let particles = null;
  const particlesReady = import('./particles.js')
    .then(({ createParticles }) => {
      if (disposed) return;
      particles = createParticles({ canvas: $('.lp-gl'), sticky: $('.stage-sticky'), haze: $('.haze'), reduced });
    })
    .catch(() => {});

  /* ---------- chapters ---------- */
  let active = -1;
  let ready = false;
  function setChapter(k) {
    if (k === active) return;
    active = k;
    chaps.forEach((c, i) => {
      c.classList.toggle('act', i === k);
      c.classList.toggle('past', i < k);
    });
    onChapter(k);
  }

  /* ---------- dulu vs sekarang ---------- */
  const pairs = $$('.pair');
  function scanFrame(p) {
    const n = pairs.length;
    pairs.forEach((el, k) => {
      const t = p * n - k;
      let o = smooth(-0.02, 0.1, t) * (1 - smooth(0.9, 1.0, t));
      if (k === 0 && t < 0.1) o = 1;
      if (k === n - 1 && t > 0.9) o = 1;
      const s = clamp((t - 0.12) / 0.6);
      const so = Math.min(1, s * 12, (1 - s) * 12);
      el.style.opacity = o.toFixed(3);
      el.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
      el.style.setProperty('--s', s.toFixed(4));
      el.style.setProperty('--so', so.toFixed(3));
      if (o > 0.5) {
        const lines = el.querySelector('.lines').getBoundingClientRect();
        scanSticky.style.setProperty('--sx', `${(lines.left + s * lines.width).toFixed(0)}px`);
        scanSticky.dataset.step = String(k);
      }
    });
  }
  const scanSteps = $$('.scan-steps span');

  /* ---------- main loop ---------- */
  let raf = 0;
  let lastStep = '';
  function loop(now) {
    if (lenis) lenis.raf(now);
    const y = window.scrollY;
    const p = clamp((y - tl.stageTop) / Math.max(1, tl.stageH - window.innerHeight));
    const s = clamp(p * 3.3 - 0.15, 0, CHAPTERS - 1);
    if (ready) setChapter(Math.round(s));
    if (loopProg) loopProg.style.strokeDashoffset = (100 - (s / (CHAPTERS - 1)) * 100).toFixed(2);
    if (loopnav) loopnav.classList.toggle('hide', y > tl.stageTop + tl.stageH - window.innerHeight * 1.1);
    if (particles && y < tl.stageTop + tl.stageH) particles.frame(now / 1000, s);
    if (tl.desk) {
      const cp = clamp((y - tl.cTop) / Math.max(1, tl.cH - window.innerHeight));
      track.style.transform = `translate3d(${(-cp * tl.maxShift).toFixed(1)}px,0,0)`;
      cBar.style.transform = `scaleX(${cp.toFixed(4)})`;
    }
    if (y + window.innerHeight > tl.scanTop && y < tl.scanTop + tl.scanH) {
      scanFrame(clamp((y - tl.scanTop) / Math.max(1, tl.scanH - window.innerHeight)));
      const step = scanSticky.dataset.step || '0';
      if (step !== lastStep) {
        lastStep = step;
        scanSteps.forEach((sp, k) => sp.classList.toggle('on', String(k) === step));
      }
    }
    raf = requestAnimationFrame(loop);
  }

  listen(cView, 'scroll', () => {
    if (tl.desk) return;
    const ratio = cView.scrollLeft / Math.max(1, cView.scrollWidth - cView.clientWidth);
    cBar.style.transform = `scaleX(${clamp(ratio).toFixed(4)})`;
  }, { passive: true });

  listen(window, 'resize', () => {
    layout();
    if (particles) particles.resize();
  });
  const ro = new ResizeObserver(() => layout());
  ro.observe(root);
  cleanups.push(() => ro.disconnect());

  /* ---------- boot ---------- */
  function reveal() {
    if (ready || disposed) return;
    ready = true;
    html.classList.remove('lp-lock');
    if (lenis) lenis.start();
    onReady();
  }

  layout();
  raf = requestAnimationFrame(loop);
  cleanups.push(() => cancelAnimationFrame(raf));

  if (showPreloader) {
    const draw = $('.lp-preloader .draw');
    const segs = $$('.lp-preloader .segs i');
    const t0 = performance.now();
    const duration = reduced ? 300 : PRELOAD_MS;
    let timerDone = false;
    let assetsDone = false;
    const maybeReveal = () => {
      if (timerDone && assetsDone) later(reveal, 150);
    };
    let praf = 0;
    const tick = (now) => {
      const pr = clamp((now - t0) / duration);
      const e = 1 - Math.pow(1 - pr, 3);
      if (draw) draw.style.strokeDashoffset = (100 * (1 - e)).toFixed(1);
      segs.forEach((sg, k) => sg.classList.toggle('on', e >= (k + 1) / segs.length - 0.001));
      if (pr < 1) praf = requestAnimationFrame(tick);
      else {
        timerDone = true;
        maybeReveal();
      }
    };
    praf = requestAnimationFrame(tick);
    cleanups.push(() => cancelAnimationFrame(praf));
    particlesReady.finally(() => {
      assetsDone = true;
      maybeReveal();
    });
    later(reveal, 6000);
  } else {
    later(reveal, 60);
  }

  return {
    goChapter: (k) => scrollToY(chapY(k), 1.6),
    refresh: () => {
      observeReveals();
      layout();
    },
    pause: () => lenis && lenis.stop(),
    resume: () => lenis && lenis.start(),
    destroy: () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
      if (lenis) lenis.destroy();
      if (particles) particles.dispose();
      html.classList.remove('lp-lock');
      cSec.style.height = '';
      // the next route should start at the top, not at the old pinned-scroll depth
      window.scrollTo({ top: 0, behavior: 'instant' });
    },
  };
}
