// Stable chapter IDs migrate old saves; no completed chapter is awarded twice.
const STORY30_LEGACY={};
for(const c of ['mex','fr']){STORY30_LEGACY[c]={};for(const path of ['honest','dark'])STORY30_LEGACY[c][path]=QUESTS.filter(q=>q.city===c&&(!q.path||q.path===path));}
function story30Path(){return S.quest?.path==='dark'?'dark':'honest';}
function story30List(c=city(),path=story30Path()){
 const old=STORY30_LEGACY[c]?.[path];if(!old)return null;
 const extra=STORY30_DATA.filter(d=>d.city===c).map(d=>QUESTS.find(q=>q.id===d.id));
 return c==='mex'?[...old.filter(q=>!q.frMove),...extra,...old.filter(q=>q.frMove)]:[...old,...extra];
}
function story30Migrate(){
 if(!STORY30_LEGACY[city()]||!S.quest||S.quest.expanded30)return;
 const old=STORY30_LEGACY[city()][story30Path()],idx=Math.max(0,Number(S.quest.idx)||0),current=old[idx],list=story30List();
 // A completed French story continues with its new aftermath; in-progress scenes retain their ID and base counters.
 S.quest.idx=current?list.findIndex(q=>q.id===current.id):city()==='fr'?old.length:list.length;
 if(S.quest.idx<0)S.quest.idx=0;S.quest.expanded30=true;
 if(!current)S.quest.base={...(S.counters||{})};
}
for(const d of STORY30_DATA){
 const key='story30_'+d.id;
 QUESTS.push({id:d.id,city:d.city,expansion30:true,who:d.city==='mex'?'🌵':'⚜️',name:d.npc,title:d.title,text:d.text,
  goals:[qc(key,1,'Разобраться в улике и принять решение')],reward:{money:d.city==='mex'?usd(90):eur(45),xp:500},story30:d,help:'Открой сцену расследования. Все улики на экране; ограничения по времени и уровню нет.'});
 GO_KEYS[key]=['tasks','story','[data-act="story30Play"]','Открыть сцену расследования'];
}
// Replace old level gates and long repeat quotas with short, relevant actions; retain their original counters.
for(const q of QUESTS.filter(q=>['mex','fr'].includes(q.city)&&!q.expansion30&&!q.frMove)){
 q.goals=q.goals.filter(g=>!(/(?:Достиг|Набер).*уровн/i.test(g.text))&&!/level\(\)/.test(String(g.cur)));
 for(const g of q.goals)if(g.key){const need=Math.min(g.need,/shift|fightWin|gymGame/.test(g.key)?2:3);if(need!==g.need){g.need=need;g.text=g.text.replace(/\d+/,String(need));}}
 if(!q.goals.length)q.goals=[qc('shift',1,'Закончить одну успешную смену')];
}
const story30OriginalList=questList;
questList=function(){return S.quest?.expanded30&&story30List()?story30List():story30OriginalList().filter(q=>!q.expansion30);};
HOOKS.load.push(story30Migrate);
HOOKS.track.push(k=>{if(k==='cityMove')story30Migrate();});
const story30TabBefore=EXTRA_TABS.tasks.story;
EXTRA_TABS.tasks.story=()=>{
 story30Migrate();let out=story30TabBefore(),q=currentQuest();if(!STORY30_LEGACY[city()])return out;
 out=`<div class="story30-progress">${city()==='mex'?'🌵':'⚜️'} ${cityName()} · <b>${q?S.quest.idx+1:30} / 30</b></div>`+out;
 if(q?.story30)out=`<section class="story30-scene"><small>СЦЕНА РАССЛЕДОВАНИЯ</small><h3>${q.title}</h3><p>${q.story30.text}</p><button class="btn primary wide" data-act="story30Play">Открыть улику и продолжить</button><small>Без таймера. Ответ есть в улике.</small></section>`+out;
 return out;
};
function story30Game(mg,d){
 const arena=$('mgArena');arena.classList.add('content466-arena');let stage=0,finished=false;
 function show(){
  if(!mgAlive(mg))return;
  arena.innerHTML=`<div class="story30-case"><small>${stage+1} / 3 · ${d.npc}</small><h3>${d.title}</h3><p>${stage===0?d.text:stage===1?d.clue:d.outcome}</p><div id="story30Choices"></div><p id="story30Hint"></p></div>`;
  const box=$('story30Choices');
  if(stage===0){const b=document.createElement('button');b.className='btn primary wide';b.textContent='Изучить улику';b.onclick=()=>{stage=1;show();};box.append(b);}
  else if(stage===1){const h=document.createElement('h4');h.textContent=d.question;box.append(h);shuffle([d.answer,...d.wrong]).forEach(answer=>{const b=document.createElement('button');b.className='btn wide';b.textContent=answer;b.onclick=()=>{if(!mgAlive(mg))return;if(answer!==d.answer){$('story30Hint').textContent='Проверь улику ещё раз: все необходимые сведения написаны выше.';sfx('error');return;}stage=2;show();};box.append(b);});}
  else ['Передать союзникам лично','Отправить защищённую копию'].forEach((label,i)=>{const b=document.createElement('button');b.className='btn primary wide';b.textContent=label;b.onclick=()=>{if(finished||!mgAlive(mg))return;finished=true;mg.story30Solved=true;mg.story30Delivery=i;mgScore(1);mgEnd();};box.append(b);});
 }
 show();
}
ACTIONS.story30Play=()=>{
 const q=currentQuest();if(!q?.story30||S.busy||MG||MG_PENDING)return;
 const baseCity=city(),baseIdx=S.quest.idx;runGame({title:q.title,hint:'Прочитай улику, сопоставь факты и выбери способ передачи. Время не ограничено.',duration:0,setup:mg=>story30Game(mg,q.story30),finish:(score,mg)=>{
  if(!mg.story30Solved||score!==1||city()!==baseCity||S.quest.idx!==baseIdx||currentQuest()?.id!==q.id)return;
  S.quest.storyDeliveries||={};S.quest.storyDeliveries[q.id]=mg.story30Delivery;track('story30_'+q.id);save();closeModal();showScreen('tasks','story');toast('Улика проверена. Можно завершить главу.','good');
 }});
};
// The previous text described a 15-chapter plot; the 7% release rate remains unchanged.
frStartModal=(function(orig){return function(){orig();const root=$('modalRoot');if(root)for(const el of root.querySelectorAll('.move-box'))el.innerHTML=el.innerHTML.replace('каждая из 15 глав','каждая пройденная глава').replace('к концу истории вернут всё','пока не вернут всё');};})(frStartModal);
