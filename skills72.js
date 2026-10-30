Object.assign(EFFECTS,{
  t_professional:{name:'Профессионал',emoji:'🛠️',kind:'good',mods:{},desc:'Доход от обычных работ выше'},
  t_appraiser:{name:'Оценщик добычи',emoji:'⚖️',kind:'good',mods:{},desc:'Больше товаров за успешное криминальное дело'},
  t_recovery:{name:'Восстановление',emoji:'💚',kind:'good',mods:{},desc:'Здоровье восстанавливается каждую минуту'}
});
TRICKS.push({id:'t_professional',price:400,minutes:10,level:5},{id:'t_appraiser',price:600,minutes:10,level:10},{id:'t_recovery',price:250,minutes:10,level:4});
TRICKS.sort((a,b)=>a.level-b.level);
const SKILL_INFO72={
  t_eye:['Бутылки','Для активных тапов',n=>`Бутылки за тап: +${n} к базе и +${10+5*(n-1)}%`],
  t_pity:['Доход','Для милостыни в уличной одежде',n=>`Милостыня +${50+10*(n-1)}%`],
  t_breath:['Развитие','Для восстановления энергии между делами',n=>`Восстановление энергии +${50+10*(n-1)}%`],
  t_trader:['Бутылки','Для продажи бутылок; не меняет криминальные котировки',n=>`Курс продажи бутылок +${10+2.5*(n-1)}%`],
  t_focus:['Развитие','Для более коротких занятий',n=>`Время занятия −${25+3*(n-1)}%`],
  t_luck:['Бутылки','Для критических тапов с множителем ×5',n=>`Шанс критического тапа +${5+n-1} процентных пунктов`],
  t_hands:['Развитие','Для частого поиска в мусорках',n=>`Перерыв между мусорками −${30+4*(n-1)}%`],
  t_soul:['Отношения и здоровье','Для радости и восстановления настроения',n=>`Радость от отдыха ×1,5 и +${1+.5*(n-1)} радости/мин`],
  t_stomach:['Отношения и здоровье','Для питания без штрафов за переедание и фастфуд',()=> 'Защита от переедания и последствий фастфуда'],
  t_charm:['Отношения и здоровье','Для успешных свиданий',n=>`Шанс успеха свидания +${10+2.5*(n-1)} процентных пунктов, максимум 97%`],
  t_haggle:['Доход','Для продажи вещей Шнырю',n=>`Цена вещей на барахолке +${15+5*(n-1)}%`],
  t_fist:['Развитие','Для обычных драк',n=>`Сила в бою +${15+5*(n-1)}% и +${5+n-1}`],
  t_diplomat:['Отношения и здоровье','Для уменьшения потери доверия',n=>`Потери доверия −${50+5*(n-1)}%`],
  t_professional:['Доход','Для обычных рабочих смен',n=>`Доход от работы +${15+5*(n-1)}%`],
  t_appraiser:['Доход','Для количества криминальной добычи, не для её курса',n=>`Количество добычи +${10+2.5*(n-1)}%`],
  t_recovery:['Отношения и здоровье','Для восстановления здоровья без госпиталя',n=>`Здоровье +${1+.5*(n-1)}/мин`]
};
function skillPower72(id,n=trickLvl(id)){return SKILL_INFO72[id][2](n);}
for(const id of Object.keys(SKILL_INFO72))Object.defineProperty(EFFECTS[id],'desc',{configurable:true,get:()=>skillPower72(id)});
HOOKS.mods.push(m=>{
  const extra=id=>trickLvl(id)-1;
  if(hasEffect('t_eye')){m.tapAdd+=extra('t_eye');m.tap*=1.1+.05*extra('t_eye');}
  if(hasEffect('t_pity'))m.pity*=(1.5+.1*extra('t_pity'))/1.5;
  if(hasEffect('t_breath'))m.regen*=(1.5+.1*extra('t_breath'))/1.5;
  if(hasEffect('t_trader'))m.rate*=(1.1+.025*extra('t_trader'))/1.1;
  if(hasEffect('t_focus'))m.study*=(.75-.03*extra('t_focus'))/.75;
  if(hasEffect('t_luck'))m.crit+=.01*extra('t_luck');
  if(hasEffect('t_soul'))m.mpm+=.5*extra('t_soul');
  if(hasEffect('t_professional'))m.work*=1.15+.05*extra('t_professional');
  if(hasEffect('t_recovery'))m.hpm+=1+.5*extra('t_recovery');
});
trashCdMult=(function(orig){return ()=>orig()*(hasEffect('t_hands')?(.7-.04*(trickLvl('t_hands')-1))/.7:1);})(trashCdMult);
dateChance=(function(orig){return (g,d)=>clamp(orig(g,d)+(hasEffect('t_charm')?.025*(trickLvl('t_charm')-1):0),.05,.97);})(dateChance);
itemPrice=(function(orig){return (id,t)=>Math.round(orig(id,t)*(hasEffect('t_haggle')?(1.15+.05*(trickLvl('t_haggle')-1))/1.15:1));})(itemPrice);
myFighter=(function(orig){return ()=>{const f=orig();if(hasEffect('t_fist')){const n=trickLvl('t_fist')-1;f.strength=(f.strength-5)/1.15*(1.15+.05*n)+5+n;}return f;};})(myFighter);
addTrust=(function(orig){return v=>orig(v<0&&hasEffect('t_diplomat')?v*(.5-.05*(trickLvl('t_diplomat')-1))/.5:v);})(addTrust);
EXTRA_TABS.life.skills=()=>'<div class="info-card"><b>Навык — полезный временный бонус</b><p>Активация оплачивается отдельно. Улучшение сохраняется навсегда: усиливает бонус, продлевает действие и сокращает перезарядку. Уже купленные уровни сохранены. У «Железного желудка» улучшается время действия и перезарядка.</p></div>'+['Доход','Бутылки','Развитие','Отношения и здоровье'].map(group=>'<div class="subhead">'+group+'</div>'+TRICKS.filter(t=>SKILL_INFO72[t.id][0]===group).map(t=>{
  const n=trickLvl(t.id),active=activeEffects().find(e=>e.id===t.id),locked=level()<t.level,cd=cdLeft(t.id);
  const btn=locked?lockBtn:active?`<button class="btn green" disabled>Активен · <span data-until="${active.until}"></span></button>`:cd>0?timerBtn(S.cd[t.id]):priceBtn('trick',t.id,trickPrice(t),S.money>=trickPrice(t),'Активировать · '+incomeMoney(trickPrice(t)));
  return card({cls:'skill-card72',thumb:EFFECTS[t.id].emoji,title:`${EFFECTS[t.id].name} · ${n}/${TRICK_MAX}`,desc:`<span class="skill-purpose72">${SKILL_INFO72[t.id][1]}</span><b class="skill-power72">${skillPower72(t.id)}</b>Действует ${trickMinutes(t)} мин · перезарядка ${trickCdMin(t)} мин`,extra:locked?reqHTML({level:t.level}):n<TRICK_MAX?`<p>После улучшения: ${skillPower72(t.id,n+1)}</p>${priceBtn('trickUp',t.id,trickUpPrice(t),S.money>=trickUpPrice(t),'Улучшить навсегда · '+incomeMoney(trickUpPrice(t)))}`:'<small>Максимальный уровень</small>',btn});
}).join('')).join('');
