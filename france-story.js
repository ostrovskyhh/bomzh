// All names/companies in this chapter's criminal plot are fictional. The optional
// Pavel episode is explicitly an alternate, fictional game story, not news.
NEW_CITY_CASH.fr=eur(180);FROZEN_WHO.fr='Парижское бюро проверки переводов';
newcomerCashText=(function(orig){return c=>c==='fr'?cityMoney(NEW_CITY_CASH.fr,'fr'):orig(c);})(newcomerCashText);
function frState(){if(!S.france||typeof S.france!=='object'||Array.isArray(S.france))S.france={};const s=S.france;
  if(!s.cd||typeof s.cd!=='object'||Array.isArray(s.cd))s.cd={};
  s.egg=Math.max(0,Math.min(3,Math.floor(Number(s.egg)||0)));return s;
}
HOOKS.load.push(frState);
const FR_TOWN={
  bureau:{name:'Бюро №404',hint:'Проверь оба штампа: синий круг И золотую звезду. Только тогда принимай документ.',engine:frForms,target:12,duration:24,energy:4,cd:60,money:eur(10),key:'frBureau'},
  quartier:{name:'Помочь соседям квартала',hint:'Собирай продукты для соседской кухни слева направо.',engine:frBakery,target:18,duration:24,energy:5,cd:120,money:eur(18),key:'frHelp'},
  march:{name:'Митинг на Бастилии',hint:'Нажимай один раз за круг по надписи «ПОРА». На площади ценят ритм, а не скорость тапов.',engine:frMarch,target:12,duration:24,energy:6,cd:120,money:eur(15),key:'frMarch'},
  metro:{name:'Письмо через бастующее метро',hint:'Выбирай открытый поезд до нужного квартала. Красный маршрут закрыт.',engine:frMetro,target:14,duration:24,energy:5,cd:120,money:eur(18),key:'frMetro'},
  signal:{name:'Архив бумажного голубя',hint:'Запомни картинки слева направо, затем повтори. Три сигнала откроют архив.',engine:frMemory,target:3,duration:35,energy:5,cd:120,money:eur(18),key:'frSignal'},
};
function frTownReward(e,score){return score>0?Math.round(e.money*Math.min(1.25,score/e.target)*mods().work):0;}
const FR_CRIMES=[
  {id:'f_pocket',rank:0,name:'Карманник у сувенирной лавки',emoji:'👛',level:3,energy:15,wanted:1,risk:.1,cd:180,desc:'Малик предлагает туристические «подработки». Это криминал: есть риск тюрьмы и потери денег.',game:{title:'Чужой кошелёк',hint:'Повтори условный сигнал. Ошибки уменьшают добычу.',duration:30,max:3,setup:mg=>frMemory(mg,{icons:['👛','🧣','📸','⌚'],sign:'LES CORBEAUX · Вороны'})},reward:perf=>Math.round((eur(12)+level()*250)*perf)},
  {id:'f_fake',rank:1,name:'Фальшивый модный показ',emoji:'👜',level:6,energy:22,wanted:2,risk:.15,cd:420,desc:'Контрафакт под видом высокой моды. Успех не отменяет риск попасться.',game:{title:'Ателье с двойным дном',hint:'Собери набор аксессуаров по образцу слева направо.',duration:24,max:20,setup:mg=>frBakery(mg,{items:['👜','👠','👒','🧣'],sign:'FAUX CHIC · поддельный шик'})},reward:perf=>Math.round((eur(70)+level()*550)*perf)},
  {id:'f_riot',rank:2,name:'Дебош после митинга',emoji:'🚧',level:9,energy:28,wanted:2,risk:.2,cd:600,desc:'Шумная вылазка «Воронов»: плакаты, краска и разбитые декорации. Ущерб и проигрыш могут обнулить заработок.',game:{title:'Ночь на площади',hint:'Попадай в ритм по надписи «ПОРА». Это отдельное рискованное дело, а не мирный митинг.',duration:24,max:14,setup:mg=>frMarch(mg,{period:1.3,sign:'NUIT AGITÉE · шумная ночь',chants:['Грохот! Плакаты! Краска!','Бочка — тоже барабан!','Вороны снова шумят!','Слышен свисток…']})},reward:perf=>Math.round((eur(180)+level()*1000)*perf)},
  {id:'f_gallery',rank:3,name:'Афера в закрытой галерее',emoji:'🖼️',level:14,energy:30,wanted:3,risk:.22,cd:900,desc:'Барон выдаёт копии за оригиналы. Сыграешь по его правилам — рискуешь своими деньгами и свободой.',game:{title:'Печать галереи',hint:'Проверь два условных штампа на каждой карточке.',duration:24,max:18,setup:mg=>frForms(mg,{windowMs:2000,sign:'GALERIE · закрытый просмотр'})},reward:perf=>Math.round((eur(350)+level()*1600)*perf)},
  {id:'f_cargo',rank:4,name:'Ночной груз на Сене',emoji:'🚤',level:20,energy:35,wanted:3,risk:.25,cd:1200,desc:'Сеть Дюваля зовёт на последнюю доставку. Крупнее ставка — тяжелее последствия провала.',game:{title:'Огни набережных',hint:'Выбирай открытый путь к нужному условному причалу.',duration:25,max:20,setup:mg=>frMetro(mg,{stops:['Синий причал','Золотой причал','Старый склад','Последний мост']})},reward:perf=>Math.round((eur(700)+level()*2200)*perf)},
];
const FR_Q=(key,n,text)=>({...qc(key,n,text),frTown:true});
const frQuestData=[
  ['f_arrive','👩🏿‍⚖️','Ава','Бонжур, месье Валера',
   'В папке Скорпионов найден парижский след. Рамирес вывела тебя из Веракруса до того, как остатки картеля добрались до свидетеля. Ава поможет довести дело до конца — но сначала очередь в бюро.',
   [FR_Q('frBureau',1,'Разобраться с документами в бюро №404')],40,
   [['👮🏽‍♀️','Рамирес','Ты бежал в Мексику, потому что мошенники сделали тебя курьером в обмане бабушки Нины. Мы вернули деньги и закрыли колл-центр.'],['👩🏿‍⚖️','Ава','Но платёжная цепочка ведёт в Париж. Французская фирма «Багет Экспорт 404» оплачивала мексиканскую «Ла Пальму». Теперь ты свидетель.'],['🧳','Валера','То есть я опять начинаю с бутылок?'],['👩🏿‍⚖️','Ава','С бутылок, багета и одного очень важного номерка. Добро пожаловать во Францию.']]],
  ['f_roof','☕','Инес','Крыша с видом на Париж',
   'В кафе знают, где найти ночлег и первую подработку. Здесь тоже начинают с малого — только голуби ходят увереннее.',
   [qv(()=>S.housing,1,'Обзавестись палаткой или жильём лучше'),qc('shift',1,'Закончить 1 рабочую смену')],45,
   [['☕','Инес','В нашем квартале сначала говорят «бонжур», потом просят пароль от вай-фая.'],['🧳','Валера','А если мне сначала поспать?'],['☕','Инес','Палатка у канала стоит дешевле круассана в туристическом кафе. Работу ищи в разделе «Деньги».']]],
  ['f_language','🧑‍🏫','Месье Лоран','Сначала — «бонжур»',
   'Без языка любая справка превращается в квест. Учи полезные слова с открытой шпаргалкой, а не угадывай вслепую.',
   [qv(()=>S.edu,1,'Закончить курс французского для новой жизни')],60,
   [['🧑‍🏫','Лоран','Grève — забастовка. Sortie — выход. Во Франции оба слова пригодятся одновременно.'],['🧳','Валера','А слово «открыто»?'],['🧑‍🏫','Лоран','Его изучим после обеда. У нас перерыв.']]],
  ['f_bakery','👨🏾‍🍳','Жюль','Багет без предварительной записи',
   'Жюль кормит весь квартал. Несколько честных смен дадут деньги и познакомят с людьми, которым можно доверять.',
   [qc('shift',2,'Закончить 2 смены на любой работе'),qc('eat',1,'Поесть в местной лавке')],75,
   [['👨🏾‍🍳','Жюль','Корочка должна хрустеть так, чтобы соседи проснулись с уважением.'],['🧳','Валера','Мне раньше платили за тишину.'],['👨🏾‍🍳','Жюль','Теперь платят за результат. С нулём очков — ноль денег. Круассаны жалости не знают.']]],
  ['f_neighbors','🧔🏿','Ибрагим','У канала все свои',
   'Ибрагим вырос в Бельвиле и когда-то ходил с «Воронами». Сейчас он держит веломастерскую. Малик по-прежнему требует деньги с соседей.',
   [FR_Q('frHelp',1,'Помочь соседской кухне в разделе «Париж»')],90,
   [['🧔🏿','Ибрагим','Зови Ибра. Я знаю, что такое плохая компания. Малик решил, что весь квартал ему должен.'],['🧳','Валера','Мне уже предъявляли за целый мексиканский штат.'],['🧔🏿','Ибрагим','Здесь за людей вступаются люди. Начни с кухни для соседей — там познакомишься с Камиль.']]],
  ['f_march','🪧','Камиль','Бастилия выходит на улицу',
   'Закрывают общественную кухню под новый офис фирмы Дюваля. Камиль собирает митинг; «Вороны» хотят превратить его в дебош ради чужого заказа.',
   [FR_Q('frMarch',1,'Принять участие в митинге на Бастилии')],100,
   [['🪧','Камиль','У нас плакаты, мегафон и профсоюзный барабан. Твоя задача — держать ритм.'],['🧑🏿‍🦱','Малик «Ворон»','А у меня заказ сделать так, чтобы квартал выглядел опасным. Бизнес, Валера.'],['🧳','Валера','Опять кому-то выгодно, чтобы обычные люди стали виноватыми. Знакомая история.']]],
  ['f_pressure','👩🏿‍⚖️','Ава','Справка о наличии справки',
   'Бюро потеряло часть обращений жителей. Получи подтверждение и продолжай работать: Барон уверен, что у тебя быстро закончатся деньги.',
   [FR_Q('frBureau',1,'Получить копию обращения в бюро'),qc('shift',2,'Закончить 2 рабочие смены')],120,
   [['📑','Месье Бернар','Чтобы доказать, что справка потеряна, нужна справка о том, что она существовала.'],['👩🏿‍⚖️','Ава','Статья 404 его воображаемого регламента. Мы подадим электронную копию.'],['🧳','Валера','Вот бы кто-нибудь придумал удобный мессенджер…']]],
  ['f_papers','🧔🏿','Ибрагим','Письмо от Пепе',
   'Пепе нашёл ещё одну квитанцию. Вместе с французскими бумагами она связывает картель и фирму Дюваля. Теперь нужно понимать не только меню.',
   [FR_Q('frBureau',1,'Сверить квитанцию в бюро'),qc('lesson',2,'Пройти 2 занятия в разделе «Учёба»')],140,
   [['🎸','Пепе по видеосвязи','Compadre! На квитанции тот же знак, что на ящиках Скорпионов. И странное слово: «Пари»!'],['🧔🏿','Ибрагим','Paris. Они возили не только сувениры. Я видел этот знак на фургонах Малика.'],['🧳','Валера','Значит, из Мексики я не сбежал от истории. Я приехал к её началу.']]],
  ['f_business','👨🏾‍🍳','Жюль','Своё дело, свои правила',
   'Кварталу нужны настоящие рабочие места. Открой небольшой бизнес: крепы, багеты, мастерскую или кафе. Любой честный старт подходит.',
   [qv(()=>Object.keys(S.biz||{}).length,1,'Открыть 1 местный бизнес')],180,
   [['👨🏾‍🍳','Жюль','Бизнес — когда тебе платят за багет, а не за то, что чужая лавка закрылась.'],['🧳','Валера','Я назову её «У Валеры». Международная сеть пока из одной тележки.'],['☕','Инес','Соседи уже готовы стать первыми клиентами.']]],
  ['f_rooftop','🎨','Жюльетта','Маршрут над крышами',
   'Художница заметила, где встречаются люди Барона. Поселись под крышей и доставь её письмо через бастующее метро.',
   [qv(()=>S.housing,3,'Поселиться в мансарде или жилье лучше'),FR_Q('frMetro',1,'Доставить письмо через метро')],220,
   [['🎨','Жюльетта','На Монмартре все смотрят на закат. Я смотрю на то, кто снимает наличные внизу.'],['🧳','Валера','Художник должен видеть необычное?'],['🎨','Жюльетта','Особенно если необычное каждый четверг носит одинаковые чемоданы.']]],
  ['f_malik','🧑🏿‍🦱','Малик «Ворон»','Квартал — не твоя касса',
   'Малик требует выдать свидетелей. Ибра больше не будет молчать. Помоги соседям и выиграй личный поединок с лидером «Воронов».',
   [FR_Q('frHelp',1,'Помочь соседям подготовиться к встрече')],260,
   [['🧑🏿‍🦱','Малик «Ворон»','Ты мог просто работать на меня. Теперь весь двор против.'],['🧔🏿','Ибрагим','Двор против тебя, Малик. Я знаю твои уловки и больше за тебя не отвечаю.'],['🧳','Валера','Разговор закончим без случайных прохожих. Один на один.']]],
  ['f_hearing','🪧','Камиль','Город слышит свой квартал',
   'После поединка жители готовы говорить открыто. Собери заверенные обращения и помоги провести районные слушания.',
   [FR_Q('frBureau',2,'Собрать 2 заверенных обращения'),FR_Q('frMarch',1,'Поддержать выступление жителей')],300,
   [['🪧','Камиль','Мы пришли не кричать вместо доказательств. Мы пришли, чтобы доказательства услышали.'],['👩🏿‍⚖️','Ава','Свидетели, квитанции и подписи. Даже Бернар поставил правильные печати.'],['📑','Бернар','Прошу не портить мне репутацию столь невероятными слухами.']]],
  ['f_archive','☕','Инес','Почерк телефонного «майора»',
   'В архиве Дюваля найдены те же фразы, которыми обманывали бабушку Нину. Восстанови условные сигналы архива и передай копию Аве.',
   [FR_Q('frSignal',1,'Открыть архив бумажного голубя'),FR_Q('frMetro',1,'Передать копию через метро')],400,
   [['☕','Инес','«Ваш счёт под угрозой». На каждом языке одна и та же ложь.'],['🧳','Валера','В Москве меня сделали виноватым, в Мексике пытались заставить молчать. Больше не выйдет.'],['👩🏿‍⚖️','Ава','Теперь у нас вся цепочка: обман, деньги, исполнители и заказчик.']]],
  ['f_duval','🎩','Барон Дюваль','Барон без прикрытия',
   'Дюваль зовёт на закрытый приём, надеясь запугать свидетеля. Квартал прикрывает тебя, Ава передаёт материалы. Остался последний поединок.',
   [qv(()=>S.health,50,'Подлечиться до 50 здоровья перед встречей')],600,
   [['🎩','Дюваль','У тебя были пальмы, вилла и целая новая жизнь. Зачем ты полез в мои бумаги?'],['🧳','Валера','Потому что бабушка Нина могла остаться без своей.'],['👩🏿‍⚖️','Ава','И потому что за каждой твоей «сделкой» живые люди. Документы уже переданы.']]],
  ['f_home','🇫🇷','Квартал Сен-Мартен','Париж становится домом',
   'Сеть Дюваля раскрыта, свидетели под защитой. Обустрой квартиру и помоги соседям ещё раз — уже без побега на горизонте.',
   [qv(()=>S.housing,4,'Обустроить квартиру в Бельвиле или жильё лучше'),FR_Q('frHelp',1,'Устроить соседский ужин')],800,
   [['👵','Бабушка Нина в письме','Валерочка, открытка с башней пришла. Береги себя. И кушай суп, не одни булки.'],['🎸','Пепе','Compadre, французский багет в тако помещается? Мы уже вылетаем в гости!'],['🧳','Валера','От скамейки до своего дома. Четыре города. Теперь есть куда возвращаться.']]],
];
const FR_EPISODES=[
 ['Кофе у стойки','Инес оставила тебе последнее место у окна.','Уступить соседке','Зарисовать вид из окна','Соседка рассказала историю квартала.','В блокноте появился первый парижский набросок.'],
 ['Багет на двоих','У Жюля осталась тёплая выпечка после закрытия.','Раздать соседям','Помочь составить список заказов','Вечер у канала стал чуть теплее.','Завтра очередь будет короче.'],
 ['Дождь на Монмартре','Ливень застал уличного художника врасплох.','Подержать зонт','Найти сухой угол для картин','Портрет спасён, художник улыбается.','Картины перенесли в соседнее кафе.'],
 ['Метро бастует','На остановке спорят, как добраться домой.','Показать соседям пеший путь','Нарисовать схему пересадок','До дома дошли вместе.','Понятная схема помогла всему двору.'],
 ['Сыр с характером','В лавке предлагают попробовать особенно пахучий сыр.','Угостить смельчаков','Записать смешное название','Соседи хохотали громче запаха.','В твоём французском словаре стало на слово больше.'],
];
QUESTS.push({id:'x_to_france',city:'mex',frMove:true,who:'👩🏿‍⚖️',name:'Ава из Парижа',title:'След ведёт во Францию',text:'Рамирес предупредила: остатки Скорпионов ищут свидетеля. Ава нашла французские счета «Ла Пальмы» и готова принять тебя в Париже. Не просто новый побег — шанс закрыть всю историю.',goals:[],reward:{}});
frQuestData.forEach((d,i)=>{
  const [id,who,name,title,text,goals,money,lines]=d;
  const q={id,city:'fr',who,name,title,text,goals,reward:{money:eur(money),xp:400+i*100,...(i===14?{caps:5}:{})},frLines:lines,episode:FR_EPISODES[i%FR_EPISODES.length],help:'Нажми на незавершённую цель. Городские занятия находятся в «Досуг → Париж». Новые работы и бизнесы — в разделе «Деньги».'};
  const route=id==='f_language'?['life','study','Учёба']:id==='f_business'?['life','business','Бизнес']:id==='f_duval'?['life','health','Здоровье']:['shop','housing','Жильё'];
  q.goals.filter(g=>!g.key).forEach(g=>g.frRoute=[route[0],route[1],'.screen.active',route[2]]);
  if(id==='f_malik')q.boss={name:'Малик «Ворон»',style:'rush',eq:{hat:'kepka',body:'pukhovik',shoes:'kedy'},lvl:1,form:58,strength:52,tier:5,intro:'«На этот раз без моей команды. Давай, Валера»'};
  if(id==='f_duval')q.boss={name:'Барон Дюваль',style:'tactic',eq:{hat:'cilinder',body:'kostum',shoes:'boots'},lvl:2,form:65,strength:60,tier:6,intro:'«Я сам когда-то начинал с малого. Только совесть оставил раньше»'};
  QUESTS.push(q);
});
for(const e of Object.values(FR_TOWN))GO_KEYS[e.key]=['fun','paris','.fr-actions','Париж · занятия квартала'];
goalTarget=(function(orig){return g=>g.frRoute|| (g.frTown?['fun','paris','.fr-actions','Париж · занятия квартала']:orig(g));})(goalTarget);
const frStoryBefore=EXTRA_TABS.tasks.story;
EXTRA_TABS.tasks.story=()=>{
  let html=frStoryBefore();const q=currentQuest();
  if(q?.frMove)html=html.replace(/<button class="btn[^"]*" data-act="questDone"[^>]*>[^<]*<\/button>/,'<button class="btn primary wide" data-act="frStart">🇫🇷 Отправиться во Францию</button>').replace(/<div class="q-reward">[\s\S]*?<\/div>/,'<div class="q-reward">🇫🇷 IV глава: Париж, евро, новые занятия и продолжение истории</div>');
  if(!isFrance())return html;
  if(q?.frLines)html=`<section class="fr-story"><small>🇫🇷 IV глава · ${q.title}</small>${q.frLines.map(([e,n,t])=>`<div class="fr-line"><span>${e}</span><p><b>${n}</b>${t}</p></div>`).join('')}</section>`+html;
  if(!q)html=html.replace('История Валеры окончена','Париж стал твоим домом').replace('Эдик повержен, Барсик дома. Хочешь пройти историю другим путём? Начни новый круг в «Престиже».','Дюваль разоблачён, квартал отстояли. Развивай дом и бизнес, участвуй в жизни банды и загляни к бумажному голубю в разделе «Париж». Новый круг доступен в «Престиже».');
  return html;
};
ACTIONS.questDone=(function(orig){return()=>currentQuest()?.frMove?frStartModal():orig();})(ACTIONS.questDone);
function frCanMove(){return city()==='mex'&&!!currentQuest()?.frMove&&!S.busy&&!MG;}
CUTS.move_fr=[
  {bg:'night',actors:[{a:'valera',x:36,mood:'ok'},{a:'👮🏽‍♀️',x:70,say:'Нашли французский след'}],props:[{e:'📂',x:54,y:45}],text:'Веракрус. После закрытия колл-центра Рамирес приносит последнюю папку Скорпионов.'},
  {bg:3,actors:[{a:'valera',x:35,mood:'sad'},{a:'👵',x:72,say:'Деньги вернулись, сынок'}],props:[{e:'📱',x:54,y:40}],text:'Когда-то мошенники заставили Валеру забрать сбережения бабушки Нины. Спасаясь от обвинений, он бежал из Москвабада в Мексику.'},
  {bg:'red',actors:[{a:'🦂',x:30},{a:'🎩',x:74}],props:[{e:'💸',x:51,y:35,anim:'float'}],text:'Мексиканская «Ла Пальма» получала деньги от французской фирмы. Над колл-центром стояла целая сеть.'},
  {bg:'night',actors:[{a:'👮🏽‍♀️',x:34,say:'Свидетель должен остаться жив'},{a:'valera',x:70,mood:'ok'}],text:'Остатки картеля ищут Валеру. Рамирес организует отъезд; парижская юристка Ава готова принять свидетеля и материалы.'},
  {bg:'gold',actors:[{a:'✈️',x:50,anim:'drive'}],props:[{e:'🌵',x:14,y:62},{e:'🇫🇷',x:84,y:35,anim:'float'}],text:'Веракрус — Мехико — Париж. Семья рядом. Крышки, достижения и купленная косметика отправляются вместе с Валерой.'},
  {bg:'night',actors:[{a:'valera',x:34,mood:'happy',say:'Бонжур…'},{a:'👩🏿‍⚖️',x:72,say:'Сначала возьмём номерок'}],props:[{e:'🥖',x:52,y:54},{e:'🕊️',x:83,y:14}],text:'Париж после дождя. Аккордеон, запах багета, огни на Сене. Четвёртая глава начинается с очереди в бюро №404.'},
];
CUT_TITLES.move_fr='🇫🇷 IV глава · Из Веракруса в Париж';
function frStartModal(){
  if(!frCanMove()){toast('Переезд откроется после всей мексиканской истории. Заверши текущую активность.','bad');return;}
  const total=Math.max(0,S.money)+(S.frozen?.city==='mex'?Math.max(0,S.frozen.left||0):0),start=Math.min(total,NEW_CITY_CASH.fr),frozen=total-start;
  openModal(`<h3>🇫🇷 IV глава · След ведёт в Париж</h3><p>Колл-центр в Мексике закрыт, но его заказчик во Франции. Пока остатки картеля ищут свидетеля, Рамирес помогает уехать, а юристка Ава ждёт в Париже.</p>
    <div class="move-box keep"><b>Сохраняется</b>Все крышки, VIP и усилители, уровень, сила, навыки, престиж, достижения, коллекции, купленная косметика и бутылка, уникальная одежда и премиум-питомцы. Семья едет с тобой. Друзья и банда сохраняются.</div>
    <div class="move-box lose"><b>Новая жизнь с низов</b>Мексиканское жильё, бизнесы и клуб, обычная одежда и питомцы, транспорт, дипломы, работа и обычный инвентарь останутся в Мексике. Новые местные вещи придётся заработать заново.</div>
    <div class="move-box fam"><b>Деньги не исчезнут</b>${cityMoney(total,'mex')} превратятся в ${cityMoney(total,'fr')} по игровому обмену без дополнительного штрафа. На руках: <b>${cityMoney(start,'fr')}</b>. ${frozen>0?`Остальные <b>${cityMoney(frozen,'fr')}</b> проверяет бюро; каждая из 15 глав вернёт 7%, к концу истории вернут всё.`:'Замораживать нечего.'} За первые задания можно взяться даже без денег.</div>
    <p>Это переезд в следующую главу, а не престиж. Вернуться в прежнее жильё нельзя.</p><button class="btn primary wide" id="frMoveConfirm" data-act="frGo">Понимаю условия · Во Францию</button><button class="btn wide" data-act="close">Остаться в Мексике</button>`,{center:true});
}
function doMoveFrance(){
  if(!frCanMove())return false;
  const base={hat:'none',body:'rvan',shoes:'none'},owned={},eq={};
  for(const slot of Object.keys(base)){owned[slot]=[...new Set([base[slot],...(S.owned[slot]||[]).filter(id=>moveKeepsItem(slot,id))])];eq[slot]=owned[slot].includes(S.eq[slot])?S.eq[slot]:base[slot];}
  const pets=(S.pets||[]).filter(id=>PETS.find(p=>p.id===id)?.premium),petNames=Object.fromEntries(pets.filter(id=>S.petNames?.[id]).map(id=>[id,S.petNames[id]]));
  const money=Math.max(0,S.money)+(S.frozen?.city==='mex'?Math.max(0,S.frozen.left||0):0),partner=S.girlfriend,keepGirl=partner?{[partner]:girlState(partner)}:{};
  if(typeof sideState==='function'){const st=sideState();SIDE.filter(q=>q.city==='mex').forEach(q=>delete st.active[q.id]);}
  Object.assign(S,{city:'fr',moves:(S.moves||0)+1,movedAt:Date.now(),money,frozen:null,owned,eq,pets,pet:pets.includes(S.pet)?S.pet:pets[0]||null,petNames,
    housing:0,ownedHousing:0,housingMode:'own',billDue:0,debt:0,missed:0,breakdowns:[],biz:{},club:null,transport:0,fuel:100,transportBroken:false,garages:[],
    jobs:{},jobPos:{},hired:{},edu:0,study:null,busy:null,shelter:[],inv:{},bottles:0,wanted:0,girls:keepGirl,gfDates:0,france:{cd:{},egg:0},
    health:Math.max(S.health,70),energy:100,food:90,mood:Math.max(S.mood,60),chapterIntro:null,
    quest:{idx:0,path:S.quest.path,base:{...(S.counters||{})},bossCd:0,v2:true}});
  applyCity('fr');applyNewcomer('fr');track('cityMove');track('frMove');save();renderedHousing=-1;renderedLook='';
  FR_PIGEON_TAPS=0;
  if(typeof topSubmit==='function'&&onlineOn())topSubmit().catch(()=>{});
  confetti(100);sfx('levelup');refresh();syncMusic();
  resultModal({emoji:'🇫🇷',title:'Бонжур, Париж!',text:'Сена, мансарды, кофе и аккордеон. Ава уже заняла очередь в бюро №404.<br><br>Начни с сюжета в «Целях». Занятия квартала и секреты находятся в «Досуг → Париж». Все местные цены и доходы — в евро. Твои крышки, VIP, семья и банда с тобой.',btn:'Начинаю новую главу'});
  return true;
}

function frTownHTML(){
  if(!isFrance())return '<div class="info-card">Париж откроется в IV главе после Мексики.</div>';
  const s=frState(),done=ownsCosm('bt_fr_pigeon');
  return `<div class="fr-postcard">${frPostcardSVG()}<div><h2>Париж после дождя</h2><p>Saint-Martin · Сен-Мартен · IV глава</p></div></div><div class="info-card">Валера приехал из Мексики по следу заказчика мошенников. Здесь всё в евро, а разговор начинается с «бонжур».<br><button class="btn small" data-act="frGlossary">🇫🇷 Маленький словарь и правила</button></div>
    <div class="fr-actions">${Object.entries(FR_TOWN).map(([id,e])=>{const left=Math.max(0,(s.cd[id]||0)-Date.now());return `<button class="btn" data-act="frActivity" data-id="${id}" ${left?'disabled':''}><b>${e.name}</b><small>${e.energy} ⚡ · до ${cityMoney(frTownReward(e,e.target*1.25))}${left?` · отдых ${Math.ceil(left/1000)} с`:''}</small></button>`;}).join('')}</div>
    <div class="info-card">🪧 Мирный митинг — занятие квартала. Шумные вылазки «Воронов» находятся в криминале: там есть риск тюрьмы и потери денег. Это разные активности.</div>
    <section class="fr-secret"><button data-act="frPigeon" aria-label="Бумажный голубь на перилах">🕊️</button><small>${done?'Почтовый голубь доставил письмо. Коллекционная бутылка уже твоя.':s.secret?'Почтовый голубь принёс необычную записку.':'На перилах сидит бумажный голубь. На табличке: «Семь приветов — одно письмо».'}</small>${s.secret&&!done?`<h3>Почтовый голубь · ${s.egg}/3</h3><p>Необязательная вымышленная пасхалка: помоги Павлу Дурову выбраться из французского «Форта №404». Это альтернативная игровая история, а не сообщение о реальных событиях.</p><p>Три испытания: условные печати, сигнал голубя и маршрут письма. Нужно не меньше 80% результата. Каждая попытка стоит 6 энергии. Награда один раз: 10 крышек, достижение и бутылка «Почтовый голубь».</p><button class="btn primary wide" data-act="frEgg">${['Расшифровать записку','Передать сигнал','Помочь выбраться из форта'][s.egg]||'История завершена'}</button>`:''}</section>`;
}
EXTRA_TABS.fun.paris=frTownHTML;
BETA_HUBS.find(h=>h.id==='fun').groups.splice(1,0,['Париж · IV глава',[{s:'fun',t:'paris',act:'frTown',id:'frTown',e:'🇫🇷',n:'Париж · жизнь квартала',france:true,wide:1}]]);
betaTileShown=(function(orig){return x=>x.france?!isFrance()?false:orig(x):orig(x);})(betaTileShown);
let FR_PIGEON_TAPS=0;
// Update cooldowns in place so waiting on this screen never leaves an expired
// activity disabled. This also refreshes the estimate when personal boosts expire.
function frRefreshTown(){
  if(!isFrance()||currentScreen!=='fun'||TABS.fun!=='paris'||MG)return;const s=frState();
  document.querySelectorAll('#funList [data-act="frActivity"]').forEach(b=>{const e=FR_TOWN[b.dataset.id];if(!e)return;const left=Math.max(0,(s.cd[b.dataset.id]||0)-Date.now());b.disabled=left>0;const small=b.querySelector('small');if(small)small.textContent=`${e.energy} ⚡ · до ${cityMoney(frTownReward(e,e.target*1.25))}${left?` · отдых ${Math.ceil(left/1000)} с`:''}`;});
  const egg=document.querySelector('#funList [data-act="frEgg"]');if(egg){const left=Math.max(0,(s.cd.egg||0)-Date.now());egg.disabled=left>0;egg.title=left?'Повтор через '+Math.ceil(left/1000)+' с':'6 энергии за попытку';}
}
HOOKS.tick.push(frRefreshTown);
Object.assign(ACTIONS,{
  frStart:frStartModal,
  frGo:()=>{if($('frMoveConfirm')&&frCanMove()){closeModal();playCutscene('move_fr',()=>doMoveFrance());}},
  frTown:()=>showScreen('fun','paris'),
  frGlossary:()=>openModal('<h3>🇫🇷 Франция: бонжур и без паники</h3><p>Монмартр — холм и квартал художников; Бельвиль — живой многонациональный район; Сена — река Парижа; брассери — кафе с горячей кухней; креп — тонкий блин; петанк — игра с металлическими шарами; мансарда — комната под крышей.</p><p>'+FR_WORDS.map(([a,b])=>`${a} — ${b}`).join('; ')+'.</p><p>Занятия квартала не требуют денег. Энергия и время отдыха указаны на кнопке. За нулевой результат нет оплаты и прогресса. Правила мини-игр всегда показаны по-русски.</p><button class="btn primary wide" data-act="close">Бонжур, всё понятно</button>',{center:true}),
  frActivity:id=>{
    const e=FR_TOWN[id];if(!isFrance()||!e||S.busy||MG)return;const s=frState();
    if((s.cd[id]||0)>Date.now()){toast('Соседи ещё отдыхают. Попробуй чуть позже.','bad');return;}
    if(S.energy<e.energy){toast('Сначала восстанови энергию.','bad');return;}
    S.energy-=e.energy;s.cd[id]=Date.now()+e.cd*1000;save();
    runGame({title:'🇫🇷 '+e.name,hint:e.hint,duration:e.duration,setup:mg=>e.engine(mg),finish:score=>{
      if(!isFrance())return;const pay=frTownReward(e,score);
      if(score>0){addMoney(pay);addXp(Math.round(Math.min(score/e.target,1.25)*35));track(e.key);track('events');track('leisureGame');addMood(3);}
      save();resultModal({emoji:score>0?'🇫🇷':'☕',title:score>0?'Квартал благодарит':'В другой раз получится',text:score>0?`Результат: ${score}. Заработано ${cityMoney(pay)}. Городское задание засчитано.`:'За нулевой результат нет оплаты и прогресса. Подсказки показаны перед игрой.',btn:'В квартал'});refresh();
    }});
  },
  frPigeon:()=>{if(!isFrance())return;const s=frState();if(s.secret){toast('Записка уже у тебя.','good');return;}FR_PIGEON_TAPS++;if(FR_PIGEON_TAPS>=7){s.secret=true;save();sfx('quest');renderCurrent(false);}else toast('Голубь услышал привет. '+FR_PIGEON_TAPS+'/7');},
  frEgg:()=>{
    if(!isFrance()||MG||S.busy)return;const s=frState();if(!s.secret||s.egg>=3||ownsCosm('bt_fr_pigeon'))return;
    if((s.cd.egg||0)>Date.now()){toast('Голубь отдыхает ещё минуту.','bad');return;}
    if(S.energy<6){toast('Для испытания нужно 6 энергии.','bad');return;}
    const stage=s.egg,steps=[{engine:frForms,target:16,title:'Записка из Форта №404',hint:'На каждой условной карточке должны быть два штампа: синий круг и золотая звезда. Прими правильные, верни остальные.'},{engine:frMemory,target:3,title:'Сигнал бумажного голубя',hint:'Запомни и повтори три последовательности. Это условный шифр игровой пасхалки.'},{engine:frMetro,target:16,title:'Свободный голубь',hint:'Проведи письмо по вымышленным открытым маршрутам. Выбирай нужную станцию; закрытая линия не подходит.'}];const e=steps[stage];
    S.energy-=6;save();
    runGame({title:'🕊️ '+e.title,hint:e.hint,duration:stage===1?40:30,setup:mg=>e.engine(mg),finish:score=>{
      if(!isFrance()||s!==S.france||s.egg!==stage)return;
      const passed=score/e.target>=.8;if(!passed){s.cd.egg=Date.now()+60000;save();resultModal({emoji:'🕊️',title:'Голубь сбился с пути',text:`Нужно не меньше ${Math.ceil(e.target*.8)} очков, получилось ${score}. Пройденные этапы сохраняются. Повтори этот этап через минуту.`,btn:'Попробую ещё'});return;}
      s.egg++;if(s.egg===3&&!ownsCosm('bt_fr_pigeon')){giveCosm('bt_fr_pigeon');S.caps+=10;track('frDurovRescue');save();confetti(100);resultModal({emoji:'🕊️',title:'Почтовый голубь на свободе!',text:'В этой вымышленной истории Павел выбрался из «Форта №404» и исчез в парижском рассвете. «Спасибо, Валера. Сообщение доставлено».<br><br>Получено: 10 крышек и коллекционная бутылка «Почтовый голубь». Надень её в магазине бутылок. Повторной награды нет, косметика сохранится при престиже.',btn:'Сообщение прочитано'});}
      else{save();resultModal({emoji:'✉️',title:'Сигнал дошёл',text:`Этап ${s.egg}/3 пройден. Следующее испытание ждёт в разделе «Париж».`,btn:'Продолжим'});}refresh();
    }});
  },
});
HOOKS.track.push((key)=>{if(!isFrance())return;if(key==='questDone')track('frQuestDone');if(key==='crimeOk')track('frCrimeOk');});
ACHS.push(
  {id:'fr_move',name:'Бонжур, новая жизнь',emoji:'🇫🇷',key:'frMove',goals:[1],unit:'переезд во Францию'},
  {id:'fr_story',name:'Свой в Париже',emoji:'⚜️',key:'frQuestDone',goals:[3,8,15],unit:'глав во Франции'},
  {id:'fr_neighbors',name:'Квартал держится вместе',emoji:'🧺',key:'frHelp',goals:[1,10,50],unit:'помощи соседям'},
  {id:'fr_protest',name:'Голос Бастилии',emoji:'🪧',key:'frMarch',goals:[1,10,30],unit:'выступлений на площади'},
  {id:'fr_pigeon',name:'Сообщение доставлено',emoji:'🕊️',key:'frDurovRescue',goals:[1],unit:'секретное спасение'},
  {id:'fr_crime',name:'Тень на набережной',emoji:'🌃',key:'frCrimeOk',goals:[5,25,100],unit:'удачных дел во Франции'},
);
SIDE.push(
  {id:'f_side_jules',group:'pals',city:'fr',who:'👨🏾‍🍳',from:'Жюль',title:'Первые багеты для соседей',text:'Новая булочная помогает общественной кухне. Отработай две смены и зайди на соседский ужин.',goals:[sg('shift',2,'Закончить 2 смены'),sg('frHelp',1,'Помочь соседской кухне')],reward:{money:eur(45),xp:450,mood:8}},
  {id:'f_side_camille',group:'pals',city:'fr',who:'🪧',from:'Камиль',title:'Плакаты без чужого сценария',text:'Двор сам решит, что ему нужно. Поддержи митинг и разберись с обращениями жителей.',goals:[sg('frMarch',1,'Поддержать митинг'),sg('frBureau',1,'Заверить обращения в бюро')],reward:{money:eur(60),xp:550,mood:10}},
  {id:'f_side_ibra',group:'pals',city:'fr',who:'🧔🏿',from:'Ибрагим',title:'Велосипед вместо плохой компании',text:'Я вытащил себя из уличной банды. Хочу показать младшим, что заработать можно по-другому.',goals:[sg('shift',3,'Закончить 3 рабочие смены'),sg('frMetro',1,'Доставить письмо через метро')],reward:{money:eur(80),xp:600}},
  {id:'f_side_ines',group:'pals',city:'fr',who:'☕',from:'Инес',title:'Разговор за чашкой кофе',text:'Подтяни французский и помоги соседям — знакомства здесь ценнее визиток.',goals:[sg('lesson',2,'Пройти 2 занятия'),sg('frHelp',1,'Помочь соседям')],reward:{money:eur(50),xp:450,mood:10}},
);
