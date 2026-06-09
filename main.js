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

/* ------------------------------------------------------------------ *
 *  PUBLICATIONS PAGE : classic horizontal double-helix (right side)
 *  A clear DNA ladder twisting along the x-axis, with base-pair rungs
 *  and depth shading. Distinct from the hero morph and the vertical
 *  card helix.
 * ------------------------------------------------------------------ */
function initPageDnaHelix() {
  const canvas = document.getElementById("pageDnaCanvas");
  if (!canvas) return;
  let ctx, W, H;

  function resize() {
    ({ ctx, w: W, h: H } = fitCanvas(canvas));
  }
  resize();
  window.addEventListener("resize", resize);

  let time = 0;
  const STEP = 4;

  function frame() {
    time += prefersReducedMotion ? 0 : 0.014;
    ctx.clearRect(0, 0, W, H);

    // Helix spans the right portion of the header.
    const startX = W * 0.46;
    const endX = W * 0.98;
    const cy = H * 0.5;
    const amp = Math.min(H * 0.24, 92);
    const freq = 0.024; // tightness of the twist

    const strandA = [];
    const strandB = [];
    for (let x = startX; x <= endX; x += STEP) {
      const phase = x * freq - time * 1.5;
      strandA.push({ x, y: cy + Math.sin(phase) * amp, phase });
      strandB.push({ x, y: cy + Math.sin(phase + Math.PI) * amp });
    }

    // Base-pair rungs — draw behind, fade with depth so the twist reads.
    for (let i = 0; i < strandA.length; i += 4) {
      const a = strandA[i];
      const b = strandB[i];
      const depth = Math.cos(a.phase); // -1 (back) .. 1 (front)
      const alpha = 0.12 + (depth + 1) / 2 * 0.32;
      ctx.globalAlpha = alpha;
      const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      grad.addColorStop(0, COLORS.dna);
      grad.addColorStop(1, COLORS.dna2);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    drawOpenCurve(ctx, strandA, COLORS.dna, 2.4, 0.85);
    drawOpenCurve(ctx, strandB, COLORS.dna2, 2.4, 0.6);

    // Nodes on the front-facing crossings for a sense of depth.
    for (let i = 0; i < strandA.length; i += 4) {
      const a = strandA[i];
      const front = Math.sin(a.phase);
      if (front > 0.55) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = COLORS.dna;
        ctx.beginPath();
        ctx.arc(a.x, a.y, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    fadeHeaderEdges(ctx, W, H, startX, W * 0.2);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------------ *
 *  BLOG PAGE : multi-channel EEG brain-wave readout (right side)
 *  Several stacked EEG channels, each a distinct composite rhythm,
 *  confined to the right portion to mirror the helix and keep the
 *  heading readable. Distinct from the home card's centered wave.
 * ------------------------------------------------------------------ */
function initPageEeg() {
  const canvas = document.getElementById("pageEegCanvas");
  if (!canvas) return;
  let ctx, W, H;

  function resize() {
    ({ ctx, w: W, h: H } = fitCanvas(canvas));
  }
  resize();
  window.addEventListener("resize", resize);

  let time = 0;

  // Each channel has its own frequency mix and drift — like real EEG bands.
  const channels = [
    { freqs: [0.018, 0.045, 0.09], speed: 1.2, off: 0.0 },
    { freqs: [0.012, 0.033, 0.07], speed: 0.9, off: 1.7 },
    { freqs: [0.022, 0.05, 0.11], speed: 1.5, off: 3.2 },
    { freqs: [0.015, 0.04, 0.08], speed: 1.05, off: 4.6 },
  ];

  function eegValue(ch, x, t) {
    const [f1, f2, f3] = ch.freqs;
    return (
      0.6 * Math.sin(x * f1 - t * ch.speed + ch.off) +
      0.28 * Math.sin(x * f2 + t * ch.speed * 0.8 + ch.off) +
      0.16 * Math.sin(x * f3 - t * ch.speed * 1.6 + ch.off)
    );
  }

  function frame() {
    time += prefersReducedMotion ? 0 : 0.016;
    ctx.clearRect(0, 0, W, H);

    const x0 = W * 0.44;
    const x1 = W * 0.99;
    const top = H * 0.2;
    const bottom = H * 0.8;
    const n = channels.length;
    const rowGap = (bottom - top) / (n - 1);
    const amp = Math.min(rowGap * 0.42, 30);
    const scroll = time * 60;

    channels.forEach((ch, idx) => {
      const baseY = top + idx * rowGap;

      // Faint channel baseline.
      ctx.strokeStyle = COLORS.wave2;
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x0, baseY);
      ctx.lineTo(x1, baseY);
      ctx.stroke();

      // The EEG trace for this channel.
      ctx.strokeStyle = idx % 2 === 0 ? COLORS.wave : COLORS.dna2;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      let started = false;
      for (let x = x0; x <= x1; x += 3) {
        const y = baseY - eegValue(ch, x + scroll, time) * amp;
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    fadeHeaderEdges(ctx, W, H, x0, W * 0.2);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

/* Softly dissolve the left edge of a header canvas so the art fades
 * into the title text instead of ending in a hard vertical line.
 * Also feathers the top and bottom edges. */
function fadeHeaderEdges(ctx, W, H, fadeStartX, fadeWidth) {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";

  // Left → right horizontal fade.
  const gx = ctx.createLinearGradient(fadeStartX, 0, fadeStartX + fadeWidth, 0);
  gx.addColorStop(0, "rgba(0,0,0,1)");
  gx.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gx;
  ctx.fillRect(0, 0, fadeStartX + fadeWidth, H);

  // Top feather.
  const topH = H * 0.16;
  const gt = ctx.createLinearGradient(0, 0, 0, topH);
  gt.addColorStop(0, "rgba(0,0,0,1)");
  gt.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gt;
  ctx.fillRect(0, 0, W, topH);

  // Bottom feather.
  const botH = H * 0.16;
  const gb = ctx.createLinearGradient(0, H - botH, 0, H);
  gb.addColorStop(0, "rgba(0,0,0,0)");
  gb.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = gb;
  ctx.fillRect(0, H - botH, W, botH);

  ctx.restore();
}

function drawOpenCurve(ctx, pts, color, width, alpha) {
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  initHero();
  initDnaCard();
  initWaveCard();
  initPageDnaHelix();
  initPageEeg();
});
