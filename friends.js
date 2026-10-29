// Друзья в игре (Досуг → Друзья): заявки, список с онлайном, подарки раз в день каждому другу,
// «в гости» — посмотреть, как живёт друг, вызов на бой или КНБ. Сервер — bot/friends.py.
// Кто пришёл по твоему коду, сразу становится другом. За друзей и подарки — достижения и аватарка.

const FRIEND_GIFTS = {
  energy: { emoji: '🥤', name: 'Энергетик', give: () => { S.energy = Math.min(maxEnergy(), S.energy + 30); return '+30 ⚡'; } },
  food: { emoji: '🥟', name: 'Пирожки', give: () => { feed(35); return '+35 🍞'; } },
  bottles: { emoji: '🍾', name: 'Пакет бутылок', give: () => { const n = Math.round(60 * (1 + S.housing * 0.5)); addBottles(n); return `+${n} 🍾`; } },
};
let FR = { data: null, loading: false, at: 0, error: '', requests: 0 };

async function frLoad() {
  if (FR.loading || !onlineOn()) return;
  FR.loading = true;
  try { FR.data = await apiPost('friends/list'); FR.error = ''; S.friendCount = FR.data.friends.length; }
  catch (e) { FR.error = 'Сервер недоступен, попробуй позже'; }
  FR.loading = false; FR.at = Date.now();
  if (currentScreen === 'fun' && TABS.fun === 'friends') renderCurrent(false);
}

// Подарки от друзей и новые заявки — при входе и раз в минуту
async function frClaim() {
  if (document.hidden || !onlineOn() || !LOADED || !S.storySeen) return;
  try {
    const r = await apiPost('friends/claim');
    FR.requests = r.requests || 0;
    if (!r.gifts || !r.gifts.length) return;
    const lines = r.gifts.map((g) => { const k = FRIEND_GIFTS[g.kind]; return k ? `${k.emoji} ${esc(g.from)}: ${k.name} (${k.give()})` : ''; }).filter(Boolean);
    track('friendGiftGot', r.gifts.length);
    save();
    const show = () => { sfx('coin'); resultModal({ emoji: '🎁', title: 'Подарки от друзей!', text: lines.join('<br>'), btn: 'Спасибо!' }); };
    queuePopup('fgift' + Date.now(), 2, show);
  } catch (e) { /* сервер выключен */ }
}
HOOKS.load.push(() => setTimeout(frClaim, 5000));
setInterval(frClaim, 60000);

function frAva(f) { return `<div class="top-ava frame-${esc(f.frame || 'none')}">${avaFace(f.name, f.avatar)}${f.online ? '<i class="online-dot on-ava"></i>' : ''}</div>`; }

EXTRA_TABS.fun.friends = () => {
  if (!onlineOn()) return '<div class="info-card">👥 Друзья работают в игре внутри Telegram.</div>';
  if (!FR.loading && Date.now() - FR.at > 20000) setTimeout(frLoad, 0);
  const d = FR.data;
  const code = typeof REF !== 'undefined' && REF ? REF.code.toUpperCase() : '';
  const head = `<div class="premium-hero friends-hero"><div class="e">👥</div><div><b>Друзья: ${d ? d.friends.length : '…'}${d ? ` из ${d.max}` : ''}</b>
      <p>Дарите друг другу подарки каждый день, ходите в гости, зовите на бой и в КНБ. Кто придёт по твоему коду — сразу станет другом.</p></div></div>
    <div class="code-row"><input id="frCode" placeholder="Код друга (6 букв)" maxlength="6" autocomplete="off"><button class="btn" data-act="frAddCode">Добавить</button></div>
    ${code ? `<div class="info-card">Твой код: <b>${code}</b> — <a data-act="refShare">отправить другу</a></div>` : ''}`;
  if (!d) return head + `<div class="info-card">${FR.error || '⏳ Загружаем друзей…'}</div>`;
  const inc = d.incoming.map((f) => card({ thumb: frAva(f), title: `${userLabel(f.name)} <small>ур. ${f.level}</small>`, desc: 'Хочет дружить',
    btn: `<div class="btn-col"><button class="btn green small" data-act="frAnswer" data-id="1:${f.pid}">Принять</button><button class="btn small" data-act="frAnswer" data-id="0:${f.pid}">Нет</button></div>` })).join('');
  const list = d.friends.map((f) => card({ thumb: frAva(f), title: `${userLabel(f.name)} <small>ур. ${f.level}</small>`,
    desc: `${f.online ? '<b class="online-txt">в игре</b>' : f.seen ? `был ${frAgo(f.seen)}` : ''}${f.house ? ` · ${esc(f.house)}` : ''}`,
    extra: `<div class="duel-btns">
      <button class="btn small ${f.sent ? '' : 'primary'}" data-act="frGiftMenu" data-id="${f.pid}" data-name="${esc(f.name)}" ${f.sent ? 'disabled data-why="Сегодня уже дарил — завтра снова"' : ''}>${f.sent ? '🎁 ✓' : '🎁 Подарок'}</button>
      <button class="btn small" data-act="frVisit" data-id="${f.pid}">🏠 В гости</button>
      <button class="btn small" data-act="duelFight" data-id="${f.pid}">🥊</button>
      <button class="btn small" data-act="duelRpsMenu" data-id="${f.pid}" data-name="${esc(f.name)}">✊</button></div>` })).join('');
  const out = d.outgoing.length ? `<div class="subhead">Ждут ответа</div>${d.outgoing.map((f) => `<div class="fr-out">${frAva(f)}<span>${userLabel(f.name)}</span></div>`).join('')}` : '';
  const giftsLeft = d.friends.filter((f) => !f.sent).length;
  return head + (inc ? `<div class="subhead">Заявки в друзья</div>${inc}` : '')
    + `<div class="subhead">Мои друзья${giftsLeft ? ` · подарков можно отправить: ${giftsLeft}` : ''}</div>`
    + (list || '<div class="info-card">Пока никого. Добавь друга по коду, из топа или из списка «Кто онлайн».</div>') + out;
};
function frAgo(t) { const m = Math.floor((Date.now() / 1000 - t) / 60); return m < 60 ? `${m} мин назад` : m < 1440 ? `${Math.floor(m / 60)} ч назад` : `${Math.floor(m / 1440)} дн назад`; }

// Кнопка «В друзья» в топе и в списке «Кто онлайн»
duelBtns = (function (orig) {
  return (pid, name) => orig(pid, name).replace('</div>', `<button class="btn small" data-act="frAddPid" data-id="${esc(pid)}">➕ В друзья</button></div>`);
})(duelBtns);

Object.assign(ACTIONS, {
  frAddCode: async () => {
    const code = (($('frCode') || {}).value || '').trim().toLowerCase();
    if (!/^[a-z0-9]{6}$/.test(code)) { toast('Код — 6 латинских букв', 'bad'); return; }
    try { const r = await apiPost('friends/add', { code }); frResult(r); } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  frAddPid: async (pid) => {
    try { const r = await apiPost('friends/add', { pid }); frResult(r); } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  frAnswer: async (arg) => {
    const [ok, pid] = arg.split(':');
    try {
      const r = await apiPost('friends/answer', { pid, accept: ok === '1' });
      if (r.error) toast(r.error, 'bad'); else if (ok === '1') { toast('🤝 Теперь вы друзья!', 'good'); sfx('good'); track('friendAdd'); }
      FR.at = 0; frLoad();
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  frGiftMenu: (pid, btn) => {
    openModal(`<h3 style="margin-top:0">🎁 Подарок для ${userLabel(btn.dataset.name || 'друга')}</h3><p>Бесплатно, раз в день каждому другу. Друг получит его при входе в игру.</p>
      <div class="pr-acts">${Object.entries(FRIEND_GIFTS).map(([k, g]) => `<button class="pr-act" data-act="frGift" data-id="${k}:${pid}"><span>${g.emoji}</span><b>${g.name}</b></button>`).join('')}</div>
      <div class="btns"><button class="btn wide" data-act="close">Отмена</button></div>`, { center: true });
  },
  frGift: async (arg) => {
    const [kind, pid] = arg.split(':');
    closeModal();
    try {
      const r = await apiPost('friends/gift', { pid, kind });
      if (r.error) { toast(r.error, 'bad'); return; }
      addXp(5); track('friendGift'); sfx('coin');
      toast(`🎁 ${FRIEND_GIFTS[kind].name} отправлен! +5 опыта`, 'good');
      const f = FR.data && FR.data.friends.find((x) => x.pid === pid);
      if (f) f.sent = true;
      renderCurrent(false); save();
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  frVisit: async (pid) => {
    try {
      const r = await apiPost('friends/visit', { pid });
      if (r.error) { toast(r.error, 'bad'); return; }
      const st = r.stats;
      track('friendVisit');
      openModal(`<div class="fr-visit"><div class="fv-scene"><div class="fv-house">${['🪑', '📦', '⛺', '🏚️', '🏠', '🏢', '🏰'][Math.round(st.housing || 0)] || '🏠'}</div></div>
        <h3>В гостях у ${userLabel(r.name)}</h3><p>${fmt(r.score)} баллов в топе</p>${topStatsHTML(st)}
        <div class="btns" style="flex-direction:column;gap:8px"><button class="btn wide" data-act="frRemove" data-id="${pid}" data-name="${esc(r.name)}">Удалить из друзей</button>
        <button class="btn primary wide" data-act="close">Уйти домой</button></div></div>`, { center: true });
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  frRemove: async (pid, btn) => {
    if (btn.dataset.confirm !== '1') { btn.dataset.confirm = '1'; btn.textContent = `Точно удалить ${btn.dataset.name}?`; btn.classList.add('danger'); return; }
    try { await apiPost('friends/remove', { pid }); closeModal(); toast('Удалён из друзей'); FR.at = 0; frLoad(); } catch (e) { toast(refErrorText(e), 'bad'); }
  },
});
function frResult(r) {
  if (r.error) { toast(r.error, 'bad'); sfx('error'); return; }
  if (r.friends) { toast('🤝 Вы теперь друзья!', 'good'); track('friendAdd'); } else toast('👋 Заявка отправлена — бот сообщит другу', 'good');
  sfx('good');
  if ($('frCode')) $('frCode').value = '';
  FR.at = 0; frLoad();
}

// Достижения и аватарка за дружбу
ACHS.push(
  { id: 'friends', name: 'Душа компании', emoji: '👥', fn: () => S.friendCount || 0, goals: [1, 3, 5, 10, 20], unit: 'друзей' },
  { id: 'fgifts', name: 'Щедрая душа', emoji: '🎁', key: 'friendGift', goals: [5, 30, 100, 300, 1000], unit: 'подарков друзьям' },
  { id: 'fvisits', name: 'Гость дорогой', emoji: '🏠', key: 'friendVisit', goals: [5, 25, 100], unit: 'визитов к друзьям' },
);
AVATARS.push({ id: 'buddy', face: '🫂', name: 'Свой в доску', how: '10 друзей в игре', need: () => (S.friendCount || 0) >= 10 });

// Точка на «Друзьях»: заявки или неотправленные подарки
const _sectionAlertsFr = sectionAlerts;
sectionAlerts = () => { const a = _sectionAlertsFr(); if (a.fun) a.fun.friends = FR.requests > 0 || !!(FR.data && FR.data.friends.some((f) => !f.sent)); return a; };
