// Основной интерфейс игры: плитки разделов, живая сцена и витрина кейсов.
// 1) Навигация: 6 кнопок внизу (Дом · Валера · Деньги · Досуг · Люди · Цели), в каждой — плитки с живым статусом.
//    Плитка открывает старый раздел целиком, сверху — «‹ назад». Старые экраны и отрисовка не меняются.
// 2) Живой Валера и питомец: сами что-то делают, говорят фразы, показывают голод и усталость.
// 3) Премиальные кейсы: витрина с картинками, лента дропов игроков, открытие с подсветкой редкости.

function beta() { return true; } // Имя оставлено для совместимости модулей.

// ---------- 1. Навигация ----------
// Плитка: [экран, вкладка] старой игры или act — действие. alt — соседние вкладки одной плиткой (Врачи/Спорт)
const BETA_HUBS = [
  { id: 'home', e: '🏠', n: 'Дом' },
  { id: 'me', e: '🧔', n: 'Валера', sub: 'всё для себя', groups: [
    ['Дом и вещи', [{ s: 'shop', t: 'housing' }, { s: 'shop', t: 'clothes' }, { s: 'shop', t: 'transport' }, { s: 'shop', t: 'pets' }]],
    ['Забота о себе', [{ s: 'shop', t: 'food' }, { s: 'life', t: 'health', e: '❤️‍🩹', n: 'Здоровье', alt: [['health', '🏥 Врачи'], ['gym', '💪 Спорт']] }, { s: 'life', t: 'gym', hide: 1 }, { s: 'life', t: 'skills' }]],
    ['Сезон', [{ s: 'shop', t: 'season', wide: 1 }]],
  ] },
  { id: 'money', e: '💼', n: 'Деньги', sub: 'где заработать', groups: [
    ['Заработок', [{ s: 'life', t: 'work' }, { s: 'life', t: 'business' }, { s: 'life', t: 'study' }]],
    ['Торговля', [{ s: 'fun', t: 'market' }, { act: 'flea', id: 'flea', e: '🛍️', n: 'Барахолка' }]],
    ['Тёмная сторона', [{ s: 'fun', t: 'crime', wide: 1 }]],
  ] },
  { id: 'fun', e: '🎰', n: 'Досуг', sub: 'отдых и азарт', groups: [
    ['Азарт', [{ s: 'fun', t: 'casino', wide: 1, alt: [['casino', '🎰 Казино'], ['lotto', '🎟️ Лото']] }, { s: 'fun', t: 'lotto', hide: 1 }]],
    ['Движ', [{ s: 'fun', t: 'fights' }, { s: 'fun', t: 'rest' }]],
    ['Любовь и семья', [{ s: 'fun', t: 'dates', wide: 1 }]],
  ] },
  { id: 'people', e: '👥', n: 'Люди', sub: 'все игроки рядом', groups: [
    ['Свои', [{ s: 'fun', t: 'friends' }, { s: 'fun', t: 'clan' }]],
    ['Район', [{ act: 'openChat', id: 'chat', e: '💬', n: 'Чат района' }, { s: 'tasks', t: 'top' }]],
  ] },
  { id: 'goals', e: '🎯', n: 'Цели', sub: 'куда идти дальше', groups: [
    ['История', [{ s: 'tasks', t: 'story' }, { s: 'tasks', t: 'side' }]],
    ['Каждый день', [{ s: 'tasks', t: 'tasks' }, { s: 'tasks', t: 'pass' }]],
    ['Трофеи', [{ s: 'tasks', t: 'ach' }, { s: 'tasks', t: 'coll' }, { s: 'tasks', t: 'prestige' }]],
  ] },
];
const BNAV = { hub: 'home' };

function betaTabBtn(s, t) { return document.querySelector(`.seg[data-group="${s}"] button[data-tab="${t}"]`); }
function betaHubOf(s, t) {
  for (const h of BETA_HUBS) for (const [, tiles] of h.groups || []) for (const x of tiles) if (x.s === s && x.t === t) return h;
  return null;
}
function betaTileOf(s, t) {
  for (const h of BETA_HUBS) for (const [, tiles] of h.groups || []) for (const x of tiles) if (x.s === s && (x.t === t || (x.alt || []).some(([a]) => a === t))) return x;
  return null;
}
function betaTileShown(x) {
  if (x.hide) return false;
  if (x.act) return true;
  const b = betaTabBtn(x.s, x.t);
  return !!b && !b.classList.contains('hidden');
}
function betaTileName(x) {
  if (x.n) return [x.e, x.n];
  const b = betaTabBtn(x.s, x.t);
  return b ? [b.querySelector('i').textContent, b.querySelector('span').textContent] : ['•', x.t];
}

// Короткий живой статус под названием плитки. Любая ошибка — просто пустая строка
const BETA_STATUS = {
  'shop:housing': () => HOUSING[S.housing].name,
  'shop:clothes': () => { const b = (CLOTHES.body || []).find((c) => c.id === S.eq.body); return b ? `на тебе: ${b.name}` : ''; },
  'shop:transport': () => (S.transport ? `${TRANSPORT[S.transport].name} · бак ${Math.round(S.fuel ?? 100)}%` : 'пешком'),
  'shop:pets': () => { const p = activePet(); return p ? `${(S.petNames && S.petNames[p.id]) || p.name}${S.petSick ? ' болеет' : S.petFood <= 20 ? ' голоден' : ''}` : 'нет питомца'; },
  'shop:food': () => `сытость ${Math.round(S.food)}%`,
  'shop:season': () => 'ивент идёт',
  'life:health': () => `здоровье ${Math.round(S.health)} · форма ${Math.round(S.form || 0)}`,
  'life:skills': () => 'временные бонусы',
  'life:work': () => (S.busy && S.busy.type !== 'sleep' ? 'ты занят' : 'можно на смену'),
  'life:business': () => { const n = Object.keys(S.biz || {}).length; return n ? `${n} шт. · ${incomeMoney(businessTotals().cash)} в кассах` : 'пока нет'; },
  'life:study': () => (S.study ? `занятий ${S.study.done}/${S.study.need}` : 'выбери курс'),
  'fun:market': () => { const n = Object.values(S.inv || {}).reduce((a, b) => a + (b > 0 ? b : 0), 0); return n ? `${n} вещей на продажу` : 'скупка и перекуп'; },
  'act:flea': () => { const n = typeof fleaInv === 'function' ? fleaInv().length : 0; return n ? `${n} вещей из кейсов` : 'вещи из кейсов'; },
  'fun:crime': () => 'тёмный путь',
  'fun:casino': () => 'ракета · кейсы не как в кс · лото',
  'fun:fights': () => `рейтинг ${fmt((S.fight && S.fight.rating) || 1000)}`,
  'fun:rest': () => 'бар, баня, отдых',
  'fun:dates': () => { const g = S.girlfriend && GIRLS.find((x) => x.id === S.girlfriend); return S.married ? 'семья' : g ? g.name : 'познакомься'; },
  'fun:friends': () => 'в гости, бой, КНБ',
  'fun:clan': () => 'свой двор и общие истории',
  'act:chat': () => 'район и банда',
  'tasks:top': () => 'рейтинг игроков',
  'tasks:story': () => { const q = currentQuest(); return q ? q.title : 'всё пройдено'; },
  'tasks:side': () => 'просьбы корешей',
  'tasks:tasks': () => (hasClaimable() ? 'награда ждёт!' : 'задания дня'),
  'tasks:pass': () => `уровень ${passLevel()}`,
  'tasks:ach': () => `${Object.keys(S.ach || {}).length} из ${ACHS.length}`,
  'tasks:coll': () => 'редкие находки',
  'tasks:prestige': () => `★ ${S.prestige || 0}`,
};
function betaStatus(x) { try { return (BETA_STATUS[x.act ? 'act:' + x.id : `${x.s}:${x.t}`] || (() => ''))() || ''; } catch (e) { return ''; } }
function betaAlert(x, al) { if (x.act) return false; const g = al[x.s] || {}; return !!(g[x.t] || (x.alt || []).some(([a]) => g[a])); }
function betaHubAlert(h, al) { return (h.groups || []).some(([, tiles]) => tiles.some((x) => betaTileShown(x) && betaAlert(x, al))); }

function renderHub() {
  const h = BETA_HUBS.find((x) => x.id === BNAV.hub) || BETA_HUBS[1];
  const al = typeof sectionAlerts === 'function' ? sectionAlerts() : {};
  return `<div class="bh-head"><b>${h.e} ${h.n}</b><small>${h.sub || ''}</small></div>` + h.groups.map(([title, tiles]) => {
    const shown = tiles.filter(betaTileShown);
    if (!shown.length) return '';
    const cols = shown.length === 1 || shown.every((x) => x.wide) ? 1 : shown.length === 3 ? 3 : 2;
    return `<div class="bh-sub">${title}</div><div class="bh-grid c${cols}">${shown.map((x) => {
      const [e, n] = betaTileName(x), st = betaStatus(x), dot = betaAlert(x, al);
      return `<button class="bh-tile ${cols === 1 ? 'wide' : ''} ${dot ? 'alert' : ''}" data-act="betaOpen" data-id="${x.act ? 'act:' + x.act : x.s + ':' + x.t}">
        ${dot ? '<i class="bh-dot"></i>' : ''}<span class="bh-e">${e}</span><span class="bh-t"><b>${n}</b>${st ? `<small>${esc(st)}</small>` : ''}</span></button>`;
    }).join('')}</div>`;
  }).join('');
}
RENDER.hub = ['hubList', renderHub];

// «‹ Назад» над старым разделом; если у плитки несколько вкладок — переключатель
function betaBackBar(s) {
  const el = $('bb-' + s);
  if (!el) return;
  const t = TABS[s], x = betaTileOf(s, t), h = betaHubOf(x ? x.s : s, x ? x.t : t);
  if (!h) { el.innerHTML = ''; return; }
  const [e, n] = x ? betaTileName(x) : ['', ''];
  el.innerHTML = `<button class="bb-back" data-act="betaHub" data-id="${h.id}">‹ ${h.n}</button><b>${e} ${n}</b>
    ${x && x.alt ? `<div class="bb-alt">${x.alt.map(([a, label]) => `<button class="${a === t ? 'on' : ''}" data-act="betaTab" data-id="${s}:${a}">${label}</button>`).join('')}</div>` : ''}`;
}

function betaMarkTabbar() {
  document.querySelectorAll('#tabbar button[data-hub]').forEach((b) => b.classList.toggle('on', b.dataset.hub === BNAV.hub));
}

showScreen = (function (orig) {
  return function (name, tab) {
    if (name === 'game') BNAV.hub = 'home';
    else if (name !== 'hub') { const h = betaHubOf(name, tab || TABS[name]) || betaHubOf(betaTileOf(name, tab || TABS[name])?.s, betaTileOf(name, tab || TABS[name])?.t); if (h) BNAV.hub = h.id; }
    orig(name, tab);
    if (RENDER[name] && name !== 'hub') betaBackBar(name);
    betaMarkTabbar();
  };
})(showScreen);

function betaApply() {
  const tb = $('tabbar');
  if (!tb) return;
  document.body.classList.add('beta');
  if (S.settings) delete S.settings.beta;
  if (!$('screen-hub')) {
    document.querySelector('main').insertAdjacentHTML('beforeend', '<section class="screen" id="screen-hub"><div class="list" id="hubList"></div></section>');
    ['shop', 'life', 'fun', 'tasks'].forEach((s) => $('screen-' + s).insertAdjacentHTML('afterbegin', `<div class="beta-back" id="bb-${s}"></div>`));
  }
    // Точки «Жизни» и «Заданий» остаются в разметке: их включает старый код
    tb.innerHTML = BETA_HUBS.map((h) => `<button data-hub="${h.id}"><span>${h.e}</span>${h.n}<i class="dot hidden" data-hubdot="${h.id}"></i></button>`).join('')
      + '<i class="dot hidden" id="lifeDot" style="display:none"></i><i class="dot hidden" id="tasksDot" style="display:none"></i>';
    tb.querySelectorAll('button[data-hub]').forEach((b) => { b.onclick = () => ACTIONS.betaHub(b.dataset.hub); });
  BNAV.hub = 'home';
  showScreen('game');
}
HOOKS.load.push(betaApply);
HOOKS.hud.push(() => {
  if (!beta()) return;
  const al = typeof sectionAlerts === 'function' ? sectionAlerts() : {};
  document.querySelectorAll('#tabbar [data-hubdot]').forEach((d) => { const h = BETA_HUBS.find((x) => x.id === d.dataset.hubdot); d.classList.toggle('hidden', !h.groups || !betaHubAlert(h, al) || h.id === BNAV.hub); });
});

Object.assign(ACTIONS, {
  betaHub: (id) => {
    BNAV.hub = id;
    if (id === 'home') { showScreen('game'); return; }
    showScreen('hub');
  },
  betaOpen: (id) => {
    if (id.startsWith('act:')) { const a = id.slice(4); if (ACTIONS[a]) ACTIONS[a](); return; }
    const [s, t] = id.split(':');
    showScreen(s, t);
  },
  betaTab: (id) => { const [s, t] = id.split(':'); showScreen(s, t); },
});

// Кнопка «Назад» Telegram: в бете из раздела — к плиткам его группы, с плиток — домой (без беты — сразу домой)
function navBack() {
  if (beta() && currentScreen !== 'game' && currentScreen !== 'hub' && BNAV.hub && BNAV.hub !== 'home') { ACTIONS.betaHub(BNAV.hub); return; }
  showScreen('game');
}

// ---------- 2. Живой Валера и питомец ----------
const LV = { next: 0, sayAt: 0, petAt: 0, petX: 6 };
const LV_SAY = {
  any: ['Эх, хорошо-то как!', 'Михалыч опять куда-то пропал…', 'Где-то тут точно была бутылка', 'Сегодня мой день, чую!', 'Ещё чуть-чуть — и на шаверму!', 'Кто рано встаёт — тому бутылки', 'Главное — не унывать'],
  sun: ['Солнышко! Можно и на лавочке полежать', 'В такую погоду бутылки сами находятся'],
  rain: ['Ну и ливень… хоть зонт бы', 'Мокро, зато люди всё бросают'],
  snow: ['Бр-р-р, зуб на зуб не попадает', 'Шапку бы потеплее…'],
  night: ['Ночь, а сна ни в одном глазу', 'Тихо… только кошки шуршат'],
  rich: ['Чувствую себя олигархом!', 'Может, пентхаус прикупить?'],
  pet: ['{pet}, гуляем!', 'Хороший, хороший {pet}', '{pet}, не отставай!'],
  tap: ['Ай!', 'Сейчас-сейчас!', 'Ну я ж работаю!', 'Ещё бутылочку!', 'Не щекочи!'],
};
function lvPetName() { const p = activePet(); return p ? (S.petNames && S.petNames[p.id]) || p.name : ''; }
function lvPhrase(kind) {
  let pool = LV_SAY[kind] || [];
  if (kind === 'idle') {
    const w = typeof weatherNow === 'function' ? weatherNow() : '', d = typeof dayPart === 'function' ? dayPart() : '';
    pool = [...LV_SAY.any, ...(LV_SAY[w] || []), ...(d === 'night' ? LV_SAY.night : []), ...(S.money > 1e6 ? LV_SAY.rich : []), ...(activePet() ? LV_SAY.pet : [])];
  }
  return pick(pool).replace('{pet}', lvPetName());
}
function lvBubble(text, ms = 3200) {
  const sc = $('scene');
  if (!sc) return;
  let b = $('lvSay');
  if (!b) { sc.insertAdjacentHTML('beforeend', '<div class="lv-say" id="lvSay"></div>'); b = $('lvSay'); }
  b.textContent = text;
  b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  clearTimeout(lvBubble.t);
  lvBubble.t = setTimeout(() => b.classList.remove('show'), ms);
}
// Мысль-облачко: самое важное, что нужно Валере. Тап — сразу туда, где это решается
function lvNeed() {
  if (S.busy && S.busy.type === 'sleep') return null;
  if (S.food < 25) return ['🍗', 'shop:food'];
  if (S.health < 30) return ['💊', 'life:health'];
  if (S.energy < 10) return ['😴', ''];
  if (S.mood < 25) return ['🍺', 'fun:rest'];
  return null;
}
function lvAct(cls, ms) {
  const v = $('valera');
  if (!v) return;
  v.classList.remove('lv-wave', 'lv-sip', 'lv-look', 'lv-hop', 'lv-shiver', 'lv-yawn');
  void v.offsetWidth;
  v.classList.add(cls);
  setTimeout(() => v.classList.remove(cls), ms);
}
function lvTick() {
  const v = $('valera'), sc = $('scene');
  const on = beta() && currentScreen === 'game' && v && sc && document.visibilityState === 'visible';
  if (!sc) return;
  sc.classList.toggle('lv-on', !!on);
  if (!on) return;
  const now = Date.now(), sleeping = !!(S.busy && S.busy.type === 'sleep');
  v.classList.toggle('lv-sleep', sleeping);
  // Облачко нужды
  const need = lvNeed();
  let th = $('lvThink');
  if (need) {
    if (!th) { sc.insertAdjacentHTML('beforeend', '<button class="lv-think" id="lvThink" data-act="lvNeed"></button>'); th = $('lvThink'); }
    th.textContent = need[0]; th.dataset.id = need[1];
  } else if (th) th.remove();
  // Zzz во сне
  let z = $('lvZ');
  if (sleeping && !z) sc.insertAdjacentHTML('beforeend', '<div class="lv-z" id="lvZ"><i>z</i><i>z</i><i>Z</i></div>');
  if (!sleeping && z) z.remove();
  // Сам что-то делает раз в 6–12 с
  if (!sleeping && now > LV.next) {
    LV.next = now + 6000 + Math.random() * 6000;
    const w = typeof weatherNow === 'function' ? weatherNow() : '';
    const acts = S.energy < 15 ? ['lv-yawn'] : w === 'snow' ? ['lv-shiver', 'lv-look'] : S.mood >= 60 ? ['lv-wave', 'lv-sip', 'lv-look', 'lv-hop'] : ['lv-sip', 'lv-look'];
    const a = pick(acts);
    lvAct(a, a === 'lv-hop' ? 900 : 1600);
    if (a === 'lv-yawn' && Math.random() < 0.5) lvBubble('Ааа-ах… спать охота 😴');
    if (now > LV.sayAt && !need && Math.random() < 0.45) { LV.sayAt = now + 20000; lvBubble(lvPhrase('idle')); }
  }
  // Слот закреплён: питомец и пустая лежанка не перекрывают область тапов.
  const ps = $('petSlot');
  if (ps && ps.children.length && now > LV.petAt) {
    LV.petAt = now + 7000 + Math.random() * 8000;
    const hungry = S.petFood <= 20 || S.petSick;
    const x = 6;
    ps.classList.remove('lv-flip', 'lv-phop');
    LV.petX = x;
    ps.style.left = x + '%';
    ps.classList.toggle('lv-psleep', sleeping);
    let bowl = $('lvBowl');
    if (S.pet && hungry && !sleeping) { if (!bowl) sc.insertAdjacentHTML('beforeend', '<div class="lv-bowl" id="lvBowl">🥣<b>!</b></div>'); }
    else if (bowl) bowl.remove();
    // Подбежал к Валере — тот гладит, летят сердечки
    if (x === 30 && !hungry) setTimeout(() => { lvHearts(ps); if (Math.random() < 0.5) lvBubble(lvPhrase('pet')); }, 2600);
  }
}
function lvHearts(el) {
  const sc = $('scene');
  if (!sc || !el) return;
  const r = el.getBoundingClientRect(), s = sc.getBoundingClientRect();
  for (let i = 0; i < 3; i++) {
    const h = document.createElement('div');
    h.className = 'lv-heart';
    h.textContent = pick(['❤️', '💛', '🧡']);
    h.style.left = (r.left - s.left + r.width / 2 + (i - 1) * 14) + 'px';
    h.style.top = (r.top - s.top) + 'px';
    h.style.animationDelay = i * 150 + 'ms';
    sc.appendChild(h);
    setTimeout(() => h.remove(), 1800);
  }
}
setInterval(lvTick, 1000);
document.addEventListener('pointerdown', (e) => {
  if (!beta() || currentScreen !== 'game') return;
  if (e.target.closest('#valera')) {
    if (Math.random() < 0.07) lvBubble(lvPhrase('tap'), 1600);
    const ps = $('petSlot');
    if (ps && Math.random() < 0.12) { ps.classList.remove('lv-phop'); void ps.offsetWidth; ps.classList.add('lv-phop'); }
  } else if (e.target.closest('#petSlot')) lvHearts($('petSlot'));
}, true);
ACTIONS.lvNeed = (id) => {
  if (!id) { toast('Валера валится с ног — уложи его спать 💤'); return; }
  const [s, t] = id.split(':');
  showScreen(s, t);
};

// ---------- 3. Премиальные кейсы ----------
const CASE_ART = {
  box: '<svg class="art" viewBox="0 0 120 90"><path d="M20 34l40-14 40 14v38l-40 14-40-14z" fill="#B07A45"/><path d="M60 48v38l40-14V34z" fill="#8E5E31"/><path d="M20 34l40 14 40-14" fill="none" stroke="#6E4523" stroke-width="2"/><path d="M20 34l40-14 40 14-40 14z" fill="#C99360"/><path d="M38 27.6l40 14v10l-8 2.8v-9.6L30 30.6z" fill="#E8D7A8" opacity=".9"/></svg>',
  bag: '<svg class="art" viewBox="0 0 120 90"><path d="M44 30q16-22 32 0" fill="none" stroke="#1f3f7a" stroke-width="6" stroke-linecap="round"/><rect x="14" y="30" width="92" height="48" rx="22" fill="#2F6FD6"/><rect x="14" y="30" width="92" height="22" rx="11" fill="#4B8BF5"/><rect x="24" y="48" width="72" height="5" rx="2.5" fill="#E8EEF8"/><circle cx="20" cy="54" r="9" fill="#1f4fa6"/><circle cx="100" cy="54" r="9" fill="#1f4fa6"/><path d="M52 62l6 6 12-12" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  suit: '<svg class="art" viewBox="0 0 120 90"><rect x="46" y="12" width="28" height="14" rx="6" fill="none" stroke="#3b2b55" stroke-width="5"/><rect x="16" y="22" width="88" height="60" rx="10" fill="#7B4AD6"/><rect x="16" y="22" width="88" height="12" rx="6" fill="#9B6AF5"/><rect x="30" y="22" width="6" height="60" fill="#5b33a6"/><rect x="84" y="22" width="6" height="60" fill="#5b33a6"/><circle cx="54" cy="56" r="9" fill="#F2B33D"/><rect x="62" y="44" width="16" height="11" rx="2" fill="#E84393" transform="rotate(12 70 50)"/><rect x="44" y="64" width="18" height="10" rx="2" fill="#6CC36A" transform="rotate(-10 53 69)"/></svg>',
  safe: '<svg class="art" viewBox="0 0 120 90"><rect x="18" y="10" width="84" height="74" rx="8" fill="#3c3f4a"/><rect x="24" y="16" width="72" height="62" rx="5" fill="#5b6070"/><circle cx="60" cy="47" r="18" fill="#2a2d36"/><circle cx="60" cy="47" r="13" fill="#E84393"/><circle cx="60" cy="47" r="5" fill="#2a2d36"/><g stroke="#2a2d36" stroke-width="3"><path d="M60 29v6M60 59v6M42 47h6M72 47h6"/></g><rect x="84" y="36" width="6" height="22" rx="3" fill="#c9ccd6"/></svg>',
  fish: '<svg class="art" viewBox="0 0 120 90"><rect x="14" y="34" width="92" height="46" rx="8" fill="#1F8A57"/><rect x="14" y="28" width="92" height="16" rx="6" fill="#2BB673"/><rect x="48" y="16" width="24" height="14" rx="5" fill="none" stroke="#145c3a" stroke-width="5"/><rect x="54" y="40" width="12" height="9" rx="2" fill="#F2B33D"/><path d="M30 64q14-12 30 0q-16 12-30 0z" fill="#BFE9D2"/><path d="M60 64l9-7v14z" fill="#BFE9D2"/><circle cx="38" cy="62" r="2" fill="#145c3a"/><path d="M88 50v18q0 6-6 6" fill="none" stroke="#E8EEF8" stroke-width="3" stroke-linecap="round"/></svg>',
  msk: '<svg class="art" viewBox="0 0 120 90"><rect x="14" y="24" width="92" height="58" rx="10" fill="#14202e"/><rect x="14" y="24" width="92" height="58" rx="10" fill="none" stroke="#3FC1E8" stroke-width="2"/><g fill="#3FC1E8"><rect x="26" y="50" width="10" height="26"/><rect x="40" y="38" width="12" height="38"/><path d="M56 76V32l8-8 8 8v44z"/><rect x="76" y="44" width="10" height="32"/><rect x="88" y="56" width="8" height="20"/></g><g fill="#F2E6B8"><rect x="43" y="44" width="2" height="3"/><rect x="47" y="52" width="2" height="3"/><rect x="60" y="40" width="2" height="3"/><rect x="66" y="50" width="2" height="3"/><rect x="79" y="50" width="2" height="3"/></g><rect x="46" y="14" width="28" height="12" rx="5" fill="none" stroke="#2a3b52" stroke-width="5"/></svg>',
  gold: '<svg class="art" viewBox="0 0 120 100"><defs><linearGradient id="caseGoldA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE38A"/><stop offset="1" stop-color="#D08A12"/></linearGradient><linearGradient id="caseGoldB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1BF"/><stop offset="1" stop-color="#F2B33D"/></linearGradient></defs><path d="M16 46h88v42a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6z" fill="url(#caseGoldA)"/><path d="M16 46q0-30 44-30t44 30z" fill="url(#caseGoldB)"/><rect x="16" y="44" width="88" height="8" fill="#8A5D12"/><rect x="52" y="40" width="16" height="22" rx="3" fill="#6b4510"/><circle cx="60" cy="50" r="4" fill="#FFE38A"/><path d="M30 18l3-7 3 7 7 3-7 3-3 7-3-7-7-3z" fill="#fff"/><path d="M92 30l2-5 2 5 5 2-5 2-2 5-2-5-5-2z" fill="#fff"/></svg>',
};
const CASE_COLOR = { box: '#B07A45', fish: '#2BB673', suit: '#9B59F5', msk: '#3FC1E8', safe: '#E84393', gold: '#F2B33D' };
function rarColor(id) { return RARITY.find((r) => r.id === id).color; }

openCases = (function (orig) {
  return function () {
    const gold = CASES.find((c) => c.caps), rest = CASES.filter((c) => !c.caps);
    const btn = (c) => {
      const ok = level() >= c.level, can = c.caps ? S.caps >= c.caps : S.money >= c.price;
      if (!ok) return `<button class="pc-price" disabled data-why="Нужен ${c.level} уровень">🔒 ${c.level} ур.</button>`;
      return `<div class="case-buys"><button class="pc-price" data-act="caseOpen" data-id="${c.id}" ${can ? '' : `disabled data-why="Не хватает ${c.caps ? 'крышек' : 'денег'}"`}>${c.caps ? `🟡 ${c.caps}` : `${fmt(c.price)} ₽`}</button>${caseMultiHTML(c)}</div>`;
    };
    const loot = (c) => `<div class="pc-loot">${RARITY.map((r) => `<span style="--r:${r.color}">${c.loot[r.id][0][0]}</span>`).join('')}</div>`;
    openModal(`<div class="pc">
      <div class="pc-top"><h3>🎁 Кейсы не как в кс</h3><span class="pc-chip">💰 ${fmt(S.money)}</span><span class="pc-chip">🟡 ${fmt(S.caps)}</span></div>
      ${gold ? `<div class="pc-hero">${CASE_ART.gold}<span class="pc-badge">ПРЕМИУМ</span><b>${gold.name}</b><small>${gold.theme}. Вещи до ${fmt(Math.round(caseValue(gold) * 21))} ₽<br>${gold.loot.legend.map((x) => x[0] + ' ' + x[1]).join(', ')}</small>
        <div class="pc-odds">${RARITY.map((r) => `<span style="--r:${r.color}">${Math.round(r.chance * 1000) / 10}%</span>`).join('')}</div>
        <div class="pc-hero-btn">${btn(gold)}</div></div>` : ''}
      <div class="pc-grid">${rest.map((c) => `<div class="pc-card ${level() < c.level ? 'locked' : ''}" style="--c:${CASE_COLOR[c.id] || '#888'}">${level() < c.level ? `<span class="pc-lock">🔒 ${c.level} ур.</span>` : ''}${CASE_ART[c.id] || `<div class="art e">${c.emoji}</div>`}
        <b>${c.name}</b><small>${c.theme}</small>${loot(c)}${btn(c)}</div>`).join('')}</div>
      <div class="pc-feed hidden" id="pcFeed"></div>
      <div class="btns"><button class="btn wide" data-act="flea">🛍️ Барахолка (${fleaInv().length})</button><button class="btn wide" data-act="close">Закрыть</button></div></div>`);

  };
})(openCases);

caseOpen = (function (orig) {
  return function (id) {
    const c = CASES.find((x) => x.id === id);
    if (!c || level() < c.level) return;
    if (c.caps ? S.caps < c.caps : S.money < c.price) { toast('Не хватает на кейс', 'bad'); return; }
    if (c.caps) S.caps -= c.caps; else S.money -= c.price;
    track('caseOpen');
    const win = caseRollItem(c);
    const strip = Array.from({ length: 44 }, (_, i) => (i === 38 ? win : caseRollItem(c)));
    openModal(`<div class="pd"><div class="pc-top"><h3>${c.emoji} ${c.name}</h3></div>
      <div class="pd-roll"><div class="pd-mark"></div><div class="pd-strip" id="caseStrip">${strip.map((it, i) => `<div class="pd-it ${i === 38 ? 'win-cell' : ''}" style="--r:${rarColor(it.rar)}">${it.e}<small>${it.name}</small></div>`).join('')}</div></div>
      <div id="caseResult"></div></div>`, { center: true, locked: true });
    sfx('whoosh');
    const W = 86; // ширина ячейки с отступом
    const box = document.querySelector('.pd-roll');
    const target = 38 * W - box.clientWidth / 2 + W / 2 + rand(-28, 28);
    $('caseStrip').animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-target}px)` }], { duration: 4600, easing: 'cubic-bezier(.1,.75,.15,1)', fill: 'forwards' });
    let ticks = 0;
    const tick = setInterval(() => { if (++ticks > 28) clearInterval(tick); sfx('tick'); }, 140);
    setTimeout(() => {
      clearInterval(tick);
      const rar = RARITY.find((r) => r.id === win.rar), big = rar.id === 'legend' || rar.id === 'epic';
      sfx(big ? 'jackpot' : rar.id === 'rare' ? 'win' : 'coin');
      if (big) confetti(rar.id === 'legend' ? 150 : 70);
      haptic(rar.id === 'common' ? 'light' : 'success');
      fleaInv().push(win);
      track('caseItem');
      if (rar.id === 'legend') track('caseLegend');
      save();
      const cell = document.querySelector('.pd-it.win-cell');
      if (cell) cell.classList.add('win');
      if (onlineOn()) apiPost('cases/drop', { e: win.e, item: win.name, rar: rar.id, value: fleaPrice(win), name: playerName() }).catch(() => {});
      $('caseResult').innerHTML = `<div class="pd-reveal r-${rar.id}" style="--r:${rar.color}"><div class="pd-rays"></div>
        <span class="pd-rar">${big ? '★ ' : ''}${rar.name.toUpperCase()}${big ? ' ★' : ''}</span><div class="pd-item">${win.e}</div><b>${win.name}</b>
        <small>${qualityName(win)} · шанс ${Math.round(rar.chance * 1000) / 10}%</small><div class="pd-val">${fmt(fleaPrice(win))} ₽</div>
        <div class="pd-btns"><button class="btn primary wide" data-act="fleaSellLast">💰 Продать за ${fmt(fleaPrice(win))} ₽</button>
          <div class="pd-row2"><button class="btn" data-act="caseAgain" data-id="${c.id}">🔁 Ещё кейс</button><button class="btn" data-act="cases">📦 Оставить</button></div></div></div>`;
    }, 4800);
  };
})(caseOpen);
