// Фарма в спортзале: быстрее качаться, но с последствиями.
// Креатин — мягко и почти безопасно. Анаболики «Метан» — прирост ×2, но копится «нагрузка на печень»:
// каждая тренировка на них — шанс уехать в больницу с «Отказом печени», который лечится только курсом
// у гепатолога (3 капельницы с перерывами).

const LIVER_COURSE = 3;
const LIVER_GAP = 3 * 60000; // между капельницами

Object.assign(EFFECTS, {
  creatine: { name: 'Креатин', emoji: '🧪', kind: 'good', desc: 'Прирост формы и силы +30%', mods: { gain: 1.3 } },
  roids: { name: 'Анаболики', emoji: '💉', kind: 'good', desc: 'Прирост формы и силы ×2, тап +10%. Но злой: радость −0.5/мин, и печень страдает', mods: { gain: 2, tap: 1.1, mpm: -0.5 } },
  liver: { name: 'Отказ печени', emoji: '🫁', kind: 'disease', desc: 'Здоровье −1.5/мин, прирост в зале −70%, энергия медленнее. Лечится только курсом у гепатолога', mods: { hpm: -1.5, gain: 0.3, regen: 0.8, mpm: -1 } },
});
EFFECT_FIX.liver = ['life', 'health', '#lifeList .liver-card, #lifeList .card:not(.locked)', 'Курс лечения у гепатолога'];
EFFECT_FIX.roids = ['life', 'gym', '#lifeList .pharma', 'Анаболики действуют в зале'];
cureHint = (function (orig) { return (id) => (id === 'liver' ? 'курс у гепатолога' : orig(id)); })(cureHint);

function pharmaPrice(k) { return Math.round(k * (1 + S.housing * 0.6) / 10) * 10; }
const PHARMA = [
  { id: 'creatine', emoji: '🧪', name: 'Креатин', price: () => pharmaPrice(250), min: 20, desc: '+30% к приросту на 20 минут. Безопасно', liver: 0 },
  { id: 'roids', emoji: '💉', name: 'Анаболики «Метан»', price: () => pharmaPrice(900), min: 30, desc: 'Прирост ×2 на 30 минут. Каждая тренировка — риск больницы', liver: 30 },
];
// Нагрузка на печень спадает сама: −1 в 2 минуты
HOOKS.tick.push(() => {
  if (!S.liverLoad) return;
  const now = Date.now();
  if (!S.liverAt) S.liverAt = now;
  const k = (now - S.liverAt) / 120000;
  if (k >= 1) { S.liverLoad = Math.max(0, S.liverLoad - Math.floor(k)); S.liverAt = now; }
});
function liverRisk() { return Math.min(0.6, 0.04 + (S.liverLoad || 0) / 350); }

function pharmaHTML() {
  if (hasEffect('liver')) return '<div class="info-card warn pharma">💉 Фарма недоступна: врач запретил, пока не пройдёшь курс лечения печени (Жизнь → Врачи).</div>';
  const load = Math.round(S.liverLoad || 0);
  return `<div class="subhead">💉 Фарма · на свой страх и риск</div>
    <div class="info-card pharma">Нагрузка на печень: <b style="color:${load > 60 ? 'var(--red)' : load > 25 ? 'var(--gold)' : 'var(--green)'}">${load}</b>${hasEffect('roids') ? ` · шанс больницы за тренировку: <b>${Math.round(liverRisk() * 100)}%</b>` : ''}<br><small>Печень восстанавливается сама, но медленно. Чем выше нагрузка — тем опаснее.</small></div>
    ${PHARMA.map((x) => card({ thumb: x.emoji, title: x.name, desc: x.desc + (hasEffect(x.id) ? ' · <b>действует</b>' : ''),
      btn: priceBtn('pharmaBuy', x.id, x.price(), S.money >= x.price(), `${fmt(x.price())} ₽`) })).join('')}`;
}
const _gymTabPharma = EXTRA_TABS.life.gym;
EXTRA_TABS.life.gym = () => _gymTabPharma() + pharmaHTML();

ACTIONS.pharmaBuy = (id) => {
  const x = PHARMA.find((p) => p.id === id);
  if (!x || hasEffect('liver') || S.money < x.price()) return;
  S.money -= x.price();
  addEffect(x.id, x.min);
  S.liverLoad = (S.liverLoad || 0) + x.liver;
  track('pharma');
  sfx('buy');
  toast(`${x.emoji} ${x.name}: действует ${x.min} мин`, x.liver ? '' : 'good');
  // Перебор — прямо сразу
  if (S.liverLoad >= 120) liverCrash('Слишком много за раз — печень не выдержала');
};

function liverCrash(reason) {
  S.effects = S.effects.filter((e) => e.id !== 'roids' && e.id !== 'creatine');
  addEffect('liver', 0);
  S.liverCourse = { visits: 0, next: 0 };
  S.health = Math.min(S.health, 15);
  track('hospital'); track('liverCrash');
  setTimeout(() => {
    resultModal({ emoji: '🚑', rays: 'bad', title: 'Скорая увезла в больницу!', text: `${reason}. Диагноз — <b>отказ печени</b>.<br>Здоровье упало, прирост в зале почти нулевой, радость падает.<br><br>Лечится курсом у гепатолога: ${LIVER_COURSE} капельницы (Жизнь → Врачи).`, btn: 'К врачу' });
    sfx('bad'); haptic('error');
  }, 400);
}

// После каждой тренировки на анаболиках — проверка печени
finishWorkout = (function (orig) {
  return function (ex, g, score) {
    orig(ex, g, score);
    if (!hasEffect('roids')) return;
    S.liverLoad = (S.liverLoad || 0) + 8;
    if (Math.random() < liverRisk()) { closeModal(); liverCrash('Прямо в зале прихватило бок'); }
  };
})(finishWorkout);

// ---------- Курс лечения у гепатолога ----------
function liverPrice() { return pharmaPrice(1500); }
const _stiCardsLiver = stiCardsHTML;
stiCardsHTML = () => {
  const html = _stiCardsLiver();
  if (!hasEffect('liver')) return html;
  const c = S.liverCourse || { visits: 0, next: 0 };
  const wait = Math.max(0, c.next - Date.now());
  const steps = Array.from({ length: LIVER_COURSE }, (_, i) => `<i class="${i < c.visits ? 'on' : ''}">💧</i>`).join('');
  return `<div class="subhead">🫁 Больница · гепатология</div>` + card({ cls: 'liver-card', thumb: '🏥', title: `Курс лечения печени ${c.visits}/${LIVER_COURSE}`,
    desc: `Капельницы раз в 3 минуты. После ${LIVER_COURSE}-й — здоров.<div class="liver-steps">${steps}</div>`,
    btn: wait ? `<button class="btn" disabled>⏳ <span data-until="${c.next}"></span></button>` : priceBtn('liverVisit', '', liverPrice(), S.money >= liverPrice() && !S.busy, `💧 ${fmt(liverPrice())} ₽`) }) + html;
};
ACTIONS.liverVisit = () => {
  const c = S.liverCourse || (S.liverCourse = { visits: 0, next: 0 });
  if (!hasEffect('liver') || Date.now() < c.next || S.money < liverPrice()) return;
  S.money -= liverPrice();
  c.visits++;
  c.next = Date.now() + LIVER_GAP;
  heal(15);
  sfx('good');
  if (c.visits >= LIVER_COURSE) {
    S.effects = S.effects.filter((e) => e.id !== 'liver');
    S.liverLoad = 0; S.liverCourse = null;
    track('cured');
    resultModal({ emoji: '🏥', title: 'Печень спасена!', text: 'Гепатолог: «Ещё раз увижу с «Метаном» — выпишу в морг». Курс пройден, ты здоров.', btn: 'Больше не буду' });
  } else toast(`💧 Капельница ${c.visits}/${LIVER_COURSE}. Следующая через 3 минуты`, 'good');
};
