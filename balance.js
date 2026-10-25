// Баланс 1.8: драки с ботами и случайные события.
//
// Драки: три соперника — лёгкий, равный и сильный. Их сила подгоняется под твою (≈80% / 100% / 120%),
// а награда и рейтинг зависят от сложности. Боты подстраиваются под твои привычки: сильный быстрее
// замечает, что ты спамишь один приём, и отвечает на него.
//
// События: плохих теперь не больше 45% (у прокачанного — 30%), после двух плохих подряд обязательно хорошее,
// добрые дела (карма) немного повышают удачу. В каждом крупном событии есть безопасный вариант,
// а у рискованных показан шанс. События не повторяются подряд.

// =====================================================================
// Драки
// =====================================================================
const RIVAL_TIERS = [
  { id: 'easy', name: 'Лёгкий', emoji: '🟢', power: 0.8, reward: 0.7, rating: -90, adapt: 0 },
  { id: 'even', name: 'Равный', emoji: '🟡', power: 1.0, reward: 1.0, rating: 0, adapt: 0.15 },
  { id: 'hard', name: 'Сильный', emoji: '🔴', power: 1.2, reward: 1.7, rating: 110, adapt: 0.3 },
];

genRival = function (i) {
  const t = RIVAL_TIERS[i] || RIVAL_TIERS[1];
  const me = myFighter();
  const used = (fightState().rivals || []).map((r) => r.name);
  const lvl = Math.max(1, me.level + [-1, 0, 1][i] + Math.floor(rand(-1, 2)));
  const myTier = me.tier;
  const eq = randomEq(clamp(Math.round(myTier / 2) + (i === 2 ? 1 : 0), 0, 3));
  const op = {
    id: Date.now() + i, name: pick(RIVAL_NAMES.filter((n) => !used.includes(n))) || pick(RIVAL_NAMES), level: lvl,
    style: pick(Object.keys(STYLES)), eq, diff: t.id, adapt: t.adapt, rewardK: t.reward,
    form: clamp(me.form + rand(-8, 8), 0, 100), strength: clamp(me.strength + rand(-8, 8), 0, 100),
    tier: CLOTHES.body.find((x) => x.id === eq.body).tier + CLOTHES.shoes.find((x) => x.id === eq.shoes).tier,
    rating: Math.max(800, Math.round(fightState().rating + t.rating + rand(-40, 40))), hpMult: 1,
  };
  // Подгоняем силу соперника к нужной доле твоей: сначала здоровьем, потом атакой через силу
  const target = fighterPower({ ...me, hpMult: 1 }) * t.power * rand(0.96, 1.04);
  for (let k = 0; k < 24; k++) {
    const ratio = fighterPower(op) / target;
    if (Math.abs(ratio - 1) < 0.02) break;
    op.hpMult = clamp(op.hpMult / Math.sqrt(ratio), 0.55, 1.8);
    if (op.hpMult === 0.55 || op.hpMult === 1.8) op.strength = clamp(op.strength / ratio, 0, 100);
  }
  return op;
};
// Список соперников всегда в порядке «лёгкий → сильный»; старые соперники без сложности пересоздаются
const _ensureRivalsBal = ensureRivals;
ensureRivals = (force) => {
  const st = fightState();
  if (st.rivals.length && !st.rivals[0].diff) force = true;
  return _ensureRivalsBal(force);
};

const _fightRewardBal = fightReward;
fightReward = (op) => Math.round(_fightRewardBal(op) * (op.rewardK || 1));

// Бот запоминает три твоих последних приёма и отвечает на любимый
aiMove = function (en) {
  const w = { ...STYLES[en.style || 'tactic'].w };
  const hist = (FIGHT && FIGHT.hist) || [];
  const adapt = en.adapt === undefined ? 0.15 : en.adapt;
  if (adapt && hist.length >= 2) {
    const last = hist.slice(-3);
    const fav = ['hit', 'heavy', 'block', 'dodge'].find((m) => last.filter((x) => x === m).length >= 2);
    if (fav === 'block') w.heavy += adapt * 2;   // ты в блоке — пробивает мощным
    if (fav === 'heavy') w.dodge += adapt * 2;   // ты бьёшь мощным — уклоняется
    if (fav === 'hit') w.block += adapt * 1.5;   // ты бьёшь обычным — ставит блок
    if (fav === 'dodge') w.hit += adapt * 1.5;   // ты уклоняешься — бьёт быстрыми
  }
  // Добивает, если у тебя мало здоровья, и бережёт выносливость
  if (FIGHT && FIGHT.me.hp < FIGHT.me.max * 0.25) w.heavy += 0.15;
  if (en.st < 25) w.heavy = 0;
  if (en.st < 10) { w.hit = 0; w.dodge = 0; }
  if (en.hp < en.max * 0.3) { w.block += 0.12; w.dodge += 0.08; }
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  return Object.keys(w).find((k) => (r -= w[k]) < 0) || 'block';
};
const _fightMoveBal = fightMove;
fightMove = (move) => {
  const f = FIGHT;
  const ok = f && !f.busy && (MOVES[move].st <= 0 || f.me.st >= MOVES[move].st);
  const p = _fightMoveBal(move); // бот выбирает ход синхронно в начале — твой текущий ход он ещё не видит
  if (ok) f.hist = [...(f.hist || []), move];
  return p;
};

// Метка сложности у соперника в списке
const _fightsTabBal = EXTRA_TABS.fun.fights;
EXTRA_TABS.fun.fights = () => {
  let html = _fightsTabBal();
  ensureRivals().forEach((op) => {
    const t = RIVAL_TIERS.find((x) => x.id === op.diff);
    if (t) html = html.replace(`${op.name} <span style="color:var(--muted);font-weight:500">`, `<span class="diff-tag ${t.id}">${t.emoji} ${t.name}</span> ${op.name} <span style="color:var(--muted);font-weight:500">`);
  });
  return html;
};

// =====================================================================
// Случайные события
// =====================================================================
let badStreak = 0;
const recentEvents = [];
badChance = function () {
  if (badStreak >= 2) return 0;
  return clamp(0.45 - power() * 0.012 - Math.min(8, S.karma || 0) * 0.01, 0.3, 0.45);
};

MINI_GOOD.push(
  { e: '🤝', t: 'Тот, кому ты помог, узнал тебя и отблагодарил', run: () => { const m = Math.round(rand(20, 50) * scale()); addMoney(m); addMood(4); return `+${fmt(m)} ₽ +4 😊`; }, cond: () => (S.karma || 0) >= 3 },
  { e: '🍾', t: 'После концерта в парке — гора бутылок', run: () => { const n = 20 + S.housing * 12; addBottles(n); return `+${n} 🍾`; } },
  { e: '🐦', t: 'Синичка села на руку — день удался', run: () => (addMood(8), '+8 😊') },
);
MINI_BAD.push(
  { e: '🧦', t: 'Промочил ноги', run: () => (addMood(-4), S.energy = Math.max(0, S.energy - 5), '−4 😊 −5 ⚡'), cond: () => tierOf('shoes') === 0 },
);

const evMoney = (k) => Math.round(k * scale()); // деньги в событиях растут вместе с жильём

EVENTS.length = 0;
EVENTS.push(
  {
    id: 'wallet', title: 'Нашёл кошелёк', emoji: '👛', text: 'На лавке лежит кожаный кошелёк. Внутри деньги и визитка.',
    options: [
      { label: 'Вернуть хозяину', hint: 'надёжно', run: () => { const m = evMoney(45); addMoney(m); addMood(10); S.karma++; return `Хозяин растрогался и дал ${fmt(m)} ₽. Радость +10`; } },
      { label: 'Оставить себе', hint: 'шанс 55%', run: () => {
          if (Math.random() < 0.55) { const m = evMoney(100); addMoney(m); return `Повезло: +${fmt(m)} ₽`; }
          const m = takeMoney(0.05, 60); addMood(-5); return `Хозяин нашёлся с участковым. Штраф ${fmt(m)} ₽`; } },
    ],
  },
  {
    id: 'janitor', title: 'Дворник наступает', emoji: '🧹', text: 'Злой дворник Палыч гонит тебя с точки и замахивается метлой.',
    options: [
      { label: 'Помочь подмести', hint: '−10 ⚡, заплатит', run: () => { S.energy = Math.max(0, S.energy - 10); const m = evMoney(15); addMoney(m); S.karma++; return `Палыч подобрел и дал ${fmt(m)} ₽. −10 энергии`; } },
      { label: 'Убежать', run: () => { S.energy = Math.max(0, S.energy - 15); return 'Убежал, но запыхался: −15 энергии'; } },
    ],
  },
  {
    id: 'shells', title: 'Наперстки', emoji: '🎲', text: 'Михалыч крутит наперстки: «Угадаешь — удвою!»',
    options: [
      { label: 'Сыграть', hint: 'шанс 48%', run: () => {
          const bet = Math.min(Math.floor(S.money * 0.15), evMoney(150));
          if (bet <= 0) return 'Михалыч: «Без денег не играем, Валера»';
          if (Math.random() < 0.48) { addMoney(bet); addMood(8); return `Угадал! +${fmt(bet)} ₽`; }
          S.money -= bet; addMood(-5); return `Шарик был не там. −${fmt(bet)} ₽`; } },
      { label: 'Отказаться', run: () => { addMood(2); return 'Михалыч: «Ну и правильно. Я жульничаю». +2 😊'; } },
    ],
  },
  {
    id: 'tourists', title: 'Туристы', emoji: '📸', text: 'Группа иностранцев хочет фото с «настоящим русским колоритом».',
    options: [
      { label: 'Позировать с бутылкой', hint: 'надёжно', run: () => { const m = evMoney(30); addMoney(m); addMood(5); return `«Very authentic!» +${fmt(m)} ₽`; } },
      { label: 'Сыграть на балалайке', hint: 'риск', run: () => { const m = Math.round(rand(5, 90) * scale()); addMoney(m); addMood(m > evMoney(40) ? 10 : -3); return m > evMoney(40) ? `Овации! +${fmt(m)} ₽` : `Фальшивил. Дали ${fmt(m)} ₽`; } },
    ],
  },
  {
    id: 'pigeons', title: 'Голуби', emoji: '🕊️', text: 'Стая наглых голубей нацелилась на твой обед.',
    options: [
      { label: 'Отбиваться', run: () => { S.energy = Math.max(0, S.energy - 8); addXp(2); return 'Отбился! −8 энергии, +2 опыта'; } },
      { label: 'Поделиться', run: () => { feed(-8); addMood(6); S.karma++; return 'Голуби довольны. Сытость −8, радость +6'; } },
    ],
  },
  {
    id: 'birthday', title: 'Михалыч зовёт', emoji: '🍻', text: '«Валера, у меня день рождения! Ну, наверное. Давай по чуть-чуть?»',
    options: [
      { label: 'Выпить за здоровье', hint: 'похмелье 50%', run: () => { addMood(15); if (Math.random() < 0.5) { addEffect('hangover', 4); return 'Отметили! Радость +15… и 🥴 похмелье'; } return 'Отметили культурно. Радость +15'; } },
      { label: 'Чай вместо водки', run: () => { addMood(6); heal(2); return 'Михалыч удивился, но чай оценил. +6 😊 +2 ❤️'; } },
    ],
  },
  {
    id: 'granny', title: 'Бабушка с сумками', emoji: '👵', text: 'Старушка еле тащит две огромные сумки до остановки.',
    options: [
      { label: 'Помочь донести', hint: '−15 ⚡', run: () => { S.energy = Math.max(0, S.energy - 15); const m = evMoney(25); addMoney(m); feed(8); addMood(8); S.karma++; return `Бабушка дала ${fmt(m)} ₽ и пирожок. −15 энергии, +8 радости`; } },
      { label: 'Пройти мимо', run: () => { addMood(-2); return 'Совесть немного грызёт. Радость −2'; } },
    ],
  },
  {
    id: 'chain', title: '«Золотая» цепочка', emoji: '📿', get text() { return `Мутный тип в подворотне шепчет: «Золото, 585 проба! Отдам за ${fmt(evMoney(60))} ₽».`; },
    options: [
      { label: 'Купить', hint: 'шанс 30% на ×4', run: () => {
          const price = evMoney(60);
          if (S.money < price) return 'Тип: «Нищеброд!» — и ушёл';
          S.money -= price;
          if (Math.random() < 0.3) { const m = price * 4; addMoney(m); addMood(15); return `Настоящая! Ломбард дал ${fmt(m)} ₽`; }
          addMood(-6); return `Цепочка позеленела через час. −${fmt(price)} ₽`; } },
      { label: 'Отказаться', run: () => 'Тип растворился в темноте' },
    ],
  },
  {
    id: 'raid', title: 'Облава!', emoji: '🚓', text: 'Полиция прочёсывает парк и забирает всех подозрительных.',
    options: [
      { label: 'Бежать', get hint() { return `шанс ${Math.round(clamp(0.55 + S.form / 250, 0, 0.95) * 100)}%`; }, run: () => {
          S.energy = Math.max(0, S.energy - 20);
          if (Math.random() < 0.55 + S.form / 250) return 'Ушёл дворами! −20 энергии';
          const m = takeMoney(0.06, 120); return `Догнали. Штраф ${fmt(m)} ₽ и −20 энергии`; } },
      { label: 'Сидеть тихо', run: () => { const n = Math.min(Math.floor(S.bottles * 0.25), 200 + S.housing * 100); S.bottles -= n; return `Отпустили, но бутылки «конфисковали»: −${fmt(n)} 🍾`; } },
      { label: 'Знакомый участковый', hint: 'нужна карма 3', cond: () => (S.karma || 0) >= 3, run: () => { S.karma = Math.max(0, S.karma - 1); return 'Участковый подмигнул: «Этот свой». Ушёл без потерь'; } },
    ],
  },
  {
    id: 'turf', title: 'Разборка', emoji: '👊', text: 'Банда с соседнего двора требует отдать твою точку сбора бутылок.',
    options: [
      { label: 'Драться', get hint() { return `шанс ${Math.round(clamp(0.35 + S.strength / 150 + S.form / 300, 0.15, 0.85) * 100)}%`; }, run: () => {
          const chance = clamp(0.35 + S.strength / 150 + S.form / 300, 0.15, 0.85);
          if (Math.random() < chance) { const m = evMoney(50); addMoney(m); addBottles(30); addMood(12); return `Победа! Отжал у них ${fmt(m)} ₽ и 30 бутылок`; }
          hurt(15); addMood(-8); return 'Побили. −15 здоровья, −8 радости. Качай силу!'; } },
      { label: 'Уступить', run: () => { addMood(-5); return 'Ушёл искать новое место. −5 радости'; } },
    ],
  },
  {
    id: 'reporter', title: 'Журналист', emoji: '🎙️', text: 'Корреспондент местной газеты пишет статью «Как живут люди улицы».',
    options: [
      { label: 'Дать интервью', run: () => { const m = evMoney(40); addMoney(m); addMood(10); addXp(3); return `Гонорар ${fmt(m)} ₽ и минута славы. +10 радости`; } },
      { label: 'Отказаться', run: () => 'Журналист пошёл к Шнырю. Тот наврал с три короба' },
    ],
  },
  {
    id: 'singing', title: 'Конкурс талантов', emoji: '🎤', text: 'У фонтана «Минута славы»: кто громче всех споёт, тому приз от спонсора.',
    options: [
      { label: 'Спеть', get hint() { return `шанс ${Math.round(clamp(0.3 + S.mood / 250, 0, 0.8) * 100)}% (зависит от радости)`; }, run: () => {
          if (Math.random() < 0.3 + S.mood / 250) { const m = evMoney(70); addMoney(m); addMood(15); addXp(4); return `Зал рыдал! Приз ${fmt(m)} ₽, +15 😊`; }
          addMood(-4); return 'Освистали. −4 😊, но было весело'; } },
      { label: 'Просто послушать', run: () => { addMood(5); return 'Хорошо провёл время. +5 😊'; } },
    ],
  },
  {
    id: 'dog', title: 'Потерялась собака', emoji: '🐶', text: 'По парку бегает ухоженный пёс с ошейником. На жетоне — телефон хозяина.',
    options: [
      { label: 'Отвести хозяину', hint: '−10 ⚡', run: () => { S.energy = Math.max(0, S.energy - 10); const m = evMoney(55); addMoney(m); addMood(8); S.karma++; return `Хозяйка плакала от счастья и дала ${fmt(m)} ₽`; } },
      { label: 'Погладить и отпустить', run: () => { addMood(4); return 'Пёс лизнул тебя в нос. +4 😊'; } },
    ],
  },
  {
    id: 'roadwork', title: 'Ремонт тротуара', emoji: '🚧', text: 'Рабочим не хватает рук: «Подсобишь — заплатим наличкой».',
    options: [
      { label: 'Помочь', hint: '−20 ⚡', cond: () => S.energy >= 20, run: () => { S.energy -= 20; const m = evMoney(35); addMoney(m); addXp(4); return `Отпахал смену. +${fmt(m)} ₽, +4 опыта`; } },
      { label: 'Не сейчас', run: () => 'Рабочие пожали плечами' },
    ],
  },
  {
    id: 'ticket', title: 'Лотерейный билет', emoji: '🎫', text: 'Под ногами — нестёртый лотерейный билет. Кто-то обронил.',
    options: [
      { label: 'Стереть', hint: 'а вдруг?', run: () => {
          const x = Math.random();
          if (x < 0.1) { const m = evMoney(150); addMoney(m); addMood(15); confetti(30); return `Крупный выигрыш! +${fmt(m)} ₽`; }
          if (x < 0.5) { const m = evMoney(15); addMoney(m); return `Мелкий выигрыш: +${fmt(m)} ₽`; }
          return 'Пусто. Как и ожидалось'; } },
      { label: 'Отнести в бюро находок', run: () => { S.karma++; addMood(3); return 'Сделал доброе дело. +3 😊, карма +1'; } },
    ],
  },
  {
    id: 'coldnight', title: 'Холодная ночь', emoji: '🔥', text: 'Ночью подморозило. Соседи по парку просятся к твоему костру.', cond: () => S.housing < 2,
    options: [
      { label: 'Пустить всех', run: () => { addMood(8); S.karma++; return 'Грелись вместе и травили байки. +8 😊'; } },
      { label: 'Греться одному', run: () => { hurt(3); addMood(-2); return 'Костёр маленький, сам замёрз. −3 ❤️'; } },
    ],
  },
);

maybeEvent = function () {
  if (!S.storySeen || modalOpen()) return;
  const now = Date.now();
  if (now >= nextMiniAt && !(S.busy && S.busy.type === 'sleep')) {
    nextMiniAt = now + rand(40, 75) * 1000;
    const bad = Math.random() < badChance();
    badStreak = bad ? badStreak + 1 : 0;
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
  nextEventAt = now + rand(150, 260) * 1000;
  const pool = EVENTS.filter((e) => (!e.cond || e.cond()) && !recentEvents.includes(e.id));
  const ev = pick(pool.length ? pool : EVENTS);
  recentEvents.push(ev.id);
  if (recentEvents.length > 5) recentEvents.shift();
  const opts = ev.options.map((o, i) => ({ o, i })).filter(({ o }) => !o.cond || o.cond());
  const back = openModal(`
    <div class="big-art" style="font-size:84px;height:110px">${ev.emoji}</div>
    <h3>${ev.title}</h3>
    <p>${ev.text}</p>
    <div class="btns" style="flex-direction:column;gap:8px">${opts.map(({ o, i }, k) => `<button class="btn ${k === 0 ? 'primary' : ''} wide" data-opt="${i}">${o.label}${o.hint ? ` <small class="ev-hint">· ${o.hint}</small>` : ''}</button>`).join('')}</div>
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
};
