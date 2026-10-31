// One authorized workbench for the owner and other players. Drafts never run shop fulfillment.
const adminHeroSandbox513=admHero;
A6_TAB_HELP.hero='Твой серверный профиль: подписки, облики, имущество, навыки, задания и остальные игровые параметры. Правки проходят ту же проверку и историю, что и помощь другим игрокам.';
A6_TAB_HELP.tools='Локальная проверка игровых сценариев. Эти старые тестовые кнопки действуют сразу на твоего персонажа.';
Object.assign(A6_GROUP_HELP,{
 appearance:'Полные облики с датой окончания, аватарки, рамки, ауры и коллекция бутылок. Выдача предмета и выбор надетого предмета — разные действия.',
 tasks:'Ежедневные и недельные задания, поручения и контракты. Изменение прогресса само по себе не выдаёт награду.',
 season:'Валюта, квесты и состояния сезонного пропуска. Платёжные чеки и уже полученные серверные подарки здесь не меняются.',
 activities:'Личная статистика казино, досуг и спортзал. Текущие онлайн-ставки и серверные призовые банки не редактируются.',
 crime:'Криминальный опыт, склад добычи, истории и задержание. Удобная форма склада принимает обычные единицы товара.',
 skills:'Изученные навыки, их уровни, действующие эффекты, достижения и улучшения престижа.'
});
function adminSelfUid513(){return Number(tg?.initDataUnsafe?.user?.id)||0;}
admHero=function(){
 const uid=adminSelfUid513();
 if(A6.card&&A6.card.player.uid===uid)return a6card();
 return `<section class="a6-section"><h3>Мой герой</h3><p>VIP и Premium, облики, навыки, бизнесы и весь игровой прогресс — в одной карточке.</p>${A6.loading?'<p>Загружаю твой профиль…</p>':`<p>${esc(A6.selfError513||'Нужен вход в игру через Telegram и связь с сервером.')}</p><button class="btn primary wide" data-act="a513Self">Загрузить мой профиль</button>`}</section>`;
};
async function adminLoadSelf513(){
 if(!S.admin||A6.loading)return;
 const uid=adminSelfUid513();if(!uid||!onlineOn()){A6.selfError513='Открой игру из Telegram при доступном сервере.';openAdmin();return;}
 A6.self513=true;A6.selfError513='';A6.group='subscriptions';
 await serverWrite();await a6pick(uid);
 if(!A6.card||A6.card.player.uid!==uid)A6.selfError513='Профиль не загрузился. Проверь связь и нажми «Загрузить мой профиль».';
}
const adminTabBefore513=ACTIONS.admTab;
ACTIONS.admTab=async id=>{
 if(!S.admin)return;
 if(id==='hero'){
  if(A6.card?.player.uid!==adminSelfUid513()&&A6.ops.length){adminSwitchAsk513(id);return;}
  A6.self513=true;ADM_TAB='hero';
  if(A6.card?.player.uid!==adminSelfUid513()){A6.card=null;await adminLoadSelf513();}else openAdmin();
  return;
 }
 if(ADM_TAB==='hero'&&id==='players'&&A6.ops.length){adminSwitchAsk513(id);return;}
 A6.self513=false;
 if(ADM_TAB==='hero'&&id==='players'){A6.card=null;A6.ops=[];}
 return adminTabBefore513(id);
};
function adminSwitchAsk513(id){openModal(`<h3>Есть подготовленные правки</h3><p>Сохрани их через проверку или отмени черновик перед сменой получателя.</p><button class="btn primary wide" data-act="a6PlanBack">Вернуться к правкам</button><button class="btn wide" data-act="a513Switch" data-id="${id}">Отменить черновик и перейти</button>`,{center:true});}
ACTIONS.a513Switch=id=>{if(!S.admin)return;A6.ops=[];ACTIONS.admTab(id);};
ACTIONS.a513Self=adminLoadSelf513;
const adminSubscriptionBefore513=ACTIONS.a6Subscription506;
ACTIONS.a6Subscription506=arg=>{adminSubscriptionBefore513(arg);if(String(arg).startsWith('premiumUntil75:')&&Number(String(arg).split(':')[1])>0){const s=a6draft();if((s.autopayUntil||0)<s.premiumUntil75)a6queue({path:['autopayUntil'],kind:'set',value:s.premiumUntil75});}};
const adminApplyBefore513=ACTIONS.a6Apply;
ACTIONS.a6Apply=async()=>{
 if(!S.admin)return;
 const own=A6.self513&&A6.plan?.uid===adminSelfUid513(),plan=A6.plan;
 await adminApplyBefore513();
 if(own&&plan&&!A6.plan&&A6.ops.length===0){try{const remote=await serverGet();if(remote)adminSyncReceive(remote);}catch(_){toast('Правка сохранена. Обнови связь, чтобы загрузить её в игру.','bad');}}
};
function adminQuick513(){
 const s=a6draft(),g=A6.group;
 if(g==='appearance')return `<section class="a6-section a513-quick"><h3>Выдать полный облик</h3><label>Облик<select id="a513Skin">${SKINS75.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label><label>Срок<select id="a513SkinDays">${[1,3,7,30].map(n=>`<option value="${n}" ${n===30?'selected':''}>${n} дн.</option>`).join('')}</select></label><button class="btn primary wide" data-act="a513Skin">Подготовить выдачу и надеть</button><button class="btn wide" data-act="a513SkinOff">Снять полный облик</button><p>Один облик заменяет шапку, одежду и обувь. Продление идёт от конца действующего срока. Stars и подарки за покупку не начисляются.</p></section>`;
 if(g==='skills')return `<section class="a6-section a513-quick"><h3>Уровень навыка</h3><label>Навык<select id="a513Skill">${Object.entries(A6.schema.catalog.skills).map(([id,name])=>`<option value="${id}">${esc(name)}</option>`).join('')}</select></label><label>Уровень<select id="a513SkillLevel">${[1,2,3,4,5].map(n=>`<option value="${n}">${n}</option>`).join('')}</select></label><button class="btn primary wide" data-act="a513Skill">Подготовить уровень</button><p>Это постоянный уровень улучшения. Требования к уровню героя сохраняются. Временное действие включается отдельно через «Эффекты».</p></section>`;
 if(g==='crime')return `<section class="a6-section a513-quick"><h3>Изменить остаток на складе</h3><label>Товар<select id="a513Good">${Object.entries(A6.schema.catalog.crimeGoods||{}).map(([id,x])=>`<option value="${id}">${esc(x.name)} · ${esc(A6.schema.catalog.cities[x.city]?.name||'')}</option>`).join('')}</select></label><label>Итоговый остаток, единиц<input id="a513Qty" type="number" min="0" step="0.001" placeholder="Например: 1,25"></label><button class="btn primary wide" data-act="a513Good">Подготовить остаток</button><p>Укажи сколько товара должно стать всего, с точностью до 0,001. Продажа и выплата денег не выполняются.</p></section>`;
 if(g==='progress')return `<section class="a6-section a513-quick"><h3>Билет в другой город</h3><select id="a513Ticket">${Object.entries(A6.schema.catalog.cities).filter(([id])=>id!=='zas').map(([id,x])=>`<option value="${id}">${esc(x.name)}</option>`).join('')}</select><button class="btn primary wide" data-act="a513Ticket">Подготовить +1 билет</button><p>Билет появится в разделе переезда. Сам переезд не запускается.</p></section>`;
 return '';
}
const adminCardBefore513=a6card;
a6card=function(){
 const t=document.createElement('template');t.innerHTML=adminCardBefore513();const nav=t.content.querySelector('.a6-groups');
 const state=a6draft(),head=t.content.querySelector('.a6-player-head');
 head.querySelector('h3').insertAdjacentHTML('afterend',`<div class="a513-summary"><span>VIP: ${(state.vipUntil||0)>Date.now()?'активен':'нет'}</span><span>Premium: ${(state.premiumUntil75||0)>Date.now()?'активен':'нет'}</span><button class="btn small" data-act="a513Subscriptions">Управлять подписками</button></div>`);
 if(ADM_TAB==='hero'){
  t.content.querySelector('[data-act="a6Back"]')?.remove();t.content.querySelector('.a6-player-head h3').textContent='Мой герой · '+A6.card.player.name;
 }
 t.content.querySelector('[data-act="a6Search506"]').textContent='Найти действие';
 const quick=adminQuick513();if(quick)nav.insertAdjacentHTML('afterend',quick);
 if(A6.search513)t.content.querySelector('#a6Search506')?.closest('.a6-section').insertAdjacentHTML('beforeend',`<div class="a513-search">${A6.search513.map(k=>`<button class="a6-person" data-act="a513Result" data-id="${a6attr(k)}"><b>${esc(A6.schema.roots[k].label)}</b><small>${esc(A6.schema.groups[A6.schema.roots[k].group])}</small></button>`).join('')||'<p>Ничего не найдено. Попробуй название механики.</p>'}</div>`);
 return t.innerHTML;
};
const adminOpenBefore513=openAdmin;
openAdmin=function(){adminOpenBefore513();if(ADM_TAB==='hero'&&A6.card?.player.uid===adminSelfUid513())document.querySelector('.a6-section-choice')?.firstChild.replaceWith('Что меняем у моего героя?');};
const adminEditBefore513=ACTIONS.a6Edit;
ACTIONS.a6Edit=id=>{
 const path=JSON.parse(decodeURIComponent(id)),key=path[0];
 // Populate absent gameplay blocks from the reviewed schema, never from protected server fields.
 if(path.length===1&&a6at(a6draft(),path)==null&&Object.hasOwn(A6.schema.defaults||{},key)&&A6.schema.defaults[key]!==null){
  const had=Object.hasOwn(A6.card.values,key),before=A6.card.values[key];A6.card.values[key]=structuredClone(A6.schema.defaults[key]);
  try{adminEditBefore513(id);}finally{if(had)A6.card.values[key]=before;else delete A6.card.values[key];}
 }else adminEditBefore513(id);
};
ACTIONS.a6Search506=()=>{
 const query=($('a6Search506')?.value||'').trim().toLowerCase();
 A6.search513=query?Object.keys(A6.schema.roots).filter(k=>[k,A6.schema.roots[k].label,A6.schema.roots[k].help,A6_HELP[k]?.label,A6_HELP[k]?.help].join(' ').toLowerCase().includes(query)):null;openAdmin();
};
ACTIONS.a513Result=key=>{if(!A6.schema.roots[key])return;A6.group=A6.schema.roots[key].group;A6.fieldSearch='';A6.search513=null;ACTIONS.a6Edit(a6id([key]));};
Object.assign(ACTIONS,{
 a513Subscriptions:()=>{ACTIONS.a6Group('subscriptions');setTimeout(()=>document.querySelector('.a6-subscription506')?.scrollIntoView({block:'start',behavior:'instant'}),100);},
 a513Skin:()=>{const id=$('a513Skin')?.value,days=Number($('a513SkinDays')?.value);if(!SKINS75.some(x=>x.id===id)||![1,3,7,30].includes(days))return;const s=a6draft(),value=Math.max(Date.now(),Number(s.skins75?.[id])||0)+days*DAY75;a6queue({path:['skins75',id],kind:'set',value});a6queue({path:['skin75'],kind:'set',value:id});},
 a513SkinOff:()=>a6queue({path:['skin75'],kind:'set',value:null}),
 a513Skill:()=>{const id=$('a513Skill')?.value,n=Number($('a513SkillLevel')?.value);if(!A6.schema.catalog.skills[id]||!Number.isInteger(n)||n<1||n>5)return;a6queue({path:['trickLvl',id],kind:'set',value:n});},
 a513Good:()=>{const id=$('a513Good')?.value,raw=$('a513Qty')?.value||'',n=Number(raw.replace(',','.'));if(!A6.schema.catalog.crimeGoods?.[id]||!raw.trim()||!Number.isFinite(n)||n<0||n>1e9||Math.abs(n*1000-Math.round(n*1000))>1e-5){toast('Укажи остаток от 0 до 1 млрд, не больше трёх знаков после запятой.','bad');return;}a6queue({path:['crimeStock72',id],kind:'set',value:Math.round(n*1000)});},
 a513Ticket:()=>{const id=$('a513Ticket')?.value;if(id==='zas'||!A6.schema.catalog.cities[id])return;a6queue({path:['travelTickets75',id],kind:'set',value:(a6draft().travelTickets75?.[id]||0)+1});}
});
const adminNameBefore513=a6name;
a6name=path=>path.length===2&&path[0]==='skins75'?(A6.schema.catalog.skins?.[path[1]]||'Облик'):path.length===2&&path[0]==='crimeStock72'?(A6.schema.catalog.crimeGoods?.[path[1]]?.name||'Товар'):path.length===2&&path[0]==='trickLvl'?(A6.schema.catalog.skills[path[1]]||'Навык'):path.length===1&&A6.schema?.roots[path[0]]?.label?A6.schema.roots[path[0]].label:adminNameBefore513(path);
const adminDisplayBefore513=a6display;
a6display=function(path,value){if(path[0]==='crimeStock72'&&path.length===2&&typeof value==='number')return (value/1000).toLocaleString('ru-RU',{maximumFractionDigits:3})+' ед.';if(path[0]==='skins75'&&path.length===2&&typeof value==='number')return value?'До '+new Date(value).toLocaleString('ru-RU'):'Срок отключён';if(path[0]==='skin75'&&typeof value==='string')return A6.schema.catalog.skins?.[value]||value;return adminDisplayBefore513(path,value);};
const adminDateBefore513=a6isDate;
a6isDate=(path,value)=>path[0]==='skins75'&&path.length===2&&typeof value==='number'||adminDateBefore513(path,value);

const adminSchemaBefore513=a6loadSchema;
a6loadSchema=async function(){await adminSchemaBefore513();for(const [key,spec] of Object.entries(A6.schema.roots))if(spec.help&&!A6_HELP[key])A6_HELP[key]={label:spec.label,help:spec.help};};
const adminHelpBefore513=a6fieldHelp;
a6fieldHelp=path=>path.length===1&&A6.schema?.roots[path[0]]?.help?A6.schema.roots[path[0]].help:adminHelpBefore513(path);
const adminOptionsBefore513=a6options;
a6options=function(path){if(path.length===1&&path[0]==='skin75')return [[null,'Без полного облика'],...Object.entries(a6draft().skins75||{}).filter(([id,until])=>until>Date.now()&&A6.schema.catalog.skins?.[id]).map(([id])=>[id,A6.schema.catalog.skins[id]])];return adminOptionsBefore513(path);};

const adminMenuBefore513=ACTIONS.adminMenu;
ACTIONS.adminMenu=()=>{A6.self513=false;A6.selfError513='';A6.search513=null;return adminMenuBefore513();};
