/* Prompt Manager M1.7.11 — multi-model metadata, filtering and manual editing */
(()=>{"use strict";
const q=id=>document.getElementById(id);
let activeModel="any";
let editingId=null;

function cleanModel(value){return String(value??"").trim().replace(/\s+/g," ").slice(0,60)}
function modelsOfPrompt(p){
  if(!Array.isArray(p?.models))return [];
  const seen=new Set,out=[];
  for(const raw of p.models){const v=cleanModel(raw);if(!v)continue;const k=v.toLowerCase();if(seen.has(k))continue;seen.add(k);out.push(k==="multimodel"?"multimodel":v)}
  return out;
}
function parseModels(value){
  const raw=String(value??"").split(",").map(cleanModel).filter(Boolean);
  if(raw.some(x=>x.toLowerCase()==="multimodel"))return ["multimodel"];
  const seen=new Set,out=[];
  for(const v of raw){const k=v.toLowerCase();if(seen.has(k))continue;seen.add(k);out.push(v);if(out.length===20)break}
  return out;
}
function displayModel(v){return String(v).toLowerCase()==="multimodel"?"Multimodel":v}
function availableModels(){
  const map=new Map;
  const add=value=>{const v=cleanModel(value);if(!v)return;const k=v.toLowerCase();if(!map.has(k))map.set(k,k==="multimodel"?"multimodel":v)};
  if(activePlatform==="any"){
    for(const values of Object.values(window.PM_MODEL_REGISTRY||{}))for(const m of values)add(m);
  }else{
    for(const m of (window.PM_MODEL_REGISTRY?.[activePlatform]||[]))add(m);
  }
  for(const p of prompts||[]){
    if(activePlatform!=="any"&&!platformsOf(p).includes(activePlatform))continue;
    for(const m of modelsOfPrompt(p))add(m);
  }
  return [...map.values()];
}
function resetLibraryFilters(){
  activeCategory="all"; activePlatform="any"; activeOrigin="all"; activeModel="any";
  const search=q("search"); if(search)search.value="";
  document.querySelectorAll("[data-origin]").forEach(x=>x.classList.toggle("selected",x.dataset.origin==="all"));
  if(typeof render==="function")render();
}
function modelCompatibleWithPlatform(model,platform){
  if(!model||model==="any"||platform==="any")return true;
  return (prompts||[]).some(p=>platformsOf(p).includes(platform)&&modelsOfPrompt(p).some(m=>m.toLowerCase()===model.toLowerCase()));
}
function modelMatches(p){return activeModel==="any"||modelsOfPrompt(p).some(x=>x.toLowerCase()===activeModel.toLowerCase())}
function modelBadges(p){return modelsOfPrompt(p).map(x=>`<span class="modelbadge">${esc(displayModel(x))}</span>`).join("")}

/* Cloud persistence: additive `models text[]` column introduced by M1.7.11 SQL. */
if(typeof toCloudPrompt==="function"){
  const base=toCloudPrompt;
  toCloudPrompt=function(p){return {...base(p),models:modelsOfPrompt(p)}};
}
if(typeof fromCloudPrompt==="function"){
  const base=fromCloudPrompt;
  fromCloudPrompt=function(r){return {...base(r),models:Array.isArray(r?.models)?r.models.filter(Boolean):[]}};
}

/* Model is an independent Library filter. Keep existing origin/category/platform semantics. */
if(typeof filtered==="function"){
  const base=filtered;
  filtered=function(){return base().filter(modelMatches)};
}
if(typeof renderFilters==="function"){
  const base=renderFilters;
  renderFilters=function(){
    base();
    const pb=q("platformFilterButton"),mb=q("modelFilterButton");
    if(pb)pb.textContent=(activePlatform==="any"?"Platform":platformName(activePlatform))+" ▾";
    if(mb)mb.textContent=(activeModel==="any"?"Model":displayModel(activeModel))+" ▾";
  };
}

function decorateCards(){
  document.querySelectorAll("#list .card[data-use]").forEach(card=>{
    const p=(prompts||[]).find(x=>String(x.id)===String(card.dataset.use));
    const badges=card.querySelector(".badges");
    if(!p||!badges)return;
    badges.querySelectorAll(".modelbadge").forEach(x=>x.remove());
    badges.insertAdjacentHTML("beforeend",modelBadges(p));
    const menu=card.querySelector(".menu");
    if(menu&&!menu.querySelector("[data-model-edit]")){
      const b=document.createElement("button");b.type="button";b.dataset.modelEdit=String(p.id);b.textContent="Edit prompt";menu.prepend(b);
    }
  });
}
if(typeof render==="function"){
  const base=render;
  render=function(){base();decorateCards()};
}
if(typeof openUse==="function"){
  const base=openUse;
  openUse=function(p){base(p);const badges=q("useBadges");if(badges&&p)badges.insertAdjacentHTML("beforeend",modelBadges(p))};
}

function resetEditState(){
  editingId=null;
  const h=document.querySelector("#dialog .sheethead h3");if(h)h.textContent="Add prompt";
  const submit=document.querySelector("#form button[type=submit]");if(submit)submit.textContent="Save to Library";
}
function openEditor(p){
  if(!p)return;
  editingId=p.id;
  try{renderCategorySelect()}catch{}
  q("prompt").value=p.content||"";q("title").value=p.title||"";q("source").value=p.source||"";
  q("category").value=categoryId(p);q("platform").value=platformsOf(p)[0]||"general";q("models").value=modelsOfPrompt(p).map(displayModel).join(", ");
  const h=document.querySelector("#dialog .sheethead h3");if(h)h.textContent="Edit prompt";
  const submit=document.querySelector("#form button[type=submit]");if(submit)submit.textContent="Save changes";
  q("dialog").showModal();
}

/* Intercept Edit before the legacy card click opens Use Prompt. */
q("list")?.addEventListener("click",event=>{
  const b=event.target.closest("[data-model-edit]");if(!b)return;
  event.preventDefault();event.stopImmediatePropagation();
  const p=(prompts||[]).find(x=>String(x.id)===String(b.dataset.modelEdit));openEditor(p);
},true);
q("dialog")?.addEventListener("close",()=>{resetEditState();if(q("models"))q("models").value=""});

/* Own submit path so both new and edited prompts persist model metadata. */
q("form")?.addEventListener("submit",async event=>{
  event.preventDefault();event.stopImmediatePropagation();
  const content=q("prompt").value.trim(),title=q("title").value.trim(),categoryIdValue=q("category").value||"general";
  if(!content||!title)return;
  const wasEditing=editingId!=null;
  try{
    let saved;
    if(wasEditing){
      const existing=await localGet("prompts",editingId);if(!existing)throw new Error("Prompt no longer exists");
      saved={...existing,title,content,source:q("source").value.trim(),categoryId:categoryIdValue,platforms:[q("platform").value||"general"],models:parseModels(q("models").value),updatedAt:Date.now()};
      await put("prompts",saved);
    }else{
      const localId=await add("prompts",{title,content,source:q("source").value.trim(),categoryId:categoryIdValue,platforms:[q("platform").value||"general"],models:parseModels(q("models").value),useCount:0,lastUsedAt:null,rating:null,acquisitionType:"manual",createdAt:Date.now()});
      saved=await localGet("prompts",localId);if(!saved)throw new Error("Local save verification failed");
    }
    localStorage.setItem("pm-last-category",categoryIdValue);q("form").reset();q("dialog").close();activeOrigin="all";await refresh();
    document.querySelector('[data-nav="library"]')?.click();toast(wasEditing?"Prompt updated":(saved.cloudId?"Prompt saved · synced":"Prompt saved locally · sync pending"));
  }catch(err){console.error("Prompt save failed",err);toast(`Save failed: ${err?.message||"Unknown error"}`)}
},true);

function renderModelOptions(){
  const values=availableModels();
  const options=[["any","Model"],...values.map(x=>[x,x])];
  q("modelOptions").innerHTML=options.map(([id,name])=>`<button data-model-filter="${esc(id)}"><span>${esc(displayModel(name))}</span><b>${activeModel.toLowerCase()===String(id).toLowerCase()?"✓":""}</b></button>`).join("");
}
q("modelFilterButton")?.addEventListener("click",event=>{event.preventDefault();event.stopImmediatePropagation();renderModelOptions();q("modelDialog").showModal()},true);
q("modelClose")?.addEventListener("click",()=>q("modelDialog").close());
q("modelOptions")?.addEventListener("click",event=>{const b=event.target.closest("[data-model-filter]");if(!b)return;event.preventDefault();event.stopImmediatePropagation();activeModel=b.dataset.modelFilter;q("modelDialog").close();render();normalizeFilterButtons()},true);

/* Catalog/discovery metadata is preserved when a source supplies `model` or `models`. */
if(typeof saveCatalog==="function"){
  const base=saveCatalog;
  saveCatalog=async function(x){
    const before=new Set((prompts||[]).map(p=>p.id));await base(x);
    const values=Array.isArray(x?.models)?x.models:(x?.model?[x.model]:[]);if(!values.length)return;
    const created=(prompts||[]).find(p=>!before.has(p.id)&&p.acquisitionType==="catalog"&&String(p.externalId)===String(x.id));
    if(created){created.models=modelsOfPrompt({models:values});await put("prompts",created);await refresh()}
  };
}

/* Backups remain round-trippable without changing the existing backup envelope. */
if(typeof restore==="function"){
  restore=async function(file){
    let data;try{data=JSON.parse(await file.text())}catch{throw new Error("Invalid JSON backup")}
    if(data?.format!=="prompt-manager-backup"||![1,2,3,4].includes(data.version)||!Array.isArray(data.prompts))throw new Error("Unsupported backup");
    if(data.version>=2&&Array.isArray(data.categories))for(const c of data.categories){if(c&&typeof c.name==="string"&&c.name.trim()){let id=typeof c.id==="string"&&c.id.trim()?c.id:slug(c.name);if(id)await put("categories",{id,name:c.name.trim().slice(0,40),createdAt:Number.isFinite(c.createdAt)?c.createdAt:Date.now(),system:DEFAULT_CATEGORIES.map(slug).includes(id)})}}
    categories=await all("categories");let seen=new Set(prompts.map(fp)),added=0,skipped=0;
    for(const p of data.prompts){if(!p||typeof p.content!=="string"||!p.content.trim()){skipped++;continue}let clean={title:typeof p.title==="string"&&p.title.trim()?p.title.trim().slice(0,80):suggestTitle(p.content),content:p.content.trim(),source:typeof p.source==="string"?p.source.trim():"",categoryId:typeof p.categoryId==="string"&&categories.some(c=>c.id===p.categoryId)?p.categoryId:"general",createdAt:Number.isFinite(p.createdAt)?p.createdAt:Date.now(),platforms:data.version>=3&&Array.isArray(p.platforms)?platformsOf(p):["general"],models:modelsOfPrompt(p),useCount:data.version>=3&&Number.isFinite(p.useCount)?Math.max(0,p.useCount):0,lastUsedAt:data.version>=3&&Number.isFinite(p.lastUsedAt)?p.lastUsedAt:null,acquisitionType:data.version>=4&&p.acquisitionType==="catalog"?"catalog":"manual",sourceName:data.version>=4&&typeof p.sourceName==="string"?p.sourceName:"",externalId:data.version>=4&&typeof p.externalId==="string"?p.externalId:""},key=fp(clean);if(seen.has(key)){skipped++;continue}await add("prompts",clean);seen.add(key);added++}
    await refresh();return{added,skipped};
  };
}

/* M1.7.11.1 — filter semantics: labels are reset actions; Platform scopes Model. */
function normalizeFilterButtons(){
  const pb=q("platformFilterButton"), mb=q("modelFilterButton");
  if(pb)pb.textContent=activePlatform==="any"?"Platform":(PLATFORMS[activePlatform]||activePlatform);
  if(mb)mb.textContent=activeModel==="any"?"Model":displayModel(activeModel);
}
function normalizePlatformButton(){
  const pb=q("platformFilterButton");
  if(!pb)return;
  pb.textContent=activePlatform==="any"?"Platform":(PLATFORMS[activePlatform]||activePlatform);
  pb.setAttribute("aria-label",activePlatform==="any"?"Platform":(PLATFORMS[activePlatform]||activePlatform));
}
function installFilterSemantics(){
  const pb=q("platformFilterButton"), po=q("platformOptions");
  if(pb)pb.addEventListener("click",event=>{
    pb.textContent=activePlatform==="any"?"Platform":(PLATFORMS[activePlatform]||activePlatform);
    event.preventDefault(); event.stopImmediatePropagation();
    po.innerHTML=[["any","Platform"],...Object.entries(PLATFORMS)].map(([id,name])=>`<button data-platform-filter="${esc(id)}"><span>${esc(name)}</span><b>${activePlatform===id?"✓":""}</b></button>`).join("");
    q("platformDialog").showModal();
  },true);
  if(po)po.addEventListener("click",event=>{
    const b=event.target.closest("[data-platform-filter]"); if(!b)return;
    event.preventDefault(); event.stopImmediatePropagation();
    const next=b.dataset.platformFilter;
    activePlatform=next;
    if(!modelCompatibleWithPlatform(activeModel,next))activeModel="any";
    q("platformDialog").close(); render(); normalizeFilterButtons();
  },true);
}
installFilterSemantics(); normalizeFilterButtons();

/* M1.7.11.6 — legacy app renderFilters may redraw these controls after this
   module initializes. Keep the two labels canonical and idempotent. */
function canonicalFilterLabel(button,label){
  if(!button)return;
  if(button.textContent!==label)button.textContent=label;
}
function enforceCanonicalFilterLabels(){
  canonicalFilterLabel(q("platformFilterButton"),activePlatform==="any"?"Platform":(PLATFORMS[activePlatform]||activePlatform));
  canonicalFilterLabel(q("modelFilterButton"),activeModel==="any"?"Model":displayModel(activeModel));
}
const filterLabelObserver=new MutationObserver(enforceCanonicalFilterLabels);
[q("platformFilterButton"),q("modelFilterButton")].forEach(button=>{
  if(button)filterLabelObserver.observe(button,{childList:true,characterData:true,subtree:true});
});
enforceCanonicalFilterLabels();

/* Filters are ephemeral session state: reset on app termination naturally, and explicitly on sign-out. */
if(typeof signOutPM==="function"){
  const baseSignOut=signOutPM;
  signOutPM=async function(){resetLibraryFilters();return baseSignOut.apply(this,arguments)};
}
window.addEventListener("pagehide",()=>{ activeCategory="all"; activePlatform="any"; activeOrigin="all"; activeModel="any"; });

window.pmModelSupport={modelsOf:modelsOfPrompt,parse:parseModels,matches:modelMatches,resetFilters:resetLibraryFilters,availableModels};
})();
