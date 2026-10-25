// Мини-игры: смена на работе и занятия в учёбе — это не ожидание таймера, а короткая игра на 25–35 секунд.
// Оплата смены зависит от результата, занятие засчитывается, только если набрал нужный счёт.

// ---------- Карьера: ранги на каждой работе ----------
const RANKS = [
  { name: 'Стажёр', shifts: 0, mult: 1 },
  { name: 'Работник', shifts: 5, mult: 1.15 },
  { name: 'Опытный', shifts: 15, mult: 1.3 },
  { name: 'Мастер', shifts: 35, mult: 1.5 },
  { name: 'Легенда', shifts: 80, mult: 1.75 },
];
function jobShifts(id) { return (S.jobs && S.jobs[id]) || 0; }
function jobRank(id) { let r = 0; RANKS.forEach((x, i) => { if (jobShifts(id) >= x.shifts) r = i; }); return r; }

// Что происходит в каждой мини-игре работы
const JOB_GAMES = {
  flyers: { type: 'targets', title: 'Раздай листовки', hint: 'Тапай по прохожим 🧑. Собак и полицию не трогай!', good: ['🧑', '👩', '🧔', '👵', '👨‍💼', '👩‍🦰', '🧑‍🎓'], bad: ['🐕', '👮'], goodRate: 0.75, every: 650, life: 1300, target: 26 },
  guard: { type: 'targets', title: 'Лови воришек', hint: 'Тапай по воришкам 🦹. Покупателей не трогай — будет жалоба!', good: ['🦹', '🦹‍♂️', '🥷'], bad: ['🧑', '👩', '👵', '🧒', '👨‍🦳'], goodRate: 0.4, every: 600, life: 1100, target: 16 },
  loader: { type: 'timing', title: 'Таскай ящики', hint: 'Жми «Поднять», когда метка в зелёной зоне. Точно в центр — двойной зачёт', btn: '💪 Поднять!', item: '📦', attempts: 12, target: 16 },
  courier: { type: 'lanes', title: 'Доставка', hint: 'Тапай слева или справа, чтобы сменить полосу. Собирай посылки 📦, объезжай ямы', good: ['📦', '📦', '🍕'], bad: ['🚧', '🕳️', '🚗'], player: '🛵', target: 18 },
  taxi: { type: 'lanes', title: 'Смена в такси', hint: 'Подбирай пассажиров 🙋, объезжай пробки и ямы', good: ['🙋', '🙋‍♀️', '🧳'], bad: ['🚧', '🕳️', '🚙', '🚌'], player: '🚕', target: 20 },
  seller: { type: 'orders', title: 'Обслужи покупателей', hint: 'Собери то, что просит покупатель. Ошибки злят клиентов', items: ['👕', '👖', '👗', '👟', '🧢', '🧥', '🧣', '👜'], size: [2, 3], target: 8 },
  manager: { type: 'orders', title: 'Закрой сделки', hint: 'Подбери клиенту нужный комплект техники', items: ['📱', '💻', '🖨️', '📺', '🎧', '⌚', '📷', '🖥️', '🎮'], size: [3, 4], target: 7 },
  director: { type: 'orders', title: 'Совещание', hint: 'Подпиши правильные решения для каждого отдела', items: ['📊', '📈', '🤝', '📝', '💼', '☎️', '🗂️', '📌', '💡'], size: [3, 5], target: 6 },
};

// Задания на занятиях для каждой ступени образования
const LESSON_GAMES = {
  1: { name: 'Устный счёт', type: 'math', need: 8, hard: 1 },
  2: { name: 'Запомни порядок инструментов', type: 'memory', need: 5 },
  3: { name: 'Приход или расход', type: 'sort', need: 10 },
  4: { name: 'Правда или ложь', type: 'truefalse', need: 10 },
  5: { name: 'Бизнес-математика', type: 'math', need: 9, hard: 3 },
};
const LESSON_TIME = 25;

const SORT_ITEMS = [
  ['Зарплата', 0], ['Аренда офиса', 1], ['Продажа товара', 0], ['Налоги', 1], ['Проценты по вкладу', 0], ['Закупка товара', 1],
  ['Оплата рекламы', 1], ['Возврат долга тебе', 0], ['Зарплата сотрудникам', 1], ['Выручка за день', 0], ['Коммуналка', 1],
  ['Дивиденды', 0], ['Ремонт оборудования', 1], ['Грант', 0], ['Штраф', 1], ['Премия', 0], ['Бензин', 1], ['Продажа металлолома', 0],
];
const TF_ITEMS = [
  ['Вода кипит при 100 °C на уровне моря', 1], ['Луна светит своим светом', 0], ['У человека 206 костей', 1], ['Кит — это рыба', 0],
  ['Свет быстрее звука', 1], ['Москва — столица России', 1], ['Пингвины живут на Северном полюсе', 0], ['Сердце — это мышца', 1],
  ['Солнце вращается вокруг Земли', 0], ['Инфляция — это рост цен', 1], ['Акция — это доля в компании', 1], ['Ноль — нечётное число', 0],
  ['Эверест — самая высокая гора', 1], ['У паука 6 ног', 0], ['Бумага делается из дерева', 1], ['Медь — магнитный металл', 0],
  ['Кредит нужно возвращать с процентами', 1], ['В году 54 недели', 0], ['Летучая мышь — млекопитающее', 1], ['Стекло делают из песка', 1],
];
const MEMORY_TOOLS = ['🔧', '🔨', '🪛', '⚙️'];

// =====================================================================
// Общий движок мини-игры
// =====================================================================

let MG = null;

function runGame({ title, hint, duration, setup, finish, scoreLabel = '' }) {
  const id = Date.now();
  MG = { id, score: 0, over: false, timers: [], raf: null, finish };
  openModal(`<div class="mg">
      <div class="mg-head"><b>${title}</b><span class="mg-score"><span id="mgScore">0</span>${scoreLabel}</span></div>
      <div class="mg-time"><div id="mgTime"></div></div>
      <div class="mg-arena" id="mgArena"><div class="mg-count" id="mgCount">3</div></div>
      <p class="mg-hint">${hint}</p></div>`, { center: true, locked: true });
  let c = 3;
  sfx('tick');
  const cd = setInterval(() => {
    if (!MG || MG.id !== id) { clearInterval(cd); return; }
    c--;
    if (c > 0) { $('mgCount').textContent = c; sfx('tick'); return; }
    clearInterval(cd);
    $('mgCount').remove();
    sfx('bell');
    MG.start = Date.now();
    setup(MG);
    if (duration) {
      const t = setInterval(() => {
        if (!MG || MG.id !== id || !$('mgTime')) { clearInterval(t); return; }
        const left = 1 - (Date.now() - MG.start) / (duration * 1000);
        $('mgTime').style.width = Math.max(0, left) * 100 + '%';
        if (left <= 0.2) $('mgTime').classList.add('low');
        if (left <= 0) { clearInterval(t); mgEnd(); }
      }, 100);
      MG.timers.push(t);
    }
  }, 700);
}

function mgAlive(mg) { return MG === mg && !mg.over && $('mgArena'); }

function mgScore(d) {
  if (!MG) return;
  MG.score = Math.max(0, MG.score + d);
  $('mgScore').textContent = MG.score;
  bump('mgScore');
}

function mgEnd() {
  if (!MG || MG.over) return;
  const mg = MG;
  mg.over = true;
  mg.timers.forEach((t) => { clearInterval(t); clearTimeout(t); });
  if (mg.raf) cancelAnimationFrame(mg.raf);
  MG = null;
  // Если в подсчёте итогов ошибка — не оставляем игрока перед замершим полем
  try { mg.finish(mg.score, mg); }
  catch (e) { console.error(e); closeModal(); toast('Что-то пошло не так с мини-игрой — попробуй ещё раз', 'bad'); }
}

function shakeArena() {
  const a = $('mgArena');
  if (a) a.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 220 });
}

// ---------- A. Тапай по целям ----------
function gameTargets(mg, cfg) {
  const arena = $('mgArena');
  const spawn = () => {
    if (!mgAlive(mg)) return;
    const good = Math.random() < cfg.goodRate;
    const el = document.createElement('button');
    el.className = 'mg-target';
    el.textContent = pick(good ? cfg.good : cfg.bad);
    el.style.left = rand(4, 78) + '%';
    el.style.top = rand(4, 72) + '%';
    el.onpointerdown = (e) => {
      e.preventDefault();
      if (el.dataset.hit || !mgAlive(mg)) return;
      el.dataset.hit = 1;
      if (good) { mgScore(1); sfx('tap'); haptic('light'); } else { mgScore(-2); sfx('error'); haptic('error'); shakeArena(); }
      el.classList.add(good ? 'hit' : 'miss');
      setTimeout(() => el.remove(), 250);
    };
    arena.appendChild(el);
    setTimeout(() => el.remove(), cfg.life);
    const elapsed = (Date.now() - mg.start) / 1000;
    mg.timers.push(setTimeout(spawn, Math.max(330, cfg.every - elapsed * 12)));
  };
  spawn();
}

// ---------- B. Тайминг ----------
function gameTiming(mg, cfg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="tm-stack" id="tmStack"></div>
    <div class="tm-bar"><div class="tm-zone" id="tmZone"></div><div class="tm-mark" id="tmMark"></div></div>
    <button class="btn primary wide mg-big" id="tmBtn">${cfg.btn}</button>`;
  let pos = 0, dir = 1, speed = 0.8, last = performance.now(), left = cfg.attempts;
  let zone = { x: 0.4, w: 0.24 };
  const newZone = () => {
    zone.w = Math.max(0.1, zone.w * 0.94);
    zone.x = rand(0.05, 0.95 - zone.w);
    $('tmZone').style.left = zone.x * 100 + '%';
    $('tmZone').style.width = zone.w * 100 + '%';
  };
  newZone();
  $('mgTime').style.width = '100%';
  const loop = (now) => {
    if (!mgAlive(mg)) return;
    const dt = (now - last) / 1000; last = now;
    pos += dir * speed * dt;
    if (pos > 1) { pos = 1; dir = -1; } else if (pos < 0) { pos = 0; dir = 1; }
    $('tmMark').style.left = pos * 100 + '%';
    mg.raf = requestAnimationFrame(loop);
  };
  mg.raf = requestAnimationFrame(loop);
  $('tmBtn').onpointerdown = (e) => {
    e.preventDefault();
    if (!mgAlive(mg)) return;
    const center = zone.x + zone.w / 2;
    const stack = $('tmStack');
    if (pos >= zone.x && pos <= zone.x + zone.w) {
      const perfect = Math.abs(pos - center) < zone.w / 5;
      mgScore(perfect ? 2 : 1);
      sfx(perfect ? 'crit' : 'gym');
      const box = document.createElement('span');
      box.textContent = cfg.item;
      stack.appendChild(box);
      if (perfect) floatAt($('tmBtn'), 'Идеально! +2', 'good');
    } else {
      sfx('error'); haptic('error'); shakeArena();
      floatAt($('tmBtn'), 'Уронил!', 'bad');
    }
    speed *= 1.09;
    left--;
    $('mgTime').style.width = (left / cfg.attempts) * 100 + '%';
    if (left <= 0) setTimeout(mgEnd, 400); else newZone();
  };
}

// ---------- C. Полосы движения ----------
function gameLanes(mg, cfg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="ln-road"><i></i><i></i></div><div class="ln-player" id="lnPlayer">${cfg.player}</div>`;
  let lane = 1, last = performance.now(), nextSpawn = 0;
  const objs = [];
  const player = $('lnPlayer');
  const setLane = (l) => { lane = clamp(l, 0, 2); player.style.left = (lane * 33.33 + 16.66) + '%'; };
  setLane(1);
  arena.onpointerdown = (e) => {
    e.preventDefault();
    if (!mgAlive(mg)) return;
    const r = arena.getBoundingClientRect();
    setLane(lane + (e.clientX - r.left < r.width / 2 ? -1 : 1));
    sfx('whoosh');
  };
  const loop = (now) => {
    if (!mgAlive(mg)) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const elapsed = (Date.now() - mg.start) / 1000;
    const speed = (0.55 + elapsed * 0.02) * (cfg.speed || 1); // доля высоты арены в секунду
    if (now > nextSpawn) {
      nextSpawn = now + Math.max(380, 900 - elapsed * 15) / (cfg.speed || 1);
      const good = Math.random() < (cfg.goodRate || 0.45);
      const el = document.createElement('div');
      el.className = 'ln-obj';
      el.textContent = pick(good ? cfg.good : cfg.bad);
      const l = Math.floor(Math.random() * 3);
      el.style.left = (l * 33.33 + 16.66) + '%';
      arena.appendChild(el);
      objs.push({ el, lane: l, y: -0.1, good });
    }
    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i];
      o.y += speed * dt;
      o.el.style.top = o.y * 100 + '%';
      if (o.y > 0.72 && o.y < 0.9 && o.lane === lane && !o.done) {
        o.done = true;
        if (o.good) { mgScore(1); sfx('coin'); o.el.classList.add('hit'); }
        else { mgScore(-1); floatAt(o.el, '−1', 'bad'); sfx('punch'); haptic('error'); shakeArena(); o.el.classList.add('miss'); }
        setTimeout(() => o.el.remove(), 200);
        objs.splice(i, 1);
      } else if (o.y > 1.05) { o.el.remove(); objs.splice(i, 1); }
    }
    mg.raf = requestAnimationFrame(loop);
  };
  mg.raf = requestAnimationFrame(loop);
}

// ---------- D. Собери заказ ----------
function gameOrders(mg, cfg) {
  const arena = $('mgArena');
  const shelf = shuffle(cfg.items).slice(0, Math.min(cfg.items.length, 9));
  arena.innerHTML = `<div class="od-client"><span class="od-face" id="odFace">🙂</span><div class="od-bubble" id="odOrder"></div></div>
    <div class="od-grid">${shelf.map((it) => `<button class="od-item" data-item="${it}">${it}</button>`).join('')}</div>`;
  let order = [];
  const newOrder = () => {
    const n = Math.floor(rand(cfg.size[0], cfg.size[1] + 1));
    order = shuffle(shelf).slice(0, n).map((it) => ({ it, done: false }));
    $('odOrder').innerHTML = order.map((o) => `<span>${o.it}</span>`).join('');
    $('odFace').textContent = pick(['🙂', '🧐', '😤', '🤓', '👩', '🧔']);
  };
  newOrder();
  arena.querySelectorAll('.od-item').forEach((b) => {
    b.onpointerdown = (e) => {
      e.preventDefault();
      if (!mgAlive(mg)) return;
      const o = order.find((x) => x.it === b.dataset.item && !x.done);
      if (o) {
        o.done = true;
        sfx('tap');
        $('odOrder').innerHTML = order.map((x) => `<span class="${x.done ? 'ok' : ''}">${x.it}</span>`).join('');
        if (order.every((x) => x.done)) { mgScore(1); sfx('coin'); $('odFace').textContent = '😄'; setTimeout(() => mgAlive(mg) && newOrder(), 350); }
      } else {
        mg.mistakes = (mg.mistakes || 0) + 1;
        sfx('error'); haptic('error'); shakeArena();
        $('odFace').textContent = '😠';
      }
    };
  });
}

// ---------- Задания на занятиях ----------
function mathQuestion(hard) {
  const r = (a, b) => Math.floor(rand(a, b + 1));
  const kind = Math.floor(Math.random() * (hard >= 3 ? 3 : 3));
  let q, a;
  if (hard >= 3) {
    if (kind === 0) { const p = pick([10, 15, 20, 25, 30, 50]); const n = r(2, 20) * 20; q = `${p}% от ${n}`; a = n * p / 100; }
    else if (kind === 1) { const n = r(2, 9) * 100; const k = pick([1.1, 1.2, 1.5, 0.8, 0.9]); q = `${n} × ${String(k).replace('.', ',')}`; a = Math.round(n * k); }
    else { const x = r(12, 60), y = r(12, 60); q = `${x} + ${y} × 2`; a = x + y * 2; }
  } else if (kind === 0) { const x = r(2, 30), y = r(2, 30); q = `${x} + ${y}`; a = x + y; }
  else if (kind === 1) { const x = r(10, 40), y = r(1, x); q = `${x} − ${y}`; a = x - y; }
  else { const x = r(2, 9), y = r(2, 9); q = `${x} × ${y}`; a = x * y; }
  const opts = shuffle([a, a + pick([1, 2, 10, -1]), a - pick([1, 3, 5, 10, -2])].filter((v, i, arr) => arr.indexOf(v) === i));
  while (opts.length < 3) opts.push(a + opts.length * 7);
  return { q: `${q} = ?`, a, opts: shuffle(opts) };
}

function lessonChoice(mg, nextQuestion) {
  const arena = $('mgArena');
  const show = () => {
    if (!mgAlive(mg)) return;
    const qn = nextQuestion();
    arena.innerHTML = `<div class="ls-q">${qn.q}</div><div class="ls-opts">${qn.opts.map((o) => `<button class="btn" data-v="${o}">${o}</button>`).join('')}</div>`;
    arena.querySelectorAll('.ls-opts .btn').forEach((b) => {
      b.onpointerdown = (e) => {
        e.preventDefault();
        if (!mgAlive(mg) || b.dataset.done) return;
        arena.querySelectorAll('.ls-opts .btn').forEach((x) => { x.dataset.done = 1; });
        const ok = String(b.dataset.v) === String(qn.a);
        b.classList.add(ok ? 'right' : 'wrong');
        if (ok) { mgScore(1); sfx('good'); } else { if (qn.penalty) mgScore(-1); sfx('error'); shakeArena(); }
        setTimeout(show, ok ? 250 : 550);
      };
    });
  };
  show();
}

function gameMemory(mg, need) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="ls-q" id="memMsg">Смотри внимательно…</div><div class="mem-grid">${MEMORY_TOOLS.map((t, i) => `<button class="mem-btn" data-i="${i}">${t}</button>`).join('')}</div>`;
  const btns = [...arena.querySelectorAll('.mem-btn')];
  let seq = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)];
  let input = [], showing = true;
  const flash = (i) => { btns[i].classList.add('lit'); sfx('notify'); setTimeout(() => btns[i].classList.remove('lit'), 380); };
  const play = async () => {
    showing = true;
    $('memMsg').textContent = `Запомни: ${seq.length} шт.`;
    await wait(500);
    for (const i of seq) { if (!mgAlive(mg)) return; flash(i); await wait(620); }
    if (!mgAlive(mg)) return;
    showing = false; input = [];
    $('memMsg').textContent = 'Повтори!';
  };
  btns.forEach((b) => {
    b.onpointerdown = (e) => {
      e.preventDefault();
      if (showing || !mgAlive(mg)) return;
      const i = +b.dataset.i;
      flash(i);
      input.push(i);
      if (seq[input.length - 1] !== i) { sfx('error'); shakeArena(); $('memMsg').textContent = 'Ошибка!'; setTimeout(mgEnd, 600); return; }
      if (input.length === seq.length) {
        mgScore(1);
        if (seq.length >= need + 1) { setTimeout(mgEnd, 500); return; }
        seq.push(Math.floor(Math.random() * 4));
        setTimeout(play, 600);
      }
    };
  });
  play();
}

// =====================================================================
// Смена на работе
// =====================================================================

function startJobGame(j) {
  const cfg = JOB_GAMES[j.id];
  const setup = (mg) => {
    if (cfg.type === 'targets') gameTargets(mg, cfg);
    if (cfg.type === 'timing') gameTiming(mg, cfg);
    if (cfg.type === 'lanes') gameLanes(mg, cfg);
    if (cfg.type === 'orders') gameOrders(mg, cfg);
  };
  runGame({ title: `${j.emoji} ${cfg.title}`, hint: cfg.hint, duration: cfg.type === 'timing' ? 0 : 30, setup, finish: (score, mg) => finishJob(j, score, mg) });
}

function finishJob(j, score, mg) {
  const cfg = JOB_GAMES[j.id];
  let perf = score / cfg.target;
  if (cfg.type === 'orders') perf -= (mg.mistakes || 0) * 0.05;
  perf = clamp(perf, 0.2, 1.25);
  const rankBefore = jobRank(j.id);
  const road = cfg.type === 'lanes' ? 1 + transportJobBonus() : 1;
  const pay = Math.round(j.pay * perf * mods().work * RANKS[rankBefore].mult * road * (j.physical ? 1 + S.strength / 200 : 1));
  addMoney(pay);
  addMood(j.mood);
  if (j.health) hurt(-j.health);
  S.jobs[j.id] = jobShifts(j.id) + 1;
  S.stats.shifts++;
  track('shift');
  addXp(8 + JOBS.indexOf(j) * 6);
  const roadNote = cfg.type === 'lanes' ? useTransport() : '';
  const stars = perf >= 1 ? 3 : perf >= 0.6 ? 2 : 1;
  const rankAfter = jobRank(j.id);
  const promo = rankAfter > rankBefore ? `<br><br>🎖️ <b>Повышение: ${RANKS[rankAfter].name}!</b> Оплата теперь ×${RANKS[rankAfter].mult}` : '';
  const next = RANKS[rankAfter + 1];
  resultModal({
    emoji: ['😓', '🙂', '😎'][stars - 1], rays: stars === 1 ? 'bad' : '',
    title: `${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)} Смена окончена`,
    text: `${j.name}: результат ${score} (${Math.round(perf * 100)}%)<br>Заработано: <b style="color:var(--gold)">+${fmt(pay)} ₽</b>${roadNote}${promo}
      ${next ? `<br><small>До ранга «${next.name}»: ${next.shifts - jobShifts(j.id)} смен</small>` : ''}`,
    btn: 'Забрать',
  });
  if (stars === 3 || promo) confetti(50);
  sfx(stars === 1 ? 'lose' : 'win');
  save();
}

EXTRA_TABS.life.work = () => `<div class="info-card">Смена — это мини-игра на ~30 секунд: чем лучше сыграешь, тем больше заплатят. С каждой сменой растёт ранг: Стажёр → Работник → Опытный → Мастер → Легенда (до ×1.75 к оплате). Высокий ранг открывает следующую работу.
    ${S.health < 25 ? '<br><b style="color:var(--red)">Ты слишком болен для работы — подлечись.</b>' : ''}</div>` +
  JOBS.map((j) => {
    const ok = reqOk(j.req);
    const r = jobRank(j.id), next = RANKS[r + 1];
    const btn = S.busy ? busyBtn : `<button class="btn ${ok ? 'primary' : ''}" data-act="job" data-id="${j.id}" ${ok ? '' : 'disabled'}>На смену</button>`;
    return card({ thumb: j.emoji, title: j.name, btn, cls: ok ? '' : 'locked',
      desc: `До <b>${fmt(j.pay * 1.25 * RANKS[r].mult)} ₽</b> за смену · ${JOB_GAMES[j.id].title}${j.physical ? ' · 💪 сила' : ''}${JOB_GAMES[j.id].type === 'lanes' && transportJobBonus() ? ` · ${vehicle().emoji} +${Math.round(transportJobBonus() * 100)}%` : ''}
        <br>−${j.energy} ⚡ · −${j.food} 🍞${j.health ? ` · ${j.health} ❤️` : ''}`,
      extra: (jobShifts(j.id) ? `<div class="card-desc">🎖️ ${RANKS[r].name} (×${RANKS[r].mult})${next ? ` · до «${next.name}» ${next.shifts - jobShifts(j.id)} смен` : ''}</div>` : '') + reqHTML(j.req) });
  }).join('');

// =====================================================================
// Занятия в учёбе
// =====================================================================

function startLessonGame(stage) {
  const lg = LESSON_GAMES[stage];
  const need = Math.max(2, Math.round(lg.need * (hasEffect('t_focus') ? 0.75 : 1)));
  const setup = (mg) => {
    if (lg.type === 'math') lessonChoice(mg, () => mathQuestion(lg.hard));
    if (lg.type === 'sort') lessonChoice(mg, () => { const [t, v] = pick(SORT_ITEMS); return { q: t, a: v ? 'Расход' : 'Приход', opts: ['Приход', 'Расход'], penalty: true }; });
    if (lg.type === 'truefalse') lessonChoice(mg, () => { const [t, v] = pick(TF_ITEMS); return { q: t, a: v ? 'Правда' : 'Ложь', opts: ['Правда', 'Ложь'], penalty: true }; });
    if (lg.type === 'memory') gameMemory(mg, need);
  };
  runGame({
    title: `📖 ${lg.name}`, scoreLabel: ` / ${need}`,
    hint: lg.type === 'memory' ? `Повтори последовательность из ${need + 1} инструментов` : `Набери ${need} верных ответов за ${LESSON_TIME} секунд`,
    duration: lg.type === 'memory' ? 0 : LESSON_TIME, setup,
    finish: (score) => finishLesson(stage, score, need),
  });
}

function finishLesson(stage, score, need) {
  const passed = score >= need;
  if (passed && S.study) {
    S.study.done++;
    track('lesson');
    addXp(XP.lesson);
    const left = S.study.need - S.study.done;
    resultModal({ emoji: '📗', title: 'Занятие засчитано!', text: `Результат: ${score} из ${need}. ${left > 0 ? `Осталось занятий: ${left}` : 'Все занятия пройдены — можно сдавать экзамен!'}`, btn: 'Дальше' });
    sfx('win');
  } else {
    resultModal({ emoji: '📕', rays: 'bad', title: 'Не засчитано', text: `Результат: ${score}, а нужно ${need}. Энергия потрачена — попробуй ещё раз, когда отдохнёшь.`, btn: 'Эх' });
    sfx('lose');
  }
  save();
}
