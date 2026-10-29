// Отношения подробнее: новые свидания со своими мини-играми, подарки и цветы, шкала «Любовь» —
// до свадьбы теперь надо ухаживать долго. И дети после свадьбы: растут, радуют, помогают.

// =====================================================================
// Новые свидания
// =====================================================================

DATES.push(
  { id: 'skate', name: 'Каток', emoji: '⛸️', price: 300, bonus: 0.06, rel: 12 },
  { id: 'amuse', name: 'Парк аттракционов', emoji: '🎡', price: 900, bonus: 0.12, rel: 18 },
  { id: 'picnic', name: 'Пикник с шашлыком', emoji: '🧺', price: 1500, bonus: 0.14, rel: 20 },
  { id: 'karaoke', name: 'Караоке на двоих', emoji: '🎤', price: 3000, bonus: 0.18, rel: 24 },
  { id: 'museum', name: 'Музей и кофе', emoji: '🖼️', price: 2000, bonus: 0.16, rel: 22 },
  { id: 'bowling', name: 'Боулинг', emoji: '🎳', price: 4000, bonus: 0.2, rel: 26 },
);
DATES.sort((a, b) => a.price - b.price);

Object.assign(DATE_GAMES, {
  skate: { title: 'Каток: держи ритм', hint: 'Жми, когда кольцо совпадёт с кругом — и вы скользите вместе', duration: 18, max: 10, setup: (mg) => gameRhythm(mg) },
  amuse: { title: 'Тир в парке', hint: 'Сбивай мишени 🎯, не попади в людей', duration: 15, max: 12,
    setup: (mg) => gameTargets(mg, { good: ['🎯', '🎈', '🧸'], bad: ['👩', '🧒', '👴'], goodRate: 0.6, life: 1000, every: 700 }) },
  picnic: { title: 'Пикник: шашлык для неё', hint: 'Снимай шампуры, когда мясо золотистое', duration: 20, max: 12, setup: (mg) => gameShashlik(mg) },
  karaoke: { title: 'Караоке-дуэт', hint: 'Попадай в ритм песни — она подпевает', duration: 18, max: 10, setup: (mg) => gameRhythm(mg) },
  museum: { title: 'Музей: умная беседа', hint: 'Отвечай так, чтобы впечатлить', duration: 25, max: 8, setup: (mg) => talkGame(mg, DATE_TALK, 4) },
  bowling: { title: 'Боулинг', hint: 'Бросай, когда прицел в центре. Страйк впечатлит!', duration: 0, max: 150, setup: (mg) => gameDarts(mg) },
});
DATE_TALK.push(
  ['Какая картина тебе нравится?', [['Где море и закат — как наше будущее', 2], ['«Чёрный квадрат», там всё понятно', 1], ['Где нарисована шаурма', -1]]],
  ['Ты умеешь готовить?', [['Мой борщ хвалил сам Михалыч', 2], ['Пельмени варю отлично', 1], ['Это женское дело', -1]]],
  ['Что подаришь мне на день рождения?', [['Сюрприз, но ты будешь в восторге', 2], ['Что попросишь', 1], ['Открытку из мусорки', -1]]],
  ['Как ты относишься к животным?', [['Обожаю, у меня кот Барсик', 2], ['Нормально', 1], ['Голуби — главные враги', -1]]],
);

// =====================================================================
// Любовь: растёт от свиданий и подарков, нужна для предложения
// =====================================================================

const LOVE_FOR_PROPOSAL = 100;
const DATES_FOR_PROPOSAL = 8;
const LOVE_DECAY = 2; // в час, если не уделять внимания
const GIFTS = [
  { id: 'rose', name: 'Букет роз', emoji: '🌹', price: 300, love: 3 },
  { id: 'candy', name: 'Конфеты', emoji: '🍫', price: 500, love: 4 },
  { id: 'book', name: 'Книга стихов', emoji: '📚', price: 800, love: 5 },
  { id: 'champ', name: 'Шампанское', emoji: '🍾', price: 1200, love: 6 },
  { id: 'teddy', name: 'Плюшевый мишка', emoji: '🧸', price: 1500, love: 6 },
  { id: 'perfume', name: 'Духи', emoji: '💄', price: 5000, love: 10 },
  { id: 'bag', name: 'Сумочка', emoji: '👜', price: 40000, love: 18 },
  { id: 'earrings', name: 'Серьги с бриллиантами', emoji: '💎', price: 150000, love: 30 },
];
const GIFT_CD = 20 * 60;
// Что каждая любит больше всего (×2) и что её не впечатляет (×0.5)
const GIRL_TASTE = {
  lyuska: { likes: 'champ', meh: 'book' }, zinka: { likes: 'teddy', meh: 'book' }, sveta: { likes: 'candy', meh: 'champ' },
  katya: { likes: 'book', meh: 'champ' }, angela: { likes: 'perfume', meh: 'teddy' }, kristina: { likes: 'earrings', meh: 'candy' },
};

function loveTick() {
  if (!S.girlfriend) return;
  if (S.love === undefined) S.love = 0;
  const now = Date.now();
  const h = (now - (S.loveAt || now)) / 3600000;
  if (h > 0.05) { S.love = Math.max(0, S.love - LOVE_DECAY * h); S.loveAt = now; }
}
HOOKS.tick.push(loveTick);

function addLove(v) { if (S.love === undefined) S.love = 0; S.love = clamp(S.love + v, 0, 100); S.loveAt = Date.now(); }

function onDateSuccess(g, d, perf) {
  if (S.girlfriend !== g.id) return '';
  const v = Math.round(d.rel * 0.35 * (0.6 + perf));
  addLove(v);
  S.gfDates = (S.gfDates || 0) + 1;
  return `<br>💗 Любовь +${v} (${Math.floor(S.love)}/100)`;
}

// Новая девушка — любовь с нуля
HOOKS.tick.push(() => { if (S.girlfriend && S.loveFor !== S.girlfriend) { S.loveFor = S.girlfriend; S.love = 0; S.gfDates = 0; S.loveAt = Date.now(); } });

propose = (function (orig) {
  return function () {
    if (!S.married && !(S.engaged && S.engaged.gid === S.girlfriend) && ((S.love || 0) < LOVE_FOR_PROPOSAL || (S.gfDates || 0) < DATES_FOR_PROPOSAL)) {
      toast(`Рано! Нужна любовь ${LOVE_FOR_PROPOSAL} (сейчас ${Math.floor(S.love || 0)}) и ${DATES_FOR_PROPOSAL} свиданий вместе (было ${S.gfDates || 0})`, 'bad');
      return;
    }
    orig();
  };
})(propose);

function openGifts(gid) {
  const g = GIRLS.find((x) => x.id === gid);
  const taste = GIRL_TASTE[gid] || {};
  const mine = S.girlfriend === gid;
  openModal(`<h3>🎁 Подарок для ${g.name.split(' ').pop()}</h3>
    <p>${mine ? 'Подарки растят 💗 любовь.' : 'Подарки растят ❤️ отношения.'} Каждый подарок — не чаще раза в 20 минут. У каждой свои вкусы!</p>
    <div class="list">${GIFTS.map((x) => {
      const cd = cdLeft('gift_' + x.id);
      const mult = taste.likes === x.id ? 2 : taste.meh === x.id ? 0.5 : 1;
      return card({ thumb: x.emoji, title: x.name, desc: `+${Math.round(x.love * mult)} ${mine ? '💗' : '❤️'}${mult === 2 ? ' · <b style="color:var(--green)">её любимое!</b>' : ''}`,
        btn: cd > 0 ? timerBtn(S.cd['gift_' + x.id]) : priceBtn('giveGift', `${gid}:${x.id}`, giftPayPrice(gid,x), S.money >= giftPayPrice(gid,x)) });
    }).join('')}</div>
    <div class="btns"><button class="btn wide" data-act="close">Закрыть</button></div>`);
}

ACTIONS.giftMenu = (gid) => openGifts(gid);
ACTIONS.giveGift = (arg) => {
  const [gid, id] = arg.split(':');
  const x = GIFTS.find((y) => y.id === id), g = GIRLS.find((y) => y.id === gid);
  if (!x || S.money < giftPayPrice(gid,x) || cdLeft('gift_' + id) > 0) return;
  S.money -= giftPayPrice(gid,x);
  setCd('gift_' + id, GIFT_CD);
  const taste = GIRL_TASTE[gid] || {};
  const mult = taste.likes === id ? 2 : taste.meh === id ? 0.5 : 1;
  const v = Math.round(x.love * mult);
  if (S.girlfriend === gid) { addLove(v); if (typeof addTrust === 'function') addTrust(2); }
  else { const st = girlState(gid); st.rel = Math.min(100, st.rel + v); }
  track('gift');
  sfx(mult >= 1 ? 'good' : 'bad');
  const reply = mult === 2 ? '«Откуда ты знал?! Это моё любимое!» 😍' : mult === 0.5 ? '«Эм… спасибо». Кажется, не угадал 😅' : '«Ой, как мило!» 😊';
  closeModal();
  resultModal({ emoji: x.emoji, title: `${g.name.split(' ').pop()}: ${reply}`, text: `${S.girlfriend === gid ? `💗 Любовь +${v} (${Math.floor(S.love)}/100)` : `❤️ Отношения +${v}`}`, btn: 'Ок' });
};

// Карточки девушек получают кнопку подарка, а блок пары — шкалу любви и условия предложения
const _datesTab = EXTRA_TABS.fun.dates;
EXTRA_TABS.fun.dates = () => {
  let html = _datesTab();
  GIRLS.forEach((g) => {
    const st = S.girls[g.id];
    if (!st || !st.met) return;
    html = html.replace(new RegExp(`(<button class="btn[^"]*" data-act="dateMenu" data-id="${g.id}"[^>]*>[^<]*</button>)`), `<div class="btn-col">$1<button class="btn small" data-act="giftMenu" data-id="${g.id}">🎁 Подарок</button></div>`);
  });
  if (S.girlfriend && !S.married) {
    const love = Math.floor(S.love || 0), dates = S.gfDates || 0;
    const bar = `<div class="info-card love-card">💗 <b>Любовь ${love}/${LOVE_FOR_PROPOSAL}</b> · свиданий вместе ${dates}/${DATES_FOR_PROPOSAL}
      <div class="progress"><div style="width:${love}%;background:#E05A8A"></div></div>
      <small>Растёт от свиданий и подарков, без внимания остывает (−${LOVE_DECAY} в час). Для предложения нужно и то и другое.</small></div>`;
    html = html.replace('<div class="premium-hero wife-hero">', bar + '<div class="premium-hero wife-hero">');
  }
  if (S.married) html = html.replace('<button class="btn wide" data-act="divorceAsk">', kidsHTML() + '<button class="btn wide" data-act="divorceAsk">');
  // После развода дети остаются с Валерой — раньше их просто переставало быть видно (но расходы на них шли)
  else if ((S.kids || []).length) html += kidsHTML();
  return html;
};

// =====================================================================
// Дети
// =====================================================================

const KIDS_MAX = 3;
const KID_PREGNANCY = MONTH_MS; // 3 часа
const KID_YEAR = MONTH_MS;      // 1 год ребёнка = 1 игровой месяц = 3 часа
const KID_NAMES = { boy: ['Ваня', 'Миша', 'Дима', 'Тёма', 'Саша', 'Валерий-младший'], girl: ['Маша', 'Аня', 'Настя', 'Катя', 'Соня', 'Валерия'] };
const KID_PLAY_CD = 10 * 60;

function kidAge(k) { return Math.floor((Date.now() - k.born) / KID_YEAR); }
function kidStage(k) { const a = kidAge(k); return a < 4 ? 'baby' : a < 12 ? 'kid' : a < 18 ? 'teen' : 'adult'; }
function kidCost(k) { return kidStage(k) === 'adult' ? 0 : 300 + kidAge(k) * 120; }

HOOKS.mods.push((m) => {
  for (const k of S.kids || []) {
    if (k.joy > 40) m.mpm += 0.3;
    if (kidStage(k) === 'kid' || kidStage(k) === 'teen') m.tapAdd += 1; // помогают собирать бутылки
  }
});

HOOKS.tick.push(() => {
  const now = Date.now();
  // Рождение
  if (S.pregnant && now >= S.pregnant && popupTurn(2)) {
    S.pregnant = 0;
    const sex = Math.random() < 0.5 ? 'boy' : 'girl';
    // Сразу в семью — с именем по умолчанию. Раньше ребёнка добавляли только после выбора имени,
    // и если в этот момент закрыть игру, он пропадал навсегда
    if (!S.kids) S.kids = [];
    S.kids.push({ name: KID_NAMES[sex][0], sex, born: now, joy: 80, smart: 0, unnamed: true });
    track('kidBorn');
    save();
    confetti(100); sfx('levelup');
    openModal(`<div class="big-art"><div class="rays"></div><div class="big-emoji">${sex === 'boy' ? '👶🏻' : '👶🏼'}</div></div>
      <h3>У вас родился${sex === 'boy' ? ' сын' : 'а дочь'}!</h3><p>Как назовёшь?</p>
      <div class="btn-row" style="justify-content:center">${KID_NAMES[sex].map((n) => `<button class="btn" data-act="kidName" data-id="${sex}:${n}">${n}</button>`).join('')}</div>`, { center: true, locked: true });
    return;
  }
  if (!S.kids || !S.kids.length) return;
  // Радость детей тает, без внимания — грустят
  const h = (now - (S.kidsAt || now)) / 3600000;
  if (h > 0.05) { S.kids.forEach((k) => { k.joy = Math.max(0, k.joy - 10 * h); }); S.kidsAt = now; }
  // Раз в игровой месяц: расходы на маленьких и помощь от взрослых
  if (!S.kidsDue) S.kidsDue = now + MONTH_MS;
  if (now >= S.kidsDue && popupTurn(2)) {
    S.kidsDue = now + MONTH_MS;
    const cost = S.kids.reduce((a, k) => a + kidCost(k), 0);
    const help = familyMonthlyHelp();
    if (cost) { S.money = Math.max(0, S.money - cost); }
    if (help) addMoney(help);
    toast(`👨‍👧 Семейный месяц: на детей −${fmt(cost)} ₽${help ? `, взрослые дети прислали +${fmt(help)} ₽` : ''}`, cost > help ? 'bad' : 'good');
  }
});

function kidsHTML() {
  const kids = S.kids || [];
  const canMore = S.married && kids.length + (S.pregnant ? 1 : 0) < KIDS_MAX;
  return `<div class="subhead">👶 Дети · ${kids.length}/${KIDS_MAX}</div>
    ${S.pregnant ? `<div class="info-card">🤰 Ждёте пополнения! Малыш родится через <b><span data-until="${S.pregnant}"></span></b></div>` : ''}
    ${kids.map((k, i) => {
      const st = kidStage(k), age = kidAge(k);
      const face = { baby: '👶', kid: k.sex === 'boy' ? '👦' : '👧', teen: k.sex === 'boy' ? '🧑' : '👩', adult: k.sex === 'boy' ? '👨‍💼' : '👩‍💼' }[st];
      const cd = cdLeft('kid_' + i);
      const perk = st === 'adult' ? 'Взрослый: раз в месяц присылает деньги' : st === 'baby' ? 'Малыш: радует (+0.3 😊/мин, если весел)' : 'Помогает собирать бутылки: +1 за тап';
      return card({ thumb: face, title: `${esc(k.name)}, ${age} ${age % 10 === 1 && age !== 11 ? 'год' : age % 10 >= 2 && age % 10 <= 4 && (age < 12 || age > 14) ? 'года' : 'лет'}`,
        desc: `${perk}<br>😊 Радость ${Math.floor(k.joy)}/100 · 📚 Ум ${k.smart || 0}/5 · расходы ${fmt(kidCost(k))} ₽/мес`,
        btn: st === 'adult' ? '' : `<div class="btn-col">${cd > 0 ? timerBtn(S.cd['kid_' + i]) : `<button class="btn green small" data-act="kidPlay" data-id="${i}">🧸 Играть</button>`}
          ${st !== 'baby' && (k.smart || 0) < 5 ? priceBtn('kidTutor', i, 2000 * (age + 1), S.money >= 2000 * (age + 1), `📚 ${fmt(2000 * (age + 1))}`).replace('class="btn', 'class="btn small') : ''}</div>` });
    }).join('')}
    ${canMore ? `<button class="btn wide" data-act="kidWant">👶 Завести ребёнка</button>` : ''}
    <small class="kids-note">1 год ребёнка = 1 игровой месяц (3 часа). Умные взрослые дети помогают больше.</small>`;
}

const KID_GAMES = {
  baby: { title: 'Укачай малыша', hint: 'Жми «Качать», когда метка в зелёной зоне', duration: 0, max: 9, setup: (mg) => gameTiming(mg, { btn: '🍼 Качать', item: '💤', attempts: 6 }) },
  kid: { title: 'Догонялки', hint: 'Лови игрушки, не наступи на лужу', duration: 15, max: 12, setup: (mg) => gameTargets(mg, { good: ['🧸', '⚽', '🪀', '🎈'], bad: ['💧', '🐝'], goodRate: 0.7, life: 1100, every: 650 }) },
  teen: { title: 'Помоги с домашкой', hint: 'Решай задачи быстрее, чем сын закатит глаза', duration: 20, max: 8, setup: (mg) => lessonChoice(mg, () => mathQuestion(2)) },
};

Object.assign(ACTIONS, {
  kidWant: () => {
    if (!S.married) return;
    if ((S.kids || []).length + (S.pregnant ? 1 : 0) >= KIDS_MAX) return;
    if ((S.love || 0) < 50 && girlState(S.girlfriend).rel < 80) { toast('Жена пока не готова — порадуй её свиданиями и подарками', 'bad'); return; }
    if (S.housing < 4) { toast('Нужна хотя бы комната в общаге — с ребёнком в гараже не жить', 'bad'); return; }
    S.pregnant = Date.now() + KID_PREGNANCY;
    track('pregnant');
    confetti(40); sfx('good');
    resultModal({ emoji: '🤰', title: 'Скоро вас станет больше!', text: 'Малыш родится через 3 часа. Готовь коляску!', btn: 'Ура!' });
  },
  kidName: (arg) => {
    const [sex, name] = arg.split(':');
    if (!S.kids) S.kids = [];
    const k = S.kids.find((x) => x.unnamed) || (S.kids.push({ sex, born: Date.now(), joy: 80, smart: 0 }), S.kids[S.kids.length - 1]);
    k.name = name; delete k.unnamed;
    closeModal();
    toast(`👶 Добро пожаловать, ${name}!`, 'good');
    save();
  },
  kidPlay: (i) => {
    const k = (S.kids || [])[+i];
    if (!k || cdLeft('kid_' + i) > 0) return;
    const gm = KID_GAMES[kidStage(k)];
    setCd('kid_' + i, KID_PLAY_CD);
    runGame({ title: `${gm.title} с ${k.name}`, hint: gm.hint, duration: gm.duration, setup: gm.setup, finish: (score) => {
      const perf = clamp(score / gm.max, 0, 1.2);
      const joy = Math.round(15 + perf * 35);
      k.joy = Math.min(100, k.joy + joy);
      addMood(Math.round(5 + perf * 10));
      track('kidPlay');
      resultModal({ emoji: perf >= 0.6 ? '🥰' : '🙂', title: `${k.name} доволен${k.sex === 'girl' ? 'а' : ''}!`, text: `Радость ребёнка +${joy}, твоя радость тоже растёт`, btn: 'Ок' });
      sfx('good');
      save();
    } });
  },
  kidTutor: (i) => {
    const k = (S.kids || [])[+i];
    if (!k) return;
    const price = 2000 * (kidAge(k) + 1);
    if (S.money < price || (k.smart || 0) >= 5) return;
    S.money -= price;
    k.smart = (k.smart || 0) + 1;
    sfx('buy');
    toast(`📚 ${k.name} занимается с репетитором: ум ${k.smart}/5`, 'good');
  },
});
