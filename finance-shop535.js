function financeText535(ru, en) {
  return typeof I18N !== 'undefined' && I18N.lang === 'en' ? en : ru;
}

function financeDisclosure535(title, nodes, open = false) {
  const section = document.createElement('details');
  section.className = 'finance-details535';
  section.open = open;
  const heading = document.createElement('summary');
  heading.textContent = title;
  section.append(heading, ...nodes);
  return section;
}

function financeWrapTab535(group, tab, prepare) {
  const original = EXTRA_TABS[group][tab];
  EXTRA_TABS[group][tab] = () => {
    const template = document.createElement('template');
    template.innerHTML = original();
    prepare(template.content);
    return template.innerHTML;
  };
}

// Keep the tender and two separate payments visible where the player compares options.
const financeAssetButtonsBefore535 = storyAssetButtons521;
storyAssetButtons521 = (kind, id) => {
  const html = financeAssetButtonsBefore535(kind, id);
  const item = storyAssetItem521(kind, id);
  const fee = storyAccessCost521(kind, id);
  if (!fee) return html;
  const template = document.createElement('template');
  template.innerHTML = html;
  const access = template.content.querySelector('.story-access521');
  const facts = access?.querySelector('small');
  const purchase = access?.querySelector('[data-act="storyAccessBuy521"]');
  if (!item || !facts || !purchase) return html;
  facts.innerHTML = `${financeText535('Покупка отдельно', 'Purchase separately')} <b>${currencyMoney511(item.price)}</b>`
    + ` · ${financeText535('всего с доступом', 'total with access')} <b>${currencyMoney511(fee + item.price)}</b>`;
  facts.classList.add('finance-access-total535');
  purchase.innerHTML = `${financeText535('Оплатить только доступ', 'Pay for access only')} · ${currencyMoney511(fee)}`;
  return template.innerHTML;
};

function financeStoryRules535(root, tab) {
  const panels = [...root.children].filter(node => node.matches('.info-card') && ['Доступ по сюжету или за деньги', 'Постепенное развитие'].includes(node.firstElementChild?.textContent));
  if (!panels.length) return;
  const rules = financeDisclosure535(
    tab === 'business' ? financeText535('Условия открытия бизнеса', 'Requirements to open a business') : financeText535('Глава, уровень и порядок покупок', 'Story, level and purchase order'),
    panels.flatMap(panel => [...panel.children].slice(1)),
  );
  panels[0].replaceWith(rules);
  for (const panel of panels.slice(1)) panel.remove();
  return rules;
}

financeWrapTab535('shop', 'housing', root => {
  const rules = financeStoryRules535(root, 'housing');
  const bill = root.querySelector('[data-housing-bill522]');
  if (bill && rules) bill.after(rules);
});

financeWrapTab535('shop', 'transport', root => {
  const rules = financeStoryRules535(root, 'transport');
  const salon = [...root.children].find(node => node.matches('.subhead') && node.textContent.startsWith('Автосалон'));
  if (!salon) return;
  const buying = salon.nextElementSibling;
  const garage = [...root.children].find(node => node.matches('.info-card') && node.textContent.startsWith('Транспорт ускоряет мусорку'));
  const tips = [buying, garage].filter(node => node?.matches('.info-card'));
  if (tips.length) salon.after(financeDisclosure535(financeText535('Топливо, гараж и продажа', 'Fuel, garages and resale'), tips));
  if (rules) salon.before(rules);
});

financeWrapTab535('shop', 'clothes', root => {
  const caps = root.querySelector('.idea-panel');
  const stars = root.querySelector('[data-act="premiumTab75"][data-id="skins75"]')?.closest('.info-card');
  const classes = root.querySelector('.clothes-classes');
  if (classes) {
    const rules = financeDisclosure535(financeText535('Классы одежды и условия для работы', 'Clothing classes and job requirements'), [classes]);
    const repeatedPity = [...root.children].find(node => node.matches('.info-card') && node.textContent.startsWith('Приличная одежда открывает работу'));
    repeatedPity?.remove();
    root.querySelector('.subhead')?.before(rules);
  }
  if (caps) root.append(financeDisclosure535(financeText535('Одежда за крышки', 'Clothes for caps'), [caps]));
  if (stars) root.append(financeDisclosure535(financeText535('Облики за Stars', 'Looks for Stars'), [stars]));
});

financeWrapTab535('life', 'work', root => {
  const children = [...root.children];
  const rules = children.find(node => node.matches('.info-card') && node.textContent.startsWith('Смена — мини-игра'));
  if (rules && S.health >= 25) {
    const disclosure = financeDisclosure535(financeText535('Оплата смен и аттестация', 'Shift pay and promotion'), []);
    rules.replaceWith(disclosure);
    disclosure.append(rules);
  }
  const honest = children.find(node => node.matches('[data-act="honest68Open"]'));
  if (!honest) return;
  // The button opens the same live orders. Keep that entry and make regular shifts the first list.
  for (const node of children.slice(0, children.indexOf(honest))) {
    if (node.matches('.honest68-hero, .honest68-case') || node.textContent.startsWith('Честные поручения доступны') || node.firstElementChild?.textContent === 'Услуги квартала') node.remove();
  }
  root.append(honest);
});

financeWrapTab535('life', 'business', root => {
  const rules = financeStoryRules535(root, 'business');
  const dashboard = root.querySelector('.business-dashboard');
  const hero = dashboard?.querySelector('.business-hero');
  const ad = root.querySelector('.business-ad78');
  if (hero) {
    hero.classList.add('finance-business535');
    hero.querySelector('h2').textContent = financeText535('Доход и касса', 'Income and till');
    [...hero.querySelectorAll(':scope > p')].find(node => node.textContent === 'Открой. Развивай. Забирай прибыль.')?.remove();
    if (rules) hero.after(rules);
    if (!dashboard.querySelector('.business-card.owned')) {
      const tax = hero.querySelector(':scope > p');
      const lifetime = hero.querySelector('[data-income-kind="biz-lifetime"]')?.closest('p');
      if (lifetime) dashboard.querySelector('.business-how')?.append(lifetime);
      if (tax) {
        tax.className = 'finance-business-tax535';
        hero.replaceWith(tax);
      }
      dashboard.querySelector('.business-empty')?.remove();
      const subhead = [...dashboard.children].find(node => node.matches('.subhead') && node.textContent === 'Расширить дело');
      if (subhead) subhead.textContent = financeText535('Выбрать предприятие', 'Choose a business');
    }
  }
  if (ad && dashboard) {
    const active = !!ad.querySelector('[data-until]');
    dashboard.after(financeDisclosure535(financeText535(active ? 'Активное рекламное усиление' : 'Усиление бизнеса за рекламу', active ? 'Active ad boost' : 'Business boost for watching an ad'), [ad], active));
  }
});

const financeHub535 = BETA_HUBS.find(hub => hub.id === 'money');
financeHub535.groups.unshift(['Обмен', [{ act: 'financeExchange535', id: 'financeExchange535', e: '💱', n: 'Обменник Шныря' }]]);
BETA_STATUS['act:financeExchange535'] = () => `${fmt(S.bottles)} 🍾 · ${bottleRateLabel(bottleRate())}`;
ACTIONS.financeExchange535 = () => openExchange();

const financeHubBefore535 = RENDER.hub[1];
RENDER.hub[1] = () => {
  const html = financeHubBefore535();
  if (BNAV.hub !== 'money') return html;
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelector('.city-banner')?.remove();
  template.content.querySelector('.bh-head small')?.remove();
  return template.innerHTML;
};

const financeExchangeBefore535 = renderExchange;
renderExchange = function () {
  const wasOpen = $('financePriceHistory535')?.open;
  financeExchangeBefore535();
  const body = $('exBody');
  const exact = $('exchangePanel509');
  const rateBox = body?.querySelector('.rate-box');
  const rate = rateBox?.querySelector('.rate');
  if (!exact || !rate) return;
  const oldRate = exact.querySelector('.finance-rate535');
  const head = document.createElement('div');
  head.className = 'finance-rate535';
  const label = document.createElement('span');
  label.textContent = financeText535('Курс сейчас', 'Current rate');
  head.append(label, rate.cloneNode(true));
  if (oldRate) oldRate.replaceWith(head);
  else exact.querySelector('.exchange509-stock').before(head);
  const history = financeDisclosure535(financeText535('График курса и ближайший пик', 'Rate history and next peak'), [rateBox, body.querySelector('.rate-shared'), body.querySelector('.test-note')].filter(Boolean), !!wasOpen);
  history.id = 'financePriceHistory535';
  body.querySelector(':scope > p')?.remove();
  body.append(history);
};
