// An optional route advances only after its current stop is started and completed.
const VALERA_ROUTE536_DAY = 24 * 3600000;
const VALERA_ROUTE536_CITY_PAY = [120, 240, 500, 1200, 2700, 6000];
const VALERA_ROUTE536_STEPS = {
  search: { event: 'trash', text: ['Обыскать мусорку', 'Search the bins'], open: () => openTrash(), available: () => cdLeft('trash') <= 0 },
  trade: { event: 'sold', amount: 10, text: ['Продать хотя бы 10 бутылок одним обменом', 'Sell at least 10 bottles in one trade'], open: () => openExchange() },
  exercise: { event: 'gymGame', text: ['Закончить тренировку в спортзале', 'Finish a gym workout'], open: () => showScreen('life', 'gym') },
  shift: { event: 'shift', text: ['Отработать смену с положительным результатом', 'Finish a scored work shift'], open: () => showScreen('life', 'work') },
  story: { event: 'questDone', text: ['Закончить текущую главу сюжета', 'Finish your current story chapter'], open: () => ACTIONS.openQuest() },
  garage: { events: ['neighborhood534FirstOrder', 'neighborhood534LocalOrder'], text: ['Выполнить заказ в гараже', 'Finish a garage order'], open: () => ACTIONS.neighborhood534Open('garage') },
  network: { events: ['neighborhood534NetworkFirstOrder', 'neighborhood534NetworkOrder'], text: ['Выполнить заказ Сети Валеры', 'Finish a network order'], open: () => ACTIONS.neighborhood534Open('network') },
};
const VALERA_ROUTE536_PLANS = {
  street: { title: ['Находки двора', 'Yard finds'], text: ['Проверь, что выбросили соседи, и отнеси стекло на обмен.', 'See what the neighbors threw away and trade in some glass.'], steps: ['search', 'trade'], pay: 1 },
  fitness: { title: ['Дворовая разминка', 'A yard workout'], text: ['Сначала обойди двор, затем закончи тренировку. Подойдёт бесплатный турник.', 'Make a round of the yard, then finish a workout. The free pull-up bar counts.'], steps: ['search', 'exercise'], pay: 1.1 },
  work: { title: ['После смены', 'After the shift'], text: ['Сыграй рабочую смену с результатом и заверши тренировкой.', 'Score in a work shift, then finish with a workout.'], steps: ['shift', 'exercise'], pay: 1.4 },
  chapter: { title: ['Новая глава', 'A new chapter'], text: ['Продвинься в истории Валеры и закончи дело у обменщика.', 'Continue Valera’s story and finish up at the bottle exchange.'], steps: ['story', 'trade'], pay: 1.5 },
  garage: { title: ['Дела Михалыча', 'Mikhailych’s errands'], text: ['Один заказ в гараже и один визит в пункт обмена.', 'Finish a garage order, then visit the bottle exchange.'], steps: ['garage', 'trade'], pay: 1.5 },
  network: { title: ['Поручение из другого города', 'An order from another city'], text: ['Закончи межгородской заказ, затем разомнись на тренировке.', 'Complete an intercity order, then finish a workout.'], steps: ['network', 'exercise'], pay: 1.6 },
  long: { title: ['Три остановки', 'Three stops'], text: ['Круг по двору, обмен и тренировка. Весь маршрут можно пройти без покупок.', 'Make a round of the yard, trade bottles and work out. You can do it all without purchases.'], steps: ['search', 'trade', 'exercise'], pay: 1.8 },
};

function valeraRoute536Text(ru, en) {
  return typeof I18N !== 'undefined' && I18N.lang === 'en' ? en : ru;
}

function valeraRoute536State() {
  const state = S.valeraRoute536;
  return state && typeof state === 'object' && !Array.isArray(state) ? state : {};
}

function valeraRoute536Count(state = valeraRoute536State()) {
  return Number.isSafeInteger(state.count) && state.count > 0 ? state.count : 0;
}

function valeraRoute536Active(state) {
  const active = state.active;
  if (!Object.hasOwn(VALERA_ROUTE536_PLANS, active?.id) || !Object.hasOwn(CITIES, active.city)) return null;
  return Number.isInteger(active.step) && active.step >= 0 && active.step <= VALERA_ROUTE536_PLANS[active.id].steps.length ? active : null;
}

function valeraRoute536Unlocked() {
  if (!S.storySeen || (S.tut && !S.tut.done)) return false;
  const state = valeraRoute536State();
  return !!(valeraRoute536Count(state) || valeraRoute536Active(state) || neighborhood534Unlocked());
}

function valeraRoute536Playable() {
  return valeraRoute536Unlocked() && !SAVE_LOCK && !ALT_SAVE && !S.busy;
}

function valeraRoute536Offers(count, location) {
  const neighbors = neighborhood534View();
  const electives = [];
  if (JOBS.some((job) => reqOk(job.req))) electives.push('work');
  if (currentQuest()) electives.push('chapter');
  if (neighbors.offer || neighbors.active) electives.push('garage');
  if (neighbors.network.offer || neighbors.network.active) electives.push('network');
  if (count >= 6) electives.push('long');
  const free = count % 2 ? 'fitness' : 'street';
  const fallback = free === 'street' ? 'fitness' : 'street';
  const choice = count === 6 ? 'long' : electives.length ? electives[(count + CITIES[location].idx) % electives.length] : fallback;
  return [free, choice];
}

function valeraRoute536Pay(plan, location) {
  const idx = CITIES[location].idx;
  return Math.round((VALERA_ROUTE536_CITY_PAY[idx] || VALERA_ROUTE536_CITY_PAY[0]) * plan.pay);
}

function valeraRoute536Money(plan, location) {
  const gross = valeraRoute536Pay(plan, location);
  const net = alimonyOn() ? gross - Math.round(gross * ALIMONY_SHARE) : gross;
  return cityMoney(net, city());
}

function valeraRoute536View(includeChoices = false) {
  if (!valeraRoute536Unlocked()) return null;
  const state = valeraRoute536State();
  const count = valeraRoute536Count(state);
  const active = valeraRoute536Active(state);
  const plan = active && VALERA_ROUTE536_PLANS[active.id];
  const next = plan && VALERA_ROUTE536_STEPS[plan.steps[active.step]];
  const ready = !!plan && !next;
  const now = businessNow();
  const minutes = Number.isFinite(now) ? Math.max(0, Math.ceil(((state.readyAt || 0) - now) / 60000)) : 0;
  const cooling = !plan && (minutes > 0 || (!!state.readyAt && !Number.isFinite(now)));
  const title = valeraRoute536Text('Маршрут Валеры', 'Valera’s route');
  const choose = valeraRoute536Text('Выбери, чем заняться', 'Choose what to do');
  const claim = valeraRoute536Text('Забрать оплату за маршрут', 'Collect your route payment');
  const online = valeraRoute536Text('Подключись для получения оплаты', 'Connect to collect payment');
  const waitTime = `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
  const cooldown = Number.isFinite(now)
    ? valeraRoute536Text(`Новый маршрут через ${waitTime}`, `New route in ${waitTime}`)
    : valeraRoute536Text('Подключись, чтобы увидеть следующий маршрут', 'Connect to see your next route');
  return {
    title, action: 'valeraRoute536Open', active, plan, next, count, ready, cooling, minutes, hasClock: Number.isFinite(now),
    canClaim: ready && Number.isFinite(now),
    subtitle: next ? valeraRoute536Text(...next.text) : ready ? (Number.isFinite(now) ? claim : online) : cooling ? cooldown : choose,
    choices: includeChoices && !plan && !cooling ? valeraRoute536Offers(count, city()) : [],
  };
}

function valeraRoute536Button(text, action, id = '', cls = '') {
  return `<button type="button" class="btn ${cls}" data-act="${action}" data-id="${esc(id)}">${esc(text)}</button>`;
}

function valeraRoute536ModalStatus(view) {
  return [view.active?.id, view.active?.step, view.active?.armed, view.count,
    view.minutes, view.hasClock, view.next?.available?.(), view.canClaim].join(':');
}

function valeraRoute536Markup(view, confirm = false) {
  const { active, plan, next, cooling, ready, count, canClaim } = view;
  const money = (value, location) => valeraRoute536Text(`На руки ${valeraRoute536Money(value, location)}`, `Take home ${valeraRoute536Money(value, location)}`);
  const summary = plan ? `<h4>${esc(valeraRoute536Text(...plan.title))}</h4><p>${esc(money(plan, active.city))}</p>
    <ol>${plan.steps.map((key, index) => `<li class="${index < active.step ? 'vr536-done' : index === active.step ? 'vr536-current' : ''}" ${index === active.step ? 'aria-current="step"' : ''}>${esc(valeraRoute536Text(...VALERA_ROUTE536_STEPS[key].text))}</li>`).join('')}</ol>` : '';
  const alternatives = view.choices.map((id) => {
    const choice = VALERA_ROUTE536_PLANS[id];
    return `<article><h4>${esc(valeraRoute536Text(...choice.title))}</h4>
      <p>${esc(valeraRoute536Text(...choice.text))}</p><p>${esc(money(choice, city()))}</p>
      ${valeraRoute536Button(valeraRoute536Text('Выбрать', 'Choose'), 'valeraRoute536Choose', id, 'wide')}</article>`;
  }).join('');
  const play = next && (!next.available || next.available()) ? valeraRoute536Button(
    active.armed ? valeraRoute536Text('Вернуться к делу', 'Return to this stop') : valeraRoute536Text('Перейти к делу', 'Go to this stop'), 'valeraRoute536Step', '', 'primary wide') : '';
  const take = canClaim ? valeraRoute536Button(valeraRoute536Text('Забрать оплату', 'Collect payment'), 'valeraRoute536Claim', '', 'primary wide') : '';
  const abandon = plan && !ready ? valeraRoute536Button(valeraRoute536Text('Выбрать другой маршрут', 'Choose a different route'), 'valeraRoute536ConfirmDrop') : '';
  const badge = count < 3 ? valeraRoute536Text(`Аватар «Знаток района» за 3 маршрута · ${count}/3`, `Neighborhood guide avatar after 3 routes · ${count}/3`)
    : count < 6 ? valeraRoute536Text(`Аватар открыт. Маршрут из трёх дел за 6 прохождений · ${count}/6`, `Avatar unlocked. Three-stop route after 6 completions · ${count}/6`)
      : valeraRoute536Text(`Пройдено маршрутов: ${count}`, `Routes completed: ${count}`);
  const notice = cooling || (ready && !canClaim) ? view.subtitle
    : next?.available && !next.available() ? valeraRoute536Text('Мусорка пока закрыта. Можно вернуться позже.', 'The bins are on cooldown. Come back later.') : '';
  return `<section class="vr536" data-valera-route536="${confirm ? 'confirm' : 'plan'}" data-status="${esc(valeraRoute536ModalStatus(view))}" data-i18n-ignore><h3>${esc(view.title)}</h3>
    ${confirm ? `<p>${esc(valeraRoute536Text('Начать другой маршрут? Выполненные дела в игре сохранятся. Текущий маршрут будет сброшен.', 'Start another route? Everything you did in the game stays. This route will restart.'))}</p>
      <div class="vr536-actions">${valeraRoute536Button(valeraRoute536Text('Начать другой', 'Start another'), 'valeraRoute536Drop', '', 'primary')}${valeraRoute536Button(valeraRoute536Text('Назад', 'Back'), 'valeraRoute536Open')}</div>`
    : `${summary}<div class="vr536-choices">${alternatives}</div>${notice ? `<p>${esc(notice)}</p>` : ''}${play}${take}
      <p class="vr536-badge">${esc(badge)}</p><div class="vr536-actions">${abandon}${valeraRoute536Button(valeraRoute536Text('Закрыть', 'Close'), 'close')}</div>`}</section>`;
}

function valeraRoute536Show(confirm = false) {
  const view = valeraRoute536View(true);
  if (!view) return;
  const existing = document.querySelector('[data-valera-route536]');
  const markup = valeraRoute536Markup(view, confirm);
  if (existing) existing.outerHTML = markup;
  else openModal(markup, { center: true });
}

Object.assign(ACTIONS, {
  valeraRoute536Open: () => valeraRoute536Show(),
  valeraRoute536Choose: (id) => {
    const view = valeraRoute536View(true);
    if (!valeraRoute536Playable() || !view?.choices.includes(id)) return;
    const state = S.valeraRoute536 = valeraRoute536State();
    state.active = { id, city: city(), step: 0, armed: false };
    save(true);
    valeraRoute536Show();
  },
  valeraRoute536Step: () => {
    const view = valeraRoute536View();
    if (!valeraRoute536Playable() || !view?.next || (view.next.available && !view.next.available())) return;
    view.active.armed = true;
    save(true);
    closeModal();
    view.next.open();
  },
  valeraRoute536Claim: () => {
    const view = valeraRoute536View();
    const now = businessNow();
    if (!valeraRoute536Playable() || !view?.canClaim || !Number.isFinite(now)) return;
    const state = valeraRoute536State();
    const before = S.money;
    state.active = null;
    state.count = view.count + 1;
    state.readyAt = Math.floor(now) + VALERA_ROUTE536_DAY;
    addMoney(valeraRoute536Pay(view.plan, view.active.city));
    save(true);
    toast(valeraRoute536Text(`Маршрут закончен · +${cityMoney(S.money - before)}`, `Route complete · +${cityMoney(S.money - before)}`), 'good');
    valeraRoute536Show();
  },
  valeraRoute536ConfirmDrop: () => valeraRoute536Show(true),
  valeraRoute536Drop: () => {
    const view = valeraRoute536View();
    if (!valeraRoute536Playable() || !view?.active || view.ready) return;
    valeraRoute536State().active = null;
    save(true);
    valeraRoute536Show();
  },
});

HOOKS.track.push((event, amount) => {
  if (SAVE_LOCK || ALT_SAVE) return;
  const active = valeraRoute536Active(valeraRoute536State());
  if (!active?.armed) return;
  const step = VALERA_ROUTE536_STEPS[VALERA_ROUTE536_PLANS[active.id].steps[active.step]];
  if (!step || (step.event !== event && !step.events?.includes(event)) || (step.amount && !(amount >= step.amount))) return;
  active.armed = false;
  active.step++;
  save(true);
  toast(valeraRoute536Text('Остановка маршрута пройдена', 'Route stop complete'), 'good');
});

HOOKS.tick.push(() => {
  const shown = document.querySelector('[data-valera-route536="plan"]');
  if (!shown) return;
  const view = valeraRoute536View();
  if (view && shown.dataset.status !== valeraRoute536ModalStatus(view)) valeraRoute536Show();
});

AVATARS.push({
  id: 'neighborhoodGuide536', face: '🧭', need: () => valeraRoute536Count() >= 3 || (S.prestigeAvatars || []).includes('neighborhoodGuide536'),
  get name() { return valeraRoute536Text('Знаток района', 'Neighborhood guide'); },
  get how() { return valeraRoute536Text('Пройти 3 маршрута Валеры', 'Finish 3 of Valera’s routes'); },
});

const valeraRoute536Prestige = prestigeProfile;
prestigeProfile = function () {
  const profile = valeraRoute536Prestige();
  if (S.valeraRoute536) profile.valeraRoute536 = S.valeraRoute536;
  return profile;
};

const valeraRoute536Goals = BETA_HUBS.find((hub) => hub.id === 'goals');
if (valeraRoute536Goals) {
  valeraRoute536Goals.groups[0][1].push({
    act: 'valeraRoute536Open', id: 'valeraRoute536', e: '🧭',
    get hide() { return !valeraRoute536Unlocked(); },
    get n() { return valeraRoute536Text('Маршрут Валеры', 'Valera’s route'); },
  });
  BETA_STATUS['act:valeraRoute536'] = () => valeraRoute536View()?.subtitle || '';
}
