// Approved player ideas 55–57. Account purchases and pet training survive prestige.
const CAPS_CLOTHES = [
  { slot: 'hat', id: 'caps_focus', name: 'Кепка «Точный удар»', caps: 45, crit: .025, tap: 1, art: 'kepka' },
  { slot: 'body', id: 'caps_breathe', name: 'Куртка «Второе дыхание»', caps: 60, regen: .15, energy: 20, art: 'pukhovik' },
  { slot: 'shoes', id: 'caps_marathon', name: 'Кроссовки «Марафон»', caps: 75, energy: 80, regen: .05, art: 'kedy' }
];
CAPS_CLOTHES.forEach(it => {
  CLOTHES[it.slot].push({ ...it, price: 0, tier: 2, season: true });
});
function capsWardrobeRestore() {
  if (!S.owned) return;
  CAPS_CLOTHES.forEach(it => {
    if ((S.capsWardrobe || []).includes(it.id) && !S.owned[it.slot].includes(it.id)) S.owned[it.slot].push(it.id);
    const table = {hat:HATS,body:BODIES,shoes:SHOES}[it.slot];
    table[it.id] = table[it.art];
  });
}
HOOKS.load.push(capsWardrobeRestore);
applyCity = (function(orig) { return function(...args) { const out = orig(...args); capsWardrobeRestore(); return out; }; })(applyCity);
const PET_SPECIALTIES = {
  courier: { name: 'Помощник', desc: 'Зарплата +2% за уровень специализации', bonus: (m,l) => { m.work *= 1+l*.02; } },
  scout: { name: 'Искатель', desc: 'Шанс критического тапа +0,4% за уровень специализации', bonus: (m,l) => { m.crit += l*.004; } },
  companion: { name: 'Компаньон', desc: 'Восстановление энергии +4% за уровень специализации', bonus: (m,l) => { m.regen *= 1+l*.04; } }
};
const PET_ACCESSORIES = [
  {id:'none',name:'Без аксессуара',level:1,emoji:''},
  {id:'ribbon',name:'Бирюзовый бант',level:3,emoji:'🎀'},
  {id:'scarf',name:'Золотой платок',level:6,emoji:'🧣'},
  {id:'crown',name:'Корона друга',level:10,emoji:'👑'}
];
function petDevelopment(id, create=false) {
  if (create) { S.petDevelopment ||= {}; S.petDevelopment[id] ||= {xp:0,specialty:'',accessory:'none'}; }
  return S.petDevelopment?.[id] || {xp:0,specialty:'',accessory:'none'};
}
function petSpecialtyLevel(id=S.pet) { return Math.min(5,1+Math.floor(Math.max(0,petDevelopment(id).xp||0)/100)); }
function petDevelopmentHTML(id) {
  if (!(S.pets||[]).includes(id) || (S.shelter||[]).includes(id)) return '';
  const d=petDevelopment(id), l=petSpecialtyLevel(id), unlocked=petLevel(id)>=3;
  return `<section class="idea-panel"><h3>🐾 Развитие питомца</h3><p>Занятия дают опыт специализации даже после 10 уровня дружбы. Бонус работает только у сытого, здорового питомца рядом с тобой.</p>
    <b>Специализация: ${l}/5</b><p>${l===5?'Мастерство достигнуто':`${d.xp||0} / ${l*100} опыта`}</p>
    ${unlocked?'':'<p>Специализация откроется на 3 уровне дружбы.</p>'}
    <div class="idea-choices">${Object.entries(PET_SPECIALTIES).map(([key,s])=>`<button class="btn ${d.specialty===key?'primary':''}" data-act="petSpecialty" data-id="${id}:${key}" ${unlocked?'':'disabled'}><b>${s.name}</b><small>${s.desc}</small>${d.specialty===key?' ✓':''}</button>`).join('')}</div>
    <p>Выбор и смена специализации бесплатны. Опыт сохраняется.</p><h4>Аксессуары · только внешний вид</h4>
    <div class="idea-choices">${PET_ACCESSORIES.map(a=>`<button class="btn ${d.accessory===a.id?'primary':''}" data-act="petAccessory" data-id="${id}:${a.id}" ${petLevel(id)>=a.level?'':'disabled'}>${a.emoji} ${a.name}<small>Дружба: ${a.level}</small></button>`).join('')}</div></section>`;
}
HOOKS.mods.push(m => {
  CAPS_CLOTHES.forEach(it => { if(S.eq[it.slot]===it.id) m.regen *= 1+(it.regen||0); });
  if (petHappy() && petLevel()>=3) PET_SPECIALTIES[petDevelopment(S.pet).specialty]?.bonus(m,petSpecialtyLevel());
});
addBond = (function(orig) { return function(n) {
  const id=S.pet; orig(n);
  if(id && n>0 && Number.isFinite(n)) { const d=petDevelopment(id,true); d.xp=Math.min(400,(d.xp||0)+n); }
}; })(addBond);
prestigeProfile = (function(orig) { return function() { return {...orig(),capsWardrobe:[...(S.capsWardrobe||[])],petDevelopment:S.petDevelopment||{}}; }; })(prestigeProfile);
function wardrobeStats(it) {
  return `⚡ +${it.energy||0} · ♻ +${Math.round((it.regen||0)*100)}% · 🎯 +${Math.round((it.crit||0)*1000)/10}% · 🍾 +${it.tap||0}`;
}
const clothesBeforeIdeas=EXTRA_TABS.shop.clothes;
EXTRA_TABS.shop.clothes=()=>{
  capsWardrobeRestore();
  return `<section class="idea-panel"><h3>🧢 Одежда за крышки</h3><p>Сравни с надетой вещью: энергия · восстановление · критический тап · бутылки за тап. Покупки сохраняются при переезде и престиже.</p>
    ${CAPS_CLOTHES.map(it=>{const owned=(S.capsWardrobe||[]).includes(it.id),worn=S.eq[it.slot]===it.id;return card({thumb:itemPreviewSVG(it.slot,it.id),title:it.name,desc:`<b>${wardrobeStats(it)}</b><br>Сейчас: ${wardrobeStats(gear(it.slot))}`,btn:`<button class="btn ${owned?'green':'primary'}" data-act="${owned?'wear':'capsCloth'}" data-id="${owned?it.slot+':'+it.id:it.id}" ${worn||(!owned&&S.caps<it.caps)?'disabled':''}>${worn?'Надето':owned?'Надеть':it.caps+' 🪙'}</button>`});}).join('')}</section>`+clothesBeforeIdeas();
};
ACTIONS.capsCloth=id=>{
  const it=CAPS_CLOTHES.find(x=>x.id===id);
  if(!it || (S.capsWardrobe||[]).includes(id) || S.caps<it.caps) return;
  S.caps-=it.caps; S.capsWardrobe||=[];S.capsWardrobe.push(id);capsWardrobeRestore();S.eq[it.slot]=id;
  taskProgress('bought');save();renderScene();showScreen('shop','clothes');sfx('buy');
};
ACTIONS.cloth=(function(orig){return id=>{if(CAPS_CLOTHES.some(it=>id===it.slot+':'+it.id))return;orig(id);};})(ACTIONS.cloth);
ACTIONS.wear=(function(orig){return id=>{const it=CAPS_CLOTHES.find(it=>id===it.slot+':'+it.id);if(it&&!(S.capsWardrobe||[]).includes(it.id))return;orig(id);};})(ACTIONS.wear);
function petDevelopmentAction(value,kind){
  const [id,key]=value.split(':');if(!(S.pets||[]).includes(id)||(S.shelter||[]).includes(id))return;
  if(kind==='specialty'&&(!PET_SPECIALTIES[key]||petLevel(id)<3))return;
  if(kind==='accessory'&&!PET_ACCESSORIES.some(a=>a.id===key&&petLevel(id)>=a.level))return;
  petDevelopment(id,true)[kind]=key;save();renderedPet='';updateHud();openModal(petSectionHTML(id),{center:true});
}
ACTIONS.petSpecialty=v=>petDevelopmentAction(v,'specialty');
ACTIONS.petAccessory=v=>petDevelopmentAction(v,'accessory');
function petAccessoryArt(html,id){
  const a=PET_ACCESSORIES.find(a=>a.id===petDevelopment(id).accessory&&petLevel(id)>=a.level);
  return a?.emoji?`<span class="pet-dressed">${html}<i class="pet-accessory ${a.id}" aria-hidden="true">${a.emoji}</i></span>`:html;
}
petSectionHTML=(function(orig){return id=>orig(id).replace(`<div class="ps-art">${PET_ART[PETS.find(p=>p.id===id)?.art]}</div>`,`<div class="ps-art">${petAccessoryArt(PET_ART[PETS.find(p=>p.id===id)?.art],id)}</div>`)+petDevelopmentHTML(id);})(petSectionHTML);
petModalHTML=(function(orig){return ()=>{const p=activePet();return (p?orig().replace(PET_ART[p.art],petAccessoryArt(PET_ART[p.art],p.id)):orig())+petDevelopmentHTML(S.pet);};})(petModalHTML);
HOOKS.hud.push(()=>{const el=document.querySelector('#petSlot .pet');if(el&&S.pet&&petDevelopment(S.pet).accessory!=='none'&&!el.querySelector('.pet-dressed')){const art=petAccessoryArt(el.innerHTML,S.pet);if(art!==el.innerHTML)el.innerHTML=art;}});

// Each caught good object has a stable type; bricks/dogs affect performance and arrest risk,
// but cannot silently delete already collected scrap. The existing crime rank multiplier runs once.
const SCRAP_TYPES=[
  {e:'🔩',name:'Железо',value:5000},{e:'🥉',name:'Латунь',value:8000},
  {e:'🔌',name:'Кабель',value:11000},{e:'🟠',name:'Медь',value:14000}
];
function scrapUnit(it){return Math.round(it.value*(1+level()*.04));}
function scrapTotal(mg){return SCRAP_TYPES.reduce((sum,it)=>sum+(mg.scrap?.[it.e]||0)*(mg.scrapPrices?.[it.e]??scrapUnit(it)),0);}
function scrapReceipt(mg,loot){
  return `<div class="scrap-receipt">${SCRAP_TYPES.map(it=>`<div>${it.e} ${it.name}: ${mg.scrap?.[it.e]||0} × ${fmt(mg.scrapPrices?.[it.e]??scrapUnit(it))} ₽</div>`).join('')}<p>Сумма добычи: ${fmt(scrapTotal(mg))} ₽<br>Бонус ранга: +${Math.round((mg.scrapRank||0)*CRIME_RANK_MONEY*100)}%<br><b>К выплате: ${fmt(loot)} ₽</b></p><small>При задержании добычу изымают. На счёт поступит сумма с учётом общих удержаний.</small></div>`;
}
const scrapCrime=CRIMES.find(c=>c.id==='metal');
if(scrapCrime){
  scrapCrime.desc='Каждый пойманный металл оплачивается отдельно. Цена видна до дела и во время сбора. Опасности повышают риск задержания.';
  scrapCrime.quantityReward=true;
  scrapCrime.game.setup=mg=>{
    mg.scrap={};mg.scrapPrices=Object.fromEntries(SCRAP_TYPES.map(it=>[it.e,scrapUnit(it)]));gameCatch(mg,{basket:'🛍️',good:SCRAP_TYPES.map(it=>it.e),bad:['🧱','🐕'],goodRate:.68,badText:'Ай!',onCatch:(e,good)=>{
      if(good)mg.scrap[e]=(mg.scrap[e]||0)+1;
      const el=$('scrapBag');if(el)el.textContent=SCRAP_TYPES.map(it=>`${it.e} ×${mg.scrap[it.e]||0}`).join(' · ')+` · ${fmt(scrapTotal(mg))} ₽`;
    }});
    $('mgArena').insertAdjacentHTML('beforeend',`<div class="scrap-bag" id="scrapBag">${SCRAP_TYPES.map(it=>`${it.e} ${fmt(scrapUnit(it))} ₽`).join(' · ')}</div>`);
  };
  scrapCrime.reward=(perf,mg)=>{mg.scrapRank=crimeRank();mg.scrapPrices||=Object.fromEntries(SCRAP_TYPES.map(it=>[it.e,scrapUnit(it)]));return scrapTotal(mg);};
  scrapCrime.receipt=scrapReceipt;
  const crimeTabBeforeIdeas=EXTRA_TABS.fun.crime;
  EXTRA_TABS.fun.crime=()=>crimeTabBeforeIdeas()+(city()==='zas'&&crimeOpen()?`<section class="idea-panel"><h3>🔩 Прайс приёмки цветмета</h3>${SCRAP_TYPES.map(it=>`<p>${it.e} ${it.name}: <b>${fmt(scrapUnit(it))} ₽</b></p>`).join('')}<p>Каждый предмет считается отдельно. Бонус криминального ранга прибавляется к сумме добычи. Энергия: 30 · Перерыв: 15 мин · Розыск: 2</p></section>`:'');
}
