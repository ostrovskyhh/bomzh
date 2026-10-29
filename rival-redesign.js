// Approved idea 63: compare combat power, retain gym gains between matchmaking bands.
RIVAL_TIERS[0].name='Лёгкий';RIVAL_TIERS[1].name='Равный';RIVAL_TIERS[2].name='Опасный';
function rivalReference(){
  const st=fightState(),me={...myFighter(),hpMult:1},band=Math.floor(st.rating/200),old=st.matchmaking;
  if(!old||old.city!==city()||old.band!==band){
    st.matchmaking={city:city(),band,rating:st.rating,power:Math.max(fighterPower(me),old?.city===city()?old.power:0),level:me.level,tier:me.tier};
  }
  return {...st.matchmaking,power:Math.max(st.matchmaking.power,70+Math.max(0,st.rating-1000)*.12)};
}
genRival=function(i){
  const t=RIVAL_TIERS[i]||RIVAL_TIERS[1],ref=rivalReference(),st=fightState(),used=st.rivals.map(r=>r.name);
  const target=ref.power*[.78,1,1.25][i]*rand(.98,1.02),eq=randomEq(clamp(Math.round(ref.tier/2)+(i===2?1:0),0,3));
  const tier=CLOTHES.body.find(x=>x.id===eq.body).tier+CLOTHES.shoes.find(x=>x.id===eq.shoes).tier;
  const lvl=Math.max(1,ref.level+[-2,0,2][i]),form=clamp(Math.round(ref.power*.15),0,150);
  const strength=Math.max(0,(target-65-1.95*lvl-9*tier-.63*form)/1.12);
  const style=pick(Object.keys(F3_STYLE)),base=F3_STYLE[style];
  const op={id:Date.now()+i,name:pick(RIVAL_NAMES.filter(n=>!used.includes(n)))||pick(RIVAL_NAMES),level:lvl,form,strength,tier,eq,hpMult:1,style,diff:t.id,
    rating:Math.max(800,Math.round(st.rating+t.rating+rand(-30,30))),referencePower:ref.power,matchVersion:454,
    botStyle:i===0?{block:.12,heavy:.18,feint:0}:i===2?{block:Math.min(.5,base.block+.12),heavy:Math.min(.55,base.heavy+.15),feint:Math.max(.2,base.feint)}:{...base,feint:Math.max(.08,base.feint)}};
  // Low-level opponents can have less HP without requiring negative strength.
  const stats=fighterStats(op);if(fighterPower(op)>target)op.hpMult=clamp((target-stats.atk*4-stats.def*3)/(stats.hp*.5),.25,1);
  op.rewardK=clamp(t.reward*fighterPower(op)/ref.power,.5,2.4);return op;
};
HOOKS.load.push(()=>{const st=fightState();if(!st.rivalsV454){st.rivals=[];delete st.matchmaking;st.rivalsV454=true;}});
ensureRivals=(function(orig){return function(force){const st=fightState();if(st.rivals.length&&(!st.rivals.every(r=>r.matchVersion===454)||st.matchmaking?.city!==city()||st.matchmaking?.band!==Math.floor(st.rating/200)))force=true;return orig(force);};})(ensureRivals);
const fightsBefore454=EXTRA_TABS.fun.fights;
EXTRA_TABS.fun.fights=()=>{
  let html=fightsBefore454();if(level()<FIGHT_LEVEL)return html;
  const t=document.createElement('template');t.innerHTML=html;
  t.content.querySelectorAll('[data-act="fight"]').forEach(btn=>{
    const op=fightState().rivals.find(r=>String(r.id)===btn.dataset.id);if(!op)return;
    btn.closest('.card')?.classList.add('rival-card');
    const me=Math.round(fighterPower(myFighter())),enemy=Math.round(fighterPower(op));
    btn.closest('.card')?.querySelector('.card-desc')?.insertAdjacentHTML('beforeend',`<p class="rival-comparison">Твоя мощь: ${me} · Соперник: ${enemy}<br><small>Сила ${Math.round(op.strength)} · Форма ${Math.round(op.form)} · Класс одежды ${op.tier}</small></p>`);
  });
  return `<div class="info-card rival-guide"><b>Соперники по боевой мощи</b><p>Лёгкий — тренировка, равный — проверка навыка, опасный — больше риска и награда выше. Сравнивай силу, форму и экипировку, а не только уровень.</p><small>База подбора обновляется при смене города или каждых 200 очков рейтинга. Тренировки не усиливают уже подобранных противников. Сюжетные боссы и онлайн-бои работают по прежним правилам.</small></div>`+t.innerHTML;
};
