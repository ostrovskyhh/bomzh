(() => {
  const navigation = document.getElementById('tabbar');

  function describeSection(button) {
    if (button.classList.contains('fs-lock528')) {
      const description = redesign536Text('Откроется по сюжету', 'Unlocks through the story');
      button.setAttribute('aria-description', description);
    } else {
      button.removeAttribute('aria-description');
    }
  }

  function describeSections() {
    navigation.querySelectorAll('button[data-hub]').forEach(describeSection);
  }

  // The game can rebuild all six buttons after a cloud save loads and unlocks them as quests finish.
  if (navigation) {
    describeSections();
    document.addEventListener('game-language-change', describeSections);
    new MutationObserver(changes => {
      for (const change of changes) {
        if (change.type === 'attributes' && change.target.matches('button[data-hub]')) {
          describeSection(change.target);
        } else if (change.type === 'childList' && change.target === navigation) {
          describeSections();
        }
      }
    }).observe(navigation, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  }

  const viewport = window.visualViewport;
  if (!viewport) return;
  const page = document.documentElement;
  const inputTypes = 'textarea, [contenteditable="true"], input:not([type]), input:is([type=text],[type=search],[type=email],[type=number],[type=tel],[type=url],[type=password])';

  function fitEditor() {
    const editing = document.activeElement?.matches(inputTypes);
    const occluded = window.innerHeight - viewport.height;
    const keyboard = editing && viewport.scale === 1 && occluded > 80;
    page.toggleAttribute('data-nav543-keyboard', !!keyboard);
    if (keyboard) {
      page.style.setProperty('--nav543-visible-height', viewport.height + 'px');
      page.style.setProperty('--nav543-visible-top', viewport.offsetTop + 'px');
    } else {
      page.style.removeProperty('--nav543-visible-height');
      page.style.removeProperty('--nav543-visible-top');
    }
  }

  viewport.addEventListener('resize', fitEditor);
  viewport.addEventListener('scroll', fitEditor);
  document.addEventListener('focusin', fitEditor);
  document.addEventListener('focusout', () => requestAnimationFrame(fitEditor));
})();
