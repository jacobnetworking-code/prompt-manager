/* Prompt Manager V2.0.30 — temporary offline sync diagnostics */
(()=>{"use strict";
function add(){
 const body=document.getElementById("diagnosticsBody");
 if(!body||document.getElementById("pmSyncDiag"))return;
 const box=document.createElement("section");box.id="pmSyncDiag";box.className="pm-sync-diag";
 box.innerHTML='<strong>Offline Sync Trace</strong><pre id="pmSyncDiagText">No trace yet.</pre><div><button type="button" id="pmSyncDiagRefresh">Refresh trace</button><button type="button" id="pmSyncDiagCopy">Copy trace</button><button type="button" id="pmSyncDiagClear">Clear trace</button></div>';
 body.insertAdjacentElement("afterend",box);
 const render=async()=>{const api=window.pmDataIntegrity,events=api?.diagnostics?.()||[],pending=await api?.pendingCount?.();document.getElementById("pmSyncDiagText").textContent=JSON.stringify({online:navigator.onLine,pending,events},null,2)};
 document.getElementById("pmSyncDiagRefresh").onclick=render;
 document.getElementById("pmSyncDiagCopy").onclick=async()=>{
 const payload=await window.pmDataIntegrity?.copyDiagnostics?.();if(!payload)return;
 let copied=false;try{await navigator.clipboard.writeText(payload);copied=true}catch{}
 if(!copied){const ta=document.createElement("textarea");ta.value=payload;ta.setAttribute("readonly","");ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.focus();ta.select();ta.setSelectionRange(0,ta.value.length);try{copied=document.execCommand("copy")}catch{}ta.remove()}
 if(!copied){const pre=document.getElementById("pmSyncDiagText");pre.textContent=payload;const range=document.createRange();range.selectNodeContents(pre);const sel=getSelection();sel.removeAllRanges();sel.addRange(range)}
 if(typeof toast==="function")toast(copied?"Sync trace copied":"Trace selected — Copy");
};
 document.getElementById("pmSyncDiagClear").onclick=()=>{window.pmDataIntegrity?.clearDiagnostics?.();render()};
 document.addEventListener("pm:sync-diagnostic",render);
 document.getElementById("openDiagnostics")?.addEventListener("click",()=>setTimeout(render,80));
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",add,{once:true});else add();
})();