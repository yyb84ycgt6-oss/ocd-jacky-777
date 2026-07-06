import { useRef, useEffect, useCallback } from 'react';

// ── Animated Background Renderers ──
// All renderers use a single canvas with requestAnimationFrame
// Performance-optimized: no allocations in render loop

export type BackgroundTheme =
  | 'matrix' | 'galaxy' | 'jade_zen' | 'fire_magma' | 'aurora'
  | 'neural_mesh' | 'code_stream' | 'black_hole' | 'crystal_vault'
  | 'sacred_geometry' | 'ocean_glow' | 'lightning' | 'ember_field'
  | 'starscape' | 'forest_wind' | 'snow' | 'neutron_star' | 'none';

export const BACKGROUND_THEMES: { id: BackgroundTheme; label: string; icon: string; category: string }[] = [
  { id: 'none', label: 'None', icon: '🚫', category: 'basic' },
  { id: 'matrix', label: 'Matrix Code', icon: '🟢', category: 'tech' },
  { id: 'neural_mesh', label: 'Neural Mesh', icon: '🧠', category: 'tech' },
  { id: 'code_stream', label: 'Code Stream', icon: '💻', category: 'tech' },
  { id: 'galaxy', label: 'Galaxy', icon: '🌌', category: 'cosmic' },
  { id: 'starscape', label: 'Starscape', icon: '⭐', category: 'cosmic' },
  { id: 'black_hole', label: 'Black Hole', icon: '🕳️', category: 'cosmic' },
  { id: 'neutron_star', label: 'Neutron Star', icon: '💫', category: 'cosmic' },
  { id: 'aurora', label: 'Aurora Skies', icon: '🌈', category: 'nature' },
  { id: 'fire_magma', label: 'Fire & Magma', icon: '🔥', category: 'nature' },
  { id: 'ember_field', label: 'Ember Field', icon: '✨', category: 'nature' },
  { id: 'ocean_glow', label: 'Ocean Glow', icon: '🌊', category: 'nature' },
  { id: 'lightning', label: 'Lightning', icon: '⚡', category: 'nature' },
  { id: 'snow', label: 'Snowfall', icon: '❄️', category: 'nature' },
  { id: 'forest_wind', label: 'Forest Wind', icon: '🌲', category: 'nature' },
  { id: 'jade_zen', label: 'Jade Zen Void', icon: '🟩', category: 'luxury' },
  { id: 'crystal_vault', label: 'Crystal Vault', icon: '💎', category: 'luxury' },
  { id: 'sacred_geometry', label: 'Sacred Geometry', icon: '🔷', category: 'luxury' },
];

// Pre-allocated particle arrays for each renderer
interface Particle { x: number; y: number; vx: number; vy: number; size: number; alpha: number; hue: number; life: number; }

function createParticles(count: number, w: number, h: number, theme: BackgroundTheme): Particle[] {
  const p: Particle[] = [];
  for (let i = 0; i < count; i++) {
    p.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2 + (theme === 'snow' ? 0.5 : 0),
      size: Math.random() * 3 + 1,
      alpha: Math.random() * 0.8 + 0.2,
      hue: theme === 'fire_magma' ? Math.random() * 40 : theme === 'aurora' ? Math.random() * 120 + 100 : Math.random() * 360,
      life: Math.random() * 200 + 100,
    });
  }
  return p;
}

// Matrix rain columns
interface MatrixCol { x: number; y: number; speed: number; chars: string[]; length: number; }

function createMatrixCols(w: number, h: number): MatrixCol[] {
  const cols: MatrixCol[] = [];
  const charSet = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
  for (let x = 0; x < w; x += 14) {
    const length = Math.floor(Math.random() * 20) + 5;
    cols.push({
      x,
      y: Math.random() * h - h,
      speed: Math.random() * 3 + 1,
      length,
      chars: Array.from({ length }, () => charSet[Math.floor(Math.random() * charSet.length)]),
    });
  }
  return cols;
}

function renderMatrix(ctx: CanvasRenderingContext2D, cols: MatrixCol[], w: number, h: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.fillRect(0, 0, w, h);
  ctx.font = '12px monospace';
  for (const col of cols) {
    for (let i = 0; i < col.chars.length; i++) {
      const cy = col.y + i * 14;
      if (cy < -14 || cy > h + 14) continue;
      const brightness = i === col.chars.length - 1 ? 255 : Math.max(80, 255 - (col.chars.length - i) * 12);
      ctx.fillStyle = `rgba(0, ${brightness}, 0, ${i === col.chars.length - 1 ? 1 : 0.7})`;
      ctx.fillText(col.chars[i], col.x, cy);
    }
    col.y += col.speed;
    if (col.y > h + col.length * 14) {
      col.y = -col.length * 14;
      col.speed = Math.random() * 3 + 1;
    }
  }
}

function renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[], w: number, h: number, theme: BackgroundTheme, t: number) {
  ctx.fillStyle = theme === 'fire_magma' ? 'rgba(10, 2, 0, 0.08)' :
                  theme === 'aurora' ? 'rgba(0, 5, 15, 0.06)' :
                  theme === 'ocean_glow' ? 'rgba(0, 5, 20, 0.06)' :
                  theme === 'jade_zen' ? 'rgba(2, 8, 5, 0.04)' :
                  theme === 'snow' ? 'rgba(5, 8, 15, 0.03)' :
                  'rgba(0, 0, 0, 0.06)';
  ctx.fillRect(0, 0, w, h);

  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0) p.x = w;
    if (p.x > w) p.x = 0;
    if (p.y < 0) p.y = h;
    if (p.y > h) p.y = 0;

    const flicker = theme === 'ember_field' ? Math.sin(t * 0.01 + p.x) * 0.3 + 0.7 : 1;

    if (theme === 'fire_magma') {
      ctx.fillStyle = `hsla(${p.hue}, 100%, ${50 + p.alpha * 30}%, ${p.alpha * flicker})`;
    } else if (theme === 'aurora') {
      ctx.fillStyle = `hsla(${p.hue + Math.sin(t * 0.002 + p.x * 0.01) * 30}, 80%, 60%, ${p.alpha * 0.6})`;
    } else if (theme === 'ocean_glow') {
      ctx.fillStyle = `hsla(${200 + Math.sin(t * 0.001 + p.y * 0.005) * 20}, 70%, 55%, ${p.alpha * 0.5})`;
    } else if (theme === 'jade_zen') {
      ctx.fillStyle = `hsla(${150 + Math.sin(t * 0.0005) * 10}, 50%, 40%, ${p.alpha * 0.3})`;
    } else if (theme === 'snow') {
      ctx.fillStyle = `rgba(200, 210, 230, ${p.alpha * 0.6})`;
    } else if (theme === 'ember_field') {
      ctx.fillStyle = `hsla(${20 + p.hue * 0.1}, 100%, ${50 + flicker * 20}%, ${p.alpha * flicker})`;
    } else {
      ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.alpha * 0.5})`;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (theme === 'snow' ? 1.5 : 1), 0, Math.PI * 2);
    ctx.fill();
  }
}

function hash01(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453123;
  return s - Math.floor(s);
}

function renderGalaxy(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, quality: number = 1) {
  ctx.fillStyle = 'rgba(0, 0, 8, 0.06)';
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const minDim = Math.min(w, h);
  const time = t * 0.001;

  // Nebula wash
  const nebula = ctx.createRadialGradient(cx, cy, minDim * 0.06, cx, cy, minDim * 0.65);
  nebula.addColorStop(0, 'hsla(250, 95%, 68%, 0.2)');
  nebula.addColorStop(0.45, 'hsla(220, 90%, 58%, 0.12)');
  nebula.addColorStop(1, 'hsla(210, 90%, 45%, 0)');
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, w, h);

  const armCount = 4;
  const starsPerArm = Math.max(80, Math.round(140 * quality));
  const maxRadius = minDim * 0.47;

  // Spiral arms
  for (let arm = 0; arm < armCount; arm++) {
    const armPhase = (arm / armCount) * Math.PI * 2;
    for (let i = 0; i < starsPerArm; i++) {
      const n = i / starsPerArm;
      const radius = Math.pow(n, 0.78) * maxRadius;
      const twist = radius / maxRadius * Math.PI * 4.6;
      const turbulence = (hash01(i * 19.13 + arm * 3.7) - 0.5) * 0.45;
      const angle = armPhase + twist + time * 0.08 + turbulence;
      const spread = 0.25 + n * 0.95;
      const x = cx + Math.cos(angle) * radius + (hash01(i * 3.17 + arm) - 0.5) * spread * 16;
      const y = cy + Math.sin(angle) * radius * 0.62 + (hash01(i * 2.31 + arm * 5.9) - 0.5) * spread * 12;
      const twinkle = 0.45 + 0.55 * Math.sin(time * 2.2 + i * 0.11 + arm);
      const hue = 210 + n * 70 + Math.sin(time + i * 0.03) * 8;
      const starR = 0.5 + (1 - n) * 1.6;
      ctx.fillStyle = `hsla(${hue}, 95%, ${68 + (1 - n) * 20}%, ${0.12 + twinkle * 0.62})`;
      ctx.beginPath();
      ctx.arc(x, y, starR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Dense stellar core
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, minDim * 0.2);
  core.addColorStop(0, 'hsla(45, 100%, 92%, 0.95)');
  core.addColorStop(0.38, 'hsla(40, 100%, 75%, 0.48)');
  core.addColorStop(1, 'hsla(30, 100%, 55%, 0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, minDim * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Background stars
  const bgStars = Math.max(70, Math.round(130 * quality));
  for (let i = 0; i < bgStars; i++) {
    const base = i * 17.17;
    const x = hash01(base + 11.3) * w;
    const y = hash01(base + 43.9) * h;
    const tw = 0.25 + Math.abs(Math.sin(time * 1.4 + i * 0.19)) * 0.6;
    const size = 0.35 + hash01(base + 7.1) * 1.2;
    const hue = 205 + hash01(base + 3.7) * 45;
    ctx.fillStyle = `hsla(${hue}, 80%, 78%, ${0.15 + tw * 0.45})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderSacredGeometry(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = 'rgba(5, 2, 10, 0.04)';
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const rot = t * 0.0002;
  ctx.strokeStyle = `hsla(${270 + Math.sin(t * 0.001) * 30}, 50%, 45%, 0.15)`;
  ctx.lineWidth = 0.5;
  for (let ring = 0; ring < 6; ring++) {
    const r = 40 + ring * 35;
    const sides = 6;
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const a = (i / sides) * Math.PI * 2 + rot + ring * 0.1;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
}

function renderBlackHole(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, quality: number = 1) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const minDim = Math.min(w, h);
  const time = t * 0.001;

  // Lensed starfield near gravity well
  const starCount = Math.max(70, Math.round(130 * quality));
  for (let i = 0; i < starCount; i++) {
    const base = i * 29.17;
    const sx = hash01(base + 0.7) * w;
    const sy = hash01(base + 4.9) * h;
    const dx = sx - cx;
    const dy = sy - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
    const pull = Math.min(1, (minDim * 0.22) / dist);
    const bend = pull * pull * 18;
    const x = sx - (dx / dist) * bend;
    const y = sy - (dy / dist) * bend;
    const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(time * 2 + i * 0.13));
    const hue = 200 + hash01(base + 8.3) * 70;
    ctx.fillStyle = `hsla(${hue}, 85%, 78%, ${0.12 + twinkle * 0.45})`;
    ctx.beginPath();
    ctx.arc(x, y, 0.5 + hash01(base + 3.3) * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rotating accretion disk
  const diskBands = Math.max(3, Math.round(6 * quality));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(time * 0.4);
  for (let i = 0; i < diskBands; i++) {
    const ring = minDim * (0.12 + i * 0.045);
    const g = ctx.createRadialGradient(0, 0, ring * 0.55, 0, 0, ring);
    g.addColorStop(0, `hsla(${25 + i * 10}, 100%, 65%, 0)`);
    g.addColorStop(0.6, `hsla(${35 + i * 14}, 100%, 60%, ${0.18 - i * 0.02})`);
    g.addColorStop(0.85, `hsla(${270 + i * 8}, 90%, 60%, ${0.2 - i * 0.025})`);
    g.addColorStop(1, 'hsla(290, 90%, 55%, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, ring, ring * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Photon ring
  const ringR = minDim * 0.13;
  ctx.strokeStyle = `hsla(40, 100%, 75%, ${0.35 + Math.sin(time * 3.5) * 0.15})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(cx, cy, ringR, ringR * 0.42, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Event horizon
  const horizon = ctx.createRadialGradient(cx, cy, 0, cx, cy, minDim * 0.09);
  horizon.addColorStop(0, 'rgba(0, 0, 0, 1)');
  horizon.addColorStop(0.65, 'rgba(0, 0, 0, 0.95)');
  horizon.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = horizon;
  ctx.beginPath();
  ctx.arc(cx, cy, minDim * 0.09, 0, Math.PI * 2);
  ctx.fill();
}

function renderStarscape(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, quality: number = 1) {
  ctx.fillStyle = 'rgba(2, 5, 15, 0.06)';
  ctx.fillRect(0, 0, w, h);
  const time = t * 0.001;

  const nebulaA = ctx.createRadialGradient(w * 0.2, h * 0.25, 0, w * 0.2, h * 0.25, Math.min(w, h) * 0.45);
  nebulaA.addColorStop(0, 'hsla(250, 95%, 60%, 0.12)');
  nebulaA.addColorStop(1, 'hsla(250, 95%, 60%, 0)');
  ctx.fillStyle = nebulaA;
  ctx.fillRect(0, 0, w, h);

  const nebulaB = ctx.createRadialGradient(w * 0.78, h * 0.72, 0, w * 0.78, h * 0.72, Math.min(w, h) * 0.4);
  nebulaB.addColorStop(0, 'hsla(190, 95%, 62%, 0.1)');
  nebulaB.addColorStop(1, 'hsla(190, 95%, 62%, 0)');
  ctx.fillStyle = nebulaB;
  ctx.fillRect(0, 0, w, h);

  const nearCount = Math.max(90, Math.round(150 * quality));
  const farCount = Math.max(70, Math.round(120 * quality));

  // Far layer
  for (let i = 0; i < farCount; i++) {
    const base = i * 13.91;
    const x = (hash01(base + 1.2) * w + time * (6 + hash01(base + 2.8) * 4)) % w;
    const y = hash01(base + 4.1) * h;
    const tw = 0.3 + Math.abs(Math.sin(time * 1.3 + i * 0.23)) * 0.55;
    const hue = 205 + hash01(base + 7.6) * 60;
    ctx.fillStyle = `hsla(${hue}, 65%, 74%, ${0.12 + tw * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, 0.4 + hash01(base + 5.3) * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Near layer + slight streaking
  for (let i = 0; i < nearCount; i++) {
    const base = i * 23.73;
    const speed = 12 + hash01(base + 9.3) * 26;
    const x = (hash01(base + 2.1) * w + time * speed) % w;
    const y = hash01(base + 6.9) * h;
    const pulse = 0.35 + 0.65 * Math.abs(Math.sin(time * 2.1 + i * 0.19));
    const len = 0.6 + hash01(base + 3.5) * 2.6;
    const hue = 200 + hash01(base + 8.7) * 70;
    ctx.strokeStyle = `hsla(${hue}, 95%, 82%, ${0.2 + pulse * 0.5})`;
    ctx.lineWidth = 0.6 + hash01(base + 7.2) * 0.9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - len, y);
    ctx.stroke();
  }
}

function renderCrystalVault(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = 'rgba(5, 5, 15, 0.04)';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = `hsla(${200 + Math.sin(t * 0.001) * 20}, 40%, 50%, 0.08)`;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 20; i++) {
    const x = (w / 20) * i + Math.sin(t * 0.001 + i) * 10;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + Math.sin(t * 0.0005 + i) * 30, h);
    ctx.stroke();
  }
  for (let i = 0; i < 15; i++) {
    const y = (h / 15) * i + Math.cos(t * 0.001 + i) * 10;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y + Math.cos(t * 0.0005 + i) * 20);
    ctx.stroke();
  }
}

function renderNeuralMesh(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = 'rgba(2, 5, 15, 0.05)';
  ctx.fillRect(0, 0, w, h);
  const nodes: { x: number; y: number }[] = [];
  for (let i = 0; i < 30; i++) {
    nodes.push({
      x: (w * 0.1) + (w * 0.8) * ((i % 6) / 5) + Math.sin(t * 0.001 + i * 2) * 15,
      y: (h * 0.1) + (h * 0.8) * (Math.floor(i / 6) / 4) + Math.cos(t * 0.001 + i * 3) * 15,
    });
  }
  ctx.strokeStyle = 'hsla(200, 60%, 50%, 0.06)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 120) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
  }
  for (const n of nodes) {
    ctx.fillStyle = 'hsla(200, 70%, 60%, 0.4)';
    ctx.beginPath();
    ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderLightning(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = 'rgba(5, 2, 15, 0.08)';
  ctx.fillRect(0, 0, w, h);
  if (Math.random() > 0.97) {
    ctx.strokeStyle = `hsla(${240 + Math.random() * 40}, 80%, 80%, ${0.3 + Math.random() * 0.5})`;
    ctx.lineWidth = 1 + Math.random();
    let x = Math.random() * w, y = 0;
    ctx.beginPath();
    ctx.moveTo(x, y);
    while (y < h) {
      x += (Math.random() - 0.5) * 40;
      y += Math.random() * 30 + 10;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function renderForestWind(ctx: CanvasRenderingContext2D, particles: Particle[], w: number, h: number, t: number) {
  ctx.fillStyle = 'rgba(2, 8, 3, 0.04)';
  ctx.fillRect(0, 0, w, h);
  for (const p of particles) {
    p.x += Math.sin(t * 0.001 + p.y * 0.01) * 1.5 + p.vx * 0.3;
    p.y += p.vy * 0.2 + 0.3;
    if (p.y > h) { p.y = -5; p.x = Math.random() * w; }
    if (p.x < 0) p.x = w;
    if (p.x > w) p.x = 0;
    ctx.fillStyle = `hsla(${100 + Math.random() * 40}, 50%, 35%, ${p.alpha * 0.4})`;
    // Leaf shape
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.size * 2, p.size, Math.sin(t * 0.002 + p.x) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Neutron Star ── epic pulsar: rotating beams, accretion disk, magnetosphere, distorted starfield
interface NSStar { x: number; y: number; r: number; tw: number; hue: number; }
let nsStars: NSStar[] | null = null;
let nsStarCount = 0;
function ensureNSStars(w: number, h: number, count: number) {
  if (nsStars && nsStars.length === count) return nsStars;
  const arr: NSStar[] = [];
  for (let i = 0; i < count; i++) {
    arr.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.3,
      tw: Math.random() * Math.PI * 2,
      hue: 200 + Math.random() * 60,
    });
  }
  nsStars = arr;
  nsStarCount = count;
  return arr;
}

// Glow intensity (0–2) — multiplies pulse, jet, disk, magnetosphere alpha for the neutron star.
let nsGlow = 1;
export function setNeutronStarGlow(g: number) { nsGlow = Math.max(0, Math.min(2, g)); }

function renderNeutronStar(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, quality: number = 1) {
  const glow = nsGlow;
  // Deep space wash with subtle blue bias
  ctx.fillStyle = 'rgba(2, 4, 14, 0.18)';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const minDim = Math.min(w, h);
  const time = t * 0.001;

  // Apply glow multiplier to all luminous elements (background wash above is unaffected).
  ctx.save();
  if (glow <= 1) {
    ctx.globalAlpha = glow;
  } else {
    ctx.globalCompositeOperation = 'lighter';
  }

  // Distorted starfield (gravitational lensing pull toward center)
  const starCount = Math.max(40, Math.round(220 * quality));
  const stars = ensureNSStars(w, h, starCount);
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    const dx = s.x - cx;
    const dy = s.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) + 0.0001;
    const lensPull = Math.min(1, 80 / dist);
    const lx = s.x - (dx / dist) * lensPull * 6;
    const ly = s.y - (dy / dist) * lensPull * 6;
    const tw = 0.55 + Math.sin(time * 2 + s.tw) * 0.4;
    ctx.fillStyle = `hsla(${s.hue}, 80%, 80%, ${tw})`;
    ctx.beginPath();
    ctx.arc(lx, ly, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Accretion disk (tilted ellipse, multi-band)
  const diskR = minDim * 0.34;
  const tilt = 0.32; // y squash
  const bandCount = Math.max(2, Math.round(5 * quality));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(time * 0.08);
  for (let band = 0; band < bandCount; band++) {
    const r = diskR * (0.55 + band * 0.11);
    const grad = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r);
    const hueShift = 18 + band * 6 + Math.sin(time + band) * 4;
    grad.addColorStop(0, `hsla(${hueShift}, 100%, 65%, 0)`);
    grad.addColorStop(0.55, `hsla(${hueShift + 10}, 100%, 60%, ${0.10 - band * 0.014})`);
    grad.addColorStop(0.85, `hsla(${280 + band * 10}, 90%, 60%, ${0.16 - band * 0.022})`);
    grad.addColorStop(1, `hsla(${300}, 90%, 50%, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * tilt, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Bright inner ring
  ctx.strokeStyle = `hsla(35, 100%, 75%, ${0.45 + Math.sin(time * 4) * 0.1})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, diskR * 0.55, diskR * 0.55 * tilt, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Pulsar rotation + spin (fast)
  const spin = time * 1.6;
  // Two opposing relativistic jets
  for (let s = 0; s < 2; s++) {
    const ang = spin + s * Math.PI;
    const len = minDim * 0.95;
    const beamWidth = 0.08 + Math.sin(time * 6 + s) * 0.012;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    // Soft outer cone
    const beamGrad = ctx.createLinearGradient(0, 0, len, 0);
    beamGrad.addColorStop(0, 'hsla(190, 100%, 80%, 0.55)');
    beamGrad.addColorStop(0.25, 'hsla(210, 100%, 70%, 0.22)');
    beamGrad.addColorStop(0.7, 'hsla(260, 90%, 65%, 0.08)');
    beamGrad.addColorStop(1, 'hsla(280, 90%, 60%, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, -len * beamWidth);
    ctx.lineTo(len, len * beamWidth);
    ctx.closePath();
    ctx.fill();
    // Hot core line
    const coreGrad = ctx.createLinearGradient(0, 0, len, 0);
    coreGrad.addColorStop(0, 'hsla(0, 0%, 100%, 0.9)');
    coreGrad.addColorStop(0.4, 'hsla(190, 100%, 85%, 0.5)');
    coreGrad.addColorStop(1, 'hsla(260, 100%, 70%, 0)');
    ctx.strokeStyle = coreGrad;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, 0);
    ctx.stroke();
    ctx.restore();
  }

  // Magnetosphere field lines (subtle rotating loops)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(spin * 0.5);
  const loopCount = Math.max(0, Math.round(6 * quality));
  for (let i = 0; i < loopCount; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.strokeStyle = `hsla(${200 + i * 8}, 90%, 70%, 0.08)`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.ellipse(
      Math.cos(a) * minDim * 0.04,
      Math.sin(a) * minDim * 0.04,
      minDim * 0.18,
      minDim * 0.06,
      a,
      0, Math.PI * 2
    );
    ctx.stroke();
  }
  ctx.restore();

  // Pulsar pulse (rhythmic flash)
  const pulse = 0.5 + 0.5 * Math.sin(time * 5);
  const pulseR = minDim * (0.18 + pulse * 0.08);
  const pulseGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR);
  pulseGrad.addColorStop(0, `hsla(200, 100%, 90%, ${0.35 + pulse * 0.35})`);
  pulseGrad.addColorStop(0.4, `hsla(220, 100%, 75%, ${0.18 + pulse * 0.18})`);
  pulseGrad.addColorStop(1, 'hsla(260, 100%, 60%, 0)');
  ctx.fillStyle = pulseGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
  ctx.fill();

  // Neutron star core (tiny, blinding)
  const coreR = 4 + pulse * 1.5;
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 4);
  core.addColorStop(0, 'rgba(255, 255, 255, 1)');
  core.addColorStop(0.3, 'hsla(190, 100%, 90%, 0.9)');
  core.addColorStop(1, 'hsla(220, 100%, 70%, 0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Main render dispatcher ──
export function createRenderer(theme: BackgroundTheme, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return { destroy: () => {} };

  let w = canvas.width = canvas.offsetWidth;
  let h = canvas.height = canvas.offsetHeight;
  let animId = 0;
  let t = 0;

  // ── Adaptive FPS / CPU throttling ──
  // Tracks rolling frame time; lowers `quality` (1.0 → 0.3) when FPS drops,
  // and skips frames entirely when severely overloaded.
  let lastFrameTs = performance.now();
  let emaFrameMs = 16.67; // start assuming 60fps
  let quality = 1;
  let skipPhase = 0;
  let skipEvery = 0; // 0 = render every frame; N = skip N of every N+1 frames

  const particleCount = theme === 'snow' ? 100 : theme === 'forest_wind' ? 60 : 120;
  const particles = ['fire_magma', 'aurora', 'ocean_glow', 'jade_zen', 'snow', 'ember_field', 'forest_wind']
    .includes(theme) ? createParticles(particleCount, w, h, theme) : [];
  const matrixCols = theme === 'matrix' || theme === 'code_stream' ? createMatrixCols(w, h) : [];

  // Initial fill
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  function adapt(now: number) {
    const dt = now - lastFrameTs;
    lastFrameTs = now;
    // Ignore huge gaps (tab was backgrounded)
    if (dt > 0 && dt < 500) {
      emaFrameMs = emaFrameMs * 0.9 + dt * 0.1;
    }
    const fps = 1000 / emaFrameMs;
    // Map FPS → quality with hysteresis
    if (fps < 30 && quality > 0.35) quality = Math.max(0.3, quality - 0.04);
    else if (fps < 45 && quality > 0.6) quality = Math.max(0.55, quality - 0.02);
    else if (fps > 55 && quality < 1) quality = Math.min(1, quality + 0.01);
    // Frame-skip only if extremely slow
    if (fps < 20) skipEvery = 2;
    else if (fps < 28) skipEvery = 1;
    else if (fps > 40) skipEvery = 0;
  }

  function render() {
    const now = performance.now();
    adapt(now);

    if (skipEvery > 0) {
      skipPhase = (skipPhase + 1) % (skipEvery + 1);
      if (skipPhase !== 0) {
        animId = requestAnimationFrame(render);
        return;
      }
    }

    t++;
    switch (theme) {
      case 'matrix':
      case 'code_stream':
        renderMatrix(ctx!, matrixCols, w, h);
        break;
      case 'galaxy':
        renderGalaxy(ctx!, w, h, t, quality);
        break;
      case 'black_hole':
        renderBlackHole(ctx!, w, h, t, quality);
        break;
      case 'sacred_geometry':
        renderSacredGeometry(ctx!, w, h, t);
        break;
      case 'crystal_vault':
        renderCrystalVault(ctx!, w, h, t);
        break;
      case 'neural_mesh':
        renderNeuralMesh(ctx!, w, h, t);
        break;
      case 'lightning':
        renderLightning(ctx!, w, h, t);
        break;
      case 'neutron_star':
        renderNeutronStar(ctx!, w, h, t, quality);
        break;
      case 'starscape':
        renderStarscape(ctx!, w, h, t, quality);
        break;
      case 'forest_wind':
        renderForestWind(ctx!, particles, w, h, t);
        break;
      case 'fire_magma':
      case 'aurora':
      case 'ocean_glow':
      case 'jade_zen':
      case 'snow':
      case 'ember_field':
        renderParticles(ctx!, particles, w, h, theme, t);
        break;
      default:
        return; // 'none' — stop loop
    }
    animId = requestAnimationFrame(render);
  }

  animId = requestAnimationFrame(render);

  const onResize = () => {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
    nsStars = null; // regenerate distorted starfield for new dims
  };
  window.addEventListener('resize', onResize);

  return {
    destroy: () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    },
  };
}

// ── React Hook ──
export function useAnimatedBackground(theme: BackgroundTheme) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (rendererRef.current) rendererRef.current.destroy();
    if (theme === 'none' || !canvasRef.current) return;
    rendererRef.current = createRenderer(theme, canvasRef.current);
    return () => { rendererRef.current?.destroy(); rendererRef.current = null; };
  }, [theme]);

  return canvasRef;
}
