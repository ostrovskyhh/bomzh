// Russian instructions and visible clues, with city-specific objects rather than translation tests.
const CITY_OBJECTS = {
  mex: [['🌮','Тако'],['🥑','Авокадо'],['🌽','Кукуруза'],['🧃','Сок']],
  fr: [['🥐','Круассаны'],['🥖','Багеты'],['🧀','Сыр'],['☕','Кофе']],
  school: [['📚','Книги'],['✏️','Карандаши'],['🎨','Краски'],['🧩','Головоломки']],
  dossier: [['📄','Выписки'],['🧾','Квитанции'],['📁','Папки'],['📷','Снимки']],
};
function cityRequestGame(mg,cfg={}) {
  const bank=CITY_OBJECTS[cfg.theme]||CITY_OBJECTS[S.city]||CITY_OBJECTS.school;
  $('mgArena').classList.add('fr-arena','city-game-arena');
  $('mgArena').dataset.city=S.city;
  let active=null,finished=false;
  const draw=()=>{
    if(!mgAlive(mg)||finished)return;
    const item=pick(bank),n=pick([1,2,3]),other=pick(bank.filter(x=>x!==item));
    const round={item,n};active=round;
    const options=shuffle([{item,n},{item,n:n%3+1},{item:other,n}]);
    $('mgArena').innerHTML=`<div class="city-activity"><small>${cfg.theme==='dossier'?'Досье Скорпионов':'Собери заказ по образцу'}</small><h3>Нужно: ${item[1]}, ${n} шт.</h3><div class="city-sample">${item[0].repeat(n)}</div><p>Выбери такой же предмет и количество. Верно +1, ошибка −1.</p><div class="city-options">${options.map((x,i)=>`<button class="fr-option city-option" data-option="${i}"><span>${x.item[0].repeat(x.n)}</span><b>${x.item[1]} · ${x.n} шт.</b></button>`).join('')}</div></div>`;
    document.querySelectorAll('.city-option').forEach((b,i)=>frInput(b,mg,()=>{
      if(active!==round||finished)return;active=null;
      const good=options[i].item===item&&options[i].n===n;
      if(!good)mg.mistakes=(mg.mistakes||0)+1;
      mgScore(good?1:-1);sfx(good?'tap':'error');
      if(cfg.goal&&mg.score>=cfg.goal){finished=true;frTimer(mg,mgEnd,250);}else draw();
    }));
  };draw();
}

// Five decisions, no reading deadline. Completing quickly cannot shorten the paid shift.
const CIVIC_MIN_MS=30000;
function civicGame(mg,cfg={}) {
  $('mgArena').classList.add('fr-arena','city-game-arena','civic-arena');
  $('mgArena').dataset.city=S.city;
  const deputy=cfg.civic==='deputy',place={zas:'Засранск',msk:'Москва',mex:'Веракрус',fr:'Париж'}[S.city]||'Город';
  const local={zas:['Осветить двор','Поставить урны','Починить остановку'],msk:['Обустроить двор у метро','Починить лифт','Открыть библиотеку'],mex:['Поставить навес на рынке','Обустроить пляж','Осветить площадь'],fr:['Починить велодорожку','Озеленить набережную','Обустроить сквер']}[S.city]||['Починить двор','Посадить деревья','Поставить скамейки'];
  const laws=shuffle([
    ...local.map((title,i)=>({title,cost:2+i,useful:true,why:'Жители получат полезное улучшение.'})),
    {title:'Купить позолоченное кресло депутату',cost:3,useful:false,why:'Только личная роскошь за общий счёт.'},
    {title:'Построить дворец из мрамора',cost:20,useful:true,why:'Идея слишком дорогая для бюджета этой смены.'},
  ]);
  const papers=shuffle([{sign:true,stamp:true},{sign:false,stamp:true},{sign:true,stamp:false},{sign:true,stamp:true},{sign:false,stamp:false}]);
  let index=0,budget=10,answered=false,card=null;
  // The generic watchdog assumes untimed games are stuck after two minutes. Reading is deliberate here.
  mg.limit=Infinity;
  const render=()=>{
    if(!mgAlive(mg))return;
    if(index===5){
      const remaining=Math.max(0,CIVIC_MIN_MS-(Date.now()-mg.start));
      $('mgArena').innerHTML=`<div class="city-activity"><div class="city-sample">✅</div><h3>Все 5 решений приняты</h3><p>Результат: ${mg.score}/10. Оплата — по результату, обычные бонусы сохраняются.</p><p>Смена завершится ${remaining?'через '+Math.ceil(remaining/1000)+' сек.':'сейчас'} Минимальная длительность — 30 секунд.</p></div>`;
      frTimer(mg,mgEnd,remaining);return;
    }
    answered=false;card=deputy?laws[index]:papers[index];
    const good=deputy?card.useful&&card.cost<=budget:card.sign&&card.stamp;
    const body=deputy?`<h3>${card.title}</h3><div class="city-facts"><b>Цена: ${card.cost}</b><b>Бюджет: ${budget}</b></div><p>${card.why}</p>`:`<h3>Заявление №${index+1}</h3><div class="city-facts"><b>${card.sign?'✅':'❌'} Подпись ${card.sign?'есть':'отсутствует'}</b><b>${card.stamp?'✅':'❌'} Печать ${card.stamp?'есть':'отсутствует'}</b></div>`;
    $('mgArena').innerHTML=`<div class="city-activity"><small>${place} · ${index+1} / 5</small><p class="city-rule">${deputy?'Одобряй полезное жителям, если хватает бюджета. Личные привилегии отклоняй.':'Одобряй только документы с подписью И печатью. Если чего-то нет — верни.'}</p>${body}<p>Время на чтение не ограничено. Верный ответ +2, ошибка — без очков.</p><div class="city-options"><button class="fr-option" data-decision="yes">${deputy?'✅ Принять закон':'✅ Одобрить'}</button><button class="fr-option" data-decision="no">${deputy?'❌ Отклонить':'↩️ Вернуть'}</button></div><p id="civicFeedback" aria-live="polite"></p></div>`;
    const buttons=[...document.querySelectorAll('[data-decision]')];
    buttons.forEach(b=>frInput(b,mg,()=>{
      if(answered)return;answered=true;buttons.forEach(x=>x.disabled=true);
      const yes=b.dataset.decision==='yes',correct=yes===good;
      if(correct)mgScore(2);
      // Invalid decisions never enact an unaffordable or self-serving law.
      if(deputy&&yes&&good)budget-=card.cost;
      const reason=deputy?(good?'Полезное улучшение укладывается в бюджет.':!card.useful?'Общие деньги не тратим на личные привилегии.':'Бюджета на этот проект не хватает.'):(good?'Подпись и печать на месте.':'Для одобрения нужны и подпись, и печать.');
      $('civicFeedback').textContent=(correct?'Верно! +2. ':'Ошибка, 0 очков. ')+reason;
      const next=document.createElement('button');next.className='fr-option';next.textContent=index===4?'Завершить решения':'Следующее дело';next.dataset.civicNext='';$('civicFeedback').after(next);
      frInput(next,mg,()=>{if(!answered||next.disabled)return;next.disabled=true;index++;render();});
    }));
  };render();
}
function applyAccessibleCity() {
  for(const id of ['clerk','deputy'])Object.assign(JOB_GAMES[id],{engine:civicGame,civic:id,duration:0,target:8,title:id==='clerk'?'Бюро: пять понятных дел':'Совет: пять решений для города',hint:'5 дел без таймера на чтение. 8 очков — 100% оплаты, 10 — 125%. Смена от 30 секунд.'});
}
applyCity=(function(orig){return function(){const result=orig.apply(this,arguments);applyAccessibleCity();return result;};})(applyCity);

// Update shared config objects in place: Mexico's restoration registry keeps their references.
Object.assign(MEX_JOB_GAMES.teacher,{title:'Мастерская на площади',hint:'Собирай наглядные заказы: предмет и количество видны по-русски.',engine:mg=>cityRequestGame(mg)});
Object.assign(MEX_JOB_GAMES.postman,{hint:'На письме всегда указан номер дома цифрами. Найди такой же номер.'});
Object.assign(MX_DATES.cafe,{title:'Кафе: заказ для двоих',hint:'Соберите заказ по видимому образцу — иностранные слова не нужны.',setup:mg=>cityRequestGame(mg)});
Object.assign(MX_KIDS.teen,{title:'Домашка: школьная мастерская',hint:'Помоги собрать нужные предметы и количество по образцу.',setup:mg=>cityRequestGame(mg,{theme:'school'})});
startLessonGame=(function(orig){return function(stage){
  if((S.city!=='mex'&&S.city!=='fr')||(S.city==='mex'&&stage===5))return orig(stage);
  if(stage<1||stage>5)return;
  const need=Math.max(2,Math.round([0,6,8,8,9,10][stage]*(hasEffect('t_focus')?.75:1)));
  const setup=S.city==='mex'?(stage===3?mg=>mxCalle(mg,{}):mg=>cityRequestGame(mg,{theme:stage===4?'dossier':'mex'})):(stage===2?frBakery:stage===3?frMetro:mg=>cityRequestGame(mg,{theme:stage>=4?'school':'fr'}));
  runGame({title:EDU[stage].name,scoreLabel:' / '+need,hint:`Все задания на русском, с видимыми образцами. Набери ${need} очков.`,duration:LESSON_TIME,setup,finish:score=>finishLesson(stage,score,need)});
};})(startLessonGame);

function alacranState(){return S.quest.alacran||(S.quest.alacran={});}
function alacranQuest(){return currentQuest()?.id==='x_jefe';}
const ALACRAN=QUESTS.find(q=>q.id==='x_jefe');
if(ALACRAN){
  ALACRAN.text='В выписках колл-центра нашлись следы Скорпионов. Собери досье по образцам, выбери помощь союзника и вызови Эль Алакрана. Победа требует подготовки, а не десятков случайных драк.';
  ALACRAN.goals=[qv(()=>S.quest.alacran?.dossier?1:0,1,'Собери досье: три точных комплекта'),qv(()=>S.quest.alacran?.route?1:0,1,'Выбери помощь союзника')];
  Object.assign(ALACRAN.boss,{lvl:1,form:64,strength:60,tier:5,intro:'«Думал, сюда никто не доберётся?..»'});
}
questGoalsHTML=(function(orig){return function(q){const html=orig(q);if(q.id!=='x_jefe')return html;const a=alacranState();return html+(!a.dossier?'<button class="btn primary wide" data-act="alacranDossier">📁 Собрать досье</button>':'<p>✅ Досье собрано. Улики переданы Рамиресу.</p>')+(!a.route?'<p>Союзники помогут в финальном бою. Выбери один вариант:</p><button class="btn wide" data-act="alacranSupport" data-id="ramirez">👮 Рамирес прикроет: сила босса −8</button><button class="btn wide" data-act="alacranSupport" data-id="pepe">🌮 Пепе отвлечёт: форма босса −8</button>':`<p>✅ ${a.route==='ramirez'?'Рамирес прикрывает: сила босса −8':'Пепе отвлекает: форма босса −8'}. Бой — следующий шаг.</p>`);};})(questGoalsHTML);
ACTIONS.alacranDossier=()=>{
  if(!alacranQuest()||alacranState().dossier||MG||MG_PENDING)return;
  runGame({title:'Досье Эль Алакрана',hint:'Собери три комплекта по наглядным образцам: предмет и количество. Языки знать не нужно.',duration:25,setup:mg=>cityRequestGame(mg,{theme:'dossier',goal:3}),finish:score=>{
    if(score>=3&&alacranQuest()){alacranState().dossier=true;save();}
    resultModal({emoji:score>=3?'📁':'🔎',title:score>=3?'Досье готово':'Проверим ещё раз',text:score>=3?'Следы Скорпионов подтверждены. Выбери союзника в задании, затем победи босса.':'Нужно три точных комплекта. Попытку можно повторить.',btn:'К заданию'});
  }});
};
ACTIONS.alacranSupport=id=>{if(!alacranQuest()||alacranState().route||!['ramirez','pepe'].includes(id))return;alacranState().route=id;save();toast('Союзник готов помочь в бою','good');};
startFight=(function(orig){return function(op,options){
  if(alacranQuest()&&op.name==='Эль Алакран'){
    if(!goalsDone(currentQuest())){toast('Сначала собери досье и выбери союзника','bad');return;}
    const a=alacranState();op={...op,strength:op.strength-(a.route==='ramirez'?8:0),form:op.form-(a.route==='pepe'?8:0)};
  }
  return orig(op,options);
};})(startFight);
