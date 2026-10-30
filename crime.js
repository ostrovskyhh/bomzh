// Криминал (тёмная дорожка): угоны, карманы на вокзале, ограбление ларька с погоней, подпольный покер.
// Каждое дело поднимает розыск ⭐. Поймали — взятка или тюрьма, где свои занятия: шить варежки, качаться, бежать.

const WANTED_MAX = 5;
const WANTED_DECAY = 30 * 60000; // минус звезда каждые 30 минут

function crimeOpen() { return (S.quest && S.quest.path === 'dark') || S.admin; }
function inJail() { return !!(S.busy && S.busy.type === 'jail'); }

HOOKS.tick.push(() => {
  if (!S.wanted) return;
  const now = Date.now();
  if (!S.wantedAt) S.wantedAt = now;
  if (now - S.wantedAt > WANTED_DECAY) { S.wanted = Math.max(0, S.wanted - 1); S.wantedAt = now; }
});

// Срок вышел — сообщаем
HOOKS.tick.push(() => {
  if (inJail()) { S.wasJail = true; return; }
  if (S.wasJail) { S.wasJail = false; toast('🔓 Срок вышел — ты на свободе. Веди себя хорошо… или хотя бы аккуратно', 'good'); sfx('good'); }
});

// Вкладка видна только на тёмной дорожке
HOOKS.hud.push(() => { const t = $('crimeTab'); if (t) t.classList.toggle('hidden', !crimeOpen()); });

function wantedStars() { return '⭐'.repeat(S.wanted || 0) + '☆'.repeat(WANTED_MAX - (S.wanted || 0)); }

// ---------- Мини-игра «Отмычка» ----------
function gameLockpick(mg) {
  const arena = $('mgArena');
  const pins = 4;
  arena.innerHTML = `<div class="lp-lock">${Array.from({ length: pins }, (_, i) => `<div class="lp-pin" id="lpPin${i}"><div class="lp-zone"></div><div class="lp-mark"></div></div>`).join('')}</div>
    <div class="lp-car" id="lpCar">🚗</div><button class="btn primary wide mg-big" id="lpBtn">🔓 Поддеть штифт</button>`;
  let cur = 0, pos = 0, dir = 1, last = performance.now();
  const zones = Array.from({ length: pins }, () => rand(0.15, 0.7));
  zones.forEach((z, i) => { const el = $('lpPin' + i).querySelector('.lp-zone'); el.style.bottom = z * 100 + '%'; });
  const loop = (now) => {
    if (!mgAlive(mg)) return;
    const dt = (now - last) / 1000; last = now;
    pos += dir * (0.9 + cur * 0.3) * dt;
    if (pos > 1) { pos = 1; dir = -1; } else if (pos < 0) { pos = 0; dir = 1; }
    const pin = $('lpPin' + cur);
    if (pin) pin.querySelector('.lp-mark').style.bottom = pos * 100 + '%';
    mg.raf = requestAnimationFrame(loop);
  };
  mg.raf = requestAnimationFrame(loop);
  $('lpBtn').onpointerdown = (e) => {
    e.preventDefault();
    if (!mgAlive(mg) || cur >= pins) return;
    const z = zones[cur];
    if (pos >= z && pos <= z + 0.18) {
      $('lpPin' + cur).classList.add('set');
      mgScore(1); sfx('chip'); haptic('light');
      cur++;
      if (cur >= pins) { $('lpCar').textContent = '🚗💨'; sfx('rocket'); mgDelay(mg, mgEnd, 500); }
    } else {
      mg.mistakes = (mg.mistakes || 0) + 1;
      sfx('error'); shakeArena(); haptic('error');
      floatAt($('lpBtn'), mg.mistakes >= 3 ? '🚨 Сигнализация!' : 'Сорвалось!', 'bad');
      if (mg.mistakes >= 3) mgDelay(mg, mgEnd, 400);
    }
  };
}

const CARS = [{ name: '«Жигули»', emoji: '🚗', value: 20000 }, { name: 'Иномарка', emoji: '🚙', value: 60000 }, { name: 'Внедорожник', emoji: '🛻', value: 150000 }];

const CRIMES = [
  { id: 'pocket', name: 'Карманник на вокзале', emoji: '👛', level: 3, energy: 15, wanted: 1, risk: 0.08, cd: 120,
    desc: 'Тапай по кошелькам, полицию не трогай. Мелко, зато безопасно',
    game: { title: 'Вокзал', hint: 'Тапай по кошелькам 👛, не трогай полицейских 👮', duration: 15, max: 14,
      setup: (mg) => gameTargets(mg, { good: ['👛', '💳', '⌚'], bad: ['👮', '👮‍♀️', '📷'], goodRate: 0.6, life: 950, every: 600 }) },
    reward: (perf) => Math.round((300 + level() * 80) * perf) },
  { id: 'kiosk', name: 'Ограбление ларька', emoji: '🏪', level: 6, energy: 25, wanted: 2, risk: 0.15, cd: 300,
    desc: 'Хватай кассу и уходи от погони',
    game: { title: 'Погоня!', hint: 'Собирай деньги 💰, уходи от полиции 🚓', duration: 20, max: 14, setup: (mg) => gameLanes(mg, { good: ['💰', '💵', '💰'], bad: ['🚓', '🚧', '👮'], player: '🏃', speed: 1.15, goodRate: 0.5 }) },
    reward: (perf) => Math.round((2000 + level() * 300) * perf) },
  { id: 'car', name: 'Угон машины', emoji: '🚗', level: 9, energy: 30, wanted: 2, risk: 0.18, cd: 600,
    desc: 'Вскрой замок отмычкой — 4 штифта. Три ошибки — сигнализация',
    game: { title: 'Отмычка', hint: 'Жми, когда метка в зелёной зоне штифта', duration: 0, max: 4, setup: (mg) => gameLockpick(mg) },
    reward: (perf, mg) => { if ((mg.mistakes || 0) >= 3) return 0; const c = pick(CARS); S.lastCar = c; return Math.round(c.value * (1 + level() * 0.04)); } },
];

function crimeCan(c) {
  if (S.busy) return inJail() ? 'Ты в тюрьме' : 'Валера занят';
  if (level() < c.level) return `Нужен ${c.level} уровень`;
  if (S.energy < c.energy) return `Нужно ${c.energy} ⚡`;
  if (cdLeft('crime_' + c.id) > 0) return 'Пока залечь на дно — слишком рано';
  return '';
}

function caught(c, perf) { return Math.random() < clamp(c.risk + (S.wanted || 0) * 0.06 - perf * 0.08, 0.03, 0.8); }

function doCrime(id) {
  const c = CRIMES.find((x) => x.id === id);
  if (!c) return;
  const why = crimeCan(c);
  if (why) { toast(why, 'bad'); return; }
  S.energy -= c.energy;
  setCd('crime_' + c.id, c.cd);
  const origin = city(); let settled = false;
  runGame({ title: `${c.emoji} ${c.game.title}`, hint: c.game.hint, duration: c.game.duration, setup: c.game.setup, finish: (score, mg) => {
    if (settled || city() !== origin) return;
    settled = true;
    const perf = clamp(score / c.game.max - (mg.mistakes || 0) * 0.05, 0, 1.2);
    const loot = c.quantityReward || perf > 0.15 ? c.reward(perf, mg) : 0;
    S.wanted = Math.min(WANTED_MAX, (S.wanted || 0) + c.wanted);
    S.wantedAt = Date.now();
    track('crime');
    if (caught(c, perf) || (c.id === 'car' && (mg.mistakes || 0) >= 3 && Math.random() < 0.6)) { police(c, loot); return; }
    if (!loot) { resultModal({ emoji: '😬', rays: 'bad', title: 'Не вышло', text: `Ушёл ни с чем. Розыск: ${wantedStars()}`, btn: 'Эх' }); sfx('lose'); save(); return; }
    const receipt = crimeAward72(c, loot, mg, origin); addXp(10);
    if (typeof dropCollectible === 'function' && Math.random() < 0.25) dropCollectible('crime');
    track('crimeOk');
    resultModal({ emoji: c.id === 'car' && S.lastCar ? S.lastCar.emoji : '💰', title: c.id === 'car' && S.lastCar ? `Угнал ${S.lastCar.name}!` : 'Дело сделано',
      text: `${receipt}<br>Розыск: ${wantedStars()}`, btn: 'Тсс…' });
    sfx('coin'); save();
  } });
}

// Задержание: взятка или срок
let ARREST = null;
function police(c, loot) {
  const bribe = Math.round(3000 + level() * 600 + (S.wanted || 0) * 2000);
  const mins = 15 + (S.wanted || 0) * 8;
  ARREST = { bribe, mins };
  sfx('bad'); haptic('error');
  openModal(`<div class="big-art"><div class="rays bad"></div><div class="big-emoji">🚓</div></div>
    <h3>Попался!</h3><p>Полиция взяла с поличным${loot ? ' — добыча этой попытки изъята. Склад сохранён' : ''}. Розыск ${wantedStars()}.</p>
    <div class="btns" style="flex-direction:column;gap:8px">
      ${priceBtn('arrestBribe', '', bribe, S.money >= bribe, `💼 Договориться · ${fmt(bribe)} ₽`).replace('class="btn', 'class="btn wide')}
      <button class="btn wide" data-act="arrestJail">⛓️ Отсидеть срок · ${mins} мин</button></div>`, { center: true, locked: true });
}

function goJail(mins) {
  S.busy = { type: 'jail', start: Date.now(), end: Date.now() + mins * 60000, id: 'jail' };
  S.wanted = 0;
  track('jail');
  renderScene();
  resultModal({ emoji: '⛓️', rays: 'bad', title: 'Тюрьма', text: `Срок: ${mins} минут. Работать и гулять нельзя, но в тюрьме есть чем заняться: шить варежки, качаться — или рискнуть и сбежать. Открой «Тюремный двор» на главном экране.`, btn: 'Эх…' });
}

// ---------- Тюрьма ----------
const JAIL_ACTS = [
  { id: 'mittens', name: 'Шить варежки', emoji: '🧤', desc: 'Собирай заказ. Платят копейки, но срок −2 мин',
    game: { title: 'Швейный цех', hint: 'Собери варежку по образцу', duration: 25, max: 6, setup: (mg) => gameOrders(mg, { items: ['🧶', '🧵', '🪡', '🧤', '✂️', '📏'], size: [2, 3] }) },
    done: (perf) => { const m = Math.round(150 * perf); addMoney(m); jailCut(2 * perf); return `+${m} ₽, срок −${Math.round(2 * perf)} мин`; } },
  { id: 'pushups', name: 'Отжимания в камере', emoji: '💪', desc: 'Сила растёт даже здесь',
    game: { title: 'Отжимания', hint: 'Быстро тапай, чтобы выжать повтор', duration: 15, max: 5, setup: (mg) => gamePress(mg) },
    done: (perf) => { const v = Math.min(100 - S.strength, 1.5 * perf); S.strength += v; return `+${v.toFixed(1)} силы`; } },
  { id: 'escape', name: 'Побег', emoji: '🕳️', desc: 'Удачно — свобода, но розыск ⭐⭐⭐⭐⭐. Провал — срок +10 мин',
    game: { title: 'Побег через вентиляцию', hint: 'Уходи от охраны 👮, собирай ключи 🔑', duration: 20, max: 12, setup: (mg) => gameLanes(mg, { good: ['🔑', '🔑', '🧱'], bad: ['👮', '🔦', '🐕'], player: '🏃', speed: 1.25, goodRate: 0.45 }) },
    done: (perf) => {
      if (perf >= 1) { S.busy = null; S.wanted = WANTED_MAX; S.wantedAt = Date.now(); track('escape'); confetti(50); return '🏃 Свобода! Но тебя ищет весь город — розыск на максимуме'; }
      jailCut(-10); return '🚨 Поймали в вентиляции. Срок +10 минут';
    } },
];
function jailCut(mins) { if (inJail()) S.busy.end = Math.max(Date.now() + 5000, S.busy.end - mins * 60000); }

function openJail() {
  if (!inJail()) return;
  const bribe = Math.round(2000 + level() * 400 + (S.busy.end - Date.now()) / 60000 * 150);
  openModal(`<h3>⛓️ Тюремный двор</h3><p>До освобождения: <b><span data-until="${S.busy.end}"></span></b></p>
    <div class="list">${JAIL_ACTS.map((a) => card({ thumb: a.emoji, title: a.name, desc: a.desc,
      btn: cdLeft('jail_' + a.id) > 0 ? timerBtn(S.cd['jail_' + a.id]) : `<button class="btn primary" data-act="jailAct" data-id="${a.id}">Начать</button>` })).join('')}
      ${card({ thumb: '💼', title: 'Подкупить надзирателя', desc: 'Выйти прямо сейчас', btn: priceBtn('jailBribe', '', bribe, S.money >= bribe, `${fmt(bribe)} ₽`) })}</div>
    <div class="btns"><button class="btn wide" data-act="close">Закрыть</button></div>`);
}

// На главном экране вместо «Спит» — «В тюрьме» и кнопка двора
HOOKS.hud.push(() => {
  if (!inJail()) return;
  const act = $('activity');
  if (!act || act.dataset.jail === String(S.busy.start)) { if ($('actLeft')) $('actLeft').textContent = `Осталось ${fmtTime((S.busy.end - Date.now()) / 1000)}`; return; }
  act.dataset.jail = String(S.busy.start);
  act.innerHTML = `<div class="big">⛓️</div><b>В тюрьме</b><small id="actLeft"></small><div class="progress"><div id="actBar"></div></div>
    <button class="btn primary" data-act="openJail">🔒 Тюремный двор</button>`;
});

// ---------- Подпольный покер: три карты против крупье ----------
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS_P = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'В', 'Д', 'К', 'Т'];
function deck3() { const d = []; for (let r = 0; r < 13; r++) for (const s of SUITS) d.push({ r, s }); return shuffle(d); }
// Сила руки: [категория, старшие карты…]. 5 — стрит-флеш, 4 — тройка, 3 — стрит, 2 — флеш, 1 — пара, 0 — старшая
function handRank(h) {
  const rs = h.map((c) => c.r).sort((a, b) => b - a);
  const flush = h.every((c) => c.s === h[0].s);
  const straight = (rs[0] - rs[1] === 1 && rs[1] - rs[2] === 1) || (rs[0] === 12 && rs[1] === 1 && rs[2] === 0);
  if (straight && flush) return [5, rs[0]];
  if (rs[0] === rs[2]) return [4, rs[0]];
  if (straight) return [3, rs[0]];
  if (flush) return [2, ...rs];
  if (rs[0] === rs[1] || rs[1] === rs[2]) { const p = rs[1]; return [1, p, rs[0] === p ? rs[2] : rs[0]]; }
  return [0, ...rs];
}
const HAND_NAMES = ['Старшая карта', 'Пара', 'Флеш', 'Стрит', 'Тройка', 'Стрит-флеш'];
function cmpHands(a, b) { for (let i = 0; i < Math.max(a.length, b.length); i++) { if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0); } return 0; }
function cardHTML(c, hidden) { return hidden ? '<div class="pk-card back">🂠</div>' : `<div class="pk-card ${c.s === '♥' || c.s === '♦' ? 'red' : ''}">${RANKS_P[c.r]}<i>${c.s}</i></div>`; }

const POKER_BETS = [1000, 5000, 20000];
let POKER = null;

function pokerDeal(bet) {
  if (S.money < bet * 2) { toast(`Нужно ${fmt(bet * 2)} ₽: анте и ставка на игру`, 'bad'); return; }
  S.money -= bet;
  const d = deck3();
  POKER = { bet, me: [d[0], d[1], d[2]], dealer: [d[3], d[4], d[5]] };
  track('poker');
  const r = handRank(POKER.me);
  sfx('card');
  openModal(`<div class="pk"><div class="pk-title">🃏 Подпольный покер · анте ${fmt(bet)} ₽</div>
      <div class="pk-row"><small>Крупье Жора</small><div class="pk-hand">${POKER.dealer.map((c) => cardHTML(c, true)).join('')}</div></div>
      <div class="pk-row"><small>Ты: <b>${HAND_NAMES[r[0]]}</b></small><div class="pk-hand">${POKER.me.map((c) => cardHTML(c)).join('')}</div></div>
      <p class="mg-hint">Играть — поставить ещё ${fmt(bet)} ₽. Крупье «играет» с дамы и старше. Сбросить — потерять анте.</p>
      <div class="btns"><button class="btn primary" data-act="pokerPlay">Играть · ${fmt(bet)} ₽</button><button class="btn" data-act="pokerFold">Сбросить</button></div></div>`, { center: true, locked: true });
}

function pokerFinish(play) {
  const p = POKER;
  if (!p) return;
  POKER = null;
  let text, win = 0;
  const me = handRank(p.me), dl = handRank(p.dealer);
  if (!play) text = 'Сбросил. Анте ушло крупье.';
  else {
    S.money -= p.bet;
    const qualifies = dl[0] > 0 || dl[1] >= 10; // дама и выше
    if (!qualifies) { win = p.bet * 3; text = 'У крупье нет даже дамы — он не играет. Анте ×2, ставка возвращается.'; }
    else {
      const c = cmpHands(me, dl);
      const bonus = me[0] >= 4 ? 4 : me[0] === 3 ? 2 : 1; // бонус за сильную руку
      if (c > 0) { win = p.bet * 2 + p.bet * 2 * bonus; text = `Твоя ${HAND_NAMES[me[0]]} бьёт ${HAND_NAMES[dl[0]].toLowerCase()} крупье!${bonus > 1 ? ` Бонус ×${bonus}` : ''}`; }
      else if (c === 0) { win = p.bet * 2; text = 'Ничья — ставки вернулись'; }
      else text = `${HAND_NAMES[dl[0]]} у крупье сильнее.`;
    }
  }
  if (win) addMoney(win);
  // Облава
  const raid = Math.random() < 0.05;
  if (raid) { S.wanted = Math.min(WANTED_MAX, (S.wanted || 0) + 1); S.wantedAt = Date.now(); }
  const net = win - p.bet * (play ? 2 : 1);
  closeModal();
  resultModal({ emoji: net > 0 ? '🤑' : net === 0 ? '🤝' : '🃏', rays: net < 0 ? 'bad' : '', title: net > 0 ? `+${fmt(net)} ₽` : net === 0 ? 'При своих' : `${fmt(net)} ₽`,
    text: `<div class="pk-hand small">${p.dealer.map((c) => cardHTML(c)).join('')}</div><small>Крупье: ${HAND_NAMES[dl[0]]}</small><br>${text}${raid ? '<br>🚨 Облава! Еле ушёл через чёрный ход. Розыск +1' : ''}`, btn: 'Ещё раздачу' });
  sfx(net > 0 ? 'win' : 'lose');
  if (net > 0) track('pokerWin');
  save();
}

// ---------- Вкладка ----------
EXTRA_TABS.fun.crime = () => {
  if (!crimeOpen()) return '<div class="info-card">🕶️ Криминальный мир открыт только тем, кто выбрал тёмную дорожку в сюжете.</div>';
  return `<div class="premium-hero crime-hero"><div class="e">🕶️</div><div><b>Криминал · розыск ${wantedStars()}</b>
      <p>Быстрые деньги с риском. Чем выше розыск, тем вероятнее попасться. Звезда уходит каждые 30 минут.</p></div></div>
    ${inJail() ? '<button class="btn primary wide" data-act="openJail">⛓️ Ты в тюрьме — тюремный двор</button>' : ''}
    <div class="subhead">Дела</div>
    ${CRIMES.map((c) => { const why = crimeCan(c); const ok = level() >= c.level; return card({ thumb: c.emoji, title: c.name, cls: ok ? '' : 'locked',
      desc: `${c.desc}<br>−${c.energy} ⚡ · розыск +${c.wanted} ⭐ · риск ~${Math.round((c.risk + (S.wanted || 0) * 0.06) * 100)}%`,
      extra: ok ? '' : reqHTML({ level: c.level }), btn: `<button class="btn ${why ? '' : 'primary'}" data-act="crime" data-id="${c.id}" ${why ? `disabled data-why="${why}"` : ''}>${cdLeft('crime_' + c.id) > 0 ? `<span data-until="${S.cd['crime_' + c.id]}"></span>` : 'На дело'}</button>` }); }).join('')}
    <div class="subhead">🃏 Подпольный покер · три карты</div>
    <div class="info-card">Три карты тебе и крупье. Сильнее рука — забираешь. Стрит ×2, тройка и стрит-флеш ×4 к выигрышу. Иногда бывают облавы.</div>
    ${POKER_BETS.map((b) => card({ thumb: '🃏', title: `Стол ${fmt(b)} ₽`, desc: `Анте ${fmt(b)} ₽ + ставка ${fmt(b)} ₽`,
      btn: inJail() ? '<button class="btn" disabled data-why="Ты в тюрьме">⛓️</button>' : priceBtn('pokerDeal', b, b * 2, S.money >= b * 2, 'Сесть') })).join('')}`;
};

Object.assign(ACTIONS, {
  crime: (id) => doCrime(id),
  arrestBribe: () => { if (!ARREST || S.money < ARREST.bribe) return; S.money -= ARREST.bribe; S.wanted = Math.max(0, S.wanted - 2); ARREST = null; closeModal(); toast('💼 «Ничего не видели». Розыск −2', 'good'); },
  arrestJail: () => { if (!ARREST) return; const m = ARREST.mins; ARREST = null; closeModal(); goJail(m); },
  openJail: () => openJail(),
  jailAct: (id) => {
    const a = JAIL_ACTS.find((x) => x.id === id);
    if (!inJail() || cdLeft('jail_' + id) > 0) return;
    setCd('jail_' + id, id === 'escape' ? 300 : 90);
    runGame({ title: `${a.emoji} ${a.game.title}`, hint: a.game.hint, duration: a.game.duration, setup: a.game.setup, finish: (score) => {
      const res = a.done(clamp(score / a.game.max, 0, 1.2));
      resultModal({ emoji: a.emoji, title: a.name, text: res, btn: 'Ок' });
      save();
    } });
  },
  jailBribe: () => {
    if (!inJail()) return;
    const bribe = Math.round(2000 + level() * 400 + (S.busy.end - Date.now()) / 60000 * 150);
    if (S.money < bribe) return;
    S.money -= bribe; S.busy = null; closeModal();
    toast('🔓 Надзиратель «потерял» ключи. Ты на свободе', 'good');
  },
  pokerDeal: (b) => pokerDeal(+b),
  pokerPlay: () => pokerFinish(true),
  pokerFold: () => pokerFinish(false),
});
