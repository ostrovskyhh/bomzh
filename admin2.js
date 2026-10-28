// Админ-меню 3.0: вкладки вместо одной кучи кнопок, свои суммы, переход по главам и городам,
// запуск любой мини-игры для проверки, состояние сервера, копия сохранения. Видно только админу.

let ADM_TAB = 'hero';
const ADM_TABS = [['hero', '🧑 Я'], ['players', '👥 Игроки'], ['world', '🎮 Мир'], ['server', '🌐 Сервер'], ['save', '💾 Сейв']];

function admHero() {
  const li = levelInfo();
  return `<div class="adm-stats"><span>💰 ${fmt(S.money)} ₽</span><span>🟡 ${fmt(S.caps)}</span><span>⭐ ур. ${li.level}</span><span>📍 ${cityName()}</span><span>👑 VIP ${isVip() ? 'до ' + new Date(S.vipUntil).toLocaleDateString('ru-RU') : 'нет'}</span></div>
    <div class="adm-row"><input id="admMoney" type="number" inputmode="numeric" placeholder="Сумма ₽ (можно с минусом)"><button class="btn primary" data-act="adm2" data-id="money">₽</button></div>
    <div class="adm-row"><input id="admCaps" type="number" inputmode="numeric" placeholder="Крышки"><button class="btn primary" data-act="adm2" data-id="caps">🟡</button></div>
    <div class="adm-row"><input id="admLevel" type="number" inputmode="numeric" placeholder="Уровень (стать таким)" value="${li.level}"><button class="btn primary" data-act="adm2" data-id="level">⭐</button></div>
    <div class="admin-grid">
      <button class="btn" data-act="adm" data-id="m100k">+100 000 ₽</button><button class="btn" data-act="adm" data-id="m10m">+10 млн ₽</button>
      <button class="btn" data-act="adm" data-id="bars">Полные шкалы</button><button class="btn" data-act="adm" data-id="cure">Вылечить всё</button>
      <button class="btn" data-act="adm" data-id="cd">Сбросить таймеры</button><button class="btn" data-act="adm2" data-id="vip">+30 дней VIP</button>
      <button class="btn" data-act="adm2" data-id="stats100">Форма и сила 100</button><button class="btn" data-act="adm2" data-id="debtClear">Списать долги</button>
      <button class="btn" data-act="adm2" data-id="caseItem">🎁 Вещь из кейса</button><button class="btn" data-act="adm2" data-id="caseLegend">👑 Легенда из кейса</button>
      <button class="btn" data-act="adm2" data-id="pets">🐾 Все питомцы</button><button class="btn" data-act="adm2" data-id="fleaClear">🧹 Очистить барахолку</button>
    </div>
    <button class="btn primary wide" data-act="adm" data-id="all">🔓 Открыть всё (40 ур., всё куплено)</button>`;
}

function admWorld() {
  const list = questList(), cur = S.quest.idx;
  return `<div class="subhead">📖 Сюжет · ${cityName()}</div>
    <div class="adm-row"><select id="admChapter">${list.map((q, i) => `<option value="${i}" ${i === cur ? 'selected' : ''}>${i + 1}. ${q.title}${q.path ? (q.path === 'honest' ? ' 😇' : ' 😈') : ''}</option>`).join('')}</select><button class="btn primary" data-act="adm2" data-id="chapter">Перейти</button></div>
    <div class="admin-grid"><button class="btn" data-act="adm" data-id="quest">Пропустить главу</button><button class="btn" data-act="adm2" data-id="path">Сменить путь (${S.quest.path === 'dark' ? '😈' : '😇'})</button></div>
    <div class="subhead">🏙️ Города</div>
    <div class="admin-grid"><button class="btn" data-act="adm2" data-id="cityZas">В Засранск</button><button class="btn" data-act="adm2" data-id="cityMsk">В Москвабад</button><button class="btn" data-act="adm2" data-id="cityMex">В Мексику 🌵</button><button class="btn" data-act="adm2" data-id="cityFr">Во Францию 🇫🇷</button>
      <button class="btn" data-act="adm2" data-id="moveTest">Окно переезда</button><button class="btn" data-act="adm2" data-id="chapterCard">Экран «Глава II»</button></div>
    <div class="subhead">🎮 Любая мини-игра работы (без оплаты)</div>
    <div class="adm-row"><select id="admGame">${JOBS.map((j) => `<option value="${j.id}">${j.emoji} ${j.name} — ${(JOB_GAMES[j.id] || {}).title || ''}</option>`).join('')}</select><button class="btn primary" data-act="adm2" data-id="game">▶</button></div>
    <div class="subhead">🎲 События</div>
    <div class="admin-grid"><button class="btn" data-act="adm2" data-id="event">Уличное событие</button><button class="btn" data-act="adm2" data-id="tip">Окно «Поддержи»</button>
      <button class="btn" data-act="adm2" data-id="news">Окно «Что нового»</button><button class="btn" data-act="adm2" data-id="tut">Обучение заново</button>
      <button class="btn" data-act="adm2" data-id="night">🌙 Ночь казино на 10 мин</button></div>`;
}

function admServer() {
  const uid = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : '—';
  return `<div class="info-card">Твой Telegram ID: <b>${uid}</b><br>Сервер: <b>${typeof REF_API !== 'undefined' && REF_API ? esc(REF_API.replace('https://', '')) : 'не настроен'}</b><br>Счётчик сохранений: <b>${S.rev || 0}</b></div>
    <div id="admPing" class="info-card">Нажми «Проверить», чтобы опросить сервер</div>
    <div class="btns" style="flex-direction:column;gap:8px">
      <button class="btn wide" data-act="adm2" data-id="ping">📡 Проверить сервер</button>
      <button class="btn wide" data-act="adm2" data-id="overview">📊 Сводка: игроки, онлайн, богачи</button>
      <button class="btn wide dark-path" data-act="adm2" data-id="tourReset">🏆 Сбросить текущий турнир (вернуть взносы)</button>
      <button class="btn wide primary" data-act="giftOpen">🎁 Подарок игроку: деньги, уровни, крышки</button>
      <button class="btn wide primary" data-act="bcOpen">📢 Рассылка всем игрокам</button>
      <small style="color:var(--muted);text-align:center">Анонс обновления заново — команда /sendnews боту</small></div>`;
}

function admSave() {
  return `<div class="info-card">Копия сохранения — для поддержки игроков и переноса прогресса. Вставка заменит текущий прогресс!</div>
    <textarea id="admSaveText" class="adm-save" placeholder="Сюда можно вставить сохранение"></textarea>
    <div class="admin-grid"><button class="btn" data-act="adm2" data-id="saveCopy">📋 Скопировать моё</button><button class="btn dark-path" data-act="adm2" data-id="saveLoad">⚠️ Загрузить вставленное</button></div>
    <button class="btn wide" data-act="adm" data-id="off">Выйти из админки</button>`;
}

openAdmin = function () {
  const body = { hero: admHero, players: admPlayers, world: admWorld, server: admServer, save: admSave }[ADM_TAB]();
  openModal(`<h3>🛠️ Админ-меню</h3>
    <div class="adm-tabs">${ADM_TABS.map(([id, t]) => `<button class="${id === ADM_TAB ? 'on' : ''}" data-act="admTab" data-id="${id}">${t}</button>`).join('')}</div>
    <div class="adm-body">${body}</div>
    <div class="btns"><button class="btn wide" data-act="settings">Назад</button></div>`, { center: true });
};

// ---------- Игроки: найти, посмотреть, изменить прогресс ----------
let ADMP = { list: [], card: null };
function admAgo(ts) { if (!ts) return 'давно'; const s = Date.now() / 1000 - ts; return s < 120 ? 'онлайн' : s < 3600 ? `${Math.round(s / 60)} мин назад` : s < 86400 ? `${Math.round(s / 3600)} ч назад` : `${Math.round(s / 86400)} дн. назад`; }
function admPlayers() {
  if (!onlineOn()) return '<div class="info-card">Управление игроками работает в игре внутри Telegram</div>';
  const c = ADMP.card;
  const list = ADMP.list.map((x) => `<button class="btn wide gift-player ${c && c.uid === x.uid ? 'primary' : ''}" data-act="admPick" data-id="${x.uid}">${x.online ? '<span class="online-dot"></span>' : ''}${esc(x.name)} · ур. ${x.level} · ${x.uid}</button>`).join('');
  let card = '';
  if (c) {
    const sv = c.save || {}, st = c.stats || {}, bans = c.bans || {};
    const banTxt = (k) => (bans[k] ? (bans[k] > 2e9 ? 'навсегда' : `до ${new Date(bans[k] * 1000).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`) : '');
    card = `<div class="adm-card"><b>${esc(c.name)}</b> <small>ID ${c.uid} · ${admAgo(c.seen)}${c.pending ? ` · ждут команды: ${c.pending}` : ''}</small>
      <div class="adm-stats"><span>⭐ ур. ${st.level || '?'}</span><span>💰 ${fmt(sv.money || 0)}</span><span>🟡 ${fmt(sv.caps || 0)}</span><span>📍 ${esc(st.city_name || '—')}</span>
        <span>🏆 ${c.place ? `${c.place}-й в топе` : 'не в топе'} · ${fmt(c.score || 0)}</span><span>👑 ${sv.vip > Date.now() ? 'VIP' : 'без VIP'}</span>${sv.debt ? `<span>🧾 долг ${fmt(sv.debt)}</span>` : ''}</div>
      <div class="adm-row"><input id="admPN" type="number" inputmode="numeric" placeholder="Число (можно с минусом)">
        <select id="admPT"><option value="money">₽ деньги ±</option><option value="caps">🟡 крышки ±</option><option value="levels">⭐ +уровни</option><option value="setlevel">⭐ сделать уровень</option><option value="vip">👑 VIP, дней</option></select>
        <button class="btn primary" data-act="admCmd" data-id="num">OK</button></div>
      <div class="admin-grid"><button class="btn" data-act="admCmd" data-id="heal">❤️ Вылечить, шкалы</button><button class="btn" data-act="admCmd" data-id="debts">🧾 Списать долги</button></div>
      <div class="adm-row"><input id="admNote" maxlength="300" placeholder="Сообщение игроку (придёт от бота и в игре)"><button class="btn" data-act="admCmd" data-id="note">📨</button></div>
      <div class="subhead">🔇 Чат ${banTxt('chat') ? `<small>· мут ${banTxt('chat')}</small>` : ''}</div>
      <div class="admin-grid"><button class="btn" data-act="admBan" data-id="chat:60">1 час</button><button class="btn" data-act="admBan" data-id="chat:1440">Сутки</button><button class="btn" data-act="admBan" data-id="chat:-1">Навсегда</button><button class="btn" data-act="admBan" data-id="chat:0">Снять</button></div>
      <div class="subhead">🏆 Топ ${banTxt('top') ? `<small>· скрыт ${banTxt('top')}</small>` : ''}</div>
      <div class="admin-grid"><button class="btn" data-act="admBan" data-id="top:-1">Убрать из топа</button><button class="btn" data-act="admBan" data-id="top:0">Вернуть в топ</button></div>
      <button class="btn wide dark-path" data-act="admCmd" data-id="wipe">⚠️ Обнулить прогресс игрока</button>
      <small class="test-note">Команды выполнятся в игре игрока при следующем входе или в течение минуты</small></div>`;
  }
  return `<div class="adm-row"><input id="admPQ" placeholder="Имя, Telegram ID или код друга" autocomplete="off"><button class="btn primary" data-act="admFind">Найти</button></div>
    ${list ? `<div class="adm-plist">${list}</div>` : ''}${card}`;
}
async function admLoadCard(uid) {
  try {
    const r = await apiPost('admin/player', { uid });
    if (r.error) { toast(r.error, 'bad'); return; }
    ADMP.card = r; ADM_TAB = 'players'; openAdmin();
  } catch (e) { toast(refErrorText(e), 'bad'); }
}
function admConfirm(text, fn) {
  if (tg && tg.showConfirm) tg.showConfirm(text, (ok) => ok && fn()); else if (confirm(text)) fn();
}
async function admOverview() {
  try {
    const r = await apiPost('admin/overview');
    if (r.error) { toast(r.error, 'bad'); return; }
    $('admPing').innerHTML = `👥 Игроков: <b>${r.players}</b> · онлайн <b>${r.online}</b> · за сутки ${r.day} · за неделю ${r.week}<br>🔇 Запретов: ${r.bans} · команд в очереди: ${r.pending}
      <br><b>💰 Самые богатые:</b> ${r.rich.map((x) => `<a data-act="admOpen" data-id="${x.uid}">${esc(x.name)}</a> ${fmt(x.money)} ₽`).join(' · ')}
      <br><b>🕘 Недавно заходили:</b> ${r.recent.map((x) => `<a data-act="admOpen" data-id="${x.uid}">${esc(x.name)}</a> (${admAgo(x.seen)})`).join(' · ')}`;
  } catch (e) { toast(refErrorText(e), 'bad'); }
}
Object.assign(ACTIONS, {
  admFind: async () => {
    const q = (($('admPQ') || {}).value || '').trim();
    if (!q) { toast('Введи имя или ID', 'bad'); return; }
    try {
      const r = await apiPost('admin/find', { query: q });
      if (r.error) { toast(r.error, 'bad'); return; }
      ADMP.list = r.players || []; ADMP.card = null;
      if (!ADMP.list.length) toast('Никого не нашли', 'bad');
      if (ADMP.list.length === 1) { admLoadCard(ADMP.list[0].uid); return; }
      openAdmin(); if ($('admPQ')) $('admPQ').value = q;
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  admPick: (uid) => admLoadCard(+uid),
  admOpen: (uid) => { ADMP.list = []; admLoadCard(+uid); },
  admCmd: (kind) => {
    const c = ADMP.card;
    if (!c) return;
    let cmd = { type: kind };
    if (kind === 'num') cmd = { type: ($('admPT') || {}).value, n: Math.trunc(+(($('admPN') || {}).value || 0)) };
    if (kind === 'note') cmd.text = ($('admNote') || {}).value || '';
    const send = async () => {
      try {
        const r = await apiPost('admin/cmd', { uid: c.uid, cmd });
        toast(r.error || `✅ Отправлено: ${r.name}`, r.error ? 'bad' : 'good');
        if (!r.error) admLoadCard(c.uid);
      } catch (e) { toast(refErrorText(e), 'bad'); }
    };
    if (kind === 'wipe') admConfirm(`Обнулить весь прогресс игрока ${c.name}? Это нельзя отменить`, send); else send();
  },
  admBan: async (arg) => {
    const c = ADMP.card;
    if (!c) return;
    const [kind, minutes] = arg.split(':');
    try {
      const r = await apiPost('admin/ban', { uid: c.uid, kind, minutes: +minutes });
      toast(r.error || '✅ Готово', r.error ? 'bad' : 'good');
      if (!r.error) admLoadCard(c.uid);
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
});

async function admPing() {
  const out = [];
  const t0 = Date.now();
  try { const r = await fetch(`${REF_API}/api/health`, { headers: { 'ngrok-skip-browser-warning': '1' } }); out.push(`✅ Сервер жив · ${Date.now() - t0} мс${r.ok ? '' : ` (HTTP ${r.status})`}`); } catch (e) { out.push('❌ Сервер не отвечает'); }
  if (onlineOn()) {
    try { const c = await apiPost('crash/state'); out.push(`🚀 Ракета: раунд ${c.id}, ${c.phase}, ставок ${c.count}`); } catch (e) { out.push('🚀 Ракета: нет ответа'); }
    try { const t = await apiPost('tour/state'); out.push(`🏆 Турнир: ${t.phase === 'open' ? `идёт, участников ${t.count}, банк ${fmt(t.pool)} ₽` : `через ${leftText(t.opensIn * 1000)}`}`); } catch (e) { out.push('🏆 Турнир: нет ответа'); }
  } else out.push('ℹ️ Остальные проверки — только в игре внутри Telegram');
  if ($('admPing')) $('admPing').innerHTML = out.join('<br>');
}

Object.assign(ACTIONS, {
  admTab: (id) => { ADM_TAB = id; openAdmin(); },
  adm2: (id) => {
    if (!S.admin) return;
    const num = (el) => Math.floor(+(($(el) || {}).value || 0)) || 0;
    switch (id) {
      case 'money': { const v = num('admMoney'); if (v > 0) addMoney(v); else S.money = Math.max(0, S.money + v); break; }
      case 'caps': S.caps = Math.max(0, S.caps + num('admCaps')); break;
      case 'level': {
        const want = Math.max(1, Math.min(300, num('admLevel')));
        let xp = 0; for (let i = 1; i < want; i++) xp += xpNeed(i);
        S.xp = xp; pendingLevelUp = null; break;
      }
      case 'vip': S.vipUntil = Math.max(Date.now(), S.vipUntil || 0) + 30 * 86400000; break;
      case 'stats100': S.form = 100; S.strength = 100; S.fatigue = 0; break;
      case 'debtClear': S.debt = 0; S.missed = 0; S.alimony = null; break;
      case 'chapter': S.quest.idx = Math.max(0, Math.min(questList().length - 1, num('admChapter'))); S.quest.base = { ...(S.counters || {}) }; break;
      case 'path': S.quest.path = S.quest.path === 'dark' ? 'honest' : 'dark'; break;
      case 'cityZas': case 'cityMsk': case 'cityMex': case 'cityFr': S.city = id === 'cityFr' ? 'fr' : id === 'cityMsk' ? 'msk' : id === 'cityMex' ? 'mex' : 'zas'; S.quest.idx = 0; S.quest.base = { ...(S.counters || {}) }; applyCity(); renderedHousing = -1; break;
      case 'moveTest': { if (city() !== 'zas') { toast('Окно переезда — только из Засранска', 'bad'); return; } const i = questList().findIndex((q) => q.move); if (i >= 0) S.quest.idx = i; closeModal(); moveStartModal(); return; }
      case 'chapterCard': closeModal(); S.chapterIntro = 'msk'; return;
      case 'game': { const gid = ($('admGame') || {}).value; const j = JOBS.find((x) => x.id === gid); if (!j) return; closeModal(); startShiftGame(j, (score) => { closeModal(); toast(`🎮 ${JOB_GAMES[j.id].title}: результат ${score} из ~${JOB_GAMES[j.id].target}`, 'good'); }); return; }
      // Событие показывается на главном экране: ставим таймер «прямо сейчас» и уходим туда
      case 'event': closeModal(); nextEventAt = 0; showScreen('game'); toast('Событие появится через секунду'); return;
      case 'tip': closeModal(); S.tipAskOff = false; S.tipAskAt = 0; return;
      case 'news': openNews('all'); return;
      case 'tut': ACTIONS.restartTut(); return;
      case 'ping': admPing(); return;
      case 'overview': admOverview(); return;
      case 'tourReset': admConfirm('Сбросить турнир? Участникам вернутся взносы', async () => { const r = await apiPost('admin/tour_reset'); toast(r.error || `🏆 Турнир сброшен, взносы вернутся ${r.refunded} игрокам`, r.error ? 'bad' : 'good'); }); return;
      case 'caseItem': case 'caseLegend': { const c = pick(CASES.filter((x) => !x.caps)); let it = caseRollItem(c); if (id === 'caseLegend') { const [e, name, k] = pick(c.loot.legend); it = { ...it, e, name, rar: 'legend', value: Math.round(caseItemBase(c, RARITY[4], k) / 10) * 10, key: `admin:${name}` }; } fleaInv().push(it); toast(`Выпало: ${it.e} ${it.name}`, 'good'); break; }
      case 'pets': PETS.forEach((p) => { if (!S.pets.includes(p.id)) S.pets.push(p.id); }); break;
      case 'fleaClear': S.flea = []; break;
      case 'night': S.admNightUntil = Date.now() + 10 * 60000; break;
      case 'saveCopy': {
        const txt = JSON.stringify(S);
        navigator.clipboard.writeText(txt).then(() => toast('📋 Сохранение скопировано', 'good')).catch(() => { $('admSaveText').value = txt; toast('Скопируй текст из поля', 'good'); });
        return;
      }
      case 'saveLoad': {
        const txt = ($('admSaveText') || {}).value || '';
        const data = parseSave(txt.trim());
        if (!data || !data.stats) { toast('Это не похоже на сохранение игры', 'bad'); return; }
        const doIt = () => { S = data; S.admin = true; REV_FLOOR = Math.max(REV_FLOOR, serverBase); save(true); toast('💾 Сохранение загружено', 'good'); setTimeout(() => location.reload(), 600); };
        if (tg && tg.showConfirm) tg.showConfirm('Заменить текущий прогресс вставленным?', (ok) => ok && doIt()); else if (confirm('Заменить текущий прогресс вставленным?')) doIt();
        return;
      }
      default: return;
    }
    toast('✅ Готово', 'good');
    save();
    openAdmin();
  },
});
