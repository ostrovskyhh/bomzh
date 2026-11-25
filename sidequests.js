// Побочные поручения (Задания → Поручения): необязательные квесты от корешей, соседей и друзей.
// Кореша свои в каждом городе. Одновременно — до 3 поручений. Друзья и соседи дают повторяемые
// поручения (раз в несколько часов). Прогресс считается от момента, когда взял поручение.

const SIDE_MAX = 3;
const sg = (key, need, text) => ({ key, need, text });
const SIDE_GROUPS = { pals: '🍻 Кореша', gang: '🏴 Архив', friends: '🤝 Друзья', hood: '🏘️ Район' };

const SIDE = [
  // ---------- Кореша Засранска ----------
  { id: 'z_fish', group: 'pals', city: 'zas', who: '🧔', from: 'Михалыч', title: 'Уха по-засрански', text: 'Валера, сто лет не рыбачили! Сходи на рыбалку или на шашлыки — и мне хвостик принеси.',
    req: () => level() >= 2, reqText: '2 уровень', goals: [sg('leisureGame', 2, 'Сыграй 2 игры в «Отдыхе»')], reward: { money: 700, xp: 80, mood: 15 } },
  { id: 'z_bench', group: 'pals', city: 'zas', who: '🧔', from: 'Михалыч', title: 'Покрасить лавку', after: 'z_fish', text: 'Нашу лавку опять исписали. Найди краску по мусоркам — заодно посмотрим, что там ещё лежит.',
    goals: [sg('trash', 5, 'Обыщи 5 мусорок'), sg('events', 3, 'Переживи 3 уличных события')], reward: { money: 1500, xp: 150, caps: 1 } },
  { id: 'z_soup', group: 'pals', city: 'zas', who: '🥣', from: 'Тётя Валя', title: 'Суп для ночлежки', text: 'Валерочка, ребятам нечего есть. Поработай на госслужбе — там дают талоны — и приходи обедать с нами.',
    req: () => level() >= 4, reqText: '4 уровень', goals: [sg('stateShift', 2, 'Отработай 2 смены на госслужбе'), sg('eat', 3, 'Пообедай 3 раза')], reward: { money: 2500, xp: 250, buff: ['inlove', 10] } },
  { id: 'z_krivoy', group: 'pals', city: 'zas', crime: true, who: '🧔‍♂️', from: 'Кривой', title: 'Дельце у вокзала', text: 'Есть тема, Валера. Пару раз сработай чисто — и я поделюсь хорошим рыночным контактом.',
    req: () => level() >= 6, reqText: '6 уровень', goals: [sg('crimeOk', 2, 'Провернуть 2 удачных дела в «Криминале»')], reward: { money: 6000, xp: 300 } },
  { id: 'z_palych', group: 'pals', city: 'zas', who: '🏋️', from: 'Тренер Палыч', title: 'Сборы перед турниром', text: 'Хочешь, чтоб тебя на районе уважали? Пять тренировок и три победы — и я тебя запишу в свои.',
    req: () => level() >= 3, reqText: '3 уровень', goals: [sg('gym', 5, 'Сделай 5 тренировок'), sg('fightWin', 3, 'Выиграй 3 драки')], reward: { money: 3000, xp: 300, buff: ['pumped', 15] } },
  // ---------- Кореша Москвабада ----------
  { id: 'm_market', group: 'pals', city: 'msk', who: '🧕', from: 'Гульнара', title: 'Рынок с Гульнарой', text: 'Пойдём на рынок, научу торговаться по-столичному. Продай пару вещей — и пообедаем у моей тёти.',
    goals: [sg('marketSold', 5, 'Продай 5 вещей на рынке'), sg('eat', 3, 'Пообедай 3 раза')], reward: { money: 8000, xp: 400, mood: 15 } },
  { id: 'm_race', group: 'pals', city: 'msk', who: '😎', from: 'Стас «Самокат»', title: 'Гонка курьеров', text: 'Без обид за прошлое. Хочешь в нашу курьерскую тусовку? Пять смен и пара побед — и ты свой.',
    goals: [sg('shift', 5, 'Отработай 5 смен'), sg('fightWin', 2, 'Выиграй 2 драки')], reward: { money: 15000, xp: 500 } },
  { id: 'm_artur', group: 'pals', city: 'msk', crime: true, who: '🕶️', from: 'Барыга Артур', title: 'Посылка без вопросов', text: 'Отвезти, забрать, не задавать вопросов. Три дела — и у меня для тебя найдётся кое-что редкое.',
    req: () => level() >= 6, reqText: '6 уровень', goals: [sg('crimeOk', 3, 'Провернуть 3 удачных дела')], reward: { money: 30000, xp: 600, caps: 1 } },
  { id: 'm_roof', group: 'pals', city: 'msk', who: '🧕', from: 'Гульнара', title: 'Вечер на крыше', after: 'm_market', text: 'Соседи по хостелу устраивают вечер на крыше. Приходи отдохнуть — и чью-нибудь собаку выгуляй, я обещала.',
    goals: [sg('leisureGame', 2, 'Сыграй 2 игры в «Отдыхе»'), sg('petWalk', 1, 'Выгуляй питомца')], reward: { money: 12000, xp: 450, mood: 25 } },
  // ---------- Район (оба города) ----------
  { id: 'h_lotto', group: 'hood', who: '👵', from: 'Баба Зина', title: 'Счастливый билетик', text: 'Сынок, купи-ка лотерейки. Мне одной везёт, только когда кто-то рядом играет.',
    req: () => level() >= 3, reqText: '3 уровень', goals: [sg('lottery', 3, 'Купи 3 лотерейных билета')], reward: { money: 1200, xp: 120 }, every: 12 },
  { id: 'h_dog', group: 'hood', who: '🐕', from: 'Сосед', title: 'Выгул соседской собаки', text: 'Уезжаю на пару дней. Погуляй с моим и со своим питомцем — заплачу.',
    req: () => (S.pets || []).length > 0, reqText: 'нужен свой питомец', goals: [sg('petWalk', 2, 'Сходи на 2 прогулки с питомцем')], reward: { money: 2000, xp: 150 }, every: 8 },
  { id: 'h_date', group: 'hood', who: '💐', from: 'Цветочница', title: 'Романтический заказ', text: 'Помоги продать цветы: своди кого-нибудь на свидание — увидят, какой ты галантный, и разберут букеты.',
    req: () => level() >= 4, reqText: '4 уровень', goals: [sg('date', 2, 'Сходи на 2 свидания')], reward: { money: 2500, xp: 200 }, every: 12 },
  // ---------- Архив: можно сдать только поручения, завершённые до загрузки новой версии ----------
  { id: 'g_treasury', group: 'gang', who: '💰', from: 'Казначей банды', title: 'Взнос в общак', text: 'Общак сам себя не наполнит. Скинься — банде на апгрейды.',
    goals: [sg('clanDonate', 1, 'Внеси деньги в общак')], reward: { caps: 1, xp: 200 }, every: 8 },
  { id: 'g_hold', group: 'gang', who: '🏴', from: 'Главарь банды', title: 'Держать район', text: 'Конкуренты борзеют. Покажи на районе, чья тут власть.',
    goals: [sg('fightWin', 5, 'Выиграй 5 драк')], reward: { money: 4000, xp: 300 }, every: 6 },
  { id: 'g_wall', group: 'gang', who: '🧱', from: 'Главарь банды', title: 'Стенка на стенку', text: 'Сегодня стенка. Каждый боец на счету — не подведи своих.',
    goals: [sg('gangWall', 1, 'Сходи на «Стенку на стенку»')], reward: { money: 6000, xp: 400, caps: 1 }, every: 12 },
  { id: 'g_honor', group: 'gang', who: '⚔️', from: 'Бойцы банды', title: 'Честь банды', text: 'Говорят, в соседней банде есть резкие парни. Победи живого игрока — пусть знают наших.',
    goals: [sg('onlineWin', 1, 'Победи живого игрока в онлайн-бою')], reward: { money: 8000, xp: 500, caps: 1 }, every: 12 },
  { id: 'g_pot', group: 'gang', who: '🍲', from: 'Повар банды', title: 'Общий котёл', text: 'Скидываемся в котёл — вечером кому-то повезёт.',
    goals: [sg('gangPot', 1, 'Купи билет в «Котёл» банды')], reward: { money: 2000, xp: 150 }, every: 8 },
  {id:'g_yard_help',group:'gang',who:'🏡',from:'Соседи по двору',title:'Своими руками',text:'Открой двор банды и помоги с общей стройкой или историей. Нужен новый вклад после принятия поручения.',goals:[sg('yardHelp',1,'Засчитай 1 новый вклад во двор')],reward:{money:500,xp:100}},
  {id:'g_yard_story',group:'gang',who:'📖',from:'Свои люди',title:'Есть что вспомнить',text:'Прими участие в совместной истории и доведи её до финала.',after:'g_yard_help',goals:[sg('yardStory',1,'Заверши 1 новую общую историю с личным вкладом')],reward:{money:1500,xp:150,caps:1},every:48},
  {id:'g_district_prep',group:'gang',who:'📦',from:'Команда двора',title:'Каждая роль важна',text:'Запишись на подходящую роль и подготовь её новым действием. Новичок может помочь разведкой или снабжением.',after:'g_yard_help',goals:[sg('gangPrep',1,'Подготовь 1 новую роль к встрече')],reward:{money:500,xp:100}},
  {id:'g_district_assist',group:'gang',who:'🤝',from:'Свои люди',title:'Кто-то ждёт помощи',text:'Откликнись на просьбу товарища и выполни настоящее поручение для общего дела.',after:'g_yard_help',goals:[sg('gangAssist',1,'Выполни 1 новую просьбу товарища')],reward:{money:500,xp:100}},
  {id:'g_district_coop',group:'gang',who:'🚚',from:'Соседний двор',title:'Между дворами',text:'Помоги завершить общую поставку с союзной бандой. Вклад каждой стороны важен.',after:'g_yard_story',goals:[sg('gangCoop',1,'Заверши 1 новую поставку с личным вкладом')],reward:{money:1000,xp:150}},
  // ---------- Друзья (онлайн) ----------
  { id: 'f_gift', group: 'friends', who: '🎁', from: 'Сердце Валеры', title: 'Подарок корешу', text: 'Давно не радовал друзей. Отправь кому-нибудь подарок.',
    req: () => onlineOn(), reqText: 'в игре внутри Telegram', goals: [sg('friendGift', 1, 'Отправь подарок другу')], reward: { money: 1500, xp: 150 }, every: 12 },
  { id: 'f_rps', group: 'friends', who: '✊', from: 'Друзья', title: 'Кто кого', text: 'Сыграй с кем-нибудь в камень-ножницы-бумагу — проигравший угощает.',
    req: () => onlineOn(), reqText: 'в игре внутри Telegram', goals: [sg('rpsGame', 2, 'Сыграй 2 партии в КНБ')], reward: { money: 1500, xp: 150 }, every: 8 },
  { id: 'f_chat', group: 'friends', who: '💬', from: 'Район', title: 'Свой среди своих', text: 'Новых друзей в одиночку не найдёшь. Поболтай в чате района.',
    req: () => onlineOn(), reqText: 'в игре внутри Telegram', goals: [sg('chatMsg', 3, 'Напиши 3 сообщения в чат')], reward: { money: 1000, xp: 100 }, every: 24 },
];

function sideState() { if (!S.side) S.side = { active: {}, done: {} }; return S.side; }
function sideProg(q, g) { const a = sideState().active[q.id]; return Math.max(0, counter(g.key) - ((a && a.base[g.key]) || 0)); }
function sideReady(q) {
  if (q.group === 'gang') return sideState().active[q.id]?.retiredReady === true;
  return q.goals.every((g) => sideProg(q, g) >= g.need);
}
function snapshotRetiredSideQuests() {
  if (!S.side?.active) return;
  for (const q of SIDE) {
    const a = S.side.active[q.id];
    if (q.group === 'gang' && a && a.retiredReady === undefined) {
      a.retiredReady = q.goals.every((g) => sideProg(q, g) >= g.need);
    }
  }
}
HOOKS.load.push(snapshotRetiredSideQuests);
function sideActive() { return SIDE.filter((q) => q.group !== 'gang' && sideState().active[q.id]); }
function sideSlotsUsed() { return sideActive().length; }
function sideCityOk(q) { return !q.city || q.city === (typeof city === 'function' ? city() : 'zas'); }
function sideCdLeft(q) { const d = sideState().done[q.id]; return q.every && d ? Math.max(0, d.at + q.every * 3600000 - Date.now()) : 0; }
// Криминальные поручения — только тем, кто выбрал тёмную дорожку сюжета
function sideSkipped(q) { const s = sideState().skip; return s && s.id === q.id && s.until > Date.now(); }
function sideCrimeOk(q) { return !q.crime || (S.quest && S.quest.path === 'dark'); }
function sideAvailable(q) {
  const st = sideState();
  if (q.group === 'gang' || st.active[q.id] || !sideCityOk(q) || !sideCrimeOk(q)) return false;
  if (!q.every && st.done[q.id]) return false;
  if (q.after && !st.done[q.after]) return false;
  return true;
}
// Награда растёт с уровнем, но мягко — поручения не должны обгонять главы сюжета
function sideRewardScale() { return 1 + level() * 0.04; }
function sideReward(q) {
  const r = q.reward, k = sideRewardScale();
  return { ...r, money: r.money ? Math.round(r.money * k / 10) * 10 : 0, xp: r.xp ? Math.round(r.xp * (1 + level() * 0.02)) : 0 };
}
function sideRewardText(q) {
  const r = sideReward(q);
  return [r.money ? `${fmt(r.money)} ₽` : '', r.caps ? `${r.caps} кр.` : '', r.xp ? `${r.xp} XP` : '', r.mood ? `+${r.mood} 😊` : '', r.buff ? `${EFFECTS[r.buff[0]].emoji} ${EFFECTS[r.buff[0]].name}` : ''].filter(Boolean).join(' · ');
}

function sideCard(q, mode) {
  const head = `<div class="sq-head"><span class="sq-who">${q.who}</span><div><small>${SIDE_GROUPS[q.group]} · ${q.from}</small><b>${q.title}</b></div>${q.every ? `<i class="sq-rep">🔁 ${q.every} ч</i>` : ''}</div>`;
  if (mode === 'active') {
    const ready = sideReady(q);
    const missing=q.goals.filter(g=>sideProg(q,g)<g.need).map(g=>`${g.text} (${Math.min(g.need,sideProg(q,g))}/${g.need})`).join(' · ');
    return `<div class="sq-card active ${ready ? 'ready' : ''}">${head}<p>«${q.text}»</p>
      <div class="goals">${q.goals.map((g) => { const c = Math.min(g.need, sideProg(q, g)); return `<div class="goal ${c >= g.need ? 'ok' : ''}"><span>${c >= g.need ? '✅' : '▫️'} ${g.text}</span><b>${c}/${g.need}</b><div class="progress"><div style="width:${(c / g.need) * 100}%"></div></div></div>`; }).join('')}</div>
      <div class="q-reward">🎁 ${sideRewardText(q)}</div>
      <div class="btn-row"><button class="btn ${ready ? 'primary' : ''}" data-act="sideDone" data-id="${q.id}" ${ready ? '' : `disabled data-why="${esc('Ещё нужно: '+missing)}"`}>${ready ? 'Сдать поручение' : 'Выполняется…'}</button>
        ${q.group === 'gang' ? '' : `<button class="btn small" data-act="sideDrop" data-id="${q.id}">Отказаться</button>`}</div></div>`;
  }
  const ok = !q.req || q.req();
  const cd = sideCdLeft(q);
  const full = sideSlotsUsed() >= SIDE_MAX;
  const btn = !ok ? `<button class="btn small" disabled>🔒 ${q.reqText}</button>`
    : cd ? `<button class="btn small" disabled>⏳ ${leftText(cd)}</button>`
    : `<button class="btn primary small" data-act="sideTake" data-id="${q.id}" ${full ? 'disabled data-why="Сначала сдай или отмени одно из взятых поручений"' : ''}>Взять</button>`;
  return `<div class="sq-card ${ok && !cd ? '' : 'locked'}">${head}<p>${q.text}</p><div class="sq-foot"><small>🎁 ${sideRewardText(q)}</small>${btn}</div></div>`;
}

// Предложения (3.4): не весь список сразу, а 3 поручения. Не нравится — замени: раз в час бесплатно или за 30 крышек
const SIDE_OFFERS = 3, SIDE_REROLL_CAPS = 30, SIDE_REROLL_FREE = 3600000;
function sideOffers() {
  const st = sideState();
  st.offers = (st.offers || []).filter((id) => { const q = SIDE.find((x) => x.id === id); return q && sideAvailable(q); });
  const pool = SIDE.filter((q) => sideAvailable(q) && !sideSkipped(q) && !st.offers.includes(q.id) && (!q.req || q.req()) && !sideCdLeft(q));
  while (st.offers.length < SIDE_OFFERS && pool.length) st.offers.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].id);
  return st.offers.map((id) => SIDE.find((x) => x.id === id));
}
function sideFreeRerollIn() { return Math.max(0, (sideState().rerollAt || 0) + SIDE_REROLL_FREE - Date.now()); }
function sideRerollBtn(q) {
  const free = !sideFreeRerollIn();
  return `<button class="btn small" data-act="sideReroll" data-id="${q.id}" ${free || S.caps >= SIDE_REROLL_CAPS ? '' : `disabled data-why="Бесплатная замена через ${leftText(sideFreeRerollIn())} или нужно ${SIDE_REROLL_CAPS} крышек"`}>🔄 ${free ? 'Заменить' : `🟡 ${SIDE_REROLL_CAPS}`}</button>`;
}

EXTRA_TABS.tasks.side = () => {
  const st = sideState();
  snapshotRetiredSideQuests();
  const active = sideActive();
  const doneN = Object.values(st.done).reduce((a, d) => a + (d.n || 1), 0);
  let html = `<div class="info-card">🤝 Необязательные поручения от корешей, соседей и друзей. Деньги, опыт, крышки — и шанс найти марку для коллекции. Можно держать до ${SIDE_MAX} поручений сразу. Выполнено: <b>${doneN}</b></div>`;
  html += active.length ? `<div class="subhead">Взятые · ${sideSlotsUsed()}/${SIDE_MAX}</div>${active.map((q) => sideCard(q, 'active')).join('')}` : '';
  const archived = SIDE.filter((q) => q.group === 'gang' && sideReady(q));
  if (archived.length) html += `<div class="subhead">Завершённые поручения из архива</div>${archived.map((q) => sideCard(q, 'active')).join('')}`;
  const offers = sideOffers();
  const freeIn = sideFreeRerollIn();
  html += `<div class="subhead">Предлагают · ${offers.length}</div><small class="sq-note">Не нравится поручение — замени: ${freeIn ? `бесплатно через <b>${leftText(freeIn)}</b> или за 🟡 ${SIDE_REROLL_CAPS}` : '<b>одна бесплатная замена доступна</b>, дальше раз в час или за 🟡 ' + SIDE_REROLL_CAPS}</small>`;
  html += offers.length ? offers.map((q) => sideCard(q).replace(/<\/div><\/div>$/, `${sideRerollBtn(q)}</div></div>`)).join('') : '<div class="info-card">Новых поручений пока нет — загляни позже (повторяемые возвращаются через несколько часов)</div>';
  return html;
};

Object.assign(ACTIONS, {
  sideTake: (id) => {
    const q = SIDE.find((x) => x.id === id), st = sideState();
    if (!q || !sideAvailable(q) || !(sideState().offers || []).includes(id) || (q.req && !q.req()) || sideCdLeft(q) || sideSlotsUsed() >= SIDE_MAX) return;
    st.active[id] = { at: Date.now(), base: { ...(S.counters || {}) } };
    st.offers = (st.offers || []).filter((x) => x !== id);
    sfx('quest');
    toast(`📜 Поручение взято: ${q.title}`, 'good');
  },
  sideDrop: (id) => { delete sideState().active[id]; toast('Поручение отменено'); },
  sideReroll: (id) => {
    const st = sideState();
    if (!(st.offers || []).includes(id)) return;
    if (sideFreeRerollIn()) {
      if (S.caps < SIDE_REROLL_CAPS) { toast(`Нужно ${SIDE_REROLL_CAPS} крышек или подожди ${leftText(sideFreeRerollIn())}`, 'bad'); return; }
      S.caps -= SIDE_REROLL_CAPS;
    } else st.rerollAt = Date.now();
    // Убираем и не возвращаем сразу же то же самое: замена берёт другое поручение, если оно есть
    st.offers = st.offers.filter((x) => x !== id);
    st.skip = { id, until: Date.now() + SIDE_REROLL_FREE };
    sfx('whoosh'); track('sideReroll');
    save();
  },
  sideDone: (id) => {
    const q = SIDE.find((x) => x.id === id), st = sideState();
    if (!q || !st.active[id] || !sideReady(q)) return;
    const r = sideReward(q);
    delete st.active[id];
    st.done[id] = { at: Date.now(), n: ((st.done[id] && st.done[id].n) || 0) + 1 };
    if (r.money) addMoney(r.money);
    if (r.caps) addCaps(r.caps);
    if (r.xp) addXp(r.xp);
    if (r.mood) addMood(r.mood);
    if (r.buff) addEffect(r.buff[0], r.buff[1]);
    track('sideDone');
    sfx('quest'); confetti(40);
    const next = SIDE.find((x) => x.after === id && sideCityOk(x));
    resultModal({ emoji: q.who, title: `${q.from}: «Спасибо, выручил!»`, text: `Поручение «${q.title}» выполнено.<br>Награда: <b>${sideRewardText(q).replace(/ · /g, ', ')}</b>${next ? `<br><br>Новое поручение: «${next.title}» (${next.from})` : ''}`, btn: 'Отлично' });
    save();
  },
});

// Точка на вкладке, когда поручение можно сдать
HOOKS.hud.push(() => {
  const st = S.side;
  if (!st) return;
  if (SIDE.some((q) => st.active[q.id] && sideReady(q))) { const d = $('tasksDot'); if (d) d.classList.remove('hidden'); }
});
// Переезд: засранские поручения корешей отменяются (повторяемые остаются)
if (typeof doMove === 'function') doMove = (function (orig) {
  return function (family) { const st = sideState(); SIDE.filter((q) => q.city === 'zas').forEach((q) => delete st.active[q.id]); orig(family); };
})(doMove);
ACHS.push({ id: 'side', name: 'Свой человек', emoji: '🤝', key: 'sideDone', goals: [5, 25, 100, 300, 1000], unit: 'поручений' });

// Earned rewards, frames and counters from the retired multiplayer feature.
FRAMES.push(
  {id:'yard',name:'Свой двор',retired:true,need:()=>counter('yardStory')>=3||(S.prestigeFrames||[]).includes('yard')},
  {id:'crew',name:'Свои люди',retired:true,need:()=>(S.districtUnlocks||[]).includes('frame_crew')||(S.prestigeFrames||[]).includes('crew')},
  {id:'urban',name:'Легенда района',retired:true,need:()=>(S.districtUnlocks||[]).includes('frame_urban')||(S.prestigeFrames||[]).includes('urban')},
);
ACHS.push(
  {id:'yard_help',retired:true,name:'Свои руки',emoji:'🛠️',key:'yardHelp',goals:[1,10,50,150,500],unit:'поручений двора'},
  {id:'yard_story',retired:true,name:'Общая история',emoji:'📖',key:'yardStory',goals:[1,3,10,30,100],unit:'совместных историй'},
  {id:'yard_build',retired:true,name:'Наш двор',emoji:'🏡',key:'yardBuild',goals:[1,2,3],unit:'открытых объектов'},
  {id:'gang_prep',retired:true,name:'Команда готова',emoji:'📦',key:'gangPrep',goals:[1,5,20,50,150],unit:'подготовок к встречам'},
  {id:'gang_meet',retired:true,name:'Плечом к плечу',emoji:'🥊',key:'gangWar',goals:[1,5,20,50,150],unit:'командных встреч'},
  {id:'gang_win',retired:true,name:'Победа своих',emoji:'🏆',key:'gangWarWin',goals:[1,5,15,40,100],unit:'командных побед'},
  {id:'gang_coop',retired:true,name:'Добрые соседи',emoji:'🚚',key:'gangCoop',goals:[1,3,10,25,75],unit:'поставок с союзниками'},
  {id:'gang_assist',retired:true,name:'Своих не бросаем',emoji:'🤝',key:'gangAssist',goals:[1,5,15,40,100],unit:'выполненных просьб'},
  {id:'gang_region',retired:true,name:'Наш район',emoji:'🗺️',key:'gangRegion',goals:[1,3,5,10,25],unit:'сезонных знаков районов'},
);
