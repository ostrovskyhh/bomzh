// Девушки сами проявляют инициативу.
// Одинокий Валера несколько игровых дней не знакомился — девушка подходит знакомиться сама.
// Есть девушка — изредка кто-то строит глазки; женат — совсем редко, раз в 5 игровых дней.
// Тогда моральный выбор: остаться честным или изменить (с риском спалиться, развода и ЗППП).

const GAME_DAY = MONTH_MS / 30; // 1 игровой день = 6 минут
const APPROACH_SINGLE = 3 * GAME_DAY;
const APPROACH_GF = 4 * GAME_DAY;
const APPROACH_WIFE = 5 * GAME_DAY;

const APPROACH_LINES = [
  '«Молодой человек, угостите даму кофе?»', '«Ой, а вы случайно не знаете, где тут остановка?»', '«Я вас давно тут замечаю… Вы такой загадочный»',
  '«У вас зажигалки не найдётся? А телефона?»', '«Помогите донести пакет? Я тут рядом живу»', '«Вы на актёра похожи. Ну, на одного…»',
];
const TEMPT_LINES = [
  '«Ой, а ты всё такой же… Может, посидим где-нибудь? Никто не узнает»', '«Скучно мне одной вечером. Составишь компанию?»',
  '«Слышала, ты теперь при деньгах. Угостишь старую знакомую?»', '«Твоя-то не ревнивая? Я бы такого одного не отпускала»',
];

HOOKS.track.push((key) => { if (key === 'date') S.romanceAt = Date.now(); });
meetGirl = (function (orig) { return function (id) { S.romanceAt = Date.now(); orig(id); }; })(meetGirl);

// Короткое имя: «Люська с вокзала» → Люська, «Соседка Зинка» → Зинка
function girlShort(g) { const w = g.name.split(' '); return g.name.includes(' с ') ? w[0] : w[w.length - 1]; }

function approachGap() { return S.married ? APPROACH_WIFE : S.girlfriend ? APPROACH_GF : APPROACH_SINGLE; }
function approachCandidates() {
  return GIRLS.filter((g) => g.id !== S.girlfriend && level() >= (g.req.level || 1) - 1);
}

HOOKS.tick.push(() => {
  if (!S.storySeen || !LOADED || !popupTurn(2) || S.busy || (S.tut && !S.tut.done) || level() < 3) return;
  const now = Date.now();
  if (!S.romanceAt) { S.romanceAt = now; return; }
  if (!S.approachAt) S.approachAt = now + approachGap();
  // Одинокого ждём, пока он сам несколько дней не знакомится; занятого — по расписанию
  if (!S.girlfriend && now - S.romanceAt < APPROACH_SINGLE) return;
  if (now < S.approachAt) return;
  S.approachAt = now + approachGap() * rand(1, 1.4);
  const pool = approachCandidates();
  if (!pool.length) return;
  // Одинокому чаще подходят незнакомые; занятого искушают в том числе бывшие
  const fresh = pool.filter((g) => !girlState(g.id).met);
  const g = !S.girlfriend && fresh.length ? pick(fresh) : pick(pool);
  if (S.girlfriend) temptation(g); else approach(g);
});

function approach(g) {
  if(typeof relationshipOffer518==='function'&&!RELATIONSHIP_MANUAL518){relationshipOffer518('approach',g);return;}
  sfx('notify'); haptic('medium');
  APPROACH = g.id;
  openModal(`<div class="romance">
      <div class="big-art" style="height:110px"><div class="rays"></div><div class="big-emoji" style="line-height:110px">${g.emoji}</div></div>
      <h3>${g.name} подошла сама</h3>
      <p>${pick(APPROACH_LINES)}</p>
      <p class="test-note">Ты давно ни с кем не знакомился — вот судьба и решила за тебя</p>
      <div class="btns" style="flex-direction:column;gap:8px">
        <button class="btn primary wide" data-act="romance" data-id="meet">😊 Познакомиться</button>
        <button class="btn wide" data-act="romance" data-id="skip">Вежливо отказать</button></div></div>`, { center: true, locked: true });
}

function temptation(g) {
  if(typeof relationshipOffer518==='function'&&!RELATIONSHIP_MANUAL518){relationshipOffer518('temptation',g);return;}
  sfx('notify'); haptic('heavy');
  APPROACH = g.id;
  const partner = GIRLS.find((x) => x.id === S.girlfriend);
  const who = S.married ? `жена ${girlShort(partner)}` : `девушка ${girlShort(partner)}`;
  openModal(`<div class="romance tempt">
      <div class="big-art" style="height:110px"><div class="big-emoji" style="line-height:110px">${g.emoji}</div></div>
      <h3>Искушение</h3>
      <p><b>${g.name}</b> строит тебе глазки: ${pick(TEMPT_LINES)}</p>
      <p class="test-note">Дома ждёт ${who}. Доверие: ${Math.round(S.trust === undefined ? 70 : S.trust)}/100</p>
      <div class="btns" style="flex-direction:column;gap:8px">
        <button class="btn green wide" data-act="romance" data-id="loyal">😇 «Извини, я ${S.married ? 'женат' : 'не один'}»<small>Доверие и любовь вырастут, карма +1</small></button>
        <button class="btn wide" data-act="romance" data-id="flirt">😏 Пофлиртовать и уйти<small>Немного радости. Могут донести (≈${Math.round(cheatRisk(0.2) * 100)}%)</small></button>
        <button class="btn wide dark-path" data-act="romance" data-id="cheat">🔥 Изменить<small>Много радости, но риск спалиться ≈${Math.round(cheatRisk(0.45) * 100)}% и ЗППП</small></button></div></div>`, { center: true, locked: true });
}
// Чем ниже доверие, тем пристальнее она следит
function cheatRisk(base) { return clamp(base + Math.max(0, (50 - (S.trust === undefined ? 70 : S.trust)) / 150) + (S.married ? 0.05 : 0), 0, 0.9); }

let APPROACH = null;

function caughtCheating(g, reason) {
  const partner = GIRLS.find((x) => x.id === S.girlfriend);
  if (S.married) { startDivorce(true, reason); return; }
  girlState(partner.id).rel = 30;
  S.girlfriend = null;
  addEffect('heartbreak', 5);
  addMood(-20);
  resultModal({ emoji: '😡', rays: 'bad', title: 'Спалился!', text: `${reason} Вы расстались. 💔 Разбитое сердце`, btn: 'Ой…' });
}

ACTIONS.romance = (choice) => {
  const g = GIRLS.find((x) => x.id === APPROACH);
  APPROACH = null;
  if (!g) { closeModal(); return; }
  const short = girlShort(g);
  S.romanceAt = Date.now();
  if (choice === 'meet') {
    const st = girlState(g.id);
    st.met = true; st.rel = Math.min(100, st.rel + 15);
    addMood(8); addXp(XP.meet || 5); track('approached');
    resultModal({ emoji: '💌', title: `${short} дала номер`, text: `Теперь её можно звать на свидание в «Досуг → Свидания». ❤️ +15, 😊 +8`, btn: 'Огонь!' });
    sfx('good');
  } else if (choice === 'skip') {
    closeModal(); toast(`${short} пожала плечами и ушла`);
  } else if (choice === 'loyal') {
    if (typeof addTrust === 'function') addTrust(8);
    if (typeof addLove === 'function' && S.married) addLove(5);
    S.karma = (S.karma || 0) + 1;
    addMood(3); addXp(10); track('faithful');
    resultModal({ emoji: '😇', title: 'Честный выбор', text: `${short} обиженно фыркнула, а ты пошёл домой с чистой совестью.<br>Доверие +8${S.married ? ', любовь +5' : ''}, карма +1`, btn: 'Домой' });
    sfx('good');
  } else if (choice === 'flirt') {
    track('flirt');
    if (Math.random() < cheatRisk(0.2)) {
      if (typeof addTrust === 'function') addTrust(-20);
      addMood(-5);
      resultModal({ emoji: '👀', rays: 'bad', title: 'Донесли!', text: `Соседка видела, как ты любезничал с ${short}, и всё рассказала. Доверие −20. Дома скандал`, btn: 'Эх' });
      sfx('bad');
    } else {
      addMood(8);
      if (typeof addTrust === 'function') addTrust(-3);
      resultModal({ emoji: '😏', title: 'Просто поболтали', text: `${short} смеялась над твоими шутками. Радость +8, но на душе неспокойно (доверие −3)`, btn: 'Ок' });
    }
  } else if (choice === 'cheat') {
    track('cheat');
    S.karma = Math.max(0, (S.karma || 0) - 1);
    if (Math.random() < cheatRisk(0.45)) {
      caughtCheating(g, `Тебя видели с ${short}!`);
      sfx('bad'); haptic('error');
      return;
    }
    addMood(20);
    if (typeof addTrust === 'function') addTrust(-10);
    let text = `Бурный вечер с ${short}. Радость +20. Никто не узнал… пока. Доверие −10 — совесть грызёт`;
    if (typeof STIS !== 'undefined' && Math.random() < g.std + 0.1) { addEffect(pick(STIS)); text += '<br><br>Через пару дней что-то зачесалось… Сходи к врачу, пока дома не заметили'; }
    resultModal({ emoji: '🔥', rays: 'bad', title: 'Измена', text, btn: 'Тсс…' });
  }
  save();
};
