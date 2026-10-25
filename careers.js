// Карьера: новые работы (в том числе госслужба и чиновники), должности на каждой работе,
// аттестация на повышение, взятки и откаты.

// state — госслужба: платят даже за слабую смену. official — чиновник: предлагают откаты
JOBS.push(
  { id: 'dvornik', name: 'Дворник (ЖКХ)', emoji: '🧹', state: true, pay: 180, energy: 25, food: 12, mood: -4, req: { level: 2 } },
  { id: 'postman', name: 'Почтальон', emoji: '📮', state: true, pay: 600, energy: 30, food: 15, mood: -4, req: { level: 4, edu: 1, body: 1, shoes: 1, rank: ['dvornik', 1] } },
  { id: 'cook', name: 'Шаурмист', emoji: '🌯', pay: 800, energy: 30, food: 5, mood: -5, req: { level: 5, edu: 1, body: 1, rank: ['flyers', 1] } },
  { id: 'police', name: 'Полицейский (ППС)', emoji: '👮', state: true, pay: 2500, energy: 30, food: 15, mood: -6, physical: true, req: { level: 8, edu: 2, body: 1, shoes: 1, health: 60, rank: ['postman', 1] } },
  { id: 'teacher', name: 'Учитель', emoji: '👩‍🏫', state: true, pay: 3000, energy: 30, food: 15, mood: -8, req: { level: 9, edu: 3, body: 1, shoes: 1, rank: ['postman', 1] } },
  { id: 'clerk', name: 'Чиновник администрации', emoji: '🏛️', state: true, official: true, pay: 8000, energy: 25, food: 15, mood: -5, req: { level: 12, edu: 4, body: 2, shoes: 1, rank: ['teacher', 2] } },
  { id: 'deputy', name: 'Депутат', emoji: '🎖️', state: true, official: true, pay: 70000, energy: 25, food: 20, mood: -4, req: { level: 19, edu: 5, body: 3, shoes: 3, rank: ['clerk', 3] } },
);

// Мини-игра «Одобрить или отказать»: gen() возвращает { text, ok }
const DOC_FIELDS = ['печать', 'подпись', 'дата'];
const DOC_TYPES = ['Справка о доходах', 'Заявление на субсидию', 'Разрешение на ларёк', 'Прописка', 'Жалоба на соседей', 'Заявка на ремонт дороги'];
const DOC_JOKES = [['Заявление от Эдика: «Дайте денег просто так»', 0], ['Справка, что Шнырь — честный человек', 0], ['Прошение Михалыча о бесплатной лавке', 1], ['Заявка: «Покрасить бордюр в цвет надежды»', 1]];
const BILLS = [
  ['Бесплатные пирожки пенсионерам', 1], ['Налог на воздух', 0], ['Ремонт дорог во дворах', 1], ['Депутатам — зарплату ×10', 0],
  ['Пункты приёма бутылок в каждом дворе', 1], ['Запрет на смех по вторникам', 0], ['Новые лавочки в парках', 1], ['Штраф за грустное лицо', 0],
  ['Бесплатный Wi-Fi в метро', 1], ['Обязательный галстук для голубей', 0], ['Ночлежки для бездомных', 1], ['Налог на шаурму', 0],
];
function genDoc() {
  if (Math.random() < 0.2) { const [t, ok] = pick(DOC_JOKES); return { text: `📄 ${t}`, ok }; }
  const miss = Math.random() < 0.45 ? pick(DOC_FIELDS) : null;
  return { text: `📄 <b>${pick(DOC_TYPES)}</b><br>${DOC_FIELDS.map((f) => `${f === miss ? '❌' : '✅'} ${f}`).join(' · ')}`, ok: miss ? 0 : 1 };
}
function genHomework() {
  const x = Math.floor(rand(2, 13)), y = Math.floor(rand(2, 13)), ok = Math.random() < 0.5;
  const ans = ok ? x * y : x * y + pick([-10, -2, -1, 1, 2, 10]);
  return { text: `📓 Домашка Вовочки:<br><b>${x} × ${y} = ${ans}</b>`, ok: ok ? 1 : 0 };
}
function genBill() { const [t, ok] = pick(BILLS); return { text: `📜 Законопроект:<br><b>«${t}»</b>`, ok }; }

function gameVerdict(mg, cfg) {
  const arena = $('mgArena');
  const show = () => {
    if (!mgAlive(mg)) return;
    const it = cfg.gen();
    arena.innerHTML = `<div class="vd-card">${it.text}</div><div class="vd-btns">
      <button class="btn green" data-v="1">${cfg.yes}</button><button class="btn dark-path" data-v="0">${cfg.no}</button></div><p class="mg-hint">${cfg.rule}</p>`;
    arena.querySelectorAll('.vd-btns .btn').forEach((b) => {
      b.onpointerdown = (e) => {
        e.preventDefault();
        if (!mgAlive(mg) || b.dataset.done) return;
        arena.querySelectorAll('.vd-btns .btn').forEach((x) => { x.dataset.done = 1; });
        const right = +b.dataset.v === it.ok;
        if (right) { mgScore(1); sfx('chip'); } else { mgScore(-1); sfx('error'); haptic('error'); shakeArena(); }
        floatAt(b, right ? '✓' : '✗', right ? 'good' : 'bad');
        setTimeout(show, right ? 200 : 450);
      };
    });
  };
  show();
}

Object.assign(JOB_GAMES, {
  dvornik: { type: 'targets', title: 'Подмети двор', hint: 'Тапай по мусору 🍂. Кота и бабушку не мети!', good: ['🍂', '🍁', '🥤', '📰', '🚬'], bad: ['🐈', '👵'], goodRate: 0.75, every: 600, life: 1300, target: 26 },
  postman: { type: 'lanes', title: 'Разнеси почту', hint: 'Собирай письма ✉️, уворачивайся от собак и ям', good: ['✉️', '📦', '📰'], bad: ['🐕', '🕳️', '🚧'], player: '🚲', target: 18 },
  cook: { type: 'orders', title: 'Крути шаурму', hint: 'Собери шаурму по заказу. Лишний лук — злой клиент', items: ['🫓', '🥩', '🍗', '🧅', '🍅', '🥒', '🧀', '🌶️', '🥬'], size: [3, 4], target: 7 },
  police: { type: 'targets', title: 'Патруль', hint: 'Задерживай нарушителей 🦹. Мирных граждан не трогай!', good: ['🦹', '🥷', '🦹‍♀️', '🧟'], bad: ['🧑', '👵', '🧒', '👩'], goodRate: 0.45, every: 580, life: 1050, target: 16 },
  teacher: { type: 'verdict', title: 'Проверь домашку', hint: 'Верно решено — «Зачёт», ошибка — «Двойка»', gen: genHomework, yes: '✅ Зачёт', no: '2️⃣ Двойка', rule: 'Решено верно?', target: 16 },
  clerk: { type: 'verdict', title: 'Разбери бумаги', hint: 'Одобряй документы, только если есть печать, подпись и дата', gen: genDoc, yes: '✅ Одобрить', no: '⛔ Отказать', rule: 'Все три отметки на месте?', target: 16 },
  deputy: { type: 'verdict', title: 'Заседание', hint: 'Голосуй «За» полезные законы и «Против» бредовые', gen: genBill, yes: '👍 За', no: '👎 Против', rule: 'Закон полезный для людей?', target: 16 },
});

// Должности на каждой работе — пороги смен из RANKS, множитель оплаты из POS_MULT
const POS_MULT = [1, 1.2, 1.45, 1.75, 2.1];
const POSITIONS = {
  flyers: ['Раздатчик', 'Старший раздатчик', 'Промоутер', 'Супервайзер', 'Начальник промо'],
  loader: ['Подсобник', 'Грузчик', 'Бригадир смены', 'Бригадир', 'Начальник склада'],
  courier: ['Курьер-новичок', 'Курьер', 'Старший курьер', 'Логист', 'Начальник доставки'],
  guard: ['Стажёр охраны', 'Охранник', 'Старший смены', 'Начальник смены', 'Начальник охраны'],
  taxi: ['Новичок', 'Водитель', 'Водитель «Комфорт»', 'Водитель «Бизнес»', 'Личный водитель олигарха'],
  seller: ['Стажёр', 'Продавец', 'Старший продавец', 'Администратор', 'Директор магазина'],
  manager: ['Младший менеджер', 'Менеджер', 'Старший менеджер', 'Руководитель группы', 'Коммерческий директор'],
  director: ['И.о. директора', 'Директор филиала', 'Региональный директор', 'Вице-президент', 'Генеральный директор'],
  dvornik: ['Дворник-стажёр', 'Дворник', 'Старший дворник', 'Мастер участка', 'Начальник ЖЭКа'],
  postman: ['Почтальон-стажёр', 'Почтальон', 'Старший почтальон', 'Начальник отделения', 'Директор почтамта'],
  cook: ['Помощник', 'Шаурмист', 'Шеф-шаурмист', 'Управляющий точкой', 'Король шаурмы'],
  police: ['Стажёр', 'Сержант', 'Старшина', 'Лейтенант', 'Капитан'],
  teacher: ['Практикант', 'Учитель', 'Классный руководитель', 'Завуч', 'Директор школы'],
  clerk: ['Специалист', 'Ведущий специалист', 'Начальник отдела', 'Заместитель главы', 'Глава района'],
  deputy: ['Депутат горсовета', 'Депутат области', 'Председатель комитета', 'Депутат Госдумы', 'Спикер'],
};
const EXAM_PASS = 0.8; // нужный результат на аттестации
const EXAM_CD = 10 * 60; // после провала — пересдача через 10 минут
const BRIBE_RISK = 0.3;
const KICKBACK_CHANCE = 0.3, KICKBACK_RISK = 0.2;

function posName(id, r) { return (POSITIONS[id] || [])[r] || RANKS[r].name; }
jobRank = function (id) {
  if (!S.jobPos) S.jobPos = {};
  if (S.jobPos[id] === undefined) { let r = 0; RANKS.forEach((x, i) => { if (jobShifts(id) >= x.shifts) r = i; }); if (jobShifts(id)) S.jobPos[id] = r; return r; }
  return S.jobPos[id];
};
function canPromote(id) { const r = jobRank(id); return r < 4 && jobShifts(id) >= RANKS[r + 1].shifts; }
function bribePrice(j) { return Math.round(j.pay * POS_MULT[jobRank(j.id) + 1] * 4); }

function startShiftGame(j, onFinish, titleExtra = '') {
  const cfg = JOB_GAMES[j.id];
  const setup = (mg) => {
    if (cfg.type === 'targets') gameTargets(mg, cfg);
    if (cfg.type === 'timing') gameTiming(mg, cfg);
    if (cfg.type === 'lanes') gameLanes(mg, cfg);
    if (cfg.type === 'orders') gameOrders(mg, cfg);
    if (cfg.type === 'verdict') gameVerdict(mg, cfg);
  };
  runGame({ title: `${j.emoji} ${cfg.title}${titleExtra}`, hint: cfg.hint, duration: cfg.type === 'timing' ? 0 : 30, setup, finish: onFinish });
}
function shiftPerf(j, score, mg) {
  const cfg = JOB_GAMES[j.id];
  let perf = score / cfg.target;
  if (cfg.type === 'orders') perf -= (mg.mistakes || 0) * 0.05;
  return clamp(perf, j.state ? 0.5 : 0.2, 1.25);
}

startJobGame = function (j) { startShiftGame(j, (score, mg) => finishJob(j, score, mg)); };

let KICKBACK = null;

finishJob = function (j, score, mg) {
  const cfg = JOB_GAMES[j.id];
  const perf = shiftPerf(j, score, mg);
  const r = jobRank(j.id);
  const road = cfg.type === 'lanes' ? 1 + transportJobBonus() : 1;
  const pay = Math.round(j.pay * perf * mods().work * POS_MULT[r] * road * (j.physical ? 1 + S.strength / 200 : 1));
  addMoney(pay);
  addMood(j.mood);
  if (j.health) hurt(-j.health);
  S.jobs[j.id] = jobShifts(j.id) + 1;
  S.stats.shifts++;
  track('shift');
  if (j.state) track('stateShift');
  addXp(8 + Math.min(JOBS.indexOf(j), 9) * 6);
  const roadNote = cfg.type === 'lanes' ? useTransport() : '';
  const stars = perf >= 1 ? 3 : perf >= 0.6 ? 2 : 1;
  const next = RANKS[r + 1];
  const promoNote = canPromote(j.id) ? `<br><br>🎖️ <b>Можно на повышение: «${posName(j.id, r + 1)}»!</b> Пройди аттестацию в «Работе»` :
    next ? `<br><small>До аттестации на «${posName(j.id, r + 1)}»: ${next.shifts - jobShifts(j.id)} смен</small>` : '';
  const text = `${posName(j.id, r)} · результат ${score} (${Math.round(perf * 100)}%)<br>Заработано: <b style="color:var(--gold)">+${fmt(pay)} ₽</b>${roadNote}${promoNote}`;
  sfx(stars === 1 ? 'lose' : 'win');
  if (stars === 3) confetti(50);
  // Чиновникам иногда заносят конверт
  if (j.official && Math.random() < KICKBACK_CHANCE) {
    KICKBACK = { job: j.id, sum: Math.round(pay * rand(1.2, 2.5)) };
    openModal(`<div class="big-art"><div class="rays"></div><div class="big-emoji">✉️</div></div>
      <h3>${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)} Смена окончена</h3><p>${text}</p>
      <div class="info-card warn">После смены в кабинет зашёл «бизнесмен» и оставил на столе конверт: <b>${fmt(KICKBACK.sum)} ₽</b>. «Это за ускорение одного вопроса…»
        <br>Если возьмёшь, ${Math.round(KICKBACK_RISK * 100)}% — проверка из прокуратуры.</div>
      <div class="btns" style="flex-direction:column;gap:8px"><button class="btn primary wide" data-act="kickTake">💰 Взять конверт</button>
      <button class="btn wide" data-act="kickRefuse">🙅 Отказаться (честь дороже)</button></div>`, { center: true, locked: true });
    save();
    return;
  }
  resultModal({ emoji: ['😓', '🙂', '😎'][stars - 1], rays: stars === 1 ? 'bad' : '', title: `${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)} Смена окончена`, text, btn: 'Забрать' });
  save();
};

function promote(j, how) {
  const r = jobRank(j.id) + 1;
  S.jobPos[j.id] = r;
  track('promotion');
  const bonus = Math.round(j.pay * POS_MULT[r] * 2);
  addMoney(bonus);
  addXp(20 + r * 15);
  confetti(90);
  sfx('levelup');
  const done = () => resultModal({ emoji: '🎖️', title: `Новая должность: ${posName(j.id, r)}!`,
    text: `${how}<br>Оплата теперь <b>×${POS_MULT[r]}</b>. Премия за повышение: <b style="color:var(--gold)">+${fmt(bonus)} ₽</b>${r < 4 ? `<br><small>Следующая ступень «${posName(j.id, r + 1)}» — после ${RANKS[r + 1].shifts} смен</small>` : '<br>Это вершина карьеры на этой работе!'}`, btn: 'Ура!' });
  if (r === 4 && typeof playCutscene === 'function' && CUTS[`top_${j.id}`]) playCutscene(`top_${j.id}`, done);
  else done();
  save();
}

EXTRA_TABS.life.work = () => {
  const row = (j) => {
    const ok = reqOk(j.req);
    const r = jobRank(j.id), next = RANKS[r + 1];
    const cdExam = (S.cd['exam_' + j.id] || 0) > Date.now();
    let btn = S.busy ? busyBtn : `<button class="btn ${ok ? 'primary' : ''}" data-act="job" data-id="${j.id}" ${ok ? '' : 'disabled'}>На смену</button>`;
    let extra = '';
    if (ok && canPromote(j.id) && !S.busy) {
      extra = `<div class="promo-row">🎖️ Повышение до «${posName(j.id, r + 1)}»:
        <button class="btn small primary" data-act="jobExam" data-id="${j.id}" ${cdExam ? 'disabled' : ''}>${cdExam ? `<span data-until="${S.cd['exam_' + j.id]}"></span>` : 'Аттестация'}</button>
        ${j.state ? priceBtn('jobBribe', j.id, bribePrice(j), S.money >= bribePrice(j), `💼 Конверт ${fmt(bribePrice(j))}`).replace('class="btn', 'class="btn small') : ''}</div>`;
    }
    const tags = [j.state ? '🏛️ госслужба' : '', j.official ? '✉️ откаты' : '', j.physical ? '💪 сила' : '',
      JOB_GAMES[j.id].type === 'lanes' && transportJobBonus() ? `${vehicle().emoji} +${Math.round(transportJobBonus() * 100)}%` : ''].filter(Boolean).join(' · ');
    return card({ thumb: j.emoji, title: j.name, btn, cls: ok ? '' : 'locked',
      desc: `До <b>${fmt(j.pay * 1.25 * POS_MULT[r])} ₽</b> за смену · ${JOB_GAMES[j.id].title}${tags ? ` · ${tags}` : ''}
        <br>−${j.energy} ⚡ · −${j.food} 🍞${j.health ? ` · ${j.health} ❤️` : ''}`,
      extra: (jobShifts(j.id) ? `<div class="card-desc">🎖️ <b>${posName(j.id, r)}</b> (×${POS_MULT[r]}) · смен: ${jobShifts(j.id)}${next && !canPromote(j.id) ? ` · до аттестации ${next.shifts - jobShifts(j.id)}` : ''}</div>` : '') + extra + reqHTML(j.req) });
  };
  const priv = JOBS.filter((j) => !j.state), gov = JOBS.filter((j) => j.state);
  return `<div class="info-card">Смена — мини-игра на ~30 секунд, оплата зависит от результата. Наработал смены — сдай <b>аттестацию</b> (сыграй на ${Math.round(EXAM_PASS * 100)}%+) и получи новую должность: до ×${POS_MULT[4]} к оплате.
      На госслужбе платят даже за слабую смену, а повышение можно «ускорить» конвертом.
      ${S.health < 25 ? '<br><b style="color:var(--red)">Ты слишком болен для работы — подлечись.</b>' : ''}</div>
    <div class="subhead">🏛️ Госслужба</div>${gov.map(row).join('')}
    <div class="subhead">💼 Частный сектор</div>${priv.map(row).join('')}`;
};

function payShiftCost(j) {
  if (S.busy || !reqOk(j.req)) return false;
  if (S.health < 25) { toast('Ты слишком болен для работы', 'bad'); return false; }
  if (S.energy < j.energy) { toast(`Нужно ${j.energy} энергии`, 'bad'); return false; }
  if (S.food < j.food) { toast('На голодный желудок не работают. Поешь!', 'bad'); return false; }
  S.energy -= j.energy;
  feed(-j.food);
  return true;
}

Object.assign(ACTIONS, {
  jobExam: (id) => {
    const j = JOBS.find((x) => x.id === id);
    if (!canPromote(id) || (S.cd['exam_' + id] || 0) > Date.now() || !payShiftCost(j)) return;
    startShiftGame(j, (score, mg) => {
      const perf = score / JOB_GAMES[id].target - (JOB_GAMES[id].type === 'orders' ? (mg.mistakes || 0) * 0.05 : 0);
      if (perf >= EXAM_PASS) { promote(j, `Аттестация сдана на ${Math.round(perf * 100)}%. Комиссия впечатлена!`); return; }
      setCd('exam_' + id, EXAM_CD);
      addMood(-8);
      resultModal({ emoji: '📋', rays: 'bad', title: 'Аттестация не сдана', text: `Результат ${Math.round(perf * 100)}%, а нужно ${Math.round(EXAM_PASS * 100)}%. Пересдача через 10 минут. −8 😊`, btn: 'Эх' });
      sfx('lose');
      save();
    }, ' · аттестация');
  },
  jobBribe: (id) => {
    const j = JOBS.find((x) => x.id === id);
    const price = bribePrice(j);
    if (!j.state || !canPromote(id) || S.money < price) return;
    S.money -= price;
    if (Math.random() < BRIBE_RISK) {
      const fine = takeMoney(0.15, 20000);
      setCd('exam_' + id, EXAM_CD * 2);
      addMood(-20);
      resultModal({ emoji: '🚨', rays: 'bad', title: 'Взятку изъяли!', text: `Начальник оказался честным и сдал тебя в отдел собственной безопасности. Конверт изъяли, штраф ${fmt(fine)} ₽, выговор. Аттестация — не раньше чем через 20 минут.`, btn: 'Позор' });
      sfx('bad');
      return;
    }
    promote(j, 'Конверт ушёл куда надо. Приказ о назначении подписан задним числом.');
  },
  kickTake: () => {
    if (!KICKBACK) return;
    const k = KICKBACK; KICKBACK = null;
    const j = JOBS.find((x) => x.id === k.job);
    if (Math.random() < KICKBACK_RISK) {
      const fine = takeMoney(0.25, 50000);
      const r = jobRank(j.id);
      if (r > 0) S.jobPos[j.id] = r - 1;
      addMood(-25);
      resultModal({ emoji: '🚔', rays: 'bad', title: 'Прокуратура!', text: `Это была контрольная закупка. Конверт изъяли, штраф ${fmt(fine)} ₽${r > 0 ? `, понижение до «${posName(j.id, r - 1)}»` : ''}. −25 😊`, btn: 'Попался…' });
      sfx('bad');
    } else {
      addMoney(k.sum);
      track('kickback');
      resultModal({ emoji: '💰', title: 'Конверт твой', text: `+${fmt(k.sum)} ₽. «Вопрос решён». Совесть немного чешется.`, btn: 'Тсс…' });
      sfx('coin');
    }
    save();
  },
  kickRefuse: () => {
    KICKBACK = null;
    addMood(8);
    addXp(15);
    resultModal({ emoji: '😇', title: 'Честный чиновник', text: 'Ты вернул конверт. «Бизнесмен» ушёл озадаченным. +8 😊, +15 опыта. Михалыч бы гордился.', btn: 'Так держать' });
  },
});
