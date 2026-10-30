// Halloween activities are only playable during the actual event; collected cosmetics stay forever.
function halloweenActive(){return activeSeasons().find(s=>s.id==='halloween')||null;}
function halloweenState(){const ev=halloweenActive();if(!ev)return null;const key=String(new Date(ev.holiday).getFullYear());S.halloweenEvents||={};return S.halloweenEvents[key]||=( {claimed:{},day:mskDay(),daily:{}} );}
const HALLOWEEN_QUESTS=[
 ['lantern','Погасшая улица','Зажги три фонаря и помоги Михалычу открыть праздник.','hwLantern',1,12],
 ['ghost','Кто живёт за дверью','Найди доброго призрака по двум приметам.','hwGhost',1,12],
 ['market','Лавка забытых масок','Ещё одна партия фонарей нужна для рынка масок.','hwLantern',1,15],
 ['letters','Письма из пустого дома','Призраки перепутали адреса: найди двух отправителей.','hwGhost',2,18],
 ['evening','Вечер для своих','Проведи сезонное свидание или помоги любому праздничному аттракциону.','hwCelebrate',1,15],
 ['parade','Парад без страха','Подсвети маршрут шествия второй тройкой фонарей.','hwLantern',1,18],
 ['secret','Тот, кто боялся темноты','Разгадай последний дом: за страшным окном оказался одинокий сосед.','hwGhost',1,20],
 ['home','Свет в каждом окне','Устрой ещё один праздничный вечер. Награда — постоянный эффект «Конфетти призраков».','hwCelebrate',1,25]
];
function halloweenEngineLantern(mg){
 const a=$('mgArena');a.classList.add('content466-arena');let round=0,cells=[],target=[];mg.hw={type:'lantern'};
 const flip=(arr,n)=>{for(const x of [n,n-3,n+3,...(n%3?[n-1]:[]),...(n%3<2?[n+1]:[])])if(x>=0&&x<9)arr[x]=!arr[x];};
 function start(){cells=Array(9).fill(false);target=Array(9).fill(false);const solution=[[0,4],[2,6],[1,5,7]][round];solution.forEach(n=>flip(target,n));mg.hw.solution=solution;mg.hw.round=round;draw();}
 function draw(){a.innerHTML=`<section class="hw-game"><small>Фонарь ${round+1} / 3</small><h3>Повтори узор света</h3><p>Нажатие меняет клетку и соседей по кресту. Собери такой же рисунок, как в образце. Можно пробовать без спешки.</p><div class="hw-target">${target.map(v=>`<span>${v?'🟨':'⬛'}</span>`).join('')}</div><div class="hw-lights">${cells.map((v,i)=>`<button data-hw-cell="${i}" aria-label="Клетка ${i+1}" aria-pressed="${v}">${v?'🎃':'🌑'}</button>`).join('')}</div><button class="btn wide" id="hwReset">Сбросить этот фонарь</button></section>`;
 a.querySelectorAll('[data-hw-cell]').forEach(b=>b.onclick=()=>{if(!mgAlive(mg))return;flip(cells,+b.dataset.hwCell);if(cells.every((v,i)=>v===target[i])){mgScore(1);round++;if(round===3){mg.hwSolved=true;mgEnd();return;}start();}else draw();});$('hwReset').onclick=()=>{if(mgAlive(mg))start();};}
 start();
}
function halloweenEngineGhost(mg){
 const a=$('mgArena');a.classList.add('content466-arena');let round=0;mg.hw={type:'ghost'};const icons=['🎃','🕯️','🐈‍⬛','🍬'];
 function draw(){const one=icons[round],two=icons[(round+1)%4],wrong=icons[(round+2)%4];const cards=shuffle([[one,two],[one,wrong],[wrong,two],[wrong,wrong]]);mg.hw.answer=cards.findIndex(c=>c[0]===one&&c[1]===two);
 a.innerHTML=`<section class="hw-game"><small>Дом ${round+1} / 4</small><h3>Где добрый призрак?</h3><p>В записке две приметы: <b>${one} + ${two}</b>. Выбери дверь, где есть обе.</p><div class="hw-doors">${cards.map((c,i)=>`<button data-hw-door="${i}"><span>🚪</span>${c.join(' ')}</button>`).join('')}</div><p id="hwDoorHint"></p></section>`;
 a.querySelectorAll('[data-hw-door]').forEach(b=>b.onclick=()=>{if(!mgAlive(mg))return;if(+b.dataset.hwDoor!==mg.hw.answer){$('hwDoorHint').textContent='Нужны обе приметы вместе. Посмотри записку ещё раз.';sfx('error');return;}mgScore(1);round++;if(round===4){mg.hwSolved=true;mgEnd();}else draw();});}draw();
}
function halloweenFinish(type,score,mg){
 if(!halloweenActive()||!mg.hwSolved)return false;const st=halloweenState();if(st.day!==mskDay()){st.day=mskDay();st.daily={};}
 const n=st.daily[type]||0;if(n<3){S.seasonCur.halloween=(S.seasonCur.halloween||0)+10;addXp(50);st.daily[type]=n+1;}
 halloweenTrack(type==='lantern'?'hwLantern':'hwGhost');halloweenTrack('hwCelebrate');save();return true;
}
ACTIONS.halloweenPlay=type=>{if(!halloweenActive()||!['lantern','ghost'].includes(type)||S.busy||MG||MG_PENDING)return;
 runGame({title:type==='lantern'?'Фонари полуночи':'Дом добрых призраков',hint:'Выполни все задачи. Таймера нет; ошибку можно исправить.',duration:0,setup:type==='lantern'?halloweenEngineLantern:halloweenEngineGhost,finish:(score,mg)=>{
 const ok=halloweenFinish(type,score,mg);closeModal();showScreen('shop','season');if(ok)toast('Испытание пройдено. Первые три победы каждого вида за день дают по 10 конфет.','good');}});
};
function halloweenQuestCurrent(){const st=halloweenState();return st?HALLOWEEN_QUESTS.find(q=>!st.claimed[q[0]]):null;}
function halloweenCount(key){return halloweenState()?.counts?.[key]||0;}
function halloweenTrack(key){const st=halloweenState();if(!st)return;st.counts||={};st.counts[key]=(st.counts[key]||0)+1;track(key);}
function halloweenQuestBase(q){const st=halloweenState();st.base||={};if(st.base[q[0]]===undefined)st.base[q[0]]=halloweenCount(q[3]);return st.base[q[0]];}
function halloweenHTML(){const st=halloweenState();if(!st)return '';const q=halloweenQuestCurrent();const progress=q?Math.min(q[4],halloweenCount(q[3])-halloweenQuestBase(q)):0;
 return `<section class="hw-hero"><small>НОЧЬ ДОБРЫХ ПРИЗРАКОВ</small><h2>🎃 Свет сильнее страха</h2><b class="hw-balance">🍬 ${S.seasonCur.halloween||0}</b><p>Восемь историй района, два испытания и праздничные свидания. Все сезонные квесты доступны без покупки.</p></section>
 <div class="hw-activities"><button class="btn" data-act="halloweenPlay" data-id="lantern">🎃 Фонари полуночи</button><button class="btn" data-act="halloweenPlay" data-id="ghost">👻 Дом призраков</button></div><p class="test-note">Без таймера. Первые три победы каждого вида за сутки: 10 конфет и 50 опыта. После лимита можно играть ради сюжета без повторной оплаты наград.</p>
 ${q?`<section class="hw-quest"><small>История ${HALLOWEEN_QUESTS.indexOf(q)+1} / 8</small><h3>${q[1]}</h3><p>${q[2]}</p><b>${Math.max(0,progress)} / ${q[4]} · 🍬 ${q[5]}</b><button class="btn primary wide" data-act="halloweenClaim" ${progress>=q[4]?'':'disabled'}>Завершить историю</button></section>`:'<div class="info-card">👻 Праздник спасён! Постоянный эффект находится в коллекции косметики.</div>'}
 <h3>Сезонный стиль за Stars</h3><p>Состав гарантирован. Косметика остаётся навсегда. Покупки доступны во время Хэллоуина.</p>${HALLOWEEN_PACKS.map(halloweenPackCard).join('')}`;
}
ACTIONS.halloweenClaim=()=>{const q=halloweenQuestCurrent();if(!q||halloweenCount(q[3])-halloweenQuestBase(q)<q[4])return;const st=halloweenState();st.claimed[q[0]]=true;S.seasonCur.halloween=(S.seasonCur.halloween||0)+q[5];if(q[0]==='home')giveCosm('fx_hw_free');track('seasonItem');const next=halloweenQuestCurrent();if(next)halloweenQuestBase(next);save();showScreen('shop','season');};
const halloweenSeasonBefore=EXTRA_TABS.shop.season;EXTRA_TABS.shop.season=()=>halloweenHTML()+halloweenSeasonBefore();
const HALLOWEEN_PACKS=[{id:'hw_lantern',name:'Фонарь Валеры',emoji:'🎃',stars:49,caps:15,vip:0,items:['bt_hw_lantern'],desc:'Анимированная бутылка-тыква и 15 крышек'},{id:'hw_phantom',name:'Призрачный маскарад',emoji:'👻',stars:149,caps:40,vip:3,items:['fx_hw_phantom','fr_hw_phantom'],desc:'Эффект призраков, рамка маскарада, 40 крышек и VIP на 3 дня'}];
function halloweenPackCard(p){return `<article class="hw-pack"><span>${p.emoji}</span><div><h3>${p.name}</h3><p>${p.desc}</p><small>Повторная покупка добавляет валюту и дни VIP; косметика не дублируется. VIP идёт с зачисления, включая время вне игры.</small><button class="btn primary wide" data-act="prem" data-id="${p.id}">⭐ ${p.stars} · Купить набор</button></div></article>`;}
BOTTLE_SKINS.push({id:'bt_hw_lantern',name:'Фонарь Валеры',rewardOnly:true,color:'#ffa137',dark:'#783619',cap:'#98d658',label:'🎃',shape:'round',effect:'lava'});
COSMETICS.push({id:'fx_hw_phantom',kind:'fx',name:'Призраки маскарада',emoji:'👻',src:'bundle',parts:['👻','🎃','✨']},{id:'fx_hw_free',kind:'fx',name:'Конфетти призраков',emoji:'🍬',src:'reward',parts:['🍬','👻','✦']},{id:'fr_hw_phantom',kind:'frame',frame:'hw_phantom',name:'Рамка маскарада',emoji:'🎭',src:'bundle'});
FRAMES.push({id:'hw_phantom',name:'Маскарад',donate:true,how:'Сезонный набор Хэллоуина',need:()=>ownsCosm('fr_hw_phantom')});
for(const p of HALLOWEEN_PACKS)PREM_GIVE[p.id]=()=>{p.items.forEach(giveCosm);addCaps(p.caps);if(p.vip)dnVip(p.vip);newcomerOfferState().snoozeUntil=Date.now()+3600000;return p.name+': '+p.desc;};
const halloweenBottleUnlock=bottleUnlockText;bottleUnlockText=b=>b.id==='bt_hw_lantern'?'Сезонный набор «Фонарь Валеры»':halloweenBottleUnlock(b);
const halloweenSetsBefore=dnSetsTab;dnSetsTab=function(...args){return (halloweenActive()?HALLOWEEN_PACKS.map(halloweenPackCard).join(''):'')+halloweenSetsBefore.apply(this,args);};
const halloweenDateBefore=openDateMenu;openDateMenu=function(id){halloweenDateBefore(id);if(!halloweenActive()||!GIRLS.some(g=>g.id===id))return;document.querySelector('#modalRoot .list')?.insertAdjacentHTML('afterbegin',`<section class="hw-date"><h3>🎃 Свидания Хэллоуина</h3><p>Совместная головоломка без таймера · 10 энергии · обычный перерыв между свиданиями.</p><p>Успех: +12 к отношениям, +10 радости и +8 любви к своей партнёрше.</p><button class="btn wide" data-act="halloweenDate" data-id="${id}:lantern">🕯️ Тыквенные фонари на двоих</button><button class="btn wide" data-act="halloweenDate" data-id="${id}:ghost">👻 Прогулка по дому призраков</button></section>`);};
ACTIONS.halloweenDate=arg=>{const [id,type]=String(arg).split(':'),g=GIRLS.find(g=>g.id===id);if(!halloweenActive()||!g||!['lantern','ghost'].includes(type)||S.busy||MG||MG_PENDING||S.energy<10||cdLeft('date'))return;
 if(S.girlfriend&&S.girlfriend!==id){toast('Пригласи свою партнёршу или сначала разберись в отношениях.','bad');return;}
 S.energy-=10;setCd('date',DATE_CD);save();runGame({title:type==='lantern'?'Фонари на двоих':'Прогулка с призраками',hint:'Решите задачу вместе. Спешить не нужно.',duration:0,setup:type==='lantern'?halloweenEngineLantern:halloweenEngineGhost,finish:(score,mg)=>{
 if(mg.hwSolved&&halloweenActive()){const st=girlState(id);st.rel=Math.min(100,(st.rel||0)+12);if(S.girlfriend===id)S.love=Math.min(100,(S.love||0)+8);addMood(10);addXp(XP.date);track('date');halloweenTrack('hwCelebrate');track('hwDate');save();}closeModal();showScreen('fun','dates');}});
};

prestigeProfile=(function(orig){return ()=>({...orig(),halloweenEvents:S.halloweenEvents||{}});})(prestigeProfile);

ACHS.push({id:"hw_guardian",name:"Хранитель фонарей",emoji:"🎃",fn:()=>Object.values(S.halloweenEvents||{}).reduce((n,e)=>n+Object.keys(e.claimed||{}).length,0),goals:[1,4,8],unit:"историй Хэллоуина"});
