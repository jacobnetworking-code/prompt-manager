/* Prompt Manager M1.7.12.7 — Library search viewport */
(()=>{"use strict";
const PREF_KEY="pm-library-filters-expanded";
const $=id=>document.getElementById(id);
const ICON_SEARCH=`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="5.8"></circle><path d="m15.2 15.2 4.3 4.3"></path></svg>`;
const ICON_FILTER=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"></path><path d="M7 12h10"></path><path d="M10 17h4"></path></svg>`;

const metadataModels=p=>{
  if(window.pmModelSupport?.modelsOf)return window.pmModelSupport.modelsOf(p)||[];
  return Array.isArray(p?.models)?p.models.filter(Boolean):[];
};
const metadataModelName=value=>String(value).toLowerCase()==="multimodel"?"Multimodel":String(value);

function renderPromptMetadata(target,prompt){
  if(!target||!prompt)return;
  const category=typeof catName==="function"&&typeof categoryId==="function"?catName(categoryId(prompt)):"General";
  const platforms=typeof platformsOf==="function"?platformsOf(prompt):["general"];
  const models=metadataModels(prompt);
  const safe=typeof esc==="function"?esc:(v=>String(v));
  target.innerHTML=
    `<span class="categorybadge">${safe(category)}</span>`+
    platforms.map(id=>`<span class="platformbadge">${safe(typeof platformName==="function"?platformName(id):id)}</span>`).join("")+
    models.map(model=>`<span class="modelbadge">${safe(metadataModelName(model))}</span>`).join("");
}

function renderAllLibraryMetadata(){
  document.querySelectorAll("#list .card[data-use]").forEach(card=>{
    const prompt=(typeof prompts!=="undefined"?prompts:[]).find(p=>String(p.id)===String(card.dataset.use));
    renderPromptMetadata(card.querySelector(".badges"),prompt);
  });
}

function installCanonicalMetadataRenderer(){
  if(typeof render==="function"&&!render.pmCanonicalMetadata){
    const base=render;
    const wrapped=function(){base.apply(this,arguments);renderAllLibraryMetadata()};
    wrapped.pmCanonicalMetadata=true;
    render=wrapped;
  }
  if(typeof openUse==="function"&&!openUse.pmCanonicalMetadata){
    const baseOpen=openUse;
    const wrappedOpen=function(prompt){
      baseOpen.apply(this,arguments);
      renderPromptMetadata($("useBadges"),prompt);
    };
    wrappedOpen.pmCanonicalMetadata=true;
    openUse=wrappedOpen;
  }
  renderAllLibraryMetadata();
}

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

function installSearchViewport(){
  const view=$("libraryView"),canonical=$("search");
  if(!view||!canonical)return;
  canonical.addEventListener("focus",()=>view.classList.add("pm-library-filter-searching"));
  canonical.addEventListener("blur",()=>view.classList.remove("pm-library-filter-searching"));
}

function init(){
  installCanonicalMetadataRenderer();
  installSearchViewport();
  if(!build()){
    let n=0,t=setInterval(()=>{if(build()||++n>40)clearInterval(t)},50);
  }
  document.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",()=>{
    if(b.dataset.nav!=="library")resetTransientSearch();
  }));
  window.addEventListener("pagehide",resetTransientSearch);
  document.addEventListener("pointerdown",e=>{
    const overlay=$("pmLibraryQuickSearchOverlay");
    if(!overlay||overlay.dataset.open!=="true")return;
    if(e.target.closest?.(".pm-library-quick-search-box,#pmLibraryQuickSearch"))return;
    closeQuickSearch();
  },true);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();

new MutationObserver(()=>{if(!$("pmLibraryFilterToggle")||!$("pmLibraryQuickSearch"))build()})
.observe(document.body,{childList:true,subtree:true});
})();

/* ===== V2.0 — What's New inline timeline ===== */
(()=>{
"use strict";

const RELEASES={
 en:[
  ["V2.0","Prompt Chains",["Create multi-prompt workflows and keep them together as one Chain in your Library.","Build Chains from new prompts or reuse prompts already saved in your Library.","Expand a Chain inline and copy each prompt individually as you work through it."]],
  ["V1.9","What's New History",["A complete history of Prompt Manager's meaningful product updates.","A cleaner release view focused only on changes you can actually use."]],
  ["V1.8","Bigger Prompt Catalog",["Explore 750+ curated prompts from multiple sources.","Stronger Platform + Model support across Library and prompt editing.","Model labels now appear directly on prompt cards.","Improved visual and video Featured prompts."]],
  ["V1.7","Smarter Library",["Bulk import prompts from CSV or JSON, with preview, validation and duplicate detection.","Platform and Model filters, Quick Search, categories and origin filters.","A unified + flow for adding or importing prompts.","Improved startup, loading and Library synchronization."]],
  ["V1.6","Explore & Featured",["Discover prompts through Explore and curated Featured picks.","Save prompts to Library or share Explore prompts directly.","Faster prompt-detail Save and Share actions.","A redesigned desktop experience with compact sidebar navigation and better offline feedback."]],
  ["V1.5","Share Prompts",["Share prompts through public links.","Public prompt pages protect the hidden prompt content while still making shared prompts discoverable."]],
  ["V1.4","Personal Library",["A dedicated Library for saving and organizing prompts.","Categories, search and filters make prompts easier to find.","Personal 1–5 star ratings and faster prompt actions."]],
  ["V1.3","Cloud Sync",["Personal accounts and cloud-backed Library synchronization.","Access your prompt collection across supported devices."]],
  ["V1.2","Backup & Restore",["Export a backup of your prompt collection.","Restore your Library from a compatible backup."]],
  ["V1.1","Prompt Manager Foundations",["Create, save and organize prompts.","Copy prompts quickly for use in your AI tools."]],
  ["V1.0","Prompt Manager",["The first functional Prompt Manager experience.","A dedicated place to save, organize, find and reuse prompts worth keeping."]]
 ],
 es:[
  ["V2.0","Cadenas de prompts",["Crea flujos de varios prompts y guárdalos juntos como una sola Cadena en tu Biblioteca.","Crea Cadenas con prompts nuevos o reutiliza prompts que ya tengas guardados en tu Biblioteca.","Despliega una Cadena dentro de la Biblioteca y copia cada prompt individualmente a medida que avanzas."]],
  ["V1.9","Historial de novedades",["Historial completo de las actualizaciones relevantes de Prompt Manager.","Una vista más limpia centrada únicamente en cambios que realmente puedes utilizar."]],
  ["V1.8","Un catálogo de prompts mucho mayor",["Explora más de 750 prompts seleccionados de múltiples fuentes.","Mejor soporte de Plataforma + Modelo en Biblioteca y edición de prompts.","Los modelos aparecen directamente en las fichas de prompts.","Mejor experiencia con prompts visuales y vídeo en Featured."]],
  ["V1.7","Una Biblioteca más inteligente",["Importación masiva desde CSV o JSON con preview, validación y detección de duplicados.","Filtros de Plataforma y Modelo, búsqueda rápida, categorías y filtros por origen.","Flujo + unificado para añadir o importar prompts.","Mejor carga inicial y sincronización de la Biblioteca."]],
  ["V1.6","Explore y Featured",["Descubre prompts mediante Explore y una selección editorial Featured.","Guarda prompts en Biblioteca o comparte prompts de Explore directamente.","Acciones rápidas Guardar y Compartir en el detalle del prompt.","Experiencia desktop rediseñada con navegación lateral compacta y mejor estado offline."]],
  ["V1.5","Compartir prompts",["Comparte prompts mediante enlaces públicos.","Las páginas públicas protegen el contenido oculto del prompt mientras permiten descubrirlo."]],
  ["V1.4","Biblioteca personal",["Una Biblioteca dedicada para guardar y organizar prompts.","Categorías, búsqueda y filtros para encontrarlos más rápido.","Valoración personal de 1–5 estrellas y acciones rápidas."]],
  ["V1.3","Sincronización en la nube",["Cuentas personales y sincronización de la Biblioteca en la nube.","Acceso a tu colección de prompts desde dispositivos compatibles."]],
  ["V1.2","Backup y restauración",["Exporta una copia de seguridad de tu colección.","Restaura tu Biblioteca desde un backup compatible."]],
  ["V1.1","Fundamentos de Prompt Manager",["Crea, guarda y organiza prompts.","Copia prompts rápidamente para utilizarlos en tus herramientas de IA."]],
  ["V1.0","Prompt Manager",["Primera experiencia funcional de Prompt Manager.","Un lugar dedicado para guardar, organizar, encontrar y reutilizar prompts que merece la pena conservar."]]
 ],
 sr:[
  ["V2.0","Lanci promptova",["Kreiraj tokove od više promptova i čuvaj ih zajedno kao jedan Lanac u Biblioteci.","Kreiraj Lance od novih promptova ili ponovo koristi promptove koji su već sačuvani u Biblioteci.","Proširi Lanac direktno u Biblioteci i kopiraj svaki prompt pojedinačno dok prolaziš kroz njega."]],
  ["V1.9","Istorija novosti",["Kompletna istorija važnih ažuriranja Prompt Manager-a.","Čistiji pregled izdanja fokusiran samo na promene koje zaista možeš da koristiš."]],
  ["V1.8","Mnogo veći katalog promptova",["Istraži više od 750 odabranih promptova iz više izvora.","Bolja podrška za Platformu + Model u Biblioteci i uređivanju promptova.","Oznake modela se prikazuju direktno na karticama promptova.","Poboljšani vizuelni i video Featured promptovi."]],
  ["V1.7","Pametnija Biblioteka",["Masovni uvoz iz CSV ili JSON fajlova sa pregledom, proverom i detekcijom duplikata.","Filteri Platforme i Modela, brza pretraga, kategorije i filteri porekla.","Jedinstveni + tok za dodavanje ili uvoz promptova.","Bolje početno učitavanje i sinhronizacija Biblioteke."]],
  ["V1.6","Explore i Featured",["Otkrivaj promptove kroz Explore i odabrane Featured predloge.","Sačuvaj promptove u Biblioteku ili ih direktno podeli iz Explore-a.","Brže Save i Share akcije u detaljima prompta.","Redizajnirano desktop iskustvo sa kompaktnom bočnom navigacijom i boljim offline statusom."]],
  ["V1.5","Deljenje promptova",["Deli promptove putem javnih linkova.","Javne stranice štite skriveni sadržaj prompta dok ga čine dostupnim za otkrivanje."]],
  ["V1.4","Lična Biblioteka",["Posebna Biblioteka za čuvanje i organizovanje promptova.","Kategorije, pretraga i filteri za brže pronalaženje.","Lična ocena od 1–5 zvezdica i brže akcije."]],
  ["V1.3","Cloud sinhronizacija",["Lični nalozi i cloud sinhronizacija Biblioteke.","Pristup kolekciji promptova sa podržanih uređaja."]],
  ["V1.2","Backup i vraćanje",["Izvezi rezervnu kopiju svoje kolekcije.","Vrati Biblioteku iz kompatibilnog backup-a."]],
  ["V1.1","Osnove Prompt Manager-a",["Kreiraj, sačuvaj i organizuj promptove.","Brzo kopiraj promptove za korišćenje u AI alatima."]],
  ["V1.0","Prompt Manager",["Prva funkcionalna verzija Prompt Manager-a.","Posebno mesto za čuvanje, organizovanje, pronalaženje i ponovno korišćenje vrednih promptova."]]
 ]
};

function wnLang(){
 const raw=(localStorage.getItem("pm-language")||document.documentElement.lang||"en").toLowerCase();
 return raw.startsWith("es")?"es":raw.startsWith("sr")?"sr":"en";
}
function wnCopy(){
 return {
  en:{kicker:"WHAT'S NEW",show:"View update history",hide:"Hide update history",current:"CURRENT"},
  es:{kicker:"NOVEDADES",show:"Ver historial de novedades",hide:"Ocultar historial de novedades",current:"ACTUAL"},
  sr:{kicker:"NOVO",show:"Prikaži istoriju novosti",hide:"Sakrij istoriju novosti",current:"TRENUTNO"}
 }[wnLang()];
}
function timelineMarkup(){
 const c=wnCopy();
 return `<div class="pm-whats-timeline">${RELEASES[wnLang()].map(([version,title,points],i)=>`
  <article class="pm-whats-release${i===0?" is-current":""}">
   <div class="pm-whats-node" aria-hidden="true"></div>
   <div class="pm-whats-release-version">${version}${i===0?`<span>${c.current}</span>`:""}</div>
   <div class="pm-whats-release-body"><h3>${title}</h3><ul>${points.map(p=>`<li>${p}</li>`).join("")}</ul></div>
  </article>`).join("")}</div>`;
}
function upgradeWhatsNewCard(){
 const card=document.querySelector(".pm-whats-new,.pm-whats-history-card");
 if(!card)return;
 card.classList.remove("pm-whats-new");
 card.classList.add("pm-whats-history-card");
 card.removeAttribute("role");
 card.removeAttribute("tabindex");
 card.removeAttribute("aria-label");
 const c=wnCopy(),first=RELEASES[wnLang()][0];
 card.innerHTML=`<div class="pm-whats-history-card-top"><span>${c.kicker}</span></div>
  <div class="pm-whats-title-row"><b>${first[0]}</b><h3>${first[1]}</h3></div>
  <p>${first[2][0]}</p>
  <button type="button" class="pm-whats-expand" aria-expanded="false">
   <span>${c.show}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5"></path></svg>
  </button>
  <div class="pm-whats-inline-history" hidden>${timelineMarkup()}</div>`;
 const toggle=card.querySelector(".pm-whats-expand");
 const history=card.querySelector(".pm-whats-inline-history");
 toggle.addEventListener("click",()=>{
  const open=toggle.getAttribute("aria-expanded")!=="true";
  toggle.setAttribute("aria-expanded",String(open));
  toggle.querySelector("span").textContent=open?c.hide:c.show;
  history.hidden=!open;
 });
}
function syncWhatsHistory(){upgradeWhatsNewCard()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",syncWhatsHistory,{once:true});else syncWhatsHistory();
document.addEventListener("change",e=>{if(e.target?.id==="pmLanguageSelect")setTimeout(syncWhatsHistory,0)},true);
window.addEventListener("storage",syncWhatsHistory);
})();
