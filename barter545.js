// One optional notice in Shnyr's market. Inventory and replies belong to the server.
const BARTER_UI545 = {
  expanded: false, board: null, receivedAt: 0, busy: false, selected: '',
  message: '', receipt: null, error: '', readFailed: false, nextRead: 0, clockLabel: '',
};
const BARTER_ITEMS545 = {
  scrap: ['Металлолом', 'Scrap metal'], copper: ['Медный провод', 'Copper wire'],
};
const BARTER_RARITIES545 = {
  s1: ['Марка «Гагарин»', 'Gagarin stamp'], b1: ['Значок «Отличник ГТО»', 'GTO sports badge'],
};
const BARTER_ERRORS545 = {
  offline: ['Для обмена открой игру в Telegram.', 'Open the game in Telegram to trade.'],
  sync: ['Идёт синхронизация сохранения. Попробуй ещё раз.', 'Your save is syncing. Try again.'],
  stale: ['Состояние изменилось. Проверь объявление ещё раз.', 'The notice has changed. Check it again.'],
  no_item: ['Этой находки уже нет в сумке.', 'This item is no longer in your bag.'],
  wrong_city: ['Новые объявления можно вешать в Засранске.', 'You can post new notices in Zasransk.'],
  occupied: ['На столбе уже висит твоё объявление.', 'Your notice is already on the post.'],
  not_ready: ['Записки ещё в пути.', 'The replies are still on their way.'],
  closed: ['Это объявление уже снято или обменяно.', 'This notice was already taken down or traded.'],
  full: ['Валера сыт. Обед подождёт.', 'Valera is full. The meal can wait.'],
  busy: ['Дождись окончания обмена.', 'Wait for the current trade to finish.'],
  unavailable: ['Не удалось получить ответ. Проверь объявление ещё раз.', 'Could not reach the noticeboard. Check it again.'],
};

function barterText545(ru, en) { return I18N.lang === 'en' ? en : ru; }
function barterConnected545() { return onlineOn(); }
function barterMarket545() { return currentScreen === 'fun' && TABS.fun === 'market'; }
function barterVisible545() {
  return city() === 'zas' || (barterConnected545() && (!!BARTER_UI545.board?.post || (BARTER_UI545.expanded && !!BARTER_UI545.message)));
}
function barterNow545() {
  const ui = BARTER_UI545;
  return ui.board ? ui.board.now + Math.max(0, performance.now() - ui.receivedAt) : 0;
}
function barterRemaining545(post) { return Math.max(0, Math.ceil((post.readyAt - barterNow545()) / 60000)); }
function barterStatus545(post) {
  return barterRemaining545(post) ? barterText545('Ждём записки', 'Waiting for replies') : barterText545('Две записки', 'Two replies');
}
function barterTitle545(item) { return barterText545(...BARTER_ITEMS545[item]); }
function barterFood545(gain) {
  if (gain > 0 && gain < 0.1) return barterText545('менее 0,1', 'under 0.1');
  return gain.toLocaleString(I18N.lang, {maximumFractionDigits: 1});
}

function barterIdle545(connected) {
  const ui = BARTER_UI545;
  const entries = Object.keys(BARTER_ITEMS545);
  const quantity = id => Math.max(0, Math.floor(Number(S.inv?.[id]) || 0));
  const selected = entries.find(id => id === ui.selected && quantity(id)) || entries.find(id => quantity(id));
  const items = entries.map(id => {
    const count = quantity(id);
    const chosen = id === selected;
    return `<label class="barter545-item"><input name="barter545-source" type="radio" value="${id}" ${chosen ? 'checked' : ''} ${!count || !connected || ui.busy ? 'disabled' : ''}>
      <span class="barter545-item-icon" aria-hidden="true">${ITEMS[id].emoji}</span><span>${barterTitle545(id)}</span><small>×${fmt(count)}</small></label>`;
  }).join('');
  const eligible = connected && selected && !ui.busy;
  let terms = '';
  if (selected) {
    const [meal, collector] = barter545Offers(selected);
    const rarity = barterText545(...BARTER_RARITIES545[collector.item]);
    terms = barterText545(`Еда (до +${meal.food} сытости) или ${rarity[0].toLowerCase() + rarity.slice(1)}.`, `A meal (up to +${meal.food} fullness) or a ${rarity}.`);
  }
  let hint = '';
  if (!connected) hint = barterText545('Обмен доступен в игре через Telegram.', 'Open the game in Telegram to trade.');
  else if (!selected) hint = barterText545('Подойдёт металлолом или медный провод из мусорки.', 'Look for scrap metal or copper wire in the bins.');
  return `<p>${barterText545('Оставь одну находку. Через 30 минут пекарь и коллекционер принесут по записке. Выбери один обмен или забери вещь обратно.',
    'Leave one find. In 30 minutes the baker and the collector will each leave a note. Pick one trade, or take your item back.')}</p>
    <fieldset class="barter545-bag"><legend>${barterText545('Выбери вещь из сумки', 'Choose an item from your bag')}</legend>${items}</fieldset>
    ${terms ? `<p class="barter545-help">${terms}</p>` : ''}
    ${hint ? `<p class="barter545-help">${hint}</p>` : ''}
    ${connected ? `<button type="button" class="barter545-primary" data-barter545="post" ${eligible ? '' : 'disabled'}>${barterText545('Повесить объявление', 'Post notice')}</button>`
      : `<a class="barter545-secondary" href="${BOT_LINK}" target="_blank" rel="noopener">${barterText545('Открыть бота в Telegram', 'Open the bot in Telegram')}</a>`}`;
}

function barterNotes545(post) {
  const ui = BARTER_UI545;
  const buttonsBlocked = ui.busy || !barterConnected545();
  const minutes = barterRemaining545(post);
  const item = barterTitle545(post.item);
  const cancel = `<button type="button" class="barter545-secondary" data-barter545="cancel" data-post="${post.id}" ${buttonsBlocked ? 'disabled' : ''}>${barterText545('Снять и вернуть вещь', 'Take down and reclaim item')}</button>`;
  if (minutes) {
    return `<p class="barter545-reserved">${barterText545('На столбе', 'On the post')} · <b>${item} ×1</b></p>
      <p>${barterText545(`Записки появятся через ${fmt(minutes)} мин. Можно уйти по делам, они дождутся тебя.`, `Replies in ${fmt(minutes)} min. You can leave and come back for them.`)}</p>${cancel}`;
  }
  const notes = post.offers.map(offer => {
    if (offer.id === 'meal') {
      const gain = Math.min(offer.food, Math.max(0, maxFood() - S.food));
      const foodName = post.item === 'scrap' ? barterText545('Пирожок из печи', 'An oven-fresh pastry') : barterText545('Обед с пирогом', 'Lunch and a pie');
      const full = gain <= 0;
      return `<article class="barter545-note"><h4>${barterText545('Пекарь', 'The baker')}</h4>
        <p>${post.item === 'scrap' ? barterText545('«Как раз для моей печной дверцы!»', '“Just what my oven door needs!”') : barterText545('«Приделаю звонок. Даже Шнырь в очередь встанет!»', '“A shop bell! Even Shnyr will have to queue.”')}</p>
        <strong>${foodName}</strong><small>${full ? barterText545('Валера сыт. Обед подождёт.', 'Valera is full. The meal can wait.') : (gain < 0.1 ? barterText545('Сытость вырастет менее чем на 0,1', 'Food will rise by less than 0.1') : barterText545(`Сытость +${barterFood545(gain)} сейчас`, `Food +${barterFood545(gain)} now`))}</small>
        <button type="button" class="barter545-primary" data-barter545="meal" data-post="${post.id}" ${full || buttonsBlocked ? 'disabled' : ''}>${barterText545('Взять обед', 'Take the meal')}</button></article>`;
    }
    if (offer.id !== 'collector' || !Object.hasOwn(BARTER_RARITIES545, offer.item)) return '';
    const duplicate = collHas(offer.item);
    return `<article class="barter545-note"><h4>${barterText545('Коллекционер', 'The collector')}</h4>
      <p>${post.item === 'scrap' ? barterText545('«С таким грузиком марки не разлетятся».', '“With that paperweight my stamps will stay put.”') : barterText545('«Согну крючок для витрины. Договорились?»', '“I could bend that into a display hook. Deal?”')}</p>
      <strong>${barterText545(...BARTER_RARITIES545[offer.item])}</strong><small>${duplicate ? barterText545('Уже есть · +1 дубль', 'Already owned · +1 duplicate') : barterText545('Новая вещь в коллекцию', 'A new item for your collection')}</small>
      <button type="button" class="barter545-primary" data-barter545="collector" data-post="${post.id}" ${buttonsBlocked ? 'disabled' : ''}>${barterText545('Взять находку', 'Take the collectible')}</button></article>`;
  }).join('');
  return `<p>${barterText545('Выбери одну записку в обмен на находку.', 'Choose one reply in exchange for your find.')} <b>${item} ×1</b></p>
    <div class="barter545-notes">${notes}</div>${cancel}`;
}

function barterMarkup545() {
  if (!barterVisible545()) return '';
  const ui = BARTER_UI545, post = ui.board?.post, connected = barterConnected545();
  const title = barterText545('Объявление на столбе', 'Notice on the post');
  const status = post ? barterStatus545(post) : '';
  let body = '';
  if (ui.expanded) {
    if (ui.readFailed) body = `<button type="button" class="barter545-secondary" data-barter545="retry" ${ui.busy ? 'disabled' : ''}>${barterText545('Проверить объявление', 'Check notice')}</button>`;
    else if (connected && !ui.board) body = `<p>${barterText545('Проверяем столб…', 'Checking the post…')}</p>`;
    else if (post) body = barterNotes545(post);
    else if (city() === 'zas') body = barterIdle545(connected);
    else body = `<p>${barterText545('Новые объявления можно вешать в Засранске.', 'You can post new notices in Zasransk.')}</p>`;
  }
  const messages = { returned: barterText545('Вещь снова в сумке.', 'Your item is back in your bag.'),
    meal: barterText545('Обмен с пекарем завершён.', 'Trade with the baker complete.'),
    collector: barterText545('Обмен с коллекционером завершён.', 'Trade with the collector complete.') };
  if (ui.receipt?.food > 0) {
    const gain = barterFood545(ui.receipt.food);
    messages.meal += ' ' + barterText545(`Сытость +${gain}.`, `Fullness +${gain}.`);
  }
  if (ui.receipt?.collectible && BARTER_RARITIES545[ui.receipt.collectible]) {
    messages.collector += ' ' + barterText545(...BARTER_RARITIES545[ui.receipt.collectible]) + '.';
  }
  if (ui.receipt?.setCompleted && ui.receipt.caps > 0) {
    messages.collector += ' ' + barterText545(`Набор собран! +${fmt(ui.receipt.caps)} крышки.`, `Set complete! +${fmt(ui.receipt.caps)} caps.`);
  } else if (ui.receipt?.duplicate) {
    messages.collector += ' ' + barterText545('Получен дубль.', 'Duplicate collected.');
  }
  return `<section id="barter545" data-i18n-ignore>
    <button type="button" class="barter545-toggle" data-barter545="toggle" aria-expanded="${ui.expanded}" aria-controls="barter545Body">
      <img src="assets/barter545-post.svg" width="44" height="44" alt=""><span><strong>${title}</strong>${status ? `<small>${status}</small>` : ''}</span><i aria-hidden="true"></i>
    </button>
    <div id="barter545Body" aria-busy="${ui.busy}" ${ui.expanded ? '' : 'hidden'}>${ui.error ? `<p role="status" class="barter545-alert">${barterText545(...(BARTER_ERRORS545[ui.error] || BARTER_ERRORS545.unavailable))}</p>` : ''}
      ${ui.message ? `<p role="status" class="barter545-result">${messages[ui.message]}</p>` : ''}${body}</div></section>`;
}

const barterMarketBefore545 = EXTRA_TABS.fun.market;
EXTRA_TABS.fun.market = () => barterMarketBefore545().replace('<div class="subhead">', () => `<div id="barter545Mount">${barterMarkup545()}</div><div class="subhead">`);

function barterPaint545(focus, inventoryChanged = false) {
  if (!barterMarket545()) return;
  const mount = $('barter545Mount');
  if (!mount) return;
  const active = document.activeElement;
  const radio = mount.contains(active) && active.name === 'barter545-source' ? active.value : '';
  focus ||= mount.contains(active) ? active.dataset.barter545 : '';
  if (inventoryChanged) renderCurrent(false);
  else mount.innerHTML = barterMarkup545();
  if (radio && Object.hasOwn(BARTER_ITEMS545, radio)) {
    document.querySelector(`#barter545 input[value="${radio}"]:not(:disabled)`)?.focus({preventScroll: true});
  }
  if (focus) {
    const node = document.querySelector(`#barter545 [data-barter545="${focus}"]:not(:disabled)`) || document.querySelector('#barter545 .barter545-toggle');
    node?.focus({preventScroll: true});
    if (inventoryChanged && node) node.scrollIntoView({block: 'nearest'});
  }
}

async function barterRequest545(action, id) {
  const ui = BARTER_UI545;
  if (ui.busy || !barterConnected545()) return;
  const focus = document.activeElement?.dataset.barter545;
  let inventoryChanged = false;
  ui.busy = true; ui.error = ''; ui.readFailed = false;
  if (action !== 'read') { ui.message = ''; ui.receipt = null; }
  if (ui.expanded) barterPaint545();
  try {
    let board;
    if (action === 'read') board = await barter545Read();
    else if (action === 'post') board = await barter545Post(id);
    else if (action === 'cancel') board = await barter545Cancel(id);
    else board = await barter545Claim(id, action);
    ui.board = board;
    ui.receivedAt = performance.now();
    if (action !== 'read') { ui.receipt = board.receipt; inventoryChanged = true; }
    if (action === 'cancel') ui.message = 'returned';
    else if (action === 'meal' || action === 'collector') ui.message = action;
  } catch (err) {
    ui.error = Object.hasOwn(BARTER_ERRORS545, err?.code) ? err.code : 'unavailable';
    ui.readFailed = true;
  } finally {
    ui.busy = false;
    ui.nextRead = performance.now() + 60000;
    ui.clockLabel = '';
    barterPaint545(document.activeElement === document.body ? focus : '', inventoryChanged);
  }
}

HOOKS.init.push(() => {
  const market = $('funList');
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && barterMarket545() && barterConnected545() && !BARTER_UI545.busy) barterRequest545('read');
  });
  market.addEventListener('change', event => {
    if (event.target.matches('#barter545 input[name="barter545-source"]')) {
      BARTER_UI545.selected = event.target.value;
      barterPaint545();
    }
  });
  market.addEventListener('click', event => {
    const button = event.target.closest('#barter545 [data-barter545]');
    if (!button || button.disabled) return;
    const ui = BARTER_UI545, action = button.dataset.barter545;
    if (action === 'toggle') {
      ui.expanded = !ui.expanded;
      if (ui.expanded && barterConnected545() && !ui.busy) barterRequest545('read');
      else barterPaint545('toggle');
    } else if (action === 'retry') barterRequest545('read');
    else if (action === 'post') {
      const item = market.querySelector('#barter545 input:checked')?.value;
      if (Object.hasOwn(BARTER_ITEMS545, item)) barterRequest545(action, item);
    } else if (['cancel', 'meal', 'collector'].includes(action)) {
      const id = Number(button.dataset.post);
      if (ui.board?.post?.id === id) barterRequest545(action, id);
    }
  });
});
HOOKS.screen.push(() => {
  const ui = BARTER_UI545;
  if (!barterMarket545()) { ui.expanded = false; ui.message = ''; return; }
  if (barterConnected545() && !ui.busy && (city() !== 'zas' || ui.expanded || !ui.board || performance.now() >= ui.nextRead)) barterRequest545('read');
});
HOOKS.tick.push(() => {
  const ui = BARTER_UI545, post = ui.board?.post;
  if (!barterMarket545() || ui.busy || ui.readFailed || !post || document.hidden) return;
  if (!ui.expanded) {
    const label = document.querySelector('#barter545 .barter545-toggle small');
    const text = barterStatus545(post);
    if (label && label.textContent !== text) label.textContent = text;
    return;
  }
  const minutes = barterRemaining545(post);
  const meal = !minutes && post.offers.find(offer => offer.id === 'meal');
  const label = [minutes, meal && barterFood545(Math.min(meal.food, Math.max(0, maxFood() - S.food))), I18N.lang].join(':');
  if (ui.clockLabel && ui.clockLabel !== label) barterPaint545(document.activeElement?.dataset.barter545);
  ui.clockLabel = label;
});
