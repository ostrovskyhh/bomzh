// Криминал 4.2: в каждом городе свои дела и своё развитие. Удачные дела дают криминальный опыт этого города,
// опыт поднимает ранг (у каждого города свои названия), ранг открывает дела посерьёзнее и даёт бонусы:
// больше добычи и меньше риск. Переехал — в новом городе начинаешь с нуля: тебя там никто не знает.
// Засранск: 3 старых дела + 2 новых. Москвабад: 6 своих дел. Мексика: 6 своих (mex2.js).

const CRIME_XP = [0, 80, 250, 600, 1300];
const CRIME_RANKS = {
  zas: ['Шпана', 'Гопник', 'Налётчик', 'Вор', 'Смотрящий'],
  msk: ['Мелкий жулик', 'Схемщик', 'Решала', 'Теневой делец', 'Серый кардинал'],
  mex: ['Ратеро', 'Бандидо', 'Контрабандист', 'Лейтенант', 'Эль Патрон'],
};
const CRIME_RANK_MONEY = 0.12, CRIME_RANK_RISK = 0.02;
function crimeXp(c = city()) { return (S.crimeXp && S.crimeXp[c]) || 0; }
function crimeRank(c = city()) { let r = 0; CRIME_XP.forEach((x, i) => { if (crimeXp(c) >= x) r = i; }); return r; }
function crimeRankName(r = crimeRank(), c = city()) { return (CRIME_RANKS[c] || CRIME_RANKS.zas)[r]; }

// Старым игрокам — опыт Засранска по числу удачных дел
HOOKS.load.push(() => { if (!S.crimeXp) S.crimeXp = { zas: Math.min(CRIME_XP[4], counter('crimeOk') * 15) }; });

// ---------- Засранск: ещё два дела ----------
CRIMES.push(
  { id: 'metal', name: 'Цветмет с заброшенного завода', emoji: '🔩', level: 12, rank: 2, energy: 30, wanted: 2, risk: 0.16, cd: 900, desc: 'Медь и латунь падают с крыши цеха — лови в мешок, сторожевую собаку не трогай',
    game: { title: 'Заброшенный завод', hint: 'Води мешком: лови медь 🟠 и провода 🔌, уворачивайся от кирпичей 🧱 и собаки 🐕', duration: 20, max: 14,
      setup: (mg) => gameCatch(mg, { basket: '🛍️', good: ['🟠', '🔌', '🔩', '🥉'], bad: ['🧱', '🐕'], goodRate: 0.68, badText: 'Ай!' }) },
    reward: (perf) => Math.round((8000 + level() * 600) * perf) },
  { id: 'atm', name: 'Банкомат в подъезде', emoji: '🏧', level: 15, rank: 3, energy: 35, wanted: 3, risk: 0.2, cd: 1500, desc: 'Сверлить точно в замок, пока не приехала охрана',
    game: { title: 'Дрель и банкомат', hint: 'Жми «Сверлить», когда метка в зелёной зоне. Промах — шум', duration: 0, max: 9,
      setup: (mg) => gameTiming(mg, { btn: '🪛 Сверлить', item: '💵', attempts: 6 }) },
    reward: (perf) => Math.round((20000 + level() * 1200) * perf) },
);
const ZAS_RANK = { pocket: 0, kiosk: 0, car: 1 };
CRIMES.forEach((c) => { if (c.rank === undefined) c.rank = ZAS_RANK[c.id] || 0; });

// ---------- Москвабад: свои дела ----------
const MSK_CRIMES = [
  { id: 'm_scooter', name: 'Угон самокатов-шеринга', emoji: '🛴', level: 3, rank: 0, energy: 15, wanted: 1, risk: 0.08, cd: 120, desc: 'Самокат выглядывает из-за угла — хватай, пока приложение его не заблокировало',
    game: { title: 'Самокаты у метро', hint: 'Самокат 🛴 мелькает за укрытиями — тапни, пока не исчез. Патруль 👮 не трогай', duration: 18, max: 11,
      setup: (mg) => gameHide(mg, { spots: ['🚇', '🏢', '🌳', '🚏', '🛍️', '🅿️'], who: '🛴', decoy: ['👮', '📹'], hitText: 'Угнал!' }) },
    reward: (perf) => Math.round((750 + level() * 200) * perf) },
  { id: 'm_tickets', name: 'Перекуп билетов на концерт', emoji: '🎫', level: 6, rank: 0, energy: 25, wanted: 1, risk: 0.12, cd: 300, desc: 'Настоящие билеты — в карман, подделки — в урну. Перепродашь втридорога',
    game: { title: 'У входа в «Москвабад-Арену»', hint: 'Настоящий билет — «Беру», подделку — «Мимо». Быстро!', duration: 22, max: 18,
      setup: (mg) => gameSort(mg, { bins: [{ e: '🎫', name: 'Беру', items: ['🎫', '🎟️', '🎤', '🎸'] }, { e: '🗑️', name: 'Мимо', items: ['📄', '🧻', '🖨️', '❌'] }], limit: 2200 }) },
    reward: (perf) => Math.round((5000 + level() * 750) * perf) },
  { id: 'm_carshare', name: 'Взлом каршеринга', emoji: '🚙', level: 9, rank: 1, energy: 30, wanted: 2, risk: 0.16, cd: 600, desc: 'Повтори код разблокировки, который подсмотрел хакер Стёпа',
    game: { title: 'Код разблокировки', hint: 'Запомни и повтори последовательность. Длиннее код — больше добыча', duration: 25, max: 12,
      setup: (mg) => gameSimon(mg, { items: ['🔴', '🟢', '🔵', '🟡'] }) },
    reward: (perf) => Math.round((40000 + level() * 2000) * perf) },
  { id: 'm_parcel', name: 'Подмена посылок на ПВЗ', emoji: '📦', level: 12, rank: 2, energy: 30, wanted: 2, risk: 0.17, cd: 900, desc: 'Посылки едут по ленте. Хватай дорогие — телефоны и ноутбуки',
    game: { title: 'Лента пункта выдачи', hint: 'Хватай дорогое 📱💻⌚🎧, коробки с носками пусть едут', duration: 22, max: 14,
      setup: (mg) => gameConveyor(mg, { bad: ['📱', '💻', '⌚', '🎧'], good: ['🧦', '🧻', '🧴', '📚', '🪴', '🧸'], badRate: 0.4 }) },
    reward: (perf) => Math.round((60000 + level() * 3000) * perf) },
  { id: 'm_jewel', name: 'Ювелирка в «Москвабад-Молле»', emoji: '💎', level: 15, rank: 3, energy: 35, wanted: 3, risk: 0.2, cd: 1500, desc: 'Настоящий бриллиант спрятан среди стразов. У тебя секунды',
    game: { title: 'Витрина', hint: 'Найди настоящий 💎 среди подделок — снова и снова', duration: 22, max: 10,
      setup: (mg) => gameSpot(mg, { find: '💎', junk: ['💍', '📿', '🔮', '🪩', '💠', '🔷', '⌚', '👑', '🧿', '🪙'] }) },
    reward: (perf) => Math.round((120000 + level() * 5000) * perf) },
  { id: 'm_crypto', name: 'Крипто-обменник в Сити', emoji: '🪙', level: 18, rank: 4, energy: 40, wanted: 4, risk: 0.22, cd: 1800, desc: 'Сид-фразы кошельков на стикерах. Собери пары ключей, пока админ на обеде',
    game: { title: '95-й этаж', hint: 'Открывай карточки по две и находи пары ключей', duration: 25, max: 14,
      setup: (mg) => gamePairs(mg, { items: ['🔑', '🗝️', '🪙', '💳', '🔐', '📱', '💾', '🧾'] }) },
    reward: (perf) => Math.round((250000 + level() * 9000) * perf) },
];
let MSK_CRIMES_ORIG = null;
MSK_RESKIN.push((msk) => {
  if (msk) { if (!MSK_CRIMES_ORIG) MSK_CRIMES_ORIG = CRIMES.slice(); CRIMES.splice(0, CRIMES.length, ...MSK_CRIMES); }
  else if (MSK_CRIMES_ORIG) { CRIMES.splice(0, CRIMES.length, ...MSK_CRIMES_ORIG); MSK_CRIMES_ORIG = null; }
});
// Мексика: ранги для её дел
const MEX_RANK = { x_pick: 0, x_horse: 0, x_tunnel: 1, x_boat: 2, x_casino: 3, x_convoy: 4 };
if (typeof MX_CRIMES !== 'undefined') MX_CRIMES.forEach((c) => { c.rank = MEX_RANK[c.id] || 0; });

// ---------- Ранг: доступ, добыча, риск ----------
crimeCan = (function (orig) {
  return function (c) {
    const why = orig(c);
    if (why) return why;
    if ((c.rank || 0) > crimeRank()) return `Нужен ранг «${crimeRankName(c.rank)}»`;
    return '';
  };
})(crimeCan);
caught = (function (orig) {
  return (c, perf) => orig({ ...c, risk: Math.max(0.02, c.risk - crimeRank() * CRIME_RANK_RISK) }, perf);
})(caught);
let CRIME_CUR = null;
doCrime = (function (orig) {
  return function (id) {
    const c = CRIMES.find((x) => x.id === id);
    if (c && !c._ranked) {
      const base = c.reward;
      c.reward = (perf, mg) => Math.round(base(perf, mg) * (1 + crimeRank() * CRIME_RANK_MONEY));
      c._ranked = true;
    }
    CRIME_CUR = c;
    return orig(id);
  };
})(doCrime);
function addCrimeXp(n) {
  if (!S.crimeXp) S.crimeXp = {};
  const before = crimeRank();
  S.crimeXp[city()] = crimeXp() + n;
  const after = crimeRank();
  if (after > before) {
    track('crimeRank');
    queuePopup('crank' + Date.now(), 2, () => {
      sfx('levelup'); confetti(60);
      resultModal({ emoji: '🕶️', title: `Новый ранг: ${crimeRankName(after)}`, text: `В ${cityName()} о тебе заговорили. Добыча +${Math.round(after * CRIME_RANK_MONEY * 100)}%, риск −${after * CRIME_RANK_RISK * 100}%${CRIMES.some((c) => c.rank === after) ? `.<br>Открылось: <b>${CRIMES.filter((c) => c.rank === after).map((c) => `${c.emoji} ${c.name}`).join(', ')}</b>` : ''}`, btn: 'Тсс…' });
    });
  }
}
HOOKS.track.push((key) => {
  if (key === 'crimeOk' && CRIME_CUR) addCrimeXp(8 + Math.round((CRIME_CUR.level || 3) * 1.5));
  else if (key === 'crime' && CRIME_CUR) addCrimeXp(1);
});

// ---------- Вкладка: карточка ранга и замки на делах ----------
function crimeRankHTML() {
  const r = crimeRank(), xp = crimeXp(), next = CRIME_XP[r + 1];
  const names = CRIME_RANKS[city()] || CRIME_RANKS.zas;
  return `<div class="crank"><div class="crank-h"><span>🕶️</span><div><b>${names[r]}</b><small>Криминальный ранг · ${cityName()}</small></div><em>${r + 1}/${names.length}</em></div>
    <div class="progress"><div style="width:${next ? Math.min(100, ((xp - CRIME_XP[r]) / (next - CRIME_XP[r])) * 100) : 100}%"></div></div>
    <small>${next ? `${fmt(xp)} / ${fmt(next)} опыта до «${names[r + 1]}»` : 'Высший ранг в этом городе'} · добыча +${Math.round(r * CRIME_RANK_MONEY * 100)}% · риск −${r * CRIME_RANK_RISK * 100}%</small>
    <div class="crank-steps">${names.map((n, i) => `<i class="${i <= r ? 'on' : ''}">${n}</i>`).join('')}</div>
    <small class="crank-note">В каждом городе свой ранг и свои дела. Переедешь — начнёшь с нуля: там тебя никто не знает.</small></div>`;
}
const _crimeTab2 = EXTRA_TABS.fun.crime;
EXTRA_TABS.fun.crime = () => {
  let html = _crimeTab2();
  if (!crimeOpen()) return html;
  html = html.replace('<div class="subhead">Дела</div>', `${crimeRankHTML()}<div class="subhead">Дела · ${cityName()}</div>`);
  // У дел, закрытых рангом, — подпись с нужным рангом
  CRIMES.forEach((c) => {
    if ((c.rank || 0) <= crimeRank()) return;
    html = html.replace(new RegExp(`(data-act="crime" data-id="${c.id}"[^>]*>)`), `$1🔒 ${crimeRankName(c.rank)} · `);
  });
  return html;
};
