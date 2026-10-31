// Purchase intent comes from the payment path, never from a reward mentioned on a button.
const PURCHASE_ACTIONS519=new Set(['bizBuy','bizUp','bizFix','bizStaff','bottleBuy','cosmBuy','dcOpen','dcAgain','caseOpen','caseMulti','trick','trickUp','xpCaps','capsUse','capCash','fleaBuy','marketBuy','garageBuy','fuel','petFood','petTreat','repair','cloth','house','rentHouse','buyTransport','eat','med','study','gym','leisure','giveGift','date','hire','wedding']);
const STAR_ACTIONS519=new Set(['prem','premium','premiumBuy','premBuy','travelBuy75','skinBuy75','buyPremium75']);
function purchaseKind519(b){
 const act=b.dataset.act||'',text=b.textContent;
 if(STAR_ACTIONS519.has(act)&&/⭐|Stars|зв[её]зд/i.test(text))return 'stars';
 if(['money','caps','bottles','stars'].includes(b.dataset.currency))return b.dataset.currency;
 if(act==='bottleBuy'){const it=bottleById(b.dataset.id);return it?.caps?'caps':it?.payBottles?'bottles':'money';}
 if(currencyIsCapButton511(b))return 'caps';
 if(b.querySelector('[data-money-amount511]'))return 'money';
 if(b.dataset.purchase519==='money')return 'money';
 if(!PURCHASE_ACTIONS519.has(act))return '';
 if(/🔑/.test(text)&&['dcOpen','dcAgain'].includes(act))return 'keys';
 if(/крыш|\bcaps?\b|🟡/i.test(text))return 'caps';
 if(/\d[\d\s.,KM]*\s*🍾/.test(text))return 'bottles';
 if(/[₽$€¥]/.test(text)||b.querySelector('[data-ic="coin"]'))return 'money';
 return '';
}
function purchaseName519(kind){return kind==='money'?(typeof I18N!=='undefined'&&I18N.lang==='en'?'Pay in ':'Оплата: ')+moneyUnit511()[0]:kind==='caps'?(typeof I18N!=='undefined'&&I18N.lang==='en'?'Pay with caps':'Оплата крышками'):kind==='bottles'?(typeof I18N!=='undefined'&&I18N.lang==='en'?'Pay with bottles':'Оплата бутылками'):kind==='stars'?'Telegram Stars':(typeof I18N!=='undefined'&&I18N.lang==='en'?'Case key':'Ключ от кейса');}
function purchaseDecor519(root=document){
 if(!root?.querySelectorAll)return;currencyDecor511(root);
 const buttons=[...(root.matches?.('button[data-act]')?[root]:[]),...root.querySelectorAll('button[data-act]')];
 for(const b of buttons){
  const kind=purchaseKind519(b);if(!kind)continue;
  if(b.dataset.purchase519!==kind)b.dataset.purchase519=kind;
  if(['money','caps','bottles','stars'].includes(kind)&&b.dataset.currency!==kind)b.dataset.currency=kind;
  const label=purchaseName519(kind);if(b.title!==label)b.title=label;
  // Price rows remain readable when Telegram/iOS increases the text size.
  if(kind==='caps'&&['eat','energyFix'].includes(b.dataset.act)&&b.dataset.id==='energetik'){
   const price=b.querySelector('.energy77-price');if(price&&!price.dataset.exactCost519){price.dataset.exactCost519='3';price.innerHTML='<span class="purchase-number519">3</span><i class="ic" data-ic="cap">'+CAP_ICON511+'</i><span class="currency-name511" data-currency-name511 data-i18n-ignore>'+currencyCapWord511(3)+'</span>';}
  }
 }
}
const purchasePriceBefore519=priceBtn;priceBtn=function(act,id,price,can,label){
 const t=document.createElement('template');t.innerHTML=purchasePriceBefore519(act,id,price,can,label);const b=t.content.querySelector('button');
 if(b&&Number.isFinite(price)&&price>0&&!purchaseKind519(b))b.dataset.purchase519='money';
 purchaseDecor519(t.content);return t.innerHTML;
};
const purchaseFillBefore519=fillIcons;fillIcons=function(root=document){purchaseFillBefore519(root);purchaseDecor519(root);};
const purchaseApplyBefore519=applyCity;applyCity=function(...args){const result=purchaseApplyBefore519(...args);currencyDecor511();purchaseDecor519();return result;};
HOOKS.hud.push(()=>purchaseDecor519());HOOKS.screen.push(()=>purchaseDecor519());
