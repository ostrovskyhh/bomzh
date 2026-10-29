// Telegram opens a prepared editor, not a silently published story. Rewards
// depend on authenticated referral activity, never opening/closing the editor.
const STORY_PROMO={data:null,busy:false,queued:false,variant:0,nextCheck:0,notBefore:Date.now()+12000};
const STORY_COPY=[
  '🍾 Начал с лавки — строю свою империю! Код {code}: +1000 ₽, VIP на 2 дня и +50 крышек на 5-м уровне.',
  '🏙️ Бизнесы, банды и 4 города. Собираем команду! Код {code}: стартовый подарок и +50 крышек на 5-м уровне.',
  '😂 Вчера — лавка, сегодня — свой бизнес. Залетай в «Симулятор бомжа»! Код {code}: +50 крышек на 5-м уровне.',
];
function storyPromoReady(){return !!(STORY_PROMO.data?.active&&STORY_PROMO.data?.token);}
function storyPromoLink(){return storyPromoReady()?`${BOT_LINK}?start=story_${STORY_PROMO.data.token}`:'';}
function storyPromoText(variant=STORY_PROMO.variant){
  if(!storyPromoReady())return '';
  return STORY_COPY[variant%STORY_COPY.length].replace('{code}',STORY_PROMO.data.code.toUpperCase())+' '+storyPromoLink();
}
function storyPromoParams(premium){
  const params={text:storyPromoText()};if(premium)params.widget_link={url:storyPromoLink(),name:'Играть · подарок новичку'};return params;
}
function storyNativeShare(media,params){tg.shareToStory(media,params);}
function storyPromoButtons(){
  for(const b of document.querySelectorAll('[data-act="storyShare"]')){
    b.disabled=!storyPromoReady();if(b.disabled)b.dataset.why='Загружаем личное приглашение. Нужно подключение к серверу игры.';
    else{delete b.dataset.why;b.textContent=canStory()?'📸 Поделиться историей':'🔗 Скопировать приглашение';}
  }
}
async function storyPromoLoad(){
  if(!onlineOn()||SAVE_LOCK||STORY_PROMO.busy)return;STORY_PROMO.busy=true;
  try{const data=await apiPost('story/state');if(data.campaign&&data.token){STORY_PROMO.data=data;if(!REF)REF=data.ref;storyPromoButtons();storyPromoCheck();}}
  catch(e){/* Keep the campaign pending, without claiming any reward. */}
  finally{STORY_PROMO.busy=false;}
}
function storyOfferHTML(){
  const data=STORY_PROMO.data,paid=!!data?.rewarded;
  return `<div class="story-promo"><h3>📣 Позови друзей в игру</h3><b class="story-reward">${paid?'Спасибо за помощь игре!':'+50 крышек за первого новичка'}</b>
    <p class="story-rule">${paid?'Бонус за первого игрока уже подготовлен подарком. Обычные награды за следующие приглашения продолжают действовать.':'Новый игрок должен перейти по твоей ссылке, активировать код друга и начать играть. Один бонус на аккаунт — за открытие редактора награды нет.'}</p>
    <button class="btn primary wide" data-act="storyShare">${canStory()?'📸 Поделиться историей':'🔗 Скопировать приглашение'}</button>
    <small class="story-native-note">${canStory()?'Картинка и текст готовы. Подтверди публикацию в Telegram. Кнопка-ссылка доступна с Premium; без него код и ссылка остаются в подписи.':'Этот клиент не поддерживает редактор историй. Открой игру в актуальном мобильном Telegram или используй готовое приглашение.'}</small>
    <img class="story-poster" src="${storyImage()}" width="144" height="256" alt="Симулятор бомжа: от лавки до своей империи" decoding="async">
    <details><summary>Награды и условия</summary><p>Тебе: 50 крышек за первого нового игрока, начавшего играть по рекламной ссылке, один раз за эту акцию. Закрытая или неопубликованная история сама по себе награды не даёт.</p><p>Новому приглашённому после активации кода: 1000 ₽, опыт ×1.5 на 30 минут и VIP на 2 дня, как раньше. Для новых приглашений этой акции — ещё 50 крышек на 5-м уровне, один раз на аккаунт.</p><p>Обычные награды пригласившему тоже сохраняются: 500 ₽ и 30 крышек за каждого приглашённого, рамки и аватарки за число друзей. Старые аккаунты и самоприглашения не засчитываются как новые игроки.</p><p>Крышки приходят через игровые подарки при входе или в течение минуты. Престиж и повторная публикация не повторяют бонус.</p></details>
    <div class="story-variants">${['Моя империя','Своя команда','С юмором'].map((t,i)=>`<button class="btn ${i===STORY_PROMO.variant?'primary':''}" data-act="storyVariant" data-id="${i}">${t}</button>`).join('')}</div>
    <p class="story-copy">${esc(storyPromoText())}</p><div class="btns"><button class="btn wide" data-act="storyPromoCopy">📋 Скопировать текст и ссылку</button><button class="btn wide" data-act="close">Позже</button></div></div>`;
}
function openStoryOffer(){
  if(!storyPromoReady()){storyPromoLoad();toast('Подключаемся к серверу и готовим твоё приглашение. Попробуй через несколько секунд.');return;}
  openModal(storyOfferHTML(),{center:true});storyPromoButtons();
  S.storyPromoSeen=STORY_PROMO.data.campaign;STORY_PROMO.data.seen=true;save();
  if(onlineOn())apiPost('story/seen').catch(()=>{});
}
function storyPromoCheck(){
  if(!LOADED||SAVE_LOCK||document.hidden||Date.now()<STORY_PROMO.notBefore||!S.storySeen||!storyPromoReady()||STORY_PROMO.queued||STORY_PROMO.data.seen||S.storyPromoSeen===STORY_PROMO.data.campaign||currentScreen!=='game')return;
  STORY_PROMO.queued=true;queuePopup('story-promo-446',5,()=>{STORY_PROMO.queued=false;if(currentScreen==='game'&&!STORY_PROMO.data.seen&&S.storyPromoSeen!==STORY_PROMO.data.campaign)openStoryOffer();});
}
async function storyPromoCopy(){
  if(!storyPromoReady())return;
  try{await navigator.clipboard.writeText(storyPromoText());toast('Рекламный текст и личная ссылка скопированы','good');}catch(e){toast('Не удалось скопировать. Текст и ссылка доступны в окне приглашения.','bad');}
}
function storyPromoShare(){
  if(!storyPromoReady()){storyPromoLoad();toast('Личное приглашение ещё загружается. Попробуй через несколько секунд.');return;}
  if(!canStory()){storyPromoCopy();return;}
  try{storyNativeShare(storyImage(),storyPromoParams(!!tg?.initDataUnsafe?.user?.is_premium));track('storyShare');if(typeof BugReport!=='undefined')BugReport.record('story-editor-opened',{campaign:STORY_PROMO.data.campaign,variant:STORY_PROMO.variant});}
  catch(e){toast('Telegram не смог открыть редактор истории. Попробуй ещё раз или скопируй приглашение.','bad');}
}
Object.assign(ACTIONS,{storyShare:storyPromoShare,storyPromo:openStoryOffer,storyPromoCopy,storyVariant:id=>{STORY_PROMO.variant=Math.max(0,Math.min(2,Number(id)||0));openModal(storyOfferHTML(),{center:true});storyPromoButtons();}});
const storyPromoRefBox=refBoxHTML;
refBoxHTML=()=>storyPromoRefBox()+`<button class="btn wide" data-act="storyPromo">📣 История: условия и рекламные тексты</button>${STORY_PROMO.data?.level5?.eligible?`<small>🎁 Твой бонус за приглашение: ${STORY_PROMO.data.level5.rewarded?'50 крышек за 5-й уровень уже подготовлены подарком':'достигни 5-го уровня и получи 50 крышек автоматически'}.</small>`:''}`;
const storyPromoFriends=EXTRA_TABS.fun.friends;
EXTRA_TABS.fun.friends=()=>`<div class="info-card"><b>📣 Позови друзей — получи 50 крышек</b><p>Готовая история с твоей ссылкой. Бонус — за первого нового игрока, который начнёт играть по ней.</p><button class="btn primary" data-act="storyPromo">История и условия</button></div>`+storyPromoFriends();
HOOKS.init.push(()=>{setTimeout(storyPromoLoad,5500);setInterval(()=>{if(!document.hidden)storyPromoLoad();},60000);});
HOOKS.tick.push(()=>{if(Date.now()<STORY_PROMO.nextCheck)return;STORY_PROMO.nextCheck=Date.now()+3000;storyPromoCheck();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)storyPromoLoad();});
prestigeProfile=(function(orig){return function(){return {...orig(),storyPromoSeen:S.storyPromoSeen};};})(prestigeProfile);
