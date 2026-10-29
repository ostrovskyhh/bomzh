// Idea 67: only ordinary generated rivals use the new defense. Bosses and online modes retain their rules.
function ordinaryDefense(f=FIGHT){return !!f&&f.op?.matchVersion===454&&!f.opts?.onEnd&&!f.opts?.boss;}
function ordinaryDodgeCost(f){return 10+Math.min(3,f.dodgeChain||0)*8;}
function ordinaryDefensePlan(f,heavy=false){
  const tired=Math.min(3,f.dodgeChain||0),novice=f.en.diff==='easy';
  const duration=Math.max(novice?1400:1150,f3Window(f.me,f.en,heavy));
  const window=Math.min(duration*.28,clamp(230+(f.me.form||0)*.8,230,350))*(1-tired*.08);
  return {duration,window,cost:ordinaryDodgeCost(f)};
}
function ordinaryDefenseChoice(elapsed,plan,stamina,kind){
  if(elapsed<0||elapsed>plan.duration)return 'late';
  if(kind==='block')return stamina>=6?'block':'tired';
  if(stamina<plan.cost)return 'tired';
  return elapsed>=plan.duration-plan.window?'dodge':'early';
}
const defendBefore457=f3Defend;
f3Defend=function(id){
  const f=FIGHT;if(!ordinaryDefense(f))return defendBefore457(id);if(!f3Alive(id))return;
  const sty=f.en.botStyle||F3_STYLE[f.en.style]||F3_STYLE.tactic;
  const heavy=f.en.st>=22&&Math.random()<sty.heavy,feint=!heavy&&!f.feinted&&Math.random()<sty.feint;
  const plan=ordinaryDefensePlan(f,heavy),phase={started:performance.now(),plan,feint,heavy,act:null,done:false};f.defense457=phase;
  f.en.st=clamp(f.en.st-(heavy?22:8),0,100);f.busy=true;f3Bars();
  $('f3Stage').innerHTML=`<div class="defense457"><h3>${heavy?'🔥 Мощный удар':'👊 Следи за замахом'}</h3><p>${heavy?'Блок смягчит удар, точный уклон спасёт полностью.':'Дождись зелёной зоны. Соперник может сделать финт.'}</p><div class="defense-meter" role="progressbar" aria-label="Замах соперника" aria-valuemin="0" aria-valuemax="100"><i style="left:${(1-plan.window/plan.duration)*100}%"></i><b id="defenseNeedle"></b></div><p id="defenseCue" aria-live="polite">Рано — дождись зелёной зоны</p><small>Серия уклонений: ${f.dodgeChain||0} · Уклон: ${plan.cost} выносливости · Блок: 6</small></div><div class="f-btns"><button class="btn f-btn" id="f3Dodge" ${f.me.st<plan.cost?'disabled':''}><span>💨</span>Уклон<small>В зелёной зоне</small></button><button class="btn f-btn" id="f3Block" ${f.me.st<6?'disabled':''}><span>🛡️</span>Блок<small>Сбрасывает серию уклонений</small></button></div>`;
  const alive=()=>!phase.done&&f3Alive(id)&&FIGHT===f&&f.defense457===phase;
  const resolve=()=>{
    if(!alive())return;phase.done=true;
    if(feint){
      if(phase.act){f.me.st=clamp(f.me.st-10,0,100);f.dodgeChain=0;f3Log('🦊 Попался на финт: −10 выносливости');}else f3Log('🦊 Финт распознан — ты дождался настоящего удара');
      f.feinted=true;$('defenseCue').textContent='Финт! Следом настоящий удар';f3Bars();
      setTimeout(()=>{if(f3Alive(id)&&FIGHT===f&&f.defense457===phase)f3Defend(id);},450);return;
    }
    f.feinted=false;const act=phase.act;
    if(act==='dodge'){f.me.st=Math.max(0,f.me.st-plan.cost);f.dodgeChain=(f.dodgeChain||0)+1;}
    else{if(act==='early')f.me.st=Math.max(0,f.me.st-8);f.dodgeChain=0;}
    f3Impact(id,heavy,act);
  };
  phase.press=kind=>{
    if(!alive()||phase.act)return;
    const elapsed=performance.now()-phase.started;
    const choice=ordinaryDefenseChoice(elapsed,plan,f.me.st,kind);
    if(choice==='late'||choice==='tired')return;
    phase.act=feint?'early':choice;
    for(const b of [$('f3Dodge'),$('f3Block')])if(b)b.disabled=true;
    const cue=$('defenseCue');if(cue)cue.textContent=feint?'Финт! Дождись настоящего удара':choice==='early'?'Рано! Уклон не сработал':choice==='dodge'?'Точный уклон — готовь контратаку':'Блок принят — серия уклонений сброшена';
  };
  for(const [id,kind] of [['f3Dodge','dodge'],['f3Block','block']]){const b=$(id);b.onpointerdown=e=>{e.preventDefault();phase.press(kind);};b.onclick=()=>phase.press(kind);}
  const frame=()=>{
    if(!alive())return;
    const elapsed=performance.now()-phase.started,p=Math.min(1,elapsed/plan.duration);
    const needle=$('defenseNeedle');if(needle)needle.style.left=p*100+'%';
    const pct=Math.round(p*100);if(phase.lastPct!==pct){phase.lastPct=pct;document.querySelector('.defense-meter')?.setAttribute('aria-valuenow',pct);}
    if(!phase.act&&!feint&&!phase.cueReady&&elapsed>=plan.duration-plan.window){phase.cueReady=true;$('defenseCue').textContent='Уклон сейчас!';$('defenseCue').classList.add('ready');}
    if(!phase.act&&feint&&!phase.cueReady&&elapsed>=plan.duration*.6){phase.cueReady=true;$('defenseCue').textContent='Финт! Не нажимай';document.querySelector('.defense457')?.classList.add('feint-signalled');}
    requestAnimationFrame(frame);
  };requestAnimationFrame(frame);setTimeout(resolve,feint?plan.duration*.6+450:plan.duration);
  if(f3Auto()&&!feint)setTimeout(()=>phase.press('block'),plan.duration*.5);
};
const fightTabBefore457=EXTRA_TABS.fun.fights;
EXTRA_TABS.fun.fights=()=>`<div class="info-card"><b>🥊 Точная защита</b><p>В обычном бою уклоняйся в зелёной зоне: следующий удар — контратака ×1.3. Повторные уклонения тратят больше выносливости и сужают окно. Блок сбрасывает серию. Финт требует терпения — настоящий удар будет следом. Сила, форма и одежда по-прежнему важны.</p></div>`+fightTabBefore457();
