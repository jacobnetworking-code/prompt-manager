/* Prompt Manager M1.7.12.6 — Library compact controls */
(()=>{"use strict";
const PREF_KEY="pm-library-filters-expanded";
const $=id=>document.getElementById(id);
const ICON_SEARCH=`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="5.8"></circle><path d="m15.2 15.2 4.3 4.3"></path></svg>`;
const ICON_FILTER=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"></path><path d="M7 12h10"></path><path d="M10 17h4"></path></svg>`;

function pref(){const v=localStorage.getItem(PREF_KEY);return v===null?true:v==="1"}
function setPref(v){localStorage.setItem(PREF_KEY,v?"1":"0")}
function filterRegion(){
  const library=document.querySelector("#libraryView .library");
  return library?[$("libraryOriginFilters"),$("categoryFilters"),library.querySelector(".search-filter-row")].filter(Boolean):[];
}
function applyExpanded(expanded,{persist=false}={}){
  filterRegion().forEach(el=>{el.hidden=!expanded;el.setAttribute("aria-hidden",String(!expanded))});
  const b=$("pmLibraryFilterToggle");
  if(b){
    b.setAttribute("aria-expanded",String(expanded));
    b.dataset.active=String(expanded);
    b.title=expanded?"Collapse filters":"Expand filters";
    b.setAttribute("aria-label",b.title);
  }
  if(persist)setPref(expanded);
}
function isExpanded(){return $("pmLibraryFilterToggle")?.getAttribute("aria-expanded")!=="false"}

function applyLibraryQuery(value){
  const canonical=$("search");
  if(!canonical)return;
  canonical.value=value;
  canonical.dispatchEvent(new Event("input",{bubbles:true}));
}

function ensureQuickSearch(){
  let overlay=$("pmLibraryQuickSearchOverlay");
  if(overlay)return overlay;
  overlay=document.createElement("div");
  overlay.id="pmLibraryQuickSearchOverlay";
  overlay.className="pm-library-quick-search-overlay";
  overlay.hidden=true;
  overlay.setAttribute("aria-hidden","true");
  overlay.innerHTML=`<div class="pm-library-quick-search-box" role="search">${ICON_SEARCH}<input id="pmLibraryQuickSearchInput" type="search" enterkeyhint="search" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" placeholder="Search prompts" aria-label="Search prompts"></div>`;
  document.body.appendChild(overlay);
  const input=$("pmLibraryQuickSearchInput");
  input.addEventListener("input",()=>applyLibraryQuery(input.value));
  input.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();closeQuickSearch()}});
  input.addEventListener("blur",()=>{
    setTimeout(()=>{if(overlay.dataset.open==="true"&&document.activeElement!==input)closeQuickSearch()},0);
  });
  overlay.addEventListener("pointerdown",e=>{if(e.target===overlay){e.preventDefault();closeQuickSearch()}});
  return overlay;
}
function openQuickSearch(){
  const overlay=ensureQuickSearch();
  const input=$("pmLibraryQuickSearchInput");
  applyLibraryQuery("");
  input.value="";
  overlay.hidden=false;
  overlay.dataset.open="true";
  overlay.setAttribute("aria-hidden","false");
  input.focus({preventScroll:true});
  input.setSelectionRange(0,0);
}
function closeQuickSearch(){
  const overlay=$("pmLibraryQuickSearchOverlay");
  if(!overlay)return;
  overlay.dataset.open="false";
  const input=$("pmLibraryQuickSearchInput");
  if(input){input.value="";if(document.activeElement===input)input.blur()}
  applyLibraryQuery("");
  overlay.hidden=true;
  overlay.setAttribute("aria-hidden","true");
}
function resetTransientSearch(){closeQuickSearch()}

function build(){
  const grid=document.querySelector("#libraryView .library-title-grid");
  const add=$("libraryAdd"),count=$("count");
  if(!grid||!add||!count)return false;

  let actions=grid.querySelector(".pm-library-head-actions");
  if(!actions){
    actions=document.createElement("div");
    actions.className="pm-library-head-actions";
    add.parentNode.insertBefore(actions,add);
    actions.appendChild(add);
  }
  let more=actions.querySelector(".pm-library-overflow-wrap, .pm-library-more");
  if(!more)return false;
  if(more.classList.contains("pm-library-more"))more=more.parentElement||more;

  if(!$("pmLibraryFilterToggle")){
    const b=document.createElement("button");
    b.type="button";b.id="pmLibraryFilterToggle";
    b.className="pm-library-compact-action pm-library-filter-toggle";
    b.innerHTML=ICON_FILTER;
    more.parentNode.insertBefore(b,more);
    b.addEventListener("click",()=>applyExpanded(!isExpanded(),{persist:true}));
  }

  let upper=grid.querySelector(".pm-library-upper-actions");
  if(!upper){
    upper=document.createElement("div");
    upper.className="pm-library-upper-actions";
    grid.appendChild(upper);
  }
  if(!$("pmLibraryQuickSearch")){
    const b=document.createElement("button");
    b.type="button";b.id="pmLibraryQuickSearch";b.className="pm-library-quick-search";
    b.innerHTML=ICON_SEARCH;b.setAttribute("aria-label","Search prompts");b.title="Search prompts";
    upper.appendChild(b);
    b.addEventListener("click",openQuickSearch);
  }
  if(count.parentElement!==upper)upper.appendChild(count);

  ensureQuickSearch();
  grid.dataset.pmCompactControls="true";
  applyExpanded(pref());
  return true;
}

function init(){
  if(!build()){
    let n=0,t=setInterval(()=>{if(build()||++n>40)clearInterval(t)},50);
  }
  document.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",()=>{
    if(b.dataset.nav!=="library")resetTransientSearch();
  }));
  window.addEventListener("pagehide",resetTransientSearch);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();

new MutationObserver(()=>{if(!$("pmLibraryFilterToggle")||!$("pmLibraryQuickSearch"))build()})
.observe(document.body,{childList:true,subtree:true});
})();