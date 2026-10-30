// Notifications contain receipts, never deferred balance mutations. Closing cannot lose a reward.
let RETURN_ARRIVAL=null,RETURN_CAPTURE='',RETURN_EXPLICIT=false,RETURN_COLLECTING=false;
function returnState(){
 S.returnInbox||={items:[],away:0};if(!Array.isArray(S.returnInbox.items))S.returnInbox.items=[];
 const clean=[],releases=new Map();
 for(const note of S.returnInbox.items){
  if(note.action!=='release'){clean.push(note);continue;}
  if(isAdminRelease(String(note.key).replace(/^release:/,''))){
   const publicNews=newsForVersion(note.arg);if(!publicNews.length)continue;
   note.key='release:'+publicNews[0].v;note.title='Что нового · '+publicNews[0].v;note.body=publicNews[0].title;
  }
  const previous=releases.get(note.key);
  if(previous){previous.read=!!previous.read&&!!note.read;if(CHANGELOG.findIndex(c=>c.v===note.arg)>CHANGELOG.findIndex(c=>c.v===previous.arg))previous.arg=note.arg;continue;}
  releases.set(note.key,note);clean.push(note);
 }
 S.returnInbox.items=clean;return S.returnInbox;
}
function returnPlain(html){const t=document.createElement('template');t.innerHTML=String(html||'').replace(/<br\s*\/?>/gi,'\n');return (t.content.textContent||'').trim();}
function returnIsArriving(){return !!RETURN_ARRIVAL?.active&&Date.now()<RETURN_ARRIVAL.until;}
function returnPrepare(from){
  if(!S.storySeen||Date.now()-from<60000||RETURN_ARRIVAL?.from===from)return;
  const now=Date.now();RETURN_ARRIVAL={from,active:true,shown:false,ready:now+8000,until:now+30000};returnState().away=Math.floor((now-from)/1000);
}
function returnNotice(note){
  const st=returnState(),key=String(note.key||('notice:'+Date.now()));
  if(st.items.some(n=>n.key===key))return;
  if(note.action==='release'){const older=st.items.filter(n=>!n.read&&n.action==='release');for(const n of older)if(CHANGELOG.findIndex(c=>c.v===n.arg)>CHANGELOG.findIndex(c=>c.v===note.arg))note.arg=n.arg;st.items=st.items.filter(n=>n.read||n.action!=='release');}
  st.items.unshift({key,kind:note.kind||'event',title:String(note.title||'Событие'),body:returnPlain(note.body),money:Number(note.money)||0,caps:Number(note.caps)||0,action:note.action||'',arg:note.arg||'',at:Date.now(),read:false});
  st.items=st.items.slice(0,100);save();returnRefresh();
}
function returnOfflineIncome(from,seconds,money){if(seconds>=60)returnNotice({key:'offline:'+from,kind:'income',title:'Доход за отсутствие',body:'Начислено на баланс с учётом удержаний.',money});}
function returnManagedIncome(receipts){const total=receipts.reduce((n,r)=>n+r.received,0);if(total>0)returnNotice({key:'managed:'+receipts.map(r=>r.city+':'+r.name+':'+r.through).join('|'),kind:'income',title:'Бизнесы под управлением компании',body:'Комиссия компании и удержания уже учтены.',money:total});}
function returnUnread(){return returnState().items.filter(n=>!n.read);}
function returnItemHTML(n){
  const language=n.action==='release'?releaseLanguage():null,t=text=>language&&typeof I18N!=='undefined'?I18N.inLanguage(text,language):text;
  return `<article class="rh-item ${n.read?'read':''}" ${language?`data-i18n-ignore lang="${language}"`:''}><div><span>${{income:'💰',gift:'🎁',news:'📰',event:'🔔'}[n.kind]||'🔔'}</span><b>${esc(t(n.title))}</b>${n.money>0?`<strong>+${incomeMoney(n.money)}</strong>`:''}${n.caps>0?`<strong>+${fmt(n.caps)} крышек</strong>`:''}</div><p>${esc(t(n.body)).replace(/\n/g,'<br>')}</p>${n.action?`<button class="btn small" data-act="returnOpen" data-id="${esc(n.key)}">${t('Подробнее ›')}</button>`:''}</article>`;
}
function returnBody(all=false){
  // Settle with the same trusted clock used by collection before showing the till.
  if(typeof businessTick==='function')businessTick();
  const st=returnState(),items=all?st.items:returnUnread(),money=items.reduce((n,x)=>n+x.money,0),cash=typeof businessTotals==='function'?businessTotals().cash:0;
  return `<header class="rh-head"><div class="rh-avatar">${valeraSVG(S.eq,lookState())}</div><div><small>С ВОЗВРАЩЕНИЕМ</small><h2>Вот что произошло, пока ты отходил</h2><p>${st.away?`Тебя не было ${playFmt(st.away*1000)}`:'Все важные события в одном месте'}</p></div></header>
    ${money>0?`<section class="rh-income"><small>Уже начислено на баланс</small><b>+${incomeMoney(money)}</b></section>`:''}
    ${cash>=1?`<section class="rh-till"><b>🏪 В кассах бизнесов: <span data-return-cash>${incomeMoney(cash)}</span></b><small>Соберём общей кнопкой, с учётом удержаний.</small></section>`:''}
    <div class="rh-items">${items.length?items.map(returnItemHTML).join(''):'<p>Новых событий нет. Можно продолжать играть.</p>'}</div>
    <p class="rh-safe">Подарки и награды уже сохранены. Повторное открытие не начисляет их заново.</p>
    <button class="btn primary wide" data-act="returnCollect">Забрать всё и играть</button><div class="rh-bottom"><button class="btn" data-act="returnLater">Позже</button><button class="btn" data-act="returnHistory">История событий</button></div>`;
}
function returnRefresh(){const el=$('returnSummary');if(el){if(typeof businessTick==='function')businessTick();const cash=businessTotals().cash,sig=returnState().items.map(n=>n.key+':'+n.read).join('|')+':'+(cash>=1)+':'+returnState().away;if(el.dataset.signature!==sig){el.innerHTML=returnBody(el.dataset.all==='1');el.dataset.signature=sig;}const value=el.querySelector('[data-return-cash]');if(value&&value.textContent!==incomeMoney(cash))value.textContent=incomeMoney(cash);}const bell=$('returnBell');if(bell){const n=returnUnread().length;bell.querySelector('b').textContent=n>99?'99+':String(n);bell.classList.toggle('unread',n>0);bell.setAttribute('aria-label','Уведомления: '+n);}}
function openReturnSummary(all=false){if(!LOADED)return;RETURN_EXPLICIT=true;try{openModal(`<section id="returnSummary" class="return-summary" data-all="${all?'1':'0'}">${returnBody(all)}</section>`,{center:true});}finally{RETURN_EXPLICIT=false;}if(RETURN_ARRIVAL)RETURN_ARRIVAL.shown=true;returnRefresh();}
ACTIONS.returnSummary=()=>openReturnSummary();ACTIONS.returnHistory=()=>openReturnSummary(true);
ACTIONS.returnLater=()=>{if(RETURN_ARRIVAL){RETURN_ARRIVAL.shown=true;RETURN_ARRIVAL.active=false;}closeModal();};
ACTIONS.returnCollect=()=>{
  if(RETURN_COLLECTING||!$('returnSummary'))return;RETURN_COLLECTING=true;
  try{businessCollect(BUSINESSES.map(b=>b.id));returnState().items.forEach(n=>n.read=true);if(RETURN_ARRIVAL){RETURN_ARRIVAL.shown=true;RETURN_ARRIVAL.active=false;}save();closeModal();returnRefresh();showScreen('game');}finally{RETURN_COLLECTING=false;}
};
ACTIONS.returnOpen=key=>{
  const n=returnState().items.find(n=>n.key===key);if(!n)return;n.read=true;save();closeModal();
  if(n.action==='release')openNews(n.arg);else if(n.action==='broadcast'&&BC_BTNS[n.arg])ACTIONS.bcGo(n.arg);else if(n.action==='company'){COMPANY.queued='';companyCall();}else if(n.action==='chest'&&S.chest)ACTIONS.chestOpen();returnRefresh();
};
function returnCapture(key,fn){const previous=RETURN_CAPTURE;RETURN_CAPTURE=key;try{return fn();}finally{RETURN_CAPTURE=previous;}}
resultModal=(function(orig){return function(data){
  if(!RETURN_EXPLICIT&&(RETURN_CAPTURE||document.hidden)){returnNotice({key:RETURN_CAPTURE||'result:'+Date.now()+':'+data.title,kind:/gift|fgift|ref/.test(RETURN_CAPTURE)?'gift':'event',title:data.title,body:data.text});return;}
  return orig(data);
};})(resultModal);
queuePopup=(function(orig){return function(key,prio,fn){
  if(prio>=5)return;
  if(/^(gift|fgift|ref$|crank|frozen)/.test(key||''))return returnCapture(key,fn);
  if(key==='company-call'){returnNotice({key:'company-call:'+(COMPANY.queued||''),kind:'event',title:'Звонок управляющей компании',body:'Есть предложение по бизнесам в прежних городах. Открой, когда будет удобно.',action:'company'});return;}
  return orig(key,prio,fn);
};})(queuePopup);
checkBusy=(function(orig){return function(){return returnIsArriving()?returnCapture('busy:'+S.busy?.id+':'+S.busy?.end,()=>orig()):orig();};})(checkBusy);
showLevelUp=(function(orig){return function(){
  if(pendingLevelUp&&(returnIsArriving()||document.hidden)){const n=pendingLevelUp;pendingLevelUp=null;returnNotice({key:'level:'+n.from+':'+n.to,kind:'event',title:'Новый уровень: '+n.to,body:'Награды за уровни уже начислены. Новые возможности доступны в разделах игры.'});return;}return orig();
};})(showLevelUp);
confetti=(function(orig){return function(...args){if(!document.hidden&&!RETURN_CAPTURE)orig(...args);};})(confetti);
sfx=(function(orig){return function(...args){if(!document.hidden&&!RETURN_CAPTURE)orig(...args);};})(sfx);
flushModalQueue=(function(orig){return function(){if(!document.hidden)return orig();};})(flushModalQueue);
HOOKS.init.push(()=>{
  const bell=document.createElement('button');bell.id='returnBell';bell.className='return-bell';bell.dataset.act='returnSummary';bell.innerHTML='🔔<b>0</b>';
  // A separate slim home row keeps the existing 320 px top bar from overflowing.
  const row=document.createElement('div');row.className='return-home-row';row.append(bell);const offers=document.createElement('button');offers.id='returnOffer';offers.className='btn small';offers.dataset.act='newcomerOpen';offers.textContent='🎒 Наборы для хорошего старта';row.append(offers);$('screen-game').prepend(row);
});
HOOKS.hud.push(()=>{returnRefresh();const offer=$('returnOffer');if(offer)offer.hidden=!(newcomerWindow()&&S.settings.newcomerOffers!==false&&S.tut?.done&&level()>=2);});
showNewcomerOffer=()=>{}; // Inline shelf replaces automatic sales modals; manual shop remains available.
HOOKS.tick.push(()=>{
  if(RETURN_ARRIVAL?.active&&!RETURN_ARRIVAL.shown&&Date.now()>=RETURN_ARRIVAL.ready&&S.storySeen&&S.tut?.done&&!S.busy&&popupTurn(1)){if(returnUnread().length||businessTotals().cash>=1)openReturnSummary();else RETURN_ARRIVAL.shown=true;}
});
prestigeProfile=(function(orig){return ()=>({...orig(),returnInbox:returnState()});})(prestigeProfile);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){GAME_AWAY_AT=Date.now();$('toastRoot')?.replaceChildren();}
  else{
    nextMiniAt=Date.now()+rand(70,140)*1000;nextEventAt=Date.now()+rand(180,320)*1000;
    // Backlogged informational popups are folded into the inbox; important choices keep their queue.
    const queued=POPUP_Q.splice(0);for(const q of queued)queuePopup(q.key,q.prio,q.fn);
    setTimeout(()=>{if(!document.hidden&&LOADED){giftClaim();frClaim();broadcastCheck();payClaim();if(S.storySeen)refSync();}},500);
  }
},true);
