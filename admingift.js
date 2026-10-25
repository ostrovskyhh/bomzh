// Админ-меню: подарок конкретному игроку (деньги, уровни, крышки) через сервер.
// Право проверяет сервер по Telegram ID из ADMIN_IDS. Игрок забирает подарок сам — при входе или в течение минуты.

let GIFT = { players: [], pick: null, busy: false };

function giftLevels(n) { for (let i = 0; i < n; i++) addXp(xpNeed(level()) - levelInfo().cur); }

async function giftClaim() {
  if (!onlineOn() || !S.storySeen || !LOADED) return;
  try {
    const { gifts } = await apiPost('gift/claim');
    if (!gifts || !gifts.length) return;
    const lines = [];
    gifts.forEach((g) => {
      if (g.money) { addMoney(g.money); lines.push(`💰 +${fmt(g.money)} ₽`); }
      if (g.caps) { addCaps(g.caps); lines.push(`🟡 +${fmt(g.caps)} крышек`); }
      if (g.levels) { giftLevels(g.levels); lines.push(`⭐ +${g.levels} ур.`); }
      if (g.note) lines.push(`<i>«${esc(g.note)}»</i>`);
    });
    save(true);
    confetti(70); sfx('jackpot');
    const pot = gifts.every((g) => (g.note || '').startsWith('🍲'));
    resultModal({ emoji: pot ? '🍲' : '🎁', title: pot ? 'Котёл банды твой!' : 'Подарок от администрации!', text: lines.join('<br>'), btn: pot ? 'Ура!' : 'Спасибо!' });
  } catch (e) { /* сервер выключен — заберём позже */ }
}
HOOKS.load.push(() => setTimeout(giftClaim, 4000));
setInterval(() => { if (!modalOpen()) giftClaim(); }, 60000);

// ---------- Окно подарка в админке ----------
function giftHTML() {
  const p = GIFT.pick;
  return `<h3>🎁 Подарок игроку</h3>
    <p>Найди игрока по имени или Telegram ID. Работает, если твой Telegram ID записан в <b>ADMIN_IDS</b> в .env.</p>
    <div class="code-row"><input id="giftQuery" placeholder="Имя или ID" autocomplete="off"><button class="btn" data-act="giftFind">Найти</button></div>
    <div id="giftList">${GIFT.players.map((x) => `<button class="btn wide gift-player ${p && p.uid === x.uid ? 'primary' : ''}" data-act="giftPick" data-id="${x.uid}">
      ${x.online ? '<span class="online-dot"></span>' : ''}${esc(x.name)} · ур. ${x.level} · ID ${x.uid}</button>`).join('')}</div>
    ${p ? `<div class="gift-form"><b>Кому: ${esc(p.name)}</b>
      <label>Деньги, ₽<input id="giftMoney" type="number" min="0" inputmode="numeric" placeholder="0"></label>
      <label>Уровни<input id="giftLevels" type="number" min="0" max="100" inputmode="numeric" placeholder="0"></label>
      <label>Крышки<input id="giftCaps" type="number" min="0" inputmode="numeric" placeholder="0"></label>
      <label>Подпись (необязательно)<input id="giftNote" maxlength="120" placeholder="За помощь в тесте!"></label>
      <button class="btn primary wide" data-act="giftSend">🎁 Отправить</button></div>` : ''}
    <div class="btns"><button class="btn wide" data-act="adminMenu">Назад</button></div>`;
}
function openGift() { openModal(giftHTML(), { center: true }); }

openAdmin = (function (orig) {
  return function () {
    orig();
    const grid = document.querySelector('#modalRoot .admin-grid');
    if (grid) grid.insertAdjacentHTML('afterend', '<div class="btns"><button class="btn wide primary" data-act="giftOpen">🎁 Подарок игроку: деньги, уровни, крышки</button></div>');
  };
})(openAdmin);

Object.assign(ACTIONS, {
  giftOpen: () => { if (!S.admin) return; if (!onlineOn()) { toast('Подарки работают в игре внутри Telegram при запущенном сервере', 'bad'); return; } openGift(); },
  giftFind: async () => {
    const q = ($('giftQuery') || {}).value || '';
    if (!q.trim()) { toast('Введи имя или ID', 'bad'); return; }
    try {
      const r = await apiPost('admin/find', { query: q.trim() });
      if (r.error) { toast(r.error, 'bad'); return; }
      GIFT.players = r.players || []; GIFT.pick = GIFT.players.length === 1 ? GIFT.players[0] : null;
      if (!GIFT.players.length) toast('Никого не нашли. Игрок должен хоть раз открыть игру версии 1.8+', 'bad');
      openGift();
      if ($('giftQuery')) $('giftQuery').value = q;
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  giftPick: (uid) => { GIFT.pick = GIFT.players.find((x) => String(x.uid) === String(uid)) || null; openGift(); },
  giftSend: async () => {
    const p = GIFT.pick;
    if (!p || GIFT.busy) return;
    const num = (id) => Math.max(0, Math.floor(+(($(id) || {}).value || 0)) || 0);
    const money = num('giftMoney'), levels = num('giftLevels'), caps = num('giftCaps');
    if (!money && !levels && !caps) { toast('Укажи деньги, уровни или крышки', 'bad'); return; }
    GIFT.busy = true;
    try {
      const r = await apiPost('admin/gift', { uid: p.uid, money, levels, caps, note: ($('giftNote') || {}).value || '' });
      if (r.error) toast(r.error, 'bad');
      else { toast(`🎁 Отправлено: ${r.name}. Бот сообщил ему о подарке`, 'good'); sfx('coin'); GIFT.pick = null; GIFT.players = []; openGift(); }
    } catch (e) { toast(refErrorText(e), 'bad'); }
    GIFT.busy = false;
  },
});
