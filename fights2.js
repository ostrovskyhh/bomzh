// Драки 2.8: настоящий опыт — в онлайн-боях с живыми игроками. Бои с ботами (обычные и сложные)
// теперь тренировки: опыта в 5 раз меньше, зато каждая победа добавляет +1 к форме. Сюжетные бои не трогаем.

const TRAIN_XP = 0.2;
function onlineWinXp() { return 40 + level() * 6 + Math.min(5, S.onlineStreak || 0) * 8; }

let TRAIN_NEXT = false, TRAIN_NOW = false;
['fight', 'hardFight'].forEach((k) => {
  const f = ACTIONS[k];
  if (f) ACTIONS[k] = (...a) => { TRAIN_NEXT = true; try { return f(...a); } finally { TRAIN_NEXT = false; } };
});
startFight = (function (orig) {
  return function (...a) { TRAIN_NOW = TRAIN_NEXT; TRAIN_NEXT = false; return orig(...a); };
})(startFight);

fightEnd = (function (orig) {
  return function (won) {
    if (!TRAIN_NOW) return orig(won);
    TRAIN_NOW = false;
    const ax = addXp;
    addXp = (v) => ax(Math.max(1, Math.round(v * TRAIN_XP)));
    try { orig(won); } finally { addXp = ax; }
    if (won) S.form = Math.min(100, (S.form || 0) + 1);
    S.trainings = (S.trainings || 0) + 1;
    const p = document.querySelector('#modalRoot .sheet > p');
    if (p) p.insertAdjacentHTML('beforeend', `<span class="train-note">🥋 Это тренировка: опыта мало${won ? ', зато форма +1' : ''}. Много опыта — за победы в 🟢 онлайн-боях</span>`);
  };
})(fightEnd);

// Онлайн: победа — много опыта, серия побед добавляет ещё
obFinish = (function (orig) {
  return function (v) {
    if (!OB || OB.rewarded) return orig(v);
    const win = v.winner === 'me', lose = v.winner === 'op';
    S.onlineStreak = win ? (S.onlineStreak || 0) + 1 : lose ? 0 : S.onlineStreak || 0;
    const extra = win ? onlineWinXp() - 25 : lose ? 10 - 6 : 20 - 10;
    orig(v);
    addXp(extra);
    const p = document.querySelector('#modalRoot .sheet > p');
    if (p) p.innerHTML = p.innerHTML.replace('+25 опыта', `+${onlineWinXp()} опыта${S.onlineStreak > 1 ? ` (серия ${S.onlineStreak} 🔥)` : ''}`).replace('+10 опыта', '+20 опыта')
      + (lose ? '<br><small>+10 опыта за смелость</small>' : '');
  };
})(obFinish);

// Подсказка во вкладке «Драки»
const _fightsTabTrain = EXTRA_TABS.fun.fights;
EXTRA_TABS.fun.fights = () => `<div class="info-card train-info">🥋 <b>Бои с ботами — это тренировки:</b> опыта ×${TRAIN_XP}, но победа даёт +1 к форме.
    <br>🟢 <b>Онлайн-победа над игроком:</b> +${onlineWinXp()} опыта${S.onlineStreak ? `, серия ${S.onlineStreak} 🔥` : ''} — каждая победа подряд добавляет ещё.</div>` + _fightsTabTrain();
