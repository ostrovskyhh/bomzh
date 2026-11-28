// The courtyard uses the existing hub destinations, statuses and unlocks.
const courtyardHubLayouts539 = {
  me: {
    order: ['shop:housing', 'shop:clothes', 'shop:transport', 'act:neighborhood534Open', 'act:personalNetwork534', 'shop:pets', 'shop:food', 'life:skills', 'life:health', 'life:gym', 'act:bottleShop', 'shop:season'],
    wide: ['shop:season'],
  },
  money: {
    order: ['life:business', 'life:work', 'life:study', 'fun:market', 'act:flea', 'act:financeExchange535', 'act:honest68Open', 'fun:crime'],
    wide: ['fun:crime'],
    primary: 'life:business',
  },
  fun: {
    order: ['fun:casino', 'fun:lotto', 'fun:fights', 'fun:rest', 'fun:dates', 'act:frTown', 'act:worldTown50'],
    wide: ['fun:dates', 'act:frTown', 'act:worldTown50'],
  },
  people: {
    order: ['fun:friends', 'act:openChat', 'tasks:top'],
    wide: [],
    primary: 'fun:friends',
  },
  goals: {
    order: ['tasks:story', 'tasks:side', 'tasks:tasks', 'tasks:pass', 'tasks:ach', 'tasks:coll', 'tasks:prestige', 'act:valeraRoute536Open'],
    wide: ['tasks:story'],
  },
};

function courtyardStoryProgress539(tile) {
  const quest = currentQuest();
  if (!tile || !quest?.goals?.length) return;
  // Mirror the story screen's per-goal progress, without adding a new objective.
  const goals = quest.goals.filter(goal => goal.need > 0).map(goal => ({goal, current: Math.min(goal.need, Math.max(0, goal.cur()))}));
  const active = goals.find(({goal, current}) => current < goal.need) || goals.at(-1);
  if (!active) return;
  const {goal, current} = active;
  const details = tile.querySelector('.bh-t');
  const label = document.createElement('small');
  label.className = 'courtyard-goal539';
  label.textContent = goal.key === 'taps' && I18N.lang === 'en' ? `Tap ${fmt(goal.need)} times` : goal.text;
  const progress = document.createElement('div');
  progress.className = 'courtyard-progress539';
  const meter = document.createElement('progress');
  meter.max = goal.need;
  meter.value = current;
  meter.setAttribute('aria-hidden', 'true');
  const count = document.createElement('span');
  count.textContent = `${fmt(current)}/${fmt(goal.need)}`;
  progress.append(meter, count);
  details.append(label, progress);
}

function courtyardTileAlert539(tile, active) {
  const dot = tile.querySelector('.bh-dot');
  tile.classList.toggle('alert', active);
  if (!active) dot?.remove();
  else if (!dot) tile.insertAdjacentHTML('afterbegin', '<i class="bh-dot" aria-hidden="true"></i>');
}

function courtyardLottoTile539(casino) {
  const lotto = betaTabBtn('fun', 'lotto');
  if (!casino || !lotto || lotto.classList.contains('hidden')) return null;
  const [icon, name] = betaTileName({s: 'fun', t: 'lotto'});
  const tile = casino.cloneNode(true);
  tile.dataset.id = 'fun:lotto';
  tile.querySelector('.bh-e').textContent = icon;
  tile.querySelector('.bh-t').textContent = '';
  const text = document.createElement('b');
  text.textContent = name;
  tile.querySelector('.bh-t').append(text);
  const alerts = sectionAlerts().fun;
  courtyardTileAlert539(casino, !!alerts?.casino);
  courtyardTileAlert539(tile, !!alerts?.lotto);
  return tile;
}

const courtyardHubBefore539 = RENDER.hub[1];
RENDER.hub[1] = () => {
  const html = courtyardHubBefore539();
  const id = BNAV.hub;
  const layout = courtyardHubLayouts539[id];
  if (!document.body.classList.contains('courtyard539') || !layout) return html;

  const template = document.createElement('template');
  template.innerHTML = html;
  const tiles = [...template.content.querySelectorAll('.bh-tile[data-act][data-id]')];
  if (!tiles.length) return html;
  if (id === 'fun' && !tiles.some(tile => tile.dataset.id === 'fun:lotto')) {
    const lotto = courtyardLottoTile539(tiles.find(tile => tile.dataset.id === 'fun:casino'));
    if (lotto) tiles.push(lotto);
  }
  if (id === 'goals') courtyardStoryProgress539(tiles.find(tile => tile.dataset.id === 'tasks:story'));

  const hub = document.createElement('section');
  hub.className = 'courtyard-hub539';
  hub.dataset.courtyardHub539 = id;
  hub.setAttribute('aria-labelledby', 'courtyardHubTitle539');
  const header = document.createElement('header');
  header.className = 'courtyard-hub-head539';
  const title = document.createElement('h2');
  title.id = 'courtyardHubTitle539';
  title.textContent = BETA_HUBS.find(item => item.id === id).n;
  header.append(title);

  const grid = document.createElement('div');
  grid.className = 'bh-grid courtyard-hub-grid539';
  const rank = new Map(layout.order.map((route, index) => [route, index]));
  tiles.sort((a, b) => (rank.get(a.dataset.id) ?? rank.size) - (rank.get(b.dataset.id) ?? rank.size));
  for (const tile of tiles) {
    const route = tile.dataset.id;
    const primary = route === layout.primary;
    tile.classList.toggle('wide', primary || layout.wide.includes(route));
    tile.classList.toggle('courtyard-hub-primary539', primary);
    tile.querySelector('.bh-e')?.setAttribute('aria-hidden', 'true');
    tile.querySelector('.bh-dot')?.setAttribute('aria-hidden', 'true');
    grid.append(tile);
  }

  hub.append(header, grid);
  return hub.outerHTML;
};
