function hideHubLock545(restoreFocus = false) {
  const hint = $('hubLock545');
  if (!hint) return;
  const origin = hint.dataset.hub;
  hint.remove();
  if (restoreFocus) $('tabbar').querySelector('[data-hub="' + origin + '"]')?.focus({preventScroll: true});
}

function showHubLock545(id, focus = true) {
  let hint = $('hubLock545');
  if (!hint) {
    hint = document.createElement('aside');
    hint.id = 'hubLock545';
    hint.dataset.i18nIgnore = '';
    hint.innerHTML = '<div><strong></strong><span id="hubLockReason545"></span></div><button class="btn small" data-act="hubLockStory545" aria-describedby="hubLockReason545"></button><button class="btn small hub-lock-close" data-act="hubLockClose545">×</button>';
    $('app').querySelector('main').before(hint);
  }
  hint.dataset.hub = id;
  hint.querySelector('strong').textContent = redesign536Text(...redesign536Labels[id]);
  $('hubLockReason545').textContent = hubLockReason545(id);
  hint.querySelector('.hub-lock-close').setAttribute('aria-label', redesign536Text('Закрыть подсказку', 'Dismiss hint'));
  const jump = hint.querySelector('[data-act="hubLockStory545"]');
  jump.textContent = redesign536Text('К текущей главе', 'Current chapter');
  if (focus) jump.focus({preventScroll: true});
}

ACTIONS.hubLockClose545 = () => hideHubLock545(true);
ACTIONS.hubLockStory545 = () => {
  hideHubLock545();
  showScreen('tasks', 'story');
  // The action dispatcher refreshes the chapter contents after the click.
  const list = $('tasksList');
  list.tabIndex = -1;
  list.focus({preventScroll: true});
};
HOOKS.screen.push(() => hideHubLock545());

function storyNeedsHome545() {
  return currentScreen === 'tasks' && TABS.tasks === 'story' && !hubOpen528('goals');
}
const hubBackBar545 = betaBackBar;
betaBackBar = function (screen) {
  hubBackBar545(screen);
  if (screen === 'tasks' && storyNeedsHome545()) {
    const back = $('bb-tasks')?.querySelector('.bb-back');
    if (back) { back.dataset.id = 'home'; back.textContent = redesign536Text('‹ Дом', '‹ Home'); }
  }
};
const hubNavBack545 = navBack;
navBack = function () {
  if (storyNeedsHome545()) { showScreen('game'); return; }
  return hubNavBack545();
};

(() => {
  const navigation = document.getElementById('tabbar');

  function describeSection(button) {
    if (button.classList.contains('fs-lock528')) {
      button.setAttribute('aria-description', hubLockReason545(button.dataset.hub));
    } else {
      button.removeAttribute('aria-description');
      if ($('hubLock545')?.dataset.hub === button.dataset.hub) hideHubLock545();
    }
  }

  function describeSections() {
    navigation.querySelectorAll('button[data-hub]').forEach(describeSection);
  }

  // The game can rebuild all six buttons after a cloud save loads and unlocks them as quests finish.
  if (navigation) {
    describeSections();
    document.addEventListener('game-language-change', () => {
      describeSections();
      const id = $('hubLock545')?.dataset.hub;
      if (id) showHubLock545(id, false);
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || event.defaultPrevented || !$('hubLock545') || modalOpen()) return;
      event.preventDefault();
      hideHubLock545(true);
    });
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
