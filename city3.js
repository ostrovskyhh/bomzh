// Города 4.2:
// • Новичок в новом городе: с собой не больше «стартовой суммы» города, остальное заморожено
//   (налоговая в Москвабаде, таможня в Мексике) и возвращается по 7% за каждую главу сюжета этого города.
//   Так развитие в каждом городе идёт постепенно, а накопленное не пропадает совсем.
// • Глава «Стартап» в Москвабаде — понятные цели под уровень главы и подсказки, где что купить.
// • Мультик побега в Мексику: 16 кадров, карта маршрута, схема мошенников, обмен денег и что едет с тобой.

// =====================================================================
// 1. Новичок в новом городе
// =====================================================================
const NEW_CITY_CASH = { msk: 15000, mex: 120 * USD_RATE };
const FROZEN_STEP = 0.07;
const FROZEN_WHO = { msk: 'Налоговая Засранска', mex: 'Таможня Веракруса' };
function newcomerCashText(c) { return c === 'mex' ? `$${NEW_CITY_CASH.mex / USD_RATE}` : `${fmt(NEW_CITY_CASH.msk)} ₽`; }

function applyNewcomer(c) {
  const cap = NEW_CITY_CASH[c];
  if (!cap || S.money <= cap) { S.frozen = null; return; }
  const extra = Math.floor(S.money - cap);
  S.money = cap;
  S.frozen = { city: c, total: extra, left: extra };
  track('frozen');
  save();
  queuePopup('frozen' + Date.now(), 1, () => resultModal({ emoji: '🧊', rays: 'bad', title: 'Ты здесь новичок',
    text: `${FROZEN_WHO[c]} заморозила деньги, которые ты привёз: <b>${fmt(extra)} ₽</b>. На руках — ${newcomerCashText(c)}: хватит на первое жильё и еду.<br><br>
      Каждая пройденная глава сюжета в этом городе размораживает <b>${Math.round(FROZEN_STEP * 100)}%</b> — около ${fmt(Math.round(extra * FROZEN_STEP))} ₽. Начинай с низов, как в первый раз!`, btn: 'Понятно' }));
}
doMove = (function (orig) { return function (opts) { orig(opts); applyNewcomer('msk'); }; })(doMove);
doMoveMex = (function (orig) { return function (opts) { orig(opts); applyNewcomer('mex'); }; })(doMoveMex);

// Разморозка по главам — только в том городе, куда переехал
HOOKS.track.push((key) => {
  const f = S.frozen;
  if (key !== 'questDone' || !f || f.left <= 0 || f.city !== city()) return;
  const give = Math.min(f.left, Math.max(1, Math.round(f.total * FROZEN_STEP)));
  f.left -= give;
  S.money += give; bump('resMoney');
  toast(`🧊 Разморожено +${fmt(give)} ₽${f.left > 0 ? ` · осталось ${fmt(f.left)} ₽` : ' · всё вернули!'}`, 'good');
  if (f.left <= 0) S.frozen = null;
});

// В окне переезда — честно предупреждаем
function newcomerNote(c) {
  return `<div class="move-box lose"><b>🧊 Новичок в новом городе</b>На руках будет не больше <b>${newcomerCashText(c)}</b>. Остальное заморозят и будут возвращать по ${Math.round(FROZEN_STEP * 100)}% за каждую главу сюжета там. Жильё, работа и криминальный ранг — с нуля</div>`;
}
moveStartModal = (function (orig) { return function () { orig(); const k = document.querySelector('#modalRoot .move-box.keep'); if (k && !document.querySelector('#modalRoot .nc-note')) k.insertAdjacentHTML('afterend', newcomerNote('msk').replace('move-box lose', 'move-box lose nc-note')); }; })(moveStartModal);
mexStartModal = (function (orig) { return function () { orig(); const k = document.querySelector('#modalRoot .move-box.keep'); if (k && !document.querySelector('#modalRoot .nc-note')) k.insertAdjacentHTML('afterend', newcomerNote('mex').replace('move-box lose', 'move-box lose nc-note')); }; })(mexStartModal);

// Замороженные деньги видны на вкладке сюжета
const _storyTabFrozen = EXTRA_TABS.tasks.story;
EXTRA_TABS.tasks.story = () => {
  const html = _storyTabFrozen();
  const f = S.frozen;
  if (!f || f.city !== city() || f.left <= 0) return html;
  return `<div class="info-card frozen-card">🧊 Заморожено <b>${fmt(f.left)} ₽</b> из ${fmt(f.total)} ₽ · каждая глава возвращает ~${fmt(Math.round(f.total * FROZEN_STEP))} ₽
    <div class="progress"><div style="width:${((f.total - f.left) / f.total) * 100}%"></div></div></div>` + html;
};

// =====================================================================
// 2. «Стартап» — понятные цели
// =====================================================================
const bizQ = QUESTS.find((q) => q.id === 'm_biz');
if (bizQ) Object.assign(bizQ, {
  title: 'Стартап: питч инвестору',
  text: 'Инвестор Марк готов вложиться в «Валера Inc.», но хочет увидеть, что дело настоящее: работающий бизнес, свои колёса для встреч и угол под офис. Студия 12 м² — это маленькая квартира, четвёртая ступень жилья: можно купить или снимать.',
  goals: [
    qv(() => Object.keys(S.biz || {}).length, 1, 'Открой любой бизнес — хватит «Постамата» (Магазин → Бизнес)'),
    qv(() => S.transport, 2, 'Купи транспорт для встреч — от электросамоката «Флеш» (Магазин → Транспорт)'),
    qv(() => Math.max(S.ownedHousing || 0, S.housing || 0), 4, 'Живи в «Студии 12 м²» — купи или сними (Магазин → Жильё)'),
    qv(() => level(), 16, 'Достигни 16 уровня'),
  ],
  reward: { money: 90000, caps: 1, xp: 1200 },
});
const xbizQ = QUESTS.find((q) => q.id === 'x_business');
if (xbizQ) xbizQ.goals = [
  qv(() => Object.keys(S.biz || {}).length, 1, 'Открой любой бизнес — хватит тележки тако (Магазин → Бизнес)'),
  qv(() => S.transport, 1, 'Купи транспорт — хоть осла Педро (Магазин → Транспорт)'),
  qv(() => Math.max(S.ownedHousing || 0, S.housing || 0), 4, 'Живи в «Касите с патио» — купи или сними (Магазин → Жильё)'),
];
Object.assign(STORY_SCENES, {
  m_biz: { lines: [
    ['🚀', 'Инвестор Марк', 'Валерий, ваша история — «с лавки до пентхауса» — это готовый питч! Но инвесторы верят цифрам, а не историям.'],
    ['🧳', 'Валера', 'Что нужно, чтобы вы вложились?'],
    ['🚀', 'Инвестор Марк', 'Три вещи. Работающий бизнес — пусть даже постамат для бутылок. Колёса, чтобы ездить на встречи. И угол под офис — студия 12 м² подойдёт, снимать тоже можно.'],
    ['🚀', 'Инвестор Марк', 'Всё есть в разделе «Магазин»: бизнес, транспорт, жильё. Приходите, когда будете готовы. И уровень посерьёзнее — 16-й.'] ] },
});

// =====================================================================
// 3. Мультик побега в Мексику
// =====================================================================
// Фоны: 'msk:3', 'mex:0' — сцены жилья нужного города; 'sea', 'map', 'port' — свои рисунки
const CUT_BG2 = {
  sea: () => `<svg viewBox="0 0 360 270" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="cbSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B5C8A"/><stop offset="1" stop-color="#0B2540"/></linearGradient>
    <linearGradient id="cbSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF9A5A"/><stop offset="1" stop-color="#FFD9A0"/></linearGradient></defs>
    <rect width="360" height="140" fill="url(#cbSky)"/><circle cx="270" cy="120" r="36" fill="#FFE08A"/><rect y="132" width="360" height="138" fill="url(#cbSea)"/>
    <g class="cb-waves"><path d="M0 150q20-8 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0" stroke="#7FB3E8" stroke-width="3" fill="none"/><path d="M-20 190q20-8 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0" stroke="#5A8FC8" stroke-width="3" fill="none"/></g></svg>`,
  seanight: () => `<svg viewBox="0 0 360 270" preserveAspectRatio="xMidYMid slice"><rect width="360" height="140" fill="#0B1530"/>${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 47) % 360}" cy="${(i * 29) % 120}" r="${i % 3 ? 1 : 1.8}" fill="#fff" opacity=".8"/>`).join('')}
    <circle cx="80" cy="50" r="18" fill="#F4F0E6"/><rect y="132" width="360" height="138" fill="#06142A"/><path d="M0 160q20-6 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0" stroke="#2A4A7A" stroke-width="2" fill="none" class="cb-waves"/></svg>`,
  map: () => `<svg viewBox="0 0 280 270" preserveAspectRatio="xMidYMid meet" style="background:#1E5A8A"><rect width="280" height="270" fill="#1E5A8A"/>
    <path d="M170 0h110v90q-30 10-50-6t-40-30q-14-20-20-54z" fill="#5E8A4A"/><path d="M0 120q30-10 50 10t30 50q-6 30-30 40t-20 50H0z" fill="#5E8A4A"/>
    <path d="M70 250q20-12 40-2t10 22H70z" fill="#4E7A3A"/>
    <path id="cbRoute" d="M232 46 Q200 80 170 110 T90 180 T52 226" stroke="#F2C744" stroke-width="3" fill="none" stroke-dasharray="6 6" class="cb-route"/>
    <circle cx="232" cy="46" r="6" fill="#E0412E"/><text x="270" y="30" text-anchor="end" font-size="13" font-weight="800" fill="#fff">Москвабад</text>
    <circle cx="52" cy="226" r="6" fill="#3CCB5A"/><text x="64" y="250" font-size="13" font-weight="800" fill="#fff">Веракрус</text>
    <text x="120" y="100" font-size="11" fill="#BFE0FF" font-style="italic">Атлантика</text><text x="150" y="200" font-size="10" fill="#BFE0FF" font-style="italic">Карибское море</text>
    <g><animateMotion dur="3.5s" fill="freeze" path="M232 46 Q200 80 170 110 T90 180 T52 226"/><text x="-12" y="8" font-size="22">🚢</text></g></svg>`,
  port: () => `<svg viewBox="0 0 360 270" preserveAspectRatio="xMidYMid slice"><rect width="360" height="170" fill="#16213A"/><rect y="170" width="360" height="100" fill="#0B1220"/>
    <rect x="20" y="90" width="70" height="80" fill="#2A3550"/><rect x="250" y="70" width="12" height="100" fill="#3A4560"/><path d="M256 70l60 20" stroke="#3A4560" stroke-width="6"/>
    <rect x="110" y="140" width="50" height="30" fill="#B3122E"/><rect x="164" y="140" width="50" height="30" fill="#2F7DD0"/><rect x="136" y="110" width="50" height="30" fill="#F2A33D"/>
    ${Array.from({ length: 6 }, (_, i) => `<circle cx="${40 + i * 55}" cy="60" r="2" fill="#FFE08A"/>`).join('')}</svg>`,
};
cutBg = (function (orig) {
  return function (bg) {
    if (typeof bg === 'string' && CUT_BG2[bg]) return CUT_BG2[bg]();
    const m = typeof bg === 'string' && bg.match(/^(msk|mex|zas):(\d)$/);
    if (m) {
      const set = m[1] === 'mex' && typeof MEX_SCENES !== 'undefined' ? MEX_SCENES : m[1] === 'msk' && typeof MSK_SCENES !== 'undefined' ? MSK_SCENES : SCENES;
      return `<svg viewBox="0 0 360 420" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">${set[+m[2]]()}</svg>`;
    }
    return orig(bg);
  };
})(cutBg);
// Информационная карточка поверх кадра (схема, обмен, списки)
cutNext = (function (orig) {
  return function () {
    orig();
    const c = CUT;
    const f = c && c.frames[c.i];
    const stage = $('csStage');
    if (!f || !stage) return;
    if (f.info) stage.insertAdjacentHTML('beforeend', `<div class="cs-info ${f.infoCls || ''}">${f.info}</div>`);
    // Счётчик: цифры «бегут» от 0 до значения
    stage.querySelectorAll('[data-count]').forEach((el) => {
      const to = +el.dataset.count, pre = el.dataset.pre || '', t0 = performance.now();
      el.textContent = pre + to.toLocaleString('ru-RU'); // без анимации (свёрнутое окно) — сразу итог
      const step = (now) => { if (!el.isConnected) return; const k = Math.min(1, (now - t0) / 1200); el.textContent = pre + Math.round(to * (1 - (1 - k) ** 3)).toLocaleString('ru-RU'); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  };
})(cutNext);

mexCut = function (opts) {
  const w = opts.partner === 'take' ? partnerOf() : null;
  const kids = w && S.married ? (S.kids || []).length : 0;
  const club = opts.club === 'sell' ? clubSellPrice() : 0;
  const rub = Math.max(0, S.money) + club;
  const got = Math.floor(rub / MEX_MOVE_RATE), fair = Math.floor(rub / USD_RATE);
  const onHand = Math.min(got, NEW_CITY_CASH.mex / USD_RATE);
  const keepWear = ['hat', 'body', 'shoes'].reduce((a, s) => a + (S.owned[s] || []).filter((id) => moveKeepsItem(s, id)).length, 0);
  const li = (e, t) => `<li><span>${e}</span>${t}</li>`;
  return [
    { bg: 'msk:5', night: true, actors: [{ a: 'valera', x: 44, mood: 'happy', say: 'Вот и вечер…' }], props: [{ e: '📱', x: 70, y: 42, anim: 'bounce' }], text: 'Москвабад. Валера наконец свой в большом городе. Телефон звонит с незнакомого номера.' },
    { bg: 'red', cam: 'shake', actors: [{ a: '📞', x: 72, anim: 'shake', say: 'Служба безопасности банка!' }, { a: 'valera', x: 28, mood: 'sad', anim: 'shake' }], text: '«На вас прямо сейчас оформляют кредит! Не кладите трубку!»' },
    { bg: 'night', actors: [{ a: 'valera', x: 18, mood: 'sad' }], info: `<b>📞 Как работает схема</b><ol>${li('1️⃣', 'Звонок «из банка» или «из полиции»')}${li('2️⃣', '«На вас кредит», «ваши деньги в опасности»')}${li('3️⃣', '«Помогите следствию, никому не говорите»')}${li('4️⃣', '«Курьер» забирает деньги у пожилых')}</ol><small>В жизни: положи трубку и перезвони в банк сам</small>`, infoCls: 'right', text: 'Мошенники давят на страх и спешку. Валера испугался — и попался.' },
    { bg: 'msk:3', actors: [{ a: '👵', x: 66, say: 'Вот, сынок, внук ведь в беде…' }, { a: 'valera', x: 30, mood: 'sad' }], props: [{ e: '💰', x: 50, y: 62, anim: 'bounce' }], text: 'По указке «майора Петрова» Валера забрал у бабушки Нины все её сбережения.' },
    { bg: 'night', cam: 'shake', actors: [{ a: '🚨', x: 72, anim: 'bounce' }, { a: '📺', x: 30, anim: 'shake', say: 'Ищут курьера!' }], text: 'Обман вскрылся. В новостях — фоторобот «курьера» с бородой и в кепке. Мошенники больше не отвечают.' },
    { bg: 'port', night: true, actors: [{ a: '🕶️', x: 70, say: 'Триста за доллар' }, { a: 'valera', x: 28, mood: 'sad', say: 'Грабёж!' }], props: [{ e: '💱', x: 48, y: 36, anim: 'float' }], text: 'Ночью — в порт. Теплоход «Ла Палома» уходит через час, а рубли меняет только барыга.' },
    { bg: 'port', night: true, actors: [], info: `<b>💱 Обмен у барыги</b><div class="cs-ex"><div><small>Рубли</small><b data-count="${rub}"></b> ₽</div><span>➜</span><div><small>По 300 ₽</small><b data-count="${got}" data-pre="$"></b></div></div>
      <small>По честному курсу 80 ₽ было бы $${fair.toLocaleString('ru-RU')} — потерял ${fair ? Math.round((1 - got / fair) * 100) : 0}%</small>`, text: `Все рубли — в доллары по грабительскому курсу. ${club ? 'Клуб продан перекупщику — тоже в обмен.' : ''}` },
    { bg: 'night', actors: [], info: `<div class="cs-cols"><div><b>🧳 Плывёт с тобой</b><ul>${li('💵', 'Доллары')}${li('🟡', 'Все крышки')}${li('⭐', 'Уровень, форма, сила')}${li('🏆', 'Достижения, престиж')}${keepWear ? li('🎩', `${keepWear} уник. вещ.`) : ''}${li('🤝', 'Друзья и банда')}${w ? li('💑', w.name + (kids ? ` и дети (${kids})` : '')) : ''}</ul></div>
      <div><b>🏙️ Остаётся</b><ul>${li('🏠', 'Жильё и бизнесы')}${li('🚗', 'Транспорт')}${li('👕', 'Обычная одежда')}${li('🎓', 'Дипломы и работа')}${li('🐈', 'Питомцы (Гульнара присмотрит)')}${li('🕶️', 'Криминальный ранг')}</ul></div></div>`, text: 'Один чемодан. Всё остальное придётся оставить.' },
    { bg: 'map', actors: [], text: 'Маршрут: Москвабад → порт → через Атлантику → Веракрус, Мексика. Почти три недели в пути.' },
    { bg: 'sea', actors: [{ a: '🚢', x: 50, anim: 'sail' }], props: [{ e: '🕊️', x: 20, y: 18, anim: 'float' }], fx: '🌊', text: 'Теплоход «Ла Палома». Берег Москвабада тает за кормой.' },
    { bg: 'seanight', actors: [{ a: 'valera', x: w ? 34 : 50, mood: 'sad', say: 'Прости, бабушка Нина…' }, ...(w ? [{ a: 'girl', x: 64 }] : [])], props: [{ e: '⭐', x: 76, y: 14, anim: 'float' }], text: w ? 'Ночь на палубе. Рядом — самые близкие. Валера обещает себе всё исправить.' : 'Ночь на палубе. Валера обещает себе всё исправить.' },
    { bg: 'red', cam: 'shake', actors: [{ a: '🚢', x: 50, anim: 'shake' }], fx: '💧', text: 'Шторм у Бермуд! Чемоданы летают по каюте, капитан Ромеро ругается по-испански.' },
    { bg: 'sea', actors: [{ a: '🐬', x: 26, anim: 'jump' }, { a: '🐬', x: 74, anim: 'jump' }], props: [{ e: '☀️', x: 78, y: 10, anim: 'float' }], fx: '✨', text: 'Утром — штиль и дельфины. Карибское море, вода цвета бирюзы.' },
    { bg: 'mex:0', actors: [{ a: '🧔🏽', x: 70, anim: 'in-right', say: '¡Bienvenido, amigo!' }, { a: 'valera', x: 30, mood: 'ok' }], props: [{ e: '🌴', x: 12, y: 40 }], text: 'Веракрус. Жара, пальмы, ни слова по-русски. Капитан Ромеро машет на прощание.' },
    { bg: 'mex:0', actors: [{ a: 'valera', x: 18, mood: 'ok' }], info: `<b>🌵 Что нужно знать</b><ul>${li('💵', 'Всё в долларах: $1 = 80 ₽ внутри игры')}${li('🛖', `Гамак у порта — даром, шалаш — ${usdText(MEX_HOUSING[1].price)}`)}${li('🗣️', 'Учи испанский — без него нет работы')}${li('🧊', `На руках $${onHand}, остальное заморозит таможня: по ${Math.round(FROZEN_STEP * 100)}% за главу`)}${li('🦂', 'Берегись бандитов и картеля')}</ul>`, infoCls: 'right', text: 'Здесь Валера снова новичок. Всё сначала — но опыт никуда не делся.' },
    { bg: 'mex:0', cam: 'zoom', actors: [{ a: 'valera', x: 46, mood: 'happy', anim: 'jump', say: '¡Hola, México!' }], props: [{ e: '🌵', x: 16, y: 60 }, { e: '🌮', x: 82, y: 30, anim: 'float' }, { e: '🎺', x: 70, y: 66, anim: 'bounce' }], fx: '🎉', text: 'Новая страна. Новая валюта. Новая жизнь. ¡Vámonos!' },
  ];
};
