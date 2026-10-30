// Москвабад как новая глава игры (3.0): свои сцены жилья, животные, еда, одежда, транспорт, бизнесы,
// мини-игры на работе и в учёбе, музыка и звуки. Всё дороже, чем в Засранске: игрок приезжает с деньгами.
// Устроено как city.js: у таблиц меняются названия, картинки и цены, а id и механика остаются прежними.

// =====================================================================
// 1. Переодевание таблиц: названия + цены
// =====================================================================
const MSK_RESKIN = [];
// list — массив или объект таблицы, key — как найти запись, map — что поменять, mult — какие числа умножить
function mskTable(list, key, map, mult = {}) {
  const items = () => (Array.isArray(list) ? list.map((x, i) => [key(x, i), x]) : Object.entries(list));
  const zas = {};
  items().forEach(([k, x]) => {
    const fields = new Set([...Object.keys(map[k] || {}), ...Object.keys(mult)]);
    zas[k] = {};
    fields.forEach((f) => { zas[k][f] = x[f]; });
  });
  MSK_RESKIN.push((msk) => items().forEach(([k, x]) => {
    if (!zas[k]) return;
    Object.assign(x, zas[k]);
    if (!msk) return;
    for (const [f, m] of Object.entries(mult)) if (typeof zas[k][f] === 'number') x[f] = Math.round(zas[k][f] * m);
    Object.assign(x, map[k] || {}); // явная замена главнее множителя (например, своя цена)
  }));
}
const byId = (x) => x.id;
const byIdx = (x, i) => i;

mskTable(FOOD, byId, {
  bread: { name: 'Булка «вчерашняя, −50%»', emoji: '🥐', desc: 'Из модной пекарни, но вчерашняя' },
  doshik: { name: 'Лапша в стакане из автомата', emoji: '🍜', desc: 'Кипяток — отдельно' },
  coffee: { name: 'Раф на кокосовом', emoji: '☕', desc: 'Стоит как обед в Засранске' },
  cheburek: { name: 'Самса у трёх вокзалов', emoji: '🥟', desc: 'Горячая. Слишком горячая' },
  energetik: { name: 'Смузи «Детокс»', emoji: '🥤', desc: 'Зелёное, полезное, страшное' },
  shaurma: { name: 'Шаверма «Премиум»', emoji: '🌯', desc: 'С трюфельным соусом' },
  pelmeni: { name: 'Хинкали в бистро', emoji: '🥟', desc: 'Есть руками, хвостик оставить' },
  stolovka: { name: 'Бизнес-ланч в коворкинге', emoji: '🍲', desc: 'Суп, салат и комбуча' },
  protein: { name: 'Протеиновый батончик', emoji: '🍫', desc: 'Для зала на крыше' },
  lunch: { name: 'Поке-боул', emoji: '🥗', desc: 'Лосось, рис, авокадо' },
  sushi: { name: 'Омакасе-сет', emoji: '🍣', desc: 'Шеф решает за тебя' },
  steak: { name: 'Вагю медиум', emoji: '🥩', desc: 'Японская корова с массажем' },
  chef: { name: 'Ужин на 85-м этаже', emoji: '🍽️', desc: 'Вид дороже еды' },
  caviar: { name: 'Устрицы и шампанское', emoji: '🦪', desc: 'Москвабад, детка' },
}, { price: 2.5 });

mskTable(CLOTHES.hat, byId, {
  shapka: { name: 'Бини с помпоном' }, ushanka: { name: 'Шапка-ушанка из эко-меха' }, kepka: { name: 'Бейсболка оверсайз' }, cilinder: { name: 'Шляпа-федора' },
}, { price: 3 });
mskTable(CLOTHES.body, byId, {
  rvan: { name: 'Потёртое худи' }, telnyashka: { name: 'Свитшот «Москвабад»' }, base: { name: 'Рубашка оверсайз и чиносы' },
  pukhovik: { name: 'Пуховик-кокон' }, malinovy: { name: 'Бархатный блейзер' }, kostum: { name: 'Костюм-тройка «Сити»' },
}, { price: 3 });
mskTable(CLOTHES.shoes, byId, {
  none: { name: 'Босиком по плитке' }, tapki: { name: 'Шлёпанцы с носками' }, base: { name: 'Кеды-слипоны' }, kedy: { name: 'Кроссовки «Аир»' }, boots: { name: 'Лоферы' },
}, { price: 3 });
// Одежда в Москвабаде и выглядит иначе: другие цвета
mskTable(BODIES, (x, k) => k, {
  rvan: { jacket: '#6E7280', shirt: '#B9BDC6' }, pukhovik: { jacket: '#2B2F3A', shirt: '#E9E1D3' }, malinovy: { jacket: '#5B2A86' }, base: { jacket: '#E8E4DA', shirt: '#E8E4DA' },
});

mskTable(TRANSPORT, byIdx, {
  1: { name: 'Самокат-шеринг', desc: 'Взял у метро, бросил у офиса' },
  2: { name: 'Электросамокат «Флеш»', desc: 'Быстрее пробок' },
  3: { name: 'Электровелосипед', desc: 'Курьеры завидуют' },
  4: { name: 'Мопед доставки', desc: 'Термосумка в подарок' },
  5: { name: 'Спортбайк', emoji: '🏍️', desc: 'Громкий, как сосед с перфоратором' },
  6: { name: 'Подержанный седан', desc: 'Пробег скромно молчит' },
  7: { name: 'Электрофургон', desc: 'Для своего маркетплейса' },
  8: { name: 'Электрокар', desc: 'Тихий и модный' },
  9: { name: 'Премиум-кроссовер', desc: 'Парковка — отдельная жизнь' },
  10: { name: 'Суперкар', desc: 'Сто до ста — быстрее, чем согласуют ипотеку' },
  11: { name: 'Лимузин «Кортеж»', desc: 'Жмыхов плачет в сторонке' },
}, { price: 2.5, fuel: 2 });
TRANSPORT.forEach((t, i) => { if (t.garage) mskTable([t.garage], () => 'g', { g: { name: ['Место на паркинге ЖК', 'Бокс в подземке', 'Тёплый паркинг', 'Паркинг с охраной', 'Паркинг с мойкой', 'Личный бокс в башне', 'Ангар бизнес-авиации'][Math.min(6, i - 5)] || 'Паркинг' } }, { price: 2.5 }); });

mskTable(BUSINESSES, byId, {
  stall: { name: 'Постамат приёма бутылок', emoji: '🏧' }, shawarma: { name: 'Шаверма на фудкорте', emoji: '🌯' }, carwash: { name: 'Детейлинг-центр', emoji: '🚿' },
  cafe: { name: 'Кофейня «Раф и Валера»', emoji: '☕' }, shops: { name: 'Сеть дарксторов «Валерыч»', emoji: '🏬' }, club: { name: 'Руфтоп-клуб «Золотая крышка»', emoji: '🪩' },
}, { price: 3, income: 3 });

mskTable(MEDS, byId, {}, { price: 2 });
mskTable(CLINICS, byId, { polyclinic: { name: 'Городская поликлиника' }, private: { name: 'Клиника «Москвабад-Мед»' } }, { price: 2 });
mskTable(GYMS, byId, { bar: { name: 'Воркаут-площадка', desc: 'Во дворе ЖК' }, basement: { name: 'Фитнес у дома', desc: 'Абонемент и шкафчик' }, fitness: { name: 'Клуб с бассейном на крыше', desc: 'Тренер, смузи, вид' } }, { price: 2 });
mskTable(DATES, byId, {
  walk: { name: 'Прогулка по набережной' }, cafe: { name: 'Кофейня' }, cinema: { name: 'IMAX' }, rest: { name: 'Ресторан на крыше' }, yacht: { name: 'Яхта по Москвабад-реке' },
  skate: { name: 'Каток в парке' }, amuse: { name: 'Парк аттракционов' }, picnic: { name: 'Пикник в парке' }, karaoke: { name: 'Караоке-лаунж' },
  museum: { name: 'Музей современного искусства' }, bowling: { name: 'Боулинг-клуб' },
}, { price: 2 });
mskTable(GIFTS, byId, {}, { price: 2 });
mskTable(WEDDINGS, byId, { zags: { name: 'Роспись во Дворце бракосочетания' }, canteen: { name: 'Свадьба в лофте' }, banquet: { name: 'Банкет в башне «Сити»' } }, { price: 3 });
mskTable(TRICKS, byId, {}, { price: 2 });
mskTable(ITEMS, (x, k) => k, {}, { base: 1.6 });

// =====================================================================
// 2. Новые животные Москвабада — своя графика
// =====================================================================
// Та же «профессия» питомца, но новое животное с новой картинкой (имя меняет city.js)
const MSK_PET_ART = { pigeon: 'magpie', rat: 'ferret', dog: 'doberman', hedgehog: 'capybara', parrot: 'macaw', cat: 'sphynx' };
const MSK_PET_NAME = { pigeon: 'Сорока Блестяшка', rat: 'Хорёк Шуршик', dog: 'Доберман Граф', hedgehog: 'Капибара Кап', parrot: 'Ара Рио', cat: 'Сфинкс Рамзес' };
Object.assign(MSK_PETS, Object.fromEntries(Object.entries(MSK_PET_NAME).map(([id, name]) => [id, { ...(MSK_PETS[id] || {}), name }])));
mskTable(PETS, byId, { ...Object.fromEntries(Object.entries(MSK_PET_ART).map(([id, art]) => [id, { art }])), cat: { art: 'sphynx', price: 25000 } }, { price: 3 });

// =====================================================================
// 4. Мини-игры Москвабада: на тех же работах — другие игры, чем в Засранске
// =====================================================================
const MSK_JOB_GAMES = {
  flyers: { engine: gameHide, title: 'Обнимашки в костюме мишки', hint: 'Прохожие выглядывают из-за киосков. Успей обнять, пока не ушли! Полицейского не трогай', spots: ['🚇', '🏬', '☕', '🛒', '🚌', '🏦'], who: '🧑', decoy: ['👮'], hitText: 'Обнял! 🐻', target: 12 },
  loader: { engine: gameRecipe, title: 'Собери заказ маркетплейса', hint: 'Клади товары строго по списку заказа — что подсвечено, то и бери',
    recipes: [['Заказ #1', ['📦', '👟', '📱', '🔌']], ['Заказ #2', ['📦', '🧴', '🧸', '📚']], ['Заказ #3', ['📦', '🎧', '👕', '🔌', '🧴']], ['Заказ #4', ['📦', '📚', '👟']]], target: 8 },
  courier: { engine: gameSteer, title: 'Доставка по Садовому', hint: 'Держи палец слева или справа — рули самокатом. Подбирай посылки 📦, не съезжай с дороги', good: ['📦', '🍕'], target: 60 },
  guard: { engine: gameConveyor, title: 'Досмотр в аэропорту', hint: 'Изымай запрещённое: жидкости 🧴, ножи 🔪, аккумуляторы 🔋, петарды 🧨. Остальное пропускай', bad: ['🧴', '🔪', '🔋', '🧨'], good: ['💻', '👕', '📚', '🧸', '🕶️', '🎧'], badRate: 0.4, target: 14 },
  taxi: { engine: gameLanes, title: 'Пробки на ТТК', hint: 'Тапай слева и справа, меняя ряд. Подбирай пассажиров 🙋, объезжай самокатчиков и камеры', good: ['🙋', '🙋‍♀️', '🧳'], bad: ['🛴', '📸', '🚧', '🚌'], player: '🚖', target: 20 },
  seller: { engine: gameStack, title: 'Выкладка в «Москвабад-Молле»', hint: 'Ставь коробки ровно друг на друга. Ровно — бонус, криво — стопка сужается', btn: '📦 Поставить', items: ['👗', '👟', '👜', '🧢', '🧥', '⌚'], base: '🛒', fail: 'Витрина рухнула!', target: 10 },
  manager: { engine: gameSpot, title: 'Найди нужный гаджет', hint: 'Покупатель хочет 📱. Найди его на витрине среди остальной техники', find: '📱', junk: ['💻', '🖨️', '📺', '🎧', '⌚', '📷', '🖥️', '🎮', '🔌', '🕹️'], target: 10 },
  director: { engine: gameSort, title: 'Утренние согласования', hint: 'Хорошие идеи — «Согласовать», бред — «Отклонить». Быстро: у каждой пара секунд',
    bins: [{ e: '✅', name: 'Согласовать', items: ['📈', '💡', '🤝', '🚀', '💰'] }, { e: '❌', name: 'Отклонить', items: ['🔥', '🗑️', '💸', '🎰', '🛋️'] }], limit: 2400, target: 20 },
  dvornik: { engine: gameHold, title: 'Мойка панорамных окон', hint: 'Зажимай «Давление» и отпускай: держи струю в зелёной полосе. Перебор — брызги, мало — грязно', icon: '🪟', iconBad: '💦', btn: '💧 Давление (держи)', target: 40 },
  postman: { engine: gameConveyor, fairTargets: true, title: 'Хрупкое — в сторону', hint: 'Снимай с ленты хрупкое: 🥚 🍷 🏺 💡. Обычные посылки пусть едут', bad: ['🥚', '🍷', '🏺', '💡'], good: ['📦', '📦', '✉️', '🧸', '👟'], badRate: 0.35, target: 14 },
  cook: { engine: gameChop, title: 'Начинка для шавермы', hint: 'Режь на лету мясо и овощи. Горящий гриль 🔥 не трогай!', good: ['🥩', '🍗', '🥒', '🍅', '🧅', '🥬'], bad: ['🔥'], badRate: 0.15, badText: 'Ай, гриль!', target: 16 },
  police: { engine: gameChase, title: 'Погоня за самокатчиком', hint: 'Тапай, чтобы перепрыгивать препятствия. Подбирай штрафы 🧾 в прыжке', player: '👮', good: ['🧾', '🧾'], bad: ['🚧', '🛴', '🗑️'], target: 14 },
  teacher: { engine: gamePairs, title: 'Запомни учеников в созвоне', hint: 'Открывай окошки по два и находи одинаковых учеников. Пара — 2 очка', items: ['👦', '👧', '🧒', '👩‍🎓', '🧑‍💻', '👨‍🎓', '🧑', '👱'], target: 14 },
  clerk: { engine: gameSort, title: 'Электронная очередь мэрии', hint: 'Заявления — «Одобрить», жалобы на соседей — «В архив». Быстро!',
    bins: [{ e: '✅', name: 'Одобрить', items: ['📝', '🏗️', '🌳', '🚌', '🏥'] }, { e: '🗄️', name: 'В архив', items: ['😤', '🔊', '🐕', '🚬', '🗑️'] }], limit: 2300, target: 20 },
  deputy: { engine: gameSimon, title: 'Голосование по кнопкам', hint: 'Смотри, какие кнопки нажимает лидер фракции, и повтори. Длиннее цепочка — больше очков', items: ['🟢', '🔴', '🟡', '🔵'], target: 14 },
};
const ZAS_JOB_GAMES = {};
Object.keys(MSK_JOB_GAMES).forEach((id) => { if (JOB_GAMES[id]) ZAS_JOB_GAMES[id] = { ...JOB_GAMES[id] }; });
MSK_RESKIN.push((msk) => {
  for (const id of Object.keys(ZAS_JOB_GAMES)) {
    const g = JOB_GAMES[id];
    Object.keys(g).forEach((k) => delete g[k]);
    Object.assign(g, ZAS_JOB_GAMES[id], msk ? { ...MSK_JOB_GAMES[id], type: ZAS_JOB_GAMES[id].type } : {});
  }
});

// Учёба в Москвабаде — свои задания
const MSK_TF = [['Москвабад — столица мемов', 1], ['Кольцевая линия метро — квадратная', 0], ['Смузи — это еда', 0], ['Дедлайн — это срок сдачи', 1], ['Коворкинг — это место для работы', 1],
  ['Ипотеку можно не платить, если очень хочется', 0], ['NPS — индекс лояльности клиентов', 1], ['Созвон без камеры — это ок', 1], ['Капибара — рыба', 0], ['Самокат-шеринг можно бросить на газоне', 0]];
startLessonGame = (function (orig) {
  return function (stage) {
    if (city() !== 'msk' || stage === 5) { orig(stage); return; }
    const need = Math.max(2, Math.round([0, 6, 12, 8, 9][stage] * (hasEffect('t_focus') ? 0.75 : 1)));
    const games = {
      1: { name: 'Карта метро', hint: `Найди 🚇 в мешанине значков ${need} раз`, setup: (mg) => gameSpot(mg, { find: '🚇', junk: ['🚌', '🚕', '🛴', '🚲', '🏬', '☕', '🏦', '🚏'] }) },
      2: { name: 'Цифровая гигиена', hint: `Полезное — «Оставить», спам — «Удалить». Набери ${need}`, setup: (mg) => gameSort(mg, { bins: [{ e: '💾', name: 'Оставить', items: ['📊', '📁', '📅', '✉️'] }, { e: '🗑️', name: 'Удалить', items: ['🎰', '💊', '🔞', '🦠'] }], limit: 2400 }) },
      3: { name: 'Нетворкинг', hint: `Запомни визитки — находи пары. Набери ${need} очков`, setup: (mg) => gamePairs(mg, { items: ['💼', '🤝', '📈', '💡', '🧑‍💼', '👩‍💼', '☕', '📇'] }) },
      4: { name: 'Правда или фейк', hint: `Отличай правду от фейков про столичную жизнь. Набери ${need}`, setup: (mg) => lessonChoice(mg, () => { const [t, v] = pick(MSK_TF); return { q: t, a: v ? 'Правда' : 'Фейк', opts: ['Правда', 'Фейк'], penalty: true }; }) },
    };
    const g = games[stage];
    runGame({ title: `📖 ${g.name}`, scoreLabel: ` / ${need}`, hint: g.hint, duration: LESSON_TIME, setup: g.setup, finish: (score) => finishLesson(stage, score, need) });
  };
})(startLessonGame);

// =====================================================================
// 5. Музыка и звуки Москвабада
// =====================================================================
const ZAS_MUSIC = MAIN_MUSIC.slice(), ZAS_SFX = SFX_THEMES.slice();
const MSK_MUSIC = [['metro', '🚇 Дип-хаус метро'], ['neon', '🌃 Неоновый синтвейв'], ['lounge', '🎷 Джаз-бар'], ['off', '🔇 Тишина']];
const MSK_SFX = [['glass', 'Стекло'], ['classic', 'Классика'], ['soft', 'Мягкая']];
MSK_RESKIN.push((msk) => {
  MAIN_MUSIC.length = 0; MAIN_MUSIC.push(...(msk ? MSK_MUSIC : ZAS_MUSIC));
  SFX_THEMES.length = 0; SFX_THEMES.push(...(msk ? MSK_SFX : ZAS_SFX));
  if (!S.settings) return;
  // Своя музыка и звуки у каждого города: при переезде включаются московские, выбор игрока запоминается отдельно
  const key = msk ? 'msk' : 'zas';
  if (!S.settings.cityAudio) S.settings.cityAudio = {};
  const saved = S.settings.cityAudio[key];
  const list = MAIN_MUSIC.map((x) => x[0]);
  // В Москвабаде по умолчанию свои мелодия и звуки; в Засранске — то, что было выбрано
  const fresh = msk && !saved;
  S.settings.mainMusic = saved && list.includes(saved.music) ? saved.music : !fresh && list.includes(S.settings.mainMusic) ? S.settings.mainMusic : list[0];
  S.settings.sfxTheme = saved && SFX_THEMES.some((x) => x[0] === saved.sfx) ? saved.sfx : !fresh && SFX_THEMES.some((x) => x[0] === S.settings.sfxTheme) ? S.settings.sfxTheme : SFX_THEMES[0][0];
  if (typeof syncMusic === 'function') try { syncMusic(); } catch (e) { /* звук не критичен */ }
});
const _setPickMsk = ACTIONS.setPick;
ACTIONS.setPick = (arg, btn) => {
  _setPickMsk(arg, btn);
  if (!S.settings.cityAudio) S.settings.cityAudio = {};
  S.settings.cityAudio[city()] = { music: S.settings.mainMusic, sfx: S.settings.sfxTheme };
};

// =====================================================================
// 6. Применение и «новая глава»
// =====================================================================
let MSK_APPLIED = null;
function applyMsk(c = city()) {
  if (MSK_APPLIED === c) return;
  MSK_APPLIED = c;
  MSK_RESKIN.forEach((f) => f(c === 'msk'));
  renderedHousing = -1; renderedLook = '';
}
applyCity = (function (orig) { return function (c) { orig(c); MSK_APPLIED = null; applyMsk(c || city()); }; })(applyCity);

// Экран «Глава II» сразу после переезда
doMove = (function (orig) {
  return function (opts) {
    orig(opts);
    S.chapterIntro = 'msk';
  };
})(doMove);
HOOKS.tick.push(() => {
  if (S.chapterIntro !== 'msk' || !popupTurn(2)) return;
  S.chapterIntro = null;
  openModal(`<div class="chapter-card"><div class="cc-sky">${sceneSVG(0)}</div><div class="cc-num">ГЛАВА II</div><div class="cc-title">Москвабад</div>
    <p>Ты приехал в большой город с одним чемоданом. Здесь своё жильё, работы, еда, одежда, животные, девушки и музыка. И всё дороже. Друзья и банда — с тобой.</p>
    <div class="cc-list"><span>🏠 Палатка → пентхаус</span><span>💼 15 новых мини-игр на работе</span><span>🐾 6 новых животных</span><span>🎵 Своя музыка</span></div>
    <button class="btn primary wide" data-act="close">Начать главу</button></div>`, { center: true });
  sfx('levelup');
});

// Достижения Москвабада
ACHS.push(
  { id: 'msk_move', name: 'Новая глава', emoji: '🚂', fn: () => S.moves || 0, goals: [1], unit: 'переезд в Москвабад' },
  { id: 'msk_story', name: 'Свой в Москвабаде', emoji: '🏙️', fn: () => (city() === 'msk' && S.quest ? S.quest.idx : 0), goals: [3, 6, 9], unit: 'глав в Москвабаде' },
  { id: 'msk_home', name: 'Пентхаус', emoji: '🌃', fn: () => (city() === 'msk' ? S.ownedHousing || 0 : 0), goals: [2, 4, 6], unit: 'ступеней жилья в Москвабаде' },
);
