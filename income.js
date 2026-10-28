// Единые расчёты начисления и живого отображения дохода конкретного игрока.
function jobSalary(j, performance=1.25, rank=jobRank(j.id)) {
  const road=JOB_GAMES[j.id]?.type==='lanes'?1+transportJobBonus():1;
  return Math.round(j.pay*performance*mods().work*POS_MULT[rank]*road*(j.physical?1+S.strength/200:1));
}
function jobFuelCost(j){return JOB_GAMES[j.id]?.type==='lanes'&&S.transport&&!S.transportBroken?(vehicle().fuel||0):0;}
function jobNetSalary(j){const pay=jobSalary(j),after=pay-(alimonyOn()?Math.round(pay*ALIMONY_SHARE):0);return Math.max(-S.money,after-jobFuelCost(j));}
function incomeMoney(value){
  const mexican=typeof isMex==='function'&&isMex();
  return (mexican?'$':'')+(mexican?value/USD_RATE:value).toLocaleString('ru-RU',{maximumFractionDigits:2})+(mexican?'':' ₽');
}
function incomeBusiness(b){return S.biz[b.id]||{lvl:1,broken:false};}
function incomeAfterTax(amount){return amount*(1-BIZ_TAX);}
function incomeUpgradeGain(b){const st=incomeBusiness(b);return incomeAfterTax(bizIncome(b,{...st,lvl:st.lvl+1})-bizIncome(b,st));}
function incomePartyGain(){const b=BUSINESSES.find(b=>b.id==='club'),st=S.biz.club;return b&&st?Math.max(0,Math.min(Math.round(bizIncome(b,st)*4),bizCap(b,st)*1.5-st.cash)):0;}
function incomeHours(hours){if(!Number.isFinite(hours)||hours<0)return '— (нет дохода)';if(hours<1)return Math.max(1,Math.ceil(hours*60))+' мин';return hoursText(hours);}
function incomeText(kind,id){
  const j=JOBS.find(j=>j.id===id),b=BUSINESSES.find(b=>b.id===id);
  if(kind==='job')return j?incomeMoney(jobSalary(j)):null;
  if(kind==='job-net') {if(!j)return null;return alimonyOn()||jobFuelCost(j)?`После ${[alimonyOn()?'алиментов':'',jobFuelCost(j)?'бензина':''].filter(Boolean).join(' и ')}: до ${incomeMoney(jobNetSalary(j))}`:'';}
  if(kind==='job-details')return j?`База ${incomeMoney(j.pay)} · результат до 125% · должность ×${POS_MULT[jobRank(id)]} · активные бонусы и состояния ×${mods().work.toFixed(3)} (VIP: ${isVip()?'действует':'нет'}, усилитель: ${isBoost()?'действует':'нет'}; учтены навыки, настроение, престиж, семья, питомец, коллекции и банда)${j.physical?` · сила ×${(1+S.strength/200).toFixed(2)}`:''}${JOB_GAMES[id]?.type==='lanes'?` · транспорт ×${(1+transportJobBonus()).toFixed(2)} · бензин ${incomeMoney(jobFuelCost(j))}`:''}`:null;
  if(kind==='biz-hours')return String(BIZ_CAP_HOURS*(isVip()?2:1));
  if(kind==='biz-total')return incomeMoney(BUSINESSES.reduce((sum,b)=>sum+(S.biz[b.id]?incomeAfterTax(bizIncome(b,S.biz[b.id])):0),0));
  if(kind==='biz-note')return `Учтены престиж, бонус банды, ${isVip()?'VIP ×2, ':''}уровень и состояние бизнеса, а у клуба — персонал и его зарплаты.${alimonyOn()?' Алименты удерживаются отдельно при получении денег.':''}`;
  if(!b)return null;
  const st=incomeBusiness(b),rate=incomeAfterTax(bizIncome(b,st));
  if(kind==='biz-cash')return incomeMoney(incomeAfterTax(st.cash||0));
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
  document.querySelectorAll('.screen.active [data-income-party]').forEach(el=>{el.disabled=!staffLvl('dj')||incomePartyGain()<=0||cdLeft('clubParty')>0;});
  document.querySelectorAll('.screen.active [data-income-progress]').forEach(el=>{const b=BUSINESSES.find(b=>b.id===el.dataset.incomeProgress),st=b&&S.biz[b.id];if(!st)return;const cap=bizCap(b,st),pct=cap>0?Math.min(1,st.cash/cap):0;el.style.width=pct*100+'%';el.style.background=pct>=1?'var(--red)':'';});
  document.querySelectorAll('.screen.active [data-income-kind], #modalRoot [data-income-kind]').forEach(el=>{const value=incomeText(el.dataset.incomeKind,el.dataset.incomeId);if(value!==null&&el.textContent!==value)el.textContent=value;});
}
let INCOME_REFRESH_AT=0;
HOOKS.tick.push(()=>{const now=Date.now();if(now-INCOME_REFRESH_AT>=1000){INCOME_REFRESH_AT=now;incomeRefresh();}});
