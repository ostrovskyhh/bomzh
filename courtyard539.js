const COURTYARD539_CITIES = {
  zas: 'park', msk: 'msk', mex: 'mex', fr: 'fr', it: 'it', cn: 'cn',
};
const COURTYARD540_OUTDOOR_HOMES = {
  zas: [0, 1, 2], msk: [0], mex: [0, 1, 4, 6], fr: [0, 1, 6], it: [0, 1, 6], cn: [0, 1],
};

function courtyard539Backdrop() {
  const scene = $('scene');
  const cityId = city();
  const housing = S.housing;
  const location = cityId + ':' + housing;
  const starter = COURTYARD539_CITIES[cityId];
  const asset = starter && Number.isInteger(housing) && housing >= 0 && housing < HOUSING.length
    ? housing === 0 ? 'assets/courtyard539-' + starter + '.webp' : 'assets/homes540/' + cityId + '/' + housing + '.webp'
    : null;
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
  if (asset && art.dataset.location !== location) {
    art.dataset.location = location;
    art.src = asset;
  }
  scene.toggleAttribute('data-courtyard539-scenery', !!asset && !!art?.complete && !!art.naturalWidth);
  scene.toggleAttribute('data-courtyard540-indoor', !!asset && !COURTYARD540_OUTDOOR_HOMES[cityId].includes(housing));
}

HOOKS.hud.push(courtyard539Backdrop);
