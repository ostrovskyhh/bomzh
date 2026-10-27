// Дополнения: отдых с мини-играми и лечение разбитого сердца, сценки с девушкой/женой,
// гаражи и угоны машин, плашка хлама на сцене, новые навыки с уровнями, админ-меню по кодовому слову.

// =====================================================================
// 1, 4. Отдых: разбитое сердце лечат друзья и дорогой отдых; новые виды отдыха с мини-играми
// =====================================================================

// cures — что снимает. game — мини-игра, от результата зависит радость (и бонус)
LEISURE.forEach((l) => { if (['mihalych', 'banya', 'karaoke', 'spa'].includes(l.id)) l.cures = ['heartbreak']; });
LEISURE.push(
  { id: 'fishing', name: 'Рыбалка с Михалычем', emoji: '🎣', price: 50, mood: 18, cd: 150, game: 'fishing', cures: ['heartbreak'], req: { level: 2 }, desc: 'Черви, удочка, друзья. Улов можно съесть' },
  { id: 'thimbles', name: 'Напёрстки на вокзале', emoji: '🥜', price: 200, mood: 6, cd: 60, game: 'thimbles', req: { level: 3 }, desc: 'Угадай, где шарик. Угадал все три — выигрыш ×3' },
  { id: 'darts', name: 'Дартс в пивбаре', emoji: '🎯', price: 400, mood: 15, cd: 120, game: 'darts', req: { level: 4, body: 1 }, desc: 'Шесть дротиков. Набрал 150 — бармен платит' },
  { id: 'shashlik', name: 'Шашлыки с друзьями', emoji: '🍢', price: 900, mood: 25, cd: 180, game: 'shashlik', cures: ['heartbreak'], req: { level: 5, housing: 2 }, desc: 'На природе. Не сожги мясо!' },
  { id: 'sea', name: 'Поездка на море', emoji: '🏖️', price: 150000, mood: 80, health: 25, cd: 600, cures: ['heartbreak', 'hangover'], req: { level: 12, housing: 4 }, desc: 'Неделя у моря лечит любую тоску' },
);

// ---------- Мини-игры отдыха ----------

// Рыбалка: ждёшь поклёвку и подсекаешь в момент, когда поплавок нырнул
function gameFishing(mg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="fs-water"><div class="fs-float" id="fsFloat">🔴</div><div class="fs-bucket" id="fsBucket"></div></div>
    <button class="btn primary wide mg-big" id="fsBtn">🎣 Подсечь!</button>`;
  let state = 'wait', bite = 0;
  const fl = $('fsFloat');
  const next = () => {
    if (!mgAlive(mg)) return;
    state = 'wait'; fl.className = 'fs-float';
    mg.timers.push(setTimeout(() => {
      if (!mgAlive(mg)) return;
      state = 'bite'; bite = Date.now(); fl.className = 'fs-float dip'; sfx('tick'); haptic('light');
      mg.timers.push(setTimeout(() => { if (state === 'bite' && mgAlive(mg)) { state = 'gone'; floatAt(fl, 'Сорвалась!', 'bad'); next(); } }, 750));
    }, rand(1200, 3500)));
  };
  $('fsBtn').onpointerdown = (e) => {
    e.preventDefault();
    if (!mgAlive(mg)) return;
    if (state === 'bite') {
      const fish = pick(['🐟', '🐟', '🐠', '🐡', '🦐', '🥾']);
      if (fish === '🥾') floatAt(fl, 'Сапог!', 'bad'); else { mgScore(1); floatAt(fl, `${fish} +1`, 'good'); }
      $('fsBucket').textContent += fish;
      sfx(fish === '🥾' ? 'error' : 'coin');
      next();
    } else { floatAt(fl, 'Рано!', 'bad'); sfx('error'); shakeArena(); next(); }
  };
  next();
}

// Напёрстки: следи за шариком, пока стаканы меняются местами
function gameThimbles(mg) {
  const arena = $('mgArena');
  let round = 0;
  const play = () => {
    if (!mgAlive(mg)) return;
    if (round >= 3) { setTimeout(mgEnd, 500); return; }
    round++;
    arena.innerHTML = `<div class="th-row">${[0, 1, 2].map((i) => `<button class="th-cup" data-i="${i}" style="left:${i * 33.3 + 4}%">🥤<i>${i === 1 ? '⚪' : ''}</i></button>`).join('')}</div><p class="mg-hint">Раунд ${round}/3: следи за шариком ⚪</p>`;
    const cups = [...arena.querySelectorAll('.th-cup')];
    const pos = [0, 1, 2]; // pos[cup] — где стоит стакан
    const ball = 1;
    cups.forEach((c) => c.classList.add('show'));
    let swaps = 4 + round * 2, speed = Math.max(170, 420 - round * 90);
    const swap = () => {
      if (!mgAlive(mg)) return;
      if (swaps-- <= 0) { cups.forEach((c) => { c.disabled = false; }); return; }
      const a = Math.floor(Math.random() * 3); let b = (a + 1 + Math.floor(Math.random() * 2)) % 3;
      const ca = pos.indexOf(a), cb = pos.indexOf(b);
      pos[ca] = b; pos[cb] = a;
      cups[ca].style.left = `${b * 33.3 + 4}%`; cups[cb].style.left = `${a * 33.3 + 4}%`;
      cups.forEach((c) => { c.style.transitionDuration = speed + 'ms'; });
      sfx('whoosh');
      mg.timers.push(setTimeout(swap, speed + 40));
    };
    cups.forEach((c) => { c.disabled = true; });
    mg.timers.push(setTimeout(() => { cups.forEach((c) => c.classList.remove('show')); mg.timers.push(setTimeout(swap, 400)); }, 900));
    cups.forEach((c, i) => {
      c.onpointerdown = (e) => {
        e.preventDefault();
        if (c.disabled || !mgAlive(mg)) return;
        cups.forEach((x) => { x.disabled = true; x.classList.add('show'); });
        if (i === ball) { mgScore(1); sfx('win'); floatAt(c, 'Угадал!', 'good'); } else { sfx('lose'); floatAt(c, 'Мимо', 'bad'); }
        mg.timers.push(setTimeout(play, 1100));
      };
    });
  };
  play();
}

// Дартс: прицел гуляет по мишени, бросай в момент, когда он ближе к центру
function gameDarts(mg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="dt-board" id="dtBoard"><i></i><i></i><i></i><i></i><b id="dtAim">✛</b></div>
    <button class="btn primary wide mg-big" id="dtBtn">🎯 Бросок (осталось 6)</button>`;
  let left = 6, t = Math.random() * 10, x = 0, y = 0, last = performance.now();
  const aim = $('dtAim'), board = $('dtBoard');
  const loop = (now) => {
    if (!mgAlive(mg)) return;
    t += (now - last) / 1000 * (1.3 + (6 - left) * 0.12); last = now;
    x = Math.sin(t * 1.7) * 0.75 + Math.sin(t * 3.1) * 0.2; y = Math.cos(t * 1.3) * 0.7 + Math.sin(t * 2.3) * 0.2;
    aim.style.left = 50 + x * 45 + '%'; aim.style.top = 50 + y * 45 + '%';
    mg.raf = requestAnimationFrame(loop);
  };
  mg.raf = requestAnimationFrame(loop);
  $('dtBtn').onpointerdown = (e) => {
    e.preventDefault();
    if (!mgAlive(mg) || left <= 0) return;
    const d = Math.hypot(x, y);
    const pts = d < 0.12 ? 50 : d < 0.35 ? 25 : d < 0.6 ? 10 : d < 0.9 ? 5 : 0;
    const dart = document.createElement('span');
    dart.className = 'dt-dart'; dart.textContent = '📍';
    dart.style.left = aim.style.left; dart.style.top = aim.style.top;
    board.appendChild(dart);
    mgScore(pts);
    floatAt(board, pts ? `+${pts}${pts === 50 ? ' 🎯' : ''}` : 'Мимо', pts ? 'good' : 'bad');
    sfx(pts >= 25 ? 'crit' : pts ? 'tap' : 'error');
    left--;
    $('dtBtn').textContent = `🎯 Бросок (осталось ${left})`;
    if (!left) setTimeout(mgEnd, 600);
  };
}

// Шашлык: у каждого шампура своя скорость, снимай, когда мясо золотистое
function gameShashlik(mg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="sk-grill">${[0, 1, 2, 3].map((i) => `<button class="sk" data-i="${i}"><span>🍢</span><div class="sk-bar"><i class="sk-zone"></i><b id="skFill${i}"></b></div></button>`).join('')}</div>`;
  const heat = [0, 0, 0, 0], speed = [0.22, 0.3, 0.17, 0.26].map((s) => s * rand(0.85, 1.2));
  let last = performance.now();
  const loop = (now) => {
    if (!mgAlive(mg)) return;
    const dt = (now - last) / 1000; last = now;
    for (let i = 0; i < 4; i++) {
      heat[i] += speed[i] * dt;
      if (heat[i] >= 1) { heat[i] = 0; mgScore(-1); sfx('error'); floatAt(arena.children[0].children[i], '🔥 Сгорел!', 'bad'); }
      const f = $('skFill' + i);
      if (f) { f.style.width = heat[i] * 100 + '%'; f.className = heat[i] > 0.9 ? 'burn' : heat[i] > 0.68 ? 'gold' : ''; }
    }
    mg.raf = requestAnimationFrame(loop);
  };
  mg.raf = requestAnimationFrame(loop);
  arena.querySelectorAll('.sk').forEach((b) => {
    b.onpointerdown = (e) => {
      e.preventDefault();
      if (!mgAlive(mg)) return;
      const i = +b.dataset.i;
      if (heat[i] >= 0.68 && heat[i] <= 0.9) { mgScore(2); sfx('coin'); floatAt(b, 'Идеально!', 'good'); }
      else if (heat[i] < 0.68) { sfx('error'); floatAt(b, 'Сырой!', 'bad'); mgScore(-1); }
      heat[i] = 0;
    };
  });
}

const LEISURE_GAMES = {
  fishing: { title: 'Рыбалка', hint: 'Жди, пока поплавок нырнёт, и сразу подсекай', duration: 25, target: 6, run: gameFishing },
  thimbles: { title: 'Напёрстки', hint: 'Запомни, где шарик, и не своди глаз со стакана', duration: 0, target: 3, run: gameThimbles },
  darts: { title: 'Дартс', hint: 'Бросай, когда прицел ближе к центру. Яблочко — 50 очков', duration: 0, target: 150, run: gameDarts },
  shashlik: { title: 'Шашлык', hint: 'Снимай шампур, когда полоска золотая. Пережаришь — сгорит', duration: 25, target: 14, run: gameShashlik },
};

function finishLeisure(l, score) {
  const g = LEISURE_GAMES[l.game];
  const perf = clamp(score / g.target, 0, 1.3);
  const soul = hasEffect('t_soul') ? 1.5 : 1;
  const mood = Math.round(l.mood * (0.4 + perf * 0.8) * soul);
  addMood(mood);
  const lines = [`Радость +${mood}`];
  if (l.game === 'fishing' && score > 0) { feed(score * 4); lines.push(`Уху сварили: сытость +${score * 4}`); }
  if (l.game === 'thimbles') {
    if (score >= 3) { const win = l.price * 3; addMoney(win); lines.push(`Напёрсточник в шоке: +${fmt(win)} ₽`); }
    else if (score === 0) { addMood(-5); lines.push('Шнырь шепчет: «Это был лохотрон, Валера». −5 😊'); }
  }
  if (l.game === 'darts' && score >= 150) { const win = 1500 + level() * 100; addMoney(win); lines.push(`Бармен проспорил: +${fmt(win)} ₽`); }
  if (l.game === 'shashlik') { feed(30); if (score < 4) { addEffect('poison', 3); lines.push('Мясо было сырое… 🤢 Отравление'); } else lines.push('Сытость +30'); }
  const cured = cureLeisure(l);
  if (cured) lines.push(cured);
  track('leisureGame');
  resultModal({ emoji: perf >= 0.8 ? '🤩' : perf >= 0.4 ? '🙂' : '😅', rays: perf < 0.4 ? 'bad' : '', title: `${l.emoji} ${l.name}`, text: `Результат: ${score}<br>${lines.join('<br>')}`, btn: 'Отлично' });
  sfx(perf >= 0.4 ? 'win' : 'lose');
  save();
}

function cureLeisure(l) {
  const cured = (l.cures || []).filter((id) => hasEffect(id));
  if (!cured.length) return '';
  S.effects = S.effects.filter((e) => !cured.includes(e.id));
  return `${cured.map((id) => EFFECTS[id].emoji).join(' ')} Прошло: ${cured.map((id) => EFFECTS[id].name.toLowerCase()).join(', ')}`;
}

const _leisureBase = ACTIONS.leisure;
ACTIONS.leisure = (id) => {
  const l = LEISURE.find((x) => x.id === id);
  if (!reqOk(l.req) || S.money < l.price || cdLeft('l_' + id) > 0) return;
  if (l.game) {
    S.money -= l.price;
    if (l.health) heal(l.health);
    setCd('l_' + id, l.cd);
    const g = LEISURE_GAMES[l.game];
    runGame({ title: `${l.emoji} ${g.title}`, hint: g.hint, duration: g.duration, setup: (mg) => g.run(mg), finish: (score) => finishLeisure(l, score) });
    return;
  }
  const moodBefore = S.mood;
  _leisureBase(id);
  if (hasEffect('t_soul')) addMood(Math.round((S.mood - moodBefore) * 0.5));
  const cured = cureLeisure(l);
  if (cured) setTimeout(() => toast(cured, 'good'), 500);
};

// Подсказка во вкладке «Отдых», что лечит разбитое сердце
EXTRA_TABS.fun.rest = function restWithCure() {
  delete EXTRA_TABS.fun.rest;
  let html = renderFun();
  EXTRA_TABS.fun.rest = restWithCure;
  LEISURE.forEach((l) => {
    const tags = [l.game ? '🎮 мини-игра' : '', (l.cures || []).includes('heartbreak') ? '💔→❤️ лечит разбитое сердце' : ''].filter(Boolean).join(' · ');
    if (tags) html = html.replace(`data-act="leisure" data-id="${l.id}"`, `data-act="leisure" data-id="${l.id}" data-tags="1"`).replace(`<div class="card-title">${l.name}</div>`, `<div class="card-title">${l.name}</div><div class="tag-line">${tags}</div>`);
  });
  return (hasEffect('heartbreak') ? '<div class="info-card warn">💔 Разбитое сердце лечат посиделки с друзьями (Михалыч, рыбалка, шашлыки) или дорогой отдых (баня, караоке, СПА, море).</div>' : '') + html;
};

// =====================================================================
// 2. Сценки с девушкой/женой: истории с выбором и разными исходами
// =====================================================================

PARTNER_Q.push(
  ['Мне идёт эта причёска?', [['Ты как с обложки', 5, 4, 1, '«Ой, перестань» 😊'], ['А что-то изменилось?', -8, -6, 0, '«Я три часа в салоне сидела!»'], ['Раньше было лучше', -5, -4, 0, '«Спасибо за честность. Наверное»']]],
  ['Куда поедем в отпуск?', [['Куда скажешь, любимая', 5, 4, 0, '«Тогда Мальдивы!» 😏'], ['На дачу к Михалычу', -2, 0, 2, '«Романтика…»'], ['Какой отпуск, работать надо', -6, -4, 0, '«Скучный ты»']]],
  ['Ты помнишь, как мы познакомились?', [['Конечно, это был лучший день', 6, 5, 2, '«И я помню!» ❤️'], ['Это было… в среду?', -4, -3, 0, '«Это был понедельник!»'], ['Ты подошла попросить бутылку', 2, 2, 3, '«Вот же память у тебя» 😂']]],
  ['Мой брат просит у тебя в долг', [['Конечно, поможем', 6, 4, 0, '«Ты лучший!»', 2000], ['Пусть сам заработает', -6, -3, 0, '«Он же родной!»'], ['Только под расписку', 1, 0, 0, '«Ну ты и бюрократ»']]],
);
PARTNER_ASK.push(['на абонемент в фитнес', '🧘‍♀️', 1.2], ['на новую сумочку', '👜', 2.5], ['на подарок подруге', '🎁', 0.6], ['на ремонт телефона', '🔧', 0.8]);
PARTNER_GAMES.push(
  { id: 'shelf', title: 'Повесь полку', hint: 'Сверли точно в отметку. Промахнёшься — штукатурка посыплется', duration: 0, target: 6,
    setup: (mg) => gameTiming(mg, { btn: '🔩 Сверлить', item: '🔩', attempts: 5 }) },
  { id: 'darts2', title: 'Дартс на кухне', hint: 'Она поспорила, что ты не попадёшь в центр', duration: 0, target: 100, setup: (mg) => gameDarts(mg) },
);

// Истории: каждый выбор — функция, возвращает её реакцию
const PARTNER_STORIES = [
  { e: '👀', t: 'Она видела, как ты смотрел на продавщицу Свету', choices: [
    ['Оправдываться', () => (Math.random() < 0.5 ? (addTrust(3), '«Ладно, поверю. В этот раз»') : (addTrust(-8), '«Не верю ни одному слову!»'))],
    ['💐 Купить цветы', () => { S.money = Math.max(0, S.money - 500); addTrust(6); addRel(4); return '«Ой, мои любимые!» (−500 ₽)'; }],
    ['Промолчать', () => (addTrust(-5), '«Молчание — знак согласия!»')]] },
  { e: '👵', t: 'Приехала мама. На неделю', choices: [
    ['Терпеть и улыбаться', () => (addMood(-10), addTrust(6), addRel(5), 'Тёща довольна. Ты — не очень. −10 😊')],
    ['🎣 Сбежать на рыбалку', () => (addMood(8), addTrust(-8), '«Опять сбежал! Мама обиделась»')],
    ['🎂 Задобрить тортом', () => { S.money = Math.max(0, S.money - 800); addTrust(4); addRel(3); return 'Тёща сказала: «Ну хоть не дурак». Это комплимент! (−800 ₽)'; }]] },
  { e: '🍲', t: 'Она приготовила ужин по рецепту из интернета. Выглядит… странно', choices: [
    ['Съесть и нахваливать', () => { addTrust(6); addRel(5); if (Math.random() < 0.4) { addEffect('poison', 4); return '«Я так рада!» …а ночью 🤢 отравление'; } feed(40); return 'Оказалось вкусно! Сытость +40'; }],
    ['Вежливо отказаться', () => (addTrust(-7), '«Я старалась, а ты!..»')],
    ['Предложить заказать пиццу', () => (Math.random() < 0.5 ? (feed(30), addRel(2), '«А давай!» Сытость +30') : (addTrust(-6), '«Значит, моя еда — гадость?!»'))]] },
  { e: '📞', t: 'Ей звонит бывший', choices: [
    ['Взять трубку и поговорить по-мужски', () => (Math.random() < 0.6 ? (addTrust(4), addMood(5), 'Бывший больше не звонит. Она впечатлена') : (hurt(8), addMood(-5), 'Он приехал. С братом. −8 ❤️'))],
    ['Спокойно: «Это твоё дело»', () => (addTrust(7), '«Ты мне доверяешь… Это приятно»')],
    ['Устроить сцену ревности', () => (addTrust(-6), addRel(-3), '«Ты меня душишь своей ревностью!»')]] },
  { e: '💰', t: 'Она нашла твою заначку', cond: () => S.money > 1000, choices: [
    ['Признаться и отдать половину', () => { const m = Math.floor(S.money * 0.05); S.money -= m; addTrust(8); return `«Вот это честно!» (−${fmt(m)} ₽)`; }],
    ['Сказать, что копил ей на подарок', () => { const m = Math.floor(S.money * 0.08); S.money -= m; addRel(8); return `Пришлось и правда купить подарок (−${fmt(m)} ₽). Зато она счастлива`; }],
    ['Отпираться до последнего', () => (addTrust(-15), '«Ты врёшь мне в лицо!» Доверие −15')]] },
  { e: '🎉', t: 'Зовёт на день рождения подруги', choices: [
    ['Пойти, нарядившись', () => (S.energy = Math.max(0, S.energy - 20), addTrust(5), addRel(4), addMood(8), 'Подруги одобрили. −20 ⚡, +8 😊')],
    ['Пойти, но в трениках', () => (addTrust(-4), addMood(5), '«Ты меня опозорил!» Но торт был вкусный')],
    ['Сказаться больным', () => (Math.random() < 0.5 ? (addTrust(-2), '«Выздоравливай…»') : (addTrust(-12), 'Она увидела, как ты играешь в «Танчики». Доверие −12'))]] },
  { e: '😳', t: '«Милый… у меня задержка»', choices: [
    ['Обрадоваться', () => (addTrust(10), addRel(8), addMood(5), 'Тест показал… ложная тревога. Но она запомнила, как ты обрадовался ❤️')],
    ['Побледнеть и сесть', () => (addTrust(-12), 'Ложная тревога. Но твоё лицо она не забудет. Доверие −12')],
    ['Сразу побежать за тестом', () => { S.money = Math.max(0, S.money - 300); addTrust(3); return 'Ложная тревога! Ты на 300 ₽ беднее и на 10 лет старше'; }]] },
  { e: '🛠️', t: '«Хочу ремонт! Обои как у Зинки»', choices: [
    ['Дать денег на ремонт', () => { const m = Math.round(ALLOWANCE[girlIdx(S.girlfriend)] * 3); S.money = Math.max(0, S.money - m); addTrust(8); addRel(6); if (S.breakdowns && S.breakdowns.length) S.breakdowns.pop(); return `Ремонт сделан, заодно починили поломку (−${fmt(m)} ₽)`; }],
    ['Клеить обои самому', () => (Math.random() < 0.5 ? (addTrust(6), addMood(3), 'Получилось криво, но с любовью') : (addTrust(-5), addMood(-5), 'Обои легли пузырями. Она плачет'))],
    ['«Нам и так нормально»', () => (addTrust(-6), '«Тебе всегда нормально!»')]] },
  { e: '🐾', t: 'Твой питомец сгрыз её туфли', cond: () => !!S.pet, choices: [
    ['Купить новые туфли', () => { const m = 1500 + girlIdx(S.girlfriend) * 2000; S.money = Math.max(0, S.money - m); addTrust(5); return `«Ну ладно, он хороший» (−${fmt(m)} ₽)`; }],
    ['Защищать питомца', () => (addTrust(-8), '«Тебе зверь дороже меня?!»')],
    ['Свалить на соседского кота', () => (Math.random() < 0.5 ? (addTrust(1), 'Прокатило!') : (addTrust(-10), 'Она нашла улики в миске. Доверие −10'))]] },
  { e: '🕯️', t: 'Она устроила романтический вечер со свечами', choices: [
    ['Подыграть: музыка, танец', () => (addTrust(8), addRel(10), addMood(15), 'Лучший вечер за год ❤️ +15 😊')],
    ['Уснуть на диване', () => (addTrust(-10), addRel(-5), 'Проснулся один. Свечи догорели')],
    ['Подарить цветы из мусорки', () => (Math.random() < 0.5 ? (addTrust(4), addRel(5), '«Как мило!» (она не знает)') : (addTrust(-10), '«Они пахнут мусоркой, Валера!»'))]] },
];

partnerEvent = (function (orig) {
  return function () {
    const g = partner();
    if (!g) return;
    const list = PARTNER_STORIES.filter((s) => !s.cond || s.cond());
    if (Math.random() > 0.35 || !list.length) { orig(); return; }
    const st = pick(list);
    PARTNER = { kind: 'story', st };
    sfx('notify');
    openModal(`<div class="big-art" style="height:96px"><div class="big-emoji" style="line-height:96px">${st.e}</div></div>
      <h3>${partnerTitle()} ${g.name.split(' ').pop()}</h3><p>${st.t}</p>
      <div class="btns" style="flex-direction:column;gap:8px">${st.choices.map((c, i) => `<button class="btn wide" data-act="pStory" data-id="${i}">${c[0]}</button>`).join('')}</div>`, { center: true, locked: true });
  };
})(partnerEvent);

ACTIONS.pStory = (i) => {
  const p = PARTNER; PARTNER = null;
  if (!p || !p.st) return;
  const before = S.trust;
  const reply = p.st.choices[+i][1]();
  track('partnerStory');
  partnerReply(S.trust >= before ? '😊' : '😠', p.st.choices[+i][0], reply, S.trust >= before);
};

// =====================================================================
// 5–7. Транспорт: гараж для каждой машины, без гаража ночью угоняют (20%)
// =====================================================================

const THEFT_CHANCE = 0.2;
function needsGarage(i = S.transport) { return !!(TRANSPORT[i] && TRANSPORT[i].garage); }
function inGarage(i = S.transport) { return (S.garages || []).includes(i); }

EXTRA_TABS.shop.transport = () => {
  if (!S.garages) S.garages = [];
  const v = vehicle();
  const garageCard = needsGarage() ? card({ thumb: '🅿️', title: v.garage.name, cls: inGarage() ? 'current' : '',
    desc: inGarage() ? 'Машина ночует в гараже — угнать не смогут.' : `<b style="color:var(--red)">Машина стоит во дворе: каждую ночь ${Math.round(THEFT_CHANCE * 100)}% её угонят!</b>`,
    btn: inGarage() ? '<button class="btn" disabled>Есть</button>' : priceBtn('buyGarage', S.transport, v.garage.price, S.money >= v.garage.price) }) : '';
  return `<div class="info-card">Транспорт ускоряет мусорку, повышает оплату курьера и таксиста. Моторный ест бензин и иногда ломается.
      <br>🅿️ <b>Каждой машине нужен свой гараж</b> — без него её могут угнать ночью.</div>
    ${S.transport ? card({ thumb: v.emoji, title: `Твой: ${v.name}`, cls: 'current',
      desc: `Мусорка быстрее на ${Math.round((1 - v.trash) * 100)}% · работа в дороге +${Math.round(v.job * 100)}%${v.fuel ? ` · бензин ${fmt(v.fuel)} ₽/смена` : ''}${S.transportBroken ? '<br><b style="color:var(--red)">Сломан! Бонусы не работают</b>' : ''}`,
      btn: S.transportBroken ? priceBtn('fixTransport', '', v.price * 0.08, S.money >= v.price * 0.08, `🔧 ${fmt(v.price * 0.08)}`) : '' }) : ''}
    ${garageCard}
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
        desc: `${t.desc}<br><b>Мусорка −${Math.round((1 - t.trash) * 100)}% · работа +${Math.round(t.job * 100)}%</b>${t.fuel ? ` · бензин ${fmt(t.fuel)} ₽` : ''}
          ${t.garage ? `<br>🅿️ Нужен «${t.garage.name}» — ${fmt(t.garage.price)} ₽${inGarage(i) ? ' ✓' : ''}` : ''}${tradeIn && S.transport < i ? `<br>С учётом сдачи старого: −${fmt(tradeIn)} ₽` : ''}`,
        extra: ok ? '' : reqHTML({ level: t.level }), btn });
    }).join('')}`;
};

ACTIONS.buyGarage = (id) => {
  const i = +id, t = TRANSPORT[i];
  if (!S.garages) S.garages = [];
  if (!t.garage || S.garages.includes(i) || S.money < t.garage.price) return;
  S.money -= t.garage.price;
  S.garages.push(i);
  track('garage');
  sfx('buy');
  toast(`🅿️ ${t.garage.name} куплен. ${t.name} теперь в безопасности`, 'good');
};

function stealCar(where) {
  const v = vehicle();
  S.transport = 0;
  S.transportBroken = false;
  addMood(-30);
  track('carStolen');
  resultModal({ emoji: '🚨', rays: 'bad', title: `Угнали ${v.name}!`, text: `${where} ${v.emoji} ${v.name} ночевал во дворе без гаража — утром на его месте только пятно масла. Полиция: «Найдём… когда-нибудь». −30 😊<br><br>Следующую машину ставь в гараж!`, btn: 'Гады…' });
  sfx('bad');
}

finishSleep = (function (orig) {
  return function (progress) {
    orig(progress);
    if (progress > 0.5 && needsGarage() && !inGarage() && Math.random() < THEFT_CHANCE) queuePopup('steal' + Date.now(), 2, () => stealCar('Пока ты спал,'));
  };
})(finishSleep);

// =====================================================================
// 8. Плашка хлама на главном экране (под сюжетом)
// =====================================================================

HOOKS.hud.push(() => {
  const pin = $('invPin');
  if (!pin) return;
  const ids = Object.keys(S.inv || {}).filter((id) => S.inv[id] > 0 && ITEMS[id]);
  const n = ids.reduce((a, id) => a + S.inv[id], 0);
  if (!n) { pin.classList.add('hidden'); return; }
  const value = ids.reduce((a, id) => a + itemPrice(id) * S.inv[id], 0);
  const html = `<span>🎒</span><div><b>Хлам: ${fmt(n)} шт.</b><small>Шнырь даст ~${fmt(value)} ₽</small></div>`;
  if (pin.dataset.html !== html) { pin.innerHTML = html; pin.dataset.html = html; }
  pin.classList.remove('hidden');
  pin.style.top = $('questPin').classList.contains('hidden') ? '58px' : '';
});
ACTIONS.openMarket = () => showScreen('fun', 'market');

// =====================================================================
// 9. Навыки: новые и прокачка до 5 уровня (дольше действуют, быстрее перезаряжаются)
// =====================================================================

Object.assign(EFFECTS, {
  t_soul: { name: 'Душа компании', emoji: '😎', kind: 'good', desc: 'Радость от отдыха ×1.5, +1 радости/мин', mods: { mpm: 1 } },
  t_hands: { name: 'Ловкие руки', emoji: '🧤', kind: 'good', desc: 'Мусорка перезаряжается на 30% быстрее' },
  t_charm: { name: 'Обаяние', emoji: '😏', kind: 'good', desc: 'Шанс на свиданиях +10%' },
  t_stomach: { name: 'Железный желудок', emoji: '🦾', kind: 'good', desc: 'Переедание и фастфуд без последствий' },
  t_fist: { name: 'Удар с правой', emoji: '🥊', kind: 'good', desc: 'Сила в драках +15%' },
  t_diplomat: { name: 'Дипломат', emoji: '🕊️', kind: 'good', desc: 'Девушка обижается вдвое меньше' },
  t_haggle: { name: 'Торгаш с рынка', emoji: '💬', kind: 'good', desc: 'Шнырь платит за хлам на 15% больше' },
});
TRICKS.push(
  { id: 't_hands', price: 90, minutes: 10, level: 3 },
  { id: 't_soul', price: 150, minutes: 10, level: 4 },
  { id: 't_stomach', price: 120, minutes: 15, level: 5 },
  { id: 't_charm', price: 250, minutes: 10, level: 6 },
  { id: 't_haggle', price: 300, minutes: 10, level: 7 },
  { id: 't_fist', price: 400, minutes: 10, level: 8 },
  { id: 't_diplomat', price: 500, minutes: 15, level: 9 },
);
TRICKS.sort((a, b) => a.level - b.level);
const TRICK_MAX = 5;
function trickLvl(id) { return (S.trickLvl && S.trickLvl[id]) || 1; }
function trickMinutes(t) { return Math.round(t.minutes * (1 + 0.25 * (trickLvl(t.id) - 1))); }
function trickCdMin(t) { return Math.round(t.minutes * TRICK_COOLDOWN * (1 - 0.1 * (trickLvl(t.id) - 1))); }
function trickUpPrice(t) { return Math.round(trickPrice(t) * 6 * trickLvl(t.id)); }

trashCdMult = (function (orig) { return () => orig() * (hasEffect('t_hands') ? 0.7 : 1); })(trashCdMult);
dateChance = (function (orig) { return (g, d) => clamp(orig(g, d) + (hasEffect('t_charm') ? 0.1 : 0), 0.05, 0.97); })(dateChance);
itemPrice = (function (orig) { return (id, t) => Math.round(orig(id, t) * (hasEffect('t_haggle') ? 1.15 : 1)); })(itemPrice);
myFighter = (function (orig) { return () => { const f = orig(); if (hasEffect('t_fist')) f.strength = f.strength * 1.15 + 5; return f; }; })(myFighter);
addTrust = (function (orig) { return (v) => orig(v < 0 && hasEffect('t_diplomat') ? v / 2 : v); })(addTrust);
overeat = (function (orig) { return (extra) => { if (hasEffect('t_stomach')) { ensureLife(); S.over += extra; return; } orig(extra); }; })(overeat);
HOOKS.init.push(() => {
  // фастфуд без дебаффов: обнуляем журнал перекусов после еды
  const _eat = eat;
  eat = (id) => { _eat(id); if (hasEffect('t_stomach')) { S.junkLog = []; S.effects = S.effects.filter((e) => !['heartburn', 'poison', 'bloat', 'stuffed', 'hiccup', 'runs', 'foodcoma'].includes(e.id)); } };
});

EXTRA_TABS.life.skills = () => `<div class="info-card">Навыки работают временно: бонус на несколько минут, потом перезарядка. <b>Прокачка</b> (до ${TRICK_MAX} ур.) навсегда удлиняет действие на 25% и сокращает перезарядку на 10% за уровень.</div>` +
  TRICKS.map((t) => {
    const d = EFFECTS[t.id];
    const price = trickPrice(t), lv = trickLvl(t.id);
    const active = activeEffects().find((e) => e.id === t.id);
    const cd = cdLeft(t.id);
    const locked = level() < t.level;
    let btn;
    if (locked) btn = lockBtn;
    else if (active) btn = `<button class="btn green" disabled>✓ <span data-until="${active.until}"></span></button>`;
    else if (cd > 0) btn = timerBtn(S.cd[t.id]);
    else btn = priceBtn('trick', t.id, price, S.money >= price);
    const up = !locked && lv < TRICK_MAX ? `<div class="promo-row">⬆️ Ур. ${lv} → ${lv + 1}: ${priceBtn('trickUp', t.id, trickUpPrice(t), S.money >= trickUpPrice(t), `${fmt(trickUpPrice(t))} ₽`).replace('class="btn', 'class="btn small')}</div>` : '';
    return card({ thumb: d.emoji, title: `${d.name} ${locked ? '' : `<span class="lvl-dots">${'●'.repeat(lv)}${'○'.repeat(TRICK_MAX - lv)}</span>`}`, cls: locked ? 'locked' : active ? 'current' : '',
      desc: `<b>${d.desc}</b><br>Действует ${trickMinutes(t)} мин · перезарядка ${trickCdMin(t)} мин`,
      extra: (locked ? reqHTML({ level: t.level }) : '') + up, btn });
  }).join('');

Object.assign(ACTIONS, {
  trick: (id) => {
    const t = TRICKS.find((x) => x.id === id);
    const price = trickPrice(t);
    if (level() < t.level || S.money < price || cdLeft(id) > 0 || hasEffect(id)) return;
    S.money -= price;
    addEffect(id, trickMinutes(t));
    setCd(id, trickCdMin(t) * 60);
    track('trick');
    toast(`${EFFECTS[id].emoji} ${EFFECTS[id].name} на ${trickMinutes(t)} мин`, 'good');
    sfx('good');
    haptic('success');
  },
  trickUp: (id) => {
    const t = TRICKS.find((x) => x.id === id);
    const price = trickUpPrice(t);
    if (level() < t.level || trickLvl(id) >= TRICK_MAX || S.money < price) return;
    S.money -= price;
    if (!S.trickLvl) S.trickLvl = {};
    S.trickLvl[id] = trickLvl(id) + 1;
    track('trickUp');
    sfx('levelup');
    toast(`⬆️ ${EFFECTS[id].name}: уровень ${S.trickLvl[id]}`, 'good');
  },
});

// =====================================================================
// 10. Релиз: кодовое слово открывает админ-меню, донат ждёт подключения оплаты
// =====================================================================

const GAME_VERSION = '1.0';
// В коде хранится только хэш кодового слова (SHA-256), само слово не видно
const ADMIN_HASH = '91b2a2b2a2ffec54e747d2c709ebf648510457216d3862cc965613488655a9b0';

async function sha256(text) {
  if (!window.crypto || !crypto.subtle) return '';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

openSettings = (function (orig) {
  return function () {
    orig();
    const note = document.querySelector('#modalRoot .test-note');
    if (note) note.textContent = `Симулятор бомжа · версия ${typeof CHANGELOG !== 'undefined' ? CHANGELOG[0].v : GAME_VERSION}`;
    const btns = document.querySelector('#modalRoot .btns');
    if (!btns) return;
    btns.insertAdjacentHTML('beforebegin', `
      ${S.admin ? '<button class="btn wide admin-btn" data-act="adminMenu">🛠️ Админ-меню</button>' : `<div class="code-row"><input id="codeWord" type="password" placeholder="Кодовое слово" autocomplete="off"><button class="btn" data-act="codeWord">OK</button></div>`}`);
  };
})(openSettings);

function openAdmin() {
  openModal(`<h3>🛠️ Админ-меню</h3><p>Видно только тебе. Всё сохраняется в прогресс.</p>
    <div class="admin-grid">
      <button class="btn" data-act="adm" data-id="m100k">+100 000 ₽</button>
      <button class="btn" data-act="adm" data-id="m10m">+10 000 000 ₽</button>
      <button class="btn" data-act="adm" data-id="caps">+100 крышек</button>
      <button class="btn" data-act="adm" data-id="lvl">+1 уровень</button>
      <button class="btn" data-act="adm" data-id="lvl5">+5 уровней</button>
      <button class="btn" data-act="adm" data-id="bars">Полные шкалы</button>
      <button class="btn" data-act="adm" data-id="cure">Вылечить всё</button>
      <button class="btn" data-act="adm" data-id="cd">Сбросить таймеры</button>
    </div>
    <div class="btns" style="flex-direction:column;gap:8px">
      <button class="btn primary wide" data-act="adm" data-id="all">🔓 Открыть всё</button>
      <small style="color:var(--muted);text-align:center">40 уровень, всё образование, одежда, жильё, транспорт с гаражами, все работы на высшей должности, бизнесы, питомцы, девушки, навыки 5 ур., лига 💎, полные шкалы</small>
      <button class="btn wide" data-act="adm" data-id="quest">📖 Пропустить главу сюжета</button>
      <button class="btn wide" data-act="adm" data-id="off">Выйти из админки</button>
      <button class="btn wide" data-act="settings">Назад</button></div>`, { center: true });
}

// «Открыть всё»: снимает все требования — уровень, учёба, одежда, жильё, транспорт с гаражами, все работы на высшей
// должности, бизнесы, питомцы, девушки, навыки 5 ур., лиги драк, полные шкалы. Сюжет листается отдельной кнопкой
function unlockAll() {
  pendingLevelUp = null;
  let xp = 0;
  for (let i = 1; i < 40; i++) xp += xpNeed(i);
  if (S.xp < xp) S.xp = xp;
  addMoney(50000000); addCaps(1000);
  S.edu = EDU.length - 1; S.study = null;
  for (const slot of Object.keys(CLOTHES)) CLOTHES[slot].forEach((it) => { if (!S.owned[slot].includes(it.id)) S.owned[slot].push(it.id); });
  S.eq = { hat: 'cilinder', body: 'kostum', shoes: 'boots' }; // работы смотрят на надетую одежду
  PETS.forEach((p) => { if (!S.pets.includes(p.id)) S.pets.push(p.id); });
  S.shelter = [];
  S.ownedHousing = HOUSING.length - 1; S.housing = S.ownedHousing; S.housingMode = 'own'; S.debt = 0; S.missed = 0; S.breakdowns = [];
  S.transport = TRANSPORT.length - 1; S.transportBroken = false;
  S.garages = TRANSPORT.map((t, i) => i).filter((i) => TRANSPORT[i].garage);
  if (!S.jobPos) S.jobPos = {};
  if (!S.hired) S.hired = {};
  JOBS.forEach((j) => { S.jobs[j.id] = Math.max(jobShifts(j.id), 80); S.jobPos[j.id] = 4; S.hired[j.id] = true; });
  BUSINESSES.forEach((b) => { if (!S.biz[b.id]) S.biz[b.id] = { lvl: 1, cash: 0, last: Date.now(), started: Date.now(), eventAt: Date.now() + 20 * 60000 }; });
  GIRLS.forEach((g) => { const st = girlState(g.id); st.met = true; st.rel = Math.max(st.rel, 60); });
  if (!S.trickLvl) S.trickLvl = {};
  TRICKS.forEach((t) => { S.trickLvl[t.id] = TRICK_MAX; });
  const fs = fightState(); fs.rating = Math.max(fs.rating, 1800);
  S.form = 100; S.strength = 100; S.fatigue = 0;
  S.effects = S.effects.filter((e) => EFFECTS[e.id].kind === 'good');
  S.energy = maxEnergy(); S.food = maxFood(); S.health = maxHealth(); S.mood = maxMood(); S.over = 0;
  S.cd = {}; S.busy = null;
  renderedLook = '';
  renderScene();
}

// Пропустить текущую главу сюжета (для проверки). Выбор пути — сразу честный, если не выбран
function skipChapter() {
  const q = currentQuest();
  if (!q) { toast('Сюжет уже пройден'); return; }
  if (q.choice) { S.quest.path = S.quest.path || 'honest'; S.quest.idx++; S.quest.base = { ...(S.counters || {}) }; toast(`📖 Выбран путь: ${S.quest.path === 'honest' ? 'честный' : 'тёмный'}`, 'good'); return; }
  closeModal();
  completeQuest(q);
}

Object.assign(ACTIONS, {
  codeWord: async () => {
    const inp = $('codeWord');
    if (!inp) return;
    const h = await sha256(inp.value.trim().toLowerCase());
    if (h && h === ADMIN_HASH) { S.admin = true; save(); sfx('levelup'); toast('🔓 Админ-меню открыто', 'good'); openAdmin(); }
    else { inp.value = ''; sfx('error'); toast('Неверное кодовое слово', 'bad'); }
  },
  adminMenu: () => { if (S.admin) openAdmin(); },
  adm: (id) => {
    if (!S.admin) return;
    if (id === 'm100k') addMoney(100000);
    if (id === 'm10m') addMoney(10000000);
    if (id === 'caps') addCaps(100);
    if (id === 'lvl') addXp(xpNeed(level()) - levelInfo().cur);
    if (id === 'lvl5') for (let i = 0; i < 5; i++) addXp(xpNeed(level()) - levelInfo().cur);
    if (id === 'bars') { S.energy = maxEnergy(); S.food = maxFood(); S.health = maxHealth(); S.mood = maxMood(); S.over = 0; }
    if (id === 'cure') S.effects = S.effects.filter((e) => EFFECTS[e.id].kind === 'good');
    if (id === 'cd') { S.cd = {}; S.busy = null; }
    if (id === 'all') unlockAll();
    if (id === 'quest') { skipChapter(); save(); return; }
    if (id === 'off') { S.admin = false; closeModal(); toast('Админка скрыта'); save(); return; }
    toast('✅ Готово', 'good');
    save();
  },
  // Оплата Stars требует сервера (см. ИНСТРУКЦИЯ.md). До её подключения покупки работают только в админке
  prem: (id) => {
    if (!S.admin) { toast('⭐ Покупки за Stars скоро появятся!'); return; }
    if (id === 'vip') S.vipUntil = Math.max(Date.now(), S.vipUntil) + 30 * 86400000;
    else addCaps(PREMIUM.find((x) => x.id === id).caps);
    toast('🛠️ Тестовая покупка (админ)', 'good');
  },
});
