// «Ночь казино» 4.2: с 23:00 до 05:00 по Москве — время берём с сервера, а не с телефона.
// • комплимент от заведения за первый визит за ночь;
// • +15% к чистому выигрышу в играх казино (сверх ставки). Бонус за ночь ограничен — иначе казино начало бы
//   платить больше, чем забирает. Лото, лотерея и кейсы в ночь казино не входят. (Кешбэк 10% из 4.0 отменён.)

const NIGHT_FROM = 23, NIGHT_TO = 5;
const NIGHT_BONUS = 0.15;
let NIGHT_LAST_BET = 0;

// Время по Москве: смещение сервера (если есть связь), иначе часы телефона
let SRV_DT = null;
async function syncServerTime() {
  if (typeof REF_API === 'undefined' || !REF_API) return;
  try {
    const t0 = Date.now();
    const r = await (await fetch(`${REF_API}/api/health`, { headers: { 'ngrok-skip-browser-warning': '1' } })).json();
    if (r && r.now) SRV_DT = r.now - Math.round((t0 + Date.now()) / 2);
  } catch (e) { /* без сервера — часы телефона */ }
}
HOOKS.init.push(() => setTimeout(syncServerTime, 2500));
function mskNow() { const t = Date.now() + (SRV_DT || 0); return new Date(t + (SRV_DT === null ? 0 : (new Date().getTimezoneOffset() + 180) * 60000)); }

function casinoNight(d) {
  if (typeof S !== 'undefined' && S && S.admin && S.admNightUntil > Date.now()) return true;
  const h = (d || mskNow()).getHours();
  return h >= NIGHT_FROM || h < NIGHT_TO;
}
// Ключ ночи: ночь с 25 на 26 — одна, даже после полуночи
function nightKey(d) { const x = new Date(d || mskNow()); if (x.getHours() < NIGHT_TO) x.setDate(x.getDate() - 1); return x.toDateString(); }
function nightEdge() {
  const d = mskNow();
  const e = new Date(d);
  if (casinoNight(d)) { if (d.getHours() >= NIGHT_FROM) e.setDate(e.getDate() + 1); e.setHours(NIGHT_TO, 0, 0, 0); }
  else e.setHours(NIGHT_FROM, 0, 0, 0);
  return Date.now() + (e - d);
}
function nightGift() { return Math.round(150 * scale() / 10) * 10; }
function nightBonusCap() { return Math.round(3000 * scale() / 10) * 10; }

// Учёт ночи: сколько поставлено и выиграно в играх казино (не в лото и не в кейсах)
function nightBook() {
  const k = nightKey();
  if (!S.nightBook || S.nightBook.key !== k) {
    if (S.nightBook && !S.nightBook.paid && S.nightBook.bet > 0) S.nightPending = S.nightBook; // прошлая ночь — к выплате утром
    S.nightBook = { key: k, bet: 0, won: 0, bonus: 0, paid: false };
  }
  return S.nightBook;
}
function nightBonusLeft() { return Math.max(0, nightBonusCap() - (nightBook().bonus || 0)); }
HOOKS.track.push((key) => {
  if (key !== 'casino' || !casinoNight() || typeof casinoKind !== 'function') return;
  const kind = casinoKind();
  if (!kind) return;
  const bet = kind === 'bj' && typeof BJ !== 'undefined' && BJ ? BJ.bet : kind === 'roul' && typeof roulTotal === 'function' ? roulTotal() : S.bet;
  NIGHT_LAST_BET = Math.max(0, +bet || 0);
  nightBook().bet += NIGHT_LAST_BET;
});
addMoney = (function (orig) {
  return function (m) {
    const inCasino = m > 0 && casinoNight() && typeof currentScreen !== 'undefined' && currentScreen === 'fun' && typeof casinoKind === 'function' && casinoKind();
    const r = orig(m);
    if (!inCasino) return r;
    const b = nightBook();
    b.won += m;
    const bonus = Math.min(nightBonusLeft(), Math.round(Math.max(0, m - NIGHT_LAST_BET) * NIGHT_BONUS));
    if (bonus > 0) {
      b.bonus = (b.bonus || 0) + bonus;
      S.money += bonus; S.stats.earned += bonus; bump('resMoney');
      track('nightBonus');
      toast(`🌙 Ночной бонус +15%: +${fmt(bonus)} ₽`, 'good');
    }
    return r;
  };
})(addMoney);

// Кешбэк из 4.0 отменён: старые «долги» кешбэка не выплачиваются
HOOKS.load.push(() => { S.nightPending = null; });

const _casinoTabNight = EXTRA_TABS.fun.casino;
EXTRA_TABS.fun.casino = () => {
  const html = _casinoTabNight();
  if (level() < CASINO_LEVEL) return html;
  const night = casinoNight();
  const giftReady = night && S.nightGift !== nightKey();
  const b = night ? nightBook() : null;
  const banner = night
    ? `<div class="night-banner on"><div class="nb-moon">🌙</div><div><b>НОЧЬ КАЗИНО</b><p><b>+${NIGHT_BONUS * 100}%</b> к чистому выигрышу · бонус за ночь до ${fmt(nightBonusCap())} ₽${b && b.bonus ? ` · уже получено ${fmt(b.bonus)} ₽` : ''} · до утра <span data-until="${nightEdge()}"></span></p></div></div>
      ${giftReady ? `<button class="btn primary wide night-gift" data-act="nightGift">🥂 Комплимент от заведения: ${fmt(nightGift())} ₽</button>` : ''}`
    : `<div class="night-banner"><div class="nb-moon">🌙</div><div><b>Ночь казино</b><p>С ${NIGHT_FROM}:00 до 0${NIGHT_TO}:00 по Москве — комплимент от заведения и +${NIGHT_BONUS * 100}% к чистому выигрышу. Начнётся через <span data-until="${nightEdge()}"></span></p></div></div>`;
  return html.replace('<div class="casino-lobby">', `${banner}<div class="casino-lobby ${night ? 'night' : ''}">`);
};

ACTIONS.nightGift = () => {
  if (!casinoNight() || S.nightGift === nightKey()) return;
  S.nightGift = nightKey();
  const m = nightGift();
  S.money += m; S.stats.earned += m; bump('resMoney');
  track('nightGift');
  confetti(40); sfx('coin');
  toast(`🥂 Крупье угостил: +${fmt(m)} ₽ на игру. Удачной ночи!`, 'good');
};

// Ночь началась, пока игра открыта, — один раз объявляем
HOOKS.tick.push(() => {
  if (!S.storySeen || level() < CASINO_LEVEL || !casinoNight() || S.nightSeen === nightKey() || !popupTurn(4) || S.busy) return;
  S.nightSeen = nightKey();
  sfx('notify');
  openModal(`<div class="night-pop"><div class="nb-moon big">🌙</div><h3>Ночь казино началась!</h3>
    <p>До 05:00 по Москве в «Золотой крышке» у входа ждёт комплимент, а каждый выигрыш в казино — на <b>${NIGHT_BONUS * 100}%</b> больше (до ${fmt(nightBonusCap())} ₽ за ночь).</p>
    <div class="btns" style="flex-direction:column;gap:8px"><button class="btn primary wide" data-act="nightGo">🎰 В казино</button><button class="btn wide" data-act="close">Позже</button></div></div>`, { center: true });
});
ACTIONS.nightGo = () => { closeModal(); showScreen('fun', 'casino'); };

// Точка на «Казино», когда подарок ночи не забран
const _sectionAlertsNight = sectionAlerts;
sectionAlerts = () => { const a = _sectionAlertsNight(); if (a.fun && level() >= CASINO_LEVEL) a.fun.casino = a.fun.casino || (casinoNight() && S.nightGift !== nightKey()); return a; };
