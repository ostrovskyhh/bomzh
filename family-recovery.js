// Targeted server offer: no calendar-based eligibility or account list in the client.
let FAMILY_REC_PENDING=0;
apiPost=(function(orig){return async function(route,...args){if(route.startsWith('family/'))return orig(route,...args);FAMILY_REC_PENDING++;try{return await orig(route,...args);}finally{setTimeout(()=>FAMILY_REC_PENDING--,0);}};})(apiPost);
let FAMILY_REC={offer:null,step:1,choice:null,ready:0,busy:false,allowClose:false,next:0};
function familyRecoveryHTML(){
  const r=FAMILY_REC,o=r.offer;if(!o)return '';
  return `<section id="familyRecovery"><div class="dc-heart">💌</div><h3>Второй шанс для семьи</h3><p>Сегодняшний развод подтверждён по истории профиля. Прежняя жена: <b>${esc(o.name)}</b>.</p>${o.money||o.caps?`<p>Компенсация: <b>${fmt(o.money)} ₽ и ${fmt(o.caps)} крышек</b>. Получишь один раз при любом окончательном ответе. Это фиксированная компенсация, а не расчёт прежних расходов.</p>`:'<p>При переезде отдельной платы за развод не было. Денежная компенсация не назначена.</p>'}
    ${r.step===1?`<p>${o.canRestore?'Хочешь вернуть прежнюю жену? Свадьба заново не нужна. Новые награды за свадьбу не выдаются.':'Семейное положение уже изменилось. Новую семью не заменяем; доступную компенсацию можно получить.'}</p><div class="btns">${o.canRestore?'<button class="btn primary wide" data-act="familyRecoveryYes">Да, хочу вернуть жену</button>':''}<button class="btn wide" data-act="familyRecoveryNo">${o.canRestore?'Нет, оставить всё как есть':'Сохранить нынешнюю семью'}</button></div>`:`<p><b>${r.choice?'Вернуть прежнюю жену?':'Подтвердить отказ от восстановления брака?'}</b></p><p>${r.choice?'Брак восстановится, отношения и доверие будут не ниже 70. Текущий прогресс сохранится.':'Прежняя жена не вернётся. Доступная компенсация сохранится при этом выборе.'}</p><button id="familyRecoveryFinal" class="btn primary wide" data-act="familyRecoveryFinal" disabled>Подожди 3 секунды</button><button class="btn wide" data-act="familyRecoveryBack">Вернуться к выбору</button>`}<p id="familyRecoveryError" aria-live="polite"></p><small>Нажатие вне окна не закрывает предложение. Оба ответа нужно подтвердить ещё раз.</small></section>`;
}
function familyRecoveryOpen(){if(!FAMILY_REC.offer||document.hidden)return;openModal(familyRecoveryHTML(),{center:true,locked:true});}
function familyRecoveryChoose(yes){if(FAMILY_REC.busy||FAMILY_REC.step!==1||!$('familyRecovery')||yes&&!FAMILY_REC.offer?.canRestore)return;FAMILY_REC.choice=yes;FAMILY_REC.step=2;FAMILY_REC.ready=Date.now()+3000;familyRecoveryOpen();}
ACTIONS.familyRecoveryYes=()=>familyRecoveryChoose(true);ACTIONS.familyRecoveryNo=()=>familyRecoveryChoose(false);
ACTIONS.familyRecoveryBack=()=>{if(!FAMILY_REC.busy){FAMILY_REC.step=1;FAMILY_REC.choice=null;familyRecoveryOpen();}};
ACTIONS.familyRecoveryFinal=async()=>{
  const r=FAMILY_REC;if(r.busy||r.step!==2||Date.now()<r.ready||!$('familyRecoveryFinal')||document.hidden||!r.offer)return;
  r.busy=true;let locked=false;const b=$('familyRecoveryFinal');b.disabled=true;
  try{
    if(!onlineOn()||!serverReady||SAVE_LOCK)throw Error('Нужно подключение к серверу игры. Попробуй ещё раз.');
    for(let i=0;i<20&&FAMILY_REC_PENDING;i++)await wait(100);
    if(FAMILY_REC_PENDING)throw Error('Дождись завершения текущих операций и повтори.');
    save();for(let i=0;i<5;i++){await serverWrite();if(!srvBusy&&serverBase>=(S.rev||0))break;await wait(300);}
    if(srvBusy||serverBase<(S.rev||0)||SAVE_LOCK)throw Error('Не удалось сохранить прогресс. Попробуй ещё раз через несколько секунд.');
    SAVE_LOCK=true;locked=true;
    const result=await apiPost('family/recover',{base:serverBase,device:DEVICE_ID,restore:r.choice});
    if(!result.ok)throw Error(result.error||'Предложение обновилось. Открой игру заново.');
    const state=JSON.parse(result.data);S=state;serverBase=result.rev;REV_FLOOR=Math.max(REV_FLOOR,result.rev);SAVE_LOCK=false;locked=false;
    r.offer=null;r.allowClose=true;closeModal();r.allowClose=false;applyCity();save(true);renderScene();refresh();
    resultModal({emoji:'💌',title:'Решение сохранено',text:result.already?'Твой ответ уже сохранён. Повторной выдачи нет.':`${result.restore?'Прежняя жена вернулась.':'Брак не восстанавливали.'} ${result.money||result.caps?`Компенсация зачислена: ${fmt(result.money)} ₽ и ${fmt(result.caps)} крышек.`:''}`,btn:'Продолжить игру'});
  }catch(e){const el=$('familyRecoveryError');if(el)el.textContent=e.message;}
  finally{if(locked)SAVE_LOCK=false;r.busy=false;}
};
async function familyRecoveryLoad(){if(document.hidden||!LOADED||!onlineOn()||SAVE_LOCK||FAMILY_REC.busy)return;try{const r=await apiPost('family/recovery');FAMILY_REC.offer=r.offer||null;if(FAMILY_REC.offer&&!$('familyRecovery')){FAMILY_REC.step=1;FAMILY_REC.choice=null;queuePopup('family-recovery',0,familyRecoveryOpen);}}catch(e){/* Durable offer; retry on next visible poll. */}}
closeModal=(function(orig){return function(){if($('familyRecovery')&&!FAMILY_REC.allowClose)return;return orig();};})(closeModal);
openModal=(function(orig){return function(html,opts){if($('familyRecovery')&&!FAMILY_REC.allowClose&&!html.includes('id="familyRecovery"')){MODAL_QUEUE.push({html,opts});return document.createElement('div');}return orig(html,opts);};})(openModal);
tick=(function(orig){return function(){if(FAMILY_REC.busy){lastTick=Date.now();return;}orig();};})(tick);
for(const key of ['giftClaim','frClaim','payClaim']){if(key==='giftClaim')giftClaim=(function(orig){return function(...args){if(!FAMILY_REC.busy)return orig(...args);};})(giftClaim);if(key==='frClaim')frClaim=(function(orig){return function(...args){if(!FAMILY_REC.busy)return orig(...args);};})(frClaim);if(key==='payClaim')payClaim=(function(orig){return function(...args){if(!FAMILY_REC.busy)return orig(...args);};})(payClaim);}
HOOKS.init.push(()=>{setTimeout(familyRecoveryLoad,4500);setInterval(()=>{if(!FAMILY_REC.offer)familyRecoveryLoad();},60000);});
HOOKS.hud.push(()=>{const b=$('familyRecoveryFinal');if(!b)return;const left=Math.max(0,Math.ceil((FAMILY_REC.ready-Date.now())/1000));b.disabled=FAMILY_REC.busy||left>0;b.textContent=left?`Подожди ${left} сек.`:'Подтверждаю решение';});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(familyRecoveryLoad,1500);});
prestigeProfile=(function(orig){return ()=>({...orig(),divorceRecoveryClaims:S.divorceRecoveryClaims||[]});})(prestigeProfile);
