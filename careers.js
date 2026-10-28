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

// Мини-игра «Одобрить или отказать»: gen(mg) возвращает { text, ok }.
// У чиновников и депутатов на каждое решение есть секунды, ошибка стоит дороже, а правила меняются по ходу.

// ---------- Документы для чиновника ----------
const DOC_FIELDS = ['печать', 'подпись', 'дата', 'номер'];
const DOC_TYPES = ['Справка о доходах', 'Заявление на субсидию', 'Разрешение на ларёк', 'Прописка', 'Жалоба на соседей', 'Заявка на ремонт дороги',
  'Лицензия на такси', 'Разрешение на шашлычную', 'Справка для ипотеки', 'Заявка на снос гаражей', 'Разрешение на митинг', 'Акт приёмки дороги'];
const DOC_JOKES = [['Заявление от Эдика: «Дайте денег просто так»', 0], ['Справка, что Шнырь — честный человек', 0], ['Прошение Михалыча о бесплатной лавке', 1],
  ['Заявка: «Покрасить бордюр в цвет надежды»', 1], ['Жалоба голубей на бабушек с хлебом', 0], ['Просьба школы о новых партах', 1]];
const DOC_TRAPS = ['В папке конверт 💰 «за срочность»', 'Приписка карандашом: «Это от Эдика, подпиши не глядя»', 'Подпись: «Валера» — но это не твой почерк'];
function ddmm(d) { return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`; }
function genDoc() {
  const r = Math.random();
  if (r < 0.12) { const [t, ok] = pick(DOC_JOKES); return { text: `📄 ${t}`, ok }; }
  const now = new Date();
  const until = new Date(now.getTime() + Math.round(rand(-25, 40)) * 86400000);
  const expired = until < new Date(now.toDateString());
  const miss = Math.random() < 0.35 ? pick(DOC_FIELDS) : null;
  const trap = Math.random() < 0.12 ? pick(DOC_TRAPS) : null;
  const marks = DOC_FIELDS.map((f) => `${f === miss ? '❌' : '✅'} ${f}`).join(' · ');
  return { text: `📄 <b>${pick(DOC_TYPES)}</b><br><small>${marks}</small><br>Действует до <b>${ddmm(until)}</b>${trap ? `<br><span class="vd-trap">${trap}</span>` : ''}`,
    ok: miss || expired || trap ? 0 : 1 };
}

function genHomework() {
  const x = Math.floor(rand(2, 13)), y = Math.floor(rand(2, 13)), ok = Math.random() < 0.5;
  const ans = ok ? x * y : x * y + pick([-10, -2, -1, 1, 2, 10]);
  return { text: `📓 Домашка Вовочки:<br><b>${x} × ${y} = ${ans}</b>`, ok: ok ? 1 : 0 };
}

// ---------- Законы для депутата: [текст, полезный ли, метки] ----------
const BILLS = [
  ['Бесплатные пирожки пенсионерам', 1, ['pension']], ['Налог на воздух', 0, ['tax']], ['Ремонт дорог во дворах', 1, ['big']], ['Депутатам — зарплату ×10', 0, ['self']],
  ['Пункты приёма бутылок в каждом дворе', 1, []], ['Запрет на смех по вторникам', 0, []], ['Новые лавочки в парках', 1, []], ['Штраф за грустное лицо', 0, ['tax']],
  ['Бесплатный Wi-Fi в метро', 1, ['big']], ['Обязательный галстук для голубей', 0, []], ['Ночлежки для бездомных', 1, ['big']], ['Налог на шаурму', 0, ['tax']],
  ['Надбавка к пенсии ветеранам труда', 1, ['pension', 'big']], ['Налог на роскошные яхты', 1, ['tax']], ['Бесплатный проезд пенсионерам', 1, ['pension']],
  ['Новая поликлиника в спальном районе', 1, ['big']], ['Мост через реку за 5 млрд', 1, ['big']], ['Запрет кормить уток', 0, []],
  ['Служебные лимузины всем депутатам', 0, ['self', 'big']], ['Налог на солнечный свет', 0, ['tax']], ['Отмена пенсий после 60', 0, ['pension']],
  ['Освещение во всех дворах', 1, []], ['Детские площадки в каждом квартале', 1, []], ['Налоговый вычет за спорт', 1, ['tax']],
  ['Переименовать город в «Эдикград»', 0, []], ['Обязательная зарядка по утрам по ТВ', 0, []], ['Бесплатные курсы для безработных', 1, ['big']],
  ['Запрет на шум после 23:00', 1, []], ['Повысить налог на зарплату всем', 0, ['tax']], ['Санаторий для депутатов на Мальдивах', 0, ['self', 'big']],
  ['Ремонт школ и детских садов', 1, ['big']], ['Штраф за немытую машину', 0, ['tax']], ['Пандусы во всех подъездах', 1, []],
  ['Субсидии фермерам', 1, ['big']], ['Запретить кошкам гулять', 0, []], ['Пенсионерам — бесплатные лекарства', 1, ['pension', 'big']],
];
const BILL_AMENDMENTS = ['…и премию депутатам ×5', '…а заодно продлить полномочия до 2099 года', '…и дачу председателю комитета'];
// Установки фракции: меняют правильный ответ. Посреди заседания установка может смениться
const PARTY_LINES = [
  { text: 'Голосуй по совести: полезное — «За», бред — «Против»', ok: (b) => b[1] },
  { text: 'Фракция велела: ПРОТИВ любых законов о налогах', ok: (b) => (b[2].includes('tax') ? 0 : b[1]) },
  { text: 'Перед выборами: ЗА всё, что касается пенсионеров', ok: (b) => (b[2].includes('pension') ? 1 : b[1]) },
  { text: 'Бюджет пуст: ПРОТИВ всех дорогих проектов (💰)', ok: (b) => (b[2].includes('big') ? 0 : b[1]) },
];
function genBill(mg) {
  const b = pick(BILLS);
  const amend = Math.random() < 0.2 ? pick(BILL_AMENDMENTS) : null;
  const line = mg.partyLine || PARTY_LINES[0];
  return { text: `📜 Законопроект:<br><b>«${b[0]}»</b>${b[2].includes('big') ? ' 💰' : ''}${amend ? `<br><span class="vd-trap">${amend}</span>` : ''}`,
    ok: amend || b[2].includes('self') ? 0 : line.ok(b) };
}

function gameVerdict(mg, cfg) {
  const arena = $('mgArena');
  let timer = null;
  // Установка фракции на заседании: в начале и смена на середине
  if (cfg.party) {
    mg.partyLine = pick(PARTY_LINES);
    mg.timers.push(setTimeout(() => {
      if (!mgAlive(mg)) return;
      mg.partyLine = pick(PARTY_LINES.filter((l) => l !== mg.partyLine));
      sfx('notify'); haptic('heavy');
      floatAt($('mgArena'), '📢 Новая установка!', 'bad');
    }, 15000));
  }
  const rule = () => (cfg.party ? `📢 ${mg.partyLine.text}<br><small>Поправки в пользу депутатов — всегда «Против»</small>` : typeof cfg.rule === 'function' ? cfg.rule() : cfg.rule);
  const answer = (b, it) => {
    clearTimeout(timer);
    if (!mgAlive(mg)) return;
    arena.querySelectorAll('.vd-btns .btn').forEach((x) => { x.dataset.done = 1; });
    const right = b ? +b.dataset.v === it.ok : false;
    if (right) { mgScore(1); sfx('chip'); } else { mgScore(-(cfg.penalty || 1)); sfx('error'); haptic('error'); shakeArena(); }
    floatAt(b || arena, right ? '✓' : b ? `✗ −${cfg.penalty || 1}` : '⏰ Не успел!', right ? 'good' : 'bad');
    setTimeout(show, right ? 200 : 500);
  };
  const show = () => {
    if (!mgAlive(mg)) return;
    const it = cfg.gen(mg);
    arena.innerHTML = `<div class="vd-rule">${rule()}</div><div class="vd-card">${it.text}</div>
      ${cfg.limit ? '<div class="vd-time"><div id="vdTime"></div></div>' : ''}
      <div class="vd-btns"><button class="btn green" data-v="1">${cfg.yes}</button><button class="btn dark-path" data-v="0">${cfg.no}</button></div>`;
    arena.querySelectorAll('.vd-btns .btn').forEach((b) => {
      b.onpointerdown = (e) => { e.preventDefault(); if (!b.dataset.done) answer(b, it); };
    });
    if (cfg.limit) {
      const bar = $('vdTime');
      bar.style.transition = 'none'; bar.style.width = '100%';
      requestAnimationFrame(() => { bar.style.transition = `width ${cfg.limit}ms linear`; bar.style.width = '0%'; });
      timer = setTimeout(() => answer(null, it), cfg.limit);
      mg.timers.push(timer);
    }
  };
  show();
}

Object.assign(JOB_GAMES, {
  dvornik: { type: 'targets', title: 'Подмети двор', hint: 'Тапай по мусору 🍂. Кота и бабушку не мети!', good: ['🍂', '🍁', '🥤', '📰', '🚬'], bad: ['🐈', '👵'], goodRate: 0.75, every: 600, life: 1300, target: 26 },
  postman: { type: 'lanes', title: 'Разнеси почту', hint: 'Собирай письма ✉️, уворачивайся от собак и ям. Врезался — минус одно письмо', good: ['✉️', '✉️', '📦', '📰'], bad: ['🐕', '🕳️', '🚧'], target: 13, speed: 0.8, goodRate: 0.62 },
  cook: { type: 'orders', title: 'Крути шаурму', hint: 'Собери шаурму по заказу. Лишний лук — злой клиент', items: ['🫓', '🥩', '🍗', '🧅', '🍅', '🥒', '🧀', '🌶️', '🥬'], size: [3, 4], target: 7 },
  police: { type: 'targets', title: 'Патруль', hint: 'Задерживай нарушителей 🦹. Мирных граждан не трогай!', good: ['🦹', '🥷', '🦹‍♀️', '🧟'], bad: ['🧑', '👵', '🧒', '👩'], goodRate: 0.45, every: 580, life: 1050, target: 16 },
  teacher: { type: 'verdict', title: 'Проверь домашку', hint: 'Верно решено — «Зачёт», ошибка — «Двойка». На тетрадь 4 секунды', gen: genHomework, yes: '✅ Зачёт', no: '2️⃣ Двойка', rule: 'Решено верно?', limit: 4000, target: 15 },
  clerk: { type: 'verdict', title: 'Разбери бумаги', hint: 'Одобряй, только если все 4 отметки на месте, срок не истёк и нет взятки. 3,5 секунды на документ, ошибка −2',
    gen: genDoc, yes: '✅ Одобрить', no: '⛔ Отказать', rule: () => `Сегодня <b>${ddmm(new Date())}</b>. Нужны: печать, подпись, дата, номер и действующий срок. Взятки — отказ`, limit: 3500, penalty: 2, target: 14 },
  deputy: { type: 'verdict', title: 'Заседание', hint: 'Голосуй по установке фракции — она сменится посреди заседания! 3,5 секунды на закон, ошибка −2',
    gen: genBill, yes: '👍 За', no: '👎 Против', party: true, limit: 3500, penalty: 2, target: 14 },
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

// На «дорожных» работах игрок едет на своём транспорте, а без него — идёт пешком
function roadPlayer(j) {
  if (S.transport && !S.transportBroken) return vehicle().emoji;
  return j.id === 'taxi' ? '🚕' : '🚶';
}

function startShiftGame(j, onFinish, titleExtra = '') {
  const base = JOB_GAMES[j.id];
  const cfg = base.type === 'lanes' ? { ...base, player: roadPlayer(j) } : base;
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
  const perf = score > 0 ? shiftPerf(j, score, mg) : 0;
  const r = jobRank(j.id);
  const road = cfg.type === 'lanes' ? 1 + transportJobBonus() : 1;
  const pay = Math.round(j.pay * perf * mods().work * POS_MULT[r] * road * (j.physical ? 1 + S.strength / 200 : 1));
  addMoney(pay);
  addMood(j.mood);
  if (j.health) hurt(-j.health);
  // Минимальная оплата не превращает нулевой результат в выполненную смену.
  const credited = score > 0;
  if (credited) {
    S.jobs[j.id] = jobShifts(j.id) + 1;
    S.stats.shifts++;
    track('shift');
    if (j.state) track('stateShift');
    addXp(8 + Math.min(JOBS.indexOf(j), 9) * 6);
  }
  const roadNote = cfg.type === 'lanes' ? useTransport() : '';
  const stars = perf >= 1 ? 3 : perf >= 0.6 ? 2 : 1;
  const next = RANKS[r + 1];
  const promoNote = canPromote(j.id) ? `<br><br>🎖️ <b>Можно на повышение: «${posName(j.id, r + 1)}»!</b> Пройди аттестацию в «Работе»` :
    next ? `<br><small>До аттестации на «${posName(j.id, r + 1)}»: ${next.shifts - jobShifts(j.id)} смен</small>` : '';
  const text = `${posName(j.id, r)} · результат ${score} (оплата ${Math.round(perf * 100)}%)<br>Заработано: <b style="color:var(--gold)">+${fmt(pay)} ₽</b>${roadNote}${!credited ? '<br><b>Смена не засчитана:</b> нулевой результат не даёт опыта, прогресса заданий и смен до аттестации. Набери очки в мини-игре.' : ''}${promoNote}`;
  sfx(stars === 1 ? 'lose' : 'win');
  if (stars === 3) confetti(50);
  // Чиновникам иногда заносят конверт
  if (credited && j.official && Math.random() < KICKBACK_CHANCE) {
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

// Анимация приказа: документ въезжает, на него падает штамп, бейдж должности, множитель оплаты растёт
function jobCeremony({ kind, j, from, to, mult, text, onOk }) {
  const hire = kind === 'hire';
  openModal(`<div class="cer ${hire ? 'hire' : 'promo'}">
      <div class="cer-badge"><div class="rays"></div><span>${j.emoji}</span></div>
      <div class="cer-doc">
        <div class="cer-head">${hire ? 'ТРУДОВОЙ ДОГОВОР' : 'ПРИКАЗ'} № ${Math.floor(rand(100, 999))}</div>
        <div class="cer-line">${hire ? `${esc(playerName())} принят на работу` : `${esc(playerName())} переводится на должность`}</div>
        <div class="cer-pos">${from ? `<s>${from}</s><i>➜</i>` : ''}<b>${to}</b></div>
        <div class="cer-job">${j.name}</div>
        <div class="cer-sign">Директор: <i>✍️ Подпись</i></div>
        <div class="cer-stamp">${hire ? 'ПРИНЯТ' : 'НАЗНАЧЕН'}</div>
      </div>
      <div class="cer-mult">Оплата <b id="cerMult">×1.00</b></div>
      ${text ? `<p class="cer-text">${text}</p>` : ''}
      <div class="btns"><button class="btn primary wide" data-act="${onOk ? 'cerGo' : 'close'}">${hire ? '🚀 Начать первую смену' : 'Ура!'}</button></div>
    </div>`, { center: true, locked: !!onOk });
  CER_NEXT = onOk || null;
  sfx('whoosh');
  setTimeout(() => { if ($('cerMult')) { sfx('heavy'); haptic('heavy'); confetti(hire ? 50 : 90); } }, 900);
  setTimeout(() => { sfx(hire ? 'good' : 'levelup'); }, 1200);
  // Множитель «докручивается» до нового значения
  const start = performance.now();
  const tick = (now) => {
    const el = $('cerMult');
    if (!el) return;
    const t = Math.min(1, (now - start - 1100) / 700);
    el.textContent = `×${(1 + (mult - 1) * Math.max(0, t)).toFixed(2)}`;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
let CER_NEXT = null;
ACTIONS.cerGo = () => { const f = CER_NEXT; CER_NEXT = null; closeModal(); if (f) f(); };

// Первая смена на новой работе — сначала договор
const _jobAction = ACTIONS.job;
ACTIONS.job = (id) => {
  const j = JOBS.find((x) => x.id === id);
  if (!S.hired) S.hired = {};
  const cantWork = S.health < 25 || S.energy < j.energy || S.food < j.food;
  if (jobShifts(id) || S.hired[id] || S.busy || !reqOk(j.req) || cantWork) { _jobAction(id); return; }
  S.hired[id] = true;
  track('hired');
  jobCeremony({ kind: 'hire', j, to: posName(id, 0), mult: POS_MULT[0],
    text: `Оклад до <b>${fmt(j.pay * 1.25)} ₽</b> за смену. Наработаешь смены — сдашь аттестацию на «${posName(id, 1)}».`, onOk: () => _jobAction(id) });
};

function promote(j, how) {
  const r = jobRank(j.id) + 1;
  S.jobPos[j.id] = r;
  track('promotion');
  const bonus = Math.round(j.pay * POS_MULT[r] * 2);
  addMoney(bonus);
  addXp(20 + r * 15);
  const done = () => jobCeremony({ kind: 'promo', j, from: posName(j.id, r - 1), to: posName(j.id, r), mult: POS_MULT[r],
    text: `${how}<br>Премия за повышение: <b style="color:var(--gold)">+${fmt(bonus)} ₽</b>${r < 4 ? `<br><small>Следующая ступень «${posName(j.id, r + 1)}» — после ${RANKS[r + 1].shifts} смен</small>` : '<br>Это вершина карьеры на этой работе!'}` });
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
    if (ok && canPromote(j.id)) {
      extra = `<div class="promo-row">🎖️ Повышение до «${posName(j.id, r + 1)}»:
        <button class="btn small primary" data-act="jobExam" data-id="${j.id}" ${cdExam || S.busy ? 'disabled' : ''}>${cdExam ? `<span data-until="${S.cd['exam_' + j.id]}"></span>` : 'Аттестация'}</button>
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
