// Consistent city prices in the shared internal currency. Stars and caps are never rescaled.
const CITY_PRICE_FACTOR=c=>1.4**(CITIES[c||city()]?.idx||0);
const CITY_RATE_FACTOR=c=>1.3**(CITIES[c||city()]?.idx||0);
const CITY_PRICE_BASE_468=[];
function rememberCityPrices(table,fields=['price']){for(const item of table||[]){if(!item||typeof item!=='object')continue;for(const field of fields)if(Number.isFinite(item[field]))CITY_PRICE_BASE_468.push({item,field,value:item[field]});}}
for(const table of [FOOD,MEDS,HOUSING,EDU,TRANSPORT,LEISURE,DATES,GIFTS,WEDDINGS,CLINICS,GYMS,BUSINESSES,PETS,PET_FOOD,BOTTLE_SKINS])rememberCityPrices(table,['price','rent','util','bill']);
for(const list of Object.values(CLOTHES))rememberCityPrices(list);
rememberCityPrices(STAFF,['price','salary']);rememberCityPrices(Object.values(PET_SICK));rememberCityPrices(TRANSPORT.map(t=>t.garage).filter(Boolean));
const CITY_RING_BASE_468={...RING_OF},CITY_ALLOW_BASE_468={...ALLOW_OF};
function cityPrices468(){const k=CITY_PRICE_FACTOR();for(const row of CITY_PRICE_BASE_468)row.item[row.field]=(row.value===0?0:Math.max(1,Math.round(row.value*k)))*(row.afterRounding||1);
 GIRLS.forEach((g,i)=>{RINGS[i]=Math.round((CITY_RING_BASE_468[g.id]||10000)*k);ALLOWANCE[i]=Math.round((CITY_ALLOW_BASE_468[g.id]||1000)*k);});}
const cityPriceApplyBefore=applyCity;applyCity=function(...args){const out=cityPriceApplyBefore.apply(this,args);cityPrices468();return out;};
HOOKS.load.push(cityPrices468);
const bottleRateBefore468=bottleRate;bottleRate=function(t=Date.now()){return bottleRateBefore468(t)*CITY_RATE_FACTOR();};
familyPrice=base=>Math.round(base*CITY_PRICE_FACTOR());
HOOKS.load.push(()=>{if(S.cd)delete S.cd.date;});
const dateMenuNoWaitBefore=openDateMenu;openDateMenu=function(...args){if(S.cd)delete S.cd.date;return dateMenuNoWaitBefore.apply(this,args);};
const goDateNoWaitBefore=goDate;goDate=function(...args){if(S.cd)delete S.cd.date;return goDateNoWaitBefore.apply(this,args);};
const halloweenDateNoWaitBefore=ACTIONS.halloweenDate;ACTIONS.halloweenDate=function(...args){if(S.cd)delete S.cd.date;return halloweenDateNoWaitBefore.apply(this,args);};
const vipInfoCapacityBefore=dnInfoData;dnInfoData=function(id){const data=vipInfoCapacityBefore(id);if(id==='vip'&&data)data.lines.push({e:'🏪',t:'Бизнесы: до 12 часов накопления',d:'Без VIP — 6 часов. Уже накопленные деньги сохраняются.'});return data;};
