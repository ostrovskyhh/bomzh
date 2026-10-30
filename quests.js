// Сюжетные квесты (с развилкой: честный путь или тёмная дорожка) и обучение для новичков.

// ---------- Цели квестов ----------
// qc — счётчик с момента начала главы, qv — значение, которое должно достичь порога
const qc = (key, need, text) => ({ key, text, need, cur: () => counter(key) - ((S.quest.base || {})[key] || 0) });
const qv = (fn, need, text) => ({ text, need, cur: fn });

// Цель «Карьеры»: лучшая должность среди всех работ. В тексте видно, какая она сейчас и где лучше расти
function bestJobPos() {
  let best = null;
  JOBS.forEach((j) => { if (!jobShifts(j.id)) return; const r = jobRank(j.id); if (!best || r > best.r) best = { j, r }; });
  return best;
}
function careerGoal() {
  return { key: 'promotion', need: 2, cur: () => { const b = bestJobPos(); return b ? b.r : 0; },
    get text() { const b = bestJobPos(); return `Дослужись до 3-й должности (сейчас: ${b ? `«${posName(b.j.id, b.r)}» — ${b.j.name}` : 'нет работы'})`; } };
}

const QUESTS = [
  { id: 'start', who: '🧔', name: 'Михалыч', title: 'Первые бутылки', text: 'Ну что, Валера, будем выживать? На лавке не разжиреешь. Собери бутылки и сдай их Шнырю в обменник.',
    goals: [qc('taps', 50, 'Натапай 50 раз'), qc('sold', 30, 'Обменяй 30 бутылок')], reward: { money: 30, xp: 20 } },
  { id: 'basics', who: '🧔', name: 'Михалыч', title: 'Поесть и поспать', text: 'Голодный и сонный — ты не работник. Поешь чего-нибудь и вздремни, пока я покараулю.',
    goals: [qc('eat', 1, 'Поешь'), qc('sleep', 1, 'Поспи')], reward: { money: 40, xp: 25 } },
  { id: 'trash', who: '🦊', name: 'Шнырь', title: 'Золотое дно', text: 'Мусорки — это бизнес, Валера. Пороешься — найдёшь хлам. А хлам я куплю. Недорого.',
    goals: [qc('trash', 2, 'Покопайся в мусорке'), qc('marketSold', 1, 'Продай вещь на рынке Шныря')], reward: { money: 60, caps: 1, xp: 30 } },
  { id: 'box', who: '🧔', name: 'Михалыч', title: 'Свой угол', text: 'На лавке простудишься. Купи коробку — первая недвижимость! И присмотрись к улице: тут всякое бывает.',
    goals: [qv(() => S.ownedHousing || 0, 1, 'Купи коробку'), qc('events', 3, 'Переживи 3 уличных события')], reward: { money: 80, xp: 40 } },
  { id: 'gym', who: '🏋️', name: 'Тренер Палыч', title: 'Тело — храм', text: 'Хилый ты какой-то. Иди на турник, позанимайся. Сила на улице — первое дело.',
    goals: [qc('gym', 3, 'Сделай 3 тренировки'), qv(() => Math.floor(S.form), 5, 'Набери 5 формы')], reward: { money: 100, xp: 50, buff: ['pumped', 5] } },
  { id: 'school', who: '🧔', name: 'Михалыч', title: 'Без бумажки ты букашка', text: 'Хочешь нормальную работу — нужна корочка и чистая рубашка. Иди в вечернюю школу.',
    goals: [qv(() => Math.min(S.edu, 1), 1, 'Получи аттестат: окончи занятия и сдай экзамен вечерней школы'),
      qv(() => Math.min(tierOf('body'), 1), 1, 'Надень одежду класса «Базовая» или выше'),
      qv(() => Math.min(tierOf('shoes'), 1), 1, 'Надень обувь класса «Базовая» или выше')], reward: { money: 200, caps: 1, xp: 80 } },
  { id: 'job', who: '👔', name: 'Бригадир', title: 'Первая работа', text: 'Листовки сами себя не раздадут. Отработай пару смен — посмотрим, на что ты годен.',
    goals: [qc('shift', 3, 'Отработай 3 смены')], reward: { money: 300, xp: 100 } },
  { id: 'fight', who: '🦊', name: 'Шнырь', title: 'Постоять за себя', text: 'На районе уважают силу. Набей пару морд в дворовых драках — и тебя запомнят.',
    goals: [qc('fightWin', 2, 'Выиграй 2 драки')], reward: { money: 300, xp: 100 } },
  { id: 'choice', who: '⚖️', name: 'Перекрёсток', title: 'Какой дорогой пойдёшь?', text: 'Шнырь зовёт в «серьёзные дела»: драки, перепродажа, лёгкие деньги. Михалыч советует честный труд: работа, учёба, карьера. Выбор повлияет на всю историю.',
    choice: true, goals: [] },
  // --- Честный путь ---
  { id: 'h_rank', path: 'honest', who: '🧔', name: 'Михалыч', title: 'Уважаемый человек', text: 'Правильно, Валера. Работай честно — и люди потянутся. Покажи себя на работе и обзаведись шалашом.',
    goals: [qv(() => Math.max(...JOBS.map((j) => jobRank(j.id))), 1, 'Получи первое повышение на работе'), qv(() => S.ownedHousing || 0, 2, 'Купи шалаш')], reward: { money: 600, caps: 1, xp: 150 } },
  { id: 'h_shelter', path: 'honest', who: '🥣', name: 'Тётя Валя из ночлежки', title: 'Тёплый суп', text: 'Валерочка, ты же сам с лавки поднялся. Помоги ночлежке: поработай с нами и подкорми ребят. Добро возвращается.',
    goals: [qc('stateShift', 5, 'Отработай 5 смен на госслужбе (дворник, почта…)'), qc('eat', 5, 'Пообедай 5 раз — повариха проверит'), qc('leisureGame', 1, 'Сходи с ребятами на рыбалку или шашлыки')], reward: { money: 1500, caps: 2, xp: 250, buff: ['inlove', 10] } },
  // --- Тёмная дорожка ---
  { id: 'd_deals', path: 'dark', who: '🦊', name: 'Шнырь', title: 'Дела Шныря', text: 'Вот это я понимаю! Тащи мне товар и разберись с конкурентами.',
    goals: [qc('marketSold', 15, 'Продай Шнырю 15 вещей'), qc('fightWin', 5, 'Выиграй 5 драк')], reward: { money: 800, caps: 1, xp: 150 } },
  { id: 'd_crew', path: 'dark', who: '🦊', name: 'Шнырь', title: 'Своя бригада', text: 'Одному на районе не выжить, Валера. Кривой и Гоша Лом готовы работать с нами — но им надо показать, что ты не фраер. Подкачайся, набей пару морд и покажи, что у тебя водятся деньги.',
    goals: [qv(() => Math.floor(S.strength), 20, 'Сила 20+'), qc('fightWin', 5, 'Выиграй ещё 5 драк'), qv(() => S.money, 5000, 'Держи в кармане 5 000 ₽')], reward: { money: 2000, caps: 2, xp: 250 } },
  { id: 'edik1', who: '🕵️', name: 'Слухи', title: 'Эдик на рынке', text: 'Говорят, Эдик — тот самый, что тебя кинул, — крутится на рынке. Нужно подняться повыше, чтобы до него добраться.',
    goals: [qv(() => level(), 8, 'Достигни 8 уровня'), qv(() => S.ownedHousing || 0, 3, 'Купи гараж')], reward: { money: 2000, caps: 2, xp: 250 } },
  { id: 'h_college', path: 'honest', who: '👩‍🏫', name: 'Завуч', title: 'Учиться, учиться и учиться', text: 'Эдика честно не победить без образования. Получи диплом ПТУ и наработай опыт.',
    goals: [qv(() => S.edu, 2, 'Окончи ПТУ'), qc('shift', 15, 'Отработай 15 смен')], reward: { money: 3000, caps: 2, xp: 300 } },
  { id: 'd_racket', path: 'dark', who: '🥩', name: 'Бугай с рынка', title: 'Крыша для ларька', text: 'Эдик держит рынок через Бугая — двухметрового громилу. Шнырь говорит: «Уложишь Бугая — рынок наш, и Эдик занервничает». Готовься, бить он умеет.',
    goals: [qv(() => level(), 9, 'Достигни 9 уровня'), qv(() => Math.floor(S.strength), 25, 'Сила 25+')],
    boss: { name: 'Бугай с рынка', style: 'brawler', eq: { hat: 'kepka', body: 'pukhovik', shoes: 'boots' }, lvl: 0, form: 35, strength: 45, tier: 3, intro: '«Чё, бомжара, рынок захотел?»' },
    reward: { money: 5000, caps: 2, xp: 350 } },
  { id: 'd_league', path: 'dark', who: '🥊', name: 'Промоутер', title: 'Районная лига', text: 'Шнырь замолвил за тебя словечко. Пробейся в районную лигу — там крутятся люди Эдика.',
    goals: [qv(() => (S.fight ? S.fight.rating : 1000), 1200, 'Рейтинг драк 1200+'), qv(() => (S.fight ? S.fight.best : 0), 3, 'Серия из 3 побед')], reward: { money: 3500, caps: 2, xp: 300 } },
  { id: 'barsik', who: '🧔', name: 'Михалыч', title: 'Где Барсик?', text: 'Валера! Видел у Эдикова дома рыжего кота. Не твой ли Барсик? Поищи зацепки по району.',
    goals: [qc('trash', 5, 'Обыщи 5 мусорок'), qc('events', 10, 'Расспроси улицу (10 событий)')], reward: { money: 1000, xp: 200, pet: 'cat' } },
  { id: 'd_casino', path: 'dark', who: '🎰', name: 'Крупье Лёша', title: 'Ночь в «Золотой крышке»', text: 'Люди Эдика каждую ночь проигрывают в казино его деньги. Втерись к ним в доверие за игровым столом — и узнаешь, где он прячет документы на твою квартиру.',
    goals: [qc('casino', 15, 'Сыграй в казино 15 раз'), qc('bjWin', 3, 'Выиграй 3 раздачи в блекджек'), qv(() => (S.fight ? S.fight.rating : 1000), 1300, 'Рейтинг драк 1300+ (чтобы уважали)')], reward: { money: 8000, caps: 2, xp: 400 } },
  { id: 'biz', who: '💼', name: 'Бизнес-тренер', title: 'Своё дело', text: 'Хватит работать на дядю. Открой бизнес и обзаведись колёсами.',
    goals: [qv(() => Object.keys(S.biz).length, 1, 'Открой бизнес'), qv(() => S.transport, 1, 'Купи транспорт')], reward: { money: 5000, caps: 2, xp: 400 } },
  { id: 'love', who: '💘', name: 'Сердце Валеры', title: 'Не хлебом единым', text: 'Деньги есть, крыша над головой есть, а приходишь домой — и поговорить не с кем. Может, пора кого-то встретить?',
    goals: [qc('date', 3, 'Сходи на 3 свидания'), qv(() => (S.girlfriend ? 1 : 0), 1, 'Найди девушку')], reward: { money: 3000, caps: 2, xp: 300, buff: ['inlove', 15] } },
  { id: 'h_career', path: 'honest', who: '🏢', name: 'HR-менеджер', title: 'Карьера', text: 'Мы видим ваш потенциал, Валерий. Нам нужен человек с дипломом колледжа, опытом и хорошей должностью — тогда место в офисе ваше.',
    help: 'Колледж — в «Жизнь → Учёба». Смены — в «Жизнь → Работа», подойдёт любая работа. Должность растёт так: наработай смены → в карточке работы появится «Аттестация» → сдай её (или дай «конверт»). Нужна 3-я должность на любой одной работе.',
    goals: [qv(() => S.edu, 3, 'Окончи колледж'), qc('shift', 8, 'Отработай 8 смен на любой работе'), careerGoal()], reward: { money: 15000, caps: 2, xp: 600 } },
  { id: 'h_court', path: 'honest', who: '⚖️', name: 'Адвокат Розенберг', title: 'Суд против Эдика', text: 'Валерий, у нас есть шанс отсудить квартиру по закону. Но нужен диплом, чтобы судья воспринял всерьёз, и деньги на экспертизу подписи. Эдик будет давить — держитесь.',
    goals: [qv(() => S.edu, 4, 'Окончи университет'), qv(() => S.money, 50000, 'Собери 50 000 ₽ на экспертизу'), qc('promotion', 1, 'Получи ещё одно повышение')], reward: { money: 20000, caps: 2, xp: 700 } },
  { id: 'd_ring', path: 'dark', who: '💎', name: 'Хозяин ринга', title: 'Подпольный ринг', text: 'Говорят, ты резкий. На моём ринге бьются за большие деньги. Докажи, что достоин.',
    goals: [qv(() => (S.fight ? S.fight.rating : 1000), 1500, 'Рейтинг драк 1500+'), qc('fightWin', 30, 'Выиграй 30 драк')], reward: { money: 18000, caps: 2, xp: 600 } },
  { id: 'd_betrayal', path: 'dark', who: '🐀', name: 'Шнырь', title: 'Крыса в бригаде', text: 'Кривой шепнул: Шнырь всё это время сливал тебя Эдику. За каждую твою драку Эдик платил ему процент. Шнырь ждёт тебя у гаражей — «поговорить». Разговор будет коротким.',
    goals: [qv(() => level(), 14, 'Достигни 14 уровня'), qv(() => Math.floor(S.form), 30, 'Форма 30+')],
    boss: { name: 'Шнырь «Крыса»', style: 'coward', eq: { hat: 'kepka', body: 'rvan', shoes: 'kedy' }, lvl: 1, form: 45, strength: 50, tier: 3, intro: '«Валерка, это бизнес, ничего личного!»' },
    reward: { money: 15000, caps: 2, xp: 700 } },
  { id: 'edik2', who: '🕵️', name: 'Детектив', title: 'Логово Эдика', text: 'Эдик живёт в элитном районе. Туда пускают только своих — нужна квартира и уровень.',
    goals: [qv(() => level(), 15, 'Достигни 15 уровня'), qv(() => S.ownedHousing || 0, 5, 'Купи квартиру')], reward: { money: 30000, caps: 2, xp: 800 } },
  { id: 'd_heist', path: 'dark', who: '🔦', name: 'Кривой', title: 'Склад Эдика', text: 'Шныря больше нет, бригада теперь твоя. Кривой знает, где склад Эдика: там его «чёрная касса». Ночью пройдём через мусорки и гаражи — и оставим Эдика без денег перед разборкой.',
    goals: [qc('trash', 8, 'Разведай подходы: 8 мусорок'), qc('marketSold', 10, 'Сбыть добычу Кривому: 10 вещей'), qv(() => S.transport, 6, 'Нужна машина для вывоза («Жигули»+)')], reward: { money: 40000, caps: 3, xp: 900 } },
  { id: 'final', who: '😈', name: 'Эдик «Риелтор»', title: 'Финальная разборка', text: '«А, Валера… Не думал, что ты выберешься со дна. Квартиру не верну. Разве что… отберёшь силой».',
    boss: true, goals: [qv(() => level(), 18, 'Достигни 18 уровня')], reward: { money: 100000, caps: 8, xp: 2000 } },
  // --- После Эдика: новая жизнь ---
  { id: 'family', who: '💒', name: 'Михалыч', title: 'Семейное счастье', text: 'Квартиру вернул, Барсика вернул. Валера, а жениться когда? Не век же одному в особняке куковать.',
    goals: [qv(() => (S.married ? 1 : 0), 1, 'Сыграй свадьбу'), qv(() => S.ownedHousing || 0, 6, 'Купи особняк')], reward: { money: 150000, caps: 6, xp: 2500 } },
  { id: 'legend', who: '👑', name: 'Весь район', title: 'Легенда района', text: 'О тебе рассказывают на каждой лавке: бомж, который вернул всё. Осталось стать лучшим в деле — и пройти путь заново, уже легендой.',
    goals: [qc('promotion', 3, 'Получи ещё 3 повышения'), qv(() => S.onlineWins || 0, 3, 'Победи 3 живых игроков онлайн'), qv(() => (S.prestige || 0), 1, 'Начни новый круг (престиж)')], reward: { money: 300000, caps: 12, xp: 4000 } },
];

// Порядок глав до обновления — чтобы старые сохранения продолжили с той же главы
const QUESTS_V1 = ['start', 'basics', 'trash', 'box', 'gym', 'school', 'job', 'fight', 'choice', 'h_rank', 'd_deals', 'edik1', 'h_college', 'd_league', 'barsik', 'biz', 'h_career', 'd_ring', 'edik2', 'final'];

// Крышки — донатная валюта: за главы сюжета их стало примерно втрое меньше
QUESTS.forEach((q) => { if (q.reward && q.reward.caps) q.reward.caps = Math.max(1, Math.round(q.reward.caps * 0.35)); });

function questList() { return QUESTS.filter((q) => !q.path || q.path === S.quest.path); }
function currentQuest() { return questList()[S.quest.idx] || null; }
function goalsDone(q) { return q.goals.every((g) => g.cur() >= g.need); }

HOOKS.load.push(() => {
  if (!S.quest) S.quest = { idx: 0, path: null, base: { ...(S.counters || {}) }, bossCd: 0, v2: true };
  if (!S.quest.v2) {
    // В старом списке глава под номером idx — находим её в новом списке по id
    const old = QUESTS_V1.filter((id) => { const q = QUESTS.find((x) => x.id === id); return !q.path || q.path === S.quest.path; });
    const id = old[S.quest.idx];
    const list = QUESTS.filter((q) => !q.path || q.path === S.quest.path);
    S.quest.idx = id ? list.findIndex((q) => q.id === id) : list.findIndex((q) => q.id === 'family');
    S.quest.v2 = true;
  }
  if (!S.tut && S.storySeen && S.stats.taps > 50) S.tut = { done: true }; // старым игрокам обучение не навязываем
});
TABS.tasks = 'story';

// Бонусы выбранного пути
HOOKS.mods.push((m) => { if (S.quest && S.quest.path === 'honest') m.work *= 1.1; });
const _fightReward = fightReward;
fightReward = (op) => Math.round(_fightReward(op) * (S.quest && S.quest.path === 'dark' ? 1.2 : 1));
const _itemPrice = itemPrice;
itemPrice = (id, t) => Math.round(_itemPrice(id, t) * (S.quest && S.quest.path === 'dark' ? 1.15 : 1));

function questGoalsHTML(q) {
  return q.goals.map((g, i) => {
    const cur = Math.min(g.need, Math.max(0, g.cur()));
    const go = cur < g.need && typeof goalTarget === 'function' && goalTarget(g);
    return `<div class="goal ${cur >= g.need ? 'ok' : ''} ${go ? 'go' : ''}" ${go ? `data-act="goGoal" data-id="${i}"` : ''}><span>${cur >= g.need ? '✅' : '▫️'} ${g.text}${go ? ' <i class="go-arrow">➜</i>' : ''}</span><b>${fmt(cur)}/${fmt(g.need)}</b>
      <div class="progress"><div style="width:${(cur / g.need) * 100}%"></div></div></div>`;
  }).join('');
}
function rewardHTML(r) {
  return [r.money ? `${fmt(r.money)} ₽` : '', r.caps ? `${r.caps} кр.` : '', r.xp ? `${r.xp} XP` : '', r.pet ? '🐈 Кот Барсик!' : '', r.buff ? `${EFFECTS[r.buff[0]].emoji} ${EFFECTS[r.buff[0]].name}` : ''].filter(Boolean).join(' · ');
}

EXTRA_TABS.tasks.story = () => {
  const q = currentQuest();
  const list = questList();
  const pathTag = S.quest.path ? `<span class="rarity ${S.quest.path === 'honest' ? 'common' : 'bad'}">${S.quest.path === 'honest' ? '😇 Честный путь · работа +10%' : '😈 Тёмная дорожка · драки +20%, рынок +15%'}</span>` : '';
  let html = `<div class="info-card">Глава ${Math.min(S.quest.idx + 1, list.length)} из ${list.length}. ${pathTag}</div>`;
  if (!q) {
    html += `<div class="quest-card"><div class="q-who">🏆</div><h3>История Валеры окончена</h3><p>Эдик повержен, Барсик дома. Хочешь пройти историю другим путём? Начни новый круг в «Престиже».</p></div>`;
  } else if (q.choice) {
    html += `<div class="quest-card"><div class="q-who">${q.who}</div><div class="q-name">${q.name}</div><h3>${q.title}</h3><p>${q.text}</p>
      <div class="btns"><button class="btn green wide" data-act="questPath" data-id="honest">😇 Честный путь (Михалыч)<small>Работа +10% навсегда</small></button>
      <button class="btn wide dark-path" data-act="questPath" data-id="dark">😈 Тёмная дорожка (Шнырь)<small>Драки +20%, рынок +15%</small></button></div></div>`;
  } else {
    const done = goalsDone(q);
    const bossReady = q.boss && done;
    html += `<div class="quest-card"><div class="q-who">${q.who}</div><div class="q-name">${q.name}</div><h3>${q.title}</h3><p>«${q.text}»</p>
      <div class="goals">${questGoalsHTML(q)}</div>
      ${q.help && !done ? `<div class="q-help">💡 ${q.help}</div>` : ''}
      <div class="q-reward">🎁 ${rewardHTML(q.reward)}</div>
      ${bossReady ? `<button class="btn primary wide" data-act="bossFight" ${cdLeft('boss') > 0 ? 'disabled' : ''}>👊 Драться: ${q.boss.name || 'Эдик'}${cdLeft('boss') > 0 ? ` (<span data-until="${S.cd.boss}"></span>)` : ''}</button>`
        : `<button class="btn ${done ? 'primary' : ''} wide" data-act="questDone" ${done && !q.boss ? '' : 'disabled'}>${done ? 'Получить награду' : 'Выполняется…'}</button>`}</div>`;
  }
  const past = list.slice(0, S.quest.idx).reverse();
  if (typeof cutGalleryCount === 'function' && cutGalleryCount()) html += `<button class="btn wide" data-act="cutGallery">🎬 Пересмотреть мультики (${cutGalleryCount()})</button>`;
  if (past.length) html += `<div class="subhead">Пройдено</div>` + past.map((x) => {
    const cut = typeof cutForQuest === 'function' ? cutForQuest(x.id) : null;
    return `<div class="card done-q"><div class="thumb">${x.who}</div><div class="card-body"><div class="card-title">✅ ${x.title}</div><div class="card-desc">${x.name}</div></div>${cut ? `<button class="btn small" data-act="cutReplay" data-id="${cut}">🎬</button>` : ''}</div>`;
  }).join('');
  return html;
};

function completeQuest(q) {
  const r = q.reward || {};
  if (r.money) addMoney(r.money);
  if (r.caps) addCaps(r.caps);
  if (r.xp) addXp(r.xp);
  if (r.buff) addEffect(r.buff[0], r.buff[1]);
  if (r.pet && !S.pets.includes(r.pet)) { S.pets.push(r.pet); S.pet = r.pet; S.petFood = 100; S.petFedAt = Date.now(); }
  S.quest.idx++;
  S.quest.base = { ...(S.counters || {}) };
  track('questDone');
  sfx('quest');
  confetti(60);
  const next = currentQuest();
  resultModal({ emoji: q.reward && q.reward.pet ? '🐈' : '📖', title: `Глава пройдена: ${q.title}`,
    text: `Награда: ${rewardHTML(r)}${next ? `<br><br>Следующая глава: <b>${next.title}</b>` : ''}`, btn: 'Дальше' });
}

Object.assign(ACTIONS, {
  questDone: () => { const q = currentQuest(); if (q && !q.choice && !q.boss && goalsDone(q)) completeQuest(q); },
  questPath: (id) => {
    const q = currentQuest();
    if (!q || !q.choice) return;
    S.quest.path = id;
    S.quest.idx++;
    S.quest.base = { ...(S.counters || {}) };
    track('questDone');
    sfx('quest');
    resultModal({ emoji: id === 'honest' ? '😇' : '😈', title: id === 'honest' ? 'Честный путь' : 'Тёмная дорожка',
      text: id === 'honest' ? 'Михалыч доволен: «Правильно, Валера. Честный рубль — он теплее». Работа теперь платит на 10% больше.' : 'Шнырь потирает руки: «Вот это разговор!» Драки приносят на 20% больше, а на рынке тебе платят на 15% больше.', btn: 'Вперёд' });
  },
  openQuest: () => showScreen('tasks', 'story'),
  bossFight: () => {
    const q = currentQuest();
    if (!q || !q.boss || cdLeft('boss') > 0) return;
    if (S.health < 50) { toast('Перед боссом подлечись: нужно здоровье 50+', 'bad'); return; }
    // boss: true — финальный Эдик; объект — босс главы (Бугай, Шнырь…)
    const b = q.boss === true
      ? { name: 'Эдик «Риелтор»', style: 'tactic', eq: { hat: 'cilinder', body: 'kostum', shoes: 'boots' }, level: Math.max(20, level() + 2), form: 70, strength: 65, tier: 6, intro: '«Ну давай, бомжара, покажи, чему научился»' }
      : { ...q.boss, level: level() + (q.boss.lvl || 0) };
    startFight({ ...b, rating: 1500 + b.level * 20 }, {
      intro: b.intro,
      onEnd: (won) => {
        if (won) { completeQuest(q); track('bossWin'); }
        else { setCd('boss', 300); resultModal({ emoji: '😈', rays: 'bad', title: `${b.name} победил`, text: 'Подкачай силу и форму в зале и приходи через 5 минут.', btn: 'Я вернусь' }); sfx('lose'); }
        save();
      },
    });
  },
});

// Значок текущей главы на главном экране
HOOKS.hud.push(() => {
  const pin = $('questPin');
  const q = currentQuest();
  if (!q || !S.storySeen) { pin.classList.add('hidden'); return; }
  const done = q.choice || goalsDone(q);
  const prog = q.goals.length ? q.goals.reduce((a, g) => a + Math.min(1, Math.max(0, g.cur()) / g.need), 0) / q.goals.length : 1;
  const html = `<span>${q.who}</span><div><b>${q.title}</b><i><i style="width:${prog * 100}%"></i></i></div>${done ? '<em>!</em>' : ''}`;
  if (pin.dataset.html !== html) { pin.innerHTML = html; pin.dataset.html = html; }
  pin.classList.remove('hidden');
  pin.classList.toggle('ready', done);
  if (done) $('tasksDot').classList.remove('hidden');
});

// Счётчики, которых не было в game.js
HOOKS.init.push(() => {
  const _eat = eat;
  eat = (id) => { const before = S.money, bottles = S.bottles; _eat(id); if (S.money < before || S.bottles < bottles) track('eat'); };
  const _startSleep = startSleep;
  startSleep = () => { _startSleep(); if (S.busy && S.busy.type === 'sleep') track('sleep'); };
  const _useMed = useMed;
  useMed = (id) => { const n = activeEffects().length; _useMed(id); if (activeEffects().length < n) track('cured'); };
  const _hospital = hospital;
  hospital = () => { track('hospital'); _hospital(); };
  const _goDate = goDate;
  goDate = (arg) => { const before = S.money; const cdBefore = cdLeft('date'); _goDate(arg); if (cdLeft('date') > cdBefore || S.money < before) track('date'); };
  $('sleepBtn').onclick = () => { startSleep(); updateHud(); save(); };
});

// =====================================================================
// Обучение — подсвечивает элементы по шагам, можно пропустить
// =====================================================================

const TUT = [
  { sel: '#valera', text: 'Тапай по Валере — так собираются бутылки. Сделай 10 тапов!', done: () => counter('taps') - (S.tut.base || 0) >= 10 },
  { sel: '#exchangeBtn', text: 'Бутылки меняют на рубли в обменнике. Открой его.', done: () => !!$('exBody') },
  { sel: '[data-act="exchange"][data-id="1"]', text: 'Нажми «Всё», чтобы обменять бутылки на рубли.', done: () => counter('sold') > 0 || !$('exBody') },
  { sel: '.bars', text: 'Это шкалы: ⚡ энергия, 🍞 сытость, ❤️ здоровье, 😊 радость. Если какая-то упадёт до нуля — будут проблемы.', btn: 'Понятно' },
  { sel: '#sleepBtn', text: 'Энергия тратится на тапы и работу. Кончилась — ложись спать: во сне она восстанавливается в 10 раз быстрее.', btn: 'Понятно' },
  { sel: '#trashBtn', text: 'Раз в 5 минут можно порыться в мусорке. Там бывает и хорошее, и плохое!', btn: 'Понятно' },
  { sel: '#questPin', text: 'Это сюжет. Выполняй главы — получишь награды и узнаешь, куда делся Эдик.', btn: 'Понятно' },
  { sel: '#tabbar', text: 'Внизу магазин, работа и учёба («Жизнь»), казино и драки («Досуг»), задания и достижения.', btn: 'Понятно' },
  { sel: '#settingsBtn', text: 'Звук, музыка, вибрация и журнал событий — в настройках. Удачи, Валера!', btn: 'Начать игру' },
];

function tutOffer() {
  S.tut = { offered: true, step: -1, done: false };
  openModal(`<div class="big-art" style="height:110px"><div class="big-emoji" style="line-height:110px">🎓</div></div>
    <h3>Пройти обучение?</h3><p>Михалыч за минуту покажет, что тут к чему. Можно пропустить и разобраться самому.</p>
    <div class="btns"><button class="btn primary wide" data-act="tutStart">Давай!</button><button class="btn wide" data-act="tutSkip">Пропустить</button></div>`, { center: true, locked: true });
}

function tutRender() {
  let spot = $('tutSpot'), bub = $('tutBubble');
  const t = S.tut;
  if (!t || t.done || t.step < 0 || t.step >= TUT.length) { if (spot) spot.remove(); if (bub) bub.remove(); return; }
  const step = TUT[t.step];
  const el = document.querySelector(step.sel);
  if (!spot) {
    spot = document.createElement('div'); spot.id = 'tutSpot'; spot.className = 'tut-spot'; document.body.appendChild(spot);
    bub = document.createElement('div'); bub.id = 'tutBubble'; bub.className = 'tut-bubble'; document.body.appendChild(bub);
  }
  if (!el || !el.offsetParent) { spot.style.opacity = 0; bub.style.opacity = 0; return; }
  const r = el.getBoundingClientRect();
  spot.style.opacity = 1; bub.style.opacity = 1;
  Object.assign(spot.style, { left: r.left - 6 + 'px', top: r.top - 6 + 'px', width: r.width + 12 + 'px', height: r.height + 12 + 'px' });
  const html = `<div class="tut-who">🧔 Михалыч · ${t.step + 1}/${TUT.length}</div><div>${step.text}</div>
    <div class="tut-btns">${step.btn ? `<button class="btn primary small" data-act="tutNext">${step.btn}</button>` : ''}<button class="btn small" data-act="tutSkip">Пропустить обучение</button></div>`;
  if (bub.dataset.step !== String(t.step)) { bub.innerHTML = html; bub.dataset.step = t.step; }
  const below = r.bottom + 170 < window.innerHeight;
  bub.style.top = (below ? r.bottom + 14 : Math.max(10, r.top - bub.offsetHeight - 14)) + 'px';
}

HOOKS.tick.push(() => {
  if (!S.storySeen) return;
  if (!S.tut && !modalOpen()) { tutOffer(); return; }
  const t = S.tut;
  if (!t || t.done || t.step < 0) { tutRender(); return; }
  const step = TUT[t.step];
  if (step && step.done && step.done()) { t.step++; sfx('notify'); if (t.step >= TUT.length) tutFinish(); }
  tutRender();
});

function tutFinish() {
  S.tut.done = true;
  tutRender();
  sfx('quest');
}

Object.assign(ACTIONS, {
  tutStart: () => { closeModal(); S.tut = { step: 0, done: false, base: counter('taps') }; showScreen('game'); },
  tutSkip: () => { closeModal(); S.tut = { step: 99, done: true }; tutRender(); toast('Обучение можно пройти позже в настройках ⚙️'); },
  tutNext: () => { if (!S.tut) return; S.tut.step++; if (S.tut.step >= TUT.length) tutFinish(); tutRender(); },
  restartTut: () => { closeModal(); showScreen('game'); S.tut = { step: 0, done: false, base: counter('taps') }; tutRender(); },
});
