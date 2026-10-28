// Банды 2.0 (Досуг → Банда): вступить можно с 1 уровня, режим «открытая» или «по приглашению»,
// ссылка-приглашение через бота, отдельный топ банд (Задания → Топ → Банды) и игры:
// между бандами — недельная война за очки и «Стенка на стенку», внутри — задание дня и «Котёл».
// Сервер — bot/gangs.py (+ старые маршруты банд в bot/social.py).

let GANG = { state: undefined, top: null, at: 0, topAt: 0, loading: false, tab: 'main' };
const GANG_POINTS_HELP = 'Очки войны: победа в онлайн-бою +10, в КНБ +5 (со ставкой +7), командная победа +10 участнику, удачный набег +30, взнос в общак +1 за 10 000 ₽ (до 20 в день)';

async function gangLoad(force) {
  if (!onlineOn() || GANG.loading || (!force && Date.now() - GANG.at < 15000)) return;
  GANG.loading = true;
  try { GANG.state = (await apiPost('gang/state')).gang; } catch (e) { GANG.state = GANG.state === undefined ? null : GANG.state; }
  GANG.loading = false; GANG.at = Date.now();
  if (currentScreen === 'fun' && TABS.fun === 'clan') renderCurrent(false);
}
async function gangTopLoad(force) {
  if (!onlineOn() || (!force && Date.now() - GANG.topAt < 20000)) return;
  GANG.topAt = Date.now();
  try { GANG.top = await apiPost('gang/top'); } catch (e) { /* сервер выключен */ }
  if ((currentScreen === 'fun' && TABS.fun === 'clan') || (currentScreen === 'tasks' && TABS.tasks === 'top')) renderCurrent(false);
}
function gangRefresh() { CLAN.at = 0; clanLoad(true); gangLoad(true); gangTopLoad(true); }

// «через 2 д 5 ч» / «через 3 ч 10 мин» — таймеры на часы и дни читаются лучше, чем 299:55
function leftText(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m >= 1440) return `${Math.floor(m / 1440)} д ${Math.floor((m % 1440) / 60)} ч`;
  if (m >= 60) return `${Math.floor(m / 60)} ч ${m % 60} мин`;
  return `${m} мин`;
}

function modeTag(mode) { return mode === 'invite' ? '<span class="gang-mode invite">🔒 по приглашению</span>' : '<span class="gang-mode open">🔓 открытая</span>'; }

function gangListHTML(list, me) {
  if (!list || !list.length) return '<div class="info-card">Банд пока нет — основай первую!</div>';
  return list.map((g) => card({ thumb: `<div class="gang-place p${g.place}">${g.place}</div>`,
    title: `${g.emoji} ${esc(g.name)} <span class="rarity rare">ур. ${g.level}</span>${g.mine ? ' <small>(твоя)</small>' : ''}`,
    desc: `${modeTag(g.mode)} · ${g.members}/${g.max} бойцов<br>⚔️ ${fmt(g.week)} очков войны · ${fmt(g.score)} баллов${g.wins ? ` · 🏆×${g.wins}` : ''}`,
    btn: me === false && !g.mine ? (g.mode === 'invite' ? '<button class="btn small" disabled data-why="Нужна ссылка-приглашение от бойцов банды">🔒</button>'
      : `<button class="btn ${g.members < g.max ? 'primary' : ''}" data-act="clanJoin" data-id="${g.id}" ${g.members < g.max ? '' : 'disabled data-why="Банда заполнена"'}>Вступить</button>`) : '' })).join('');
}

// ---------- Вкладка «Банда» ----------
EXTRA_TABS.fun.clan = () => {
  if (!onlineOn()) return '<div class="info-card">🏴 Банды работают в игре внутри Telegram: нужен общий сервер.</div>';
  setTimeout(() => { clanLoad(); gangLoad(); gangTopLoad(); }, 0);
  if (CLAN.data === undefined) return `<div class="info-card">${CLAN.error || '⏳ Загружаем банды района…'}</div>`;
  const c = CLAN.data, g = GANG.state;
  if (!c) {
    const can = level() >= CLAN_LEVEL_REQ;
    return `<div class="premium-hero clan-hero"><div class="e">🏡</div><div><b>Найди своих — постройте общий двор</b><p>Вступить можно с любого уровня. Стройки, общие истории, личная репутация и награды за участие. Новичкам тоже есть чем помочь! Общак, бонусы, чат и события банды сохраняются.</p></div></div>
      <div class="subhead">Вступить · открытые банды</div>
      ${GANG.top ? gangListHTML(GANG.top.gangs, false) : '<div class="info-card">⏳ Загружаем список банд…</div>'}
      <div class="info-card">🔒 В закрытые банды вступают по ссылке-приглашению — попроси её у любого бойца.</div>
      <div class="subhead">Основать свою</div>
      <div class="info-card"><b>${fmt(CLAN_PRICE)} ₽ + ${CLAN_CAPS} 🟡</b>, с ${CLAN_LEVEL_REQ} уровня. Название должно быть уникальным.
        <div class="code-row"><input id="clanName" maxlength="20" placeholder="Название банды"><select id="clanEmoji">${CLAN_EMOJI.map((e) => `<option>${e}</option>`).join('')}</select></div>
        <div class="seg-mini"><button class="${S.newGangMode !== 'invite' ? 'on' : ''}" data-act="newGangMode" data-id="open">🔓 Вступает кто угодно</button><button class="${S.newGangMode === 'invite' ? 'on' : ''}" data-act="newGangMode" data-id="invite">🔒 Только по приглашению</button></div>
        ${can ? priceBtn('clanCreate', '', CLAN_PRICE, S.money >= CLAN_PRICE && S.caps >= CLAN_CAPS, `Основать · ${fmtShort(CLAN_PRICE)} ₽ + ${CLAN_CAPS} 🟡`).replace('class="btn', 'class="btn wide') : `<button class="btn wide" disabled data-why="Нужен ${CLAN_LEVEL_REQ} уровень">🔒 Основать можно с ${CLAN_LEVEL_REQ} уровня</button>`}</div>`;
  }
  const bonus = Math.round(clanBonus() * 100);
  const head = `<div class="premium-hero clan-hero"><div class="e">${c.emoji}</div><div><b>${esc(c.name)} · ур. ${c.level}</b>${g && g.motto ? `<i class="g-motto">«${esc(g.motto)}»</i>` : ''}
      <p>${g ? modeTag(g.mode) + ' · ' : ''}Общак <b>${fmt(c.treasury)} ₽</b>${bonus ? ` · +${bonus}% к доходу` : ''}<br>${g ? `⚔️ Неделя: <b>${g.place} место</b>, ${fmt(g.week)} очков` : ''}</p></div></div>
    <div class="seg-mini gang-tabs">${[['main', '🏡 Двор'], ['games', '🎲 Игры'], ['crew', `👥 Бойцы ${c.members.length}`]].map(([id, t]) => `<button class="${GANG.tab === id ? 'on' : ''}" data-act="gangTab" data-id="${id}">${t}</button>`).join('')}</div>`;
  if (!g) return head + '<div class="info-card">⏳ Загружаем…</div>';
  return head + (GANG.tab === 'games' ? gangGamesHTML(c, g) : GANG.tab === 'crew' ? gangCrewHTML(c, g) : gangMainHTML(c, g));
};

function gangMainHTML(c, g) {
  return `<div class="online-box gang-invite"><b>📨 Пригласить в банду</b>
      <small>Отправь ссылку другу: бот откроет игру сразу на вступлении${g.mode === 'invite' ? ' — это единственный способ попасть в вашу банду' : ''}.</small>
      ${g.link ? `<div class="btn-row"><button class="btn primary" data-act="gangShare">📨 Отправить ссылку</button><button class="btn" data-act="gangCopy">📋 Копировать</button></div>` : '<small>Ссылка появится, когда бот на связи</small>'}
      ${g.isOwner ? `<div class="seg-mini"><button class="${g.mode === 'open' ? 'on' : ''}" data-act="gangMode" data-id="open">🔓 Кто угодно</button><button class="${g.mode === 'invite' ? 'on' : ''}" data-act="gangMode" data-id="invite">🔒 По приглашению</button></div>` : ''}
        ${g.canManage ? '<button class="btn small" data-act="gangResetLink">🔄 Новая ссылка (старая перестанет работать)</button>' : ''}</div>
    <div class="btn-row"><button class="btn wide" data-act="chatRoom" data-id="clan">💬 Чат банды</button>${g.myRole === 'boss' ? '<button class="btn" data-act="gangEdit">✏️ Банда</button>' : ''}</div>
    <div class="subhead">Скинуться в общак · +1 очко войны за 10 000 ₽</div>
    <div class="btn-row">${[1000, 10000, 100000, 1000000].map((v) => priceBtn('clanDonate', v, v, S.money >= v, `+${fmtShort(v)}`).replace('class="btn', 'class="btn small')).join('')}</div>
    ${c.nextCost ? `<div class="info-card">Уровень ${c.level + 1}: бонус +${CLAN_BONUS * 100 * c.level}% ко всем доходам банды. Стоит <b>${fmt(c.nextCost)} ₽</b> из общака.
      ${c.isOwner ? `<button class="btn ${c.treasury >= c.nextCost ? 'primary' : ''} wide" data-act="clanUpgrade" ${c.treasury >= c.nextCost ? '' : `disabled data-why="В общаке не хватает ${fmt(c.nextCost - c.treasury)} ₽"`}>⬆️ Прокачать банду</button>` : '<small>Прокачивает главарь.</small>'}</div>` : '<div class="info-card">👑 Банда максимального уровня!</div>'}
    <button class="btn wide" data-act="clanLeave" style="color:var(--red)">Покинуть банду</button>`;
}

function gangGamesHTML(c, g) {
  const t = g.task, p = g.pot;
  const others = (GANG.top ? GANG.top.gangs : []).filter((x) => !x.mine);
  const taskDone = t.progress >= t.goal;
  return `<div class="gang-game"><div class="gg-head"><span>🎯</span><div><b>Задание дня банды</b><small>Наберите вместе ${t.goal} очков войны — каждый боец получит 🟡 1 крышку и деньги</small></div></div>
      <div class="progress"><div style="width:${Math.min(100, (t.progress / t.goal) * 100)}%"></div></div><small>${t.progress} / ${t.goal}</small>
      ${t.claimed ? '<button class="btn wide" disabled>✅ Награда получена</button>' : `<button class="btn ${taskDone ? 'primary' : ''} wide" data-act="gangTask" ${taskDone ? '' : 'disabled data-why="Банда ещё не набрала очки"'}>🎁 Забрать награду</button>`}</div>
    <div class="gang-game pot"><div class="gg-head"><span>🍲</span><div><b>«Котёл» банды</b><small>Билет ${fmt(p.price)} ₽. В ${new Date(p.drawAt * 1000).toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit' })} по Москве один боец забирает 90% котла, 10% — в общак</small></div></div>
      <div class="pot-sum">В котле: <b>${fmt(p.players.length * p.price)} ₽</b> · участников ${p.players.length}${p.players.length ? `<br><small>${p.players.map(esc).join(', ')}</small>` : ''}</div>
      <small>Розыгрыш через ${leftText(p.drawAt * 1000 - Date.now())}${p.last ? ` · прошлый выиграл ${esc(p.last.winner)} (${fmt(p.last.prize)} ₽)` : ''}</small>
      ${p.joined ? '<button class="btn wide" disabled>✅ Ты в котле</button>' : priceBtn('gangPot', '', p.price, S.money >= p.price, `🍲 Кинуть ${fmt(p.price)} ₽ в котёл`).replace('class="btn', 'class="btn wide')}</div>
    <div class="gang-game war"><div class="gg-head"><span>⚔️</span><div><b>Война банд · ${g.place} место</b><small>Неделя кончится через ${leftText((GANG.top ? GANG.top.warEnds : 0) * 1000 - Date.now())}. Призы в общак: ${(GANG.top ? GANG.top.prizes : []).map((v, i) => `${['🥇', '🥈', '🥉'][i]} ${fmtShort(v)}`).join(' ')}</small></div></div>
      <small>${GANG_POINTS_HELP}</small><button class="btn wide" data-act="gangTop">🏆 Топ банд</button></div>
    <div class="info-card"><b>🥊 Командные встречи теперь во дворе</b><p>Добровольные роли, равный подбор и понятные отчёты. Общак и постройки не теряются.</p><button class="btn primary wide" data-act="districtOpen">Двор → Сходки</button></div>
    <div class="subhead">⚔️ Набеги на другие банды</div>
    ${others.slice(0, 15).map((x) => card({ thumb: x.emoji, title: esc(x.name), desc: `ур. ${x.level} · ${x.members} бойцов · сила ${fmt(x.power)}${x.shield ? ' · 🛡️' : ''}`,
      btn: g.canManage ? `<div class="btn-col">        <button class="btn small" data-act="clanRaid" data-id="${x.id}" ${c.raidLeft || x.shield ? `disabled data-why="${x.shield ? 'Банда под защитой после набега' : 'Набег — раз в 12 часов'}"` : ''}>⚔️ Набег</button></div>` : '' })).join('') || '<div class="info-card">Других банд пока нет.</div>'}`;
}

function gangAgo(ts) { if (!ts) return 'давно'; const s = Date.now() / 1000 - ts; return s < 120 ? 'в игре' : s < 3600 ? `${Math.round(s / 60)} мин назад` : s < 86400 ? `${Math.round(s / 3600)} ч назад` : `${Math.round(s / 86400)} дн. назад`; }
const GANG_ROLE = { boss: '👑 Главарь', deputy: '⭐ Зам', member: '' };
// Боец банды (3.5): роль, когда заходил, сколько в банде и скинул в общак. Кнопки управления — главарю и замам,
// у каждого бойца, даже если он пришёл по ссылке и ни разу не заходил в онлайн-бои
function gangCrewHTML(c, g) {
  const boss = g.myRole === 'boss';
  const deps = g.members.filter((m) => m.role === 'deputy').length;
  return `<div class="info-card">Спарринг внутри банды: вызывай своих на бой или КНБ — победы приносят банде очки войны.${g.canManage ? `<br>${boss ? '👑 Ты главарь: можешь выгнать любого, назначить до ' + g.maxDeputies + ' замов и передать главарство.' : '⭐ Ты зам: можешь выгонять рядовых бойцов, выводить банду на стенку и в набег.'}` : ''}</div>`
    + g.members.map((m) => {
      const days = m.joined ? Math.max(0, Math.floor((Date.now() / 1000 - m.joined) / 86400)) : 0;
      const duel = !m.me && m.pid ? `<button class="btn small primary" data-act="duelFight" data-id="${esc(m.pid)}">🥊 Спарринг</button><button class="btn small" data-act="duelRpsMenu" data-id="${esc(m.pid)}" data-name="${esc(m.name)}">✊ КНБ</button>` : '';
      const canKick = !m.me && g.canManage && m.role !== 'boss' && (boss || m.role === 'member');
      const manage = [
        canKick ? `<button class="btn small danger" data-act="gangKick" data-id="${m.uid}" data-name="${esc(m.name)}">🚪 Выгнать</button>` : '',
        boss && !m.me ? (m.role === 'deputy' ? `<button class="btn small" data-act="gangRole" data-id="${m.uid}:member">⬇️ Снять зама</button>` : `<button class="btn small" data-act="gangRole" data-id="${m.uid}:deputy" ${deps >= g.maxDeputies ? `disabled data-why="Замов уже ${g.maxDeputies}"` : ''}>⭐ В замы</button>`) : '',
        boss && !m.me ? `<button class="btn small" data-act="gangTransfer" data-id="${m.uid}" data-name="${esc(m.name)}">👑 Передать</button>` : '',
      ].join('');
      return card({ thumb: `<div class="top-ava frame-${esc(m.frame || 'none')}">${avaFace(m.name, m.avatar)}${m.online ? '<i class="online-dot on-ava"></i>' : ''}</div>`,
        title: `${GANG_ROLE[m.role] ? `<span class="g-role ${m.role}">${GANG_ROLE[m.role]}</span> ` : ''}${esc(m.name)}${m.me ? ' (ты)' : ''} <small>ур. ${m.level}</small>`,
        desc: `⚔️ ${m.week} очков за неделю · ${m.online ? '<b class="online-txt">в игре</b>' : `был ${gangAgo(m.seen)}`}<br><small>в банде ${days} дн.${m.donated ? ` · в общак ${fmtShort(m.donated)} ₽` : ''}</small>`,
        extra: duel || manage ? `<div class="duel-btns">${duel}${manage}</div>` : '' });
    }).join('');
}

function gangEditModal() {
  const c = CLAN.data, g = GANG.state;
  if (!c || !g) return;
  const emojis = ['🏴', '💀', '🐺', '🦅', '🐍', '👊', '🔥', '⚡', '🐻', '🦈', '🃏', '🍾', '👑', '🌵', '🐉', '🚬'];
  openModal(`<h3>✏️ Банда</h3>
    <label class="g-edit">Название<input id="geName" maxlength="20" value="${esc(c.name)}"></label>
    <div class="g-emoji">${emojis.map((e) => `<button class="${e === c.emoji ? 'on' : ''}" data-act="gangEditEmoji" data-id="${e}">${e}</button>`).join('')}</div>
    <label class="g-edit">Девиз (видят все бойцы)<input id="geMotto" maxlength="80" value="${esc(g.motto || '')}" placeholder="Своих не бросаем"></label>
    <div class="btns"><button class="btn primary wide" data-act="gangEditSave">💾 Сохранить</button><button class="btn wide" data-act="close">Отмена</button></div>`, { center: true });
  GANG.editEmoji = c.emoji;
}

function gangConfirm(text, fn) { if (tg && tg.showConfirm) tg.showConfirm(text, (ok) => ok && fn()); else if (confirm(text)) fn(); }
async function gangCall(path, body, okText) {
  try {
    const r = await apiPost(path, body);
    if (r.error) { toast(r.error, 'bad'); return null; }
    if (okText) toast(okText, 'good');
    await gangLoad(true);
    if (typeof clanLoad === 'function') clanLoad(true);
    renderCurrent(false);
    return r;
  } catch (e) { toast(refErrorText(e), 'bad'); return null; }
}
Object.assign(ACTIONS, {
  gangKick: (uid, btn) => { const name = btn && btn.dataset.name; gangConfirm(`Выгнать ${name || 'бойца'} из банды? Вернуться по ссылке он сможет только через сутки`, () => gangCall('gang/kick', { uid: +uid }, `🚪 ${name || 'Боец'} выгнан`)); },
  gangRole: (arg) => { const [uid, role] = arg.split(':'); gangCall('gang/role', { uid: +uid, role }, role === 'deputy' ? '⭐ Назначен замом' : 'Больше не зам'); },
  gangTransfer: (uid, btn) => { const name = btn && btn.dataset.name; gangConfirm(`Передать главарство ${name || 'бойцу'}? Ты станешь замом`, () => gangCall('gang/transfer', { uid: +uid }, `👑 Теперь главарь — ${name}`)); },
  gangEdit: () => gangEditModal(),
  gangEditEmoji: (e, btn) => { GANG.editEmoji = e; document.querySelectorAll('.g-emoji button').forEach((b) => b.classList.toggle('on', b === btn)); },
  gangEditSave: async () => {
    const r = await gangCall('gang/edit', { name: ($('geName') || {}).value || '', emoji: GANG.editEmoji, motto: ($('geMotto') || {}).value || '' }, '✏️ Банда обновлена');
    if (r) closeModal();
  },
});

// ---------- Топ: переключатель «Игроки / Банды» ----------
const _topTabGang = EXTRA_TABS.tasks.top;
EXTRA_TABS.tasks.top = function topWithGangs() {
  const sw = `<div class="seg-mini top-switch"><button class="${S.topMode !== 'gangs' ? 'on' : ''}" data-act="topMode" data-id="players">👤 Игроки</button><button class="${S.topMode === 'gangs' ? 'on' : ''}" data-act="topMode" data-id="gangs">🏴 Банды</button></div>`;
  if (S.topMode !== 'gangs' || !onlineOn()) return sw + _topTabGang();
  setTimeout(() => gangTopLoad(), 0);
  const t = GANG.top;
  if (!t) return sw + '<div class="info-card">⏳ Загружаем топ банд…</div>';
  return sw + `<div class="premium-hero top-hero"><div class="e">🏴</div><div><b>Война банд · ${t.total} банд</b>
      <p>Места — по очкам войны за неделю. Неделя кончится через ${leftText(t.warEnds * 1000 - Date.now())}. Призы: 🥇 ${fmtShort(t.prizes[0])} · 🥈 ${fmtShort(t.prizes[1])} · 🥉 ${fmtShort(t.prizes[2])} в общак</p></div></div>
    <details class="top-why"><summary>Как банды получают очки</summary><div class="info-card">${GANG_POINTS_HELP}</div></details>`
    + gangListHTML(t.gangs, !!CLAN.data ? true : false);
};

// ---------- Ссылка-приглашение: игра открыта с ?gang=ТОКЕН ----------
let GANG_LINK = '';
try { GANG_LINK = new URLSearchParams(location.search).get('gang') || ''; } catch (e) { /* нет адреса */ }
HOOKS.load.push(() => {
  if (!GANG_LINK) return;
  setTimeout(async () => {
    if (!onlineOn()) return;
    try {
      const r = await apiPost('gang/preview', { token: GANG_LINK });
      if (r.error) { toast(r.error, 'bad'); return; }
      const x = r.gang;
      closeModal();
      openModal(`<div class="duel-call"><div class="dc-glow"></div><div class="dc-icon">${x.emoji}</div>
        <h3>Приглашение в банду «${esc(x.name)}»</h3>
        <p>ур. ${x.level} · ${x.members}/${x.max} бойцов · ⚔️ ${fmt(x.week)} очков войны за неделю</p>
        ${r.same ? '<p class="test-note">Ты уже в этой банде 😉</p><div class="btns"><button class="btn wide" data-act="close">Ок</button></div>'
          : `${r.already ? '<p class="test-note">Чтобы вступить, сначала выйди из своей банды</p>' : ''}
          <div class="btns" style="flex-direction:column;gap:8px"><button class="btn primary wide big-accept" data-act="gangJoinLink" ${r.already ? 'disabled' : ''}>🏴 Вступить</button>
          <button class="btn wide" data-act="close">Не сейчас</button></div>`}</div>`, { center: true });
    } catch (e) { /* сервер выключен */ }
  }, 2500);
});

Object.assign(ACTIONS, {
  gangTab: (id) => { GANG.tab = id; renderCurrent(false); },
  topMode: (id) => { S.topMode = id; renderCurrent(false); },
  gangTop: () => { S.topMode = 'gangs'; showScreen('tasks', 'top'); },
  newGangMode: (id) => { S.newGangMode = id; renderCurrent(false); },
  gangMode: async (mode) => {
    try { const r = await apiPost('gang/mode', { mode }); if (r.error) { toast(r.error, 'bad'); return; } toast(mode === 'invite' ? '🔒 Теперь только по приглашению' : '🔓 Вступить может любой', 'good'); gangRefresh(); } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  gangResetLink: async () => {
    try { const r = await apiPost('gang/reset_link'); if (r.error) toast(r.error, 'bad'); else { toast('🔄 Новая ссылка готова', 'good'); gangRefresh(); } } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  gangShare: () => {
    const g = GANG.state;
    if (!g || !g.link) return;
    const text = `Вступай в мою банду «${g.name}» в «Симуляторе бомжа»! 🏴`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(g.link)}&text=${encodeURIComponent(text)}`;
    if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, '_blank');
    track('gangInvite');
  },
  gangCopy: async () => {
    const g = GANG.state;
    if (!g || !g.link) return;
    try { await navigator.clipboard.writeText(g.link); toast('Ссылка скопирована', 'good'); } catch (e) { toast(g.link); }
  },
  gangJoinLink: async () => {
    try {
      const r = await apiPost('gang/join_link', { token: GANG_LINK });
      closeModal();
      if (r.error) { toast(r.error, 'bad'); return; }
      GANG_LINK = '';
      track('clanJoin'); sfx('good'); confetti(50);
      toast(`🏴 Добро пожаловать в «${r.name}»!`, 'good');
      gangRefresh();
      showScreen('fun', 'clan');
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  gangTask: async () => {
    try {
      const r = await apiPost('gang/task_claim');
      if (r.error) { toast(r.error, 'bad'); return; }
      const m = r.moneyK * capRate();
      addCaps(r.caps); addMoney(m); save();
      sfx('coin'); confetti(40);
      toast(`🎯 Задание банды: +${r.caps} 🟡 и ${fmt(m)} ₽`, 'good');
      gangLoad(true);
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  gangPot: async () => {
    const price = GANG.state && GANG.state.pot.price;
    if (!price || S.money < price) return;
    S.money -= price;
    try {
      const r = await apiPost('gang/pot_join');
      if (r.error) { S.money += price; toast(r.error, 'bad'); return; }
      sfx('coin'); toast('🍲 Ты в котле! Удачи в розыгрыше', 'good'); track('gangPot'); save();
      gangLoad(true);
    } catch (e) { S.money += price; toast(refErrorText(e), 'bad'); }
  },
  gangWall: async (id) => {
    try {
      const r = await apiPost('gang/wall', { target: +id });
      if (r.error) { toast(r.error, 'bad'); return; }
      track('gangWall');
      const rows = r.bouts.map((b, i) => `<div class="wall-bout ${b.win}" style="animation-delay:${i * 0.35}s"><span>${esc(b.a)}</span><b>${b.win === 'a' ? '✅' : '❌'}</b><span>${esc(b.b)}</span></div>`).join('');
      openModal(`<div class="wall"><h3>🧱 Стенка: ${esc(S.clan ? S.clan.name : '')} vs ${r.enemy.emoji} ${esc(r.enemy.name)}</h3>
        <div class="wall-bouts">${rows}</div>
        <div class="wall-result ${r.win ? 'win' : 'lose'}" style="animation-delay:${r.bouts.length * 0.35 + 0.2}s">${r.win ? '🏆 Победа' : '🤕 Поражение'} ${r.score[0]}:${r.score[1]}${r.stake ? `<br><small>${r.win ? '+' : '−'}${fmt(r.stake)} ₽ ${r.win ? 'в общак' : 'из общака'}</small>` : ''}</div>
        <div class="btns"><button class="btn primary wide" data-act="close">Ок</button></div></div>`, { center: true });
      setTimeout(() => { sfx(r.win ? 'win' : 'lose'); if (r.win) confetti(60); }, r.bouts.length * 350 + 200);
      gangRefresh();
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
});

// Создание банды: сразу ставим выбранный режим
const _clanCreateGang = ACTIONS.clanCreate;
ACTIONS.clanCreate = async () => {
  const before = CLAN.data;
  await _clanCreateGang();
  if (!before && S.newGangMode === 'invite') { try { await apiPost('gang/mode', { mode: 'invite' }); } catch (e) { /* не страшно */ } }
  gangRefresh();
};
['clanJoin', 'clanLeave', 'clanKick', 'clanRaid', 'clanDonate', 'clanUpgrade'].forEach((k) => {
  const f = ACTIONS[k];
  ACTIONS[k] = async (...a) => { const r = await f(...a); setTimeout(() => { gangLoad(true); gangTopLoad(true); }, 600); return r; };
});
HOOKS.init.push(() => setTimeout(() => gangLoad(true), 5000));
