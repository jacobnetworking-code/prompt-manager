(()=>{"use strict";
const mq=window.matchMedia("(min-width:1024px)");
const KEY="pm-desktop-sidebar-expanded";

function desktop(){
  return mq.matches;
}
function applySidebarPreference(){
  if(!desktop()){
    document.body.classList.remove("pm-sidebar-expanded");
    return;
  }
  document.body.classList.toggle("pm-sidebar-expanded",localStorage.getItem(KEY)==="1");
}
function toggleSidebar(){
  if(!desktop())return;
  const next=!document.body.classList.contains("pm-sidebar-expanded");
  document.body.classList.toggle("pm-sidebar-expanded",next);
  localStorage.setItem(KEY,next?"1":"0");
  syncSidebarA11y();
}
function syncSidebarA11y(){
  const brand=document.querySelector(".brand");
  if(!brand)return;
  const expanded=document.body.classList.contains("pm-sidebar-expanded");
  brand.setAttribute("aria-expanded",String(expanded));
  brand.setAttribute("aria-label",expanded?"Collapse sidebar":"Expand sidebar");
}
function escapeHtml(value=""){
  return String(value).replace(/[&<>\"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#039;"}[char]));
}
function promptCard(prompt){
  const title=escapeHtml(prompt.title||"Prompt");
  const category=escapeHtml(prompt.category||"Prompt");
  const text=escapeHtml((prompt.prompt||"").replace(/\s+/g," ").trim());
  return `<article class="pm-auth-prompt-card"><small>${category}</small><strong>${title}</strong><p>${text}</p></article>`;
}
async function initAuthBackdrop(){
  if(!desktop())return;
  const gate=document.getElementById("authGate");
  if(!gate||gate.querySelector(".pm-auth-backdrop"))return;
  try{
    const response=await fetch("./catalog.json",{cache:"force-cache"});
    if(!response.ok)throw new Error(`Catalog ${response.status}`);
    const data=await response.json();
    const prompts=Array.isArray(data?.prompts)?data.prompts:[];
    if(!prompts.length)return;

    const backdrop=document.createElement("div");
    backdrop.className="pm-auth-backdrop";
    backdrop.setAttribute("aria-hidden","true");

    const rowCount=5;
    const rows=Array.from({length:rowCount},()=>[]);
    prompts.forEach((prompt,index)=>rows[index%rowCount].push(prompt));

    rows.forEach((rowPrompts,rowIndex)=>{
      if(!rowPrompts.length)return;
      const row=document.createElement("div");
      row.className="pm-auth-row";
      const track=document.createElement("div");
      track.className="pm-auth-track";
      const groupHtml=rowPrompts.map(promptCard).join("");
      track.innerHTML=`<div class="pm-auth-group">${groupHtml}</div><div class="pm-auth-group" aria-hidden="true">${groupHtml}</div>`;
      track.style.animationDelay=`-${rowIndex*7}s`;
      row.appendChild(track);
      backdrop.appendChild(row);
    });

    gate.insertBefore(backdrop,gate.firstChild);
  }catch(error){
    console.warn("Prompt Manager login backdrop unavailable",error);
  }
}
function init(){
  applySidebarPreference();
  const brand=document.querySelector(".brand");
  if(brand){
    brand.setAttribute("role","button");
    brand.setAttribute("tabindex","0");
    brand.addEventListener("click",toggleSidebar);
    brand.addEventListener("keydown",event=>{
      if(event.key==="Enter"||event.key===" "){
        event.preventDefault();
        toggleSidebar();
      }
    });
  }
  syncSidebarA11y();
  void initAuthBackdrop();
}
mq.addEventListener?.("change",()=>{
  applySidebarPreference();
  syncSidebarA11y();
  if(desktop())void initAuthBackdrop();
});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();
