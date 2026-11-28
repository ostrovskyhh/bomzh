// Display the player's equipped character and current home in their own profile.
function paintProfile543(sheet) {
  if (!document.body.classList.contains('courtyard539')) return;
  const banner = sheet.querySelector('.story-art');
  const miniature = banner?.querySelector('.valera-mini');
  if (!miniature) return;
  renderScene();
  courtyard539Backdrop();
  const sceneArt = $('scene').querySelector('.courtyard539-scenery');
  if (sceneArt && sceneArt.dataset.location === city() + ':' + S.housing) {
    const image = document.createElement('img');
    image.alt = '';
    image.className = 'profile543-scenery';
    image.hidden = true;
    image.addEventListener('load', () => { image.hidden = false; }, {once:true});
    image.src = sceneArt.src;
    banner.insertBefore(image, miniature);
  }

  const sceneHero = $('valera');
  function copyHero() {
    const figure = sceneHero.querySelector('svg');
    if (!figure) return;
    const clone = figure.cloneNode(true);
    // The two inline SVGs share a document. Keep each gradient and clip with
    // its own figure, while preserving references to the game's global defs.
    const ids = new Map();
    for (const node of clone.querySelectorAll('[id]')) {
      ids.set(node.id, 'profile543-' + node.id);
      node.id = ids.get(node.id);
    }
    if (ids.size) {
      for (const node of clone.querySelectorAll('*')) {
        for (const attribute of node.attributes) {
          if (!attribute.value.includes('#')) continue;
          if (attribute.localName === 'href' && ids.has(attribute.value.slice(1)) && attribute.value.startsWith('#')) {
            attribute.value = '#' + ids.get(attribute.value.slice(1));
          } else {
            attribute.value = attribute.value.replace(/url\(#([\w-]+)\)/g, (url, id) =>
              ids.has(id) ? 'url(#' + ids.get(id) + ')' : url);
          }
        }
      }
    }
    miniature.replaceChildren(clone);
  }
  copyHero();
  // When a sprite finishes downloading the courtyard replaces its fallback.
  const changes = new MutationObserver(() => {
    if (sheet.isConnected) copyHero();
    else changes.disconnect();
  });
  changes.observe(sceneHero, {childList:true});
  changes.observe($('modalRoot'), {childList:true});
}
