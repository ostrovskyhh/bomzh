// This preference belongs to the current device; changing it never writes a game save.
const COURTYARD539_KEY = 'bomzh_courtyard_beta';
let courtyard539Enabled = false;
try { courtyard539Enabled = localStorage.getItem(COURTYARD539_KEY) === '1'; } catch (_) { /* storage unavailable */ }
document.body.classList.toggle('courtyard539', courtyard539Enabled);

const COURTYARD539_CITIES = {
  zas: 'park', msk: 'msk', mex: 'mex', fr: 'fr', it: 'it', cn: 'cn',
};

function courtyard539Backdrop() {
  const scene = $('scene');
  const cityId = city();
  // Each starter location has illustrated scenery; upgraded housing still uses game art.
  const asset = courtyard539Enabled && S.housing === 0 && COURTYARD539_CITIES[cityId];
  let art = scene.querySelector('.courtyard539-scenery');
  if (asset && !art) {
    art = document.createElement('img');
    art.className = 'courtyard539-scenery';
    art.alt = '';
    art.decoding = 'async';
    art.draggable = false;
    art.addEventListener('load', courtyard539Backdrop);
    $('sceneBg').after(art);
  }
  if (asset && art.dataset.location !== cityId) {
    art.dataset.location = cityId;
    art.src = 'assets/courtyard539-' + asset + '.webp';
  }
  scene.toggleAttribute('data-courtyard539-scenery', !!asset && !!art?.complete && !!art.naturalWidth);
}

const courtyard539SettingsBefore = openSettings;
openSettings = function () {
  const result = courtyard539SettingsBefore.apply(this, arguments);
  const page = document.querySelector('#modalRoot .set2-page[data-page="look"]');
  if (!page || page.querySelector('[data-act="courtyard539Toggle"]')) return result;
  const title = 'Двор Валеры · бета';
  page.querySelector('.set2-h').insertAdjacentHTML('afterend', `
    <div class="set-list courtyard539-setting">
      <div class="set-row"><div><b>${title}</b><small>Рисованное оформление. Можно переключить в любой момент.</small></div>
        <button type="button" class="switch${courtyard539Enabled ? ' on' : ''}" role="switch"
          aria-label="${title}" aria-checked="${courtyard539Enabled}" data-act="courtyard539Toggle"><i></i></button>
      </div>
    </div>`);
  return result;
};

ACTIONS.courtyard539Toggle = (_id, button) => {
  courtyard539Enabled = !courtyard539Enabled;
  try { localStorage.setItem(COURTYARD539_KEY, courtyard539Enabled ? '1' : '0'); } catch (_) { /* session only */ }
  document.body.classList.toggle('courtyard539', courtyard539Enabled);
  button.classList.toggle('on', courtyard539Enabled);
  button.setAttribute('aria-checked', String(courtyard539Enabled));
  renderedLook = '';
  renderScene();
  courtyard539Backdrop();
  if (currentScreen === 'hub') renderCurrent();
};

HOOKS.hud.push(courtyard539Backdrop);
