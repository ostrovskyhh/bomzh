// Социальное 2.8: карточка любой банды из топа, премиальный чат, плашка «Поддержать проект»
// (1 звезда или своя сумма) и раздел «Профиль» в настройках со сменой уникального имени.

// =====================================================================
// 1. Чужая банда: нажми на банду в топе — увидишь, кто в ней
// =====================================================================
gangListHTML = function (list, me) {
  if (!list || !list.length) return '<div class="info-card">Банд пока нет — основай первую!</div>';
  return list.map((g) => card({ cls: 'gang-card', thumb: `<div class="gang-place p${g.place}">${g.place}</div>`,
    title: `${g.emoji} ${esc(g.name)} <span class="rarity rare">ур. ${g.level}</span>${g.mine ? ' <small>(твоя)</small>' : ''}`,
    desc: `${modeTag(g.mode)} · ${g.members}/${g.max} бойцов<br>⚔️ ${fmt(g.week)} очков войны · ${fmt(g.score)} баллов${g.wins ? ` · 🏆×${g.wins}` : ''}<br><span class="gang-more">👁 Нажми, чтобы посмотреть состав</span>`,
    btn: me === false && !g.mine ? (g.mode === 'invite' ? '<button class="btn small" disabled data-why="Нужна ссылка-приглашение от бойцов банды">🔒</button>'
      : `<button class="btn ${g.members < g.max ? 'primary' : ''}" data-act="clanJoin" data-id="${g.id}" ${g.members < g.max ? '' : 'disabled data-why="Банда заполнена"'}>Вступить</button>`) : '' })
    .replace('<div class="card gang-card">', `<div class="card gang-card" data-act="gangView" data-id="${g.id}">`)).join('');
};

async function gangView(id) {
  if (!onlineOn()) return;
  openModal('<div class="gv"><div class="chat-empty">⏳ Загружаем банду…</div></div>', { center: true });
  let r;
  try { r = await apiPost('gang/info', { id: +id }); } catch (e) { toast(refErrorText(e), 'bad'); closeModal(); return; }
  if (!document.querySelector('#modalRoot .gv')) return;
  if (r.error) { toast(r.error, 'bad'); closeModal(); return; }
  const g = r.gang;
  const boss = g.members.find((m) => m.role === 'boss');
  const online = g.members.filter((m) => m.online).length;
  const join = g.mine ? '<div class="gv-note">🏴 Это твоя банда</div>'
    : g.inGang ? '<div class="gv-note">Ты уже в банде. Чтобы перейти, сначала выйди из своей</div>'
      : g.mode === 'invite' ? '<div class="gv-note">🔒 Только по приглашению — попроси ссылку у любого бойца</div>'
        : g.members.length >= g.max ? '<div class="gv-note">Мест нет — банда заполнена</div>'
          : `<button class="btn primary wide" data-act="clanJoin" data-id="${g.id}">🏴 Вступить в банду</button>`;
  $('modalRoot').querySelector('.gv').innerHTML = `
    <div class="gv-hero"><div class="gv-emoji">${g.emoji}</div>
      <div class="gv-title"><b>${esc(g.name)}</b><small>ур. ${g.level} · ${modeTag(g.mode)}</small></div></div>
    <div class="gv-stats">
      <div><b>${g.place}</b><small>место в войне</small></div>
      <div><b>${fmt(g.week)}</b><small>очков за неделю</small></div>
      <div><b>${g.wins ? '🏆×' + g.wins : '—'}</b><small>побед в войнах</small></div>
      <div><b>${fmt(g.power)}</b><small>сила</small></div>
      <div><b>${g.members.length}/${g.max}</b><small>бойцов · 🟢 ${online}</small></div>
      <div><b>${fmtShort(g.treasury)} ₽</b><small>общак</small></div>
    </div>
    <small class="gv-sub">👑 Главарь: <b>${boss ? esc(boss.name) : '—'}</b>${g.created ? ` · основана ${new Date(g.created * 1000).toLocaleDateString('ru-RU')}` : ''}</small>
    <div class="gv-list">${g.members.map((m) => `<div class="gv-m ${m.me ? 'me' : ''}">
        <div class="top-ava frame-${esc(m.frame || 'none')}">${avaFace(m.name, m.avatar)}${m.online ? '<i class="online-dot on-ava"></i>' : ''}</div>
        <div class="gv-mb"><b>${m.role === 'boss' ? '👑 ' : ''}${esc(m.name)}${m.me ? ' (ты)' : ''}</b>
          <small>ур. ${m.level} · 🥊 ${m.rating} · ⚔️ ${m.week} за неделю${m.online ? ' · <b class="online-txt">в игре</b>' : ''}</small>
          ${!m.me && m.pid && typeof duelBtns === 'function' ? duelBtns(m.pid, m.name) : ''}</div></div>`).join('')}</div>
    ${join}
    <div class="btns"><button class="btn wide" data-act="close">Закрыть</button></div>`;
}
ACTIONS.gangView = (id) => gangView(id);

// =====================================================================
// 2. Премиальный чат
// =====================================================================
// Смайлы по вкладкам; «Недавние» — последние 16, что ты отправлял
const CHAT_EMOJI_TABS = [
  ['😀', ['😂', '🤣', '😅', '😊', '😍', '🥰', '😘', '😎', '🤩', '🥳', '😏', '🤔', '🙄', '😴', '😭', '😢', '😡', '🤯', '😱', '🥶', '🤡', '😇', '🤑', '🫡']],
  ['👍', ['👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙏', '💪', '👊', '✊', '🫶', '👋', '🤙', '☝️', '🖕']],
  ['❤️', ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '💖', '💯', '🔥', '✨', '⭐', '💥', '💫', '🎉']],
  ['🍾', ['🍾', '🍺', '🍻', '🥃', '🍷', '☕', '🌯', '🍕', '🍔', '🍟', '🥟', '🍢', '🐀', '🐈', '🐕', '🕊️']],
  ['💰', ['💰', '💸', '💵', '🪙', '👑', '💎', '🏆', '🥇', '🎰', '🎲', '🃏', '🥊', '⚔️', '🏴', '🚗', '🏙️']],
];
const CHAT_EMOJI = CHAT_EMOJI_TABS[0][1];
const CHAT_QUICK = ['Всем привет! 👋', 'Кто на бой? 🥊', 'Кто в банду? 🏴', 'Го КНБ ✊', 'GG 🤝', 'Спасибо! 🙏'];
const CHAT_MAX = 200;
// Делим строку на видимые символы, чтобы не разрезать смайл из нескольких кодов (👨‍👩‍👧, ❤️)
const CHAT_SEG = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('ru', { granularity: 'grapheme' }) : null;
function chatGraphemes(s) { return CHAT_SEG ? [...CHAT_SEG.segment(s)].map((x) => x.segment) : Array.from(s); }
const CHAT_EMO_RE = /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|‍|️|⃣|\s)+$/u;
function chatJumbo(text) { const t = String(text).trim(); if (!t || !CHAT_EMO_RE.test(t)) return 0; const n = chatGraphemes(t.replace(/\s+/g, '')).length; return n <= 3 ? n : 0; }
function chatEmojiTab(i) {
  const recent = (S.chatRecent || []).slice(0, 16);
  const list = i < 0 ? recent : CHAT_EMOJI_TABS[i][1];
  return list.length ? list.map((e) => `<button data-act="chatEmo" data-id="${e}">${e}</button>`).join('') : '<small class="c2-none">Тут появятся смайлы, которые ты отправлял</small>';
}
function chatColor(name) { let h = 0; for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) % 360; return `hsl(${h} 70% 68%)`; }
function chatDay(ts) {
  const d = new Date(ts * 1000), t = new Date();
  const y = new Date(t); y.setDate(t.getDate() - 1);
  return d.toDateString() === t.toDateString() ? 'Сегодня' : d.toDateString() === y.toDateString() ? 'Вчера' : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

chatOpen = function (room = 'district') {
  if (!onlineOn()) { toast('Чат работает в игре внутри Telegram', 'bad'); return; }
  if (CHAT && CHAT.timer) clearInterval(CHAT.timer);
  CHAT = { room, last: 0, timer: null, admin: false, prev: null, users: {} };
  const tab = (id, e, t) => `<button class="${room === id ? 'on' : ''}" data-act="chatRoom" data-id="${id}"><span>${e}</span>${t}</button>`;
  openModal(`<div class="chat chat2">
      <div class="c2-head"><div class="c2-tabs">${tab('district', '🏙️', 'Район')}${tab('clan', '🏴', 'Банда')}</div>
        <span class="c2-online" id="chatOnline"></span><button class="c2-x" data-act="close">✕</button></div>
      <div class="chat-list c2-list" id="chatList"><div class="chat-empty">Загружаем…</div></div>
      <button class="c2-down hidden" id="chatDown" data-act="chatDown">⬇ Новые</button>
      <div class="c2-emoji hidden" id="chatEmoji">
        <div class="c2-etabs">${(S.chatRecent || []).length ? '<button data-act="chatEmoTab" data-id="-1">🕘</button>' : ''}${CHAT_EMOJI_TABS.map(([e], i) => `<button class="${i === 0 ? 'on' : ''}" data-act="chatEmoTab" data-id="${i}">${e}</button>`).join('')}</div>
        <div class="c2-egrid" id="chatEGrid">${chatEmojiTab(0)}</div>
        <div class="c2-quick">${CHAT_QUICK.map((q, i) => `<button data-act="chatQuick" data-id="${i}">${q}</button>`).join('')}</div></div>
      <div class="chat-input c2-input"><button class="c2-emo-btn" id="chatEmoBtn" data-act="chatEmoToggle">😊</button>
        <input id="chatText" placeholder="${room === 'clan' ? 'Написать банде…' : 'Написать району…'}" autocomplete="off" enterkeyhint="send">
        <span class="c2-count hidden" id="chatCount"></span>
        <button class="c2-send" data-act="chatSend">➤</button></div>
      <small class="chat-rules">Без мата, ссылок и рекламы · нажми на аватарку, чтобы позвать игрока на бой</small>
    </div>`);
  const sheet = $('chatList').closest('.sheet');
  if (sheet) sheet.classList.add('chat-sheet');
  const inp = $('chatText');
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') ACTIONS.chatSend(); });
  // Лимит считаем по видимым символам: смайл — это один символ, даже если внутри несколько кодов
  inp.addEventListener('input', () => {
    const g = chatGraphemes(inp.value);
    if (g.length > CHAT_MAX) inp.value = g.slice(0, CHAT_MAX).join('');
    const left = CHAT_MAX - Math.min(g.length, CHAT_MAX);
    $('chatCount').textContent = left;
    $('chatCount').classList.toggle('hidden', left > 30);
  });
  // Курсор запоминаем: смайл вставляется туда, где он стоял, а не в конец
  ['keyup', 'click', 'select', 'input'].forEach((ev) => inp.addEventListener(ev, () => { CHAT.caret = inp.selectionStart; }));
  const list = $('chatList');
  list.addEventListener('scroll', () => {
    // A queued scroll may arrive after this room was closed or replaced.
    if($('chatList')!==list)return;
    const down=$('chatDown');
    if(down&&list.scrollHeight-list.scrollTop-list.clientHeight<40)down.classList.add('hidden');
  });
  chatPoll();
  CHAT.timer = setInterval(chatPoll, CHAT_POLL);
};

chatPoll = async function () {
  const c = CHAT;
  if (!c || !$('chatList')) { if (c && c.timer) clearInterval(c.timer); CHAT = null; return; }
  try {
    const r = await apiPost('chat/list', { room: c.room, after: c.last });
    if (CHAT !== c || !$('chatList')) return;
    c.admin = r.admin;
    const list = $('chatList');
    if (r.online && $('chatOnline')) $('chatOnline').innerHTML = `<i class="online-dot"></i>${r.online} в игре`;
    if (r.error && !c.last) { list.innerHTML = `<div class="chat-empty c2-empty"><span>🏴</span>${r.error}.<br>Вступи в банду во вкладке «Досуг → Банда».</div>`; return; }
    if (!c.last) list.innerHTML = r.messages.length ? '' : '<div class="chat-empty c2-empty"><span>💬</span>Тут пока тихо. Напиши первым!</div>';
    const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 60;
    let html = '';
    for (const m of r.messages) {
      const day = chatDay(m.ts);
      if (!c.prev || c.prev.day !== day) html += `<div class="c2-day"><span>${day}</span></div>`;
      if (m.sys) { html += `<div class="chat-sys c2-sys">${esc(m.text)}</div>`; c.prev = { day }; }
      else {
        const b = (() => { try { return JSON.parse(m.badge || '{}'); } catch (e) { return {}; } })();
        const cont = c.prev && c.prev.name === m.name && m.ts - c.prev.ts < 300 && c.prev.day === day;
        if (m.pid) c.users[m.pid] = { name: m.name, lvl: b.lvl || 1, avatar: b.avatar, frame: b.frame };
        const time = new Date(m.ts * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const jumbo = chatJumbo(m.text);
        html += `<div class="chat-msg c2-msg ${m.me ? 'me' : ''} ${cont ? 'cont' : ''}">
          <div class="chat-ava frame-${esc(b.frame || 'none')}" ${m.pid && !m.me ? `data-act="chatUser" data-id="${esc(m.pid)}"` : ''}>${cont ? '' : avaFace(m.name, b.avatar)}</div>
          <div class="chat-bubble c2-bubble ${jumbo ? `jumbo j${jumbo}` : ''}">${cont || m.me ? '' : `<b style="color:${chatColor(m.name)}">${esc(m.name)}<small class="c2-lvl">${b.lvl || 1}</small></b>`}
            <span class="c2-text">${esc(m.text)}</span><small class="c2-time">${time}${c.admin ? ` <i data-act="chatDel" data-id="${m.id}">🗑</i>` : ''}</small></div></div>`;
        c.prev = { name: m.name, ts: m.ts, day };
      }
      c.last = Math.max(c.last, m.id);
    }
    if (html) list.insertAdjacentHTML('beforeend', html);
    if (r.messages.length) {
      if (atBottom || r.messages.some((m) => m.me) || list.dataset.first !== '1') { list.scrollTop = list.scrollHeight; list.dataset.first = '1'; }
      else $('chatDown').classList.remove('hidden');
    }
    if (!S.chatSeen) S.chatSeen = {};
    S.chatSeen[c.room] = Math.max(S.chatSeen[c.room] || 0, c.last);
    chatBadge();
  } catch (e) { /* сеть моргнула */ }
};

// Смайл встаёт на место курсора. Клавиатуру не вызываем на телефоне — иначе она закроет панель смайлов
function chatInsert(text) {
  const i = $('chatText');
  if (!i) return;
  const pos = Math.min(CHAT && CHAT.caret != null ? CHAT.caret : i.value.length, i.value.length);
  const next = i.value.slice(0, pos) + text + i.value.slice(pos);
  if (chatGraphemes(next).length > CHAT_MAX) { toast('Сообщение слишком длинное', 'bad'); return; }
  i.value = next;
  if (CHAT) CHAT.caret = pos + text.length;
  i.dispatchEvent(new Event('input'));
  if (!matchMedia('(pointer: coarse)').matches) { i.focus(); i.setSelectionRange(CHAT.caret, CHAT.caret); }
}
function chatRemember(text) {
  const used = chatGraphemes(text).filter((g) => CHAT_EMO_RE.test(g) && /\p{Extended_Pictographic}/u.test(g));
  if (!used.length) return;
  S.chatRecent = [...new Set([...used.reverse(), ...(S.chatRecent || [])])].slice(0, 16);
}
const _chatSendEmo = ACTIONS.chatSend;
ACTIONS.chatSend = (...a) => {
  const i = $('chatText');
  if (i && i.value.trim()) chatRemember(i.value);
  if (CHAT) CHAT.caret = null;
  const e = $('chatEmoji'); if (e) e.classList.add('hidden');
  if ($('chatEmoBtn')) $('chatEmoBtn').textContent = '😊';
  const r = _chatSendEmo(...a);
  if ($('chatCount')) $('chatCount').classList.add('hidden');
  return r;
};
Object.assign(ACTIONS, {
  chatEmoToggle: () => {
    const e = $('chatEmoji');
    if (!e) return;
    e.classList.toggle('hidden');
    $('chatEmoBtn').textContent = e.classList.contains('hidden') ? '😊' : '⌨️';
    if (e.classList.contains('hidden')) $('chatText').focus(); else $('chatText').blur();
  },
  chatEmoTab: (i, btn) => {
    $('chatEGrid').innerHTML = chatEmojiTab(+i);
    document.querySelectorAll('#chatEmoji .c2-etabs button').forEach((b) => b.classList.toggle('on', b === btn));
  },
  chatEmo: (e) => chatInsert(e),
  chatQuick: (i) => { const i2 = $('chatText'); if (i2) { i2.value = CHAT_QUICK[+i]; ACTIONS.chatSend(); } },
  chatDown: () => { const l = $('chatList'); if (l) l.scrollTop = l.scrollHeight; $('chatDown').classList.add('hidden'); },
  // Нажатие на аватарку — мини-карточка игрока с вызовом на бой, КНБ и «в друзья»
  chatUser: (pid) => {
    const u = CHAT && CHAT.users[pid];
    if (!u) return;
    document.querySelectorAll('#modalRoot .c2-user').forEach((x) => x.remove());
    const box = document.createElement('div');
    box.className = 'c2-user';
    box.innerHTML = `<div class="top-ava frame-${esc(u.frame || 'none')}">${avaFace(u.name, u.avatar)}</div><div><b>${esc(u.name)}</b><small>ур. ${u.lvl}</small>
      ${typeof duelBtns === 'function' ? duelBtns(pid, u.name) : ''}</div><button class="c2-x" data-act="chatUserClose">✕</button>`;
    document.querySelector('#modalRoot .chat2').appendChild(box);
  },
  chatUserClose: () => document.querySelectorAll('#modalRoot .c2-user').forEach((x) => x.remove()),
});

// =====================================================================
// 3. Донат: плашка «Поддержать проект»
// =====================================================================
PREM_GIVE.tip = (it) => {
  const n = (it && it.stars) || 1;
  S.tipStars = (S.tipStars || 0) + n;
  return `💛 Поддержка проекта: ${n} ⭐ — огромное спасибо!`;
};
function tipHTML() {
  return `<div class="dn-tip"><div class="dn-tip-h"><span>💛</span><div><b>Поддержать проект</b>
      <small>Без покупки — просто помочь игре расти: новые функции, сервер, обновления.${S.tipStars ? ` Ты уже поддержал на <b>${S.tipStars} ⭐</b> — спасибо!` : ''}</small></div></div>
    <div class="dn-tip-row"><button class="dn-buy dn-tip-one" data-act="tipOne">${starPrice(1)}<small>Одна звезда</small></button>
      <div class="dn-tip-custom"><input id="tipStars" type="number" inputmode="numeric" min="1" max="10000" placeholder="Сколько ⭐?">
      <button class="btn primary" data-act="tipCustom">Отправить</button></div></div></div>`;
}
donateHTML = (function (orig) {
  return function () { return orig().replace('<div class="dn-title">Наборы крышек</div>', `${tipHTML()}<div class="dn-title">Наборы крышек</div>`); };
})(donateHTML);
async function tipPay(stars) {
  stars = Math.floor(+stars || 0);
  if (stars < 1 || stars > 10000) { toast('Введи от 1 до 10 000 звёзд', 'bad'); return; }
  if (S.admin && !onlineOn()) { toast(PREM_GIVE.tip({ stars }).replace(/<[^>]+>/g, ''), 'good'); return; }
  if (!onlineOn() || !tg || !tg.openInvoice) { toast('Звёзды работают в игре внутри Telegram', 'bad'); return; }
  try {
    const r = await apiPost('pay/invoice', { product: 'tip', stars });
    if (r.error || !r.link) { toast(r.error || 'Оплата недоступна', 'bad'); return; }
    tg.openInvoice(r.link, (status) => {
      if (status === 'paid') { toast('💛 Спасибо! Зачисляем…', 'good'); setTimeout(payClaim, 1500); setTimeout(payClaim, 6000); }
      else if (status === 'failed') toast('Оплата не прошла', 'bad');
    });
  } catch (e) { toast(refErrorText(e), 'bad'); }
}
ACTIONS.tipOne = () => tipPay(1);
ACTIONS.tipCustom = () => tipPay(($('tipStars') || {}).value);
ACHS.push({ id: 'patron', name: 'Меценат', emoji: '💛', fn: () => S.tipStars || 0, goals: [1, 50, 250, 1000], unit: '⭐ на поддержку проекта' });

// =====================================================================
// 4. Настройки → Профиль: уникальное имя
// =====================================================================
const NAME_WARN = 'Это имя станет <b>именем твоего персонажа везде</b>: в топе, чате, бандах, боях и вызовах. Оно уникально и меняется не чаще раза в 7 дней.';
SET_TABS.unshift(['profile', '👤 Профиль']);
openSettings = (function (orig) {
  return function () {
    orig();
    const sec = document.querySelector('#modalRoot [data-sec="profile"]');
    if (!sec) return;
    sec.innerHTML = `<div class="set-profile"><div class="top-ava frame-${esc(S.frame || 'none')}">${avaFace(playerName(), S.avatar)}</div>
      <div><small>Имя персонажа</small><b>${esc(playerName())}</b><span id="nameNext" class="set-name-next">${S.name ? '' : 'Ещё не выбрано — придумай!'}</span></div></div>
      <div class="info-card warn-soft">⚠️ ${NAME_WARN}</div>
      <button class="btn primary wide" data-act="nameEdit">🏷️ ${S.name ? 'Сменить имя' : 'Придумать имя'}</button>`;
    if (onlineOn()) apiPost('name/get').then((r) => {
      const el = $('nameNext');
      if (!el || !r || !r.changed) return;
      const next = r.changed * 1000 + 7 * 86400000;
      el.textContent = next > Date.now() ? `Сменить можно через ${leftText(next - Date.now())}` : 'Можно сменить прямо сейчас';
    }).catch(() => {});
  };
})(openSettings);
// В окне смены имени — предупреждение, а перед сохранением — подтверждение
nameModal = (function (orig) {
  return function (first) {
    orig(first);
    const p = document.querySelector('#modalRoot .name-pop p');
    if (p && !first) p.innerHTML = NAME_WARN;
  };
})(nameModal);
const _nameSaveOrig = ACTIONS.nameSave;
ACTIONS.nameSave = (function (orig) {
  return (first) => {
    const name = (($('nameInp') || {}).value || '').trim();
    if (first === '1' || name.length < 3 || name === S.name || !onlineOn()) { orig(first); return; }
    openModal(`<div class="name-pop"><div class="bc-e">⚠️</div><h3>Точно «${esc(name)}»?</h3>
      <p>Так тебя будут видеть все игроки: в топе, чате, бандах и боях. Следующая смена — только через 7 дней.</p>
      <input id="nameInp" type="hidden" value="${esc(name)}">
      <div class="btns" style="flex-direction:column;gap:8px"><button class="btn primary wide" data-act="nameConfirm">✅ Да, это моё имя</button>
      <button class="btn wide" data-act="nameEdit">✏️ Изменить</button></div></div>`, { center: true });
  };
})(ACTIONS.nameSave);
ACTIONS.nameConfirm = () => _nameSaveOrig('0'); // исходное сохранение читает имя из скрытого поля #nameInp
