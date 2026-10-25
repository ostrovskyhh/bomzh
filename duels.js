// Живые игроки: кто сейчас в игре, вызов конкретного игрока на бой или в «камень-ножницы-бумагу»
// (бот присылает ему уведомление), и сама онлайн-КНБ до трёх побед со ставками. Сервер — bot/duels.py.

const DUEL_PING_EVERY = 10000; // так вызов доходит до игрока, который уже в игре, за считанные секунды
const RPS_E = { rock: '✊', scissors: '✌️', paper: '✋' };
const RPS_N = { rock: 'Камень', scissors: 'Ножницы', paper: 'Бумага' };
const RPS_STAKES = [0, 100, 1000, 10000, 100000];
const RPS_FEE = 0.05; // комиссия с выигрыша
let DUEL = { pid: '', online: 0, pingAt: 0, inbox: [], seen: {}, list: null, listAt: 0, listLoading: false, out: null, deepLink: '' };

// Игра открыта кнопкой «Принять вызов» из сообщения бота: ?duel=ID
try { DUEL.deepLink = new URLSearchParams(location.search).get('duel') || ''; } catch (e) { /* нет адреса */ }

// ---------- Отметка «я в игре» и входящие вызовы ----------
async function duelPing() {
  if (!onlineOn() || !S.storySeen) return;
  DUEL.pingAt = Date.now();
  try {
    const r = await apiPost('duel/ping', { busy: !!(OB || RP || S.busy) });
    DUEL.pid = r.pid; DUEL.online = r.online; DUEL.inbox = r.inbox || [];
    if (DUEL.deepLink) {
      const ch = DUEL.inbox.find((c) => c.id === DUEL.deepLink);
      if (!ch) toast('Этот вызов уже не действует', 'bad');
      DUEL.deepLink = '';
      if (ch) { DUEL.seen[ch.id] = true; closeModal(); duelIncoming(ch); }
    }
  } catch (e) { /* сервер выключен */ }
}
HOOKS.tick.push(() => {
  if (onlineOn() && S.storySeen && !document.hidden && Date.now() - DUEL.pingAt > DUEL_PING_EVERY) duelPing();
  // Новый вызов показываем, как только не мешает другое окно
  const ch = DUEL.inbox.find((c) => !DUEL.seen[c.id]);
  if (ch && !modalOpen() && !OB && !RP) { DUEL.seen[ch.id] = true; duelIncoming(ch); }
});
HOOKS.load.push(() => { if (DUEL.deepLink) setTimeout(duelPing, 1500); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && typeof S !== 'undefined') setTimeout(duelPing, 300); });

function duelIncoming(ch) {
  sfx('notify'); haptic('heavy');
  const fight = ch.kind === 'fight';
  openModal(`<div class="duel-call ${fight ? 'fight' : 'rps'}">
      <div class="dc-glow"></div><div class="dc-icon ${fight ? '' : 'rps'}">${fight ? '🥊' : '<span>✊</span><span>✌️</span><span>✋</span>'}</div>
      <div class="dc-from"><div class="top-ava">${esc((ch.from || '?')[0].toUpperCase())}</div><div><b>${esc(ch.from)}</b><small>ур. ${ch.level}</small></div></div>
      <h3>${fight ? 'Вызов на бой!' : 'Вызов в КНБ!'}</h3>
      ${ch.stake ? `<div class="dc-stake">Ставка <b>${fmt(ch.stake)} ₽</b> · победитель забирает ${fmt(Math.round(ch.stake * 2 * (1 - RPS_FEE)))} ₽</div>` : ''}
      <div class="dc-timer">⏳ <span data-until="${Date.now() + ch.left * 1000}"></span></div>
      <div class="btns" style="flex-direction:column;gap:8px">
        <button class="btn primary wide big-accept" data-act="duelAccept" data-id="${ch.id}">✅ Принять</button>
        <button class="btn wide" data-act="duelDecline" data-id="${ch.id}">Отказаться</button></div></div>`, { center: true, locked: true });
}

// ---------- Вызов игрока ----------
const NOTIFY_TEXT = {
  ok: '📨 Бот отправил ему уведомление с кнопкой «Принять»',
  gap: '📨 Уведомление уже отправлено',
  blocked: '⚠️ Уведомление не дошло: игрок не запускал бота или заблокировал его. Перешли ему ссылку на игру',
  error: '⚠️ Telegram не принял уведомление, попробуй «Напомнить» через минуту',
  off: '⚠️ Бот не подключён к серверу — уведомление не отправлено',
};
async function duelChallenge(kind, pid, stake = 0) {
  if (!onlineOn()) { toast('Вызовы работают в игре внутри Telegram', 'bad'); return; }
  if (DUEL.sending) return;
  if (kind === 'fight') {
    if (level() < FIGHT_LEVEL) { toast(`Драки открываются с ${FIGHT_LEVEL} уровня`, 'bad'); return; }
    if (!obCanFight()) return;
  } else if (!rpCan(stake)) return;
  DUEL.sending = true;
  closeModal();
  toast('⚔️ Отправляем вызов…');
  try {
    const r = await apiPost('duel/challenge', { kind, pid, stake, level: level(), fighter: kind === 'fight' ? obFighter() : undefined });
    if (r.error) { toast(r.error, 'bad'); return; }
    const vs = { id: r.id, name: r.to, online: r.online, notify: r.notify || (r.notified ? 'ok' : 'error'), seen: false, until: Date.now() + 5 * 60000 };
    DUEL.out = vs;
    if (kind === 'fight') {
      obPay();
      obStart(r.view);
      OB.vs = vs;
      obWaitingModal();
    } else {
      rpPay(stake);
      rpStart(r.view, vs);
    }
    sfx('whoosh');
    track('duelCall');
  } catch (e) { toast(refErrorText(e), 'bad'); }
  finally { DUEL.sending = false; }
}

// Окно ожидания вызванного соперника (и для боя, и для КНБ): статус доставки, таймер, «Напомнить»
function duelWaitHTML(vs, kind, cancelAct) {
  return `<div class="duel-wait">
      <div class="dw-radar"><span></span><span></span><span></span><div class="dw-icon">${kind === 'fight' ? '🥊' : '✊'}</div></div>
      <h3>Вызов: ${esc(vs.name)}</h3>
      <div class="dw-steps">
        <div class="ok">✅ Вызов отправлен</div>
        <div class="${vs.notify === 'ok' || vs.notify === 'gap' ? 'ok' : 'warn'}" id="dwNotify">${vs.online ? '🟢 Игрок сейчас в игре — увидит вызов через пару секунд' : NOTIFY_TEXT[vs.notify] || NOTIFY_TEXT.error}</div>
        <div class="${vs.seen ? 'ok' : 'wait'}" id="dwSeen">${vs.seen ? '👀 Игрок увидел вызов' : '⏳ Ждём, когда игрок откроет вызов'}</div>
      </div>
      <div class="dc-timer">Вызов действует ещё <span data-until="${vs.until}"></span></div>
      <div class="btns" style="flex-direction:column;gap:8px">
        ${vs.notify === 'blocked' ? '<button class="btn primary wide" data-act="duelShareLink">📨 Переслать ссылку на игру</button>' : '<button class="btn wide" data-act="duelRemind">🔔 Напомнить ещё раз</button>'}
        <button class="btn wide" data-act="${cancelAct}">Отменить вызов</button></div></div>`;
}
// Пока ждём — раз в 2 секунды узнаём, увидел ли игрок вызов
setInterval(async () => {
  const vs = DUEL.out;
  const waiting = vs && ((OB && OB.vs === vs && OB.view.status === 'waiting') || (RP && RP.vs === vs && RP.view.status === 'waiting'));
  if (!waiting) { if (vs && !(OB && OB.vs === vs) && !(RP && RP.vs === vs)) DUEL.out = null; return; }
  try {
    const s = await apiPost('duel/status', { id: vs.id });
    if (s.seen && !vs.seen) { vs.seen = true; sfx('notify'); if ($('dwSeen')) { $('dwSeen').className = 'ok'; $('dwSeen').textContent = '👀 Игрок увидел вызов'; } }
    if (s.notified && vs.notify !== 'ok' && $('dwNotify')) { vs.notify = 'ok'; $('dwNotify').className = 'ok'; $('dwNotify').textContent = NOTIFY_TEXT.ok; }
  } catch (e) { /* сеть */ }
}, 2000);

const _obWaitingModal = obWaitingModal;
obWaitingModal = () => {
  if (!OB || !OB.vs) { _obWaitingModal(); return; }
  openModal(duelWaitHTML(OB.vs, 'fight', 'obLeave'), { center: true, locked: true });
};

function duelRpsMenu(pid, name) {
  openModal(`<div class="rps-menu">
      <div class="rm-hands"><span>✊</span><span>✌️</span><span>✋</span></div>
      <h3>КНБ с ${esc(name)}</h3>
      <p>До трёх побед. Выбери ставку — победитель забирает обе (комиссия ${RPS_FEE * 100}%).</p>
      <div class="rm-stakes">${RPS_STAKES.map((s) => `<button class="rm-stake ${s ? '' : 'free'}" data-act="duelRps" data-id="${s}:${pid}" ${S.money >= s ? '' : `disabled data-why="Не хватает ${fmt(s - S.money)} ₽"`}>
        <b>${s ? fmtShort(s) + ' ₽' : 'Без ставки'}</b><small>${s ? `выигрыш ${fmtShort(Math.round(s * 2 * (1 - RPS_FEE)))} ₽` : 'просто на интерес'}</small></button>`).join('')}</div>
      <div class="btns"><button class="btn wide" data-act="close">Отмена</button></div></div>`, { center: true });
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
  return l.map((p) => card({ thumb: `<div class="top-ava frame-${esc(p.frame || 'none')}">${avaFace(p.name, p.avatar)}</div>`,
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
      <div class="top-ava frame-${esc(p.stats.frame || 'none')}">${avaFace(p.name, p.stats.avatar)}${p.online ? '<i class="online-dot on-ava"></i>' : ''}</div>
      <div class="card-body"><div class="card-title">${esc(p.name)}${p.stats.vip ? ' 👑' : ''}${p.me ? ' (ты)' : ''}</div>
        <div class="card-desc">${p.online && !p.me ? '<b class="online-txt">в игре</b> · ' : ''}Ур. ${p.stats.level} · ${esc(HOUSING[Math.round(p.stats.housing || 0)].name)}${p.stats.job_name ? ` · ${esc(p.stats.job_name.split(' · ')[0])}` : ''}</div></div>
      <div class="top-score">${fmt(p.score)}<small>баллов</small></div></summary>
      ${!p.me && p.pid ? duelBtns(p.pid, p.name) : ''}${topStatsHTML(p.stats)}</details>`).join('');
  return head + onlineBox + `<div class="subhead">Лучшие игроки · нажми, чтобы сравнить или вызвать</div>${rows || '<div class="info-card">Пока никого нет — будь первым!</div>'}`;
};

// =====================================================================
// Камень-ножницы-бумага онлайн
// =====================================================================
let RP = null; // { code, view, timer, shown, busy, animating, vs, done, deadline, lastPoll }
const RPS_TIME = 15;
const RPS_RING = 2 * Math.PI * 34; // длина окружности таймера

function rpCan(stake) {
  if (S.busy) { toast('Валера занят', 'bad'); return false; }
  if (S.money < stake) { toast('Не хватает денег на ставку', 'bad'); return false; }
  return true;
}
function rpPay(stake) { if (stake) S.money -= stake; }
function rpRefund(stake) { if (stake) S.money += stake; }

function rpStart(view, vs) {
  rpStop();
  RP = { code: view.code, view, timer: null, shown: view.log.length, busy: false, animating: false, vs, done: false, lastPoll: 0, picked: null,
    deadline: view.status === 'active' && view.left != null ? Date.now() + view.left * 1000 : 0 };
  if (view.status === 'waiting') rpWaitingModal(); else rpGameModal();
  // Один частый цикл: плавный таймер на экране + опрос сервера (чаще, пока ждём ход соперника)
  RP.timer = setInterval(rpLoop, 100);
}
function rpStop() { if (RP && RP.timer) clearInterval(RP.timer); }

function rpLoop() {
  if (!RP) return;
  const v = RP.view;
  const fast = v.status === 'waiting' || (v.status === 'active' && (v.myMoved || (RP.deadline && RP.deadline - Date.now() < 1500)));
  if (!RP.busy && Date.now() - RP.lastPoll > (fast ? 400 : 1000)) rpPoll();
  rpTimerRender();
}

function rpWaitingModal() {
  if (RP.vs) { openModal(duelWaitHTML(RP.vs, 'rps', 'rpLeave'), { center: true, locked: true }); return; }
  const st = RP.view.stake;
  openModal(`<div class="duel-wait">
      <div class="dw-radar"><span></span><span></span><span></span><div class="dw-icon">✊</div></div>
      <h3>Ищем соперника…</h3>
      <p>Как только живой игрок выберет ту же ставку — начнём.<br>Ставка: <b>${st ? `${fmt(st)} ₽` : 'без ставки'}</b></p>
      <div class="btns"><button class="btn wide" data-act="rpLeave">Отменить</button></div></div>`, { center: true, locked: true });
}

function rpPips(n, win) { return Array.from({ length: win }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join(''); }

function rpGameModal() {
  const v = RP.view;
  openModal(`<div class="rps2">
      <div class="r2-head"><span id="rpRound">Раунд ${v.round}</span>${v.stake ? `<span class="r2-pot">🏆 ${fmt(Math.round(v.stake * 2 * (1 - RPS_FEE)))} ₽</span>` : ''}</div>
      <div class="r2-score">
        <div class="r2-pl me"><div class="top-ava">${esc((playerName() || 'Я')[0].toUpperCase())}</div><b>Ты</b><div class="r2-pips" id="rpMeS">${rpPips(v.me.score, v.win)}</div></div>
        <div class="r2-pl op"><div class="top-ava">${esc((v.op.name || '?')[0].toUpperCase())}</div><b>${esc(v.op.name)}</b><div class="r2-pips" id="rpOpS">${rpPips(v.op.score, v.win)}</div></div>
      </div>
      <div class="r2-arena">
        <div class="r2-hand me" id="rpMe">❔</div>
        <div class="r2-vs"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" class="bg"/><circle cx="40" cy="40" r="34" class="fg" id="rpRing" stroke-dasharray="${RPS_RING}" stroke-dashoffset="0"/></svg><b id="rpSec">15</b></div>
        <div class="r2-hand op" id="rpOp">🤔</div>
      </div>
      <div class="r2-status" id="rpLog">До ${v.win} побед. Выбирай!</div>
      <div class="r2-banner" id="rpBanner"></div>
      <div class="r2-btns" id="rpBtns">${Object.keys(RPS_E).map((m) => `<button class="r2-btn" data-act="rpMove" data-id="${m}" data-silent="1"><span>${RPS_E[m]}</span>${RPS_N[m]}</button>`).join('')}</div>
      <button class="btn small ob-leave" data-act="rpLeave">🏳️ Сдаться</button>
    </div>`, { center: true, locked: true });
  sfx('bell'); haptic('medium');
  rpRender();
}

function rpTimerRender() {
  if (!RP || !$('rpRing')) return;
  const v = RP.view;
  const left = v.status === 'active' && RP.deadline ? Math.max(0, (RP.deadline - Date.now()) / 1000) : 0;
  $('rpRing').style.strokeDashoffset = RPS_RING * (1 - clamp(left / RPS_TIME, 0, 1));
  $('rpRing').classList.toggle('low', left <= 5);
  const sec = Math.ceil(left);
  if ($('rpSec').textContent !== String(sec)) { $('rpSec').textContent = sec; if (sec <= 3 && sec > 0 && !v.myMoved) sfx('tick'); }
}

function rpRender() {
  const v = RP.view;
  if (!$('rpBtns')) return;
  if (!RP.animating) {
    $('rpMeS').innerHTML = rpPips(v.me.score, v.win);
    $('rpOpS').innerHTML = rpPips(v.op.score, v.win);
    $('rpRound').textContent = v.status === 'finished' ? 'Игра окончена' : `Раунд ${v.round}`;
  }
  const can = v.status === 'active' && !v.myMoved && !RP.animating;
  $('rpBtns').querySelectorAll('.r2-btn').forEach((b) => {
    b.disabled = !can;
    b.classList.toggle('picked', RP.picked === b.dataset.id && v.myMoved);
    b.classList.toggle('dim', v.myMoved && RP.picked !== b.dataset.id);
  });
  if (!RP.animating && v.status === 'active') {
    $('rpOp').textContent = v.opMoved ? '✔️' : '🤔';
    $('rpOp').className = `r2-hand op${v.opMoved ? ' ready' : ''}`;
    if (!v.myMoved) { $('rpMe').textContent = '❔'; $('rpMe').className = 'r2-hand me'; $('rpLog').textContent = v.opMoved ? 'Соперник уже выбрал — твой ход!' : 'Выбирай!'; }
    else $('rpLog').textContent = v.opMoved ? 'Вскрываемся…' : 'Ждём соперника…';
  }
}

async function rpPoll() {
  if (!RP || RP.busy) return;
  RP.busy = true; RP.lastPoll = Date.now();
  try { rpApply(await apiPost('rps/state', { code: RP.code })); } catch (e) { /* сеть моргнула */ }
  if (RP) RP.busy = false;
}

async function rpApply(v) {
  if (!RP) return;
  const wasWaiting = RP.view.status === 'waiting';
  const prevRound = RP.view.round;
  RP.view = v;
  if (v.status === 'active' && v.left != null && (v.round !== prevRound || !RP.deadline || Math.abs(RP.deadline - (Date.now() + v.left * 1000)) > 1500)) RP.deadline = Date.now() + v.left * 1000;
  if (wasWaiting && v.status === 'active') { sfx('notify'); haptic('heavy'); RP.deadline = Date.now() + (v.left || RPS_TIME) * 1000; rpGameModal(); return; }
  if (wasWaiting && v.status === 'finished') { rpStop(); rpRefund(v.stake); RP = null; closeModal(); toast(v.reason || 'Игра не состоялась'); save(); return; }
  if (!$('rpBtns')) return;
  while (RP && RP.shown < v.log.length && !RP.animating) {
    RP.animating = true;
    rpRender();
    await rpAnimate(v.log[RP.shown]);
    if (!RP) return;
    RP.shown++;
    RP.picked = null;
    RP.animating = false;
  }
  rpRender();
  if (v.status === 'finished' && RP.shown >= v.log.length) rpFinish(v);
}

async function rpAnimate(e) {
  const me = $('rpMe'), op = $('rpOp');
  if (!me) return;
  me.className = 'r2-hand me'; op.className = 'r2-hand op';
  me.textContent = op.textContent = '✊';
  // «Камень… Ножницы… Бумага… Раз!» — три взмаха кулаками
  for (const word of ['Камень…', 'Ножницы…', 'Бумага…']) {
    $('rpLog').textContent = word;
    me.classList.remove('pump'); op.classList.remove('pump'); void me.offsetWidth;
    me.classList.add('pump'); op.classList.add('pump');
    sfx('tap'); haptic('light');
    await wait(330);
    if (!$('rpMe')) return;
  }
  me.classList.remove('pump'); op.classList.remove('pump');
  me.textContent = e.my ? RPS_E[e.my] : '💤';
  op.textContent = e.op ? RPS_E[e.op] : '💤';
  me.classList.add('reveal'); op.classList.add('reveal');
  if (e.res === 'me') { me.classList.add('win'); op.classList.add('lose'); }
  else if (e.res === 'op') { op.classList.add('win'); me.classList.add('lose'); }
  const banner = $('rpBanner');
  const txt = e.res === 'me' ? 'Раунд твой!' : e.res === 'op' ? 'Раунд за соперником' : 'Ничья';
  banner.className = `r2-banner show ${e.res}`;
  banner.textContent = txt;
  sfx(e.res === 'me' ? 'coin' : e.res === 'op' ? 'punch' : 'whoosh');
  haptic(e.res === 'me' ? 'success' : e.res === 'op' ? 'heavy' : 'light');
  $('rpLog').textContent = `${e.my ? RPS_N[e.my] : 'Не успел'} — ${e.op ? RPS_N[e.op].toLowerCase() : 'соперник не успел'}`;
  const upto = RP.view.log.slice(0, RP.shown + 1);
  $('rpMeS').innerHTML = rpPips(upto.filter((x) => x.res === 'me').length, RP.view.win);
  $('rpOpS').innerHTML = rpPips(upto.filter((x) => x.res === 'op').length, RP.view.win);
  await wait(1300);
  if (banner) banner.className = 'r2-banner';
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
    emoji = '👑'; title = 'Победа!'; good = true;
    text = `${v.reason}. ${esc(v.op.name)} повержен!${prize ? `<br><b class="gold">+${fmt(prize)} ₽</b>` : ''}<br>+12 опыта, +10 😊`;
    confetti(80); sfx('win');
  } else if (v.winner === 'op') {
    addMood(-4); addXp(4);
    emoji = '😤'; title = 'Поражение'; text = `${v.reason}. ${esc(v.op.name)} оказался хитрее.${v.stake ? `<br>Ставка ${fmt(v.stake)} ₽ ушла сопернику` : ''}`;
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
  duelRps: (id) => { const [s, pid] = id.split(':'); duelChallenge('rps', pid, +s); },
  duelRemind: async () => {
    const vs = DUEL.out;
    if (!vs) return;
    if (Date.now() - (vs.remindAt || 0) < 60000) { toast('Напомнить можно раз в минуту'); return; }
    vs.remindAt = Date.now();
    try {
      const r = await apiPost('duel/remind', { id: vs.id });
      if (r.error) { toast(r.error, 'bad'); return; }
      vs.notify = r.notify;
      toast(r.notify === 'ok' ? '🔔 Бот напомнил о вызове' : NOTIFY_TEXT[r.notify] || NOTIFY_TEXT.error, r.notify === 'ok' ? 'good' : 'bad');
      if ($('dwNotify')) { $('dwNotify').className = r.notify === 'ok' ? 'ok' : 'warn'; $('dwNotify').textContent = NOTIFY_TEXT[r.notify] || NOTIFY_TEXT.error; }
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  duelShareLink: () => {
    const text = 'Вызываю тебя в «Симуляторе бомжа»! ⚔️ Запусти бота и открой игру — вызов ждёт 5 минут';
    const url = `https://t.me/share/url?url=${encodeURIComponent(BOT_LINK || 'https://t.me')}&text=${encodeURIComponent(text)}`;
    if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, '_blank');
  },
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
    sfx('chip'); haptic('medium');
    RP.view.myMoved = true;
    RP.picked = move;
    $('rpMe').textContent = RPS_E[move];
    $('rpMe').className = 'r2-hand me picked';
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
