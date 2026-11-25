// Layout and accessibility. Gameplay actions and route state stay with their owners.
const HOME536_STATS = {
  energy: ['Энергия', 'Energy'],
  food: ['Сытость', 'Food'],
  health: ['Здоровье', 'Health'],
  mood: ['Настроение', 'Mood'],
};

const HOME536_GLYPHS = {
  exchange: '<path d="M4 8h15m-4-4 4 4-4 4M20 16H5m4-4-4 4 4 4"/>',
  trash: '<path d="M4 7h16m-14 0 1 13h10l1-13m-8-3h4m-4 6v6m4-6v6"/>',
  eat: '<path d="M4 4v6a3 3 0 0 0 6 0V4M7 4v16m12-16v16m0-16c-3 0-5 3-5 7h5"/>',
  sleep: '<path d="M4 18v-7m0 5h16m0 2v-6a2 2 0 0 0-2-2H9v6m0-3H4m7-9h5l-5 4h5"/>',
  route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M9 18h7a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h7"/>',
};

function home536Glyph(name) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + HOME536_GLYPHS[name] + '</svg>';
}

function redesign536HomeMarkup(main, link, urgent) {
  const category = main && main.action === 'neighborhood534Open' ? main.id : 'story';
  const cta = main ? '<div class="nb534-home-task home536-objective" data-home536-category="' + category + '">' +
    '<button id="nb534HomeMain" type="button" data-act="' + main.action + '" data-id="' + nb534Attr(main.id) + '">' +
    '<span class="home536-objective-copy"><small>' + esc(main.label) + '</small><strong>' + esc(main.title) + '</strong></span>' +
    '<span class="home536-arrow" aria-hidden="true">→</span></button>' +
    (link ? nb534Button(link.label, link.action, link.id, 'nb534-home-link') : '') + '</div>' : '';
  const warning = urgent ? '<div class="nb534-urgent home536-warning">' +
    nb534Button(urgent.label, urgent.action, urgent.id) + '</div>' : '';
  return cta + warning;
}

function redesign536HomeRoute() {
  if (typeof valeraRoute536View !== 'function') return '';
  const route = valeraRoute536View();
  if (!route) return '';
  return '<button type="button" class="nb534-button home536-route" data-act="valeraRoute536Open" data-nb534-focus="valeraRoute536Open:"' +
    (route.ready ? ' data-ready' : '') + '><span class="home536-route-icon">' + home536Glyph('route') + '</span>' +
    '<span><strong>' + esc(route.title || nb534Text('Маршрут Валеры', 'Valera’s Route')) + '</strong>' +
    (route.subtitle ? '<small>' + esc(route.subtitle) + '</small>' : '') + '</span>' +
    '<span class="home536-route-arrow" aria-hidden="true">›</span></button>';
}

function home536SetLanguage() {
  const home = $('screen-game');
  if (!home) return;
  const language = I18N.lang;
  if (home.dataset.home536Language === language) return;
  home.dataset.home536Language = language;
  home.querySelector('.bars')?.setAttribute('aria-label', nb534Text('Состояние Валеры', 'Valera’s needs'));
  home.querySelector('.actions')?.setAttribute('aria-label', nb534Text('Действия', 'Actions'));
  for (const [id, label] of Object.entries(HOME536_STATS)) {
    const bar = home.querySelector('.bar[data-id="' + id + '"]');
    const title = bar?.querySelector('.home536-stat-title');
    if (!title) continue;
    title.textContent = nb534Text(...label);
    bar.setAttribute('aria-label', title.textContent);
  }
  $('valera')?.setAttribute('aria-label', nb534Text('Собрать бутылки', 'Collect bottles'));
}

HOOKS.init.push(() => {
  const home = $('screen-game');
  if (!home) return;
  home.classList.add('redesign536-home');
  $('screen-neighborhood534')?.classList.add('redesign536-neighborhood');
  if ($('next528') && $('scene')) home.insertBefore($('next528'), $('scene'));
  home.querySelector('.bars')?.setAttribute('role', 'group');
  home.querySelector('.actions')?.setAttribute('role', 'group');
  for (const name of ['exchange', 'trash', 'eat', 'sleep']) {
    const icon = $(name + 'Btn')?.querySelector('.act-emoji');
    if (icon) icon.innerHTML = home536Glyph(name);
  }
  for (const id of Object.keys(HOME536_STATS)) {
    const bar = home.querySelector('.bar[data-id="' + id + '"]');
    if (!bar) continue;
    bar.setAttribute('role', 'button');
    bar.tabIndex = 0;
    bar.setAttribute('aria-describedby', id + 'Text');
    bar.insertAdjacentHTML('afterbegin', '<strong class="home536-stat-title" data-i18n-ignore></strong>');
  }
  $('valera').setAttribute('role', 'button');
  $('valera').tabIndex = 0;
  home.addEventListener('keydown', (event) => {
    if (event.repeat || !['Enter', ' '].includes(event.key)) return;
    const target = event.target;
    if (target.matches('.bar[role="button"]')) {
      event.preventDefault();
      target.click();
    }
    if (target === $('valera') && !modalOpen() && !S.busy) {
      event.preventDefault();
      const rect = target.getBoundingClientRect();
      onTap({ preventDefault() {}, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 });
    }
  });
  home536SetLanguage();
});

HOOKS.hud.push(home536SetLanguage);
