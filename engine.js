/* ==========================================================================
   engine.js — core systems
   canvas + loop, input (touch/keyboard), audio (files + fallback synth),
   dialogue, cinematic text, fades, camera, scenes, particles, lighting.
   ========================================================================== */
'use strict';

/* ------------------------------------------------------------------ helpers */
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeIO = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const rand = (a, b) => a + Math.random() * (b - a);
const wait = ms => new Promise(r => setTimeout(r, ms));
const N = CONFIG.names;

const NAME_OF = {
  yahya: N.yahya, momna: N.momna, momnaFriend: N.momnaFriend, friend1: N.friend1, friend2: N.friend2,
  otherGirl: N.otherGirl, otherBoy: N.otherBoy, classBoy: N.classBoy, brother: N.brother,
  mother1: N.mother1, mother2: N.mother2, father: N.father, driver: N.driver, uncle: N.uncle
};

/* -------------------------------------------------------------------- state */
const G = {
  mode: 'title',            // 'title' | 'play'
  scene: null, sceneId: null,
  t: 0, tod: .3,            // tod: 0 dawn .. .5 noon .. .85 golden .. 1 night
  player: { key: 'yahya', x: 0, y: 0, dir: 'down', moving: false, frame: 0, animT: 0, visible: true, speed: 58, scale: 1 },
  cam: { x: 0, y: 0, z: 1 }, camLock: false, camTween: null,
  free: false, interacting: false, near: null, overlayOpen: false,
  movers: [], waiters: [], particles: [], rainDrops: [], rain: 0, extraLights: [],
  flash: 0, shake: 0, dark: 0, darkTarget: 0, mood: 'normal', muted: false,
  view: { cx: 0, cy: 0, z: 1, ox: 0, oy: 0 },
  flags: {}, chapter: 0
};

/* ------------------------------------------------------------------- canvas */
const cv = $('game'), ctx = cv.getContext('2d');
const lightCv = document.createElement('canvas'), lctx = lightCv.getContext('2d');
let VW = 320, VH = 180, PS = 3;

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  PS = Math.max(2, Math.round(Math.min(w, h) / 190));
  VW = Math.ceil(w / PS); VH = Math.ceil(h / PS);
  cv.width = lightCv.width = VW; cv.height = lightCv.height = VH;
  cv.style.width = (VW * PS) + 'px'; cv.style.height = (VH * PS) + 'px';
  ctx.imageSmoothingEnabled = false;
  G.rainDrops.length = 0;
  if (G.scene && !G.camLock) clampCam();
}

/* --------------------------------------------------------------------- save */
const Save = {
  get() { try { return parseInt(localStorage.getItem('glwf_progress') || '0', 10) || 0; } catch (e) { return 0; } },
  set(n) { try { if (n > Save.get()) localStorage.setItem('glwf_progress', String(n)); } catch (e) { } },
  getMute() { try { return localStorage.getItem('glwf_mute') === '1'; } catch (e) { return false; } },
  setMute(m) { try { localStorage.setItem('glwf_mute', m ? '1' : '0'); } catch (e) { } }
};

/* ------------------------------------------------------------------- images */
const IMG = {}, PORT = {};
function loadImages() {
  for (const k in CONFIG.images) {
    const im = new Image(); im._ok = null;
    im.onload = () => { im._ok = true; }; im.onerror = () => { im._ok = false; };
    im.src = CONFIG.images[k]; IMG[k] = im;
  }
  // optional character portraits: assets/characters/<key>.png
  ['yahya', 'momna', 'momnaFriend', 'friend1', 'friend2', 'brother', 'mother1', 'mother2', 'father'].forEach(k => {
    const im = new Image(); im._ok = null;
    im.onload = () => { im._ok = true; }; im.onerror = () => { im._ok = false; };
    im.src = 'assets/characters/' + k + '.png'; PORT[k] = im;
  });
}
const hasImg = k => !!(IMG[k] && IMG[k]._ok === true);

/* -------------------------------------------------------------------- SFX */
const SFX = (() => {
  let ac = null, master = null, musicBus = null, muted = false, lastBlip = 0;
  function init() {
    if (ac) return ac;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ac = new AC();
      master = ac.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ac.destination);
      musicBus = ac.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    } catch (e) { ac = null; }
    return ac;
  }
  function unlock() { const a = init(); if (a && a.state === 'suspended') a.resume(); }
  function tone(f = 440, dur = .1, type = 'sine', vol = .05, slide = 0, delay = 0) {
    if (!ac || muted) return;
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
  }
  function noise(dur = .2, vol = .05, freq = 1200, delay = 0) {
    if (!ac || muted) return;
    const len = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ac.createBufferSource(); s.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = .7;
    const g = ac.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(master); s.start(ac.currentTime + delay);
  }
  return {
    unlock, ctx: () => ac, music: () => musicBus,
    setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 1; },
    setMusicLevel(v) { if (musicBus && ac) musicBus.gain.setTargetAtTime(v, ac.currentTime, .4); },
    blip() { const n = performance.now(); if (n - lastBlip < 38) return; lastBlip = n; tone(rand(330, 470), .05, 'square', .012); },
    click() { tone(620, .06, 'triangle', .04, 120); },
    chime() { [660, 880, 1320].forEach((f, i) => tone(f, .9, 'sine', .05, 0, i * .14)); },
    sparkle() { [1320, 1760, 2093, 2637].forEach((f, i) => tone(f, .5, 'sine', .03, 0, i * .08)); },
    whoosh() { noise(.7, .05, 700); },
    flip() { noise(.14, .08, 2400); },
    thunder() { noise(2.2, .22, 140, .15); },
    heart() { tone(70, .18, 'sine', .22); tone(60, .2, 'sine', .18, 0, .22); },
    buzz() { tone(180, .12, 'square', .03); tone(180, .12, 'square', .03, 0, .18); },
    error() { tone(200, .25, 'sawtooth', .03, -60); }
  };
})();

/* ------------------------------------------------- fallback ambient synth */
const Synth = (() => {
  const midi = m => 440 * Math.pow(2, (m - 69) / 12);
  const SETS = {
    day:       { root: 57, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [7, 11, 14, 17], [5, 9, 12, 16]], scale: [0, 2, 4, 7, 9], bpm: 44, wave: 'triangle', bright: 1800 },
    emotional: { root: 50, prog: [[0, 3, 7, 10], [8, 12, 15, 19], [3, 7, 10, 14], [10, 14, 17, 21]], scale: [0, 3, 5, 7, 10], bpm: 38, wave: 'sine', bright: 1100 },
    mystery:   { root: 49, prog: [[0, 1, 7], [0, 3, 6, 9], [-2, 1, 5], [0, 1, 7]], scale: [0, 1, 5, 7, 8], bpm: 34, wave: 'sine', bright: 900 },
    hopeful:   { root: 53, prog: [[0, 4, 7, 12], [7, 11, 14, 19], [9, 12, 16, 19], [5, 9, 12, 16]], scale: [0, 2, 4, 7, 9], bpm: 48, wave: 'triangle', bright: 2200 },
    final:     { root: 60, prog: [[0, 4, 7, 11, 14], [7, 11, 14, 17], [9, 12, 16, 19], [4, 7, 11, 14], [5, 9, 12, 16], [7, 11, 14, 19]], scale: [0, 2, 4, 7, 9, 11], bpm: 40, wave: 'sine', bright: 2600 }
  };
  let cur = null;
  function pad(inst, m, t, dur) {
    const a = SFX.ctx(), o = a.createOscillator(), g = a.createGain();
    o.type = inst.S.wave; o.frequency.value = midi(m); o.detune.value = (Math.random() - .5) * 10;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.045, t + dur * .35); g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.6);
    o.connect(g); g.connect(inst.filt); o.start(t); o.stop(t + dur + 1.8);
  }
  function pluck(inst, m, t) {
    const a = SFX.ctx(), o = a.createOscillator(), g = a.createGain();
    o.type = 'triangle'; o.frequency.value = midi(m);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.05, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + 2.2);
    o.connect(g); g.connect(inst.filt); g.connect(inst.dl); o.start(t); o.stop(t + 2.4);
  }
  function stop() {
    if (!cur) return;
    const inst = cur; cur = null; inst.alive = false; inst.timers.forEach(clearTimeout);
    const a = SFX.ctx();
    if (a) { inst.g.gain.cancelScheduledValues(a.currentTime); inst.g.gain.setTargetAtTime(0, a.currentTime, .5); }
    setTimeout(() => { try { inst.g.disconnect(); } catch (e) { } }, 3500);
  }
  function start(st) {
    stop();
    const a = SFX.ctx(); if (!a || !SFX.music()) return;
    const S = SETS[st] || SETS.day;
    const g = a.createGain(); g.gain.value = 0; g.connect(SFX.music());
    g.gain.setTargetAtTime(1, a.currentTime, 1.2);
    const filt = a.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = S.bright; filt.connect(g);
    const dl = a.createDelay(1.5); dl.delayTime.value = .42;
    const fb = a.createGain(); fb.gain.value = .36; dl.connect(fb); fb.connect(dl); dl.connect(filt);
    const inst = { g, filt, dl, S, timers: [], alive: true }; cur = inst;
    let i = 0; const chordDur = 60 / S.bpm * 4;
    const play = () => {
      if (!inst.alive) return;
      const ch = S.prog[i % S.prog.length]; i++;
      const t = a.currentTime + .05;
      ch.forEach((n, k) => pad(inst, S.root + n - (k === 0 ? 12 : 0), t, chordDur));
      const np = 3 + Math.floor(Math.random() * 3);
      for (let p = 0; p < np; p++) {
        const when = t + (p + Math.random() * .6) * chordDur / np;
        const note = S.root + 12 + S.scale[Math.floor(Math.random() * S.scale.length)] + (Math.random() < .4 ? 12 : 0);
        pluck(inst, note, when);
      }
      inst.timers.push(setTimeout(play, chordDur * 1000 - 250));
    };
    play();
  }
  return { start, stop };
})();

/* ------------------------------------------------------------------ Music */
const Music = (() => {
  let cur = null, curEl = null, duckV = 1, duckT = 1, muted = false, t0 = 0, synthState = null;
  const els = {};
  const vol = () => CONFIG.music.volume;
  function el(state) {
    if (els[state] !== undefined) return els[state];
    const src = CONFIG.music.tracks[state];
    if (!src) { els[state] = null; return null; }
    const a = new Audio(); a.loop = true; a.preload = 'auto'; a._ok = null; a.volume = 0;
    a.addEventListener('canplay', () => { a._ok = true; }, { once: true });
    a.addEventListener('error', () => { a._ok = false; }, { once: true });
    a.src = src; els[state] = a; return a;
  }
  function startSynth(state) {
    if (!CONFIG.music.fallbackSynth || synthState === state) return;
    synthState = state; Synth.start(state);
  }
  function stopSynth() { synthState = null; Synth.stop(); }
  return {
    play(state) {
      if (state === cur) return;
      if (curEl) curEl._offAt = performance.now();
      cur = state; t0 = performance.now(); curEl = null;
      const e = el(state);
      if (e && e._ok !== false) {
        curEl = e; e._offAt = 0;
        try { const p = e.play(); if (p && p.catch) p.catch(() => { }); } catch (_) { }
      }
      if (synthState && synthState !== state) stopSynth();
    },
    stop() { cur = null; if (curEl) curEl._offAt = performance.now(); curEl = null; stopSynth(); },
    /* iOS only lets an <audio> start from a tap: touch every track once, silently, on the first tap */
    prime() {
      for (const k in CONFIG.music.tracks) {
        const e = el(k); if (!e) continue;
        try { e.muted = true; const p = e.play(); if (p && p.then) p.then(() => { e.pause(); e.currentTime = 0; e.muted = muted; }).catch(() => { e.muted = muted; }); else { e.pause(); e.muted = muted; } } catch (_) { }
      }
    },
    duck(v) { duckT = v; },
    setMuted(m) { muted = m; G.muted = m; SFX.setMuted(m); Save.setMute(m); $('btn-mute').classList.toggle('off', m); for (const k in els) if (els[k]) els[k].muted = m; },
    isMuted: () => muted,
    update(dt) {
      duckV += (duckT - duckV) * (1 - Math.exp(-dt * 2.5));
      for (const k in els) {
        const e = els[k]; if (!e) continue;
        const on = (e === curEl && e._ok === true);
        const target = on ? vol() * duckV : 0;
        try { e.volume = clamp(e.volume + clamp(target - e.volume, -dt * .5, dt * .5), 0, 1); } catch (_) { }
        if (!on && e !== curEl && !e.paused && (e.volume < .01 || performance.now() - (e._offAt || 0) > 2500)) e.pause();
      }
      if (cur) {
        const e = els[cur], fileOK = e && e._ok === true;
        if (fileOK) { if (synthState) stopSynth(); }
        else if (!e || e._ok === false || performance.now() - t0 > 1600) startSynth(cur);
      }
      SFX.setMusicLevel(muted ? 0 : vol() * duckV * 1.1);
    }
  };
})();

/* ------------------------------------------------------------------- Input */
const Input = { keys: {}, joy: { x: 0, y: 0 } };
function inputVec() {
  const k = Input.keys; let x = 0, y = 0;
  if (k.arrowleft || k.a) x -= 1; if (k.arrowright || k.d) x += 1;
  if (k.arrowup || k.w) y -= 1; if (k.arrowdown || k.s) y += 1;
  x += Input.joy.x; y += Input.joy.y;
  const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
  return { x, y };
}
function initInput() {
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.body.classList.add('touch');
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (e.repeat) { Input.keys[k] = true; return; }
    Input.keys[k] = true;
    if (k === ' ' || k === 'enter' || k === 'e') { if (document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur(); doAction(); }
    if (k === 'm') Music.setMuted(!Music.isMuted());
  });
  window.addEventListener('keyup', e => { Input.keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', () => { Input.keys = {}; Input.joy.x = Input.joy.y = 0; });
  const joy = $('joy'), knob = $('joy-knob'); let id = null, cx = 0, cy = 0; const R = 44;
  const set = e => {
    const dx = e.clientX - cx, dy = e.clientY - cy, m = Math.hypot(dx, dy) || 1, k = Math.min(1, m / R);
    const nx = dx / m * k, ny = dy / m * k;
    Input.joy.x = Math.abs(nx) < .14 ? 0 : nx; Input.joy.y = Math.abs(ny) < .14 ? 0 : ny;
    knob.style.transform = `translate(${nx * R}px,${ny * R}px)`;
  };
  joy.addEventListener('pointerdown', e => { e.preventDefault(); id = e.pointerId; try { joy.setPointerCapture(id); } catch (_) { } const r = joy.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; set(e); });
  joy.addEventListener('pointermove', e => { if (e.pointerId === id) set(e); });
  const end = e => { if (e.pointerId === id) { id = null; Input.joy.x = 0; Input.joy.y = 0; knob.style.transform = ''; } };
  joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
  $('btn-act').addEventListener('pointerdown', e => { e.preventDefault(); doAction(); });
  $('dialogue').addEventListener('pointerdown', e => { e.preventDefault(); Dlg.advance(); });
  $('cine').addEventListener('pointerdown', () => { if (Cine.cancel) Cine.cancel(); });
  $('chapter-card').addEventListener('pointerdown', () => { if (Cine.cancel) Cine.cancel(); });
  $('btn-mute').addEventListener('click', () => { SFX.unlock(); Music.setMuted(!Music.isMuted()); });
}

function doAction() {
  if (Dlg.active) { Dlg.advance(); return; }
  if (Cine.cancel) { Cine.cancel(); return; }
  if (G.mode === 'play' && G.free && !G.interacting && !Dlg.choiceOpen && !G.overlayOpen && G.near && G.near.use) {
    SFX.click(); runInteraction(G.near.use);
  }
}
async function runInteraction(fn) {
  if (G.interacting) return;
  G.interacting = true; G.near = null;
  try { await fn(); } catch (e) { console.error(e); }
  G.interacting = false;
}

/* ----------------------------------------------------------------- Dialogue */
const Cine = { cancel: null };
const Dlg = {
  active: false, typing: false, text: '', idx: 0, acc: 0, res: null, choiceOpen: false, pendingHide: false, speed: 46, thought: false,
  update(dt) {
    const app = $('app');
    app.classList.toggle('dlg', this.active || this.choiceOpen);
    if (this.active && this.typing) {
      this.acc += dt * this.speed;
      const n = Math.floor(this.acc);
      if (n > 0) {
        this.acc -= n; this.idx = Math.min(this.text.length, this.idx + n);
        $('dlg-text').textContent = this.text.slice(0, this.idx);
        if (!this.thought) SFX.blip();
        if (this.idx >= this.text.length) this.typing = false;
      }
    }
    $('dlg-next').style.visibility = (this.active && !this.typing) ? 'visible' : 'hidden';
    if (this.pendingHide && !this.active && !this.choiceOpen) { $('dialogue').classList.add('hidden'); this.pendingHide = false; }
  },
  advance() {
    if (!this.active) return;
    if (this.typing) { this.idx = this.text.length; $('dlg-text').textContent = this.text; this.typing = false; return; }
    this.active = false; this.pendingHide = true;
    const r = this.res; this.res = null; SFX.click(); if (r) r();
  }
};

function styleDialogue(who, thought, mood) {
  const box = $('dialogue'); box.classList.remove('hidden');
  box.classList.toggle('thought', !!thought);
  const hasLook = who && typeof LOOKS !== 'undefined' && LOOKS[who];
  box.classList.toggle('nop', !hasLook);
  if (hasLook) {
    const pc = $('dlg-portrait'), p = PORT[who];
    if (p && p._ok === true) { const c = pc.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, 40, 40); c.drawImage(p, 0, 0, 40, 40); }
    else drawPortrait(pc, who, mood);
  }
  $('dlg-name').textContent = who ? (NAME_OF[who] || '') : '';
}

function say(who, text, opts = {}) {
  if (typeof who === 'string' && who.endsWith('*')) { who = who.slice(0, -1); opts = Object.assign({ thought: true }, opts); }
  return new Promise(res => {
    Dlg.active = true; Dlg.res = res; Dlg.text = text; Dlg.idx = 0; Dlg.acc = 0; Dlg.typing = true;
    Dlg.pendingHide = false; Dlg.thought = !!opts.thought;
    styleDialogue(who, opts.thought, opts.mood);
    if (opts.name) $('dlg-name').textContent = opts.name;
    $('dlg-text').textContent = '';
  });
}
const thought = t => say('yahya', t, { thought: true });
const narr = t => say(null, t, { thought: true });
async function sayAll(lines) { for (const l of lines) await say(l[0], l[1], l[2] || {}); }

function choose(prompt, options, opts = {}) {
  return new Promise(res => {
    styleDialogue(opts.who || null, true, opts.mood);
    $('dlg-text').textContent = prompt || ''; $('dlg-next').style.visibility = 'hidden';
    const wrap = $('choices'); wrap.innerHTML = ''; wrap.classList.remove('hidden');
    Dlg.choiceOpen = true;
    options.forEach((o, i) => {
      const b = document.createElement('button'); b.className = 'choice-btn'; b.textContent = o;
      b.onclick = () => { SFX.click(); wrap.classList.add('hidden'); wrap.innerHTML = ''; Dlg.choiceOpen = false; Dlg.pendingHide = true; res(i); };
      wrap.appendChild(b);
    });
  });
}

/* --------------------------------------------------- cinematic text & fades */
function holdWait(ms) {
  return new Promise(r => {
    const t = setTimeout(() => { Cine.cancel = null; r(); }, ms);
    Cine.cancel = () => { clearTimeout(t); Cine.cancel = null; r(); };
  });
}
async function cine(lines, o = {}) {
  lines = [].concat(lines);
  const el = $('cine'), tx = $('cine-text');
  el.classList.remove('dim', 'low');
  if (o.pos === 'low') el.classList.add('low'); else if (o.dim !== false) el.classList.add('dim');
  el.classList.add('on');
  tx.className = o.cls || '';
  await wait(500);
  for (const ln of lines) {
    if (ln === '') { await wait(o.pause || 900); continue; }
    tx.textContent = ln; tx.classList.remove('out'); void tx.offsetWidth; tx.classList.add('in');
    await wait(900);
    await holdWait(o.hold || (1500 + ln.length * 48));
    tx.classList.remove('in'); tx.classList.add('out');
    await wait(750);
  }
  el.classList.remove('on'); await wait(700);
  tx.className = '';
}
async function chapterCard(num, name, line) {
  $('cc-num').textContent = num; $('cc-name').textContent = name; $('cc-line').textContent = line || '';
  $('chapter-card').classList.add('on'); SFX.chime();
  await wait(1300); await holdWait(2300);
  $('chapter-card').classList.remove('on'); await wait(900);
}
function fade(to, ms = 700, color) {
  const f = $('fade'); if (color) f.style.background = color; else f.style.background = '#05040f';
  f.style.transition = `opacity ${ms}ms ease`; f.style.opacity = String(to); return wait(ms);
}
function bars(on) { $('app').classList.toggle('cinema', !!on); return wait(900); }
let toastT = null;
function toast(text, ms = 2200) {
  const t = $('toast'); t.textContent = text; t.classList.add('on'); clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('on'), ms);
}
function setObjective(text) {
  const o = $('hud-objective');
  if (!text) { o.classList.add('off'); return; }
  o.classList.remove('off'); o.querySelector('span').textContent = text;
}
function setChapterTag(text) { $('hud-chapter').textContent = text || ''; }
function showHUD(on) { $('hud').classList.toggle('hidden', !on); $('controls').classList.toggle('hidden', !on); }
function setMood(m) {
  G.mood = m;
  cv.className = (m && m !== 'normal') ? 'mood-' + m : '';
}
function setDarkness(v) { G.darkTarget = v; }
function shake(v = 1) { G.shake = Math.max(G.shake, v); }
function lightning() { G.flash = 1; SFX.thunder(); shake(.6); }
function playMode(on) { G.free = !!on; if (!on) { G.near = null; $('btn-act').classList.add('hidden'); } }

/* ---------------------------------------------------------------- the world */
function addNpc(key, x, y, o = {}) {
  const n = Object.assign({ key, x, y, dir: 'down', frame: 0, animT: 0, moving: false, visible: true, scale: 1, use: null, r: 30 }, o);
  G.scene.npcs.push(n); return n;
}
function removeNpc(n) { const i = G.scene.npcs.indexOf(n); if (i >= 0) G.scene.npcs.splice(i, 1); }
function addInteract(o) { const it = Object.assign({ kind: 'inspect', r: 26 }, o); G.scene.interacts.push(it); return it; }
function removeInteract(it) { const i = G.scene.interacts.indexOf(it); if (i >= 0) G.scene.interacts.splice(i, 1); }
function clearInteracts() { G.scene.interacts.length = 0; G.scene.triggers.length = 0; }
function addTrigger(o) { const t = Object.assign({ once: true }, o); G.scene.triggers.push(t); return t; }
function addLight(o) { G.extraLights.push(o); return o; }
function emote(ent, text, sec = 1.5) { ent.emote = { text, t: sec }; }

function setDir(e, dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) e.dir = dx > 0 ? 'right' : 'left'; else e.dir = dy > 0 ? 'down' : 'up';
}
function moveTo(ent, x, y, speed = 46) {
  return new Promise(res => { G.movers.push({ ent, x, y, speed, res }); });
}
function placePlayer(x, y, dir) { const P = G.player; P.x = x; P.y = y; if (dir) P.dir = dir; P.moving = false; }
function waitFor(fn) {
  return new Promise(res => { if (!G.interacting && fn()) return res(); G.waiters.push({ fn, res }); });
}

function clampCam() {
  const sc = G.scene; if (!sc) return;
  const z = G.cam.z, hw = VW / 2 / z, hh = VH / 2 / z;
  G.cam.x = sc.w <= hw * 2 ? sc.w / 2 : clamp(G.cam.x, hw, sc.w - hw);
  G.cam.y = sc.h <= hh * 2 ? sc.h / 2 : clamp(G.cam.y, hh, sc.h - hh);
}
function snapCam() { G.cam.x = G.player.x; G.cam.y = G.player.y - 8; clampCam(); }
function camTo(x, y, z, ms = 1400) {
  return new Promise(res => {
    G.camLock = true;
    G.camTween = { x0: G.cam.x, y0: G.cam.y, z0: G.cam.z, x1: x, y1: y, z1: z, t: 0, ms: Math.max(1, ms), res };
  });
}
function camFollow() { G.camLock = false; G.camTween = null; }

async function gotoScene(id, o = {}) {
  if (o.fade !== false) await fade(1, o.fadeOut || 600);
  const build = SCENES[id]; if (!build) throw new Error('No scene ' + id);
  const sc = build(o); sc.id = id;
  ['interacts', 'npcs', 'props', 'solids', 'triggers', 'lights'].forEach(k => { sc[k] = sc[k] || []; });
  G.scene = sc; G.sceneId = id; G.movers.length = 0; G.extraLights.length = 0;   // (waiters survive scene changes: a chapter may wait across several rooms)
  const P = G.player; P.visible = !o.hidePlayer;
  const sp = o.spawn || sc.spawn || { x: sc.w / 2, y: sc.h - 30, dir: 'up' };
  P.x = sp.x; P.y = sp.y; P.dir = sp.dir || 'up'; P.moving = false;
  if (o.tod !== undefined) G.tod = o.tod; else if (sc.tod !== undefined) G.tod = sc.tod;
  G.rain = o.rain !== undefined ? o.rain : (sc.rain || 0);
  setMood(o.mood || sc.mood || 'normal');
  initFx(sc);
  G.camLock = false; G.camTween = null; G.cam.z = o.zoom || baseZoom(sc); snapCam();
  if (o.music) Music.play(o.music);
  G.mode = 'play'; G.near = null;
  if (o.fade !== false) { await wait(150); await fade(0, o.fadeIn || 800); }
}

/* -------------------------------------------------------------------- FX */
function initFx(sc) {
  G.particles.length = 0;
  const fx = sc.fx; if (!fx) return;
  const reg = fx.region || { x: 0, y: 0, w: sc.w, h: sc.h };
  for (let i = 0; i < (fx.count || 20); i++) {
    G.particles.push({
      type: fx.type, x: reg.x + rand(0, reg.w), y: reg.y + rand(0, reg.h), ph: rand(0, 6.28),
      vx: fx.type === 'firefly' ? rand(-7, 7) : fx.type === 'petal' ? rand(6, 16) : fx.type === 'leaf' ? rand(5, 14) : rand(2, 6),
      vy: fx.type === 'firefly' ? rand(-7, 7) : fx.type === 'petal' ? rand(8, 18) : fx.type === 'leaf' ? rand(9, 20) : rand(-3, 3),
      s: rand(.6, 1.4), reg
    });
  }
}
function updateFx(dt) {
  const t = G.t;
  for (const p of G.particles) {
    if (p.type === 'firefly') {
      p.vx += rand(-14, 14) * dt; p.vy += rand(-14, 14) * dt; p.vx = clamp(p.vx, -9, 9); p.vy = clamp(p.vy, -9, 9);
    } else if (p.type === 'petal' || p.type === 'leaf') { p.vx += Math.sin(t * 1.3 + p.ph) * 6 * dt; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    const r = p.reg;
    if (p.x < r.x - 4) p.x = r.x + r.w + 4; if (p.x > r.x + r.w + 4) p.x = r.x - 4;
    if (p.y < r.y - 4) p.y = r.y + r.h + 4; if (p.y > r.y + r.h + 4) p.y = r.y - 4;
  }
  // rain (screen space)
  if (G.rain > 0) {
    const want = Math.floor(VW * VH / 520 * G.rain);
    while (G.rainDrops.length < want) G.rainDrops.push({ x: rand(-10, VW + 10), y: rand(0, VH), v: rand(150, 230), l: rand(3, 6) });
    if (G.rainDrops.length > want) G.rainDrops.length = want;
    for (const d of G.rainDrops) { d.y += d.v * dt; d.x -= 24 * dt; if (d.y > VH + 6) { d.y = -6; d.x = rand(-10, VW + 24); } }
  }
}
function drawParticles(c) {
  const t = G.t;
  for (const p of G.particles) {
    if (p.type === 'firefly') {
      const a = .35 + .65 * Math.max(0, Math.sin(t * 2.2 + p.ph));
      c.fillStyle = `rgba(255,240,150,${a * .3})`; c.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3);
      c.fillStyle = `rgba(255,250,200,${a})`; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    } else if (p.type === 'dust') {
      c.fillStyle = `rgba(255,245,210,${.25 + .2 * Math.sin(t + p.ph)})`; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    } else if (p.type === 'petal') {
      c.fillStyle = 'rgba(255,190,215,.85)'; c.fillRect(Math.round(p.x), Math.round(p.y), 2, 1);
    } else if (p.type === 'leaf') {
      c.fillStyle = 'rgba(214,150,80,.85)'; c.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }
  }
}
function drawRain(c) {
  c.strokeStyle = 'rgba(190,210,255,.5)'; c.lineWidth = 1; c.beginPath();
  for (const d of G.rainDrops) { c.moveTo(Math.round(d.x), Math.round(d.y)); c.lineTo(Math.round(d.x - 1.5), Math.round(d.y + d.l)); }
  c.stroke();
}

function allLights(sc) { return sc.lights.concat(G.extraLights); }
function drawLighting(c, sc) {
  const v = G.view, z = v.z, D = sc.dark;
  lctx.globalCompositeOperation = 'source-over'; lctx.clearRect(0, 0, VW, VH);
  lctx.fillStyle = `rgba(${D.r},${D.g},${D.b},${D.a})`; lctx.fillRect(0, 0, VW, VH);
  lctx.globalCompositeOperation = 'destination-out';
  const L = allLights(sc);
  for (const l of L) {
    const sx = (l.x - v.cx) * z + v.ox, sy = (l.y - v.cy) * z + v.oy;
    const r = l.r * z * (1 + (l.fl ? Math.sin(G.t * 9 + l.x) * l.fl : 0));
    if (sx < -r || sx > VW + r || sy < -r || sy > VH + r) continue;
    const g = lctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    g.addColorStop(0, 'rgba(0,0,0,.95)'); g.addColorStop(.55, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.fillStyle = g; lctx.fillRect(sx - r, sy - r, r * 2, r * 2);
  }
  c.drawImage(lightCv, 0, 0);
}
function drawGlows(c, sc) {
  const v = G.view, z = v.z; c.globalCompositeOperation = 'screen';   // 'screen' keeps pale sprites from blowing out to pure white
  for (const l of allLights(sc)) {
    const sx = (l.x - v.cx) * z + v.ox, sy = (l.y - v.cy) * z + v.oy;
    const r = l.r * z * .8 * (1 + (l.fl ? Math.sin(G.t * 9 + l.x) * l.fl : 0));
    if (sx < -r || sx > VW + r || sy < -r || sy > VH + r) continue;
    const g = c.createRadialGradient(sx, sy, 0, sx, sy, r);
    g.addColorStop(0, `rgba(${l.c || '255,220,150'},${l.a == null ? .35 : l.a})`); g.addColorStop(1, `rgba(${l.c || '255,220,150'},0)`);
    c.fillStyle = g; c.fillRect(sx - r, sy - r, r * 2, r * 2);
  }
  c.globalCompositeOperation = 'source-over';
}

/* ---------------------------------------------------------------- update */
function interactables(sc) {
  const out = sc.interacts.slice();
  for (const n of sc.npcs) if (n.use && n.visible !== false) out.push({ x: n.x, y: n.y - 6, r: n.r, kind: 'talk', use: n.use, enabled: n.enabled, _npc: n });
  return out;
}
function boxFree(sc, x, y) {
  const b = sc.bounds || { x0: 6, y0: 6, x1: sc.w - 6, y1: sc.h - 2 };
  if (x < b.x0 || x > b.x1 || y < b.y0 || y > b.y1) return false;
  const bx = x - 4, by = y - 3, bw = 8, bh = 4;
  for (const s of sc.solids) {
    if (s.off) continue;
    if (bx < s.x + s.w && bx + bw > s.x && by < s.y + s.h && by + bh > s.y) return false;
  }
  for (const n of sc.npcs) {
    if (n.visible === false || n.ghost) continue;
    if (Math.abs(x - n.x) < 7 && Math.abs(y - n.y) < 4) return false;
  }
  return true;
}
function animEnt(e, dt) {
  if (e.moving) { e.animT = (e.animT || 0) + dt; e.frame = Math.floor(e.animT / .16) % 4; } else { e.frame = 0; e.animT = 0; }
  if (e.emote) { e.emote.t -= dt; if (e.emote.t <= 0) e.emote = null; }
}

function update(dt) {
  G.t += dt;
  Music.update(dt); Dlg.update(dt);
  G.flash = Math.max(0, G.flash - dt * 2.4); G.shake = Math.max(0, G.shake - dt * 2.2);
  G.dark += (G.darkTarget - G.dark) * (1 - Math.exp(-dt * 2));
  if (G.mode !== 'play' || !G.scene) return;
  const sc = G.scene, P = G.player;

  P.moving = false; for (const n of sc.npcs) n.moving = false;
  // scripted movement
  for (let i = G.movers.length - 1; i >= 0; i--) {
    const m = G.movers[i], e = m.ent, dx = m.x - e.x, dy = m.y - e.y, d = Math.hypot(dx, dy), st = m.speed * dt;
    if (d <= st) { e.x = m.x; e.y = m.y; G.movers.splice(i, 1); m.res(); }
    else { e.x += dx / d * st; e.y += dy / d * st; e.moving = true; setDir(e, dx, dy); }
  }
  // player control
  const canMove = G.free && !G.interacting && !Dlg.active && !Dlg.choiceOpen && !G.overlayOpen;
  if (canMove) {
    const v = inputVec();
    if (v.x || v.y) {
      const sp = P.speed * (P.slow || 1), nx = P.x + v.x * sp * dt, ny = P.y + v.y * sp * dt;
      if (boxFree(sc, nx, P.y)) P.x = nx;
      if (boxFree(sc, P.x, ny)) P.y = ny;
      setDir(P, v.x, v.y); P.moving = true;
    }
  }
  animEnt(P, dt); for (const n of sc.npcs) animEnt(n, dt);

  // interactions + triggers
  G.near = null;
  if (canMove) {
    let best = null, bd = 1e9;
    for (const it of interactables(sc)) {
      if (it.enabled && !it.enabled()) continue;
      const d = Math.hypot(P.x - it.x, (P.y - 4) - it.y);
      if (d < (it.r || 26) && d < bd) { best = it; bd = d; }
    }
    G.near = best;
    for (const tr of sc.triggers) {
      if (tr.done) continue;
      if (P.x >= tr.x && P.x <= tr.x + tr.w && P.y >= tr.y && P.y <= tr.y + tr.h) {
        if (tr.once) tr.done = true;
        runInteraction(tr.fn); break;
      }
    }
  }
  const btn = $('btn-act');
  if (G.near && G.free && !G.interacting) {
    const lab = G.near.label || ({ talk: 'TALK', inspect: 'INSPECT', continue: 'CONTINUE' }[G.near.kind] || 'INSPECT');
    if ($('act-label').textContent !== lab) $('act-label').textContent = lab;
    btn.classList.remove('hidden');
  } else btn.classList.add('hidden');

  if (sc.onUpdate) sc.onUpdate(dt, G);
  updateCam(dt); updateFx(dt);
  if (!G.interacting) {
    for (let i = G.waiters.length - 1; i >= 0; i--) {
      const w = G.waiters[i]; let ok = false; try { ok = w.fn(); } catch (e) { console.error(e); }
      if (ok) { G.waiters.splice(i, 1); w.res(); }
    }
  }
}

function updateCam(dt) {
  const tw = G.camTween;
  if (tw) {
    tw.t += dt * 1000; const k = easeIO(Math.min(1, tw.t / tw.ms));
    G.cam.x = lerp(tw.x0, tw.x1, k); G.cam.y = lerp(tw.y0, tw.y1, k); G.cam.z = lerp(tw.z0, tw.z1, k);
    if (tw.t >= tw.ms) { G.camTween = null; tw.res(); }
    return;
  }
  if (G.camLock) return;
  const P = G.player, k = 1 - Math.exp(-dt * 6);
  G.cam.x += (P.x - G.cam.x) * k; G.cam.y += (P.y - 8 - G.cam.y) * k; G.cam.z += (baseZoom(G.scene) - G.cam.z) * k;
  clampCam();
}

/* ---------------------------------------------------------------- render */
/* small interior scenes (bus, rooms, corridor) fill more of a tall phone screen */
function baseZoom(sc) {
  if (!sc || sc.fixedZoom) return 1;
  return Math.max(1, Math.min(2.1, VH * .56 / sc.h));
}
function drawVoid(c, sc) {
  c.fillStyle = sc.voidColor || '#05040f'; c.fillRect(0, 0, VW, VH);
  if (['bus', 'classroom', 'room', 'yahyaHome', 'momnaHome', 'corridor'].includes(sc.name)) {
    const g = c.createRadialGradient(VW / 2, VH / 2, 6, VW / 2, VH / 2, Math.max(VW, VH) * .62);
    g.addColorStop(0, 'rgba(70,50,140,.34)'); g.addColorStop(1, 'rgba(70,50,140,0)');
    c.fillStyle = g; c.fillRect(0, 0, VW, VH);
    const t = G.t;
    for (let i = 0; i < 26; i++) {      // a few slow motes, so the dark never feels dead
      const x = (i * 83 + t * (3 + i % 5)) % (VW + 10), y = (i * 47 + Math.sin(t * .4 + i) * 5 + 12 * i) % VH;
      c.fillStyle = `rgba(200,190,255,${.10 + .10 * Math.sin(t * .8 + i)})`; c.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }
}

function drawEnt(c, e, sc) {
  if (e.visible === false) return;
  drawChar(c, e.key, e.x, e.y, e.dir, e.frame, { moving: e.moving, t: G.t, sit: e.sit, scale: e.scale, ghostA: e.alpha });
  if (e.emote) {
    const tx = e.emote.text, bx = Math.round(e.x), by = Math.round(e.y - 28 * (e.scale || 1) - Math.sin(G.t * 6) * 1);
    c.fillStyle = 'rgba(255,255,255,.92)'; c.fillRect(bx - 5, by - 7, 11, 9); c.fillRect(bx - 1, by + 2, 3, 2);
    c.fillStyle = '#7a3fd0'; c.font = 'bold 8px sans-serif'; c.textAlign = 'center'; c.fillText(tx, bx + .5, by + 1);
  }
}

function render() {
  const c = ctx; c.imageSmoothingEnabled = false;
  if (G.mode === 'title' || !G.scene) { drawTitleBG(c, G.t, VW, VH); return; }
  const sc = G.scene, z = G.cam.z;
  drawVoid(c, sc);
  let cx = G.cam.x, cy = G.cam.y;
  if (G.shake > 0) { cx += (Math.random() - .5) * G.shake * 5; cy += (Math.random() - .5) * G.shake * 5; }
  if (!G.camLock) { cx = Math.round(cx); cy = Math.round(cy); }
  const ox = Math.round(VW / 2), oy = Math.round(VH / 2);
  G.view = { cx, cy, z, ox, oy };
  c.save();
  c.translate(ox, oy); c.scale(z, z); c.translate(-cx, -cy);
  if (sc.drawBefore) sc.drawBefore(c, G.t, G);
  if (sc.bg) c.drawImage(sc.bg, 0, 0);
  if (sc.drawBG) sc.drawBG(c, G.t, G);

  const ents = [];
  for (const p of sc.props) ents.push({ y: p.y, p });
  for (const n of sc.npcs) ents.push({ y: n.y, n });
  if (G.player.visible) ents.push({ y: G.player.y, n: G.player });
  ents.sort((a, b) => a.y - b.y);
  for (const e of ents) { if (e.p) e.p.draw(c, G.t, G); else drawEnt(c, e.n, sc); }

  if (G.near && G.free) {
    const it = G.near, by = it.y - 18 + Math.sin(G.t * 5) * 1.5;
    c.fillStyle = 'rgba(255,170,230,.95)'; c.fillRect(Math.round(it.x) - 2, Math.round(by), 5, 1); c.fillRect(Math.round(it.x) - 1, Math.round(by) + 1, 3, 1); c.fillRect(Math.round(it.x), Math.round(by) + 2, 1, 1);
  }
  if (sc.drawFG) sc.drawFG(c, G.t, G);
  drawParticles(c);
  c.restore();

  if (sc.dark) drawLighting(c, sc);
  drawGlows(c, sc);
  if (sc.outdoor) { const t = todTint(G.tod); if (t[3] > .004) { c.fillStyle = `rgba(${t[0]},${t[1]},${t[2]},${t[3]})`; c.fillRect(0, 0, VW, VH); } }
  if (sc.ambient) { c.fillStyle = sc.ambient; c.fillRect(0, 0, VW, VH); }
  if (G.dark > .01) { c.fillStyle = `rgba(6,5,26,${G.dark})`; c.fillRect(0, 0, VW, VH); }
  if (G.rain > 0) drawRain(c);
  if (G.flash > 0) { c.fillStyle = `rgba(220,230,255,${G.flash * .55})`; c.fillRect(0, 0, VW, VH); }
}

/* --------------------------------------------------------------- main loop */
let lastTs = 0;
function frame(ts) {
  const dt = Math.min(.05, (ts - lastTs) / 1000 || 0); lastTs = ts;
  try { update(dt); render(); } catch (e) { console.error(e); }
  requestAnimationFrame(frame);
}
function startLoop() {
  resize(); window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  initInput(); loadImages();
  Music.setMuted(Save.getMute());
  requestAnimationFrame(frame);
}
window.__G = G;
