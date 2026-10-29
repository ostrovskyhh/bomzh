// Owner-approved income ladder for Zasransk, based on the item-count scrap economy.
const ZAS_CRIME_BASE={pocket:18000,kiosk:60000,car:150000,atm:550000};
const ZAS_CRIME_IDS=['pocket','kiosk','car','metal','atm'];
function zasCrimeScale(lvl=level()){return 1+Math.max(1,lvl)*.04;}
function zasCrimeBase(id,perf=1,lvl=level(),carK=1){return Math.round((ZAS_CRIME_BASE[id]||0)*zasCrimeScale(lvl)*clamp(perf,0,1.2)*carK);}
function zasCrimeReference(id,lvl=level(),rank=crimeRank()){
  const raw=id==='metal'?Math.round(SCRAP_TYPES.reduce((n,it)=>n+it.value*5,0)*zasCrimeScale(lvl)):zasCrimeBase(id,1,lvl);
  return Math.round(raw*(1+rank*CRIME_RANK_MONEY));
}
for(const it of SCRAP_TYPES)it.value=Math.round(it.value*1.45);
for(const c of CRIMES.filter(c=>ZAS_CRIME_BASE[c.id])){
  c._ranked=false;
  c.reward=(perf,mg)=>{
    if(c.id==='car'){
      if((mg?.mistakes||0)>=3)return 0;
      const index=rand(0,CARS.length-1);S.lastCar=CARS[index];return zasCrimeBase(c.id,perf,level(),[.85,1,1.15][index]);
    }
    return zasCrimeBase(c.id,perf);
  };
}
function zasCrimeIncomeHTML(){
  if(city()!=='zas'||!crimeOpen())return '';
  return `<section class="crime-income"><h3>🕶️ Доходность дел Засранска</h3><p>Чем выше дело в криминальной карьере, тем больше награда за чистую попытку. Качество прохождения и ранг влияют на добычу.</p><div class="crime-income-list">${ZAS_CRIME_IDS.map(id=>{const c=CRIMES.find(c=>c.id===id);return c?`<div><span>${c.emoji} ${c.name}</span><b>${incomeMoney(zasCrimeReference(id))}</b><small><span>${id==='metal'?'Ориентир: 20 предметов поровну, без ошибок':id==='car'?'Ориентир: все штифты, обычная машина':'Ориентир: результат 100%'}</span> · ${c.energy} ⚡ · ${Math.round(c.cd/60)} мин</small></div>`:'';}).join('')}</div><small>Бонус твоего ранга уже включён. Суммы до удержаний: ошибки, штрафы, алименты и задержание снижают итог. При задержании добыча изымается. Цветмет: каждый предмет оплачивается отдельно; три ошибки завершают сбор.</small></section>`;
}
const crimeTabBefore457=EXTRA_TABS.fun.crime;
EXTRA_TABS.fun.crime=()=>zasCrimeIncomeHTML()+crimeTabBefore457();
