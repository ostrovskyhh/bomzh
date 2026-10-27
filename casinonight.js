// «Ночь казино» 2.0 (3.5): с 23:00 до 05:00 по Москве — время берём с сервера, а не с телефона
// (раньше перевёл часы на ночь — и бонус круглые сутки).
// Раньше ночью все выигрыши были +20% — с этим блекджек и рулетка в среднем приносили деньги. Теперь:
// • комплимент от заведения за первый визит за ночь (как было);
// • кешбэк 10% от ночного проигрыша в играх казино — начисляется утром, не больше лимита. Проигрыш он
//   смягчает, но в плюс не выводит: казино всегда в выигрыше. Лото, лотерея и кейсы в ночь казино не входят.

const NIGHT_FROM = 23, NIGHT_TO = 5;
const NIGHT_CASHBACK = 0.1;

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
function nightCashbackCap() { return Math.round(3000 * scale() / 10) * 10; }

// Учёт ночи: сколько поставлено и выиграно в играх казино (не в лото и не в кейсах)
function nightBook() {
  const k = nightKey();
  if (!S.nightBook || S.nightBook.key !== k) {
    if (S.nightBook && !S.nightBook.paid && S.nightBook.bet > 0) S.nightPending = S.nightBook; // прошлая ночь — к выплате утром
    S.nightBook = { key: k, bet: 0, won: 0, paid: false };
  }
  return S.nightBook;
}
function nightLoss(b) { return Math.max(0, (b.bet || 0) - (b.won || 0)); }
function nightCashback(b) { return Math.min(nightCashbackCap(), Math.round(nightLoss(b) * NIGHT_CASHBACK)); }
HOOKS.track.push((key) => {
  if (key !== 'casino' || !casinoNight() || typeof casinoKind !== 'function') return;
  const kind = casinoKind();
  if (!kind) return;
  const bet = kind === 'bj' && typeof BJ !== 'undefined' && BJ ? BJ.bet : kind === 'roul' && typeof roulTotal === 'function' ? roulTotal() : S.bet;
  nightBook().bet += Math.max(0, +bet || 0);
});
addMoney = (function (orig) {
  return function (m) {
    if (m > 0 && casinoNight() && typeof currentScreen !== 'undefined' && currentScreen === 'fun' && typeof casinoKind === 'function' && casinoKind()) nightBook().won += m;
    return orig(m);
  };
})(addMoney);

// Утром: кешбэк за прошлую ночь (если в минусе)
HOOKS.tick.push(() => {
  if (!S.storySeen) return;
  if (S.nightBook && S.nightBook.key !== nightKey()) nightBook();
  const b = S.nightPending;
  if (!b || casinoNight() || !popupTurn(3)) return;
  S.nightPending = null;
  b.paid = true;
  const cb = nightCashback(b);
  if (cb <= 0) return;
  S.money += cb; S.stats.earned += cb; bump('resMoney');
  track('nightCashback');
  sfx('coin');
  resultModal({ emoji: '🌅', title: 'Кешбэк ночи казино', text: `За ночь в «Золотой крышке» ты проиграл ${fmt(nightLoss(b))} ₽.<br>Заведение возвращает <b style="color:var(--gold)">${NIGHT_CASHBACK * 100}% — +${fmt(cb)} ₽</b>${cb >= nightCashbackCap() ? ' (это максимум)' : ''}. Приходи следующей ночью!`, btn: 'Спасибо' });
  save();
});

const _casinoTabNight = EXTRA_TABS.fun.casino;
EXTRA_TABS.fun.casino = () => {
  const html = _casinoTabNight();
  if (level() < CASINO_LEVEL) return html;
  const night = casinoNight();
  const giftReady = night && S.nightGift !== nightKey();
  const b = night ? nightBook() : null;
  const banner = night
    ? `<div class="night-banner on"><div class="nb-moon">🌙</div><div><b>НОЧЬ КАЗИНО</b><p>Кешбэк <b>${NIGHT_CASHBACK * 100}%</b> от ночного проигрыша утром (до ${fmt(nightCashbackCap())} ₽)${b && b.bet ? ` · сейчас ${nightLoss(b) ? `в минусе ${fmt(nightLoss(b))} ₽ → вернём ${fmt(nightCashback(b))} ₽` : 'ты в плюсе 😎'}` : ''} · до утра <span data-until="${nightEdge()}"></span></p></div></div>
      ${giftReady ? `<button class="btn primary wide night-gift" data-act="nightGift">🥂 Комплимент от заведения: ${fmt(nightGift())} ₽</button>` : ''}`
    : `<div class="night-banner"><div class="nb-moon">🌙</div><div><b>Ночь казино</b><p>С ${NIGHT_FROM}:00 до 0${NIGHT_TO}:00 по Москве — комплимент от заведения и кешбэк ${NIGHT_CASHBACK * 100}% от ночного проигрыша. Начнётся через <span data-until="${nightEdge()}"></span></p></div></div>`;
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
    <p>До 05:00 по Москве в «Золотой крышке» у входа ждёт комплимент, а утром заведение вернёт <b>${NIGHT_CASHBACK * 100}%</b> ночного проигрыша.</p>
    <div class="btns" style="flex-direction:column;gap:8px"><button class="btn primary wide" data-act="nightGo">🎰 В казино</button><button class="btn wide" data-act="close">Позже</button></div></div>`, { center: true });
});
ACTIONS.nightGo = () => { closeModal(); showScreen('fun', 'casino'); };

// Точка на «Казино», когда подарок ночи не забран
const _sectionAlertsNight = sectionAlerts;
sectionAlerts = () => { const a = _sectionAlertsNight(); if (a.fun && level() >= CASINO_LEVEL) a.fun.casino = a.fun.casino || (casinoNight() && S.nightGift !== nightKey()); return a; };
