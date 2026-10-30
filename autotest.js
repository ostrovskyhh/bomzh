// Автотест игры (3.3). Работает только по адресу index.html#autotest — игрокам ничего не делает.
// Запуск перед выкладкой: tests\run_all.ps1 (открывает игру в Edge без окна и читает итог).
// 1) Все мини-игры обоих городов: работы, уроки, досуг, свидания, дети, криминал, тюрьма, спортзал, игры с партнёром.
//    Каждую «играем» случайными нажатиями и ждём конца. Не закончилась вовремя — зависание. Ошибка JS — провал.
// 2) Экономика и правила: цены вещей из кейсов, выгода кейсов, ночь казино, автовывод ракеты, сон с кофе, бой, очередь окон.
(function () {
  if (!/^#autotest/.test(location.hash)) return;
  const RES = { games: [], checks: [], errors: typeof BugReport !== 'undefined' ? BugReport.build().errors.filter(e=>e.message!=='Не загрузился ресурс').map(e=>e.message) : [] };
  let CUR = null;
  window.addEventListener('error', (e) => { const m = `${e.message} @${(e.filename || '').split('/').pop()}:${e.lineno}`; RES.errors.push(m); if (CUR) CUR.errors.push(m); });
  window.addEventListener('unhandledrejection', (e) => { const m = 'promise: ' + (e.reason && e.reason.message || e.reason); RES.errors.push(m); if (CUR) CUR.errors.push(m); });
  // В Edge без окна requestAnimationFrame не тикает — гоняем кадры таймером
  window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
  const sl = (ms) => new Promise((r) => setTimeout(r, ms));
  const check = (name, ok, info = '') => RES.checks.push({ name, ok: !!ok, info: String(info) });

  // Сыграть одну мини-игру: start(fin) запускает её, fin — колбэк конца (если игра его даёт)
  async function play(name, start, limitSec) {
    CUR = { name, errors: [] };
    try { closeModal(); } catch (e) { /* нет окна */ }
    MG = null;
    S.energy = maxEnergy(); S.food = maxFood(); S.health = maxHealth(); S.money = Math.max(S.money, 1e7); S.cd = {};
    let ended = false;
    const t0 = Date.now();
    try { start(() => { ended = true; }); } catch (e) { CUR.errors.push('start: ' + e.message); }
    // Перед первой игрой каждого вида показываются правила — жмём «Начать»
    for (let i = 0; i < 20 && !MG; i++) { await sl(50); if (typeof MG_PENDING !== 'undefined' && MG_PENDING && ACTIONS.mgRulesGo) ACTIONS.mgRulesGo(); }
    if (!MG) { RES.games.push({ name, ok: false, why: 'игра не запустилась', errors: CUR.errors }); return; }
    const mg = MG;
    const limit = (limitSec || 45) * 1000;
    let taps = 0;
    while (!mg.over && Date.now() - t0 < limit) {
      await sl(120);
      const arena = $('mgArena');
      if (!arena) continue;
      const btns = [...document.querySelectorAll('#modalRoot .mg button:not([disabled]):not([data-act="cancelMiniGame"]), #mgArena [data-i], #mgArena .mg-t, #mgArena span, #mgArena i, #mgArena div')].filter((b) => b.offsetParent !== null || b.getClientRects().length);
      if (!btns.length) continue;
      const b = btns[Math.floor(Math.random() * btns.length)];
      const r = b.getBoundingClientRect();
      const opt = { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
      try { b.dispatchEvent(new PointerEvent('pointerdown', opt)); b.dispatchEvent(new PointerEvent('pointerup', opt)); b.dispatchEvent(new MouseEvent('click', opt)); } catch (e) { /* элемент исчез */ }
      taps++;
    }
    await sl(600);
    const ok = mg.over && !CUR.errors.length;
    RES.games.push({ name, ok, why: mg.over ? (CUR.errors.length ? 'ошибки' : '') : `не закончилась за ${Math.round(limit / 1000)} с (зависла)`, sec: Math.round((Date.now() - t0) / 1000), taps, errors: CUR.errors.slice(0, 3) });
    try { closeModal(); } catch (e) { /* ок */ }
    MG = null;
    await sl(300);
  }

  async function allGames(cityId) {
    S.city = cityId; applyCity();
    const tag = { msk: 'МСК', mex: 'МЕКС', fr:'ФР' }[cityId] || 'ЗАС';
    for (const j of JOBS) await play(`${tag} работа: ${j.name}`, (fin) => startShiftGame(j, fin), 50);
    for (const st of [1, 2, 3, 4, 5]) if (LESSON_GAMES[st] || cityId !== 'zas') await play(`${tag} урок ${st}`, () => startLessonGame(st), 60);
    if (cityId === 'msk') return;
    const pre = cityId === 'mex' ? 'МЕКС ' : cityId === 'fr' ? 'ФР ' : '';
    // Mexican loteria can use all 26 calls: 0.8 + 26*2.2 + 0.4 = 58.4 s without a winning line.
    // The former generic 55 s budget cut off a valid low-score game. Rules/timings stay unchanged.
    for (const [id, g] of Object.entries(LEISURE_GAMES)) await play(`${pre}досуг: ${id}`, () => runGame({ title: g.title, hint: g.hint, duration: g.duration, setup: (mg) => g.run(mg), finish: () => {} }), cityId === 'mex' && id === 'thimbles' ? 65 : (g.duration || 40) + 15);
    for (const [id, g] of Object.entries(DATE_GAMES)) await play(`${pre}свидание: ${id}`, () => runGame({ title: g.title, hint: g.hint, duration: g.duration, setup: g.setup, finish: () => {} }), (g.duration || 40) + 15);
    for (const [id, g] of Object.entries(KID_GAMES)) await play(`${pre}дети: ${id}`, () => runGame({ title: g.title, hint: g.hint, duration: g.duration, setup: g.setup, finish: () => {} }), (g.duration || 40) + 15);
    for (const c of CRIMES) if (c.game) await play(`${pre}криминал: ${c.id}`, () => runGame({ title: c.game.title, hint: c.game.hint, duration: c.game.duration, setup: c.game.setup, finish: () => {} }), (c.game.duration || 40) + 15);
    for (const a of JAIL_ACTS) if (a.game) await play(`${pre}тюрьма: ${a.id}`, () => runGame({ title: a.game.title, hint: a.game.hint, duration: a.game.duration, setup: a.game.setup, finish: () => {} }), (a.game.duration || 40) + 15);
    for (const [id, g] of Object.entries(GYM_GAMES)) await play(`${pre}зал: ${id}`, () => runGame({ title: g.title, hint: g.hint, duration: 0, setup: (mg) => gameReps(mg, g), finish: () => {} }), 130); // без таймера: если не доиграть, сторож завершает за 2 мин
    for (const p of PARTNER_GAMES) { const g = p.gm || p; if (g && g.setup) await play(`${pre}партнёр: ${g.title}`, () => runGame({ title: g.title, hint: g.hint, duration: g.duration, setup: g.setup, finish: () => {} }), (g.duration || 40) + 15); }
  }

  async function economy() {
    // Вещи из кейсов: одна вещь одного качества — разброс не больше ±5%; выгода кейса 80–92%
    for (const c of CASES) {
      const by = {};
      let sum = 0;
      for (let i = 0; i < 20000; i++) { const it = caseRollItem(c); sum += it.value; (by[it.name + it.q] = by[it.name + it.q] || []).push(it.value); }
      let worst = 0;
      Object.values(by).forEach((v) => { if (v.length > 20) { const mid = (Math.max(...v) + Math.min(...v)) / 2; worst = Math.max(worst, (Math.max(...v) - mid) / mid); } });
      const ev = sum / 20000 / caseValue(c);
      check(`кейс ${c.id}: разброс цены ≤5%`, worst <= 0.05, `±${(worst * 100).toFixed(1)}%`);
      check(`кейс ${c.id}: выгода 80–92%`, ev >= 0.8 && ev <= 0.92, ev.toFixed(2));
    }
    // Ночь казино 4.2: +15% к чистому выигрышу, бонус за ночь ограничен
    closeModal(); S.admNightUntil = Date.now() + 60000; S.admin = true; showScreen('fun', 'casino');
    (0, eval)('BJ = { bet: 1000 }'); NIGHT_LAST_BET = 1000; nightBook().bonus = 0;
    let m0 = S.money; addMoney(3000); const win = S.money - m0;
    check('ночь казино: +15% к чистому выигрышу', win === 3300, win);
    nightBook().bonus = nightBonusCap() - 50;
    m0 = S.money; addMoney(3000);
    check('ночь казино: бонус за ночь ограничен', S.money - m0 === 3050, S.money - m0);
    (0, eval)('BJ = null'); closeModal();
    // Лото: моментальные билеты возвращают меньше 80%, русское лото — банк 75%
    const tw = TICKET_PRIZES.reduce((a, p) => a + p[1], 0), tev = TICKET_PRIZES.reduce((a, p) => a + p[0] * p[1], 0) / tw;
    check('лото: билеты возвращают меньше 80%', tev < 0.8, tev.toFixed(3));
    check('лото: в русском лото банк 75%', LOTO_RAKE === 0.75, LOTO_RAKE);
    S.admNightUntil = Date.now() + 60000; showScreen('fun', 'lotto'); nightBook().won = 0; m0 = S.money; addMoney(1000);
    check('лото: ночь казино на лото не действует', S.money - m0 === 1000 && !(S.nightBook && S.nightBook.won > 3000), S.money - m0);    S.admNightUntil = 0;
    const realNight = casinoNight; casinoNight = () => false; // ракету проверяем без ночного бонуса
    // Автовывод одиночной ракеты: 1.95 при взрыве на 1.95 и на 1.96 — выигрыш ровно по 1.95
    for (const crash of [1.95, 1.96, 1.94]) {
      openCrash(); S.crashAuto = 1.95; S.bet = 1000;
      const before = S.money;
      const realPoint = crashPoint; crashPoint = () => crash;
      crashGo($('crashBtn'));
      crashPoint = realPoint;
      for (let i = 0; i < 400 && CR; i++) await sl(25);
      const got = S.money - before;
      check(`ракета: автовывод 1.95, взрыв ${crash}`, crash >= 1.95 ? got === 950 : got === -1000, got);
      closeModal();
    }
    casinoNight = realNight;
    // Сон с кофе: энергия от кофе не пропадает при пробуждении
    S.busy = null; S.energy = 10;
    startSleep();
    S.energy += 15; // кофе во сне
    S.housing = Math.max(S.housing, 4); // во сне не обворуют — иначе всплывёт окно
    finishSleep(1);
    await sl(2500);
    check('сон с кофе: энергия полная', Math.round(S.energy) === maxEnergy(), `${Math.round(S.energy)}/${maxEnergy()}`);
    // Бой 2.0 в авто-режиме доходит до конца
    closeModal(); S.fightAuto = true; S.energy = maxEnergy(); S.food = maxFood(); S.health = maxHealth();
    let fightEnded = null;
    startFight({ name: 'Тест', style: 'tactic', eq: { hat: 'none', body: 'base', shoes: 'base' }, level: 10, form: 30, strength: 30, tier: 2, rating: 1000 }, { onEnd: (w) => { fightEnded = w; } });
    for (let i = 0; i < 240 && fightEnded === null; i++) await sl(250);
    check('бой 2.0: авто-бой заканчивается', fightEnded !== null, fightEnded !== null ? fightEnded : JSON.stringify({ fight: !!FIGHT, round: FIGHT && FIGHT.round, busy: FIGHT && FIGHT.busy, me: FIGHT && Math.round(FIGHT.me.hp), en: FIGHT && Math.round(FIGHT.en.hp), auto: S.fightAuto, stage: ($('f3Stage') || {}).textContent, modal: ($('modalRoot').textContent || '').slice(0, 80) }));
    closeModal();
    // Подпольный ринг: три боя (авто) проходятся, ставка на себя не теряется
    closeModal(); S.city = 'zas'; applyCity(); S.quest.path = 'dark'; S.quest.idx = questList().findIndex((q) => q.id === 'd_ring'); S.ring = { wins: 0 }; S.fightAuto = true;
    for (let n = 0; n < 6 && S.ring.wins < 3; n++) {
      S.cd = {}; S.energy = maxEnergy(); S.food = maxFood(); S.health = maxHealth(); S.form = 100; S.strength = 100;
      ringPrep(); ringFight();
      for (let i = 0; i < 240 && FIGHT; i++) await sl(250);
      await sl(1200); closeModal();
    }
    check('ринг: три бойца побеждены (авто-бой, сила 100)', S.ring.wins >= 3, S.ring.wins);
    check('ринг: незавершённой ставки нет', !S.ringStake, S.ringStake);
    // Поручения: на честном пути нет криминальных; замена — раз в час бесплатно, потом за 30 крышек
    S.quest.path = 'honest'; S.side = { active: {}, done: {} };
    let crimeSeen = false;
    for (let i = 0; i < 30; i++) { sideState().offers = []; if (sideOffers().some((q) => q.crime)) crimeSeen = true; }
    check('поручения: на честном пути нет криминальных', !crimeSeen);
    S.quest.path = 'dark'; let crimeDark = false;
    for (let i = 0; i < 60 && !crimeDark; i++) { sideState().offers = []; if (sideOffers().some((q) => q.crime)) crimeDark = true; }
    check('поручения: на тёмном пути криминальные бывают', crimeDark);
    S.quest.path = 'honest'; sideState().offers = []; sideState().rerollAt = 0; S.caps = 100;
    const o = sideOffers();
    ACTIONS.sideReroll(o[0].id); const caps1 = S.caps;
    ACTIONS.sideReroll(sideOffers()[0].id); const caps2 = S.caps;
    check('поручения: первая замена бесплатно, вторая за 30 крышек', caps1 === 100 && caps2 === 70, `${caps1} → ${caps2}`);
    check('поручения: после замены снова 3 предложения', sideOffers().length === Math.min(3, SIDE.filter((q) => sideAvailable(q) && (!q.req || q.req())).length), sideOffers().length);
    // Дети: ребёнок появляется в момент рождения, а не после выбора имени; после развода дети видны
    closeModal(); S.kids = []; S.married = true; S.pregnant = Date.now() - 1; POPUP_CLOSED = 0;
    for (let i = 0; i < 40 && S.pregnant; i++) await sl(100);
    check('дети: ребёнок в семье сразу при рождении', S.kids.length === 1, S.kids.length);
    closeModal();
    S.married = false; S.girlfriend = null;
    check('дети: после развода видны в «Свиданиях»', EXTRA_TABS.fun.dates().includes(S.kids[0].name), S.kids[0] && S.kids[0].name);
    // Счета: пока игра закрыта, срок оплаты стоит на паузе — за ночь долг не копится
    S.housing = Math.max(S.housing, 4); S.housingMode = 'rent'; S.debt = 0; S.missed = 0; S.autopayUntil = 0;
    S.billDue = Date.now() + 10 * 60000; S.billSeen = Date.now() - 8 * 3600000; // «проспал» 8 часов
    await sl(600);
    check('счета: 8 часов с закрытой игрой — без долга', S.debt === 0 && S.billDue > Date.now() + 8 * 3600000 - 60000, `долг ${S.debt}, до оплаты ${Math.round((S.billDue - Date.now()) / 60000)} мин`);
    // Турнир 3.0: экран показывает рейтинг, открытые бои и зачёт
    (0, eval)('onlineOn = () => true');
    TOUR.data = { phase: 'open', startHour: 9, endHour: 21, fights: 12, minFights: 6, ratingStart: 1000, unlocked: 4, endsIn: 3600, prize: 0, pool: 1, sponsor: 1,
      divisions: [{ id: 'rookie', name: 'Новички', emoji: '🥉', min: 0, fee: 1000, sponsor: 10000, count: 2, pool: 12000, prizes: [{ place: 1, amount: 6000 }] }],
      me: { division: 'rookie', power: 50, rating: 1036, fights: 3, wins: 2, place: 1, of: 2, pending: null, left: 1, nextIn: 900 },
      table: [{ place: 1, name: 'Валера', rating: 1036, fights: 3, wins: 2, me: true, ok: false }, { place: 2, name: 'Петя', rating: 980, fights: 6, wins: 3, ok: true }] };
    TOUR.at = Date.now();
    const th = tourHTML();
    check('турнир: экран с рейтингом, боями и зачётом', th.includes('рейтинг 1036') && th.includes('доступно 1') && th.includes('до зачёта ещё 3'), th.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 120));
    (0, eval)("onlineOn = () => false");
    // Important windows retain priority; automatic advertising (priority 5) is discarded.
    pendingLevelUp = null;
    openModal('<p>занято</p>');
    const shown = [];
    queuePopup('t5', 5, () => { shown.push(5); openModal('<p>5</p>'); });
    queuePopup('t1', 1, () => { shown.push(1); openModal('<p>1</p>'); });
    queuePopup('t3', 3, () => { shown.push(3); openModal('<p>3</p>'); });
    const busyRightAfterClose = (() => { closeModal(); flushPopups(); return shown.length === 0; })(); // пауза между окнами
    let maxOpen = 1;
    for (let i = 0; i < 3; i++) { POPUP_CLOSED = 0; flushPopups(); maxOpen = Math.max(maxOpen, $('modalRoot').children.length); closeModal(); }
    check('очередь окон: пауза после закрытия', busyRightAfterClose);
    check('очередь окон: важные по очереди, реклама не копится', maxOpen === 1 && shown.join() === '1,3', shown.join());
    // 4.1 Донат: один курс крышки, витрина, кейсы
    closeModal();
    check('донат: 1 крышка = 2 ⭐ во всех наборах', PREMIUM.every((p) => p.stars === p.caps * CAP_STARS), PREMIUM.map((p) => `${p.caps}:${p.stars}`).join(' '));
    const shares = {};
    for (const cId of ['zas', 'msk', 'mex']) { S.city = cId; applyCity(cId); shares[cId] = capRate() / capShift(); }
    S.city = 'zas'; applyCity('zas');
    check('донат: крышка ≈30% лучшей смены в любом городе', Object.values(shares).every((x) => x > 0.25 && x < 0.36), Object.entries(shares).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(', '));
    for (const c of DCASES) {
      let sum = 0;
      for (let i = 0; i < 20000; i++) { const x = dcRoll(c); sum += x.t === 'caps' || x.t === 'money' ? x.n : x.t === 'vip' ? x.n * 5 : x.t === 'boost' ? 3 : POOL_CAPS[x.pool]; }
      const ev = sum / 20000 / c.caps;
      check(`донат-кейс ${c.id}: отдача 70–90%`, ev >= 0.7 && ev <= 0.9, ev.toFixed(2));
    }
    const deal = dealOfDay();
    check('донат: скидка дня — настоящий товар', [...PREMIUM, ...BUNDLES].some((x) => x.id === deal.product) || deal.product === 'vip', deal.product);
    for (const tab of DN_TABS.map((x) => x[0])) { DN_TAB = tab; let ok = true; try { ok = donateHTML().includes('dn-body'); } catch (e) { ok = false; } check(`донат: вкладка «${tab}»`, ok); }
    DN_TAB = 'caps';
    S.caps = 100; S.cosm = [];
    const avPrice = cosmPrice(cosmById('av_wolf'));
    ACTIONS.cosmBuy('av_wolf'); closeModal();
    check('донат: аватарка за крышки куплена и надета', ownsCosm('av_wolf') && S.caps === 100 - avPrice && S.avatar === 'avwolf', `${S.caps} ${S.avatar}`);
    S.caps = 100;
    const dr = dcOpen('dc1');
    check('донат-кейс: открывается за крышки и что-то даёт', !!dr && !!dr.text, dr && dr.text);
    closeModal();
    // Ракета: поле автовывода только в ракете; закрыл окно в полёте — автовывод всё равно сработал
    openDice(); crashAutoUI();
    check('ракета: в костях нет поля автовывода', !$('crashAutoOn'));
    closeModal(); await sl(400);
    const realNight2 = casinoNight; casinoNight = () => false;
    openCrash(); S.crashAuto = 2; S.bet = 1000; const rb0 = S.money;
    const rp = crashPoint; crashPoint = () => 5;
    crashGo($('crashBtn')); crashPoint = rp;
    await sl(100); closeModal();
    for (let i = 0; i < 400 && CR; i++) await sl(25);
    casinoNight = realNight2;
    check('ракета: окно закрыто — автовывод 2x засчитан', S.money - rb0 === 1000, S.money - rb0);
    // Кейсы 4.1: больше ширпотреба, осмотр вещи в 3D
    check('кейсы: в каждом кейсе 10+ вещей ширпотреба', CASES.every((c) => c.loot.common.length >= 10), CASES.map((c) => c.loot.common.length).join(','));
    fleaInv().push(caseRollItem(CASES[0]));
    ACTIONS.inspect(fleaInv().length - 1);
    check('кейсы: осмотр в 3D открывается', !!$('inspObj') && typeof fleaInv()[fleaInv().length - 1].fl === 'number');
    closeModal(); fleaInv().pop();
    // 4.4: контракты — 3–5 вещей одной редкости → 1 вещь следующей редкости; шансы честные; нужна подпись
    S.flea = [];
    const cbox = CASES.find((c) => c.id === 'box');
    for (let i = 0; i < 400 && fleaInv().filter((x) => x.rar === 'common').length < 5; i++) fleaInv().push(caseRollItem(cbox));
    fleaInv().push(caseRollItem(cbox));
    CT = { rar: 'common', picked: fleaInv().map((x, i) => (x.rar === 'common' ? i : -1)).filter((i) => i >= 0).slice(0, 3) };
    const pSum = ctOutcomes().reduce((a, o) => a + o.p, 0);
    check('контракт: шансы в сумме 100%, все исходы — следующая редкость', Math.abs(pSum - 1) < 1e-9 && ctOutcomes().every((o) => o.rar.id === 'uncommon'), pSum.toFixed(4));
    let evSum = 0, stSum = 0;
    for (let k = 0; k < 40; k++) { const its = Array.from({ length: 3 }, () => { let x; do x = caseRollItem(cbox); while (x.rar !== 'common'); return x; }); evSum += ctEV(its); stSum += ctStake(its); }
    check('контракт из 3 вещей: средняя отдача 75–100%', evSum / stSum > 0.75 && evSum / stSum < 1, (evSum / stSum).toFixed(2));
    contractSign(); CT_INK = 0;
    const invBefore = fleaInv().length; contractRoll();
    check('контракт: без подписи не подписывается', fleaInv().length === invBefore && !!$('ctGo') && $('ctGo').disabled);
    CT_INK = 999; contractRoll(); await sl(200);
    const ctWin = fleaInv()[fleaInv().length - 1];
    check('контракт: с подписью — 3 вещи ушли, пришла 1 «Ходовое»', fleaInv().length === invBefore - 2 && ctWin.contract && ['uncommon', 'rare'].includes(ctWin.rar), `${fleaInv().length - invBefore} ${ctWin.rar}`);
    await sl(5600); closeModal();
    // Админ-панель: все вкладки открываются без ошибок
    S.admin = true; let admOk = true;
    A6.schema={groups:{wallet:'Деньги'},roots:{money:{group:'wallet',label:'Деньги'}},catalog:{cities:{zas:{name:'Засранск'}}}};
    A6.list={players:[],total:0};A6.audit={operations:[],events:[],total:0};
    for (const [id] of A6_TABS) { try { ADM_TAB=id;A6.card=null;openAdmin();if(!document.querySelector(`.adm4[data-tab="${id}"]`))admOk=false;} catch(e){admOk=false;} }
    A6.card={player:{uid:1,name:'Тест',last_seen:0},rev:1,hasSave:true,values:{money:1},reports:[],log:[],pending:{},gang:{},bans:[]};ADM_TAB='players';A6.group='wallet';
    try {openAdmin();if(!document.querySelector('.a6-player-head')||!document.querySelector('.a6-leaf'))admOk=false;}catch(e){admOk=false;}
    A6.card=null;A6.schema=null;A6.list=null;A6.audit=null;closeModal();
    check('админ-панель: все вкладки и карточка игрока', admOk);
    // 4.5: «Что внутри» у наборов, VIP, пропуска и набора новичка; редактор рассылки
    let dniOk = true;
    for (const id of [...BUNDLES.map((b) => b.id), 'vip', 'pass', 'starter']) { try { ACTIONS.dnInfo(id); if (!document.querySelector('.dni-row')) dniOk = false; } catch (e) { dniOk = false; } }
    closeModal(); DN_TAB = 'sets'; openDonate();
    check('донат: наборы и VIP открываются «Что внутри»', dniOk && document.querySelectorAll('#donateBox [data-act="dnInfo"]').length >= BUNDLES.length + 1);
    closeModal(); S.admin = true; ACTIONS.bcOpen(); ACTIONS.bcTpl(1); ACTIONS.bcAud('city');
    check('рассылка: редактор с получателями, кнопкой и предпросмотром', !!$('bcPrev') && $('bcPrev').innerText.includes('Открыть донат') && !!document.querySelector('[data-act="bcCity"]'));
    closeModal();
    // 4.4: кейсы ×3 и ×5
    S.money = Math.max(S.money, 1e6); const mm0 = S.money, fl0 = fleaInv().length;
    caseOpenMulti('box', 5);
    check('кейсы ×5: списано 5 цен, 5 вещей на барахолке', mm0 - S.money === cbox.price * 5 && fleaInv().length - fl0 === 5 && document.querySelectorAll('.cm-card').length === 5, `${mm0 - S.money} ${fleaInv().length - fl0}`);
    closeModal(); S.flea = [];
    // 4.2: настройки по разделам
    closeModal(); ACTIONS.settings(); await sl(100);
    check('настройки: меню разделов', document.querySelectorAll('#modalRoot .set2-tile').length >= 7, document.querySelectorAll('#modalRoot .set2-tile').length);
    ACTIONS.setGo('sound');
    check('настройки: раздел «Звук» с переключателями', !!document.querySelector('#modalRoot [data-page="sound"]:not(.hidden) [data-act="toggleSet"][data-id="sfx"]'));
    closeModal();
    // 4.2: админ-команды развития
    const adm = [];
    adminApply({ type: 'set', field: 'strength', n: 77 }, adm); adminApply({ type: 'set', field: 'house', n: 3 }, adm); adminApply({ type: 'give', text: 'cosm:av_lion', n: 1 }, adm);
    check('админ: сила, жильё и выдача косметики', S.strength === 77 && S.ownedHousing === 3 && ownsCosm('av_lion') && adm.length === 3, adm.join(' | '));
    // 4.2: криминал — свои дела и ранги в каждом городе
    S.quest.path = 'dark';
    const crimeIds = {};
    for (const cId of ['zas', 'msk', 'mex']) { S.city = cId; applyCity(cId); crimeIds[cId] = CRIMES.map((c) => c.id).join(','); }
    S.city = 'zas'; applyCity('zas');
    check('криминал: в каждом городе свои дела', new Set(Object.values(crimeIds)).size === 3 && crimeIds.zas.includes('atm') && crimeIds.msk.includes('m_crypto'), JSON.stringify(crimeIds));
    S.crimeXp = { zas: 0 }; CRIME_CUR = CRIMES[0];
    for (let i = 0; i < 12; i++) track('crimeOk');
    check('криминал: удачные дела поднимают ранг города', crimeRank('zas') >= 1 && crimeRank('msk') === 0, `${crimeXp('zas')} → ранг ${crimeRank('zas')}`);
    check('криминал: дело выше ранга закрыто', crimeCan(CRIMES.find((c) => c.id === 'atm')).length > 0);
    closeModal(); pendingLevelUp = null;
    // 4.2: одежда в каждом городе нарисована по-своему
    const hatZ = HATS.ushanka; S.city = 'mex'; applyCity('mex'); const hatX = HATS.ushanka; const bodyX = BODIES.rvan.jacket; S.city = 'msk'; applyCity('msk'); const hatM = HATS.ushanka;
    S.city = 'zas'; applyCity('zas');
    check('одежда: в каждом городе свой рисунок', hatZ !== hatX && hatZ !== hatM && hatX !== hatM && HATS.ushanka === hatZ && bodyX !== BODIES.rvan.jacket);
    // 4.2: «Стартап» — понятные цели, мультик Мексики — 16 кадров
    const bq = QUESTS.find((q) => q.id === 'm_biz');
    check('стартап: цели с подсказками, где купить', bq.goals.length === 4 && bq.goals.every((g) => /Магазин|Жизнь|уровня/.test(g.text)) && bq.goals[0].text.includes('Жизнь → Бизнес'), bq.goals.map((g) => g.text).join(' / '));
    const mc = mexCut({ partner: null, club: null });
    check('мультик Мексики: 16 кадров с картой и обменом', mc.length === 16 && mc.some((f) => f.bg === 'map') && mc.some((f) => f.info && f.info.includes('data-count')));
    CUTS.test41 = mc; playCutscene('test41', null); for (let i = 0; i < 16; i++) { if (CUT) CUT.full && CUT.typing && CUT.full(); cutNext(); await sl(30); }
    check('мультик Мексики: прокручивается до конца без ошибок', !CUT, CUT && CUT.i);
    closeModal();
  }

  async function run() {
    for (let i = 0; i < 200 && !(typeof LOADED !== 'undefined' && LOADED); i++) await sl(100);
    SAVE_LOCK = true; // автотест не трогает сохранения
    S.storySeen = true; S.tut = { done: true, step: 99 }; S.seenVersion = CURRENT_VERSION; S.starterOffered = true; S.tipAskOff = true;
    S.xp = 200000; S.money = 1e7; S.promoSeen = (promoAt() || {}).slot; // акция по расписанию не должна всплыть посреди проверок
    S.nightSeen = typeof nightKey === 'function' ? nightKey() : '';
    try { await economy(); } catch (e) { check('экономика: ошибка теста', false, e.message); }
    try { await allGames('zas'); await allGames('msk'); } catch (e) { check('мини-игры: ошибка теста', false, e.message); }
    // Мексика: побег с обменом 300 ₽ за $1, всё на экране в долларах
    try {
      closeModal(); S.city = 'msk'; applyCity('msk'); S.quest.idx = questList().findIndex((q) => q.id === 'm_scam'); S.money = 3000000; S.girlfriend = null; S.married = false;
      check('мексика: финальная глава Москвабада — побег', !!(currentQuest() && currentQuest().mexMove), currentQuest() && currentQuest().id);
      doMoveMex({ partner: null, club: null }); closeModal();
      check('мексика: 3 млн руб. по 300 → $10 000, на руках только стартовые', S.city === 'mex' && S.money === NEW_CITY_CASH.mex && S.frozen && S.frozen.total === 10000 * USD_RATE - NEW_CITY_CASH.mex, `${S.city} ${S.money} ${S.frozen && S.frozen.total}`);
      const fz0 = S.frozen.left, mz0 = S.money; track('questDone');
      check('мексика: глава размораживает 7%', S.money - mz0 === Math.round(S.frozen.total * FROZEN_STEP) && S.frozen.left < fz0, S.money - mz0);
      check('мексика: суммы на экране в долларах', rubToUsdText('Цена 1 000 ₽, банк 12.5 K ₽') === 'Цена $12,5, банк $156', rubToUsdText('Цена 1 000 ₽, банк 12.5 K ₽'));
      showScreen('shop', 'housing'); await sl(80);
      check('мексика: в магазине нет рублей', !$('shopList').innerText.includes('₽') && $('shopList').innerText.includes('$'), $('shopList').innerText.replace(/\s+/g, ' ').slice(0, 80));
      check('мексика: свои работы, жильё и сюжет', JOBS.find((j) => j.id === 'cook').name === 'Тако-мастер' && HOUSING[6].name.includes('Гасиенда') && questList()[0].id === 'x_arrive', JOBS.find((j) => j.id === 'cook').name);
      await allGames('mex');
      check('мексика: 6 своих криминальных дел', CRIMES.length === 6 && CRIMES.every((c) => c.id.startsWith('x_')), CRIMES.map((c) => c.id).join());
      check('мексика: сюжет про картель и бандитов', ['x_bandits', 'x_scorpions', 'x_kidnap', 'x_plaza', 'x_jefe'].every((id) => questList().some((q) => q.id === id)), questList().length);
      check('мексика: свои игры свиданий и зала', DATE_GAMES.walk.title === 'Переулок поцелуев · Callejón del Beso' && GYM_GAMES.power.title === 'Камень ацтеков');
      await allGames('fr'); story30Migrate();
      check('франция: четвёртый город с отдельным сюжетом и криминалом', CITIES.fr.idx===3&&questList().length===30&&CRIMES.length===5&&CRIMES.every(c=>c.id.startsWith('f_'))&&JOBS.every(j=>FR_JOBS[j.id]));
      S.city = 'zas'; applyCity('zas');
      check('мексика: в Засранске свои игры вернулись', CRIMES[0].id === 'pocket' && !DATE_GAMES.walk.title.includes('Callejón del Beso') && GYM_GAMES.power.title !== 'Камень ацтеков', `${CRIMES[0].id} ${DATE_GAMES.walk.title}`);
    } catch (e) { check('мексика: ошибка теста', false, e.message); }
    const pre = document.createElement('pre');
    pre.id = 'autotest-result';
    pre.textContent = JSON.stringify(RES);
    document.body.appendChild(pre);
    document.title = 'AUTOTEST DONE';
  }
  window.addEventListener('load', () => setTimeout(run, 500));
})();
