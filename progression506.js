// Story/level access can be opened for cash. The fee never buys the asset or advances a quest.
function storyAssetItem521(kind,id){
 if(kind==='biz')return BUSINESSES.find(x=>x.id===id);
 if(!['home','car'].includes(kind)||!Number.isSafeInteger(Number(id))||Number(id)<1)return null;
 return (kind==='home'?HOUSING:TRANSPORT)[Number(id)]||null;
}
function storyAssetPaid521(kind,id){
 const state=S.assetAccess521;
 return !!storyAssetItem521(kind,id)&&state?.cycle===(S.prestige||0)&&state.cities?.[city()]?.[kind]?.includes(String(id))===true;
}
function storyAssetLevelAllowed506(kind,id){const item=storyAssetItem521(kind,id);return !!item&&(level()>=(item.level||1)||storyAssetPaid521(kind,id));}
function storyAssetLocked521(kind,id){return !!storyAssetItem521(kind,id)&&!storyAssetOwned506(kind,id)&&(!storyAssetAllowed506(kind,id)||!storyAssetLevelAllowed506(kind,id));}
function storyAccessCost521(kind,id){const price=storyAssetItem521(kind,id)?.price;return Number.isSafeInteger(price)&&price>0&&Number.isSafeInteger(price*2)?price*2:0;}
function storyAccessPrerequisite521(kind,id){return kind==='biz'||storyPurchaseBefore506(kind,Number(id));}
function storyAccessKey521(kind,id){return city()+':'+kind+':'+id;}
function storyAccessTarget521(raw){
 const parts=String(raw||'').split(':');if(parts.length!==3||parts[0]!==city())return null;
 const kind=parts[1],id=kind==='biz'?parts[2]:Number(parts[2]);
 return storyAssetItem521(kind,id)?{kind,id,key:storyAccessKey521(kind,id)}:null;
}
function storyAssetButtons521(kind,id){
 const item=storyAssetItem521(kind,id),cost=storyAccessCost521(kind,id),chapter=storyAssetChapter506(kind,id),storyDone=(Number(S.quest?.idx)||0)>=chapter;
 const prerequisite=storyAccessPrerequisite521(kind,id),enough=Number.isFinite(S.money)&&S.money>=cost,can=cost>0&&prerequisite&&enough;
 const why=!prerequisite?storyWhyBefore506(kind,Number(id)):!enough?'Не хватает '+cityMoney(cost-S.money):'';
 return `<div class="story-access521" data-access-kind521="${kind}" data-access-id521="${esc(id)}"><button class="btn wide story-chapter521" data-act="storyAccessChapter521" data-id="${esc(storyAccessKey521(kind,id))}">📖 ${chapter>0?(storyDone?'Глава '+chapter+' пройдена':'Пройди главу '+chapter+' сюжета города'):'Сюжетное ограничение снято'}</button><button class="btn wide primary" data-act="storyAccessBuy521" data-id="${esc(storyAccessKey521(kind,id))}" data-currency="money" ${can?'':'disabled'} ${why?'data-why="'+esc(why)+'"':''}>🔓 Открыть доступ · ${currencyMoney511(cost)}</button><small>Сюжет и уровень можно заменить оплатой. Покупка оплачивается отдельно.</small>${!prerequisite?'<small>'+esc(why)+'</small>':''}${!storyAssetLevelAllowed506(kind,id)?'<small>Нужен уровень '+item.level+' или платный доступ.</small>':''}</div>`;
}
let STORY_ACCESS521=null;
ACTIONS.storyAccessChapter521=raw=>{if(storyAccessTarget521(raw))showScreen('tasks','story');};
ACTIONS.storyAccessCancel521=()=>{STORY_ACCESS521=null;closeModal();};
ACTIONS.storyAccessBuy521=raw=>{
 const target=storyAccessTarget521(raw);STORY_ACCESS521=null;
 if(!target||!storyAssetLocked521(target.kind,target.id)||!storyAccessPrerequisite521(target.kind,target.id))return;
 const cost=storyAccessCost521(target.kind,target.id),item=storyAssetItem521(target.kind,target.id);
 if(!cost||!Number.isFinite(S.money)||S.money<cost){toast('Не хватает денег на открытие доступа.','bad');return;}
 STORY_ACCESS521={...target,city:city(),cycle:S.prestige||0,cost};
 openModal(`<section class="story-access-confirm521" data-access-key521="${esc(target.key)}"><h3>Открыть доступ к покупке?</h3><p><b>${esc(item.name)}</b></p><p>Открытие: <b>${currencyMoney511(cost)}</b> — две цены покупки.</p><p>Снимаются требования главы сюжета и уровня героя только для этой покупки. Сам предмет пока не выдаётся.</p><p>После открытия покупка стоит ещё <b>${currencyMoney511(item.price)}</b>. Всего: <b>${currencyMoney511(cost+item.price)}</b>.</p><p>Доступ сохраняется в этом городе до следующего престижа. Порядок покупки жилья и транспорта сохраняется.</p><button class="btn primary wide" data-currency="money" data-act="storyAccessConfirm521">Заплатить за доступ · ${currencyMoney511(cost)}</button><button class="btn wide" data-act="storyAccessCancel521">Отмена</button></section>`,{center:true});
};
ACTIONS.storyAccessConfirm521=()=>{
 const offer=STORY_ACCESS521;STORY_ACCESS521=null;
 if(!offer||offer.city!==city()||offer.cycle!==(S.prestige||0)||document.querySelector('.story-access-confirm521')?.dataset.accessKey521!==offer.key)return;
 const {kind,id,cost}=offer;
 if(cost!==storyAccessCost521(kind,id)||!cost||!storyAssetLocked521(kind,id)||!storyAccessPrerequisite521(kind,id)||!Number.isFinite(S.money)||S.money<cost)return;
 if(S.assetAccess521?.cycle!==(S.prestige||0))S.assetAccess521={cycle:S.prestige||0,cities:{}};
 S.assetAccess521.cities||={};const cityAccess=S.assetAccess521.cities[city()]||={};
 if(!Array.isArray(cityAccess[kind]))cityAccess[kind]=[];
 S.money-=cost;cityAccess[kind].push(String(id));
 closeModal();save(true);refresh();sfx('buy');toast('Доступ открыт. Теперь можно купить предмет отдельно.','good');
};
function storyAssetChapter506(kind,id){
 const table=kind==='home'?HOUSING:kind==='car'?TRANSPORT:BUSINESSES,i=kind==='biz'?table.findIndex(x=>x.id===id):Number(id);
 if(i<0||i>=table.length)return Infinity;
 const total=questList().filter(q=>!q.move&&!q.frMove&&!q.worldMove50).length;
 const schedule=kind==='home'?[0,0,3,7,12,18,23]:kind==='car'?[0,0,2,4,6,8,10,12,15,18,21,24]:[0,4,8,12,17,22];
 let need=Math.floor((schedule[i]??24)*total/25);
 questList().forEach((q,index)=>{for(const g of q.goals||[]){const src=String(g.cur),count=Number(g.need)||1;
  if(kind==='home'&&/S\.(?:ownedHousing|housing)\b/.test(src)){const target=Number(src.match(/>=\s*(\d+)/)?.[1]||count);if(i<=target)need=Math.min(need,index);}
  if(kind==='car'&&/S\.transport\b/.test(src)&&i<=count)need=Math.min(need,index);
  if(kind==='biz'&&(/Object\.keys\(S\.biz\)/.test(src)&&i<count||i===0&&['bizBuy','bizCollect','businessCollect'].includes(g.key)))need=Math.min(need,index);
 }});return Math.max(0,need);
}
function storyAssetOwned506(kind,id){return kind==='home'?Number(id)<=Math.max(S.ownedHousing||0,purchaseProgress72().home):kind==='car'?ownsTransport(Number(id))||Number(id)<=purchaseProgress72().car:!!S.biz?.[id];}
function storyAssetAllowed506(kind,id){return storyAssetOwned506(kind,id)||storyAssetPaid521(kind,id)||(Number(S.quest?.idx)||0)>=storyAssetChapter506(kind,id);}
function storyAssetWhy506(kind,id){return 'Пройди главу '+storyAssetChapter506(kind,id)+' сюжета города';}
const storyPurchaseBefore506=purchaseAllowed72;
purchaseAllowed72=(kind,i)=>storyPurchaseBefore506(kind,i)&&storyAssetAllowed506(kind,i);
const storyWhyBefore506=purchaseWhy72;
purchaseWhy72=(kind,i)=>!storyAssetAllowed506(kind,i)?storyAssetWhy506(kind,i):storyWhyBefore506(kind,i);
const storyPriceBefore506=priceBtn;
priceBtn=function(act,id,...rest){const kind=act==='house'||act==='rentHouse'?'home':act==='buyTransport'?'car':null;if(kind&&storyAssetLocked521(kind,+id))return act==='rentHouse'?'':storyAssetButtons521(kind,+id);return storyPriceBefore506(act,id,...rest);};
const storyBuyBefore506=ACTIONS.bizBuy;
ACTIONS.bizBuy=id=>{if(!storyAssetAllowed506('biz',id)){toast(storyAssetWhy506('biz',id));return;}return storyBuyBefore506(id);};
const storyBusinessBefore506=businessCard;
businessCard=function(b){let html=storyBusinessBefore506(b);if(!storyAssetLocked521('biz',b.id))return html;const t=document.createElement('template');t.innerHTML=html;const card=t.content.querySelector('.business-card');card.classList.remove('available');card.classList.add('locked');const buy=t.content.querySelector('[data-act="bizBuy"]'),buttons=storyAssetButtons521('biz',b.id);if(buy)buy.outerHTML=buttons;else t.content.querySelector('.business-more').insertAdjacentHTML('beforebegin',buttons);return t.innerHTML;};
for(const tab of ['housing','transport']){const before=EXTRA_TABS.shop[tab];EXTRA_TABS.shop[tab]=()=>'<div class="info-card"><b>Доступ по сюжету или за деньги</b><p>Пройди нужную главу и достигни уровня героя либо открой доступ за две цены предмета. Сам предмет оплачивается отдельно. Ранее купленные вещи остаются доступны.</p><button class="btn" data-screen="tasks" data-tab="story">Открыть сюжет города</button></div>'+before();}
const storyDashboardBefore506=businessDashboard;
businessDashboard=function(){return '<div class="info-card"><b>Доступ по сюжету или за деньги</b><p>Пройди нужную главу и достигни уровня героя либо открой доступ за две цены предмета. Сам предмет оплачивается отдельно. Свой бизнес можно улучшать и собирать его доход как обычно.</p><button class="btn" data-screen="tasks" data-tab="story">Открыть сюжет города</button></div>'+storyDashboardBefore506();};
EXTRA_TABS.life.business=businessDashboard;

// Expanded French saves used a captured list that omitted the new exit.
const storyListBefore506=questList;
questList=function(){story30Migrate();const list=storyListBefore506();if(city()==='fr'&&!list.some(q=>q.worldMove50==='it'))return [...list,QUESTS.find(q=>q.id==='world50_to_it')];return list;};
const worldCanBefore506=worldCanMove50;
worldCanMove50=function(target,paid=false){if(target==='it'&&city()==='fr'&&!paid&&Number(S.quest?.idx)>=30&&!S.busy&&!MG&&!MG_PENDING&&!FIGHT&&!CUT&&!ARREST&&!S.arrest75&&!S.crashBet&&!S.bjInRound)return true;return worldCanBefore506(target,paid);};
function storyTravelPanel506(){const next=city()==='fr'?'it':city()==='it'?'cn':null;if(!next)return '';const ready=worldCanMove50(next),total=city()==='fr'?30:25,done=Math.min(total,Number(S.quest?.idx)||0);return `<section class="info-card story-travel506"><b>${WORLD50[next].flag} Следующая история: ${WORLD50[next].name}</b><p>${ready?'Письмо получено. Можно переехать без покупки билета.':'Заверши историю города: '+done+' / '+total+' глав. Переезд по сюжету бесплатный.'}</p>${ready?`<button class="btn primary wide" data-act="worldMoveStart50" data-id="${next}">Продолжить путь: ${WORLD50[next].name}</button>`:''}</section>`;}
const storyTabBefore506=EXTRA_TABS.tasks.story;
EXTRA_TABS.tasks.story=()=>{let html=storyTabBefore506();const panel=storyTravelPanel506(),ready=worldCanMove50(city()==='fr'?'it':'cn');if(ready){const t=document.createElement('template');t.innerHTML=html;t.content.querySelectorAll('[data-act="worldMoveStart50"]').forEach(b=>b.remove());const p=t.content.querySelector('.story30-progress');if(p)p.textContent='🇫🇷 История Франции завершена · 30 / 30';html=t.innerHTML;}return ready?panel+html:html+panel;};
const storyTownBefore506=EXTRA_TABS.fun.world50;
EXTRA_TABS.fun.world50=()=>storyTravelPanel506()+storyTownBefore506();

// A seasonal Stars bundle must expose its actual purchase route in the collection.
const lanternPriceBefore506=bottlePrice;
bottlePrice=b=>b.id==='bt_hw_lantern'?'Набор за 49 Stars':lanternPriceBefore506(b);
const lanternInfoBefore506=ACTIONS.bottleInfo;
ACTIONS.bottleInfo=arg=>{lanternInfoBefore506(arg);if(String(arg).split(':')[1]!=='bt_hw_lantern'||bottleOwned(bottleById('bt_hw_lantern')))return;const el=document.querySelector('.bottle-detail');if(!el)return;el.querySelector('.test-note')?.remove();el.querySelector('[data-act="bottleBack"]').insertAdjacentHTML('beforebegin',`<p>Входит в сезонный набор «Фонарь Валеры»: анимированная бутылка навсегда и 15 крышек. Получение — после успешной оплаты Stars.</p>${halloweenActive()?'<button class="btn primary wide" data-act="prem" data-id="hw_lantern">⭐ 49 · Купить набор</button>':'<p>Продажа завершена до следующего Хэллоуина. Купленную бутылку можно носить круглый год.</p>'}`);};
