// Админка 4.2: управление любым параметром развития игрока (карточка игрока → «Развитие» и «Выдать»).
// Команды уходят на сервер (bot/admin.py проверяет поле и диапазон) и выполняются в игре игрока
// при следующем входе или в течение минуты — как деньги, уровни и VIP раньше.

const ADM_SET = [
  ['money', '💰 Деньги (ровно), ₽'], ['caps', '🟡 Крышки (ровно)'], ['bottles', '🍾 Бутылки'],
  ['strength', '💪 Сила 0–100'], ['form', '🏃 Форма 0–100'], ['edu', '🎓 Образование 0–5'],
  ['house', '🏠 Жильё (ступень 0–6)'], ['transport', '🚗 Транспорт (0–11)'], ['quest', '📖 Глава сюжета (номер в городе)'],
  ['crime', '🕶️ Криминальный опыт в городе'], ['wanted', '🚨 Розыск 0–5'], ['karma', '😇 Карма'], ['prestige', '🌟 Престиж'],
  ['pass', '🎫 Очки батл-пасса'], ['rating', '🥊 Рейтинг драк'], ['wins', '🏆 Победы в драках'],
];
const ADM_GIVE = {
  cosm: ['✨ Косметика', () => COSMETICS.map((c) => [c.id, `${c.face || c.emoji} ${c.name}`])],
  hat: ['🎩 Шапка', () => CLOTHES.hat.map((x) => [x.id, x.name])],
  body: ['🧥 Одежда', () => CLOTHES.body.map((x) => [x.id, x.name])],
  shoes: ['👟 Обувь', () => CLOTHES.shoes.map((x) => [x.id, x.name])],
  pet: ['🐾 Питомец', () => PETS.map((p) => [p.id, `${p.emoji || ''} ${p.name}`])],
  dkey: ['🔑 Ключ донат-кейса', () => (typeof DCASES !== 'undefined' ? DCASES.map((c) => [c.id, `${c.emoji} ${c.name}`]) : [])],
};
let ADM_GK = 'cosm';

function admDevHTML(c) {
  const sv = c.save || {};
  const val = (k) => (sv[k] === undefined ? '—' : typeof sv[k] === 'boolean' ? (sv[k] ? 'да' : 'нет') : fmt(sv[k]));
  const opts = (list) => list.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('');
  return `<div class="subhead">🧬 Развитие</div>
    <div class="adm-stats"><span>💪 ${val('strength')}</span><span>🏃 ${val('form')}</span><span>🎓 ${val('edu')}</span><span>🏠 ${val('house')}</span><span>🚗 ${val('transport')}</span>
      <span>📖 гл. ${val('quest')} ${sv.path ? (sv.path === 'dark' ? '😈' : '😇') : ''}</span><span>🕶️ ${val('crime')}</span><span>🚨 ${val('wanted')}</span><span>😇 ${val('karma')}</span>${sv.jail ? '<span>⛓️ в тюрьме</span>' : ''}</div>
    <div class="adm-row"><select id="admSF">${opts(ADM_SET)}</select><input id="admSN" type="number" inputmode="numeric" placeholder="Значение"><button class="btn primary" data-act="admSet">OK</button></div>
    <div class="admin-grid">
      <button class="btn" data-act="admSetQuick" data-id="path:honest">😇 Честный путь</button><button class="btn" data-act="admSetQuick" data-id="path:dark">😈 Тёмный путь</button>
      <button class="btn" data-act="admSetQuick" data-id="jail:0">🔓 Из тюрьмы</button><button class="btn" data-act="admSetQuick" data-id="wanted:0">🚨 Снять розыск</button></div>
    <div class="adm-row"><select id="admCity">${opts(Object.entries(CITIES).map(([id,c])=>[id,c.emoji+' '+c.name]))}</select><button class="btn" data-act="admSetCity">📍 Перенести в город</button></div>
    <div class="subhead">🎁 Выдать</div>
    <div class="adm-row"><select id="admGK">${Object.entries(ADM_GIVE).map(([k, [t]]) => `<option value="${k}" ${k === ADM_GK ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <select id="admGI">${opts(ADM_GIVE[ADM_GK][1]())}</select></div>
    <div class="adm-row"><input id="admGN" type="number" inputmode="numeric" placeholder="Сколько (для ключей)" value="1"><button class="btn primary" data-act="admGive">Выдать</button></div>`;
}
admPlayers = (function (orig) {
  return function () {
    const html = orig();
    const c = ADMP.card;
    if (!c) return html;
    return html.replace('<div class="subhead">🔇 Чат', `${admDevHTML(c)}<div class="subhead">🔇 Чат`);
  };
})(admPlayers);

async function admSend(cmd) {
  const c = ADMP.card;
  if (!c) return;
  try {
    const r = await apiPost('admin/cmd', { uid: c.uid, cmd });
    toast(r.error || `✅ Отправлено: ${r.name}`, r.error ? 'bad' : 'good');
    if (!r.error) admLoadCard(c.uid);
  } catch (e) { toast(refErrorText(e), 'bad'); }
}
Object.assign(ACTIONS, {
  admSet: () => {
    const field = ($('admSF') || {}).value, raw = ($('admSN') || {}).value;
    if (raw === '' || raw === undefined) { toast('Укажи значение', 'bad'); return; }
    admSend({ type: 'set', field, n: Math.trunc(+raw) });
  },
  admSetQuick: (arg) => {
    const [field, v] = arg.split(':');
    if (field === 'path') admSend({ type: 'set', field, text: v }); else admSend({ type: 'set', field, n: +v });
  },
  admSetCity: () => {
    const v = ($('admCity') || {}).value;
    const c = ADMP.card;
    admConfirm(`Перенести ${c ? c.name : 'игрока'} в другой город без переезда? Жильё, работа и сюжет останутся как есть`, () => admSend({ type: 'set', field: 'city', text: v }));
  },
  admGiveKind: () => {
    ADM_GK = ($('admGK') || {}).value || 'cosm';
    const sel = $('admGI');
    if (sel) sel.innerHTML = ADM_GIVE[ADM_GK][1]().map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('');
  },
  admGive: () => {
    const kind = ($('admGK') || {}).value, id = ($('admGI') || {}).value;
    if (!kind || !id) return;
    admSend({ type: 'give', text: `${kind}:${id}`, n: Math.max(1, Math.trunc(+(($('admGN') || {}).value || 1))) });
  },
});
// Выбор вида вещи — сразу обновляем список (select не нажимается как кнопка)
document.addEventListener('change', (e) => { if (e.target && e.target.id === 'admGK') ACTIONS.admGiveKind(); });

// ---------- Выполнение в игре игрока ----------
const ADM_SETTERS = {
  money: (n) => { S.money = n; return `💰 Деньги: ${fmt(n)} ₽`; },
  caps: (n) => { S.caps = n; return `🟡 Крышки: ${fmt(n)}`; },
  bottles: (n) => { S.bottles = n; return `🍾 Бутылки: ${fmt(n)}`; },
  strength: (n) => { S.strength = n; return `💪 Сила: ${n}`; },
  form: (n) => { S.form = n; return `🏃 Форма: ${n}`; },
  edu: (n) => { S.edu = Math.min(EDU.length - 1, n); S.study = null; return `🎓 Образование: ${EDU[S.edu].name}`; },
  house: (n) => {
    const i = Math.min(HOUSING.length - 1, n);
    Object.assign(S, { ownedHousing: i, housing: i, housingMode: 'own', debt: 0, missed: 0, breakdowns: [] });
    if (typeof renderedHousing !== 'undefined') renderedHousing = -1;
    return `🏠 Жильё: ${HOUSING[i].name}`;
  },
  transport: (n) => { S.transport = Math.min(TRANSPORT.length - 1, n); S.transportBroken = false; return `🚗 Транспорт: ${TRANSPORT[S.transport].name}`; },
  quest: (n) => { S.quest.idx = Math.min(questList().length, n); S.quest.base = { ...(S.counters || {}) }; const q = currentQuest(); return `📖 Сюжет: ${q ? `глава «${q.title}»` : 'пройден'}`; },
  crime: (n) => { if (!S.crimeXp) S.crimeXp = {}; S.crimeXp[city()] = n; return `🕶️ Криминальный опыт: ${fmt(n)}`; },
  wanted: (n) => { S.wanted = n; S.wantedAt = Date.now(); return `🚨 Розыск: ${n ? '⭐'.repeat(n) : 'снят'}`; },
  karma: (n) => { S.karma = n; return `😇 Карма: ${n}`; },
  prestige: (n) => { S.prestige = n; return `🌟 Престиж: ${n}`; },
  pass: (n) => { if (typeof passState === 'function') passState().sp = n; return `🎫 Очки сезона: ${n}`; },
  rating: (n) => { if (typeof fightState === 'function') fightState().rating = n; return `🥊 Рейтинг драк: ${n}`; },
  wins: (n) => { if (typeof fightState === 'function') fightState().wins = n; return `🏆 Побед в драках: ${n}`; },
  jail: () => { if (S.busy && S.busy.type === 'jail') S.busy = null; S.wanted = 0; return '🔓 Свободен — тюрьма и розыск сняты'; },
  path: (_, t) => { S.quest.path = t; return t === 'dark' ? '😈 Путь: тёмный' : '😇 Путь: честный'; },
  city: (_, t) => { S.city = t; applyCity(t); S.housing = Math.min(S.housing, HOUSING.length - 1); return `📍 Город: ${cityName()}`; },
};
function adminGive(text, n) {
  const [kind, id] = String(text).split(':');
  if (kind === 'cosm' && typeof cosmById === 'function' && cosmById(id)) { cosmGet(id); const c = cosmById(id); return `✨ ${c.face || c.emoji} ${c.name}`; }
  if (['hat', 'body', 'shoes'].includes(kind)) {
    const it = CLOTHES[kind].find((x) => x.id === id);
    if (!it) return '';
    if (!S.owned[kind].includes(id)) S.owned[kind].push(id);
    return `🎁 ${it.name}`;
  }
  if (kind === 'pet') {
    const p = PETS.find((x) => x.id === id);
    if (!p) return '';
    if (!S.pets.includes(id)) S.pets.push(id);
    if (!S.pet) S.pet = id;
    return `🐾 Питомец: ${p.name}`;
  }
  if (kind === 'dkey' && typeof dnKey === 'function') { dnKey(id, n); return `🔑 Ключи кейса ×${n}`; }
  return '';
}
adminApply = (function (orig) {
  return function (c, lines) {
    if (c.type === 'set') {
      const f = ADM_SETTERS[c.field];
      if (f) { const line = f(+c.n || 0, c.text || ''); if (line) lines.push(line); }
      updateHud(); refresh();
      return;
    }
    if (c.type === 'give') { const line = adminGive(c.text, Math.max(1, +c.n || 1)); if (line) lines.push(line); return; }
    orig(c, lines);
  };
})(adminApply);
