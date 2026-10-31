// One roll and one grant per search. Animation never owns the reward transaction.
const TRASH_ODDS=[{id:'empty',chance:.30},{id:'damage',chance:.20},{id:'budget',chance:.476},{id:'valuable',chance:.014},{id:'premium',chance:.01}];
let TRASH_RUN=null;
function trashOdds516(){const odds=TRASH_ODDS.map(x=>({...x}));for(const id of ['valuable','premium'])if(!trashPool80(id).length){const band=odds.find(x=>x.id===id);odds.find(x=>x.id==='budget').chance+=band.chance;band.chance=0;}return odds;}
function trashOutcome(roll=Math.random()){let n=roll;for(const o of trashOdds516())if((n-=o.chance)<-1e-12)return o.id;return 'budget';}
function trashFindPool(rarity){return CASES.flatMap(c=>(rarity==='common'?['common','uncommon']:[rarity]).flatMap(r=>(c.loot[r]||[]).map(row=>({c,row,rarity:r}))));}
const TRASH_BANDS80={budget:{min:10,max:500000},valuable:{min:500010,max:1000000},premium:{min:1000010,max:Infinity}};
let trashPools80=null;
// Reference income excludes paid, temporary and prestige multipliers. The first
// city job is the fallback before employment opens; ownership is never changed.
function trashBudget516(){const jobs=JOBS.filter(j=>reqOk(j.req)),base=Math.max(...(jobs.length?jobs:JOBS.filter(j=>j.id==='dvornik')).map(j=>j.pay));return Math.max(250,Math.floor(base*10));}
function trashPool80(kind){
 if(!trashPools80){trashPools80=Object.fromEntries(Object.keys(TRASH_BANDS80).map(k=>[k,[]]));
  for(const [rarity,weight] of [['common',.4],['rare',.09],['epic',.009],['legend',.001]]){const rows=trashFindPool(rarity);
   for(const row of rows)for(const q of QUALITY){const rar=RARITY.find(r=>r.id===row.rarity),base=caseItemBase(row.c,rar,row.row[2])*q.mult,step=base*.96>=1000?10:1;
    for(const [band,limits] of Object.entries(TRASH_BANDS80)){const lo=Math.ceil(Math.max(limits.min,base*.96)/step)*step,hi=Math.floor(Math.min(limits.max,base*1.04)/step)*step;if(lo<=hi)trashPools80[band].push({...row,q,lo,hi,step,weight:weight/rows.length*q.chance});}
   }
  }
 }
 const budget=trashBudget516(),cap=Math.min(TRASH_BANDS80[kind]?.max||Infinity,budget*({budget:1,valuable:2,premium:3}[kind]||1));
 return (trashPools80[kind]||[]).filter(x=>x.lo<=cap).map(x=>({...x,hi:Math.min(x.hi,Math.floor(cap/x.step)*x.step)})).filter(x=>x.lo<=x.hi);
}
function trashFind(kind){
 const pool=trashPool80(kind);if(!pool.length)throw Error('Empty trash price band: '+kind);
 let roll=Math.random()*pool.reduce((n,x)=>n+x.weight,0),found=pool.at(-1);for(const x of pool)if((roll-=x.weight)<0){found=x;break;}
 const {c,row:[e,name],rarity:actual,q,lo,hi,step}=found,value=lo+Math.min(Math.floor((hi-lo)/step),Math.floor(Math.random()*((hi-lo)/step+1)))*step;
 const [a,b]=WEAR[q.id]||WEAR.mw;
 return {key:`${c.id}:${name}:${q.id}`,e,name,rar:actual,q:q.id,value,from:c.id,found:'trash',fl:Math.round(rand(a,b)*10000)/10000,pat:Math.floor(Math.random()*1000)};
}
function trashGrant(kind){
 if(kind==='empty')return {kind,emoji:'🗑️',title:'Сегодня пусто',text:'Ничего ценного не нашлось. Иногда мусорка — просто мусорка.'};
 if(kind==='damage'){const hit=5+Math.floor(Math.random()*11),before=S.health;hurt(hit);return {kind,emoji:'🩸',title:'Осторожно, стекло!',text:`Порезался о разбитую бутылку. Здоровье: −${Math.round(before-S.health)}. Добычи нет.`};}
 const it=trashFind(kind);fleaInv().push(it);track('trashItem');if(it.rar==='legend')track('trashLegend');
 // Existing pet, market and seasonal extras are only eligible on successful finds.
 if(typeof onTrashExtra==='function')onTrashExtra();
 return {kind,emoji:it.e,title:it.name,item:it,text:'Находка добавлена на барахолку. Можно оставить, осмотреть или продать.'};
}
function trashOddsHTML(){const odds=trashOdds516(),percent=id=>(100*odds.find(x=>x.id===id).chance).toLocaleString('ru-RU',{maximumFractionDigits:2});return `<div class="info-card trash470-odds"><b>Шансы каждой попытки</b><p>Пусто — 30% · урон — 20% · обычная находка — ${percent('budget')}% · от 500 000 до 1 000 000 ₽ — ${percent('valuable')}% · дороже 1 000 000 ₽ — ${percent('premium')}%.</p><p>Стоимость новых находок зависит от доступных работ: обычная — не выше 10 базовых смен, дорогие — до 20 и 30. Сейчас предел обычной находки: ${incomeMoney(Math.min(500000,trashBudget516()))}. Бонусы VIP, Premium и престижа этот бюджет не увеличивают. Если дорогая категория пока недоступна, её шанс переходит обычным находкам. Уже найденные вещи сохраняют свою цену. Эксклюзивы за Stars остаются в донатных кейсах.</p></div>`;}
ACTIONS.trashOdds=()=>openModal('<h3>🗑️ Что можно найти</h3>'+trashOddsHTML()+'<button class="btn primary wide" data-act="close">Понятно</button>',{center:true});
openTrash=function(){
 if(S.busy||MG||MG_PENDING){toast('Валера занят','bad');return;}
 if(TRASH_RUN)return;
 const left=cdLeft('trash');if(left>0){openModal(`<h3>Мусорка отдыхает</h3><p>${fmtTime(left)}</p>`+trashResetHTML80()+trashOddsHTML()+'<button class="btn primary wide" data-act="close">Понятно</button>',{center:true});trashAdState80();haptic('error');return;}
 const run={kind:trashOutcome()};TRASH_RUN=run;
 setCd('trash',TRASH_COOLDOWN*trashCdMult());taskProgress('trash');addXp(XP.trash);run.result=trashGrant(run.kind);save();
 openModal('<h3>Мусорка</h3><p>Здесь может оказаться легенда, опасность или совсем ничего.</p><div class="trash-stage shake" id="trashStage">'+trashCanSVG()+'</div>',{center:true,locked:true});sfx('trash');haptic('medium');
 setTimeout(()=>{if(TRASH_RUN!==run)return;const st=$('trashStage');if(st){st.classList.remove('shake');st.classList.add('open');}setTimeout(()=>{if(TRASH_RUN===run)revealLoot();},450);},1300);
};
revealLoot=function(){
 const run=TRASH_RUN;if(!run)return;TRASH_RUN=null;const r=run.result,bad=r.kind==='damage',it=r.item,tier=it?.rar||r.kind,rar=RARITY.find(x=>x.id===tier);
 // Closing/navigating away cannot duplicate or discard an already granted result.
 if(!$('trashStage'))return;
 const text=r.text+(it?`<br><b>${qualityName(it)} · ${incomeMoney(fleaPrice(it))}</b><br><button class="btn primary wide" data-act="flea">Открыть барахолку</button>`:'')+'<br><button class="btn wide" data-act="trashOdds">Шансы и условия</button>'+trashResetHTML80();
 resultModal({emoji:r.emoji,title:r.title,text,badge:rar?`<span class="rarity ${tier}">${esc(rar.name)}</span>`:'',rays:it?tier:'',btn:'Понятно'});trashAdState80();
 haptic(bad?'error':'success');sfx(bad?'lootBad':'loot');if(['epic','legend'].includes(tier))confetti(60);
};
function trashResetHTML80(){return cdLeft('trash')>0?`<section class="trash-reset80"><button class="btn primary wide" data-act="trashAd80" ${adChoice77('trash')?'disabled':''}>🎬 Сбросить таймер за рекламу</button><small>Сбрасывается только текущее ожидание. До 5 сбросов в сутки; между наградами 30 секунд, общий предел 25 в сутки.</small>${adStatus81('trash')}</section>`:'';}
function trashAdState80(){adsState().then(()=>{const b=document.querySelector('[data-act="trashAd80"]');if(b)b.disabled=adChoice77('trash')||cdLeft('trash')<=0;});}
ACTIONS.trashAd80=async()=>{if(cdLeft('trash')<=0||TRASH_RUN)return;if(!await persistForAds78()){toast('Сначала сохраним таймер на сервере. Попробуй через несколько секунд.');return;}rewardedWatch('trash');};
