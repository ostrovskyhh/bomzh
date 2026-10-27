// Бой 2.0 и турнир 2.0 (3.2) — часть, которая должна идти после balance.js, arena.js и прочих.
// 1) Соперники больше не копируют твои силу и форму: их сила зависит от твоего рейтинга. Подкачался в зале —
//    побеждаешь чаще, рейтинг растёт, соперники крепчают. Сложные боты — с фиксированной силой: их можно «перерасти».
// 2) В спортзале видно, что каждая тренировка даёт в бою.
// 3) Турнир: лиги по мощи бойца, пары по очкам, один соперник на бой, призы за 1–3 места в каждой лиге.

// ---------- Соперники по рейтингу ----------
function rivalBase(rating = fightState().rating) { return clamp((rating - 760) / 9, 4, 100); } // 1000 → 27, 1300 → 60, 1600 → 93
function genRival(i) {
  const t = RIVAL_TIERS[i] || RIVAL_TIERS[1];
  const used = (fightState().rivals || []).map((r) => r.name);
  const base = rivalBase() + [-10, 0, 12][i];
  const eq = randomEq(clamp(Math.floor(base / 25) + (i === 2 ? 1 : 0), 0, 3));
  return {
    id: Date.now() + i, name: pick(RIVAL_NAMES.filter((n) => !used.includes(n))) || pick(RIVAL_NAMES),
    level: Math.max(1, Math.round(base / 2.2) + [-1, 0, 2][i]), style: pick(Object.keys(STYLES)), eq, diff: t.id, rewardK: t.reward,
    form: clamp(base + rand(-5, 5), 3, 100), strength: clamp(base + rand(-5, 5), 3, 100), hpMult: 1,
    tier: CLOTHES.body.find((x) => x.id === eq.body).tier + CLOTHES.shoes.find((x) => x.id === eq.shoes).tier,
    rating: Math.max(800, Math.round(fightState().rating + t.rating + rand(-40, 40))),
  };
}
// Старые соперники (подогнанные под тебя) пересоздаём один раз
HOOKS.load.push(() => { const st = fightState(); if (!st.rivalsV3) { st.rivals = []; st.rivalsV3 = true; } });


// ---------- Карточка «Твой боец» во вкладке «Драки» ----------
function myScore() { return fighterScore(myFighter()); }
function tourDivFor(score, divs) { let d = divs[0]; divs.forEach((x) => { if (score >= x.min) d = x; }); return d; }
const TOUR_DIVS_DEF = [{ id: 'rookie', name: 'Новички', emoji: '🥉', min: 0, fee: 1000 }, { id: 'fighter', name: 'Бойцы', emoji: '🥈', min: 120, fee: 5000 },
  { id: 'master', name: 'Мастера', emoji: '🥇', min: 220, fee: 20000 }, { id: 'legend', name: 'Легенды', emoji: '💎', min: 340, fee: 50000 }];
function fighterCard() {
  const me = myFighter(), s = fighterStats(me), sc = fighterScore(me), d = tourDivFor(sc, (TOUR.data && TOUR.data.divisions) || TOUR_DIVS_DEF);
  return `<div class="f3-card"><div class="f3-card-h"><b>🥊 Твой боец · мощь ${sc}</b><small>лига турнира: ${d.emoji} ${d.name}</small></div>
    <div class="stat-grid">
      <div>💪 Сила ${Math.round(me.strength)}<b>урон ${Math.round(s.atk)}</b></div><div>🏃 Форма ${Math.round(me.form)}<b>❤️ ${s.hp}</b></div>
      <div>🎯 Зона точного удара<b>+${Math.round((me.form || 0) * 0.5)}%</b></div><div>💨 Окно уклона<b>${(f3DodgeWin(me) / 1000).toFixed(2)} с</b></div>
    </div><small class="f3-note">Сила и форма растут в спортзале. Соперники подбираются по рейтингу, а не по твоим статам — чем ты сильнее, тем легче побеждать.</small></div>`;
}
const _fightsTab3 = EXTRA_TABS.fun.fights;
EXTRA_TABS.fun.fights = () => {
  let html = _fightsTab3();
  if (level() < FIGHT_LEVEL) return html;
  // Старая плашка статов и описание пошагового боя — заменяем карточкой бойца и правилами нового боя
  html = html.replace(/<div class="stat-grid">[\s\S]*?<\/div>\s*<\/div>/, fighterCard());
  html = html.replace(/Бой пошаговый:[^<]*?Драка стоит/, 'Бой 2.0: смотри на стойку соперника и выбирай удар, попадай в зону на полоске (в середину — крит), уклоняйся, когда кольцо сомкнётся. Мощный удар пробивает блок. Драка стоит');
  return html;
};

// ---------- Спортзал: что даёт тренировка в бою ----------
const _gymTab3 = EXTRA_TABS.life.gym;
EXTRA_TABS.life.gym = () => {
  const me = myFighter(), s = fighterStats(me), sc = fighterScore(me);
  return `<div class="f3-card gym"><div class="f3-card-h"><b>🥊 Зал → драки</b><small>мощь бойца ${sc}</small></div>
    <div class="f3-gym-rows">
      <div>💪 <b>Сила ${Math.round(me.strength)}</b> → урон удара <b>${Math.round(s.atk)}</b>, мощного — <b>${Math.round(s.atk * 1.9)}</b><small>+1 силы = +0.28 урона и +2 мощи</small></div>
      <div>🏃 <b>Форма ${Math.round(me.form)}</b> → здоровье в бою <b>${s.hp}</b>, выносливость +${Math.round(f3Regen(me))}/раунд<small>шире зона точного удара и дольше окно уклона (${(f3DodgeWin(me) / 1000).toFixed(2)} с)</small></div>
    </div></div>` + _gymTab3();
};

// ---------- Турнир 2.0 ----------
async function tourLoad(force) {
  if (!onlineOn() || TOUR.loading || (!force && Date.now() - TOUR.at < 20000)) return;
  TOUR.loading = true;
  try {
    const t = await apiPost('tour/state');
    // Для плашки на главном: банк и спонсор — твоей лиги
    const d = t.divisions ? (t.me ? t.divisions.find((x) => x.id === t.me.division) : tourDivFor(myScore(), t.divisions)) : null;
    if (d) { t.pool = d.pool; t.sponsor = d.sponsor; }
    TOUR.data = t; TOUR.error = '';
  } catch (e) { TOUR.error = 'Сервер турнира недоступен'; }
  TOUR.loading = false;
  TOUR.at = Date.now();
  if (currentScreen === 'fun' && TABS.fun === 'fights') renderCurrent(false);
}

function tourPrizeLine(d) {
  const ico = ['🍀', '🥇', '🥈', '🥉'];
  return (d.prizes || []).map((p) => `${ico[p.place]} ${fmt(p.amount)} ₽`).join(' · ');
}
function tourRules2(t) {
  const p = t.points || { win: 3, close: 1, loss: 0 };
  return `<details class="tour-rules"><summary>📜 Правила турнира</summary>
    <p>• Каждый вторник с ${t.startHour || 9}:00 до ${t.endHour || 21}:00 по Москве, ${t.fights} боёв.</p>
    <p>• Лигу подбирают по <b>мощи бойца</b> (сила×2 + форма×1.5 + уровень×3 + одежда×10) — дерёшься только с равными.</p>
    <p>• Соперник — из твоей лиги с ближайшим числом очков. Перевыбрать нельзя: пока не проведёшь бой, будет тот же.</p>
    <p>• Очки: победа — ${p.win}, поражение по очкам — ${p.close}, нокаут — ${p.loss}. При равенстве выше тот, у кого больше побед, потом — кто раньше закончил.</p>
    <p>• Банк лиги = взносы + спонсор. 🥇 50% · 🥈 25% · 🥉 15% · 🍀 10% случайному участнику, который провёл все бои.</p>
    <p>• Нет живых соперников в лиге — выходит турнирный боец силы этой лиги.</p></details>`;
}

function tourHTML() {
  if (!onlineOn()) return '';
  setTimeout(() => tourLoad(), 0);
  const t = TOUR.data;
  const head = `<b>🏆 Турнир района · вторник ${(t && t.startHour) || 9}:00–${(t && t.endHour) || 21}:00 МСК</b>`;
  if (!t || !t.divisions) return `<div class="tour-box">${head}<small>${TOUR.error || 'Загружаем…'}</small></div>`;
  const prize = t.prize ? `<button class="btn primary wide" data-act="tourClaim">🏆 Забрать · ${fmt(t.prize)} ₽</button>` : '';
  const score = myScore(), myDiv = tourDivFor(score, t.divisions);
  if (t.phase !== 'open') {
    const last = (t.last || []).map((w) => { const d = t.divisions.find((x) => x.id === w.division) || t.divisions[0]; return `${d.emoji} ${esc(w.name)}`; }).join(' · ');
    return `<div class="tour-box">${head}
      <small>⏳ Следующий турнир через <b>${leftText(t.opensIn * 1000)}</b>. Твоя мощь ${score} → лига ${myDiv.emoji} <b>${myDiv.name}</b> (взнос ${fmt(myDiv.fee)} ₽)</small>
      ${last ? `<small>Прошлые чемпионы: ${last}</small>` : ''}${tourRules2(t)}${prize}</div>`;
  }
  const me = t.me;
  const divs = `<div class="tour-divs">${t.divisions.map((d) => `<div class="${(me ? me.division : myDiv.id) === d.id ? 'mine' : ''}">
      <b>${d.emoji} ${d.name}</b><small>мощь от ${d.min} · взнос ${fmt(d.fee)} ₽</small><small>👥 ${d.count} · банк <b>${fmt(d.count ? d.pool : d.sponsor)} ₽</b></small></div>`).join('')}</div>`;
  if (!me) {
    return `<div class="tour-box open">${head}
      <small>До конца <b>${leftText(t.endsIn * 1000)}</b>. Твоя мощь <b>${score}</b> → лига ${myDiv.emoji} <b>${myDiv.name}</b></small>
      ${divs}${tourRules2(t)}
      ${priceBtn('tourJoin', '', myDiv.fee, S.money >= myDiv.fee, `Записаться в ${myDiv.emoji} ${myDiv.name} · ${fmt(myDiv.fee)} ₽`).replace('class="btn', 'class="btn wide')}${prize}</div>`;
  }
  const d = t.divisions.find((x) => x.id === me.division) || t.divisions[0];
  const table = t.table.length ? `<div class="tour-table">${t.table.map((r) => `<div class="${r.me ? 'me' : ''}"><span>${r.place}. ${esc(r.name)}</span><b>${r.points} очк.</b><i>${r.wins}п · ${r.fights}/${t.fights}</i></div>`).join('')}</div>` : '';
  const btn = me.fights < t.fights
    ? `<button class="btn primary wide" data-act="tourFight">🥊 ${me.pending ? `Бой с ${esc(me.pending.name)} (уже назначен)` : `Турнирный бой ${me.fights + 1}/${t.fights}`}</button>`
    : `<small>✅ Все бои проведены — итоги в ${t.endHour || 21}:00</small>`;
  return `<div class="tour-box open">${head}
    <div class="tour-me"><b>${d.emoji} ${d.name}</b><span>место <b>${me.place || '—'}</b> из ${me.of} · ${me.points} очк. · побед ${me.wins} · боёв ${me.fights}/${t.fights}</span></div>
    <small>Банк лиги <b>${fmt(d.pool)} ₽</b>: ${tourPrizeLine(d)} · до конца <b>${leftText(t.endsIn * 1000)}</b></small>
    ${btn}${table}${tourRules2(t)}${prize}</div>`;
}

Object.assign(ACTIONS, {
  tourJoin: async () => {
    const t = TOUR.data;
    if (!t) return;
    const fee = tourDivFor(myScore(), t.divisions).fee;
    if (S.money < fee) { toast(`Нужно ${fmt(fee)} ₽ на взнос`, 'bad'); return; }
    try {
      const f = myFighter();
      const r = await apiPost('tour/join', { name: playerName(), fighter: { level: f.level, form: f.form, strength: f.strength, tier: f.tier, eq: S.eq } });
      if (r.error) { toast(r.error, 'bad'); return; }
      S.money -= r.fee || fee;
      TOUR.data = r; TOUR.at = Date.now();
      const d = r.divisions.find((x) => x.id === r.me.division);
      track('tourJoin'); sfx('bell');
      toast(`🏆 Ты в лиге ${d.emoji} ${d.name}! ${r.fights} боёв до ${r.endHour}:00`, 'good');
      save(); renderCurrent(false);
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  tourFight: async () => {
    const why = fightCan();
    if (why) { toast(why, 'bad'); return; }
    try {
      const r = await apiPost('tour/opponent');
      if (r.error) { toast(r.error, 'bad'); return; }
      const o = r.opponent, token = r.token;
      const op = { name: o.name, style: pick(Object.keys(STYLES)), eq: o.eq && o.eq.body ? o.eq : { hat: 'none', body: 'base', shoes: 'base' },
        level: o.level || 5, form: o.form || 20, strength: o.strength || 20, tier: o.tier || 2, rating: fightState().rating };
      S.energy -= FIGHT_COST.energy;
      feed(-FIGHT_COST.food);
      startFight(op, { intro: `🏆 Турнирный бой${o.bot ? '' : ` · у соперника ${o.points || 0} очк.`}. Победа — 3 очка, выстоять до конца — 1`, onEnd: async (won) => {
        const outcome = won ? 'win' : F3_LAST && !F3_LAST.ko ? 'close' : 'loss';
        const st = fightState();
        if (won) { const dr = Math.max(2, eloDelta(op, true) * 2); st.rating += dr; st.wins++; addXp(20); addMood(10); track('fightWin'); track('tourWin'); confetti(50); sfx('win'); }
        else { st.rating = Math.max(0, st.rating + eloDelta(op, false)); addMood(-6); sfx('lose'); }
        track('fight');
        let res = null;
        try { res = await apiPost('tour/result', { token, outcome }); if (res && res.divisions) { TOUR.data = res; TOUR.at = Date.now(); } } catch (e) { /* сервер недоступен — бой останется назначенным, итог можно будет отправить позже нельзя */ }
        const got = res && res.got !== undefined ? res.got : { win: 3, close: 1, loss: 0 }[outcome];
        const me = res && res.me;
        resultModal({ emoji: won ? '🏆' : outcome === 'close' ? '🥊' : '🤕', rays: won ? '' : 'bad',
          title: won ? 'Турнирная победа!' : outcome === 'close' ? 'Выстоял до конца' : 'Нокаут',
          text: `+${got} очк.${me ? `<br>Ты на <b>${me.place}</b> месте из ${me.of} · ${me.points} очк. · боёв ${me.fights}/${res.fights}` : ''}`, btn: 'Ок' });
        save();
      } });
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
  tourClaim: async () => {
    try {
      const r = await apiPost('tour/claim');
      const amount = r.amount || 0;
      if (amount > 0) {
        addMoney(amount); save();
        const win = r.win ?? amount, place = r.place || 0, lucky = r.lucky || 0, refund = r.refund || 0;
        const lines = [win ? `🥇 Первое место: +${fmt(win)} ₽` : '', place ? `🥈 Призовое место: +${fmt(place)} ₽` : '', lucky ? `🍀 Приз счастливчику: +${fmt(lucky)} ₽` : '', refund ? `↩️ Возврат взноса: +${fmt(refund)} ₽` : ''].filter(Boolean);
        if (win) { track('tourPrize'); confetti(120); sfx('jackpot'); } else if (place) { confetti(60); sfx('win'); } else sfx('coin');
        resultModal({ emoji: win ? '🏆' : place ? '🥈' : lucky ? '🍀' : '↩️', title: win ? 'Ты чемпион лиги!' : place ? 'Призовое место!' : lucky ? 'Тебе повезло!' : 'Взнос вернули', text: lines.join('<br>'), btn: 'Забрать' });
      }
      tourLoad(true);
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
});
