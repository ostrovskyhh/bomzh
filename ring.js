// «Подпольный ринг» 3.0 — глава тёмной дорожки без рейтинга драк. Вместо «наберись рейтинга 1500 и
// выиграй 30 драк» — турнир-«лестница» из трёх бойцов ринга. Перед каждым боем выбираешь тактику
// (она ослабляет соперника по-своему) и ставишь на себя — победа приносит выигрыш по коэффициенту.

const RING_FIGHTERS = [
  { name: 'Костолом Гена', emoji: '🦴', style: 'brawler', eq: { hat: 'none', body: 'telnyashka', shoes: 'kedy' }, lvl: 0, form: 30, strength: 40, tier: 2, odds: 1.6, intro: '«Новенький? Сейчас посмотрим, из чего ты сделан»' },
  { name: 'Мясник с бойни', emoji: '🔪', style: 'tank', eq: { hat: 'kepka', body: 'pukhovik', shoes: 'boots' }, lvl: 1, form: 40, strength: 52, tier: 3, odds: 2.0, intro: '«Я разделываю таких, как ты, по утрам»' },
  { name: 'Чемпион ринга «Молот»', emoji: '🔨', style: 'tactic', eq: { hat: 'boxhelm', body: 'malinovy', shoes: 'boots' }, lvl: 2, form: 55, strength: 62, tier: 4, odds: 2.6, intro: '«Пояс чемпиона не отдают. Его забирают»' },
];
const RING_TACTICS = [
  { id: 'agr', emoji: '🔥', name: 'Натиск', desc: 'Давишь с первой секунды: соперник быстрее выдыхается (форма −15%)', mod: { form: 0.85 }, bonus: 1.15 },
  { id: 'def', emoji: '🛡️', name: 'Глухая защита', desc: 'Держишь удар: соперник бьёт слабее (сила −15%)', mod: { strength: 0.85 }, bonus: 1.0 },
  { id: 'trick', emoji: '🦊', name: 'Хитрость', desc: 'Песок в глаза и грязные приёмы: всё у соперника −8%, но зрители ставят меньше', mod: { form: 0.92, strength: 0.92 }, bonus: 0.85 },
];
const RING_BETS = [0, 0.1, 0.25, 0.5];
const RING_CD = 180;

// Глава в сюжете: другие цели и своя кнопка
const RING_Q = QUESTS.find((q) => q.id === 'd_ring');
if (RING_Q) Object.assign(RING_Q, {
  title: 'Подпольный ринг', ring: true,
  text: 'На моём ринге нет рейтингов и судей. Три бойца — три боя. Выбирай тактику, ставь на себя, если веришь. Пройдёшь всех — пояс твой.',
  goals: [qv(() => Math.min(3, (S.ring && S.ring.wins) || 0), 3, 'Победи трёх бойцов ринга')],
});

function ringNext() { return RING_FIGHTERS[Math.min(RING_FIGHTERS.length - 1, (S.ring && S.ring.wins) || 0)]; }
const _storyTabRing = EXTRA_TABS.tasks.story;
EXTRA_TABS.tasks.story = () => {
  let html = _storyTabRing();
  const q = currentQuest();
  if (!q || !q.ring || goalsDone(q)) return html;
  const f = ringNext(), cd = cdLeft('ring');
  const btn = `<button class="btn primary wide ring-go" data-act="ringPrep" ${cd > 0 ? 'disabled' : ''} ${cd > 0 ? 'data-why="Приди в себя после прошлого боя"' : ''}>${f.emoji} На ринг: ${f.name}${cd > 0 ? ` (<span data-until="${S.cd.ring}"></span>)` : ''}</button>`;
  return html.replace(/(<div class="q-reward">)/, `<div class="ring-ladder">${RING_FIGHTERS.map((x, i) => `<span class="${i < ((S.ring && S.ring.wins) || 0) ? 'done' : x === f ? 'cur' : ''}">${x.emoji}<small>${x.name.split(' ')[0]}</small></span>`).join('<i>›</i>')}</div>$1`)
    .replace(/<button class="btn[^"]*" data-act="questDone"[^>]*>[^<]*<\/button>/, btn);
};

let RING_PICK = { tactic: 'agr', bet: 0 };
function ringPrep() {
  const f = ringNext();
  const t = RING_TACTICS.find((x) => x.id === RING_PICK.tactic);
  const odds = +(f.odds * t.bonus).toFixed(2);
  const stake = Math.floor(S.money * RING_PICK.bet);
  openModal(`<h3>${f.emoji} ${f.name}</h3><p>${f.intro}</p>
    <div class="subhead" style="text-align:left">Тактика</div>
    <div class="ring-opts">${RING_TACTICS.map((x) => `<button class="${x.id === RING_PICK.tactic ? 'on' : ''}" data-act="ringTactic" data-id="${x.id}"><b>${x.emoji} ${x.name}</b><small>${x.desc}</small></button>`).join('')}</div>
    <div class="subhead" style="text-align:left">Ставка на себя · коэффициент ${odds}</div>
    <div class="ring-bets">${RING_BETS.map((b) => `<button class="${b === RING_PICK.bet ? 'on' : ''}" data-act="ringBet" data-id="${b}">${b ? `${b * 100}% денег<small>${fmt(Math.floor(S.money * b))} ₽</small>` : 'Без ставки'}</button>`).join('')}</div>
    ${stake ? `<div class="info-card">Победишь — получишь <b style="color:var(--gold)">${fmt(Math.floor(stake * odds))} ₽</b>. Проиграешь — ставка уйдёт букмекеру.</div>` : ''}
    <div class="btns"><button class="btn primary wide" data-act="ringFight">🥊 В бой</button><button class="btn wide" data-act="close">Не сейчас</button></div>`, { center: true });
}

function ringFight() {
  const why = typeof fightCan === 'function' ? fightCan() : '';
  if (why) { toast(why, 'bad'); return; }
  if (cdLeft('ring') > 0) return;
  const f = ringNext(), t = RING_TACTICS.find((x) => x.id === RING_PICK.tactic);
  const stake = Math.floor(S.money * RING_PICK.bet), odds = f.odds * t.bonus;
  S.money -= stake;
  closeModal();
  const op = { ...f, level: level() + f.lvl, form: f.form * (t.mod.form || 1), strength: f.strength * (t.mod.strength || 1) };
  op.rating = 1500 + op.level * 20;
  S.energy -= FIGHT_COST.energy; feed(-FIGHT_COST.food);
  startFight(op, { intro: `${t.emoji} ${t.name}${stake ? ` · ставка ${fmt(stake)} ₽` : ''}. ${f.intro}`, onEnd: (won) => {
    if (!S.ring) S.ring = { wins: 0 };
    if (won) {
      S.ring.wins++;
      track('ringWin'); track('fightWin');
      const win = stake ? Math.floor(stake * odds) : 0;
      const purse = Math.round((3000 + level() * 300) * (1 + f.lvl * 0.5));
      addMoney(win + purse); addXp(60 + f.lvl * 40); addMood(12);
      confetti(70); sfx('win');
      resultModal({ emoji: f.emoji, title: S.ring.wins >= RING_FIGHTERS.length ? 'Пояс чемпиона твой!' : `${f.name} повержен!`,
        text: `Гонорар бойца: <b>${fmt(purse)} ₽</b>${win ? `<br>Ставка на себя сыграла: <b style="color:var(--gold)">+${fmt(win)} ₽</b>` : ''}<br>${S.ring.wins >= RING_FIGHTERS.length ? 'Хозяин ринга ждёт в сюжете — забери награду главы.' : `Следующий: ${ringNext().emoji} ${ringNext().name}`}`, btn: 'Дальше' });
    } else {
      setCd('ring', RING_CD); addMood(-6); sfx('lose');
      resultModal({ emoji: '🤕', rays: 'bad', title: 'Ринг не прощает', text: `${f.name} оказался сильнее.${stake ? `<br>Ставка ${fmt(stake)} ₽ ушла букмекеру.` : ''}<br>Отлежись 3 минуты, подкачайся и выбери другую тактику.`, btn: 'Я вернусь' });
    }
    save();
  } });
}

Object.assign(ACTIONS, {
  ringPrep: () => ringPrep(),
  ringTactic: (id) => { RING_PICK.tactic = id; ringPrep(); },
  ringBet: (b) => { RING_PICK.bet = +b; ringPrep(); },
  ringFight: () => ringFight(),
});
