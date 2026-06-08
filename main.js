"use strict";

/* ------------------------------------------------------------------ *
 *  DYY — personal site visuals
 *  A single luminous line that begins as a DNA double-helix on the
 *  left and morphs into an EEG brain-wave on the right.
 * ------------------------------------------------------------------ */

const COLORS = {
  dna: "#3f352c", // espresso
  dna2: "#6b5a45", // lighter brown
  wave: "#9b876e", // warm taupe
  wave2: "#b6a79e", // pale taupe
};

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* Smoothstep easing between edge0 and edge1. */
function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

const lerp = (a, b, t) => a + (b - a) * t;

/* Set up a canvas for crisp rendering on HiDPI displays. */
function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: rect.width, h: rect.height };
}

/* ------------------------------------------------------------------ *
 *  HERO : helix  ->  brain-wave morph
 * ------------------------------------------------------------------ */
function initHero() {
  const canvas = document.getElementById("strandCanvas");
  if (!canvas) return;
  let ctx, W, H;

  function resize() {
    ({ ctx, w: W, h: H } = fitCanvas(canvas));
  }
  resize();
  window.addEventListener("resize", resize);

  const STEP = 5; // px between samples along x
  let time = 0;

  /* EEG-like composite wave, normalised roughly to [-1, 1]. */
  function brainWave(x, t) {
    return (
      0.55 * Math.sin(x * 0.012 - t * 1.3) +
      0.28 * Math.sin(x * 0.03 + t * 0.9) +
      0.17 * Math.sin(x * 0.061 - t * 2.1) +
      0.1 * Math.sin(x * 0.11 + t * 1.7)
    );
  }

  function frame() {
    time += prefersReducedMotion ? 0 : 0.012;
    ctx.clearRect(0, 0, W, H);

    const centerY = H * 0.5;
    const helixAmp = Math.min(H * 0.16, 150);
    const waveAmp = Math.min(H * 0.13, 120);
    const turns = 0.022; // helix angular frequency

    const strandA = [];
    const strandB = [];
    const blends = [];

    for (let x = -20; x <= W + 20; x += STEP) {
      const t = x / W;
      // morph region: helix on the left, wave on the right
      const b = smoothstep(0.34, 0.72, t);
      const phase = x * turns - time * 1.6;

      const helixA = centerY + Math.sin(phase) * helixAmp;
      const helixB = centerY + Math.sin(phase + Math.PI) * helixAmp;

      const wv = centerY + brainWave(x, time) * waveAmp;

      strandA.push({ x, y: lerp(helixA, wv, b) });
      strandB.push({ x, y: lerp(helixB, wv, b), phase });
      blends.push(b);
    }

    // Base-pair "rungs" — fade out as the helix becomes a wave.
    for (let i = 0; i < strandA.length; i += 3) {
      const b = blends[i];
      if (b > 0.85) continue;
      const a = strandA[i];
      const c = strandB[i];
      const alpha = (1 - b) * 0.38;
      const grad = ctx.createLinearGradient(a.x, a.y, c.x, c.y);
      grad.addColorStop(0, COLORS.dna);
      grad.addColorStop(1, COLORS.dna2);
      ctx.strokeStyle = grad;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(c.x, c.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Horizontal gradient: DNA hues -> brain-wave hues.
    const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
    lineGrad.addColorStop(0, COLORS.dna);
    lineGrad.addColorStop(0.4, COLORS.dna2);
    lineGrad.addColorStop(0.72, COLORS.wave);
    lineGrad.addColorStop(1, COLORS.wave2);

    drawStrand(ctx, strandA, lineGrad);
    drawStrand(ctx, strandB, lineGrad);

    // Glowing nodes where strands cross to the front of the helix.
    for (let i = 0; i < strandB.length; i += 3) {
      const p = strandB[i];
      const b = blends[i];
      if (b > 0.6) continue;
      const front = Math.sin(p.phase);
      if (front < 0.55) continue;
      const r = lerp(3, 1.2, b);
      ctx.globalAlpha = (1 - b) * 0.85;
      ctx.fillStyle = COLORS.dna;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(frame);
  }

  function drawStrand(ctx, pts, stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.stroke();
  }

  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------------ *
 *  CARD : pure DNA double-helix motif
 * ------------------------------------------------------------------ */
function initDnaCard() {
  const canvas = document.getElementById("dnaCanvas");
  if (!canvas) return;
  let ctx, W, H;
  function resize() {
    ({ ctx, w: W, h: H } = fitCanvas(canvas));
  }
  resize();
  window.addEventListener("resize", resize);

  let time = 0;
  function frame() {
    time += prefersReducedMotion ? 0 : 0.02;
    ctx.clearRect(0, 0, W, H);

    const cx = W * 0.5;
    const amp = Math.min(W * 0.22, 90);
    const STEP = 7;

    const left = [];
    const right = [];
    for (let y = -10; y <= H + 10; y += STEP) {
      const phase = y * 0.045 - time * 1.4;
      const xa = cx + Math.sin(phase) * amp;
      const xb = cx + Math.sin(phase + Math.PI) * amp;
      left.push({ x: xa, y, phase });
      right.push({ x: xb, y });
    }

    for (let i = 0; i < left.length; i += 1) {
      const depth = (Math.sin(left[i].phase) + 1) / 2;
      ctx.globalAlpha = 0.25 + depth * 0.5;
      const g = ctx.createLinearGradient(left[i].x, 0, right[i].x, 0);
      g.addColorStop(0, COLORS.dna);
      g.addColorStop(1, COLORS.dna2);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(left[i].x, left[i].y);
      ctx.lineTo(right[i].x, right[i].y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    drawVStrand(ctx, left, COLORS.dna);
    drawVStrand(ctx, right, COLORS.dna2);

    requestAnimationFrame(frame);
  }

  function drawVStrand(ctx, pts, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.stroke();
  }

  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------------ *
 *  CARD : pure brain-wave / EEG motif
 * ------------------------------------------------------------------ */
function initWaveCard() {
  const canvas = document.getElementById("waveCanvas");
  if (!canvas) return;
  let ctx, W, H;
  function resize() {
    ({ ctx, w: W, h: H } = fitCanvas(canvas));
  }
  resize();
  window.addEventListener("resize", resize);

  let time = 0;
  const lines = [
    { amp: 0.5, color: COLORS.wave, speed: 1.3, off: 0 },
    { amp: 0.32, color: COLORS.dna2, speed: 0.9, off: 1.4 },
    { amp: 0.2, color: COLORS.wave2, speed: 2.0, off: 3.1 },
  ];

  function frame() {
    time += prefersReducedMotion ? 0 : 0.016;
    ctx.clearRect(0, 0, W, H);
    const cy = H * 0.5;

    lines.forEach((ln, idx) => {
      const baseAmp = Math.min(H * 0.16, 60) * ln.amp;
      ctx.strokeStyle = ln.color;
      ctx.globalAlpha = idx === 0 ? 0.95 : 0.55;
      ctx.lineWidth = idx === 0 ? 2.2 : 1.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let x = 0; x <= W; x += 4) {
        const y =
          cy +
          baseAmp *
            (Math.sin(x * 0.02 - time * ln.speed + ln.off) +
              0.5 * Math.sin(x * 0.055 + time * ln.speed * 0.7 + ln.off));
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  initHero();
  initDnaCard();
  initWaveCard();
});
