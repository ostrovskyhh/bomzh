// Пустая лежанка на главном экране (намёк, что можно завести питомца) и свои имена питомцам.

// ---------- Лежанка ----------
const PET_BED = `<svg viewBox="0 0 80 70"><ellipse cx="40" cy="58" rx="34" ry="9" fill="#5A3A22"/><ellipse cx="40" cy="54" rx="31" ry="10" fill="#8E5A2B"/>
  <ellipse cx="40" cy="52" rx="24" ry="6" fill="#C98B4E"/><path d="M14 52q2-12 12-13M66 52q-2-12-12-13" stroke="#8E5A2B" stroke-width="5" fill="none" stroke-linecap="round"/>
  <ellipse cx="40" cy="51" rx="9" ry="3" fill="#E8B87A" opacity=".7"/></svg>`;
HOOKS.hud.push(() => {
  const slot = $('petSlot');
  if (!slot) return;
  const empty = !S.pet && S.storySeen;
  if (empty && !slot.querySelector('.pet-bed')) {
    slot.innerHTML = `<div class="pet-bed" data-act="petBed">${PET_BED}<span class="pb-hint">🐾</span></div>`;
  } else if (!empty && slot.querySelector('.pet-bed')) {
    slot.innerHTML = ''; renderedPet = ''; // питомец появился — пусть systems.js нарисует его заново
  }
});
ACTIONS.petBed = () => {
  S.petSel = (S.pets || []).filter((id) => !S.shelter.includes(id))[0] || 'shop';
  showScreen('shop', 'pets');
  toast(S.petSel === 'shop' ? '🐾 Лежанка пустует — заведи питомца!' : '🐾 Питомец ждёт: возьми его с собой', 'good');
};

// ---------- Имена ----------
// Имя питомца хранится в S.petNames, а p.name подменяется — так новое имя видно везде: на сцене, в тостах, окнах
PETS.forEach((p) => {
  const base = p.name;
  p.baseName = base;
  Object.defineProperty(p, 'name', { configurable: true, get: () => (S.petNames && S.petNames[p.id]) || base });
});
function petRename(id) {
  const p = PETS.find((x) => x.id === id);
  if (!p) return;
  openModal(`<div class="name-pop"><div class="ps-art" style="margin:0 auto">${PET_ART[p.art]}</div><h3>Как назовёшь питомца?</h3>
    <p>Сейчас: <b>${esc(p.name)}</b>${p.name !== p.baseName ? ` <small>(по умолчанию — ${esc(p.baseName)})</small>` : ''}</p>
    <input id="petNameInp" class="name-inp" maxlength="16" placeholder="${esc(p.baseName)}" value="${esc((S.petNames && S.petNames[id]) || '')}" autocomplete="off">
    <small class="fb-note">2–16 символов. Пустое поле — вернуть имя по умолчанию</small>
    <div class="btns" style="flex-direction:column;gap:8px"><button class="btn primary wide" data-act="petNameSave" data-id="${id}">Сохранить</button><button class="btn wide" data-act="close">Отмена</button></div></div>`, { center: true });
  setTimeout(() => { const i = $('petNameInp'); if (i) i.focus(); }, 150);
}
ACTIONS.petRename = (id) => petRename(id || S.pet);
ACTIONS.petNameSave = (id) => {
  const raw = (($('petNameInp') || {}).value || '').trim().replace(/\s+/g, ' ');
  const name = [...raw].filter((ch) => /[\p{L}\p{N} \-]/u.test(ch)).join('').slice(0, 16);
  if (!S.petNames) S.petNames = {};
  if (!name) delete S.petNames[id];
  else if (name.length < 2) { toast('Минимум 2 символа', 'bad'); return; }
  else S.petNames[id] = name;
  closeModal();
  sfx(PETS.find((x) => x.id === id).sound); haptic('success');
  toast(name ? `🐾 Теперь его зовут ${name}!` : 'Имя по умолчанию', 'good');
  renderCurrent(false);
  save();
};
// Кнопка «✏️» в разделе питомца и в окне занятий
const _petsTabRename = EXTRA_TABS.shop.pets;
EXTRA_TABS.shop.pets = () => {
  const html = _petsTabRename();
  return html.replace(/(<div class="ps-info"><b>)([^<]*)(<\/b>)/, (_, a, n, c) => `${a}${n} <button class="btn small pet-rename" data-act="petRename" data-id="${S.petSel && S.petSel !== 'shop' ? S.petSel : S.pet}">✏️</button>${c}`);
};
openPetRoom = (function (orig) {
  return function () {
    orig();
    const h = document.querySelector('#modalRoot .pet-room h3');
    if (h) h.insertAdjacentHTML('beforeend', ' <button class="btn small pet-rename" data-act="petRename">✏️</button>');
  };
})(openPetRoom);
// Новый питомец — сразу предлагаем дать имя
ACTIONS.petBuy = (function (orig) {
  return (id) => {
    const had = S.pets.includes(id);
    orig(id);
    if (!had && S.pets.includes(id)) S.petSel = id;
    // Если поверх подсказка раздела — окно имени подождёт в очереди
    if (!had && S.pets.includes(id)) setTimeout(() => { if (!modalOpen()) petRename(id); else MODAL_QUEUE.push({ fn: () => petRename(id) }); }, 500);
  };
})(ACTIONS.petBuy);
