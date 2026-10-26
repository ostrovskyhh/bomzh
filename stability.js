// Надёжность мини-игр и мелкие улучшения интерфейса.
//
// Почему мини-игры зависали: пока идёт игра, другое окно (подарок друга, «Пока тебя не было…»,
// награда за приглашение, рассылка и т.п.) могло открыться поверх и стереть поле игры — таймер
// останавливался, а итоги не подводились. Теперь такие окна ждут в очереди, пока игра не закончится,
// а «сторож» сам завершает игру, если она почему-то затянулась.

let MODAL_QUEUE = [];
openModal = (function (orig) {
  return function (html, opts) {
    const isGame = html.includes('class="mg"');
    const needsHandlers = html.includes('id="storyNext"') || html.includes('data-opt=');
    if (MG && !MG.over && !isGame && !needsHandlers) {
      MODAL_QUEUE.push({ html, opts });
      return document.createElement('div');
    }
    return orig(html, opts);
  };
})(openModal);
closeModal = (function (orig) {
  return function () {
    orig();
    if (MODAL_QUEUE.length) setTimeout(flushModalQueue, 350);
  };
})(closeModal);
function flushModalQueue() {
  if (MG || modalOpen() || !MODAL_QUEUE.length) return;
  const q = MODAL_QUEUE.shift();
  openModal(q.html, q.opts);
  fillIcons();
}

// Сторож: игра с таймером не может идти дольше своего времени, игра без таймера — дольше 2 минут
runGame = (function (orig) {
  return function (o) {
    orig(o);
    if (MG) MG.limit = (o.duration ? o.duration + 4 : 120) * 1000;
  };
})(runGame);
setInterval(() => {
  if (MG && MG.start && !MG.over && Date.now() - MG.start > MG.limit) mgEnd();
  if (!MG && !modalOpen() && MODAL_QUEUE.length) flushModalQueue();
}, 1000);

// Сколько бутылок даёт один тап — видно на главном экране (бонусы одежды учтены)
HOOKS.hud.push(() => {
  const el = $('passive');
  if (!el) return;
  const t = tapPower();
  const txt = ` · 🍾 за тап: ${t % 1 ? t.toFixed(1) : t}`;
  if (!el.textContent.includes('за тап')) el.textContent += txt;
});
// В магазине одежды — итог по надетому
const _shopClothesTap = EXTRA_TABS.shop.clothes;
EXTRA_TABS.shop.clothes = function clothesWithTotals() {
  let html;
  if (_shopClothesTap) html = _shopClothesTap();
  else { delete EXTRA_TABS.shop.clothes; html = renderShop(); EXTRA_TABS.shop.clothes = clothesWithTotals; }
  const t = tapPower(), bonus = sumGear('tap');
  const parts = [`🍾 За тап сейчас: <b>${t % 1 ? t.toFixed(1) : t}</b> (одежда +${bonus})`, sumGear('energy') ? `⚡ +${sumGear('energy')} к энергии` : '',
    sumGear('crit') ? `💥 +${Math.round(sumGear('crit') * 100)}% крит` : '', sumGear('mood') ? `😊 +${sumGear('mood').toFixed(1)}/мин` : ''].filter(Boolean);
  return `<div class="info-card">${parts.join(' · ')}<br><small>Бонусы работают только у <b>надетых</b> вещей. Настроение, голод и болезни умножают тап.</small></div>` + html;
};
