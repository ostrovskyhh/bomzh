// Approved idea 71: optional local stories and earned neighbourhood services.
function honest68State(){S.honestSaga||={done:{},service:{}};S.honestSaga.done||={};S.honestSaga.service||={};return S.honestSaga;}
function honest68Ready(){return S.quest?.path==='honest'&&!S.underworld;}
function honest68Local(){return HONEST_CASES_468.filter(c=>c.city===city());}
function honest68Done(){return Object.keys(honest68State().done).length;}
function honest68Reward(){const jobs=JOBS.filter(j=>S.hired?.[j.id]),salary=Math.max(JOBS[0].pay,...jobs.map(j=>jobNetSalary(j)));return Math.round(Math.min(salary*.75,JOBS[0].pay*25));}
function honest68HTML(){
 if(!honest68Ready())return '<div class="info-card">Честные поручения доступны на честном пути. Они не требуют перехода в криминал.</div>';
 const st=honest68State(),list=honest68Local(),local=list.filter(c=>st.done[c.id]).length;
 return `<section class="honest68-hero"><small>ЧЕСТНЫЙ ПУТЬ</small><h3>🤝 Репутация делом</h3><p>Короткие местные истории без таймера и требований набрать уровень. Улики уже в задании.</p><b>Репутация: ${honest68Done()*10} / 120</b><p>В городе выполнено ${local} / 3. Два поручения открывают помощь соседей.</p></section>`+list.map((c,i)=>`<article class="honest68-case"><h3>${c.title}</h3><small>${c.npc}</small><p>${c.text}</p><p><span>Энергия:</span> 8 · ${incomeMoney(honest68Reward())} · ${60+i*10} XP · <span>Репутация:</span> 10</p><button class="btn ${st.done[c.id]?'':'primary'} wide" data-act="honest68Play" data-id="${c.id}" ${st.done[c.id]||i>local||S.energy<8?'disabled':''}>${st.done[c.id]?'Выполнено':i>local?'Сначала предыдущее поручение':'Разобраться и помочь'}</button></article>`).join('')+
 `<div class="info-card"><b>Услуги квартала</b><p>После двух местных поручений: обед +30 сытости или помощь +20 здоровья. Один выбор раз в 12 часов, без оплаты.</p><div class="btns">${[['food','🍲 Обед'],['health','🩺 Помощь']].map(([id,t])=>`<button class="btn green" data-act="honest68Service" data-id="${id}" ${local>=2&&Date.now()>=(st.service[city()]||0)?'':'disabled'}>${t}</button>`).join('')}</div></div>`;
}
ACTIONS.honest68Open=()=>openModal(honest68HTML(),{center:true});
const honest68WorkBefore=EXTRA_TABS.life.work;EXTRA_TABS.life.work=()=>`<button class="btn wide" data-act="honest68Open">🤝 Честные поручения и репутация</button>`+honest68WorkBefore();
BETA_HUBS.find(h=>h.id==='money').groups[0][1].push({s:'life',t:'work',act:'honest68Open',id:'honest68',e:'🤝',n:'Честные поручения'});
ACTIONS.honest68Play=id=>{
 const list=honest68Local(),st=honest68State(),i=list.findIndex(c=>c.id===id),d=list[i];if(!honest68Ready()||!d||st.done[id]||list.slice(0,i).some(c=>!st.done[c.id])||S.energy<8||S.busy||MG||MG_PENDING)return;
 const c=city(),reward=honest68Reward();
 S.energy-=8;save();runGame({title:d.title,hint:'Изучи улику и выбери решение. Без таймера и требований к уровню.',duration:0,setup:mg=>story30Game(mg,d),finish:(score,mg)=>{
 if(mg.story30Solved&&score===1&&city()===c&&honest68Ready()&&!st.done[id]){st.done[id]={at:Date.now()};addMoney(reward);addXp(60+i*10);track('honestStory');save();}closeModal();ACTIONS.honest68Open();}});
};
ACTIONS.honest68Service=type=>{
 if(!honest68Ready()||!['food','health'].includes(type)||S.busy||MG||MG_PENDING)return;const st=honest68State(),local=honest68Local().filter(c=>st.done[c.id]).length;
 if(local<2||Date.now()<(st.service[city()]||0)||(type==='food'?S.food>=maxFood():S.health>=maxHealth()))return;
 st.service[city()]=Date.now()+12*3600000;if(type==='food')feed(30);else S.health=Math.min(maxHealth(),S.health+20);save();updateHud();ACTIONS.honest68Open();
};
prestigeProfile=(function(orig){return ()=>({...orig(),honestSaga:S.honestSaga||{done:{},service:{}}});})(prestigeProfile);
ACHS.push({id:'honest_helper68',name:'Надёжный сосед',emoji:'🤝',fn:honest68Done,goals:[1,4,12],unit:'честных поручений'});
