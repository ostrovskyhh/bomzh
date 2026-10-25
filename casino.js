// Казино «Золотая крышка»: лобби, рулетка, кости, «Ракета» (crash) + слоты и блекджек из game.js.
// В зале играет лаунж-джаз (audio.js). Ставки только в игровых рублях.

function inCasino() { return currentScreen === 'fun' && TABS.fun === 'casino' && level() >= CASINO_LEVEL; }
function syncMusic() { if (typeof Sound !== 'undefined') Sound.music(inCasino() ? 'lounge' : null); }
HOOKS.screen.push(syncMusic);
document.addEventListener('visibilitychange', () => { if (!document.hidden) syncMusic(); });

const CASINO_GAMES = [
  { act: 'slots', cls: 'slots', emoji: '🎰', name: 'Слоты «Три бутылки»', desc: 'До x15, джекпот 7️⃣7️⃣7️⃣ — x100' },
  { act: 'bj', cls: 'bj', emoji: '🃏', name: 'Блекджек', desc: 'Набери 21 и обыграй крупье. Блекджек 3:2' },
  { act: 'roulette', cls: 'roul', emoji: '🎡', name: 'Рулетка', desc: 'Красное, чёрное, дюжины, зеро x36' },
  { act: 'dice', cls: 'dice', emoji: '🎲', name: 'Кости Михалыча', desc: 'Больше, меньше или ровно семь' },
  { act: 'crash', cls: 'crash', emoji: '🚀', name: 'Ракета', desc: 'Множитель растёт — забери до взрыва' },
];

EXTRA_TABS.fun.casino = () => {
  if (level() < CASINO_LEVEL) {
    return `<div class="info-card" style="text-align:center;padding:24px"><div style="font-size:64px">🕴️</div>
      <b style="font-size:17px">Охранник казино: «Не, Валера. С ${CASINO_LEVEL} уровня»</b><br><br>
      Твой уровень: <b>${level()}</b>. Опыт даётся за тапы, мусорку, события, учёбу, работу и спорт.
      <div class="progress" style="margin-top:12px"><div style="width:${(levelInfo().cur / levelInfo().need) * 100}%;background:var(--blue)"></div></div></div>`;
  }
  return `<div class="casino-lobby">
      <div class="lobby-sign">★ ЗОЛОТАЯ КРЫШКА ★</div>
      <div class="lobby-sub">казино · бар · живая музыка</div>
    </div>
    ${CASINO_GAMES.map((g) => `<button class="casino-hero ${g.cls}" data-act="${g.act}"><span class="e">${g.emoji}</span><div><b>${g.name}</b><p>${g.desc}</p></div><i class="shine"></i></button>`).join('')}
    <p class="test-note">Ставки — только игровые рубли. Казино всегда в плюсе 😉 ${S.settings.music ? '🎷 Играет музыка' : '🔇 Музыка выключена в настройках'}</p>`;
};

// =====================================================================
// Рулетка (европейская, одно зеро)
// =====================================================================

const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const REDS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const ROUL_BETS = [
  { id: 'red', name: '🔴 Красное', x: 2, win: (n) => REDS.includes(n) },
  { id: 'black', name: '⚫ Чёрное', x: 2, win: (n) => n > 0 && !REDS.includes(n) },
  { id: 'even', name: 'Чёт', x: 2, win: (n) => n > 0 && n % 2 === 0 },
  { id: 'odd', name: 'Нечет', x: 2, win: (n) => n % 2 === 1 },
  { id: 'low', name: '1–18', x: 2, win: (n) => n >= 1 && n <= 18 },
  { id: 'high', name: '19–36', x: 2, win: (n) => n >= 19 },
  { id: 'd1', name: '1–12', x: 3, win: (n) => n >= 1 && n <= 12 },
  { id: 'd2', name: '13–24', x: 3, win: (n) => n >= 13 && n <= 24 },
  { id: 'd3', name: '25–36', x: 3, win: (n) => n >= 25 },
  { id: 'zero', name: '🟢 Зеро', x: 36, win: (n) => n === 0 },
];
// Отдельные числа 0–36: прямая ставка ×36
for (let n = 0; n <= 36; n++) if (n) ROUL_BETS.push({ id: 'n' + n, name: String(n), x: 36, num: true, win: (k) => k === n });
let roulAngle = 0, roulBet = 'red', roulSpinning = false;
// Несколько ставок за спин: { id ставки: сумма фишек }
let ROUL_STAKES = {};
function roulTotal() { return Object.values(ROUL_STAKES).reduce((a, b) => a + b, 0); }

function wheelSVG() {
  const a = 360 / WHEEL.length, R = 120, c = 130;
  const pt = (deg, r) => { const t = (deg - 90) * Math.PI / 180; return `${c + r * Math.cos(t)} ${c + r * Math.sin(t)}`; };
  const wedges = WHEEL.map((n, i) => {
    const s = i * a - a / 2, e = i * a + a / 2;
    const color = n === 0 ? '#1F8A4D' : REDS.includes(n) ? '#B3122E' : '#16161C';
    return `<path d="M${c} ${c}L${pt(s, R)}A${R} ${R} 0 0 1 ${pt(e, R)}Z" fill="${color}" stroke="#C9A23A" stroke-width=".6"/>
      <text x="${c}" y="${c - R + 13}" transform="rotate(${i * a} ${c} ${c})" text-anchor="middle" font-size="10" font-weight="700" fill="#fff" font-family="sans-serif">${n}</text>`;
  }).join('');
  return `<svg viewBox="0 0 260 260" class="wheel"><circle cx="130" cy="130" r="128" fill="#5A3A12" stroke="#E9B530" stroke-width="4"/>
    <g id="wheelRot" style="transform-origin:130px 130px">${wedges}<circle cx="130" cy="130" r="78" fill="#3A2408" stroke="#C9A23A" stroke-width="2"/>
    <circle cx="130" cy="130" r="56" fill="#2A1A06"/>${[0, 60, 120, 180, 240, 300].map((d) => `<rect x="127" y="78" width="6" height="40" rx="3" fill="#E9B530" transform="rotate(${d} 130 130)"/>`).join('')}
    <circle cx="130" cy="130" r="14" fill="#F6CF55"/></g></svg>`;
}

function chipLabel(v) { return v >= 1000000 ? `${v / 1000000}M` : v >= 1000 ? `${Math.round(v / 100) / 10}K` : String(v); }

function roulBoardHTML() {
  const cell = (b) => {
    const st = ROUL_STAKES[b.id];
    const color = b.num ? (REDS.includes(+b.name) ? 'red' : 'black') : b.id === 'zero' ? 'zero' : '';
    return `<button class="${b.num ? 'rn ' + color : ''} ${b.id === 'zero' ? 'rz' : ''}" data-act="roulBet" data-id="${b.id}" data-silent="1">${b.name}${b.num ? '' : `<small>x${b.x}</small>`}${st ? `<i class="chip-on">${chipLabel(st)}</i>` : ''}</button>`;
  };
  return `<div class="roul-bets" id="roulBets">${ROUL_BETS.filter((b) => !b.num).map(cell).join('')}</div>
    <div class="roul-nums">${ROUL_BETS.filter((b) => b.num).map(cell).join('')}</div>
    <div class="roul-sum">Ставок: <b>${Object.keys(ROUL_STAKES).length}</b> · всего <b>${fmt(roulTotal())} ₽</b>
      <button class="btn small" data-act="roulClear" data-silent="1" ${roulTotal() ? '' : 'disabled data-why="Ставок пока нет"'}>Сбросить</button></div>`;
}
function roulRefresh() { const el = $('roulBoard'); if (el) el.innerHTML = roulBoardHTML(); }

function openRoulette() {
  ROUL_STAKES = {};
  openModal(`<h3>🎡 Рулетка</h3>
    <div class="roul-wrap"><div class="roul-pointer">▼</div>${wheelSVG()}<div class="roul-result" id="roulRes"></div></div>
    <p class="mg-hint">Выбери фишку и тапай по полям — можно ставить на несколько сразу. Число — ×36.</p>
    ${betPicker()}
    <div id="roulBoard">${roulBoardHTML()}</div>
    <div class="btns"><button class="btn primary wide" data-act="roulSpin" id="roulBtn">Крутить</button></div>`, { center: true });
  $('wheelRot').style.transform = `rotate(${roulAngle}deg)`;
}

function roulSpin() {
  if (roulSpinning) return;
  const total = roulTotal();
  if (!total) { toast('Сначала поставь фишки на поля', 'bad'); return; }
  if (S.money < total) { toast(`Не хватает ${fmt(total - S.money)} ₽ на все ставки`, 'bad'); return; }
  S.money -= total;
  const stakes = { ...ROUL_STAKES };
  roulSpinning = true;
  $('roulBtn').disabled = true;
  $('roulRes').className = 'roul-result';
  const idx = Math.floor(Math.random() * WHEEL.length);
  const n = WHEEL[idx];
  const a = 360 / WHEEL.length;
  const base = roulAngle - (roulAngle % 360);
  roulAngle = base + 360 * 6 + (360 - idx * a);
  const rot = $('wheelRot');
  rot.style.transition = 'transform 5s cubic-bezier(.12,.75,.16,1)';
  rot.style.transform = `rotate(${roulAngle}deg)`;
  // Щелчки шарика замедляются вместе с колесом
  let t = 0;
  for (let i = 0; i < 26; i++) { t += 60 + i * i * 0.55; setTimeout(() => { if ($('roulRes')) sfx('tick'); }, t); }
  track('casino');
  setTimeout(() => {
    roulSpinning = false;
    if (!$('roulRes')) return;
    // Каждая ставка считается отдельно
    let win = 0, best = 0;
    for (const [id, v] of Object.entries(stakes)) {
      const b = ROUL_BETS.find((x) => x.id === id);
      if (b && b.win(n)) { win += v * b.x; best = Math.max(best, b.x); }
    }
    const color = n === 0 ? 'zero' : REDS.includes(n) ? 'red' : 'black';
    $('roulRes').className = `roul-result show ${color}`;
    $('roulRes').textContent = n;
    const net = win - total;
    if (win) { addMoney(win); track('roulWin'); }
    if (net > 0) { addMood(Math.min(20, 4 + best)); sfx(best >= 36 ? 'jackpot' : 'win'); if (best >= 3 || net > total) confetti(50); toast(`🎡 ${n}! Выигрыш ${fmt(win)} ₽ (чистыми +${fmt(net)})`, 'good'); }
    else if (win) { sfx('coin'); toast(`🎡 ${n}. Вернул ${fmt(win)} из ${fmt(total)} ₽`, 'bad'); }
    else { addMood(-3); sfx('lose'); toast(`🎡 Выпало ${n}. Все ставки сгорели`, 'bad'); }
    $('roulBtn').disabled = false;
    // Ставки остаются на столе — можно сразу крутить ещё раз тем же набором
    document.querySelector('.bets').outerHTML = betPicker();
    roulRefresh();
    updateHud(); save();
  }, 5100);
}

// =====================================================================
// Кости Михалыча
// =====================================================================

const DICE_BETS = [
  { id: 'low', name: 'Меньше 7', x: 2.25, win: (a, b) => a + b < 7 },
  { id: 'seven', name: 'Ровно 7', x: 5.5, win: (a, b) => a + b === 7 },
  { id: 'high', name: 'Больше 7', x: 2.25, win: (a, b) => a + b > 7 },
  { id: 'double', name: 'Дубль', x: 5.5, win: (a, b) => a === b },
];
let diceBet = 'high', diceRolling = false;
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
function dieHTML(v) { return `<div class="die">${Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[v].includes(i) ? 'on' : ''}"></i>`).join('')}</div>`; }

function openDice() {
  openModal(`<h3>🎲 Кости Михалыча</h3>
    <div class="dice-table"><div class="dice-pair" id="dicePair">${dieHTML(3)}${dieHTML(4)}</div><div class="dice-sum" id="diceSum">Михалыч трясёт стакан…</div></div>
    <div class="roul-bets four">${DICE_BETS.map((b) => `<button class="${b.id === diceBet ? 'on' : ''}" data-act="diceBet" data-id="${b.id}" data-silent="1">${b.name}<small>x${b.x}</small></button>`).join('')}</div>
    ${betPicker()}
    <div class="btns"><button class="btn primary wide" data-act="diceRoll" id="diceBtn">Бросить</button></div>`, { center: true });
}

async function diceRoll() {
  if (diceRolling) return;
  const bet = S.bet;
  if (S.money < bet) { toast('Не хватает денег на ставку', 'bad'); return; }
  S.money -= bet;
  diceRolling = true;
  $('diceBtn').disabled = true;
  sfx('dice');
  track('casino');
  const a = 1 + Math.floor(Math.random() * 6), b = 1 + Math.floor(Math.random() * 6);
  for (let i = 0; i < 9; i++) {
    if (!$('dicePair')) { diceRolling = false; return; }
    $('dicePair').innerHTML = dieHTML(1 + Math.floor(Math.random() * 6)) + dieHTML(1 + Math.floor(Math.random() * 6));
    $('dicePair').classList.toggle('tumble');
    await wait(70 + i * 12);
  }
  diceRolling = false;
  if (!$('dicePair')) return;
  $('dicePair').innerHTML = dieHTML(a) + dieHTML(b);
  $('dicePair').animate([{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'cubic-bezier(.2,1.6,.4,1)' });
  sfx('reelStop');
  const bt = DICE_BETS.find((x) => x.id === diceBet);
  const won = bt.win(a, b);
  $('diceSum').innerHTML = `${a} + ${b} = <b>${a + b}</b>${a === b ? ' · дубль!' : ''} — ${won ? `<span style="color:var(--green)">+${fmt(bet * bt.x)} ₽</span>` : '<span style="color:var(--red)">мимо</span>'}`;
  if (won) { addMoney(Math.round(bet * bt.x)); addMood(6); sfx('win'); if (bt.x > 3) confetti(40); } else { addMood(-3); sfx('lose'); }
  $('diceBtn').disabled = false;
  document.querySelector('.bets').outerHTML = betPicker();
  updateHud(); save();
}

// =====================================================================
// Ракета (crash): множитель растёт, пока ракета не взорвётся
// =====================================================================

let CR = null;
const CRASH_EDGE = 0.96;

function crashPoint() {
  const u = Math.random();
  return Math.max(1, Math.floor((CRASH_EDGE / (1 - u)) * 100) / 100);
}

function openCrash() {
  S.crashHist = S.crashHist || [];
  openModal(`<h3>🚀 Ракета</h3>
    <div class="crash-box" id="crashBox">
      <svg viewBox="0 0 300 160" preserveAspectRatio="none" class="crash-graph"><polyline id="crashLine" points="0,160" fill="none" stroke="#F2B33D" stroke-width="3"/></svg>
      <div class="crash-rocket" id="crashRocket">🚀</div>
      <div class="crash-mult" id="crashMult">1.00x</div>
    </div>
    <div class="crash-hist" id="crashHist">${S.crashHist.map((x) => `<i class="${x >= 2 ? 'g' : ''}">${x.toFixed(2)}x</i>`).join('')}</div>
    ${betPicker()}
    <div class="btns"><button class="btn primary wide" data-act="crashGo" id="crashBtn">Запуск</button></div>`, { center: true });
}

function crashGo(btn) {
  if (CR && CR.running) {
    // Забрать деньги
    if (CR.cashed) return;
    CR.cashed = true;
    const win = Math.floor(CR.bet * CR.m);
    addMoney(win);
    addMood(Math.min(15, Math.round(CR.m * 3)));
    sfx('cashout');
    floatAt($('crashMult'), `+${fmt(win)} ₽`, 'good');
    btn.textContent = `Забрал ${CR.m.toFixed(2)}x`;
    btn.disabled = true;
    updateHud();
    return;
  }
  const bet = S.bet;
  if (S.money < bet) { toast('Не хватает денег на ставку', 'bad'); return; }
  S.money -= bet;
  track('casino');
  CR = { bet, crash: crashPoint(), start: performance.now(), m: 1, running: true, cashed: false, pts: [] };
  btn.textContent = 'Забрать';
  btn.classList.add('green');
  $('crashBox').classList.remove('boom');
  sfx('rocket');
  const loop = (now) => {
    if (!CR || !CR.running || !$('crashMult')) { if (CR) CR.running = false; return; }
    const t = (now - CR.start) / 1000;
    CR.m = Math.exp(0.12 * t);
    if (CR.m >= CR.crash) return crashBoom();
    $('crashMult').textContent = CR.m.toFixed(2) + 'x';
    const x = Math.min(290, t * 22), y = Math.max(10, 155 - Math.log(CR.m) * 60);
    CR.pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    $('crashLine').setAttribute('points', '0,160 ' + CR.pts.join(' '));
    $('crashRocket').style.left = (x / 300 * 100) + '%';
    $('crashRocket').style.top = (y / 160 * 100) + '%';
    if (Math.floor(CR.m * 10) !== Math.floor((CR.lastM || 1) * 10)) sfx('tick');
    CR.lastM = CR.m;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function crashBoom() {
  CR.running = false;
  const c = CR.crash;
  $('crashMult').textContent = `💥 ${c.toFixed(2)}x`;
  $('crashBox').classList.add('boom');
  sfx('boom');
  haptic('heavy');
  if (!CR.cashed) { addMood(-4); toast(`🚀 Взорвалась на ${c.toFixed(2)}x. Ставка сгорела`, 'bad'); }
  S.crashHist = [c, ...(S.crashHist || [])].slice(0, 8);
  $('crashHist').innerHTML = S.crashHist.map((x) => `<i class="${x >= 2 ? 'g' : ''}">${x.toFixed(2)}x</i>`).join('');
  const btn = $('crashBtn');
  btn.textContent = 'Запуск';
  btn.disabled = false;
  btn.classList.remove('green');
  document.querySelector('.bets').outerHTML = betPicker();
  CR = null;
  updateHud(); save();
}

Object.assign(ACTIONS, {
  roulette: () => openRoulette(),
  roulBet: (id) => {
    if (roulSpinning) return;
    const chip = S.bet;
    if (S.money < roulTotal() + chip) { toast(`Не хватает денег: на столе уже ${fmt(roulTotal())} ₽`, 'bad'); sfx('error'); return; }
    ROUL_STAKES[id] = (ROUL_STAKES[id] || 0) + chip;
    roulRefresh();
    sfx('chip');
  },
  roulClear: () => { if (roulSpinning) return; ROUL_STAKES = {}; roulRefresh(); sfx('whoosh'); },
  roulSpin: () => roulSpin(),
  dice: () => openDice(),
  diceBet: (id) => { diceBet = id; document.querySelectorAll('.roul-bets.four button').forEach((b) => b.classList.toggle('on', b.dataset.id === id)); sfx('chip'); },
  diceRoll: () => diceRoll(),
  crash: () => openCrash(),
  crashGo: (_, btn) => crashGo(btn),
});
