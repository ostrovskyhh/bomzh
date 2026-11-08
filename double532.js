// 5.32 · Акция «Двойные покупки»: 2 дня покупка за Stars зачисляется дважды. Копию создаёт сервер
// (bot/double_promo.py), игра только рассказывает об акции и подписывает вторую копию в чеке.
const DOUBLE_532 = { start: Date.UTC(2026, 10, 8, 10, 0), end: Date.UTC(2026, 10, 10, 10, 0) };
function doubleOn532(t = Date.now()) { return t >= DOUBLE_532.start && t < DOUBLE_532.end; }
function doubleHTML532() {
  if (!doubleOn532()) return '';
  return `<div class="dn-banner"><span>🎁</span><div><b>Двойные покупки ×2</b><small>Всё, что купишь за Stars, придёт дважды: крышки, кейсы и наборы, а VIP, Premium и облики — на двойной срок. Косметика, питомцы, билеты и поддержка проекта не удваиваются · осталось <span data-until="${DOUBLE_532.end}"></span></small></div></div>`;
}
donateHTML = (function (orig) {
  return function (...args) {
    const html = orig.apply(this, args), banner = doubleHTML532();
    if (!banner) return html;
    const at = html.indexOf('<div class="dn-tabs">');
    return at < 0 ? banner + html : html.slice(0, at) + banner + html.slice(at);
  };
})(donateHTML);

// Подпись второй копии в окне «Покупка зачислена».
const doubleClaimBefore532 = payClaim;
payClaim = async function (...args) {
  const give = {};
  for (const [id, fn] of Object.entries(PREM_GIVE)) give[id] = fn;
  for (const id of Object.keys(give)) PREM_GIVE[id] = (it, ...rest) => { const line = give[id](it, ...rest); return it && it.double && line ? `🎁 Акция ×2: ${line}` : line; };
  try { return await doubleClaimBefore532.apply(this, args); } finally { Object.assign(PREM_GIVE, give); }
};

// Объявление о старте показывается один раз.
HOOKS.tick.push(() => {
  if (!doubleOn532() || S.double532Seen || !S.storySeen || (S.tut && !S.tut.done) || S.busy || !popupTurn(4)) return;
  S.double532Seen = 1;
  sfx('notify');
  openModal(`<div class="big-art" style="height:100px"><div class="rays"></div><div class="big-emoji" style="line-height:100px">🎁</div></div>
    <h3>Двойные покупки на 2 дня</h3><p>Всё, что купишь за Stars, придёт дважды: крышки, VIP, Premium, кейсы и наборы.</p>
    <p class="test-note">Закончится через <span data-until="${DOUBLE_532.end}"></span></p>
    <div class="btns" style="flex-direction:column;gap:8px"><button class="btn primary wide" data-act="double532Go">⭐ В магазин</button><button class="btn wide" data-act="close">Позже</button></div>`, { center: true });
});
ACTIONS.double532Go = () => { closeModal(); openDonate(); };
