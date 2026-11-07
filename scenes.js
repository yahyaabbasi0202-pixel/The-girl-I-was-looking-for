/* ==========================================================================
   scenes.js — the explorable places.
   Each builder returns a scene: size, pre-rendered background, props that
   sort by depth, solids, lights, spawn point and named anchors the story
   uses to place interactions. Scenes carry no story logic of their own.
   ========================================================================== */
'use strict';

const SCENES = {};

/* The camera framing used when Yahya first notices Momna — and again in the
   final scene. One definition, used twice: that is the visual callback. */
const FIRST_SHOT = {
  x: 214, y: 232,
  /* zoom adapts to the screen so both of them always fit between the cinema bars (tall phone or wide PC) */
  get z() { return Math.max(.7, Math.min(1.5, VH * .8 / 126, VW * .8 / 130)); },
  yahya:     { x: 176, y: 270 },
  momnaFar:  { x: 248, y: 204 },
  momnaNear: { x: 199, y: 270 },
  friendFar: { x: 270, y: 208 }
};

/* ---------------------------------------------------------------- shared bits */
function tileFloor(c, x, y, w, h, a, b, line) {
  rect(c, x, y, w, h, a);
  for (let j = 0; j < h; j += 12) for (let i = 0; i < w; i += 12) if (((i / 12 | 0) + (j / 12 | 0)) % 2) rect(c, x + i, y + j, 12, 12, b);
  if (line) for (let j = 0; j < h; j += 12) rect(c, x, y + j, w, 1, line);
}
function woodFloor(c, x, y, w, h, a, b) {
  rect(c, x, y, w, h, a);
  for (let j = 0; j < h; j += 8) { rect(c, x, y + j, w, 1, b); for (let i = ((j / 8 | 0) % 2) * 14; i < w; i += 28) rect(c, x + i, y + j, 1, 8, b); }
}
function paving(c, x, y, w, h, base, line) {
  rect(c, x, y, w, h, base);
  for (let j = 0; j < h; j += 16) { rect(c, x, y + j, w, 1, line); const off = ((j / 16 | 0) % 2) * 12; for (let i = off; i < w; i += 24) rect(c, x + i, y + j, 1, 16, line); }
}
function baseScene(W, H, o) {
  return Object.assign({ w: W, h: H, props: [], npcs: [], solids: [], lights: [], interacts: [], triggers: [], A: {} }, o);
}
function treeProp(x, y, opt) { return { y, draw: c => P.tree(c, x, y, opt) }; }
function benchProp(x, y, w) { return { y, draw: c => P.bench(c, x, y, w) }; }
function lampProp(x, y, on) { return { y, draw: c => P.lamp(c, x, y, on) }; }
function propOf(y, fn) { return { y, draw: fn }; }

/* ================================================================== COURTYARD
   320 x 420.  School facade up top, open plaza, gate at the bottom. */
function courtyardBG(c, night) {
  const W = 320, H = 420;
  const K = night
    ? { wall: '#2e2c63', trim: '#4a4a95', roof: '#1b1a42', ground: '#1e1e47', line: '#2a2a62', grass: '#12303c', grass2: '#1b4250', path: '#2b2b5c', step: '#3a3a78', win: '#ffd98a', winOff: '#232b66', hedge: '#0f2a30', wallLo: '#25235a' }
    : { wall: '#efe3cf', trim: '#4a6fb5', roof: '#38579a', ground: '#d8c9b2', line: '#c4b39b', grass: '#6aa860', grass2: '#7fbd72', path: '#e5d8c2', step: '#f2e8d6', win: '#9fd4ff', winOff: '#7cb9ea', hedge: '#4d8f4f', wallLo: '#e2d3bb' };
  const r = rnd(4);
  rect(c, 0, 0, W, H, K.ground);
  // facade
  rect(c, 0, 30, W, 88, K.wall); rect(c, 0, 100, W, 18, K.wallLo);
  rect(c, 0, 12, W, 18, K.roof); rect(c, 0, 8, W, 4, shade(K.roof, .18)); rect(c, 0, 29, W, 2, shade(K.roof, -.25));
  for (let x = 4; x < W; x += 12) rect(c, x, 14, 6, 1, shade(K.roof, -.12));
  const winXs = [18, 52, 86, 214, 248, 282];
  winXs.forEach((x, i) => {
    rect(c, x - 2, 44, 28, 36, shade(K.wall, -.28)); const lit = night ? (i % 3 !== 1) : true;
    rect(c, x, 46, 24, 32, lit ? K.win : K.winOff);
    rect(c, x + 11, 46, 2, 32, shade(K.wall, -.2)); rect(c, x, 61, 24, 2, shade(K.wall, -.2));
    if (!night) { rect(c, x + 2, 48, 6, 2, 'rgba(255,255,255,.7)'); rect(c, x + 14, 66, 5, 1, 'rgba(255,255,255,.4)'); }
    else if (lit) { rect(c, x + 2, 48, 8, 12, 'rgba(255,240,190,.35)'); }
  });
  // central door + plaque
  rect(c, 124, 34, 72, 10, K.trim); rect(c, 124, 34, 72, 2, shade(K.trim, .25));
  rect(c, 134, 50, 52, 3, shade(K.wall, -.15));
  for (let i = 0; i < 9; i++) rect(c, 140 + i * 5, 38, 3, 3, night ? '#ffe8b0' : '#f4f0e6');
  rect(c, 142, 74, 36, 44, shade(K.wall, -.35)); rect(c, 144, 76, 32, 42, night ? '#3b2d1f' : '#7a5a3a');
  rect(c, 159, 76, 2, 42, shade(K.wall, -.45)); rect(c, 154, 98, 2, 3, '#e8d28a'); rect(c, 164, 98, 2, 3, '#e8d28a');
  rect(c, 146, 78, 12, 14, night ? '#ffd98a' : '#9fd4ff'); rect(c, 162, 78, 12, 14, night ? '#ffd98a' : '#9fd4ff');
  // steps
  for (let i = 0; i < 3; i++) { rect(c, 130 - i * 4, 118 + i * 6, 60 + i * 8, 6, i % 2 ? K.step : shade(K.step, -.06)); rect(c, 130 - i * 4, 123 + i * 6, 60 + i * 8, 1, shade(K.step, -.25)); }
  // plaza
  paving(c, 0, 136, W, H - 136, K.ground, K.line);
  // central path (a little lighter)
  for (let j = 136; j < H - 12; j += 16) { rect(c, 134, j, 52, 16, K.path); rect(c, 134, j, 52, 1, K.line); }
  rect(c, 134, 136, 1, H - 148, K.line); rect(c, 185, 136, 1, H - 148, K.line);
  // grass beds
  [[0, 150, 46, 230], [274, 150, 46, 230]].forEach(([x, y, w, h]) => {
    rect(c, x, y, w, h, K.grass);
    for (let i = 0; i < 90; i++) rect(c, x + r() * (w - 2), y + r() * (h - 2), 2, 1, K.grass2);
    rect(c, x + (x ? 0 : w - 2), y, 2, h, shade(K.ground, -.15));
  });
  // low hedges along both sides
  rect(c, 0, 136, 14, 270, K.hedge); rect(c, 306, 136, 14, 270, K.hedge);
  for (let y = 138; y < 400; y += 5) { rect(c, 1, y, 3, 2, shade(K.hedge, .15)); rect(c, 309, y, 3, 2, shade(K.hedge, .15)); }
  // flower dots in beds
  for (let i = 0; i < 24; i++) { const side = i % 2 ? 280 : 18, fx = side + r() * 34, fy = 160 + r() * 200; rect(c, fx, fy, 1, 1, ['#ff9ec4', '#fff2a8', '#ffffff', '#c3a6ff'][i % 4]); }
  // bottom wall + gate
  rect(c, 0, 404, W, 16, shade(K.wall, -.25)); rect(c, 0, 404, W, 2, shade(K.wall, -.05));
  for (let x = 0; x < W; x += 10) rect(c, x, 408, 1, 12, shade(K.wall, -.4));
  rect(c, 128, 400, 10, 20, K.trim); rect(c, 182, 400, 10, 20, K.trim); rect(c, 126, 396, 14, 6, shade(K.trim, .2)); rect(c, 180, 396, 14, 6, shade(K.trim, .2));
  rect(c, 138, 404, 44, 16, night ? '#0b0a22' : '#bfb7a3');
  rect(c, 138, 412, 44, 8, night ? '#171638' : '#a7a08f');
  for (let x = 140; x < 182; x += 6) rect(c, x, 404, 1, 16, night ? '#2a2a62' : '#8c8672');
  // school crest in the middle of the plaza (a flattened ring, so it reads from above)
  { const cx = 160, cy = 300, ring = night ? '#3a3a82' : '#cdbb9d', fill = night ? '#2c2c68' : '#ecdfc7', mid = night ? '#4a4a98' : '#e0a8b8';
    blob(c, cx, cy, 34, 17, ring); blob(c, cx, cy, 31, 15, K.path); blob(c, cx, cy, 24, 11, ring); blob(c, cx, cy, 22, 10, fill);
    for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; rect(c, cx + Math.cos(an) * 14 - 1, cy + Math.sin(an) * 6.5 - 1, 3, 3, mid); }
    blob(c, cx, cy, 6, 3, mid); blob(c, cx, cy, 3, 1, night ? '#ffd98a' : '#fff6d0'); }
  // the building throws a soft shadow onto the plaza; trees drop dappled patches
  { const sh = c.createLinearGradient(0, 136, 0, 170); sh.addColorStop(0, night ? 'rgba(0,0,20,.35)' : 'rgba(40,40,80,.2)'); sh.addColorStop(1, 'rgba(40,40,80,0)'); c.fillStyle = sh; c.fillRect(0, 136, W, 34);
    if (!night) [[250, 208, 20, 5], [244, 214, 12, 3], [46, 312, 16, 4], [262, 378, 18, 4], [44, 206, 15, 4]].forEach(([x, y, rw, rh]) => blob(c, x, y, rw, rh, 'rgba(30,60,50,.13)')); }
  // path details: small pebbles
  for (let i = 0; i < 40; i++) rect(c, 10 + r() * 300, 140 + r() * 255, 1, 1, shade(K.ground, -.12));
}

SCENES.courtyard = function (o) {
  o = o || {}; const night = !!o.night, W = 320, H = 420;
  const bg = mk(W, H); courtyardBG(bg.getContext('2d'), night);
  const sc = baseScene(W, H, {
    bg, outdoor: !night, tod: o.tod !== undefined ? o.tod : .3, spawn: { x: 160, y: 396, dir: 'up' },
    bounds: { x0: 18, y0: 136, x1: 302, y1: 408 }, name: 'courtyard', night
  });
  sc.A = { door: { x: 160, y: 126 }, gate: { x: 160, y: 402 }, benchL: { x: 62, y: 314 }, benchR: { x: 246, y: 304 }, tree: { x: 262, y: 204 }, shot: FIRST_SHOT, flag: { x: 96, y: 200 } };
  // props (y-sorted)
  const blossom = true;
  sc.props.push(treeProp(262, 196, { night, blossom }), treeProp(36, 306, { night, blossom }), treeProp(272, 372, { night }), treeProp(36, 200, { night }));
  sc.props.push(benchProp(62, 314, 26), benchProp(246, 304, 26));
  sc.props.push(propOf(144, c => P.planter(c, 122, 146, 22)), propOf(144, c => P.planter(c, 198, 146, 22)));
  sc.props.push(propOf(200, (c, t) => P.flagpole(c, 96, 200, t)));
  [[84, 176], [238, 214], [104, 340], [214, 340]].forEach(([x, y]) => sc.props.push(lampProp(x, y, night)));
  sc.solids.push({ x: 33, y: 301, w: 6, h: 6 }, { x: 259, y: 191, w: 6, h: 6 }, { x: 33, y: 195, w: 6, h: 6 }, { x: 269, y: 367, w: 6, h: 6 }, { x: 49, y: 306, w: 26, h: 8 }, { x: 233, y: 296, w: 26, h: 8 }, { x: 93, y: 196, w: 6, h: 4 });
  if (night) {
    const fx = night ? 'firefly' : 'petal';
    sc.dark = { r: 8, g: 6, b: 40, a: o.world ? .42 : .55 };
    [[84, 148], [238, 186], [104, 312], [214, 312]].forEach(([x, y]) => sc.lights.push({ x, y, r: 74, c: '255,220,150', a: .32 }));
    sc.lights.push({ x: 160, y: 108, r: 70, c: '255,210,140', a: .3 }, { x: 160, y: 404, r: 60, c: '255,214,150', a: .2 }, { x: 262, y: 176, r: 56, c: '255,170,220', a: .18 }, { x: 36, y: 280, r: 48, c: '255,170,220', a: .12 });
    sc.fx = { type: fx, count: 26, region: { x: 0, y: 140, w: W, h: 270 } };
    sc.voidColor = '#05041a';
  } else {
    sc.fx = { type: 'petal', count: 14, region: { x: 0, y: 140, w: W, h: 270 } };
  }
  if (o.world) sc.drawBefore = (c, t) => drawWorldSurround(c, t, G.view);
  return sc;
};

/* ================================================================== CORRIDOR */
SCENES.corridor = function (o) {
  o = o || {}; const W = 420, H = 150, bg = mk(W, H), c = bg.getContext('2d');
  const wall = '#e6dcc6', trim = '#4a6fb5';
  rect(c, 0, 0, W, 78, wall); rect(c, 0, 0, W, 6, '#cfc3aa'); rect(c, 0, 56, W, 22, '#d6c9b0'); rect(c, 0, 56, W, 1, '#b9ab90'); rect(c, 0, 76, W, 2, '#8e8168');
  tileFloor(c, 0, 78, W, 72, '#cdbfa8', '#c0b19a', '#b3a58f');
  // exit door (left)
  rect(c, 12, 34, 28, 44, '#5a4a38'); rect(c, 14, 36, 24, 42, '#8a6a46'); rect(c, 25, 36, 2, 42, '#5a4a38'); rect(c, 32, 58, 2, 3, '#e8d28a'); rect(c, 14, 28, 24, 5, '#c4506b'); rect(c, 18, 29, 16, 3, '#fff');
  P.locker(c, 52, 78, 90); P.locker(c, 312, 78, 90);
  // window with a sun beam
  P.windowPane(c, 158, 18, 40, 36, false);
  c.fillStyle = 'rgba(255,244,205,.2)'; c.beginPath(); c.moveTo(158, 54); c.lineTo(198, 54); c.lineTo(232, 150); c.lineTo(180, 150); c.fill();
  // notice board
  rect(c, 212, 20, 42, 32, '#7a5a3a'); rect(c, 214, 22, 38, 28, '#b98e5e'); rect(c, 217, 25, 10, 8, '#fff'); rect(c, 230, 24, 9, 10, '#ffd98a'); rect(c, 242, 26, 8, 8, '#ffb2cc'); rect(c, 220, 37, 12, 8, '#c9f0ff'); rect(c, 236, 38, 12, 9, '#fff');
  // classroom door
  rect(c, 266, 30, 32, 48, '#5a4a38'); rect(c, 268, 32, 28, 46, '#6f9a74'); rect(c, 273, 36, 18, 14, '#d4ecff'); rect(c, 281, 36, 2, 14, '#5a4a38'); rect(c, 270, 56, 2, 3, '#e8d28a'); rect(c, 270, 22, 28, 7, '#2a2a40'); rect(c, 273, 24, 22, 3, '#fff3a8');
  // ceiling lights
  [60, 150, 240, 330].forEach(x => { rect(c, x - 14, 0, 28, 3, '#fffbe0'); });
  // bench + plant
  rect(c, 150, 130, 40, 3, '#7a5a3a'); rect(c, 150, 133, 2, 6, '#3d2d1e'); rect(c, 188, 133, 2, 6, '#3d2d1e');
  const sc = baseScene(W, H, {
    bg, spawn: { x: 52, y: 100, dir: 'right' }, bounds: { x0: 16, y0: 90, x1: 404, y1: 142 }, name: 'corridor', ambient: 'rgba(255,236,200,.04)',
    voidColor: '#0a0818'
  });
  sc.A = { exit: { x: 26, y: 82 }, classDoor: { x: 282, y: 86 }, lockersA: { x: 100, y: 88 }, lockersB: { x: 356, y: 88 }, board: { x: 232, y: 70 }, window: { x: 178, y: 80 }, bench: { x: 170, y: 126 } };
  sc.props.push(propOf(140, c2 => P.plant(c2, 394, 142)), propOf(140, c2 => P.plant(c2, 30, 142)));
  sc.fx = { type: 'dust', count: 16, region: { x: 150, y: 20, w: 100, h: 120 } };
  [60, 150, 240, 330].forEach(x => sc.lights.push({ x, y: 6, r: 60, c: '255,240,200', a: .08 }));
  return sc;
};

/* ================================================================== CLASSROOM */
SCENES.classroom = function (o) {
  o = o || {}; const W = 300, H = 170, bg = mk(W, H), c = bg.getContext('2d');
  rect(c, 0, 0, W, 66, '#ece2cf'); rect(c, 0, 52, W, 14, '#d9cdb5'); rect(c, 0, 64, W, 2, '#8e8168');
  woodFloor(c, 0, 66, W, 104, '#c9a574', '#b78f5c');
  // blackboard
  rect(c, 84, 8, 132, 40, '#6d4a36'); rect(c, 87, 11, 126, 34, '#254a3c'); rect(c, 87, 11, 126, 2, '#2f5c4b');
  c.fillStyle = 'rgba(255,255,255,.75)'; rect(c, 96, 18, 40, 1, 'rgba(255,255,255,.7)'); rect(c, 96, 24, 62, 1, 'rgba(255,255,255,.55)'); rect(c, 96, 30, 30, 1, 'rgba(255,255,255,.55)');
  rect(c, 150, 36, 30, 3, '#f4f0e6'); rect(c, 184, 38, 4, 2, '#ffd98a');
  // windows
  P.windowPane(c, 236, 14, 44, 30, false); P.windowPane(c, 20, 14, 44, 30, false);
  c.fillStyle = 'rgba(255,244,205,.16)'; c.beginPath(); c.moveTo(236, 44); c.lineTo(280, 44); c.lineTo(250, 170); c.lineTo(180, 170); c.fill();
  // door (left wall)
  rect(c, 0, 100, 10, 52, '#5a4a38'); rect(c, 2, 102, 8, 50, '#6f9a74');
  // teacher desk
  P.desk(c, 150, 72); rect(c, 145, 56, 10, 6, '#c4506b');
  // student desks
  const sc = baseScene(W, H, { bg, spawn: { x: 24, y: 128, dir: 'right' }, bounds: { x0: 14, y0: 84, x1: 288, y1: 162 }, name: 'classroom', voidColor: '#0a0818', ambient: 'rgba(255,236,200,.04)' });
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {
    const x = 60 + i * 56, y = 108 + j * 24;
    sc.props.push(propOf(y, c2 => { P.chair(c2, x, y + 5); P.desk(c2, x, y); }));
    sc.solids.push({ x: x - 9, y: y - 8, w: 18, h: 8 });
  }
  sc.A = { exit: { x: 20, y: 128 }, window: { x: 258, y: 86 }, board: { x: 150, y: 84 }, window2: { x: 42, y: 86 }, seatHer: { x: 232, y: 96 }, teacher: { x: 150, y: 90 } };
  sc.fx = { type: 'dust', count: 14, region: { x: 190, y: 40, w: 90, h: 120 } };
  sc.lights.push({ x: 260, y: 40, r: 90, c: '255,240,200', a: .08 });
  return sc;
};

/* ================================================================== BUS */
SCENES.bus = function (o) {
  o = o || {}; const W = 380, H = 130, bg = mk(W, H), c = bg.getContext('2d');
  rect(c, 0, 0, W, 54, '#d9cfb8'); rect(c, 0, 0, W, 6, '#bdb39a'); rect(c, 0, 40, W, 14, '#2f6f5a'); rect(c, 0, 40, W, 2, '#4a8f78'); rect(c, 0, 53, W, 2, '#173a2f');
  rect(c, 0, 55, W, 75, '#47414f');
  rect(c, 0, 70, W, 28, '#5a5364'); for (let x = 0; x < W; x += 8) rect(c, x, 70, 1, 28, '#4d4757'); rect(c, 0, 69, W, 1, '#d8b84a'); rect(c, 0, 98, W, 1, '#d8b84a');
  for (let i = 0; i < 8; i++) { const x = 14 + i * 42; if (x < 340) P.busSeat(c, x, 66, 24); }
  for (let i = 0; i < 8; i++) { const x = 14 + i * 42; if (x < 340) P.busSeat(c, x, 124, 24); }
  rect(c, 0, 44, W, 2, '#bfb8a6');
  // front door + steps
  rect(c, 352, 56, 28, 56, '#9fd4ff'); rect(c, 352, 56, 3, 56, '#2a2a3a'); rect(c, 366, 56, 2, 56, '#2a2a3a'); rect(c, 352, 108, 28, 4, '#d8b84a');
  // driver's wheel + seat
  rect(c, 340, 74, 8, 4, '#15121f'); rect(c, 342, 78, 3, 8, '#15121f'); P.busSeat(c, 326, 100, 18);
  // ceiling lights
  [70, 170, 270].forEach(x => rect(c, x - 16, 1, 32, 3, '#fff6c8'));
  rect(c, 0, 8, W, 1, '#a89f86');
  const sc = baseScene(W, H, { bg, spawn: { x: 346, y: 88, dir: 'left' }, bounds: { x0: 14, y0: 74, x1: 366, y1: 98 }, name: 'bus', voidColor: '#05040f', ambient: 'rgba(255,200,140,.05)', outdoor: false });
  sc.A = { driver: { x: 334, y: 90 }, seatMine: { x: 150, y: 92 }, seatFriend: { x: 232, y: 112 }, window: { x: 92, y: 78 }, door: { x: 360, y: 90 }, bag: { x: 40, y: 92 }, empty: { x: 190, y: 74 } };
  sc.drawBG = (c2, t) => {
    for (let i = 0; i < 6; i++) {
      const x = 22 + i * 58, y = 12, w = 40, h = 24;
      c2.save(); c2.beginPath(); c2.rect(x, y, w, h); c2.clip();
      skyGrad(c2, x, y, w, h, G.tod);
      c2.fillStyle = '#6aa860'; c2.fillRect(x, y + 16, w, 8);
      for (let k = 0; k < 4; k++) { const px = x + (((k * 26 - t * 46) % 104) + 104) % 104 - 20; rect(c2, px, y + 6, 4, 14, '#3c7d47'); rect(c2, px - 2, y + 4, 8, 8, '#4f9a58'); }
      c2.restore();
      rect(c2, x - 2, y - 2, w + 4, 2, '#2a2a3a'); rect(c2, x - 2, y + h, w + 4, 2, '#2a2a3a'); rect(c2, x - 2, y - 2, 2, h + 4, '#2a2a3a'); rect(c2, x + w, y - 2, 2, h + 4, '#2a2a3a');
      rect(c2, x + w / 2 - 1, y, 2, h, '#2a2a3a');
    }
  };
  sc.lights.push({ x: 70, y: 4, r: 60, c: '255,240,200', a: .07 }, { x: 170, y: 4, r: 60, c: '255,240,200', a: .07 }, { x: 270, y: 4, r: 60, c: '255,240,200', a: .07 });
  sc.fx = { type: 'dust', count: 12, region: { x: 0, y: 8, w: W, h: 110 } };
  return sc;
};

/* ================================================================== ROOMS */
function nightWindow(c, x, y, w, h, t, rainy) {
  rect(c, x - 2, y - 2, w + 4, h + 4, '#d0c6b0'); rect(c, x, y, w, h, rainy ? '#202a50' : '#17205a');
  const r = rnd(9); for (let i = 0; i < 10; i++) rect(c, x + 2 + r() * (w - 4), y + 2 + r() * (h * .6), 1, 1, 'rgba(255,255,255,.8)');
  if (!rainy) { blob(c, x + w - 10, y + 10, 4, 4, '#f5efff'); glowDot(c, x + w - 10, y + 10, 22, '200,180,255', .35); }
  rect(c, x + w / 2 - 1, y, 2, h, '#d0c6b0'); rect(c, x, y + h / 2, w, 2, '#d0c6b0');
}

SCENES.room = function (o) {
  o = o || {}; const W = 240, H = 150, bg = mk(W, H), c = bg.getContext('2d');
  const rainy = !!o.rainy;
  rect(c, 0, 0, W, 72, '#2d2662'); rect(c, 0, 58, W, 14, '#251f52'); rect(c, 0, 70, W, 2, '#150f35');
  for (let i = 0; i < 30; i++) rect(c, 6 + (i * 37) % 228, 8 + (i * 13) % 44, 1, 3, '#3b3380');
  woodFloor(c, 0, 72, W, 78, '#6b4a3a', '#5a3d2f');
  nightWindow(c, 150, 12, 52, 38, 0, rainy);
  rect(c, 144, 8, 8, 46, '#8a4a7a'); rect(c, 200, 8, 8, 46, '#8a4a7a'); rect(c, 144, 8, 64, 4, '#6d3a62');
  // bed
  rect(c, 14, 62, 62, 48, '#3d2d58'); rect(c, 14, 62, 62, 8, '#2a1f45'); rect(c, 16, 70, 58, 36, '#7a6bd0'); rect(c, 16, 70, 58, 10, '#9a8be8'); rect(c, 20, 72, 16, 8, '#f1ecff'); rect(c, 16, 104, 58, 4, '#5a4bb0');
  // shelf
  P.shelf(c, 112, 70, 40);
  // desk + lamp + phone
  rect(c, 168, 64, 56, 6, '#8a6240'); rect(c, 168, 70, 56, 20, '#6b4a30'); rect(c, 170, 90, 4, 8, '#3d2d1e'); rect(c, 218, 90, 4, 8, '#3d2d1e');
  rect(c, 176, 60, 10, 4, '#15121f'); rect(c, 195, 58, 12, 3, '#fff'); rect(c, 207, 59, 2, 2, '#ffb2cc');
  rect(c, 184, 50, 2, 14, '#bfb8d0'); rect(c, 178, 46, 12, 5, '#ffd98a');
  // rug
  P.rug(c, 90, 106, 70, 28, '#8a3f6a');
  const sc = baseScene(W, H, { bg, spawn: { x: 120, y: 132, dir: 'up' }, bounds: { x0: 14, y0: 84, x1: 226, y1: 144 }, name: 'room', voidColor: '#05040f' });
  sc.dark = { r: 6, g: 5, b: 34, a: .52 };
  sc.lights.push({ x: 184, y: 52, r: 96, c: '255,214,140', a: .36, fl: .03 }, { x: 176, y: 36, r: 70, c: '170,160,255', a: .16 });
  sc.A = { phone: { x: 200, y: 86 }, window: { x: 176, y: 78 }, door: { x: 120, y: 142 }, bed: { x: 46, y: 104 }, shelf: { x: 112, y: 84 }, lamp: { x: 184, y: 84 } };
  sc.drawBG = (c2, t) => {
    if (rainy) { c2.fillStyle = 'rgba(190,210,255,.55)'; for (let i = 0; i < 12; i++) { const x = 152 + (i * 11) % 48, y = 14 + ((t * 40 + i * 17) % 34); c2.fillRect(x, y, 1, 3); } }
  };
  return sc;
};

SCENES.yahyaHome = function (o) {
  o = o || {}; const W = 300, H = 150, bg = mk(W, H), c = bg.getContext('2d');
  rect(c, 0, 0, W, 68, '#4a3b72'); rect(c, 0, 52, W, 16, '#3b2f5e'); rect(c, 0, 66, W, 2, '#241a42');
  woodFloor(c, 0, 68, W, 82, '#7a5438', '#664630');
  nightWindow(c, 120, 12, 56, 36, 0, false);
  rect(c, 112, 8, 8, 44, '#c47a5a'); rect(c, 176, 8, 8, 44, '#c47a5a'); rect(c, 112, 8, 72, 4, '#a2603f');
  P.shelf(c, 44, 68, 46); P.plant(c, 14, 70);
  rect(c, 210, 40, 60, 28, '#33281e'); P.tv(c, 240, 66);
  rect(c, 224, 66, 32, 5, '#4a3626');
  P.rug(c, 70, 100, 120, 40, '#a24a6a'); P.sofa(c, 110, 96, 64);
  const sc = baseScene(W, H, { bg, spawn: { x: 30, y: 136, dir: 'right' }, bounds: { x0: 16, y0: 98, x1: 286, y1: 144 }, name: 'yahyaHome', voidColor: '#05040f' });
  sc.dark = { r: 8, g: 6, b: 32, a: .34 };
  sc.lights.push({ x: 110, y: 70, r: 110, c: '255,214,140', a: .3 }, { x: 240, y: 52, r: 70, c: '160,190,255', a: .2 }, { x: 40, y: 50, r: 60, c: '255,214,140', a: .2 });
  sc.A = { parents: { x: 120, y: 112 }, exit: { x: 20, y: 140 }, tv: { x: 240, y: 84 }, shelf: { x: 44, y: 84 }, sofa: { x: 110, y: 96 } };
  sc.props.push(propOf(122, c2 => P.table(c2, 150, 126, 34)));
  sc.solids.push({ x: 134, y: 118, w: 34, h: 6 });
  return sc;
};

SCENES.momnaHome = function (o) {
  o = o || {}; const calm = !!o.calm; const W = 260, H = 140, bg = mk(W, H), c = bg.getContext('2d');
  rect(c, 0, 0, W, 62, '#3a3a58'); rect(c, 0, 48, W, 14, '#2f2f4a'); rect(c, 0, 60, W, 2, '#1a1a30');
  woodFloor(c, 0, 62, W, 78, '#5c4a40', '#4a3a32');
  nightWindow(c, 100, 10, 52, 34, 0, !calm);
  rect(c, 94, 6, 8, 42, '#6a5a78'); rect(c, 150, 6, 8, 42, '#6a5a78');
  P.shelf(c, 210, 62, 40); P.plant(c, 20, 64); P.rug(c, 60, 92, 130, 36, '#5a4a7a'); P.sofa(c, 130, 90, 60);
  rect(c, 14, 30, 22, 24, '#d9d2c2'); rect(c, 16, 32, 18, 20, '#7a6a98');
  const sc = baseScene(W, H, { bg, spawn: { x: 130, y: 120, dir: 'up' }, bounds: { x0: 16, y0: 94, x1: 244, y1: 134 }, name: 'momnaHome', voidColor: '#05040f' });
  sc.dark = calm ? { r: 8, g: 6, b: 34, a: .34 } : { r: 6, g: 6, b: 28, a: .58 };
  if (calm) sc.lights.push({ x: 130, y: 64, r: 120, c: '255,212,150', a: .34, fl: .03 }, { x: 126, y: 30, r: 70, c: '200,190,255', a: .16 });
  else sc.lights.push({ x: 130, y: 60, r: 100, c: '255,200,150', a: .2, fl: .05 }, { x: 126, y: 30, r: 70, c: '150,170,255', a: .12 });
  sc.A = { sofa: { x: 124, y: 88 }, brother: { x: 164, y: 112 }, mother: { x: 60, y: 108 } };
  if (!calm) sc.drawBG = (c2, t) => { c2.fillStyle = 'rgba(190,210,255,.55)'; for (let i = 0; i < 10; i++) { const x = 102 + (i * 11) % 48, y = 12 + ((t * 44 + i * 19) % 30); c2.fillRect(x, y, 1, 3); } };
  return sc;
};
