// Pointer/platform gating, not viewport width: a narrow desktop is still a desktop.
function desktop471Enabled(platform=tg?.platform){const p=String(platform||'').toLowerCase();return !['ios','android','android_x'].includes(p)&&!/(iPhone|iPad|iPod|Android)/i.test(navigator.userAgent)&&!(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)&&!navigator.userAgentData?.mobile&&matchMedia('(pointer:fine)').matches&&matchMedia('(hover:hover)').matches;}
function desktop471Apply(){document.body.classList.toggle('pc471',desktop471Enabled());}
for(const q of ['(pointer:fine)','(hover:hover)'])matchMedia(q).addEventListener('change',desktop471Apply);
desktop471Apply();
function desktop471Scroller(target){if(modalOpen()){const sheet=document.querySelector('#modalRoot .sheet');if(!sheet)return null;for(let p=target;p&&sheet.contains(p);p=p.parentElement){if(p.scrollHeight>p.clientHeight+2&&/auto|scroll/.test(getComputedStyle(p).overflowY))return p;}return sheet;}
 const list=document.querySelector('.screen.active .list');return list?.scrollHeight>list?.clientHeight?list:document.querySelector('.screen.active');}
document.addEventListener('keydown',e=>{if(!desktop471Enabled()||e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||MG||MG_PENDING||FIGHT||CUT)return;
 if(e.target.closest?.('input,textarea,select,[contenteditable=true],[role=slider],[role=grid]'))return;
 if(!['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(e.key))return;
 const box=desktop471Scroller(e.target);if(!box||box.scrollHeight<=box.clientHeight+2)return;
 const before=box.scrollTop,delta=e.key==='ArrowUp'?-48:e.key==='ArrowDown'?48:e.key==='PageUp'?-box.clientHeight*.85:e.key==='PageDown'?box.clientHeight*.85:0;
 if(e.key==='Home')box.scrollTop=0;else if(e.key==='End')box.scrollTop=box.scrollHeight;else box.scrollTop+=delta;
 if(box.scrollTop!==before)e.preventDefault();
});
// Native wheel/touch scrolling stays intact; only the keyboard and desktop presentation change.
const desktopOpenBefore471=openModal;openModal=function(...args){const out=desktopOpenBefore471.apply(this,args);if(desktop471Enabled()&&!MG&&!MG_PENDING&&!FIGHT&&!CUT){const sheet=document.querySelector('#modalRoot .sheet');if(sheet){sheet.tabIndex=-1;requestAnimationFrame(()=>{if(sheet.isConnected&&!sheet.contains(document.activeElement)&&!document.activeElement?.matches('input,textarea,select'))sheet.focus({preventScroll:true});});}}return out;};
