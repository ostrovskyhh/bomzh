// Прогресс: задания дня из большого набора (сложнее, растут с уровнем), недельная цепочка заданий,
// уникальные шапки за достижения, рамки аватара в топе и чате, настройки музыки, звука и напоминаний.

// =====================================================================
// Задания дня: каждый день 5 случайных из набора, цели растут с уровнем
// =====================================================================

// id — счётчик (track), base — цель на 1 уровне, grow — рост цели за уровень, lvl — с какого уровня
const TASK_POOL = [
  { id: 'taps', text: (g) => `Натапай ${fmt(g)} раз`, base: 500, grow: 0.12 },
  { id: 'sold', text: (g) => `Обменяй ${fmt(g)} бутылок`, base: 500, grow: 0.15 },
  { id: 'trash', text: (g) => `Покопайся в мусорке ${g} раза`, base: 3, grow: 0 },
  { id: 'bought', text: (g) => `Купи что-нибудь ${g} раза`, base: 3, grow: 0 },
  { id: 'events', text: (g) => `Переживи ${g} уличных событий`, base: 8, grow: 0.05 },
  { id: 'gym', text: (g) => `Сделай ${g} тренировки`, base: 3, grow: 0.03 },
  { id: 'eat', text: (g) => `Поешь ${g} раза`, base: 4, grow: 0 },
  { id: 'shift', text: (g) => `Отработай ${g} смены`, base: 3, grow: 0.05, lvl: 2 },
  { id: 'fightWin', text: (g) => `Выиграй ${g} драки`, base: 3, grow: 0.05, lvl: 2 },
  { id: 'lesson', text: (g) => `Сходи на ${g} занятия`, base: 2, grow: 0, lvl: 2 },
  { id: 'marketSold', text: (g) => `Продай Шнырю ${g} вещей`, base: 5, grow: 0.1, lvl: 2 },
  { id: 'leisureGame', text: (g) => `Отдохни с мини-игрой ${g} раза`, base: 2, grow: 0, lvl: 3 },
  { id: 'casino', text: (g) => `Сделай ${g} ставок в казино`, base: 10, grow: 0.1, lvl: 5 },
  { id: 'date', text: (g) => `Сходи на ${g} свидания`, base: 2, grow: 0, lvl: 4 },
  { id: 'gift', text: () => 'Подари подарок девушке', base: 1, grow: 0, lvl: 4 },
  { id: 'lottery', text: (g) => `Купи ${g} лотерейных билета`, base: 3, grow: 0, lvl: 2 },
  { id: 'gymGame', text: (g) => `Выполни ${g} упражнения на «отлично» в зале`, base: 2, grow: 0, lvl: 3 },
  { id: 'kidPlay', text: (g) => `Поиграй с детьми ${g} раза`, base: 2, grow: 0, need: () => (S.kids || []).length > 0 },
  { id: 'crime', text: (g) => `Провернуть ${g} дела`, base: 2, grow: 0, need: () => typeof crimeOpen === 'function' && crimeOpen() },
];
// Эти счётчики уже засчитываются в задания самой игрой (taskProgress) — второй раз не считаем
const TP_IDS = ['taps', 'sold', 'trash', 'bought', 'gym', 'events'];
const DAILY_COUNT = 5;

function seedPick(arr, n, seed) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(slotRand(seed, i) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}

function buildDailyTasks() {
  const day = S.tasks.day || today();
  const seed = +day.replace(/-/g, '') + (S.tasks.salt || 0);
  const lv = level();
  const pool = TASK_POOL.filter((t) => lv >= (t.lvl || 1) && (!t.need || t.need()));
  const chosen = seedPick(pool, DAILY_COUNT, seed);
  const list = chosen.map((t) => {
    const goal = Math.max(1, Math.round(t.base * (1 + t.grow * (lv - 1))));
    // Крышки — редкая награда: примерно одно задание из десяти и только 1 штука
    const caps = slotRand(seed, t.id.length) < 0.1;
    return { id: t.id, name: t.text(goal), goal, reward: caps ? { caps: 1 } : { money: Math.round(80 * (1 + lv * 0.35) * (1 + goal / (t.base * 4))) } };
  });
  TASKS.splice(0, TASKS.length, ...list);
  S.tasks.list = list.map((t) => t.id).join(',');
}

ensureTasksDay = (function (orig) {
  return () => {
    const before = S.tasks && S.tasks.day;
    orig();
    if (S.tasks.day !== before || !S.tasks.list || TASKS.map((t) => t.id).join(',') !== S.tasks.list) buildDailyTasks();
  };
})(ensureTasksDay);
HOOKS.load.push(() => { if (S.tasks) buildDailyTasks(); });

HOOKS.track.push((key, n) => {
  if (TP_IDS.includes(key) || !S.tasks || !TASKS.some((t) => t.id === key)) return;
  S.tasks.progress[key] = (S.tasks.progress[key] || 0) + n;
});

// =====================================================================
// Недельная цепочка: 5 этапов по очереди, обновляется в понедельник
// =====================================================================

const WEEKLY = [
  { key: 'fightWin', goal: 10, text: 'Выиграй 10 драк', reward: { money: 3000 } },
  { key: 'shift', goal: 15, text: 'Отработай 15 смен', reward: { money: 6000 } },
  { key: 'gymGame', goal: 10, text: 'Сделай 10 тренировок-мини-игр', reward: { caps: 1 } },
  { key: 'earned', goal: 200000, text: 'Заработай 200 000 ₽', reward: { money: 20000 } },
  { key: 'boss', goal: 3, text: 'Победи 3 сложных бота или живых игроков', reward: { caps: 2, hat: 'weekcap' } },
];
function weeklyValue(k) { return k === 'earned' ? S.stats.earned : k === 'boss' ? counter('hardWin') + counter('onlineWin') : counter(k); }
function weeklyState() {
  const w = weekId();
  if (!S.weekly || S.weekly.week !== w) S.weekly = { week: w, step: 0, base: weeklyValue(WEEKLY[0].key) };
  return S.weekly;
}
function weeklyProgress() { const st = weeklyState(); const s = WEEKLY[st.step]; return s ? Math.min(s.goal, weeklyValue(s.key) - st.base) : 0; }
function weeklyReady() { const st = weeklyState(); const s = WEEKLY[st.step]; return !!s && weeklyProgress() >= s.goal; }
function weeklyReward(r) { return [r.money ? `${fmt(Math.round(r.money * (1 + level() * 0.2)))} ₽` : '', r.caps ? `${r.caps} кр.` : '', r.hat ? '🧢 Кепка чемпиона недели' : ''].filter(Boolean).join(' + '); }

function weeklyHTML() {
  const st = weeklyState();
  const ends = weekEnds();
  return `<h2 class="screen-title">Неделя · этап ${Math.min(st.step + 1, WEEKLY.length)} из ${WEEKLY.length}</h2>
    <div class="weekly">${WEEKLY.map((s, i) => {
      const done = i < st.step, cur = i === st.step;
      const p = cur ? weeklyProgress() : done ? s.goal : 0;
      return `<div class="wk ${done ? 'done' : ''} ${cur ? 'cur' : ''}"><span>${done ? '✅' : cur ? '🎯' : '🔒'}</span><div><b>${s.text}</b><small>Награда: ${weeklyReward(s.reward)}</small>
        ${cur ? `<div class="progress"><div style="width:${(p / s.goal) * 100}%"></div></div><small>${fmt(p)} / ${fmt(s.goal)}</small>` : ''}</div>
        ${cur && weeklyReady() ? '<button class="btn green small" data-act="weeklyClaim">Забрать</button>' : ''}</div>`;
    }).join('')}</div>
    <small class="weekly-note">Цепочка обновится через ${fmtTime((ends - Date.now()) / 1000)}. Этапы открываются по очереди.</small>`;
}

const _tasksTabProgress = EXTRA_TABS.tasks.tasks;
EXTRA_TABS.tasks.tasks = function tasksWithWeekly() {
  const html = _tasksTabProgress();
  EXTRA_TABS.tasks.tasks = tasksWithWeekly;
  const i = html.indexOf('<h2 class="screen-title">Задания дня</h2>');
  return i >= 0 ? html.slice(0, i) + weeklyHTML() + html.slice(i) : html + weeklyHTML();
};

ACTIONS.weeklyClaim = () => {
  if (!weeklyReady()) return;
  const st = weeklyState(), s = WEEKLY[st.step];
  if (s.reward.money) addMoney(Math.round(s.reward.money * (1 + level() * 0.2)));
  if (s.reward.caps) addCaps(s.reward.caps);
  if (s.reward.hat && !S.owned.hat.includes(s.reward.hat)) S.owned.hat.push(s.reward.hat);
  st.step++;
  if (WEEKLY[st.step]) st.base = weeklyValue(WEEKLY[st.step].key);
  track('weeklyStep');
  confetti(60); sfx('ach');
  toast(`🎯 Этап недели пройден: ${weeklyReward(s.reward)}`, 'good');
};

// Красная точка на заданиях — и за недельную награду
const _sectionAlertsP = sectionAlerts;
sectionAlerts = () => { const a = _sectionAlertsP(); a.tasks.tasks = a.tasks.tasks || weeklyReady(); a.tasks.coll = false; return a; };

// =====================================================================
// Уникальные шапки за достижения и рамки аватара
// =====================================================================

Object.assign(HATS, {
  goldushanka: `
    <rect x="42" y="54" width="14" height="28" rx="7" fill="#E9B530"/><rect x="104" y="54" width="14" height="28" rx="7" fill="#E9B530"/>
    <path d="M48 58Q48 26 80 26Q112 26 112 58Z" fill="#C9961A"/><rect x="44" y="48" width="72" height="13" rx="6.5" fill="#F2C744"/>
    <circle cx="80" cy="40" r="6" fill="#D0302F"/><path d="M60 36q20-10 40 0" stroke="#FFE27A" stroke-width="2.5" fill="none"/>`,
  hardhat: `
    <path d="M48 56Q48 24 80 24Q112 24 112 56Z" fill="#F2B300"/><rect x="40" y="52" width="80" height="9" rx="4" fill="#D99A00"/>
    <rect x="74" y="24" width="12" height="30" rx="4" fill="#FFCC33"/>`,
  beret: `
    <ellipse cx="78" cy="44" rx="36" ry="14" fill="#B3122E"/><rect x="52" y="48" width="56" height="8" rx="4" fill="#8E0E24"/>
    <rect x="76" y="26" width="5" height="8" rx="2" fill="#8E0E24"/>`,
  cowboy: `
    <ellipse cx="80" cy="52" rx="48" ry="9" fill="#7A4A22"/><path d="M58 52Q56 22 80 22Q104 22 102 52Z" fill="#8E5A2B"/>
    <rect x="58" y="42" width="44" height="6" fill="#3A2412"/>`,
  headband: `<path d="M52 50q28-8 56 0v9q-28-8-56 0z" fill="#D0302F"/><path d="M106 52l14 6-10 6z" fill="#B3122E"/>`,
  weekcap: `
    <path d="M50 54Q50 30 82 30Q110 32 110 52Z" fill="#2F7DD0"/><path d="M58 50Q92 42 124 52Q102 60 58 57Z" fill="#1F5FA8"/>
    <path d="M74 36l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#F2C744"/>`,
});
// Шапка выдаётся, когда достижение доходит до 3-го уровня
const ACH_HATS = [
  { hat: 'goldushanka', name: 'Золотая ушанка', ach: 'taps', tier: 3, tap: 6 },
  { hat: 'hardhat', name: 'Каска ударника', ach: 'shifts', tier: 3, tap: 3, energy: 25 },
  { hat: 'beret', name: 'Берет отличника', ach: 'lessons', tier: 3, tap: 3, mood: 0.4 },
  { hat: 'cowboy', name: 'Шляпа шулера', ach: 'casino', tier: 3, tap: 3, crit: 0.04 },
  { hat: 'headband', name: 'Повязка бойца', ach: 'fights', tier: 3, tap: 4, crit: 0.02, energy: 10 },
];
ACH_HATS.forEach((h) => CLOTHES.hat.push({ id: h.hat, name: h.name, price: 0, tier: h.tier, tap: h.tap, energy: h.energy, crit: h.crit, mood: h.mood, season: true, ach: h }));
CLOTHES.hat.push({ id: 'weekcap', name: 'Кепка чемпиона недели', price: 0, tier: 3, tap: 5, crit: 0.02, mood: 0.2, season: true, ach: { name: 'недельная цепочка' } });

// Рамка аватара: открывается числом уровней достижений и особыми заслугами
const FRAMES = [
  { id: 'none', name: 'Без рамки', need: () => true, how: '' },
  { id: 'bronze', name: 'Бронзовая', need: () => achTotal() >= 10, how: '10 уровней достижений' },
  { id: 'silver', name: 'Серебряная', need: () => achTotal() >= 25, how: '25 уровней достижений' },
  { id: 'gold', name: 'Золотая', need: () => achTotal() >= 45, how: '45 уровней достижений' },
  { id: 'diamond', name: 'Бриллиантовая', need: () => achTotal() >= 70, how: '70 уровней достижений' },
  { id: 'vip', name: 'Корона VIP', need: () => isVip(), how: 'Активный VIP' },
  { id: 'champ', name: 'Чемпион турнира', need: () => counter('tourPrize') > 0, how: 'Выиграть турнир по вторникам' },
  { id: 'fire', name: 'Огненная', need: () => (S.fight && S.fight.best >= 10), how: 'Серия из 10 побед в драках' },
];
FRAMES.filter((f) => f.id !== 'vip').forEach((f) => {
  const need = f.need;
  f.need = () => (S.prestigeFrames || []).includes(f.id) || need();
});
function achTotal() { return ACHS.reduce((a, x) => a + achTier(x), 0); }
function currentFrame() { const f = FRAMES.find((x) => x.id === S.frame); return f && f.need() ? f.id : 'none'; }

HOOKS.tick.push(() => {
  if (Math.random() > 0.1) return;
  for (const h of ACH_HATS) {
    const a = ACHS.find((x) => x.id === h.ach);
    if (a && achTier(a) >= h.tier && !S.owned.hat.includes(h.hat)) {
      S.owned.hat.push(h.hat);
      sfx('ach');
      toast(`🎩 За достижение «${a.name}» — уникальная шапка «${h.name}»! Надень в магазине`, 'good');
    }
  }
});
HOOKS.hud.push(() => { const a = $('avatar'); if (a) a.className = `avatar frame-${currentFrame()}`; });

// Рамка уходит в топ и чат
myStats = (function (orig) { return () => ({ ...orig(), frame: currentFrame() }); })(myStats);

// Выбор рамки — наверху вкладки «Достижения»
const _achTabP = EXTRA_TABS.tasks.ach;
EXTRA_TABS.tasks.ach = () => `<div class="subhead">🖼️ Рамка аватара · видна в топе и чате</div>
  <div class="frames">${FRAMES.map((f) => { const ok = f.need(); return `<button class="frame-pick ${currentFrame() === f.id ? 'on' : ''}" data-act="pickFrame" data-id="${f.id}" ${ok ? '' : `disabled data-why="Откроется: ${f.how}"`}>
    <div class="avatar frame-${f.id}">${esc(playerName()[0])}</div><small>${f.name}</small></button>`; }).join('')}</div>
  <div class="info-card">🎩 Достижение до 3-го уровня даёт уникальную шапку: ${ACH_HATS.map((h) => `${h.name} (${ACHS.find((a) => a.id === h.ach).name})`).join(', ')}.</div>` + _achTabP();
ACTIONS.pickFrame = (id) => { const f = FRAMES.find((x) => x.id === id); if (f && f.need()) { S.frame = id; sfx('chip'); updateHud(); } };


// =====================================================================
// Настройки: музыка на главном экране, звуковая тема, громкость, напоминания
// =====================================================================

const MAIN_MUSIC = [['lofi', '🎧 Лоу-фай'], ['waltz', '🪗 Дворовый вальс'], ['chip', '👾 8-бит'], ['off', '🔇 Тишина']];
const SFX_THEMES = [['classic', 'Классика'], ['retro', '8-бит'], ['soft', 'Мягкая']];

syncMusic = function () {
  if (typeof Sound === 'undefined') return;
  if (currentScreen === 'fun' && TABS.fun === 'casino') { Sound.music('lounge'); return; }
  const t = S.settings && S.settings.mainMusic;
  Sound.music(t && t !== 'off' ? t : null);
};
HOOKS.load.push(() => { if (S.settings && !S.settings.mainMusic) S.settings.mainMusic = 'lofi'; });
// Браузер разрешает звук только после первого касания — тогда и включаем музыку
document.addEventListener('pointerdown', function once() { syncMusic(); document.removeEventListener('pointerdown', once); });

openSettings = (function (orig) {
  return function () {
    orig();
    const list = document.querySelector('#modalRoot .set-list');
    if (!list) return;
    const sel = (key, opts) => `<div class="pills">${opts.map(([v, n]) => `<button class="${(S.settings[key] || opts[0][0]) === v ? 'on' : ''}" data-act="setPick" data-id="${key}:${v}">${n}</button>`).join('')}</div>`;
    const slider = (key, def) => `<input type="range" min="0" max="100" value="${S.settings[key] ?? def}" data-vol="${key}">`;
    list.insertAdjacentHTML('beforeend', `
      <div class="set-row"><div><b>Напоминания от бота</b><small>Бот напишет, когда Валера проголодается, касса заполнится и т.д.</small></div>
        <button class="switch ${S.settings.remind !== false ? 'on' : ''}" data-act="toggleRemind"><i></i></button></div>
      <div class="set-block"><b>Музыка на главном экране</b>${sel('mainMusic', MAIN_MUSIC)}</div>
      <div class="set-block"><b>Громкость музыки</b>${slider('musicVol', 70)}</div>
      <div class="set-block"><b>Звуки</b>${sel('sfxTheme', SFX_THEMES)}${slider('sfxVol', 80)}</div>`);
    list.querySelectorAll('[data-vol]').forEach((r) => { r.oninput = () => { S.settings[r.dataset.vol] = +r.value; Sound.applyVolume(); }; r.onchange = () => sfx('click'); });
  };
})(openSettings);

Object.assign(ACTIONS, {
  setPick: (arg, btn) => {
    const [key, v] = arg.split(':');
    S.settings[key] = v;
    btn.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === btn));
    if (key === 'mainMusic') syncMusic();
    if (key === 'sfxTheme') sfx('coin');
  },
  toggleRemind: (_, btn) => {
    S.settings.remind = S.settings.remind === false;
    btn.classList.toggle('on', S.settings.remind);
    if (typeof notifySync === 'function') notifySync();
  },
});
