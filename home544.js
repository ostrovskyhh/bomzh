// Keep the original controls and their live state when moving them out of the picture.
function home544Events() {
  const events = $('home544Events');
  if (!events || currentScreen !== 'game') return;
  const en = I18N.lang === 'en';
  const label = en ? 'Events & finds' : 'События и находки';
  if ($('home544EventsLabel').textContent !== label) $('home544EventsLabel').textContent = label;
  const pins = Array.from(events.querySelectorAll('.home544-pins > [data-act]:not(.hidden)'));
  for (const pin of pins) {
    if (pin.tabIndex >= 0) continue;
    pin.tabIndex = 0;
    pin.setAttribute('role', 'button');
  }
  const effects = $('effects');
  for (const chip of effects.querySelectorAll(':scope > .chip[data-id]')) {
    const spec = EFFECTS[chip.dataset.id];
    const diagnosed = chip.firstElementChild.textContent !== '❓';
    const text = diagnosed && spec ? I18N.t(spec.name) : (en ? 'Unknown condition' : 'Неизвестное состояние');
    let name = chip.querySelector('.home544-effect-name');
    if (!name) {
      name = document.createElement('strong');
      name.className = 'home544-effect-name';
      name.setAttribute('data-i18n-ignore', '');
      chip.insertBefore(name, chip.lastElementChild);
    }
    if (name.textContent !== text) name.textContent = text;
  }
  const extras = $('nb534HomeExtras');
  const count = pins.length + effects.childElementCount + Number(!$('boostBadge').classList.contains('hidden')) +
    (extras && !extras.hidden ? extras.children.length : 0);
  events.hidden = !count;
  // A ready chest is immediately recognisable, even before opening the list.
  const preview = pins.some(pin => pin.id === 'chestPin') ? (en ? 'Chest ready' : 'Сундук готов') : String(count);
  if ($('home544EventsHint').textContent !== preview) $('home544EventsHint').textContent = preview;
}

HOOKS.init.push(() => {
  const home = $('screen-game');
  const scene = $('scene');
  const events = document.createElement('details');
  events.id = 'home544Events';
  events.hidden = true;
  events.innerHTML = '<summary><strong id="home544EventsLabel" data-i18n-ignore></strong>' +
    '<span id="home544EventsHint" data-i18n-ignore></span></summary><div class="home544-pins"></div>';
  const pins = events.querySelector('.home544-pins');
  pins.append($('chestPin'));
  // Tour and debt insert themselves relative to invPin, including on later HUD updates.
  for (const pin of Array.from(scene.querySelector('.scene-hud-left').children)) {
    if (pin.id !== 'questPin') pins.append(pin);
  }
  events.append(scene.querySelector('.scene-right'), $('nb534HomeExtras'));
  events.addEventListener('keydown', event => {
    if (event.repeat || !['Enter', ' '].includes(event.key) ||
        !event.target.matches('.home544-pins > [role="button"]')) return;
    event.preventDefault();
    event.target.click();
  });
  // DOM order also determines keyboard order on mobile.
  scene.after(home.querySelector('.bars'), home.querySelector('.actions'), $('home543Yield'), events, $('next528'));
  home544Events();
});

HOOKS.hud.push(home544Events);
