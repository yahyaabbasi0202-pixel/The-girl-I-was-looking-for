/* ==========================================================================
   puzzles.js — calendar, time-passing, and the mini-games:
   hold-to-wait, the three-Momina clue puzzle, the Iftekhar clue board,
   the month timeline, the star-constellation that unlocks the finale,
   plus photo frames, vignettes and the family call.
   ========================================================================== */
'use strict';

/* ----------------------------------------------------------------- calendar */
function calendarShow(head, big, sub) {
  const cal = $('calendar'), card = $('cal-card');
  $('cal-head').textContent = head; $('cal-big').textContent = big; $('cal-sub').textContent = sub || '';
  cal.classList.remove('hidden'); card.classList.remove('flip'); void card.offsetWidth; card.classList.add('flip'); SFX.flip();
}
function calendarHide() { $('calendar').classList.add('hidden'); }
async function showCalendar(head, big, sub, ms) { calendarShow(head, big, sub); await wait(ms || 1900); calendarHide(); await wait(250); }

function setTod(v, ms) {
  return new Promise(res => {
    const a = G.tod, t0 = performance.now(); ms = ms || 1500;
    (function step() {
      const k = Math.min(1, (performance.now() - t0) / ms); G.tod = lerp(a, v, k);
      if (k < 1) requestAnimationFrame(step); else res();
    })();
  });
}
function setFx(type, count) {
  const sc = G.scene; if (!sc) return;
  const reg = (sc.fx && sc.fx.region) || { x: 0, y: 0, w: sc.w, h: sc.h };
  sc.fx = { type, count: count || 14, region: reg }; initFx(sc);
}

/* ----------------------------------------------- mini-game: hold to wait */
function clockText(min) {
  const h = Math.floor(min / 60) % 24, m = Math.floor(min % 60);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
/* o: {startMin, hours, label, tod0, tod1, seconds, onProgress(k)} */
function holdToWait(o) {
  return new Promise(res => {
    const ui = $('wait-ui'), btn = $('wait-btn'), fill = $('wait-fill'), clk = $('wait-clock');
    $('wait-label').textContent = o.label || 'Waiting…';
    fill.style.width = '0%'; btn.textContent = 'HOLD TO WAIT'; clk.textContent = clockText(o.startMin);
    ui.classList.remove('hidden');
    let k = 0, ptr = false, last = performance.now(), lastTick = -1, stop = false;
    const secs = o.seconds || 5.5;
    const down = e => { e.preventDefault(); ptr = true; SFX.unlock(); btn.classList.add('held'); };
    const up = () => { ptr = false; btn.classList.remove('held'); };
    btn.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    (function loop(ts) {
      if (stop) return;
      const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts;
      const held = ptr || Input.keys[' '] || Input.keys['enter'];
      if (held && k < 1) {
        k = Math.min(1, k + dt / secs);
        G.tod = lerp(o.tod0 != null ? o.tod0 : G.tod, o.tod1 != null ? o.tod1 : G.tod, k);
        const mins = o.startMin + k * o.hours * 60;
        clk.textContent = clockText(mins); fill.style.width = (k * 100) + '%';
        const tick = Math.floor(k * o.hours * 4); if (tick !== lastTick) { lastTick = tick; SFX.blip(); }
        if (o.onProgress) o.onProgress(k);
      }
      if (k >= 1) {
        stop = true; btn.removeEventListener('pointerdown', down);
        window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        btn.classList.remove('held');
        setTimeout(() => { ui.classList.add('hidden'); res(); }, 600); return;
      }
      requestAnimationFrame(loop);
    })(performance.now());
  });
}

/* ------------------------- mini-game 3: which Momina? (three-Momina clue) */
function identityPuzzle() {
  return new Promise(res => {
    const S = CONFIG.social.chapter6.results;
    const cards = [
      { key: 'wrong', name: N.wrongFull, tag: 'The account I followed', color: '#ff8fb1' },
      { key: 'junior', name: N.thirdFull, tag: 'Two classes below', color: '#ffcf8a' },
      { key: 'her', name: 'Momina — ?', tag: 'The girl from the courtyard', color: '#c3a6ff' }
    ];
    const box = el('div', 'mg',
      `<h3>Three girls. One name.</h3>
       <p class="sub">Pick a clue, then tap the girl it rules out.<br>Only one of them can be <i>her</i>.</p>
       <div class="cards"></div><div class="clues"></div><div class="msg"></div>`);
    const cardsEl = box.querySelector('.cards'), cluesEl = box.querySelector('.clues'), msg = box.querySelector('.msg');
    let sel = null; const outs = new Set(); const cardEls = {};
    cards.forEach(c => {
      const d = el('button', 'pcard', `${avatarHTML({ name: c.name === 'Momina — ?' ? '?' : c.name, color: c.color })}<div class="nm">${c.name}</div><div class="tg">${c.tag}</div>`);
      d.onclick = () => tryCard(c, d); cardsEl.appendChild(d); cardEls[c.key] = d;
    });
    const clueEls = CONFIG.identityClues.map((c, i) => {
      const d = el('button', 'clue', c.text);
      d.onclick = () => { SFX.click(); cluesEl.querySelectorAll('.clue').forEach(x => x.classList.remove('sel')); d.classList.add('sel'); sel = i; msg.textContent = ''; };
      cluesEl.appendChild(d); return d;
    });
    const bad = (d, t) => { SFX.error(); d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake'); msg.textContent = t; };
    function tryCard(c, d) {
      if (sel === null) { bad(d, 'Pick a clue first.'); return; }
      if (outs.has(c.key)) return;
      const clue = CONFIG.identityClues[sel];
      if (clue.rulesOut) {
        if (clue.rulesOut !== c.key) { bad(d, "That clue doesn't rule out this girl."); return; }
        outs.add(c.key); d.classList.add('out'); clueEls[sel].classList.add('used'); clueEls[sel].classList.remove('sel'); sel = null;
        SFX.chime(); msg.textContent = outs.size === 2 ? 'Only one Momina is left…' : 'One down.';
      } else {
        if (outs.size < 2 || c.key !== 'her') { bad(d, 'Rule out the other two first.'); return; }
        d.classList.add('win'); clueEls[sel].classList.add('used'); sel = null; SFX.sparkle();
        msg.textContent = "It's her. The girl from the courtyard — and I still don't know her surname.";
        const b = el('button', 'pbtn go', 'CONTINUE'); b.onclick = () => { SFX.click(); overlayHide(); res(); }; box.appendChild(b);
      }
    }
    overlayShow(box);
  });
}

/* ------------------------------ mini-game 4: the clue board → "Iftekhar" */
function clueBoard(notes, heading, sub) {
  return new Promise(res => {
    const box = el('div', 'mg', `<h3>${heading}</h3><p class="sub">${sub || ''}</p><div class="board"></div>`);
    const board = box.querySelector('.board');
    notes.forEach((n, i) => setTimeout(() => {
      board.appendChild(el('div', 'note' + (n.empty ? ' empty' : ''), n.t)); SFX.flip();
    }, 400 + i * 700));
    setTimeout(() => {
      const b = el('button', 'pbtn go', 'CONTINUE'); b.onclick = () => { SFX.click(); overlayHide(); res(); }; box.appendChild(b);
    }, 600 + notes.length * 700);
    overlayShow(box);
  });
}
function nameReveal(word, line) {
  return new Promise(async res => {
    const box = el('div', 'mg', `<h3>A name.</h3><p class="sub">The one clue everything had been waiting for.</p><div class="letters"></div><div class="msg" style="font-size:16px;font-family:Georgia,serif;font-style:italic"></div>`);
    const L = box.querySelector('.letters');
    word.toUpperCase().split('').forEach(ch => L.appendChild(el('span', null, ch)));
    overlayShow(box);
    await wait(900);
    const spans = [...L.children];
    for (let i = 0; i < spans.length; i++) { spans[i].classList.add('on'); SFX.chime(); await wait(420); }
    SFX.sparkle(); box.querySelector('.msg').textContent = line || '';
    await wait(1400);
    const b = el('button', 'pbtn go', 'CONTINUE'); b.onclick = () => { SFX.click(); overlayHide(); res(); }; box.appendChild(b);
  });
}

/* -------------------------- mini-game 5: the timeline of months (tap through) */
function timelineGame(months, o) {
  o = o || {};
  return new Promise(res => {
    const box = el('div', 'mg',
      `<h3>${o.title || 'The long wait'}</h3><p class="sub">${o.sub || 'Tap to turn the page. Let the months pass.'}</p>
       <canvas class="tl-sky" width="200" height="72"></canvas>
       <div class="mini-cal"><div class="cal-card"><div class="cal-head"></div><div class="cal-big"></div><div class="cal-sub"></div></div></div>
       <div class="tl-cap"></div><div class="tl-dots"></div><div class="tl-act"></div>`);
    const cnv = box.querySelector('canvas'), c = cnv.getContext('2d'); c.imageSmoothingEnabled = false;
    const card = box.querySelector('.cal-card'), cap = box.querySelector('.tl-cap'), dots = box.querySelector('.tl-dots'), act = box.querySelector('.tl-act');
    months.forEach(() => dots.appendChild(el('i')));
    let i = -1, tod = months[0].tod, alive = true;
    function paint(ts) {
      if (!alive || !cnv.isConnected) return;
      const t = ts / 1000, prog = Math.max(0, i) / Math.max(1, months.length - 1);
      skyGrad(c, 0, 0, 200, 72, tod);
      if (tod > .85) for (let s = 0; s < 22; s++) rect(c, (s * 37) % 200, (s * 13) % 36, 1, 1, `rgba(255,255,255,${.4 + .5 * Math.abs(Math.sin(t + s))})`);
      rect(c, 0, 52, 200, 20, '#2a2f5a'); rect(c, 0, 52, 200, 2, '#3a4080');
      rect(c, 120, 30, 60, 22, '#3a3470'); rect(c, 116, 26, 68, 5, '#2a2652');
      for (let w = 0; w < 4; w++) rect(c, 126 + w * 14, 36, 8, 7, '#ffd98a');
      const x = 30 + prog * 70;
      drawChar(c, 'yahya', Math.round(x), 66, 'right', Math.floor(t * 5) % 4, { moving: true, t, scale: 1.1 + prog * .35 });
      requestAnimationFrame(paint);
    }
    requestAnimationFrame(paint);
    const btn = el('button', 'pbtn go', 'NEXT →'); act.appendChild(btn);
    btn.onclick = async () => {
      SFX.click();
      if (i >= months.length - 1) { alive = false; overlayHide(); res(); return; }
      btn.disabled = true; i++;
      const m = months[i]; tod = m.tod;
      card.querySelector('.cal-head').textContent = m.head; card.querySelector('.cal-big').textContent = m.big; card.querySelector('.cal-sub').textContent = m.sub || '';
      card.classList.remove('flip'); void card.offsetWidth; card.classList.add('flip'); SFX.flip();
      cap.textContent = m.cap;
      [...dots.children].forEach((d, k) => d.classList.toggle('on', k <= i));
      await wait(900); btn.disabled = false;
      btn.textContent = i >= months.length - 1 ? 'CONTINUE' : 'NEXT →';
    };
    overlayShow(box);
  });
}

/* ------------------- mini-game 6: connect the memories to unlock the finale */
function starUnlock() {
  return new Promise(res => {
    const stars = [
      { l: 'The new bus', x: 20, y: 76 }, { l: 'I noticed her', x: 74, y: 80 }, { l: 'Always looking', x: 46, y: 66 },
      { l: 'The wrong account', x: 80, y: 56 }, { l: 'Iftekhar', x: 16, y: 50 }, { l: 'The long wait', x: 56, y: 46 },
      { l: 'Her reply', x: 32, y: 34 }, { l: 'Two families', x: 78, y: 34 }, { l: 'A good friend', x: 50, y: 24 }
    ];
    const box = el('div', 'starfield',
      `<svg viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
       <div class="star-title"><h3>Connect the memories</h3><p>Tap them in the order they happened.</p></div>
       <div class="star-msg"></div>`);
    const svg = box.querySelector('svg'), msg = box.querySelector('.star-msg');
    let next = 0, wrong = 0; const els = [];
    stars.forEach((s, i) => {
      const d = el('button', 'star', `<span>${s.l}</span><em>✦</em>`);
      d.style.left = s.x + '%'; d.style.top = s.y + '%'; d.style.animationDelay = (i * .27) + 's';
      d.onclick = () => {
        if (i < next) return;
        if (i !== next) {
          wrong++; SFX.error(); d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake');
          msg.textContent = 'Not yet. Remember what came first.';
          if (wrong >= 2) els[next].classList.add('hint');
          return;
        }
        d.classList.add('lit'); SFX.chime(); els.forEach(e => e.classList.remove('hint')); wrong = 0;
        if (next > 0) {
          const p = stars[next - 1], ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          ln.setAttribute('x1', p.x); ln.setAttribute('y1', p.y); ln.setAttribute('x2', s.x); ln.setAttribute('y2', s.y);
          ln.setAttribute('vector-effect', 'non-scaling-stroke'); svg.appendChild(ln);
        }
        next++; msg.textContent = '';
        if (next === stars.length) done();
      };
      box.appendChild(d); els.push(d);
    });
    async function done() {
      await wait(500); SFX.sparkle(); msg.textContent = 'Every step led here.';
      await wait(2200); box.style.transition = 'opacity 1.2s'; box.style.opacity = 0; await wait(1200); overlayHide(); res();
    }
    overlayShow(box);
  });
}

/* ------------------------------------------------------------------- photos */
function polaroidHTML(key, caption) {
  const ok = hasImg(key);
  const inner = ok ? `<img src="${CONFIG.images[key]}" alt="">`
    : `<div class="pol-ph"><b>✦</b><span>a memory</span>${CONFIG.devHints ? `<small>${CONFIG.images[key]}</small>` : ''}</div>`;
  return `<div class="polaroid"><div class="pol-img">${inner}</div><div class="pol-cap">${caption || ''}</div></div>`;
}
async function showPhoto(key, caption) {
  if (!hasImg(key) && !CONFIG.showPhotoPlaceholders) return;
  const box = el('div', null, polaroidHTML(key, caption || CONFIG.memoryCaptions[key]));
  box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:22px';
  overlayShow(box); SFX.sparkle();
  await wait(900); await tapButton(box, 'CONTINUE', 'pbtn alt'); overlayHide(); await wait(300);
}
async function showGallery(keys) {
  const list = keys.filter(k => hasImg(k) || CONFIG.showPhotoPlaceholders);
  if (!list.length) return;
  const wrap = el('div', null);
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;max-height:96vh';
  const g = el('div', 'gallery', list.map(k => polaroidHTML(k, k === 'momna' ? 'The girl I was looking for' : CONFIG.memoryCaptions[k])).join(''));
  wrap.appendChild(g); overlayShow(wrap); SFX.sparkle();
  await wait(1400); await tapButton(wrap, 'CONTINUE', 'pbtn alt'); overlayHide(); await wait(300);
}

/* ------------------------------------------------------ vignettes + family call */
function vignetteShow(kind, o) {
  o = o || {};
  const cnv = mk(210, 120), box = el('div', 'vignette'); box.appendChild(cnv);
  if (kind === 'bench') drawMiniBench(cnv, o); else drawMiniRoom(cnv, o);
  overlayShow(box, { dlg: true }); SFX.sparkle();
  return { close() { overlayHide(); } };
}
function familyCallShow() {
  const mkPanel = (who, tag, wall) => {
    const p = el('div', 'panel', `<div class="tag">${tag}</div>`), cv2 = mk(210, 100);
    drawMiniRoom(cv2, { who, wall }); p.appendChild(cv2); return p;
  };
  const box = el('div', 'split'), a = mkPanel('mother1', "Yahya's home", '#4a3a74'), b = mkPanel('mother2', "Momna's home", '#3a4a6e');
  box.appendChild(a); box.appendChild(b);
  overlayShow(box, { dlg: true });
  return {
    talk(side) { a.classList.toggle('talk', side === 1); b.classList.toggle('talk', side === 2); },
    close() { overlayHide(); }
  };
}
