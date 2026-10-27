// Мексика — третий город (4.0). Валера попался на телефонных мошенников: его заставили обмануть бабушку,
// и, чтобы не сесть, он на теплоходе уплыл в Мексику. Рубли в спешке менял у барыги по 300 за доллар
// (честный курс — 80). В Мексике всё в долларах, всё в мексиканском стиле: жильё, работы, еда, одежда,
// транспорт, животные, девушки, музыка и сюжет с амиго.
//
// Как устроены деньги: внутри игра по-прежнему считает в рублях (так работают сервер, банды, турнир, ракета),
// а в Мексике всё показывается и вводится в долларах по курсу 80 ₽ = $1. Цены и зарплаты Мексики заданы
// круглыми долларами. При переезде барыга меняет все рубли по 300 — остаётся ~27% стоимости.

CITIES.mex = { name: 'Мексика', emoji: '🌵', idx: 2 };
const USD_RATE = 80;      // внутренний курс: столько рублей в одном долларе
const MEX_MOVE_RATE = 300; // курс барыги при побеге
function isMex() { return typeof S !== 'undefined' && S && S.city === 'mex'; }
const usd = (n) => n * USD_RATE; // цена в долларах → внутренние рубли

// Красивые долларовые суммы: $0.35, $4.5, $25, $140, $1 250, $12 000
function niceUSD(v) {
  if (v <= 0) return 0;
  if (v < 1) return Math.max(0.05, Math.round(v * 20) / 20);
  if (v < 10) return Math.round(v * 2) / 2;
  if (v < 100) return Math.round(v);
  if (v < 1000) return Math.round(v / 5) * 5;
  if (v < 10000) return Math.round(v / 50) * 50;
  const p = Math.pow(10, Math.floor(Math.log10(v)) - 1);
  return Math.round(v / p) * p;
}
const niceRub = (rub) => Math.round(niceUSD(rub / USD_RATE) * USD_RATE);
function usdText(rub) {
  const v = rub / USD_RATE, a = Math.abs(v);
  const s = a >= 10000 ? fmt(v) : a >= 100 ? Math.round(v).toLocaleString('ru-RU') : (Math.round(v * 100) / 100).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
  return '$' + s;
}

// =====================================================================
// 1. Доллары на экране: любая сумма «… ₽» в Мексике показывается в долларах
// =====================================================================
const RUB_RE = /([+\-−]?)(\d{1,3}(?:[   ]\d{3})+|\d+(?:[.,]\d+)?)(?:\s?(K|M|B|млн|млрд|тыс\.?))?\s?₽/g;
const RUB_UNIT = { K: 1e3, 'тыс': 1e3, 'тыс.': 1e3, M: 1e6, 'млн': 1e6, B: 1e9, 'млрд': 1e9 };
function rubToUsdText(s) {
  if (!s || s.indexOf('₽') < 0) return s;
  return s.replace(RUB_RE, (m, sign, num, unit) => {
    const n = parseFloat(num.replace(/[   ]/g, '').replace(',', '.')) * (unit ? RUB_UNIT[unit] || 1 : 1);
    return (sign || '') + usdText(n);
  }).replace(/₽/g, '$');
}
let MEX_CONVERTING = false;
function mexConvertNode(root) {
  if (!isMex() || !root) return;
  MEX_CONVERTING = true;
  try {
    if (root.nodeType === 3) { if (root.nodeValue.indexOf('₽') >= 0) root.nodeValue = rubToUsdText(root.nodeValue); return; }
    if (root.nodeType !== 1) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) if (n.nodeValue.indexOf('₽') >= 0) n.nodeValue = rubToUsdText(n.nodeValue);
    // Кнопки цены: монетка + число без «₽»
    root.querySelectorAll('i.ic[data-ic="coin"]').forEach((ic) => {
      const t = ic.nextSibling;
      if (t && t.nodeType === 3 && /^\s*[\d\s .,]+(K|M|B|\s?млн|\s?млрд)?\s*$/.test(t.nodeValue)) t.nodeValue = rubToUsdText(t.nodeValue.trim() + ' ₽');
    });
    // Подсказки «почему нельзя» тоже в долларах
    root.querySelectorAll('[data-why*="₽"]').forEach((el) => { el.dataset.why = rubToUsdText(el.dataset.why); });
  } finally { MEX_CONVERTING = false; }
}
const MEX_OBS = new MutationObserver((list) => {
  if (MEX_CONVERTING || !isMex()) return;
  for (const m of list) {
    if (m.type === 'characterData') mexConvertNode(m.target);
    else m.addedNodes.forEach((n) => mexConvertNode(n));
  }
});
HOOKS.init.push(() => MEX_OBS.observe(document.body, { childList: true, subtree: true, characterData: true }));
// Счётчик денег в шапке
HOOKS.hud.push(() => {
  if (!isMex()) return;
  const el = $('money');
  if (el) { const v = S.money / USD_RATE; const t = '$' + (v < 10000 ? (v < 100 ? (Math.round(v * 10) / 10) : Math.round(v)) : fmtShort(v)); if (el.textContent !== t) el.textContent = t; }
});
// Своя ставка в казино вводится в долларах
if (ACTIONS.betCustomOk) {
  const _betOk = ACTIONS.betCustomOk;
  ACTIONS.betCustomOk = (...a) => {
    const inp = document.querySelector('#modalRoot input[type="number"]');
    if (isMex() && inp && inp.value) inp.value = Math.round(+String(inp.value).replace(',', '.') * USD_RATE);
    return _betOk(...a);
  };
}

// =====================================================================
// 2. Город: жильё, учёба, работы, досуг, питомцы, девушки (поверх city.js)
// =====================================================================
const MEX_HOUSING = [
  { name: 'Гамак под пальмой у порта', desc: 'Комары размером с чихуахуа' },
  { name: 'Шалаш из листьев агавы', price: usd(10), desc: 'Днём жарко, ночью скорпионы' },
  { name: 'Койка в «Casa de Amigos»', price: usd(50), desc: 'Гитара до утра — бесплатно' },
  { name: 'Комната в розовом доме', price: usd(300), rent: usd(12), util: usd(3), desc: 'Вентилятор и пиньята в подарок' },
  { name: 'Касита с патио', price: usd(1500), rent: usd(45), util: usd(12), desc: 'Лимонное дерево и гирлянды' },
  { name: 'Вилла на побережье Канкуна', price: usd(10000), rent: usd(250), util: usd(60), desc: 'Бассейн смотрит в океан' },
  { name: 'Гасиенда с видом на пирамиду', price: usd(100000), rent: usd(2400), util: usd(700), desc: 'Агавовые поля до горизонта' },
];
const MEX_EDU = [
  { name: 'Нет мексиканских бумаг' },
  { name: 'Курсы испанского «¡Hola, amigo!»', emoji: '🗣️', price: usd(10), desc: 'Научат говорить «пор фавор» и «грасиас»' },
  { name: 'Колледж туризма', emoji: '🏖️', price: usd(120), desc: 'Как улыбаться гринго 12 часов подряд' },
  { name: 'Школа текильеро', emoji: '🥃', price: usd(600), desc: 'Голубая агава, соль и лайм — по науке' },
  { name: 'Университет Гвадалахары', emoji: '🏛️', price: usd(3000), desc: 'Диплом, который уважают от Тихуаны до Канкуна' },
  { name: 'MBA в Мехико', emoji: '🧠', price: usd(15000), desc: '«Синергия», но на испанском' },
];
const MEX_JOBS = {
  flyers: { name: 'Зазывала в кантину', emoji: '📣' }, loader: { name: 'Сборщик агавы', emoji: '🌵' }, courier: { name: 'Курьер на осле', emoji: '🫏' },
  guard: { name: 'Спасатель на пляже', emoji: '🛟' }, taxi: { name: 'Таксист на «Вочо»', emoji: '🚕' }, seller: { name: 'Продавец сомбреро', emoji: '👒' },
  manager: { name: 'Менеджер отеля', emoji: '🏨' }, director: { name: 'Директор курорта', emoji: '🌴' }, dvornik: { name: 'Уборщик пляжа', emoji: '🧹' },
  postman: { name: 'Почтальон на велосипеде', emoji: '📬' }, cook: { name: 'Тако-мастер', emoji: '🌮' }, police: { name: 'Полиция Канкуна', emoji: '👮' },
  teacher: { name: 'Учитель русского для гринго', emoji: '🧑‍🏫' }, clerk: { name: 'Чиновник муниципалитета', emoji: '🏛️' }, deputy: { name: 'Депутат штата', emoji: '🎖️' },
};
const MEX_PAY = 3;
const MEX_LEISURE = {
  mihalych: { name: 'Текила с амиго', emoji: '🥃', desc: 'Пепе разливает и учит тостам «¡Salud!»' },
  football: { name: 'Футбол в спорт-баре', emoji: '⚽', desc: '«¡Gooool!» на 40 секунд' },
  cinema: { name: 'Кино под открытым небом', emoji: '🎬', desc: 'Сериал про любовь, 300-я серия' },
  banya: { name: 'Темаскаль — индейская баня', emoji: '🔥', desc: 'Пар, травы и шаман' },
  karaoke: { name: 'Петь с мариачи', emoji: '🎺', desc: 'Гитаррон, скрипки и твоё сердце' },
  spa: { name: 'Сеноты Юкатана', emoji: '💧', desc: 'Купание в пещере с бирюзовой водой' },
  fishing: { name: 'Рыбалка в Тихом океане', emoji: '🎣', desc: 'Марлин, тунец и солнечный удар' },
  thimbles: { name: 'Напёрстки на рынке', emoji: '🥥', desc: 'Под кокосовыми скорлупками' },
  darts: { name: 'Разбить пиньяту', emoji: '🪅', desc: 'Конфеты для всей улицы' },
  shashlik: { name: 'Барбакоа у друзей', emoji: '🍖', desc: 'Мясо в земле, гитара у костра' },
  sea: { name: 'Отпуск на Карибах', emoji: '🏝️', desc: 'Канкун — это работа, отдых — тут' },
};
const MEX_LEISURE_PRICE = 2.8;
const MEX_PET_ART = { pigeon: 'hummingbird', rat: 'axolotl', dog: 'chihuahua', hedgehog: 'iguana', parrot: 'macaw', cat: 'sphynx' };
const MEX_PETS = {
  pigeon: { name: 'Колибри Пико' }, rat: { name: 'Аксолотль Аксель' }, dog: { name: 'Чихуахуа Пепито' },
  hedgehog: { name: 'Игуана Игги' }, parrot: { name: 'Ара Фрида' }, cat: { name: 'Кот Ацтек', price: usd(400), quest: false, level: 1 },
};
const MEX_CHAPTERS = {
  1: 'Шалаш из агавы. Ночью воют койоты, но звёзды — как в кино.',
  2: '«Casa de Amigos»: гитара, тако и двенадцать новых друзей.',
  3: 'Своя комната в розовом доме. Сеньора Лупе приносит кукурузные лепёшки.',
  4: 'Касита с патио! Лимоны прямо с дерева.',
  5: 'Вилла в Канкуне. Океан шумит под окнами.',
  6: 'Гасиенда! Агава до горизонта, пирамида на закате. ¡Viva Valera! 🎉',
};
const MEX_GIRLS = [
  { id: 'x_lupita', name: 'Лупита из кантины', emoji: '💃', picky: 0.1, std: 0.2, req: { level: 3 }, desc: 'Танцует сальсу и носит цветы в волосах' },
  { id: 'x_marisol', name: 'Марисоль-сёрфингистка', emoji: '🏄‍♀️', picky: 0.2, std: 0.1, req: { level: 5, housing: 2 }, desc: 'Ловит волну с рассвета' },
  { id: 'x_catalina', name: 'Каталина, гид по пирамидам', emoji: '🧭', picky: 0.3, std: 0.05, req: { level: 8, edu: 1 }, desc: 'Знает всех богов майя по именам' },
  { id: 'x_gabriela', name: 'Габриэла, художница', emoji: '🎨', picky: 0.4, std: 0.03, req: { level: 12, edu: 3, housing: 3 }, desc: 'Рисует как Фрида, спорит как Диего' },
  { id: 'x_valentina', name: 'Валентина, звезда сериалов', emoji: '🎬', picky: 0.5, std: 0.05, req: { level: 18, edu: 4, body: 3, housing: 5 }, desc: '«Богатые тоже плачут», 900 серий' },
  { id: 'x_isabella', name: 'Изабелла, дочь дона Карлоса', emoji: '👑', picky: 0.65, std: 0.02, req: { level: 24, body: 3, housing: 6 }, desc: 'Папа — владелец половины Канкуна' },
];
const MEX_GIRL_DATA = {
  x_lupita: { ring: usd(150), allow: usd(20), tier: 1, taste: { likes: 'rose', meh: 'book' } },
  x_marisol: { ring: usd(350), allow: usd(45), tier: 1, taste: { likes: 'teddy', meh: 'champ' } },
  x_catalina: { ring: usd(700), allow: usd(120), tier: 2, taste: { likes: 'book', meh: 'candy' } },
  x_gabriela: { ring: usd(2000), allow: usd(400), tier: 2, taste: { likes: 'rose', meh: 'phone' } },
  x_valentina: { ring: usd(8000), allow: usd(1500), tier: 3, taste: { likes: 'phone', meh: 'book' } },
  x_isabella: { ring: usd(30000), allow: usd(6000), tier: 4, taste: { likes: 'car', meh: 'rose' } },
};
MEX_GIRLS.forEach((g) => {
  const d = MEX_GIRL_DATA[g.id];
  RING_OF[g.id] = d.ring; ALLOW_OF[g.id] = d.allow;
  if (typeof GIRL_TIER !== 'undefined') GIRL_TIER[g.id] = d.tier;
  if (typeof GIRL_TASTE !== 'undefined') GIRL_TASTE[g.id] = d.taste;
});
allGirls = (function (orig) { return () => [...orig(), ...MEX_GIRLS]; })(allGirls);

function applyMexCity() {
  HOUSING.forEach((h, i) => Object.assign(h, MEX_HOUSING[i]));
  EDU.forEach((e, i) => Object.assign(e, MEX_EDU[i]));
  JOBS.forEach((j) => { const z = ZAS_SKIN.jobs[j.id]; if (z && MEX_JOBS[j.id]) Object.assign(j, { ...MEX_JOBS[j.id], pay: niceRub(z.pay * MEX_PAY) }); });
  LEISURE.forEach((l) => { const z = ZAS_SKIN.leisure[l.id]; if (z && MEX_LEISURE[l.id]) Object.assign(l, { ...MEX_LEISURE[l.id], price: niceRub(z.price * MEX_LEISURE_PRICE) }); });
  PETS.forEach((p) => {
    const z = ZAS_SKIN.pets[p.id];
    if (!z) return;
    const { name, ...rest } = MEX_PETS[p.id] || {};
    Object.assign(p, z, rest);
    const base = name || z.baseName;
    p.baseName = base;
    Object.defineProperty(p, 'name', { configurable: true, get: () => (S.petNames && S.petNames[p.id]) || base });
  });
  Object.assign(CHAPTERS, MEX_CHAPTERS);
  const list = MEX_GIRLS.slice();
  if (S.girlfriend && !list.some((g) => g.id === S.girlfriend)) { const w = allGirls().find((g) => g.id === S.girlfriend); if (w) list.push(w); }
  GIRLS.length = 0; GIRLS.push(...list);
  RINGS.length = 0; ALLOWANCE.length = 0;
  GIRLS.forEach((g) => { RINGS.push(RING_OF[g.id] || usd(100)); ALLOWANCE.push(ALLOW_OF[g.id] || usd(15)); });
}

// =====================================================================
// 3. Перекраска таблиц: названия, картинки, цены в круглых долларах
// =====================================================================
const MEX_RESKIN = [];
function mexTable(list, key, map, mult = {}) {
  const items = () => (Array.isArray(list) ? list.map((x, i) => [key(x, i), x]) : Object.entries(list));
  const zas = {};
  items().forEach(([k, x]) => {
    const fields = new Set([...Object.keys(map[k] || {}), ...Object.keys(mult)]);
    zas[k] = {};
    fields.forEach((f) => { zas[k][f] = x[f]; });
  });
  MEX_RESKIN.push((on) => items().forEach(([k, x]) => {
    if (!zas[k]) return;
    Object.assign(x, zas[k]);
    if (!on) return;
    for (const [f, m] of Object.entries(mult)) if (typeof zas[k][f] === 'number' && zas[k][f] > 0) x[f] = niceRub(zas[k][f] * m);
    Object.assign(x, map[k] || {});
  }));
}
mexTable(FOOD, byId, {
  bread: { name: 'Кукурузная тортилья', emoji: '🫓', desc: 'Тёплая, с рынка' }, doshik: { name: 'Начос с сыром', emoji: '🧀', desc: 'Хрустят на всю кантину' },
  coffee: { name: 'Кофе де олья', emoji: '☕', desc: 'С корицей и тростниковым сахаром' }, cheburek: { name: 'Эмпанада', emoji: '🥟', desc: 'Пирожок, но мексиканский' },
  energetik: { name: 'Орчата', emoji: '🥛', desc: 'Рисовый напиток с корицей' }, shaurma: { name: 'Буррито «Гигант»', emoji: '🌯', desc: 'Весит как чихуахуа' },
  pelmeni: { name: 'Тамалес', emoji: '🫔', desc: 'В кукурузных листьях' }, stolovka: { name: 'Обед в фонде', emoji: '🍲', desc: 'Суп посоле и лимонад' },
  protein: { name: 'Элоте', emoji: '🌽', desc: 'Кукуруза с майонезом и чили' }, lunch: { name: 'Такос аль пастор', emoji: '🌮', desc: 'С ананасом с вертела' },
  sushi: { name: 'Севиче', emoji: '🦐', desc: 'Креветки в лайме' }, steak: { name: 'Карне асада', emoji: '🥩', desc: 'Стейк на углях' },
  chef: { name: 'Моле поблано', emoji: '🍛', desc: 'Соус из 30 специй и шоколада' }, caviar: { name: 'Лобстер в Канкуне', emoji: '🦞', desc: 'Закат включён в цену' },
}, { price: 2.8 });
mexTable(CLOTHES.hat, byId, { shapka: { name: 'Соломенная шляпа' }, ushanka: { name: 'Сомбреро' }, kepka: { name: 'Бандана' }, cilinder: { name: 'Шляпа мариачи' } }, { price: 3.2 });
mexTable(CLOTHES.body, byId, {
  rvan: { name: 'Пончо' }, telnyashka: { name: 'Гуаябера' }, base: { name: 'Рубашка в цветочек' }, pukhovik: { name: 'Серапе' }, malinovy: { name: 'Костюм мариачи' }, kostum: { name: 'Белый льняной костюм' },
}, { price: 3.2 });
mexTable(CLOTHES.shoes, byId, { none: { name: 'Босиком по песку' }, tapki: { name: 'Уарачи' }, base: { name: 'Эспадрильи' }, kedy: { name: 'Кроссовки «Ла Пума»' }, boots: { name: 'Ковбойские сапоги' } }, { price: 3.2 });
mexTable(BODIES, (x, k) => k, {
  rvan: { jacket: '#C0392B', shirt: '#F2C744' }, telnyashka: { jacket: '#F4F0E6', shirt: '#F4F0E6' }, base: { jacket: '#1ABC9C', shirt: '#E84393' },
  pukhovik: { jacket: '#8E44AD', shirt: '#F39C12' }, malinovy: { jacket: '#1C1C22', shirt: '#F4F0E6' }, kostum: { jacket: '#F5F1E6', shirt: '#F5F1E6' },
});
mexTable(TRANSPORT, byIdx, {
  1: { name: 'Осёл Педро', emoji: '🫏', desc: 'Упрямый, но надёжный' }, 2: { name: 'Велосипед с корзиной', desc: 'Для тако и посылок' }, 3: { name: 'Мопед «Чапо»', desc: 'Дымит, но едет' },
  4: { name: 'Мототакси', desc: 'Три колеса и музыка' }, 5: { name: 'Байк по пустыне', emoji: '🏍️', desc: 'Пыль и свобода' }, 6: { name: 'Жук «Вочо»', desc: 'Легенда мексиканских дорог' },
  7: { name: 'Пикап', desc: 'В кузове — вся семья' }, 8: { name: 'Лоурайдер', desc: 'Прыгает на светофорах' }, 9: { name: 'Джип для каньонов', desc: 'Пирамиды ближе, чем кажется' },
  10: { name: 'Кабриолет', desc: 'Вдоль океана с ветерком' }, 11: { name: 'Лимузин дона', desc: 'Сомбреро не мнётся' },
}, { price: 2.8, fuel: 2.2 });
TRANSPORT.forEach((t, i) => { if (t.garage) mexTable([t.garage], () => 'g', { g: { name: ['Навес у касы', 'Гараж из шифера', 'Двор с воротами', 'Гараж с охраной', 'Гараж у виллы', 'Конюшня гасиенды', 'Ангар у океана'][Math.min(6, i - 5)] || 'Навес' } }, { price: 2.8 }); });
mexTable(BUSINESSES, byId, {
  stall: { name: 'Тележка с тако', emoji: '🌮' }, shawarma: { name: 'Буррито-бар', emoji: '🌯' }, carwash: { name: 'Прокат сёрфов', emoji: '🏄' },
  cafe: { name: 'Кантина «Валерио»', emoji: '🍹' }, shops: { name: 'Сеть сувенирных лавок', emoji: '🪅' }, club: { name: 'Пляжный клуб «Текила-бум»', emoji: '🪩' },
}, { price: 3.3, income: 3.3 });
mexTable(MEDS, byId, {}, { price: 2.2 });
mexTable(CLINICS, byId, { polyclinic: { name: 'Народная клиника' }, private: { name: 'Клиника «Канкун-Мед»' } }, { price: 2.2 });
mexTable(GYMS, byId, { bar: { name: 'Турник на пляже', desc: 'Песок, солнце и пеликаны' }, basement: { name: 'Зал лучадоров', desc: 'Маски на стене, пот на полу' }, fitness: { name: 'Фитнес-клуб курорта', desc: 'Бассейн, тренер, кокос' } }, { price: 2.2 });
mexTable(DATES, byId, {
  walk: { name: 'Прогулка по набережной Малекон' }, cafe: { name: 'Кафе с чуррос' }, cinema: { name: 'Кино под звёздами' }, rest: { name: 'Ужин в патио' }, yacht: { name: 'Яхта по Карибскому морю' },
  skate: { name: 'Роликовая дискотека' }, amuse: { name: 'Ярмарка в Гвадалахаре' }, picnic: { name: 'Пикник у сенота' }, karaoke: { name: 'Серенада с мариачи' },
  museum: { name: 'Дом-музей Фриды' }, bowling: { name: 'Боулинг у пирамид' },
}, { price: 2.2 });
mexTable(GIFTS, byId, {}, { price: 2.2 });
mexTable(WEDDINGS, byId, { zags: { name: 'Роспись в мэрии' }, canteen: { name: 'Свадьба в кантине с мариачи' }, banquet: { name: 'Фиеста на гасиенде' } }, { price: 3.3 });
mexTable(TRICKS, byId, {}, { price: 2.2 });
mexTable(ITEMS, (x, k) => k, {}, { base: 1.8 });
mexTable(PETS, byId, { ...Object.fromEntries(Object.entries(MEX_PET_ART).map(([id, art]) => [id, { art }])), cat: { art: 'sphynx', price: usd(400) } }, { price: 3.2 });

// =====================================================================
// 4. Мини-игры Мексики: на тех же работах — свои игры
// =====================================================================
const MEX_JOB_GAMES = {
  flyers: { engine: gameHide, title: 'Зазывай гринго в кантину', hint: 'Туристы выглядывают из-за пальм. Успей позвать! Полицейского не зови', spots: ['🌴', '🏨', '🛍️', '⛱️', '🚌', '🏛️'], who: '🧑‍🦰', decoy: ['👮'], hitText: '¡Bienvenido! 🌮', target: 12 },
  loader: { engine: gameRecipe, title: 'Сбор агавы', hint: 'Собирай урожай строго по списку — что подсвечено, то и бери',
    recipes: [['Поле #1', ['🌵', '🌵', '🍍', '🌽']], ['Поле #2', ['🌵', '🥑', '🌶️']], ['Поле #3', ['🌵', '🌽', '🥑', '🍋', '🌶️']], ['Поле #4', ['🌵', '🍍', '🍋']]], target: 8 },
  courier: { engine: gameSteer, title: 'Доставка на осле', hint: 'Держи палец слева или справа — веди осла по тропе. Подбирай посылки 📦, не падай в каньон', good: ['📦', '🌮'], target: 60 },
  guard: { engine: gameConveyor, title: 'Пляжный патруль', hint: 'Убирай опасное: медуз 🪼, акул 🦈, мусор 🗑️, бутылки 🍾. Отдыхающих не трогай', bad: ['🪼', '🦈', '🗑️', '🍾'], good: ['🏊', '🏄', '⛱️', '🐢', '🐚', '🦀'], badRate: 0.4, target: 14 },
  taxi: { engine: gameLanes, title: 'Пробки Канкуна', hint: 'Меняй ряд тапами. Подбирай туристов 🙋, объезжай ослов и ямы', good: ['🙋', '🙋‍♀️', '🧳'], bad: ['🫏', '🕳️', '🚧', '🐓'], player: '🚕', target: 20 },
  seller: { engine: gameStack, title: 'Пирамида из сомбреро', hint: 'Ставь шляпы ровно друг на друга. Ровно — бонус, криво — стопка сужается', btn: '👒 Поставить', items: ['👒', '🎩', '🧢', '👒', '🪅', '🎸'], base: '🛒', fail: '¡Ay, caramba! Всё рухнуло!', target: 10 },
  manager: { engine: gameSpot, title: 'Найди ключ от номера', hint: 'Турист потерял 🔑. Найди его на стойке среди сувениров', find: '🔑', junk: ['🪅', '🌮', '🌵', '🎸', '🥥', '🍹', '🐚', '🕶️', '🧉', '🎺'], target: 10 },
  director: { engine: gameSort, title: 'Утро директора курорта', hint: 'Хорошие идеи — «Сí», бредовые — «No». Быстро!',
    bins: [{ e: '✅', name: 'Sí', items: ['🏖️', '🍹', '🎺', '🐢', '💰'] }, { e: '❌', name: 'No', items: ['🦈', '🔥', '💸', '🌪️', '🗑️'] }], limit: 2400, target: 20 },
  dvornik: { engine: gameHold, title: 'Чистка пляжа граблями', hint: 'Зажимай «Грести» и отпускай: держи в зелёной полосе. Перебор — песок в глаза', icon: '🏖️', iconBad: '💨', btn: '🧹 Грести (держи)', target: 40 },
  postman: { engine: gameConveyor, title: 'Хрупкие посылки', hint: 'Снимай с ленты хрупкое: 🥚 🍷 🏺 🪅. Обычные пусть едут', bad: ['🥚', '🍷', '🏺', '🪅'], good: ['📦', '✉️', '🧸', '👒', '📦'], badRate: 0.35, target: 14 },
  cook: { engine: gameChop, title: 'Начинка для тако', hint: 'Режь на лету мясо и овощи. Острый перец 🌶️ не трогай голыми руками!', good: ['🥩', '🍗', '🥑', '🍅', '🧅', '🌽'], bad: ['🌶️'], badRate: 0.15, badText: '¡Picante!', target: 16 },
  police: { engine: gameChase, title: 'Погоня за воришкой на рынке', hint: 'Тапай — перепрыгивай препятствия. Подбирай украденные кошельки 👛', player: '👮', good: ['👛', '👛'], bad: ['🛒', '🐓', '🫏'], target: 14 },
  teacher: { engine: gamePairs, title: 'Слова для гринго', hint: 'Открывай карточки по две и находи пары. Пара — 2 очка', items: ['🍎', '🐱', '🏠', '☀️', '🌮', '🎸', '🌵', '🚌'], target: 14 },
  clerk: { engine: gameSort, title: 'Бумаги муниципалитета', hint: 'Заявления — «Одобрить», жалобы на петуха соседа — «В архив»',
    bins: [{ e: '✅', name: 'Одобрить', items: ['📝', '🏗️', '🌳', '🚌', '🏥'] }, { e: '🗄️', name: 'В архив', items: ['🐓', '🎺', '🌶️', '🫏', '🗑️'] }], limit: 2300, target: 20 },
  deputy: { engine: gameSimon, title: 'Голосование в конгрессе штата', hint: 'Повтори, какие кнопки нажимает лидер. Длиннее цепочка — больше очков', items: ['🟢', '🔴', '⚪', '🟡'], target: 14 },
};
MEX_RESKIN.push((on) => {
  if (!on) return; // в других городах игры восстанавливает msk.js
  for (const id of Object.keys(ZAS_JOB_GAMES)) {
    if (!MEX_JOB_GAMES[id]) continue;
    const g = JOB_GAMES[id];
    Object.keys(g).forEach((k) => delete g[k]);
    Object.assign(g, ZAS_JOB_GAMES[id], { ...MEX_JOB_GAMES[id], type: ZAS_JOB_GAMES[id].type });
  }
});
// Учёба в Мексике — испанский
const MEX_ES = [['Hola', 'Привет'], ['Gracias', 'Спасибо'], ['Amigo', 'Друг'], ['Agua', 'Вода'], ['Dinero', 'Деньги'], ['Casa', 'Дом'], ['Playa', 'Пляж'], ['Perro', 'Собака'],
  ['Gato', 'Кот'], ['Trabajo', 'Работа'], ['Comida', 'Еда'], ['Cerveza', 'Пиво'], ['Sol', 'Солнце'], ['Mañana', 'Завтра'], ['Fiesta', 'Праздник'], ['Amor', 'Любовь']];
const MEX_TF = [['«Mañana» значит «завтра»', 1], ['Сомбреро — это закуска', 0], ['Текилу делают из голубой агавы', 1], ['«Gracias» значит «пожалуйста»', 0],
  ['Аксолотль умеет отращивать лапы', 1], ['Столица Мексики — Канкун', 0], ['Пиньяту разбивают палкой', 1], ['Тако едят палочками', 0], ['«¡Ándale!» — это «давай быстрее»', 1], ['Мариачи играют на балалайке', 0]];
startLessonGame = (function (orig) {
  return function (stage) {
    if (city() !== 'mex' || stage === 5) { orig(stage); return; }
    const need = Math.max(2, Math.round([0, 6, 10, 8, 9][stage] * (hasEffect('t_focus') ? 0.75 : 1)));
    const games = {
      1: { name: 'Найди сомбреро', hint: `Найди 👒 среди сувениров ${need} раз — тренируем глаз туриста`, setup: (mg) => gameSpot(mg, { find: '👒', junk: ['🌮', '🌵', '🪅', '🎸', '🥥', '🌽', '🎺', '🧉'] }) },
      2: { name: 'Испанский: слова', hint: `Выбери перевод слова. Набери ${need}`, setup: (mg) => lessonChoice(mg, () => { const [es, ru] = pick(MEX_ES); const opts = shuffle([ru, ...shuffle(MEX_ES.filter((x) => x[1] !== ru)).slice(0, 2).map((x) => x[1])]); return { q: `«${es}» — это…`, a: ru, opts, penalty: true }; }) },
      3: { name: 'Испанский: пары', hint: `Запоминай карточки — находи пары. Набери ${need} очков`, setup: (mg) => gamePairs(mg, { items: ['🌮', '🌵', '🪅', '🎸', '☀️', '🏖️', '🥑', '🌶️'] }) },
      4: { name: 'Правда или «mentira»', hint: `Отличай правду от выдумки про Мексику. Набери ${need}`, setup: (mg) => lessonChoice(mg, () => { const [t, v] = pick(MEX_TF); return { q: t, a: v ? 'Verdad' : 'Mentira', opts: ['Verdad', 'Mentira'], penalty: true }; }) },
    };
    const g = games[stage];
    runGame({ title: `📖 ${g.name}`, scoreLabel: ` / ${need}`, hint: g.hint, duration: LESSON_TIME, setup: g.setup, finish: (score) => finishLesson(stage, score, need) });
  };
})(startLessonGame);

// Музыка и звуки Мексики
const MEX_MUSIC = [['mariachi', '🎺 Мариачи'], ['cumbia', '🪗 Кумбия'], ['lounge', '🎷 Джаз-бар'], ['off', '🔇 Тишина']];
const MEX_SFX = [['maracas', 'Маракасы'], ['classic', 'Классика'], ['soft', 'Мягкая']];
MEX_RESKIN.push((on) => {
  if (!on || !S.settings) return;
  MAIN_MUSIC.length = 0; MAIN_MUSIC.push(...MEX_MUSIC);
  SFX_THEMES.length = 0; SFX_THEMES.push(...MEX_SFX);
  if (!S.settings.cityAudio) S.settings.cityAudio = {};
  const saved = S.settings.cityAudio.mex;
  S.settings.mainMusic = saved && MEX_MUSIC.some((x) => x[0] === saved.music) ? saved.music : 'mariachi';
  S.settings.sfxTheme = saved && MEX_SFX.some((x) => x[0] === saved.sfx) ? saved.sfx : 'maracas';
  if (typeof syncMusic === 'function') try { syncMusic(); } catch (e) { /* звук не критичен */ }
});

// Применение: сначала убираем Мексику, потом город, потом (если надо) снова Мексику
let MEX_ON = false;
applyCity = (function (orig) {
  return function (c) {
    if (MEX_ON) { MEX_RESKIN.forEach((f) => f(false)); MEX_ON = false; }
    orig(c);
    const to = c || city();
    document.body.classList.toggle('city-mex', to === 'mex');
    if (to !== 'mex') return;
    MEX_RESKIN.forEach((f) => f(true));
    applyMexCity();
    MEX_ON = true;
    renderedHousing = -1; renderedLook = '';
    setTimeout(() => mexConvertNode(document.body), 0);
  };
})(applyCity);

// Иконки разделов — по-мексикански
const MEX_ICONS = { shop: '🌮', life: '🤠', fun: '🪅', tasks: '🗺️', game: '🌵' };
const MEX_HUB_ICONS = { home: '🛖', me: '🤠', money: '💵', fun: '🪅', people: '🤝', goals: '🗺️' };
HOOKS.hud.push(() => {
  const mex = isMex();
  document.querySelectorAll('#tabbar button[data-screen]').forEach((b) => {
    const sp = b.querySelector('span');
    if (!sp) return;
    if (!b.dataset.icon0) b.dataset.icon0 = sp.textContent;
    const want = mex ? MEX_ICONS[b.dataset.screen] || b.dataset.icon0 : b.dataset.icon0;
    if (sp.textContent !== want) sp.textContent = want;
  });
  document.querySelectorAll('#tabbar button[data-hub]').forEach((b) => {
    const sp = b.querySelector('span');
    if (!sp) return;
    if (!b.dataset.icon0) b.dataset.icon0 = sp.textContent;
    const want = mex ? MEX_HUB_ICONS[b.dataset.hub] || b.dataset.icon0 : b.dataset.icon0;
    if (sp.textContent !== want) sp.textContent = want;
  });
});

// =====================================================================
// 5. События в стиле амиго
// =====================================================================
const mexOnly = (list) => list.map((e) => ({ ...e, cond: cityCond('mex', e.cond) }));
MINI_BAD.push(...mexOnly([
  { e: '🌶️', t: 'Съел «не острый» соус. Он был острый', run: () => (hurt(4), addMood(-3), '−4 ❤️ −3 😊') },
  { e: '🦟', t: 'Комары устроили фиесту на тебе', run: () => (S.energy = Math.max(0, S.energy - 10), '−10 ⚡') },
  { e: '🫏', t: 'Осёл соседа съел твою шляпу', run: () => (addMood(-5), '−5 😊') },
  { e: '☀️', t: 'Солнечный удар: забыл сомбреро', run: () => (hurt(5), '−5 ❤️') },
  { e: '🛒', t: 'На рынке обсчитали гринго. То есть тебя', run: () => `−${fmt(takeMoney(0.05, usd(5)))} ₽`, cond: () => S.money >= usd(1) },
  { e: '🌪️', t: 'Тропический ливень за пять минут', run: () => (addMood(-4), '−4 😊') },
]));
MINI_GOOD.push(...mexOnly([
  { e: '🌮', t: 'Сеньора Лупе угостила тако: «¡Come, flaco!»', run: () => (feed(25), heal(2), '+25 🍞 +2 ❤️') },
  { e: '🎺', t: 'Мариачи сыграли для тебя бесплатно', run: () => (addMood(8), '+8 😊') },
  { e: '🥥', t: 'С пальмы упал кокос — прямо в руки', run: () => (feed(10), S.energy += 8, '+10 🍞 +8 ⚡') },
  { e: '📸', t: 'Туристы сфоткались с тобой в пончо и дали чаевые', run: () => { const m = niceRub(rand(60, 160) * scale()); addMoney(m); return `+${fmt(m)} ₽`; } },
  { e: '🐢', t: 'Видел, как черепашки ползут к океану', run: () => (addMood(7), '+7 😊') },
  { e: '🪅', t: 'Дети позвали разбить пиньяту — досталась конфета', run: () => (addMood(5), feed(5), '+5 😊 +5 🍞') },
]));
EVENTS.push(...mexOnly([
  { id: 'mex_pepe', title: '«¡Amigo, ayúdame!»', emoji: '🧔🏽', text: 'Пепе из «Casa de Amigos» просит помочь донести пиньяту на фиесту. Огромную. В форме осла.',
    options: [
      { label: '¡Claro que sí! Помочь', run: () => { S.energy = Math.max(0, S.energy - 15); addMood(10); S.karma = (S.karma || 0) + 1; return 'Фиеста удалась, тебя накормили до отвала. −15 ⚡ +10 😊'; } },
      { label: '«Mañana, amigo»', run: () => { addMood(-2); return 'Пепе понимающе кивнул: «Mañana — святое». −2 😊'; } },
    ] },
  { id: 'mex_mariachi', title: 'Мариачи под окном', emoji: '🎺', text: 'Мариачи предлагают спеть серенаду любой девушке района. За скромную плату.',
    options: [
      { label: 'Заказать серенаду', run: () => { const m = takeMoney(0.03, usd(20)); addMood(14); return `Весь квартал аплодировал. −${fmt(m)} ₽ +14 😊`; } },
      { label: 'Подпевать бесплатно', run: () => { addMood(5); addXp(10); return 'Тебя приняли в хор на один вечер. +5 😊 +10 XP'; } },
    ] },
  { id: 'mex_tio', title: 'Тио Чуй предлагает дело', emoji: '🥸', text: '«Компадре, есть ящик «сувениров». Отвезти до границы — и забыть, что видел».',
    options: [
      { label: 'Отказаться', run: () => { addXp(15); return 'Тио Чуй пожал плечами: «Как знаешь». +15 XP за ум'; } },
      { label: 'Согласиться', run: () => {
          if (Math.random() < 0.5) { const m = niceRub(rand(150, 400) * scale()); addMoney(m); return `«Gracias, compadre». +${fmt(m)} ₽`; }
          hurt(15); addMood(-10); return 'Ящик оказался с сюрпризом, едва унёс ноги. −15 ❤️ −10 😊'; } },
    ] },
]));

// =====================================================================
// 6. Сюжет: финал Москвабада — мошенники; 10 глав Мексики
// =====================================================================
QUESTS.push(
  { id: 'm_scam', city: 'msk', who: '📞', name: '«Служба безопасности банка»', title: 'Звонок, который всё изменил', move: true, mexMove: true, goals: [], reward: {},
    text: 'Тебе позвонили «из банка», запугали «кредитом на твоё имя» и втянули в «спецоперацию». Ты сам не заметил, как помог мошенникам обмануть бабушку. Полиция уже ищет «курьера». Остаётся одно — бежать. Далеко.' },
);
const MEX_Q = [
  { id: 'x_arrive', who: '🚢', name: 'Капитан Ромеро', title: '¡Hola, México!', text: 'Порт Веракрус. Жара, пальмы и ни слова по-русски. В кармане — горсть долларов. Найди угол и первую работу, amigo.',
    goals: [qv(() => S.ownedHousing || 0, 1, 'Построй шалаш из агавы'), qc('shift', 3, 'Отработай 3 смены')], reward: { money: usd(50), xp: 400 } },
  { id: 'x_amigo', who: '🧔🏽', name: 'Пепе', title: 'Casa de Amigos', text: '¡Órale! Русо? Заходи в нашу «Casa de Amigos» — тут гитара, тако и друзья. Обживайся, compadre.',
    goals: [qv(() => S.ownedHousing || 0, 2, 'Поселись в «Casa de Amigos»'), qc('eat', 5, 'Пообедай 5 раз'), qc('events', 4, 'Переживи 4 мексиканских события')], reward: { money: usd(90), caps: 1, xp: 500 } },
  { id: 'x_spanish', who: '👵🏽', name: 'Сеньора Лусия', title: 'Испанский для бомжа', text: 'Mijo, без испанского тебе здесь только сомбреро продавать. Учись — и мир откроется.',
    goals: [qv(() => S.edu, 1, 'Окончи курсы «¡Hola, amigo!»'), qv(() => Math.min(tierOf('body'), tierOf('shoes')), 2, 'Приоденься по-местному')], reward: { money: usd(150), caps: 1, xp: 600 } },
  { id: 'x_luchador', who: '🤼', name: 'Эль Торо', title: 'Лучадор', text: 'Гринго, ты в моём районе. Здесь уважают только тех, кто выходит на ринг в маске. ¡Vamos!',
    goals: [qc('fightWin', 4, 'Выиграй 4 драки'), qv(() => Math.floor(S.form), 30, 'Форма 30+')],
    boss: { name: 'Эль Торо', style: 'brawler', eq: { hat: 'bandana', body: 'malinovy', shoes: 'boots' }, lvl: 0, form: 50, strength: 55, tier: 3, intro: '«¡Prepárate, gringo!»' },
    reward: { money: usd(300), caps: 2, xp: 800 } },
  { id: 'x_h_resort', path: 'honest', who: '🏨', name: 'Дон Мигель', title: 'Работа мечты', text: 'Сеньор Валера, курорту нужен человек, который не сдаётся. Диплом, опыт — и место ваше.',
    goals: [qv(() => S.edu, 2, 'Окончи колледж туризма'), qc('shift', 15, 'Отработай 15 смен'), qc('promotion', 1, 'Получи повышение')], reward: { money: usd(600), caps: 2, xp: 1000 } },
  { id: 'x_d_tio', path: 'dark', who: '🥸', name: 'Тио Чуй', title: 'Тёмные делишки', text: 'Русо, ты мне нравишься. Покажи, что умеешь торговаться и держать удар — и Тио Чуй тебя не забудет.',
    goals: [qc('marketSold', 15, 'Продай 15 вещей на рынке'), qc('fightWin', 8, 'Выиграй 8 драк')], reward: { money: usd(600), caps: 2, xp: 1000 } },
  { id: 'x_fiesta', who: '💃', name: 'Лупита', title: 'Фиеста', text: 'Валера, в субботу фиеста! Танцы, пиньята, мариачи. Не приходи один — это грустно.',
    goals: [qc('date', 4, 'Сходи на 4 свидания'), qv(() => (S.girlfriend ? 1 : 0), 1, 'Будь в отношениях'), qc('leisureGame', 2, 'Сыграй 2 игры в «Отдыхе»')], reward: { money: usd(500), caps: 1, xp: 900, buff: ['inlove', 20] } },
  { id: 'x_business', who: '🤵🏽', name: 'Дон Карлос', title: 'Своё дело', text: 'В Мексике уважают тех, у кого своё дело. Тележка тако — тоже дело, сеньор. Начните — и покажите, что вы надолго.',
    goals: [qv(() => Object.keys(S.biz).length, 1, 'Открой бизнес'), qv(() => S.transport, 1, 'Купи транспорт'), qv(() => S.ownedHousing || 0, 4, 'Купи каситу с патио')], reward: { money: usd(2000), caps: 2, xp: 1500 } },
  { id: 'x_callcenter', who: '📞', name: 'Голос из трубки', title: 'Привет из колл-центра', text: 'Тот же голос: «Валерий, это служба безопасности…» Мошенники добрались и сюда. Пора разобраться с ними раз и навсегда — и вернуть бабушке её деньги.',
    goals: [qv(() => level(), 30, 'Достигни 30 уровня'), qv(() => S.ownedHousing || 0, 5, 'Купи виллу в Канкуне')],
    boss: { name: 'Главарь колл-центра', style: 'tactic', eq: { hat: 'cilinder', body: 'kostum', shoes: 'boots' }, lvl: 2, form: 75, strength: 72, tier: 6, intro: '«Вам звонят из службы безопасности…»' },
    reward: { money: usd(5000), caps: 4, xp: 3000 } },
  { id: 'x_final', who: '🌵', name: 'Вся Мексика', title: '¡Viva Valera!', text: 'Колл-центр закрыт, бабушка получила свои деньги и открытку из Канкуна. Осталось стать в Мексике своим по-настоящему.',
    goals: [qv(() => S.ownedHousing || 0, 6, 'Купи гасиенду'), qc('promotion', 3, 'Получи ещё 3 повышения'), qv(() => S.onlineWins || 0, 5, 'Победи 5 живых игроков онлайн')], reward: { money: usd(15000), caps: 8, xp: 7000 } },
];
MEX_Q.forEach((q) => { q.city = 'mex'; QUESTS.push(q); });

Object.assign(STORY_SCENES, {
  m_scam: { lines: [
    ['📞', '«Служба безопасности банка»', 'Валерий Михалычевич? Это служба безопасности. На ваше имя прямо сейчас оформляют кредит. Не кладите трубку!'],
    ['🧳', 'Валера', 'Какой ещё кредит?! Я… я ничего не брал!'],
    ['📞', '«Майор Петров»', 'Спокойно. Вы поможете поймать преступников. Заберите у пожилой женщины на соседней улице «улики» — пакет с деньгами — и передайте нашему человеку.'],
    ['👵', 'Бабушка Нина', 'Сынок, ты из банка? Мне сказали, внук в беде, надо помочь… Вот, всё, что откладывала.'],
    ['🚨', 'Новости', '«Полиция ищет курьера телефонных мошенников. Приметы: борода, кепка, задумчивый вид»…'],
    ['🕶️', 'Барыга у порта', 'Бежишь? Теплоход «Ла Палома» уходит в Мексику через час. Рубли поменяю. По триста. Нет — оставайся с полицией.'] ] },
  x_arrive: { lines: [
    ['🚢', 'Капитан Ромеро', '¡Bienvenido a México, amigo! Веракрус. Тут жарко, громко и все улыбаются. Привыкай.'],
    ['🧳', 'Валера', 'Мне бы угол и работу… Как по-испански «работа»?'],
    ['🚢', 'Капитан Ромеро', '«Trabajo». А «деньги» — «dinero». Запомни эти два слова — остальное приложится. ¡Suerte!'] ] },
  x_amigo: { lines: [
    ['🧔🏽', 'Пепе', '¡Órale! Русо! У нас никогда не было русо. Заходи, compadre, тут гитара, тако и бесплатный вай-фай… иногда.'],
    ['🧳', 'Валера', 'Gracias… кажется.'],
    ['🧔🏽', 'Пепе', '¡Perfecto! Видишь — уже говоришь как местный. Mi casa es tu casa!'] ],
    choices: [{ label: '🎸 Сыграть Пепе русскую песню', run: () => { addMood(10); return 'Пепе прослезился: «¡Qué bonito!» +10 😊'; } },
      { label: '🌮 Угостить всех тако', run: () => { const m = takeMoney(0.02, usd(5)); addMood(6); S.karma = (S.karma || 0) + 1; return `Ты теперь любимец «Casa de Amigos». −${fmt(m)} ₽ +6 😊`; } }] },
  x_spanish: { lines: [
    ['👵🏽', 'Сеньора Лусия', 'Mijo, ты говоришь по-испански как осёл Педро. Даже хуже — Педро хотя бы знает «sí».'],
    ['🧳', 'Валера', 'Sí… sí, сеньора.'],
    ['👵🏽', 'Сеньора Лусия', '¡Muy bien! Два слова — уже прогресс. Иди учись, а потом купи нормальную одежду — в пончо на собеседование не ходят.'] ] },
  x_luchador: { lines: [
    ['🤼', 'Эль Торо', '¡Gringo! Ты в районе Эль Торо. Тут уважают только тех, кто выходит на ринг. В маске!'],
    ['🧳', 'Валера', 'Я дрался в Засранске. И в Москвабаде. Маска не нужна.'],
    ['🤼', 'Эль Торо', 'Ja-ja! Смелый русо. Подкачайся, выиграй пару боёв — и я сам тебя вызову. ¡Hasta pronto!'] ] },
  x_h_resort: { lines: [
    ['🏨', 'Дон Мигель', 'Сеньор Валера, мне рассказали о вас. Русский, который не сдаётся. Мне нужны такие люди на курорте.'],
    ['🧳', 'Валера', 'Я начинал со сбора бутылок, дон Мигель.'],
    ['🏨', 'Дон Мигель', 'Я начинал с мытья тарелок. Видите — у нас много общего. Учитесь, работайте — и курорт ваш.'] ] },
  x_d_tio: { lines: [
    ['🥸', 'Тио Чуй', 'Русо, ты мне нравишься. Тут, в Мексике, всё решают связи и смелость.'],
    ['🧳', 'Валера', 'Я уже наделал глупостей с «делами». Из-за них я здесь.'],
    ['🥸', 'Тио Чуй', 'Тогда будь умнее, amigo. Торгуй честно, бей больно — и Тио Чуй тебя прикроет.'] ] },
  x_fiesta: { lines: [
    ['💃', 'Лупита', '¡Hola, guapo! В субботу фиеста. Мариачи, танцы, пиньята в форме осла!'],
    ['🧳', 'Валера', 'Я… не умею танцевать сальсу.'],
    ['💃', 'Лупита', 'Никто не умеет, пока не начнёт. Приходи. И не один — одному на фиесте грустно.'] ] },
  x_business: { lines: [
    ['🤵🏽', 'Дон Карлос', 'Сеньор, говорят, у вас талант начинать с нуля. В Мексике это ценят больше денег.'],
    ['🧳', 'Валера', 'С нуля я начинал уже трижды, дон Карлос.'],
    ['🤵🏽', 'Дон Карлос', 'Значит, в четвёртый раз будет проще. Тележка тако — тоже дело. ¡Adelante!'] ] },
  x_callcenter: { lines: [
    ['📞', 'Голос из трубки', 'Валерий? Это служба безопасности банка… Как вам Мексика? Мы знаем, где вы. Нужно ещё одно «поручение»…'],
    ['🧳', 'Валера', 'Это вы. Из-за вас я обманул бабушку и бежал за океан.'],
    ['🤵🏽', 'Дон Карлос', 'Сеньор, мой кузен в полиции говорит: их колл-центр — в Канкуне. Станьте сильнее — и мы поможем вам с ними разобраться.'] ] },
  x_final: { lines: [
    ['👵', 'Бабушка Нина', '«Сынок, деньги вернулись! А ещё пришла открытка с пальмами. Спасибо, что не забыл»'],
    ['🧳', 'Валера', 'Прости меня, бабушка Нина. Больше никогда.'],
    ['🧔🏽', 'Пепе', '¡Compadre! Теперь ты наш. Осталось купить гасиенду — и Мексика официально твоя. ¡Viva Valera!'] ] },
});

// Карточка главы-переезда в Мексику (поверх московской «Бежать в Москвабад» из city.js)
const _storyTabMex = EXTRA_TABS.tasks.story;
EXTRA_TABS.tasks.story = () => {
  let html = _storyTabMex();
  const q = currentQuest();
  if (q && q.mexMove) {
    html = html.replace(/<button class="btn primary wide" data-act="moveStart">[^<]*<\/button>/, '<button class="btn primary wide" data-act="mexStart">🚢 Бежать в Мексику</button>')
      .replace(/<div class="q-reward">[\s\S]*?<\/div>/, '<div class="q-reward">🌵 Новый город: всё в долларах, новые работы, жильё, амиго и сюжет</div>');
  }
  if (city() === 'mex') {
    html = html.replace('<div class="info-card">', `<div class="info-card">📍 <b>${cityName()}</b> · `);
    html = html.replace('История Валеры окончена', '¡Viva Valera! Мексика покорена').replace('Эдик повержен, Барсик дома.', 'Колл-центр закрыт, бабушка с деньгами, гасиенда твоя.');
  }
  return html;
};

// =====================================================================
// 7. Переезд в Мексику
// =====================================================================
let MEX_PICK = { partner: null, club: null };
function mexMoneyAfter(rub) { return Math.floor(Math.max(0, rub) / MEX_MOVE_RATE) * USD_RATE; } // внутренние рубли после обмена
function mexStartModal() {
  const q = currentQuest();
  if (city() !== 'msk' || !q || !q.mexMove) return;
  const p = partnerOf(), married = !!(p && S.married);
  const kids = married ? (S.kids || []).length : 0;
  const club = clubSellPrice();
  const total = Math.max(0, S.money) + (MEX_PICK.club === 'sell' ? club : 0);
  const usdGot = Math.floor(total / MEX_MOVE_RATE), usdFair = Math.floor(total / USD_RATE);
  const keepWear = ['hat', 'body', 'shoes'].reduce((a, s) => a + (S.owned[s] || []).filter((id) => moveKeepsItem(s, id)).length, 0);
  const premium = (S.pets || []).filter((id) => (PETS.find((x) => x.id === id) || {}).premium).length;
  const opt = (key, val, label, cls = '') => `<button class="btn move-opt ${cls} ${MEX_PICK[key] === val ? 'on' : ''}" data-act="mexPick" data-id="${key}:${val}">${label}</button>`;
  const ready = (!p || MEX_PICK.partner) && (!club || MEX_PICK.club);
  openModal(`<div class="big-art"><div class="rays bad"></div><div class="big-emoji">🚢</div></div>
    <h3>Теплоход «Ла Палома» уходит через час</h3>
    <p>Мошенники втянули тебя в обман бабушки, полиция ищет «курьера». Остаётся бежать — за океан, в Мексику.</p>
    <div class="move-box lose"><b>💱 Барыга у порта меняет рубли</b>По <b>300 ₽ за $1</b> (честный курс — 80). Из ${fmt(total)} ₽ получится <b>$${usdGot.toLocaleString('ru-RU')}</b> — а могло бы быть $${usdFair.toLocaleString('ru-RU')}. Грустно, но не оставлять же всё на родине. В Мексике рублей нет: всё в долларах.</div>
    <div class="move-box lose"><b>Останется в Москвабаде</b>Жильё, бизнесы, транспорт, обычная одежда, хлам, питомцы (Гульнара присмотрит), работа и дипломы</div>
    <div class="move-box keep"><b>Поплывёт с тобой</b>Доллары, все крышки, уровень, форма и сила, престиж, достижения${keepWear ? `, ${keepWear} уник. вещ.` : ''}${premium ? `, премиум-питомцы (${premium})` : ''}. Друзья и банда — с тобой</div>
    ${p ? `<div class="move-box fam"><b>${married ? '👰' : '💑'} ${p.name}${kids ? ` и дети (${kids})` : ''}</b>${married ? `Взять семью с собой или развестись${kids ? `. При разводе ${ALIMONY_DAYS} игровых дней ${Math.round(ALIMONY_SHARE * 100)}% дохода — алименты` : ''}.` : 'Позвать её в Мексику или расстаться.'}
      <div class="move-opts">${opt('partner', 'take', married ? '👨‍👩‍👧 Плывём вместе' : '💑 Плывём вместе')}${opt('partner', 'leave', married ? `💔 Развод${kids ? ' и алименты' : ''}` : '💔 Расстаться', 'dark-path')}</div></div>` : ''}
    ${club ? `<div class="move-box fam"><b>🪩 Руфтоп-клуб</b>Можно успеть продать перекупщику за 20% цены — <b>${fmt(club)} ₽</b> (тоже поменяешь у барыги).
      <div class="move-opts">${opt('club', 'sell', `💰 Продать за ${fmt(club)} ₽`)}${opt('club', 'leave', '🏚️ Бросить', 'dark-path')}</div></div>` : ''}
    <div class="btns"><button class="btn primary wide" data-act="mexGo" ${ready ? '' : 'disabled data-why="Сначала реши, что делать с семьёй и клубом"'}>🚢 Бежать в Мексику</button>
      <button class="btn wide" data-act="close">Подожду ещё</button></div>`, { center: true });
}
function mexCut(opts) {
  const w = opts.partner === 'take' ? partnerOf() : null;
  return [
    { bg: 'night', actors: [{ a: 'valera', x: 46, mood: 'ok', say: 'Алло?' }], props: [{ e: '📱', x: 66, y: 40, anim: 'float' }], text: 'Москвабад. Поздний вечер. Звонок с незнакомого номера.' },
    { bg: 'red', cam: 'shake', actors: [{ a: '📞', x: 70, anim: 'shake', say: 'Служба безопасности банка!' }, { a: 'valera', x: 30, mood: 'sad', anim: 'shake' }], text: '«На вас оформляют кредит! Помогите следствию — или сядете вы!»' },
    { bg: 3, actors: [{ a: '👵', x: 66, say: 'Вот, сынок, всё что было…' }, { a: 'valera', x: 32, mood: 'sad' }], props: [{ e: '💰', x: 50, y: 60 }], text: 'По указке «майора» Валера забрал у бабушки Нины её сбережения.' },
    { bg: 'red', cam: 'shake', actors: [{ a: '🚨', x: 50, anim: 'bounce' }], text: 'Обман вскрылся. Полиция ищет «курьера». Мошенники не отвечают.' },
    { bg: 'night', actors: [{ a: '🕶️', x: 66, say: 'Триста за доллар. Не нравится — оставайся' }, { a: 'valera', x: 30, mood: 'sad' }], props: [{ e: '💱', x: 48, y: 40, anim: 'float' }], text: 'Ночью барыга у порта меняет все рубли по грабительскому курсу.' },
    { bg: 'night', actors: [{ a: '🚢', x: 50, anim: 'drive' }, ...(w ? [{ a: 'girl', x: 76 }] : [])], fx: '🌊', text: w ? 'Теплоход «Ла Палома». Валера и его семья смотрят на огни берега.' : 'Теплоход «Ла Палома». Огни берега тают в темноте.' },
    { bg: 'gold', cam: 'zoom', actors: [{ a: 'valera', x: 46, mood: 'happy', anim: 'jump', say: '¡Hola, México!' }], props: [{ e: '🌵', x: 18, y: 60 }, { e: '🌮', x: 80, y: 30, anim: 'float' }, { e: '☀️', x: 70, y: 10 }], fx: '✨', text: 'Веракрус. Жара, пальмы и новая жизнь. Опять с нуля.' },
  ];
}
function doMoveMex(opts) {
  const p = partnerOf(), married = !!(p && S.married);
  const kids = married ? (S.kids || []).length : 0;
  const club = opts.club === 'sell' ? clubSellPrice() : 0;
  const rub = Math.max(0, S.money) + club;
  S.money = mexMoneyAfter(rub);
  const lines = [`💱 Барыга поменял ${rub.toLocaleString('ru-RU')} руб. по 300 за доллар: <b>$${(S.money / USD_RATE).toLocaleString('ru-RU')}</b>${club ? ' (с продажей клуба)' : ''}. По честному курсу было бы $${Math.floor(rub / USD_RATE).toLocaleString('ru-RU')}`];
  if (p && opts.partner === 'take') lines.push(`${married ? '👨‍👩‍👧' : '💑'} ${p.name}${kids ? ` и дети (${kids}) плывут` : ' плывёт'} с тобой`);
  else if (p && married) {
    S.married = false; S.girlfriend = null; S.love = 0; S.engaged = null; S.kids = []; S.pregnant = 0;
    addEffect('heartbreak', 30); track('divorce');
    if (kids) { S.alimony = { until: Date.now() + ALIMONY_DAYS * GAME_DAY, paid: 0 }; lines.push(`💔 Развод. Дети остались с мамой: ${ALIMONY_DAYS} игровых дней ${Math.round(ALIMONY_SHARE * 100)}% дохода — алименты`); }
    else lines.push('💔 Развод. Она осталась в Москвабаде');
  } else if (p) { lines.push('💔 Вы расстались — она осталась в Москвабаде'); S.girlfriend = null; S.love = 0; S.engaged = null; addEffect('heartbreak', 15); }
  const keepGirl = S.girlfriend ? { [S.girlfriend]: girlState(S.girlfriend) } : {};
  const owned = {}, eq = {}, base = { hat: 'none', body: 'rvan', shoes: 'none' };
  ['hat', 'body', 'shoes'].forEach((s) => { owned[s] = [...new Set([base[s], ...(S.owned[s] || []).filter((id) => moveKeepsItem(s, id))])]; eq[s] = owned[s].includes(S.eq[s]) ? S.eq[s] : base[s]; });
  const keptPets = (S.pets || []).filter((id) => (PETS.find((x) => x.id === id) || {}).premium);
  const st = typeof sideState === 'function' ? sideState() : null;
  if (st) SIDE.filter((q) => q.city === 'msk').forEach((q) => delete st.active[q.id]);
  Object.assign(S, {
    owned, eq, pets: keptPets, pet: keptPets.includes(S.pet) ? S.pet : keptPets[0] || null,
    city: 'mex', moves: (S.moves || 0) + 1, movedAt: Date.now(),
    housing: 0, ownedHousing: 0, housingMode: 'own', billDue: 0, debt: 0, missed: 0, breakdowns: [],
    biz: {}, transport: 0, fuel: 100, transportBroken: false, garages: [],
    jobs: {}, jobPos: {}, hired: {}, edu: 0, study: null, busy: null,
    shelter: [], petNames: {}, inv: {}, bottles: 0, wanted: 0, flea: S.flea || [],
    girls: keepGirl, gfDates: 0,
    quest: { idx: 0, path: S.quest.path, base: { ...(S.counters || {}) }, bossCd: 0, v2: true },
  });
  if (S.girlfriend) S.loveFor = S.girlfriend;
  applyCity('mex');
  track('cityMove'); track('mexMove');
  renderedHousing = -1; renderedLook = '';
  S.chapterIntro = 'mex';
  save();
  if (typeof topSubmit === 'function' && onlineOn()) topSubmit().catch(() => {});
  confetti(120); sfx('levelup');
  resultModal({ emoji: '🌵', title: '¡Bienvenido a México!', text: `${lines.join('<br>')}<br><br>Здесь всё в долларах: цены, зарплаты, задания. Работы новые, язык новый — учи испанский. Начни с главы «¡Hola, México!» в сюжете.`, btn: '¡Vámonos!' });
  refresh();
}
Object.assign(ACTIONS, {
  mexStart: () => mexStartModal(),
  mexPick: (arg) => { const [k, v] = arg.split(':'); MEX_PICK[k] = v; mexStartModal(); },
  mexGo: () => {
    const q = currentQuest();
    if (city() !== 'msk' || !q || !q.mexMove) return;
    const opts = { partner: partnerOf() ? MEX_PICK.partner || 'leave' : null, club: clubSellPrice() ? MEX_PICK.club || 'leave' : null };
    closeModal();
    MEX_PICK = { partner: null, club: null };
    CUTS.move_mex = mexCut(opts);
    playCutscene('move_mex', () => doMoveMex(opts));
  },
});
CUT_TITLES.move_mex = '🚢 Побег в Мексику';

// «Глава III» сразу после переезда
HOOKS.tick.push(() => {
  if (S.chapterIntro !== 'mex' || !popupTurn(2)) return;
  S.chapterIntro = null;
  openModal(`<div class="chapter-card mex"><div class="cc-sky">${sceneSVG(0)}</div><div class="cc-num">ГЛАВА III</div><div class="cc-title">Мексика</div>
    <p>¡Hola, amigo! Ты сбежал за океан с горстью долларов. Здесь всё по-другому: доллары вместо рублей, тако вместо шавермы, мариачи вместо метро. Друзья и банда — с тобой.</p>
    <div class="cc-list"><span>💵 Всё в долларах</span><span>🛖 Гамак → гасиенда</span><span>🌮 15 новых работ и мини-игр</span><span>🦎 Новые животные</span><span>🎺 Мариачи и кумбия</span><span>🗣️ Испанский</span></div>
    <button class="btn primary wide" data-act="close">¡Vamos!</button></div>`, { center: true });
  sfx('levelup');
});

// Побочные поручения амиго
SIDE.push(
  { id: 'x_pepe', group: 'pals', city: 'mex', who: '🧔🏽', from: 'Пепе', title: 'Фиеста в «Casa de Amigos»', text: '¡Compadre! Нужна помощь с фиестой: сходи в «Отдых» и принеси тако на всех.',
    goals: [sg('leisureGame', 2, 'Сыграй 2 игры в «Отдыхе»'), sg('eat', 3, 'Пообедай 3 раза')], reward: { money: usd(60), xp: 300, mood: 15 } },
  { id: 'x_lupe', group: 'pals', city: 'mex', who: '👵🏽', from: 'Сеньора Лусия', title: 'Урок для гринго', text: 'Mijo, приходи на занятия — и помоги мне на рынке, ноги уже не те.',
    goals: [sg('lesson', 2, 'Сходи на 2 занятия'), sg('marketSold', 3, 'Продай 3 вещи на рынке')], reward: { money: usd(90), xp: 350 } },
  { id: 'x_tio', group: 'pals', city: 'mex', crime: true, who: '🥸', from: 'Тио Чуй', title: 'Ящик «сувениров»', text: 'Русо, пара тихих дел — и я познакомлю тебя с нужными людьми.',
    req: () => level() >= 6, reqText: '6 уровень', goals: [sg('crimeOk', 2, 'Провернуть 2 удачных дела')], reward: { money: usd(200), xp: 500, caps: 1 } },
);

// Достижения Мексики
ACHS.push(
  { id: 'mex_move', name: '¡Hola, México!', emoji: '🚢', fn: () => (S.city === 'mex' ? 1 : 0), goals: [1], unit: 'побег в Мексику' },
  { id: 'mex_story', name: 'Свой амиго', emoji: '🌵', fn: () => (city() === 'mex' && S.quest ? S.quest.idx : 0), goals: [3, 6, 10], unit: 'глав в Мексике' },
  { id: 'mex_home', name: 'Гасиенда', emoji: '🛖', fn: () => (city() === 'mex' ? S.ownedHousing || 0 : 0), goals: [2, 4, 6], unit: 'ступеней жилья в Мексике' },
);
