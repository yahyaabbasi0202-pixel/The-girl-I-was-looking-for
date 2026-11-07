/* ==========================================================================
   story2.js — Chapters 4-6
   4 The Wrong Momna · 5 The Long Wait · 6 Finally Finding Her
   ========================================================================== */
'use strict';

const stripQ = t => t.replace(/^["“]+|["”]+$/g, '');

/* =============================================================== CHAPTER 4 */
async function ch4() {
  setChapterTag('Chapter 4 · The wrong Momna');
  const c = STORY.c = { got: new Set(), solved: false, boy: false, done: false };
  await gotoScene('courtyard', { music: 'mystery', tod: .5, mood: 'dark', rain: .35, spawn: { x: 160, y: 396, dir: 'up' } });
  setDarkness(.25);
  const A = G.scene.A;
  const f1 = addNpc('friend1', 150, 330, { dir: 'down' });
  const f2 = addNpc('friend2', 88, 300, { dir: 'right' });
  const og = addNpc('otherGirl', 252, 214, { dir: 'down' });
  await thought("The next morning, I couldn't stop thinking about that 'Request removed'.");
  await moveTo(f1, 158, 372, 40);
  await say('friend1', 'Hey. Bad news. Actually... good news. I think?');
  await say('yahya', 'Which one is it?');
  await say('friend1', "That account wasn't hers. It was another girl with the same name.");
  SFX.heart(); shake(.4);
  await say('yahya', 'Another... what?');
  await say('friend1', "There are a few girls named Momina in this school. You followed the wrong one.");
  G.rain = 0; setDarkness(0); setMood('normal'); setFx('petal', 12);
  await thought("She hadn't said no. She had never even seen it.");
  await thought('So who exactly was I looking for?');
  await moveTo(f1, 150, 330, 30);

  const clueLines = [
    [f1, 0, 'friend1', 'Momina Tariq? She goes home the other way. She has never even been in our courtyard.'],
    [f2, 1, 'friend2', "The other Momina is two classes below. She's still in the junior section."],
    [og, 2, 'otherGirl', 'The girl you saw? She always laughs with her friend. That narrows it down, right?']
  ];
  clueLines.forEach(([npc, i, who, line]) => {
    npc.use = async () => {
      if (c.got.has(i)) { await say(who, 'Like I said — ' + stripQ(CONFIG.identityClues[i].text).toLowerCase()); return; }
      await say(who, line); c.got.add(i); SFX.chime();
      toast(`Clue collected (${c.got.size}/3)`); setObjective(`Collect clues from friends (${c.got.size}/3)`);
      if (c.got.size === 3) await solveIdentity();
    };
  });
  async function solveIdentity() {
    await wait(400); await thought('Three girls, one name. Time to work it out.');
    await identityPuzzle();
    c.solved = true; await thought("So she's a different Momina entirely.");
    await say('friend1', "Wait. Her dad... I've seen him. He picks up a boy from class 9A every day.");
    await say('yahya', 'A boy from 9A?');
    await say('friend1', 'Grey car. Always waiting at the gate. Ask that boy.');
    await clueBoard([
      { t: 'Her father drives a grey car.' },
      { t: 'Every afternoon he waits at the gate for a boy from class 9A.' },
      { t: 'The boy calls him “uncle”.' },
      { t: "Her father's name: ?", empty: true }
    ], 'The clue board', 'Everything points to one boy.');
    await setTod(.82, 1500); setMood('warm');
    const boy = addNpc('classBoy', 200, 372, { dir: 'left', use: boyTalk });
    setObjective('Ask the boy from 9A'); toast('New clue: the boy at the gate');
  }
  async function boyTalk() {
    await say('classBoy', "Hi? You need something? My uncle's about to come.");
    let ok = false;
    while (!ok) {
      const k = await choose('What do you ask him?', ['“What\'s the name of the uncle who picks you up?”', '“Do you know a girl named Momna?”']);
      if (k === 1) { await say('yahya', 'Do you know a girl named Momna?'); await say('classBoy', 'Momna? There are, like, five. Be specific!'); }
      else ok = true;
    }
    await say('yahya', "What's the name of the uncle who picks you up?");
    await say('classBoy', 'Iftekhar.');
    await wait(1500);
    Music.duck(.2); await fade(1, 1800);
    c.boy = true;
  }
  await beginPlay('Collect clues from friends (0/3)');
  await waitFor(() => c.boy);
  await endPlay();
  await nameReveal('Iftekhar', 'Momina Iftekhar.');
  Music.duck(1); Music.play('hopeful');
  await wait(600);
  await cine(['“Maybe this wasn\'t the end.”'], { cls: 'big', pause: 1200 });
  await wait(900);
}

/* =============================================================== CHAPTER 5 */
async function ch5() {
  setChapterTag('Chapter 5 · The long wait');
  const c = STORY.c = { tries: 0, done: false };
  await gotoScene('courtyard', { music: 'emotional', tod: .35, spawn: { x: 160, y: 396, dir: 'up' } });
  const A = G.scene.A; setFx('petal', 12);
  const m = addNpc('momna', 70, 296, { dir: 'right' }), f = addNpc('momnaFriend', 86, 300, { dir: 'left' });
  ambient('kid', 240, 250, 'left'); ambient('kidG', 252, 262, 'right');
  await thought('Now I knew her name. Momina Iftekhar.');
  await thought("But knowing her name and saying it out loud were two very different things.");
  const lines = [
    ['Just walk up. Say salaam. How hard can it be?', 'My feet had other plans.'],
    ["Okay. This time. Really.", "My heart was louder than my courage."],
    ['Third time. Third time lucky.', 'And then the bell rang. Of course it did.']
  ];
  addTrigger({ x: 58, y: 268, w: 110, h: 64, once: false, fn: async () => {
    if (c.tries >= 3) return;
    const P = G.player, L = lines[c.tries]; c.tries++;
    playMode(false); SFX.heart(); await thought(L[0]); SFX.heart(); await thought(L[1]);
    await moveTo(P, 170, 346, 40);
    if (c.tries >= 3) {
      await Promise.all([moveTo(m, 120, 130, 22), moveTo(f, 134, 132, 22)]);
      removeNpc(m); removeNpc(f); c.done = true;
    } else { setObjective(`Say something to her (${c.tries}/3 tries)`); playMode(true); }
  } });
  await beginPlay('Say something to her');
  await waitFor(() => c.done);
  await endPlay();
  await thought('So I waited. Again.');
  await fade(1, 800);
  await timelineGame([
    { head: 'NOVEMBER', big: '12', sub: 'Class 10', cap: 'The weeks started to blur into each other.', tod: .5 },
    { head: 'DECEMBER', big: '20', sub: 'Winter', cap: 'Cold mornings. The same bus. The same hope.', tod: .86 },
    { head: 'JANUARY', big: '09', sub: 'A new year', cap: 'A new year, and the same name in my head.', tod: .12 },
    { head: 'FEBRUARY', big: '14', sub: '', cap: 'I saw her less and less.', tod: .7 },
    { head: 'MARCH', big: '03', sub: 'Exams', cap: 'Books. Late nights. Silence.', tod: .96 },
    { head: 'APRIL', big: '22', sub: '', cap: 'I grew a little older. A little braver. Not enough.', tod: .4 },
    { head: 'MAY', big: '30', sub: 'The last paper', cap: 'The last paper. The last bell.', tod: .82 },
    { head: 'JUNE', big: '15', sub: 'Results', cap: 'Results day.', tod: .55 }
  ], { title: 'The long wait', sub: 'Tap to turn the page. Let the months pass.' });
  // results day
  G.player.scale = 1.07;
  const c2 = STORY.c = { out: false };
  await gotoScene('courtyard', { music: 'emotional', tod: .55, mood: 'warm', spawn: { x: 160, y: 300, dir: 'down' } });
  const g1 = addNpc('friend1', 140, 330, { dir: 'right', use: async () => {
    await say('friend1', 'We did it! Class 10, done. Can you believe it?');
    await say('yahya', 'I passed.');
    await say('friend1', "Of course you passed. Now... any plan for a certain someone?");
    await say('yahya', "Don't start.");
  } });
  const g2 = addNpc('friend2', 188, 336, { dir: 'left', use: async () => {
    await say('friend2', "Another year gone. Doesn't it feel strange?");
  } });
  const A2 = G.scene.A;
  look(A2.benchL.x, A2.benchL.y - 6, ['Her bench. Under the blossoms.', "She's still at this school. And I almost never see her now."], { enabled: () => true });
  door(A2.gate.x, A2.gate.y, 'LEAVE', async () => { c2.out = true; });
  await beginPlay('Walk out of school');
  await waitFor(() => c2.out);
  await endPlay(); await fade(1, 1200);
  await cine(['“I passed 10th grade.”'], { cls: 'big' });
  await cine(["“And suddenly, the girl I had spent so long trying to find wasn't part of my everyday life anymore.”"], { cls: 'soft' });
  await showPhoto('memory2');
}

/* =============================================================== CHAPTER 6 */
async function ch6() {
  setChapterTag('Chapter 6 · Finally finding her');
  const c = STORY.c = { done: false };
  await gotoScene('room', { music: 'mystery', spawn: { x: 120, y: 132, dir: 'up' } });
  const A = G.scene.A; G.player.scale = 1.07;
  await narr('Months later.');
  await thought("I'd spent a long time without a single sign of her.");
  await thought('Then I asked my friend to search again.');
  look(A.window.x, A.window.y, ['The same moon over a different year.'], {});
  look(A.shelf.x, A.shelf.y, ['Old school books. A few notes from a hundred bus rides.']);
  look(A.bed.x, A.bed.y, ["I couldn't sleep anyway."]);
  addInteract({ x: A.phone.x, y: A.phone.y, r: 28, kind: 'inspect', label: 'PHONE', use: async () => { await ch6Phone(); c.done = true; } });
  await beginPlay("Check your phone");
  await waitFor(() => c.done);
  await endPlay();
  await wait(400);
  await thought('After all those months, I finally knew I was not alone in this.');
  await thought("She was right, too. It wasn't the right way. But now I knew — and I could be patient.");
  Music.play('hopeful'); SFX.sparkle();
  await wait(1800);
}

async function ch6Phone() {
  const cfg = CONFIG.social.chapter6;
  let ph = openPhone('10:48');
  chatOpen(ph, { name: "Yahya's Friend", color: '#4fb4a0' });
  await chatRun(ph, [
    ['sys', 'Yesterday'],
    ['her', "I've been searching. Her dad's name is Iftekhar, right? Her surname starts with 'I'."],
    ['pick', [{ t: 'Yes. Please send me what you found.', good: true }]],
    ['her', "Found a few accounts. Don't get your hopes up too fast. Go check."]
  ]);
  await wait(600);
  const acc = await gramPick(ph, cfg, 'momina');
  await gramProfile(ph, acc, { suspense: true, label: 'Message', after: 'Opening chat…', reveal: 'A lavender scarf. A half smile. It looks like her.' });
  await wait(900);
  chatOpen(ph, { name: acc.name, color: acc.color, status: 'last seen recently' });
  await chatRun(ph, [
    ['pick', [
      { t: 'Assalamualaikum. I\'m sorry to message you out of nowhere. This is Yahya, from school.', good: true },
      { t: 'Hey!! Finally found you 😄 why were you so hard to find?', hint: 'A little too casual. She has no idea who you are.' }
    ]],
    ['her', 'Walaikum assalam. Do I know you?', 2200],
    ['pick', [
      { t: 'We go to the same school. I\'ve seen you around. I won\'t take much of your time.', good: true },
      { t: 'You don\'t know me, but I know you. I\'ve been looking for you for months.', hint: 'That may sound unsettling. Try something calmer.' }
    ]],
    ['her', "I'm sorry, but I'm not really interested in talking to boys I don't know.", 2400],
    ['pick', [
      { t: 'Please, just give me one chance. I won\'t stop asking.', hint: "Pushing doesn't show respect." },
      { t: 'I understand, and I respect that. I only wanted to be honest with you. I\'ve liked you for a long time, and I didn\'t want to hide it.', good: true, send: 'I understand, and I respect that. I only wanted to be honest with you. I have liked you for a long time, and I did not want to hide it.' }
    ]],
    ['her', "That's... a lot. I don't know what to say.", 2600],
    ['pick', [
      { t: 'You don\'t have to say anything you\'re not comfortable with. If it\'s meant to be, I want it done the right way.', good: true },
      { t: 'Just tell me if you like me too.', hint: 'Give her room. She asked for time.' }
    ]],
    ['her', "Alright. When the right time comes, we'll get married.", 2800],
    ['her', "But we shouldn't talk because it's Haram.", 2400],
    ['pick', [
      { t: "You're right. Thank you for being honest with me. I'll respect that.", good: true },
      { t: 'But can\'t we talk just a little?', hint: 'She just told you what matters to her.' }
    ]],
    ['her', 'Jazakallah khair, Yahya. Take care.', 2000]
  ]);
  await wait(1200);
  ph.close(); await wait(500);
}
