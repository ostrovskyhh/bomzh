// Внешний вид бутылки: отдельная косметика без игровых бонусов.
const BOTTLE_SKINS = [
  { id:'bt_green', name:'Зелёная классика', price:0, color:'#55a66b', dark:'#20543b', cap:'#d2b358', label:'В', shape:'slim' },
  { id:'bt_amber', name:'Янтарное стекло', price:1500, color:'#d08b3b', dark:'#71391f', cap:'#ba8358', label:'Я', shape:'round' },
  { id:'bt_blue', name:'Синий лёд', price:4500, color:'#79d3ed', dark:'#2363a4', cap:'#c5e4f0', label:'❄', shape:'square' },
  { id:'bt_milk', name:'Молочная ретро', price:10000, color:'#f8f1d8', dark:'#a9baaf', cap:'#c14448', label:'М', shape:'milk' },
  { id:'bt_fiesta', name:'Фиеста', price:20000, color:'#f0bc4a', dark:'#b66a24', cap:'#db4559', label:'★', shape:'round' },
  { id:'bt_neon', name:'Неоновый пульс', caps:35, color:'#74f9dd', dark:'#6939b9', cap:'#cf78ff', label:'N', shape:'slim', effect:'neon' },
  { id:'bt_cosmos', name:'Космос в стекле', caps:65, color:'#a48bff', dark:'#292257', cap:'#d9b9ff', label:'✦', shape:'round', effect:'cosmos' },
  { id:'bt_lava', name:'Лавовый поток', caps:100, color:'#ffb548', dark:'#9f2e37', cap:'#ffd27b', label:'◆', shape:'square', effect:'lava' },
];
let BOTTLE_SVG_SEQ=0, BOTTLE_BACK_DONATE=false;
function bottleById(id) { return BOTTLE_SKINS.find(b=>b.id===id); }
function bottleOwned(b) { return b.id==='bt_green' || ownsCosm(b.id); }
function bottleCurrent() { const b=bottleById(S.bottleSkin); return b && bottleOwned(b) ? b : BOTTLE_SKINS[0]; }
function bottleGraphic(b) {
  const id=`btg${++BOTTLE_SVG_SEQ}`;
  const path=b.shape==='milk' ? 'M6 4h12v11c0 4 5 7 5 13v24q0 4-4 4H5q-4 0-4-4V28c0-6 5-9 5-13Z'
    : b.shape==='square' ? 'M8 4h8v13l7 8v28q0 3-3 3H4q-3 0-3-3V25l7-8Z'
    : b.shape==='round' ? 'M8 4h8v13c1 4 7 6 7 14v19q0 6-6 6H7q-6 0-6-6V31c0-8 6-10 7-14Z'
    : 'M8 4h8v15c0 4 5 5 5 10v23q0 4-4 4H7q-4 0-4-4V29c0-5 5-6 5-10Z';
  return `<g class="bottle-viz ${b.effect?'bt-premium bt-'+b.effect:''}" style="--bt-glow:${b.color}">
    <defs><linearGradient id="${id}"><stop stop-color="${b.dark}"/><stop offset=".42" stop-color="${b.color}"/><stop offset=".62" stop-color="${b.color}"/><stop offset="1" stop-color="${b.dark}"/></linearGradient><clipPath id="${id}c"><path d="${path}"/></clipPath></defs>
    <path class="bt-shell" d="${path}" fill="url(#${id})" stroke="${b.dark}" stroke-width="1.2"/>
    <g clip-path="url(#${id}c)"><path d="M7 23v27" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".4"/>
      ${b.effect?`<circle class="bt-bubble" cx="9" cy="46" r="2"/><circle class="bt-bubble delay" cx="16" cy="39" r="1.5"/><circle class="bt-bubble late" cx="12" cy="51" r="1.2"/><path class="bt-sheen" d="M-8 10l8-4 35 53-8 4Z" fill="#fff" opacity=".2"/>`:''}</g>
    <rect x="5" y="30" width="14" height="13" rx="2" fill="${b.effect?'#242133':'#fff2d5'}" opacity=".9"/>
    <text x="12" y="40" text-anchor="middle" font-size="9" font-weight="900" fill="${b.effect?b.color:b.dark}">${b.label}</text>
    <rect x="7" y="1" width="10" height="5" rx="1.5" fill="${b.cap}"/><path d="M9 2h6" stroke="#fff" opacity=".5"/>
    ${b.effect?'<path class="bt-star" d="M24 12v8m-4-4h8M0 24v6m-3-3h6" stroke="currentColor" stroke-width="1"/>':''}
  </g>`;
}
function bottleHandSVG(id) { return `<g transform="translate(127 91)">${bottleGraphic(bottleById(id)||BOTTLE_SKINS[0])}</g>`; }
function bottlePreview(b) { return `<svg class="bottle-preview" viewBox="-7 -3 38 66" role="img" aria-label="${b.name}">${bottleGraphic(b)}</svg>`; }
lookState=(function(orig){return ()=>({...orig(),bottle:bottleCurrent().id});})(lookState);
function bottleShopHTML(premium=false) {
  const list=BOTTLE_SKINS.filter(b=>!!b.caps===premium);
  return `<section class="bottle-shop"><div class="subhead">🍾 ${premium?'Анимированные бутылки':'Бутылки · внешний вид'}</div>
    <p class="test-note">${premium?'Переливы, пузырьки и свечение — в руке Валеры. Покупка навсегда за крышки.':'Выбери бутылку для Валеры. Обычные варианты покупаются за игровые рубли.'} Только внешний вид: без бонусов к доходу и топу. Сохраняется при престиже.</p>
    <div class="bottle-grid">${list.map(b=>`<button class="bottle-card ${bottleCurrent().id===b.id?'selected':''}" data-act="bottleInfo" data-id="${premium?'donate':'clothes'}:${b.id}">${bottlePreview(b)}<b>${b.name}</b><small>${bottleCurrent().id===b.id?'✓ Надето':bottleOwned(b)?'В коллекции':b.caps?`${b.caps} 🟡`:`${fmt(b.price)} ₽`}</small><span>Посмотреть</span></button>`).join('')}</div>
    ${!premium?'<button class="btn wide" data-act="bottleDonate">✨ Анимированные бутылки · донат</button>':''}</section>`;
}
EXTRA_TABS.shop.clothes=(function(orig){return ()=>bottleShopHTML(false)+orig();})(EXTRA_TABS.shop.clothes);
function bottleBack() { if(BOTTLE_BACK_DONATE){DN_TAB='bottles';openDonate();}else{closeModal();renderCurrent(false);} }
Object.assign(ACTIONS,{
  bottleDonate:()=>{DN_TAB='bottles';openDonate();},
  bottleInfo:(arg)=>{
    const [from,id]=arg.split(':');const b=bottleById(id);if(!b)return;
    BOTTLE_BACK_DONATE=from==='donate';const owned=bottleOwned(b),price=b.caps?`${b.caps} 🟡`:`${fmt(b.price)} ₽`,enough=b.caps?S.caps>=b.caps:S.money>=b.price;
    openModal(`<div class="bottle-detail">${bottlePreview(b)}<h3>${b.name}</h3><p>${b.effect?'Анимированная':'Обычная'} бутылка в руке Валеры. Без бонусов к заработку и рейтингу.</p><p>Покупка навсегда. Не пропадает при престиже.</p>
      ${owned?`<button class="btn primary wide" data-act="bottleWear" data-id="${id}">${bottleCurrent().id===id?'Уже надето':'Надеть'}</button>`:`<button class="btn primary wide" data-act="bottleBuy" data-id="${id}" ${enough?'':'disabled'}>Купить и надеть · ${price}</button>${enough?'':`<p class="test-note">Недостаточно ${b.caps?'крышек':'рублей'}.</p>`}`}
      <button class="btn wide" data-act="bottleBack">Назад</button></div>`);
  },
  bottleWear:(id)=>{const b=bottleById(id);if(!b||!bottleOwned(b))return;S.bottleSkin=id;renderScene();save();bottleBack();},
  bottleBuy:(id)=>{
    const b=bottleById(id);if(!b||bottleOwned(b))return;
    if(b.caps){if(S.caps<b.caps)return;S.caps-=b.caps;}else{if(S.money<b.price)return;S.money-=b.price;}
    giveCosm(id);S.bottleSkin=id;renderScene();save();toast(`🍾 ${b.name} — надето!`,'good');bottleBack();
  },
  bottleBack,
});
