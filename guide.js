// Подсказки «куда нажать» без невидимых целей.
// Переход по заданию/главе (➜) раньше подсвечивал элемент, которого на низком уровне ещё нет
// (работа, драки, казино закрыты) — игрок видел пустой экран. Теперь берётся первый видимый
// подходящий элемент, а если раздел закрыт — подсвечивается его карточка с требованиями.
// Обучение: если нужная кнопка на другом экране, Михалыч предлагает туда перейти.

const LIST_OF = { shop: '#shopList', life: '#lifeList', fun: '#funList', tasks: '#tasksList' };

function isVisible(el) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return (el.offsetParent || getComputedStyle(el).position === 'fixed') && r.width > 1 && r.height > 1;
}
function firstVisible(sel) {
  try { return [...document.querySelectorAll(sel)].find(isVisible) || null; } catch (e) { return null; }
}

goTo = function ([screen, tab, sel, label], goalText) {
  closeModal();
  showScreen(screen, tab || undefined);
  setTimeout(() => {
    const list = LIST_OF[screen];
    const tries = [sel, list && `${list} .card:not(.locked)`, list && `${list} .card`, list && `${list} .info-card`, list && `${list} .premium-hero`, list && `${list} > *`].filter(Boolean);
    const found = tries.find((s) => firstVisible(s));
    const el = found && firstVisible(found);
    const exact = found === sel;
    HL = found ? { sel: found, until: Date.now() + 5000 } : null;
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    hlApply();
    const locked = !exact && el && (el.classList.contains('locked') || /уровн|Нужен|закрыт|🔒/i.test(el.textContent.slice(0, 300)));
    toast(`🎯 ${goalText ? `${goalText} — ` : ''}${label}${!exact ? (locked ? ' · пока закрыто, смотри требования' : ' · раздел здесь') : ''}`, exact ? 'good' : '');
  }, 120);
  haptic('light');
};
hlApply = (function (orig) {
  return function () {
    if (HL && Date.now() <= HL.until) {
      const el = firstVisible(HL.sel);
      document.querySelectorAll('.goal-hl').forEach((e) => { if (e !== el) e.classList.remove('goal-hl'); });
      if (el && !el.classList.contains('goal-hl')) el.classList.add('goal-hl');
      return;
    }
    orig();
  };
})(hlApply);
setInterval(hlApply, 500); // ux.js держит ссылку на старую версию — вызываем новую сами

// ---------- Обучение: цель на другом экране — показываем пузырь с кнопкой «Перейти» ----------
tutRender = (function (orig) {
  return function () {
    orig();
    const t = S.tut;
    const bub = $('tutBubble');
    if (!t || t.done || t.step < 0 || t.step >= TUT.length || !bub) return;
    const step = TUT[t.step];
    const el = document.querySelector(step.sel);
    if (el && isVisible(el)) {
      // Цель есть, но за краем экрана — прокручиваем к ней
      const r = el.getBoundingClientRect();
      if ((r.bottom > innerHeight || r.top < 0) && bub.dataset.scrolled !== String(t.step)) { bub.dataset.scrolled = t.step; el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      return;
    }
    const screenEl = el && el.closest('.screen');
    const where = screenEl ? screenEl.id.replace('screen-', '') : 'game';
    bub.style.opacity = 1;
    bub.style.top = Math.round(innerHeight * 0.35) + 'px';
    const html = `<div class="tut-who">🧔 Михалыч · ${t.step + 1}/${TUT.length}</div><div>${step.text}</div>
      <div class="tut-btns"><button class="btn primary small" data-act="tutGoto" data-id="${where}">📍 Показать, где это</button>${step.btn ? `<button class="btn small" data-act="tutNext">${step.btn}</button>` : ''}<button class="btn small" data-act="tutSkip">Пропустить</button></div>`;
    if (bub.dataset.step !== `away${t.step}`) { bub.innerHTML = html; bub.dataset.step = `away${t.step}`; }
  };
})(tutRender);
ACTIONS.tutGoto = (screen) => {
  const step = S.tut && TUT[S.tut.step];
  if (step && step.sel.includes('"exchange"') && !$('exBody')) { openExchange(); return; }
  closeModal();
  showScreen(screen || 'game');
  setTimeout(tutRender, 200);
};
