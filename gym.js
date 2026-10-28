// Спортзал: каждое упражнение — своя мини-игра, прирост формы и силы зависит от результата.
// Энергия и сытость видны прямо в зале; не хватает — кнопка подскажет, что делать.

EXERCISES.push({ id: 'bag', name: 'Боксёрская груша', emoji: '🥊', energy: 25, food: 12, fatigue: 25, form: 1, strength: 1.5, health: 1, mood: 4, desc: 'Сила и форма для драк' });

// Тренировка — один короткий «подход» из 6 повторений (~10 секунд): по полоске бегает метка,
// жми, когда она в зелёной зоне, в золотой середине — идеально. Серия идеальных даёт комбо.
// У каждого упражнения свой характер: скорость, ширина зоны и как она ведёт себя после повтора.
// Не хочется играть — «Быстрая тренировка»: без мини-игры, но только 70% прироста.
const GYM_REPS = 6;
const GYM_QUICK = 0.7;
const GYM_GAMES = {
  cardio: { title: 'Бег', icon: '🏃', hint: 'Метка бегает быстро, зона широкая. Жми в зелёном — держи темп!', speed: 1.5, zone: 0.26, grow: 0.12, move: true },
  power: { title: 'Жим штанги', icon: '🏋️', hint: 'Метка медленная, но зона узкая. Поймай момент — и штанга наверху!', speed: 0.8, zone: 0.16, grow: 0.08, move: false },
  stretch: { title: 'Растяжка', icon: '🧘', hint: 'Спокойно: метка плавная, зона широкая. Идеальные повторы снимают усталость', speed: 0.7, zone: 0.3, grow: 0.06, move: true },
  bag: { title: 'Груша', icon: '🥊', hint: 'После каждого удара зона прыгает в новое место. Бей точно!', speed: 1.2, zone: 0.2, grow: 0.1, move: true },
};
Object.values(GYM_GAMES).forEach((g) => { g.max = GYM_REPS * 2; });

function gameReps(mg, cfg) {
  const arena = $('mgArena');
  arena.innerHTML = `<div class="gy-reps-wrap"><div class="gy-icon" id="gyIcon">${cfg.icon}</div>
      <div class="gy-lane"><div class="gy-zone" id="gyZone"><i></i></div><div class="gy-mark" id="gyMark"></div></div>
      <div class="gy-dots" id="gyDots">${'<span></span>'.repeat(GYM_REPS)}</div><div class="gy-combo-txt" id="gyCombo"></div></div>
    <button class="btn primary wide mg-big" id="gyBtn">${cfg.icon} Повтор!</button>`;
  let pos = 0, dir = 1, last = performance.now(), speed = cfg.speed, reps = 0, combo = 0, zone = 0.5 - cfg.zone / 2, lock = false;
  const place = () => { $('gyZone').style.left = zone * 100 + '%'; $('gyZone').style.width = cfg.zone * 100 + '%'; };
  place();
  const loop = (now) => {
    if (!mgAlive(mg)) return;
    const dt = (now - last) / 1000; last = now;
    pos += dir * speed * dt;
    if (pos >= 1) { pos = 1; dir = -1; } else if (pos <= 0) { pos = 0; dir = 1; }
    $('gyMark').style.left = pos * 100 + '%';
    mg.raf = requestAnimationFrame(loop);
  };
  mg.raf = requestAnimationFrame(loop);
  $('gyBtn').onpointerdown = (e) => {
    e.preventDefault();
    if (!mgAlive(mg) || lock) return;
    const center = zone + cfg.zone / 2;
    const dot = $('gyDots').children[reps];
    let res;
    if (Math.abs(pos - center) <= cfg.zone * 0.17) res = 'perfect';
    else if (pos >= zone && pos <= zone + cfg.zone) res = 'good';
    else res = 'miss';
    if (res === 'perfect') {
      combo++;
      mgScore(2 + (combo >= 3 ? 1 : 0));
      sfx('crit'); haptic('medium');
      floatAt($('gyBtn'), combo >= 3 ? `Комбо ×${combo}!` : 'Идеально!', 'good');
    } else if (res === 'good') { combo = 0; mgScore(1); sfx('gym'); haptic('light'); floatAt($('gyBtn'), 'Хорошо', 'good'); }
    else { combo = 0; sfx('error'); shakeArena(); floatAt($('gyBtn'), 'Мимо', 'bad'); }
    dot.className = res;
    $('gyCombo').textContent = combo >= 2 ? `🔥 серия ${combo}` : '';
    $('gyIcon').animate([{ transform: 'translateY(0) scale(1)' }, { transform: `translateY(${res === 'miss' ? 4 : -14}px) scale(${res === 'perfect' ? 1.25 : 1.05})` }, { transform: 'translateY(0) scale(1)' }], { duration: 260 });
    reps++;
    if (reps >= GYM_REPS) { lock = true; mgDelay(mg, mgEnd, 450); return; }
    speed += cfg.speed * cfg.grow; // каждый повтор чуть быстрее
    if (cfg.move) { zone = rand(0.05, 0.95 - cfg.zone); place(); }
    lock = true; setTimeout(() => { lock = false; }, 160); // защита от двойного нажатия
  };
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
      <br>🎮 Подход — 6 повторов секунд на 10: жми в зелёной зоне, в золотой — идеально (до ×1.4). Некогда — ⚡ «Быстро»: без игры, ×${GYM_QUICK}.</div>
    ${EXERCISES.map((ex) => {
      const why = gymCheck(ex, g);
      const gains = joinFx([ex.form ? `до +${(ex.form * g.gain * 1.4).toFixed(1)} формы` : '', ex.strength ? `до +${(ex.strength * g.gain * 1.4).toFixed(1)} силы` : '', plus(ex.health, '❤️'), plus(ex.mood, '😊')]);
      return card({ thumb: ex.emoji, title: `${ex.name} <span class="tag-line">🎮 ${GYM_GAMES[ex.id].title}</span>`,
        desc: `${ex.desc}<br><b>${gains}</b><br>−${ex.energy} ⚡ · −${ex.food} 🍞 · усталость ${ex.fatigue > 0 ? '+' : ''}${ex.fatigue}`,
        btn: `<div class="btn-col"><button class="btn ${why ? '' : 'primary'}" data-act="gym" data-id="${ex.id}" ${why ? `disabled data-why="${why}"` : ''}>${g.price ? `<i class="ic" data-ic="coin"></i>${fmt(g.price)}` : '🎮 Подход'}</button>
          <button class="btn small" data-act="gymQuick" data-id="${ex.id}" ${why ? `disabled data-why="${why}"` : ''}>⚡ Быстро</button></div>` });
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
  runGame({ title: `${ex.emoji} ${gm.title}`, hint: gm.hint, duration: 0, setup: (mg) => gameReps(mg, gm), finish: (score) => finishWorkout(ex, g, score) });
};
// Без мини-игры: сразу результат, но прирост меньше
ACTIONS.gymQuick = (exId) => {
  const g = GYMS.find((x) => x.id === S.gymPlace) || GYMS[0];
  const ex = EXERCISES.find((x) => x.id === exId);
  const why = gymCheck(ex, g);
  if (why) { toast(why, 'bad'); return; }
  S.money -= g.price;
  S.energy -= ex.energy;
  feed(-ex.food);
  finishWorkout(ex, g, Math.round(GYM_GAMES[ex.id].max * GYM_QUICK));
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
