// «Ночь казино»: по реальному времени на телефоне игрока, с 23:00 до 05:00.
// Ночью все выигрыши в казино +20%, а за первый визит за ночь — комплимент от заведения.

const NIGHT_FROM = 23, NIGHT_TO = 5;
const NIGHT_BONUS = 0.2;

function casinoNight(d = new Date()) { if (typeof S !== 'undefined' && S && S.admin && S.admNightUntil > Date.now()) return true; const h = d.getHours(); return h >= NIGHT_FROM || h < NIGHT_TO; }
// Ключ ночи: ночь с 25 на 26 — одна, даже после полуночи
function nightKey(d = new Date()) { const x = new Date(d); if (x.getHours() < NIGHT_TO) x.setDate(x.getDate() - 1); return x.toDateString(); }
function nightEdge() {
  const d = new Date();
  const e = new Date(d);
  if (casinoNight(d)) { if (d.getHours() >= NIGHT_FROM) e.setDate(e.getDate() + 1); e.setHours(NIGHT_TO, 0, 0, 0); }
  else e.setHours(NIGHT_FROM, 0, 0, 0);
  return e.getTime();
}
function nightGift() { return Math.round(150 * scale() / 10) * 10; }

// Выигрыш в казино ночью — с надбавкой. Считаем от чистого выигрыша (без возврата ставки), иначе ничья в блекджеке
// приносила бы деньги. Надбавку показываем тостом: всплывашка над кошельком пряталась под окном игры, и казалось, что бонуса нет
function nightStake(kind) {
  if (kind === 'bj' && typeof BJ !== 'undefined' && BJ) return BJ.bet;
  if (kind === 'roul' && typeof roulTotal === 'function') return roulTotal();
  if (kind === 'crash' && typeof CR2 !== 'undefined' && CR2 && CR2.view && CR2.view.me) return CR2.view.me.amount;
  return S.bet || 0;
}
function nightTable() {
  if (typeof currentScreen === 'undefined' || currentScreen !== 'fun' || level() < CASINO_LEVEL) return null;
  const kind = typeof casinoKind === 'function' ? casinoKind() : null;
  if (kind) return kind;
  return TABS.fun === 'lotto' ? 'lotto' : null; // продажа вещей с барахолки и прочие поступления — без надбавки
}
addMoney = (function (orig) {
  return function (m) {
    const kind = m > 0 && casinoNight() ? nightTable() : null;
    if (kind) {
      const profit = kind === 'lotto' ? m : Math.max(0, m - nightStake(kind));
      const extra = Math.round(profit * NIGHT_BONUS);
      if (extra > 0) { m += extra; setTimeout(() => toast(`🌙 Ночь казино: +${fmt(extra)} ₽ к выигрышу (+${NIGHT_BONUS * 100}%)`, 'good'), 350); }
    }
    return orig(m);
  };
})(addMoney);

const _casinoTabNight = EXTRA_TABS.fun.casino;
EXTRA_TABS.fun.casino = () => {
  const html = _casinoTabNight();
  if (level() < CASINO_LEVEL) return html;
  const night = casinoNight();
  const giftReady = night && S.nightGift !== nightKey();
  const banner = night
    ? `<div class="night-banner on"><div class="nb-moon">🌙</div><div><b>НОЧЬ КАЗИНО</b><p>Все выигрыши <b>+${NIGHT_BONUS * 100}%</b> · до утра <span data-until="${nightEdge()}"></span></p></div></div>
      ${giftReady ? `<button class="btn primary wide night-gift" data-act="nightGift">🥂 Комплимент от заведения: ${fmt(nightGift())} ₽</button>` : ''}`
    : `<div class="night-banner"><div class="nb-moon">🌙</div><div><b>Ночь казино</b><p>С ${NIGHT_FROM}:00 до 0${NIGHT_TO}:00 по твоему времени — выигрыши +${NIGHT_BONUS * 100}% и подарок от заведения. Начнётся через <span data-until="${nightEdge()}"></span></p></div></div>`;
  return html.replace('<div class="casino-lobby">', `${banner}<div class="casino-lobby ${night ? 'night' : ''}">`);
};

ACTIONS.nightGift = () => {
  if (!casinoNight() || S.nightGift === nightKey()) return;
  S.nightGift = nightKey();
  const m = nightGift();
  S.money += m; S.stats.earned += m; bump('resMoney'); // без ночной надбавки
  track('nightGift');
  confetti(40); sfx('coin');
  toast(`🥂 Крупье угостил: +${fmt(m)} ₽ на игру. Удачной ночи!`, 'good');
};

// Ночь началась, пока игра открыта, — один раз объявляем
HOOKS.tick.push(() => {
  if (!S.storySeen || level() < CASINO_LEVEL || !casinoNight() || S.nightSeen === nightKey() || modalOpen() || S.busy) return;
  S.nightSeen = nightKey();
  sfx('notify');
  openModal(`<div class="night-pop"><div class="nb-moon big">🌙</div><h3>Ночь казино началась!</h3>
    <p>До 05:00 все выигрыши в «Золотой крышке» <b>+${NIGHT_BONUS * 100}%</b>, а у входа ждёт комплимент от заведения.</p>
    <div class="btns" style="flex-direction:column;gap:8px"><button class="btn primary wide" data-act="nightGo">🎰 В казино</button><button class="btn wide" data-act="close">Позже</button></div></div>`, { center: true });
});
ACTIONS.nightGo = () => { closeModal(); showScreen('fun', 'casino'); };

// Точка на «Казино», когда подарок ночи не забран
const _sectionAlertsNight = sectionAlerts;
sectionAlerts = () => { const a = _sectionAlertsNight(); if (a.fun && level() >= CASINO_LEVEL) a.fun.casino = a.fun.casino || (casinoNight() && S.nightGift !== nightKey()); return a; };
