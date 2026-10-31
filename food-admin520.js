// Presentation only: catalog IDs, prices, eating effects and payment handlers stay unchanged.
function foodIsDrink520(item){return ['coffee','energetik','cn_jasmine50'].includes(item.id)||item.id==='protein'&&city()==='zas';}
function foodGroups520(html){
 const t=document.createElement('template');t.innerHTML=html;const seen=new Set(),groups={food:[],drinks:[]};
 for(const card of [...t.content.querySelectorAll('.card')]){
  const id=card.querySelector('[data-act="eat"]')?.dataset.id,title=card.querySelector('.card-title')?.textContent.trim(),item=FOOD.find(f=>id?f.id===id:f.name===title);
  if(!item)continue;
  if(seen.has(item.id)){card.remove();continue;}seen.add(item.id);groups[foodIsDrink520(item)?'drinks':'food'].push(card);
 }
 if(!seen.size)return html;
 const nav=document.createElement('nav');nav.className='food520-nav';nav.setAttribute('aria-label','Разделы еды');nav.innerHTML='<button class="btn" data-act="foodJump520" data-id="food">🍽️ Еда</button><button class="btn" data-act="foodJump520" data-id="drinks">🥤 Напитки</button>';t.content.prepend(nav);
 for(const [kind,title] of [['food','🍽️ Еда'],['drinks','🥤 Напитки']]){const section=document.createElement('section');section.className='food520-group';section.dataset.foodKind=kind;section.innerHTML='<h3 class="food520-heading">'+title+'</h3>';for(const card of groups[kind])section.append(card);t.content.append(section);}
 return t.innerHTML;
}
const foodRenderBefore520=RENDER.shop[1];renderShop=function(){const html=foodRenderBefore520();return TABS.shop==='food'?foodGroups520(html):html;};RENDER.shop[1]=renderShop;
ACTIONS.foodJump520=kind=>{if(!['food','drinks'].includes(kind))return;document.querySelector('.screen.active [data-food-kind="'+kind+'"]')?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});};

// Self Premium always goes through the existing authenticated workbench and review.
const premiumAdminBefore520=openAdmin;openAdmin=function(){
 premiumAdminBefore520();if(!S.admin)return;const nav=document.querySelector('#modalRoot .a6-nav');if(!nav||document.querySelector('#modalRoot .admin520-self'))return;
 nav.insertAdjacentHTML('beforebegin','<button class="btn primary wide admin520-self" data-act="myPremium520">👑 Выдать себе Premium</button><button class="btn wide" data-act="webPayments520">ЮKassa для веб-версии</button>');
 if(ADM_TAB==='hero'&&A6.card?.player.uid===adminSelfUid513()&&A6.group==='subscriptions'){
  const body=document.querySelector('#modalRoot .a6-body');body?.insertAdjacentHTML('afterbegin',`<section class="a6-section admin520-premium"><h3>Premium для моего героя</h3><p>Подписка продлевается от конца действующего срока. Выдача без оплаты и подарков за покупку.</p><div class="a6-filter">${[1,3,7,30].map(n=>`<button class="btn" data-act="myPremiumDays520" data-id="${n}">+${n} дн.</button>`).join('')}</div><p>Выбери срок, затем проверь изменения перед применением.</p></section>`);
 }
};
ACTIONS.myPremium520=async()=>{
 if(!S.admin)return;
 if(A6.ops.length&&A6.card?.player.uid!==adminSelfUid513()){adminSwitchAsk513('hero');return;}
 await ACTIONS.admTab('hero');if(A6.card?.player.uid!==adminSelfUid513())return;A6.group='subscriptions';openAdmin();document.querySelector('.admin520-premium')?.scrollIntoView({block:'start'});
};
ACTIONS.myPremiumDays520=async raw=>{
 const days=Number(raw);if(!S.admin||!A6.self513||A6.card?.player.uid!==adminSelfUid513()||![1,3,7,30].includes(days))return;
 A6.reason='Выдача Premium моему герою по решению администратора';const reason=$('a6Reason');if(reason)reason.value=A6.reason;
 ACTIONS.a6Subscription506('premiumUntil75:'+days);const next=$('a6Reason');if(next)next.value=A6.reason;await ACTIONS.a6Preview();
};
ACTIONS.webPayments520=async()=>{
 if(!S.admin)return;try{
  const status=await apiPost('admin/web-payments/status');if(status.error)throw Error(status.error);
  const names={enabled:'Включение приёма платежей',shop:'ID магазина',secret:'Секретный ключ на сервере',returnUrl:'Адрес возврата после оплаты',origin:'Адрес веб-игры',sameOrigin:'Совпадение адресов',prices:'Рублёвые цены товаров',webLogin:'Вход в самостоятельную веб-игру',delivery:'Выдача покупок веб-игры',refunds:'Обработка возвратов'};
  openModal('<h3>ЮKassa для веб-версии</h3><p>'+(status.available?'Приём платежей настроен.':'Приём платежей пока отключён. Не хватает настроек для самостоятельной веб-версии.')+'</p><p>'+(status.testMode?'Режим: тестовые платежи':'Режим: реальные платежи')+'</p><ul>'+Object.entries(status.checks||{}).map(([key,ok])=>'<li>'+(ok?'✓ ':'○ ')+esc(names[key]||key)+'</li>').join('')+'</ul><p>Секретный ключ вводится только на сервере. В Telegram-магазине используется оплата Stars.</p><button class="btn wide" data-act="adminMenu">Вернуться в админку</button>',{center:true});
 }catch(e){toast('Не удалось проверить настройки платежей. Проверь связь с сервером.','bad');}
};
