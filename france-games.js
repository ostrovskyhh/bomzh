// France's games use the common lifecycle: all timers die with MG and every input
// checks mgAlive. Rewards and costs are handled by the calling activity, not setup.
const FR_WORDS=[['Bonjour','Здравствуйте'],['Merci','Спасибо'],['Pain','Хлеб'],['Fromage','Сыр'],['Grève','Забастовка'],['Mairie','Мэрия'],['Sortie','Выход'],['Liberté','Свобода'],['Demain','Завтра'],['Billet','Билет']];
function frArena(html,kind=''){
  const a=$('mgArena');a.className='mg-arena fr-arena '+kind;a.innerHTML=html;return a;
}
function frInput(el,mg,fn){el.onpointerdown=e=>{e.preventDefault();if(mgAlive(mg))fn(e);};}
function frPoint(mg,good,el){
  if(!mgAlive(mg))return;
  if(good){mgScore(1);sfx('coin');haptic('light');}
  else{mg.mistakes=(mg.mistakes||0)+1;sfx('error');shakeArena();}
  if(el)floatAt(el,good?'+1':'Попробуй ещё',good?'good':'bad');
}
function frTimer(mg,fn,ms){const t=setTimeout(()=>{if(mgAlive(mg))fn();},ms);mg.timers.push(t);return t;}

// Order assembly: the customer sees the whole order, with the next item outlined.
function frBakery(mg,cfg={}){
  const foods=cfg.items||['🥖','🥐','🧀','☕'];let order=[],pos=0;
  frArena('<div class="fr-shop-sign">'+(cfg.sign||'BOULANGERIE · булочная')+'</div><div class="fr-order" id="frOrder"></div><p id="frOrderNote">Собери заказ слева направо</p><div class="fr-choices">'+foods.map(x=>`<button class="fr-option">${x}</button>`).join('')+'</div>','fr-bakery');
  const draw=()=>{$('frOrder').innerHTML=order.map((x,i)=>`<span class="${i<pos?'done':i===pos?'next':''}">${x}</span>`).join('');};
  const next=()=>{order=Array.from({length:3},()=>pick(foods));pos=0;draw();};
  document.querySelectorAll('.fr-option').forEach((b,i)=>frInput(b,mg,()=>{
    const good=foods[i]===order[pos];frPoint(mg,good,b);
    if(good){pos++;if(pos===order.length)next();else draw();}
  }));next();
}

// Abstract line connections, not a copy of a real transit map. Instructions stay
// visible, and closures always leave exactly one usable route to the destination.
function frMetro(mg,cfg={}){
  const stops=cfg.stops||['Монмартр','Латинский квартал','Бастилия','Набережная Сены'];let target=0,closed=0;
  frArena('<div class="fr-shop-sign">MÉTRO · метро</div><div class="fr-metro-map"><i></i><i></i><i></i><span>●</span><span>●</span><span>●</span></div><p>Нужна станция <b id="frDestination"></b></p><p id="frClosed"></p><div class="fr-choices">'+stops.map(x=>`<button class="fr-option"></button>`).join('')+'</div>','fr-metro');
  const buttons=[...document.querySelectorAll('.fr-option')];
  const next=()=>{target=Math.floor(rand(0,stops.length));closed=(target+1+Math.floor(rand(0,stops.length-1)))%stops.length;
    $('frDestination').textContent=stops[target];$('frClosed').textContent='Красная линия закрыта из-за забастовки. Выбери открытый поезд к нужной станции.';
    buttons.forEach((b,i)=>{b.textContent=(i===closed?'⛔ ':'🚇 ')+stops[i];b.classList.toggle('closed',i===closed);});};
  buttons.forEach((b,i)=>frInput(b,mg,()=>{const good=i===target&&i!==closed;frPoint(mg,good,b);if(good)next();}));next();
}

function frForms(mg,cfg={}){
  let valid=false,deadline=0,answered=false;
  const windowMs=cfg.windowMs||2600;
  frArena('<div class="fr-shop-sign">'+(cfg.sign||'BUREAU №404 · бюро справок')+'</div><p>Принять только документ с <b>обоими</b> штампами: синий круг и золотая звезда.</p><div class="fr-document" id="frDocument"></div><div class="fr-doc-time"><i id="frDocumentTime"></i></div><div class="fr-choices"><button class="fr-option" id="frAccept">✅ Принять</button><button class="fr-option" id="frReject">↩ Вернуть</button></div>','fr-bureau');
  const next=()=>{const flags=[Math.random()<.7,Math.random()<.7];valid=flags[0]&&flags[1];answered=false;deadline=performance.now()+windowMs;
    $('frDocument').innerHTML='<small>Досье '+Math.floor(rand(100,999))+'</small><p>Подтверждение подтверждения</p><b>'+(flags[0]?'🔵':'⚪')+' '+(flags[1]?'⭐':'▫️')+'</b>';};
  const answer=(v,b)=>{if(answered)return;answered=true;frPoint(mg,v===valid,b);next();};
  frInput($('frAccept'),mg,()=>answer(true,$('frAccept')));frInput($('frReject'),mg,()=>answer(false,$('frReject')));
  mgLoop(mg,()=>{const left=deadline-performance.now();$('frDocumentTime').style.width=Math.max(0,left/windowMs*100)+'%';if(left<=0){frPoint(mg,false);next();}});next();
}

// An accessible rhythm game: cue text as well as colour, generous fixed timing.
function frMarch(mg,cfg={}){
  const period=cfg.period||1.5;let elapsed=0,last=-1,announced=-1;
  const chants=cfg.chants||['Хлеб! Сыр! Права!','Багет дороже — голос громче!','Мэр, выйди к людям!','Выходной — тоже искусство!'];
  frArena('<div class="fr-shop-sign">'+(cfg.sign||'PLACE DE LA BASTILLE · площадь Бастилии')+'</div><div class="fr-crowd">🧑🏿‍🦱 🪧 👩🏻‍🦰 🧑🏽 🥖</div><blockquote id="frChant"></blockquote><div class="fr-rhythm"><i id="frBeat"></i></div><button class="fr-option fr-march-tap" id="frMarchTap">Жди сигнала</button><small>Нажимай один раз за круг, когда написано «ПОРА». Точность важнее скорости.</small>','fr-march');
  frInput($('frMarchTap'),mg,()=>{
    const beat=Math.floor(elapsed/period),p=elapsed/period-beat;if(last===beat)return;last=beat;
    frPoint(mg,p>=.22&&p<=.78,$('frMarchTap'));
  });
  mgLoop(mg,dt=>{elapsed+=dt;const beat=Math.floor(elapsed/period),p=elapsed/period-beat,go=p>=.22&&p<=.78&&last!==beat;
    $('frBeat').style.left=(p*100)+'%';$('frMarchTap').textContent=go?'🪧 ПОРА!':'Жди следующего круга';$('frMarchTap').classList.toggle('ready',go);
    if(beat!==announced){announced=beat;$('frChant').textContent=chants[beat%chants.length];}
  });
}

function frMemory(mg,cfg={}){
  const icons=cfg.icons||['🕊️','🥖','☕','✉️'];let sequence=[],input=0,ready=false,round=0;
  const rounds=cfg.rounds||3;
  frArena('<div class="fr-shop-sign">'+(cfg.sign||'LE PIGEON · почтовый голубь')+'</div><p id="frMemoryNote">Запомни сигнал</p><div class="fr-memory-signal" id="frMemorySignal"></div><div class="fr-choices">'+icons.map(x=>`<button class="fr-option" disabled>${x}</button>`).join('')+'</div>','fr-memory');
  const buttons=[...document.querySelectorAll('.fr-option')];
  const next=()=>{ready=false;input=0;sequence=Array.from({length:3+Math.min(round,2)},()=>Math.floor(rand(0,icons.length)));
    buttons.forEach(b=>b.disabled=true);$('frMemoryNote').textContent=`Сигнал ${round+1}/${rounds}. Запомни слева направо`;
    $('frMemorySignal').textContent=sequence.map(i=>icons[i]).join(' ');
    frTimer(mg,()=>{$('frMemorySignal').textContent='• '.repeat(sequence.length);$('frMemoryNote').textContent='Повтори сигнал';ready=true;buttons.forEach(b=>b.disabled=false);},2200+sequence.length*200);
  };
  buttons.forEach((b,i)=>frInput(b,mg,()=>{
    if(!ready)return;if(sequence[input]!==i){ready=false;frPoint(mg,false,b);frTimer(mg,next,500);return;}
    input++;$('frMemorySignal').textContent=sequence.map((v,j)=>j<input?icons[v]:'•').join(' ');
    if(input===sequence.length){ready=false;frPoint(mg,true,b);round++;if(round>=rounds)frTimer(mg,mgEnd,350);else frTimer(mg,next,500);}
  }));next();
}

function frLanguage(mg,cfg={}) { return cityRequestGame(mg,{...cfg,theme:'fr'}); }
