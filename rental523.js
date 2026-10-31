// Rental time: active play by day, wall time during Moscow's [00:00,07:00) window.
// billDue remains a device-clock UI deadline; the saved duration uses the existing server clock.
const RENT_HOUR523=3600000,RENT_DAY523=24*RENT_HOUR523,RENT_NIGHT523=7*RENT_HOUR523;
// First eligible night:01Nov2026 00:00Moscow. Legacy saves never acquire pre-policy night debt.
const RENT_POLICY_START523=Date.UTC(2026,9,31,21);
function rentalNow523(){const value=businessNow();return Number.isFinite(value)?value:null;}
function rentalDay523(t){return Math.floor((t+3*RENT_HOUR523)/RENT_DAY523)*RENT_DAY523-3*RENT_HOUR523;}
function rentalNight523(t=rentalNow523()){return Number.isFinite(t)&&t-rentalDay523(t)<RENT_NIGHT523;}
function rentalInvoiceNight523(t){return rentalNight523(t)||t-rentalDay523(t)===RENT_NIGHT523;}
function rentalKey523(){return [S.prestige||0,city(),S.housing,S.housingMode].join(':');}
function rentalInit523(now,force=false){
 const old=S.rent523,key=rentalKey523();
 if(!force&&old?.key===key&&Number.isFinite(old.last)&&Number.isFinite(old.left))return old;
 const wall=Date.now(),seen=Number(S.billSeen)||wall,gap=wall-seen;
 const left=force?MONTH_MS:Number(S.billDue)?S.billDue-(gap>=BILL_PAUSE_GAP?seen:wall):MONTH_MS;
 const last=force?now:Math.max(Math.min(now,RENT_POLICY_START523),Math.min(now,seen));
 return S.rent523={key,last,left:Number.isFinite(left)?left:MONTH_MS,nightDebt:0,nightBills:0,parked:!force&&gap>=BILL_PAUSE_GAP,quotedDue:S.billDue};
}
function rentalInvoice523(st,at,night,summary){
 if(Number(S.autopayUntil)>at){summary.covered++;return true;}
 const fee=billAmount(),previous=Math.max(0,Number(S.debt)||0);
 if(!night&&previous>0)S.missed=(Number(S.missed)||0)+1;
 S.debt=previous+fee;summary.charged+=fee;
 if(night){st.nightDebt=(st.nightDebt||0)+fee;st.nightBills=(st.nightBills||0)+1;}
 else if(S.missed>=2){evict();delete S.rent523;return false;}
 return true;
}
function rentalSegment523(st,from,to,nightOnly,summary){
 const elapsed=Math.max(0,to-from);let next=st.left;
 while(next<=elapsed){
  const at=from+Math.max(0,next);
  if(!rentalInvoice523(st,at,nightOnly||rentalInvoiceNight523(at),summary))return false;
  next+=MONTH_MS;
 }
 st.left=next-elapsed;return true;
}
function rentalOffline523(st,from,to,summary){
 // Only actual night segments consume the rental duration while the app is closed.
 for(let cursor=from;cursor<to;){
  const day=rentalDay523(cursor),end=day+RENT_NIGHT523;
  if(cursor<end){const until=Math.min(end,to);if(!rentalSegment523(st,cursor,until,true,summary))return false;cursor=until;}
  else cursor=Math.min(day+RENT_DAY523,to);
 }
 return true;
}
function rentalBilling523(){
 if(S.housingMode!=='rent'||S.housing<3)return;
 const now=rentalNow523();if(now===null)return; // Never invent overnight fees from an unconfirmed device clock.
 const st=rentalInit523(now);if(now<st.last)return;
 if(st.quotedDue!==S.billDue&&Number.isFinite(S.billDue)){st.left=S.billDue-Date.now();st.last=now;}
 st.nightDebt=Math.min(Math.max(0,st.nightDebt||0),Math.max(0,S.debt||0));if(!st.nightDebt)st.nightBills=0;
 const gap=now-st.last,summary={covered:0,charged:0};
 const ok=st.parked||gap>=BILL_PAUSE_GAP?rentalOffline523(st,st.last,now,summary):rentalSegment523(st,st.last,now,false,summary);
 if(!ok)return;
 st.last=now;st.parked=document.hidden;S.billSeen=Date.now();S.billDue=Date.now()+st.left;st.quotedDue=S.billDue;
 if(summary.covered)track('autopay');
 if(summary.charged){if(!rentalNight523(now))sfx('notify');toast((rentalNight523(now)?'🌙 Ночная аренда к утру: ':'🧾 Аренда к оплате: ')+cityMoney(S.debt),rentalNight523(now)?'':'bad');}
}
HOOKS.load.push(()=>{if(S.rent523)S.rent523.parked=true;rentalBilling523();});
HOOKS.track.push(key=>{if(['rent','house'].includes(key)){delete S.rent523;if(key==='rent'){const now=rentalNow523();if(now!==null)rentalInit523(now,true);}}});
document.addEventListener('visibilitychange',()=>{rentalBilling523();if(S.rent523)S.rent523.parked=document.hidden;});
const rentalPayBefore523=ACTIONS.payBills;ACTIONS.payBills=function(...args){const result=rentalPayBefore523(...args);if(S.debt===0&&S.rent523){S.rent523.nightDebt=0;S.rent523.nightBills=0;}return result;};
const rentalHousingBefore523=housingBillHTML522;
function rentalTimeLabel523(){const left=S.rent523?.left;if(!Number.isFinite(left)||rentalNow523()===null)return '—';const text=leftText(Math.max(0,left));return typeof I18N!=='undefined'?I18N.t(text):text;}
function rentalBillState523(){return JSON.stringify([city(),S.debt,S.missed,S.rent523?.nightDebt||0,S.rent523?.nightBills||0,rentalNight523(),rentalNow523()!==null,S.money>=S.debt,typeof I18N!=='undefined'?I18N.lang:'ru']);}
function rentalNightNote523(){
 if(rentalNow523()===null)return 'Проверяем время для расчёта аренды. Счёт обновится после подключения.';
 return rentalNight523()?'🌙 До 07:00 МСК аренда копится без просрочек и выселения. С утра нужно оплатить всю ночную сумму.':S.rent523?.nightDebt>0?'☀️ Ночная льгота закончилась в 07:00 МСК. Накопленную сумму нужно оплатить; обычные просрочки учитываются со следующего дневного счёта.':'С 00:00 до 07:00 МСК ночные счета копятся без новых просрочек. Утром их нужно оплатить; днём действуют обычные сроки.';
}
housingBillHTML522=function(h,due){
 if(S.housingMode!=='rent')return rentalHousingBefore523(h,due);
 const nightly=Math.min(S.debt||0,S.rent523?.nightDebt||0);
 return `<div class="info-card ${S.debt>0?'warn':''}" data-housing-bill522 data-housing-bill523 data-state523="${esc(rentalBillState523())}">🔑 Аренда: <b>${currencyMoney511(h.rent)}</b> за 3 часа. Коммуналка включена.<p data-rent-night523>${rentalNightNote523()}</p>${nightly?`<p>Начислено ночью: <b>${currencyMoney511(nightly)}</b> · счетов: ${S.rent523.nightBills}</p>`:''}<p>Всего к оплате: <b>${currencyMoney511(S.debt||0)}</b>${S.missed?' · просрочек: '+S.missed:''}</p><p>Следующий счёт через <b><span data-rent-time523 data-i18n-ignore>${rentalTimeLabel523()}</span></b>. Днём вне игры отсчёт приостановлен; ночью с 00:00 до 07:00 МСК он продолжается.</p>${S.debt>0?priceBtn('payBills','',S.debt,S.money>=S.debt,'Оплатить '+currencyMoney511(S.debt)):''}</div>`;
};
const rentalDebtBefore523=ACTIONS.debtOpen;ACTIONS.debtOpen=()=>{if(S.housingMode!=='rent')return rentalDebtBefore523();rentalBilling523();openModal('<h3>Счета аренды</h3>'+housingBillHTML522(HOUSING[S.housing],S.billDue)+'<button class="btn wide" data-act="close">Закрыть</button>',{center:true});};
function rentalBillRefresh523(){if(S.housingMode!=='rent')return;const signature=rentalBillState523();for(const el of document.querySelectorAll('[data-housing-bill523]'))if(el.dataset.state523!==signature){const t=document.createElement('template');t.innerHTML=housingBillHTML522(HOUSING[S.housing],S.billDue);const next=t.content.firstElementChild;el.replaceWith(next);fillIcons(next);}const label=rentalTimeLabel523();for(const el of document.querySelectorAll('[data-rent-time523]'))if(el.textContent!==label)el.textContent=label;}
HOOKS.hud.push(rentalBillRefresh523);HOOKS.screen.push(rentalBillRefresh523);
function rentalDebtPin523(){return `<span>${rentalNight523()?'🌙':'🧾'}</span><div><b>Аренда к оплате: ${currencyMoney511(S.debt)}</b><small>${rentalNight523()?'До 07:00 МСК без новых просрочек · оплатить утром':'Нажми, чтобы оплатить ночные и текущие счета'}</small></div>`;}
