// Exact and percentage exchanges share one validated transaction and reward path.
const EXCHANGE509={draft:''};
const exchangeCount509=n=>Number(n).toLocaleString('ru-RU',{maximumFractionDigits:0});
function exchangeQuote509(raw){
 const text=typeof raw==='string'?raw.replace(/\s/g,''):raw;
 const count=typeof text==='number'?text:typeof text==='string'&&/^\d+$/.test(text)?Number(text):NaN;
 if(!Number.isSafeInteger(count))return {ok:false,error:'Введи целое количество бутылок.'};
 if(count<10)return {ok:false,error:'Минимум для обмена — 10 бутылок.'};
 if(!Number.isFinite(S.bottles)||count>S.bottles)return {ok:false,error:'Недостаточно бутылок для такого обмена.'};
 const rate=bottleRate(),money=Math.floor(count*rate*(1-EXCHANGE_FEE));
 if(!Number.isFinite(rate)||rate<0||!Number.isSafeInteger(money)||money<0)return {ok:false,error:'Курс временно недоступен. Попробуй ещё раз.'};
 return {ok:true,count,money,remaining:S.bottles-count};
}
function exchangePreview509(){
 const input=$('exchangeAmount509'),button=$('exchangeSubmit509');if(!input||!button)return;
 EXCHANGE509.draft=input.value;const q=exchangeQuote509(input.value);
 const put=(id,value)=>{const el=$(id);if(el&&el.textContent!==value)el.textContent=value;};
 put('exchangeAvailable509',exchangeCount509(Math.floor(S.bottles)));
 put('exchangePayout509',q.ok?cityMoney(q.money):'—');
 put('exchangeRemaining509',q.ok?exchangeCount509(q.remaining):'—');
 put('exchangeError509',input.value.trim()&&!q.ok?q.error:'');
 button.disabled=!q.ok;
 for(const b of document.querySelectorAll('[data-act="exchangePreset509"]'))b.disabled=Number(b.dataset.id)>S.bottles;
}
function exchangeTrade509(count,button){
 if(button&&!button.isConnected)return false;
 const q=exchangeQuote509(count);if(!q.ok)return false;
 S.bottles-=q.count;S.stats.sold+=q.count;taskProgress('sold',q.count);
 addMoney(q.money);addXp(q.count*XP.bottles);
 flyCoins(button||document.querySelector('[data-act="exchange"]'),$('resMoney'),Math.min(12,3+Math.floor(Math.log10(q.money+1)*2)));
 toast(`Обменял ${exchangeCount509(q.count)} бут. → +${fmt(q.money)} ₽`,'good');haptic('success');
 EXCHANGE509.draft='';if($('exchangeAmount509'))$('exchangeAmount509').value='';
 renderExchange();saveSoon();return true;
}
const exchangeRenderBefore509=renderExchange;
renderExchange=function(){
 exchangeRenderBefore509();const body=$('exBody');if(!body)return;
 // A sibling survives the base renderer's minute-by-minute innerHTML updates.
 if(!$('exchangePanel509')){
  body.insertAdjacentHTML('beforebegin',`<section class="exchange509" id="exchangePanel509"><h4>Продать точное количество</h4><p class="exchange509-stock">Бутылок в наличии: <b id="exchangeAvailable509"></b></p><div class="exchange509-presets">${[10,20,100,1000].map(n=>`<button class="btn" data-act="exchangePreset509" data-id="${n}">${fmt(n)}</button>`).join('')}</div><label for="exchangeAmount509">Своё количество</label><div class="exchange509-entry"><input id="exchangeAmount509" type="text" inputmode="numeric" autocomplete="off" maxlength="20" placeholder="Например, 20"><button class="btn primary" id="exchangeSubmit509" data-act="exchangeExact509" disabled>Обменять</button></div><div class="exchange509-preview"><div><span>Получишь после комиссии</span><b id="exchangePayout509">—</b></div><div><span>Останется бутылок</span><b id="exchangeRemaining509">—</b></div></div><p id="exchangeError509" role="status" aria-live="polite"></p><small>Минимум 10 бутылок · комиссия 5%. Кнопки выбирают количество; продажа — по кнопке «Обменять».</small></section>`);
  const input=$('exchangeAmount509');input.value=EXCHANGE509.draft;input.addEventListener('input',exchangePreview509);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('exchangeSubmit509').click();}});
 }
 exchangePreview509();
};
HOOKS.hud.push(exchangePreview509);
ACTIONS.exchangePreset509=id=>{if(!$('exchangeAmount509'))return;const n=Number(id);if(![10,20,100,1000].includes(n)||n>S.bottles)return;$('exchangeAmount509').value=String(n);exchangePreview509();};
ACTIONS.exchangeExact509=(_,button)=>{const input=$('exchangeAmount509');if(!input)return false;const q=exchangeQuote509(input.value);if(!q.ok){exchangePreview509();return false;}return exchangeTrade509(q.count,button||$('exchangeSubmit509'));};
