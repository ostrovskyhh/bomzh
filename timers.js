// Защита таймеров. Перезарядки и дела хранятся как «время окончания» по часам устройства.
// Если сохранение пришло с телефона/ПК с другими часами или часы на устройстве перевели,
// таймер мог «улететь» — например, мусорка через 290 минут вместо 5.
// Теперь игра помнит длительность каждой перезарядки и обрезает всё, что длиннее неё.

const CD_MAX_DEFAULT = 2 * 3600; // самая долгая обычная перезарядка в игре — 2 часа
const BUSY_MAX = 12 * 3600 * 1000;

setCd = (function (orig) {
  return function (key, sec) {
    orig(key, sec);
    if (!S.cdDur) S.cdDur = {};
    S.cdDur[key] = sec;
  };
})(setCd);

function cdMaxSec(key) {
  if (S.cdDur && S.cdDur[key]) return S.cdDur[key];
  if (key === 'trash') return TRASH_COOLDOWN;
  if (key === 'clubParty' && typeof PARTY_CD !== 'undefined') return PARTY_CD;
  return CD_MAX_DEFAULT;
}

function fixTimers() {
  if (!S || !S.cd) return 0;
  const now = Date.now();
  let fixed = 0;
  for (const key of Object.keys(S.cd)) {
    const until = +S.cd[key] || 0;
    const max = cdMaxSec(key) * 1000;
    if (until - now > max + 5000) { S.cd[key] = now + max; fixed++; }
  }
  // Дело (сон, смена, тюрьма): начало «в будущем» или конец через полдня — часы сбились
  const b = S.busy;
  if (b && b.start && b.end) {
    const dur = Math.min(Math.max(0, b.end - b.start), BUSY_MAX);
    if (b.start > now + 60000) { b.start = now; b.end = now + dur; fixed++; }
    else if (b.end - now > BUSY_MAX) { b.end = now + Math.min(dur, BUSY_MAX); fixed++; }
  }
  return fixed;
}

HOOKS.load.push(() => { if (fixTimers()) save(); });
let TIMERS_CHECK = 0;
HOOKS.tick.push(() => {
  const now = Date.now();
  if (now - TIMERS_CHECK < 5000) return;
  TIMERS_CHECK = now;
  fixTimers();
});
