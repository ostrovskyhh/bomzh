// Награды за приглашённых друзей: 30 крышек за каждого, плюс уникальные рамки и аватарки
// за 1 / 3 / 5 / 10 / 15 / 25 / 30 приглашённых. Число приглашённых считает сервер (bot/referral.py).

const REF_CAPS = 30;

// Рамки за приглашения — свои, анимированные
FRAMES.push(
  { id: 'recruit', name: 'Вербовщик', need: () => (S.refInvited || 0) >= 3, how: 'Пригласить 3 друзей по коду' },
  { id: 'leader', name: 'Лидер района', need: () => (S.refInvited || 0) >= 10, how: 'Пригласить 10 друзей по коду' },
  { id: 'kingref', name: 'Король района', need: () => (S.refInvited || 0) >= 25, how: 'Пригласить 25 друзей по коду' },
);
AVATARS.push(
  { id: 'friend', face: '🤝', name: 'Свой парень', how: 'Пригласить 1 друга по коду', need: () => (S.refInvited || 0) >= 1 },
  { id: 'agitator', face: '📣', name: 'Агитатор', how: 'Пригласить 5 друзей по коду', need: () => (S.refInvited || 0) >= 5 },
  { id: 'speaker', face: '🎙️', name: 'Голос района', how: 'Пригласить 15 друзей по коду', need: () => (S.refInvited || 0) >= 15 },
  { id: 'crowd', face: '👥', name: 'Народный любимец', how: 'Пригласить 30 друзей по коду', need: () => (S.refInvited || 0) >= 30 },
);
const REF_GOALS = [1, 3, 5, 10, 15, 25, 30];
function refNextGoal() { return REF_GOALS.find((n) => n > (S.refInvited || 0)); }

// Сервер отвечает раньше, чем загрузится сохранение, — ждём загрузку, иначе награда потеряется
refSync = (function (orig) {
  return async function () {
    while (!LOADED) await wait(500);
    const r = await orig();
    if (r && typeof r.invited === 'number') {
      S.refInvited = Math.max(S.refInvited || 0, r.invited);
      const fresh = S.refInvited - (S.refCapsFor || 0);
      if (fresh > 0) {
        S.refCapsFor = S.refInvited;
        addCaps(REF_CAPS * fresh);
        save(true);
        setTimeout(() => {
          confetti(60); sfx('jackpot');
          resultModal({ emoji: '🟡', title: `+${REF_CAPS * fresh} золотых крышек!`, text: `За ${fresh === 1 ? 'приглашённого друга' : `${fresh} приглашённых друзей`} — по ${REF_CAPS} крышек.<br>Всего приглашено: <b>${S.refInvited}</b>${refNextGoal() ? `<br>Следующая награда — рамка или аватарка за ${refNextGoal()}` : ''}`, btn: 'Класс!' });
        }, modalOpen() ? 2500 : 300);
      }
    }
    return r;
  };
})(refSync);
// Пока игра открыта, раз в 5 минут проверяем новых друзей
setInterval(() => { if (REF_API && refInitData() && LOADED && S.storySeen) refSync(); }, 5 * 60000);

refBoxHTML = (function (orig) {
  return function () {
    const html = orig();
    const next = refNextGoal();
    return html.replace('а ты — 500 ₽.', `а ты — 500 ₽ и <b>${REF_CAPS} 🟡 крышек</b>.`)
      + (REF ? `<small>🎁 За 1/3/5/10/15/25/30 друзей — уникальные аватарки и рамки${next ? `. До следующей: ${next - (S.refInvited || 0)}` : ' — все получены!'}</small>` : '');
  };
})(refBoxHTML);
