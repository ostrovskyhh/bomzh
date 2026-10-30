// Presentation only. Catalog IDs, prices, unlocks, rewards and saved possessions are untouched.
const CITY_JOBS510=['story','crate','transport','home','transport','gift','food','work','broom','envelope','food','police','art','study','world'];
const CITY_TILES510={housing:'home',clothes:'clothes',transport:'transport',pets:'people',food:'food',season:'world',bottles:'bottle',gym:'gym',health:'health',skills:'skills',work:'work',business:'business',study:'study',market:'money',crime:'crime',casino:'fun',fights:'gym',rest:'sleep',dates:'dates',friends:'people',clan:'police',world50:'world',flea:'gift',chat:'chat',top:'skills',story:'story',side:'envelope',tasks:'study',pass:'gift',ach:'skills',coll:'art',prestige:'skills'};
const CITY_DOM_ORIGINAL510=new WeakMap();
function citySetIcon510(el,c,key,art){if(!el)return;const mark=c+':'+key;if(el.dataset.cityDecor510===mark&&el.querySelector('svg[data-city-art510]'))return;if(!CITY_DOM_ORIGINAL510.has(el))CITY_DOM_ORIGINAL510.set(el,el.innerHTML);el.innerHTML=art||cityIcon510(c,key);el.dataset.cityDecor510=mark;}
function cityDecor510(root=document){
 if(!root?.querySelectorAll)return;const c=city();
 if(!WORLD50[c]){root.querySelectorAll('[data-city-decor510]').forEach(el=>{if(CITY_DOM_ORIGINAL510.has(el))el.innerHTML=CITY_DOM_ORIGINAL510.get(el);delete el.dataset.cityDecor510;});return;}
 root.querySelectorAll('#tabbar [data-hub]>span').forEach(el=>{const id=el.parentElement.dataset.hub;citySetIcon510(el,c,({me:'clothes',tasks:'story',home:'home',money:'money',fun:'fun',people:'people'})[id]||'world');});
 root.querySelectorAll('.bh-tile[data-id] .bh-e').forEach(el=>citySetIcon510(el,c,CITY_TILES510[el.parentElement.dataset.id.split(':').at(-1)]||'world'));
 for(const [id,key] of Object.entries({exchangeBtn:'money',trashBtn:'trash',eatBtn:'food',sleepBtn:'sleep'}))citySetIcon510(root.querySelector('#'+id+' .act-emoji'),c,key);
 root.querySelectorAll('.business-card,.business-detail').forEach(el=>{const name=el.querySelector('h3')?.textContent,i=BUSINESSES.findIndex(b=>b.name===name);if(i>=0)citySetIcon510(el.querySelector('.business-emblem'),c,'business:'+i,cityBusiness510(c,i));});
 root.querySelectorAll('.w50-activities [data-act="worldActivity50"]').forEach(el=>{let icon=el.querySelector('.city-activity510');if(!icon){icon=document.createElement('span');icon.className='city-activity510';el.prepend(icon);}citySetIcon510(icon,c,({recipe:'food',sort:'crate',route:'transport',mosaic:'art',tea:'food',circuit:'energy',logic:'study'})[el.dataset.id]||'world');});
 root.querySelectorAll('.w50-egg').forEach(el=>citySetIcon510(el,c,'keeper',worldPetArt50(c,c==='it'?0:3)));
}
const cityFillBefore510=fillIcons;fillIcons=function(root=document){cityFillBefore510(root);cityDecor510(root);};
HOOKS.hud.push(()=>cityDecor510());HOOKS.screen.push(()=>cityDecor510());

const cityCardBefore510=card;card=function(options){
 const c=city();if(!WORLD50[c])return cityCardBefore510(options);
 let art;const title=String(options.title||'').replace(/<[^>]*>/g,'').trim(),find=a=>a.findIndex(x=>x.name===title);let i;
 if((i=find(TRANSPORT))>=0)art=cityVehicle510(c,i);
 else if((i=find(JOBS))>=0)art=cityIcon510(c,CITY_JOBS510[WORLD_JOB_IDS50.indexOf(JOBS[i].id)]||'work',i);
 else if((i=find(EDU))>=0)art=cityIcon510(c,'study',i);
 else if((i=find(GIFTS))>=0)art=cityIcon510(c,i===2?'study':i===6?'clothes':'gift',i);
 else if((i=find(DATES))>=0)art=cityIcon510(c,['dates','food','fun','food','world','transport','world','home','art','fun','gym'][i%11],i);
 else if((i=find(LEISURE))>=0)art=cityIcon510(c,['food','world','fun','health','fun','health','world','gym','fun','food','world'][i%11],i);
 else if((i=find(CLINICS))>=0)art=cityIcon510(c,'health',i);
 else if((i=find(GYMS))>=0)art=cityIcon510(c,'gym',i);
 else if((i=find(CRIMES))>=0)art=cityIcon510(c,['crate','transport','crime','study','police'][i%5],i);
 else if((i=find(GIRLS))>=0&&/^(it|cn)_girl50_/.test(GIRLS[i].id))art=`<div class="city-person510">${wifePortrait(GIRLS[i].id)}</div>`;
 return cityCardBefore510(art?{...options,thumb:art}:options);
};

// Regular clothes adapt to the city. Premium full-body skins keep their purchased design.
const cityApplyBefore510=worldApply50;worldApply50=function(c){cityApplyBefore510(c);const cn=c==='cn',p=CITY_PALETTE510[c];
 WORLD_CLOTH_IDS50.body.forEach((id,i)=>{const colors=cn?['#708576','#3b7977','#6c9d88','#36566a','#814b46','#284f50']:['#ac8664','#426b86','#d5c4a3','#a66c4d','#7d624e','#354c59'];let extra;
  if(cn)extra=`<path d="M58 95l38 22v51" stroke="${p.gold}" stroke-width="${i>3?3:2}" fill="none"/>${[120,135,150].map(y=>`<path d="M77 ${y}h17" stroke="${p.paper}" stroke-width="3"/><circle cx="95" cy="${y}" r="2" fill="${p.gold}"/>`).join('')}${i===1?'<path d="M45 115h69m-69 15h69m-69 15h69m-69 15h69" stroke="#b6c9b2" stroke-width="4"/>':i===3?'<path d="M45 123l12-12m45 0 12 12" stroke="#a4c7ad" stroke-width="5"/>':i===5?'<path d="M48 152q8-17 19-5t24-5 20 8" stroke="#c9b477" stroke-width="2" fill="none"/>':''}`;
  else extra=i===1?'<path d="M44 111h72m-72 12h72m-72 12h72m-72 12h72m-72 12h72" stroke="#e6e0c9" stroke-width="5"/>':`<path d="M61 95l15 24-12 17 16-5 17 5-12-17 15-24M80 131v36" stroke="${i===2?'#a18a69':'#cfad80'}" stroke-width="3" fill="none"/>${i===0?'<path d="M47 148h19v15H47Z" fill="#71886a"/>':i===3?'<path d="M50 139h14m32 0h14" stroke="#e6c48a" stroke-width="3"/>':i===4?'<path d="M50 157h60v11H50Z" fill="#f0e0bc"/>':i===5?'<path d="M77 107h6l3 7-6 20-6-20Z" fill="#a84b42"/><path d="M100 117h10" stroke="#e7dfc4" stroke-width="3"/>':''}`;
  worldSet50(BODIES[id],{jacket:colors[i],shirt:cn?'#d7d9b8':'#f0e0be',pants:cn?['#3e5152','#2d4953','#385b51','#2b4050','#3d4346','#263f43'][i]:['#725f4d','#3d5563','#82745d','#504c46','#53473f','#35434e'][i],extra});
 });
 worldSet50(HATS,{shapka:cn?'<path d="M47 55q0-32 33-32t33 32Z" fill="#62786a"/><path d="M46 49h68v12H46Z" fill="#33574f"/><path d="M62 28v20m12-23v23m12-23v23m12-20v20" stroke="#a5ad81" stroke-width="2"/>':'<path d="M48 54q0-30 32-30t32 30Z" fill="#95774f"/><path d="M47 49h66v12H47Z" fill="#bea276"/><path d="M57 52v7m10-7v7m11-7v7m11-7v7m11-7v7" stroke="#886c48" stroke-width="2"/>',cilinder:cn?'<path d="M48 48l5-26h54l6 26Z" fill="#274f4e"/><path d="M39 48h82v11H39Z" fill="#3e7770"/><path d="M54 26h51M72 36h16" stroke="#d8b66b" stroke-width="3"/><path d="M107 20l5-16 9 23" stroke="#b44d42" stroke-width="5" fill="none"/>':'<ellipse cx="80" cy="53" rx="45" ry="10" fill="#b99564"/><path d="M52 50l8-30h40l8 30Z" fill="#d7b981"/><path d="M56 39h48v9H56Z" fill="#9b5344"/><path d="M96 22q14-25 21-10L99 39" fill="#568f85"/>'});
 for(const [i,id] of WORLD_CLOTH_IDS50.shoes.entries()){if(id==='none')continue;const col=cn?['','#6c846c','#344f50','#435e70','#263b42'][i]:['','#a88754','#8b6547','#c3bc9d','#635044'][i];worldSet50(SHOES,{[id]:`<path d="M49 ${id==='boots'?202:214}h27v15H44q-7-8 5-10ZM84 ${id==='boots'?202:214}h27v5q14 2 7 10H84Z" fill="${col}"/><path d="M45 229h30m10 0h32" stroke="${cn?'#92b5a0':'#d4bd92'}" stroke-width="3"/>${cn?'<path d="M56 217l11 8m25-8 11 8" stroke="#c3b07b" stroke-width="2"/>':'<path d="M53 219h15m24 0h13" stroke="#dacba6" stroke-width="2"/>'}`});}
 renderedLook='';
};
const cityWifeBefore510=wifePortrait;wifePortrait=function(gid=S.girlfriend,look=wifeLook(gid)){
 const svg=cityWifeBefore510(gid,look);if(!/^(it|cn)_girl50_/.test(gid||''))return svg;
 const cn=gid.startsWith('cn'),i=Number(gid.at(-1)),accessory=cn?`<path d="M${i%2?24:59} 18l17-8" stroke="#cab373" stroke-width="2"/><circle cx="${i%2?29:64}" cy="16" r="3" fill="#cf7a77"/><path d="M37 70q9 7 18 0" stroke="#dfc68d" stroke-width="1.5" fill="none"/>`:`<path d="M26 23q-2-11 7-12" stroke="#d5bf88" stroke-width="2" fill="none"/><circle cx="27" cy="19" r="4" fill="${['#e2c5a4','#b86a5b','#cda274','#90a083'][i]}"/><circle cx="29" cy="45" r="2" fill="#dbb873"/><circle cx="63" cy="45" r="2" fill="#dbb873"/>`;
 return svg.replace('</svg>',accessory+'</svg>');
};

const cityGameBefore510=worldGameDraw50;worldGameDraw50=function(mg){cityGameBefore510(mg);if(!mgAlive(mg)||!mg.world50)return;const w=mg.world50,c=w.city,arena=$('mgArena');if(!WORLD50[c])return;
 arena.dataset.cityGame510=c+':'+w.kind;
 const artFor=n=>w.kind==='sort'?[cityFood510(c,c==='it'?5:3),cityIcon510(c,c==='it'?'art':'food'),cityIcon510(c,c==='it'?'envelope':'work')][n]:cityFood510(c,(c==='it'?[0,3,5,9,10]:[1,3,5,9,10])[n]);
 if(w.kind==='recipe'||w.kind==='sort'){
  arena.querySelectorAll('.w50-inputs [data-w-input]').forEach(b=>{const label=b.textContent;b.setAttribute('aria-label',label);b.innerHTML=artFor(Number(b.dataset.wInput));});
  if(w.kind==='recipe')arena.querySelectorAll('.w50-order span').forEach((el,i)=>el.innerHTML=artFor(w.order[i]));
  else arena.querySelector('.w50-parcel strong').innerHTML=artFor(w.correct);
 }
 if(w.kind==='mosaic')arena.querySelectorAll('[style*="--tile"]').forEach((el,i)=>el.style.setProperty('--tile',(c==='it'?['#bf744f','#dfbc7a','#78a49b']:['#468f7f','#a64b46','#c7a66a'])[i%3]));
};
