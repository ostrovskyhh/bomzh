// Owner-approved development ideas. Optional activities; no mandatory daily chores.
function developmentIncome(){
  const jobs=JOBS.filter(j=>S.hired?.[j.id]||jobShifts(j.id)>0);
  return Math.max(30,...jobs.map(j=>jobNetSalary(j)*2),businessTotals().rate/60);
}
function developmentMoney(minutes){return Math.round(Math.min(5000000,developmentIncome()*minutes));}

// Bulk sales always show exactly which inventory snapshot is about to be sold.
let FLEA_CONFIRM=null;
ACTIONS.fleaSellAll=()=>{
  const items=[...fleaInv()];if(!items.length)return;
  const rare=items.filter(it=>!['common','uncommon'].includes(it.rar)).length;
  FLEA_CONFIRM=items;
  openModal(`<h3>Продать все ${items.length} вещей?</h3><p>Получишь ${incomeMoney(items.reduce((s,it)=>s+fleaPrice(it),0))}.</p><p>${rare?`Среди них <b>${rare} редких или более ценных</b>. Они тоже будут проданы.`:'Все вещи обычной редкости.'}</p><p>Вернуть проданные вещи нельзя.</p><button class="btn primary wide" data-act="fleaConfirm">Подтвердить продажу</button><button class="btn wide" data-act="flea">Назад к вещам</button>`);
};
ACTIONS.fleaConfirm=()=>{
  const items=FLEA_CONFIRM;FLEA_CONFIRM=null;
  if(!items||items.length!==fleaInv().length||items.some((it,i)=>fleaInv()[i]!==it)){toast('Состав вещей изменился. Проверь продажу заново.','bad');openFlea();return;}
  fleaSell(items.map((_,i)=>i));openFlea();save();
};
function caseDropFeedHTML(feed){
  return '<div class="pc-sub">Недавно выпало игрокам</div>'+(feed?.length?`<div class="drop-ribbon" aria-label="Последние реальные дропы">${feed.map(d=>{const r=RARITY.find(r=>r.id===d.rar)||RARITY[0];return `<article class="drop-card" style="--drop-color:${r.color}"><small>${esc(r.name)}</small><span>${esc(d.e)}</span><b>${esc(d.item)}</b><small data-i18n-user>${esc(d.name)} · ${new Date(d.ts*1000).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</small></article>`;}).join('')}</div>`:'<small>Пока нет дропов за последние сутки. Здесь появятся настоящие находки игроков.</small>');
}

// A first prestige starts with a working enterprise; all existing possessions stay intact.
function prestigeStarter(){
  if(!S.prestige||S.prestigeStarterGranted)return;
  S.prestigeStarterGranted=true;
  const b=BUSINESSES[0];
  if(!S.biz[b.id])S.biz[b.id]={lvl:1,cash:0,last:businessNow()||0,started:businessNow()||Date.now(),version:2,broken:false};
}
HOOKS.load.push(prestigeStarter);
performPrestige=(function(orig){return function(){const before=S.prestige||0;const r=orig.apply(this,arguments);if((S.prestige||0)>before){prestigeStarter();save();}return r;};})(performPrestige);
prestigeProfile=(function(orig){return function(){return {...orig(),prestigeStarterGranted:!!S.prestigeStarterGranted};};})(prestigeProfile);
const prestigeTabDevelopment=EXTRA_TABS.tasks.prestige;
EXTRA_TABS.tasks.prestige=()=>`<div class="info-card"><b>Выгода следующего круга</b><p>Тапы, работа, бизнес: ×${prestigeMult().toFixed(2)} → ×${(prestigeMult()+.2).toFixed(2)}.<br>Опыт: ×${(1+.1*(S.prestige||0)).toFixed(2)} → ×${(1+.1*((S.prestige||0)+1)).toFixed(2)}.</p><p>${S.prestigeStarterGranted?'Первый стартовый бизнес уже получен.':'При первом престиже — первый бизнес бесплатно, сразу приносит доход.'} Заначка: ${incomeMoney(1000+perk('capital')*10000)} на старте.</p></div>`+prestigeTabDevelopment();

// Transport contracts are signed for a known fee and payout, settled once after travel.
function transportOffer(){
  const v=vehicle(),tier=Math.max(1,S.transport||0),fuel=Math.round((v.fuel||0)*2);
  const payout=Math.max(fuel+50,developmentMoney(.5+Math.min(tier,12)*.1));
  return {fuel,payout,minutes:5+Math.min(tier,10),energy:10,tier};
}
function transportContractHTML(){
  if(!S.transport)return '<div class="info-card">Купи транспорт, чтобы брать заказы на перевозку.</div>';
  const r=S.transportRoute,o=transportOffer(),done=r&&businessNow()!==null&&businessNow()>=r.until;
  return `<div class="info-card"><b>🚚 Перевозки · ${esc(vehicle().name)}</b>${r?`<p>${done?'Груз доставлен. Награда готова.':`Доставка: <span data-until="${r.until}"></span>`}</p><button class="btn primary wide" data-act="routeClaim" ${done?'':'disabled'}>Получить ${incomeMoney(r.payout)}</button>`:`<p>${o.tier<4?'Курьерский заказ':o.tier<8?'Снабжение предприятия':'Специальная доставка для двора'} · ${o.minutes} мин.<br>Оплата ${incomeMoney(o.payout)} · топливо ${incomeMoney(o.fuel)}<br><b>Чистая выгода ${incomeMoney(businessPocket(o.payout)-o.fuel)}</b> · −10 энергии.</p><button class="btn primary wide" data-act="routeStart" ${S.transportBroken||S.busy||S.energy<10||S.money<o.fuel?'disabled':''}>Взять заказ</button>`}<small>Один активный заказ. Сумма фиксируется при отправлении, мини-игры нет.</small></div>`;
}
const transportTabDevelopment=EXTRA_TABS.shop.transport;
EXTRA_TABS.shop.transport=()=>transportContractHTML()+transportTabDevelopment();
ACTIONS.routeStart=()=>{if(S.transportRoute||!S.transport||S.transportBroken||S.busy)return;const now=businessNow();if(now===null){businessSync();toast('Проверяем время сервера. Попробуй через секунду.');return;}const o=transportOffer();if(S.energy<o.energy||S.money<o.fuel)return;S.energy-=o.energy;S.money-=o.fuel;S.transportRoute={until:now+o.minutes*60000,payout:o.payout};save();showScreen('shop','transport');};
ACTIONS.routeClaim=()=>{const r=S.transportRoute,now=businessNow();if(!r||now===null||now<r.until)return;S.transportRoute=null;addMoney(r.payout);track('transportDelivery');save();showScreen('shop','transport');};

// Honest work has its own repeatable contracts, in addition to the existing story.
function honestHTML(){
  if(S.quest?.path!=='honest')return '';
  const c=S.honestContract,done=c&&counter('honestShift')-c.base>=3;
  return `<div class="info-card"><b>🤝 Официальный заказ · ${cityName()}</b><p>Три успешные смены на любой работе. Нулевой результат не засчитывается. Дополнительная премия ${incomeMoney(c?.reward||developmentMoney(1))}.</p>${c?`<p>Выполнено ${Math.min(3,Math.max(0,counter('honestShift')-c.base))}/3</p><button class="btn green wide" data-act="honestClaim" ${done?'':'disabled'}>Получить премию</button>`:`<button class="btn primary wide" data-act="honestStart" ${cdLeft('honestContract')?'disabled':''}>${cdLeft('honestContract')?'Следующий заказ позже':'Принять заказ'}</button>`}<small>Отказ от предложения Шныря даёт отдельную премию, не чаще раза в час.</small></div>`;
}
const workTabDevelopment=EXTRA_TABS.life.work;
EXTRA_TABS.life.work=()=>honestHTML()+workTabDevelopment();
ACTIONS.honestStart=()=>{if(S.quest?.path!=='honest'||S.honestContract||cdLeft('honestContract'))return;S.honestContract={base:counter('honestShift'),reward:developmentMoney(1)};save();showScreen('life','work');};
ACTIONS.honestClaim=()=>{const c=S.honestContract;if(!c||counter('honestShift')-c.base<3)return;S.honestContract=null;setCd('honestContract',1800);addMoney(c.reward);track('honestContract');save();showScreen('life','work');};
finishJob=(function(orig){return function(j,score,mg){const r=orig.apply(this,arguments);if(score>0&&S.quest?.path==='honest')track('honestShift');return r;};})(finishJob);
HOOKS.track.push(key=>{if(['uwRefuse','bribeRefuse'].includes(key)&&S.quest?.path==='honest'&&!cdLeft('honestRefusal')){setCd('honestRefusal',3600);const m=developmentMoney(.25);addMoney(m);toast(`🤝 Премия за честность: ${incomeMoney(m)}`,'good');}});
ACTIONS.kickRefuse=(function(orig){return function(){if(!KICKBACK)return;const r=orig.apply(this,arguments);if(S.quest?.path==='honest')track('bribeRefuse');save();return r;};})(ACTIONS.kickRefuse);

// Events follow the player's current life instead of reusing starter poverty events forever.
function developmentStage(){return S.housing>=4||level()>=16?2:S.housing>=2||level()>=8?1:0;}
for(const ev of EVENTS){const cond=ev.cond;ev.cond=()=>developmentStage()===0&&(!cond||cond());}
for(const pool of [MINI_GOOD,MINI_BAD])for(const ev of pool){const cond=ev.cond;ev.cond=()=>developmentStage()===0&&(!cond||cond());}
const DEVELOPMENT_PLACES={zas:['Двор','Соседи','Районный совет'],msk:['Квартал','Деловой центр','Городская ярмарка'],mex:['Площадь мариачи','Рынок Веракруса','Праздник квартала'],fr:['Квартал у Сены','Парижская мастерская','Праздник соседей']};
for(const cid of Object.keys(DEVELOPMENT_PLACES)){
  const [a,b,c]=DEVELOPMENT_PLACES[cid];
  for(const [title,text] of [[b,'Жители готовят общую ярмарку и просят помочь с организацией.'],[c,'В квартале выбирают, как улучшить общее пространство.'],[a,'Соседи собирают команду для благоустройства.'],[a+': профессиональный совет','Соседи просят поделиться опытом с молодыми специалистами.']])EVENTS.push({emoji:'🏘️',title,get text(){const j=JOBS.filter(j=>S.hired?.[j.id]).at(-1);return text+(j?` Твой опыт (${j.name}) пригодится.`:'')+` Встреча рядом с домом: ${HOUSING[S.housing].name}.`;},cond:()=>city()===cid&&developmentStage()>0,options:[{label:'Помочь с организацией · −8 энергии, премия за 1 минуту заработка',run:()=>{if(S.energy<8)return 'Не хватает энергии: взносов и штрафов нет.';S.energy-=8;const m=developmentMoney(1);addMoney(m);addMood(6);return `Помог кварталу: +${incomeMoney(m)}, +6 радости`; }},{label:'Поддержать добрым словом · +2 радости',run:()=>{addMood(2);return 'Соседи благодарят за поддержку. +2 радости';}}]});
  MINI_GOOD.push({e:'🏙️',t:a+': благодарность за помощь',cond:()=>city()===cid&&developmentStage()>0,run:()=>{const m=developmentMoney(.2);addMoney(m);return '+'+incomeMoney(m);}});
  MINI_BAD.push({e:'🌧️',t:a+': непогода задержала планы',cond:()=>city()===cid&&developmentStage()>0,run:()=>{addMood(-3);return '−3 радости. Деньги и имущество целы';}});
}

// Every pet's friendship has a visible salary benefit in addition to its own role.
HOOKS.mods.push(m=>{if(petHappy())m.work*=1+petLevel()*.01;});
function petQuickReward(){return developmentMoney(.1+petLevel()*.01);}
petModalHTML=(function(orig){return function(){const html=orig();if(!S.pet)return html;const a=PET_ACTS.find(x=>x.id==='walk'),why=petActWhy(a),cd=petCd('walk');return `<div class="info-card"><b>Дружба ${petLevel()}: +${petLevel()}% к зарплате</b><p>Работает, пока питомец сыт и здоров. Это дополнение к его собственной роли.</p><button class="btn primary wide" data-act="petQuickWalk" ${why||cd?'disabled':''}>Быстрая прогулка · ${incomeMoney(petQuickReward())}</button><small>Без мини-игры: −10 энергии, +6 дружбы, +3 радости. Общая перезарядка с обычной прогулкой — 15 минут.</small></div>`+html;};})(petModalHTML);
ACTIONS.petQuickWalk=()=>{const a=PET_ACTS.find(x=>x.id==='walk');if(petCd('walk')||petActWhy(a))return;const money=petQuickReward();setPetCd('walk',a.cd);S.energy-=a.energy;addBond(6);addMood(3);addMoney(money);track('petWalk');save();openPetRoom();};

// Rest has immediate options, with existing mood bonuses explicitly explained.
function quickRestHTML(){return `<div class="info-card"><b>Что нужно сейчас?</b><p>⚡ Восстановиться · 💊 снять плохое состояние · 😊 поднять настроение.</p><p>Радость уже влияет на работу, тапы и милостыню: выше 80 — +15%, ниже 20 — −30%.</p><button class="btn primary wide" data-act="quickRest" ${cdLeft('quickRest')?'disabled':''}>Тихий отдых · +15% энергии, +8 радости</button><small>Бесплатно, без мини-игры. Раз в 20 минут; во время дела недоступно.</small><button class="btn wide" data-act="restHealth">Снять негативное состояние → врачи</button></div>`;}
function restGroupHTML(title,items){return `<div class="subhead">${title}</div>`+items.map(l=>{const ok=reqOk(l.req),cd=cdLeft('l_'+l.id);return card({thumb:l.emoji,title:l.name,cls:ok?'':'locked',desc:`${l.desc}<br>${joinFx([plus(l.mood,'радости'),plus(l.health,'здоровья'),plus(l.energy,'энергии')])}`,btn:!ok?lockBtn:cd>0?timerBtn(S.cd['l_'+l.id]):priceBtn('leisure',l.id,l.price,S.money>=l.price),extra:ok?'':reqHTML(l.req)});}).join('');}
renderFun=(function(orig){return function(){if(TABS.fun!=='rest')return orig();return quickRestHTML()+joyCardHTML()+restGroupHTML('⚡ Восстановление',LEISURE.filter(l=>(l.energy||0)>0||(l.health||0)>0))+restGroupHTML('💊 Снять состояние',LEISURE.filter(l=>!(l.energy>0||l.health>0)&&l.cures?.length))+restGroupHTML('😊 Развлечения',LEISURE.filter(l=>!(l.energy>0||l.health>0)&&!l.cures?.length));};})(renderFun);
ACTIONS.quickRest=()=>{if(S.busy||cdLeft('quickRest'))return;setCd('quickRest',1200);S.energy=Math.min(maxEnergy(),S.energy+maxEnergy()*.15);addMood(8);track('quickRest');save();showScreen('fun','rest');};
ACTIONS.restHealth=()=>showScreen('life','health');

// Family benefits are voluntary; adult support is capped across the whole family.
function familyMonthlyHelp(){const adults=(S.kids||[]).filter(k=>kidStage(k)==='adult');return Math.round(Math.min(developmentMoney(10),adults.reduce((n,k)=>n+developmentMoney(.5+(k.smart||0)*.3),0)));}
function familyBenefitHTML(){if(!S.married)return '';return `<div class="info-card"><b>🏡 Время с семьёй</b><p>Совместный ужин и отдых: +20% максимальной сытости, +15% энергии и +5 радости. Бесплатно, раз в 2 часа.</p><button class="btn primary wide" data-act="familyRest" ${S.busy||cdLeft('familyRest')?'disabled':''}>Побыть с семьёй</button><p>Взрослые дети: помощь ${incomeMoney(familyMonthlyHelp())} за семейный месяц (3 часа). Зависит от заработка и учёбы детей, максимум — 10 минут текущего заработка на всех.</p></div>`;}
const datesTabDevelopment=EXTRA_TABS.fun.dates;
EXTRA_TABS.fun.dates=()=>familyBenefitHTML()+datesTabDevelopment();
ACTIONS.familyRest=()=>{if(!S.married||S.busy||cdLeft('familyRest'))return;setCd('familyRest',7200);feed(Math.max(0,Math.min(maxFood()-S.food,maxFood()*.2)));S.energy=Math.min(maxEnergy(),S.energy+maxEnergy()*.15);addMood(5);track('familyRest');save();showScreen('fun','dates');};
function familyPersonSVG(child=false,sex='girl',i=0){const skin=['#dfb28e','#9d654a','#f1c8a6'][i%3],coat=child?'#d5a642':'#7495a1';return `<svg viewBox="0 0 70 150" aria-hidden="true"><ellipse cx="35" cy="143" rx="24" ry="5" fill="#171713" opacity=".3"/><path d="M23 101L21 140M47 101L49 140" stroke="#343a4b" stroke-width="12" stroke-linecap="round"/><path d="M21 137H12M49 137H58" stroke="#30271f" stroke-width="9" stroke-linecap="round"/><path d="M18 61L8 98M52 61L63 98" stroke="${coat}" stroke-width="12" stroke-linecap="round"/><path d="M18 56Q35 46 52 56L56 108H14Z" fill="${coat}"/><rect x="30" y="40" width="10" height="15" fill="${skin}"/><ellipse cx="35" cy="28" rx="18" ry="22" fill="${skin}"/><path d="M17 29Q10 0 35 3Q60 0 54 33L45 14L21 18Z" fill="#493529"/>${sex==='girl'?'<path d="M17 20L12 53L22 48V25M53 20L58 53L48 48V25" fill="#493529"/>':''}<circle cx="29" cy="29" r="2"/><circle cx="42" cy="29" r="2"/><path d="M29 39Q35 44 42 39" stroke="#824f45" fill="none" stroke-width="2"/></svg>`;}
let FAMILY_SCENE_KEY='';
HOOKS.hud.push(()=>{
  const scene=$('sceneBg')?.parentElement;if(!scene)return;
  const present=S.married&&S.girlfriend&&Date.now()%120000<45000;
  const kids=(S.kids||[]).slice(0,3),key=present?S.girlfriend+kids.map(k=>k.name+k.sex).join('|'):'';
  if(key===FAMILY_SCENE_KEY&&(!present||$('familyVisitors')))return;FAMILY_SCENE_KEY=key;
  $('familyVisitors')?.remove();if(!present)return;
  const el=document.createElement('div');el.id='familyVisitors';el.className='family-visitors';el.setAttribute('role','img');el.setAttribute('aria-label','Жена и дети пришли навестить Валеру');
  el.innerHTML=`<div class="family-wife">${familyPersonSVG()}<small>Жена</small></div>`+kids.map((k,i)=>`<div class="family-child" style="right:${i*13}%">${familyPersonSVG(true,k.sex,i+1)}<small>${esc(k.name)}</small></div>`).join('');scene.append(el);
});
ACHS.push({id:'deliveries',name:'Надёжный перевозчик',emoji:'🚚',key:'transportDelivery',goals:[1,10,50,200],unit:'доставок'},{id:'honestOrders',name:'Честное имя',emoji:'🤝',key:'honestContract',goals:[1,5,20,100],unit:'официальных заказов'},{id:'familyTime',name:'Семейный человек',emoji:'🏡',key:'familyRest',goals:[1,10,50,200],unit:'семейных встреч'});
sectionAlerts=(function(orig){return function(){const a=orig();if(a.shop)a.shop.pets=!!S.pet&&(S.petFood<=20||!!S.petSick||S.petHp<30);return a;};})(sectionAlerts);

// Four deliberate decisions, no reading timeout, no continuously rebuilt DOM.
function assemblyLaws(){
  const names={zas:['Освещение дворов','Маршрут до ПТУ','Ярмарка района','Ремонт водопровода'],msk:['Освещение кварталов','Ночной автобус','Городская ярмарка','Ремонт теплотрассы'],mex:['Освещение набережной','Автобус до рынка','Фестиваль мариачи','Ремонт водопровода'],fr:['Освещение у Сены','Ночной трамвай','Праздник соседей','Ремонт старых домов']}[city()]||[];
  return names.map((title,i)=>({title,text:['Жители просят безопасную дорогу домой.','Транспорт нужен жителям и работникам.','Местные мастера хотят провести праздник.','Сеть износилась; откладывать ремонт рискованно.'][i],yes:[[-22,18],[-18,14],[-15,12],[-20,18]][i],no:[[3,-12],[5,-12],[8,-8],[0,-20]][i]}));
}
function assemblyGame(mg){
  const laws=assemblyLaws(),log=[];let index=0,budget=75,support=55,answered=false;const began=performance.now();mg.limit=Infinity;
  const render=()=>{
    if(!mgAlive(mg))return;
    if(index===4){
      if(budget>=40&&support>=40)mgScore(2);
      const wait=Math.max(0,30000-(performance.now()-began));
      $('mgArena').innerHTML=`<div class="city-activity"><h3>Заседание завершено</h3><p>Бюджет ${budget}/100 · поддержка ${support}/100</p><div class="assembly-summary">${log.map(x=>`<p>${esc(x)}</p>`).join('')}</div><p>Результат ${mg.score}/10. 8 очков — полная оплата, 10 — максимум. ${wait?'Оформляем протокол до конца 30-секундной смены.':''}</p></div>`;
      frTimer(mg,mgEnd,wait);return;
    }
    answered=false;const law=laws[index];
    const delta=([b,s])=>`${b>=0?'+':''}${b} бюджета · ${s>=0?'+':''}${s} поддержки`;
    $('mgArena').innerHTML=`<div class="city-activity"><small>${cityName()} · закон ${index+1}/4</small><div class="assembly-meters"><b>🏛️ Бюджет ${budget}/100</b><b>👥 Поддержка ${support}/100</b></div><h3>${esc(law.title)}</h3><p>${law.text}</p><p>Сохраняй бюджет ≥20 и поддержку ≥30. Последствия известны заранее; таймера на чтение нет.</p><button class="assembly-option" data-vote="yes">Принять<small>${delta(law.yes)}</small></button><button class="assembly-option" data-vote="no">Отклонить<small>${delta(law.no)}</small></button><p id="assemblyFeedback" aria-live="polite"></p></div>`;
    for(const btn of document.querySelectorAll('[data-vote]'))frInput(btn,mg,()=>{
      if(answered)return;answered=true;document.querySelectorAll('[data-vote]').forEach(b=>b.disabled=true);
      const d=law[btn.dataset.vote];budget=clamp(budget+d[0],0,100);support=clamp(support+d[1],0,100);const good=budget>=20&&support>=30;
      if(good)mgScore(2);else mg.mistakes=(mg.mistakes||0)+1;
      const result=`${law.title}: ${btn.dataset.vote==='yes'?'принят':'отклонён'}, ${delta(d)}. ${good?'Обе шкалы сохранены: +2 очка.':'Критическая шкала: без очков.'}`;log.push(result);$('assemblyFeedback').textContent=result;
      const next=document.createElement('button');next.className='fr-option';next.textContent=index===3?'Итоги заседания':'Следующий закон';next.dataset.assemblyNext='';$('assemblyFeedback').after(next);
      frInput(next,mg,()=>{if(next.disabled)return;next.disabled=true;index++;render();});
    });
  };render();
}
function applyDevelopmentJobs(){Object.assign(JOB_GAMES.deputy,{engine:assemblyGame,duration:0,target:8,title:'Заседание: четыре закона',hint:'4 решения без таймера чтения. Балансируй бюджет и поддержку. Последствия видны до выбора. Смена от 30 секунд.'});}
applyCity=(function(orig){return function(){const r=orig.apply(this,arguments);applyDevelopmentJobs();return r;};})(applyCity);
applyDevelopmentJobs();
TASK_POOL.push({id:'honestShift',text:g=>`Заверши ${g} успешные смены на честном пути`,base:3,grow:0,lvl:2,need:()=>S.quest?.path==='honest'},{id:'transportDelivery',text:()=> 'Выполни перевозку на своём транспорте',base:1,grow:0,need:()=>S.transport>0},{id:'familyRest',text:()=> 'Проведи время с семьёй',base:1,grow:0,need:()=>!!S.married});
GO_KEYS.honestShift=['life','work','[data-act="job"]','Выполни успешные смены'];
GO_KEYS.transportDelivery=['shop','transport','[data-act="routeStart"], [data-act="routeClaim"]','Выполни перевозку'];
GO_KEYS.familyRest=['fun','dates','[data-act="familyRest"]','Проведи время с семьёй'];

