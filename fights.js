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

function fighterStats(f) {
  return {
    hp: Math.round((60 + f.form * 0.6 + f.strength * 0.4 + f.level * 2) * (f.hpMult || 1)),
    atk: 8 + f.strength * 0.25 + f.level * 0.5 + f.tier * 1.5,
    def: 2 + f.form * 0.08 + f.tier,
  };
}
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

function genRival(i) {
  const me = myFighter();
  const lvl = Math.max(1, me.level + Math.floor(rand(-2, 3)));
  const tierBudget = clamp(Math.floor(lvl / 5), 0, 3);
  const eq = randomEq(tierBudget);
  const style = pick(Object.keys(STYLES));
  return {
    id: Date.now() + i, name: pick(RIVAL_NAMES), level: lvl, style, eq,
    form: clamp(S.form + rand(-15, 15) + i * 3, 0, 100), strength: clamp(S.strength + rand(-15, 15) + i * 3, 0, 100),
    tier: CLOTHES.body.find((x) => x.id === eq.body).tier + CLOTHES.shoes.find((x) => x.id === eq.shoes).tier,
    rating: Math.max(800, Math.round(fightState().rating + rand(-120, 140))),
  };
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
const DAY_WIN_CAPS = 3;
const PVP_HATS = [
  { id: 'bandana', name: 'Бандана бойца' },
  { id: 'boxhelm', name: 'Боксёрский шлем' },
  { id: 'crown', name: 'Корона ринга' },
];
PVP_HATS.forEach((h) => CLOTHES.hat.push({ id: h.id, name: h.name, price: 0, tier: 0, season: true, pvp: true }));
// Разовая награда за первый выход в лигу (индекс как в LEAGUES)
const LEAGUE_PRIZES = [null, { caps: 10, money: 3000, hat: 'bandana' }, { caps: 25, money: 15000, hat: 'boxhelm' }, { caps: 50, money: 60000, hat: 'crown' }];
// Сундуки за серию: money — во сколько наград за бой, items — сколько вещей, tries — насколько редкие
const CHESTS = {
  3: { name: 'Пакет с района', emoji: '🛍️', caps: 2, money: 2, items: 1, tries: 1 },
  5: { name: 'Спортивная сумка', emoji: '🎒', caps: 5, money: 4, items: 2, tries: 2, spirit: 15 },
  10: { name: 'Кейс чемпиона', emoji: '💼', caps: 15, money: 8, items: 3, tries: 4, spirit: 30 },
};
function chestFor(streak) { return streak >= 10 && streak % 10 === 0 ? CHESTS[10] : CHESTS[streak]; }
function nextChest(streak) { for (let n = streak + 1; ; n++) if (chestFor(n)) return [n, chestFor(n)]; }
// Недельный сезон: в понедельник награда по лучшей лиге недели и мягкий сброс рейтинга
const WEEK_MIN_FIGHTS = 5;
const WEEK_PRIZES = [{ caps: 5, money: 1000 }, { caps: 15, money: 5000 }, { caps: 40, money: 20000 }, { caps: 100, money: 80000 }];

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
    lines.push(`${ch.emoji} <b>${ch.name}</b> за серию из ${st.streak} побед: +${fmt(m)} ₽, +${ch.caps} кр., ${items.join(', ')}${ch.spirit ? `, 🔥 Боевой дух на ${ch.spirit} мин` : ''}`);
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
  if (st.week === w || modalOpen() || FIGHT) return;
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
      <div class="prize-row"><span>${ch.emoji}</span><div><b>${ch.name}</b> · серия ${st.streak}/${n}<small>+${ch.caps} кр., ${ch.items} ${ch.items > 1 ? 'вещи' : 'вещь'} с рынка${ch.spirit ? ', 🔥 Боевой дух' : ''}</small></div><i></i></div>
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
// Сам бой
// =====================================================================

let FIGHT = null;

function startFight(op, opts = {}) {
  const meF = opts.me || myFighter();
  const me = { ...meF, ...fighterStats(meF), st: 100 };
  const en = { ...op, ...fighterStats(op), st: 100 };
  me.max = me.hp; en.max = en.hp;
  FIGHT = { id: Date.now(), me, en, op, round: 1, busy: false, opts };
  openModal(`<div class="fight">
      <div class="f-round" id="fRound">Раунд 1</div>
      <div class="f-arena">
        <div class="f-side"><div class="f-name">${esc(me.name)}</div><div class="f-ava" id="fMeAva">${valeraSVG(S.eq, lookState())}</div>
          <div class="f-bar hp"><div id="fMeHp"></div><span id="fMeHpT"></span></div><div class="f-bar st"><div id="fMeSt"></div></div><div class="f-move" id="fMeMove"></div></div>
        <div class="f-vs">VS</div>
        <div class="f-side"><div class="f-name">${esc(en.name)}</div><div class="f-ava flip" id="fEnAva">${valeraSVG(op.eq, { mood: 'ok' })}</div>
          <div class="f-bar hp"><div id="fEnHp"></div><span id="fEnHpT"></span></div><div class="f-bar st"><div id="fEnSt"></div></div><div class="f-move" id="fEnMove"></div></div>
      </div>
      <div class="f-log" id="fLog">${opts.intro || 'Выбирай приём!'}</div>
      <div class="f-btns" id="fBtns"></div>
    </div>`, { center: true, locked: true });
  sfx('bell');
  fightRender();
}

function fightRender() {
  const f = FIGHT;
  if (!f || !$('fBtns')) return;
  const bar = (id, v, max) => { $(id).style.width = clamp(v / max, 0, 1) * 100 + '%'; };
  bar('fMeHp', f.me.hp, f.me.max); bar('fEnHp', f.en.hp, f.en.max);
  bar('fMeSt', f.me.st, 100); bar('fEnSt', f.en.st, 100);
  $('fMeHpT').textContent = `${Math.max(0, Math.ceil(f.me.hp))}/${f.me.max}`;
  $('fEnHpT').textContent = `${Math.max(0, Math.ceil(f.en.hp))}/${f.en.max}`;
  $('fRound').textContent = `Раунд ${f.round} из 10`;
  $('fBtns').innerHTML = Object.entries(MOVES).map(([id, m]) => {
    const can = !f.busy && (m.st <= 0 || f.me.st >= m.st);
    return `<button class="btn f-btn" data-act="fightMove" data-id="${id}" data-silent="1" ${can ? '' : 'disabled'}><span>${m.emoji}</span>${m.name}<small>${m.st > 0 ? `−${m.st}` : `+${-m.st}`} выносл.</small></button>`;
  }).join('');
}

function aiMove(en) {
  const w = { ...STYLES[en.style || 'tactic'].w };
  if (en.st < 25) w.heavy = 0;
  if (en.st < 10) { w.hit = 0; w.dodge = 0; }
  if (en.hp < en.max * 0.3) { w.block += 0.15; w.dodge += 0.1; }
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  return Object.keys(w).find((k) => (r -= w[k]) < 0) || 'block';
}

// Урон атакующего по защищающемуся с учётом их приёмов
function strike(att, attMove, def, defMove) {
  const m = MOVES[attMove];
  if (!m.mult) return { dmg: 0, text: '' };
  if (Math.random() < m.miss) return { dmg: 0, text: 'промах', sound: 'whoosh' };
  if (defMove === 'dodge' && Math.random() < (attMove === 'heavy' ? 0.75 : 0.45)) return { dmg: 0, text: 'увернулся', sound: 'whoosh' };
  let dmg = att.atk * m.mult * rand(0.85, 1.15) - def.def * 0.5;
  let text = '';
  if (defMove === 'block') { dmg *= attMove === 'heavy' ? 0.6 : 0.25; text = attMove === 'heavy' ? 'пробил блок' : 'в блок'; }
  const crit = Math.random() < 0.1;
  if (crit) { dmg *= 1.5; text = 'КРИТ'; }
  dmg = Math.max(1, Math.round(dmg));
  return { dmg, text, sound: defMove === 'block' && attMove !== 'heavy' ? 'block' : attMove === 'heavy' || crit ? 'heavy' : 'punch', crit };
}

async function fightMove(move) {
  const f = FIGHT;
  if (!f || f.busy) return;
  const m = MOVES[move];
  if (m.st > 0 && f.me.st < m.st) return;
  f.busy = true;
  const id = f.id;
  const enMove = aiMove(f.en);
  f.me.st = clamp(f.me.st - m.st + 8, 0, 100);
  f.en.st = clamp(f.en.st - MOVES[enMove].st + 8, 0, 100);
  $('fMeMove').textContent = `${m.emoji} ${m.name}`;
  $('fEnMove').textContent = `${MOVES[enMove].emoji} ${MOVES[enMove].name}`;
  fightRender();

  const hitMe = strike(f.en, enMove, f.me, move);
  const hitEn = strike(f.me, move, f.en, enMove);
  // Анимация: сначала бьёт игрок, потом соперник
  const lunge = (el, dir) => el && el.animate([{ transform: `translateX(0) ${el.classList.contains('flip') ? 'scaleX(-1)' : ''}` }, { transform: `translateX(${dir * 22}px) ${el.classList.contains('flip') ? 'scaleX(-1)' : ''}` }, { transform: `translateX(0) ${el.classList.contains('flip') ? 'scaleX(-1)' : ''}` }], { duration: 260 });
  const shake = (el) => el && el.animate([{ filter: 'brightness(2) saturate(0)' }, { filter: 'none' }], { duration: 300 });
  const show = (el, hit) => {
    if (!hit.text && !hit.dmg) return;
    floatAt(el, hit.dmg ? `−${hit.dmg}${hit.crit ? '!' : ''}` : hit.text, hit.dmg ? 'bad' : 'good');
  };
  if (MOVES[move].mult) { lunge($('fMeAva'), 1); await wait(130); }
  if (!FIGHT || FIGHT.id !== id) return;
  if (hitEn.sound) sfx(hitEn.sound);
  if (hitEn.dmg) { f.en.hp -= hitEn.dmg; shake($('fEnAva')); haptic('medium'); }
  show($('fEnAva'), hitEn);
  fightRender();
  await wait(420);
  if (!FIGHT || FIGHT.id !== id) return;
  if (f.en.hp > 0) {
    if (MOVES[enMove].mult) { lunge($('fEnAva'), -1); await wait(130); }
    if (hitMe.sound) sfx(hitMe.sound);
    if (hitMe.dmg) { f.me.hp -= hitMe.dmg; shake($('fMeAva')); haptic('heavy'); }
    show($('fMeAva'), hitMe);
  }
  const log = [];
  log.push(hitEn.dmg ? `Ты: ${m.name.toLowerCase()} — ${hitEn.dmg} урона${hitEn.text ? ` (${hitEn.text})` : ''}` : MOVES[move].mult ? `Ты: ${hitEn.text || 'мимо'}` : `Ты: ${m.name.toLowerCase()}`);
  if (f.en.hp > 0) log.push(hitMe.dmg ? `${f.en.name}: ${hitMe.dmg} урона${hitMe.text ? ` (${hitMe.text})` : ''}` : MOVES[enMove].mult ? `${f.en.name}: ${hitMe.text || 'мимо'}` : `${f.en.name}: ${MOVES[enMove].name.toLowerCase()}`);
  $('fLog').innerHTML = log.join('<br>');
  f.round++;
  fightRender();
  await wait(450);
  if (!FIGHT || FIGHT.id !== id) return;
  if (f.en.hp <= 0 || f.me.hp <= 0 || f.round > 10) {
    const won = f.en.hp <= 0 || (f.me.hp > 0 && f.me.hp / f.me.max > f.en.hp / f.en.max);
    if (f.en.hp <= 0 || f.me.hp <= 0) sfx('ko');
    await wait(500);
    fightEnd(won);
    return;
  }
  f.busy = false;
  fightRender();
}

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
  fightMove: (id) => fightMove(id),
  rivalsRefresh: () => {
    if (S.caps < 1) return;
    S.caps -= 1;
    ensureRivals(true);
    sfx('whoosh');
  },
});
