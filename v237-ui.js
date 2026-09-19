/* Prompt Manager V2.0.37 — canonical card overflow menus + Chain compact menu */
(()=>{"use strict";
const EDIT=`<svg viewBox="0 0 24 24"><path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>`;
const DUP=`<svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>`;
const DEL=`<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M7 7l1 13h8l1-13"/></svg>`;
const MORE=`<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>`;
function language(){const x=(localStorage.getItem("pm-language")||document.documentElement.lang||"en").toLowerCase();return x.startsWith("es")?"es":x.startsWith("sr")?"sr":"en"}
function words(){return {en:{edit:"Edit",del:"Delete",editc:"Edit chain",dup:"Duplicate chain",delc:"Delete chain",more:"More"},es:{edit:"Editar",del:"Eliminar",editc:"Editar cadena",dup:"Duplicar cadena",delc:"Eliminar cadena",more:"Más"},sr:{edit:"Uredi",del:"Obriši",editc:"Uredi lanac",dup:"Dupliraj lanac",delc:"Obriši lanac",more:"Više"}}[language()]}
function close(except){document.querySelectorAll(".pm-v237-menu:not([hidden])").forEach(m=>{if(m!==except)m.hidden=true})}
function normalCards(){
 const w=words();
 document.querySelectorAll("#list article.card:not(.pm-chain-card)").forEach(card=>{
  const id=card.dataset.use,manage=card.querySelector(".pm-card-manage");if(!id||!manage)return;
  manage.innerHTML=`<button type="button" class="pm-icon-btn pm-v237-more" aria-label="${w.more}" aria-expanded="false">${MORE}</button><div class="pm-v237-menu" hidden><button type="button" data-pm-edit="${id}">${EDIT}<span>${w.edit}</span></button><button type="button" class="danger" data-pm-delete="${id}">${DEL}<span>${w.del}</span></button></div>`;
 });
}
function chainMenus(){
 const w=words();
 document.querySelectorAll(".pm-chain-library-menu,.pm-chain-detail-menu").forEach(menu=>{
  const edit=menu.querySelector("[data-chain-edit]"),dup=menu.querySelector("[data-chain-duplicate]"),del=menu.querySelector("[data-chain-delete-v2]");
  if(edit)edit.innerHTML=EDIT+`<span>${w.editc}</span>`;
  if(dup)dup.innerHTML=DUP+`<span>${w.dup}</span>`;
  if(del)del.innerHTML=DEL+`<span>${w.delc}</span>`;
 });
}
function sync(){normalCards();chainMenus()}
document.addEventListener("click",e=>{
 const more=e.target.closest(".pm-v237-more");
 if(more){e.preventDefault();e.stopImmediatePropagation();const menu=more.nextElementSibling,opening=menu.hidden;close(menu);menu.hidden=!opening;more.setAttribute("aria-expanded",String(opening));return}
 if(!e.target.closest(".pm-v237-menu"))close();
},true);
function install(){
 if(!document.getElementById("pmV237Style")){const s=document.createElement("style");s.id="pmV237Style";s.textContent=`html.pm-starting #authGate{display:none!important}html.pm-starting #pmAuthLoading{display:flex!important}

 .pm-card-manage{position:relative!important}
 .pm-v237-more svg,.pm-v237-menu svg,.pm-chain-library-menu svg,.pm-chain-detail-menu svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
 .pm-v237-more svg circle{fill:currentColor;stroke:none}
 .pm-v237-menu{position:absolute;z-index:80;right:0;top:calc(100% + 7px);width:max-content;min-width:126px;padding:6px;border:1px solid var(--border);border-radius:14px;background:var(--surface);box-shadow:0 16px 44px rgba(0,0,0,.34)}
 .pm-v237-menu[hidden]{display:none!important}
 .pm-v237-menu button,.pm-chain-library-menu button,.pm-chain-detail-menu button{display:flex!important;align-items:center!important;gap:9px!important;white-space:nowrap!important;text-align:left!important}
 .pm-v237-menu button{width:100%;min-height:40px;padding:0 10px;border:0;border-radius:9px;background:transparent;color:var(--text);font-weight:680}
 .pm-v237-menu .danger{color:#ff746f}
 .pm-chain-card .pm-chain-library-menu,.pm-chain-detail .pm-chain-detail-menu{width:max-content!important;min-width:154px!important;max-width:190px!important;padding:6px!important}
 .pm-chain-card .pm-chain-library-menu button,.pm-chain-detail .pm-chain-detail-menu button{min-height:42px!important;padding:0 10px!important}
 `;document.head.appendChild(s)}
 sync();
 const list=document.getElementById("list");if(list)new MutationObserver(sync).observe(list,{childList:true,subtree:true});
 new MutationObserver(chainMenus).observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();