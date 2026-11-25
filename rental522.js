// Rental and purchase use the same city cash price; no player debt/save is rewritten.
const RENT_SHARE522=.25;
function rentalPrices522(){for(let i=3;i<HOUSING.length;i++){const h=HOUSING[i];if(h.rent>0&&Number.isFinite(h.price)&&h.price>0)h.rent=Math.max(1,Math.round(h.price*RENT_SHARE522));}}
const rentalCityPricesBefore522=cityPrices468;cityPrices468=function(...args){const result=rentalCityPricesBefore522(...args);rentalPrices522();return result;};
const rentalApplyBefore522=applyCity;applyCity=function(...args){const result=rentalApplyBefore522(...args);rentalPrices522();return result;};
HOOKS.load.push(rentalPrices522);rentalPrices522();
function rentalButton522(h){return `<span>Арендовать · ${currencyMoney511(h.rent)}</span><small data-rent-period522>за 3 часа аренды</small>`;}
function rentalCopy535(ru,en){return typeof I18N!=='undefined'&&I18N.lang==='en'?en:ru;}
function housingFees522(h){
 const utility=h.util?`<br>${rentalCopy535('При покупке','If owned')}: ${currencyMoney511(h.util)} ${rentalCopy535('коммуналки / 3 ч','utilities / 3h')}`:'';
 if(!h.rent)return utility;
 const rentCount=4;
 return `${utility}<details class="housing-cost535" data-rental-cost535><summary>${rentalCopy535('Сравнить аренду и покупку','Compare renting and buying')}</summary><p>${rentalCopy535('Покупка','Purchase')}: ${currencyMoney511(h.price)}<br>${rentalCopy535('Аренда за 3 часа','Rent for 3 hours')}: ${currencyMoney511(h.rent)}<br>${rentalCopy535('Четыре платежа аренды','Four rent payments')}: ${currencyMoney511(rentCount*h.rent)}</p></details>`;
}
function rentalInfo522(){
 const summary=rentalCopy535('Аренда · оплата каждые 3 часа','Rent · charged every 3 hours');
 const copy=rentalCopy535('Аренда стоит 25% цены покупки за период. Коммуналка входит в аренду. Вне игры днём отсчёт стоит, с 00:00 до 07:00 МСК идёт. Ночные счета нужно оплатить утром, просрочки и выселение ночью не начисляются.', 'A rental period costs 25% of the purchase price and includes utilities. The timer pauses offline during the day and runs from 00:00 to 07:00 Moscow time. Overnight bills are due in the morning, with no late penalties or eviction overnight.');
 return `<details class="rental-info522" data-rental-info522><summary>${summary}</summary><p>${copy}</p></details>`;
}
function housingBillHTML522(h,due){return `<div class="info-card ${S.debt>0?'warn':''}" data-housing-bill522>${S.housingMode==='rent'?`🔑 Аренда: <b>${currencyMoney511(h.rent)}</b> за 3 часа активной игры. Коммуналка включена.`:`🏠 Своё жильё. Коммуналка: <b>${currencyMoney511(h.util)}</b> за 3 часа активной игры.`}<br><small>${S.housingMode==='rent'?'Две просрочки аренды приводят к выселению.':'При просрочке коммуналки отключают свет.'}</small><br>Следующий счёт через <b><span data-until="${due}"></span></b>. Вне игры отсчёт приостановлен.${S.debt>0?`<br><b class="housing-debt522">Долг: ${currencyMoney511(S.debt)}${S.missed?' · просроченных периодов: '+S.missed:''}</b><div class="housing-pay522">${priceBtn('payBills','',S.debt,S.money>=S.debt,'Оплатить '+currencyMoney511(S.debt))}</div>`:''}</div>`;}
