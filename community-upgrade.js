// Approved player ideas: convenience is available to everyone.
function cancelMiniGame(){
  const mg=MG;if(!mg){if(MG_PENDING){MG_PENDING=null;closeModal();toast('Игра прекращена без награды');}return;}
  mg.over=true;mg.timers.forEach(t=>{clearTimeout(t);clearInterval(t);});if(mg.raf)cancelAnimationFrame(mg.raf);
  MG=null;closeModal();save();toast('Игра прекращена. Наград и возврата затрат нет.');
}
ACTIONS.cancelMiniGame=cancelMiniGame;
runGame=(function(orig){return function(options){
  orig(options);
  if(MG_PENDING){const go=document.querySelector('[data-act="mgRulesGo"]');if(go&&!document.querySelector('[data-act="cancelMiniGame"]'))go.insertAdjacentHTML('afterend','<button class="btn wide" data-act="cancelMiniGame">Отмена — без награды</button>');}
  // Wagers use their own casino controllers, not this non-wager lifecycle.
  if(MG&&document.querySelector('.mg-head')){
    const b=document.createElement('button');b.className='mg-cancel';b.dataset.act='cancelMiniGame';b.textContent='✕';b.setAttribute('aria-label','Прекратить без награды');b.title='Прекратить без награды и возврата затрат';document.querySelector('.mg-head').append(b);
  }
};})(runGame);

ACTIONS.chatReadAll=async()=>{
  try{const last=await apiPost('chat/last',{channel:chatDistrictChannel()});S.chatSeen=S.chatSeen||{};for(const [key,n] of [['district',last.channels?.ru],['district:worldwide',last.channels?.worldwide],['clan',last.clan]])S.chatSeen[key]=Math.max(S.chatSeen[key]||0,Number(n)||0);CHAT_LAST=last;save();chatBadge();toast('Все текущие сообщения отмечены прочитанными','good');}
  catch(e){toast(refErrorText(e),'bad');}
};
chatOpen=(function(orig){return function(){const r=orig.apply(this,arguments);const tabs=document.querySelector('.chat-tabs,.c2-head');if(tabs&&!document.querySelector('[data-act="chatReadAll"]'))tabs.insertAdjacentHTML('afterend','<button class="btn small" data-act="chatReadAll">✓ Прочитать всё в районе и банде</button>');return r;};})(chatOpen);

ACHS.push({id:'game_helper',name:'Помогаю развивать игру',emoji:'🛠️',fn:()=>S.helpVerified||0,goals:[1,3,10,25],unit:'подтверждённых исправлений и реализованных идей'});
for(const [n,name] of [[3,'Помощник игры'],[10,'Соавтор района'],[25,'Легенда сообщества']])FRAMES.push({id:'helper'+n,name,how:n+' подтверждённых исправлений / идей',need:()=>Math.max(S.helpVerified||0,S.achProgress?.game_helper||0)>=n});
async function syncContributions(){if(!onlineOn())return;try{const r=await apiPost('feedback/contribution');if(Number.isInteger(r.count)){S.helpVerified=r.count;save();}}catch(e){/* retry at next login */}}
HOOKS.init.push(()=>setTimeout(syncContributions,6500));

const CITY_CRESTS={zas:['#626c41','🍾','Засранск'],msk:['#a43145','🐎','Москвабад'],mex:['#267a57','🌵','Веракрус'],fr:['#315e98','⛵','Париж']};
function cityCrest(id){const a=CITY_CRESTS[id]||CITY_CRESTS.zas;return `<svg class="city-crest" role="img" aria-label="Игровой герб: ${a[2]}" viewBox="0 0 60 72"><path d="M4 5H56V39Q55 59 30 68Q5 59 4 39Z" fill="${a[0]}" stroke="#d8bc79" stroke-width="4"/><path d="M6 18H54" stroke="#d8bc79" stroke-width="3"/><text x="30" y="15" text-anchor="middle" font-size="11" fill="#ffe5a0">✦ ✦ ✦</text><text x="30" y="48" text-anchor="middle" font-size="29">${a[1]}</text></svg>`;}
HOOKS.hud.push(()=>{const el=$('locName');if(el&&!el.querySelector('.city-crest'))el.insertAdjacentHTML('afterbegin',cityCrest(city()));});
HOOKS.screen.push(()=>{for(const el of document.querySelectorAll('h2,h3')){const id=Object.keys(CITY_CRESTS).find(k=>el.textContent.trim()===CITY_CRESTS[k][2]);if(id&&!el.querySelector('.city-crest'))el.insertAdjacentHTML('afterbegin',cityCrest(id));}});

const XP_CAP_PRICE=15,XP_STAR_PRICE=49;
function paidXpMultiplier(){const now=Date.now();return Math.max(S.xpCapsUntil>now?1.5:1,S.xpStarsUntil>now?2:1);}
xpMult=(function(orig){return ()=>orig()*paidXpMultiplier();})(xpMult);
giftLevels=(function(orig){return function(n){const mult=xpMult;try{xpMult=()=>1;return orig(n);}finally{xpMult=mult;}};})(giftLevels);
PREM_GIVE.xp_hour=()=>{S.xpStarsUntil=Math.max(Date.now(),S.xpStarsUntil||0)+3600000;return '📚 Опыт ×2 на 60 минут. Повторная покупка продлевает время';};
ACTIONS.xpCaps=()=>{if(S.caps<XP_CAP_PRICE)return toast('Нужно 15 крышек','bad');S.caps-=XP_CAP_PRICE;S.xpCapsUntil=Math.max(Date.now(),S.xpCapsUntil||0)+1800000;save();toast('Опыт ×1,5 на 30 минут','good');};
function xpShopHTML(){return `<div class="dn-card"><h3>📚 Развитие персонажа</h3><p>Больше опыта за обычную игру. Это ускоритель обычной игры, а не готовые уровни. Из двух ускорителей действует более сильный, время каждого идёт отдельно.</p><button class="btn wide" data-act="xpCaps" ${S.caps<15?'disabled':''}>×1,5 на 30 минут · 🟡 15</button><button class="btn primary wide" data-act="prem" data-id="xp_hour">×2 на 60 минут · ⭐ 49</button><p>Активный множитель покупки: ×${paidXpMultiplier()}${S.xpCapsUntil>Date.now()?'<br>За крышки: до '+new Date(S.xpCapsUntil).toLocaleTimeString('ru-RU'):''}${S.xpStarsUntil>Date.now()?'<br>За Stars: до '+new Date(S.xpStarsUntil).toLocaleTimeString('ru-RU'):''}</p></div>`;}
DN_TABS.push(['xp','📚','Опыт']);

let CASE_FEED_TIMER=null;
openCases=(function(orig){return function(){const r=orig.apply(this,arguments);clearInterval(CASE_FEED_TIMER);const el=$('pcFeed');if(!el)return r;document.querySelector('.pc-top')?.after(el);
  el.classList.remove('hidden');el.innerHTML='<div class="pc-sub">Недавние дропы игроков</div><small>Загружаем…</small>';
  const poll=async()=>{if($('pcFeed')!==el){clearInterval(CASE_FEED_TIMER);return;}if(document.hidden||!onlineOn()){if(!onlineOn())el.innerHTML='<div class="pc-sub">Дропы игроков доступны внутри Telegram</div>';return;}
    try{const data=await apiPost('cases/feed');if($('pcFeed')!==el)return;el.innerHTML=caseDropFeedHTML(data.feed);}catch(e){if($('pcFeed')===el)el.innerHTML='<small>Лента временно недоступна. Пробуем снова…</small>';}};
  poll();CASE_FEED_TIMER=setInterval(poll,7000);return r;
};})(openCases);
