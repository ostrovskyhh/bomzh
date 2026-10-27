// Автотест игры (3.3). Работает только по адресу index.html#autotest — игрокам ничего не делает.
// Запуск перед выкладкой: tests\run_all.ps1 (открывает игру в Edge без окна и читает итог).
// 1) Все мини-игры обоих городов: работы, уроки, досуг, свидания, дети, криминал, тюрьма, спортзал, игры с партнёром.
//    Каждую «играем» случайными нажатиями и ждём конца. Не закончилась вовремя — зависание. Ошибка JS — провал.
// 2) Экономика и правила: цены вещей из кейсов, выгода кейсов, ночь казино, автовывод ракеты, сон с кофе, бой, очередь окон.
(function () {
  if (!/^#autotest/.test(location.hash)) return;
  const RES = { games: [], checks: [], errors: [] };
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
      const btns = [...document.querySelectorAll('#modalRoot .mg button:not([disabled]), #mgArena [data-i], #mgArena .mg-t, #mgArena span, #mgArena i, #mgArena div')].filter((b) => b.offsetParent !== null || b.getClientRects().length);
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
    const tag = cityId === 'msk' ? 'МСК' : 'ЗАС';
    for (const j of JOBS) await play(`${tag} работа: ${j.name}`, (fin) => startShiftGame(j, fin), 50);
    for (const st of [1, 2, 3, 4, 5]) if (LESSON_GAMES[st] || cityId === 'msk') await play(`${tag} урок ${st}`, () => startLessonGame(st), 60);
    if (cityId !== 'zas') return;
    for (const [id, g] of Object.entries(LEISURE_GAMES)) await play(`досуг: ${id}`, () => runGame({ title: g.title, hint: g.hint, duration: g.duration, setup: (mg) => g.run(mg), finish: () => {} }), (g.duration || 40) + 15);
    for (const [id, g] of Object.entries(DATE_GAMES)) await play(`свидание: ${id}`, () => runGame({ title: g.title, hint: g.hint, duration: g.duration, setup: g.setup, finish: () => {} }), (g.duration || 40) + 15);
    for (const [id, g] of Object.entries(KID_GAMES)) await play(`дети: ${id}`, () => runGame({ title: g.title, hint: g.hint, duration: g.duration, setup: g.setup, finish: () => {} }), (g.duration || 40) + 15);
    for (const c of CRIMES) if (c.game) await play(`криминал: ${c.id}`, () => runGame({ title: c.game.title, hint: c.game.hint, duration: c.game.duration, setup: c.game.setup, finish: () => {} }), (c.game.duration || 40) + 15);
    for (const a of JAIL_ACTS) if (a.game) await play(`тюрьма: ${a.id}`, () => runGame({ title: a.game.title, hint: a.game.hint, duration: a.game.duration, setup: a.game.setup, finish: () => {} }), (a.game.duration || 40) + 15);
    for (const [id, g] of Object.entries(GYM_GAMES)) await play(`зал: ${id}`, () => runGame({ title: g.title, hint: g.hint, duration: 0, setup: (mg) => gameReps(mg, g), finish: () => {} }), 130); // без таймера: если не доиграть, сторож завершает за 2 мин
    for (const p of PARTNER_GAMES) { const g = p.gm || p; if (g && g.setup) await play(`партнёр: ${g.title}`, () => runGame({ title: g.title, hint: g.hint, duration: g.duration, setup: g.setup, finish: () => {} }), (g.duration || 40) + 15); }
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
    // Ночь казино: +20% только к чистому выигрышу
    closeModal(); S.admNightUntil = Date.now() + 60000; S.admin = true; showScreen('fun', 'casino');
    (0, eval)('BJ = { bet: 1000 }');
    let m0 = S.money; addMoney(3000); const win = S.money - m0;
    m0 = S.money; addMoney(1000); const push = S.money - m0;
    (0, eval)('BJ = null');
    check('ночь казино: выигрыш 3000 при ставке 1000 → +3400', win === 3400, win);
    check('ночь казино: ничья без бонуса', push === 1000, push);
    S.admNightUntil = 0;
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
    // Очередь окон: пока открыто окно, три новых ждут; потом идут по одному и по важности (1 → 3 → 5)
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
    check('очередь окон: по одному, по важности', maxOpen === 1 && shown.join() === '1,3,5', shown.join());  }

  async function run() {
    for (let i = 0; i < 200 && !(typeof LOADED !== 'undefined' && LOADED); i++) await sl(100);
    SAVE_LOCK = true; // автотест не трогает сохранения
    S.storySeen = true; S.tut = { done: true, step: 99 }; S.seenVersion = CURRENT_VERSION; S.starterOffered = true; S.tipAskOff = true;
    S.xp = 200000; S.money = 1e7; S.nightSeen = typeof nightKey === 'function' ? nightKey() : '';
    try { await economy(); } catch (e) { check('экономика: ошибка теста', false, e.message); }
    try { await allGames('zas'); await allGames('msk'); } catch (e) { check('мини-игры: ошибка теста', false, e.message); }
    const pre = document.createElement('pre');
    pre.id = 'autotest-result';
    pre.textContent = JSON.stringify(RES);
    document.body.appendChild(pre);
    document.title = 'AUTOTEST DONE';
  }
  window.addEventListener('load', () => setTimeout(run, 500));
})();
