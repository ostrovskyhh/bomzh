// Спортзал: каждое упражнение — своя мини-игра, прирост формы и силы зависит от результата.
// Энергия и сытость видны прямо в зале; не хватает — кнопка подскажет, что делать.

EXERCISES.push({ id: 'bag', name: 'Боксёрская груша', emoji: '🥊', energy: 25, food: 12, fatigue: 25, form: 1, strength: 1.5, health: 1, mood: 4, desc: 'Сила и форма для драк' });

// Как называется и как играется каждое упражнение. max — счёт, который даёт 100% прироста
const GYM_GAMES = {
  cardio: { title: 'Бег в ритме', hint: 'Жми, когда сжимающееся кольцо совпадёт с кругом. Сбился — сбавил темп', max: 12, run: gameRhythm },
  power: { title: 'Жим штанги', hint: 'Быстро тапай, чтобы поднять штангу до верха. Остановишься — штанга опустится', max: 6, run: gamePress },
  stretch: { title: 'Растяжка', hint: 'Держи кнопку и отпусти, когда полоска в зелёной зоне. Перетянешь — больно', max: 8, run: gameStretch },
  bag: { title: 'Комбо на груше', hint: 'Повтори комбинацию ударов по порядку как можно быстрее', max: 8, run: gameCombo },
};

// ---------- Бег: ритм ----------
function gameRhythm(mg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="gy-ring-wrap"><div class="gy-target"></div><div class="gy-ring" id="gyRing"></div><div class="gy-runner">🏃</div></div>
    <button class="btn primary wide mg-big" id="gyBtn">👟 Шаг!</button>`;
  let start = performance.now(), period = 1100, beats = 0;
  const ring = $('gyRing');
  const loop = (now) => {
    if (!mgAlive(mg)) return;
    const t = ((now - start) % period) / period; // 0 → 1: кольцо сжимается от 2.2 до 0.6
    ring.style.transform = `translate(-50%, -50%) scale(${2.2 - t * 1.6})`;
    mg.raf = requestAnimationFrame(loop);
  };
  mg.raf = requestAnimationFrame(loop);
  $('gyBtn').onpointerdown = (e) => {
    e.preventDefault();
    if (!mgAlive(mg)) return;
    const t = ((performance.now() - start) % period) / period;
    const scale = 2.2 - t * 1.6, err = Math.abs(scale - 1);
    if (err < 0.12) { mgScore(2); sfx('crit'); floatAt($('gyBtn'), 'Идеально!', 'good'); }
    else if (err < 0.3) { mgScore(1); sfx('tap'); floatAt($('gyBtn'), 'Хорошо', 'good'); }
    else { sfx('error'); shakeArena(); floatAt($('gyBtn'), 'Сбился!', 'bad'); }
    beats++;
    period = Math.max(650, 1100 - beats * 30); // темп растёт
    start = performance.now() - period * 0.05;
  };
}

// ---------- Жим: быстрые тапы против веса ----------
function gamePress(mg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="gy-press"><div class="gy-bar-track"><div class="gy-bar-fill" id="gyFill"></div><div class="gy-barbell" id="gyBell">🏋️</div></div><div class="gy-reps" id="gyReps"></div></div>
    <button class="btn primary wide mg-big" id="gyBtn">💪 Жми!</button>`;
  let h = 0, last = performance.now(), weight = 0.38;
  const loop = (now) => {
    if (!mgAlive(mg)) return;
    const dt = (now - last) / 1000; last = now;
    h = Math.max(0, h - weight * dt);
    $('gyFill').style.height = h * 100 + '%';
    $('gyBell').style.bottom = `calc(${h * 100}% - 14px)`;
    mg.raf = requestAnimationFrame(loop);
  };
  mg.raf = requestAnimationFrame(loop);
  $('gyBtn').onpointerdown = (e) => {
    e.preventDefault();
    if (!mgAlive(mg)) return;
    h += 0.075 * (1 + S.strength / 200);
    haptic('light');
    if (h >= 1) {
      h = 0;
      weight += 0.06; // каждый повтор тяжелее
      mgScore(1);
      sfx('gym');
      $('gyReps').textContent += '🏋️';
      floatAt($('gyBtn'), 'Повтор!', 'good');
    }
  };
}

// ---------- Растяжка: держи и отпусти в зоне ----------
function gameStretch(mg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="gy-stretch"><div class="gy-st-track"><div class="gy-st-zone" id="gyZone"></div><div class="gy-st-fill" id="gyFill"></div></div><div class="gy-pose" id="gyPose">🙆</div></div>
    <button class="btn primary wide mg-big" id="gyBtn">Держи и тянись…</button>`;
  let holding = false, v = 0, last = performance.now(), tries = 0, zone = 0;
  const newZone = () => { zone = rand(0.45, 0.75); $('gyZone').style.left = zone * 100 + '%'; };
  newZone();
  const loop = (now) => {
    if (!mgAlive(mg)) return;
    const dt = (now - last) / 1000; last = now;
    if (holding) v = Math.min(1, v + dt * (0.45 + tries * 0.05));
    $('gyFill').style.width = v * 100 + '%';
    mg.raf = requestAnimationFrame(loop);
  };
  mg.raf = requestAnimationFrame(loop);
  const btn = $('gyBtn');
  btn.onpointerdown = (e) => { e.preventDefault(); if (mgAlive(mg)) { holding = true; v = 0; $('gyPose').textContent = '🧘'; } };
  const release = (e) => {
    if (!holding || !mgAlive(mg)) return;
    e.preventDefault();
    holding = false;
    const inZone = v >= zone && v <= zone + 0.15;
    if (inZone) { const perfect = Math.abs(v - (zone + 0.075)) < 0.03; mgScore(perfect ? 2 : 1); sfx(perfect ? 'crit' : 'good'); floatAt(btn, perfect ? 'Идеально!' : 'Хорошо', 'good'); }
    else if (v > zone + 0.15) { sfx('error'); shakeArena(); floatAt(btn, 'Перетянул!', 'bad'); }
    else { sfx('error'); floatAt(btn, 'Мало', 'bad'); }
    $('gyPose').textContent = '🙆';
    tries++;
    if (tries >= 5) setTimeout(mgEnd, 400); else newZone();
  };
  btn.onpointerup = release;
  btn.onpointerleave = release;
}

// ---------- Груша: повтори комбо ----------
function gameCombo(mg) {
  const arena = $('mgArena');
  const PUNCHES = [['⬅️', 'Левой'], ['➡️', 'Правой'], ['⬆️', 'Апперкот'], ['⬇️', 'По корпусу']];
  arena.innerHTML = `<div class="gy-combo"><div class="gy-bag" id="gyBag">🥊</div><div class="gy-seq" id="gySeq"></div></div>
    <div class="gy-pads">${PUNCHES.map(([e, n], i) => `<button class="btn" data-i="${i}">${e}<small>${n}</small></button>`).join('')}</div>`;
  let seq = [], pos = 0, len = 3;
  const show = () => { $('gySeq').innerHTML = seq.map((i, k) => `<span class="${k < pos ? 'ok' : ''}">${PUNCHES[i][0]}</span>`).join(''); };
  const next = () => { seq = Array.from({ length: len }, () => Math.floor(Math.random() * 4)); pos = 0; show(); };
  next();
  arena.querySelectorAll('.gy-pads .btn').forEach((b) => {
    b.onpointerdown = (e) => {
      e.preventDefault();
      if (!mgAlive(mg)) return;
      const i = +b.dataset.i;
      $('gyBag').animate([{ transform: 'rotate(0)' }, { transform: `rotate(${i === 0 ? 12 : i === 1 ? -12 : 0}deg) translateY(${i === 2 ? -10 : 4}px)` }, { transform: 'rotate(0)' }], { duration: 180 });
      if (i === seq[pos]) {
        pos++; sfx('punch'); show();
        if (pos >= seq.length) { mgScore(1); sfx('crit'); floatAt($('gyBag'), `Комбо ×${len}!`, 'good'); len = Math.min(6, len + 1); setTimeout(() => mgAlive(mg) && next(), 250); }
      } else { sfx('error'); shakeArena(); floatAt($('gyBag'), 'Сбился!', 'bad'); pos = 0; show(); }
    };
  });
}

// ---------- Вкладка зала ----------

function gymCheck(ex, g) {
  if (!reqOk(g.req)) return `Этот зал пока закрыт: ${reqList(g.req).filter((r) => !r.ok).map((r) => r.text).join(', ')}`;
  if (S.busy) return 'Валера сейчас занят';
  if (hasEffect('backpain')) return 'Сорвана спина — сначала купи мазь «Звёздочка» в аптеке';
  if (S.money < g.price) return `Не хватает ${fmt(g.price - S.money)} ₽ на вход`;
  if (S.energy < ex.energy) return `Не хватает энергии: нужно ${ex.energy} ⚡, есть ${Math.floor(S.energy)}. Поспи или выпей кофе`;
  if (S.food < ex.food) return `Голодный: нужно ${ex.food} 🍞 сытости. Поешь`;
  return '';
}

EXTRA_TABS.life.gym = () => {
  const g = GYMS.find((x) => x.id === S.gymPlace) || GYMS[0];
  const resting = Date.now() - S.lastGym > 10 * 60000 && (S.form > 0 || S.strength > 0);
  const low = S.energy < Math.min(...EXERCISES.map((e) => e.energy));
  return `<div class="info-card">
      ${meter('🏃 Форма — макс. здоровье и энергия', S.form, 100)}
      ${meter('💪 Сила — драки, физическая работа', S.strength, 100)}
      ${meter('🥵 Усталость мышц — выше 80 риск травмы', S.fatigue, 100, 70)}
      ${meter('⚡ Энергия', S.energy, maxEnergy(), 999)}
      <div style="margin-top:8px">Бонусы: <b>+${Math.floor(S.form)} к макс. здоровью</b>, <b>+${Math.floor(S.form / 2)} к макс. энергии</b>.
      ${resting ? '<br><b style="color:var(--red)">Давно не тренировался — форма и сила понемногу уходят.</b>' : ''} Усталость спадает на 2 в минуту.</div>
    </div>
    ${low ? `<div class="info-card warn">⚡ <b>Энергия кончилась</b> — тренироваться не на что. Поспи или выпей кофе.
      <div class="btn-row" style="margin-top:8px"><button class="btn primary small" data-act="energyFix" data-id="sleep">💤 Спать</button>${priceBtn('energyFix', 'coffee', 40, S.money >= 40, '☕ Кофе 40 ₽').replace('class="btn', 'class="btn small')}</div></div>` : ''}
    <div class="subhead">Где заниматься</div>
    <div class="places">${GYMS.map((x) => `<button class="${x.id === g.id ? 'on' : ''}" data-act="gymPlace" data-id="${x.id}" ${reqOk(x.req) ? '' : `disabled data-why="Нужно: ${reqList(x.req).filter((r) => !r.ok).map((r) => r.text).join(', ')}"`}>
      <span>${x.emoji}</span>${x.name}<small>${x.price ? fmt(x.price) + ' ₽' : 'бесплатно'} · до ${x.cap}</small></button>`).join('')}</div>
    <div class="info-card">${g.emoji} <b>${g.name}</b>: ${g.desc}. Прирост ×${g.gain}, потолок формы и силы — ${g.cap}.${hasEffect('protein') ? ' 🥛 Протеин: прирост +50%!' : ''}
      <br>🎮 Каждое упражнение — мини-игра: сыграл лучше — накачался больше (до ×1.4).</div>
    ${EXERCISES.map((ex) => {
      const why = gymCheck(ex, g);
      const gains = joinFx([ex.form ? `до +${(ex.form * g.gain * 1.4).toFixed(1)} формы` : '', ex.strength ? `до +${(ex.strength * g.gain * 1.4).toFixed(1)} силы` : '', plus(ex.health, '❤️'), plus(ex.mood, '😊')]);
      return card({ thumb: ex.emoji, title: `${ex.name} <span class="tag-line">🎮 ${GYM_GAMES[ex.id].title}</span>`,
        desc: `${ex.desc}<br><b>${gains}</b><br>−${ex.energy} ⚡ · −${ex.food} 🍞 · усталость ${ex.fatigue > 0 ? '+' : ''}${ex.fatigue}`,
        btn: `<button class="btn ${why ? '' : 'primary'}" data-act="gym" data-id="${ex.id}" ${why ? `disabled data-why="${why}"` : ''}>${g.price ? `<i class="ic" data-ic="coin"></i>${fmt(g.price)}` : 'Начать'}</button>` });
    }).join('')}
    ${hasEffect('backpain') ? '<div class="info-card warn">🦴 Сорвана спина — в зал нельзя. Купи мазь в аптеке.</div>' : ''}`;
};

ACTIONS.gym = (exId) => {
  const g = GYMS.find((x) => x.id === S.gymPlace) || GYMS[0];
  const ex = EXERCISES.find((x) => x.id === exId);
  const why = gymCheck(ex, g);
  if (why) { toast(why, 'bad'); return; }
  S.money -= g.price;
  S.energy -= ex.energy;
  feed(-ex.food);
  const gm = GYM_GAMES[ex.id];
  runGame({ title: `${ex.emoji} ${gm.title}`, hint: gm.hint, duration: ex.id === 'stretch' ? 0 : 20, setup: (mg) => gm.run(mg), finish: (score) => finishWorkout(ex, g, score) });
};

function finishWorkout(ex, g, score) {
  const perf = clamp(score / GYM_GAMES[ex.id].max, 0.3, 1.4);
  S.lastGym = Date.now();
  taskProgress('gym');
  addXp(XP.gym);
  const after = S.fatigue + ex.fatigue;
  if (ex.fatigue > 0 && after > 80 && Math.random() < (after - 70) / 40) {
    S.fatigue = Math.min(100, after);
    addEffect('backpain', 6);
    hurt(15);
    resultModal({ emoji: '🦴', rays: 'bad', title: 'Перестарался!', text: 'Мышцы не выдержали, хрустнуло в спине. −15 здоровья и сорванная спина на 6 минут. Мазь «Звёздочка» в аптеке поможет. В следующий раз делай растяжку и отдыхай!', btn: 'Ой' });
    sfx('bad');
    save();
    return;
  }
  const k = g.gain * mods().gain * perf;
  const gained = [];
  const grow = (stat, base, label, name) => {
    if (!base) return;
    if (S[stat] < g.cap) { const v = Math.min(g.cap - S[stat], base * k); S[stat] += v; gained.push(`+${v.toFixed(1)} ${label}`); }
    else gained.push(`${name} упёрлась в потолок этого зала (${g.cap}) — нужен зал получше`);
  };
  grow('form', ex.form, 'формы', 'Форма');
  grow('strength', ex.strength, 'силы', 'Сила');
  S.fatigue = clamp(ex.id === 'stretch' ? after - Math.round(10 * perf) : after, 0, 100);
  heal(ex.health);
  addMood(ex.mood);
  if (ex.id !== 'stretch') addEffect('pumped', 3);
  track('gymGame');
  const stars = perf >= 1 ? 3 : perf >= 0.6 ? 2 : 1;
  resultModal({ emoji: ['😮‍💨', '💪', '🔥'][stars - 1], title: `${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)} ${ex.name}`,
    text: `Результат ${score} (${Math.round(perf * 100)}%)<br>${gained.join(', ')}${S.fatigue > 70 ? '<br>🥵 Мышцы забиты — сделай растяжку или отдохни' : ''}`, btn: 'Ещё подход' });
  sfx(stars === 1 ? 'lose' : 'win');
  save();
}
