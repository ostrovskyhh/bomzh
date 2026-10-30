// Six explicit deliveries: a selected route remains stable until Send is pressed.
function mailMetro468(mg){
 const stops=['Монмартр','Латинский квартал','Бастилия','Набережная Сены'];let index=0,selected=null,closed=0,target=0;
 const a=$('mgArena');a.classList.add('content466-arena','mail468-arena');
 function draw(){target=index%stops.length;closed=(target+1+index%2)%stops.length;selected=null;mg.mail={index,target,closed};
 a.innerHTML=`<section class="mail468"><small>Доставка ${index+1} / 6</small><h3>✉️ Письмо через бастующее метро</h3><p>Адрес на конверте:</p><b class="mail468-address">${stops[target]}</b><p>Выбери открытый маршрут к этому адресу, затем отправь письмо.</p><div class="mail468-routes">${stops.map((s,i)=>`<button data-mail-route="${i}" ${i===closed?'disabled':''} aria-pressed="false">${i===closed?'⛔':'🚇'} ${s}<small>${i===closed?'Линия закрыта':'Маршрут открыт'}</small></button>`).join('')}</div><p id="mail468Hint"></p><button class="btn primary wide" id="mail468Send" disabled>Отправить письмо</button></section>`;
 a.querySelectorAll('[data-mail-route]').forEach(b=>b.onclick=()=>{if(!mgAlive(mg))return;selected=+b.dataset.mailRoute;a.querySelectorAll('[data-mail-route]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('mail468Send').disabled=false;});
 const round=index;$('mail468Send').onclick=()=>{if(!mgAlive(mg)||round!==index||selected===null||selected===closed)return;if(selected!==target){$('mail468Hint').textContent='Проверь адрес на конверте. Выбран другой квартал.';return;}mgScore(1);index++;if(index===6){mg.mailDelivered=true;mgEnd();}else draw();};}
 draw();
}
Object.assign(FR_TOWN.metro,{engine:mailMetro468,target:6,duration:0,hint:'Доставь шесть писем. Выбери открытый маршрут к адресу на конверте и нажми «Отправить письмо». Таймера нет.'});
// The seasonal lantern game becomes a small workshop, not a cross-toggle puzzle.
halloweenEngineLantern=function(mg){
 const a=$('mgArena');a.classList.add('content466-arena');let round=0,step=0;const recipe=['🎃','🕯️'];mg.hw={type:'lantern',recipe:true,target:recipe[0]};
 function draw(){mg.hw.target=recipe[step];a.innerHTML=`<section class="hw-game"><small>Фонарь ${round+1} / 3</small><h3>Мастерская фонарей</h3><p>Сначала выбери тыкву, затем поставь свечу. Так собери три фонаря.</p><strong class="lantern468-target">${recipe[step]}</strong><p>${step===0?'Выбери тыкву':'Добавь свечу'}</p><div class="hw-doors">${shuffle(['🎃','🕯️','🍬','🧵']).map(x=>`<button data-lantern-piece="${x}">${x}</button>`).join('')}</div><p id="lantern468Hint"></p></section>`;
 a.querySelectorAll('[data-lantern-piece]').forEach(b=>b.onclick=()=>{if(!mgAlive(mg))return;if(b.dataset.lanternPiece!==recipe[step]){$('lantern468Hint').textContent='Выбери предмет, который показан над кнопками.';return;}step++;if(step===2){step=0;round++;mgScore(1);}if(round===3){mg.hwSolved=true;mgEnd();}else draw();});}draw();
};

const donateRowsBefore468=donateHTML;donateHTML=function(){const html=donateRowsBefore468();const t=document.createElement('template');t.innerHTML=html;const tabs=t.content.querySelector('.dn-tabs');if(tabs)tabs.style.setProperty('--dn-cols',Math.ceil(DN_TABS.length/2));return t.innerHTML;};
