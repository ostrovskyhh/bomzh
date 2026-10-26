// Общий курс бутылок. Формула прежняя (две синусоиды от времени), но время берём с сервера:
// у кого на телефоне сбиты часы, курс больше не отличается — у всех игроков он одинаковый.
// В настройках можно включить уведомление от бота, когда курс на пике (по умолчанию выключено).

const RATE_GOOD = 1.09; // как RATE_GOOD в bot/social.py
let RATE_DT = 0;        // сервер минус телефон, мс
let RATE_SYNC_AT = 0;

function baseRate(t) { return 0.8 * (1 + 0.3 * Math.sin(t / 420000) + 0.12 * Math.sin(t / 97000 + 1)); }
bottleRate = function (t = Date.now()) { return baseRate(t + RATE_DT) * mods().rate; };

async function rateSync() {
  if (!REF_API) return;
  RATE_SYNC_AT = Date.now();
  try {
    const t0 = Date.now();
    const r = await fetch(`${REF_API}/api/rate`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' }, body: '{}' });
    const j = await r.json();
    const t1 = Date.now();
    if (j && j.now && t1 - t0 < 5000) RATE_DT = j.now - (t0 + t1) / 2;
  } catch (e) { /* без сервера — по своим часам */ }
}
HOOKS.init.push(() => rateSync());
HOOKS.tick.push(() => { if (Date.now() - RATE_SYNC_AT > 10 * 60000) rateSync(); });

// Когда следующий пик (ищем на час вперёд с шагом 30 секунд)
function nextRatePeak() {
  const now = Date.now();
  let best = { t: now, v: baseRate(now + RATE_DT) };
  for (let dt = 30000; dt <= 3600000; dt += 30000) { const v = baseRate(now + dt + RATE_DT); if (v > best.v) best = { t: now + dt, v }; }
  return best;
}

renderExchange = (function (orig) {
  return function () {
    orig();
    const box = document.querySelector('#exBody .rate-box');
    if (!box || box.nextElementSibling && box.nextElementSibling.classList.contains('rate-shared')) return;
    const p = nextRatePeak();
    const mins = Math.round((p.t - Date.now()) / 60000);
    const now = baseRate(Date.now() + RATE_DT);
    box.insertAdjacentHTML('afterend', `<div class="rate-shared">🌍 Курс общий для всех игроков. ${now >= RATE_GOOD ? '<b>🔥 Сейчас выгодный курс — сдавай!</b>' : mins > 0 ? `Ближайший пик через ~${mins} мин: до ${(p.v * mods().rate).toFixed(2)} ₽` : '<b>Курс сейчас на пике!</b>'}
      ${S.settings.rateNotify ? '' : '<br><small>Хочешь знать о выгодном курсе? Включи уведомление в ⚙️ настройках</small>'}</div>`);
  };
})(renderExchange);

// Настройки: переключатель уведомления о курсе
openSettings = (function (orig) {
  return function () {
    orig();
    const row = document.querySelector('#modalRoot [data-act="toggleRemind"]');
    if (!row) return;
    row.closest('.set-row').insertAdjacentHTML('afterend', `<div class="set-row"><div><b>🍾 Выгодный курс бутылок</b><small>Бот напишет, когда Шнырь даёт за бутылку ${RATE_GOOD.toFixed(2).replace('.', ',')} ₽ и больше (не чаще раза в 2 часа, ночью не беспокоит)</small></div>
      <button class="switch ${S.settings.rateNotify ? 'on' : ''}" data-act="toggleRateNotify"><i></i></button></div>`);
  };
})(openSettings);
ACTIONS.toggleRateNotify = (_, btn) => {
  S.settings.rateNotify = !S.settings.rateNotify;
  btn.classList.toggle('on', S.settings.rateNotify);
  if (S.settings.rateNotify && !onlineOn()) toast('Уведомления приходят от бота — играй через Telegram', 'bad');
  else toast(S.settings.rateNotify ? '🍾 Бот напишет, когда курс будет выгодным' : 'Уведомления о курсе выключены');
  notifySync();
};

// Серверу вместе с напоминаниями сообщаем и про курс
notifySync = async function () {
  if (!onlineOn() || !S.storySeen) return;
  try { await apiPost('notify/state', { enabled: S.settings.remind !== false, rate: !!S.settings.rateNotify, plan: notifyPlan() }); } catch (e) { /* не страшно */ }
};
