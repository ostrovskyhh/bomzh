// Мини-игры 2.6: понятнее и разнообразнее.
// • Перед первой игрой каждого вида — карточка «Как играть»: цель, что нажимать, сколько очков = 100%.
// • Три новых вида: «Память» (найди пары), «Сортировка» (разложи по двум корзинам), «Повтори» (запомни
//   последовательность). Почтальон, менеджер и директор теперь играют в них — у работ меньше одинаковых игр.

// ---------- Новые игры ----------
function gamePairs(mg, cfg) {
  const arena = $('mgArena');
  const deal = () => {
    const icons = shuffle(cfg.items).slice(0, 6);
    const deck = shuffle([...icons, ...icons]);
    arena.innerHTML = `<div class="mem-grid">${deck.map((e, i) => `<button class="mem-card" data-i="${i}" data-e="${e}"><span>${e}</span></button>`).join('')}</div>`;
    let open = [], lock = false, left = 6;
    arena.querySelectorAll('.mem-card').forEach((b) => {
      b.onpointerdown = (ev) => {
        ev.preventDefault();
        if (!mgAlive(mg) || lock || b.classList.contains('open') || b.classList.contains('done')) return;
        b.classList.add('open'); sfx('tap');
        open.push(b);
        if (open.length < 2) return;
        const [a, c] = open; open = [];
        if (a.dataset.e === c.dataset.e) {
          a.classList.add('done'); c.classList.add('done'); mgScore(2); sfx('coin'); haptic('light');
          if (--left === 0) { floatAt(arena, 'Всё собрано! Новая раздача', 'good'); setTimeout(() => mgAlive(mg) && deal(), 500); }
        } else {
          lock = true; mg.mistakes = (mg.mistakes || 0) + 1; sfx('error');
          setTimeout(() => { a.classList.remove('open'); c.classList.remove('open'); lock = false; }, 650);
        }
      };
    });
  };
  deal();
}

function gameSort(mg, cfg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="sort-wrap"><div class="sort-item" id="sortItem"></div><div class="sort-timer"><div id="sortT"></div></div></div>
    <div class="sort-bins"><button class="btn" data-side="0"><span>${cfg.bins[0].e}</span>${cfg.bins[0].name}</button><button class="btn" data-side="1"><span>${cfg.bins[1].e}</span>${cfg.bins[1].name}</button></div>`;
  let cur = null, born = 0, limit = cfg.limit || 2600;
  const next = () => {
    const side = Math.random() < 0.5 ? 0 : 1;
    cur = { side, e: pick(cfg.bins[side].items) };
    born = Date.now();
    $('sortItem').textContent = cur.e;
    $('sortItem').animate([{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 180 });
  };
  const answer = (side) => {
    if (!mgAlive(mg) || !cur) return;
    if (side === cur.side) { mgScore(1); sfx('tap'); haptic('light'); }
    else { mgScore(-1); mg.mistakes = (mg.mistakes || 0) + 1; sfx('error'); shakeArena(); }
    limit = Math.max(1200, limit - 40);
    next();
  };
  arena.querySelectorAll('[data-side]').forEach((b) => { b.onpointerdown = (e) => { e.preventDefault(); answer(+b.dataset.side); }; });
  const loop = () => {
    if (!mgAlive(mg)) return;
    const k = 1 - (Date.now() - born) / limit;
    if ($('sortT')) $('sortT').style.width = Math.max(0, k) * 100 + '%';
    if (k <= 0 && cur) { mg.mistakes = (mg.mistakes || 0) + 1; sfx('error'); next(); }
    mg.raf = requestAnimationFrame(loop);
  };
  next();
  mg.raf = requestAnimationFrame(loop);
}

function gameSimon(mg, cfg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="simon-info" id="simInfo">Смотри…</div><div class="simon-pads">${cfg.items.map((e, i) => `<button class="simon-pad p${i}" data-i="${i}">${e}</button>`).join('')}</div>`;
  const pads = [...arena.querySelectorAll('.simon-pad')];
  let seq = [], pos = 0, input = false, len = 3;
  const flash = (i) => { pads[i].classList.add('lit'); sfx('tap'); setTimeout(() => pads[i] && pads[i].classList.remove('lit'), 320); };
  const show = async () => {
    input = false; pos = 0;
    seq = Array.from({ length: len }, () => Math.floor(Math.random() * pads.length));
    $('simInfo').textContent = `Запомни: ${len} шагов`;
    await wait(500);
    for (const i of seq) { if (!mgAlive(mg)) return; flash(i); await wait(520); }
    if (!mgAlive(mg)) return;
    input = true; $('simInfo').textContent = 'Повтори!';
  };
  pads.forEach((b) => {
    b.onpointerdown = (e) => {
      e.preventDefault();
      if (!mgAlive(mg) || !input) return;
      const i = +b.dataset.i;
      flash(i);
      if (i === seq[pos]) {
        pos++;
        if (pos >= seq.length) { mgScore(len - 1); sfx('coin'); floatAt(b, `+${len - 1}`, 'good'); len = Math.min(8, len + 1); input = false; setTimeout(show, 450); }
      } else { mg.mistakes = (mg.mistakes || 0) + 1; sfx('error'); shakeArena(); $('simInfo').textContent = 'Сбился! Ещё раз'; len = Math.max(3, len - 1); input = false; setTimeout(show, 700); }
    };
  });
  show();
}

// ---------- Новые игры у работ ----------
Object.assign(JOB_GAMES, {
  postman: { type: 'sort', title: 'Разбери почту', hint: 'Письма ✉️ — в почтовый ящик, посылки 📦 — на склад. Быстро: у каждой вещи есть пара секунд',
    bins: [{ e: '📮', name: 'В ящик', items: ['✉️', '💌', '📨', '🧾', '📰'] }, { e: '🏤', name: 'На склад', items: ['📦', '🎁', '🛍️', '🧳'] }], limit: 2600, target: 18 },
  manager: { type: 'memory', title: 'Запомни клиентов', hint: 'Открывай карточки по две и находи одинаковые. Пара = 2 очка, ошибки отнимают время',
    items: ['📱', '💻', '🖨️', '📺', '🎧', '⌚', '📷', '🖥️', '🎮'], target: 14 },
  director: { type: 'simon', title: 'План совещания', hint: 'Смотри, какие отделы загораются, и повтори порядок. Длиннее цепочка — больше очков',
    items: ['📊', '🤝', '💡', '📝'], target: 14 },
});

startShiftGame = (function (orig) {
  return function (j, onFinish, titleExtra = '') {
    const cfg = JOB_GAMES[j.id];
    const fn = { memory: gamePairs, sort: gameSort, simon: gameSimon }[cfg.type];
    if (!fn) { orig(j, onFinish, titleExtra); return; }
    runGame({ title: `${j.emoji} ${cfg.title}${titleExtra}`, hint: cfg.hint, duration: 30, setup: (mg) => fn(mg, cfg), finish: onFinish });
  };
})(startShiftGame);
shiftPerf = (function (orig) {
  return function (j, score, mg) {
    const cfg = JOB_GAMES[j.id];
    if (!['memory', 'sort', 'simon'].includes(cfg.type)) return orig(j, score, mg);
    return clamp(score / cfg.target - (mg.mistakes || 0) * 0.02, j.state ? 0.5 : 0.2, 1.25);
  };
})(shiftPerf);

// ---------- «Как играть» перед первой игрой каждого вида ----------
runGame = (function (orig) {
  return function (o) {
    const key = String(o.title || '').replace(/^\S+\s/, '').slice(0, 40);
    if (!S.mgRules) S.mgRules = {};
    if (S.mgRules[key] || !o.hint) { orig(o); return; }
    S.mgRules[key] = 1;
    MG_PENDING = o;
    openModal(`<div class="mg-rules"><div class="bc-e">🎮</div><h3>${o.title}</h3>
      <div class="mr-box"><b>Как играть</b><p>${o.hint}</p></div>
      <div class="mr-row"><span>⏱️</span>${o.duration ? `${o.duration} секунд` : 'Пока не закончатся попытки'}</div>
      <div class="mr-row"><span>⭐</span>Чем больше очков — тем больше награда. Счёт — справа сверху</div>
      <div class="btns"><button class="btn primary wide" data-act="mgRulesGo">Понятно, начать!</button></div></div>`, { center: true, locked: true });
  };
})(runGame);
let MG_PENDING = null;
ACTIONS.mgRulesGo = () => { const o = MG_PENDING; MG_PENDING = null; if (o) runGame(o); };
