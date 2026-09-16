/* Prompt Manager M1.7.12 — Library compact controls */
(()=>{"use strict";
const PREF_KEY="pm-library-filters-expanded";
const $=id=>document.getElementById(id);

const ICON_SEARCH=`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="5.8"></circle><path d="m15.2 15.2 4.3 4.3"></path></svg>`;
const ICON_FILTER=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"></path><path d="M7 12h10"></path><path d="M10 17h4"></path></svg>`;

function pref(){
  const v=localStorage.getItem(PREF_KEY);
  return v===null?true:v==="1";
}
function setPref(expanded){localStorage.setItem(PREF_KEY,expanded?"1":"0")}

function filterRegion(){
  const library=document.querySelector("#libraryView .library");
  if(!library)return [];
  return [
    $("libraryOriginFilters"),
    $("categoryFilters"),
    library.querySelector(".search-filter-row")
  ].filter(Boolean);
}
function applyExpanded(expanded,{persist=false}={}){
  filterRegion().forEach(el=>{
    el.hidden=!expanded;
    el.setAttribute("aria-hidden",expanded?"false":"true");
  });
  const button=$("pmLibraryFilterToggle");
  if(button){
    button.setAttribute("aria-expanded",expanded?"true":"false");
    button.dataset.active=expanded?"true":"false";
    button.title=expanded?"Collapse filters":"Expand filters";
    button.setAttribute("aria-label",button.title);
  }
  if(persist)setPref(expanded);
}
function isExpanded(){return $("pmLibraryFilterToggle")?.getAttribute("aria-expanded")!=="false"}


let quickSearchOpen=false;

function dispatchSearchInput(value){
  const input=$("search");
  if(!input)return;
  input.value=value;
  input.dispatchEvent(new Event("input",{bubbles:true}));
}

function closeQuickSearch(){
  const overlay=$("pmLibraryQuickSearchOverlay");
  if(!overlay)return;
  quickSearchOpen=false;
  dispatchSearchInput("");
  overlay.hidden=true;
  overlay.setAttribute("aria-hidden","true");
  const input=$("pmLibraryQuickSearchInput");
  if(input)input.value="";
}

function ensureQuickSearchOverlay(){
  let overlay=$("pmLibraryQuickSearchOverlay");
  if(overlay)return overlay;

  overlay=document.createElement("div");
  overlay.id="pmLibraryQuickSearchOverlay";
  overlay.className="pm-library-quick-search-overlay";
  overlay.hidden=true;
  overlay.setAttribute("aria-hidden","true");

  const box=document.createElement("div");
  box.className="pm-library-quick-search-box";
  box.innerHTML=`${ICON_SEARCH}<input id="pmLibraryQuickSearchInput" type="search" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Search prompts" aria-label="Search prompts">`;
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const input=box.querySelector("input");
  input.addEventListener("input",()=>dispatchSearchInput(input.value));
  input.addEventListener("keydown",event=>{
    if(event.key==="Escape"){
      event.preventDefault();
      input.blur();
      closeQuickSearch();
    }
  });

  overlay.addEventListener("pointerdown",event=>{
    if(event.target===overlay){
      event.preventDefault();
      input.blur();
      closeQuickSearch();
    }
  });

  return overlay;
}

function openQuickSearch(){
  const overlay=ensureQuickSearchOverlay();
  const input=$("pmLibraryQuickSearchInput");
  quickSearchOpen=true;
  dispatchSearchInput("");
  if(input)input.value="";
  overlay.hidden=false;
  overlay.setAttribute("aria-hidden","false");
  requestAnimationFrame(()=>{
    input?.focus({preventScroll:true});
  });
}

function resetTransientSearch(){
  if(quickSearchOpen)closeQuickSearch();
  else dispatchSearchInput("");
}

function build(){
  const grid=document.querySelector("#libraryView .library-title-grid");
  const add=$("libraryAdd");
  if(!grid||!add)return false;

  let actions=grid.querySelector(".pm-library-head-actions");
  if(!actions){
    actions=document.createElement("div");
    actions.className="pm-library-head-actions";
    add.parentNode.insertBefore(actions,add);
    actions.appendChild(add);
  }

  let more=actions.querySelector(".pm-library-overflow-wrap, .pm-library-more");
  if(!more){
    // product-ui.js may add this just after us; retry instead of duplicating it.
    return false;
  }
  if(more.classList.contains("pm-library-more")) more=more.parentElement||more;

  if(!$("pmLibraryFilterToggle")){
    const filter=document.createElement("button");
    filter.type="button";
    filter.id="pmLibraryFilterToggle";
    filter.className="pm-library-compact-action pm-library-filter-toggle";
    filter.innerHTML=ICON_FILTER;
    more.parentNode.insertBefore(filter,more);
    filter.addEventListener("click",()=>{
      const next=!isExpanded();
      applyExpanded(next,{persist:true});
    });
  }

  if(!$("pmLibraryQuickSearch")){
    const search=document.createElement("button");
    search.type="button";
    search.id="pmLibraryQuickSearch";
    search.className="pm-library-quick-search";
    search.innerHTML=ICON_SEARCH;
    search.setAttribute("aria-label","Search prompts");
    search.title="Search prompts";
    grid.appendChild(search);
    search.addEventListener("click",openQuickSearch);
  }

  grid.dataset.pmCompactControls="true";
  applyExpanded(pref());
  return true;
}

function init(){
  if(build())return;
  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    if(build()||attempts>40)clearInterval(timer);
  },50);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();

document.querySelectorAll("[data-nav]").forEach(button=>{
  button.addEventListener("click",()=>{
    if(button.dataset.nav!=="library")resetTransientSearch();
  });
});
window.addEventListener("pagehide",resetTransientSearch);
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="hidden")resetTransientSearch();
});

new MutationObserver(()=>{
  if(!$("pmLibraryFilterToggle")||!$("pmLibraryQuickSearch"))build();
}).observe(document.body,{childList:true,subtree:true});
})();