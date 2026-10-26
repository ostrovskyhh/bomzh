// Админ-меню 3.0: вкладки вместо одной кучи кнопок, свои суммы, переход по главам и городам,
// запуск любой мини-игры для проверки, состояние сервера, копия сохранения. Видно только админу.

let ADM_TAB = 'hero';
const ADM_TABS = [['hero', '🧑 Персонаж'], ['world', '🎮 Мир'], ['server', '🌐 Сервер'], ['save', '💾 Сохранение']];

function admHero() {
  const li = levelInfo();
  return `<div class="adm-stats"><span>💰 ${fmt(S.money)} ₽</span><span>🟡 ${fmt(S.caps)}</span><span>⭐ ур. ${li.level}</span><span>📍 ${cityName()}</span><span>👑 VIP ${isVip() ? 'до ' + new Date(S.vipUntil).toLocaleDateString('ru-RU') : 'нет'}</span></div>
    <div class="adm-row"><input id="admMoney" type="number" inputmode="numeric" placeholder="Сумма ₽ (можно с минусом)"><button class="btn primary" data-act="adm2" data-id="money">₽</button></div>
    <div class="adm-row"><input id="admCaps" type="number" inputmode="numeric" placeholder="Крышки"><button class="btn primary" data-act="adm2" data-id="caps">🟡</button></div>
    <div class="adm-row"><input id="admLevel" type="number" inputmode="numeric" placeholder="Уровень (стать таким)" value="${li.level}"><button class="btn primary" data-act="adm2" data-id="level">⭐</button></div>
    <div class="admin-grid">
      <button class="btn" data-act="adm" data-id="m100k">+100 000 ₽</button><button class="btn" data-act="adm" data-id="m10m">+10 млн ₽</button>
      <button class="btn" data-act="adm" data-id="bars">Полные шкалы</button><button class="btn" data-act="adm" data-id="cure">Вылечить всё</button>
      <button class="btn" data-act="adm" data-id="cd">Сбросить таймеры</button><button class="btn" data-act="adm2" data-id="vip">+30 дней VIP</button>
      <button class="btn" data-act="adm2" data-id="stats100">Форма и сила 100</button><button class="btn" data-act="adm2" data-id="debtClear">Списать долги</button>
    </div>
    <button class="btn primary wide" data-act="adm" data-id="all">🔓 Открыть всё (40 ур., всё куплено)</button>`;
}

function admWorld() {
  const list = questList(), cur = S.quest.idx;
  return `<div class="subhead">📖 Сюжет · ${cityName()}</div>
    <div class="adm-row"><select id="admChapter">${list.map((q, i) => `<option value="${i}" ${i === cur ? 'selected' : ''}>${i + 1}. ${q.title}${q.path ? (q.path === 'honest' ? ' 😇' : ' 😈') : ''}</option>`).join('')}</select><button class="btn primary" data-act="adm2" data-id="chapter">Перейти</button></div>
    <div class="admin-grid"><button class="btn" data-act="adm" data-id="quest">Пропустить главу</button><button class="btn" data-act="adm2" data-id="path">Сменить путь (${S.quest.path === 'dark' ? '😈' : '😇'})</button></div>
    <div class="subhead">🏙️ Города</div>
    <div class="admin-grid"><button class="btn" data-act="adm2" data-id="cityZas">В Засранск</button><button class="btn" data-act="adm2" data-id="cityMsk">В Москвабад</button>
      <button class="btn" data-act="adm2" data-id="moveTest">Окно переезда</button><button class="btn" data-act="adm2" data-id="chapterCard">Экран «Глава II»</button></div>
    <div class="subhead">🎮 Любая мини-игра работы (без оплаты)</div>
    <div class="adm-row"><select id="admGame">${JOBS.map((j) => `<option value="${j.id}">${j.emoji} ${j.name} — ${(JOB_GAMES[j.id] || {}).title || ''}</option>`).join('')}</select><button class="btn primary" data-act="adm2" data-id="game">▶</button></div>
    <div class="subhead">🎲 События</div>
    <div class="admin-grid"><button class="btn" data-act="adm2" data-id="event">Уличное событие</button><button class="btn" data-act="adm2" data-id="tip">Окно «Поддержи»</button>
      <button class="btn" data-act="adm2" data-id="news">Окно «Что нового»</button><button class="btn" data-act="adm2" data-id="tut">Обучение заново</button></div>`;
}

function admServer() {
  const uid = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : '—';
  return `<div class="info-card">Твой Telegram ID: <b>${uid}</b><br>Сервер: <b>${typeof REF_API !== 'undefined' && REF_API ? esc(REF_API.replace('https://', '')) : 'не настроен'}</b><br>Счётчик сохранений: <b>${S.rev || 0}</b></div>
    <div id="admPing" class="info-card">Нажми «Проверить», чтобы опросить сервер</div>
    <div class="btns" style="flex-direction:column;gap:8px">
      <button class="btn wide" data-act="adm2" data-id="ping">📡 Проверить сервер</button>
      <button class="btn wide primary" data-act="giftOpen">🎁 Подарок игроку: деньги, уровни, крышки</button>
      <button class="btn wide primary" data-act="bcOpen">📢 Рассылка всем игрокам</button>
      <small style="color:var(--muted);text-align:center">Анонс обновления заново — команда /sendnews боту</small></div>`;
}

function admSave() {
  return `<div class="info-card">Копия сохранения — для поддержки игроков и переноса прогресса. Вставка заменит текущий прогресс!</div>
    <textarea id="admSaveText" class="adm-save" placeholder="Сюда можно вставить сохранение"></textarea>
    <div class="admin-grid"><button class="btn" data-act="adm2" data-id="saveCopy">📋 Скопировать моё</button><button class="btn dark-path" data-act="adm2" data-id="saveLoad">⚠️ Загрузить вставленное</button></div>
    <button class="btn wide" data-act="adm" data-id="off">Выйти из админки</button>`;
}

openAdmin = function () {
  const body = { hero: admHero, world: admWorld, server: admServer, save: admSave }[ADM_TAB]();
  openModal(`<h3>🛠️ Админ-меню</h3>
    <div class="adm-tabs">${ADM_TABS.map(([id, t]) => `<button class="${id === ADM_TAB ? 'on' : ''}" data-act="admTab" data-id="${id}">${t}</button>`).join('')}</div>
    <div class="adm-body">${body}</div>
    <div class="btns"><button class="btn wide" data-act="settings">Назад</button></div>`, { center: true });
};

async function admPing() {
  const out = [];
  const t0 = Date.now();
  try { const r = await fetch(`${REF_API}/api/health`, { headers: { 'ngrok-skip-browser-warning': '1' } }); out.push(`✅ Сервер жив · ${Date.now() - t0} мс${r.ok ? '' : ` (HTTP ${r.status})`}`); } catch (e) { out.push('❌ Сервер не отвечает'); }
  if (onlineOn()) {
    try { const c = await apiPost('crash/state'); out.push(`🚀 Ракета: раунд ${c.id}, ${c.phase}, ставок ${c.count}`); } catch (e) { out.push('🚀 Ракета: нет ответа'); }
    try { const t = await apiPost('tour/state'); out.push(`🏆 Турнир: ${t.phase === 'open' ? `идёт, участников ${t.count}, банк ${fmt(t.pool)} ₽` : `через ${leftText(t.opensIn * 1000)}`}`); } catch (e) { out.push('🏆 Турнир: нет ответа'); }
  } else out.push('ℹ️ Остальные проверки — только в игре внутри Telegram');
  if ($('admPing')) $('admPing').innerHTML = out.join('<br>');
}

Object.assign(ACTIONS, {
  admTab: (id) => { ADM_TAB = id; openAdmin(); },
  adm2: (id) => {
    if (!S.admin) return;
    const num = (el) => Math.floor(+(($(el) || {}).value || 0)) || 0;
    switch (id) {
      case 'money': { const v = num('admMoney'); if (v > 0) addMoney(v); else S.money = Math.max(0, S.money + v); break; }
      case 'caps': S.caps = Math.max(0, S.caps + num('admCaps')); break;
      case 'level': {
        const want = Math.max(1, Math.min(300, num('admLevel')));
        let xp = 0; for (let i = 1; i < want; i++) xp += xpNeed(i);
        S.xp = xp; pendingLevelUp = null; break;
      }
      case 'vip': S.vipUntil = Math.max(Date.now(), S.vipUntil || 0) + 30 * 86400000; break;
      case 'stats100': S.form = 100; S.strength = 100; S.fatigue = 0; break;
      case 'debtClear': S.debt = 0; S.missed = 0; S.alimony = null; break;
      case 'chapter': S.quest.idx = Math.max(0, Math.min(questList().length - 1, num('admChapter'))); S.quest.base = { ...(S.counters || {}) }; break;
      case 'path': S.quest.path = S.quest.path === 'dark' ? 'honest' : 'dark'; break;
      case 'cityZas': case 'cityMsk': S.city = id === 'cityMsk' ? 'msk' : 'zas'; S.quest.idx = 0; S.quest.base = { ...(S.counters || {}) }; applyCity(); renderedHousing = -1; break;
      case 'moveTest': { if (city() !== 'zas') { toast('Окно переезда — только из Засранска', 'bad'); return; } const i = questList().findIndex((q) => q.move); if (i >= 0) S.quest.idx = i; closeModal(); moveStartModal(); return; }
      case 'chapterCard': closeModal(); S.chapterIntro = 'msk'; return;
      case 'game': { const gid = ($('admGame') || {}).value; const j = JOBS.find((x) => x.id === gid); if (!j) return; closeModal(); startShiftGame(j, (score) => { closeModal(); toast(`🎮 ${JOB_GAMES[j.id].title}: результат ${score} из ~${JOB_GAMES[j.id].target}`, 'good'); }); return; }
      // Событие показывается на главном экране: ставим таймер «прямо сейчас» и уходим туда
      case 'event': closeModal(); nextEventAt = 0; showScreen('game'); toast('Событие появится через секунду'); return;
      case 'tip': closeModal(); S.tipAskOff = false; S.tipAskAt = 0; return;
      case 'news': openNews('all'); return;
      case 'tut': ACTIONS.restartTut(); return;
      case 'ping': admPing(); return;
      case 'saveCopy': {
        const txt = JSON.stringify(S);
        navigator.clipboard.writeText(txt).then(() => toast('📋 Сохранение скопировано', 'good')).catch(() => { $('admSaveText').value = txt; toast('Скопируй текст из поля', 'good'); });
        return;
      }
      case 'saveLoad': {
        const txt = ($('admSaveText') || {}).value || '';
        const data = parseSave(txt.trim());
        if (!data || !data.stats) { toast('Это не похоже на сохранение игры', 'bad'); return; }
        const doIt = () => { S = data; S.admin = true; REV_FLOOR = Math.max(REV_FLOOR, serverBase); save(true); toast('💾 Сохранение загружено', 'good'); setTimeout(() => location.reload(), 600); };
        if (tg && tg.showConfirm) tg.showConfirm('Заменить текущий прогресс вставленным?', (ok) => ok && doIt()); else if (confirm('Заменить текущий прогресс вставленным?')) doIt();
        return;
      }
      default: return;
    }
    toast('✅ Готово', 'good');
    save();
    openAdmin();
  },
});
