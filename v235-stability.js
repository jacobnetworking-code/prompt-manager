/* Prompt Manager V2.0.35 — stability + prompt-card polish */
(()=>{"use strict";
const ICON_EDIT=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z"></path><path d="m13.5 6.5 4 4"></path></svg>`;
const ICON_TRASH=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"></path><path d="M9 7V4h6v3"></path><path d="M7 7l1 13h8l1-13"></path></svg>`;
const ROUTE_KEY="pm-v235-return-view";

function lang(){
 const x=(localStorage.getItem("pm-language")||document.documentElement.lang||"en").toLowerCase();
 return x.startsWith("es")?"es":x.startsWith("sr")?"sr":"en";
}
function labels(){
 return {
  en:{edit:"Edit",del:"Delete"},
  es:{edit:"Editar",del:"Eliminar"},
  sr:{edit:"Uredi",del:"Obriši"}
 }[lang()];
}
function styleOnce(){
 if(document.getElementById("pmV235Styles"))return;
 const s=document.createElement("style");s.id="pmV235Styles";
 s.textContent=`
 #list .card:not(.pm-chain-card)>.menu{min-width:132px;padding:5px}
 #list .card:not(.pm-chain-card)>.menu button{width:100%;display:flex;align-items:center;gap:9px;border:0;background:transparent;text-align:left;padding:9px 10px}
 #list .card:not(.pm-chain-card)>.menu button svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:0 0 16px}
 #list .card:not(.pm-chain-card)>.menu .danger{color:var(--danger)}
 `;
 document.head.appendChild(s);
}
function polishPromptMenus(){
 const t=labels();
 document.querySelectorAll("#list .card:not(.pm-chain-card)").forEach(card=>{
   const menu=card.querySelector(":scope > .menu");if(!menu)return;
   const id=card.dataset.use;if(!id)return;
   let edit=menu.querySelector("[data-pm-edit]");
   if(!edit){
     edit=document.createElement("button");
     edit.type="button";edit.dataset.pmEdit=id;
     menu.insertBefore(edit,menu.firstChild);
   }
   edit.innerHTML=`${ICON_EDIT}<span>${t.edit}</span>`;
   const del=menu.querySelector("[data-delete]");
   if(del)del.innerHTML=`${ICON_TRASH}<span>${t.del}</span>`;
 });
}
function returnToLibrary(){
 const nav=document.querySelector('[data-nav="library"]');
 if(!nav)return false;
 nav.click();
 return true;
}
function restoreRoute(){
 if(sessionStorage.getItem(ROUTE_KEY)!=="library")return;
 sessionStorage.removeItem(ROUTE_KEY);
 let tries=0;
 const timer=setInterval(()=>{
   tries++;
   if(returnToLibrary()||tries>=30)clearInterval(timer);
 },50);
}
function watchChainEditSave(){
 document.addEventListener("submit",e=>{
   if(!e.target.closest("#pmChainEditV2"))return;
   sessionStorage.setItem(ROUTE_KEY,"library");
   // If the cloud save fails there is no reload; don't leave stale routing state forever.
   setTimeout(()=>sessionStorage.removeItem(ROUTE_KEY),20000);
 },true);
}
function start(){
 styleOnce();
 polishPromptMenus();
 restoreRoute();
 watchChainEditSave();
 const list=document.getElementById("list");
 if(list)new MutationObserver(()=>polishPromptMenus()).observe(list,{childList:true,subtree:true});
 document.addEventListener("pm:language-change",polishPromptMenus);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();