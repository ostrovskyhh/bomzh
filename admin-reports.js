const FBADMIN={items:null,filter:'new',query:'',report:null,loading:false,note:''};
const FBSTAT={new:'Новые',investigating:'В работе',fixed:'Выполнены',duplicate:'Дубликаты',rejected:'Отклонены'};
function feedbackAdminPage(){
 if(!adm4Online())return adm4Need();
 if(!FBADMIN.items&&!FBADMIN.loading){FBADMIN.loading=true;apiPost('admin/feedback/list').then(r=>{FBADMIN.items=r.items||[];FBADMIN.loading=false;if(ADM_TAB==='reports')openAdmin();}).catch(()=>{FBADMIN.loading=false;toast('Не удалось загрузить обращения','bad');});}
 const rows=(FBADMIN.items||[]).filter(r=>(!FBADMIN.filter||r.status===FBADMIN.filter)&&`${r.id} ${r.uid} ${r.name} ${r.text}`.toLowerCase().includes(FBADMIN.query.toLowerCase()));
 const r=FBADMIN.report;
 if(r){let ctx={};try{ctx=JSON.parse(r.ctx||'{}');}catch(_){}const state=ctx.origin||ctx.state||{};
 return `<button class="btn" data-act="reportBack">← К обращениям</button><h3>№${r.id} · ${esc(r.name)}</h3><p>${esc(r.text)}</p><div class="info-card">${FBSTAT[r.status]||r.status} · ID ${r.uid} · версия ${esc(ctx.version||'?')} · ${esc(ctx.screen||'?')}<br>Квест: ${esc((state.quest||{}).id||'—')} · игра: ${esc((state.minigame||{}).title||'—')}<br>${r.reward_gift_id?'✅ Награда уже поставлена в очередь':'За исправленный баг или реализованную идею — 30 крышек'}</div>
 <details><summary>Шаги, ошибки и последние действия</summary><pre class="report-json">${esc(JSON.stringify({reproduction:ctx.reproduction,errors:ctx.errors,events:(ctx.events||[]).slice(-12)},null,2))}</pre></details>
 <button class="btn wide" data-act="reportCopy">📋 Скопировать полный отчёт для разбора</button>
 ${r.status==='fixed'?`<p>${esc(r.resolution||'')}</p>`:`<textarea id="reportResolution" class="fb-text" maxlength="500" placeholder="Что исправлено и в какой версии?">${esc(FBADMIN.note)}</textarea><div class="row-btns">${['investigating','duplicate','rejected'].map(s=>`<button class="btn" data-act="reportStatus" data-id="${s}">${FBSTAT[s]}</button>`).join('')}</div><button class="btn primary wide" data-act="reportFixAsk">${r.kind==='idea'?'Реализовано':'Исправлено'} — выдать 30 крышек</button>`}`;}
 return `<div class="info-card">Очередь обращений: новые → проверка → исправление. Награда выдаётся за подтверждённое исправление, один раз за обращение. Дубликаты отмечай отдельно.</div><div class="row-btns">${[['','Все'],...Object.entries(FBSTAT)].map(([s,t])=>`<button class="btn small ${s===FBADMIN.filter?'primary':''}" data-act="reportFilter" data-id="${s}">${t} ${(FBADMIN.items||[]).filter(r=>!s||r.status===s).length}</button>`).join('')}</div><div class="row-btns"><input id="reportSearch" value="${esc(FBADMIN.query)}" placeholder="Номер, игрок, текст"><button class="btn" data-act="reportSearch">Найти</button><button class="btn" data-act="reportRefresh">⟳</button></div>${FBADMIN.loading?'Загружаю…':rows.map(r=>`<button class="card wide" data-act="reportOpen" data-id="${r.id}"><b>№${r.id} ${esc(r.name)}</b><small>${esc(r.text.slice(0,130))}</small></button>`).join('')||'<p>Обращений нет</p>'}`;
}
ACTIONS.reportFilter=s=>{FBADMIN.filter=s;openAdmin();};
ACTIONS.reportSearch=()=>{FBADMIN.query=($('reportSearch')||{}).value||'';openAdmin();};
ACTIONS.reportRefresh=()=>{FBADMIN.items=null;FBADMIN.report=null;openAdmin();};
ACTIONS.reportOpen=async(id)=>{try{const r=await apiPost('admin/feedback/detail',{id:+id});if(r.error){toast(r.error,'bad');return;}FBADMIN.report=r.report;FBADMIN.note='';openAdmin();}catch(e){toast(refErrorText(e),'bad');}};
ACTIONS.reportBack=()=>{FBADMIN.report=null;openAdmin();};
ACTIONS.reportCopy=async()=>{try{await navigator.clipboard.writeText(JSON.stringify(FBADMIN.report,null,2));toast('Отчёт скопирован','good');}catch(_){toast(`Получить файл в боте: /bugreport ${FBADMIN.report.id}`);}};
ACTIONS.reportStatus=async(status)=>{if(!FBADMIN.report)return;const note=($('reportResolution')||{}).value||FBADMIN.note;
 try{const r=await apiPost('admin/feedback/update',{id:FBADMIN.report.id,status,note});if(r.error){toast(r.error,'bad');return;}toast(r.reward?'Исправление подтверждено. Автор получит 30 крышек.':'Статус сохранён','good');FBADMIN.items=null;FBADMIN.report=null;openAdmin();}catch(e){toast(refErrorText(e),'bad');}};
ACTIONS.reportFixAsk=()=>{FBADMIN.note=($('reportResolution')||{}).value||'';if(FBADMIN.note.trim().length<5){toast('Укажи исправление и версию релиза','bad');return;}
 openModal(`<h3>Подтвердить исправление №${FBADMIN.report.id}?</h3><p>${esc(FBADMIN.note)}</p><p>Автору будет выдано 30 крышек один раз за это обращение. Награды за разные обращения суммируются.</p><button class="btn primary wide" data-act="reportStatus" data-id="fixed">Да, исправлено в опубликованной версии</button><button class="btn wide" data-act="reportFixCancel">Отмена</button>`,{center:true,locked:true});};
ACTIONS.reportFixCancel=()=>openAdmin();
