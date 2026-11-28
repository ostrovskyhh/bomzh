// Personal glassworks. The batch and finished lamps always come from the saved profile.
const glassText546 = redesign536Text;
const glassModeNames546 = {
  kiln: ['Вторая печь', 'Second furnace'],
  rack: ['Большой стеллаж', 'Large rack'],
};
const glassPatternNames546 = {
  amber: ['Янтарные ромбы', 'Amber diamonds'],
  wave: ['Морская волна', 'Sea wave'],
};
let glassMode546 = 'kiln';

function glassScreen546() { return currentScreen === 'tasks' && TABS.tasks === 'glass546'; }
function glassMinutes546(ms) {
  const minutes = Math.ceil(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const parts = [];
  if (hours) parts.push(glassText546(hours + ' ч', hours + 'h'));
  if (!hours || rest) parts.push(glassText546(rest + ' мин', rest + 'm'));
  return parts.join(' ');
}

function glassScene546(view, mode) {
  return glassWorkshopArt546({
    module: mode,
    produced: view.active?.ready || 0,
    capacity: GLASS546_MODES[mode].cap,
    active: !!view.active,
  });
}

function glassModeChoice546(mode) {
  const {rate, cap} = GLASS546_MODES[mode];
  return `<label class="gl546-choice"><input type="radio" name="glass546-mode" value="${mode}" ${mode === glassMode546 ? 'checked' : ''}>
    <span><b>${glassText546(...glassModeNames546[mode])}</b><small>${glassText546(`За час · ${rate}`, `In 1 hour · ${rate}`)}</small><small>${glassText546(`На полке до ${cap}`, `Rack holds ${cap}`)}</small></span></label>`;
}

function glassDesign546(view, pattern) {
  const owned = view.patterns.includes(pattern);
  const equipped = view.equipped === pattern;
  const title = glassText546(...glassPatternNames546[pattern]);
  const action = owned ? 'glassEquip546' : 'glassCraft546';
  const label = equipped ? glassText546('У лавки', 'On display') : owned ? glassText546('Поставить', 'Display') : glassText546('Сделать', 'Craft');
  const cost = owned ? '' : `<small>${glassText546('Стекло', 'Glass')} · ${view.craftCost}</small>`;
  const disabled = equipped || (!owned && view.stock < view.craftCost);
  return `<article class="gl546-design ${equipped ? 'gl546-equipped' : ''}" data-design="${pattern}">
    <span class="gl546-lamp">${glassLampArt546(pattern)}</span>
    <b>${title}</b>${cost}<button type="button" class="gl546-secondary" data-act="${action}" data-id="${pattern}"
      aria-label="${label} · ${title}" ${disabled ? 'disabled' : ''}>${label}</button></article>`;
}

function glassBatchText546(active, clockReady) {
  if (!clockReady) return glassText546('Проверяем время, чтобы посчитать готовое стекло.', 'Checking the time to count your finished glass.');
  if (active.ready === active.cap) return glassText546('Полка полна. Печь остановилась, стекло подождёт.', 'The rack is full. The furnace has stopped and your glass will wait.');
  return glassText546(`Следующее стекло через ${glassMinutes546(active.nextMs)}. Полка заполнится через ${glassMinutes546(active.remainingMs)}.`,
    `Next pane in ${glassMinutes546(active.nextMs)}. Rack full in ${glassMinutes546(active.remainingMs)}.`);
}

function glassWorkshop546() {
  const view = glass546View();
  if (!view.eligible) return '';
  const active = view.active;
  const mode = active?.mode || glassMode546;
  const title = active ? glassText546(...glassModeNames546[mode]) : glassText546('Начать партию', 'Start a batch');
  const stock = glassText546(`В запасе · ${view.stock}`, `Glass in stock · ${view.stock}`);
  const retry = !view.clockReady ? `<button type="button" class="gl546-secondary gl546-clock" data-act="glassClock546">${glassText546('Проверить время', 'Check time')}</button>` : '';
  const clockHint = !view.clockReady && !active ? `<p class="gl546-caption">${glassText546('Для запуска нужно сверить время. Проверь соединение.', 'Connect to check the time before starting a batch.')}</p>` : '';
  const last = view.last;
  const receipt = !active && last ? `<p class="gl546-receipt" tabindex="-1">${glassText546(
    `Последняя партия: +${last.count} в запас. ${last.full ? 'Печь заполнила всю полку.' : 'Партию забрали до заполнения полки.'}`,
    `Last batch: +${last.count} in stock. ${last.full ? 'The furnace filled the entire rack.' : 'You collected before the rack filled up.'}`)}</p>` : '';
  const costLine = !view.patterns.length
    ? glassText546('Выбери узор для первого фонаря. Понадобится 8 стёкол.', 'Choose your first lantern pattern. It takes 8 panes.')
    : view.patterns.length === 1 ? glassText546('Второй узор можно выдуть из 16 стёкол.', 'Craft the second design with 16 panes.') : '';
  const home = view.patterns.length ? `<button type="button" class="gl546-home" data-act="glassHome546">${glassText546('Посмотреть у лавки', 'See it by the bench')} <span aria-hidden="true">↗</span></button>` : '';
  return `<section id="glass546" data-i18n-ignore aria-label="${glassText546('Стекольная артель', 'Glassworks')}">
    <section class="gl546-station">
      <div id="glass546Scene" aria-hidden="true">${glassScene546(view, mode)}</div>
      <div class="gl546-body"><div class="gl546-heading"><h3>${title}</h3><span class="gl546-stock">${stock}</span></div>
      ${active ? `<div class="gl546-batch"><div class="gl546-meter-head"><span>${glassText546('Стёкол на полке','Panes on rack')}</span><strong id="glass546Count" tabindex="-1">${view.clockReady ? active.ready : '…'} / ${active.cap}</strong></div>
        <progress id="glass546Meter" max="${active.cap}" ${view.clockReady ? 'value="' + active.ready + '"' : ''} aria-label="${glassText546('Полка','Rack')}"></progress>
        <p id="glass546Time" class="gl546-caption">${glassBatchText546(active,view.clockReady)}</p>
        <button type="button" class="gl546-primary" data-act="glassCollect546" data-id="${active.id}" ${!view.clockReady || active.ready < 1 ? 'disabled' : ''}>${glassText546('Забрать и завершить партию', 'Collect and finish batch')}</button></div>`
      : `<fieldset class="gl546-modes"><legend>${glassText546('Чем оснастить мастерскую?', 'How will you set up the workshop?')}</legend><div>${Object.keys(GLASS546_MODES).map(glassModeChoice546).join('')}</div></fieldset>
        <p class="gl546-caption gl546-materials">${glassText546('Стеклобой бесплатный. За ночь печь заполнит полку и остановится.', 'Scrap glass is free. Overnight the furnace fills the rack, then stops.')}</p>
        <button type="button" class="gl546-primary" data-act="glassStart546" ${view.clockReady ? '' : 'disabled'}>${glassText546('Разжечь печь', 'Light the furnace')}</button>`}
      ${clockHint}${retry}${receipt}</div></section>
    <section class="gl546-cabinet"><div class="gl546-heading"><h3>${glassText546('Фонарь у лавки', 'Lantern by the bench')}</h3>${home}</div>
      ${costLine ? `<p class="gl546-caption">${costLine}</p>` : ''}
      <div class="gl546-designs">${GLASS546_PATTERNS.map(p => glassDesign546(view,p)).join('')}</div></section>
  </section>`;
}

// Keep the clock, controls and focus in place while a batch is running.
function glassUpdate546() {
  if (currentScreen === 'hub' && BNAV.hub === 'goals') {
    const status = $('hubList')?.querySelector('[data-id="tasks:glass546"] small');
    if (status && S.glass546?.active) {
      const text = glassTileStatus546();
      if (status.textContent !== text) status.textContent = text;
    }
    return;
  }
  const panel = $('glass546');
  if (!panel || !glassScreen546() || document.hidden) return;
  const view = glass546View();
  const button = panel.querySelector('[data-act="glassCollect546"]');
  if ((!view.clockReady) !== !!panel.querySelector('.gl546-clock') || (!!view.active !== !!button)) {
    renderCurrent(false);
    return;
  }
  if (!view.active || !button) return;
  const active = view.active;
  const count = (view.clockReady ? active.ready : '…') + ' / ' + active.cap;
  if ($('glass546Count').textContent !== count) {
    $('glass546Count').textContent = count;
    if (view.clockReady) $('glass546Meter').value = active.ready;
    $('glass546Scene').innerHTML = glassScene546(view, active.mode);
  }
  const time = glassBatchText546(active, view.clockReady);
  if ($('glass546Time').textContent !== time) $('glass546Time').textContent = time;
  button.disabled = !view.clockReady || active.ready < 1;
}

function glassAction546(result, nextSelector) {
  if (!result.ok) {
    const reason = {
      clock: ['Сначала проверь время.', 'Check the time first.'],
      materials: ['Не хватает готового стекла.', 'You need more finished glass.'],
      busy: ['Дождись сохранения профиля.', 'Wait for your profile to sync.'],
      empty: ['Первое стекло ещё не готово.', 'The first pane is still cooling.'],
    }[result.code] || ['Состояние артели изменилось. Проверь мастерскую.', 'The workshop has changed. Check its current state.'];
    toast(glassText546(...reason), 'bad');
  }
  if (result.ok && nextSelector) requestAnimationFrame(() => {
    if (glassScreen546()) document.querySelector(nextSelector)?.focus({preventScroll:true});
  });
}

Object.assign(ACTIONS, {
  glassOpen546: () => { if (glass546Eligible()) showScreen('tasks', 'glass546'); },
  glassStart546: () => glassAction546(glass546Start(glassMode546), '#glass546Count'),
  glassCollect546: id => glassAction546(glass546Collect(Number(id)), '#glass546 .gl546-receipt'),
  glassCraft546: id => {
    const result = glass546Craft(id);
    glassAction546(result, '#glass546 .gl546-home');
    if (result.ok) requestAnimationFrame(() => {
      const preview = document.querySelector(`#glass546 [data-design="${id}"] .gl546-lamp`);
      if (preview) preview.innerHTML = glassForgeArt546(id);
    });
  },
  glassEquip546: id => glassAction546(glass546Equip(id), '#glass546 .gl546-home'),
  glassHome546: () => showScreen('game'),
  glassClock546: async () => { await businessSync(); if (glassScreen546()) renderCurrent(false); },
});

const glassTile546 = {s:'tasks', t:'glass546', n:'Стекольная артель', e:'🏮'};
function glassTileStatus546() {
  const view = glass546View();
  if (!view.active) return '';
  if (!view.clockReady) return glassText546('Партия в работе','Batch in progress');
  if (view.active.ready === view.active.cap) return glassText546('Полка полна','Rack full');
  return glassText546(`На полке ${view.active.ready}/${view.active.cap}`,`${view.active.ready}/${view.active.cap} on rack`);
}
BETA_STATUS['tasks:glass546'] = glassTileStatus546;
BETA_HUBS.find(h => h.id === 'goals').groups.find(([, tiles]) => tiles.some(t => t.t === 'prestige'))[1].push(glassTile546);
const glassTileShownBefore546 = betaTileShown;
betaTileShown = tile => tile === glassTile546 ? glass546Eligible() : glassTileShownBefore546(tile);
const glassOrder546 = courtyardHubLayouts539.goals.order;
glassOrder546.splice(glassOrder546.indexOf('tasks:story')+1, 0, 'tasks:glass546');
EXTRA_TABS.tasks.glass546 = glassWorkshop546;

function glassLink546() {
  return `<button type="button" class="btn wide gl546-entry" data-act="glassOpen546" data-i18n-ignore>🏮 ${glassText546('Стекольная артель', 'Glassworks')}</button>`;
}
const glassPrestigeBefore546 = EXTRA_TABS.tasks.prestige;
EXTRA_TABS.tasks.prestige = () => (glass546Eligible() ? glassLink546() : '') + glassPrestigeBefore546();
const glassStoryBefore546 = EXTRA_TABS.tasks.story;
EXTRA_TABS.tasks.story = () => {
  const html = glassStoryBefore546();
  if (!glass546Eligible() || city() !== 'cn' || currentQuest()) return html;
  return html.replace('<button class="btn wide" data-act="worldPrestige50">', glassLink546() + '<button class="btn wide" data-act="worldPrestige50">');
};

const glassHubLockBefore546 = showHubLock545;
showHubLock545 = function (id, focus = true) {
  glassHubLockBefore546(id, focus);
  const hint = $('hubLock545');
  hint?.querySelector('.gl546-entry')?.remove();
  if (id === 'goals' && glass546Eligible()) hint?.insertAdjacentHTML('beforeend', glassLink546());
};
const glassHubBefore546 = ACTIONS.betaHub;
ACTIONS.betaHub = id => {
  if (id === 'goals' && glassScreen546() && !hubOpen528(id)) showScreen('game');
  return glassHubBefore546(id);
};

HOOKS.init.push(() => {
  $('tasksList').addEventListener('change', event => {
    if (!event.target.matches('#glass546 input[name="glass546-mode"]')) return;
    glassMode546 = event.target.value;
    $('glass546Scene').innerHTML = glassScene546(glass546View(), glassMode546);
  });
});
HOOKS.screen.push(() => {
  if (!glassScreen546()) return;
  if (!glass546View().clockReady) businessSync().then(glassUpdate546);
});
HOOKS.tick.push(glassUpdate546);
document.addEventListener('game-language-change', () => {
  if (glassScreen546()) { renderCurrent(false); betaBackBar('tasks'); }
});
