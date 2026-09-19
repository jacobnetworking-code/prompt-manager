/* Prompt Manager V2.0.32 — support diagnostics */
(()=>{"use strict";
const $=id=>document.getElementById(id);
async function copyText(value){
 try{await navigator.clipboard.writeText(value);return true}catch{}
 const ta=document.createElement("textarea");ta.value=value;ta.setAttribute("readonly","");
 ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.focus();ta.select();ta.setSelectionRange(0,ta.value.length);
 let ok=false;try{ok=document.execCommand("copy")}catch{}ta.remove();return !!ok;
}
function toastSafe(s){try{toast(s)}catch{}}
function installLayout(){
 const body=$("diagnosticsBody"),refresh=$("diagnosticsRefresh"),copy=$("diagnosticsCopy");
 if(!body||!refresh||!copy||$("pmStorageDiagCard"))return;
 const sheet=body.closest(".sheet");
 const storage=document.createElement("section");storage.id="pmStorageDiagCard";storage.className="pm-diag-card";
 storage.innerHTML='<div class="pm-diag-head"><div><small>STORAGE</small><strong>Storage Diagnostics</strong></div></div>';
 body.parentNode.insertBefore(storage,body);storage.append(body);
 const actions=document.createElement("div");actions.className="pm-diag-actions";storage.append(actions);actions.append(refresh,copy);

 const offline=document.createElement("section");offline.id="pmSyncDiag";offline.className="pm-diag-card pm-sync-diag";
 offline.innerHTML='<div class="pm-diag-head"><div><small>OFFLINE</small><strong>Offline Sync</strong></div><span id="pmSyncDiagPending">—</span></div><pre id="pmSyncDiagText">No sync trace yet.</pre><div class="pm-diag-actions"><button type="button" id="pmSyncDiagRefresh">Refresh trace</button><button type="button" id="pmSyncDiagCopy">Copy trace</button><button type="button" id="pmSyncDiagClear">Clear trace</button></div>';
 storage.insertAdjacentElement("afterend",offline);

 const hint=sheet?.querySelector(".hint");if(hint)hint.textContent="Diagnostic data only. Nothing here modifies or clears your Library.";
 const render=async()=>{
   const api=window.pmDataIntegrity,events=api?.diagnostics?.()||[],pending=await api?.pendingCount?.();
   $("pmSyncDiagPending").textContent=`${pending??0} pending`;
   $("pmSyncDiagText").textContent=JSON.stringify({online:navigator.onLine,pending,events},null,2);
 };
 $("pmSyncDiagRefresh").onclick=render;
 $("pmSyncDiagCopy").onclick=async()=>{
   const payload=await window.pmDataIntegrity?.copyDiagnostics?.();if(!payload)return;
   const ok=await copyText(payload);
   if(!ok){$("pmSyncDiagText").textContent=payload;const range=document.createRange();range.selectNodeContents($("pmSyncDiagText"));const sel=getSelection();sel.removeAllRanges();sel.addRange(range)}
   toastSafe(ok?"Sync trace copied":"Trace selected — Copy");
 };
 $("pmSyncDiagClear").onclick=()=>{window.pmDataIntegrity?.clearDiagnostics?.();render()};
 document.addEventListener("pm:sync-diagnostic",render);
 $("openDiagnostics")?.addEventListener("click",()=>setTimeout(render,80));
 render();
}
function reconnectCopy(){
 const el=$("pmConnectivity");if(!el)return;
 el.dataset.state="online";el.textContent="Back online · Syncing prompts…";el.dataset.visible="true";
}
window.addEventListener("online",()=>setTimeout(reconnectCopy,0));
document.addEventListener("pm:sync-start",reconnectCopy);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installLayout,{once:true});else installLayout();
})();