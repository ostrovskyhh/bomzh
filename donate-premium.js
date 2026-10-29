// Stars cases are separate from the legacy cap cases and their already-owned keys.
const STAR_CASES = [
  {id:'star_neon',theme:'sn',name:'Неоновая ночь',emoji:'⚡',stars:49,caps:10,refund:8,r:'rare',desc:'Свет большого города и стиль ночного гонщика',parts:['⚡','💜','💠'],face:'👾',bonusCaps:5,vip:1,boost:30},
  {id:'star_luxe',theme:'sl',name:'Бриллиантовый клуб',emoji:'💎',stars:99,caps:20,refund:15,r:'epic',desc:'Холодный блеск, платина и закрытый клуб',parts:['💎','💠','✨'],face:'🦁',bonusCaps:10,vip:3,boost:60},
  {id:'star_fiesta',theme:'sf',name:'Золотая фиеста',emoji:'🌺',stars:149,caps:30,refund:25,r:'epic',desc:'Карнавал, солнечное золото и мексиканский колорит',parts:['🌺','🌵','☀️'],face:'🦜',bonusCaps:20,vip:5,boost:90},
  {id:'star_paris',theme:'sp',name:'Парижский шик',emoji:'⚜️',stars:199,caps:40,refund:35,r:'epic',desc:'Шампань, огни Парижа и бархатный вечер',parts:['⚜️','🥂','🌹'],face:'🎭',bonusCaps:30,vip:7,boost:120},
  {id:'star_cosmos',theme:'sg',name:'Сверхновая',emoji:'🌌',stars:299,caps:60,refund:50,r:'legend',desc:'Звёздная пыль и собственная галактика',parts:['🪐','🌠','🌌'],face:'🧑‍🚀',bonusCaps:50,vip:10,boost:180},
  {id:'star_empire',theme:'se',name:'Империя Валеры',emoji:'👑',stars:499,caps:100,refund:85,r:'legend',desc:'Императорское золото и коллекция для легенды района',parts:['👑','🏆','💰'],face:'🦅',bonusCaps:90,vip:20,boost:360},
];
const xpTabIndex=DN_TABS.findIndex(t=>t[0]==='xp');if(xpTabIndex>1)DN_TABS.splice(1,0,DN_TABS.splice(xpTabIndex,1)[0]);
const STAR_RARITY={rare:'Редкая',epic:'Эпическая',legend:'Легендарная'};
function starCase(id){return STAR_CASES.find(c=>c.id===id);}
function starPool(c){return COSMETICS.filter(x=>x.starCase===c.id);}
STAR_CASES.forEach(c=>{
  c.xp=[15,30,45,60,90,180][STAR_CASES.indexOf(c)];
  const items=[
    {id:'fx_'+c.theme,kind:'fx',emoji:c.emoji,parts:c.parts,name:c.name+' · эффект'},
    {id:'au_'+c.theme,kind:'aura',emoji:c.emoji,name:c.name+' · аура'},
    {id:'fr_'+c.theme,kind:'frame',frame:c.theme,emoji:c.emoji,name:c.name+' · рамка'},
    {id:'av_'+c.theme,kind:'avatar',face:c.face,emoji:c.face,name:c.name+' · аватар'},
  ];
  for(const item of items){
    Object.assign(item,{src:'case',r:c.r,starCase:c.id});COSMETICS.push(item);
    const how=`Только кейс «${c.name}» за Stars`;
    if(item.kind==='frame')FRAMES.push({id:item.frame,name:item.name,need:()=>ownsCosm(item.id),how,donate:true});
    if(item.kind==='avatar')AVATARS.push({id:cosmAva(item),face:item.face,name:item.name,need:()=>ownsCosm(item.id),how,donate:true});
  }
  PREM_GIVE[c.id]=()=>{
    S.dkeys=S.dkeys||{};S.dkeys[c.id]=(S.dkeys[c.id]||0)+1;
    return `${c.emoji} Кейс «${c.name}» зачислен. Открой сейчас или позже в «Донат → Кейсы».<br><button class="btn primary wide" data-act="starCase" data-id="${c.id}">Посмотреть и открыть</button>`;
  };
});
// New exclusives must never leak into the cap-case random pool.
dcPool=r=>COSMETICS.filter(c=>c.src==='case'&&c.r===r&&!c.starCase);

function starChest(c){return `<div class="sc-chest sc-${c.theme}" aria-hidden="true"><i class="sc-rays"></i><div class="sc-lid"></div><div class="sc-box"><span>${c.emoji}</span><i>✦</i></div><div class="sc-plinth"></div></div>`;}
function starKeys(c){return Math.max(0,Number(S.dkeys?.[c.id])||0);}
function starCaseButton(c){return `<button class="btn primary wide sc-buy" data-act="${starKeys(c)?'starOpen':'prem'}" data-id="${c.id}">${starKeys(c)?`🔑 Открыть · в наличии ${starKeys(c)}`:`⭐ Купить кейс · ${c.stars} Stars`}</button>`;}
dnCasesTab=()=>`<div class="sc-intro"><small>КОЛЛЕКЦИИ STARS</small><h3>Твой пропуск в красивую жизнь</h3><p>В каждом кейсе — <b>три награды</b>: крышки, предмет коллекции и дополнительный бонус. Эти кейсы продаются отдельно, только за Telegram Stars.</p></div><div class="sc-catalogue">${STAR_CASES.map(c=>`<article class="sc-card sc-${c.theme}">${starChest(c)}<div class="sc-card-body"><small>${STAR_RARITY[c.r]} коллекция · 4 предмета</small><h3>${c.name}</h3><p>${c.desc}</p><div class="sc-floor">🟡 ${c.caps} крышек + ✨ предмет + 🎁 бонус</div><button class="btn wide" data-act="starCase" data-id="${c.id}">Состав, шансы и коллекция</button>${starCaseButton(c)}</div></article>`).join('')}</div>`;

function starCollectionHTML(c){
  const pool=starPool(c),fresh=pool.filter(x=>!ownsCosm(x.id));
  return `<div class="sc-collection">${pool.map(x=>`<div class="sc-collect-item ${ownsCosm(x.id)?'owned':''}"><div>${dnLook(x.id)}</div><b>${cosmKindName(x)}</b><small>${ownsCosm(x.id)?'✓ В коллекции':`${(100/(fresh.length||pool.length)).toLocaleString('ru-RU',{maximumFractionDigits:1})}% на этот предмет`}</small></div>`).join('')}</div>`;
}
ACTIONS.starCase=id=>{
  const c=starCase(id);if(!c)return;
  const fresh=starPool(c).filter(x=>!ownsCosm(x.id));
  openModal(`<section class="sc-detail sc-${c.theme}"><small>КОЛЛЕКЦИЯ STARS · ${STAR_RARITY[c.r]}</small><h3>${c.name}</h3>${starChest(c)}<p>${c.desc}</p>${starCaseButton(c)}
    <div class="sc-guarantees"><b>В каждом открытии — всё сразу</b><div>🟡 <strong>${c.caps} крышек</strong> гарантированно</div><div>✨ <strong>${fresh.length?'Новый предмет коллекции':'Коллекция уже собрана: '+c.refund+' крышек вместо повтора'}</strong></div><div>🎁 <strong>Один дополнительный бонус</strong> из списка ниже</div></div>
    <h4>Твоя коллекция · ${4-fresh.length}/4</h4>${starCollectionHTML(c)}
    <p class="sc-note">Сначала выпадают только ещё не полученные предметы этой коллекции, с равными шансами. Когда собраны все четыре — случайный повтор заменяется на ${c.refund} крышек. Косметика остаётся при переезде и престиже.</p>
    <div class="sc-odds"><h4>Дополнительная награда · шансы</h4><div><span>🟡 Ещё ${c.bonusCaps} крышек</span><b>35%</b></div><div><span>👑 VIP на ${c.vip} дн.</span><b>30%</b></div><div><span>🚀 Доход ×2 на ${c.boost} мин.</span><b>20%</b></div><div><span>📚 Опыт ×2 на ${c.xp} мин.</span><b>15%</b></div></div>
    <p class="sc-note">VIP и ускорение дохода продлевают свой таймер. Ускорение дохода не ускоряет опыт. Приз «Опыт ×2» продлевает таймер сильного ускорителя опыта. Случайный бонус выбирается отдельно от предмета. Оплату подтверждаешь в Telegram; покупка даёт один ключ.</p>
    <button class="btn wide" data-act="starBack">Ко всем кейсам</button></section>`,{center:true});
};

// A purchased key is consumed once before any animation; replay/skip only reveals saved rewards.
function starOpen(id){
  const c=starCase(id);if(!c||starKeys(c)<1)return null;
  const pool=starPool(c),fresh=pool.filter(x=>!ownsCosm(x.id)),item=pick(fresh.length?fresh:pool),duplicate=ownsCosm(item.id);
  const roll=Math.random(),bonus=roll<.35?{t:'caps',n:c.bonusCaps,r:c.r}:roll<.65?{t:'vip',n:c.vip,r:c.r}:roll<.85?{t:'boost',n:c.boost,r:c.r}:{t:'xp',n:c.xp,r:c.r};
  S.dkeys[id]-=1;addCaps(c.caps);
  if(duplicate)addCaps(c.refund);else cosmGet(item.id);
  let bonusText;if(bonus.t==='xp'){S.xpStarsUntil=Math.max(Date.now(),S.xpStarsUntil||0)+bonus.n*60000;bonusText=`📚 Опыт ×2 на ${bonus.n} мин.`;}else bonusText=dcGive(bonus);track('dcase');
  const result={c,item,win:{t:'cosm',pool:c.r,r:c.r,id:item.id},duplicate,bonus,bonusText};DC_LAST=result;save();updateHud();return result;
}
let SC_REVEAL=null,SC_TIMER=null;
function starSpin(result){
  const {c,item,duplicate,bonusText}=result;clearTimeout(SC_TIMER);
  const finish=()=>{
    if(SC_REVEAL!==finish||!document.getElementById('scOpening'))return;
    SC_REVEAL=null;clearTimeout(SC_TIMER);
    $('scOpening').innerHTML=`<small>ТВОИ ТРИ НАГРАДЫ</small><div class="sc-prize">${dnLook(item.id)}</div><h3>${duplicate?'Коллекция собрана!':item.name}</h3><div class="sc-reward-list"><div>🟡 +${c.caps} крышек</div><div>${duplicate?`✨ Повтор «${item.name}» → +${c.refund} крышек`:`✨ ${cosmKindName(item)} — в коллекции и уже на тебе`}</div><div>${bonusText}</div></div><p class="sc-note">Награды сохранены.</p>${starCaseButton(c)}<button class="btn wide" data-act="starCase" data-id="${c.id}">Смотреть коллекцию</button><button class="btn wide" data-act="starBack">Ко всем кейсам</button>`;
    sfx('jackpot');haptic('success');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)confetti(c.r==='legend'?90:45);
  };
  SC_REVEAL=finish;
  openModal(`<section class="sc-detail sc-${c.theme}" id="scOpening"><small>КОЛЛЕКЦИЯ STARS</small><h3>${c.name}</h3><div class="sc-opening">${starChest(c)}<div class="sc-orbits">✦ · ✧ · ✦</div></div><p>Три награды уже сохранены.<br>Осталось открыть сундук…</p><button class="btn primary wide" data-act="starReveal">Показать награды</button></section>`,{center:true});
  sfx('whoosh');SC_TIMER=setTimeout(finish,matchMedia('(prefers-reduced-motion: reduce)').matches?50:2300);
}
ACTIONS.starOpen=id=>{const r=starOpen(id);if(r)starSpin(r);else ACTIONS.starCase(id);};
ACTIONS.starReveal=()=>SC_REVEAL?.();
ACTIONS.starBack=()=>{closeModal();DN_TAB='cases';openDonate();};

function legacyCasesHTML(){
  return `<h3>Коллекционные кейсы за крышки</h3><p>Прежние кейсы и все ключи из наборов сохранены. Особые коллекции за Stars находятся в донатном меню.</p>${DCASES.map(c=>`<article class="dc-card ${c.id}"><div class="dc-head"><span class="dc-e">${c.emoji}</span><div><b>${c.name}</b><small>${c.desc}</small></div></div><details class="dc-odds"><summary>Состав и шансы</summary>${dcChance(c)}</details><button class="btn primary wide" data-act="dcOpen" data-id="${c.id}" ${(S.dkeys?.[c.id]||S.caps>=c.caps)?'':`disabled data-why="Нужно ${c.caps} крышек"`}>${S.dkeys?.[c.id]?`🔑 Открыть · ключей ${S.dkeys[c.id]}`:`Открыть · 🟡 ${c.caps}`}</button></article>`).join('')}<button class="btn wide" data-act="cases">К обычным кейсам</button>`;
}
ACTIONS.legacyCases=()=>openModal(legacyCasesHTML(),{center:true});
ACTIONS.dcBack=ACTIONS.legacyCases;
openCases=(function(orig){return function(){const r=orig.apply(this,arguments);const head=document.querySelector('.pc-top');if(head&&!document.querySelector('[data-act="legacyCases"]'))head.insertAdjacentHTML('afterend','<button class="btn wide sc-legacy-link" data-act="legacyCases">🟡 Коллекционные кейсы за крышки и ключи из наборов</button>');return r;};})(openCases);
// Keep fulfillment of every old product, but sell only individual Stars cases on the new shelf.
dnSetsTab=(function(orig){return function(p){const t=document.createElement('template');t.innerHTML=orig(p);t.content.querySelector('.dn-set[data-id="b_cases"]')?.remove();return t.innerHTML;};})(dnSetsTab);
dnDealHTML=(function(orig){return function(){return dealOfDay().product==='b_cases'?'':orig();};})(dnDealHTML);

function xpStatus(key){const end=S[key]||0;return end>Date.now()?`Ещё ${Math.ceil((end-Date.now())/60000)} мин. · до ${new Date(end).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}`:'Не активен';}
xpShopHTML=()=>`<section class="xp-shop"><div class="xp-intro"><small>РАЗВИТИЕ ПЕРСОНАЖА</small><h3>Больше опыта за игру</h3><p>Работай, выполняй задания и получай опыт быстрее. Ускоритель увеличивает заработанный опыт, а готовые уровни не выдаёт.</p></div><div class="xp-now"><span>Ускорение от покупок</span><strong id="xpShopFactor">×${paidXpMultiplier().toLocaleString('ru-RU')}</strong><small>С учётом всех действующих бонусов: <b id="xpShopTotal">×${Number(xpMult().toFixed(2)).toLocaleString('ru-RU')}</b></small></div>
  <article class="xp-option"><div class="xp-option-head"><span>📚</span><div><h4>Спокойный темп</h4><small>За золотые крышки</small></div><strong>×1,5</strong></div><p>30 минут ускоренного получения опыта.</p><div class="xp-status" data-xp-state="xpCapsUntil">${xpStatus('xpCapsUntil')}</div><button class="btn wide" data-act="xpCaps" ${S.caps<XP_CAP_PRICE?`disabled data-why="Нужно ${XP_CAP_PRICE} крышек. У тебя ${S.caps}"`:''}>${S.xpCapsUntil>Date.now()?'Продлить на 30 мин.':'Включить на 30 мин.'} · 🟡 ${XP_CAP_PRICE}</button></article>
  <article class="xp-option xp-star"><div class="xp-option-head"><span>🌟</span><div><h4>На полной скорости</h4><small>За Telegram Stars</small></div><strong>×2</strong></div><p>60 минут самого сильного покупного ускорения опыта.</p><div class="xp-status" data-xp-state="xpStarsUntil">${xpStatus('xpStarsUntil')}</div><button class="btn primary wide" data-act="prem" data-id="xp_hour">${S.xpStarsUntil>Date.now()?'Продлить на 60 мин.':'Включить на 60 мин.'} · ⭐ ${XP_STAR_PRICE}</button></article>
  <div class="xp-rules"><b>Как сочетаются ускорители</b><p>Из ×1,5 и ×2 действует более сильный — они не перемножаются. Оба таймера идут одновременно, даже когда игра закрыта. Повторная покупка продлевает свой таймер. Остальные бонусы к опыту учитываются дополнительно.</p>${S.xpStarsUntil>Date.now()?'<p class="xp-warning">Сейчас действует ×2. Покупка ×1,5 не усилит его, а её таймер начнёт идти сразу.</p>':''}</div></section>`;
ACTIONS.xpCaps=(function(orig){return function(){const r=orig.apply(this,arguments);if(document.querySelector('.xp-shop'))donateRefresh();return r;};})(ACTIONS.xpCaps);
HOOKS.hud.push(()=>{if(!$('xpShopFactor'))return;$('xpShopFactor').textContent='×'+paidXpMultiplier().toLocaleString('ru-RU');$('xpShopTotal').textContent='×'+Number(xpMult().toFixed(2)).toLocaleString('ru-RU');document.querySelectorAll('[data-xp-state]').forEach(el=>el.textContent=xpStatus(el.dataset.xpState));});

// On these shelves the balance is secondary; keep both options close to the top on phones.
donateHTML=(function(orig){return function(){let h=orig();if(['xp','cases'].includes(DN_TAB)){const t=document.createElement('template');t.innerHTML=h;const hero=t.content.querySelector('.dn-hero');if(hero)hero.outerHTML=`<div class="dn-compact"><b>${DN_TAB==='xp'?'📚 Ускорение опыта':'⭐ Коллекции Stars'}</b><span>🟡 ${fmt(S.caps)}</span></div>`;t.content.querySelector('.dn-banner')?.remove();h=t.innerHTML;}requestAnimationFrame(()=>{const tabs=document.querySelector('.donate .dn-tabs'),selected=tabs?.querySelector('.on');if(!tabs||!selected)return;const a=tabs.getBoundingClientRect(),b=selected.getBoundingClientRect();if(b.left<a.left||b.right>a.right)tabs.scrollLeft+=b.left-a.left-(a.width-b.width)/2;});return h;};})(donateHTML);
