// Жизнь: переедание с приколами, свидания с мини-играми, измены и ЗППП, свадьба и развод,
// болезни и корм питомцев, расширенная мусорка.

function lifeDefaults() {
  return { over: 0, overAt: Date.now(), petPantry: {}, petSick: null, petHp: 100, petHpAt: Date.now(), shelter: [], married: false, wifeDue: 0 };
}
function ensureLife() { const d = lifeDefaults(); for (const k in d) if (S[k] === undefined) S[k] = d[k]; }
HOOKS.load.push(ensureLife);

// =====================================================================
// Новые эффекты и лекарства
// =====================================================================

Object.assign(EFFECTS, {
  stuffed: { name: 'Обожрался', emoji: '🤰', kind: 'bad', desc: 'Тапы −15%, энергия восстанавливается на 30% медленнее', mods: { tap: 0.85, regen: 0.7 } },
  hiccup: { name: 'Икота', emoji: '😮', kind: 'bad', desc: 'Тапы −10%. Помогает стакан воды', mods: { tap: 0.9 } },
  foodcoma: { name: 'Пищевая кома', emoji: '😴', kind: 'bad', desc: 'Тапы −30%, работа −20%', mods: { tap: 0.7, work: 0.8 } },
  runs: { name: 'Медвежья болезнь', emoji: '🚽', kind: 'bad', desc: 'Тапы −40%, здоровье −0.5/мин', mods: { tap: 0.6, hpm: -0.5 } },
  gonorrhea: { name: 'Триппер', emoji: '🔥', kind: 'disease', needDiag: true, hidden: 'Больно… в туалет', desc: 'Здоровье −1/мин, радость −3/мин', mods: { hpm: -1, mpm: -3 } },
  herpes: { name: 'Герпес', emoji: '👄', kind: 'disease', needDiag: true, hidden: 'Губа опухла', desc: 'Радость −1/мин, девушки шарахаются', mods: { mpm: -1 } },
  married: { name: 'Медовый месяц', emoji: '💒', kind: 'good', desc: 'Весь доход +20%, радость +2/мин', mods: { tap: 1.2, work: 1.2, pity: 1.2, mpm: 2 } },
});
const STIS = ['chlamydia', 'gonorrhea', 'herpes'];
function hasSti() { return STIS.some((id) => hasEffect(id)); }
MEDS.find((m) => m.id === 'antibiotics').cures.push('gonorrhea');
MEDS.find((m) => m.id === 'coal').cures.push('runs');
MEDS.push(
  { id: 'water', name: 'Стакан воды', emoji: '🥛', price: 5, cures: ['hiccup'], desc: 'Задержи дыхание и пей мелкими глотками' },
  { id: 'mezim', name: 'Мезим', emoji: '💊', price: 60, cures: ['stuffed', 'foodcoma', 'bloat'], desc: 'Для тех, кто не рассчитал силы за столом' },
  { id: 'acyclovir', name: 'Мазь «Ацикловир»', emoji: '🧴', price: 350, cures: ['herpes'], desc: 'От герпеса. Сначала диагноз у врача' },
);

// =====================================================================
// 1. Переедание: есть можно сколько угодно, но излишки бьют по Валере
// =====================================================================

const OVER_DIGEST = 1.5; // столько «лишней» сытости переваривается за минуту
const OVEREAT_JOKES = [
  { e: '🔘', t: 'Пуговица на штанах отлетела и попала голубю в лоб', run: () => (addMood(3), '+3 😊') },
  { e: '😮', t: 'Икота на весь парк. Прохожие оборачиваются', run: () => (addEffect('hiccup', 5), 'Икота на 5 минут') },
  { e: '😴', t: 'Уснул лицом в тарелке', min: 25, run: () => (addEffect('foodcoma', 4), 'Пищевая кома на 4 минуты') },
  { e: '👖', t: 'Штаны лопнули по шву. Сзади', run: () => (addMood(-8), '−8 😊') },
  { e: '💨', t: 'Газовая атака: прохожие разбегаются', run: () => (addEffect('bloat', 4), 'Вздутие, милостыня −30%') },
  { e: '🚽', t: 'Медвежья болезнь — срочно в кусты!', min: 30, run: () => { addEffect('runs', 4); S.energy = Math.max(0, S.energy - 10); S.over = Math.max(0, S.over - 25); return '−10 ⚡, часть еды ушла… туда'; } },
  { e: '👴', t: 'Михалыч: «Валера, ты как колобок. Тебя скоро катить можно»', run: () => (addMood(-3), '−3 😊') },
  { e: '🚨', t: 'Рыгнул так, что сработала сигнализация у машины', run: () => (addMood(5), 'Смешно же! +5 😊') },
  { e: '🪑', t: 'Не смог встать с лавки. Прохожие помогли и дали мелочь', run: () => (addMoney(10), '+10 ₽') },
  { e: '🐶', t: 'Желудок урчит так, что дворовые собаки отвечают', run: () => (addMood(-2), '−2 😊') },
  { e: '🐌', t: 'Ползёшь как улитка — тяжело даже тапать', min: 20, run: () => (S.energy = Math.max(0, S.energy - 15), '−15 ⚡') },
  { e: '🤮', t: 'Всё съеденное вышло обратно. Зря продукт перевёл', min: 45, run: () => { S.over = 0; S.food = 50; hurt(5); addMood(-10); return 'Сытость 50, −5 ❤️, −10 😊'; } },
];

function overeat(extra) {
  ensureLife();
  S.over += extra;
  track('overeat');
  floatAt($('foodText'), `🤰 +${Math.round(extra)}`, 'bad');
  if (S.over >= 15) addEffect('stuffed', 5);
  if (S.over >= 110 && Math.random() < 0.5) {
    S.over = 0;
    hurt(30);
    const m = takeMoney(0.1, 5000);
    resultModal({ emoji: '🚑', rays: 'bad', title: 'Заворот кишок!', text: `Скорая откачала. −30 ❤️, −${fmt(m)} ₽ на лечение. Врач: «Ещё одна шаурма — и я вам не помогу»`, btn: 'Больше не буду' });
    sfx('bad');
    return;
  }
  if (Math.random() < Math.min(0.85, 0.25 + S.over / 100)) {
    const j = pick(OVEREAT_JOKES.filter((x) => !x.min || S.over >= x.min));
    const res = j.run();
    setTimeout(() => toast(`${j.e} ${j.t}${/[!?.]$/.test(j.t) ? '' : '.'} ${res}`, 'bad'), 700);
  }
}

eat = function (id) {
  const f = FOOD.find((x) => x.id === id);
  if (!f || !reqOk(f.req) || !shopCanPay(f)) return;
  if (!shopPay(f)) return;
  const extra = Math.max(0, f.food - (maxFood() - S.food));
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
  if (extra > 0) { msg += ` · 🤰 переел на ${Math.round(extra)}`; kind = 'bad'; }
  toast(msg, kind);
  sfx('eat');
  haptic(kind === 'bad' ? 'error' : 'success');
  if (extra > 0) overeat(extra);
};

HOOKS.tick.push(() => {
  ensureLife();
  const now = Date.now();
  const min = (now - S.overAt) / 60000;
  S.overAt = now;
  if (S.over <= 0) return;
  // Лишнее сначала доливается в сытость, остальное потихоньку переваривается
  const room = maxFood() - S.food;
  if (room > 0) { const t = Math.min(room, S.over); S.food += t; S.over -= t; }
  S.over = Math.max(0, S.over - OVER_DIGEST * min);
});

HOOKS.hud.push(() => {
  const over = S.over > 0.5;
  $('foodFill').classList.toggle('over', over);
  if (over) $('foodText').textContent = `${Math.floor(S.food)}/${maxFood()} +${Math.floor(S.over)}`;
  if (over && $('eatInfo')) $('eatInfo').textContent = 'обожрался!';
});

// =====================================================================
// 2. Свидания: мини-игры, измены и ЗППП, свадьба и развод
// =====================================================================

// Вопросы на свидании: ответ даёт 2 (отлично), 1 (нормально) или −1 (провал)
const DATE_TALK = [
  ['Чем ты занимаешься?', [['Свой бизнес. Стеклотарный', 2], ['Ищу себя', 1], ['Тебе-то что?', -1]]],
  ['Какое у тебя хобби?', [['Готовлю. Доширак — это база', 1], ['Хожу в зал, качаюсь', 2], ['Смотреть футбол у ларька', -1]]],
  ['Ты читаешь книги?', [['Недавно перечитал «Войну и мир»', 2], ['Этикетки на бутылках', 1], ['Книги для слабаков', -1]]],
  ['Где ты живёшь?', [['Скромно, но со вкусом', 2], ['Где придётся', 1], ['У мамы', -1]]],
  ['О чём ты мечтаешь?', [['Вернуть кота и квартиру', 2], ['Выиграть в лотерею', 1], ['Чтобы ты оплатила счёт', -1]]],
  ['Тебе нравится моё платье?', [['Ты в нём как картина', 2], ['Нормальное', 1], ['У Зинки такое же', -1]]],
  ['Расскажи смешной случай', [['Как голубь украл мою шаурму', 2], ['Анекдот про Штирлица', 1], ['Как я упал в мусорку… вчера', -1]]],
  ['Какой твой любимый фильм?', [['«Брат-2»', 2], ['«Титаник»', 1], ['Не смотрю кино — дорого', -1]]],
  ['А ты бывал за границей?', [['В Турции, давно', 1], ['Мечтаю с тобой на Мальдивы', 2], ['В Урюпинске считается?', -1]]],
  ['Что ты ценишь в людях?', [['Честность', 2], ['Чувство юмора', 1], ['Чтобы бутылки не воровали', -1]]],
];
// Переговоры при разводе
const DIVORCE_TALK = [
  ['Кто забирает телевизор?', [['Забирай, мне хватит радио', 2], ['Давай продадим и поделим', 1], ['Через мой труп', -1]]],
  ['Кто виноват, что всё так вышло?', [['Мы оба', 2], ['Обстоятельства', 1], ['Твоя мама', -1]]],
  ['А как же наши общие друзья?', [['Пусть сами решат', 2], ['Михалыч мой', 1], ['Они все тебя терпеть не могут', -1]]],
  ['Ты мне вернёшь подарки?', [['Конечно, они твои', 2], ['Половину', 1], ['Я их уже сдал Шнырю', -1]]],
  ['Мы останемся друзьями?', [['Я буду рад', 2], ['Посмотрим', 1], ['Даже не мечтай', -1]]],
  ['Ты будешь платить за мои нервы?', [['Куплю тебе цветы напоследок', 2], ['У меня нет денег', 1], ['Ха-ха, нет', -1]]],
];

// Мини-игра «разговор»: вопрос и три ответа, время ограничено
function talkGame(mg, bank, count) {
  const arena = $('mgArena');
  const qs = shuffle(bank).slice(0, count);
  let i = 0;
  const show = () => {
    if (!mgAlive(mg)) return;
    if (i >= qs.length) { mgDelay(mg, mgEnd, 300); return; }
    const [q, answers] = qs[i++];
    const opts = shuffle(answers);
    arena.innerHTML = `<div class="ls-q talk-q">«${q}»</div><div class="ls-opts talk-opts">${opts.map(([t, v]) => `<button class="btn" data-v="${v}">${t}</button>`).join('')}</div>`;
    arena.querySelectorAll('.talk-opts .btn').forEach((b) => {
      b.onpointerdown = (e) => {
        e.preventDefault();
        if (!mgAlive(mg) || b.dataset.done) return;
        arena.querySelectorAll('.talk-opts .btn').forEach((x) => { x.dataset.done = 1; });
        const v = +b.dataset.v;
        b.classList.add(v > 0 ? 'right' : 'wrong');
        floatAt(b, v === 2 ? '😍' : v === 1 ? '🙂' : '😒', v > 0 ? 'good' : 'bad');
        mgScore(v);
        sfx(v === 2 ? 'good' : v === 1 ? 'tap' : 'error');
        if (v < 0) shakeArena();
        mgDelay(mg, show, 550);
      };
    });
  };
  show();
}

// Какая мини-игра на каком свидании
const DATE_GAMES = {
  walk: { title: 'Прогулка: лови момент', hint: 'Лови цветы и мороженое, не трогай голубей и… то, что они оставили', duration: 15, max: 12,
    setup: (mg) => gameTargets(mg, { good: ['🌸', '💐', '🍦', '⭐', '😘'], bad: ['💩', '🕊️', '🐀'], goodRate: 0.65, life: 1100, every: 750 }) },
  cafe: { title: 'Кафе: разговор', hint: 'Выбирай ответы. Ей важно, что ты говоришь', duration: 25, max: 8, setup: (mg) => talkGame(mg, DATE_TALK, 4) },
  cinema: { title: 'Кино: разговор после сеанса', hint: 'Выбирай ответы. Ей важно, что ты говоришь', duration: 25, max: 8, setup: (mg) => talkGame(mg, DATE_TALK, 4) },
  rest: { title: 'Ресторан: светская беседа', hint: 'Пять вопросов, отвечай умно', duration: 30, max: 10, setup: (mg) => talkGame(mg, DATE_TALK, 5) },
  yacht: { title: 'Яхта: медленный танец', hint: 'Жми «Шаг», когда метка в зелёной зоне. Не отдави ноги!', duration: 0, max: 12,
    setup: (mg) => gameTiming(mg, { btn: '💃 Шаг', item: '💃', attempts: 8 }) },
};

goDate = function (arg) {
  const [gid, did] = arg.split(':');
  const g = GIRLS.find((x) => x.id === gid), d = DATES.find((x) => x.id === did);
  if (S.money < d.price || S.energy < 15 || cdLeft('date') > 0) return;
  S.money -= d.price;
  S.energy -= 15;
  setCd('date', DATE_CD);
  addXp(XP.date);
  const gm = DATE_GAMES[d.id];
  runGame({ title: gm.title, hint: gm.hint, duration: gm.duration, setup: gm.setup, countdown: 0, scoreLabel: ' ❤️',
    finish: (score) => finishDate(g, d, clamp(score / gm.max, 0, 1)) });
};

function stiName(id) { return `${EFFECTS[id].emoji} ${EFFECTS[id].name}`; }

function finishDate(g, d, perf) {
  const st = girlState(g.id);
  const partner = S.girlfriend;
  const cheating = partner && partner !== g.id;
  const pf = partner ? GIRLS.find((x) => x.id === partner) : null;
  const perfText = `Свидание прошло на ${Math.round(perf * 100)}%. `;

  // Измену могут заметить
  // Чем ниже доверие, тем пристальнее она следит
  const watch = Math.max(0, (50 - (S.trust === undefined ? 70 : S.trust)) / 150);
  if (cheating && Math.random() < (S.married ? 0.4 : 0.3) + watch) {
    if (S.married) { startDivorce(true, `${pf.name} увидела тебя с ${g.name.split(' ').pop()}. Она подаёт на развод!`); return; }
    girlState(partner).rel = 30;
    S.girlfriend = null;
    addEffect('heartbreak', 5);
    addMood(-20);
    resultModal({ emoji: '😡', rays: 'bad', title: 'Спалился!', text: `${pf.name} увидела тебя с ${g.name.split(' ').pop()}. Вы расстались. 💔 Разбитое сердце`, btn: 'Ой…' });
    haptic('error');
    return;
  }
  // Принёс заразу своей девушке или жене — вскроется
  if (!cheating && partner === g.id && hasSti() && Math.random() < 0.6) {
    partnerCaughtSti(g);
    haptic('error');
    return;
  }

  const chance = clamp(dateChance(g, d) * (0.55 + 0.7 * perf), 0.03, 0.97);
  if (Math.random() < chance) {
    st.rel = Math.min(100, st.rel + d.rel * (1 + Math.max(0, charm())) * (0.7 + perf * 0.5));
    addMood(15);
    addEffect('inlove', 3);
    let text = `${perfText}Отлично провели время! ❤️ ${Math.floor(st.rel)}/100. Радость +15`;
    const stiChance = cheating ? g.std + 0.15 : g.std * 0.25;
    if (Math.random() < stiChance) {
      const sti = pick(STIS);
      addEffect(sti);
      text += cheating ? `<br><br>Через пару дней что-то зачесалось… Измена вышла боком. Сходи к врачу` : '. Правда, через пару дней что-то зачесалось…';
    }
    if (st.rel >= 100 && S.girlfriend !== g.id && !S.married) {
      S.girlfriend = g.id;
      S.trust = 70;
      S.partnerAt = 0;
      confetti(80);
      text = `${perfText}Она согласилась быть твоей девушкой! 💍 Теперь радость растёт сама (+0.5/мин). А там и до свадьбы недалеко…`;
    }
    if (typeof onDateSuccess === 'function') text += onDateSuccess(g, d, perf);
    resultModal({ emoji: '💘', title: `Свидание: ${d.name}`, text, btn: 'Счастье!' });
    haptic('success');
    return;
  }

  // Неудача — случайный «прикол»
  let text, emoji;
  const r = Math.random();
  const std = cheating ? g.std + 0.15 : g.std;
  if (r < std) {
    const sti = pick(STIS);
    addEffect(sti);
    emoji = EFFECTS[sti].emoji;
    text = `Свидание было… бурным. Через день: «${EFFECTS[sti].hidden}». Может, стоит сходить к врачу?`;
  } else if (r < std + 0.12) {
    addEffect('lice');
    emoji = '🪳'; text = 'Она пригласила к себе на старый диван. Утром голова чешется — 🪳 вши!';
  } else if (r < std + 0.3) {
    addEffect('heartbreak', 5);
    addMood(-15);
    emoji = '💔'; text = 'Она сказала «давай останемся друзьями». Разбитое сердце на 5 минут';
  } else if (r < std + 0.45) {
    const lost = takeMoney(0.15, 2000);
    emoji = '👛'; text = `Пока ты отошёл, она исчезла вместе с ${fmt(lost)} ₽ из кошелька`;
  } else if (r < std + 0.6) {
    addMood(-10);
    emoji = '🦊'; text = 'Весь вечер она переписывалась со Шнырём, а потом ушла к нему. Радость −10';
  } else if (r < std + 0.75) {
    hurt(8);
    emoji = '🥊'; text = 'Пришёл её бывший — боксёр. Объяснил, что ты тут лишний. −8 ❤️';
  } else if (r < std + 0.88) {
    addMood(-8);
    emoji = '👵'; text = 'Она привела маму «познакомиться». Мама сказала, что ты не пара её дочке. −8 😊';
  } else {
    addEffect('poison', 4);
    emoji = '🤢'; text = 'Креветки в кафе оказались несвежие. Свидание закончилось в туалете. 🤢 Отравление';
  }
  st.rel = Math.max(0, st.rel - 5);
  resultModal({ emoji, rays: 'bad', title: 'Свидание не задалось', text: perfText + text, btn: 'Бывает' });
  haptic('error');
}

// ---------- Свадьба ----------

const RINGS = [3000, 8000, 15000, 50000, 200000, 800000]; // по индексу девушки в GIRLS
// Family requests keep their original relationship value; only the price is reduced.
function wifeRequestCost(amount,married=S.married){return amount*(married?0.5:1);}
function giftPayPrice(gid,gift){const w=S.gfWish;return S.married&&gid===S.girlfriend&&w?.id===gift.id&&(!w.gid||w.gid===gid)?gift.price/2:gift.price;}
const ALLOWANCE = [300, 1000, 3000, 10000, 40000, 150000]; // семейный бюджет в игровой месяц
const WEDDINGS = [
  { id: 'zags', name: 'Тихая роспись в ЗАГСе', emoji: '🏛️', price: 5000, mood: 30, gifts: 0, honey: 15, desc: 'Двое свидетелей и шампанское из пластиковых стаканов' },
  { id: 'canteen', name: 'Свадьба в столовой', emoji: '🍲', price: 40000, mood: 50, gifts: 0.6, honey: 30, desc: 'Тамада, конкурсы, баян. Гости дарят конверты' },
  { id: 'banquet', name: 'Банкет в ресторане', emoji: '🥂', price: 400000, mood: 80, gifts: 0.5, honey: 60, desc: 'Живая музыка, салют, лимузин' },
];
const WEDDING_JOKES = [
  'Михалыч сказал тост на 15 минут и уснул на салате',
  'Шнырь украл туфлю невесты и потребовал выкуп — 500 ₽',
  'Тамада заставил тебя пить шампанское из туфли',
  'Свидетель подрался со свидетельницей. Помирились к торту',
  'Голубь Гоша сел на фату. Лучшее фото дня',
  'Эдик прислал открытку «Поздравляю, неудачник». Гости посмеялись над Эдиком',
];

function girlIdx(id) { return GIRLS.findIndex((g) => g.id === id); }
function wife() { return S.married && S.girlfriend ? GIRLS.find((g) => g.id === S.girlfriend) : null; }

function propose() {
  const g = GIRLS.find((x) => x.id === S.girlfriend);
  if (!g || S.married) return;
  if (S.engaged && S.engaged.gid === g.id) { weddingChoice(g, false); return; }
  const ring = RINGS[girlIdx(g.id)];
  if (S.money < ring || girlState(g.id).rel < 100) return;
  S.money -= ring;
  const ok = Math.random() < clamp(0.65 + charm() - g.picky * 0.5, 0.2, 0.95);
  if (!ok) {
    girlState(g.id).rel = 70;
    addMood(-15);
    const lost = Math.random() < 0.3;
    resultModal({ emoji: '💔', rays: 'bad', title: '«Мне надо подумать…»',
      text: lost ? `${g.name} швырнула кольцо в пруд со словами «Я не готова». Кольцо за ${fmt(ring)} ₽ кормит рыб. −15 😊` : `${g.name} не готова. Кольцо вернула — сдал обратно в ломбард за полцены. −15 😊`, btn: 'Эх' });
    if (!lost) addMoney(Math.round(ring / 2));
    sfx('bad');
    return;
  }
  sfx('good');
  confetti(60);
  S.engaged = { gid: g.id, ring };
  weddingChoice(g, true);
}

// Помолвка: «Да» уже получено, кольцо куплено. Свадьбу можно выбрать сейчас или позже,
// а если не хватает денег — отменить предложение и сдать кольцо обратно по полной цене
function weddingChoice(g, fresh) {
  const e = S.engaged;
  const any = WEDDINGS.some((w) => S.money >= w.price);
  openModal(`<div class="big-art"><div class="rays"></div><div class="big-emoji">💍</div></div>
    <h3>${fresh ? `${g.name}: «Да!»` : `Помолвка с ${g.name.split(' ').pop()}`}</h3><p>Осталось выбрать свадьбу. Гости подарят конверты, а после — медовый месяц.</p>
    ${any ? '' : `<div class="info-card warn">На свадьбу пока не хватает денег. Закрой окно и накопи — кольцо уже у неё, второй раз платить не придётся. Или отмени предложение — кольцо вернут за ${fmt(e.ring)} ₽.</div>`}
    <div class="list">${WEDDINGS.map((w) => card({ thumb: w.emoji, title: w.name, desc: `${w.desc}<br><b>+${w.mood} 😊 · 💒 медовый месяц ${w.honey} мин${w.gifts ? ` · подарки ~${Math.round(w.gifts * 100)}% цены` : ''}</b>`,
      btn: priceBtn('wedding', w.id, w.price, S.money >= w.price) })).join('')}</div>
    <div class="btns"><button class="btn wide" data-act="close">◀ Назад — выберу позже</button>
      <button class="btn wide dark-path" data-act="engageCancel">💔 Отменить предложение · вернуть ${fmt(e.ring)} ₽</button></div>`, { center: true });
}

function cancelEngagement() {
  const e = S.engaged;
  if (!e || S.married) return;
  S.engaged = null;
  addMoney(e.ring);
  const g = GIRLS.find((x) => x.id === e.gid);
  if (g) girlState(g.id).rel = Math.min(girlState(g.id).rel, 85);
  closeModal();
  sfx('bad');
  resultModal({ emoji: '💍', rays: 'bad', title: 'Предложение отменено', text: `Кольцо вернулось в ювелирный — тебе отдали все <b>${fmt(e.ring)} ₽</b>.${g ? ` ${g.name.split(' ').pop()} расстроилась, но не ушла (отношения ${Math.floor(girlState(g.id).rel)}/100).` : ''} Сделать предложение можно будет снова.`, btn: 'Понятно' });
}

// Девушка сменилась или ушла — помолвка сгорает
HOOKS.tick.push(() => { if (S.engaged && (S.married || S.engaged.gid !== S.girlfriend)) S.engaged = null; });

function startWedding(id) {
  const w = WEDDINGS.find((x) => x.id === id);
  if (S.money < w.price || S.married) return;
  S.money -= w.price;
  S.engaged = null;
  runGame({ title: 'Первый танец', hint: 'Жми «Шаг», когда сердечко доезжает до линии. Все смотрят!', duration: 0, scoreLabel: ' 💃',
    setup: (mg) => gameRhythm(mg, { btn: '💃 Шаг', items: ['💞', '💃', '🕺'], notes: 10, lyric: '🎻 Вальс молодожёнов', perfect: 'Как в кино! 💞', fail: 'Наступил на платье!' }),
    finish: (score) => finishWedding(w, clamp(score / 15, 0, 1)) });
}

function finishWedding(w, perf) {
  const g = GIRLS.find((x) => x.id === S.girlfriend);
  S.married = true;
  S.wifeDue = Date.now() + MONTH_MS;
  girlState(g.id).rel = 100;
  addMood(w.mood);
  addEffect('married', w.honey);
  const gifts = Math.round(w.price * w.gifts * (0.7 + perf * 0.6));
  if (gifts) addMoney(gifts);
  track('wedding');
  confetti(120);
  sfx('levelup');
  resultModal({ emoji: '💒', title: `Свадьба! ${g.name} теперь твоя жена`,
    text: `Первый танец: ${perf >= 0.7 ? 'гости аплодировали стоя' : perf >= 0.4 ? 'неплохо, почти не наступил на платье' : 'отдавил невесте обе ноги'}.<br>${pick(WEDDING_JOKES)}.
      ${gifts ? `<br>Гости надарили <b style="color:var(--gold)">${fmt(gifts)} ₽</b>.` : ''}<br><br>💒 Медовый месяц: доход +20%. Жена радует (+1 😊/мин) и подкармливает.
      Раз в игровой месяц семейный бюджет: <b>${fmt(wifeRequestCost(ALLOWANCE[girlIdx(g.id)]))} ₽</b>. Не изменяй — при разводе она заберёт 20% денег и кое-что из имущества!`, btn: 'Горько!' });
}

// Семейная жизнь: бюджет, отношения остывают без свиданий
HOOKS.mods.push((m) => { if (wife()) { m.mpm += 0.5; m.hpm += 0.1; } });
HOOKS.tick.push(() => {
  const g = wife();
  if (!g) return;
  const now = Date.now();
  if (S.food < maxFood() && Math.random() < 0.02) feed(0.5); // жена подкармливает
  if (now < S.wifeDue || !popupTurn(2)) return;
  S.wifeDue = now + MONTH_MS;
  const st = girlState(g.id);
  const sum = wifeRequestCost(ALLOWANCE[girlIdx(g.id)]);
  st.rel = Math.max(0, st.rel - 8);
  if (S.money >= sum) { S.money -= sum; toast(`👰 Семейный бюджет: −${fmt(sum)} ₽. Своди жену на свидание, она скучает`, 'bad'); }
  else { st.rel = Math.max(0, st.rel - 25); toast('👰 Не хватило на семейный бюджет! Жена в ярости', 'bad'); }
  if (st.rel <= 0) startDivorce(true, `${g.name}: «Ты меня совсем не замечаешь. Я подаю на развод!»`);
});

// ---------- Развод ----------

let DIVORCE = null;

function startDivorce(byWife, reason) {
  const g = wife();
  if (!g) return;
  DIVORCE = { byWife };
  sfx('bad');
  openModal(`<div class="big-art"><div class="rays bad"></div><div class="big-emoji">💔</div></div>
    <h3>Развод</h3><p>${reason}</p>
    <p>Можно попробовать <b>договориться мирно</b>: тогда уйдёт только 5% денег на адвоката. Не договоритесь — будет суд.
      <br>В суде она заберёт <b>20% денег</b> и <b>одну вещь из имущества</b> на твой выбор.</p>
    <div class="btns" style="flex-direction:column;gap:8px">
      <button class="btn primary wide" data-act="divPeace">🤝 Договориться мирно</button>
      <button class="btn wide" data-act="divCourt">⚖️ Сразу в суд</button>
    </div>`, { center: true, locked: true });
}

function divorcePeace() {
  const g = wife();
  if (!g) return;
  const rel = girlState(g.id).rel;
  runGame({ title: 'Переговоры', hint: 'Отвечай так, чтобы разойтись по-хорошему', duration: 30, scoreLabel: ' 🤝',
    setup: (mg) => talkGame(mg, DIVORCE_TALK, 4),
    finish: (score) => {
      const chance = clamp(0.2 + score * 0.08 + rel / 400 - (DIVORCE && DIVORCE.byWife ? 0.1 : 0), 0.05, 0.95);
      if (Math.random() < chance) {
        const fee = Math.floor(S.money * 0.05);
        S.money -= fee;
        endMarriage(40);
        resultModal({ emoji: '🤝', title: 'Разошлись мирно', text: `Договорились без суда. Адвокат взял ${fmt(fee)} ₽. ${g.name} иногда даже здоровается.`, btn: 'Свобода' });
        return;
      }
      toast('Не договорились. Встретимся в суде!', 'bad');
      divorceCourt();
    } });
}

// Имущество, которое можно отдать при разводе
function divorceAssets() {
  const out = [];
  BUSINESSES.forEach((b) => { if (S.biz[b.id]) out.push({ id: `biz:${b.id}`, emoji: b.emoji, name: b.name, value: businessInvestment(b,S.biz[b.id])+businessPayout(S.biz[b.id]).net }); });
  if (S.transport > 0) { const t = TRANSPORT[S.transport]; out.push({ id: 'car', emoji: t.emoji, name: t.name, value: t.price }); }
  if (S.ownedHousing >= 3) { const h = HOUSING[S.ownedHousing]; out.push({ id: 'house', emoji: '🏠', name: h.name, value: h.price }); }
  S.pets.filter((id) => !S.shelter.includes(id)).forEach((id) => { const p = PETS.find((x) => x.id === id); out.push({ id: `pet:${id}`, emoji: '🐾', name: p.name, value: p.price || 1000 }); });
  for (const slot of ['hat', 'body', 'shoes']) {
    CLOTHES[slot].filter((it) => it.tier >= 2 && !it.season && S.owned[slot].includes(it.id))
      .forEach((it) => out.push({ id: `cl:${slot}:${it.id}`, emoji: '👔', name: it.name, value: it.price }));
  }
  return out.sort((a, b) => b.value - a.value);
}

function divorceCourt() {
  const g = wife();
  if (!g) return;
  const assets = divorceAssets();
  const part = assets.length ? 0.2 : 0.3;
  const lost = Math.floor(S.money * part);
  S.money -= lost;
  if (!assets.length) {
    endMarriage(0);
    resultModal({ emoji: '⚖️', rays: 'bad', title: 'Суд', text: `Имущества нет, поэтому ${g.name} забрала ${Math.round(part * 100)}% денег: ${fmt(lost)} ₽.`, btn: 'Эх…' });
    return;
  }
  openModal(`<div class="big-emoji" style="font-size:56px;text-align:center">⚖️</div><h3>Решение суда</h3>
    <p>${g.name} забирает <b>${fmt(lost)} ₽</b> (20% денег). И ещё одну вещь — выбирай, с чем расстанешься:</p>
    <div class="list">${assets.map((a) => card({ thumb: a.emoji, title: a.name, desc: `~${fmt(a.value)} ₽`,
      btn: `<button class="btn" data-act="divGive" data-id="${a.id}">Отдать</button>` })).join('')}</div>`, { center: true, locked: true });
}

function divorceGive(id) {
  const g = wife();
  if (!g) return;
  const [kind, a, b] = id.split(':');
  let name = '';
  if (kind === 'managed') { const e=managedBusinesses().find(e=>e.key===a);if(!e)return;name=e.name+' · '+e.cityName;S.managedBusinesses=S.managedBusinesses.filter(e=>e.key!==a); }
  if (kind === 'biz') { name = BUSINESSES.find((x) => x.id === a).name; delete S.biz[a]; if(a==='club')S.clubStaff={}; }
  if (kind === 'car') { name = TRANSPORT[S.transport].name; S.transport = 0; S.transportBroken = false; }
  if (kind === 'house') {
    name = HOUSING[S.ownedHousing].name;
    S.ownedHousing--;
    if (S.housingMode === 'own' && S.housing > S.ownedHousing) { S.housing = S.ownedHousing; S.breakdowns = []; renderScene(); }
  }
  if (kind === 'pet') {
    name = PETS.find((x) => x.id === a).name;
    S.pets = S.pets.filter((x) => x !== a);
    if (S.pet === a) S.pet = null;
  }
  if (kind === 'cl') {
    name = CLOTHES[a].find((x) => x.id === b).name;
    S.owned[a] = S.owned[a].filter((x) => x !== b);
    if (S.eq[a] === b) { S.eq[a] = CLOTHES[a][0].id; renderedLook = ''; }
  }
  endMarriage(0);
  resultModal({ emoji: '📦', rays: 'bad', title: 'Развод оформлен', text: `${g.name} ушла и забрала ${name.startsWith('«') ? name : `«${name}»`}. Михалыч: «Ничего, Валера, зато теперь вся лавка твоя».`, btn: 'Жизнь продолжается' });
}

function endMarriage(rel) {
  const g = wife();
  if (g) girlState(g.id).rel = rel;
  S.married = false;
  S.girlfriend = null;
  S.effects = S.effects.filter((e) => e.id !== 'married');
  addEffect('heartbreak', 15);
  addMood(-20);
  track('divorce');
  DIVORCE = null;
  save();
}

// Вкладка «Свидания» с семейным блоком
EXTRA_TABS.fun.dates = () => {
  const cd = cdLeft('date');
  const gf = S.girlfriend ? GIRLS.find((g) => g.id === S.girlfriend) : null;
  let family = '';
  if (gf && S.married) {
    const st = girlState(gf.id);
    family = `<div class="premium-hero wife-hero"><div class="e">👰</div><div><b>Жена: ${gf.name}</b>
        <p>Отношения ${Math.floor(st.rel)}/100 · доверие ${Math.round(S.trust === undefined ? 70 : S.trust)}/100. Семейный бюджет ${fmt(wifeRequestCost(ALLOWANCE[girlIdx(gf.id)]))} ₽ через <span data-until="${S.wifeDue}"></span>.
        Своди жену на свидание, чтобы не остыла. Изменишь — может подать на развод.</p></div></div>
      <button class="btn wide" data-act="divorceAsk">💔 Подать на развод</button>`;
  } else if (gf) {
    const st = girlState(gf.id), ring = RINGS[girlIdx(gf.id)];
    family = `<div class="premium-hero wife-hero"><div class="e">💑</div><div><b>Твоя девушка: ${gf.name}</b>
        <p>+0.5 радости/мин · доверие ${Math.round(S.trust === undefined ? 70 : S.trust)}/100. ${st.rel >= 100 ? 'Отношения на максимуме — можно делать предложение!' : `Доведи отношения до 100, чтобы сделать предложение (${Math.floor(st.rel)}/100).`}</p></div></div>
      ${S.engaged && S.engaged.gid === gf.id ? '<button class="btn primary wide" data-act="propose">💒 Помолвлены — выбрать свадьбу</button>'
        : st.rel >= 100 ? priceBtn('propose', '', ring, S.money >= ring, `💍 Предложение · кольцо ${fmt(ring)} ₽`).replace('class="btn', 'class="btn wide') : ''}`;
  }
  return `<div class="info-card">Каждое свидание — мини-игра: прогулка, разговор или танец. Чем лучше сыграешь, тем выше шанс. Шансы зависят и от одежды, жилья, образования, силы, радости и здоровья.
      ${cd > 0 ? `<br>⏳ Следующее свидание через <b><span data-until="${S.cd.date}"></span></b>` : ''}</div>
    ${family}
    ${hasSti() ? '<div class="info-card warn">Что-то чешется… Сходи к врачу, пока не заразил свою девушку.</div>' : ''}` +
    GIRLS.map((g) => {
      const st = S.girls[g.id] || { met: false, rel: 0 };
      const mine = S.girlfriend === g.id;
      const ok = mine || reqOk(g.req);
      const hearts = '❤️'.repeat(Math.floor(st.rel / 20)) + '🤍'.repeat(5 - Math.floor(st.rel / 20));
      let btn;
      if (!ok) btn = lockBtn;
      else if (mine) btn = `<button class="btn green" data-act="dateMenu" data-id="${g.id}" ${cd > 0 ? 'disabled' : ''}>${S.married ? '👰' : '💍'} Свидание</button>`;
      else if (!st.met) btn = `<button class="btn primary" data-act="meet" data-id="${g.id}" ${cd > 0 ? 'disabled' : ''}>Познакомиться</button>`;
      else btn = `<button class="btn ${gf ? '' : 'primary'}" data-act="dateMenu" data-id="${g.id}" ${cd > 0 ? 'disabled' : ''}>${gf ? '😏 Налево' : 'Свидание'}</button>`;
      return card({ thumb: g.emoji, title: g.name, btn, cls: ok ? '' : 'locked',
        desc: `${g.desc}${ok && !st.met && !mine ? `<br>Шанс познакомиться: <b>${Math.round(meetChance(g) * 100)}%</b>` : ''}${gf && !mine && st.met ? '<br><span style="color:var(--red)">Измена: могут спалить и заразить</span>' : ''}`,
        extra: (st.met ? `<div class="hearts">${hearts} ${Math.floor(st.rel)}/100</div>` : '') + (ok ? '' : reqHTML(g.req)) });
    }).join('');
};

Object.assign(ACTIONS, {
  propose: () => propose(),
  wedding: (id) => startWedding(id),
  engageCancel: () => cancelEngagement(),
  divorceAsk: () => {
    const g = wife();
    if (!g) return;
    startDivorce(false, `Ты решил развестись с ${g.name.split(' ').pop()}.`);
  },
  divPeace: () => divorcePeace(),
  divCourt: () => divorceCourt(),
  divGive: (id) => divorceGive(id),
});

// =====================================================================
// 3. Питомцы: корм, болезни, ветеринар, приют
// =====================================================================

// for — каким питомцам подходит (пусто — всем). sick — шанс заболеть после кормёжки
const PET_FOOD = [
  { id: 'scraps', name: 'Объедки', emoji: '🦴', price: 5, food: 25, sick: 0.15, desc: 'Дёшево, но можно отравить питомца' },
  { id: 'grain', name: 'Пшено', emoji: '🌾', price: 30, food: 45, for: ['pigeon', 'parrot'], desc: 'Для птиц' },
  { id: 'cheese', name: 'Сыр «Российский»', emoji: '🧀', price: 40, food: 45, for: ['rat', 'hedgehog'], desc: 'Крысы и ежи в восторге' },
  { id: 'dry', name: 'Сухой корм', emoji: '🥫', price: 60, food: 45, for: ['dog', 'cat'], desc: 'Для собак и котов' },
  { id: 'apple', name: 'Яблоки и червячки', emoji: '🍎', price: 50, food: 45, for: ['hedgehog', 'parrot'], desc: 'Витамины для ежа и попугая' },
  { id: 'premium', name: 'Премиум-корм «Royal Барсик»', emoji: '🥩', price: 400, food: 70, hp: 15, desc: 'Подходит всем, укрепляет здоровье' },
];
const PACK = 5;
const PET_SICK = {
  fleas: { name: 'Блохи', emoji: '🪳', symptom: 'всё время чешется', price: 150 },
  worms: { name: 'Глисты', emoji: '🪱', symptom: 'ест за двоих, но худеет', price: 250 },
  flu: { name: 'Простуда', emoji: '🤧', symptom: 'чихает и кашляет', price: 400 },
  paw: { name: 'Поранил лапу', emoji: '🩹', symptom: 'хромает', price: 300 },
  belly: { name: 'Расстройство желудка', emoji: '🤢', symptom: 'грустит и не играет', price: 200 },
};

function petFoodFor(petId) { return PET_FOOD.filter((f) => !f.for || f.for.includes(petId)); }
function vetPrice() { const p = activePet(); return S.petSick ? Math.round(PET_SICK[S.petSick].price * (1 + PETS.indexOf(p) * 0.4)) : 0; }
function shelterPrice(id) { const p = PETS.find((x) => x.id === id); return Math.max(300, Math.round((p.price || 1000) * 0.5)); }

petHappy = function () { return !!S.pet && S.petFood > 20 && !S.petSick; };

function petGetSick(kind) {
  if (!S.pet || S.petSick) return;
  S.petSick = kind || pick(Object.keys(PET_SICK));
  const p = activePet(), s = PET_SICK[S.petSick];
  toast(`🐾 ${p.name} ${s.symptom}. Похоже, заболел — к ветеринару!`, 'bad');
  sfx('bad');
}

HOOKS.mods.push((m) => { if (S.pet && S.petSick) m.mpm -= 0.3; });
HOOKS.tick.push(() => {
  ensureLife();
  if (!S.pet) return;
  const now = Date.now();
  const h = (now - S.petHpAt) / 3600000;
  if (h < 1 / 60) return; // раз в минуту
  S.petHpAt = now;
  // Глисты: голодает вдвое быстрее
  if (S.petSick === 'worms') S.petFood = Math.max(0, S.petFood - 10 * h);
  let d = 0;
  if (S.petSick) d -= 6;
  if (S.petFood <= 0) d -= 4;
  if (!d) d = 3;
  S.petHp = clamp(S.petHp + d * h, 0, 100);
  // Шанс заболеть: примерно раз в 6–8 часов, у голодного и слабого чаще
  const risk = (0.0025 + (S.petFood <= 20 ? 0.006 : 0) + (S.petHp < 50 ? 0.004 : 0)) * h * 60;
  if (!S.petSick && Math.random() < risk) petGetSick();
  if (S.petHp <= 0) {
    const p = activePet();
    S.shelter.push(p.id);
    S.pet = null; S.petSick = null; S.petHp = 60;
    resultModal({ emoji: '🏚️', rays: 'bad', title: `${p.name} в приюте`, text: 'Питомец ослаб от голода и болезни, и его забрали волонтёры. Вернуть можно в «Питомцах» — заплатив приюту за лечение.', btn: 'Эх…' });
  }
});

// Больной питомец выглядит грустным и с градусником
HOOKS.hud.push(() => {
  const pet = document.querySelector('#petSlot .pet');
  if (pet) pet.classList.toggle('sick', !!S.petSick);
});

EXTRA_TABS.shop.pets = () => {
  ensureLife();
  const p = activePet();
  let top = '';
  if (p) {
    const foods = petFoodFor(p.id);
    const s = S.petSick && PET_SICK[S.petSick];
    top = card({ thumb: PET_ART[p.art], title: `${p.name} с тобой`, cls: 'current',
      desc: `${p.perk}<br>🍖 Сытость <b>${Math.floor(S.petFood)}/100</b> · ❤️ Здоровье <b>${Math.floor(S.petHp)}/100</b>
        ${S.petFood <= 20 ? '<br><span style="color:var(--red)">Голодный — бонусов нет!</span>' : ''}
        ${s ? `<br><span style="color:var(--red)">${s.emoji} ${p.name} ${s.symptom}</span>` : ''}` })
      + (s ? card({ thumb: '🩺', title: 'Ветеринар Айболит', desc: `Диагноз: <b>${s.name}</b>. Вылечит и даст витамины (+20 здоровья).<br>Без лечения питомец слабеет и может попасть в приют.`,
        btn: priceBtn('vetTreat', '', vetPrice(), S.money >= vetPrice()) }) : '')
      + `<div class="subhead">Миска · корм в запасе</div>`
      + foods.map((f) => {
        const have = S.petPantry[f.id] || 0;
        return card({ thumb: f.emoji, title: `${f.name}${have ? ` ×${have}` : ''}`, desc: `${f.desc}<br><b>+${f.food} сытости${f.hp ? `, +${f.hp} здоровья` : ''}</b>`,
          btn: `<div class="btn-col"><button class="btn green small" data-act="petFeedItem" data-id="${f.id}" ${have && S.petFood < 98 ? '' : 'disabled'}>Покормить</button>
            ${priceBtn('petFoodBuy', f.id, f.price * PACK, S.money >= f.price * PACK, `${PACK} шт · ${fmt(f.price * PACK)} ₽`).replace('class="btn', 'class="btn small')}</div>` });
      }).join('');
  }
  return `<div class="info-card">Питомцы — для души. Их надо кормить (корм покупается здесь, объедки иногда находятся в мусорке) и лечить у ветеринара. Голодный или больной питомец не даёт бонусов.</div>
    ${top}
    <div class="subhead">Все питомцы</div>
    ${PETS.map((pet) => {
      const owned = S.pets.includes(pet.id);
      const inShelter = S.shelter.includes(pet.id);
      const lvlOk = level() >= (pet.level || 1);
      let btn;
      if (inShelter) btn = priceBtn('shelterTake', pet.id, shelterPrice(pet.id), S.money >= shelterPrice(pet.id), `🏚️ ${fmt(shelterPrice(pet.id))}`);
      else if (S.pet === pet.id) btn = '<button class="btn" disabled>С тобой</button>';
      else if (owned) btn = `<button class="btn green" data-act="petPick" data-id="${pet.id}">Взять</button>`;
      else if (pet.quest) btn = '<button class="btn" disabled>📖 Сюжет</button>';
      else if (!lvlOk) btn = lockBtn;
      else btn = priceBtn('petBuy', pet.id, pet.price, S.money >= pet.price);
      return card({ thumb: PET_ART[pet.art], title: pet.name, desc: inShelter ? 'В приюте. Забери и больше не бросай!' : pet.perk, cls: owned || lvlOk ? '' : 'locked',
        extra: !owned && !lvlOk ? reqHTML({ level: pet.level }) : '', btn });
    }).join('')}`;
};

const basePetPick = ACTIONS.petPick;
Object.assign(ACTIONS, {
  petFoodBuy: (id) => {
    const f = PET_FOOD.find((x) => x.id === id);
    if (S.money < f.price * PACK) return;
    S.money -= f.price * PACK;
    S.petPantry[id] = (S.petPantry[id] || 0) + PACK;
    sfx('buy');
  },
  petFeedItem: (id) => {
    const f = PET_FOOD.find((x) => x.id === id);
    const p = activePet();
    if (!p || !S.petPantry[id] || S.petFood >= 98) return;
    S.petPantry[id]--;
    S.petFood = Math.min(100, S.petFood + f.food);
    S.petFedAt = Date.now();
    if (f.hp) S.petHp = Math.min(100, S.petHp + f.hp);
    sfx(p.sound);
    if (f.sick && Math.random() < f.sick) { petGetSick('belly'); return; }
    toast(`${f.emoji} ${p.name} поел и доволен`, 'good');
  },
  vetTreat: () => {
    const price = vetPrice();
    if (!S.petSick || S.money < price) return;
    S.money -= price;
    const s = PET_SICK[S.petSick];
    S.petSick = null;
    S.petHp = Math.min(100, S.petHp + 20);
    track('vet');
    sfx('good');
    toast(`🩺 ${s.name} вылечено! Питомец снова весел`, 'good');
  },
  shelterTake: (id) => {
    const price = shelterPrice(id);
    if (!S.shelter.includes(id) || S.money < price) return;
    S.money -= price;
    S.shelter = S.shelter.filter((x) => x !== id);
    S.pet = id; S.petFood = 60; S.petHp = 60; S.petSick = null; S.petFedAt = Date.now();
    sfx(PETS.find((x) => x.id === id).sound);
    toast('🐾 Питомец снова с тобой и очень рад!', 'good');
  },
  petPick: (id) => { if (S.shelter.includes(id)) return; S.petSick = null; basePetPick(id); },
});

// =====================================================================
// 4. Мусорка: больше находок и приколов
// =====================================================================

Object.assign(ITEMS, {
  cassette: { name: 'Кассета «Ласковый май»', emoji: '📼', base: 30, w: 18 },
  teeth: { name: 'Золотая коронка', emoji: '🦷', base: 900, w: 4 },
  samovar: { name: 'Самовар', emoji: '🫖', base: 1500, w: 3 },
  coin: { name: 'Царская монета', emoji: '🪙', base: 4000, w: 1 },
});

function giveScraps(n) { ensureLife(); S.petPantry.scraps = (S.petPantry.scraps || 0) + n; }

LOOT.push(
  // Хорошее
  { name: 'Полбатона колбасы', emoji: '🥖', rarity: 'common', w: 10, give: () => {
      feed(20);
      if (Math.random() < 0.3) { addEffect('poison', 3); return 'Сытость +20. Колбаса была с «ароматом»… 🤢 Отравление'; }
      return 'Сытость +20. Докторская, почти свежая!'; } },
  { name: 'Ящик пустых бутылок', emoji: '🍾', rarity: 'common', w: 9, give: () => { const b = 60 + S.housing * 30; addBottles(b); return `Кто-то устроил праздник! +${fmt(b)} бутылок`; } },
  { name: 'Банка огурцов', emoji: '🥒', rarity: 'common', w: 6, give: () => {
      feed(10);
      const had = hasEffect('hangover');
      S.effects = S.effects.filter((e) => e.id !== 'hangover');
      return had ? 'Рассол — лучшее лекарство! Похмелье прошло, сытость +10' : 'Хрустящие! Сытость +10'; } },
  { name: 'Объедки для питомца', emoji: '🦴', rarity: 'common', w: 7, give: () => (giveScraps(3), '+3 порции объедков в миску питомца') },
  { name: 'Книга «Как стать миллионером»', emoji: '📕', rarity: 'common', w: 5, give: () => { addXp(10); addMood(4); return 'Прочитал по диагонали. +10 опыта, +4 😊'; } },
  { name: 'Сломанная гитара', emoji: '🎸', rarity: 'common', w: 4, give: () => { addMood(8); addItem('scrap', 2); return 'Сыграл «Звезду по имени Солнце» на трёх струнах. +8 😊, +2 🔩'; } },
  { name: 'Букет цветов', emoji: '💐', rarity: 'common', w: 4, give: () => {
      addMood(6);
      if (S.girlfriend) { const st = girlState(S.girlfriend); st.rel = Math.min(100, st.rel + 5); return 'Подарил своей! +5 ❤️ к отношениям, +6 😊'; }
      return 'Немного помятый, но красивый. +6 😊'; } },
  { name: 'Почти полный коньяк', emoji: '🥃', rarity: 'common', w: 4, give: () => {
      addMood(20);
      if (Math.random() < 0.5) { addEffect('hangover', 5); return '+20 😊… а утром 🥴 похмелье'; }
      return '+20 😊. Армянский, пять звёзд!'; } },
  { name: 'Пицца в коробке', emoji: '🍕', rarity: 'common', w: 6, give: () => (feed(25), addMood(3), 'Три куска пепперони! Сытость +25, +3 😊') },
  { name: 'Ноутбук «Пентиум»', emoji: '💻', rarity: 'rare', w: 3, give: () => { const m = Math.round(500 * scale()); addMoney(m); return `Включился! Продал студенту: +${fmt(m)} ₽`; } },
  { name: 'Кошелёк с документами', emoji: '👛', rarity: 'rare', w: 3, give: () => {
      const m = Math.round(250 * scale()); addMoney(m); addMood(10); addXp(10);
      return `Вернул владельцу. Тот прослезился и дал ${fmt(m)} ₽ вознаграждения. +10 😊`; } },
  { name: 'Шуба «почти норка»', emoji: '🧥', rarity: 'rare', w: 2, give: () => { const m = Math.round(400 * scale()); addMoney(m); return `Моль поела, но Шнырь взял: +${fmt(m)} ₽`; } },
  { name: '5000 в старых джинсах', emoji: '💵', rarity: 'epic', w: 1, give: () => { const m = 5000; addMoney(m); addMood(25); return `Пятитысячная купюра в кармане! +${fmt(m)} ₽, +25 😊`; } },
  { name: 'Конверт с крышками', emoji: '✉️', rarity: 'epic', w: 0.5, give: () => (addCaps(2), '+2 золотые крышки') },
  // Приколы и неудачи
  { name: 'Сосед Гена спит в баке', emoji: '😪', rarity: 'bad', w: 5, give: () => {
      addMood(-5);
      if (Math.random() < 0.4) { addBottles(15); return 'Гена проснулся, поворчал… и угостил бутылками. −5 😊, +15 🍾'; }
      return 'Гена проснулся и обматерил тебя на весь двор. −5 😊'; } },
  { name: 'Чайка украла добычу', emoji: '🐦', rarity: 'bad', w: 4, give: () => { const lost = Math.floor(S.bottles * 0.1); S.bottles -= lost; return `Пока копался, чайка утащила пакет. −${fmt(lost)} бутылок`; } },
  { name: 'Мусоровоз!', emoji: '🚛', rarity: 'bad', w: 4, give: () => {
      addMood(-10);
      if (Math.random() < 0.3) { addEffect('lice'); return 'Опрокинули бак прямо на тебя. −10 😊 и 🪳 вши'; }
      return 'Опрокинули бак прямо на тебя. −10 😊. Запах на весь район'; } },
  { name: 'Бабка с балкона', emoji: '👵', rarity: 'bad', w: 4, give: () => (addMood(-6), 'Вылила ведро воды с криком «Пошёл отсюда!». −6 😊') },
  { name: 'Злая собака', emoji: '🐕', rarity: 'bad', w: 4, give: () => { S.energy = Math.max(0, S.energy - 20); return 'Гнала тебя три квартала. −20 ⚡. Зато кардио!'; } },
  { name: 'Осиное гнездо', emoji: '🐝', rarity: 'bad', w: 3, give: () => (hurt(6), addMood(-5), 'Искусали! −6 ❤️, −5 😊. Лицо как у боксёра') },
  { name: 'Застрял в баке', emoji: '🗑️', rarity: 'bad', w: 3, give: () => { addMood(-4); const m = Math.round(rand(10, 40)); addMoney(m); return `Торчал вверх ногами полчаса. Прохожие фотографировали и кидали мелочь: −4 😊, +${m} ₽`; } },
  { name: 'Тебя сняли для мемов', emoji: '📸', rarity: 'bad', w: 3, give: () => { addMood(-5); return 'Блогер снял, как ты достаёшь банан из бака. Миллион просмотров. −5 😊'; } },
);
