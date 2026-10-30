// City identity, shorter story episodes and classic casino tables.
const CITY_IDENTITY = {
  zas: { name:'Засранск', tag:'Дворы, гаражи и свои люди', music:'waltz', casino:'Золотая крышка', color:'#d0a15b' },
  msk: { name:'Москвабад', tag:'Неон, метро и большие сделки', music:'metro', casino:'Сити Рояль', color:'#6bcfe4' },
  mex: { name:'Веракрус', tag:'Патио, фиеста и побережье', music:'mariachi', casino:'La Perla', color:'#edb16b' },
};
function cityIdentity(){return CITY_IDENTITY[city()]||CITY_IDENTITY.zas;}
HOOKS.hud.push(()=>{document.body.dataset.city=city();document.body.style.setProperty('--city-accent',cityIdentity().color);});
const originalHub = renderHub;
renderHub = function(){return `<div class="city-banner"><b>${cityIdentity().name}</b><small>${cityIdentity().tag}</small></div>`+originalHub();};
RENDER.hub[1]=renderHub;
// Separate motifs for story, city life and casino. Existing volume/mute settings still apply.
MAIN_MUSIC.push(['city','🌍 Музыка города']);
syncMusic = function(){
  if(typeof Sound==='undefined'||typeof S==='undefined'||!S.settings)return;
  if(S.settings.mainMusic==='off'){Sound.music(null);return;}
  const story=currentScreen==='tasks'&&TABS.tasks==='story';
  const casinoTrack={zas:'lounge',msk:'neon',mex:'cumbia'}[city()];
  const darkTrack={zas:'chip',msk:'neon',mex:'cumbia'}[city()];
  const chosen=S.settings.mainMusic;
  Sound.music(inCasino()?casinoTrack:story?(S.quest&&S.quest.path==='dark'?darkTrack:cityIdentity().music):(chosen&&chosen!=='city'?chosen:cityIdentity().music));
};
HOOKS.screen.push(syncMusic);
const RENEWAL_EPISODES = {
 zas:[
  ['Чужая сумка на остановке','Внутри — документы соседа и последние деньги на проезд.','Вернуть соседу','Отнести в бюро находок','Сосед вспомнит твою помощь.','Документы вернутся владельцу через диспетчера.'],
  ['Смена без бригадира','Рабочие спорят, кто возьмёт самую грязную часть заказа.','Взяться самому','Распределить работу поровну','Тебя уважают за инициативу.','Бригада сработалась без ссоры.'],
  ['Слово Шныря','Шнырь предлагает быстро продать находку. Михалыч советует сначала проверить её.','Проверить историю вещи','Поторговаться со Шнырём','Вещь оказалась редкой, спешить было незачем.','Ты сумел настоять на честной цене.'],
  ['Свет в гаражах','Перед важной встречей в гаражах выбило электричество.','Помочь с проводкой','Принести фонари','Встреча состоится при свете.','Соседи устроили вечер при фонарях.'],
 ],
 msk:[
  ['Последний поезд','В метро потерялся приезжий, а тебе пора на встречу.','Проводить до платформы','Найти дежурного','Ты успел помочь и пересесть на следующий поезд.','Дежурный отвёл человека к нужному поезду.'],
  ['Условие инвестора','За быстрые деньги инвестор просит забыть об обещании команде.','Остаться с командой','Пересогласовать договор','Команда продолжит дело с тобой.','Ты сохранил отношения и добился новых условий.'],
  ['Пропуск на верхний этаж','На ресепшене не видят твою фамилию в списке.','Позвонить организатору','Показать подтверждение','Организатор лично встретил тебя.','Охрана проверила письмо и пропустила.'],
  ['Ночная доставка','Клиент просит оставить посылку у двери без подписи.','Дождаться получателя','Договориться о новой встрече','Заказ передан лично.','Ты избежал спора о пропавшей посылке.'],
 ],
 mex:[
  ['Фиеста без музыки','У мариачи сломалась стойка, площадь ждёт начала праздника.','Помочь собрать сцену','Позвать соседей','Праздник начинается с твоей помощью.','Соседи быстро нашли нужные инструменты.'],
  ['Письмо из дома','На рынке тебе передали письмо для пожилой сеньоры.','Отнести лично','Найти её родственников','Сеньора пригласила тебя на чай.','Семья передала письмо в тот же вечер.'],
  ['Сделка у причала','Покупатель просит продать весь товар по сомнительной расписке.','Потребовать оплату','Предложить небольшую пробную партию','Договорились об оплате на месте.','Ты проверишь покупателя без большого риска.'],
  ['После тропического ливня','Соседский прилавок залило водой перед открытием.','Помочь спасти продукты','Починить навес','Торговцы успели перенести товар.','Новый навес выдержит следующий дождь.'],
 ],
};
const LIMITS={shift:3,fightWin:3,marketSold:3,date:2,events:2,gym:2,eat:2,crimeOk:3,promotion:1,lesson:3};
QUESTS.forEach((q,index)=>{
  if(q.choice||q.move)return;
  for(const g of q.goals){
    if(g.key&&LIMITS[g.key]&&g.need>LIMITS[g.key]&&g.cur.toString().includes('counter')){
      const old=g.need;g.need=LIMITS[g.key];g.text=g.text.replace(new RegExp(`\\b${old}\\b`),String(g.need));
    }
    if(/живых игроков|живых игрок|онлайн/i.test(g.text)){
      g.need=3;g.text='Выиграй 3 боя с соперниками (можно с ботами)';g.key='fightWin';g.cur=()=>Math.max(0,counter('fightWin')-((S.quest.base||{}).fightWin||0));
    }
  }
  const pool=RENEWAL_EPISODES[q.city||'zas'];q.episode=pool[index%pool.length];
  q.help=(q.help||'')+' Нажимай на незавершённую цель — игра покажет нужный раздел.';
});
function episodeKey(q){return `${S.prestige||0}:${city()}:${q.id}`;}
const storyTabBeforeRenewal=EXTRA_TABS.tasks.story;
EXTRA_TABS.tasks.story=()=>{
  const html=storyTabBeforeRenewal(),q=currentQuest();if(!q||!q.episode)return html;
  const [title,text,a,b,ra,rb]=q.episode, picked=(S.episodes||{})[episodeKey(q)];
  return `<div class="story-episode"><small>${cityIdentity().name} · эпизод главы</small><h3>${title}</h3><p>${text}</p>${picked?`<p class="green">${picked===1?ra:rb}</p>`:`<div class="row-btns"><button class="btn" data-act="episodeChoice" data-id="${q.id}:1">${a}<small>+5 радости</small></button><button class="btn" data-act="episodeChoice" data-id="${q.id}:2">${b}<small>+10 опыта</small></button></div>`}</div>`+html;
};
ACTIONS.episodeChoice=(id)=>{const q=currentQuest();if(!q||!q.episode)return;const [qid,choice]=id.split(':');if(qid!==q.id||!['1','2'].includes(choice))return;
  if(!S.episodes)S.episodes={};const key=episodeKey(q);if(S.episodes[key])return;S.episodes[key]=+choice;
  if(choice==='1')addMood(5);else addXp(10);sfx('notify');save();renderCurrent(false);
};
// Extra outside bets: standard columns and streets, with returns including the stake.
for(let c=0;c<3;c++)ROUL_BETS.push({id:`col${c}`,name:`Колонна ${c+1}`,x:3,win:n=>n>0&&(n-1)%3===c});
for(let c=0;c<12;c++)ROUL_BETS.push({id:`street${c}`,name:`${c*3+1}–${c*3+3}`,x:12,win:n=>n>=c*3+1&&n<=c*3+3});
const CASINO_RULES={slots:'Три независимых барабана. Выплаты указаны под автоматом; множитель включает возврат ставки. Пара ×1,4 возвращает ставку и ещё 40% (с округлением до целого). Предыдущие результаты не влияют на следующий.',
 bj:'Блекджек 3:2; обычная победа 1:1; ничья — возврат. Крупье стоит на любом 17. Можно удвоить первую ставку: после этого выдаётся ровно одна карта. Натуральный 21 крупье проверяется до решения игрока.',
 roulette:'Европейское колесо: 37 равновероятных чисел, одно зеро. Число ×36, улица ×12, дюжина/колонна ×3, простые шансы ×2. Множители включают возврат ставки. Зеро проигрывает на чёт/нечёт и цветах.',
 dice:'Два независимых шестигранных кубика. Таблица выплат показана на столе. Серия прошлых бросков не предсказывает следующий.',
 crash:'Общий серверный раунд. Забери ставку с множителем до взрыва. Автовывод задаётся заранее; после взрыва ставка теряется. Будущий взрыв не виден игроку.'};
for(const key of Object.keys(CASINO_RULES)){
 const old=ACTIONS[key];if(!old)continue;ACTIONS[key]=function(...args){old(...args);const box=document.querySelector('#modalRoot .sheet');if(box)box.insertAdjacentHTML('beforeend',`<details class="casino-rules"><summary>Правила и выплаты</summary><p>${CASINO_RULES[key]}</p></details>`);};
}
const casinoBeforeRenewal=EXTRA_TABS.fun.casino;
EXTRA_TABS.fun.casino=()=>`<div class="city-banner"><b>♠ ${cityIdentity().casino}</b><small>${cityIdentity().tag}</small></div>`+casinoBeforeRenewal().replace('★ ЗОЛОТАЯ КРЫШКА ★',`★ ${cityIdentity().casino.toUpperCase()} ★`)+`<div class="info-card">Игровой баланс: ${fmt(S.money)}. Ставка списывается до результата. Можно потерять всю поставленную сумму. У прошлых проигрышей нет «компенсации» в следующем раунде.</div>`;
// Baccarat: eight decks, natural 8/9, standard third-card tableau.
function baccaratRound(deck){
 const value=c=>c.r==='A'?1:['10','J','Q','K'].includes(c.r)?0:+c.r;
 const total=h=>h.reduce((s,c)=>s+value(c),0)%10;
 const p=[deck.pop()],b=[deck.pop()];p.push(deck.pop());b.push(deck.pop());
 if(total(p)<8&&total(b)<8){let third=null;if(total(p)<=5){const card=deck.pop();p.push(card);third=value(card);}
 const n=total(b),draw=third===null?n<=5:n<=2||(n===3&&third!==8)||(n===4&&third>=2&&third<=7)||(n===5&&third>=4&&third<=7)||(n===6&&(third===6||third===7));if(draw)b.push(deck.pop());}
 return {p,b,pv:total(p),bv:total(b),winner:total(p)>total(b)?'player':total(p)<total(b)?'banker':'tie'};
}
function baccaratReturn(choice,winner,bet){return winner==='tie'&&choice!=='tie'?bet:choice===winner?(choice==='banker'?bet+Math.floor(bet*95/100):bet*(choice==='tie'?9:2)):0;}
let BACCARAT_BUSY=false;
ACTIONS.baccarat=()=>openModal(`<h3>🃏 Баккара · ${cityIdentity().casino}</h3><p>Выбери сторону до раздачи. Игрок: чистый выигрыш 1:1. Банк: 0,95:1 после комиссии 5%. Ничья: 8:1. При ничьей ставки на игрока и банк возвращаются.</p><div id="baccaratTable" class="felt">Туз = 1; десятки и картинки = 0. Считается последняя цифра суммы. Добор карт автоматический.</div>${betPicker()}<div class="row-btns"><button class="btn" data-act="baccaratDeal" data-id="player">Игрок</button><button class="btn" data-act="baccaratDeal" data-id="banker">Банк</button><button class="btn" data-act="baccaratDeal" data-id="tie">Ничья</button></div>`,{center:true});
ACTIONS.baccaratDeal=async(choice)=>{
 if(BACCARAT_BUSY||!$('baccaratTable')||!['player','banker','tie'].includes(choice))return;
 const bet=Math.floor(S.bet);if(!Number.isFinite(bet)||bet<10||S.money<bet)return;
 BACCARAT_BUSY=true;S.money-=bet;track('casino');save();
 const round=baccaratRound(shuffle(Array.from({length:8},()=>newDeck()).flat()));
 const returned=baccaratReturn(choice,round.winner,bet);if(returned)addMoney(returned);
 const table=$('baccaratTable');if(table)table.innerHTML=`<b>Игрок: ${round.p.map(c=>c.r+c.s).join(' ')} — ${round.pv}</b><br><b>Банк: ${round.b.map(c=>c.r+c.s).join(' ')} — ${round.bv}</b><p>${{player:'Победа игрока',banker:'Победа банка',tie:'Ничья'}[round.winner]} · итог ${returned-bet>=0?'+':''}${fmt(returned-bet)}</p>`;
 sfx(returned>bet?'win':returned?'chip':'lose');save();updateHud();
 await new Promise(r=>setTimeout(r,800));BACCARAT_BUSY=false;
};
CASINO_GAMES.push({act:'baccarat',cls:'bj',emoji:'🃏',name:'Баккара',desc:'Игрок, банк или ничья. Автоматический добор по правилам стола'});
CASINO_KINDS.push(['baccarat','🃏','Баккара']);
const casinoKindBeforeRenewal=casinoKind;
casinoKind=()=>$('baccaratTable')?'baccarat':casinoKindBeforeRenewal();
function slotTheoreticalReturn(){const total=SLOT_SYMS.reduce((s,x)=>s+x[1],0);let rtp=0;
 for(const a of SLOT_SYMS)for(const b of SLOT_SYMS)for(const c of SLOT_SYMS){const pay=a[0]===b[0]&&b[0]===c[0]?a[2]:(a[0]===b[0]||b[0]===c[0]||a[0]===c[0])?SLOT_PAIR:0;rtp+=a[1]*b[1]*c[1]/total**3*pay;}return rtp;}
const openSlotsRules=ACTIONS.slots;
ACTIONS.slots=(...args)=>{openSlotsRules(...args);const box=document.querySelector('#modalRoot .sheet');if(box)box.insertAdjacentHTML('beforeend',`<p class="test-note">Шанс 777: 0,125% на спин, выплата ×100. Это в среднем один джекпот на 800 прокруток, без гарантии на конкретной серии.</p><p class="test-note">Теоретический возврат базового автомата: ${(slotTheoreticalReturn()*100).toFixed(1)}% на очень большой серии. Это не обещание возврата твоей ставки; отдельный спин может вернуть 0. Ночные бонусы считаются отдельно.</p>`);};
