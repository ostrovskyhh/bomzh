// Понятность 2.6: правила баллов топа таблицей, гайд «Как качать уровень», классы одежды,
// простая бизнес-математика, уникальное имя бомжа (= имя профиля) и окно «Пригласить друга».

// =====================================================================
// 1. Топ: за что и сколько баллов
// =====================================================================
const SCORE_UNITS = { level: 'за уровень', prestige: 'за престиж', housing: 'за ступень жилья', edu: 'за ступень учёбы', job: 'за должность', rating: 'за очко рейтинга выше 1000',
  wins: 'за победу', online_wins: 'за победу онлайн', ach: 'за уровень достижения', transport: 'за ступень транспорта', biz: 'за бизнес', quest: 'за главу сюжета', married: 'за свадьбу' };
function scoreRulesHTML(d) {
  if (!d || !d.rules) return '';
  const st = myStats();
  const rows = d.rules.map((r) => {
    let v = Math.max(0, Math.min(r.cap, +st[r.key] || 0) - (r.minus || 0));
    const pts = Math.round(v * r.points);
    return `<tr class="${pts ? '' : 'zero'}"><td>${r.label}<small>+${fmt(r.points)} ${SCORE_UNITS[r.key] || 'за единицу'}</small></td><td>${fmt(Math.round(v))}</td><td><b>${pts ? `+${fmt(pts)}` : '—'}</b></td></tr>`;
  }).join('');
  const earned = S.stats.earned || 0;
  const ePts = earned >= 1 ? Math.round(Math.log10(earned + 1) * (d.earnedPoints || 150)) : 0;
  return `<details class="score-rules" ${S.scoreRulesOpen ? 'open' : ''}><summary data-act="scoreRulesToggle">📊 За что начисляются баллы (твой расклад)</summary>
    <table><tr><th>Что</th><th>У тебя</th><th>Баллы</th></tr>${rows}
      <tr class="${ePts ? '' : 'zero'}"><td>Заработано за всё время<small>+${d.earnedPoints || 150} за каждый «ноль» суммы: 1 000 ₽ = 450, 1 млн = 900, 1 млрд = 1 350</small></td><td>${fmtShort(earned)} ₽</td><td><b>${ePts ? `+${fmt(ePts)}` : '—'}</b></td></tr>
    </table><small class="sr-note">Самые «дорогие» пункты: престиж (+3000), жильё (+400), образование (+300), семья (+300). Баллы обновляются раз в 5 минут.</small></details>`;
}
ACTIONS.scoreRulesToggle = () => { S.scoreRulesOpen = !S.scoreRulesOpen; };
const _topTabRules = EXTRA_TABS.tasks.top;
EXTRA_TABS.tasks.top = function topWithRules() {
  const html = _topTabRules();
  if (S.topMode === 'gangs' || !TOP.data) return html;
  const block = scoreRulesHTML(TOP.data);
  return html.replace(/<details class="top-why">[\s\S]*?<\/details>/, block) || html;
};

// =====================================================================
// 2. Как качать уровень
// =====================================================================
function bestXpNow() {
  const tips = [];
  const q = typeof currentQuest === 'function' ? currentQuest() : null;
  if (q && q.reward && q.reward.xp) tips.push([`📖 Глава сюжета «${q.title}»`, `+${q.reward.xp} опыта за главу — самый быстрый способ`, ['tasks', 'story']]);
  const jobs = JOBS.filter((j) => reqOk(j.req));
  if (jobs.length) { const j = jobs[jobs.length - 1]; tips.push([`💼 Смена «${j.name}»`, `+${8 + Math.min(JOBS.indexOf(j), 9) * 6} опыта за смену`, ['life', 'work']]); }
  if (typeof hasClaimable === 'function' && hasClaimable()) tips.push(['📋 Задания дня готовы', '+10 опыта за каждое — забери!', ['tasks', 'tasks']]);
  if (S.edu < EDU.length - 1) tips.push(['🎓 Учёба', '+4 за занятие, +25 за экзамен', ['life', 'study']]);
  if (level() >= FIGHT_LEVEL) tips.push(['👊 Драки', '+10…+30 опыта за победу', ['fun', 'fights']]);
  tips.push(['🗑️ Мусорка', '+4 опыта раз в 5 минут — не пропускай', ['game', null]]);
  return tips.slice(0, 4);
}
function openLevelGuide() {
  const li = levelInfo();
  const next = [];
  for (let l = li.level + 1; l <= li.level + 3; l++) { const u = unlocksAt(l); if (u.length) next.push(`<div class="lg-unlock"><b>Ур. ${l}</b> ${u.slice(0, 4).join(' · ')}</div>`); }
  const sources = [['🍾 Тап', `+${XP.tap} (≈1 за ${Math.round(1 / XP.tap)} тапов)`], ['🗑️ Мусорка', `+${XP.trash}`], ['🌆 Уличное событие', `+${XP.mini}…${XP.event}`],
    ['📚 Занятие / экзамен', `+${XP.lesson} / +${XP.exam}`], ['💪 Тренировка', `+${XP.gym}`], ['💼 Смена', '+8…+62 (чем выше работа — тем больше)'],
    ['💘 Свидание', `+${XP.date}`], ['📋 Задание дня / бонус дня', `+${XP.task} / +${XP.daily}`], ['🏠 Покупка жилья', `+${XP.house}`], ['📖 Глава сюжета', '+20…+4 000']];
  openModal(`<div class="lvl-guide"><h3>📈 Как качать уровень</h3>
    <div class="lg-now"><b>Уровень ${li.level}</b><div class="progress"><div style="width:${(li.cur / li.need) * 100}%"></div></div><small>${fmt(Math.floor(li.cur))} / ${fmt(li.need)} опыта · осталось ${fmt(Math.ceil(li.need - li.cur))}</small></div>
    <div class="subhead">🔥 Лучше всего сейчас</div>
    ${bestXpNow().map(([t, d, go]) => `<button class="lg-tip" data-act="lgGo" data-id="${go[0]}:${go[1] || ''}"><b>${t}</b><small>${d}</small><i>➜</i></button>`).join('')}
    ${next.length ? `<div class="subhead">🔓 Скоро откроется</div>${next.join('')}` : ''}
    <div class="subhead">Откуда берётся опыт</div>
    <div class="lg-table">${sources.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('')}</div>
    <small class="sr-note">Уровень даёт деньги, крышки на каждом 5-м уровне и открывает жильё, работу, девушек, казино.</small>
    <div class="btns"><button class="btn primary wide" data-act="close">Понятно</button></div></div>`, { center: true });
}
ACTIONS.lgGo = (arg) => { const [scr, tab] = arg.split(':'); closeModal(); showScreen(scr, tab || undefined); };
ACTIONS.levelGuide = () => openLevelGuide();
openProfile = (function (orig) {
  return function () {
    orig();
    const p = document.querySelector('#modalRoot .sheet > p');
    if (p) p.insertAdjacentHTML('afterend', `<div class="btn-row" style="margin-bottom:10px"><button class="btn primary" data-act="levelGuide">📈 Как качать уровень</button><button class="btn" data-act="nameEdit">✏️ Имя</button></div>`);
  };
})(openProfile);
// Нажатие на уровень/полоску опыта наверху — сразу гайд
HOOKS.init.push(() => { const pl = $('plevel'); if (pl) pl.parentElement.addEventListener('click', (e) => { if (e.target.closest('.plevel, .xpbar')) { e.stopPropagation(); openLevelGuide(); } }, true); });

// =====================================================================
// 3. Классы одежды
// =====================================================================
const TIER_INFO = [
  { name: 'Лохмотья', e: '🧥', pity: '100%' },
  { name: 'Базовая', e: '👕', pity: '40%' },
  { name: 'Приличная', e: '👔', pity: '10%' },
  { name: 'Деловая', e: '🤵', pity: '0%' },
];
function tierUnlocks(t) {
  const jobs = JOBS.filter((j) => Math.max(j.req.body || 0, j.req.shoes || 0) === t).map((j) => j.name);
  const girls = GIRLS.filter((g) => g.req && (g.req.body || 0) === t).map((g) => g.name.split(' ').pop());
  return [...jobs.slice(0, 4), ...girls.slice(0, 2).map((g) => `💘 ${g}`)].join(', ') || '—';
}
const _clothesTabClass = EXTRA_TABS.shop.clothes;
EXTRA_TABS.shop.clothes = () => {
  let html = _clothesTabClass();
  html = html.replace(/Класс: (лохмотья|базовая|приличная|деловая)/g, (_, t) => { const i = TIERS.indexOf(t); return `<span class="tier-chip t${i}">${TIER_INFO[i].e} ${TIER_INFO[i].name}</span>`; });
  const mine = ['body', 'shoes', 'hat'].map((s) => `<div><small>${SLOT_NAMES[s]}</small><span class="tier-chip t${tierOf(s)}">${TIER_INFO[tierOf(s)].e} ${TIER_INFO[tierOf(s)].name}</span></div>`).join('');
  const table = TIER_INFO.map((t, i) => `<div class="ct-row ${Math.min(tierOf('body'), tierOf('shoes')) >= i ? 'have' : ''}"><span class="tier-chip t${i}">${t.e} ${t.name}</span><small>Милостыня ${t.pity}${i ? ` · открывает: ${tierUnlocks(i)}` : ''}</small></div>`).join('');
  return `<div class="clothes-classes"><b>👕 Классы одежды</b><small>Работе и девушкам важен класс <b>тела и обуви</b> (шапка — для бонусов). Надень вещь нужного класса — требование выполнено.</small>
      <div class="cc-mine">${mine}</div>${table}</div>` + html;
};
// Глава «Без бумажки…» — понятнее, что именно надеть
(function () {
  const q = QUESTS.find((x) => x.id === 'school');
  if (q && q.goals[1]) q.goals[1].text = 'Надень одежду и обувь класса «Базовая» (Магазин → Одежда)';
})();

// =====================================================================
// 4. Бизнес простыми словами
// =====================================================================
function hoursText(h) { return h >= 48 ? `${Math.round(h / 24)} дн` : `${Math.round(h)} ч`; }
const _bizTabSimple = EXTRA_TABS.life.business;
EXTRA_TABS.life.business = () => {
  const full = _bizTabSimple();
  const clubPart = full.includes('<div class="subhead">🪩 Персонал клуба') ? full.slice(full.indexOf('<div class="subhead">🪩 Персонал клуба')) : '';
  const net = (v) => v * (1 - BIZ_TAX);
  const totalH = BUSINESSES.reduce((a, b) => a + (S.biz[b.id] ? net(bizIncome(b, S.biz[b.id])) : 0), 0);
  const rows = BUSINESSES.map((b) => {
    const st = S.biz[b.id];
    if (!st) {
      const ok = level() >= b.level;
      const inc = net(b.income);
      return card({ thumb: b.emoji, title: b.name, cls: ok ? '' : 'locked',
        desc: `💰 Приносит <b>${fmt(inc)} ₽/ч</b> чистыми<br>⏱️ Окупится за <b>${hoursText(b.price / inc)}</b>`,
        extra: ok ? '' : reqHTML({ level: b.level }), btn: ok ? priceBtn('bizBuy', b.id, b.price, S.money >= b.price) : lockBtn });
    }
    const inc = net(bizIncome(b, st)), cap = bizCap(b, st), pct = st.cash / cap;
    const fillH = Math.max(0, (cap - st.cash) / bizIncome(b, st));
    const upCost = bizUpgradeCost(b, st);
    const upGain = net(b.income * 0.35 * prestigeMult());
    return `<div class="card card-col biz">
      <div class="biz-head"><div class="thumb">${b.emoji}</div><div class="card-body"><div class="card-title">${b.name} <span class="rarity rare">ур. ${st.lvl}/${BIZ_MAX_LVL}</span></div>
        <div class="card-desc">💰 Приносит <b>${fmt(inc)} ₽/ч</b>${st.broken ? ' · <span style="color:var(--red)">🔧 сломано: доход вдвое меньше</span>' : ''}</div></div></div>
      <div class="progress"><div style="width:${pct * 100}%;${pct >= 1 ? 'background:var(--red)' : ''}"></div></div>
      <div class="card-desc">🗃️ В кассе <b>${fmt(net(st.cash))} ₽</b> — ${pct >= 1 ? '<span style="color:var(--red)">касса полная, доход стоит! Забери</span>' : `заполнится через ${leftText(fillH * 3600000)}`}</div>
      ${st.lvl < BIZ_MAX_LVL ? `<div class="card-desc">⬆️ Улучшение: <b>+${fmt(upGain)} ₽/ч</b> за ${fmt(upCost)} ₽ — окупится за ${hoursText(upCost / upGain)}</div>` : ''}
      <div class="row-btns">
        <button class="btn primary" data-act="bizCollect" data-id="${b.id}" ${st.cash >= 1 ? '' : 'disabled'}>Забрать</button>
        ${st.lvl < BIZ_MAX_LVL ? priceBtn('bizUp', b.id, upCost, S.money >= upCost, `⬆️ ${fmtShort(upCost)}`) : '<button class="btn" disabled>MAX</button>'}
        ${st.broken ? priceBtn('bizFix', b.id, b.price * 0.05, S.money >= b.price * 0.05, `🔧 ${fmtShort(b.price * 0.05)}`) : ''}
      </div></div>`;
  }).join('');
  return `<div class="info-card biz-how"><b>Как работает бизнес</b> — 3 шага:<br>1️⃣ Купи. 2️⃣ Деньги сами капают в кассу, даже когда ты не в игре. 3️⃣ Заходи и жми «Забрать».
      <br><small>Касса вмещает ${BIZ_CAP_HOURS} ч дохода${isVip() ? ' (с VIP — 12 ч)' : ''}. Цифры уже после налога ${BIZ_TAX * 100}%.</small>
      ${totalH ? `<br>Все твои бизнесы: <b>${fmt(totalH)} ₽/ч</b>` : ''}</div>${rows}${clubPart}`;
};

// =====================================================================
// 5. Уникальное имя бомжа = имя профиля
// =====================================================================
const _playerNameTg = playerName;
playerName = () => S.name || _playerNameTg();
HOOKS.hud.push(() => { const n = $('pname'); if (n && S.name && n.textContent !== S.name) n.textContent = S.name; });
function nameModal(first) {
  openModal(`<div class="name-pop"><div class="bc-e">🏷️</div><h3>${first ? 'Как зовут твоего бомжа?' : 'Сменить имя'}</h3>
    <p>${first ? 'Придумай имя — оно станет <b>уникальным именем твоего профиля</b>: его увидят в топе, чате, бандах и боях. Второго такого в игре не будет.' : 'Имя уникально и меняется раз в 7 дней.'}</p>
    <input id="nameInp" class="name-inp" maxlength="16" placeholder="Например: Валера Бутылкин" value="${esc(S.name || '')}" autocomplete="off">
    <small class="fb-note">3–16 символов: буквы, цифры, пробел, дефис</small>
    <div class="btns" style="flex-direction:column;gap:8px"><button class="btn primary wide" data-act="nameSave" data-id="${first ? 1 : 0}">Сохранить</button>
    ${first ? '<button class="btn wide" data-act="nameLater">Позже</button>' : '<button class="btn wide" data-act="close">Отмена</button>'}</div></div>`, { center: true, locked: !!first });
  setTimeout(() => { const i = $('nameInp'); if (i) i.focus(); }, 150);
}
ACTIONS.nameEdit = () => nameModal(false);
ACTIONS.nameLater = () => { S.namePromptAt = Date.now(); closeModal(); };
ACTIONS.nameSave = async (first) => {
  const name = (($('nameInp') || {}).value || '').trim();
  if (name.length < 3) { toast('Минимум 3 символа', 'bad'); return; }
  if (!onlineOn()) { S.name = name.slice(0, 16); closeModal(); updateHud(); toast(`🏷️ Теперь тебя зовут ${S.name}`, 'good'); return; }
  try {
    const r = await apiPost('name/set', { name, first: first === '1' });
    if (r.error) { toast(r.error, 'bad'); sfx('error'); return; }
    S.name = r.name; save(true);
    closeModal(); updateHud(); confetti(30); sfx('good');
    toast(`🏷️ Теперь тебя зовут ${r.name}!`, 'good');
    if (typeof topSubmit === 'function') topSubmit().catch(() => {});
  } catch (e) { toast(refErrorText(e), 'bad'); }
};
// После обновления: подтягиваем имя с сервера, а если его нет — один раз предлагаем придумать
HOOKS.load.push(() => setTimeout(async () => {
  if (!onlineOn() || !S.storySeen) return;
  try {
    const r = await apiPost('name/get');
    if (r.name) { S.name = r.name; updateHud(); return; }
  } catch (e) { return; }
  if (S.namePromptAt && Date.now() - S.namePromptAt < 86400000) return;
  const ask = () => { if (!popupTurn(2) || (S.tut && !S.tut.done)) { setTimeout(ask, 5000); return; } nameModal(true); };
  ask();
}, 6000));

// =====================================================================
// 6. «Пригласить друга» — одно понятное окно вместо прыжка в Telegram
// =====================================================================
ACTIONS.refShare = () => {
  if (!REF) { toast('Код ещё загружается, попробуй через пару секунд'); return; }
  const link = refLink();
  const text = `Залетай в «Симулятор бомжа»! 🍾 По моей ссылке — +1000 ₽ и опыт ×1.5 на старте. Код: ${REF.code.toUpperCase()}`;
  openModal(`<div class="invite-pop"><div class="bc-e">🤝</div><h3>Пригласить друга</h3>
    <div class="inv-preview"><b>Так увидит друг:</b><p>${esc(text)}</p><span>${esc(link)}</span></div>
    <div class="btns" style="flex-direction:column;gap:8px">
      <button class="btn primary wide" data-act="refSend">📨 Отправить в Telegram</button>
      <button class="btn wide" data-act="refCopyLink">🔗 Скопировать ссылку</button>
      <button class="btn wide" data-act="settings">Назад</button></div>
    <small class="fb-note">Друг откроет ссылку — бот подставит твой код сам. Тебе +500 ₽ и 30 🟡 за каждого.</small></div>`, { center: true });
};
ACTIONS.refSend = () => {
  const text = `Залетай в «Симулятор бомжа»! 🍾 По моей ссылке — +1000 ₽ и опыт ×1.5 на старте. Код: ${REF.code.toUpperCase()}`;
  const url = `https://t.me/share/url?url=${encodeURIComponent(refLink())}&text=${encodeURIComponent(text)}`;
  closeModal();
  if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, '_blank');
  track('refShare');
};
ACTIONS.refCopyLink = async () => {
  try { await navigator.clipboard.writeText(refLink()); toast('🔗 Ссылка скопирована — отправь её другу', 'good'); }
  catch (e) { toast(refLink()); }
};
