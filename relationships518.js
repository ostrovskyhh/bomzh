// Routine relationship events are durable inbox entries, never automatic windows.
let RELATIONSHIP_MANUAL518=false,relationshipTick518=0;
function relationshipGirl518(id){return (typeof allGirls==='function'?allGirls():GIRLS).find(g=>g.id===id);}
function relationshipState518(){
 if(!S.relationship518||!Array.isArray(S.relationship518.pending))S.relationship518={pending:[]};
 const valid=[],seen=new Set();
 for(const row of S.relationship518.pending){
  if(!row||!['partner','wish','approach','temptation'].includes(row.kind)||!relationshipGirl518(row.gid))continue;
  const group=['approach','temptation'].includes(row.kind)?'invitation':row.kind;
  const keep=row.kind==='partner'?row.gid===S.girlfriend:row.kind==='wish'?row.gid===S.girlfriend&&S.gfWish?.id===row.gift:row.kind==='approach'?!S.girlfriend&&row.city===city():!!S.girlfriend&&row.partner===S.girlfriend&&row.city===city();
  if(keep&&!seen.has(group)){valid.push(row);seen.add(group);}else{const note=S.returnInbox?.items?.find(n=>n.key==='relationship518:'+row.id);if(note)note.read=true;}
 }
 S.relationship518.pending=valid.slice(0,3);return S.relationship518;
}
function relationshipOffer518(kind,g){
 if(!g)return;const state=relationshipState518(),group=['approach','temptation'].includes(kind)?'invitation':kind;
 const existing=state.pending.find(x=>(['approach','temptation'].includes(x.kind)?'invitation':x.kind)===group);if(existing)return existing;
 const row={id:kind+':'+g.id+':'+Date.now(),kind,gid:g.id,city:city(),partner:S.girlfriend||null,gift:kind==='wish'?S.gfWish?.id:null,at:Date.now()};state.pending.push(row);
 const title={partner:'Разговор с партнёршей',wish:'Просьба о подарке',approach:'Предложение познакомиться',temptation:'Приглашение на встречу'}[kind];
 if(typeof returnNotice==='function')returnNotice({key:'relationship518:'+row.id,kind:'event',title,body:g.name+' · Ответить можно, когда удобно.',action:'relationship518',arg:row.id});
 save();return row;
}
function relationshipInfo518(title,body){if(typeof returnNotice==='function')returnNotice({key:'relationship-info518:'+Date.now()+':'+title,kind:'event',title,body});}
function relationshipReply518(emoji,title,text,good){closeModal();toast(emoji+' '+title,good?'good':'bad');relationshipInfo518(title,returnPlain(text)+' · Доверие '+Math.round(S.trust)+'/100');}
function relationshipOpen518(id){
 const state=relationshipState518(),row=state.pending.find(x=>x.id===id);if(!row){showScreen('fun','dates');return;}
 const g=relationshipGirl518(row.gid);if(!g)return;const note=S.returnInbox?.items?.find(n=>n.key==='relationship518:'+id);if(note)note.read=true;
 if(row.kind==='wish'){
  const wish=S.gfWish,item=GIFTS.find(x=>x.id===wish?.id);if(!wish||!item)return;
  if(wish.queued518){wish.queued518=false;wish.until=Date.now()+WISH_TIME;}
  openModal(`<section class="relationship518"><h3>💝 Просьба о подарке</h3><p><b>${esc(g.name)}</b> просит: ${item.emoji} ${esc(item.name)}.</p><p>Осталось: <span data-until="${wish.until}"></span>. За исполнение — прежние бонусы к отношениям и доверию.</p><button class="btn primary wide" data-act="giftMenu" data-id="${esc(g.id)}">Открыть подарки</button><button class="btn wide" data-act="close">Позже</button></section>`,{center:true});save(true);return;
 }
 state.pending=state.pending.filter(x=>x.id!==id);save(true);RELATIONSHIP_MANUAL518=true;
 try{if(row.kind==='partner')partnerEvent();else if(row.kind==='approach')approach(g);else temptation(g);}finally{RELATIONSHIP_MANUAL518=false;}
}
function relationshipHTML518(){const pending=relationshipState518().pending;return `<section class="relationship518 info-card"><b>💌 Сообщения об отношениях · ${pending.length}</b><p>Обычные разговоры и приглашения ждут здесь. Они не прерывают игру. Новая просьба о подарке начинает отсчёт после прочтения.</p>${pending.map(row=>`<div class="rel518-row"><span>${esc(relationshipGirl518(row.gid)?.name||'')}<small>${{partner:'Хочет поговорить',wish:S.gfWish?.queued518?'Новая просьба · без отсчёта':'Просьба о подарке',approach:'Хочет познакомиться',temptation:'Приглашает на встречу'}[row.kind]}</small></span><button class="btn small" data-act="relationshipOpen518" data-id="${esc(row.id)}">Прочитать</button></div>`).join('')}${pending.length?'':'<small>Новых сообщений нет.</small>'}</section>`;}
ACTIONS.relationshipOpen518=relationshipOpen518;
const relationshipDatesBefore518=EXTRA_TABS.fun.dates;EXTRA_TABS.fun.dates=()=>relationshipHTML518()+relationshipDatesBefore518();
const relationshipReturnBefore518=ACTIONS.returnOpen;ACTIONS.returnOpen=key=>{const note=returnState().items.find(n=>n.key===key);if(note?.action==='relationship518'){note.read=true;save();closeModal();return relationshipOpen518(note.arg);}return relationshipReturnBefore518(key);};
const relationshipProfileBefore518=prestigeProfile;prestigeProfile=()=>({...relationshipProfileBefore518(),relationship518:relationshipState518()});
HOOKS.tick.push(()=>{if(!LOADED||Date.now()-relationshipTick518<5000)return;relationshipTick518=Date.now();relationshipState518();if(S.gfWish&&S.girlfriend&&!relationshipState518().pending.some(x=>x.kind==='wish'))relationshipOffer518('wish',relationshipGirl518(S.girlfriend));});
