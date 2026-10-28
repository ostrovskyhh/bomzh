// Запуск игры — после того как все модули подключили свои хуки
init();

// Telegram любит показывать игру из кэша, даже когда на GitHub уже новая версия.
// Поэтому игра сама сверяет свой номер версии с сайтом и, если вышла новая, перезагружается на неё.
(function autoUpdate() {
  const me = document.currentScript && (document.currentScript.src || document.currentScript.dataset.source);
  const cur = me && (me.match(/[?&]v=([\w.]+)/) || [])[1];
  if (!cur || location.protocol === 'file:') return;
  const check = () => fetch(new URL(`changelog.js?nocache=${Date.now()}`, document.baseURI), { cache: 'no-store' })
    .then((r) => (r.ok ? r.text() : ''))
    .then((html) => {
      const v = (html.match(/\bv:\s*['"]([\w.]+)['"]/) || [])[1];
      if (!v || v === cur) return;
      // Не больше одной перезагрузки на версию — вдруг сайт ещё не обновился до конца
      const key = `bomzh_reload_${v}`;
      try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch (e) { return; }
      if (typeof LOADED !== 'undefined' && LOADED) save();
      const u = new URL(location.href);
      u.searchParams.set('v', v);
      location.replace(u.toString()); // хеш с данными Telegram сохраняется
    })
    .catch(() => { /* нет сети — проверим в следующий раз */ });
  setTimeout(check, 3000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
})();
