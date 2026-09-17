/* Prompt Manager V1.8.1 — multilingual catalog + shared card metadata.
   Loaded last through library-controls.js bundle. No descendant MutationObservers. */
(()=>{"use strict";
const q=id=>document.getElementById(id);
const style=document.createElement("style");style.textContent=`.pm-translation-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:10px 0 4px}.pm-translation-row button{border:0;background:transparent;color:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer;font:inherit;font-size:12px}.explore-card .badges{display:flex;flex-wrap:wrap;gap:6px}`;document.head.appendChild(style);
const LANGUAGE_NAMES={en:{en:"English",es:"Inglés",sr:"Engleski"},es:{en:"Spanish",es:"Español",sr:"Španski"},sr:{en:"Serbian",es:"Serbio",sr:"Srpski"}};
let catalogI18n=null;
let loadingI18n=null;
const uiLang=()=>{const x=localStorage.getItem("pm-language")||document.documentElement.lang||"en";return ["en","es","sr"].includes(x)?x:"en"};
const labels=()=>uiLang()==="es"?{view:"Ver prompt",save:"Guardar en Biblioteca",saved:"✓ Guardado",original:"Idioma original",viewOriginal:"Ver original",translated:"Traducción",prompts:"prompts"}:uiLang()==="sr"?{view:"Pogledaj prompt",save:"Sačuvaj u Biblioteku",saved:"✓ Sačuvano",original:"Originalni jezik",viewOriginal:"Prikaži original",translated:"Prevod",prompts:"promptova"}:{view:"View prompt",save:"Save to Library",saved:"✓ Saved",original:"Original language",viewOriginal:"View original",translated:"Translation",prompts:"prompts"};

async function ensureCatalogAndTranslations(){
  if(uiLang()==="en")return;
  if(catalogI18n)return;
  if(loadingI18n)return loadingI18n;
  loadingI18n=(async()=>{
    if(typeof catalog!=="undefined"&&!catalog.length){
      const r=await fetch("./catalog.json");if(r.ok){const d=await r.json();catalog=Array.isArray(d.prompts)?d.prompts:[]}
    }
    const r=await fetch("./catalog-i18n.json");
    if(!r.ok)throw new Error("Translations unavailable");
    catalogI18n=await r.json();
  })().finally(()=>loadingI18n=null);
  return loadingI18n;
}
function translationFor(id,lang=uiLang()){return lang==="en"?null:catalogI18n?.translations?.[String(id)]?.[lang]||null}
function localizedCatalog(x){
  if(!x)return x;const t=translationFor(x.id);return t?{...x,title:t.title||x.title,prompt:t.prompt||x.prompt,_translated:true,_originalTitle:x.title,_originalPrompt:x.prompt,_originalLanguage:catalogI18n?.translations?.[String(x.id)]?.original_language||"en"}:x;
}
function catalogById(id){return typeof catalog!=="undefined"?(catalog||[]).find(x=>String(x.id)===String(id)):null}
function modelsFor(x){return window.pmModelSupport?.modelsOf?.(x)||[]}
function metadataBadges(x){
  const platform=String(x?.platform||"general");
  const pName=typeof platformName==="function"?platformName(platform):(platform==="general"?"Multiplatform":platform);
  const models=modelsFor(x);
  return `<span class="categorybadge">${esc(x?.category||"General")}</span><span class="platformbadge">${esc(pName)}</span>${models.map(m=>`<span class="modelbadge">${esc(String(m).toLowerCase()==="multimodel"?"Multimodel":m)}</span>`).join("")}`;
}

/* Catalog identity is source-independent. */
if(typeof catalogSaved==="function")catalogSaved=function(x){return prompts.some(p=>p.acquisitionType==="catalog"&&String(p.externalId)===String(x.id))};

/* Save original as source of truth; retain real provenance and catalog identity. */
if(typeof saveCatalog==="function")saveCatalog=async function(x){
  if(!x||catalogSaved(x))return;
  const item={title:x.title,content:x.prompt,source:x.source_url||"",categoryId:categories.some(c=>c.id===slug(x.category))?slug(x.category):"general",createdAt:Date.now(),platforms:[x.platform||"general"],models:modelsFor(x),useCount:0,lastUsedAt:null,acquisitionType:"catalog",sourceName:x.source||"Explore",externalId:String(x.id)};
  await add("prompts",item);await refresh();renderExplore();toast(labels().saved.replace("✓ ",""));
};

/* Explore and Library now use the same Category / Platform / Model metadata grammar. */
if(typeof filteredCatalog==="function")filteredCatalog=function(){
  const needle=q("exploreSearch")?.value.trim().toLowerCase()||"";
  return (catalog||[]).filter(raw=>{const x=localizedCatalog(raw);return(!exploreCategory||raw.category===exploreCategory)&&(!needle||String(x.title||"").toLowerCase().includes(needle)||String(x.prompt||"").toLowerCase().includes(needle)||String(raw.category||"").toLowerCase().includes(needle))});
};
if(typeof renderExplore==="function")renderExplore=function(){
  renderExploreCategories();const xs=filteredCatalog(),show=!!exploreCategory||!!q("exploreSearch")?.value.trim(),L=labels();
  q("exploreResultsHead").hidden=!exploreCategory;q("exploreResultsHead").style.display=exploreCategory?"flex":"none";q("exploreResultsTitle").textContent=exploreCategory||"";q("exploreStatus").textContent=show?`${xs.length} ${L.prompts}`:"";
  q("exploreList").innerHTML=show?xs.map(raw=>{const x=localizedCatalog(raw),saved=catalogSaved(raw);return `<article class="explore-card"><div class="badges">${metadataBadges(raw)}</div><h4>${esc(x.title)}</h4><div class="preview">${esc(x.prompt.length>360?x.prompt.slice(0,360)+"…":x.prompt)}</div><div class="actions"><button data-explore-open="${esc(raw.id)}">${L.view}</button>${saved?`<span class="saved-label">${L.saved}</span>`:`<button class="save" data-explore-save="${esc(raw.id)}">${L.save}</button>`}</div></article>`}).join(""):"";
  if(show&&!xs.length)q("exploreList").innerHTML=`<div class="empty compact"><strong>No prompts found</strong><span>Try another search or category.</span></div>`;
};
if(typeof loadExplore==="function")loadExplore=async function(){try{const r=await fetch("./catalog.json");if(!r.ok)throw 0;const d=await r.json();catalog=Array.isArray(d.prompts)?d.prompts:[];await ensureCatalogAndTranslations().catch(()=>{});renderExplore()}catch{q("exploreStatus").textContent="Catalog unavailable offline until this update has loaded once."}};

function decorateLibraryTranslations(){
  if(uiLang()==="en"||!catalogI18n)return;
  document.querySelectorAll("#list .card[data-use]").forEach(card=>{
    const p=(prompts||[]).find(x=>String(x.id)===String(card.dataset.use));if(!p||p.acquisitionType!=="catalog"||!p.externalId)return;
    const raw=catalogById(p.externalId),x=localizedCatalog(raw);if(!x||!x._translated)return;
    const h=card.querySelector("h4"),preview=card.querySelector(".preview");if(h)h.textContent=x.title;if(preview)preview.textContent=x.prompt.length>320?x.prompt.slice(0,320)+"…":x.prompt;
  });
}
if(typeof render==="function"){const base=render;render=function(){base();decorateLibraryTranslations()}}

/* Detail uses translated copy, but original remains one tap away. */
if(typeof openUse==="function"){
  const base=openUse;
  openUse=function(p){
    let display=p,raw=null;
    if(p?.acquisitionType==="catalog"&&p.externalId)raw=catalogById(p.externalId);
    else if(p?._catalogId)raw=catalogById(p._catalogId);
    const loc=localizedCatalog(raw);
    if(loc?._translated)display={...p,title:loc.title,content:loc.prompt};
    base(display);
    const badges=q("useBadges");if(raw&&badges)badges.innerHTML=metadataBadges(raw);
    const ready=q("readyPrompt");if(!ready||!loc?._translated)return;
    const L=labels(),lang=loc._originalLanguage||"en",name=LANGUAGE_NAMES[lang]?.[uiLang()]||lang.toUpperCase();
    const row=document.createElement("div");row.className="pm-translation-row";row.innerHTML=`<span class="sourcebadge">${esc(L.original)} · ${esc(name)}</span><button type="button" class="pm-view-original">${esc(L.viewOriginal)}</button>`;badges?.after(row);
    let translated=true;
    row.querySelector("button").onclick=()=>{translated=!translated;display.content=translated?loc.prompt:loc._originalPrompt;display.title=translated?loc.title:loc._originalTitle;q("useTitle").textContent=display.title;currentPrompt=display;updateReady();row.querySelector("button").textContent=translated?L.viewOriginal:L.translated};
  };
}

/* Explore opens with catalog identity so detail translation + metadata are shared. */
q("exploreList")?.addEventListener("click",e=>{
  const b=e.target.closest("[data-explore-open]");if(!b)return;
  const raw=catalogById(b.dataset.exploreOpen);if(!raw)return;
  e.preventDefault();e.stopImmediatePropagation();
  const temp={title:raw.title,content:raw.prompt,categoryId:slug(raw.category||"General"),platforms:[raw.platform||"general"],models:modelsFor(raw),useCount:0,source:"",_catalogId:String(raw.id)};openUse(temp);
},true);

async function init(){
  if(uiLang()!=="en"){
    try{await ensureCatalogAndTranslations();if(typeof render==="function")render();if(typeof renderExplore==="function"&&!q("exploreView")?.hidden)renderExplore()}catch(err){console.warn("Static translations unavailable",err)}
  }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>void init(),{once:true});else void init();
})();
