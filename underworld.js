// «Скользкая дорожка»: честный Валера может по сюжету свернуть в криминальный мир.
// Шнырь появляется в трудную минуту (пусто в кармане, грусть, проигрыш, долги) и втягивает шаг за шагом:
// подержать сумку → постоять на шухере → первое дело. На каждом шаге можно отказаться.
// Свернул — открывается вкладка «Криминал», но честная прибавка к работе пропадает. Завязать можно за откуп.
// Проверка — раз в 20 секунд и только простые условия, поэтому игру не нагружает.

const UW_GAP = 3 * GAME_DAY;        // между шагами — минимум 3 игровых дня
const UW_REFUSE_GAP = 8 * GAME_DAY; // отказал — Шнырь пропадает надолго
const UW_QUIT_GAP = 30 * GAME_DAY;  // завязал или отказался от дела — ещё дольше
const UW_STEPS = [
  { title: 'Сумка Шныря', emoji: '👜', text: '«Валерыч, выручай. Подержи сумку до вечера — только не заглядывай. Я в долгу не останусь»',
    yes: '👜 Взять сумку', yesHint: 'Деньги сразу. Михалыч не узнает… наверное', no: '🙅 «Сам держи»', noHint: 'Карма +1',
    reward: () => Math.round(1500 * scale()), after: 'Вечером Шнырь забрал сумку и сунул пачку купюр. Внутри что-то звякнуло — лучше не думать, что' },
  { title: 'Постой на шухере', emoji: '👀', text: '«Ты ж свой человек. Постой за углом, пока мы с Кривым кое-что заберём со склада. Если что — свистни»',
    yes: '👀 Постоять на шухере', yesHint: 'Больше денег, но розыск ⭐', no: '🙅 «Без меня»', noHint: 'Карма +1, Шнырь обидится',
    reward: () => Math.round(5000 * scale()), wanted: 1, after: 'Всё прошло тихо. Кривой хлопнул по плечу: «Наш человек». Михалыч вечером косо посмотрел на твои новые кроссовки…' },
  { title: 'Первое дело', emoji: '🕶️', text: '«Хватит по углам стоять. Ларёк на Садовой — касса без охраны. Ты с нами? Обратной дороги не будет»',
    yes: '🕶️ «Я с вами»', yesHint: 'Откроется криминальный мир. Честная прибавка к работе пропадёт', no: '😇 «Нет. Я завязываю»', noHint: 'Карма +2, Михалыч поможет отвязаться',
    reward: () => Math.round(12000 * scale()), wanted: 1, after: '' },
];

function uw() {
  if (!S.uw) S.uw = { step: 0, next: 0, refused: 0 };
  return S.uw;
}
function uwHonest() { return S.quest && S.quest.path === 'honest'; }
// Трудная минута — повод для Шныря
function uwHardTime() {
  return S.money < 300 * scale() || S.mood < 30 || (typeof casinoNet === 'function' && casinoNet() < -20000) || (S.rentDebt || 0) > 0 || hasEffect('heartbreak');
}

const _crimeOpenUW = crimeOpen;
crimeOpen = () => _crimeOpenUW() || !!S.underworld;
HOOKS.mods.push((m) => { if (S.underworld && uwHonest()) m.work /= 1.1; }); // честная прибавка пропадает

let UW_CHECK = 0;
HOOKS.tick.push(() => {
  const now = Date.now();
  if (now - UW_CHECK < 20000) return;
  UW_CHECK = now;
  if (!uwHonest() || S.underworld || !LOADED || !S.storySeen || level() < 6) return;
  const u = uw();
  if (u.step >= UW_STEPS.length) return;
  if (!u.next) { u.next = now + UW_GAP; return; }
  if (now < u.next || modalOpen() || S.busy || MG || (S.tut && !S.tut.done)) return;
  // Первый шаг — только в трудную минуту; дальше Шнырь сам находит
  if (u.step === 0 && !uwHardTime()) return;
  uwOffer(u.step);
});

function uwOffer(i) {
  const s = UW_STEPS[i];
  sfx('notify'); haptic('medium');
  openModal(`<div class="romance uw-pop"><div class="big-art" style="height:110px"><div class="rays bad"></div><div class="big-emoji" style="line-height:110px">🦊</div></div>
    <small class="uw-chapter">Скользкая дорожка · ${i + 1}/${UW_STEPS.length}</small>
    <h3>${s.emoji} ${s.title}</h3><p>Шнырь: ${s.text}</p>
    ${i === 0 ? '<p class="test-note">Ты выбрал честный путь… но сейчас тебе непросто</p>' : ''}
    <div class="btns" style="flex-direction:column;gap:8px">
      <button class="btn wide dark-path" data-act="uwChoice" data-id="yes">${s.yes}<small>${s.yesHint}</small></button>
      <button class="btn green wide" data-act="uwChoice" data-id="no">${s.no}<small>${s.noHint}</small></button></div></div>`, { center: true, locked: true });
}

ACTIONS.uwChoice = (choice) => {
  const u = uw(), s = UW_STEPS[u.step], now = Date.now();
  if (!s) { closeModal(); return; }
  if (choice === 'no') {
    const last = u.step === UW_STEPS.length - 1;
    S.karma = (S.karma || 0) + (last ? 2 : 1);
    u.refused++;
    track('uwRefuse');
    if (last) { u.step = 0; u.next = now + UW_QUIT_GAP; } // отказался от дела — дорожка начинается заново
    else u.next = now + UW_REFUSE_GAP;
    resultModal({ emoji: '😇', title: 'Честный выбор', text: last
      ? 'Михалыч поговорил со Шнырём «по-мужски». Тот отстал… надолго ли? Карма +2' : 'Шнырь сплюнул: «Ну и сиди на своих бутылках». Совесть чиста. Карма +1', btn: 'Правильно' });
    save();
    return;
  }
  const m = s.reward();
  addMoney(m);
  if (s.wanted) { S.wanted = Math.min(WANTED_MAX, (S.wanted || 0) + s.wanted); S.wantedAt = now; }
  S.karma = Math.max(0, (S.karma || 0) - 1);
  u.step++;
  u.next = now + UW_GAP * rand(1, 1.5);
  track('uwStep');
  if (u.step < UW_STEPS.length) {
    resultModal({ emoji: s.emoji, rays: 'bad', title: s.title, text: `${s.after}<br><br><b>+${fmt(m)} ₽</b>${s.wanted ? ` · розыск ${wantedStars()}` : ''}`, btn: 'Тсс…' });
  } else {
    S.underworld = true;
    S.underworldAt = now;
    track('uwFall');
    confetti(30);
    resultModal({ emoji: '🕶️', rays: 'bad', title: 'Ты свернул не на ту дорожку',
      text: `Касса ларька — <b>+${fmt(m)} ₽</b>. Шнырь ухмыляется: «Добро пожаловать в семью».<br><br>Открыта вкладка <b>«Досуг → 🕶️ Криминал»</b>. Честная прибавка к работе пропала — Михалыч всё понял. Захочешь назад — там же можно <b>завязать</b>.`, btn: 'Обратной дороги нет…' });
  }
  save();
};

// Завязать: откуп Шнырю, розыск должен быть чистым
function uwQuitPrice() { return Math.round(20000 * scale()); }
ACTIONS.uwQuit = () => {
  if (!S.underworld) return;
  if (S.wanted) { toast('Сначала пусть уляжется розыск — звёзды гаснут сами со временем', 'bad'); return; }
  const p = uwQuitPrice();
  if (S.money < p) return;
  S.money -= p;
  S.underworld = false;
  const u = uw(); u.step = 0; u.next = Date.now() + UW_QUIT_GAP;
  S.karma = (S.karma || 0) + 3;
  track('uwQuit');
  resultModal({ emoji: '🙏', title: 'Завязал', text: `Откупился от Шныря за ${fmt(p)} ₽. Михалыч налил чаю: «С возвращением, Валера». Честная прибавка к работе вернулась`, btn: 'Новая жизнь' });
  save();
};
const _crimeTabUW = EXTRA_TABS.fun.crime;
EXTRA_TABS.fun.crime = () => {
  const html = _crimeTabUW();
  if (!S.underworld || (S.quest && S.quest.path === 'dark')) return html;
  const p = uwQuitPrice();
  return `<div class="info-card uw-info">🦊 <b>Двойная жизнь.</b> Ты честный по сюжету, но связался со Шнырём. Пока ты в деле, честная прибавка к работе не действует.
      ${priceBtn('uwQuit', '', p, S.money >= p && !S.wanted, `🙏 Завязать · ${fmt(p)} ₽`).replace('class="btn', 'class="btn wide')}
      ${S.wanted ? '<small>Завязать можно, когда розыск обнулится</small>' : ''}</div>` + html;
};

ACHS.push(
  { id: 'uw_rock', name: 'Кремень', emoji: '🪨', fn: () => counter('uwRefuse'), goals: [1, 5, 15], unit: 'раз отказал Шнырю' },
  { id: 'uw_fall', name: 'Не та дорожка', emoji: '🕶️', fn: () => counter('uwFall'), goals: [1], unit: 'раз свернул в криминал с честного пути' },
);
