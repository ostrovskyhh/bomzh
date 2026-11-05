// 5.31 · Наставники: опытный игрок помогает новичку дойти до 3-й и 8-й главы, награды выдаёт сервер.
const MENTOR_531 = { data: null, at: 0, busy: false, next: 0 };

function mentorHTML531() {
  const d = MENTOR_531.data;
  if (!onlineOn()) return '';
  if (!d) return '<div class="info-card">🎓 Смотрим, кому нужна помощь…</div>';
  const ward = d.mentor ? `<div class="info-card dg529"><b>🎓 Твой наставник: ${esc(d.mentor.name)}</b><p>Он уже в друзьях, с ним можно обмениваться подарками.</p><small>${d.mentor.r3 ? '✅' : '🔒'} Глава 3: 5 🟡 · ${d.mentor.r8 ? '✅' : '🔒'} Глава 8: 10 🟡</small></div>` : '';
  if (!d.eligible) return ward || '<div class="info-card">🎓 Наставником можно стать с 9-й главы. Новичкам наставник достаётся сам после 1-й главы, если есть свободный.</div>';
  const list = d.wards.map((w) => `<div class="dg-tier529"><span>${esc(w.name)} · глава ${fmt(w.chapter)}</span><span>${w.r3 ? '✅' : '🔒'} ${w.r8 ? '✅' : '🔒'}</span></div>`).join('');
  return `${ward}<div class="info-card dg529"><b>🎓 Наставник</b><p>Новичок получает тебя в друзья. Когда он дойдёт до 3-й главы, тебе 10 🟡, до 8-й ещё 20 🟡. Он тоже получит награды.</p>
    <small>Не больше 3 новичков за 7 дней. Новичка получают только те, кто заходил за последние 2 дня.</small>
    ${list ? `<div>${list}</div>` : ''}
    <button class="btn ${d.active ? '' : 'green'} wide" data-act="mentorToggle531" data-id="${d.active ? 0 : 1}">${d.active ? 'Больше не брать новичков' : 'Стать наставником'}</button></div>`;
}
function mentorPaint531() { const box = $('mentorBox531'); if (box) box.innerHTML = mentorHTML531(); }
function mentorShow531(r) {
  MENTOR_531.data = r; MENTOR_531.at = Date.now();
  if (r.assigned && r.mentor) {
    sfx('ach');
    resultModal({ emoji: '🎓', title: 'У тебя появился наставник', text: `<b>${esc(r.mentor.name)}</b> теперь в друзьях. Дойди до 3-й главы, и вы оба получите награду.`, btn: 'Отлично' });
  }
  mentorPaint531();
}
async function mentorLoad531() {
  if (MENTOR_531.busy || !onlineOn()) return;
  MENTOR_531.busy = true;
  try { mentorShow531(await apiPost('mentor/state')); } catch (e) { /* блок появится при следующем открытии */ }
  MENTOR_531.busy = false;
}
function mentorBox531() {
  if (Date.now() - MENTOR_531.at > 30000) setTimeout(mentorLoad531, 900);
  return `<div class="subhead">Наставники</div><div id="mentorBox531">${mentorHTML531()}</div>`;
}
ACTIONS.mentorToggle531 = async (id) => {
  if (MENTOR_531.busy) return;
  MENTOR_531.busy = true;
  try {
    const r = await apiPost('mentor/toggle', { active: +id === 1 });
    if (r.ok) { mentorShow531(r); toast(r.active ? '🎓 Ты в списке наставников' : 'Новые новички приходить не будут', 'good'); } else toast(r.error || 'Пока недоступно', 'bad');
  } catch (e) { toast('Нет связи с сервером', 'bad'); }
  MENTOR_531.busy = false;
};
// Новичок сам попадает к наставнику после 1-й главы. Свободного может не быть, поэтому попытки редкие.
HOOKS.tick.push(() => {
  if (!S.fs528 || S.mentor531 || !S.quest || S.quest.idx < 1 || S.quest.idx >= 3 || Date.now() < MENTOR_531.next || !onlineOn()) return;
  MENTOR_531.next = Date.now() + 600000;
  save(true);
  setTimeout(async () => { await mentorLoad531(); const d = MENTOR_531.data; if (d && d.mentor) S.mentor531 = 1; }, 1500);
});
