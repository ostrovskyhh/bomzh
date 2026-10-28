// Понятная карьера: наверху вкладки «Работа» — «Карьерная лестница».
// Видно текущую должность, сколько смен до аттестации и большая кнопка «Сдать аттестацию»,
// а ниже — какая работа следующая и чего для неё не хватает (с ✅/❌ по каждому пункту).

const CAREER_PATHS = [
  ['💼 Частный сектор', ['flyers', 'loader', 'courier', 'guard', 'taxi', 'seller', 'manager', 'director']],
  ['🏛️ Госслужба', ['dvornik', 'postman', 'police', 'teacher', 'clerk', 'deputy']],
];
function jobById(id) { return JOBS.find((j) => j.id === id); }

// Работа, на которой игрок сейчас «растёт»: больше всего смен среди доступных
function careerMain() {
  return JOBS.filter((j) => jobShifts(j.id)).sort((a, b) => (reqOk(b.req) - reqOk(a.req)) || (jobShifts(b.id) - jobShifts(a.id)))[0] || null;
}
// Следующая закрытая работа: та, что требует должность на работе, где игрок уже трудится, или первая закрытая по лестнице
function careerNext() {
  const locked = JOBS.filter((j) => !reqOk(j.req));
  const byRank = locked.filter((j) => j.req.rank && jobShifts(j.req.rank[0])).sort((a, b) => (a.req.level || 0) - (b.req.level || 0));
  if (byRank.length) return byRank[0];
  for (const [, path] of CAREER_PATHS) { const id = path.find((x) => jobById(x) && !reqOk(jobById(x).req)); if (id) return jobById(id); }
  return null;
}

function careerLadderHTML() {
  const main = careerMain();
  let cur;
  if (!main) {
    const first = JOBS.filter((j) => reqOk(j.req))[0];
    cur = `<div class="cl-now"><span>🧹</span><div><b>Ты ещё нигде не работаешь</b><small>${first ? `Начни с «${first.name}» — кнопка «На смену» ниже` : 'Работа откроется со 2 уровня'}</small></div></div>`;
  } else {
    const r = jobRank(main.id), next = RANKS[r + 1];
    const shifts = jobShifts(main.id);
    const cdExam = (S.cd['exam_' + main.id] || 0) > Date.now();
    const ready = canPromote(main.id);
    const prog = next ? Math.min(1, shifts / next.shifts) : 1;
    cur = `<div class="cl-now"><span>${main.emoji}</span><div><b>${main.name}</b><small>Должность: <b>${posName(main.id, r)}</b> · оплата ×${POS_MULT[r]}</small></div></div>
      ${next ? `<div class="cl-step"><div class="cl-label">Следующая должность: <b>${posName(main.id, r + 1)}</b> (×${POS_MULT[r + 1]})</div>
        <div class="progress"><div style="width:${prog * 100}%"></div></div>
        <small>${ready ? '✅ Смен достаточно — сдай аттестацию!' : `Смен: ${shifts} / ${next.shifts} — ещё ${next.shifts - shifts}`}</small>
        ${ready ? `<button class="btn primary wide exam-btn" data-act="jobExam" data-id="${main.id}" ${cdExam || S.busy ? 'disabled' : ''} ${S.busy ? 'data-why="Валера сейчас занят"' : ''}>🎖️ ${cdExam ? `Пересдача через <span data-until="${S.cd['exam_' + main.id]}"></span>` : `Сдать аттестацию (мини-игра на ${Math.round(EXAM_PASS * 100)}%+)`}</button>
          ${main.state ? `<small>…или «конверт» начальству — кнопка в карточке работы ниже (рискованно)</small>` : ''}` : ''}</div>`
      : '<div class="cl-step"><b>👑 Вершина карьеры на этой работе!</b></div>'}`;
  }
  const nx = careerNext();
  let nextHtml = '';
  if (nx) {
    const reqs = reqList(nx.req);
    nextHtml = `<div class="cl-next"><div class="cl-label">Следующая работа: <b>${nx.emoji} ${nx.name}</b> · до ${incomeHTML('job',nx.id)} за смену</div>
      <div class="cl-reqs">${reqs.map((q) => `<span class="${q.ok ? 'ok' : 'no'}">${q.ok ? '✅' : '❌'} ${q.text}</span>`).join('')}</div>
      <small>${reqs.some((q) => !q.ok && /:/.test(q.text) && nx.req.rank) ? `Должность на прошлой работе получают аттестацией — см. выше.` : 'Выполни все пункты — работа откроется сама.'}</small></div>`;
  }
  return `<div class="career-ladder">${cur}${nextHtml}</div>`;
}

const _workTabC2 = EXTRA_TABS.life.work;
EXTRA_TABS.life.work = () => {
  let html = _workTabC2();
  // Строка аттестации в карточке работы видна всегда, когда смен хватает (даже если Валера занят)
  return careerLadderHTML() + html;
};
