// Presentation layer for stores, earnings and exchange. The original actions own all transactions.
const CATALOG_SECTIONS536 = {
  'shop:housing': ['Жильё', 'Housing', '🏠'],
  'shop:clothes': ['Одежда', 'Clothes', '👕'],
  'shop:food': ['Еда', 'Food', '🍲'],
  'shop:transport': ['Транспорт', 'Transport', '🛴'],
  'shop:pets': ['Питомцы', 'Pets', '🐾'],
  'shop:bottles': ['Бутылки', 'Bottles', '🍾'],
  'shop:season': ['Сезон', 'Season', '🎃'],
  'life:work': ['Работа', 'Jobs', '🧰'],
  'life:business': ['Бизнес', 'Business', '🏪'],
  'life:study': ['Учёба', 'Study', '🎓'],
  'fun:market': ['Рынок', 'Market', '🦊'],
};
const CATALOG_SHOP536 = Object.keys(CATALOG_SECTIONS536).filter(key => key.startsWith('shop:'));
const CATALOG_EARN536 = ['life:work', 'life:business', 'life:study', 'fun:market'];

function catalogText536(ru, en) {
  return typeof I18N !== 'undefined' && I18N.lang === 'en' ? en : ru;
}

function catalogSectionAllowed536(key) {
  const [screen, tab] = key.split(':');
  const item = betaTabBtn(screen, tab);
  const hub = screen === 'shop' ? 'me' : 'money';
  return item && !item.classList.contains('hidden') && hubOpen528(hub);
}

function catalogNav536(current) {
  const keys = current.startsWith('shop:') ? CATALOG_SHOP536 : CATALOG_EARN536;
  const links = keys.filter(key => key === current || catalogSectionAllowed536(key));
  if (links.length < 2) return '';
  return `<nav class="catalog-tabs536" aria-label="${catalogText536('Разделы', 'Sections')}">
    ${links.map(key => {
      const [ru, en, icon] = CATALOG_SECTIONS536[key];
      return `<button type="button" data-act="catalogOpen536" data-id="${key}" ${key === current ? 'aria-current="page"' : ''}><span aria-hidden="true">${icon}</span>${catalogText536(ru, en)}</button>`;
    }).join('')}
  </nav>`;
}

function catalogBalance536(full = false) {
  return `<div class="catalog-wallet536"${full ? ' data-wallet-full536' : ''}>
    <div><small>${catalogText536('Деньги', 'Cash')}</small><b data-catalog-cash536 data-i18n-ignore>${cityMoney(S.money)}</b></div>
    ${full ? `<div><small>${catalogText536('Бутылки', 'Bottles')}</small><b data-catalog-bottles536>${fmt(S.bottles)}</b></div>` : ''}
    <div><small>${catalogText536('Крышки', 'Caps')}</small><b data-catalog-caps536>${fmt(S.caps)}</b></div>
  </div>`;
}

function catalogShortcuts536(root, key) {
  const targets = [];
  if (key === 'shop:clothes') {
    const slots = [['head', 'Голова', 'Head'], ['body', 'Одежда', 'Clothing'], ['shoes', 'Обувь', 'Shoes']];
    const groups = [...root.children].filter(node => node.matches('.subhead'));
    slots.forEach(([id, ru, en], index) => {
      if (groups[index]) targets.push([id, ru, en, groups[index]]);
    });
    const caps = root.querySelector('.idea-panel')?.closest('details');
    const stars = root.querySelector('[data-act="premiumTab75"][data-id="skins75"]')?.closest('details');
    if (caps) targets.push(['caps', 'За крышки', 'For caps', caps]);
    if (stars) targets.push(['stars', 'За Stars', 'For Stars', stars]);
  }
  if (key === 'life:work') {
    const groups = [...root.children].filter(node => node.matches('.subhead'));
    if (groups[0]) targets.push(['public', 'Госслужба', 'Public jobs', groups[0]]);
    if (groups[1]) targets.push(['private', 'Частные работы', 'Private jobs', groups[1]]);
  }
  if (!targets.length) return '';
  return `<div class="catalog-jumps536">${targets.map(([id, ru, en, node]) => {
    node.dataset.catalogTarget536 = id;
    return `<button type="button" data-catalog-jump536="${id}">${catalogText536(ru, en)}</button>`;
  }).join('')}</div>`;
}

for (const screen of ['shop', 'life', 'fun']) {
  const previous = RENDER[screen][1];
  RENDER[screen][1] = () => {
    const tab = TABS[screen];
    const key = `${screen}:${tab}`;
    const html = previous();
    if (!CATALOG_SECTIONS536[key]) return html;
    const template = document.createElement('template');
    template.innerHTML = html;
    const shortcuts = catalogShortcuts536(template.content, key);
    const wallet = ['work', 'study'].includes(tab) ? '' : catalogBalance536();
    return `<div class="catalog536" data-catalog536="${tab}">${catalogNav536(key)}${wallet}${shortcuts}${template.innerHTML}</div>`;
  };
}

ACTIONS.catalogOpen536 = key => {
  if (!Object.hasOwn(CATALOG_SECTIONS536, key) || !catalogSectionAllowed536(key)) return;
  const [screen, tab] = key.split(':');
  showScreen(screen, tab);
};
function catalogJump536(id) {
  const node = [...document.querySelectorAll('.screen.active [data-catalog-target536]')].find(target => target.dataset.catalogTarget536 === id);
  if (!node) return;
  if (node.matches('details')) node.open = true;
  const target = node.querySelector(':scope > summary') || node;
  if (target === node) target.tabIndex = -1;
  target.focus({preventScroll: true});
  node.scrollIntoView({block: 'start', behavior: 'instant'});
}

HOOKS.init.push(() => {
  document.querySelector('main').addEventListener('click', event => {
    const trigger = event.target.closest('[data-catalog-jump536]');
    if (trigger) catalogJump536(trigger.dataset.catalogJump536);
  });
});

const catalogHubBefore536 = RENDER.hub[1];
RENDER.hub[1] = () => {
  const html = catalogHubBefore536();
  if (BNAV.hub !== 'money') return html;
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelector('.bh-head')?.insertAdjacentHTML('afterend', catalogBalance536(true));
  return `<div class="catalog536 catalog-hub536">${template.innerHTML}</div>`;
};

HOOKS.hud.push(() => {
  const visible = document.querySelector('.screen.active .catalog-wallet536');
  if (!visible) return;
  const cash = visible.querySelector('[data-catalog-cash536]');
  const value = cityMoney(S.money);
  if (cash.textContent.trim() !== value.trim()) cash.textContent = value;
  const caps = visible.querySelector('[data-catalog-caps536]');
  const bottles = visible.querySelector('[data-catalog-bottles536]');
  if (caps.textContent !== fmt(S.caps)) caps.textContent = fmt(S.caps);
  if (bottles && bottles.textContent !== fmt(S.bottles)) bottles.textContent = fmt(S.bottles);
});
