// Питомцы 2.0: у каждого своя «профессия» и уровень дружбы (1–10). Чем крепче дружба,
// тем сильнее бонус. Дружба растёт от занятий: погладить, поиграть (мини-игра), прогулка,
// дрессировка, выставка. Окно занятий открывается тапом по питомцу на главном экране.

const PET_MAX = 10;
const PET_ROLES = {
  pigeon: { role: 'Почтальон', toy: '💌', bonus: (l) => `приносит ${fmt(petPigeonMoney(l))} ₽ каждые ~10 мин${l >= 6 ? ', иногда золотую крышку' : ''}` },
  rat: { role: 'Добытчица', toy: '🧀', bonus: (l) => `таскает еду и хлам для рынка каждые ~10 мин${l >= 5 ? ', иногда бутылки' : ''}` },
  dog: { role: 'Охранник', toy: '🦴', bonus: (l) => `кража во сне −${Math.round((1 - petGuardK(l)) * 100)}%, плохих событий −${(1 + l * 0.5).toFixed(1)}%, +${Math.round(l * 1.5)} силы в драках` },
  hedgehog: { role: 'Лекарь', toy: '🍎', bonus: (l) => `здоровье +${(0.1 + l * 0.04).toFixed(2)}/мин` },
  parrot: { role: 'Зазывала', toy: '🌻', bonus: (l) => `милостыня +${10 + l * 4}%, зарплата +${2 + l}%` },
  cat: { role: 'Талисман', toy: '🧶', bonus: (l) => `шанс крита +${(1 + l * 0.4).toFixed(1)}%, радость +${(0.2 + l * 0.05).toFixed(2)}/мин` },
};

function petBondXp(id = S.pet) { return (S.petBond && S.petBond[id]) || 0; }
function petNeed(l) { return 30 + l * 25; } // опыта дружбы на переход с уровня l
function petLevel(id = S.pet) {
  let l = 1, xp = petBondXp(id);
  while (l < PET_MAX && xp >= petNeed(l)) { xp -= petNeed(l); l++; }
  return l;
}
function petLevelProgress(id = S.pet) {
  let l = 1, xp = petBondXp(id);
  while (l < PET_MAX && xp >= petNeed(l)) { xp -= petNeed(l); l++; }
  return l >= PET_MAX ? 1 : xp / petNeed(l);
}
function petMaxLevel() { return Math.max(1, ...(S.pets || []).map((id) => petLevel(id))); }
function petPigeonMoney(l) { return Math.round((10 + l * 6) * scale()); }
function petGuardK(l) { return Math.max(0.15, 0.5 - l * 0.035); }
function petBusy() { return !S.pet || S.busy; }

function addBond(n) {
  if (!S.pet) return;
  if (!S.petBond) S.petBond = {};
  const before = petLevel();
  S.petBond[S.pet] = petBondXp() + n;
  const after = petLevel();
  if (after > before) {
    const p = activePet();
    sfx('levelup'); confetti(40);
    setTimeout(() => toast(`🐾 ${p.name}: дружба ${after} ур.! ${PET_ROLES[p.id].role} стал сильнее`, 'good'), 400);
    track('petLevel');
  }
}

// Описание питомца в магазине — с текущим бонусом по уровню дружбы
PETS.forEach((p) => {
  const r = PET_ROLES[p.id];
  if (!r) return;
  Object.defineProperty(p, 'perk', { configurable: true, get: () => `<b>${r.role}</b>: ${r.bonus(S.pets && S.pets.includes(p.id) ? petLevel(p.id) : 1)}` });
});

// ---------- Бонусы ----------
HOOKS.mods.push((m) => {
  if (!petHappy()) return;
  const l = petLevel();
  if (S.pet === 'hedgehog') m.hpm += 0.1 + l * 0.04;
  if (S.pet === 'parrot') { m.pity *= 1.1 + l * 0.04; m.work *= 1.02 + l * 0.01; }
  if (S.pet === 'cat') { m.crit += 0.01 + l * 0.004; m.mpm += 0.2 + l * 0.05; }
});
petGuardMult = () => (S.pet === 'dog' && petHappy() ? petGuardK(petLevel()) : 1);
const _badChancePet = badChance;
badChance = () => { const b = _badChancePet(); return S.pet === 'dog' && petHappy() ? Math.max(0, b - (1 + petLevel() * 0.5) / 100) : b; };
const _myFighterPet = myFighter;
myFighter = () => { const f = _myFighterPet(); if (S.pet === 'dog' && petHappy()) f.strength += Math.round(petLevel() * 1.5); return f; };

// Находки почтальона и добытчицы — свой таймер, старый (systems.js) выключаем
HOOKS.load.push(() => { S.petFindAt = Number.MAX_SAFE_INTEGER; if (!S.petFind2At) S.petFind2At = Date.now() + 8 * 60000; });
HOOKS.tick.push(() => {
  if (!S.pet || !S.storySeen || Date.now() < (S.petFind2At || 0)) return;
  S.petFind2At = Date.now() + rand(8, 12) * 60000;
  if (!petHappy()) return;
  const l = petLevel(), p = activePet();
  if (S.pet === 'pigeon') {
    if (l >= 6 && Math.random() < 0.05) { addCaps(1); toast(`🕊️ ${p.name} принёс золотую крышку!`, 'good'); }
    else { const m = petPigeonMoney(l); addMoney(m); toast(`🕊️ ${p.name} принёс блестяшку: +${fmt(m)} ₽`, 'good'); }
    sfx('chirp');
  } else if (S.pet === 'rat') {
    if (Math.random() < 0.5) { feed(5 + l); toast(`🐀 ${p.name} притащила еду: +${5 + l} 🍞`, 'good'); }
    else { const id = rollItem(); addItem(id); toast(`🐀 ${p.name} притащила ${ITEMS[id].emoji} ${ITEMS[id].name} — продай Шнырю`, 'good'); }
    if (l >= 5 && Math.random() < 0.4) { const b = 20 + l * 8; addBottles(b); }
    sfx('squeak');
  } else if (S.pet === 'parrot') { petBubble(pick(PARROT_LINES)); sfx('chirp'); }
});

// ---------- Занятия ----------
const PET_ACTS = [
  { id: 'pat', emoji: '🤲', name: 'Погладить', cd: 60, desc: '+3 дружбы, +2 😊', sick: true },
  { id: 'play', emoji: '🎾', name: 'Поиграть', cd: 240, desc: 'Мини-игра: лови игрушку. До +25 дружбы, +4 😊, −5 сытости питомца' },
  { id: 'walk', emoji: '🦮', name: 'Прогулка', cd: 900, energy: 10, desc: '−10 ⚡. Питомец что-нибудь найдёт. +10 дружбы, +5 ❤️ питомцу' },
  { id: 'train', emoji: '🎓', name: 'Дрессировка', cd: 600, desc: '+20 дружбы. Стоит денег, дороже с уровнем' },
  { id: 'show', emoji: '🏆', name: 'Выставка', cd: 7200, lvl: 5, desc: 'С 5 ур. дружбы. Шанс победить растёт с уровнем — призы деньгами' },
];
function trainPrice() { return Math.round(60 * petLevel() * Math.sqrt(scale()) / 10) * 10; }
function showChance() { return Math.min(0.8, 0.2 + petLevel() * 0.06); }
function petCd(id) { return Math.max(0, ((S.petCd && S.petCd[id]) || 0) - Date.now()); }
function setPetCd(id, sec) { if (!S.petCd) S.petCd = {}; S.petCd[id] = Date.now() + sec * 1000; }

function petActWhy(a) {
  if (!S.pet) return 'Нет питомца';
  if (S.busy) return 'Валера занят';
  if (S.petSick && !a.sick) return 'Питомец болеет — сначала к ветеринару';
  if (S.petFood <= 20 && !a.sick) return 'Питомец голодный — покорми';
  if (a.lvl && petLevel() < a.lvl) return `Нужна дружба ${a.lvl} ур.`;
  if (a.energy && S.energy < a.energy) return `Нужно ${a.energy} ⚡`;
  if (a.id === 'train' && S.money < trainPrice()) return `Нужно ${fmt(trainPrice())} ₽`;
  return '';
}

function petModalHTML() {
  const p = activePet();
  if (!p) return '';
  const r = PET_ROLES[p.id], l = petLevel();
  return `<div class="pet-room">
      <div class="pr-art">${PET_ART[p.art]}</div>
      <h3>${p.name} · ${r.role}</h3>
      <div class="pr-lvl"><b>❤️ Дружба ${l}${l >= PET_MAX ? ' (макс.)' : ''}</b><div class="progress"><div style="width:${petLevelProgress() * 100}%"></div></div></div>
      <div class="pr-bonus">${r.bonus(l)}${petHappy() ? '' : '<br><span style="color:var(--red)">Сейчас бонуса нет: питомец голодный или болеет</span>'}</div>
      <div class="pr-stats">🍖 ${Math.floor(S.petFood)}/100 · ❤️ ${Math.floor(S.petHp)}/100${S.petSick ? ` · ${PET_SICK[S.petSick].emoji} болеет` : ''}</div>
      <div class="pr-acts">${PET_ACTS.map((a) => {
        const cd = petCd(a.id), why = petActWhy(a);
        const label = a.id === 'train' ? `${a.desc} (${fmt(trainPrice())} ₽)` : a.id === 'show' ? `${a.desc} (шанс ${Math.round(showChance() * 100)}%)` : a.desc;
        return `<button class="pr-act" data-act="petDo" data-id="${a.id}" ${cd || why ? 'disabled' : ''} ${why ? `data-why="${why}"` : ''}>
          <span>${a.emoji}</span><b>${a.name}</b><small>${cd ? `⏳ <span data-until="${Date.now() + cd}"></span>` : label}</small></button>`;
      }).join('')}</div>
      <div class="btns"><button class="btn wide" data-act="petShop">🥣 Корм и ветеринар</button><button class="btn wide" data-act="close">Закрыть</button></div></div>`;
}
function openPetRoom() { if (!activePet()) return; openModal(petModalHTML(), { center: true }); }

// Мини-игра «Лови игрушку»: игрушка прыгает по полю, жми по ней
function petPlayGame(mg) {
  const arena = $('mgArena');
  const toy = PET_ROLES[S.pet].toy;
  arena.innerHTML = `<div class="pet-field" id="petField"><div class="pet-mini">${PET_ART[activePet().art]}</div><button class="pet-toy" id="petToy">${toy}</button></div>`;
  const btn = $('petToy');
  let speed = 1000;
  const jump = () => {
    if (!mgAlive(mg)) return;
    btn.style.left = rand(5, 80) + '%';
    btn.style.top = rand(5, 75) + '%';
    mg.timers.push(setTimeout(jump, speed));
  };
  btn.onpointerdown = (e) => {
    e.preventDefault();
    if (!mgAlive(mg)) return;
    mgScore(1); sfx(activePet().sound); haptic('light');
    floatAt(btn, '+1', 'good');
    speed = Math.max(520, speed - 50);
    jump();
  };
  jump();
}

function petDo(id) {
  const a = PET_ACTS.find((x) => x.id === id);
  const p = activePet();
  if (!a || !p || petCd(id) || petActWhy(a)) return;
  const l = petLevel();
  if (id === 'pat') {
    setPetCd(id, a.cd); addBond(3); addMood(2); sfx(p.sound); haptic('light');
    toast(`🤲 ${p.name} довольно жмурится. +3 дружбы`, 'good');
    openPetRoom();
  } else if (id === 'play') {
    setPetCd(id, a.cd);
    S.petFood = Math.max(0, S.petFood - 5);
    runGame({ title: `🎾 Игра: ${p.name}`, hint: `Лови ${PET_ROLES[p.id].toy} — тапай по игрушке, пока она не ускакала!`, duration: 8, setup: petPlayGame,
      finish: (score) => {
        const bond = Math.min(25, 5 + score * 2);
        addBond(bond); addMood(4); track('petPlay');
        resultModal({ art: `<div class="pr-art">${PET_ART[p.art]}</div>`, rays: null, title: score >= 8 ? 'Лучшая игра!' : 'Поиграли!', text: `Поймано: ${score}<br>+${bond} дружбы, +4 😊`, btn: 'Ещё занятия' });
        save();
      } });
  } else if (id === 'walk') {
    setPetCd(id, a.cd);
    S.energy -= a.energy;
    S.petHp = Math.min(100, S.petHp + 5);
    addBond(10); addMood(5); track('petWalk');
    // Чем лучше нюх и выше дружба — тем лучше находки
    const sniff = { dog: 1.5, rat: 1.4 }[p.id] || 1;
    const x = Math.random();
    let found;
    if (x < 0.4) { const m = Math.round((15 + l * 8) * scale() * sniff); addMoney(m); found = `нашёл ${fmt(m)} ₽ в кустах`; }
    else if (x < 0.7) { const it = rollItem(); addItem(it); found = `откопал ${ITEMS[it].emoji} ${ITEMS[it].name}`; }
    else if (x < 0.9) { const b = Math.round((25 + l * 10) * sniff); addBottles(b); found = `привёл к куче бутылок: +${b} 🍾`; }
    else { found = 'просто радовался жизни'; addMood(5); }
    resultModal({ art: `<div class="pr-art">${PET_ART[p.art]}</div>`, rays: null, title: '🦮 Прогулка', text: `${p.name} ${found}!<br>+10 дружбы, +5 😊, −10 ⚡`, btn: 'Отлично' });
    sfx(p.sound);
  } else if (id === 'train') {
    const price = trainPrice();
    setPetCd(id, a.cd);
    S.money -= price;
    addBond(20); track('petTrain');
    const TRICKS = ['«Сидеть!»', '«Дай лапу!»', '«Голос!»', '«Принеси!»', '«Умри!»', '«Танцуй!»', '«Ищи бутылки!»', '«Охраняй!»', '«Кувырок!»', '«Поклон!»'];
    toast(`🎓 ${p.name} выучил команду ${TRICKS[(l - 1) % TRICKS.length]} −${fmt(price)} ₽, +20 дружбы`, 'good');
    sfx(p.sound);
    openPetRoom();
  } else if (id === 'show') {
    setPetCd(id, a.cd);
    track('petShow');
    if (Math.random() < showChance()) {
      const m = Math.round(50 * l * scale());
      addMoney(m); addBond(15); addMood(10);
      if (l >= PET_MAX && Math.random() < 0.3) addCaps(1);
      confetti(60); sfx('win');
      resultModal({ emoji: '🏆', title: 'Победа на выставке!', text: `${p.name} покорил жюри! Приз ${fmt(m)} ₽, +15 дружбы, +10 😊`, btn: 'Ура!' });
    } else {
      addBond(5); addMood(-2); sfx('lose');
      resultModal({ emoji: '🎗️', rays: 'bad', title: 'Без медали', text: `Жюри выбрало пуделя с бантиком. ${p.name} не расстроился: +5 дружбы`, btn: 'В следующий раз' });
    }
  }
  save();
}

// Тап по питомцу: сердечки + окно занятий
const _petTap2 = ACTIONS.petTap;
ACTIONS.petTap = () => { _petTap2(); if (!modalOpen()) openPetRoom(); };
Object.assign(ACTIONS, {
  petDo: (id) => petDo(id),
  petRoom: () => openPetRoom(),
  petShop: () => { closeModal(); showScreen('shop', 'pets'); },
});
// Кормёжка тоже укрепляет дружбу
const _petFeedItem2 = ACTIONS.petFeedItem;
ACTIONS.petFeedItem = (id) => { const before = S.petFood; _petFeedItem2(id); if (S.petFood > before) addBond(2); };

// Во вкладке питомцев — кнопка занятий и уровень дружбы
const _petsTab2 = EXTRA_TABS.shop.pets;
EXTRA_TABS.shop.pets = () => {
  const html = _petsTab2();
  const p = activePet();
  if (!p) return html;
  const l = petLevel();
  const ready = PET_ACTS.filter((a) => !petCd(a.id) && !petActWhy(a)).length;
  const box = `<div class="online-box pet-box"><b>🐾 ${p.name} · ${PET_ROLES[p.id].role} · дружба ${l}/${PET_MAX}</b>
    <div class="progress"><div style="width:${petLevelProgress() * 100}%"></div></div>
    <small>Чем крепче дружба, тем сильнее бонус. Сейчас: ${PET_ROLES[p.id].bonus(l)}</small>
    <button class="btn primary wide" data-act="petRoom">Занятия с питомцем${ready ? ` · доступно ${ready}` : ''}</button></div>`;
  return html.replace('<div class="subhead">Миска', box + '<div class="subhead">Миска');
};

// Точка на «Питомцах», когда можно заняться с питомцем
const _sectionAlertsPet = sectionAlerts;
sectionAlerts = () => { const a = _sectionAlertsPet(); if (a.shop) a.shop.pets = !!S.pet && PET_ACTS.some((x) => x.id !== 'pat' && !petCd(x.id) && !petActWhy(x)); return a; };
