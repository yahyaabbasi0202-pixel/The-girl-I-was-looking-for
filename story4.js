/* ==========================================================================
   story4.js — FINAL CHAPTER: Together
   A night world. Yahya walks. Momna appears in the distance — and walks
   toward him too. The camera then pulls back across every earlier chapter
   and returns to the SAME framing (FIRST_SHOT) used the first time he
   noticed her. First meeting → final meeting. This time, he isn't alone.
   ========================================================================== */
'use strict';

function fadeNpc(n, to, ms) {
  return new Promise(res => {
    const a = n.alpha == null ? 1 : n.alpha, t0 = performance.now(); ms = ms || 1400;
    (function step() {
      const k = Math.min(1, (performance.now() - t0) / ms); n.alpha = lerp(a, to, k);
      if (k < 1) requestAnimationFrame(step); else res();
    })();
  });
}

async function chFinal() {
  setChapterTag('Final chapter · Together');
  const c = STORY.c = { met: false, choice: 'menu' };
  await gotoScene('courtyard', { music: 'final', night: true, world: true, tod: 1, spawn: { x: 160, y: 396, dir: 'up' } });
  const A = G.scene.A, F = FIRST_SHOT, P = G.player, LOW = { pos: 'low', cls: 'soft' }, LOWBIG = { pos: 'low', cls: 'big' };
  const momna = addNpc('momna', F.momnaFar.x, F.momnaFar.y, { dir: 'left', use: null, alpha: 0, r: 0 });
  trackHer(momna);

  await narr('That night, the whole school was quiet.');
  await thought("So much was behind me now. The bus. The wrong account. The wait.");
  await thought('I just walked.');

  look(A.benchL.x, A.benchL.y - 6, ['The blossom bench. I think I finally understand why she liked it here.']);
  look(A.flag.x, A.flag.y + 8, ['The flag is asleep. So is the whole courtyard.']);

  /* she appears far away once he has walked a little way into the courtyard */
  addTrigger({ x: 18, y: 330, w: 284, h: 70, fn: async () => {
    SFX.sparkle(); setObjective('Follow the lit path');
    await fadeNpc(momna, 1, 1800);
  } });

  /* the callback shot: same trigger area, same camera as Chapter 1 */
  addTrigger({ x: 140, y: 262, w: 50, h: 36, fn: async () => {
    playMode(false); setObjective(null);
    await moveTo(P, F.yahya.x, F.yahya.y, 34); P.dir = 'right';
    if (momna.alpha < 1) momna.alpha = 1;
    Music.duck(.45); setMood('soft');
    await Promise.all([bars(true), camTo(F.x, F.y, F.z, 2400)]);
    await wait(1300);
    await cine(['For months, I was the one walking toward her.', 'Tonight, she was walking toward me.'], LOW);
    await wait(300);
    await moveTo(momna, F.momnaNear.x, F.momnaNear.y, 18);   // she comes to him; he does not chase
    momna.dir = 'left'; P.dir = 'right';
    SFX.sparkle(); SFX.heart();
    addLight({ x: (F.yahya.x + F.momnaNear.x) / 2, y: 262, r: 84, c: '255,170,215', a: .15 });
    setFx('firefly', 46);
    c.met = true;
  } });

  await beginPlay('Follow the lit path');
  await waitFor(() => c.met);
  await endPlay();
  await wait(3000);                                          // a quiet moment — together, for the first time

  /* the pull-back: every chapter, left to right, then home to the same shot */
  Music.duck(.8);
  await camTo(190, 262, .6, 4200);
  await camTo(-1000, 300, .55, 6500);
  await Promise.all([camTo(-650, 300, .55, 5200), cine(['“After the wrong account...”'], LOW)]);
  await Promise.all([camTo(-300, 300, .55, 4200), cine(['“After the months of waiting...”'], LOW)]);
  await Promise.all([camTo(640, 300, .55, 7200), cine(['“After all the misunderstandings...”'], LOW)]);
  await camTo(1150, 290, .55, 4200);
  await Promise.all([camTo(F.x, F.y, F.z, 7000), cine(['“I finally found the person I was looking for.”'], LOWBIG)]);
  await wait(1400);
  await cine(['“And this time, I wasn\'t looking anymore.”'], LOWBIG);
  await wait(500);
  await cine(['“Maybe this isn\'t the end of our story.\nMaybe it\'s just the beginning of the next chapter.”'], { pos: 'low', cls: 'soft', hold: 4800 });

  /* [OUR NEXT CHAPTER →]  — does not predict the future */
  await new Promise(res => {
    const box = el('div', 'endcard');
    box.style.cssText = 'align-self:flex-end;margin-bottom:13vh';
    const b = el('button', 'glow-btn final-btn', CONFIG.nextChapterLabel);
    b.onclick = () => { SFX.click(); b.disabled = true; res(); };
    box.appendChild(b); overlayShow(box, { clear: true });
  });
  overlayHide();
  await fade(1, 2400);
  Save.set(CHAPTERS.length);
  await cine([CONFIG.toBeContinued], { cls: 'big', pause: 1400, hold: 3600 });

  if (['momna', 'memory1', 'memory2', 'memory3'].some(hasImg)) await showGallery(['memory1', 'memory2', 'memory3', 'momna']);

  /* end card */
  c.choice = await new Promise(res => {
    const box = el('div', 'endcard', `<h2>${CONFIG.toBeContinued}</h2><p>${CONFIG.dedication}</p><div class="row"></div>`);
    const row = box.querySelector('.row');
    const mkb = (t, v, cls) => { const b = el('button', cls, t); b.onclick = () => { SFX.click(); res(v); }; row.appendChild(b); };
    mkb('Replay the story', 'replay', 'ghost-btn'); mkb('Back to title', 'menu', 'ghost-btn');
    overlayShow(box);
  });
  overlayHide();
  return c.choice;
}
