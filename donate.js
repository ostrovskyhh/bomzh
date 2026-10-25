// Донат больше не вкладка магазина: он открывается только по нажатию на плашку крышек наверху.
// Здесь же — обмен крышек на рубли пачками: чем больше пачка, тем выгоднее курс, а сам курс растёт
// вместе с жильём (как и цены), поэтому купленные крышки не обесцениваются на любом этапе игры.

PREMIUM.push({ id: 'caps500', name: 'Склад Шныря', caps: 500, stars: 750, emoji: '🏭' });
PREMIUM.find((p) => p.id === 'caps60').tag = '−20%';
PREMIUM.find((p) => p.id === 'caps200').tag = '−30%';
PREMIUM.find((p) => p.id === 'caps500').tag = '−40%';
PREM_GIVE.caps500 = () => (addCaps(500), '🏭 +500 крышек');

// Пачки денег за крышки. k — во сколько раз выгоднее, чем продать крышки по одной в обменнике
const CAP_CASH = [
  { id: 'c5', caps: 5, k: 1.5, emoji: '💵', name: 'Пачка' },
  { id: 'c25', caps: 25, k: 1.8, emoji: '💴', name: 'Котлета' },
  { id: 'c100', caps: 100, k: 2.2, emoji: '💰', name: 'Чемодан' },
];
function capCash(p) { return Math.round(capRate() * p.caps * p.k); }

function donateHTML() {
  const p = promoAt();
  const tag = (id) => {
    const pr = promoFor(id, p);
    return pr ? ` <span class="promo-tag">${pr.discount ? `−${Math.round(pr.discount * 100)}%` : pr.bonus ? `+${pr.bonus}` : `+${pr.days} дн.`}</span>` : '';
  };
  const starBtn = (id, stars, item) => {
    const price = item ? promoPrice(item) : stars;
    return `<button class="btn primary" data-act="prem" data-id="${id}"><i class="ic" data-ic="star"></i>${price !== stars ? `<s>${stars}</s> ` : ''}${price}</button>`;
  };
  const banner = p ? `<div class="promo-hero"><div class="e">${p.emoji}</div><div><b>Акция: ${p.title}</b><p>${p.desc}. Осталось <span data-until="${p.ends}"></span></p></div></div>` : '';
  return `<div id="donateBox">
    <h3 style="margin-top:0">🟡 Золотые крышки: ${fmt(S.caps)}</h3>
    ${banner}
    <div class="premium-hero"><i class="ic" data-ic="crown"></i><div><b>VIP «Авторитет»</b>
      <p>Доход ×2, офлайн-копилка 24 ч вместо 8, корона в рейтинге</p></div></div>
    ${card({ thumb: '👑', title: `Авторитет на 30 дней${tag('vip')}`, desc: isVip() ? `Активен до ${new Date(S.vipUntil).toLocaleDateString('ru-RU')}` : 'Лучшее предложение', btn: starBtn('vip', 299) })}
    <div class="subhead">Купить крышки за ⭐</div>
    ${PREMIUM.map((x) => card({ thumb: x.emoji, title: `${x.name}${x.tag ? ` <span class="rarity rare">${x.tag}</span>` : ''}${tag(x.id)}`, desc: `<b>+${x.caps} крышек</b> · ${(x.stars / x.caps).toFixed(2)} ⭐ за штуку`, btn: starBtn(x.id, x.stars, x) })).join('')}
    <div class="subhead">Крышки → рубли</div>
    <div class="info-card">В обменнике 1 крышка = ${fmt(capRate())} ₽. Пачкой выгоднее — до ×2.2. Курс растёт вместе с жильём.</div>
    ${CAP_CASH.map((x) => card({ thumb: x.emoji, title: `${x.name}: ${fmt(capCash(x))} ₽`, desc: `${x.caps} крышек · выгода ×${x.k}`,
      btn: priceBtn('capCash', x.id, 0, S.caps >= x.caps, `<i class="ic" data-ic="cap"></i>${x.caps}`) })).join('')}
    <div class="subhead">Потратить крышки</div>
    ${card({ thumb: '🚀', title: 'Доход ×2 на 5 минут', desc: 'Тапы, милостыня и работа', btn: priceBtn('capsUse', 'boost', 0, S.caps >= 5, '<i class="ic" data-ic="cap"></i>5') })}
    ${card({ thumb: '⚡', title: 'Полная энергия', desc: 'Мгновенно', btn: priceBtn('capsUse', 'refill', 0, S.caps >= 3, '<i class="ic" data-ic="cap"></i>3') })}
    ${card({ thumb: '🗑️', title: 'Свежая мусорка', desc: 'Сбросить ожидание', btn: priceBtn('capsUse', 'trash', 0, S.caps >= 1, '<i class="ic" data-ic="cap"></i>1') })}
    ${card({ thumb: '⏩', title: 'Закончить смену/занятие/сон', desc: 'Прямо сейчас', btn: priceBtn('capsUse', 'skip', 0, S.caps >= 2 && !!S.busy, '<i class="ic" data-ic="cap"></i>2') })}
    <div class="btns"><button class="btn wide" data-act="close">Закрыть</button></div></div>`;
}

function openDonate() {
  const p = promoAt();
  if (p) S.promoVisited = p.slot;
  openModal(donateHTML());
  fillIcons();
  haptic('light');
}
function donateRefresh() { if ($('donateBox')) { const sc = document.querySelector('.sheet'); const top = sc ? sc.scrollTop : 0; openDonate(); const s2 = document.querySelector('.sheet'); if (s2) s2.scrollTop = top; } }

const _capsUse = ACTIONS.capsUse;
ACTIONS.capsUse = (id) => { _capsUse(id); donateRefresh(); };
ACTIONS.capCash = (id) => {
  const x = CAP_CASH.find((c) => c.id === id);
  if (!x || S.caps < x.caps) return;
  const sum = capCash(x);
  S.caps -= x.caps;
  addMoney(sum);
  sfx('coin'); haptic('success');
  toast(`${x.emoji} +${fmt(sum)} ₽`, 'good');
  save();
  donateRefresh();
};
ACTIONS.promoGo = () => { closeModal(); openDonate(); };

// Старые ссылки «в магазин доната» теперь открывают окно доната
const _showScreenDonate = showScreen;
showScreen = (name, tab) => {
  if (name === 'shop' && tab === 'premium') { openDonate(); return; }
  if (name === 'shop' && TABS.shop === 'premium') TABS.shop = 'housing';
  _showScreenDonate(name, tab);
};

// Акция идёт, а окно ещё не открывали — светится точка на плашке крышек
HOOKS.hud.push(() => {
  const p = promoAt();
  $('resCaps').classList.toggle('has-dot', !!p && S.promoVisited !== p.slot);
});
