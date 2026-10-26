// Города. Игрок начинает в Засранске. Когда пройдена вся история Засранска, налоговая объявляет Валеру
// в розыск — он бежит в Москвабад: с собой 10% рублей (крышки не считаются), жена и дети — если согласится
// их взять (отказ — развод и алименты 20% с любого дохода 7 игровых дней). Всё нажитое остаётся.
// В Москвабаде новое всё: работы, жильё, учёба, девушки, развлечения, питомцы, события и свой сюжет.
// Друзья и банда хранятся на сервере и при переезде не трогаются. В топе виден город игрока.

const CITIES = {
  zas: { name: 'Засранск', emoji: '🏚️', idx: 0 },
  msk: { name: 'Москвабад', emoji: '🏙️', idx: 1 },
};
const MOVE_MONEY_SHARE = 0.1;
const ALIMONY_SHARE = 0.2;
const ALIMONY_DAYS = 7;
function city() { return CITIES[S.city] ? S.city : 'zas'; }
function cityName(c = city()) { return CITIES[c].name; }

// ---------- Москвабад: те же механики, но новые названия, цены и люди ----------
const MSK_HOUSING = [
  { name: 'Лавка у вокзала Москвабада', desc: 'Даже голуби тут с регистрацией' },
  { name: 'Палатка в переходе', price: 600, desc: 'Сухо, но каждые 5 минут электричка' },
  { name: 'Койка в хостеле «Уют»', price: 3500, desc: '12 соседей и один душ на этаж' },
  { name: 'Капсула в коливинге', price: 20000, rent: 900, util: 250, desc: 'Как гроб, но с вай-фаем' },
  { name: 'Студия 12 м²', price: 100000, rent: 3500, util: 1000, desc: 'Кухня, спальня и ванная — в одном углу' },
  { name: 'Двушка в ЖК «Москвабад-Сити»', price: 650000, rent: 18000, util: 5000, desc: 'Вид на соседний ЖК' },
  { name: 'Пентхаус на Рублёвабадском', price: 6500000, rent: 180000, util: 55000, desc: 'Выше только налоговая' },
];
const MSK_EDU = [
  { name: 'Нет местного диплома' },
  { name: 'Курсы «Москвабадец за 7 дней»', emoji: '🗺️', price: 700, desc: 'Где метро и почему тут всё дорого' },
  { name: 'Колледж цифровых профессий', emoji: '💻', price: 9000, desc: 'Научат говорить «дедлайн» и «созвон»' },
  { name: 'Бизнес-школа «Успех»', emoji: '📈', price: 45000, desc: 'Сертификат в рамочке и нетворкинг' },
  { name: 'Столичный университет', emoji: '🏛️', price: 220000, desc: 'Диплом, который тут уважают' },
  { name: 'Executive MBA', emoji: '🧠', price: 1100000, desc: '«Синергия» на трёх языках' },
];
const MSK_JOBS = {
  flyers: { name: 'Промоутер у метро', emoji: '🐻' },
  loader: { name: 'Сборщик на складе маркетплейса', emoji: '📦' },
  courier: { name: 'Курьер на электросамокате', emoji: '🛴' },
  guard: { name: 'Досмотр в аэропорту', emoji: '🛂' },
  taxi: { name: 'Таксист «Комфорт+»', emoji: '🚖' },
  seller: { name: 'Продавец в «Москвабад-Молле»', emoji: '🛍️' },
  manager: { name: 'Менеджер салона электроники', emoji: '📱' },
  director: { name: 'Топ-менеджер в стеклянной башне', emoji: '🏙️' },
  dvornik: { name: 'Клинер в бизнес-центре', emoji: '🧽' },
  postman: { name: 'Сортировщик почтового хаба', emoji: '🏤' },
  cook: { name: 'Шаурмист на фудкорте', emoji: '🌯' },
  police: { name: 'Полиция Москвабада', emoji: '👮' },
  teacher: { name: 'Онлайн-репетитор', emoji: '🧑‍💻' },
  clerk: { name: 'Чиновник мэрии', emoji: '🏛️' },
  deputy: { name: 'Депутат Москвабадской думы', emoji: '🎖️' },
};
const MSK_PAY = 2.5;
const MSK_LEISURE = {
  mihalych: { name: 'Чай с соседями по хостелу', emoji: '🫖', desc: 'Гульнара заваривает чай и рассказывает, как тут выжить' },
  football: { name: 'Футбол в спорт-баре', emoji: '📺', desc: 'Большой экран и чужие крики' },
  cinema: { name: 'IMAX с попкорном', emoji: '🍿', desc: 'Кресла с подогревом, попкорн по цене обеда' },
  banya: { name: 'Сандуны-абадские', emoji: '🧖', desc: 'Пар, веники и столичные сплетни' },
  karaoke: { name: 'Караоке на крыше', emoji: '🎤', desc: 'Поёшь — а внизу весь Москвабад' },
  spa: { name: 'СПА «Барвиха-абад»', emoji: '🏝️', desc: 'Массаж, бассейн, ни одного голубя' },
  fishing: { name: 'Рыбалка на Москвабад-реке', emoji: '🎣', desc: 'Клюют даже самокаты' },
  thimbles: { name: 'Напёрстки у трёх вокзалов', emoji: '🥜', desc: 'Столичные напёрсточники ловчее засранских' },
  darts: { name: 'Дартс в крафтовом баре', emoji: '🎯', desc: 'Бородатый бармен ставит на тебя' },
  shashlik: { name: 'Шашлыки в Подмосквабадье', emoji: '🍢', desc: 'Электричка, дача друга, мангал' },
  sea: { name: 'Отпуск на Мальдивах', emoji: '🏝️', desc: 'Теперь можно. Почти' },
};
const MSK_LEISURE_PRICE = 2.5;
const MSK_PETS = {
  pigeon: { name: 'Голубь Гоша Второй' },
  rat: { name: 'Декоративная крыса Ариэль' },
  dog: { name: 'Шпиц Бублик' },
  hedgehog: { name: 'Африканский ёжик Соник' },
  parrot: { name: 'Какаду Жак' },
  cat: { name: 'Мейн-кун Персик', price: 25000, quest: false, level: 1 },
};
const MSK_CHAPTERS = {
  1: 'Палатка в переходе. Гульнара из хостеля принесла термос: «Держись, новенький».',
  2: 'Хостел «Уют»: двенадцать соседей, и все из разных городов. Как и ты.',
  3: 'Своя капсула. Маленькая, но своя. Москвабад начинает признавать.',
  4: 'Студия! Двенадцать метров столичной жизни.',
  5: 'Двушка в ЖК. Вид на соседний ЖК — но ведь это вид!',
  6: 'Пентхаус. Отсюда видно и Москвабад, и дорогу назад в Засранск. Возвращаться не хочется 🎉',
};
const MSK_GIRLS = [
  { id: 'm_alina', name: 'Бариста Алина', emoji: '👩‍🦰', picky: 0.1, std: 0.2, req: { level: 3 }, desc: 'Рисует сердечки на капучино' },
  { id: 'm_vika', name: 'Вика из коворкинга', emoji: '👩‍💻', picky: 0.2, std: 0.1, req: { level: 4, housing: 2 }, desc: 'Пишет код и стендапы' },
  { id: 'm_dasha', name: 'Фитнес-тренер Даша', emoji: '🏋️‍♀️', picky: 0.3, std: 0.05, req: { level: 6, body: 1, edu: 1 }, desc: 'Любит тех, кто не пропускает ноги' },
  { id: 'm_lera', name: 'Искусствовед Лера', emoji: '👩‍🎨', picky: 0.4, std: 0.03, req: { level: 9, edu: 3, housing: 3 }, desc: 'Говорит о Малевиче за завтраком' },
  { id: 'm_milana', name: 'Блогер Милана', emoji: '🤳', picky: 0.5, std: 0.05, req: { level: 14, edu: 4, body: 3, housing: 5 }, desc: '2 млн подписчиков и кольцевая лампа' },
  { id: 'm_snezhana', name: 'Снежана, дочь олигарха', emoji: '👸', picky: 0.65, std: 0.02, req: { level: 18, body: 3, housing: 6 }, desc: 'Папа против. Пока что' },
];
const MSK_GIRL_DATA = {
  m_alina: { ring: 8000, allow: 1000, tier: 1, taste: { likes: 'candy', meh: 'champ' } },
  m_vika: { ring: 20000, allow: 2500, tier: 1, taste: { likes: 'book', meh: 'teddy' } },
  m_dasha: { ring: 40000, allow: 7000, tier: 2, taste: { likes: 'rose', meh: 'candy' } },
  m_lera: { ring: 120000, allow: 25000, tier: 2, taste: { likes: 'book', meh: 'teddy' } },
  m_milana: { ring: 500000, allow: 100000, tier: 3, taste: { likes: 'phone', meh: 'book' } },
  m_snezhana: { ring: 2000000, allow: 400000, tier: 4, taste: { likes: 'car', meh: 'rose' } },
};

// ---------- Снимок Засранска и переключение ----------
const ZAS_GIRLS = GIRLS.slice();
const RING_OF = {}, ALLOW_OF = {};
ZAS_GIRLS.forEach((g, i) => { RING_OF[g.id] = RINGS[i]; ALLOW_OF[g.id] = ALLOWANCE[i]; });
MSK_GIRLS.forEach((g) => {
  const d = MSK_GIRL_DATA[g.id];
  RING_OF[g.id] = d.ring; ALLOW_OF[g.id] = d.allow;
  if (typeof GIRL_TIER !== 'undefined') GIRL_TIER[g.id] = d.tier;
  if (typeof GIRL_TASTE !== 'undefined') GIRL_TASTE[g.id] = d.taste;
});
function allGirls() { return [...ZAS_GIRLS, ...MSK_GIRLS]; }

// Для каждой таблицы помним засранские значения тех полей, что меняются в Москвабаде
function snap(item, fields) { const o = {}; fields.forEach((f) => { o[f] = item[f]; }); return o; }
const ZAS_SKIN = {
  housing: HOUSING.map((h, i) => snap(h, Object.keys(MSK_HOUSING[i] || {}))),
  edu: EDU.map((e, i) => snap(e, Object.keys(MSK_EDU[i] || {}))),
  jobs: Object.fromEntries(JOBS.map((j) => [j.id, snap(j, ['name', 'emoji', 'pay'])])),
  leisure: Object.fromEntries(LEISURE.map((l) => [l.id, snap(l, ['name', 'emoji', 'desc', 'price'])])),
  pets: Object.fromEntries(PETS.map((p) => [p.id, { ...snap(p, ['price', 'quest', 'level']), baseName: p.baseName || p.name }])),
  chapters: { ...CHAPTERS },
};
let CITY_APPLIED = null;

function applyCity(c = city()) {
  const msk = c === 'msk';
  HOUSING.forEach((h, i) => Object.assign(h, msk ? MSK_HOUSING[i] : ZAS_SKIN.housing[i]));
  EDU.forEach((e, i) => Object.assign(e, msk ? MSK_EDU[i] : ZAS_SKIN.edu[i]));
  JOBS.forEach((j) => {
    const z = ZAS_SKIN.jobs[j.id];
    if (!z) return;
    Object.assign(j, msk && MSK_JOBS[j.id] ? { ...MSK_JOBS[j.id], pay: Math.round(z.pay * MSK_PAY) } : z);
  });
  LEISURE.forEach((l) => {
    const z = ZAS_SKIN.leisure[l.id];
    if (!z) return;
    Object.assign(l, msk && MSK_LEISURE[l.id] ? { ...MSK_LEISURE[l.id], price: Math.round(z.price * MSK_LEISURE_PRICE) } : z);
  });
  // Имя питомца — геттер из pets4.js (своё имя от игрока или базовое), поэтому базовое имя подменяем через него
  PETS.forEach((p) => {
    const z = ZAS_SKIN.pets[p.id];
    if (!z) return;
    const { name, ...rest } = msk ? MSK_PETS[p.id] || {} : {};
    Object.assign(p, z, rest);
    const base = name || z.baseName;
    p.baseName = base;
    Object.defineProperty(p, 'name', { configurable: true, get: () => (S.petNames && S.petNames[p.id]) || base });
  });
  Object.assign(CHAPTERS, msk ? MSK_CHAPTERS : ZAS_SKIN.chapters);
  // Девушки: местные + жена, если она переехала вместе с Валерой
  const list = msk ? MSK_GIRLS.slice() : ZAS_GIRLS.slice();
  if (S.girlfriend && !list.some((g) => g.id === S.girlfriend)) { const w = allGirls().find((g) => g.id === S.girlfriend); if (w) list.push(w); }
  GIRLS.length = 0; GIRLS.push(...list);
  RINGS.length = 0; ALLOWANCE.length = 0;
  GIRLS.forEach((g) => { RINGS.push(RING_OF[g.id] || 10000); ALLOWANCE.push(ALLOW_OF[g.id] || 1000); });
  document.body.classList.toggle('city-msk', msk);
  CITY_APPLIED = c + ':' + (S.girlfriend || '');
  renderedHousing = -1;
}
HOOKS.load.push(() => applyCity());
HOOKS.tick.push(() => { if (CITY_APPLIED !== city() + ':' + (S.girlfriend || '')) applyCity(); });

// ---------- События: засранские люди остаются в Засранске ----------
const ZAS_ONLY = /Михалыч|Шныр|Палыч|Засранск|Эдик|Зинк/;
const cityCond = (want, orig) => () => city() === want && (!orig || orig());
[MINI_BAD, MINI_GOOD, EVENTS].forEach((arr) => arr.forEach((e) => {
  const txt = [e.t, e.title, e.text, ...(e.options || []).map((o) => o.label)].join(' ');
  if (ZAS_ONLY.test(txt)) e.cond = cityCond('zas', e.cond);
}));
const mskOnly = (list) => list.map((e) => ({ ...e, cond: cityCond('msk', e.cond) }));
MINI_BAD.push(...mskOnly([
  { e: '🛴', t: 'Самокатчик сбил на тротуаре', run: () => (hurt(5), '−5 ❤️') },
  { e: '🚇', t: 'Час пик в метро: прижали к дверям', run: () => (S.energy = Math.max(0, S.energy - 10), addMood(-4), '−10 ⚡ −4 😊') },
  { e: '🅿️', t: 'Штраф за то, что просто стоял у парковки', run: () => `−${fmt(takeMoney(0.06, 500))} ₽`, cond: () => S.money >= 50 },
  { e: '☕', t: 'Кофе за 600 ₽. Вкус как у засранского за 40', run: () => { const m = takeMoney(0.02, 600); addMood(-3); return `−${fmt(m)} ₽ −3 😊`; }, cond: () => S.money >= 600 },
  { e: '🌫️', t: 'Смог над Москвабадом — дышать нечем', run: () => (hurt(3), '−3 ❤️') },
  { e: '📵', t: 'Украли телефон в электричке', run: () => (addMood(-8), '−8 😊') },
  { e: '🏗️', t: 'Стройка под окнами с шести утра', run: () => (S.energy = Math.max(0, S.energy - 12), '−12 ⚡'), cond: () => S.housing >= 2 },
]));
MINI_GOOD.push(...mskOnly([
  { e: '🧕', t: 'Гульнара из хостеля угостила лагманом', run: () => (feed(25), heal(2), '+25 🍞 +2 ❤️') },
  { e: '🎫', t: 'Нашёл непробитый проездной', run: () => (addMood(5), S.energy += 10, '+5 😊 +10 ⚡') },
  { e: '📸', t: 'Блогер снял тебя для сторис и задонатил', run: () => { const m = Math.round(rand(20, 60) * scale()); addMoney(m); return `+${fmt(m)} ₽`; } },
  { e: '🥐', t: 'Пекарня раздала вчерашние круассаны', run: () => (feed(12), addMood(3), '+12 🍞 +3 😊') },
  { e: '🛴', t: 'Стас «Самокат» подбросил до метро', run: () => (S.energy += 12, '+12 ⚡') },
  { e: '🎶', t: 'Уличный оркестр на Арбат-абаде поднял настроение', run: () => (addMood(7), '+7 😊') },
]));
EVENTS.push(...mskOnly([
  { id: 'msk_rent', title: 'Риелтор «без комиссии»', emoji: '🕴️', text: 'Человек в узком пиджаке предлагает «студию в центре за копейки, только предоплата».',
    options: [
      { label: 'Перевести предоплату', run: () => { const m = takeMoney(0.15, 30000); addMood(-10); return `Риелтор исчез вместе с ${fmt(m)} ₽. Москвабад учит быстро. −10 😊`; } },
      { label: 'Послать подальше', run: () => { addXp(5); return 'Гульнара одобрительно кивнула: «Учишься!» +5 XP'; } },
    ] },
  { id: 'msk_gulnara', title: 'Гульнара просит помочь', emoji: '🧕', text: 'Соседка по хостелу переезжает и просит дотащить коробки до пятого этажа без лифта.',
    options: [
      { label: 'Помочь', run: () => { S.energy = Math.max(0, S.energy - 20); addMood(8); S.karma++; const m = Math.round(60 * scale()); addMoney(m); return `Коробки на месте. Гульнара сунула ${fmt(m)} ₽ и банку варенья. −20 ⚡ +8 😊`; } },
      { label: 'Сослаться на дедлайн', run: () => { addMood(-3); return 'Ты уже говоришь, как местный. −3 😊'; } },
    ] },
  { id: 'msk_stas', title: 'Стас «Самокат»', emoji: '😎', text: 'Курьер Стас перегородил дорогу: «Это мой район, новенький. Плати за проход или вали».',
    options: [
      { label: 'Драться', run: () => {
          const chance = clamp(0.35 + S.strength / 140 + S.form / 300, 0.15, 0.85);
          if (Math.random() < chance) { const m = Math.round(70 * scale()); addMoney(m); addMood(12); return `Стас уехал на самокате без самоката. +${fmt(m)} ₽ (шанс ${Math.round(chance * 100)}%)`; }
          hurt(18); addMood(-8); return `Стас оказался резким. −18 ❤️ (шанс ${Math.round(chance * 100)}%)`; } },
      { label: 'Заплатить', run: () => { const m = takeMoney(0.08, 3000); return `Стас взял ${fmt(m)} ₽: «Приятно иметь дело»`; } },
    ] },
  { id: 'msk_tax', title: 'Письмо из Засранска', emoji: '✉️', text: 'Михалыч прислал письмо: «Валера, налоговая всё ещё спрашивает про тебя. Барсик скучает. Держись там».',
    options: [
      { label: 'Ответить и выслать гостинец', run: () => { const m = takeMoney(0.03, 5000); addMood(12); return `Отправил Михалычу посылку (−${fmt(m)} ₽). На душе тепло. +12 😊`; } },
      { label: 'Перечитать ещё раз', run: () => { addMood(6); return 'Ностальгия. +6 😊'; } },
    ] },
]));

// ---------- Сюжет: у каждого города своя история ----------
QUESTS.forEach((q) => { if (!q.city) q.city = 'zas'; });
const legendQ = QUESTS.find((q) => q.id === 'legend');
// Раньше «Легенда района» требовала начать новый круг. Теперь она ведёт к переезду, а престиж — по желанию
if (legendQ) legendQ.goals[2] = qv(() => level(), 22, 'Достигни 22 уровня');
QUESTS.push(
  { id: 'tax', city: 'zas', who: '🧾', name: 'Налоговая Засранска', title: 'Повестка из налоговой', move: true, goals: [], reward: {},
    text: 'Налоговая насчитала тебе недоимку за всё, что ты нажил: особняк, бизнесы, машины. Валеру объявили в розыск. Пора бежать в Москвабад и начать всё с нуля.' },
  { id: 'm_arrive', city: 'msk', who: '🧳', name: 'Вокзал Москвабада', title: 'Новый город', text: 'Москвабад встретил дождём и ценами. Никого не знаешь, денег — горсть. Найди угол и первую работу.',
    goals: [qv(() => S.ownedHousing || 0, 1, 'Купи палатку в переходе'), qc('shift', 3, 'Отработай 3 смены')], reward: { money: 3000, xp: 300 } },
  { id: 'm_friend', city: 'msk', who: '🧕', name: 'Гульнара из хостеля', title: 'Первый знакомый', text: 'Новенький? Держись меня — расскажу, где тут дешёвая еда и как не попасть на «риелторов». Обживайся.',
    goals: [qv(() => S.ownedHousing || 0, 2, 'Поселись в хостеле «Уют»'), qc('eat', 5, 'Пообедай 5 раз'), qc('events', 5, 'Переживи 5 событий большого города')], reward: { money: 6000, caps: 2, xp: 400 } },
  { id: 'm_docs', city: 'msk', who: '🗂️', name: 'МФЦ Москвабада', title: 'Бумажки', text: 'Без местной корочки и приличного вида на нормальную работу не возьмут. Засранский диплом тут — просто бумажка.',
    goals: [qv(() => S.edu, 1, 'Окончи курсы «Москвабадец за 7 дней»'), qv(() => Math.min(tierOf('body'), tierOf('shoes')), 2, 'Приличная одежда и обувь')], reward: { money: 10000, caps: 2, xp: 500 } },
  { id: 'm_stas', city: 'msk', who: '😎', name: 'Стас «Самокат»', title: 'Хозяин района', text: 'Курьер Стас держит весь район и говорит, что у него «связи в налоговой». Покажи, что тебя не запугать.',
    goals: [qc('fightWin', 5, 'Выиграй 5 драк'), qv(() => Math.floor(S.form), 25, 'Форма 25+')],
    boss: { name: 'Стас «Самокат»', style: 'brawler', eq: { hat: 'kepka', body: 'pukhovik', shoes: 'kedy' }, lvl: 0, form: 45, strength: 50, tier: 3, intro: '«Новенький, это мой район!»' },
    reward: { money: 20000, caps: 3, xp: 700 } },
  { id: 'm_h_career', city: 'msk', path: 'honest', who: '🏢', name: 'HR стеклянной башни', title: 'Белый воротничок', text: 'Мы любим людей с историей, Валерий. Нужен местный диплом и опыт — и место в башне ваше.',
    goals: [qv(() => S.edu, 2, 'Окончи колледж цифровых профессий'), qc('shift', 15, 'Отработай 15 смен'), qc('promotion', 1, 'Получи повышение')], reward: { money: 40000, caps: 3, xp: 900 } },
  { id: 'm_d_market', city: 'msk', path: 'dark', who: '🕶️', name: 'Барыга Артур', title: 'Серый рынок', text: 'Засранский? Слышал о тебе. В Москвабаде всё то же самое, только нули другие. Покажи себя.',
    goals: [qc('marketSold', 20, 'Продай 20 вещей на рынке'), qc('fightWin', 10, 'Выиграй 10 драк')], reward: { money: 40000, caps: 3, xp: 900 } },
  { id: 'm_love', city: 'msk', who: '💞', name: 'Сердце Валеры', title: 'Москвабадская любовь', text: 'Город большой, а вечером поговорить не с кем. Своди на свидания жену — или найди ту, ради кого стоило переехать.',
    goals: [qc('date', 5, 'Сходи на 5 свиданий'), qv(() => (S.girlfriend ? 1 : 0), 1, 'Будь в отношениях')], reward: { money: 30000, caps: 2, xp: 700, buff: ['inlove', 20] } },
  { id: 'm_biz', city: 'msk', who: '🚀', name: 'Венчурный инвестор', title: 'Стартап', text: 'У вас есть путь «с лавки до пентхауса»? Это же готовый питч! Открывайте дело, покупайте колёса — инвесторы любят смелых.',
    goals: [qv(() => Object.keys(S.biz).length, 1, 'Открой бизнес'), qv(() => S.transport, 1, 'Купи транспорт'), qv(() => S.ownedHousing || 0, 4, 'Купи студию')], reward: { money: 120000, caps: 4, xp: 1200 } },
  { id: 'm_inspector', city: 'msk', who: '🕴️', name: 'Инспектор Жмыхов', title: 'Он нашёл тебя', text: 'Тот самый инспектор налоговой из Засранска приехал в Москвабад. Хочет «закрыть дело» — по-хорошему или по-плохому.',
    goals: [qv(() => level(), 26, 'Достигни 26 уровня'), qv(() => S.ownedHousing || 0, 5, 'Купи двушку в ЖК')],
    boss: { name: 'Инспектор Жмыхов', style: 'tactic', eq: { hat: 'cilinder', body: 'kostum', shoes: 'boots' }, lvl: 2, form: 75, strength: 70, tier: 6, intro: '«Валерий, у вас недоимка. Платите — или в суд»' },
    reward: { money: 400000, caps: 8, xp: 2500 } },
  { id: 'm_final', city: 'msk', who: '👑', name: 'Весь Москвабад', title: 'Свой в Москвабаде', text: 'Дело закрыто, Жмыхов уехал ни с чем. Осталось стать в этом городе своим по-настоящему.',
    goals: [qv(() => S.ownedHousing || 0, 6, 'Купи пентхаус'), qc('promotion', 3, 'Получи ещё 3 повышения'), qv(() => S.onlineWins || 0, 5, 'Победи 5 живых игроков онлайн')], reward: { money: 1000000, caps: 15, xp: 6000 } },
);
// Крышки за главы урезаны в quests.js — новые главы тоже
QUESTS.filter((q) => q.city === 'msk').forEach((q) => { if (q.reward && q.reward.caps) q.reward.caps = Math.max(1, Math.round(q.reward.caps * 0.5)); });

questList = function () { return QUESTS.filter((q) => (!q.path || q.path === S.quest.path) && q.city === city()); };

// Карточка главы-переезда
const _storyTabCity = EXTRA_TABS.tasks.story;
EXTRA_TABS.tasks.story = () => {
  let html = _storyTabCity();
  const q = currentQuest();
  if (q && q.move) {
    html = html.replace(/<button class="btn[^"]*" data-act="questDone"[^>]*>[^<]*<\/button>/, `<button class="btn primary wide" data-act="moveStart">🧳 Бежать в Москвабад</button>`)
      .replace(/<div class="q-reward">[\s\S]*?<\/div>/, '<div class="q-reward">🏙️ Новый город: новые работы, жильё, девушки, учёба и сюжет</div>');
  }
  if (city() === 'msk') {
    html = html.replace('<div class="info-card">', `<div class="info-card">📍 <b>${cityName()}</b> · `);
    html = html.replace('История Валеры окончена', 'Москвабад покорён').replace('Эдик повержен, Барсик дома.', 'Инспектор Жмыхов уехал ни с чем, пентхаус твой.');
  }
  return html;
};

// ---------- Переезд ----------
// Что поедет: только уникальные, сезонные и купленные за звёзды вещи (у них в игре флаг season) и премиум-питомцы
const CLUB_SELL_SHARE = 0.2;
function moveKeepsItem(slot, id) { const it = CLOTHES[slot].find((x) => x.id === id); return !!(it && it.season); }
function clubSellPrice() { const b = BUSINESSES.find((x) => x.id === 'club'); return b && S.biz && S.biz.club ? Math.round(b.price * CLUB_SELL_SHARE) : 0; }
function partnerOf() { return S.girlfriend ? GIRLS.find((g) => g.id === S.girlfriend) : null; }
let MOVE_PICK = { partner: null, club: null };

function moveStartModal() {
  const q = currentQuest();
  if (city() !== 'zas' || !q || !q.move) return;
  const take = Math.floor(S.money * MOVE_MONEY_SHARE);
  const p = partnerOf(), married = !!(p && S.married);
  const kids = married ? (S.kids || []).length : 0;
  const club = clubSellPrice();
  const keepWear = ['hat', 'body', 'shoes'].reduce((a, s) => a + (S.owned[s] || []).filter((id) => moveKeepsItem(s, id)).length, 0);
  const premium = (S.pets || []).filter((id) => (PETS.find((x) => x.id === id) || {}).premium).length;
  const opt = (key, val, label, cls = '') => `<button class="btn move-opt ${cls} ${MOVE_PICK[key] === val ? 'on' : ''}" data-act="movePick" data-id="${key}:${val}">${label}</button>`;
  const ready = (!p || MOVE_PICK.partner) && (!club || MOVE_PICK.club);
  openModal(`<div class="big-art"><div class="rays bad"></div><div class="big-emoji">🧾</div></div>
    <h3>Налоговая объявила розыск</h3>
    <p>Недоимка за особняк, бизнесы и машины. Арестуют всё — бежать надо этой ночью. В Москвабаде никто тебя не знает: начнёшь новую главу с нуля.</p>
    <div class="move-box lose"><b>Останется в Засранске</b>Жильё, бизнесы, транспорт и гаражи, обычная одежда (даже надетая), хлам, питомцы (Михалыч присмотрит), работа и должности, засранские дипломы, 90% рублей</div>
    <div class="move-box keep"><b>Поедет с тобой</b>${fmt(take)} ₽ (10%), все крышки, уровень и опыт, форма и сила, престиж и перки, достижения${keepWear ? `, ${keepWear} уник. вещ. (сезонные, за достижения и за звёзды)` : ''}${premium ? `, премиум-питомцы (${premium})` : ''}. Друзья и банда никуда не денутся</div>
    ${p ? `<div class="move-box fam"><b>${married ? '👰' : '💑'} ${p.name}${kids ? ` и дети (${kids})` : ''}</b>
      ${married ? `Взять семью с собой или развестись${kids ? `. При разводе ${ALIMONY_DAYS} игровых дней ${Math.round(ALIMONY_SHARE * 100)}% любого дохода уйдёт на алименты` : ''}.` : 'Позвать её с собой в новый город или расстаться.'}
      <div class="move-opts">${opt('partner', 'take', married ? '👨‍👩‍👧 Едем вместе' : '💑 Едем вместе')}${opt('partner', 'leave', married ? `💔 Развод${kids ? ' и алименты' : ''}` : '💔 Расстаться', 'dark-path')}</div></div>` : ''}
    ${club ? `<div class="move-box fam"><b>🪩 Ночной клуб «Золотая крышка»</b>Бизнесы с собой не увезёшь. Клуб можно успеть продать перекупщику за 20% цены — <b>${fmt(club)} ₽</b> поедут с тобой целиком.
      <div class="move-opts">${opt('club', 'sell', `💰 Продать за ${fmt(club)} ₽`)}${opt('club', 'leave', '🏚️ Бросить', 'dark-path')}</div></div>` : ''}
    <div class="btns"><button class="btn primary wide" data-act="moveGo" ${ready ? '' : 'disabled data-why="Сначала реши, что делать с семьёй и клубом"'}>🧳 Бежать в Москвабад</button>
      <button class="btn wide" data-act="close">Подожду ещё</button></div>`, { center: true });
}

function moveCut(opts) {
  const w = opts.partner === 'take' ? partnerOf() : null;
  const kids = w && S.married ? (S.kids || []).length : 0;
  return [
    { bg: 0, actors: [{ a: 'valera', x: 50, mood: 'sad', say: 'С этой лавки всё началось…' }], props: [{ e: '🍾', x: 72, y: 80 }], text: 'Засранск. Когда-то у Валеры были только лавка в парке и пустая бутылка.' },
    { bg: 2, actors: [{ a: 'valera', x: 36, mood: 'happy' }, { a: 'mihalych', x: 70, anim: 'bounce', say: 'Держись, Валера!' }], fx: '🔥', text: 'Коробка, шалаш, гараж… Михалыч всегда был рядом.' },
    { bg: 6, actors: [{ a: 'valera', x: 32, mood: 'happy', say: 'Я вернул всё!' }, { a: 'edik', x: 70, anim: 'fall' }], fx: '⭐', text: 'Эдик повержен, особняк, Барсик дома. Казалось бы — живи и радуйся.' },
    { bg: 'red', cam: 'shake', actors: [{ a: '🕴️', x: 66, anim: 'in-right', say: 'Налоговая! Откройте!' }, { a: 'valera', x: 28, mood: 'sad', anim: 'shake' }], props: [{ e: '📜', x: 48, y: 30, anim: 'float' }], text: 'Но налоговая насчитала недоимку за всё нажитое. Особняк, бизнесы, машины — под арест.' },
    { bg: 'night', actors: [{ a: 'valera', x: w ? 30 : 46, mood: 'ok', say: w ? 'Собирайтесь, едем' : 'Прощай, Засранск' }, ...(w ? [{ a: 'girl', x: 58 }] : []), ...(kids ? [{ a: '🧒', x: 80, anim: 'bounce' }] : [])],
      props: [{ e: '🧳', x: w ? 44 : 66, y: 78 }], text: w ? 'Ночью Валера собрал чемодан. Семья — единственное, что он забрал с собой.' : 'Ночью Валера собрал один чемодан. Всё остальное — осталось.' },
    { bg: 'night', actors: [{ a: 'mihalych', x: 30, mood: 'sad', say: 'За Барсиком пригляжу' }, { a: 'barsik', x: 60 }], text: 'Михалыч провожает до вокзала.' },
    { bg: 'night', actors: [{ a: '🚂', x: 50, anim: 'drive' }], fx: '💨', text: 'Плацкарт до Москвабада. 14 часов, верхняя боковая.' },
    { bg: 'gold', cam: 'zoom', actors: [{ a: 'valera', x: 46, mood: 'happy', anim: 'jump', say: 'Ну здравствуй, Москвабад!' }], props: [{ e: '🏙️', x: 80, y: 30, anim: 'float' }, { e: '🌬️', x: 20, y: 25, anim: 'float' }], fx: '✨', text: 'Новый город. Новая жизнь. Валера вдыхает свежий воздух.' },
  ];
}

function doMove(opts) {
  if (typeof opts !== 'object' || !opts) opts = { partner: opts === 'family' || opts === true ? 'take' : 'leave', club: 'leave' };
  const p = partnerOf(), married = !!(p && S.married);
  const kids = married ? (S.kids || []).length : 0;
  const was = S.money;
  const club = opts.club === 'sell' ? clubSellPrice() : 0;
  S.money = Math.floor(Math.max(0, S.money) * MOVE_MONEY_SHARE) + club;
  const lines = [`💸 С собой: <b>${fmt(S.money)} ₽</b> (10% от ${fmt(was)} ₽${club ? ` + ${fmt(club)} ₽ за клуб` : ''})`];
  if (p && opts.partner === 'take') lines.push(`${married ? '👨‍👩‍👧' : '💑'} ${p.name}${kids ? ` и дети (${kids}) едут` : ' едет'} с тобой`);
  else if (p && married) {
    S.married = false; S.girlfriend = null; S.love = 0; S.engaged = null;
    S.kids = []; S.pregnant = 0;
    addEffect('heartbreak', 30);
    track('divorce');
    if (kids) { S.alimony = { until: Date.now() + ALIMONY_DAYS * GAME_DAY, paid: 0 }; lines.push(`💔 Развод. Дети остались с мамой: ${ALIMONY_DAYS} игровых дней ${Math.round(ALIMONY_SHARE * 100)}% любого дохода — алименты`); }
    else lines.push('💔 Развод. Она осталась в Засранске');
  } else if (p) { lines.push('💔 Вы расстались — она осталась в Засранске'); S.girlfriend = null; S.love = 0; S.engaged = null; addEffect('heartbreak', 15); }
  const keepGirl = S.girlfriend ? { [S.girlfriend]: girlState(S.girlfriend) } : {};
  // Одежда: с собой только уникальные вещи. Обычная остаётся, даже надетая — в Москвабад приезжаешь в рванье
  const owned = {}, eq = {};
  const base = { hat: 'none', body: 'rvan', shoes: 'none' };
  ['hat', 'body', 'shoes'].forEach((s) => {
    owned[s] = [...new Set([base[s], ...(S.owned[s] || []).filter((id) => moveKeepsItem(s, id))])];
    eq[s] = owned[s].includes(S.eq[s]) ? S.eq[s] : base[s];
  });
  const keptPets = (S.pets || []).filter((id) => (PETS.find((x) => x.id === id) || {}).premium);
  lines.push(`👕 Одежда: ${owned.hat.length + owned.body.length + owned.shoes.length - 3 ? 'с собой только уникальные вещи' : 'вся осталась — придётся одеться заново'}`);
  Object.assign(S, {
    owned, eq, pets: keptPets, pet: keptPets.includes(S.pet) ? S.pet : keptPets[0] || null,
    city: 'msk', moves: (S.moves || 0) + 1, movedAt: Date.now(),
    housing: 0, ownedHousing: 0, housingMode: 'own', billDue: 0, debt: 0, missed: 0, breakdowns: [],
    biz: {}, transport: 0, fuel: 100, transportBroken: false, garages: [],
    jobs: {}, jobPos: {}, hired: {}, edu: 0, study: null, busy: null,
    shelter: [], petNames: {}, inv: {}, bottles: 0, wanted: 0,
    girls: keepGirl, gfDates: 0,
    quest: { idx: 0, path: S.quest.path, base: { ...(S.counters || {}) }, bossCd: 0, v2: true },
  });
  if (S.girlfriend) S.loveFor = S.girlfriend;
  applyCity('msk');
  track('cityMove');
  renderedHousing = -1; renderedLook = '';
  save();
  if (typeof topSubmit === 'function' && onlineOn()) topSubmit().catch(() => {});
  confetti(100);
  sfx('levelup');
  resultModal({ emoji: '🏙️', title: 'Добро пожаловать в Москвабад!', text: `${lines.join('<br>')}<br><br>Всё здесь новое: работы платят больше, но и жизнь дороже. Засранские дипломы не котируются — учись заново. Начни с главы «Новый город» в сюжете.`, btn: 'Начать новую жизнь' });
  refresh();
}

Object.assign(ACTIONS, {
  moveStart: () => moveStartModal(),
  movePick: (arg) => { const [k, v] = arg.split(':'); MOVE_PICK[k] = v; moveStartModal(); },
  moveGo: () => {
    const q = currentQuest();
    if (city() !== 'zas' || !q || !q.move) return;
    const opts = { partner: partnerOf() ? MOVE_PICK.partner || 'leave' : null, club: clubSellPrice() ? MOVE_PICK.club || 'leave' : null };
    closeModal();
    MOVE_PICK = { partner: null, club: null };
    CUTS.move_msk = moveCut(opts);
    playCutscene('move_msk', () => doMove(opts));
  },
});
CUT_TITLES.move_msk = '🚂 Переезд в Москвабад';

// ---------- Алименты: 20% любого дохода, пока не прошло 7 игровых дней ----------
function alimonyOn() { return S.alimony && S.alimony.until > Date.now(); }
let ALIMONY_TOAST = 0;
addMoney = (function (orig) {
  return function (m) {
    if (m > 0 && alimonyOn()) {
      const cut = Math.round(m * ALIMONY_SHARE);
      S.alimony.paid += cut;
      m -= cut;
      if (cut > 0 && Date.now() - ALIMONY_TOAST > 60000) { ALIMONY_TOAST = Date.now(); setTimeout(() => toast(`👶 Алименты: −${fmt(cut)} ₽ (20% дохода)`, 'bad'), 400); }
    }
    orig(m);
  };
})(addMoney);
HOOKS.tick.push(() => {
  if (S.alimony && !alimonyOn() && !S.alimony.done && !modalOpen()) {
    S.alimony.done = true;
    resultModal({ emoji: '👶', title: 'Алименты выплачены', text: `Семь игровых дней прошли. Всего ушло детям: <b>${fmt(S.alimony.paid)} ₽</b>. Теперь весь доход — твой.`, btn: 'Ок' });
  }
});

// Плашка про алименты во вкладке свиданий
const _datesTabCity = EXTRA_TABS.fun.dates;
EXTRA_TABS.fun.dates = () => (alimonyOn() ? `<div class="info-card warn">👶 Алименты: ${Math.round(ALIMONY_SHARE * 100)}% любого дохода ещё <span data-until="${S.alimony.until}"></span>. Уже выплачено ${fmt(S.alimony.paid)} ₽</div>` : '') + _datesTabCity();

// ---------- Сцена: в Москвабаде — силуэт небоскрёбов и название города ----------
const MSK_SKY = `<svg class="msk-sky" viewBox="0 0 360 120" preserveAspectRatio="xMidYMax slice"><g fill="rgba(20,28,48,.55)">
  <rect x="0" y="70" width="30" height="50"/><rect x="34" y="40" width="22" height="80"/><rect x="60" y="58" width="28" height="62"/><polygon points="96,120 96,20 106,6 116,20 116,120"/>
  <rect x="122" y="50" width="26" height="70"/><rect x="152" y="30" width="18" height="90"/><rect x="174" y="64" width="30" height="56"/><polygon points="210,120 210,36 226,14 242,36 242,120"/>
  <rect x="248" y="56" width="24" height="64"/><rect x="276" y="24" width="20" height="96"/><rect x="300" y="60" width="30" height="60"/><rect x="334" y="44" width="26" height="76"/></g>
  <g fill="rgba(255,214,120,.5)"><rect x="40" y="50" width="3" height="3"/><rect x="48" y="62" width="3" height="3"/><rect x="104" y="40" width="3" height="3"/><rect x="158" y="44" width="3" height="3"/><rect x="226" y="50" width="3" height="3"/><rect x="282" y="40" width="3" height="3"/><rect x="286" y="60" width="3" height="3"/></g></svg>`;
renderScene = (function (orig) {
  return function () {
    orig(); // в Москвабаде свои сцены жилья (msk.js) — силуэт города уже нарисован в них
    $('locName').textContent = `${CITIES[city()].emoji} ${cityName()} · ${HOUSING[S.housing].name}`;
  };
})(renderScene);

// Засранские мультики про жильё в Москвабаде не показываем
['house', 'rentHouse'].forEach((k) => {
  const orig = ACTIONS[k];
  ACTIONS[k] = (id) => {
    if (city() !== 'msk') { orig(id); return; }
    const prev = S.settings.cuts;
    S.settings.cuts = false;
    try { orig(id); } finally { S.settings.cuts = prev; }
  };
});

// ---------- Топ: в каком городе игрок ----------
myStats = (function (orig) {
  return function () { return { ...orig(), city: CITIES[city()].idx, city_name: cityName() }; };
})(myStats);

// Престиж: новый круг начинается в том же городе
const _prestigeGoCity = ACTIONS.prestigeGo;
ACTIONS.prestigeGo = () => {
  const keep = { city: S.city, moves: S.moves };
  const before = S.prestige || 0;
  _prestigeGoCity();
  // Подтверждение в Telegram асинхронное — город возвращаем, когда круг действительно начался
  const restore = () => { if ((S.prestige || 0) > before) { Object.assign(S, keep); applyCity(); save(); refresh(); return true; } return false; };
  if (!restore()) { let n = 0; const t = setInterval(() => { if (restore() || ++n > 120) clearInterval(t); }, 500); }
};
