// No house opponent or fabricated players: tables, dice and stakes come from the server.
const DICE_UI={open:false,table:0,state:null,busy:false,timer:null};
function diceReceipts(results){
  S.diceSeen=S.diceSeen||[];
  for(const r of [...(results||[])].reverse()){
    if(S.diceSeen.includes(r.round_id))continue;
    S.diceSeen.push(r.round_id);if(S.diceSeen.length>100)S.diceSeen.shift();
    if(r.refund)continue;
    S.stats.earned+=Math.max(0,r.payout);const stat=cst(),before=stat.games.dice||0,old=CASINO_TRACK_EVENT;
    try{CASINO_TRACK_EVENT={kind:'dice',bet:r.bet};track('casino');}finally{CASINO_TRACK_EVENT=old;}
    if((stat.games.dice||0)===before){stat.games.dice=before+1;stat.bet+=r.bet;}
    stat.won+=r.payout;stat.best=Math.max(stat.best,r.payout);if(r.payout>r.bet)track('diceWin');
  }
}
async function diceRequest(op='state',extra={}){
  if(DICE_UI.busy||SAVE_LOCK)return;
  DICE_UI.busy=true;const before=S.money;
  try{
    const data=await apiPost('dice/'+op,{...extra,device:DEVICE_ID,base:serverBase});
    if(data.error)throw Error(data.error);
    if(!bjWallet(data.wallet,S.money-before)){const remote=await serverGet();if(remote)adoptOrAsk(remote);throw Error('Профиль обновлён на другом устройстве');}
    S.diceActive=!!data.active;S.diceTable=data.active||0;diceReceipts(data.results);DICE_UI.state=data;
    if(data.active&&(op==='create'||op==='join'))DICE_UI.table=data.active;
    save();if(DICE_UI.open&&$('diceOnline')&&document.activeElement?.id!=='diceStake')renderDiceOnline();return data;
  }catch(e){if(DICE_UI.open&&$('diceOnline')){const el=$('diceError');if(el)el.textContent=e.message||'Нет связи. Проверяем стол при повторном подключении.';}if(op!=='state')toast(e.message||'Проверяем результат на сервере','bad');}
  finally{DICE_UI.busy=false;}
}
function renderDiceOnline(){
  const root=$('diceOnline');if(!root)return;
  const data=DICE_UI.state;if(!data){root.innerHTML='<p>Загружаем настоящие столы…</p><p id="diceError"></p>';return;}
  const table=data.tables.find(t=>t.id===DICE_UI.table),phase={waiting:'Сбор игроков',rolling:'Бросок кубиков',settled:'Итоги'};
  const lobby=()=>`<h3>🎲 Кости с игроками</h3><p>2–5 игроков · два кубика · общий банк без комиссии.</p><p>После второго участника — 30 секунд на сбор, затем 15 секунд на бросок. При отсутствии игрока сервер бросит автоматически. Ничья лидеров — переброс без доплаты; после 5 ничьих банк делится.</p><div class="dice-create"><label>Ставка каждого, ₽ <input id="diceStake" type="number" min="10" max="1000000" step="1" value="1000"></label><button class="btn primary wide" data-act="diceCreate" ${data.active?'disabled':''}>Создать стол</button></div><div class="list">${data.tables.filter(t=>t.phase!=='settled'||t.players.some(p=>p.me)).map(t=>`<button class="btn wide" data-act="diceTable" data-id="${t.id}">Стол №${t.id} · ${fmt(t.stake)} ₽ · ${t.players.length}/5 · ${phase[t.phase]}</button>`).join('')||'<div class="info-card">Столов пока нет. Создай свой — другие игроки смогут присоединиться.</div>'}</div>`;
  if(!table)root.innerHTML=lobby();
  else{
    const me=table.players.find(p=>p.me),left=Math.max(0,Math.ceil((table.until*1000-data.now)/1000));
    root.innerHTML=`<button class="btn small" data-act="diceLobby">‹ Все столы</button><h3>Стол №${table.id} · ${phase[table.phase]}</h3><div class="info-card">Ставка каждого <b>${fmt(table.stake)} ₽</b> · банк <b>${fmt(table.stake*table.players.length)} ₽</b><br>${table.phase==='waiting'?(table.players.length<2?'Ждём второго игрока. Через '+left+' сек. одиночная ставка вернётся.':'Игра начнётся через '+left+' сек.') :table.phase==='rolling'?`Бросок №${table.throw} · ${left} сек.`:table.refund?'Соперник не нашёлся: ставки возвращены.':'Банк выплачен победителю. Все суммы уже рассчитаны сервером.'}</div>
      <div class="dice-seats">${table.players.map(p=>`<article class="dice-seat ${p.me?'me':''}"><b>${esc(p.name)}${p.me?' · ты':''}</b><small>Ставка ${fmt(table.stake)} ₽${p.out?' · наблюдает':''}</small><div class="dice-pair">${p.dice?p.dice.map(dieHTML).join(''):'🎲 🎲'}</div><small>${p.dice?'Сумма '+p.dice.reduce((a,b)=>a+b,0)+(p.auto?' · автобросок':''):'Ожидает броска'}${table.phase==='settled'?'<br>Выплата '+fmt(p.payout)+' ₽':''}</small></article>`).join('')}</div>
      ${!me&&table.phase==='waiting'?`<button class="btn primary wide" data-act="diceJoin" ${data.active||table.players.length>=5?'disabled':''}>Сесть за ${fmt(table.stake)} ₽</button>`:''}
      ${me&&table.phase==='waiting'?'<button class="btn wide" data-act="diceLeave">Выйти и вернуть ставку</button>':''}
      ${me&&table.phase==='rolling'&&!me.out?`<button class="btn primary wide" data-act="diceThrow" ${me.dice?'disabled':''}>${me.dice?'Бросок принят':'Бросить два кубика'}</button>`:''}
      ${table.history.length?`<details><summary>Предыдущие броски</summary>${table.history.map(h=>`<p>№${h.throw}: ${h.totals.map(p=>esc(p.name)+' — '+p.sum).join(' · ')}</p>`).join('')}</details>`:''}`;
  }
  root.insertAdjacentHTML('beforeend','<p id="diceError" role="status"></p><small>После начала игры ставка участвует до расчёта, даже если закрыть окно. Переезд и престиж доступны после завершения.</small>');
}
function openDiceOnline(){
  if(level()<CASINO_LEVEL)return;
  if(!onlineOn()){toast('Онлайн-кости доступны в Telegram при подключении к серверу','bad');return;}
  DICE_UI.open=true;DICE_UI.table=S.diceTable||0;openModal('<div id="diceOnline"></div>',{center:true});renderDiceOnline();diceRequest();
  clearInterval(DICE_UI.timer);DICE_UI.timer=setInterval(()=>{if(!$('diceOnline')){DICE_UI.open=false;clearInterval(DICE_UI.timer);return;}if(!document.hidden)diceRequest();},1500);
}
async function diceAction(op,extra={}){
  if(DICE_UI.busy||SAVE_LOCK)return;
  if(op==='create'||op==='join'){
    save();await serverWrite();if(SAVE_LOCK||serverBase<(S.rev||0)){toast('Дождись синхронизации сохранения и попробуй снова','bad');return;}
  }
  const t=DICE_UI.state?.tables.find(t=>t.id===DICE_UI.table);
  return diceRequest(op,{table:t?.id,round:t?.round,throw:t?.throw,rid:'dice-'+crypto.randomUUID(),...extra});
}
ACTIONS.dice=openDiceOnline;
ACTIONS.diceCreate=()=>{const stake=Number($('diceStake')?.value);if(!Number.isInteger(stake)||stake<10||stake>1000000){toast('Ставка: целое число от 10 до 1 000 000 ₽','bad');return;}return diceAction('create',{stake});};
ACTIONS.diceTable=id=>{DICE_UI.table=Number(id);renderDiceOnline();};
ACTIONS.diceLobby=()=>{DICE_UI.table=0;renderDiceOnline();};
ACTIONS.diceJoin=()=>diceAction('join');ACTIONS.diceLeave=()=>diceAction('leave');ACTIONS.diceThrow=()=>diceAction('roll');
const diceLobbyEntry=CASINO_GAMES.find(g=>g.act==='dice');if(diceLobbyEntry)Object.assign(diceLobbyEntry,{name:'Кости с игроками',desc:'Онлайн-столы на 2–5 игроков. Видимые ставки, общий банк, серверный бросок'});
prestigeProfile=(function(orig){return function(){return {...orig(),diceSeen:[...(S.diceSeen||[])]};};})(prestigeProfile);
for(const action of ['doMove','doMoveMex','doMoveFrance','performPrestige']){
  const orig=window[action];window[action]=function(){if(S.diceActive||DICE_UI.busy){toast('Сначала дождись расчёта стола с костями','bad');return;}return orig.apply(this,arguments);};
}
HOOKS.init.push(()=>{setTimeout(()=>{if(onlineOn())diceRequest();},3500);setInterval(()=>{if(S.diceActive&&!DICE_UI.open&&!document.hidden)diceRequest();},5000);});
