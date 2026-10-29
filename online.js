// Онлайн: общий топ игроков и бои с живыми игроками по коду. Всё идёт через сервер в боте (bot/online.py)
// по тому же адресу ngrok, что и рефералка (REF_API в config.js).

function onlineOn() { return !!REF_API && !!refInitData(); }

async function apiPost(path, extra = {}) {
  if (!REF_API) throw new Error('off');
  if (!refInitData()) throw new Error('notg');
  return netPost(`${REF_API}/api/${path}`, { initData: refInitData(), ...extra });
}

// =====================================================================
// Топ: игра отправляет статистику, сервер считает баллы и место
// =====================================================================

const TOP_SUBMIT_EVERY = 5 * 60000;

function bestJob() {
  let best = null;
  JOBS.forEach((j) => { if (jobShifts(j.id)) { const r = jobRank(j.id); if (!best || r > best.r || (r === best.r && j.pay > best.j.pay)) best = { j, r }; } });
  return best;
}

function myStats() {
  const bj = bestJob();
  const fs = fightState();
  return {
    level: level(), prestige: S.prestige || 0, housing: S.ownedHousing || 0, edu: S.edu || 0,
    job: bj ? bj.r : 0, job_name: bj ? `${posName(bj.j.id, bj.r)} · ${bj.j.name}` : '',
    house_name: HOUSING[S.housing].name, rating: fs.rating, wins: fs.wins, online_wins: S.onlineWins || 0,
    ach: ACHS.filter((x) => x.id !== 'playtime').reduce((a, x) => a + achTier(x), 0), transport: S.transport || 0, biz: Object.keys(S.biz || {}).length,
    quest: (S.quest && S.quest.idx) || 0, married: S.married ? 1 : 0, earned: S.stats.earned, vip: isVip(),
  };
}

let TOP = { data: null, loading: false, error: '', at: 0, sentAt: 0 };

async function topSubmit() {
  TOP.sentAt = Date.now();
  return apiPost('top/submit', { stats: myStats(), hidden: !!S.admin });
}

HOOKS.tick.push(() => { if (onlineOn() && S.storySeen && Date.now() - TOP.sentAt > TOP_SUBMIT_EVERY) topSubmit().catch(() => {}); });

async function topLoad() {
  if (TOP.loading) return;
  TOP.loading = true;
  try {
    await topSubmit();
    TOP.data = await apiPost('top/list');
    TOP.error = '';
  } catch (e) { TOP.error = 'Сервер топа недоступен. Попробуй позже'; }
  TOP.loading = false;
  TOP.at = Date.now();
  if (currentScreen === 'tasks' && TABS.tasks === 'top') renderCurrent(false);
}

function topStatsHTML(s) {
  const tr = TRANSPORT[Math.round(s.transport || 0)] || TRANSPORT[0];
  const rows = [
    ['📍 Город', esc(s.city_name || 'Засранск')], ['⭐ Уровень', s.level], ['🌟 Престиж', s.prestige], ['🏠 Жильё', esc(s.house_name || HOUSING[Math.round(s.housing || 0)].name)], ['🎓 Образование', EDU[Math.round(s.edu || 0)].name],
    ['💼 Должность', s.job_name || '—'], ['👊 Рейтинг драк', Math.round(s.rating || 0)], ['🏆 Побед в драках', s.wins], ['⚔️ Побед онлайн', s.online_wins],
    ['🏅 Достижения', s.ach], ['🚗 Транспорт', `${tr.emoji} ${tr.name}`], ['🏪 Бизнесы', s.biz], ['📖 Глав сюжета', s.quest],
    ['💰 Заработано', `${fmt(s.earned || 0)} ₽`], ['💍 Семья', s.married ? 'Женат' : '—'],
  ];
  return `<div class="stat-grid top-stats">${rows.map(([k, v]) => `<div>${k}<b>${v}</b></div>`).join('')}</div>`;
}

EXTRA_TABS.tasks.top = function topTab() {
  if (!onlineOn()) {
    delete EXTRA_TABS.tasks.top;
    const html = renderTasks();
    EXTRA_TABS.tasks.top = topTab;
    return `<div class="info-card">🌍 Общий топ всех игроков работает в игре внутри Telegram.</div>${html}`;
  }
  if (!TOP.loading && Date.now() - TOP.at > 30000) setTimeout(topLoad, 0);
  const d = TOP.data;
  if (!d) return `<div class="info-card">${TOP.error || '⏳ Загружаем топ игроков…'}</div>`;
  const me = d.me;
  const head = `<div class="premium-hero top-hero"><div class="e">🏆</div><div>
      <b>${me && me.place ? `Твоё место: ${me.place} из ${d.total}` : me && me.hidden ? 'Админ в топе не участвует' : 'Ты пока не в топе'}</b>
      <p>${me ? `${fmt(me.score)} баллов` : ''}${TOP.loading ? ' · обновляем…' : ''}</p></div></div>
    ${me ? `<details class="top-why"><summary>Как считаются баллы</summary>
      <div class="info-card">Баллы складываются из всего, чего ты добился: уровень, престиж, жильё, учёба, должность, драки, достижения, транспорт, бизнесы, сюжет, семья и заработок за всё время.</div>
      <div class="top-parts">${me.parts.map(([k, v]) => `<div><span>${k}</span><b>+${fmt(v)}</b></div>`).join('')}</div></details>` : ''}
    ${TOP.error ? `<div class="info-card warn">${TOP.error}</div>` : ''}`;
  const rows = d.top.map((p, i) => `<details class="top-row ${p.me ? 'me' : ''}"><summary>
      <div class="rank r${i + 1}">${i + 1}</div>
      <div class="top-ava frame-${esc(p.stats.frame || 'none')}">${avaFace(p.name, p.stats.avatar)}</div>
      <div class="card-body"><div class="card-title">${userLabel(p.name)}${p.stats.vip ? ' 👑' : ''}${p.me ? ' (ты)' : ''}</div>
        <div class="card-desc"><span class="top-city">📍 ${esc(p.stats.city_name || 'Засранск')}</span> Ур. ${p.stats.level} · ${esc(p.stats.house_name || HOUSING[Math.round(p.stats.housing || 0)].name)}${p.stats.job_name ? ` · ${esc(p.stats.job_name.split(' · ')[0])}` : ''}</div></div>
      <div class="top-score">${fmt(p.score)}<small>баллов</small></div></summary>${topStatsHTML(p.stats)}</details>`).join('');
  return head + `<div class="subhead">Лучшие игроки · нажми, чтобы сравнить</div>${rows || '<div class="info-card">Пока никого нет — будь первым!</div>'}`;
};

// =====================================================================
// Онлайн-бой: создай комнату → отправь код другу → он вводит код → бой
// =====================================================================

const OB_POLL = 1000;
const OB_ROUND_TIME = 20;
let OB = null; // { code, view, timer, shown, rewarded, busy, animating }

function obFighter() {
  const f = myFighter();
  return { level: f.level, form: f.form, strength: f.strength, tier: f.tier, hpMult: f.hpMult, eq: S.eq };
}

function obCanFight() {
  if (S.busy) { toast('Валера занят', 'bad'); return false; }
  if (S.health < 30) { toast('Сначала подлечись — здоровье ниже 30', 'bad'); return false; }
  if (S.energy < FIGHT_COST.energy) { toast(`Нужно ${FIGHT_COST.energy} энергии`, 'bad'); return false; }
  if (S.food < FIGHT_COST.food) { toast('На голодный желудок не дерутся', 'bad'); return false; }
  return true;
}
function obPay() { S.energy -= FIGHT_COST.energy; feed(-FIGHT_COST.food); }

const _fightsTab = EXTRA_TABS.fun.fights;
EXTRA_TABS.fun.fights = () => {
  const base = _fightsTab();
  if (!REF_API || level() < FIGHT_LEVEL) return base;
  const box = `<div class="online-box"><b>⚔️ Онлайн-бой с живым игроком</b>
      <small>Создай бой и отправь другу код, или введи код друга. Ходите одновременно, ${OB_ROUND_TIME} секунд на ход. Стоит ${FIGHT_COST.energy} ⚡ и ${FIGHT_COST.food} 🍞.</small>
      ${onlineOn() ? `<button class="btn primary wide" data-act="obCreate">Создать бой</button>
      <div class="code-row"><input id="obCode" placeholder="Код боя" maxlength="5" autocomplete="off"><button class="btn" data-act="obJoin">В бой</button></div>`
      : '<small><b>Онлайн-бои работают в игре внутри Telegram.</b></small>'}
      ${S.onlineWins ? `<small>Побед онлайн: <b>${S.onlineWins}</b></small>` : ''}</div>`;
  // Блок онлайна — сразу после карточки лиги
  const i = base.indexOf('<div class="stat-grid">');
  return i > 0 ? base.slice(0, i) + box + base.slice(i) : box + base;
};

function obStart(view) {
  obStop();
  OB = { code: view.code, view, timer: null, shown: 0, rewarded: false, busy: false, animating: false };
  if (view.status === 'waiting') obWaitingModal(); else obBattleModal();
  OB.timer = setInterval(obPoll, OB_POLL);
}

function obStop() { if (OB && OB.timer) clearInterval(OB.timer); }

function obWaitingModal() {
  openModal(`<div class="big-art" style="height:90px"><div class="big-emoji" style="line-height:90px">⚔️</div></div>
    <h3>Ждём соперника</h3><p>Отправь другу этот код. Он вводит его во вкладке «Драки» → «В бой».</p>
    <div class="ob-code">${OB.code}</div>
    <div class="btns" style="flex-direction:column;gap:8px">
      <button class="btn primary wide" data-act="obShare">📨 Отправить код другу</button>
      <button class="btn wide" data-act="obCopy">📋 Скопировать код</button>
      <button class="btn wide" data-act="obLeave">Отменить</button></div>
    <p class="test-note">Комната ждёт 10 минут</p>`, { center: true, locked: true });
}

function obBattleModal() {
  const v = OB.view;
  openModal(`<div class="fight">
      <div class="f-round" id="obRound">Раунд ${v.round} из ${v.rounds}</div>
      <div class="ob-timer"><div id="obTimer"></div></div>
      <div class="f-arena">
        <div class="f-side"><div class="f-name">${userLabel(v.me.name)}</div><div class="f-ava" id="obMeAva">${valeraSVG(S.eq, lookState())}</div>
          <div class="f-bar hp"><div id="obMeHp"></div><span id="obMeHpT"></span></div><div class="f-bar st"><div id="obMeSt"></div></div><div class="f-move" id="obMeMove"></div></div>
        <div class="f-vs">VS</div>
        <div class="f-side"><div class="f-name">${userLabel(v.op.name)} <small>ур. ${v.op.level}</small></div><div class="f-ava flip" id="obOpAva">${valeraSVG(v.op.eq.body ? v.op.eq : { hat: 'none', body: 'rvan', shoes: 'none' }, { mood: 'ok' })}</div>
          <div class="f-bar hp"><div id="obOpHp"></div><span id="obOpHpT"></span></div><div class="f-bar st"><div id="obOpSt"></div></div><div class="f-move" id="obOpMove"></div></div>
      </div>
      <div class="f-log" id="obLog">Бой с живым игроком! Выбирай приём — у вас ${OB_ROUND_TIME} секунд.</div>
      <div class="f-btns" id="obBtns"></div>
      <button class="btn small ob-leave" data-act="obLeave">🏳️ Сдаться</button>
    </div>`, { center: true, locked: true });
  sfx('bell');
  OB.shown = v.log.length;
  obRender();
}

function obRender() {
  const v = OB.view;
  if (!$('obBtns')) return;
  const bar = (id, val, max) => { $(id).style.width = clamp(val / max, 0, 1) * 100 + '%'; };
  bar('obMeHp', v.me.hp, v.me.max); bar('obOpHp', v.op.hp, v.op.max);
  bar('obMeSt', v.me.st, 100); bar('obOpSt', v.op.st, 100);
  $('obMeHpT').textContent = `${Math.max(0, v.me.hp)}/${v.me.max}`;
  $('obOpHpT').textContent = `${Math.max(0, v.op.hp)}/${v.op.max}`;
  $('obRound').textContent = v.status === 'finished' ? 'Бой окончен' : `Раунд ${Math.min(v.round, v.rounds)} из ${v.rounds}`;
  $('obTimer').style.width = (v.left != null ? clamp(v.left / OB_ROUND_TIME, 0, 1) * 100 : 0) + '%';
  $('obTimer').classList.toggle('low', v.left != null && v.left <= 5);
  const canMove = v.status === 'active' && !v.myMoved && !OB.animating;
  $('obBtns').innerHTML = Object.entries(MOVES).map(([id, m]) => {
    const ok = canMove && (m.st <= 0 || v.me.st >= m.st);
    return `<button class="btn f-btn" data-act="obMove" data-id="${id}" data-silent="1" ${ok ? '' : 'disabled'}><span>${m.emoji}</span>${m.name}<small>${m.st > 0 ? `−${m.st}` : `+${-m.st}`} выносл.</small></button>`;
  }).join('');
  if (v.status === 'active' && v.myMoved && !OB.animating) $('obLog').innerHTML = v.opMoved ? 'Оба сходили…' : '⏳ Ждём ход соперника…';
}

async function obPoll() {
  if (!OB || OB.busy) return;
  OB.busy = true;
  try {
    const v = await apiPost('battle/state', { code: OB.code });
    obApply(v);
  } catch (e) { /* сеть моргнула — попробуем на следующем опросе */ }
  if (OB) OB.busy = false;
}

async function obApply(v) {
  if (!OB) return;
  const wasWaiting = OB.view.status === 'waiting';
  OB.view = v;
  if (wasWaiting && v.status === 'active') { sfx('notify'); obBattleModal(); return; }
  if (wasWaiting && v.status === 'finished') { obStop(); OB = null; closeModal(); toast(v.reason || 'Бой не состоялся'); refund(); return; }
  if (!$('obBtns')) return;
  // Новые раунды — проигрываем по очереди с анимацией
  while (OB && OB.shown < v.log.length && !OB.animating) {
    OB.animating = true;
    await obAnimate(v.log[OB.shown]);
    if (!OB) return;
    OB.shown++;
    OB.animating = false;
  }
  obRender();
  if (v.status === 'finished' && OB.shown >= v.log.length) obFinish(v);
}

function refund() { S.energy += FIGHT_COST.energy; feed(FIGHT_COST.food); }

async function obAnimate(e) {
  const meAva = $('obMeAva'), opAva = $('obOpAva');
  $('obMeMove').textContent = `${MOVES[e.my].emoji} ${MOVES[e.my].name}`;
  $('obOpMove').textContent = `${MOVES[e.op].emoji} ${MOVES[e.op].name}`;
  const lunge = (el, dir) => el && el.animate([{ transform: `translateX(0) ${el.classList.contains('flip') ? 'scaleX(-1)' : ''}` }, { transform: `translateX(${dir * 22}px) ${el.classList.contains('flip') ? 'scaleX(-1)' : ''}` }, { transform: `translateX(0) ${el.classList.contains('flip') ? 'scaleX(-1)' : ''}` }], { duration: 260 });
  const flash = (el) => el && el.animate([{ filter: 'brightness(2) saturate(0)' }, { filter: 'none' }], { duration: 300 });
  const show = (el, h) => { if (h.dmg || h.text) floatAt(el, h.dmg ? `−${h.dmg}${h.crit ? '!' : ''}` : h.text, h.dmg ? 'bad' : 'good'); };
  const snd = (h, move) => { if (h.dmg) sfx(h.crit || move === 'heavy' ? 'heavy' : h.text === 'в блок' ? 'block' : 'punch'); else if (h.text) sfx('whoosh'); };
  if (MOVES[e.my].mult) { lunge(meAva, 1); await wait(130); }
  snd(e.myHit, e.my); if (e.myHit.dmg) { flash(opAva); haptic('medium'); } show(opAva, e.myHit);
  await wait(420);
  if (MOVES[e.op].mult) { lunge(opAva, -1); await wait(130); }
  snd(e.opHit, e.op); if (e.opHit.dmg) { flash(meAva); haptic('heavy'); } show(meAva, e.opHit);
  const line = (who, move, h) => (h.dmg ? `${who}: ${MOVES[move].name.toLowerCase()} — ${h.dmg} урона${h.text ? ` (${h.text})` : ''}` : MOVES[move].mult ? `${who}: ${h.text || 'мимо'}` : `${who}: ${MOVES[move].name.toLowerCase()}`);
  if ($('obLog')) $('obLog').innerHTML = `${line('Ты', e.my, e.myHit)}<br>${line(OB.view.op.name, e.op, e.opHit)}`;
  await wait(500);
}

function obFinish(v) {
  if (!OB || OB.rewarded) return;
  OB.rewarded = true;
  obStop();
  const code = OB.code;
  OB = null;
  const taken = v.me.max - Math.max(0, v.me.hp);
  hurt(Math.round(taken * 0.25));
  let title, text, emoji, good = false;
  if (v.winner === 'me') {
    const m = Math.round((60 + v.op.level * 12) * prestigeMult());
    addMoney(m); addXp(25); addMood(15);
    S.onlineWins = (S.onlineWins || 0) + 1;
    track('onlineWin');
    emoji = '🏆'; title = 'Победа над живым игроком!'; good = true;
    text = `${v.reason === 'Нокаут' ? `${userLabel(v.op.name)} повержен! Нокаут` : `${userLabel(v.op.name)} проиграл. ${v.reason}`}<br>+${fmt(m)} ₽, +25 опыта, +15 😊`;
    confetti(70); sfx('win');
  } else if (v.winner === 'op') {
    addMood(-8); addXp(6);
    emoji = '🤕'; title = 'Поражение';
    text = `${userLabel(v.op.name)} оказался сильнее. ${v.reason}<br>−8 😊. Реванш?`;
    sfx('lose');
  } else {
    addXp(10);
    emoji = '🤝'; title = 'Ничья'; good = true;
    text = `Силы равны. ${v.reason}<br>+10 опыта`;
  }
  track('onlineFight');
  text += `<br><small>Получено урона: −${Math.round(taken * 0.25)} ❤️ · код боя ${code}</small>`;
  resultModal({ emoji, rays: good ? '' : 'bad', title, text, btn: 'Ок' });
  save();
  topSubmit().catch(() => {});
}

Object.assign(ACTIONS, {
  obCreate: async () => {
    if (!obCanFight()) return;
    try {
      const v = await apiPost('battle/create', { fighter: obFighter() });
      obPay();
      obStart(v);
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  obJoin: async () => {
    const inp = $('obCode');
    const code = inp ? inp.value.trim().toUpperCase() : '';
    if (code.length !== 5) { toast('Код боя — 5 символов', 'bad'); return; }
    if (!obCanFight()) return;
    try {
      const v = await apiPost('battle/join', { code, fighter: obFighter() });
      if (v.error) { toast(v.error, 'bad'); sfx('error'); return; }
      obPay();
      obStart(v);
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  obMove: async (move) => {
    if (!OB || OB.view.status !== 'active' || OB.view.myMoved || OB.animating) return;
    const m = MOVES[move];
    if (m.st > 0 && OB.view.me.st < m.st) return;
    sfx('tap');
    OB.view.myMoved = true;
    obRender();
    try { obApply(await apiPost('battle/move', { code: OB.code, move, round: OB.view.round })); } catch (e) { toast('Связь с сервером пропала, пробуем снова…', 'bad'); if (OB) { OB.view.myMoved = false; obRender(); } }
  },
  obLeave: async () => {
    if (!OB) { closeModal(); return; }
    const waiting = OB.view.status === 'waiting';
    try { const v = await apiPost('battle/leave', { code: OB.code }); if (waiting) { obStop(); OB = null; closeModal(); refund(); toast('Бой отменён'); } else obApply(v); }
    catch (e) { toast(refErrorText(e), 'bad'); }
  },
  obCopy: async () => {
    if (!OB) return;
    try { await navigator.clipboard.writeText(OB.code); toast('Код скопирован', 'good'); } catch (e) { toast(`Код боя: ${OB.code}`); }
  },
  obShare: () => {
    if (!OB) return;
    const text = `Вызываю тебя на бой в «Симуляторе бомжа»! ⚔️ Код боя: ${OB.code}. Открой игру → Досуг → Драки → «В бой»`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(BOT_LINK || 'https://t.me')}&text=${encodeURIComponent(text)}`;
    if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, '_blank');
  },
});
