// The bench uses actual market supplies. Station selection is personal; cabinet finishes and art follow the garage.
const GARAGE_RECIPES547 = {
  radio: ['Собрать радиолу','Build a radio',2,1],
  lamp: ['Починить лампу','Repair a lamp',1,2],
  sign: ['Подсветить вывеску','Wire a shop sign',2,2]
};
const GARAGE_STYLES547 = {plain:['Орех','Walnut',0],mint:['Мята','Mint',2],cherry:['Вишня','Cherry',4],mosaic:['Мозаика','Mosaic',6]};
const GARAGE_STATIONS547 = [
  ['Дворовое радио','Courtyard FM','88.4',[60,64,67,69,67,64,62,60]],
  ['Ночной трамвай','Night Tram','95.2',[57,60,64,67,65,64,60,57]],
  ['Маяк гаражей','Garage Beacon','103.7',[67,67,64,62,60,64,62,67]]
];
let garageBoard547 = null, garageTone547 = null, garageRefresh547 = 0, garageSession547 = 0;
function garageEligible547() {
  const n = S.neighborhood534;
  return !!n?.firstJobAt && ['market','workshop'].includes(n.route);
}
function garageEntry547() {
  return garageEligible547() ? `<button class="nb534-button is-main" data-act="garageBench547">📻 ${marketLang547('Верстак и радио','Workbench & radio')}</button>` : '';
}
function garageRadio547(style, station = 0) {
  const finish = Object.hasOwn(GARAGE_STYLES547,style) ? style : 'plain';
  const band = GARAGE_STATIONS547[station] || GARAGE_STATIONS547[0];
  return `<div class="gr547-radio gr547-${finish}" aria-hidden="true"><i class="gr547-handle"></i><div class="gr547-case"><div class="gr547-scale"><span>FM</span><strong>${band[2]}</strong><i></i></div><div class="gr547-grille"></div><b class="gr547-knob"></b></div></div>`;
}
function garageVisit547(garage) {
  return garage?.radio ? `<div class="gr547-visit">${garageRadio547(garage.style)}<span>${marketLang547('Радиола','Radio')} · ${marketLang547(...GARAGE_STYLES547[Object.hasOwn(GARAGE_STYLES547,garage.style)?garage.style:'plain'])}</span></div>` : '';
}
function garageStation547() {
  try { const i = Number(localStorage.getItem('radioStation547')); return GARAGE_STATIONS547[i] ? i : 0; } catch (_) { return 0; }
}
function garageStop547() {
  if (garageTone547) { garageTone547.close().catch(()=>{}); garageTone547 = null; }
}
function garageTune547(index) {
  if (!GARAGE_STATIONS547[index]) return;
  try { localStorage.setItem('radioStation547',String(index)); } catch (_) {}
  garageStop547();
  const ctxType = window.AudioContext || window.webkitAudioContext;
  if (ctxType && S.settings?.music !== false && S.settings?.mainMusic !== 'off') {
    try {
      const ctx = garageTone547 = new ctxType();
      ctx.resume().then(() => {
        if (garageTone547 !== ctx || !$('gr547Bench')) return;
        const beat = [0.17,0.25,0.14][index];
        GARAGE_STATIONS547[index][3].forEach((note,i) => {
          const oscillator = ctx.createOscillator(), env = ctx.createGain(), at = ctx.currentTime + i*beat + 0.02;
          oscillator.type = ['triangle','sine','triangle'][index];
          oscillator.frequency.value = 440 * 2 ** ((note-69)/12);
          env.gain.setValueAtTime(0.0001,at); env.gain.exponentialRampToValueAtTime(0.05,at+0.018);
          env.gain.exponentialRampToValueAtTime(0.0001,at+beat*0.94);
          oscillator.connect(env); env.connect(ctx.destination); oscillator.start(at); oscillator.stop(at+beat);
          if (i===7) oscillator.onended = () => { if (garageTone547===ctx) garageStop547(); };
        });
      }).catch(garageStop547);
    } catch (_) { garageStop547(); }
  }
  if ($('gr547Bench') && garageBoard547) garageDraw547(garageBoard547);
}
function garageButton547(label, action, id, disabled = false) {
  return `<button type="button" class="gr547-button" data-act="${action}" data-id="${id}" ${disabled?'disabled':''}>${label}</button>`;
}
function garageDraw547(state) {
  const t = marketLang547, g = state.garage, el = $('gr547Bench');
  if (!el) return;
  if (!state.garageAccess && !g.available) { el.innerHTML=`<h3>${t('Гаражный верстак','Garage workbench')}</h3><p>${t('Закончи первый заказ в своём гараже.','Finish the first job in your garage.')}</p>`; return; }
  const station = garageStation547(), chosen = GARAGE_STATIONS547[station];
  const jobs = (g.radio ? ['lamp','sign'] : ['radio']).map(key=>{
    const row = GARAGE_RECIPES547[key], done = g.doneToday.includes(key);
    const qty = `${t('Провод','Wire')} ×${row[2]} · ${t('лом','scrap')} ×${row[3]}`;
    return `<article><div><strong>${t(row[0],row[1])}</strong><small>${qty}${key==='radio'?'':' · '+t('1 эскиз','1 sketch')}</small></div>${garageButton547(done?t('Готово','Done'):key==='radio'?t('Собрать','Build'):t('Выполнить','Complete'),'garageMake547',key,done || (S.inv?.copper||0)<row[2] || (S.inv?.scrap||0)<row[3])}</article>`;
  }).join('');
  const finishes = Object.entries(GARAGE_STYLES547).filter(([key])=>key!=='mosaic' || (g.styles.includes('mint')&&g.styles.includes('cherry'))).map(([key,row])=>{
    const owned = g.styles.includes(key), selected = g.style === key;
    return garageButton547(t(row[0],row[1])+(selected?' ✓':owned?'':` · ${row[2]} ✎`),owned?'garageStyle547':'garageFinish547',key,selected || (!owned && g.sketches < row[2]));
  }).join('');
  el.innerHTML = `<header><h3>${t('Гаражный верстак','Garage workbench')}</h3><button class="gr547-x" data-act="close" aria-label="${t('Закрыть','Close')}">×</button></header>
    <div class="gr547-stage">${garageRadio547(g.style,station)}<div><b>${g.radio?t(chosen[0],chosen[1]):t('Радиола Валеры','Valera’s radio')}</b><small>${g.radio?`FM ${chosen[2]}`:t('Самодельная, из находок со двора','Hand-built from courtyard finds')}</small></div></div>
    ${g.radio?`<div class="gr547-stations">${GARAGE_STATIONS547.map((v,i)=>`<button data-act="garageTune547" data-id="${i}" aria-pressed="${station===i}">${v[2]} FM</button>`).join('')}</div><h4>${t('Заказы на сегодня','Today’s repairs')}</h4>`:''}
    ${jobs}<p class="gr547-stock">${t('В сумке','In your bag')} · ${t('провод','wire')} ×${S.inv?.copper||0} · ${t('лом','scrap')} ×${S.inv?.scrap||0}</p>
    ${garageButton547(t('Найти материалы на рынке','Find supplies at the market'),'marketOpen547','goods')}
    ${g.radio?`<h4>${t('Корпус радиолы','Radio cabinet')} · ✎ ${g.sketches}</h4><div class="gr547-finishes">${finishes}</div>`:''}`;
}
function garageObserve547(board) {
  if (!board?.garage || !board?.display) return board;
  garageBoard547 = board;
  garageRefresh547 = Date.now();
  garageHome547(false);
  return board;
}
function garageHome547(fetch = true) {
  if (currentScreen!=='game' || typeof marketArtwork547 !== 'function') return;
  const art = garageBoard547?.display?.art;
  let decor = $('marketArtAtHome547');
  if (art && ['amber','wave'].includes(art.pattern)) {
    if (!decor && $('valera')) {
      decor=document.createElement('div'); decor.id='marketArtAtHome547';
      $('valera').before(decor);
    }
    if (decor && decor.dataset.piece !== String(art.id)) {
      decor.dataset.piece=String(art.id); decor.innerHTML=marketArtwork547(art);
      decor.setAttribute('aria-label',marketLang547('Витраж мастера ','Stained glass by ')+art.makerName);
    }
  } else decor?.remove();
  if (fetch && LOADED && marketRevision547() && onlineOn() && !document.hidden && !marketSyncBusy547() &&
      garageBoard547?.marker !== marketRevision547() && Date.now()-garageRefresh547 > 30000 && serverReady) {
    garageRefresh547 = Date.now();
    marketRead547('market').catch(()=>{});
  }
}
ACTIONS.garageBench547 = async () => {
  const session = ++garageSession547;
  const t = marketLang547;
  openModal(`<section id="gr547Bench" data-i18n-ignore aria-live="polite"><h3>${t('Гаражный верстак','Garage workbench')}</h3><p>${t('Открываем гараж…','Opening the garage…')}</p></section>`,{center:true});
  try { const state=await marketRead547(); if (session===garageSession547) garageDraw547(state); }
  catch(e) { if (session===garageSession547 && $('gr547Bench')) $('gr547Bench').innerHTML=`<p>${marketError547(e.code)}</p>${garageButton547(t('Ещё раз','Retry'),'garageBench547','')}`; }
};
async function garageChange547(action, args) {
  if (marketSyncBusy547()) return;
  try {
    const result = await marketChange547('market',action,args);
    if ($('gr547Bench')) garageDraw547(result);
  } catch (e) { toast(marketError547(e.code || 'sync'),'bad'); }
}
ACTIONS.garageTune547 = id => garageTune547(Number(id));
ACTIONS.garageMake547 = recipe => garageChange547('recipe',{recipe});
ACTIONS.garageFinish547 = style => garageChange547('finish',{style});
ACTIONS.garageStyle547 = style => garageChange547('style',{style});
HOOKS.hud.push(garageHome547);
HOOKS.screen.push(garageStop547);
document.addEventListener('visibilitychange',()=>{ if (document.hidden) garageStop547(); });
const garageWorkshopBefore547 = EXTRA_TABS.tasks.glass546;
EXTRA_TABS.tasks.glass546 = () => garageWorkshopBefore547() + (glass546Eligible() ?
  `<button class="btn wide gl546-entry" data-act="marketOpen547" data-id="art" data-i18n-ignore>${marketLang547('Ярмарка и заказы игроков','Fair & player commissions')} ↗</button>` : '');
