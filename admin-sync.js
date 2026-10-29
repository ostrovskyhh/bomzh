// Reconcile signed server edits without discarding unrelated local play.
let ADMIN_REMOTE=null,ADMIN_SYNC_LOCK=false;
function adminSyncBusy(){return !!(MG||MG_PENDING||FIGHT||S.busy);}
function adminSyncAt(s,p){return p.reduce((v,k)=>v?.[k],s);}
function adminSyncEqual(a,b){return JSON.stringify(a??null)===JSON.stringify(b??null);}
function adminSyncGuard(s,guard){
 if(guard.city!==undefined&&guard.city!==(s.city||'zas'))return false;
 if(guard.family&&!adminSyncEqual(guard.family,{girlfriend:s.girlfriend??null,kids:(s.kids||[]).map(k=>[k.born??null,k.sex??null])}))return false;
 return true;
}
function adminSyncMerge(local,remote){
 const revision=local.adminRevision||0,events=(remote.adminJournal||[]).filter(e=>e.revision>revision).sort((a,b)=>a.revision-b.revision),next=structuredClone(local);
 if(events.length!==(remote.adminRevision||0)-revision)return null;
 let expected=revision;
 for(const event of events){
  if(event.revision!==++expected||!adminSyncGuard(next,event.guard||{}))return null;
  for(const op of event.ops){
   if(!Array.isArray(op.path)||!op.path.length||op.path.some(k=>['__proto__','prototype','constructor'].includes(k)))return null;
   let obj=next;
   for(const k of op.path.slice(0,-1)){if(!obj[k]||typeof obj[k]!=='object')return null;obj=obj[k];}
   const key=op.path.at(-1),current=obj[key];
   if(op.kind==='delta'){
    if(typeof current!=='number'||!Number.isFinite(current+op.value)||current+op.value<0)return null;
    obj[key]=current+op.value;
   }else{
    if(!adminSyncEqual(current,op.before)&&!adminSyncEqual(current,op.after))return null;
    if(op.kind==='remove'){if(Array.isArray(obj))obj.splice(key,1);else delete obj[key];}
    else obj[key]=structuredClone(op.after);
   }
  }
  next.adminRevision=event.revision;
 }
 next.adminJournal=structuredClone(remote.adminJournal||[]);return next;
}
function adminSyncReceive(remote){
 if(!remote||(remote.adminRevision||0)<=(S.adminRevision||0))return false;
 if(SAVE_LOCK&&!ADMIN_SYNC_LOCK)return true;
 ADMIN_REMOTE=remote;
 if(adminSyncBusy()){serverReady=false;ADMIN_SYNC_LOCK=true;return true;}
 const merged=adminSyncMerge(S,remote);
 if(!merged){
  SAVE_LOCK=true;ADMIN_SYNC_LOCK=true;
  openModal(`<h3>Профиль обновлён администратором</h3><p>Изменения пересекаются с текущей игрой. Чтобы продолжить, загрузи проверенный серверный профиль.</p><p>Перед загрузкой можно сохранить копию текущего прогресса для поддержки.</p><button class="btn wide" data-act="adminSyncBackup">Скачать мою копию</button><button class="btn primary wide" data-act="adminSyncLoad">Загрузить профиль</button>`,{locked:true,center:true});return true;
 }
 S=merged;serverBase=Math.max(serverBase,remote.rev||0);S.rev=Math.max(S.rev||0,serverBase);REV_FLOOR=Math.max(REV_FLOOR,S.rev);serverReady=true;
 ADMIN_REMOTE=null;ADMIN_SYNC_LOCK=false;SAVE_LOCK=false;
 returnNotice({key:'admin:'+S.adminRevision,title:'Профиль обновлён',body:(remote.adminJournal||[]).at(-1)?.reason||'Администратор обновил игровые параметры.'});
 applyCity();renderScene();updateHud();if(currentScreen!=='game')renderCurrent();save(true);return true;
}
adoptOrAsk=(function(orig){return remote=>{if(!adminSyncReceive(remote))return orig(remote);};})(adoptOrAsk);
serverSeen=(function(orig){return remote=>{if(!adminSyncReceive(remote))return orig(remote);};})(serverSeen);
HOOKS.tick.push(()=>{if(ADMIN_REMOTE&&ADMIN_SYNC_LOCK&&!adminSyncBusy()&&!$('a6Apply')&&!document.querySelector('#modalRoot [data-act="adminSyncLoad"]'))adminSyncReceive(ADMIN_REMOTE);});
Object.assign(ACTIONS,{
 adminSyncLoad:()=>{if(ADMIN_REMOTE)adoptSave(ADMIN_REMOTE);},
 adminSyncBackup:()=>{const blob=new Blob([JSON.stringify(S)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='game-support-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
});
prestigeProfile=(function(orig){return ()=>({...orig(),adminRevision:S.adminRevision||0,adminJournal:S.adminJournal||[]});})(prestigeProfile);
freshState=(function(orig){return ()=>({...orig(),adminRevision:S?.adminRevision||0,adminJournal:S?.adminJournal||[]});})(freshState);
