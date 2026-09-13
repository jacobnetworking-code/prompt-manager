(()=>{"use strict";
/* M1.7.1 — settings label repair + Library import shortcut */

const IMPORT_ICON=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"></path><path d="m7.5 10.5 4.5 4.5 4.5-4.5"></path><path d="M5 19h14"></path></svg>`;

function currentLanguage(){
  const raw=(localStorage.getItem("pm-language")||document.documentElement.lang||"en").toLowerCase();
  if(raw.startsWith("es"))return"es";
  if(raw.startsWith("sr"))return"sr";
  return"en";
}

function copy(){
  const lang=currentLanguage();
  return {
    en:{import:"Import Prompts",backup:"Backup & Restore",diagnostics:"Storage Diagnostics",importTitle:"Import prompts"},
    es:{import:"Importar prompts",backup:"Copia de seguridad y restauración",diagnostics:"Diagnóstico de almacenamiento",importTitle:"Importar prompts"},
    sr:{import:"Uvezi promptove",backup:"Backup i vraćanje",diagnostics:"Dijagnostika skladišta",importTitle:"Uvezi promptove"}
  }[lang];
}

function setRowLabel(id,text){
  const row=document.getElementById(id);
  const label=row?.querySelector("span:first-child");
  if(label&&label.textContent!==text)label.textContent=text;
}

function repairSettingsLabels(){
  const c=copy();
  setRowLabel("openBulkImport",c.import);
  setRowLabel("openBackup",c.backup);
  setRowLabel("openDiagnostics",c.diagnostics);
}

function ensureLibraryImport(){
  const actions=document.querySelector(".pm-library-head-actions");
  const add=document.getElementById("libraryAdd");
  if(!actions||!add)return;
  if(document.getElementById("pmLibraryImport"))return;

  const button=document.createElement("button");
  button.type="button";
  button.id="pmLibraryImport";
  button.className="pm-library-import";
  button.setAttribute("aria-label",copy().importTitle);
  button.setAttribute("title",copy().importTitle);
  button.innerHTML=IMPORT_ICON;

  button.addEventListener("click",event=>{
    event.preventDefault();
    event.stopPropagation();
    document.getElementById("openBulkImport")?.click();
  });

  actions.insertBefore(button,add);
}

function sync(){
  repairSettingsLabels();
  ensureLibraryImport();
  const b=document.getElementById("pmLibraryImport");
  if(b){
    b.setAttribute("aria-label",copy().importTitle);
    b.setAttribute("title",copy().importTitle);
  }
}

sync();

const settings=document.getElementById("settingsDialog");
if(settings){
  new MutationObserver(sync).observe(settings,{subtree:true,childList:true,attributes:true,attributeFilter:["open"]});
}

const library=document.getElementById("libraryView");
if(library){
  new MutationObserver(sync).observe(library,{subtree:true,childList:true});
}

document.addEventListener("change",event=>{
  if(event.target?.id==="pmLanguageSelect")setTimeout(sync,0);
},true);

window.addEventListener("storage",sync);
})();