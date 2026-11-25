// Presentation only. The original scene, equipment and input handlers remain in use.
HOOKS.init.push(() => {
  const home = $('screen-game');
  const actions = home?.querySelector('.actions');
  const needs = home?.querySelector('.bars');
  if (actions && needs) actions.after(needs);
  if (needs && $('next528')) needs.after($('next528'));
});

HOOKS.hud.push(() => {
  const scene = $('scene');
  const backdrop = $('sceneBg');
  if (!scene || !backdrop) return;
  const park = city() === 'zas' && S.housing === 0;
  let art = scene.querySelector('.cartoon538-yard-art');
  if (park && !art) {
    art = document.createElement('img');
    art.className = 'cartoon538-yard-art hidden';
    art.alt = '';
    art.draggable = false;
    art.decoding = 'async';
    art.addEventListener('load', () => {
      if (city() === 'zas' && S.housing === 0) art.classList.remove('hidden');
    }, {once: true});
    art.src = 'assets/cartoon538-yard.jpg';
    backdrop.after(art);
  }
  if (art && art.complete && art.naturalWidth) art.classList.toggle('hidden', !park);
});
