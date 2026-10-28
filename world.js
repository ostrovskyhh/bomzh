// Мир вокруг: время суток и погода (влияют на доход и самочувствие), коллекции редкостей из мусорки,
// ночной клуб — топовый бизнес, где нанимаешь персонал.

// =====================================================================
// Время суток и погода
// =====================================================================

const WEATHER_SLOT = 30 * 60000; // погода меняется раз в полчаса
const WEATHERS = {
  sun: { name: 'Солнечно', emoji: '☀️', desc: 'Радость +0.3/мин', mods: { mpm: 0.3 } },
  cloud: { name: 'Облачно', emoji: '☁️', desc: 'Обычный день', mods: {} },
  rain: { name: 'Дождь', emoji: '🌧️', desc: 'Прохожие спешат: милостыня −30%. На улице мокнешь: радость −0.5/мин', mods: { pity: 0.7 }, street: { mpm: -0.5, hpm: -0.2 } },
  snow: { name: 'Снег', emoji: '❄️', desc: 'Холодно: на лавке здоровье −0.4/мин. Тапы −5%', mods: { tap: 0.95 }, street: { hpm: -0.4, mpm: -0.3 } },
  heat: { name: 'Жара', emoji: '🥵', desc: 'Энергия восстанавливается на 10% медленнее, бутылок больше: тапы +5%', mods: { regen: 0.9, tap: 1.05 } },
  fog: { name: 'Туман', emoji: '🌫️', desc: 'В тумане легче проворачивать дела: риск в криминале ниже', mods: {} },
};
const DAYPARTS = {
  morning: { name: 'Утро', emoji: '🌅', desc: 'Свежая голова: работа +5%', mods: { work: 1.05 } },
  day: { name: 'День', emoji: '🏙️', desc: 'Обычный ритм', mods: {} },
  evening: { name: 'Вечер', emoji: '🌆', desc: 'Люди добрее после работы: милостыня +15%', mods: { pity: 1.15 } },
  night: { name: 'Ночь', emoji: '🌙', desc: 'У баров щедрые: милостыня +40%, но тапы −10%', mods: { pity: 1.4, tap: 0.9 } },
};

function dayPart(d = new Date()) { const h = d.getHours(); return h >= 22 || h < 6 ? 'night' : h < 11 ? 'morning' : h < 18 ? 'day' : 'evening'; }
function slotRand(slot, salt) { let x = Math.sin(slot * 9301 + salt * 49297) * 233280; return x - Math.floor(x); }
function weatherNow(t = Date.now()) {
  const m = new Date(t).getMonth();
  const winter = m >= 10 || m <= 2, summer = m >= 5 && m <= 7;
  const r = slotRand(Math.floor(t / WEATHER_SLOT), 7);
  if (winter) return r < 0.35 ? 'snow' : r < 0.6 ? 'cloud' : r < 0.75 ? 'fog' : r < 0.85 ? 'rain' : 'sun';
  if (summer) return r < 0.35 ? 'sun' : r < 0.55 ? 'heat' : r < 0.75 ? 'cloud' : r < 0.9 ? 'rain' : 'fog';
  return r < 0.3 ? 'sun' : r < 0.55 ? 'cloud' : r < 0.8 ? 'rain' : 'fog';
}

HOOKS.mods.push((m) => {
  const apply = (d) => { for (const k in d || {}) { if (ADD_MODS.includes(k)) m[k] += d[k]; else m[k] *= d[k]; } };
  const w = WEATHERS[weatherNow()];
  apply(w.mods);
  if (S.housing <= 1) apply(w.street); // на лавке и в коробке погода ощущается сильнее
  apply(DAYPARTS[dayPart()].mods);
});
// Туман прикрывает криминал
if (typeof caught === 'function') caught = (function (orig) { return (c, perf) => (weatherNow() === 'fog' && Math.random() < 0.3 ? false : orig(c, perf)); })(caught);

let renderedWeather = '';
HOOKS.hud.push(() => {
  const w = weatherNow(), p = dayPart();
  const key = w + p;
  const chip = $('weatherChip');
  if (chip && chip.dataset.k !== key) { chip.dataset.k = key; chip.innerHTML = `${WEATHERS[w].emoji} ${WEATHERS[w].name} · ${DAYPARTS[p].emoji} ${DAYPARTS[p].name}`; }
  if (key === renderedWeather) return;
  renderedWeather = key;
  const fx = $('weatherFx');
  if (!fx) return;
  const drops = (cls, n) => Array.from({ length: n }, () => `<i class="${cls}" style="left:${rand(0, 100)}%;animation-delay:${rand(0, 2).toFixed(2)}s;animation-duration:${rand(0.6, 1.4).toFixed(2)}s"></i>`).join('');
  fx.className = `weather-fx w-${w} p-${p}`;
  fx.innerHTML = (w === 'rain' ? drops('rd', 40) : w === 'snow' ? drops('sf', 30) : '') + (p === 'night' ? '<b class="moon">🌙</b>' + drops('star', 12) : '');
});
ACTIONS.weatherInfo = () => {
  const w = WEATHERS[weatherNow()], p = DAYPARTS[dayPart()];
  openModal(`<h3>${w.emoji} ${w.name} · ${p.emoji} ${p.name}</h3>
    <div class="info-card"><b>${w.emoji} ${w.name}:</b> ${w.desc}${w.street ? '<br><small>Пока живёшь на лавке или в коробке, непогода бьёт сильнее.</small>' : ''}</div>
    <div class="info-card"><b>${p.emoji} ${p.name}:</b> ${p.desc}</div>
    <p class="test-note">Погода меняется каждые полчаса, время суток — по твоим часам.</p>
    <div class="btns"><button class="btn primary wide" data-act="close">Понятно</button></div>`, { center: true });
};

// =====================================================================
// Коллекции: редкости из мусорки и с дел. Собрал набор — бонус навсегда
// =====================================================================

const COLLECTIONS = [
  { id: 'stamps', name: 'Марки СССР', emoji: '📮', bonus: 'Тапы +5% навсегда', mods: { tap: 1.05 },
    items: [['s1', '«Гагарин»', '🚀'], ['s2', '«Олимпиада-80»', '🐻'], ['s3', '«Ленинград»', '🏛️'], ['s4', '«Луноход»', '🛰️'], ['s5', '«Ну, погоди!»', '🐺']] },
  { id: 'coins', name: 'Старые монеты', emoji: '🪙', bonus: 'Милостыня +10% навсегда', mods: { pity: 1.1 },
    items: [['c1', 'Копейка 1961', '🟤'], ['c2', 'Полтинник 1924', '⚪'], ['c3', 'Рубль «Олимпиада»', '🥇'], ['c4', 'Пятак 1730', '🟫'], ['c5', 'Червонец «Сеятель»', '🟡']] },
  { id: 'badges', name: 'Значки', emoji: '📛', bonus: 'Работа +5% навсегда', mods: { work: 1.05 },
    items: [['b1', '«Отличник ГТО»', '🏃'], ['b2', '«Ударник труда»', '⚒️'], ['b3', '«Турист СССР»', '🏕️'], ['b4', '«Донор»', '🩸'], ['b5', '«Октябрёнок»', '⭐']] },
  { id: 'beer', name: 'Пробки от редкого пива', emoji: '🍺', bonus: 'Курс обменника +5% навсегда', mods: { rate: 1.05 },
    items: [['p1', '«Жигулёвское» 1985', '🟠'], ['p2', '«Ячменный колос»', '🌾'], ['p3', '«Бархатное»', '🟤'], ['p4', '«Рижское»', '🔵'], ['p5', '«Адмиралтейское»', '⚓'], ['p6', '«Таёжное»', '🌲']] },
  { id: 'kinder', name: 'Игрушки из «Киндера»', emoji: '🥚', bonus: 'Радость +0.3/мин навсегда', mods: { mpm: 0.3 },
    items: [['k1', 'Бегемотик', '🦛'], ['k2', 'Пингвин', '🐧'], ['k3', 'Черепашка', '🐢'], ['k4', 'Крокодил', '🐊'], ['k5', 'Слоник', '🐘'], ['k6', 'Динозаврик', '🦕']] },
  { id: 'turbo', name: 'Вкладыши «Турбо»', emoji: '🏎️', bonus: 'Шанс крит-тапа +2% навсегда', mods: { crit: 0.02 },
    items: [['t1', 'Ferrari F40', '🏎️'], ['t2', 'Lamborghini', '🚗'], ['t3', 'Porsche 959', '🚙'], ['t4', 'Mercedes', '🚘'], ['t5', 'BMW M1', '🚕'], ['t6', 'Ford GT', '🛻']] },
];
const COLL_DROP = 0.22;   // шанс найти редкость в мусорке
const COLL_DUP_PRICE = 250; // дубликат Шнырь покупает сразу

function collHas(id) { return !!(S.coll && S.coll[id]); }
function collDone(set) { return set.items.every(([id]) => collHas(id)); }

HOOKS.mods.push((m) => { for (const set of COLLECTIONS) if (collDone(set)) for (const k in set.mods) { if (ADD_MODS.includes(k)) m[k] += set.mods[k]; else m[k] *= set.mods[k]; } });

function dropCollectible() {
  if (!S.coll) S.coll = {};
  const set = pick(COLLECTIONS);
  const [id, name, emoji] = pick(set.items);
  if (S.coll[id]) {
    const m = Math.round(COLL_DUP_PRICE * (1 + level() * 0.1));
    addMoney(m);
    setTimeout(() => toast(`${emoji} Дубликат: ${set.name} ${name}. Шнырь купил за ${fmt(m)} ₽`, 'good'), 900);
    return;
  }
  S.coll[id] = Date.now();
  track('collectible');
  const done = collDone(set);
  setTimeout(() => {
    if (done) {
      addCaps(3); confetti(100); sfx('ach');
      resultModal({ emoji: set.emoji, title: `Коллекция собрана: ${set.name}!`, text: `+3 крышки и бонус навсегда: <b>${set.bonus}</b>`, btn: 'Ура!' });
      track('collectionDone');
    } else {
      const have = set.items.filter(([x]) => collHas(x)).length;
      toast(`${emoji} Редкость для коллекции «${set.name}»: ${name} (${have}/${set.items.length})`, 'good');
      sfx('loot');
    }
  }, 900);
}

onTrashExtra = (function (orig) { return () => { orig(); if (Math.random() < COLL_DROP) dropCollectible(); }; })(onTrashExtra);

EXTRA_TABS.tasks.coll = () => {
  const total = COLLECTIONS.reduce((a, s) => a + s.items.length, 0);
  const have = COLLECTIONS.reduce((a, s) => a + s.items.filter(([x]) => collHas(x)).length, 0);
  return `<div class="info-card">🧩 Редкости попадаются в мусорках (шанс ${Math.round(COLL_DROP * 100)}%) и на криминальных делах. Собрал набор — бонус навсегда и 3 крышки. Дубликаты Шнырь покупает сразу.<br>Собрано <b>${have} из ${total}</b></div>` +
    COLLECTIONS.map((set) => {
      const n = set.items.filter(([x]) => collHas(x)).length, done = n === set.items.length;
      return `<div class="card card-col coll ${done ? 'current' : ''}"><div class="coll-head"><span>${set.emoji}</span><b>${set.name}</b><i>${n}/${set.items.length}</i></div>
        <div class="coll-items">${set.items.map(([id, name, e]) => `<div class="${collHas(id) ? 'got' : ''}" title="${name}"><span>${collHas(id) ? e : '❔'}</span><small>${collHas(id) ? name : '???'}</small></div>`).join('')}</div>
        <div class="card-desc">${done ? '✅' : '🎁'} ${set.bonus}</div></div>`;
    }).join('');
};

// =====================================================================
// Ночной клуб: самый дорогой бизнес, доход растёт от нанятого персонала
// =====================================================================

BUSINESSES.push({ id: 'club', name: 'Ночной клуб «Золотая крышка»', emoji: '🪩', price: 12000000, level: 24, income: 70000 });
const STAFF = [
  { id: 'guard', name: 'Охрана', emoji: '🕴️', price: 300000, salary: 2500, boost: 0.12, desc: 'Меньше драк — реже поломки' },
  { id: 'bar', name: 'Бармен', emoji: '🍸', price: 400000, salary: 3000, boost: 0.18, desc: 'Коктейли продаются лучше' },
  { id: 'dj', name: 'Диджей', emoji: '🎧', price: 800000, salary: 6000, boost: 0.25, desc: 'Танцпол забит до утра' },
  { id: 'dancers', name: 'Танцоры', emoji: '💃', price: 600000, salary: 4500, boost: 0.2, desc: 'VIP-гости остаются дольше' },
  { id: 'promo', name: 'Промоутер', emoji: '📣', price: 500000, salary: 3500, boost: 0.15, desc: 'Очередь на входе каждый вечер' },
];
const STAFF_MAX = 3;
const PARTY_CD = 6 * 3600;

function staffLvl(id) { return (S.clubStaff && S.clubStaff[id]) || 0; }
function clubMult() { return 1 + STAFF.reduce((a, s) => a + s.boost * staffLvl(s.id), 0); }
function clubSalary() { return STAFF.reduce((a, s) => a + s.salary * staffLvl(s.id), 0); }

bizIncome = (function (orig) {
  return (b, st) => (b.id === 'club' ? Math.max(0, orig(b, st) * clubMult() - clubSalary()) : orig(b, st));
})(bizIncome);

const _bizTab = EXTRA_TABS.life.business;
EXTRA_TABS.life.business = () => {
  let html = _bizTab();
  if (!S.biz.club) return html;
  const cdP = cdLeft('clubParty');
  const party = incomePartyGain();
  html += `<div class="subhead">🪩 Персонал клуба · доход ×${clubMult().toFixed(2)}, зарплаты −${fmt(clubSalary())} ₽/ч</div>
    ${STAFF.map((s) => { const l = staffLvl(s.id), cost = s.price * (l + 1); return card({ thumb: s.emoji, title: `${s.name} ${l ? `<span class="rarity rare">${l}/${STAFF_MAX}</span>` : ''}`,
      desc: `${s.desc}<br>+${Math.round(s.boost * 100)}% к доходу · зарплата ${fmt(s.salary)} ₽/ч за уровень`,
      btn: l >= STAFF_MAX ? '<button class="btn" disabled>MAX</button>' : priceBtn('hireStaff', s.id, cost, S.money >= cost, `${l ? '⬆️' : 'Нанять'} ${fmt(cost)} ₽`) }); }).join('')}
    ${card({ thumb: '🎉', title: 'VIP-вечеринка', desc: `Раз в 6 часов: сейчас в кассу ${incomeHTML('biz-party','club')} (до налога). Нужен диджей`,
      btn: cdP > 0 ? timerBtn(S.cd.clubParty) : `<button data-income-party="1" class="btn ${staffLvl('dj')&&party>0 ? 'primary' : ''}" data-act="clubParty" ${staffLvl('dj')&&party>0 ? '' : 'disabled data-why="Нужны диджей и свободное место в кассе"'}>Устроить</button>` })}`;
  return html;
};

Object.assign(ACTIONS, {
  hireStaff: (id) => {
    const s = STAFF.find((x) => x.id === id);
    const l = staffLvl(id), cost = s.price * (l + 1);
    if (!S.biz.club || l >= STAFF_MAX || S.money < cost) return;
    S.money -= cost;
    if (!S.clubStaff) S.clubStaff = {};
    S.clubStaff[id] = l + 1;
    track('staff');
    sfx('buy');
    toast(`${s.emoji} ${s.name}: ${l ? `уровень ${l + 1}` : 'нанят'}! Доход клуба ×${clubMult().toFixed(2)}`, 'good');
  },
  clubParty: () => {
    const st = S.biz.club;
    if (!st || cdLeft('clubParty') > 0 || !staffLvl('dj')) return;
    const m = incomePartyGain();
    if(m<=0){toast('Сначала забери деньги из кассы клуба','bad');return;}
    setCd('clubParty', PARTY_CD);
    st.cash += m;
    track('clubParty');
    confetti(80); sfx('jackpot');
    resultModal({ emoji: '🪩', title: 'VIP-вечеринка удалась!', text: `Звёзды района до утра на танцполе. В кассу +${fmt(m)} ₽`, btn: 'Огонь' });
  },
});
