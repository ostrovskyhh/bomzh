// Удобства: пересчёт опыта под новую кривую, окно «энергия кончилась», красные точки на разделах,
// готовые награды наверху списков, подсказка «почему нельзя» при нажатии на недоступную кнопку.

// ---------- Разные сохранения на телефоне и компьютере: спрашиваем, какое оставить ----------
function saveSummary(s) {
  return `ур. ${levelInfo(s.xp || 0).level} · ${fmt(s.money || 0)} ₽ · ${HOUSING[s.housing || 0].name}${s.savedAt ? ` · ${new Date(s.savedAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}`;
}
function showSavePick() {
  if (!ALT_SAVE) return;
  const alt = ALT_SAVE;
  openModal(`<div class="big-art" style="height:90px"><div class="big-emoji" style="line-height:90px">☁️</div></div>
    <h3>Найдено два сохранения</h3>
    <p>Похоже, ты играл на разных устройствах. Выбери, какой прогресс оставить — он станет общим для всех устройств, второй будет удалён.</p>
    <div class="btns" style="flex-direction:column;gap:8px">
      <button class="btn primary wide" data-act="pickSave" data-id="alt">📈 ${saveSummary(alt)}</button>
      <button class="btn wide" data-act="pickSave" data-id="cur">📱 ${saveSummary(S)}</button></div>`, { center: true, locked: true });
}
HOOKS.load.push(() => setTimeout(showSavePick, 1200));
ACTIONS.pickSave = (id) => {
  if (ALT_SAVE) serverBase = Math.max(serverBase, ALT_SAVE.savedAt || 0);
  if (id === 'alt' && ALT_SAVE) { S = ALT_SAVE; renderedLook = ''; }
  ALT_SAVE = null;
  if (serverOk()) serverReady = true;
  closeModal();
  save(true);
  if (id === 'alt') setTimeout(() => location.reload(), 600); else toast('Оставлен текущий прогресс', 'good');
};

// ---------- Новая кривая опыта: старым игрокам сохраняем уровень и прогресс внутри него ----------
HOOKS.load.unshift(() => {
  if (S.xpV2) return;
  let l = 1, rest = S.xp || 0;
  while (rest >= xpNeedV1(l)) { rest -= xpNeedV1(l); l++; }
  let xp = 0;
  for (let i = 1; i < l; i++) xp += xpNeed(i);
  S.xp = xp + (rest / xpNeedV1(l)) * xpNeed(l);
  S.xpV2 = true;
});

// =====================================================================
// 1. Энергия кончилась — предлагаем кофе, сон или отказаться
// =====================================================================

const ENERGY_OFFER_EVERY = 3 * 60000;
let energyOfferedAt = 0;

function energyOffer() {
  energyOfferedAt = Date.now();
  const coffee = FOOD.find((f) => f.id === 'coffee'), drink = FOOD.find((f) => f.id === 'energetik');
  sfx('notify');
  openModal(`<div class="big-art" style="height:96px"><div class="big-emoji" style="line-height:96px">🥱</div></div>
    <h3>Энергия кончилась</h3><p>Валера еле стоит на ногах. Тапать, работать и тренироваться без сил нельзя.</p>
    <div class="btns" style="flex-direction:column;gap:8px">
      ${priceBtn('energyFix', 'coffee', coffee.price, S.money >= coffee.price, `☕ Кофе · +${coffee.energy} ⚡ · ${fmt(coffee.price)} ₽`).replace('class="btn', 'class="btn wide')}
      ${priceBtn('energyFix', 'energetik', drink.price, S.money >= drink.price, `🥤 Энергетик · +${drink.energy} ⚡ · ${fmt(drink.price)} ₽`).replace('class="btn', 'class="btn wide')}
      <button class="btn primary wide" data-act="energyFix" data-id="sleep">💤 Лечь спать (энергия в ${SLEEP_SPEED} раз быстрее)</button>
      <button class="btn wide" data-act="close">Не сейчас</button></div>`, { center: true });
}

HOOKS.tick.push(() => {
  if (S.energy >= 1 || S.busy || !S.storySeen || modalOpen() || currentScreen !== 'game' || (S.tut && !S.tut.done)) return;
  if (Date.now() - energyOfferedAt < ENERGY_OFFER_EVERY) return;
  energyOffer();
});

ACTIONS.energyFix = (id) => {
  closeModal();
  if (id === 'sleep') { startSleep(); updateHud(); return; }
  eat(id);
};

// =====================================================================
// 2. Красные точки: на нижней вкладке и на конкретном разделе, где есть награда или задача
// =====================================================================

function sectionAlerts() {
  const q = typeof currentQuest === 'function' ? currentQuest() : null;
  return {
    tasks: {
      story: !!q && (q.choice || (goalsDone(q) && !(q.boss && cdLeft('boss') > 0))),
      tasks: hasClaimable(),
      ach: ACHS.some(achReady),
      prestige: canPrestige() || PERKS.some((p) => perk(p.id) < p.max && (S.pp || 0) >= perk(p.id) + 1),
    },
    life: {
      work: !S.busy && JOBS.some((j) => reqOk(j.req) && canPromote(j.id) && (S.cd['exam_' + j.id] || 0) <= Date.now()),
      study: !!(S.study && S.study.done >= S.study.need),
      health: activeEffects().some((e) => EFFECTS[e.id].kind === 'disease'),
    },
    fun: {
      market: Object.keys(S.inv || {}).some((id) => S.inv[id] > 0 && ITEMS[id]),
    },
    shop: {
      pets: !!S.pet && (S.petFood <= 20 || !!S.petSick),
    },
  };
}

HOOKS.hud.push(() => {
  const al = sectionAlerts();
  for (const [group, tabs] of Object.entries(al)) {
    const any = Object.values(tabs).some(Boolean);
    const navDot = { tasks: 'tasksDot', life: 'lifeDot' }[group];
    if (navDot) $(navDot).classList.toggle('hidden', !any);
    document.querySelectorAll(`.seg[data-group="${group}"] button`).forEach((b) => b.classList.toggle('has-dot', !!tabs[b.dataset.tab]));
  }
});

// =====================================================================
// 6. Готовые к получению награды — наверху списков
// =====================================================================

// Задания дня: готовые → в процессе → забранные
EXTRA_TABS.tasks.tasks = function tasksSorted() {
  const order = (t) => { const p = S.tasks.progress[t.id] || 0; return S.tasks.claimed[t.id] ? 2 : p >= t.goal ? 0 : 1; };
  const saved = TASKS.slice();
  TASKS.sort((a, b) => order(a) - order(b));
  delete EXTRA_TABS.tasks.tasks;
  const html = renderTasks();
  EXTRA_TABS.tasks.tasks = tasksSorted;
  TASKS.splice(0, TASKS.length, ...saved);
  return html;
};

// Достижения: можно забрать → в процессе → все уровни открыты
const _achTab = EXTRA_TABS.tasks.ach;
EXTRA_TABS.tasks.ach = () => {
  const order = (a) => (achReady(a) ? 0 : achTier(a) >= a.goals.length ? 2 : 1);
  const saved = ACHS.slice();
  ACHS.sort((a, b) => order(a) - order(b) || saved.indexOf(a) - saved.indexOf(b));
  const html = _achTab();
  ACHS.splice(0, ACHS.length, ...saved);
  return html;
};

// Не готовое задание дня — кнопка «Перейти» вместо серой «Забрать»
const _tasksSortedGo = EXTRA_TABS.tasks.tasks;
EXTRA_TABS.tasks.tasks = function tasksWithGo() {
  const html = _tasksSortedGo(); // она сама временно подменяет вкладку, после неё возвращаем эту
  EXTRA_TABS.tasks.tasks = tasksWithGo;
  return html.replace(/<button class="btn " data-act="task" data-id="(\w+)" disabled>Забрать<\/button>/g, '<button class="btn" data-act="goTask" data-id="$1">➡️ Перейти</button>');
};

// =====================================================================
// Задание → переход в нужный раздел и подсветка того, что сделать (5 секунд)
// =====================================================================

const GO_KEYS = {
  taps: ['game', null, '#valera', 'Тапай по Валере'],
  sold: ['game', null, '#exchangeBtn', 'Сдай бутылки в обменнике'],
  trash: ['game', null, '#trashBtn', 'Покопайся в мусорке'],
  eat: ['game', null, '#eatBtn', 'Поешь'],
  sleep: ['game', null, '#sleepBtn', 'Ложись спать'],
  events: ['game', null, '#valera', 'Уличные события случаются сами, пока ты играешь'],
  bought: ['shop', 'food', '#shopList .card:not(.locked)', 'Купи что-нибудь, например еду'],
  gym: ['life', 'gym', '#lifeList .card:not(.locked)', 'Сделай тренировку'],
  gymGame: ['life', 'gym', '#lifeList .card:not(.locked)', 'Сделай тренировку'],
  shift: ['life', 'work', '#lifeList .card:not(.locked)', 'Выходи на смену'],
  stateShift: ['life', 'work', '#lifeList .card:not(.locked)', 'Смены на госслужбе — в верхнем блоке'],
  promotion: ['life', 'work', '#lifeList .promo-row, #lifeList .card:not(.locked)', 'Наработай смены и сдай аттестацию'],
  lesson: ['life', 'study', '#lifeList .btn.primary, #lifeList .card', 'Ходи на занятия'],
  fightWin: ['fun', 'fights', '#funList .card', 'Выбери соперника и дерись'],
  fight: ['fun', 'fights', '#funList .card', 'Выбери соперника и дерись'],
  marketSold: ['fun', 'market', '#funList .card', 'Продай хлам Шнырю'],
  date: ['fun', 'dates', '#funList .card:not(.locked)', 'Позови девушку на свидание'],
  casino: ['fun', 'casino', '#funList button', 'Сыграй в казино'],
  bjWin: ['fun', 'casino', '#funList button', 'Выиграй в блекджек'],
  leisureGame: ['fun', 'rest', '#funList .card:not(.locked)', 'Отдых с мини-игрой: рыбалка, дартс, шашлыки'],
};
// Цели «значение достигает порога» узнаём по тексту
const GO_TEXT = [
  [/коробк|шалаш|гараж|квартир|особняк/i, ['shop', 'housing', '#shopList .card:not(.locked):not(.current)', 'Купи жильё']],
  [/школ|ПТУ|колледж|университет/i, ['life', 'study', '#lifeList .btn.primary, #lifeList .card', 'Учись']],
  [/одежд|обувь/i, ['shop', 'clothes', '#shopList .card:not(.locked)', 'Купи одежду']],
  [/форм|сила/i, ['life', 'gym', '#lifeList .card:not(.locked)', 'Качайся в зале']],
  [/рейтинг драк|серия|живых игрок/i, ['fun', 'fights', '#funList .card, #funList .online-box', 'Дерись']],
  [/бизнес/i, ['life', 'business', '#lifeList .card:not(.locked)', 'Открой бизнес']],
  [/транспорт|машин/i, ['shop', 'transport', '#shopList .card:not(.locked):not(.current)', 'Купи транспорт']],
  [/девушк|свадьб/i, ['fun', 'dates', '#funList .card:not(.locked), #funList .premium-hero', 'Свидания и семья']],
  [/повышени/i, ['life', 'work', '#lifeList .promo-row, #lifeList .card:not(.locked)', 'Сдай аттестацию на работе']],
  [/престиж|новый круг/i, ['tasks', 'prestige', '#tasksList .btn', 'Престиж']],
  [/₽/, ['game', null, '#exchangeBtn', 'Зарабатывай: обменник, работа, бизнес']],
  [/уровн/i, ['game', null, '#valera', 'Опыт даётся за всё: тапы, работу, учёбу, драки']],
];

function goalTarget(g) {
  if (g.key && GO_KEYS[g.key]) return GO_KEYS[g.key];
  const hit = GO_TEXT.find(([re]) => re.test(g.text));
  return hit ? hit[1] : null;
}

let HL = null; // { sel, until } — что подсвечено

function goTo([screen, tab, sel, label], goalText) {
  closeModal();
  showScreen(screen, tab || undefined);
  HL = { sel, until: Date.now() + 5000 };
  setTimeout(() => {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    hlApply();
  }, 250);
  toast(`🎯 ${goalText ? `${goalText} — ` : ''}${label}`, 'good');
  haptic('light');
}

function hlApply() {
  document.querySelectorAll('.goal-hl').forEach((e) => { if (!HL || Date.now() > HL.until) e.classList.remove('goal-hl'); });
  if (!HL || Date.now() > HL.until) { HL = null; return; }
  const el = document.querySelector(HL.sel);
  if (el && !el.classList.contains('goal-hl')) el.classList.add('goal-hl');
}
HOOKS.hud.push(hlApply);
setInterval(hlApply, 500);

Object.assign(ACTIONS, {
  goGoal: (i) => {
    const q = currentQuest();
    const g = q && q.goals[+i];
    const t = g && goalTarget(g);
    if (t) goTo(t, g.text);
  },
  goTask: (id) => {
    const t = TASKS.find((x) => x.id === id);
    if (GO_KEYS[id]) goTo(GO_KEYS[id], t ? t.name : '');
  },
  // Нажатие на шкалу — туда, где её поднимают
  goStat: (id) => {
    if (S.busy) { toast('Сначала закончи текущее дело'); return; }
    goTo(STAT_FIX[id], '');
  },
  // Нажатие на дебафф — туда, где его лечат
  effect: (id) => {
    const e = activeEffects().find((x) => x.id === id);
    if (!e) return;
    const d = EFFECTS[id];
    const fix = d.kind !== 'good' && (EFFECT_FIX[id] || (d.kind === 'disease' ? EFFECT_FIX._disease : null));
    if (!fix || S.busy) { toast(e.diag ? `${d.name}: ${d.desc}` : `${d.hidden} Сходи к врачу`); return; }
    goTo(fix, e.diag ? `${d.emoji} ${d.name}` : d.hidden);
  },
});
const STAT_FIX = {
  energy: ['game', null, '#sleepBtn', 'Поспи или выпей кофе в разделе «Еда»'],
  food: ['shop', 'food', '#shopList .card:not(.locked)', 'Поешь — еда здесь'],
  health: ['life', 'health', '#lifeList .card:not(.locked)', 'Подлечись у врачей'],
  mood: ['fun', 'rest', '#funList .card:not(.locked)', 'Отдохни — так радость растёт быстрее всего'],
};
const EFFECT_FIX = {
  _disease: ['life', 'health', '#lifeList .card:not(.locked)', 'Лечится у врачей'],
  heartburn: ['life', 'health', '#lifeList .card:not(.locked)', 'Таблетки в аптеке или подожди'],
  poison: ['life', 'health', '#lifeList .card:not(.locked)', 'Вылечат в поликлинике'],
  backpain: ['life', 'health', '#lifeList .card:not(.locked)', 'Вылечат в поликлинике'],
  stuffed: ['life', 'health', '#lifeList .card:not(.locked)', 'Аптека поможет быстрее'],
  hiccup: ['life', 'health', '#lifeList .card:not(.locked)', 'Аптека поможет быстрее'],
  foodcoma: ['game', null, '#sleepBtn', 'Проспись'],
  runs: ['life', 'health', '#lifeList .card:not(.locked)', 'Аптека поможет быстрее'],
  hangover: ['fun', 'rest', '#funList .card:not(.locked)', 'Отдых и баня снимают похмелье'],
  bloat: ['life', 'health', '#lifeList .card:not(.locked)', 'Аптека поможет быстрее'],
  heartbreak: ['fun', 'rest', '#funList .card:not(.locked)', 'Отдых и друзья лечат сердце'],
};

// =====================================================================
// 8. Нажал на недоступную кнопку — объясняем, чего не хватает
// =====================================================================

const DONE_WORDS = ['Куплено', 'Надето', 'Твой', 'Было', 'Готово', 'MAX', 'Есть', 'С тобой', 'Живу тут', 'Снимаю', 'Приходи завтра'];

function whyDisabled(b) {
  if (b.dataset.why) return b.dataset.why;
  const until = b.querySelector('[data-until]');
  if (until) return `Ещё не готово — подожди ${fmtTime(Math.max(0, (+until.dataset.until - Date.now()) / 1000))}`;
  const text = b.textContent.trim();
  if (DONE_WORDS.some((w) => text.startsWith(w))) return 'Это уже сделано 👍';
  const cardEl = b.closest('.card, .quest-card, .info-card');
  const missing = cardEl ? [...cardEl.querySelectorAll('.reqs i:not(.ok)')].map((i) => i.textContent.replace('✗', '').trim()) : [];
  if (missing.length) return `Нужно: ${missing.join(', ')}`;
  if (S.busy) return S.busy.type === 'sleep' ? 'Валера спит. Разбуди его или дождись утра' : 'Валера сейчас занят';
  if (text === 'Занят') return 'Валера сейчас занят';
  if (b.dataset.act === 'questDone') return 'Сначала выполни все цели главы';
  if (b.dataset.act === 'task') return 'Задание ещё не выполнено';
  if (b.dataset.act === 'prestigeGo') return `Нужен ${PRESTIGE_REQ.level} уровень и свой особняк`;
  if (b.dataset.act === 'perkUp') return 'Не хватает очков престижа';
  if (b.dataset.act === 'capsUse') return 'Не хватает золотых крышек';
  return 'Сейчас это недоступно';
}

// Недоступные кнопки не ловят нажатия (pointer-events: none), поэтому ищем кнопку под пальцем вручную
document.addEventListener('click', (e) => {
  if (e.target.closest('button:not(:disabled), [data-act]:not(:disabled)')) return;
  const x = e.clientX, y = e.clientY;
  const root = modalOpen() ? $('modalRoot') : document.querySelector('.screen.active') || document;
  const b = [...root.querySelectorAll('button:disabled')].find((el) => {
    const r = el.getBoundingClientRect();
    return r.width && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  });
  if (!b) return;
  toast(whyDisabled(b), 'bad');
  haptic('error');
  b.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 200 });
});
