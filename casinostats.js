// Статистика казино: сколько партий в каждой игре, сколько поставлено и выиграно, итог (плюс или минус),
// самый крупный выигрыш. Плюс достижения за каждую игру, за крупный выигрыш и за проигранную сумму.

const CASINO_KINDS = [['slots', '🎰', 'Слоты'], ['bj', '🃏', 'Блекджек'], ['roul', '🎡', 'Рулетка'], ['dice', '🎲', 'Кости'], ['crash', '🚀', 'Ракета']];
function cst() {
  if (!S.casinoStats) S.casinoStats = { games: {}, bet: 0, won: 0, best: 0, streak: 0 };
  return S.casinoStats;
}
// Какая игра сейчас открыта — по её элементам в окне
let CASINO_TRACK_EVENT=null;
function casinoKind() {
  if(CASINO_TRACK_EVENT)return CASINO_TRACK_EVENT.kind;
  if ($('reels')) return 'slots';
  if ($('bjChip') || (typeof BJ !== 'undefined' && BJ)) return 'bj';
  if ($('roulRes')) return 'roul';
  if ($('dicePair')) return 'dice';
  if ($('crashBtn') || (typeof CR !== 'undefined' && CR)) return 'crash';
  return null;
}
HOOKS.track.push((key) => {
  if (key !== 'casino') return;
  const kind = casinoKind();
  if (!kind) return;
  const st = cst();
  st.games[kind] = (st.games[kind] || 0) + 1;
  const bet = CASINO_TRACK_EVENT ? CASINO_TRACK_EVENT.bet : kind === 'bj' && typeof BJ !== 'undefined' && BJ ? BJ.bet : kind === 'roul' && typeof roulTotal === 'function' ? roulTotal() : S.bet;
  st.bet += Math.max(0, +bet || 0);
});
// Выигрыши: всё, что пришло в кошелёк, пока открыто казино (с учётом ночной надбавки)
addMoney = (function (orig) {
  return function (m) {
    const before = S.money;
    const r = orig(m);
    if (m > 0 && typeof inCasino === 'function' && inCasino() && casinoKind()) {
      const got = S.money - before, st = cst();
      st.won += got;
      st.best = Math.max(st.best, got);
    }
    return r;
  };
})(addMoney);
function casinoNet() { const st = cst(); return st.won - st.bet; }

function casinoStatsHTML() {
  const st = cst();
  const total = CASINO_KINDS.reduce((a, [k]) => a + (st.games[k] || 0), 0);
  const net = casinoNet();
  return `<details class="casino-stats" ${S.casinoStatsOpen ? 'open' : ''}><summary data-act="casinoStatsToggle">📊 Моя статистика · ${fmt(total)} игр</summary>
    <div class="cs-games">${CASINO_KINDS.map(([k, e, n]) => `<div><span>${e}</span><b>${fmt(st.games[k] || 0)}</b><small>${n}</small></div>`).join('')}</div>
    <div class="cs-money">
      <div><small>Поставлено</small><b>${fmt(st.bet)} ₽</b></div>
      <div><small>Выиграно</small><b>${fmt(st.won)} ₽</b></div>
      <div class="${net >= 0 ? 'plus' : 'minus'}"><small>${net >= 0 ? 'Итог: в плюсе' : 'Итог: проиграно'}</small><b>${net >= 0 ? '+' : '−'}${fmt(Math.abs(net))} ₽</b></div>
      <div><small>Крупнейший выигрыш</small><b>${fmt(st.best)} ₽</b></div>
    </div>
    <small class="sr-note">Считается с версии 2.7. Джекпотов 777: ${counter('jackpot')}. Отдельная серия может закончиться проигрышем — играй на то, что не жалко 😉</small></details>`;
}
ACTIONS.casinoStatsToggle = () => { S.casinoStatsOpen = !S.casinoStatsOpen; };
const _casinoTabStats = EXTRA_TABS.fun.casino;
EXTRA_TABS.fun.casino = () => {
  const html = _casinoTabStats();
  if (level() < CASINO_LEVEL) return html;
  return html.replace('<p class="test-note">', `${casinoStatsHTML()}<p class="test-note">`);
};

// ---------- Достижения казино ----------
ACHS.push(
  { id: 'cs_slots', name: 'Однорукий бандит', emoji: '🎰', fn: () => cst().games.slots || 0, goals: [50, 300, 1500, 5000], unit: 'спинов в слотах' },
  { id: 'cs_bj', name: 'Двадцать одно', emoji: '🃏', fn: () => cst().games.bj || 0, goals: [25, 150, 700, 3000], unit: 'раздач в блекджек' },
  { id: 'cs_roul', name: 'Крутите барабан', emoji: '🎡', fn: () => cst().games.roul || 0, goals: [25, 150, 700, 3000], unit: 'спинов рулетки' },
  { id: 'cs_dice', name: 'Кости Михалыча', emoji: '🎲', fn: () => cst().games.dice || 0, goals: [25, 150, 700, 3000], unit: 'бросков костей' },
  { id: 'cs_crash', name: 'Ракетчик', emoji: '🚀', fn: () => cst().games.crash || 0, goals: [25, 150, 700, 3000], unit: 'запусков ракеты' },
  { id: 'cs_best', name: 'Сорвал куш', emoji: '💰', fn: () => cst().best, goals: [10000, 100000, 1000000, 10000000], unit: '₽ — крупнейший выигрыш' },
  { id: 'cs_lost', name: 'Спонсор казино', emoji: '💸', fn: () => Math.max(0, -casinoNet()), goals: [10000, 100000, 1000000, 10000000], unit: '₽ проиграно всего' },
  { id: 'cs_all', name: 'Завсегдатай', emoji: '🎩', fn: () => CASINO_KINDS.filter(([k]) => (cst().games[k] || 0) >= 10).length, goals: [3, 5], unit: 'игр, сыгранных по 10+ раз' },
);
