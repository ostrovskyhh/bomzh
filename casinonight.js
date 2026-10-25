// «Ночь казино»: по реальному времени на телефоне игрока, с 23:00 до 05:00.
// Ночью все выигрыши в казино +20%, а за первый визит за ночь — комплимент от заведения.

const NIGHT_FROM = 23, NIGHT_TO = 5;
const NIGHT_BONUS = 0.2;

function casinoNight(d = new Date()) { const h = d.getHours(); return h >= NIGHT_FROM || h < NIGHT_TO; }
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

// Выигрыш в казино ночью — с надбавкой
addMoney = (function (orig) {
  return function (m) {
    if (m > 0 && casinoNight() && typeof inCasino === 'function' && inCasino()) {
      const extra = Math.round(m * NIGHT_BONUS);
      if (extra > 0) setTimeout(() => floatAt($('resMoney'), `🌙 +${fmt(extra)}`, 'good'), 200);
      m += extra;
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
