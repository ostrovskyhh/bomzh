// Owner-approved idea77: the value belongs to this attempt, never to the saved warehouse.
police=function(c,loot){
 const estimate=Number.isFinite(loot)?Math.max(0,loot):0;
 const floor=Math.round(3000+level()*600+(S.wanted||0)*2000);
 ARREST={bribe:Math.max(floor,Math.ceil(estimate*.25)),mins:8,policy75:true};
 S.arrest75={estimate};save();
 sfx('bad');haptic('error');
 openModal(`<div class="big-art">🚓</div><h3>Задержание</h3><p>Добыча этой попытки изъята. Ранее накопленный склад сохранён.</p><p>Оценка добычи: <b>${incomeMoney(estimate)}</b>. Выкуп — 25% оценки, минимум ${incomeMoney(floor)} по уровню и розыску.</p><div class="info-card">Можно провести в тюрьме 8 минут. Три разных поручения сокращают срок на 2 минуты каждое. Минимум после всех поручений — оставшаяся часть срока.</div><div class="btns"><button class="btn primary wide" data-act="arrestBribe" ${S.money<ARREST.bribe?'disabled':''}>Выкуп · ${incomeMoney(ARREST.bribe)}</button><button class="btn wide" data-act="arrestJail">В тюрьму · 8 минут</button></div>`,{locked:true,center:true});
};
const arrestBribeBefore75=ACTIONS.arrestBribe;ACTIONS.arrestBribe=()=>{const offer=ARREST;arrestBribeBefore75();if(offer&&!ARREST)delete S.arrest75;save();};
const arrestJailBefore75=ACTIONS.arrestJail;
ACTIONS.arrestJail=()=>{const offer=ARREST;if(!offer)return;arrestJailBefore75();if(inJail()&&offer.policy75){S.busy.policy75={bribe:offer.bribe,done:[]};delete S.arrest75;}save();};
HOOKS.tick.push(()=>{if(S.arrest75&&!ARREST&&!inJail()&&!MG&&!MG_PENDING&&!modalOpen())police({},S.arrest75.estimate);});
const JAIL_TASKS75=[
 {id:'laundry',name:'Разобрать бельё',hint:'Выбери чистую одежду, затем полотенце и корзину.',items:['👕','🧺','🧻','🧼'],answer:['👕','🧻','🧺']},
 {id:'library',name:'Привести в порядок библиотеку',hint:'Найди книгу, поставь её на полку и отметь в журнале.',items:['📚','🗄️','📝','🔧'],answer:['📚','🗄️','📝']},
 {id:'canteen',name:'Помочь в столовой',hint:'Возьми тарелку, добавь суп и подай ложку.',items:['🍽️','🍲','🥄','🧵'],answer:['🍽️','🍲','🥄']}
];
function jailTaskGame75(mg,task){let step=0;const a=$('mgArena');a.classList.add('content466-arena','jail75');
 function draw(){a.innerHTML=`<h3>${task.name}</h3><p>${task.hint}</p><p>Шаг ${step+1} / 3</p><strong>${task.answer[step]}</strong><div class="hw-doors">${task.items.map(x=>`<button data-jail-piece75="${x}">${x}</button>`).join('')}</div><p id="jailHint75">Выбери показанный предмет.</p>`;a.querySelectorAll('[data-jail-piece75]').forEach(b=>b.onclick=()=>{if(!mgAlive(mg))return;if(b.dataset.jailPiece75!==task.answer[step]){$('jailHint75').textContent='Нужен предмет, показанный над кнопками.';return;}mgScore(1);step++;if(step===3)mgEnd();else draw();});}draw();}
const jailBefore75=openJail;
openJail=function(){if(!inJail()||!S.busy.policy75)return jailBefore75();const p=S.busy.policy75;
 openModal(`<h3>Тюремные поручения</h3><p>До свободы: <span data-until="${S.busy.end}"></span></p><p>Каждое поручение доступно один раз за этот срок. За выполнение — минус 2 минуты.</p>${JAIL_TASKS75.map(t=>card({thumb:'📋',title:t.name,desc:p.done.includes(t.id)?'Выполнено · срок сокращён':'Три понятных шага без таймера',btn:`<button class="btn primary" data-act="jailTask75" data-id="${t.id}" ${p.done.includes(t.id)?'disabled':''}>Начать</button>`})).join('')}<button class="btn wide" data-act="jailBribe" ${S.money<p.bribe?'disabled':''}>Выкуп · ${incomeMoney(p.bribe)}</button><button class="btn wide" data-act="close">Закрыть</button>`);
};
ACTIONS.jailTask75=id=>{const task=JAIL_TASKS75.find(t=>t.id===id),prison=S.busy;if(!task||!inJail()||!prison.policy75||prison.policy75.done.includes(id)||MG||MG_PENDING)return;runGame({title:task.name,hint:task.hint,duration:0,setup:mg=>jailTaskGame75(mg,task),finish:score=>{if(S.busy!==prison||!inJail()||prison.policy75.done.includes(id)||score<3)return;prison.policy75.done.push(id);jailCut(2);save();resultModal({emoji:'✅',title:'Поручение выполнено',text:'Срок сокращён на 2 минуты.',btn:'Понятно'});}});};
const jailBribeBefore75=ACTIONS.jailBribe;
ACTIONS.jailBribe=()=>{if(!inJail()||!S.busy.policy75)return jailBribeBefore75();const amount=S.busy.policy75.bribe;if(S.money<amount)return;S.money-=amount;S.busy=null;closeModal();save();refresh();};
