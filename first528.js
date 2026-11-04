// 5.28. Первые 10 минут и возвращение на следующий день.
// Новые сохранения получают S.fs528: сцена «Подпись», джип с пакетом, короткий первый сон, мягкое открытие разделов
// и цепочку «Телефон Эдика». Старые сохранения продолжают с той же главы: порядок глав переносится по id.

const FS528_DAY = 86400000;
function fs528Age() { return S.fs528 ? Date.now() - (S.fs528.at || 0) : Infinity; }
function fs528First() { return !!S.fs528 && fs528Age() < 20 * 3600000; }

// ---------- Сцены ----------
actorHTML = (function (orig) {
  return function (ac, i) {
    if (ac.a !== 'valera_rich') return orig(ac, i);
    const eq = S.eq;
    S.eq = { hat: 'none', body: 'kostum', shoes: 'boots' };
    try { return orig({ ...ac, a: 'valera' }, i); } finally { S.eq = eq; }
  };
})(actorHTML);
cutNext = (function (orig) {
  return function () {
    orig();
    const f = CUT && CUT.frames[CUT.i];
    if (f && f.btn && $('csNext')) $('csNext').textContent = f.btn;
  };
})(cutNext);

Object.assign(CUTS, {
  intro_sign: [
    { bg: 5, actors: [{ a: 'valera_rich', x: 34, mood: 'happy', anim: 'bounce', say: 'Живём, Барсик!' }, { a: 'barsik', x: 68, anim: 'jump', say: 'Мрр' }], text: 'Валера, 38 лет. Менеджер. Квартира, машина, кот Барсик. Жизнь удалась.' },
    { bg: 5, actors: [{ a: 'valera_rich', x: 28, mood: 'ok' }, { a: 'edik', x: 70, anim: 'in-right', say: 'Валерчик! Одна подпись — и ты в шоколаде' }], text: 'Старый друг Эдик. Риелтор. Честные глаза, чужие деньги.' },
    { bg: 5, cam: 'zoom', btn: '✍️ Подписать', actors: [{ a: 'valera_rich', x: 28, mood: 'ok' }, { a: 'edik', x: 70, mood: 'happy', say: 'Не читай, глаза испортишь' }], props: [{ e: '📄', x: 48, y: 52, anim: 'float' }], text: 'Договор о выгодном вложении. Всего одна подпись.' },
    { bg: 'red', cam: 'shake', actors: [{ a: 'edik', x: 42, mood: 'happy', anim: 'bounce', say: 'Приятно иметь с тобой дело' }, { a: 'barsik', x: 70 }], fx: '📄', text: 'Через неделю пришли приставы. Договор дарения: квартира, машина и, пункт 14, кот.' },
    { bg: 0, night: true, actors: [{ a: 'valera', x: 34, mood: 'sad', say: 'Барсик…' }, { a: 'mihalych', x: 70, anim: 'in-right', say: 'Новенький? Место занято. Шучу, садись' }], fx: '❄️', text: 'Парк. Лавка. Одна пустая бутылка.' },
  ],
  jeep528: [
    { bg: 0, actors: [{ a: 'valera', x: 28 }, { a: '🚙', x: 66, anim: 'drive' }], fx: '💧', text: 'Из окна джипа вылетел пакет.' },
    { bg: 0, cam: 'shake', actors: [{ a: 'valera', x: 28, mood: 'sad', anim: 'shake', say: 'Эдик?!' }, { a: 'edik', x: 70, mood: 'happy', say: 'Лови, бомжара, на опохмел!' }], text: 'Он даже не узнал.' },
    { bg: 0, actors: [{ a: 'valera', x: 30, mood: 'ok' }, { a: 'mihalych', x: 68, anim: 'in-right', say: 'Унижение унижением, а тара — это тара' }], props: [{ e: '🍾', x: 48, y: 70, anim: 'float' }], text: '+50 бутылок.' },
    { bg: 0, cam: 'zoom', actors: [{ a: 'valera', x: 42, mood: 'sad', say: 'Это же… Барсик?' }], props: [{ e: '📱', x: 64, y: 44, anim: 'float' }], text: 'В пакете чей-то телефон. Экран в трещинах. На заставке мелькнул рыжий кот, и всё погасло.' },
    { bg: 0, actors: [{ a: 'mihalych', x: 56, say: 'Племянник чинит такое. К завтрему будет' }, { a: 'valera', x: 26, mood: 'ok' }], text: 'Михалыч забрал телефон и спрятал под ушанку.' },
  ],
  phone528_1: [
    { bg: 0, actors: [{ a: 'mihalych', x: 66, say: 'Живой? Всю ночь тебя от голубей отгонял' }, { a: 'valera', x: 28, mood: 'ok' }], text: 'Утро в парке. Злые люди ничего не взяли. Чудо.' },
    { bg: 0, actors: [{ a: 'mihalych', x: 66, mood: 'happy', say: 'Денег не взял, взял пельмени. Ты должен пельмени' }, { a: 'valera', x: 28 }], props: [{ e: '📱', x: 48, y: 46, anim: 'float' }], text: 'Племянник оживил телефон.' },
    { bg: 0, cam: 'zoom', actors: [{ a: 'valera', x: 30, mood: 'sad', say: 'Барсик… Толстый стал' }, { a: 'barsik', x: 68, anim: 'bounce' }], text: 'На экране фото: рыжий кот на белом диване. На Валерином диване.' },
    { bg: 0, actors: [{ a: 'valera', x: 28, mood: 'ok', say: 'Кто это?' }, { a: 'mihalych', x: 68, say: 'Лис у нас в парке один. Но ты пока никому не говори' }], props: [{ e: '🦊', x: 48, y: 42, anim: 'float' }], text: 'Переписка, контакт с лисой на аватарке: «С тебя процент. На рынке, как договаривались».' },
  ],
  phone528_2: [
    { bg: 0, actors: [{ a: 'mihalych', x: 66, say: 'Опять пищит. Голосовое пришло' }, { a: 'valera', x: 28 }], props: [{ e: '📱', x: 48, y: 46, anim: 'float' }], text: 'Телефон Эдика ожил к вечеру.' },
    { bg: 0, cam: 'zoom', actors: [{ a: 'edik', x: 62, mood: 'happy', say: '…кота с рук не кормить, кусается. Весь в бывшего хозяина' }, { a: 'valera', x: 26, mood: 'ok', anim: 'shake' }], text: 'Голос Эдика из треснувшего динамика.' },
    { bg: 0, actors: [{ a: 'valera', x: 30, mood: 'ok', say: 'Значит, кусается. Молодец' }, { a: 'barsik', x: 70, anim: 'jump', say: 'Мрр' }], text: 'Впервые за долгое время Валера улыбнулся.' },
  ],
  phone528_3: [
    { bg: 0, actors: [{ a: 'mihalych', x: 66, say: 'Тут бумага какая-то. Скан' }, { a: 'valera', x: 28 }], props: [{ e: '📄', x: 48, y: 46, anim: 'float' }], text: 'В телефоне нашёлся скан договора. Вторая страница, которую Валера никогда не видел.' },
    { bg: 'red', cam: 'zoom', actors: [{ a: 'valera', x: 32, mood: 'sad', anim: 'shake', say: 'Это я подписывал?' }, { a: 'mihalych', x: 68, mood: 'sad', say: 'Валера так хвостик у «В» не пишет' }], text: 'Подпись вроде твоя. А почерк нет.' },
    { bg: 0, actors: [{ a: 'valera', x: 50, mood: 'ok', anim: 'bounce', say: 'Значит, вторую страницу подделали' }], text: 'Теперь ясно: Эдик работал не один. Батарея телефона села окончательно.' },
  ],
});
Object.assign(CUT_TITLES, { intro_sign: '✍️ Одна подпись', jeep528: '🚙 Пакет из джипа', phone528_1: '📱 Телефон ожил', phone528_2: '📱 Голосовое Эдика', phone528_3: '📄 Вторая страница' });

// ---------- Новое сохранение и интро ----------
HOOKS.load.push(() => {
  if (!S.fs528 && !S.storySeen && !(S.stats && S.stats.taps) && !(S.prestige > 0)) {
    S.fs528 = { at: Date.now(), phone: 0 };
    S.starterOffered = true; // окно набора откроется на второй день
  }
  if (S.fs528 && !S.fs528.starter && fs528Age() >= 20 * 3600000) { S.fs528.starter = 1; S.starterOffered = false; }
  // Сцена главы новичку не нужна: он уже увидел завязку в мультике
  if (S.fs528) storySeen().start = storySeen().start || Date.now();
});
showStory = (function (orig) {
  return function (i) {
    if (!S.fs528 || i !== 0 || S.storySeen) return orig(i);
    if (S.settings && S.settings.cuts === false) return orig(i);
    playCutscene('intro_sign', () => { S.storySeen = true; save(); });
  };
})(showStory);

// ---------- Обучение: три действия вместо экзамена ----------
TUT.splice(0, TUT.length,
  { sel: '#valera', text: 'Закон парка, Валера: что лежит, то твоё. Тапай по себе и собирай бутылки!', done: () => counter('taps') - (S.tut.base || 0) >= 10 },
  { sel: '#exchangeBtn', text: 'Тара есть, неси Шнырю. Открой обменник.', done: () => !!$('exBody') },
  { sel: '[data-act="exchange"][data-id="1"]', text: 'Шнырь обдерёт, но по-соседски. Нажми «Всё».', done: () => counter('sold') > 0 || !$('exBody') },
  { sel: '#questPin', text: 'Это план, Валера. Без плана ты просто мужик с бутылкой. Появился «!» — жми на значок, награда твоя.', btn: 'Понятно' },
);
tutOffer = function () { S.tut = { step: 0, done: false, base: counter('taps') }; showScreen('game'); };
tutRender = (function (orig) {
  return function () {
    if (CUT && $('tutSpot')) { $('tutSpot').style.opacity = 0; if ($('tutBubble')) $('tutBubble').style.opacity = 0; return; }
    orig();
  };
})(tutRender);

// Джип: первый яркий момент сразу после десятка тапов
HOOKS.tick.push(() => {
  const f = S.fs528;
  if (!f || f.jeep || !S.storySeen || counter('taps') < 10 || modalOpen() || S.busy || MG) return;
  f.jeep = Date.now();
  f.phoneAt = fs528PhoneAt();
  const give = () => { addBottles(50); updateHud(); save(); toast('🍾 +50 бутылок. Теперь в обменник!', 'good'); };
  if (S.settings && S.settings.cuts === false) give(); else playCutscene('jeep528', give);
});

// Первый сон короткий и безопасный: Михалыч действительно караулит
startSleep = (function (orig) {
  return function () {
    orig();
    const f = S.fs528;
    if (!f || f.nap || !S.busy || S.busy.type !== 'sleep') return;
    f.nap = 1;
    S.busy.nap528 = true;
    S.busy.end = Math.min(S.busy.end, Date.now() + 30000);
    toast('💤 Михалыч караулит. Полминуты, и как новый');
  };
})(startSleep);
finishSleep = (function (orig) {
  return function (progress) {
    if (!S.busy || !S.busy.nap528) return orig(progress);
    const row = HOUSING[S.housing], rob = row.rob, hp = S.health;
    row.rob = 0;
    try { orig(1); } finally { row.rob = rob; S.health = Math.max(S.health, hp); }
  };
})(finishSleep);
trashOutcome = (function (orig) {
  return function (roll) {
    if (S.fs528 && !S.fs528.trash) { S.fs528.trash = 1; return 'budget'; }
    return orig(roll);
  };
})(trashOutcome);

// ---------- Значок главы забирает награду сам ----------
ACTIONS.openQuest = (function (orig) {
  return function () {
    const q = currentQuest();
    if (q && !q.choice && !q.boss && !q.move && !q.frMove && !q.worldMove50 && !q.story30 && goalsDone(q) && !modalOpen()) { ACTIONS.questDone(); return; }
    orig();
  };
})(ACTIONS.openQuest);

// ---------- Порядок глав Засранска ----------
const QUESTS_ORDER_527 = QUESTS.map((q) => q.id);
const ZAS_ORDER_528 = ['start', 'trash', 'box', 'basics', 'wallet', 'gig', 'fight', 'choice', 'gym', 'school', 'job'];
function q528(id) { return QUESTS.find((q) => q.id === id); }
QUESTS.splice(QUESTS.findIndex((q) => q.id === 'gym'), 0,
  { id: 'wallet', city: 'zas', who: '👛', name: 'Михалыч', title: 'Чужой кошелёк', text: 'Под лавкой лежал кошелёк. Внутри 120 ₽ и фото чужих внуков. Реши, что с ним делать.',
    goals: [qc('wallet528', 1, 'Реши судьбу кошелька')], help: 'Нажми «💬 Разговор» в этой главе.', reward: { money: 60, xp: 30 } },
  { id: 'gig', city: 'zas', who: '🦊', name: 'Шнырь', title: 'Шабашка', text: 'Есть разовая халтура, без трудовой и без вопросов. Коробки сами себя не разгрузят.',
    goals: [qc('gig528', 1, 'Сделай шабашку у Шныря')], help: 'Нажми кнопку «🧰 На шабашку» в этой главе.', reward: { money: 150, xp: 60 } });
(function reorder() {
  const moved = ZAS_ORDER_528.map(q528).filter(Boolean);
  const rest = QUESTS.filter((q) => !moved.includes(q));
  const at = QUESTS.findIndex((q) => moved.includes(q));
  QUESTS.splice(0, QUESTS.length, ...rest.slice(0, at), ...moved, ...rest.slice(at));
})();
const startGoal528 = q528('start').goals[0]; startGoal528.need = 10; startGoal528.text = 'Натапай 10 раз';
q528('start').reward.money = 60;
const trash528 = q528('trash'); trash528.goals = [trash528.goals[0]]; trash528.goals[0].need = 1; trash528.goals[0].text = 'Покопайся в мусорке';
trash528.text = 'Мусорки — это бизнес, Валера. Пороешься — найдёшь хлам. Ценное потом уйдёт на барахолке.';
q528('box').goals = q528('box').goals.slice(0, 1);
q528('box').text = 'На лавке простудишься. Купи коробку: первая недвижимость!';
const fight528 = q528('fight'); fight528.goals[0].need = 1; fight528.goals[0].text = 'Выиграй драку';
fight528.text = 'На районе уважают силу. Хулиган Вован опять отжимает бутылки у пенсионеров. Покажи ему, кто тут новенький.';

function questMigrate528() {
  if (!S.quest || S.quest.order528) return;
  S.quest.order528 = true;
  if (city() !== 'zas') return;
  const path = S.quest.path, filter = (id) => { const q = q528(id); return q && q.city === 'zas' && (!q.path || q.path === path); };
  const old = QUESTS_ORDER_527.filter(filter), cur = old[S.quest.idx], list = questList(), find = (id) => list.findIndex((q) => q.id === id);
  if (!cur) { S.quest.idx = list.length; return; }
  if (!path && ['gym', 'school', 'job'].includes(cur)) { S.quest.resume528 = cur; S.quest.idx = find('choice'); return; }
  S.quest.idx = Math.max(0, find(cur));
}
HOOKS.load.push(questMigrate528);
ACTIONS.questPath = (function (orig) {
  return function (id) {
    orig(id);
    const back = S.quest.resume528;
    if (!back) return;
    delete S.quest.resume528;
    const i = questList().findIndex((q) => q.id === back);
    if (i >= 0) S.quest.idx = i;
  };
})(ACTIONS.questPath);

function wallet528Done() { return counter('wallet528') > ((S.quest.base || {}).wallet528 || 0); }
Object.assign(STORY_SCENES, {
  wallet: { lines: [['🧔', 'Михалыч', 'Баба Нюра с третьей аллеи обыскалась. Двух внуков на пенсию кормит.'], ['🦊', 'Шнырь', 'Внуки вырастут, а ты есть хочешь сегодня. Сто двадцать рублей, Валера. Сто двадцать.']],
    choices: [
      { label: '🤝 Вернуть бабе Нюре', run: () => { if (wallet528Done()) return ''; if (S.fs528) S.fs528.wallet = 'back'; S.karma++; addMood(10); addBottles(10); track('wallet528'); return 'Баба Нюра сунула пирожок и мешок бутылок. +1 карма'; } },
      { label: '💸 Оставить себе', run: () => { if (wallet528Done()) return ''; if (S.fs528) S.fs528.wallet = 'kept'; addMoney(120); track('wallet528'); return '+120 ₽. Шнырь одобрительно хмыкнул'; } },
    ] },
  gig: { lines: [['🦊', 'Шнырь', 'Фура с тарой на овощебазе. Грузчик запил. Полчаса работы, деньги сразу, трудовую не спрашиваю.'], ['🧔', 'Михалыч', 'Спину береги. И пересчитай, что он тебе заплатит.']] },
});
const storyTab528 = EXTRA_TABS.tasks.story;
EXTRA_TABS.tasks.story = () => {
  let html = storyTab528();
  const q = currentQuest();
  if (q && q.id === 'gig' && !goalsDone(q)) html = html.replace('<div class="q-reward">', '<button class="btn primary wide" data-act="gig528">🧰 На шабашку</button><div class="q-reward">');
  return html;
};
ACTIONS.gig528 = () => {
  const j = JOBS.find((x) => x.id === 'loader') || JOBS.find((x) => JOB_GAMES[x.id]);
  if (!j || S.busy || MG || MG_PENDING) return;
  startShiftGame(j, () => { track('gig528'); save(); showScreen('tasks', 'story'); }, ' · шабашка');
};

// ---------- Телефон Эдика: день 2–4, ничего не сгорает ----------
function fs528PhoneAt() {
  // Следующий день по Москве, но не раньше чем через 6 часов. Сутки считаем от полуночи МСК
  const msk = 3 * 3600000, now = Date.now(), next = Math.floor((now + msk) / FS528_DAY) * FS528_DAY + FS528_DAY - msk;
  return Math.max(next, now + 6 * 3600000);
}
function fs528PhoneReady() { const f = S.fs528; return !!f && !!f.phoneAt && (f.phone || 0) < 3 && Date.now() >= f.phoneAt; }
HOOKS.tick.push(() => {
  if (!fs528PhoneReady() || !S.storySeen || (S.tut && !S.tut.done) || S.busy || MG || modalOpen() || !popupTurn(1)) return;
  const f = S.fs528, step = (f.phone || 0) + 1;
  f.phone = step;
  f.phoneAt = step < 3 ? fs528PhoneAt() : 0;
  save();
  playCutscene('phone528_' + step, () => {
    if (step === 1) {
      const said = f.wallet === 'back' ? 'Баба Нюра пирожков передала. Говорит, ты первый за сорок лет.' : f.wallet === 'kept' ? 'Шнырь: «Слыхал, ты с кошельком провернул. Уважаю. Мне не рассказывай, я впечатлительный».' : '';
      morning528(said);
    } else { addXp(step === 2 ? 40 : 80); addMoney(step === 2 ? 150 : 300); toast(step === 2 ? '📱 +150 ₽ и 40 опыта' : '📄 +300 ₽ и 80 опыта. Это пригодится в суде', 'good'); }
  });
});
function morning528(said) {
  const d = dailyState(), chest = !!S.chest;
  openModal(`<div class="morning528"><div class="big-art" style="height:96px"><div class="big-emoji" style="line-height:96px">☕</div></div>
    <h3>Михалыч собрал всё в одну кучу</h3>${said ? `<p>${said}</p>` : ''}
    <ul><li>🌙 Милостыня за ночь уже у тебя</li>${d.claimedToday ? '' : '<li>🎁 Бонус дня</li>'}${chest ? '<li>🧰 Сундук с найденным добром</li>' : ''}</ul>
    <p class="m528-plan"><b>План на день:</b> приодеться для рынка, сходить на шабашку, дать сдачи тем, кто лезет.</p>
    <button class="btn primary wide" data-act="morning528">Забрать и за дело</button></div>`, { center: true, locked: true });
}
ACTIONS.morning528 = () => {
  closeModal();
  if (!dailyState().claimedToday) ACTIONS.daily();
  if (typeof returnState === 'function') { returnState().items.forEach((n) => { n.read = true; }); if (RETURN_ARRIVAL) { RETURN_ARRIVAL.shown = true; RETURN_ARRIVAL.active = false; } }
  save();
  updateHud();
  if (S.chest) setTimeout(() => ACTIONS.chestOpen(), 400);
};
notifyPlan = (function (orig) {
  return function () {
    const plan = orig(), f = S.fs528;
    if (f && f.phoneAt && (f.phone || 0) < 3 && S.settings.remind !== false) plan.push({ key: 'phone', at: f.phoneAt });
    return plan;
  };
})(notifyPlan);

// ---------- Мягкий выход из игры: показатели не падают в ноль за ночь ----------
applyOffline = (function (orig) {
  return function () {
    const before = { food: S.food, mood: S.mood, health: S.health };
    orig();
    const hp = S.fs528 && fs528Age() < 3 * FS528_DAY ? 70 : 40;
    S.food = Math.max(S.food, Math.min(before.food, 30));
    S.mood = Math.max(S.mood, Math.min(before.mood, 30));
    S.health = Math.max(S.health, Math.min(before.health, hp));
  };
})(applyOffline);

// ---------- Что встречает на возвращении ----------
function ready528() {
  const list = [];
  if (cdLeft('trash') <= 0) list.push('🗑️ Мусорка наполнилась');
  if (typeof dailyState === 'function' && !dailyState().claimedToday) list.push('🎁 Ждёт бонус дня');
  if (S.chest) list.push('🧰 Найден сундук');
  if (S.pet && S.petFood <= 20) list.push('🐾 Питомец голоден');
  if (S.married) list.push('💍 Дома ждут');
  const q = typeof currentQuest === 'function' && currentQuest();
  if (q && !q.choice && goalsDone(q)) list.push(`📖 Глава «${q.title}» готова к сдаче`);
  return list;
}
returnBody = (function (orig) {
  return function (all) {
    const list = ready528();
    let html = orig(all).replace('<small>С ВОЗВРАЩЕНИЕМ</small>', '<small>МИХАЛЫЧ</small>').replace('Вот что произошло, пока ты отходил', 'Пока тебя не было, я всё записал')
      .replace(/<p class="rh-safe">[^<]*<\/p>/, '');
    if (list.length) html = html.replace('<div class="rh-items">', `<section class="rh-ready528"><b>Что уже готово</b>${list.map((x) => `<span>${x}</span>`).join('')}</section><div class="rh-items">`);
    return html;
  };
})(returnBody);

// ---------- Дела на 5 минут и одна кнопка «что дальше» ----------
function next528() {
  const q = currentQuest();
  if (!q) return null;
  if (q.choice) return { t: 'Выбери свой путь', d: q.title, act: 'openQuest' };
  if (goalsDone(q)) return { t: q.boss ? 'Босс ждёт' : 'Забери награду главы', d: q.title, act: 'openQuest' };
  const g = q.goals.find((x) => x.cur() < x.need);
  if (q.id === 'wallet') return { t: g ? g.text : q.title, d: q.title, act: 'stReplay', id: 'wallet' };
  if (q.id === 'gig') return { t: g ? g.text : q.title, d: q.title, act: 'gig528' };
  return { t: g ? g.text : q.title, d: q.title, act: 'openQuest' };
}
function todo528() {
  const out = [];
  if (S.food < 40) out.push({ e: '🍞', t: 'Поесть', act: 'hubGo528', id: 'shop:food' });
  if (cdLeft('trash') <= 0) out.push({ e: '🗑️', t: 'Мусорка', act: 'hubGo528', id: 'trash' });
  if (!dailyState().claimedToday) out.push({ e: '🎁', t: 'Бонус дня', act: 'hubGo528', id: 'tasks:tasks' });
  if (typeof businessTotals === 'function' && businessTotals().cash >= 1) out.push({ e: '🏪', t: 'Касса бизнеса', act: 'hubGo528', id: 'life:business' });
  if (S.pet && S.petFood <= 40) out.push({ e: '🐾', t: 'Питомец', act: 'hubGo528', id: 'shop:pets' });
  return out.slice(0, 3);
}
let next528At = 0;
function next528Render() {
  const el = $('next528');
  if (!el || Date.now() - next528At < 1500) return;
  next528At = Date.now();
  if (!S.storySeen || (S.tut && !S.tut.done)) { el.hidden = true; return; }
  const n = next528(), todo = todo528();
  const html = (n ? `<button class="n528-main" data-act="${n.act}"${n.id ? ` data-id="${n.id}"` : ''}><small>Что дальше</small><b>${n.t}</b></button>` : '')
    + (todo.length ? `<div class="n528-todo">${todo.map((x) => `<button data-act="${x.act}" data-id="${x.id}"><span>${x.e}</span>${x.t}</button>`).join('')}</div>` : '');
  if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; }
  el.hidden = !html;
}
ACTIONS.hubGo528 = (id) => {
  if (id === 'trash') { const b = $('trashBtn'); if (b) b.click(); return; }
  const [s, t] = id.split(':');
  showScreen(s, t);
};
HOOKS.init.push(() => {
  const el = document.createElement('section');
  el.id = 'next528'; el.className = 'next528'; el.hidden = true;
  $('scene').after(el);
});
HOOKS.hud.push(next528Render);

// ---------- Разделы открываются постепенно (только новые сохранения) ----------
const HUB_OPEN_528 = {
  me: () => questDone528('start'),
  goals: () => questDone528('trash'),
  fun: () => questDone528('basics'),
  money: () => questDone528('choice'),
  people: () => !fs528First() || questDone528('choice'),
};
function questDone528(id) {
  const i = questList().findIndex((q) => q.id === id);
  return i < 0 || S.quest.idx > i;
}
function hubOpen528(id) { return !S.fs528 || !HUB_OPEN_528[id] || HUB_OPEN_528[id](); }
ACTIONS.betaHub = (function (orig) {
  return function (id) {
    if (hubOpen528(id)) return orig(id);
    toast('🧔 Не всё сразу, Валера. Сначала глава сюжета');
  };
})(ACTIONS.betaHub);
HOOKS.hud.push(() => {
  if (!S.fs528) return;
  document.querySelectorAll('#tabbar [data-hub]').forEach((b) => b.classList.toggle('fs-lock528', !hubOpen528(b.dataset.hub)));
});

// ---------- Продажи только со второго дня ----------
starsOffersEnabled = (function (orig) { return function () { return orig() && !fs528First(); }; })(starsOffersEnabled);

// ---------- Названия разделов в подсказках ----------
for (const u of UNLOCKS) u.d = String(u.d).replace(/Жизнь →/g, 'Деньги →').replace(/Задания →/g, 'Цели →');

// Опытному герою окна про открывшиеся разделы не нужны
function unlockQuiet528() {
  if (!S.unlockSeen) S.unlockSeen = {};
  const calm = S.settings && S.settings.calm528;
  for (const u of UNLOCKS) {
    if (!S.unlockSeen[u.id] && u.cond() && (level() >= 30 || (S.prestige || 0) > 0 || (calm && ['fights', 'casino'].includes(u.id)))) S.unlockSeen[u.id] = 1;
  }
}
HOOKS.tick.push(unlockQuiet528);
