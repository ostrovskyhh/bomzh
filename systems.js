// Системы: настройки и журнал, инвентарь и рынок Шныря, питомцы, бизнесы, транспорт,
// жильё (аренда, коммуналка, поломки), престиж, достижения, сезонные ивенты.

const MONTH_MS = 3 * 3600000; // 1 игровой месяц = 3 часа реального времени

// ---------- Состояние по умолчанию для новых систем ----------

function sysDefaults() {
  return {
    settings: { sfx: true, music: true, vibro: true },
    log: [], counters: {}, inv: {},
    pets: [], pet: null, petFood: 80, petFedAt: Date.now(), petFindAt: Date.now() + 8 * 60000, petPetAt: 0,
    biz: {},
    transport: 0, fuel: 100, transportBroken: false, transportV2: true, garages: [],
    ownedHousing: 0, housingMode: 'own', billDue: 0, debt: 0, missed: 0, breakdowns: [], nextBreakAt: Date.now() + 20 * 60000,
    prestige: 0, pp: 0, perks: {},
    ach: {}, achNotified: {},
    seasonCur: {},
    jobs: {},
  };
}
HOOKS.load.push(() => {
  const d = sysDefaults();
  for (const k in d) if (S[k] === undefined) S[k] = d[k];
  for (const k in d.settings) if (S.settings[k] === undefined) S.settings[k] = d.settings[k];
});

function esc(s) { return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function strip(s) { return String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

// =====================================================================
// Настройки и журнал событий
// =====================================================================

function logEvent(text, kind = '') {
  if (!S.log) return;
  S.log.unshift({ t: Date.now(), text: strip(text), kind });
  if (S.log.length > 150) S.log.length = 150;
}

// Итоги в модальных окнах тоже пишем в журнал
const _resultModal = resultModal;
resultModal = function (o) {
  logEvent(`${o.emoji || '•'} ${o.title}: ${strip(o.text)}`, o.rays === 'bad' ? 'bad' : 'good');
  _resultModal(o);
};

function timeStr(t) {
  const d = new Date(t), now = new Date();
  const hm = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return hm;
  return `${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} ${hm}`;
}

function openSettings() {
  const row = (key, label, desc) => `<div class="set-row"><div><b>${label}</b><small>${desc}</small></div>
    <button class="switch ${S.settings[key] ? 'on' : ''}" data-act="toggleSet" data-id="${key}"><i></i></button></div>`;
  openModal(`<h3>⚙️ Настройки</h3>
    <div class="set-list">
      ${row('sfx', 'Звуки', 'Тапы, монеты, покупки, драки')}
      ${row('music', 'Музыка', 'Лаунж-джаз в казино')}
      ${row('vibro', 'Вибрация', 'Отклик телефона на действия')}
    </div>
    <div class="btns">
      <button class="btn wide" data-act="journal">📜 Журнал событий</button>
      <button class="btn wide" data-act="restartTut">🎓 Пройти обучение заново</button>
      <button class="btn wide" data-act="story">🎬 Посмотреть интро</button>
      <button class="btn wide" data-act="reset" style="color:var(--red)">Сбросить прогресс</button>
      <button class="btn primary wide" data-act="close">Готово</button>
    </div>
    <p class="test-note">Симулятор бомжа · тестовая сборка 0.5</p>`, { center: true });
}

function openJournal() {
  const rows = S.log.map((e) => `<div class="jrow ${e.kind.includes('bad') ? 'bad' : e.kind.includes('good') ? 'good' : ''}"><time>${timeStr(e.t)}</time><span>${esc(e.text)}</span></div>`).join('');
  openModal(`<h3>📜 Журнал событий</h3><div class="journal">${rows || '<p>Пока ничего не случилось</p>'}</div>
    <div class="btns"><button class="btn primary wide" data-act="settings">Назад</button></div>`, { center: true });
}

Object.assign(ACTIONS, {
  settings: () => openSettings(),
  journal: () => openJournal(),
  toggleSet: (key, btn) => {
    S.settings[key] = !S.settings[key];
    btn.classList.toggle('on', S.settings[key]);
    if (key === 'music' && typeof syncMusic === 'function') syncMusic();
  },
});

// =====================================================================
// Инвентарь и рынок Шныря
// =====================================================================

const ITEMS = {
  scrap: { name: 'Металлолом', emoji: '🔩', base: 12, w: 40 },
  copper: { name: 'Медный провод', emoji: '🧵', base: 45, w: 25 },
  battery: { name: 'Старый аккумулятор', emoji: '🔋', base: 110, w: 15 },
  phone: { name: 'Разбитый телефон', emoji: '📱', base: 220, w: 10 },
  watch: { name: 'Старые часы', emoji: '⌚', base: 600, w: 6 },
  ring: { name: 'Колечко', emoji: '💍', base: 2200, w: 3 },
  painting: { name: 'Картина «Под Шишкина»', emoji: '🖼️', base: 7500, w: 1 },
};

// Цены плавают по часам: у каждого предмета своя «волна»
function itemPrice(id, t = Date.now()) {
  const k = Object.keys(ITEMS).indexOf(id) + 1;
  const h = t / 3600000;
  return Math.max(1, Math.round(ITEMS[id].base * (1 + 0.35 * Math.sin(h * 0.9 + k * 1.7) + 0.15 * Math.sin(h * 2.3 + k))));
}

function addItem(id, n = 1) { S.inv[id] = (S.inv[id] || 0) + n; }

function rollItem() {
  const ids = Object.keys(ITEMS);
  const total = ids.reduce((a, id) => a + ITEMS[id].w, 0);
  let r = Math.random() * total;
  return ids.find((id) => (r -= ITEMS[id].w) < 0) || 'scrap';
}

// Мусорка иногда дарит ещё и хлам для рынка
function onTrashExtra() {
  if (Math.random() < 0.45) {
    const id = rollItem();
    addItem(id);
    setTimeout(() => toast(`🎒 В сумку: ${ITEMS[id].emoji} ${ITEMS[id].name}. Продай у Шныря`, 'good'), 600);
  }
  seasonDrop(3 + Math.floor(Math.random() * 4));
}

// Сделки Шныря меняются каждые 30 минут
const DEALS = [
  { id: 'energy', name: 'Палёный энергетик', emoji: '🥤', price: 30, desc: '+40 энергии, но 30% отравиться', run: () => { S.energy += 40; if (Math.random() < 0.3) { addEffect('poison', 4); return '+40 ⚡… и 🤢 отравление'; } return '+40 ⚡'; } },
  { id: 'lotto', name: 'Лотерейка от Шныря', emoji: '🎟️', price: 50, desc: '25% выиграть 150–400 ₽', run: () => { if (Math.random() < 0.25) { const m = Math.round(rand(150, 400)); addMoney(m); return `Выигрыш ${fmt(m)} ₽!`; } return 'Пусто. Шнырь ухмыляется'; } },
  { id: 'scrapbag', name: 'Мешок металлолома', emoji: '🔩', price: 90, desc: '10 металлолома — перепродай, когда цена вырастет', run: () => (addItem('scrap', 10), '+10 🔩 в сумку') },
  { id: 'pills', name: 'Таблетки «от всего»', emoji: '💊', price: 80, desc: '50% вылечит любую болячку, 50% — отравит', run: () => {
      const bad = activeEffects().filter((e) => EFFECTS[e.id].kind !== 'good' && !(typeof STIS !== 'undefined' && STIS.includes(e.id)));
      if (Math.random() < 0.5 && bad.length) { const e = pick(bad); S.effects = S.effects.filter((x) => x !== e); track('cured'); return `Помогло! Прошло: ${EFFECTS[e.id].name}`; }
      addEffect('poison', 3); return 'Не помогло. 🤢 Отравление'; } },
  { id: 'petfood', name: 'Корм «Вискас» (просрочка)', emoji: '🥫', price: 20, desc: 'Накормить питомца за копейки', run: () => { if (!S.pet) return 'У тебя нет питомца… Съел сам. Сытость +5'; S.petFood = 100; return 'Питомец наелся и доволен'; } },
  { id: 'kedy', name: 'Б/у кеды «Abibas»', emoji: '👟', price: 700, desc: 'Половина цены магазина', cond: () => !S.owned.shoes.includes('kedy'), run: () => { S.owned.shoes.push('kedy'); return 'Кеды твои! Надень в магазине одежды'; } },
  { id: 'scooter', name: 'Самокат «с историей»', emoji: '🛴', price: 600, desc: 'Дешевле магазина, но 40% окажется сломан', cond: () => S.transport === 0, run: () => { S.transport = 1; S.transportBroken = Math.random() < 0.4; return S.transportBroken ? 'Самокат твой… но он сломан. Почини в «Транспорте»' : 'Отличный самокат за копейки!'; } },
  { id: 'phone', name: 'Телефон «без коробки»', emoji: '📱', price: 180, desc: 'Можно перепродать дороже. Или прийдёт участковый', run: () => { if (Math.random() < 0.2) { const m = takeMoney(0.1, 200); return `Участковый изъял телефон и выписал штраф ${fmt(m)} ₽`; } addItem('phone'); return '+1 📱 в сумку'; } },
];

function currentDeals() {
  const slot = Math.floor(Date.now() / 1800000);
  const avail = DEALS.filter((d) => !d.cond || d.cond());
  const out = [];
  for (let i = 0; out.length < 3 && i < 20; i++) {
    const d = avail[(slot * 7 + i * 3) % avail.length];
    if (d && !out.includes(d)) out.push(d);
  }
  return out;
}

const SHNYR_LINES = [
  '«Чё надо? Только быстро, я тут не стою»', '«Всё чистое, мамой клянусь»', '«Есть тема. Не для всех»',
  '«Опять ты? Ну ладно, для своих скидка»', '«Металл нынче в цене, тащи всё»',
];

EXTRA_TABS.fun.market = () => {
  const ids = Object.keys(S.inv).filter((id) => S.inv[id] > 0);
  const slotLeft = (1800000 - (Date.now() % 1800000)) / 1000;
  const bought = S.dealsBought || {};
  const slot = Math.floor(Date.now() / 1800000);
  return `<div class="card shnyr"><div class="thumb">🦊</div><div class="card-body"><div class="card-title">Шнырь</div>
      <div class="card-desc">${SHNYR_LINES[slot % SHNYR_LINES.length]}</div></div></div>
    <div class="subhead">Скупка хлама · цены меняются каждый час</div>
    ${ids.length ? ids.map((id) => {
      const it = ITEMS[id], p = itemPrice(id), prev = itemPrice(id, Date.now() - 3600000);
      const trend = p >= prev ? '<span style="color:var(--green)">▲</span>' : '<span style="color:var(--red)">▼</span>';
      return card({ thumb: it.emoji, title: `${it.name} ×${S.inv[id]}`, desc: `Сейчас: <b>${fmt(p)} ₽</b> ${trend} · обычно ~${fmt(it.base)} ₽`,
        btn: `<div class="btn-col"><button class="btn primary small" data-act="sellItem" data-id="${id}:1">Продать 1</button>${S.inv[id] > 1 ? `<button class="btn small" data-act="sellItem" data-id="${id}:all">Все</button>` : ''}</div>` });
    }).join('') : '<div class="info-card">Сумка пуста. Хлам находится в мусорках, его можно продать Шнырю.</div>'}
    <div class="subhead">Товар дня · обновится через <span data-until="${Date.now() + slotLeft * 1000}"></span></div>
    ${currentDeals().map((d) => card({ thumb: d.emoji, title: d.name, desc: d.desc,
      btn: bought[`${slot}:${d.id}`] ? '<button class="btn" disabled>Куплено</button>' : priceBtn('deal', d.id, d.price, S.money >= d.price) })).join('')}`;
};

Object.assign(ACTIONS, {
  sellItem: (arg) => {
    const [id, n] = arg.split(':');
    const count = n === 'all' ? S.inv[id] : 1;
    if (!S.inv[id]) return;
    const m = itemPrice(id) * count;
    S.inv[id] -= count;
    addMoney(m);
    track('marketSold', count);
    sfx('coin');
    toast(`Шнырь взял ${ITEMS[id].emoji}×${count} за ${fmt(m)} ₽`, 'good');
  },
  deal: (id) => {
    const d = DEALS.find((x) => x.id === id);
    const slot = Math.floor(Date.now() / 1800000);
    S.dealsBought = S.dealsBought || {};
    if (S.money < d.price || S.dealsBought[`${slot}:${id}`]) return;
    S.money -= d.price;
    S.dealsBought = { [`${slot}:${id}`]: true, ...Object.fromEntries(Object.entries(S.dealsBought).filter(([k]) => k.startsWith(slot + ':'))) };
    sfx('buy');
    toast(`${d.emoji} ${d.run()}`);
  },
});

// =====================================================================
// Питомцы — для души, на экономику влияют чуть-чуть
// =====================================================================

const PETS = [
  { id: 'pigeon', name: 'Голубь Гоша', art: 'pigeon', price: 50, level: 1, sound: 'chirp', perk: 'Иногда приносит блестяшки (мелочь)' },
  { id: 'rat', name: 'Крыса Лариска', art: 'rat', price: 150, level: 2, sound: 'squeak', perk: 'Иногда притаскивает корку хлеба' },
  { id: 'dog', name: 'Дворняга Шарик', art: 'dog', price: 400, level: 3, sound: 'bark', perk: 'Охраняет во сне: шанс кражи вдвое меньше' },
  { id: 'hedgehog', name: 'Ёжик Колючка', art: 'hedgehog', price: 900, level: 5, sound: 'squeak', perk: 'Фырчит и радует: +0.3 радости/мин' },
  { id: 'parrot', name: 'Попугай Кеша', art: 'parrot', price: 5000, level: 8, sound: 'chirp', perk: 'Болтает глупости: +0.4 радости/мин' },
  { id: 'cat', name: 'Кот Барсик', art: 'cat', price: 0, quest: true, sound: 'meow', perk: 'Тот самый Барсик! +0.5 радости/мин' },
];
const PARROT_LINES = ['Кеша хор-роший!', 'Валер-ра, сдай бутылки!', 'Шнырь — жулик!', 'Карамба!', 'Эдик, верни квартиру!', 'Михалыч, наливай!'];

function activePet() { return S.pet && PETS.find((p) => p.id === S.pet); }
function petHappy() { return S.pet && S.petFood > 20; }
function petGuardMult() { return S.pet === 'dog' && petHappy() ? 0.5 : 1; }

HOOKS.mods.push((m) => {
  if (!petHappy()) return;
  m.mpm += { hedgehog: 0.3, parrot: 0.4, cat: 0.5 }[S.pet] || 0;
});

HOOKS.tick.push(() => {
  if (!S.pet) return;
  const now = Date.now();
  // Питомец голодает: −1 в 6 минут
  const hungry = (now - S.petFedAt) / 360000;
  if (hungry >= 1) { S.petFood = Math.max(0, S.petFood - Math.floor(hungry)); S.petFedAt = now; }
  if (now >= S.petFindAt) {
    S.petFindAt = now + rand(7, 11) * 60000;
    if (!petHappy()) return;
    if (S.pet === 'pigeon') { const m = Math.round(rand(2, 8)); addMoney(m); toast(`🕊️ Гоша принёс блестяшку: +${m} ₽`, 'good'); sfx('chirp'); }
    if (S.pet === 'rat') { feed(5); toast('🐀 Лариска притащила корку: +5 🍞', 'good'); sfx('squeak'); }
    if (S.pet === 'parrot') { petBubble(pick(PARROT_LINES)); sfx('chirp'); }
  }
});

function petBubble(text) {
  const slot = $('petSlot');
  if (!slot || !slot.firstChild) return;
  const b = document.createElement('div');
  b.className = 'pet-bubble';
  b.textContent = text;
  slot.appendChild(b);
  setTimeout(() => b.remove(), 2500);
}

let renderedPet = '';
HOOKS.hud.push(() => {
  const slot = $('petSlot');
  const key = (S.pet || '') + (petHappy() ? 1 : 0);
  if (key === renderedPet) return;
  renderedPet = key;
  const p = activePet();
  slot.innerHTML = p ? `<div class="pet ${petHappy() ? '' : 'sad'}" data-act="petTap" data-silent="1">${PET_ART[p.art]}</div>` : '';
});

EXTRA_TABS.shop.pets = () => {
  const p = activePet();
  return `<div class="info-card">Питомцы — для души. Их надо кормить, а взамен они радуют и немного помогают. Гладь питомца, тапая по нему на главном экране.</div>
    ${p ? card({ thumb: PET_ART[p.art], title: `${p.name} с тобой`, cls: 'current',
      desc: `${p.perk}<br>Сытость питомца: <b>${Math.floor(S.petFood)}/100</b>${S.petFood <= 20 ? ' — <span style="color:var(--red)">голодный, бонусов нет!</span>' : ''}`,
      btn: priceBtn('petFeed', '', 40, S.money >= 40 && S.petFood < 95, '🥣 40 ₽') }) : ''}
    <div class="subhead">Все питомцы</div>
    ${PETS.map((pet) => {
      const owned = S.pets.includes(pet.id);
      const lvlOk = level() >= (pet.level || 1);
      let btn;
      if (S.pet === pet.id) btn = '<button class="btn" disabled>С тобой</button>';
      else if (owned) btn = `<button class="btn green" data-act="petPick" data-id="${pet.id}">Взять</button>`;
      else if (pet.quest) btn = '<button class="btn" disabled>📖 Сюжет</button>';
      else if (!lvlOk) btn = lockBtn;
      else btn = priceBtn('petBuy', pet.id, pet.price, S.money >= pet.price);
      return card({ thumb: PET_ART[pet.art], title: pet.name, desc: pet.perk, cls: owned || lvlOk ? '' : 'locked',
        extra: !owned && !lvlOk ? reqHTML({ level: pet.level }) : '', btn });
    }).join('')}`;
};

Object.assign(ACTIONS, {
  petBuy: (id) => {
    const p = PETS.find((x) => x.id === id);
    if (S.money < p.price || S.pets.includes(id)) return;
    S.money -= p.price;
    S.pets.push(id);
    S.pet = id;
    S.petFood = 80; S.petFedAt = Date.now();
    sfx(p.sound);
    toast(`${p.name} теперь с тобой!`, 'good');
  },
  petPick: (id) => { S.pet = id; sfx(PETS.find((x) => x.id === id).sound); },
  petFeed: () => { if (S.money < 40) return; S.money -= 40; S.petFood = 100; S.petFedAt = Date.now(); sfx('eat'); toast('Питомец наелся и счастлив', 'good'); },
  petTap: () => {
    const p = activePet();
    if (!p) return;
    sfx(p.sound);
    haptic('light');
    const slot = $('petSlot');
    for (let i = 0; i < 4; i++) {
      const h = document.createElement('div');
      h.className = 'pet-heart';
      h.textContent = petHappy() ? '❤️' : '💧';
      h.style.left = rand(10, 70) + '%';
      h.style.animationDelay = i * 0.1 + 's';
      slot.appendChild(h);
      setTimeout(() => h.remove(), 1400);
    }
    if (p.id === 'parrot') petBubble(pick(PARROT_LINES));
    if (Date.now() - S.petPetAt > 30000 && petHappy()) { S.petPetAt = Date.now(); addMood(1); }
  },
});

// =====================================================================
// Бизнесы — пассивный доход с долгой окупаемостью (60–100+ часов)
// =====================================================================

const BUSINESSES = [
  { id: 'stall', name: 'Точка приёма стеклотары', emoji: '🍾', price: 8000, level: 6, income: 110 },
  { id: 'shawarma', name: 'Ларёк с шаурмой', emoji: '🌯', price: 40000, level: 9, income: 480 },
  { id: 'carwash', name: 'Автомойка', emoji: '🚿', price: 150000, level: 12, income: 1500 },
  { id: 'cafe', name: 'Кафе «У Михалыча»', emoji: '☕', price: 600000, level: 15, income: 5200 },
  { id: 'shops', name: 'Сеть магазинов «Валерыч»', emoji: '🏬', price: 3000000, level: 20, income: 22000 },
];
const BIZ_MAX_LVL = 5;
const BIZ_TAX = 0.1;
const BIZ_CAP_HOURS = 6;

function bizIncome(b, st) { return b.income * (1 + 0.35 * (st.lvl - 1)) * (st.broken ? 0.5 : 1) * prestigeMult(); }
function bizCap(b, st) { return bizIncome(b, st) * BIZ_CAP_HOURS * (isVip() ? 2 : 1); }
function bizUpgradeCost(b, st) { return Math.round(b.price * 0.6 * st.lvl); }

HOOKS.tick.push(() => {
  const now = Date.now();
  for (const b of BUSINESSES) {
    const st = S.biz[b.id];
    if (!st) continue;
    const hours = (now - st.last) / 3600000;
    st.last = now;
    st.cash = Math.min(bizCap(b, st), st.cash + bizIncome(b, st) * hours);
    // Раз в 20–40 минут у бизнеса что-то случается
    if (now >= (st.eventAt || 0)) {
      st.eventAt = now + rand(20, 40) * 60000;
      if (!st.started || now - st.started < 60000) continue;
      const r = Math.random();
      if (r < 0.2) { const lost = Math.floor(st.cash * 0.15); st.cash -= lost; toast(`${b.emoji} Налоговая проверка в «${b.name}»: −${fmt(lost)} ₽ из кассы`, 'bad'); }
      else if (r < 0.35) { st.cash = Math.min(bizCap(b, st), st.cash + bizIncome(b, st) * 0.5); toast(`${b.emoji} Наплыв клиентов в «${b.name}»! Касса пополнилась`, 'good'); }
      else if (r < 0.45 && !st.broken) { st.broken = true; toast(`${b.emoji} В «${b.name}» сломалось оборудование: доход −50%, нужен ремонт`, 'bad'); sfx('break'); }
    }
  }
});

EXTRA_TABS.life.business = () => {
  const totalH = BUSINESSES.reduce((a, b) => a + (S.biz[b.id] ? bizIncome(b, S.biz[b.id]) : 0), 0);
  return `<div class="info-card">Бизнес приносит деньги, даже когда ты не играешь. Деньги копятся в кассе (максимум ${BIZ_CAP_HOURS} ч дохода${isVip() ? ', с VIP — вдвое больше' : ''}), налог ${BIZ_TAX * 100}%. Заходи забирать!
      <br>Сейчас: <b>${fmt(totalH * (1 - BIZ_TAX))} ₽/ч</b> чистыми</div>
    ${BUSINESSES.map((b) => {
      const st = S.biz[b.id];
      if (!st) {
        const ok = level() >= b.level;
        return card({ thumb: b.emoji, title: b.name, cls: ok ? '' : 'locked',
          desc: `Доход: <b>${fmt(b.income)} ₽/ч</b> · окупаемость ~${Math.round(b.price / (b.income * (1 - BIZ_TAX)))} ч`,
          extra: ok ? '' : reqHTML({ level: b.level }), btn: ok ? priceBtn('bizBuy', b.id, b.price, S.money >= b.price) : lockBtn });
      }
      const pct = st.cash / bizCap(b, st);
      return `<div class="card card-col biz">
        <div class="biz-head"><div class="thumb">${b.emoji}</div><div class="card-body"><div class="card-title">${b.name} <span class="rarity rare">ур. ${st.lvl}</span></div>
          <div class="card-desc">${fmt(bizIncome(b, st))} ₽/ч${st.broken ? ' · <span style="color:var(--red)">🔧 сломано, доход −50%</span>' : ''}</div></div></div>
        <div class="progress"><div style="width:${pct * 100}%;${pct >= 1 ? 'background:var(--red)' : ''}"></div></div>
        <div class="card-desc">Касса: <b>${fmt(st.cash)} ₽</b>${pct >= 1 ? ' — <span style="color:var(--red)">полная, доход стоит!</span>' : ''}</div>
        <div class="row-btns">
          <button class="btn primary" data-act="bizCollect" data-id="${b.id}" ${st.cash >= 1 ? '' : 'disabled'}>Забрать</button>
          ${st.lvl < BIZ_MAX_LVL ? priceBtn('bizUp', b.id, bizUpgradeCost(b, st), S.money >= bizUpgradeCost(b, st), `⬆️ ${fmt(bizUpgradeCost(b, st))}`) : '<button class="btn" disabled>MAX</button>'}
          ${st.broken ? priceBtn('bizFix', b.id, b.price * 0.05, S.money >= b.price * 0.05, `🔧 ${fmt(b.price * 0.05)}`) : '<button class="btn" disabled>✓ Исправен</button>'}
        </div></div>`;
    }).join('')}`;
};

Object.assign(ACTIONS, {
  bizBuy: (id) => {
    const b = BUSINESSES.find((x) => x.id === id);
    if (S.biz[id] || S.money < b.price || level() < b.level) return;
    S.money -= b.price;
    S.biz[id] = { lvl: 1, cash: 0, last: Date.now(), started: Date.now(), eventAt: Date.now() + 20 * 60000 };
    track('bizBuy');
    sfx('buy'); confetti(40);
    toast(`${b.emoji} Ты владелец: ${b.name}!`, 'good');
  },
  bizCollect: (id, btn) => {
    const st = S.biz[id];
    const m = Math.floor(st.cash * (1 - BIZ_TAX));
    if (m < 1) return;
    st.cash = 0;
    addMoney(m);
    flyCoins(btn, $('resMoney'), 8);
    toast(`Забрал из кассы ${fmt(m)} ₽ (после налога)`, 'good');
  },
  bizUp: (id) => {
    const b = BUSINESSES.find((x) => x.id === id), st = S.biz[id];
    const cost = bizUpgradeCost(b, st);
    if (S.money < cost || st.lvl >= BIZ_MAX_LVL) return;
    S.money -= cost;
    st.lvl++;
    sfx('buy');
    toast(`${b.emoji} ${b.name}: уровень ${st.lvl}`, 'good');
  },
  bizFix: (id) => {
    const b = BUSINESSES.find((x) => x.id === id), st = S.biz[id];
    const cost = Math.round(b.price * 0.05);
    if (S.money < cost) return;
    S.money -= cost;
    st.broken = false;
    sfx('buy');
    toast('🔧 Отремонтировали!', 'good');
  },
});

// =====================================================================
// Транспорт
// =====================================================================

// trash — во сколько раз короче ожидание мусорки, fuel — расход бензина за смену (₽), job — бонус к оплате «дорожных» работ
// garage — свой гараж для каждой машины: без него машину могут угнать ночью (см. extras.js)
const TRANSPORT = [
  { name: 'Пешком', emoji: '🚶' },
  { name: 'Самокат', emoji: '🛴', price: 1500, level: 4, trash: 0.9, job: 0.05, desc: 'Быстрее до мусорок' },
  { name: 'Электросамокат', emoji: '🛴', price: 4000, level: 5, trash: 0.85, job: 0.08, fuel: 10, desc: 'Заряжается от розетки в подъезде' },
  { name: 'Велосипед', emoji: '🚲', price: 6000, level: 6, trash: 0.8, job: 0.1, desc: 'Курьеры уважают' },
  { name: 'Мопед', emoji: '🛵', price: 25000, level: 9, trash: 0.7, job: 0.15, fuel: 40, desc: 'Нужен бензин' },
  { name: 'Мотоцикл «Урал»', emoji: '🏍️', price: 60000, level: 11, trash: 0.65, job: 0.18, fuel: 80, charm: 0.03, garage: { name: 'Место в сарае', price: 8000 }, desc: 'С коляской. Михалыч просится в коляску' },
  { name: '«Жигули»', emoji: '🚗', price: 90000, level: 12, trash: 0.6, job: 0.2, fuel: 120, charm: 0.05, garage: { name: 'Гараж-ракушка', price: 20000 }, desc: 'Можно таксовать' },
  { name: '«Газель»', emoji: '🚐', price: 180000, level: 14, trash: 0.58, job: 0.25, fuel: 200, charm: 0.04, garage: { name: 'Бокс в кооперативе', price: 45000 }, desc: 'Влезет полрынка. Курьерам и таксистам +25%' },
  { name: 'Иномарка', emoji: '🚙', price: 450000, level: 16, trash: 0.5, job: 0.3, fuel: 300, charm: 0.1, garage: { name: 'Кирпичный гараж', price: 120000 }, desc: 'Девушки оглядываются' },
  { name: 'Внедорожник', emoji: '🛻', price: 2000000, level: 20, trash: 0.4, job: 0.4, fuel: 700, charm: 0.15, garage: { name: 'Тёплый гараж с ямой', price: 400000 }, desc: 'Хозяин района' },
  { name: 'Спорткар', emoji: '🏎️', price: 6000000, level: 23, trash: 0.35, job: 0.45, fuel: 1200, charm: 0.25, garage: { name: 'Подземный паркинг', price: 1200000 }, desc: 'Ноль до сотни быстрее, чем Шнырь врёт' },
  { name: 'Лимузин с водителем', emoji: '🚘', price: 15000000, level: 26, trash: 0.3, job: 0.5, fuel: 2500, charm: 0.3, garage: { name: 'Ангар', price: 3000000 }, desc: 'Эдик плачет в сторонке' },
];
// Старые сохранения: номера транспорта сдвинулись после добавления новых видов
const TRANSPORT_V1_MAP = [0, 1, 3, 4, 6, 8, 9];
// unshift — до слияния с sysDefaults, где у новых игроков transportV2 уже true
HOOKS.load.unshift(() => { if (!S.transportV2) { S.transport = TRANSPORT_V1_MAP[S.transport || 0] || 0; S.transportV2 = true; } });

function vehicle() { return TRANSPORT[S.transport || 0]; }
function trashCdMult() { return S.transportBroken ? 1 : (vehicle().trash || 1); }
function transportJobBonus() { return S.transportBroken ? 0 : (vehicle().job || 0); }

// После смены на транспорте: бензин и шанс поломки
function useTransport() {
  const v = vehicle();
  if (!S.transport || S.transportBroken) return '';
  let note = '';
  if (v.fuel) { S.money = Math.max(0, S.money - v.fuel); note += ` · бензин −${fmt(v.fuel)} ₽`; }
  if (Math.random() < 0.06) { S.transportBroken = true; sfx('break'); note += ` · ${v.emoji} сломался!`; }
  return note;
}

EXTRA_TABS.shop.transport = () => {
  const v = vehicle();
  return `<div class="info-card">Транспорт ускоряет поиск по мусоркам, повышает оплату курьера и таксиста и открывает новые работы. Моторный транспорт ест бензин и иногда ломается.</div>
    ${S.transport ? card({ thumb: v.emoji, title: `Твой: ${v.name}`, cls: 'current',
      desc: `Мусорка быстрее на ${Math.round((1 - v.trash) * 100)}% · работа в дороге +${Math.round(v.job * 100)}%${v.fuel ? ` · бензин ${fmt(v.fuel)} ₽/смена` : ''}${S.transportBroken ? '<br><b style="color:var(--red)">Сломан! Бонусы не работают</b>' : ''}`,
      btn: S.transportBroken ? priceBtn('fixTransport', '', v.price * 0.08, S.money >= v.price * 0.08, `🔧 ${fmt(v.price * 0.08)}`) : '' }) : ''}
    <div class="subhead">Автосалон дяди Ашота</div>
    ${TRANSPORT.slice(1).map((t, k) => {
      const i = k + 1;
      const ok = level() >= t.level;
      const tradeIn = S.transport ? Math.round(vehicle().price * 0.5) : 0;
      let btn;
      if (S.transport === i) btn = '<button class="btn" disabled>Твой</button>';
      else if (S.transport > i) btn = '<button class="btn" disabled>Было</button>';
      else if (!ok) btn = lockBtn;
      else btn = priceBtn('buyTransport', i, t.price - tradeIn, S.money >= t.price - tradeIn);
      return card({ thumb: t.emoji, title: t.name, cls: ok || S.transport >= i ? '' : 'locked',
        desc: `${t.desc}<br><b>Мусорка −${Math.round((1 - t.trash) * 100)}% · работа +${Math.round(t.job * 100)}%</b>${t.fuel ? ` · бензин ${fmt(t.fuel)} ₽` : ''}${tradeIn && S.transport < i ? `<br>С учётом сдачи старого: −${fmt(tradeIn)} ₽` : ''}`,
        extra: ok ? '' : reqHTML({ level: t.level }), btn });
    }).join('')}`;
};

Object.assign(ACTIONS, {
  buyTransport: (id) => {
    const i = +id, t = TRANSPORT[i];
    const cost = t.price - (S.transport ? Math.round(vehicle().price * 0.5) : 0);
    if (S.money < cost || level() < t.level || S.transport >= i) return;
    S.money -= cost;
    S.transport = i;
    S.transportBroken = false;
    track('transport');
    sfx('buy'); confetti(40);
    toast(`${t.emoji} Теперь у тебя ${t.name}!`, 'good');
  },
  fixTransport: () => {
    const cost = Math.round(vehicle().price * 0.08);
    if (S.money < cost) return;
    S.money -= cost;
    S.transportBroken = false;
    sfx('buy');
    toast('🔧 Транспорт как новенький', 'good');
  },
});

// =====================================================================
// Жильё: покупка или аренда, коммуналка, поломки
// =====================================================================

const BREAKDOWNS = [
  { id: 'pipe', name: 'Прорвало трубу', emoji: '🚰', k: 0.6, desc: 'Сырость: радость −1/мин', mods: { mpm: -1 } },
  { id: 'roof', name: 'Протекла крыша', emoji: '🌧️', k: 0.9, desc: 'Сквозняк: здоровье −0.3/мин', mods: { hpm: -0.3 } },
  { id: 'wiring', name: 'Перегорела проводка', emoji: '⚡', k: 0.5, desc: 'Плохо спится: энергия −30%', mods: { regen: 0.7 } },
  { id: 'fridge', name: 'Сломался холодильник', emoji: '🧊', k: 0.4, desc: 'Еда портится: радость −0.5/мин', mods: { mpm: -0.5 } },
  { id: 'lock', name: 'Сломался замок', emoji: '🔓', k: 0.3, desc: 'Тревожно: радость −0.5/мин', mods: { mpm: -0.5 } },
];

function billAmount() {
  const h = HOUSING[S.housing];
  return S.housingMode === 'rent' ? (h.rent || 0) : (h.util || 0);
}

HOOKS.mods.push((m) => {
  for (const b of S.breakdowns || []) {
    const d = BREAKDOWNS.find((x) => x.id === b);
    for (const k in d.mods) { if (ADD_MODS.includes(k)) m[k] += d.mods[k]; else m[k] *= d.mods[k]; }
  }
  if (S.debt > 0 && S.housingMode === 'own' && S.missed >= 1) { m.regen *= 0.5; m.mpm -= 0.5; } // свет отключили
});

HOOKS.track.push((k) => { if (k === 'house') { S.ownedHousing = Math.max(S.ownedHousing, S.housing); S.missed = 0; } });

HOOKS.tick.push(() => {
  const now = Date.now();
  if (S.housing < 3) return;
  if (!S.billDue) S.billDue = now + MONTH_MS;
  let guard = 0;
  while (now >= S.billDue && guard++ < 6) {
    if (S.debt > 0) S.missed++;
    S.debt += billAmount();
    S.billDue += MONTH_MS;
    sfx('notify');
    toast(S.housingMode === 'rent' ? `🧾 Пора платить аренду: ${fmt(billAmount())} ₽` : `🧾 Пришла квитанция за коммуналку: ${fmt(billAmount())} ₽`, 'bad');
    if (S.housingMode === 'rent' && S.missed >= 2) evict();
  }
  // Поломки — только в своём жилье
  if (S.housingMode === 'own' && now >= S.nextBreakAt) {
    S.nextBreakAt = now + rand(15, 30) * 60000;
    if (Math.random() < 0.3) {
      const free = BREAKDOWNS.filter((b) => !S.breakdowns.includes(b.id));
      if (free.length) {
        const b = pick(free);
        S.breakdowns.push(b.id);
        sfx('break');
        toast(`${b.emoji} ${b.name}! ${b.desc}. Почини в «Жильё»`, 'bad');
      }
    }
  }
});

function evict() {
  const from = HOUSING[S.housing].name;
  S.housing = S.ownedHousing;
  S.housingMode = 'own';
  S.debt = 0; S.missed = 0;
  S.billDue = Date.now() + MONTH_MS;
  addMood(-30);
  renderScene();
  resultModal({ emoji: '📦', rays: 'bad', title: 'Выселили!', text: `Два месяца без оплаты — хозяин выставил тебя из «${from}». Ты вернулся в «${HOUSING[S.housing].name}». Радость −30`, btn: 'Эх…' });
}

function repairCost(id) { return Math.max(50, Math.round((HOUSING[S.housing].util || 100) * BREAKDOWNS.find((b) => b.id === id).k)); }

EXTRA_TABS.shop.housing = () => {
  const cur = HOUSING[S.housing];
  const dueLeft = S.billDue ? S.billDue : 0;
  let status = '';
  if (S.housing >= 3) {
    status = `<div class="info-card ${S.debt > 0 ? 'warn' : ''}">
      ${S.housingMode === 'rent' ? `🔑 Аренда: <b>${fmt(cur.rent)} ₽</b> в месяц. Не заплатишь два месяца подряд — выселят.` : `🏠 Своё жильё. Коммуналка: <b>${fmt(cur.util)} ₽</b> в месяц. Долг дольше месяца — отключат свет.`}
      <br>1 игровой месяц = 3 часа. Следующий счёт через <b><span data-until="${dueLeft}"></span></b>
      ${S.debt > 0 ? `<br><b style="color:var(--red)">Долг: ${fmt(S.debt)} ₽${S.missed ? ` · просрочка ${S.missed} мес.` : ''}</b>` : ''}
      ${S.debt > 0 ? `<div style="margin-top:8px">${priceBtn('payBills', '', S.debt, S.money >= S.debt, `Оплатить ${fmt(S.debt)} ₽`)}</div>` : ''}</div>
      ${S.breakdowns.map((id) => { const b = BREAKDOWNS.find((x) => x.id === id); return card({ thumb: b.emoji, title: b.name, desc: b.desc, btn: priceBtn('repair', id, repairCost(id), S.money >= repairCost(id), `🔧 ${fmt(repairCost(id))}`) }); }).join('')}`;
  }
  return status + HOUSING.map((h, i) => {
    const here = i === S.housing;
    const lvlOk = level() >= h.level;
    const owned = i <= S.ownedHousing;
    let btn = '';
    if (here) btn = `<button class="btn" disabled>${S.housingMode === 'rent' ? 'Снимаю' : 'Живу тут'}</button>`;
    else if (owned) btn = `<button class="btn green" data-act="moveHouse" data-id="${i}">Переехать</button>`;
    else if (!lvlOk) btn = lockBtn;
    else btn = `<div class="btn-col">${priceBtn('house', i, h.price, S.money >= h.price, `Купить ${fmt(h.price)}`)}${h.rent ? priceBtn('rentHouse', i, h.rent, S.money >= h.rent, `Снять ${fmt(h.rent)}/мес`) : ''}</div>`;
    return card({ thumb: sceneThumbSVG(i), title: h.name, btn, cls: `${here ? 'current' : ''} ${!owned && !lvlOk ? 'locked' : ''}`,
      desc: `${h.desc}<br>Энергия <b>${h.energy}</b> (+${h.regen}/мин) · здоровье ${h.hpm > 0 ? '+' : ''}${h.hpm}/мин${h.util ? `<br>Коммуналка ${fmt(h.util)} ₽/мес${h.rent ? ` · аренда ${fmt(h.rent)} ₽/мес` : ''}` : ''}`,
      extra: !owned && !lvlOk ? reqHTML({ level: h.level }) : '' });
  }).join('');
};

Object.assign(ACTIONS, {
  house: (id) => {
    const i = +id, h = HOUSING[i];
    if (i <= S.ownedHousing || S.money < h.price || level() < h.level) return;
    S.money -= h.price;
    S.housing = i;
    S.energy = maxEnergy();
    S.housingMode = 'own';
    S.debt = 0; S.missed = 0; S.breakdowns = [];
    S.billDue = Date.now() + MONTH_MS;
    taskProgress('bought');
    addXp(XP.house * i);
    track('house');
    sfx('buy'); haptic('success'); confetti();
    renderScene();
    openModal(`
      <div class="story-art">${sceneThumbSVG(i)}<div class="valera-mini">${valeraSVG(S.eq, lookState())}</div></div>
      <h3>Новое жильё: ${h.name}!</h3><p>${CHAPTERS[i]}</p>
      <div class="btns"><button class="btn primary wide" data-act="close">Дальше</button></div>`, { center: true });
  },
  rentHouse: (id) => {
    const i = +id, h = HOUSING[i];
    if (!h.rent || S.money < h.rent || level() < h.level || i === S.housing) return;
    S.money -= h.rent;
    S.housing = i;
    S.housingMode = 'rent';
    S.debt = 0; S.missed = 0; S.breakdowns = [];
    S.billDue = Date.now() + MONTH_MS;
    S.energy = maxEnergy();
    track('rent');
    sfx('buy');
    renderScene();
    toast(`🔑 Снял «${h.name}». Первый месяц оплачен`, 'good');
  },
  moveHouse: (id) => {
    const i = +id;
    if (i > S.ownedHousing) return;
    S.housing = i;
    S.housingMode = 'own';
    S.debt = 0; S.missed = 0;
    S.billDue = Date.now() + MONTH_MS;
    renderScene();
    toast(`Переехал: ${HOUSING[i].name}`);
  },
  payBills: () => {
    if (S.money < S.debt) return;
    S.money -= S.debt;
    S.debt = 0; S.missed = 0;
    sfx('coin');
    toast('🧾 Все счета оплачены', 'good');
  },
  repair: (id) => {
    const cost = repairCost(id);
    if (S.money < cost) return;
    S.money -= cost;
    S.breakdowns = S.breakdowns.filter((x) => x !== id);
    sfx('buy');
    toast('🔧 Починили!', 'good');
  },
});

// =====================================================================
// Престиж
// =====================================================================

const PERKS = [
  { id: 'hustle', name: 'Хватка', emoji: '✊', desc: '+5% к тапам за уровень', max: 5 },
  { id: 'boss', name: 'Деловая жилка', emoji: '💼', desc: '+5% к оплате работы за уровень', max: 5 },
  { id: 'lucky', name: 'Фартовый', emoji: '🍀', desc: '+1% к шансу крит-тапа за уровень', max: 5 },
  { id: 'tough', name: 'Закалка', emoji: '🛡️', desc: '+0.1 здоровья в минуту за уровень', max: 5 },
  { id: 'cheer', name: 'Оптимист', emoji: '😄', desc: '+0.2 радости в минуту за уровень', max: 5 },
  { id: 'capital', name: 'Заначка', emoji: '💰', desc: '+3000 ₽ на старте нового круга за уровень', max: 5 },
];
const PRESTIGE_REQ = { level: 20, housing: 6 };

function prestigeMult() { return 1 + 0.1 * (S.prestige || 0); }
function xpMult() { return 1 + 0.05 * (S.prestige || 0); }
function perk(id) { return (S.perks && S.perks[id]) || 0; }
function prestigeGain() { return 1 + Math.floor(Math.max(0, level() - PRESTIGE_REQ.level) / 5) + Math.floor(Math.log10(Math.max(1, S.stats.earned / 1e6))); }
function canPrestige() { return level() >= PRESTIGE_REQ.level && S.ownedHousing >= PRESTIGE_REQ.housing; }

HOOKS.mods.push((m) => {
  const p = prestigeMult();
  m.tap *= p * (1 + perk('hustle') * 0.05);
  m.work *= p * (1 + perk('boss') * 0.05);
  m.crit += perk('lucky') * 0.01;
  m.hpm += perk('tough') * 0.1;
  m.mpm += perk('cheer') * 0.2;
});

EXTRA_TABS.tasks.prestige = () => `
  <div class="premium-hero prestige"><div class="e">⭐</div><div><b>Престиж ${S.prestige || 0}</b>
    <p>Каждый круг: +10% ко всему доходу и +5% к опыту навсегда. Очки престижа — на постоянные перки.</p></div></div>
  <div class="info-card">Чтобы начать новый круг: <b>уровень ${PRESTIGE_REQ.level}</b> и <b>свой особняк</b>.
    Сбросятся деньги, уровень, жильё, одежда, образование, бизнесы, транспорт и сюжет. Останутся: престиж, перки, достижения, питомцы и праздничные шапки.
    ${reqHTML({ level: PRESTIGE_REQ.level, housing: 6 })}
    ${canPrestige() ? `<br>Получишь: <b>+${prestigeGain()} очк. престижа</b>` : ''}</div>
  <button class="btn ${canPrestige() ? 'primary' : ''} wide" data-act="prestigeGo" ${canPrestige() ? '' : 'disabled'}>⭐ Начать новый круг</button>
  <div class="subhead">Перки · очков: ${S.pp || 0}</div>
  ${PERKS.map((p) => {
    const l = perk(p.id), cost = l + 1;
    return card({ thumb: p.emoji, title: `${p.name} <span style="color:var(--muted);font-weight:500">${l}/${p.max}</span>`, desc: p.desc,
      extra: `<div class="lvl-pips">${Array.from({ length: p.max }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div>`,
      btn: l >= p.max ? '<button class="btn" disabled>MAX</button>' : `<button class="btn ${S.pp >= cost ? 'primary' : ''}" data-act="perkUp" data-id="${p.id}" ${S.pp >= cost ? '' : 'disabled'}>⭐ ${cost}</button>` });
  }).join('')}`;

Object.assign(ACTIONS, {
  prestigeGo: () => {
    if (!canPrestige()) return;
    const doIt = () => {
      const keep = {
        prestige: (S.prestige || 0) + 1, pp: (S.pp || 0) + prestigeGain(), perks: S.perks, ach: S.ach, achNotified: S.achNotified,
        counters: S.counters, settings: S.settings, log: S.log, pets: S.pets, pet: S.pet, seasonCur: S.seasonCur,
        tut: { step: 99, done: true }, storySeen: true, questHistory: [...(S.questHistory || []), S.quest && S.quest.path].filter(Boolean),
        quest: { idx: 0, path: null, base: { ...(S.counters || {}) }, bossCd: 0, v2: true }, xpV2: true, cutSeen: S.cutSeen || {},
        onlineWins: S.onlineWins || 0, admin: S.admin,
      };
      const seasonal = { hat: S.owned.hat.filter((id) => (CLOTHES.hat.find((h) => h.id === id) || {}).season) };
      S = { ...freshState(), ...sysDefaults(), ...keep };
      S.owned.hat.push(...seasonal.hat);
      S.money = perk('capital') * 3000;
      track('prestigeDone');
      renderedHousing = -1; renderedLook = '';
      save();
      confetti(120);
      sfx('jackpot');
      resultModal({ emoji: '⭐', title: `Престиж ${S.prestige}!`, text: `Валера проснулся на той же лавке… но теперь он знает, как подняться. Доход +${S.prestige * 10}%, опыт +${S.prestige * 5}%. Очков престижа: ${S.pp}`, btn: 'Погнали!' });
    };
    if (tg && tg.initData && tg.showConfirm) tg.showConfirm('Начать новый круг? Деньги и имущество обнулятся.', (ok) => ok && doIt());
    else if (confirm('Начать новый круг? Деньги и имущество обнулятся.')) doIt();
  },
  perkUp: (id) => {
    const p = PERKS.find((x) => x.id === id), cost = perk(id) + 1;
    if (S.pp < cost || perk(id) >= p.max) return;
    S.pp -= cost;
    S.perks[id] = perk(id) + 1;
    sfx('ach');
  },
});

// =====================================================================
// Достижения — многоуровневые и долгие
// =====================================================================

const ACH_REWARDS = [2, 5, 10, 25, 50];
const ACH_TIERS = ['I', 'II', 'III', 'IV', 'V'];
const ACHS = [
  { id: 'taps', name: 'Тапер', emoji: '👆', key: 'taps', goals: [1000, 10000, 50000, 200000, 1000000], unit: 'тапов' },
  { id: 'sold', name: 'Бутылочник', emoji: '🍾', key: 'sold', goals: [1000, 20000, 200000, 1000000, 5000000], unit: 'бутылок сдано' },
  { id: 'earned', name: 'Олигарх', emoji: '💰', fn: () => S.stats.earned, goals: [10000, 1e6, 1e7, 1e8, 1e9], unit: '₽ заработано' },
  { id: 'trash', name: 'Король помоек', emoji: '🗑️', key: 'trash', goals: [25, 150, 500, 1500, 5000], unit: 'мусорок' },
  { id: 'shifts', name: 'Трудоголик', emoji: '💼', key: 'shift', goals: [10, 100, 500, 2000, 5000], unit: 'смен' },
  { id: 'fights', name: 'Гроза района', emoji: '👊', key: 'fightWin', goals: [10, 100, 500, 1500, 5000], unit: 'побед' },
  { id: 'casino', name: 'Лудоман', emoji: '🎰', key: 'casino', goals: [100, 1000, 5000, 20000, 100000], unit: 'ставок' },
  { id: 'jackpot', name: 'Три топора', emoji: '7️⃣', key: 'jackpot', goals: [1, 3, 10], unit: 'джекпотов 777' },
  { id: 'dates', name: 'Ловелас', emoji: '💘', key: 'date', goals: [10, 50, 200, 500, 1000], unit: 'свиданий' },
  { id: 'gym', name: 'Качок', emoji: '🏋️', key: 'gym', goals: [50, 300, 1000, 3000, 10000], unit: 'тренировок' },
  { id: 'cured', name: 'Постоянный пациент', emoji: '🦠', key: 'cured', goals: [5, 30, 100, 300, 1000], unit: 'вылеченных болячек' },
  { id: 'hospital', name: 'Скорая знает адрес', emoji: '🚑', key: 'hospital', goals: [1, 5, 20, 50, 100], unit: 'раз в больнице' },
  { id: 'events', name: 'Улица учит', emoji: '🌆', key: 'events', goals: [100, 1000, 5000, 20000, 50000], unit: 'событий' },
  { id: 'robbed', name: 'Лёгкая добыча', emoji: '🦝', key: 'robbed', goals: [3, 20, 100], unit: 'раз обокрали' },
  { id: 'lessons', name: 'Вечный студент', emoji: '📚', key: 'lesson', goals: [10, 50, 150, 300, 600], unit: 'занятий' },
  { id: 'market', name: 'Барыга', emoji: '🦊', key: 'marketSold', goals: [50, 500, 3000, 10000, 50000], unit: 'вещей продано' },
  { id: 'prestige', name: 'Возрождение', emoji: '⭐', fn: () => S.prestige || 0, goals: [1, 3, 5, 10, 25], unit: 'престижей' },
  { id: 'pets', name: 'Зоолог', emoji: '🐾', fn: () => S.pets.length, goals: [1, 3, 6], unit: 'питомцев' },
  { id: 'biz', name: 'Бизнесмен', emoji: '🏪', fn: () => Object.values(S.biz).reduce((a, b) => a + b.lvl, 0), goals: [1, 5, 12, 20, 25], unit: 'уровней бизнеса' },
  { id: 'clothes', name: 'Модник', emoji: '👔', fn: () => S.owned.hat.length + S.owned.body.length + S.owned.shoes.length - 3, goals: [3, 8, 13, 19], unit: 'вещей' },
  { id: 'season', name: 'Праздник к нам приходит', emoji: '🎉', key: 'seasonItem', goals: [1, 5, 15, 30], unit: 'праздничных покупок' },
  { id: 'story', name: 'Летописец', emoji: '📖', key: 'questDone', goals: [5, 15, 30, 60], unit: 'сюжетных глав' },
];

function achValue(a) { return a.fn ? a.fn() : counter(a.key); }
function achTier(a) { return S.ach[a.id] || 0; } // сколько уровней уже забрано
function achReady(a) { const t = achTier(a); return t < a.goals.length && achValue(a) >= a.goals[t]; }

HOOKS.tick.push(() => {
  if (Math.random() > 0.05) return; // проверяем примерно раз в 5 секунд
  for (const a of ACHS) {
    const t = achTier(a);
    if (achReady(a) && S.achNotified[a.id] !== t) {
      S.achNotified[a.id] = t;
      sfx('ach');
      toast(`🏅 Достижение «${a.name} ${ACH_TIERS[t]}» — забери награду в «Заданиях»`, 'good');
    }
  }
});

EXTRA_TABS.tasks.ach = () => {
  const done = ACHS.reduce((s, a) => s + achTier(a), 0), total = ACHS.reduce((s, a) => s + a.goals.length, 0);
  return `<div class="info-card">Открыто <b>${done} из ${total}</b> уровней достижений. Награда растёт с уровнем: 2 → 5 → 10 → 25 → 50 крышек.</div>` +
    ACHS.map((a) => {
      const t = achTier(a), v = achValue(a), max = t >= a.goals.length;
      const goal = a.goals[Math.min(t, a.goals.length - 1)];
      return card({ thumb: a.emoji, title: `${a.name} ${max ? '✓' : ACH_TIERS[t]}`, cls: max ? 'current' : '',
        desc: max ? `Все уровни открыты · ${fmt(v)} ${a.unit}` : `${fmt(Math.min(v, goal))} / ${fmt(goal)} ${a.unit} · награда ${ACH_REWARDS[t]} кр.`,
        extra: `<div class="lvl-pips">${a.goals.map((_, i) => `<i class="${i < t ? 'on' : ''}"></i>`).join('')}</div>${max ? '' : `<div class="progress"><div style="width:${Math.min(1, v / goal) * 100}%"></div></div>`}`,
        btn: achReady(a) ? `<button class="btn green" data-act="achClaim" data-id="${a.id}">Забрать</button>` : '' });
    }).join('');
};

ACTIONS.achClaim = (id, btn) => {
  const a = ACHS.find((x) => x.id === id);
  if (!achReady(a)) return;
  const t = achTier(a);
  S.ach[id] = t + 1;
  addCaps(ACH_REWARDS[t]);
  addXp(20 * (t + 1));
  flyCoins(btn, $('resCaps'), 6, 'cap');
  sfx('ach');
  confetti(40);
};

HOOKS.hud.push(() => {
  const ready = ACHS.some(achReady);
  if (ready) $('tasksDot').classList.remove('hidden');
});

// =====================================================================
// Сезонные ивенты: идут с 20 дней до праздника до 10 дней после
// =====================================================================

const SEASONS = [
  { id: 'newyear', name: 'Новый год', emoji: '🎄', m: 12, d: 31, cur: '🍊', curName: 'мандарины', hat: 'santa', hatName: 'Шапка Деда Мороза' },
  { id: 'feb23', name: '23 февраля', emoji: '🎖️', m: 2, d: 23, cur: '🧦', curName: 'носки', hat: 'pilotka', hatName: 'Пилотка' },
  { id: 'march8', name: '8 марта', emoji: '🌷', m: 3, d: 8, cur: '🌷', curName: 'тюльпаны', hat: 'flowers', hatName: 'Венок из цветов' },
  { id: 'april1', name: 'День дурака', emoji: '🤡', m: 4, d: 1, cur: '🎈', curName: 'шарики', hat: 'jester', hatName: 'Колпак шута' },
  { id: 'sept1', name: 'День знаний', emoji: '🔔', m: 9, d: 1, cur: '📒', curName: 'тетрадки', hat: 'graduate', hatName: 'Шапка выпускника' },
  { id: 'halloween', name: 'Хэллоуин', emoji: '🎃', m: 10, d: 31, cur: '🍬', curName: 'конфеты', hat: 'pumpkin', hatName: 'Тыква на голову' },
];
const SEASON_BEFORE = 20, SEASON_AFTER = 10;

// Сезонные шапки — в общем списке одежды, но купить их можно только в ивенте
SEASONS.forEach((s) => CLOTHES.hat.push({ id: s.hat, name: s.hatName, price: 0, tier: 0, season: true }));

function activeSeasons(now = new Date()) {
  const day = 86400000;
  return SEASONS.map((s) => {
    for (const y of [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]) {
      const h = new Date(y, s.m - 1, s.d).getTime();
      if (now.getTime() >= h - SEASON_BEFORE * day && now.getTime() < h + (SEASON_AFTER + 1) * day) return { ...s, holiday: h, ends: h + (SEASON_AFTER + 1) * day };
    }
    return null;
  }).filter(Boolean);
}
function season() { return activeSeasons()[0] || null; }

function seasonDrop(n) {
  const s = season();
  if (!s) return;
  S.seasonCur[s.id] = (S.seasonCur[s.id] || 0) + n;
}

// Валюта ивента капает с тапов, событий и драк
function onTapExtra() { if (Math.random() < 0.02) { seasonDrop(1); const s = season(); if (s) floatAt($('resBottles'), `+1 ${s.cur}`, 'good'); } }
HOOKS.track.push((k) => { if (k === 'events') seasonDrop(1); if (k === 'fightWin') seasonDrop(2); });

function seasonShop(s) {
  return [
    { id: 'hat', name: s.hatName, emoji: '🎩', cost: 60, desc: 'Эксклюзив ивента — навсегда твоя', cond: () => !S.owned.hat.includes(s.hat), run: () => { S.owned.hat.push(s.hat); S.eq.hat = s.hat; renderScene(); } },
    { id: 'caps', name: 'Праздничные крышки', emoji: '🟡', cost: 40, desc: '+5 золотых крышек', run: () => addCaps(5) },
    { id: 'mood', name: 'Праздничное настроение', emoji: '🥳', cost: 15, desc: 'Радость на максимум и +25% к доходу на 15 минут', run: () => { S.mood = maxMood(); addEffect('barin', 15); } },
    { id: 'money', name: 'Конверт с деньгами', emoji: '🧧', cost: 10, desc: `+${fmt(150 * scale())} ₽`, run: () => addMoney(Math.round(150 * scale())) },
  ];
}

EXTRA_TABS.shop.season = () => {
  const s = season();
  if (!s) return '<div class="info-card">Сейчас нет праздничных ивентов.</div>';
  const cur = S.seasonCur[s.id] || 0;
  const daysLeft = Math.ceil((s.ends - Date.now()) / 86400000);
  return `<div class="premium-hero season"><div class="e">${s.emoji}</div><div><b>${s.name}</b>
      <p>Ивент идёт ещё ${daysLeft} дн. Собирай ${s.curName} ${s.cur}: они падают с тапов, мусорок, уличных событий и побед в драках.</p></div></div>
    <div class="info-card" style="text-align:center;font-size:18px">У тебя: <b>${cur} ${s.cur}</b></div>
    ${seasonShop(s).filter((it) => !it.cond || it.cond()).map((it) => card({ thumb: it.id === 'hat' ? itemPreviewSVG('hat', s.hat) : it.emoji, title: it.name, desc: it.desc,
      btn: `<button class="btn ${cur >= it.cost ? 'primary' : ''}" data-act="seasonBuy" data-id="${it.id}" ${cur >= it.cost ? '' : 'disabled'}>${it.cost} ${s.cur}</button>` })).join('')}`;
};

ACTIONS.seasonBuy = (id) => {
  const s = season();
  if (!s) return;
  const it = seasonShop(s).find((x) => x.id === id);
  if ((S.seasonCur[s.id] || 0) < it.cost || (it.cond && !it.cond())) return;
  S.seasonCur[s.id] -= it.cost;
  it.run();
  track('seasonItem');
  sfx('buy');
  toast(`${s.emoji} ${it.name} — твоё!`, 'good');
};

let renderedSeason = null;
function renderSeason() {
  const s = season();
  const id = s ? s.id : '';
  if (id === renderedSeason) return;
  renderedSeason = id;
  $('seasonTab').classList.toggle('hidden', !s);
  if (s) $('seasonTab').innerHTML = `<i>${s.emoji}</i><span>${s.name.split(' ')[0]}</span>`;
  const fx = $('seasonFx');
  if (!s) { fx.innerHTML = ''; return; }
  let html = SEASON_ART[s.id] || '';
  if (s.id === 'newyear') html += Array.from({ length: 28 }, () => `<i class="flake" style="left:${rand(0, 100)}%;animation-delay:${rand(0, 8)}s;animation-duration:${rand(6, 11)}s"></i>`).join('');
  fx.innerHTML = html;
}
HOOKS.load.push(renderSeason);
HOOKS.tick.push(() => { if (Math.random() < 0.002) renderSeason(); });
