// Reviewed retail base prices; the existing 40% city progression remains centralized.
const SHOP471_FOOD={bread:6,doshik:18,coffee:45,cheburek:35,energetik:100,shaurma:95,pelmeni:180,stolovka:400,protein:650,lunch:1200,sushi:3200,steak:12000,chef:60000,caviar:160000};
const SHOP471_MED={rassol:20,coal:35,rennie:50,shampoo:150,ointment:180,antibiotics:750,vitamins:300};
const SHOP471_CLOTH={hat:{shapka:50,ushanka:350,kepka:3500,cilinder:60000},body:{telnyashka:150,base:250,pukhovik:3000,malinovy:28000,kostum:110000},shoes:{tapki:80,base:180,kedy:1800,boots:35000}};
function shop471Round(v){const step=v>=100000?1000:v>=10000?100:v>=1000?50:v>=100?10:1;return Math.max(1,Math.round(v/step)*step);}
const SHOP471_GROUPS=new Map();
for(const [table,kind] of [[FOOD,'food'],[MEDS,'med'],[HOUSING,'housing'],[EDU,'edu'],[TRANSPORT,'transport'],[PETS,'pet'],[PET_FOOD,'petfood'],[BOTTLE_SKINS,'bottle'],[LEISURE,'service'],[DATES,'service'],[GIFTS,'service'],[WEDDINGS,'service'],[CLINICS,'service'],[GYMS,'service']])for(const it of table)SHOP471_GROUPS.set(it,kind);
for(const t of TRANSPORT)if(t.garage)SHOP471_GROUPS.set(t.garage,'garage');
for(const [slot,list] of Object.entries(CLOTHES))for(const it of list)SHOP471_GROUPS.set(it,'cloth:'+slot);
const SHOP471_CHANGED=[];
for(const row of CITY_PRICE_BASE_468){const kind=SHOP471_GROUPS.get(row.item);if(!kind||!row.value||row.item.caps||row.item.premium||row.item.rewardOnly||row.item.ach||row.item.pvp||row.item.season)continue;
 let value=row.value;
 if(row.field==='price'){
  if(kind==='food')value=SHOP471_FOOD[row.item.id]??row.value;
  else if(kind==='med')value=SHOP471_MED[row.item.id]??row.value;
  else if(kind==='housing')value=[0,200,1000,6000,30000,180000,1200000][HOUSING.indexOf(row.item)]??row.value;
  else if(kind==='edu')value=[0,200,1800,9000,45000,200000][EDU.indexOf(row.item)]??row.value;
  else if(kind.startsWith('cloth:'))value=SHOP471_CLOTH[kind.slice(6)]?.[row.item.id]??shop471Round(row.value*(row.value>=30000?.9:1.1));
  else value=shop471Round(row.value*(row.value>=30000?.9:1.1));
 }else if(kind==='housing')value=shop471Round(row.value*(HOUSING.indexOf(row.item)===6?.8:1.1));
 if(value!==row.value){SHOP471_CHANGED.push({kind,field:row.field,before:row.value,after:value});row.value=value;}
}
// Optional alternatives only: essential food/medicine and a cash route to job clothing remain available.
for(const [slot,id] of [['hat','cilinder'],['body','malinovy'],['shoes','boots']]){const it=CLOTHES[slot].find(x=>x.id===id);if(it)it.payBottles=true;}
for(const id of ['ferret','rabbit']){const p=PETS.find(x=>x.id===id);if(p)p.payBottles=true;}
for(const id of ['bt_amber','bt_milk','bt_agave','bt_fr_parfum']){const b=bottleById(id);if(b)b.payBottles=true;}
function shopBottleCost(item){if(!item?.payBottles)return 0;const min=10000*1.15**CITIES[city()].idx;return Math.ceil(Math.max(min,item.price*2.5/(.8*CITY_RATE_FACTOR()))/100)*100;}
function shopCanPay(item,n=1){return !!item&&Number.isSafeInteger(n)&&n>0&&(item.payBottles?S.bottles>=shopBottleCost(item)*n:S.money>=item.price*n);}
function shopPay(item,n=1){if(!shopCanPay(item,n))return false;if(item.payBottles){const cost=shopBottleCost(item)*n;S.bottles-=cost;S.stats.bottlesSpent=(S.stats.bottlesSpent||0)+cost;}else S.money-=item.price*n;return true;}
function shopBottleLabel(item){return fmt(shopBottleCost(item))+' 🍾';}
const shopPriceBefore471=priceBtn;priceBtn=function(act,id,price,can,label){let it;
 if(act==='cloth'){const [slot,key]=String(id).split(':');it=CLOTHES[slot]?.find(x=>x.id===key);}
 if(act==='petBuy')it=PETS.find(x=>x.id===id);
 if(!it?.payBottles)return shopPriceBefore471(act,id,price,can,label);
 const allowed=act==='petBuy'?level()>=(it.level||1)&&CITIES[city()].idx>=(it.homeCity||0)&&!it.quest&&!it.premium:!S.owned[String(id).split(':')[0]]?.includes(it.id);
 const enough=shopCanPay(it);return `<button class="btn ${allowed&&enough?'primary':''}" data-act="${act}" data-id="${esc(id)}" ${allowed&&enough?'':'disabled'} data-currency="bottles">${shopBottleLabel(it)}</button>`;
};
const shopBottlePriceBefore471=bottlePrice;bottlePrice=b=>b.payBottles?shopBottleLabel(b):shopBottlePriceBefore471(b);
const shopRetailBefore471=RENDER.shop[1];renderShop=function(){const html=shopRetailBefore471();return ['clothes','pets','bottles'].includes(TABS.shop)?'<div class="info-card"><b>🍾 Товары за бутылки</b><p>На выбранных товарах указана цена в бутылках. Это отдельная оплата, а не рубли. Цена фиксирована для города и не зависит от текущего курса или усилителей.</p></div>'+html:html;};
RENDER.shop[1]=renderShop;
HOOKS.load.push(cityPrices468);cityPrices468();
