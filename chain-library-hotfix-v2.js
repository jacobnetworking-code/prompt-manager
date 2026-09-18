/* Prompt Manager V2.0.12 — Chain visibility + final empty-state hotfix */
(()=>{"use strict";
const $=id=>document.getElementById(id);
let applying=false;

function selectedType(){
 const b=$("pmTypeFilter");
 if(!b)return "all";
 const label=(b.textContent||"").trim().toLowerCase();
 if(label.startsWith("chains"))return "chains";
 if(label.startsWith("prompts"))return "prompts";
 return "all";
}
function visibleCards(){
 const list=$("list");
 if(!list)return [];
 return [...list.children].filter(el=>el.matches("article.card")&&!el.hidden&&getComputedStyle(el).display!=="none");
}
function syncEmptyState(){
 const cards=visibleCards(),empty=$("empty"),nr=$("noresults");
 if(cards.length){
   if(empty)empty.hidden=true;
   if(nr)nr.hidden=true;
   return;
 }
 let total=0;try{total=Array.isArray(prompts)?prompts.length:0}catch{}
 const chainCount=document.querySelectorAll("#list .pm-chain-card").length;
 if(empty)empty.hidden=(total+chainCount)>0;
 if(nr)nr.hidden=false;
}
function enforceType(){
 if(applying)return;applying=true;
 try{
   const type=selectedType(),list=$("list");
   if(!list)return;
   [...list.children].forEach(el=>{
     if(!el.matches("article.card"))return;
     const isChain=el.classList.contains("pm-chain-card");
     el.hidden=(type==="chains"&&!isChain)||(type==="prompts"&&isChain);
   });
   const count=$("count");if(count)count.textContent=String(visibleCards().length);
   syncEmptyState();
 }finally{applying=false}
}
function recoverChains(){
 /* chain-v2 owns cloud loading/rendering. This only asks it to rerender by
    invoking the canonical render path after authentication has settled. */
 try{if(typeof render==="function")render()}catch(e){console.warn("V2.0.12 render recovery",e)}
 setTimeout(enforceType,0);
}
function start(){
 const list=$("list");if(!list)return;
 new MutationObserver(()=>requestAnimationFrame(enforceType)).observe(list,{childList:true,subtree:false,attributes:true,attributeFilter:["hidden","class"]});
 document.addEventListener("click",e=>{
   if(e.target.closest("#pmTypeFilter,[data-type],[data-filter],[data-origin],[data-platform-filter],[data-model-filter]"))setTimeout(enforceType,0);
 },true);
 window.addEventListener("online",()=>setTimeout(recoverChains,100));
 window.addEventListener("pageshow",()=>setTimeout(recoverChains,100));
 setTimeout(recoverChains,350);
 setTimeout(recoverChains,1200);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();