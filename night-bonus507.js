// Moscow's daily [00:00, 06:00) window, independent of device timezone.
// Prefer the existing monotonic server clock; offline startup uses the epoch clock.
function nightBonusNow507(){return businessNow()??Date.now();}
function nightBonusActive507(now=nightBonusNow507()){
 return Number.isFinite(now)&&new Date(now+3*3600000).getUTCHours()<6;
}
const NIGHT_BONUS507=1.3;
const nightTapBefore507=tapPower,nightXpBefore507=xpMult;
// Apply after the minimum tap floor so even a weak tap receives the full 30%.
tapPower=()=>nightTapBefore507()*(nightBonusActive507()?NIGHT_BONUS507:1);
xpMult=()=>nightXpBefore507()*(nightBonusActive507()?NIGHT_BONUS507:1);
const NIGHT_BONUS_TEXT507='Каждый день с 00:00 до 06:00 по Москве: +30% бутылок за тап и +30% опыта за игровые действия. Бонус умножает действующие усиления. Доли бутылок и опыта сохраняются.';
HOOKS.hud.push(()=>{
 const box=$('effects');if(!box)return;let badge=$('nightBonus507');
 if(!nightBonusActive507()){badge?.remove();return;}
 if(!badge){badge=document.createElement('button');badge.id='nightBonus507';badge.className='night-bonus507';badge.dataset.act='nightBonus507';badge.textContent='🌙 +30%';badge.title='Ночной бонус: тапы и опыт +30% · до 06:00 МСК';box.appendChild(badge);}
});
ACTIONS.nightBonus507=()=>openModal(`<h3>🌙 Ночной бонус +30%</h3><p>${NIGHT_BONUS_TEXT507}</p><p>В 06:00 по Москве бонус отключается автоматически. Готовые подарочные уровни не умножаются.</p><button class="btn primary wide" data-act="close">Закрыть</button>`);
