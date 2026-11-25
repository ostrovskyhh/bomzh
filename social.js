// Социальное в игре: оплата Telegram Stars, напоминания от бота, приглашение через историю и ссылку,
// чат района (кнопка на главном экране). Всё идёт через сервер в боте (bot/social.py).

function leftText(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m >= 1440) return `${Math.floor(m / 1440)} д ${Math.floor((m % 1440) / 60)} ч`;
  if (m >= 60) return `${Math.floor(m / 60)} ч ${m % 60} мин`;
  return `${m} мин`;
}

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
function storyImage() { return new URL(typeof I18N !== 'undefined' && I18N.lang === 'en' ? 'assets/story-promo-en-450.png' : 'assets/story-promo-446.png', document.baseURI).href; }
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
// Чат района
// =====================================================================

const CHAT_POLL = 2500;
let CHAT = null; // { room, last, timer, admin }

function chatDistrictChannel() {
  const language = typeof I18N !== 'undefined' ? I18N.lang : (S.settings?.language || 'ru');
  S.settings ||= {};
  if (S.settings.chatLanguage !== language || !['ru', 'worldwide'].includes(S.settings.chatChannel)) {
    S.settings.chatLanguage = language;
    S.settings.chatChannel = language === 'en' ? 'worldwide' : 'ru';
  }
  return S.settings.chatChannel;
}
function chatSeenKey(c) { return c.room === 'district' && c.channel === 'worldwide' ? 'district:worldwide' : c.room; }
const CHAT_DRAFTS = {};
document.addEventListener('game-language-change', () => {
  chatDistrictChannel();
  if (CHAT?.room === 'district' && $('chatList')) chatOpen('district');
  if (onlineOn()) chatCheck();
});

function chatOpen() {
  if (!onlineOn()) { toast('Чат работает в игре внутри Telegram', 'bad'); return; }
  if (CHAT && CHAT.timer) clearInterval(CHAT.timer);
  CHAT = { room: 'district', channel: chatDistrictChannel(), last: 0, timer: null, admin: false };
  openModal(`<div class="chat">
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
    const r = await apiPost('chat/list', { room: c.room, channel: c.channel, after: c.last });
    if (CHAT !== c || !$('chatList')) return;
    c.admin = r.admin;
    const list = $('chatList');
    if (r.error && !c.last) { list.innerHTML = `<div class="chat-empty">${esc(r.error)}</div>`; return; }
    if (!c.last) list.innerHTML = r.messages.length ? '' : '<div class="chat-empty">Тут пока тихо. Напиши первым!</div>';
    const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
    for (const m of r.messages) {
      const b = (() => { try { return JSON.parse(m.badge || '{}'); } catch (e) { return {}; } })();
      list.insertAdjacentHTML('beforeend', m.sys ? `<div class="chat-sys">${esc(m.text)}</div>`
        : `<div class="chat-msg ${m.me ? 'me' : ''}"><div class="chat-ava frame-${esc(b.frame || 'none')}">${avaFace(m.name, b.avatar)}</div><div class="chat-bubble">
          <b>${userLabel(m.name)}<small> · ур. ${b.lvl || 1} · ${new Date(m.ts * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</small>${c.admin ? `<i data-act="chatDel" data-id="${m.id}">🗑</i>` : ''}</b>${esc(m.text)}</div></div>`);
      c.last = Math.max(c.last, m.id);
    }
    if (atBottom || r.messages.length) list.scrollTop = list.scrollHeight;
    if (!S.chatSeen) S.chatSeen = {};
    S.chatSeen[chatSeenKey(c)] = Math.max(S.chatSeen[chatSeenKey(c)] || 0, c.last);
    chatBadge();
  } catch (e) { /* сеть моргнула */ }
}

// Непрочитанные — красная точка на кнопке чата
let CHAT_LAST = { district: 0 };
function chatBadge() {
  const b = $('chatBadge');
  if (!b) return;
  const seen = S.chatSeen || {};
  const channel = chatDistrictChannel(), key = channel === 'worldwide' ? 'district:worldwide' : 'district';
  const n = (CHAT_LAST.channels?.[channel] || 0) > (seen[key] || 0);
  b.classList.toggle('hidden', !n);
  $('chatBtn').classList.toggle('hidden', !onlineOn() || !S.storySeen);
}
async function chatCheck() {
  if (!onlineOn()) { chatBadge(); return; }
  try { CHAT_LAST = await apiPost('chat/last', {channel: chatDistrictChannel()}); } catch (e) { /* молчим */ }
  chatBadge();
}
HOOKS.init.push(() => { setTimeout(chatCheck, 3000); setInterval(chatCheck, 60000); });

Object.assign(ACTIONS, {
  openChat: () => chatOpen('district'),
  chatRoom: () => chatOpen(),
  chatChannel: (channel) => {
    if (!['ru', 'worldwide'].includes(channel)) return;
    chatDistrictChannel(); S.settings.chatChannel = channel;
    saveSoon(); chatOpen('district'); chatCheck();
  },
  chatSend: async () => {
    const inp = $('chatText');
    if (!inp || !CHAT) return;
    const c = CHAT;
    const text = inp.value.trim();
    if (!text) return;
    inp.value = '';
    try {
      const r = await apiPost('chat/send', { room: c.room, channel: c.channel, text });
      if (r.error) { toast(r.error, 'bad'); if (CHAT === c && $('chatText') === inp && !inp.value) inp.value = text; return; }
      track('chatMsg');
      if (CHAT === c) chatPoll();
    } catch (e) { toast(refErrorText(e), 'bad'); if (CHAT === c && $('chatText') === inp && !inp.value) inp.value = text; }
  },
  chatDel: async (id) => { try { await apiPost('chat/delete', { id: +id }); const el = document.querySelector(`[data-act="chatDel"][data-id="${id}"]`); if (el) el.closest('.chat-msg').remove(); } catch (e) { toast('Не удалось удалить', 'bad'); } },
});
