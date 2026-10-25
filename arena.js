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

function hardRival(b) {
  const me = myFighter();
  return { id: b.id, name: b.name, style: b.style, eq: b.eq, level: me.level + Math.round((b.boost - 1) * 10),
    form: Math.min(100, me.form * b.boost + 10), strength: Math.min(100, me.strength * b.boost + 10), tier: Math.min(6, me.tier + 2), rating: fightState().rating + 200 };
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

async function tourLoad(force) {
  if (!onlineOn() || TOUR.loading || (!force && Date.now() - TOUR.at < 20000)) return;
  TOUR.loading = true;
  try { TOUR.data = await apiPost('tour/state'); TOUR.error = ''; } catch (e) { TOUR.error = 'Сервер турнира недоступен'; }
  TOUR.loading = false;
  TOUR.at = Date.now();
  if (currentScreen === 'fun' && TABS.fun === 'fights') renderCurrent(false);
}
HOOKS.init.push(() => setTimeout(() => tourLoad(true), 5000));

function tourHTML() {
  if (!onlineOn()) return '';
  setTimeout(() => tourLoad(), 0);
  const t = TOUR.data;
  const head = '<b>🏆 Турнир района · каждый вторник до 20:00 (МСК)</b>';
  if (!t) return `<div class="tour-box">${head}<small>${TOUR.error || 'Загружаем…'}</small></div>`;
  const prize = t.prize ? `<button class="btn primary wide" data-act="tourClaim">🏆 Забрать выигрыш · ${fmt(t.prize)} ₽</button>` : '';
  if (t.phase !== 'open') {
    return `<div class="tour-box">${head}<small>Взнос ${fmt(t.fee)} ₽ — всё идёт в общий банк. ${t.fights} турнирных боёв, за победу 3 очка и рейтинг ×2. Кто набрал больше всех очков к 20:00 — забирает весь банк.</small>
      <small>⏳ Следующий турнир через <b>${fmtTime(t.opensIn)}</b>${t.last ? ` · прошлый выиграл <b>${esc(t.last.name)}</b> (${fmt(t.last.pool)} ₽)` : ''}</small>${prize}</div>`;
  }
  const me = t.me;
  const table = t.table.length ? `<div class="tour-table">${t.table.map((r, i) => `<div class="${r.me ? 'me' : ''}"><span>${i + 1}. ${esc(r.name)}</span><b>${r.points} очк.</b><i>${r.fights}/${t.fights}</i></div>`).join('')}</div>` : '';
  return `<div class="tour-box open">${head}
    <small>Банк: <b>${fmt(t.pool)} ₽</b> · участников ${t.count} · до конца <b>${fmtTime(t.endsIn)}</b></small>
    ${me ? `<small>Твои очки: <b>${me.points}</b> · боёв ${me.fights}/${t.fights}</small>
      ${me.fights < t.fights ? `<button class="btn primary wide" data-act="tourFight">🥊 Турнирный бой</button>` : '<small>Все бои проведены — ждём итогов в 20:00</small>'}`
    : priceBtn('tourJoin', '', t.fee, S.money >= t.fee, `Записаться · взнос ${fmt(t.fee)} ₽`).replace('class="btn', 'class="btn wide')}
    ${table}${prize}</div>`;
}

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

Object.assign(ACTIONS, {
  tourJoin: async () => {
    if (S.money < TOUR.data.fee) return;
    try {
      const f = myFighter();
      const r = await apiPost('tour/join', { fighter: { level: f.level, form: f.form, strength: f.strength, tier: f.tier, eq: S.eq } });
      if (r.error) { toast(r.error, 'bad'); return; }
      S.money -= TOUR.data.fee;
      TOUR.data = r;
      track('tourJoin');
      sfx('bell');
      toast('🏆 Ты в турнире! Проведи бои до 20:00', 'good');
      save();
      renderCurrent(false);
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  tourFight: async () => {
    const why = fightCan();
    if (why) { toast(why, 'bad'); return; }
    try {
      const r = await apiPost('tour/opponent');
      if (r.error) { toast(r.error, 'bad'); return; }
      const o = r.opponent;
      const op = { name: `${o.name} (турнир)`, style: pick(Object.keys(STYLES)), eq: o.eq && o.eq.body ? o.eq : { hat: 'none', body: 'base', shoes: 'base' },
        level: o.level || 5, form: o.form || 20, strength: o.strength || 20, tier: o.tier || 2, rating: fightState().rating };
      S.energy -= FIGHT_COST.energy;
      feed(-FIGHT_COST.food);
      startFight(op, { intro: '🏆 Турнирный бой! Победа — 3 очка и двойной рейтинг', onEnd: async (won) => {
        const st = fightState();
        let text;
        if (won) {
          const dr = Math.max(2, eloDelta(op, true) * 2);
          st.rating += dr; st.wins++;
          addXp(20); addMood(10);
          track('fightWin'); track('tourWin');
          text = `+3 очка турнира, рейтинг +${dr} (×2)`;
          confetti(50); sfx('win');
        } else {
          const dr = eloDelta(op, false);
          st.rating = Math.max(0, st.rating + dr);
          addMood(-6);
          text = `0 очков, рейтинг ${dr}`;
          sfx('lose');
        }
        track('fight');
        try { TOUR.data = await apiPost('tour/result', { won }); } catch (e) { /* запишем позже нельзя — бой засчитан локально */ }
        resultModal({ emoji: won ? '🏆' : '🤕', rays: won ? '' : 'bad', title: won ? 'Турнирная победа!' : 'Турнирное поражение', text, btn: 'Ок' });
        save();
      } });
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  tourClaim: async () => {
    try {
      const { amount } = await apiPost('tour/claim');
      if (amount > 0) { addMoney(amount); track('tourPrize'); confetti(120); sfx('jackpot'); resultModal({ emoji: '🏆', title: 'Ты чемпион района!', text: `Весь банк турнира твой: +${fmt(amount)} ₽`, btn: 'Ура!' }); save(); }
      tourLoad(true);
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
});
