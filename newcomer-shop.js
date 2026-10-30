// Owner-approved Stars offers. All contents are guaranteed; there are no random rewards.
const NEWCOMER_PACKS=[
  {id:'n_pocket',stars:9,name:'Карманный старт',emoji:'🎒',caps:5,energy:1,vip:0,xp:0},
  {id:'n_shift',stars:39,name:'Первая большая смена',emoji:'💼',caps:15,energy:0,vip:1,xp:30},
  {id:'n_growth',stars:99,name:'Уверенный разгон',emoji:'🚀',caps:35,energy:3,vip:3,xp:120},
  {id:'n_energy',stars:19,name:'Запас энергии',emoji:'⚡',caps:0,energy:3,vip:0,xp:0},
  {id:'n_focus',stars:19,name:'Полчаса прогресса',emoji:'📚',caps:0,energy:0,vip:0,xp:30}
];
const NEWCOMER_OFFER_GAP=15*60000,NEWCOMER_OFFER_DAILY=3;
function newcomerWindow(now=Date.now()) {return city()==='zas'&&!S.prestige&&now-(S.startAt||now)<7*86400000&&level()<=12;}
function newcomerOfferState(){S.newcomerOffers||={day:mskDay(),count:0,lastAt:0,index:0,snoozeUntil:0};return S.newcomerOffers;}
function newcomerContents(p){return [p.caps?`🟡 ${p.caps} крышек`:'',p.vip?`👑 VIP: ${p.vip} дн.`:'',p.xp?`📚 Опыт ×2: ${p.xp} мин`:'',p.energy?`⚡ Энергетики: ${p.energy}`:''].filter(Boolean);}
function newcomerCard(p){return `<article class="nc-card"><div class="nc-title"><span>${p.emoji}</span><div><h3>${p.name}</h3><b>⭐ ${p.stars}</b></div></div><ul>${newcomerContents(p).map(t=>`<li>${t}</li>`).join('')}</ul><button class="btn primary wide" data-act="prem" data-id="${p.id}">Купить · ⭐ ${p.stars}</button></article>`;}
function newcomerShopHTML(){return `<section class="nc-shop"><header><small>ГАРАНТИРОВАННЫЕ НАБОРЫ</small><h3>Хорошее начало</h3><p>Выбирай помощь под свой темп. Все награды указаны заранее. Наборы доступны и опытным игрокам.</p></header>
  <div class="nc-wallet"><b>⚡ Энергетики в запасе: ${S.energyDrinks||0}</b><small>Один полностью восстанавливает энергию. Используй, когда удобно.</small><button class="btn green wide" data-act="newcomerEnergy" ${newcomerEnergyWhy()?'disabled':''}>Восстановить энергию · 1 шт.</button></div>
  <div class="nc-grid">${NEWCOMER_PACKS.map(newcomerCard).join('')}</div>
  <div class="info-card"><p>Повторная покупка добавляет крышки и энергетики, продлевает VIP и ускорение опыта. Таймеры включаются при зачислении покупки и идут в реальном времени, включая время вне игры.</p><p>VIP удваивает доход от тапов, милостыни и работы. Ускорение опыта не складывается с другим платным ускорителем: действует более сильный.</p><p>Энергетик нельзя использовать во время сна, работы, мини-игры или боя. При полной энергии он не тратится.</p></div>
  <button class="btn wide" data-act="newcomerReminders">${S.settings.newcomerOffers===false?'Включить предложения наборов':'Отключить предложения наборов'}</button></section>`;}
NEWCOMER_PACKS.forEach(p=>{PREM_GIVE[p.id]=()=>{
  if(p.caps)addCaps(p.caps);if(p.vip)dnVip(p.vip);
  if(p.xp)S.xpStarsUntil=Math.max(Date.now(),S.xpStarsUntil||0)+p.xp*60000;
  S.energyDrinks=Math.max(0,Number(S.energyDrinks)||0)+p.energy;
  const state=newcomerOfferState();state.snoozeUntil=Date.now()+60*60000;
  return `${p.emoji} ${p.name}: ${newcomerContents(p).join(' · ')}`;
};});
function newcomerActivity(){return !!S.busy||!!(MG&&!MG.over&&$('mgArena'))||!!(FIGHT&&($('f3Stage')||$('fBtns')))||!!(typeof OB!=='undefined'&&OB&&$('obRound'));}
function newcomerEnergyWhy(){return !(S.energyDrinks>0)||S.energy>=maxEnergy()||newcomerActivity();}
ACTIONS.newcomerEnergy=()=>{if(newcomerEnergyWhy())return;const inShop=!!$('donateBox');S.energyDrinks--;S.energy=maxEnergy();save();updateHud();if(inShop)donateRefresh();else closeModal();toast('⚡ Энергия восстановлена. Энергетик использован.','good');};
DN_TABS.unshift(['start','🎒','Начало']);
donateHTML=(function(orig){return function(){let html=orig();if(DN_TAB==='start'){const t=document.createElement('template');t.innerHTML=html;const hero=t.content.querySelector('.dn-hero');if(hero)hero.outerHTML=`<div class="dn-compact"><b>🎒 Хорошее начало</b><span>🟡 ${fmt(S.caps)}</span></div>`;t.content.querySelector('.dn-banner')?.remove();html=t.innerHTML;}return html;};})(donateHTML);
ACTIONS.newcomerOpen=()=>{DN_TAB='start';openDonate();};
HOOKS.init.push(()=>$('resCaps').addEventListener('click',()=>{if(newcomerWindow())DN_TAB='start';},true));
ACTIONS.newcomerLater=()=>{newcomerOfferState().snoozeUntil=Date.now()+60*60000;save();closeModal();};
ACTIONS.newcomerReminders=()=>{S.settings.newcomerOffers=S.settings.newcomerOffers===false;save();if($('donateBox'))donateRefresh();else closeModal();};
function newcomerOfferReady(now=Date.now()){
  if(!LOADED||document.hidden||!newcomerWindow(now)||S.settings.newcomerOffers===false||!S.storySeen||!S.tut?.done||level()<2||newcomerActivity()||currentScreen!=='game'||(S.play?.cur||0)<90000)return false;
  const st=newcomerOfferState();return (st.day!==mskDay(now)||st.count<NEWCOMER_OFFER_DAILY)&&now>=st.snoozeUntil&&now-st.lastAt>=NEWCOMER_OFFER_GAP;
}
function showNewcomerOffer(){
  if(!newcomerOfferReady()||!popupTurn(5))return;
  const st=newcomerOfferState();if(st.day!==mskDay()){st.day=mskDay();st.count=0;}
  const rotation=['n_pocket','n_focus','n_shift','n_energy','n_growth'];
  const p=NEWCOMER_PACKS.find(p=>p.id===rotation[st.index%rotation.length]);st.index++;st.count++;st.lastAt=Date.now();save();
  openModal(`<section class="nc-offer"><small>ПРЕДЛОЖЕНИЕ ДЛЯ НАЧАЛА ИГРЫ</small>${newcomerCard(p)}<p>Набор необязательный. Весь сюжет можно пройти без покупки.</p><div class="nc-controls"><button class="btn wide" data-act="newcomerLater">Позже</button><button class="btn wide" data-act="newcomerOpen">Все наборы и усиления</button><button class="btn wide" data-act="newcomerReminders">Не показывать предложения</button></div></section>`,{center:true});
}
HOOKS.load.push(()=>{if(newcomerWindow())S.starterOffered=true;}); // Replaces the old single starter popup.
HOOKS.tick.push(showNewcomerOffer);
prestigeProfile=(function(orig){return ()=>({...orig(),energyDrinks:S.energyDrinks||0,newcomerOffers:S.newcomerOffers||{}});})(prestigeProfile);
// Keep the consumable reachable from the energy help dialog, alongside existing free options.
energyOffer=(function(orig){return function(){const r=orig();if(S.energyDrinks>0)document.querySelector('#modalRoot [data-act="energyFix"]')?.insertAdjacentHTML('beforebegin',`<button class="btn green wide" data-act="newcomerEnergy">⚡ Использовать энергетик · в запасе ${S.energyDrinks}</button>`);return r;};})(energyOffer);
