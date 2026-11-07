/* ==========================================================================
   game.js — boot, title screen, chapter list, and the flow that runs the
   story from chapter to chapter.  (Everything else lives in the other files.)
   Chapter order, titles and the little line under each title are edited here.
   ========================================================================== */
'use strict';

const CHAPTERS = [
  { n: 'Chapter 1',     name: 'The New Bus',                 line: 'Every story has a first morning.',                  run: () => ch1() },
  { n: 'Chapter 2',     name: 'Always Looking For Her',      line: "Some days she was there. Some days she wasn't.",    run: () => ch2() },
  { n: 'Chapter 3',     name: 'Finding Her Account',         line: 'Words are easier on a screen.',                     run: () => ch3() },
  { n: 'Chapter 4',     name: 'The Wrong Momna',             line: "A name isn't enough.",                              run: () => ch4() },
  { n: 'Chapter 5',     name: 'The Long Wait',               line: 'Months, in a handful of pages.',                    run: () => ch5() },
  { n: 'Chapter 6',     name: 'Finally Finding Her',         line: 'Some answers take their time.',                     run: () => ch6() },
  { n: 'Chapter 7',     name: 'Getting to Know Each Other',  line: 'Slow, gentle, and honest.',                         run: () => ch7() },
  { n: 'Chapter 8',     name: 'The Misunderstanding',        line: 'One sentence. Two homes.',                          run: () => ch8() },
  { n: 'Chapter 9',     name: 'Families',                    line: 'The truth, told by the right people.',              run: () => ch9() },
  { n: 'Chapter 10',    name: "Momna's Friend",              line: 'Someone was there all along.',                      run: () => ch10() },
  { n: 'Final Chapter', name: 'Together',                    line: 'The night the road met in the middle.',             run: () => chFinal() }
];

let RUNNING = false;

function showTitleUI() {
  G.mode = 'title'; G.scene = null; G.camLock = false; G.camTween = null; G.cam.z = 1;
  resetWorld(); setObjective(null); showHUD(false);
  $('title-screen').classList.remove('hidden');
  $('chapters-menu').classList.add('hidden');
  $('hud').classList.add('hidden');
  const done = Save.get();
  $('btn-start').textContent = CONFIG.startLabel;
  $('btn-start').classList.remove('hidden');
  $('btn-continue').textContent = done > 0 && done < CHAPTERS.length ? `CONTINUE · ${CHAPTERS[done].n === 'Final Chapter' ? 'Final chapter' : CHAPTERS[done].n}` : '';
  $('btn-continue').classList.toggle('hidden', !(done > 0 && done < CHAPTERS.length));
  $('btn-chapters').classList.toggle('hidden', done < 1 && !CONFIG.unlockAllChapters);
  $('title-hint').classList.remove('hidden');
}

async function titleSequence(first) {
  showTitleUI();
  $('title-h1').textContent = CONFIG.title;
  const sp = $('title-quote').querySelectorAll('span');
  sp[0].textContent = CONFIG.openingQuote[0]; sp[1].textContent = CONFIG.openingQuote[1];
  sp.forEach(s => s.classList.remove('show'));
  ['btn-start', 'btn-continue', 'btn-chapters', 'title-hint'].forEach(id => $(id).classList.add('hidden'));
  $('title-h1').style.animation = 'none'; void $('title-h1').offsetWidth; $('title-h1').style.animation = '';
  await fade(0, 1600);
  await wait(first ? 1700 : 700); sp[0].classList.add('show');
  await wait(2000); sp[1].classList.add('show');
  await wait(2000);
  showTitleUI(); // reveals the buttons
}

function buildChapterMenu() {
  const list = $('chapters-list'); list.innerHTML = '';
  const done = Save.get();
  CHAPTERS.forEach((ch, i) => {
    const open = CONFIG.unlockAllChapters || i <= done;
    const b = document.createElement('button');
    b.innerHTML = `<b>${i < CHAPTERS.length - 1 ? i + 1 : '✦'}</b>${open ? ch.name : '— locked —'}`;
    b.disabled = !open; b.style.opacity = open ? 1 : .4;
    b.onclick = () => { SFX.unlock(); begin(i); };
    list.appendChild(b);
  });
}

async function begin(i) {
  if (RUNNING) return; RUNNING = true;
  SFX.unlock(); Music.prime();
  const ts = $('title-screen'); ts.style.pointerEvents = 'none'; ts.style.transition = 'opacity .8s'; ts.style.opacity = 0;
  $('chapters-menu').classList.add('hidden');
  await fade(1, 900);
  ts.classList.add('hidden'); ts.style.pointerEvents = ''; ts.style.opacity = ''; ts.style.transition = '';
  Music.play('day');
  let outcome = 'menu';
  for (; i < CHAPTERS.length; i++) {
    const ch = CHAPTERS[i];
    G.interacting = false; G.overlayOpen = false; Dlg.active = false; Dlg.choiceOpen = false; G.waiters.length = 0; G.movers.length = 0;
    resetWorld(); G.player.scale = i >= 5 ? 1.07 : 1; G.player.visible = true;
    showHUD(false); setObjective(null); G.near = null; playMode(false);
    await fade(1, 600);
    await chapterCard(ch.n, ch.name, ch.line);
    showHUD(true);
    try { const r = await ch.run(); if (r) outcome = r; }
    catch (e) { console.error('Chapter error', ch.name, e); }
    Save.set(i + 1);
    await fade(1, 700);
  }
  RUNNING = false;
  Music.stop(); G.mode = 'title';
  if (outcome === 'replay') { RUNNING = false; await titleSequence(false); begin(0); return; }
  await titleSequence(false);
}

function boot() {
  startLoop();
  $('btn-start').onclick = () => begin(0);
  $('btn-continue').onclick = () => begin(Math.min(Save.get(), CHAPTERS.length - 1));
  $('btn-chapters').onclick = () => { SFX.unlock(); buildChapterMenu(); $('chapters-menu').classList.remove('hidden'); };
  $('chapters-close').onclick = () => $('chapters-menu').classList.add('hidden');
  /* dev shortcut: index.html?chapter=7 jumps straight to a chapter */
  const m = /[?&#]chapter=(\d+)/.exec(location.href + '');
  if (m) {
    const idx = clamp(parseInt(m[1], 10) - 1, 0, CHAPTERS.length - 1);
    showTitleUI(); $('title-screen').classList.add('hidden');
    // audio needs one tap on most browsers, so wait for it
    const tap = el('div', null, 'Tap to start chapter ' + (idx + 1));
    tap.style.cssText = 'position:absolute;inset:0;z-index:95;display:flex;align-items:center;justify-content:center;background:#05040f;color:#cfc4ff;font:italic 20px Georgia,serif;letter-spacing:.05em';
    $('app').appendChild(tap);
    let started = false;
    const start = () => { if (started) return; started = true; tap.remove(); begin(idx); };
    tap.addEventListener('pointerdown', start); window.addEventListener('keydown', start, { once: true });
    return;
  }
  titleSequence(true);
}

window.addEventListener('load', boot);
