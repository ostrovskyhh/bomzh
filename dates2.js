// Свидания 2.8: у каждого свидания своя мини-игра. Заодно починены каток и караоке —
// они вызывали несуществующую игру и зависали.
// Кафе — разговор, кино — угадай фильм по эмодзи, ресторан — разлей вино, музей — викторина об искусстве,
// каток — удержи равновесие, караоке — ноты в ритм. Остальные (прогулка, тир, шашлык, боулинг, яхта) уже свои.

// ---------- Караоке: ноты едут к линии, жми в такт ----------
function gameRhythm(mg, cfg = {}) {
  const arena = $('mgArena');
  const total = cfg.notes || 12;
  arena.innerHTML = `<div class="rh-track" id="rhTrack"><div class="rh-hit"></div></div>
    <div class="rh-lyric" id="rhLyric">${cfg.lyric || '🎵'}</div>
    <button class="btn primary wide mg-big" id="rhBtn">${cfg.btn || '🎤 Петь!'}</button>`;
  const track = $('rhTrack');
  const notes = [];
  let spawned = 0, done = 0, last = performance.now(), nextAt = 0;
  const speed = cfg.speed || 0.42; // доля дорожки в секунду
  const HIT = 0.12;                // центр зоны попадания
  const finishNote = (n, cls) => { n.dead = true; done++; n.el.classList.add(cls); setTimeout(() => n.el.remove(), 250); $('mgTime').style.width = (1 - done / total) * 100 + '%'; if (done >= total) mgDelay(mg, mgEnd, 350); };
  $('mgTime').style.width = '100%';
  const loop = (now) => {
    if (!mgAlive(mg)) return;
    const dt = (now - last) / 1000; last = now;
    nextAt -= dt;
    if (spawned < total && nextAt <= 0) {
      const el = document.createElement('span');
      el.className = 'rh-note';
      el.textContent = pick(cfg.items || ['🎵', '🎶', '♪']);
      track.appendChild(el);
      notes.push({ x: 1, el, dead: false });
      spawned++;
      nextAt = rand(0.55, 1.05) / (1 + spawned * 0.02);
    }
    for (const n of notes) {
      if (n.dead) continue;
      n.x -= speed * dt * (1 + spawned * 0.015);
      n.el.style.left = n.x * 100 + '%';
      if (n.x < -0.04) { finishNote(n, 'miss'); sfx('error'); }
    }
    mg.raf = requestAnimationFrame(loop);
  };
  mg.raf = requestAnimationFrame(loop);
  $('rhBtn').onpointerdown = (e) => {
    e.preventDefault();
    if (!mgAlive(mg)) return;
    const n = notes.filter((x) => !x.dead).sort((a, b) => a.x - b.x)[0];
    const d = n ? Math.abs(n.x - HIT) : 1;
    if (n && d < 0.09) {
      const perfect = d < 0.035;
      mgScore(perfect ? 2 : 1);
      sfx(perfect ? 'crit' : 'tap'); haptic('light');
      floatAt($('rhBtn'), perfect ? (cfg.perfect || 'Идеально! 🎤') : '+1', 'good');
      finishNote(n, 'hit');
    } else {
      mgScore(-1); sfx('error'); shakeArena();
      floatAt($('rhBtn'), cfg.fail || 'Мимо нот!', 'bad');
    }
  };
}

// ---------- Каток: удержи равновесие ----------
function gameSkate(mg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="ice-rink"><div class="ice-zone"></div><div class="ice-pair" id="icePair">⛸️💑</div></div>
    <div class="ice-btns"><button class="btn primary" id="skL">⬅️</button><button class="btn primary" id="skR">➡️</button></div>`;
  const t0 = performance.now();
  let pos = 0.5, vel = 0, last = t0, inZone = 0, fell = 0;
  const loop = (now) => {
    if (!mgAlive(mg)) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = (now - t0) / 1000;
    // Лёд «уводит» в сторону, к концу всё сильнее
    vel += (Math.sin(t * 1.3) * 0.5 + Math.sin(t * 2.7 + 1) * 0.35) * (0.6 + t * 0.05) * dt;
    vel *= Math.exp(-1.6 * dt);
    pos += vel * dt;
    if (pos < 0.02 || pos > 0.98) {
      pos = clamp(pos, 0.02, 0.98); vel = 0;
      if (now - fell > 900) { fell = now; mgScore(-1); sfx('error'); shakeArena(); floatAt($('icePair'), 'Упали! 😵', 'bad'); }
    }
    const ok = Math.abs(pos - 0.5) < 0.14;
    $('icePair').style.left = pos * 100 + '%';
    $('icePair').classList.toggle('ok', ok);
    if (ok) { inZone += dt; if (inZone >= 1.5) { inZone = 0; mgScore(1); sfx('tap'); floatAt($('icePair'), '💕', 'good'); } }
    mg.raf = requestAnimationFrame(loop);
  };
  mg.raf = requestAnimationFrame(loop);
  const bind = (id, d) => { $(id).onpointerdown = (e) => { e.preventDefault(); if (mgAlive(mg)) { vel = clamp(vel + d, -0.6, 0.6); haptic('light'); } }; };
  bind('skL', -0.18); bind('skR', 0.18);
}

// ---------- Ресторан: разлей вино до черты ----------
function gamePour(mg) {
  const arena = $('mgArena');
  const total = 5;
  arena.innerHTML = `<div class="pr-wrap"><div class="pr-glass"><div class="pr-wine" id="prWine"></div><div class="pr-line" id="prLine"></div></div>
    <div class="pr-info" id="prInfo">Бокал 1 из ${total}</div></div>
    <button class="btn primary wide mg-big" id="prBtn">🍷 Держи, чтобы налить</button>`;
  let glass = 0, level = 0, target = 0, pouring = false, last = performance.now(), locked = false;
  const next = () => {
    level = 0; target = rand(0.45, 0.85);
    $('prLine').style.bottom = target * 100 + '%';
    $('prWine').style.height = '0%';
    $('prInfo').textContent = `Бокал ${glass + 1} из ${total}`;
    $('mgTime').style.width = (1 - glass / total) * 100 + '%';
  };
  const judge = () => {
    if (locked) return;
    locked = true;
    const d = level - target;
    let txt, kind = 'good';
    if (level > 0.98) { mgScore(-1); txt = 'Пролил на скатерть! 🙈'; kind = 'bad'; sfx('error'); shakeArena(); }
    else if (Math.abs(d) < 0.05) { mgScore(2); txt = 'Как сомелье! 🍷'; sfx('crit'); }
    else if (Math.abs(d) < 0.12) { mgScore(1); txt = d < 0 ? 'Чуть маловато' : 'Чуть многовато'; sfx('tap'); }
    else { txt = d < 0 ? 'Пожадничал…' : 'Через край!'; kind = 'bad'; sfx('error'); }
    floatAt($('prBtn'), txt, kind);
    glass++;
    setTimeout(() => { locked = false; if (!mgAlive(mg)) return; if (glass >= total) mgEnd(); else next(); }, 650);
  };
  const loop = (now) => {
    if (!mgAlive(mg)) return;
    const dt = (now - last) / 1000; last = now;
    if (pouring && !locked) {
      level = Math.min(1, level + dt * (0.32 + glass * 0.06));
      $('prWine').style.height = level * 100 + '%';
      if (level >= 1) { pouring = false; judge(); }
    }
    mg.raf = requestAnimationFrame(loop);
  };
  mg.raf = requestAnimationFrame(loop);
  const btn = $('prBtn');
  btn.onpointerdown = (e) => { e.preventDefault(); if (mgAlive(mg) && !locked) { pouring = true; sfx('tap'); } };
  btn.onpointerup = btn.onpointerleave = btn.onpointercancel = () => { if (pouring) { pouring = false; judge(); } };
  next();
}

// ---------- Вопросы: кино по эмодзи и музей ----------
const MOVIE_QUIZ = [
  ['🚢🧊💔', [['«Титаник»', 2], ['«Пираты Карибского моря»', -1], ['«Челюсти»', -1]]],
  ['🧔🔫🇺🇸 «Брат, …»', [['«Брат-2»', 2], ['«Бумер»', -1], ['«Жмурки»', -1]]],
  ['🦁👑🐗🐒', [['«Король Лев»', 2], ['«Мадагаскар»', -1], ['«Книга джунглей»', -1]]],
  ['🧙‍♂️💍🌋', [['«Властелин колец»', 2], ['«Гарри Поттер»', -1], ['«Хоббит» про дракона', -1]]],
  ['👨‍🚀🌽🪐⏳', [['«Интерстеллар»', 2], ['«Марсианин»', -1], ['«Гравитация»', -1]]],
  ['🦖🏝️🧬', [['«Парк юрского периода»', 2], ['«Кинг-Конг»', -1], ['«Годзилла»', -1]]],
  ['🚗🔥💨👨‍👨‍👦', [['«Форсаж»', 2], ['«Такси»', -1], ['«Бумер»', -1]]],
  ['🕷️🧑🏙️', [['«Человек-паук»', 2], ['«Бэтмен»', -1], ['«Мстители»', -1]]],
  ['🥶❄️👸⛄', [['«Холодное сердце»', 2], ['«Морозко»', -1], ['«Снежная королева» Андерсена', 1]]],
  ['🐟🔍🐠🌊', [['«В поисках Немо»', 2], ['«Русалочка»', -1], ['«Акулья история»', 1]]],
  ['🏃‍♂️🍫📦 «Жизнь как коробка…»', [['«Форрест Гамп»', 2], ['«Чарли и шоколадная фабрика»', -1], ['«Терминал»', -1]]],
  ['🤖⏰👦 «Я вернусь»', [['«Терминатор»', 2], ['«Робокоп»', -1], ['«Трансформеры»', -1]]],
  ['🐀👨‍🍳🇫🇷', [['«Рататуй»', 2], ['«Стюарт Литтл»', -1], ['«Шеф Адам Джонс»', -1]]],
  ['🎄🏠👦🪤 Один дома', [['«Один дома»', 2], ['«Ирония судьбы»', 1], ['«Крепкий орешек»', -1]]],
  ['🚕🎅❄️🍾 «С лёгким паром!»', [['«Ирония судьбы»', 2], ['«Джентльмены удачи»', 1], ['«Иван Васильевич»', -1]]],
];
const ART_QUIZ = [
  ['Кто написал «Мону Лизу»?', [['Леонардо да Винчи', 2], ['Микеланджело', -1], ['Шишкин', -1]]],
  ['Чья картина «Утро в сосновом лесу» с медведями?', [['Шишкина и Савицкого', 2], ['Репина', -1], ['Айвазовского', -1]]],
  ['Что рисовал Айвазовский чаще всего?', [['Море', 2], ['Натюрморты', -1], ['Портреты царей', -1]]],
  ['Как называется картина Малевича из одного квадрата?', [['«Чёрный квадрат»', 2], ['«Красный круг»', -1], ['«Тёмная комната»', -1]]],
  ['Кто отрезал себе ухо?', [['Ван Гог', 2], ['Пикассо', -1], ['Дали', -1]]],
  ['«Бурлаки на Волге» — это…', [['Репин', 2], ['Васнецов', -1], ['Кустодиев', -1]]],
  ['Знаменитые растёкшиеся часы рисовал…', [['Сальвадор Дали', 2], ['Клод Моне', -1], ['Рембрандт', -1]]],
  ['«Три богатыря» написал…', [['Васнецов', 2], ['Суриков', -1], ['Левитан', -1]]],
  ['Как называют картину с цветами и фруктами?', [['Натюрморт', 2], ['Пейзаж', -1], ['Графити', -1]]],
  ['Где хранится «Мона Лиза»?', [['Лувр, Париж', 2], ['Эрмитаж', -1], ['Третьяковка', -1]]],
  ['«Девятый вал» — это картина про…', [['Шторм на море', 2], ['Девятую симфонию', -1], ['Стройку', -1]]],
  ['Кто расписал потолок Сикстинской капеллы?', [['Микеланджело', 2], ['Рафаэль', 1], ['Донателло', -1]]],
];

Object.assign(DATE_GAMES, {
  cinema: { title: 'Кино: угадай фильм', hint: 'Она загадывает фильм эмодзи — угадай! Ошибки её расстроят', duration: 25, max: 10, setup: (mg) => talkGame(mg, MOVIE_QUIZ, 5) },
  rest: { title: 'Ресторан: разлей вино', hint: 'Держи кнопку и отпусти у черты. Не пролей на скатерть!', duration: 0, max: 10, setup: (mg) => gamePour(mg) },
  museum: { title: 'Музей: блесни знаниями', hint: 'Она проверяет, разбираешься ли ты в искусстве', duration: 25, max: 10, setup: (mg) => talkGame(mg, ART_QUIZ, 5) },
  skate: { title: 'Каток: держитесь вместе', hint: 'Жми ⬅️ ➡️ и удерживай пару в зелёной зоне. Не падайте!', duration: 18, max: 10, setup: (mg) => gameSkate(mg) },
  karaoke: { title: 'Караоке-дуэт', hint: 'Жми «Петь!», когда нота на розовой линии', duration: 0, max: 18,
    setup: (mg) => gameRhythm(mg, { notes: 12, lyric: '🎤 «Ты — моё сердце, ты — моя душа…»', items: ['🎵', '🎶', '♪', '💗'] }) },
});

// В окне выбора — какая мини-игра ждёт на каждом свидании
const DATE_GAME_ICON = { walk: '🌸 лови момент', cafe: '💬 разговор', cinema: '🎬 угадай фильм', rest: '🍷 разлей вино', yacht: '💃 танец',
  skate: '⛸️ равновесие', amuse: '🎯 тир', picnic: '🍢 шашлык', karaoke: '🎤 ритм', museum: '🖼️ викторина', bowling: '🎳 бросок' };
openDateMenu = (function (orig) {
  return function (id) {
    orig(id);
    document.querySelectorAll('#modalRoot .card').forEach((c) => {
      const b = c.querySelector('[data-act="date"]');
      const did = b && String(b.dataset.id).split(':')[1];
      const desc = c.querySelector('.card-desc');
      if (did && desc && DATE_GAME_ICON[did]) desc.insertAdjacentHTML('beforeend', `<br><span class="date-game">Игра: ${DATE_GAME_ICON[did]}</span>`);
    });
  };
})(openDateMenu);
