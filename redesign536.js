const redesign536Text = (ru, en) => typeof I18N !== 'undefined' && I18N.lang === 'en' ? en : ru;

const redesign536Labels = {
  home: ['Дом', 'Home'], me: ['Валера', 'Valera'], money: ['Деньги', 'Money'],
  fun: ['Досуг', 'Leisure'], people: ['Люди', 'People'], goals: ['Цели', 'Goals'],
};

function redesign536Navigation() {
  const bar = $('tabbar');
  if (!bar) return;
  for (const item of bar.querySelectorAll('button[data-hub]')) {
    const label = redesign536Labels[item.dataset.hub];
    if (!label) continue;
    let text = item.querySelector('[data-design536-label]');
    if (!text) {
      for (const node of [...item.childNodes]) if (node.nodeType === Node.TEXT_NODE) node.remove();
      text = document.createElement('b');
      text.dataset.design536Label = '';
      text.dataset.i18nIgnore = '';
      item.querySelector('span')?.after(text);
      item.querySelector('span')?.setAttribute('aria-hidden', 'true');
    }
    const translation = redesign536Text(...label);
    if (text.textContent !== translation) text.textContent = translation;
    if (item.dataset.hub === BNAV.hub) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  }
  let brand = bar.querySelector('.design536-brand');
  if (!brand) {
    brand = document.createElement('div');
    brand.className = 'design536-brand';
    brand.dataset.i18nIgnore = '';
    brand.innerHTML = '<i aria-hidden="true">⌂</i><b></b>';
    bar.prepend(brand);
  }
  const title = redesign536Text('Симулятор бомжа', 'Valera’s Life');
  if (brand.lastElementChild.textContent !== title) brand.lastElementChild.textContent = title;
  bar.setAttribute('aria-label', redesign536Text('Разделы игры', 'Game sections'));
  $('resCaps')?.setAttribute('aria-label', redesign536Text('Крышки и магазин Stars', 'Caps and Stars shop'));
}

const redesign536MarkBefore = betaMarkTabbar;
betaMarkTabbar = function () {
  redesign536MarkBefore();
  redesign536Navigation();
};

const redesign536Leisure = BETA_HUBS.find(hub => hub.id === 'fun');
const redesign536Games = redesign536Leisure.groups.findIndex(([name]) => name === 'Азарт');
if (redesign536Games >= 0) redesign536Leisure.groups.push(...redesign536Leisure.groups.splice(redesign536Games, 1));

HOOKS.init.push(() => document.body.classList.add('design536'));
document.addEventListener('game-language-change', redesign536Navigation);
