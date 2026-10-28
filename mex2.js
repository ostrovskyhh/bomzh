// Мексика 4.1: все мини-игры — свои. 19 новых механик, которых нет ни в Засранске, ни в Москвабаде:
// комаль с тортильями, пиньята, лассо, сальса, сёрф, агава, сборка заказа на ленте, лотерия, глубоководная рыбалка,
// лучадор, подкоп, торг, «одобрить/отказать» по правилам, маршрут по-испански, улица с номерами, слова, «правда/ложь»,
// баланс и сейф. Работы, отдых, учёба, зал, свидания, дети, дела с ней, тюрьма и криминал в Мексике — на этих играх.

// ---------- Общее ----------
// Мексика говорит по-русски: игровые подсказки и отклики — русские с мексиканским колоритом.
// Словарь «как в Мехико, только понятно»: отклики в играх, не названия мест и не реплики героев.
const MX_RU = {
  '¡Perfecto!': 'Идеально!', '¡Delicioso! +2': 'Вкусно! +2', '¡Centro!': 'В десятку!', '¡Bien!': 'Отлично!',
  '¡Atrapado!': 'Поймал!', '¡Olé!': 'Оле!', '¡Listo! +2': 'Готово! +2', '¡Corre y se va!': 'Быстрее!',
  '¡Lotería!': 'Лотерея!', '¡No!': 'Не то!', '¡Pescado!': 'Есть рыба!', '¡La Plancha! +2': 'Планка! +2',
  '¡Alto! Услышали!': 'Стой! Услышали!', '¡Libre! +2': 'Свободен! +2', '¡Muy caro! Ушёл': 'Дорого! Ушёл',
  '¡Trato hecho! +3': 'Сговорились! +3', '¡No, señor!': 'Не то, сеньор!', '¡Izquierda!': 'Влево!',
  '¡Recto!': 'Прямо!', '¡Derecha!': 'Вправо!', 'Recalculando…': 'Считаю…', '¡Entregado!': 'Доставлено!',
  '¡Correcto!': 'Правильно!', '¡Sí!': 'Да!', '¡Así!': 'Вот так!', '¡Abierto! +2': 'Открыто! +2',
  '¡Clic!': 'Клик!', '¡Ringer!': 'Попал!', '¡Salvado!': 'Спас!', '¡Piña!': 'Ананас!', '¡Gracias!': 'Спасибо!',
  '¡Ladrón!': 'Вор!', '¡Oye! Кто там?': 'Эй! Кто там?', '¡Qué bonito!': 'Красиво!', '¡Mayoría!': 'Большинство!',
  '¡Rico! +2': 'Богато! +2', '¡Oye! Кто там?': 'Эй! Кто там?', '¡Qué rico!': 'Как вкусно!', '¡Claro que sí!': 'Конечно!',
  '¡Tacos!': 'Тако!', '¡Margaritas!': 'Маргариты!', '¡Mariachi!': 'Мариачи!', '¡Libre!': 'Свободен!',
};
// Перевести по словарю, если есть совпадение — иначе оставить как есть
function mxRu(s) { return MX_RU[s] || s; }

function mxA(html, cls = '') { const a = $('mgArena'); a.className = `mg-arena mx-arena ${cls}`; a.innerHTML = html; return a; }
function mxCap(el, e) { try { el.setPointerCapture(e.pointerId); } catch (err) { /* синтетическое касание */ } }
function mxBtn(el, fn) { if (el) el.onpointerdown = (e) => { e.preventDefault(); fn(e); }; }
function mxMiss(mg, el, text, pts = 0) {
  mg.mistakes = (mg.mistakes || 0) + 1;
  if (pts) mgScore(-pts);
  sfx('error'); haptic('error'); shakeArena();
  if (el && text) floatAt(el, mxRu(text), 'bad');
}
function mxHit(el, text, n = 1) { mgScore(n); sfx('coin'); haptic('light'); if (el && text) floatAt(el, mxRu(text), 'good'); }
// Свой таймер — для игр, которые запускаются без полоски времени (зал, свидания «до конца»)
function mxEnd(mg, sec) {
  if (!sec) return;
  const t0 = Date.now();
  const t = setInterval(() => {
    if (!mgAlive(mg)) { clearInterval(t); return; }
    const left = 1 - (Date.now() - t0) / (sec * 1000);
    const el = $('mgTime');
    if (el) el.style.width = Math.max(0, left) * 100 + '%';
    if (left <= 0) { clearInterval(t); mgEnd(); }
  }, 100);
  mg.timers.push(t);
}
function mxOut(mg, max) { if ((mg.mistakes || 0) >= max) { setTimeout(mgEnd, 500); return true; } return false; }

// ---------- 1. Комаль: переворачивай вовремя ----------
function mxComal(mg, cfg) {
  const n = cfg.slots || 4;
  mxA(`<div class="mx-comal">${Array.from({ length: n }, (_, i) => `<button class="mx-pan" data-i="${i}"><span></span><b></b></button>`).join('')}</div>
    <div class="mx-note">${cfg.note || '1 — первая сторона, 2 — вторая. Золотое кольцо — пора!'}</div>`, 'mx-kitchen');
  const pans = [...document.querySelectorAll('.mx-pan')];
  const st = [];
  const put = (i, delay) => { st[i] = { e: pick(cfg.items), side: 0, p: -delay, speed: 1 / rand(...(cfg.cook || [2, 3.2])) }; };
  pans.forEach((b, i) => {
    put(i, i * 0.7);
    mxBtn(b, () => {
      const s = st[i];
      if (!mgAlive(mg) || s.p < 0 || s.p > 1) return;
      if (s.p < 0.6) { floatAt(b, cfg.raw || 'Сырое!', 'bad'); sfx('error'); return; }
      const perfect = s.p >= 0.7 && s.p <= 0.86;
      if (s.side === 0) {
        s.side = 1; s.p = 0; sfx('chip');
        b.querySelector('span').animate([{ transform: 'rotateY(0)' }, { transform: 'rotateY(180deg)' }, { transform: 'rotateY(360deg)' }], { duration: 300 });
        if (perfect) floatAt(b, 'Идеально!', 'good');
      } else { mxHit(b, perfect ? cfg.perfect || 'Вкусно! +2' : '+1', perfect ? 2 : 1); put(i, 0.5); }
    });
  });
  mgLoop(mg, (dt) => {
    pans.forEach((b, i) => {
      const s = st[i];
      s.p += dt * s.speed;
      if (s.p > 1.12) { mxMiss(mg, b, cfg.burnt || 'Сгорело!'); put(i, 0.6); }
      const p = Math.max(0, s.p);
      const sp = b.querySelector('span');
      sp.textContent = s.p < 0 ? '' : s.e;
      sp.style.filter = `sepia(${Math.min(1, p * 0.7)}) brightness(${1 - Math.max(0, p - 0.9) * 2.5})`;
      b.style.setProperty('--p', Math.min(1, p).toFixed(3));
      b.className = `mx-pan ${s.p < 0 ? 'empty' : s.p < 0.6 ? 'raw' : s.p <= 1 ? 'ready' : 'burn'}`;
      b.querySelector('b').textContent = s.p < 0 ? '' : s.side ? '2' : '1';
    });
  });
  mxEnd(mg, cfg.time);
}

// ---------- 2. Пиньята: бей, когда она над палкой ----------
function mxPinata(mg, cfg) {
  mxA(`<div class="mx-pin"><div class="mx-rope" id="pinRope"><i></i><span id="pinE">${pick(cfg.items)}</span></div><div class="mx-stick">${cfg.stick || '🏏'}</div>
    <div class="mx-left" id="pinLeft"></div><div class="mx-hp" id="pinHp"></div></div>
    <button class="btn primary wide mg-big" id="pinBtn">${cfg.btn || '🏏 Удар!'}</button>`, 'mx-fiesta');
  let t = 0, speed = cfg.speed || 1.7, left = cfg.swings || 8, hp = cfg.hp || 3, x = 0, cool = 0;
  const show = () => { $('pinLeft').textContent = cfg.time ? '' : `Ударов: ${left}`; $('pinHp').textContent = '❤️'.repeat(hp); };
  show();
  mgLoop(mg, (dt) => {
    t += dt * speed; cool -= dt;
    x = Math.sin(t) * (0.55 + 0.3 * Math.sin(t * 0.43));
    $('pinRope').style.transform = `rotate(${x * 42}deg)`;
  });
  mxBtn($('pinBtn'), () => {
    if (!mgAlive(mg) || cool > 0 || (!cfg.time && left <= 0)) return;
    cool = 0.35;
    if (!cfg.time) left--;
    const d = Math.abs(x);
    const pts = d < 0.08 ? 50 : d < 0.2 ? 25 : d < 0.34 ? 10 : 0;
    const e = $('pinE');
    if (pts) {
      mgScore(cfg.unit ? Math.ceil(pts / 25) : pts); sfx(pts === 50 ? 'crit' : 'tap'); haptic('medium');
      floatAt(e, pts === 50 ? 'В десятку!' : pts === 25 ? 'Отлично!' : 'Задел', 'good');
      e.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3) rotate(15deg)' }, { transform: 'scale(1)' }], { duration: 250 });
      if (--hp <= 0) {
        mgScore(cfg.unit ? 2 : cfg.bonus || 20); sfx('jackpot'); confetti(30);
        floatAt(e, cfg.breakText || '🍬 Конфеты!', 'good');
        hp = cfg.hp || 3; speed *= 1.12; e.textContent = pick(cfg.items);
      }
    } else { sfx('whoosh'); floatAt($('pinBtn'), 'Мимо!', 'bad'); }
    show();
    if (!cfg.time && left <= 0) setTimeout(mgEnd, 600);
  });
  mxEnd(mg, cfg.time);
}

// ---------- 3. Лассо / спасательный круг: брось, когда цель внутри петли ----------
function mxLasso(mg, cfg) {
  mxA(`<div class="mx-field"><div class="mx-ring" id="lsRing">${cfg.ringIcon || ''}</div><div class="mx-runner" id="lsRun"></div></div>
    <button class="btn primary wide mg-big" id="lsBtn">${cfg.btn || '➰ Бросить лассо'}</button>`, cfg.bg || 'mx-ranch');
  const arena = $('mgArena'), ring = $('lsRing'), run = $('lsRun');
  let t = 0, r = 40, cool = 0, cur = null, throws = cfg.throws || 0;
  const spawn = () => {
    const good = Math.random() > (cfg.badRate || 0.25);
    const dir = Math.random() < 0.5 ? 1 : -1;
    cur = { good, dir, x: dir > 0 ? -0.1 : 1.1, y: rand(0.22, 0.62), v: rand(0.22, 0.38) * (1 + mg.score * 0.03) };
    run.textContent = pick(good ? cfg.good : cfg.bad);
    run.style.transform = `scaleX(${dir > 0 ? -1 : 1})`;
  };
  spawn();
  mgLoop(mg, (dt) => {
    t += dt; cool -= dt;
    r = 34 + 22 * Math.sin(t * (cfg.pulse || 2.4));
    ring.style.width = ring.style.height = r * 2 + 'px';
    cur.x += cur.dir * cur.v * dt;
    cur.y += Math.sin(t * 3 + cur.x * 9) * dt * 0.08;
    run.style.left = cur.x * 100 + '%'; run.style.top = cur.y * 100 + '%';
    if (cur.x < -0.15 || cur.x > 1.15) spawn();
  });
  mxBtn($('lsBtn'), () => {
    if (!mgAlive(mg) || cool > 0) return;
    cool = 0.45;
    const a = arena.getBoundingClientRect(), g = ring.getBoundingClientRect(), u = run.getBoundingClientRect();
    const dx = (u.left + u.width / 2) - (g.left + g.width / 2), dy = (u.top + u.height / 2) - (g.top + g.height / 2);
    ring.animate([{ transform: 'translate(-50%,-50%) scale(1.25)' }, { transform: 'translate(-50%,-50%) scale(1)' }], { duration: 250 });
    if (Math.hypot(dx, dy) <= r + 6 && a.width) {
      if (cur.good) mxHit(run, cfg.hitText || 'Поймал!');
      else mxMiss(mg, run, cfg.badText || 'Не того!', 1);
      spawn();
    } else { sfx('whoosh'); floatAt(ring, 'Мимо', 'bad'); }
    if (cfg.throws && --throws <= 0) setTimeout(mgEnd, 500);
  });
  mxEnd(mg, cfg.time);
}

// ---------- 4. Танец / мариачи: ноты падают на линию ----------
function mxDance(mg, cfg) {
  const L = cfg.lanes, n = L.length;
  mxA(`<div class="mx-dance">${L.map((_, i) => `<div class="mx-lane" style="left:${(i * 100) / n}%;width:${100 / n}%"></div>`).join('')}
      <div class="mx-hitline"></div><div class="mx-dancer" id="dnD">${cfg.dancer || '💃'}</div><div class="mx-combo" id="dnC"></div></div>
    <div class="mx-pads ${n === 3 ? 'three' : ''}">${L.map((l, i) => `<button class="mx-pad" data-i="${i}">${l}</button>`).join('')}</div>`, cfg.bg || 'mx-night');
  const box = document.querySelector('.mx-dance');
  const notes = [];
  let every = cfg.every || 0.75, wait = 0.5, speed = cfg.speed || 0.42, combo = 0;
  const HIT = 0.8;
  const setCombo = () => { $('dnC').textContent = combo >= 3 ? `×${combo}` : ''; };
  mgLoop(mg, (dt) => {
    wait -= dt;
    if (wait <= 0) {
      const lane = Math.floor(Math.random() * n);
      const el = document.createElement('div');
      el.className = 'mx-note-fall';
      el.textContent = (cfg.notes || L)[lane];
      el.style.left = ((lane + 0.5) * 100) / n + '%';
      box.appendChild(el);
      notes.push({ lane, y: -0.05, el });
      every = Math.max(cfg.min || 0.38, every * 0.985); wait = every * rand(0.7, 1.2); speed = Math.min(0.75, speed * 1.004);
    }
    for (let i = notes.length - 1; i >= 0; i--) {
      const o = notes[i];
      o.y += dt * speed;
      o.el.style.top = o.y * 100 + '%';
      if (o.y > 0.97) { o.el.remove(); notes.splice(i, 1); combo = 0; setCombo(); mg.mistakes = (mg.mistakes || 0) + 1; }
    }
  });
  document.querySelectorAll('.mx-pad').forEach((b) => mxBtn(b, () => {
    if (!mgAlive(mg)) return;
    const lane = +b.dataset.i;
    let best = -1, bd = 1;
    notes.forEach((o, i) => { const d = Math.abs(o.y - HIT); if (o.lane === lane && d < bd) { bd = d; best = i; } });
    b.animate([{ transform: 'scale(.9)' }, { transform: 'scale(1)' }], { duration: 120 });
    if (best >= 0 && bd < 0.1) {
      const o = notes.splice(best, 1)[0];
      o.el.remove();
      combo++; setCombo();
      const perfect = bd < 0.04;
      mgScore(perfect || combo % 8 === 0 ? 2 : 1); sfx(perfect ? 'crit' : 'tap'); haptic('light');
      $('dnD').animate([{ transform: 'translateX(-50%) translateY(0)' }, { transform: `translateX(-50%) translateY(-10px) rotate(${lane % 2 ? 12 : -12}deg)` }, { transform: 'translateX(-50%) translateY(0)' }], { duration: 220 });
      if (perfect) floatAt(b, 'Оле!', 'good');
    } else { combo = 0; setCombo(); sfx('error'); }
  }));
  mxEnd(mg, cfg.time);
}

// ---------- 5. Волна: держи — вверх, отпусти — вниз ----------
function mxSurf(mg, cfg) {
  mxA(`<div class="mx-sea"><div class="mx-wave"></div><div class="mx-wave w2"></div><div class="mx-pl" id="sfP">${cfg.player}</div></div>
    <button class="btn primary wide mg-big" id="sfBtn">${cfg.btn || '⬆️ Держи — вверх'}</button>`, cfg.bg || 'mx-ocean');
  const sea = document.querySelector('.mx-sea'), pl = $('sfP');
  let hold = false, y = 0.45, vy = 0, wait = 0.6, speed = cfg.speed || 0.32, safe = 0;
  const objs = [];
  const btn = $('sfBtn');
  btn.onpointerdown = (e) => { e.preventDefault(); hold = true; };
  btn.onpointerup = btn.onpointerleave = btn.onpointercancel = () => { hold = false; };
  mgLoop(mg, (dt) => {
    vy += (hold ? -1.6 : 1.2) * dt; vy = clamp(vy, -0.7, 0.7);
    y = clamp(y + vy * dt, 0.06, 0.7);
    if (y === 0.06 || y === 0.7) vy = 0;
    pl.style.top = y * 100 + '%';
    pl.style.transform = `translate(-50%,-50%) rotate(${vy * 40}deg)`;
    safe -= dt;
    wait -= dt;
    if (wait <= 0) {
      const good = Math.random() < (cfg.goodRate || 0.6);
      const el = document.createElement('div');
      el.className = 'mx-obj';
      el.textContent = pick(good ? cfg.good : cfg.bad);
      sea.appendChild(el);
      objs.push({ good, x: 1.08, y: rand(0.08, 0.7), el });
      wait = rand(0.55, 1.05) / (1 + mg.score * 0.02);
      speed = Math.min(0.6, speed * 1.01);
    }
    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i];
      o.x -= speed * dt;
      o.el.style.left = o.x * 100 + '%'; o.el.style.top = o.y * 100 + '%';
      if (Math.abs(o.x - 0.2) < 0.07 && Math.abs(o.y - y) < 0.09) {
        o.el.remove(); objs.splice(i, 1);
        if (o.good) mxHit(pl, cfg.hitText || '+1');
        else if (safe <= 0) { safe = 1; mxMiss(mg, pl, cfg.badText || 'Ай!', 1); pl.animate([{ opacity: 0.3 }, { opacity: 1 }], { duration: 200, iterations: 4 }); if (cfg.maxMiss && mxOut(mg, cfg.maxMiss)) return; }
        continue;
      }
      if (o.x < -0.1) { o.el.remove(); objs.splice(i, 1); }
    }
  });
  mxEnd(mg, cfg.time);
}

// ---------- 6. Грядка: тапай созревшее, не трогай раннее и «чужое» ----------
function mxAgave(mg, cfg) {
  const n = cfg.cells || 9;
  mxA(`<div class="mx-grid g${n}">${Array.from({ length: n }, (_, i) => `<button class="mx-cell" data-i="${i}"><span></span></button>`).join('')}</div>`, cfg.bg || 'mx-desert');
  const cells = [...document.querySelectorAll('.mx-cell')];
  const st = cells.map(() => ({ s: 'empty', t: rand(0.2, 2) }));
  const set = (i, s, t) => {
    st[i] = { s, t };
    const e = { empty: cfg.empty || '', young: cfg.young, ripe: cfg.ripe, rot: cfg.rot, bad: pick(cfg.bad || ['🐢']) }[s];
    cells[i].querySelector('span').textContent = Array.isArray(e) ? pick(e) : e;
    cells[i].className = `mx-cell ${s}`;
  };
  cells.forEach((c, i) => {
    set(i, 'empty', rand(0.2, 2));
    mxBtn(c, () => {
      if (!mgAlive(mg)) return;
      const s = st[i].s;
      if (s === 'ripe') { mxHit(c, cfg.ripeText || '+1'); set(i, 'empty', rand(0.4, 1.4)); }
      else if (s === 'young') { if (cfg.earlyPenalty) mxMiss(mg, c, cfg.earlyText || 'Рано!', 1); else { floatAt(c, cfg.earlyText || 'Рано!', 'bad'); sfx('error'); } }
      else if (s === 'bad') { mxMiss(mg, c, cfg.badText || 'Не трогай!', 1); set(i, 'empty', 0.8); if (cfg.maxMiss && mxOut(mg, cfg.maxMiss)) return; }
    });
  });
  mgLoop(mg, (dt) => {
    st.forEach((x, i) => {
      x.t -= dt;
      if (x.t > 0) return;
      const fast = 1 / (1 + mg.score * 0.025);
      if (x.s === 'empty') {
        if (cfg.bad && Math.random() < (cfg.badRate || 0.15)) set(i, 'bad', rand(0.9, 1.5));
        else set(i, cfg.young ? 'young' : 'ripe', cfg.young ? rand(...(cfg.youngT || [0.8, 2])) * fast : rand(...(cfg.ripeT || [1, 1.8])) * fast);
      } else if (x.s === 'young') set(i, 'ripe', rand(...(cfg.ripeT || [1, 1.8])) * fast);
      else if (x.s === 'ripe') {
        if (cfg.rotPenalty) { mxMiss(mg, cells[i], cfg.rotText || 'Упустил!', 1); if (cfg.maxMiss && mxOut(mg, cfg.maxMiss)) return; }
        set(i, cfg.rot ? 'rot' : 'empty', 0.7);
      } else set(i, 'empty', rand(0.3, 1.2));
    });
  });
  mxEnd(mg, cfg.time);
}

// ---------- 7. Сборка по заказу: лента едет, бери нужное ----------
function mxBuild(mg, cfg) {
  mxA(`<div class="mx-order"><small>${cfg.orderName || 'Заказ'}</small><div id="bdOrder"></div></div>
    <div class="mx-belt"><div class="mx-belt-strip" id="bdStrip"></div><div class="mx-slot"></div></div>
    <button class="btn primary wide mg-big" id="bdBtn">${cfg.btn || '✋ Взять'}</button>`, cfg.bg || 'mx-market');
  const W = 58;
  const strip = $('bdStrip');
  const pool = cfg.pool;
  let items = [], off = 0, speed = cfg.speed || 90, order = [], idx = 0;
  const fill = () => { while (items.length < 40) items.push(pick(pool)); strip.innerHTML = items.map((e) => `<span>${e}</span>`).join(''); };
  const newOrder = () => {
    const [a, b] = cfg.size || [3, 4];
    order = Array.from({ length: Math.round(rand(a, b)) }, () => pick(pool)); idx = 0;
    $('bdOrder').innerHTML = order.map((e, i) => `<i class="${i < idx ? 'ok' : i === idx ? 'cur' : ''}">${e}</i>`).join('');
  };
  fill(); newOrder();
  mgLoop(mg, (dt) => {
    off += speed * dt;
    if (off >= W) { off -= W; items.shift(); items.push(pick(pool)); strip.innerHTML = items.map((e) => `<span>${e}</span>`).join(''); }
    strip.style.transform = `translateX(${-off}px)`;
  });
  mxBtn($('bdBtn'), () => {
    if (!mgAlive(mg)) return;
    const belt = document.querySelector('.mx-belt');
    const center = belt.clientWidth / 2;
    const at = items[Math.floor((center + off) / W)];
    if (at === order[idx]) {
      idx++; mgScore(1); sfx('chip'); haptic('light');
      if (idx >= order.length) { mxHit($('bdOrder'), cfg.doneText || 'Готово! +2', 2); speed = Math.min(170, speed * 1.07); newOrder(); }
      else $('bdOrder').innerHTML = order.map((e, i) => `<i class="${i < idx ? 'ok' : i === idx ? 'cur' : ''}">${e}</i>`).join('');
    } else mxMiss(mg, $('bdBtn'), cfg.badText || 'Не то!', 1);
  });
  mxEnd(mg, cfg.time);
}

// ---------- 8. Лотерия: отмечай карты, которые выкрикивает ведущий ----------
const LOTERIA = [['☀️', 'El Sol'], ['🌙', 'La Luna'], ['⭐', 'La Estrella'], ['🌵', 'El Nopal'], ['🐟', 'El Pescado'], ['🌹', 'La Rosa'], ['☂️', 'El Paraguas'],
  ['🦌', 'El Venado'], ['🐓', 'El Gallo'], ['💀', 'La Calavera'], ['🧜‍♀️', 'La Sirena'], ['🎩', 'El Catrín'], ['❤️', 'El Corazón'], ['🍉', 'La Sandía'], ['🥁', 'El Tambor'],
  ['🌳', 'El Árbol'], ['🐸', 'La Rana'], ['🦜', 'El Pájaro'], ['🪜', 'La Escalera'], ['🍾', 'La Botella'], ['🌍', 'El Mundo'], ['🦂', 'El Alacrán'], ['🎻', 'El Violoncello'], ['👢', 'La Bota']];
function mxLoteria(mg, cfg) {
  const size = cfg.size || 4;
  const board = shuffle(LOTERIA.slice()).slice(0, size * size);
  const marked = board.map(() => false);
  mxA(`<div class="mx-caller"><span id="ltE"></span><b id="ltN">Быстрее!</b><i id="ltC"></i></div>
    <div class="mx-lot s${size}">${board.map(([e, nm], i) => `<button class="mx-lc" data-i="${i}"><span>${e}</span>${cfg.words ? '' : `<small>${nm}</small>`}</button>`).join('')}</div>`, 'mx-loteria');
  const btns = [...document.querySelectorAll('.mx-lc')];
  let called = [], calls = cfg.calls || 0, wait = 0.8, lines = 0;
  const L = [];
  for (let i = 0; i < size; i++) { L.push([...Array(size)].map((_, j) => i * size + j)); L.push([...Array(size)].map((_, j) => j * size + i)); }
  L.push([...Array(size)].map((_, j) => j * size + j)); L.push([...Array(size)].map((_, j) => j * size + size - 1 - j));
  const done = new Set();
  const call = () => {
    const left = board.filter((_, i) => !marked[i]);
    const c = left.length && Math.random() < (cfg.hit || 0.62) ? pick(left) : pick(LOTERIA);
    called = [c[1], ...called].slice(0, 2);
    $('ltE').textContent = cfg.words ? '🎴' : c[0];
    $('ltN').textContent = cfg.words ? `¡${c[1]}!` : c[1];
    $('ltC').textContent = cfg.calls ? `${calls} карт` : '';
    sfx('chip');
    $('ltE').animate([{ transform: 'rotateY(90deg)' }, { transform: 'rotateY(0)' }], { duration: 250 });
  };
  mgLoop(mg, (dt) => {
    wait -= dt;
    if (wait > 0) return;
    if (cfg.calls && calls <= 0) { setTimeout(mgEnd, 400); wait = 99; return; }
    if (cfg.calls) calls--;
    call();
    wait = Math.max(1.3, (cfg.every || 2.4) - mg.score * 0.04);
  });
  btns.forEach((b, i) => mxBtn(b, () => {
    if (!mgAlive(mg) || marked[i]) return;
    if (called.includes(board[i][1])) {
      marked[i] = true; b.classList.add('on'); sfx('tap'); haptic('light');
      b.insertAdjacentHTML('beforeend', '<em>🫘</em>');
      if (cfg.score === 'marks') mxHit(b, cfg.words ? board[i][1] : '');
      L.forEach((line, k) => {
        if (!done.has(k) && line.every((x) => marked[x])) {
          done.add(k); lines++;
          if (cfg.score !== 'marks') { mgScore(1); sfx('jackpot'); confetti(25); floatAt(b, 'Лотерея!', 'good'); }
          line.forEach((x) => btns[x].classList.add('line'));
        }
      });
      if (cfg.score !== 'marks' && cfg.lines && lines >= cfg.lines) setTimeout(mgEnd, 700);
    } else mxMiss(mg, b, 'Не то!', cfg.score === 'marks' ? 1 : 0);
  }));
  mxEnd(mg, cfg.time);
}

// ---------- 9. Глубина: держи — ныряй, отпусти — всплывай ----------
function mxDive(mg, cfg) {
  mxA(`<div class="mx-deep"><div class="mx-boat">${cfg.boat || '🚤'}</div><div class="mx-line" id="dvL"></div><div class="mx-hook" id="dvH">${cfg.hook || '🪝'}</div></div>
    <button class="btn primary wide mg-big" id="dvBtn">${cfg.btn || '⬇️ Держи — вниз'}</button>`, cfg.bg || 'mx-abyss');
  const deep = document.querySelector('.mx-deep'), hook = $('dvH'), line = $('dvL');
  let hold = false, d = 0.05, wait = 0.3, back = 0;
  const fish = [];
  const btn = $('dvBtn');
  btn.onpointerdown = (e) => { e.preventDefault(); hold = true; };
  btn.onpointerup = btn.onpointerleave = btn.onpointercancel = () => { hold = false; };
  mgLoop(mg, (dt) => {
    if (back > 0) { back -= dt; d = Math.max(0.05, d - dt * 1.2); }
    else d = clamp(d + (hold ? 0.5 : -0.38) * dt, 0.05, 0.7);
    hook.style.top = (0.12 + d) * 100 + '%';
    line.style.height = d * 100 + '%';
    wait -= dt;
    if (wait <= 0 && fish.length < 6) {
      const good = Math.random() < (cfg.goodRate || 0.72);
      const dir = Math.random() < 0.5 ? 1 : -1;
      const el = document.createElement('div');
      el.className = 'mx-fish';
      el.textContent = pick(good ? cfg.good : cfg.bad);
      el.style.transform = `translate(-50%,-50%) scaleX(${dir > 0 ? -1 : 1})`;
      deep.appendChild(el);
      fish.push({ good, dir, x: dir > 0 ? -0.08 : 1.08, y: 0.12 + rand(0.12, 0.7), v: rand(0.12, 0.26), el });
      wait = rand(0.5, 1.1);
    }
    for (let i = fish.length - 1; i >= 0; i--) {
      const f = fish[i];
      f.x += f.dir * f.v * dt;
      f.el.style.left = f.x * 100 + '%'; f.el.style.top = f.y * 100 + '%';
      if (back <= 0 && Math.abs(f.x - 0.5) < 0.06 && Math.abs(f.y - (0.12 + d)) < 0.07) {
        f.el.remove(); fish.splice(i, 1);
        if (f.good) mxHit(hook, cfg.hitText || 'Есть рыба!');
        else { mxMiss(mg, hook, cfg.badText || 'Обжёгся!', 1); back = 0.8; }
        continue;
      }
      if (f.x < -0.12 || f.x > 1.12) { f.el.remove(); fish.splice(i, 1); }
    }
  });
  mxEnd(mg, cfg.time);
}

// ---------- 10. Лучадор: угадай приём и ответь вовремя ----------
const MX_MOVES = [['👊', 'Удар!', 'block'], ['🦵', 'Подсечка!', 'jump'], ['🤼', 'Захват!', 'dodge']];
function mxLucha(mg, cfg) {
  mxA(`<div class="mx-ring-box"><div class="mx-foe" id="lcF">${cfg.foe || '🤼'}</div><div class="mx-tele" id="lcT"></div><div class="mx-tbar"><i id="lcB"></i></div><div class="mx-me">${cfg.me || '🧔'}</div></div>
    <div class="mx-pads three"><button class="mx-pad" data-m="block">🛡️<small>Блок</small></button><button class="mx-pad" data-m="jump">⤴️<small>Прыжок</small></button><button class="mx-pad" data-m="dodge">↩️<small>Уклон</small></button></div>`, cfg.bg || 'mx-lucha');
  let phase = 'idle', t = rand(0.6, 1.1), win = (cfg.window || 1000) / 1000, cur = null, combo = 0;
  const tele = $('lcT');
  const setIdle = () => { phase = 'idle'; t = rand(0.5, 1.1); tele.textContent = ''; tele.className = 'mx-tele'; $('lcB').style.width = '0%'; };
  mgLoop(mg, (dt) => {
    t -= dt;
    if (phase === 'idle' && t <= 0) {
      cur = pick(MX_MOVES); phase = 'tele'; t = win;
      tele.innerHTML = `${cur[0]}<small>${cur[1]}</small>`; tele.className = 'mx-tele on';
      sfx('whoosh');
    } else if (phase === 'tele') {
      $('lcB').style.width = Math.max(0, t / win) * 100 + '%';
      if (t <= 0) { combo = 0; mxMiss(mg, $('lcF'), 'Пропустил!', 1); setIdle(); if (cfg.maxMiss && mxOut(mg, cfg.maxMiss)) return; }
    }
  });
  document.querySelectorAll('.mx-ring-box ~ .mx-pads .mx-pad').forEach((b) => mxBtn(b, () => {
    if (!mgAlive(mg) || phase !== 'tele') return;
    if (b.dataset.m === cur[2]) {
      combo++;
      const fin = combo % 3 === 0;
      mxHit($('lcF'), fin ? cfg.finText || 'Планка! +2' : 'Отлично!', fin ? 2 : 1);
      $('lcF').animate([{ transform: 'translateX(-50%) rotate(0)' }, { transform: `translateX(-50%) rotate(${fin ? 180 : 20}deg) scale(.9)` }, { transform: 'translateX(-50%) rotate(0)' }], { duration: 350 });
      win = Math.max(0.42, win * 0.96);
    } else { combo = 0; mxMiss(mg, $('lcF'), 'Не тот приём!', 1); if (cfg.maxMiss && mxOut(mg, cfg.maxMiss)) return; }
    setIdle();
  }));
  mxEnd(mg, cfg.time);
}

// ---------- 11. Подкоп: копай, пока охрана не над тобой ----------
function mxTunnel(mg, cfg) {
  const segs = cfg.segs || 4;
  mxA(`<div class="mx-ground"><div class="mx-patrol" id="tnP">${cfg.patrol || '👮'}</div><div class="mx-warn" id="tnW"></div></div>
    <div class="mx-under"><div class="mx-tun" id="tnT"></div>${Array.from({ length: segs - 1 }, (_, i) => `<i style="left:${((i + 1) * 100) / segs}%"></i>`).join('')}<div class="mx-digger" id="tnD">${cfg.digger || '⛏️'}</div><div class="mx-goal">${cfg.goal || '🏁'}</div></div>
    <div class="mx-alarm"><i id="tnA"></i></div>
    <button class="btn primary wide mg-big" id="tnBtn">${cfg.btn || '⛏️ Копать (держи)'}</button>`, cfg.bg || 'mx-dirt');
  let hold = false, prog = 0, alarm = 0, px = 0.5, pv = 0.22, seg = 0, cool = 0;
  const btn = $('tnBtn');
  btn.onpointerdown = (e) => { e.preventDefault(); hold = true; };
  btn.onpointerup = btn.onpointerleave = btn.onpointercancel = () => { hold = false; };
  mgLoop(mg, (dt) => {
    px += pv * dt;
    if (px > 0.95 || px < 0.05) { pv = -pv; px = clamp(px, 0.05, 0.95); }
    if (Math.random() < dt * 0.4) pv = -pv;
    $('tnP').style.left = px * 100 + '%';
    $('tnP').style.transform = `translateX(-50%) scaleX(${pv > 0 ? -1 : 1})`;
    const dx = 0.06 + prog * 0.86;
    const near = Math.abs(px - dx) < 0.16;
    $('tnW').textContent = near ? '👣 Тише!' : '';
    cool -= dt;
    if (hold && cool <= 0) {
      prog = Math.min(1, prog + dt * (cfg.speed || 0.11));
      if (near) alarm += dt * 1.4;
      $('tnD').animate([{ transform: 'translate(-50%,-50%) rotate(-20deg)' }, { transform: 'translate(-50%,-50%) rotate(20deg)' }], { duration: 120 });
    }
    alarm = Math.max(0, alarm - dt * (hold && near ? 0 : 0.35));
    if (alarm >= 1) {
      alarm = 0; prog = Math.max(seg / segs, prog - 0.2); cool = 0.8; hold = false;
      mxMiss(mg, $('tnD'), cfg.caughtText || 'Стой! Услышали!');
      if (mxOut(mg, cfg.maxMiss || 3)) return;
    }
    while (prog >= (seg + 1) / segs - 1e-6 && seg < segs) { seg++; mxHit($('tnD'), seg >= segs ? cfg.doneText || 'Свободен! +2' : '+1', seg >= segs ? 2 : 1); }
    if (seg >= segs) { if (cfg.finishOnExit) { mgEnd(); return; } prog = 0; seg = 0; }
    $('tnT').style.width = (0.06 + prog * 0.86) * 100 + '%';
    $('tnD').style.left = dx * 100 + '%';
    $('tnA').style.width = Math.min(1, alarm) * 100 + '%';
  });
  mxEnd(mg, cfg.time);
}

// ---------- 12. Торг: тяни цену, пока покупатель не ушёл ----------
function mxHaggle(mg, cfg) {
  mxA(`<div class="mx-shop"><div class="mx-buyer" id="hgB"></div><div class="mx-mood" id="hgM"></div><div class="mx-item">${cfg.item || '👒'}</div>
      <div class="mx-price" id="hgP"></div><div class="mx-anger"><i id="hgA"></i></div></div>
    <div class="mx-pads two"><button class="mx-pad" id="hgUp">📈<small>Цену выше (держи)</small></button><button class="mx-pad green" id="hgSell">🤝<small>${cfg.sell || 'Продать'}</small></button></div>`, cfg.bg || 'mx-market');
  const B = cfg.buyers || [['🧑‍🦰', 0.55, 0.8], ['👩‍🦳', 0.65, 0.95], ['🤠', 0.75, 1], ['🕵️', 0.5, 0.7], ['🤵', 0.85, 1]];
  let cur, p, anger, hold = false;
  const next = () => { const b = pick(B); cur = { e: b[0], max: rand(b[1], b[2]) }; p = 0.3; anger = 0; $('hgB').textContent = cur.e; };
  next();
  const up = $('hgUp');
  up.onpointerdown = (e) => { e.preventDefault(); hold = true; };
  up.onpointerup = up.onpointerleave = up.onpointercancel = () => { hold = false; };
  mgLoop(mg, (dt) => {
    if (hold) p = Math.min(1.3, p + dt * (cfg.speed || 0.3));
    const k = p / cur.max;
    if (k > 1) anger += dt * (0.8 + (k - 1) * 5);
    else anger = Math.max(0, anger - dt * 0.2);
    $('hgM').textContent = k < 0.7 ? '😀' : k < 0.9 ? '🙂' : k <= 1 ? '😐' : '😠';
    $('hgP').textContent = `$${Math.round(p * (cfg.base || 40))}`;
    $('hgA').style.width = Math.min(1, anger) * 100 + '%';
    if (anger >= 1) { hold = false; mxMiss(mg, $('hgB'), cfg.leaveText || 'Дорого! Ушёл'); next(); }
  });
  mxBtn($('hgSell'), () => {
    if (!mgAlive(mg)) return;
    hold = false;
    const k = p / cur.max;
    if (k <= 1) { const pts = k > 0.92 ? 3 : k > 0.75 ? 2 : 1; mxHit($('hgB'), pts === 3 ? 'Сговорились! +3' : `+${pts}`, pts); next(); }
    else { anger += 0.3; floatAt($('hgB'), 'Не то, сеньор!', 'bad'); sfx('error'); }
  });
  mxEnd(mg, cfg.time);
}

// ---------- 13. Решение по правилу: «да» или «нет», а правило меняется ----------
function mxJudge(mg, cfg) {
  mxA(`<div class="mx-rule" id="jgR"></div><div class="mx-desk"><div class="mx-card" id="jgC"></div><div class="mx-tbar"><i id="jgB"></i></div></div>
    <div class="mx-pads ${cfg.buttons.length === 3 ? 'three' : 'two'}">${cfg.buttons.map(([l, v]) => `<button class="mx-pad" data-v="${v}">${l}</button>`).join('')}</div>`, cfg.bg || 'mx-office');
  const st = { n: 0 };
  let cur = null, t = 0, limit = (cfg.limit || 3200) / 1000;
  const next = () => {
    if (cfg.rules && st.n % 6 === 0) { st.rule = pick(cfg.rules.filter((r) => r !== st.rule)); $('jgR').innerHTML = `📌 ${st.rule.text}`; $('jgR').animate([{ background: '#F2C744' }, { background: '' }], { duration: 600 }); }
    st.n++;
    cur = cfg.next(st);
    t = limit;
    const c = $('jgC');
    c.innerHTML = cur.html;
    c.animate([{ transform: cfg.walk ? 'translateX(120%)' : 'translateY(-30px) rotate(-4deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220 });
  };
  if (!cfg.rules) $('jgR').innerHTML = cfg.ruleText || '';
  next();
  mgLoop(mg, (dt) => {
    t -= dt;
    $('jgB').style.width = Math.max(0, t / limit) * 100 + '%';
    if (t <= 0) { mxMiss(mg, $('jgC'), cfg.lateText || 'Не успел!'); next(); }
  });
  document.querySelectorAll('.mx-desk ~ .mx-pads .mx-pad').forEach((b) => mxBtn(b, () => {
    if (!mgAlive(mg)) return;
    if (b.dataset.v === String(cur.ok)) { mxHit($('jgC'), cfg.okText || '✔'); limit = Math.max(1.3, limit * 0.97); }
    else mxMiss(mg, $('jgC'), cfg.badText || 'Ошибка!', 1);
    next();
  }));
  mxEnd(mg, cfg.time);
}

// ---------- 14. Маршрут: поворот по команде штурмана ----------
const MX_TURNS = [['⬅️', 'Влево!', 'L'], ['⬆️', 'Прямо!', 'S'], ['➡️', 'Вправо!', 'R']];
function mxRoute(mg, cfg) {
  mxA(`<div class="mx-road"><div class="mx-stripes"></div><div class="mx-sign" id="rtS"></div><div class="mx-car" id="rtC">${cfg.player || '🚕'}</div></div>
    <div class="mx-pads three">${MX_TURNS.map(([e, , v]) => `<button class="mx-pad" data-v="${v}">${e}</button>`).join('')}</div>`, cfg.bg || 'mx-city');
  let cur = null, t = 0, dur = cfg.dur || 2.4;
  const sign = $('rtS');
  const next = () => {
    cur = pick(MX_TURNS); t = 0;
    // Знак всегда показывает и стрелку, и направление — без эмодзи игрок не понимал, куда жать
    sign.innerHTML = `<span>${cur[0]}</span><b>${cur[1]}</b>${cfg.place ? `<small>${pick(cfg.place)}</small>` : ''}`;
    dur *= cfg.speedUp || 0.97; // каждый следующий знак — чуть быстрее
  };
  next();
  mgLoop(mg, (dt) => {
    t += dt / dur;
    sign.style.transform = `translate(-50%,-50%) scale(${0.35 + t * 0.9})`;
    sign.style.top = 18 + t * 30 + '%';
    if (t >= 1) { mxMiss(mg, sign, cfg.lateText || 'Считаю…', 1); dur = Math.min(2.6, dur * 1.05); next(); }
  });
  document.querySelectorAll('.mx-road ~ .mx-pads .mx-pad').forEach((b) => mxBtn(b, () => {
    if (!mgAlive(mg)) return;
    const car = $('rtC');
    if (b.dataset.v === cur[2]) {
      mxHit(sign, cfg.okText || 'Отлично!');
      car.animate([{ transform: 'translateX(-50%)' }, { transform: `translateX(${cur[2] === 'L' ? -140 : cur[2] === 'R' ? 40 : -50}%) rotate(${cur[2] === 'L' ? -20 : cur[2] === 'R' ? 20 : 0}deg)` }, { transform: 'translateX(-50%)' }], { duration: 300 });
      dur = Math.max(1.1, dur * 0.95);
    } else mxMiss(mg, sign, cfg.badText || 'Считаю…', 1);
    next();
  }));
  mxEnd(mg, cfg.time);
}

// ---------- 15. Улица: найди дом по номеру на испанском ----------
const ES_NUM = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];
function mxCalle(mg, cfg) {
  mxA(`<div class="mx-letter" id="clL"></div><div class="mx-street" id="clS"></div>`, cfg.bg || 'mx-calle');
  let want = 0, nums = [], done = 0;
  const HOUSES = cfg.houses || ['🏠', '🏡', '🏘️', '🏚️', '🏪', '⛪', '🏨', '🏫'];
  const layout = () => {
    nums = shuffle([...Array(20)].map((_, i) => i + 1)).slice(0, cfg.count || 8);
    $('clS').innerHTML = nums.map((n) => `<button class="mx-house" data-n="${n}"><span>${pick(HOUSES)}</span><b>${n}</b></button>`).join('');
    document.querySelectorAll('.mx-house').forEach((b) => mxBtn(b, () => tap(b)));
  };
  const ask = () => { want = pick(nums); $('clL').innerHTML = `${cfg.icon || '✉️'} <b>Calle ${ES_NUM[want]}</b>${mg.score < (cfg.hintUntil || 4) ? ` <small>(${want})</small>` : ''}`; };
  const tap = (b) => {
    if (!mgAlive(mg)) return;
    if (+b.dataset.n === want) {
      mxHit(b, cfg.okText || 'Доставлено!'); b.classList.add('ok');
      if (++done % 3 === 0) layout();
      ask();
    } else mxMiss(mg, b, `Это ${ES_NUM[+b.dataset.n]}`, 1);
  };
  layout(); ask();
  mxEnd(mg, cfg.time);
}

// ---------- 16. Слова: падающая карточка, выбери перевод ----------
const MX_ES = [['Hola', 'Привет'], ['Gracias', 'Спасибо'], ['Amigo', 'Друг'], ['Agua', 'Вода'], ['Dinero', 'Деньги'], ['Casa', 'Дом'], ['Playa', 'Пляж'], ['Perro', 'Собака'],
  ['Gato', 'Кот'], ['Trabajo', 'Работа'], ['Comida', 'Еда'], ['Cerveza', 'Пиво'], ['Sol', 'Солнце'], ['Mañana', 'Завтра'], ['Fiesta', 'Праздник'], ['Amor', 'Любовь'],
  ['Calle', 'Улица'], ['Coche', 'Машина'], ['Libro', 'Книга'], ['Escuela', 'Школа'], ['Mercado', 'Рынок'], ['Iglesia', 'Церковь'], ['Policía', 'Полиция'], ['Cárcel', 'Тюрьма'],
  ['Pollo', 'Курица'], ['Queso', 'Сыр'], ['Hermano', 'Брат'], ['Abuela', 'Бабушка'], ['Noche', 'Ночь'], ['Luna', 'Луна']];
function mxWords(mg, cfg) {
  const pairs = cfg.pairs || MX_ES;
  mxA(`<div class="mx-wfall"><div class="mx-word" id="wdW"></div></div><div class="mx-pads three" id="wdO"></div>`, cfg.bg || 'mx-school');
  let cur = null, y = 0, fall = cfg.fall || 5;
  const next = () => {
    const pr = pick(pairs);
    const [q, a] = cfg.reverse ? [pr[1], pr[0]] : pr;
    const wrong = shuffle(pairs.filter((x) => x !== pr)).slice(0, 2).map((x) => (cfg.reverse ? x[0] : x[1]));
    cur = { a }; y = 0;
    $('wdW').textContent = q;
    $('wdO').innerHTML = shuffle([a, ...wrong]).map((o) => `<button class="mx-pad word">${o}</button>`).join('');
    document.querySelectorAll('#wdO .mx-pad').forEach((b) => mxBtn(b, () => {
      if (!mgAlive(mg)) return;
      if (b.textContent === cur.a) { mxHit($('wdW'), 'Правильно!'); fall = Math.max(2.4, fall * 0.95); }
      else mxMiss(mg, $('wdW'), cur.a, 1);
      next();
    }));
  };
  next();
  mgLoop(mg, (dt) => {
    y += dt / fall;
    $('wdW').style.top = y * 78 + '%';
    if (y >= 1) { mxMiss(mg, $('wdW'), cur.a); next(); }
  });
  mxEnd(mg, cfg.time);
}

// ---------- 17. Вопрос-карточка: смахни или выбери ответ ----------
function mxQuiz(mg, cfg) {
  mxA(`<div class="mx-qcard" id="qzC"><div id="qzQ"></div></div><div class="mx-tbar q"><i id="qzB"></i></div><div class="mx-pads" id="qzO"></div>`, cfg.bg || 'mx-tele');
  let cur = null, t = 0, limit = (cfg.limit || 6000) / 1000, dx = 0, sx = null;
  const card = $('qzC');
  const answer = (o) => {
    if (!mgAlive(mg) || !cur) return;
    const ok = o === cur.a;
    if (ok) mxHit(card, cfg.okText || 'Да!'); else mxMiss(mg, card, cfg.penalty === false ? '' : cur.a, cfg.penalty === false ? 0 : 1);
    card.animate([{ transform: `translateX(${dx}px)` }, { transform: `translateX(${(cur.opts.indexOf(o) ? 1 : -1) * 300}px) rotate(${(cur.opts.indexOf(o) ? 1 : -1) * 20}deg)`, opacity: 0 }], { duration: 200 });
    setTimeout(next, 200);
    cur = null;
  };
  const next = () => {
    if (!mgAlive(mg)) return;
    cur = cfg.gen(); t = limit; dx = 0;
    card.style.transform = '';
    $('qzQ').innerHTML = cur.q;
    $('qzO').className = `mx-pads ${cur.opts.length === 3 ? 'three' : 'two'}`;
    $('qzO').innerHTML = cur.opts.map((o, i) => `<button class="mx-pad word" data-i="${i}">${cur.opts.length === 2 ? (i ? '👉 ' : '👈 ') : ''}${o}</button>`).join('');
    document.querySelectorAll('#qzO .mx-pad').forEach((b) => mxBtn(b, () => cur && answer(cur.opts[+b.dataset.i])));
  };
  card.onpointerdown = (e) => { sx = e.clientX; mxCap(card, e); };
  card.onpointermove = (e) => { if (sx === null || !cur) return; dx = e.clientX - sx; card.style.transform = `translateX(${dx}px) rotate(${dx / 15}deg)`; };
  card.onpointerup = card.onpointercancel = () => { if (sx === null) return; sx = null; if (cur && cur.opts.length === 2 && Math.abs(dx) > 70) answer(cur.opts[dx > 0 ? 1 : 0]); else { dx = 0; card.style.transform = ''; } };
  next();
  mgLoop(mg, (dt) => {
    if (!cur) return;
    t -= dt;
    $('qzB').style.width = Math.max(0, t / limit) * 100 + '%';
    if (t <= 0) { mxMiss(mg, card, cfg.lateText || 'Время!'); cur = null; setTimeout(next, 150); }
  });
  mxEnd(mg, cfg.time);
}

// ---------- 18. Баланс: удержи в зелёной зоне ----------
function mxBalance(mg, cfg) {
  mxA(`<div class="mx-bal"><div class="mx-beam" id="blB"><span>${cfg.icon || '🪨'}</span></div><div class="mx-base">${cfg.base || '🧔'}</div>
      <div class="mx-gauge"><i class="z"></i><b id="blG"></b></div><div class="mx-sec" id="blS"></div></div>
    <div class="mx-pads two"><button class="mx-pad" id="blL">⬅️</button><button class="mx-pad" id="blR">➡️</button></div>`, cfg.bg || 'mx-gym');
  let a = 0, v = 0, inZone = 0, push = 0;
  const hold = (el, d) => { el.onpointerdown = (e) => { e.preventDefault(); push = d; }; el.onpointerup = el.onpointerleave = el.onpointercancel = () => { if (push === d) push = 0; }; };
  hold($('blL'), -1); hold($('blR'), 1);
  mgLoop(mg, (dt) => {
    const drift = cfg.drift || 1;
    v += (rand(-1, 1) * 2.4 * drift + a * 1.4 * drift + push * 3.2) * dt;
    v *= 0.985;
    a += v * dt;
    if (Math.abs(a) >= 1) {
      a = 0; v = 0; inZone = 0;
      mxMiss(mg, $('blB'), cfg.fallText || 'Уронил!');
      if (cfg.maxMiss && mxOut(mg, cfg.maxMiss)) return;
    }
    const ok = Math.abs(a) < 0.28;
    if (ok) { inZone += dt; if (inZone >= (cfg.every || 1)) { inZone = 0; mxHit($('blB'), ''); } } else inZone = Math.max(0, inZone - dt * 0.5);
    $('blB').style.transform = `translateX(-50%) rotate(${a * 35}deg)`;
    $('blG').style.left = (50 + a * 50) + '%';
    $('blG').className = ok ? 'ok' : '';
    $('blS').textContent = ok ? cfg.okWord || 'Вот так!' : a > 0 ? '⬅️' : '➡️';
  });
  mxEnd(mg, cfg.time);
}

// ---------- 19. Сейф: крути диск, слушай щелчки ----------
function mxSafe(mg, cfg) {
  mxA(`<div class="mx-safe"><div class="mx-dial" id="sfD"><div class="mx-dial-in" id="sfI">${[...Array(10)].map((_, i) => `<i style="transform:rotate(${i * 36}deg)"><b>${i * 10}</b></i>`).join('')}</div><div class="mx-dial-mark"></div></div>
      <div class="mx-steth"><span id="sfE">🔈</span><div class="mx-heat"><i id="sfH"></i></div><small id="sfN">0</small></div><div class="mx-locks" id="sfL"></div></div>
    <div class="mx-pads three"><button class="mx-pad" id="sfMinus">⟲</button><button class="mx-pad green" id="sfTry">🔓<small>Щелчок</small></button><button class="mx-pad" id="sfPlus">⟳</button></div>`, cfg.bg || 'mx-vault');
  const locks = cfg.locks || 3;
  let val = 0, target = 0, opened = 0, turn = 0, drag = null;
  const newTarget = () => { target = Math.floor(rand(0, 100)); };
  const showLocks = () => { $('sfL').innerHTML = [...Array(locks)].map((_, i) => (i < opened ? '🟢' : '🔴')).join(''); };
  newTarget(); showLocks();
  const draw = () => {
    val = ((val % 100) + 100) % 100;
    $('sfI').style.transform = `rotate(${-val * 3.6}deg)`;
    $('sfN').textContent = Math.round(val);
    const d = Math.min(Math.abs(val - target), 100 - Math.abs(val - target));
    const heat = Math.max(0, 1 - d / 30);
    $('sfH').style.width = heat * 100 + '%';
    $('sfE').textContent = d <= 2 ? '🔊' : d <= 10 ? '🔉' : '🔈';
  };
  const hold = (el, d) => { el.onpointerdown = (e) => { e.preventDefault(); turn = d; }; el.onpointerup = el.onpointerleave = el.onpointercancel = () => { if (turn === d) turn = 0; }; };
  hold($('sfMinus'), -1); hold($('sfPlus'), 1);
  const dial = $('sfD');
  dial.onpointerdown = (e) => { drag = e.clientX; mxCap(dial, e); };
  dial.onpointermove = (e) => { if (drag === null) return; val += (e.clientX - drag) * 0.25; drag = e.clientX; draw(); };
  dial.onpointerup = dial.onpointercancel = () => { drag = null; };
  mgLoop(mg, (dt) => { if (turn) { val += turn * dt * 22; draw(); } });
  mxBtn($('sfTry'), () => {
    if (!mgAlive(mg)) return;
    const d = Math.min(Math.abs(Math.round(val) - target), 100 - Math.abs(Math.round(val) - target));
    if (d <= 2) {
      opened++; showLocks(); newTarget();
      if (opened >= locks) { mxHit($('sfD'), cfg.doneText || 'Открыто! +2', 2); opened = 0; setTimeout(showLocks, 400); }
      else mxHit($('sfD'), 'Клик!');
    } else { mxMiss(mg, $('sfD'), cfg.badText || 'Тишина…'); if (cfg.maxMiss && mxOut(mg, cfg.maxMiss)) return; }
    draw();
  });
  draw();
  mxEnd(mg, cfg.time);
}

// =====================================================================
// Кто во что играет в Мексике
// =====================================================================

// ---------- Работы (поверх mex.js: MEX_JOB_GAMES применяются при входе в Мексику) ----------
const MX_TOURIST = [['🧑‍🦰', '🌮'], ['👩‍🦳', '🍹'], ['🧔‍♂️', '🎺'], ['👱‍♀️', '🌮'], ['👨‍🦲', '🍹'], ['👩', '🎺']];
Object.assign(MEX_JOB_GAMES, {
  flyers: { engine: mxJudge, title: 'Зазывай гринго', hint: 'Над туристом — чего он хочет. Крикни нужное, пока не ушёл!', walk: true, limit: 2600, target: 14,
    buttons: [['🌮<small>Тако!</small>', 'f'], ['🍹<small>Маргариту!</small>', 'd'], ['🎺<small>Мариачи!</small>', 'm']], ruleText: '🗣️ Кричи то, чего хочет турист',
    next: () => { const [w, want] = pick(MX_TOURIST); return { html: `<div class="mx-tourist"><span class="bub">${want}</span><span>${w}</span></div>`, ok: { '🌮': 'f', '🍹': 'd', '🎺': 'm' }[want] }; } },
  loader: { engine: mxAgave, title: 'Урожай агавы', hint: 'Режь только синие созревшие 🌵. Зелёные 🌿 — рано, гнилые 🥀 уже не нужны', young: '🌿', ripe: '🌵', rot: '🥀', empty: '🟫', ripeText: 'Ананас!', earlyText: 'Рано!', earlyPenalty: true, target: 16 },
  courier: { engine: mxSurf, title: 'Осёл на горной тропе', hint: 'Держи — Педро карабкается вверх, отпусти — спускается. Собирай посылки, обходи кактусы и змей', player: '🫏', good: ['📦', '📦', '✉️'], bad: ['🌵', '🐍', '🪨'], bg: 'mx-canyon', target: 16 },
  guard: { engine: mxLasso, title: 'Спасатель Канкуна', hint: 'Бросай круг 🛟, когда тонущий внутри кольца. Акулу 🦈 не спасай — она сама', btn: '🛟 Бросить круг', ringIcon: '', good: ['🏊', '🙋', '🏊‍♀️'], bad: ['🦈', '🐬'], badRate: 0.2, bg: 'mx-ocean', hitText: 'Спас!', badText: 'Это акула!', target: 12 },
  taxi: { engine: mxRoute, title: 'Такси по Канкуну', hint: 'Пассажир кричит, куда повернуть. Жми стрелку до перекрёстка!', player: '🚕', place: ['Hotel Zone', 'Playa Delfines', 'Mercado 28', 'El Centro', 'Aeropuerto'], target: 14 },
  seller: { engine: mxHaggle, title: 'Торг за сомбреро', hint: 'Держи «Цену выше» и смотри на лицо гринго. Продай подороже, но пока он не взбесился', item: '👒', base: 60, target: 14 },
  manager: { engine: mxBuild, title: 'Завтрак в номер', hint: 'Собери поднос по заказу: жми «Взять», когда нужное в рамке', pool: ['🥚', '🥓', '☕', '🍊', '🥐', '🍳', '🥑', '🌮'], size: [3, 4], btn: '🛎️ На поднос', orderName: 'Номер 404', target: 14 },
  director: { engine: mxJudge, title: 'Утро директора курорта', hint: 'Правило сверху меняется! Одобряй то, что подходит, остальное — «Нет»', limit: 3200, target: 16,
    buttons: [['✅<small>Да</small>', 'y'], ['❌<small>Нет</small>', 'n']],
    rules: [{ text: 'Одобряй всё, где есть 💰', f: (x) => x.includes('💰') }, { text: 'Одобряй всё для пляжа 🏖️', f: (x) => x.includes('🏖️') }, { text: 'Ничего с 🦈 и 🔥!', f: (x) => !x.includes('🦈') && !x.includes('🔥') }],
    next: (st) => { const set = shuffle(['💰', '🏖️', '🦈', '🔥', '🍹', '🎺', '🐢', '🌪️']).slice(0, 2); return { html: `<div class="mx-doc"><small>Идея</small><span>${set.join(' ')}</span></div>`, ok: st.rule.f(set) ? 'y' : 'n' }; } },
  dvornik: { engine: mxAgave, title: 'Пляж до прилива', hint: 'Убирай мусор, пока волна не унесла его в океан. Черепашек 🐢 не трогай!', ripe: ['🥤', '🍾', '🛍️', '🩴', '🥫'], empty: '', bad: ['🐢', '🦀'], badRate: 0.18, rotPenalty: true, rotText: '🌊 Унесло!', ripeT: [1.3, 2.1], bg: 'mx-beach', target: 20 },
  postman: { engine: mxCalle, title: 'Почтальон: calles', hint: 'Номер дома — по-испански. Найди дом и отдай письмо', target: 14 },
  cook: { engine: mxComal, title: 'Тортильи на комале', hint: 'Переворачивай, когда кольцо золотое, и снимай со второй стороны. Передержал — сгорит', items: ['🫓', '🫓', '🌮'], target: 14 },
  police: { engine: mxLucha, title: 'Задержание на рынке', hint: 'Воришка — бывший лучадор! Смотри, какой приём он готовит, и отвечай: удар — блок, подсечка — прыжок, захват — уклон', foe: '🥷', me: '👮', target: 14 },
  teacher: { engine: mxWords, title: 'Русский для гринго', hint: 'Слово падает — выбери перевод на русский, пока не упало', target: 14 },
  clerk: { engine: mxJudge, title: 'Печати муниципалитета', hint: 'Правило сверху меняется! «Одобрено» — если документ по правилу, иначе «Отказано»', limit: 3000, target: 16,
    buttons: [['✅<small>Одобрено</small>', 'y'], ['❌<small>Отказано</small>', 'n']],
    rules: [{ text: 'Нужна печать 🌵', f: (x) => x.seal }, { text: 'Нужны фото 📸 и подпись 🖊️', f: (x) => x.photo && x.sign }, { text: 'Без просрочки ⌛', f: (x) => !x.old }],
    next: (st) => { const x = { seal: Math.random() < 0.6, photo: Math.random() < 0.6, sign: Math.random() < 0.6, old: Math.random() < 0.35 };
      return { html: `<div class="mx-doc"><small>Заявление</small><span>📄 ${x.seal ? '🌵' : ''}${x.photo ? '📸' : ''}${x.sign ? '🖊️' : ''}${x.old ? '⌛' : ''}</span></div>`, ok: st.rule.f(x) ? 'y' : 'n' }; } },
  deputy: { engine: mxBalance, title: 'Коалиция в конгрессе', hint: 'Партии тянут в разные стороны. Держи весы в зелёной зоне — каждая секунда это голос', icon: '⚖️', base: '🏛️', okWord: 'Большинство!', target: 16 },
});

// ---------- Отдых ----------
const MX_LEISURE = {
  fishing: { title: 'Рыбалка в Тихом океане', hint: 'Держи — крючок уходит в глубину, отпусти — поднимается. Цепляй рыбу, обходи медуз', duration: 25, target: 6,
    run: (mg) => mxDive(mg, { good: ['🐟', '🐠', '🐡', '🦑'], bad: ['🪼', '🪼'], hook: '🪝', boat: '🚣' }) },
  thimbles: { title: 'Лотерия на рынке', hint: 'Ведущий выкрикивает карты. Отмечай их на своём поле — собери 3 линии!', duration: 0, target: 3,
    run: (mg) => mxLoteria(mg, { calls: 26, every: 2.2, lines: 3 }) },
  darts: { title: 'Пиньята', hint: 'Бей, когда пиньята над палкой. Центр — 50 очков. 8 ударов, разбей — бонус. 150 — приз!', duration: 0, target: 150,
    run: (mg) => mxPinata(mg, { items: ['🪅', '🫏', '⭐'], swings: 8 }) },
  shashlik: { title: 'Барбакоа', hint: 'Мясо и кукуруза на углях: переворачивай по золотому кольцу и снимай со второй стороны', duration: 25, target: 14,
    run: (mg) => mxComal(mg, { items: ['🥩', '🌽', '🍗', '🌶️'], cook: [2.2, 3.4], burnt: 'Угли!', perfect: 'Богато! +2' }) },
};

// ---------- Учёба (испанский) ----------
const MX_TF = [['«Mañana» значит «завтра»', 1], ['Сомбреро — это закуска', 0], ['Текилу делают из голубой агавы', 1], ['«Gracias» значит «пожалуйста»', 0],
  ['Аксолотль умеет отращивать лапы', 1], ['Столица Мексики — Канкун', 0], ['Пиньяту разбивают палкой', 1], ['Тако едят палочками', 0], ['«Давай быстрее!» — это «¡Ándale!»', 1],
  ['Мариачи играют на балалайке', 0], ['Фрида Кало — мексиканская художница', 1], ['День мёртвых — грустный праздник без музыки', 0], ['«Perro» — это собака', 1],
  ['В Мексике говорят на португальском', 0], ['Пирамиды есть в Теотиуакане', 1], ['Гуакамоле делают из авокадо', 1], ['«Calle» значит «кошка»', 0]];
startLessonGame = (function (orig) {
  return function (stage) {
    if (city() !== 'mex' || stage < 1 || stage > 4) { orig(stage); return; }
    const need = Math.max(2, Math.round([0, 7, 10, 8, 9][stage] * (hasEffect('t_focus') ? 0.75 : 1)));
    const games = {
      1: { name: 'Лотерия: слова', hint: `Ведущий кричит слово по-испански — найди картинку. Набери ${need}`, setup: (mg) => mxLoteria(mg, { words: true, score: 'marks', size: 3, every: 2.6, hit: 0.8 }) },
      2: { name: 'Испанский: слова', hint: `Слово падает — выбери перевод. Набери ${need}`, setup: (mg) => mxWords(mg, {}) },
      3: { name: 'Испанский: числа', hint: `Найди дом с номером, названным по-испански. Набери ${need}`, setup: (mg) => mxCalle(mg, { hintUntil: 2 }) },
      4: { name: '¿Verdad o mentira?', hint: `Смахивай карточку: вправо — правда, влево — ложь. Набери ${need}`, setup: (mg) => mxQuiz(mg, { limit: 5500, gen: () => { const [t, v] = pick(MX_TF); return { q: t, a: v ? 'Verdad' : 'Mentira', opts: ['Mentira', 'Verdad'] }; } }) },
    };
    const g = games[stage];
    runGame({ title: `📖 ${g.name}`, scoreLabel: ` / ${need}`, hint: g.hint, duration: LESSON_TIME, setup: g.setup, finish: (score) => finishLesson(stage, score, need) });
  };
})(startLessonGame);

// ---------- Зал ----------
const MX_GYM = {
  cardio: { title: 'Зумба на пляже', icon: '💃', hint: 'Стрелки падают — жми ту же, когда она на линии', engine: (mg) => mxDance(mg, { lanes: ['⬅️', '⬇️', '⬆️', '➡️'], dancer: '🕺', time: 22 }) },
  power: { title: 'Камень ацтеков', icon: '🗿', hint: 'Держи камень над головой ровно: ⬅️ ➡️ выравнивают. Каждая секунда в зелёной зоне — очко', engine: (mg) => mxBalance(mg, { icon: '🗿', base: '🏋️', time: 20, drift: 1.1 }) },
  stretch: { title: 'Йога на закате', icon: '🧘', hint: 'Плавно держи баланс в позе дерева. Без резких движений', engine: (mg) => mxBalance(mg, { icon: '🌅', base: '🧘', time: 20, drift: 0.7, okWord: 'Namasté' }) },
  bag: { title: 'Тренировка лучадора', icon: '🤼', hint: 'Тренер показывает приём — отвечай: удар — блок, подсечка — прыжок, захват — уклон', engine: (mg) => mxLucha(mg, { foe: '🤼', time: 22 }) },
};
Object.values(MX_GYM).forEach((g) => { g.max = GYM_REPS * 2; });

// ---------- Свидания ----------
const MX_TALK = [['Она: «Потанцуем?» Что ответить?', ['Конечно!', 'Нет, я устал', 'Что?']], ['«Me encanta el mar». Она любит…', ['Море', 'Мороженое', 'Маму']],
  ['Комплимент по-испански:', ['Eres preciosa', 'Eres un taco', 'Eres policía']], ['«¿De dónde eres?» — она спрашивает…', ['Откуда ты', 'Где деньги', 'Сколько время']],
  ['Её любимый художник?', ['Фрида Кало', 'Шишкин', 'Шнырь']], ['Как сказать «Я тебя люблю»?', ['Te quiero', 'Te pago', 'Te llamo']],
  ['Она угощает тамалес. Ты…', ['Как вкусно! Спасибо', 'А шаверма есть?', 'Я на диете']], ['На ужин с её мамой надо принести…', ['Цветы и пан дульсе', 'Пиво', 'Ничего']]];
const MX_NOVELA = [['Дон Альфонсо оказался…', ['Её отцом', 'Котом', 'Пиццей']], ['Близнец героини…', ['Был злым всё это время', 'Улетел на Марс', 'Стал тако']],
  ['После амнезии Мария вспомнила…', ['Свою настоящую любовь', 'Рецепт борща', 'Пароль от вай-фая']], ['Свадьбу сорвал…', ['Бывший муж из тюрьмы', 'Голубь', 'Курс доллара']],
  ['В завещании дедушки…', ['Всё получила служанка', 'Только рецепт', 'Карта сокровищ Шныря']], ['Злодейка в маске — это…', ['Сестра героя', 'Михалыч', 'Почтальон']]];
const mxTalk = (bank) => () => { const [q, o] = pick(bank); return { q, a: o[0], opts: shuffle(o) }; };
const MX_DATES = {
  walk: { title: 'Callejón del Beso', hint: 'Ведите друг друга по переулкам Гуанахуато: она говорит, куда свернуть', duration: 20, max: 10, setup: (mg) => mxRoute(mg, { player: '💑', place: ['Callejón del Beso', 'Plaza de la Paz', 'Teatro Juárez', 'Mercado Hidalgo'], hardAt: 99, dur: 2.6 }) },
  skate: { title: 'Сёрф вдвоём', hint: 'Держи — вверх по волне, отпусти — вниз. Ракушки ей, медузы мимо', duration: 18, max: 10, setup: (mg) => mxSurf(mg, { player: '🏄', good: ['🐚', '🌺', '⭐'], bad: ['🪼', '🪨'] }) },
  cafe: { title: 'Кафе: разговор по-испански', hint: 'Отвечай ей правильно — по карточке, пока не кончилось время', duration: 25, max: 8, setup: (mg) => mxQuiz(mg, { gen: mxTalk(MX_TALK), bg: 'mx-cafe' }) },
  amuse: { title: 'Ярмарка: пиньята', hint: 'Бей, когда пиньята над палкой. Разбей для неё звезду!', duration: 0, max: 12, setup: (mg) => mxPinata(mg, { items: ['⭐', '🪅'], swings: 8, unit: true }) },
  cinema: { title: 'Сериал: угадай поворот', hint: 'Она обожает телесериалы. Угадай, что будет дальше!', duration: 25, max: 7, setup: (mg) => mxQuiz(mg, { gen: mxTalk(MX_NOVELA), limit: 7000 }) },
  picnic: { title: 'Пикник: прогони чаек', hint: 'Чайка 🐦 села на еду — прогони её тапом! Её руку 🤚 не трогай', duration: 20, max: 14, setup: (mg) => mxAgave(mg, { ripe: ['🐦', '🐦‍⬛'], empty: '', bad: ['🤚', '🌮'], badRate: 0.2, rotPenalty: true, rotText: 'Утащила тако!', ripeT: [1.1, 1.8], ripeText: 'Кыш!', bg: 'mx-beach' }) },
  museum: { title: 'Музей: лотерия Фриды', hint: 'Экскурсовод называет картины — найди их на стене', duration: 25, max: 8, setup: (mg) => mxLoteria(mg, { score: 'marks', size: 3, every: 2.4, hit: 0.85 }) },
  karaoke: { title: 'Серенада с мариачи', hint: 'Играй вместе с мариачи: гитара, скрипка, труба — жми, когда нота на линии', duration: 0, max: 18, setup: (mg) => mxDance(mg, { lanes: ['🎸', '🎻', '🎺'], dancer: '🎤', time: 22, every: 0.8 }) },
  bowling: { title: 'Подкова на колышек', hint: 'Бросай, когда колышек в кольце. 10 бросков — кто больше?', duration: 0, max: 8, setup: (mg) => mxLasso(mg, { btn: '🧲 Бросить подкову', good: ['🪵'], bad: ['🐓'], badRate: 0.15, throws: 10, hitText: 'Попал!', bg: 'mx-ranch' }) },
  rest: { title: 'Кулинарный класс: тортильи', hint: 'Готовите вместе: переворачивай по золотому кольцу', duration: 25, max: 12, setup: (mg) => mxComal(mg, { items: ['🫓', '🌮', '🫔'], slots: 3 }) },
  yacht: { title: 'Снорклинг на рифе', hint: 'Держи — ныряешь, отпусти — всплываешь. Собирай красоту для неё, медуз обходи', duration: 0, max: 12, setup: (mg) => mxDive(mg, { good: ['🐠', '🐚', '⭐', '🐢'], bad: ['🪼'], hook: '🤿', boat: '⛵', btn: '⬇️ Нырнуть', hitText: 'Красиво!', time: 22 }) },
};

// ---------- Дети ----------
const MX_KIDS = {
  baby: { title: 'Качай гамак', hint: 'Малыш в гамаке: держи его ровно стрелками — пусть засыпает', duration: 15, max: 12, setup: (mg) => mxBalance(mg, { icon: '👶', base: '🌴', drift: 0.6, every: 0.8, okWord: 'Zzz…' }) },
  kid: { title: 'Детская фиеста', hint: 'Разбей пиньяту вместе с ребёнком! Бей, когда она над палкой', duration: 15, max: 10, setup: (mg) => mxPinata(mg, { items: ['🪅', '🦄', '🐴'], unit: true, time: 15 }) },
  teen: { title: 'Домашка по испанскому', hint: 'Сын проверяет тебя: переведи слово на испанский, пока не упало', duration: 20, max: 8, setup: (mg) => mxWords(mg, { reverse: true, fall: 5.5 }) },
};

// ---------- Дела с ней ----------
const MX_PARTNER = {
  bags: { title: 'Корзина на рынке', hint: 'Собери покупки по её списку — жми, когда нужное в рамке', duration: 20, target: 8, setup: (mg) => mxBuild(mg, { pool: ['🥑', '🌽', '🍅', '🧅', '🌶️', '🍋', '🥭', '🫘'], size: [3, 3], btn: '🧺 В корзину', orderName: 'Список' }) },
  keys: { title: 'Найди её ключи', hint: 'Ключи 🔑 мелькают среди хлама на патио — хватай их, остальное не трогай', duration: 15, target: 6, setup: (mg) => mxAgave(mg, { ripe: ['🔑'], empty: ['🪴', '🧺', '👡', '🪇'], bad: ['🦎', '🐈'], badRate: 0.2, ripeT: [0.8, 1.3], bg: 'mx-patio' }) },
  cook: { title: 'Ужин вместе', hint: 'Кесадильи на сковороде: переворачивай вовремя', duration: 20, target: 10, setup: (mg) => mxComal(mg, { items: ['🫓', '🧀'], slots: 3 }) },
  shelf: { title: 'Повесь гамак', hint: 'Держи гамак ровно, пока она завязывает узлы', duration: 15, target: 10, setup: (mg) => mxBalance(mg, { icon: '🪢', base: '🌴', drift: 0.9 }) },
  darts2: { title: 'Пиньята во дворе', hint: 'Она поспорила, что ты не попадёшь в центр. 8 ударов!', duration: 0, target: 100, setup: (mg) => mxPinata(mg, { items: ['🪅'], swings: 8 }) },
};

// ---------- Тюрьма ----------
const MX_JAIL = {
  mittens: { name: 'Плести гамаки', emoji: '🪢', desc: 'Собирай узлы по схеме. Платят мало, но срок −2 мин',
    game: { title: 'Мастерская Пуэнте-Гранде', hint: 'Бери нить нужного цвета, когда она в рамке', duration: 25, max: 10, setup: (mg) => mxBuild(mg, { pool: ['🟥', '🟨', '🟩', '🟦', '🟪'], size: [3, 4], btn: '🪢 Вплести', orderName: 'Схема', bg: 'mx-cell-bg' }) } },
  pushups: { name: 'Бои во дворе', emoji: '🤼', desc: 'Сила растёт даже здесь',
    game: { title: 'Тюремная лучa', hint: 'Сокамерник-лучадор готовит приём — отвечай правильно', duration: 15, max: 8, setup: (mg) => mxLucha(mg, { foe: '🧟', bg: 'mx-cell-bg' }) } },
  escape: { name: 'Подкоп ложкой', emoji: '🥄', desc: 'Удачно — свобода, но розыск ⭐⭐⭐⭐⭐. Провал — срок +10 мин',
    game: { title: 'Подкоп под стеной', hint: 'Пройди все 3 участка подкопа за 25 секунд. Держи «Копать», пока охранник далеко; видишь «Тише!» — отпускай. Следи за тревогой: 3 обнаружения — провал. Полный подкоп гарантирует свободу и розыск ⭐⭐⭐⭐⭐.', duration: 25, max: 4, setup: (mg) => mxTunnel(mg, { patrol: '💂', digger: '🥄', goal: '🌵', segs: 3, speed: 0.13, finishOnExit: true, caughtText: 'Эй! Кто там?' }) } },
};

// ---------- Криминал Мексики ----------
const MX_CRIMES = [
  { id: 'x_pick', name: 'Карманник на фиесте', emoji: '👛', level: 3, energy: 15, wanted: 1, risk: 0.08, cd: 120, desc: 'Турист фотографирует мариачи — бумажник торчит. Смотрит на тебя — замри',
    game: { title: 'Фиеста', hint: 'Тапай туриста, когда торчит 👛. Смотрит 👀 — не трогай! Три раза попался — конец', duration: 18, max: 9,
      setup: (mg) => mxAgave(mg, { ripe: ['👛', '💳', '⌚'], empty: ['🕺', '💃', '📸'], bad: ['👀', '👮'], badRate: 0.28, ripeT: [0.9, 1.4], maxMiss: 3, ripeText: 'Спасибо!', badText: 'Вор!', bg: 'mx-fiesta' }) },
    reward: (perf) => Math.round((900 + level() * 240) * perf) },
  { id: 'x_horse', name: 'Угон лошадей с ранчо', emoji: '🐎', level: 6, energy: 25, wanted: 2, risk: 0.14, cd: 300, desc: 'Ночью, лассо, ранчо дона Мендосы. Быка не лови!',
    game: { title: 'Ранчо ночью', hint: 'Бросай лассо, когда конь в петле. Быка 🐂 не лови — поднимет всех', duration: 20, max: 8, setup: (mg) => mxLasso(mg, { good: ['🐎', '🐴'], bad: ['🐂'], badRate: 0.25, bg: 'mx-ranch night' }) },
    reward: (perf) => Math.round((6000 + level() * 900) * perf) },
  { id: 'x_tunnel', name: 'Туннель под границей', emoji: '🕳️', level: 9, energy: 30, wanted: 2, risk: 0.16, cd: 600, desc: 'Копать для Скорпионов. Патруль ходит прямо над тобой',
    game: { title: 'El Túnel', hint: 'Держи «Копать», пока патруль далеко. Над тобой 👣 — отпусти! Три тревоги — конец', duration: 25, max: 6, setup: (mg) => mxTunnel(mg, { patrol: '🚙', segs: 3, maxMiss: 3 }) },
    reward: (perf) => Math.round((15000 + level() * 1500) * perf) },
  { id: 'x_boat', name: 'Ящики «текилы» на катере', emoji: '🚤', level: 12, energy: 30, wanted: 3, risk: 0.18, cd: 900, desc: 'Ночная доставка вдоль побережья. Береговая охрана не спит',
    game: { title: 'Ночное побережье', hint: 'Держи — катер вверх, отпусти — вниз. Подбирай ящики 📦, уходи от патруля 🚨 и прожекторов 🔦', duration: 22, max: 12,
      setup: (mg) => mxSurf(mg, { player: '🚤', good: ['📦', '📦', '💰'], bad: ['🚨', '🔦', '🛳️'], goodRate: 0.55, maxMiss: 3, bg: 'mx-ocean night' }) },
    reward: (perf) => Math.round((30000 + level() * 2500) * perf) },
  { id: 'x_casino', name: 'Сейф казино в Тихуане', emoji: '🎰', level: 15, energy: 35, wanted: 3, risk: 0.2, cd: 1200, desc: 'Стетоскоп, тишина и три замка. Казино «Эль Дорадо» платит картелю — пусть заплатит тебе',
    game: { title: 'Сейф «Эль Дорадо»', hint: 'Крути диск пальцем или ⟲ ⟳. Громче 🔊 — ближе. Жми «Щелчок» на нужном числе. Три ошибки — сигнализация', duration: 30, max: 6, setup: (mg) => mxSafe(mg, { maxMiss: 3, doneText: 'Открыто! +2' }) },
    reward: (perf) => Math.round((60000 + level() * 4000) * perf) },
  { id: 'x_convoy', name: 'Угон фуры картеля', emoji: '🚛', level: 18, energy: 40, wanted: 4, risk: 0.22, cd: 1800, desc: 'Фура Скорпионов с «грузом». Сбей погоню с хвоста — по указке штурмана',
    game: { title: 'Погоня по трассе 15', hint: 'Штурман кричит, куда сворачивать. Ошибка — погоня ближе', duration: 25, max: 12, setup: (mg) => mxRoute(mg, { player: '🚛', place: ['Culiacán', 'Mazatlán', 'Sierra Madre', 'Los Mochis'], dur: 2 }) },
    reward: (perf) => Math.round((120000 + level() * 6000) * perf) },
];

// ---------- Подмена при входе в Мексику и возврат при выходе ----------
const MX_SWAP = [];
function mxSwap(obj, key, val) { MX_SWAP.push({ obj, key, val, saved: false, orig: null }); }
Object.entries(MX_LEISURE).forEach(([k, v]) => mxSwap(LEISURE_GAMES, k, v));
Object.entries(MX_GYM).forEach(([k, v]) => mxSwap(GYM_GAMES, k, v));
Object.entries(MX_DATES).forEach(([k, v]) => mxSwap(DATE_GAMES, k, v));
Object.entries(MX_KIDS).forEach(([k, v]) => mxSwap(KID_GAMES, k, v));
Object.entries(MX_PARTNER).forEach(([k, v]) => { const i = PARTNER_GAMES.findIndex((g) => g.id === k); if (i >= 0) mxSwap(PARTNER_GAMES, i, { id: k, ...v }); });
Object.entries(MX_JAIL).forEach(([k, v]) => { const a = JAIL_ACTS.find((x) => x.id === k); if (a) Object.entries(v).forEach(([f, val]) => mxSwap(a, f, val)); });
let MX_CRIMES_ORIG = null;
MEX_RESKIN.push((on) => {
  MX_SWAP.forEach((s) => {
    if (on) { if (!s.saved) { s.orig = s.obj[s.key]; s.saved = true; } s.obj[s.key] = s.val; }
    else if (s.saved) { s.obj[s.key] = s.orig; s.saved = false; }
  });
  if (on) { if (!MX_CRIMES_ORIG) MX_CRIMES_ORIG = CRIMES.slice(); CRIMES.splice(0, CRIMES.length, ...MX_CRIMES); }
  else if (MX_CRIMES_ORIG) { CRIMES.splice(0, CRIMES.length, ...MX_CRIMES_ORIG); MX_CRIMES_ORIG = null; }
});
// Подписи игр свиданий
if (typeof DATE_GAME_ICON !== 'undefined') {
  const MX_ICON = { walk: '🧭 переулки', skate: '🏄 сёрф', cafe: '🗣️ испанский', amuse: '🪅 пиньята', cinema: '📺 сериал', picnic: '🐦 чайки', museum: '🎴 лотерия', karaoke: '🎺 мариачи', bowling: '🧲 подкова', rest: '🫓 тортильи', yacht: '🤿 снорклинг' };
  Object.entries(MX_ICON).forEach(([k, v]) => mxSwap(DATE_GAME_ICON, k, v));
}
