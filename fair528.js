// 5.28 · Честный донат и азарт: возврат и шансы на виду, лимит, режим без азарта, простая витрина.
const RTP_CASES_528 = 85, RTP_LOTTO_528 = 76;

// ---------- Настройки ----------
const LIMIT_STEPS_528 = [0, 100, 500, 2000, 10000]; // в курсах крышки, чтобы лимит не зависел от стадии
function gambleDay528() {
  const day = mskDay(), bet = cst().bet;
  if (!S.gamble528 || S.gamble528.day !== day) S.gamble528 = { day, bet0: bet, other: 0 };
  return S.gamble528;
}
function gambleSpent528() { const g = gambleDay528(); return Math.max(0, cst().bet - g.bet0) + g.other; }
function gambleLimit528() { return LIMIT_STEPS_528[(S.settings && S.settings.limit528) || 0] * capRate(); }
function gambleBlocked528() {
  if (S.settings && S.settings.noGamble528) return 'off';
  const lim = gambleLimit528();
  return lim && gambleSpent528() >= lim ? 'limit' : '';
}
function gambleCard528() {
  const why = gambleBlocked528();
  return `<div class="info-card calm528"><b>${why === 'off' ? '🧘 Режим «без азарта» включён' : '🛑 Лимит на сегодня исчерпан'}</b><p>${why === 'off' ? 'Казино, лотерея и кейсы скрыты. Вернуть можно в настройках.' : `Сегодня поставлено ${fmt(gambleSpent528())} ₽. Завтра по Москве счёт начнётся заново.`}</p><button class="btn wide" data-act="settings">Открыть настройки</button></div>`;
}
function gambleGuard528(fn, cost) {
  return (...a) => {
    const why = gambleBlocked528();
    if (why) { toast(why === 'off' ? '🧘 Режим «без азарта» включён' : '🛑 Дневной лимит исчерпан', 'bad'); return; }
    const v = cost ? cost(...a) : 0;
    if (v) gambleDay528().other += v;
    return fn(...a);
  };
}
for (const tab of ['casino', 'lotto']) {
  const before = EXTRA_TABS.fun[tab];
  EXTRA_TABS.fun[tab] = () => (gambleBlocked528() ? gambleCard528() : before());
}
const caseCost528 = (id) => { const c = CASES.find((x) => x.id === id); return c && !c.caps && S.money >= c.price ? c.price : 0; };
const ticketCost528 = (id) => { const t = TICKETS.find((x) => x.id === id); return t && S.money >= t.price ? t.price : 0; };
ACTIONS.cases = gambleGuard528(ACTIONS.cases);
ACTIONS.caseOpen = gambleGuard528(ACTIONS.caseOpen, caseCost528);
ACTIONS.caseAgain = gambleGuard528(ACTIONS.caseAgain, caseCost528);
ACTIONS.buyTicket = gambleGuard528(ACTIONS.buyTicket, ticketCost528);
ACTIONS.lotoStart = gambleGuard528(ACTIONS.lotoStart, (bet) => (S.money >= +bet ? +bet : 0));

SET_PAGES.splice(3, 0, { id: 'calm528', e: '🧘', t: 'Спокойная игра', d: 'Меньше окон, лимит, без азарта' });
function calmPage528() {
  const st = S.settings, step = st.limit528 || 0;
  const row = (key, title, desc) => `<button class="set-toggle528 ${st[key] ? 'on' : ''}" data-act="calmSet528" data-id="${key}"><div><b>${title}</b><small>${desc}</small></div><i>${st[key] ? 'Вкл' : 'Выкл'}</i></button>`;
  return `${row('calm528', 'Меньше всплывающих окон', 'Без предложений купить и окон об открытых разделах')}
    ${row('noGamble528', 'Без азарта', 'Скрыть казино, лотерею и кейсы')}
    <div class="set-block"><b>Дневной лимит ставок</b><p>${step ? `До ${fmt(gambleLimit528())} ₽ в день. Сегодня: ${fmt(gambleSpent528())} ₽` : 'Лимит не задан'}</p>
      <div class="set-chips528">${LIMIT_STEPS_528.map((k, i) => `<button class="chip ${i === step ? 'on' : ''}" data-act="calmLimit528" data-id="${i}">${k ? `${fmt(k * capRate())} ₽` : 'Нет'}</button>`).join('')}</div></div>`;
}
openSettings = (function (orig) {
  return (...a) => {
    orig(...a);
    const host = document.querySelector('#modalRoot [data-page="calm528"]');
    if (host) host.insertAdjacentHTML('beforeend', `<div id="calmBox528">${calmPage528()}</div>`);
  };
})(openSettings);
function calmRefresh528() { const box = $('calmBox528'); if (box) box.innerHTML = calmPage528(); save(); }
ACTIONS.calmSet528 = (id) => {
  if (id !== 'calm528' && id !== 'noGamble528') return;
  S.settings[id] = !S.settings[id];
  sfx('chip'); calmRefresh528();
};
ACTIONS.calmLimit528 = (i) => { S.settings.limit528 = clamp(+i || 0, 0, LIMIT_STEPS_528.length - 1); sfx('chip'); calmRefresh528(); };
if (typeof starsOffersEnabled === 'function') starsOffersEnabled = (function (orig) { return (...a) => !(S.settings && S.settings.calm528) && orig(...a); })(starsOffersEnabled);

// ---------- Честные цифры ----------
const RTP_NOTE_528 = (rtp, extra) => `<div class="rtp528">📊 В среднем игра возвращает <b>${rtp}%</b> поставленного. С каждых 100 ₽ на длинной дистанции остаётся около ${rtp} ₽.${extra ? ` ${extra}` : ''}</div>`;
openCases = (function (orig) {
  return () => {
    orig();
    const odds = document.querySelector('#modalRoot .pc-top, #modalRoot .case-odds');
    if (odds) odds.insertAdjacentHTML('afterend', RTP_NOTE_528(RTP_CASES_528, 'Легенда падает в 1 кейсе из 100.'));
  };
})(openCases);
EXTRA_TABS.fun.lotto = (function (orig) {
  return () => {
    const html = orig();
    return gambleBlocked528() ? html : html.replace('<div class="subhead">Моментальные билеты</div>', `<div class="subhead">Моментальные билеты</div>${RTP_NOTE_528(RTP_LOTTO_528, 'Шанс главного приза: 1 билет из 10 000.')}`);
  };
})(EXTRA_TABS.fun.lotto);

// ---------- Витрина: пять разделов вместо одиннадцати, без счётчиков и окон с акциями ----------
HOOKS.tick.unshift(() => { const p = promoAt(); if (p) S.promoSeen = p.slot; });
const DN_GROUPS_528 = [
  { id: 'caps', e: '🟡', t: 'Крышки', tabs: ['caps', 'spend'] },
  { id: 'sets', e: '🎁', t: 'Наборы', tabs: ['start', 'sets', 'membership75'] },
  { id: 'cases', e: '🎰', t: 'Кейсы', tabs: ['cases'] },
  { id: 'style', e: '✨', t: 'Стиль', tabs: ['style', 'skins75'] },
  { id: 'more', e: '📚', t: 'Ещё', tabs: ['xp', 'bottles'] },
];
function dnGroups528() {
  return DN_GROUPS_528.map((g) => ({ ...g, tabs: g.tabs.filter((id) => id !== 'start' || newcomerWindow()) }))
    .filter((g) => !(g.id === 'cases' && S.settings && S.settings.noGamble528 && DN_TAB !== 'cases'));
}
function noCountdown528(html) {
  return html.replace(/До конца дня по Москве: <span data-until="\d+"><\/span>/g, 'Сегодня, до полуночи по Москве')
    .replace(/\s*·?\s*осталось\s*<span data-until="\d+"><\/span>/g, '')
    .replace('скидке дня и акциях на 2 часа', 'скидке дня и акциях');
}
donateHTML = (function (orig) {
  return function () {
    const t = document.createElement('template');
    t.innerHTML = noCountdown528(orig());
    const tabs = t.content.querySelector('.dn-tabs');
    if (tabs) {
      const groups = dnGroups528();
      const cur = groups.find((g) => g.tabs.includes(DN_TAB));
      const name = (id) => (DN_TABS.find((x) => x[0] === id) || [])[2] || id;
      tabs.style.setProperty('--dn-cols', groups.length);
      tabs.innerHTML = groups.map((g) => `<button class="${g === cur ? 'on' : ''}" data-act="dnTab" data-id="${g.tabs[0]}"><span>${g.e}</span>${g.t}</button>`).join('');
      if (cur && cur.tabs.length > 1) tabs.insertAdjacentHTML('afterend', `<div class="dn-subtabs">${cur.tabs.map((id) => `<button class="${id === DN_TAB ? 'on' : ''}" data-act="dnTab" data-id="${id}">${name(id)}</button>`).join('')}</div>`);
    }
    return t.innerHTML;
  };
})(donateHTML);
EXTRA_TABS.shop.premium = (function (orig) {
  const wrapped = () => { const html = orig(); EXTRA_TABS.shop.premium = wrapped; return noCountdown528(html); };
  return wrapped;
})(EXTRA_TABS.shop.premium);

// Пока открыт магазин, персонаж не попадает в больницу: покупка не должна стоить здоровья.
hospital = (function (orig) {
  return (...a) => {
    if ($('donateBox')) { S.health = Math.max(S.health, 5); return; }
    return orig(...a);
  };
})(hospital);
