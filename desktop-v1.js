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
}
function init(){
  applySidebarPreference();
  const brand=document.querySelector(".brand");
  if(brand){
    brand.setAttribute("role","button");
    brand.setAttribute("tabindex","0");
    brand.setAttribute("aria-label","Toggle sidebar");
    brand.addEventListener("click",toggleSidebar);
    brand.addEventListener("keydown",e=>{
      if(e.key==="Enter"||e.key===" "){e.preventDefault();toggleSidebar();}
    });
  }
}
mq.addEventListener?.("change",applySidebarPreference);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();