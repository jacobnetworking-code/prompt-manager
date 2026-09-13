(()=>{"use strict";
const mq=window.matchMedia("(min-width:1024px)");
const SIDEBAR_KEY="pm-desktop-sidebar-expanded";
const INTERFACE_KEY="pm-interface-mode";
const INTERFACE_MODES=new Set(["auto","mobile","desktop"]);

function interfaceMode(){
  const value=localStorage.getItem(INTERFACE_KEY)||"auto";
  return INTERFACE_MODES.has(value)?value:"auto";
}
function desktop(){
  return mq.matches||interfaceMode()==="desktop";
}
function applyInterfaceMode(mode=interfaceMode(),{persist=false}={}){
  if(!INTERFACE_MODES.has(mode))mode="auto";
  if(persist)localStorage.setItem(INTERFACE_KEY,mode);
  document.body.classList.toggle("pm-interface-mobile",mode==="mobile");
  document.body.classList.toggle("pm-interface-desktop",mode==="desktop");
  document.body.dataset.interfaceMode=mode;
  syncCompactDesktopRail();

  // Keep the real device viewport in every mode. Forced desktop is now a
  // responsive desktop layout, not a fake 1180px viewport that can overflow.
  const viewport=document.querySelector('meta[name="viewport"]');
  if(viewport){
    viewport.setAttribute("content","width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover");
  }
  syncInterfaceControls();
  applySidebarPreference();
  syncSidebarA11y();
}

function syncCompactDesktopRail(){
  const nav=document.querySelector(".bottom-nav");
  const profile=document.getElementById("profileBtn");
  const header=document.querySelector(".app > header");
  if(!nav||!profile||!header)return;
  const compactDesktop=interfaceMode()==="desktop"&&!mq.matches;
  let label=profile.querySelector(".pm-profile-label");
  if(!label){
    label=document.createElement("small");
    label.className="pm-profile-label";
    profile.appendChild(label);
  }
  const lang=document.documentElement.lang||"en";
  label.textContent=lang.startsWith("es")?"Perfil":lang.startsWith("sr")?"Profil":"Profile";
  if(compactDesktop){
    if(profile.parentElement!==nav)nav.appendChild(profile);
    profile.classList.add("pm-profile-in-rail");
  }else{
    if(profile.parentElement!==header)header.appendChild(profile);
    profile.classList.remove("pm-profile-in-rail");
  }
}
function applySidebarPreference(){
  if(!desktop()||interfaceMode()==="mobile"){
    document.body.classList.remove("pm-sidebar-expanded");
    return;
  }
  document.body.classList.toggle("pm-sidebar-expanded",localStorage.getItem(SIDEBAR_KEY)==="1");
}
function toggleSidebar(){
  if(!desktop()||interfaceMode()==="mobile")return;
  const next=!document.body.classList.contains("pm-sidebar-expanded");
  document.body.classList.toggle("pm-sidebar-expanded",next);
  localStorage.setItem(SIDEBAR_KEY,next?"1":"0");
  syncSidebarA11y();
}
function syncSidebarA11y(){
  const brand=document.querySelector(".brand");
  if(!brand)return;
  const expanded=document.body.classList.contains("pm-sidebar-expanded");
  brand.setAttribute("aria-expanded",String(expanded));
  brand.setAttribute("aria-label",expanded?"Collapse sidebar":"Expand sidebar");
}
function syncInterfaceControls(){
  const mode=interfaceMode();
  document.querySelectorAll("[data-interface-mode]").forEach(button=>{
    const active=button.dataset.interfaceMode===mode;
    button.classList.toggle("active",active);
    button.setAttribute("aria-pressed",String(active));
  });
}
function applyThemeFromSettings(theme){
  if(!["system","light","dark"].includes(theme))return;
  localStorage.setItem("pm-theme",theme);
  if(theme==="system")document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme",theme);
  document.querySelectorAll("[data-quick-theme]").forEach(button=>{
    button.classList.toggle("active",button.dataset.quickTheme===theme);
  });
}
function enhanceSettings(){
  const dialog=document.getElementById("settingsDialog");
  if(!dialog||dialog.dataset.pmEnhanced==="1")return;
  dialog.dataset.pmEnhanced="1";
  dialog.classList.remove("sheet");

  const windowEl=document.createElement("section");
  windowEl.className="pm-settings-window";
  while(dialog.firstChild)windowEl.appendChild(dialog.firstChild);
  dialog.appendChild(windowEl);

  const sections=windowEl.querySelectorAll(".settings-section");
  const dataSection=sections[sections.length-1]||null;

  const appearance=document.createElement("div");
  appearance.className="settings-section pm-settings-group";
  appearance.innerHTML=`<span class="settings-label">Appearance</span><div class="appearance-segment pm-settings-segment" role="group" aria-label="Appearance"><button type="button" data-quick-theme="system">System</button><button type="button" data-quick-theme="light">Light</button><button type="button" data-quick-theme="dark">Dark</button></div>`;

  const interfaceSection=document.createElement("div");
  interfaceSection.className="settings-section pm-settings-group";
  interfaceSection.innerHTML=`<span class="settings-label">Interface</span><div class="pm-interface-segment" role="group" aria-label="Interface mode"><button type="button" data-interface-mode="auto" aria-label="Automatic interface"><span class="pm-interface-auto">A</span><small>Auto</small></button><button type="button" data-interface-mode="mobile" aria-label="Mobile interface"><span aria-hidden="true">📱</span><small>Mobile</small></button><button type="button" data-interface-mode="desktop" aria-label="Desktop interface"><span aria-hidden="true">💻</span><small>Desktop</small></button></div><p class="pm-settings-note">Auto adapts to your screen. Your choice is remembered on this device.</p>`;

  if(dataSection){
    windowEl.insertBefore(appearance,dataSection);
    windowEl.insertBefore(interfaceSection,dataSection);
  }else{
    windowEl.append(appearance,interfaceSection);
  }

  const signOut=document.createElement("button");
  signOut.type="button";
  signOut.className="settings-row danger-row pm-settings-signout";
  signOut.innerHTML="<span>Sign out</span><span>↗</span>";
  windowEl.appendChild(signOut);

  appearance.addEventListener("click",event=>{
    const button=event.target.closest("[data-quick-theme]");
    if(!button)return;
    applyThemeFromSettings(button.dataset.quickTheme);
  });
  interfaceSection.addEventListener("click",event=>{
    const button=event.target.closest("[data-interface-mode]");
    if(!button)return;
    applyInterfaceMode(button.dataset.interfaceMode,{persist:true});
  });
  signOut.addEventListener("click",()=>{
    dialog.close();
    document.getElementById("profileMenu")?.close?.();
    document.getElementById("logoutBtn")?.click();
  });

  const theme=localStorage.getItem("pm-theme")||"system";
  document.querySelectorAll("[data-quick-theme]").forEach(button=>{
    button.classList.toggle("active",button.dataset.quickTheme===theme);
  });
  syncInterfaceControls();
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
  if(!desktop()||interfaceMode()==="mobile")return;
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
  applyInterfaceMode();
  enhanceSettings();
  syncCompactDesktopRail();
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
  syncCompactDesktopRail();
  applySidebarPreference();
  syncSidebarA11y();
  if(desktop())void initAuthBackdrop();
});
new MutationObserver(()=>syncCompactDesktopRail()).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();
