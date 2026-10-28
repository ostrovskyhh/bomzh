// Двор банды: сервер проверяет вклад, хранит историю и выдаёт подарки.
const YARD={data:null,at:0,loading:false,busy:false,error:''};
function yardApply(r){
  YARD.data=r;YARD.at=Date.now();YARD.error='';
  for(const key of ['yardHelp','yardStory','yardBuild']){
    const delta=Math.max(0,(r.stats?.[key]||0)-counter(key));
    if(delta)track(key,delta);
  }
}
async function yardLoad(force=false){
  if(!onlineOn()||YARD.loading||(!force&&Date.now()-YARD.at<30000))return;
  YARD.loading=true;
  try{yardApply(await apiPost('gang/yard/state'));}catch(e){YARD.error='Не удалось связаться с сервером двора. Попробуй обновить.';YARD.at=Date.now();}
  finally{YARD.loading=false;}
  if(currentScreen==='fun'&&TABS.fun==='clan')renderCurrent(false);
}
HOOKS.load.push(()=>{if(onlineOn())setTimeout(()=>yardLoad(true),1500);});
HOOKS.tick.push(()=>{if(onlineOn()&&S.storySeen&&Date.now()-YARD.at>60000)yardLoad();});
HOOKS.track.push(key=>{if(['taps','shift','trash','sold','eat'].includes(key)&&currentScreen==='fun'&&TABS.fun==='clan'&&onlineOn()){clearTimeout(YARD.syncTimer);YARD.syncTimer=setTimeout(async()=>{save(true);await serverWrite();await yardLoad(true);},400);}});
showScreen=(function(orig){return function(name,tab){const r=orig(name,tab);if(name==='fun'&&tab==='clan'&&onlineOn())setTimeout(async()=>{save(true);await serverWrite();await yardLoad(true);},0);return r;};})(showScreen);
function yardReady(){return inGang()&&!!YARD.data;}
function yardArt(buildings){
  const built=new Set(buildings.filter(b=>b.built).map(b=>b.id));
  return `<svg class="yard-scene" viewBox="0 0 600 230" role="img" aria-label="Общий двор банды: ${built.size} из 3 объектов открыто"><defs><linearGradient id="yardSky" x2="0" y2="1"><stop stop-color="#373b63"/><stop offset="1" stop-color="#b87864"/></linearGradient></defs>
    <rect width="600" height="230" rx="18" fill="url(#yardSky)"/><circle cx="510" cy="44" r="21" fill="#f7dc9d"/>
    <path d="M0 119h600v111H0z" fill="#51413a"/><path d="M0 188q150-35 300 0t300 0v42H0z" fill="#726052"/>
    <g class="${built.has('garage')?'yard-built':'yard-unbuilt'}"><path d="M32 114l80-52 80 52" fill="#846450"/><rect x="43" y="113" width="138" height="80" rx="5" fill="#a78965"/><rect x="62" y="128" width="99" height="65" fill="#353b3e"/><path d="M66 141h91m-91 13h91m-91 13h91" stroke="#777e79" stroke-width="4"/><text x="112" y="109" text-anchor="middle" fill="#fff1d2" font-size="12">ГАРАЖ</text></g>
    <g class="${built.has('workshop')?'yard-built':'yard-unbuilt'}"><rect x="221" y="80" width="155" height="113" rx="5" fill="#a16b4b"/><path d="M211 82l87-35 89 35" fill="#5b564e"/><rect x="241" y="102" width="45" height="37" fill="${built.has('workshop')?'#ffdc85':'#444a54'}"/><path d="M264 102v37m-23-19h45" stroke="#5b4d43" stroke-width="3"/><rect x="313" y="116" width="40" height="77" fill="#4e483e"/><text x="298" y="73" text-anchor="middle" fill="#fff1d2" font-size="11">МАСТЕРСКАЯ</text></g>
    <g class="${built.has('kitchen')?'yard-built':'yard-unbuilt'}"><rect x="419" y="111" width="142" height="82" rx="5" fill="#c79770"/><path d="M409 113l82-47 81 47" fill="#985545"/><rect x="435" y="132" width="44" height="34" fill="${built.has('kitchen')?'#ffe2a1':'#444a54'}"/><rect x="501" y="131" width="38" height="62" fill="#635442"/><text x="490" y="105" text-anchor="middle" fill="#fff1d2" font-size="12">КУХНЯ</text></g>
    <path d="M182 37q116 44 229 0" fill="none" stroke="#34323b" stroke-width="2"/>${[200,245,291,337,385].map((x,i)=>`<circle cx="${x}" cy="${i===0||i===4?45:57}" r="5" fill="${built.size?'#ffd482':'#6a6570'}"/>`).join('')}
    <rect x="180" y="194" width="66" height="10" rx="3" fill="#b3946b"/><path d="M190 204v11m46-11v11" stroke="#392e28" stroke-width="4"/>
  </svg>`;
}
function yardEpisode(e,y){
  if(e.state==='completed')return `<article class="yard-episode"><h3>${esc(e.emoji)} ${esc(e.name)}</h3><p>${esc(e.ending)}</p><small>${e.kind==='story'?`Следующая история — через ${leftText((e.completed+86400)*1000-Date.now())}.`:'Двор полностью обустроен! Совместные истории продолжаются по своему расписанию.'} Заработанные подарки сохраняются даже после выхода из банды.</small></article>`;
  const voting=e.state==='planning'||e.state==='decision';
  const title=e.state==='planning'?'Выбираем следующую постройку':e.name;
  return `<article class="yard-episode"><div class="yard-label">${e.kind==='build'?'ОБЩАЯ СТРОЙКА':'СОВМЕСТНАЯ ИСТОРИЯ'}</div><h3>${esc(e.emoji||'🗳️')} ${esc(title)}</h3>
    <p>${esc(e.intro||e.text||'Каждый участник может голосовать. Выбранный объект останется у банды навсегда.')}</p>${e.benefit?`<p class="yard-benefit">${esc(e.benefit)}</p>`:''}
    ${voting?`<p class="test-note">${e.state==='planning'?'Решает большинство активных участников на момент начала голосования.':'Финал выбирают участники, которые помогли с подготовкой.'} ${e.deadline?`Без большинства итоги по голосам подведутся через ${leftText(e.deadline*1000-Date.now())}.`:'После первого голоса есть 6 часов на общее решение.'} При равенстве — первый вариант.</p>
      ${e.options.map(o=>`<button class="yard-choice ${e.myVote===o.id?'chosen':''}" data-act="yardVote" data-id="${e.id}:${esc(o.id)}" ${YARD.busy||e.state==='decision'&&!e.mine?'disabled':''}><b>${esc(o.emoji||'')} ${esc(o.name)}</b><small>${esc(o.benefit||o.text||'')}</small><span>${e.myVote===o.id?'✓ Твой голос · ':''}${o.votes} голосов</span></button>`).join('')}`:
      ['materials','tools','contacts'].map(lane=>{
        const tasks=y.tasks.filter(t=>t.lane===lane),progress=e.progress[lane],done=progress>=e.target;
        return `<div class="yard-lane"><b>${esc({materials:'Материалы',tools:'Инструменты',contacts:'Полезные вещи'}[lane])} <span>${progress}/${e.target}</span></b><div class="progress"><div style="width:${Math.min(100,progress/e.target*100)}%"></div></div>
          ${done?'<small>✅ Эта часть готова</small>':tasks.map(t=>`<div class="yard-task"><small>${esc(t.hint)} · готово к сдаче: ${t.available}</small><div class="btn-row"><button class="btn small" data-act="yardGo" data-id="${esc(t.go)}">Выполнить</button><button class="btn small primary" data-act="yardHelp" data-id="${e.id}:${t.id}" ${!t.available||!y.left||YARD.busy?'disabled':''}>Засчитать вклад</button></div></div>`).join('')}</div>`;
      }).join('')}
    ${e.kind==='story'&&e.state==='active'?`<details><summary>Возможные финалы и награды</summary>${e.options.map(o=>`<p><b>${esc(o.name)}</b><br>${esc(o.text)}</p>`).join('')}</details>`:''}
    <p class="yard-own">Твой вклад: ${e.mine} поручений. За каждое — 3 репутации. ${e.kind==='story'?'За финал участникам — 10 репутации, деньги и 1 крышка (крышка не чаще раза в сутки на аккаунт).':'За открытие объекта участникам — 200 ₽ и 10 репутации.'}</p>
    ${e.contributors.length?`<details><summary>Кто помог · ${e.contributors.length}</summary>${e.contributors.map(p=>`<div class="yard-person">${esc(p.name)} <b>${p.n}</b></div>`).join('')}</details>`:''}</article>`;
}
function yardHTML(c){
  const r=YARD.data,y=r?.yard;
  if(!y||y.clanId!==c.id){setTimeout(()=>yardLoad(),0);return `<div class="info-card">${YARD.error||'🏡 Загружаем общий двор…'}<button class="btn small" data-act="yardRefresh">Обновить</button></div>`;}
  const rep=r.stats.reputation,title=rep>=250?'Душа команды':rep>=100?'Надёжный':rep>=25?'Свой':'Новичок двора';
  return `<section class="yard"><div class="yard-heading"><div><small>НАШ РАЙОН</small><h2>🏡 Двор «${esc(c.name)}»</h2></div><button class="btn small" data-act="yardRefresh" ${YARD.loading?'disabled':''}>↻</button></div>
    ${yardArt(y.buildings)}<div class="yard-profile"><b>${title} · ${rep} репутации</b><small>Сегодня можно помочь ещё ${y.left}/${y.dailyLimit} раз. Лимит общий для всех банд. Пропуски дней ничего не отнимают.</small></div>
    <div class="yard-buildings">${y.buildings.map(b=>`<details class="${b.built?'built':''}"><summary>${b.emoji} ${esc(b.name)} ${b.built?'✓':'🔒'}</summary><small>${esc(b.benefit)}</small></details>`).join('')}</div>
    ${y.episodes.map(e=>yardEpisode(e,y)).join('')}
    <div class="info-card">Тапы, работа и находки засчитываются во всех городах. Один заработанный вклад тратится на выбранное дело. Сначала открой двор, затем выполняй новые действия. Старые достижения, уровни и общак банды сохранены.</div>
    <details class="yard-journal"><summary>📜 Жизнь двора</summary>${y.feed.length?y.feed.map(e=>`<p><small>${new Date(e.ts*1000).toLocaleString('ru-RU')}</small><br>${esc(e.text)}</p>`).join(''):'История вашего двора начинается здесь.'}</details>
    <details class="yard-journal"><summary>💰 Общак · ${fmt(y.treasury)} ₽ · журнал</summary><small>Движения записываются с версии 4.20. Прошлые операции не восстанавливаются.</small>${y.ledger.length?y.ledger.map(e=>`<p>${esc(e.note)}<br><b>${e.delta>0?'+':''}${fmt(e.delta)} ₽</b> · остаток ${fmt(e.balance)} ₽<br><small>${new Date(e.ts*1000).toLocaleString('ru-RU')}</small></p>`).join(''):'<p>Новых операций пока нет.</p>'}</details>
    <p class="test-note">Подарки за завершённые дела выдаются штатным получением подарков. Личная репутация и достижения сохраняются при престиже и смене банды. Три завершённые истории открывают рамку «Свой двор».</p></section>`;
}
gangMainHTML=(function(orig){return(c,g)=>yardHTML(c)+`<details class="yard-manage"><summary>⚙️ Управление, общак и приглашения</summary>${orig(c,g)}</details>`;})(gangMainHTML);
async function yardAction(action,id){
  if(YARD.busy)return;YARD.busy=true;
  const [episode,value]=id.split(':');
  try{
    if(action==='help'){for(let i=0;i<40&&srvBusy;i++)await new Promise(r=>setTimeout(r,100));save(true);await serverWrite();}
    const r=await apiPost('gang/yard/'+action,{episode:+episode,...(action==='help'?{task:value}:{value})});
    if(r.error){toast(r.error,'bad');await yardLoad(true);return;}
    yardApply(r);save(true);toast(action==='help'?'🏡 Вклад принят: +3 репутации':'🗳️ Голос сохранён','good');
    if(typeof giftClaim==='function')await giftClaim();
  }catch(e){toast('Нет связи с двором. Обнови страницу и проверь вклад.','bad');}
  finally{YARD.busy=false;renderCurrent(false);}
}
Object.assign(ACTIONS,{
  yardRefresh:()=>yardLoad(true),yardVote:id=>yardAction('vote',id),yardHelp:id=>yardAction('help',id),
  yardGo:id=>{if(id==='game')showScreen('game');else if(id==='trash')openTrash();else if(id==='exchange')openExchange();else{const [screen,tab]=id.split(':');showScreen(screen,tab);}},
});
ACHS.push(
  {id:'yard_help',name:'Свои руки',emoji:'🛠️',key:'yardHelp',goals:[1,10,50,150,500],unit:'поручений двора'},
  {id:'yard_story',name:'Общая история',emoji:'📖',key:'yardStory',goals:[1,3,10,30,100],unit:'совместных историй'},
  {id:'yard_build',name:'Наш двор',emoji:'🏡',key:'yardBuild',goals:[1,2,3],unit:'открытых объектов'},
);
FRAMES.push({id:'yard',name:'Свой двор',need:()=>counter('yardStory')>=3,how:'Завершить 3 совместные истории с личным вкладом'});
SIDE.push(
  {id:'g_yard_help',group:'gang',who:'🏡',from:'Соседи по двору',title:'Своими руками',text:'Открой двор банды и помоги с общей стройкой или историей. Нужен новый вклад после принятия поручения.',req:yardReady,reqText:'вступи в банду и загрузи двор',goals:[sg('yardHelp',1,'Засчитай 1 новый вклад во двор')],reward:{money:500,xp:100}},
  {id:'g_yard_story',group:'gang',who:'📖',from:'Свои люди',title:'Есть что вспомнить',text:'Прими участие в совместной истории и доведи её до финала.',req:yardReady,reqText:'вступи в банду и загрузи двор',after:'g_yard_help',goals:[sg('yardStory',1,'Заверши 1 новую общую историю с личным вкладом')],reward:{money:1500,xp:150,caps:1},every:48},
);
adm4Home=(function(orig){return()=>orig()+`<div class="adm4-sec"><b>🏡 Жизнь банд</b><p>Участие, истории, постройки и награды за последние 7 дней.</p><button class="btn wide" data-act="yardMetrics">Посмотреть статистику дворов</button></div>`;})(adm4Home);
ACTIONS.yardMetrics=async()=>{
  if(!S.admin)return;
  try{
    const r=await apiPost('admin/yard/metrics');if(r.error)throw new Error(r.error);
    const labels={clans:'Банд',members:'Участников сейчас',activeMembers7d:'Участников заходило за 7 дней',contributors7d:'Игроков помогали двору за 7 дней',help7d:'Поручений за 7 дней',topShare:'Доля самого активного игрока, %',stories7d:'Историй завершено за 7 дней',buildings:'Объектов построено всего',caps7d:'Крышек за истории за 7 дней',returned7d:'Помогали на прошлой неделе и вернулись на этой'};
    openModal(`<h3>🏡 Жизнь банд</h3><div class="stat-grid">${Object.entries(labels).map(([k,v])=>`<div>${v}<b>${fmt(r[k]||0)}</b></div>`).join('')}</div><p class="test-note">Накапливается с версии 4.20. Новые данные о возвращении появятся после первой полной недели. Метрики не влияют на топ.</p><button class="btn wide" data-act="adminMenu">Назад в админку</button>`);
  }catch(e){toast('Статистика доступна только администратору на сервере.','bad');}
};
