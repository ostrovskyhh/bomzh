// This small page works independently of the game's saved profile and scripts.
const CHECK_TG503=window.Telegram?.WebApp;
const CHECK_EN503=!/^(ru|uk)(-|$)/i.test(CHECK_TG503?.initDataUnsafe?.user?.language_code||navigator.language);
const CHECK_TEXT503={
 'Проверка подключения':'Connection check','Проверим связь с сервером игры и вход через Telegram. Прогресс не сбрасывается.':'Check the game server connection and Telegram login. Progress is not reset.',
 'Связь с сервером':'Server connection','Вход в профиль':'Profile login','Резервный вход':'Backup login','Проверяем…':'Checking…','Передать результат боту':'Send result to the bot','Проверить ещё раз':'Check again','Открыть игру заново':'Reopen the game',
 'Передаются только коды результата проверки. Пароли, ключи и данные входа в отчёт не попадают.':'Only result codes are sent. Passwords, keys and login data are excluded.',
 'Работает':'Working','Нет связи':'Connection failed','Истекло ожидание':'Timed out','Открой через бота':'Open through the bot','Вход отклонён':'Login rejected','Ошибка сервера':'Server error','Ответ не распознан':'Unrecognized response',
 'Результат готов. Нажми «Передать результат боту» и отправь сообщение в Telegram.':'Ready. Tap Send result to the bot and submit the message in Telegram.'};
function checkText503(text){return CHECK_EN503?CHECK_TEXT503[text]||text:text;}
for(const el of document.querySelectorAll('h1,p,span,strong,button,small'))if(CHECK_TEXT503[el.textContent])el.textContent=checkText503(el.textContent);
document.documentElement.lang=CHECK_EN503?'en':'ru';document.title=checkText503('Проверка подключения');
try{CHECK_TG503?.ready();CHECK_TG503?.expand();}catch(_){}
let connectionResult503=null,connectionBusy503=false;
async function connectionProbe503(auth,base=REF_API){
 if(auth&&!CHECK_TG503?.initData)return 'noinit';
 const control=new AbortController(),timer=setTimeout(()=>control.abort(),6000);
 try{
  const response=await fetch(base+(auth?'/api/save/get':'/api/health'),auth?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({initData:CHECK_TG503.initData}),signal:control.signal}:{cache:'no-store',signal:control.signal});
  if(!auth&&response.ok){const body=await response.json();if(body.ok!==true||!Number.isFinite(body.now))return 'bad';}
  return String(response.status);
 }catch(e){return e.name==='AbortError'?'timeout':'net';}finally{clearTimeout(timer);}
}
function connectionLabel503(code){return checkText503(code==='200'?'Работает':code==='401'||code==='403'?'Вход отклонён':code==='noinit'?'Открой через бота':code==='timeout'?'Истекло ожидание':code==='net'?'Нет связи':code==='bad'?'Ответ не распознан':'Ошибка сервера');}
async function runConnectionCheck503(){
 if(connectionBusy503)return;connectionBusy503=true;connectionResult503=null;document.getElementById('send').disabled=true;document.getElementById('retry').disabled=true;
 for(const id of ['health','auth','backup']){const el=document.getElementById(id);el.textContent=checkText503('Проверяем…');el.className='';}
 const [health,auth,backup]=await Promise.all([connectionProbe503(false),connectionProbe503(true),connectionProbe503(true,API_GATEWAYS504[1])]);
 connectionResult503={health,auth,backup,telegramDataPresent:!!CHECK_TG503?.initData};
 for(const [id,code] of [['health',health],['auth',auth],['backup',backup]]){const el=document.getElementById(id);el.textContent=connectionLabel503(code);el.className=code==='200'?'ok':'bad';}
 document.getElementById('send').disabled=false;document.getElementById('retry').disabled=false;document.getElementById('hint').textContent=checkText503('Результат готов. Нажми «Передать результат боту» и отправь сообщение в Telegram.');connectionBusy503=false;
}
document.getElementById('send').onclick=()=>{if(!connectionResult503)return;const r=connectionResult503,url=BOT_LINK+'?start=d504_'+r.health+'_'+r.auth+'_'+r.backup+'_'+(r.telegramDataPresent?'1':'0');if(CHECK_TG503?.openTelegramLink)CHECK_TG503.openTelegramLink(url);else location.href=url;};
document.getElementById('retry').onclick=runConnectionCheck503;
function connectionGameUrl503(){const url=new URL('./',document.baseURI);url.searchParams.set('support',String(Date.now()));if(connectionResult503?.backup==='200'&&connectionResult503?.auth!=='200')url.searchParams.set('gateway','backup');url.hash=location.hash;return url.href;}
document.getElementById('play').onclick=()=>location.replace(connectionGameUrl503());
runConnectionCheck503();
