// Автопарк: старый транспорт больше не сдаётся автоматически. После покупки нового игрок решает —
// продать прошлый за 25% цены или оставить себе. Оставленные стоят в автопарке: на любой можно пересесть
// или продать позже. Ездишь (и рискуешь угоном без гаража) только на том, на котором сидишь сейчас.

const FLEET_SELL = 0.25;
function fleet() { if (!Array.isArray(S.fleet)) S.fleet = []; return S.fleet; }
function fleetSellPrice(i) { return Math.round((TRANSPORT[i].price || 0) * FLEET_SELL); }
function ownsTransport(i) { return S.transport === i || fleet().includes(i); }

// Сломан ли транспорт — помним для каждого, чтобы пересадка не чинила машину бесплатно
function fleetPark(i) { if (!S.fleetBroken) S.fleetBroken = {}; S.fleetBroken[i] = !!S.transportBroken; }
function fleetTake(i) { S.transportBroken = !!(S.fleetBroken && S.fleetBroken[i]); if (S.fleetBroken) delete S.fleetBroken[i]; }

function fleetOffer(old) {
  const t = TRANSPORT[old];
  openModal(`<div class="big-art"><div class="rays"></div><div class="big-emoji">${t.emoji}</div></div>
    <h3>А что со старым?</h3><p>${t.name} больше не нужен каждый день. Можно продать его перекупщику или оставить себе — пересядешь, когда захочешь.</p>
    <div class="btns"><button class="btn primary wide" data-act="fleetSell" data-id="${old}" data-from="offer">💰 Продать за ${fmt(fleetSellPrice(old))} ₽ (25%)</button>
      <button class="btn wide" data-act="fleetKeep" data-id="${old}">🅿️ Оставить себе</button></div>`, { center: true });
}

function fleetHTML() {
  const list = fleet().filter((i) => TRANSPORT[i]);
  if (!list.length) return '';
  return `<div class="subhead">Твой автопарк</div>` + list.map((i) => {
    const t = TRANSPORT[i];
    const broken = S.fleetBroken && S.fleetBroken[i];
    return card({ thumb: t.emoji, title: t.name, cls: 'fleet-card',
      desc: `Мусорка −${Math.round((1 - t.trash) * 100)}% · работа +${Math.round(t.job * 100)}%${broken ? '<br><b style="color:var(--red)">Сломан</b>' : ''}${t.garage ? `<br>🅿️ ${inGarage(i) ? `«${t.garage.name}» есть` : 'без гаража — угнать могут, когда на нём ездишь'}` : ''}`,
      btn: `<div class="btn-col"><button class="btn primary small" data-act="fleetSwap" data-id="${i}">🔁 Пересесть</button>
        <button class="btn small" data-act="fleetSell" data-id="${i}">💰 ${fmt(fleetSellPrice(i))} ₽</button></div>` });
  }).join('');
}

// Вкладка: прежняя карточка «Твой» и гараж + автопарк; в салоне — полная цена без автоматической сдачи
const _transportTabFleet = EXTRA_TABS.shop.transport;
EXTRA_TABS.shop.transport = () => {
  let html = _transportTabFleet();
  const salon = html.indexOf('<div class="subhead">Автосалон');
  const head = salon >= 0 ? html.slice(0, salon) : html;
  const sellCur = S.transport ? `<button class="btn small" data-act="fleetSell" data-id="${S.transport}">💰 Продать за ${fmt(fleetSellPrice(S.transport))} ₽</button>` : '';
  const salonHTML = `<div class="subhead">Автосалон дяди Ашота</div><div class="info-card">Новый транспорт — по полной цене. Старый потом можно продать за 25% или оставить в автопарке.</div>` +
    TRANSPORT.slice(1).map((t, k) => {
      const i = k + 1;
      const ok = level() >= t.level;
      let btn;
      if (S.transport === i) btn = '<button class="btn" disabled>Твой</button>';
      else if (fleet().includes(i)) btn = '<button class="btn" disabled>В автопарке</button>';
      else if (!ok) btn = lockBtn;
      else btn = priceBtn('buyTransport', i, t.price, S.money >= t.price);
      return card({ thumb: t.emoji, title: t.name, cls: ok || ownsTransport(i) ? '' : 'locked',
        desc: `${t.desc}<br><b>Мусорка −${Math.round((1 - t.trash) * 100)}% · работа +${Math.round(t.job * 100)}%</b>${t.fuel ? ` · бензин ${fmt(t.fuel)} ₽` : ''}
          ${t.garage ? `<br>🅿️ Нужен «${t.garage.name}» — ${fmt(t.garage.price)} ₽${inGarage(i) ? ' ✓' : ''}` : ''}`,
        extra: ok ? '' : reqHTML({ level: t.level }), btn });
    }).join('');
  return head + (sellCur ? `<div class="fleet-sell-cur">${sellCur}</div>` : '') + fleetHTML() + salonHTML;
};

Object.assign(ACTIONS, {
  buyTransport: (id) => {
    const i = +id, t = TRANSPORT[i];
    if (!t || ownsTransport(i) || !purchaseAllowed72('car',i) || !shopCanPay(t) || level() < t.level) return;
    if (!shopPay(t)) return;
    const old = S.transport;
    if (old) fleetPark(old);
    S.transport = i;
    S.transportBroken = false;
    track('transport');
    sfx('buy'); confetti(40);
    toast(`${t.emoji} Теперь у тебя ${t.name}!`, 'good');
    if (old) { if (!fleet().includes(old)) fleet().push(old); setTimeout(() => fleetOffer(old), 350); }
  },
  fleetKeep: (id) => { closeModal(); toast(`🅿️ ${TRANSPORT[+id].name} стоит в автопарке — пересесть можно в «Транспорте»`, 'good'); refresh(); },
  fleetSell: (id, btn) => {
    const i = +id, t = TRANSPORT[i];
    if (!t || !ownsTransport(i)) return;
    const sum = fleetSellPrice(i);
    if (S.transport === i) { S.transport = 0; S.transportBroken = false; }
    S.fleet = fleet().filter((x) => x !== i);
    if (S.fleetBroken) delete S.fleetBroken[i];
    addMoney(sum);
    track('transportSold');
    sfx('coin');
    if (btn && btn.dataset.from === 'offer') closeModal();
    toast(`💰 ${t.name} продан за ${fmt(sum)} ₽`, 'good');
    refresh();
  },
  fleetSwap: (id) => {
    const i = +id;
    if (!fleet().includes(i) || S.busy) { if (S.busy) toast('Валера сейчас занят', 'bad'); return; }
    const old = S.transport;
    S.fleet = fleet().filter((x) => x !== i);
    if (old) { fleetPark(old); S.fleet.push(old); }
    S.transport = i;
    fleetTake(i);
    sfx('whoosh');
    toast(`${TRANSPORT[i].emoji} Пересел на ${TRANSPORT[i].name}`, 'good');
    refresh();
  },
});

// Переезд в другой город: автопарк остаётся там же, где всё нажитое
if (typeof doMove === 'function') {
  doMove = (function (orig) { return function (family) { S.fleet = []; S.fleetBroken = {}; orig(family); }; })(doMove);
}
