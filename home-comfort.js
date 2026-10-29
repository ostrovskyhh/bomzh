// Compact scene controls occupy the scene overlay, never a row above the game.
function cityPanelMode(){return ['compact','full','hidden'].includes(S.settings?.cityPanelMode)?S.settings.cityPanelMode:'compact';}
function homeComfortRefresh(){
  const info=document.querySelector('.scene-info'),button=$('cityPanelToggle');if(!info||!button)return;
  const tools=$('sceneTools458');if(tools)info.style.marginRight=$('returnOffer')?.hidden?'42px':'82px';
  const mode=cityPanelMode();if(info.dataset.mode===mode)return;info.dataset.mode=mode;button.textContent=mode==='hidden'?'📍':'−';button.setAttribute('aria-label',mode==='hidden'?'Показать панель города':'Скрыть панель города');
  const title=$('locName');title.setAttribute('aria-expanded',String(mode==='full'));title.setAttribute('title','Город и доход — подробнее');
}

HOOKS.init.push(()=>{
  const old=$('locName');if(old){const title=document.createElement('button');title.id='locName';title.className='loc-name';title.dataset.act='cityPanelDetails';title.innerHTML=old.innerHTML;old.replaceWith(title);}
  const info=document.querySelector('.scene-info'),toggle=document.createElement('button');toggle.id='cityPanelToggle';toggle.className='city-panel-toggle';toggle.dataset.act='cityPanelHide';info?.append(toggle);
  const tools=document.createElement('div');tools.id='sceneTools458';tools.className='scene-tools458';const bell=$('returnBell'),offer=$('returnOffer');if(bell)tools.append(bell);if(offer){offer.textContent='🎒';offer.setAttribute('aria-label','Наборы для хорошего старта');offer.setAttribute('title','Наборы для хорошего старта');tools.append(offer);}$('scene').append(tools);document.querySelector('.return-home-row')?.remove();homeComfortRefresh();
});
ACTIONS.cityPanelDetails=()=>{S.settings.cityPanelMode=cityPanelMode()==='full'?'compact':'full';save();homeComfortRefresh();};
ACTIONS.cityPanelHide=()=>{S.settings.cityPanelMode=cityPanelMode()==='hidden'?'compact':'hidden';save();homeComfortRefresh();};
HOOKS.hud.push(homeComfortRefresh);
