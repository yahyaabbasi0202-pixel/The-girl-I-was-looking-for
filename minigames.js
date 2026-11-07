/* ==========================================================================
   minigames.js — overlay helpers, the fictional "Gramly" app and the chat UI.
   Everything here is 100% local. No real social network is ever contacted.
   ========================================================================== */
'use strict';

/* ------------------------------------------------------------------ overlay */
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}
function overlayShow(node, o) {
  o = o || {};
  const ov = $('overlay');
  ov.innerHTML = '';
  ov.className = (o.clear ? 'clear ' : '') + (o.dlg ? 'has-dlg' : '');
  ov.appendChild(node);
  $('app').classList.add('ov');
  G.overlayOpen = true;
  return node;
}
function overlayHide() {
  const ov = $('overlay');
  ov.className = 'hidden';      // reset synchronously: a deferred reset could hide an overlay shown right after
  ov.innerHTML = '';
  $('app').classList.remove('ov');
  G.overlayOpen = false;
}
/* a "tap to continue" button inside an overlay container */
function tapButton(parent, label, cls) {
  return new Promise(res => {
    const b = el('button', cls || 'pbtn go', label);
    b.onclick = () => { SFX.click(); b.disabled = true; res(); };
    parent.appendChild(b);
  });
}

/* -------------------------------------------------------------------- phone */
function openPhone(time) {
  const root = el('div', 'phone',
    `<div class="phone-top"><span>${time || '9:41'}</span><span>●●● ▮</span></div>
     <div class="phone-body"></div><div class="phone-foot"></div>`);
  overlayShow(root);
  SFX.sparkle();
  return {
    root, top: root.querySelector('.phone-top'), body: root.querySelector('.phone-body'), foot: root.querySelector('.phone-foot'),
    close() { overlayHide(); }
  };
}
function phoneNotify(ph, text, ms) {
  const n = el('div', 'notif', text);
  ph.root.appendChild(n); SFX.chime();
  return wait(ms || 2600).then(() => { n.style.transition = 'opacity .4s'; n.style.opacity = 0; return wait(400); }).then(() => n.remove());
}

/* ------------------------------------------------------------ Gramly (fake) */
function avatarHTML(acc, big) {
  if (acc.photo && typeof hasImg === 'function' && hasImg(acc.photo))
    return `<div class="avatar${big ? ' lg' : ''}" style="background:#2a2250 url('${CONFIG.images[acc.photo]}') center/cover no-repeat"></div>`;
  const ini = (acc.name || '?').replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase() || '?';
  return `<div class="avatar${big ? ' lg' : ''}${acc.flower ? ' flower' : ''}" style="background:linear-gradient(135deg,${acc.color},${shade(acc.color, -.35)})">${ini}</div>`;
}

/* Search screen. Resolves with the account the player chose correctly. */
function gramPick(ph, cfg, query) {
  return new Promise(res => {
    ph.foot.innerHTML = '';
    ph.body.innerHTML = '';
    ph.body.appendChild(el('div', 'gram-title', CONFIG.social.appName));
    const bar = el('div', 'gram-search', '<b>🔍</b><span class="q"></span><span class="caret"></span>');
    ph.body.appendChild(bar);
    ph.body.appendChild(el('div', 'gram-hint', cfg.hint));
    const list = el('div', null); list.style.cssText = 'display:flex;flex-direction:column;gap:8px';
    ph.body.appendChild(list);
    const msg = el('div', 'gram-hint', ''); msg.style.display = 'none'; msg.style.borderLeftColor = '#ff6f8f';
    ph.body.appendChild(msg);

    const q = bar.querySelector('.q'); let i = 0;
    const typer = setInterval(() => {
      q.textContent = query.slice(0, ++i); SFX.blip();
      if (i >= query.length) { clearInterval(typer); showResults(); }
    }, 120);

    let wrong = 0;
    function showResults() {
      cfg.results.forEach((acc, k) => {
        setTimeout(() => {
          const b = el('button', 'acct' + (acc.checked ? ' checked' : ''),
            `${avatarHTML(Object.assign({}, acc, { photo: null }))}<div class="meta"><div class="nm">${acc.name}</div><div class="hd">@${acc.handle}</div><div class="bi">${acc.bio}</div></div>`);
          b.style.animation = 'pop .3s ease-out';
          b.onclick = () => {
            if (acc.target) { SFX.chime(); res(acc); return; }
            SFX.error(); wrong++;
            b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
            msg.style.display = 'block';
            msg.textContent = acc.checked ? 'You already checked this one. It isn\'t her.'
              : (wrong > 1 ? 'Read the clue again — the details should match.' : 'Hmm. That doesn\'t quite match the clue.');
          };
          list.appendChild(b); SFX.click();
        }, k * 260);
      });
    }
  });
}

/* Profile screen with one button. Resolves when the button is pressed.
   o.suspense: blurred loading reveal first. o.label: button text. o.after: text once pressed */
async function gramProfile(ph, acc, o) {
  o = o || {};
  ph.foot.innerHTML = ''; ph.body.innerHTML = '';
  const prof = el('div', 'prof',
    `${avatarHTML(acc, true).replace('avatar lg', 'avatar lg' + (o.suspense ? ' blur' : ''))}
     <div class="nm">${o.suspense ? '<span class="shimmer" style="display:inline-block;width:120px;height:16px;border-radius:6px"></span>' : acc.name}</div>
     <div class="hd" style="font-size:12px;color:#9d96c4">@${acc.handle}</div>
     <div class="stats"><div><b>${acc.posts}</b>posts</div><div><b>${acc.followers}</b>followers</div><div><b>${Math.max(12, acc.posts * 3)}</b>following</div></div>
     <div class="bi">${o.suspense ? '' : acc.bio}</div>
     <div class="grid">${'<i></i>'.repeat(6)}</div>`);
  ph.body.appendChild(prof);
  if (o.suspense) {
    const lbl = el('div', 'gram-hint', 'Loading profile…'); ph.body.appendChild(lbl);
    SFX.heart(); await wait(900); SFX.heart(); await wait(1100); SFX.heart(); await wait(900);
    lbl.remove();
    const av = prof.querySelector('.avatar'); av.style.transition = 'filter 1.2s'; av.classList.remove('blur');
    prof.querySelector('.nm').textContent = acc.name; prof.querySelector('.bi').textContent = acc.bio;
    SFX.sparkle();
    if (o.reveal) ph.body.appendChild(el('div', 'gram-hint', o.reveal));
    await wait(900);
  }
  return new Promise(res => {
    const b = el('button', 'pbtn', o.label || 'Follow');
    b.onclick = () => {
      SFX.click(); b.disabled = true; b.className = 'pbtn wait'; b.textContent = o.after || 'Requested';
      res();
    };
    ph.foot.appendChild(b);
  });
}

/* ------------------------------------------------------------------- chat */
function chatOpen(ph, o) {
  ph.root.querySelectorAll('.chat-head').forEach(n => n.remove());
  const head = el('div', 'chat-head',
    `${avatarHTML({ name: o.name, color: o.color || '#c3a6ff' })}<div><div class="nm">${o.name}</div><div class="st">${o.status || 'active now'}</div></div>`);
  head.querySelector('.avatar').style.cssText += ';width:36px;height:36px;font-size:15px';
  ph.root.insertBefore(head, ph.body);
  ph.body.innerHTML = ''; ph.foot.innerHTML = '';
}
function chatScroll(ph) { ph.body.scrollTop = ph.body.scrollHeight; }
function chatAdd(ph, who, text) {
  const b = el('div', 'bubble ' + who, text);
  ph.body.appendChild(b); chatScroll(ph);
  if (who === 'her') SFX.blip(); else if (who === 'me') SFX.click();
  return b;
}
async function chatHer(ph, text, ms) {
  const t = el('div', 'typing', '<i></i><i></i><i></i>');
  ph.body.appendChild(t); chatScroll(ph);
  await wait(ms || Math.min(2600, 700 + text.length * 22));
  t.remove(); chatAdd(ph, 'her', text); await wait(450);
}
function chatSys(ph, text) { chatAdd(ph, 'sys', text); return wait(500); }
async function chatMe(ph, text) { chatAdd(ph, 'me', text); await wait(600); }

/* Shows choices in the foot. Options: [{t, good, hint}] — only a good option moves on. */
function chatChoice(ph, options) {
  return new Promise(res => {
    ph.foot.innerHTML = '';
    const hint = el('div', null); hint.style.cssText = 'font-size:12px;color:#ffb3c7;min-height:16px;text-align:center;font-style:italic';
    options.forEach(o => {
      const b = el('button', 'cbtn', o.t);
      b.onclick = () => {
        if (o.good) { ph.foot.innerHTML = ''; res(o); return; }
        SFX.error(); b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad');
        hint.textContent = o.hint || 'That might not land well. Try something more respectful.';
      };
      ph.foot.appendChild(b);
    });
    ph.foot.appendChild(hint);
  });
}
/* Script runner: ['her',text] ['me',text] ['sys',text] ['pause',ms] ['pick',[options]]
   For 'pick', the chosen option's text is sent as "me". */
async function chatRun(ph, script) {
  for (const s of script) {
    const k = s[0];
    if (k === 'her') await chatHer(ph, s[1], s[2]);
    else if (k === 'me') await chatMe(ph, s[1]);
    else if (k === 'sys') await chatSys(ph, s[1]);
    else if (k === 'pause') await wait(s[1]);
    else if (k === 'pick') { const o = await chatChoice(ph, s[1]); await chatMe(ph, o.send || o.t); }
  }
}
