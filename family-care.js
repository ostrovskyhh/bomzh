// Voluntary family care: no new penalties, hunger drain or automatic requests.
const FAMILY_GOODS=[
 {id:'bracelet',name:'Браслет для супруги',emoji:'💝',price:2500,target:'wife',rel:8,desc:'Отношения +8; украшение видно в её образе'},
 {id:'sweets',name:'Коробка сладостей',emoji:'🍫',price:700,target:'wife',rel:7,desc:'Отношения +7; личный подарок'},
 {id:'novel',name:'Книга для отдыха',emoji:'📖',price:1200,target:'wife',rel:5,desc:'Отношения +5; книга останется у супруги'},
 {id:'clothes',name:'Новая одежда',emoji:'🧥',price:900,target:'kid',stages:['baby','kid','teen','adult'],joy:10,desc:'Радость +10; новый цвет одежды на сцене'},
 {id:'blocks',name:'Развивающие кубики',emoji:'🧸',price:600,target:'kid',stages:['baby'],joy:15,desc:'Радость +15; игрушка для малыша'},
 {id:'ball',name:'Мяч для прогулок',emoji:'⚽',price:800,target:'kid',stages:['kid'],joy:15,desc:'Радость +15; подарок для прогулок'},
 {id:'board',name:'Настольная игра',emoji:'🎲',price:1400,target:'kid',stages:['teen','adult'],joy:15,desc:'Радость +15; игра для семейных вечеров'},
 {id:'books',name:'Книги и тетради',emoji:'📚',price:1600,target:'kid',stages:['kid','teen','adult'],smart:1,desc:'Ум +1 из 5; набор остаётся у ребёнка'},
 {id:'bag',name:'Школьный рюкзак',emoji:'🎒',price:2200,target:'kid',stages:['kid','teen'],smart:1,desc:'Ум +1 из 5; для школы'},
 {id:'laptop',name:'Ноутбук для учёбы',emoji:'💻',price:8000,target:'kid',stages:['teen','adult'],smart:1,desc:'Ум +1 из 5; для старших детей'}
];
function familyPrice(base){return Math.round(base*({zas:1,msk:5,mex:8,fr:12}[city()]||1));}
function wifeCare(){S.familyCare||={wives:{}};S.familyCare.wives||={};return S.familyCare.wives[S.girlfriend]||(S.familyCare.wives[S.girlfriend]={owned:{}});}
function kidCare(k){return k.care||(k.care={owned:{}});}
function familyMembers(){const out=[];if(wife())out.push({key:'wife|'+S.girlfriend,name:wife().name,type:'wife',care:wifeCare(),meal:familyPrice(700)});(S.kids||[]).forEach((k,i)=>out.push({key:'kid|'+i+'|'+k.born,name:k.name,type:'kid',kid:k,index:i,care:kidCare(k),meal:familyPrice({baby:150,kid:300,teen:450,adult:500}[kidStage(k)])}));return out;}
function familyMember(key){return familyMembers().find(x=>x.key===key);}
function familyGoods(member){return FAMILY_GOODS.filter(x=>x.target===member.type&&(member.type!=='kid'||x.stages.includes(kidStage(member.kid))));}
function familyOwned(member){member.care.owned||={};return member.care.owned;}
function familyReady(){if(S.busy||MG||MG_PENDING){toast('Сначала закончи текущее занятие','bad');return false;}return true;}
function familyRedraw(){save();FAMILY_SCENE_KEY='';showScreen('fun','dates');updateHud();}
function familyFeedOne(member){member.care.fedUntil=Date.now()+2*3600000;if(member.type==='wife'){const st=girlState(S.girlfriend);st.rel=clamp((st.rel||0)+4,0,100);S.trust=clamp((S.trust??70)+2,0,100);}else member.kid.joy=clamp((member.kid.joy||0)+12,0,100);track('familyCare');}
ACTIONS.familyMeal=key=>{if(!familyReady())return;const member=familyMember(key);if(!member||(member.care.fedUntil||0)>Date.now()||S.money<member.meal)return;S.money-=member.meal;familyFeedOne(member);familyRedraw();toast('Угощение готово. Семья довольна!','good');};
ACTIONS.familyMealAll=()=>{if(!familyReady())return;const list=familyMembers().filter(x=>(x.care.fedUntil||0)<=Date.now()),price=list.reduce((n,x)=>n+x.meal,0);if(!list.length||S.money<price)return;S.money-=price;list.forEach(familyFeedOne);familyRedraw();toast('Семья поела. Таймер каждого угощения виден в карточке.','good');};
ACTIONS.familyBuy=arg=>{
  if(!familyReady())return;const parts=String(arg).split('~');if(parts.length!==2)return;const member=familyMember(parts[0]),item=FAMILY_GOODS.find(x=>x.id===parts[1]);if(!member||!item||!familyGoods(member).includes(item)||familyOwned(member)[item.id])return;
  if(item.smart&&(member.kid.smart||0)>=5)return;const price=familyPrice(item.price);if(S.money<price)return;S.money-=price;familyOwned(member)[item.id]=true;
  if(member.type==='wife')girlState(S.girlfriend).rel=clamp((girlState(S.girlfriend).rel||0)+(item.rel||0),0,100);else{member.kid.joy=clamp((member.kid.joy||0)+(item.joy||0),0,100);member.kid.smart=Math.min(5,(member.kid.smart||0)+(item.smart||0));}
  track('familyCare');familyRedraw();toast('Покупка передана в семью','good');
};
function familyPlay(member){
  if(!familyReady()||!member)return;
  if(member.type==='kid'&&kidStage(member.kid)!=='adult'){ACTIONS.kidPlay(String(member.index));return;}
  if((member.care.playAt||0)>Date.now())return;member.care.playAt=Date.now()+30*60000;save();
  let completed=false;runGame({title:'Семейный вечер: найди пары',hint:'Открывай по две карточки и находи одинаковые картинки.',duration:20,setup:mg=>gamePairs(mg,{items:['🌷','🧁','☕','🎟️','🐈','🎨']}),finish:score=>{
    if(completed)return;completed=true;const actual=familyMember(member.key);if(!actual)return;const bonus=Math.round(5+Math.min(1,score/12)*10);
    if(actual.type==='wife')girlState(S.girlfriend).rel=clamp(girlState(S.girlfriend).rel+Math.round(bonus/2),0,100);else actual.kid.joy=clamp((actual.kid.joy||0)+bonus,0,100);
    addMood(5);track('familyCare');track('familyRest');save();resultModal({emoji:'🏡',title:'Хорошо провели время',text:'Радость и отношения стали теплее. Следующая совместная игра — через 30 минут.',btn:'К семье'});
  }});
}
ACTIONS.familyPlay=key=>familyPlay(familyMember(key));
ACTIONS.familyTutor=key=>{if(!familyReady())return;const member=familyMember(key);if(!member||member.type!=='kid'||kidStage(member.kid)==='baby'||(member.kid.smart||0)>=5)return;const price=2000*(kidAge(member.kid)+1);if(S.money<price)return;S.money-=price;member.kid.smart=(member.kid.smart||0)+1;track('familyCare');familyRedraw();};
function familyCard(member){
  const m=member,owned=familyOwned(m),fed=(m.care.fedUntil||0)>Date.now(),st=m.type==='kid'?kidStage(m.kid):'wife';
  const playUntil=m.type==='kid'&&st!=='adult'?(S.cd?.['kid_'+m.index]||0):(m.care.playAt||0),stage={baby:'Малыш',kid:'Ребёнок',teen:'Подросток',adult:'Взрослый ребёнок',wife:'Супруга'}[st];
  const stats=m.type==='wife'?`Отношения ${Math.floor(girlState(S.girlfriend).rel)}/100 · доверие ${Math.round(S.trust??70)}/100`:`Радость ${Math.floor(m.kid.joy||0)}/100 · ум ${m.kid.smart||0}/5`;
  const avatar=m.type==='wife'?wifePortrait():familyPersonSVG(true,m.kid.sex,m.index+1);
  return `<article class="family-care-card"><header><div class="fc-portrait">${avatar}</div><section><small>${stage}</small><h3>${m.type==='kid'?userLabel(m.name):esc(m.name)}</h3><p>${stats}</p><b>${fed?(m.type==='wife'||m.kid?.sex==='girl'?'🍽️ Сыта и довольна':'🍽️ Сыт и доволен'):'🍽️ Можно угостить'}</b>${fed?`<small>До <span data-until="${m.care.fedUntil}"></span></small>`:''}</section></header><div class="fc-actions"><button class="btn" data-act="familyMeal" data-id="${m.key}" ${fed||S.money<m.meal||S.busy?'disabled':''}>🍲 Угостить · ${incomeMoney(m.meal)}</button><button class="btn" data-act="familyPlay" data-id="${m.key}" ${playUntil>Date.now()||S.busy?'disabled':''}>🎲 Играть вместе${playUntil>Date.now()?` · <span data-until="${playUntil}"></span>`:''}</button>${m.type==='wife'?'<button class="btn" data-act="wifeWardrobe">👗 Настроить одежду</button>':st!=='baby'?`<button class="btn" data-act="familyTutor" data-id="${m.key}" ${(m.kid.smart||0)>=5||S.money<2000*(kidAge(m.kid)+1)||S.busy?'disabled':''}>📚 Репетитор · ${incomeMoney(2000*(kidAge(m.kid)+1))}</button>`:''}</div><details class="fc-shop"><summary>🛍️ Вещи и учёба</summary>${Object.keys(owned).some(id=>owned[id])?`<p class="fc-owned"><b>Личные вещи:</b> ${FAMILY_GOODS.filter(x=>owned[x.id]).map(x=>`<span>${x.emoji} ${x.name}</span>`).join(' · ')}</p>`:''}${familyGoods(m).map(item=>{const have=!!owned[item.id],full=item.smart&&(m.kid.smart||0)>=5;return `<div><section><b>${item.emoji} ${item.name}</b><small>${item.desc}</small></section><button class="btn small" data-act="familyBuy" data-id="${m.key}~${item.id}" ${have||full||S.money<familyPrice(item.price)||S.busy?'disabled':''}>${have?'Куплено':full?'Ум на максимуме':incomeMoney(familyPrice(item.price))}</button></div>`;}).join('')}<small>Каждая вещь покупается один раз для этого члена семьи. Учебные предметы повышают ум максимум до 5.</small></details></article>`;
}
function familyDashboard(){const members=familyMembers(),hungry=members.filter(x=>(x.care.fedUntil||0)<=Date.now()),cost=hungry.reduce((n,m)=>n+m.meal,0);return `<section class="family-dashboard"><header><small>ДОМ, В КОТОРОМ ТЕБЯ ЖДУТ</small><h2>🏡 Моя семья</h2><p>Забота — по желанию. Без новых штрафов и автоматических просьб. Угощение: супруге +4 к отношениям и +2 к доверию, ребёнку +12 радости. Сытость — 2 часа.</p></header><button class="btn primary wide" data-act="familyMealAll" ${!hungry.length||S.money<cost||S.busy?'disabled':''}>${hungry.length?`🍲 Накормить всех · ${incomeMoney(cost)}`:'🍽️ Все сыты'}</button>${members.map(familyCard).join('')}<small>Игры с младшими детьми работают по прежним правилам. Для супруги и взрослых детей — семейная игра раз в 30 минут. Умные взрослые помогают семье по прежнему расчёту.</small></section>`;}
const familyDatesBefore458=EXTRA_TABS.fun.dates;
EXTRA_TABS.fun.dates=()=>{
  if(!wife()&&!(S.kids||[]).length)return familyDatesBefore458();
  const orig=kidsHTML;let legacy;try{kidsHTML=()=>'';legacy=familyDatesBefore458();}finally{kidsHTML=orig;}
  const more=S.married&&(S.kids||[]).length+(S.pregnant?1:0)<KIDS_MAX;
  return familyDashboard()+`${S.pregnant?`<p class="info-card">🤰 Пополнение через <span data-until="${S.pregnant}"></span></p>`:more?'<button class="btn wide" data-act="kidWant">👶 Завести ребёнка</button>':''}`+`<details class="family-legacy"><summary>💞 Свидания, подарки и семейные решения</summary>${legacy}</details>`;
};
const familyPersonBefore458=familyPersonSVG;
familyPersonSVG=function(child=false,sex='girl',i=0){let svg=familyPersonBefore458(child,sex,i);if(child&&S.kids?.[i-1]?.care?.owned?.clothes)svg=svg.replaceAll('#d5a642',sex==='boy'?'#729fb5':'#bb7e9b');return svg;};

const wifePortraitBefore458=wifePortrait;
wifePortrait=function(gid=S.girlfriend,look=wifeLook(gid)){let svg=wifePortraitBefore458(gid,look);if(S.familyCare?.wives?.[gid]?.owned?.bracelet)svg=svg.replace('</svg>','<path d="M20 101L27 101M65 99L71 101" stroke="#f1c968" stroke-width="3" stroke-linecap="round"/></svg>');return svg;};

const familyTileNameBefore458=betaTileName;
betaTileName=function(tile){return tile.s==='fun'&&tile.t==='dates'&&(wife()||(S.kids||[]).length)?['🏡','Семья']:familyTileNameBefore458(tile);};
