/* Prompt Manager V2.0.36 — normal prompt More menu */
(()=>{"use strict";
const EDIT=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z"></path><path d="m13.5 6.5 4 4"></path></svg>`;
const TRASH=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"></path><path d="M9 7V4h6v3"></path><path d="M7 7l1 13h8l1-13"></path></svg>`;
function lang(){const x=(localStorage.getItem("pm-language")||document.documentElement.lang||"en").toLowerCase();return x.startsWith("es")?"es":x.startsWith("sr")?"sr":"en"}
function copy(){return {en:["Edit","Delete"],es:["Editar","Eliminar"],sr:["Uredi","Obriši"]}[lang()]}
function decorate(){
 const [editText,deleteText]=copy();
 document.querySelectorAll("#list article.card").forEach(card=>{
   // Chains own their action menu; only touch normal prompt cards identified by data-use.
   const id=card.getAttribute("data-use"),menu=card.querySelector(":scope > .menu");
   if(!id||!menu||card.classList.contains("pm-chain-card"))return;
   let edit=menu.querySelector("[data-pm-edit]");
   if(!edit){edit=document.createElement("button");edit.type="button";edit.dataset.pmEdit=id;menu.prepend(edit)}
   edit.innerHTML=EDIT+`<span>${editText}</span>`;
   const del=menu.querySelector("[data-delete]");
   if(del){del.classList.add("danger");del.innerHTML=TRASH+`<span>${deleteText}</span>`}
 });
}
function install(){
 if(!document.getElementById("pmV236MenuStyle")){
   const s=document.createElement("style");s.id="pmV236MenuStyle";s.textContent=`
   #list article.card>.menu{min-width:136px}
   #list article.card>.menu button[data-pm-edit],
   #list article.card>.menu button[data-delete]{width:100%;display:flex;align-items:center;gap:9px;border:0;background:transparent;text-align:left;padding:9px 10px}
   #list article.card>.menu button svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:0 0 16px}`;
   document.head.appendChild(s);
 }
 decorate();
 const list=document.getElementById("list");if(list)new MutationObserver(decorate).observe(list,{childList:true,subtree:true});
 document.addEventListener("pm:language-change",decorate);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();