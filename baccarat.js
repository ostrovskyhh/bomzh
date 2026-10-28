// Commission baccarat: eight-deck shoe, automatic draw, one settlement per round.
const BAC_NAMES={player:'Игрок',banker:'Банк',tie:'Ничья'};
let BAC={shoe:[],history:[],choice:'player',round:null,visible:0,seq:0};
function bacShoe(){if(!BACCARAT_BUSY && BAC.shoe.length<52){BAC.shoe=shuffle(Array.from({length:8},()=>newDeck()).flat());BAC.history=[];BAC.round=null;}}
function bacCards(cards,side){
  const order=[];if(BAC.round){for(let i=0;i<2;i++){order.push(['player',i],['banker',i]);}if(BAC.round.p.length>2)order.push(['player',2]);if(BAC.round.b.length>2)order.push(['banker',2]);}
  return (cards||[null,null]).map((c,i)=>{
    const shown=c && (!BACCARAT_BUSY || order.findIndex(x=>x[0]===side&&x[1]===i)<BAC.visible);
    return `<div class="bac-card ${shown?'face':'back'} ${c&&['♥','♦'].includes(c.s)?'red':''}">${shown?`<b>${c.r}</b><span>${c.s}</span><small>${c.r}</small>`:'<span>✦</span>'}</div>`;
  }).join('');
}
function bacHTML(){
  const r=BAC.round,done=r&&!BACCARAT_BUSY;
  const hand=(side,cards,score)=>`<section class="bac-hand ${done&&r.winner===side?'winner':''}"><header><span>${BAC_NAMES[side]}</span><b>${done?score:'—'}</b></header><div class="bac-cards">${bacCards(cards,side)}</div></section>`;
  return `<div class="bac-premium" id="baccaratTable"><div class="bac-heading"><span>♠ КЛАССИЧЕСКИЙ СТОЛ</span><b>Баккара</b><small>${esc(cityIdentity().casino)} · 8 колод</small></div>
    <div class="bac-wallet"><span>Баланс <b>${fmt(S.money)} ₽</b></span><span>Фишка <b>${fmt(S.bet)} ₽</b></span></div>
    <div class="bac-felt">${hand('banker',r&&r.b,r&&r.bv)}<div class="bac-divider">${BACCARAT_BUSY?'РАЗДАЧА КАРТ':done?BAC_NAMES[r.winner].toUpperCase():'ВЫБЕРИ СТОРОНУ'}</div>${hand('player',r&&r.p,r&&r.pv)}</div>
    <div class="bac-outcome" role="status" aria-live="polite">${BACCARAT_BUSY?'Карты открываются. Ставка уже принята.':done?`${r.winner==='tie'?'Ничья':`Победил ${BAC_NAMES[r.winner].toLowerCase()}`} · ${r.pv}:${r.bv}<br><strong>${r.returned===r.bet?'Возврат ставки':r.returned>r.bet?'Чистый выигрыш +'+fmt(r.returned-r.bet):'Проигрыш −'+fmt(r.bet)} ₽</strong>`:'Поставь на игрока, банк или ничью. Добор карт автоматический.'}</div>
    <div class="bac-sides">${[['player','1:1'],['tie','8:1'],['banker','0,95:1']].map(([s,odds])=>`<button class="bac-side ${s} ${BAC.choice===s?'selected':''}" data-act="baccaratSide" data-id="${s}" aria-pressed="${BAC.choice===s}" ${BACCARAT_BUSY?'disabled':''}><b>${BAC_NAMES[s]}</b><small>${odds}</small></button>`).join('')}</div>
    ${betPicker()}<button class="btn primary wide bac-deal" data-act="baccaratDeal" ${BACCARAT_BUSY?'disabled':''}>${BACCARAT_BUSY?'Идёт раздача…':`Раздать · ${BAC_NAMES[BAC.choice]} · ${fmt(S.bet)} ₽`}</button>
    <details class="bac-rules"><summary>Правила и выплаты</summary><p>Цель — угадать, у какой руки сумма ближе к 9. Туз = 1, 2–9 по номиналу, 10/J/Q/K = 0. Считается последняя цифра суммы. Натуральные 8 или 9 на первых двух картах завершают раздачу.</p><p>Добор автоматический: игрок берёт при 0–5, стоит на 6–7. Банк без третьей карты игрока берёт при 0–5; с третьей картой берёт при 0–2 всегда, при 3 кроме восьмёрки, при 4 на 2–7, при 5 на 4–7, при 6 на 6–7.</p><p>Чистая выплата: игрок 1:1, банк 0,95:1 (комиссия 5% только с выигрыша), ничья 8:1. При ничьей ставки на игрока и банк возвращаются. Выплата округляется вниз до целой игровой денежной единицы. Минимум 10 ₽, максимум ${fmt(BET_MAX)} ₽. На раздачу выбирается одна сторона.</p></details>
    <details class="bac-history" open><summary>История текущего шуза · ${BAC.history.length} раздач</summary><div class="bac-road">${BAC.history.length?BAC.history.slice(-48).map(x=>`<span class="${x}" title="${BAC_NAMES[x]}">${{player:'И',banker:'Б',tie:'Н'}[x]}</span>`).join(''):'Пока нет раздач'}</div><small>И — игрок · Б — банк · Н — ничья. История не предсказывает следующий исход. Новый шуз очищает историю.</small></details></div>`;
}
function bacRender(){const el=$('baccaratTable');if(el)el.outerHTML=bacHTML();}
ACTIONS.baccarat=()=>{bacShoe();openModal(bacHTML(),{center:true});};
ACTIONS.baccaratSide=(side)=>{if(BACCARAT_BUSY||!BAC_NAMES[side])return;BAC.choice=side;bacRender();};
ACTIONS.baccaratDeal=async(choice)=>{
  if(BACCARAT_BUSY||!$('baccaratTable'))return;
  if(BAC_NAMES[choice])BAC.choice=choice;
  const bet=Math.floor(S.bet);if(!Number.isFinite(bet)||bet<10||bet>BET_MAX||bet>S.money){toast('Проверь сумму ставки и баланс','bad');return;}
  bacShoe();BACCARAT_BUSY=true;BAC.visible=0;
  const round=baccaratRound(BAC.shoe);round.id=++BAC.seq;round.bet=bet;round.choice=BAC.choice;
  round.returned=baccaratReturn(round.choice,round.winner,bet);
  // Settle before animation: closing the table cannot erase or duplicate a payout.
  S.money-=bet;if(round.returned)addMoney(round.returned);track('casino');
  BAC.round=round;BAC.history.push(round.winner);save();updateHud();bacRender();
  try{
    for(let i=0;i<round.p.length+round.b.length;i++){
      await new Promise(resolve=>setTimeout(resolve,240));BAC.visible=i+1;bacRender();sfx('chip');
    }
  }finally{BACCARAT_BUSY=false;bacRender();sfx(round.returned>bet?'win':round.returned?'coin':'lose');}
};
// Keep table totals and quick-bet captions in sync with the shared stake picker.
for(const name of ['bet','betAdjust','betCustomOk']){
  const old=ACTIONS[name];if(!old)continue;
  ACTIONS[name]=(...args)=>{if($('baccaratTable')&&BACCARAT_BUSY)return;const result=old(...args);if($('baccaratTable'))bacRender();return result;};
}
