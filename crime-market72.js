// Quantities are saved as integer thousandths. Quotes use the shared server clock,
// never the device clock, and are valued in the game's common internal currency.
const CRIME_GOODS72 = [
  {id:'iron',city:'zas',name:'Чермет',emoji:'🔩',base:7250},
  {id:'brass',city:'zas',name:'Латунь',emoji:'🥉',base:11600},
  {id:'cable',city:'zas',name:'Кабель',emoji:'🔌',base:15950},
  {id:'copper',city:'zas',name:'Медь',emoji:'🟠',base:20300},
  {id:'trophies',city:'zas',name:'Уличные трофеи',emoji:'📦',base:10000},
  {id:'electronics',city:'msk',name:'Электронные компоненты',emoji:'💾',base:15000},
  {id:'access',city:'msk',name:'Ключи доступа',emoji:'🔐',base:40000},
  {id:'valuables',city:'msk',name:'Столичные ценности',emoji:'💎',base:25000},
  {id:'silver',city:'mex',name:'Мексиканское серебро',emoji:'🥈',base:30000},
  {id:'agave',city:'mex',name:'Агава',emoji:'🌵',base:20000},
  {id:'cargo',city:'mex',name:'Контрабандный груз',emoji:'📦',base:50000},
  {id:'antiques',city:'fr',name:'Антиквариат',emoji:'🏺',base:40000},
  {id:'wine',city:'fr',name:'Винтажное вино',emoji:'🍷',base:50000},
  {id:'replicas',city:'fr',name:'Реплики',emoji:'🖼️',base:20000}
];
function crimeStore72(){return S.crimeStock72||(S.crimeStock72={});}
function crimeQty72(n){return (n/1000).toLocaleString('ru-RU',{maximumFractionDigits:3});}
function crimeGood72(id){return CRIME_GOODS72.find(g=>g.id===id);}
function crimeGoodFor72(c,home=city()){
  const id=home==='zas'?'trophies':home==='msk'?(['m_scooter','m_carshare'].includes(c.id)?'electronics':c.id==='m_crypto'?'access':'valuables'):home==='mex'?(['x_pick','x_casino'].includes(c.id)?'silver':['x_tunnel','x_boat'].includes(c.id)?'agave':'cargo'):['f_pocket','f_gallery'].includes(c.id)?'antiques':c.id==='f_cargo'?'wine':'replicas';
  return crimeGood72(id);
}
function crimeLoot72(c,value,mg={},home=city()){
  if(!Number.isFinite(value)||value<=0)return [];
  const bonus=hasEffect('t_appraiser')?1.1+.025*(trickLvl('t_appraiser')-1):1;
  if(c.id==='metal'){
    const total=scrapTotal(mg);if(!total)return [];
    return SCRAP_TYPES.map((it,i)=>{const g=CRIME_GOODS72[i],share=(mg.scrap?.[it.e]||0)*(mg.scrapPrices?.[it.e]??scrapUnit(it))/total;return {g,n:Math.floor(value*share/g.base*1000*bonus)};}).filter(r=>r.n>0);
  }
  const g=crimeGoodFor72(c,home);return [{g,n:Math.max(1,Math.floor(value/g.base*1000*bonus))}];
}
function crimeAward72(c,value,mg,home){
  const rows=crimeLoot72(c,value,mg,home),stock=crimeStore72();
  for(const {g,n} of rows)stock[g.id]=(stock[g.id]||0)+n;
  track('crimeLoot72');
  return '<b>Добыча отправлена на склад</b><p>'+rows.map(({g,n})=>`${g.emoji} ${g.name}: +${crimeQty72(n)} ед.`).join('<br>')+'</p><p>Обменяй её на деньги в разделе криминала. Курс меняется раз в минуту. Бонус ранга и штрафы уже учтены.</p>';
}
function crimeMinute72(){const now=businessNow();return now===null?null:Math.floor(now/60000);}
function crimeRate72(g,minute=crimeMinute72()){
  if(minute===null)return null;
  const seed=[...g.id].reduce((a,ch)=>a*31+ch.charCodeAt(0),0)%10000;
  return Math.round(g.base*(1+.18*Math.sin(minute*.31+seed)+.07*Math.sin(minute*.113+seed*.7)));
}
let CRIME_QUOTE72=null,CRIME_MARKET_CITY72=null,CRIME_VIEW72='jobs';
function crimeMarket72(){
  const stock=crimeStore72(),home=CRIME_MARKET_CITY72||city(),minute=crimeMinute72();
  const available=Object.keys(CITIES).filter(c=>CITIES[c].idx<=CITIES[city()].idx||CRIME_GOODS72.some(g=>g.city===c&&stock[g.id]>0));
  const rates=CRIME_GOODS72.filter(g=>g.city===home);
  return `<section class="crime-market72"><h3>💱 Криминальный обменник</h3><p>Дела приносят товары, а не деньги. Котировки общие для всех игроков и меняются раз в минуту. Добычу можно хранить до выгодного курса. Полиция изымает только добычу неудачной попытки.</p><div class="market-tabs72">${available.map(c=>`<button class="btn small ${c===home?'primary':''}" data-act="crimeMarketCity72" data-id="${c}">${CITIES[c].name}</button>`).join('')}</div><small>Курс — за 1 ед. товара. При продаже применяются обычные удержания. Переезд не меняет склад и базовую стоимость добычи.</small>${minute===null?'<p>Синхронизация курса с сервером…</p>':''}${rates.map(g=>{
    const price=crimeRate72(g,minute),q=stock[g.id]||0;
    return `<article class="crime-good72"><b>${g.emoji} ${g.name}</b><p>На складе: ${crimeQty72(q)} ед.</p><div data-crime-rate72="${g.id}">${crimeRateHTML72(g,minute)}</div><button class="btn ${q&&price?'primary':''}" data-act="crimeQuote72" data-id="${g.id}" ${q&&price?'':'disabled'}>Обменять весь запас</button></article>`;
  }).join('')}<p id="crimeClock72">${crimeClockLabel72()}</p></section>`;
}
function crimeClockLabel72(){const now=businessNow();return now===null?'Синхронизация курса с сервером…':`До следующей котировки: ${60-Math.floor(now/1000)%60} сек.`;}
function crimeRateHTML72(g,minute){const price=crimeRate72(g,minute);if(price===null)return '—';const change=Math.round((price/g.base-1)*100);return `<b>${incomeMoney(price)}</b> · ${change>0?'+':''}${change}%<br><small>Базовый курс: ${incomeMoney(g.base)}</small>`;}
Object.assign(ACTIONS,{
  crimeView72:id=>{if(!['jobs','market'].includes(id))return;CRIME_VIEW72=id;refresh();},
  crimeMarketCity72:id=>{if(!CITIES[id]||!(CITIES[id].idx<=CITIES[city()].idx||CRIME_GOODS72.some(g=>g.city===id&&crimeStore72()[g.id]>0)))return;CRIME_MARKET_CITY72=id;refresh();},
  crimeQuote72:id=>{
    const g=crimeGood72(id),n=crimeStore72()[id],minute=crimeMinute72();CRIME_QUOTE72=null;
    if(!g||!Number.isSafeInteger(n)||n<=0||minute===null)return;
    const price=crimeRate72(g,minute),sum=Math.floor(n*price/1000);if(sum<1)return;
    CRIME_QUOTE72={id,n,minute,price,sum,city:city()};
    openModal(`<h3>Обмен добычи</h3><p>${g.emoji} ${g.name}: <b>${crimeQty72(n)} ед.</b></p><p>Курс: ${incomeMoney(price)} за 1 ед.<br>Сумма: <b>${incomeMoney(sum)}</b><br>После удержаний: <b>${incomeMoney(businessPocket(sum))}</b></p><p>Цена действительна до следующей минуты. Если курс изменится, запроси новую котировку.</p><div class="btns"><button class="btn primary" data-act="crimeSell72">Подтвердить обмен</button><button class="btn" data-act="crimeCancel72">Оставить на складе</button></div>`,{center:true});
  },
  crimeCancel72:()=>{CRIME_QUOTE72=null;closeModal();},
  crimeSell72:()=>{
    const q=CRIME_QUOTE72;CRIME_QUOTE72=null;
    if(!q)return;
    if(q.city!==city()||q.minute!==crimeMinute72()||crimeStore72()[q.id]!==q.n){toast('Котировка устарела. Запроси новую цену','bad');closeModal();refresh();return;}
    crimeStore72()[q.id]=0;const before=S.money;addMoney(q.sum);
    track('crimeSale72');if(q.price>=crimeGood72(q.id).base*1.1)track('crimeHighSale72');
    S.crimeSaleCities72=[...new Set([...(S.crimeSaleCities72||[]),crimeGood72(q.id).city])];
    save();closeModal();toast(`Обмен завершён: +${incomeMoney(S.money-before)}`,'good');refresh();
  }
});
HOOKS.hud.push(()=>{const minute=crimeMinute72();document.querySelectorAll('[data-crime-rate72]').forEach(el=>{const g=crimeGood72(el.dataset.crimeRate72);const html=crimeRateHTML72(g,minute);if(el.innerHTML!==html)el.innerHTML=html;const b=el.nextElementSibling;if(b)b.disabled=!crimeStore72()[g.id]||minute===null;});const clock=$('crimeClock72');if(clock)clock.textContent=crimeClockLabel72();});
const crimeTabBefore72=EXTRA_TABS.fun.crime;
EXTRA_TABS.fun.crime=()=>{
  if(!crimeOpen())return crimeTabBefore72();
  const old=crimeTabBefore72(),poker=old.indexOf('<div class="subhead">🃏');
  const tabs=`<div class="market-tabs72"><button class="btn ${CRIME_VIEW72==='jobs'?'primary':''}" data-act="crimeView72" data-id="jobs">Криминальные дела</button><button class="btn ${CRIME_VIEW72==='market'?'primary':''}" data-act="crimeView72" data-id="market">💱 Склад и обмен</button></div>`;
  if(CRIME_VIEW72==='market')return tabs+crimeMarket72();
  return tabs+crimeRankHTML()+'<div class="info-card">Добыча хранится на складе. Обменяй её на деньги во вкладке «Склад и обмен».</div><div class="subhead">Дела и добыча</div>'+CRIMES.map(c=>{const why=crimeCan(c),goods=c.id==='metal'?CRIME_GOODS72.slice(0,4):[crimeGoodFor72(c)];return card({thumb:c.emoji,title:c.name,desc:`${c.desc}<br><b>Добыча: ${goods.map(g=>g.name).join(' · ')}</b><br>${c.energy} ⚡ · риск ${Math.round(c.risk*100)}% · розыск +${c.wanted}`,extra:why?`<small>${esc(why)}</small>`:'',btn:`<button class="btn ${why?'':'primary'}" data-act="crime" data-id="${c.id}" ${why?'disabled':''}>На дело</button>`});}).join('')+(poker>=0?old.slice(poker).split('<section class="idea-panel">')[0]:'');
};
