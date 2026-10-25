// Вкладка «Лото» в Досуге: моментальные лотерейные билеты разных цен (стираешь защитный слой)
// и русское лото с Михалычем и бабой Зиной — кто первый закроет ряд («квартиру»), тот забирает банк.

// ---------- Лотерейные билеты ----------

// Выигрыш в разах от цены билета и его вес. Возврат игроку ~82%: лотерея всегда в плюсе
const TICKET_PRIZES = [[0, 74], [1, 15], [2, 6], [4, 3.2], [10, 1.2], [50, 0.4], [500, 0.02]];
const TICKETS = [
  { id: 'luck', name: 'Моментальная «Удача»', emoji: '🎫', price: 50, level: 1, color: '#2E7D32' },
  { id: 'sport', name: '«Спортлото»', emoji: '🎟️', price: 300, level: 3, color: '#1565C0' },
  { id: 'gold', name: '«Золотой билет»', emoji: '💎', price: 2000, level: 6, color: '#B8860B' },
  { id: 'million', name: '«Миллионер»', emoji: '👑', price: 20000, level: 10, color: '#6A1B9A' },
];

function rollTicket() {
  const total = TICKET_PRIZES.reduce((a, p) => a + p[1], 0);
  let r = Math.random() * total;
  return (TICKET_PRIZES.find((p) => (r -= p[1]) < 0) || TICKET_PRIZES[0])[0];
}

// 9 клеток с суммами: три одинаковые = выигрыш. При проигрыше ни одна сумма не повторяется трижды
function ticketCells(t, mult) {
  const amounts = TICKET_PRIZES.filter((p) => p[0] > 0).map((p) => p[0] * t.price);
  const cells = [];
  const count = {};
  if (mult) { const win = mult * t.price; cells.push(win, win, win); count[win] = 3; }
  while (cells.length < 9) {
    const a = pick(amounts);
    if ((count[a] || 0) >= 2) continue;
    count[a] = (count[a] || 0) + 1;
    cells.push(a);
  }
  return shuffle(cells);
}

let TICKET = null;

function buyTicket(id) {
  const t = TICKETS.find((x) => x.id === id);
  if (S.money < t.price || level() < t.level) return;
  S.money -= t.price;
  const mult = rollTicket();
  TICKET = { t, mult, cells: ticketCells(t, mult), open: new Set(), paid: false };
  track('lottery');
  sfx('buy');
  openModal(`<div class="tk" style="--tk:${t.color}">
      <div class="tk-head">${t.emoji} ${t.name}<small>Сотри 9 клеток. Три одинаковые суммы — выигрыш!</small></div>
      <div class="tk-grid">${TICKET.cells.map((a, i) => `<button class="tk-cell" data-act="tkOpen" data-id="${i}" data-a="${a}" data-silent="1"><span>${fmt(a)} ₽</span><i></i></button>`).join('')}</div>
      <div class="tk-result" id="tkResult"></div>
      <div class="btns" style="flex-direction:column;gap:8px">
        <button class="btn wide" data-act="tkAll" id="tkAll">Стереть всё</button>
        <button class="btn primary wide hidden" id="tkAgain" data-act="buyTicket" data-id="${t.id}">Ещё билет · ${fmt(t.price)} ₽</button>
        <button class="btn wide hidden" id="tkClose" data-act="close">Закрыть</button></div>
    </div>`, { center: true, locked: true });
}

function tkReveal(i) {
  const k = TICKET;
  if (!k || k.open.has(i)) return;
  k.open.add(i);
  const cell = document.querySelector(`.tk-cell[data-id="${i}"]`);
  if (cell) cell.classList.add('open');
  sfx('flip');
  haptic('light');
  if (k.open.size === 9) tkFinish();
}

function tkFinish() {
  const k = TICKET;
  if (!k || k.paid) return;
  k.paid = true;
  const win = k.mult * k.t.price;
  document.querySelectorAll('.tk-cell').forEach((c) => { if (win && +c.dataset.a === win) c.classList.add('win'); });
  if (win) {
    addMoney(win);
    track('lotteryWin');
    $('tkResult').innerHTML = `<b class="tk-win">🎉 Выигрыш: +${fmt(win)} ₽</b>`;
    sfx(k.mult >= 50 ? 'jackpot' : 'win');
    confetti(k.mult >= 10 ? 120 : 40);
  } else {
    $('tkResult').innerHTML = '<span class="tk-lose">Пусто… «Попробуйте ещё раз»</span>';
    addMood(-2);
    sfx('lose');
  }
  $('tkAll').classList.add('hidden');
  $('tkAgain').classList.remove('hidden');
  $('tkClose').classList.remove('hidden');
  if (S.money < k.t.price) $('tkAgain').disabled = true;
  save();
}

// ---------- Русское лото ----------

const LOTO_BETS = [{ bet: 100, level: 3 }, { bet: 500, level: 5 }, { bet: 2000, level: 8 }];
const LOTO_RAKE = 0.9; // победитель получает 90% банка
const LOTO_STEP = 1700; // мс между бочонками
const LOTO_RIVALS = [{ name: 'Михалыч', emoji: '🧔' }, { name: 'Баба Зина', emoji: '👵' }];
const LOTO_NAMES = {
  1: 'кол', 7: 'топорик', 8: 'бабушкины очки', 11: 'барабанные палочки', 22: 'гуси-лебеди', 25: 'опять двадцать пять', 33: 'кудри',
  44: 'стульчики', 48: 'половинку просим', 50: 'полста', 55: 'перчатки', 66: 'валенки', 69: 'туда-сюда', 77: 'топорики', 80: 'бабушка', 88: 'крендельки', 90: 'дедушка',
};

// Карточка 3×9: в каждом ряду 5 чисел, в колонке c — числа из своего десятка
function lotoCard() {
  const used = new Set();
  return [0, 1, 2].map(() => {
    const cols = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 5).sort((a, b) => a - b);
    const row = Array(9).fill(null);
    for (const c of cols) {
      const lo = c === 0 ? 1 : c * 10, hi = c === 8 ? 90 : c * 10 + 9;
      let n;
      do { n = Math.floor(rand(lo, hi + 1)); } while (used.has(n));
      used.add(n);
      row[c] = n;
    }
    return row;
  });
}

let LOTO = null;

function lotoStart(bet) {
  const b = LOTO_BETS.find((x) => x.bet === bet);
  if (!b || S.money < bet || level() < b.level) return;
  S.money -= bet;
  track('loto');
  const bag = shuffle(Array.from({ length: 90 }, (_, i) => i + 1));
  LOTO = { bet, bag, called: [], me: lotoCard(), marked: new Set(), rivals: LOTO_RIVALS.map((r) => ({ ...r, card: lotoCard(), marked: new Set() })), timer: null, over: false };
  openModal(`<div class="loto">
      <div class="loto-top"><div class="loto-barrel" id="lotoBarrel">?</div><div class="loto-call" id="lotoCall">Тянем бочонки…</div></div>
      <div class="loto-rivals">${LOTO.rivals.map((r, i) => `<div class="loto-rival"><span>${r.emoji}</span><b>${r.name}</b><i id="lotoR${i}">0/5</i></div>`).join('')}</div>
      <div class="loto-card" id="lotoCard">${LOTO.me.map((row, ri) => row.map((n, ci) => n
        ? `<button class="loto-n" data-act="lotoMark" data-id="${n}" data-silent="1">${n}</button>` : '<span class="loto-e"></span>').join('')).join('')}</div>
      <p class="mg-hint">Банк: <b>${fmt(bet * 3)} ₽</b>. Тапай по числу, когда его вытянули. Первый закрыл ряд из 5 чисел — «Квартира!» — забирает банк.</p>
      <div class="loto-called" id="lotoCalled"></div>
      <button class="btn small" data-act="lotoQuit">Сдаться</button>
    </div>`, { center: true, locked: true });
  LOTO.timer = setInterval(lotoDraw, LOTO_STEP);
  setTimeout(lotoDraw, 600);
}

function lotoRowBest(card, marked) { return Math.max(...card.map((row) => row.filter((n) => n && marked.has(n)).length)); }

function lotoDraw() {
  const L = LOTO;
  if (!L || L.over || !$('lotoBarrel')) return;
  const n = L.bag.pop();
  if (n === undefined) { lotoEnd(null); return; }
  L.called.push(n);
  const b = $('lotoBarrel');
  b.textContent = n;
  b.animate([{ transform: 'scale(.3) rotate(-90deg)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 400 });
  $('lotoCall').textContent = LOTO_NAMES[n] ? `${n} — ${LOTO_NAMES[n]}!` : `${n}`;
  $('lotoCalled').innerHTML = L.called.slice(-12).map((x) => `<i>${x}</i>`).join('');
  sfx('tick');
  if (L.me.flat().includes(n)) { const el = document.querySelector(`.loto-n[data-id="${n}"]`); if (el) el.classList.add('hint'); }
  // Соперники отмечают сами, иногда с запозданием
  L.rivals.forEach((r, i) => {
    if (!r.card.flat().includes(n)) return;
    setTimeout(() => {
      if (!LOTO || LOTO !== L || L.over) return;
      r.marked.add(n);
      $(`lotoR${i}`).textContent = `${lotoRowBest(r.card, r.marked)}/5`;
      if (lotoRowBest(r.card, r.marked) >= 5) lotoEnd(r);
    }, rand(300, 1400));
  });
}

function lotoMark(n) {
  const L = LOTO;
  if (!L || L.over) return;
  const el = document.querySelector(`.loto-n[data-id="${n}"]`);
  if (!el || L.marked.has(n)) return;
  if (!L.called.includes(n)) { el.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 200 }); sfx('error'); toast(`${n} ещё не вытянули`, 'bad'); return; }
  L.marked.add(n);
  el.classList.add('on');
  el.classList.remove('hint');
  sfx('chip');
  haptic('light');
  if (lotoRowBest(L.me, L.marked) >= 5) lotoEnd('me');
}

function lotoEnd(winner) {
  const L = LOTO;
  if (!L || L.over) return;
  L.over = true;
  clearInterval(L.timer);
  LOTO = null;
  const pot = L.bet * 3;
  setTimeout(() => {
    if (winner === 'me') {
      const prize = Math.round(pot * LOTO_RAKE);
      addMoney(prize); addMood(12); addXp(8);
      track('lotoWin');
      confetti(90); sfx('jackpot');
      resultModal({ emoji: '🏆', title: '«Квартира!» Ты выиграл!', text: `Ряд закрыт за ${L.called.length} бочонков.<br>Банк: <b style="color:var(--gold)">+${fmt(prize)} ₽</b>. Михалыч ворчит, баба Зина требует реванша.`, btn: 'Ещё партию!' });
    } else if (winner) {
      addMood(-4);
      sfx('lose');
      resultModal({ emoji: winner.emoji, rays: 'bad', title: `${winner.name}: «Квартира!»`, text: `${winner.name} закрыл ряд первым и забрал банк ${fmt(Math.round(pot * LOTO_RAKE))} ₽. ${winner.name === 'Баба Зина' ? 'Баба Зина играет в лото 50 лет — не расстраивайся.' : '«Учись, Валера!»'}`, btn: 'Эх' });
    } else {
      addMoney(L.bet);
      resultModal({ emoji: '🎲', title: 'Бочонки кончились', text: 'Никто не закрыл ряд. Ставка вернулась.', btn: 'Ок' });
    }
    save();
  }, 700);
}

// ---------- Вкладка ----------

EXTRA_TABS.fun.lotto = () => `<div class="premium-hero lotto-hero"><div class="e">🎟️</div><div><b>Лотерея и лото</b>
    <p>Моментальные билеты на любой кошелёк и русское лото с соседями по двору.</p></div></div>
  <div class="subhead">Моментальные билеты</div>
  ${TICKETS.map((t) => {
    const ok = level() >= t.level;
    return card({ thumb: t.emoji, title: t.name, cls: ok ? '' : 'locked',
      desc: `Главный приз <b>${fmt(t.price * 500)} ₽</b> · сотри 9 клеток`, extra: ok ? '' : reqHTML({ level: t.level }),
      btn: ok ? priceBtn('buyTicket', t.id, t.price, S.money >= t.price) : lockBtn });
  }).join('')}
  <div class="subhead">Русское лото</div>
  <div class="info-card">Ты, Михалыч и баба Зина. Каждый ставит одинаково, бочонки тянут по очереди. Тапай по своим числам, когда их называют. Первый закрыл ряд из 5 чисел — забирает банк (90%).</div>
  ${LOTO_BETS.map((b) => {
    const ok = level() >= b.level;
    return card({ thumb: '🎲', title: `Ставка ${fmt(b.bet)} ₽`, cls: ok ? '' : 'locked', desc: `Банк ${fmt(b.bet * 3)} ₽ · выигрыш ${fmt(Math.round(b.bet * 3 * LOTO_RAKE))} ₽`,
      extra: ok ? '' : reqHTML({ level: b.level }), btn: ok ? priceBtn('lotoStart', b.bet, b.bet, S.money >= b.bet, 'Играть') : lockBtn });
  }).join('')}`;

Object.assign(ACTIONS, {
  buyTicket: (id) => buyTicket(id),
  tkOpen: (i) => tkReveal(+i),
  tkAll: () => { for (let i = 0; i < 9; i++) setTimeout(() => tkReveal(i), i * 70); },
  lotoStart: (bet) => lotoStart(+bet),
  lotoMark: (n) => lotoMark(+n),
  lotoQuit: () => { if (!LOTO) { closeModal(); return; } const L = LOTO; L.over = true; clearInterval(L.timer); LOTO = null; closeModal(); toast('Ты встал из-за стола. Ставка осталась в банке', 'bad'); },
});
