// Task-count games: no language trivia, expiring targets or mandatory waiting.
const WORLD_GAME_NAMES50={recipe:'Кухня площади',sort:'Заказы соседей',route:'Маршрут по кварталу',mosaic:'Мозаика мастерской',tea:'Чайный стол',circuit:'Фонари над каналом',logic:'Проверка квитанций'};
const WORLD_GAME_HINTS50={recipe:'Собери показанный рецепт слева направо. Все ингредиенты видны.',sort:'Сверь значок на посылке и выбери соответствующий лоток.',route:'Иди по соседним клеткам к флажку. Закрытые клетки обходи.',mosaic:'Нажимай на плитки, чтобы повернуть стрелки как в образце.',tea:'Настрой температуру и число чашек как в заказе, затем завари чай.',circuit:'Включи узлы как на образце, затем проверь цепь.',logic:'Количество × цена должны совпасть с итогом. Нужен и настоящий штамп.'};
function worldInt50(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function worldRound50(w){
 w.message='';w.partial=0;
 if(w.kind==='recipe'){w.items=['🍅','🧀','🌿','🍄','🫒'];w.order=Array.from({length:3},()=>worldInt50(0,4));}
 if(w.kind==='sort'){w.items=w.city==='it'?['🍕','🏺','✉️']:['🥟','🍵','🔧'];w.correct=worldInt50(0,2);}
 if(w.kind==='route'){w.position=0;w.blocks=w.round%2?[1,5]:[5,6];}
 if(w.kind==='mosaic'){w.target=Array.from({length:9},(_,i)=>(i+w.round)%4);w.tiles=w.target.map(n=>(n+1+worldInt50(0,2))%4);}
 if(w.kind==='tea'){w.targetTemp=70+worldInt50(0,3)*10;w.targetCups=worldInt50(1,3);w.temp=60;w.cups=1;}
 if(w.kind==='circuit'){w.target=Array.from({length:4},(_,i)=>(i+w.round)%2);w.bits=[0,0,0,0];}
 if(w.kind==='logic'){w.qty=worldInt50(1,4);w.price=worldInt50(2,6);w.valid=worldInt50(0,1)===1;w.stamp=w.valid||worldInt50(0,1)===1;w.total=w.qty*w.price+(w.valid?0:w.stamp?1:0);}
}
function worldGameDraw50(mg){
 if(!mgAlive(mg))return;const w=mg.world50,d=WORLD50[w.city],b=(key,text,cls='')=>`<button class="btn ${cls}" data-w-input="${key}">${text}</button>`;let body='';
 if(w.kind==='recipe')body=`<div class="w50-order">${w.order.map((n,i)=>`<span class="${i<w.partial?'done':i===w.partial?'next':''}">${w.items[n]}</span>`).join('')}</div><div class="w50-inputs">${w.items.map((x,i)=>b(i,x)).join('')}</div>`;
 if(w.kind==='sort')body=`<div class="w50-parcel">📦 <strong>${w.items[w.correct]}</strong><small>На посылке указан этот значок</small></div><div class="w50-inputs">${shuffle([0,1,2]).map(i=>b(i,w.items[i])).join('')}</div>`;
 if(w.kind==='route')body=`<div class="w50-route">${Array.from({length:12},(_,i)=>`<button data-w-input="${i}" class="${w.blocks.includes(i)?'blocked':w.position===i?'here':''}" ${w.blocks.includes(i)?'disabled':''} aria-label="Клетка ${i+1}">${w.blocks.includes(i)?'🚧':i===w.position?'🚶':i===11?'🏁':i===0?'🏠':i+1}</button>`).join('')}</div><p>Только соседняя клетка: вверх, вниз, влево или вправо.</p>`;
 if(w.kind==='mosaic'){const arrows=['▲','▶','▼','◀'];body=`<div class="w50-mosaics"><div><small>ОБРАЗЕЦ</small><div class="w50-mosaic sample">${w.target.map((n,i)=>`<i style="--tile:${['#cc6747','#e5bb65','#4d9291'][i%3]}">${arrows[n]}</i>`).join('')}</div></div><div><small>ТВОЯ МОЗАИКА</small><div class="w50-mosaic">${w.tiles.map((n,i)=>`<button data-w-input="${i}" style="--tile:${['#cc6747','#e5bb65','#4d9291'][i%3]}">${arrows[n]}</button>`).join('')}</div></div></div>`;}
 if(w.kind==='tea')body=`<div class="w50-tea">🍵 <b>Заказ: ${w.targetTemp}° · ${w.targetCups} ☕</b><div><span>${w.temp}°</span>${b('cool','−10°')}${b('heat','+10°')}</div><div><span>${w.cups} ☕</span>${b('less','−1')}${b('more','+1')}</div>${b('brew','Заварить чай','primary wide')}</div>`;
 if(w.kind==='circuit')body=`<div class="w50-circuit"><small>ОБРАЗЕЦ</small><div>${w.target.map(n=>`<i class="${n?'lit':''}">${n?'●':'○'}</i>`).join('')}</div><small>ВКЛЮЧИ ТАКИЕ ЖЕ УЗЛЫ</small><div>${w.bits.map((n,i)=>`<button class="${n?'lit':''}" data-w-input="${i}">${n?'●':'○'}</button>`).join('')}</div>${b('check','Проверить цепь','primary wide')}</div>`;
 if(w.kind==='logic')body=`<div class="w50-paper"><small>КВИТАНЦИЯ МАСТЕРСКОЙ</small><h3>${w.qty} × ${w.price} = ${w.total}</h3><p>${w.stamp?'✓ Штамп мастера на месте':'✕ Штампа мастера нет'}</p></div><div class="w50-inputs">${b('accept','Принять','green')}${b('return','Вернуть')}</div>`;
 const arena=$('mgArena');arena.className='mg-arena w50-arena '+w.city;arena.innerHTML=`<section class="w50-game"><header><small>${d.flag} ${esc(w.title||WORLD_GAME_NAMES50[w.kind])}</small><b>Задачи: ${mg.score}/${w.need}</b></header><p>${WORLD_GAME_HINTS50[w.kind]}</p>${body}<p class="w50-feedback" aria-live="polite">${w.message||'Без таймера — действуй в своём темпе'}</p><small>Ошибки: ${mg.mistakes||0}/5</small><button class="btn small" data-act="worldGameCancel50">Выйти без награды</button></section>`;
 arena.onclick=e=>{const el=e.target.closest('[data-w-input]');if(el&&!el.disabled)worldGameInput50(mg,el.dataset.wInput);};if(typeof I18N!=='undefined')I18N.apply(arena);
}
function worldGameInput50(mg,key){
 if(!mgAlive(mg)||!mg.world50)return;const w=mg.world50,n=Number(key);let good=false,wrong=false;
 if(w.kind==='recipe'){if(n===w.order[w.partial]){w.partial++;good=w.partial===w.order.length;}else wrong=true;}
 if(w.kind==='sort'){good=n===w.correct;wrong=!good;}
 if(w.kind==='route'){const a=w.position;if(Number.isInteger(n)&&n>=0&&n<12&&!w.blocks.includes(n)&&Math.abs(n%4-a%4)+Math.abs(Math.floor(n/4)-Math.floor(a/4))===1){w.position=n;good=n===11;}else wrong=true;}
 if(w.kind==='mosaic'){if(Number.isInteger(n)&&n>=0&&n<9){w.tiles[n]=(w.tiles[n]+1)%4;good=w.tiles.every((a,i)=>a===w.target[i]);}}
 if(w.kind==='tea'){if(key==='heat')w.temp=Math.min(100,w.temp+10);else if(key==='cool')w.temp=Math.max(60,w.temp-10);else if(key==='more')w.cups=Math.min(4,w.cups+1);else if(key==='less')w.cups=Math.max(1,w.cups-1);else if(key==='brew'){good=w.temp===w.targetTemp&&w.cups===w.targetCups;wrong=!good;}}
 if(w.kind==='circuit'){if(key==='check'){good=w.bits.every((v,i)=>v===w.target[i]);wrong=!good;}else if(Number.isInteger(n)&&n>=0&&n<4)w.bits[n]=1-w.bits[n];}
 if(w.kind==='logic'){good=(key==='accept')===!!(w.stamp&&w.total===w.qty*w.price);wrong=!good;}
 if(wrong){mg.mistakes=(mg.mistakes||0)+1;w.message='Не совпало. Проверь образец и попробуй снова.';sfx('error');if(mg.mistakes>=5){mg.score=0;mgEnd();return;}}
 if(good){mgScore(1);w.round++;if(mg.score>=w.need){mgEnd();return;}worldRound50(w);}
 worldGameDraw50(mg);
}
function worldGameSetup50(mg,cfg={}){const home=cfg.city||city();mg.world50={city:home,kind:cfg.kind||'sort',need:Math.max(1,cfg.need||4),title:cfg.title||'',round:0};worldRound50(mg.world50);const bar=$('mgTime')?.parentElement;if(bar)bar.style.display='none';worldGameDraw50(mg);}
ACTIONS.worldGameCancel50=()=>{if(MG?.world50){MG.score=0;mgEnd();}};
