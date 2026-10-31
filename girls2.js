// Девушки 2.8: статус девушки. Чем круче статус, тем дороже подарки она ждёт (дешёвые её не впечатляют),
// тем чаще просит что-то конкретное — и тем больше привилегий даёт, пока она с тобой.
// Плюс: искушения при девушке/жене стали заметно реже.

const GIRL_TIERS = [
  null,
  { name: 'Простая', emoji: '🙂', cls: 'common', min: 0, wish: ['rose', 'candy', 'champ', 'teddy'],
    perks: ['+0.5 😊 в минуту'], mods: {} },
  { name: 'Приличная', emoji: '🌷', cls: 'rare', min: 500, wish: ['candy', 'book', 'teddy', 'perfume', 'dress'],
    perks: ['+0.5 😊 в минуту', '+5% к зарплате — гладит рубашки', '+5% к опыту'], mods: { work: 1.05, xp: 1.05 } },
  { name: 'Элитная', emoji: '💎', cls: 'epic', min: 5000, wish: ['perfume', 'dress', 'bag', 'phone'],
    perks: ['+0.8 😊 в минуту', '+10% к зарплате — нужные знакомства', '+10% к опыту', '+5% к бутылкам за тап'], mods: { work: 1.1, xp: 1.1, tap: 1.05, mpm: 0.3 } },
  { name: 'Звезда', emoji: '👑', cls: 'legend', min: 40000, wish: ['bag', 'phone', 'earrings', 'fur', 'car'],
    perks: ['+1 😊 в минуту', '+15% ко всем доходам — ты с ней на всех фото', '+15% к опыту', '+10% к бутылкам за тап'], mods: { work: 1.15, xp: 1.15, tap: 1.1, pity: 1.15, mpm: 0.5 } },
];
const GIRL_TIER = { lyuska: 1, zinka: 1, sveta: 2, katya: 2, angela: 3, kristina: 4 };
function girlTier(id) { return GIRL_TIERS[GIRL_TIER[id] || 1]; }
function tierTag(id) { const t = girlTier(id); return `<span class="rarity ${t.cls} girl-tier">${t.emoji} ${t.name}</span>`; }

// Подарки подороже — для девушек со статусом
GIFTS.push(
  { id: 'dress', name: 'Вечернее платье', emoji: '👗', price: 15000, love: 12 },
  { id: 'phone', name: 'Новый смартфон', emoji: '📱', price: 120000, love: 22 },
  { id: 'fur', name: 'Шуба', emoji: '🧥', price: 600000, love: 40 },
  { id: 'car', name: 'Машина с бантом', emoji: '🚘', price: 2500000, love: 60 },
);
GIFTS.sort((a, b) => a.price - b.price);

// ---------- Привилегии ----------
function partnerTier() { return S.girlfriend ? girlTier(S.girlfriend) : null; }
HOOKS.mods.push((m) => {
  const t = partnerTier();
  if (!t) return;
  const k = S.married ? 1.5 : 1; // жена даёт больше
  for (const key of ['work', 'tap', 'pity']) if (t.mods[key]) m[key] *= 1 + (t.mods[key] - 1) * k;
  if (t.mods.mpm) m.mpm += t.mods.mpm;
});
xpMult = (function (orig) {
  return () => { const t = partnerTier(); return orig() * (t && t.mods.xp ? 1 + (t.mods.xp - 1) * (S.married ? 1.5 : 1) : 1); };
})(xpMult);

// ---------- Дешёвые подарки не впечатляют статусных ----------
ACTIONS.giveGift = (function (orig) {
  return (arg) => {
    const [gid, id] = arg.split(':');
    const x = GIFTS.find((y) => y.id === id), t = girlTier(gid);
    if (!x || S.money < giftPayPrice(gid,x) || cdLeft('gift_' + id) > 0) return;
    const wish = S.gfWish && S.gfWish.id === id && S.girlfriend === gid;
    const cheap = x.price < t.min;
    const loveBefore = S.love || 0, relBefore = girlState(gid).rel;
    orig(arg);
    // Статусная скривилась — половину эффекта забираем
    if (cheap) {
      if (S.girlfriend === gid) S.love = loveBefore + (S.love - loveBefore) / 2; else girlState(gid).rel = relBefore + (girlState(gid).rel - relBefore) / 2;
      toast(`${t.emoji} ${girlShort(GIRLS.find((g) => g.id === gid))} ждёт подарков посерьёзнее — эффект вдвое меньше`, 'bad');
    }
    if (wish) {
      S.gfWish = null;
      S.gfWishNext = Date.now() + rand(8, 16) * GAME_DAY;
      addLove(15);
      if (typeof addTrust === 'function') addTrust(6);
      S.wishesDone = (S.wishesDone || 0) + 1;
      track('gfWish');
      confetti(50);
      toast(`💝 Исполнил её желание! 💗 +15 и доверие +6`, 'good');
    }
  };
})(ACTIONS.giveGift);

// Подсветка дешёвых подарков и её желания в окне подарков
openGifts = (function (orig) {
  return function (gid) {
    orig(gid);
    const t = girlTier(gid);
    const wish = S.gfWish && S.girlfriend === gid ? S.gfWish.id : null;
    document.querySelectorAll('#modalRoot .card').forEach((c) => {
      const b = c.querySelector('[data-act="giveGift"]');
      const id = b && String(b.dataset.id).split(':')[1];
      const x = id && GIFTS.find((g) => g.id === id);
      const desc = c.querySelector('.card-desc');
      if (!x || !desc) return;
      if (id === wish) { c.classList.add('gift-wish'); desc.insertAdjacentHTML('beforeend', ' · <b class="wish-tag">💝 она об этом просила!</b>'); }
      else if (x.price < t.min) desc.insertAdjacentHTML('beforeend', ' · <span class="cheap-tag">для неё мелковато (×0.5)</span>');
    });
    const p = document.querySelector('#modalRoot > .sheet > p, #modalRoot p');
    if (p) p.insertAdjacentHTML('afterend', `<div class="info-card gift-tier">${tierTag(gid)} ${t.min ? `Подарки дешевле ${fmt(t.min)} ₽ её не впечатляют.` : 'Ей приятен любой знак внимания.'}</div>`);
  };
})(openGifts);

// ---------- Желания девушки ----------
const WISH_TIME = 8 * GAME_DAY; // на исполнение — 8 игровых дней (48 минут)
// «Купишь мне …» — винительный падеж
const WISH_ACC = { rose: 'букет роз', candy: 'конфеты', book: 'книгу стихов', champ: 'шампанское', teddy: 'плюшевого мишку', perfume: 'духи', dress: 'вечернее платье',
  bag: 'сумочку', phone: 'новый смартфон', earrings: 'серьги с бриллиантами', fur: 'шубу', car: 'машину с бантом' };
HOOKS.tick.push(() => {
  if (!S.girlfriend || !LOADED || !S.storySeen) { if (!S.girlfriend) S.gfWish = null; return; }
  const g = (typeof allGirls==='function'?allGirls():GIRLS).find(x=>x.id===S.girlfriend);
  if(!g)return; // Preserve unknown legacy partners; never abort later tick hooks.
  const now = Date.now();
  if (S.gfWish && S.gfWish.gid !== S.girlfriend) S.gfWish = null;
   if (S.gfWish && !S.gfWish.queued518 && now > S.gfWish.until) {
    S.gfWish = null;
    S.gfWishNext = now + rand(10, 18) * GAME_DAY;
    addLove(-10);
    if (typeof addTrust === 'function') addTrust(-4);
    const message=`😤 ${girlShort(g)} обиделась: ты так и не исполнил её просьбу. 💗 −10`;
    if(typeof relationshipInfo518==='function')relationshipInfo518('Срок просьбы закончился',message);else toast(message,'bad');
    return;
  }
  if (S.gfWish || !popupTurn(2) || S.busy || MG) return;
  if (!S.gfWishNext) { S.gfWishNext = now + 6 * GAME_DAY; return; }
  if (now < S.gfWishNext) return;
  const t = girlTier(g.id);
  const x = GIFTS.find((y) => y.id === pick(t.wish));
  if(!x)return;
   if(typeof relationshipOffer518==='function'){S.gfWish={id:x.id,gid:g.id,until:0,queued518:true};relationshipOffer518('wish',g);save();return;}
  S.gfWish = { id: x.id, gid: g.id, until: now + WISH_TIME };
  sfx('notify');
  openModal(`<div class="romance"><div class="big-art" style="height:100px"><div class="big-emoji" style="line-height:100px">${g.emoji}</div></div>
    <h3>${girlShort(g)} кое-что хочет</h3>
    <p>«Зай, а купишь мне <b>${x.emoji} ${WISH_ACC[x.id] || x.name.toLowerCase()}</b>? Ну пожа-а-алуйста!»</p>
    <p class="test-note">${tierTag(g.id)} Подари в течение 8 игровых дней: 💗 +15 сверху и доверие +6. Не успеешь — обидится.</p>
    <div class="btns" style="flex-direction:column;gap:8px"><button class="btn primary wide" data-act="giftMenu" data-id="${g.id}">🎁 К подаркам · ${fmt(giftPayPrice(g.id,x))} ₽</button>
    <button class="btn wide" data-act="close">Позже</button></div></div>`, { center: true });
});

// ---------- Вкладка «Свидания»: статусы, привилегии, желание ----------
const _datesTabTier = EXTRA_TABS.fun.dates;
EXTRA_TABS.fun.dates = () => {
  let html = _datesTabTier();
  GIRLS.forEach((g) => { html = html.replace(`<div class="card-title">${g.name}</div>`, `<div class="card-title">${g.name} ${tierTag(g.id)}</div>`); });
  const t = partnerTier();
  if (t) {
    const g = GIRLS.find((x) => x.id === S.girlfriend);
    const w = S.gfWish && GIFTS.find((y) => y.id === S.gfWish.id);
    const box = `<div class="info-card gf-perks"><b>${tierTag(g.id)} Привилегии, пока она с тобой${S.married ? ' · жена ×1.5' : ''}</b>
      <ul>${t.perks.map((p) => `<li>${p}</li>`).join('')}</ul>
       ${w ? `<div class="gf-wish">💝 Просит: <b>${w.emoji} ${w.name}</b> · ${S.gfWish.queued518?'срок начнётся после прочтения':'осталось <span data-until="'+S.gfWish.until+'"></span>'}
        <button class="btn small primary" data-act="giftMenu" data-id="${g.id}">🎁 Подарить</button></div>` : '<small>Иногда она будет просить конкретный подарок — исполняй, и любовь вырастет быстрее.</small>'}</div>`;
    html = html.replace(/(<div class="premium-hero wife-hero">[\s\S]*?<\/div><\/div>)/, `$1${box}`);
  }
  return html.replace('Каждое свидание — мини-игра: прогулка, разговор или танец.', 'У каждого свидания своя мини-игра.')
    + '<div class="info-card">Статус: 🙂 простая → 🌷 приличная → 💎 элитная → 👑 звезда. Чем выше статус, тем дороже подарки и сложнее завоевать, зато больше привилегий.</div>';
};

// ---------- Искушения: при девушке и жене — редко ----------
const TEMPT_GF = 20 * GAME_DAY;   // ≈ раз в 2 часа
const TEMPT_WIFE = 40 * GAME_DAY; // ≈ раз в 4 часа
approachGap = () => (S.married ? TEMPT_WIFE : S.girlfriend ? TEMPT_GF : APPROACH_SINGLE);
// Даже когда срок подошёл — только в половине случаев
temptation = (function (orig) { return (g) => { if (!(typeof RELATIONSHIP_MANUAL518!=='undefined'&&RELATIONSHIP_MANUAL518)&&Math.random() < 0.5) return; orig(g); }; })(temptation);
// Свидание со своей отодвигает искушение
HOOKS.track.push((key) => { if (key === 'date' && S.girlfriend) S.approachAt = Math.max(S.approachAt || 0, Date.now() + approachGap() / 2); });
// Старые сохранения: искушение было запланировано по старому частому графику
HOOKS.load.push(() => { if (S.girlfriend && !S.temptFix28) { S.temptFix28 = true; S.approachAt = Date.now() + approachGap(); } });

ACHS.push({ id: 'gf_wish', name: 'Золотая рыбка', emoji: '💝', fn: () => S.wishesDone || 0, goals: [1, 5, 20, 50], unit: 'исполненных желаний девушки' });
