// 2.9: просьба поддержать проект раз в 3 часа (можно отключить навсегда), пробный VIP на 2 дня
// за вход по коду друга и потом VIP со скидкой 30%, долги по счетам на главном экране,
// подсказки, где искать редкие и коллекционные предметы.

// =====================================================================
// 1. «Поддержи проект» — раз в 3 реальных часа, пока игрок не нажал «Не спрашивать»
// =====================================================================
const TIP_ASK_EVERY = 3 * 3600000;
HOOKS.load.push(() => { if (!S.tipAskAt) S.tipAskAt = Date.now() + TIP_ASK_EVERY; });
HOOKS.tick.push(() => {
  if (S.tipAskOff || !S.storySeen || Date.now() < (S.tipAskAt || 0)) return;
  if (!onlineOn() || currentScreen !== 'game' || modalOpen() || (S.tut && !S.tut.done) || MG) return;
  S.tipAskAt = Date.now() + TIP_ASK_EVERY;
  openModal(`<div class="tip-ask"><div class="big-art" style="height:96px"><div class="rays"></div><div class="big-emoji" style="line-height:96px">💛</div></div>
    <h3>Поддержишь проект?</h3>
    <p>«Симулятор бомжа» растёт благодаря игрокам. Звёзды идут на сервер, новые города, мини-игры и обновления. Даже одна звезда — это очень приятно${S.tipStars ? `. Ты уже поддержал на <b>${S.tipStars} ⭐</b> — спасибо!` : '!'}</p>
    <button class="btn primary wide" data-act="tipOne">⭐ Задонатить 1 звезду</button>
    <div class="dn-tip-custom tip-ask-row"><input id="tipStars" type="number" inputmode="numeric" min="1" max="10000" placeholder="Своя сумма ⭐"><button class="btn" data-act="tipCustom">Отправить</button></div>
    <div class="btns"><button class="btn wide" data-act="close">Не сейчас</button></div>
    <button class="tip-never" data-act="tipNever">Больше не спрашивать</button></div>`, { center: true });
  sfx('notify');
});
ACTIONS.tipNever = () => {
  S.tipAskOff = true;
  closeModal();
  toast('Хорошо, больше не спросим. Поддержать можно в любой момент в разделе доната 💛');
  save();
};

// =====================================================================
// 2. VIP на 2 дня за вход по коду друга, потом — VIP на 30 дней со скидкой 30%
// =====================================================================
const VIP_TRIAL_DAYS = 2;
const VIP_REF_STARS = 209;      // как PRODUCTS["vip_ref"] в bot/social.py (299 −30%)
const VIP_REF_OFFER_DAYS = 7;   // сколько дней после пробника висит предложение в донате
PREM_GIVE.vip_ref = () => {
  S.vipUntil = Math.max(Date.now(), S.vipUntil || 0) + 30 * 86400000;
  if (S.vipTrial) S.vipTrial.bought = true;
  return '👑 VIP «Авторитет» на 30 дней (скидка 30% за приглашение)';
};

useRefCode = (function (orig) {
  return async function (word) {
    const was = S.refUsed;
    await orig(word);
    if (was || !S.refUsed || S.vipTrial) return;
    const until = Math.max(Date.now(), S.vipUntil || 0) + VIP_TRIAL_DAYS * 86400000;
    S.vipUntil = until;
    S.vipTrial = { until, offered: false, bought: false };
    save();
    setTimeout(() => toast(`👑 Бонус за приглашение: VIP «Авторитет» на ${VIP_TRIAL_DAYS} дня — доход ×2 и копилка 24 ч!`, 'good'), 1200);
  };
})(useRefCode);

function vipRefOfferOn() {
  const t = S.vipTrial;
  return !!(t && !t.bought && Date.now() >= t.until && Date.now() < t.until + VIP_REF_OFFER_DAYS * 86400000 && !isVip());
}
function vipRefCardHTML() {
  const left = S.vipTrial.until + VIP_REF_OFFER_DAYS * 86400000;
  return `<div class="vip-ref"><div class="vr-h"><span>👑</span><div><b>VIP на 30 дней — скидка 30%</b>
      <small>Только для тех, кто пришёл по приглашению друга. Предложение сгорит через ${leftText(left - Date.now())}</small></div></div>
    <button class="btn primary wide" data-act="prem" data-id="vip_ref">${starPrice(VIP_REF_STARS, 299)} Забрать со скидкой</button></div>`;
}
HOOKS.tick.push(() => {
  const t = S.vipTrial;
  if (!t || t.offered || !vipRefOfferOn() || currentScreen !== 'game' || modalOpen() || MG) return;
  t.offered = true;
  save();
  openModal(`<div class="big-art"><div class="rays"></div><div class="big-emoji">👑</div></div>
    <h3>Пробный VIP закончился</h3><p>Понравилось получать вдвое больше? Для приглашённых друзей — <b>VIP «Авторитет» на 30 дней со скидкой 30%</b>.</p>
    ${vipRefCardHTML()}
    <div class="btns"><button class="btn wide" data-act="close">Подумаю — предложение будет в донате</button></div>`, { center: true });
});
donateHTML = (function (orig) {
  return function () { const h = orig(); return vipRefOfferOn() ? vipRefCardHTML() + h : h; };
})(donateHTML);

// =====================================================================
// 3. Долги по счетам — плашка на главном экране
// =====================================================================
HOOKS.hud.push(() => {
  let pin = $('debtPin');
  if (!pin) {
    const inv = $('invPin');
    if (!inv) return;
    inv.insertAdjacentHTML('afterend', '<div class="inv-pin debt-pin hidden" id="debtPin" data-act="debtOpen"></div>');
    pin = $('debtPin');
  }
  if (!(S.debt > 0)) { pin.classList.add('hidden'); return; }
  const html = `<span>🧾</span><div><b>Долг по счетам: ${fmt(S.debt)} ₽</b><small>${S.missed ? `Просрочка ${S.missed} мес. · ` : ''}нажми, чтобы оплатить</small></div>`;
  if (pin.dataset.html !== html) { pin.innerHTML = html; pin.dataset.html = html; }
  pin.classList.remove('hidden');
  // Плашки стоят столбиком: сюжет → хлам → долг
  const above = ['questPin', 'invPin'].filter((id) => $(id) && !$(id).classList.contains('hidden')).length;
  pin.style.top = 58 + above * 42 + 'px';
});
ACTIONS.debtOpen = () => {
  if (!(S.debt > 0)) return;
  const rent = S.housingMode === 'rent';
  openModal(`<div class="big-art"><div class="rays bad"></div><div class="big-emoji">🧾</div></div>
    <h3>Долг ${fmt(S.debt)} ₽</h3>
    <p>${rent ? 'Долг по аренде.' : 'Долг за коммуналку.'}${S.missed ? ` Просрочка: ${S.missed} мес.` : ''}</p>
    <div class="info-card warn">${rent ? 'Не заплатишь два месяца подряд — хозяин выселит обратно на улицу.' : 'Пока долг висит больше месяца — свет отключён: энергия восстанавливается вдвое медленнее, радость падает.'}</div>
    <div class="btns">${priceBtn('debtPay', '', S.debt, S.money >= S.debt, `Оплатить ${fmt(S.debt)} ₽`).replace('class="btn', 'class="btn wide')}
      <button class="btn wide" data-act="close">Позже</button></div>`, { center: true });
};
ACTIONS.debtPay = () => {
  if (S.money < S.debt) { toast(`Не хватает ${fmt(S.debt - S.money)} ₽`, 'bad'); return; }
  ACTIONS.payBills();
  closeModal();
  toast('🧾 Счета оплачены — свет снова есть', 'good');
  refresh();
};

// =====================================================================
// 4. Где искать редкие и коллекционные предметы
// =====================================================================
// Каждая коллекция теперь чаще находится в «своём» месте (плюс как раньше — в мусорке)
const COLL_WHERE = {
  stamps: { where: 'Главы сюжета и поручения корешей (Задания → Поручения)', keys: { questDone: 0.3, sideDone: 0.3 } },
  coins: { where: 'Мусорки и дела карманника в «Криминале»', keys: { crimeOk: 0.15 } },
  badges: { where: 'Смены на любой работе — особенно на госслужбе', keys: { shift: 0.04, stateShift: 0.06 } },
  beer: { where: 'Рыбалка, шашлыки, дартс и напёрстки во вкладке «Отдых»', keys: { leisureGame: 0.12 } },
  kinder: { where: 'Свидания и игры с детьми', keys: { date: 0.06, kidPlay: 0.12 } },
  turbo: { where: 'Угон машин в «Криминале», прогулки с питомцем', keys: { crimeOk: 0.12, petWalk: 0.1 } },
};
function dropFromSet(setId) {
  const set = COLLECTIONS.find((s) => s.id === setId);
  if (!set) return;
  const missing = set.items.filter(([id]) => !collHas(id));
  if (!missing.length) return;
  const [id, name, emoji] = pick(missing);
  if (!S.coll) S.coll = {};
  S.coll[id] = Date.now();
  track('collectible');
  if (collDone(set)) {
    addCaps(3); confetti(100); sfx('ach');
    resultModal({ emoji: set.emoji, title: `Коллекция собрана: ${set.name}!`, text: `+3 крышки и бонус навсегда: <b>${set.bonus}</b>`, btn: 'Ура!' });
    track('collectionDone');
  } else {
    toast(`${emoji} Редкость для коллекции «${set.name}»: ${name} (${set.items.filter(([x]) => collHas(x)).length}/${set.items.length})`, 'good');
    sfx('loot');
  }
}
HOOKS.track.push((k) => {
  for (const [setId, w] of Object.entries(COLL_WHERE)) if (w.keys[k] && Math.random() < w.keys[k]) { setTimeout(() => dropFromSet(setId), 1200); return; }
});

const RARE_TIPS = [
  ['🗑️', 'Мусорка', 'Главный источник: 22% шанс на коллекционную редкость, а ещё хлам для рынка и «Золотая крышка». Транспорт сокращает ожидание — значит, больше поисков'],
  ['💍', 'Колечко и картина', 'Самый дорогой хлам. Падает из мусорки (редко), его притаскивает крыса-добытчица и находит питомец на прогулке'],
  ['🐀', 'Питомцы', 'Крыса раз в ~10 минут тащит хлам, голубь с 6 уровня дружбы — золотые крышки, на прогулке питомец что-то находит'],
  ['🕶️', 'Криминал', 'Удачное дело — 25% шанс на редкость. Угон машин чаще всего даёт вкладыши «Турбо»'],
  ['🎣', 'Отдых', 'После мини-игр отдыха попадаются пробки от редкого пива'],
  ['💰', 'Дубликаты', 'Повторную редкость Шнырь сразу покупает — чем выше уровень, тем дороже'],
];
const _collTab = EXTRA_TABS.tasks.coll;
EXTRA_TABS.tasks.coll = () => {
  let html = _collTab();
  COLLECTIONS.forEach((set) => {
    const w = COLL_WHERE[set.id];
    if (!w) return;
    html = html.replace(`<div class="card-desc">${collDone(set) ? '✅' : '🎁'} ${set.bonus}</div>`,
      `<div class="card-desc">${collDone(set) ? '✅' : '🎁'} ${set.bonus}</div>${collDone(set) ? '' : `<div class="coll-where">🔎 Где искать: ${w.where}</div>`}`);
  });
  return `<details class="rare-guide"><summary>🔎 Путеводитель охотника за редкостями</summary>${RARE_TIPS.map(([e, t, d]) => `<div class="rg-row"><span>${e}</span><div><b>${t}</b><small>${d}</small></div></div>`).join('')}</details>` + html;
};

// Советы на главном экране: если до коллекции не хватает одной-двух вещей — подскажем, где искать
ADVICE.push(
  { id: 'collNear', cond: () => !!collNear(), get t() { const c = collNear(); return c ? `${c.set.emoji} До коллекции «${c.set.name}» не хватает ${c.left}. ${COLL_WHERE[c.set.id].where}` : ''; } },
  { id: 'rareItems', cond: () => level() >= 4 && Object.keys(S.coll || {}).length < 3, t: '🔎 Редкости для коллекций лежат в мусорках, на делах и в отдыхе — путеводитель в Задания → Коллекции' },
  { id: 'ratPet', cond: () => level() >= 3 && !(S.pets || []).includes('rat'), t: '🐀 Крыса-добытчица сама таскает хлам для рынка — иногда даже колечки' },
);
function collNear() {
  for (const set of COLLECTIONS) {
    const left = set.items.filter(([id]) => !collHas(id)).length;
    if (left > 0 && left <= 2 && COLL_WHERE[set.id]) return { set, left };
  }
  return null;
}
