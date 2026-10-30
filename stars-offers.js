// One visible Stars recommendation at a time; no deferred advertising queue.
const STARS_OFFER_GAP=30*60000,STARS_OFFER_DAILY=3,STARS_OFFER_FIRST=3*60000;
let STARS_ACTIVE=0,STARS_TICK_AT=0,STARS_AFTER_WINDOW=0;
function starsOffersEnabled(){return S.settings?.newcomerOffers!==false;}
function starsOfferPool(){return newcomerWindow()?['n_pocket','n_focus','n_shift','n_energy','n_growth','b_week']:['b_week','n_growth','n_energy','b_cases','n_focus'];}
function starsOfferProduct(now=Date.now()){
 const pool=starsOfferPool(),st=newcomerOfferState();
 const id=pool[(Math.floor(now/(6*3600000))+(st.index||0))%pool.length];
 const p=NEWCOMER_PACKS.find(p=>p.id===id)||BUNDLES.find(p=>p.id===id);
 return p?{...p,price:promoPrice(p),contents:p.items||newcomerContents(p)}:null;
}
function starsOfferCard(p){return `<section class="stars-offer-card"><span class="stars-offer-art">${p.emoji}</span><small>НАБОР ЗА TELEGRAM STARS</small><h3>${p.name}</h3><ul>${p.contents.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><button class="btn primary wide" data-act="starsOfferBuy" data-id="${p.id}">Купить за ⭐ ${p.price}</button><small>Таймеры VIP и ускорителей идут с зачисления, в том числе вне игры.</small></section>`;}
function starsOfferSafe(){return LOADED&&!document.hidden&&S.storySeen&&S.tut?.done&&level()>=2&&currentScreen==='game'&&!newcomerActivity()&&!MG_PENDING&&!CUT&&!modalOpen()&&!returnIsArriving()&&!(RETURN_ARRIVAL?.active&&!RETURN_ARRIVAL.shown);}
function starsOfferReady(now=Date.now()){
 if(!starsOffersEnabled()||!starsOfferSafe()||STARS_ACTIVE<STARS_OFFER_FIRST||STARS_ACTIVE-STARS_AFTER_WINDOW<STARS_OFFER_FIRST)return false;
 const st=newcomerOfferState(),count=st.day===mskDay(now)?st.count:0;
 return count<STARS_OFFER_DAILY&&now>=Number(st.snoozeUntil||0)&&now-Number(st.lastAt||0)>=STARS_OFFER_GAP;
}
function starsOfferShow(){
 if(!starsOfferReady()||!popupTurn(4))return false;
 const p=starsOfferProduct();if(!p)return false;
 const st=newcomerOfferState();if(st.day!==mskDay()){st.day=mskDay();st.count=0;}
 st.count=(st.count||0)+1;st.index=(st.index||0)+1;st.lastAt=Date.now();STARS_AFTER_WINDOW=STARS_ACTIVE;save();
 openModal(`<div class="stars-offer-window">${starsOfferCard(p)}<p>Покупка необязательна. Весь сюжет доступен без неё.</p><button class="btn wide" data-act="starsOfferLater">Позже · напомнить через час</button><button class="btn wide" data-act="newcomerOpen">Все наборы</button><button class="stars-offer-mute" data-act="newcomerReminders">Не показывать предложения</button></div>`,{center:true});
 return true;
}
function starsOfferRefresh(now=Date.now()){
 const panel=$('starsOfferPanel');if(!panel)return;
 const st=newcomerOfferState();panel.hidden=!starsOffersEnabled()||!S.storySeen||!S.tut?.done||level()<2||document.hidden||!!S.busy||!!(st.panelUntil>now);
 const old=$('returnOffer');if(old)old.hidden=true;
 if(panel.hidden)return;
 const p=starsOfferProduct(now);if(!p){panel.hidden=true;return;}
 const key=p.id+':'+p.price+':'+I18N.lang;if(panel.dataset.offer===key)return;
 panel.dataset.offer=key;panel.innerHTML=`<button class="stars-offer-peek" data-act="starsOfferOpen" data-id="${p.id}"><span>${p.emoji}</span><div><small>НАБОР ЗА STARS</small><b>${p.name}</b><em>${esc(p.contents.slice(0,2).join(' · '))}</em></div><strong>⭐ ${p.price}<small>Состав ›</small></strong></button><button class="stars-offer-dismiss" data-act="starsOfferHide" aria-label="Скрыть предложение на час">×</button>`;
}
ACTIONS.starsOfferOpen=id=>{
 const p=NEWCOMER_PACKS.find(p=>p.id===id)||BUNDLES.find(p=>p.id===id);if(!p)return;
 const st=newcomerOfferState();st.snoozeUntil=Math.max(st.snoozeUntil||0,Date.now()+STARS_OFFER_GAP);save();
 openModal(`<div class="stars-offer-window">${starsOfferCard({...p,price:promoPrice(p),contents:p.items||newcomerContents(p)})}<button class="btn wide" data-act="newcomerOpen">Все наборы</button><button class="btn wide" data-act="close">Закрыть</button><button class="stars-offer-mute" data-act="newcomerReminders">Не показывать предложения</button></div>`,{center:true});
};
ACTIONS.starsOfferBuy=id=>{const st=newcomerOfferState();st.snoozeUntil=Date.now()+3600000;save();return ACTIONS.prem(id);};
ACTIONS.starsOfferLater=()=>{newcomerOfferState().snoozeUntil=Date.now()+3600000;save();closeModal();};
ACTIONS.starsOfferHide=()=>{const st=newcomerOfferState();st.panelUntil=Date.now()+3600000;st.snoozeUntil=Math.max(st.snoozeUntil||0,st.panelUntil);save();starsOfferRefresh();};
const starsShopBefore=ACTIONS.newcomerOpen;
ACTIONS.newcomerOpen=()=>{const st=newcomerOfferState();st.snoozeUntil=Math.max(st.snoozeUntil||0,Date.now()+STARS_OFFER_GAP);save();return starsShopBefore();};
const starsReminderBefore=ACTIONS.newcomerReminders;
ACTIONS.newcomerReminders=()=>{const r=starsReminderBefore();starsOfferRefresh();return r;};
for(const id of Object.keys(PREM_GIVE)){
 const give=PREM_GIVE[id];PREM_GIVE[id]=function(...args){const result=give.apply(this,args);const st=newcomerOfferState();st.snoozeUntil=Date.now()+3600000;st.panelUntil=Date.now()+3600000;return result;};
}
HOOKS.init.push(()=>{const panel=document.createElement('aside');panel.id='starsOfferPanel';panel.className='stars-offer-panel';panel.hidden=true;$('scene').after(panel);});
HOOKS.hud.push(()=>starsOfferRefresh());
function starsOfferTick(){
 const now=Date.now(),elapsed=STARS_TICK_AT?Math.min(5000,Math.max(0,now-STARS_TICK_AT)):0;STARS_TICK_AT=now;
 if(LOADED&&!document.hidden&&S.storySeen&&S.tut?.done)STARS_ACTIVE+=elapsed;
 starsOfferShow();
}
HOOKS.tick.push(starsOfferTick);
document.addEventListener('visibilitychange',()=>{STARS_TICK_AT=Date.now();starsOfferRefresh();});
