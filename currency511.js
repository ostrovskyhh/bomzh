// Display units only. Saves, catalog prices and all payment handlers keep their existing units.
const MONEY_UNITS511={zas:['RUB','₽'],msk:['RUB','₽'],mex:['USD','$'],fr:['EUR','€'],it:['EUR','€'],cn:['CNY','¥']};
const CAP_ICON511='<svg data-currency-icon="caps" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 2l2-1 2 1 2-1 2 1 1 3 3 1 1 3-1 3 1 3-2 2-1 3-3 1-3-1-3 1-2-2-3-1-1-3 1-3-1-3 2-2 1-3Z" fill="#b88632"/><circle cx="12" cy="11" r="8" fill="#edbf55" stroke="#f7d989" stroke-width="1.2"/><circle cx="12" cy="11" r="5.8" fill="#d8a442"/><path d="M10.5 6h3v3l1.5 2v5h-6v-5l1.5-2Z" fill="#fff0bc"/><path d="M10 12h4" stroke="#b38132" stroke-width="1.2"/></svg>';
let MONEY_ICON_CITY511='';
function moneyUnit511(c=city()){return MONEY_UNITS511[c]||MONEY_UNITS511.zas;}
function currencyMoney511(value){return `<span class="money-price511" data-currency="money" data-money-amount511="${value}" data-money-city511="${city()}" data-i18n-ignore>${cityMoney(value)}</span>`;}
function currencyCapWord511(n){if(typeof I18N!=='undefined'&&I18N.lang==='en')return n===1?'cap':'caps';const x=Math.abs(Math.round(n))%100;return x>=11&&x<=14?'крышек':x%10===1?'крышка':x%10>=2&&x%10<=4?'крышки':'крышек';}
function currencyCapLabel511(n){return `${fmt(n)} ${currencyCapWord511(n)}`;}
function currencyCapNumber511(text){const matches=[...text.matchAll(/(\d+(?:[ \u00a0\u202f]\d{3})*(?:[.,]\d+)?)(?:\s*(K|M|B|тыс\.?|млн|млрд))?/g)],m=matches.at(-1);return m?Number(m[1].replace(/[ \u00a0\u202f]/g,'').replace(',','.'))*({K:1e3,M:1e6,B:1e9,'тыс':1e3,'тыс.':1e3,'млн':1e6,'млрд':1e9}[m[2]]||1):0;}
function currencyIcons511(){const c=city(),[code,symbol]=moneyUnit511();if(MONEY_ICON_CITY511!==c){ICONS.coin=`<svg data-currency-symbol="${symbol}" data-currency-code="${code}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="11" fill="#d8a036"/><circle cx="12" cy="12" r="8.3" fill="#f1ca66" stroke="#ffe19c" stroke-width="1"/><text data-i18n-ignore x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="800" fill="#91601e" font-family="sans-serif">${symbol}</text></svg>`;MONEY_ICON_CITY511=c;}ICONS.cap=CAP_ICON511;}
function currencyIsCapButton511(b){
 if(b.dataset.currency==='caps'||b.querySelector('[data-ic="cap"]'))return true;
 const a=b.dataset.act,id=b.dataset.id||'';
 if(a==='bottleBuy')return !!bottleById(id)?.caps;
 return ['cosmBuy','dcOpen','dcAgain','caseOpen','caseMulti','xpCaps','capsUse','capCash'].includes(a)&&b.textContent.includes('🟡');
}
function currencyCapButtons511(root){
 root.querySelectorAll('button[data-act]').forEach(b=>{
  if(!currencyIsCapButton511(b))return;if(b.dataset.currency!=='caps')b.dataset.currency='caps';
  const texts=[],walker=document.createTreeWalker(b,NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode()))if(n.nodeValue.includes('🟡')&&!n.parentElement.closest('svg'))texts.push(n);
  for(const node of texts){const f=document.createDocumentFragment(),parts=node.nodeValue.split('🟡');parts.forEach((s,i)=>{if(i){const ic=document.createElement('i');ic.className='ic';ic.dataset.ic='cap';ic.innerHTML=CAP_ICON511;f.append(ic);}f.append(document.createTextNode(s));});node.replaceWith(f);}
  let name=b.querySelector('[data-currency-name511]');
  if(!name&&!/крыш|\bcaps?\b/i.test(b.textContent)){name=document.createElement('span');name.className='currency-name511';name.dataset.currencyName511='';name.dataset.i18nIgnore='';(b.querySelector('.energy77-price,.case-total')||b).append(name);}
  if(name){const label=' '+currencyCapWord511(currencyCapNumber511(b.textContent.replace(name.textContent,'')));if(name.textContent!==label)name.textContent=label;}
  const title=typeof I18N!=='undefined'&&I18N.lang==='en'?'Pay with caps':'Оплата крышками';if(b.title!==title)b.title=title;
  if(b.dataset.why?.includes('🟡'))b.dataset.why=b.dataset.why.replace(/🟡/g,currencyCapWord511(0));
 });
}
function currencyDecor511(root=document){
 if(!root?.querySelectorAll)return;currencyIcons511();currencyCapButtons511(root);const [code,symbol]=moneyUnit511();
 root.querySelectorAll('.ic[data-ic="coin"],.ic[data-ic="cap"]').forEach(el=>{const cap=el.dataset.ic==='cap',selector=cap?'[data-currency-icon="caps"]':`[data-currency-code="${code}"]`;if(!el.querySelector(selector)||!cap&&el.textContent!==symbol)el.innerHTML=cap?CAP_ICON511:ICONS.coin;});
 root.querySelectorAll('[data-money-amount511]').forEach(el=>{const want=cityMoney(Number(el.dataset.moneyAmount511));if(el.textContent!==want)el.textContent=want;if(el.dataset.moneyCity511!==city())el.dataset.moneyCity511=city();});
 const caps=root.querySelector('#resCaps');if(caps){const label=(typeof I18N!=='undefined'&&I18N.lang==='en'?'Caps: ':'Крышки: ')+Number(S.caps||0).toLocaleString('ru-RU');if(caps.getAttribute('aria-label')!==label)caps.setAttribute('aria-label',label);if(caps.title!==label)caps.title=label;}
 const cash=root.querySelector('#resMoney');if(cash){const title=code+' · '+symbol;if(cash.title!==title)cash.title=title;}
}
const currencyPriceBefore511=priceBtn;priceBtn=function(act,id,price,can,label){
 currencyIcons511();const cashDefault=(!label||String(label).startsWith('<i class="ic" data-ic="coin"></i>'))&&Number.isFinite(price)&&price>0,html=currencyPriceBefore511(act,id,price,can,cashDefault?currencyMoney511(price):label);
 if(!html.includes('data-currency="caps"')&&!html.includes('data-ic="cap"'))return html;
 const t=document.createElement('template');t.innerHTML=html;currencyCapButtons511(t.content);return t.innerHTML;
};
const currencyBottlePriceBefore511=bottlePrice;bottlePrice=b=>b.caps?currencyCapLabel511(b.caps):currencyBottlePriceBefore511(b);
const currencyWorldTextBefore511=worldMoneyText50;worldMoneyText50=function(text){const out=currencyWorldTextBefore511(text);return WORLD50[city()]?String(out).replace(/₽/g,moneyUnit511()[1]):out;};
const currencyFillBefore511=fillIcons;fillIcons=function(root=document){currencyIcons511();currencyFillBefore511(root);currencyDecor511(root);};
HOOKS.hud.push(()=>currencyDecor511());HOOKS.screen.push(()=>currencyDecor511());
