// Живые игроки: кто сейчас в игре, вызов конкретного игрока на бой или в «камень-ножницы-бумагу»
// (бот присылает ему уведомление), и сама онлайн-КНБ до трёх побед со ставками. Сервер — bot/duels.py.

const DUEL_PING_EVERY = 30000;
const RPS_E = { rock: '✊', scissors: '✌️', paper: '✋' };
const RPS_N = { rock: 'Камень', scissors: 'Ножницы', paper: 'Бумага' };
const RPS_STAKES = [0, 100, 1000, 10000, 100000];
const RPS_FEE = 0.05; // комиссия с выигрыша
let DUEL = { pid: '', online: 0, pingAt: 0, inbox: [], seen: {}, list: null, listAt: 0, listLoading: false };

// ---------- Отметка «я в игре» и входящие вызовы ----------
async function duelPing() {
  if (!onlineOn() || !S.storySeen) return;
  DUEL.pingAt = Date.now();
  try {
    const r = await apiPost('duel/ping', { busy: !!(OB || RP || S.busy) });
    DUEL.pid = r.pid; DUEL.online = r.online; DUEL.inbox = r.inbox || [];
  } catch (e) { /* сервер выключен */ }
}
HOOKS.tick.push(() => {
  if (onlineOn() && S.storySeen && Date.now() - DUEL.pingAt > DUEL_PING_EVERY) duelPing();
  // Новый вызов показываем, как только не мешает другое окно
  const ch = DUEL.inbox.find((c) => !DUEL.seen[c.id]);
  if (ch && !modalOpen() && !OB && !RP) { DUEL.seen[ch.id] = true; duelIncoming(ch); }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden && typeof S !== 'undefined') setTimeout(duelPing, 500); });

function duelIncoming(ch) {
  sfx('notify'); haptic('heavy');
  const what = ch.kind === 'fight' ? '🥊 на бой' : `✊ в «Камень-ножницы-бумагу»${ch.stake ? ` на ${fmt(ch.stake)} ₽` : ''}`;
  openModal(`<div class="big-art" style="height:100px"><div class="rays"></div><div class="big-emoji" style="line-height:100px">⚔️</div></div>
    <h3>Тебя вызывают!</h3><p><b>${esc(ch.from)}</b> (ур. ${ch.level}) вызывает тебя ${what}.</p>
    <p class="test-note">Вызов действует ещё <span data-until="${Date.now() + ch.left * 1000}"></span></p>
    <div class="btns" style="flex-direction:column;gap:8px">
      <button class="btn primary wide" data-act="duelAccept" data-id="${ch.id}">✅ Принять</button>
      <button class="btn wide" data-act="duelDecline" data-id="${ch.id}">Отказаться</button></div>`, { center: true, locked: true });
}

// ---------- Вызов игрока ----------
async function duelChallenge(kind, pid, stake = 0) {
  if (!onlineOn()) { toast('Вызовы работают в игре внутри Telegram', 'bad'); return; }
  if (kind === 'fight') {
    if (level() < FIGHT_LEVEL) { toast(`Драки открываются с ${FIGHT_LEVEL} уровня`, 'bad'); return; }
    if (!obCanFight()) return;
  } else if (!rpCan(stake)) return;
  try {
    const r = await apiPost('duel/challenge', { kind, pid, stake, level: level(), fighter: kind === 'fight' ? obFighter() : undefined });
    if (r.error) { toast(r.error, 'bad'); return; }
    const note = r.online ? 'Он сейчас в игре' : r.notified ? 'Бот отправил ему уведомление' : 'Он не в сети — ждём 5 минут';
    if (kind === 'fight') {
      obPay();
      obStart(r.view);
      OB.vs = { name: r.to, note };
      obWaitingModal();
    } else {
      rpPay(stake);
      rpStart(r.view, { name: r.to, note });
    }
    track('duelCall');
  } catch (e) { toast(refErrorText(e), 'bad'); }
}

// Ожидание вызванного соперника — своё окно вместо «отправь код другу»
const _obWaitingModal = obWaitingModal;
obWaitingModal = () => {
  if (!OB || !OB.vs) { _obWaitingModal(); return; }
  openModal(`<div class="big-art" style="height:90px"><div class="big-emoji" style="line-height:90px">🥊</div></div>
    <h3>Вызов отправлен</h3><p>Ждём, пока <b>${esc(OB.vs.name)}</b> примет бой. ${OB.vs.note}.</p>
    <div class="btns"><button class="btn wide" data-act="obLeave">Отменить вызов</button></div>
    <p class="test-note">Вызов действует 5 минут</p>`, { center: true, locked: true });
};

function duelRpsMenu(pid, name) {
  openModal(`<div class="big-art" style="height:90px"><div class="big-emoji" style="line-height:90px">✊✌️✋</div></div>
    <h3>КНБ с ${esc(name)}</h3><p>До трёх побед. На какую ставку играем? Победитель забирает обе ставки (комиссия ${RPS_FEE * 100}%).</p>
    <div class="btns" style="flex-wrap:wrap;gap:8px">${RPS_STAKES.map((s) => `<button class="btn ${S.money >= s ? 'primary' : ''}" data-act="duelRps" data-id="${s}:${pid}" ${S.money >= s ? '' : 'disabled'}>${s ? `${fmt(s)} ₽` : 'Просто так'}</button>`).join('')}</div>
    <div class="btns"><button class="btn wide" data-act="close">Отмена</button></div>`, { center: true });
}

// ---------- Список игроков онлайн ----------
async function duelLoadList() {
  if (DUEL.listLoading || !onlineOn()) return;
  DUEL.listLoading = true;
  try { DUEL.list = (await apiPost('duel/online')).players || []; } catch (e) { DUEL.list = DUEL.list || null; }
  DUEL.listLoading = false;
  DUEL.listAt = Date.now();
  if (currentScreen === 'tasks' && TABS.tasks === 'top') renderCurrent(false);
  if ($('duelList')) $('duelList').innerHTML = duelListHTML();
}
function duelBtns(pid, name) {
  return `<div class="duel-btns"><button class="btn small primary" data-act="duelFight" data-id="${esc(pid)}">🥊 На бой</button>
    <button class="btn small" data-act="duelRpsMenu" data-id="${esc(pid)}" data-name="${esc(name)}">✊ КНБ</button></div>`;
}
function duelListHTML() {
  const l = DUEL.list;
  if (!l) return '<div class="info-card">⏳ Смотрим, кто в игре…</div>';
  if (!l.length) return '<div class="info-card">Сейчас в игре никого, кроме тебя. Вызови игрока из топа — бот пришлёт ему уведомление.</div>';
  return l.map((p) => card({ thumb: `<div class="top-ava frame-${esc(p.frame || 'none')}">${esc((p.name || '?')[0].toUpperCase())}</div>`,
    title: `<span class="online-dot"></span>${esc(p.name)}`, desc: `Ур. ${p.level} · рейтинг ${p.rating}${p.busy ? ' · занят' : ''}`, extra: duelBtns(p.pid, p.name) })).join('');
}
function openOnlineList() {
  openModal(`<h3 style="margin-top:0">🟢 Сейчас в игре</h3><div id="duelList">${duelListHTML()}</div>
    <div class="btns"><button class="btn wide" data-act="close">Закрыть</button></div>`);
  fillIcons();
  duelLoadList();
}

// ---------- Топ: кто онлайн и кнопки вызова ----------
const _topTabDuel = EXTRA_TABS.tasks.top;
EXTRA_TABS.tasks.top = function topWithDuels() {
  if (!onlineOn() || !TOP.data) return _topTabDuel();
  if (!TOP.loading && Date.now() - TOP.at > 30000) setTimeout(topLoad, 0);
  if (!DUEL.listLoading && Date.now() - DUEL.listAt > 20000) setTimeout(duelLoadList, 0);
  const html = _topTabDuel();
  const cut = html.indexOf('<div class="subhead">Лучшие игроки');
  const head = cut > 0 ? html.slice(0, cut) : '';
  const d = TOP.data;
  const n = DUEL.list ? DUEL.list.length : 0;
  const onlineBox = `<div class="online-box"><b>🟢 Сейчас в игре: ${DUEL.list ? n + 1 : '…'}</b>
    <small>Вызови любого на бой или в «камень-ножницы-бумагу». Если он не в игре — бот пришлёт ему уведомление.</small>
    <button class="btn wide" data-act="openOnlineList">Кто онлайн</button></div>`;
  const rows = d.top.map((p, i) => `<details class="top-row ${p.me ? 'me' : ''}"><summary>
      <div class="rank r${i + 1}">${i + 1}</div>
      <div class="top-ava frame-${esc(p.stats.frame || 'none')}">${esc((p.name || '?')[0].toUpperCase())}${p.online ? '<i class="online-dot on-ava"></i>' : ''}</div>
      <div class="card-body"><div class="card-title">${esc(p.name)}${p.stats.vip ? ' 👑' : ''}${p.me ? ' (ты)' : ''}</div>
        <div class="card-desc">${p.online && !p.me ? '<b class="online-txt">в игре</b> · ' : ''}Ур. ${p.stats.level} · ${esc(HOUSING[Math.round(p.stats.housing || 0)].name)}${p.stats.job_name ? ` · ${esc(p.stats.job_name.split(' · ')[0])}` : ''}</div></div>
      <div class="top-score">${fmt(p.score)}<small>баллов</small></div></summary>
      ${!p.me && p.pid ? duelBtns(p.pid, p.name) : ''}${topStatsHTML(p.stats)}</details>`).join('');
  return head + onlineBox + `<div class="subhead">Лучшие игроки · нажми, чтобы сравнить или вызвать</div>${rows || '<div class="info-card">Пока никого нет — будь первым!</div>'}`;
};

// =====================================================================
// Камень-ножницы-бумага онлайн
// =====================================================================
let RP = null; // { code, view, timer, shown, busy, animating, vs, paid, done }

function rpCan(stake) {
  if (S.busy) { toast('Валера занят', 'bad'); return false; }
  if (S.money < stake) { toast('Не хватает денег на ставку', 'bad'); return false; }
  return true;
}
function rpPay(stake) { if (stake) S.money -= stake; }
function rpRefund(stake) { if (stake) S.money += stake; }

function rpStart(view, vs) {
  rpStop();
  RP = { code: view.code, view, timer: null, shown: view.log.length, busy: false, animating: false, vs, done: false };
  if (view.status === 'waiting') rpWaitingModal(); else rpGameModal();
  RP.timer = setInterval(rpPoll, 1000);
}
function rpStop() { if (RP && RP.timer) clearInterval(RP.timer); }

function rpWaitingModal() {
  const st = RP.view.stake;
  openModal(`<div class="big-art" style="height:90px"><div class="big-emoji rps-wait" style="line-height:90px">✊</div></div>
    <h3>${RP.vs ? 'Вызов отправлен' : 'Ищем соперника…'}</h3>
    <p>${RP.vs ? `Ждём, пока <b>${esc(RP.vs.name)}</b> примет игру. ${RP.vs.note}.` : 'Как только кто-то из живых игроков выберет ту же ставку — начнём.'}<br>Ставка: <b>${st ? `${fmt(st)} ₽` : 'без ставки'}</b></p>
    <div class="btns"><button class="btn wide" data-act="rpLeave">Отменить</button></div>`, { center: true, locked: true });
}

function rpGameModal() {
  const v = RP.view;
  openModal(`<div class="rps">
      <div class="f-round" id="rpRound"></div>
      <div class="ob-timer"><div id="rpTimer"></div></div>
      <div class="rps-board">
        <div class="rps-side"><b>Ты</b><div class="rps-hand" id="rpMe">❔</div><div class="rps-score" id="rpMeS">0</div></div>
        <div class="f-vs">VS</div>
        <div class="rps-side"><b>${esc(v.op.name)} <small>ур. ${v.op.level}</small></b><div class="rps-hand flip" id="rpOp">❔</div><div class="rps-score" id="rpOpS">0</div></div>
      </div>
      <div class="f-log" id="rpLog">До ${v.win} побед${v.stake ? ` · на кону ${fmt(v.stake * 2)} ₽` : ''}. 15 секунд на ход!</div>
      <div class="f-btns rps-btns" id="rpBtns"></div>
      <button class="btn small ob-leave" data-act="rpLeave">🏳️ Сдаться</button>
    </div>`, { center: true, locked: true });
  sfx('bell');
  rpRender();
}

function rpRender() {
  const v = RP.view;
  if (!$('rpBtns')) return;
  const sc = RP.animating ? null : v;
  if (sc) { $('rpMeS').textContent = v.me.score; $('rpOpS').textContent = v.op.score; }
  $('rpRound').textContent = v.status === 'finished' ? 'Игра окончена' : `Раунд ${v.round}`;
  $('rpTimer').style.width = (v.left != null ? clamp(v.left / 15, 0, 1) * 100 : 0) + '%';
  $('rpTimer').classList.toggle('low', v.left != null && v.left <= 5);
  const can = v.status === 'active' && !v.myMoved && !RP.animating;
  $('rpBtns').innerHTML = Object.keys(RPS_E).map((m) => `<button class="btn f-btn" data-act="rpMove" data-id="${m}" data-silent="1" ${can ? '' : 'disabled'}><span>${RPS_E[m]}</span>${RPS_N[m]}</button>`).join('');
  if (v.status === 'active' && v.myMoved && !RP.animating) $('rpLog').textContent = v.opMoved ? 'Оба сходили…' : '⏳ Ждём ход соперника…';
}

async function rpPoll() {
  if (!RP || RP.busy) return;
  RP.busy = true;
  try { rpApply(await apiPost('rps/state', { code: RP.code })); } catch (e) { /* сеть моргнула */ }
  if (RP) RP.busy = false;
}

async function rpApply(v) {
  if (!RP) return;
  const wasWaiting = RP.view.status === 'waiting';
  RP.view = v;
  if (wasWaiting && v.status === 'active') { sfx('notify'); haptic('heavy'); rpGameModal(); return; }
  if (wasWaiting && v.status === 'finished') { rpStop(); rpRefund(v.stake); RP = null; closeModal(); toast(v.reason || 'Игра не состоялась'); save(); return; }
  if (!$('rpBtns')) return;
  while (RP && RP.shown < v.log.length && !RP.animating) {
    RP.animating = true;
    await rpAnimate(v.log[RP.shown]);
    if (!RP) return;
    RP.shown++;
    RP.animating = false;
  }
  rpRender();
  if (v.status === 'finished' && RP.shown >= v.log.length) rpFinish(v);
}

async function rpAnimate(e) {
  const me = $('rpMe'), op = $('rpOp');
  if (!me) return;
  me.textContent = op.textContent = '✊';
  me.classList.add('shake'); op.classList.add('shake');
  sfx('tap');
  await wait(800);
  me.classList.remove('shake'); op.classList.remove('shake');
  me.textContent = e.my ? RPS_E[e.my] : '💤';
  op.textContent = e.op ? RPS_E[e.op] : '💤';
  const res = e.res === 'me' ? '✅ Раунд твой!' : e.res === 'op' ? '❌ Раунд за соперником' : '🤝 Ничья в раунде';
  sfx(e.res === 'me' ? 'coin' : e.res === 'op' ? 'punch' : 'whoosh');
  if (e.res === 'me') haptic('success'); else if (e.res === 'op') haptic('heavy');
  $('rpLog').textContent = `${e.my ? RPS_N[e.my] : 'Не успел'} против «${e.op ? RPS_N[e.op] : 'не успел'}» — ${res}`;
  const v = RP.view;
  const meS = v.log.slice(0, RP.shown + 1).filter((x) => x.res === 'me').length;
  const opS = v.log.slice(0, RP.shown + 1).filter((x) => x.res === 'op').length;
  $('rpMeS').textContent = meS; $('rpOpS').textContent = opS;
  await wait(1100);
}

function rpFinish(v) {
  if (!RP || RP.done) return;
  RP.done = true;
  rpStop();
  RP = null;
  let emoji, title, text, good = false;
  if (v.winner === 'me') {
    const prize = v.stake ? Math.round(v.stake * 2 * (1 - RPS_FEE)) : 0;
    if (prize) addMoney(prize);
    addXp(12); addMood(10);
    S.rpsWins = (S.rpsWins || 0) + 1;
    track('rpsWin');
    emoji = '🏆'; title = 'Победа в КНБ!'; good = true;
    text = `${v.reason}. ${esc(v.op.name)} повержен!${prize ? `<br>+${fmt(prize)} ₽` : ''}<br>+12 опыта, +10 😊`;
    confetti(50); sfx('win');
  } else if (v.winner === 'op') {
    addMood(-4); addXp(4);
    emoji = '😤'; title = 'Проигрыш'; text = `${v.reason}. ${esc(v.op.name)} оказался хитрее.${v.stake ? `<br>Ставка ${fmt(v.stake)} ₽ ушла сопернику` : ''}`;
    sfx('lose');
  } else {
    rpRefund(v.stake); addXp(5);
    emoji = '🤝'; title = 'Ничья'; good = true; text = `${v.reason}${v.stake ? '<br>Ставка вернулась' : ''}`;
  }
  track('rpsGame');
  resultModal({ emoji, rays: good ? '' : 'bad', title, text, btn: 'Ок' });
  save();
}

// Блок КНБ во вкладке «Драки» (доступен с любого уровня — тут не бьют)
const _fightsTabRps = EXTRA_TABS.fun.fights;
EXTRA_TABS.fun.fights = () => {
  const base = _fightsTabRps();
  if (!REF_API) return base;
  const box = `<div class="online-box rps-box"><b>✊✌️✋ Камень-ножницы-бумага онлайн</b>
      <small>Против живого игрока, до трёх побед, 15 секунд на ход. Выбери ставку — победитель забирает обе (комиссия ${RPS_FEE * 100}%).${S.rpsWins ? ` Твоих побед: <b>${S.rpsWins}</b>` : ''}</small>
      ${onlineOn() ? `<div class="btns" style="flex-wrap:wrap;gap:6px">${RPS_STAKES.map((s) => `<button class="btn small ${S.money >= s ? 'primary' : ''}" data-act="rpFind" data-id="${s}" ${S.money >= s ? '' : 'disabled'}>${s ? `${fmt(s)} ₽` : 'Без ставки'}</button>`).join('')}</div>
      <button class="btn wide" data-act="openOnlineList">🟢 Вызвать игрока онлайн</button>` : '<small><b>Работает в игре внутри Telegram.</b></small>'}</div>`;
  const i = base.indexOf('<div class="stat-grid">');
  return i > 0 ? base.slice(0, i) + box + base.slice(i) : box + base;
};

Object.assign(ACTIONS, {
  openOnlineList: () => openOnlineList(),
  duelFight: (pid) => duelChallenge('fight', pid),
  duelRpsMenu: (pid, btn) => duelRpsMenu(pid, btn.dataset.name || 'игроком'),
  duelRps: (id) => { const [s, pid] = id.split(':'); closeModal(); duelChallenge('rps', pid, +s); },
  duelAccept: async (id) => {
    const ch = DUEL.inbox.find((c) => c.id === id);
    if (!ch) { closeModal(); return; }
    if (ch.kind === 'fight' ? !obCanFight() : !rpCan(ch.stake)) return;
    try {
      const r = await apiPost('duel/answer', { id, accept: true, level: level(), fighter: ch.kind === 'fight' ? obFighter() : undefined });
      DUEL.inbox = DUEL.inbox.filter((c) => c.id !== id);
      if (r.error) { closeModal(); toast(r.error, 'bad'); return; }
      if (r.kind === 'fight') { obPay(); obStart(r.view); } else { rpPay(r.view.stake); rpStart(r.view); }
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  duelDecline: async (id) => {
    DUEL.inbox = DUEL.inbox.filter((c) => c.id !== id);
    closeModal();
    try { await apiPost('duel/answer', { id, accept: false }); } catch (e) { /* не страшно — вызов истечёт сам */ }
  },
  rpFind: async (s) => {
    const stake = +s;
    if (!rpCan(stake)) return;
    try {
      const v = await apiPost('rps/find', { stake, level: level() });
      if (v.error) { toast(v.error, 'bad'); return; }
      rpPay(stake);
      rpStart(v);
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  rpMove: async (move) => {
    if (!RP || RP.view.status !== 'active' || RP.view.myMoved || RP.animating) return;
    sfx('tap');
    RP.view.myMoved = true;
    $('rpMe').textContent = RPS_E[move];
    rpRender();
    try { rpApply(await apiPost('rps/move', { code: RP.code, move, round: RP.view.round })); } catch (e) { if (RP) { RP.view.myMoved = false; rpRender(); } }
  },
  rpLeave: async () => {
    if (!RP) { closeModal(); return; }
    const waiting = RP.view.status === 'waiting';
    try {
      const v = await apiPost('rps/leave', { code: RP.code });
      if (waiting) { rpStop(); rpRefund(RP.view.stake); RP = null; closeModal(); toast('Отменено'); save(); } else rpApply(v);
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
});
