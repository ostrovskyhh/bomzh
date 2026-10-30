// Approved idea 70: existing animals, purchases and friendship are retained.
const PET68_EMOJI=['🐦','🐢','🦦','🐿️','🦎','🦝','🐇','🦇'];
const PET68_TASKS={sparrow:['🌾','🪵','🏠'],tortoise:['☀️','🥬','🪨'],ferret:['📦','🏷️','🚪'],squirrel:['🌰','🌳','🍂'],axolotl:['🧽','💧','🌿'],coati:['👣','🗺️','🥭'],rabbit:['🧺','🥕','🗼'],bat:['🌙','🕯️','🏠']};
function pet68Art(id){
 const parts={
 sparrow:'<path d="M24 45L8 54l19-1" fill="#725641"/><ellipse cx="43" cy="45" rx="23" ry="18" fill="#ab8962"/><circle cx="57" cy="29" r="14" fill="#8e6f50"/><path d="M68 28l12 5-12 3" fill="#e3bb55"/><path d="M31 42q13-15 24 2q-10 16-24-2" fill="#684d3e"/><circle cx="61" cy="26" r="2.4" fill="#172532"/>',
 tortoise:'<ellipse cx="27" cy="61" rx="9" ry="5" fill="#739460"/><ellipse cx="58" cy="61" rx="9" ry="5" fill="#739460"/><ellipse cx="40" cy="47" rx="29" ry="20" fill="#72844d"/><path d="M15 45l25-15 24 15-24 16Z" fill="#b2b56f" stroke="#58633a" stroke-width="2"/><circle cx="73" cy="48" r="12" fill="#a3b87c"/><circle cx="76" cy="44" r="2" fill="#26382d"/>',
 ferret:'<path d="M23 50Q3 32 10 20" fill="none" stroke="#8b6749" stroke-width="12" stroke-linecap="round"/><ellipse cx="44" cy="51" rx="26" ry="15" fill="#c4a581"/><circle cx="63" cy="35" r="17" fill="#e1cdb0"/><circle cx="51" cy="23" r="7" fill="#927559"/><circle cx="74" cy="23" r="7" fill="#927559"/><path d="M49 33q14-13 28 0l-4 10H54Z" fill="#70533f"/><circle cx="57" cy="35" r="2" fill="#fff"/><circle cx="69" cy="35" r="2" fill="#fff"/><ellipse cx="63" cy="44" rx="5" ry="3" fill="#463a38"/>',
 squirrel:'<path d="M32 54C-1 49 2 9 24 8c21-1 17 32-1 24" fill="none" stroke="#b57843" stroke-width="17" stroke-linecap="round"/><ellipse cx="49" cy="53" rx="19" ry="18" fill="#ca955d"/><circle cx="58" cy="29" r="16" fill="#ca955d"/><path d="M45 19l1-15 9 12m10 0 9-12v18" fill="#a56538"/><circle cx="63" cy="27" r="2.3" fill="#25272b"/><ellipse cx="62" cy="43" rx="7" ry="9" fill="#e0b675"/>',
 axolotl:'<path d="M22 27L8 18m14 17L6 34m18 10L9 52m58-25 14-9M68 35l16-1M66 44l16 8" stroke="#df879e" stroke-width="6" stroke-linecap="round"/><ellipse cx="45" cy="53" rx="20" ry="17" fill="#edc0c2"/><ellipse cx="45" cy="34" rx="27" ry="20" fill="#f2cacc"/><circle cx="35" cy="32" r="3" fill="#3a3341"/><circle cx="55" cy="32" r="3" fill="#3a3341"/><path d="M39 42q6 5 12 0" fill="none" stroke="#a4607d" stroke-width="2"/>',
 coati:'<path d="M25 49Q4 40 13 14" fill="none" stroke="#ad7f53" stroke-width="12" stroke-linecap="round"/><path d="M9 23l12 3M9 36l11 2" stroke="#604938" stroke-width="5"/><ellipse cx="46" cy="53" rx="24" ry="15" fill="#a9855f"/><circle cx="61" cy="32" r="17" fill="#b9976a"/><path d="M46 22l2-12 12 9m8 0 9-7 1 14" fill="#7e624b"/><path d="M63 38l21 4-14 11-17-10" fill="#d6b98e"/><circle cx="67" cy="30" r="2.5" fill="#2c302b"/><circle cx="81" cy="44" r="3" fill="#3e3938"/>',
 rabbit:'<ellipse cx="45" cy="55" rx="24" ry="17" fill="#e6d5bb"/><ellipse cx="34" cy="18" rx="8" ry="17" fill="#e6d5bb"/><ellipse cx="56" cy="18" rx="8" ry="17" fill="#e6d5bb"/><ellipse cx="34" cy="17" rx="3" ry="11" fill="#d3a9a5"/><ellipse cx="56" cy="17" rx="3" ry="11" fill="#d3a9a5"/><ellipse cx="45" cy="39" rx="23" ry="19" fill="#eee0c8"/><circle cx="36" cy="36" r="2.5" fill="#39333c"/><circle cx="55" cy="36" r="2.5" fill="#39333c"/><path d="M40 43l5 5 5-5Z" fill="#c9989b"/>',
 bat:'<path d="M38 41Q21 12 4 24l5 25q12-8 18 11l12-9m12-10q18-29 35-17l-5 25q-12-8-18 11L51 51" fill="#645872" stroke="#463b56" stroke-width="2"/><ellipse cx="45" cy="48" rx="14" ry="21" fill="#75667e"/><path d="M32 30l1-18 12 14 12-14 1 18" fill="#75667e"/><circle cx="40" cy="35" r="3" fill="#ead99e"/><circle cx="51" cy="35" r="3" fill="#ead99e"/><path d="M40 45q5 4 10 0" fill="none" stroke="#d1b9c6" stroke-width="2"/>'
 };return '<svg viewBox="0 0 90 80"><ellipse cx="45" cy="73" rx="29" ry="4" fill="#0c1e2e44"/>'+parts[id]+'</svg>';
}
for(const [i,d] of CITY_PETS_468.entries()){
 const p={id:d.id,baseName:d.name,art:'pet68_'+d.id,price:d.price,homeCity:d.homeCity,level:1,sound:'chirp'};
 Object.defineProperty(p,'name',{configurable:true,get:()=>S.petNames?.[p.id]||p.baseName});
 PET_ART[p.art]=pet68Art(d.id);
 PET_ROLES[p.id]={role:d.role,toy:d.food,bonus:l=>`<span>${d.stat}</span>: +${(d.value*l*(['work','tap','regen','rate','crit'].includes(d.mod)?100:1)).toFixed(['work','tap','regen','rate','crit'].includes(d.mod)?1:2)}${['work','tap','regen','rate','crit'].includes(d.mod)?'%':''}`};
 Object.defineProperty(p,'perk',{get:()=>PET_ROLES[p.id].bonus(petLevel(p.id))});PETS.push(p);
 PET_MENU[p.id]=[[d.food+' · Обычный корм',d.food],['Сбалансированный корм',d.food],['Любимое лакомство',d.food]];
 PET_MENU[p.id].forEach(([name,emoji],i)=>PET_FOOD.push({id:p.id+'_'+i,name,emoji,for:[p.id],tier:i,...PET_MENU_TIER[i]}));
}
HOOKS.mods.push(m=>{if(!petHappy())return;const d=CITY_PETS_468.find(p=>p.id===S.pet);if(!d)return;const v=d.value*petLevel();if(['work','tap','regen','rate'].includes(d.mod))m[d.mod]*=1+v;else m[d.mod]+=v;});
function pet68Name(p){return `<span ${S.petNames?.[p.id]?'data-i18n-user':''}>${esc(p.name)}</span>`;}
function pet68Section(p){const t=document.createElement('template');t.innerHTML=petSectionHTML(p.id);if(S.petNames?.[p.id])t.content.querySelector('.ps-info>b')?.setAttribute('data-i18n-user','');return t.innerHTML;}
function pet68Owned(){ensureLife();return PETS.filter(p=>S.pets.includes(p.id)&&!S.shelter.includes(p.id));}
function pet68Selected(){const owned=pet68Owned();return owned.find(p=>p.id===S.petSel)||owned.find(p=>p.id===S.pet)||owned[0];}
let PET68_TAB='mine',PET68_CITY='all',PET68_TYPE='all';
function pet68Filters(){return `<div class="pet68-filters"><label>Город<select id="pet68City"><option value="all">Все города</option>${Object.entries(CITIES).map(([id,c])=>`<option value="${id}" ${PET68_CITY===id?'selected':''}>${c.name}</option>`).join('')}</select></label><label>Тип<select id="pet68Type"><option value="all">Все питомцы</option><option value="normal" ${PET68_TYPE==='normal'?'selected':''}>Обычные</option><option value="premium" ${PET68_TYPE==='premium'?'selected':''}>За Stars</option></select></label><button class="btn small" data-act="pet68Filter">Показать</button></div>`;}
function pet68Shop(){
 const list=PETS.filter(p=>(PET68_TYPE==='all'||(PET68_TYPE==='premium')===!!p.premium)&&(PET68_CITY==='all'||(p.homeCity||0)===CITIES[PET68_CITY]?.idx));
 return pet68Filters()+list.map(p=>{const owned=S.pets.includes(p.id),future=(p.homeCity||0)>CITIES[city()].idx,ready=level()>=(p.level||1);let button;
 if(S.shelter.includes(p.id))button=priceBtn('shelterTake',p.id,shelterPrice(p.id),S.money>=shelterPrice(p.id));
 else if(owned)button=`<button class="btn green" data-act="petPick" data-id="${p.id}">${S.pet===p.id?'С тобой':'Взять с собой'}</button>`;
 else if(p.premium)button=`<button class="btn primary" data-act="prem" data-id="pet_${p.id}">⭐ ${p.premium}</button>`;
 else if(p.quest)button='<small>Сюжетный питомец</small>';
 else if(future)button=`<small>Откроется в городе: ${Object.values(CITIES).find(c=>c.idx===p.homeCity)?.name}</small>`;
 else button=priceBtn('petBuy',p.id,p.price,ready&&S.money>=p.price);
 return `<article class="pet68-card">${PET_ART[p.art]}<div><h3>${pet68Name(p)}</h3><small>${PET_ROLES[p.id]?.role||''}</small><p>${p.perk||''}</p>${button}</div></article>`;}).join('')||'<p>По этим фильтрам питомцев нет.</p>';
}
function pet68ActivityHTML(p){const d=CITY_PETS_468.find(x=>x.id===p.id);if(!d)return '';return `<div class="info-card"><b>${d.activity}</b><p>Три спокойные задачи · 5 энергии · +12 дружбы. Перерыв 10 минут.</p><button class="btn green wide" data-act="pet68Activity" data-id="${p.id}" ${S.pet===p.id&&!cdLeft('pet68_'+p.id)&&petHappy()&&S.energy>=5?'':'disabled'}>Городское занятие</button></div>`;}
EXTRA_TABS.shop.pets=()=>{
 const selected=pet68Selected();return `<div class="pet68-tabs">${[['mine','Мои'],['shop','Магазин'],['develop','Развитие']].map(([id,t])=>`<button data-act="pet68Tab" data-id="${id}" class="${PET68_TAB===id?'on':''}">${t}</button>`).join('')}</div><p class="test-note">Помогает только один питомец рядом с Валерой. Голодному или больному сначала нужны корм и лечение.</p>`+(PET68_TAB==='shop'?pet68Shop():!selected?'<button class="btn primary wide" data-act="pet68Tab" data-id="shop">Выбрать первого питомца</button>':`<div class="pet68-owned">${pet68Owned().map(p=>`<button class="${selected.id===p.id?'on':''}" data-act="pet68Select" data-id="${p.id}">${pet68Name(p)}${S.pet===p.id?' ✓':''}</button>`).join('')}</div>`+(PET68_TAB==='develop'?petDevelopmentHTML(selected.id)+pet68ActivityHTML(selected):S.pet===selected.id?pet68Section(selected)+pet68ActivityHTML(selected):`<div class="info-card"><b>${pet68Name(selected)}</b><p>${selected.perk}</p><p>Сейчас отдыхает. Возьми с собой, чтобы кормить, лечить и заниматься.</p><button class="btn primary wide" data-act="petPick" data-id="${selected.id}">Взять с собой</button></div>`));
};
ACTIONS.pet68Tab=id=>{if(['mine','shop','develop'].includes(id)){PET68_TAB=id;renderCurrent(false);}};
ACTIONS.pet68Select=id=>{if(pet68Owned().some(p=>p.id===id)){S.petSel=id;renderCurrent(false);}};
ACTIONS.pet68Filter=()=>{PET68_CITY=$('pet68City').value;PET68_TYPE=$('pet68Type').value;renderCurrent(false);};
const pet68BuyBefore=ACTIONS.petBuy;ACTIONS.petBuy=id=>{const p=PETS.find(p=>p.id===id);if(!p||(p.homeCity||0)>CITIES[city()].idx)return;return pet68BuyBefore(id);};
for(const action of ['petSpecialty','petAccessory']){const before=ACTIONS[action];ACTIONS[action]=value=>{const inShop=currentScreen==='shop'&&TABS.shop==='pets';const r=before(value);if(inShop){closeModal();renderCurrent(false);}return r;};}
ACTIONS.pet68Activity=id=>{
 const p=PETS.find(p=>p.id===id),items=PET68_TASKS[id],d=CITY_PETS_468.find(p=>p.id===id);if(!p||!items||S.pet!==id||!petHappy()||S.energy<5||S.busy||MG||MG_PENDING||cdLeft('pet68_'+id))return;
 S.energy-=5;setCd('pet68_'+id,600);save();runGame({title:d.activity,hint:'Смотри на предмет в задании и выбирай такой же. Три задачи без таймера.',duration:0,setup:mg=>{
  let round=0;const draw=()=>{const choices=shuffle([...new Set([...items,'🧸','📎'])]);$('mgArena').classList.add('content466-arena');$('mgArena').innerHTML=`<div class="pet68-game"><p>Задача ${round+1} / 3</p><h3>${d.activity}</h3><strong>${items[round]}</strong><p>Найди такой же предмет</p><div class="hw-doors">${choices.map(x=>`<button>${x}</button>`).join('')}</div></div>`;document.querySelectorAll('#mgArena button').forEach(b=>b.onclick=()=>{if(!mgAlive(mg)||b.textContent!==items[round])return;mgScore(1);round++;if(round===3){mg.pet68Solved=true;mgEnd();}else draw();});};draw();
 },finish:(score,mg)=>{if(mg.pet68Solved&&S.pet===id){addBond(12);track('petPlay');save();}closeModal();showScreen('shop','pets');}});
};
