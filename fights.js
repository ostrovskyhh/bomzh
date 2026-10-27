// PvP-драки. Пока у игры нет сервера, соперники — сгенерированные бойцы твоего уровня
// (у каждого свои статы, одежда, рейтинг и стиль боя). С сервером их заменят реальные игроки — механика та же.

const FIGHT_LEVEL = 2;
const FIGHT_COST = { energy: 20, food: 8 };
const FIGHT_CD = 60; // секунд между драками
const RIVALS_REFRESH = 10 * 60000;
const LEAGUES = [
  { name: 'Дворовая лига', emoji: '🥉', from: 0, mult: 1 },
  { name: 'Районная лига', emoji: '🥈', from: 1200, mult: 2 },
  { name: 'Городская лига', emoji: '🥇', from: 1500, mult: 4 },
  { name: 'Подпольный ринг', emoji: '💎', from: 1800, mult: 8 },
];
const RIVAL_NAMES = ['Толик «Кувалда»', 'Серый', 'Вован Бетон', 'Кривой', 'Гоша Лом', 'Бугай', 'Кирпич', 'Слава Пресс', 'Мишаня Танк',
  'Дядя Федя', 'Жека Шило', 'Санёк Молот', 'Костян Утюг', 'Петрович', 'Рыжий', 'Лёха Бита', 'Борода', 'Тихон'];
const STYLES = {
  brawler: { name: 'Громила', emoji: '🦍', w: { hit: 0.4, heavy: 0.35, block: 0.1, dodge: 0.15 } },
  tactic: { name: 'Тактик', emoji: '🧠', w: { hit: 0.35, heavy: 0.15, block: 0.25, dodge: 0.25 } },
  coward: { name: 'Хитрец', emoji: '🦊', w: { hit: 0.3, heavy: 0.05, block: 0.3, dodge: 0.35 } },
};
const MOVES = {
  hit: { name: 'Удар', emoji: '👊', st: 10, mult: 1, miss: 0.08, desc: 'Надёжный' },
  heavy: { name: 'Мощный', emoji: '🦵', st: 25, mult: 1.8, miss: 0.3, desc: 'Пробивает блок' },
  block: { name: 'Блок', emoji: '🛡️', st: -15, desc: 'Гасит удары, +выносливость' },
  dodge: { name: 'Уклон', emoji: '💨', st: 10, desc: 'Шанс увернуться' },
};

const FIGHT_DEF = { rating: 1000, wins: 0, losses: 0, streak: 0, best: 0, rivals: [], rivalsAt: 0, leagueMax: 0, dayWin: '', week: 0, weekBest: 0, weekFights: 0 };
function fightState() {
  if (!S.fight) S.fight = {};
  for (const k in FIGHT_DEF) if (S.fight[k] === undefined) S.fight[k] = Array.isArray(FIGHT_DEF[k]) ? [] : FIGHT_DEF[k];
  return S.fight;
}
function league(r = fightState().rating) { let l = LEAGUES[0]; LEAGUES.forEach((x) => { if (r >= x.from) l = x; }); return l; }

function myFighter() {
  return { name: playerName(), level: level(), form: S.form, strength: S.strength, tier: tierOf('body') + tierOf('shoes'), eq: S.eq,
    hpMult: clamp(S.health / 100, 0.5, 1), rating: fightState().rating };
}
function fighterPower(f) { const s = fighterStats(f); return s.hp * 0.5 + s.atk * 4 + s.def * 3; }
function winChance(op) { const a = fighterPower(myFighter()), b = fighterPower(op); return clamp(a / (a + b) * 1.05, 0.05, 0.95); }

function randomEq(tierBudget) {
  const pickTier = (slot, max) => pick(CLOTHES[slot].filter((i) => !i.season && i.tier <= max)).id;
  return { hat: pickTier('hat', Math.min(3, tierBudget)), body: pickTier('body', Math.min(3, tierBudget)), shoes: pickTier('shoes', Math.min(3, tierBudget)) };
}

function ensureRivals(force) {
  const st = fightState();
  if (force || !st.rivals.length || Date.now() - st.rivalsAt > RIVALS_REFRESH) {
    st.rivals = [0, 1, 2].map(genRival);
    st.rivalsAt = Date.now();
  }
  return st.rivals;
}

function fightReward(op) { return Math.round((20 + op.level * 6) * league().mult * (1 + Math.min(10, fightState().streak) * 0.1) * prestigeMult()); }
function eloDelta(op, won) { const exp = 1 / (1 + Math.pow(10, (op.rating - fightState().rating) / 400)); return Math.round(32 * ((won ? 1 : 0) - exp)); }

// =====================================================================
// Призы: трофеи с соперника, первая победа дня, сундуки за серию, награды лиг, недельный сезон
// =====================================================================

const LOOT_CHANCE = 0.35;
const DAY_WIN_CAPS = 1;
const PVP_HATS = [
  { id: 'bandana', name: 'Бандана бойца', tier: 2, tap: 3, crit: 0.02 },
  { id: 'boxhelm', name: 'Боксёрский шлем', tier: 2, tap: 4, crit: 0.03, energy: 10 },
  { id: 'crown', name: 'Корона ринга', tier: 3, tap: 6, crit: 0.04, mood: 0.3 },
];
PVP_HATS.forEach((h) => CLOTHES.hat.push({ price: 0, season: true, pvp: true, ...h }));
// Разовая награда за первый выход в лигу (индекс как в LEAGUES)
const LEAGUE_PRIZES = [null, { caps: 3, money: 3000, hat: 'bandana' }, { caps: 8, money: 15000, hat: 'boxhelm' }, { caps: 15, money: 60000, hat: 'crown' }];
// Сундуки за серию: money — во сколько наград за бой, items — сколько вещей, tries — насколько редкие
const CHESTS = {
  3: { name: 'Пакет с района', emoji: '🛍️', caps: 0, money: 2, items: 1, tries: 1 },
  5: { name: 'Спортивная сумка', emoji: '🎒', caps: 1, money: 4, items: 2, tries: 2, spirit: 15 },
  10: { name: 'Кейс чемпиона', emoji: '💼', caps: 4, money: 8, items: 3, tries: 4, spirit: 30 },
};
function chestFor(streak) { return streak >= 10 && streak % 10 === 0 ? CHESTS[10] : CHESTS[streak]; }
function nextChest(streak) { for (let n = streak + 1; ; n++) if (chestFor(n)) return [n, chestFor(n)]; }
// Недельный сезон: в понедельник награда по лучшей лиге недели и мягкий сброс рейтинга
const WEEK_MIN_FIGHTS = 5;
const WEEK_PRIZES = [{ caps: 1, money: 1000 }, { caps: 4, money: 5000 }, { caps: 12, money: 20000 }, { caps: 30, money: 80000 }];

function leagueIdx(r) { return LEAGUES.indexOf(league(r)); }
function weekId(t = Date.now()) { return Math.floor(((t - new Date(t).getTimezoneOffset() * 60000) / 86400000 + 3) / 7); }
function weekEnds() { const local = ((weekId() + 1) * 7 - 3) * 86400000; return local + new Date(local).getTimezoneOffset() * 60000; }
function todayKey() { return new Date().toDateString(); }
function timeLeftText(ms) { const h = Math.max(1, Math.ceil(ms / 3600000)); return h >= 24 ? `${Math.floor(h / 24)} дн ${h % 24} ч` : `${h} ч`; }

// Вещь с поверженного: чем больше tries, тем дороже лучшая из выпавших
function lootItem(tries) {
  let best = rollItem();
  for (let i = 1; i < tries; i++) { const x = rollItem(); if (ITEMS[x].base > ITEMS[best].base) best = x; }
  addItem(best);
  return best;
}
function itemLine(id) { return `${ITEMS[id].emoji} ${ITEMS[id].name}`; }

// Начисляет всё сверх обычной награды за победу и возвращает строки для итогового окна
function winPrizes(op, reward) {
  const st = fightState();
  const lines = [];
  if (st.dayWin !== todayKey()) {
    st.dayWin = todayKey();
    addMoney(reward);
    addCaps(DAY_WIN_CAPS);
    lines.push(`🌅 Первая победа дня: ещё +${fmt(reward)} ₽ и +${DAY_WIN_CAPS} кр.`);
  }
  if (Math.random() < LOOT_CHANCE) lines.push(`🧥 Обшмонал карманы: ${itemLine(lootItem(1 + leagueIdx()))}`);
  const ch = chestFor(st.streak);
  if (ch) {
    const m = reward * ch.money;
    addMoney(m);
    addCaps(ch.caps);
    const items = Array.from({ length: ch.items }, () => itemLine(lootItem(ch.tries)));
    if (ch.spirit) addEffect('fightspirit', ch.spirit);
    lines.push(`${ch.emoji} <b>${ch.name}</b> за серию из ${st.streak} побед: +${fmt(m)} ₽, ${ch.caps ? `+${ch.caps} кр., ` : ''}${items.join(', ')}${ch.spirit ? `, 🔥 Боевой дух на ${ch.spirit} мин` : ''}`);
  }
  return lines;
}

// Первый выход в новую лигу: деньги, крышки и шапка, которую не купить
function leaguePrizes() {
  const st = fightState();
  const lines = [];
  const li = leagueIdx();
  st.weekBest = Math.max(st.weekBest, li);
  while (st.leagueMax < li) {
    st.leagueMax++;
    const p = LEAGUE_PRIZES[st.leagueMax];
    const lg = LEAGUES[st.leagueMax];
    addMoney(p.money);
    addCaps(p.caps);
    if (!S.owned.hat.includes(p.hat)) S.owned.hat.push(p.hat);
    lines.push(`${lg.emoji} <b>Новая лига: ${lg.name}!</b> +${fmt(p.money)} ₽, +${p.caps} кр. и шапка «${PVP_HATS.find((h) => h.id === p.hat).name}» (надень в магазине)`);
  }
  return lines;
}

function weekCheck() {
  const st = fightState();
  const w = weekId();
  if (!st.week) { st.week = w; return; }
  if (st.week === w || !popupTurn(2)) return;
  const best = st.weekBest, fights = st.weekFights;
  st.week = w; st.weekFights = 0;
  if (fights < WEEK_MIN_FIGHTS) { st.weekBest = leagueIdx(); return; }
  const before = st.rating;
  if (st.rating > 1000) st.rating = 1000 + Math.round((st.rating - 1000) / 2);
  st.weekBest = leagueIdx();
  const p = WEEK_PRIZES[best], lg = LEAGUES[best];
  addMoney(Math.round(p.money * prestigeMult()));
  addCaps(p.caps);
  sfx('ach');
  resultModal({ emoji: '📅', title: 'Сезон драк закрыт', btn: 'Забрать',
    text: `Лучшая лига недели: ${lg.emoji} ${lg.name}<br>Награда: <b style="color:var(--gold)">+${fmt(Math.round(p.money * prestigeMult()))} ₽ и +${p.caps} кр.</b>${before !== st.rating ? `<br><br>Новый сезон: рейтинг ${before} → ${st.rating}` : ''}` });
  save();
}
HOOKS.tick.push(() => { if (Math.random() < 0.05) weekCheck(); });

function prizesCard() {
  const st = fightState();
  const [n, ch] = nextChest(st.streak);
  const dayDone = st.dayWin === todayKey();
  const wp = WEEK_PRIZES[st.weekBest];
  const leagues = LEAGUES.slice(1).map((lg, i) => {
    const p = LEAGUE_PRIZES[i + 1], got = st.leagueMax > i;
    return `<div class="prize-row ${got ? 'got' : ''}"><span>${lg.emoji}</span><div><b>${lg.name}</b> · от ${lg.from}<small>+${fmt(p.money)} ₽, +${p.caps} кр., ${PVP_HATS[i].name}</small></div><i>${got ? '✓' : ''}</i></div>`;
  }).join('');
  return `<div class="subhead">Призы</div>
    <div class="prizes">
      <div class="prize-row ${dayDone ? 'got' : ''}"><span>🌅</span><div><b>Первая победа дня</b><small>Награда ×2 и +${DAY_WIN_CAPS} кр.</small></div><i>${dayDone ? '✓' : ''}</i></div>
      <div class="prize-row"><span>${ch.emoji}</span><div><b>${ch.name}</b> · серия ${st.streak}/${n}<small>${ch.caps ? `+${ch.caps} кр., ` : ''}${ch.items} ${ch.items > 1 ? 'вещи' : 'вещь'} с рынка${ch.spirit ? ', 🔥 Боевой дух' : ''}</small></div><i></i></div>
      <div class="prize-row"><span>🧥</span><div><b>Карманы соперника</b><small>${Math.round(LOOT_CHANCE * 100)}% за победу найти хлам для Шныря, в высоких лигах дороже</small></div><i></i></div>
      <div class="prize-row"><span>📅</span><div><b>Сезон недели</b> · ещё ${timeLeftText(weekEnds() - Date.now())}
        <small>${st.weekFights >= WEEK_MIN_FIGHTS ? `Сейчас: ${LEAGUES[st.weekBest].emoji} +${fmt(wp.money)} ₽ и +${wp.caps} кр.` : `Проведи ${WEEK_MIN_FIGHTS} драк за неделю (${st.weekFights}/${WEEK_MIN_FIGHTS})`}. Потом рейтинг сбросится наполовину</small></div><i></i></div>
      ${leagues}
    </div>`;
}

function miniFighter(eq, flip) {
  return `<div class="mini-fighter ${flip ? 'flip' : ''}">${valeraSVG(eq, { mood: 'ok' }).replace('viewBox="0 0 160 240"', 'viewBox="20 0 130 140"')}</div>`;
}

EXTRA_TABS.fun.fights = () => {
  const st = fightState();
  if (level() < FIGHT_LEVEL) return `<div class="info-card" style="text-align:center;padding:24px"><div style="font-size:56px">👊</div><b>Драки открываются со ${FIGHT_LEVEL} уровня</b><br>Пока подкачайся на турнике.</div>`;
  const lg = league(), next = LEAGUES[LEAGUES.indexOf(lg) + 1];
  const cd = cdLeft('fight');
  const me = fighterStats(myFighter());
  const refreshLeft = Math.max(0, RIVALS_REFRESH - (Date.now() - st.rivalsAt));
  return `<div class="premium-hero fight-hero"><div class="e">${lg.emoji}</div><div><b>${lg.name} · ${st.rating}</b>
      <p>Побед ${st.wins} · поражений ${st.losses} · серия ${st.streak}${st.best ? ` (рекорд ${st.best})` : ''}${next ? `<br>До «${next.name}»: ${next.from - st.rating} очков` : ''}</p></div></div>
    <div class="stat-grid">
      <div>❤️ Здоровье в бою<b>${me.hp}</b></div><div>👊 Атака<b>${me.atk.toFixed(0)}</b></div>
      <div>🛡️ Защита<b>${me.def.toFixed(0)}</b></div><div>🎁 Бонус серии<b>+${Math.min(10, st.streak) * 10}%</b></div>
    </div>
    ${prizesCard()}
    <div class="info-card">Бой пошаговый: выбирай удар, мощный удар, блок или уклон. Мощный пробивает блок, но от него легко увернуться. Сила и форма из спортзала решают! Драка стоит ${FIGHT_COST.energy} ⚡ и ${FIGHT_COST.food} 🍞.
      ${cd > 0 ? `<br>⏳ Следующая драка через <b><span data-until="${S.cd.fight}"></span></b>` : ''}</div>
    <div class="subhead">Соперники · новые через <span data-until="${Date.now() + refreshLeft}"></span></div>
    ${ensureRivals().map((op) => {
      const ch = winChance(op);
      const s = STYLES[op.style];
      return card({ thumb: miniFighter(op.eq, true), title: `${op.name} <span style="color:var(--muted);font-weight:500">ур. ${op.level}</span>`,
        desc: `${s.emoji} ${s.name} · рейтинг ${op.rating}<br>Шанс: <b style="color:${ch >= 0.5 ? 'var(--green)' : 'var(--red)'}">${Math.round(ch * 100)}%</b> · награда <b>${fmt(fightReward(op))} ₽</b> · ${eloDelta(op, true) >= 0 ? '+' : ''}${eloDelta(op, true)}/${eloDelta(op, false)} рейт.`,
        btn: `<button class="btn primary" data-act="fight" data-id="${op.id}" ${cd > 0 || S.busy ? 'disabled' : ''}>Драться</button>` });
    }).join('')}
    <button class="btn wide" data-act="rivalsRefresh" ${S.caps >= 1 ? '' : 'disabled'}>🔄 Найти других соперников (1 крышка)</button>`;
};

// =====================================================================
// Сам бой — движок в fight3.js (Бой 2.0)
// =====================================================================

let FIGHT = null;

function fightEnd(won) {
  const f = FIGHT;
  FIGHT = null;
  const taken = f.me.max - Math.max(0, f.me.hp);
  hurt(Math.round(taken * 0.25));
  if (f.opts.onEnd) { f.opts.onEnd(won); return; }
  const st = fightState();
  const op = f.op;
  const dr = eloDelta(op, won);
  st.rating = Math.max(0, st.rating + dr);
  let text;
  if (won) {
    const m = fightReward(op);
    st.wins++; st.streak++; st.best = Math.max(st.best, st.streak);
    addMoney(m);
    addXp(10 + op.level);
    addMood(10);
    track('fightWin');
    st.rivals = st.rivals.filter((r) => r.id !== op.id);
    const prizes = [...winPrizes(op, m), ...leaguePrizes()];
    text = `${op.name} повержен! +${fmt(m)} ₽, рейтинг ${dr >= 0 ? '+' : ''}${dr}${st.streak > 1 ? `<br>Серия побед: ${st.streak} 🔥` : ''}<br>Получено урона: −${Math.round(taken * 0.25)} ❤️`
      + (prizes.length ? `<div class="prize-list">${prizes.map((p) => `<div>${p}</div>`).join('')}</div>` : '');
    confetti(50);
    sfx('win');
  } else {
    st.losses++; st.streak = 0;
    addMood(-10);
    addXp(4);
    text = `${op.name} оказался сильнее. Рейтинг ${dr}, −${Math.round(taken * 0.25)} ❤️, −10 😊<br>Качай силу и форму в спортзале!`;
    sfx('lose');
  }
  track('fight');
  st.weekFights++;
  setCd('fight', FIGHT_CD);
  const lg = league();
  resultModal({ emoji: won ? '🏆' : '🤕', rays: won ? '' : 'bad', title: won ? 'Победа!' : 'Поражение', text: `${text}<br><small>${lg.emoji} ${lg.name} · ${st.rating}</small>`, btn: won ? 'Ещё!' : 'Реванш потом' });
  save();
}

Object.assign(ACTIONS, {
  fight: (id) => {
    const op = fightState().rivals.find((r) => String(r.id) === String(id));
    if (!op || cdLeft('fight') > 0 || S.busy) return;
    if (S.health < 30) { toast('Сначала подлечись — здоровье ниже 30', 'bad'); return; }
    if (S.energy < FIGHT_COST.energy) { toast(`Нужно ${FIGHT_COST.energy} энергии`, 'bad'); return; }
    if (S.food < FIGHT_COST.food) { toast('На голодный желудок не дерутся', 'bad'); return; }
    S.energy -= FIGHT_COST.energy;
    feed(-FIGHT_COST.food);
    startFight(op);
  },
  rivalsRefresh: () => {
    if (S.caps < 1) return;
    S.caps -= 1;
    ensureRivals(true);
    sfx('whoosh');
  },
});
