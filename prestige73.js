// This campaign is part of the account profile and survives future prestige resets.
const PRESTIGE_REWARDS73=[
  {n:1,id:'pr73_spark',name:'Искра престижа',face:'🔥',color:'#ffc15b',dark:'#542842',mark:'I'},
  {n:3,id:'pr73_rise',name:'Восхождение',face:'🦅',color:'#83dcff',dark:'#153d6d',mark:'III'},
  {n:5,id:'pr73_phoenix',name:'Возрождение',face:'🐦‍🔥',color:'#ff977a',dark:'#742640',mark:'V'},
  {n:10,id:'pr73_legend',name:'Легенда кругов',face:'🌌',color:'#e4b4ff',dark:'#432778',mark:'X'}
];
function prestigeArt73(r){return `<svg data-prestige-avatar73 viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="96" height="96" rx="25" fill="${r.dark}"/><circle cx="48" cy="46" r="36" fill="none" stroke="${r.color}" stroke-width="2" opacity=".6"/><path d="M48 11L56 34L81 25L67 47L83 64L59 61L48 83L37 61L13 64L29 47L15 25L40 34Z" fill="${r.color}" opacity=".25"/><path d="M18 43L39 48L48 26L57 48L78 43L62 63H34Z" fill="${r.color}"/><path d="M35 67H61" stroke="${r.color}" stroke-width="3" stroke-linecap="round"/><text x="48" y="59" text-anchor="middle" fill="${r.dark}" font-size="19" font-weight="900" font-family="Georgia,serif">${r.mark}</text><circle cx="48" cy="16" r="3" fill="${r.color}"/></svg>`;}
for(const r of PRESTIGE_REWARDS73){
  AVATARS.push({id:r.id,face:r.face,name:r.name,how:`Престиж ${r.n}`,prestige73:true,art73:prestigeArt73(r),need:()=>(S.prestige||0)>=r.n});
  FRAMES.push({id:r.id,name:r.name,how:`Престиж ${r.n}`,prestige73:true,need:()=>(S.prestige||0)>=r.n});
  AVA_BG[r.id]=[r.dark,r.color];
}
const avaFaceBefore73=avaFace;avaFace=function(name,id){const a=avatarById(id);return a?.prestige73?`<span class="ava-in prestige-face73">${a.art73}</span>`:avaFaceBefore73(name,id);};
HOOKS.hud.push(()=>{const a=currentAvatar(),el=$('avatar');if(a?.prestige73&&el&&!el.querySelector('[data-prestige-avatar73]'))el.innerHTML=a.art73;const button=$('prestigeFinal73');if(button&&PRESTIGE_PROMO73){const left=Math.max(0,Math.ceil((PRESTIGE_PROMO73.ready-performance.now())/1000));button.disabled=left>0||!PRESTIGE_PROMO73.ack;const timer=$('prestigeWait73');if(timer)timer.textContent=left?`Подожди ${left} сек.`:'Подтвердить престиж';}});
const achTabBefore73=EXTRA_TABS.tasks.ach;EXTRA_TABS.tasks.ach=()=>{const t=document.createElement('template');t.innerHTML=achTabBefore73();for(const r of PRESTIGE_REWARDS73){const el=t.content.querySelector(`[data-act="pickAvatar"][data-id="${r.id}"] .avatar`);if(el&&(S.prestige||0)>=r.n)el.innerHTML=prestigeArt73(r);}return t.innerHTML;};
function prestigeGallery73(){return `<section class="prestige-gallery73"><h3>Коллекция за престиж</h3><p>На каждой ступени открываются отдельная аватарка и рамка. Это косметика: бонусы не зависят от выбранного образа. Уже достигнутые ступени доступны сразу.</p><div class="prestige-rewards73">${PRESTIGE_REWARDS73.map(r=>{const open=(S.prestige||0)>=r.n;return `<article><div class="avatar frame-${r.id} prestige-preview73">${prestigeArt73(r)}</div><b>${r.name}</b><small>Престиж ${r.n}</small><div class="btns"><button class="btn small" data-act="pickAvatar" data-id="${r.id}" ${open?'':'disabled'}>Аватарка</button><button class="btn small" data-act="pickFrame" data-id="${r.id}" ${open?'':'disabled'}>Рамка</button></div>${open?'':'<span>🔒</span>'}</article>`;}).join('')}</div></section>`;}
const xpBefore73=xpMult;xpMult=()=>xpBefore73()*(S.prestigeGift73?1.5:1);
// Scale only the base, preserving the shared fluctuations, skills and city progression.
const bottleRateBefore73=bottleRate;bottleRate=t=>bottleRateBefore73(t)*(S.prestigeGift73?1.5/.8:1);
const peakBefore73=nextRatePeak;nextRatePeak=function(){const p=peakBefore73();return {...p,v:p.v*(S.prestigeGift73?1.5/.8:1)*CITY_RATE_FACTOR()};};
const exchangeBefore73=renderExchange;renderExchange=function(){exchangeBefore73();if(S.prestigeGift73){const el=document.querySelector('#exBody .rate-shared');if(el)el.innerHTML=el.innerHTML.replace('Курс общий для всех игроков.','Колебания рынка общие для всех игроков. Твоя базовая ставка после предложения престижа — 1,5 рубля; город и навыки дополнительно влияют на курс.');}};
let PRESTIGE_PROMO73=null;
function prestigeIdentity73(){return {prestigeOffer73:S.prestigeOffer73,prestigeGift73:!!S.prestigeGift73};}
function prestigeEligible73(){return level()>=18&&!S.prestigeOffer73?.claimed&&!S.prestigeGift73;}
function prestigeBusy73(){return !!S.busy||!!CUT||!!MG_PENDING||newcomerActivity()||!!S.diceActive||DICE_UI.busy||DICE_UI.action||!!S.bjInRound||!!BJ_RETIRE_SYNC;}
// Only the validated final UI can authorize the campaign inside the shared prestige pipeline.
function prestigeSnapshot73(){return JSON.stringify([city(),S.prestige||0,level(),S.ownedHousing,S.money,S.bottles,S.caps,Object.keys(S.biz||{}).sort(),S.girlfriend,S.married,(S.kids||[]).length]);}
function prestigePromoAuthorized73(){return !!PRESTIGE_PROMO73?.executing&&prestigeEligible73()&&!prestigeBusy73()&&PRESTIGE_PROMO73.prestige===(S.prestige||0)&&PRESTIGE_PROMO73.snapshot===prestigeSnapshot73();}
function prestigeBenefits73(){return `<div class="prestige-benefits73"><b>Разовый выгодный старт</b><ul><li>100 000 рублей на старт в Засранске, плюс бонус перка «Заначка».</li><li>+150 крышек к сохранённому балансу.</li><li>Постоянный бонус опыта ×1,5 — дополнительно к обычным бонусам престижа и усилителям.</li><li>Базовый курс бутылок 1,5 рубля вместо 0,8 рубля. Он колеблется по общему рынку; городские надбавки и навыки сохраняются.</li></ul><p>Бонусы опыта и курса останутся в следующих кругах. Стартовые деньги и 150 крышек выдаются только один раз.</p></div>`;}
function prestigeLosses73(){return '<div class="prestige-warning lost"><b>Что сбросится</b><p>Деньги и бутылки, включая замороженные средства; уровень, учёба, работа, сила и форма; жильё, обычная одежда, транспорт и все бизнесы, в том числе в прошлых городах; обычный инвентарь, барахолка и криминальный склад; сюжет, отношения и семья.</p></div><div class="prestige-warning kept"><b>Что сохранится</b><p>Все крышки, VIP и оплаченные усилители, косметика, ключи кейсов, батл-пасс, достижения и их прогресс, коллекции, питомцы и их развитие, наградные вещи, улучшения навыков, открытые аватарки и рамки, статистика, настройки и постоянные перки.</p></div>';}
function prestigeExplain73(){return `<h3>Что такое престиж?</h3><p>Это добровольный новый круг игры: Валера возвращается в Засранск и начинает развитие заново. Взамен каждый круг навсегда даёт +20% к тапам, работе и бизнесу и +10% к опыту. Эти прибавки складываются между кругами. Очки престижа тратятся на постоянные перки.</p><p>За этот переход: <b>+${prestigeGain()} очк. престижа</b>. Следующий круг — <b>престиж ${(S.prestige||0)+1}</b>. ${S.prestigeStarterGranted?'Стартовый бизнес уже был получен раньше и повторно не выдаётся.':'При первом престиже получишь первый бизнес бесплатно.'}</p>`;}
function prestigeOpen73(){
  if(!prestigeEligible73()||prestigeBusy73())return;
  S.prestigeOffer73={...(S.prestigeOffer73||{}),seen:true};save(true);
  PRESTIGE_PROMO73={step:1,prestige:S.prestige||0};prestigePromoRender73();
}
function prestigePromoRender73(){
  const p=PRESTIGE_PROMO73;if(!p)return;
  const body=p.step===1?`<small>РАЗОВОЕ ПРЕДЛОЖЕНИЕ · УРОВЕНЬ 18+</small><h2>Новый круг с преимуществом</h2><p class="prestige-warning lost"><b>Престиж сбросит уровень, деньги, имущество, сюжет и семью. Валера начнёт заново в Засранске.</b></p>${prestigeBenefits73()}${prestigeExplain73()}${prestigeLosses73()}<p><b>Это не обычный подарок: получение условий запускает сброс прогресса.</b> Ничего не изменится, пока ты не пройдёшь оба подтверждения.</p><button class="btn primary wide" data-act="prestigeNext73">Понимаю потери — продолжить</button>`:`<h2>Подтвердить новый круг?</h2><p>Текущий прогресс будет сброшен. Вернуть прежнее состояние этим окном будет нельзя.</p>${prestigeBenefits73()}${prestigeLosses73()}<label class="prestige-ack"><input type="checkbox" id="prestigeAck73" data-act="prestigeAck73"> Я понимаю, что потеряю перечисленный прогресс, и хочу начать новый круг.</label><button class="btn danger wide" id="prestigeFinal73" data-act="prestigeConfirm73" disabled><span id="prestigeWait73">Подожди 3 сек.</span></button>`;
  openModal(`<section id="prestigePromo73" class="prestige-promo73">${body}<button class="btn wide" data-act="prestigeLater73">Продолжить игру без сброса</button></section>`,{center:true,locked:true});
}
Object.assign(ACTIONS,{
  prestigeOpen73,
  prestigeNext73:()=>{const p=PRESTIGE_PROMO73;if(!p||p.step!==1||!$('prestigePromo73')||!prestigeEligible73()||prestigeBusy73())return;p.step=2;p.ready=performance.now()+3000;p.ack=false;prestigePromoRender73();},
  prestigeAck73:()=>{if(PRESTIGE_PROMO73?.step===2&&$('prestigeAck73'))PRESTIGE_PROMO73.ack=$('prestigeAck73').checked;},
  prestigeConfirm73:()=>{
    const p=PRESTIGE_PROMO73;if(!p||p.step!==2||!$('prestigePromo73')||!$('prestigeAck73')?.checked||!p.ack||performance.now()<p.ready||!prestigeEligible73()||prestigeBusy73()||p.prestige!==(S.prestige||0))return;
    p.executing=true;p.snapshot=prestigeSnapshot73();const before=S.prestige||0;performPrestige();
    if((S.prestige||0)>before){PRESTIGE_PROMO73=null;save(true);}else{p.executing=false;toast('Переход пока недоступен. Заверши активную игру и попробуй снова.','bad');}
  },
  prestigeLater73:()=>{PRESTIGE_PROMO73=null;closeModal();save(true);}
});
const prestigeTabBefore73=EXTRA_TABS.tasks.prestige;
EXTRA_TABS.tasks.prestige=()=>`<section class="prestige-guide73"><h3>Новый круг — постоянный рост</h3><p>Престиж возвращает тебя к началу истории, но каждый новый круг проходит быстрее благодаря постоянным бонусам. Это добровольный сброс развития ради долгосрочного усиления.</p>${S.prestigeGift73?'<div class="info-card">Разовое предложение уже получено. Постоянно действуют: опыт ×1,5 и базовый курс бутылок 1,5 рубля. Повторного получения стартовых денег и крышек нет.</div>':prestigeEligible73()?`${prestigeBenefits73()}<button class="btn primary wide" data-act="prestigeOpen73">Рассмотреть разовое предложение</button>`:''}</section>${prestigeGallery73()}${prestigeTabBefore73()}`;
function prestigeAuto73(){if(!LOADED||!S.storySeen||!S.tut?.done||currentScreen!=='game'||document.hidden||S.prestigeOffer73?.seen||!prestigeEligible73()||prestigeBusy73()||returnIsArriving()||!popupTurn(3))return;prestigeOpen73();}
HOOKS.tick.push(prestigeAuto73);
