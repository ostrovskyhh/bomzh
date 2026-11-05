// 5.29 · Общая цель района: одна задача недели на всех игроков. Вклад считает сервер по сохранениям.
const DISTRICT_GOALS_529 = {
  shift: { e: '🔧', t: 'Теплотрасса', d: 'Трубы во дворе не пережили прошлую зиму. Каждая смена любого игрока идёт в общий ремонт.', unit: 'Смены' },
  trash: { e: '🧹', t: 'Большой субботник', d: 'Двор зарос так, что дворник уволился. Каждая обысканная мусорка делает район чище.', unit: 'Мусорки' },
  events: { e: '🔦', t: 'Ночной дозор', d: 'Михалыч ведёт журнал всего, что творится на улицах. Каждое событие попадает в общую тетрадь.', unit: 'События' },
  fightWin: { e: '🥊', t: 'Гаражная лига', d: 'Гаражные объявили, что наш двор ничего не может. Каждая победа в бою доказывает обратное.', unit: 'Победы' },
};
const DG_529 = { data: null, at: 0, busy: false, failed: false };

function dgTier529(w, t) {
  const state = t.claimed ? '✅' : t.reached ? '🎁' : '🔒';
  const btn = t.can ? `<button class="btn green" data-act="dgClaim529" data-id="${w.week}:${t.tier}">Забрать</button>` : '';
  return `<div class="dg-tier529"><span>${state} ${t.pct}% · ${fmt(t.caps)} 🟡</span>${btn}</div>`;
}
function dgWeek529(w) {
  const g = DISTRICT_GOALS_529[w.key];
  if (!g) return '';
  const pct = Math.min(100, Math.floor(w.progress / Math.max(1, w.target) * 100));
  const left = w.mine >= w.need ? '' : ` Для наград нужен вклад от ${fmt(w.need)}.`;
  return `<div class="info-card dg529">
    <b>${g.e} ${g.t}</b><p>${g.d}</p>
    <div class="progress"><div style="width:${pct}%"></div></div>
    <p><b>${g.unit}: ${fmt(w.progress)} / ${fmt(w.target)}</b> · ${pct}%</p>
    <small>Участников: ${fmt(w.people)}. Твой вклад: ${fmt(w.mine)}, в зачёт идёт до ${fmt(w.cap)}.${left}</small>
    ${w.tiers.map((t) => dgTier529(w, t)).join('')}
  </div>`;
}
function dgHTML529() {
  const d = DG_529.data;
  if (!onlineOn()) return '<div class="info-card">🏘️ Общая цель района доступна в игре через Telegram.</div>';
  if (!d) {
    if (!DG_529.failed) return '<div class="info-card">🏘️ Смотрим, как дела у района…</div>';
    return '<div class="info-card">🏘️ Сервер района не отвечает.<br><button class="btn" data-act="dgReload529">Повторить</button></div>';
  }
  const last = d.last && DISTRICT_GOALS_529[d.last.key]
    ? `<div class="info-card dg529"><b>Прошлая неделя: ${DISTRICT_GOALS_529[d.last.key].t}</b>${d.last.tiers.filter((t) => t.can).map((t) => dgTier529(d.last, t)).join('')}</div>` : '';
  return `${last}${dgWeek529(d.current)}<small class="weekly-note">Новая цель через ${fmtTime((d.current.ends - Date.now()) / 1000)}. Вклад обновляется при сохранении игры.</small>`;
}
function dgPaint529() { const box = $('dgBox529'); if (box) box.innerHTML = dgHTML529(); }
async function dgLoad529(force) {
  if (DG_529.busy || !onlineOn() || (!force && Date.now() - DG_529.at < 30000)) return;
  DG_529.busy = true;
  try {
    DG_529.data = await apiPost('district/goal');
    DG_529.failed = false; DG_529.at = Date.now();
  } catch (e) { DG_529.failed = true; }
  DG_529.busy = false;
  dgPaint529();
}
function districtGoal529() {
  save(true); // свежие дела должны попасть на сервер раньше, чем игрок увидит свой вклад
  setTimeout(dgLoad529, 800);
  return `<div class="subhead">Общая цель района</div><div id="dgBox529">${dgHTML529()}</div>`;
}
ACTIONS.dgReload529 = () => { DG_529.failed = false; dgPaint529(); dgLoad529(true); };
ACTIONS.dgClaim529 = async (id) => {
  const [week, tier] = String(id).split(':').map(Number);
  if (DG_529.busy) return;
  DG_529.busy = true;
  try {
    const r = await apiPost('district/claim', { week, tier });
    if (!r.ok) toast(r.error || 'Награда пока недоступна', 'bad');
    if (r.granted) await giftClaim();
  } catch (e) { toast('Нет связи с сервером', 'bad'); }
  DG_529.busy = false;
  dgLoad529(true);
};
