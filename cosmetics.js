// Донат 2.3: «Набор новичка» (49 ⭐, только первые 3 дня) и косметика за звёзды:
// эффекты тапа, рамки и аватарки. Всё появляется в окне доната (плашка крышек наверху).

const STARTER_DAYS = 3;
const STARTER_STARS = 49;
const COSMETICS = [
  { id: 'fx_hearts', kind: 'fx', name: 'Сердечки', emoji: '💖', stars: 25, parts: ['💖', '💕', '❤️'] },
  { id: 'fx_stars', kind: 'fx', name: 'Звёзды', emoji: '⭐', stars: 25, parts: ['⭐', '✨', '🌟'] },
  { id: 'fx_money', kind: 'fx', name: 'Деньги', emoji: '💸', stars: 25, parts: ['💸', '💵', '🪙'] },
  { id: 'fx_fire', kind: 'fx', name: 'Огонь', emoji: '🔥', stars: 25, parts: ['🔥', '💥', '✨'] },
  { id: 'fr_neon', kind: 'frame', frame: 'neon', name: 'Рамка «Неон»', emoji: '🟣', stars: 39 },
  { id: 'fr_rainbow', kind: 'frame', frame: 'rainbow', name: 'Рамка «Радуга»', emoji: '🌈', stars: 49 },
  { id: 'av_unicorn', kind: 'avatar', face: '🦄', name: 'Единорог', stars: 15 },
  { id: 'av_dragon', kind: 'avatar', face: '🐉', name: 'Дракон', stars: 15 },
  { id: 'av_alien', kind: 'avatar', face: '👽', name: 'Пришелец', stars: 15 },
  { id: 'av_cool', kind: 'avatar', face: '😎', name: 'Крутой', stars: 15 },
];
// id аватарки без «_» — сервер пропускает в топ только буквы
function cosmAva(c) { return c.id.replace('_', ''); }
function ownsCosm(id) { return (S.cosm || []).includes(id); }
function giveCosm(id) { if (!S.cosm) S.cosm = []; if (!S.cosm.includes(id)) S.cosm.push(id); }

COSMETICS.forEach((c) => {
  PREM_GIVE[c.id] = () => {
    giveCosm(c.id);
    if (c.kind === 'fx') S.tapFx = c.id;
    if (c.kind === 'frame') S.frame = c.frame;
    if (c.kind === 'avatar') S.avatar = cosmAva(c);
    return `${c.face || c.emoji} ${c.kind === 'fx' ? `Эффект тапа «${c.name}»` : c.kind === 'avatar' ? `Аватарка «${c.name}»` : c.name} — уже надет!`;
  };
  if (c.kind === 'frame') FRAMES.push({ id: c.frame, name: c.name.replace('Рамка ', '').replace(/[«»]/g, ''), need: () => ownsCosm(c.id), how: `донат за ${c.stars} ⭐` });
  if (c.kind === 'avatar') AVATARS.push({ id: cosmAva(c), face: c.face, name: c.name, how: `донат за ${c.stars} ⭐`, need: () => ownsCosm(c.id) });
});

// Эффект тапа: пара значков вылетает из Валеры
HOOKS.init.push(() => {
  $('valera').addEventListener('pointerdown', (e) => {
    const c = S.tapFx && ownsCosm(S.tapFx) && COSMETICS.find((x) => x.id === S.tapFx);
    if (!c || S.busy) return;
    const layer = $('fx');
    const box = layer.getBoundingClientRect();
    for (let i = 0; i < 2; i++) {
      const p = document.createElement('div');
      p.className = 'tap-cosm';
      p.textContent = pick(c.parts);
      p.style.left = (e.clientX - box.left + rand(-20, 20)) + 'px';
      p.style.top = (e.clientY - box.top + rand(-10, 10)) + 'px';
      p.style.setProperty('--dx', rand(-60, 60) + 'px');
      layer.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }
  });
});

// ---------- Набор новичка ----------
HOOKS.load.push(() => { if (!S.startAt) S.startAt = Date.now(); });
function starterLeft() { return S.starterBought ? 0 : Math.max(0, (S.startAt || Date.now()) + STARTER_DAYS * 86400000 - Date.now()); }
function starterMoney() { return Math.round(30 * capRate() / 100) * 100; }
CLOTHES.hat.push({ id: 'starterhat', name: 'Кепка новичка', price: 0, tier: 2, tap: 3, energy: 15, mood: 0.2, season: true, ach: { name: 'набор новичка' } });
HATS.starterhat = `
  <path d="M50 54Q50 30 82 30Q110 32 110 52Z" fill="#3CCB5A"/><path d="M58 50Q92 42 124 52Q102 60 58 57Z" fill="#2A9A44"/>
  <circle cx="82" cy="38" r="5" fill="#F2C744"/>`;
PREM_GIVE.starter = () => {
  S.starterBought = true;
  addCaps(100);
  S.vipUntil = Math.max(Date.now(), S.vipUntil || 0) + 7 * 86400000;
  addMoney(starterMoney());
  if (!S.owned.hat.includes('starterhat')) S.owned.hat.push('starterhat');
  return `🎁 Набор новичка: 100 🟡, VIP на 7 дней, ${fmt(starterMoney())} ₽ и Кепка новичка`;
};
function starterHTML() {
  const left = starterLeft();
  if (!left) return '';
  return `<div class="starter-pack"><div class="sp-badge">−80%</div><div class="sp-e">🎁</div>
      <b>Набор новичка</b><small>Только первые ${STARTER_DAYS} дня · осталось ${typeof leftText === 'function' ? leftText(left) : `<span data-until="${Date.now() + left}"></span>`}</small>
      <div class="sp-items"><span>🟡 100 крышек</span><span>👑 VIP 7 дней</span><span>💰 ${fmt(starterMoney())} ₽</span><span>🧢 Кепка новичка</span></div>
      <button class="btn primary wide" data-act="prem" data-id="starter"><i class="ic" data-ic="star"></i>${STARTER_STARS} — забрать</button></div>`;
}
// Один раз предлагаем после обучения
HOOKS.tick.push(() => {
  if (S.starterOffered || !starterLeft() || !S.storySeen || !LOADED || (S.tut && !S.tut.done) || level() < 2 || modalOpen() || S.busy) return;
  S.starterOffered = true;
  openModal(`<div class="sp-pop">${starterHTML()}<div class="btns"><button class="btn wide" data-act="close">Позже</button></div></div>`, { center: true });
  fillIcons();
});

// ---------- Окно доната: набор новичка сверху, косметика перед обменом крышек ----------
function cosmHTML() {
  const groups = [['fx', '✨ Эффекты тапа', 'Летят из Валеры при каждом тапе'], ['frame', '🖼️ Рамки', 'Видны в топе и чате'], ['avatar', '😎 Аватарки', 'Вместо буквы имени']];
  return `<div class="subhead">Косметика за ⭐</div>` + groups.map(([kind, title, hint]) => `<div class="cosm-title">${title} <small>${hint}</small></div>
    <div class="cosm-grid">${COSMETICS.filter((c) => c.kind === kind).map((c) => {
      const own = ownsCosm(c.id);
      const on = kind === 'fx' ? S.tapFx === c.id : kind === 'frame' ? S.frame === c.frame : S.avatar === cosmAva(c);
      const preview = kind === 'frame' ? `<div class="avatar frame-${c.frame}">${esc(playerName()[0])}</div>` : `<span>${c.face || c.emoji}</span>`;
      const btn = !own ? `<button class="btn primary small" data-act="prem" data-id="${c.id}"><i class="ic" data-ic="star"></i>${c.stars}</button>`
        : `<button class="btn small ${on ? '' : 'green'}" data-act="cosmUse" data-id="${c.id}">${on ? 'Надето' : 'Надеть'}</button>`;
      return `<div class="cosm ${own ? 'own' : ''} ${on ? 'on' : ''}">${preview}<b>${c.name.replace('Рамка ', '')}</b>${btn}</div>`;
    }).join('')}</div>`).join('');
}
donateHTML = (function (orig) {
  return () => orig()
    .replace('<div class="subhead">Купить крышки за ⭐</div>', `${starterHTML()}<div class="subhead">Купить крышки за ⭐</div>`)
    .replace('<div class="subhead">Крышки → рубли</div>', `${cosmHTML()}<div class="subhead">Крышки → рубли</div>`);
})(donateHTML);

ACTIONS.cosmUse = (id) => {
  const c = COSMETICS.find((x) => x.id === id);
  if (!c || !ownsCosm(id)) return;
  if (c.kind === 'fx') S.tapFx = S.tapFx === id ? '' : id;
  if (c.kind === 'frame') S.frame = S.frame === c.frame ? 'none' : c.frame;
  if (c.kind === 'avatar') S.avatar = S.avatar === cosmAva(c) ? '' : cosmAva(c);
  sfx('chip'); updateHud();
  donateRefresh();
};
