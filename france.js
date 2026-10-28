// Chapter IV. Stored money stays in the common unit used by saves/server/gangs;
// the euro is an in-game display/input unit, not a real-world exchange-rate feed.
CITIES.fr={name:'Франция',emoji:'🇫🇷',idx:3};
CITY_IDENTITY.fr={name:'Париж',tag:'Мансарды, метро, багеты и большие перемены',music:'musette',casino:'Le Velours',color:'#d9b78d'};
MAIN_MUSIC.push(['musette','🇫🇷 Парижский аккордеон'],['frjazz','🎷 Джаз над Сеной']);
CRIME_RANKS.fr=['Новичок квартала','Уличный ловкач','Ворон набережной','Хозяин ночного Парижа','Легенда подполья'];
const EUR_RATE=100,eur=n=>Math.round(n*EUR_RATE);
function isFrance(){return typeof S!=='undefined'&&S&&S.city==='fr';}
function cityMoney(value,c=city()){
  if(!Number.isFinite(value))return '—';
  const rate=c==='mex'?USD_RATE:c==='fr'?EUR_RATE:1;
  const n=(value/rate).toLocaleString('ru-RU',{maximumFractionDigits:2});
  return c==='mex'?'$'+n:n+(c==='fr'?' €':' ₽');
}
function rubToEuroText(s){
  if(!s||!s.includes('₽'))return s;
  return s.replace(RUB_RE,(_,sign,num,unit)=>(sign||'')+cityMoney(parseFloat(num.replace(/[   ]/g,'').replace(',','.'))*(unit?RUB_UNIT[unit]||1:1),'fr')).replace(/₽/g,'€');
}
function frConvertNode(root){
  if(!isFrance()||!root)return;
  if(root.nodeType===3){if(root.nodeValue.includes('₽'))root.nodeValue=rubToEuroText(root.nodeValue);return;}
  if(root.nodeType!==1||['SCRIPT','STYLE','TEXTAREA'].includes(root.tagName))return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>['SCRIPT','STYLE','TEXTAREA'].includes(n.parentElement?.tagName)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});let n;
  while((n=w.nextNode()))if(n.nodeValue.includes('₽'))n.nodeValue=rubToEuroText(n.nodeValue);
  root.querySelectorAll('i.ic[data-ic="coin"]').forEach(ic=>{const t=ic.nextSibling;if(t&&t.nodeType===3&&/^\s*[\d\s .,]+(K|M|B|\s?млн|\s?млрд)?\s*$/.test(t.nodeValue))t.nodeValue=rubToEuroText(t.nodeValue.trim()+' ₽');});
  root.querySelectorAll('[data-why*="₽"]').forEach(el=>el.dataset.why=rubToEuroText(el.dataset.why));
}
const FR_OBSERVER=new MutationObserver(ms=>{if(!isFrance())return;for(const m of ms){if(m.type==='characterData')frConvertNode(m.target);else m.addedNodes.forEach(frConvertNode);}});
HOOKS.init.push(()=>FR_OBSERVER.observe(document.body,{childList:true,subtree:true,characterData:true}));
HOOKS.hud.push(()=>{if(isFrance()){$('money').textContent=cityMoney(S.money);frConvertNode(document.querySelector('.screen.active'));}});
if(ACTIONS.betCustomOk){const orig=ACTIONS.betCustomOk;ACTIONS.betCustomOk=(...a)=>{const inp=document.querySelector('#modalRoot input[type="number"]');if(isFrance()&&inp&&inp.value)inp.value=Math.round(Number(inp.value)*EUR_RATE);return orig(...a);};}

// Descriptors let us restore exactly what existed before entry. Reapplying France
// or returning through prestige must never compound prices or leak French games.
let FR_ON=false,FR_CRIME_BACKUP=null;
const FR_RESTORE=new Map();
function frSet(obj,patch){
  if(!obj)return;let fields=FR_RESTORE.get(obj);if(!fields){fields=new Map();FR_RESTORE.set(obj,fields);}
  for(const [k,v] of Object.entries(patch)){if(!fields.has(k))fields.set(k,Object.getOwnPropertyDescriptor(obj,k));Object.defineProperty(obj,k,{value:v,writable:true,enumerable:true,configurable:true});}
}
function frRestore(){
  if(FR_CRIME_BACKUP){CRIMES.splice(0,CRIMES.length,...FR_CRIME_BACKUP);FR_CRIME_BACKUP=null;}
  for(const [obj,fields] of FR_RESTORE)for(const [k,d] of fields){if(d)Object.defineProperty(obj,k,d);else delete obj[k];}
  FR_RESTORE.clear();FR_ON=false;
}
function frReskin(list,names,mult=5.2){
  for(const [i,x] of list.entries()){
    const value=names[x.id]??names[i];const patch=typeof value==='string'?{name:value}:value||{};
    if(typeof x.price==='number'&&x.price>0&&!x.caps)patch.price=Math.max(1,Math.round(x.price*mult));
    frSet(x,patch);
  }
}
const FR_HOUSING=[
  {name:'Вид на Эйфелеву башню',price:0,rent:0,util:0,desc:'Скамейка на набережной Сены. Голубь Гастон считает тебя соседом'},
  {name:'Палатка на набережной',price:eur(15),rent:0,util:0,desc:'Вид на воду; за стенкой играет аккордеон'},
  {name:'Койка в хостеле «Бонжур»',price:eur(80),rent:0,util:0,desc:'Завтрак — багет. Завтрашний завтрак — тоже багет'},
  {name:'Мансарда: chambre de bonne',price:eur(600),rent:eur(25),util:eur(5),desc:'Комната под крышей. До душа три лестницы, зато Париж!'},
  {name:'Квартира в Бельвиле',price:eur(4500),rent:eur(180),util:eur(35),desc:'Высокие окна, соседи со всего света и рынок под домом'},
  {name:'Лофт художника на Монмартре',price:eur(25000),rent:eur(800),util:eur(110),desc:'Сакре-Кёр на горизонте, джаз и мастерская'},
  {name:'Особняк с французским садом',price:eur(220000),rent:eur(6200),util:eur(750),desc:'Месье Валера, вас ждут в зимнем саду'},
];
const FR_EDU=[
  {name:'Новичок в Париже'},
  {name:'Как устроен Париж',emoji:'🗣️',price:eur(12),desc:'Кафе, маршруты и заказы: подсказки на русском'},
  {name:'Курсы ремесла у месье Жюля',emoji:'🥐',price:eur(100),desc:'Круассаны не прощают спешки'},
  {name:'Колледж городских профессий',emoji:'🎓',price:eur(500),desc:'Диплом с тремя печатями. Каждая настоящая'},
  {name:'Университет Сорбонны',emoji:'🏛️',price:eur(2200),desc:'Философия, экономика и искусство спорить'},
  {name:'Парижская школа управления',emoji:'📊',price:eur(10000),desc:'Как управлять компанией, если все на забастовке'},
];
const FR_JOBS={flyers:['Раздатчик афиш у метро','🪧'],loader:['Грузчик рынка Рюнжи','🧺'],courier:['Велокурьер с багетами','🚲'],guard:['Смотритель музея','🖼️'],taxi:['Парижский таксист','🚕'],seller:['Продавец в сырной лавке','🧀'],manager:['Управляющий брассери','🍽️'],director:['Директор дома моды','🧵'],dvornik:['Работник городской чистоты','🧹'],postman:['Почтальон квартала','📮'],cook:['Пекарь-круассанье','🥐'],police:['Патрульный комиссариата','👮'],teacher:['Ведущий городских мастерских','🧑‍🏫'],clerk:['Служащий бюро №404','📑'],deputy:['Депутат районного совета','🏛️']};
const FR_WORK={
  flyers:[frMarch,'Афиша для Бастилии','Раздавай афиши в ритм. Нажимай, когда написано «ПОРА»',14],
  loader:[frBakery,'Рынок Рюнжи','Собирай ящики по заказу слева направо',24,{items:['🧀','🥖','🍎','🥬'],sign:'RUNGIS · утренний рынок'}],
  courier:[frMetro,'Доставка через бастующий город','Выбери открытый поезд до нужной станции',18],
  guard:[frForms,'Приём экспонатов','Проверь оба штампа на музейных документах',16,{sign:'MUSÉE · приёмная музея'}],
  taxi:[frMetro,'Париж без пробок','Доставь пассажиров к нужным кварталам',18],
  seller:[frBakery,'Сырная лавка','Собери заказ сыра, хлеба и кофе по списку',24],
  manager:[frForms,'Бронь столиков','Принимай только заявки с обоими штампами',16,{sign:'BRASSERIE · бронирование'}],
  director:[frBakery,'Показ новой коллекции','Подбирай аксессуары в порядке эскиза',24,{items:['👒','🧣','👜','👠'],sign:'ATELIER · дом моды'}],
  dvornik:[frBakery,'После уличного праздника','Собери вторсырьё по списку сортировки',24,{items:['🍾','📦','🥫','📰'],sign:'TRI · раздельный сбор'}],
  postman:[frMetro,'Письма не бастуют','Найди открытый маршрут в нужный квартал',18],
  cook:[frBakery,'Утро в булочной','Круассаны, багеты, сыр и кофе — слева направо',24],
  police:[frForms,'Дежурство в комиссариате','Проверяй обращения: нужны оба штампа',16,{sign:'COMMISSARIAT · приём обращений',windowMs:2200}],
  teacher:[frLanguage,'Мастерская квартала','Собирай заказы по образцу: предмет и количество видны по-русски',18],
  clerk:[frForms,'Подтверждение подтверждения','Синий круг И золотая звезда: принять. Иначе вернуть',16],
  deputy:[frMarch,'Слушания районного совета','Дай слово жителям в нужный момент',14,{sign:'CONSEIL · районный совет',chants:['Кому нужен новый сквер?','Голосуем за ремонт!','Выслушаем соседей!','Перерыв на кофе!']}],
};
const FR_GIRLS=[
  {id:'f_camille',name:'Камиль, активистка',emoji:'🪧',picky:.2,std:.05,req:{level:5},desc:'За права соседей спорит громче мегафона'},
  {id:'f_ines',name:'Инес, бариста',emoji:'☕',picky:.25,std:.05,req:{level:8,housing:2},desc:'Рисует на кофе голубей и знает весь квартал'},
  {id:'f_awa',name:'Ава, юристка',emoji:'👩🏿‍⚖️',picky:.35,std:.02,req:{level:12,edu:2},desc:'Находит выход там, где чиновник видит только очередь'},
  {id:'f_juliette',name:'Жюльетта, художница',emoji:'🎨',picky:.4,std:.03,req:{level:16,housing:3},desc:'Монмартр, акварель и вечно испачканный шарф'},
  {id:'f_chloe',name:'Хлоя, дизайнер',emoji:'🧵',picky:.5,std:.02,req:{level:22,edu:3,body:2,housing:4},desc:'Твой пиджак она уже мысленно перешила'},
  {id:'f_celeste',name:'Селест, хозяйка галереи',emoji:'🖼️',picky:.6,std:.02,req:{level:28,edu:4,body:3,housing:5},desc:'Видит шедевр даже в засранской бутылке'},
];
FR_GIRLS.forEach((g,i)=>{RING_OF[g.id]=eur([180,350,700,1600,6000,20000][i]);ALLOW_OF[g.id]=eur([20,35,80,180,650,2200][i]);if(typeof GIRL_TIER!=='undefined')GIRL_TIER[g.id]=Math.min(4,1+Math.floor(i/2));if(typeof GIRL_TASTE!=='undefined')GIRL_TASTE[g.id]={likes:i%2?'rose':'book',meh:'candy'};});
allGirls=(function(orig){return()=>[...orig(),...FR_GIRLS];})(allGirls);

function applyFranceCity(){
  HOUSING.forEach((x,i)=>frSet(x,FR_HOUSING[i]));EDU.forEach((x,i)=>frSet(x,FR_EDU[i]));
  JOBS.forEach(j=>{const a=FR_JOBS[j.id],z=ZAS_SKIN.jobs[j.id],g=FR_WORK[j.id];if(a&&z)frSet(j,{name:a[0],emoji:a[1],pay:Math.max(100,Math.round(z.pay*5.2/100)*100)});
    if(g&&JOB_GAMES[j.id])frSet(JOB_GAMES[j.id],{engine:(mg)=>g[0](mg,g[4]||{}),title:g[1],hint:g[2],target:g[3]});});
  const foodNames=['Багет из соседней булочной','Круассан с маслом','Кофе крем','Галета по-бретонски','Лимонад с бузиной','Крок-месье','Луковый суп','Обед в брассери','Фромаж блан','Киш лорен','Мидии с картофелем','Стейк с перечным соусом','Ужин шефа на Монмартре','Дегустация французских сыров'];
  const foodEmoji=['🥖','🥐','☕','🫓','🍋','🥪','🧅','🍲','🥛','🥧','🦪','🥩','🍽️','🧀'];
  FOOD.forEach((x,i)=>{if(i<foodNames.length)frSet(x,{name:foodNames[i],emoji:foodEmoji[i],price:eur([1,1.5,2,3,3,5,6,9,7,10,14,25,50,100][i]),desc:'Свежий заказ в парижском квартале'});});
  frReskin(CLOTHES.hat,{shapka:'Вязаная шапка докера',ushanka:'Парижский берет',kepka:'Кепи газетчика',cilinder:'Шляпа мастера ателье'});
  frReskin(CLOTHES.body,{rvan:'Куртка с блошиного рынка',telnyashka:'Бретонская полосатая футболка',base:'Льняная рубашка',pukhovik:'Пальто для набережной',malinovy:'Пиджак художника',kostum:'Костюм парижского ателье'});
  frReskin(CLOTHES.shoes,{none:'Босиком по брусчатке',tapki:'Эспадрильи из лавки',base:'Кожаные полуботинки',kedy:'Кеды для парижских улиц',boots:'Ботинки из мастерской'});
  frSet(HATS,{ushanka:'<path d="M44 47q8-23 39-22 29 1 37 22l-14 12H52z" fill="#34415c"/><path d="M47 52q34 9 65-1" stroke="#253249" stroke-width="7"/><path d="M80 25l6-9" stroke="#34415c" stroke-width="5"/>',kepka:'<path d="M49 53q2-26 34-26t31 26z" fill="#a08c75"/><path d="M78 29v23M61 34l-4 18M99 34l8 18" stroke="#7c6a59" fill="none"/><path d="M99 50q29 0 34 10l-34-2z" fill="#84725f"/>'});
  for(const [id,colors] of Object.entries({rvan:['#77756a','#d9caac'],telnyashka:['#ede5cc','#344b6b'],base:['#ece5d7','#b6c1ce'],pukhovik:['#3b475d','#bd9d7b'],malinovy:['#73576d','#e0c99f'],kostum:['#293d5a','#eee0c7']}))if(BODIES[id])frSet(BODIES[id],{jacket:colors[0],shirt:colors[1]});
  frReskin(TRANSPORT,{1:'Самокат с барахолки',2:'Городской велосипед',3:'Винтажный мопед',4:'Грузовой велосипед',5:'Скутер для набережной',6:'Ситроен «Дё-шво»',7:'Фургон булочной',8:'Купе французского ателье',9:'Электромобиль парижанина',10:'Кабриолет для Ривьеры',11:'Лимузин для приёма'});
  TRANSPORT.forEach(t=>{if(t.fuel)frSet(t,{fuel:Math.round(t.fuel*4)});if(t.garage)frSet(t.garage,{name:'Гараж во внутреннем дворе',price:Math.round(t.garage.price*5.2)});});
  TRANSPORT.forEach((t,i)=>{if(i)frSet(t,{emoji:['','🛴','🚲','🛵','🚲','🛵','🚙','🚐','🚗','🚘','🏎️','🚘'][i]||t.emoji});});
  frReskin(DATES,{walk:'Прогулка по набережной Сены',cafe:'Кофе в бистро Сен-Мартен',cinema:'Парижский синематограф',rest:'Ужин в ресторане Монмартра',yacht:'Катер по Сене',skate:'Прогулка по Булонскому лесу',amuse:'Ярмарка в Тюильри',picnic:'Пикник в Люксембургском саду',museum:'Вечер в музее Орсе',karaoke:'Дуэт в бистро',bowling:'Петанк вдвоём'},4.5);
  frReskin(GIFTS,{rose:{name:'Букет с парижского цветочного рынка',emoji:'💐'},candy:'Коробка макарон',book:'Альбом художников Монмартра',champ:'Игристое из французской лавки',teddy:'Плюшевый голубь Гастон',perfume:'Духи маленького ателье',bag:'Сумочка парижского мастера'},4.5);
  frReskin(WEDDINGS,{zags:{name:'Роспись в парижской мэрии',desc:'Двое свидетелей, цветы и кофе у площади'},canteen:{name:'Свадьба в квартальном бистро',desc:'Соседи, аккордеон и столы до самой набережной'},banquet:{name:'Приём в загородном шато',desc:'Французский сад, джазовый квартет и ужин при свечах'}},5.2);
  frReskin(TRICKS,{},4.5);
  const found={scrap:'Деталь старого велосипеда',copper:'Медь из парижской мастерской',battery:'Аккумулятор скутера',phone:'Телефон с блошиного рынка',watch:'Часы парижского антиквара',ring:'Кольцо с гравировкой «Paris»',painting:'Картина «Почти Моне»'};
  for(const [id,item] of Object.entries(ITEMS))frSet(item,{...(found[id]?{name:found[id]}:{}),base:Math.round(item.base*3.5)});
  const biz={stall:['Тележка с крепами','🥞'],shawarma:['Багетная «У Валеры»','🥖'],carwash:['Веломастерская у канала','🚲'],cafe:['Кафе «Бонжур, сосед!»','☕'],shops:['Сеть сырных лавок','🧀'],club:['Джаз-клуб «Синий час»','🎷']};
  BUSINESSES.forEach(b=>{const a=biz[b.id];if(a)frSet(b,{name:a[0],emoji:a[1],price:Math.round(b.price*5.2),income:b.income*5.2});});
  frReskin(MEDS,{});frReskin(CLINICS,{polyclinic:'Муниципальный медпункт',private:'Клиника «Сен-Мартен»'});
  frReskin(GYMS,{bar:'Турники у канала',basement:'Боксёрский зал Бельвиля',fitness:'Парижский спортивный клуб'});
  const pets={pigeon:'Голубь Гастон',rat:'Хорёк Анри',dog:'Бульдог Бриош',hedgehog:'Ёж Марсель',parrot:'Какаду Франсуа',cat:'Кот Месье Камамбер'};
  PETS.forEach(p=>{if(!pets[p.id]||p.premium)return;frSet(p,{baseName:pets[p.id],price:eur({pigeon:5,rat:35,dog:90,hedgehog:65,parrot:200,cat:140}[p.id]),quest:false,level:1});
    const fields=FR_RESTORE.get(p);if(!fields.has('name'))fields.set('name',Object.getOwnPropertyDescriptor(p,'name'));Object.defineProperty(p,'name',{configurable:true,enumerable:true,get:()=>S.petNames?.[p.id]||pets[p.id]});frSet(PET_ART,{[p.id]:frPetArt(p.id)});});
  for(let i=1;i<7;i++)frSet(CHAPTERS,{[i]:FR_HOUSING[i].name+'. Париж понемногу становится твоим домом.'});
  const girls=FR_GIRLS.slice();if(S.girlfriend&&!girls.some(g=>g.id===S.girlfriend)){const p=allGirls().find(g=>g.id===S.girlfriend);if(p)girls.push(p);}
  GIRLS.splice(0,GIRLS.length,...girls);RINGS.splice(0,RINGS.length,...girls.map(g=>RING_OF[g.id]||eur(100)));ALLOWANCE.splice(0,ALLOWANCE.length,...girls.map(g=>ALLOW_OF[g.id]||eur(20)));
  const rest={mihalych:['Вечер в соседском бистро','🍷'],football:['Митинг на Бастилии','🪧'],cinema:['Кино на набережной','🎬'],banya:['Хаммам квартала','♨️'],karaoke:['Шансон в бистро','🎙️'],spa:['Вечер в термальном спа','🫧'],fishing:['Рыбалка на Сене','🎣'],thimbles:['Петанк во дворе','⚪'],darts:['Дартс в квартальном бистро','🎯'],shashlik:['Пикник с сыром и багетом','🧺'],sea:['Выходные на Лазурном берегу','🏖️']};
  LEISURE.forEach(l=>{const a=rest[l.id],z=ZAS_SKIN.leisure[l.id];if(a&&z)frSet(l,{name:a[0],emoji:a[1],desc:'Парижский вечер: разговоры, музыка и свои люди',price:Math.round(z.price*4.5)});});
  for(const [k,g] of Object.entries(LEISURE_GAMES)){const engine=k==='fishing'?gameFishing:k==='darts'?gameDarts:k==='football'||k==='karaoke'?frMarch:k==='cinema'||k==='thimbles'?frMemory:k==='sea'?frMetro:frBakery;
    const target=k==='fishing'?6:k==='darts'?150:engine===frMemory?3:engine===frMarch?12:18;
    frSet(LEISURE_GAMES,{[k]:{...g,title:rest[k]?.[0]||'Парижский вечер',hint:k==='fishing'?'Жди, пока поплавок нырнёт, и сразу подсекай':k==='darts'?'Бросай, когда прицел ближе к центру. Яблочко — 50 очков':engine===frMarch?'Нажимай по сигналу «ПОРА»':engine===frMemory?'Запомни и повтори последовательность':engine===frMetro?'Выбирай открытый маршрут': 'Собирай заказ слева направо',duration:k==='darts'?0:24,max:target,target,run:mg=>engine(mg),setup:mg=>engine(mg)}});}
  for(const [k,g] of Object.entries(DATE_GAMES)){const engine=['walk','skate','yacht'].includes(k)?frMetro:['cinema','museum'].includes(k)?frMemory:['karaoke','amuse'].includes(k)?frMarch:frBakery;
    frSet(DATE_GAMES,{[k]:{...g,title:{walk:'Прогулка по Монмартру',skate:'Велопрогулка вдоль Сены',cafe:'Свидание в бистро',museum:'Галерея на Монмартре',karaoke:'Дуэт под аккордеон',yacht:'Катер по Сене'}[k]||'Парижское свидание',hint:'Выполняйте задания вместе: правила показаны на экране',duration:24,max:engine===frMemory?3:engine===frMarch?12:18,setup:mg=>engine(mg)}});}
  for(const [k,g] of Object.entries(GYM_GAMES)){const setup=mg=>{frMarch(mg,{sign:'SPORT · спортивный квартал',chants:['Вдох. Выдох. Ритм.','Не спеши — держи темп!','Ещё один повтор!','Работаем спокойно!']});frTimer(mg,mgEnd,24000);};frSet(GYM_GAMES,{[k]:{...g,title:'Тренировка в Бельвиле',hint:'Держи ритм: нажимай по сигналу «ПОРА»',duration:24,max:12,engine:setup,setup}});}
  for(const [k,g] of Object.entries(KID_GAMES))frSet(KID_GAMES,{[k]:{...g,title:'Семейная прогулка по Парижу',hint:'Запомни и повтори картинки',duration:30,max:3,setup:mg=>frMemory(mg,{icons:['🧸','🥐','🎠','🕊️']})}});
  if(typeof DATE_GAME_ICON!=='undefined')for(const k of Object.keys(DATE_GAME_ICON))frSet(DATE_GAME_ICON,{[k]:'🇫🇷 Париж'});
  PARTNER_GAMES.forEach(g=>frSet(g,{title:'Дела вдвоём в Париже',hint:'Собирайте покупки по порядку',duration:24,max:18,target:18,setup:mg=>frBakery(mg)}));
  JAIL_ACTS.forEach(a=>{if(a.id==='escape'){frSet(a,{name:'Побег из французской тюрьмы'});return;}
    const sport=a.id==='pushups';frSet(a,{name:sport?'Тренировка во дворике':'Кухня французской тюрьмы',emoji:sport?'💪':'🥖',desc:sport?'Тренировка сохраняет обычный эффект к силе':'Собери заказ по списку: до −2 минут срока за хороший результат',game:{title:sport?'Дворик форта':'Багеты для тюремной кухни',hint:sport?'Нажимай по сигналу «ПОРА»':'Собери заказ слева направо',duration:24,max:sport?12:18,setup:mg=>(sport?frMarch:frBakery)(mg)}});});
  // Replace the array rather than permanently appending foreign schemes.
  FR_CRIME_BACKUP=CRIMES.slice();
  CRIMES.splice(0,CRIMES.length,...FR_CRIMES);
  FR_ON=true;renderedHousing=-1;renderedLook='';setTimeout(()=>frConvertNode(document.body),0);
}
applyCity=(function(orig){return function(c=city()){
  if(FR_ON)frRestore();orig(c);document.body.classList.toggle('city-fr',c==='fr');
  if(c==='fr')applyFranceCity();
};})(applyCity);
const startLessonBeforeFrance=startLessonGame;
startLessonGame=function(stage){if(!isFrance())return startLessonBeforeFrance(stage);
  const need=Math.max(3,Math.round((stage===1?6:10)*(hasEffect('t_focus')?0.75:1)));
  runGame({title:'🇫🇷 '+EDU[stage].name,scoreLabel:' / '+need,hint:'Выбирай русский перевод французского слова. Шпаргалка остаётся на экране.',duration:LESSON_TIME,setup:mg=>frLanguage(mg),finish:score=>finishLesson(stage,score,need)});
};
// New city gets a separate musical identity even in the casino and darker scenes.
const syncMusicBeforeFrance=syncMusic;
syncMusic=function(){if(!isFrance())return syncMusicBeforeFrance();if(typeof Sound==='undefined'||!S.settings)return;
  const selected=S.settings.mainMusic;Sound.music(selected==='off'?null:inCasino()?'frjazz':selected&&selected!=='city'?selected:'musette');};
HOOKS.screen.push(()=>{if(isFrance())syncMusic();});
HOOKS.hud.push(()=>{if(isFrance()&&S.settings.mainMusic!=='off')syncMusic();});
