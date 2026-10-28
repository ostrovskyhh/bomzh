// Админ-панель 4.5: дашборд вместо набора кнопок.
// • «Обзор» — цифры по игре (плитки кликабельны), богачи, кто заходил, быстрые действия.
// • «Игроки» — поиск и фильтры (недавние, онлайн, богачи, уровень, наказанные); карточка игрока по разделам,
//   где любой параметр видно и меняется прямо в своей строке. Команды выполняются у игрока при входе или за минуту.
// • «Связь» — рассылка всем, подарок, анонс. «Я», «Мир», «Сервер» — прежние инструменты (admin2.js), разложены по разделам.

const ADM4_TABS = [['home', '📊', 'Обзор'], ['players', '👥', 'Игроки'], ['reports', '🐞', 'Обращения'], ['comms', '📢', 'Связь'], ['hero', '🧑', 'Я'], ['world', '🎮', 'Мир'], ['server', '🖥️', 'Сервер']];
const ADM4_SORTS = [['recent', '🕘 Недавние'], ['online', '🟢 Онлайн'], ['rich', '💰 Богачи'], ['level', '⭐ Уровень'], ['banned', '🔇 Наказанные']];
const ADM4_CITY = { zas: '🏚️', msk: '🏙️', mex: '🌵' };
let ADM4 = { ov: null, ovAt: 0, list: null, listKey: '', sort: 'recent', query: '', loading: false };
ADM_TAB = 'home';

function adm4Online() { return typeof onlineOn === 'function' && onlineOn(); }
function adm4Need() { return '<div class="adm4-empty">📵 Эта часть работает в игре внутри Telegram — ей нужен сервер и твой Telegram ID</div>'; }
function adm4Ava(name) { return `<i class="adm4-ava">${esc(String(name || '?')[0].toUpperCase())}</i>`; }

// ---------- Обзор ----------
function adm4Home() {
  const o = ADM4.ov;
  const kpi = (e, label, v, act, id, cls = '') => `<button class="adm4-kpi ${cls}" ${act ? `data-act="${act}" data-id="${id}"` : 'disabled'}><span>${e}</span><b>${v === undefined ? '…' : fmt(v)}</b><small>${label}</small></button>`;
  const who = (x, extra) => `<button class="adm4-who" data-act="admOpen" data-id="${x.uid}">${adm4Ava(x.name)}<b>${esc(x.name)}</b><small>${extra}</small></button>`;
  return `${adm4Online() ? '' : adm4Need()}
    <div class="adm4-kpis">
      ${kpi('👥', 'всего игроков', o && o.players, 'adm4Sort', 'recent')}
      ${kpi('🟢', 'онлайн сейчас', o && o.online, 'adm4Sort', 'online', 'green')}
      ${kpi('📅', 'за сутки', o && o.day, 'adm4Sort', 'recent')}
      ${kpi('🗓️', 'за неделю', o && o.week, 'adm4Sort', 'recent')}
      ${kpi('🔇', 'наказаны', o && o.bans, 'adm4Sort', 'banned', o && o.bans ? 'red' : '')}
      ${kpi('⏳', 'команд ждут', o && o.pending)}
    </div>
    ${o && o.money !== undefined ? `<div class="adm4-note">💰 Денег у всех игроков: <b>${fmt(o.money)} ₽</b></div>` : ''}
    <div class="adm4-sec"><div class="adm4-sec-h">⚡ Быстрые действия</div>
      <div class="adm4-actions">
        <button data-act="bcOpen"><span>📢</span><b>Рассылка всем</b><small>Окно у всех игроков</small></button>
        <button data-act="giftOpen"><span>🎁</span><b>Подарок</b><small>Деньги, уровни, крышки</small></button>
        <button data-act="adm4Ping"><span>📡</span><b>Проверить сервер</b><small>Ракета, турнир, отклик</small></button>
        <button data-act="adm2" data-id="tourReset"><span>🏆</span><b>Сбросить турнир</b><small>Вернуть взносы</small></button>
      </div><div id="admPing" class="adm4-ping hidden"></div></div>
    ${o ? `<div class="adm4-cols">
      <div class="adm4-sec"><div class="adm4-sec-h">💰 Самые богатые</div>${o.rich.map((x) => who(x, `${fmt(x.money)} ₽`)).join('') || '<small>пусто</small>'}</div>
      <div class="adm4-sec"><div class="adm4-sec-h">🕘 Недавно заходили</div>${o.recent.map((x) => who(x, admAgo(x.seen))).join('') || '<small>пусто</small>'}</div></div>` : (adm4Online() ? '<div class="adm4-empty">Загружаю сводку…</div>' : '')}`;
}

// ---------- Игроки ----------
function adm4Players() {
  if (ADMP.card) return adm4Card(ADMP.card);
  if (!adm4Online()) return adm4Need();
  const l = ADM4.list;
  const row = (p) => `<button class="adm4-prow" data-act="admOpen" data-id="${p.uid}">${adm4Ava(p.name)}${p.online ? '<em class="on"></em>' : ''}
      <div><b>${esc(p.name)}${p.vip ? ' 👑' : ''}${p.bans.length ? ' 🔇' : ''}</b><small>${ADM4_CITY[p.city] || ''} ур. ${p.level || '?'} · ${p.online ? 'онлайн' : admAgo(p.seen)} · ID ${p.uid}</small></div>
      <span>${fmt(p.money)} ₽<small>🟡 ${fmt(p.caps)}</small></span></button>`;
  return `<div class="adm4-search"><input id="adm4Q" placeholder="🔎 Имя, Telegram ID или код друга" value="${esc(ADM4.query)}" autocomplete="off"><button class="btn primary" data-act="adm4Find">Найти</button></div>
    <div class="adm4-chips">${ADM4_SORTS.map(([id, t]) => `<button class="${ADM4.sort === id ? 'on' : ''}" data-act="adm4Sort" data-id="${id}">${t}</button>`).join('')}</div>
    ${!l ? '<div class="adm4-empty">Загружаю игроков…</div>' : l.players.length ? `<small class="adm4-count">Показано ${l.players.length} из ${l.total}</small><div class="adm4-plist">${l.players.map(row).join('')}</div>` : '<div class="adm4-empty">Никого не нашли</div>'}`;
}

// Строка параметра: подпись, текущее значение, поле и кнопка
function adm4Field(field, label, cur, hint = '') {
  return `<div class="adm4-f"><div><b>${label}</b><small>сейчас: <i>${cur === undefined || cur === '' ? '—' : typeof cur === 'number' ? fmt(cur) : cur}</i>${hint ? ` · ${hint}` : ''}</small></div>
    <input id="admF_${field}" type="number" inputmode="numeric" placeholder="новое"><button class="btn small primary" data-act="adm4Set" data-id="${field}">Задать</button></div>`;
}
function adm4Card(c) {
  const sv = c.save || {}, st = c.stats || {}, bans = c.bans || {};
  const banTxt = (k) => (bans[k] ? (bans[k] > 2e9 ? 'навсегда' : `до ${new Date(bans[k] * 1000).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`) : '');
  const sec = (id, title, html, open) => `<details class="adm4-card-sec" ${open ? 'open' : ''}><summary>${title}</summary><div>${html}</div></details>`;
  const city = { zas: 'Засранск', msk: 'Москвабад', mex: 'Мексика' }[sv.city] || st.city_name || '—';
  const online = Date.now() / 1000 - (c.seen || 0) < 120;
  const opts = (list) => list.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('');
  return `<button class="adm4-back" data-act="adm4Back">‹ Все игроки</button>
    <div class="adm4-hero">${adm4Ava(c.name)}<div><b>${esc(c.name)}</b><small>${online ? '🟢 онлайн' : `был ${admAgo(c.seen)}`} · ID ${c.uid}</small>
      <div class="adm4-tags"><span>⭐ ${st.level || '?'} ур.</span><span>${ADM4_CITY[sv.city] || ''} ${city}</span><span>💰 ${fmt(sv.money || 0)} ₽</span><span>🟡 ${fmt(sv.caps || 0)}</span>
        ${sv.vip > Date.now() ? '<span class="gold">👑 VIP</span>' : ''}${c.place ? `<span>🏆 ${c.place}-й</span>` : ''}${sv.path ? `<span>${sv.path === 'dark' ? '😈 тёмный' : '😇 честный'}</span>` : ''}
        ${sv.jail ? '<span class="red">⛓️ в тюрьме</span>' : ''}${bans.chat ? '<span class="red">🔇 мут</span>' : ''}${bans.top ? '<span class="red">🙈 скрыт из топа</span>' : ''}${sv.debt ? `<span class="red">🧾 долг ${fmt(sv.debt)}</span>` : ''}</div></div></div>
    ${c.pending ? `<div class="adm4-note">⏳ Команд ждут выполнения: <b>${c.pending}</b> — придут, когда игрок зайдёт (или в течение минуты)</div>` : ''}
    ${sec('res', '💰 Деньги и крышки', `
      <div class="adm4-f"><div><b>Деньги, ₽</b><small>сейчас: <i>${fmt(sv.money || 0)}</i></small></div><input id="admR_money" type="number" inputmode="numeric" placeholder="сумма"></div>
      <div class="adm4-btns"><button class="btn small green" data-act="adm4Res" data-id="money:add">＋ Добавить</button><button class="btn small" data-act="adm4Res" data-id="money:sub">− Списать</button><button class="btn small" data-act="adm4Res" data-id="money:set">= Ровно</button></div>
      <div class="adm4-f"><div><b>Крышки 🟡</b><small>сейчас: <i>${fmt(sv.caps || 0)}</i></small></div><input id="admR_caps" type="number" inputmode="numeric" placeholder="сколько"></div>
      <div class="adm4-btns"><button class="btn small green" data-act="adm4Res" data-id="caps:add">＋ Добавить</button><button class="btn small" data-act="adm4Res" data-id="caps:sub">− Списать</button><button class="btn small" data-act="adm4Res" data-id="caps:set">= Ровно</button></div>`, true)}
    ${sec('lvl', '⭐ Уровень и VIP', `
      <div class="adm4-f"><div><b>Уровень</b><small>сейчас: <i>${st.level || '?'}</i></small></div><input id="admR_level" type="number" inputmode="numeric" placeholder="какой"><button class="btn small primary" data-act="adm4Res" data-id="level:set">Сделать</button></div>
      <div class="adm4-btns"><button class="btn small" data-act="adm4Quick" data-id="levels:1">+1 ур.</button><button class="btn small" data-act="adm4Quick" data-id="levels:5">+5 ур.</button><button class="btn small" data-act="adm4Quick" data-id="vip:7">👑 +7 дн. VIP</button><button class="btn small" data-act="adm4Quick" data-id="vip:30">👑 +30 дн.</button></div>`)}
    ${sec('dev', '🧬 Развитие', [
      adm4Field('strength', '💪 Сила', sv.strength, '0–100'), adm4Field('form', '🏃 Форма', sv.form, '0–100'), adm4Field('edu', '🎓 Образование', sv.edu, '0–5'),
      adm4Field('house', '🏠 Жильё', sv.house, 'ступень 0–6'), adm4Field('transport', '🚗 Транспорт', sv.transport, '0–11'), adm4Field('bottles', '🍾 Бутылки', sv.bottles),
      adm4Field('karma', '😇 Карма', sv.karma), adm4Field('prestige', '🌟 Престиж', sv.prestige), adm4Field('pass', '🎫 Очки сезона', undefined), adm4Field('rating', '🥊 Рейтинг драк', undefined), adm4Field('wins', '🏆 Победы в драках', undefined),
    ].join(''))}
    ${sec('story', '🧭 Сюжет, город, криминал', `
      ${adm4Field('quest', '📖 Глава сюжета', sv.quest !== undefined ? sv.quest + 1 : undefined, 'номер с 1')}
      <div class="adm4-btns"><button class="btn small" data-act="admSetQuick" data-id="path:honest">😇 Честный путь</button><button class="btn small" data-act="admSetQuick" data-id="path:dark">😈 Тёмный путь</button></div>
      <div class="adm4-f"><div><b>📍 Город</b><small>сейчас: <i>${city}</i> · без переезда</small></div><select id="admCity">${opts([['zas', '🏚️ Засранск'], ['msk', '🏙️ Москвабад'], ['mex', '🌵 Мексика']])}</select><button class="btn small primary" data-act="admSetCity">Перенести</button></div>
      ${adm4Field('crime', '🕶️ Криминальный опыт', sv.crime, 'в текущем городе')}
      ${adm4Field('wanted', '🚨 Розыск', sv.wanted, '0–5')}`)}
    ${sec('give', '🎁 Выдать вещь', `<div class="adm4-f"><select id="admGK">${Object.entries(ADM_GIVE).map(([k, [t]]) => `<option value="${k}" ${k === ADM_GK ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <select id="admGI">${opts(ADM_GIVE[ADM_GK][1]())}</select></div>
      <div class="adm4-f"><input id="admGN" type="number" inputmode="numeric" value="1" placeholder="Сколько (для ключей)"><button class="btn small primary" data-act="admGive">Выдать</button></div>`)}
    ${sec('help', '❤️ Помочь игроку', `<div class="adm4-btns">
        <button class="btn small" data-act="admCmd" data-id="heal">❤️ Вылечить, шкалы, таймеры</button><button class="btn small" data-act="admCmd" data-id="debts">🧾 Списать долги</button>
        <button class="btn small" data-act="admSetQuick" data-id="jail:0">🔓 Из тюрьмы</button><button class="btn small" data-act="admSetQuick" data-id="wanted:0">🚨 Снять розыск</button></div>
      <div class="adm4-f"><input id="admNote" maxlength="300" placeholder="Сообщение игроку — придёт от бота и в игре"><button class="btn small primary" data-act="admCmd" data-id="note">📨 Отправить</button></div>`)}
    ${sec('mod', `🛡️ Модерация${bans.chat || bans.top ? ' · есть ограничения' : ''}`, `
      <div class="adm4-sub">🔇 Чат ${banTxt('chat') ? `<small>· мут ${banTxt('chat')}</small>` : ''}</div>
      <div class="adm4-btns"><button class="btn small" data-act="admBan" data-id="chat:60">1 час</button><button class="btn small" data-act="admBan" data-id="chat:1440">Сутки</button><button class="btn small" data-act="admBan" data-id="chat:-1">Навсегда</button><button class="btn small green" data-act="admBan" data-id="chat:0">Снять</button></div>
      <div class="adm4-sub">🏆 Топ ${banTxt('top') ? `<small>· скрыт ${banTxt('top')}</small>` : ''}</div>
      <div class="adm4-btns"><button class="btn small" data-act="admBan" data-id="top:-1">Убрать из топа</button><button class="btn small green" data-act="admBan" data-id="top:0">Вернуть</button></div>
      <button class="btn wide dark-path" data-act="admCmd" data-id="wipe">⚠️ Обнулить весь прогресс игрока</button>`)}`;
}

// ---------- Связь, Я, Мир, Сервер ----------
function adm4Comms() {
  const item = (act, e, t, d) => `<button class="adm4-item" data-act="${act}"><span>${e}</span><div><b>${t}</b><small>${d}</small></div><i>›</i></button>`;
  return `${adm4Online() ? '' : adm4Need()}
    ${item('bcOpen', '📢', 'Рассылка всем игрокам', 'Окно у всех при входе в игру (видно неделю), по желанию — ещё и сообщением от бота')}
    ${item('giftOpen', '🎁', 'Подарок игроку', 'Деньги, уровни и крышки — игрок увидит «Подарок от администрации»')}
    ${item('adm4Tab', '👥', 'Написать конкретному игроку', 'Найди игрока во вкладке «Игроки» → «Помочь игроку» → сообщение').replace('data-act="adm4Tab"', 'data-act="adm4Tab" data-id="players"')}
    <div class="adm4-note">📰 Анонс обновления уходит сам, когда новая версия появляется на сайте. Разослать заново — команда <b>/sendnews</b> боту.</div>`;
}
function adm4Server() {
  return `<div class="adm4-sec"><div class="adm4-sec-h">🖥️ Сервер</div>${admServer().replace(/<button class="btn wide primary" data-act="giftOpen">[\s\S]*?<\/button>\s*<button class="btn wide primary" data-act="bcOpen">[\s\S]*?<\/button>/, '')}</div>
    <div class="adm4-sec"><div class="adm4-sec-h">💾 Сохранения</div>${admSave()}</div>`;
}

// ---------- Окно ----------
openAdmin = function () {
  const tab = ADM4_TABS.some(([id]) => id === ADM_TAB) ? ADM_TAB : 'home';
  const body = { home: adm4Home, players: adm4Players, comms: adm4Comms, hero: () => `<div class="adm4-sec"><div class="adm4-sec-h">🧑 Мой персонаж — для проверки</div>${admHero()}</div>`,
    reports: feedbackAdminPage, world: () => `<div class="adm4-sec">${admWorld()}</div>`, server: adm4Server }[tab]();
  const sc = document.querySelector('#modalRoot .sheet'), keep = sc && sc.querySelector('.adm4') && sc.querySelector('.adm4').dataset.tab === tab ? sc.scrollTop : 0;
  openModal(`<div class="adm4" data-tab="${tab}">
    <div class="adm4-top"><div><b>🛠️ Админ-панель</b><small>${adm4Online() ? '🟢 сервер подключён' : '⚪ без сервера'} · ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</small></div>
      <button class="adm4-refresh" data-act="adm4Refresh" title="Обновить">⟳</button></div>
    <div class="adm4-nav">${ADM4_TABS.map(([id, e, t]) => `<button class="${id === tab ? 'on' : ''}" data-act="admTab" data-id="${id}"><span>${e}</span>${t}</button>`).join('')}</div>
    <div class="adm4-body">${body}</div>
    <div class="btns"><button class="btn wide" data-act="settings">Закрыть</button></div></div>`, { center: true });
  const s2 = document.querySelector('#modalRoot .sheet'); if (s2 && keep) s2.scrollTop = keep;
  adm4Load(tab);
};

async function adm4Load(tab, force) {
  if (!adm4Online() || ADM4.loading) return;
  try {
    if (tab === 'home' && (force || !ADM4.ov || Date.now() - ADM4.ovAt > 30000)) {
      ADM4.loading = true;
      const r = await apiPost('admin/overview');
      ADM4.loading = false;
      if (r.error) { toast(r.error, 'bad'); return; }
      ADM4.ov = r; ADM4.ovAt = Date.now();
      if (ADM_TAB === 'home' && document.querySelector('.adm4[data-tab="home"]')) openAdmin();
    }
    const key = `${ADM4.sort}|${ADM4.query}`;
    if (tab === 'players' && !ADMP.card && (force || !ADM4.list || ADM4.listKey !== key)) {
      ADM4.loading = true;
      const r = await apiPost('admin/list', { sort: ADM4.sort, query: ADM4.query });
      ADM4.loading = false;
      if (r.error) { toast(r.error, 'bad'); return; }
      ADM4.list = r; ADM4.listKey = key;
      if (ADM_TAB === 'players' && !ADMP.card && document.querySelector('.adm4[data-tab="players"]')) openAdmin();
    }
  } catch (e) { ADM4.loading = false; toast(refErrorText(e), 'bad'); }
}

Object.assign(ACTIONS, {
  // Из настроек панель всегда открывается на «Обзоре»
  adminMenu: () => { if (!S.admin) return; ADM_TAB = 'home'; ADMP.card = null; openAdmin(); },
  admTab: (id) => { if (id !== 'players') ADMP.card = null; ADM_TAB = id; openAdmin(); },
  adm4Tab: (id) => ACTIONS.admTab(id),
  adm4Refresh: () => { ADM4.ovAt = 0; ADM4.listKey = ''; if (ADMP.card) { admLoadCard(ADMP.card.uid); return; } openAdmin(); adm4Load(ADM_TAB, true); },
  adm4Sort: (id) => { ADM4.sort = id; ADMP.card = null; ADM_TAB = 'players'; ADM4.list = null; openAdmin(); },
  adm4Find: () => { ADM4.query = (($('adm4Q') || {}).value || '').trim(); ADM4.list = null; openAdmin(); },
  adm4Back: () => { ADMP.card = null; ADM_TAB = 'players'; openAdmin(); },
  adm4Ping: () => { const b = $('admPing'); if (b) { b.classList.remove('hidden'); b.textContent = 'Проверяю…'; } admPing(); },
  admOpen: (uid) => { ADMP.list = []; admLoadCard(+uid); },
  adm4Set: (field) => {
    const raw = ($(`admF_${field}`) || {}).value;
    if (raw === '' || raw === undefined) { toast('Впиши новое значение', 'bad'); return; }
    let n = Math.trunc(+raw);
    if (field === 'quest') n = Math.max(0, n - 1); // в карточке главы считаем с 1
    admSend({ type: 'set', field, n });
  },
  adm4Res: (arg) => {
    const [kind, how] = arg.split(':');
    const raw = ($(`admR_${kind}`) || {}).value;
    const v = Math.abs(Math.trunc(+raw || 0));
    if (!v && how !== 'set') { toast('Впиши число', 'bad'); return; }
    if (kind === 'level') { admSend({ type: 'setlevel', n: Math.max(1, v) }); return; }
    if (how === 'set') admSend({ type: 'set', field: kind, n: v });
    else admSend({ type: kind, n: how === 'sub' ? -v : v });
  },
  adm4Quick: (arg) => { const [type, n] = arg.split(':'); admSend({ type, n: +n }); },
});
// Поиск по Enter
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target && e.target.id === 'adm4Q') ACTIONS.adm4Find(); });
