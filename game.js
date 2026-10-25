// «Симулятор бомжа» — Mini App для Telegram.
// Весь прогресс хранится на клиенте (localStorage + Telegram CloudStorage).

const tg = window.Telegram ? window.Telegram.WebApp : null;
const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Точки расширения для модулей (systems.js, fights.js, casino.js, minigames.js, quests.js)
const HOOKS = { tick: [], hud: [], init: [], load: [], track: [], screen: [], mods: [] };
const EXTRA_TABS = { shop: {}, life: {}, fun: {}, tasks: {} };
function sfx(name) { if (typeof Sound !== 'undefined') Sound.play(name); }

// =====================================================================
// Конфиг игры
// =====================================================================

// regen — энергии в минуту, hpm — здоровье в минуту от условий жизни, rob — шанс, что обчистят во сне
// rent — аренда за игровой месяц, util — коммуналка за месяц для своего жилья (см. systems.js)
const HOUSING = [
  { name: 'Лавка в парке', price: 0, level: 1, energy: 100, regen: 3, hpm: -0.6, rob: 0.35, desc: 'Свежий воздух и голуби' },
  { name: 'Коробка', price: 150, level: 1, energy: 120, regen: 4, hpm: -0.4, rob: 0.25, desc: 'Сухо, если нет дождя' },
  { name: 'Шалаш', price: 900, level: 3, energy: 150, regen: 5, hpm: -0.25, rob: 0.15, desc: 'Свой костёр и своя земля' },
  { name: 'Гараж', price: 5000, level: 6, energy: 180, regen: 6, hpm: -0.1, rob: 0.05, rent: 250, util: 60, desc: 'Железная дверь и лампочка' },
  { name: 'Комната в общаге', price: 25000, level: 9, energy: 220, regen: 8, hpm: 0, rob: 0, rent: 900, util: 300, desc: 'Соседи шумят, зато кровать' },
  { name: 'Квартира', price: 150000, level: 13, energy: 270, regen: 10, hpm: 0.15, rob: 0, rent: 5000, util: 1500, desc: 'Почти как раньше' },
  { name: 'Особняк', price: 1500000, level: 18, energy: 330, regen: 13, hpm: 0.3, rob: 0, rent: 50000, util: 15000, desc: 'Месть подаётся с бассейном' },
];
const SLEEP_SPEED = 10; // во сне энергия идёт в 10 раз быстрее
const FOOD_PER_TAP = 0.15;

// tier: 0 — лохмотья, 1 — базовая, 2 — приличная, 3 — деловая (нужно для работы и свиданий)
// Бонусы: tap — к тапу, energy — к макс. энергии, crit — к шансу крита, mood — радость в минуту, pity — милостыня (доля)
const TIERS = ['лохмотья', 'базовая', 'приличная', 'деловая'];
const CLOTHES = {
  hat: [
    { id: 'none', name: 'Без шапки', price: 0, tier: 0 },
    { id: 'shapka', name: 'Вязаная шапка', price: 40, tier: 0, pity: 0.1 },
    { id: 'ushanka', name: 'Ушанка', price: 300, tier: 1, tap: 1, energy: 5 },
    { id: 'kepka', name: 'Кепка-восьмиклинка', price: 3000, tier: 2, tap: 2, crit: 0.01 },
    { id: 'cilinder', name: 'Цилиндр', price: 80000, tier: 3, tap: 4, crit: 0.02, mood: 0.2 },
  ],
  body: [
    { id: 'rvan', name: 'Рваный пиджак', price: 0, tier: 0 },
    { id: 'telnyashka', name: 'Тельняшка', price: 120, tier: 0, tap: 1, pity: 0.1 },
    { id: 'base', name: 'Рубашка и брюки с рынка', price: 200, tier: 1 },
    { id: 'pukhovik', name: 'Пуховик', price: 2500, tier: 1, tap: 2, energy: 15 },
    { id: 'malinovy', name: 'Малиновый пиджак', price: 30000, tier: 2, tap: 4, crit: 0.01 },
    { id: 'kostum', name: 'Деловой костюм', price: 150000, tier: 3, tap: 8, mood: 0.3 },
  ],
  shoes: [
    { id: 'none', name: 'Босиком', price: 0, tier: 0 },
    { id: 'tapki', name: 'Тапки', price: 60, tier: 0, energy: 10 },
    { id: 'base', name: 'Ботинки с рынка', price: 150, tier: 1, energy: 15 },
    { id: 'kedy', name: 'Кеды «Abibas»', price: 1500, tier: 1, tap: 1, energy: 30 },
    { id: 'boots', name: 'Кожаные туфли', price: 40000, tier: 3, tap: 3, energy: 60 },
  ],
};
const SLOT_NAMES = { hat: 'Голова', body: 'Тело', shoes: 'Ноги' };

// junk — фастфуд: 3 штуки за 10 минут = риск дебаффа. risk — шанс конкретной болячки. req — нужное жильё
const FOOD = [
  { id: 'bread', name: 'Чёрствый хлеб', emoji: '🍞', price: 5, food: 8, mood: -1, junk: true, desc: 'Можно забивать гвозди' },
  { id: 'doshik', name: 'Доширак', emoji: '🍜', price: 20, food: 14, health: -1, mood: 1, junk: true, desc: 'Студенческая классика' },
  { id: 'coffee', name: 'Кофе из автомата', emoji: '☕', price: 40, food: 2, energy: 15, mood: 2, desc: 'Бодрит, но не кормит' },
  { id: 'cheburek', name: 'Чебурек с вокзала', emoji: '🥟', price: 35, food: 20, health: -2, junk: true, risk: { poison: 0.25 }, desc: 'Из чего — лучше не спрашивать' },
  { id: 'energetik', name: 'Энергетик «Буйвол»', emoji: '🥤', price: 70, food: 2, energy: 35, health: -3, junk: true, risk: { heartburn: 0.25 }, desc: 'Сердце стучит в ушах' },
  { id: 'shaurma', name: 'Шаурма', emoji: '🌯', price: 80, food: 28, health: -1, mood: 4, energy: 5, junk: true, risk: { heartburn: 0.2 }, desc: 'Острая, с двойным соусом' },
  { id: 'pelmeni', name: 'Пельмени со сметаной', emoji: '🥣', price: 150, food: 35, mood: 3, energy: 10, desc: 'Почти домашние' },
  { id: 'stolovka', name: 'Обед в столовой', emoji: '🍲', price: 300, food: 50, health: 3, energy: 15, desc: 'Первое, второе и компот' },
  { id: 'protein', name: 'Протеиновый коктейль', emoji: '🥛', price: 400, food: 15, health: 2, buff: ['protein', 10], req: { housing: 2 }, desc: 'Для тех, кто качается' },
  { id: 'lunch', name: 'Бизнес-ланч', emoji: '🍱', price: 900, food: 60, health: 4, mood: 6, energy: 20, req: { housing: 3 }, desc: 'Как у нормальных людей' },
  { id: 'sushi', name: 'Сет роллов', emoji: '🍣', price: 2500, food: 55, mood: 15, energy: 20, req: { housing: 4 }, desc: 'Палочками, как в кино' },
  { id: 'steak', name: 'Стейк рибай', emoji: '🥩', price: 9000, food: 80, health: 8, mood: 20, energy: 40, req: { housing: 5 }, buff: ['barin', 5], desc: 'Медиум рэйр, с вином' },
  { id: 'chef', name: 'Ужин от шеф-повара', emoji: '👨‍🍳', price: 45000, food: 100, health: 15, mood: 35, energy: 80, req: { housing: 6 }, buff: ['barin', 15], desc: 'Шесть смен блюд' },
  { id: 'caviar', name: 'Чёрная икра и шампанское', emoji: '🥂', price: 200000, food: 60, health: 5, mood: 60, req: { housing: 6 }, buff: ['barin', 30], desc: 'Эдик обзавидуется' },
];
const JUNK_LIMIT = 3;
const JUNK_WINDOW = 10 * 60000;

// Эффекты. Множители: tap, pity, regen, work, rate, study, gain. Прибавки: hpm, mpm (в минуту), tapAdd, crit
const ADD_MODS = ['hpm', 'mpm', 'tapAdd', 'crit'];
const EFFECTS = {
  heartburn: { name: 'Изжога', emoji: '🔥', kind: 'bad', desc: 'Энергия восстанавливается вдвое медленнее', mods: { regen: 0.5 } },
  poison: { name: 'Отравление', emoji: '🤢', kind: 'bad', desc: 'Тапы −50%, здоровье −3/мин', mods: { tap: 0.5, hpm: -3 } },
  bloat: { name: 'Вздутие', emoji: '🎈', kind: 'bad', desc: 'Радость −2/мин, прохожие разбегаются (подают −30%)', mods: { mpm: -2, pity: 0.7 } },
  hangover: { name: 'Похмелье', emoji: '🥴', kind: 'bad', desc: 'Тапы −30%, радость −1/мин', mods: { tap: 0.7, mpm: -1 } },
  backpain: { name: 'Сорванная спина', emoji: '🦴', kind: 'bad', desc: 'Тапы −40%, работа −30%, в зал нельзя', mods: { tap: 0.6, work: 0.7 } },
  heartbreak: { name: 'Разбитое сердце', emoji: '💔', kind: 'bad', desc: 'Радость −3/мин. Пройдёт само… когда-нибудь', mods: { mpm: -3, work: 0.8 } },
  lice: { name: 'Вши', emoji: '🪳', kind: 'disease', desc: 'Радость −1/мин, подают −30%, девушки шарахаются', mods: { mpm: -1, pity: 0.7 } },
  chlamydia: { name: 'Хламидия', emoji: '🦠', kind: 'disease', needDiag: true, hidden: 'Что-то чешется…', desc: 'Здоровье −1.5/мин, радость −2/мин', mods: { hpm: -1.5, mpm: -2 } },
  ratbite: { name: 'Укус крысы', emoji: '🐀', kind: 'disease', needDiag: true, hidden: 'Нога опухла…', desc: 'Здоровье −1.5/мин, тапы −20%. Лечит только врач', mods: { hpm: -1.5, tap: 0.8 } },
  barin: { name: 'Сытый барин', emoji: '🍽️', kind: 'good', desc: 'Весь доход +25%', mods: { tap: 1.25, pity: 1.25, work: 1.25 } },
  fightspirit: { name: 'Боевой дух', emoji: '🔥', kind: 'good', desc: 'Тапы и работа +10% — за серию побед в драках', mods: { tap: 1.1, work: 1.1 } },
  pumped: { name: 'Пампинг', emoji: '💪', kind: 'good', desc: 'Тапы +15%', mods: { tap: 1.15 } },
  protein: { name: 'Протеин', emoji: '🥛', kind: 'good', desc: 'Прирост формы и силы в зале +50%', mods: { gain: 1.5 } },
  inlove: { name: 'Влюблён', emoji: '😍', kind: 'good', desc: 'Радость +2/мин, работа +10%', mods: { mpm: 2, work: 1.1 } },
  // Временные навыки (покупаются во вкладке «Навыки»)
  t_eye: { name: 'Зоркий глаз', emoji: '👀', kind: 'good', desc: '+1 бутылка за тап', mods: { tapAdd: 1 } },
  t_pity: { name: 'Жалобный взгляд', emoji: '🥺', kind: 'good', desc: 'Милостыня +50%', mods: { pity: 1.5 } },
  t_breath: { name: 'Второе дыхание', emoji: '🫁', kind: 'good', desc: 'Энергия восстанавливается на 50% быстрее', mods: { regen: 1.5 } },
  t_trader: { name: 'Торгаш', emoji: '🤝', kind: 'good', desc: 'Курс обменника +10%', mods: { rate: 1.1 } },
  t_luck: { name: 'Фарт', emoji: '🍀', kind: 'good', desc: '+5% шанс крит-тапа x5', mods: { crit: 0.05 } },
  t_focus: { name: 'Зубрила', emoji: '🧠', kind: 'good', desc: 'Занятия на 25% короче', mods: { study: 0.75 } },
};

// Временные навыки: дают небольшой бонус на несколько минут, потом перезарядка
const TRICKS = [
  { id: 't_eye', price: 40, minutes: 5, level: 1 },
  { id: 't_pity', price: 60, minutes: 10, level: 2 },
  { id: 't_breath', price: 80, minutes: 10, level: 3 },
  { id: 't_trader', price: 100, minutes: 10, level: 4 },
  { id: 't_focus', price: 200, minutes: 10, level: 5 },
  { id: 't_luck', price: 120, minutes: 5, level: 6 },
];
const TRICK_COOLDOWN = 3; // перезарядка = длительность × 3

const MEDS = [
  { id: 'rassol', name: 'Огуречный рассол', emoji: '🥒', price: 15, cures: ['hangover'], desc: 'Народное средство от похмелья' },
  { id: 'coal', name: 'Активированный уголь', emoji: '⚫', price: 25, cures: ['poison', 'bloat'], desc: 'От отравления и вздутия' },
  { id: 'rennie', name: 'Таблетки от изжоги', emoji: '💊', price: 40, cures: ['heartburn'], desc: 'Гасят пожар в желудке' },
  { id: 'shampoo', name: 'Шампунь от вшей', emoji: '🧴', price: 120, cures: ['lice'], desc: 'Пахнет керосином' },
  { id: 'ointment', name: 'Мазь «Звёздочка»', emoji: '⭐', price: 150, cures: ['backpain'], desc: 'От сорванной спины' },
  { id: 'antibiotics', name: 'Антибиотики', emoji: '💉', price: 600, cures: ['chlamydia'], desc: 'Помогут, только если врач поставил диагноз' },
  { id: 'vitamins', name: 'Витамины', emoji: '🍊', price: 300, health: 15, desc: '+15 здоровья' },
];

const CLINICS = [
  { id: 'polyclinic', name: 'Районная поликлиника', emoji: '🏥', price: 200, desc: 'Очередь на 3 часа. Поставят диагноз, вылечат укусы, +10 здоровья' },
  { id: 'private', name: 'Платная клиника', emoji: '🩺', price: 5000, desc: 'Вылечат всё сразу, здоровье на максимум' },
];

// Спортзал: место определяет цену, множитель прироста и потолок формы/силы
const GYMS = [
  { id: 'bar', name: 'Турник', emoji: '🤸', price: 0, gain: 1, cap: 30, desc: 'Во дворе, бесплатно' },
  { id: 'basement', name: 'Качалка', emoji: '🏋️', price: 150, gain: 1.5, cap: 60, req: { housing: 1, level: 3 }, desc: 'В подвале, ржавые блины' },
  { id: 'fitness', name: 'Фитнес', emoji: '🧘', price: 3000, gain: 2.5, cap: 100, req: { housing: 4, level: 9 }, desc: 'Тренер, смузи, зеркала' },
];
const EXERCISES = [
  { id: 'cardio', name: 'Кардио', emoji: '🏃', energy: 20, food: 10, fatigue: 20, form: 2, strength: 0, health: 4, mood: 2, desc: 'Форма и здоровье' },
  { id: 'power', name: 'Силовая', emoji: '💪', energy: 30, food: 15, fatigue: 30, form: 0.5, strength: 2, health: 1, mood: 3, desc: 'Сила для драк и тяжёлой работы' },
  { id: 'stretch', name: 'Растяжка', emoji: '🙆', energy: 10, food: 4, fatigue: -25, form: 0.5, strength: 0, health: 2, mood: 5, desc: 'Снимает усталость мышц' },
];
const STAT_DECAY = 0.05; // форма и сила падают на столько в минуту, если не тренироваться 10 минут

// Учёба: поступить → пройти занятия → сдать экзамен-викторину
const EDU = [
  { name: 'Без образования' },
  { name: 'Вечерняя школа', emoji: '🏫', price: 150, level: 2, lessons: 3, lessonTime: 30, desc: 'Вспомнить таблицу умножения' },
  { name: 'ПТУ', emoji: '🔧', price: 2000, level: 4, lessons: 5, lessonTime: 45, desc: 'Корочка и общага в придачу' },
  { name: 'Колледж', emoji: '📚', price: 10000, level: 7, lessons: 8, lessonTime: 60, desc: 'Бухучёт и деловой этикет' },
  { name: 'Университет', emoji: '🎓', price: 50000, level: 11, lessons: 12, lessonTime: 75, desc: 'Высшее! Мама гордилась бы' },
  { name: 'MBA', emoji: '🧠', price: 250000, level: 16, lessons: 15, lessonTime: 90, desc: 'Говоришь «синергия» без запинки' },
];
const LESSON_COST = { energy: 20, food: 8, mood: 3 };
const RETAKE_FEE = 0.2;

const QUIZ = [
  ['Сколько будет 7 × 8?', ['56', '54', '64']],
  ['Столица России?', ['Москва', 'Санкт-Петербург', 'Урюпинск']],
  ['Сколько ног у паука?', ['8', '6', '10']],
  ['Что тяжелее: килограмм ваты или килограмм железа?', ['Одинаково', 'Железо', 'Вата']],
  ['Сколько будет 15% от 200?', ['30', '20', '15']],
  ['Кто написал «Войну и мир»?', ['Толстой', 'Пушкин', 'Михалыч']],
  ['Как правильно?', ['Класть', 'Ложить', 'Покласть']],
  ['Сколько минут в 2,5 часах?', ['150', '250', '130']],
  ['Какая планета ближе всего к Солнцу?', ['Меркурий', 'Марс', 'Венера']],
  ['H₂O — это…', ['Вода', 'Водка', 'Перекись']],
  ['Что такое дебет в бухгалтерии?', ['Приход по счёту', 'Расход', 'Ругательство']],
  ['Сколько будет 12²?', ['144', '124', '122']],
  ['В каком году полетел Гагарин?', ['1961', '1957', '1969']],
  ['Что такое ВВП?', ['Валовой внутренний продукт', 'Высшая водочная проба', 'Вечерний выпуск передачи']],
  ['Синоним слова «маркетинг»?', ['Продвижение', 'Мародёрство', 'Маркировка']],
  ['Сколько бутылок по 0,4 ₽ нужно сдать, чтобы получить 100 ₽?', ['250', '400', '40']],
  ['Какой газ мы выдыхаем?', ['Углекислый', 'Кислород', 'Угарный']],
  ['Сколько сантиметров в метре?', ['100', '1000', '10']],
  ['Что такое KPI?', ['Ключевой показатель эффективности', 'Коэффициент пьяного индивида', 'Казённый платёжный индекс']],
  ['1000 − 7 = ?', ['993', '997', '983']],
  ['Самый большой океан?', ['Тихий', 'Атлантический', 'Северный Ледовитый']],
  ['Сколько дней в високосном году?', ['366', '365', '364']],
  ['Что такое «синергия»?', ['Совместный эффект', 'Синий энергетик', 'Болезнь суставов']],
  ['Сколько будет 3 + 3 × 3?', ['12', '18', '9']],
  ['Что измеряют в амперах?', ['Силу тока', 'Давление', 'Громкость']],
  ['Какого цвета чёрный ящик в самолёте?', ['Оранжевый', 'Чёрный', 'Белый']],
  ['Сколько процентов в одной десятой?', ['10%', '1%', '0,1%']],
  ['Кто такой аудитор?', ['Проверяет отчётность', 'Слушает аудиокниги', 'Чинит колонки']],
];

// Смена — это мини-игра (game) примерно на 30 секунд, оплата зависит от результата (см. minigames.js).
// physical — сила повышает оплату. rank — нужен ранг на предыдущей работе (карьерная лестница)
const JOBS = [
  { id: 'flyers', name: 'Раздатчик листовок', emoji: '📄', game: 'targets', pay: 150, energy: 20, food: 10, mood: -5, req: { level: 2, edu: 1, body: 1, shoes: 1 } },
  { id: 'loader', name: 'Грузчик на рынке', emoji: '📦', game: 'timing', pay: 400, energy: 40, food: 20, mood: -5, health: -5, physical: true, req: { level: 3, edu: 1, body: 1, shoes: 1, health: 60, rank: ['flyers', 1] } },
  { id: 'courier', name: 'Курьер', emoji: '🛵', game: 'lanes', pay: 1000, energy: 35, food: 15, mood: -4, health: -2, physical: true, req: { level: 5, edu: 2, body: 1, shoes: 1, transport: 1, rank: ['loader', 1] } },
  { id: 'guard', name: 'Охранник в ТЦ', emoji: '🛡️', game: 'targets', pay: 2000, energy: 20, food: 15, mood: -8, physical: true, req: { level: 7, edu: 2, body: 1, shoes: 1, health: 50, rank: ['courier', 1] } },
  { id: 'taxi', name: 'Таксист', emoji: '🚕', game: 'lanes', pay: 3500, energy: 30, food: 15, mood: -5, req: { level: 9, edu: 2, body: 1, shoes: 1, transport: 6, rank: ['courier', 2] } },
  { id: 'seller', name: 'Продавец-консультант', emoji: '🛍️', game: 'orders', pay: 5000, energy: 30, food: 20, mood: -6, req: { level: 10, edu: 3, body: 2, shoes: 1, rank: ['guard', 1] } },
  { id: 'manager', name: 'Менеджер по продажам', emoji: '💼', game: 'orders', pay: 15000, energy: 35, food: 25, mood: -8, req: { level: 14, edu: 4, body: 3, shoes: 3, rank: ['seller', 1] } },
  { id: 'director', name: 'Директор филиала', emoji: '🏢', game: 'orders', pay: 50000, energy: 40, food: 30, mood: -10, req: { level: 18, edu: 5, body: 3, shoes: 3, housing: 5, rank: ['manager', 2] } },
];

// Опыт: сколько XP за действия. Уровень N → N+1 требует 30 × N^1.5 XP
const XP = { tap: 0.08, bottles: 0.01, trash: 4, mini: 1, event: 3, lesson: 4, exam: 25, gym: 3, meet: 3, date: 5, task: 10, daily: 10, house: 25 };
const CASINO_LEVEL = 5;

const LOOT = [
  { name: 'Горсть мелочи', art: 'coins', rarity: 'common', w: 22, give: () => { const m = Math.round(rand(5, 20) * scale()); addMoney(m); return `+${fmt(m)} ₽`; } },
  { name: 'Пакет с бутылками', art: 'bag', rarity: 'common', w: 22, give: () => { const b = 20 + S.housing * 15; addBottles(b); return `+${fmt(b)} бутылок`; } },
  { name: 'Недоеденная шаурма', emoji: '🌯', rarity: 'common', w: 12, give: () => {
      feed(15);
      if (Math.random() < 0.35) { addEffect('poison', 4); return 'Сытость +15… но живот крутит. 🤢 Отравление!'; }
      return 'Сытость +15. Повезло, свежая'; } },
  { name: 'Старый матрас', emoji: '🛏️', rarity: 'common', w: 6, give: () => {
      addMood(10);
      if (Math.random() < 0.5) { addEffect('lice'); return 'Выспался (+10 радости), но подцепил 🪳 вшей'; }
      return 'Выспался как король: +10 радости'; } },
  { name: 'Разбитый телефон', art: 'phone', rarity: 'rare', w: 6, give: () => { const m = Math.round(120 * scale()); addMoney(m); return `Продал на рынке: +${fmt(m)} ₽`; } },
  { name: 'Старые часы', art: 'watch', rarity: 'rare', w: 4, give: () => { const m = Math.round(350 * scale()); addMoney(m); return `Ломбард дал +${fmt(m)} ₽`; } },
  { name: 'Лотерейный билет', art: 'ticket', rarity: 'rare', w: 5, give: () => {
      if (Math.random() < 0.3) { const m = Math.round(700 * scale()); addMoney(m); addMood(15); return `Выигрыш! +${fmt(m)} ₽`; }
      addMood(-3); return 'Пусто… «Попробуйте ещё раз»'; } },
  { name: 'Золотая крышка', art: 'goldcap', rarity: 'epic', w: 0.7, give: () => (addCaps(1), '+1 золотая крышка') },
  { name: 'Крыса!', emoji: '🐀', rarity: 'bad', w: 9, give: () => {
      hurt(8);
      if (Math.random() < 0.4) { addEffect('ratbite'); return 'Цапнула за ногу! −8 здоровья. Нога как-то странно опухает…'; }
      return 'Цапнула за палец! −8 здоровья'; } },
  { name: 'Конкурент Шнырь', emoji: '🦊', rarity: 'bad', w: 7, give: () => {
      const lost = Math.floor(S.bottles * 0.3); S.bottles -= lost; hurt(5); addMood(-10);
      return `Это его мусорка! Надавал по шее и отжал ${fmt(lost)} бутылок`; } },
  { name: 'Порезался стеклом', emoji: '🩸', rarity: 'bad', w: 6, give: () => (hurt(7), '−7 здоровья. Надо бы в перчатках…') },
];
const RARITY_NAMES = { common: 'Обычное', rare: 'Редкое', epic: 'Эпическое', bad: 'Неудача' };
const TRASH_COOLDOWN = 5 * 60; // секунд

const LEISURE = [
  { id: 'mihalych', name: 'Посиделки с Михалычем', emoji: '🔥', price: 0, mood: 20, health: -5, energy: -10, cd: 120, risk: { hangover: 0.5 }, desc: 'Байки у костра. Утром может быть похмелье' },
  { id: 'football', name: 'Футбол у ларька', emoji: '📺', price: 0, mood: 8, cd: 60, desc: 'Смотреть матч через витрину' },
  { id: 'cinema', name: 'Кино с попкорном', emoji: '🍿', price: 300, mood: 20, cd: 120, req: { level: 3, body: 1 }, desc: 'В лохмотьях не пустят' },
  { id: 'banya', name: 'Баня с вениками', emoji: '🧖', price: 1500, mood: 30, health: 8, cd: 180, req: { level: 6, housing: 3 }, desc: 'С пивком и разговорами' },
  { id: 'karaoke', name: 'Караоке-бар', emoji: '🎤', price: 5000, mood: 45, cd: 180, req: { level: 9, housing: 4 }, risk: { hangover: 0.3 }, desc: '«Владимирский централ» на бис' },
  { id: 'spa', name: 'СПА-курорт', emoji: '🏝️', price: 60000, mood: 70, health: 30, cd: 300, req: { level: 13, housing: 5 }, desc: 'Массаж, бассейн, тишина' },
];

const GIRLS = [
  { id: 'lyuska', name: 'Люська с вокзала', emoji: '👩‍🦳', picky: 0.05, std: 0.45, req: { level: 3 }, desc: 'Не задаёт лишних вопросов' },
  { id: 'zinka', name: 'Соседка Зинка', emoji: '💅', picky: 0.2, std: 0.25, req: { level: 4, housing: 2 }, desc: 'Любит мужчин с жилплощадью' },
  { id: 'sveta', name: 'Продавщица Света', emoji: '👩', picky: 0.3, std: 0.1, req: { level: 5, body: 1, edu: 1 }, desc: 'Ценит чистую рубашку' },
  { id: 'katya', name: 'Студентка Катя', emoji: '👩‍🎓', picky: 0.4, std: 0.05, req: { level: 9, edu: 3, housing: 3 }, desc: 'С ней надо говорить умно' },
  { id: 'angela', name: 'Бизнес-леди Анжела', emoji: '👩‍💼', picky: 0.5, std: 0.03, req: { level: 14, edu: 4, body: 3, housing: 5 }, desc: 'Время — деньги' },
  { id: 'kristina', name: 'Модель Кристина', emoji: '💃', picky: 0.6, std: 0.05, req: { level: 18, body: 3, housing: 6 }, desc: 'Только яхты и Мальдивы' },
];
const DATES = [
  { id: 'walk', name: 'Прогулка в парке', emoji: '🌳', price: 0, bonus: 0, rel: 8 },
  { id: 'cafe', name: 'Кафе', emoji: '☕', price: 400, bonus: 0.1, rel: 15 },
  { id: 'cinema', name: 'Кино', emoji: '🎬', price: 1200, bonus: 0.15, rel: 20 },
  { id: 'rest', name: 'Ресторан', emoji: '🍷', price: 8000, bonus: 0.25, rel: 30 },
  { id: 'yacht', name: 'Яхта', emoji: '🛥️', price: 150000, bonus: 0.4, rel: 50 },
];
const DATE_CD = 60;

// Слоты: символ, вес, множитель за три в ряд. 777 выпадает примерно раз на 125 000 прокрутов. RTP ≈ 91%
const SLOT_SYMS = [['🍾', 32, 2], ['🥖', 26, 3], ['🐀', 20, 5], ['🍒', 14, 8], ['💰', 6, 15], ['7️⃣', 2, 100]];
const SLOT_PAIR = 1.4;
const BETS = [10, 50, 200, 1000, 5000, 25000];

const DAILY = [{ money: 30 }, { money: 60 }, { money: 100 }, { money: 150 }, { caps: 1 }, { money: 400 }, { caps: 3 }];

const TASKS = [
  { id: 'taps', name: 'Натапай 300 раз', goal: 300, reward: { money: 60 } },
  { id: 'sold', name: 'Обменяй 300 бутылок', goal: 300, reward: { money: 80 } },
  { id: 'trash', name: 'Покопайся в мусорке 2 раза', goal: 2, reward: { caps: 1 } },
  { id: 'bought', name: 'Купи что-нибудь', goal: 1, reward: { money: 50 } },
  { id: 'gym', name: 'Сделай 3 тренировки', goal: 3, reward: { money: 80 } },
  { id: 'events', name: 'Переживи 5 уличных событий', goal: 5, reward: { caps: 1 } },
];

const PREMIUM = [
  { id: 'caps10', name: 'Горсть крышек', caps: 10, stars: 25, emoji: '🟡' },
  { id: 'caps60', name: 'Мешок крышек', caps: 60, stars: 120, emoji: '💰', tag: 'Выгодно' },
  { id: 'caps200', name: 'Сундук Михалыча', caps: 200, stars: 350, emoji: '🧰', tag: '+30%' },
];

const STORY = [
  { scene: 5, eq: { hat: 'none', body: 'kostum', shoes: 'boots' }, title: 'Валера, 38 лет', text: 'Успешный менеджер. Квартира, машина, кот Барсик. Жизнь удалась.' },
  { scene: 4, eq: { hat: 'none', body: 'kostum', shoes: 'boots' }, title: 'Роковая подпись', text: 'Старый знакомый Эдик предложил «выгодное вложение». Всего одна подпись…' },
  { scene: 0, eq: { hat: 'none', body: 'rvan', shoes: 'none' }, mood: 'sad', title: 'Дно', text: 'Квартиру забрали. Машину забрали. Даже Барсика. Осталась лавка в парке и одна пустая бутылка. Пора подниматься!' },
];

const CHAPTERS = {
  1: 'Михалыч: «Коробка — это уже недвижимость, Валера. Главное — не сдавай её на макулатуру».',
  2: 'Михалыч: «Свой шалаш! На районе начали уважать. Говорят, Эдика видели на рынке…»',
  3: 'Шнырь: «Гараж, значит? Солидно. Слышал, Эдик теперь крышует приём стеклотары»',
  4: 'Соседка Зинка: «Новенький? Опять бутылками всю кухню заставил…» Ты снова живёшь под крышей!',
  5: 'Своя квартира. Почти как раньше. Осталось найти Эдика и вернуть Барсика.',
  6: 'Особняк! Эдик сам пришёл проситься в охранники. Барсик спит у бассейна. Ты прошёл путь от лавки до особняка 🎉',
};

// Мелкие уличные события: всплывают сами раз в 35–70 секунд. Чем слабее персонаж, тем чаще плохие
const MINI_BAD = [
  { e: '🦶', t: 'Споткнулся о бордюр', run: () => (hurt(3), '−3 ❤️') },
  { e: '🕊️', t: 'Голубь нагадил на голову', run: () => (addMood(-5), '−5 😊') },
  { e: '👮', t: 'Штраф за распитие в общественном месте', run: () => `−${fmt(takeMoney(0.08, 60))} ₽`, cond: () => S.money >= 20 },
  { e: '🧢', t: 'Хулиганы отжали бутылки', run: () => { const n = Math.floor(S.bottles * 0.2); S.bottles -= n; return `−${fmt(n)} 🍾`; }, cond: () => S.bottles >= 10 },
  { e: '🤧', t: 'Продуло на ветру', run: () => (hurt(5), '−5 ❤️'), cond: () => S.housing < 4 },
  { e: '🐕', t: 'Укусила бродячая собака', run: () => (hurt(6), addMood(-3), '−6 ❤️ −3 😊') },
  { e: '🕳️', t: 'Порвался карман — высыпалась мелочь', run: () => `−${fmt(takeMoney(0.05, 30))} ₽`, cond: () => S.money >= 20 },
  { e: '🌧️', t: 'Попал под ливень', run: () => (hurt(2), addMood(-8), '−2 ❤️ −8 😊'), cond: () => S.housing < 5 },
  { e: '💦', t: 'Наступил в лужу по щиколотку', run: () => (addMood(-3), '−3 😊') },
  { e: '🍺', t: 'Пьяный прохожий толкнул в кусты', run: () => (hurt(4), '−4 ❤️') },
  { e: '🫳', t: 'Карманник вытащил деньги', run: () => `−${fmt(takeMoney(0.1, 120))} ₽`, cond: () => S.money >= 20 },
  { e: '🚰', t: 'Попил воды из лужи', run: () => (hurt(4), '−4 ❤️'), cond: () => S.housing < 3 },
  { e: '👵', t: 'Бабка обругала последними словами', run: () => (addMood(-6), '−6 😊') },
  { e: '☀️', t: 'Перегрелся на солнце', run: () => (hurt(3), S.energy = Math.max(0, S.energy - 10), '−3 ❤️ −10 ⚡') },
  { e: '🦟', t: 'Комары не дали покоя', run: () => (S.energy = Math.max(0, S.energy - 8), addMood(-4), '−8 ⚡ −4 😊'), cond: () => S.housing < 4 },
  { e: '🚗', t: 'Машина окатила грязью из лужи', run: () => (addMood(-5), '−5 😊') },
  { e: '🧾', t: 'Разбил чужую бутылку — пришлось платить', run: () => `−${fmt(takeMoney(0.04, 25))} ₽`, cond: () => S.money >= 20 },
  { e: '🦷', t: 'Разболелся зуб', run: () => (hurt(3), addMood(-6), '−3 ❤️ −6 😊') },
];
const MINI_GOOD = [
  { e: '🪙', t: 'Нашёл мелочь под лавкой', run: () => { const m = Math.round(rand(3, 12) * scale()); addMoney(m); return `+${fmt(m)} ₽`; } },
  { e: '🥧', t: 'Добрая бабушка дала пирожок', run: () => (feed(10), '+10 🍞') },
  { e: '🙏', t: 'Прохожий подал «на хлеб»', run: () => { const m = Math.round(rand(8, 25) * scale()); addMoney(m); return `+${fmt(m)} ₽`; } },
  { e: '🌤️', t: 'Выглянуло солнышко', run: () => (addMood(5), '+5 😊') },
  { e: '🛍️', t: 'Кто-то выкинул пакет бутылок', run: () => { const n = 10 + S.housing * 8; addBottles(n); return `+${n} 🍾`; } },
  { e: '🐈', t: 'Бездомный кот потёрся о ногу', run: () => (addMood(6), '+6 😊') },
  { e: '🍲', t: 'Волонтёры раздают горячий суп', run: () => (feed(20), heal(2), '+20 🍞 +2 ❤️') },
  { e: '✊', t: 'Выиграл у Шныря в «камень-ножницы»', run: () => { const m = Math.round(rand(5, 15) * scale()); addMoney(m); return `+${fmt(m)} ₽`; } },
  { e: '😴', t: 'Удачно вздремнул на солнышке', run: () => (S.energy += 15, heal(2), '+15 ⚡ +2 ❤️') },
  { e: '💊', t: 'Медсестра-волонтёр дала витамины', run: () => (heal(5), '+5 ❤️') },
  { e: '🎻', t: 'Уличный музыкант поделился выручкой', run: () => { const m = Math.round(rand(10, 30) * scale()); addMoney(m); addMood(4); return `+${fmt(m)} ₽ +4 😊`; } },
  { e: '💸', t: 'Ветер принёс купюру', run: () => { const m = Math.round(rand(20, 60) * scale()); addMoney(m); return `+${fmt(m)} ₽`; } },
  { e: '🍵', t: 'Михалыч угостил горячим чаем', run: () => (heal(2), addMood(3), '+2 ❤️ +3 😊') },
  { e: '📰', t: 'Нашёл свежую газету и почитал', run: () => (addMood(3), addXp(2), '+3 😊 +2 XP') },
  { e: '🧤', t: 'На лавке забыли тёплые перчатки', run: () => (heal(3), addMood(3), '+3 ❤️ +3 😊') },
  { e: '🍎', t: 'Торговка с рынка угостила яблоком', run: () => (feed(6), heal(1), '+6 🍞 +1 ❤️') },
];

// Крупные события с выбором (модальное окно)
const EVENTS = [
  {
    title: 'Нашёл кошелёк', emoji: '👛', text: 'На лавке лежит кожаный кошелёк. Внутри деньги и визитка.',
    options: [
      { label: 'Вернуть хозяину', run: () => { const m = Math.round(40 * scale()); addMoney(m); addMood(10); S.karma++; return `Хозяин растрогался и дал ${fmt(m)} ₽. Радость +10`; } },
      { label: 'Оставить себе', run: () => {
          if (Math.random() < 0.5) { const m = Math.round(90 * scale()); addMoney(m); return `Повезло: +${fmt(m)} ₽`; }
          const lost = Math.floor(S.bottles * 0.3); S.bottles -= lost; addMood(-5); return `Подстава! Участковый «изъял» ${fmt(lost)} бутылок`; } },
    ],
  },
  {
    title: 'Дворник наступает', emoji: '🧹', text: 'Злой дворник Палыч гонит тебя с точки и замахивается метлой.',
    options: [
      { label: 'Убежать', run: () => { S.energy = Math.max(0, S.energy - 20); addMood(-5); return 'Убежал, но запыхался: −20 энергии'; } },
      { label: 'Договориться (10% денег)', run: () => { const m = takeMoney(0.1, 300); return `Палыч взял ${fmt(m)} ₽ «на чай» и отстал`; } },
    ],
  },
  {
    title: 'Наперстки', emoji: '🎲', text: 'Михалыч крутит наперстки: «Угадаешь — удвою!» Ставка — 20% твоих денег.',
    options: [
      { label: 'Сыграть', run: () => {
          const bet = Math.floor(S.money * 0.2);
          if (bet <= 0) return 'Михалыч: «Без денег не играем, Валера»';
          if (Math.random() < 0.45) { addMoney(bet); addMood(10); return `Угадал! +${fmt(bet)} ₽`; }
          S.money -= bet; addMood(-8); return `Шарик был не там. −${fmt(bet)} ₽`; } },
      { label: 'Отказаться', run: () => 'Михалыч: «Ну и правильно. Я жульничаю»' },
    ],
  },
  {
    title: 'Туристы', emoji: '📸', text: 'Группа иностранцев хочет фото с «настоящим русским колоритом».',
    options: [
      { label: 'Позировать с бутылкой', run: () => { const m = Math.round(30 * scale()); addMoney(m); addMood(5); return `«Very authentic!» +${fmt(m)} ₽`; } },
      { label: 'Сыграть на балалайке', run: () => { const m = Math.round(rand(0, 80) * scale()); addMoney(m); addMood(m > 40 ? 10 : -5); return m > 40 ? `Овации! +${fmt(m)} ₽` : `Фальшивил. Дали ${fmt(m)} ₽`; } },
    ],
  },
  {
    title: 'Голуби', emoji: '🕊️', text: 'Стая наглых голубей нацелилась на твой обед.',
    options: [
      { label: 'Отбиваться', run: () => { S.energy = Math.max(0, S.energy - 10); return 'Отбился! −10 энергии'; } },
      { label: 'Поделиться', run: () => { feed(-10); addMood(5); S.karma++; return 'Голуби довольны. Сытость −10, радость +5'; } },
    ],
  },
  {
    title: 'Михалыч зовёт', emoji: '🍻', text: '«Валера, у меня день рождения! Ну, наверное. Давай по чуть-чуть?»',
    options: [
      { label: 'Выпить за здоровье', run: () => { addMood(15); if (Math.random() < 0.7) { addEffect('hangover', 4); return 'Отметили! Радость +15… и 🥴 похмелье'; } return 'Отметили культурно. Радость +15'; } },
      { label: 'Отказаться', run: () => { addMood(-3); return 'Михалыч обиделся. Радость −3'; } },
    ],
  },
  {
    title: 'Бабушка с сумками', emoji: '👵', text: 'Старушка еле тащит две огромные сумки до остановки.',
    options: [
      { label: 'Помочь донести', run: () => { S.energy = Math.max(0, S.energy - 15); const m = Math.round(25 * scale()); addMoney(m); addMood(8); S.karma++; return `Бабушка дала ${fmt(m)} ₽ и пирожок. −15 энергии, +8 радости`; } },
      { label: 'Пройти мимо', run: () => { addMood(-2); return 'Совесть немного грызёт. Радость −2'; } },
    ],
  },
  {
    title: '«Золотая» цепочка', emoji: '📿', text: 'Мутный тип в подворотне шепчет: «Золото, 585 проба! Отдам за 200 ₽».',
    options: [
      { label: 'Купить за 200 ₽', run: () => {
          if (S.money < 200) return 'Тип: «Нищеброд!» — и ушёл';
          S.money -= 200;
          if (Math.random() < 0.25) { const m = Math.round(900 + 200 * scale()); addMoney(m); addMood(15); return `Настоящая! Ломбард дал ${fmt(m)} ₽`; }
          addMood(-8); return 'Цепочка позеленела через час. −200 ₽'; } },
      { label: 'Отказаться', run: () => 'Тип растворился в темноте' },
    ],
  },
  {
    title: 'Облава!', emoji: '🚓', text: 'Полиция прочёсывает парк и забирает всех подозрительных.',
    options: [
      { label: 'Бежать', run: () => {
          S.energy = Math.max(0, S.energy - 25);
          if (Math.random() < 0.6 + S.form / 250) return 'Ушёл дворами! −25 энергии';
          const m = takeMoney(0.15, 400); return `Догнали. Штраф ${fmt(m)} ₽ и −25 энергии`; } },
      { label: 'Сидеть тихо', run: () => { const n = Math.floor(S.bottles * 0.5); S.bottles -= n; return `Отпустили, но бутылки «конфисковали»: −${fmt(n)} 🍾`; } },
    ],
  },
  {
    title: 'Разборка', emoji: '👊', text: 'Банда с соседнего двора требует отдать твою точку сбора бутылок.',
    options: [
      { label: 'Драться', run: () => {
          const chance = clamp(0.3 + S.strength / 150 + S.form / 300, 0.1, 0.85);
          if (Math.random() < chance) { const m = Math.round(50 * scale()); addMoney(m); addBottles(30); addMood(15); return `Победа! Отжал у них ${fmt(m)} ₽ и 30 бутылок (шанс был ${Math.round(chance * 100)}%)`; }
          hurt(20); addMood(-10); return `Побили. −20 здоровья, −10 радости (шанс был ${Math.round(chance * 100)}%). Качай силу!`; } },
      { label: 'Уступить', run: () => { addMood(-8); S.energy = Math.max(0, S.energy - 10); return 'Ушёл искать новое место. −8 радости'; } },
    ],
  },
  {
    title: 'Журналист', emoji: '🎙️', text: 'Корреспондент местной газеты пишет статью «Как живут люди улицы».',
    options: [
      { label: 'Дать интервью', run: () => { const m = Math.round(40 * scale()); addMoney(m); addMood(10); addXp(3); return `Гонорар ${fmt(m)} ₽ и минута славы. +10 радости`; } },
      { label: 'Отказаться', run: () => 'Журналист пошёл к Шнырю. Тот наврал с три короба' },
    ],
  },
];

const TOP_NPC = [
  ['Михалыч', '🧔', 820000], ['Шнырь', '🦊', 410000], ['Толик Батон', '🥖', 190000], ['Баба Валя', '👵', 96000],
  ['Профессор', '🎓', 42000], ['Костыль', '🦯', 15000], ['Гена Ящик', '📦', 5200], ['Зинка', '💅', 1800], ['Санёк Лом', '🔧', 420],
];

// =====================================================================
// Состояние
// =====================================================================

const SAVE_KEY = 'bomzh_save_v4';
const OFFLINE_HOURS = 8;
const OFFLINE_HOURS_VIP = 24;

function freshState() {
  return {
    money: 0, bottles: 0, caps: 5, xp: 0,
    energy: 100, food: 100, health: 100, mood: 70,
    housing: 0, edu: 0, karma: 0,
    form: 0, strength: 0, fatigue: 0, lastGym: 0, gymPlace: 'bar',
    study: null, // { stage, done, need, retake }
    owned: { hat: ['none'], body: ['rvan'], shoes: ['none'] },
    eq: { hat: 'none', body: 'rvan', shoes: 'none' },
    stats: { earned: 0, taps: 0, sold: 0, shifts: 0 },
    effects: [], junkLog: [],
    busy: null,
    girls: {}, girlfriend: null,
    cd: {},
    bet: 10,
    boostUntil: 0, vipUntil: 0,
    daily: { streak: 0, last: '' },
    tasks: { day: '', progress: {}, claimed: {} },
    storySeen: false,
    lastSeen: Date.now(),
    savedAt: 0,
  };
}

let S = freshState();

function today() { return new Date().toISOString().slice(0, 10); }
function rand(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function scale() { return 1 + S.housing * 1.6 + S.housing ** 2.4; }
function isVip() { return S.vipUntil > Date.now(); }
function isBoost() { return S.boostUntil > Date.now(); }

function cdLeft(key) { return Math.max(0, ((S.cd[key] || 0) - Date.now()) / 1000); }
function setCd(key, sec) { S.cd[key] = Date.now() + sec * 1000; }

function gear(slot) { return CLOTHES[slot].find((i) => i.id === S.eq[slot]) || CLOTHES[slot][0]; }
function tierOf(slot) { return gear(slot).tier; }
function sumGear(field) { return Object.keys(CLOTHES).reduce((acc, slot) => acc + (gear(slot)[field] || 0), 0); }

// Забрать долю денег, но не больше потолка (чтобы событие не разоряло)
function takeMoney(part, cap) {
  const m = Math.min(Math.floor(S.money * part), Math.round(cap * scale()));
  S.money -= m;
  return m;
}

// ---------- Опыт и уровни ----------

// До 5 уровня быстро, дальше каждый уровень требует на 10% больше прежней формулы (10 ур. ×1.5, 20 ур. ×2.5)
function xpNeedV1(l) { return Math.round(30 * l ** 1.5); }
function xpNeed(l) { return l <= 5 ? xpNeedV1(l) : Math.round(xpNeedV1(l) * (1 + 0.1 * (l - 5))); }
function levelInfo(xp = S.xp) {
  let l = 1, rest = xp;
  while (rest >= xpNeed(l)) { rest -= xpNeed(l); l++; }
  return { level: l, cur: rest, need: xpNeed(l) };
}
function level() { return levelInfo().level; }

let pendingLevelUp = null;

function addXp(v) {
  if (typeof xpMult === 'function') v *= xpMult();
  const before = level();
  S.xp += v;
  const after = level();
  if (after > before) {
    for (let l = before + 1; l <= after; l++) {
      addMoney(40 * l * l);
      addCaps(levelCaps(l));
    }
    pendingLevelUp = { from: before, to: after };
  }
}

// Крышки — донатная валюта: за уровни дают только на каждом пятом
function levelCaps(l) { return l % 5 === 0 ? 2 : 0; }

function unlocksAt(l) {
  const out = [];
  HOUSING.forEach((h) => { if (h.level === l && h.price) out.push(`🏠 ${h.name}`); });
  EDU.forEach((e) => { if (e.level === l) out.push(`${e.emoji} ${e.name}`); });
  JOBS.forEach((j) => { if (j.req.level === l) out.push(`${j.emoji} Работа: ${j.name}`); });
  GIRLS.forEach((g) => { if (g.req && g.req.level === l) out.push(`${g.emoji} ${g.name}`); });
  LEISURE.forEach((x) => { if (x.req && x.req.level === l) out.push(`${x.emoji} ${x.name}`); });
  GYMS.forEach((g) => { if (g.req && g.req.level === l) out.push(`${g.emoji} ${g.name}`); });
  TRICKS.forEach((t) => { if (t.level === l && l > 1) out.push(`${EFFECTS[t.id].emoji} Навык: ${EFFECTS[t.id].name}`); });
  if (l === CASINO_LEVEL) out.push('🎰 Казино');
  return out;
}

function showLevelUp() {
  const { from, to } = pendingLevelUp;
  pendingLevelUp = null;
  let money = 0, caps = 0;
  const unlocks = [];
  for (let l = from + 1; l <= to; l++) { money += 40 * l * l; caps += levelCaps(l); unlocks.push(...unlocksAt(l)); }
  openModal(`
    <div class="big-art"><div class="rays"></div><div class="levelup-num">${to}</div></div>
    <h3>Новый уровень!</h3>
    <p>Награда: <b style="color:var(--gold)">+${fmt(money)} ₽</b>${caps ? ` и <b style="color:var(--gold)">+${caps} кр.</b>` : ''}
    ${unlocks.length ? `<br><br>Открылось:<br>${unlocks.join('<br>')}` : ''}</p>
    <div class="btns"><button class="btn primary wide" data-act="close">Круто!</button></div>
  `, { center: true });
  confetti(70);
  sfx('levelup');
  haptic('success');
}

// ---------- Эффекты ----------

function activeEffects() {
  const now = Date.now();
  S.effects = S.effects.filter((e) => !e.until || e.until > now);
  return S.effects;
}
function hasEffect(id) { return activeEffects().some((e) => e.id === id); }
function addEffect(id, minutes = 0) {
  const until = minutes ? Date.now() + minutes * 60000 : 0;
  const ex = activeEffects().find((e) => e.id === id);
  if (ex) { if (ex.until && until) ex.until = Math.max(ex.until, until); return; }
  S.effects.push({ id, until, diag: !EFFECTS[id].needDiag });
}

function mods() {
  const m = { tap: 1, pity: 1, regen: 1, work: 1, rate: 1, study: 1, gain: 1, hpm: 0, mpm: 0, tapAdd: 0, crit: 0 };
  for (const e of activeEffects()) {
    const d = EFFECTS[e.id].mods || {};
    for (const k in d) { if (ADD_MODS.includes(k)) m[k] += d[k]; else m[k] *= d[k]; }
  }
  if (S.girlfriend) m.mpm += 0.5;
  m.crit += sumGear('crit'); m.mpm += sumGear('mood');
  if (S.mood < 20) { m.tap *= 0.7; m.work *= 0.7; } else if (S.mood >= 80) { m.tap *= 1.15; m.pity *= 1.15; m.work *= 1.15; }
  if (S.health < 30) m.tap *= 0.6;
  if (S.food < 20) { m.tap *= 0.5; m.pity *= 0.5; }
  if (S.fatigue > 60) m.tap *= 0.85;
  HOOKS.mods.forEach((f) => f(m));
  const g = (isBoost() ? 2 : 1) * (isVip() ? 2 : 1);
  m.tap *= g; m.pity *= g; m.work *= g;
  return m;
}

// ---------- Характеристики ----------

function maxEnergy() { return HOUSING[S.housing].energy + sumGear('energy') + Math.floor(S.form / 2); }
function maxFood() { return 100; }
function maxHealth() { return 100 + Math.floor(S.form); }
function maxMood() { return 100; }
function regenPerMin() { return HOUSING[S.housing].regen * (1 + S.form / 200) * mods().regen; }
function tapPower() { const m = mods(); return Math.max(1, Math.floor((1 + sumGear('tap') + m.tapAdd) * m.tap)); }
// Милостыня подают только оборванцу на улице: в приличной одежде не подают, во время сна/работы тоже.
// Жильё и одежда её не увеличивают — так её нельзя раскачать в бесконечный доход
const PITY_BASE = 30; // ₽ в час в лохмотьях
const PITY_BY_TIER = [1, 0.4, 0.1, 0];
function pityTier() { return Math.max(tierOf('body'), tierOf('shoes')); }
function pityPerSec() {
  if (S.busy) return 0;
  let v = PITY_BASE / 3600 * PITY_BY_TIER[pityTier()];
  if (S.mood < 25) v *= 1.2;
  return v * mods().pity * (1 + sumGear('pity'));
}
// Радость в минуту. Чем лучше жильё, тем медленнее грусть; на самом дне она затягивает вдвое медленнее,
// а несколько дебаффов разом не роняют радость быстрее 2.5/мин
function moodDelta(m = mods()) {
  let d = m.mpm - Math.max(0.15, 0.5 - S.housing * 0.06);
  if (d < 0 && S.mood < 30) d *= 0.5;
  return clamp(d, -2.5, 3);
}
function critChance() { return 0.03 + mods().crit; }
function healthDelta() {
  let d = HOUSING[S.housing].hpm + S.form * 0.006;
  if (S.food > 60) d += 0.2;
  if (S.food < 20) d -= 1;
  if (S.food <= 0) d -= 1;
  if (S.mood < 20) d -= 0.3;
  return d + mods().hpm;
}

// Курс обменника плавает со временем (две синусоиды — похоже на настоящий график)
function bottleRate(t = Date.now()) {
  return 0.8 * (1 + 0.3 * Math.sin(t / 420000) + 0.12 * Math.sin(t / 97000 + 1)) * mods().rate;
}
function capRate() { return Math.round(40 * scale()); }
const EXCHANGE_FEE = 0.05;

// Сила персонажа: от неё зависит доля плохих уличных событий (60% у новичка → 30% у прокачанного)
function power() {
  return level() * 0.4 + S.housing * 1.2 + (tierOf('body') + tierOf('shoes') + tierOf('hat')) * 0.6 + S.form / 25 + S.strength / 30;
}
function badChance() { return clamp(0.6 - power() * 0.025, 0.3, 0.6); }

function fmt(n) {
  n = Math.floor(n);
  if (Math.abs(n) < 10000) return n.toLocaleString('ru-RU');
  const units = [['млрд', 1e9], ['млн', 1e6], ['K', 1e3]];
  for (const [u, v] of units) if (Math.abs(n) >= v) return (n / v).toFixed(n / v < 100 ? 1 : 0).replace('.0', '') + ' ' + u;
  return String(n);
}
// Короткая запись для плашек наверху: 9999, 12.5K, 118K, 3.4M, 1.2B — всегда в одну строку
function fmtShort(n) {
  n = Math.floor(n);
  const a = Math.abs(n);
  if (a < 10000) return String(n);
  for (const [u, v] of [['B', 1e9], ['M', 1e6], ['K', 1e3]]) if (a >= v) return (n / v).toFixed(a / v < 100 ? 1 : 0).replace('.0', '') + u;
  return String(n);
}
function fmtTime(sec) {
  sec = Math.max(0, Math.ceil(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function addMoney(m) { S.money += m; S.stats.earned += Math.max(0, m); bump('resMoney'); }
function addBottles(b) { S.bottles += b; bump('resBottles'); }
function addCaps(c) { S.caps += c; bump('resCaps'); }
function feed(f) { S.food = clamp(S.food + f, 0, maxFood()); }
function addMood(v) { S.mood = clamp(S.mood + v, 0, maxMood()); }
function hurt(v) { S.health = clamp(S.health - v, 0, maxHealth()); }
function heal(v) { S.health = clamp(S.health + v, 0, maxHealth()); }
function clampStats() {
  S.energy = clamp(S.energy, 0, maxEnergy());
  S.food = clamp(S.food, 0, maxFood());
  S.health = clamp(S.health, 0, maxHealth());
  S.mood = clamp(S.mood, 0, maxMood());
  S.fatigue = clamp(S.fatigue, 0, 100);
  S.form = clamp(S.form, 0, 100);
  S.strength = clamp(S.strength, 0, 100);
}

function giveReward(r) {
  if (r.money) addMoney(Math.round(r.money * scale()));
  if (r.caps) addCaps(r.caps);
}
function rewardText(r) { return r.money ? `${fmt(r.money * scale())} ₽` : `${r.caps} кр.`; }

function ensureTasksDay() { if (S.tasks.day !== today()) S.tasks = { day: today(), progress: {}, claimed: {} }; }
function taskProgress(id, amount = 1) { ensureTasksDay(); S.tasks.progress[id] = (S.tasks.progress[id] || 0) + amount; track(id, amount); }
// Общие счётчики для достижений и сюжетных квестов
function track(key, n = 1) {
  if (!S.counters) S.counters = {};
  S.counters[key] = (S.counters[key] || 0) + n;
  HOOKS.track.forEach((f) => f(key, n));
}
function counter(key) { return (S.counters && S.counters[key]) || 0; }

// ---------- Требования (уровень, образование, одежда, жильё, здоровье) ----------

function reqList(req = {}) {
  const out = [];
  if (req.level) out.push({ ok: level() >= req.level, text: `Уровень ${req.level}` });
  if (req.edu) out.push({ ok: S.edu >= req.edu, text: EDU[req.edu].name });
  if (req.body) out.push({ ok: tierOf('body') >= req.body, text: `Одежда: ${TIERS[req.body]}` });
  if (req.shoes) out.push({ ok: tierOf('shoes') >= req.shoes, text: `Обувь: ${TIERS[req.shoes]}` });
  if (req.housing) out.push({ ok: S.housing >= req.housing, text: HOUSING[req.housing].name });
  if (req.health) out.push({ ok: S.health >= req.health, text: `Здоровье ${req.health}+` });
  if (req.transport) out.push({ ok: (S.transport || 0) >= req.transport, text: `Транспорт: ${TRANSPORT[req.transport].name}+` });
  if (req.rank) out.push({ ok: jobRank(req.rank[0]) >= req.rank[1], text: `${JOBS.find((j) => j.id === req.rank[0]).name}: ${typeof posName === 'function' ? posName(req.rank[0], req.rank[1]) : RANKS[req.rank[1]].name}` });
  if (req.prestige) out.push({ ok: (S.prestige || 0) >= req.prestige, text: `Престиж ${req.prestige}` });
  return out;
}
function reqOk(req) { return reqList(req).every((r) => r.ok); }
function reqHTML(req) {
  const l = reqList(req);
  return l.length ? `<div class="reqs">${l.map((r) => `<i class="${r.ok ? 'ok' : ''}">${r.ok ? '✓' : '✗'} ${r.text}</i>`).join('')}</div>` : '';
}

// =====================================================================
// Сохранение
// =====================================================================

function cloudOk() { return tg && tg.CloudStorage && tg.isVersionAtLeast && tg.isVersionAtLeast('6.9'); }

// Облако Telegram хранит не больше 4096 символов в одной записи, а сохранение давно больше.
// Поэтому режем его на куски и пишем по очереди в два слота (a/b): сначала куски, потом «оглавление».
// Так с телефона и с компьютера открывается один и тот же прогресс, и недописанная копия никогда не читается.
const CLOUD_CHUNK = 3900;
const CLOUD_EVERY = 8000; // писать в облако не чаще раза в 8 секунд
let cloudTimer = null, cloudLastAt = 0, cloudBusy = false, cloudSlot = 'a';

function cloudWrite() {
  if (!cloudOk() || cloudBusy) return;
  cloudBusy = true;
  cloudLastAt = Date.now();
  const json = JSON.stringify(S);
  const slot = cloudSlot === 'a' ? 'b' : 'a';
  const parts = Math.ceil(json.length / CLOUD_CHUNK);
  let left = parts, failed = false;
  const done = () => {
    if (failed) { cloudBusy = false; return; }
    tg.CloudStorage.setItem(`${SAVE_KEY}_meta`, JSON.stringify({ slot, n: parts, at: S.savedAt }), () => { cloudSlot = slot; cloudBusy = false; });
  };
  try {
    for (let i = 0; i < parts; i++) {
      tg.CloudStorage.setItem(`${SAVE_KEY}_${slot}${i}`, json.slice(i * CLOUD_CHUNK, (i + 1) * CLOUD_CHUNK), (err) => {
        if (err) failed = true;
        if (--left === 0) done();
      });
    }
  } catch (e) { cloudBusy = false; }
}

// ---------- Сервер: главное хранилище профиля, одно на телефон и компьютер ----------
// Игра пишет на сервер только после того, как прочитала оттуда профиль, — иначе пустой
// прогресс с нового устройства мог бы затереть настоящий.
const SERVER_EVERY = 15000;
const DEVICE_ID = (() => {
  try {
    let d = localStorage.getItem('bomzh_device');
    if (!d) { d = Math.random().toString(36).slice(2, 10); localStorage.setItem('bomzh_device', d); }
    return d;
  } catch (e) { return 'nostore'; }
})();
let serverReady = false, serverBase = 0, srvTimer = null, srvLastAt = 0, srvBusy = false, SAVE_LOCK = false;
let LOADED = false; // до загрузки в S лежит пустой профиль — его нельзя сохранять

function serverOk() { return typeof REF_API !== 'undefined' && REF_API && tg && tg.initData; }
async function serverCall(path, extra) {
  const r = await fetch(`${REF_API}/api/save/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
    body: JSON.stringify({ initData: tg.initData, device: DEVICE_ID, ...extra }),
  });
  if (!r.ok) throw new Error('http ' + r.status);
  return r.json();
}
async function serverGet() {
  const j = await serverCall('get', {});
  return j.data ? parseSave(j.data) : null;
}
async function serverWrite(force) {
  if (!serverReady || srvBusy || SAVE_LOCK || !serverOk()) return;
  srvBusy = true; srvLastAt = Date.now();
  try {
    const j = await serverCall('put', { data: JSON.stringify(S), savedAt: S.savedAt, base: serverBase, force: !!force });
    if (j.conflict) {
      // Пока это окно было открыто, играли на другом устройстве
      const remote = parseSave(j.data);
      if (remote) adoptOrAsk(remote);
    } else if (j.ok) serverBase = Math.max(serverBase, j.savedAt || 0);
  } catch (e) { /* сервер выключен — сохранимся в следующий раз */ }
  srvBusy = false;
}
// На сервере профиль новее: если здесь почти ничего не наиграно — молча берём его, иначе спрашиваем
function adoptOrAsk(remote) {
  const unsynced = (S.savedAt || 0) - serverBase;
  const remoteBetter = (remote.savedAt || 0) > (S.savedAt || 0) && (remote.xp || 0) >= (S.xp || 0);
  if (unsynced < 60000 || remoteBetter) { adoptSave(remote); return; }
  serverReady = false;
  ALT_SAVE = remote;
  if (typeof showSavePick === 'function') showSavePick();
}
function adoptSave(remote) {
  SAVE_LOCK = true;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(remote)); } catch (e) { /* нет доступа */ }
  toast('☁️ Подгружаю прогресс с другого устройства…', 'good');
  setTimeout(() => location.reload(), 700);
}
// Проверка при возврате в игру и после неудачной загрузки
function serverSync() {
  if (!serverOk() || srvBusy || SAVE_LOCK || ALT_SAVE) return;
  serverGet().then((remote) => {
    serverReady = true;
    if (remote && (remote.savedAt || 0) > serverBase && (remote.savedAt || 0) !== (S.savedAt || 0)) {
      if (serverBase === 0 && (remote.savedAt || 0) < (S.savedAt || 0) && (remote.xp || 0) <= (S.xp || 0) * 1.02 + 50) serverBase = remote.savedAt;
      else { adoptOrAsk(remote); return; }
    }
    serverWrite();
  }).catch(() => {});
}

function save(now) {
  if (SAVE_LOCK || !LOADED) return;
  S.lastSeen = Date.now();
  S.savedAt = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* приватный режим */ }
  if (serverOk()) {
    clearTimeout(srvTimer);
    srvTimer = setTimeout(serverWrite, now ? 0 : Math.max(0, SERVER_EVERY - (Date.now() - srvLastAt)));
  }
  if (!cloudOk()) return;
  clearTimeout(cloudTimer);
  const wait = now ? 0 : Math.max(0, CLOUD_EVERY - (Date.now() - cloudLastAt));
  cloudTimer = setTimeout(cloudWrite, wait);
}
document.addEventListener('visibilitychange', () => {
  if (typeof S === 'undefined' || !S.storySeen) return;
  if (document.hidden) save(true);
  else serverSync();
});
setInterval(() => { if (!serverReady && typeof S !== 'undefined' && S.storySeen) serverSync(); }, 60000);

function parseSave(json) {
  if (!json) return null;
  try {
    const data = JSON.parse(json);
    const base = freshState();
    return { ...base, ...data, owned: { ...base.owned, ...data.owned }, eq: { ...base.eq, ...data.eq }, stats: { ...base.stats, ...data.stats } };
  } catch (e) { return null; }
}

// Сохранение, которое проиграло при загрузке, — если в нём прогресса больше, игра спросит, какое оставить
let ALT_SAVE = null;

// Читаем облако: сначала «оглавление» и куски, если их нет — старое сохранение одной записью
function cloudRead(cb) {
  tg.CloudStorage.getItem(`${SAVE_KEY}_meta`, (err, metaRaw) => {
    let meta = null;
    try { meta = !err && metaRaw ? JSON.parse(metaRaw) : null; } catch (e) { meta = null; }
    if (!meta || !meta.n) {
      tg.CloudStorage.getItem(SAVE_KEY, (e2, value) => cb(e2 ? null : parseSave(value)));
      return;
    }
    cloudSlot = meta.slot;
    const keys = Array.from({ length: meta.n }, (_, i) => `${SAVE_KEY}_${meta.slot}${i}`);
    tg.CloudStorage.getItems(keys, (e3, values) => {
      if (e3 || !values) { cb(null); return; }
      cb(parseSave(keys.map((k) => values[k] || '').join('')));
    });
  });
}

function load(done) {
  let local = null;
  try { local = parseSave(localStorage.getItem(SAVE_KEY)); } catch (e) { /* нет доступа */ }
  // Читаем сразу три копии: в браузере, в облаке Telegram и на сервере — берём самую свежую
  let cloud = null, server = null, waiting = 0, finished = false;
  const finish = () => {
    if (finished) return;
    finished = true; clearTimeout(timer);
    const all = [local, cloud, server].filter(Boolean).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    if (all[0]) S = all[0];
    // Конфликт: новее оказалось сохранение с меньшим прогрессом (играл на двух устройствах раздельно)
    const alt = all.slice(1).sort((a, b) => (b.xp || 0) - (a.xp || 0))[0];
    if (alt && (alt.xp || 0) > (all[0].xp || 0) * 1.02 + 50) ALT_SAVE = alt;
    LOADED = true;
    done();
    if (serverReady && !ALT_SAVE && (!server || (S.savedAt || 0) > serverBase)) setTimeout(() => serverWrite(), 1500);
  };
  const part = () => { if (--waiting <= 0) finish(); };
  const timer = setTimeout(finish, 6000);
  if (cloudOk()) {
    waiting++;
    try { cloudRead((c) => { cloud = c; part(); }); } catch (e) { part(); }
  }
  if (serverOk()) {
    waiting++;
    serverGet().then((s) => {
      if (finished) return; // опоздал — проверим позже через serverSync
      server = s; serverReady = true; serverBase = s ? (s.savedAt || 0) : 0;
      part();
    }).catch(part);
  }
  if (!waiting) finish();
}

// =====================================================================
// Обратная связь: вибрация, тосты, конфетти, летящие монеты
// =====================================================================

function haptic(type = 'light') {
  try {
    if (!tg || !tg.HapticFeedback || (S.settings && S.settings.vibro === false)) return;
    if (type === 'success' || type === 'error' || type === 'warning') tg.HapticFeedback.notificationOccurred(type);
    else tg.HapticFeedback.impactOccurred(type);
  } catch (e) { /* старый клиент */ }
}

function bump(id) {
  const el = $(id);
  if (!el) return;
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

function toast(text, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.textContent = text;
  $('toastRoot').appendChild(el);
  setTimeout(() => el.remove(), 2800);
  if (typeof logEvent === 'function') logEvent(text, kind);
  if (kind.includes('bad')) sfx('bad'); else if (kind.includes('good')) sfx('good');
}

function confetti(n = 40) {
  const colors = ['#F2B33D', '#6CC36A', '#4FA3E0', '#E5534B', '#B06CFF'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.background = colors[i % colors.length];
    c.style.left = (window.innerWidth / 2) + 'px';
    c.style.top = (window.innerHeight * 0.4) + 'px';
    document.body.appendChild(c);
    const dx = rand(-1, 1) * window.innerWidth * 0.6;
    const dy = rand(-0.5, 0.6) * window.innerHeight;
    c.animate([
      { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) rotate(${rand(-720, 720)}deg)`, opacity: 0 },
    ], { duration: rand(900, 1600), easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => c.remove();
  }
}

function flyCoins(fromEl, toEl, count = 8, icon = 'coin') {
  if (!fromEl || !toEl) return;
  sfx('coin');
  const a = fromEl.getBoundingClientRect();
  const b = toEl.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'coin-fly';
    c.innerHTML = ICONS[icon];
    document.body.appendChild(c);
    const sx = a.left + a.width / 2 + rand(-30, 30), sy = a.top + a.height / 2 + rand(-10, 10);
    const ex = b.left + 10, ey = b.top + 4;
    c.animate([
      { transform: `translate(${sx}px, ${sy}px) scale(.6)`, opacity: 0 },
      { transform: `translate(${sx + rand(-40, 40)}px, ${sy - rand(40, 90)}px) scale(1.1)`, opacity: 1, offset: 0.35 },
      { transform: `translate(${ex}px, ${ey}px) scale(.7)`, opacity: 1 },
    ], { duration: 650 + i * 45, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => { c.remove(); bump(toEl.id); };
  }
}

// =====================================================================
// Модалки
// =====================================================================

function openModal(html, { center = false, locked = false } = {}) {
  $('modalRoot').innerHTML = '';
  BJ = null;
  const back = document.createElement('div');
  back.className = 'backdrop' + (center ? ' center' : '');
  back.innerHTML = `<div class="sheet">${html}</div>`;
  if (locked) back.dataset.locked = '1';
  back.addEventListener('click', (e) => { if (e.target === back && !back.dataset.locked) closeModal(); });
  $('modalRoot').appendChild(back);
  fillIcons(back);
  return back;
}
function closeModal() {
  $('modalRoot').innerHTML = '';
  BJ = null;
  QZ = null;
  refresh();
}
function modalOpen() { return $('modalRoot').children.length > 0; }

function resultModal({ emoji, art, rays = '', badge = '', title, text, btn = 'Ок' }) {
  openModal(`
    <div class="big-art">${rays !== null ? `<div class="rays ${rays}"></div>` : ''}${art || `<div class="big-emoji">${emoji}</div>`}</div>
    ${badge}
    <h3>${title}</h3>
    <p>${text}</p>
    <div class="btns"><button class="btn primary wide" data-act="close">${btn}</button></div>
  `, { center: true });
}

function fillIcons(root = document) {
  root.querySelectorAll('.ic[data-ic]').forEach((el) => { if (!el.firstChild) el.innerHTML = ICONS[el.dataset.ic] || ''; });
}

// =====================================================================
// Игровая сцена и тапы
// =====================================================================

let renderedHousing = -1;
let renderedLook = '';

function lookState() {
  const sick = S.health < 30 || activeEffects().some((e) => EFFECTS[e.id].kind !== 'good');
  const mood = S.mood >= 60 ? 'happy' : S.mood < 25 ? 'sad' : 'ok';
  return { mood, sick };
}

function renderScene() {
  if (renderedHousing !== S.housing) {
    $('sceneBg').innerHTML = sceneSVG(S.housing);
    renderedHousing = S.housing;
  }
  const look = lookState();
  const key = JSON.stringify([S.eq, look]);
  if (renderedLook !== key) {
    $('valera').innerHTML = valeraSVG(S.eq, look);
    renderedLook = key;
  }
  $('locName').textContent = HOUSING[S.housing].name;
}

function onTap(e) {
  e.preventDefault();
  if ($('tapHint')) $('tapHint').remove();
  const valera = $('valera');
  if (S.energy < 1) {
    valera.animate([{ transform: 'translateX(-50%)' }, { transform: 'translateX(-46%)' }, { transform: 'translateX(-54%)' }, { transform: 'translateX(-50%)' }], { duration: 250 });
    haptic('error');
    if (!onTap.warned || Date.now() - onTap.warned > 3000) { toast('Нет сил! Поспи, выпей кофе или подожди', 'bad'); onTap.warned = Date.now(); }
    return;
  }
  const crit = Math.random() < critChance();
  const gain = tapPower() * (crit ? 5 : 1);
  S.energy -= 1;
  S.stats.taps++;
  taskProgress('taps');
  addBottles(gain);
  feed(-FOOD_PER_TAP);
  addXp(XP.tap);

  valera.animate([
    { transform: 'translateX(-50%) scale(1, 1)' },
    { transform: 'translateX(-50%) scale(1.06, .92)' },
    { transform: 'translateX(-50%) scale(.97, 1.04)' },
    { transform: 'translateX(-50%) scale(1, 1)' },
  ], { duration: 220, easing: 'ease-out' });
  const arm = valera.querySelector('.bottle-arm');
  if (arm) arm.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-12deg)' }, { transform: 'rotate(0)' }], { duration: 200 });

  const rect = $('scene').getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  const f = document.createElement('div');
  f.className = 'float' + (crit ? ' crit' : '');
  f.style.left = x + 'px';
  f.style.top = y + 'px';
  f.innerHTML = `${crit ? 'КРИТ! ' : ''}+${fmt(gain)} <i class="ic">${ICONS.bottle}</i>`;
  $('fx').appendChild(f);
  setTimeout(() => f.remove(), 900);
  spawnParticles(x, y, crit ? 14 : 5);

  haptic(crit ? 'heavy' : 'light');
  sfx(crit ? 'crit' : 'tap');
  if (typeof onTapExtra === 'function') onTapExtra();
  updateHud();
}

function spawnParticles(x, y, n) {
  const colors = ['#5FA05A', '#8FD18A', '#F2E6B8', '#4E8A9A'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.background = colors[i % colors.length];
    $('fx').appendChild(p);
    const ang = rand(0, Math.PI * 2), dist = rand(30, 80);
    p.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist + 40}px) rotate(${rand(90, 360)}deg) scale(.4)`, opacity: 0 },
    ], { duration: rand(450, 750), easing: 'cubic-bezier(.2,.8,.4,1)' }).onfinish = () => p.remove();
  }
}

function sceneFloat(text, kind) {
  const el = document.createElement('div');
  el.className = 'mini-float ' + kind;
  el.textContent = text;
  $('fx').appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

// =====================================================================
// Сон
// =====================================================================

function startSleep() {
  if (S.busy) { toast('Валера занят', 'bad'); return; }
  const missing = maxEnergy() - S.energy;
  if (missing < 5) { toast('Валера бодр, спать не хочется', 'bad'); return; }
  const minutes = clamp(missing / (regenPerMin() * SLEEP_SPEED), 0.25, 3);
  S.busy = { type: 'sleep', start: Date.now(), end: Date.now() + minutes * 60000, from: S.energy };
  toast(`💤 Валера уснул. ${S.housing < 3 ? 'На улице могут обчистить…' : 'Тут безопасно'}`);
  sfx('sleep');
  haptic('light');
}

function finishSleep(progress) {
  const b = S.busy;
  S.busy = null;
  S.energy = b.from + (maxEnergy() - b.from) * progress;
  const lines = [`Энергия: ${Math.floor(S.energy)}/${maxEnergy()}`];
  if (S.housing === 0) { hurt(2); lines.push('Замёрз на лавке: −2 ❤️'); } else if (S.housing >= 3) { heal(3); addMood(3); lines.push('Хорошо выспался: +3 ❤️ +3 😊'); }
  let robbed = false;
  const robChance = HOUSING[S.housing].rob * (typeof petGuardMult === 'function' ? petGuardMult() : 1);
  if (progress > 0.5 && Math.random() < robChance) {
    robbed = true;
    if (Math.random() < 0.5 && S.bottles > 0) { const n = Math.floor(S.bottles * 0.3); S.bottles -= n; lines.push(`Пока спал, утащили ${fmt(n)} бутылок!`); }
    else lines.push(`Пока спал, обчистили карманы: −${fmt(takeMoney(0.1, 100))} ₽`);
  }
  if (robbed) resultModal({ emoji: '🦝', rays: 'bad', title: 'Обокрали во сне', text: lines.join('<br>'), btn: 'Гады…' });
  else { toast(`☀️ Проснулся. ${lines.join('. ')}`); sfx('wake'); }
  if (robbed) { sfx('lootBad'); track('robbed'); }
  haptic(robbed ? 'error' : 'success');
}

// =====================================================================
// Обменник
// =====================================================================

function sparkline() {
  const now = Date.now();
  const pts = Array.from({ length: 31 }, (_, i) => bottleRate(now - (30 - i) * 60000));
  const lo = Math.min(...pts), hi = Math.max(...pts);
  const poly = pts.map((v, i) => `${(i / 30) * 300},${56 - ((v - lo) / (hi - lo || 1)) * 50}`).join(' ');
  return `<svg viewBox="0 0 300 60" preserveAspectRatio="none"><polyline points="${poly}" fill="none" stroke="#F2B33D" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
}

function openExchange() {
  openModal(`<h3>💱 Обменник Шныря</h3><div id="exBody"></div>`);
  renderExchange();
}

function renderExchange() {
  const body = $('exBody');
  if (!body) return;
  const rate = bottleRate();
  const trend = rate - bottleRate(Date.now() - 60000);
  const out = (n) => Math.floor(n * rate * (1 - EXCHANGE_FEE));
  const opt = (part, label) => {
    const n = Math.floor(S.bottles * part);
    return `<button class="btn ${part === 1 ? 'primary' : ''}" data-act="exchange" data-id="${part}" ${n < 10 ? 'disabled' : ''}>${label}<small>+${fmt(out(n))} ₽</small></button>`;
  };
  body.innerHTML = `
    <div class="rate-box">
      <div style="font-size:12px;color:var(--muted)">Курс стеклотары (за 30 мин)</div>
      <div class="rate">🍾 1 = ${rate.toFixed(2)} ₽
        <span class="${trend >= 0 ? 'up' : 'down'}">${trend >= 0 ? '▲' : '▼'} ${Math.abs(trend / rate * 100).toFixed(1)}%</span></div>
      ${sparkline()}
    </div>
    <p>У тебя <b>${fmt(S.bottles)}</b> бутылок. Комиссия Шныря 5%. Минимум 10 штук.</p>
    <div class="ex-grid">${opt(0.25, '25%')}${opt(0.5, '50%')}${opt(1, 'Всё')}</div>
    <div class="rate-box" style="display:flex;align-items:center;gap:10px">
      <i class="ic" data-ic="cap" style="width:32px;height:32px"></i>
      <div style="flex:1"><b>Продать крышку</b><div style="font-size:12px;color:var(--muted)">1 крышка = ${fmt(capRate())} ₽</div></div>
      <button class="btn" data-act="sellCap" ${S.caps < 1 ? 'disabled' : ''}>Продать</button>
    </div>
    <p class="test-note">Курс меняется каждую минуту. Лови момент, когда он выше!</p>`;
  fillIcons(body);
}

// =====================================================================
// Мусорка
// =====================================================================

function openTrash() {
  if (S.busy) { toast('Валера занят', 'bad'); return; }
  const left = cdLeft('trash');
  if (left > 0) { toast(`Мусорку уже обчистили. Ждать ${fmtTime(left)}`, 'bad'); haptic('error'); return; }
  openModal(`
    <h3>Мусорка</h3>
    <p>Посмотрим, что выбросили добрые люди…</p>
    <div class="trash-stage shake" id="trashStage">${trashCanSVG()}</div>
  `, { center: true, locked: true });
  haptic('medium');
  sfx('trash');
  setCd('trash', TRASH_COOLDOWN * (typeof trashCdMult === 'function' ? trashCdMult() : 1));
  taskProgress('trash');
  addXp(XP.trash);
  setTimeout(() => {
    const st = $('trashStage');
    if (!st) return;
    st.classList.remove('shake');
    st.classList.add('open');
    haptic('heavy');
    setTimeout(revealLoot, 450);
  }, 1300);
}

function revealLoot() {
  const total = LOOT.reduce((a, l) => a + l.w, 0);
  let r = Math.random() * total;
  const loot = LOOT.find((l) => (r -= l.w) < 0) || LOOT[0];
  const result = loot.give();
  resultModal({
    art: loot.art ? ITEM_ART[loot.art] : null, emoji: loot.emoji, rays: loot.rarity,
    badge: `<span class="rarity ${loot.rarity}">${RARITY_NAMES[loot.rarity]}</span>`,
    title: loot.name, text: result, btn: loot.rarity === 'bad' ? 'Эх…' : 'Забрать',
  });
  haptic(loot.rarity === 'bad' ? 'error' : loot.rarity === 'common' ? 'success' : 'heavy');
  sfx(loot.rarity === 'bad' ? 'lootBad' : 'loot');
  if (typeof onTrashExtra === 'function') onTrashExtra();
  if (loot.rarity === 'epic') confetti(60);
  save();
}

// =====================================================================
// Случайные события
// =====================================================================

let nextEventAt = Date.now() + rand(70, 110) * 1000;
let nextMiniAt = Date.now() + rand(25, 45) * 1000;

function maybeEvent() {
  if (!S.storySeen || modalOpen()) return;
  const now = Date.now();
  if (now >= nextMiniAt && !(S.busy && S.busy.type === 'sleep')) {
    nextMiniAt = now + rand(35, 70) * 1000;
    const bad = Math.random() < badChance();
    const pool = (bad ? MINI_BAD : MINI_GOOD).filter((m) => !m.cond || m.cond());
    const ev = pick(pool);
    const res = ev.run();
    addXp(XP.mini);
    taskProgress('events');
    toast(`${ev.e} ${ev.t}: ${res}`, 'mini ' + (bad ? 'bad' : 'good'));
    if ($('screen-game').classList.contains('active')) sceneFloat(res, bad ? 'bad' : 'good');
    haptic(bad ? 'warning' : 'light');
    return;
  }
  if (now < nextEventAt || !$('screen-game').classList.contains('active') || S.busy) return;
  nextEventAt = now + rand(90, 160) * 1000;
  const ev = pick(EVENTS);
  const back = openModal(`
    <div class="big-art" style="font-size:84px;height:110px">${ev.emoji}</div>
    <h3>${ev.title}</h3>
    <p>${ev.text}</p>
    <div class="btns">${ev.options.map((o, i) => `<button class="btn ${i === 0 ? 'primary' : ''} wide" data-opt="${i}">${o.label}</button>`).join('')}</div>
  `, { locked: true });
  haptic('warning');
  back.querySelectorAll('[data-opt]').forEach((b) => {
    b.onclick = () => {
      const msg = ev.options[+b.dataset.opt].run();
      taskProgress('events');
      addXp(XP.event);
      closeModal();
      toast(msg);
      save();
    };
  });
}

// =====================================================================
// Экраны со вкладками
// =====================================================================

const TABS = { shop: 'housing', life: 'work', fun: 'casino', tasks: 'tasks' };
let currentScreen = 'game';

function priceBtn(act, id, price, can, label) {
  // data-why — подсказка при нажатии на недоступную кнопку (см. ux.js)
  const why = !can && price > S.money ? ` data-why="Не хватает ${fmt(Math.ceil(price - S.money))} ₽"` : '';
  return `<button class="btn ${can ? 'primary' : ''}" data-act="${act}" data-id="${id}" ${can ? '' : 'disabled'}${why}>${label || (price ? `<i class="ic" data-ic="coin"></i>${fmt(price)}` : 'Бесплатно')}</button>`;
}
function card({ thumb, title, desc = '', extra = '', btn = '', cls = '' }) {
  return `<div class="card ${cls}"><div class="thumb">${thumb}</div>
    <div class="card-body"><div class="card-title">${title}</div>${desc ? `<div class="card-desc">${desc}</div>` : ''}${extra}</div>${btn}</div>`;
}
function plus(v, label) { return v ? `${v > 0 ? '+' : ''}${v} ${label}` : ''; }
function joinFx(arr) { return arr.filter(Boolean).join(' · '); }
function meter(label, value, max, warnAt) {
  return `<div class="meter"><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)"><span>${label}</span><b style="color:var(--text)">${Math.floor(value)}/${max}</b></div>
    <div class="progress"><div class="${warnAt && value >= warnAt ? 'warn' : ''}" style="width:${(value / max) * 100}%"></div></div></div>`;
}
const lockBtn = '<button class="btn" disabled>🔒</button>';

// ---------- Магазин ----------

function renderShop() {
  const tab = TABS.shop;
  if (EXTRA_TABS.shop[tab]) return EXTRA_TABS.shop[tab]();
  let html = '';

  if (tab === 'housing') {
    html = HOUSING.map((h, i) => {
      const owned = i <= S.housing, next = i === S.housing + 1;
      const lvlOk = level() >= h.level;
      let btn;
      if (i === S.housing) btn = '<button class="btn" disabled>Живу тут</button>';
      else if (owned) btn = '<button class="btn" disabled>Пройдено</button>';
      else if (next && lvlOk) btn = priceBtn('house', i, h.price, S.money >= h.price);
      else btn = lockBtn;
      return card({ thumb: sceneThumbSVG(i), title: h.name, btn,
        desc: `${h.desc}<br>Энергия <b>${h.energy}</b> (+${h.regen}/мин) · Подают <b>${fmt(h.pity * 3600)} ₽/ч</b>`,
        extra: !owned && !lvlOk ? reqHTML({ level: h.level }) : '',
        cls: `${i === S.housing ? 'current' : ''} ${!owned && !next ? 'locked' : ''}` });
    }).join('');
  }

  if (tab === 'clothes') {
    html = `<div class="info-card">Приличная одежда открывает работу и девушек, но милостыню в ней почти не подают: в лохмотьях — 100%, в базовой — 40%, в приличной — 10%, в деловой — 0%.</div>` +
      Object.keys(CLOTHES).map((slot) => `<div class="subhead">${SLOT_NAMES[slot]}</div>` + CLOTHES[slot].filter((it) => !it.season || S.owned[slot].includes(it.id)).map((it) => {
      const owned = S.owned[slot].includes(it.id), worn = S.eq[slot] === it.id;
      const bonuses = joinFx([it.tap ? `+${it.tap} за тап` : '', it.energy ? `+${it.energy} энергии` : '', it.crit ? `+${Math.round(it.crit * 100)}% крит` : '', it.mood ? `+${it.mood} радости/мин` : '', it.pity ? `+${Math.round(it.pity * 100)}% милостыни` : '', it.ach ? '🏅 за достижение' : it.pvp ? '🏆 за драки' : it.season ? '🎃 сезонная' : '']) || 'Без бонусов';
      let btn;
      if (worn) btn = '<button class="btn" disabled>Надето</button>';
      else if (owned) btn = `<button class="btn green" data-act="wear" data-id="${slot}:${it.id}">Надеть</button>`;
      else btn = priceBtn('cloth', `${slot}:${it.id}`, it.price, S.money >= it.price);
      return card({ thumb: itemPreviewSVG(slot, it.id), title: it.name, btn, cls: worn ? 'current' : '',
        desc: `Класс: ${TIERS[it.tier]}<br><b>${bonuses}</b>` });
    }).join('')).join('');
  }

  if (tab === 'food') {
    const junk = S.junkLog.filter((t) => Date.now() - t < JUNK_WINDOW).length;
    html = `<div class="info-card ${junk >= JUNK_LIMIT - 1 ? 'warn' : ''}">🍔 Фастфуд за 10 минут: <b>${junk}/${JUNK_LIMIT}</b>.
      ${junk >= JUNK_LIMIT - 1 ? 'Ещё одна порция — и живот может взбунтоваться!' : 'Дешёвая еда сытит мало, а в больших количествах вредит.'}
      <br>🤰 Есть можно и на полный желудок, но за переедание будут последствия.${S.over > 0.5 ? ` <b style="color:var(--red)">Сейчас переел на ${Math.floor(S.over)}</b>` : ''}</div>` +
      FOOD.map((f) => {
        const ok = reqOk(f.req);
        const fx = joinFx([plus(f.food, 'сытости'), plus(f.health, 'здоровья'), plus(f.mood, 'радости'), plus(f.energy, 'энергии'),
          f.buff ? `${EFFECTS[f.buff[0]].emoji} ${EFFECTS[f.buff[0]].name} ${f.buff[1]} мин` : '']);
        const warn = f.junk ? ' · <span style="color:var(--red)">фастфуд</span>' : '';
        return card({ thumb: f.emoji, title: f.name, cls: ok ? '' : 'locked',
          desc: `${f.desc}${warn}<br><b>${fx}</b>`, extra: ok ? '' : reqHTML(f.req),
          btn: ok ? priceBtn('eat', f.id, f.price, S.money >= f.price) : lockBtn });
      }).join('');
  }

  if (tab === 'premium') {
    html = `
      <div class="premium-hero"><i class="ic" data-ic="crown"></i><div><b>VIP «Авторитет»</b>
        <p>Доход ×2, офлайн-копилка 24 ч вместо 8, корона в рейтинге</p></div></div>
      ${card({ thumb: '👑', title: 'Авторитет на 30 дней', desc: isVip() ? `Активен до ${new Date(S.vipUntil).toLocaleDateString('ru-RU')}` : 'Лучшее предложение',
        btn: '<button class="btn primary" data-act="prem" data-id="vip"><i class="ic" data-ic="star"></i>299</button>' })}
      <div class="subhead">Золотые крышки</div>
      ${PREMIUM.map((p) => card({ thumb: p.emoji, title: `${p.name}${p.tag ? ` <span class="rarity rare">${p.tag}</span>` : ''}`, desc: `<b>+${p.caps} крышек</b>`,
        btn: `<button class="btn primary" data-act="prem" data-id="${p.id}"><i class="ic" data-ic="star"></i>${p.stars}</button>` })).join('')}
      <div class="subhead">Потратить крышки</div>
      ${card({ thumb: '🚀', title: 'Доход ×2 на 5 минут', desc: 'Тапы, милостыня и работа', btn: priceBtn('capsUse', 'boost', 0, S.caps >= 5, '<i class="ic" data-ic="cap"></i>5') })}
      ${card({ thumb: '⚡', title: 'Полная энергия', desc: 'Мгновенно', btn: priceBtn('capsUse', 'refill', 0, S.caps >= 3, '<i class="ic" data-ic="cap"></i>3') })}
      ${card({ thumb: '🗑️', title: 'Свежая мусорка', desc: 'Сбросить ожидание', btn: priceBtn('capsUse', 'trash', 0, S.caps >= 1, '<i class="ic" data-ic="cap"></i>1') })}
      ${card({ thumb: '⏩', title: 'Закончить смену/занятие/сон', desc: 'Прямо сейчас', btn: priceBtn('capsUse', 'skip', 0, S.caps >= 2 && !!S.busy, '<i class="ic" data-ic="cap"></i>2') })}
      <p class="test-note">Покупки за ⭐ Telegram Stars скоро появятся.</p>`;
  }
  return html;
}

// ---------- Жизнь: работа, учёба, врачи, спорт, навыки ----------

const busyBtn = '<button class="btn" disabled>Занят</button>';
function timerBtn(until) { return `<button class="btn" disabled>⏳ <span data-until="${until}"></span></button>`; }

function renderLife() {
  const tab = TABS.life;
  if (EXTRA_TABS.life[tab]) return EXTRA_TABS.life[tab]();
  let html = '';

  if (tab === 'work') {
    html = `<div class="info-card">Для работы нужны <b>уровень</b>, <b>образование</b>, одежда и обувь не хуже базовых. Смена тратит энергию и сытость. Сила повышает оплату физической работы (сейчас +${Math.round(S.strength / 2)}%).
      ${S.health < 25 ? '<br><b style="color:var(--red)">Ты слишком болен для работы — подлечись.</b>' : ''}</div>` +
      JOBS.map((j) => {
        const ok = reqOk(j.req);
        const working = S.busy && S.busy.type === 'job' && S.busy.id === j.id;
        let btn;
        if (working) btn = timerBtn(S.busy.end);
        else if (S.busy) btn = busyBtn;
        else btn = `<button class="btn ${ok ? 'primary' : ''}" data-act="job" data-id="${j.id}" ${ok ? '' : 'disabled'}>Работать</button>`;
        return card({ thumb: j.emoji, title: j.name, btn, cls: ok ? '' : 'locked',
          desc: `<b>+${fmt(j.pay)} ₽</b> за смену · ${fmtTime(j.time)}${j.physical ? ' · 💪' : ''}<br>−${j.energy} энергии · −${j.food} сытости${j.health ? ` · ${j.health} здоровья` : ''}`,
          extra: reqHTML(j.req) });
      }).join('');
  }

  if (tab === 'study') {
    const st = S.study;
    let current = '';
    if (st) {
      const e = EDU[st.stage];
      const lessonsLeft = st.done < st.need;
      const lessonTime = Math.round(e.lessonTime * mods().study);
      const inLesson = S.busy && S.busy.type === 'lesson';
      let btn;
      if (inLesson) btn = timerBtn(S.busy.end);
      else if (S.busy) btn = busyBtn;
      else if (lessonsLeft) btn = `<button class="btn primary" data-act="lesson">Занятие</button>`;
      else btn = priceBtn('exam', st.stage, st.retake ? Math.round(e.price * RETAKE_FEE) : 0, !st.retake || S.money >= Math.round(e.price * RETAKE_FEE), st.retake ? `Пересдача ${fmt(e.price * RETAKE_FEE)} ₽` : 'Экзамен');
      current = `<div class="subhead">Сейчас учусь</div>` + card({ thumb: e.emoji, title: e.name, btn, cls: 'current',
        desc: lessonsLeft ? `Занятие — задание на ${Math.round(lessonTime / 2)} сек: ${LESSON_GAMES[st.stage].name} · −${LESSON_COST.energy} энергии · −${LESSON_COST.food} сытости · −${LESSON_COST.mood} радости`
          : `Все занятия пройдены. Экзамен: ${examSize(st.stage)} вопросов, нужно ответить верно на ${examPass(st.stage)}`,
        extra: `<div class="progress"><div style="width:${(st.done / st.need) * 100}%"></div></div><div class="card-desc">Занятия: ${st.done}/${st.need}</div>` });
    }
    html = `<div class="info-card">Образование: <b>${EDU[S.edu].name}</b>. Поступаешь → ходишь на занятия → сдаёшь экзамен. Завалил — доплачиваешь за пересдачу и идёшь на дополнительное занятие. На занятия нужны радость 15+ и здоровье 30+.</div>` +
      current + `<div class="subhead">Ступени</div>` +
      EDU.slice(1).map((e, k) => {
        const i = k + 1;
        const done = S.edu >= i, next = S.edu === i - 1 && !st;
        let btn;
        if (done) btn = '<button class="btn" disabled>🎓 Есть</button>';
        else if (st && st.stage === i) btn = '<button class="btn" disabled>Учусь</button>';
        else if (!next || level() < e.level) btn = lockBtn;
        else btn = priceBtn('enroll', i, e.price, S.money >= e.price);
        return card({ thumb: e.emoji, title: e.name, btn, cls: `${done ? 'current' : ''} ${!done && !next ? 'locked' : ''}`,
          desc: `${e.desc}<br>${e.lessons} занятий-заданий + экзамен`, extra: done ? '' : reqHTML({ level: e.level }) });
      }).join('');
  }

  if (tab === 'health') {
    const effs = activeEffects();
    const hd = healthDelta();
    html = `<div class="stat-grid">
        <div>Здоровье<b>${Math.floor(S.health)}/${maxHealth()}</b></div>
        <div>Изменение<b style="color:${hd >= 0 ? 'var(--green)' : 'var(--red)'}">${hd >= 0 ? '+' : ''}${hd.toFixed(1)}/мин</b></div>
      </div>
      <div class="info-card">Здоровье зависит от жилья (на улице оно тает), сытости, радости и спортивной формы. Болячки ускоряют падение.</div>
      <div class="subhead">Состояние</div>
      ${effs.length ? effs.map((e) => {
        const d = EFFECTS[e.id];
        const cure = d.kind === 'good' ? 'Приятный бонус' : e.diag ? `Лечение: ${cureHint(e.id)}` : 'Сходи к врачу — поставит диагноз';
        return card({ thumb: e.diag ? d.emoji : '❓', title: e.diag ? d.name : d.hidden,
          desc: `${e.diag ? d.desc : 'Непонятно, что это, но приятного мало'}<br><b>${cure}</b>`,
          btn: e.until ? timerBtn(e.until) : '' });
      }).join('') : '<div class="info-card">Ни болячек, ни дебаффов.</div>'}
      <div class="subhead">Врачи</div>
      ${CLINICS.map((c) => card({ thumb: c.emoji, title: c.name, desc: c.desc, btn: priceBtn('clinic', c.id, c.price, S.money >= c.price) })).join('')}
      <div class="subhead">Аптека</div>
      ${MEDS.map((md) => card({ thumb: md.emoji, title: md.name, desc: md.desc, btn: priceBtn('med', md.id, md.price, S.money >= md.price) })).join('')}`;
  }

  if (tab === 'gym') {
    const g = GYMS.find((x) => x.id === S.gymPlace) || GYMS[0];
    const resting = Date.now() - S.lastGym > 10 * 60000 && (S.form > 0 || S.strength > 0);
    html = `<div class="info-card">
        ${meter('🏃 Форма — макс. здоровье и энергия', S.form, 100)}
        ${meter('💪 Сила — драки, физическая работа', S.strength, 100)}
        ${meter('🥵 Усталость мышц — выше 80 риск травмы', S.fatigue, 100, 70)}
        <div style="margin-top:8px">Бонусы: <b>+${Math.floor(S.form)} к макс. здоровью</b>, <b>+${Math.floor(S.form / 2)} к макс. энергии</b>, здоровье +${(S.form * 0.006).toFixed(2)}/мин.
        ${resting ? '<br><b style="color:var(--red)">Давно не тренировался — форма и сила понемногу уходят.</b>' : ''}
        Усталость спадает на 2 в минуту.</div>
      </div>
      <div class="subhead">Где заниматься</div>
      <div class="places">${GYMS.map((x) => `<button class="${x.id === g.id ? 'on' : ''}" data-act="gymPlace" data-id="${x.id}" ${reqOk(x.req) ? '' : 'disabled'}>
        <span>${x.emoji}</span>${x.name}<small>${x.price ? fmt(x.price) + ' ₽' : 'бесплатно'} · до ${x.cap}</small></button>`).join('')}</div>
      ${reqOk(g.req) ? '' : reqHTML(g.req)}
      <div class="info-card">${g.emoji} <b>${g.name}</b>: ${g.desc}. Прирост ×${g.gain}, потолок формы и силы — ${g.cap}.${hasEffect('protein') ? ' 🥛 Протеин: прирост +50%!' : ''}</div>
      ${EXERCISES.map((ex) => {
        const can = !S.busy && !hasEffect('backpain') && S.money >= g.price && S.energy >= ex.energy && S.food >= ex.food;
        const gains = joinFx([ex.form ? `+${(ex.form * g.gain).toFixed(1)} формы` : '', ex.strength ? `+${(ex.strength * g.gain).toFixed(1)} силы` : '', plus(ex.health, '❤️'), plus(ex.mood, '😊')]);
        return card({ thumb: ex.emoji, title: ex.name,
          desc: `${ex.desc}<br><b>${gains}</b><br>−${ex.energy} ⚡ · −${ex.food} 🍞 · усталость ${ex.fatigue > 0 ? '+' : ''}${ex.fatigue}`,
          btn: priceBtn('gym', ex.id, g.price, can, g.price ? `<i class="ic" data-ic="coin"></i>${fmt(g.price)}` : 'Начать') });
      }).join('')}
      ${hasEffect('backpain') ? '<div class="info-card warn">🦴 Сорвана спина — в зал нельзя. Купи мазь в аптеке.</div>' : ''}`;
  }

  if (tab === 'skills') {
    html = `<div class="info-card">Навыки работают временно: дают небольшой бонус на несколько минут, потом им нужна перезарядка. Новые навыки открываются с уровнем.</div>` +
      TRICKS.map((t) => {
        const d = EFFECTS[t.id];
        const price = trickPrice(t);
        const active = activeEffects().find((e) => e.id === t.id);
        const cd = cdLeft(t.id);
        let btn;
        if (level() < t.level) btn = lockBtn;
        else if (active) btn = `<button class="btn green" disabled>✓ <span data-until="${active.until}"></span></button>`;
        else if (cd > 0) btn = timerBtn(S.cd[t.id]);
        else btn = priceBtn('trick', t.id, price, S.money >= price);
        return card({ thumb: d.emoji, title: d.name, cls: level() < t.level ? 'locked' : active ? 'current' : '',
          desc: `<b>${d.desc}</b><br>Действует ${t.minutes} мин · перезарядка ${t.minutes * TRICK_COOLDOWN} мин`,
          extra: level() < t.level ? reqHTML({ level: t.level }) : '', btn });
      }).join('');
  }
  return html;
}

function trickPrice(t) { return Math.round(t.price * (1 + level() * 0.15)); }
function cureHint(id) {
  if (id === 'ratbite') return 'поликлиника';
  const meds = MEDS.filter((m) => (m.cures || []).includes(id)).map((m) => m.name);
  return meds.length ? meds.join(', ') : 'пройдёт со временем';
}
function examSize(stage) { return 2 + stage; }
function examPass(stage) { const n = examSize(stage); return n <= 4 ? n - 1 : Math.ceil(n * 0.75); }

// ---------- Досуг: казино, свидания, отдых ----------

function charm() {
  return tierOf('body') * 0.07 + tierOf('shoes') * 0.04 + tierOf('hat') * 0.03 + S.housing * 0.03 + S.edu * 0.02 + S.strength * 0.001
    + (S.mood - 50) / 400 + (S.health < 30 ? -0.15 : 0) + (hasEffect('lice') ? -0.2 : 0);
}
function meetChance(g) { return clamp(0.55 + charm() - g.picky, 0.05, 0.95); }
function dateChance(g, d) { return clamp(0.4 + d.bonus + charm() - g.picky + (S.girls[g.id]?.rel || 0) / 300, 0.05, 0.95); }

function renderFun() {
  const tab = TABS.fun;
  if (EXTRA_TABS.fun[tab]) return EXTRA_TABS.fun[tab]();
  let html = '';

  if (tab === 'casino') {
    if (level() < CASINO_LEVEL) {
      return `<div class="info-card" style="text-align:center;padding:24px"><div style="font-size:64px">🕴️</div>
        <b style="font-size:17px">Охранник казино: «Не, Валера. С ${CASINO_LEVEL} уровня»</b><br><br>
        Твой уровень: <b>${level()}</b>. Опыт даётся за тапы, мусорку, события, учёбу, работу и спорт.
        <div class="progress" style="margin-top:12px"><div style="width:${(levelInfo().cur / levelInfo().need) * 100}%;background:var(--blue)"></div></div></div>`;
    }
    html = `
      <div class="info-card">Ставки — в рублях. Выигрыш поднимает радость, проигрыш — опускает. Казино всегда в плюсе 😉</div>
      <button class="casino-hero slots" data-act="slots"><span class="e">🎰</span><div><b>Слоты «Три бутылки»</b><p>Три одинаковых — до x15. 7️⃣7️⃣7️⃣ — джекпот x100 (почти невозможно)</p></div></button>
      <button class="casino-hero bj" data-act="bj"><span class="e">🃏</span><div><b>Блекджек</b><p>Набери 21 и обыграй крупье. Блекджек платит 3:2</p></div></button>`;
  }

  if (tab === 'dates') {
    const cd = cdLeft('date');
    html = `<div class="info-card">Шансы зависят от одежды, жилья, образования, силы, радости и здоровья. Неудачное свидание может закончиться… по-разному.
      ${S.girlfriend ? `<br>💍 Твоя девушка: <b>${GIRLS.find((g) => g.id === S.girlfriend).name}</b> (+0.5 радости/мин). Не попадись на изменах!` : ''}
      ${cd > 0 ? `<br>⏳ Следующее свидание через <b><span data-until="${S.cd.date}"></span></b>` : ''}</div>` +
      GIRLS.map((g) => {
        const st = S.girls[g.id] || { met: false, rel: 0 };
        const ok = reqOk(g.req);
        const hearts = '❤️'.repeat(Math.floor(st.rel / 20)) + '🤍'.repeat(5 - Math.floor(st.rel / 20));
        let btn;
        if (!ok) btn = lockBtn;
        else if (S.girlfriend === g.id) btn = `<button class="btn green" data-act="dateMenu" data-id="${g.id}" ${cd > 0 ? 'disabled' : ''}>💍 Свидание</button>`;
        else if (!st.met) btn = `<button class="btn primary" data-act="meet" data-id="${g.id}" ${cd > 0 ? 'disabled' : ''}>Познакомиться</button>`;
        else btn = `<button class="btn primary" data-act="dateMenu" data-id="${g.id}" ${cd > 0 ? 'disabled' : ''}>Свидание</button>`;
        return card({ thumb: g.emoji, title: g.name, btn, cls: ok ? '' : 'locked',
          desc: `${g.desc}${ok && !st.met ? `<br>Шанс познакомиться: <b>${Math.round(meetChance(g) * 100)}%</b>` : ''}`,
          extra: (st.met ? `<div class="hearts">${hearts} ${Math.floor(st.rel)}/100</div>` : '') + (ok ? '' : reqHTML(g.req)) });
      }).join('');
  }

  if (tab === 'rest') {
    html = `<div class="info-card">Радость: <b>${Math.floor(S.mood)}/${maxMood()}</b>. Ниже 20 — депрессия (тапы и работа −30%). Выше 80 — кураж (+15% ко всему).</div>` +
      LEISURE.map((l) => {
        const ok = reqOk(l.req), cd = cdLeft('l_' + l.id);
        const btn = !ok ? lockBtn : cd > 0 ? timerBtn(S.cd['l_' + l.id]) : priceBtn('leisure', l.id, l.price, S.money >= l.price);
        return card({ thumb: l.emoji, title: l.name, btn, cls: ok ? '' : 'locked',
          desc: `${l.desc}<br><b>${joinFx([plus(l.mood, 'радости'), plus(l.health, 'здоровья'), plus(l.energy, 'энергии')])}</b>`,
          extra: ok ? '' : reqHTML(l.req) });
      }).join('');
  }
  return html;
}

// ---------- Задания и рейтинг ----------

function dailyState() {
  const t = today();
  const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const claimedToday = S.daily.last === t;
  let streak = S.daily.streak;
  if (!claimedToday && S.daily.last !== y) streak = 0;
  return { claimedToday, streak, idx: claimedToday ? (streak - 1) % 7 : streak % 7 };
}

function playerName() {
  const u = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
  return (u && (u.first_name || u.username)) || 'Валера';
}

function renderTasks() {
  ensureTasksDay();
  if (EXTRA_TABS.tasks[TABS.tasks]) return EXTRA_TABS.tasks[TABS.tasks]();
  if (TABS.tasks === 'top') {
    const me = [playerName() + ' (ты)', isVip() ? '👑' : '🍾', S.stats.earned, true];
    const rows = [...TOP_NPC.map((r) => [...r, false]), me].sort((a, b) => b[2] - a[2]);
    return rows.map((r, i) => `
      <div class="card ${r[3] ? 'me' : ''}">
        <div class="rank r${i + 1}">${i + 1}</div>
        <div class="top-ava">${r[1]}</div>
        <div class="card-body"><div class="card-title">${r[0]}</div><div class="card-desc">Заработано ${fmt(r[2])} ₽</div></div>
      </div>`).join('') + '<p class="test-note">Пока в рейтинге соперники с района. Общий рейтинг всех игроков появится позже.</p>';
  }
  const d = dailyState();
  const days = DAILY.map((r, i) => {
    const done = d.claimedToday ? i <= d.idx : i < d.idx;
    const isToday = !d.claimedToday && i === d.idx;
    return `<div class="day ${done ? 'done' : ''} ${isToday ? 'today' : ''}">День ${i + 1}<i class="ic" data-ic="${r.caps ? 'cap' : 'coin'}"></i><b>${done ? '✓' : rewardText(r)}</b></div>`;
  }).join('');
  return `<h2 class="screen-title" style="margin-top:0">Ежедневный бонус</h2>
    <div class="daily-row">${days}</div>
    <button class="btn primary wide" data-act="daily" ${d.claimedToday ? 'disabled' : ''}>${d.claimedToday ? 'Приходи завтра' : 'Забрать бонус'}</button>
    <h2 class="screen-title">Задания дня</h2>` +
    TASKS.map((t) => {
      const p = Math.min(t.goal, S.tasks.progress[t.id] || 0);
      const claimed = S.tasks.claimed[t.id], ready = p >= t.goal && !claimed;
      return card({ thumb: claimed ? '✅' : ready ? '🎁' : '📌', title: t.name,
        desc: `${fmt(p)} / ${fmt(t.goal)} · награда <b>${rewardText(t.reward)}</b> + ${XP.task} XP`,
        extra: `<div class="progress"><div style="width:${(p / t.goal) * 100}%"></div></div>`,
        btn: `<button class="btn ${ready ? 'green' : ''}" data-act="task" data-id="${t.id}" ${ready ? '' : 'disabled'}>${claimed ? 'Готово' : 'Забрать'}</button>` });
    }).join('');
}

function hasClaimable() {
  ensureTasksDay();
  return !dailyState().claimedToday || TASKS.some((t) => (S.tasks.progress[t.id] || 0) >= t.goal && !S.tasks.claimed[t.id]);
}

const RENDER = { shop: ['shopList', renderShop], life: ['lifeList', renderLife], fun: ['funList', renderFun], tasks: ['tasksList', renderTasks] };

function renderCurrent(animate = false) {
  const r = RENDER[currentScreen];
  if (!r) return;
  const el = $(r[0]);
  el.classList.toggle('static', !animate);
  el.innerHTML = r[1]();
  fillIcons(el);
  updateTimers();
  document.querySelectorAll(`.seg[data-group="${currentScreen}"] button`).forEach((b) => b.classList.toggle('on', b.dataset.tab === TABS[currentScreen]));
  // Все вкладки видны сразу: до 5 — в один ряд, больше — в два
  document.querySelectorAll('.seg.tiles').forEach((s) => {
    const n = [...s.children].filter((b) => !b.classList.contains('hidden')).length;
    s.style.gridTemplateColumns = `repeat(${n <= 5 ? n : Math.ceil(n / 2)}, 1fr)`;
  });
  if (animate) HOOKS.screen.forEach((f) => f(currentScreen, TABS[currentScreen]));
}

function showScreen(name, tab) {
  currentScreen = name;
  if (tab) TABS[name] = tab;
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 'screen-' + name));
  document.querySelectorAll('#tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.screen === name));
  renderCurrent(true);
  if (name === 'game') HOOKS.screen.forEach((f) => f('game'));
  haptic('light');
  if (tg && tg.BackButton) { if (name === 'game') tg.BackButton.hide(); else tg.BackButton.show(); }
}

function refresh() {
  updateHud();
  if (currentScreen !== 'game') renderCurrent(false);
}

function updateTimers() {
  document.querySelectorAll('[data-until]').forEach((el) => { el.textContent = fmtTime((+el.dataset.until - Date.now()) / 1000); });
}

// =====================================================================
// Действия (все кнопки с data-act)
// =====================================================================

const ACTIONS = {
  close: () => closeModal(),

  // --- главный экран ---
  exchange: (part) => {
    const n = Math.floor(S.bottles * +part);
    if (n < 10) return;
    const m = Math.floor(n * bottleRate() * (1 - EXCHANGE_FEE));
    S.bottles -= n;
    S.stats.sold += n;
    taskProgress('sold', n);
    addMoney(m);
    addXp(n * XP.bottles);
    flyCoins(document.querySelector('[data-act="exchange"]'), $('resMoney'), Math.min(12, 3 + Math.floor(Math.log10(m + 1) * 2)));
    toast(`Обменял ${fmt(n)} бут. → +${fmt(m)} ₽`, 'good');
    haptic('success');
    renderExchange();
  },
  sellCap: () => {
    if (S.caps < 1) return;
    S.caps -= 1;
    addMoney(capRate());
    toast(`Крышка ушла за ${fmt(capRate())} ₽`, 'good');
    haptic('success');
    renderExchange();
  },
  wake: () => {
    if (!S.busy || S.busy.type !== 'sleep') return;
    const p = clamp((Date.now() - S.busy.start) / (S.busy.end - S.busy.start), 0, 1);
    finishSleep(p);
  },

  // --- магазин ---
  house: (id) => {
    const i = +id, h = HOUSING[i];
    if (i !== S.housing + 1 || S.money < h.price || level() < h.level) return;
    S.money -= h.price;
    S.housing = i;
    S.energy = maxEnergy();
    taskProgress('bought');
    addXp(XP.house * i);
    S.housingMode = 'own';
    S.billDue = Date.now() + MONTH_MS;
    track('house');
    sfx('buy');
    haptic('success');
    confetti();
    renderScene();
    openModal(`
      <div class="story-art">${sceneThumbSVG(i)}<div class="valera-mini">${valeraSVG(S.eq, lookState())}</div></div>
      <h3>Новое жильё: ${h.name}!</h3>
      <p>${CHAPTERS[i]}</p>
      <div class="btns"><button class="btn primary wide" data-act="close">Дальше</button></div>
    `, { center: true });
  },
  cloth: (id) => {
    const [slot, itemId] = id.split(':');
    const it = CLOTHES[slot].find((x) => x.id === itemId);
    if (S.money < it.price || S.owned[slot].includes(itemId)) return;
    S.money -= it.price;
    S.owned[slot].push(itemId);
    S.eq[slot] = itemId;
    taskProgress('bought');
    toast(`Куплено: ${it.name}`, 'good');
    confetti(25);
    sfx('buy');
    haptic('success');
    renderScene();
  },
  wear: (id) => {
    const [slot, itemId] = id.split(':');
    S.eq[slot] = itemId;
    haptic('light');
    renderScene();
  },
  eat: (id) => eat(id),
  prem: (id) => {
    // В релизе здесь будет tg.openInvoice(ссылка от бота) и начисление после successful_payment на сервере
    if (id === 'vip') {
      S.vipUntil = Math.max(Date.now(), S.vipUntil) + 30 * 86400000;
      toast('👑 Ты теперь Авторитет! (тест)', 'good');
    } else {
      const p = PREMIUM.find((x) => x.id === id);
      addCaps(p.caps);
      toast(`+${p.caps} крышек (тестовая покупка)`, 'good');
    }
    confetti(50);
    haptic('success');
  },
  capsUse: (id) => {
    const cost = { boost: 5, refill: 3, trash: 1, skip: 2 }[id];
    if (S.caps < cost) return;
    if (id === 'skip' && !S.busy) return;
    S.caps -= cost;
    if (id === 'boost') { S.boostUntil = Math.max(Date.now(), S.boostUntil) + 5 * 60000; toast('🚀 Доход ×2 на 5 минут!', 'good'); }
    if (id === 'refill') { S.energy = maxEnergy(); toast('⚡ Энергия полная!', 'good'); }
    if (id === 'trash') { S.cd.trash = 0; toast('🗑️ Мусорка снова полная', 'good'); }
    if (id === 'skip') { S.busy.end = Date.now(); toast('⏩ Готово!', 'good'); }
    haptic('success');
  },

  // --- жизнь ---
  job: (id) => {
    const j = JOBS.find((x) => x.id === id);
    if (S.busy || !reqOk(j.req)) return;
    if (S.health < 25) { toast('Ты слишком болен для работы', 'bad'); return; }
    if (S.energy < j.energy) { toast(`Нужно ${j.energy} энергии`, 'bad'); return; }
    if (S.food < j.food) { toast('На голодный желудок не работают. Поешь!', 'bad'); return; }
    S.energy -= j.energy;
    feed(-j.food);
    startJobGame(j);
  },
  enroll: (id) => {
    const i = +id, e = EDU[i];
    if (S.study || S.edu !== i - 1 || S.money < e.price || level() < e.level) return;
    S.money -= e.price;
    S.study = { stage: i, done: 0, need: e.lessons, retake: false };
    toast(`${e.emoji} Поступил: ${e.name}!`, 'good');
    confetti(30);
    haptic('success');
  },
  lesson: () => {
    const st = S.study;
    if (!st || S.busy || st.done >= st.need) return;
    if (S.mood < 15) { toast('Нет настроения учиться. Развлекись!', 'bad'); return; }
    if (S.health < 30) { toast('Ты болен — сначала подлечись', 'bad'); return; }
    if (S.energy < LESSON_COST.energy) { toast(`Нужно ${LESSON_COST.energy} энергии`, 'bad'); return; }
    if (S.food < LESSON_COST.food) { toast('Голодный студент — плохой студент. Поешь!', 'bad'); return; }
    S.energy -= LESSON_COST.energy;
    feed(-LESSON_COST.food);
    addMood(-LESSON_COST.mood);
    startLessonGame(st.stage);
  },
  exam: () => startExam(),
  quizAns: (i) => answerQuiz(+i),
  trick: (id) => {
    const t = TRICKS.find((x) => x.id === id);
    const price = trickPrice(t);
    if (level() < t.level || S.money < price || cdLeft(id) > 0 || hasEffect(id)) return;
    S.money -= price;
    addEffect(id, t.minutes);
    setCd(id, t.minutes * TRICK_COOLDOWN * 60);
    toast(`${EFFECTS[id].emoji} ${EFFECTS[id].name} на ${t.minutes} мин`, 'good');
    haptic('success');
  },
  med: (id) => useMed(id),
  clinic: (id) => visitClinic(id),
  gymPlace: (id) => { S.gymPlace = id; haptic('light'); },
  gym: (id) => workout(id),

  // --- досуг ---
  leisure: (id) => {
    const l = LEISURE.find((x) => x.id === id);
    if (!reqOk(l.req) || S.money < l.price || cdLeft('l_' + id) > 0) return;
    S.money -= l.price;
    addMood(l.mood || 0);
    if (l.health) { if (l.health > 0) heal(l.health); else hurt(-l.health); }
    if (l.energy) S.energy = Math.max(0, S.energy + l.energy);
    setCd('l_' + id, l.cd);
    let msg = `${l.emoji} Радость +${l.mood}`;
    for (const [eid, p] of Object.entries(l.risk || {})) if (Math.random() < p) { addEffect(eid, 4); msg += ` · ${EFFECTS[eid].emoji} ${EFFECTS[eid].name}`; }
    toast(msg, 'good');
    haptic('success');
  },
  meet: (id) => meetGirl(id),
  dateMenu: (id) => openDateMenu(id),
  date: (id) => goDate(id),
  slots: () => openSlots(),
  spin: () => spin(),
  bj: () => openBlackjack(),
  bjDeal: () => bjDeal(),
  bjHit: () => bjHit(),
  bjStand: () => bjStand(),
  bjDouble: () => bjDouble(),
  bet: (v) => {
    S.bet = +v;
    document.querySelectorAll('.bets button').forEach((b) => b.classList.toggle('on', +b.dataset.id === S.bet));
    haptic('light');
  },

  // --- задания ---
  daily: () => {
    const d = dailyState();
    if (d.claimedToday) return;
    const r = DAILY[d.idx];
    giveReward(r);
    addXp(XP.daily);
    S.daily = { streak: d.streak + 1, last: today() };
    haptic('success');
    confetti(40);
    toast(`Бонус дня: +${rewardText(r)}`, 'good');
  },
  task: (id, btn) => {
    const t = TASKS.find((x) => x.id === id);
    if ((S.tasks.progress[id] || 0) < t.goal || S.tasks.claimed[id]) return;
    S.tasks.claimed[id] = true;
    giveReward(t.reward);
    addXp(XP.task);
    flyCoins(btn, t.reward.caps ? $('resCaps') : $('resMoney'), 6, t.reward.caps ? 'cap' : 'coin');
    haptic('success');
  },

  // --- профиль ---
  story: () => showStory(0),
  reset: () => {
    const doReset = () => {
      S = freshState(); save();
      SAVE_LOCK = true;
      // Стираем облачную копию и перезаписываем серверную, иначе после перезапуска старый прогресс «вернётся»
      const wipeCloud = () => {
        if (cloudOk()) tg.CloudStorage.removeItems([`${SAVE_KEY}_meta`, SAVE_KEY], () => location.reload());
        else location.reload();
      };
      if (serverOk()) serverCall('put', { data: JSON.stringify(S), savedAt: S.savedAt, base: 0, force: true }).catch(() => {}).finally(wipeCloud);
      else wipeCloud();
    };
    if (tg && tg.initData && tg.showConfirm) tg.showConfirm('Точно начать заново? Весь прогресс пропадёт.', (ok) => ok && doReset());
    else if (confirm('Точно начать заново?')) doReset();
  },
  effect: (id) => {
    const e = activeEffects().find((x) => x.id === id);
    if (!e) return;
    toast(e.diag ? `${EFFECTS[id].name}: ${EFFECTS[id].desc}` : `${EFFECTS[id].hidden} Сходи к врачу`);
  },
};

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const fn = ACTIONS[b.dataset.act];
  if (!fn) return;
  if (!b.dataset.silent) sfx('click');
  fn(b.dataset.id, b);
  clampStats();
  if (!modalOpen() || b.dataset.act === 'close') refresh();
  else updateHud();
  save();
});

// =====================================================================
// Еда, здоровье, спортзал
// =====================================================================

function eat(id) {
  const f = FOOD.find((x) => x.id === id);
  if (!reqOk(f.req) || S.money < f.price) return;
  if (S.food >= maxFood() - 2 && !f.energy) { toast('Валера уже объелся', 'bad'); return; }
  S.money -= f.price;
  feed(f.food);
  if (f.health) { if (f.health > 0) heal(f.health); else hurt(-f.health); }
  addMood(f.mood || 0);
  S.energy += f.energy || 0;
  taskProgress('bought');
  let msg = `${f.emoji} +${f.food} сытости${f.energy ? `, +${f.energy} энергии` : ''}`, kind = 'good';

  if (f.junk) {
    const now = Date.now();
    S.junkLog = S.junkLog.filter((t) => now - t < JUNK_WINDOW);
    S.junkLog.push(now);
    if (S.junkLog.length >= JUNK_LIMIT && Math.random() < 0.6) {
      const d = pick(['heartburn', 'poison', 'bloat']);
      addEffect(d, 4);
      msg = `Перебор с фастфудом: ${EFFECTS[d].emoji} ${EFFECTS[d].name}!`;
      kind = 'bad';
    }
  }
  for (const [eid, p] of Object.entries(f.risk || {})) {
    if (Math.random() < p) { addEffect(eid, 4); msg = `${f.emoji} Ой… ${EFFECTS[eid].emoji} ${EFFECTS[eid].name}!`; kind = 'bad'; }
  }
  if (f.buff) { addEffect(f.buff[0], f.buff[1]); msg += ` · ${EFFECTS[f.buff[0]].emoji} ${EFFECTS[f.buff[0]].name}`; }
  toast(msg, kind);
  sfx('eat');
  haptic(kind === 'bad' ? 'error' : 'success');
}

function useMed(id) {
  const md = MEDS.find((x) => x.id === id);
  if (S.money < md.price) return;
  const targets = activeEffects().filter((e) => (md.cures || []).includes(e.id));
  if (!targets.length && !md.health) { toast('Тебе это сейчас не нужно', 'bad'); return; }
  if (md.health && !targets.length && S.health >= maxHealth()) { toast('Ты и так здоров', 'bad'); return; }
  S.money -= md.price;
  if (md.health) heal(md.health);
  const undiag = targets.filter((e) => !e.diag);
  const cured = targets.filter((e) => e.diag);
  S.effects = S.effects.filter((e) => !cured.includes(e));
  if (undiag.length && !cured.length) {
    toast('Без диагноза таблетки не помогли. Сходи к врачу!', 'bad');
    haptic('error');
    return;
  }
  toast(cured.length ? `${md.emoji} Вылечено: ${cured.map((e) => EFFECTS[e.id].name).join(', ')}` : `${md.emoji} +${md.health} здоровья`, 'good');
  haptic('success');
}

function visitClinic(id) {
  const c = CLINICS.find((x) => x.id === id);
  if (S.money < c.price) return;
  S.money -= c.price;
  const before = activeEffects().filter((e) => EFFECTS[e.id].kind !== 'good');
  let text;
  if (id === 'private') {
    S.effects = S.effects.filter((e) => EFFECTS[e.id].kind === 'good');
    S.health = maxHealth();
    text = before.length ? `Вылечили: ${before.map((e) => EFFECTS[e.id].name).join(', ')}. Здоровье на максимуме!` : 'Ничего не нашли, но взяли деньги и поставили капельницу. Здоровье на максимуме!';
  } else {
    const found = before.filter((e) => !e.diag);
    found.forEach((e) => { e.diag = true; });
    const healed = before.filter((e) => e.id === 'ratbite');
    S.effects = S.effects.filter((e) => e.id !== 'ratbite');
    heal(10);
    const lines = [];
    if (found.length) lines.push(`Диагноз: ${found.map((e) => `${EFFECTS[e.id].emoji} ${EFFECTS[e.id].name}`).join(', ')}`);
    if (healed.length) lines.push('Поставили укол от укуса крысы');
    const needMeds = activeEffects().filter((e) => EFFECTS[e.id].kind !== 'good' && cureHint(e.id) !== 'пройдёт со временем');
    if (needMeds.length) lines.push(`Выписали: ${[...new Set(needMeds.map((e) => cureHint(e.id)))].join(', ')} — купи в аптеке`);
    if (!lines.length) lines.push('Врач сказал «Жить будете» и выгнал');
    text = `Отсидел очередь 3 часа. ${lines.join('. ')}. +10 здоровья`;
  }
  resultModal({ emoji: c.emoji, title: c.name, text, rays: null });
  haptic('success');
}

function workout(exId) {
  const g = GYMS.find((x) => x.id === S.gymPlace) || GYMS[0];
  const ex = EXERCISES.find((x) => x.id === exId);
  if (!reqOk(g.req) || S.busy || hasEffect('backpain')) return;
  if (S.money < g.price) return;
  if (S.energy < ex.energy) { toast(`Нужно ${ex.energy} энергии`, 'bad'); return; }
  if (S.food < ex.food) { toast('На пустой желудок не тренируются', 'bad'); return; }
  S.money -= g.price;
  S.energy -= ex.energy;
  feed(-ex.food);
  S.lastGym = Date.now();
  taskProgress('gym');
  addXp(XP.gym);

  const after = S.fatigue + ex.fatigue;
  if (ex.fatigue > 0 && after > 80 && Math.random() < (after - 70) / 40) {
    S.fatigue = Math.min(100, after);
    addEffect('backpain', 6);
    hurt(15);
    resultModal({ emoji: '🦴', rays: 'bad', title: 'Перестарался!', text: 'Мышцы не выдержали, хрустнуло в спине. −15 здоровья и сорванная спина на 6 минут. Мазь «Звёздочка» в аптеке поможет. В следующий раз делай растяжку и отдыхай!' });
    haptic('error');
    return;
  }
  const k = g.gain * mods().gain;
  const gained = [];
  if (ex.form) {
    if (S.form < g.cap) { const v = Math.min(g.cap - S.form, ex.form * k); S.form += v; gained.push(`+${v.toFixed(1)} формы`); }
    else gained.push(`форма упёрлась в потолок зала (${g.cap})`);
  }
  if (ex.strength) {
    if (S.strength < g.cap) { const v = Math.min(g.cap - S.strength, ex.strength * k); S.strength += v; gained.push(`+${v.toFixed(1)} силы`); }
    else gained.push(`сила упёрлась в потолок зала (${g.cap})`);
  }
  S.fatigue = clamp(after, 0, 100);
  heal(ex.health);
  addMood(ex.mood);
  if (ex.id !== 'stretch') addEffect('pumped', 3);
  toast(`${ex.emoji} ${ex.name}: ${gained.join(', ')}${S.fatigue > 70 ? ' · 🥵 Мышцы забиты!' : ''}`, S.fatigue > 70 ? 'bad' : 'good');
  sfx('gym');
  haptic('success');
}

function hospital() {
  const lost = Math.floor(S.money * 0.25);
  S.money -= lost;
  S.health = 40;
  S.mood = Math.max(S.mood, 20);
  S.effects = S.effects.filter((e) => EFFECTS[e.id].kind === 'good');
  S.busy = null;
  resultModal({ emoji: '🚑', rays: 'bad', title: 'Валера потерял сознание', text: `Скорая увезла в больницу. Заодно вылечили все болячки. Лечение стоило ${fmt(lost)} ₽. Следи за здоровьем!`, btn: 'Выписаться' });
  haptic('error');
  save();
}

// =====================================================================
// Работа, занятия, экзамены
// =====================================================================

function checkBusy() {
  if (!S.busy || Date.now() < S.busy.end) return;
  const b = S.busy;
  if (b.type === 'sleep') { finishSleep(1); save(); refresh(); return; }
  S.busy = null;
  if (b.type === 'job') {
    const j = JOBS.find((x) => x.id === b.id);
    const pay = Math.round(j.pay * mods().work * (j.physical ? 1 + S.strength / 200 : 1));
    addMoney(pay);
    addMood(j.mood);
    if (j.health) hurt(-j.health);
    S.stats.shifts++;
    addXp(8 + JOBS.indexOf(j) * 6);
    flyCoins($('scene'), $('resMoney'), 10);
    toast(`${j.emoji} Смена окончена: +${fmt(pay)} ₽`, 'good');
    haptic('success');
  } else if (b.type === 'lesson') {
    if (S.study) S.study.done++;
    addXp(XP.lesson);
    const left = S.study ? S.study.need - S.study.done : 0;
    toast(left > 0 ? `📖 Занятие окончено. Осталось ${left}` : '📝 Все занятия пройдены — можно сдавать экзамен!', 'good');
    haptic('success');
  }
  save();
  refresh();
}

let QZ = null;

function startExam() {
  const st = S.study;
  if (!st || st.done < st.need || S.busy) return;
  const e = EDU[st.stage];
  if (st.retake) {
    const fee = Math.round(e.price * RETAKE_FEE);
    if (S.money < fee) return;
    S.money -= fee;
  }
  const n = examSize(st.stage);
  QZ = { qs: shuffle(QUIZ).slice(0, n).map(([q, opts]) => ({ q, right: opts[0], opts: shuffle(opts) })), i: 0, results: [], locked: false };
  openModal(`<h3>📝 Экзамен: ${e.name}</h3><div id="quizBody"></div>`, { center: true, locked: true });
  renderQuiz();
}

function renderQuiz() {
  const body = $('quizBody');
  if (!body || !QZ) return;
  const q = QZ.qs[QZ.i];
  body.innerHTML = `
    <div class="quiz-progress">${QZ.qs.map((_, k) => `<i class="${k < QZ.results.length ? (QZ.results[k] ? 'ok' : 'no') : k === QZ.i ? 'cur' : ''}"></i>`).join('')}</div>
    <p>Вопрос ${QZ.i + 1} из ${QZ.qs.length}. Нужно ${examPass(S.study.stage)} верных.</p>
    <div class="quiz-q">${q.q}</div>
    <div class="quiz-opts">${q.opts.map((o, k) => `<button class="btn" data-act="quizAns" data-id="${k}">${o}</button>`).join('')}</div>`;
}

function answerQuiz(k) {
  if (!QZ || QZ.locked) return;
  QZ.locked = true;
  const q = QZ.qs[QZ.i];
  const ok = q.opts[k] === q.right;
  QZ.results.push(ok);
  document.querySelectorAll('.quiz-opts .btn').forEach((b, idx) => {
    if (q.opts[idx] === q.right) b.classList.add('right');
    else if (idx === k) b.classList.add('wrong');
  });
  haptic(ok ? 'success' : 'error');
  setTimeout(() => {
    if (!QZ) return;
    QZ.locked = false;
    QZ.i++;
    if (QZ.i < QZ.qs.length) { renderQuiz(); return; }
    finishExam();
  }, 900);
}

function finishExam() {
  const st = S.study;
  const right = QZ.results.filter(Boolean).length;
  const need = examPass(st.stage);
  const e = EDU[st.stage];
  QZ = null;
  if (right >= need) {
    S.edu = st.stage;
    S.study = null;
    addXp(XP.exam * e.lessons / 3);
    addMood(15);
    confetti(80);
    resultModal({ emoji: '🎓', title: `Диплом: ${e.name}!`, text: `Верных ответов: ${right} из ${examSize(st.stage)}. Новые работы и знакомства теперь доступны.`, btn: 'Ура!' });
    haptic('success');
  } else {
    st.retake = true;
    st.need += 1;
    addMood(-10);
    resultModal({ emoji: '📉', rays: 'bad', title: 'Экзамен завален', text: `Верных ответов: ${right}, а нужно ${need}. Придётся сходить на дополнительное занятие и заплатить за пересдачу ${fmt(e.price * RETAKE_FEE)} ₽. Радость −10`, btn: 'Эх' });
    haptic('error');
  }
  save();
}

// =====================================================================
// Свидания
// =====================================================================

function girlState(id) { return S.girls[id] || (S.girls[id] = { met: false, rel: 0 }); }

function meetGirl(id) {
  const g = GIRLS.find((x) => x.id === id);
  if (!reqOk(g.req) || cdLeft('date') > 0) return;
  setCd('date', 20);
  addXp(XP.meet);
  if (Math.random() < meetChance(g)) {
    girlState(id).met = true;
    addMood(8);
    resultModal({ emoji: g.emoji, rays: '', title: `${g.name}: «Ну привет»`, text: 'Она дала номер телефона! Теперь можно звать на свидание.', btn: 'Огонь!' });
    haptic('success');
  } else {
    addMood(-6);
    resultModal({ emoji: '🙅‍♀️', rays: 'bad', title: 'Отшила', text: `${g.name} посмотрела на твою ${TIERS[tierOf('body')]} одежду и ушла. Радость −6`, btn: 'Эх' });
    haptic('error');
  }
}

function openDateMenu(id) {
  const g = GIRLS.find((x) => x.id === id);
  openModal(`
    <div class="big-art" style="height:100px"><div class="big-emoji" style="line-height:100px">${g.emoji}</div></div>
    <h3>Куда позовёшь ${g.name.split(' ').pop()}?</h3>
    <p>Свидание тратит 15 энергии. Чем дороже, тем выше шанс.</p>
    <div class="list">${DATES.map((d) => card({ thumb: d.emoji, title: d.name,
      desc: `Шанс успеха: <b>${Math.round(dateChance(g, d) * 100)}%</b> · +${d.rel} ❤️`,
      btn: priceBtn('date', `${id}:${d.id}`, d.price, S.money >= d.price && S.energy >= 15) })).join('')}</div>
  `);
}

function goDate(arg) {
  const [gid, did] = arg.split(':');
  const g = GIRLS.find((x) => x.id === gid), d = DATES.find((x) => x.id === did);
  if (S.money < d.price || S.energy < 15 || cdLeft('date') > 0) return;
  S.money -= d.price;
  S.energy -= 15;
  setCd('date', DATE_CD);
  addXp(XP.date);
  const st = girlState(gid);

  // Измена девушке может вскрыться
  if (S.girlfriend && S.girlfriend !== gid && Math.random() < 0.3) {
    const gf = GIRLS.find((x) => x.id === S.girlfriend);
    girlState(S.girlfriend).rel = 30;
    S.girlfriend = null;
    addEffect('heartbreak', 5);
    addMood(-20);
    resultModal({ emoji: '😡', rays: 'bad', title: 'Спалился!', text: `${gf.name} увидела тебя с ${g.name.split(' ').pop()}. Вы расстались. 💔 Разбитое сердце`, btn: 'Ой…' });
    haptic('error');
    return;
  }

  if (Math.random() < dateChance(g, d)) {
    st.rel = Math.min(100, st.rel + d.rel * (1 + Math.max(0, charm())));
    addMood(15);
    addEffect('inlove', 3);
    let text = `Отлично провели время! ❤️ ${Math.floor(st.rel)}/100. Радость +15`;
    if (Math.random() < g.std * 0.25) { addEffect('chlamydia'); text += '. Правда, через пару дней что-то зачесалось…'; }
    if (st.rel >= 100 && S.girlfriend !== gid) {
      S.girlfriend = gid;
      confetti(80);
      text = 'Она согласилась быть твоей девушкой! 💍 Теперь радость растёт сама (+0.5/мин).';
    }
    resultModal({ emoji: '💘', title: `Свидание: ${d.name}`, text, btn: 'Счастье!' });
    haptic('success');
    return;
  }

  // Неудача — случайный «прикол»
  let text, emoji;
  const r = Math.random();
  if (r < g.std) {
    addEffect('chlamydia');
    emoji = '🦠'; text = 'Свидание было… бурным. Через день что-то зачесалось. Может, стоит сходить к врачу?';
  } else if (r < g.std + 0.15) {
    addEffect('lice');
    emoji = '🪳'; text = 'Она пригласила к себе на старый диван. Утром голова чешется — 🪳 вши!';
  } else if (r < g.std + 0.4) {
    addEffect('heartbreak', 5);
    addMood(-15);
    emoji = '💔'; text = 'Она сказала «давай останемся друзьями». Разбитое сердце на 5 минут';
  } else if (r < g.std + 0.6) {
    const lost = takeMoney(0.15, 2000);
    emoji = '👛'; text = `Пока ты отошёл, она исчезла вместе с ${fmt(lost)} ₽ из кошелька`;
  } else {
    addMood(-10);
    emoji = '🦊'; text = 'Весь вечер она переписывалась со Шнырём, а потом ушла к нему. Радость −10';
  }
  st.rel = Math.max(0, st.rel - 5);
  resultModal({ emoji, rays: 'bad', title: 'Свидание не задалось', text, btn: 'Бывает' });
  haptic('error');
}

// =====================================================================
// Казино: слоты
// =====================================================================

function betPicker() {
  return `<div class="bets">${BETS.map((b) => `<button data-act="bet" data-id="${b}" class="${b === S.bet ? 'on' : ''}" ${S.money < b ? 'disabled' : ''}>${fmt(b)} ₽</button>`).join('')}</div>`;
}

function pickSym() {
  const total = SLOT_SYMS.reduce((a, s) => a + s[1], 0);
  let r = Math.random() * total;
  return SLOT_SYMS.find((s) => (r -= s[1]) < 0) || SLOT_SYMS[0];
}

let spinning = false;

function openSlots() {
  if (level() < CASINO_LEVEL) return;
  openModal(`
    <h3>🎰 Три бутылки</h3>
    <div class="reels" id="reels">${[0, 1, 2].map((i) => `<div class="reel"><div class="strip" id="strip${i}"><div>${SLOT_SYMS[i][0]}</div></div></div>`).join('')}</div>
    <div class="bj-msg" id="slotMsg">Делай ставку</div>
    ${betPicker()}
    <div class="btns"><button class="btn primary wide" data-act="spin" id="spinBtn">Крутить</button></div>
    <div class="paytable">${SLOT_SYMS.map((s) => `${s[0]}${s[0]}${s[0]} x${s[2]}`).join(' · ')}<br>Две одинаковых — x${SLOT_PAIR}</div>
  `, { center: true });
}

function spin() {
  if (spinning) return;
  const bet = S.bet;
  if (S.money < bet) { toast('Не хватает денег на ставку', 'bad'); return; }
  S.money -= bet;
  spinning = true;
  $('spinBtn').disabled = true;
  $('slotMsg').textContent = 'Крутим…';
  $('slotMsg').className = 'bj-msg';
  $('reels').classList.remove('win');
  sfx('spin');
  track('casino');
  const res = [pickSym(), pickSym(), pickSym()];
  const H = 80;
  res.forEach((sym, i) => {
    const strip = $('strip' + i);
    const n = 18 + i * 6;
    const syms = Array.from({ length: n - 1 }, () => pickSym()[0]);
    strip.innerHTML = [strip.lastElementChild ? strip.lastElementChild.textContent : '🍾', ...syms.slice(1), sym[0]].map((s) => `<div>${s}</div>`).join('');
    strip.style.transition = 'none';
    strip.style.transform = 'translateY(0)';
    void strip.offsetHeight;
    strip.style.transition = `transform ${1 + i * 0.45}s cubic-bezier(.15,.85,.25,1)`;
    strip.style.transform = `translateY(-${(strip.children.length - 1) * H}px)`;
    setTimeout(() => { haptic('light'); sfx('reelStop'); }, (1 + i * 0.45) * 1000);
  });
  setTimeout(() => {
    spinning = false;
    if (!$('slotMsg')) return;
    const [a, b, c] = res.map((s) => s[0]);
    let win = 0, text;
    if (a === b && b === c) {
      win = bet * res[0][2];
      text = `${a}${a}${a} — ВЫИГРЫШ x${res[0][2]}! +${fmt(win)} ₽`;
      if (a === '🐀' && Math.random() < 0.3) { addEffect('ratbite'); text += ' …но из автомата выскочила крыса 🐀'; }
    } else if (a === b || b === c || a === c) {
      win = Math.floor(bet * SLOT_PAIR);
      text = `Пара! +${fmt(win)} ₽`;
    } else {
      text = `Мимо. −${fmt(bet)} ₽`;
    }
    if (win) addMoney(win);
    addMood(win > bet ? Math.min(20, 3 + Math.floor(win / bet)) : win ? 0 : -3);
    $('slotMsg').textContent = text;
    $('slotMsg').className = 'bj-msg ' + (win > bet ? 'win' : win ? '' : 'lose');
    if (a === '7️⃣' && a === b && b === c) { track('jackpot'); sfx('jackpot'); }
    else if (win > bet) sfx('win'); else if (!win) sfx('lose');
    if (win >= bet * 3) { $('reels').classList.add('win'); confetti(50); haptic('success'); } else if (!win) haptic('error');
    $('spinBtn').disabled = false;
    document.querySelector('.bets').outerHTML = betPicker();
    updateHud();
    save();
  }, (1 + 2 * 0.45) * 1000 + 100);
}

// =====================================================================
// Казино: блекджек (карты раздаются из шуза, закрытая карта переворачивается)
// =====================================================================

let BJ = null;
let bjSeq = 0;

function newDeck() {
  const deck = [];
  for (const s of ['♠', '♥', '♦', '♣']) for (const r of ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']) deck.push({ r, s });
  return shuffle(deck);
}
function handValue(h) {
  let v = 0, aces = 0;
  for (const c of h) { if (c.r === 'A') { aces++; v += 11; } else if ('JQK'.includes(c.r)) v += 10; else v += +c.r; }
  while (v > 21 && aces) { v -= 10; aces--; }
  return v;
}

function openBlackjack() {
  if (level() < CASINO_LEVEL) return;
  openModal(`
    <h3>🃏 Блекджек</h3>
    <div class="felt">
      <div class="shoe" id="bjShoe"></div>
      <div class="felt-title">BLACKJACK PAYS 3 TO 2</div>
      <div class="hand-label">Крупье <b class="hv" id="bjDv">–</b></div>
      <div class="hand" id="bjDealer"></div>
      <div class="bj-mid"><div class="bet-chip hidden" id="bjChip"></div><div class="bj-banner" id="bjBanner"></div></div>
      <div class="hand" id="bjPlayer"></div>
      <div class="hand-label">Ты <b class="hv" id="bjPv">–</b></div>
    </div>
    <div id="bjControls"></div>
  `, { center: true });
  bjControls('bet');
}

function bjControls(mode) {
  const el = $('bjControls');
  if (!el) return;
  if (mode === 'bet') {
    el.innerHTML = `${betPicker()}<div class="btns"><button class="btn primary wide" data-act="bjDeal">${BJ ? 'Новая раздача' : 'Раздать'}</button></div>`;
  } else {
    const play = mode === 'play';
    const canDouble = play && BJ.p.length === 2 && S.money >= BJ.bet;
    el.innerHTML = `<div class="row-btns">
      <button class="btn primary" data-act="bjHit" ${play ? '' : 'disabled'}>Ещё</button>
      <button class="btn green" data-act="bjStand" ${play ? '' : 'disabled'}>Хватит</button>
      <button class="btn blue" data-act="bjDouble" ${canDouble ? '' : 'disabled'}>Удвоить</button></div>`;
  }
}

function bjAlive(id) { return BJ && BJ.id === id && $('bjControls'); }

function cardEl(c, hidden) {
  const d = document.createElement('div');
  d.className = 'pcard' + (hidden ? ' facedown' : '');
  d.innerHTML = `<div class="inner"><div class="face front ${'♥♦'.includes(c.s) ? 'red' : ''}">
    <span class="tl">${c.r}<i>${c.s}</i></span><span class="mid">${c.s}</span><span class="br">${c.r}<i>${c.s}</i></span></div>
    <div class="face back"></div></div>`;
  return d;
}

function bjAdd(who, hidden = false) {
  const c = BJ.deck.pop();
  BJ[who].push(c);
  const hand = $(who === 'p' ? 'bjPlayer' : 'bjDealer');
  const el = cardEl(c, hidden);
  hand.appendChild(el);
  const shoe = $('bjShoe').getBoundingClientRect(), r = el.getBoundingClientRect();
  el.animate([
    { transform: `translate(${shoe.left - r.left}px, ${shoe.top - r.top}px) rotate(-25deg) scale(.6)`, opacity: 0.4 },
    { transform: 'translate(0, 0) rotate(0) scale(1)', opacity: 1 },
  ], { duration: 450, easing: 'cubic-bezier(.2,.85,.25,1)' });
  if (hidden) BJ.holeEl = el;
  sfx('card');
  haptic('light');
  bjValues();
}

function setHv(id, v) {
  const el = $(id);
  if (!el || el.textContent === String(v)) return;
  el.textContent = v;
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}
function bjValues() {
  setHv('bjPv', handValue(BJ.p));
  const hidden = BJ.holeEl && BJ.holeEl.classList.contains('facedown');
  setHv('bjDv', hidden ? `${handValue(BJ.d.slice(0, 1))} + ?` : handValue(BJ.d));
}

function bjChip(amount) {
  const chip = $('bjChip');
  sfx('chip');
  chip.classList.remove('hidden');
  chip.style.opacity = 1;
  chip.textContent = fmt(amount);
  chip.animate([{ transform: 'translateY(60px) scale(.4)', opacity: 0 }, { transform: 'translateY(0) scale(1)', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,1.4,.4,1)' });
}

async function bjDeal() {
  if (BJ && !BJ.done) return;
  const bet = S.bet;
  if (S.money < bet) { toast('Не хватает денег на ставку', 'bad'); return; }
  S.money -= bet;
  updateHud();
  const id = ++bjSeq;
  BJ = { id, deck: newDeck(), bet, p: [], d: [], done: false, holeEl: null };
  $('bjPlayer').innerHTML = '';
  $('bjDealer').innerHTML = '';
  $('bjBanner').className = 'bj-banner';
  $('bjPv').textContent = '–';
  $('bjDv').textContent = '–';
  bjChip(bet);
  bjControls('wait');
  for (const [who, hidden] of [['p', false], ['d', false], ['p', false], ['d', true]]) {
    await wait(330);
    if (!bjAlive(id)) return;
    bjAdd(who, hidden);
  }
  await wait(450);
  if (!bjAlive(id)) return;
  if (handValue(BJ.p) === 21) {
    await bjReveal();
    if (!bjAlive(id)) return;
    bjSettle(handValue(BJ.d) === 21 ? 'push' : 'bj');
    return;
  }
  bjControls('play');
}

async function bjHit() {
  if (!BJ || BJ.done) return;
  const id = BJ.id;
  bjControls('wait');
  bjAdd('p');
  await wait(480);
  if (!bjAlive(id)) return;
  const v = handValue(BJ.p);
  if (v > 21) { bjSettle('bust'); return; }
  if (v === 21) { bjStand(); return; }
  bjControls('play');
}

async function bjReveal() {
  if (BJ.holeEl && BJ.holeEl.classList.contains('facedown')) {
    BJ.holeEl.classList.remove('facedown');
    sfx('flip');
    haptic('medium');
    await wait(600);
    if (BJ) bjValues();
  }
}

async function bjStand() {
  if (!BJ || BJ.done) return;
  const id = BJ.id;
  bjControls('wait');
  await bjReveal();
  if (!bjAlive(id)) return;
  while (handValue(BJ.d) < 17) {
    await wait(550);
    if (!bjAlive(id)) return;
    bjAdd('d');
  }
  await wait(500);
  if (!bjAlive(id)) return;
  const pv = handValue(BJ.p), dv = handValue(BJ.d);
  bjSettle(dv > 21 || pv > dv ? 'win' : pv === dv ? 'push' : 'lose');
}

async function bjDouble() {
  if (!BJ || BJ.done || BJ.p.length !== 2 || S.money < BJ.bet) return;
  S.money -= BJ.bet;
  BJ.bet *= 2;
  bjChip(BJ.bet);
  updateHud();
  const id = BJ.id;
  bjControls('wait');
  await wait(300);
  if (!bjAlive(id)) return;
  bjAdd('p');
  await wait(550);
  if (!bjAlive(id)) return;
  if (handValue(BJ.p) > 21) { bjSettle('bust'); return; }
  bjStand();
}

function bjSettle(result) {
  if (!BJ) return;
  BJ.done = true;
  const pays = { bj: 2.5, win: 2, push: 1, lose: 0, bust: 0 };
  const texts = { bj: 'БЛЕКДЖЕК!', win: 'Победа!', push: 'Ничья', lose: 'Крупье выиграл', bust: 'Перебор!' };
  const ret = Math.floor(BJ.bet * pays[result]);
  if (ret) addMoney(ret);
  const net = ret - BJ.bet;
  addMood(net > 0 ? Math.min(20, 5 + Math.floor(net / BJ.bet) * 3) : net < 0 ? -4 : 0);
  const banner = $('bjBanner');
  banner.textContent = `${texts[result]} ${net > 0 ? `+${fmt(net)} ₽` : net < 0 ? `−${fmt(-net)} ₽` : ''}`;
  banner.className = 'bj-banner show ' + (net > 0 ? 'win' : net < 0 ? 'lose' : 'push');
  const chip = $('bjChip');
  chip.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: `translateY(${net >= 0 ? 90 : -90}px) scale(.6)`, opacity: 0 }],
    { duration: 600, delay: 500, easing: 'ease-in', fill: 'forwards' });
  if (result === 'bj' || (net > 0 && BJ.bet >= 1000)) confetti(60);
  haptic(net > 0 ? 'success' : net < 0 ? 'error' : 'light');
  sfx(net > 0 ? 'win' : net < 0 ? 'lose' : 'chip');
  track('casino');
  if (net > 0) track('bjWin');
  bjValues();
  bjControls('bet');
  updateHud();
  save();
}

// =====================================================================
// Профиль, интро, офлайн
// =====================================================================

function openProfile() {
  const gf = S.girlfriend ? GIRLS.find((g) => g.id === S.girlfriend) : null;
  const li = levelInfo();
  openModal(`
    <div class="story-art">${sceneThumbSVG(S.housing)}<div class="valera-mini">${valeraSVG(S.eq, lookState())}</div></div>
    <h3>${playerName()} ${isVip() ? '👑' : ''}</h3>
    <p>Уровень ${li.level} · опыт ${Math.floor(li.cur)}/${li.need}</p>
    <div class="stat-grid" style="margin-bottom:12px;text-align:left">
      <div>Жильё<b>${HOUSING[S.housing].name}</b></div>
      <div>Образование<b>${EDU[S.edu].name}</b></div>
      <div>Форма / сила<b>${Math.floor(S.form)} / ${Math.floor(S.strength)}</b></div>
      <div>Девушка<b>${gf ? gf.name : 'нет'}</b></div>
      <div>Заработано<b>${fmt(S.stats.earned)} ₽</b></div>
      <div>Смен отработано<b>${S.stats.shifts}</b></div>
      <div>Шанс плохих событий<b>${Math.round(badChance() * 100)}%</b></div>
      <div>Карма<b>${S.karma}</b></div>
    </div>
    <div class="btns">
      <button class="btn primary wide" data-act="close">Закрыть</button>
      <button class="btn wide" data-act="story">Смотреть интро заново</button>
      <button class="btn wide" data-act="reset" style="color:var(--red)">Сбросить прогресс</button>
    </div>`, { center: true });
}

function showStory(i) {
  const st = STORY[i];
  const back = openModal(`
    <div class="story-art">${sceneThumbSVG(st.scene)}<div class="valera-mini">${valeraSVG(st.eq, { mood: st.mood || 'happy' })}</div></div>
    <div class="story-dots">${STORY.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
    <h3>${st.title}</h3>
    <p>${st.text}</p>
    <div class="btns"><button class="btn primary wide" id="storyNext">${i < STORY.length - 1 ? 'Дальше' : 'Начать игру!'}</button></div>
  `, { center: true, locked: true });
  back.querySelector('#storyNext').onclick = () => {
    haptic('light');
    if (i < STORY.length - 1) showStory(i + 1);
    else { S.storySeen = true; closeModal(); save(); }
  };
}

function applyOffline() {
  const sec = (Date.now() - S.lastSeen) / 1000;
  if (sec < 60) return;
  const capH = isVip() ? OFFLINE_HOURS_VIP : OFFLINE_HOURS;
  const eff = Math.min(sec, capH * 3600);
  const mins = sec / 60;
  S.energy = Math.min(maxEnergy(), S.energy + regenPerMin() * eff / 60);
  feed(-Math.min(40, mins));
  addMood(-Math.min(30, mins / 2));
  S.fatigue = Math.max(0, S.fatigue - mins * 2);
  if (Date.now() - S.lastGym > 10 * 60000) {
    S.form = Math.max(0, S.form - Math.min(10, mins * STAT_DECAY));
    S.strength = Math.max(0, S.strength - Math.min(10, mins * STAT_DECAY));
  }
  // Здоровье офлайн тоже меняется, но не ниже 20 — чтобы не умирать, пока не играешь
  S.health = clamp(S.health + healthDelta() * Math.min(mins, 120), Math.min(S.health, 20), maxHealth());
  const m = Math.floor(pityPerSec() * eff);
  S.lastSeen = Date.now();
  if (m <= 0) return;
  addMoney(m);
  const hours = Math.floor(sec / 3600), minsLeft = Math.floor((sec % 3600) / 60);
  resultModal({
    art: ITEM_ART.coins, title: 'Пока тебя не было…', btn: 'Забрать',
    text: `Добрые люди подали <b style="color:var(--gold)">${fmt(m)} ₽</b><br>Тебя не было ${hours ? hours + ' ч ' : ''}${minsLeft} мин${sec > capH * 3600 ? `<br><small>Копилка вмещает ${capH} ч${isVip() ? '' : ' (VIP — 24 ч)'}</small>` : ''}`,
  });
}

// =====================================================================
// HUD и главный цикл
// =====================================================================

function setBar(id, value, max, lowAt) {
  $(id + 'Fill').style.width = clamp(value / max, 0, 1) * 100 + '%';
  $(id + 'Fill').classList.toggle('low', value < lowAt);
  $(id + 'Text').textContent = `${Math.floor(value)}/${max}`;
}

let lastActivityKey = '';

// Чипы эффектов обновляются точечно (раньше пересоздавались каждую секунду и мерцали)
function renderChips() {
  const box = $('effects');
  const effs = activeEffects();
  const ids = new Set(effs.map((e) => e.id));
  box.querySelectorAll('.chip').forEach((c) => { if (!ids.has(c.dataset.id)) c.remove(); });
  for (const e of effs) {
    const d = EFFECTS[e.id];
    let c = box.querySelector(`.chip[data-id="${e.id}"]`);
    if (!c) {
      c = document.createElement('button');
      c.className = `chip ${d.kind === 'good' ? 'good' : 'bad'}`;
      c.dataset.act = 'effect';
      c.dataset.id = e.id;
      c.innerHTML = '<span></span><b></b>';
      box.appendChild(c);
    }
    const icon = e.diag ? d.emoji : '❓';
    const time = e.until ? fmtTime((e.until - Date.now()) / 1000) : '∞';
    if (c.firstChild.textContent !== icon) c.firstChild.textContent = icon;
    if (c.lastChild.textContent !== time) c.lastChild.textContent = time;
  }
}

// Всплывающие «+5 / −20» возле шкал и счётчиков, чтобы было видно, что изменилось
const shown = {};
const FLOAT_TARGETS = {
  energy: ['energyText', 1.5, '⚡'], food: ['foodText', 1.5, '🍞'], health: ['healthText', 1.5, '❤️'], mood: ['moodText', 1.5, '😊'],
  money: ['resMoney', 2, '₽'], caps: ['resCaps', 1, ''],
};
function statFloats() {
  for (const [key, [target, min, unit]] of Object.entries(FLOAT_TARGETS)) {
    const v = S[key];
    if (shown[key] !== undefined) {
      const d = v - shown[key];
      if (Math.abs(d) >= min) floatAt($(target), `${d > 0 ? '+' : '−'}${fmt(Math.abs(d))}${unit ? ' ' + unit : ''}`, d > 0 ? 'good' : 'bad');
      if (key === 'energy' && v < 1 && shown.energy >= 1) { toast('⚡ Энергия кончилась! Поспи или выпей кофе', 'bad'); bump('energyText'); }
    }
    shown[key] = v;
  }
}
function floatAt(el, text, kind) {
  if (!el || !el.offsetParent) return;
  const r = el.getBoundingClientRect();
  const f = document.createElement('div');
  f.className = 'stat-float ' + kind;
  f.textContent = text;
  f.style.left = (r.left + r.width / 2) + 'px';
  f.style.top = r.top + 'px';
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1300);
}

function updateHud() {
  clampStats();
  $('money').textContent = fmtShort(S.money);
  $('bottles').textContent = fmtShort(S.bottles);
  $('caps').textContent = fmtShort(S.caps);
  const li = levelInfo();
  $('plevel').textContent = `Ур. ${li.level} · ${EDU[S.edu].name}`;
  $('xpFill').style.width = (li.cur / li.need) * 100 + '%';
  $('avatar').classList.toggle('vip', isVip());

  setBar('energy', S.energy, maxEnergy(), maxEnergy() * 0.1);
  setBar('food', S.food, maxFood(), 20);
  setBar('health', S.health, maxHealth(), 30);
  setBar('mood', S.mood, maxMood(), 20);

  const notes = [];
  if (S.food < 20) notes.push('голоден');
  if (S.mood < 20) notes.push('депрессия');
  else if (S.mood >= 80) notes.push('кураж!');
  $('passive').textContent = `Милостыня: ${fmt(pityPerSec() * 3600)} ₽/ч${notes.length ? ' · ' + notes.join(', ') : ''}`;
  $('exchangeInfo').textContent = `${bottleRate().toFixed(2)} ₽`;
  const tLeft = cdLeft('trash');
  $('trashInfo').textContent = tLeft > 0 ? fmtTime(tLeft) : 'готово!';
  $('trashBtn').classList.toggle('primary', tLeft <= 0 && !S.busy);
  $('eatInfo').textContent = S.food < 30 ? 'голоден!' : `${Math.floor(S.food)}/${maxFood()}`;
  $('sleepInfo').textContent = `+${regenPerMin().toFixed(0)}⚡/мин`;
  $('sleepBtn').classList.toggle('primary', S.energy < maxEnergy() * 0.2 && !S.busy);

  const b = $('boostBadge');
  if (isBoost()) { b.classList.remove('hidden'); b.textContent = `x2 ${fmtTime((S.boostUntil - Date.now()) / 1000)}`; }
  else b.classList.add('hidden');

  renderChips();

  const act = $('activity');
  if (S.busy) {
    const t = S.busy.type;
    const info = t === 'job' ? JOBS.find((j) => j.id === S.busy.id) : t === 'lesson' ? EDU[S.busy.id] : { emoji: '💤', name: HOUSING[S.housing].name };
    const title = t === 'job' ? 'На смене' : t === 'lesson' ? 'На занятии' : 'Спит';
    const total = S.busy.end - S.busy.start, left = S.busy.end - Date.now();
    const key = t + S.busy.id + S.busy.start;
    if (key !== lastActivityKey) {
      lastActivityKey = key;
      act.innerHTML = `<div class="big">${info.emoji}</div><b>${title}: ${info.name}</b><small id="actLeft"></small>
        <div class="progress"><div id="actBar"></div></div>${t === 'sleep' ? '<button class="btn" data-act="wake">Проснуться</button>' : ''}`;
    }
    act.classList.remove('hidden');
    $('actLeft').textContent = t === 'sleep' ? `Энергия ${Math.floor(S.busy.from + (maxEnergy() - S.busy.from) * clamp(1 - left / total, 0, 1))}/${maxEnergy()} · ${fmtTime(left / 1000)}` : `Осталось ${fmtTime(left / 1000)}`;
    $('actBar').style.width = clamp(1 - left / total, 0, 1) * 100 + '%';
  } else {
    act.classList.add('hidden');
    lastActivityKey = '';
  }
  $('valera').classList.toggle('busy', !!S.busy);
  $('valera').classList.toggle('tired', S.energy < 1);
  renderScene();

  $('tasksDot').classList.toggle('hidden', !hasClaimable());
  $('lifeDot').classList.toggle('hidden', !activeEffects().some((e) => EFFECTS[e.id].kind === 'disease') && !(S.study && S.study.done >= S.study.need && !S.busy));
  statFloats();
  HOOKS.hud.forEach((f) => f());
}

let lastTick = Date.now();
let accMoney = 0;
let lastSecond = 0;
let zzzTimer = 0;

function tick() {
  const now = Date.now();
  const dt = Math.min(5, (now - lastTick) / 1000);
  lastTick = now;
  const dm = dt / 60;
  const m = mods();
  if (!(S.busy && S.busy.type === 'sleep')) S.energy = Math.min(maxEnergy(), S.energy + regenPerMin() * dm);
  S.food = Math.max(0, S.food - dm);
  S.mood = clamp(S.mood + moodDelta(m) * dm, 0, maxMood());
  S.health = clamp(S.health + healthDelta() * dm, 0, maxHealth());
  S.fatigue = Math.max(0, S.fatigue - 2 * dm);
  if (now - S.lastGym > 10 * 60000) {
    S.form = Math.max(0, S.form - STAT_DECAY * dm);
    S.strength = Math.max(0, S.strength - STAT_DECAY * dm);
  }
  accMoney += pityPerSec() * dt;
  if (accMoney >= 1) {
    const whole = Math.floor(accMoney);
    accMoney -= whole;
    S.money += whole;
    S.stats.earned += whole;
  }
  if (S.health <= 0 && S.storySeen) hospital();
  checkBusy();
  updateHud();
  if (now - lastSecond > 1000) {
    lastSecond = now;
    updateTimers();
    if ($('exBody') && Math.floor(now / 60000) !== Math.floor((now - 1000) / 60000)) renderExchange();
  }
  if (S.busy && S.busy.type === 'sleep' && now - zzzTimer > 900) {
    zzzTimer = now;
    const z = document.createElement('div');
    z.className = 'zzz';
    z.textContent = 'z';
    z.style.left = rand(45, 60) + '%';
    z.style.top = '38%';
    $('fx').appendChild(z);
    setTimeout(() => z.remove(), 2400);
  }
  HOOKS.tick.forEach((f) => f(dt));
  if (pendingLevelUp && !modalOpen()) showLevelUp();
  maybeEvent();
}

// =====================================================================
// Запуск
// =====================================================================

function initTelegram() {
  if (!tg || !tg.initData) return;
  tg.ready();
  tg.expand();
  try {
    if (tg.isVersionAtLeast('6.1')) { tg.setHeaderColor('#1B1714'); tg.setBackgroundColor('#1B1714'); }
    if (tg.isVersionAtLeast('7.7')) tg.disableVerticalSwipes(); // чтобы свайп не сворачивал игру
    if (tg.isVersionAtLeast('7.10')) tg.setBottomBarColor('#2A241F');
    if (tg.isVersionAtLeast('6.2')) tg.enableClosingConfirmation();
  } catch (e) { /* старый клиент */ }
  if (tg.BackButton) tg.BackButton.onClick(() => { if (modalOpen()) closeModal(); else showScreen('game'); });
  const setH = () => document.documentElement.style.setProperty('--tg-viewport-stable-height', tg.viewportStableHeight + 'px');
  tg.onEvent('viewportChanged', setH);
  setH();
}

function init() {
  $('globalDefs').innerHTML = DEFS;
  initTelegram();
  fillIcons();
  const name = playerName();
  $('pname').textContent = name;
  $('avatar').textContent = name[0].toUpperCase();

  $('valera').addEventListener('pointerdown', onTap);
  $('exchangeBtn').onclick = openExchange;
  $('trashBtn').onclick = openTrash;
  $('eatBtn').onclick = () => showScreen('shop', 'food');
  $('sleepBtn').onclick = () => { startSleep(); updateHud(); save(); };
  $('resCaps').onclick = () => openDonate();
  $('profileBtn').onclick = openProfile;
  document.querySelectorAll('.seg button').forEach((b) => {
    b.onclick = () => { TABS[b.closest('.seg').dataset.group] = b.dataset.tab; renderCurrent(true); haptic('light'); };
  });
  document.querySelectorAll('#tabbar button').forEach((b) => { b.onclick = () => showScreen(b.dataset.screen); });
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else { applyOffline(); lastTick = Date.now(); } });
  window.addEventListener('pagehide', save);
  HOOKS.init.forEach((f) => f());

  load(() => {
    HOOKS.load.forEach((f) => f());
    renderScene();
    if (!S.storySeen) showStory(0);
    else applyOffline();
    if (S.stats.taps > 0 && $('tapHint')) $('tapHint').remove();
    updateHud();
    lastTick = Date.now();
    setInterval(tick, 250);
    setInterval(save, 5000);
  });
}
// init() вызывается в boot.js — после загрузки всех модулей
