// Base mission rewards are always paid first. The optional ad adds one copy of
// numeric rewards; unique pets, cosmetics and story choices are never duplicated.
function missionOffers78(){return S.adMissions78||=( {} );}
let latestMission78='';
function rememberMission78(key,offer){missionOffers78()[key]={...offer,created:Date.now(),claimed:false};latestMission78=key;const keys=Object.keys(missionOffers78());for(const id of keys.slice(0,Math.max(0,keys.length-160)))delete S.adMissions78[id];save(true);}
function missionOfferButton78(key){const o=missionOffers78()[key];return `<button class="btn primary wide" data-act="missionAd78" data-id="${esc(key)}" ${o.claimed||adChoice77('mission')?'disabled':''}>${o.claimed?'✓ Дополнительная награда получена':'🎬 Удвоить награду за рекламу'}</button>`;}
function missionPanel78(kind){const list=Object.entries(missionOffers78()).filter(([key,o])=>!o.claimed&&(!kind||o.kind===kind)&&Date.now()-o.created<24*3600000).reverse();if(!list.length)return '';return `<section class="mission-bonuses78"><b>🎬 Дополнительная награда за выполненные миссии</b><p>Обычная награда уже твоя. За подтверждённую рекламу получишь ещё столько же денег, опыта и крышек; в сезонной истории — конфет. Уникальные предметы не повторяются.</p>${list.map(([key,o],i)=>`${i===3?'<details><summary>Остальные награды</summary>':''}<div class="mission-bonus78"><b>${esc(o.label||o.id)}</b>${missionOfferButton78(key)}</div>`).join('')}${list.length>3?'</details>':''}<small>Миссии: до 10 рекламных удвоений в сутки, один раз за каждую выполненную миссию. Общий предел — 25 наград в сутки, пауза 30 секунд. Дополнительная награда доступна 24 часа.</small>${adStatus81('mission')}</section>`;}
HOOKS.track.push(key=>{if(key!=='questDone')return;const q=questList()[S.quest.idx-1],r=q?.reward;if(!q||!r||!['money','caps','xp'].some(k=>r[k]>0))return;rememberMission78(`story:${S.prestige||0}:${city()}:${q.id}`,{kind:'story',id:q.id,label:q.title,city:city()});});
const dailyBuildBefore78=buildDailyTasks;buildDailyTasks=function(){const out=dailyBuildBefore78();for(const t of TASKS)t.adLevel78=level();return out;};
HOOKS.load.push(()=>{for(const t of TASKS)t.adLevel78=level();});
const taskBefore78=ACTIONS.task;ACTIONS.task=(id,button)=>{const t=TASKS.find(t=>t.id===id),had=!!S.tasks.claimed[id],lv=t?.adLevel78||level(),housing=S.housing;taskBefore78(id,button);if(t&&!had&&S.tasks.claimed[id])rememberMission78(`daily:${S.tasks.day}:${id}`,{kind:'daily',id,label:t.name,level:lv,housing});};
const halloweenClaimBefore78=ACTIONS.halloweenClaim;ACTIONS.halloweenClaim=()=>{const q=halloweenQuestCurrent(),year=halloweenActive()?new Date(halloweenActive().holiday).getFullYear():0,had=q&&halloweenState()?.claimed[q[0]];halloweenClaimBefore78();if(q&&!had&&halloweenState()?.claimed[q[0]]){rememberMission78(`halloween:${year}:${q[0]}`,{kind:'halloween',id:q[0],label:q[1]});renderCurrent(false);}};
const resultBefore78=resultModal;resultModal=function(options){const out=resultBefore78(options);if(latestMission78&&String(options.title||'').startsWith('Глава пройдена:')){const key=latestMission78;latestMission78='';document.querySelector('#modalRoot .modal-content,#modalRoot .sheet-body,#modalRoot .sheet')?.insertAdjacentHTML('beforeend',`<div class="mission-bonus78"><p>Обычная награда уже получена. Можно добавить ещё одну за добровольный просмотр.</p>${missionOfferButton78(key)}</div>`);}return out;};
for(const [tab,kind] of [['story','story'],['tasks','daily']]){const orig=EXTRA_TABS.tasks[tab];EXTRA_TABS.tasks[tab]=()=>missionPanel78(kind)+orig();}
const seasonBefore78=EXTRA_TABS.shop.season;EXTRA_TABS.shop.season=()=>missionPanel78('halloween')+seasonBefore78();
async function persistForAds78(){
 if(!onlineOn()||!serverReady||SAVE_LOCK)return false;save(true);
 for(let i=0;i<5;i++){await serverWrite();if(!srvBusy&&serverBase>=(S.rev||0)&&!SAVE_LOCK)return true;await wait(300);}return false;
}
ACTIONS.missionAd78=async key=>{const offer=missionOffers78()[key];if(!offer||offer.claimed)return;if(!await persistForAds78()){toast('Сначала сохраним миссию на сервере. Попробуй через несколько секунд.');return;}rewardedWatch('mission',key);};
ACTIONS.businessAd78=async()=>{if(businessBoost78()||!businessOwnedCount())return;if(!await persistForAds78()){toast('Сначала сохраним бизнесы на сервере. Попробуй через несколько секунд.');return;}rewardedWatch('business');};
function applyAdBenefit78(r){
 if(r.purpose==='trash'){if(Number(r.payload?.trashUntil)===Number(S.cd.trash)){S.cd.trash=0;if(document.querySelector('[data-act="trashAd80"]'))closeModal();}return true;}
 if(r.purpose==='business'){
  const now=businessNow();if(now===null||r.until_at<=now)return false;
  businessTick();managedTick(now,true);S.businessBoostUntil78=Math.max(S.businessBoostUntil78||0,r.until_at);
  for(const b of BUSINESSES)if(S.biz[b.id])S.biz[b.id].rates=businessSnapshot(b,S.biz[b.id]);for(const e of managedBusinesses())e.rates=managedSnapshot(e);return true;
 }
 if(r.purpose!=='mission')return false;const p=r.payload||{};
 if(p.money)addMoney(p.money);if(p.caps)addCaps(p.caps);if(p.xp)addXp(p.xp);if(p.candy){S.seasonCur||={};S.seasonCur.halloween=(S.seasonCur.halloween||0)+p.candy;}
 if(missionOffers78()[r.skill])missionOffers78()[r.skill].claimed=true;return true;
}
const screenBeforeMissions78=showScreen;showScreen=function(name,tab){screenBeforeMissions78(name,tab);if(name==='tasks'||name==='shop'&&(tab||TABS.shop)==='season')adsState().then(()=>{if(currentScreen===name)renderCurrent(false);});};
