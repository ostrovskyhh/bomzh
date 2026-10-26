// «В гостях у друга» 3.0: его жильё и город, его Валера в его одежде, его питомец и кнопка «Подарить» прямо тут.
// Одежду и питомца игра отправляет вместе со статистикой топа (online.js → bot/online.py).

myStats = (function (orig) {
  return function () {
    const p = typeof activePet === 'function' ? activePet() : null;
    return { ...orig(), eq: { ...S.eq }, pet: p ? p.id : '', pet_art: p ? p.art : '', pet_name: p ? p.name : '' };
  };
})(myStats);

// Сцена жилья друга — из его города, а не из нашего
function friendScene(cityId, housing) {
  const i = Math.max(0, Math.min(6, Math.round(housing || 0)));
  const draw = cityId === 1 && typeof MSK_SCENES !== 'undefined' ? MSK_SCENES[i] : SCENES[i];
  return `<svg viewBox="0 0 360 420" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${draw()}</svg>`;
}

ACTIONS.frVisit = async (pid) => {
  try {
    const r = await apiPost('friends/visit', { pid });
    if (r.error) { toast(r.error, 'bad'); return; }
    const st = r.stats || {};
    track('friendVisit');
    const eq = st.eq && st.eq.body ? { hat: st.eq.hat || 'none', body: st.eq.body, shoes: st.eq.shoes || 'none' } : { hat: 'none', body: 'rvan', shoes: 'none' };
    const pet = st.pet_art && PET_ART[st.pet_art] ? PET_ART[st.pet_art] : '';
    openModal(`<div class="fr-visit2">
      <div class="fv2-scene">${friendScene(st.city, st.housing)}
        <div class="fv2-valera">${valeraSVG(eq, { mood: 'happy' })}</div>
        ${pet ? `<div class="fv2-pet">${pet}</div>` : ''}
        <div class="fv2-tag">📍 ${esc(st.city_name || 'Засранск')} · ${esc(st.house_name || '')}</div></div>
      <h3>В гостях у ${esc(r.name)}</h3>
      <p>Ур. ${st.level || 1} · ${fmt(r.score)} баллов в топе${st.pet_name ? ` · питомец ${esc(st.pet_name)}` : ''}</p>
      <div class="fv2-acts">
        <button class="btn primary" data-act="frGiftMenu" data-id="${esc(pid)}" data-name="${esc(r.name)}">🎁 Подарить</button>
        <button class="btn" data-act="duelFight" data-id="${esc(pid)}">🥊 На бой</button>
        <button class="btn" data-act="duelRpsMenu" data-id="${esc(pid)}" data-name="${esc(r.name)}">✊ КНБ</button></div>
      <details class="fv2-more"><summary>📊 Сравнить статистику</summary>${topStatsHTML(st)}</details>
      <div class="btns" style="flex-direction:column;gap:8px"><button class="btn primary wide" data-act="close">Уйти домой</button>
        <button class="btn wide" data-act="frRemove" data-id="${esc(pid)}" data-name="${esc(r.name)}">Удалить из друзей</button></div></div>`, { center: true });
    sfx('notify');
  } catch (e) { toast(refErrorText(e), 'bad'); }
};
