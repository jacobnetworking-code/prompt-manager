(()=>{"use strict";
const SAVE_ICON=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 4.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v17L12 18l-5.5 3.5z"></path></svg>`;
const SHARE_ICON=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3"></path><path d="m8 7 4-4 4 4"></path><path d="M7 10H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2"></path></svg>`;
let openedCatalogId=null;

function language(){
  const raw=(localStorage.getItem("pm-language")||document.documentElement.lang||"en").toLowerCase();
  if(raw.startsWith("es"))return"es";
  if(raw.startsWith("sr"))return"sr";
  return"en";
}
function label(key){
  const copy={
    en:{save:"Save to Library",saved:"Saved",share:"Share",shareMissing:"Share unavailable"},
    es:{save:"Guardar en Biblioteca",saved:"Guardado",share:"Compartir",shareMissing:"No se puede compartir"},
    sr:{save:"Sačuvaj u biblioteci",saved:"Sačuvano",share:"Podeli",shareMissing:"Deljenje nije dostupno"}
  };
  return copy[language()][key];
}
function showToast(message){
  try{if(typeof toast==="function"){toast(message);return}}catch{}
  const el=document.getElementById("toast");
  if(!el)return;
  el.textContent=message;el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"),1800);
}
function item(id){
  try{if(typeof catalogItem==="function")return catalogItem(id)}catch{}
  try{
    if(typeof catalog!=="undefined"&&Array.isArray(catalog))
      return catalog.find(x=>String(x.id)===String(id))||null;
  }catch{}
  return null;
}
function isSaved(x){
  if(!x)return false;
  try{if(typeof catalogSaved==="function")return!!catalogSaved(x)}catch{}
  try{
    return Array.isArray(prompts)&&prompts.some(p=>p.acquisitionType==="catalog"&&String(p.externalId)===String(x.id));
  }catch{}
  return false;
}
function decorateExploreCards(){
  const list=document.getElementById("exploreList");
  if(!list)return;
  list.querySelectorAll(".explore-card,.pm-featured-card").forEach(card=>{
    const open=card.querySelector("[data-explore-open]");
    if(!open)return;
    card.dataset.pmOpenCard="true";
    card.setAttribute("role","button");
    if(!card.hasAttribute("tabindex"))card.setAttribute("tabindex","0");
  });
}
function ensureDetailActions(){
  const dialog=document.getElementById("useDialog");
  const head=dialog?.querySelector(".sheethead");
  const close=document.getElementById("useClose");
  if(!head||!close)return null;

  let actions=document.getElementById("pmCatalogUseActions");
  if(actions)return actions;

  document.getElementById("pmUseActions")?.remove();

  actions=document.createElement("div");
  actions.id="pmCatalogUseActions";
  actions.hidden=true;
  actions.innerHTML=`
    <button id="pmCatalogUseSave" class="pm-detail-icon" type="button">${SAVE_ICON}</button>
    <button id="pmCatalogUseShare" class="pm-detail-icon" type="button">${SHARE_ICON}</button>`;
  head.insertBefore(actions,close);

  const save=actions.querySelector("#pmCatalogUseSave");
  const share=actions.querySelector("#pmCatalogUseShare");

  save.addEventListener("click",async e=>{
    e.preventDefault();e.stopPropagation();
    const x=item(openedCatalogId);
    if(!x)return;
    if(isSaved(x)){syncDetailActions();return}
    try{
      if(typeof saveCatalog!=="function")throw new Error("Save unavailable");
      await saveCatalog(x);
      syncDetailActions();
    }catch(err){
      console.error("Catalog detail save failed",err);
      showToast(err?.message||"Save unavailable");
    }
  });

  share.addEventListener("click",e=>{
    e.preventDefault();e.stopPropagation();
    const id=String(openedCatalogId||"");
    const selectorId=window.CSS?.escape?CSS.escape(id):id.replace(/["\\]/g,"\\$&");
    const proxy=document.querySelector(`#exploreList [data-pm-explore-share="${selectorId}"]`);
    if(proxy){proxy.click();return}
    showToast(label("shareMissing"));
  });

  return actions;
}
function syncDetailActions(){
  const actions=ensureDetailActions();
  if(!actions)return;
  const dialog=document.getElementById("useDialog");
  const x=openedCatalogId!=null?item(openedCatalogId):null;
  const visible=!!(dialog?.open&&x);
  actions.hidden=!visible;
  if(!visible)return;

  const save=actions.querySelector("#pmCatalogUseSave");
  const share=actions.querySelector("#pmCatalogUseShare");
  const saved=isSaved(x);

  save.dataset.saved=saved?"true":"false";
  save.disabled=saved;
  save.setAttribute("aria-label",saved?label("saved"):label("save"));
  save.setAttribute("title",saved?label("saved"):label("save"));
  share.setAttribute("aria-label",label("share"));
  share.setAttribute("title",label("share"));
}

const list=document.getElementById("exploreList");
if(list){
  list.addEventListener("click",event=>{
    const directOpen=event.target.closest("[data-explore-open]");
    if(directOpen){
      openedCatalogId=String(directOpen.dataset.exploreOpen);
      setTimeout(syncDetailActions,0);
      return;
    }

    const card=event.target.closest(".explore-card,.pm-featured-card");
    if(!card)return;
    if(event.target.closest("button,a,input,textarea,select,video[controls]"))return;

    const open=card.querySelector("[data-explore-open]");
    if(!open)return;

    event.preventDefault();
    event.stopImmediatePropagation();
    openedCatalogId=String(open.dataset.exploreOpen);
    open.click();
    setTimeout(syncDetailActions,0);
  },true);

  list.addEventListener("keydown",event=>{
    const card=event.target.closest(".explore-card,.pm-featured-card");
    if(!card||event.target!==card)return;
    if(event.key!=="Enter"&&event.key!==" ")return;
    const open=card.querySelector("[data-explore-open]");
    if(!open)return;
    event.preventDefault();
    openedCatalogId=String(open.dataset.exploreOpen);
    open.click();
    setTimeout(syncDetailActions,0);
  },true);

  new MutationObserver(()=>{
    decorateExploreCards();
    if(document.getElementById("useDialog")?.open)syncDetailActions();
  }).observe(list,{childList:true,subtree:true});
  decorateExploreCards();
}

document.getElementById("list")?.addEventListener("click",event=>{
  if(event.target.closest("[data-use]")){
    openedCatalogId=null;
    setTimeout(syncDetailActions,0);
  }
},true);

const useDialog=document.getElementById("useDialog");
if(useDialog){
  ensureDetailActions();
  new MutationObserver(syncDetailActions).observe(useDialog,{attributes:true,attributeFilter:["open"]});
  useDialog.addEventListener("close",()=>{openedCatalogId=null;syncDetailActions()});
}

window.addEventListener("storage",syncDetailActions);
document.addEventListener("change",event=>{
  if(event.target?.id==="pmLanguageSelect")setTimeout(syncDetailActions,0);
},true);
})();