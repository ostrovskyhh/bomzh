// Legacy ownership is a floor, never a reason to remove a player's property.
for(const i of [4,6])if(HOUSING[i])HOUSING[i].payBottles=true;
for(const i of [2,5,9])if(TRANSPORT[i])TRANSPORT[i].payBottles=true;
for(const id of ['protein','sushi','chef']){const f=FOOD.find(f=>f.id===id);if(f)f.payBottles=true;}
function purchaseProgress72(){
  if(!S.buyProgress72){S.buyProgress72={city:city(),home:Math.max(S.ownedHousing||0,S.housing||0),car:Math.max(S.transport||0,...fleet())};}
  if(S.buyProgress72.city!==city())S.buyProgress72={city:city(),home:S.ownedHousing||0,car:S.transport||0};
  return S.buyProgress72;
}
function purchaseAllowed72(kind,i){if(!Number.isSafeInteger(i)||i<1)return false;const p=purchaseProgress72();return kind==='home'?i<=Math.max(p.home,S.ownedHousing||0)+1:i<=p.car+1;}
function purchaseWhy72(kind,i){const table=kind==='home'?HOUSING:TRANSPORT,p=purchaseProgress72(),next=kind==='home'?Math.max(p.home,S.ownedHousing||0)+1:p.car+1;return `Сначала купи: ${table[Math.min(next,table.length-1)].name}`;}
HOOKS.load.push(purchaseProgress72);
HOOKS.track.push((id)=>{if(id==='house')purchaseProgress72().home=Math.max(purchaseProgress72().home,S.ownedHousing||0,S.housing);if(id==='transport'||id==='deal')purchaseProgress72().car=Math.max(purchaseProgress72().car,S.transport||0);});
const priceBefore72=priceBtn;
priceBtn=function(act,id,price,can,label){
  let item,allowed=true;
  if(act==='house'||act==='rentHouse'){item=HOUSING[+id];allowed=!!item&&level()>=item.level&&purchaseAllowed72('home',+id);}
  if(act==='buyTransport'){item=TRANSPORT[+id];allowed=!!item&&level()>=item.level&&purchaseAllowed72('car',+id)&&!ownsTransport(+id);}
  if(act==='eat'){item=FOOD.find(f=>f.id===id);allowed=!!item&&reqOk(item.req);}
  if(!item)return priceBefore72(act,id,price,can,label);
  if(!allowed){const why=act==='house'||act==='rentHouse'?purchaseWhy72('home',+id):act==='buyTransport'?purchaseWhy72('car',+id):'Нужен следующий уровень';return `<button class="btn" disabled>${esc(why)}</button>`;}
  if(item.payBottles&&act!=='rentHouse')return `<button class="btn ${shopCanPay(item)?'primary':''}" data-act="${act}" data-id="${esc(id)}" data-currency="bottles" ${shopCanPay(item)?'':'disabled'}>${shopBottleLabel(item)}</button>`;
  return priceBefore72(act,id,price,can,label);
};
for(const tab of ['housing','transport']){const old=EXTRA_TABS.shop[tab];EXTRA_TABS.shop[tab]=()=>'<div class="info-card"><b>Постепенное развитие</b><p>Покупай жильё и транспорт по порядку. Ранее купленное сохранено. Аренда не открывает следующую покупку. Продажа транспорта не отменяет пройденную ступень.</p><p>🍾 Некоторые покупки оплачиваются бутылками. Аренда, коммуналка и бензин — деньгами.</p></div>'+old().replace(/class="card /g,'class="card purchase-card72 ');}
