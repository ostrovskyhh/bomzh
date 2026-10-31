// Акции на крышки: появляются случайно и идут 2 часа. Расписание считается одинаково в игре
// и на сервере (bot/social.py), поэтому скидку и бонус проверяет сервер — подделать нельзя.

const PROMO_SLOT = 6 * 3600000;  // в каждом 6-часовом окне…
const PROMO_LEN = 2 * 3600000;   // …с шансом 45% бывает акция на 2 часа
const PROMO_CHANCE = 45;
const PROMOS = [
  { id: 'bonus60', emoji: '💰', title: 'Мешок крышек +20', desc: '+20 крышек к «Мешку крышек»', product: 'caps60', bonus: 20 },
  { id: 'chest', emoji: '🧰', title: 'Сундук Михалыча +60', desc: '+60 крышек к «Сундуку Михалыча»', product: 'caps200', bonus: 60 },
  { id: 'vip', emoji: '👑', title: 'VIP +10 дней', desc: '40 дней «Авторитета» по цене 30', product: 'vip', days: 10 },
  { id: 'sale', emoji: '🔥', title: 'Скидка 20% на крышки', desc: 'Все наборы крышек дешевле на пятую часть', products: ['caps10', 'caps60', 'caps200', 'caps500'], discount: 0.2 },
  { id: 'bundles', emoji: '🎁', title: 'Наборы −25%', desc: 'Все выгодные наборы ещё на четверть дешевле', products: ['b_week', 'b_style', 'b_cases', 'b_mex', 'b_boss'], discount: 0.25 },
  { id: 'sale500', emoji: '🏭', title: 'Склад Шныря −30%', desc: '500 крышек почти за треть дешевле', product: 'caps500', discount: 0.3 },
];

function promoHash(n) {
  let x = Math.imul(n, 0x9E3779B1) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45D9F3B) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}
function promoAt(t = Date.now()) {
  const slot = Math.floor(t / PROMO_SLOT);
  const h = promoHash(slot);
  if (h % 100 >= PROMO_CHANCE) return null;
  const start = slot * PROMO_SLOT + ((h >>> 8) % (PROMO_SLOT - PROMO_LEN));
  if (t < start || t >= start + PROMO_LEN) return null;
  return { ...PROMOS[(h >>> 16) % PROMOS.length], slot, ends: start + PROMO_LEN };
}
function promoFor(product, p = promoAt()) { return p && (p.product === product || (p.products || []).includes(product)) ? p : null; }
function promoPrice(item) { const p = promoFor(item.id); return p && p.discount ? Math.max(1, Math.round(item.stars * (1 - p.discount))) : item.stars; }

// Покупки начисляются с учётом акции, которая шла в момент оплаты (бонус считает сервер)
const _payClaim = payClaim;
let paidClaimBusy516=false;
payClaim = async function () {
  if (document.hidden || !onlineOn() || paidClaimBusy516 || SAVE_LOCK || !LOADED) return;
  paidClaimBusy516=true;
  try {
    const response = await apiPost('pay/claim', {products:Object.keys(PREM_GIVE),protocol:516});
    S.paidClaims516||=[];
    const items=(response.items||[]).filter(it=>!S.paidClaims516.includes(it.id));
    if (!items || !items.length) return;
    const got = items.map((it) => {
      const id = typeof it === 'string' ? it : it.product;
      const line = PREM_GIVE[id] ? PREM_GIVE[id](it) : '';
      const extra = [];
      if (it.bonus) { addCaps(it.bonus); extra.push(`🔥 акция: +${it.bonus} крышек`); }
      if (it.days) { S.vipUntil += it.days * 86400000; extra.push(`🔥 акция: +${it.days} дней VIP`); }
      if(it.rights?.premiumUntil75){S.premiumUntil75=it.rights.premiumUntil75;S.autopayUntil=Math.max(S.autopayUntil||0,S.premiumUntil75);}
      for(const [skin,until] of Object.entries(it.rights?.skins75||{})){S.skins75||={};S.skins75[skin]=until;}
      S.paidClaims516.push(it.id);
      return [line, ...extra].join(' · ');
    });
    track('purchase', items.length);
    save(true);
    confetti(80); sfx('jackpot');
    const receipt={ emoji: '⭐', title: 'Покупка зачислена!', text: `${got.join('<br>')}<br><br>Спасибо, что поддерживаешь игру!`, btn: 'Ура!' };
    if(typeof returnIsArriving==='function'&&returnIsArriving())returnNotice({key:'purchase:'+Date.now(),kind:'gift',title:receipt.title,body:receipt.text});else resultModal(receipt);
  } catch (e) { /* Receipt stays pending until an accepted save acknowledges it. */ }
  finally {paidClaimBusy516=false;}
};

// Магазин доната: баннер акции, перечёркнутые цены и бейджи бонусов
EXTRA_TABS.shop.premium = function premiumWithPromo() {
  delete EXTRA_TABS.shop.premium;
  let html = renderShop();
  EXTRA_TABS.shop.premium = premiumWithPromo;
  const p = promoAt();
  S.promoVisited = p ? p.slot : S.promoVisited;
  const ids = ['vip', ...PREMIUM.map((x) => x.id)];
  ids.forEach((id) => {
    const pr = promoFor(id, p);
    if (!pr) return;
    const item = id === 'vip' ? { id, stars: 299 } : PREMIUM.find((x) => x.id === id);
    const label = pr.discount ? `<s>${item.stars}</s> ${promoPrice(item)}` : `${item.stars}`;
    html = html.replace(new RegExp(`(data-act="prem" data-id="${id}"[^>]*>)<i class="ic" data-ic="star"></i>\\d+`), `$1<i class="ic" data-ic="star"></i>${label}`);
    html = html.replace(new RegExp(`(<div class="card-title">[^<]*${id === 'vip' ? 'Авторитет' : esc(item.name)})`), `$1 <span class="promo-tag">${pr.discount ? `−${Math.round(pr.discount * 100)}%` : pr.bonus ? `+${pr.bonus}` : `+${pr.days} дн.`}</span>`);
  });
  const banner = p ? `<div class="promo-hero"><div class="e">${p.emoji}</div><div><b>Акция: ${p.title}</b><p>${p.desc}. Осталось <span data-until="${p.ends}"></span></p></div></div>`
    : '<div class="info-card">🔥 Иногда здесь проходят акции на 2 часа: скидки и бонусные крышки. Заглядывай!</div>';
  return banner + html;
};

// Акция началась — один раз показываем объявление
HOOKS.tick.push(() => {
  const p = promoAt();
  if (!p || S.promoSeen === p.slot || !S.storySeen || (S.tut && !S.tut.done) || !popupTurn(5) || S.busy) return;
  if (Math.random() > 0.2) return;
  S.promoSeen = p.slot;
  sfx('notify');
  openModal(`<div class="big-art" style="height:100px"><div class="rays"></div><div class="big-emoji" style="line-height:100px">${p.emoji}</div></div>
    <h3>🔥 Акция на 2 часа!</h3><p><b>${p.title}</b><br>${p.desc}.</p>
    <p class="test-note">Закончится через <span data-until="${p.ends}"></span></p>
    <div class="btns" style="flex-direction:column;gap:8px"><button class="btn primary wide" data-act="promoGo">⭐ В магазин</button><button class="btn wide" data-act="close">Позже</button></div>`, { center: true });
});
ACTIONS.promoGo = () => { closeModal(); showScreen('shop', 'premium'); };

// Красная точка на «Донате», пока идёт акция, которую ещё не смотрели
const _sectionAlertsPromo = sectionAlerts;
sectionAlerts = () => { const a = _sectionAlertsPromo(); const p = promoAt(); a.shop.premium = !!p && S.promoVisited !== p.slot; return a; };
