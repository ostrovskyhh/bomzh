// Server owns deck, bets and payouts; the client displays public table state.
let BJ_NET={table:1,state:null,busy:false,timer:null,pending:null,offset:0,seq:0};
function bjWallet(w,localDelta=0){
  if(!w)return true;
  if(w.device&&w.device!==DEVICE_ID&&(w.rev||0)>serverBase)return false;
  const changed=w.walletRev>(S.bjWalletRev||0);
  if(w.walletRev>(S.bjWalletRev||0)){S.money=w.money+localDelta;S.bjWalletRev=w.walletRev;}
  if(w.active!==undefined)S.bjInRound=!!w.active;
  if(w.table)S.bjTable=w.table;
  if(changed){serverBase=Math.max(serverBase,w.rev||0);REV_FLOOR=Math.max(REV_FLOOR,w.rev||0);S.rev=Math.max(S.rev||0,w.rev||0);}
  return true;
}
// Old autosaves may finish after a server debit/payout. Rebase before retry, even on one device.
serverCall=(function(orig){return async function(path,extra){let r=await orig(path,extra);
  if(path==='put'&&r.walletStale){bjWallet(r.wallet);S.rev=Math.max(S.rev||0,r.rev||0)+1;return orig(path,{...extra,data:JSON.stringify(S),rev:S.rev,base:serverBase});}
  return r;
};})(serverCall);
function bjInputScale(){return city()==='mex'?USD_RATE:city()==='fr'?EUR_RATE:1;}
function bjCards(cards){return cards.map(c=>`<span class="${['♥','♦'].includes(c[1])?'red':''}">${esc(c[0])}${esc(c[1])}</span>`).join(' · ');}
function bjRender(){
  const t=BJ_NET.state;if(!t)return;
  const me=t.players.find(p=>p.me),left=Math.max(0,Math.ceil((t.until-(Date.now()+BJ_NET.offset))/1000));
  const titles={betting:'Приём ставок',playing:'Игроки принимают решения',settled:'Результаты раздачи'};
  const seat=p=>`<div class="bj-seat ${p.me?'mine':''}"><b>${p.me?'Вы':esc(p.name)} · место ${p.seat}</b><small>Ставка: ${incomeMoney(p.bet)}</small><div class="bj-cards">${p.cards.length?bjCards(p.cards):'🂠 🂠'}</div><small>${t.phase==='settled'?(p.payout>p.bet?'Выигрыш':p.payout===p.bet?'Возврат ставки':'Проигрыш')+' · выплата '+incomeMoney(p.payout):p.done?'Ожидает крупье':''}</small></div>`;
  const scale=bjInputScale(),minimum=Math.ceil(t.minimum/scale*100)/100,maximum=Math.floor(1000000/scale*100)/100;
  const old=document.querySelector('#bjOnlineBet');
  if(old===document.activeElement&&t.phase==='betting'&&!BJ_NET.busy){if($('bjOnlineTime'))$('bjOnlineTime').textContent=left;return;}
  const rulesOpen=$('bjOnline')?.querySelector('details')?.open;
  const amount=old?.value||String(Math.max(minimum,Math.min(100,Math.floor(S.money/scale*100)/100)));
  const locked=BJ_NET.busy||!!BJ_NET.pending;
  const buttons=BJ_NET.pending?'<button class="btn primary wide" data-act="bjOnlineRetry">Повторить запрос безопасно</button>':t.phase==='betting'&&!me?`<label>Ставка игровыми деньгами (мин. ${incomeMoney(minimum*scale)})<input id="bjOnlineBet" type="number" inputmode="numeric" min="${minimum}" max="${maximum}" step="${scale===1?1:.01}" value="${esc(amount)}"></label><button class="btn primary wide" data-act="bjOnlineAction" data-id="bet" ${locked?'disabled':''}>Занять место и поставить</button>`:t.phase==='playing'&&me&&!me.done?`<div class="bj-actions"><button class="btn" data-act="bjOnlineAction" data-id="hit" ${locked?'disabled':''}>Ещё карту</button><button class="btn" data-act="bjOnlineAction" data-id="stand" ${locked?'disabled':''}>Хватит</button><button class="btn wide" data-act="bjOnlineAction" data-id="double" ${locked||me.cards.length!==2||S.money<me.bet?'disabled':''}>Удвоить · ещё ${incomeMoney(me.bet)}</button></div>`:'<p>Можно наблюдать за столом. Ставки следующей раздачи откроются автоматически.</p>';
  const html=`<div id="bjOnline" class="bj-table"><h3>🃏 Онлайн-блэкджек · стол ${t.table}</h3><div class="btns">${[1,2,3].map(i=>`<button class="btn small" data-act="bjOnlineTable" data-id="${i}" ${locked?'disabled':''}>${i} · от ${incomeMoney([0,10,100,1000][i])}</button>`).join('')}</div><p>${titles[t.phase]} · <span id="bjOnlineTime">${left}</span> сек.</p><small>Баланс: ${incomeMoney(S.money)}. До 5 игроков за столом.</small><h4>Крупье</h4><div class="bj-cards">${bjCards(t.dealer)}${t.phase==='playing'?' · 🂠':''}</div><div class="bj-seats">${t.players.length?t.players.map(seat).join(''):'Пока мест не заняли — ваша ставка откроет игру.'}</div>${buttons}<details ${rulesOpen?'open':''}><summary>Правила и выплаты</summary><p>6 колод. Крупье стоит на любых 17. Натуральный блэкджек — 3:2, обычная победа — 1:1, ничья возвращает ставку. Ставка списывается сервером. Удвоение — на первых двух картах, затем одна карта и стоп. При истечении 40 секунд — автоматический стоп. Закрытие окна сохраняет ставку и раздачу; возврата за выход нет.</p></details><button class="btn wide" data-act="close">Закрыть стол — ставка остаётся</button></div>`;
  const root=$('bjOnline');if(root)root.outerHTML=html;else openModal(html,{center:true});
}
async function bjPoll(){
  if(BJ_NET.busy)return;
  const seq=++BJ_NET.seq,table=BJ_NET.table;
  try{const r=await apiPost('blackjack/state',{table});if(seq!==BJ_NET.seq||table!==BJ_NET.table)return;if(r.error)throw new Error(r.error);BJ_NET.offset=r.now-Date.now();BJ_NET.state=r;if(!bjWallet(r.wallet)){const remote=await serverGet();if(remote)adoptOrAsk(remote);return;}bjTrackRound(r);save();if($('bjOnline'))bjRender();}
  catch(e){if($('bjOnline'))toast('Стол временно недоступен. Раздача сохранена.','bad');}
}
async function bjOpenOnline(table){
  if(!onlineOn())return toast('Онлайн-столы доступны в игре внутри Telegram','bad');
  clearInterval(BJ_NET.timer);BJ_NET.table=Number(table)||BJ_NET.pending?.table||S.bjTable||1;
  openModal('<div id="bjOnline" class="bj-table">Подключаемся к общему столу…</div>',{center:true});await bjPoll();
  BJ_NET.timer=setInterval(()=>{if(!$('bjOnline')){clearInterval(BJ_NET.timer);return;}if(!document.hidden)bjPoll();},2000);
}
async function bjDo(op){
  if(BJ_NET.busy||!BJ_NET.state)return;
  BJ_NET.busy=true;++BJ_NET.seq;
  const request=BJ_NET.pending||{op,table:BJ_NET.table,round:BJ_NET.state.round,amount:op==='bet'?Math.round(Number($('bjOnlineBet')?.value)*bjInputScale()):undefined,rid:crypto.randomUUID()};
  BJ_NET.pending=request;bjRender();
  try{
    // Flush earned money before asking the authoritative wallet to reserve a stake.
    save();await serverWrite();for(let i=0;srvBusy&&i<100;i++)await new Promise(r=>setTimeout(r,50));
    if(srvBusy||SAVE_LOCK||!serverReady)throw new Error('Сначала дождитесь синхронизации сохранения');
    const before=S.money,r=await apiPost('blackjack/'+request.op,{...request,device:DEVICE_ID,base:serverBase});
    if(r.error){BJ_NET.pending=null;toast(r.error,'bad');return;}
    bjWallet(r.wallet,S.money-before);BJ_NET.table=r.table;BJ_NET.state=r;BJ_NET.offset=r.now-Date.now();BJ_NET.pending=null;
    bjTrackRound(r);save();
  }catch(e){toast('Ответ не получен. Повторите тот же запрос: ставка не спишется дважды.','bad');}
  finally{BJ_NET.busy=false;if($('bjOnline'))bjRender();}
}
function bjTrackRound(t){
  S.bjSeenRounds=S.bjSeenRounds||[];S.bjEarningsSeen=S.bjEarningsSeen||[];
  for(const r of [...(t.results||[])].reverse()){
    if(!S.bjEarningsSeen.includes(r.round)){S.bjEarningsSeen.push(r.round);if(S.bjEarningsSeen.length>100)S.bjEarningsSeen.shift();S.stats.earned+=Math.max(0,r.payout);if(r.payout>0)bump('resMoney');}
    if(S.bjSeenRounds.includes(r.round))continue;
    S.bjSeenRounds.push(r.round);if(S.bjSeenRounds.length>100)S.bjSeenRounds.shift();
    const stat=cst(),prior=stat.games.bj||0,event=CASINO_TRACK_EVENT;
    try{CASINO_TRACK_EVENT={kind:'bj',bet:r.bet};track('casino');}finally{CASINO_TRACK_EVENT=event;}
    if((stat.games.bj||0)===prior){stat.games.bj=prior+1;stat.bet+=r.bet;}
    stat.won+=r.payout;stat.best=Math.max(stat.best,r.payout);if(r.payout>r.bet)track('bjWin');
  }
}

ACTIONS.bj=()=>bjOpenOnline();ACTIONS.bjOnlineTable=id=>bjOpenOnline(+id);ACTIONS.bjOnlineAction=bjDo;ACTIONS.bjOnlineRetry=()=>bjDo(BJ_NET.pending?.op);
const bjLobby=CASINO_GAMES.find(g=>g.act==='bj');if(bjLobby)Object.assign(bjLobby,{name:'Блэкджек · общие столы',desc:'До 5 игроков. Видны ставки и карты, выплаты 3:2'});
function bjTravelBlocked(){if(S.bjInRound||BJ_NET.busy||BJ_NET.pending){toast('Сначала заверши раздачу за онлайн-столом','bad');return true;}return false;}
doMove=(function(orig){return function(){if(bjTravelBlocked())return;return orig.apply(this,arguments);};})(doMove);
doMoveMex=(function(orig){return function(){if(bjTravelBlocked())return;return orig.apply(this,arguments);};})(doMoveMex);
doMoveFrance=(function(orig){return function(){if(bjTravelBlocked())return;return orig.apply(this,arguments);};})(doMoveFrance);
performPrestige=(function(orig){return function(){if(bjTravelBlocked())return;return orig.apply(this,arguments);};})(performPrestige);
HOOKS.init.push(()=>{if(onlineOn()&&(S.bjInRound||S.bjWalletRev)){BJ_NET.table=S.bjTable||1;setTimeout(bjPoll,7000);}});
