// One optional campaign, with a separate provider-confirmed count and durable VIP receipt.
const VIP_PROMO517='vip-2026-10-31',VIP_PURPOSE517='vip_promo517';
let vipClaimBusy517=false,vipPollAt517=0,vipTickAt517=0;
function vipPromo517(){return REWARDED_ADS.data?.promo517;}
function vipPromoActive517(){const p=vipPromo517();return !!p?.active&&adsNow()>=p.startsAt&&adsNow()<p.endsAt;}
function vipPromoUi517(){if(S.promoUi517?.id!==VIP_PROMO517)S.promoUi517={id:VIP_PROMO517,hidden:false,noticeStep:0};return S.promoUi517;}
function vipPromoVisible517(){return vipPromoActive517()&&!vipPromo517()?.claimed||!!vipPromo517()?.ready;}
function vipPromoTime517(){const p=vipPromo517();return fmtTime(Math.max(0,Math.ceil(((p?.endsAt||0)-adsNow())/1000)));}
function vipPromoBody517(){const p=vipPromo517();if(!p)return '<p>Проверяем условия акции…</p>';
 const active=vipPromoActive517(),done=p.claimed,ready=p.ready||p.count>=5;
 return `<div class="vip517-head"><span>👑</span><small>АКЦИЯ · 31 ОКТЯБРЯ</small><h3>5 просмотров — 2 дня VIP</h3></div><p>Подтверди пять рекламных просмотров только из этого раздела до 23:59:59 31 октября по Москве.</p><div class="vip517-progress" aria-label="${esc('Подтверждённые просмотры')}">${[1,2,3,4,5].map(i=>`<i class="${p.count>=i?'done':''}">${p.count>=i?'✓':i}</i>`).join('')}</div><b class="vip517-count">Подтверждено: ${p.count} / 5</b><p>${done?'✓ Два дня VIP уже получены.':p.ready?'Все просмотры подтверждены. Два дня VIP готовы к получению.':active?'До конца акции: '+vipPromoTime517():'Акция завершилась. Новые просмотры не засчитываются.'}</p>${done?'':p.ready?`<button class="btn primary wide" data-act="vipPromoClaim517" ${vipClaimBusy517?'disabled':''}>${vipClaimBusy517?'Сохраняем VIP…':'Получить 2 дня VIP'}</button>`:active&&!ready?`<button class="btn primary wide" data-act="vipPromoWatch517" ${adChoice77(VIP_PURPOSE517)?'disabled':''}>${REWARDED_ADS.busy?'Проверяем просмотр…':'🎬 Смотреть рекламу акции'}</button>${adStatus81(VIP_PURPOSE517)}`:''}<div class="vip517-terms"><p>Награда — один раз на игрока. Два реальных дня добавляются после действующего VIP или Premium. Просмотры из других разделов не засчитываются и дают свои обычные награды.</p><p>Пять просмотров акции учитываются отдельно от обычного лимита 25 наград. Между просмотрами — 30 секунд. Пропуск, ошибка и отсутствие рекламы не увеличивают счётчик.</p><p>Просмотр добровольный. Все пять просмотров должны получить подтверждение рекламной платформы до окончания акции.</p></div>${vipPromoUi517().hidden&&active?'<button class="btn wide" data-act="vipPromoShow517">Вернуть плашку на главный экран</button>':''}<button class="btn wide" data-act="close">Закрыть</button>`;
}
function vipPromoRender517(){
 if(!LOADED)return;let banner=$('vipPromoBanner517');
 if(vipPromoVisible517()&&!vipPromoUi517().hidden){
  if(!banner){banner=document.createElement('aside');banner.id='vipPromoBanner517';banner.className='vip517-banner';$('screen-game').prepend(banner);}
  const p=vipPromo517(),html=`<button class="vip517-open" data-act="vipPromoOpen517"><span>👑</span><span><b>${p.ready?'Твои 2 дня VIP готовы':'5 просмотров — 2 дня VIP'}</b><small>${p.ready?'Открыть и получить':`Сегодня до 23:59 МСК · ${p.count}/5 · ${vipPromoTime517()}`}</small></span><strong>›</strong></button><button class="vip517-hide" data-act="vipPromoHide517" aria-label="Скрыть плашку">×</button>`;
  if(banner.vipHtml517!==html){banner.vipHtml517=html;banner.innerHTML=html;if(typeof I18N!=='undefined')I18N.apply(banner);}
 }else banner?.remove();
 $('screen-game').classList.toggle('vip517-has-banner',!!$('vipPromoBanner517'));
 const panel=$('vipPromoPanel517');if(panel){const html=vipPromoBody517();if(panel.vipHtml517!==html){panel.vipHtml517=html;panel.innerHTML=html;if(typeof I18N!=='undefined')I18N.apply(panel);}}
}
function vipPromoNotice517(step=vipPromoUi517().noticeStep){
 if(!vipPromoActive517()||step>=2)return;
 const language=releaseLanguage(),t=x=>typeof I18N==='undefined'?x:I18N.inLanguage(x,language);
 const paragraphs=step===0?['Сегодня пять подтверждённых рекламных просмотров из раздела акции дают два дня VIP.','Акция действует до 23:59:59 31 октября по Москве. Награду можно получить один раз.']:['Засчитывается только кнопка «Смотреть рекламу акции». Просмотры за крышки, энергию и другие награды в этот счётчик не входят.','Участие добровольное. После пяти подтверждений срок VIP продлится на два дня.'];
 const buttons=step===0?`<button class="btn primary wide" data-act="vipPromoNoticeNext517">${t('Далее · 1/2')}</button>`:`<button class="btn primary wide" data-act="vipPromoNoticeDone517" data-id="open">${t('Открыть акцию · 2/2')}</button><button class="btn wide" data-act="vipPromoNoticeDone517" data-id="later">${t('Понятно · 2/2')}</button>`;
 openModal(`<section id="vipPromoNotice517" class="vip517-panel" data-step="${step}" data-i18n-ignore lang="${language}"><div class="vip517-head"><span>👑</span><h3>${t('5 просмотров — 2 дня VIP')}</h3></div>${paragraphs.map(x=>'<p>'+t(x)+'</p>').join('')}${buttons}</section>`,{center:true,locked:true});
}
ACTIONS.vipPromoNoticeNext517=()=>{if(!$('vipPromoNotice517'))return;if(!vipPromoActive517()){vipPromoUi517().noticeStep=2;closeModal();return;}vipPromoUi517().noticeStep=1;save(true);vipPromoNotice517(1);};
ACTIONS.vipPromoNoticeDone517=where=>{if(!$('vipPromoNotice517')||vipPromoUi517().noticeStep!==1)return;vipPromoUi517().noticeStep=2;save(true);closeModal();if(where==='open')ACTIONS.vipPromoOpen517();};
ACTIONS.vipPromoOpen517=()=>{openModal('<section id="vipPromoPanel517" class="vip517-panel">'+vipPromoBody517()+'</section>',{center:true});adsState();};
ACTIONS.vipPromoHide517=()=>{vipPromoUi517().hidden=true;save(true);vipPromoRender517();toast('Плашка скрыта. Акцию можно открыть в настройках.');};
ACTIONS.vipPromoShow517=()=>{vipPromoUi517().hidden=false;save(true);vipPromoRender517();};
ACTIONS.vipPromoWatch517=async()=>{if(!vipPromoActive517()||vipPromo517()?.count>=5)return;if(!await persistForAds78()){toast('Не удалось сохранить прогресс. Проверь подключение и повтори попытку.');return;}return rewardedWatch(VIP_PURPOSE517);};
async function vipPromoClaim517(silent=false){
 if(vipClaimBusy517||!onlineOn()||SAVE_LOCK||!LOADED)return false;vipClaimBusy517=true;vipPromoRender517();
 try{
  if(!await persistForAds78())throw Error('save');const r=await apiPost('ads/promo/claim');if(!r.ok)throw Error('incomplete');
  if(!r.claimed){S.promoVipClaims517||=[];if(!S.promoVipClaims517.includes(r.campaign)){S.vipUntil=Math.max(S.vipUntil||0,r.untilAt);S.promoVipClaims517.push(r.campaign);save(true);}if(!await persistForAds78())throw Error('save');if(!silent)toast('👑 Два дня VIP получены!','good');}
  await adsState();updateHud();return true;
 }catch(_){if(!silent)toast('VIP пока не удалось сохранить. Награда ждёт получения — проверь подключение и повтори.');return false;}
 finally{vipClaimBusy517=false;vipPromoRender517();}
}
ACTIONS.vipPromoClaim517=()=>vipPromoClaim517();
const vipAdsRewardBefore517=adsReward;adsReward=async function(r){if(r.purpose!==VIP_PURPOSE517)return vipAdsRewardBefore517(r);if(vipPromo517()?.ready)await vipPromoClaim517();else toast('Просмотр акции подтверждён: '+(vipPromo517()?.count||0)+' / 5','good');vipPromoRender517();};
const vipAdsAcceptBefore517=adsAccept;adsAccept=function(data){vipAdsAcceptBefore517(data);vipPromoRender517();};
const vipProfileBefore517=prestigeProfile;prestigeProfile=()=>({...vipProfileBefore517(),promoVipClaims517:S.promoVipClaims517||[],promoUi517:S.promoUi517});
const vipSettingsBefore517=openSettings;openSettings=function(...args){const result=vipSettingsBefore517.apply(this,args);if(vipPromoVisible517()){const list=document.querySelector('#modalRoot .set-list');if(list&&!document.querySelector('#modalRoot [data-act="vipPromoOpen517"]'))list.insertAdjacentHTML('beforebegin','<button class="btn wide" data-act="vipPromoOpen517">👑 Акция: 2 дня VIP</button>');}return result;};
// Two acknowledgements cannot be dismissed accidentally by Back or another popup.
const vipCloseBefore517=closeModal;closeModal=function(...args){if($('vipPromoNotice517')&&vipPromoUi517().noticeStep<2&&vipPromoActive517())return;return vipCloseBefore517.apply(this,args);};
const vipOpenBefore517=openModal;openModal=function(html,opts){if($('vipPromoNotice517')&&vipPromoUi517().noticeStep<2&&vipPromoActive517()&&!String(html).includes('id="vipPromoNotice517"')){MODAL_QUEUE.push({html,opts});return document.createElement('div');}return vipOpenBefore517(html,opts);};
function vipPromoTick517(){
 if(!LOADED||document.hidden||Date.now()-vipTickAt517<1000)return;vipTickAt517=Date.now();vipPromoRender517();
 if(!vipPromoActive517()&&$('vipPromoNotice517')){vipPromoUi517().noticeStep=2;closeModal();}
 if(vipPromoActive517()&&vipPromoUi517().noticeStep<2&&!SAVE_LOCK&&!modalOpen()&&!S.busy&&!MG&&!MG_PENDING&&!FIGHT&&!CUT&&!ARREST&&!REWARDED_ADS.busy)vipPromoNotice517();
 if(vipPromo517()?.ready&&!vipClaimBusy517&&!SAVE_LOCK&&!REWARDED_ADS.busy&&Date.now()-vipPollAt517>15000){vipPollAt517=Date.now();vipPromoClaim517(true);}
 else if(vipPromoActive517()&&!REWARDED_ADS.busy&&Date.now()-vipPollAt517>60000){vipPollAt517=Date.now();adsState();}
}
HOOKS.init.push(()=>{setTimeout(()=>{if(onlineOn())adsState();},4000);});HOOKS.tick.push(vipPromoTick517);HOOKS.screen.push(vipPromoRender517);
