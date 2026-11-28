// One board for real people. Money, inventory, displayed works and outstanding promises
// are read from the server. The browser keeps only the current section and open form.
const marketText547 = (ru,en) => I18N.lang === 'en' ? en : ru;
const MARKET_UI547 = { players:false, tab:'goods', boards:{market:null,loans:null}, readAt:{market:0,loans:0},
  reading:{market:false,loans:false}, errors:{market:'',loans:''}, sending:false, limit:8, friend:null, material:'all', intent:'all',fromBench:false };
const MARKET_ITEMS547 = { scrap:['Металлолом','Scrap metal'], copper:['Медный провод','Copper wire'] };
const MARKET_PATTERNS547 = {amber:['Янтарные ромбы','Amber diamonds'],wave:['Морская волна','Sea wave']};
const MARKET_KINDS547 = {buy:['Куплю','Wanted'],sell:['Продам','For sale'],barter:['Обмен другу','Friend swap'],
  commission:['Заказ мастеру','Commission'],group:['Сборный витраж','Group commission'],fair:['На ярмарку','Fair listing'],
  auction:['На аукцион','Auction'],craft:['Сделать витраж','Make a panel'],display:['Выставить в гараже','Display in garage'],
  offer:['Новая расписка','New IOU']};
const MARKET_ACTIONS547 = {take:['Принять','Accept'],bid:['Сделать ставку','Place bid'],contribute:['Внести стекло','Contribute glass'],
  cancel:['Снять заявку','Withdraw listing'],repay:['Вернуть часть','Repay'],accept:['Принять условия','Accept terms'],
  decline:['Отклонить','Decline'],extend:['Предложить продление','Propose extension'],approve:['Принять продление','Accept extension'],
  forgive:['Простить остаток','Forgive balance'],settle:['Рассчитаться залогом','Settle with collateral'],settings:['Приглашения','Invitations']};
function marketEsc547(value) {return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);}
function marketWord547(dict,key) {return Object.hasOwn(dict,key)?marketText547(...dict[key]):'';}
function marketNum547(value) {return Number.isFinite(+value)?Number(value).toLocaleString(I18N.lang==='en'?'en-US':'ru-RU',{maximumFractionDigits:2}):'—';}
function marketCash547(value) {return `${marketNum547(value)} ₽`;}
function marketNet547(price) {return Math.max(0,price-Math.ceil(price/20));}
function marketBtn547(label,action,id='',style='soft',disabled=false) {
  return `<button type="button" class="m547-btn m547-${style}" data-m547-action="${marketEsc547(action)}" data-m547-id="${marketEsc547(id)}"${disabled?' disabled':''}>${marketEsc547(label)}</button>`;
}
function marketTab547(key,ru,en) {
  const on=MARKET_UI547.tab===key;
  return `<button type="button" data-m547-action="tab" data-m547-id="${key}" aria-pressed="${on}" class="${on?'is-on':''}">${marketText547(ru,en)}</button>`;
}
function marketMoneyLine547(label,value) {return `<span>${marketEsc547(label)} <b>${marketEsc547(value)}</b></span>`;}
function marketEmpty547(text) {return `<p class="m547-empty">${marketEsc547(text)}</p>`;}
function marketScene547() {return currentScreen==='fun' && TABS.fun==='market';}
function marketIsOnline547() {return onlineOn();}
function marketArea547() {return MARKET_UI547.tab==='loans'?'loans':'market';}
function marketModeSwitch547() {
  const p=MARKET_UI547.players;
  return `<div class="m547-switch" data-i18n-ignore aria-label="${marketText547('Рынок','Market')}">
    <button type="button" data-m547-action="mode" data-m547-id="npc" aria-pressed="${!p}" class="${p?'':'is-on'}">${marketText547('Шнырь','Shnyr')}</button>
    <button type="button" data-m547-action="mode" data-m547-id="players" aria-pressed="${p}" class="${p?'is-on':''}">${marketText547('Игроки','Players')}</button></div>`;
}
function marketArtwork547(piece) {
  if (!piece || !Object.hasOwn(MARKET_PATTERNS547,piece.pattern)) return '';
  const colors=piece.pattern==='wave'?['#104b67','#42b4a9','#bdebd2','#6bcbdd']:['#6f3824','#e79938','#fff0a0','#c45435'];
  const motif=piece.pattern==='wave'
    ? `<path fill="${colors[1]}" d="M4 28Q18 9 33 24t27-1v23H4z"/><path fill="${colors[2]}" d="M4 35q15-17 30-4t26-4v12q-14 13-29 1T4 46z"/><path fill="${colors[3]}" d="m38 9 10-3 6 6-11 8z"/>`
    : `<path fill="${colors[1]}" d="m32 4 23 20-23 21L8 24z"/><path fill="${colors[2]}" d="m32 12 13 12-13 13-13-13z"/><path fill="${colors[3]}" d="m4 4 16 3L5 19zm55 25v16l-14-2z"/>`;
  return `<svg class="m547-art" viewBox="0 0 64 50" role="img" aria-label="${marketWord547(MARKET_PATTERNS547,piece.pattern)}"><rect x="2" y="2" width="60" height="46" rx="5" fill="${colors[0]}" stroke="#302c28" stroke-width="3"/><g stroke="#39362b" stroke-width="1.6" stroke-linejoin="round">${motif}</g><path d="m7 10 6-3m37 33 6-3" fill="none" stroke="#fff8d8" stroke-width="2" stroke-linecap="round"/></svg>`;
}
function marketVisitHTML547(pid,display,name='') {
  const art=display?.art;
  const garage=typeof garageVisit547==='function' && display?.garage?garageVisit547(display.garage):'';
  const direct=marketBtn547(marketText547('Предложить сделку','Propose a trade'),'friend',pid);
  const maker=art?.makerPid?marketBtn547(marketText547('Заказать мастеру','Commission this maker'),'toMaker',art.makerPid):'';
  let item='';
  if (art && marketArtwork547(art)) {
    const credits=(art.contributors||[]).map(c=>`${marketEsc547(c.name)} ×${marketNum547(c.panes)}`).join(', ');
    item=`<article class="m547-piece">${marketArtwork547(art)}<div><b>${marketWord547(MARKET_PATTERNS547,art.pattern)}</b><small>${marketText547('Мастер','Maker')} · ${marketEsc547(art.makerName)}</small>${credits?`<small>${marketText547('Вложили стекло','Contributors')} · ${credits}</small>`:''}${maker}</div></article>`;
  }
  return `<div class="m547-visit" data-i18n-ignore data-m547-friend="${marketEsc547(name)}">${garage}${item}${direct}</div>`;
}
function marketTime547(stamp) {
  if (!Number.isFinite(+stamp) || !(+stamp>0)) return '—';
  return new Date(+stamp).toLocaleString(I18N.lang==='en'?'en-GB':'ru-RU',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
}
function marketHeading547(text,actions='') {return `<header class="m547-heading"><h3>${marketEsc547(text)}</h3>${actions}</header>`;}
function marketError547(code) {
 const messages={
  pending:['Предыдущее действие ещё не подтверждено. Повтори его с теми же условиями.','The previous action is still unconfirmed. Retry it with the same terms.'],
  wrong_realm:['Для сделки нужны одинаковые город и престиж у обоих игроков.','Both players need the same city and prestige for this trade.'],
  volunteer:['Заказ доступен гостю за подпись. Открой условия вклада и подтверди их.','Guests can contribute for credit. Open the contribution and confirm its terms.'],
  loan_era:['Для новой расписки нужны одинаковые город и престиж. Уже взятый долг можно погасить откуда угодно.','New IOUs require the same city and prestige. Existing debts can be repaid from anywhere.'],
  network:['Связь прервалась. Проверь соединение и повтори действие с теми же условиями.','Connection interrupted. Check your connection and retry with the same terms.'],
  offline:['Открой игру в Telegram для сделок.','Open the game in Telegram to trade.'], sync:['Идёт сохранение. Попробуй ещё раз.','Your game is syncing. Try again.'],
  stale:['Сделка изменилась. Обнови доску и проверь условия.','This trade changed. Refresh the board and check its terms.'],
  unavailable:['Нет связи с рынком. Проверь соединение. Если подтверждение не пришло, повтори действие с теми же условиями.','Market connection lost. Check your connection. If confirmation is missing, retry the same terms.'],invalid:['Проверь количество, цену и условия.','Check the quantity, price and terms.'],
  funds:['Недостаточно игровых рублей.','Not enough game rubles.'], stock:['Недостаточно предметов в сумке.','Not enough items in your bag.'],
  glass:['Недостаточно готового стекла.','Not enough finished glass.'], closed:['Предложение уже закрыто. Обнови список.','This offer is closed. Refresh the list.'],
  friends:['Для этой сделки нужна взаимная дружба.','You must be friends to make this offer.'], own:['Свои заявки нельзя исполнять.','You cannot fill your own order.'],
  limit:['Достигнут лимит активных сделок. Заверши одну из них.','Active trade limit reached. Finish a trade first.'],
  wrong_city:['Эта сделка доступна в Засранске.','This trade is available in Zasransk.'], bid:['Ставка уже изменилась. Проверь новую цену.','The bid changed. Check the new price.'],
  workshop:['Открой Стекольную артель для этой работы.','Unlock the Glassworks for this job.'], busy:['Дождись завершения сохранения или сделки.','Wait for the current save or trade.'],
  disabled:['Игрок отключил приглашения.','This player has turned off invitations.'], collateral:['Не хватает провода для залога.','Not enough wire for collateral.'],
  conflict:['Сначала закрой действующую расписку.','Close the current IOU first.'],pledge:['Проверь залог в сумке.','Check the collateral in your bag.'],
 };
 return marketWord547(messages,code)||marketText547('Действие не выполнено. Обнови список и проверь условия.','Action not completed. Refresh and check the terms.');
}
function marketOrder547(o) {
 const t=marketText547,goods=['buy','sell','barter'].includes(o.kind),mine=!!o.mine;
 const name=goods?marketWord547(MARKET_ITEMS547,o.item):marketWord547(MARKET_PATTERNS547,o.pattern);
 const title=goods?`${name} ×${marketNum547(o.qty)}`:name;
 const avatar=goods?`<span class="m547-item" aria-hidden="true">${o.item==='scrap'?'🔩':'🧵'}</span>`:marketArtwork547(o);
 const tag=marketWord547(MARKET_KINDS547,o.kind);
 const note=[];
 let act='',button='';
 const inTown=city()==='zas';
 if (o.kind==='barter') {
   note.push(marketMoneyLine547(t('Взамен','In exchange'),`${marketWord547(MARKET_ITEMS547,o.wantItem)} ×${marketNum547(o.wantQty)}`));
   if (o.forMe) {act='take';button=t('Обменяться','Swap');}
 } else if (o.kind==='buy'||o.kind==='sell') {
   note.push(marketMoneyLine547(t('Цена партии','Lot price'),marketCash547(o.price)));
   note.push(marketMoneyLine547(o.kind==='buy'?t('После комиссии за штуку','Net per item'):t('За штуку','Price each'),marketCash547((o.kind==='buy'?o.net:o.price)/o.qty)));
   note.push(marketMoneyLine547(t('Шнырь за всю партию','Shnyr for this lot'),marketCash547(itemPrice(o.item)*o.qty)));
   note.push(marketMoneyLine547(t('После комиссии','After fee'),marketCash547(o.net)));
   act='take'; button=o.kind==='buy'?t('Продать','Sell')+' · '+marketCash547(o.net):t('Купить','Buy')+' · '+marketCash547(o.price);
 } else if (o.kind==='group') {
   note.push(marketMoneyLine547(t('Собрано стёкол','Panes delivered'),`${o.raised} / ${o.currentGoal||4}`));
   note.push(marketMoneyLine547(t('Бюджет','Budget'),marketCash547(o.price)));
   if(o.openGuests&&!o.volunteerOnly) note.push(marketMoneyLine547(t('Гости','Guest makers'),t('Можно помочь за подпись','May volunteer for credit')));
   act='contribute';button=o.volunteerOnly?t('Помочь за подпись','Help for credit'):t('Внести стекло','Contribute glass');
   if(o.volunteerOnly) note.push(marketMoneyLine547(t('Из другого города или круга','Outside this city or prestige'),t('Только подпись','Credit only')));
 } else if (o.kind==='auction') {
   note.push(marketMoneyLine547(o.bid?t('Текущая ставка','Current bid'):t('Старт','Starting bid'),marketCash547(o.bid||o.price)));
   if(o.bidMine) note.push(marketMoneyLine547(t('Лидирует','Highest bidder'),t('твоя ставка','you')));
   act='bid';button=t('Сделать ставку','Place bid');
 } else if (o.kind==='commission') {
   note.push(marketMoneyLine547(t('Понадобится','Materials'),t('4 стекла','4 panes')));
   note.push(marketMoneyLine547(t('Мастеру','Maker gets'),marketCash547(o.net))); act='take';button=t('Выполнить заказ','Fill commission');
 } else if (o.kind==='fair') {
   note.push(marketMoneyLine547(t('Цена','Price'),marketCash547(o.price))); act='take';button=t('Купить витраж','Buy panel');
 }
 if(o.makerName) note.push(marketMoneyLine547(t('Мастер','Maker'),o.makerName));
 if(o.myContribution) note.push(marketMoneyLine547(t('Твой вклад','Your contribution'),String(o.myContribution)));
 const canAct=(!mine||o.kind==='group') && (!goods||inTown) && !!act && !(o.kind==='auction'&&(o.bidMine||o.bid>=10000));
 const cancel=mine && !(o.kind==='auction' && o.bid>0)?marketBtn547(t('Снять','Withdraw'),'cancel',o.id):'';
 return `<article class="m547-order"><div class="m547-row">${avatar}<div><small>${marketEsc547(tag)} · ${mine?t('Твоё','Yours'):marketEsc547(o.ownerName)}</small><strong>${marketEsc547(title)}</strong></div></div>
 <div class="m547-facts">${note.join('')}</div><small class="m547-till">${t('До','Until')} ${marketTime547(o.expiresAt)}</small>
 <div class="m547-tools">${canAct?marketBtn547(button,act,o.id,'primary',MARKET_UI547.sending):''}${cancel}</div></article>`;
}
function marketTerms547(l,confirming=false) {
 const t=marketText547,borrower=l.role==='borrower';
 const principal=confirming
   ? (borrower?t('Ты получишь','You receive'):t('Ты передашь','You lend'))
   : t('Сумма займа','Original loan');
 const collateral=confirming
   ? (borrower?t('Твой провод в залог','Wire held from your bag'):t('Провод друга в залог','Wire held from your friend'))
   : t('Залог проводом','Wire collateral');
 const terms=[
   marketMoneyLine547(principal,marketCash547(l.amount)),
   marketMoneyLine547(t('Срок','Term'),`${l.days} ${t('дн.','days')}`),
   marketMoneyLine547(t('Из чистых продаж','From net sales'),`${Number(l.share)||0}%`),
   marketMoneyLine547(collateral,`${Number(l.pledge)||0} ${t('шт.','pcs')}`)];
 if(l.status==='active' && l.pledge) terms.push(marketMoneyLine547(t('Сейчас в залоге','Currently held'),`${l.held} ${t('шт.','pcs')}`));
 if(l.status==='active' && l.creditorRemaining!=null && l.creditorRemaining!==l.remaining) terms.push(marketMoneyLine547(t('Кредитору после переезда','Lender receives after moving'),marketCash547(l.creditorRemaining)));
 return `<div class="m547-facts">${terms.join('')}</div>`;
}
const MARKET_LOAN_STATUS547={offered:['Предложение','Offer'],active:['Действует','Active'],paid:['Выплачено','Paid'],declined:['Отменено','Cancelled'],expired:['Срок предложения истёк','Offer expired'],forgiven:['Долг прощён','Forgiven'],settled:['Закрыто залогом','Settled with collateral']};
function marketLoanCard547(l) {
 const t=marketText547,owed=l.role==='borrower',offered=l.status==='offered',active=l.status==='active';
 const btn=(label,action,style='soft')=>marketBtn547(label,action,l.id,style);
 const actions=[];
 if(offered) {
   if(!l.mineProposal) actions.push(btn(t('Проверить и принять','Review & accept'),'accept','primary'));
   actions.push(btn(l.mineProposal?t('Отозвать','Withdraw'):t('Отклонить','Decline'),'decline'));
 }
 if(active) {
   if(owed) actions.push(btn(t('Погасить','Repay'),'repay','primary'));
   if(l.extensionDays>0&&!l.extensionMine) actions.push(btn(t('Принять продление','Accept extension'),'approve'));
   if(l.extensionDays>0) actions.push(btn(l.extensionMine?t('Отозвать продление','Withdraw extension'):t('Отклонить продление','Decline extension'),'decline'));
   if(!l.extensionDays&&!l.extended) actions.push(btn(t('Продлить срок','Extend term'),'extend'));
   if(l.held>0&&(owed||l.overdue)) actions.push(btn(owed?t('Отдать залог','Give collateral'):t('Забрать залог','Claim collateral'),'settle'));
   if(!owed) actions.push(btn(t('Простить остаток','Forgive balance'),'forgive'));
 }
 const role=active?(owed?t('Ты должен','You owe'):t('Тебе должны','Owed to you')):(owed?t('Беру в долг','Borrowing'):t('Даю в долг','Lending'));
 const balance=owed?l.remaining:(l.creditorRemaining??l.remaining);
 return `<article class="m547-order"><div class="m547-row"><div><small>${marketEsc547(l.otherName)} · ${l.overdue?t('Просрочено','Overdue'):marketWord547(MARKET_LOAN_STATUS547,l.status)}</small><strong>${role} · ${marketCash547(active?balance:l.amount)}</strong></div></div>
 ${marketTerms547(l)}${offered||active?`<small>${offered?t('Ответ до','Reply by'):t('Вернуть до','Due by')} ${marketTime547(offered?l.expiresAt:l.dueAt)}</small>`:''}
 ${active&&l.extensionDays?`<p>${t('Запрошено продление на','Extension requested for')} ${Number(l.extensionDays)} ${t('дн.','days')}</p>`:''}<div class="m547-tools">${actions.join('')}</div></article>`;
}
function marketHistory547(h) {
 const t=marketText547,actions={post:['Заявка размещена','Order posted'],take:['Сделка','Trade'],bid:['Ставка','Bid'],contribute:['Вклад в заказ','Contribution'],cancel:['Заявка снята','Withdrawn'],expire:['Срок истёк','Expired'],craft:['Витраж готов','Panel made'],display:['Витраж в гараже','Panel on display'],outbid:['Ставку перебили','Outbid'],won:['Аукцион завершён','Auction closed'],garage:['Гараж','Garage'],recipe:['Рецепт','Recipe']};
 const d=h.patch||{},amount=[];
 if(d.money) amount.push(`${d.money>0?'+':''}${marketCash547(d.money)}`);
 if(d.glass) amount.push(`${d.glass>0?'+':''}${marketNum547(d.glass)} ${t('стекло','glass')}`);
 for(const item of Object.keys(MARKET_ITEMS547)) if(d.inv?.[item]) amount.push(`${d.inv[item]>0?'+':''}${marketNum547(d.inv[item])} · ${marketWord547(MARKET_ITEMS547,item)}`);
 Object.assign(actions,{filled:['Заявка исполнена','Order filled'],paid:['Оплата вклада','Contribution paid'],sold:['Витраж продан','Panel sold'],withdrawn:['Резерв возвращён','Reserve returned'],returned:['Возврат','Returned'],cancelled:['Снято','Withdrawn'],expired:['Срок истёк','Expired']});
 if(!amount.length) {
   if(h.item&&h.qty) amount.push(`${marketWord547(MARKET_ITEMS547,h.item)} ×${marketNum547(h.qty)}`);
   if(h.action==='contribute') amount.push(`${marketNum547(h.qty)} ${t('стекла','panes')}`);
   const materialSale=['buy','sell'].includes(h.kind)&&['take','filled'].includes(h.action);
   if(materialSale) {
     amount.push(`${t('Цена партии','Lot price')} ${marketCash547(h.price)}`);
     const seller=(h.kind==='sell'&&h.action==='filled')||(h.kind==='buy'&&h.action==='take');
     if(seller) {
       const net=marketNet547(h.price);
       amount.push(`${t('Комиссия','Market fee')} ${marketCash547(h.price-net)}`);
       amount.push(`${t('После комиссии, до выплаты долга','After fee, before IOU repayments')} ${marketCash547(net)}`);
     }
   } else if(h.price>0) amount.push(`${h.action==='paid'?t('Выплата','Payout'):h.kind==='auction'?t('Ставка','Bid'):t('Сумма','Amount')} ${marketCash547(h.price)}`);
 }
 return `<li><div><b>${marketWord547(actions,h.action)||marketWord547(MARKET_KINDS547,h.kind)||t('Операция','Transaction')}</b><small>${marketTime547(h.at)}${h.counterparty?' · '+marketEsc547(h.counterparty):''}</small></div><span>${marketEsc547(amount.join(' · '))}</span></li>`;
}
function marketPiece547(p) {
 const t=marketText547;
 const credit=(p.contributors||[]).map(c=>`${marketEsc547(c.name)} ×${marketNum547(c.panes)}`).join(', ');
 return `<article class="m547-order" data-m547-piece="${Number(p.id)}" tabindex="-1"><div class="m547-row">${marketArtwork547(p)}<div><small>${t('Мастер','Maker')} · ${marketEsc547(p.makerName)}</small><strong>${marketWord547(MARKET_PATTERNS547,p.pattern)} <small>#${Number(p.id)}</small></strong></div></div><div class="m547-tools">
 ${credit?`<small>${t('Вложили стекло','Contributors')} · ${credit}</small>`:''}
 ${p.listed?`<small>${t('Выставлено на ярмарке','Listed at the fair')}</small>`:marketBtn547(p.displayed?t('В гараже ✓','On display ✓'):t('В гараж','Display'),'display',p.id,'soft',p.displayed)+(p.tradable===false?`<small>${p.souvenirReason==='guest'?t('Выставочная работа с вкладом гостей','Exhibition panel with guest signatures'):t('Сувенир из прошлого города или круга','Souvenir from a previous city or prestige')}</small>`:marketBtn547(t('Продать','Sell'),'fair',p.id)+marketBtn547(t('На аукцион','Auction'),'auction',p.id))}</div></article>`;
}
function marketStats547(stats) {
 const t=marketText547;
 if(!stats) return '';
 return `<details class="m547-fold m547-stats"><summary>${t('Цены и спрос за 7 дней','Prices & demand over 7 days')}</summary>${Object.keys(MARKET_ITEMS547).map(key=>{
   const s=stats[key]||{};
   return `<div><strong>${marketWord547(MARKET_ITEMS547,key)}</strong><p>${s.completed?`${t('Сделок','Trades')} ${marketNum547(s.completed)} · ${t('Продавцов','Sellers')} ${marketNum547(s.sellers)}<br>${t('Медиана за штуку','Median unit price')} ${marketCash547(s.medianUnit)} · ${t('До сделки','Time to fill')} ${marketNum547(s.minutesToFill)} ${t('мин','min')}`:t('Закрытых сделок пока нет.','No completed trades yet.')}</p></div>`;
 }).join('')}</details>`;
}
function marketList547(rows,render,empty) {
 const limit=MARKET_UI547.limit;
 return rows.length?`<div class="m547-list">${rows.slice(0,limit).map(render).join('')}</div>
 ${rows.length>limit?marketBtn547(marketText547('Показать ещё','Show more')+` (${rows.length-limit})`,'more'):''}`:marketEmpty547(empty);
}
function marketGoods547(orders,town) {
 const t=marketText547,u=MARKET_UI547;
 const filters=marketSelect547('material',t('Материал','Material'),[['all',t('Все материалы','All materials')],...marketChoice547(MARKET_ITEMS547)],u.material)+
   marketSelect547('intent',t('Показывать','Show'),[['all',t('Все заявки','All listings')],['buy',t('Хочу купить','I want to buy')],['sell',t('Хочу продать','I want to sell')]],u.intent);
 const filtered=orders.filter(o=>{
   if(!['buy','sell','barter'].includes(o.kind)) return false;
   if(u.material!=='all'&&o.item!==u.material&&!(o.kind==='barter'&&o.wantItem===u.material)) return false;
   if(u.intent==='all') return true;
   return !o.mine&&o.kind===(u.intent==='buy'?'sell':'buy');
 });
 let sorting='';
 if(u.intent==='buy') {
   filtered.sort((a,b)=>a.price/a.qty-b.price/b.qty);
   sorting=t('Сначала дешевле за штуку.','Lowest price per item first.');
 } else if(u.intent==='sell') {
   filtered.sort((a,b)=>b.net/b.qty-a.net/a.qty);
   sorting=t('Сначала больше выручка за штуку после комиссии.','Highest net price per item first.');
 }
 const filteredView=u.intent!=='all'||u.material!=='all';
 const actions=town?`<details class="m547-posting" data-fold="material-post"><summary class="m547-btn">${t('Разместить заявку','Post order')}</summary><div class="m547-tools">${marketBtn547(t('Выставить товар','List goods'),'new','sell')}${marketBtn547(t('Заказать сырьё','Request materials'),'new','buy')}${marketBtn547(t('Обмен с другом','Swap with friend'),'new','barter')}</div></details>`:'';
 const empty=filteredView?t('По этим условиям заявок нет.','No listings match these filters.'):t('Заявок пока нет.','No listings yet.');
 return marketHeading547(t('Доска сырья','Materials board'),actions)+(!town?`<p class="m547-note">${t('Купля, продажа и обмен сырья доступны в Засранске.','Visit Zasransk to trade or swap materials.')}</p>`:'')+
   `<div class="m547-filters">${filters}</div>`+(sorting?`<p class="m547-note">${sorting}</p>`:'')+marketList547(filtered,marketOrder547,empty);
}
function marketPanel547() {
 const t=marketText547,u=MARKET_UI547,area=marketArea547(),board=u.boards[area],town=city()==='zas';
 const nav=`<nav class="m547-tabs" aria-label="${t('Разделы рынка','Market sections')}">${marketTab547('goods','Сырьё','Materials')}${marketTab547('art','Витражи','Glass art')}${marketTab547('mine','Моё','My stall')}${marketTab547('loans','Расписки','IOUs')}</nav>`;
 let content='';
 const primary=(key,ru,en)=>marketBtn547(t(ru,en),'new',key,'primary');
 const option=(key,ru,en)=>marketBtn547(t(ru,en),'new',key);
 if(!marketIsOnline547()) content=marketEmpty547(marketError547('offline'));
 else if(!board) content=u.errors[area]?`<p role="alert">${marketError547(u.errors[area])}</p>${marketBtn547(t('Повторить','Retry'),'reload')}`:marketEmpty547(t('Загружаем предложения…','Loading offers…'));
 else if(area==='loans') {
   const loans=board.loans||[],active=loans.filter(l=>['active','offered'].includes(l.status)),closed=loans.filter(l=>!['active','offered'].includes(l.status));
   content=marketHeading547(t('Расписки с друзьями','IOUs with friends'),primary('offer','Предложить','New offer'))+`<p class="m547-note">${t('Игровые рубли, без процентов. Перевод — после согласия обоих.','Interest-free game rubles. Both friends must agree before funds move.')}</p>`+
   marketList547(active,marketLoanCard547,t('Открытых расписок нет.','No open IOUs.'))+
   `<details class="m547-fold"><summary>${t('Приглашения','Invitations')} · ${board.enabled?t('включены','on'):t('выключены','off')}</summary>${marketBtn547(board.enabled?t('Выключить входящие','Turn invitations off'):t('Включить входящие','Allow invitations'),'settings',board.enabled?'0':'1')}</details>`;
   if(closed.length) content+=`<details class="m547-fold"><summary>${t('Архив','Archive')} (${closed.length})</summary>${marketList547(closed,marketLoanCard547,'')}</details>`;
 } else {
   const orders=board.orders||[];
   if(u.tab==='goods') {
     content=marketGoods547(orders,town)+marketStats547(board.statistics);
   } else if(u.tab==='art') {
     content=marketHeading547(t('Ярмарка витражей','Glass fair'))+`<p class="m547-note">${t('Доска твоего города и круга престижа. Купи витраж с подписью мастера или закажи свой узор для гаража.','Market for your city and prestige. Buy a signed panel or commission a design for your garage.')}</p>
     <div class="m547-tools">${primary('commission','Заказать витраж','Commission')}${option('group','Сборный заказ','Group order')}${option('craft','Сделать самому','Craft')}</div>`+
     marketList547(orders.filter(o=>['fair','auction','group','commission'].includes(o.kind)),marketOrder547,t('Ярмарка свободна. Закажи витраж или выставь свою работу из раздела «Моё».','The fair is quiet. Commission a panel or list your own from My stall.'));
   } else {
     const mine=orders.filter(o=>o.mine||o.bidMine||o.forMe||o.myContribution),pieces=board.pieces||[],history=board.history||[];
     if(mine.length) content=marketHeading547(t('Мои сделки','My trades'))+marketList547(mine,marketOrder547,'');
     if(pieces.length) content+=marketHeading547(t('Мои витражи','My panels'))+marketList547(pieces,marketPiece547,'');
     if(!mine.length&&!pieces.length&&!history.length) content=marketEmpty547(t('Твой прилавок пока свободен. Открой ярмарку, чтобы выбрать витраж или заказать свой.','Your stall is ready. Visit the fair to choose a panel or commission your own.'))+`<div>${marketBtn547(t('На ярмарку','Visit the fair'),'tab','art','primary')}</div>`;
     if(board.garageAccess||board.garage?.available) content+=`<div><button type="button" class="m547-btn" data-act="garageBench547">${t('Верстак в гараже','Garage workbench')}</button></div>`;
     if(history.length) content+=`<details class="m547-fold"${!mine.length&&!pieces.length?' open':''}><summary>${t('История сделок','Trade history')}</summary><ul class="m547-history">${history.map(marketHistory547).join('')}</ul></details>`;
   }
 }
 if(board&&u.errors[area]) content=`<p class="m547-error" role="status">${marketError547(u.errors[area])}</p>`+content;
 if(u.fromBench&&u.tab==='goods') content=`<div>${marketBtn547(t('← К верстаку','← Back to workbench'),'backBench')}</div>`+content;
 return `${nav}<div class="m547-content" data-i18n-ignore>${content}</div>${marketIsOnline547()&&board?`<footer>${marketBtn547(u.reading[area]?t('Обновляем…','Refreshing…'):t('Обновить','Refresh'),'reload','','quiet',!!u.reading[area])}</footer>`:''}`;
}
const MARKET_LOAN_ACTIONS547=['offer','settings','accept','decline','repay','extend','approve','forgive','settle'];
const MARKET_LOAN_ERRORS547={
 not_friends:['Нужна взаимная дружба.','Both players must be friends.'],loans_off:['У друга выключены приглашения.','This friend has invitations turned off.'],
 bad_terms:['Проверь сумму и условия расписки.','Check the amount and terms.'],occupied:['Сначала закрой прежнюю расписку или своё предложение.','Finish the existing IOU or withdraw your pending offer.'],
 pledge_city:['Оба игрока должны находиться в одном городе для залога.','Both friends must be in the same city for collateral.'],inbox_full:['У друга уже четыре приглашения.','Your friend already has four pending invitations.'],
 cooldown:['После отказа новое приглашение этому другу доступно через сутки.','After a decline, wait one day before inviting this friend again.'],
 extension_used:['Эта расписка уже продлевалась.','This IOU was already extended.'],not_allowed:['Условия изменились. Проверь расписку и входящие приглашения.','Check the updated IOU and your invitation settings.'],
};
function marketIssue547(err) {const c=err?.code||err?.error||err?.message||err||'unavailable';return marketWord547(MARKET_LOAN_ERRORS547,c)||marketError547(c);}
function marketSelect547(key,label,options,selected) {
 return `<label class="m547-field"><span>${marketEsc547(label)}</span><select required name="${key}">${options.map(([id,text])=>`<option value="${marketEsc547(id)}"${String(selected)===String(id)?' selected':''}>${marketEsc547(text)}</option>`).join('')}</select></label>`;
}
function marketInput547(key,label,min,max,value) {
 return `<label class="m547-field"><span>${marketEsc547(label)}</span><input name="${key}" type="number" inputmode="numeric" required step="1" min="${Number(min)}" max="${Number(max)}" value="${Number(value)}"></label>`;
}
function marketChoice547(dict) {return Object.keys(dict).map(key=>[key,marketWord547(dict,key)]);}
function marketRisk547(pledged) {
 const t=marketText547;
 return `<p>${t('Просрочка не увеличивает долг. Если согласована доля продаж, она уходит кредитору автоматически. Остаток заёмщик возвращает вручную.','Overdue balances earn no interest. An agreed share of net sales repays the lender automatically. The borrower pays the rest from their wallet.')}</p>`+
 (pledged?`<p>${t('Провод возвращается по мере выплат. Пока он в залоге, обеим сторонам для переезда или престижа нужно закрыть расписку. Заёмщик может отдать остаток провода вместо денег, кредитор может забрать его после срока.','Wire is released as repayments are made. Both players must close a secured IOU before moving or starting a new prestige. The borrower can settle with the remaining wire at any time. The lender can claim it after the due date.')}</p>`:'')+
 `<p>${t('При переезде кредитора его денежное требование переносится по правилам наличных. Перед престижем кредитору нужно дождаться возврата или простить долг.','When the lender moves city, their claim follows the same carryover as cash. Before a new prestige, the lender must receive repayment or forgive the balance.')}</p>`;
}
function marketFormModel547(kind,id=0,person=null) {
 const t=marketText547,area=MARKET_LOAN_ACTIONS547.includes(kind)?'loans':'market';
 const board=MARKET_UI547.boards[area]||{},o=board.orders?.find(row=>row.id===id),l=board.loans?.find(row=>row.id===id),p=board.pieces?.find(row=>row.id===id);
 let fields='',description='',confirm=marketWord547(MARKET_KINDS547,kind)||marketWord547(MARKET_ACTIONS547,kind),action=kind;
 const title=confirm,args={},days=()=>marketSelect547('days',t('Срок','Term'),[1,3,7].map(n=>[n,`${n} ${t('дн.','days')}`]),3);
 const pattern=()=>marketSelect547('pattern',t('Узор','Design'),marketChoice547(MARKET_PATTERNS547),'amber');
 const lot=()=>marketInput547('qty',t('Штук в партии','Pieces in lot'),1,99,1);
 const artPrice=(label,defaultPrice)=>marketInput547('price',label,20,10000,defaultPrice);
 const persons=MARKET_UI547.boards.loans?.friends||[],friends=()=>marketSelect547('pid',t('Друг','Friend'),persons.map(f=>[f.pid,f.name]),person?.pid);
 const name=person?.name||person?.pid||'';
 if(['buy','sell','barter','commission','group','fair','auction'].includes(kind)) {action='post';args.kind=kind;}
 if(['buy','sell','barter'].includes(kind)) {
   const material=kind!=='barter'&&Object.hasOwn(MARKET_ITEMS547,MARKET_UI547.material)?MARKET_UI547.material:'scrap';
   fields=marketSelect547('item',kind==='barter'?t('Отдаю','I give'):t('Материал','Material'),marketChoice547(MARKET_ITEMS547),material)+lot();
   if(kind==='barter') {
     fields=friends()+fields+marketSelect547('wantItem',t('Получаю','I get'),marketChoice547(MARKET_ITEMS547),'copper')+marketInput547('wantQty',t('Сколько получить','Quantity to receive'),1,99,1);
     description=t('Твои предметы подождут друга 48 часов. При отмене вернутся в сумку.','Your items are held for your friend for 48 hours. Withdrawing returns them to your bag.');
     confirm=t('Предложить обмен','Offer swap');
   } else {
     fields+=marketInput547('price',t('Цена всей партии, ₽','Whole lot price, ₽'),6,36,18);
     description=kind==='buy'?t('Деньги на покупку откладываются на 48 часов или до снятия заявки.','The purchase price is reserved for up to 48 hours, or until withdrawal.'):t('Выбранная партия откладывается на 48 часов или до снятия заявки.','Your lot is reserved for up to 48 hours, or until withdrawal.');
     confirm=t('Разместить заявку','Post order');
   }
 } else if(['group','commission','craft'].includes(kind)) {
   fields=pattern();
   if(kind==='craft') description=t('Артель потратит 4 готовых стекла. Подписанный витраж появится в разделе «Моё».','The Glassworks uses 4 finished panes. Find your signed panel in My stall.');
   else {
     fields+=artPrice(t('Бюджет заказа, ₽','Commission budget, ₽'),160);
     description=kind==='group'?t('Заказ на 4 стекла. Бюджет резервируется на 48 часов. Когда витраж готов, вкладчики делят оплату по вкладу. Твой собственный вклад возвращает твою долю бюджета.','Commission 4 panes. The budget is held for 48 hours. On completion, contributors share the proceeds according to their contributions. Your panes return your share of the budget.'):t('Бюджет резервируется на 48 часов. Мастер выполнит заказ из четырёх своих стёкол.','Your budget is held for 48 hours. The maker fills the commission with four of their own panes.');
     if(kind==='group') fields+=`<label class="m547-check"><input type="checkbox" name="openGuests"><span>${t('Принимать стекло гостей из других городов и кругов','Accept volunteer glass from other cities and prestige levels')}<small>${t('С вкладом гостя витраж станет выставочным. Он сохранит подписи, продать его будет нельзя. Доля денег гостя вернётся тебе.','A guest contribution makes this a display-only panel. It keeps its signatures and cannot be resold. The guest’s budget share returns to you.')}</small></span></label>`;
     if(person&&kind==='commission') {args.pid=String(person.pid);description+=` ${t('Мастер','Maker')} · ${name}. ${t('Заказ доступен в одном городе и круге престижа.','You and the maker must share a city and prestige.')}`;}
     confirm=t('Разместить заказ','Post commission');
   }
 } else if(['fair','auction','display'].includes(kind)) {
   if(!p) return null;
   args.pieceId=id;description=`${marketWord547(MARKET_PATTERNS547,p.pattern)} #${id} · ${p.makerName}. `;
   if(kind==='display') description+=t('Друзья увидят этот витраж в гостях.','Friends will see this panel when they visit.');
   else {
     fields=artPrice(kind==='auction'?t('Стартовая цена, ₽','Starting price, ₽'):t('Цена витража, ₽','Panel price, ₽'),160);
     description+=kind==='auction'?t('Торги идут 24 часа. После первой ставки лот остаётся до конца торгов.','Bidding lasts 24 hours. The first bid commits the panel until the auction ends.'):t('Витраж будет на ярмарке 48 часов. Снять можно до покупки.','Your panel stays at the fair for 48 hours. Withdraw it any time before it sells.');
   }
 } else if(['take','cancel','bid','contribute'].includes(kind)) {
   if(!o) return null;
   args.id=id;
   if(kind==='cancel') {description=t('Заявка будет снята. Зарезервированные рубли, материалы и чужие вклады вернутся владельцам.','This listing will close. Reserved funds, goods and contributions return to their owners.');}
   if(kind==='take') {
     const item=marketWord547(MARKET_ITEMS547,o.item),want=marketWord547(MARKET_ITEMS547,o.wantItem);
     if(o.kind==='buy') description=`${t('Отдаёшь','You give')} ${item} ×${o.qty}. ${t('После комиссии','After fee')} ${marketCash547(o.net)}.`;
     if(o.kind==='sell'||o.kind==='fair') description=`${t('Платишь','You pay')} ${marketCash547(o.price)}. ${t('Получаешь','You receive')} ${o.kind==='sell'?item+' ×'+o.qty:marketWord547(MARKET_PATTERNS547,o.pattern)}.`;
     if(o.kind==='barter') description=`${t('Отдаёшь','You give')} ${want} ×${o.wantQty}. ${t('Получаешь','You receive')} ${item} ×${o.qty}.`;
     if(o.kind==='commission') description=`${t('Артель потратит 4 стекла на заказ. Оплата после комиссии','Your workshop spends 4 panes. Pay after fee')} ${marketCash547(o.net)}.`;
     description+=` ${t('Игрок','Player')} · ${o.ownerName}.`;
   }
   if(kind==='bid') {
     const floor=Math.max(o.price,o.bid+1);fields=marketInput547('amount',t('Ставка, ₽','Your bid, ₽'),floor,10000,floor);
     description=t('Ставка удерживается до конца торгов. Если тебя перебьют, деньги вернутся.','Your bid is held until the auction ends. An outbid returns your rubles.');
   }
   if(kind==='contribute') {
     fields=marketInput547('qty',t('Готовое стекло, шт.','Finished panes'),1,(o.currentGoal||4)-o.raised,1);
     description=`${t('Собрано','Delivered')} ${o.raised} / ${o.currentGoal||4}. ${t('Оплата за чужой вклад при завершении — доля бюджета после комиссии. При отмене стекло вернётся в артель.','Outside contributions earn a share after fees when complete. Cancellation returns the glass to your workshop.')}`;
     if(o.volunteerOnly) {
       args.volunteer=true;confirm=t('Внести стекло за подпись','Give glass for credit');
       description=t('Стекло пойдёт на выставочный витраж без перепродажи. Твоя награда — подпись, оплата 0 ₽. Твоя доля денег вернётся заказчику. При отмене стекло вернётся тебе.','The panel will be for display only. Your glass earns a signed credit and pays 0 ₽. The owner gets your budget share. A cancellation returns your glass.');
     }
   }
 } else if(kind==='settings') {
   args.enabled=!!id;
   description=args.enabled?t('Друзья смогут предлагать тебе расписки.','Friends will be able to send IOU offers.'):t('Входящие предложения будут отклонены. Текущие долги останутся в разделе расписок.','Pending incoming offers will be declined. Active IOUs remain available.');
   confirm=args.enabled?t('Включить','Enable'):t('Выключить','Disable');
 } else if(kind==='offer') {
   fields=friends()+marketSelect547('role',t('Моя роль','My role'),[['lender',t('Даю в долг','I lend')],['borrower',t('Беру в долг','I borrow')]],'lender')+
   marketInput547('amount',t('Сумма, ₽','Principal, ₽'),100,3000,300)+days()+
   marketSelect547('share',t('Автовозврат из чистых продаж','Repay from net sales'),[[0,t('Вручную','Manual')],[20,'20%']],0)+marketInput547('pledge',t('Залог заёмщика, шт. провода','Borrower’s wire collateral'),0,20,0);
   description=t('Нужен друг в твоём городе и круге престижа. На ответ — сутки. Рубли и залог переходят при принятии.','Choose a friend in your city and prestige. They have 24 hours to respond. Money and collateral move on acceptance.');
   confirm=t('Предложить условия','Offer terms');
 } else if(MARKET_LOAN_ACTIONS547.includes(kind)) {
   if(!l) return null;
   args.id=id;
   if(kind==='repay') fields=marketInput547('amount',t('Сумма возврата, ₽','Payment amount, ₽'),1,l.remaining,Math.min(l.remaining,Math.max(1,Math.floor(S.money))));
   if(kind==='extend') fields=days();
   const detail={accept:t('Перевод при подтверждении','Transfer on acceptance'),
     decline:l.status==='active'?t('Отменить предложенное продление? Действующий срок расписки сохранится.','Cancel the proposed extension? The current due date stays in place.'):t('Предложение будет закрыто. Перевода денег не будет.','Close this offer without transferring money.'),
     repay:t('Ты должен','You owe')+' '+marketCash547(l.remaining),
     extend:t('Продлить можно один раз после согласия второй стороны.','The term can be extended once when the other party agrees.'),
     approve:t('Срок увеличится на согласованное число дней.','Add the agreed extension to the due date.')+` (${l.extensionDays||0})`,
     forgive:`${t('Простить оставшийся долг','Forgive the remaining balance of')} ${marketCash547(l.remaining)}? ${t('Удержанный провод вернётся заёмщику. Это окончательно закроет расписку.','The held wire returns to the borrower. This closes the IOU permanently.')}`,
     settle:`${t('Кредитор получит весь остаток залога','The lender receives all remaining collateral')} (${l.held} ${t('шт. провода','wire')}) ${t('вместо','instead of')} ${marketCash547(l.remaining)}. ${t('Долг будет закрыт.','The debt will close.')}`};
   description=`${l.otherName} · ${detail[kind]}`;
 } else return null;
 return {kind,id,person,area,action,title,args,description,fields,confirm,loan:l,order:o};
}
let marketForm547=null;
const MARKET_READS547={market:null,loans:null},MARKET_GEN547={market:0,loans:0};
let marketRealm547='';
function marketCheckRealm547() {
 const key=city()+'|'+(S.prestige||0);
 if(marketRealm547!==key) {
   marketRealm547=key;
   for(const area of ['market','loans']) {
     MARKET_UI547.boards[area]=null;MARKET_UI547.readAt[area]=0;MARKET_UI547.errors[area]='';++MARKET_GEN547[area];
   }
 }
}
function marketPaint547() {
 const mount=document.getElementById('m547Panel');
 if(!mount||!MARKET_UI547.players||!marketScene547()) return;
 const active=document.activeElement?.closest('[data-m547-action]'),restore=active&&mount.contains(active)?[active.dataset.m547Action,active.dataset.m547Id||'']:null;
 const filter=mount.querySelector('.m547-filters select:focus')?.name;
 const opened=[...mount.querySelectorAll('details[open]')].map(x=>x.dataset.fold||x.querySelector('summary')?.textContent);
 mount.innerHTML=marketPanel547();
 for(const x of mount.querySelectorAll('details')) if(opened.includes(x.dataset.fold||x.querySelector('summary')?.textContent)) x.open=true;
 if(restore) [...mount.querySelectorAll('[data-m547-action]')].find(b=>b.dataset.m547Action===restore[0]&&(b.dataset.m547Id||'')===restore[1])?.focus({preventScroll:true});
 if(filter) mount.querySelector(`.m547-filters [name="${filter}"]`)?.focus({preventScroll:true});
}
function marketBoardSeen547(area,board) {
 const u=MARKET_UI547;
 if(!Object.hasOwn(u.boards,area)||!board?.ok||!Number.isSafeInteger(board.marker)||!Number.isSafeInteger(board.rev)) return board;
 marketCheckRealm547();
 if(board.marker<(S.marketRev547||0)) return board;
 const old=u.boards[area],other=area==='market'?'loans':'market';
 if(old&&(board.marker<old.marker||board.rev<old.rev||(board.marker===old.marker&&board.rev===old.rev&&Number(board.now)<Number(old.now)))) return board;
 const changed=old!==board;
 u.boards[area]=board;u.errors[area]='';u.readAt[area]=Date.now();
 if(u.boards[other]&&u.boards[other].marker<board.marker) u.readAt[other]=0;
 if(changed&&!u.reading[area]&&!u.sending&&!modalOpen()&&marketArea547()===area) marketPaint547();
 return board;
}
async function marketLoad547(area,force=false) {
 const u=MARKET_UI547;
 if(!marketIsOnline547()) return null;
 if(MARKET_READS547[area]) return MARKET_READS547[area];
 if(!force&&u.boards[area]&&Date.now()-u.readAt[area]<30000) return u.boards[area];
 const gen=MARKET_GEN547[area];
 u.reading[area]=true;
 const pending=Promise.resolve().then(()=>marketRead547(area)).then(r=>{
   if(!r?.ok) throw Error(r?.error||'unavailable');
   if(MARKET_GEN547[area]===gen) marketBoardSeen547(area,r);
   return u.boards[area];
 }).catch(e=>{
   if(MARKET_GEN547[area]===gen) {u.errors[area]=e?.code||e?.message||'unavailable';u.readAt[area]=Date.now();}
   return null;
 }).finally(()=>{u.reading[area]=false;MARKET_READS547[area]=null;if(!u.sending&&!modalOpen()&&marketArea547()===area)marketPaint547();});
 MARKET_READS547[area]=pending;
 marketPaint547();
 return pending;
}
function marketNumberValue547(form,key) {
 const value=form.elements.namedItem(key)?.value;
 return value===''||value==null?NaN:Number(value);
}
function marketQuote547(form,model,changed='') {
 const t=marketText547,k=model.kind,q=form.querySelector('.m547-quote');
 if(!q) return;
 const item=form.elements.namedItem('item')?.value,priceInput=form.elements.namedItem('price');
 const qty=marketNumberValue547(form,'qty'),data=MARKET_UI547.boards.market;
 let quote='';
 if(['buy','sell'].includes(k)&&Object.hasOwn(MARKET_ITEMS547,item)&&Number.isSafeInteger(qty)&&qty>=1&&qty<=99) {
   const limits=data?.limits?.goods?.[item],range=Array.isArray(limits)?limits:item==='scrap'?[6,36]:[22,135];
   const low=range[0]*qty,high=range[1]*qty;
   priceInput.min=String(low);priceInput.max=String(high);
   if(changed==='item'||changed==='qty') {
     if(!form.dataset.customPrice) priceInput.value=String(Math.max(low,Math.min(high,itemPrice(item)*qty)));
   }
   if(changed==='price') form.dataset.customPrice='1';
   const gross=marketNumberValue547(form,'price');
   quote=marketMoneyLine547(k==='sell'?t('В сумке','In your bag'):t('В кошельке','Your wallet'),k==='sell'?marketNum547(S.inv?.[item]||0):marketCash547(S.money))+marketMoneyLine547(t('Цена партии, от и до','Lot price range'),`${marketNum547(low)}–${marketCash547(high)}`)+marketMoneyLine547(t('Шнырь заплатит сейчас','Shnyr pays now'),marketCash547(itemPrice(item)*qty));
   if(Number.isSafeInteger(gross)&&gross>=low&&gross<=high) quote+=marketMoneyLine547(t('За штуку','Each'),marketCash547(gross/qty))+marketMoneyLine547(t('Комиссия','Market fee'),marketCash547(gross-marketNet547(gross)))+marketMoneyLine547(t('Продавцу после комиссии','Seller gets after fee'),marketCash547(marketNet547(gross)));
 } else if(k==='barter') {
   const want=form.elements.namedItem('wantItem'),source=form.elements.namedItem('item');
   if(want.value===source.value&&(changed==='item'||changed==='wantItem')) (changed==='item'?want:source).value=want.value==='scrap'?'copper':'scrap';
   quote=marketMoneyLine547(t('В сумке','In your bag'),`${marketWord547(MARKET_ITEMS547,source.value)} ×${marketNum547(S.inv?.[source.value]||0)}`);
 } else if(['commission','fair','auction'].includes(k)) {
   const price=marketNumberValue547(form,'price');
   if(Number.isInteger(price)&&price>=20&&price<=10000) quote=marketMoneyLine547(k==='auction'?t('На руки при стартовой цене','Net at opening price'):t('Продавцу после комиссии','Seller gets after fee'),marketCash547(marketNet547(price)));
 } else if(k==='offer') {
   const pledged=marketNumberValue547(form,'pledge');
   quote=marketRisk547(pledged>0);
 } else if(k==='accept') {
   quote=marketTerms547(model.loan,true)+marketRisk547(model.loan.pledge>0);
 } else if(k==='repay') {
   const loan=model.loan,payment=marketNumberValue547(form,'amount'),wallet=Math.floor(S.money);
   form.querySelector('[type=submit]').disabled=MARKET_UI547.sending||!Number.isSafeInteger(payment)||payment<1||payment>Math.min(wallet,loan.remaining);
   quote=marketMoneyLine547(t('В кошельке','Your wallet'),marketCash547(wallet));
   if(Number.isSafeInteger(payment)&&payment>0&&payment<=loan.remaining) {
     if(payment>wallet) {
       quote+=marketMoneyLine547(t('Не хватает для платежа','Shortfall for this payment'),marketCash547(payment-wallet));
     } else {
       const remaining=loan.remaining-payment;
       quote+=marketMoneyLine547(t('Остаток долга','Remaining balance'),marketCash547(remaining));
       if(loan.held>0) {
         const released=loan.held-Math.ceil(loan.pledge*remaining/loan.amount);
         quote+=marketMoneyLine547(t('Вернётся в сумку','Returned to your bag'),`${marketWord547(MARKET_ITEMS547,'copper')} ×${marketNum547(released)}`);
       }
       if(loan.creditorRemaining!=null&&loan.creditorRemaining!==loan.remaining)
         quote+=marketMoneyLine547(t('Друг получит после переезда','Friend receives after moving'),marketCash547(Math.floor(loan.creditorRemaining*payment/loan.remaining)));
     }
   }
 }
 if(k==='craft'||k==='contribute'||(k==='take'&&model.order?.kind==='commission')) {
   const stock=glass546Count(S.glass546?.stock),eligible=glass546Eligible();
   const needed=k==='contribute'?(model.order.currentGoal||4)-model.order.raised:4;
   const amount=form.elements.namedItem('qty'),requested=amount?qty:needed;
   if(amount) {
     amount.max=String(Math.min(stock,needed));
     amount.disabled=stock===0||!eligible;
   }
   quote+=marketMoneyLine547(t('Готовое стекло в артели','Finished glass at workshop'),marketNum547(stock));
   if(!eligible) {
     quote+=`<small>${t('Артель откроется после финала Китая или при втором престиже.','Finish the China story or reach prestige 2 to open the Glassworks.')}</small>`;
   } else if(stock<needed) {
     if(k==='contribute'&&stock>0) quote+=marketMoneyLine547(t('Можно внести сейчас, шт.','You can contribute now'),marketNum547(stock));
     quote+=marketMoneyLine547(k==='contribute'?t('До полного заказа не хватает, шт.','Panes short of the full order'):t('Не хватает стёкол, шт.','More panes needed'),marketNum547(needed-stock));
     quote+=marketBtn547(t('В стекольную артель','Go to the Glassworks'),'glassWorkshop');
   }
   form.querySelector('[type=submit]').disabled=MARKET_UI547.sending||!eligible||!Number.isSafeInteger(requested)||requested<1||requested>Math.min(stock,needed);
 }
 const pattern=form.elements.namedItem('pattern')?.value;
 if(pattern) quote=`<span class="m547-preview">${marketArtwork547({pattern})}<b>${marketWord547(MARKET_PATTERNS547,pattern)}</b></span>`+quote;
 // Blurring a number field can fire change while the player is tapping the workshop link.
 if(form.marketQuoteMarkup547!==quote) {
   form.marketQuoteMarkup547=quote;
   q.innerHTML=quote;
 }
}
function marketShowForm547(kind,id,person) {
 const t=marketText547,model=marketFormModel547(kind,id,person);
 if(!model) {toast(marketError547('closed'),'bad');return;}
 if(['offer','barter'].includes(kind)&&!MARKET_UI547.boards.loans?.friends?.length) {
   const remoteError=MARKET_UI547.errors.loans;
   openModal(`<div class="m547-dialog" data-i18n-ignore><h3>${marketEsc547(model.title)}</h3><p>${remoteError?marketError547(remoteError):t('Для сделки нужен друг. Добавь игрока по коду или открой его профиль в чате.','You need a friend for this trade. Add one by code or open a player’s profile in chat.')}</p><div class="m547-tools">
   ${remoteError?marketBtn547(t('Повторить','Retry'),'new',kind):marketBtn547(t('К друзьям','Find friends'),'friends')}${marketBtn547(t('Назад','Back'),'close')}</div></div>`,{center:true});return;
 }
 if(person&&['offer','barter'].includes(kind)&&!MARKET_UI547.boards.loans.friends.some(f=>String(f.pid)===String(person.pid))) {toast(marketError547('friends'),'bad');return;}
 const back=openModal(`<form class="m547-dialog" id="m547Form" data-i18n-ignore><div class="m547-dialog-head"><h3>${marketEsc547(model.title)}</h3>${marketBtn547(t('Закрыть','Close'),'close','','quiet')}</div>
 <p>${marketEsc547(model.description)}</p><div class="m547-fields">${model.fields}</div><div class="m547-quote" aria-live="polite"></div><p role="alert" class="m547-error" hidden></p><button type="submit" class="m547-btn m547-primary">${marketEsc547(model.confirm)}</button></form>`,{center:true});
 const el=back.querySelector('form');marketForm547={el,model};marketQuote547(el,model,'item');
}
async function marketCompose547(kind,id=0,person=null) {
 const u=MARKET_UI547;
 if(!marketIsOnline547()) {toast(marketError547('offline'),'bad');return;}
 if(u.sending)return;
 const area=MARKET_LOAN_ACTIONS547.includes(kind)?'loans':'market',initialTab=u.tab;
 if(!u.boards[area]||(['offer','barter'].includes(kind)&&!u.boards.loans)) {
   const before=document.querySelector('#modalRoot .backdrop');
   const necessary=area==='loans'?['loans']:kind==='barter'?['market','loans']:['market'];
   for(const a of necessary) if(!u.boards[a]) await marketLoad547(a,true);
   if(!marketScene547()||!u.players||u.tab!==initialTab||before!==document.querySelector('#modalRoot .backdrop')) return;
 }
 if(!u.boards[area]) {toast(marketIssue547(u.errors[area]),'bad');return;}
 marketShowForm547(kind,id,person);
}
async function marketSubmit547(e) {
 const form=e.target,ctx=marketForm547;
 if(!ctx||form!==ctx.el) return;
 e.preventDefault();
 const u=MARKET_UI547,m=ctx.model,t=marketText547,err=form.querySelector('[role=alert]'),submit=form.querySelector('[type=submit]');
 if(u.sending||submit.disabled||!form.reportValidity())return;
 const args={...m.args};
 for(const [key,value] of new FormData(form)) args[key]=['qty','price','wantQty','days','amount','share','pledge'].includes(key)?Number(value):value;
 if(m.kind==='group') args.openGuests=form.elements.namedItem('openGuests').checked;
 let acquiredPiece=null;
 u.sending=true;++MARKET_GEN547[m.area];submit.disabled=true;err.hidden=true;
 const label=submit.textContent;submit.textContent=t('Подождите…','Please wait…');
 try {
   const r=await marketChange547(m.area,m.action,args);
   if(!r?.ok) throw Error(r?.error||'unavailable');
   marketBoardSeen547(m.area,r);
   if(form.isConnected) {
     closeModal();
     const pieceId=m.kind==='craft'?r.receipt?.id:m.kind==='take'&&m.order?.kind==='fair'?m.order.pieceId:null;
     const index=pieceId?r.pieces?.findIndex(piece=>piece.id===pieceId):-1;
     if(index>=0&&marketScene547()&&u.players) {
       u.tab='mine';u.limit=Math.max(8,index+1);acquiredPiece=pieceId;
     }
   }
   const result=acquiredPiece?t('Витраж в твоей коллекции','Panel added to your collection'):
     m.kind==='offer'?t('Предложение отправлено','Offer sent'):t('Готово','Done');
   toast(result,'good');
 } catch (error) {
   if(form.isConnected) {err.textContent=marketIssue547(error);err.hidden=false;}
   else toast(marketIssue547(error),'bad');
   if(['closed','stale','bid','sync'].includes(error?.code||error?.message)) u.readAt[m.area]=0;
 } finally {
   u.sending=false;submit.disabled=false;submit.textContent=label;
   if(form.isConnected) marketQuote547(form,m);
   marketPaint547();
   if(acquiredPiece) {
     const card=document.querySelector(`#m547Panel [data-m547-piece="${acquiredPiece}"]`);
     card?.focus({preventScroll:true});card?.scrollIntoView({block:'nearest'});
   }
 }
}
function marketOpen547(target='goods',person=null,fromBench=false) {
 const tab={buy:'goods',sell:'goods',barter:'goods',group:'art',commission:'art',craft:'art',offer:'loans'}[target]||target;
 const u=MARKET_UI547;
 if(!['goods','art','mine','loans'].includes(tab))return;
 if(modalOpen())closeModal();
 u.players=true;u.tab=tab;u.limit=8;u.friend=person;u.fromBench=fromBench;
 showScreen('fun','market');
 if(tab!==target) marketCompose547(target,0,person);
}
function marketFindMaterial547(item) {
 if(city()!=='zas'||(item!=='all'&&!Object.hasOwn(MARKET_ITEMS547,item))) return;
 MARKET_UI547.material=item;MARKET_UI547.intent=item==='all'?'all':'buy';
 marketOpen547('goods',null,true);
}
function marketFriend547(pid,name) {
 const t=marketText547,person={pid:String(pid),name};MARKET_UI547.friend=person;
 const buttons=(city()==='zas'?marketBtn547(t('Обменять сырьё','Swap materials'),'friendKind','barter'):'')+
 marketBtn547(t('Предложить расписку','Offer an IOU'),'friendKind','offer')+marketBtn547(t('Заказать витраж','Commission a panel'),'friendKind','commission');
 openModal(`<section class="m547-dialog" data-i18n-ignore><h3>${marketEsc547(name)||t('Сделка с другом','Trade with friend')}</h3><div class="m547-friend-tools">${buttons}${marketBtn547(t('Назад','Back'),'backVisit',pid,'quiet')}</div></section>`,{center:true});
}
function marketClick547(e) {
 const b=e.target.closest?.('[data-m547-action]');
 const posting=document.querySelector('.m547-posting[open]');
 if(posting&&(!posting.contains(e.target)||b)) posting.open=false;
 if(!b||b.disabled) return;
 const a=b.dataset.m547Action,id=b.dataset.m547Id,u=MARKET_UI547;
 if(a==='close') {if(!u.sending)closeModal();return;}
 if(a==='glassWorkshop') {marketVisitGlass547();return;}
 if(a==='backBench'&&u.fromBench) {u.fromBench=false;marketPaint547();ACTIONS.garageBench547();return;}
 if(a==='friends') {if(modalOpen())closeModal();showScreen('fun','friends');return;}
 if(a==='visitLoans') {marketOpen547('loans');return;}
 if(a==='friend') {marketFriend547(id,b.closest('[data-m547-friend]')?.dataset.m547Friend||'');return;}
 if(a==='backVisit') {if(modalOpen())closeModal();ACTIONS.frVisit(id);return;}
 if(a==='friendKind') {marketOpen547(id,u.friend);return;}
 if(a==='toMaker') {marketOpen547('commission',{pid:String(id),name:b.closest('.m547-piece')?.querySelector('small')?.textContent?.split(' · ').slice(1).join(' · ')||''});return;}
 if(a==='mode') {u.players=id==='players';if(!u.players)u.fromBench=false;u.friend=null;renderCurrent(false);if(u.players)marketLoad547(marketArea547());return;}
 if(a==='tab') {if(!['goods','art','mine','loans'].includes(id))return;u.tab=id;u.friend=null;u.limit=8;marketPaint547();marketLoad547(marketArea547());return;}
 if(a==='more') {u.limit+=8;marketPaint547();return;}
 if(a==='reload') {marketLoad547(marketArea547(),true);return;}
 if(a==='new') {marketCompose547(id);return;}
 marketCompose547(a,Number(id));
}
const marketNpcTab547=EXTRA_TABS.fun.market;
EXTRA_TABS.fun.market=()=>{marketCheckRealm547();return marketModeSwitch547()+(MARKET_UI547.players?`<section id="m547Panel" data-i18n-ignore>${marketPanel547()}</section>`:marketNpcTab547());};
const marketFriendTab547=EXTRA_TABS.fun.friends;
EXTRA_TABS.fun.friends=()=>`${marketIsOnline547()?`<div class="m547-friend-entry" data-i18n-ignore>${marketBtn547(marketText547('Расписки с друзьями','IOUs with friends'),'visitLoans')}</div>`:''}${marketFriendTab547()}`;
ACTIONS.marketOpen547=target=>marketOpen547(target);
ACTIONS.marketFindMaterial547=marketFindMaterial547;
document.addEventListener('click',marketClick547);
document.addEventListener('keydown',e=>{
 if(e.key!=='Escape') return;
 const posting=e.target.closest?.('.m547-posting[open]');
 if(posting) {posting.open=false;posting.querySelector('summary').focus();}
});
document.addEventListener('change',e=>{
 const field=e.target;
 if(!field.matches?.('.m547-filters select')) return;
 if(field.name==='material') MARKET_UI547.material=field.value;
 else if(field.name==='intent') MARKET_UI547.intent=field.value;
 MARKET_UI547.limit=8;
 marketPaint547();
});
document.addEventListener('submit',marketSubmit547);
for(const event of ['input','change']) document.addEventListener(event,e=>{const ctx=marketForm547;if(ctx?.el.contains(e.target)) marketQuote547(ctx.el,ctx.model,e.target.name);});
HOOKS.screen.push(()=>{if(!marketScene547()) MARKET_UI547.fromBench=false;else if(MARKET_UI547.players) marketLoad547(marketArea547());});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&marketScene547()&&MARKET_UI547.players) marketLoad547(marketArea547());});
HOOKS.tick.push(()=>{
 const u=MARKET_UI547,area=marketArea547();
 if(!document.hidden&&marketScene547()&&u.players&&!u.sending&&!u.reading[area]&&!modalOpen()&&Date.now()-u.readAt[area]>=45000) marketLoad547(area,true);
});
