// Единые расчёты начисления и живого отображения дохода конкретного игрока.
function jobSalary(j, performance=1.25, rank=jobRank(j.id)) {
  const road=JOB_GAMES[j.id]?.type==='lanes'?1+transportJobBonus():1;
  return Math.round(j.pay*performance*mods().work*POS_MULT[rank]*road*(j.physical?1+S.strength/200:1));
}
function jobFuelCost(j){return JOB_GAMES[j.id]?.type==='lanes'&&S.transport&&!S.transportBroken?(vehicle().fuel||0):0;}
function jobNetSalary(j){const pay=jobSalary(j),after=pay-(alimonyOn()?Math.round(pay*ALIMONY_SHARE):0);return Math.max(-S.money,after-jobFuelCost(j));}
function incomeMoney(value){
  if(typeof cityMoney==='function')return cityMoney(value);
  const mexican=typeof isMex==='function'&&isMex();
  return (mexican?'$':'')+(mexican?value/USD_RATE:value).toLocaleString('ru-RU',{maximumFractionDigits:2})+(mexican?'':' ₽');
}
function incomeBusiness(b){return S.biz[b.id]||{lvl:1,broken:false};}
function incomeAfterTax(amount){return amount*(1-businessTaxRate());}
function businessBuyForecast535(b) {
  const count = businessOwnedCount();
  const oldTax = businessTaxRate(count);
  const newTax = businessTaxRate(count + 1);
  const personalShare = alimonyOn() ? 1 - ALIMONY_SHARE : 1;
  const newRate = businessRates(b, { lvl: 1, broken: false }).operating * (1 - newTax) * personalShare;
  const taxIncrease = newTax - oldTax;
  const existing = taxIncrease ? BUSINESSES.reduce((total, asset) => {
    const owned = S.biz[asset.id];
    return total + (owned ? businessRates(asset, owned).operating : 0);
  }, 0) : 0;
  const increment = newRate - existing * taxIncrease * personalShare;
  const change = Math.abs(increment) < 1e-6 ? 0 : increment;
  return { newRate, change, hours: change > 0 ? b.price / change : Infinity };
}
function businessBuyCopy535(forecast) {
  const en = typeof I18N !== 'undefined' && I18N.lang === 'en';
  const { change, hours } = forecast;
  if (change < 0) {
    const loss = incomeMoney(Math.abs(change));
    return en ? `City profit falls by ${loss}/h after tax.` : `Прибыль в городе снизится на ${loss}/ч из-за налога.`;
  }
  if (change === 0) return en ? 'City profit stays the same.' : 'Прибыль в городе не вырастет.';
  const gain = incomeMoney(change);
  const time = en ? I18N.t(incomeHours(hours)) : incomeHours(hours);
  return en ? `City profit +${gain}/h · payback ~${time} at current rates` : `Прибыль в городе +${gain}/ч · окупаемость около ${time} при текущей ставке`;
}
function incomeUpgradeGain(b){const st=incomeBusiness(b);return businessNetRate(b,{...st,lvl:st.lvl+1})-businessNetRate(b,st);}
function incomePartyGain(){const b=BUSINESSES.find(b=>b.id==='club'),st=S.biz.club;return b&&st?Math.max(0,Math.min(Math.round(bizIncome(b,st)*4),bizCap(b,st)-st.cash)):0;}
function incomeHours(hours){if(!Number.isFinite(hours)||hours<0)return '— (нет дохода)';if(hours<1)return Math.max(1,Math.ceil(hours*60))+' мин';return hoursText(hours);}
function incomeText(kind,id){
  const j=JOBS.find(j=>j.id===id),b=BUSINESSES.find(b=>b.id===id);
  if(kind==='job')return j?incomeMoney(jobSalary(j)):null;
  if(kind==='job-net') {if(!j)return null;return alimonyOn()||jobFuelCost(j)?`После ${[alimonyOn()?'алиментов':'',jobFuelCost(j)?'бензина':''].filter(Boolean).join(' и ')}: до ${incomeMoney(jobNetSalary(j))}`:'';}
  if(kind==='job-details')return j?`База ${incomeMoney(j.pay)} · результат до 125% · должность ×${POS_MULT[jobRank(id)]} · активные бонусы и состояния ×${mods().work.toFixed(3)} (VIP: ${isVip()?'действует':'нет'}, усилитель: ${isBoost()?'действует':'нет'}; учтены навыки, настроение, престиж, семья, питомец и коллекции)${j.physical?` · сила ×${(1+S.strength/200).toFixed(2)}`:''}${JOB_GAMES[id]?.type==='lanes'?` · транспорт ×${(1+transportJobBonus()).toFixed(2)} · бензин ${incomeMoney(jobFuelCost(j))}`:''}`:null;
  if(kind==='biz-lifetime')return incomeMoney(S.stats.bizEarned||0);
  if(kind==='biz-allcash')return incomeMoney(businessTotals().cash);
  if(kind==='biz-staffgain'||kind==='biz-staffpayback'){const s=STAFF.find(s=>s.id===id);if(!s||!S.biz.club)return null;return kind==='biz-staffgain'?incomeMoney(businessStaffGain(s)):incomeHours(businessStaffCost(s)/businessStaffGain(s));}
  if(kind==='biz-hours')return String(BIZ_CAP_HOURS*(isVip()?2:1));
  if(kind==='biz-total')return incomeMoney(BUSINESSES.reduce((sum,b)=>sum+(S.biz[b.id]?businessNetRate(b,S.biz[b.id]):0),0));
  if(kind==='biz-note')return 'Учтены престиж, Деловая жилка, VIP, уровень и персонал. Налог, зарплаты и действующие алименты вычтены.';
  if(!b)return null;
  if(!S.biz[b.id] && ['biz-rate','biz-payback','biz-investment'].includes(kind)) {
    const forecast = businessBuyForecast535(b);
    if(kind==='biz-rate')return incomeMoney(forecast.newRate);
    if(kind==='biz-payback')return incomeHours(forecast.hours);
    return businessBuyCopy535(forecast);
  }
  const st=incomeBusiness(b),rate=businessNetRate(b,st);
  if(kind==='biz-day')return incomeMoney(rate*24);
  if(kind==='biz-cash')return incomeMoney(businessPayout(st).net);
  if(kind==='biz-party')return incomeMoney(incomePartyGain());
  if(kind==='biz-fill'){const cap=bizCap(b,st),gross=bizIncome(b,st);return (st.cash||0)>=cap?'касса полная, доход стоит — забери':gross>0?'заполнится через '+leftText(Math.max(0,cap-(st.cash||0))/gross*3600000):'дохода пока нет';}
  if(kind==='biz-rate')return incomeMoney(rate);
  if(kind==='biz-payback')return incomeHours(rate>0?b.price/rate:Infinity);
  if(kind==='biz-upgain')return incomeMoney(incomeUpgradeGain(b));
  if(kind==='biz-uppayback'){const gain=incomeUpgradeGain(b);return incomeHours(gain>0?bizUpgradeCost(b,st)/gain:Infinity);}
  return null;
}
function incomeHTML(kind,id='') {return `<span data-income-kind="${kind}" data-income-id="${esc(id)}">${esc(incomeText(kind,id)||'')}</span>`;}
function incomeRefresh(){
  document.querySelectorAll('.screen.active [data-business-collect], #modalRoot [data-business-collect]').forEach(el=>{const st=S.biz[el.dataset.businessCollect];el.disabled=!st||businessPayout(st).beforeAlimony<1;});
  document.querySelectorAll('.screen.active [data-business-all], #modalRoot [data-business-all]').forEach(el=>el.disabled=businessTotals().cash<1);
  document.querySelectorAll('.screen.active [data-income-party]').forEach(el=>{el.disabled=!staffLvl('dj')||incomePartyGain()<=0||cdLeft('clubParty')>0;});
  document.querySelectorAll('.screen.active [data-income-progress]').forEach(el=>{const b=BUSINESSES.find(b=>b.id===el.dataset.incomeProgress),st=b&&S.biz[b.id];if(!st)return;const cap=bizCap(b,st),pct=cap>0?Math.min(1,st.cash/cap):0;el.style.width=pct*100+'%';el.style.background=pct>=1?'var(--red)':'';});
  document.querySelectorAll('.screen.active [data-income-kind], #modalRoot [data-income-kind]').forEach(el=>{const value=incomeText(el.dataset.incomeKind,el.dataset.incomeId);if(value!==null&&el.textContent!==value)el.textContent=value;});
}
let INCOME_REFRESH_AT=0;
HOOKS.tick.push(()=>{const now=Date.now();if(now-INCOME_REFRESH_AT>=1000){INCOME_REFRESH_AT=now;incomeRefresh();}});
