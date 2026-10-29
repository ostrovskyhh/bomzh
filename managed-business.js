// Businesses remain chapter progress. The company pays complete six-hour periods,
// using the same verified clock and common money unit as local businesses.
const MANAGED_PERIOD=6*3600000,MANAGED_FEE=.6;
let MANAGED_CHECK_AT=0;
function managedBusinesses(){if(!Array.isArray(S.managedBusinesses))S.managedBusinesses=[];return S.managedBusinesses;}
function managedTransferReady(){
  if(!Object.keys(S.biz||{}).length||businessNow()!==null)return true;
  businessSync();toast('Проверяем время сервера перед передачей бизнеса. Повтори переезд через секунду.','bad');return false;
}
// Validate before older move wrappers clear a garage or apply newcomer money.
for(const action of ['doMove','doMoveMex','doMoveFrance']){const orig=window[action];window[action]=function(){if(!managedTransferReady())return false;return orig.apply(this,arguments);};}
function managedSnapshot(e){
  const k=prestigeMult()*(1+clanBonus())*(1+.05*perk('boss'));
  return {plain:Math.max(0,e.base*k-e.wages)*(1-BIZ_TAX),vip:Math.max(0,e.base*k*2-e.wages)*(1-BIZ_TAX),vipUntil:Math.max(0,Number(S.vipUntil)||0)};
}
function managedAccrual(r,from,to){
  const split=Math.min(to,Math.max(from,r.vipUntil||0));
  return Math.max(0,split-from)*r.vip/3600000+Math.max(0,to-split)*r.plain/3600000;
}
function managedTransferCurrent(){
  const now=businessNow();if(now===null)return;
  businessTick();
  const from=city(),fromName=cityName();
  for(const b of BUSINESSES){
    const st=S.biz?.[b.id];if(!st)continue;
    const key=from+'-'+(S.moves||0)+'-'+b.id;
    if(managedBusinesses().some(e=>e.key===key))continue;
    const e={key,city:from,cityName:fromName,id:b.id,name:b.name,emoji:b.emoji,lvl:st.lvl,
      base:b.income*(1+.5*(st.lvl-1))*(b.id==='club'?clubMult():1),wages:b.id==='club'?clubSalary():0,
      staff:b.id==='club'?{...S.clubStaff}:{},investment:businessInvestment(b,st),
      opening:Math.max(0,st.cash||0)*(1-BIZ_TAX),pending:0,dust:0,last:now,next:now+MANAGED_PERIOD,started:now,received:0,fees:0};
    e.rates=managedSnapshot(e);managedBusinesses().push(e);
  }
}
function managedTick(now=businessNow(),force=false){
  if(now===null||(!force&&now-MANAGED_CHECK_AT<1000))return;
  MANAGED_CHECK_AT=now;const receipts=[];
  for(const e of managedBusinesses()){
    if(!Number.isFinite(e.base)||!Number.isFinite(e.wages)||!Number.isFinite(e.last)||!Number.isFinite(e.next)||now<e.last)continue;
    if(!e.rates)e.rates=managedSnapshot(e);
    const accrue=to=>{e.pending=(e.pending||0)+managedAccrual(e.rates,e.last,to);e.last=to;};
    if(now>=e.next){
      const cycles=1+Math.floor((now-e.next)/MANAGED_PERIOD),through=e.next+(cycles-1)*MANAGED_PERIOD;
      accrue(through);
      const profit=e.pending,fee=profit*MANAGED_FEE,opening=e.opening||0,exact=profit-fee+opening+(e.dust||0),payment=Math.floor(exact+1e-8);
      e.dust=Math.max(0,exact-payment);e.pending=0;e.opening=0;e.next=through+MANAGED_PERIOD;e.fees=(e.fees||0)+fee;
      const before=S.money;if(payment>0)addMoney(payment);const actual=S.money-before;
      e.received=(e.received||0)+actual;S.stats.bizEarned=(S.stats.bizEarned||0)+actual;S.stats.managedEarned=(S.stats.managedEarned||0)+actual;
      if(payment>0){track('bizCollect');track('managedPayout',cycles);}
      receipts.push({city:e.cityName,name:e.name,through,cycles,profit,fee,opening,payment,received:actual});
    }
    accrue(now);e.rates=managedSnapshot(e);
  }
  if(receipts.length){
    S.managedLog=[...receipts,...(S.managedLog||[])].slice(0,24);
    if(LOADED){save();const total=receipts.reduce((n,r)=>n+r.received,0);if(total>0)toast(`🏢 Выплата компании: +${incomeMoney(total)} · комиссия 60% с новой прибыли учтена`,'good');if(currentScreen==='life'&&TABS.life==='business')renderCurrent(false);}
  }
}
HOOKS.load.push(()=>managedTick(businessNow(),true));HOOKS.tick.push(()=>managedTick());
function managedMoveInfo(){
  const owned=BUSINESSES.filter(b=>S.biz?.[b.id]);
  return `<div class="move-box keep"><b>🏢 Бизнесы сохраняются</b>${owned.length?`${owned.length} предприятий этого города перейдут под управление компании. Уровни и сотрудники клуба сохранятся.`:'Купленные в городе предприятия при переезде переходят под управление компании.'} Выплата раз в 6 часов: компания удерживает 60% прибыли, тебе поступает 40%. Остатки касс добавятся к первой выплате без новой комиссии. Уже переданные бизнесы других городов продолжают работать.</div>`;
}
function managedDueText(e,now=businessNow()){if(now===null)return 'Проверяем время сервера';const sec=Math.max(0,Math.ceil((e.next-now)/1000));return `${Math.floor(sec/3600)} ч ${Math.floor(sec%3600/60)} мин ${sec%60} сек`;}
function managedPanel(){
  managedTick();const list=managedBusinesses();if(!list.length)return '';
  const now=businessNow();
  return `<details class="managed-panel business-how" ${document.querySelector('.managed-panel')?.open?'open':''}><summary>🏢 Бизнесы в прежних городах · ${list.length} · выплаты раз в 6 часов</summary><div class="info-card"><b>Компания «Твоё дело»</b><p>Выплата автоматически раз в 6 часов. С прибыли после зарплат и налога 10% компания удерживает 60%, твоя доля — 40%. Действующие алименты удерживаются при поступлении.</p><p>Пока игра закрыта, полные периоды накапливаются. При входе выплаты за них поступают вместе. Деньги приходят на баланс текущего города.</p><p>Получено от компании: <b>${incomeMoney(S.stats.managedEarned||0)}</b></p></div>
    ${list.map(e=>{const rates=managedSnapshot(e),pocket=businessPocket(Math.floor(managedAccrual(rates,now||0,(now||0)+MANAGED_PERIOD)*(1-MANAGED_FEE)));return `<article class="business-card owned managed-card"><div class="business-card-head"><div class="business-emblem">${esc(e.emoji)}</div><div><small>${esc(e.cityName)} · ПОД УПРАВЛЕНИЕМ</small><h3>${esc(e.name)}</h3><span>Уровень ${e.lvl}/${BIZ_MAX_LVL}</span></div></div><p>Ожидаемая выплата за следующие 6 ч: <b>${incomeMoney(pocket)}</b></p><p>До ближайшей: <b data-managed-clock="${esc(e.key)}">${managedDueText(e,now)}</b></p><p>Накоплено к выплате: <b data-managed-pending="${esc(e.key)}">${incomeMoney(businessPocket(Math.floor((e.pending||0)*.4+(e.opening||0))))}</b>${e.opening>0?' · включает прежнюю кассу без новой комиссии':''}</p><small>Уровень и команда работают на месте; развивать новые предприятия можно в текущем городе.</small></article>`;}).join('')}
    ${(S.managedLog||[]).length?`<details class="business-how"><summary>Последние выплаты и комиссия</summary>${S.managedLog.map(r=>`<p><b>${esc(r.city)} · ${esc(r.name)}</b><br>${r.cycles} период(а) по 6 ч · прибыль ${incomeMoney(r.profit)} · компания ${incomeMoney(r.fee)}${r.opening?` · старая касса ${incomeMoney(r.opening)}`:''}<br>Поступило ${incomeMoney(r.received)}</p>`).join('')}</details>`:''}</details>`;
}
const managedBusinessDashboard=EXTRA_TABS.life.business;
EXTRA_TABS.life.business=()=>managedPanel()+managedBusinessDashboard();
let MANAGED_HUD_SECOND=-1;
document.addEventListener('toggle',e=>{if(e.target.classList?.contains('managed-panel'))MANAGED_HUD_SECOND=-1;},true);
HOOKS.hud.push(()=>{const panel=document.querySelector('.managed-panel');if(!panel?.open)return;const now=businessNow(),second=Math.floor((now||0)/1000);if(second===MANAGED_HUD_SECOND)return;MANAGED_HUD_SECOND=second;for(const e of managedBusinesses()){
  const key=CSS.escape(String(e.key)),clock=panel.querySelector(`[data-managed-clock="${key}"]`),pending=panel.querySelector(`[data-managed-pending="${key}"]`);
  if(clock){const text=managedDueText(e,now);if(clock.textContent!==text)clock.textContent=text;}
  if(pending){const text=incomeMoney(businessPocket(Math.floor((e.pending||0)*.4+(e.opening||0))));if(pending.textContent!==text)pending.textContent=text;}
}});
const managedOwnedAchievement=ACHS.find(a=>a.id==='biz');
managedOwnedAchievement.fn=(function(orig){return ()=>orig()+managedBusinesses().reduce((n,e)=>n+(e.lvl||0),0);})(managedOwnedAchievement.fn);
ACHS.push({id:'managedIncome',name:'Бизнес без границ',emoji:'🏢',fn:()=>S.stats.managedEarned||0,goals:[10000,100000,1000000,10000000],unit:'получено от управляющей компании'});
// Managed property remains available in the existing divorce-property rules.
divorceAssets=(function(orig){return ()=>[...orig(),...managedBusinesses().map(e=>({id:'managed:'+e.key,emoji:e.emoji,name:e.name+' · '+e.cityName,value:e.investment+(e.opening||0)+(e.pending||0)*.4}))].sort((a,b)=>b.value-a.value);})(divorceAssets);

// A company call explains both new handoffs and evidence-backed legacy recovery.
const COMPANY={entries:[],loaded:false,busy:false,queued:'',nextCheck:0};
function companyEntries(){const seen=new Set(managedBusinesses().map(e=>e.key));return [...managedBusinesses(),...COMPANY.entries.filter(e=>!seen.has(e.key))];}
function companySignature(){return companyEntries().map(e=>e.key).sort().join('|');}
function companyEstimate(e,now=businessNow()){
  if(now===null)return null;const r=managedSnapshot(e),profit=managedAccrual(r,now,now+MANAGED_PERIOD),fee=profit*MANAGED_FEE;
  return {profit,fee,share:Math.floor(profit-fee+1e-8),pocket:businessPocket(Math.floor(profit-fee+1e-8))};
}
function companyInfo(){
  const list=companyEntries(),pending=new Set(COMPANY.entries.map(e=>e.key)),now=businessNow();
  const amounts=list.map(e=>companyEstimate(e,now)),total=amounts.every(Boolean)?amounts.reduce((s,a)=>s+a.pocket,0):null;
  openModal(`<h3>🏢 Твои бизнесы под управлением</h3><p>Сначала вычитаются зарплаты и обычный налог 10%. Из оставшейся прибыли компания получает 60%, тебе — 40%. Алименты, если есть, удерживаются с твоей доли.</p>
    <div class="info-card"><b>Ожидаемо за следующие 6 часов: ${total===null?'проверяем время сервера':incomeMoney(total)}</b><p>Это прогноз при нынешних бонусах. Окончание VIP внутри периода уже учтено; изменение бонусов или алиментов изменит сумму.</p></div>
    ${list.map((e,i)=>{const a=amounts[i],restore=pending.has(e.key);return `<div class="info-card"><b>${esc(e.emoji)} ${esc(e.name)}</b><p>${esc(e.cityName)} · уровень ${e.lvl}/${BIZ_MAX_LVL}${restore?' · восстановление по сохранённым данным':''}</p>${a?`<p>Прибыль за 6 ч: ${incomeMoney(a.profit)}<br>Услуги компании (60%): ${incomeMoney(a.fee)}<br>Твоя доля (40%): ${incomeMoney(a.share)}${a.pocket!==a.share?`<br>После алиментов: ${incomeMoney(a.pocket)}`:''}</p>`:'<p>Расчёт появится после проверки времени сервера.</p>'}<small>${restore?'Первый платёж — через 6 часов после согласия. Старые кассы и доход до восстановления не начисляются.':`До ближайшей выплаты: ${managedDueText(e,now)}. Остаток старой кассы, если есть, учитывается отдельно.`}</small></div>`;}).join('')}
    <p>За время отсутствия полные периоды накапливаются и выплачиваются при входе. Престиж сбрасывает все эти предприятия. Подробности всегда доступны: Деньги → Бизнес → Управляющая компания.</p>
    <p id="companyError" role="status"></p><div class="btns">${COMPANY.entries.length?'<button class="btn primary wide" data-act="companyAccept">Передать компании и запустить доход</button><button class="btn wide" data-act="companyLater">Решу позже</button>':'<button class="btn primary wide" data-act="companyAcknowledge">Понятно</button>'}</div>`,{center:true});
}
function companyFrames(){return [
    {bg:S.housing,actors:[{a:'valera',x:40,anim:'bounce',say:'Алло? Слушаю!'}],props:[{e:'📱',x:73,y:32,anim:'shake'}],text:'Валере звонят из управляющей компании «Твоё дело».'},
    {bg:'gold',actors:[{a:'manager',x:45,anim:'in-right',say:'У вас остались предприятия в прежних городах.'},{a:'valera',x:77,anim:'in-left'}],props:[{e:'🏢',x:58,y:25,anim:'float'}],text:'Управляющий предлагает взять на себя ежедневные заботы о бизнесах.'},
    {bg:'gold',actors:[{a:'manager',x:45,say:'Из прибыли 60% компании, 40% — вам.'},{a:'valera',x:80,mood:'happy'}],props:[{e:'🧾',x:54,y:35,anim:'float'}],text:'Зарплаты и обычный налог учитываются до раздела прибыли. Владелец сохраняет свои предприятия и их уровни.'},
    {bg:S.housing,actors:[{a:'valera',x:50,mood:'happy',anim:'bounce',say:'Покажите расчёт по каждому адресу!'}],props:[{e:'🕕',x:78,y:30,anim:'float'}],text:'Расчёт каждые шесть часов. После разговора — список предприятий, комиссия и твоя ожидаемая выплата.'},
  ];}
CUTS.company_business=companyFrames();CUT_TITLES.company_business='📱 Звонок управляющей компании';
HOOKS.load.push(()=>{CUTS.company_business=companyFrames();});
function companyCall(){
  if(!companyEntries().length)return;S.companyLaterUntil=Date.now()+2*3600000;save();
  CUTS.company_business=companyFrames();CUT_TITLES.company_business='📱 Звонок управляющей компании';playCutscene('company_business',companyInfo);
}
function companyAcknowledge(){S.companySeenKeys=[...new Set([...(S.companySeenKeys||[]),...companyEntries().map(e=>e.key)])];S.companyLaterUntil=0;save();closeModal();}
function companyCheck(){
  if(!LOADED||SAVE_LOCK||document.hidden||!(currentScreen==='game'||currentScreen==='life'&&TABS.life==='business'))return;
  const list=companyEntries(),seen=new Set(S.companySeenKeys||[]),sig=companySignature();
  if(!list.some(e=>!seen.has(e.key))||(S.companyLaterUntil||0)>Date.now()||COMPANY.queued===sig)return;
  COMPANY.queued=sig;queuePopup('company-call',2,()=>{COMPANY.queued='';if(companyEntries().some(e=>!(S.companySeenKeys||[]).includes(e.key)))companyCall();});
}
async function companyLoad(){
  if(!onlineOn()||SAVE_LOCK||COMPANY.busy)return;
  try{const r=await apiPost('business/recovery');COMPANY.entries=(Array.isArray(r.entries)?r.entries:[]).filter(e=>!managedBusinesses().some(x=>x.city===e.city&&x.id===e.id));COMPANY.loaded=true;if(currentScreen==='life'&&TABS.life==='business')renderCurrent(false);companyCheck();}catch(e){/* Offer is durable; retry when the player returns. */}
}
async function companyAccept(){
  if(COMPANY.busy||!COMPANY.entries.length)return;COMPANY.busy=true;let locked=false;
  const button=document.querySelector('[data-act="companyAccept"]');if(button)button.disabled=true;
  try{
    if(!onlineOn()||!serverReady||SAVE_LOCK)throw Error('Нужно подключение к серверу игры. Попробуй ещё раз.');
    save();for(let i=0;i<5;i++){await serverWrite();if(!srvBusy&&serverBase>=(S.rev||0))break;await wait(300);}
    if(srvBusy||serverBase<(S.rev||0)||SAVE_LOCK)throw Error('Не удалось сохранить прогресс. Попробуй ещё раз через несколько секунд.');
    SAVE_LOCK=true;locked=true;
    const r=await apiPost('business/recover',{base:serverBase,device:DEVICE_ID});if(!r.ok)throw Error(r.error||'Предложение обновилось. Перезайди в раздел бизнеса.');
    for(const e of r.entries||[])if(!managedBusinesses().some(x=>x.key===e.key))managedBusinesses().push(e);
    S.companyRecoveryClaims=[...new Set([...(S.companyRecoveryClaims||[]),r.plan])];serverBase=Math.max(serverBase,r.rev||0);S.rev=Math.max(S.rev||0,r.rev||0);REV_FLOOR=Math.max(REV_FLOOR,r.rev||0);
    COMPANY.entries=[];SAVE_LOCK=false;locked=false;save(true);companyInfo();toast('Предприятия переданы компании. Первый платёж — через 6 часов.','good');
  }catch(e){COMPANY.loaded=false;const el=$('companyError');if(el)el.textContent=String(e.message||'Не удалось связаться с компанией. Попробуй ещё раз.');}
  finally{if(locked)SAVE_LOCK=false;COMPANY.busy=false;const b=document.querySelector('[data-act="companyAccept"]');if(b)b.disabled=false;}
}
ACTIONS.companyAccept=companyAccept;ACTIONS.companyAcknowledge=companyAcknowledge;ACTIONS.companyCall=companyCall;ACTIONS.companyInfo=companyInfo;
ACTIONS.companyLater=()=>{S.companyLaterUntil=Date.now()+2*3600000;save();closeModal();};
const companyBusinessDashboard=EXTRA_TABS.life.business;
EXTRA_TABS.life.business=()=>`${companyEntries().length?'<div class="info-card"><b>🏢 Управляющая компания «Твоё дело»</b><p>Твои предприятия прежних городов и расчёт выплат.</p><button class="btn primary" data-act="companyInfo">Условия и мои выплаты</button><button class="btn" data-act="companyCall">📱 Пересмотреть звонок</button></div>':''}${companyBusinessDashboard()}`;
HOOKS.init.push(()=>{setTimeout(companyLoad,5000);setInterval(()=>{if(!document.hidden&&!COMPANY.loaded)companyLoad();},60000);});
HOOKS.tick.push(()=>{if(Date.now()<COMPANY.nextCheck)return;COMPANY.nextCheck=Date.now()+3000;companyCheck();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)companyLoad();});
performPrestige=(function(orig){return function(){const before=S.prestige;const result=orig.apply(this,arguments);if(S.prestige!==before){COMPANY.entries=[];COMPANY.loaded=false;COMPANY.queued='';}return result;};})(performPrestige);
