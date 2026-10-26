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
    if (!crashOnline()) { orig(); return; }
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
        <input id="crashAutoX" type="number" step="0.1" min="1.05" max="100" value="${S.crashAuto || CRASH_AUTO_DEFAULT}"><span>x</span></div>
      <div class="btns"><button class="btn primary wide" data-act="crash2Btn" id="crashBtn">…</button></div>
      <div class="crash-players" id="crashPlayers"></div>
      <small class="crash-note">Одна ракета на всех игроков. Ставка — только пока идёт приём (15 секунд). Автовывод заберёт деньги сам, даже если закроешь окно</small>`, { center: true });
    const saveAuto = () => { const on = $('crashAutoOn').checked; const x = Math.max(1.05, Math.min(100, +$('crashAutoX').value || CRASH_AUTO_DEFAULT)); S.crashAuto = on ? x : 0; };
    $('crashAutoOn').onchange = saveAuto; $('crashAutoX').onchange = saveAuto;
    CR2 = { view: null, dt: 0, lastId: 0, busy: false };
    crash2Poll();
    CR2.timer = setInterval(crash2Poll, 800);
    const frame = () => { if (!CR2 || !$('crashMult')) { crash2Stop(); return; } crash2Draw(); CR2.raf = requestAnimationFrame(frame); };
    CR2.raf = requestAnimationFrame(frame);
  };
})(openCrash);

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

// Одиночная ракета (без сервера) тоже получила автовывод
crashGo = (function (orig) {
  return function (btn) {
    orig(btn);
    if (!CR || !CR.running || !S.crashAuto || CR.autoHook) return;
    CR.autoHook = true;
    const check = () => { if (!CR || !CR.running) return; if (!CR.cashed && CR.m >= S.crashAuto) { orig(btn); return; } requestAnimationFrame(check); };
    requestAnimationFrame(check);
  };
})(crashGo);

// =====================================================================
// 3. Кейсы и Барахолка
// =====================================================================
const RARITY = [
  { id: 'common', name: 'Ширпотреб', color: '#9AA4B2', chance: 0.6, mult: [0.2, 0.4] },
  { id: 'uncommon', name: 'Ходовое', color: '#4B8BF5', chance: 0.25, mult: [0.6, 1.0] },
  { id: 'rare', name: 'Редкое', color: '#9B59F5', chance: 0.1, mult: [1.5, 2.5] },
  { id: 'epic', name: 'Эпическое', color: '#E84393', chance: 0.04, mult: [4, 6] },
  { id: 'legend', name: 'Легенда', color: '#F2B33D', chance: 0.01, mult: [10, 20] },
];
const CASE_LOOT = {
  common: [['🧦', 'Носки «Абибас»'], ['🔋', 'Батарейки'], ['🧴', 'Одеколон «Шипр»'], ['🪥', 'Зубная щётка'], ['🧤', 'Перчатки']],
  uncommon: [['⌚', 'Часы «Командирские»'], ['🕶️', 'Очки-авиаторы'], ['🎧', 'Наушники'], ['🧢', 'Кепка с автографом']],
  rare: [['📱', 'Смартфон'], ['💍', 'Перстень'], ['🎸', 'Гитара'], ['📷', 'Плёночный фотик']],
  epic: [['💎', 'Бриллиант'], ['🖼️', 'Картина «Под Айвазовского»'], ['🏆', 'Кубок района']],
  legend: [['👑', 'Корона Эдика'], ['🟡', 'Золотой слиток'], ['🗿', 'Статуя Михалыча']],
};
const CASES = [
  { id: 'box', name: 'Картонная коробка', emoji: '📦', price: 1000, level: 5 },
  { id: 'bag', name: 'Спортивная сумка', emoji: '🎒', price: 10000, level: 8 },
  { id: 'suit', name: 'Чемодан Шныря', emoji: '🧳', price: 100000, level: 12 },
  { id: 'safe', name: 'Сейф олигарха', emoji: '🗄️', price: 1000000, level: 18 },
  { id: 'gold', name: 'Золотой кейс', emoji: '🎁', caps: 15, value: 300000, level: 5 },
];
function caseValue(c) { return c.value || c.price; }
function rollRarity() { let r = Math.random(); for (const x of RARITY) { if ((r -= x.chance) < 0) return x; } return RARITY[0]; }
function caseRollItem(c) {
  const rar = rollRarity(), [e, name] = pick(CASE_LOOT[rar.id]);
  return { key: `${c.id}:${rar.id}:${name}`, e, name, rar: rar.id, value: Math.round(caseValue(c) * rand(rar.mult[0], rar.mult[1]) / 10) * 10, from: c.id };
}
function fleaInv() { if (!Array.isArray(S.flea)) S.flea = []; return S.flea; }
// Цена на барахолке плавает в пределах ±12% по часам — можно ловить момент
function fleaPrice(it, t = Date.now()) { const h = t / 3600000, k = it.name.length + it.value % 7; return Math.round(it.value * (1 + 0.12 * Math.sin(h * 0.7 + k))); }

CASINO_GAMES.push(
  { act: 'cases', cls: 'cases', emoji: '📦', name: 'Кейсы', desc: 'Открой кейс — вдруг выпадет легенда! Вещи продаются на барахолке' },
  { act: 'flea', cls: 'flea', emoji: '🛍️', name: 'Барахолка', desc: 'Продавай вещи из кейсов. Цены меняются каждый час' },
);

function openCases() {
  openModal(`<h3>📦 Кейсы</h3><p>Открываешь кейс — выпадает вещь одной из пяти редкостей. Её можно сразу продать или оставить на барахолке и дождаться цены получше.</p>
    <div class="case-odds">${RARITY.map((r) => `<span style="--c:${r.color}">${r.name} ${Math.round(r.chance * 1000) / 10}%</span>`).join('')}</div>
    <div class="list">${CASES.map((c) => {
      const ok = level() >= c.level, can = c.caps ? S.caps >= c.caps : S.money >= c.price;
      return card({ thumb: c.emoji, title: c.name, cls: ok ? '' : 'locked',
        desc: `Вещи стоимостью ${fmt(Math.round(caseValue(c) * 0.2))}–${fmt(caseValue(c) * 20)} ₽${c.caps ? '<br><b style="color:var(--gold)">Премиум-кейс за крышки</b>' : ''}`,
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
    $('caseResult').innerHTML = `<div class="case-win" style="--c:${rar.color}"><span>${win.e}</span><div><b>${win.name}</b><small>${rar.name} · стоит ${fmt(fleaPrice(win))} ₽</small></div></div>
      <div class="btns"><button class="btn primary wide" data-act="fleaSellLast">💰 Продать сразу за ${fmt(fleaPrice(win))} ₽</button>
        <button class="btn wide" data-act="caseAgain" data-id="${c.id}">🔁 Ещё кейс</button>
        <button class="btn wide" data-act="cases">🛍️ Оставить на барахолке</button></div>`;
  }, 4400);
}

function openFlea() {
  const inv = fleaInv();
  const total = inv.reduce((a, it) => a + fleaPrice(it), 0);
  const cheap = inv.filter((it) => it.rar === 'common' || it.rar === 'uncommon');
  openModal(`<h3>🛍️ Барахолка</h3><p>Вещи из кейсов. Цена каждой меняется в течение часа (±12%) — можно продать сразу или подождать.</p>
    ${inv.length ? `<div class="info-card">Всего вещей: <b>${inv.length}</b> на <b>${fmt(total)} ₽</b></div>
      <div class="list">${inv.map((it, i) => { const rar = RARITY.find((r) => r.id === it.rar); const p = fleaPrice(it); return card({ thumb: it.e, title: `${it.name} <span class="rarity" style="background:${rar.color}33;color:${rar.color}">${rar.name}</span>`,
        desc: `Цена сейчас: <b>${fmt(p)} ₽</b>${p > it.value ? ' 📈' : p < it.value ? ' 📉' : ''}`, btn: `<button class="btn primary small" data-act="fleaSell" data-id="${i}">Продать</button>` }); }).join('')}</div>
      <div class="btns">${cheap.length ? `<button class="btn wide" data-act="fleaSellCheap">Продать ширпотреб и ходовое (${cheap.length})</button>` : ''}<button class="btn primary wide" data-act="fleaSellAll">Продать всё за ${fmt(total)} ₽</button></div>`
      : '<div class="info-card">Тут пока пусто. Открой кейс в казино — выпавшие вещи появятся здесь.</div>'}
    <div class="btns"><button class="btn wide" data-act="cases">📦 К кейсам</button><button class="btn wide" data-act="close">Закрыть</button></div>`, { center: true });
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
);
