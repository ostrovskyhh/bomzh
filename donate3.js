// Донат 4.1: золотые крышки — редкая донатная валюта с одним курсом.
// • 1 крышка = 2 ⭐ во всех наборах (без «чем больше, тем выгоднее»), выгода — в наборах, скидке дня и акциях.
// • 1 крышка = ~30% лучшей смены игрока в рублях: курс считается от зарплаты в текущем городе и на текущей
//   должности, поэтому крышка весит одинаково и в Засранске на старте, и в Мексике на вилле.
// • Окно доната с вкладками: крышки, наборы, донат-кейсы, стиль (эффекты, ауры, рамки, аватарки), обмен.

const CAP_STARS = 2;
const CAP_SHIFT = 0.3;

[['caps10', 10], ['caps60', 60], ['caps200', 200], ['caps500', 500]].forEach(([id, c]) => {
  const p = PREMIUM.find((x) => x.id === id);
  if (p) { p.caps = c; p.stars = c * CAP_STARS; delete p.tag; }
});

// ---------- Курс ----------
function capShift() {
  let best = 0;
  JOBS.forEach((j) => {
    if (!reqOk(j.req)) return;
    const r = jobShifts(j.id) ? jobRank(j.id) : 0;
    const m = typeof POS_MULT !== 'undefined' ? POS_MULT[r] || 1 : (RANKS[r] && RANKS[r].mult) || 1;
    best = Math.max(best, j.pay * m);
  });
  return best || JOBS[0].pay;
}
function capNice(v) { const p = 10 ** Math.max(0, Math.floor(Math.log10(Math.max(1, v))) - 1); return Math.max(10, Math.round(v / p) * p); }
capRate = function () { return capNice(capShift() * CAP_SHIFT); };

// ---------- Скидка дня (та же формула на сервере, bot/social.py) ----------
const DEAL_STAR = ['caps60', 'caps200', 'b_week', 'b_style', 'b_cases', 'b_mex', 'b_boss', 'vip', 'caps500'];
const DEAL_OFF = 0.3;
const COSM_DEAL_OFF = 0.4;
function mskDay(t = Date.now()) { return Math.floor((t + 3 * 3600000) / 86400000); }
function dayEnds(t = Date.now()) { return (mskDay(t) + 1) * 86400000 - 3 * 3600000; }
function dealOfDay(t = Date.now()) { return { product: DEAL_STAR[promoHash(mskDay(t) * 7 + 3) % DEAL_STAR.length], discount: DEAL_OFF, ends: dayEnds(t) }; }
promoPrice = function (item) {
  let d = 0;
  const p = promoFor(item.id);
  if (p && p.discount) d = p.discount;
  if (dealOfDay().product === item.id) d = Math.max(d, DEAL_OFF);
  return d ? Math.max(1, Math.round(item.stars * (1 - d))) : item.stars;
};

// ---------- Наборы за звёзды ----------
const BUNDLES = [
  { id: 'b_week', stars: 99, emoji: '📦', name: 'Набор на неделю', items: ['👑 VIP 7 дней', '🟡 25 крышек', '🎁 Кейс Шныря'], worth: 180,
    give: () => { dnVip(7); addCaps(25); dnKey('dc1', 1); } },
  { id: 'b_style', stars: 149, emoji: '💜', name: 'Неоновый вечер', items: ['💜 Эффект «Неон»', '🟪 Аура «Неон»', '🖼️ Рамка «Кибер»', '🦾 Аватарка «Киборг»', '🟡 20 крышек'], worth: 330, only: true,
    give: () => { ['fx_neon', 'au_neon', 'fr_cyber', 'av_cyber'].forEach(cosmGet); addCaps(20); } },
  { id: 'b_cases', stars: 199, emoji: '🎰', name: 'Пачка кейсов', items: ['💼 2 Кейса Авторитета', '🎁 2 Кейса Шныря'], worth: 440,
    give: () => { dnKey('dc2', 2); dnKey('dc1', 2); } },
  { id: 'b_mex', stars: 249, emoji: '🪅', name: 'Сеньор Фиеста', items: ['🌮 Эффект «Тако»', '🎉 Аура «Фиеста»', '🖼️ Рамка «Фиеста»', '🪅 Аватарка «Пиньята»', '🟡 60 крышек'], worth: 450, only: true,
    give: () => { ['fx_taco', 'au_fiesta', 'fr_fiesta', 'av_pinata'].forEach(cosmGet); addCaps(60); } },
  { id: 'b_boss', stars: 499, emoji: '🦍', name: 'Пахан района', items: ['👑 VIP 30 дней', '🟡 100 крышек', '🧳 Кейс Пахана', '🖼️ Рамка «Пахан»', '🦍 Аватарка «Пахан»', '👑 Эффект «Корона»'], worth: 1100, only: true,
    give: () => { dnVip(30); addCaps(100); dnKey('dc3', 1); ['fr_pahan', 'av_pahan', 'fx_crown'].forEach(cosmGet); } },
];
function dnVip(days) { S.vipUntil = Math.max(Date.now(), S.vipUntil || 0) + days * 86400000; }
function dnKey(id, n) { if (!S.dkeys) S.dkeys = {}; S.dkeys[id] = (S.dkeys[id] || 0) + n; }
BUNDLES.forEach((b) => { PREM_GIVE[b.id] = () => { b.give(); return `${b.emoji} Набор «${b.name}»: ${b.items.join(', ')}`; }; });

// ---------- Косметика за крышки ----------
// src: shop — витрина, case — только из донат-кейсов, bundle — только в наборах. caps — цена на витрине
const COSM2 = [
  // эффекты тапа
  { id: 'fx_snow', kind: 'fx', name: 'Снегопад', emoji: '❄️', caps: 12, parts: ['❄️', '❅', '✨'] },
  { id: 'fx_bottle', kind: 'fx', name: 'Стеклотара', emoji: '🍾', caps: 12, parts: ['🍾', '🥃', '🫙'] },
  { id: 'fx_caps', kind: 'fx', name: 'Золотые крышки', emoji: '🟡', caps: 15, parts: ['🟡', '✨', '🟡'] },
  { id: 'fx_music', kind: 'fx', name: 'Музыка', emoji: '🎵', caps: 12, parts: ['🎵', '🎶', '🎸'] },
  { id: 'fx_flower', kind: 'fx', name: 'Цветы', emoji: '🌸', caps: 12, parts: ['🌸', '🌼', '🌷'] },
  { id: 'fx_bolt', kind: 'fx', name: 'Молнии', emoji: '⚡', caps: 15, parts: ['⚡', '💥', '⚡'] },
  { id: 'fx_skull', kind: 'fx', name: 'Черепа', emoji: '💀', src: 'case', r: 'rare', parts: ['💀', '☠️', '🦴'] },
  { id: 'fx_rainbow', kind: 'fx', name: 'Радуга', emoji: '🌈', src: 'case', r: 'epic', parts: ['🌈', '🦄', '✨'] },
  { id: 'fx_diamond', kind: 'fx', name: 'Бриллианты', emoji: '💎', src: 'case', r: 'legend', parts: ['💎', '💠', '✨'] },
  { id: 'fx_neon', kind: 'fx', name: 'Неон', emoji: '💜', src: 'bundle', parts: ['💜', '💙', '🩷'] },
  { id: 'fx_taco', kind: 'fx', name: 'Тако', emoji: '🌮', src: 'bundle', parts: ['🌮', '🌶️', '🌯'] },
  { id: 'fx_crown', kind: 'fx', name: 'Корона', emoji: '👑', src: 'bundle', parts: ['👑', '💰', '✨'] },
  // ауры вокруг Валеры
  { id: 'au_gold', kind: 'aura', name: 'Золотая аура', emoji: '🌟', caps: 40 },
  { id: 'au_fire', kind: 'aura', name: 'Огненная аура', emoji: '🔥', caps: 40 },
  { id: 'au_ice', kind: 'aura', name: 'Ледяная аура', emoji: '🧊', caps: 40 },
  { id: 'au_toxic', kind: 'aura', name: 'Токсичная аура', emoji: '☢️', caps: 40 },
  { id: 'au_shadow', kind: 'aura', name: 'Аура тени', emoji: '🌑', src: 'case', r: 'epic' },
  { id: 'au_rainbow', kind: 'aura', name: 'Радужная аура', emoji: '🌈', src: 'case', r: 'epic' },
  { id: 'au_galaxy', kind: 'aura', name: 'Аура галактики', emoji: '🌌', src: 'case', r: 'legend' },
  { id: 'au_neon', kind: 'aura', name: 'Аура «Неон»', emoji: '🟪', src: 'bundle' },
  { id: 'au_fiesta', kind: 'aura', name: 'Аура «Фиеста»', emoji: '🎉', src: 'bundle' },
  // рамки
  { id: 'fr_ice', kind: 'frame', frame: 'ice', name: 'Лёд', emoji: '🧊', caps: 20 },
  { id: 'fr_toxic', kind: 'frame', frame: 'toxic', name: 'Токсик', emoji: '☢️', caps: 20 },
  { id: 'fr_sakura', kind: 'frame', frame: 'sakura', name: 'Сакура', emoji: '🌸', caps: 25 },
  { id: 'fr_matrix', kind: 'frame', frame: 'matrix', name: 'Матрица', emoji: '🟩', caps: 25 },
  { id: 'fr_blood', kind: 'frame', frame: 'blood', name: 'Кровь района', emoji: '🩸', caps: 25 },
  { id: 'fr_galaxy', kind: 'frame', frame: 'galaxy', name: 'Галактика', emoji: '🌌', src: 'case', r: 'epic' },
  { id: 'fr_lava', kind: 'frame', frame: 'lava', name: 'Лава', emoji: '🌋', src: 'case', r: 'rare' },
  { id: 'fr_emerald', kind: 'frame', frame: 'emerald', name: 'Изумруд', emoji: '💚', src: 'case', r: 'rare' },
  { id: 'fr_storm', kind: 'frame', frame: 'storm', name: 'Гроза', emoji: '⛈️', src: 'case', r: 'epic' },
  { id: 'fr_king', kind: 'frame', frame: 'king', name: 'Король помоек', emoji: '👑', src: 'case', r: 'legend' },
  { id: 'fr_cyber', kind: 'frame', frame: 'cyber', name: 'Кибер', emoji: '🦾', src: 'bundle' },
  { id: 'fr_fiesta', kind: 'frame', frame: 'fiesta', name: 'Фиеста', emoji: '🪅', src: 'bundle' },
  { id: 'fr_pahan', kind: 'frame', frame: 'pahan', name: 'Пахан', emoji: '🦍', src: 'bundle' },
  // аватарки
  ...[['wolf', '🐺', 'Волк'], ['lion', '🦁', 'Лев'], ['fox', '🦊', 'Лис'], ['bear', '🐻', 'Медведь'], ['cat', '🐱', 'Кот'], ['frog', '🐸', 'Жаба'],
    ['robot', '🤖', 'Робот'], ['ghost', '👻', 'Призрак'], ['clown', '🤡', 'Клоун'], ['ninja', '🥷', 'Ниндзя'], ['wizard', '🧙', 'Маг'], ['cowboy', '🤠', 'Ковбой'],
    ['shark', '🦈', 'Акула'], ['moon', '🌚', 'Луна'], ['skull', '💀', 'Череп'], ['vampire', '🧛', 'Вампир']]
    .map(([id, face, name]) => ({ id: 'av_' + id, kind: 'avatar', face, name, caps: 8 })),
  ...[['dino', '🦖', 'Динозавр', 'rare'], ['octo', '🐙', 'Осьминог', 'rare'], ['eagle', '🦅', 'Орёл', 'rare'], ['genie', '🧞', 'Джинн', 'epic'],
    ['oni', '👹', 'Демон', 'epic'], ['prince', '🤴', 'Принц', 'legend'], ['peacock', '🦚', 'Павлин', 'legend']]
    .map(([id, face, name, r]) => ({ id: 'av_' + id, kind: 'avatar', face, name, src: 'case', r })),
  { id: 'av_cyber', kind: 'avatar', face: '🦾', name: 'Киборг', src: 'bundle' },
  { id: 'av_pinata', kind: 'avatar', face: '🪅', name: 'Пиньята', src: 'bundle' },
  { id: 'av_pahan', kind: 'avatar', face: '🦍', name: 'Пахан', src: 'bundle' },
];
// Старая косметика за звёзды теперь тоже продаётся за крышки
const OLD_CAPS = { fx_hearts: 12, fx_stars: 12, fx_money: 12, fx_fire: 15, fr_neon: 20, fr_rainbow: 25, av_unicorn: 8, av_dragon: 8, av_alien: 8, av_cool: 8 };
COSMETICS.forEach((c) => { if (OLD_CAPS[c.id]) c.caps = OLD_CAPS[c.id]; });
COSM2.forEach((c) => {
  COSMETICS.push(c);
  const how = c.src === 'case' ? 'донат-кейс' : c.src === 'bundle' ? 'донатный набор' : `донат за ${c.caps} 🟡`;
  if (c.kind === 'frame') FRAMES.push({ id: c.frame, name: c.name, need: () => ownsCosm(c.id), how, donate: true });
  if (c.kind === 'avatar') AVATARS.push({ id: cosmAva(c), face: c.face, name: c.name, how, need: () => ownsCosm(c.id), donate: true });
});
FRAMES.forEach((f) => { if (COSMETICS.some((c) => c.frame === f.id)) f.donate = true; });
AVATARS.forEach((a) => { if (COSMETICS.some((c) => c.kind === 'avatar' && cosmAva(c) === a.id)) a.donate = true; });
function cosmById(id) { return COSMETICS.find((c) => c.id === id); }
function cosmOn(c) { return c.kind === 'fx' ? S.tapFx === c.id : c.kind === 'aura' ? S.aura === c.id : c.kind === 'frame' ? S.frame === c.frame : S.avatar === cosmAva(c); }
function cosmWear(c) {
  if (c.kind === 'fx') S.tapFx = c.id;
  if (c.kind === 'aura') S.aura = c.id;
  if (c.kind === 'frame') S.frame = c.frame;
  if (c.kind === 'avatar') S.avatar = cosmAva(c);
}
function cosmGet(id) { const c = cosmById(id); if (!c) return; const had = ownsCosm(id); giveCosm(id); if (!had) cosmWear(c); }
function cosmKindName(c) { return { fx: 'Эффект тапа', aura: 'Аура', frame: 'Рамка', avatar: 'Аватарка' }[c.kind]; }

// Скидка дня на косметику за крышки: две вещи с витрины −40%
function cosmDeals(t = Date.now()) {
  const shop = COSMETICS.filter((c) => c.caps && !c.src);
  const d = mskDay(t);
  const a = shop[promoHash(d * 13 + 1) % shop.length];
  let b = shop[promoHash(d * 13 + 2) % shop.length];
  if (b === a) b = shop[(shop.indexOf(a) + 1) % shop.length];
  return [a.id, b.id];
}
function cosmPrice(c) { return cosmDeals().includes(c.id) ? Math.max(1, Math.round(c.caps * (1 - COSM_DEAL_OFF))) : c.caps; }

// Аура вокруг Валеры
HOOKS.hud.push(() => {
  const el = $('valera');
  if (!el) return;
  const a = S.aura && ownsCosm(S.aura) ? S.aura.replace('au_', '') : '';
  if (el.dataset.aura !== a) {
    if (el.dataset.aura) el.classList.remove('aura-' + el.dataset.aura);
    if (a) el.classList.add('aura', 'aura-' + a); else el.classList.remove('aura');
    el.dataset.aura = a;
  }
});

// В «Достижениях» донатные рамки и аватарки видны, только если куплены (иначе список на три экрана)
EXTRA_TABS.tasks.ach = (function (orig) {
  return () => {
    const f0 = FRAMES.slice(), a0 = AVATARS.slice();
    const keep = (x) => !x.donate || x.need();
    FRAMES.splice(0, FRAMES.length, ...f0.filter(keep));
    AVATARS.splice(0, AVATARS.length, ...a0.filter(keep));
    try { return orig() + '<div class="info-card">✨ Ещё рамки, аватарки, эффекты и ауры — в окне доната (плашка 🟡 наверху)</div>'; }
    finally { FRAMES.splice(0, FRAMES.length, ...f0); AVATARS.splice(0, AVATARS.length, ...a0); }
  };
})(EXTRA_TABS.tasks.ach);

// ---------- Донат-кейсы ----------
const RAR_NAME = { common: 'Обычное', rare: 'Редкое', epic: 'Эпическое', legend: 'Легендарное' };
const DCASES = [
  { id: 'dc1', name: 'Кейс Шныря', emoji: '🎁', caps: 30, desc: 'Крышки, VIP, ускорения и шанс на редкую косметику', loot: [
    { t: 'money', n: 25, w: 28, r: 'common' }, { t: 'caps', n: 20, w: 22, r: 'common' }, { t: 'boost', n: 30, w: 10, r: 'common' },
    { t: 'caps', n: 30, w: 14, r: 'rare' }, { t: 'vip', n: 3, w: 8, r: 'rare' }, { t: 'cosm', pool: 'rare', w: 12, r: 'rare' },
    { t: 'caps', n: 80, w: 4, r: 'epic' }, { t: 'cosm', pool: 'epic', w: 2, r: 'epic' }] },
  { id: 'dc2', name: 'Кейс Авторитета', emoji: '💼', caps: 80, desc: 'Эпические ауры и рамки, VIP до 5 дней', loot: [
    { t: 'money', n: 60, w: 22, r: 'common' }, { t: 'caps', n: 45, w: 22, r: 'common' }, { t: 'vip', n: 5, w: 12, r: 'rare' },
    { t: 'caps', n: 100, w: 14, r: 'rare' }, { t: 'cosm', pool: 'rare', w: 12, r: 'rare' }, { t: 'cosm', pool: 'epic', w: 11, r: 'epic' },
    { t: 'caps', n: 200, w: 4, r: 'epic' }, { t: 'cosm', pool: 'legend', w: 3, r: 'legend' }] },
  { id: 'dc3', name: 'Кейс Пахана', emoji: '🧳', caps: 200, desc: 'Лучший шанс на легендарную косметику', loot: [
    { t: 'money', n: 150, w: 18, r: 'common' }, { t: 'caps', n: 130, w: 22, r: 'common' }, { t: 'vip', n: 14, w: 14, r: 'rare' },
    { t: 'caps', n: 260, w: 14, r: 'rare' }, { t: 'cosm', pool: 'epic', w: 16, r: 'epic' }, { t: 'caps', n: 450, w: 5, r: 'legend' },
    { t: 'cosm', pool: 'legend', w: 11, r: 'legend' }] },
];
const DC_REFUND = 0.5; // повтор косметики — половина цены редкости крышками
const POOL_CAPS = { rare: 20, epic: 50, legend: 120 };
function dcPool(r) { return COSMETICS.filter((c) => c.src === 'case' && c.r === r); }
function dcRoll(c) {
  const sum = c.loot.reduce((a, x) => a + x.w, 0);
  let v = Math.random() * sum;
  const x = c.loot.find((l) => (v -= l.w) < 0) || c.loot[0];
  if (x.t !== 'cosm') return { ...x };
  const pool = dcPool(x.pool);
  const fresh = pool.filter((p) => !ownsCosm(p.id));
  const it = pick(fresh.length ? fresh : pool);
  return { ...x, id: it.id };
}
function dcIcon(x) { return x.t === 'caps' ? '🟡' : x.t === 'money' ? '💰' : x.t === 'vip' ? '👑' : x.t === 'boost' ? '🚀' : (cosmById(x.id).face || cosmById(x.id).emoji); }
function dcLabel(x) {
  if (x.t === 'caps') return `${x.n} 🟡`;
  if (x.t === 'money') return `${fmt(x.n * capRate())} ₽`;
  if (x.t === 'vip') return `VIP ${x.n} дн.`;
  if (x.t === 'boost') return `×2 на ${x.n} мин`;
  const c = cosmById(x.id);
  return c.name;
}
function dcGive(x) {
  if (x.t === 'caps') { addCaps(x.n); return `+${x.n} 🟡 крышек`; }
  if (x.t === 'money') { const m = x.n * capRate(); addMoney(m); return `+${fmt(m)} ₽`; }
  if (x.t === 'vip') { dnVip(x.n); return `👑 VIP на ${x.n} дн.`; }
  if (x.t === 'boost') { S.boostUntil = Math.max(Date.now(), S.boostUntil || 0) + x.n * 60000; return `🚀 Доход ×2 на ${x.n} мин`; }
  const c = cosmById(x.id);
  if (ownsCosm(c.id)) { const back = Math.round(POOL_CAPS[x.pool] * DC_REFUND); addCaps(back); return `${cosmKindName(c)} «${c.name}» уже есть — вместо неё +${back} 🟡`; }
  cosmGet(c.id);
  return `${cosmKindName(c)} «${c.name}» — уже на тебе!`;
}
function dcChance(c) {
  const sum = c.loot.reduce((a, x) => a + x.w, 0);
  return c.loot.map((x) => `<div class="dc-odd r-${x.r}"><span>${x.t === 'cosm' ? '✨' : dcIcon(x)}</span><b>${x.t === 'cosm' ? `${RAR_NAME[x.pool]} косметика` : dcLabel(x)}</b><small>${((x.w / sum) * 100).toFixed(1)}%</small></div>`).join('');
}

let DC_LAST = null;
function dcOpen(id) {
  const c = DCASES.find((x) => x.id === id);
  if (!c) return null;
  const keys = (S.dkeys && S.dkeys[id]) || 0;
  if (keys > 0) S.dkeys[id] = keys - 1;
  else if (S.caps >= c.caps) S.caps -= c.caps;
  else return null;
  const win = dcRoll(c);
  const text = dcGive(win);
  track('dcase');
  DC_LAST = { win, text };
  save();
  return { c, win, text };
}

// ---------- Окно доната ----------
let DN_TAB = 'caps', DN_STYLE = 'fx';
const DN_TABS = [['caps', '🟡', 'Крышки'], ['sets', '🎁', 'Наборы'], ['cases', '🎰', 'Кейсы'], ['style', '✨', 'Стиль'], ['bottles', '🍾', 'Бутылки'], ['spend', '💱', 'Обмен']];

function dnStars(id, stars, full) {
  return `<button class="dn-buy" data-act="prem" data-id="${id}">${starPrice(stars, full)}</button>`;
}
function dnDealHTML() {
  const d = dealOfDay();
  const b = BUNDLES.find((x) => x.id === d.product), p = PREMIUM.find((x) => x.id === d.product);
  const it = b || p || { id: 'vip', stars: 299, emoji: '👑', name: 'VIP «Авторитет» 30 дней' };
  const name = b ? `Набор «${b.name}»` : p ? `${p.name} · ${p.caps} 🟡` : it.name;
  return `<div class="dn-deal"><div class="dn-deal-tag">СКИДКА ДНЯ −${Math.round(DEAL_OFF * 100)}%</div><span class="dn-deal-e">${it.emoji}</span>
    <div class="dn-card-b"><b>${name}</b><small>До конца дня по Москве: <span data-until="${d.ends}"></span></small></div>
    ${dnStars(it.id, promoPrice({ id: it.id, stars: it.stars }), it.stars)}</div>`;
}

function dnCapsTab(p) {
  const packs = PREMIUM.map((x) => {
    const price = promoPrice(x);
    return `<button class="dn-pack" data-act="prem" data-id="${x.id}">${promoBadge(x.id, p)}${dealOfDay().product === x.id ? '<span class="dn-promo">🔥 −30%</span>' : ''}
      <span class="dn-pack-e">${x.emoji}</span><b class="dn-caps">${x.caps}<small>🟡</small></b><span class="dn-pack-n">${x.name}</span>${starPrice(price, x.stars)}</button>`;
  }).join('');
  return `${dnDealHTML()}
    <div class="dn-title">Наборы крышек</div>
    <div class="dn-packs">${packs}</div>
    <div class="info-card">🟡 Курс один для всех наборов: <b>1 крышка = ${CAP_STARS} ⭐</b>. Выгода — в наборах, скидке дня и акциях на 2 часа.<br>
      По курсу обменника сейчас 1 крышка = <b>${fmt(capRate())} ₽</b> — это ~${Math.round(CAP_SHIFT * 100)}% твоей лучшей смены, в любом городе и на любом уровне.</div>`;
}

function dnSetsTab(p) {
  const vipOn = isVip();
  const passPaid = typeof passState === 'function' && passState().paid;
  const deal = dealOfDay().product;
  const sets = BUNDLES.map((b) => {
    const price = promoPrice(b);
    const save = Math.round((1 - price / b.worth) * 100);
    return `<div class="dn-set ${b.only ? 'only' : ''}"><div class="dn-set-h"><span>${b.emoji}</span><div><b>${b.name}</b><small>${b.only ? '✨ Эксклюзив: эти вещи есть только в наборе' : `Выгода ${save}%`}</small></div>${promoBadge(b.id, p)}${deal === b.id ? '<span class="dn-promo">🔥 −30%</span>' : ''}</div>
      <div class="sp-items">${b.items.map((i) => `<span>${i}</span>`).join('')}</div>
      <div class="dn-set-f"><small>По отдельности ≈ ${b.worth} ⭐</small>${dnStars(b.id, price, b.stars)}</div></div>`;
  }).join('');
  return `${typeof starterHTML === 'function' ? starterHTML() : ''}
    <div class="dn-card vip ${vipOn ? 'on' : ''}"><div class="dn-card-e">👑</div><div class="dn-card-b"><b>VIP «Авторитет» · 30 дней</b>
      <small>${vipOn ? `Активен до ${new Date(S.vipUntil).toLocaleDateString('ru-RU')} — продление добавит 30 дней` : 'Доход ×2 · копилка 24 ч вместо 8 · корона в топе и рамка'}</small>${promoBadge('vip', p)}</div>
      ${dnStars('vip', promoPrice({ id: 'vip', stars: 299 }), 299)}</div>
    ${typeof PASS_STARS !== 'undefined' && !passPaid ? `<div class="dn-card pass"><div class="dn-card-e">🎫</div><div class="dn-card-b"><b>Золотой пропуск сезона</b>
      <small>Крышки и деньги на каждом уровне, Кепка сезона, 3 дня VIP. Награды за пройденные уровни — сразу</small></div>${dnStars('pass', PASS_STARS)}</div>` : ''}
    <div class="dn-title">Выгодные наборы</div>${sets}
    ${S.housing >= 3 && typeof autopayHTML === 'function' ? `<div class="subhead">Удобства</div>${autopayHTML()}` : ''}`;
}

function dnCasesTab() {
  return `<div class="info-card">🎰 Донат-кейсы открываются за крышки. Внутри — крышки, VIP, ускорения и косметика, которой <b>нет на витрине</b>. Повтор вещи — половина её цены крышками.</div>
    ${DCASES.map((c) => {
      const keys = (S.dkeys && S.dkeys[c.id]) || 0;
      return `<div class="dc-card ${c.id}"><div class="dc-head"><span class="dc-e">${c.emoji}</span><div><b>${c.name}</b><small>${c.desc}</small></div></div>
        <details class="dc-odds"><summary>Что внутри и шансы</summary>${dcChance(c)}</details>
        <button class="btn primary wide" data-act="dcOpen" data-id="${c.id}" ${keys || S.caps >= c.caps ? '' : `disabled data-why="Нужно ${c.caps} 🟡"`}>${keys ? `🔑 Открыть (ключей: ${keys})` : `Открыть за 🟡 ${c.caps}`}</button></div>`;
    }).join('')}`;
}

function dnStyleTab() {
  const kinds = [['fx', '✨ Эффекты', 'Летят из Валеры при тапе'], ['aura', '🌟 Ауры', 'Светятся вокруг Валеры'], ['frame', '🖼️ Рамки', 'Видны в топе, чате и банде'], ['avatar', '😎 Аватарки', 'Вместо буквы имени']];
  const [, , hint] = kinds.find((k) => k[0] === DN_STYLE);
  const deals = cosmDeals();
  const list = COSMETICS.filter((c) => c.kind === DN_STYLE).sort((a, b) => (ownsCosm(b.id) - ownsCosm(a.id)) || ((a.src ? 1 : 0) - (b.src ? 1 : 0)));
  const item = (c) => {
    const own = ownsCosm(c.id), on = own && cosmOn(c);
    const deal = deals.includes(c.id);
    const preview = c.kind === 'frame' ? `<div class="avatar frame-${c.frame}">${esc(playerName()[0])}</div>`
      : c.kind === 'aura' ? `<div class="aura-prev aura aura-${c.id.replace('au_', '')}">🧔</div>`
      : c.kind === 'avatar' ? `<div class="avatar emoji-ava" style="background:${avaBg(cosmAva(c))}">${c.face}</div>` : `<span>${c.emoji}</span>`;
    const btn = own ? `<button class="btn small ${on ? '' : 'green'}" data-act="cosmUse" data-id="${c.id}">${on ? 'Надето' : 'Надеть'}</button>`
      : c.src === 'case' ? `<small class="cosm-src r-${c.r}">🎰 ${RAR_NAME[c.r]} · кейс</small>`
      : c.src === 'bundle' ? '<small class="cosm-src">🎁 в наборе</small>'
      : `<button class="btn primary small" data-act="cosmBuy" data-id="${c.id}" ${S.caps >= cosmPrice(c) ? '' : `data-why="Нужно ${cosmPrice(c)} 🟡"`}>${deal ? `<s>${c.caps}</s> ` : ''}🟡 ${cosmPrice(c)}</button>`;
    return `<div class="cosm ${own ? 'own' : ''} ${on ? 'on' : ''} ${deal && !own ? 'deal' : ''}">${deal && !own ? '<i class="cosm-deal">−40%</i>' : ''}${preview}<b>${c.name}</b>${btn}</div>`;
  };
  return `<div class="dn-subtabs">${kinds.map(([k, t]) => `<button class="${k === DN_STYLE ? 'on' : ''}" data-act="dnStyle" data-id="${k}">${t}</button>`).join('')}</div>
    <div class="cosm-title">${hint} <small>${COSMETICS.filter((c) => c.kind === DN_STYLE && ownsCosm(c.id)).length} из ${list.length}</small></div>
    <div class="cosm-grid">${list.map(item).join('')}</div>
    <small class="weekly-note">🔥 Каждый день две вещи с витрины стоят на 40% дешевле. Обновление в полночь по Москве.</small>`;
}

function dnSpendTab() {
  const r = capRate();
  const sell = [1, 10, 50].map((n) => card({ thumb: n >= 50 ? '💰' : n >= 10 ? '💴' : '💵', title: `${n} 🟡 → ${fmt(n * r)} ₽`, desc: 'По единому курсу', btn: priceBtn('capSell', String(n), 0, S.caps >= n, `🟡 ${n}`) })).join('');
  return `<div class="info-card">💱 Один курс для любой суммы: <b>1 крышка = ${fmt(r)} ₽</b>. Он растёт вместе с твоей зарплатой, поэтому крышка не обесценивается ни в одном городе.</div>
    ${sell}
    <div class="subhead">Потратить крышки</div>
    ${card({ thumb: '🚀', title: 'Доход ×2 на 5 минут', desc: 'Тапы, милостыня и работа', btn: priceBtn('capsUse', 'boost', 0, S.caps >= 5, '🟡 5') })}
    ${card({ thumb: '⚡', title: 'Полная энергия', desc: 'Мгновенно', btn: priceBtn('capsUse', 'refill', 0, S.caps >= 3, '🟡 3') })}
    ${card({ thumb: '🗑️', title: 'Свежая мусорка', desc: 'Сбросить ожидание', btn: priceBtn('capsUse', 'trash', 0, S.caps >= 1, '🟡 1') })}
    ${card({ thumb: '⏩', title: 'Закончить смену/занятие/сон', desc: 'Прямо сейчас', btn: priceBtn('capsUse', 'skip', 0, S.caps >= 2 && !!S.busy, '🟡 2') })}`;
}

donateHTML = function donate41() {
  const p = promoAt();
  const banner = p ? `<div class="dn-banner"><span>${p.emoji}</span><div><b>Акция: ${p.title}</b><small>${p.desc} · осталось <span data-until="${p.ends}"></span></small></div></div>` : '';
  const body = { caps: dnCapsTab, sets: dnSetsTab, cases: dnCasesTab, style: dnStyleTab, bottles:()=>bottleShopHTML(true), spend: dnSpendTab }[DN_TAB](p);
  return `<div id="donateBox" class="donate">
    <div class="dn-hero"><div class="dn-shine"></div>
      <small>ЗОЛОТЫЕ КРЫШКИ</small><div class="dn-balance"><span>🟡</span>${fmt(S.caps)}</div>
      <small class="dn-sub">Оплата — <b>⭐ Telegram Stars</b>, прямо в Telegram, без карт</small></div>
    ${banner}
    <div class="dn-tabs">${DN_TABS.map(([id, e, t]) => `<button class="${id === DN_TAB ? 'on' : ''}" data-act="dnTab" data-id="${id}"><span>${e}</span>${t}</button>`).join('')}</div>
    <div class="dn-body">${body}</div>
    <p class="dn-legal">Покупки поддерживают развитие игры 💛 Вопросы по оплате — команда /paysupport в боте</p>
    <div class="btns"><button class="btn wide" data-act="close">Закрыть</button></div></div>`
    .replace(/<i class="ic" data-ic="star"><\/i>(\d+)/g, (_, n) => starPrice(+n));
};

Object.assign(ACTIONS, {
  dnTab: (id) => { DN_TAB = id; sfx('chip'); donateRefresh(); const s = document.querySelector('.sheet'); if (s) s.scrollTop = 0; },
  dnStyle: (id) => { DN_STYLE = id; sfx('chip'); donateRefresh(); },
  cosmBuy: (id) => {
    const c = cosmById(id);
    if (!c || !c.caps || c.src || ownsCosm(id)) return;
    const price = cosmPrice(c);
    if (S.caps < price) { toast(`Нужно ${price} 🟡 — пополни крышки`, 'bad'); DN_TAB = 'caps'; donateRefresh(); return; }
    S.caps -= price; bump('resCaps');
    cosmGet(id);
    track('cosmBuy');
    sfx('ach'); haptic('success'); confetti(30);
    toast(`${c.face || c.emoji} ${cosmKindName(c)} «${c.name}» — надето!`, 'good');
    updateHud(); save(); donateRefresh();
  },
  cosmUse: (id) => {
    const c = cosmById(id);
    if (!c || !ownsCosm(id)) return;
    if (c.kind === 'fx') S.tapFx = S.tapFx === id ? '' : id;
    if (c.kind === 'aura') S.aura = S.aura === id ? '' : id;
    if (c.kind === 'frame') S.frame = S.frame === c.frame ? 'none' : c.frame;
    if (c.kind === 'avatar') S.avatar = S.avatar === cosmAva(c) ? '' : cosmAva(c);
    sfx('chip'); updateHud();
    donateRefresh();
  },
  capSell: (n) => {
    n = +n;
    if (!(n > 0) || S.caps < n) return;
    const sum = n * capRate();
    S.caps -= n; bump('resCaps');
    addMoney(sum);
    sfx('coin'); haptic('success');
    toast(`💱 ${n} 🟡 → +${fmt(sum)} ₽`, 'good');
    save(); donateRefresh();
  },
  dcOpen: (id) => {
    const r = dcOpen(id);
    if (!r) { toast('Не хватает крышек', 'bad'); return; }
    dcSpin(r);
  },
  dcAgain: (id) => { closeModal(); ACTIONS.dcOpen(id); },
  dcBack: () => { closeModal(); DN_TAB = 'cases'; openDonate(); },
});
// Старые пачки «крышки → рубли» тоже по единому курсу
CAP_CASH.forEach((x) => { x.k = 1; });

// Прокрутка ленты кейса: выигрыш уже начислен, лента только показывает его
function dcSpin({ c, win, text }) {
  const strip = Array.from({ length: 36 }, (_, i) => (i === 30 ? win : dcRoll(c)));
  const cell = (x) => `<div class="dc-it r-${x.r}"><span>${dcIcon(x)}</span><small>${dcLabel(x)}</small></div>`;
  openModal(`<div class="dc-spin"><h3>${c.emoji} ${c.name}</h3><div class="dc-win"><div class="dc-strip" id="dcStrip">${strip.map(cell).join('')}</div><div class="dc-mark"></div></div>
    <div id="dcRes" class="dc-res"></div></div>`, { center: true });
  sfx('chip');
  const done = () => {
    const box = $('dcRes');
    if (!box) return;
    const keys = (S.dkeys && S.dkeys[c.id]) || 0;
    box.innerHTML = `<div class="dc-got r-${win.r}"><span>${dcIcon(win)}</span><b>${RAR_NAME[win.r]}</b><p>${text}</p></div>
      <div class="btns" style="flex-direction:column;gap:8px">
        <button class="btn primary wide" data-act="dcAgain" data-id="${c.id}" ${keys || S.caps >= c.caps ? '' : 'disabled'}>${keys ? `🔑 Ещё (ключей: ${keys})` : `Ещё раз за 🟡 ${c.caps}`}</button>
        <button class="btn wide" data-act="dcBack">К кейсам</button></div>`;
    if (win.r === 'legend' || win.r === 'epic') { confetti(win.r === 'legend' ? 120 : 60); sfx('jackpot'); } else sfx('coin');
    haptic('success');
  };
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const s = $('dcStrip');
    if (!s || !s.children[0]) return done();
    const w = s.children[0].offsetWidth + 6, box = s.parentElement.offsetWidth;
    s.style.transform = `translateX(${-(30 * w - box / 2 + w / 2 + rand(-w * 0.35, w * 0.35))}px)`;
    setTimeout(done, 4200);
  }));
}

// Покупки: акция и бонусы — как раньше (promo.js), ключи кейсов и наборы — через PREM_GIVE
HOOKS.load.push(() => { if (!S.cosm) S.cosm = []; if (!S.dkeys) S.dkeys = {}; });
