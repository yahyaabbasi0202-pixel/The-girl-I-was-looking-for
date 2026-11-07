/* ==========================================================================
   story3.js — Chapters 7-10
   7 Getting to Know Each Other · 8 The Misunderstanding
   9 Families · 10 Momna's Friend
   (Momna is playable in Chapters 8 and 9 — the first time we see the story
    from her side. Dialogue here is fictionalised: edit freely.)
   ========================================================================== */
'use strict';

/* helper: play as Momna for a while */
function playAs(key) { G.player.key = key; }
/* small chat peek: opens her chat, runs a short script, closes it */
async function peekChat(time, status, script, after) {
  const ph = openPhone(time);
  chatOpen(ph, { name: N.momnaFull, color: '#c3a6ff', status });
  await chatRun(ph, script);
  await wait(after || 900);
  ph.close(); await wait(450);
}

/* =============================================================== CHAPTER 7 */
async function ch7() {
  setChapterTag('Chapter 7 · Getting to know each other');
  const c = STORY.c = { done: false };
  await showCalendar('OCTOBER', '09', 'A few weeks later', 1900);
  await gotoScene('room', { music: 'hopeful', spawn: { x: 120, y: 132, dir: 'up' } });
  const A = G.scene.A; setFx('dust', 16);
  await narr('Weeks passed. I kept my word. I did not write to her.');
  await thought('No messages. Only the quiet knowledge that, somewhere, she knew.');
  look(A.window.x, A.window.y, ['A clear sky tonight. Even the stars seem patient.']);
  look(A.shelf.x, A.shelf.y, ['A shelf of books I should be studying from.', 'Instead, one eye is always on my phone.']);
  look(A.bed.x, A.bed.y, ['Tonight, for once, I am not too anxious to sleep.']);
  addInteract({ x: A.phone.x, y: A.phone.y, r: 28, kind: 'inspect', label: 'PHONE', use: async () => { await ch7Phone(); c.done = true; } });
  await wait(700); SFX.chime(); toast('📱 Your phone buzzed');
  await beginPlay('Check your phone');
  await waitFor(() => c.done);
  await endPlay();
  await wait(300);
  await thought('She told me before anyone else could.');
  await thought("I didn't ask who he was. It wasn't my place. And it wasn't what mattered.");
  await thought('What mattered was this: she had chosen to tell me the truth.');
  SFX.sparkle(); await wait(1500);
}

async function ch7Phone() {
  const ph = openPhone('9:12');
  chatOpen(ph, { name: N.momnaFull, color: '#c3a6ff', status: 'active now' });
  await chatRun(ph, [
    ['sys', 'Tonight'],
    ['her', 'Assalamualaikum.', 1400],
    ['pick', [
      { t: 'Walaikum assalam. Is everything alright?', good: true },
      { t: 'Finally! I thought you had forgotten me 😅', hint: 'She wrote first. Be patient and gentle.' }
    ]],
    ['her', "Everything's fine. I have been thinking about what I said.", 2400],
    ['her', "I still believe in doing things the right way. But a few honest words, kept respectful, can't hurt.", 3200],
    ['pick', [
      { t: 'Thank you. I promise I will keep it respectful.', good: true },
      { t: 'Great! So when can we meet?', hint: 'Too fast. Let her set the pace.' }
    ]],
    ['her', 'Then... tell me something I do not know about you.', 2400],
    ['me', "Honestly? I'm much braver in messages than in person. At school I forget how to speak."],
    ['her', "That's honest. I like honest.", 1800],
    ['sys', 'A few weeks, a few words at a time']
  ]);
  /* three gentle rounds: pick a question, hear her answer */
  for (const r of CONFIG.getToKnow) {
    const o = await chatChoice(ph, r.options.map(x => Object.assign({ good: true }, x)));
    await chatMe(ph, o.t);
    await chatHer(ph, o.her, 2400);
  }
  await chatRun(ph, [
    ['sys', 'One evening'],
    ['her', "There's something I should tell you. I would rather you hear it from me.", 2600],
    ['her', 'Another boy at school likes me.', 2000],
    ['her', "I've told him no. More than once. I'm not interested in him at all.", 2800],
    ['her', "He just... doesn't accept it.", 2000],
    ['pick', [
      { t: 'Thank you for telling me. Are you okay?', good: true },
      { t: 'Who is he? What is his name?', hint: 'She trusted you with this. Do not pry.' },
      { t: 'Should I talk to him?', hint: 'That could make things worse. Let her lead.' }
    ]],
    ['her', "I'm okay. I just wanted you to hear it from me. He isn't a bad person. He can't accept the answer, that's all.", 3600],
    ['pick', [
      { t: 'I believe you. If staying quiet keeps things calm, I will. Just tell me how I can help.', good: true },
      { t: 'You should block him.', hint: 'Do not tell her what to do. Listen first.' }
    ]],
    ['her', 'Thank you, Yahya. That means more than you know.', 2400],
    ['her', 'Goodnight. Take care.', 1500]
  ]);
  await wait(1000);
  ph.close(); await wait(500);
}

/* =============================================================== CHAPTER 8 */
async function ch8() {
  setChapterTag('Chapter 8 · The misunderstanding');
  const c = STORY.c = { bro: false, mom: false, done: false, parents: false };

  /* --- A. a cutaway: what I only learned later --- */
  playAs('momna');
  await gotoScene('courtyard', { music: 'mystery', tod: .84, mood: 'dream', spawn: { x: 160, y: 396, dir: 'up' }, hidePlayer: true });
  showHUD(false); playMode(false); setFx('leaf', 12);
  const boy = addNpc('otherBoy', 150, 316, { dir: 'left', use: null, r: 0 });
  const bro = addNpc('brother', 118, 318, { dir: 'right', use: null, r: 0 });
  await narr("I wasn't there. I only learned about it later, in pieces.");
  await Promise.all([bars(true), camTo(134, 292, 1.75, 2000)]);
  await wait(500);
  await say('otherBoy', 'Can I tell you something? About your sister.');
  await say('brother', '...Go on.');
  emote(boy, '…', 2.2); await wait(1100);
  await say('otherBoy', 'There is a boy who talks to your sister.');
  SFX.heart(); shake(.7); G.rain = .85; setDarkness(.38); setMood('tense'); Music.play('emotional'); lightning();
  await wait(1200);
  await say('brother', '...What did you say?');
  await wait(600);
  await cine(["He wasn't a monster.\nHe was a boy who couldn't hear the word no.", 'But a sentence, once said,\ncannot be unsaid.'], { pos: 'low', cls: 'soft' });
  camFollow(); await bars(false);

  /* --- B. play as Momna: a tense house --- */
  await gotoScene('momnaHome', { music: 'emotional', mood: 'tense', spawn: { x: 130, y: 122, dir: 'up' } });
  G.darkTarget = 0; G.dark = 0; showHUD(true);
  const A = G.scene.A;
  const check = () => { if (c.bro && c.mom && !c.done) c.done = true; else if (!c.done) setObjective(c.bro ? 'Talk to your mother' : c.mom ? 'Talk to your brother' : 'Talk to your family'); };
  await narr('Meanwhile, at her house, the evening had gone very quiet.');
  const brother = addNpc('brother', A.brother.x, A.brother.y, { dir: 'left', use: async () => {
    if (c.bro) { await say('brother', "I'll talk to you again soon. Right now I just need to think."); return; }
    await say('brother', 'Momna. Sit with me for a minute.');
    await say('brother', 'Someone told me a boy has been talking to you.');
    await say('momna*', "So that's how it reached him.");
    let ok = false;
    while (!ok) {
      const k = await choose('What do you tell him?', ['The truth. Calmly, and all of it.', 'Nothing. Maybe it will pass.'], { who: 'momna' });
      if (k === 0) ok = true; else await say('momna*', 'Silence would only make the story louder. Someone else would tell it for me.');
    }
    await say('momna', "It isn't what it sounds like. He's respectful. He said he wants to do things the right way.");
    await say('momna', 'We spoke. Only a little. I should have told you myself.');
    await say('brother', '...I need time to think about this.');
    c.bro = true; check();
  } });
  const mother = addNpc('mother2', A.mother.x, A.mother.y, { dir: 'right', use: async () => {
    if (c.mom) { await say('mother2', 'Go and rest, beta. Things will look different tomorrow.'); return; }
    await say('mother2', 'Your brother is upset. Your father is quiet.');
    await say('mother2', 'Nobody is shouting. Somehow that is worse.');
    await say('mother2', "Whatever happened, we'll sort it out. Calmly. Together.");
    await say('momna*', 'I wanted so badly to explain. And I was afraid nobody would listen.');
    c.mom = true; check();
  } });
  look(126, 92, ['Rain on the glass. It has been falling since this afternoon.', 'The house is quiet. The quiet is very loud.'], { who: 'momna' });
  await beginPlay('Talk to your family');
  await waitFor(() => c.done);
  await endPlay();
  await say('momna*', 'I put my phone away. I needed the silence, and I needed things to settle.');
  await say('momna*', 'For two days, I stayed offline.');

  /* --- C. play as Yahya: two days of silence --- */
  await fade(1, 1000); playAs('yahya');
  await showCalendar('OCTOBER', '17', 'Day one of silence', 1800);
  await gotoScene('room', { music: 'emotional', mood: 'tense', rainy: true, spawn: { x: 120, y: 132, dir: 'up' } });
  showHUD(true); setDarkness(.15);
  await thought('She had stopped replying.');
  await thought('Then a friend told me what happened at school: someone had gone to her brother.');
  await thought("What if I've made things worse for her?");
  /* the time-passing mechanic again: hold to let the night go by */
  showHUD(false); playMode(false);
  const waitDay = (label, startMin) => holdToWait({ startMin, hours: 8, seconds: 4.5, label, onProgress: k => { G.darkTarget = .15 + k * .2; } });
  await waitDay('Day 1 · no reply', 22 * 60);
  await peekChat('6:04', 'last seen 2 days ago', [['sys', 'Two days ago'], ['her', 'Goodnight. Take care.', 800], ['sys', 'No new messages']]);
  await showCalendar('OCTOBER', '18', 'Day two of silence', 1700);
  await waitDay('Day 2 · still nothing', 22 * 60);
  await wait(500);
  setMood('normal'); Music.play('hopeful'); SFX.chime();
  await peekChat('7:41', 'online', [
    ['sys', 'Two days of silence'], ['pause', 900],
    ['her', 'Assalamualaikum. I am sorry I disappeared.', 2400],
    ['her', 'Things at home are alright now. Please do not worry.', 2600],
    ['pick', [
      { t: 'Alhamdulillah. I was so worried about you.', good: true },
      { t: 'What did your brother say about me?', hint: 'First make sure she is okay.' }
    ]],
    ['her', 'He was angry at first. But he listened. I told him the truth.', 3000],
    ['me', 'That is exactly what I needed to hear. Thank you for telling me.'],
    ['her', 'Take care, Yahya.', 1400]
  ], 1200);
  await thought('She had told the truth at her house.');
  await thought('Now it was my turn.');

  /* --- D. tell my own parents everything --- */
  await gotoScene('yahyaHome', { music: 'emotional', spawn: { x: 30, y: 136, dir: 'right' } });
  showHUD(true); const H = G.scene.A;
  const tell = async () => {
    if (c.parents) return;
    await say('yahya', 'Ammi. Abbu. I need to tell you something. All of it.');
    await say('mother1', 'Sit down, beta. We are listening.');
    await cine(['I told them everything.', 'The bus. The courtyard.\nThe wrong account. The long wait.', 'Her name. Her message.\nHer "when the right time comes."'], { cls: 'soft' });
    await say('father', 'You told us yourself. That matters more than you know.');
    await say('mother1', "Did you do anything you're ashamed of?");
    await say('yahya', 'No, Ammi. Never. I only wanted to do it the right way.');
    await say('mother1', "Then there is nothing to be afraid of.");
    await say('father', 'Let your mother speak to her mother. Families should speak to families.');
    c.parents = true;
  };
  addNpc('mother1', 104, 110, { dir: 'right', use: tell });
  addNpc('father', 128, 108, { dir: 'left', use: tell });
  look(H.tv.x, H.tv.y, ['The TV is on. Nobody is watching it.']);
  await beginPlay('Tell your parents');
  await waitFor(() => c.parents);
  await endPlay();
  await thought('For the first time in two days, I could breathe.');
  Music.duck(1); await wait(900);
}

/* =============================================================== CHAPTER 9 */
async function ch9() {
  setChapterTag('Chapter 9 · Families');
  const c = STORY.c = { call: false, bro: false, mom: false, done: false };
  await showCalendar('OCTOBER', '20', 'The next evening', 1800);
  await gotoScene('yahyaHome', { music: 'hopeful', mood: 'warm', spawn: { x: 30, y: 136, dir: 'right' } });
  showHUD(true);
  const mom = addNpc('mother1', 70, 112, { dir: 'down', use: null, r: 0 });
  emote(mom, '☎', 3);
  await narr('That evening, my mother picked up the phone.');
  await thought("I wasn't meant to listen. I listened.");
  addInteract({ x: 72, y: 112, r: 34, kind: 'inspect', label: 'LISTEN', use: async () => { await familyCall(); c.call = true; } });
  await beginPlay('Listen from the doorway');
  await waitFor(() => c.call);
  await endPlay();
  await say('mother1', "It's done, beta. Now we let them think.");
  await say('yahya', 'Thank you, Ammi.');
  await say('mother1', 'Thank your honesty. It did the talking.');

  /* --- the other house, calm again --- */
  playAs('momna');
  await fade(1, 900);
  await showCalendar('OCTOBER', '24', 'A few days later', 1700);
  await gotoScene('momnaHome', { calm: true, music: 'hopeful', mood: 'warm', spawn: { x: 130, y: 122, dir: 'up' } });
  showHUD(true); const A = G.scene.A;
  const check = () => { if (c.bro && c.mom) c.done = true; else setObjective(c.bro ? 'Talk to your mother' : 'Talk to your brother'); };
  addNpc('brother', A.brother.x, A.brother.y, { dir: 'left', use: async () => {
    if (c.bro) { await say('brother', 'Tea is ready. Come and sit.'); return; }
    await say('brother', "I spoke with Ammi. I heard the story from the wrong person first. I'm sorry I was so sharp.");
    await say('momna', "It's alright. I should have told you myself.");
    await say('brother', "From now on, I'd rather hear things from you.");
    await say('momna*', 'The rain had stopped. I hadn\'t noticed when.');
    c.bro = true; check();
  } });
  addNpc('mother2', A.mother.x, A.mother.y, { dir: 'right', use: async () => {
    if (c.mom) { await say('mother2', 'Drink your tea before it goes cold.'); return; }
    await say('mother2', "I spoke to his mother. She was honest with me. Plainly, without excuses.");
    await say('mother2', 'Sometimes that is all a family needs to hear.');
    await say('momna', 'Thank you, Ammi.');
    c.mom = true; check();
  } });
  look(126, 92, ['The window is clear. Stars again, where the rain had been.'], { who: 'momna' });
  await beginPlay('Talk to your family');
  await waitFor(() => c.done);
  await endPlay();
  await fade(1, 1300); playAs('yahya');
  await cine(['“Sometimes the biggest problems aren\'t caused by the truth...\nthey\'re caused by people misunderstanding it.”'], { cls: 'soft', hold: 4800 });
}

/* The two mothers on the phone — the families scene */
async function familyCall() {
  const call = familyCallShow();
  const m1 = (t, o) => { call.talk(1); return say('mother1', t, o); };
  const m2 = t => { call.talk(2); return say('mother2', t); };
  await m1("Assalamualaikum. Forgive me for calling. I am Yahya's mother.");
  await m2('Walaikum assalam. I think I know why you are calling.');
  await m1('My son told us everything last night. I wanted you to hear it from us, before anyone else.');
  await m2('We were told a very different version.');
  await m1('I can believe that. A story changes a lot on its way from one mouth to another.');
  /* the player's choice: how does his mother speak? */
  call.talk(0);
  let ok = false;
  while (!ok) {
    const k = await choose("What does Yahya's mother say?", [
      'He is not the boy you were told about. He is respectful, and he told us the whole truth.',
      'It was a small thing. Perhaps we should just forget it.'
    ], { who: 'mother1' });
    if (k === 0) ok = true; else await say('mother1', 'No. A misunderstanding should be cleared, not ignored.');
  }
  await m1('He is not the boy you were told about. He has never disrespected your daughter, or your family.');
  await m2('My daughter said the same. That he was polite, and kept his limits.');
  await m2('Thank you for calling, behen. That was not easy.');
  await m1('It was not easy to listen, either.');
  await m2('Let us give everyone a little time. Let things settle.');
  call.talk(0); await wait(500); call.close(); await wait(500);
}

/* ============================================================== CHAPTER 10 */
async function ch10() {
  setChapterTag("Chapter 10 · Momna's friend");
  const c = STORY.c = { seen: new Set(), friend: null, met: false };
  await gotoScene('courtyard', { music: 'hopeful', tod: .8, mood: 'warm', spawn: { x: 160, y: 396, dir: 'up' } });
  const A = G.scene.A; setFx('petal', 18);
  ambient('kid', 70, 252, 'right'); ambient('kidG', 56, 262, 'left');
  await narr('There was one more person in this story.');
  await thought('I had barely noticed her at first. Always a step behind Momna. Always smiling.');
  /* three places where she was there all along */
  const spots = [
    { id: 'door', x: A.door.x, y: A.door.y + 14, lines: ['The morning I first noticed Momna.', 'Someone was walking beside her. Laughing. Shielding her from the whole loud world.'] },
    { id: 'flag', x: A.flag.x, y: A.flag.y + 8, lines: ["The courtyard, on the days I came 'just to see her'.", "Two girls, always together. One of them always noticed more than she said."] },
    { id: 'bench', x: A.benchL.x + 4, y: A.benchL.y - 6, lines: ['The bench under the blossoms.', 'Two school bags. Always two.'] }
  ];
  spots.forEach(s => {
    const L = addLight({ x: s.x, y: s.y - 10, r: 36, c: '255,170,225', a: .55 });
    const it = addInteract({ x: s.x, y: s.y, r: 26, kind: 'inspect', label: 'REMEMBER', use: async () => {
      removeInteract(it); G.extraLights.splice(G.extraLights.indexOf(L), 1);
      for (const t of s.lines) await thought(t);
      c.seen.add(s.id); SFX.chime();
      if (c.seen.size >= 3) { setObjective(null); await friendArrives(); }
      else setObjective(`Remember where she was (${c.seen.size}/3)`);
    } });
  });
  async function friendArrives() {
    await thought('She had been in every memory. I just never looked at her.');
    const f = c.friend = addNpc('momnaFriend', A.door.x, A.door.y + 12, { dir: 'down', use: talk });
    await moveTo(f, 232, 306, 30); f.dir = 'left';
    emote(f, '!', 1.8); toast("Momna's friend is here");
    setObjective("Talk to Momna's friend");
  }
  async function talk() {
    if (c.met) { await say('momnaFriend', 'Go on. The night is clear.'); return; }
    await say('momnaFriend', "Yahya, right? I've wanted to talk to you for a while.");
    await say('yahya', 'You know who I am?');
    await say('momnaFriend', "Momna doesn't say much. But she tells me everything.");
    await say('momnaFriend', "I've watched all of this: the wrong account, the long wait, the misunderstanding. Many people would have walked away.");
    await say('momnaFriend', "You didn't hide. You told the truth when it was hard. That counts for a lot.");
    const k = await choose('What do you say?', ['Thank you. For being there for both of us.', 'Did she say anything about me?'], { who: 'yahya' });
    if (k === 1) { await say('yahya', 'Did she say anything about me?'); await say('momnaFriend', 'Ha. Patience. Ask her yourself. Properly.'); }
    else await say('yahya', 'Thank you. For being there for both of us.');
    await say('momnaFriend', "There's something I should show you. It isn't mine to tell. But you should know.");
    /* the flashback: what she said to Momna */
    Music.duck(.5);
    const v = vignetteShow('bench');
    await say('momna', 'What if this is too much? Everything got so complicated.', { mood: 'sad' });
    await say('momnaFriend', 'Momna. Look at what he did. He told the truth when hiding would have been easier.');
    await say('momnaFriend', "Don't lose Yahya. He's a good person.", { mood: 'happy' });
    v.close(); Music.duck(1); await wait(600);
    await say('yahya', 'She said that?');
    await say('momnaFriend', 'She did. And then she smiled at the ground for ten minutes.', { mood: 'happy' });
    await say('momnaFriend', 'Go on. Walk. She will meet you.');
    c.met = true;
  }
  await beginPlay('Remember where she was (0/3)');
  await waitFor(() => c.met);
  await endPlay(); await wait(500);
  /* mini-game 6: connect the memories → unlock the final chapter */
  await fade(1, 900);
  await starUnlock();
}
