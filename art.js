/* ==========================================================================
   art.js — all the pixel art is drawn in code (no image files needed).
   Characters, portraits, props, skies, the night "world" used for the
   final camera pull-back, and the little illustrated vignettes.
   ========================================================================== */
'use strict';

/* ------------------------------------------------------------------ helpers */
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rect(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); }
function rnd(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgb2hex(r, g, b) { return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }
function shade(h, amt) { return amt >= 0 ? mix(h, '#ffffff', amt) : mix(h, '#000000', -amt); }
/* pixel-perfect filled ellipse (no anti-aliasing) */
function blob(c, cx, cy, rw, rh, col) {
  c.fillStyle = col;
  for (let dy = -rh; dy <= rh; dy++) {
    const w = Math.floor(rw * Math.sqrt(Math.max(0, 1 - (dy * dy) / (rh * rh + .01))));
    c.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2 + 1, 1);
  }
}
function glowDot(c, x, y, r, col, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}

/* --------------------------------------------------------------- characters */
const _LOOKS = {
  yahya:       { skin: '#e3b08a', hair: '#1d1a28', top: '#eef0f8', bottom: '#2c3664', accent: '#2c3664', style: 'short' },
  momna:       { skin: '#ebbd9b', hair: '#1a1620', top: '#e8ecf6', bottom: '#4b4f8c', accent: '#b9a6ff', style: 'scarf' },
  momnaFriend: { skin: '#dba982', hair: '#2b1d1c', top: '#f3e8f1', bottom: '#6d4170', accent: '#ff9ec4', style: 'scarf' },
  friend1:     { skin: '#c99068', hair: '#241a14', top: '#e8ecf6', bottom: '#2c3664', accent: '#4fb4a0', style: 'spike' },
  friend2:     { skin: '#e0aa84', hair: '#33261c', top: '#e8ecf6', bottom: '#2c3664', accent: '#e0884f', style: 'cap' },
  otherGirl:   { skin: '#e3b08a', hair: '#2a1f24', top: '#f1e8ef', bottom: '#6d4170', accent: '#8fd0ff', style: 'long' },
  otherBoy:    { skin: '#deaa84', hair: '#3a2a1d', top: '#dfe3ee', bottom: '#2c3664', accent: '#2c3664', style: 'spike' },
  classBoy:    { skin: '#e0ac86', hair: '#201a22', top: '#eef0f8', bottom: '#2c3664', accent: '#2c3664', style: 'short' },
  brother:     { skin: '#dcaa84', hair: '#1c1820', top: '#7787a6', bottom: '#2f3a52', accent: '#2f3a52', style: 'short', h: 1.08 },
  mother1:     { skin: '#dba982', hair: '#2b1d1c', top: '#7fae9f', bottom: '#5b8478', accent: '#7fae9f', style: 'scarf', h: 1.04 },
  mother2:     { skin: '#e0b08a', hair: '#2b1d1c', top: '#b49680', bottom: '#8a6f5c', accent: '#d4b497', style: 'scarf', h: 1.04 },
  father:      { skin: '#d9a27c', hair: '#2a2420', top: '#9aa8bd', bottom: '#3b4052', accent: '#3b4052', style: 'short', h: 1.1 },
  driver:      { skin: '#d19a72', hair: '#2d2420', top: '#c6a85a', bottom: '#40424f', accent: '#c6a85a', style: 'cap', h: 1.08 },
  kid:         { skin: '#e0ac86', hair: '#2a2024', top: '#e8ecf6', bottom: '#2c3664', accent: '#2c3664', style: 'short' },
  kidG:        { skin: '#e3b08a', hair: '#2a1f24', top: '#f1e8ef', bottom: '#6d4170', accent: '#9fd0c4', style: 'scarf' }
};
const LOOKS = {};
for (const k in _LOOKS) LOOKS[k] = Object.assign({}, _LOOKS[k], (CONFIG.looks && CONFIG.looks[k]) || {});
for (const k in (CONFIG.looks || {})) if (!LOOKS[k]) LOOKS[k] = Object.assign({}, _LOOKS.kid, CONFIG.looks[k]);

/* c: ctx — x,y = feet (centre-bottom) in world px */
function drawChar(c, key, x, y, dir, frame, o) {
  o = o || {}; dir = dir || 'down'; frame = frame || 0;
  const L = LOOKS[key] || LOOKS.kid, s = (L.h || 1) * (o.scale || 1);
  const style = L.style, longTop = (style === 'scarf' || style === 'long');
  const moving = !!o.moving, step = moving ? (frame === 1 ? 1 : frame === 3 ? -1 : 0) : 0;
  const idle = (!moving && o.t !== undefined) ? (Math.sin(o.t * 2.1 + x * .17) > .72 ? -1 : 0) : 0;
  const bob = moving ? (frame % 2 ? -1 : 0) : idle;
  const sit = !!o.sit;
  c.save(); c.translate(Math.round(x), Math.round(y)); if (s !== 1) c.scale(s, s);
  if (o.ghostA != null) c.globalAlpha = o.ghostA;
  // shadow
  c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(-6, -1, 12, 2); c.fillRect(-4, -2, 8, 1); c.fillRect(-4, 1, 8, 1);
  // legs
  if (!sit) {
    rect(c, -4, step > 0 ? -4 : -5, 3, step > 0 ? 4 : 5, L.bottom);
    rect(c, 1, step < 0 ? -4 : -5, 3, step < 0 ? 4 : 5, L.bottom);
    rect(c, -4, step > 0 ? -1 : -1, 3, 1, '#15111f'); rect(c, 1, -1, 3, 1, '#15111f');
  }
  c.translate(0, bob);
  const back = dir === 'up', side = dir === 'left' || dir === 'right', fx = dir === 'right' ? 1 : -1;
  // back hair for long style
  if (style === 'long') rect(c, -5, -19, 10, 11, L.hair);
  // torso
  rect(c, -4, -13, 8, longTop ? 9 : 6, L.top);
  rect(c, -4, -13, 8, 1, shade(L.top, -.12));
  if (!longTop) { rect(c, -4, -7, 8, 2, L.bottom); }
  else rect(c, -4, -5, 8, 1, shade(L.top, -.18));
  // arms
  const as = moving ? step : 0;
  rect(c, -5, -12 - as, 1, 5, shade(L.top, -.1)); rect(c, 4, -12 + as, 1, 5, shade(L.top, -.1));
  rect(c, -5, -7 - as, 1, 1, L.skin); rect(c, 4, -7 + as, 1, 1, L.skin);
  // head
  if (style === 'scarf') {
    rect(c, -5, -21, 10, 9, L.accent); rect(c, -5, -21, 10, 1, shade(L.accent, .18));
    if (back) { rect(c, -5, -21, 10, 12, L.accent); rect(c, -1, -18, 2, 8, shade(L.accent, -.14)); }
    else {
      if (side) { rect(c, dir === 'right' ? 0 : -3, -18, 3, 5, L.skin); rect(c, dir === 'right' ? 0 : -3, -18, 3, 1, L.hair); }
      else { rect(c, -3, -18, 6, 5, L.skin); rect(c, -3, -18, 6, 1, L.hair); }
    }
    rect(c, -5, -12, 10, 3, shade(L.accent, -.12));
  } else {
    rect(c, -4, -20, 8, 7, L.skin);
    rect(c, -4, -14, 8, 1, shade(L.skin, -.12));
    if (back) rect(c, -4, -21, 8, 8, L.hair);
    else if (style === 'short') { rect(c, -4, -21, 8, 3, L.hair); rect(c, -4, -18, 1, 2, L.hair); rect(c, 3, -18, 1, 2, L.hair); if (side) rect(c, fx > 0 ? -4 : 1, -18, 3, 3, L.hair); }
    else if (style === 'spike') { rect(c, -4, -21, 8, 2, L.hair); rect(c, -3, -23, 2, 2, L.hair); rect(c, 0, -23, 2, 2, L.hair); rect(c, 2, -22, 2, 1, L.hair); rect(c, -4, -19, 1, 2, L.hair); rect(c, 3, -19, 1, 2, L.hair); }
    else if (style === 'cap') { rect(c, -4, -21, 8, 3, L.accent); rect(c, -4, -18, 8, 1, shade(L.accent, -.25)); if (side) rect(c, dir === 'right' ? 4 : -7, -18, 3, 1, shade(L.accent, -.25)); rect(c, -4, -18, 1, 3, L.hair); rect(c, 3, -18, 1, 3, L.hair); }
    else if (style === 'long') { rect(c, -5, -21, 10, 4, L.hair); rect(c, -5, -17, 1, 9, L.hair); rect(c, 4, -17, 1, 9, L.hair); }
  }
  // eyes
  if (!back) {
    const ec = '#1a1626';
    if (dir === 'down') { rect(c, -2, -16, 1, 2, ec); rect(c, 1, -16, 1, 2, ec); }
    else if (dir === 'left') rect(c, -3, -16, 1, 2, ec); else rect(c, 2, -16, 1, 2, ec);
  }
  c.restore();
}

/* 40x40 dialogue portrait */
function drawPortrait(cnv, key, mood) {
  const L = LOOKS[key] || LOOKS.kid, c = cnv.getContext('2d'); c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, 40, 40);
  const g = c.createLinearGradient(0, 0, 0, 40); g.addColorStop(0, '#31256e'); g.addColorStop(1, '#140f33'); c.fillStyle = g; c.fillRect(0, 0, 40, 40);
  glowDot(c, 20, 18, 22, '170,130,255', .25);
  const female = (L.style === 'scarf' || L.style === 'long');
  if (L.style === 'long') rect(c, 8, 10, 24, 26, L.hair);
  if (L.style === 'scarf') rect(c, 7, 8, 26, 30, L.accent);
  rect(c, 6, 33, 28, 7, L.top); rect(c, 16, 29, 8, 5, shade(L.skin, -.1));
  if (L.style === 'scarf') rect(c, 6, 33, 28, 7, shade(L.accent, -.1));
  rect(c, 11, 12, 18, 18, L.skin);
  rect(c, 11, 28, 18, 2, shade(L.skin, -.1));
  // hair
  if (L.style === 'short') { rect(c, 10, 8, 20, 7, L.hair); rect(c, 10, 14, 2, 5, L.hair); rect(c, 28, 14, 2, 5, L.hair); }
  else if (L.style === 'spike') { rect(c, 10, 9, 20, 5, L.hair); rect(c, 12, 6, 4, 4, L.hair); rect(c, 18, 5, 4, 5, L.hair); rect(c, 24, 7, 4, 3, L.hair); rect(c, 10, 14, 2, 5, L.hair); rect(c, 28, 14, 2, 5, L.hair); }
  else if (L.style === 'cap') { rect(c, 10, 8, 20, 6, L.accent); rect(c, 8, 13, 24, 2, shade(L.accent, -.25)); rect(c, 10, 15, 2, 4, L.hair); rect(c, 28, 15, 2, 4, L.hair); }
  else if (L.style === 'long') { rect(c, 10, 9, 20, 7, L.hair); rect(c, 10, 15, 2, 14, L.hair); rect(c, 28, 15, 2, 14, L.hair); }
  else if (L.style === 'scarf') { rect(c, 11, 12, 18, 3, L.hair); rect(c, 7, 8, 26, 4, shade(L.accent, .15)); rect(c, 7, 12, 4, 22, L.accent); rect(c, 29, 12, 4, 22, L.accent); rect(c, 11, 29, 18, 2, shade(L.accent, -.1)); }
  // eyes + mouth by mood
  const ec = '#1a1626', m = mood || 'neutral';
  if (m === 'happy') { rect(c, 14, 21, 4, 1, ec); rect(c, 15, 20, 2, 1, ec); rect(c, 22, 21, 4, 1, ec); rect(c, 23, 20, 2, 1, ec); rect(c, 17, 26, 6, 1, '#a0524e'); rect(c, 16, 25, 1, 1, '#a0524e'); rect(c, 23, 25, 1, 1, '#a0524e'); }
  else if (m === 'sad') { rect(c, 14, 20, 3, 3, ec); rect(c, 23, 20, 3, 3, ec); rect(c, 13, 18, 4, 1, ec); rect(c, 23, 18, 4, 1, ec); rect(c, 17, 26, 6, 1, '#a0524e'); rect(c, 16, 27, 1, 1, '#a0524e'); rect(c, 23, 27, 1, 1, '#a0524e'); }
  else { rect(c, 14, 20, 3, 4, ec); rect(c, 23, 20, 3, 4, ec); rect(c, 14, 20, 1, 1, '#fff'); rect(c, 23, 20, 1, 1, '#fff'); rect(c, 18, 26, 4, 1, '#a0524e'); }
  if (female) { rect(c, 12, 24, 3, 2, 'rgba(255,120,150,.35)'); rect(c, 25, 24, 3, 2, 'rgba(255,120,150,.35)'); }
}

/* ------------------------------------------------------------------ sky/tint */
const TOD_STOPS = [[0, 255, 190, 150, .22], [.25, 255, 230, 180, .08], [.5, 255, 255, 255, 0], [.7, 255, 200, 120, .1], [.82, 255, 150, 90, .22], [.92, 120, 80, 160, .34], [1, 20, 24, 70, .55]];
function todTint(t) {
  t = clamp(t, 0, 1);
  for (let i = 1; i < TOD_STOPS.length; i++) {
    const a = TOD_STOPS[i - 1], b = TOD_STOPS[i];
    if (t <= b[0]) { const k = (t - a[0]) / ((b[0] - a[0]) || 1); return [Math.round(lerp(a[1], b[1], k)), Math.round(lerp(a[2], b[2], k)), Math.round(lerp(a[3], b[3], k)), lerp(a[4], b[4], k)]; }
  }
  const l = TOD_STOPS[TOD_STOPS.length - 1]; return [l[1], l[2], l[3], l[4]];
}
/* day-sky colours used behind outdoor strips (timeline, roof) */
function skyGrad(c, x, y, w, h, tod) {
  const stops = [[0, '#ffb98a', '#ffe3b8'], [.25, '#8fc8ff', '#d6efff'], [.5, '#69b3ff', '#c8e8ff'], [.7, '#7aa9e8', '#ffd9a0'], [.82, '#e58a6a', '#ffc38a'], [.92, '#4a2f86', '#e58aa0'], [1, '#07061c', '#2a1a5e']];
  let a = stops[0], b = stops[stops.length - 1], k = 0;
  for (let i = 1; i < stops.length; i++) if (tod <= stops[i][0]) { a = stops[i - 1]; b = stops[i]; k = (tod - a[0]) / ((b[0] - a[0]) || 1); break; }
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, mix(a[1], b[1], k)); g.addColorStop(1, mix(a[2], b[2], k));
  c.fillStyle = g; c.fillRect(x, y, w, h);
}

/* ------------------------------------------------------------------- props */
const P = {
  tree(c, x, y, o) {
    o = o || {}; const n = o.night, bl = o.blossom;
    blob(c, x + 6, y, 15, 3, n ? 'rgba(2,2,20,.35)' : 'rgba(40,40,70,.22)'); blob(c, x + 3, y - 1, 9, 2, n ? 'rgba(2,2,20,.3)' : 'rgba(40,40,70,.18)');
    const g1 = bl ? (n ? '#8a5a80' : '#eaa3c3') : (n ? '#1d3a3a' : '#4f9a58');
    const g2 = bl ? (n ? '#9c6a92' : '#f6c3d9') : (n ? '#27494a' : '#66b56a');
    const g3 = bl ? (n ? '#6e4468' : '#d38aab') : (n ? '#16302f' : '#3c7d47');
    rect(c, x - 2, y - 13, 4, 13, n ? '#2b2030' : '#7a5238'); rect(c, x - 2, y - 13, 1, 13, n ? '#231a28' : '#68452f');
    blob(c, x, y - 25, 14, 10, g3); blob(c, x - 7, y - 21, 10, 8, g1); blob(c, x + 7, y - 21, 10, 8, g1); blob(c, x, y - 29, 11, 8, g2);
    blob(c, x - 4, y - 31, 4, 3, shade(g2, .15));
  },
  bush(c, x, y, n) { blob(c, x, y - 4, 8, 5, n ? '#1b3535' : '#4a9355'); blob(c, x - 3, y - 6, 5, 3, n ? '#25474a' : '#68b56b'); },
  bench(c, x, y, w) { w = w || 24; rect(c, x - w / 2 + 2, y, w, 2, 'rgba(30,30,60,.25)'); rect(c, x - w / 2, y - 12, w, 3, '#6e4529'); rect(c, x - w / 2, y - 7, w, 4, '#8a5a3a'); rect(c, x - w / 2, y - 4, w, 1, '#5b3a22'); rect(c, x - w / 2 + 1, y - 3, 2, 3, '#33261e'); rect(c, x + w / 2 - 3, y - 3, 2, 3, '#33261e'); },
  lamp(c, x, y, on) { rect(c, x, y - 1, 11, 2, 'rgba(30,30,60,.22)'); rect(c, x + 8, y - 2, 6, 1, 'rgba(30,30,60,.14)'); rect(c, x - 1, y - 28, 2, 28, '#2a2640'); rect(c, x - 4, y - 32, 8, 3, '#2a2640'); rect(c, x - 3, y - 29, 6, 2, on ? '#fff0b8' : '#8a8aa0'); rect(c, x - 3, y - 2, 6, 2, '#2a2640'); },
  desk(c, x, y) { rect(c, x - 9, y - 8, 18, 5, '#c9a068'); rect(c, x - 9, y - 3, 18, 2, '#9a7544'); rect(c, x - 8, y - 1, 2, 3, '#4a3a2c'); rect(c, x + 6, y - 1, 2, 3, '#4a3a2c'); rect(c, x - 5, y - 9, 5, 1, '#fff'); rect(c, x + 2, y - 9, 4, 1, '#d46a7a'); },
  chair(c, x, y) { rect(c, x - 4, y - 5, 8, 2, '#5a6aa0'); rect(c, x - 4, y - 9, 8, 4, '#4a5890'); rect(c, x - 3, y - 3, 1, 3, '#2a2a40'); rect(c, x + 2, y - 3, 1, 3, '#2a2a40'); },
  locker(c, x, y, w, n) { const col = n ? '#243a50' : '#3f7590'; rect(c, x, y - 26, w, 26, col); for (let i = 0; i < w; i += 10) { rect(c, x + i, y - 26, 1, 26, shade(col, -.25)); rect(c, x + i + 2, y - 22, 6, 1, shade(col, -.3)); rect(c, x + i + 2, y - 20, 6, 1, shade(col, -.3)); rect(c, x + i + 7, y - 12, 1, 3, '#d8dcec'); } rect(c, x, y - 26, w, 1, shade(col, .25)); },
  busSeat(c, x, y, w) { w = w || 24; rect(c, x, y - 16, w, 5, '#8c5f1f'); rect(c, x, y - 11, w, 9, '#d29a35'); rect(c, x, y - 11, w, 1, '#e8b75a'); rect(c, x, y - 3, w, 2, '#9c6f25'); rect(c, x + w / 2 - 1, y - 11, 2, 9, '#a87725'); },
  sofa(c, x, y, w) { w = w || 64; const col = '#5a4f8f'; rect(c, x - w / 2, y - 22, w, 12, shade(col, -.15)); rect(c, x - w / 2 - 4, y - 14, w + 8, 14, col); rect(c, x - w / 2, y - 12, w, 10, shade(col, .12)); rect(c, x - 1, y - 12, 1, 10, shade(col, -.2)); rect(c, x - w / 2 - 4, y - 2, w + 8, 2, shade(col, -.3)); },
  table(c, x, y, w) { w = w || 36; rect(c, x - w / 2, y - 10, w, 5, '#b98a5a'); rect(c, x - w / 2, y - 5, w, 2, '#8a6240'); rect(c, x - w / 2 + 2, y - 3, 2, 3, '#4a3626'); rect(c, x + w / 2 - 4, y - 3, 2, 3, '#4a3626'); },
  planter(c, x, y, w) { w = w || 22; rect(c, x - w / 2, y - 7, w, 7, '#a0603c'); rect(c, x - w / 2, y - 7, w, 2, '#c47a50'); rect(c, x - w / 2 + 1, y - 1, w - 2, 1, 'rgba(0,0,0,.25)'); rect(c, x - w / 2 + 1, y - 10, w - 2, 4, '#3f8a4c');
    const cols = ['#ff9ec4', '#fff2a8', '#ffffff', '#c3a6ff']; for (let i = 0; i < w - 3; i += 3) { rect(c, x - w / 2 + 2 + i, y - 12 - ((i * 7) % 3), 2, 2, cols[(i / 3 | 0) % 4]); } rect(c, x - w / 2 + 2, y, w, 2, 'rgba(30,30,60,.2)'); },
  plant(c, x, y) { rect(c, x - 3, y - 6, 6, 6, '#a0603c'); blob(c, x, y - 11, 5, 5, '#4a9355'); blob(c, x - 3, y - 14, 3, 3, '#68b56b'); blob(c, x + 3, y - 13, 3, 3, '#5aa863'); },
  car(c, x, y, col) { col = col || '#8e96a8'; rect(c, x - 17, y - 14, 34, 11, col); rect(c, x - 12, y - 22, 24, 9, shade(col, .15)); rect(c, x - 10, y - 20, 20, 6, '#26304e'); rect(c, x - 10, y - 20, 9, 6, '#33406a'); rect(c, x - 15, y - 5, 7, 5, '#15121f'); rect(c, x + 8, y - 5, 7, 5, '#15121f'); rect(c, x - 17, y - 11, 3, 2, '#ffe9a8'); rect(c, x + 14, y - 11, 3, 2, '#ffe9a8'); },
  door(c, x, y, w, h, col) { rect(c, x, y - h, w, h, col || '#7a5a3a'); rect(c, x + 2, y - h + 2, w - 4, h - 4, shade(col || '#7a5a3a', .12)); rect(c, x + w - 4, y - h / 2, 2, 2, '#e8d28a'); },
  windowPane(c, x, y, w, h, night) { rect(c, x - 1, y - 1, w + 2, h + 2, '#d9d2c2'); rect(c, x, y, w, h, night ? '#1e2a58' : '#9fd4ff'); rect(c, x, y, w, 1, 'rgba(255,255,255,.4)'); rect(c, x + w / 2, y, 1, h, '#d9d2c2'); rect(c, x, y + h / 2, w, 1, '#d9d2c2'); if (!night) { rect(c, x + 2, y + 2, 3, 1, 'rgba(255,255,255,.7)'); } },
  flagpole(c, x, y, t) { rect(c, x, y - 1, 16, 2, 'rgba(30,30,60,.2)'); rect(c, x - 1, y - 52, 2, 52, '#bfc4d8'); const w = Math.round(Math.sin(t * 2) * 1.5); rect(c, x + 1, y - 51, 14, 8, '#2f7a4f'); rect(c, x + 1 + w, y - 49, 6, 4, '#f4f4f4'); rect(c, x - 3, y - 2, 7, 2, '#8a8aa0'); },
  shelf(c, x, y, w) { w = w || 40; rect(c, x - w / 2, y - 30, w, 30, '#6d4a36'); for (let r = 0; r < 3; r++) { rect(c, x - w / 2 + 2, y - 27 + r * 9, w - 4, 7, '#33231a'); for (let i = 0; i < w - 8; i += 5) rect(c, x - w / 2 + 3 + i, y - 26 + r * 9, 3, 5, ['#d46a7a', '#6a8ad4', '#d4b86a', '#7ad49c'][(i / 5 + r) % 4 | 0]); } },
  tv(c, x, y) { rect(c, x - 14, y - 18, 28, 16, '#15121f'); rect(c, x - 12, y - 16, 24, 12, '#2a4a7a'); rect(c, x - 12, y - 16, 24, 2, '#5a8ad4'); rect(c, x - 4, y - 2, 8, 2, '#15121f'); },
  rug(c, x, y, w, h, col) { rect(c, x, y, w, h, col); rect(c, x + 2, y + 2, w - 4, h - 4, shade(col, .15)); rect(c, x + 5, y + 5, w - 10, h - 10, shade(col, -.1)); }
};

/* ------------------------------------------------------------- title screen */
let _stars = null;
function starList() {
  if (!_stars) { const r = rnd(7); _stars = []; for (let i = 0; i < 300; i++) _stars.push({ x: r(), y: r() * .8, s: r() < .1 ? 2 : 1, p: r() * 6.28, sp: .5 + r() * 2 }); }
  return _stars;
}
function drawTitleBG(c, t, W, H) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#06051a'); g.addColorStop(.55, '#1a1250'); g.addColorStop(.85, '#4b2b7c'); g.addColorStop(1, '#7c3b8c');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (const s of starList()) { const a = .35 + .65 * Math.abs(Math.sin(t * s.sp + s.p)); c.fillStyle = `rgba(255,255,255,${a})`; c.fillRect(Math.floor(s.x * W), Math.floor(s.y * H), s.s, s.s); }
  glowDot(c, Math.round(W * .8), Math.round(H * .2), Math.round(H * .3), '200,180,255', .22);
  blob(c, Math.round(W * .8), Math.round(H * .2), 7, 7, '#f5efff'); blob(c, Math.round(W * .8) - 2, Math.round(H * .2) - 1, 6, 6, '#e3dbff');
  // shooting star
  const ph = (t % 9) / 9; if (ph < .12) { const k = ph / .12, sx = W * (.15 + .5 * k), sy = H * (.08 + .2 * k); c.strokeStyle = `rgba(255,255,255,${1 - k})`; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx - 16, sy - 6); c.stroke(); }
  // hills
  const hy = Math.round(H * .8);
  c.fillStyle = '#150f3a'; for (let x = 0; x < W; x += 2) { const y = hy + Math.sin(x * .03 + 1) * 6 + Math.sin(x * .011) * 8; c.fillRect(x, Math.round(y), 2, H - y); }
  c.fillStyle = '#0c0828'; for (let x = 0; x < W; x += 2) { const y = hy + 14 + Math.sin(x * .05 + 3) * 4 + Math.sin(x * .017 + 2) * 6; c.fillRect(x, Math.round(y), 2, H - y); }
  // tiny school + bus silhouettes
  const bx = Math.round(W * .12), by = hy + 8;
  rect(c, bx, by - 12, 26, 12, '#07051a'); rect(c, bx + 3, by - 9, 4, 3, '#ffd98a'); rect(c, bx + 10, by - 9, 4, 3, '#ffd98a'); rect(c, bx + 17, by - 9, 4, 3, '#ffd98a');
  rect(c, bx + 40, by - 8, 18, 8, '#07051a'); rect(c, bx + 42, by - 6, 3, 2, '#ffd98a'); rect(c, bx + 47, by - 6, 3, 2, '#ffd98a'); rect(c, bx + 52, by - 6, 3, 2, '#ffd98a');
  // two distant figures that slowly drift closer
  const gap = 24 + 20 * (1 - Math.min(1, (t % 40) / 40));
  const fx = Math.round(W * .55), fy = hy + 18;
  drawChar(c, 'yahya', fx - gap, fy, 'right', 0, { t, scale: .8 }); drawChar(c, 'momna', fx + gap, fy, 'left', 0, { t, scale: .8 });
  glowDot(c, fx, fy - 10, 40, '255,200,255', .08);
}

/* ---------------------------------------------------- the night world (final) */
/* Drawn in the school scene's coordinates: the school sits at x 0..320, y 0..480.
   Everything else — the whole story — lies to the left and right of it. */
const WORLD_CAPS = [
  { x: -1020, t: 'The New Bus' }, { x: -830, t: 'Always looking for her' }, { x: -650, t: 'The wrong account' },
  { x: -480, t: 'Iftekhar' }, { x: -300, t: 'The long wait' },
  { x: 470, t: 'A message' }, { x: 640, t: 'Two homes, one misunderstanding' }, { x: 790, t: 'Two families' }, { x: 960, t: 'A good friend' }, { x: 1180, t: 'What comes next' }
];
function drawWorldSurround(c, t, cam) {
  const GY = 330;
  // sky
  const sg = c.createLinearGradient(0, -700, 0, GY); sg.addColorStop(0, '#05041a'); sg.addColorStop(.6, '#150f48'); sg.addColorStop(1, '#3b2476');
  c.fillStyle = sg; c.fillRect(-1500, -700, 3500, GY + 700);
  const r = rnd(11);
  for (let i = 0; i < 260; i++) { const x = -1500 + r() * 3500, y = -700 + r() * 880, a = .35 + .65 * Math.abs(Math.sin(t * (.6 + r() * 1.8) + i)); c.fillStyle = `rgba(255,255,255,${a})`; c.fillRect(Math.round(x), Math.round(y), r() < .12 ? 2 : 1, r() < .12 ? 2 : 1); }
  glowDot(c, 380, -110, 150, '200,180,255', .18); blob(c, 380, -110, 11, 11, '#f5efff'); blob(c, 377, -113, 9, 9, '#e3dbff');
  // far hills
  c.fillStyle = '#120c34'; for (let x = -1500; x < 2000; x += 3) { const y = GY - 34 + Math.sin(x * .011) * 22 + Math.sin(x * .027 + 2) * 10; c.fillRect(x, Math.round(y), 3, 40); }
  // ground
  c.fillStyle = '#0c0d28'; c.fillRect(-1500, GY, 3500, 700);
  c.fillStyle = '#10123a'; c.fillRect(-1500, GY, 3500, 2);
  // road / path at y ~ 438..468 outside the school, glowing faintly
  c.fillStyle = '#1b1a46'; c.fillRect(-1500, 438, 3500, 34); c.fillStyle = '#26245a'; for (let x = -1500; x < 2000; x += 26) c.fillRect(x, 454, 12, 2);
  // school walls & roof so the building reads as a building
  rect(c, -8, -16, 336, 16, '#2a2652'); rect(c, -8, -18, 336, 3, '#3b3670'); for (let x = 6; x < 320; x += 24) glowDot(c, x, -8, 10, '255,220,150', .35);
  rect(c, -8, -16, 8, 430, '#1b183a'); rect(c, 320, -16, 8, 430, '#1b183a');

  const warm = '255,214,140';
  // 1 — the bus
  { const x = -1020, y = GY + 48;
    rect(c, x - 62, y - 40, 124, 36, '#c9a23a'); rect(c, x - 62, y - 40, 124, 4, '#e8c75a'); rect(c, x - 62, y - 16, 124, 3, '#8a6f22');
    for (let i = 0; i < 6; i++) rect(c, x - 54 + i * 19, y - 34, 14, 11, '#ffe9a8'), rect(c, x - 54 + i * 19, y - 34, 14, 2, '#fff5cf');
    blob(c, x - 38, y - 3, 6, 6, '#15121f'); blob(c, x + 38, y - 3, 6, 6, '#15121f'); rect(c, x + 60, y - 14, 5, 5, '#fff0b8');
    glowDot(c, x + 66, y - 12, 38, warm, .5); glowDot(c, x, y - 28, 90, warm, .12);
    rect(c, x - 20, y - 46, 40, 5, '#15121f'); }
  // 2 — school-day sign + corridor lamp
  { const x = -830, y = GY + 50;
    rect(c, x - 40, y - 56, 80, 56, '#2a2652'); rect(c, x - 40, y - 60, 80, 6, '#3b3670');
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const on = ((i + j + Math.floor(t * .3)) % 3) !== 0; rect(c, x - 32 + i * 24, y - 48 + j * 22, 16, 14, on ? '#ffe3a0' : '#2c3470'); }
    rect(c, x - 6, y - 14, 12, 14, '#0e0b26'); P.lamp(c, x + 56, y, true); glowDot(c, x + 56, y - 28, 60, warm, .3);
    for (let k = 0; k < 4; k++) { rect(c, x - 72 + k * 6, y - 4 - k * 2, 3, 1, '#4a3f90'); } }
  // 3 — the wrong account: floating phone, small "x"
  { const x = -650, y = GY + 20 + Math.sin(t * 1.4) * 3;
    rect(c, x - 14, y - 50, 28, 46, '#171436'); rect(c, x - 12, y - 47, 24, 40, '#2d2670'); rect(c, x - 12, y - 47, 24, 6, '#5a46c0');
    blob(c, x, y - 32, 6, 6, '#ff8fb1'); rect(c, x - 8, y - 22, 16, 2, '#7d71c8'); rect(c, x - 6, y - 17, 12, 2, '#5a50a0'); rect(c, x - 4, y - 12, 8, 3, '#7d6bff');
    rect(c, x + 8, y - 54, 2, 6, '#ff6f8f'); rect(c, x + 6, y - 52, 6, 2, '#ff6f8f');
    glowDot(c, x, y - 28, 70, '150,120,255', .3); }
  // 4 — the clue board: "Iftekhar"
  { const x = -480, y = GY + 52;
    rect(c, x - 46, y - 50, 92, 50, '#3b2c24'); rect(c, x - 46, y - 50, 92, 3, '#6b4a36'); rect(c, x - 46, y - 3, 92, 3, '#6b4a36'); rect(c, x - 46, y - 50, 3, 50, '#6b4a36'); rect(c, x + 43, y - 50, 3, 50, '#6b4a36');
    rect(c, x - 38, y - 42, 20, 14, '#fff3a8'); rect(c, x - 12, y - 44, 22, 14, '#ffd6e8'); rect(c, x + 16, y - 40, 20, 14, '#fff3a8'); rect(c, x - 30, y - 22, 28, 14, '#c9f0ff');
    c.strokeStyle = '#ff6f8f'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 28, y - 42); c.lineTo(x - 1, y - 44); c.lineTo(x + 26, y - 40); c.lineTo(x - 16, y - 22); c.stroke();
    rect(c, x - 2, y - 14, 36, 8, '#f8f4ea'); for (let i = 0; i < 8; i++) rect(c, x + 1 + i * 4, y - 12, 2, 4, '#ff7fc8');
    glowDot(c, x, y - 30, 80, warm, .16); }
  // 5 — timeline posts (the long wait) walking toward the school
  { for (let i = 0; i < 8; i++) { const x = -360 + i * 40, y = GY + 56; rect(c, x - 1, y - 30, 2, 30, '#4a3f90'); rect(c, x - 8, y - 38, 16, 11, '#f7f1e6'); rect(c, x - 8, y - 38, 16, 3, '#c4506b'); rect(c, x - 5, y - 32, 10, 1, '#8a7fb0'); rect(c, x - 5, y - 30, 7, 1, '#8a7fb0'); glowDot(c, x, y - 32, 18, '255,200,230', .18); } }
  // 6 — a message (chat bubbles floating)
  { const x = 470, y = GY + 30;
    for (let i = 0; i < 3; i++) { const by = y - 20 - i * 18 + Math.sin(t * 1.2 + i) * 2, me = i % 2; rect(c, x - 22 + (me ? 12 : 0), by, 30, 11, me ? '#7a5cff' : '#3a3470'); rect(c, x - 18 + (me ? 12 : 0), by + 4, 18, 2, 'rgba(255,255,255,.55)'); }
    glowDot(c, x, y - 30, 70, '150,120,255', .25); P.lamp(c, x + 50, y + 22, true); glowDot(c, x + 50, y - 10, 50, warm, .25); }
  // 7 — two houses and the thread between them
  { const y = GY + 54;
    [[600, '#2b2660'], [690, '#33266a']].forEach(([x, col], i) => {
      rect(c, x - 30, y - 50, 60, 50, col); rect(c, x - 34, y - 58, 68, 10, '#1b183a'); rect(c, x - 20, y - 78 + 20, 40, 1, '#1b183a');
      for (let k = 0; k < 2; k++) rect(c, x - 20 + k * 22, y - 40, 14, 14, '#ffd98a'), rect(c, x - 14 + k * 22, y - 40, 1, 14, '#a07a3a');
      rect(c, x - 5, y - 18, 10, 18, '#0e0b26'); glowDot(c, x, y - 32, 70, warm, .22);
    });
    c.strokeStyle = 'rgba(255,200,230,.55)'; c.beginPath(); c.moveTo(630, y - 54); c.quadraticCurveTo(645, y - 40 + Math.sin(t) * 2, 660, y - 54); c.stroke(); }
  // 8 — two families (table with warm light)
  { const x = 790, y = GY + 54; P.table(c, x, y, 40); rect(c, x - 6, y - 16, 12, 6, '#fff0b8'); glowDot(c, x, y - 16, 70, warm, .35);
    drawChar(c, 'mother1', x - 22, y, 'right', 0, { t, sit: true, scale: .9 }); drawChar(c, 'mother2', x + 22, y, 'left', 0, { t, sit: true, scale: .9 }); P.table(c, x, y, 40); }
  // 9 — the blossom bench: Momna's friend
  { const x = 960, y = GY + 54; P.tree(c, x + 24, y, { blossom: true, night: true }); P.bench(c, x, y, 30);
    drawChar(c, 'momnaFriend', x - 6, y - 1, 'down', 0, { t, sit: true, scale: .85 }); glowDot(c, x, y - 18, 70, '255,170,220', .22);
    for (let i = 0; i < 6; i++) { const px = x + 10 + ((t * 8 + i * 17) % 60) - 18, py = y - 50 + ((t * 10 + i * 23) % 58); rect(c, px, py, 2, 1, 'rgba(255,190,215,.8)'); } }
  // 10 — the road onward: lamp posts shrinking to the horizon
  { for (let i = 0; i < 6; i++) { const x = 1090 + i * 60, s = 1 - i * .1, y = GY + 52 - i * 2; rect(c, x - 1, y - 30 * s, 2, 30 * s, '#2a2640'); rect(c, x - 3, y - 33 * s, 6, 3, '#2a2640'); glowDot(c, x, y - 31 * s, 34 * s, warm, .35); }
    for (let i = 0; i < 6; i++) { const sx = 1100 + i * 70 + Math.sin(t + i) * 4, sy = GY - 90 - i * 24 + Math.cos(t * .8 + i) * 3; c.fillStyle = `rgba(255,${190 + i * 8},230,${.5 + .4 * Math.sin(t * 2 + i)})`; c.fillRect(Math.round(sx), Math.round(sy), 2, 2); } }

  // captions fade in near the camera
  c.font = 'italic 17px Georgia, serif'; c.textAlign = 'center';
  for (const cp of WORLD_CAPS) {
    const a = clamp(1.2 - Math.abs(cam.cx - cp.x) / 170, 0, 1) * (cam.z < .8 ? 1 : 0);
    if (a <= .02) continue;
    c.fillStyle = `rgba(30,10,70,${a * .55})`; c.fillText(cp.t, cp.x + 1, GY - 108 + 1);
    c.fillStyle = `rgba(255,244,255,${a})`; c.fillText(cp.t, cp.x, GY - 108);
  }
}

/* ---------------------------------------- mini illustrated scenes (DOM canvases) */
/* A small cosy room with someone on the phone — used for the "families" call */
function drawMiniRoom(cnv, o) {
  const W = cnv.width, H = cnv.height, c = cnv.getContext('2d'); c.imageSmoothingEnabled = false;
  const warm = o.warm !== false;
  const wall = o.wall || '#4a3a74', floor = o.floor || '#2a2144';
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, mix(wall, '#000', .35)); g.addColorStop(1, wall); c.fillStyle = g; c.fillRect(0, 0, W, H * .72);
  rect(c, 0, Math.round(H * .72), W, H, floor); rect(c, 0, Math.round(H * .72), W, 2, shade(floor, .2));
  P.windowPane(c, 12, 12, 34, 30, true); for (let i = 0; i < 8; i++) rect(c, 14 + (i * 7) % 30, 14 + (i * 5) % 24, 1, 1, 'rgba(255,255,255,.8)'); blob(c, 38, 20, 3, 3, '#f5efff');
  P.shelf(c, W - 30, Math.round(H * .72), 36);
  P.sofa(c, Math.round(W * .5), Math.round(H * .8), 70);
  P.lamp(c, W - 60, Math.round(H * .78), true);
  glowDot(c, W - 60, Math.round(H * .78) - 30, 60, '255,214,140', warm ? .45 : .2);
  drawChar(c, o.who, Math.round(W * .5), Math.round(H * .78), 'down', 0, { t: 0, scale: 2.5, sit: true });
  rect(c, Math.round(W * .5) + 8, Math.round(H * .5), 8, 12, '#0a0818'); rect(c, Math.round(W * .5) + 9, Math.round(H * .5) + 1, 6, 9, '#8f7bff');
  glowDot(c, Math.round(W * .5) + 12, Math.round(H * .5) + 6, 26, '160,130,255', .5);
}
/* Golden-hour bench scene — the friend flashback */
function drawMiniBench(cnv, o) {
  const W = cnv.width, H = cnv.height, c = cnv.getContext('2d'); c.imageSmoothingEnabled = false;
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f6b88a'); g.addColorStop(.55, '#f4d5b0'); g.addColorStop(1, '#8aa86f'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  blob(c, Math.round(W * .8), 22, 12, 12, '#fff0c8'); glowDot(c, Math.round(W * .8), 22, 60, '255,230,170', .5);
  rect(c, 0, Math.round(H * .62), W, H, '#7d9a62'); for (let x = 0; x < W; x += 6) rect(c, x, Math.round(H * .62) + ((x * 7) % 5), 2, 3, '#93b378');
  P.tree(c, Math.round(W * .2), Math.round(H * .75), { blossom: true }); P.tree(c, Math.round(W * .86), Math.round(H * .72), { blossom: true });
  const by = Math.round(H * .86), bx = Math.round(W * .52);
  drawChar(c, 'momna', bx - 14, by - 2, 'right', 0, { t: 0, scale: 2.2, sit: true });
  drawChar(c, 'momnaFriend', bx + 14, by - 2, 'left', 0, { t: 0, scale: 2.2, sit: true });
  P.bench(c, bx, by, 64);
  const r = rnd(5); for (let i = 0; i < 24; i++) rect(c, Math.round(r() * W), Math.round(r() * H * .8), 2, 1, 'rgba(255,190,215,.9)');
}
