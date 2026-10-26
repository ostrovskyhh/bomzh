// Питомцы 3.0: новые виды (енот, коза, ворон), премиум-питомцы за звёзды (тигр, единорог, дракон)
// с сильными бонусами, и у каждого питомца свой раздел: его корм (3 вида), здоровье, дружба, занятия.

const emojiPet = (e) => `<svg viewBox="0 0 80 70"><text x="40" y="60" font-size="54" text-anchor="middle">${e}</text></svg>`;
Object.assign(PET_ART, { raccoon: emojiPet('🦝'), goat: emojiPet('🐐'), crow: emojiPet('🐦‍⬛'), tiger: emojiPet('🐯'), unicorn: emojiPet('🦄'), dragon: emojiPet('🐉') });

PETS.push(
  { id: 'raccoon', name: 'Енот Жорик', art: 'raccoon', price: 1500, level: 4, sound: 'squeak' },
  { id: 'goat', name: 'Коза Машка', art: 'goat', price: 6000, level: 7, sound: 'chirp' },
  { id: 'crow', name: 'Ворон Карлуша', art: 'crow', price: 12000, level: 10, sound: 'chirp' },
  { id: 'tiger', name: 'Тигр Шерхан', art: 'tiger', price: 0, premium: 149, sound: 'bark' },
  { id: 'unicorn', name: 'Единорог Искорка', art: 'unicorn', price: 0, premium: 199, sound: 'chirp' },
  { id: 'dragon', name: 'Дракон Горыныч', art: 'dragon', price: 0, premium: 299, sound: 'bark' },
);
Object.assign(PET_ROLES, {
  raccoon: { role: 'Мусорщик', toy: '🥫', bonus: (l) => `в мусорке ещё одна находка с шансом ${15 + l * 4}%, иногда тащит хлам сам` },
  goat: { role: 'Кормилица', toy: '🌿', bonus: (l) => `молоко: +${8 + l} 🍞 каждые ~10 мин, радость +${(0.2 + l * 0.03).toFixed(2)}/мин` },
  crow: { role: 'Разведчик', toy: '💍', bonus: (l) => `плохих событий −${(2 + l * 0.6).toFixed(1)}%, иногда приносит блестяшки на продажу` },
  tiger: { role: '⭐ Хищник', toy: '🥩', bonus: (l) => `тап +${25 + l}%, сила в драках +${15 + l}` },
  unicorn: { role: '⭐ Чудо', toy: '🌈', bonus: (l) => `весь доход +${15 + l}%, крит +3%` },
  dragon: { role: '⭐ Повелитель', toy: '💎', bonus: (l) => `тап +${30 + l}%, работа +20%, крит +5%, радость +0.5/мин` },
});
PETS.filter((p) => ['raccoon', 'goat', 'crow', 'tiger', 'unicorn', 'dragon'].includes(p.id)).forEach((p) => {
  Object.defineProperty(p, 'perk', { configurable: true, get: () => `<b>${PET_ROLES[p.id].role}</b>: ${PET_ROLES[p.id].bonus(S.pets && S.pets.includes(p.id) ? petLevel(p.id) : 1)}` });
});

// ---------- Бонусы новых видов ----------
HOOKS.mods.push((m) => {
  if (!petHappy()) return;
  const l = petLevel();
  if (S.pet === 'goat') m.mpm += 0.2 + l * 0.03;
  if (S.pet === 'tiger') m.tap *= 1.25 + l * 0.01;
  if (S.pet === 'unicorn') { const k = 1.15 + l * 0.01; m.tap *= k; m.pity *= k; m.work *= k; m.crit += 0.03; }
  if (S.pet === 'dragon') { m.tap *= 1.3 + l * 0.01; m.work *= 1.2; m.crit += 0.05; m.mpm += 0.5; }
});
const _badChancePet3 = badChance;
badChance = () => { const b = _badChancePet3(); return S.pet === 'crow' && petHappy() ? Math.max(0, b - (2 + petLevel() * 0.6) / 100) : b; };
const _myFighterPet3 = myFighter;
myFighter = () => { const f = _myFighterPet3(); if (S.pet === 'tiger' && petHappy()) f.strength += 15 + petLevel(); return f; };
// Енот в мусорке
onTrashExtra = (function (orig) {
  return function () {
    orig();
    if (S.pet === 'raccoon' && petHappy() && Math.random() < 0.15 + petLevel() * 0.04) {
      const id = rollItem(); addItem(id);
      setTimeout(() => toast(`🦝 Жорик нашёл ещё: ${ITEMS[id].emoji} ${ITEMS[id].name}`, 'good'), 900);
    }
  };
})(onTrashExtra);
// Находки козы, енота и ворона — свой таймер
HOOKS.tick.push(() => {
  if (!S.pet || !S.storySeen || !['goat', 'raccoon', 'crow'].includes(S.pet) || Date.now() < (S.petFind3At || 0)) return;
  S.petFind3At = Date.now() + rand(8, 12) * 60000;
  if (!petHappy()) return;
  const l = petLevel(), p = activePet();
  if (S.pet === 'goat') { feed(8 + l); toast(`🐐 ${p.name} дала молока: +${8 + l} 🍞`, 'good'); }
  if (S.pet === 'raccoon') { const id = rollItem(); addItem(id); toast(`🦝 ${p.name} притащил ${ITEMS[id].emoji} ${ITEMS[id].name}`, 'good'); }
  if (S.pet === 'crow' && Math.random() < 0.5) { const id = pick(['ring', 'watch', 'coin', 'badge']); if (ITEMS[id]) { addItem(id); toast(`🐦‍⬛ ${p.name} принёс блестяшку: ${ITEMS[id].emoji} ${ITEMS[id].name}`, 'good'); } }
});

// ---------- Премиум-питомцы за звёзды ----------
PETS.filter((p) => p.premium).forEach((p) => {
  PREM_GIVE[`pet_${p.id}`] = () => {
    if (!S.pets.includes(p.id)) S.pets.push(p.id);
    S.pet = p.id; S.petFood = 100; S.petHp = 100; S.petSick = null; S.petFedAt = Date.now();
    return `${PET_ROLES[p.id].role.replace('⭐ ', '')} ${p.name} теперь с тобой!`;
  };
});

// ---------- Корм: у каждого вида три своих (простой / хороший / деликатес) ----------
const PET_MENU = {
  pigeon: [['Хлебные крошки', '🍞'], ['Пшено отборное', '🌾'], ['Семечки «Джинн»', '🌻']],
  rat: [['Корки и огрызки', '🥖'], ['Сыр «Российский»', '🧀'], ['Пармезан', '🧀']],
  dog: [['Кости с рынка', '🦴'], ['Сухой корм «Шарик»', '🥫'], ['Говяжья вырезка', '🥩']],
  hedgehog: [['Червячки', '🪱'], ['Яблоки', '🍎'], ['Грибы лесные', '🍄']],
  parrot: [['Зерновая смесь', '🌾'], ['Фрукты', '🍌'], ['Орехи макадамия', '🥜']],
  cat: [['Рыбьи головы', '🐟'], ['Корм «Вискас»', '🥫'], ['Сёмга', '🍣']],
  raccoon: [['Объедки из бака', '🥡'], ['Креветки', '🦐'], ['Клубника', '🍓']],
  goat: [['Сено', '🌾'], ['Морковь', '🥕'], ['Капуста кочанная', '🥬']],
  crow: [['Хлебные корки', '🍞'], ['Фарш', '🥩'], ['Грецкие орехи', '🌰']],
  tiger: [['Курица', '🍗'], ['Говядина', '🥩'], ['Мраморный стейк', '🥩']],
  unicorn: [['Овёс', '🌾'], ['Радужные яблоки', '🍏'], ['Звёздная пыльца', '✨']],
  dragon: [['Угли', '🔥'], ['Жареная баранина', '🍖'], ['Золотые слитки… ой, пряники', '🍪']],
};
const PET_MENU_TIER = [
  { price: 15, food: 30, sick: 0.06, desc: 'Дёшево, но может расстроить желудок' },
  { price: 60, food: 50, desc: 'Сбалансированный корм' },
  { price: 300, food: 80, hp: 20, bond: 5, desc: 'Деликатес: здоровье и дружба' },
];
Object.entries(PET_MENU).forEach(([pid, list]) => list.forEach(([name, emoji], i) => {
  const t = PET_MENU_TIER[i];
  const premiumK = PETS.find((p) => p.id === pid).premium ? 3 : 1; // премиум-питомцы едут на дорогом корме
  PET_FOOD.push({ id: `${pid}_${i}`, name, emoji, price: t.price * premiumK, food: t.food, hp: t.hp, sick: t.sick, bond: t.bond, for: [pid], tier: i, desc: t.desc });
}));
// В разделе питомца — только его корм (+ премиум-корм для всех и объедки из мусорки, если есть)
function petMenuFor(pid) {
  // + старый корм, который уже лежит в запасе и подходит этому питомцу
  return PET_FOOD.filter((f) => (f.for && f.for.length === 1 && f.for[0] === pid && /_\d$/.test(f.id)) || f.id === 'premium'
    || ((S.petPantry[f.id] || 0) > 0 && (!f.for || f.for.includes(pid)) && !/_\d$/.test(f.id)));
}
ACTIONS.petFeedItem = (function (orig) {
  return (id) => { const f = PET_FOOD.find((x) => x.id === id); const before = S.petFood; orig(id); if (S.petFood > before && f && f.bond) addBond(f.bond); };
})(ACTIONS.petFeedItem);

// ---------- Вкладка «Питомцы»: раздел каждого питомца + магазин ----------
EXTRA_TABS.shop.pets = () => {
  ensureLife();
  const owned = S.pets.filter((id) => !S.shelter.includes(id));
  let sel = S.petSel;
  if (!sel || (sel !== 'shop' && !owned.includes(sel))) sel = S.pet || (owned[0] || 'shop');
  const chips = `<div class="pet-chips">${owned.map((id) => { const p = PETS.find((x) => x.id === id); return `<button class="${sel === id ? 'on' : ''}" data-act="petSel" data-id="${id}">${PET_ART[p.art]}<span>${p.name.split(' ')[0]}${S.pet === id ? ' ✓' : ''}</span></button>`; }).join('')}
    <button class="${sel === 'shop' ? 'on' : ''}" data-act="petSel" data-id="shop"><b>🛒</b><span>Магазин</span></button></div>`;
  return chips + (sel === 'shop' ? petShopHTML() : petSectionHTML(sel));
};

function petSectionHTML(id) {
  const p = PETS.find((x) => x.id === id), r = PET_ROLES[id];
  const active = S.pet === id;
  const l = petLevel(id);
  const head = `<div class="pet-sec ${p.premium ? 'premium' : ''}"><div class="ps-art">${PET_ART[p.art]}</div>
    <div class="ps-info"><b>${p.name}</b><small>${r ? r.role : ''} · дружба ${l}/${PET_MAX}</small>
      <div class="progress"><div style="width:${petLevelProgress(id) * 100}%"></div></div>
      <small>${r ? r.bonus(l) : ''}</small></div></div>`;
  if (!active) {
    return head + `<div class="info-card">С тобой сейчас ${S.pet ? `«${activePet().name}»` : 'никого'}. Бонус, корм и занятия — только у того, кто с тобой.</div>
      <button class="btn primary wide" data-act="petPick" data-id="${id}">🐾 Взять с собой</button>`;
  }
  const s = S.petSick && PET_SICK[S.petSick];
  const bars = `<div class="pet-bars"><div>🍖 Сытость<div class="progress"><div style="width:${S.petFood}%;${S.petFood <= 20 ? 'background:var(--red)' : ''}"></div></div><b>${Math.floor(S.petFood)}</b></div>
    <div>❤️ Здоровье<div class="progress"><div style="width:${S.petHp}%;${S.petHp < 40 ? 'background:var(--red)' : ''}"></div></div><b>${Math.floor(S.petHp)}</b></div></div>
    ${S.petFood <= 20 ? '<div class="info-card warn">Голодный — бонусов нет! Покорми ниже</div>' : ''}`;
  const vet = s ? card({ thumb: '🩺', title: `Ветеринар: ${s.name}`, desc: `${p.name} ${s.symptom}. Вылечит и даст витамины (+20 ❤️). Без лечения питомец слабеет и может попасть в приют.`,
    btn: priceBtn('vetTreat', '', vetPrice(), S.money >= vetPrice()) }) : '';
  const menu = petMenuFor(id).map((f) => {
    const have = S.petPantry[f.id] || 0;
    const pack = f.id === 'scraps' ? 0 : f.price * PACK;
    return `<div class="pet-food ${f.tier === 2 ? 'deluxe' : ''}"><span class="pf-e">${f.emoji}</span><div class="pf-b"><b>${f.name}${have ? ` ×${have}` : ''}</b>
        <small>+${f.food} сытости${f.hp ? ` · +${f.hp} ❤️` : ''}${f.bond ? ` · +${f.bond} дружбы` : ''}${f.sick ? ` · риск ${Math.round(f.sick * 100)}% живот` : ''}</small></div>
      <div class="btn-col"><button class="btn green small" data-act="petFeedItem" data-id="${f.id}" ${have && S.petFood < 98 ? '' : 'disabled'}>Покормить</button>
        ${pack ? priceBtn('petFoodBuy', f.id, pack, S.money >= pack, `${PACK} шт · ${fmtShort(pack)} ₽`).replace('class="btn', 'class="btn small') : ''}</div></div>`;
  }).join('');
  return head + bars + vet + `<button class="btn primary wide" data-act="petRoom">🎾 Занятия: погладить, игра, прогулка…</button>
    <div class="subhead">🍽️ Корм · купи пачку и корми</div>${menu}`;
}

function petShopHTML() {
  const row = (pet) => {
    const owned = S.pets.includes(pet.id), inShelter = S.shelter.includes(pet.id), lvlOk = level() >= (pet.level || 1);
    let btn;
    if (inShelter) btn = priceBtn('shelterTake', pet.id, shelterPrice(pet.id), S.money >= shelterPrice(pet.id), `🏚️ ${fmt(shelterPrice(pet.id))}`);
    else if (S.pet === pet.id) btn = '<button class="btn" disabled>С тобой</button>';
    else if (owned) btn = `<button class="btn green" data-act="petPick" data-id="${pet.id}">Взять</button>`;
    else if (pet.premium) btn = `<button class="btn primary" data-act="prem" data-id="pet_${pet.id}">${typeof starPrice === 'function' ? starPrice(pet.premium) : `⭐ ${pet.premium}`}</button>`;
    else if (pet.quest) btn = '<button class="btn" disabled>📖 Сюжет</button>';
    else if (!lvlOk) btn = lockBtn;
    else btn = priceBtn('petBuy', pet.id, pet.price, S.money >= pet.price);
    return card({ thumb: PET_ART[pet.art], title: pet.name, cls: `${pet.premium ? 'pet-premium' : ''} ${owned || lvlOk || pet.premium ? '' : 'locked'}`,
      desc: inShelter ? 'В приюте. Забери и больше не бросай!' : pet.perk, extra: !owned && !lvlOk && !pet.premium ? reqHTML({ level: pet.level }) : '', btn });
  };
  return `<div class="info-card">У каждого питомца своя работа и свой корм. Бонус растёт с дружбой. Голодный или больной питомец не помогает.</div>
    <div class="subhead">⭐ Премиум-питомцы · за Telegram Stars</div>${PETS.filter((p) => p.premium).map(row).join('')}
    <div class="subhead">Обычные питомцы</div>${PETS.filter((p) => !p.premium).map(row).join('')}`;
}

ACTIONS.petSel = (id) => { S.petSel = id; renderCurrent(false); };
const _petPick3 = ACTIONS.petPick;
ACTIONS.petPick = (id) => { _petPick3(id); S.petSel = id; };
