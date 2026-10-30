// Мини-игры 2.9: у каждого занятия — своя игра. Раньше «тапай по целям», «полоска с меткой» и «полосы»
// повторялись у десятка работ, свиданий и семейных дел. Теперь у них собственные механики:
// свайп-уборка, рентген на конвейере, опознание, руль, рецепт по шагам, фото на яхте, удержание в зоне,
// башня из покупок, поиск предмета, нарезка, боулинг, ловля корзиной, прятки, тир, карманник, погоня,
// защита пикника и три упражнения в зале.

// Координаты указателя внутри арены (0..1)
function mgPoint(e, arena) {
  const r = arena.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, w: r.width, h: r.height };
}
function mgEl(arena, cls, html) {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = html;
  arena.appendChild(el);
  return el;
}
function mgLoop(mg, fn) {
  let last = performance.now();
  const loop = (now) => {
    if (!mgAlive(mg)) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    fn(dt, now);
    mg.raf = requestAnimationFrame(loop);
  };
  mg.raf = requestAnimationFrame(loop);
}
const mgElapsed = (mg) => (Date.now() - mg.start) / 1000;

// ---------- Дворник: веди пальцем по грязи, пока не отмоешь ----------
function gameSwipe(mg, cfg) {
  const arena = $('mgArena');
  arena.innerHTML = '<div class="sw-yard"></div>';
  const spots = [];
  const add = () => {
    const s = { x: rand(0.1, 0.9), y: rand(0.12, 0.88), hp: 1 };
    s.el = mgEl(arena, 'sw-spot', pick(cfg.dirt));
    s.el.style.left = s.x * 100 + '%'; s.el.style.top = s.y * 100 + '%';
    spots.push(s);
  };
  for (let i = 0; i < 4; i++) add();
  const pest = { x: -0.2, y: 0.5, vx: 0, el: mgEl(arena, 'sw-pest', pick(cfg.bad)), next: 2 };
  let down = false, prev = null, hurtAt = 0;
  mgLoop(mg, (dt) => {
    pest.next -= dt;
    if (pest.vx === 0 && pest.next <= 0) { pest.el.textContent = pick(cfg.bad); pest.y = rand(0.2, 0.8); pest.vx = (Math.random() < 0.5 ? 1 : -1) * rand(0.18, 0.3); pest.x = pest.vx > 0 ? -0.1 : 1.1; }
    if (pest.vx) { pest.x += pest.vx * dt; if (pest.x < -0.15 || pest.x > 1.15) { pest.vx = 0; pest.next = rand(1.5, 3.5); } }
    pest.el.style.left = pest.x * 100 + '%'; pest.el.style.top = pest.y * 100 + '%';
  });
  arena.onpointerdown = (e) => { e.preventDefault(); down = true; prev = mgPoint(e, arena); };
  arena.onpointerup = arena.onpointerleave = arena.onpointercancel = () => { down = false; prev = null; };
  arena.onpointermove = (e) => {
    if (!down || !mgAlive(mg)) return;
    const p = mgPoint(e, arena);
    const moved = prev ? Math.hypot((p.x - prev.x) * p.w, (p.y - prev.y) * p.h) : 0;
    prev = p;
    if (pest.vx && Math.hypot((p.x - pest.x) * p.w, (p.y - pest.y) * p.h) < 30 && Date.now() - hurtAt > 900) {
      hurtAt = Date.now(); mgScore(-2); sfx('error'); haptic('error'); shakeArena(); floatAt(pest.el, cfg.badText || (pest.el.textContent==='👵'?'Ой!':pest.el.textContent==='🐈'?'Мяу!':'Осторожно!'), 'bad');
    }
    for (const s of spots) {
      if (s.hp <= 0 || Math.hypot((p.x - s.x) * p.w, (p.y - s.y) * p.h) > 34) continue;
      s.hp -= moved / 160;
      s.el.style.opacity = Math.max(0.15, s.hp);
      s.el.style.transform = `translate(-50%,-50%) scale(${0.6 + s.hp * 0.4})`;
      if (s.hp <= 0) { mgScore(1); sfx('coin'); haptic('light'); s.el.remove(); spots.splice(spots.indexOf(s), 1); add(); break; }
    }
  };
}

// ---------- Охранник: рентген на ленте, хватай запрещённое ----------
function gameConveyor(mg, cfg) {
  const arena = $('mgArena');
  arena.innerHTML = '<div class="cv-belt"><i></i></div><div class="cv-scan">РЕНТГЕН</div>';
  const items = [];
  let next = 0, targets = [];
  mgLoop(mg, (dt) => {
    const t = mgElapsed(mg);
    const speed = 0.22 + t * 0.006;
    next -= dt;
    if (next <= 0) {
      next = Math.max(0.55, 1.15 - t * 0.02);
      // A sorting shift always offers enough targets, with random order in each bag.
      if(cfg.fairTargets && !targets.length) targets=shuffle([true,true,true,false,false]);
      const bad = cfg.fairTargets ? targets.pop() : Math.random() < cfg.badRate;
      const it = { x: 1.1, bad, el: mgEl(arena, 'cv-item', pick(bad ? cfg.bad : cfg.good)) };
      it.el.onpointerdown = (e) => {
        e.preventDefault();
        if (it.done || !mgAlive(mg)) return;
        it.done = true;
        if (it.bad) { mgScore(1); sfx('coin'); haptic('light'); it.el.classList.add('seized'); floatAt(it.el, 'Изъято!', 'good'); }
        else { mgScore(-1); sfx('error'); shakeArena(); it.el.classList.add('wrong'); floatAt(it.el, 'Жалоба!', 'bad'); }
        setTimeout(() => it.el.remove(), 250);
      };
      items.push(it);
    }
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.x -= speed * dt;
      it.el.style.left = it.x * 100 + '%';
      it.el.classList.toggle('xray', it.x > 0.3 && it.x < 0.7);
      if (it.x < -0.12) {
        if (it.bad && !it.done) { mgScore(-1); sfx('error'); floatAt(arena, 'Пронесли!', 'bad'); }
        it.el.remove(); items.splice(i, 1);
      }
    }
  });
}

// ---------- Полицейский: опознание по приметам ----------
const LU_FACE = ['👨', '👩', '🧔', '👴', '👱', '👨‍🦰'];
const LU_HAT = ['🎩', '🧢', '👒', '⛑️'];
const LU_GLASS = ['🕶️', '👓', ''];
function gameLineup(mg) {
  const arena = $('mgArena');
  const round = () => {
    if (!mgAlive(mg)) return;
    const want = { f: pick(LU_FACE), h: pick(LU_HAT), g: pick(LU_GLASS) };
    const people = [want];
    while (people.length < 4) {
      const p = { ...want };
      const k = pick(['f', 'h', 'g']);
      p[k] = pick({ f: LU_FACE, h: LU_HAT, g: LU_GLASS }[k].filter((v) => v !== want[k]));
      if (!people.some((x) => x.f === p.f && x.h === p.h && x.g === p.g)) people.push(p);
    }
    const order = shuffle(people);
    arena.innerHTML = `<div class="lu-wit">🗣️ Свидетель: <b>${want.h} ${want.f} ${want.g || 'без очков'}</b></div>
      <div class="lu-row">${order.map((p, i) => `<button class="lu-man" data-i="${i}"><span class="h">${p.h}</span><span class="f">${p.f}</span><span class="g">${p.g || '·'}</span></button>`).join('')}</div>`;
    arena.querySelectorAll('.lu-man').forEach((b) => {
      b.onpointerdown = (e) => {
        e.preventDefault();
        if (!mgAlive(mg) || b.dataset.done) return;
        arena.querySelectorAll('.lu-man').forEach((x) => { x.dataset.done = 1; });
        const ok = order[+b.dataset.i] === want;
        b.classList.add(ok ? 'right' : 'wrong');
        if (ok) { mgScore(1); sfx('coin'); } else { mgScore(-1); mg.mistakes = (mg.mistakes || 0) + 1; sfx('error'); shakeArena(); }
        mgDelay(mg, round, ok ? 300 : 650);
      };
    });
  };
  round();
}

// ---------- Таксист: держи машину на извилистой дороге ----------
function gameSteer(mg, cfg) {
  const arena = $('mgArena');
  const N = 14;
  arena.innerHTML = `<div class="st-road" id="stRoad">${'<i></i>'.repeat(N)}</div><div class="st-car" id="stCar">${cfg.player || '🚕'}</div>
    <div class="st-hint"><span>◀ держи</span><span>держи ▶</span></div>`;
  const segs = [...$('stRoad').children], car = $('stCar');
  segs.forEach((s, i) => { s.style.top = (i / N) * 100 + '%'; s.style.height = 100 / N + 0.6 + '%'; });
  let x = 0.5, hold = 0, t = 0, tick = 0, bonus = null;
  const center = (k) => 0.5 + Math.sin(k * 0.9) * 0.24 + Math.sin(k * 2.3) * 0.08;
  const W = 0.34;
  arena.onpointerdown = (e) => { e.preventDefault(); hold = mgPoint(e, arena).x < 0.5 ? -1 : 1; };
  arena.onpointerup = arena.onpointerleave = arena.onpointercancel = () => { hold = 0; };
  mgLoop(mg, (dt) => {
    t += dt * (0.9 + mgElapsed(mg) * 0.02);
    x = clamp(x + hold * dt * 0.75, 0.05, 0.95);
    segs.forEach((s, i) => { const k = t + (N - 1 - i) * 0.12; s.style.left = (center(k) - W / 2) * 100 + '%'; s.style.width = W * 100 + '%'; });
    car.style.left = x * 100 + '%';
    const c = center(t);
    const on = Math.abs(x - c) < W / 2;
    car.classList.toggle('off', !on);
    tick += dt;
    if (tick >= 0.5) { tick = 0; if (on) mgScore(1); else { sfx('error'); haptic('light'); } }
    if (!bonus && Math.random() < dt * 0.5) bonus = { k: t + (N - 1) * 0.12, el: mgEl(arena, 'st-bonus', pick(cfg.good || ['🙋'])) };
    if (bonus) {
      const i = N - 1 - (bonus.k - t) / 0.12;
      bonus.el.style.top = (i / N) * 100 + '%'; bonus.el.style.left = center(bonus.k) * 100 + '%';
      if (i >= N - 1.3) {
        if (Math.abs(x - center(bonus.k)) < 0.1) { mgScore(3); sfx('coin'); floatAt(car, '+3 пассажир', 'good'); }
        bonus.el.remove(); bonus = null;
      }
    }
  });
}

// ---------- Шаурмист: собери строго по рецепту ----------
function gameRecipe(mg, cfg) {
  const arena = $('mgArena');
  const shelf = [...new Set(cfg.recipes.flatMap((r) => r[1]))];
  arena.innerHTML = `<div class="rc-top"><b id="rcName"></b><div class="rc-steps" id="rcSteps"></div></div>
    <div class="od-grid">${shuffle(shelf).map((it) => `<button class="od-item" data-item="${it}">${it}</button>`).join('')}</div>`;
  let rec = null, step = 0;
  const draw = () => { $('rcSteps').innerHTML = rec[1].map((it, i) => `<span class="${i < step ? 'ok' : i === step ? 'cur' : ''}">${it}</span>`).join('<i>›</i>'); };
  const next = () => { rec = pick(cfg.recipes); step = 0; $('rcName').textContent = rec[0]; draw(); };
  next();
  arena.querySelectorAll('.od-item').forEach((b) => {
    b.onpointerdown = (e) => {
      e.preventDefault();
      if (!mgAlive(mg)) return;
      if (b.dataset.item === rec[1][step]) {
        step++; sfx('tap'); draw();
        if (step >= rec[1].length) { mgScore(1); sfx('coin'); floatAt($('rcSteps'), 'Готово! 😋', 'good'); setTimeout(() => mgAlive(mg) && next(), 300); }
      } else { mg.mistakes = (mg.mistakes || 0) + 1; sfx('error'); haptic('error'); shakeArena(); floatAt(b, 'Не по рецепту!', 'bad'); }
    };
  });
}

// ---------- Яхта: сфотографируй дельфина в кадре ----------
function gamePhoto(mg, cfg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="ph-sea"></div><div class="ph-frame" id="phFrame"></div><div class="ph-film" id="phFilm"></div>
    <button class="btn primary wide mg-big" id="phBtn">📸 Снимок (${cfg.shots})</button>`;
  const objs = [];
  let shots = cfg.shots, next = 0;
  mgLoop(mg, (dt) => {
    next -= dt;
    if (next <= 0) {
      next = rand(0.7, 1.4);
      const good = Math.random() < 0.55;
      const dir = Math.random() < 0.5 ? 1 : -1;
      const o = { good, x: dir > 0 ? -0.1 : 1.1, y: rand(0.2, 0.6), v: dir * rand(0.22, 0.42), ph: Math.random() * 6, el: mgEl(arena, 'ph-obj', good ? pick(cfg.good) : pick(cfg.bad)) };
      if (dir < 0) o.el.style.transform = 'translate(-50%,-50%) scaleX(-1)';
      objs.push(o);
    }
    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i];
      o.x += o.v * dt; o.ph += dt * 4;
      o.el.style.left = o.x * 100 + '%'; o.el.style.top = (o.y + Math.sin(o.ph) * 0.05) * 100 + '%';
      if (o.x < -0.15 || o.x > 1.15) { o.el.remove(); objs.splice(i, 1); }
    }
  });
  $('phBtn').onpointerdown = (e) => {
    e.preventDefault();
    if (!mgAlive(mg) || shots <= 0) return;
    shots--;
    $('phBtn').textContent = `📸 Снимок (${shots})`;
    $('phFrame').animate([{ background: 'rgba(255,255,255,.8)' }, { background: 'transparent' }], { duration: 250 });
    sfx('tap');
    const inFrame = objs.filter((o) => Math.abs(o.x - 0.5) < 0.14 && Math.abs(o.y + Math.sin(o.ph) * 0.05 - 0.4) < 0.2);
    const good = inFrame.filter((o) => o.good);
    const pts = good.length ? (Math.abs(good[0].x - 0.5) < 0.06 ? 3 : 2) - (inFrame.length > good.length ? 1 : 0) : inFrame.length ? -1 : 0;
    if (pts) mgScore(pts);
    $('phFilm').textContent += good.length ? good[0].el.textContent : inFrame.length ? '🙈' : '🌫️';
    floatAt($('phFrame'), pts > 0 ? `+${pts} ${pts >= 3 ? 'Шедевр!' : 'Красиво'}` : pts < 0 ? 'Испорчен кадр' : 'Пустой кадр', pts > 0 ? 'good' : 'bad');
    if (pts > 0) sfx('coin'); else sfx('error');
    if (!shots) mgDelay(mg, mgEnd, 500);
  };
}

// ---------- Малыш: держи «спокойствие» в зелёной полосе (зажми и отпускай) ----------
function gameHold(mg, cfg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="hd-wrap"><div class="hd-icon" id="hdIcon">${cfg.icon}</div>
      <div class="hd-col"><div class="hd-band" id="hdBand"></div><div class="hd-mark" id="hdMark"></div></div></div>
    <button class="btn primary wide mg-big" id="hdBtn">${cfg.btn}</button>`;
  let y = 0.2, v = 0, hold = false, band = 0.4, bandV = 0, tick = 0;
  const H = cfg.band || 0.26;
  const btn = $('hdBtn');
  btn.onpointerdown = (e) => { e.preventDefault(); hold = true; };
  btn.onpointerup = btn.onpointerleave = btn.onpointercancel = () => { hold = false; };
  mgLoop(mg, (dt) => {
    v += (hold ? 1.6 : -1.3) * dt;
    v *= Math.exp(-2.2 * dt);
    y = clamp(y + v * dt, 0, 1);
    if (y === 0 || y === 1) v = 0;
    if (Math.random() < dt * 0.9) bandV = rand(-0.35, 0.35);
    band = clamp(band + bandV * dt, 0, 1 - H);
    $('hdBand').style.bottom = band * 100 + '%'; $('hdBand').style.height = H * 100 + '%';
    $('hdMark').style.bottom = y * 100 + '%';
    const ok = y >= band && y <= band + H;
    $('hdIcon').textContent = ok ? cfg.icon : cfg.iconBad;
    tick += dt;
    if (tick >= 0.5) { tick = 0; if (ok) { mgScore(1); sfx('tap'); } }
  });
}

// ---------- Сумки: башня из покупок ----------
function gameStack(mg, cfg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="sk-tower" id="skTower"></div><button class="btn primary wide mg-big" id="skBtn">${cfg.btn}</button>`;
  const tower = $('skTower');
  let left = 0.3, width = 0.4, x = 0, dir = 1, speed = 0.55, level = 0, cur = null;
  const H = 26;
  const spawn = () => {
    cur = document.createElement('div');
    cur.className = 'sk-block';
    cur.textContent = pick(cfg.items);
    cur.style.bottom = level * H + 'px';
    cur.style.width = width * 100 + '%';
    tower.appendChild(cur);
    x = 0; dir = 1;
  };
  const base = document.createElement('div');
  base.className = 'sk-block base'; base.style.left = left * 100 + '%'; base.style.width = width * 100 + '%'; base.style.bottom = '0px'; base.textContent = cfg.base;
  tower.appendChild(base);
  level = 1;
  spawn();
  mgLoop(mg, (dt) => {
    if (!cur) return;
    x += dir * speed * dt;
    if (x > 1 - width) { x = 1 - width; dir = -1; } else if (x < 0) { x = 0; dir = 1; }
    cur.style.left = x * 100 + '%';
  });
  $('skBtn').onpointerdown = (e) => {
    e.preventDefault();
    if (!mgAlive(mg) || !cur) return;
    const a = Math.max(x, left), b = Math.min(x + width, left + width);
    if (b - a <= 0.02) { cur.classList.add('fall'); sfx('error'); haptic('error'); shakeArena(); floatAt(tower, cfg.fail, 'bad'); cur = null; mgDelay(mg, mgEnd, 600); return; }
    const perfect = Math.abs(x - left) < 0.025;
    if (!perfect) { width = b - a; left = a; } else x = left;
    cur.style.left = left * 100 + '%'; cur.style.width = width * 100 + '%';
    mgScore(perfect ? 2 : 1); sfx(perfect ? 'crit' : 'tap');
    if (perfect) floatAt(cur, 'Ровно!', 'good');
    level++;
    speed *= 1.08;
    if (level > 9) { cur = null; mgDelay(mg, mgEnd, 400); return; }
    tower.style.transform = `translateY(${Math.max(0, level - 6) * H}px)`;
    spawn();
  };
}

// ---------- Ключи: найди предмет среди хлама ----------
function gameSpot(mg, cfg) {
  const arena = $('mgArena');
  let round = 0;
  const deal = () => {
    if (!mgAlive(mg)) return;
    const n = Math.min(36, 12 + round * 4);
    const cells = Array.from({ length: n }, () => pick(cfg.junk));
    const at = Math.floor(Math.random() * n);
    cells[at] = cfg.find;
    arena.innerHTML = `<div class="spot-grid" style="grid-template-columns:repeat(${Math.ceil(Math.sqrt(n * 1.3))},1fr)">${cells.map((c, i) => `<button data-i="${i}" style="transform:rotate(${Math.round(rand(-30, 30))}deg)">${c}</button>`).join('')}</div>`;
    arena.querySelectorAll('.spot-grid button').forEach((b) => {
      b.onpointerdown = (e) => {
        e.preventDefault();
        if (!mgAlive(mg)) return;
        if (+b.dataset.i === at) { mgScore(1); sfx('coin'); haptic('light'); round++; b.classList.add('found'); mgDelay(mg, deal, 250); }
        else { mg.mistakes = (mg.mistakes || 0) + 1; sfx('error'); b.classList.add('nope'); }
      };
    });
  };
  deal();
}

// ---------- Ужин: режь овощи на лету ----------
function gameChop(mg, cfg) {
  const arena = $('mgArena');
  arena.innerHTML = '<div class="ch-board"></div>';
  const objs = [];
  let next = 0;
  mgLoop(mg, (dt) => {
    next -= dt;
    if (next <= 0) {
      next = rand(0.45, 0.85);
      const bad = Math.random() < cfg.badRate;
      const o = { bad, x: rand(0.15, 0.85), y: 1.05, vx: rand(-0.25, 0.25), vy: -rand(1.05, 1.3), el: document.createElement('button') };
      o.el.className = 'ch-obj';
      o.el.textContent = pick(bad ? cfg.bad : cfg.good);
      o.el.onpointerdown = (e) => {
        e.preventDefault();
        if (o.done || !mgAlive(mg)) return;
        o.done = true;
        if (o.bad) { mgScore(-2); sfx('error'); haptic('error'); shakeArena(); floatAt(o.el, cfg.badText, 'bad'); }
        else { mgScore(1); sfx('tap'); haptic('light'); }
        o.el.classList.add(o.bad ? 'miss' : 'cut');
        setTimeout(() => o.el.remove(), 220);
      };
      arena.appendChild(o.el);
      objs.push(o);
    }
    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i];
      o.vy += 1.25 * dt; o.x += o.vx * dt; o.y += o.vy * dt;
      o.el.style.left = o.x * 100 + '%'; o.el.style.top = o.y * 100 + '%';
      if (o.y > 1.15 && o.vy > 0) { o.el.remove(); objs.splice(i, 1); }
    }
  });
}

// ---------- Боулинг: направление, потом сила ----------
function gameBowling(mg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="bw-lane"><div class="bw-pins" id="bwPins">${'<span>🎳</span>'.repeat(10)}</div><div class="bw-arrow" id="bwArrow">⬆️</div><div class="bw-ball" id="bwBall">🔵</div></div>
    <div class="bw-power"><i id="bwPow"></i><b></b></div><div class="bw-frames" id="bwFrames"></div>
    <button class="btn primary wide mg-big" id="bwBtn">🎯 Прицел</button>`;
  let phase = 'aim', a = 0, p = 0, t = 0, throws = 0, aim = 0;
  mgLoop(mg, (dt) => {
    t += dt;
    if (phase === 'aim') { a = Math.sin(t * (2.2 + throws * 0.3)); $('bwArrow').style.transform = `translateX(-50%) rotate(${a * 35}deg)`; }
    if (phase === 'power') { p = (Math.sin(t * (3 + throws * 0.3)) + 1) / 2; $('bwPow').style.width = p * 100 + '%'; }
  });
  $('bwBtn').onpointerdown = (e) => {
    e.preventDefault();
    if (!mgAlive(mg)) return;
    if (phase === 'aim') { aim = a; phase = 'power'; t = 0; $('bwBtn').textContent = '💪 Сила'; sfx('tap'); return; }
    if (phase !== 'power') return;
    phase = 'roll';
    const acc = 1 - Math.min(1, Math.abs(aim) / 0.6), pw = 1 - Math.min(1, Math.abs(p - 0.75) / 0.4);
    const pins = Math.round(clamp(acc * 0.65 + pw * 0.35, 0, 1) ** 1.3 * 10);
    const ball = $('bwBall');
    ball.animate([{ transform: 'translate(-50%,0)' }, { transform: `translate(calc(-50% + ${aim * 120}px),-210px)` }], { duration: 650, easing: 'ease-in', fill: 'forwards' });
    sfx('whoosh');
    mg.timers.push(setTimeout(() => {
      if (!mgAlive(mg)) return;
      [...$('bwPins').children].forEach((s, i) => { if (i < pins) s.classList.add('down'); });
      mgScore(pins); sfx(pins === 10 ? 'jackpot' : pins >= 6 ? 'crit' : 'punch'); haptic('heavy');
      floatAt($('bwPins'), pins === 10 ? 'СТРАЙК! 🎉' : `${pins} кеглей`, pins >= 5 ? 'good' : 'bad');
      $('bwFrames').innerHTML += `<span>${pins === 10 ? 'X' : pins}</span>`;
      throws++;
      if (throws >= 3) { mgDelay(mg, mgEnd, 700); return; }
      mg.timers.push(setTimeout(() => {
        if (!mgAlive(mg)) return;
        [...$('bwPins').children].forEach((s) => s.classList.remove('down'));
        ball.getAnimations().forEach((x) => x.cancel());
        phase = 'aim'; t = 0; $('bwBtn').textContent = '🎯 Прицел'; $('bwPow').style.width = '0';
      }, 900));
    }, 680));
  };
}

// ---------- Прогулка: лови корзинкой ----------
function gameCatch(mg, cfg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="ct-bask" id="ctBask">${cfg.basket}</div>`;
  const bask = $('ctBask'), objs = [];
  let x = 0.5, target = 0.5, next = 0;
  const aim = (e) => { target = clamp(mgPoint(e, arena).x, 0.08, 0.92); };
  arena.onpointerdown = (e) => { e.preventDefault(); aim(e); };
  arena.onpointermove = (e) => { if (e.buttons || e.pointerType === 'touch') aim(e); };
  mgLoop(mg, (dt) => {
    x += (target - x) * Math.min(1, dt * 12);
    bask.style.left = x * 100 + '%';
    next -= dt;
    const t = mgElapsed(mg);
    if (next <= 0) {
      next = Math.max(0.4, 0.8 - t * 0.02);
      const good = Math.random() < cfg.goodRate;
      const item = pick(good ? cfg.good : cfg.bad);
      objs.push({ good, item, x: rand(0.08, 0.92), y: -0.08, v: rand(0.35, 0.5) + t * 0.01, el: mgEl(arena, 'ct-obj', item) });
    }
    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i];
      o.y += o.v * dt;
      o.el.style.left = o.x * 100 + '%'; o.el.style.top = o.y * 100 + '%';
      if (o.y > 0.8 && o.y < 0.92 && Math.abs(o.x - x) < 0.11) {
        if (o.good) { mgScore(1); sfx('coin'); } else { mgScore(-1); sfx('error'); haptic('error'); shakeArena(); floatAt(bask, cfg.badText || 'Фу!', 'bad'); }
        o.el.remove(); objs.splice(i, 1);
        if (cfg.onCatch) cfg.onCatch(o.item, o.good);
        if (mg.over) return;
      } else if (o.y > 1.05) { o.el.remove(); objs.splice(i, 1); }
    }
  });
}

// ---------- Прятки: кто-то выглядывает из-за укрытия ----------
function gameHide(mg, cfg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="hide-grid">${cfg.spots.map((s, i) => `<button class="hide-spot" data-i="${i}"><b>${s}</b><span></span></button>`).join('')}</div>`;
  const spots = [...arena.querySelectorAll('.hide-spot')];
  let cur = -1;
  const peek = () => {
    if (!mgAlive(mg)) return;
    spots.forEach((s) => s.classList.remove('peek', 'decoy'));
    const t = mgElapsed(mg);
    cur = Math.floor(Math.random() * spots.length);
    spots[cur].querySelector('span').textContent = cfg.who;
    spots[cur].classList.add('peek');
    if (cfg.decoy && Math.random() < 0.35) { const d = (cur + 1 + Math.floor(Math.random() * (spots.length - 1))) % spots.length; spots[d].querySelector('span').textContent = pick(cfg.decoy); spots[d].classList.add('decoy'); }
    const show = Math.max(520, 1050 - t * 25);
    mg.timers.push(setTimeout(() => { spots.forEach((s) => s.classList.remove('peek', 'decoy')); cur = -1; mg.timers.push(setTimeout(peek, rand(250, 600))); }, show));
  };
  spots.forEach((s, i) => {
    s.onpointerdown = (e) => {
      e.preventDefault();
      if (!mgAlive(mg)) return;
      if (i === cur) { mgScore(1); sfx('coin'); haptic('light'); floatAt(s, cfg.hitText || 'Нашёл!', 'good'); s.classList.remove('peek'); cur = -1; }
      else { mgScore(-1); sfx('error'); floatAt(s, 'Пусто', 'bad'); }
    };
  });
  peek();
}

// ---------- Тир: утки едут рядами, патронов мало ----------
function gameShooting(mg, cfg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="sh-rows"><i></i><i></i><i></i></div><div class="sh-ammo" id="shAmmo"></div>`;
  let ammo = cfg.ammo;
  const ammoDraw = () => { $('shAmmo').textContent = '🔸'.repeat(ammo) || 'Патроны кончились'; };
  ammoDraw();
  const rows = [0.18, 0.43, 0.68].map((y, i) => ({ y, v: (i % 2 ? -1 : 1) * (0.16 + i * 0.07), next: rand(0, 1) }));
  const objs = [];
  const shoot = (hit) => {
    if (!mgAlive(mg) || ammo <= 0) return false;
    ammo--; ammoDraw(); sfx('punch');
    if (!hit) floatAt($('shAmmo'), 'Мимо', 'bad');
    if (!ammo) mgDelay(mg, mgEnd, 500);
    return true;
  };
  arena.onpointerdown = (e) => { e.preventDefault(); shoot(false); };
  mgLoop(mg, (dt) => {
    rows.forEach((r) => {
      r.next -= dt;
      if (r.next <= 0) {
        r.next = rand(0.9, 1.6);
        const bad = Math.random() < cfg.badRate, gold = !bad && Math.random() < 0.12;
        const o = { x: r.v > 0 ? -0.08 : 1.08, y: r.y, v: r.v * (gold ? 1.6 : 1), bad, gold, el: document.createElement('button') };
        o.el.className = 'sh-obj';
        o.el.textContent = gold ? '🎯' : pick(bad ? cfg.bad : cfg.good);
        o.el.onpointerdown = (e) => {
          e.preventDefault(); e.stopPropagation();
          if (o.done || !shoot(true)) return;
          o.done = true;
          if (o.bad) { mgScore(-2); sfx('error'); shakeArena(); floatAt(o.el, 'Ой! −2', 'bad'); }
          else { mgScore(o.gold ? 3 : 1); sfx('coin'); floatAt(o.el, o.gold ? '+3' : '+1', 'good'); }
          o.el.classList.add('hit');
          setTimeout(() => o.el.remove(), 200);
        };
        arena.appendChild(o.el);
        objs.push(o);
      }
    });
    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i];
      o.x += o.v * dt;
      o.el.style.left = o.x * 100 + '%'; o.el.style.top = o.y * 100 + '%';
      if (o.x < -0.12 || o.x > 1.12) { o.el.remove(); objs.splice(i, 1); }
    }
  });
}

// ---------- Карманник: тяни, пока не смотрят ----------
function gameSneak(mg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="sn-scene"><div class="sn-man" id="snMan">🧍</div><div class="sn-eye" id="snEye"></div>
      <div class="sn-bar"><i id="snBar"></i></div><div class="sn-loot" id="snLoot"></div></div>
    <button class="btn primary wide mg-big" id="snBtn">🤏 Тянуть (держи)</button>`;
  let hold = false, prog = 0, state = 'away', timer = rand(1, 2.2), caughtAt = 0;
  const btn = $('snBtn');
  btn.onpointerdown = (e) => { e.preventDefault(); hold = true; };
  btn.onpointerup = btn.onpointerleave = btn.onpointercancel = () => { hold = false; };
  const setState = (s) => {
    state = s;
    $('snMan').textContent = s === 'look' ? '🧍‍♂️' : '🧍';
    $('snMan').className = 'sn-man ' + s;
    $('snEye').textContent = s === 'warn' ? '❗' : s === 'look' ? '👀' : '';
  };
  mgLoop(mg, (dt) => {
    timer -= dt;
    if (timer <= 0) {
      if (state === 'away') { setState('warn'); timer = 0.45; }
      else if (state === 'warn') { setState('look'); timer = rand(0.8, 1.5); }
      else { setState('away'); timer = rand(0.9, 2.2); }
    }
    if (hold && state === 'look' && Date.now() - caughtAt > 1200) {
      caughtAt = Date.now(); mg.mistakes = (mg.mistakes || 0) + 1; prog = 0; hold = false;
      sfx('error'); haptic('error'); shakeArena(); floatAt($('snMan'), 'Эй! Держи вора!', 'bad');
      if (mg.mistakes >= 3) { mgDelay(mg, mgEnd, 500); return; }
    }
    if (hold && state !== 'look') prog += dt * 0.65;
    if (prog >= 1) { prog = 0; mgScore(1); sfx('coin'); haptic('light'); $('snLoot').textContent += pick(['👛', '💳', '⌚', '📱']); floatAt($('snMan'), 'Есть!', 'good'); setState('away'); timer = rand(0.8, 1.8); }
    $('snBar').style.width = prog * 100 + '%';
  });
}

// ---------- Погоня: прыгай через препятствия ----------
function gameChase(mg, cfg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="cs2-ground"></div><div class="cs2-run" id="csRun">${cfg.player}</div><div class="cs2-cop">🚓</div>`;
  const run = $('csRun'), objs = [];
  let y = 0, vy = 0, next = 1;
  arena.onpointerdown = (e) => { e.preventDefault(); if (mgAlive(mg) && y <= 0.001) { vy = 1.55; sfx('whoosh'); } };
  mgLoop(mg, (dt) => {
    const t = mgElapsed(mg), sp = 0.48 + t * 0.012;
    vy -= 4.2 * dt; y = Math.max(0, y + vy * dt); if (y === 0) vy = Math.max(0, vy);
    run.style.bottom = `calc(22% + ${y * 160}px)`;
    next -= dt;
    if (next <= 0) {
      next = rand(0.9, 1.5) / (1 + t * 0.015);
      const money = Math.random() < 0.45;
      objs.push({ money, x: 1.08, h: money ? rand(0.08, 0.27) : 0, el: mgEl(arena, 'cs2-obj', pick(money ? cfg.good : cfg.bad)) });
    }
    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i];
      o.x -= sp * dt;
      o.el.style.left = o.x * 100 + '%'; o.el.style.bottom = `calc(22% + ${o.h * 160}px)`;
      if (!o.done && Math.abs(o.x - 0.2) < 0.05 && Math.abs(o.h - y) < 0.16) {
        o.done = true;
        if (o.money) { mgScore(1); sfx('coin'); o.el.remove(); }
        else { mgScore(-1); mg.mistakes = (mg.mistakes || 0) + 1; sfx('punch'); haptic('error'); shakeArena(); floatAt(run, 'Споткнулся!', 'bad'); }
      }
      if (!o.done && !o.money && o.x < 0.14) { o.done = true; mgScore(1); }
      if (o.x < -0.1) { o.el.remove(); objs.splice(i, 1); }
    }
  });
}

// ---------- Пикник: отгоняй ос и муравьёв от корзинки ----------
function gameDefend(mg, cfg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="df-food" id="dfFood">${cfg.food}</div>`;
  const objs = [];
  let next = 0.5;
  mgLoop(mg, (dt) => {
    const t = mgElapsed(mg);
    next -= dt;
    if (next <= 0) {
      next = Math.max(0.45, 1 - t * 0.025);
      const ang = Math.random() * Math.PI * 2;
      const o = { x: 0.5 + Math.cos(ang) * 0.62, y: 0.5 + Math.sin(ang) * 0.62, v: rand(0.14, 0.22) + t * 0.004, el: document.createElement('button') };
      o.el.className = 'df-bug';
      o.el.textContent = pick(cfg.bugs);
      o.el.onpointerdown = (e) => {
        e.preventDefault();
        if (o.done || !mgAlive(mg)) return;
        o.done = true; mgScore(1); sfx('punch'); haptic('light');
        o.el.classList.add('hit'); setTimeout(() => o.el.remove(), 200);
      };
      arena.appendChild(o.el);
      objs.push(o);
    }
    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i];
      if (o.done) { objs.splice(i, 1); continue; }
      const dx = 0.5 - o.x, dy = 0.5 - o.y, d = Math.hypot(dx, dy);
      o.x += (dx / d) * o.v * dt + Math.sin(t * 6 + i) * 0.002; o.y += (dy / d) * o.v * dt;
      o.el.style.left = o.x * 100 + '%'; o.el.style.top = o.y * 100 + '%';
      if (d < 0.07) { o.el.remove(); objs.splice(i, 1); mgScore(-1); sfx('error'); shakeArena(); floatAt($('dfFood'), cfg.lostText, 'bad'); }
    }
  });
}

// ---------- Зал: бег (чередуй ноги), жим (зажми и отпусти), груша (серии ударов) ----------
function gymReps(mg, cfg, onRep) {
  const dots = $('gyDots');
  let reps = 0, combo = 0;
  return (res) => {
    if (reps >= GYM_REPS) return;
    if (res === 'perfect') { combo++; mgScore(2 + (combo >= 3 ? 1 : 0)); sfx('crit'); haptic('medium'); }
    else if (res === 'good') { combo = 0; mgScore(1); sfx('gym'); haptic('light'); }
    else { combo = 0; sfx('error'); shakeArena(); }
    dots.children[reps].className = res;
    $('gyCombo').textContent = combo >= 2 ? `🔥 серия ${combo}` : '';
    $('gyIcon').animate([{ transform: 'scale(1)' }, { transform: `scale(${res === 'perfect' ? 1.3 : res === 'good' ? 1.1 : 0.9})` }, { transform: 'scale(1)' }], { duration: 260 });
    reps++;
    if (reps >= GYM_REPS) mgDelay(mg, mgEnd, 450);
    else if (onRep) onRep(reps);
  };
}
function gymFrame(cfg, inner) {
  return `<div class="gy-reps-wrap"><div class="gy-icon" id="gyIcon">${cfg.icon}</div>${inner}
    <div class="gy-dots" id="gyDots">${'<span></span>'.repeat(GYM_REPS)}</div><div class="gy-combo-txt" id="gyCombo"></div></div>`;
}

function gameRun(mg, cfg) {
  const arena = $('mgArena');
  const STEPS = 8;
  arena.innerHTML = gymFrame(cfg, '<div class="run-bar"><i id="runBar"></i></div><small class="run-t" id="runT">Беги! Чередуй ноги</small>') +
    '<div class="run-btns"><button class="btn primary" data-f="0">🦶 Левой</button><button class="btn primary" data-f="1">Правой 🦶</button></div>';
  let steps = 0, lastFoot = -1, t0 = 0;
  const rep = gymReps(mg, cfg, () => { steps = 0; lastFoot = -1; t0 = 0; $('runBar').style.width = '0'; });
  arena.querySelectorAll('[data-f]').forEach((b) => {
    b.onpointerdown = (e) => {
      e.preventDefault();
      if (!mgAlive(mg)) return;
      const f = +b.dataset.f;
      if (f === lastFoot) { sfx('error'); floatAt(b, 'Сбился с ноги!', 'bad'); steps = Math.max(0, steps - 2); }
      else { lastFoot = f; if (!t0) t0 = performance.now(); steps++; sfx('tap'); }
      $('runBar').style.width = (steps / STEPS) * 100 + '%';
      if (steps >= STEPS) {
        const sec = (performance.now() - t0) / 1000;
        $('runT').textContent = `Отрезок за ${sec.toFixed(1)} с`;
        rep(sec <= cfg.fast ? 'perfect' : sec <= cfg.ok ? 'good' : 'miss');
      }
    };
  });
}

function gameCharge(mg, cfg) {
  const arena = $('mgArena');
  arena.innerHTML = gymFrame(cfg, '<div class="chg-col"><div class="chg-zone" id="chgZone"></div><div class="chg-fill" id="chgFill"></div></div>') +
    '<button class="btn primary wide mg-big" id="chgBtn">🏋️ Зажми — отпусти в зоне</button>';
  let hold = false, v = 0, zone = 0.72, zh = 0.16, locked = false;
  const place = () => { $('chgZone').style.bottom = zone * 100 + '%'; $('chgZone').style.height = zh * 100 + '%'; };
  place();
  const rep = gymReps(mg, cfg, () => { zh = Math.max(0.08, zh * 0.88); zone = rand(0.45, 0.9 - zh); place(); });
  const btn = $('chgBtn');
  btn.onpointerdown = (e) => { e.preventDefault(); if (!locked && mgAlive(mg)) hold = true; };
  const release = () => {
    if (!hold || !mgAlive(mg)) return;
    hold = false;
    const c = zone + zh / 2;
    rep(Math.abs(v - c) < zh * 0.2 ? 'perfect' : v >= zone && v <= zone + zh ? 'good' : 'miss');
    locked = true;
    setTimeout(() => { v = 0; locked = false; }, 350);
  };
  btn.onpointerup = btn.onpointerleave = btn.onpointercancel = release;
  mgLoop(mg, (dt) => {
    if (hold) { v += dt * cfg.speed * (1 + v); if (v >= 1) { v = 0; hold = false; rep('miss'); floatAt(btn, 'Не удержал!', 'bad'); } }
    $('chgFill').style.height = v * 100 + '%';
  });
}

function gameCombo(mg, cfg) {
  const arena = $('mgArena');
  arena.innerHTML = gymFrame(cfg, '<div class="cmb-bag"><button data-s="0">👊</button><button data-s="1">🥊</button><button data-s="2">👊</button></div>');
  const pads = [...arena.querySelectorAll('[data-s]')];
  let seq = [], pos = 0, hits = 0, timer = null, window_ = cfg.window;
  const rep = gymReps(mg, cfg, () => { window_ = Math.max(380, window_ * 0.92); setTimeout(serie, 500); });
  const lit = () => {
    pads.forEach((p) => p.classList.remove('lit'));
    if (pos >= seq.length) { rep(hits === seq.length ? 'perfect' : hits >= 2 ? 'good' : 'miss'); return; }
    pads[seq[pos]].classList.add('lit');
    clearTimeout(timer);
    timer = setTimeout(() => { if (!mgAlive(mg)) return; pos++; lit(); }, window_);
    mg.timers.push(timer);
  };
  const serie = () => { if (!mgAlive(mg)) return; seq = Array.from({ length: 3 }, () => Math.floor(Math.random() * 3)); pos = 0; hits = 0; lit(); };
  pads.forEach((p, i) => {
    p.onpointerdown = (e) => {
      e.preventDefault();
      if (!mgAlive(mg) || pos >= seq.length) return;
      if (i === seq[pos]) { hits++; sfx('punch'); haptic('light'); p.animate([{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 160 }); }
      else { sfx('error'); }
      clearTimeout(timer); pos++; lit();
    };
  });
  setTimeout(serie, 300);
}

// ---------- Тюрьма: отжимания (тапай быстрее, чем устаёшь) ----------
// Раньше «Отжимания» вызывали несуществующую игру и зависали
function gamePress(mg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="pr-wrap"><div class="pr-man" id="prMan">🙇</div><div class="pr-bar"><i id="prBar"></i></div><div class="pr-n" id="prN">0</div></div>
    <button class="btn primary wide mg-big" id="prBtn">💪 Жми!</button>`;
  let v = 0, reps = 0;
  $('prBtn').onpointerdown = (e) => {
    e.preventDefault();
    if (!mgAlive(mg)) return;
    v += 0.11; sfx('tap');
    if (v >= 1) { v = 0; reps++; mgScore(1); sfx('gym'); haptic('medium'); $('prN').textContent = reps; $('prMan').animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-20px)' }, { transform: 'translateY(0)' }], { duration: 300 }); }
  };
  mgLoop(mg, (dt) => { v = Math.max(0, v - dt * (0.32 + reps * 0.05)); $('prBar').style.width = v * 100 + '%'; });
}

// ---------- Тюрьма: шей варежку по контуру ----------
function gameSew(mg) {
  const arena = $('mgArena');
  const pts = [[30, 80], [24, 55], [26, 30], [40, 16], [55, 22], [62, 40], [76, 38], [78, 55], [66, 72], [58, 82]];
  arena.innerHTML = `<div class="sew-cloth">${pts.map(([x, y], i) => `<button class="sew-dot" data-i="${i}" style="left:${x}%;top:${y}%"></button>`).join('')}<div class="sew-done" id="sewDone"></div></div>`;
  const dots = [...arena.querySelectorAll('.sew-dot')];
  let cur = 0, timer = null;
  const light = () => {
    dots.forEach((d, i) => { d.classList.toggle('lit', i === cur); d.classList.toggle('ok', i < cur); });
    clearTimeout(timer);
    const t = mgElapsed(mg);
    timer = setTimeout(() => { if (!mgAlive(mg)) return; mg.mistakes = (mg.mistakes || 0) + 1; sfx('error'); floatAt(dots[cur], 'Нитка порвалась!', 'bad'); cur = 0; light(); }, Math.max(700, 1400 - t * 25));
    mg.timers.push(timer);
  };
  dots.forEach((d, i) => {
    d.onpointerdown = (e) => {
      e.preventDefault();
      if (!mgAlive(mg)) return;
      if (i !== cur) { sfx('error'); shakeArena(); return; }
      sfx('tap'); cur++;
      if (cur >= dots.length) { mgScore(1); sfx('coin'); $('sewDone').textContent += '🧤'; cur = 0; }
      light();
    };
  });
  light();
}

// ---------- Тюрьма: побег — ползи, пока прожектор не на тебе ----------
function gameVent(mg) {
  const arena = $('mgArena');
  const R = 5;
  arena.innerHTML = `<div class="vt-rows">${Array.from({ length: R }, (_, i) => `<div class="vt-row" data-r="${i}"><i class="vt-beam"></i></div>`).join('')}</div>
    <div class="vt-me" id="vtMe">🏃</div><div class="vt-goal">🔑 Свобода</div>`;
  arena.insertAdjacentHTML('beforeend', '<button class="btn primary wide mg-big" id="vtBtn">⬆️ Ползти</button>');
  const beams = [...arena.querySelectorAll('.vt-beam')];
  let row = -1, t = 0, lvl = 0, nextStep = 0;
  const sp = () => beams.map((_, i) => 0.8 + i * 0.25 + lvl * 0.25);
  let speeds = sp();
  const ph = beams.map(() => Math.random() * 6);
  const beamX = (i) => 0.5 + Math.sin(t * speeds[i] + ph[i]) * 0.42;
  // Ряды занимают полосу от кнопки (64px) до надписи сверху (26px): по 42px на ряд
  const place = () => { $('vtMe').style.bottom = row < 0 ? '58px' : `${64 + (row + 0.5) * (arena.clientHeight - 90) / R - 15}px`; };
  const status = arena.querySelector('.vt-goal');
  const caught = () => {
    mg.mistakes = (mg.mistakes || 0) + 1;
    sfx('error'); haptic('error'); shakeArena();
    row = -1; nextStep = t + 0.7; place();
    if (mg.mistakes >= 3) { mgScore(-mg.score); mgEnd(); return; }
    status.textContent = `🚨 Засекли! Ошибки ${mg.mistakes}/3 · маршрут ${lvl}/2`;
  };
  place();
  mgLoop(mg, (dt) => {
    t += dt;
    beams.forEach((b, i) => { b.style.left = beamX(i) * 100 + '%'; });
    if (row >= 0 && Math.abs(beamX(row) - 0.5) < 0.09) {
      caught();
    }
  });
  $('vtBtn').onpointerdown = (e) => {
    e.preventDefault();
    if (!mgAlive(mg) || t < nextStep) return;
    if (row + 1 < R && Math.abs(beamX(row + 1) - 0.5) < 0.16) { caught(); return; }
    row++; nextStep = t + 0.45; sfx('whoosh');
    if (row >= R) {
      mgScore(6); sfx('coin'); row = -1; lvl++; speeds = sp();
      if (lvl >= 2) { mgEnd(); return; }
    }
    status.textContent = `🔑 Маршруты ${lvl}/2 · ряд ${row + 1}/5 · ошибки ${mg.mistakes || 0}/3`;
    place();
  };
}

// =====================================================================
// Кто во что играет
// =====================================================================

// Работы: engine — своя игра; type остаётся прежним, чтобы не сломать бонусы (дорога, ошибки в заказах)
Object.assign(JOB_GAMES.dvornik, { engine: gameSwipe, title: 'Отмой двор', hint: 'Води пальцем по грязи, пока она не исчезнет. Кота и бабушку не задевай!', dirt: ['🟤', '🍂', '🥤', '📰', '💩', '🫗'], bad: ['🐈', '👵'], target: 22 });
Object.assign(JOB_GAMES.guard, { engine: gameConveyor, title: 'Досмотр на входе', hint: 'Сумки едут через рентген. Хватай запрещённое 🔪🔫💣, обычные вещи не трогай. Пропустил — минус', bad: ['🔪', '🔫', '💣', '🧨'], good: ['👕', '📱', '🧴', '🍎', '📚', '🧸', '👟'], badRate: 0.4, target: 14 });
Object.assign(JOB_GAMES.police, { engine: gameLineup, title: 'Опознание', hint: 'Свидетель описал преступника: шапка, лицо и очки. Найди его среди четырёх', target: 14 });
Object.assign(JOB_GAMES.taxi, { engine: gameSteer, title: 'Ночной город', hint: 'Держи палец слева или справа, чтобы рулить. Не съезжай с дороги, подбирай пассажиров 🙋', good: ['🙋', '🙋‍♀️', '🧳'], target: 60 });
Object.assign(JOB_GAMES.cook, { engine: gameRecipe, title: 'Шаурма по рецепту', hint: 'Собирай строго по шагам — что подсвечено, то и клади. Ошибка — клиент злится',
  recipes: [['Классика', ['🫓', '🥩', '🥒', '🍅', '🧅']], ['Сырная', ['🫓', '🍗', '🧀', '🍅']], ['Острая', ['🫓', '🥩', '🌶️', '🧅', '🥬']], ['Курочка', ['🫓', '🍗', '🥬', '🥒']]], target: 8 });

startShiftGame = (function (orig) {
  return function (j, onFinish, titleExtra = '') {
    const base = JOB_GAMES[j.id];
    if (!base || !base.engine) { orig(j, onFinish, titleExtra); return; }
    const cfg = base.type === 'lanes' ? { ...base, player: roadPlayer(j) } : base;
    runGame({ title: `${j.emoji} ${cfg.title}${titleExtra}`, hint: cfg.hint, duration: cfg.duration === undefined ? 30 : cfg.duration, setup: (mg) => cfg.engine(mg, cfg), finish: onFinish });
  };
})(startShiftGame);

// Свидания
Object.assign(DATE_GAMES, {
  walk: { title: 'Прогулка: лови момент', hint: 'Води корзинкой: лови цветы и мороженое, уворачивайся от «подарков» голубей', duration: 15, max: 12,
    setup: (mg) => gameCatch(mg, { basket: '🧺', good: ['🌸', '💐', '🍦', '⭐', '🍬'], bad: ['💩', '🪨'], goodRate: 0.7, badText: 'Фу!' }) },
  yacht: { title: 'Яхта: фото на закате', hint: 'Жми «Снимок», когда дельфин или чайка в рамке. 8 кадров — сделай шедевр', duration: 0, max: 14,
    setup: (mg) => gamePhoto(mg, { shots: 8, good: ['🐬', '🐋', '🦩'], bad: ['🛥️', '🪼'] }) },
  amuse: { title: 'Тир в парке', hint: 'Стреляй по уткам 🦆. 🎯 — бонус. В мишек не попади! 12 патронов', duration: 0, max: 12,
    setup: (mg) => gameShooting(mg, { ammo: 12, good: ['🦆', '🦆', '🐤'], bad: ['🧸'], badRate: 0.2 }) },
  picnic: { title: 'Пикник: защити корзинку', hint: 'Тапай по осам и муравьям, пока они не добрались до еды', duration: 20, max: 16,
    setup: (mg) => gameDefend(mg, { food: '🧺', bugs: ['🐝', '🐜', '🪰', '🐝'], lostText: 'Утащили бутерброд!' }) },
  bowling: { title: 'Боулинг', hint: 'Сначала поймай направление, потом силу. Три броска — сбей больше кеглей', duration: 0, max: 26, setup: (mg) => gameBowling(mg) },
});
if (typeof DATE_GAME_ICON !== 'undefined') Object.assign(DATE_GAME_ICON, { walk: '🧺 лови корзинкой', yacht: '📸 фото на закате', amuse: '🦆 тир', picnic: '🐝 защити еду', bowling: '🎳 боулинг' });

// Дети
// Первый вариант — правильный, на экране они перемешиваются
const TEEN_WORDS = [['Как правильно?', ['Корова', 'Карова', 'Каров']], ['Как правильно?', ['Собака', 'Сабака', 'Собакка']], ['Как правильно?', ['Молоко', 'Малако', 'Молако']],
  ['Как правильно?', ['Извини', 'Извени', 'Извинни']], ['Как правильно?', ['Пожалуйста', 'Пожалуста', 'Пажалуйста']], ['Как правильно?', ['Их', 'Ихний', 'Ихня']],
  ['Столица Франции?', ['Париж', 'Лондон', 'Берлин']], ['Сколько материков?', ['Шесть', 'Пять', 'Девять']], ['Кто открыл Америку?', ['Колумб', 'Магеллан', 'Пётр I']],
  ['Сколько будет 9 × 7?', ['63', '56', '72']], ['Сколько сторон у шестиугольника?', ['6', '8', '5']], ['Самая длинная река России?', ['Лена', 'Волга', 'Москва-река']],
  ['Как правильно?', ['Звонит', 'Звонют', 'Звóнят']], ['Сколько будет 144 : 12?', ['12', '14', '11']]];
Object.assign(KID_GAMES, {
  baby: { title: 'Укачай малыша', hint: 'Зажимай «Качать» и отпускай — держи метку в зелёной полосе. Малыш засыпает, пока ты в ритме', duration: 15, max: 22,
    setup: (mg) => gameHold(mg, { icon: '😴', iconBad: '😭', btn: '🍼 Качать (держи)' }) },
  kid: { title: 'Прятки', hint: 'Малыш выглядывает из-за укрытий. Успей тапнуть, пока не спрятался!', duration: 15, max: 11,
    setup: (mg) => gameHide(mg, { spots: ['🌳', '🚗', '📦', '🛝', '🏠', '🗑️'], who: '🧒', decoy: ['🐈', '🐕'], hitText: 'Нашёл! 😆' }) },
  teen: { title: 'Помоги с домашкой', hint: 'Выбирай правильный ответ — сын проверяет тебя!', duration: 20, max: 8,
    setup: (mg) => lessonChoice(mg, () => { const [q, o] = pick(TEEN_WORDS); return { q, a: o[0], opts: shuffle(o), penalty: true }; }) },
});

// Дела с женой / девушкой
const _pg = (id) => PARTNER_GAMES.find((g) => g.id === id);
if (_pg('bags')) Object.assign(_pg('bags'), { title: 'Сложи покупки в пакет', hint: 'Жми, когда покупка над стопкой. Ровно — бонус, криво — стопка сужается', target: 9,
  setup: (mg) => gameStack(mg, { btn: '🛍️ Положить', items: ['🥫', '🧃', '🥛', '🧀', '🍞', '🥚', '🍫', '🧻'], base: '🛒', fail: 'Всё рассыпалось!' }) });
if (_pg('keys')) Object.assign(_pg('keys'), { title: 'Найди её ключи', hint: 'Ключи 🔑 где-то в этом бардаке. Найди как можно больше раз', duration: 15, target: 6,
  setup: (mg) => gameSpot(mg, { find: '🔑', junk: ['🧦', '👟', '📱', '🧸', '💄', '👜', '🧴', '🪮', '🕶️', '📦', '🧤', '🎀'] }) });
if (_pg('cook')) Object.assign(_pg('cook'), { title: 'Приготовь ужин', hint: 'Режь овощи на лету, пока не упали. Горящую сковородку 🔥 не трогай!', duration: 20, target: 14,
  setup: (mg) => gameChop(mg, { good: ['🥔', '🥕', '🧅', '🍅', '🥒', '🫑', '🍆'], bad: ['🔥'], badRate: 0.15, badText: 'Ай, горячо!' }) });

// Преступления
const _cr = (id) => CRIMES.find((c) => c.id === id);
if (_cr('pocket')) Object.assign(_cr('pocket').game, { title: 'Карманник', hint: 'Держи «Тянуть», пока прохожий отвернулся. Увидел ❗ — отпускай! Три раза попался — конец', duration: 15, max: 5, setup: (mg) => gameSneak(mg) });
if (_cr('pocket')) _cr('pocket').desc = 'Тяни кошелёк, пока не смотрят. Мелко, зато безопасно';
if (_cr('kiosk')) Object.assign(_cr('kiosk').game, { title: 'Погоня!', hint: 'Тапай, чтобы прыгать через препятствия. Хватай деньги 💰 в прыжке', duration: 20, max: 14,
  setup: (mg) => gameChase(mg, { player: '🏃', good: ['💰', '💵'], bad: ['🚧', '🛢️', '👮'] }) });

// Тюрьма
const _ja = (id) => JAIL_ACTS.find((a) => a.id === id);
if (_ja('pushups')) Object.assign(_ja('pushups').game, { hint: 'Тапай как можно чаще: полоска растёт от нажатий и падает, когда устаёшь. Полная — один повтор', max: 6, setup: (mg) => gamePress(mg) });
if (_ja('mittens')) Object.assign(_ja('mittens').game, { title: 'Швейный цех', hint: 'Шей по контуру: тапай по светящейся точке, пока нитка не порвалась. Весь контур — одна варежка', max: 4, setup: (mg) => gameSew(mg) });
if (_ja('escape')) Object.assign(_ja('escape').game, { title: 'Побег через вентиляцию', hint: 'Пройди 2 маршрута за 30 секунд. Нажатие — шаг вверх; между шагами 0,45 с. Жди, пока прожектор следующего ряда уйдёт от центра. На текущем ряду тоже нельзя оставаться под светом! Засекли — в начало маршрута; 3 ошибки — провал. После пятого ряда нажми ещё раз для выхода.', duration: 30, max: 12, setup: (mg) => gameVent(mg) });

// Зал: у каждого упражнения своя механика
Object.assign(GYM_GAMES.cardio, { engine: gameRun, title: 'Бег', hint: 'Чередуй «Левой» и «Правой» как можно быстрее. 8 шагов — один отрезок, всего 6', fast: 2.2, ok: 3.4 });
Object.assign(GYM_GAMES.power, { engine: gameCharge, title: 'Жим штанги', hint: 'Зажми кнопку — штанга идёт вверх всё быстрее. Отпусти в зелёной зоне. Передержал — уронил', speed: 0.9 });
Object.assign(GYM_GAMES.bag, { engine: gameCombo, title: 'Груша', hint: 'Бей туда, где загорелось. Три удара в серии, каждая серия быстрее', window: 750 });
gameReps = (function (orig) {
  return function (mg, cfg) { if (cfg.engine) cfg.engine(mg, cfg); else orig(mg, cfg); };
})(gameReps);

// Рыбалка: тапать без остановки больше нельзя — ранняя подсечка отпугивает рыбу
gameFishing = (function (orig) {
  return function (mg) {
    orig(mg);
    const btn = $('fsBtn'), base = btn.onpointerdown;
    let calm = 0;
    btn.onpointerdown = (e) => {
      if (Date.now() < calm) { e.preventDefault(); return; }
      const before = mg.score;
      const fl = $('fsFloat');
      const early = fl && !fl.classList.contains('dip');
      base(e);
      if (early) { mgScore(-1); calm = Date.now() + 900; floatAt(btn, 'Распугал рыбу!', 'bad'); }
      else if (mg.score === before) calm = Date.now() + 300;
    };
  };
})(gameFishing);
LEISURE_GAMES.fishing.run = gameFishing;
LEISURE_GAMES.fishing.hint = 'Жди, пока поплавок нырнёт, и сразу подсекай. Подсечёшь раньше — рыба уплывёт (−1)';

// Учёба: на MBA вместо примеров — выгодная сделка
const MBA_DEALS = () => {
  const a = Math.round(rand(2, 9)) * 10000, pa = pick([10, 15, 20, 25]);
  const b = Math.round(rand(2, 9)) * 10000, pb = pick([10, 15, 20, 25, 30]);
  const va = a * pa / 100, vb = b * pb / 100;
  if (va === vb) return MBA_DEALS();
  const A = `${fmt(a)} ₽ под ${pa}%`, B = `${fmt(b)} ₽ под ${pb}%`;
  return { q: 'Где прибыль больше?', a: va > vb ? A : B, opts: [A, B], penalty: true };
};
LESSON_GAMES[5] = { name: 'Выгодная сделка', type: 'deal', need: 9 };
startLessonGame = (function (orig) {
  return function (stage) {
    const lg = LESSON_GAMES[stage];
    if (!lg || lg.type !== 'deal') { orig(stage); return; }
    const need = Math.max(2, Math.round(lg.need * (hasEffect('t_focus') ? 0.75 : 1)));
    runGame({ title: `📖 ${lg.name}`, scoreLabel: ` / ${need}`, hint: `Сравни две сделки и выбери ту, где прибыль больше. Набери ${need} верных за ${LESSON_TIME} секунд`,
      duration: LESSON_TIME, setup: (mg) => lessonChoice(mg, MBA_DEALS), finish: (score) => finishLesson(stage, score, need) });
  };
})(startLessonGame);
