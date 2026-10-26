// Статистика времени в игре (3.0): всего, сегодня, сессии, по городам. Считается только время,
// когда игра открыта на экране (свёрнутая не считается). Видно в профиле — тап по аватарке.

const PLAY_TICK_MAX = 5000; // больше 5 секунд между тиками — значит, игра «спала», это время не считаем
let PLAY_LAST = 0;

function playState() {
  if (!S.play) S.play = { ms: 0, sessions: 0, longest: 0, day: '', dayMs: 0, cityMs: {}, first: Date.now() };
  return S.play;
}
HOOKS.load.push(() => {
  const p = playState();
  p.sessions++;
  p.cur = 0;
  PLAY_LAST = Date.now();
});
HOOKS.tick.push(() => {
  const now = Date.now();
  const d = now - PLAY_LAST;
  PLAY_LAST = now;
  if (document.hidden || d <= 0 || d > PLAY_TICK_MAX || !S.storySeen) return;
  const p = playState();
  const today = new Date().toDateString();
  if (p.day !== today) { p.day = today; p.dayMs = 0; }
  p.ms += d; p.dayMs += d; p.cur = (p.cur || 0) + d;
  p.longest = Math.max(p.longest || 0, p.cur);
  const c = typeof city === 'function' ? city() : 'zas';
  p.cityMs[c] = (p.cityMs[c] || 0) + d;
});

function playFmt(ms) {
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  return h < 48 ? `${h} ч ${m % 60} мин` : `${Math.floor(h / 24)} д ${h % 24} ч`;
}
function playHTML() {
  const p = playState();
  const avg = p.sessions ? p.ms / p.sessions : 0;
  const days = Math.max(1, Math.ceil((Date.now() - (p.first || Date.now())) / 86400000));
  return `<div class="subhead" style="text-align:left">⏱️ Время в игре</div>
    <div class="stat-grid play-grid" style="margin-bottom:12px;text-align:left">
      <div>Всего<b>${playFmt(p.ms)}</b></div><div>Сегодня<b>${playFmt(p.dayMs || 0)}</b></div>
      <div>Сессий<b>${fmt(p.sessions)}</b></div><div>Средняя сессия<b>${playFmt(avg)}</b></div>
      <div>Самая долгая<b>${playFmt(p.longest || 0)}</b></div><div>В среднем в день<b>${playFmt(p.ms / days)}</b></div>
      <div>🏚️ В Засранске<b>${playFmt(p.cityMs.zas || 0)}</b></div><div>🏙️ В Москвабаде<b>${playFmt(p.cityMs.msk || 0)}</b></div>
    </div>`;
}
openProfile = (function (orig) {
  return function () {
    orig();
    const btns = document.querySelector('#modalRoot .btns');
    if (btns) btns.insertAdjacentHTML('beforebegin', playHTML());
  };
})(openProfile);

ACHS.push({ id: 'playtime', name: 'Завсегдатай', emoji: '⏱️', fn: () => Math.floor(playState().ms / 3600000), goals: [1, 10, 50, 200, 1000], unit: 'часов в игре' });
