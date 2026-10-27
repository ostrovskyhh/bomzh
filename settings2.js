// Настройки 4.2: сначала меню разделов (плитки с пояснением), внутри раздела — подписанные группы.
// Все переключатели и кнопки остаются прежними (те же data-act), меняется только раскладка.

const SET_PAGES = [
  { id: 'profile', e: '👤', t: 'Профиль', d: 'Имя, аватарка и рамка' },
  { id: 'notify', e: '🔔', t: 'Уведомления', d: 'О чём напишет бот' },
  { id: 'look', e: '🎨', t: 'Интерфейс', d: 'Дизайн и подсказки' },
  { id: 'sound', e: '🔊', t: 'Звук и вибрация', d: 'Звуки, музыка, отклик' },
  { id: 'progress', e: '💾', t: 'Игра и прогресс', d: 'Журнал, интро, обучение, сброс' },
  { id: 'friends', e: '🤝', t: 'Друзья', d: 'Код приглашения и друзья' },
  { id: 'help', e: '🆘', t: 'Помощь', d: 'Проблема, идея, справочник' },
];
let SET_PAGE = null;
function setEl(html) { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }

openSettings = (function (orig) {
  return function () {
    orig();
    const sheet = document.querySelector('#modalRoot .sheet');
    if (!sheet || sheet.querySelector('.set2')) return;
    const secs = {};
    sheet.querySelectorAll('.set-sec').forEach((s) => { secs[s.dataset.sec] = s; });
    if (!secs.game && !secs.sound) return; // старая раскладка не собралась — оставляем как есть
    const rowBy = (act) => { const b = sheet.querySelector(`[data-act="${act}"]`); return b && b.closest('.set-row'); };
    const btnBy = (act) => sheet.querySelector(`.set-sec [data-act="${act}"]`);
    const grp = (title, els, cls = '') => {
      const list = els.filter(Boolean);
      if (!list.length) return null;
      const d = document.createElement('div');
      d.className = `set-grp ${cls}`;
      d.innerHTML = `<div class="set-grp-t">${title}</div>`;
      const box = document.createElement('div');
      box.className = list.every((e) => e.classList.contains('set-row') || e.classList.contains('set-block')) ? 'set-list' : 'set-btns';
      list.forEach((e) => box.appendChild(e));
      d.appendChild(box);
      return d;
    };
    const soundRows = ['sfx', 'music', 'vibro'].map((k) => { const b = sheet.querySelector(`[data-act="toggleSet"][data-id="${k}"]`); return b && b.closest('.set-row'); });
    const blocks = [...sheet.querySelectorAll('.set-block')];
    const pages = {
      profile: [secs.profile ? grp('Как тебя зовут', [...secs.profile.children]) : null,
        grp('Внешний вид в топе и чате', [setEl('<button class="btn wide" data-act="setLook">😎 Аватарка и рамка</button>')])],
      notify: [grp('Сообщения от бота', [rowBy('toggleRemind'), rowBy('toggleRateNotify')]),
        setEl('<div class="set-hint">Бот пишет, только если ты разрешил ему сообщения в Telegram</div>')],
      look: [grp('Внешний вид', [rowBy('betaToggle')]), grp('Подсказки', [rowBy('toggleTips')])],
      sound: [grp('Звук', soundRows), grp('Музыка и тема звуков', blocks)],
      progress: [grp('История', [btnBy('journal'), btnBy('story')]), grp('Обучение', [btnBy('restartTut')]), grp('⚠️ Опасная зона', [btnBy('reset')], 'danger')],
      friends: secs.friends ? [grp('Друзья', [...secs.friends.children])] : [],
      help: secs.help ? [grp('Связь с разработчиком', [...secs.help.querySelectorAll('[data-act="feedback"]')]), grp('Справка', [btnBy('openHelp'), btnBy('news')]), secs.help.querySelector('.test-note')] : [],
      admin: secs.admin ? [grp('Админ', [...secs.admin.children])] : [],
    };
    const list = [...SET_PAGES, ...(secs.admin ? [{ id: 'admin', e: '🛠️', t: 'Админ', d: 'Игроки, мир, сервер' }] : [])];
    const page = list.some((p) => p.id === SET_PAGE) ? SET_PAGE : null;
    const wrap = document.createElement('div');
    wrap.className = 'set2';
    const lv = typeof level === 'function' ? level() : 1;
    wrap.innerHTML = `<div class="set2-home ${page ? 'hidden' : ''}">
        <div class="set2-me"><div class="avatar frame-${typeof currentFrame === 'function' ? currentFrame() : 'none'}">${typeof avaFace === 'function' ? avaFace(playerName(), S.avatar) : esc(playerName()[0])}</div>
          <div><b>${esc(playerName())}</b><small>${lv} уровень · ${typeof cityName === 'function' ? cityName() : ''}</small></div></div>
        <div class="set2-grid">${list.map((p) => `<button class="set2-tile" data-act="setGo" data-id="${p.id}"><span>${p.e}</span><b>${p.t}</b><small>${p.d}</small></button>`).join('')}</div>
        <div class="set2-quick"><small>Быстро</small>${['sfx', 'music', 'vibro'].map((k) => `<button class="chip ${S.settings[k] ? 'on' : ''}" data-act="toggleSet" data-id="${k}">${{ sfx: '🔊 Звуки', music: '🎵 Музыка', vibro: '📳 Вибрация' }[k]}</button>`).join('')}</div>
      </div>
      ${list.map((p) => `<div class="set2-page ${page === p.id ? '' : 'hidden'}" data-page="${p.id}"><button class="set2-back" data-act="setHome">‹ Все настройки</button><div class="set2-h"><span>${p.e}</span><b>${p.t}</b></div></div>`).join('')}
      <div class="btns"><button class="btn primary wide" data-act="close">Готово</button></div>`;
    list.forEach((p) => {
      const host = wrap.querySelector(`[data-page="${p.id}"]`);
      (pages[p.id] || []).filter(Boolean).forEach((el) => host.appendChild(el));
    });
    [...sheet.children].forEach((el) => { if (el.tagName !== 'H3') el.remove(); });
    sheet.appendChild(wrap);
    sheet.querySelectorAll('.set-btns .btn').forEach((b) => b.classList.add('wide'));
  };
})(openSettings);

Object.assign(ACTIONS, {
  settings: (function (orig) { return () => { SET_PAGE = null; orig(); }; })(ACTIONS.settings),
  setGo: (id) => {
    SET_PAGE = id;
    document.querySelectorAll('#modalRoot .set2-home').forEach((h) => h.classList.add('hidden'));
    document.querySelectorAll('#modalRoot .set2-page').forEach((p) => p.classList.toggle('hidden', p.dataset.page !== id));
    const s = document.querySelector('#modalRoot .sheet'); if (s) s.scrollTop = 0;
  },
  setHome: () => {
    SET_PAGE = null;
    document.querySelectorAll('#modalRoot .set2-home').forEach((h) => h.classList.remove('hidden'));
    document.querySelectorAll('#modalRoot .set2-page').forEach((p) => p.classList.add('hidden'));
  },
  setLook: () => { closeModal(); showScreen('tasks', 'ach'); },
  // Быстрые кнопки и переключатели внутри раздела показывают одно и то же
  toggleSet: (function (orig) { return (key, btn) => { orig(key, btn); document.querySelectorAll(`#modalRoot [data-act="toggleSet"][data-id="${key}"]`).forEach((b) => b.classList.toggle('on', !!S.settings[key])); }; })(ACTIONS.toggleSet),
});
