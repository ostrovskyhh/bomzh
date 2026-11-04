// 5.28. Живой мир: события по стадиям жизни, память мира, письма героев, значимые семья, питомец, машина и честный путь.
// S.worldMem хранит флаги и отложенные письма. Письма приходят через готовый returnNotice, новых окон нет.

function lifeStage528() { return S.housing >= 6 || level() >= 20 ? 3 : developmentStage(); }
function world528() {
  if (!S.worldMem) S.worldMem = {};
  const w = S.worldMem;
  w.flags = w.flags || {}; w.echo = w.echo || []; w.seen = w.seen || {}; w.npc = w.npc || {};
  return w;
}
function flag528(id) { return !!world528().flags[id]; }
function npcMark528(id, npc, delta) {
  const w = world528();
  w.flags[id] = Date.now();
  if (npc) w.npc[npc] = clamp((w.npc[npc] || 0) + (delta || 0), -3, 3);
  parrotSync528();
}
function echo528(hours, key, title, body) { world528().echo.push({ at: Date.now() + hours * 3600000, key, title, body }); }
function clip528(headline, body) { echo528(6, 'clip:' + headline, '📰 Нина Строчкина, районная газета', `«${headline}». ${body}`); }
function mins528(m) { return Math.max(50, developmentMoney(m)); }
function pay528(m) { const v = mins528(m); if (S.money < v) return 0; S.money -= v; return v; }

HOOKS.tick.push(() => {
  const w = S.worldMem;
  if (!w || !w.echo || !w.echo.length || !LOADED) return;
  const now = Date.now(), due = w.echo.filter((e) => e.at <= now);
  if (!due.length) return;
  w.echo = w.echo.filter((e) => e.at > now);
  due.forEach((e) => returnNotice({ key: 'echo528:' + e.key, kind: 'news', title: e.title, body: e.body }));
});

// ---------- Кеша повторяет решения ----------
const PARROT_BASE_528 = PARROT_LINES.length;
const PARROT_FLAGS_528 = { blamedNeighbor: 'Вр-рёшь, Валер-ра!', tookChange: 'Сдачу вер-рни!', benchSaved: 'Лавка! Лавка!', soldBench: 'Михалыч обиделся!', soupStayed: 'Половник! Половник!', gloves: 'Пер-рчатки!', riverDay: 'На р-речку!' };
function parrotSync528() {
  PARROT_LINES.length = PARROT_BASE_528;
  for (const [f, line] of Object.entries(PARROT_FLAGS_528)) if (flag528(f)) PARROT_LINES.push(line);
}
HOOKS.load.push(parrotSync528);

// ---------- Двенадцать событий и варианты ----------
const once528 = (id) => !world528().seen[id];
const honestOpt = () => S.quest && S.quest.path === 'honest';
const darkOpt = () => S.quest && S.quest.path === 'dark';
function life528(id, stages, emoji, title, text, cond, options) {
  EVENTS.push({ id, emoji, title, get text() { return typeof text === 'function' ? text() : text; },
    cond: () => stages.includes(lifeStage528()) && once528(id) && (!cond || cond()),
    options: options.map((o) => ({ ...o, run: () => { world528().seen[id] = Date.now(); return o.run(); } })) });
}
life528('change528', [0], '🧾', 'Чужая сдача', 'Продавщица Рая дала сдачу с пятисотки. Ты давал сотню. Она считает на калькуляторе без батарейки и смотрит только на тебя.', null, [
  { label: 'Вернуть', run: () => { S.karma = (S.karma || 0) + 1; addMood(5); npcMark528('rayaTrust', 'mihalych', 1); echo528(5, 'raya', '🥟 Рая из ларька', 'Оставила тебе вчерашние пирожки. Сказала, таких больше не делают.'); return '+1 карма, +5 😊'; } },
  { label: 'Оставить', run: () => { const m = evMoney(40); addMoney(m); npcMark528('tookChange', 'shnyr', 1); echo528(5, 'shnyr1', '🦊 Шнырь', 'Видел. Уважаю. Заходи.'); return `+${fmt(m)} ₽`; } },
]);
life528('pup528', [0], '🐶', 'Хвост', 'За тобой от самой мусорки идёт щенок с обрывком верёвки. Садится, когда садишься ты. Ты пока не понял, кто кого завёл.', () => !S.pet, [
  { label: 'Накормить', run: () => { feed(-10); npcMark528('pupFed'); if (!S.pets.includes('dog')) { S.pets.push('dog'); S.pet = 'dog'; S.petFood = 100; S.petFedAt = Date.now(); } return 'Шарик теперь твой. −10 🍞'; } },
  { label: 'Прогнать', run: () => { addMood(-5); npcMark528('pupGone'); return 'Он ещё долго смотрел вслед. −5 😊'; } },
]);
life528('gloves528', [0], '🧤', 'Перчатки', 'Михалыч молча снял перчатки и положил тебе на колени. У него на правой нет двух пальцев, так что ему, говорит, и одной хватит.', () => city() === 'zas', [
  { label: 'Взять', run: () => { heal(5); npcMark528('gloves', 'mihalych', 1); return '+5 ❤️. Теплее, чем казалось'; } },
  { label: 'Отказаться', run: () => { addMood(3); S.karma = (S.karma || 0) + 1; npcMark528('glovesBack'); return 'Михалыч: «Гордый. Это хорошо, но холодно».'; } },
]);
life528('salary528', [1], '💵', 'Первая зарплата', 'Бригадир отсчитал настоящие деньги. В кармане хрустит. Михалыч третий день кашляет так, что с лавки слетают голуби.', () => city() === 'zas', [
  { label: 'Купить ему лекарство', run: () => { const m = pay528(3); npcMark528('medicine', 'mihalych', 1); echo528(8, 'tea', '🧔 Михалыч', 'Чай заварил на твоих травах. Заходи, пока не остыл.'); return m ? `−${fmt(m)} ₽. Михалыч отмахнулся, но взял` : 'Хватило только на мёд. Михалыч взял'; } },
  { label: 'Обмыть', run: () => { addMood(15); npcMark528('partied', 'mihalych', -1); echo528(6, 'cough', '🧔 Михалыч', 'Кашель прошёл сам. Спасибо, что не спросил.'); return '+15 😊'; } },
  { label: 'Отложить', run: () => { addMoney(mins528(1)); npcMark528('saved', 'shnyr', 1); return 'Шнырь: «Копишь? На что?»'; } },
]);
life528('river528', [1], '🏍️', 'Коляска', 'Михалыч сидит в твоей коляске и уже в шлеме. Откуда шлем, не говорит. «Давай к реке, Валера. Я там лет сорок не был».', () => city() === 'zas' && S.transport >= 1, [
  { label: 'Свозить', run: () => { S.energy = Math.max(0, S.energy - 10); addMood(20); npcMark528('riverDay', 'mihalych', 2); return '+20 😊. Он сорок минут молчал и смотрел на воду'; } },
  { label: '«Занят, Михалыч»', run: () => { npcMark528('noRiver', 'mihalych', -1); return 'Он снял шлем и аккуратно положил его в коляску'; } },
]);
life528('parrot528', [1, 2], '🦜', 'Попугай-свидетель', () => `Участковый пришёл по поводу шума, сел пить чай, и тут ${S.pet === 'parrot' ? 'Кеша' : 'твой зверь'} громко выдал то, что ты говорил вчера. Про участкового.`, () => !!S.pet, [
  { label: 'Посмеяться и признаться', run: () => { S.karma = (S.karma || 0) + 1; npcMark528('cop'); return 'Участковый запомнил. Теперь он тебе не чужой'; } },
  { label: 'Свалить на соседа', run: () => { npcMark528('blamedNeighbor'); return 'Сосед обиделся. А зверь запомнил'; } },
]);
life528('boss528', [2], '👔', 'Бывший начальник', 'В очереди за шаурмой стоит Сергей Петрович, который уволил тебя при всех за опоздание на четыре минуты. Пальто то же. Ботинки уже нет. Он тебя не узнал.', null, [
  { label: 'Предложить работу', run: () => { const m = pay528(2); npcMark528('bossHired'); echo528(24, 'boss', '👔 Сергей Петрович', 'Навёл порядок в вашей бухгалтерии. Спасибо, что не вспомнили те четыре минуты.'); return m ? `−${fmt(m)} ₽` : 'Он согласился работать в долг'; } },
  { label: 'Напомнить про четыре минуты', run: () => { addMood(12); S.karma = (S.karma || 0) - 1; npcMark528('bossShamed'); return '+12 😊. Приятно. Ненадолго'; } },
  { label: 'Купить шаурму молча', run: () => { S.karma = (S.karma || 0) + 1; clip528('Бывает', 'Неизвестный оплатил шаурму человеку, который его уволил.'); return '+1 карма'; } },
]);
life528('school528', [2], '🏫', 'Родительское собрание', () => { const k = (S.kids || []).find((x) => kidStage(x) === 'kid'); return `Классная руководительница поправила очки: «${k ? esc(k.name) : 'Ребёнок'} написал сочинение "Мой папа". Там про бутылки, кота и слово "недоимка". Вы хотели бы это обсудить?»`; }, () => (S.kids || []).some((x) => kidStage(x) === 'kid'), [
  { label: 'Приехать лично', cond: () => S.transport >= 1, run: () => { const k = S.kids.find((x) => kidStage(x) === 'kid'); k.joy = Math.min(100, k.joy + 30); k.smart = Math.min(5, (k.smart || 0) + 1); addTrust(5); return S.transport >= 8 ? '«Папа, а можно в следующий раз высадить за углом?»' : 'Ребёнок сиял всю дорогу домой'; } },
  { label: 'Перевести денег на ремонт класса', run: () => { pay528(3); addTrust(-5); return 'Класс отремонтировали. Ребёнок не заметил'; } },
  { label: 'Забыть', run: () => { addTrust(-10); echo528(3, 'wifeForgot', '💍 Дома', 'Ты обещал приехать. Она ничего не сказала. И это хуже всего.'); return '−10 доверия'; } },
]);
life528('roof528', [2], '🥣', 'Крыша ночлежки', 'Тётя Валя держит в руках таз: «Валерочка, течёт прямо над твоей старой койкой. Я её никому не отдаю, примета плохая».', null, [
  { label: 'Оплатить крышу', run: () => { pay528(5); npcMark528('shelterRoof', 'valya', 2); honest528(2); return 'Новая крыша. Табличку ты запретил, но её всё равно повесили'; } },
  { label: 'Прислать людей с работы', run: () => { S.energy = Math.max(0, S.energy - 20); npcMark528('shelterHelp', 'valya', 1); honest528(1); return 'Сам тоже полез на крышу. −20 ⚡'; } },
  { label: 'Собрать район', cond: honestOpt, run: () => { addMood(10); npcMark528('shelterRoof', 'valya', 2); honest528(3); return 'Пришёл весь двор. Ты не потратил ни рубля'; } },
  { label: '«Сейчас не могу»', run: () => { npcMark528('noRoof', 'valya', -1); return 'Тётя Валя: «Ничего. Я тоже когда-то не могла».'; } },
]);
life528('ladle528', [3], '🍲', 'Половник', 'Пресс-служба организовала фото: «Депутат раздаёт обед волонтёров». Половник новый, с ценником. Третий в очереди поднимает глаза: Гена Ящик. «Валера? Ты чё, тоже здесь питаешься?»', null, [
  { label: 'Снять пиджак и остаться до конца', run: () => { S.energy = Math.max(0, S.energy - 20); addMood(15); npcMark528('soupStayed', 'valya', 2); honest528(2); clip528('Суп не остыл', 'Депутат простоял на раздаче до вечера. Пресс-служба уехала первой.'); return '+15 😊'; } },
  { label: 'Три кадра и в машину', run: () => { addMoney(mins528(1)); clip528('Суп остыл быстрее', 'Фотосессия заняла четыре минуты.'); return 'Рейтинг вырос. На душе нет'; } },
  { label: 'Отдать половник помощнику', run: () => { S.karma = (S.karma || 0) - 1; echo528(4, 'ladle', '🥣 Тётя Валя', 'Половник вернули. Ценник на месте.'); return '−1 карма'; } },
]);
life528('bench528', [3], '🪑', 'Лавка под снос', 'Застройщик положил конверт на стол: парк станет паркингом. Подпись твоя, скамейки «демонтируются». На схеме есть маленький крестик. Ты знаешь эту скамейку.', null, [
  { label: 'Отказать', run: () => { npcMark528('benchSaved', 'mihalych', 3); honest528(3); clip528('Парк остаётся', 'Сделка сорвалась. На лавке появилась табличка, которую никто не заказывал.'); return 'Деньги ушли. Лавка осталась'; } },
  { label: 'Подписать', run: () => { addMoney(mins528(20)); addMood(-15); npcMark528('soldBench', 'mihalych', -3); echo528(5, 'bench', '🧔 Михалыч', 'Лавку увезли. Я постою.'); return 'Конверт тяжёлый. −15 😊'; } },
  { label: 'Подписать, но перевезти лавку к себе', cond: () => darkOpt() || S.money >= mins528(30), run: () => { if (!darkOpt()) pay528(30); npcMark528('benchHome', 'mihalych', 1); echo528(6, 'bench2', '🧔 Михалыч', 'Приехал посмотреть. Мягче не стала.'); return 'Лавка стоит у тебя во дворе'; } },
]);
life528('kid528', [3], '🧍', 'Парень с лавки', 'На твоей лавке сидит парень лет двадцати и считает бутылки. Спрашивает, не ты ли тот самый. Спрашивает, как ты выбрался.', null, [
  { label: '«На лавке не разжиреешь»', run: () => { addMood(10); if (flag528('gloves')) { npcMark528('glovesGiven', 'mihalych', 1); return 'Ты отдал ему перчатки. Михалыч долго молчал'; } return 'Он записал это в телефон'; } },
  { label: 'Дать работу', run: () => { pay528(3); npcMark528('youngHired'); echo528(30, 'young', '🧍 Парень с лавки', 'Вышел на смену. Коробку ещё не продал, на всякий случай.'); return 'Ещё один выбрался'; } },
  { label: 'Дать денег', run: () => { pay528(1); echo528(10, 'young2', '🧍 Парень с лавки', 'Купил коробку. Первая недвижимость.'); return 'Пусть начинает как все'; } },
  { label: '«Есть одно дело»', cond: darkOpt, run: () => { npcMark528('youngDark', 'shnyr', 1); echo528(6, 'krivoy', '🔦 Кривой', 'Вырос ты, Валера.'); return 'Он кивнул. Ты узнал этот кивок'; } },
]);
// Питомец и машина открывают варианты, а не проценты
life528('raid528', [1, 2, 3], '🚨', 'Облава во дворе', 'Ночью в подъезде шаги и фонарики. Кто-то назвал твою фамилию. У тебя есть минута.', () => darkOpt() && (S.wanted || 0) > 0, [
  { label: '🐾 Пёс учуял раньше всех', cond: () => S.pet === 'dog' && petHappy(), run: () => { S.wanted = Math.max(0, S.wanted - 1); return 'Ушёл чёрным ходом. Шарик получил колбасу. −1 розыск'; } },
  { label: '🐀 Крыса нашла лаз', cond: () => S.pet === 'rat' && petHappy(), run: () => { S.wanted = Math.max(0, S.wanted - 1); return 'Лариска знает этот дом лучше тебя. −1 розыск'; } },
  { label: '🚗 Уйти дворами на машине', cond: () => S.transport >= 4 && !S.transportBroken, run: () => { S.wanted = Math.max(0, S.wanted - 1); S.energy = Math.max(0, S.energy - 10); return 'Дядя Ашот не зря хвалил подвеску. −1 розыск'; } },
  { label: '👮 Знакомый участковый', cond: () => flag528('cop'), run: () => { S.wanted = 0; return 'Участковый постучал первым: «Кеша передаёт привет». Розыск снят'; } },
  { label: 'Отсидеться в шкафу', run: () => { addMood(-8); return 'Прошло. Шкаф тесный. −8 😊'; } },
]);
life528('birth528', [1, 2], '🚗', 'Соседка рожает', 'Ночью стук в дверь: у соседки начались схватки, скорая едет час. Смотрят на твои ключи.', () => S.transport >= 2 && !S.transportBroken, [
  { label: 'Отвезти', run: () => { S.energy = Math.max(0, S.energy - 15); addMood(15); S.karma = (S.karma || 0) + 1; npcMark528('birthDrive', 'ashot', 1); honest528(1); echo528(12, 'ashot', '🔧 Дядя Ашот', 'Сын мой, слышал. Машина не врёт: ты ехал быстрее, чем она умеет. Заезжай, посмотрю подвеску.'); return 'Мальчик. Назвали Валерой. +15 😊'; } },
  { label: 'Вызвать такси за свой счёт', run: () => { pay528(1); return 'Доехали. Соседка потом принесла банку огурцов'; } },
]);

// Больше мелочей на поздних стадиях
MINI_GOOD.push(
  { e: '🥣', t: 'На твоей старой койке спит новенький. Говорят, держится', cond: () => flag528('shelterRoof'), run: () => { addMood(4); return '+4 😊'; } },
  { e: '🪑', t: 'На лавке прибита табличка: «Здесь начинали»', cond: () => flag528('benchSaved'), run: () => { addMood(5); return '+5 😊'; } },
  { e: '📷', t: 'Школьники просят сфотографироваться', cond: () => lifeStage528() >= 2, run: () => { const m = mins528(0.3); addMoney(m); return `+${fmt(m)} ₽`; } },
  { e: '🤝', t: 'Старый знакомый вернул долг', cond: () => lifeStage528() === 3, run: () => { const m = mins528(0.8); addMoney(m); return `+${fmt(m)} ₽`; } },
);
MINI_BAD.push(
  { e: '📰', t: 'В газете вышла неудачная фотография', cond: () => lifeStage528() === 3, run: () => { addMood(-3); return '−3 😊'; } },
  { e: '📞', t: 'Звонил помощник. Опять про налоги', cond: () => lifeStage528() >= 2, run: () => { addMood(-2); return '−2 😊'; } },
);

// ---------- Семья ----------
const PARTNER_BASE_528 = PARTNER_Q.length;
const PARTNER_STAGE_528 = {
  1: [['Ты всё ещё пахнешь парком. Это навсегда?', [['Это запах успеха', 3, 3, 2, '«Успех надо чаще стирать»'], ['Постираю всё сегодня', 5, 4, 0, '«Вот это мужчина»']]]],
  2: [['Твой бухгалтер звонит чаще, чем мама. Мне волноваться?', [['Это про налоги', 3, 2, 0, '«Звучит ещё страшнее»'], ['Выключу на вечер', 6, 5, 3, '«Правда выключил?!»']]]],
  3: [['Ты меня на приёме представил как «моя супруга». Имя забыл?', [['Волновался', -2, 2, 0, '«Депутат волновался. Запишу в дневник»'], ['Больше не повторится', 5, 4, 0, '«Посмотрим»']]]],
};
let partner528At = 0;
HOOKS.tick.push(() => {
  if (Date.now() - partner528At < 60000 || !LOADED) return;
  partner528At = Date.now();
  PARTNER_Q.length = PARTNER_BASE_528;
  PARTNER_Q.push(...(PARTNER_STAGE_528[lifeStage528()] || []));
  if (darkOpt()) PARTNER_Q.push(['Откуда в бардачке сумка с деньгами?', [['Премия', -6, -4, 0, '«Премии в банковской упаковке не бывает»'], ['Завяжу, обещаю', 6, 5, 0, '«Я запомню»']]]);
  // Поддержка при унынии: приходит человек, а не штраф
  const w = world528();
  if (S.mood < 20 && Date.now() - (w.lowAt || 0) > 6 * 3600000 && S.storySeen) {
    w.lowAt = Date.now();
    addMood(15);
    toast(city() === 'zas' ? '🧔 Михалыч сел рядом и молча налил чаю. +15 😊' : '✉️ Письмо от Михалыча: «Ешь суп, Валера». +15 😊', 'good');
  }
  if (S.transport > 0 && !w.firstCar) { w.firstCar = TRANSPORT[S.transport].name; }
  else if (w.firstCar && S.transport > (w.maxCar || 0) + 1 && (w.maxCar || 0) > 0) echo528(1, 'ashot' + S.transport, '🔧 Дядя Ашот', `Сын мой, а помнишь свой первый: ${w.firstCar}? Пробег у него честнее, чем у твоего депутата.`);
  w.maxCar = Math.max(w.maxCar || 0, S.transport);
});
function wifeHelp528(id, days) {
  if (!S.married || (S.trust === undefined ? TRUST_START : S.trust) < 70) return false;
  const w = world528(), key = 'wife_' + id;
  if (Date.now() < (w[key] || 0)) return false;
  w[key] = Date.now() + days * 86400000;
  return true;
}
police = (function (orig) {
  return function (c, loot) {
    if (!wifeHelp528('police', 1)) return orig(c, loot);
    S.wanted = 0; addTrust(-5);
    resultModal({ emoji: '💍', title: 'Жена приехала сама', text: 'Положила на стол конверт, посмотрела на дежурного так, что он забыл твою фамилию. Домой ехали молча. −5 доверия', btn: 'Спасибо' });
  };
})(police);
evict = (function (orig) {
  return function () {
    if (!wifeHelp528('evict', 7)) return orig();
    S.debt = 0; S.missed = 0; S.billDue = Date.now() + MONTH_MS; addTrust(-5);
    resultModal({ emoji: '💍', title: 'Жена закрыла счёт', text: 'Хозяин уже стоял с ключами, но она молча перевела всю сумму. Выселения не будет. −5 доверия', btn: 'Спасибо' });
  };
})(evict);
const addRel528 = addRel;
addRel = (v) => addRel528(v > 0 ? v * (1 + 0.25 * perk('album')) : v);

// Дети: выбор на переходе и услуга вместо суммы
HOOKS.tick.push(() => {
  if (!S.kids || !S.kids.length || MG || S.busy || modalOpen() || !popupTurn(3)) return;
  const k = S.kids.find((x) => !x.way && kidStage(x) !== 'baby' && kidStage(x) !== 'kid');
  if (!k) return;
  const i = S.kids.indexOf(k);
  openModal(`<div class="big-art" style="height:96px"><div class="big-emoji" style="line-height:96px">🎒</div></div><h3>${esc(k.name)} выбирает дорогу</h3>
    <p>«Пап, все уже решили, кем будут. А я что?»</p><div class="btns" style="flex-direction:column;gap:8px">
    <button class="btn primary wide" data-act="kidWay528" data-id="${i}:study">📚 Учёба: будет врачом или юристом</button>
    <button class="btn wide" data-act="kidWay528" data-id="${i}:hands">🔧 Руками: автомеханик</button>
    ${darkOpt() ? `<button class="btn wide" data-act="kidWay528" data-id="${i}:street">🕶️ Улица: «Я как ты, пап»</button>` : ''}</div>`, { center: true, locked: true });
});
ACTIONS.kidWay528 = (arg) => {
  const [i, way] = arg.split(':'), k = S.kids[+i];
  if (!k) return;
  k.way = way;
  if (way === 'study') k.smart = Math.min(5, (k.smart || 0) + 1);
  if (way === 'street') echo528(24, 'streetKid', '💍 Дома', 'Ты знаешь, чей это пример. Она не спорит. Просто переставила твоё фото на дальнюю полку.');
  closeModal(); save();
};
function kidJob528(k) { return k.way === 'study' ? ((k.smart || 0) >= 3 ? 'doctor' : 'lawyer') : k.way === 'hands' ? 'mechanic' : k.way === 'street' ? 'fixer' : ''; }
const KID_SERVICE_528 = {
  doctor: ['🩺', 'Врач', 'Лечит бесплатно раз в сутки', () => { S.health = maxHealth(); return 'Полное здоровье'; }],
  lawyer: ['⚖️', 'Юрист', 'Снимает розыск раз в сутки', () => { S.wanted = 0; return 'Розыск снят'; }],
  mechanic: ['🔧', 'Механик', 'Чинит транспорт раз в сутки', () => { S.transportBroken = false; return 'Машина на ходу'; }],
  fixer: ['🕶️', 'Решала', 'Снимает розыск раз в сутки, но доверие −3', () => { S.wanted = 0; addTrust(-3); return 'Розыск снят. Лучше не спрашивать как'; }],
};
function kidCards528() {
  const adults = (S.kids || []).filter((k) => kidStage(k) === 'adult' && k.way);
  if (!adults.length) return '';
  return `<div class="subhead">👨‍👧 Взрослые дети помогают</div>` + adults.map((k) => {
    const s = KID_SERVICE_528[kidJob528(k)], cd = Math.max(0, (k.helpAt || 0) - Date.now());
    return `<div class="info-card"><b>${s[0]} ${esc(k.name)}, ${s[1].toLowerCase()}</b><p>${s[2]}</p><button class="btn wide" data-act="kidHelp528" data-id="${S.kids.indexOf(k)}" ${cd ? 'disabled' : ''}>${cd ? 'Сегодня уже помог' : 'Попросить'}</button></div>`;
  }).join('');
}
const datesTab528 = EXTRA_TABS.fun.dates;
EXTRA_TABS.fun.dates = () => kidCards528() + datesTab528();
ACTIONS.kidHelp528 = (i) => {
  const k = S.kids[+i];
  if (!k || (k.helpAt || 0) > Date.now()) return;
  const s = KID_SERVICE_528[kidJob528(k)];
  if (!s) return;
  k.helpAt = Date.now() + 86400000;
  toast(`${s[0]} ${s[3]()}`, 'good');
  save(); refresh();
};

// ---------- Машина и побег ----------
caught = (function (orig) {
  return function (c, perf) { return orig({ ...c, risk: c.risk - Math.min(0.02, (S.transportBroken ? 0 : S.transport) * 0.002) }, perf); };
})(caught);

// ---------- Честное имя ----------
const HONEST_RANKS_528 = [
  { pts: 0, name: 'Сосед', perk: 'Пока просто сосед' },
  { pts: 4, name: 'Надёжный', perk: 'Работа +3%' },
  { pts: 10, name: 'Свой в совете', perk: 'Работа +6%' },
  { pts: 20, name: 'Заступник', perk: 'Работа +10%, адвокат Розенберг снимает розыск раз в сутки' },
  { pts: 35, name: 'Совесть города', perk: 'Работа +15%, тётя Валя шлёт людей: услуги квартала каждые 6 часов' },
];
function honest528(n) { if (honestOpt()) { const w = world528(); w.honest = (w.honest || 0) + n; } }
function honestPts528() { return (S.worldMem ? S.worldMem.honest || 0 : 0) + (typeof honest68Done === 'function' ? honest68Done() * 2 : 0) + perk('plaque') * 4; }
function honestRank528() { let r = 0; HONEST_RANKS_528.forEach((x, i) => { if (honestPts528() >= x.pts) r = i; }); return r; }
HOOKS.mods.push((m) => { if (honestOpt()) m.work *= [1, 1.03, 1.06, 1.1, 1.15][honestRank528()]; });
honest68HTML = (function (orig) {
  return function () {
    if (!honest68Ready()) return orig();
    const r = honestRank528(), cur = HONEST_RANKS_528[r], next = HONEST_RANKS_528[r + 1], pts = honestPts528(), law = r >= 3, cd = Math.max(0, (world528().lawAt || 0) - Date.now());
    return `<section class="honest528"><small>ЧЕСТНОЕ ИМЯ</small><h3>${cur.name}</h3><p>${cur.perk}</p>
      ${next ? `<div class="progress"><div style="width:${Math.min(100, (pts - cur.pts) / (next.pts - cur.pts) * 100)}%"></div></div><p>${pts} из ${next.pts}. Дальше: <b>${next.name}</b> — ${next.perk}</p>` : '<p>Выше только небо и тётя Валя.</p>'}
      ${law ? `<button class="btn wide" data-act="honestLaw528" ${cd ? 'disabled' : ''}>⚖️ ${cd ? 'Розенберг занят до завтра' : 'Розенберг снимает розыск'}</button>` : ''}</section>` + orig();
  };
})(honest68HTML);
ACTIONS.honestLaw528 = () => { const w = world528(); if ((w.lawAt || 0) > Date.now() || honestRank528() < 3) return; w.lawAt = Date.now() + 86400000; S.wanted = 0; toast('⚖️ Розыск снят законно', 'good'); save(); ACTIONS.honest68Open(); };
ACTIONS.honest68Service = (function (orig) {
  return function (type) {
    if (honestRank528() >= 4) { const st = honest68State(), at = st.service[city()] || 0; if (Date.now() < at && at - Date.now() > 0 && at - Date.now() <= 6 * 3600000) st.service[city()] = 0; }
    orig(type);
    if (honestRank528() >= 4) { const st = honest68State(); if (st.service[city()] > Date.now() + 6 * 3600000) st.service[city()] = Date.now() + 6 * 3600000; save(); }
  };
})(ACTIONS.honest68Service);
HONEST_CASES_468.push(
  { id: 'hit528_1', city: 'it', npc: 'Массимо', title: 'Рыба без чека', text: 'Лавка Массимо получила штраф за рыбу без документов. Но накладная на столе.', clue: 'В накладной дата завтрашняя, а печать порта вчерашняя.', question: 'Что не так?', answer: 'Накладную подменили задним числом', wrong: ['Рыба испорчена', 'Массимо не умеет писать'], outcome: 'Штраф отменили, а инспектор сменил порт.' },
  { id: 'hit528_2', city: 'it', npc: 'Сеньора Лючия', title: 'Ключи от двора', text: 'Жильцам дома сказали, что двор закрывают на реконструкцию. Ключи забрала «Футуро».', clue: 'Разрешение подписано человеком, который уволился год назад.', question: 'Чем это доказать?', answer: 'Показать дату увольнения подписанта', wrong: ['Поменять замок', 'Написать в газету стихи'], outcome: 'Двор снова открыт, дети играют в мяч.' },
  { id: 'hit528_3', city: 'it', npc: 'Отец Паоло', title: 'Счёт за колокол', text: 'Приходу выставили счёт за ремонт колокола, которого никто не заказывал.', clue: 'Компания-подрядчик зарегистрирована в том же офисе, что и «Футуро».', question: 'Кому нести бумаги?', answer: 'В совет квартала с копией регистрации', wrong: ['Самому подрядчику', 'Спрятать счёт'], outcome: 'Колокол звонит, счёт в корзине.' },
  { id: 'hit528_4', city: 'cn', npc: 'Тётушка Ли', title: 'Чай с печатью', text: 'Чайной Ли приказали закрыться из-за «нарушений». Акт принесли без осмотра.', clue: 'В акте описан второй этаж. В чайной один этаж.', question: 'Что это значит?', answer: 'Акт писали, не приходя на место', wrong: ['Надо построить этаж', 'Чай просрочен'], outcome: 'Чайная открыта, чай за счёт заведения.' },
  { id: 'hit528_5', city: 'cn', npc: 'Мастер Чжан', title: 'Мастерская за долги', text: 'Мастеру Чжану прислали долг за аренду, которую он оплатил. «Нефритовый горизонт» требует съехать.', clue: 'Квитанция есть, но номер счёта в ней чужой.', question: 'Как быть?', answer: 'Сверить счёт в банке и подать жалобу', wrong: ['Заплатить второй раз', 'Съехать ночью'], outcome: 'Деньги нашлись на чужом счёте.' },
  { id: 'hit528_6', city: 'cn', npc: 'Учительница Мэй', title: 'Школа на бумаге', text: 'Школу в хутуне внесли в план сноса. Родители не верят, что план настоящий.', clue: 'На плане стоит подпись, почерк которой ты уже видел. Второй страницы договора тоже касалась эта рука.', question: 'Что сделать?', answer: 'Передать копии Аве и Бернару', wrong: ['Порвать план', 'Промолчать'], outcome: 'Снос отменён. Цепочка стала длиннее на одно звено.' },
);

// ---------- Наследие: то, что остаётся между кругами ----------
PERKS.push(
  { id: 'oldties', name: 'Старые связи', emoji: '🤝', desc: 'Один раз за круг пропусти обычную главу сюжета за уровень перка', max: 2 },
  { id: 'garage', name: 'Гараж Михалыча', emoji: '🔧', desc: 'Транспорт прошлого круга (до ступени 2 за уровень) ждёт тебя на старте', max: 3 },
  { id: 'album', name: 'Семейный альбом', emoji: '📷', desc: '+25% к росту отношений за уровень', max: 3 },
  { id: 'plaque', name: 'Табличка на лавке', emoji: '🪧', desc: '+4 очка честного имени за уровень', max: 3 },
);
prestigeProfile = (function (orig) {
  return () => {
    const w = world528(), g = typeof partner === 'function' ? partner() : null, last = S.legacy || {};
    return { ...orig(), legacy: { round: (last.round || 0) + 1, path: S.quest ? S.quest.path : null, wife: g ? g.name : last.wife || '', kids: (S.kids || []).length, transport: S.transport, firstCar: w.firstCar || '', flags: w.flags, npc: w.npc, honest: w.honest || 0 } };
  };
})(prestigeProfile);
const DEJAVU_528 = [
  () => `Михалыч у костра рассказывает молодому парню одну историю. Каждый раз немного иначе. В этот раз Валера ${S.legacy.path === 'dark' ? 'был страшнее' : 'был добрее'}.`,
  () => (S.legacy.wife ? 'Прохожая обернулась: «Ты когда-нибудь был женат? Тебе идёт».' : ''),
  () => (S.pet ? `${(activePet() || {}).name || 'Питомец'} сам привёл тебя к подъезду, где вы жили. Ты там никогда не был.` : ''),
  () => (S.legacy.flags && S.legacy.flags.benchSaved ? 'На лавке табличка: «Здесь начинали». Кто-то подкрасил буквы.' : ''),
  () => (S.legacy.flags && S.legacy.flags.soldBench ? 'Лавки в парке нет. На её месте паркинг. Странно, но ты помнишь, как тут сидел.' : ''),
];
function legacyApply528() {
  const l = S.legacy, w = world528();
  if (!l || w.legacyDone === l.round) return;
  w.legacyDone = l.round;
  const tr = Math.min(l.transport || 0, perk('garage') * 2);
  if (tr > S.transport) { S.transport = tr; S.transportBroken = false; }
  if (l.npc) w.npc = { ...l.npc };
  const lines = DEJAVU_528.map((f) => f()).filter(Boolean);
  if (lines.length) returnNotice({ key: 'legacy528:' + l.round, kind: 'news', title: `🔥 Байка у костра, круг ${l.round + 1}`, body: lines.join(' ') });
}
HOOKS.tick.push(() => { if (S.legacy && LOADED && S.storySeen) legacyApply528(); });
const storyTabLife528 = EXTRA_TABS.tasks.story;
EXTRA_TABS.tasks.story = () => {
  let html = storyTabLife528();
  const q = currentQuest(), w = world528(), used = w.skips || 0;
  if (q && !q.boss && !q.choice && !q.move && !q.frMove && !q.worldMove50 && !q.story30 && !goalsDone(q) && used < perk('oldties')) html = html.replace('<div class="q-reward">', '<button class="btn wide" data-act="questSkip528">🤝 Старые связи: пропустить главу</button><div class="q-reward">');
  return html;
};
ACTIONS.questSkip528 = () => {
  const q = currentQuest(), w = world528();
  if (!q || q.boss || q.choice || (w.skips || 0) >= perk('oldties')) return;
  w.skips = (w.skips || 0) + 1;
  S.quest.idx++;
  S.quest.base = { ...(S.counters || {}) };
  toast('🤝 Позвонил кому надо', 'good');
  save(); showScreen('tasks', 'story');
};
