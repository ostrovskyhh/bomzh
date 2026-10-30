// Донат 4.5: любой набор, VIP, пропуск и набор новичка можно открыть и посмотреть, что внутри:
// каждая вещь с картинкой и пояснением, сколько стоило бы по отдельности, сколько экономишь, и кнопка покупки.

function dnLook(id) {
  const c = typeof cosmById === 'function' && cosmById(id);
  if (!c) return '';
  if (c.kind === 'frame') return `<div class="avatar frame-${c.frame}">${esc(playerName()[0])}</div>`;
  if (c.kind === 'aura') return `<div class="aura-prev aura aura-${c.id.replace('au_', '')}">🧔</div>`;
  if (c.kind === 'avatar') return `<div class="avatar emoji-ava" style="background:${avaBg(cosmAva(c))}">${c.face}</div>`;
  return `<span class="dni-fx">${(c.parts || [c.emoji]).join(' ')}</span>`;
}
const cosmLine = (id, d) => { const c = cosmById(id); return { look: dnLook(id), t: `${cosmKindName(c)} «${c.name}»`, d, ex: c.src === 'bundle' }; };
const capsLine = (n) => ({ e: '🟡', t: `${n} золотых крышек`, d: `По курсу обменника — ${fmt(n * capRate())} ₽. Крышки тратятся на кейсы, стиль и ускорения` });
const vipLine = (days) => ({ e: '👑', t: `VIP «Авторитет» на ${days} дн.`, d: 'Доход ×2, копилка 24 ч вместо 8, касса бизнеса 48 ч, корона в топе, рамка и аватарка VIP' });
const keyLine = (id, n) => { const c = DCASES.find((x) => x.id === id); return { e: c.emoji, t: `${c.name}${n > 1 ? ` ×${n}` : ''}`, d: `Коллекционный кейс за крышки: VIP, ускорения, крышки или косметика. Открывается в «Кейсы → Коллекционные кейсы». Обычно ${c.caps} 🟡 за штуку` }; };

const DN_INFO = {
  b_week: { lead: 'Неделя «большой жизни»: VIP, крышки на мелочи и кейс на удачу', lines: () => [vipLine(7), capsLine(25), keyLine('dc1', 1)] },
  b_style: { lead: 'Полный образ «Неон». Эти вещи есть только в наборе — в кейсах и на витрине их нет', lines: () => [
    cosmLine('fx_neon', 'Из Валеры летят неоновые сердечки при каждом тапе'), cosmLine('au_neon', 'Розово-фиолетовое свечение вокруг Валеры'),
    cosmLine('fr_cyber', 'Рамка аватара в топе, чате и банде'), cosmLine('av_cyber', 'Аватарка вместо буквы имени'), capsLine(20)] },
  b_cases: { lead: 'Четыре коллекционных кейса сразу — дешевле, чем покупать по одному за крышки', lines: () => [keyLine('dc2', 2), keyLine('dc1', 2)] },
  b_mex: { lead: 'Мексиканский образ. Вещи только в наборе', lines: () => [
    cosmLine('fx_taco', 'При тапе летят тако и перцы'), cosmLine('au_fiesta', 'Праздничное сияние вокруг Валеры'),
    cosmLine('fr_fiesta', 'Переливающаяся рамка-фиеста'), cosmLine('av_pinata', 'Аватарка-пиньята'), capsLine(60)] },
  b_boss: { lead: 'Самый большой набор: месяц VIP, кейс Пахана и образ «Пахан», которого больше нигде нет', lines: () => [
    vipLine(30), capsLine(100), keyLine('dc3', 1), cosmLine('fr_pahan', 'Чёрно-золотая рамка с красной каймой'), cosmLine('av_pahan', 'Аватарка-горилла'), cosmLine('fx_crown', 'Из Валеры летят короны и деньги')] },
};

function dnPassLines() {
  if (typeof passReward !== 'function') return [];
  let caps = 0, money = 0;
  for (let l = 1; l <= PASS_LEVELS; l++) { const r = passReward('paid', l); caps += r.caps || 0; money += r.money || 0; }
  return [
    { e: '🟡', t: `${caps} крышек за сезон`, d: 'Выдаются на уровнях золотой дорожки' },
    { e: '💵', t: `~${fmt(money * capRate())} ₽ деньгами`, d: 'Почти на каждом уровне, по курсу крышки' },
    { e: '🧢', t: 'Кепка сезона', d: '+6 к тапу, крит +3% — эксклюзив сезона (10-й уровень)' },
    { e: '👑', t: 'VIP на 3 дня', d: '20-й уровень пропуска' },
    { e: '⚡', t: 'Награды сразу', d: 'За уже пройденные уровни всё выдаётся в момент покупки' },
  ];
}
function dnInfoData(id) {
  const b = BUNDLES.find((x) => x.id === id);
  if (b) return { emoji: b.emoji, title: b.name, stars: b.stars, worth: b.worth, only: b.only, ...DN_INFO[b.id], lines: DN_INFO[b.id].lines() };
  if (id === 'vip') return { emoji: '👑', title: 'VIP «Авторитет» · 30 дней', stars: 299, lead: isVip() ? `Уже активен до ${new Date(S.vipUntil).toLocaleDateString('ru-RU')}. Покупка добавит ещё 30 дней` : 'Подписка на месяц: всё зарабатывается вдвое быстрее', lines: [
    { e: '💰', t: 'Доход ×2', d: 'Тапы, милостыня, работа, бизнесы — всё вдвое' },
    { e: '🛌', t: 'Копилка 24 часа', d: 'Пока игра закрыта, подают 24 ч вместо 8' },
    { e: '🏪', t: 'Касса бизнеса 12 часов', d: '12 часов вместо обычных 6 — получай прибыль реже, без потери накоплений' },
    { e: '👑', t: 'Корона в топе', d: 'Все видят, кто здесь Авторитет' },
    { e: '🖼️', t: 'Рамка и аватарка «VIP»', d: 'Пока VIP активен — в топе, чате и банде' },
  ] };
  if (id === 'pass') return { emoji: '🎫', title: 'Золотой пропуск сезона', stars: PASS_STARS, lead: 'Вторая дорожка наград батл-пасса на весь сезон (28 дней)', lines: dnPassLines() };
  if (id === 'starter') return { emoji: '🎁', title: 'Набор новичка', stars: STARTER_STARS, worth: 170, lead: `Только в первые ${STARTER_DAYS} дня игры, один раз`, lines: [capsLine(40), vipLine(7),
    { e: '💰', t: `${fmt(starterMoney())} ₽`, d: 'На первое жильё и еду' }, { e: '🧢', t: 'Кепка новичка', d: '+3 к тапу, +15 к энергии — уникальная шапка' }] };
  return null;
}

function dnInfoHTML(id) {
  const d = dnInfoData(id);
  if (!d) return '';
  const price = promoPrice({ id, stars: d.stars });
  const save = d.worth ? Math.round((1 - price / d.worth) * 100) : 0;
  return `<div class="dni"><div class="dni-h"><span>${d.emoji}</span><div><b>${d.title}</b><small>${d.lead}</small></div></div>
    ${d.only ? '<div class="dni-only">✨ Эксклюзив: вещи только в этом наборе</div>' : ''}
    <div class="dni-list">${d.lines.map((l) => `<div class="dni-row ${l.ex ? 'ex' : ''}"><div class="dni-ic">${l.look || `<span>${l.e}</span>`}</div><div><b>${l.t}</b><small>${l.d}</small></div></div>`).join('')}</div>
    <div class="dni-price">${d.worth ? `<div><small>По отдельности</small><s>≈ ${d.worth} ⭐</s></div>` : ''}<div><small>Цена</small><b>⭐ ${price}</b>${price !== d.stars ? ` <s>${d.stars}</s>` : ''}</div>${save > 0 ? `<div class="good"><small>Выгода</small><b>${save}%</b></div>` : ''}</div>
    <div class="btns" style="flex-direction:column;gap:8px"><button class="btn primary wide" data-act="prem" data-id="${id}">⭐ Купить за ${price}</button>
      <button class="btn wide" data-act="dnInfoBack">⬅️ К донату</button></div></div>`;
}
ACTIONS.dnInfo = (id) => { if (!dnInfoData(id)) return; openModal(dnInfoHTML(id), { center: true }); sfx('chip'); };
ACTIONS.dnInfoBack = () => { closeModal(); openDonate(); };

// На витрине: карточки нажимаются целиком, плюс заметная кнопка «Что внутри»
dnSetsTab = (function (orig) {
  return function (p) {
    let html = orig(p);
    BUNDLES.forEach((b) => {
      html = html.replace(new RegExp(`(<div class="dn-set[^"]*")(><div class="dn-set-h"><span>${b.emoji}</span><div><b>${b.name}</b>)`), `$1 data-act="dnInfo" data-id="${b.id}"$2`);
      html = html.replace(new RegExp(`(data-act="dnInfo" data-id="${b.id}"[\\s\\S]*?<div class="dn-set-f"><small>)`), `$1<u>Что внутри ›</u> · `);
    });
    html = html.replace('<div class="dn-card vip', '<div data-act="dnInfo" data-id="vip" class="dn-card vip').replace('<div class="dn-card pass', '<div data-act="dnInfo" data-id="pass" class="dn-card pass');
    html = html.replace(/(<b>VIP «Авторитет» · 30 дней<\/b>)/, '$1 <u class="dni-more">что даёт ›</u>').replace(/(<b>Золотой пропуск сезона<\/b>)/, '$1 <u class="dni-more">что внутри ›</u>');
    return html;
  };
})(dnSetsTab);
starterHTML = (function (orig) { return function () { const h = orig(); return h ? h.replace('<b>Набор новичка</b>', '<b>Набор новичка</b> <button class="dni-link" data-act="dnInfo" data-id="starter">что внутри ›</button>') : h; }; })(starterHTML);
