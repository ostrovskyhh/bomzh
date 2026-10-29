// Voluntary divorce requires two deliberate confirmations and a three-second final cooldown.
let DIVORCE_CONFIRM=null,DIVORCE_CONFIRM_TIMER=null;
function divorceConfirmRender(){
  const state=DIVORCE_CONFIRM,g=wife();if(!state||!g||g.id!==state.gid)return;
  const final=state.step===2;
  openModal(`<section class="divorce-confirm"><span class="dc-heart">💔</span><h3>${final?'Подтверди решение ещё раз':'Ты точно хочешь развестись?'}</h3><p>Супруга: <b>${esc(g.name)}</b></p><p>Мирное соглашение стоит 5% денег. В суде уйдут 20% денег и один объект имущества. Семейные отношения изменятся.</p><p>Сейчас брак ещё сохранён. Можно отменить без потерь.</p><div class="btns">${final?'<button class="btn danger wide" data-act="divorceConfirmFinal" id="divorceConfirmFinal" disabled>Подожди 3 секунды</button>':'<button class="btn danger wide" data-act="divorceConfirmNext">Понимаю последствия — продолжить</button>'}<button class="btn primary wide" data-act="divorceConfirmCancel">Отмена — сохранить семью</button></div></section>`,{center:true});
  clearInterval(DIVORCE_CONFIRM_TIMER);
  if(final)DIVORCE_CONFIRM_TIMER=setInterval(()=>{const b=$('divorceConfirmFinal');if(!b||DIVORCE_CONFIRM!==state){clearInterval(DIVORCE_CONFIRM_TIMER);return;}const left=Math.max(0,Math.ceil((state.ready-Date.now())/1000));b.disabled=left>0;b.textContent=left?`Подожди ${left} сек.`:'Да, подать на развод';},100);
}
const startDivorceBeforeConfirm=startDivorce;
startDivorce=function(byWife,reason){if(byWife)return startDivorceBeforeConfirm(byWife,reason);const g=wife();if(!g)return;DIVORCE_CONFIRM={gid:g.id,reason,step:1,ready:0};divorceConfirmRender();};
ACTIONS.divorceConfirmNext=()=>{if(!DIVORCE_CONFIRM||DIVORCE_CONFIRM.step!==1||!document.querySelector('.divorce-confirm')||wife()?.id!==DIVORCE_CONFIRM.gid)return;DIVORCE_CONFIRM.step=2;DIVORCE_CONFIRM.ready=Date.now()+3000;divorceConfirmRender();};
ACTIONS.divorceConfirmCancel=()=>{DIVORCE_CONFIRM=null;clearInterval(DIVORCE_CONFIRM_TIMER);closeModal();};
ACTIONS.divorceConfirmFinal=()=>{const state=DIVORCE_CONFIRM;if(!state||state.step!==2||Date.now()<state.ready||document.hidden||!$('divorceConfirmFinal')||wife()?.id!==state.gid)return;DIVORCE_CONFIRM=null;clearInterval(DIVORCE_CONFIRM_TIMER);startDivorceBeforeConfirm(false,state.reason);};

// Five requests routed to three clear departments; no reading deadline or minimum shift duration.
const BUREAU_DEPARTMENTS=[{id:'documents',emoji:'📄',name:'Документы'},{id:'repair',emoji:'🔧',name:'Ремонт города'},{id:'support',emoji:'🤝',name:'Социальная помощь'}];
const BUREAU_CASES=[
  {title:'Нужен новый паспорт',text:'Житель потерял паспорт и пришёл оформить новый документ.',department:'documents'},
  {title:'Справка для работы',text:'Для трудоустройства нужна официальная справка.',department:'documents'},
  {title:'Во дворе не горит фонарь',text:'Нужно отправить мастера починить освещение.',department:'repair'},
  {title:'Сломалась скамейка',text:'Жители просят отремонтировать скамейку в парке.',department:'repair'},
  {title:'Помощь пожилому соседу',text:'Пожилому человеку нужна доставка продуктов и поддержка.',department:'support'},
  {title:'Поддержка семьи',text:'Семье с детьми нужна социальная помощь.',department:'support'}
];
function bureauCasesGame(mg){
  mg.limit=Infinity;mg.bureauCases=shuffle(BUREAU_CASES.slice()).slice(0,5);mg.bureauDone=0;
  $('mgArena').classList.add('fr-arena','city-game-arena','bureau-arena');
  const draw=()=>{
    if(!mgAlive(mg))return;const task=mg.bureauCases[mg.bureauDone];let answered=false;
    $('mgArena').innerHTML=`<section class="bureau-case"><small>Обращение ${mg.bureauDone+1} из 5</small><div class="progress"><div style="width:${mg.bureauDone*20}%"></div></div><h3>${task.title}</h3><p>${task.text}</p><p>В какой отдел направить обращение?</p><div class="bureau-departments">${BUREAU_DEPARTMENTS.map(d=>`<button class="btn wide" data-bureau-department="${d.id}"><span>${d.emoji}</span>${d.name}</button>`).join('')}</div><p id="bureauFeedback" aria-live="polite"></p></section>`;
    document.querySelectorAll('[data-bureau-department]').forEach(b=>frInput(b,mg,()=>{
      if(answered)return;answered=true;document.querySelectorAll('[data-bureau-department]').forEach(x=>x.disabled=true);
      const correct=b.dataset.bureauDepartment===task.department;if(correct)mgScore(2);else mg.mistakes=(mg.mistakes||0)+1;
      mg.bureauDone++;$('bureauFeedback').textContent=(correct?'Верно! +2 очка. ':'Ошибка. ')+BUREAU_DEPARTMENTS.find(d=>d.id===task.department).name;
      if(mg.bureauDone===5){mgDelay(mg,mgEnd,350);return;}
      const next=document.createElement('button');next.className='btn primary wide';next.dataset.bureauNext='';next.textContent='Следующее обращение';$('bureauFeedback').after(next);frInput(next,mg,()=>{if(next.disabled)return;next.disabled=true;draw();});
    }));
  };draw();
}
applyAccessibleCity=(function(orig){return function(){orig();Object.assign(JOB_GAMES.clerk,{type:'bureau',engine:bureauCasesGame,duration:0,target:8,title:'Бюро: пять обращений',hint:'Направь 5 обращений в нужные отделы. Верно: +2 очка, ошибка: 0. Таймера нет — смена закончится после пятого обращения.'});};})(applyAccessibleCity);
applyAccessibleCity();
