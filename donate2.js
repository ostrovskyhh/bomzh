// Премиальное окно доната (по нажатию на крышки наверху). Те же товары и действия, что раньше,
// но витрина: золотая шапка с балансом, крупные цены в звёздах, наборы крышек плиткой,
// VIP и пропуск — отдельными карточками, траты крышек свёрнуты ниже.

function starPrice(stars, full) {
  return `<span class="star-price">${full && full !== stars ? `<s>${full}</s>` : ''}<span class="star-e">⭐</span><b>${stars}</b></span>`;
}
function promoBadge(id, p) {
  const pr = promoFor(id, p);
  return pr ? `<span class="dn-promo">🔥 ${pr.discount ? `−${Math.round(pr.discount * 100)}%` : pr.bonus ? `+${pr.bonus} 🟡` : `+${pr.days} дн.`}</span>` : '';
}

donateHTML = function premiumDonate() {
  const p = promoAt();
  const vipOn = isVip();
  const banner = p ? `<div class="dn-banner"><span>${p.emoji}</span><div><b>Акция: ${p.title}</b><small>${p.desc} · осталось <span data-until="${p.ends}"></span></small></div></div>` : '';
  const packs = PREMIUM.map((x, i) => {
    const price = promoPrice(x);
    return `<button class="dn-pack ${i === PREMIUM.length - 1 ? 'best' : ''}" data-act="prem" data-id="${x.id}">
      ${x.tag ? `<span class="dn-ribbon">${x.tag}</span>` : ''}${promoBadge(x.id, p)}
      <span class="dn-pack-e">${x.emoji}</span><b class="dn-caps">${x.caps}<small>🟡</small></b><span class="dn-pack-n">${x.name}</span>
      ${starPrice(price, x.stars)}</button>`;
  }).join('');
  const passPaid = typeof passState === 'function' && passState().paid;
  const pass = typeof PASS_STARS !== 'undefined' && !passPaid ? `<div class="dn-card pass"><div class="dn-card-e">🎫</div><div class="dn-card-b"><b>Золотой пропуск сезона</b>
      <small>~155 крышек, деньги на каждом уровне, Кепка сезона, 3 дня VIP. Награды за пройденные уровни — сразу</small></div>
      <button class="dn-buy" data-act="prem" data-id="pass">${starPrice(PASS_STARS)}</button></div>` : '';
  return `<div id="donateBox" class="donate">
    <div class="dn-hero"><div class="dn-shine"></div>
      <small>ЗОЛОТЫЕ КРЫШКИ</small><div class="dn-balance"><span>🟡</span>${fmt(S.caps)}</div>
      <small class="dn-sub">Оплата — <b>⭐ Telegram Stars</b>, прямо в Telegram, без карт</small></div>
    ${banner}
    ${typeof starterHTML === 'function' ? starterHTML() : ''}
    <div class="dn-card vip ${vipOn ? 'on' : ''}"><div class="dn-card-e">👑</div><div class="dn-card-b"><b>VIP «Авторитет» · 30 дней</b>
        <small>${vipOn ? `Активен до ${new Date(S.vipUntil).toLocaleDateString('ru-RU')} — продление добавит 30 дней` : 'Доход ×2 · копилка 24 ч вместо 8 · корона в топе и рамка'}</small>${promoBadge('vip', p)}</div>
      <button class="dn-buy" data-act="prem" data-id="vip">${starPrice(299)}</button></div>
    ${pass}
    <div class="dn-title">Наборы крышек</div>
    <div class="dn-packs">${packs}</div>
    ${typeof cosmHTML === 'function' ? cosmHTML() : ''}
    ${S.housing >= 3 && typeof autopayHTML === 'function' ? `<div class="subhead">Удобства</div>${autopayHTML()}` : ''}
    <details class="dn-more"><summary>🟡 Потратить крышки · обменять на рубли</summary>
      <div class="info-card">В обменнике 1 крышка = ${fmt(capRate())} ₽. Пачкой выгоднее — до ×2.2.</div>
      ${CAP_CASH.map((x) => card({ thumb: x.emoji, title: `${x.name}: ${fmt(capCash(x))} ₽`, desc: `${x.caps} крышек · выгода ×${x.k}`,
        btn: priceBtn('capCash', x.id, 0, S.caps >= x.caps, `🟡 ${x.caps}`) })).join('')}
      ${card({ thumb: '🚀', title: 'Доход ×2 на 5 минут', desc: 'Тапы, милостыня и работа', btn: priceBtn('capsUse', 'boost', 0, S.caps >= 5, '🟡 5') })}
      ${card({ thumb: '⚡', title: 'Полная энергия', desc: 'Мгновенно', btn: priceBtn('capsUse', 'refill', 0, S.caps >= 3, '🟡 3') })}
      ${card({ thumb: '🗑️', title: 'Свежая мусорка', desc: 'Сбросить ожидание', btn: priceBtn('capsUse', 'trash', 0, S.caps >= 1, '🟡 1') })}
      ${card({ thumb: '⏩', title: 'Закончить смену/занятие/сон', desc: 'Прямо сейчас', btn: priceBtn('capsUse', 'skip', 0, S.caps >= 2 && !!S.busy, '🟡 2') })}
    </details>
    <p class="dn-legal">Покупки поддерживают развитие игры 💛 Вопросы по оплате — команда /paysupport в боте</p>
    <div class="btns"><button class="btn wide" data-act="close">Закрыть</button></div></div>`
    // Во всех кнопках «за звёзды» — крупная звезда вместо маленькой иконки
    .replace(/<i class="ic" data-ic="star"><\/i>(\d+)/g, (_, n) => starPrice(+n));
};

// Окно доната с открытым «Потратить крышки» не схлопывается после покупки
donateRefresh = (function (orig) {
  return function () {
    const open = !!document.querySelector('#donateBox .dn-more[open]');
    orig();
    if (open) { const d = document.querySelector('#donateBox .dn-more'); if (d) d.open = true; }
  };
})(donateRefresh);
