// 5.28 · Поздняя игра: награды от дохода, фонд района, недельные испытания, дубли и заказы коллекционера.

// Недельная цепочка больше не отстаёт от дохода: сумма растёт вместе с жильём и курсом.
function weeklyMoneyOld528(r) { return Math.round(r.money * (1 + level() * 0.2)); }
function weeklyMoney528(r) { return Math.max(weeklyMoneyOld528(r), Math.round(r.money * scale() / 8)); }
weeklyReward = (function (orig) {
  return (r) => (r.money ? orig(r).replace(`${fmt(weeklyMoneyOld528(r))} ₽`, `${fmt(weeklyMoney528(r))} ₽`) : orig(r));
})(weeklyReward);
ACTIONS.weeklyClaim = (function (orig) {
  return () => {
    if (!weeklyReady()) return orig();
    const s = WEEKLY[weeklyState().step];
    const extra = s.reward.money ? weeklyMoney528(s.reward) - weeklyMoneyOld528(s.reward) : 0;
    orig();
    if (extra > 0) addMoney(extra);
  };
})(ACTIONS.weeklyClaim);

// ---------- Фонд района: большие траты с заметным результатом ----------
const FUND_528 = [
  { id: 'lamps', emoji: '💡', name: 'Фонари во дворе', k: 300, bonus: 'Милостыня +3% навсегда', mods: { pity: 1.03 }, done: 'Баба Зина вышла вечером во двор первый раз с прошлой зимы. Говорит, теперь видно, кто чем занят, и это прекрасно.' },
  { id: 'canteen', emoji: '🍲', name: 'Бесплатная столовая', k: 800, bonus: 'Тапы +3% навсегда', mods: { tap: 1.03 }, done: 'Михалыч занял столик у окна и объявил его своим. Кормят гречкой. Очередь уважает твоё имя.' },
  { id: 'court', emoji: '🏀', name: 'Спортплощадка', k: 2000, bonus: 'Работа +3% навсегда', mods: { work: 1.03 }, done: 'Пацаны с третьего подъезда больше не сидят на гаражах. Теперь они бегают вокруг гаражей. Прогресс.' },
  { id: 'shelter', emoji: '🐾', name: 'Приют для бездомных', k: 5000, bonus: 'Энергия восстанавливается на 5% быстрее', mods: { regen: 1.05 }, done: 'Койки, горячий душ, кот при входе. Ты знаешь, сколько стоит такая ночь, и поэтому здесь её не считают.' },
  { id: 'clinic', emoji: '🏥', name: 'Народная поликлиника', k: 12000, bonus: 'Курс обменника +3% навсегда', mods: { rate: 1.03 }, done: 'На двери табличка: «Принимаем всех». Врач спросил, не родственник ли ты тому самому Валере. Ты промолчал.' },
  { id: 'statue', emoji: '🗿', name: 'Памятник пустой бутылке', k: 30000, bonus: 'Район полностью отстроен · 25 крышек', caps: 25, done: 'На открытии плакал только Михалыч. Утверждает, что от ветра. Ветра не было.' },
];
function fundState528() { return S.fund528 || (S.fund528 = {}); }
function fundCost528(p) { return Math.round(p.k * capRate()); }
function fundNext528() { return FUND_528.find((p) => !fundState528()[p.id]); }
HOOKS.mods.push((m) => {
  const f = S.fund528;
  if (!f) return;
  FUND_528.forEach((p) => { if (f[p.id] && p.mods) for (const k in p.mods) m[k] *= p.mods[k]; });
});
ADVICE.push({ id: 'fund528', cond: () => { const p = S.storySeen && level() >= 12 && fundNext528(); return !!p && S.money >= fundCost528(p); }, get t() { const p = fundNext528(); return p ? `${p.emoji} Денег хватает на «${p.name}». Район ждёт: Задания → Район` : ''; } });
function fundHTML528() {
  const f = fundState528(), built = FUND_528.filter((p) => f[p.id]).length, next = fundNext528();
  return `<div class="subhead">Фонд района · ${built} из ${FUND_528.length}</div>
    <div class="info-card">Деньги в банке никого не греют. Здесь они становятся двором, в котором хочется жить. Стройка идёт по порядку, сделанное остаётся навсегда и переходит на новый круг.</div>
    ${FUND_528.map((p) => {
      if (f[p.id]) return card({ thumb: p.emoji, title: `✅ ${p.name}`, desc: p.bonus });
      const cost = fundCost528(p), isNext = next && next.id === p.id;
      return card({ thumb: p.emoji, title: p.name, cls: isNext ? '' : 'locked', desc: `${p.bonus}<br>Стоимость: <b>${fmt(cost)} ₽</b>`, btn: isNext ? priceBtn('fund528', p.id, cost, S.money >= cost, 'Вложиться') : lockBtn });
    }).join('')}`;
}
ACTIONS.fund528 = (id) => {
  const p = FUND_528.find((x) => x.id === id);
  if (!p || p !== fundNext528()) return;
  const cost = fundCost528(p);
  if (S.money < cost) { toast('Не хватает денег', 'bad'); return; }
  S.money -= cost;
  fundState528()[p.id] = Date.now();
  if (p.caps) addCaps(p.caps);
  track('fund528'); confetti(80); sfx('ach'); save();
  resultModal({ emoji: p.emoji, title: `${p.name}: готово`, text: `${p.done}<br><br><b>${p.bonus}</b>`, btn: 'Отлично' });
  renderCurrent(false);
};
// Отстроенный район переживает новый круг.
prestigeProfile = (function (orig) {
  return (...a) => { const r = orig(...a); if (r && S.fund528) r.fund528 = S.fund528; return r; };
})(prestigeProfile);

// ---------- Испытания недели: у каждой недели своя тройка заданий ----------
const TRIALS_528 = [
  { key: 'shift', goal: 40, text: 'Отработай 40 смен' },
  { key: 'trash', goal: 150, text: 'Обыщи 150 мусорок' },
  { key: 'events', goal: 40, text: 'Переживи 40 уличных событий' },
  { key: 'fightWin', goal: 15, text: 'Выиграй 15 боёв' },
  { key: 'gymGame', goal: 20, text: 'Проведи 20 тренировок' },
  { key: 'bizCollect', goal: 25, text: 'Собери кассу бизнеса 25 раз', ok: () => S.housing >= 2 },
  { key: 'crimeOk', goal: 12, text: 'Проверни 12 удачных дел', ok: () => !honestOn528() },
  { key: 'leisureGame', goal: 15, text: 'Отдохни 15 раз' },
  { key: 'petWalk', goal: 10, text: 'Погуляй с питомцем 10 раз', ok: () => (S.pets || []).length > 0 },
  { key: 'sideDone', goal: 6, text: 'Закрой 6 побочных дел' },
  { key: 'familyCare', goal: 8, text: 'Удели время семье 8 раз', ok: () => !!S.partner },
];
function honestOn528() { return typeof honestOpt === 'function' && honestOpt(); }
function trials528() {
  const w = weekId();
  if (!S.trials528 || S.trials528.week !== w) {
    const pool = TRIALS_528.filter((t) => !t.ok || t.ok());
    let seed = hashStr(`trial${w}`) >>> 0;
    const list = [];
    while (list.length < 3 && pool.length) {
      seed = (seed * 31 + 7) >>> 0;
      const t = pool.splice(seed % pool.length, 1)[0];
      list.push({ key: t.key, base: counter(t.key), done: false });
    }
    S.trials528 = { week: w, list };
  }
  return S.trials528;
}
function trialPrize528() { return Math.round(25 * capRate()); }
function trialsHTML528() {
  if (level() < 10) return '<div class="info-card">🏅 Испытания недели откроются с 10 уровня.</div>';
  const st = trials528();
  return `<div class="subhead">Испытания недели</div>
    ${st.list.map((x) => {
      const t = TRIALS_528.find((y) => y.key === x.key);
      if (!t) return '';
      const p = Math.min(t.goal, counter(x.key) - x.base);
      return card({ thumb: x.done ? '✅' : '🏅', title: t.text, desc: `${fmt(p)} / ${fmt(t.goal)} · награда ${fmt(trialPrize528())} ₽ и 4 🟡`,
        btn: x.done ? '' : p >= t.goal ? `<button class="btn green" data-act="trial528" data-id="${x.key}">Забрать</button>` : '' });
    }).join('')}
    <small class="weekly-note">Новые испытания через ${fmtTime((weekEnds() - Date.now()) / 1000)}.</small>`;
}
ACTIONS.trial528 = (key) => {
  const x = trials528().list.find((y) => y.key === key), t = TRIALS_528.find((y) => y.key === key);
  if (!x || !t || x.done || counter(key) - x.base < t.goal) return;
  x.done = true;
  const m = trialPrize528();
  addMoney(m); addCaps(4); sfx('coin'); save();
  toast(`🏅 Испытание пройдено: +${fmt(m)} ₽ и 4 🟡`, 'good');
  renderCurrent(false);
};
EXTRA_TABS.tasks.district528 = () => `<div class="premium-hero"><div class="e">🏘️</div><div><b>Твой район</b><p>Цели на месяцы вперёд, когда денег уже больше, чем дел.</p></div></div>${districtGoal529()}${mentorBox531()}${trialsHTML528()}${fundHTML528()}`;

// ---------- Дубли и заказы коллекционера ----------
const DUP_SWAP_528 = 5;
const ORDERS_528 = [
  { id: 'small', n: 1, emoji: '📮', name: 'Просьба школьника', k: 15, caps: 0 },
  { id: 'mid', n: 3, emoji: '🧳', name: 'Заказ антиквара', k: 40, caps: 3 },
  { id: 'big', n: 6, emoji: '🎩', name: 'Заказ столичного коллекционера', k: 100, caps: 6 },
];
dropCollectible = (function (orig) {
  return () => {
    const had = Object.keys(S.coll || {}).length;
    orig();
    if (Object.keys(S.coll || {}).length === had) S.dups528 = (S.dups528 || 0) + 1;
  };
})(dropCollectible);
function orders528() {
  const w = weekId();
  if (!S.orders528 || S.orders528.week !== w) S.orders528 = { week: w, done: {} };
  return S.orders528;
}
function dupMissing528() {
  const out = [];
  COLLECTIONS.forEach((set) => set.items.forEach(([id, name, emoji]) => { if (!collHas(id)) out.push({ set, id, name, emoji }); }));
  return out;
}
function dupsHTML528() {
  const dups = S.dups528 || 0, missing = dupMissing528(), o = orders528();
  return `<div class="subhead">Дубли и заказы · у тебя ${dups} 🧩</div>
    <div class="info-card">Каждая повторная редкость теперь идёт ещё и в запас. Шнырь по-прежнему платит за неё сразу.</div>
    ${missing.length ? card({ thumb: '🔁', title: 'Обмен у Шныря', desc: `${DUP_SWAP_528} дублей на недостающую редкость. Осталось найти: ${missing.length}`, btn: `<button class="btn ${dups >= DUP_SWAP_528 ? 'primary' : ''}" data-act="dupSwap528" ${dups >= DUP_SWAP_528 ? '' : `disabled data-why="Нужно ${DUP_SWAP_528} дублей"`}>Обменять</button>` }) : ''}
    ${ORDERS_528.map((x) => {
      const sum = Math.round(x.k * capRate());
      return card({ thumb: x.emoji, title: x.name, desc: `Отдать ${x.n} 🧩 · ${fmt(sum)} ₽${x.caps ? ` и ${x.caps} 🟡` : ''}`,
        btn: o.done[x.id] ? '<small>✅ на этой неделе</small>' : `<button class="btn ${dups >= x.n ? 'green' : ''}" data-act="order528" data-id="${x.id}" ${dups >= x.n ? '' : `disabled data-why="Нужно ${x.n} дублей"`}>Отдать</button>` });
    }).join('')}`;
}
EXTRA_TABS.tasks.coll = (function (orig) { return () => orig() + dupsHTML528(); })(EXTRA_TABS.tasks.coll);
ACTIONS.dupSwap528 = () => {
  const list = dupMissing528();
  if ((S.dups528 || 0) < DUP_SWAP_528 || !list.length) return;
  const it = pick(list);
  S.dups528 -= DUP_SWAP_528;
  S.coll[it.id] = Date.now();
  track('collectible');
  if (collDone(it.set)) {
    addCaps(3); track('collectionDone'); confetti(100); sfx('ach');
    resultModal({ emoji: it.set.emoji, title: `Коллекция собрана: ${it.set.name}!`, text: `+3 крышки и бонус навсегда: <b>${it.set.bonus}</b>`, btn: 'Ура!' });
  } else toast(`${it.emoji} Шнырь отдал: ${it.name} (${it.set.name})`, 'good');
  save(); renderCurrent(false);
};
ACTIONS.order528 = (id) => {
  const x = ORDERS_528.find((y) => y.id === id), o = orders528();
  if (!x || o.done[id] || (S.dups528 || 0) < x.n) return;
  S.dups528 -= x.n; o.done[id] = 1;
  const sum = Math.round(x.k * capRate());
  addMoney(sum);
  if (x.caps) addCaps(x.caps);
  sfx('coin'); save();
  toast(`${x.emoji} ${x.name}: +${fmt(sum)} ₽${x.caps ? ` и ${x.caps} 🟡` : ''}`, 'good');
  renderCurrent(false);
};
