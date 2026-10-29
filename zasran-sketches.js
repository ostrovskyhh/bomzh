// Parallel city stories: never insert into QUESTS, whose saved position is an index.
const ZAS_STORIES = [
  {id:'yard',who:'🧔',from:'Михалыч',title:'Наш двор',text:'Район решил устроить праздник. Михалыч записал Валеру главным по двору: «Начнём с бутылок и мусора. А сцену поставим там, где стояла твоя коробка».',kind:'targets',icons:['🍾','📦','🧹'],bad:['🐈','🌷'],key:'sold',need:20,goal:'Сдай 20 бутылок после начала поручения',xp:2200,money:5000,outro:'Двор чистый. На лавке появилась табличка «Оргкомитет». Михалыч уже назначил себя председателем.'},
  {id:'soup',who:'🥣',from:'Тётя Валя',title:'Ужин без очереди',text:'Монтажники, музыканты и три голодных соседа пришли одновременно. Помоги Вале раздать обеды по заказам и сам не забудь поесть.',kind:'orders',icons:['🥣','🍞','🥕','🍵','🥔','🍎'],key:'eat',need:1,goal:'Поешь один раз',xp:2400,money:7000,outro:'Все сыты. Валя обещала прийти на праздник и принести пирожки — если Шнырь перестанет считать их поштучно.'},
  {id:'receipts',who:'🦊',from:'Шнырь',title:'Чеки Шныря',text:'Шнырь добыл материалы для сцены, но половина чеков подозрительная. Разберись без взяток и покажи, что честная смена всё ещё работает.',kind:'dialogue',dialogue:'receipts',key:'shift',need:1,goal:'Закончи одну рабочую смену',xp:2600,money:9000,outro:'Из сметы исчезли «позолота лавки» и «аренда воздуха». Шнырь вздохнул: «Ты хоть доставку моих нервов оплати». '},
  {id:'lost',who:'🗝️',from:'Завхоз Семёныч',title:'Архив потеряшек',text:'В гараже нашли коробку забытых вещей. Найди пары, чтобы вернуть людям инструменты. А перед переноской ящиков разомнись в спортзале.',kind:'pairs',icons:['🔑','🧢','🧤','🔧','🧦','☂️'],key:'gymGame',need:1,goal:'Заверши одну тренировку в спортзале',xp:2800,money:11000,outro:'Семёныч нашёл ключ от гаража внутри гаража. Это его ничуть не удивило.'},
  {id:'lights',who:'💡',from:'Электрик Степаныч',title:'Свет над лавкой',text:'Гирлянда длиннее улицы, а рабочих лампочек — кот наплакал. Собери исправные, не трогай цветы и котов. Тридцать тапов помогут собрать мелочь на крепёж.',kind:'targets',icons:['💡','🔌','🔋'],bad:['🐈','🌷'],key:'taps',need:30,goal:'Сделай 30 новых тапов по Валере',xp:3000,money:13000,outro:'Лавка светится так, что Эдик закрыл шторы. Степаныч клянётся: счётчик почти не крутится.'},
  {id:'post',who:'📮',from:'Почтальон Люся',title:'Письма для своих',text:'Люся знает весь район, но перепутала посылки артистам. Раздай нужные вещи по заказам, а потом отвлекись на одну игру в отдыхе.',kind:'orders',icons:['✉️','🎸','🎤','🎁','📚','🥁'],key:'leisureGame',need:1,goal:'Сыграй в одну мини-игру в разделе «Отдых»',xp:3200,money:15000,outro:'Приглашения доставлены. Даже сосед, который всегда жалуется на шум, попросил место у сцены.'},
  {id:'microphone',who:'🎤',from:'Диджей Гоша',title:'Куда исчез микрофон?',text:'За час до репетиции пропал микрофон. Гоша подозревает всех, кроме себя. Пройди по зацепкам и заработай сменой на запасной кабель.',kind:'dialogue',dialogue:'microphone',key:'shift',need:1,goal:'Закончи одну рабочую смену',xp:3400,money:17000,outro:'Микрофон нашёлся в чайнике Гоши. Он объяснил: «Это была акустическая обработка». '},
  {id:'suitcase',who:'🧳',from:'Михалыч',title:'Чемодан Михалыча',text:'Михалыч собирал чемодан двадцать лет и никуда не уехал. Разбери его сувениры по парам. За обедом он расскажет, как однажды почти добрался до Москвабада.',kind:'pairs',icons:['🧳','🧭','📷','🎫','🗺️','🧸'],key:'eat',need:1,goal:'Поешь один раз',xp:3600,money:19000,outro:'Внутри лежит старый билет: «Засранск — Москвабад». Михалыч отдал его тебе: «На память. Вдруг пригодится». '},
  {id:'sport',who:'🏋️',from:'Тренер Палыч',title:'Турнир без Бугая',text:'Палыч придумал мирный дворовый турнир. Раздай участникам инвентарь и сделай тренировку. Драться с живыми игроками не нужно — сегодня соревнуются в ловкости.',kind:'orders',icons:['🏀','🥊','🏓','🏸','⚽','🏆'],key:'gymGame',need:1,goal:'Заверши одну тренировку в спортзале',xp:3800,money:21000,outro:'Бугай занял второе место и потребовал реванш. Его обыграла Валя — в настольный теннис.'},
  {id:'radio',who:'📻',from:'Радиолюбитель Коля',title:'Дворовое радио',text:'Коля хочет передавать концерт на весь район. Собери рабочие детали, не трогая клумбу и кота. Сданные бутылки оплатят батарейки.',kind:'targets',icons:['🔋','🎙️','🔌'],bad:['🐈','🌷'],key:'sold',need:20,goal:'Сдай 20 бутылок после начала поручения',xp:4000,money:23000,outro:'Первая передача: «Соседи, уберите машины. Это не просьба, это джаз». '},
  {id:'papers',who:'📁',from:'Бухгалтер Нина',title:'Чужие планы',text:'В старых бумагах Нины снова всплыла фамилия Эдика. Отдели факты от слухов и подработай смену на оформление документов для района.',kind:'dialogue',dialogue:'papers',key:'shift',need:1,goal:'Закончи одну рабочую смену',xp:4200,money:25000,outro:'Копии в надёжном месте. Нина предупредила: «Если вдруг придёт налоговая — сначала прочитай, потом открывай дверь». '},
  {id:'festival',who:'🎉',from:'Весь район',title:'Город, который помнит',text:'Сцена готова, гирлянда горит, Валя принесла пирожки. Помоги на празднике и сыграй в отдыхе. Когда-нибудь ты поедешь дальше — но здесь тебя уже знают.',kind:'orders',icons:['🎈','🥧','🎟️','🎁','🎤','🌻'],key:'leisureGame',need:1,goal:'Сыграй в одну мини-игру в разделе «Отдых»',xp:4800,money:30000,outro:'Михалыч поднял кружку: «За Валеру. С лавки поднялся, а своих не забыл». Тебе вручили рамку «Свой Засранску». '},
];
const ZAS_DAILY = [
  {id:'daily_tools',who:'🔧',from:'Семёныч',title:'Дежурство в мастерской',text:'Найди пары инструментов и помоги двору одной рабочей сменой.',kind:'pairs',icons:['🔧','🔨','🪛','🧰','⚙️','🪚'],key:'shift',need:1,goal:'Закончи одну рабочую смену',xp:1200,money:3000,daily:true},
  {id:'daily_lunch',who:'🥣',from:'Тётя Валя',title:'Обед для соседей',text:'Раздай обеды по заказам. Себе тоже оставь порцию.',kind:'orders',icons:['🥣','🍞','🥕','🍵','🥔','🍎'],key:'eat',need:1,goal:'Поешь один раз',xp:1200,money:3000,daily:true},
  {id:'daily_yard',who:'🧹',from:'Михалыч',title:'Чисто там, где помогают',text:'Собери полезные вещи во дворе и сдай двадцать бутылок.',kind:'targets',icons:['🍾','📦','🧹'],bad:['🐈','🌷'],key:'sold',need:20,goal:'Сдай 20 бутылок после начала поручения',xp:1200,money:3000,daily:true},
];
const ZAS_DIALOGUES = {
  receipts:[['В чеке дважды записана одна доставка. Что делаем?',['Оплачиваем обе','Просим исправленный чек','Выбрасываем все документы'],1,'Одна поездка — одна оплата. Сначала исправим бумагу.'],['Шнырь предлагает взять материалы без расписки.',['Запишем количество и получим расписку','Поверим на слово','Заплатим второй раз'],0,'С распиской никто не потеряет ни материалы, ни деньги.'],['В смете остались лишние деньги.',['Спрячем','Удвоим цену сцены','Вернём в общий бюджет'],2,'Прозрачная смета — и район снова доверяет.']],
  microphone:[['На столе остался пустой чехол, а Гоша несёт чайник. С чего начать?',['Обвинить соседей','Спросить Гошу, куда он положил микрофон','Купить новый за счёт района'],1,'Сначала поговорим с тем, кто держал вещь последним.'],['Гоша вспомнил, что прятал аппаратуру от дождя. Куда заглянем?',['В его закрытый чайник','На крышу','В клумбу'],0,'Он искал сухое место. Проверим чайник.'],['Микрофон найден. Что нужно перед концертом?',['Сразу на сцену','Проверить звук и кабель','Объявить награду за пропажу'],1,'Короткая проверка — и концерт не сорвётся.']],
  papers:[['На бумаге печать, но нет подписи. Это готовый договор?',['Да, печати хватит','Сначала проверим подписи и стороны','Сразу заплатим'],1,'Сначала проверим документ, не переводим деньги наугад.'],['В двух копиях разные суммы.',['Сверим их с исходным договором','Возьмём самую большую','Уничтожим обе'],0,'Сверяем с исходником и сохраняем копии.'],['Куда деть доказательства после проверки?',['Оставить на лавке','Передать Эдику','Сохранить копии у Нины'],2,'Нина умеет хранить бумаги лучше, чем Шнырь — сдачу.']],
};
function zasAllowed(){return city()==='zas'&&level()>=12;}
function zasDay(){return Math.floor((Date.now()+10800000)/86400000);}
function zasState(){
  if(!S.zasStories||S.zasStories.v!==1)S.zasStories={v:1,done:[],active:null,day:zasDay(),daily:[]};
  const s=S.zasStories;if(s.day!==zasDay()){s.day=zasDay();s.daily=[];}return s;
}
function zasQuest(id){return [...ZAS_STORIES,...ZAS_DAILY].find(q=>q.id===id);}
function zasAvailable(q){if(!zasAllowed()||!q)return false;const s=zasState();return q.daily?!s.daily.includes(q.id):ZAS_STORIES.find(x=>!s.done.includes(x.id))?.id===q.id;}
function zasProgress(q,a=zasState().active){return a?.id===q.id?Math.max(0,counter(q.key)-a.base):0;}
function zasReady(){const a=zasState().active,q=a&&zasQuest(a.id);return !!(q&&a.mini&&zasProgress(q,a)>=q.need&&zasAvailable(q));}
function zasMissingXP(){let total=0;for(let l=1;l<22;l++)total+=xpNeed(l);return Math.max(0,Math.ceil(total-S.xp));}
function zasEntry(){
  if(city()!=='zas')return '';const n=S.zasStories?.done?.length||0;
  return `<div class="ze-entry"><span>🏘️</span><div><b>Дела Засранска · ${n}/12</b><small>${level()<12?'Новые истории района откроются на 12-м уровне':zasMissingXP()?`До 22-го уровня: ${fmt(zasMissingXP())} XP. Здесь есть чем заняться.`:'Уровень для переезда готов. Осталось закончить основной сюжет.'}</small></div><button class="btn primary small" data-act="zasBoard">${level()<12?'Посмотреть':'Открыть'}</button></div>`;
}
function zasBoard(){
  if(city()!=='zas')return;
  if(MG||MG_PENDING)return toast('Сначала закончи или отмени мини-игру','bad');
  if(!zasAllowed())return openModal('<h3>🏘️ Дела Засранска</h3><p>На 12-м уровне Михалыч соберёт район к большому празднику: 12 историй, новые занятия и опыт для следующей главы.</p><button class="btn wide" data-act="close">Понятно</button>',{center:true});
  const s=zasState(),q=s.active&&zasQuest(s.active.id),next=ZAS_STORIES.find(x=>!s.done.includes(x.id));
  let active='';
  if(q){const a=s.active,progress=Math.min(q.need,zasProgress(q));active=`<article class="ze-card"><small>${q.daily?'ЕЖЕДНЕВНОЕ ДЕЛО':`ИСТОРИЯ ${ZAS_STORIES.indexOf(q)+1} ИЗ 12`} · ${q.who} ${q.from}</small><h3>${q.title}</h3><p>${q.text}</p><div class="ze-goal">${a.mini?'✅':'▫️'} ${zasMiniHint(q)}</div><div class="ze-goal">${progress>=q.need?'✅':'▫️'} ${q.goal} · ${progress}/${q.need}</div><div class="ze-reward">🎁 ${fmt(q.xp)} базового XP · ${fmt(q.money)} ₽ · +8 радости</div>${!a.mini?`<button class="btn primary wide" data-act="zasPlay">${q.kind==='dialogue'?'Разобраться в истории':'Помочь в мини-игре'}</button>`:''}${progress<q.need?'<button class="btn wide" data-act="zasWhere">Где выполнить вторую цель?</button>':''}<button class="btn primary wide" data-act="zasClaim" ${zasReady()?'':'disabled data-why="Выполни обе цели поручения"'}>Получить награду</button><button class="btn small" data-act="zasDrop">Отложить поручение</button></article>`;}
  const offer=x=>`<article class="ze-offer"><small>${x.who} ${x.from}</small><h4>${x.title}</h4><p>${x.text}</p><div class="ze-reward">${fmt(x.xp)} базового XP · ${fmt(x.money)} ₽</div><button class="btn wide" data-act="zasTake" data-id="${x.id}" ${q?'disabled data-why="Сначала заверши или отложи текущее дело"':''}>Начать поручение</button></article>`;
  openModal(`<section class="ze-board"><small>ЗАСРАНСК · ДЛЯ СВОИХ</small><h3>Город, который помнит</h3><p>12 необязательных историй, 40 000 базового опыта за всю цепочку. Обычные бонусы к опыту действуют. Основной сюжет и его условия переезда остаются прежними.</p><div class="ze-progress"><b>Истории района: ${s.done.length}/12</b><span>${zasMissingXP()?`До 22-го уровня: ${fmt(zasMissingXP())} XP`:'22-й уровень уже достигнут'}</span></div>${active}${!q&&next?offer(next):''}${!next?'<div class="ze-finished">🏅 Район тебя не забудет. Рамка «Свой Засранску» доступна в профиле.</div>':''}<details class="ze-roadmap"><summary>Все истории района</summary>${ZAS_STORIES.map((x,i)=>`<div>${s.done.includes(x.id)?'✅':q?.id===x.id?'▶️':'▫️'} ${i+1}. ${x.title}</div>`).join('')}</details><h4>Каждый день · ${s.daily.length}/3</h4><p class="ze-note">Три дополнительных поручения по 1200 базового XP. Каждое — один раз за день, обновление в 00:00 по Москве. Считаются только действия после принятия. Не нужны случайные события, азартные игры или другие игроки.</p>${ZAS_DAILY.filter(x=>!s.daily.includes(x.id)&&q?.id!==x.id).map(offer).join('')}${s.daily.length===3?'<p>Все три ежедневных дела выполнены. Возвращайся завтра!</p>':''}<button class="btn wide" data-act="close">Закрыть</button></section>`,{center:true});
}
function zasMiniHint(q){return {targets:'Собери 6 полезных вещей, не трогай котов и цветы',orders:'Собери 3 заказа по показанным картинкам',pairs:'Найди 3 пары одинаковых предметов',dialogue:'Разбери три ситуации без таймера'}[q.kind];}
function zasMiniResult(a,won){
  if(!zasAllowed()||zasState().active!==a)return;
  if(won){a.mini=true;save();toast('Помощь засчитана! Осталась вторая цель или награда.','good');}
  else toast('Не получилось — можно попробовать снова без потери денег.','bad');
  zasBoard();
}
let ZAS_TALK=null;
function zasTalkDraw(){
  const t=ZAS_TALK;if(!t||!zasAllowed()||zasState().active!==t.active)return;
  const line=ZAS_DIALOGUES[t.q.dialogue][t.i];t.order=shuffle(line[1].map((label,i)=>({label,i})));
  openModal(`<section class="ze-talk"><small>${t.q.who} ${t.q.from} · ${t.i+1}/3 · БЕЗ ТАЙМЕРА</small><h3>${t.q.title}</h3><p>${line[0]}</p><div class="btns">${t.order.map((o,i)=>`<button class="btn wide" data-act="zasAnswer" data-id="${i}">${o.label}</button>`).join('')}</div><button class="btn small" data-act="zasTalkBack">Вернуться к делу</button></section>`,{center:true});
}
Object.assign(ACTIONS,{
  zasBoard,
  zasTake:id=>{const q=zasQuest(id);if(!zasAvailable(q)||zasState().active||MG||MG_PENDING)return;zasState().active={id,base:counter(q.key),mini:false};save();zasBoard();},
  zasDrop:()=>{if(!zasAllowed()||MG||MG_PENDING)return;zasState().active=null;ZAS_TALK=null;save();zasBoard();},
  zasWhere:()=>{if(!zasAllowed())return;const q=zasQuest(zasState().active?.id),t=q&&goalTarget({key:q.key,text:q.goal});if(t)goTo(t,q.goal);},
  zasPlay:()=>{
    if(!zasAllowed()||MG||MG_PENDING)return;
    if(S.busy)return toast('Сначала закончи текущее занятие','bad');
    const a=zasState().active,q=a&&zasQuest(a.id);if(!q||a.mini||!zasAvailable(q))return;
    if(q.kind==='dialogue'){ZAS_TALK={q,active:a,i:0,order:[]};zasTalkDraw();return;}
    const target=q.kind==='targets'?6:3;
    runGame({title:`${q.who} ${q.title}`,hint:zasMiniHint(q)+'. Достиг цели — игра закончится сразу. Повторная попытка бесплатна.',duration:q.kind==='pairs'?40:25,setup:mg=>{
      if(q.kind==='targets')gameTargets(mg,{good:q.icons,bad:q.bad,goodRate:.8,every:780,life:2100});
      else if(q.kind==='orders')gameOrders(mg,{items:q.icons,size:[1,2]});
      else gamePairs(mg,{items:q.icons});
      $('mgArena').addEventListener('pointerdown',()=>{if(mgAlive(mg)&&mg.score>=target)mgDelay(mg,mgEnd,200);});
    },finish:score=>zasMiniResult(a,score>=target)});
  },
  zasAnswer:index=>{
    const t=ZAS_TALK;if(!t||!zasAllowed()||zasState().active!==t.active)return;
    const line=ZAS_DIALOGUES[t.q.dialogue][t.i],answer=t.order[Number(index)];if(!answer)return;
    if(answer.i!==line[2])return toast(line[3],'bad');
    t.i++;if(t.i===ZAS_DIALOGUES[t.q.dialogue].length){ZAS_TALK=null;zasMiniResult(t.active,true);}else zasTalkDraw();
  },
  zasTalkBack:()=>{ZAS_TALK=null;zasBoard();},
  zasClaim:()=>{
    if(!zasAllowed()||MG||MG_PENDING||!zasReady())return;
    const s=zasState(),q=zasQuest(s.active.id);s.active=null;
    (q.daily?s.daily:s.done).push(q.id);const before=S.xp;addXp(q.xp);addMoney(q.money);addMood(8);
    track('sideDone');track('zasStoryDone');if(!q.daily&&s.done.length===ZAS_STORIES.length)track('zasStoryChain');
    save();updateHud();sfx('quest');
    resultModal({emoji:q.who,title:q.title+' — выполнено',text:`${q.outro||'Спасибо, что снова помог району!'}<br><br>Награда: <b>${fmt(S.xp-before)} XP · ${fmt(q.money)} ₽ · +8 радости</b><br><button class="btn primary wide" data-act="zasBoard">К делам района</button>`,btn:'Отлично'});
  },
});
for(const tab of ['story','side'])EXTRA_TABS.tasks[tab]=(function(orig){return function(){const html=orig.apply(this,arguments);return zasEntry()+(tab==='side'?html.replace('Выполнено: <b>','Обычных поручений выполнено: <b>'):html);};})(EXTRA_TABS.tasks[tab]);
goalTarget=(function(orig){return function(g){if(zasAllowed()&&/^Достигни\s+\d+\s+уровня$/i.test(g.text)&&g.need>level())return ['tasks','story','.ze-entry','Открой дела Засранска — здесь есть опыт для переезда'];return orig(g);};})(goalTarget);
ACHS.push({id:'zas_neighbours',name:'Район держится на своих',emoji:'🏘️',key:'zasStoryDone',goals:[3,6,12,30,60],unit:'районных поручений'});
FRAMES.push({id:'zashelper',name:'Свой Засранску',how:'Все 12 историй «Город, который помнит»',need:()=>counter('zasStoryChain')>=1});
HOOKS.hud.push(()=>{if(zasAllowed()&&S.zasStories?.active&&zasReady())$('tasksDot')?.classList.remove('hidden');});
