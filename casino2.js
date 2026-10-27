// Казино 3.0: своя сумма ставки во всех играх, общая «Ракета» для всех игроков (сервер bot/crash.py)
// с автовыводом на заданном иксе, кейсы с вещами разной редкости и «Барахолка», где их продают.

// =====================================================================
// 1. Своя сумма ставки — во всех играх, где есть выбор ставки
// =====================================================================
const BET_MAX = 10000000;
betPicker = (function (orig) {
  return function () {
    const custom = !BETS.includes(S.bet);
    return orig().replace(/<\/div>$/, `<button class="bet-custom ${custom ? 'on' : ''}" data-act="betCustom">✏️ ${custom ? fmt(S.bet) + ' ₽' : 'Своя'}</button></div>`);
  };
})(betPicker);
ACTIONS.betCustom = () => {
  const box = document.querySelector('#modalRoot .bets') || document.querySelector('.bets');
  if (!box || box.querySelector('.bet-input')) return;
  box.insertAdjacentHTML('beforeend', `<div class="bet-input"><input id="betInput" type="number" inputmode="numeric" min="10" max="${BET_MAX}" placeholder="Сумма ставки" value="${S.bet}"><button class="btn primary small" data-act="betCustomOk">OK</button></div>`);
  const i = $('betInput'); i.focus(); i.select();
  i.addEventListener('keydown', (e) => { if (e.key === 'Enter') ACTIONS.betCustomOk(); });
};
ACTIONS.betCustomOk = () => {
  const v = Math.floor(+($('betInput') || {}).value || 0);
  if (v < 10) { toast('Минимальная ставка — 10 ₽', 'bad'); return; }
  if (v > BET_MAX) { toast(`Максимум — ${fmt(BET_MAX)} ₽`, 'bad'); return; }
  if (v > S.money) { toast(`Не хватает денег: у тебя ${fmt(S.money)} ₽`, 'bad'); return; }
  S.bet = v;
  const box = document.querySelector('#modalRoot .bets') || document.querySelector('.bets');
  if (box) box.outerHTML = betPicker();
  toast(`Ставка: ${fmt(v)} ₽`, 'good');
};

// =====================================================================
// 2. Общая «Ракета»: одна на всех, 15 секунд на ставки после взрыва
// =====================================================================
let CR2 = null; // { timer, view, dt (сервер − телефон), raf, lastId, claimed }
const CRASH_AUTO_DEFAULT = 2;

function crashOnline() { return onlineOn(); }
openCrash = (function (orig) {
  return function () {
    if (!crashOnline()) { orig(); crashAutoUI(); return; }
    if (S.crashAuto === undefined) S.crashAuto = 0;
    openModal(`<h3>🚀 Ракета · общая</h3>
      <div class="crash-box" id="crashBox">
        <svg viewBox="0 0 300 160" preserveAspectRatio="none" class="crash-graph"><polyline id="crashLine" points="0,160" fill="none" stroke="#F2B33D" stroke-width="3"/></svg>
        <div class="crash-rocket" id="crashRocket">🚀</div>
        <div class="crash-mult" id="crashMult">…</div>
        <div class="crash-phase" id="crashPhase">Подключаемся…</div>
      </div>
      <div class="crash-hist" id="crashHist"></div>
      ${betPicker()}
      <div class="crash-auto"><label><input type="checkbox" id="crashAutoOn" ${S.crashAuto ? 'checked' : ''}> Автовывод на</label>
        <input id="crashAutoX" type="number" step="0.01" min="1.05" max="100" value="${S.crashAuto || CRASH_AUTO_DEFAULT}"><span>x</span></div>
      <div class="btns"><button class="btn primary wide" data-act="crash2Btn" id="crashBtn">…</button></div>
      <div class="crash-players" id="crashPlayers"></div>
      <small class="crash-note">Одна ракета на всех игроков. Ставка — только пока идёт приём (15 секунд). Автовывод заберёт деньги сам, даже если закроешь окно</small>`, { center: true });
    crashAutoBind();
    CR2 = { view: null, dt: 0, lastId: 0, busy: false };
    crash2Poll();
    CR2.timer = setInterval(crash2Poll, 800);
    const frame = () => { if (!CR2 || !$('crashMult')) { crash2Stop(); return; } crash2Draw(); CR2.raf = requestAnimationFrame(frame); };
    CR2.raf = requestAnimationFrame(frame);
  };
})(openCrash);

// Автовывод: поле и галочка; значение — до сотых (1.95), читаем в момент ставки
function crashAutoRead() {
  const on = $('crashAutoOn'), x = $('crashAutoX');
  if (!on || !x) return S.crashAuto || 0;
  const v = Math.round(Math.max(1.05, Math.min(100, +String(x.value).replace(',', '.') || CRASH_AUTO_DEFAULT)) * 100) / 100;
  S.crashAuto = on.checked ? v : 0;
  return S.crashAuto;
}
function crashAutoBind() { ['crashAutoOn', 'crashAutoX'].forEach((id) => { const el = $(id); if (el) { el.onchange = crashAutoRead; el.oninput = crashAutoRead; } }); }
// В одиночной ракете — то же поле автовывода
function crashAutoUI() {
  const bets = document.querySelector('#modalRoot .bets');
  // Только в «Ракете»: раньше после броска поле «Автовывод» появлялось и в рулетке с костями, где оно ничего не делает
  if (!bets || $('crashAutoOn') || !$('crashBox')) return;
  bets.insertAdjacentHTML('afterend', `<div class="crash-auto"><label><input type="checkbox" id="crashAutoOn" ${S.crashAuto ? 'checked' : ''}> Автовывод на</label>
    <input id="crashAutoX" type="number" step="0.01" min="1.05" max="100" value="${S.crashAuto || CRASH_AUTO_DEFAULT}"><span>x</span></div>`);
  crashAutoBind();
}

function crash2Stop() { if (!CR2) return; clearInterval(CR2.timer); cancelAnimationFrame(CR2.raf); CR2 = null; }

async function crash2Poll() {
  const c = CR2;
  if (!c || c.busy) return;
  if (!$('crashMult')) { crash2Stop(); return; }
  c.busy = true;
  try { crash2Apply(await apiPost('crash/state')); } catch (e) { if ($('crashPhase')) $('crashPhase').textContent = 'Нет связи с сервером…'; }
  c.busy = false;
}

function crash2Apply(v) {
  const c = CR2;
  if (!c || !v || v.error) return;
  c.dt = v.now - Date.now();
  const prev = c.view;
  c.view = v;
  if (prev && prev.id !== v.id) { c.pts = []; sfx('bell'); }
  if (prev && prev.phase === 'flying' && v.phase === 'crashed') { sfx('boom'); haptic('heavy'); $('crashBox').classList.add('boom'); if (v.me && !v.me.cashed) toast(`🚀 Взорвалась на ${v.crash.toFixed(2)}x. Ставка сгорела`, 'bad'); }
  if (prev && prev.phase !== 'flying' && v.phase === 'flying') { sfx('rocket'); $('crashBox').classList.remove('boom'); c.pts = []; }
  if (v.unclaimed > 0) crash2Claim();
  $('crashHist').innerHTML = v.history.map((x) => `<i class="${x >= 2 ? 'g' : ''}">${x.toFixed(2)}x</i>`).join('');
  $('crashPlayers').innerHTML = v.players.length ? `<b>Ставки раунда · ${v.count}</b>${v.players.map((p) => `<div class="${p.cashed ? 'won' : ''}"><span>${esc(p.name)}</span><i>${fmt(p.amount)} ₽</i><em>${p.cashed ? `${p.cashed.toFixed(2)}x → +${fmt(Math.floor(p.amount * p.cashed))}` : v.phase === 'crashed' ? '💥' : '…'}</em></div>`).join('')}` : '<b>Пока никто не поставил — будь первым</b>';
  crash2Btn();
}

function crash2Mult() {
  const v = CR2 && CR2.view;
  if (!v) return 1;
  if (v.phase === 'crashed') return v.crash;
  if (v.phase !== 'flying') return 1;
  const t = (Date.now() + CR2.dt - v.start) / 1000;
  return Math.max(1, Math.floor(Math.exp(v.growth * t) * 100) / 100);
}

function crash2Draw() {
  const v = CR2.view;
  if (!v) return;
  const now = Date.now() + CR2.dt;
  if (v.phase === 'betting' || (v.phase === 'flying' && now < v.start)) {
    const left = Math.max(0, (v.betUntil - now) / 1000);
    $('crashMult').textContent = `${left.toFixed(1)} с`;
    $('crashPhase').textContent = '⏳ Приём ставок';
    $('crashLine').setAttribute('points', '0,160');
    $('crashRocket').style.left = '0%'; $('crashRocket').style.top = '97%';
    if (left <= 0 && !CR2.kick) { CR2.kick = true; setTimeout(() => { if (CR2) CR2.kick = false; crash2Poll(); }, 200); }
    return;
  }
  const m = crash2Mult();
  const t = Math.log(Math.max(1, m)) / v.growth;
  if (v.phase === 'crashed') { $('crashMult').textContent = `💥 ${m.toFixed(2)}x`; $('crashPhase').textContent = 'Следующий раунд скоро'; return; }
  // Предсказываем взрыв не можем — сервер скажет; пока летим, рисуем по формуле
  $('crashMult').textContent = m.toFixed(2) + 'x';
  $('crashPhase').textContent = v.me && v.me.cashed ? `✅ Ты забрал на ${v.me.cashed.toFixed(2)}x` : '🚀 Летим!';
  const x = Math.min(290, t * 22), y = Math.max(10, 155 - Math.log(m) * 60);
  CR2.pts = CR2.pts || [];
  CR2.pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  if (CR2.pts.length > 400) CR2.pts.splice(0, CR2.pts.length - 400);
  $('crashLine').setAttribute('points', '0,160 ' + CR2.pts.join(' '));
  $('crashRocket').style.left = (x / 300 * 100) + '%'; $('crashRocket').style.top = (y / 160 * 100) + '%';
  crash2Btn();
}

function crash2Btn() {
  const v = CR2 && CR2.view, b = $('crashBtn');
  if (!v || !b) return;
  let text, on = false, cls = 'primary';
  if (v.phase === 'betting') {
    if (v.me) text = `✅ Ставка ${fmt(v.me.amount)} ₽${v.me.auto ? ` · авто ${v.me.auto}x` : ''}`;
    else { text = `Поставить ${fmt(S.bet)} ₽`; on = S.money >= S.bet; }
  } else if (v.phase === 'flying' && v.me && !v.me.cashed) {
    text = `💰 Забрать ${fmt(Math.floor(v.me.amount * crash2Mult()))} ₽`; on = true; cls = 'green';
  } else text = v.phase === 'flying' ? (v.me ? '✅ Забрал' : 'Ставки закрыты — жди раунд') : 'Новый раунд через пару секунд';
  if (b.textContent !== text) b.textContent = text;
  b.disabled = !on;
  b.className = `btn wide ${cls}`;
  if (!on && !b.dataset.why) b.dataset.why = 'Сейчас нельзя: ставки принимаются 15 секунд перед стартом';
}

async function crash2Claim() {
  if (CR2) { if (CR2.claiming) return; CR2.claiming = true; }
  try {
    const { amount } = await apiPost('crash/claim');
    if (amount > 0) { addMoney(amount); sfx('cashout'); floatAt($('crashMult') || document.body, `+${fmt(amount)} ₽`, 'good'); toast(`🚀 Ракета: +${fmt(amount)} ₽`, 'good'); saveSoon(); }
  } catch (e) { /* заберём на следующем опросе */ }
  if (CR2) CR2.claiming = false;
}

ACTIONS.crash2Btn = async () => {
  const v = CR2 && CR2.view;
  if (!v) return;
  try {
    if (v.phase === 'betting' && !v.me) {
      const amount = S.bet;
      if (S.money < amount) { toast('Не хватает денег на ставку', 'bad'); return; }
      crashAutoRead(); // поле могли не успеть «покинуть» — читаем прямо сейчас
      const r = await apiPost('crash/bet', { amount, auto: S.crashAuto || 0 });
      if (r.error) { toast(r.error, 'bad'); return; }
      S.money -= amount; track('casino'); sfx('chip'); saveSoon();
      crash2Apply(r);
    } else if (v.phase === 'flying' && v.me && !v.me.cashed) {
      const r = await apiPost('crash/cashout');
      crash2Apply(r);
      if (r.ok) { addMood(3); crash2Claim(); }
    }
  } catch (e) { toast(refErrorText(e), 'bad'); }
};
// Автовывод мог сработать, пока окно было закрыто: забираем при запуске игры
HOOKS.init.push(() => setTimeout(() => { if (crashOnline()) apiPost('crash/claim').then((r) => { if (r.amount > 0) { addMoney(r.amount); toast(`🚀 Автовывод ракеты: +${fmt(r.amount)} ₽`, 'good'); saveSoon(); } }).catch(() => {}); }, 7000));

// 4.1: автовывод засчитывается сразу, даже если окно ракеты закрыто — пока раунд со ставкой не закончился,
// игра в фоне спрашивает сервер и забирает выигрыш (раньше деньги приходили только при открытой ракете или при перезапуске)
let CRASH_BG = 0;
HOOKS.tick.push(() => {
  if (!S.crashBet || CR2 || !crashOnline() || Date.now() - CRASH_BG < 3000) return;
  if (Date.now() - S.crashBet.at > 15 * 60000) { S.crashBet = null; return; }
  CRASH_BG = Date.now();
  apiPost('crash/state').then((v) => {
    if (!S.crashBet || !v || v.error) return;
    if (v.unclaimed > 0) crash2Claim();
    else if (v.id !== S.crashBet.id || v.phase === 'crashed') S.crashBet = null; // раунд закончился, забирать нечего
  }).catch(() => {});
});
document.addEventListener('visibilitychange', () => { if (!document.hidden && S && S.crashBet) CRASH_BG = 0; });
crash2Apply = (function (orig) {
  return function (v) {
    if (v && v.me && v.phase !== 'crashed') S.crashBet = { id: v.id, at: S.crashBet && S.crashBet.id === v.id ? S.crashBet.at : Date.now() };
    return orig(v);
  };
})(crash2Apply);

// Одиночная ракета: автовывод встроен в её цикл (casino.js → crashCash)

// =====================================================================
// 3. Кейсы и Барахолка
// =====================================================================
// «Кейсы не как в кс»: у каждого кейса своя тема и свои вещи — их больше нигде не найти.
// Цена вещи фиксированная: база вещи × качество (как износ в CS), разброс одной и той же вещи одного качества — не больше ±5%
const RARITY = [
  { id: 'common', name: 'Ширпотреб', color: '#9AA4B2', chance: 0.6, k: 0.3 },
  { id: 'uncommon', name: 'Ходовое', color: '#4B8BF5', chance: 0.25, k: 0.8 },
  { id: 'rare', name: 'Редкое', color: '#9B59F5', chance: 0.1, k: 2 },
  { id: 'epic', name: 'Эпическое', color: '#E84393', chance: 0.04, k: 5 },
  { id: 'legend', name: 'Легенда', color: '#F2B33D', chance: 0.01, k: 15 },
];
const QUALITY = [
  { id: 'fn', name: 'Как новое', chance: 0.12, mult: 1.3 },
  { id: 'mw', name: 'Слегка б/у', chance: 0.33, mult: 1 },
  { id: 'ft', name: 'Поношенное', chance: 0.35, mult: 0.85 },
  { id: 'bs', name: 'Убитое', chance: 0.2, mult: 0.7 },
];
// Вещь: [эмодзи, название, множитель цены внутри редкости]
const CASES = [
  { id: 'box', name: 'Коробка с помойки', emoji: '📦', price: 1000, level: 5, theme: 'Всё, что выкинули жильцы', loot: {
    common: [['🧦', 'Носки «Абибас»', 0.9], ['🔋', 'Батарейки «почти живые»', 0.85], ['🪥', 'Зубная щётка с историей', 0.8], ['🧴', 'Одеколон «Шипр»', 1.1], ['🥫', 'Шпроты 1987 года', 1.2]],
    uncommon: [['⌚', 'Часы «Командирские»', 1.2], ['🕶️', 'Очки «Рэй-Бэн» с рынка', 0.9], ['📻', 'Радио «Океан»', 1], ['🧤', 'Перчатки из дерматина', 0.85]],
    rare: [['📱', 'Раскладушка «Моторола»', 1], ['🎸', 'Гитара без одной струны', 0.9], ['📷', 'Фотоаппарат «Зенит»', 1.1]],
    epic: [['💍', 'Перстень-печатка', 1.1], ['🖼️', 'Картина «Под Айвазовского»', 0.9]],
    legend: [['🗿', 'Бюст Михалыча', 1], ['🏆', 'Кубок «Бомж года-1999»', 1.05]] } },
  { id: 'fish', name: 'Рыбацкий кейс Михалыча', emoji: '🎣', price: 10000, level: 8, theme: 'Снасти и трофеи с Засранского пруда', loot: {
    common: [['🪱', 'Банка червей', 0.8], ['🧵', 'Леска «Китайская»', 0.85], ['👒', 'Панама рыбака', 1], ['🥾', 'Резиновые сапоги', 1.15], ['🐟', 'Вобла к пиву', 1.1]],
    uncommon: [['🪝', 'Блесна «Золотая рыбка»', 1.1], ['🔦', 'Налобный фонарик', 0.9], ['🫖', 'Закопчённый котелок', 0.95], ['🪑', 'Раскладной стульчик', 1]],
    rare: [['🛶', 'Надувная лодка', 1.15], ['🎣', 'Спиннинг «Шимано»', 1], ['📡', 'Эхолот', 0.9]],
    epic: [['🐋', 'Чучело сома-гиганта', 1.1], ['🥃', 'Фляга Михалыча', 0.9]],
    legend: [['🐠', 'Золотая рыбка', 1.1], ['🏅', 'Кубок «Рыбак района»', 0.95]] } },
  { id: 'suit', name: 'Чемодан Шныря', emoji: '🧳', price: 100000, level: 12, theme: 'Товар с рынка, «почти не краденый»', loot: {
    common: [['📼', 'Кассета «Терминатор»', 0.9], ['💿', 'Диск «Ласковый май»', 0.85], ['🧸', 'Плюшевый Чебурашка', 1], ['🔌', 'Удлинитель на 20 метров', 0.9], ['🧥', 'Кожанка «под Турцию»', 1.25]],
    uncommon: [['🎧', 'Наушники «Битс»', 1], ['🎮', 'Приставка «Денди»', 1.15], ['📟', 'Пейджер', 0.85], ['👝', 'Барсетка', 0.95]],
    rare: [['💻', 'Ноутбук «с гарантией»', 1.1], ['🛵', 'Мопед «Альфа»', 1.05], ['⌚', 'Часы «Ролекс» (почти)', 0.85]],
    epic: [['💎', 'Бриллиант «чистой воды»', 1.1], ['👟', 'Коллекция кроссовок', 0.9]],
    legend: [['🟡', 'Золотой слиток Шныря', 1], ['📜', 'Документы на весь рынок', 1.1]] } },
  { id: 'msk', name: 'Москвабадский кейс', emoji: '🏙️', price: 250000, level: 15, theme: 'Столичная жизнь в одном кейсе', loot: {
    common: [['☕', 'Раф на кокосовом', 0.8], ['🎫', 'Карта «Тройка» с нулём', 0.85], ['🧃', 'Смузи из сельдерея', 0.9], ['🧣', 'Шарф оверсайз', 1.15], ['🛴', 'Сломанный самокат', 1.2]],
    uncommon: [['🥑', 'Авокадо-тост с золотом', 0.9], ['🎟️', 'Билет в Большой театр', 1.15], ['🪴', 'Монстера в горшке', 0.85], ['📸', 'Полароид', 1.05]],
    rare: [['📱', 'Айфон последней модели', 1.1], ['🛋️', 'Диван из ЦУМа', 0.95], ['🚲', 'Складной «Бромптон»', 0.95]],
    epic: [['🔑', 'Ключи от студии', 1.1], ['🖼️', 'NFT с котиком', 0.9]],
    legend: [['🅿️', 'Место на парковке в Сити', 0.95], ['🪪', 'Пропуск на 95-й этаж', 1.05]] } },
  { id: 'safe', name: 'Сейф олигарха', emoji: '🗄️', price: 1000000, level: 18, theme: 'Что прячут те, у кого есть всё', loot: {
    common: [['📰', 'Акции «МММ»', 0.8], ['🧾', 'Чек из Куршевеля', 0.85], ['🖋️', 'Ручка «Монблан» б/у', 1.1], ['🍾', 'Пустой «Кристалл»', 0.9], ['🧦', 'Кашемировые носки', 1.2]],
    uncommon: [['⛳', 'Клюшка для гольфа', 0.95], ['🕰️', 'Часы «Брегет»', 1.15], ['🍷', 'Вино урожая 1982', 1], ['🐾', 'Ошейник со стразами', 0.85]],
    rare: [['🛥️', 'Модель яхты', 0.9], ['🌲', 'Подлинник Шишкина', 1.15], ['🚘', 'Ключи от «Майбаха»', 1]],
    epic: [['📿', 'Колье «Слеза Михалыча»', 1.05], ['🏝️', 'Остров в аренду', 0.95]],
    legend: [['👑', 'Корона Эдика', 1], ['🛩️', 'Личный самолёт', 1.1]] } },
  { id: 'gold', name: 'Золотой кейс', emoji: '🎁', caps: 15, value: 300000, level: 5, theme: 'Всё блестящее, что нашлось в районе', loot: {
    common: [['🪙', 'Монета «Олимпиада-80»', 1], ['🍫', 'Шоколадка в золотой фольге', 0.8], ['🎗️', 'Золотая ленточка', 0.85], ['🧧', 'Конверт с юанями', 1.15], ['🔑', 'Позолоченный ключ', 1.1]],
    uncommon: [['🥇', 'Медаль «За тапы»', 1], ['🏺', 'Ваза эпохи Мин (копия)', 0.9], ['🎻', 'Скрипка в футляре', 1.1], ['🔮', 'Янтарный шар', 0.95]],
    rare: [['🗡️', 'Сабля генерала', 1.05], ['🎖️', 'Орден Засранска', 0.95], ['🦚', 'Павлин-чучело', 1]],
    epic: [['🐉', 'Нефритовый дракон', 1], ['🥚', 'Яйцо Фаберже', 1.1]],
    legend: [['🗽', 'Золотая статуя Михалыча', 1.05], ['🫅', 'Корона Засранска', 1]] } },
];
// Старые сохранения: вещи без кейса (лента/иконки) берём из общего списка
const CASE_LOOT = Object.fromEntries(RARITY.map((r) => [r.id, CASES.flatMap((c) => c.loot[r.id])]));
function caseValue(c) { return c.value || c.price; }
function rollRarity() { let r = Math.random(); for (const x of RARITY) { if ((r -= x.chance) < 0) return x; } return RARITY[0]; }
function rollQuality() { let r = Math.random(); for (const x of QUALITY) { if ((r -= x.chance) < 0) return x; } return QUALITY[1]; }
function caseItemBase(c, rar, f) { return caseValue(c) * rar.k * f; }
function caseRollItem(c) {
  const rar = rollRarity(), [e, name, f] = pick(c.loot[rar.id]), q = rollQuality();
  const raw = caseItemBase(c, rar, f) * q.mult * rand(0.96, 1.04);
  const value = Math.max(10, raw >= 1000 ? Math.round(raw / 10) * 10 : Math.round(raw)); // крупные — до десятков, мелкие — до рубля, чтобы разброс не вышел за ±5%
  return { key: `${c.id}:${name}:${q.id}`, e, name, rar: rar.id, q: q.id, value, from: c.id };
}
function qualityName(it) { const q = QUALITY.find((x) => x.id === it.q); return q ? q.name : ''; }function fleaInv() { if (!Array.isArray(S.flea)) S.flea = []; return S.flea; }
// Цена вещи фиксированная — её определили редкость, вещь и качество при выпадении
function fleaPrice(it) { return it.value; }

CASINO_GAMES.push(
  { act: 'cases', cls: 'cases', emoji: '📦', name: 'Кейсы не как в кс', desc: 'Тематические кейсы с вещами, которых больше нигде нет. Выбей легенду и продай на барахолке' },
  { act: 'flea', cls: 'flea', emoji: '🛍️', name: 'Барахолка', desc: 'Продавай вещи из кейсов. Цена зависит от редкости и качества' },
);

function openCases() {
  openModal(`<h3>📦 Кейсы не как в кс</h3><p>У каждого кейса своя тема и свои вещи — больше их нигде не найти. Вещь выпадает одной из пяти редкостей и в одном из четырёх качеств: от «Как новое» до «Убитое». Продать можно сразу или позже на барахолке — цена не меняется.</p>
    <div class="case-odds">${RARITY.map((r) => `<span style="--c:${r.color}">${r.name} ${Math.round(r.chance * 1000) / 10}%</span>`).join('')}</div>
    <div class="list">${CASES.map((c) => {
      const ok = level() >= c.level, can = c.caps ? S.caps >= c.caps : S.money >= c.price;
      return card({ thumb: c.emoji, title: c.name, cls: ok ? '' : 'locked',
        desc: `${c.theme}. Вещи от ${fmt(Math.round(caseValue(c) * 0.1))} до ${fmt(Math.round(caseValue(c) * 21))} ₽${c.caps ? '<br><b style="color:var(--gold)">Премиум-кейс за крышки</b>' : ''}`,
        btn: !ok ? `<button class="btn" disabled data-why="Нужен ${c.level} уровень">🔒 ${c.level} ур.</button>`
          : `<button class="btn ${can ? 'primary' : ''}" data-act="caseOpen" data-id="${c.id}" ${can ? '' : `disabled data-why="Не хватает ${c.caps ? 'крышек' : 'денег'}"`}>${c.caps ? `🟡 ${c.caps}` : `${fmt(c.price)} ₽`}</button>` });
    }).join('')}</div>
    <div class="btns"><button class="btn wide" data-act="flea">🛍️ На барахолку (${fleaInv().length})</button><button class="btn wide" data-act="close">Закрыть</button></div>`, { center: true });
}

function caseOpen(id) {
  const c = CASES.find((x) => x.id === id);
  if (!c || level() < c.level) return;
  if (c.caps ? S.caps < c.caps : S.money < c.price) { toast('Не хватает на кейс', 'bad'); return; }
  if (c.caps) S.caps -= c.caps; else S.money -= c.price;
  track('caseOpen');
  const win = caseRollItem(c);
  // Лента как в CS: 44 вещи, выигрышная — 38-я
  const strip = Array.from({ length: 44 }, (_, i) => (i === 38 ? win : caseRollItem(c)));
  openModal(`<h3>${c.emoji} ${c.name}</h3>
    <div class="case-roll"><div class="case-marker"></div><div class="case-strip" id="caseStrip">${strip.map((it) => `<div class="case-it" style="--c:${RARITY.find((r) => r.id === it.rar).color}"><span>${it.e}</span><small>${it.name}</small></div>`).join('')}</div></div>
    <div id="caseResult" class="case-result"></div>`, { center: true, locked: true });
  sfx('whoosh');
  const W = 96; // ширина ячейки с отступом
  const box = document.querySelector('.case-roll');
  const target = 38 * W - box.clientWidth / 2 + W / 2 + rand(-30, 30);
  const el = $('caseStrip');
  el.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-target}px)` }], { duration: 4200, easing: 'cubic-bezier(.12,.75,.18,1)', fill: 'forwards' });
  let ticks = 0;
  const tick = setInterval(() => { if (++ticks > 26) clearInterval(tick); sfx('tick'); }, 140);
  setTimeout(() => {
    clearInterval(tick);
    const rar = RARITY.find((r) => r.id === win.rar);
    sfx(rar.id === 'legend' || rar.id === 'epic' ? 'jackpot' : rar.id === 'rare' ? 'win' : 'coin');
    if (rar.id === 'legend' || rar.id === 'epic') confetti(rar.id === 'legend' ? 150 : 70);
    haptic(rar.id === 'common' ? 'light' : 'success');
    fleaInv().push(win);
    track('caseItem');
    if (rar.id === 'legend') track('caseLegend');
    save();
    $('caseResult').innerHTML = `<div class="case-win" style="--c:${rar.color}"><span>${win.e}</span><div><b>${win.name}</b><small>${rar.name} · ${qualityName(win)} · стоит ${fmt(fleaPrice(win))} ₽</small></div></div>
      <div class="btns"><button class="btn primary wide" data-act="fleaSellLast">💰 Продать сразу за ${fmt(fleaPrice(win))} ₽</button>
        <button class="btn wide" data-act="caseAgain" data-id="${c.id}">🔁 Ещё кейс</button>
        <button class="btn wide" data-act="cases">🛍️ Оставить на барахолке</button></div>`;
  }, 4400);
}

function openFlea() {
  const inv = fleaInv();
  const total = inv.reduce((a, it) => a + fleaPrice(it), 0);
  const cheap = inv.filter((it) => it.rar === 'common' || it.rar === 'uncommon');
  openModal(`<h3>🛍️ Барахолка</h3><p>Вещи из кейсов. Цена каждой зависит от редкости и качества и не меняется.</p>
    ${inv.length ? `<div class="info-card">Всего вещей: <b>${inv.length}</b> на <b>${fmt(total)} ₽</b></div>
      <div class="list">${inv.map((it, i) => { const rar = RARITY.find((r) => r.id === it.rar); const p = fleaPrice(it); return card({ thumb: it.e, title: `${it.name} <span class="rarity" style="background:${rar.color}33;color:${rar.color}">${rar.name}</span>`,
        desc: `${it.q ? qualityName(it) + ' · ' : ''}<b>${fmt(p)} ₽</b>`, btn: `<button class="btn primary small" data-act="fleaSell" data-id="${i}">Продать</button>` }); }).join('')}</div>
      <div class="btns">${cheap.length ? `<button class="btn wide" data-act="fleaSellCheap">Продать ширпотреб и ходовое (${cheap.length})</button>` : ''}<button class="btn primary wide" data-act="fleaSellAll">Продать всё за ${fmt(total)} ₽</button></div>`
      : '<div class="info-card">Тут пока пусто. Открой кейс в казино — выпавшие вещи появятся здесь.</div>'}
    <div class="btns">${inv.length >= 5 ? '<button class="btn wide" data-act="contracts">📝 Контракты</button>' : ''}<button class="btn wide" data-act="cases">📦 К кейсам</button><button class="btn wide" data-act="close">Закрыть</button></div>`, { center: true });
}

function fleaSell(indexes) {
  const inv = fleaInv();
  const idx = [...new Set(indexes)].filter((i) => inv[i]).sort((a, b) => b - a);
  if (!idx.length) return 0;
  let sum = 0;
  idx.forEach((i) => { sum += fleaPrice(inv[i]); inv.splice(i, 1); });
  addMoney(sum);
  track('fleaSold', idx.length);
  sfx('coin');
  toast(`🛍️ Продано ${idx.length} шт. за ${fmt(sum)} ₽`, 'good');
  saveSoon();
  return sum;
}

Object.assign(ACTIONS, {
  cases: () => openCases(),
  flea: () => openFlea(),
  caseOpen: (id) => caseOpen(id),
  caseAgain: (id) => caseOpen(id),
  fleaSell: (i) => { fleaSell([+i]); openFlea(); },
  fleaSellLast: () => { fleaSell([fleaInv().length - 1]); openCases(); },
  fleaSellAll: () => { fleaSell(fleaInv().map((_, i) => i)); openFlea(); },
  fleaSellCheap: () => { fleaSell(fleaInv().map((it, i) => (it.rar === 'common' || it.rar === 'uncommon' ? i : -1)).filter((i) => i >= 0)); openFlea(); },
});

ACHS.push(
  { id: 'cases', name: 'Кейсовод', emoji: '📦', key: 'caseOpen', goals: [5, 50, 250, 1000], unit: 'кейсов открыто' },
  { id: 'legend_drop', name: 'Легендарная удача', emoji: '👑', key: 'caseLegend', goals: [1, 5, 20], unit: 'легенд из кейсов' },
  { id: 'contracts', name: 'Подрядчик', emoji: '📝', key: 'contractSign', goals: [1, 10, 50, 200], unit: 'контрактов подписано' },
);

// =====================================================================
// КОНТРАКТЫ: собираем 5 вещей одного качества/редкости и крафтим 1 лучше
// =====================================================================

function openContracts() {
  const inv = fleaInv();
  if (inv.length < 5) { toast('Для контракта нужны минимум 5 вещей', 'info'); openFlea(); return; }
  if (!S.contractPicked) S.contractPicked = [];
  const picked = S.contractPicked;
  const refresh = () => {
    const left = 5 - picked.length;
    const ok = left === 0;
    $('ctItems').innerHTML = inv.map((it, i) => {
      const sel = picked.includes(i);
      const rar = RARITY.find((r) => r.id === it.rar);
      return `<label class="contract-item${sel ? ' sel' : ''}" data-idx="${i}"><input type="checkbox" ${sel ? 'checked' : ''} ${ok && !sel ? 'disabled' : ''}><div class="case-it" style="--c:${rar.color}"><span>${it.e}</span><small>${it.name}</small></div></label>`;
    }).join('');
    $('ctBtn').innerHTML = ok ? '<button class="btn primary wide" data-act="contractSign">📝 Подписать контракт</button>' : `<div style="color:var(--text-dim)">Выбери 5 вещей: осталось ${left}</div>`;
    document.querySelectorAll('.contract-item input').forEach((cb) => cb.addEventListener('change', (e) => {
      const idx = +e.target.closest('.contract-item').dataset.idx;
      if (e.target.checked) { if (picked.length < 5) picked.push(idx); } else picked.splice(picked.indexOf(idx), 1);
      refresh();
    }));
  };
  openModal(`<h3>📝 Контракты</h3><p>Выбери 5 вещей и обменяй на одну новую. Может выпасть лучше, та же или хуже — зависит от редкости и качества.</p>
    <div class="contract-grid" id="ctItems"></div><div class="btns" id="ctBtn"></div>
    <div class="btns"><button class="btn wide" data-act="flea">⬅️ К барахолке</button></div>`, { center: true });
  refresh();
}

function contractSign() {
  const inv = fleaInv();
  const picked = [...new Set(S.contractPicked || [])].filter((i) => inv[i]).slice(0, 5);
  if (picked.length < 5) { toast('Нужно выбрать 5 вещей', 'info'); return; }
  const items = picked.map((i) => inv[i]);
  // Шансы: берём среднее качество и редкость → распределяем шансы
  const avgQual = items.reduce((a, it) => a + QUALITY.findIndex((q) => q.id === it.q), 0) / 5;
  const avgRar = items.reduce((a, it) => a + RARITY.findIndex((r) => r.id === it.rar), 0) / 5;
  const qualChances = QUALITY.map((q, i) => {
    const dist = Math.abs(i - avgQual);
    return { id: q.id, name: q.name, chance: Math.max(0, 40 - dist * 15) };
  }).filter((x) => x.chance > 0);
  const rarChances = RARITY.map((r, i) => {
    const dist = Math.abs(i - avgRar);
    return { id: r.id, name: r.name, color: r.color, chance: Math.max(0, 35 - dist * 12) };
  }).filter((x) => x.chance > 0);
  const totalQ = qualChances.reduce((a, x) => a + x.chance, 0);
  const totalR = rarChances.reduce((a, x) => a + x.chance, 0);
  qualChances.forEach((x) => x.chance = Math.round((x.chance / totalQ) * 100));
  rarChances.forEach((x) => x.chance = Math.round((x.chance / totalR) * 100));

  openModal(`<h3>📝 Подписать контракт</h3><p>Обмениваешь 5 вещей на 1 новую. Шансы:</p>
    <div class="contract-chances"><div><b>Качество:</b> ${qualChances.map((x) => `${x.name} ${x.chance}%`).join(' · ')}</div>
    <div><b>Редкость:</b> ${rarChances.map((x) => `<span style="color:${x.color}">${x.name} ${x.chance}%</span>`).join(' · ')}</div></div>
    <div class="btns"><button class="btn primary wide" data-act="contractRoll">✍️ Подписать и открыть</button>
      <button class="btn wide" data-act="contracts">⬅️ Назад</button></div>`, { center: true });
}

function contractRoll() {
  const inv = fleaInv();
  const picked = [...new Set(S.contractPicked || [])].filter((i) => inv[i]).slice(0, 5).sort((a, b) => b - a);
  if (picked.length < 5) return;
  const items = picked.map((i) => inv[i]);
  const avgQual = items.reduce((a, it) => a + QUALITY.findIndex((q) => q.id === it.q), 0) / 5;
  const avgRar = items.reduce((a, it) => a + RARITY.findIndex((r) => r.id === it.rar), 0) / 5;
  const qualIdx = Math.round(avgQual + (Math.random() < 0.4 ? 0 : Math.random() < 0.5 ? -1 : 1));
  const rarIdx = Math.round(avgRar + (Math.random() < 0.35 ? 0 : Math.random() < 0.5 ? -1 : 1));
  const newQ = QUALITY[Math.max(0, Math.min(QUALITY.length - 1, qualIdx))];
  const newR = RARITY[Math.max(0, Math.min(RARITY.length - 1, rarIdx))];
  const casePool = CASES.filter((c) => c.loot[newR.id] && c.loot[newR.id].length);
  const c = casePool.length ? pick(casePool) : CASES[0];
  const [e, name, f] = pick(c.loot[newR.id] || c.loot.common);
  const raw = caseItemBase(c, newR, f) * newQ.mult * rand(0.96, 1.04);
  const value = Math.max(10, raw >= 1000 ? Math.round(raw / 10) * 10 : Math.round(raw));
  const win = { key: `${c.id}:${name}:${newQ.id}`, e, name, rar: newR.id, q: newQ.id, value, from: 'contract' };

  picked.forEach((i) => inv.splice(i, 1));
  fleaInv().push(win);
  track('contractSign');
  save();
  S.contractPicked = [];

  openModal(`<h3>📝 Контракт подписан</h3><div class="contract-anim" id="ctAn"></div>`, { center: true, locked: true });
  const an = $('ctAn');
  an.innerHTML = '<div class="contract-spinner">⚙️</div>';
  sfx('whoosh');
  setTimeout(() => {
    an.innerHTML = `<div class="case-win" style="--c:${newR.color}"><span>${win.e}</span><div><b>${win.name}</b><small>${newR.name} · ${newQ.name} · стоит ${fmt(value)} ₽</small></div></div>
      <div class="btns"><button class="btn primary wide" data-act="fleaSellLast">💰 Продать за ${fmt(value)} ₽</button>
        <button class="btn wide" data-act="contracts">📝 Ещё контракт</button>
        <button class="btn wide" data-act="flea">🛍️ На барахолку</button></div>`;
    sfx(newR.id === 'legend' || newR.id === 'epic' ? 'jackpot' : 'coin');
    if (newR.id === 'legend') confetti(100);
    haptic('success');
  }, 3000);
}

CASINO_GAMES.push({ act: 'contracts', cls: 'contracts', emoji: '📝', name: 'Контракты', desc: 'Обменяй 5 вещей из барахолки на 1 новую. Шанс на улучшение' });
Object.assign(ACTIONS, { contracts: () => openContracts(), contractSign: () => contractSign(), contractRoll: () => contractRoll() });

