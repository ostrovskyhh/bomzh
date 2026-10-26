// Радость 2.8: понятные ступени и зачем её поднимать.
// Радость тратится на дела (смена, тренировка, криминал) и тает сама; чем она выше, тем больше опыта,
// денег и крит-шанс. Довёл до 100 — «Окрылён» на 20 минут и раз в сутки сундучок счастья.

const JOY_TIERS = [
  { min: 0, emoji: '😩', name: 'Депрессия', cls: 'bad', perks: 'Тапы и работа −30%, здоровье тает, учиться нельзя' },
  { min: 20, emoji: '😐', name: 'Хмуро', cls: 'meh', perks: 'Без бонусов. Свидания идут хуже' },
  { min: 50, emoji: '🙂', name: 'Норм', cls: 'ok', perks: 'Опыт +5%' },
  { min: 80, emoji: '😄', name: 'Кураж', cls: 'good', perks: 'Доход +15%, опыт +10%, крит +3%' },
  { min: 100, emoji: '🤩', name: 'Счастье', cls: 'top', perks: 'Всё от куража + «Окрылён» на 20 минут: доход и опыт +20%. Раз в сутки — 🎁 сундучок счастья' },
];
// Сколько радости уходит на дела
const JOY_COST = { shift: 4, gymGame: 3, crime: 5, lesson: 0 };

EFFECTS.happy = { name: 'Окрылён', emoji: '🤩', kind: 'good', desc: 'Доход +20%, опыт +20% — радость на максимуме', mods: { tap: 1.2, pity: 1.2, work: 1.2 } };

function joyTier(v = S.mood) { let t = JOY_TIERS[0]; for (const x of JOY_TIERS) if (v >= x.min) t = x; return t; }

xpMult = (function (orig) {
  return () => orig() * (S.mood >= 80 ? 1.1 : S.mood >= 50 ? 1.05 : 1) * (hasEffect('happy') ? 1.2 : 1);
})(xpMult);
HOOKS.mods.push((m) => { if (S.mood >= 80) m.crit += 0.03; });

HOOKS.track.push((key) => {
  const c = JOY_COST[key];
  if (c) { addMood(-c); S.joySpent = (S.joySpent || 0) + c; }
});

// 100 радости — «Окрылён» и сундучок раз в сутки
HOOKS.tick.push(() => {
  if (!LOADED || !S.storySeen) return;
  if (S.mood < 99.5) { S.joyTop = false; return; }
  if (S.joyTop) return;
  S.joyTop = true;
  addEffect('happy', 20);
  S.joyPeaks = (S.joyPeaks || 0) + 1;
  const day = new Date().toDateString();
  if (S.joyChestDay !== day) {
    S.joyChestDay = day;
    const m = Math.round(300 * scale());
    addCaps(2); addMoney(m); addXp(20);
    toast(`🤩 Радость на максимуме! «Окрылён» на 20 минут + сундучок счастья: 🟡 2, ${fmt(m)} ₽, 20 опыта`, 'good');
    confetti(40); sfx('levelup');
  } else toast('🤩 Радость на максимуме — ты «Окрылён» на 20 минут!', 'good');
});

function joyCardHTML() {
  const t = joyTier();
  const next = JOY_TIERS.find((x) => x.min > S.mood);
  return `<div class="joy-card"><div class="joy-head"><span class="joy-e">${t.emoji}</span><div><b>Радость ${Math.floor(S.mood)}/${maxMood()} · ${t.name}</b>
      <small>${t.perks}</small></div></div>
    <div class="joy-scale">${JOY_TIERS.map((x) => `<div class="${x === t ? 'on' : ''} ${x.cls}" title="${x.name}"><span>${x.emoji}</span><small>${x.min}</small></div>`).join('')}</div>
    ${next ? `<small class="joy-next">До «${next.name}» ещё ${Math.ceil(next.min - S.mood)} — ${next.perks[0].toLowerCase() + next.perks.slice(1)}</small>` : ''}
    <details class="joy-more"><summary>Как работает радость</summary>
      <ul><li>😊 <b>Растёт:</b> досуг ниже, вкусная еда, девушка/жена, питомец, дети, удачи в казино, победы</li>
        <li>📉 <b>Тратится:</b> смена −${JOY_COST.shift}, тренировка −${JOY_COST.gymGame}, криминал −${JOY_COST.crime}, учёба, неудачи и сама понемногу тает</li>
        <li>🏠 Чем лучше жильё, тем медленнее грусть</li>
        <li>🤩 Довёл до 100 — «Окрылён» на 20 минут, раз в сутки сундучок счастья</li></ul></details></div>`;
}
// Вкладка «Досуг → Отдых»: вместо одной строчки — шкала ступеней
const _renderFunJoy = renderFun;
renderFun = function () {
  const html = _renderFunJoy();
  if (TABS.fun !== 'rest') return html;
  return html.replace(/<div class="info-card">Радость: <b>[\s\S]*?<\/div>/, joyCardHTML());
};

ACHS.push({ id: 'joy_top', name: 'Счастливчик', emoji: '🤩', fn: () => S.joyPeaks || 0, goals: [1, 10, 50, 200], unit: 'раз довёл радость до 100' });
