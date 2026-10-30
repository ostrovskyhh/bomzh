// Future income only. Previously earned cash and managed reserves are preserved.
const BIZ_BALANCE78=.7,BIZ_BREAK_MS78=3*3600000;
const businessBase78=businessRates,managedBase78=managedSnapshot;
function businessBoost78(now=businessNow()){return now!==null&&Number(S.businessBoostUntil78)>now;}
function foreignMembership78(now=businessNow()){return now!==null&&Math.max(Number(S.vipUntil)||0,Number(S.premiumUntil75)||0)>now;}
function businessFactor78(st,now=businessNow()){return BIZ_BALANCE78*(st.broken?.5:1)*(businessBoost78(now)?2:1);}
businessRates=function(b,st={lvl:1},vip=isVip()){
 const r=businessBase78(b,st,vip),factor=businessFactor78(st);
 return {...r,operating:r.operating*factor,tax:r.operating*factor*businessTaxRate(),net:r.operating*factor*(1-businessTaxRate()),balance78:.7,condition78:st.broken?.5:1,boost78:businessBoost78()?2:1};
};
businessSnapshot=(b,st)=>({plain:businessBase78(b,st,false).operating*.7,vip:businessBase78(b,st,true).operating*.7,vipUntil:Math.max(S.vipUntil||0,S.premiumUntil75||0),premiumUntil:S.premiumUntil75||0,boostUntil:S.businessBoostUntil78||0,rule78:true});
managedSnapshot=e=>{const r=managedBase78(e);return {...r,plain:r.plain*.7,vip:r.vip*.7,premiumUntil:S.premiumUntil75||0,boostUntil:S.businessBoostUntil78||0,rule78:true};};
bizCap=(b,st)=>businessBase78(b,st,isVip()).operating*.7*BIZ_CAP_HOURS*(isVip()?2:1);
function prepareDamage78(st,now){if(!st.mechanics78){st.mechanics78=1;st.nextBreak78=st.broken?0:now+BIZ_BREAK_MS78;}if(!st.broken&&!Number.isFinite(st.nextBreak78))st.nextBreak78=now+BIZ_BREAK_MS78;}
function enterpriseAccrual78(st,r,from,to,credit){
 if(to<=from)return 0;prepareDamage78(st,from);let earned=0;
 // Premium repairs immediately; skip harmless recurring repairs in one step.
 if(st.broken&&(r.premiumUntil||0)>from){st.broken=false;st.nextBreak78=from+BIZ_BREAK_MS78;st.autoRepairs78=(st.autoRepairs78||0)+1;}
 const autoThrough=Math.min(to,(r.premiumUntil||0)-.001);
 if(!st.broken&&st.nextBreak78>0&&st.nextBreak78<=autoThrough){const n=Math.floor((autoThrough-st.nextBreak78)/BIZ_BREAK_MS78)+1;st.nextBreak78+=n*BIZ_BREAK_MS78;st.autoRepairs78=(st.autoRepairs78||0)+n;}
 let at=from;
 while(at<to){
  if(!st.broken&&st.nextBreak78>0&&st.nextBreak78<=at){st.broken=true;st.nextBreak78=0;}
  const until=Math.min(to,...[r.vipUntil,r.boostUntil,st.broken?0:st.nextBreak78].filter(t=>Number.isFinite(t)&&t>at));
  const vip=(r.vipUntil||0)>at,base=vip?r.vip:r.plain,rate=Math.max(0,base)*(st.broken?.5:1)*((r.boostUntil||0)>at?2:1),amount=rate*(until-at)/3600000;
  earned+=amount;if(credit)credit(amount,Math.max(0,base)*BIZ_CAP_HOURS*(vip?2:1));at=until;
 }
 if(!st.broken&&st.nextBreak78>0&&st.nextBreak78<=to){st.broken=true;st.nextBreak78=0;}
 return earned;
}
function settleLegacyBusiness78(st,now){const r=st.rates,from=st.last;
 if(r&&now>=from){const split=Math.min(now,Math.max(from,r.vipUntil||0));for(const [a,b,vip] of [[from,split,true],[split,now,false]]){const rate=Math.max(0,vip?r.vip:r.plain),cap=rate*BIZ_CAP_HOURS*(vip?2:1);st.cash=Math.max(st.cash,Math.min(cap,st.cash+rate*Math.max(0,b-a)/3600000));}}
}
businessTick=function(now=businessNow()){
 if(now===null)return;S.biz||={};if(!S.clubStaff||!S.biz.club)S.clubStaff={};
 for(const b of BUSINESSES){const st=S.biz[b.id];if(!st)continue;businessPrepare(b,st,now);
  if(!st.mechanics78){settleLegacyBusiness78(st,now);st.last=now;prepareDamage78(st,now);st.rates=businessSnapshot(b,st);}
  if(st.last>now+60000)st.last=now;if(now<st.last)continue;
  enterpriseAccrual78(st,st.rates,st.last,now,(amount,cap)=>{st.cash=Math.max(st.cash,Math.min(cap,st.cash+amount));});
  st.last=now;
  if(isPremium75()&&st.broken){st.broken=false;st.nextBreak78=now+BIZ_BREAK_MS78;st.autoRepairs78=(st.autoRepairs78||0)+1;}
  st.rates=businessSnapshot(b,st);
 }
};
function prepareManaged78(e,now){
 managedPrepare69(e,now);
 if(!e.mechanics78){const extra=e.rates&&Number.isFinite(e.last)&&e.last<now?managedAccrual(e.rates,e.last,now):0;e.reserve=Math.max(0,e.reserve||0)+Math.max(0,(e.pending||0)+extra)*.4+Math.max(0,e.opening||0);e.pending=0;e.opening=0;e.last=now;e.next=managedBoundary(now)+MANAGED_PERIOD;prepareDamage78(e,now);e.rates=managedSnapshot(e);}
}
managedTick=function(now=businessNow(),force=false){
 if(now===null||!Number.isFinite(now)||(!force&&now-MANAGED_CHECK_AT<1000))return;MANAGED_CHECK_AT=now;const entries=managedBusinesses(),receipts=[];
 for(const e of entries)if(Number.isFinite(e.base)&&Number.isFinite(e.wages))prepareManaged78(e,now);
 const valid=entries.filter(e=>Number.isFinite(e.last)&&Number.isFinite(e.next)&&now>=e.last&&e.rates);let next=Math.min(...valid.map(e=>e.next));const taxRate=businessTaxRate(),membership=foreignMembership78(now);
 while(next<=now){const due=valid.filter(e=>e.next<=next);
  const rows=due.map(e=>{e.pending=(e.pending||0)+enterpriseAccrual78(e,e.rates,e.last,next);e.last=next;const profit=e.pending,fee=profit*.6,taxable=Math.max(0,(e.reserve||0)+profit-fee+(e.opening||0)),legacy=Math.max(0,e.legacyCredit||0),eligible=membership&&(e.rates.vipUntil||0)>=next;return {e,profit,fee,taxable,legacy,eligible,net:taxable*(1-taxRate)+legacy};});
  const total=rows.reduce((n,r)=>n+(r.eligible?r.net:0),0),factor=total>0?Math.min(1,300000/total):0;
  for(const r of rows){const e=r.e,payment=r.eligible?Math.floor(r.net*factor+1e-8):0,fraction=r.net>0?payment/r.net:0;e.reserve=r.taxable*(1-fraction);e.legacyCredit=r.legacy*(1-fraction);e.pending=0;e.opening=0;e.next=next+MANAGED_PERIOD;e.fees=(e.fees||0)+r.fee;const tax=r.taxable*fraction*taxRate;e.taxes=(e.taxes||0)+tax;
   const before=S.money;if(payment>0)addMoney(payment);const actual=S.money-before;e.received=(e.received||0)+actual;S.stats.bizEarned=(S.stats.bizEarned||0)+actual;S.stats.managedEarned=(S.stats.managedEarned||0)+actual;
   if(payment>0){track('bizCollect');track('managedPayout');receipts.push({city:e.cityName,name:e.name,through:next,cycles:1,hours:6,profit:r.profit,fee:r.fee,tax,rate:taxRate,payment,received:actual,reserve:e.reserve*(1-taxRate)+e.legacyCredit});}
  }next=Math.min(...valid.map(e=>e.next));
 }
 for(const e of valid){e.pending=(e.pending||0)+enterpriseAccrual78(e,e.rates,e.last,now);e.last=now;if(isPremium75()&&e.broken){e.broken=false;e.nextBreak78=now+BIZ_BREAK_MS78;e.autoRepairs78=(e.autoRepairs78||0)+1;}e.rates=managedSnapshot(e);}
 if(receipts.length){S.managedLog=[...receipts,...(S.managedLog||[])].slice(0,24);if(typeof returnManagedIncome==='function')returnManagedIncome(receipts);if(LOADED){save();if(currentScreen==='life'&&TABS.life==='business')renderCurrent(false);}}
};
const transferBefore78=managedTransferCurrent;managedTransferCurrent=function(){const old=new Set(managedBusinesses().map(e=>e.key));transferBefore78();const now=businessNow();for(const e of managedBusinesses())if(!old.has(e.key)){const st=S.biz[e.id];e.broken=!!st?.broken;e.nextBreak78=st?.nextBreak78||now+BIZ_BREAK_MS78;e.mechanics78=1;e.rates=managedSnapshot(e);}};
function repairCost78(b,st){return Math.max(50,Math.round(b.price*.02*(1+.25*(st.lvl-1))));}
function managedRepairCost78(e){return Math.max(50,Math.round((e.investment||e.base*15)*.02));}
ACTIONS.bizFix=id=>{const now=businessNow();if(now===null)return;businessTick();const b=BUSINESSES.find(b=>b.id===id),st=S.biz[id];if(!b||!st?.broken)return;const cost=isPremium75()?0:repairCost78(b,st);if(S.money<cost)return;S.money-=cost;st.broken=false;st.nextBreak78=now+BIZ_BREAK_MS78;st.rates=businessSnapshot(b,st);save(true);refresh();toast('Бизнес отремонтирован','good');};
ACTIONS.managedFix78=key=>{const now=businessNow();if(now===null)return;managedTick(now,true);const e=managedBusinesses().find(e=>e.key===key);if(!e?.broken)return;const cost=isPremium75()?0:managedRepairCost78(e);if(S.money<cost)return;S.money-=cost;e.broken=false;e.nextBreak78=now+BIZ_BREAK_MS78;e.rates=managedSnapshot(e);save(true);refresh();toast('Бизнес отремонтирован','good');};
const staffGainBefore78=businessStaffGain;businessStaffGain=s=>staffGainBefore78(s)*businessFactor78(S.biz.club||{});
const incomeBefore78=incomeText;incomeText=function(kind,id){if(kind!=='biz-day')return incomeBefore78(kind,id);const b=BUSINESSES.find(b=>b.id===id),now=businessNow();if(!b||now===null)return '—';const st={...incomeBusiness(b)};prepareDamage78(st,now);return incomeMoney(enterpriseAccrual78(st,businessSnapshot(b,st),now,now+24*3600000)*(1-businessTaxRate())*(alimonyOn()?1-ALIMONY_SHARE:1));};
const cardBefore78=businessCard;businessCard=b=>{const html=cardBefore78(b),st=S.biz[b.id];return !st?.broken?html:html.replace('</article>',`<div class="business-damage78"><b>🔧 Поломка: доход −50%</b>${priceBtn('bizFix',b.id,repairCost78(b,st),S.money>=repairCost78(b,st),'Починить · '+incomeMoney(repairCost78(b,st)))}</div></article>`);};
function businessAdButton78(){const active=businessBoost78();return `<section class="business-ad78"><b>🎬 Доход бизнесов ×2 на час</b><p>Только за подтверждённый просмотр рекламы. Ускоряется новая прибыль всех твоих предприятий; зарубежный лимит 300 000 ₽ и требование VIP сохраняются.</p>${active?`<b>Активно до <span data-until="${Date.now()+(S.businessBoostUntil78-businessNow())}"></span></b>`:`<button class="btn primary wide" data-act="businessAd78" ${!businessOwnedCount()||adChoice77('business')?'disabled':''}>Посмотреть рекламу · ×2 на 1 час</button>`}<small>До 4 рекламных усилений в сутки; следующее — после окончания текущего. Общий предел — 25 наград в сутки, пауза между разными наградами 30 секунд.</small>${adStatus81('business')}</section>`;}
ACTIONS.businessAd78=()=>{if(businessBoost78()||!businessOwnedCount())return;rewardedWatch('business');};
const businessPanelBefore78=EXTRA_TABS.life.business;EXTRA_TABS.life.business=()=>businessAdButton78()+businessPanelBefore78();
const managedPanelBefore78=managedPanel;managedPanel=()=>{let html=managedPanelBefore78();if(!html)return html;const t=document.createElement('template');t.innerHTML=html;if(!foreignMembership78())t.content.querySelector('.info-card')?.insertAdjacentHTML('afterbegin','<p class="business-gate78"><b>🔒 Выплаты доступны с VIP или Premium.</b> Бизнесы и резерв сохраняются. После активации подписки — выплата в ближайшее шестичасовое окно в пределах общего лимита.</p><button class="btn" data-act="premiumTab75" data-id="membership75">Посмотреть подписки</button>');for(const e of managedBusinesses()){if(!e.broken)continue;const card=t.content.querySelector(`[data-managed-clock="${CSS.escape(e.key)}"]`)?.closest('article');card?.insertAdjacentHTML('beforeend',`<b>🔧 Поломка: доход −50%</b>${priceBtn('managedFix78',e.key,managedRepairCost78(e),S.money>=managedRepairCost78(e),'Починить · '+incomeMoney(managedRepairCost78(e)))}`);}return t.innerHTML;};
const membershipBefore78=membershipShop75;membershipShop75=()=>membershipBefore78().replace('<li>Автоплатёж за жильё на оплаченный срок</li>','<li>Автоплатёж за жильё на оплаченный срок</li><li>Автоматическая бесплатная починка бизнесов</li>').replace('<li>Касса местного бизнеса 12 часов</li>','<li>Касса местного бизнеса 12 часов</li><li>Получение выплат из других городов</li>');
const showBefore78=showScreen;showScreen=function(name,tab){showBefore78(name,tab);if(name==='life'&&(tab||TABS.life)==='business')adsState().then(()=>{if(currentScreen==='life'&&TABS.life==='business')renderCurrent(false);});};
prestigeProfile=(function(orig){return ()=>({...orig(),businessBoostUntil78:S.businessBoostUntil78||0});})(prestigeProfile);
// Refresh controls only when conditions change, not on every income tick.
let businessUiState78='';
HOOKS.tick.push(()=>{if(!LOADED||currentScreen!=='life'||TABS.life!=='business'){businessUiState78='';return;}const state=JSON.stringify([businessBoost78(),foreignMembership78(),adChoice77('business'),BUSINESSES.map(b=>!!S.biz[b.id]?.broken),managedBusinesses().map(e=>!!e.broken)]);if(businessUiState78&&state!==businessUiState78)renderCurrent(false);businessUiState78=state;});
