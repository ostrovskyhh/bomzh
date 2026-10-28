// One set of calculations for all four city catalogues, UI and offline accrual.
function businessRates(b, st={lvl:1}, vip=isVip()) {
  const lvl=Math.max(1,Math.min(BIZ_MAX_LVL,Number(st.lvl)||1));
  const prestige=prestigeMult(), gang=1+clanBonus(), boss=1+.05*perk('boss');
  const base=b.income*(1+.5*(lvl-1));
  const staff=b.id==='club'?clubMult():1;
  const turnover=base*prestige*gang*boss*(vip?2:1)*staff;
  const wages=b.id==='club'?clubSalary():0, operating=Math.max(0,turnover-wages);
  return {base,turnover,wages,operating,tax:operating*BIZ_TAX,net:operating*(1-BIZ_TAX),prestige,gang,boss,staff,vip};
}
function businessPocket(amount) { return amount-(alimonyOn()?Math.round(amount*ALIMONY_SHARE):0); }
function businessNetRate(b,st=incomeBusiness(b)) { const n=businessRates(b,st).net; return n*(alimonyOn()?1-ALIMONY_SHARE:1); }
function businessPayout(st) { const beforeAlimony=Math.floor(Math.max(0,st.cash||0)*(1-BIZ_TAX)+1e-8); return {beforeAlimony,net:businessPocket(beforeAlimony)}; }
function businessSnapshot(b,st) {
  return {plain:businessRates(b,st,false).operating,vip:businessRates(b,st,true).operating,vipUntil:Math.max(0,Number(S.vipUntil)||0)};
}
function businessPrepare(b,st,now) {
  st.lvl=Math.max(1,Math.min(BIZ_MAX_LVL,Math.floor(Number(st.lvl)||1)));
  st.cash=Number.isFinite(st.cash)?Math.max(0,st.cash):0;
  if(!Number.isFinite(st.last)||st.last<=0)st.last=now;
  if(st.version!==2){st.broken=false;delete st.eventAt;st.version=2;}
  if(!st.rates||!Number.isFinite(st.rates.plain)||!Number.isFinite(st.rates.vip))st.rates=businessSnapshot(b,st);
}
function businessTick(now=Date.now()) {
  if(!S.biz||typeof S.biz!=='object')S.biz={};
  if(!S.clubStaff||typeof S.clubStaff!=='object'||!S.biz.club)S.clubStaff={};
  for(const b of BUSINESSES){
    const st=S.biz[b.id];if(!st)continue;
    businessPrepare(b,st,now);
    if(now<st.last)continue; // A clock rollback must not create a second accrual interval.
    const r=st.rates,split=Math.min(now,Math.max(st.last,r.vipUntil||0));
    const credit=(from,to,vip)=>{const rate=Math.max(0,vip?r.vip:r.plain),cap=rate*BIZ_CAP_HOURS*(vip?2:1);st.cash=Math.max(st.cash,Math.min(cap,st.cash+rate*Math.max(0,to-from)/3600000));};
    if(st.last<split)credit(st.last,split,true);
    credit(split,now,false);
    st.last=now;st.rates=businessSnapshot(b,st);
  }
}
HOOKS.load.push(()=>businessTick());
function businessTotals(){
  return BUSINESSES.reduce((a,b)=>{const st=S.biz[b.id];if(st){a.owned++;a.rate+=businessNetRate(b,st);a.cash+=businessPayout(st).net;if(st.cash>=bizCap(b,st))a.full++;}return a;},{owned:0,rate:0,cash:0,full:0});
}
function businessStaffCost(s){const club=BUSINESSES.find(b=>b.id==='club');return Math.round(s.price*(staffLvl(s.id)+1)*club.price/12000000);}
function businessStaffGain(s){const club=BUSINESSES.find(b=>b.id==='club'),r=businessRates(club,S.biz.club),scale=club.price/12000000;return (r.turnover/r.staff*s.boost-s.salary*scale)*(1-BIZ_TAX)*(alimonyOn()?1-ALIMONY_SHARE:1);}
function businessInvestment(b,st){const staff=b.id==='club'?STAFF.reduce((sum,s)=>{const n=staffLvl(s.id);return sum+s.price*n*(n+1)/2*b.price/12000000;},0):0;return b.price+staff+Array.from({length:Math.max(0,st.lvl-1)},(_,i)=>bizUpgradeCost(b,{lvl:i+1})).reduce((a,n)=>a+n,0);}
function businessCollect(ids,btn){
  businessTick();let collected=0,count=0;
  for(const id of ids){const st=S.biz[id];if(!st)continue;const p=businessPayout(st);if(p.beforeAlimony<1)continue;
    st.cash=Math.max(0,st.cash-p.beforeAlimony/(1-BIZ_TAX));
    const before=S.money;addMoney(p.beforeAlimony);const paid=S.money-before;collected+=paid;count++;
    S.stats.bizEarned=(S.stats.bizEarned||0)+paid;track('bizCollect');
  }
  if(!count)return;
  if(btn)flyCoins(btn,$('resMoney'),8);
  toast(`💼 Получено ${incomeMoney(collected)}${count>1?' из '+count+' касс':''} · все удержания учтены`,'good');
}
Object.assign(ACTIONS,{
  bizBuy:(id)=>{const b=BUSINESSES.find(x=>x.id===id);if(!b||S.biz[id]||level()<b.level||S.money<b.price)return;
    businessTick();S.money-=b.price;S.biz[id]={lvl:1,cash:0,last:Date.now(),started:Date.now(),version:2,broken:false};businessTick();track('bizBuy');sfx('buy');confetti(30);toast(`${b.emoji} ${b.name} открыт! Доход ${incomeMoney(businessNetRate(b))}/ч`,'good');},
  bizCollect:(id,btn)=>{if(BUSINESSES.some(b=>b.id===id))businessCollect([id],btn);},
  bizCollectAll:(_,btn)=>businessCollect(BUSINESSES.map(b=>b.id),btn),
  bizUp:(id)=>{const b=BUSINESSES.find(x=>x.id===id),st=S.biz[id];if(!b||!st||st.lvl>=BIZ_MAX_LVL)return;const cost=bizUpgradeCost(b,st);if(S.money<cost)return;
    businessTick();S.money-=cost;st.lvl++;st.rates=businessSnapshot(b,st);track('bizUp');sfx('buy');toast(`${b.emoji} Уровень ${st.lvl}: ${incomeMoney(businessNetRate(b,st))}/ч`,'good');},
  // Cached clients may still send repair actions. Legacy equipment is restored free.
  bizFix:(id)=>{const b=BUSINESSES.find(x=>x.id===id),st=S.biz[id];if(!b||!st)return;businessTick();st.broken=false;},
  hireStaff:(id)=>{const s=STAFF.find(x=>x.id===id);if(!s||!S.biz.club||staffLvl(id)>=STAFF_MAX)return;const cost=businessStaffCost(s);if(S.money<cost)return;
    businessTick();S.money-=cost;S.clubStaff[id]=staffLvl(id)+1;S.biz.club.rates=businessSnapshot(BUSINESSES.find(b=>b.id==='club'),S.biz.club);track('staff');sfx('buy');toast(`${s.emoji} ${s.name}: уровень ${staffLvl(id)}. Зарплата уже учтена в прибыли`,'good');},
  clubParty:()=>{businessTick();const st=S.biz.club;if(!st||!staffLvl('dj')||cdLeft('clubParty')>0)return;const m=incomePartyGain();if(m<=0){toast('Сначала освободи кассу клуба','bad');return;}
    st.cash+=m;setCd('clubParty',PARTY_CD);track('clubParty');confetti(60);sfx('jackpot');resultModal({emoji:'🎉',title:'Аншлаг!',text:`В кассу поступило ${incomeMoney(m)}. К получению после всех удержаний: ${incomeMoney(businessPocket(Math.floor(m*(1-BIZ_TAX))))}.`,btn:'Отлично'});},
  bizDetails:(id)=>businessDetails(id),
});
function businessDetails(id){
  const b=BUSINESSES.find(x=>x.id===id);if(!b)return;businessTick();const st=incomeBusiness(b),r=businessRates(b,st),up=incomeUpgradeGain(b);
  openModal(`<div class="business-detail"><div class="business-emblem">${b.emoji}</div><h3>${esc(b.name)}</h3><p>Расчёт для тебя прямо сейчас · ${st.lvl}/${BIZ_MAX_LVL}</p>
    <dl><dt>База с уровнем бизнеса</dt><dd>${incomeMoney(r.base)}/ч</dd><dt>Престиж</dt><dd>×${r.prestige.toFixed(2)}</dd><dt>Деловая жилка</dt><dd>×${r.boss.toFixed(2)}</dd><dt>Банда</dt><dd>×${r.gang.toFixed(2)}</dd><dt>VIP</dt><dd>×${r.vip?2:1}</dd>${b.id==='club'?`<dt>Персонал</dt><dd>×${r.staff.toFixed(2)}</dd>`:''}<dt>Выручка</dt><dd>${incomeMoney(r.turnover)}/ч</dd><dt>Зарплаты</dt><dd>−${incomeMoney(r.wages)}/ч</dd><dt>Налог 10%</dt><dd>−${incomeMoney(r.tax)}/ч</dd>${alimonyOn()?`<dt>Алименты ${ALIMONY_SHARE*100}%</dt><dd>−${incomeMoney(r.net*ALIMONY_SHARE)}/ч</dd>`:''}<dt><b>Твоя чистая прибыль</b></dt><dd><b>${incomeMoney(businessNetRate(b,st))}/ч</b></dd></dl>
    <p>+50% базового дохода за каждый уровень. ${st.lvl<BIZ_MAX_LVL?`Следующий уровень: +${incomeMoney(up)}/ч за ${incomeMoney(bizUpgradeCost(b,st))}.`:'Предприятие полностью развито.'}</p><p>Случайных поломок и потерь кассы больше нет. Платить за ремонт не нужно. Бонусы к работе, тапам и опыту не умножают бизнес — здесь перечислены именно его бонусы.</p><button class="btn primary wide" data-act="close">Понятно</button></div>`);
}
function businessCard(b){
  const st=S.biz[b.id],preview=incomeBusiness(b),rate=businessNetRate(b,preview),can=level()>=b.level;
  return `<article class="business-card ${st?'owned':can?'available':'locked'}" data-business="${b.id}"><div class="business-card-head"><div class="business-emblem">${b.emoji}</div><div><small>${st?'ТВОЁ ПРЕДПРИЯТИЕ':can?'МОЖНО ОТКРЫТЬ':'С '+b.level+' УРОВНЯ'}</small><h3>${esc(b.name)}</h3>${st?`<div class="business-level">${Array.from({length:BIZ_MAX_LVL},(_,i)=>`<i class="${i<st.lvl?'on':''}"></i>`).join('')}<span>${st.lvl}/${BIZ_MAX_LVL}</span></div>`:''}</div></div>
    <div class="business-rate">${incomeHTML('biz-rate',b.id)}<small>/ час чистыми</small></div><div class="business-day">${incomeHTML('biz-day',b.id)} за сутки при текущих бонусах и свободной кассе</div>
    ${st?`<div class="business-till"><span>К получению <b>${incomeHTML('biz-cash',b.id)}</b></span><div class="progress"><div data-income-progress="${b.id}" style="width:${Math.min(100,st.cash/bizCap(b,st)*100)}%"></div></div><small>${incomeHTML('biz-fill',b.id)}</small></div><button class="btn primary wide" data-business-collect="${b.id}" data-act="bizCollect" data-id="${b.id}" ${businessPayout(st).beforeAlimony<1?'disabled':''}>Забрать из кассы</button>
      ${st.lvl<BIZ_MAX_LVL?`<div class="business-upgrade"><b>Следующий уровень</b><span>+${incomeHTML('biz-upgain',b.id)}/ч · окупится за ${incomeHTML('biz-uppayback',b.id)}</span>${priceBtn('bizUp',b.id,bizUpgradeCost(b,st),S.money>=bizUpgradeCost(b,st),'Улучшить · '+incomeMoney(bizUpgradeCost(b,st)))}</div>`:'<p class="business-max">✦ Максимальный уровень · +200% к базе</p>'}`:
      `<p class="business-payback">Покупка окупится за ${incomeHTML('biz-payback',b.id)} при текущих бонусах</p>${can?priceBtn('bizBuy',b.id,b.price,S.money>=b.price,'Открыть · '+incomeMoney(b.price)):reqHTML({level:b.level})}`}
    <button class="business-more" data-act="bizDetails" data-id="${b.id}">Из чего складывается прибыль →</button></article>`;
}
function businessStaffHTML(){
  if(!S.biz.club)return '';const b=BUSINESSES.find(b=>b.id==='club');
  return `<section class="business-staff"><div class="subhead">${b.emoji} Команда · ${esc(b.name)}</div><p>Каждый сотрудник увеличивает выручку. Зарплата списывается из неё автоматически — на карточке уже чистая прибыль.</p>${STAFF.map(s=>{const l=staffLvl(s.id),cost=businessStaffCost(s);return card({thumb:s.emoji,title:`${s.name} · ${l}/${STAFF_MAX}`,desc:l>=STAFF_MAX?'Команда полностью обучена':`Ещё <b>+${incomeHTML('biz-staffgain',s.id)}/ч</b> чистыми<br>Окупаемость найма: ${incomeHTML('biz-staffpayback',s.id)}`,btn:l>=STAFF_MAX?'<button class="btn" disabled>Максимум</button>':priceBtn('hireStaff',s.id,cost,S.money>=cost,(l?'Обучить · ':'Нанять · ')+incomeMoney(cost))});}).join('')}
    <div class="business-party"><b>🎉 Вечеринка с аншлагом</b><p>Раз в 6 часов добавляет до 4 часов дохода в свободную часть кассы. Нужен диджей. Сейчас: ${incomeHTML('biz-party','club')} до налога.</p>${cdLeft('clubParty')>0?timerBtn(S.cd.clubParty):`<button class="btn primary wide" data-income-party="1" data-act="clubParty" ${staffLvl('dj')&&incomePartyGain()>0?'':'disabled'}>Устроить вечеринку</button>`}</div></section>`;
}
function businessDashboard(){
  businessTick();const t=businessTotals(),owned=BUSINESSES.filter(b=>S.biz[b.id]),available=BUSINESSES.filter(b=>!S.biz[b.id]);
  return `<div class="business-dashboard" data-business-city="${city()}"><header class="business-hero"><small>ПАССИВНЫЙ ДОХОД · ${esc({zas:'Засранск',msk:'Москвабад',mex:'Мексика',fr:'Франция'}[city()])}</small><h2>Твоё дело</h2><p>Открой. Развивай. Забирай прибыль.</p><div class="business-metrics"><div><small>Все предприятия / час</small><b>${incomeHTML('biz-total')}</b></div><div><small>Готово к получению</small><b>${incomeHTML('biz-allcash')}</b></div></div><button class="btn primary wide" data-business-all="1" data-act="bizCollectAll" ${t.cash>=1?'':'disabled'}>Забрать со всех бизнесов</button><p>Касса на <b>${incomeHTML('biz-hours')} ч</b> · работает и без тебя</p><p>Получено с обновления 4.35: <b>${incomeHTML('biz-lifetime')}</b></p></header>
    <details class="business-how"><summary>Как зарабатывать на бизнесе</summary><p>1. Открой доступное предприятие. Деньги автоматически копятся в его кассе, даже когда игра закрыта.</p><p>2. Забирай прибыль одной кнопкой. При полной кассе доход приостанавливается, деньги не теряются.</p><p>3. Развивай предприятие: каждый из 5 уровней даёт +50% базовой выручки. На карточке — прирост чистой прибыли и время окупаемости.</p><p>Обычная касса — 24 часа, с VIP — 48 часов и двойная выручка. При окончании VIP уже заработанные деньги сохраняются. Временный бонус учитывается только пока он действует.</p><p>Налог 10%, зарплаты клуба и действующие алименты уже вычтены из показанной прибыли. Престиж, «Деловая жилка» и бонус банды учтены. Проверок со штрафами и случайных поломок больше нет.</p><p>При переезде и престиже предприятия сбрасываются по правилам главы; достижения и статистика заработка сохраняются. Забери кассы до отъезда.</p></details>
    ${owned.length?`<div class="subhead">Мои предприятия · ${owned.length}/${BUSINESSES.length}</div>${owned.map(businessCard).join('')}`:'<div class="business-empty">🏪 <b>Первое дело — первый стабильный доход</b><p>Выбери доступный бизнес ниже. Базовая покупка окупается примерно за 15–17 часов работы, с бонусами — быстрее.</p></div>'}
    ${available.length?`<div class="subhead">Расширить дело</div>${available.map(businessCard).join('')}`:''}${businessStaffHTML()}</div>`;
}
EXTRA_TABS.life.business=businessDashboard;
// Lifetime earnings are retained in S.stats by prestigeProfile(). Existing ownership goals keep their IDs.
ACHS.push({id:'bizIncome',name:'Доходное дело',emoji:'💼',fn:()=>S.stats.bizEarned||0,goals:[10000,100000,1000000,10000000,100000000],unit:'заработано на бизнесах'});
TASK_POOL.push({id:'bizCollect',text:()=> 'Забери прибыль из бизнеса',base:1,grow:0,need:()=>BUSINESSES.some(b=>!!S.biz[b.id])});
GO_KEYS.bizCollect=['life','business','[data-business-collect]:not([disabled])','Забери накопившуюся прибыль'];
GO_KEYS.bizBuy=['life','business','.business-card.available','Открой доступное предприятие'];
GO_KEYS.bizUp=['life','business','.business-upgrade','Улучши своё предприятие'];
