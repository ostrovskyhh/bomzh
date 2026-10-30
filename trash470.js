// One roll and one grant per search. Animation never owns the reward transaction.
const TRASH_ODDS=[{id:'empty',chance:.30},{id:'damage',chance:.20},{id:'common',chance:.40},{id:'rare',chance:.09},{id:'epic',chance:.009},{id:'legend',chance:.001}];
let TRASH_RUN=null;
function trashOutcome(roll=Math.random()){let n=roll;for(const o of TRASH_ODDS)if((n-=o.chance)<-1e-12)return o.id;return 'legend';}
function trashFindPool(rarity){return CASES.flatMap(c=>(rarity==='common'?['common','uncommon']:[rarity]).flatMap(r=>(c.loot[r]||[]).map(row=>({c,row,rarity:r}))));}
function trashFind(rarity){
 const {c,row:[e,name,f],rarity:actual}=pick(trashFindPool(rarity)),rar=RARITY.find(r=>r.id===actual),q=rollQuality();
 const raw=caseItemBase(c,rar,f)*q.mult*rand(.96,1.04),value=Math.max(10,raw>=1000?Math.round(raw/10)*10:Math.round(raw));
 const [a,b]=WEAR[q.id]||WEAR.mw;
 return {key:`${c.id}:${name}:${q.id}`,e,name,rar:actual,q:q.id,value,from:c.id,found:'trash',fl:Math.round(rand(a,b)*10000)/10000,pat:Math.floor(Math.random()*1000)};
}
function trashGrant(kind){
 if(kind==='empty')return {kind,emoji:'🗑️',title:'Сегодня пусто',text:'Ничего ценного не нашлось. Иногда мусорка — просто мусорка.'};
 if(kind==='damage'){const hit=5+Math.floor(Math.random()*11),before=S.health;hurt(hit);return {kind,emoji:'🩸',title:'Осторожно, стекло!',text:`Порезался о разбитую бутылку. Здоровье: −${Math.round(before-S.health)}. Добычи нет.`};}
 const it=trashFind(kind);fleaInv().push(it);track('trashItem');if(kind==='legend')track('trashLegend');
 // Existing pet, market and seasonal extras are only eligible on successful finds.
 if(typeof onTrashExtra==='function')onTrashExtra();
 return {kind,emoji:it.e,title:it.name,item:it,text:'Находка добавлена на барахолку. Можно оставить, осмотреть или продать.'};
}
function trashOddsHTML(){return '<div class="info-card trash470-odds"><b>Шансы каждой попытки</b><p>Пусто — 30% · урон — 20% · обычная находка — 40% · редкая — 9% · эпическая — 0,9% · легендарная — 0,1%.</p><p>Все вещи обычных кейсов, включая самые дорогие легенды. Уровень, город и VIP не меняют шансы. Кейсные вещи хранятся на барахолке; у каждой случайное качество. Эксклюзивы за Stars остаются в донатных кейсах.</p></div>';}
ACTIONS.trashOdds=()=>openModal('<h3>🗑️ Что можно найти</h3>'+trashOddsHTML()+'<button class="btn primary wide" data-act="close">Понятно</button>',{center:true});
openTrash=function(){
 if(S.busy||MG||MG_PENDING){toast('Валера занят','bad');return;}
 if(TRASH_RUN)return;
 const left=cdLeft('trash');if(left>0){openModal(`<h3>Мусорка отдыхает</h3><p>${fmtTime(left)}</p>`+trashOddsHTML()+'<button class="btn primary wide" data-act="close">Понятно</button>',{center:true});haptic('error');return;}
 const run={kind:trashOutcome()};TRASH_RUN=run;
 setCd('trash',TRASH_COOLDOWN*trashCdMult());taskProgress('trash');addXp(XP.trash);run.result=trashGrant(run.kind);save();
 openModal('<h3>Мусорка</h3><p>Здесь может оказаться легенда, опасность или совсем ничего.</p><div class="trash-stage shake" id="trashStage">'+trashCanSVG()+'</div>',{center:true,locked:true});sfx('trash');haptic('medium');
 setTimeout(()=>{if(TRASH_RUN!==run)return;const st=$('trashStage');if(st){st.classList.remove('shake');st.classList.add('open');}setTimeout(()=>{if(TRASH_RUN===run)revealLoot();},450);},1300);
};
revealLoot=function(){
 const run=TRASH_RUN;if(!run)return;TRASH_RUN=null;const r=run.result,bad=r.kind==='damage',it=r.item,rar=RARITY.find(x=>x.id===(it?.rar||r.kind));
 // Closing/navigating away cannot duplicate or discard an already granted result.
 if(!$('trashStage'))return;
 const text=r.text+(it?`<br><b>${qualityName(it)} · ${incomeMoney(fleaPrice(it))}</b><br><button class="btn primary wide" data-act="flea">Открыть барахолку</button>`:'')+'<br><button class="btn wide" data-act="trashOdds">Шансы и условия</button>';
 resultModal({emoji:r.emoji,title:r.title,text,badge:rar?`<span class="rarity ${r.kind}">${esc(rar.name)}</span>`:'',rays:it?r.kind:'',btn:'Понятно'});
 haptic(bad?'error':'success');sfx(bad?'lootBad':'loot');if(['epic','legend'].includes(r.kind))confetti(60);
};
