// Энергетик «Бык»: быстро даёт энергию. Но больше двух банок за 20 минут — сердце не выдерживает:
// сначала «колотится сердце» (предупреждение), дальше — болезнь сердца, которая сама не проходит.
// Лечит только больница: кардиолог (или платная клиника).

const ED_WINDOW = 20 * 60000;
const ED_SAFE = 2; // столько банок за 20 минут можно без последствий

FOOD.push({ id: 'energetik', name: 'Энергетик «Бык»', emoji: '🥤', price: 60, food: 2, energy: 35, mood: 3,
  desc: `+35 ⚡ сразу. Больше ${ED_SAFE} банок за 20 минут — риск для сердца!` });

Object.assign(EFFECTS, {
  palpit: { name: 'Сердце колотится', emoji: '💓', kind: 'bad', desc: 'Тапы −10%. Ещё энергетик — и сердце может не выдержать', mods: { tap: 0.9 } },
  heart: { name: 'Больное сердце', emoji: '🫀', kind: 'disease', desc: 'Здоровье −1/мин, энергия восстанавливается на 40% медленнее, радость −1/мин. Само не пройдёт — лечит кардиолог в больнице', mods: { hpm: -1, regen: 0.6, mpm: -1 } },
});
EFFECT_FIX.heart = ['life', 'health', '#lifeList .cardio-card, #lifeList .card:not(.locked)', 'Иди к кардиологу в больницу'];
EFFECT_FIX.palpit = ['life', 'health', '#lifeList .card:not(.locked)', 'Отдохни и не пей больше энергетики'];
cureHint = (function (orig) { return (id) => (id === 'heart' ? 'кардиолог в больнице' : orig(id)); })(cureHint);

function cardioPrice() { return Math.round(Math.max(1500, 400 * scale()) / 50) * 50; }

eat = (function (orig) {
  return function (id) {
    if (id !== 'energetik') { orig(id); return; }
    const f = FOOD.find((x) => x.id === id);
    if (S.money < f.price) return;
    const now = Date.now();
    S.edLog = (S.edLog || []).filter((t) => now - t < ED_WINDOW);
    S.edLog.push(now);
    const n = S.edLog.length;
    orig(id);
    if (hasEffect('heart')) {
      hurt(20);
      setTimeout(() => toast('🫀 С больным сердцем энергетик — это −20 ❤️. Сначала к кардиологу!', 'bad'), 300);
      return;
    }
    if (n <= ED_SAFE) return;
    // Третья банка — 40% заболеть, четвёртая — 75%, дальше — наверняка
    const risk = n === ED_SAFE + 1 ? 0.4 : n === ED_SAFE + 2 ? 0.75 : 1;
    if (Math.random() < risk) {
      S.effects = S.effects.filter((e) => e.id !== 'palpit');
      addEffect('heart', 0);
      hurt(15);
      track('heartAttack');
      setTimeout(() => {
        resultModal({ emoji: '🫀', rays: 'bad', title: 'Сердце не выдержало!', text: `Перебор с энергетиками — ${n} банки за 20 минут. Теперь у Валеры <b>больное сердце</b>: здоровье тает, энергия копится медленно.<br><br>Само не пройдёт — иди в «Жизнь → Врачи» к кардиологу (${fmt(cardioPrice())} ₽).`, btn: 'К врачу' });
        sfx('bad'); haptic('error');
      }, 300);
    } else {
      addEffect('palpit', 15);
      setTimeout(() => toast(`💓 Сердце колотится! Ещё банка — и может не выдержать`, 'bad'), 300);
    }
  };
})(eat);

// Кардиолог — сверху во «Врачах», когда сердце больное (вкладку собирает family.js через stiCardsHTML)
const _stiCardsHeart = stiCardsHTML;
stiCardsHTML = () => {
  const html = _stiCardsHeart();
  const n = (S.edLog || []).filter((t) => Date.now() - t < ED_WINDOW).length;
  const warn = n >= ED_SAFE && !hasEffect('heart') ? `<div class="info-card warn">🥤 За 20 минут выпито энергетиков: <b>${n}</b>. Следующий — риск для сердца.</div>` : '';
  if (!hasEffect('heart')) return warn + html;
  const price = cardioPrice();
  return `<div class="subhead">🫀 Больница · кардиология</div>` + card({ cls: 'cardio-card', thumb: '🫀', title: 'Кардиолог',
    desc: 'Обследование, капельницы и таблетки. Вылечит больное сердце и поднимет здоровье до 60%+',
    btn: priceBtn('cardio', 'go', price, S.money >= price && !S.busy) }) + html;
};

ACTIONS.cardio = () => {
  const price = cardioPrice();
  if (!hasEffect('heart') || S.money < price || S.busy) return;
  S.money -= price;
  S.effects = S.effects.filter((e) => e.id !== 'heart' && e.id !== 'palpit');
  S.edLog = [];
  S.health = Math.max(S.health, Math.round(maxHealth() * 0.6));
  track('cured');
  resultModal({ emoji: '🏥', title: 'Сердце в порядке', text: `Кардиолог прокапал, выписал таблетки и строго сказал: «Не больше ${ED_SAFE} банок за раз!» −${fmt(price)} ₽`, btn: 'Спасибо, доктор' });
  sfx('good');
};
