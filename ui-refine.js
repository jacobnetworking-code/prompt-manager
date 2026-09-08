/* Prompt Manager — M1.6.4 UI refinement
   Loaded AFTER app.js. No schema changes. */

(()=>{
"use strict";

const ICONS={
  copy:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>`,
  share:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3"></path><path d="m8 7 4-4 4 4"></path><path d="M7 10H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2"></path></svg>`,
  edit:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z"></path><path d="m13.5 6.5 4 4"></path></svg>`,
  trash:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"></path><path d="M9 7V4h6v3"></path><path d="M7 7l1 13h8l1-13"></path><path d="M10 11v5M14 11v5"></path></svg>`
};

const byId=id=>document.getElementById(id);

function authDefaultName(){
  const meta=authUser?.user_metadata||{};
  return (meta.full_name||meta.name||meta.user_name||authUser?.email||"Prompt Manager").trim();
}
function effectiveName(){
  return (localStorage.getItem("pm-display-name")||"").trim() || authDefaultName();
}

/* Profile: authenticated identity by default, editable override after user saves one. */
renderProfileUI=function(){
  const name=effectiveName();
  const menu=byId("profileMenuName");
  const input=byId("displayName");
  if(menu)menu.textContent=name;
  if(input)input.value=name;
  const theme=localStorage.getItem("pm-theme")||"system";
  document.querySelectorAll("[data-quick-theme]").forEach(b=>b.classList.toggle("active",b.dataset.quickTheme===theme));
};

function flashButton(btn,label,ms=1500){
  if(!btn)return;
  if(!btn.dataset.pmOriginal)btn.dataset.pmOriginal=btn.innerHTML;
  btn.innerHTML=label;
  btn.classList.add("pm-inline-feedback");
  clearTimeout(btn._pmTimer);
  btn._pmTimer=setTimeout(()=>{
    btn.innerHTML=btn.dataset.pmOriginal;
    btn.classList.remove("pm-inline-feedback");
  },ms);
}

/* Settings save feedback. */
document.addEventListener("click",e=>{
  const b=e.target.closest("#saveDisplayName");
  if(!b)return;
  setTimeout(()=>flashButton(b,"✓ Saved"),0);
},true);

/* Close sheets/modals by tapping backdrop. Native-looking app UI remains; no browser confirm(). */
document.addEventListener("pointerdown",e=>{
  const d=e.target.closest("dialog");
  if(!d || e.target!==d || !d.open)return;
  d.close();
});

/* Add Prompt always reopens clean. */
const captureDefault=()=>{
  localStorage.setItem("pm-last-category","general");
  const f=byId("form");
  if(f)f.reset();
  if(byId("category"))byId("category").value="general";
  if(byId("platform"))byId("platform").value="general";
  if(byId("source"))byId("source").value="";
  if(byId("title"))byId("title").value="";
  if(byId("prompt"))byId("prompt").value="";
  if(byId("pasteHint"))byId("pasteHint").textContent="Paste prompt text or a source URL.";
};
byId("dialog")?.addEventListener("close",captureDefault);
["homeAdd","libraryAdd","fab"].forEach(id=>{
  byId(id)?.addEventListener("click",()=>setTimeout(()=>{
    localStorage.setItem("pm-last-category","general");
    if(byId("category"))byId("category").value="general";
    if(byId("platform"))byId("platform").value="general";
  },0),true);
});

/* Home: lightweight What's New, never a tour/popup. */
const homeActions=document.querySelector("#homeView .home-actions");
if(homeActions && !document.querySelector(".pm-whats-new")){
  const n=document.createElement("section");
  n.className="pm-whats-new";
  n.innerHTML=`<div class="pm-whats-new-head"><div><small>WHAT'S NEW</small><h3>Prompt Manager is getting faster.</h3></div><span class="pm-version">ALPHA</span></div><p>Cloud sync, ChatGPT access, improved prompt actions and a cleaner library experience.</p>`;
  homeActions.insertAdjacentElement("afterend",n);
}

/* Explore always starts at its category root when user returns to it. */
document.querySelector(".bottom-nav")?.addEventListener("click",e=>{
  const b=e.target.closest('[data-nav="explore"]');
  if(!b)return;
  exploreCategory=null;
  if(byId("exploreSearch"))byId("exploreSearch").value="";
  setTimeout(()=>renderExplore(),0);
},true);
document.querySelectorAll('[data-go="explore"]').forEach(b=>b.addEventListener("click",()=>{
  exploreCategory=null;
  if(byId("exploreSearch"))byId("exploreSearch").value="";
  setTimeout(()=>renderExplore(),0);
},true));

/* Featured, rather than fake "Trending" until Prompt Manager has real behavioral signals. */
const exploreSearch=document.querySelector(".explore-search");
if(exploreSearch && !document.querySelector(".pm-featured")){
  const f=document.createElement("section");
  f.className="pm-featured";
  f.innerHTML=`<small>★ FEATURED</small><h3>Prompts worth trying</h3><p>Curated for Alpha. This becomes Trending once we have enough real save, use and rating signals.</p>`;
  exploreSearch.insertAdjacentElement("afterend",f);
}

/* Optional preview media support for future catalog items.
   We only render actual previewImage/previewVideo fields; no fake placeholders. */
const baseRenderExplore=renderExplore;
renderExplore=function(){
  baseRenderExplore();
  document.querySelectorAll("#exploreList .explore-card").forEach(card=>{
    const open=card.querySelector("[data-explore-open]");
    if(!open)return;
    const x=catalogItem(open.dataset.exploreOpen);
    if(!x || (!x.previewImage && !x.previewVideo) || card.querySelector(".pm-preview-media"))return;
    const media=x.previewVideo
      ? `<video class="pm-preview-media" src="${esc(x.previewVideo)}" muted playsinline controls></video>`
      : `<img class="pm-preview-media" src="${esc(x.previewImage)}" alt="${esc(x.title||"Prompt example")}">`;
    card.querySelector("h4")?.insertAdjacentHTML("afterend",media);
  });
};

/* Custom in-app confirmation dialog. */
function ensureConfirmDialog(){
  let d=byId("pmConfirmDialog");
  if(d)return d;
  d=document.createElement("dialog");
  d.id="pmConfirmDialog";
  d.innerHTML=`<section class="sheet"><div class="sheethead"><div><small>CONFIRM</small><h3 id="pmConfirmTitle">Delete prompt?</h3></div><button type="button" class="round" data-pm-confirm-cancel>×</button></div><p class="pm-confirm-copy" id="pmConfirmCopy">This can't be undone.</p><div class="pm-confirm-actions"><button type="button" data-pm-confirm-cancel>Cancel</button><button type="button" class="pm-confirm-delete" id="pmConfirmDelete">Delete</button></div></section>`;
  document.body.appendChild(d);
  d.addEventListener("click",e=>{
    if(e.target.closest("[data-pm-confirm-cancel]"))d.close("cancel");
  });
  d.addEventListener("pointerdown",e=>{if(e.target===d)d.close("cancel")});
  return d;
}
function confirmDelete({title="Delete prompt?",copy="This can't be undone.",button="Delete"}={}){
  return new Promise(resolve=>{
    const d=ensureConfirmDialog();
    byId("pmConfirmTitle").textContent=title;
    byId("pmConfirmCopy").textContent=copy;
    const delBtn=byId("pmConfirmDelete");
    delBtn.textContent=button;
    const done=ok=>{
      delBtn.onclick=null;
      d.removeEventListener("close",closed);
      if(d.open)d.close(ok?"delete":"cancel");
      resolve(ok);
    };
    const closed=()=>done(false);
    delBtn.onclick=()=>done(true);
    d.addEventListener("close",closed,{once:true});
    d.showModal();
  });
}

/* Edit dialog. */
function ensureEditDialog(){
  let d=byId("pmEditDialog");
  if(d)return d;
  d=document.createElement("dialog");
  d.id="pmEditDialog";
  d.innerHTML=`<section class="sheet"><div class="sheethead"><div><small>EDIT PROMPT</small><h3>Edit</h3></div><button type="button" class="round" data-pm-edit-close>×</button></div><div class="pm-edit-grid"><label>Title<input id="pmEditTitle" maxlength="80"></label><label>Prompt<textarea id="pmEditContent"></textarea></label><label>Source URL <em>optional</em><input id="pmEditSource" type="url" inputmode="url"></label><button class="full primary" type="button" id="pmEditSave">Save changes</button></div></section>`;
  document.body.appendChild(d);
  d.addEventListener("click",e=>{if(e.target.closest("[data-pm-edit-close]"))d.close()});
  d.addEventListener("pointerdown",e=>{if(e.target===d)d.close()});
  return d;
}
let editingPrompt=null;
function openEdit(p){
  editingPrompt=p;
  const d=ensureEditDialog();
  byId("pmEditTitle").value=p.title||"";
  byId("pmEditContent").value=p.content||"";
  byId("pmEditSource").value=p.source||"";
  d.showModal();
}
ensureEditDialog();
byId("pmEditSave")?.addEventListener("click",async()=>{
  if(!editingPrompt)return;
  const b=byId("pmEditSave");
  const title=byId("pmEditTitle").value.trim();
  const content=byId("pmEditContent").value.trim();
  if(!title||!content){toast("Title and prompt are required");return}
  b.disabled=true;
  try{
    editingPrompt.title=title;
    editingPrompt.content=content;
    editingPrompt.source=byId("pmEditSource").value.trim();
    await put("prompts",editingPrompt);
    await refresh();
    flashButton(b,"✓ Saved");
    setTimeout(()=>byId("pmEditDialog")?.close(),500);
  }catch(err){
    console.error(err);toast("Could not save changes");
  }finally{b.disabled=false}
});

/* Bulk selection */
let selectMode=false;
let selectedIds=new Set();
function ensureLibraryTools(){
  let t=byId("pmLibraryTools");
  if(t)return t;
  t=document.createElement("div");
  t.id="pmLibraryTools";t.className="pm-library-tools";
  t.innerHTML=`<button type="button" id="pmSelectToggle">Select</button><span class="pm-selection-summary" id="pmSelectionSummary"></span><button type="button" id="pmDeleteSelected" class="pm-delete-selected" hidden>Delete</button>`;
  const filters=byId("libraryOriginFilters");
  filters?.insertAdjacentElement("beforebegin",t);
  byId("pmSelectToggle").onclick=()=>{
    selectMode=!selectMode;
    selectedIds.clear();
    render();
    updateSelectionTools();
  };
  byId("pmDeleteSelected").onclick=async()=>{
    const ids=[...selectedIds];
    if(!ids.length)return;
    const ok=await confirmDelete({
      title:`Delete ${ids.length} prompt${ids.length===1?"":"s"}?`,
      copy:"The selected prompts will be removed from your library. This can't be undone.",
      button:`Delete ${ids.length}`
    });
    if(!ok)return;
    /* Optimistic UI: remove from in-memory view first, then persist each deletion. */
    prompts=prompts.filter(p=>!selectedIds.has(p.id));
    render();
    for(const id of ids)await del("prompts",id);
    selectedIds.clear();selectMode=false;
    await refresh();
    toast(`✓ Deleted ${ids.length}`);
    updateSelectionTools();
  };
  return t;
}
function updateSelectionTools(){
  ensureLibraryTools();
  const count=selectedIds.size;
  byId("pmSelectToggle").textContent=selectMode?"Cancel":"Select";
  byId("pmSelectionSummary").textContent=selectMode?(count?`${count} selected`:"Select prompts"):"";
  byId("pmDeleteSelected").hidden=!selectMode||!count;
}
ensureLibraryTools();

/* Replace Library renderer with clickable cards + Apple-like icon actions. */
render=function(){
  const xs=filtered(),has=prompts.length>0,q=byId("search").value.trim();
  byId("count").textContent=prompts.length;
  byId("empty").hidden=has;
  byId("noresults").hidden=!(has&&(q||activeCategory!=="all"||activeOrigin!=="all")&&!xs.length);
  renderFilters();
  byId("list").innerHTML=xs.map(p=>`
    <article class="card ${selectMode?"pm-select-mode":""} ${selectedIds.has(p.id)?"pm-selected":""}" data-use="${p.id}">
      ${selectMode?`<span class="pm-select-dot">${selectedIds.has(p.id)?"✓":""}</span>`:""}
      <div class="cardtop">
        <div><div class="badges"><span class="categorybadge">${esc(catName(categoryId(p)))}</span>${platformsOf(p).map(x=>`<span class="platformbadge">${esc(platformName(x))}</span>`).join("")}</div><h4>${esc(p.title||"Untitled")}</h4></div>
      </div>
      <div class="preview">${esc((p.content||"").length>320?p.content.slice(0,320)+"…":p.content||"")}</div>
      <div class="meta"><span>${new Date(p.createdAt||Date.now()).toLocaleDateString()}</span>${p.source?'<span>Source saved</span>':""}${p.acquisitionType==="catalog"?`<span>Saved from ${esc(p.sourceName||"Explore")}</span>`:""}${(p.useCount||0)?`<span>Used ${p.useCount}×</span>`:""}</div>
      <div class="pm-card-actions">
        <button class="pm-icon-btn" data-pm-copy="${p.id}" aria-label="Copy prompt" title="Copy">${ICONS.copy}</button>
        <button class="pm-icon-btn" data-pm-share="${p.id}" aria-label="Share prompt" title="Share">${ICONS.share}</button>
        <span class="pm-spacer"></span>
        <button class="pm-icon-btn" data-pm-edit="${p.id}" aria-label="Edit prompt" title="Edit">${ICONS.edit}</button>
        <button class="pm-icon-btn pm-danger" data-pm-delete="${p.id}" aria-label="Delete prompt" title="Delete">${ICONS.trash}</button>
      </div>
    </article>`).join("");
  updateSelectionTools();
};

function promptById(id){return prompts.find(p=>String(p.id)===String(id))}
async function copyPromptFromCard(p,btn){
  try{
    await navigator.clipboard.writeText(p.content||"");
    flashButton(btn,"✓");
    toast("✓ Copied");
  }catch{toast("Copy unavailable")}
}
async function sharePrompt(p,btn){
  const text=`${p.title||"Prompt"}\n\n${p.content||""}`;
  try{
    if(navigator.share){
      await navigator.share({title:p.title||"Prompt",text});
      flashButton(btn,"✓");toast("✓ Shared");
    }else{
      await navigator.clipboard.writeText(text);
      flashButton(btn,"✓");toast("✓ Copied");
    }
  }catch(err){
    if(err?.name!=="AbortError")toast("Share unavailable");
  }
}
async function deleteOne(p){
  const ok=await confirmDelete({
    title:"Delete prompt?",
    copy:`"${p.title||"This prompt"}" will be removed from your library. This can't be undone.`,
    button:"Delete"
  });
  if(!ok)return;
  /* Immediate visual update before cloud sync completes. */
  prompts=prompts.filter(x=>x.id!==p.id);
  render();
  await del("prompts",p.id);
  await refresh();
  toast("✓ Deleted");
}

/* Capture-phase handler prevents legacy card/menu handlers from double-firing. */
byId("list")?.addEventListener("click",async e=>{
  const card=e.target.closest(".card");
  if(!card)return;
  const p=promptById(card.dataset.use);
  if(!p)return;

  if(selectMode){
    e.preventDefault();e.stopImmediatePropagation();
    selectedIds.has(p.id)?selectedIds.delete(p.id):selectedIds.add(p.id);
    render();return;
  }

  const copy=e.target.closest("[data-pm-copy]");
  const share=e.target.closest("[data-pm-share]");
  const edit=e.target.closest("[data-pm-edit]");
  const trash=e.target.closest("[data-pm-delete]");
  if(copy||share||edit||trash){
    e.preventDefault();e.stopImmediatePropagation();
    if(copy)return copyPromptFromCard(p,copy);
    if(share)return sharePrompt(p,share);
    if(edit)return openEdit(p);
    if(trash)return deleteOne(p);
  }

  e.preventDefault();e.stopImmediatePropagation();
  openUse(p);
},true);

/* Use sheet copy gets in-place feedback instead of toast-only. */
byId("useCopy")?.addEventListener("click",async e=>{
  e.preventDefault();e.stopImmediatePropagation();
  if(!currentPrompt)return;
  const b=byId("useCopy");
  try{
    await navigator.clipboard.writeText(personalized());
    await markUsed(currentPrompt);
    byId("useMeta").textContent=`Used ${currentPrompt.useCount} times${currentPrompt.source?" · Source saved":""}`;
    flashButton(b,"✓ Copied");
  }catch{toast("Copy unavailable")}
},true);

/* Diagnostics copy feedback. */
byId("diagnosticsCopy")?.addEventListener("click",()=>setTimeout(()=>flashButton(byId("diagnosticsCopy"),"✓ Copied"),0),true);

/* Export feedback. */
byId("export")?.addEventListener("click",()=>setTimeout(()=>flashButton(byId("export"),"✓ Exported"),0),true);

/* Remove browser alert() from backup restore failures by replacing it with an app modal. */
function showMessage(title,message){
  let d=byId("pmMessageDialog");
  if(!d){
    d=document.createElement("dialog");d.id="pmMessageDialog";
    d.innerHTML=`<section class="sheet"><div class="sheethead"><div><small>PROMPT MANAGER</small><h3 id="pmMessageTitle"></h3></div><button type="button" class="round" data-pm-message-close>×</button></div><p class="pm-confirm-copy" id="pmMessageCopy"></p><button type="button" class="full primary" data-pm-message-close>OK</button></section>`;
    document.body.appendChild(d);
    d.addEventListener("click",e=>{if(e.target.closest("[data-pm-message-close]"))d.close()});
    d.addEventListener("pointerdown",e=>{if(e.target===d)d.close()});
  }
  byId("pmMessageTitle").textContent=title;
  byId("pmMessageCopy").textContent=message;
  d.showModal();
}

/* Initial redraw with refined cards/profile. */
try{renderProfileUI();render()}catch(err){console.warn("UI refinement initial render deferred",err)}

})();
