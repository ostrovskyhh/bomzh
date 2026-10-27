// Сервис 2.5: настройки по разделам, баг-репорт и «предложить изменение» (приходят админу в бота),
// всплывающие рассылки от админа, напоминания бота о счетах за жильё, автоплатёж за звёзды,
// «Позвать в банду» из профиля игрока и списка друзей.

// =====================================================================
// Настройки по разделам
// =====================================================================
const SET_TABS = [['game', '🎮 Игра'], ['sound', '🔊 Звук'], ['friends', '🤝 Друзья'], ['help', '🆘 Помощь']];
openSettings = (function (orig) {
  return function () {
    orig();
    const sheet = document.querySelector('#modalRoot .sheet');
    if (!sheet || sheet.querySelector('.set-tabs')) return;
    const q = (s) => sheet.querySelector(s);
    const rowOf = (id) => { const b = sheet.querySelector(`[data-act="toggleSet"][data-id="${id}"]`); return b && b.closest('.set-row'); };
    const pick = (...els) => els.filter(Boolean);
    const sound = pick(rowOf('sfx'), rowOf('music'), rowOf('vibro'), ...sheet.querySelectorAll('.set-block'));
    const game = pick(q('[data-act="toggleRemind"]') && q('[data-act="toggleRemind"]').closest('.set-row'), q('[data-act="toggleTips"]') && q('[data-act="toggleTips"]').closest('.set-row'));
    const btn = (act) => q(`.btns [data-act="${act}"]`);
    const gameBtns = pick(btn('journal'), btn('story'), btn('restartTut'), btn('reset'));
    const helpBtns = pick(btn('openHelp'), btn('news'));
    const friends = pick(q('#refBox'), q('.code-row'));
    const admin = q('.admin-btn');
    const note = q('.test-note');
    const tab = S.setTab && SET_TABS.some(([id]) => id === S.setTab) ? S.setTab : 'game';
    const tabs = admin ? [...SET_TABS, ['admin', '🛠️ Админ']] : SET_TABS;
    const wrap = document.createElement('div');
    wrap.innerHTML = `<div class="seg-mini set-tabs">${tabs.map(([id, t]) => `<button class="${id === tab ? 'on' : ''}" data-act="setTab" data-id="${id}">${t}</button>`).join('')}</div>
      ${tabs.map(([id]) => `<div class="set-sec ${id === tab ? '' : 'hidden'}" data-sec="${id}"></div>`).join('')}
      <div class="btns"><button class="btn primary wide" data-act="close">Готово</button></div>`;
    const sec = (id) => wrap.querySelector(`[data-sec="${id}"]`);
    const list = (els) => { const d = document.createElement('div'); d.className = 'set-list'; els.forEach((e) => d.appendChild(e)); return d; };
    sec('game').appendChild(list(game));
    gameBtns.forEach((b) => { b.classList.add('wide'); sec('game').appendChild(b); });
    sec('sound').appendChild(list(sound));
    friends.forEach((e) => sec('friends').appendChild(e));
    sec('friends').insertAdjacentHTML('beforeend', '<button class="btn wide" data-act="openFriendsTab">👥 Мои друзья</button>');
    sec('help').insertAdjacentHTML('beforeend', `<button class="btn primary wide" data-act="feedback" data-id="bug">🐞 Сообщить о проблеме</button>
      <button class="btn wide" data-act="feedback" data-id="idea">💡 Предложить изменение</button>`);
    helpBtns.forEach((b) => sec('help').appendChild(b));
    if (note) sec('help').appendChild(note);
    if (admin) sec('admin').appendChild(admin);
    // Всё старое содержимое (кроме заголовка) заменяем разделами
    [...sheet.children].forEach((el) => { if (el.tagName !== 'H3') el.remove(); });
    [...wrap.children].forEach((el) => sheet.appendChild(el));
    sheet.querySelectorAll('.btns .btn, .set-sec > .btn').forEach((b) => b.classList.add('wide'));
  };
})(openSettings);
ACTIONS.setTab = (id) => {
  S.setTab = id;
  document.querySelectorAll('#modalRoot .set-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
  document.querySelectorAll('#modalRoot .set-sec').forEach((s) => s.classList.toggle('hidden', s.dataset.sec !== id));
};
ACTIONS.openFriendsTab = () => { closeModal(); showScreen('fun', 'friends'); };

// =====================================================================
// Баг-репорт и предложения — приходят админам в бота
// =====================================================================
ACTIONS.feedback = (kind) => {
  const bug = kind === 'bug';
  openModal(`<h3>${bug ? '🐞 Сообщить о проблеме' : '💡 Предложить изменение'}</h3>
    <p>${bug ? 'Что случилось и где? Например: «В “Вокзале” после конца игры окно не закрывается».' : 'Что добавить или изменить в игре? Лучшие идеи попадут в обновления.'}</p>
    <textarea id="fbText" class="fb-text" maxlength="1000" placeholder="${bug ? 'Опиши проблему…' : 'Твоя идея…'}"></textarea>
    <small class="fb-note">Вместе с сообщением отправятся версия игры, уровень, экран и последние действия за 5 минут — это поможет быстрее разобраться.</small>
    <div class="btns" style="flex-direction:column;gap:8px"><button class="btn primary wide" data-act="feedbackSend" data-id="${kind}">Отправить</button>
    <button class="btn wide" data-act="settings">Назад</button></div>`, { center: true });
  setTimeout(() => { const t = $('fbText'); if (t) t.focus(); }, 100);
};
ACTIONS.feedbackSend = async (kind) => {
  const text = (($('fbText') || {}).value || '').trim();
  if (text.length < 5) { toast('Опиши чуть подробнее', 'bad'); return; }
  if (!onlineOn()) { toast('Отправка работает в игре внутри Telegram', 'bad'); return; }
  const since = Date.now() - 5 * 60000; // последние 5 минут действий из журнала
  const log = (S.log || []).filter((x) => x.t >= since).slice(0, 25).map((x) => ({
    t: new Date(x.t).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    text: String(x.text || '').slice(0, 160), kind: x.kind || '',
  }));
  const ctx = { version: typeof CURRENT_VERSION !== 'undefined' ? CURRENT_VERSION : '', level: level(), screen: `${currentScreen}/${TABS[currentScreen] || ''}`,
    device: (tg && tg.platform) || navigator.platform || '', size: `${window.innerWidth}×${window.innerHeight}`, money: Math.floor(S.money), city: typeof cityName === 'function' ? cityName() : '', log };
  try {
    const r = await apiPost('feedback', { kind, text, ctx });
    if (r.error) { toast(r.error, 'bad'); return; }
    track(kind === 'bug' ? 'bugReport' : 'ideaSent');
    closeModal();
    resultModal({ emoji: kind === 'bug' ? '🛠️' : '💡', title: 'Спасибо!', text: kind === 'bug' ? 'Сообщение о проблеме отправлено разработчику. Постараемся исправить как можно скорее.' : 'Идея отправлена разработчику. Возможно, она появится в следующем обновлении!', btn: 'Ок' });
  } catch (e) { toast(refErrorText(e), 'bad'); }
};

// =====================================================================
// Рассылки от админа: всплывающее окно у всех игроков
// =====================================================================
async function broadcastCheck() {
  if (!onlineOn() || !LOADED || !S.storySeen) return;
  try {
    const r = await apiPost('broadcast/latest', { after: S.bcSeen || 0 });
    (r.items || []).forEach((b) => {
      S.bcSeen = Math.max(S.bcSeen || 0, b.id);
      // Кнопка рассылки ведёт в нужный раздел игры (admin5.js BC_BTNS)
      const go = typeof BC_BTNS !== 'undefined' && b.btn && BC_BTNS[b.btn];
      const show = () => { sfx('notify'); openModal(`<div class="bc-pop"><div class="bc-e">${esc(b.emoji || '📢')}</div><h3>${esc(b.title)}</h3><p>${esc(b.text).replace(/\n/g, '<br>')}</p>
        <small class="fb-note">Сообщение от администрации · ${timeStr(b.ts * 1000)}</small><div class="btns" style="flex-direction:column;gap:8px">${go ? `<button class="btn primary wide" data-act="bcGo" data-id="${esc(b.btn)}">${go[0]} ${go[1]}</button><button class="btn wide" data-act="close">Позже</button>` : '<button class="btn primary wide" data-act="close">Понятно</button>'}</div></div>`, { center: true }); };
      queuePopup('bc' + b.id, 2, show);
    });
    if (r.items && r.items.length) save();
  } catch (e) { /* сервер выключен */ }
}
// Очередь окон умеет и функции — для рассылок, которые пришли, пока было открыто другое окно
flushModalQueue = (function (orig) {
  return function () {
    const q = MODAL_QUEUE[0];
    if (q && q.fn && !MG && !modalOpen()) { MODAL_QUEUE.shift(); q.fn(); return; }
    orig();
  };
})(flushModalQueue);
HOOKS.load.push(() => setTimeout(broadcastCheck, 7000));
setInterval(broadcastCheck, 120000);

openAdmin = (function (orig) {
  return function () {
    orig();
    const grid = document.querySelector('#modalRoot .admin-grid');
    if (grid) grid.insertAdjacentHTML('afterend', '<div class="btns"><button class="btn wide primary" data-act="bcOpen">📢 Рассылка всем игрокам</button></div>');
  };
})(openAdmin);
ACTIONS.bcOpen = () => {
  if (!S.admin) return;
  openModal(`<h3>📢 Рассылка</h3><p>Всплывающее окно у всех игроков при входе в игру (видно неделю). Можно продублировать сообщением в бота.</p>
    <div class="gift-form">
      <label>Значок<select id="bcEmoji">${['📢', '🎉', '⚠️', '🛠️', '🎁', '🔥', '🏆'].map((e) => `<option>${e}</option>`).join('')}</select></label>
      <label>Заголовок<input id="bcTitle" maxlength="60" placeholder="Например: Технические работы"></label>
      <label>Текст<textarea id="bcText" class="fb-text" maxlength="600" placeholder="Что сообщить игрокам?"></textarea></label>
      <label class="bc-check"><input type="checkbox" id="bcBot"> Также отправить сообщением от бота</label></div>
    <div class="btns" style="flex-direction:column;gap:8px"><button class="btn primary wide" data-act="bcSend">Отправить всем</button><button class="btn wide" data-act="adminMenu">Назад</button></div>`, { center: true });
};
ACTIONS.bcSend = async (_, btn) => {
  const title = (($('bcTitle') || {}).value || '').trim(), text = (($('bcText') || {}).value || '').trim();
  if (!title || !text) { toast('Нужны заголовок и текст', 'bad'); return; }
  if (btn.dataset.confirm !== '1') { btn.dataset.confirm = '1'; btn.textContent = 'Точно отправить всем? Нажми ещё раз'; return; }
  try {
    const r = await apiPost('admin/broadcast', { title, text, emoji: ($('bcEmoji') || {}).value, bot: !!($('bcBot') || {}).checked });
    if (r.error) { toast(r.error, 'bad'); return; }
    closeModal();
    toast(`📢 Разослано${r.botTo ? ` · в бота: ${r.botTo} игрокам` : ''}`, 'good');
  } catch (e) { toast(refErrorText(e), 'bad'); }
};

// =====================================================================
// Счета за жильё: напоминания бота и автоплатёж
// =====================================================================
const AUTOPAY_STARS = 99;
function autopayOn() { return (S.autopayUntil || 0) > Date.now(); }
notifyPlan = (function (orig) {
  return function () {
    const plan = orig();
    if (S.housing >= 3 && !autopayOn() && S.billDue) {
      // Счета на паузе, пока игра закрыта (systems.js) — напоминать о сроке оплаты не о чем
    }
    return plan;
  };
})(notifyPlan);

// Пока автоплатёж действует, счета закрываются сами (раньше, чем начислится долг)
HOOKS.tick.unshift(() => {
  if (!autopayOn() || S.housing < 3 || !S.billDue) return;
  let n = 0;
  while (Date.now() >= S.billDue && n++ < 6) S.billDue += MONTH_MS;
  if (n) { toast(`🤖 Автоплатёж: счёт за жильё оплачен`, 'good'); track('autopay'); }
});
PREM_GIVE.autopay = () => {
  S.autopayUntil = Math.max(Date.now(), S.autopayUntil || 0) + 30 * 86400000;
  S.debt = 0; S.missed = 0;
  return '🤖 Автоплатёж за жильё на 30 дней — долг погашен';
};
function autopayHTML() {
  if (S.housing < 3) return '';
  return card({ thumb: '🤖', title: 'Автоплатёж за жильё', cls: autopayOn() ? 'current' : '',
    desc: autopayOn() ? `Включён до <b>${new Date(S.autopayUntil).toLocaleDateString('ru-RU')}</b>. Аренда и коммуналка платятся сами.`
      : '30 дней аренда и коммуналка оплачиваются сами — без долгов, выселения и отключённого света. Текущий долг гасится сразу.',
    btn: `<button class="btn primary" data-act="prem" data-id="autopay"><i class="ic" data-ic="star"></i>${AUTOPAY_STARS}</button>` });
}
const _housingTabAuto = EXTRA_TABS.shop.housing;
if (_housingTabAuto) EXTRA_TABS.shop.housing = () => autopayHTML() + _housingTabAuto();
donateHTML = (function (orig) { return () => orig().replace('<div class="subhead">Крышки → рубли</div>', `${S.housing >= 3 ? `<div class="subhead">Удобства</div>${autopayHTML()}` : ''}<div class="subhead">Крышки → рубли</div>`); })(donateHTML);

// =====================================================================
// «Позвать в банду» — в профиле игрока (топ, онлайн) и в списке друзей
// =====================================================================
duelBtns = (function (orig) {
  return (pid, name) => {
    const html = orig(pid, name);
    return S.clan ? html.replace(/<\/div>$/, `<button class="btn small" data-act="gangInvitePlayer" data-id="${esc(pid)}">🏴 В банду</button></div>`) : html;
  };
})(duelBtns);
const _friendsTabGang = EXTRA_TABS.fun.friends;
EXTRA_TABS.fun.friends = () => {
  const html = _friendsTabGang();
  return S.clan ? html.replace(/(<button class="btn small" data-act="frVisit" data-id="([^"]+)">🏠 В гости<\/button>)/g, '$1<button class="btn small" data-act="gangInvitePlayer" data-id="$2">🏴 В банду</button>') : html;
};
ACTIONS.gangInvitePlayer = async (pid) => {
  try {
    const r = await apiPost('gang/invite_player', { pid });
    if (r.error) { toast(r.error, 'bad'); return; }
    toast(`🏴 ${r.name} получил приглашение в банду от бота`, 'good'); sfx('good'); track('gangInvite');
  } catch (e) { toast(refErrorText(e), 'bad'); }
};
