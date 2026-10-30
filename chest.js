// Офлайн-сундук: пока игрока нет хотя бы 30 минут, Валера собирает сундук с находками.
// Деревянный (до 2 ч), серебряный (до 6 ч), золотой (6 ч+). Чем дольше отсутствие, тем богаче.
// Открывается мини-игрой «Взлом»: тапай по сундуку — чем быстрее, тем больше награда.

const CHEST_MIN = 30 * 60000;
const CHEST_TIERS = [
  { id: 'wood', name: 'Деревянный сундук', emoji: '📦', from: 0, items: 1, cap: 0 },
  { id: 'silver', name: 'Серебряный сундук', emoji: '🧳', from: 2, items: 2, cap: 0.05 },
  { id: 'gold', name: 'Золотой сундук', emoji: '🧰', from: 6, items: 3, cap: 0.25 },
];
const CHEST_TAPS = 12;

function chestTier(h) { return [...CHEST_TIERS].reverse().find((t) => h >= t.from); }

// Перед начислением «Пока тебя не было…» запоминаем, сколько игрока не было
applyOffline = (function (orig) {
  return function () {
    const away = Date.now() - (GAME_AWAY_AT || S.lastSeen || Date.now());
    if (away >= CHEST_MIN && S.storySeen) {
      const capH = typeof membershipHours75==='function'?membershipHours75():(isVip() ? OFFLINE_HOURS_VIP : OFFLINE_HOURS);
      const h = Math.min(capH, away / 3600000) + ((S.chest && S.chest.h) || 0);
      S.chest = { h: Math.min(capH, h), at: Date.now() };
      if(typeof returnNotice==='function')returnNotice({key:'chest:'+S.chest.at,kind:'gift',title:'Сундук с находками готов',body:'Открой сундук, когда будет удобно. Находки сохраняются до открытия.',action:'chest'});
    }
    orig();
  };
})(applyOffline);

// Значок сундука на главном экране
HOOKS.init.push(() => {
  const pin = document.createElement('div');
  pin.className = 'chest-pin hidden'; pin.id = 'chestPin'; pin.dataset.act = 'chestOpen';
  $('scene').appendChild(pin);
});
HOOKS.hud.push(() => {
  const pin = $('chestPin');
  if (!pin) return;
  const c = S.chest;
  if (!c) { pin.classList.add('hidden'); return; }
  const t = chestTier(c.h);
  const html = `<span>${t.emoji}</span><div><b>${t.name}</b><small>собран за ${c.h >= 1 ? `${Math.floor(c.h)} ч` : `${Math.round(c.h * 60)} мин`} — открой!</small></div>`;
  if (pin.dataset.html !== html) { pin.innerHTML = html; pin.dataset.html = html; }
  pin.classList.remove('hidden');
});

function chestLoot(c, k) {
  const t = chestTier(c.h);
  const loot = { money: Math.round(c.h * 2.5 * capRate() * k), bottles: Math.round(c.h * 60 * (1 + S.housing * 0.5) * k), items: [], caps: 0 };
  for (let i = 0; i < t.items; i++) loot.items.push(rollItem());
  if (Math.random() < t.cap * (k > 1 ? 1.5 : 1)) loot.caps = 1;
  return loot;
}

function chestGame(mg) {
  const t = chestTier(S.chest.h);
  $('mgArena').innerHTML = `<div class="chest-game"><div class="cg-locks" id="cgLocks">${'🔒'.repeat(3)}</div>
    <button class="cg-chest" id="cgChest">${t.emoji}</button><div class="progress cg-bar"><div id="cgBar"></div></div></div>`;
  const btn = $('cgChest');
  btn.onpointerdown = (e) => {
    e.preventDefault();
    if (!mgAlive(mg)) return;
    mgScore(1); haptic('light'); sfx(MG.score % 4 === 0 ? 'block' : 'tap');
    btn.animate([{ transform: 'rotate(0) scale(1)' }, { transform: `rotate(${MG.score % 2 ? 8 : -8}deg) scale(1.08)` }, { transform: 'rotate(0) scale(1)' }], { duration: 140 });
    $('cgBar').style.width = Math.min(100, (MG.score / CHEST_TAPS) * 100) + '%';
    $('cgLocks').textContent = '🔓'.repeat(Math.min(3, Math.floor(MG.score / 4))) + '🔒'.repeat(Math.max(0, 3 - Math.floor(MG.score / 4)));
    if (MG.score >= CHEST_TAPS) { MG.fast = Date.now() - MG.start < 3500; mgDelay(mg, mgEnd, 150); }
  };
}

ACTIONS.chestOpen = () => {
  const c = S.chest;
  if (!c || !popupTurn(2)) return;
  const t = chestTier(c.h);
  runGame({ title: `${t.emoji} Взлом сундука`, hint: `Тапай по сундуку, чтобы сбить ${CHEST_TAPS / 4 | 0} замка! Быстро — бонус ×1.5`, duration: 6, setup: chestGame,
    finish: (score, mg) => {
      const k = score >= CHEST_TAPS ? (mg.fast ? 1.5 : 1.2) : score >= CHEST_TAPS / 2 ? 1 : 0.8;
      const loot = chestLoot(c, k);
      S.chest = null;
      addMoney(loot.money); addBottles(loot.bottles); loot.items.forEach((id) => addItem(id));
      if (loot.caps) addCaps(loot.caps);
      track('chestOpen');
      const lines = [`💰 ${fmt(loot.money)} ₽`, `🍾 ${fmt(loot.bottles)} бутылок`, ...loot.items.map((id) => `${ITEMS[id].emoji} ${ITEMS[id].name}`), loot.caps ? '🟡 Золотая крышка!' : ''].filter(Boolean);
      confetti(k > 1 ? 70 : 40); sfx('loot');
      resultModal({ emoji: t.emoji, title: k >= 1.5 ? 'Мастер-взломщик! ×1.5' : k > 1 ? 'Взломан! ×1.2' : k < 1 ? 'Еле открыл… ×0.8' : 'Сундук открыт!',
        text: `<div class="chest-loot">${lines.map((l, i) => `<div style="animation-delay:${i * 0.12}s">${l}</div>`).join('')}</div><small>Хлам продавай Шнырю на рынке</small>`, btn: 'Забрать' });
      save();
    } });
};
