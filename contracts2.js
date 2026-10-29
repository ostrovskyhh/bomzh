// Контракты 4.4 (вместо 4.3): честные правила как в CS.
// • Кладёшь 3–5 вещей ОДНОЙ редкости (кроме легенд) → получаешь 1 вещь СЛЕДУЮЩЕЙ редкости, гарантированно.
// • Вещь берётся из тех же кейсов, что и вложенные: чем больше вещей из кейса, тем выше его шанс.
// • 4-я и 5-я вещь — «надбавка»: каждая даёт +12% шанс прыгнуть сразу через редкость.
// • Износ результата — средний износ вложенных вещей (±0.02). Шансы на экране — ровно те, по которым идёт розыгрыш.
// • Подписываешь, нарисовав подпись пальцем; потом печать и лента с исходом.
// И ещё: кейс одного вида можно открыть сразу ×1, ×3 или ×5.

const CT_MIN = 3, CT_MAX = 5, CT_JUMP = 0.12;
let CT = { rar: null, picked: [] };

function ctRarIdx(id) { return RARITY.findIndex((r) => r.id === id); }
function ctItems() { const inv = fleaInv(); return CT.picked.filter((i) => inv[i] && inv[i].rar === CT.rar).map((i) => inv[i]); }
function ctMax() { return CT.rar && ctRarIdx(CT.rar) + 2 < RARITY.length ? CT_MAX : CT_MIN; }
function ctJump(n) { return ctRarIdx(CT.rar) + 2 < RARITY.length ? Math.max(0, n - CT_MIN) * CT_JUMP : 0; }

// Все исходы с шансами: кейс (по числу вещей из него) × редкость (следующая или через одну) × вещь кейса
function ctOutcomes(items = ctItems()) {
  if (items.length < CT_MIN) return [];
  const ri = ctRarIdx(items[0].rar);
  const byCase = {};
  items.forEach((it) => { const c = CASES.find((x) => x.id === it.from) || CASES[0]; byCase[c.id] = (byCase[c.id] || 0) + 1; });
  const jump = ri + 2 < RARITY.length ? Math.max(0, items.length - CT_MIN) * CT_JUMP : 0;
  const out = [];
  Object.entries(byCase).forEach(([cid, n]) => {
    const c = CASES.find((x) => x.id === cid);
    [[ri + 1, 1 - jump], [ri + 2, jump]].forEach(([r, p]) => {
      if (p <= 0 || !RARITY[r]) return;
      const list = c.loot[RARITY[r].id] || [];
      list.forEach(([e, name, f]) => out.push({ c, rar: RARITY[r], e, name, f, p: (n / items.length) * p / list.length }));
    });
  });
  return out;
}
function ctWear(items = ctItems()) { return items.reduce((a, it) => a + itemWear(it), 0) / Math.max(1, items.length); }
function ctQualityOf(fl) { return QUALITY.find((q) => fl >= WEAR[q.id][0] && fl < WEAR[q.id][1]) || (fl >= 0.38 ? QUALITY.find((q) => q.id === 'bs') : QUALITY.find((q) => q.id === 'ft')); }
function ctValue(o, q) { const raw = caseItemBase(o.c, o.rar, o.f) * q.mult; return Math.max(10, raw >= 1000 ? Math.round(raw / 10) * 10 : Math.round(raw)); }
function ctStake(items = ctItems()) { return items.reduce((a, it) => a + fleaPrice(it), 0); }
// Средняя отдача контракта — для подписи «выгодно/невыгодно» и автотеста
function ctEV(items = ctItems()) {
  const q = ctQualityOf(ctWear(items));
  return ctOutcomes(items).reduce((a, o) => a + o.p * ctValue(o, q), 0);
}

function ctRoll(items) {
  const outs = ctOutcomes(items);
  let r = Math.random(), o = outs[outs.length - 1];
  for (const x of outs) { if ((r -= x.p) < 0) { o = x; break; } }
  const fl = clamp(ctWear(items) + rand(-0.02, 0.02), 0.0001, 0.9999);
  const q = ctQualityOf(fl);
  const raw = caseItemBase(o.c, o.rar, o.f) * q.mult * rand(0.96, 1.04);
  const value = Math.max(10, raw >= 1000 ? Math.round(raw / 10) * 10 : Math.round(raw));
  return { key: `${o.c.id}:${o.name}:${q.id}`, e: o.e, name: o.name, rar: o.rar.id, q: q.id, value, from: o.c.id, fl: Math.round(fl * 10000) / 10000, pat: Math.floor(Math.random() * 1000), contract: true };
}

// ---------- Шаги ----------
function ctSteps(step) {
  const s = ['Редкость', 'Вещи', 'Договор', 'Подпись'];
  return `<div class="ct-steps">${s.map((t, i) => `<div class="${i + 1 < step ? 'done' : i + 1 === step ? 'on' : ''}"><i>${i + 1 < step ? '✓' : i + 1}</i><span>${t}</span></div>`).join('')}</div>`;
}
function ctRarCounts() {
  const inv = fleaInv(), m = {};
  inv.forEach((it) => { m[it.rar] = (m[it.rar] || 0) + 1; });
  return m;
}

openContracts = function () {
  const inv = fleaInv();
  const counts = ctRarCounts();
  const usable = RARITY.slice(0, -1).filter((r) => (counts[r.id] || 0) >= CT_MIN);
  if (CT.rar && !usable.some((r) => r.id === CT.rar)) CT = { rar: null, picked: [] };
  if (!CT.rar && usable.length === 1) CT.rar = usable[0].id;
  const step = !CT.rar ? 1 : 2;
  const rarBtns = RARITY.slice(0, -1).map((r) => {
    const n = counts[r.id] || 0, ok = n >= CT_MIN;
    const next = RARITY[ctRarIdx(r.id) + 1];
    return `<button class="ct-rar ${CT.rar === r.id ? 'on' : ''}" style="--c:${r.color};--n:${next.color}" data-act="ctRar" data-id="${r.id}" ${ok ? '' : `disabled data-why="Нужно ${CT_MIN} вещи «${r.name}», есть ${n}"`}>
      <b>${r.name}</b><small>${n} шт. → <span style="color:${next.color}">${next.name}</span></small></button>`;
  }).join('');
  let body = '';
  if (CT.rar) {
    const r = RARITY.find((x) => x.id === CT.rar), next = RARITY[ctRarIdx(CT.rar) + 1];
    const list = inv.map((it, i) => [it, i]).filter(([it]) => it.rar === CT.rar).sort((a, b) => fleaPrice(a[0]) - fleaPrice(b[0]));
    const items = ctItems(), n = items.length;
    const max = ctMax();
    const slots = Array.from({ length: max }, (_, k) => {
      const it = items[k];
      return `<div class="ct-slot ${k >= CT_MIN ? 'extra' : ''} ${it ? 'full' : ''}" style="--c:${r.color}">${it ? `<span>${it.e}</span>` : `<small>${k < CT_MIN ? 'нужно' : '+12%'}</small>`}</div>`;
    }).join('');
    const hint = n < CT_MIN ? `👆 Нажми на ${CT_MIN - n} ${CT_MIN - n === 1 ? 'вещь' : 'вещи'} ниже — дешёвые вверху. Получишь вещь «<b style="color:${next.color}">${next.name}</b>».`
      : n < max ? `✅ Хватает для контракта. Можно добавить ещё ${max - n} — каждая даёт +${CT_JUMP * 100}% шанс сразу на «${RARITY[ctRarIdx(CT.rar) + 2].name}» (шанс сейчас ${Math.round(ctJump(n) * 100)}%).`
      : '✅ Контракт собран — жми «Далее» и проверь договор.';
    body = `<div class="ct-hint">${hint}</div>
      <div class="ct-slots">${slots}</div>
      <div class="ct-grid">${list.map(([it, i]) => {
        const sel = CT.picked.includes(i);
        return `<button class="ct-it ${sel ? 'sel' : ''}" style="--c:${r.color}" data-act="ctPick" data-id="${i}" ${!sel && n >= max ? 'disabled' : ''}><span>${it.e}</span><small>${esc(it.name)}</small><em>${fmt(fleaPrice(it))} ₽ · ${qualityName(it)}</em>${sel ? '<i>✓</i>' : ''}</button>`;
      }).join('')}</div>`;
  }
  openModal(`<div class="ct-wrap"><div class="ct-head"><span>📜</span><div><b>Контракты Шныря</b><small>Вещи одной редкости → вещь редкостью выше</small></div></div>
    ${ctSteps(step)}
    ${step === 1 ? `<div class="ct-hint">👇 Выбери редкость, из которой соберёшь контракт. Нужно минимум ${CT_MIN} вещи одной редкости, легенды не принимаются.</div>` : ''}
    <div class="ct-rars">${rarBtns}</div>
    ${body}
    <div class="btns" style="flex-direction:column;gap:8px">
      ${CT.rar ? `<button class="btn primary wide" data-act="ctReview" ${ctItems().length >= CT_MIN ? '' : `disabled data-why="Положи ещё ${CT_MIN - ctItems().length}"`}>📜 Далее: проверить договор</button>` : ''}
      <button class="btn wide" data-act="flea">⬅️ К барахолке</button></div></div>`, { center: true });
};

contractSign = function () {
  const items = ctItems();
  if (items.length < CT_MIN) { openContracts(); return; }
  const outs = ctOutcomes(items);
  const q = ctQualityOf(ctWear(items));
  const stake = ctStake(items), ev = ctEV(items);
  const vals = outs.map((o) => ctValue(o, q));
  const grouped = {};
  outs.forEach((o) => { const k = o.c.id + o.name + o.rar.id; grouped[k] = grouped[k] || { ...o, p: 0 }; grouped[k].p += o.p; });
  const rows = Object.values(grouped).sort((a, b) => b.p - a.p).map((o) => `<div class="ct-row" style="--c:${o.rar.color}"><span>${o.e}</span><b>${esc(o.name)}</b><small>${o.c.emoji} ${fmt(ctValue(o, q))} ₽</small><em>${(o.p * 100).toFixed(o.p < 0.1 ? 1 : 0)}%</em></div>`).join('');
  const no = 1000 + counter('contractSign') + 1;
  openModal(`<div class="ct-wrap">${ctSteps(3)}
    <div class="ct-doc"><div class="ct-doc-h"><small>ДОГОВОР МЕНЫ</small><b>№ ${no}</b><small>${new Date().toLocaleDateString('ru-RU')} · барахолка Шныря</small></div>
      <p>1. ${userLabel(playerName())} передаёт <b>${items.length}</b> ${items.length < 5 ? 'вещи' : 'вещей'} «${RARITY[ctRarIdx(CT.rar)].name}» общей стоимостью <b>${fmt(stake)} ₽</b>:</p>
      <div class="ct-give">${items.map((it) => `<span title="${esc(it.name)}">${it.e}</span>`).join('')}</div>
      <p>2. Взамен получает <b>одну</b> вещь из списка ниже. Износ ≈ <b>${ctWear(items).toFixed(3)}</b> (${q.name}) — средний у вложенных.</p>
      <div class="ct-table">${rows}</div>
      <p class="ct-sum">Возможно: от <b>${fmt(Math.min(...vals))}</b> до <b>${fmt(Math.max(...vals))} ₽</b> · в среднем <b>${fmt(Math.round(ev))} ₽</b>
        <span class="${ev >= stake ? 'good' : 'bad'}">${ev >= stake ? '▲ выгоднее вложенного' : `▼ в среднем −${Math.round((1 - ev / stake) * 100)}%`}</span></p>
      <p>3. Вложенные вещи пропадают. Сделка окончательная.</p>
      <div class="ct-sign"><small>✍️ Распишись пальцем в рамке</small><canvas id="ctPad" width="600" height="180"></canvas>
        <button class="ct-clear" data-act="ctClear">Стереть</button><div class="ct-line">Подпись: ${userLabel(playerName())}</div></div>
      <div class="ct-seal" id="ctSeal">ПОДПИСАНО</div></div>
    <div class="btns" style="flex-direction:column;gap:8px"><button class="btn primary wide" id="ctGo" data-act="ctSignGo" disabled data-why="Сначала распишись в рамке">🖋️ Подписать договор</button>
      <button class="btn wide" data-act="contracts">⬅️ Изменить вещи</button></div></div>`, { center: true });
  ctPadBind();
};

// ---------- Подпись пальцем ----------
let CT_INK = 0;
function ctPadBind() {
  const cv = $('ctPad');
  if (!cv) return;
  const g = cv.getContext('2d');
  g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#1B2A6B';
  CT_INK = 0;
  let last = null;
  const pt = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
  cv.onpointerdown = (e) => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (err) { /* синтетика */ } last = pt(e); };
  cv.onpointermove = (e) => {
    if (!last) return;
    const p = pt(e);
    g.beginPath(); g.moveTo(...last); g.lineTo(...p); g.stroke();
    CT_INK += Math.hypot(p[0] - last[0], p[1] - last[1]);
    last = p;
    const btn = $('ctGo');
    if (btn && CT_INK > 220 && btn.disabled) { btn.disabled = false; btn.removeAttribute('data-why'); haptic('light'); }
  };
  cv.onpointerup = cv.onpointercancel = cv.onpointerleave = () => { last = null; };
}

contractRoll = function () {
  const inv = fleaInv();
  const idx = CT.picked.filter((i) => inv[i] && inv[i].rar === CT.rar).sort((a, b) => b - a);
  const items = idx.map((i) => inv[i]);
  if (items.length < CT_MIN || CT_INK <= 220) return;
  const outs = ctOutcomes(items);
  const win = ctRoll(items);
  idx.forEach((i) => inv.splice(i, 1));
  inv.push(win);
  track('contractSign');
  if (win.rar === 'legend') track('caseLegend');
  CT = { rar: null, picked: [] }; CT_INK = 0;
  save();
  // Печать, потом лента исходов
  const seal = $('ctSeal');
  if (seal) seal.classList.add('on');
  sfx('heavy'); haptic('heavy');
  setTimeout(() => {
    const strip = Array.from({ length: 40 }, (_, i) => {
      if (i === 34) return win;
      const o = pick(outs);
      return { e: o.e, name: o.name, rar: o.rar.id };
    });
    openModal(`<div class="ct-wrap"><h3 style="text-align:center">📜 Шнырь вскрывает ящик…</h3>
      <div class="case-roll"><div class="case-marker"></div><div class="case-strip" id="ctStrip">${strip.map((it) => `<div class="case-it" style="--c:${RARITY.find((r) => r.id === it.rar).color}"><span>${it.e}</span><small>${esc(it.name)}</small></div>`).join('')}</div></div>
      <div id="ctRes" class="case-result"></div></div>`, { center: true, locked: true });
    const box = document.querySelector('.case-roll');
    const W = 96, target = 34 * W - box.clientWidth / 2 + W / 2 + rand(-28, 28);
    $('ctStrip').animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-target}px)` }], { duration: 3800, easing: 'cubic-bezier(.12,.75,.18,1)', fill: 'forwards' });
    sfx('whoosh');
    setTimeout(() => {
      const r = RARITY.find((x) => x.id === win.rar);
      if (!$('ctRes')) return;
      $('ctRes').innerHTML = `<div class="case-win" style="--c:${r.color}"><span>${win.e}</span><div><b>${esc(win.name)}</b><small>${r.name} · ${qualityName(win)} · износ ${win.fl.toFixed(4)} · ${fmt(win.value)} ₽</small></div></div>
        <div class="btns" style="flex-direction:column;gap:8px"><button class="btn wide" data-act="inspectLast">🔍 Осмотреть в 3D</button>
        <button class="btn primary wide" data-act="fleaSellLastCt">💰 Продать за ${fmt(win.value)} ₽</button>
        <button class="btn wide" data-act="contracts">📜 Новый контракт</button><button class="btn wide" data-act="flea">🛍️ На барахолку</button></div>`;
      sfx(r.id === 'legend' || r.id === 'epic' ? 'jackpot' : 'win');
      if (r.id === 'legend' || r.id === 'epic') confetti(r.id === 'legend' ? 140 : 70);
      haptic('success');
    }, 4000);
  }, 1100);
};

Object.assign(ACTIONS, {
  ctRar: (id) => { CT = { rar: id, picked: [] }; sfx('chip'); openContracts(); },
  ctPick: (i) => {
    i = +i;
    const k = CT.picked.indexOf(i);
    if (k >= 0) CT.picked.splice(k, 1);
    else if (ctItems().length < ctMax() && fleaInv()[i] && fleaInv()[i].rar === CT.rar) CT.picked.push(i);
    sfx('chip');
    const sc = document.querySelector('.sheet'), top = sc ? sc.scrollTop : 0;
    openContracts();
    const s2 = document.querySelector('.sheet'); if (s2) s2.scrollTop = top;
  },
  ctReview: () => contractSign(),
  ctClear: () => { const cv = $('ctPad'); if (cv) cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); CT_INK = 0; const b = $('ctGo'); if (b) { b.disabled = true; b.dataset.why = 'Сначала распишись в рамке'; } },
  ctSignGo: () => contractRoll(),
  fleaSellLastCt: () => { fleaSell([fleaInv().length - 1]); openContracts(); },
  contracts: () => { if (fleaInv().length < CT_MIN) { toast(`Для контракта нужны минимум ${CT_MIN} вещи одной редкости`, 'info'); openFlea(); return; } openContracts(); },
});
const _ctGame = CASINO_GAMES.find((g) => g.act === 'contracts');
if (_ctGame) _ctGame.desc = '3–5 вещей одной редкости → 1 вещь редкостью выше. Распишись — и Шнырь вскроет ящик';

// =====================================================================
// Кейсы ×1 / ×3 / ×5
// =====================================================================
const CASE_MULTI = [3, 5];
function caseCost(c, n) { return c.caps ? c.caps * n : c.price * n; }
function caseCan(c, n) { return level() >= c.level && (c.caps ? S.caps >= c.caps * n : S.money >= c.price * n); }
function caseMultiHTML(c) {
  return `<div class="case-x">${CASE_MULTI.map(n=>`<button class="btn small ${caseCan(c,n)?'':'off'}" data-act="caseMulti" data-id="${c.id}:${n}" ${caseCan(c,n)?'':`disabled data-why="Нужно ${c.caps?`${c.caps*n} 🟡`:`${fmt(c.price*n)} ₽`}"`}>×${n}<small class="case-total">${c.caps?`${c.caps*n} 🟡`:`${fmt(c.price*n)} ₽`}</small></button>`).join('')}</div>`;
}
openCases = (function (orig) {
  return function () {
    orig();
    document.querySelectorAll('#modalRoot [data-act="caseOpen"]').forEach((b) => {
      const c = CASES.find((x) => x.id === b.dataset.id);
      if (!c || b.closest('.case-buys')) return;
      const wrap = document.createElement('div');
      wrap.className = 'case-buys';
      b.replaceWith(wrap);
      wrap.appendChild(b);
      wrap.insertAdjacentHTML('beforeend', caseMultiHTML(c));
    });
  };
})(openCases);

function caseOpenMulti(id, n) {
  if (![1,...CASE_MULTI].includes(n)) return;
  const c = CASES.find((x) => x.id === id);
  if (!c || !caseCan(c, n)) { toast('Не хватает на кейсы', 'bad'); return; }
  if (c.caps) S.caps -= c.caps * n; else S.money -= c.price * n;
  const start = fleaInv().length;
  const wins = Array.from({ length: n }, () => caseRollItem(c));
  wins.forEach((w) => { fleaInv().push(w); track('caseOpen'); track('caseItem'); if (w.rar === 'legend') track('caseLegend'); });
  save();
  const total = wins.reduce((a, w) => a + fleaPrice(w), 0);
  const best = wins.reduce((a, w) => (ctRarIdx(w.rar) > ctRarIdx(a.rar) ? w : a), wins[0]);
  openModal(`<div class="cm-wrap"><h3>${c.emoji} ${c.name} ×${n}</h3>
    <div class="cm-grid n${n}">${wins.map((w, k) => { const r = RARITY.find((x) => x.id === w.rar); return `<button class="cm-card" style="--c:${r.color};--d:${k * 0.45}s" data-act="inspect" data-id="${start + k}">
      <div class="cm-back">${c.emoji}</div><div class="cm-front"><span>${w.e}</span><b>${esc(w.name)}</b><small>${r.name}</small><em>${fmt(fleaPrice(w))} ₽</em></div></button>`; }).join('')}</div>
    <div class="cm-sum">Итого: <b>${fmt(total)} ₽</b> за ${c.caps ? `${c.caps * n} 🟡` : `${fmt(c.price * n)} ₽`} · лучшее: ${best.e} ${RARITY.find((x) => x.id === best.rar).name}</div>
    <div class="btns" style="flex-direction:column;gap:8px">
      <button class="btn primary wide" data-act="caseMultiSell" data-id="${start}:${n}">💰 Продать все ${n} за ${fmt(total)} ₽</button>
      ${caseCan(c, n) ? `<button class="btn wide" data-act="caseMulti" data-id="${c.id}:${n}">🔁 Ещё ×${n}</button>` : ''}
      <button class="btn wide" data-act="cases">🛍️ Оставить на барахолке</button></div>
    <small class="weekly-note">Нажми на вещь, чтобы осмотреть её в 3D</small></div>`, { center: true });
  sfx('whoosh');
  wins.forEach((w, k) => setTimeout(() => {
    const r = w.rar;
    sfx(r === 'legend' || r === 'epic' ? 'jackpot' : r === 'rare' ? 'win' : 'coin');
    if (r === 'legend' || r === 'epic') confetti(r === 'legend' ? 120 : 50);
  }, 600 + k * 450));
}
Object.assign(ACTIONS, {
  caseMulti: (arg) => { const [id, n] = String(arg).split(':'); caseOpenMulti(id, +n || 1); },
  caseMultiSell: (arg) => {
    const [start, n] = String(arg).split(':').map(Number);
    const inv = fleaInv();
    fleaSell(Array.from({ length: n }, (_, k) => start + k).filter((i) => inv[i]));
    openCases();
  },
});
