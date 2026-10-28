// Retired online-table compatibility: recover existing wallet/results; new games use the original solo engine.
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

let BJ_RETIRE_SYNC=null,BJ_RETIRE_DONE=false,BJ_RETIRE_TIMER=null;
async function recoverRetiredBlackjack(){
  if(BJ_RETIRE_DONE)return true;
  if(SAVE_LOCK)return false;
  if(!onlineOn())return !S.bjInRound;
  if(BJ_RETIRE_SYNC)return BJ_RETIRE_SYNC;
  BJ_RETIRE_SYNC=(async()=>{
    for(const table of [...new Set([S.bjTable||1,1,2,3])]){
      const r=await apiPost('blackjack/state',{table});if(r.error)throw new Error(r.error);
      if(!bjWallet(r.wallet)){const remote=await serverGet();if(remote)adoptOrAsk(remote);return false;}
      bjTrackRound(r);
    }
    BJ_RETIRE_DONE=!S.bjInRound;save();return BJ_RETIRE_DONE;
  })();
  try{return await BJ_RETIRE_SYNC;}finally{BJ_RETIRE_SYNC=null;}
}
ACTIONS.bj=async()=>{
  if(level()<CASINO_LEVEL)return;
  if((S.bjInRound||S.bjWalletRev)&&!BJ_RETIRE_DONE){
    if(SAVE_LOCK){toast('Сначала заверши синхронизацию или выбор сохранения','bad');return;}
    openModal('<div id="bjRecoveryCheck" class="info-card">Проверяем расчёт прежней раздачи…</div>',{center:true,locked:true});
    try{if(!await recoverRetiredBlackjack()){if($('bjRecoveryCheck')){closeModal();toast('Прежняя онлайн-раздача ещё рассчитывается. Попробуй через минуту','bad');}return;}}
    catch(e){if($('bjRecoveryCheck'))closeModal();toast('Нужно подключение, чтобы проверить расчёт прежней раздачи','bad');return;}
  }
  openBlackjack();
};
const bjLobby=CASINO_GAMES.find(g=>g.act==='bj');if(bjLobby)Object.assign(bjLobby,{name:'Блэкджек',desc:'Одиночная игра с крупье. Ещё, хватит, удвоить. Блэкджек 3:2'});
function bjTravelBlocked(){if(S.bjInRound||BJ_RETIRE_SYNC){toast('Прежняя онлайн-раздача ещё рассчитывается','bad');return true;}return false;}
doMove=(function(orig){return function(){if(bjTravelBlocked())return;return orig.apply(this,arguments);};})(doMove);
doMoveMex=(function(orig){return function(){if(bjTravelBlocked())return;return orig.apply(this,arguments);};})(doMoveMex);
doMoveFrance=(function(orig){return function(){if(bjTravelBlocked())return;return orig.apply(this,arguments);};})(doMoveFrance);
performPrestige=(function(orig){return function(){if(bjTravelBlocked())return;return orig.apply(this,arguments);};})(performPrestige);
HOOKS.init.push(()=>{
  if(!onlineOn()||!S.bjInRound)return;
  const retry=async()=>{try{if(await recoverRetiredBlackjack())clearInterval(BJ_RETIRE_TIMER);}catch(e){/* retry without unsolicited popups */}};
  BJ_RETIRE_TIMER=setInterval(retry,5000);setTimeout(retry,1500);
});
