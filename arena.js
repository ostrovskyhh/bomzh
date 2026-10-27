// Арена: сложные боты (за победу — половина рейтинга и награды, за поражение ничего не теряешь)
// и еженедельный турнир по вторникам (взнос 1000 ₽ в общий банк, рейтинг за победу ×2, банк забирает победитель).

// =====================================================================
// Сложные боты
// =====================================================================

const HARD_CD = 3 * 60;
const HARD_BOTS = [
  { id: 'gena', name: 'Бывший боксёр Гена', style: 'tactic', boost: 1.25, eq: { hat: 'kepka', body: 'telnyashka', shoes: 'kedy' }, emoji: '🥊' },
  { id: 'champ', name: 'Чемпион подвала', style: 'brawler', boost: 1.4, eq: { hat: 'ushanka', body: 'pukhovik', shoes: 'boots' }, emoji: '🏆' },
  { id: 'term', name: 'Терминатор с рынка', style: 'brawler', boost: 1.6, eq: { hat: 'cilinder', body: 'malinovy', shoes: 'boots' }, emoji: '🤖' },
];

// Сила сложных ботов постоянная (3.2): подкачаешься в зале — перерастёшь их
const HARD_STATS = { gena: { level: 15, form: 45, strength: 45, tier: 3 }, champ: { level: 25, form: 65, strength: 65, tier: 4 }, term: { level: 40, form: 90, strength: 90, tier: 6 } };
function hardRival(b) {
  const s = HARD_STATS[b.id] || HARD_STATS.gena;
  return { id: b.id, name: b.name, style: b.style, eq: b.eq, ...s, rating: fightState().rating + 200 };
}

function fightCan() {
  if (S.busy) return 'Валера сейчас занят';
  if (S.health < 30) return 'Сначала подлечись — здоровье ниже 30';
  if (S.energy < FIGHT_COST.energy) return `Нужно ${FIGHT_COST.energy} ⚡ энергии`;
  if (S.food < FIGHT_COST.food) return `Нужно ${FIGHT_COST.food} 🍞 сытости`;
  return '';
}

ACTIONS.hardFight = (id) => {
  const b = HARD_BOTS.find((x) => x.id === id);
  const why = fightCan() || (cdLeft('hardbot') > 0 ? 'Сложные боты ещё не готовы' : '');
  if (why) { toast(why, 'bad'); return; }
  S.energy -= FIGHT_COST.energy;
  feed(-FIGHT_COST.food);
  const op = hardRival(b);
  setCd('hardbot', HARD_CD);
  startFight(op, { intro: `${b.emoji} ${b.name} разминает кулаки…`, onEnd: (won) => {
    const st = fightState();
    if (won) {
      const dr = Math.max(1, Math.round(eloDelta(op, true) * 0.5));
      const m = Math.round(fightReward(op) * 0.5);
      st.rating += dr; st.wins++;
      addMoney(m); addXp(15 + op.level); addMood(12);
      track('fightWin'); track('hardWin');
      confetti(60); sfx('win');
      resultModal({ emoji: '🏆', title: `${b.name} повержен!`, text: `Сложный бот — награда наполовину: +${fmt(m)} ₽, рейтинг +${dr}`, btn: 'Ещё!' });
    } else {
      addMood(-5);
      sfx('lose');
      resultModal({ emoji: b.emoji, rays: 'bad', title: 'Не в этот раз', text: 'Со сложными ботами поражение ничего не стоит: рейтинг и деньги на месте. Подкачайся и возвращайся!', btn: 'Ок' });
    }
    track('fight');
    save();
  } });
};

// =====================================================================
// Турнир по вторникам
// =====================================================================

let TOUR = { data: null, at: 0, loading: false };

HOOKS.init.push(() => setTimeout(() => tourLoad(true), 5000));

// Плашка турнира на главном экране: во вторник — обратный отсчёт до конца, за 6 часов до начала — «скоро турнир»
HOOKS.hud.push(() => {
  let pin = $('tourPin');
  if (!pin) {
    const anchor = $('invPin');
    if (!anchor) return;
    anchor.insertAdjacentHTML('beforebegin', '<div class="inv-pin tour-pin hidden" id="tourPin" data-act="tourOpen"></div>');
    pin = $('tourPin');
  }
  const t = TOUR.data;
  const show = onlineOn() && t && level() >= FIGHT_LEVEL && (t.phase === 'open' || (t.opensIn && t.opensIn < 6 * 3600)) && !(t.me && t.me.fights >= t.fights);
  if (!show) { pin.classList.add('hidden'); return; }
  const left = t.phase === 'open' ? t.endsIn - (Date.now() - TOUR.at) / 1000 : t.opensIn - (Date.now() - TOUR.at) / 1000;
  const html = t.phase === 'open'
    ? `<span>🏆</span><div><b>Турнир · банк ${fmt(Math.max(t.pool, t.sponsor || 0))} ₽</b><small>${t.me ? `Твоих боёв ${t.me.fights}/${t.fights} · ` : ''}до конца ${fmtTime(Math.max(0, left))}</small></div>`
    : `<span>🏆</span><div><b>Скоро турнир района</b><small>через ${fmtTime(Math.max(0, left))}</small></div>`;
  if (pin.dataset.html !== html) { pin.innerHTML = html; pin.dataset.html = html; }
  pin.classList.remove('hidden');
  // Плашки идут столбиком под сюжетом
  const above = ['questPin'].filter((id) => $(id) && !$(id).classList.contains('hidden')).length;
  pin.style.top = 58 + above * 42 + 'px';
});
ACTIONS.tourOpen = () => showScreen('fun', 'fights');
setInterval(() => { if (typeof S !== 'undefined' && S.storySeen) tourLoad(); }, 5 * 60000);

// Блок турнира и сложных ботов — во вкладке «Драки», под онлайн-боем
const _fightsTabArena = EXTRA_TABS.fun.fights;
EXTRA_TABS.fun.fights = () => {
  const base = _fightsTabArena();
  if (level() < FIGHT_LEVEL) return base;
  const cd = cdLeft('hardbot');
  const hard = `<div class="subhead">💀 Сложные боты · сильнее тебя</div>
    <div class="info-card">Победа — половина обычной награды и рейтинга. Поражение ничего не отнимает (кроме здоровья). Один бой раз в 3 минуты.${cd > 0 ? `<br>⏳ Через <span data-until="${S.cd.hardbot}"></span>` : ''}</div>
    ${HARD_BOTS.map((b) => { const op = hardRival(b); const ch = winChance(op); return card({ thumb: b.emoji, title: b.name,
      desc: `ур. ${op.level} · ${STYLES[b.style].emoji} ${STYLES[b.style].name}<br>Шанс: <b style="color:${ch >= 0.5 ? 'var(--green)' : 'var(--red)'}">${Math.round(ch * 100)}%</b> · награда ${fmt(Math.round(fightReward(op) * 0.5))} ₽`,
      btn: `<button class="btn ${cd > 0 ? '' : 'primary'}" data-act="hardFight" data-id="${b.id}" ${cd > 0 || S.busy ? `disabled data-why="${cd > 0 ? 'Сложные боты ещё не готовы' : 'Валера занят'}"` : ''}>Драться</button>` }); }).join('')}`;
  const tour = tourHTML();
  const i = base.indexOf('<div class="subhead">Соперники');
  return (i > 0 ? base.slice(0, i) + tour + base.slice(i) : base + tour) + hard;
};
