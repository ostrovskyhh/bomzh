// Shared controller. Each city keeps its existing, independent save key and action namespace.
function createCityStoryBoard(c){
function record(event,data){if(typeof BugReport!=='undefined')BugReport.record('city-story-'+event,{city:c.city,...data});}
function allowed(){return city()===c.city&&level()>=c.unlock;}
function day(){return Math.floor((Date.now()+10800000)/86400000);}
function state(){
  if(!S[c.stateKey]||S[c.stateKey].v!==1)S[c.stateKey]={v:1,done:[],active:null,day:day(),daily:[]};
  const s=S[c.stateKey];if(s.day!==day()){s.day=day();s.daily=[];}return s;
}
function quest(id){return [...c.stories,...c.daily].find(q=>q.id===id);}
function available(q){if(!allowed()||!q)return false;const s=state();return q.daily?!s.daily.includes(q.id):c.stories.find(x=>!s.done.includes(x.id))?.id===q.id;}
function progress(q,a=state().active){return a?.id===q.id?Math.max(0,counter(q.key)-a.base):0;}
function ready(){const a=state().active,q=a&&quest(a.id);return !!(q&&a.mini&&progress(q,a)>=q.need&&available(q));}
function missingXP(){let total=0;for(let l=1;l<c.target;l++)total+=xpNeed(l);return Math.max(0,Math.ceil(total-S.xp));}
function entry(){
  if(city()!==c.city)return '';const n=S[c.stateKey]?.done?.length||0;
  return `<div class="ze-entry ${c.entryClass}"><span>${c.icon}</span><div><b>${c.label} · ${n}/${c.stories.length}</b><small>${level()<c.unlock?`Новые истории откроются на ${c.unlock}-м уровне`:missingXP()?`До ${c.target}-го уровня: ${fmt(missingXP())} XP. Здесь есть чем заняться.`:c.readyText}</small></div><button class="btn primary small" data-act="${c.prefix}Board">${level()<c.unlock?'Посмотреть':'Открыть'}</button></div>`;
}
function board(){
  if(city()!==c.city)return;
  if(MG||MG_PENDING)return toast('Сначала закончи или отмени мини-игру','bad');
  if(!allowed())return openModal(`<h3>${c.icon} ${c.label}</h3><p>${c.lockedText}</p><button class="btn wide" data-act="close">Понятно</button>`,{center:true});
  const s=state(),q=s.active&&quest(s.active.id),next=c.stories.find(x=>!s.done.includes(x.id));
  let active='';
  if(q){const a=s.active,n=Math.min(q.need,progress(q));active=`<article class="ze-card"><small>${q.daily?'ЕЖЕДНЕВНОЕ ДЕЛО':`ИСТОРИЯ ${c.stories.indexOf(q)+1} ИЗ 12`} · ${q.who} ${q.from}</small><h3>${q.title}</h3><p>${q.text}</p><div class="ze-goal">${a.mini?'✅':'▫️'} ${miniHint(q)}</div><div class="ze-goal">${n>=q.need?'✅':'▫️'} ${q.goal} · ${n}/${q.need}</div><div class="ze-reward">🎁 ${fmt(q.xp)} базового XP · ${fmt(q.money)} ₽ · +8 радости</div>${!a.mini?`<button class="btn primary wide" data-act="${c.prefix}Play">${q.kind==='dialogue'?'Разобраться в истории':'Помочь в мини-игре'}</button>`:''}${n<q.need?`<button class="btn wide" data-act="${c.prefix}Where">Где выполнить вторую цель?</button>`:''}<button class="btn primary wide" data-act="${c.prefix}Claim" ${ready()?'':'disabled data-why="Выполни обе цели поручения"'}>Получить награду</button><button class="btn small" data-act="${c.prefix}Drop">Отложить поручение</button></article>`;}

  const offer=x=>`<article class="ze-offer"><small>${x.who} ${x.from}</small><h4>${x.title}</h4><p>${x.text}</p><div class="ze-reward">${fmt(x.xp)} базового XP · ${fmt(x.money)} ₽</div><button class="btn wide" data-act="${c.prefix}Take" data-id="${x.id}" ${q?'disabled data-why="Сначала заверши или отложи текущее дело"':''}>Начать поручение</button></article>`;
  openModal(`<section class="ze-board ${c.boardClass}"><small>${c.badge}</small><h3>${c.title}</h3><p>12 необязательных историй, ${fmt(c.stories.reduce((n,q)=>n+q.xp,0))} базового опыта за всю цепочку. Обычные бонусы к опыту действуют. Основной сюжет и его условия переезда остаются прежними.</p><div class="ze-progress"><b>Истории района: ${s.done.length}/12</b><span>${missingXP()?`До ${c.target}-го уровня: ${fmt(missingXP())} XP`:`${c.target}-й уровень уже достигнут`}</span></div>${active}${!q&&next?offer(next):''}${!next?`<div class="ze-finished">🏅 История завершена. Рамка «${c.frameName}» доступна в профиле.</div>`:''}<details class="ze-roadmap"><summary>Все истории района</summary>${c.stories.map((x,i)=>`<div>${s.done.includes(x.id)?'✅':q?.id===x.id?'▶️':'▫️'} ${i+1}. ${x.title}</div>`).join('')}</details><h4>Каждый день · ${s.daily.length}/3</h4><p class="ze-note">Три дополнительных поручения по ${c.daily[0].xp} базового XP. Каждое — один раз за день, обновление в 00:00 по Москве. Считаются только действия после принятия. Не нужны случайные события, азартные игры или другие игроки.</p>${c.daily.filter(x=>!s.daily.includes(x.id)&&q?.id!==x.id).map(offer).join('')}${s.daily.length===3?'<p>Все три ежедневных дела выполнены. Возвращайся завтра!</p>':''}<button class="btn wide" data-act="close">Закрыть</button></section>`,{center:true});
}
function miniHint(q){return q.hint||{sort:'Разложи 6 предметов по двум корзинам',lanes:'Доставь 3 посылки, объезжая препятствия',targets:'Собери 6 полезных вещей, не трогай котов и цветы',orders:'Собери 3 заказа по показанным картинкам',pairs:'Найди 3 пары одинаковых предметов',dialogue:'Разбери три ситуации без таймера'}[q.kind];}
function miniResult(a,won){
  if(!allowed()||state().active!==a)return;
  record('minigame',{id:a.id,won});
  if(won){a.mini=true;save();toast('Помощь засчитана! Осталась вторая цель или награда.','good');}
  else toast('Не получилось — можно попробовать снова без потери денег.','bad');
  board();
}
let talk=null;
function talkDraw(){
  const t=talk;if(!t||!allowed()||state().active!==t.active)return;
  const line=c.dialogues[t.q.dialogue][t.i];t.order=shuffle(line[1].map((label,i)=>({label,i})));
  openModal(`<section class="ze-talk"><small>${t.q.who} ${t.q.from} · ${t.i+1}/3 · БЕЗ ТАЙМЕРА</small><h3>${t.q.title}</h3><p>${line[0]}</p><div class="btns">${t.order.map((o,i)=>`<button class="btn wide" data-act="${c.prefix}Answer" data-id="${i}">${o.label}</button>`).join('')}</div><button class="btn small" data-act="${c.prefix}TalkBack">Вернуться к делу</button></section>`,{center:true});
}
Object.assign(ACTIONS,{
  [c.prefix+'Board']:board,
  [c.prefix+'Take']:id=>{const q=quest(id);if(!available(q)||state().active||MG||MG_PENDING)return;state().active={id,base:counter(q.key),mini:false};record('accepted',{id,key:q.key,need:q.need});save();board();},
  [c.prefix+'Drop']:()=>{if(!allowed()||MG||MG_PENDING)return;state().active=null;talk=null;save();board();},
  [c.prefix+'Where']:()=>{if(!allowed())return;const q=quest(state().active?.id),t=q&&goalTarget({key:q.key,text:q.goal});if(t)goTo(t,q.goal);},
  [c.prefix+'Play']:()=>{
    if(!allowed()||MG||MG_PENDING)return;
    if(S.busy)return toast('Сначала закончи текущее занятие','bad');
    const a=state().active,q=a&&quest(a.id);if(!q||a.mini||!available(q))return;
    if(q.kind==='dialogue'){talk={q,active:a,i:0,order:[]};talkDraw();return;}
    const target=['targets','sort'].includes(q.kind)?6:3;
    runGame({title:`${q.who} ${q.title}`,hint:miniHint(q)+'. Достиг цели — игра закончится сразу. Повторная попытка бесплатна.',duration:q.kind==='pairs'?40:25,setup:mg=>{
      if(q.kind==='targets')gameTargets(mg,{good:q.icons,bad:q.bad,goodRate:.8,every:780,life:2100});
      else if(q.kind==='orders')gameOrders(mg,{items:q.icons,size:[1,2]});
      else if(q.kind==='sort')gameSort(mg,{bins:q.bins,limit:4000});
      else if(q.kind==='lanes')gameLanes(mg,{good:q.icons,bad:q.bad,player:q.player||'🚲',goodRate:.65,speed:.85});
      else gamePairs(mg,{items:q.icons});
      const check=()=>{if(!mgAlive(mg))return;if(mg.score>=target)return mgEnd();mgDelay(mg,check,100);};mgDelay(mg,check,100);
    },finish:score=>miniResult(a,score>=target)});
  },
  [c.prefix+'Answer']:index=>{
    const t=talk;if(!t||!allowed()||state().active!==t.active)return;
    const line=c.dialogues[t.q.dialogue][t.i],answer=t.order[Number(index)];if(!answer)return;
    if(answer.i!==line[2])return toast(line[3],'bad');
    t.i++;if(t.i===c.dialogues[t.q.dialogue].length){talk=null;miniResult(t.active,true);}else talkDraw();
  },
  [c.prefix+'TalkBack']:()=>{talk=null;board();},
  [c.prefix+'Claim']:()=>{
    if(!allowed()||MG||MG_PENDING||!ready())return;
    const s=state(),q=quest(s.active.id);s.active=null;
    (q.daily?s.daily:s.done).push(q.id);const before=S.xp;addXp(q.xp);addMoney(q.money);addMood(8);
    record('claimed',{id:q.id,baseXP:q.xp,earnedXP:S.xp-before,daily:!!q.daily});track('sideDone');track(c.counter+'Done');if(!q.daily&&s.done.length===c.stories.length)track(c.counter+'Chain');
    save();updateHud();sfx('quest');
    resultModal({emoji:q.who,title:q.title+' — выполнено',text:`${q.outro||'Спасибо, что снова помог району!'}<br><br>Награда: <b>${fmt(S.xp-before)} XP · ${fmt(q.money)} ₽ · +8 радости</b><br><button class="btn primary wide" data-act="${c.prefix}Board">К делам района</button>`,btn:'Отлично'});
  },
});
for(const tab of ['story','side'])EXTRA_TABS.tasks[tab]=(function(orig){return function(){const html=orig.apply(this,arguments);return entry()+(tab==='side'?html.replace('Выполнено: <b>','Обычных поручений выполнено: <b>'):html);};})(EXTRA_TABS.tasks[tab]);
goalTarget=(function(orig){return function(g){if(allowed()&&/^Достигни\s+\d+\s+уровня$/i.test(g.text)&&g.need>level())return ['tasks','story',c.entrySelector,c.goalHint];return orig(g);};})(goalTarget);
ACHS.push({id:c.achievement,name:c.achievementName,emoji:c.icon,key:c.counter+'Done',goals:[3,6,12,30,60],unit:'городских поручений'});
FRAMES.push({id:c.frame,name:c.frameName,how:`Все 12 историй «${c.title}»`,need:()=>counter(c.counter+'Chain')>=1});
HOOKS.hud.push(()=>{if(allowed()&&S[c.stateKey]?.active&&ready())$('tasksDot')?.classList.remove('hidden');});

return {allowed,day,state,quest,available,progress,ready,missingXP,entry,board,miniHint,miniResult,get talk(){return talk;}};
}
