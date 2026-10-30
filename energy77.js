// Sleep, retail and optional ad rewards. Purchased skill levels stay intact.
for(const row of CITY_PRICE_BASE_468)if(row.item.id==='coffee'&&row.field==='price')row.value*=2;
cityPrices468();
const canPayBefore77=shopCanPay,payBefore77=shopPay;
shopCanPay=(item,n=1)=>item?.id==='energetik'?Number.isSafeInteger(n)&&n>0&&S.caps>=3*n:canPayBefore77(item,n);
shopPay=(item,n=1)=>{if(item?.id!=='energetik')return payBefore77(item,n);if(!shopCanPay(item,n))return false;S.caps-=3*n;return true;};
const priceBefore77=priceBtn;
priceBtn=function(act,id,price,can,label){if((act==='eat'||act==='energyFix')&&id==='energetik'){const f=FOOD.find(x=>x.id===id),allowed=!!f&&reqOk(f.req)&&shopCanPay(f);return `<button class="btn ${allowed?'primary':''}" data-act="${act}" data-id="energetik" data-currency="caps" ${allowed?'':'disabled'}>${act==='energyFix'?'<span>🥤 Энергетик · +'+f.energy+' ⚡</span>':'🥤'} <span class="energy77-price">3 🟡</span></button>`;}return priceBefore77(act,id,price,can,label);};
const minutesBefore77=trickMinutes;trickMinutes=t=>minutesBefore77(t)*2;
function activateSkill77(id){
  const t=TRICKS.find(t=>t.id===id);if(!t||level()<t.level||cdLeft(id)>0||hasEffect(id)||S.caps<3)return;
  S.caps-=3;addEffect(id,trickMinutes(t));setCd(id,trickCdMin(t)*60);track('trick');save(true);refresh();toast('Навык активирован за 3 крышки','good');sfx('good');haptic('success');
}
ACTIONS.trick=activateSkill77;
function adChoice77(){const d=REWARDED_ADS.data;return REWARDED_ADS.busy||!onlineOn()||!d?.enabled||!d.remaining||!!d.pending||adsNow()<d.nextAt;}
const skillsBefore77=EXTRA_TABS.life.skills;
EXTRA_TABS.life.skills=()=>{
  const t=document.createElement('template');t.innerHTML=skillsBefore77();
  const intro=t.content.querySelector('.info-card');if(intro)intro.innerHTML='<b>Навыки: реклама или крышки</b><p>Активация — полный просмотр рекламы или 3 крышки. Действие всех навыков увеличено вдвое: прежние 20 минут стали 40. Уже купленные уровни и их бонусы сохранены; постоянные улучшения по-прежнему покупаются за деньги.</p><p>Все рекламные награды используют общий лимит: 5 просмотров в сутки и пауза 10 минут. За рекламу навыка крышки отдельно не выдаются.</p>';
  for(const b of t.content.querySelectorAll('[data-act="trick"]')){const id=b.dataset.id,sk=TRICKS.find(t=>t.id===id);b.textContent='Активировать · 3 🟡';b.disabled=S.caps<3;b.classList.toggle('primary',!b.disabled);b.removeAttribute('data-why');b.dataset.currency='caps';const ad=document.createElement('button');ad.className='btn wide';ad.dataset.act='adSkill77';ad.dataset.id=id;ad.textContent='🎬 Активировать за рекламу';ad.disabled=adChoice77()||!sk;b.insertAdjacentElement('afterend',ad);}
  return t.innerHTML;
};
const showBefore77=showScreen;showScreen=function(name,tab){showBefore77(name,tab);if(name==='life'&&(tab||TABS.life)==='skills')adsState().then(()=>{if(currentScreen==='life'&&TABS.life==='skills')renderCurrent(false);});};
ACTIONS.adSkill77=id=>{const t=TRICKS.find(t=>t.id===id);if(!t||level()<t.level||hasEffect(id)||cdLeft(id)>0)return;save(true);rewardedWatch('skill',id);};
ACTIONS.adEnergy77=()=>{if(S.energy>=maxEnergy()){toast('Энергия уже полная.');return;}rewardedWatch('energy');};
energyOffer=function(){
  energyOfferedAt=Date.now();adsState();const coffee=FOOD.find(f=>f.id==='coffee');
  openModal(`<h3>⚡ Восстановить энергию</h3><p>Сон теперь восстанавливает энергию вдвое дольше. Рядом — мгновенное полное восстановление за рекламу, только по желанию.</p><div class="btns energy-actions77"><button class="btn wide" data-act="energyFix" data-id="sleep" ${S.busy?'disabled':''}>💤 Лечь спать</button><button class="btn primary wide" data-act="adEnergy77" ${S.energy>=maxEnergy()||adChoice77()?'disabled':''}>🎬 Полная энергия за рекламу</button>${priceBtn('energyFix','coffee',coffee.price,shopCanPay(coffee),'☕ Кофе · +'+coffee.energy+' ⚡ · '+incomeMoney(coffee.price))}${priceBtn('energyFix','energetik',0,true)}<button class="btn wide" data-act="close">Не сейчас</button></div><small>Реклама — только по желанию. Общий лимит: 5 наград в сутки, пауза 10 минут. За этот просмотр выдаётся энергия, без дополнительных крышек.</small>`,{center:true});
  adsState().then(()=>{const b=document.querySelector('[data-act="adEnergy77"]');if(b)b.disabled=S.energy>=maxEnergy()||adChoice77();});
};
let adBenefitsBusy77=false;
async function adsBenefits77(){
  if(adBenefitsBusy77||!onlineOn()||SAVE_LOCK||!LOADED)return;adBenefitsBusy77=true;
  try{if(!REWARDED_ADS.data)await adsState();const {benefits=[]}=await apiPost('ads/benefits');S.adClaims77||=[];let changed=false;
    for(const r of benefits){if(S.adClaims77.includes(r.id))continue;
      if(r.purpose==='energy'){S.energy=maxEnergy();if(S.busy?.type==='sleep')S.busy=null;if(document.querySelector('[data-act="adEnergy77"]'))closeModal();}
      else if(r.purpose==='skill'&&EFFECTS[r.skill]){if(r.until_at<=adsNow())continue;const prior=S.effects.find(e=>e.id===r.skill)?.until||0,localUntil=Date.now()+r.until_at-adsNow();S.effects=S.effects.filter(e=>e.id!==r.skill);S.effects.push({id:r.skill,until:Math.max(prior,localUntil)});const sk=TRICKS.find(t=>t.id===r.skill);if(sk)S.cd[r.skill]=Math.max(S.cd[r.skill]||0,Date.now()+r.starts+trickCdMin(sk)*60000-adsNow());track('trick');}
      else if(typeof applyAdBenefit78==='function'&&applyAdBenefit78(r)){}
      else continue;
      S.adClaims77.push(r.id);changed=true;
    }
    if(changed){save(true);updateHud();refresh();toast('Награда за просмотр получена','good');}
    if(REWARDED_ADS.data?.pending)await adsState();
  }catch(e){/* Durable receipts stay pending until an accepted profile save. */}finally{adBenefitsBusy77=false;}
}
prestigeProfile=(function(orig){return ()=>({...orig(),adClaims77:S.adClaims77||[]});})(prestigeProfile);
HOOKS.init.push(()=>{$('sleepBtn').onclick=()=>energyOffer();setTimeout(adsBenefits77,4500);});
setInterval(()=>{if(!document.hidden&&!REWARDED_ADS.busy&&REWARDED_ADS.data?.pending)adsBenefits77();},15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)adsBenefits77();});
