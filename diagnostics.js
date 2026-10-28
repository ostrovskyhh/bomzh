// Локальный ограниченный журнал. Отправляется только вместе с обращением игрока.
const BugReport = (() => {
  const startedAt = Date.now();
  const session = Math.random().toString(36).slice(2, 10);
  const events = [], errors = [];
  const windowMs = 10 * 60000;
  let sequence = 0;
  const clean = (value, max = 500) => String(value == null ? '' : value)
    .replace(/(https?:\/\/[^\s?#)]+)[?#][^\s)]*/g, (url, base) => base + (url.match(/(:\d+(?::\d+)?)$/) || [''])[0])
    .replace(/\b(initData|authorization|token|password)\s*[:=]\s*[^\s,;]+/gi, '$1=[скрыто]')
    .slice(0, max);
  const safe = (fn, fallback = null) => { try { return fn(); } catch (_) { return fallback; } };
  const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj && obj[k] !== undefined).map((k) => [k, obj[k]]));
  function screen() {
    return safe(() => `${currentScreen}/${TABS[currentScreen] || ''}`, 'loading');
  }
  function numbers() {
    return safe(() => pick(S, ['money', 'caps', 'bottles', 'xp', 'energy', 'food', 'health', 'mood', 'edu', 'housing', 'prestige', 'wanted']), {});
  }
  function record(type, data = {}) {
    safe(() => {
      const last = events[events.length - 1];
      if (type === 'tap' && last && last.type === 'tap' && Date.now() - Date.parse(last.at) < 1000) {
        last.count = (last.count || 1) + 1; last.values = numbers(); return;
      }
      events.push({ seq: ++sequence, at: new Date().toISOString(), ms: Date.now() - startedAt, screen: screen(), type, ...data });
      while (events.length > 120 || (events[0] && Date.now() - Date.parse(events[0].at) > windowMs)) events.shift();
    });
  }
  function error(source, err, extra = {}) {
    safe(() => {
      const item = { at: new Date().toISOString(), screen: screen(), source: clean(source, 100),
        message: clean(err && err.message || err, 700), stack: clean(err && err.stack || '', 2200), ...extra };
      errors.push(item);
      if (errors.length > 20) errors.shift();
      record('error', { source: item.source, message: item.message });
    });
  }
  function snapshot() {
    return safe(() => {
      const q = safe(() => currentQuest());
      const mg = safe(() => MG);
      return JSON.parse(JSON.stringify({ ...numbers(), city: S.city || 'zas', level: safe(() => level()), rev: S.rev || 0,
        savedAt: S.savedAt, loaded: safe(() => LOADED), saveLocked: safe(() => SAVE_LOCK),
        serverReady: safe(() => serverReady), serverBase: safe(() => serverBase),
        busy: pick(S.busy, ['type', 'id', 'start', 'end']),
        study: pick(S.study, ['stage', 'done', 'need', 'retake']),
        equipment: S.eq, ownedHousing: S.ownedHousing, transport: S.transport,
        pet: S.pet, petFood: S.petFood, petHp: S.petHp,
        jobs: S.jobs, jobPos: S.jobPos, hired: S.hired,
        quest: q ? { id: q.id, title: q.title, idx: S.quest.idx, path: S.quest.path,
          goals: q.goals.map((g) => ({ text: g.text, need: g.need, current: safe(() => g.cur()) })),
          base: S.quest.base } : null,
        counters: S.counters,
        effects: (S.effects || []).slice(0, 20).map((e) => pick(e, ['id', 'until', 'diag'])),
        cooldowns: S.cd,
        minigame: mg ? pick(mg, ['id', 'title', 'score', 'mistakes', 'start', 'limit', 'over']) : null,
        modal: clean(safe(() => document.querySelector('#modalRoot h3, #modalRoot .mg-head b')?.textContent, ''), 150),
        fight: safe(() => FIGHT ? pick(FIGHT, ['turn', 'round', 'over']) : null),
      }));
    }, { screen: screen(), unavailable: true });
  }
  function actionStart(action, id) {
    const data = { action: clean(action, 80), before: numbers() };
    // Значения пользовательского ввода, коды и ссылки не записываем.
    if (!/name|chat|code|feedback|invite/i.test(action) && /^[\w:.-]{1,70}$/.test(id || '')) data.id = id;
    record('action', data);
    return { action: data.action, before: data.before };
  }
  function actionEnd(ticket) {
    safe(() => {
      const after = numbers(), changes = {};
      for (const key of Object.keys(after)) if (after[key] !== ticket.before[key]) changes[key] = { from: ticket.before[key], to: after[key] };
      record('action-result', { action: ticket.action, changes });
    });
  }
  function build(origin, reproduction = {}) {
    const since = Date.now() - windowMs;
    return { schema: 1, version: safe(() => CURRENT_VERSION, 'loading'), build: 'bugreport-20261028',
      session, capturedAt: new Date().toISOString(), sessionStartedAt: new Date(startedAt).toISOString(),
      screen: screen(), level: safe(() => level()), city: safe(() => cityName(), ''),
      device: safe(() => tg && tg.platform || navigator.platform, ''),
      environment: { userAgent: clean(navigator.userAgent, 350), language: navigator.language,
        viewport: `${window.innerWidth}x${window.innerHeight}`, pixelRatio: window.devicePixelRatio,
        online: navigator.onLine, visibility: document.visibilityState, timezone: safe(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
        telegramVersion: safe(() => tg && tg.version), uptimeMs: Date.now() - startedAt,
        assets: safe(() => [...document.querySelectorAll('script[src],script[data-source]')].filter((s) => s.dataset.source || new URL(s.src).origin === location.origin)
          .map((s) => { const u = new URL(s.src || s.dataset.source, document.baseURI); return { file: u.pathname.split('/').pop(), v: clean(u.searchParams.get('v'), 60) }; }), []),
      },
      reproduction, origin: origin || snapshot(), state: snapshot(),
      events: events.filter((e) => Date.parse(e.at) >= since), errors: errors.slice(),
      log: safe(() => (S.log || []).filter((e) => e.t >= since).slice(0, 40).reverse()
        .map((e) => ({ at: new Date(e.t).toISOString(), text: clean(e.text, 300), kind: clean(e.kind, 40) })), []),
    };
  }
  window.addEventListener('error', (e) => error('window', e.error || e.message || 'Не загрузился ресурс',
    { file: clean(e.filename || safe(() => e.target.src, ''), 250), line: e.lineno, column: e.colno }), true);
  window.addEventListener('unhandledrejection', (e) => error('promise', e.reason));
  window.addEventListener('online', () => record('connection', { online: true }));
  window.addEventListener('offline', () => record('connection', { online: false }));
  document.addEventListener('visibilitychange', () => record('visibility', { state: document.visibilityState }));
  record('session-start');
  return { record, error, snapshot, actionStart, actionEnd, build, clean };
})();
