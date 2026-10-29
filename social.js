// Социальное в игре: оплата Telegram Stars, напоминания от бота, приглашение через историю и ссылку,
// чат района (кнопка на главном экране) и банды. Всё идёт через сервер в боте (bot/social.py).

// =====================================================================
// Оплата звёздами
// =====================================================================

const PREM_GIVE = {
  vip: () => { S.vipUntil = Math.max(Date.now(), S.vipUntil || 0) + 30 * 86400000; return '👑 VIP «Авторитет» на 30 дней'; },
  caps10: () => (addCaps(10), '🟡 +10 крышек'),
  caps60: () => (addCaps(60), '💰 +60 крышек'),
  caps200: () => (addCaps(200), '🧰 +200 крышек'),
};

async function payClaim() {
  if (!onlineOn()) return;
  try {
    const { items } = await apiPost('pay/claim');
    if (!items || !items.length) return;
    const got = items.filter((p) => PREM_GIVE[p]).map((p) => PREM_GIVE[p]());
    track('purchase', items.length);
    save();
    confetti(80); sfx('jackpot');
    resultModal({ emoji: '⭐', title: 'Покупка зачислена!', text: `${got.join('<br>')}<br><br>Спасибо, что поддерживаешь игру!`, btn: 'Ура!' });
  } catch (e) { /* сервер выключен — заберём при следующем входе */ }
}
HOOKS.init.push(() => setTimeout(payClaim, 5000));

ACTIONS.prem = async (id) => {
  if (!PREM_GIVE[id]) return;
  if (S.admin && !onlineOn()) { PREM_GIVE[id](); toast('🛠️ Тестовая покупка (админ)', 'good'); return; }
  if (!onlineOn() || !tg || !tg.openInvoice) { toast('Покупки за звёзды работают в игре внутри Telegram', 'bad'); return; }
  try {
    const r = await apiPost('pay/invoice', { product: id });
    if (r.error || !r.link) { toast(r.error || 'Магазин недоступен', 'bad'); return; }
    tg.openInvoice(r.link, (status) => {
      if (status === 'paid') { toast('⭐ Оплата прошла! Зачисляем…', 'good'); setTimeout(payClaim, 1500); setTimeout(payClaim, 6000); }
      else if (status === 'failed') toast('Оплата не прошла', 'bad');
    });
  } catch (e) { toast(refErrorText(e), 'bad'); }
};

// =====================================================================
// Напоминания от бота: игра сообщает серверу, когда что случится
// =====================================================================

function notifyPlan() {
  const now = Date.now(), plan = [];
  if (S.food > 20) plan.push({ key: 'hungry', at: now + (S.food - 20 + (S.over || 0)) * 60000 });
  if (S.busy && S.busy.type === 'sleep') plan.push({ key: 'energy', at: S.busy.end });
  let bizAt = Infinity;
  for (const b of BUSINESSES) { const st = S.biz[b.id]; if (st) bizAt = Math.min(bizAt, now + Math.max(0, (bizCap(b, st) - st.cash) / bizIncome(b, st)) * 3600000); }
  if (bizAt < Infinity) plan.push({ key: 'biz', at: Math.round(bizAt) });
  if (S.pet && S.petFood > 20) plan.push({ key: 'pet', at: now + (S.petFood - 20) * 6 * 60000 });
  if (S.cd && S.cd.trash > now) plan.push({ key: 'trash', at: S.cd.trash + 30 * 60000 });
  if (dailyState().claimedToday) { const d = new Date(); d.setUTCHours(24, 0, 0, 0); plan.push({ key: 'daily', at: d.getTime() + 10 * 3600000 }); }
  if (S.married && S.wifeDue) plan.push({ key: 'wife', at: S.wifeDue });
  return plan;
}

async function notifySync() {
  if (!onlineOn() || !S.storySeen) return;
  try { await apiPost('notify/state', { enabled: S.settings.remind !== false, plan: notifyPlan() }); } catch (e) { /* не страшно */ }
}
let notifyAt = 0;
HOOKS.tick.push(() => { if (Date.now() - notifyAt > 3 * 60000) { notifyAt = Date.now(); notifySync(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden) { save(); notifySync(); } });

// =====================================================================
// Приглашение: ссылка t.me/бот?start=ref_код и история в Telegram
// =====================================================================

function refLink() { return REF && BOT_LINK ? `${BOT_LINK}?start=ref_${REF.code}` : BOT_LINK; }
function storyImage() { return new URL('assets/story-promo-446.png', document.baseURI).href; }
function canStory() { return !!(tg && tg.shareToStory && tg.isVersionAtLeast && tg.isVersionAtLeast('7.8')); }

// Друг пришёл по ссылке — код подставляется сам
async function refPending() {
  if (!onlineOn() || S.refUsed) return;
  try {
    const { code } = await apiPost('ref/pending');
    if (!code) return;
    openModal(`<div class="big-art" style="height:96px"><div class="rays"></div><div class="big-emoji" style="line-height:96px">🎁</div></div>
      <h3>Тебя пригласил друг!</h3><p>Код друга <b>${esc(code.toUpperCase())}</b>. Активируй — и получишь +1000 ₽ и опыт ×1.5 на полчаса.</p>
      <div class="btns"><button class="btn primary wide" data-act="refAccept" data-id="${esc(code)}">Активировать</button></div>`, { center: true });
  } catch (e) { /* без сервера просто пропускаем */ }
}
HOOKS.init.push(() => setTimeout(refPending, 7000));

// Поделиться: в приглашении теперь ссылка с кодом
ACTIONS.refShare = () => {
  if (!REF) return;
  const url = `https://t.me/share/url?url=${encodeURIComponent(refLink())}&text=${encodeURIComponent(refInviteText())}`;
  if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, '_blank');
};

Object.assign(ACTIONS, {
  refAccept: (code) => { closeModal(); useRefCode(code); },
  storyShare: () => storyPromoShare(),
});

// Кнопка истории — в блоке «Пригласи друга» в настройках
const _refBoxHTML = refBoxHTML;
refBoxHTML = () => {
  const html = _refBoxHTML();
  if (!REF) return html;
  return html + `<button class="btn primary wide story-btn" data-act="storyShare">📸 Поделиться историей</button>`;
};

// =====================================================================
// Чат района и банды
// =====================================================================

const CHAT_POLL = 2500;
let CHAT = null; // { room, last, timer, admin }

function chatOpen(room = 'district') {
  if (!onlineOn()) { toast('Чат работает в игре внутри Telegram', 'bad'); return; }
  if (CHAT && CHAT.timer) clearInterval(CHAT.timer);
  CHAT = { room, last: 0, timer: null, admin: false };
  openModal(`<div class="chat">
      <div class="seg seg2 chat-tabs"><button class="${room === 'district' ? 'on' : ''}" data-act="chatRoom" data-id="district">🏙️ Район</button>
        <button class="${room === 'clan' ? 'on' : ''}" data-act="chatRoom" data-id="clan">🏴 Банда</button></div>
      <div class="chat-list" id="chatList"><div class="chat-empty">Загружаем…</div></div>
      <div class="chat-input"><input id="chatText" maxlength="200" placeholder="Напиши району…" autocomplete="off"><button class="btn primary" data-act="chatSend">➤</button></div>
      <small class="chat-rules">Без мата, ссылок и рекламы. Сообщение — не чаще раза в 3 секунды.</small>
    </div>`, { center: true });
  $('chatText').addEventListener('keydown', (e) => { if (e.key === 'Enter') ACTIONS.chatSend(); });
  chatPoll();
  CHAT.timer = setInterval(chatPoll, CHAT_POLL);
}

async function chatPoll() {
  const c = CHAT;
  if (!c || !$('chatList')) { if (c && c.timer) clearInterval(c.timer); CHAT = null; return; }
  try {
    const r = await apiPost('chat/list', { room: c.room, after: c.last });
    if (CHAT !== c || !$('chatList')) return;
    c.admin = r.admin;
    const list = $('chatList');
    if (r.error && !c.last) { list.innerHTML = `<div class="chat-empty">${r.error}. Вступи в банду во вкладке «Досуг → Банда».</div>`; return; }
    if (!c.last) list.innerHTML = r.messages.length ? '' : '<div class="chat-empty">Тут пока тихо. Напиши первым!</div>';
    const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
    for (const m of r.messages) {
      const b = (() => { try { return JSON.parse(m.badge || '{}'); } catch (e) { return {}; } })();
      list.insertAdjacentHTML('beforeend', m.sys ? `<div class="chat-sys">${esc(m.text)}</div>`
        : `<div class="chat-msg ${m.me ? 'me' : ''}"><div class="chat-ava frame-${esc(b.frame || 'none')}">${avaFace(m.name, b.avatar)}</div><div class="chat-bubble">
          <b>${esc(m.name)}<small> · ур. ${b.lvl || 1} · ${new Date(m.ts * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</small>${c.admin ? `<i data-act="chatDel" data-id="${m.id}">🗑</i>` : ''}</b>${esc(m.text)}</div></div>`);
      c.last = Math.max(c.last, m.id);
    }
    if (atBottom || r.messages.length) list.scrollTop = list.scrollHeight;
    if (!S.chatSeen) S.chatSeen = {};
    S.chatSeen[c.room] = Math.max(S.chatSeen[c.room] || 0, c.last);
    chatBadge();
  } catch (e) { /* сеть моргнула */ }
}

// Непрочитанные — красная точка на кнопке чата
let CHAT_LAST = { district: 0, clan: 0 };
function chatBadge() {
  const b = $('chatBadge');
  if (!b) return;
  const seen = S.chatSeen || {};
  const n = (CHAT_LAST.district > (seen.district || 0) ? 1 : 0) + (CHAT_LAST.clan > (seen.clan || 0) ? 1 : 0);
  b.classList.toggle('hidden', !n);
  $('chatBtn').classList.toggle('hidden', !onlineOn() || !S.storySeen);
}
async function chatCheck() {
  if (!onlineOn()) { chatBadge(); return; }
  try { CHAT_LAST = await apiPost('chat/last'); } catch (e) { /* молчим */ }
  chatBadge();
}
HOOKS.init.push(() => { setTimeout(chatCheck, 3000); setInterval(chatCheck, 60000); });

Object.assign(ACTIONS, {
  openChat: () => chatOpen('district'),
  chatRoom: (room) => chatOpen(room),
  chatSend: async () => {
    const inp = $('chatText');
    if (!inp || !CHAT) return;
    const text = inp.value.trim();
    if (!text) return;
    inp.value = '';
    try {
      const r = await apiPost('chat/send', { room: CHAT.room, text });
      if (r.error) { toast(r.error, 'bad'); inp.value = text; return; }
      track('chatMsg');
      chatPoll();
    } catch (e) { toast(refErrorText(e), 'bad'); inp.value = text; }
  },
  chatDel: async (id) => { try { await apiPost('chat/delete', { id: +id }); const el = document.querySelector(`[data-act="chatDel"][data-id="${id}"]`); if (el) el.closest('.chat-msg').remove(); } catch (e) { toast('Не удалось удалить', 'bad'); } },
});

// =====================================================================
// Банды
// =====================================================================

const CLAN_PRICE = 50000;
const CLAN_CAPS = 25; // плюс золотые крышки
const CLAN_LEVEL_REQ = 8;
const CLAN_BONUS = 0.03; // +3% к тапам, работе и бизнесу за каждый уровень банды выше первого
const CLAN_EMOJI = ['🏴', '🐺', '🦅', '🐻', '🦊', '🐍', '💀', '🔥', '⚡', '👑', '🍾', '🗡️'];
let CLAN = { data: undefined, list: null, at: 0, loading: false };

function clanBonus() { return S.clan ? CLAN_BONUS * ((S.clan.level || 1) - 1) : 0; }
HOOKS.mods.push((m) => { const b = clanBonus(); if (b) { m.tap *= 1 + b; m.work *= 1 + b; } });
// The gang business bonus is included once in businessRates().

async function clanLoad(force) {
  if (!onlineOn() || CLAN.loading || (!force && Date.now() - CLAN.at < 15000)) return;
  CLAN.loading = true;
  try {
    const my = await apiPost('clan/my');
    CLAN.data = my.clan;
    S.clan = my.clan ? { id: my.clan.id, name: my.clan.name, emoji: my.clan.emoji, level: my.clan.level } : null;
    CLAN.list = (await apiPost('clan/list')).clans;
  } catch (e) { CLAN.error = 'Сервер банд недоступен'; }
  CLAN.loading = false;
  CLAN.at = Date.now();
  if (currentScreen === 'fun' && TABS.fun === 'clan') renderCurrent(false);
}
HOOKS.init.push(() => setTimeout(() => clanLoad(true), 4000));

EXTRA_TABS.fun.clan = () => {
  if (!onlineOn()) return '<div class="info-card">🏴 Банды работают в игре внутри Telegram: нужен общий сервер.</div>';
  setTimeout(() => clanLoad(), 0);
  if (CLAN.data === undefined) return `<div class="info-card">${CLAN.error || '⏳ Загружаем банды района…'}</div>`;
  const c = CLAN.data;
  const others = (CLAN.list || []).filter((x) => !c || x.id !== c.id);
  if (!c) {
    const can = level() >= CLAN_LEVEL_REQ;
    return `<div class="premium-hero clan-hero"><div class="e">🏴</div><div><b>Банды района</b><p>Вместе веселее: общий общак, бонус к доходу до +${CLAN_BONUS * 400}%, набеги на чужие банды и свой чат.</p></div></div>
      <div class="info-card"><b>Основать банду</b> — ${fmt(CLAN_PRICE)} ₽, с ${CLAN_LEVEL_REQ} уровня.
        <div class="code-row"><input id="clanName" maxlength="20" placeholder="Название банды"><select id="clanEmoji">${CLAN_EMOJI.map((e) => `<option>${e}</option>`).join('')}</select></div>
        ${can ? priceBtn('clanCreate', '', CLAN_PRICE, S.money >= CLAN_PRICE, `Основать · ${fmt(CLAN_PRICE)} ₽`).replace('class="btn', 'class="btn wide') : `<button class="btn wide" disabled data-why="Нужен ${CLAN_LEVEL_REQ} уровень">🔒 С ${CLAN_LEVEL_REQ} уровня</button>`}</div>
      <div class="subhead">Топ банд · вступай в любую</div>
      ${others.length ? others.map((x, i) => card({ thumb: x.emoji, title: `${i + 1}. ${esc(x.name)} <span class="rarity rare">ур. ${x.level}</span>`, desc: `${x.members}/20 бойцов · ${fmt(x.score)} баллов`,
        btn: `<button class="btn ${x.members < 20 ? 'primary' : ''}" data-act="clanJoin" data-id="${x.id}" ${x.members < 20 ? '' : 'disabled data-why="Банда заполнена"'}>Вступить</button>` })).join('') : '<div class="info-card">Банд пока нет — основай первую!</div>'}`;
  }
  const bonus = Math.round(clanBonus() * 100);
  return `<div class="premium-hero clan-hero"><div class="e">${c.emoji}</div><div><b>${esc(c.name)} · ур. ${c.level}</b>
      <p>Общак: <b>${fmt(c.treasury)} ₽</b> · сила ${fmt(c.power)} · ${fmt(c.score)} баллов${bonus ? ` · бонус +${bonus}% к доходу` : ''}</p></div></div>
    <div class="btn-row"><button class="btn wide" data-act="chatRoom" data-id="clan">💬 Чат банды</button></div>
    <div class="subhead">Скинуться в общак</div>
    <div class="btn-row">${[1000, 10000, 100000, 1000000].map((v) => priceBtn('clanDonate', v, v, S.money >= v, `+${fmt(v)}`).replace('class="btn', 'class="btn small')).join('')}</div>
    ${c.nextCost ? `<div class="info-card">Уровень ${c.level + 1}: бонус +${CLAN_BONUS * 100 * c.level}% ко всем доходам банды. Стоит <b>${fmt(c.nextCost)} ₽</b> из общака.
      ${c.isOwner ? `<button class="btn ${c.treasury >= c.nextCost ? 'primary' : ''} wide" data-act="clanUpgrade" ${c.treasury >= c.nextCost ? '' : `disabled data-why="В общаке не хватает ${fmt(c.nextCost - c.treasury)} ₽"`}>⬆️ Прокачать банду</button>` : '<small>Прокачивает главарь.</small>'}</div>` : '<div class="info-card">👑 Банда максимального уровня!</div>'}
    <div class="subhead">Бойцы · ${c.members.length}/20</div>
    ${c.members.map((m) => card({ thumb: m.role === 'boss' ? '👑' : '👤', title: `${esc(m.name)}${m.me ? ' (ты)' : ''}`, desc: `${fmt(m.score)} баллов · вложил ${fmt(m.donated)} ₽`,
      btn: c.isOwner && !m.me ? `<button class="btn small" data-act="clanKick" data-id="${m.uid}">Выгнать</button>` : '' })).join('')}
    <div class="subhead">Набеги · раз в 12 часов, победа = 10% чужого общака</div>
    ${c.raidLeft ? `<div class="info-card">⏳ Бойцы отдыхают: следующий набег через ${fmtTime(c.raidLeft)}</div>` : ''}
    ${others.slice(0, 15).map((x) => card({ thumb: x.emoji, title: esc(x.name), desc: `ур. ${x.level} · сила ${fmt(x.power)} · ${x.members} бойцов${x.shield ? ' · 🛡️ под защитой' : ''}`,
      btn: c.isOwner ? `<button class="btn ${c.raidLeft || x.shield ? '' : 'primary'}" data-act="clanRaid" data-id="${x.id}" ${c.raidLeft || x.shield ? `disabled data-why="${x.shield ? 'Банда под защитой после набега' : 'Бойцы ещё отдыхают'}"` : ''}>⚔️ Набег</button>` : '' })).join('')}
    ${c.isOwner ? '' : '<div class="info-card">Набеги объявляет главарь.</div>'}
    <button class="btn wide" data-act="clanLeave" style="color:var(--red)">Покинуть банду</button>`;
};

async function clanCall(path, body, okText) {
  try {
    const r = await apiPost(path, body);
    if (r.error) { toast(r.error, 'bad'); sfx('error'); return null; }
    if (r.clan !== undefined) { CLAN.data = r.clan; S.clan = r.clan ? { id: r.clan.id, name: r.clan.name, emoji: r.clan.emoji, level: r.clan.level } : null; }
    if (okText) toast(okText, 'good');
    CLAN.at = 0;
    clanLoad(true);
    return r;
  } catch (e) { toast(refErrorText(e), 'bad'); return null; }
}

Object.assign(ACTIONS, {
  clanCreate: async () => {
    const name = ($('clanName') || {}).value || '';
    if (S.money < CLAN_PRICE || level() < CLAN_LEVEL_REQ) return;
    if (S.caps < CLAN_CAPS) { toast(`Нужно ещё ${CLAN_CAPS - S.caps} 🟡 — крышки можно купить, нажав на них наверху`, 'bad'); return; }
    const r = await clanCall('clan/create', { name, emoji: ($('clanEmoji') || {}).value }, '🏴 Банда основана!');
    if (r) { S.money -= CLAN_PRICE; S.caps -= CLAN_CAPS; track('clanCreate'); sfx('levelup'); confetti(60); }
  },
  clanJoin: async (id) => { if (await clanCall('clan/join', { id: +id }, '👋 Добро пожаловать в банду!')) { track('clanJoin'); sfx('good'); } },
  clanLeave: () => {
    const go = async () => { await clanCall('clan/leave', {}, 'Ты покинул банду'); CLAN.data = null; S.clan = null; renderCurrent(false); };
    if (tg && tg.showConfirm && tg.initData) tg.showConfirm('Точно выйти из банды? Твои взносы останутся в общаке.', (ok) => ok && go()); else go();
  },
  clanDonate: async (v) => {
    v = +v;
    if (S.money < v) return;
    S.money -= v;
    if (!(await clanCall('clan/donate', { amount: v }, `💰 Вложил ${fmt(v)} ₽ в общак`))) S.money += v;
    else track('clanDonate', v);
    save();
  },
  clanUpgrade: async () => { if (await clanCall('clan/upgrade', {}, '⬆️ Банда прокачана!')) { sfx('levelup'); confetti(60); } },
  clanKick: async (uid) => clanCall('clan/kick', { uid: +uid }, 'Боец выгнан'),
  clanRaid: async (id) => {
    const r = await clanCall('clan/raid', { target: +id });
    if (!r) return;
    track('clanRaid');
    sfx(r.win ? 'win' : 'lose');
    if (r.win) confetti(70);
    resultModal({ emoji: r.win ? '🏴' : '🤕', rays: r.win ? '' : 'bad', title: r.win ? 'Набег удался!' : 'Набег отбит',
      text: `Сила: ${fmt(r.power[0])} против ${fmt(r.power[1])}.<br>${r.win ? `В общак +${fmt(r.loot)} ₽` : `Из общака ушло ${fmt(r.loot)} ₽`}`, btn: 'Ок' });
  },
});
