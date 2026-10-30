// One reservation and one server-confirmed reward, even when the source changes.
const AD_TERMS81={caps:[5,600],energy:[5,300],skill:[6,0],business:[4,0],mission:[10,0],trash:[5,0]};
function adQuota81(purpose='caps'){const d=REWARDED_ADS.data;if(!d)return null;return d.byPurpose?.[purpose]||{limit:d.limit,used:d.used,remaining:d.remaining,nextAt:d.nextAt};}
adChoice77=function(purpose='caps'){const d=REWARDED_ADS.data,q=adQuota81(purpose);return REWARDED_ADS.busy||!onlineOn()||!d?.enabled||!d.remaining||!q?.remaining||!!d.pending||adsNow()<Math.max(d.nextAt||0,q.nextAt||0);};
function adText81(purpose='caps'){
 const d=REWARDED_ADS.data,q=adQuota81(purpose);if(!onlineOn())return 'Открой игру в Telegram и подключись к интернету.';if(!d)return 'Проверяем доступность рекламы…';if(!d.enabled)return 'Реклама пока недоступна.';
 if(d.pending)return 'Есть незавершённая проверка просмотра. Повторный запуск пока недоступен.';
 if(!d.remaining)return 'Общий дневной лимит рекламных наград исчерпан.';
 if(!q?.remaining)return 'Дневной лимит этой награды исчерпан. Другие виды наград могут оставаться доступны.';
 const left=Math.ceil((Math.max(d.nextAt||0,q.nextAt||0)-adsNow())/1000);
 return `Сегодня: ${q.used}/${q.limit} · всего: ${d.used}/${d.limit}`+(left>0?` · ожидание ${fmtTime(left)}`:'');
}
function adStatus81(purpose){return `<small class="ad-status81" data-ad-purpose="${purpose}">${esc(adText81(purpose))}</small>`;}
adsHTML=function(){const d=REWARDED_ADS.data,q=adQuota81('caps');return `<section class="rewarded-ads" aria-label="${adsText('Реклама за крышки')}"><div class="ad-reward-heading"><span>🎬</span><div><b>Реклама за крышки</b><small>3 крышки за подтверждённую рекламу · до 5 раз в сутки</small></div></div>${adStatus81('caps')}<div class="ad-reward-count"><span>${adsText('Получено сегодня:')} ${q?.used||0} / ${q?.limit||5}</span><span>${adsText('До')} 15 🟡 ${adsText('в сутки')}</span></div><button class="btn primary wide" data-act="rewardedWatch" ${adChoice77('caps')?'disabled':''}>${REWARDED_ADS.busy?'Проверяем просмотр…':'Смотреть рекламу · +3 крышки'}</button><small>Крышки: 5 наград в сутки, пауза 10 минут. Другие награды имеют отдельные лимиты. Между любыми наградами — 30 секунд, общий предел — 25 в сутки.</small><small>Один просмотр даёт только выбранную награду. Ошибка, пропуск и отсутствие рекламы не расходуют лимит. Новый день — в 00:00 по Москве.</small>${d?.pending?'<button class="btn wide" data-act="rewardedCheck">Проверить награду</button>':''}</section>`;};
function adsRefreshContext81(){
 for(const el of document.querySelectorAll('[data-ad-purpose]')){const text=adText81(el.dataset.adPurpose);if(el.textContent!==text){el.textContent=text;if(typeof I18N!=='undefined')I18N.apply(el);}}
 const purposes={rewardedWatch:'caps',adEnergy77:'energy',adSkill77:'skill',businessAd78:'business',missionAd78:'mission',trashAd80:'trash'};
 for(const [act,p] of Object.entries(purposes))for(const b of document.querySelectorAll(`[data-act="${act}"]`)){
  let disabled=!!adChoice77(p);if(p==='energy')disabled||=S.energy>=maxEnergy();if(p==='business')disabled||=!businessOwnedCount()||businessBoost78();if(p==='trash')disabled||=cdLeft('trash')<=0||!!TRASH_RUN;
  if(p==='skill'){const t=TRICKS.find(x=>x.id===b.dataset.id);disabled||=!t||level()<t.level||hasEffect(b.dataset.id)||cdLeft(b.dataset.id)>0;}
  if(p==='mission')disabled||=!missionOffers78()[b.dataset.id]||missionOffers78()[b.dataset.id].claimed;b.disabled=disabled;
 }
}
const adsAcceptBefore81=adsAccept;adsAccept=function(data){adsAcceptBefore81(data);adsRefreshContext81();};
let adContextAt81=0,adDayRefresh81=0;HOOKS.tick.push(()=>{if(Date.now()-adContextAt81<1000)return;adContextAt81=Date.now();adsRefreshContext81();if(REWARDED_ADS.data?.resetAt&&adsNow()>=REWARDED_ADS.data.resetAt&&Date.now()-adDayRefresh81>10000){adDayRefresh81=Date.now();adsState();}});
const MONETAG81={loading:null,zone:''};
async function monetagSdk81(config){
 const zone=String(config?.zoneId||''),url=String(config?.sdkUrl||'');if(!/^\d{3,12}$/.test(zone)||!url.startsWith('https://'))throw Error('Monetag configuration');
 const name='show_'+zone;if(typeof window[name]==='function')return window[name];if(MONETAG81.loading&&MONETAG81.zone===zone)return MONETAG81.loading;
 MONETAG81.zone=zone;MONETAG81.loading=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.async=true;script.dataset.zone=zone;script.dataset.sdk=name;const timer=setTimeout(()=>{script.remove();reject(Error('SDK timeout'));},12000);script.onload=()=>{clearTimeout(timer);typeof window[name]==='function'?resolve(window[name]):reject(Error('SDK unavailable'));};script.onerror=()=>{clearTimeout(timer);script.remove();reject(Error('SDK unavailable'));};document.head.appendChild(script);}).catch(e=>{MONETAG81.loading=null;throw e;});return MONETAG81.loading;
}
function adsDiagnostic83(provider,stage,error){if(typeof BugReport!=='undefined')BugReport.record('ad-status',{provider,stage,state:['load','render','playing','destroy'].includes(error?.state)?error.state:'unknown',started:!!error?.adStarted83,skipped:!!error?.adSkipped83});}
async function adsShow83(controller){
 let started=false,skipped=false;const handlers={onStart:()=>{started=true;},onSkip:()=>{skipped=true;},onBannerNotFound:()=>{},onTooLongSession:()=>{},onNonStopShow:()=>{}};
 // These handlers suppress the SDK's blocking default alerts. The rejected show
 // promise below controls the fallback, and onStart prevents a second impression.
 const registered=[];
 try{
  if(typeof controller.addEventListener==='function'&&typeof controller.removeEventListener==='function')for(const [name,fn] of Object.entries(handlers)){controller.addEventListener(name,fn);registered.push([name,fn]);}
  const result=await controller.show();if(result?.error&&(result.state==='load'||result.state==='render'))throw result;return result;
 }catch(error){throw {state:error?.state,error:error?.error,done:error?.done,adStarted83:started,adSkipped83:skipped};}
 finally{for(const [name,fn] of registered)controller.removeEventListener(name,fn);}
}
rewardedWatch=async function(purpose='caps',skill=''){
 if(!adsCanWatch(purpose)){toast('Сначала закончи текущее дело или дождись подключения.');return;}
 REWARDED_ADS.busy=true;adsRefresh();adsRefreshContext81();let attempt='',provider='adsgram',completed=false;
 try{
  await adsState();const d=REWARDED_ADS.data,q=adQuota81(purpose);if(!d?.enabled||!d.remaining||!q?.remaining||d.pending||adsNow()<Math.max(d.nextAt||0,q.nextAt||0))return;
  const begin=await apiPost('ads/begin',{purpose,skill});adsAccept(begin);if(!begin.ok){toast('Эта награда пока недоступна. Проверь условия и оставшиеся просмотры.');return;}attempt=begin.attempt;provider=begin.provider||'adsgram';let config=begin.providerData,result;
  if(provider==='adsgram'){
   let phase='sdk';try{const c=await adsSDK();phase='show';result=await adsShow83(c);}
   catch(error){
    adsDiagnostic83('adsgram',phase,error);
    const noShow=!error?.adStarted83&&!error?.adSkipped83&&(phase==='sdk'||error?.state==='load'||error?.state==='render'&&error?.error===true);if(!noShow||!REWARDED_ADS.data?.providers?.some(p=>p.id==='monetag'))throw error;
    const alternate=await apiPost('ads/fallback',{attempt});adsAccept(alternate);if(alternate.rewarded){await adsReward(alternate);return;}if(!alternate.ok)throw error;
    provider=alternate.provider;config=alternate.providerData;
   }
  }
  if(provider==='monetag'){const show=await monetagSdk81(config);result=await show({ymid:attempt,requestVar:purpose});completed=result?.reward_event_type==='valued';}
  else completed=result?.done===true&&result?.error===false;
  if(completed)try{sessionStorage.setItem('adCompleted',attempt);}catch(_){}
  const finish=await apiPost('ads/finish',{attempt,provider,completed});adsAccept(finish);
  if(finish.rewarded){try{sessionStorage.removeItem('adCompleted');}catch(_){}await adsReward(finish);}
  else if(completed){toast('Ждём подтверждение рекламной платформы. Награда придёт после проверки.');for(let i=0;i<6;i++){await wait(2000);if((await adsCheck(attempt))?.rewarded)break;}}
  else toast('Рекламная платформа не подтвердила награду. Лимит не потрачен.');
 }catch(error){adsDiagnostic83(provider,'failed',error);if(attempt&&!completed)try{adsAccept(await apiPost('ads/finish',{attempt,provider,completed:false}));}catch(_){}toast(completed?'Просмотр завершён. Проверь награду после восстановления связи.':error?.adSkipped83?'Просмотр закрыт. Дневной лимит не потрачен.':'Не удалось загрузить рекламу. Попробуй позже. Дневной лимит не потрачен.');}
 finally{REWARDED_ADS.busy=false;await adsState();adsRefresh();adsRefreshContext81();}
};
ACTIONS.rewardedWatch=()=>rewardedWatch('caps','');
