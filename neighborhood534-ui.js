// Дом и личный гараж. Состояние поручений и строек живёт в neighborhood534.js.
const NB534_SCREEN = 'neighborhood534';
const NB534_UI = { tab: 'garage', origin: null, confirmationFrom: '', preview: false, postcard: '', art: new Map(), details: new Set(), lastView: '', nextCheck: 0 };
const nb534Text = (ru, en) => I18N.lang === 'en' ? en : ru;
const nb534Attr = (value) => esc(value).replace(/"/g, '&quot;');
const nb534IsOwned = () => typeof firstKeyOwned534 === 'function' && firstKeyOwned534();

function nb534Button(label, action, id = '', tone = '', accessibleLabel = '') {
  return `<button type="button" class="nb534-button ${tone}" data-act="${action}" data-id="${nb534Attr(id)}" data-nb534-focus="${action}:${nb534Attr(id)}"${accessibleLabel ? ` aria-label="${nb534Attr(accessibleLabel)}"` : ''}>${esc(label)}</button>`;
}

function nb534Metric(type) {
  if (typeof neighborhood534Metric === 'function') neighborhood534Metric(type);
}

function nb534Paint(context, stage, market, style, fair = false) {
  const paint = (color, points) => {
    context.beginPath();
    points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y));
    context.closePath();
    context.fillStyle = color;
    context.fill();
  };
  const line = (color, width, points) => {
    context.beginPath();
    points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y));
    context.strokeStyle = color;
    context.lineWidth = width;
    context.stroke();
  };
  const rect = (color, x, y, w, h) => {
    context.fillStyle = color;
    context.fillRect(x, y, w, h);
  };
  const dot = (color, x, y, radius) => {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
  };

  const sky = context.createLinearGradient(0, 0, 0, 305);
  sky.addColorStop(0, '#33334b');
  sky.addColorStop(.66, '#8c5550');
  sky.addColorStop(1, '#e09868');
  rect(sky, 0, 0, 800, 356);
  dot('#f9bf7a', 692, 79, 31);
  paint('#51454d', [[0, 157], [83, 102], [174, 158], [258, 117], [346, 142], [432, 125], [573, 146], [639, 109], [800, 167], [800, 284], [0, 284]]);
  [7, 51, 95, 627, 680, 736, 771].forEach((x, index) => {
    const roof = 147 + (index % 3) * 12;
    rect('#4c4047', x, roof, 31, 103);
    rect('#75514d', x + 5, roof - 6, 21, 8);
    rect('#946348', x + 18, roof + 12, 7, 11);
  });
  rect('#5e4945', 0, 254, 800, 102);
  paint('#776057', [[0, 318], [184, 295], [448, 297], [729, 324], [800, 317], [800, 356], [0, 356]]);
  paint('#49372d', [[112, 282], [545, 270], [693, 294], [597, 311], [211, 320]]);

  const premium = style === 'key';
  const lit = stage >= 1;
  const roof = premium ? '#284b48' : '#594844';
  const trim = premium ? '#76a897' : '#876451';
  paint('#2e2930', [[108, 166], [185, 113], [528, 113], [602, 166]]);
  paint(roof, [[140, 159], [191, 121], [521, 121], [572, 159]]);
  rect(trim, 126, 156, 457, 12);
  rect(premium ? '#9a9172' : '#a2826b', 141, 168, 427, 120);
  rect(premium ? '#476b60' : '#7d5f50', 141, 265, 427, 23);
  for (let row = 0; row < 4; row++) {
    const y = 178 + row * 24;
    line('#72564c', 2, [[144, y], [563, y]]);
    for (let x = 165 + (row % 2) * 29; x < 558; x += 53) line('#72564c', 2, [[x, y], [x, y + 22]]);
  }
  rect(trim, 208, 188, 213, 102);
  rect('#302f32', 218, 197, 193, 93);
  if (premium) {
    const inside = context.createLinearGradient(0, 204, 0, 290);
    inside.addColorStop(0, '#d29862');
    inside.addColorStop(1, '#3e3029');
    rect(inside, 226, 204, 177, 86);
    rect('#523b30', 279, 239, 77, 7);
    rect('#523b30', 282, 245, 4, 22);
    rect('#523b30', 348, 245, 4, 22);
    rect('#927257', 288, 225, 16, 14);
    rect('#8c5143', 309, 229, 11, 10);
    line('#f1cf93', 3, [[327, 233], [335, 222], [339, 222]]);
    rect('#6a4e3a', 314, 205, 3, 10);
    dot('#ffe3a3', 315, 215, 5);
    rect('#2e5d56', 226, 206, 46, 84);
    rect('#2e5d56', 357, 206, 46, 84);
    for (let y = 215; y <= 271; y += 14) {
      line('#5b8477', 3, [[232, y], [266, y]]);
      line('#5b8477', 3, [[363, y], [397, y]]);
    }
  } else {
    rect('#535455', 226, 206, 177, 84);
    for (let y = 215; y <= 271; y += 14) line('#737273', 3, [[232, y], [397, y]]);
    rect('#2f2a2c', 306, 261, 19, 4);
  }
  rect('#413738', 469, 205, 73, 58);
  rect(lit ? '#ffd580' : '#555262', 475, 211, 61, 45);
  if (lit) {
    const glow = context.createRadialGradient(506, 232, 10, 506, 232, 82);
    glow.addColorStop(0, 'rgba(255,214,124,.6)');
    glow.addColorStop(1, 'rgba(255,214,124,0)');
    dot(glow, 506, 232, 82);
  }
  line('#55413c', 4, [[506, 211], [506, 256]]);
  line('#55413c', 4, [[475, 233], [536, 233]]);
  if (market || fair) {
    paint('#8f4d42', [[561, 203], [668, 203], [704, 239], [555, 239]]);
    [0, 1, 2, 3].forEach((i) => paint('#d6a777', [[568 + i * 26, 205], [581 + i * 26, 205], [583 + i * 28, 238], [569 + i * 28, 238]]));
    rect('#514038', 575, 240, 7, 51);
    rect('#514038', 675, 240, 7, 51);
    rect('#b2835d', 589, 263, 78, 19);
  } else if (stage >= 2) {
    paint('#635247', [[557, 205], [665, 212], [695, 240], [552, 240]]);
    rect('#514038', 572, 240, 7, 51);
    rect('#514038', 672, 240, 7, 51);
    rect('#ad8060', 585, 268, 75, 10);
  }
  if (stage >= 3 || premium) {
    rect('#352f2d', 260, 144, 179, 31);
    rect(premium ? '#f6ca74' : '#cb9d65', 265, 147, 169, 24);
    if (premium) {
      line('#3c5044', 4, [[346, 158], [361, 158], [361, 163]]);
      dot('#3c5044', 344, 158, 6);
      dot('#f6ca74', 344, 158, 2);
    } else {
      line('#65452f', 3, [[300, 160], [330, 160], [333, 155], [343, 165], [354, 155], [360, 160], [395, 160]]);
    }
  }
  line('#352e34', 2, [[63, 75], [186, 102], [294, 112], [419, 104], [529, 83]]);
  [[92, 82], [144, 93], [202, 104], [251, 109], [306, 111], [361, 108], [418, 104], [481, 92]].forEach(([x, y]) => {
    if (lit) {
      const glow = context.createRadialGradient(x, y, 1, x, y, 14);
      glow.addColorStop(0, 'rgba(255,212,125,.55)');
      glow.addColorStop(1, 'rgba(255,212,125,0)');
      dot(glow, x, y, 14);
    }
    dot(lit ? '#ffda85' : '#77656b', x, y, 3.5);
  });
  rect('#8e6248', 75, 270, 60, 8);
  rect('#59473e', 80, 278, 7, 12);
  rect('#59473e', 119, 278, 7, 12);
  rect('#9c704f', 184, 272, 29, 20);
  line('#5a4642', 2, [[190, 276], [208, 288]]);
}

function nb534Canvas(view, style, card = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = card ? 518 : 356;
  const g = canvas.getContext('2d');
  const network = NB534_UI.tab === 'network';
  nb534Paint(g, network ? 3 : view.stage, view.route === 'market', style, network && view.network.route === 'fair');
  if (card) {
    const title = network ? nb534Text('Сеть Валеры', 'Valera’s Network') : nb534Text('Жизнь района', 'Neighborhood life');
    const subtitle = (network ? view.network.routeLabel : view.routeLabel) || nb534Text('Мой гараж', 'My garage');
    g.fillStyle = '#241a16';
    g.fillRect(0, 356, 800, 162);
    g.fillStyle = '#f0b66c';
    g.fillRect(0, 356, 800, 4);
    g.font = 'bold 53px system-ui, sans-serif';
    g.fillStyle = '#fff0dc';
    g.fillText(title, 40, 429, 720);
    g.font = '28px system-ui, sans-serif';
    g.fillStyle = '#e0bd9a';
    g.fillText(subtitle, 42, 478, 716);
  }
  return canvas.toDataURL('image/png');
}

function nb534GarageArt(view, style) {
  const key = [view.stage, view.route, view.network.route, NB534_UI.tab, style].join(':');
  if (!NB534_UI.art.has(key)) {
    if (NB534_UI.art.size >= 8) NB534_UI.art.clear();
    NB534_UI.art.set(key, nb534Canvas(view, style));
  }
  return NB534_UI.art.get(key);
}

function nb534ChoiceMarkup(options, action, prefix = '', selected = '') {
  return options.map((choice) => {
    const isSelected = selected === choice.id;
    return `<div class="nb534-choice${isSelected ? ' is-selected' : ''}">
      <strong>${esc(choice.label)}</strong>
      ${choice.cost || choice.reward ? `<div class="nb534-choice-details">${choice.cost ? `<span>${esc(choice.cost)}</span>` : ''}${choice.reward ? `<span>${esc(choice.reward)}</span>` : ''}</div>` : ''}
      ${choice.consequence ? `<p class="nb534-consequence">${esc(choice.consequence)}</p>` : ''}
      ${isSelected ? `<span class="nb534-chosen">✓ ${nb534Text('Выбрано', 'Selected')}</span>${choice.disabledReason ? `<p>${esc(choice.disabledReason)}</p>` : ''}`
        : choice.available ? nb534Button(selected ? nb534Text('Сменить способ', 'Switch method') : nb534Text('Выбрать', 'Choose'), action, prefix + choice.id, '', nb534Text(`Выбрать «${choice.label}»`, `Choose ${choice.label}`))
          : choice.disabledReason ? `<p>${esc(choice.disabledReason)}</p>` : ''}
    </div>`;
  }).join('');
}

function nb534PathChoices(choices, action) {
  return `<div class="nb534-paths">${choices.map((choice) => `<div class="nb534-path">
    <strong>${esc(choice.label)}</strong>
    <p>${esc(choice.summary || choice.description)}</p>
    ${nb534Button(nb534Text('Выбрать', 'Choose'), action, choice.id, '', nb534Text(`Выбрать «${choice.label}»`, `Choose ${choice.label}`))}
  </div>`).join('')}</div>`;
}

function nb534Disclosure(id, title, body, summary = '', expanded = false) {
  return `<details class="nb534-details" id="${id}" data-nb534-detail="${id}"${NB534_UI.details.has(id) || expanded ? ' open' : ''}>
    <summary data-nb534-focus="${id}-summary"><span>${esc(title)}</span>${summary ? `<small>${esc(summary)}</small>` : ''}</summary>
    <div class="nb534-details-body">${body}</div>
  </details>`;
}

function nb534JobMarkup(route, showWait) {
  const job = route.active || route.offer;
  if (!job && (!showWait || !route.next)) return '';
  return `<section class="nb534-section" aria-labelledby="nb534Job"><h2 id="nb534Job" tabindex="-1">${route.active ? nb534Text('Поручение в работе', 'Order in progress') : nb534Text('Доска поручений', 'Order board')}</h2>
    ${job ? `<div class="nb534-panel"><h3>${esc(job.title)}</h3>${job.tariffLabel ? `<span class="nb534-tariff">${esc(job.tariffLabel)}</span>` : ''}<p>${esc(job.description)}</p>
      ${route.active ? `${job.selected ? `<div class="nb534-order-choices">${nb534ChoiceMarkup(job.choices.filter((choice) => choice.id === job.selected), 'neighborhood534Decide', `${job.id}:`, job.selected)}</div>` : ''}
        ${job.selected ? job.completable ? nb534Button(nb534Text('Закончить поручение', 'Finish the order'), 'neighborhood534Complete', job.id, 'is-main') : `<button type="button" class="nb534-button" disabled>${nb534Text('Закончить поручение', 'Finish the order')}</button>` : ''}
        ${job.selected ? nb534Disclosure('order-method', nb534Text('Другие способы', 'Other methods'), `<div class="nb534-options">${nb534ChoiceMarkup(job.choices.filter((choice) => choice.id !== job.selected), 'neighborhood534Decide', `${job.id}:`, job.selected)}</div>`, '', !job.completable) : `<div class="nb534-options">${nb534ChoiceMarkup(job.choices, 'neighborhood534Decide', `${job.id}:`)}</div>`}`
        : nb534Button(nb534Text('Взять поручение', 'Take the order'), 'neighborhood534Accept', job.id, 'is-main')}
    </div>` : `<p class="nb534-wait">${esc(route.next)}</p>`}
  </section>`;
}

function nb534ProjectMarkup(view) {
  const current = view.projects.find((project) => project.current && !project.done);
  const progress = `<ol class="nb534-progress">${view.projects.map((project) => `<li class="${project.done ? 'is-done' : project.current ? 'is-current' : ''}"${project.current ? ' aria-current="step"' : ''}><span aria-hidden="true">${project.done ? '✓' : '•'}</span><b>${esc(project.label)}</b>${project.done ? `<span class="nb534-sr">${nb534Text('Готово', 'Complete')}</span>` : ''}</li>`).join('')}</ol>`;
  const investment = view.investment?.paybackText ? `<p>${esc(view.investment.paybackText)}</p>` : '';
  if (!current && view.stage === 0) return '';
  return `<section class="nb534-section" aria-labelledby="nb534Projects"><h2 id="nb534Projects" tabindex="-1">${current ? esc(current.label) : nb534Text('Гараж готов', 'Garage complete')}</h2>
    ${current ? `<div class="nb534-panel">
      <p class="nb534-consequence">${esc(current.consequence || current.description)}</p>
      ${current.available ? `<div class="nb534-options">${nb534ChoiceMarkup(current.options, 'neighborhood534Build', `${current.id}:`)}</div>` : ''}
    </div>` : ''}
    ${nb534Disclosure('garage-projects', nb534Text('Проекты гаража', 'Garage projects'), progress + investment, `${view.stage}/${view.projects.length}`)}
  </section>`;
}

function nb534CosmeticMarkup(view) {
  if (NB534_UI.tab !== 'garage' || !view.firstOrderDone || typeof FIRST_KEY_STARS_534 === 'undefined') return '';
  const owned = nb534IsOwned();
  const applied = S.settings?.neighborhood534Style !== 'original';
  return `<div class="nb534-panel nb534-cosmetic"${owned ? '' : ' data-nb534-offer'}>
    <h3>${nb534Text('Первый ключ', 'First Key')}</h3>
    <p>${nb534Text('Зелёные ворота, свет внутри мастерской и мерцающая вывеска с ключом. Облик остаётся у тебя и виден на открытке.', 'Green doors, a warmly lit workshop and a glowing key sign. Keep the look permanently and show it on your postcard.')}</p>
    ${NB534_UI.preview && !owned ? `<div class="nb534-art-preview nb534-key-sign"><img class="nb534-preview" src="${nb534GarageArt(view, 'key')}" width="800" height="356" alt="${nb534Text('Предпросмотр гаража с открытыми зелёными воротами, мастерской и золотым ключом', 'Garage preview with open green doors, a lit workshop and a gold key')}"></div>` : ''}
    <div class="nb534-inline">${owned ? nb534Button(applied ? nb534Text('Вернуть обычный облик', 'Use the original look') : nb534Text('Применить «Первый ключ»', 'Equip First Key'), 'neighborhood534Style')
      : nb534Button(NB534_UI.preview ? nb534Text('Закрыть примерку', 'Close preview') : nb534Text('Примерить', 'Preview'), 'neighborhood534Preview')
      + (NB534_UI.preview ? nb534Button(nb534Text(`Купить за ${FIRST_KEY_STARS_534} Stars`, `Buy for ${FIRST_KEY_STARS_534} Stars`), 'firstKeyBuy534', '', 'is-main') : '')}</div>
  </div>`;
}

function nb534MilestonesMarkup(route) {
  if (!route.milestones?.length) return '';
  const count = Number(route.cycleCount) || 0;
  const next = route.milestones.find((milestone) => !milestone.done);
  const summary = next ? nb534Text(`${count} из ${next.needed}`, `${count} of ${next.needed}`) : nb534Text('Все открыты', 'All unlocked');
  return nb534Disclosure('nb534Milestones', nb534Text('Новые поручения', 'New orders'),
    `<ul class="nb534-milestones">${route.milestones.map((milestone) => `<li class="${milestone.done ? 'is-done' : ''}">
      <span class="nb534-milestone-mark" aria-hidden="true">${milestone.done ? '✓' : '🔒'}</span><div><strong>${esc(milestone.title)}</strong>
      <p>${esc(milestone.description)}</p><p class="nb534-milestone-count">${milestone.done ? nb534Text('Появляется на доске', 'Can appear on the order board') : nb534Text(`Поручения: ${Math.min(count, milestone.needed)} из ${milestone.needed}`, `Orders: ${Math.min(count, milestone.needed)} of ${milestone.needed}`)}</p></div></li>`).join('')}</ul>`, summary);
}

function nb534Page() {
  const view = neighborhood534View();
  NB534_UI.lastView = JSON.stringify(view);
  const networkTab = NB534_UI.tab === 'network' && view.network.eligible;
  const route = networkTab ? view.network : view;
  const title = networkTab ? nb534Text('Сеть Валеры', 'Valera’s Network') : nb534Text('Жизнь района', 'Neighborhood life');
  const back = NB534_UI.origin?.screen === 'hub' ? nb534Text('Цели', 'Goals') : nb534Text('Домой', 'Home');
  const artStyle = nb534IsOwned() && S.settings?.neighborhood534Style !== 'original' ? 'key' : 'original';
  const showProjects = !networkTab && view.route;
  const available = networkTab ? view.network.eligible : view.unlocked;
  const showPostcard = networkTab ? !!view.network.firstOutcome : view.firstOrderDone;
  const choices = networkTab ? route.choices : view.choices;
  const cosmetic = nb534CosmeticMarkup(view);
  const postcard = showPostcard ? NB534_UI.postcard
    ? `<img class="nb534-preview" src="${NB534_UI.postcard}" width="800" height="518" alt="${nb534Text('Твоя открытка на фоне гаражей на закате', 'Your postcard with garages at sunset')}"><div class="nb534-inline">${nb534ShareFile() ? nb534Button(nb534Text('Поделиться', 'Share'), 'neighborhood534Share', '', 'is-main') : ''}<a class="nb534-button" data-nb534-focus="postcard-download" href="${NB534_UI.postcard}" download="bomzh-neighborhood.png" target="_blank" rel="noopener">${nb534Text('Сохранить PNG', 'Save PNG')}</a>${nb534Button(nb534Text('Закрыть открытку', 'Close postcard'), 'neighborhood534Postcard')}</div>`
    : nb534Button(nb534Text('Посмотреть открытку', 'Preview the postcard'), 'neighborhood534Postcard') : '';

  return `<div class="nb534-page${available && !route.route ? ' nb534-selecting' : ''}" data-i18n-ignore>
    <div class="nb534-top">${nb534Button(`‹ ${back}`, 'neighborhood534Back')}
      ${view.network.eligible ? nb534Button(networkTab ? nb534Text('К гаражу', 'Garage') : nb534Text('Сеть Валеры', 'Valera’s Network'), 'neighborhood534Tab', networkTab ? 'garage' : 'network') : ''}
    </div>
    <header class="nb534-hero${artStyle === 'key' ? ' nb534-key-sign' : ''}"><img src="${nb534GarageArt(view, artStyle)}" width="800" height="356" alt=""><div><h1 id="nb534Title" tabindex="-1">${title}</h1>
      ${route.routeLabel ? `<p>${esc(route.routeLabel)}</p>` : ''}</div></header>
    ${available ? `<div class="nb534-content">
      ${!route.route ? `<section class="nb534-section" aria-labelledby="nb534Start"><h2 id="nb534Start" tabindex="-1">${esc(networkTab ? nb534Text('Выбери направление', 'Choose a route') : view.entryTitle)}</h2>
        <p>${networkTab ? nb534Text('От выбора зависит, какие поступят заказы.', 'Your route determines which orders arrive.') : nb534Text('Выбери, чем займёшься в гараже.', 'Choose what to open in the garage.')}</p>
        ${nb534PathChoices(choices, networkTab ? 'neighborhood534Network' : 'neighborhood534Choose')}
      </section>` : ''}
      ${route.route ? nb534JobMarkup(route, networkTab || view.stage >= view.projects.length) : ''}
      ${showProjects ? nb534ProjectMarkup(view) : ''}
      ${route.route ? `<div class="nb534-secondary">
        ${(networkTab ? showPostcard : view.stage >= view.projects.length) ? nb534MilestonesMarkup(route) : ''}
        ${route.firstOutcome ? nb534Disclosure('nb534FirstOrder', nb534Text('Первый заказ', 'First order'), `<p class="nb534-memory">${esc(route.firstOutcome)}</p>`) : ''}
        ${postcard ? nb534Disclosure('nb534Postcard', nb534Text('Открытка', 'Postcard'), postcard) : ''}
        ${cosmetic ? nb534Disclosure('nb534Cosmetic', nb534Text('Облик гаража', 'Garage appearance'), cosmetic) : ''}
      </div>` : ''}
    </div>` : `<div class="nb534-content"><p class="nb534-panel">${esc(view.lockedReason || nb534Text('Гараж откроется по сюжету.', 'The garage unlocks during the story.'))}</p></div>`}
  </div>`;
}

function nb534Focus(id) {
  const el = $(id);
  if (el) el.focus({ preventScroll: true });
}

function nb534ShareFile() {
  if (!NB534_UI.postcard || !navigator.share || !navigator.canShare) return null;
  try {
    const data = Uint8Array.from(atob(NB534_UI.postcard.split(',')[1]), (byte) => byte.charCodeAt(0));
    const file = new File([data], 'bomzh-neighborhood.png', { type: 'image/png' });
    return navigator.canShare({ files: [file] }) ? file : null;
  } catch (_) {
    return null;
  }
}

function nb534Open(tab = 'garage') {
  if (currentScreen !== NB534_SCREEN) NB534_UI.origin = { screen: currentScreen, tab: TABS[currentScreen], hub: BNAV.hub, button: document.activeElement };
  const view = neighborhood534View();
  NB534_UI.tab = tab === 'network' && view.network.eligible ? 'network' : 'garage';
  NB534_UI.details.clear();
  NB534_UI.preview = false;
  NB534_UI.postcard = '';
  neighborhood534Enter();
  BNAV.hub = 'goals';
  showScreen(NB534_SCREEN);
  $('screen-' + NB534_SCREEN).scrollTop = 0;
  nb534Focus('nb534Title');
}

Object.assign(ACTIONS, {
  neighborhood534Open: nb534Open,
  neighborhood534Back: () => {
    const origin = NB534_UI.origin;
    NB534_UI.origin = null;
    if (origin?.screen === 'hub') ACTIONS.betaHub(origin.hub);
    else if (origin?.screen && origin.screen !== NB534_SCREEN) showScreen(origin.screen, origin.tab);
    else showScreen('game');
    requestAnimationFrame(() => {
      if (origin?.button?.isConnected) origin.button.focus({ preventScroll: true });
      else if (origin?.screen === 'hub') document.querySelector('[data-id="act:neighborhood534Open"]')?.focus({ preventScroll: true });
      else if (currentScreen === 'game') nb534Focus('nb534HomeMain');
    });
  },
  neighborhood534Tab: nb534Open,
  neighborhood534Preview: () => {
    if (currentScreen !== NB534_SCREEN || !neighborhood534View().firstOrderDone || nb534IsOwned()) return;
    NB534_UI.details.add('nb534Cosmetic');
    NB534_UI.preview = !NB534_UI.preview;
    if (NB534_UI.preview) nb534Metric('preview');
  },
  neighborhood534Style: () => {
    if (currentScreen !== NB534_SCREEN || !neighborhood534View().firstOrderDone || !nb534IsOwned()) return;
    if (!S.settings) S.settings = {};
    S.settings.neighborhood534Style = S.settings.neighborhood534Style === 'original' ? 'key' : 'original';
    NB534_UI.postcard = '';
    save();
  },
  neighborhood534Postcard: () => {
    if (currentScreen !== NB534_SCREEN) return;
    const view = neighborhood534View();
    if (NB534_UI.tab === 'network' ? !view.network.firstOutcome : !view.firstOrderDone) return;
    NB534_UI.details.add('nb534Postcard');
    const style = nb534IsOwned() && S.settings?.neighborhood534Style !== 'original' ? 'key' : 'original';
    NB534_UI.postcard = NB534_UI.postcard ? '' : nb534Canvas(view, style, true);
  },
  neighborhood534Share: async () => {
    if (currentScreen !== NB534_SCREEN) return;
    const file = nb534ShareFile();
    if (!file) return;
    try {
      await navigator.share({ files: [file] });
      nb534Metric('postcard');
    } catch (error) {
      if (error?.name !== 'AbortError') toast(nb534Text('Можно сохранить открытку в PNG.', 'You can save the postcard as a PNG.'), 'bad');
    }
  },
});

RENDER[NB534_SCREEN] = ['neighborhood534List', nb534Page];
HOOKS.init.push(() => {
  document.querySelector('main').insertAdjacentHTML('beforeend', `<section class="screen" id="screen-${NB534_SCREEN}"><div id="neighborhood534List"></div></section>`);
  $('screen-game').insertAdjacentHTML('beforeend', '<div id="nb534HomeExtras" hidden></div>');
  $('screen-' + NB534_SCREEN).addEventListener('toggle', (event) => {
    const detail = event.target.closest('[data-nb534-detail]');
    if (!detail?.isConnected) return;
    if (detail.open) NB534_UI.details.add(detail.dataset.nb534Detail);
    else NB534_UI.details.delete(detail.dataset.nb534Detail);
  }, true);
  $('screen-' + NB534_SCREEN).addEventListener('click', (event) => {
    const opener = event.target.closest('[data-act="neighborhood534Choose"], [data-act="neighborhood534Network"]');
    if (opener) NB534_UI.confirmationFrom = opener.dataset.nb534Focus;
  });
  const modalRoot = $('modalRoot');
  let dialogShown = false;
  new MutationObserver(() => {
    const dialog = modalRoot.querySelector('[data-neighborhood534-choice]');
    if (dialog && !dialogShown) {
      dialogShown = true;
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      const heading = dialog.querySelector('h3');
      heading.id = 'nb534ConfirmTitle';
      dialog.setAttribute('aria-labelledby', heading.id);
      dialog.querySelector('[data-act="close"]').focus({ preventScroll: true });
    } else if (!dialog && dialogShown) {
      dialogShown = false;
      const from = NB534_UI.confirmationFrom;
      NB534_UI.confirmationFrom = '';
      if (currentScreen === NB534_SCREEN && !modalOpen()) {
        const opener = Array.from($('neighborhood534List').querySelectorAll('[data-nb534-focus]')).find((item) => item.dataset.nb534Focus === from);
        if (opener) opener.focus({ preventScroll: true });
        else nb534Focus($('nb534Job') ? 'nb534Job' : 'nb534Title');
      }
    }
  }).observe(modalRoot, { childList: true });
  document.addEventListener('keydown', (event) => {
    if (currentScreen !== NB534_SCREEN) return;
    const dialog = modalRoot.querySelector('[data-neighborhood534-choice]');
    if (dialog && event.key === 'Tab') {
      const buttons = dialog.querySelectorAll('button:not([disabled])');
      const edge = buttons[event.shiftKey ? 0 : buttons.length - 1];
      if (document.activeElement === edge || !dialog.contains(document.activeElement)) {
        event.preventDefault();
        buttons[event.shiftKey ? buttons.length - 1 : 0].focus();
      }
    } else if (event.key === 'Escape' && (dialog || !modalOpen())) {
      event.preventDefault();
      if (dialog) closeModal();
      else ACTIONS.neighborhood534Back();
    }
  });
});

const nb534PreviousBack = navBack;
navBack = function () {
  if (currentScreen === NB534_SCREEN) ACTIONS.neighborhood534Back();
  else nb534PreviousBack();
};
const nb534PreviousRender = renderCurrent;
const nb534OfferObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver((items) => {
  if (currentScreen === NB534_SCREEN && items.some((item) => item.isIntersecting && item.target.isConnected)) nb534Metric('offer');
}, { threshold: .25 }) : null;
renderCurrent = function (animate = false) {
  const inNeighborhood = currentScreen === NB534_SCREEN;
  const active = inNeighborhood && document.activeElement;
  const focus = active?.dataset?.nb534Focus;
  const id = active?.id?.startsWith('nb534') && active.id;
  const sectionId = focus && active.closest('[aria-labelledby]')?.getAttribute('aria-labelledby');
  nb534PreviousRender(animate);
  if (!inNeighborhood) return;
  nb534OfferObserver?.disconnect();
  const offer = document.querySelector('[data-nb534-offer]');
  if (offer && nb534OfferObserver) nb534OfferObserver.observe(offer);
  if (animate || modalOpen()) return;
  if (focus) {
    const button = Array.from($('neighborhood534List').querySelectorAll('[data-nb534-focus]')).find((item) => item.dataset.nb534Focus === focus);
    if (button) button.focus({ preventScroll: true });
    else nb534Focus($(sectionId) ? sectionId : 'nb534Title');
  } else if (id) nb534Focus(id);
};
HOOKS.tick.push(() => {
  if (currentScreen !== NB534_SCREEN || modalOpen() || document.hidden || Date.now() < NB534_UI.nextCheck) return;
  NB534_UI.nextCheck = Date.now() + 1500;
  if (JSON.stringify(neighborhood534View()) !== NB534_UI.lastView) renderCurrent(false);
});

const nb534Goals = BETA_HUBS.find((hub) => hub.id === 'goals');
nb534Goals.groups[0][1].push({ act: 'neighborhood534Open', id: 'neighborhood534', e: '🏘️', get n() { return nb534Text('Жизнь района', 'Neighborhood life'); } });
BETA_STATUS['act:neighborhood534'] = () => {
  const view = neighborhood534View();
  if (view.network.started) return nb534Text('Междугородние поручения', 'Intercity orders');
  if (view.firstOrderDone) return view.routeLabel;
  return view.unlocked ? nb534Text('Первый гараж', 'Your first garage') : nb534Text('Откроется по сюжету', 'Unlocked in the story');
};

function nb534HomeRender() {
  if (currentScreen !== 'game') return;
  const home = $('screen-game');
  const panel = $('next528');
  const extras = $('nb534HomeExtras');
  if (!home || !panel) return;
  if (!S.storySeen || (S.tut && !S.tut.done)) {
    home.classList.remove('nb534-home', 'nb534-story', 'nb534-hungry', 'nb534-tired', 'nb534-unwell');
    extras.hidden = true;
    next528Render();
    return;
  }
  const view = neighborhood534View();
  const story = next528();
  const garageNext = view.projects.find((project) => project.current && !project.done);
  const storyStep = story ? { label: nb534Text('Сюжет', 'Story'), title: story.t, action: story.act, id: story.id || '' } : null;
  const garage = view.unlocked ? {
    label: nb534Text('Жизнь района', 'Neighborhood life'),
    title: view.active?.title || view.offer?.title || garageNext?.label || (view.route ? nb534Text('Открыть доску заказов', 'Open the order board') : nb534Text('Открыть свой гараж', 'Open your garage')),
    action: 'neighborhood534Open', id: 'garage',
  } : null;
  const network = view.network.eligible ? {
    label: nb534Text('Сеть Валеры', 'Valera’s Network'),
    title: view.network.active?.title || view.network.offer?.title || (view.network.started ? nb534Text('Открыть доску сети', 'Open the network board') : nb534Text('Выбрать направление сети', 'Choose a network route')),
    action: 'neighborhood534Open', id: 'network',
  } : null;
  const garageReady = garage && (!view.firstOrderDone || garageNext || view.offer);
  const networkReady = network && (!view.network.started || view.network.offer);
  const main = network && view.network.active ? network : garage && view.active ? garage
    : networkReady && (!story || view.network.started) ? network : garageReady ? garage : storyStep || network || garage;
  const other = main !== storyStep && storyStep ? storyStep : main !== network && network ? network : main !== garage ? garage : null;
  const link = other ? { ...other, label: other === storyStep ? nb534Text('К сюжету', 'Story') : other === network ? nb534Text('К сети', 'Network') : nb534Text('К гаражу', 'Garage') } : null;
  const unwell = S.health <= 15;
  const hungry = S.food <= 15;
  const tired = S.energy <= 10 && !S.busy;
  const rentDue = S.debt > 0;
  const urgent = unwell ? { label: nb534Text('Мало здоровья · К врачу', 'Low health · See a doctor'), action: 'goStat', id: 'health' }
    : rentDue ? { label: nb534Text('Долг за жильё · К счетам', 'Rent due · View bills'), action: 'hubGo528', id: 'shop:housing' } : null;

  const html = `${main ? `<div class="nb534-home-task"><button id="nb534HomeMain" type="button" data-act="${main.action}" data-id="${nb534Attr(main.id)}"><small>${esc(main.label)}</small><strong>${esc(main.title)}</strong><span aria-hidden="true">›</span></button>${link ? nb534Button(link.label, link.action, link.id, 'nb534-home-link') : ''}</div>` : ''}
    ${urgent ? `<div class="nb534-urgent">${nb534Button(urgent.label, urgent.action, urgent.id)}</div>` : ''}`;
  const objectiveHtml = typeof redesign536HomeMarkup === 'function' ? redesign536HomeMarkup(main, link, urgent) : html;
  if (panel.dataset.html !== objectiveHtml) {
    const restoreMain = document.activeElement?.id === 'nb534HomeMain';
    const restoreButton = panel.contains(document.activeElement) && document.activeElement.dataset.nb534Focus;
    panel.innerHTML = objectiveHtml;
    panel.dataset.html = objectiveHtml;
    if (restoreMain) nb534Focus('nb534HomeMain');
    else if (restoreButton) Array.from(panel.querySelectorAll('[data-nb534-focus]')).find((button) => button.dataset.nb534Focus === restoreButton)?.focus({ preventScroll: true });
  }
  panel.hidden = !objectiveHtml;
  const ready = [];
  const routeShortcut = typeof redesign536HomeRoute === 'function' && redesign536HomeRoute();
  if (routeShortcut) ready.push(routeShortcut);
  if (!dailyState().claimedToday) ready.push(nb534Button(nb534Text('🎁 Бонус дня', '🎁 Daily bonus'), 'hubGo528', 'tasks:tasks'));
  if (typeof businessTotals === 'function' && businessTotals().cash >= 1) ready.push(nb534Button(nb534Text('🏪 Касса бизнеса', '🏪 Business cash'), 'hubGo528', 'life:business'));
  const extrasHtml = ready.join('');
  if (extras.dataset.html !== extrasHtml) {
    const focus = extras.contains(document.activeElement) && document.activeElement.dataset.nb534Focus;
    extras.innerHTML = extrasHtml;
    extras.dataset.html = extrasHtml;
    if (focus) Array.from(extras.querySelectorAll('[data-nb534-focus]')).find((button) => button.dataset.nb534Focus === focus)?.focus({ preventScroll: true });
  }
  extras.hidden = !extrasHtml;
  home.classList.add('nb534-home');
  home.classList.toggle('nb534-unwell', unwell);
  home.classList.toggle('nb534-hungry', hungry);
  home.classList.toggle('nb534-tired', tired);
  home.classList.toggle('nb534-story', main?.action === 'openQuest' || link?.action === 'openQuest');
}

const nb534HudIndex = HOOKS.hud.indexOf(next528Render);
if (nb534HudIndex >= 0) HOOKS.hud[nb534HudIndex] = nb534HomeRender;
HOOKS.screen.push((screen) => { if (screen === 'game') nb534HomeRender(); });

const nb534StarsOfferSafe = starsOfferSafe;
starsOfferSafe = () => !$('screen-game')?.classList.contains('nb534-home') && nb534StarsOfferSafe();
