// Optional Reward format only. The private provider callback key is server-only.
const REWARDED_ADS={data:null,loading:null,controller:null,busy:false,sync:0,request:0};
function adsText(text){return typeof I18N!=='undefined'?I18N.t(text):text;}
function adsNow(){return Date.now()+REWARDED_ADS.sync;}
function adsHTML(){
  const d=REWARDED_ADS.data;
  const status=!onlineOn()?'Открой игру в Telegram и подключись к интернету.':!d?'Проверяем доступность рекламы…':!d.enabled?'Реклама готовится к запуску. Награды станут доступны после проверки AdsGram.':d.pending?'Есть незавершённая проверка просмотра. Повторный запуск пока недоступен.':!d.remaining?'На сегодня все 5 наград получены. Новые — после полуночи по Москве.':adsNow()<d.nextAt?'Следующий просмотр будет доступен через 10 минут после предыдущей награды.':'Смотри только по желанию. Покупать что-либо или переходить по рекламе не нужно.';
  const disabled=REWARDED_ADS.busy||!onlineOn()||!d?.enabled||!d.remaining||!!d.pending||adsNow()<d.nextAt;
  return `<section class="rewarded-ads" aria-label="${adsText('Реклама за крышки')}"><div class="ad-reward-heading"><span>🎬</span><div><b>Реклама за крышки</b><small>3 крышки за полный просмотр · до 5 раз в сутки</small></div></div><p>${status}</p>${d?`<div class="ad-reward-count"><span>${adsText('Получено сегодня:')} ${d.used} / ${d.limit}</span><span>${adsText('До')} 15 🟡 ${adsText('в сутки')}</span></div>`:''}<button class="btn primary wide" data-act="rewardedWatch" ${disabled?'disabled':''}>${REWARDED_ADS.busy?'Проверяем просмотр…':'Смотреть рекламу · +3 крышки'}</button><small>Крышки, энергия, навыки, бизнесы, миссии и мусорка используют общий лимит — 5 наград в сутки. Один просмотр даёт только выбранную награду, без дополнительных крышек.</small><small>Пауза между наградами — 10 минут. Лимит обновляется в 00:00 по Москве. За пропуск, ошибку или отсутствие рекламы награды нет; дневной лимит сохраняется.</small>${d?.pending?'<button class="btn wide" data-act="rewardedCheck">Проверить награду</button>':''}</section>`;
}
function adsRefresh(){const el=document.querySelector('.rewarded-ads');if(el){el.outerHTML=adsHTML();if(typeof I18N!=='undefined')I18N.apply(document.querySelector('.rewarded-ads'));}}
function adsAccept(data){if(data?.blockId){REWARDED_ADS.data=data;REWARDED_ADS.sync=data.serverNow-Date.now();adsRefresh();}}
async function adsState(){if(!onlineOn())return;try{adsAccept(await apiPost('ads/state'));}catch(e){/* Placement remains disabled until server state is known. */}}
function adsSDK(){
  if(REWARDED_ADS.controller)return Promise.resolve(REWARDED_ADS.controller);
  if(REWARDED_ADS.loading)return REWARDED_ADS.loading;
  REWARDED_ADS.loading=new Promise((resolve,reject)=>{
    const ready=()=>{try{if(!window.Adsgram)throw Error('SDK');const c=window.Adsgram.init({blockId:REWARDED_ADS.data.blockId,debug:false});REWARDED_ADS.controller=c;resolve(c);}catch(e){reject(e);}};
    if(window.Adsgram){ready();return;}
    const script=document.createElement('script');script.src='https://sad.adsgram.ai/js/sad.min.js';script.async=true;
    const timer=setTimeout(()=>{script.remove();reject(Error('timeout'));},12000);
    script.onload=()=>{clearTimeout(timer);ready();};script.onerror=()=>{clearTimeout(timer);script.remove();reject(Error('SDK'));};document.head.appendChild(script);
  }).catch(e=>{REWARDED_ADS.loading=null;throw e;});return REWARDED_ADS.loading;
}
function adsCanWatch(purpose='caps'){return onlineOn()&&!SAVE_LOCK&&!REWARDED_ADS.busy&&(!S.busy||purpose==='energy'&&S.busy.type==='sleep')&&!MG&&!MG_PENDING&&!FIGHT&&!CUT&&!ARREST;}
async function adsReward(result){
  if(result.purpose&&result.purpose!=='caps'){if(typeof adsBenefits77==='function')await adsBenefits77();return;}
  toast('Просмотр подтверждён: +3 крышки подготовлены подарком','good');await giftClaim();
}
async function adsCheck(attempt){
  const id=attempt||REWARDED_ADS.data?.pending?.id;if(!id||!onlineOn())return;
  let completed=false;try{completed=sessionStorage.getItem('adCompleted')===id;}catch(_){}
  const result=await apiPost('ads/finish',{attempt:id,...(completed?{completed:true}:{})});adsAccept(result);
  if(result.rewarded){try{sessionStorage.removeItem('adCompleted');}catch(_){}await adsReward(result);}
  return result;
}
async function rewardedWatch(purpose='caps',skill=''){
  if(!adsCanWatch(purpose)){toast('Сначала закончи текущее дело или дождись подключения.');return;}
  REWARDED_ADS.busy=true;adsRefresh();let attempt='',completed=false;
  try{
    await adsState();const d=REWARDED_ADS.data;if(!d?.enabled||!d.remaining||d.pending||adsNow()<d.nextAt)return;
    // Load only on voluntary click: SDK outages never block the game startup.
    const controller=await adsSDK();const begin=await apiPost('ads/begin',{purpose,skill});adsAccept(begin);if(!begin.ok){toast('Эта награда пока недоступна. Проверь условия и оставшиеся просмотры.');return;}attempt=begin.attempt;
    const result=await controller.show();
    completed=result?.done===true&&result?.error===false;
    if(completed)try{sessionStorage.setItem('adCompleted',attempt);}catch(_){}
    const finish=await apiPost('ads/finish',{attempt,completed});adsAccept(finish);
    if(finish.rewarded){try{sessionStorage.removeItem('adCompleted');}catch(_){}await adsReward(finish);}
    else if(completed){toast('Ждём подтверждение AdsGram. Награда придёт после проверки.');for(let i=0;i<6;i++){await new Promise(r=>setTimeout(r,2000));if((await adsCheck(attempt))?.rewarded)break;}}
  }catch(e){
    if(attempt&&!completed)try{adsAccept(await apiPost('ads/finish',{attempt,completed:false}));}catch(_){}
    toast(completed?'Просмотр завершён. Проверь награду после восстановления связи.':'Реклама недоступна или закрыта раньше времени. Дневной лимит не потрачен.');
  }finally{REWARDED_ADS.busy=false;await adsState();adsRefresh();}
}
const adsCapsBefore=dnCapsTab;dnCapsTab=p=>adsHTML()+adsCapsBefore(p);
const adsOpenBefore=openDonate;openDonate=function(){adsOpenBefore();adsState();};
Object.assign(ACTIONS,{rewardedWatch,rewardedCheck:()=>adsCheck().catch(()=>toast('Нет связи с сервером. Попробуй позже.'))});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!REWARDED_ADS.busy&&REWARDED_ADS.data?.pending?.finished)adsCheck().catch(()=>{});});
setInterval(()=>{if(!document.hidden&&!REWARDED_ADS.busy&&document.querySelector('.rewarded-ads')){if(REWARDED_ADS.data?.pending?.finished)adsCheck().catch(()=>{});else adsState();}},15000);
