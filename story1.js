/* ==========================================================================
   story1.js — shared story helpers + Chapters 1-3
   1 The New Bus · 2 Always Looking For Her · 3 Finding Her Social Media
   ========================================================================== */
'use strict';

const STORY = { c: {}, school: null };

/* ------------------------------------------------------------ small helpers */
function resetWorld() {
  setDarkness(0); setMood('normal'); G.rain = 0; Music.duck(1); G.darkTarget = 0; G.dark = 0;
  G.player.key = 'yahya'; G.player.speed = 58; G.player.slow = 1;
  calendarHide(); $('wait-ui').classList.add('hidden');
}
function door(x, y, label, fn, enabled) { return addInteract({ x, y, r: 24, kind: 'continue', label: label || 'ENTER', use: fn, enabled }); }
function look(x, y, lines, o) {
  o = o || {};
  return addInteract({
    x, y, r: o.r || 24, kind: 'inspect', label: o.label, enabled: o.enabled,
    use: async () => {
      for (const l of [].concat(lines)) {
        if (Array.isArray(l)) await say(l[0], l[1]); else await say((o.who || 'yahya') + '*', l);
      }
      if (o.after) await o.after();
    }
  });
}
function ambient(key, x, y, dir) { return addNpc(key, x, y, { dir: dir || 'down', use: null, r: 0 }); }
function npcByKey(k) { return G.scene.npcs.find(n => n.key === k); }
function trackHer(npc) {
  const L = addLight({ x: npc.x, y: npc.y - 10, r: 54, c: '255,150,220', a: 0 });
  G.scene.onUpdate = () => {
    const d = Math.hypot(G.player.x - npc.x, G.player.y - npc.y);
    L.a = clamp(1 - d / 160, 0, 1) * .22; L.x = npc.x; L.y = npc.y - 10;
  };
}
async function beginPlay(objective) { showHUD(true); playMode(true); setObjective(objective); }
async function endPlay() { playMode(false); setObjective(null); }

/* =============================================================== CHAPTER 1 */
async function ch1() {
  setChapterTag('Chapter 1 · The New Bus');
  STORY.c = { seen: new Set(), ready: false, left: false };
  await gotoScene('bus', { music: 'day', tod: .3, spawn: { x: 346, y: 88, dir: 'left' } });
  showHUD(true);
  const A = G.scene.A, c = STORY.c;
  await narr('A new school year. A new bus.');
  await thought("New seats, new faces. I didn't know anyone here yet.");

  const mark = k => {
    c.seen.add(k);
    if (!c.ready && c.seen.size >= 3) { c.ready = true; setObjective('Get off at school'); toast('The bus is nearly there'); }
    else if (!c.ready) setObjective(`Look around the bus (${c.seen.size}/3)`);
  };
  const driver = addNpc('driver', 334, 92, { dir: 'left', use: async () => {
    await say('driver', "Morning! You're the new one on this route, aren't you?");
    await say('yahya', 'Yes, sir. First week.');
    await say('driver', 'Long road, this one. Sit by the window. The view makes it shorter.');
    mark('driver');
  } });
  const fr = addNpc('friend1', A.seatFriend.x, A.seatFriend.y, { dir: 'up', sit: true, r: 32, use: async () => {
    await say('friend1', "You're the new guy, right? Don't worry. The first week is always the loudest.");
    await say('yahya', 'Is it always like this?');
    await say('friend1', "Always. You get used to it. Then one day you'll miss the noise.");
    mark('friend');
  } });
  look(A.seatMine.x, A.seatMine.y, ['My seat. By the window.', "It's strange how quickly a seat starts to feel like yours."], { after: () => mark('seat') });
  look(A.window.x, A.window.y, ['Fields, fences, the sun coming up slowly.', 'Every morning, the same road. Somehow it never gets boring.'], { after: async () => { mark('window'); await setTod(.42, 1200); } });
  look(A.bag.x, A.bag.y, ['My school bag. Half books, half crumbs.'], { after: () => mark('bag') });
  look(A.empty.x, A.empty.y, ['An empty seat. The whole bus is loud, but this seat is always quiet.'], { after: () => mark('empty') });
  door(A.door.x, A.door.y, 'GET OFF', async () => { c.left = true; }, () => c.ready);

  await beginPlay('Look around the bus (0/3)');
  await waitFor(() => c.left);
  await endPlay();

  await fade(1, 800);
  await showCalendar('AUGUST', '18', 'The first day on the bus');
  await showCalendar('SEPTEMBER', '08', 'Three weeks later');
  await ch1Courtyard();
}

async function ch1Courtyard() {
  await gotoScene('courtyard', { music: 'day', tod: .3, spawn: { x: 160, y: 396, dir: 'up' } });
  const A = G.scene.A, F = FIRST_SHOT, c = STORY.c; c.done = false;
  const momna = addNpc('momna', F.momnaFar.x, F.momnaFar.y, { dir: 'left', use: null });
  const friend = addNpc('momnaFriend', F.friendFar.x, F.friendFar.y, { dir: 'left', use: null });
  ambient('kid', 70, 250, 'right'); ambient('kidG', 60, 262, 'left'); ambient('friend2', 90, 360, 'up');
  await narr('By now, the school gates felt familiar.');
  door(A.door.x, A.door.y + 6, 'ENTER', async () => { await showPhoto('memory1'); c.done = true; }, () => c.noticed);
  addTrigger({ x: 140, y: 262, w: 50, h: 36, fn: async () => {
    playMode(false); setObjective(null);
    const P = G.player;
    await moveTo(P, F.yahya.x, F.yahya.y, 34); P.dir = 'right';
    Music.duck(.35); setMood('soft');
    await Promise.all([bars(true), camTo(F.x, F.y, F.z, 2400)]);
    await wait(1100);
    await cine(['“And then I noticed her.”'], { pos: 'low', cls: 'big' });
    await wait(500);
    await cine(["“I didn't know it yet...\nbut she was about to become one of the most important people in my story.”"], { pos: 'low', cls: 'soft' });
    await Promise.all([moveTo(momna, 160, 130, 24), moveTo(friend, 174, 134, 24)]);
    removeNpc(momna); removeNpc(friend);
    camFollow(); setMood('normal'); Music.duck(1); await bars(false);
    await thought('Just a girl walking to class with her friend.');
    await thought('That was all it was. For now.');
    c.noticed = true; setObjective('Go to class'); playMode(true);
  } });
  await beginPlay('Head to class');
  await waitFor(() => c.done);
  await endPlay(); await fade(1, 900);
}

/* =============================================================== CHAPTER 2 */
const SCHOOL_DAYS = [
  { date: ['SEPTEMBER', '22', 'Monday'], tod: .28, where: 'courtyard', spot: { x: 112, y: 222 }, fx: 'petal', music: 'day' },
  { date: ['SEPTEMBER', '24', 'Wednesday'], tod: .22, where: 'corridor', spot: { x: 232, y: 114 }, fx: 'petal', music: 'day' },
  { date: ['OCTOBER', '03', 'Friday'], tod: .42, where: null, mood: 'quiet', rain: .3, fx: 'leaf', music: 'emotional' },
  { date: ['OCTOBER', '14', 'Tuesday'], tod: .5, where: 'wait', fx: 'leaf', music: 'day' }
];
const SPAWNS = {
  courtyard: { gate: { x: 160, y: 396, dir: 'up' }, door: { x: 160, y: 140, dir: 'down' } },
  corridor: { court: { x: 40, y: 104, dir: 'right' }, class: { x: 282, y: 100, dir: 'down' } },
  classroom: { corr: { x: 30, y: 128, dir: 'right' } }
};

async function enterPlace(place, from) {
  const S = STORY.school, d = S.d;
  await gotoScene(place, { spawn: SPAWNS[place][from], tod: d.tod, mood: d.mood, rain: d.rain || 0, music: d.music });
  if (place === 'courtyard' && d.fx) setFx(d.fx, 14);
  const A = G.scene.A;
  if (place === 'courtyard') {
    door(A.door.x, A.door.y + 6, 'ENTER', () => enterPlace('corridor', 'court'));
    door(A.gate.x, A.gate.y, d.where === 'wait' ? 'WAIT' : 'GO HOME', () => S.gate());
    look(A.benchL.x, A.benchL.y - 6, d.where === null ? ['Her bench. Empty today.'] : ['A bench under the blossoms.'], { after: () => S.visit('bench') });
    if (d.where !== null) { ambient('kid', 70, 252, 'right'); ambient('kidG', 56, 262, 'left'); }
    if (d.where === 'courtyard') S.placeHer(d.spot.x, d.spot.y);
  } else if (place === 'corridor') {
    door(A.exit.x, A.exit.y + 4, 'OUTSIDE', () => enterPlace('courtyard', 'door'));
    door(A.classDoor.x, A.classDoor.y + 4, 'CLASSROOM', () => enterPlace('classroom', 'corr'));
    look(A.board.x, A.board.y + 14, ['Notices, timetables, a lost umbrella poster.'], { after: () => S.visit('board') });
    look(A.window.x, A.window.y, ['The window overlooks the courtyard. I checked it more than I should have.'], { after: () => S.visit('window') });
    look(A.lockersA.x, A.lockersA.y, ['Rows and rows of lockers. None of them mine.']);
    if (d.where === 'corridor') S.placeHer(d.spot.x, d.spot.y);
  } else if (place === 'classroom') {
    door(A.exit.x, A.exit.y, 'CORRIDOR', () => enterPlace('corridor', 'class'));
    look(A.window.x, A.window.y, ['From here you can see the whole courtyard.', "I wasn't looking for anyone. Obviously."], { after: () => S.visit('classroom') });
    look(A.board.x, A.board.y + 10, ['Chalk dust and half-erased equations.']);
  }
}

function dayCalendar(d) { return showCalendar(d.date[0], d.date[1], d.date[2], 1900); }

async function schoolDay(d, idx) {
  setChapterTag(`Chapter 2 · Day ${idx + 1}`);
  const S = STORY.school = { d, found: false, over: false, visited: new Set() };
  S.placeHer = (x, y) => {
    const m = addNpc('momna', x, y, { dir: 'down', use: null });
    const f = addNpc('momnaFriend', x + 16, y + 2, { dir: 'left', use: null });
    trackHer(m);
    look(x, y, [], { label: 'LOOK', r: 54, enabled: () => !S.found, after: null }).use = async () => {
      if (S.found) return; S.found = true; await foundHer(idx, m, f);
    };
  };
  S.visit = async k => {
    S.visited.add(k);
    if (d.where === null && !S.found && S.visited.size >= 2) {
      S.found = true; setObjective(null);
      await thought("She isn't here today.");
      await thought('Not by the bench. Not in the corridor. Not anywhere.');
      await thought('When she wasn\'t there, something felt missing from my day.');
      setObjective('Head home'); toast('The school feels quiet');
    }
  };
  S.gate = async () => {
    if (d.where === 'wait') { await waitAtGate(); return; }
    if (!S.found) { await thought("I haven't found her yet. I'll look a little longer."); return; }
    S.over = true;
  };
  await fade(1, 500);
  await dayCalendar(d);
  if (d.mood === 'quiet') setMood('quiet');
  await enterPlace('courtyard', 'gate');
  if (d.where === 'wait') {
    S.found = true;
    await thought("School ended hours ago for most people. Not for me.");
    await beginPlay('Wait by the gate');
  } else await beginPlay(d.where === null ? 'Find Momna' : 'Find Momna');
  await waitFor(() => S.over);
  await endPlay(); await fade(1, 700);
}

async function foundHer(idx, m, f) {
  setObjective(null); Music.duck(.5);
  await camTo(m.x, m.y - 6, 1.45, 1100); await wait(500);
  if (idx === 0) {
    await thought('There she is.');
    await thought('She was laughing at something her friend said. I just stood there.');
    await thought('I started going to school just to see her.');
  } else {
    await thought('The corridor. Of course.');
    await thought("She walked right past. She didn't notice me. That was enough.");
    await thought("Funny how one glimpse can fix a whole morning.");
  }
  camFollow(); Music.duck(1); STORY.school.found = true; setObjective('Head home — the gate'); toast('Found her');
}

async function waitAtGate() {
  const S = STORY.school; setObjective(null); playMode(false);
  await thought('Everyone was leaving. I stayed.');
  const kids = ['kid', 'kidG', 'friend2', 'kid', 'kidG'].map((k, i) => addNpc(k, 60 + i * 38, 190 + (i % 2) * 40, { dir: 'down', use: null, r: 0 }));
  let gone = 0;
  await holdToWait({ startMin: 13 * 60 + 30, hours: 2.5, seconds: 6, label: 'Waiting by the gate…', tod0: .5, tod1: .86, onProgress: k => {
    while (gone < kids.length && k > (gone + 1) / (kids.length + 1)) { const n = kids[gone++]; moveTo(n, 160, 410, 40).then(() => removeNpc(n)); }
  } });
  setMood('warm'); Music.duck(.5);
  const m = addNpc('momna', 150, 150, { dir: 'down', use: null }), f = addNpc('momnaFriend', 168, 150, { dir: 'down', use: null });
  await camTo(160, 270, 1.15, 1200);
  await Promise.all([moveTo(m, 150, 396, 26), moveTo(f, 168, 396, 26)]);
  await thought("There she was. For a few seconds.");
  await Promise.all([moveTo(m, 150, 420, 26), moveTo(f, 168, 420, 26)]);
  removeNpc(m); removeNpc(f); camFollow(); Music.duck(1);
  await thought('Two and a half hours. Ten seconds of her.');
  await thought("I told myself I wasn't really waiting. I was just... taking my time.");
  S.over = true;
}

async function ch2() {
  for (let i = 0; i < SCHOOL_DAYS.length; i++) {
    await schoolDay(SCHOOL_DAYS[i], i); setMood('normal'); G.rain = 0;
  }
  await showCalendar('OCTOBER', '31', 'The weeks kept passing', 1800);
  await cine(['Days turned into weeks.', 'And I kept looking.'], { cls: 'soft' });
}

/* =============================================================== CHAPTER 3 */
async function ch3() {
  setChapterTag("Chapter 3 · Finding her account");
  const c = STORY.c = { asked: false, done: false };
  await gotoScene('courtyard', { music: 'day', tod: .62, spawn: { x: 160, y: 396, dir: 'up' } });
  const A = G.scene.A; setFx('petal', 12);
  const fr = addNpc('friend1', 232, 298, { dir: 'left' });
  const og = addNpc('otherGirl', 252, 214, { dir: 'down' });
  await thought("Talking to her face to face? I couldn't. My words would just disappear.");
  fr.use = async () => {
    if (c.asked) { await say('friend1', 'Open it. Go on.'); return; }
    await say('yahya', "I can't just walk up to her and say it. I'd forget my own name.");
    await say('friend1', "Then don't. Find her account. Message first, face later.");
    const k = await choose('What do you say?', ['Okay. Can you help me?', "That's a terrible idea. Yes, let's do it."]);
    await say('yahya', k === 0 ? 'Okay. Can you help me?' : "That's a terrible idea. ...Let's do it.");
    await say('friend1', "There's a girl in her section. Give me a minute.");
    c.asked = true; setObjective("Find Momna's account"); toast('New mission: find her account');
    await camTo(244, 250, 1.3, 1000);
    await moveTo(fr, 240, 226, 34); fr.dir = 'right';
    await say('friend1', "Hey, do you know a Momna from your section? What's her Instagram?");
    await say('otherGirl', 'Momna? Hold on, let me check... Yes, I have it. Pink flower photo.');
    await say('friend1', 'Perfect. Thanks!');
    await moveTo(fr, 232, 298, 34); camFollow();
    await say('friend1', "Got it. Pink flower photo. Bio says 'books · tea · sunsets'. Check it yourself.");
    await openChapter3Phone(); c.done = true;
  };
  await beginPlay('Talk to your friend');
  await waitFor(() => c.done);
  await endPlay();
}

async function openChapter3Phone() {
  const cfg = CONFIG.social.chapter3;
  let ph = openPhone('4:12');
  const acc = await gramPick(ph, cfg, 'momna');
  ph.close(); await wait(400);
  await thought('This has to be her.');
  ph = openPhone('4:14');
  await gramProfile(ph, acc, { label: 'Follow', after: 'Requested' });
  ph.body.appendChild(el('div', 'gram-hint', 'Request sent. Waiting for a reply…'));
  await wait(3600);
  phoneNotify(ph, '🔕 Request removed.', 2600);
  await wait(900);
  const b = ph.foot.querySelector('button'); if (b) { b.className = 'pbtn alt'; b.textContent = 'Follow'; }
  await wait(2600); ph.close(); await wait(500);
  setDarkness(.55); setMood('dark'); G.rain = .55; Music.play('emotional'); SFX.heart();
  await wait(1600);
  await cine(['“I thought that was the answer.”'], { pos: 'low', cls: 'soft' });
  await cine(['“But I was wrong.”'], { pos: 'low', cls: 'big' });
}
