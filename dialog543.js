// Settings, profile and sensitive confirmations share keyboard navigation.
// Prompts used by games and locked story scenes keep their own controls.
(() => {
  const root = $('modalRoot');
  let opener = null;
  const previousOpen = openModal;
  const previousClose = closeModal;
  const cancelConfirmation = '[data-act="storyAccessCancel521"], [data-act="divorceConfirmCancel"]';

  function prepare(sheet) {
    if (!sheet?.isConnected) return;
    let kind;
    if (sheet.querySelector('.set2')) kind = 'settings';
    else if (sheet.querySelector('.story-art') && sheet.querySelector('[data-act="levelGuide"]')) kind = 'profile';
    else if (sheet.querySelector('.story-access-confirm521, .divorce-confirm')) kind = 'confirm';
    else return;
    const heading = sheet.querySelector('h3');
    if (!heading) return;
    if (!heading.id) heading.id = 'dialog543Title';
    sheet.dataset.dialog543 = kind;
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-labelledby', heading.id);
    sheet.tabIndex = -1;
    if (kind === 'profile') paintProfile543(sheet);
    if (!sheet.contains(document.activeElement)) sheet.focus({preventScroll:true});
  }

  openModal = function(...args) {
    const active = document.activeElement;
    if (!root.contains(active)) opener = active === document.body ? null : active;
    const backdrop = previousOpen.apply(this, args);
    if (!backdrop.dataset.locked) {
      const sheet = backdrop.querySelector('.sheet');
      // Settings and profile finish assembling their controls in the calling function.
      queueMicrotask(() => prepare(sheet));
    }
    return backdrop;
  };
  closeModal = function(...args) {
    const managed = root.querySelector('[data-dialog543]');
    const restore = managed && opener;
    opener = null;
    const result = previousClose.apply(this, args);
    if (restore?.isConnected && !modalOpen() && restore.getClientRects().length)
      restore.focus({preventScroll:true});
    return result;
  };

  // Use the same cancellation path as the button so temporary offers are cleared.
  root.addEventListener('click', event => {
    const backdrop = event.target;
    if (!backdrop.matches?.('.backdrop') || backdrop.dataset.locked) return;
    const cancel = backdrop.querySelector('[data-dialog543="confirm"]')?.querySelector(cancelConfirmation);
    if (cancel) {
      event.stopPropagation();
      cancel.click();
    }
  }, true);

  document.addEventListener('keydown', event => {
    const sheet = root.querySelector('[data-dialog543]');
    if (!sheet || sheet.parentElement.dataset.locked || event.defaultPrevented || event.isComposing) return;
    if (event.key === 'Escape') {
      const cancel = sheet.querySelector(cancelConfirmation) ||
        sheet.querySelector('.set2 > .btns [data-act="close"], .btns [data-act="close"]');
      if (cancel) { event.preventDefault(); cancel.click(); }
    } else if (event.key === 'Tab') {
      const stops = [...sheet.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')]
        .filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length && getComputedStyle(el).visibility === 'visible');
      const index = stops.indexOf(document.activeElement);
      if (stops.length && (event.shiftKey ? index <= 0 : index === stops.length - 1)) {
        event.preventDefault();
        stops[event.shiftKey ? stops.length - 1 : 0].focus();
      }
    }
  });
  window.addEventListener('click', event => {
    const button = event.target.closest?.('.set2 button');
    if (!button) return;
    const page = button.closest('.set2-page');
    if (button.dataset.act === 'setGo')
      root.querySelector('.set2-page:not(.hidden) .set2-back')?.focus({preventScroll:true});
    if (button.dataset.act === 'setHome' && page)
      root.querySelector('.set2-tile[data-id="' + page.dataset.page + '"]')?.focus();
  });
})();
