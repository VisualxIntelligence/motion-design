// Shared constants + small helpers.
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// The dots palette (coral, sun, mint, sky, violet, pink)
export const PAL = [0xff5a4e, 0xffc53d, 0x2ee6a6, 0x3da9fc, 0x9b6bff, 0xff6fb5];
export const HEX = ['#ff5a4e', '#ffc53d', '#2ee6a6', '#3da9fc', '#9b6bff', '#ff6fb5'];

export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };

// canvas helpers for textures
export function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
export function rr(x, X, Y, W, H, R, fill, stroke, lw = 2) { x.beginPath(); x.roundRect(X, Y, W, H, R); if (fill) { x.fillStyle = fill; x.fill(); } if (stroke) { x.strokeStyle = stroke; x.lineWidth = lw; x.stroke(); } }
export function txt(x, s, X, Y, font, color, align = 'left') { x.font = font; x.fillStyle = color; x.textAlign = align; x.textBaseline = 'alphabetic'; x.fillText(s, X, Y); }
export const F = { d: (w, s) => `${w} ${s}px Unbounded`, g: (w, s) => `${w} ${s}px "Space Grotesk"`, m: (w, s) => `${w} ${s}px "JetBrains Mono"` };
