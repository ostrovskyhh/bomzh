// Батл-пасс «Сезон района»: 28 дней, 30 уровней по 100 очков сезона (⭐).
// Очки дают 3 задания дня и 3 задания недели. Бесплатная дорожка — у всех,
// «Золотой пропуск» (Stars) открывает вторую дорожку с крышками, деньгами, шапкой, VIP и рамкой.
// Задания подбираются под то, что игроку уже доступно; прогресс считается по общим счётчикам (track).

const PASS_LEN = 28 * 86400000;
const PASS_EPOCH = Date.UTC(2026, 0, 5); // понедельник — начало первого сезона
const PASS_LEVELS = 30;
const PASS_STEP = 100;
const PASS_STARS = 199;
const PASS_NAMES = ['Бутылочная лихорадка', 'Лето на лавке', 'Хозяин района', 'Король помойки', 'Золотая крышка', 'Бомж-миллионер'];

function passSeason(t = Date.now()) { return Math.floor((t - PASS_EPOCH) / PASS_LEN); }
function passEnds() { return PASS_EPOCH + (passSeason() + 1) * PASS_LEN; }
function passName(n = passSeason()) { return PASS_NAMES[((n % PASS_NAMES.length) + PASS_NAMES.length) % PASS_NAMES.length]; }

// Задания: key — счётчик track(), goal, sp — очки сезона, ok — доступно ли игроку
const PASS_DAILY = [
  { key: 'taps', goal: 400, sp: 40, text: 'Натапай 400 раз' },
  { key: 'sold', goal: 3, sp: 30, text: 'Сдай бутылки в обменник 3 раза' },
  { key: 'trash', goal: 3, sp: 30, text: 'Покопайся в мусорке 3 раза' },
  { key: 'eat', goal: 3, sp: 25, text: 'Поешь 3 раза' },
  { key: 'shift', goal: 2, sp: 40, text: 'Отработай 2 смены', ok: () => JOBS.some((j) => reqOk(j.req)) },
  { key: 'lesson', goal: 2, sp: 40, text: 'Сходи на 2 занятия', ok: () => S.edu < EDU.length - 1 },
  { key: 'fight', goal: 3, sp: 40, text: 'Проведи 3 драки', ok: () => level() >= FIGHT_LEVEL },
  { key: 'fightWin', goal: 2, sp: 50, text: 'Выиграй 2 драки', ok: () => level() >= FIGHT_LEVEL },
  { key: 'casino', goal: 3, sp: 30, text: 'Сыграй в казино 3 раза', ok: () => level() >= CASINO_LEVEL },
  { key: 'marketSold', goal: 2, sp: 30, text: 'Продай хлам Шнырю 2 раза' },
  { key: 'gymGame', goal: 1, sp: 35, text: 'Сделай тренировку', ok: () => level() >= 3 },
  { key: 'leisureGame', goal: 1, sp: 35, text: 'Отдохни с мини-игрой', ok: () => level() >= 4 },
  { key: 'date', goal: 1, sp: 40, text: 'Сходи на свидание', ok: () => level() >= 6 },
  { key: 'rpsGame', goal: 1, sp: 45, text: 'Сыграй в КНБ с живым игроком', ok: () => onlineOn() },
  { key: 'lottery', goal: 2, sp: 30, text: 'Купи 2 лотерейных билета', ok: () => level() >= CASINO_LEVEL },
];
const PASS_WEEKLY = [
  { key: 'taps', goal: 6000, sp: 150, text: 'Натапай 6000 раз' },
  { key: 'shift', goal: 15, sp: 150, text: 'Отработай 15 смен', ok: () => JOBS.some((j) => reqOk(j.req)) },
  { key: 'fightWin', goal: 15, sp: 180, text: 'Выиграй 15 драк', ok: () => level() >= FIGHT_LEVEL },
  { key: 'lesson', goal: 10, sp: 150, text: 'Сходи на 10 занятий', ok: () => S.edu < EDU.length - 1 },
  { key: 'trash', goal: 20, sp: 120, text: 'Покопайся в мусорке 20 раз' },
  { key: 'casino', goal: 20, sp: 120, text: 'Сыграй в казино 20 раз', ok: () => level() >= CASINO_LEVEL },
  { key: 'gymGame', goal: 7, sp: 150, text: 'Сделай 7 тренировок', ok: () => level() >= 3 },
  { key: 'onlineFight', goal: 3, sp: 200, text: 'Проведи 3 онлайн-боя', ok: () => onlineOn() && level() >= FIGHT_LEVEL },
  { key: 'rpsWin', goal: 3, sp: 200, text: 'Выиграй 3 партии КНБ у живых игроков', ok: () => onlineOn() },
  { key: 'questDone', goal: 2, sp: 160, text: 'Пройди 2 главы сюжета' },
  { key: 'events', goal: 15, sp: 120, text: 'Переживи 15 уличных событий' },
];

// Награды. money — в «крышках по курсу обменника», чтобы ценность не зависела от этапа игры
function passReward(track, l) {
  if (track === 'free') {
    if (l === PASS_LEVELS) return { caps: 10, frame: true };
    if (l % 5 === 0) return { caps: 3 };
    if (l % 3 === 0) return { boost: 1 };
    return { money: 2 + Math.floor(l / 4) };
  }
  if (l === PASS_LEVELS) return { caps: 50, money: 40 };
  if (l === 10) return { hat: 'passcap', caps: 5 };
  if (l === 20) return { vip: 3, caps: 5 };
  if (l % 5 === 0) return { caps: 10 };
  if (l % 2 === 0) return { caps: 3, money: 3 };
  return { money: 5 + Math.floor(l / 3) };
}
function passRewardText(r) {
  return [r.money ? `${fmt(r.money * capRate())} ₽` : '', r.caps ? `${r.caps} 🟡` : '', r.boost ? '🚀 ×2 на 10 мин' : '', r.vip ? `👑 VIP ${r.vip} дн.` : '',
    r.hat ? '🧢 Кепка сезона' : '', r.frame ? '🖼️ рамка «Сезон»' : ''].filter(Boolean).join(' + ');
}
function passRewardIcon(r) { return r.hat ? '🧢' : r.vip ? '👑' : r.frame ? '🖼️' : r.caps >= 10 ? '💰' : r.caps ? '🟡' : r.boost ? '🚀' : '💵'; }

// Кепка за 10-й уровень платной дорожки и рамка за 30-й бесплатной
HATS.passcap = `
  <path d="M50 54Q50 30 82 30Q110 32 110 52Z" fill="#7A3AB0"/><path d="M58 50Q92 42 124 52Q102 60 58 57Z" fill="#5A2A88"/>
  <text x="80" y="49" text-anchor="middle" font-size="14" font-weight="900" fill="#F2C744">S</text>`;
CLOTHES.hat.push({ id: 'passcap', name: 'Кепка сезона', price: 0, tier: 3, tap: 6, crit: 0.03, mood: 0.3, season: true, ach: { name: 'батл-пасс' } });
FRAMES.push({ id: 'season', name: 'Сезон', need: () => !!(S.passFrame), how: '30-й уровень батл-пасса' });

// ---------- Состояние ----------
function passState() {
  const n = passSeason();
  if (!S.pass || S.pass.season !== n) S.pass = { season: n, sp: 0, paid: false, got: { free: [], paid: [] }, daily: null, weekly: null, extra: 0 };
  const p = S.pass;
  const pick = (pool, count, seed) => {
    const ok = pool.filter((t) => !t.ok || t.ok());
    const out = [];
    let h = seed;
    while (out.length < Math.min(count, ok.length)) {
      h = promoHash(h + 7);
      const t = ok[h % ok.length];
      if (!out.includes(t)) out.push(t);
    }
    return out.map((t) => ({ key: t.key, goal: t.goal, sp: t.sp, text: t.text, base: counter(t.key), done: false }));
  };
  const day = today(), wk = weekId();
  if (!p.daily || p.daily.day !== day) p.daily = { day, list: pick(PASS_DAILY, 3, hashStr(day) ^ n) };
  if (!p.weekly || p.weekly.week !== wk) p.weekly = { week: wk, list: pick(PASS_WEEKLY, 3, wk * 31 + n) };
  return p;
}
function hashStr(s) { let h = 0; for (const c of s) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; }
function passLevel(p = passState()) { return Math.min(PASS_LEVELS, Math.floor(p.sp / PASS_STEP)); }
function passTaskProg(t) { return Math.min(t.goal, counter(t.key) - t.base); }
function passClaimable(p = passState()) {
  const l = passLevel(p);
  const tasks = [...p.daily.list, ...p.weekly.list].some((t) => !t.done && passTaskProg(t) >= t.goal);
  let lv = false;
  for (let i = 1; i <= l; i++) if (!p.got.free.includes(i) || (p.paid && !p.got.paid.includes(i))) lv = true;
  return tasks || lv;
}

function passGive(r) {
  if (r.money) addMoney(r.money * capRate());
  if (r.caps) addCaps(r.caps);
  if (r.boost) S.boostUntil = Math.max(Date.now(), S.boostUntil) + 10 * 60000;
  if (r.vip) S.vipUntil = Math.max(Date.now(), S.vipUntil || 0) + r.vip * 86400000;
  if (r.hat && !S.owned.hat.includes(r.hat)) S.owned.hat.push(r.hat);
  if (r.frame) S.passFrame = true;
}

// ---------- Вкладка ----------
EXTRA_TABS.tasks.pass = () => {
  const p = passState();
  const l = passLevel(p);
  const inLvl = l >= PASS_LEVELS ? PASS_STEP : p.sp % PASS_STEP;
  const taskRow = (t, i, kind) => {
    const pr = passTaskProg(t), ready = !t.done && pr >= t.goal;
    return `<div class="wk ${t.done ? 'done' : ''} ${ready ? 'cur' : ''}"><span>${t.done ? '✅' : ready ? '🎁' : '🎯'}</span><div><b>${t.text}</b><small>+${t.sp} ⭐ сезона</small>
      ${t.done ? '' : `<div class="progress"><div style="width:${(pr / t.goal) * 100}%"></div></div><small>${fmt(pr)} / ${fmt(t.goal)}</small>`}</div>
      ${ready ? `<button class="btn green small" data-act="passTask" data-id="${kind}:${i}">Забрать</button>` : ''}</div>`;
  };
  const cells = Array.from({ length: PASS_LEVELS }, (_, i) => {
    const lv = i + 1, fr = passReward('free', lv), pd = passReward('paid', lv);
    const reached = lv <= l;
    const cell = (track, r) => {
      const got = p.got[track].includes(lv);
      const locked = track === 'paid' && !p.paid;
      const can = reached && !got && !locked;
      return `<button class="bp-cell ${track} ${got ? 'got' : ''} ${can ? 'ready' : ''} ${locked ? 'locked' : ''}" data-act="passClaim" data-id="${track}:${lv}" ${can ? '' : 'disabled'} data-why="${got ? 'Уже получено' : locked ? 'Нужен Золотой пропуск' : `Откроется на ${lv} уровне пропуска`}">
        <i>${got ? '✅' : locked ? '🔒' : passRewardIcon(r)}</i><small>${passRewardText(r)}</small></button>`;
    };
    return `<div class="bp-col ${reached ? 'reached' : ''} ${lv === l + 1 ? 'next' : ''}"><div class="bp-lv">${lv}</div>${cell('free', fr)}${cell('paid', pd)}</div>`;
  }).join('');
  const left = passEnds() - Date.now();
  return `<div class="premium-hero pass-hero"><div class="e">🎫</div><div><b>Сезон ${p.season + 1}: «${passName(p.season)}»</b>
      <p>Уровень пропуска ${l} из ${PASS_LEVELS} · до конца ${Math.ceil(left / 86400000)} дн.</p>
      <div class="progress"><div style="width:${(inLvl / PASS_STEP) * 100}%"></div></div><small>${l >= PASS_LEVELS ? `Пропуск пройден! Сверх нормы: каждые ${PASS_STEP * 2} ⭐ — ${fmt(3 * capRate())} ₽` : `${inLvl} / ${PASS_STEP} ⭐ до следующего уровня`}</small></div></div>
    ${p.paid ? '<div class="info-card good">👑 Золотой пропуск активен — забирай награды обеих дорожек</div>'
      : `<div class="online-box"><b>👑 Золотой пропуск</b><small>Вторая дорожка: ~155 крышек, деньги на каждом уровне, Кепка сезона (+6 к тапу), 3 дня VIP. Награды за уже пройденные уровни выдаются сразу.${left < 3 * 86400000 ? ' <b>Сезон скоро закончится!</b>' : ''}</small>
        <button class="btn primary wide" data-act="prem" data-id="pass"><i class="ic" data-ic="star"></i>${PASS_STARS} — купить</button></div>`}
    <div class="subhead">Награды · сверху бесплатные, снизу золотые</div>
    <div class="bp-track">${cells}</div>
    <h2 class="screen-title">Задания дня</h2><div class="weekly">${p.daily.list.map((t, i) => taskRow(t, i, 'daily')).join('')}</div>
    <h2 class="screen-title">Задания недели</h2><div class="weekly">${p.weekly.list.map((t, i) => taskRow(t, i, 'weekly')).join('')}</div>
    <small class="weekly-note">Задания дня обновляются в полночь, недели — в понедельник. Новый сезон — каждые 28 дней.</small>`;
};

PREM_GIVE.pass = () => { const p = passState(); p.paid = true; return `🎫 Золотой пропуск сезона «${passName(p.season)}»`; };

Object.assign(ACTIONS, {
  passTask: (id) => {
    const [kind, i] = id.split(':');
    const p = passState();
    const t = p[kind] && p[kind].list[+i];
    if (!t || t.done || passTaskProg(t) < t.goal) return;
    t.done = true;
    const before = passLevel(p);
    p.sp += t.sp;
    // Сверх 30-го уровня очки копятся в бонус
    if (before >= PASS_LEVELS) {
      p.extra = (p.extra || 0) + t.sp;
      while (p.extra >= PASS_STEP * 2) { p.extra -= PASS_STEP * 2; addMoney(3 * capRate()); toast(`🎫 Бонус сезона: +${fmt(3 * capRate())} ₽`, 'good'); }
    }
    sfx('ach'); haptic('success');
    const after = passLevel(p);
    if (after > before) { confetti(60); toast(`🎫 Уровень пропуска ${after}! Забери награду`, 'good'); }
    else toast(`+${t.sp} ⭐ сезона`, 'good');
  },
  passClaim: (id) => {
    const [trk, lv] = id.split(':');
    const l = +lv, p = passState();
    if (l > passLevel(p) || p.got[trk].includes(l) || (trk === 'paid' && !p.paid)) return;
    const r = passReward(trk, l);
    p.got[trk].push(l);
    passGive(r);
    sfx('coin'); haptic('success');
    toast(`🎁 ${passRewardText(r)}`, 'good');
  },
});

// Красная точка на вкладке пропуска
const _sectionAlertsPass = sectionAlerts;
sectionAlerts = () => { const a = _sectionAlertsPass(); a.tasks.pass = passClaimable(); return a; };
