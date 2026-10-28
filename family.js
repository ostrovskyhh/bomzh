// Семья: девушка или жена иногда сама выходит на связь — задаёт вопросы, просит денег, зовёт помочь
// или в спальню. Доверие (S.trust) растёт и падает от твоих ответов. Плюс курсовое лечение ЗППП.

const PARTNER_EVERY = [14, 24]; // минут между окнами
const TRUST_START = 70;

function partner() { return S.girlfriend ? GIRLS.find((g) => g.id === S.girlfriend) : null; }
function partnerTitle() { return S.married ? 'Жена' : 'Девушка'; }
function addTrust(v) { if (S.trust === undefined) S.trust = TRUST_START; S.trust = clamp(S.trust + v, 0, 100); }
function addRel(v) { const g = partner(); if (g) { const st = girlState(g.id); st.rel = clamp(st.rel + v, 0, 100); } }

// Вопросы: [ответ, доверие, отношения, радость, её реакция, деньги]
const PARTNER_Q = [
  ['Я поправилась?', [['Ты идеальна', 6, 5, 2, '«Врёшь, но приятно» 😊'], ['Ну… чуть-чуть', -10, -8, -3, '«Ах так?! Сам ты чуть-чуть!»'], ['Я не заметил, я в телефоне', -6, -4, 0, '«Конечно, телефон тебе дороже»']]],
  ['Где ты был вчера вечером?', [['С Михалычем у костра', 2, 0, 0, '«Опять с этим… Ладно, верю»'], ['Покажу геолокацию, смотри', 8, 3, 0, '«Ой, ну что ты, я же просто спросила»'], ['Это допрос?!', -10, -5, -2, '«Значит, есть что скрывать!»']]],
  ['Ты меня любишь?', [['Больше жизни', 5, 6, 3, '«И я тебя!» ❤️'], ['Ну да', -3, -2, 0, '«Как-то без энтузиазма…»'], ['А что такое любовь?', -6, -5, 0, '«Философ, блин»']]],
  ['Кто тебе там всё время пишет?', [['Покажу — смотри сама', 8, 2, 0, '«Ой, это Шнырь… Ну ладно»'], ['Это по работе', -2, 0, 0, '«В десять вечера? Ну-ну»'], ['Не твоё дело', -14, -6, -3, '«Ах вот как…»']]],
  ['Помоешь посуду?', [['Уже мою!', 4, 4, -2, '«Золото, а не мужик»'], ['После футбола', -3, -2, 0, '«Как всегда»'], ['Это женская работа', -10, -8, 0, '«Тогда и ужин — женская забота. Голодай»']]],
  ['Познакомишься с моей мамой?', [['Конечно, куплю торт', 6, 6, 0, '«Мама будет в восторге!»', 500], ['Может, потом…', -4, -3, 0, '«Ты всегда «потом»»'], ['Я её боюсь', -1, 0, 2, '«Честно. И правильно»']]],
  ['Что подаришь на годовщину?', [['Всё, что захочешь', 6, 5, 0, '«Ловлю на слове!»', 1000], ['Сюрприз!', 2, 1, 0, '«Ну смотри у меня»'], ['А когда она?', -12, -8, -3, '«Ты забыл?!»']]],
  ['Давай заведём ребёнка?', [['Давай сначала кота', 2, 2, 2, '«Ну ладно, кота так кота»'], ['Я готов!', 6, 8, 3, '«Правда?!» 🥹'], ['Нам самим есть нечего', -4, -3, 0, '«Романтик»']]],
  ['Ты бы меня бросил ради модели Кристины?', [['Никогда в жизни', 6, 4, 0, '«Знаю, что врёшь, но спасибо»'], ['Смотря какая модель…', -12, -8, 0, '«Ну всё, спишь на лавке»'], ['Кто такая Кристина?', 3, 2, 0, '«Правильный ответ»']]],
];
// Просьбы о деньгах: [на что, эмодзи, во сколько семейных бюджетов]
const PARTNER_ASK = [['на новые сапоги', '👢', 1], ['на маникюр', '💅', 0.4], ['маме на день рождения', '🎂', 1], ['на курсы английского', '📚', 1.5],
  ['на путёвку в Турцию', '🏖️', 3], ['на новый телефон', '📱', 2], ['на шубу', '🧥', 4], ['на салон красоты', '💇‍♀️', 0.7]];
// Мини-игры с ней
const PARTNER_GAMES = [
  { id: 'bags', title: 'Донеси сумки из магазина', hint: 'Жми «Нести», когда метка в зелёной зоне. Не разбей яйца!', duration: 0, target: 6,
    setup: (mg) => gameTiming(mg, { btn: '🛍️ Нести', item: '🛍️', attempts: 5 }) },
  { id: 'keys', title: 'Найди её ключи', hint: 'Тапай по ключам 🔑. Остальной хлам не трогай', duration: 12, target: 5,
    setup: (mg) => gameTargets(mg, { good: ['🔑'], bad: ['🧦', '👟', '📱', '🧸', '💄'], goodRate: 0.3, every: 550, life: 1200 }) },
  { id: 'cook', title: 'Приготовь ужин', hint: 'Собери продукты по рецепту', duration: 20, target: 4,
    setup: (mg) => gameOrders(mg, { items: ['🥔', '🥕', '🧅', '🍗', '🧂', '🍅', '🥚', '🧄'], size: [2, 3] }) },
];

let PARTNER = null;

function partnerEvent() {
  const g = partner();
  if (!g) return;
  const w = { q: 35, ask: 25, game: 20, bed: hasSti() ? 60 : 15 };
  let r = Math.random() * Object.values(w).reduce((a, b) => a + b, 0);
  const kind = Object.keys(w).find((k) => (r -= w[k]) < 0) || 'q';
  const head = `<div class="big-art" style="height:96px"><div class="big-emoji" style="line-height:96px">${S.married ? '👰' : g.emoji}</div></div>`;
  sfx('notify');
  if (kind === 'q') {
    const [q, answers] = pick(PARTNER_Q);
    PARTNER = { kind, answers };
    openModal(`${head}<h3>${partnerTitle()} ${g.name.split(' ').pop()}:</h3><p>«${q}»</p>
      <div class="btns" style="flex-direction:column;gap:8px">${shuffle(answers.map((a, i) => [a, i])).map(([a, i]) => `<button class="btn wide" data-act="pAnswer" data-id="${i}">${a[0]}</button>`).join('')}</div>`, { center: true, locked: true });
  } else if (kind === 'ask') {
    const [what, emoji, k] = pick(PARTNER_ASK);
    const sum = wifeRequestCost(Math.max(100, Math.round(ALLOWANCE[girlIdx(g.id)] * k * rand(0.8, 1.2) / 10) * 10));
    PARTNER = { kind, sum, what };
    openModal(`${head}<h3>${emoji} «Дай денег ${what}!»</h3><p>${g.name} смотрит жалобными глазами. Нужно <b>${fmt(sum)} ₽</b>.</p>
      <div class="btns" style="flex-direction:column;gap:8px">
        ${priceBtn('pAsk', 'full', sum, S.money >= sum, `💸 Дать ${fmt(sum)} ₽`).replace('class="btn', 'class="btn wide')}
        ${priceBtn('pAsk', 'half', sum / 2, S.money >= sum / 2, `🤏 Дать половину`).replace('class="btn', 'class="btn wide')}
        <button class="btn wide" data-act="pAsk" data-id="no">🙅 Денег нет</button></div>`, { center: true, locked: true });
  } else if (kind === 'game') {
    const gm = pick(PARTNER_GAMES);
    PARTNER = { kind, gm };
    openModal(`${head}<h3>«Помоги мне!»</h3><p>${g.name}: «${gm.title.toLowerCase()}, пожалуйста». Справишься — она будет довольна.</p>
      <div class="btns" style="flex-direction:column;gap:8px"><button class="btn primary wide" data-act="pGame">Помочь</button>
      <button class="btn wide" data-act="pGameNo">Я занят</button></div>`, { center: true, locked: true });
  } else {
    PARTNER = { kind };
    openModal(`${head}<h3>😏 «Пойдём в спальню?»</h3><p>${g.name} игриво подмигивает и выключает свет.${hasSti() ? '<br><small style="color:var(--red)">Ты-то знаешь, что у тебя не всё в порядке…</small>' : ''}</p>
      <div class="btns" style="flex-direction:column;gap:8px"><button class="btn primary wide" data-act="pBed" data-id="yes">❤️ Пойдём</button>
      <button class="btn wide" data-act="pBed" data-id="no">🤕 Голова болит</button></div>`, { center: true, locked: true });
  }
}

function partnerReply(emoji, title, text, good) {
  resultModal({ emoji, rays: good ? '' : 'bad', title, text: `${text}<br><small>Доверие ${Math.round(S.trust)}/100</small>`, btn: 'Ок' });
  sfx(good ? 'good' : 'bad');
  checkTrust();
}

// Доверие на нуле — она уходит
function checkTrust() {
  const g = partner();
  if (!g || S.trust > 0) return;
  S.trust = TRUST_START;
  if (S.married) { setTimeout(() => startDivorce(true, `${g.name}: «Я тебе больше не верю. Развод!»`), 50); return; }
  girlState(g.id).rel = 20;
  S.girlfriend = null;
  addEffect('heartbreak', 5);
  setTimeout(() => resultModal({ emoji: '💔', rays: 'bad', title: 'Она ушла', text: `${g.name}: «Я тебе больше не верю». Доверие упало до нуля.`, btn: 'Эх…' }), 50);
}

// Принёс заразу — всё вскрылось
function partnerCaughtSti(g) {
  const sti = STIS.find((id) => hasEffect(id));
  if (S.married) { startDivorce(true, `Жена сходила к врачу: «${EFFECTS[sti].name}?! Откуда, Валера?!» Она подаёт на развод.`); return; }
  girlState(g.id).rel = 10;
  S.girlfriend = null;
  addMood(-25);
  addEffect('heartbreak', 10);
  resultModal({ emoji: '🦠', rays: 'bad', title: '«Откуда у меня это?!»', text: `${g.name} подхватила от тебя ${EFFECTS[sti].emoji} ${EFFECTS[sti].name} и всё поняла. Вы расстались. Подлечись у венеролога!`, btn: 'Позор…' });
  sfx('bad');
}

HOOKS.tick.push(() => {
  if (!partner()) return;
  if (S.trust === undefined) S.trust = TRUST_START;
  const now = Date.now();
  if (!S.partnerAt) S.partnerAt = now + rand(...PARTNER_EVERY) * 60000;
  if (now < S.partnerAt || !popupTurn(2) || S.busy || MG || FIGHT || !S.storySeen) return;
  S.partnerAt = now + rand(...PARTNER_EVERY) * 60000;
  partnerEvent();
});

Object.assign(ACTIONS, {
  pAnswer: (i) => {
    const p = PARTNER; PARTNER = null;
    if (!p) return;
    const [, trust, rel, mood, reply, rawMoney] = p.answers[+i];
    const money=wifeRequestCost(rawMoney||0);
    addTrust(trust); addRel(rel); addMood(mood);
    if (money) S.money = Math.max(0, S.money - money);
    partnerReply(trust >= 0 ? '😊' : '😠', trust >= 0 ? 'Хороший ответ' : 'Зря ты так', `${reply}${money ? `<br>−${fmt(money)} ₽` : ''}<br>Доверие ${trust >= 0 ? '+' : ''}${trust}`, trust >= 0);
  },
  pAsk: (id) => {
    const p = PARTNER; PARTNER = null;
    if (!p) return;
    if (id === 'full' && S.money >= p.sum) { S.money -= p.sum; addTrust(8); addRel(5); track('partnerGift'); partnerReply('🥰', 'Спасибо, любимый!', `−${fmt(p.sum)} ₽. Доверие +8`, true); return; }
    if (id === 'half' && S.money >= p.sum / 2) {
      S.money -= p.sum / 2;
      if (Math.random() < 0.5) { addTrust(2); partnerReply('🙂', '«Ну хоть так»', `−${fmt(p.sum / 2)} ₽. Доверие +2`, true); }
      else { addTrust(-6); addRel(-3); partnerReply('😒', '«Жмот!»', `−${fmt(p.sum / 2)} ₽, а она всё равно обиделась. Доверие −6`, false); }
      return;
    }
    addTrust(-10); addRel(-5); addMood(-5);
    partnerReply('😤', '«Ну и ладно!»', `Она надулась и не разговаривает. Доверие −10`, false);
  },
  pGame: () => {
    const p = PARTNER; PARTNER = null;
    if (!p) return;
    const gm = p.gm;
    runGame({ title: gm.title, hint: gm.hint, duration: gm.duration, setup: gm.setup, finish: (score, mg) => {
      const perf = score / gm.target - (mg.mistakes || 0) * 0.1;
      if (perf >= 0.6) { addTrust(6); addRel(6); addMood(5); partnerReply('🥰', '«Какой ты у меня молодец!»', `Справился на ${Math.round(Math.min(1, perf) * 100)}%. Доверие +6, +5 😊`, true); }
      else { addTrust(-4); addRel(-3); partnerReply('🙄', '«Ничего тебе доверить нельзя»', `Только ${Math.round(Math.max(0, perf) * 100)}%. Доверие −4`, false); }
    } });
  },
  pGameNo: () => { PARTNER = null; addTrust(-5); addRel(-2); partnerReply('😒', '«Ну конечно, ты всегда занят»', 'Доверие −5', false); },
  pBed: (id) => {
    const p = PARTNER; PARTNER = null;
    const g = partner();
    if (!p || !g) return;
    if (id === 'yes') {
      if (hasSti() && Math.random() < 0.7) { partnerCaughtSti(g); return; }
      addRel(8); addTrust(5); addMood(15); S.energy = Math.max(0, S.energy - 10);
      track('partnerBed');
      resultModal({ emoji: '❤️', title: 'Чудесный вечер', text: `+15 😊, отношения +8, доверие +5, −10 ⚡${hasSti() ? '<br><small>Пронесло… пока. Лечись скорее!</small>' : ''}`, btn: '😌' });
      sfx('good');
      return;
    }
    // Отказ — она требует доказательств любви
    const sum = wifeRequestCost(Math.max(200, Math.round(ALLOWANCE[girlIdx(g.id)] * 2 / 10) * 10));
    PARTNER = { kind: 'gift', sum };
    openModal(`<div class="big-art" style="height:96px"><div class="big-emoji" style="line-height:96px">😠</div></div>
      <h3>«Голова у него болит…»</h3><p>${g.name}: «Значит, разлюбил? Тогда докажи — купи мне подарок на <b>${fmt(sum)} ₽</b>. Или у тебя кто-то есть?!»</p>
      <div class="btns" style="flex-direction:column;gap:8px">${priceBtn('pGift', 'yes', sum, S.money >= sum, `🎁 Купить подарок ${fmt(sum)} ₽`).replace('class="btn', 'class="btn wide')}
      <button class="btn wide" data-act="pGift" data-id="no">🙅 Не буду</button></div>`, { center: true, locked: true });
  },
  pGift: (id) => {
    const p = PARTNER; PARTNER = null;
    if (!p) return;
    if (id === 'yes' && S.money >= p.sum) { S.money -= p.sum; addRel(2); track('partnerGift'); partnerReply('🎁', '«Ладно, прощён»', `−${fmt(p.sum)} ₽. Доверие сохранено`, true); return; }
    addTrust(-20); addRel(-10);
    partnerReply('😡', '«У тебя кто-то есть!»', 'Доверие −20. Она проверяет твой телефон каждую ночь', false);
  },
});

// =====================================================================
// Курсовое лечение ЗППП: несколько приёмов у венеролога + таблетки/мазь по графику
// =====================================================================

const STI_COURSE = {
  chlamydia: { visits: 2, doses: 4, med: 'antibiotics' },
  gonorrhea: { visits: 3, doses: 5, med: 'antibiotics' },
  herpes: { visits: 1, doses: 3, med: 'acyclovir' },
};
const VENEROLOG_PRICE = 800;
const DOSE_GAP = 2 * 60000, VISIT_GAP = 3 * 60000, DOSE_MISS = 20 * 60000;

function stiCourse(id) { if (!S.stiCourse) S.stiCourse = {}; return S.stiCourse[id] || (S.stiCourse[id] = { visits: 0, doses: 0, lastDose: 0, lastVisit: 0 }); }
// Сколько доз нужно принять перед визитом номер k (с единицы)
function dosesBeforeVisit(id, k) { const n = STI_COURSE[id]; return k <= 1 ? 0 : n.visits === 1 ? n.doses : Math.round((k - 1) * n.doses / (n.visits - 1)); }
function dosesCap(id) { const c = stiCourse(id), n = STI_COURSE[id]; return c.visits >= n.visits ? n.doses : Math.min(n.doses, dosesBeforeVisit(id, c.visits + 1)); }
function visitWait(id) { const c = stiCourse(id); return Math.max(0, c.lastVisit + VISIT_GAP - Date.now()); }
function doseWait(id) { const c = stiCourse(id); return Math.max(0, c.lastDose + DOSE_GAP - Date.now()); }
function canVisit(id) { const c = stiCourse(id), n = STI_COURSE[id]; return c.visits < n.visits && c.doses >= dosesBeforeVisit(id, c.visits + 1) && !visitWait(id); }

function stiCheckCure(id) {
  const c = stiCourse(id), n = STI_COURSE[id];
  if (c.visits < n.visits || c.doses < n.doses) return false;
  S.effects = S.effects.filter((e) => e.id !== id);
  delete S.stiCourse[id];
  track('cured');
  track('stiCured');
  confetti(40);
  resultModal({ emoji: '🧪', title: 'Анализы чистые!', text: `${EFFECTS[id].emoji} ${EFFECTS[id].name} вылечен. Венеролог: «И впредь — предохраняйтесь!»`, btn: 'Наконец-то' });
  sfx('win');
  return true;
}

function venVisit(id) {
  const e = activeEffects().find((x) => x.id === id);
  if (!e || !canVisit(id) || S.money < VENEROLOG_PRICE) return;
  S.money -= VENEROLOG_PRICE;
  const c = stiCourse(id), n = STI_COURSE[id];
  e.diag = true;
  c.visits++;
  c.lastVisit = Date.now();
  heal(5);
  if (stiCheckCure(id)) return;
  const med = MEDS.find((m) => m.id === n.med);
  const text = c.visits === 1
    ? `Диагноз: <b>${EFFECTS[id].name}</b>. Назначен курс: ${n.doses} × ${med.emoji} ${med.name}, не чаще раза в 2 минуты, и ${n.visits - 1 ? `ещё ${n.visits - 1} контрольных приёма` : 'больше приходить не надо'}.<br>Пропустишь приём дольше 20 минут — доза сгорит.`
    : `Анализы получше. Продолжай курс: принято ${c.doses}/${n.doses}. Визитов ${c.visits}/${n.visits}.`;
  resultModal({ emoji: '👨‍⚕️', title: 'Приём у венеролога', text, btn: 'Понял' });
  sfx('good');
}

useMed = (function (orig) {
  return function (id) {
    const md = MEDS.find((x) => x.id === id);
    const e = activeEffects().find((x) => STI_COURSE[x.id] && STI_COURSE[x.id].med === id);
    if (!e) return orig(id);
    if (S.money < md.price) return;
    const c = stiCourse(e.id), n = STI_COURSE[e.id];
    if (!c.visits) { toast('Без назначения венеролога не поможет. Запишись на приём во «Врачах»', 'bad'); return; }
    if (c.doses >= dosesCap(e.id)) { toast('Сначала контрольный приём у венеролога', 'bad'); return; }
    if (doseWait(e.id)) { toast(`Рано! Следующий приём через ${fmtTime(doseWait(e.id) / 1000)}`, 'bad'); return; }
    S.money -= md.price;
    if (c.doses > 0 && Date.now() - c.lastDose > DOSE_MISS) {
      c.lastDose = Date.now();
      toast('Ты пропустил приём — эта доза ушла на то, чтобы наверстать', 'bad');
      return;
    }
    c.doses++;
    c.lastDose = Date.now();
    sfx('good');
    if (!stiCheckCure(e.id)) toast(`${md.emoji} Доза ${c.doses}/${n.doses} · ${EFFECTS[e.id].name}`, 'good');
  };
})(useMed);

// Платная клиника вылечит всё, кроме ЗППП — их только курсом
visitClinic = (function (orig) {
  return function (id) {
    const keep = S.effects.filter((e) => STI_COURSE[e.id]);
    orig(id);
    if (id === 'private' && keep.length) {
      keep.forEach((e) => { e.diag = true; if (!S.effects.includes(e)) S.effects.push(e); });
      setTimeout(() => toast('ЗППП за один раз не лечатся — нужен курс у венеролога', 'bad'), 400);
    }
  };
})(visitClinic);

cureHint = (function (orig) { return (id) => (STI_COURSE[id] ? 'курс у венеролога' : orig(id)); })(cureHint);

function stiCardsHTML() {
  const list = activeEffects().filter((e) => STI_COURSE[e.id]);
  if (!list.length) return '';
  return `<div class="subhead">🦠 Венеролог · лечение курсом</div>` + list.map((e) => {
    const id = e.id, c = stiCourse(id), n = STI_COURSE[id], med = MEDS.find((m) => m.id === n.med);
    const title = e.diag ? `${EFFECTS[id].emoji} ${EFFECTS[id].name}` : `❓ ${EFFECTS[id].hidden}`;
    const vw = visitWait(id), dw = doseWait(id);
    const needVisit = c.visits < n.visits && c.doses >= dosesBeforeVisit(id, c.visits + 1);
    const canDose = c.visits > 0 && c.doses < dosesCap(id);
    const steps = `<div class="course"><span>👨‍⚕️ Приёмы <b>${c.visits}/${n.visits}</b></span><span>${med.emoji} Доза <b>${c.doses}/${n.doses}</b></span></div>`;
    let btn = '';
    if (needVisit) btn = vw ? `<button class="btn" disabled>👨‍⚕️ <span data-until="${Date.now() + vw}"></span></button>` : priceBtn('venVisit', id, VENEROLOG_PRICE, S.money >= VENEROLOG_PRICE, `👨‍⚕️ ${fmt(VENEROLOG_PRICE)} ₽`);
    else if (canDose) btn = dw ? `<button class="btn" disabled>${med.emoji} <span data-until="${Date.now() + dw}"></span></button>` : priceBtn('med', med.id, med.price, S.money >= med.price, `${med.emoji} ${fmt(med.price)} ₽`);
    const hint = !c.visits ? 'Запишись к венерологу: он поставит диагноз и назначит курс.' : needVisit ? 'Пора на контрольный приём.' : `Принимай ${med.name.toLowerCase()} не чаще раза в 2 минуты.`;
    return card({ thumb: '🦠', title, desc: `${hint}${steps}`, btn });
  }).join('');
}

EXTRA_TABS.life.health = function healthWithSti() {
  delete EXTRA_TABS.life.health;
  const html = renderLife();
  EXTRA_TABS.life.health = healthWithSti;
  return stiCardsHTML() + html;
};

ACTIONS.venVisit = (id) => venVisit(id);
