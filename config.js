// Настройки, которые нужно вписать перед выкладкой (см. ИНСТРУКЦИЯ.md, часть «Рефералка»).

// Адрес сервера рефералок — твой постоянный адрес из ngrok, без слэша в конце.
// Пример: 'https://bomzh-game.ngrok-free.app'. Пустая строка — рефералка выключена.
// 4.3: свой HTTPS на VPS (Caddy + sslip.io) вместо ngrok — у бесплатного ngrok кончался месячный лимит запросов
const REF_API = 'https://178-236-248-87.sslip.io';

// Both HTTPS names terminate at the same Caddy/API process and SQLite database.
const API_GATEWAYS504=Object.freeze([REF_API,'https://178-236-248-87.nip.io']);
let API_GATEWAY504=new URLSearchParams(location.search).get('gateway')==='backup'?1:0;
function apiGatewayUrl504(url,index=API_GATEWAY504){
 const parsed=new URL(url,location.href);
 if(!API_GATEWAYS504.includes(parsed.origin)||!parsed.pathname.startsWith('/api/'))return null;
 return API_GATEWAYS504[index]+parsed.pathname+parsed.search;
}
async function apiFetch504(url,options={}){
 if(!apiGatewayUrl504(url))return fetch(url,options);
 const order=[API_GATEWAY504,1-API_GATEWAY504];let lastError,lastResponse;
 for(const index of order){
  if(options.signal?.aborted)throw new DOMException('Request aborted','AbortError');
  const control=new AbortController(),abort=()=>control.abort();
  options.signal?.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(abort,4000);
  try{
   const response=await fetch(apiGatewayUrl504(url,index),{...options,signal:control.signal});
   if(response.status>=500){lastResponse=response;API_GATEWAY504=1-index;continue;}
   // Auth failures and rate limits must be returned, never bypassed through another name.
   API_GATEWAY504=index;return response;
  }catch(e){lastError=e;if(options.signal?.aborted)throw e;API_GATEWAY504=1-index;}
  finally{clearTimeout(timer);options.signal?.removeEventListener('abort',abort);}
 }
 if(lastResponse)return lastResponse;
 throw lastError||new Error('Game server connection failed');
}

// Ссылка на твоего бота — её получат друзья в приглашении. Пример: 'https://t.me/bomzh_simulator_bot'
const BOT_LINK = 'https://t.me/bomzhik_simulator_bot';

// Официальное сообщество игроков в Telegram.
const COMMUNITY_LINK = 'https://t.me/+Drb0gHGUjEMwNGUy';
