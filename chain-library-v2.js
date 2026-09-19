/* Prompt Manager V2.0.20 — Unified Library behavior */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const ICON_SHARE=`<svg viewBox="0 0 24 24"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M6 12v7h12v-7"/></svg>`;
let type="all",busy=false,lockedY=0;
const completed=new Map();
const platformURLs={chatgpt:"chatgpt://",claude:"https://claude.ai/new",gemini:"https://gemini.google.com/app",grok:"https://grok.com/"};
const chainSelected=new Set();

function injectCSS(){if(document.querySelector('link[data-chain-library-v2]'))return;const l=document.createElement("link");l.rel="stylesheet";l.href="./chain-library-v2.css";l.dataset.chainLibraryV2="1";document.head.appendChild(l)}
function toast2(s){try{toast(s)}catch{const e=$("toast");if(e){e.textContent=s;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1800)}}}
async function copyText(text){try{await navigator.clipboard.writeText(text);return true}catch{try{const a=document.createElement("textarea");a.value=text;a.setAttribute("readonly","");a.style.position="fixed";a.style.opacity="0";document.body.appendChild(a);a.select();const ok=document.execCommand("copy");a.remove();return !!ok}catch{return false}}}
function openPlatform(url){if(!url)return false;const w=window.open(url,"_blank","noopener,noreferrer");if(!w)location.href=url;return true}
function isMoreTrigger(el){const b=el?.closest?.("button");if(!b)return false;const label=(b.getAttribute("aria-label")||"").toLowerCase();return !!(b.matches("[data-detail-menu],[data-chain-menu],.pm-library-more")||label.includes("more")||label.includes("menu")||(b.textContent||"").includes("•••"))}
function closeOpenMenus(except=null){document.querySelectorAll(".menu:not([hidden])").forEach(m=>{if(m!==except)m.hidden=true})}
function positionDetailMenu(button,menu){const sheet=button.closest(".pm-chain-detail-sheet");if(!sheet||!menu)return;const br=button.getBoundingClientRect(),sr=sheet.getBoundingClientRect();menu.style.top=`${Math.round(br.bottom-sr.top+8)}px`;menu.style.right=`${Math.max(18,Math.round(sr.right-br.right))}px`;menu.style.left="auto"}

function lockBackground(){if(document.body.classList.contains("pm-detail-locked"))return;lockedY=window.scrollY||0;document.body.style.top=`-${lockedY}px`;document.body.classList.add("pm-detail-locked")}
function unlockBackground(){if(!document.body.classList.contains("pm-detail-locked"))return;document.body.classList.remove("pm-detail-locked");document.body.style.top="";window.scrollTo(0,lockedY)}
function closeDetail(){const d=$("pmChainDetail");if(d?.open)d.close();unlockBackground()}
function ensureType(){const row=$("categoryFilters");if(!row)return;let b=$("pmTypeFilter");if(!b){b=document.createElement("button");b.id="pmTypeFilter";b.type="button";b.className="pm-type-filter";row.prepend(b)}if(row.firstElementChild!==b)row.prepend(b);b.textContent=(type==="chains"?"Chains":type==="prompts"?"Prompts":"Type")+" ▾";b.classList.toggle("selected",type!=="all")}
function typeDialog(){let d=$("pmTypeDialog");if(d)return d;d=document.createElement("dialog");d.id="pmTypeDialog";d.className="sheet pm-type-dialog";d.innerHTML=`<div class="sheethead"><div><small>FILTER</small><h3>Type</h3></div><button class="x" type="button" data-type-close>×</button></div><div class="theme-options"><button data-type="all"><span>All</span><b></b></button><button data-type="prompts"><span>Prompts</span><b></b></button><button data-type="chains"><span>Chains</span><b></b></button></div>`;document.body.appendChild(d);return d}
function applyType(){ensureType();const list=$("list");if(!list)return;[...list.children].forEach(el=>{if(!el.classList.contains("card"))return;const chain=el.classList.contains("pm-chain-card");el.hidden=(type==="chains"&&!chain)||(type==="prompts"&&chain)});const visible=[...list.children].filter(el=>el.classList.contains("card")&&!el.hidden);const count=$("count");if(count)count.textContent=String(visible.length);const nr=$("noresults");if(nr)nr.hidden=visible.length>0;decorateCards()}
function decorateCards(){document.querySelectorAll(".pm-chain-card").forEach(card=>{const id=card.dataset.chainId;if(!id)return;card.classList.add("pm-chain-polished");const saved=completed.get(id)||new Set([0]);if(!completed.has(id))completed.set(id,saved);const progress=Math.max(...saved,0);card.dataset.chainProgress=String(progress);card.querySelectorAll(".pm-chain-node").forEach((n,i)=>{n.textContent=String(i+1);n.classList.toggle("is-complete",i<=progress)});const top=card.querySelector(".cardtop");if(top&&!top.querySelector("[data-chain-share-top]")){const actions=document.createElement("div");actions.className="pm-chain-top-actions";actions.innerHTML=`<button type="button" data-chain-share-top="${esc(id)}" aria-label="Share">${ICON_SHARE}</button>`;const more=top.querySelector("[data-chain-menu]");if(more){more.classList.add("pm-chain-more");actions.appendChild(more)}top.appendChild(actions)}const menu=card.querySelector(".pm-chain-menu");if(menu&&!menu.dataset.upgraded){menu.dataset.upgraded="1";menu.innerHTML=`<button data-chain-edit="${esc(id)}">Edit chain</button><button data-chain-duplicate="${esc(id)}">Duplicate chain</button><button class="danger" data-chain-delete-v2="${esc(id)}">Delete chain</button>`}card.querySelectorAll("[data-chain-copy]").forEach(b=>{if(b.dataset.progressBound)return;b.dataset.progressBound="1";b.addEventListener("click",()=>markComplete(id,Number(b.dataset.chainCopy.split(":")[1])))})});syncRailGeometry(document)}
function syncRailGeometry(root=document){
 requestAnimationFrame(()=>{
  const cards=root.matches?.(".pm-chain-card")?[root]:[...root.querySelectorAll?.(".pm-chain-card.pm-chain-polished")||[]];
  cards.forEach(card=>{
   const rail=card.querySelector(".pm-chain-rail"),line=rail?.querySelector(".pm-chain-line"),first=card.querySelector(".pm-chain-node.is-first");
   if(!rail||!line||!first)return;
   const rr=rail.getBoundingClientRect(),fr=first.getBoundingClientRect(),start=fr.top+fr.height/2-rr.top;
   const rest=card.querySelector(".pm-chain-rest"),expanded=!!rest&&!rest.hidden&&getComputedStyle(rest).display!=="none";
   const nodes=[...card.querySelectorAll(".pm-chain-node")].filter(n=>n.offsetParent!==null);
   let end,activeCenter=start,nextCenter=null;
   const progress=Math.max(0,Number(card.dataset.chainProgress??0));
   if(expanded&&nodes.length>1){
    const centers=nodes.map(n=>{const r=n.getBoundingClientRect();return r.top+r.height/2-rr.top});
    end=centers.at(-1);const ai=Math.min(progress,centers.length-1);activeCenter=centers[ai];nextCenter=centers[Math.min(ai+1,centers.length-1)];
   }else{
    // Closed card: the teaser rail is static, reaches the card edge, and fades
    // as if it had travelled ~90% of the way to prompt 2. Never scroll-driven.
    const cr=card.getBoundingClientRect();end=Math.max(start,cr.bottom-rr.top-1);nextCenter=end;
   }
   const goldEnd=nextCenter==null?activeCenter:(activeCenter+(nextCenter-activeCenter)*.90);
   const span=Math.max(0,end-start),fade=Math.max(12,Math.min(30,span*.10));
   line.style.top=`${start}px`;line.style.height=`${span}px`;
   line.style.setProperty("--pm-rail-gold-end",`${Math.max(0,goldEnd-start)}px`);line.style.setProperty("--pm-rail-fade",`${fade}px`);
  });
  const d=root.matches?.("#pmChainDetail")?root:root.querySelector?.("#pmChainDetail");
  if(d?.open){const steps=d.querySelector(".pm-chain-detail-steps"),items=[...d.querySelectorAll(".pm-chain-detail-step")];if(steps&&items.length){
   const sr=steps.getBoundingClientRect(),centers=items.map(x=>{const r=x.querySelector(".pm-chain-detail-node").getBoundingClientRect();return r.top+r.height/2-sr.top});
   const start=centers[0],end=centers.at(-1),progress=Math.max(0,Number(d.dataset.chainProgress??0)),ai=Math.min(progress,items.length-1),a=centers[ai],n=centers[Math.min(ai+1,items.length-1)],goldEnd=ai<items.length-1?a+(n-a)*.90:a;
   steps.style.setProperty("--pm-detail-rail-top",`${start}px`);steps.style.setProperty("--pm-detail-rail-height",`${Math.max(0,end-start)}px`);steps.style.setProperty("--pm-detail-gold-end",`${Math.max(0,goldEnd-start)}px`);steps.style.setProperty("--pm-detail-fade",`${Math.max(12,Math.min(30,(n-a)*.10||16))}px`);
  }}
 });
}
function markComplete(id,index){
 let s=completed.get(id)||new Set();
 // Chain progress is sequential: copying prompt N means 1..N are completed.
 for(let i=0;i<=index;i++)s.add(i);
 completed.set(id,s);
 const progress=Math.max(...s,-1);
 document.querySelectorAll(`.pm-chain-card[data-chain-id="${CSS.escape(id)}"]`).forEach(card=>{
  card.dataset.chainProgress=String(progress);
  card.querySelectorAll(".pm-chain-node").forEach((n,i)=>n.classList.toggle("is-complete",i<=progress));
  syncRailGeometry(card);
 });
 document.querySelectorAll(`#pmChainDetail[data-chain-id="${CSS.escape(id)}"]`).forEach(d=>{
  d.dataset.chainProgress=String(progress);
  d.querySelectorAll(".pm-chain-detail-step").forEach((x,i)=>x.classList.toggle("is-complete",i<=progress));
  syncRailGeometry(d);
 });
}
async function getChain(id){const {data,error}=await supabaseClient.from("prompt_chains").select("*, prompt_chain_steps(*)").eq("id",id).single();if(error)throw error;data.steps=(data.prompt_chain_steps||[]).sort((a,b)=>a.position-b.position);return data}
function detailDialog(){let d=$("pmChainDetail");if(d)return d;d=document.createElement("dialog");d.id="pmChainDetail";d.className="pm-chain-detail";d.addEventListener("cancel",e=>{e.preventDefault();closeDetail()});d.addEventListener("close",unlockBackground);document.body.appendChild(d);return d}
function stars(c){const r=Number(c.rating)||0;return [1,2,3,4,5].map(n=>`<button data-chain-rate="${n}" class="${n<=r?"on":""}" aria-label="${n} stars">★</button>`).join("")}
function ratingSummary(c){const r=Number(c.rating)||0;return `<div class="pm-chain-rating"><div class="rating-stars">${stars(c)}</div><span class="pm-chain-rating-value">${r?r.toFixed(1):"—"}</span>${r?`<span class="pm-chain-rating-count">(1)</span>`:""}</div>`}
async function openDetail(id){const d=detailDialog();d.dataset.chainId=id;d.innerHTML=`<div class="pm-chain-detail-loading">Loading chain…</div>`;lockBackground();d.showModal();try{const c=await getChain(id),steps=c.steps||[];d.innerHTML=`<div class="pm-chain-detail-sheet">
 <div class="pm-chain-detail-type"><span class="pm-chain-badge">CHAIN</span><span class="categorybadge">${esc(typeof catName==="function"?catName(c.category_id):c.category_id)}</span></div>
 <header class="pm-chain-title-row"><h2>${esc(c.title)}</h2><div class="pm-chain-detail-actions"><button data-chain-share-top="${esc(id)}" aria-label="Share">${ICON_SHARE}</button><button data-detail-menu="${esc(id)}" aria-label="More actions">•••</button><button data-detail-close aria-label="Close">×</button></div></header>
 ${c.description?`<p class="pm-chain-detail-desc">${esc(c.description)}</p>`:""}
 <div class="pm-chain-detail-meta"><span>${esc(typeof platformName==="function"?platformName(c.platform):c.platform)}</span>${c.model?`<span>${esc(c.model)}</span>`:""}<span>${steps.length} steps</span></div>
 <div class="pm-chain-detail-steps">${steps.map((s,i)=>`<section class="pm-chain-detail-step" data-detail-step="${i}"><span class="pm-chain-detail-node">${i+1}</span><div class="pm-chain-detail-step-card"><small>PROMPT ${i+1}</small><strong>${esc(s.title||`Prompt ${i+1}`)}</strong><p>${esc(s.content)}</p><button data-detail-copy="${i}">Copy prompt</button></div></section>`).join("")}</div>
 <button class="full primary pm-chain-use" data-chain-use="${esc(id)}">${c.platform&&c.platform!=="general"&&platformURLs[c.platform]?`Use with ${esc(typeof platformName==="function"?platformName(c.platform):c.platform)} ↗`:"Copy first prompt"}</button>
 <footer class="pm-chain-detail-footer">${ratingSummary(c)}<div class="pm-chain-uses">Used ${Number(c.use_count)||0} times</div></footer>
 <div class="menu pm-chain-detail-menu" hidden><button data-chain-edit="${esc(id)}">Edit chain</button><button data-chain-duplicate="${esc(id)}">Duplicate chain</button><button class="danger" data-chain-delete-v2="${esc(id)}">Delete chain</button></div>
 </div>`;d._pmChainData=c;const done=completed.get(id)||new Set([0]);if(!completed.has(id))completed.set(id,done);const progress=Math.max(...done,0);d.dataset.chainProgress=String(progress);d.querySelectorAll(".pm-chain-detail-step").forEach((x,i)=>x.classList.toggle("is-complete",i<=progress));
 d.querySelectorAll("[data-chain-rate]").forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();void rate(id,Number(b.dataset.chainRate))});
 const useButton=d.querySelector("[data-chain-use]");if(useButton)useButton.onclick=e=>{e.preventDefault();e.stopPropagation();void useChain(id)};
 syncRailGeometry(d)}catch(e){d.innerHTML=`<div class="pm-chain-detail-loading">Could not load chain.<br>${esc(e.message||e)}</div>`}}
async function shareChain(id){try{const c=await getChain(id),text=[c.title,c.description,...c.steps.map((s,i)=>`${i+1}. ${s.title?`${s.title}\n`:""}${s.content}`)].filter(Boolean).join("\n\n");if(navigator.share)await navigator.share({title:c.title,text});else{await navigator.clipboard.writeText(text);toast2("Chain copied for sharing")}}catch(e){if(e?.name!=="AbortError")toast2("Share unavailable")}}
function editorDialog(){let d=$("pmChainEditV2");if(d)return d;d=document.createElement("dialog");d.id="pmChainEditV2";d.className="pm-chain-edit-v2";document.body.appendChild(d);return d}
async function editChain(id){const c=await getChain(id),d=editorDialog();d.dataset.chainId=id;d.innerHTML=`<form><div class="sheethead"><div><small>CHAIN</small><h3>Edit chain</h3></div><button type="button" class="round" data-edit-close>×</button></div><label>Title<input data-edit-title maxlength="100" value="${esc(c.title)}"></label><label>Description<textarea data-edit-description maxlength="300">${esc(c.description||"")}</textarea></label><div class="pm-chain-edit-steps">${c.steps.map((s,i)=>editStep(s,i)).join("")}</div><button type="button" data-edit-add>＋ Add prompt</button><button type="submit" class="full primary">Save changes</button></form>`;d.showModal()}
function editStep(s={},i=0){return `<section class="pm-chain-edit-step"><div><b>${i+1}</b><button type="button" data-edit-remove>×</button></div><label>Prompt title<input data-edit-step-title value="${esc(s.title||"")}"></label><label>Prompt<textarea data-edit-step-content required>${esc(s.content||"")}</textarea></label></section>`}
async function saveEdit(d){if(busy)return;const sections=[...d.querySelectorAll(".pm-chain-edit-step")],id=d.dataset.chainId;if(sections.length<2){toast2("A chain needs at least 2 prompts");return}busy=true;try{const c=await getChain(id),payload={title:d.querySelector("[data-edit-title]").value.trim(),description:d.querySelector("[data-edit-description]").value.trim(),updated_at:new Date().toISOString()};let r=await supabaseClient.from("prompt_chains").update(payload).eq("id",id);if(r.error)throw r.error;r=await supabaseClient.from("prompt_chain_steps").delete().eq("chain_id",id);if(r.error)throw r.error;const rows=sections.map((s,i)=>({chain_id:id,user_id:c.user_id,position:i+1,title:s.querySelector("[data-edit-step-title]").value.trim(),content:s.querySelector("[data-edit-step-content]").value.trim()}));r=await supabaseClient.from("prompt_chain_steps").insert(rows);if(r.error)throw r.error;d.close();closeDetail();toast2("Chain updated");location.reload()}catch(e){toast2(`Update failed: ${e.message||e}`)}finally{busy=false}}
async function duplicateChain(id){try{const c=await getChain(id),{data,error}=await supabaseClient.from("prompt_chains").insert({user_id:c.user_id,title:`${c.title} — Copy`,description:c.description,category_id:c.category_id,platform:c.platform,model:c.model,rating:null,use_count:0}).select().single();if(error)throw error;const rows=c.steps.map((s,i)=>({chain_id:data.id,user_id:c.user_id,position:i+1,title:s.title,content:s.content,prompt_id:s.prompt_id||null}));const x=await supabaseClient.from("prompt_chain_steps").insert(rows);if(x.error){await supabaseClient.from("prompt_chains").delete().eq("id",data.id);throw x.error}toast2("Chain duplicated");location.reload()}catch(e){toast2(`Duplicate failed: ${e.message||e}`)}}
async function deleteV2(id){if(!confirm("Delete this chain?"))return;const {error}=await supabaseClient.from("prompt_chains").delete().eq("id",id);if(error){toast2(error.message);return}closeDetail();toast2("Chain deleted");location.reload()}
async function rate(id,n){
 const d=$("pmChainDetail"),cached=d?._pmChainData;
 try{
  const current=cached&&String(cached.id)===String(id)?cached:await getChain(id);
  const value=Number(current.rating)===n?null:n;
  // Optimistic UI so the tap always has immediate visible feedback.
  if(d?.open){
   d.querySelectorAll("[data-chain-rate]").forEach(b=>b.classList.toggle("on",Number(b.dataset.chainRate)<=Number(value||0)));
   const v=d.querySelector(".pm-chain-rating-value"),count=d.querySelector(".pm-chain-rating-count");
   if(v)v.textContent=value?Number(value).toFixed(1):"—";
   if(count){count.textContent=value?"(1)":"";count.hidden=!value}
  }
  current.rating=value;
  const {error}=await supabaseClient.from("prompt_chains").update({rating:value,updated_at:new Date().toISOString()}).eq("id",id);
  if(error)throw error;
  toast2(value?`Rated ${value} stars`:"Rating cleared");
 }catch(e){
  toast2(`Rating failed: ${e.message||e}`);
  try{const fresh=await getChain(id);if(d?.open){d._pmChainData=fresh;d.querySelectorAll("[data-chain-rate]").forEach(b=>b.classList.toggle("on",Number(b.dataset.chainRate)<=Number(fresh.rating||0)))}}catch{}
 }
}
async function openDetailRefresh(id){closeDetail();await openDetail(id)}
async function useChain(id){
 const d=$("pmChainDetail"),c=d?._pmChainData;if(!d||!c||String(c.id)!==String(id))return;
 const first=c.steps?.[0];if(!first)return toast2("This chain has no prompts");
 const url=platformURLs[c.platform];
 try{
  // Match the proven normal-prompt flow exactly: copy, persist use, then navigate.
  if(!await copyText(first.content))throw new Error("Copy unavailable");
  const next=(Number(c.use_count)||0)+1;c.use_count=next;
  const uses=d.querySelector(".pm-chain-uses");if(uses)uses.textContent=`Used ${next} times`;
  const {error}=await supabaseClient.from("prompt_chains").update({use_count:next,updated_at:new Date().toISOString()}).eq("id",id);if(error)throw error;
  toast2(url?`Copied · opening ${typeof platformName==="function"?platformName(c.platform):c.platform}`:"Copied to clipboard");
  if(url)setTimeout(()=>{location.href=url},120);
 }catch(e){toast2(`Use failed: ${e.message||e}`)}
}
function selectionModeActive(){
 const normal=document.querySelector("#list .card.pm-select-mode:not(.pm-chain-card)");if(normal)return true;
 const b=$("pmSelectToggle"),label=(b?.textContent||"").trim().toLowerCase();return ["cancel","cancelar","otkaži"].includes(label);
}
function normalSelectedCards(){return [...document.querySelectorAll("#list .card.pm-selected:not(.pm-chain-card)")]}
function syncChainSelection(){
 const on=selectionModeActive();document.querySelectorAll("#list .pm-chain-card").forEach(card=>{const id=card.dataset.chainId;card.classList.toggle("pm-select-mode",on);card.classList.toggle("pm-selected",on&&chainSelected.has(id));let dot=card.querySelector(".pm-chain-select-dot");if(on&&!dot){dot=document.createElement("span");dot.className="pm-chain-select-dot";card.appendChild(dot)}if(dot){dot.hidden=!on;dot.textContent=chainSelected.has(id)?"✓":""}});
 const bar=$("pmSelectionBar");if(!bar)return;let cancel=bar.querySelector(".pm-selection-cancel");if(!cancel){cancel=document.createElement("button");cancel.type="button";cancel.className="pm-selection-cancel";cancel.textContent="Cancel";cancel.onclick=()=>$("pmSelectToggle")?.click();bar.appendChild(cancel)}
 if(on){bar.hidden=false;const n=chainSelected.size+normalSelectedCards().length,sum=$("pmSelectionSummary"),del=$("pmDeleteSelected");if(sum)sum.textContent=`${n} selected`;if(del)del.disabled=n===0}else{chainSelected.clear();bar.hidden=true}
}
async function deleteUnifiedSelection(){
 const chainIds=[...chainSelected],promptCards=normalSelectedCards(),promptIds=promptCards.map(c=>Number(c.dataset.use)).filter(Number.isFinite),total=chainIds.length+promptIds.length;if(!total)return;
 if(!confirm(`Delete ${total} selected item${total===1?"":"s"}?`))return;
 try{for(const id of chainIds){const {error}=await supabaseClient.from("prompt_chains").delete().eq("id",id);if(error)throw error}for(const id of promptIds)await del("prompts",id);chainSelected.clear();await refresh();$("pmSelectToggle")?.click();toast2(`✓ Deleted ${total}`)}catch(e){toast2(`Delete failed: ${e.message||e}`)}
}
function events(){document.addEventListener("click",async e=>{if(!e.target.closest(".menu")&&!isMoreTrigger(e.target))closeOpenMenus();const tb=e.target.closest("#pmTypeFilter");if(tb){e.preventDefault();e.stopPropagation();const d=typeDialog();d.querySelectorAll("[data-type]").forEach(x=>x.querySelector("b").textContent=x.dataset.type===type?"✓":"");d.showModal();return}if(e.target.closest("[data-type-close]"))return $("pmTypeDialog")?.close();const to=e.target.closest("[data-type]");if(to){type=to.dataset.type;$("pmTypeDialog")?.close();applyType();return}const sh=e.target.closest("[data-chain-share-top]");if(sh){e.stopPropagation();return shareChain(sh.dataset.chainShareTop)}const edit=e.target.closest("[data-chain-edit]");if(edit){e.stopPropagation();return editChain(edit.dataset.chainEdit)}const dup=e.target.closest("[data-chain-duplicate]");if(dup){e.stopPropagation();return duplicateChain(dup.dataset.chainDuplicate)}const del=e.target.closest("[data-chain-delete-v2]");if(del){e.stopPropagation();return deleteV2(del.dataset.chainDeleteV2)}if(e.target.closest("[data-detail-close]"))return closeDetail();const dm=e.target.closest("[data-detail-menu]");if(dm){const m=$("pmChainDetail")?.querySelector(".pm-chain-detail-menu");if(m){const opening=m.hidden;closeOpenMenus(m);if(opening){positionDetailMenu(dm,m);m.hidden=false}else m.hidden=true}return}const dc=e.target.closest("[data-detail-copy]");if(dc){const id=$("pmChainDetail")?.dataset.chainId,c=await getChain(id),i=Number(dc.dataset.detailCopy);if(!await copyText(c.steps[i].content))return toast2("Copy failed");markComplete(id,i);dc.closest(".pm-chain-detail-step")?.classList.add("is-complete");toast2("Prompt copied");return}if(e.target.closest("[data-edit-close]"))return $("pmChainEditV2")?.close();if(e.target.closest("[data-edit-add]")){const wrap=$("pmChainEditV2").querySelector(".pm-chain-edit-steps"),i=wrap.children.length;wrap.insertAdjacentHTML("beforeend",editStep({},i));return}if(e.target.closest("[data-edit-remove]")){const s=e.target.closest(".pm-chain-edit-step"),wrap=s.parentElement;if(wrap.children.length<=2)return toast2("A chain needs at least 2 prompts");s.remove();return}const card=e.target.closest(".pm-chain-card");if(card&&selectionModeActive()){e.preventDefault();e.stopImmediatePropagation();const id=card.dataset.chainId;chainSelected.has(id)?chainSelected.delete(id):chainSelected.add(id);syncChainSelection();return}if(card&&!e.target.closest("button,.menu"))openDetail(card.dataset.chainId)},true);document.addEventListener("submit",e=>{if(e.target.closest("#pmChainEditV2")){e.preventDefault();saveEdit($("pmChainEditV2"))}},true)}
window.addEventListener("resize",()=>syncRailGeometry(document),{passive:true});window.addEventListener("orientationchange",()=>setTimeout(()=>syncRailGeometry(document),120),{passive:true});
function installGlobalMenuDismiss(){
 document.addEventListener("pointerdown",e=>{
   if(e.target.closest?.(".menu")||isMoreTrigger(e.target))return;
   closeOpenMenus();
 },true);
 document.addEventListener("keydown",e=>{if(e.key==="Escape")closeOpenMenus()},true);
}
function start(){injectCSS();ensureType();events();installGlobalMenuDismiss();const list=$("list");if(list)new MutationObserver(()=>requestAnimationFrame(()=>{applyType();syncChainSelection();syncRailGeometry(document)})).observe(list,{childList:true,subtree:true});new MutationObserver(()=>ensureType()).observe($("categoryFilters")||document.body,{childList:true});document.addEventListener("click",e=>{if(e.target.closest("#pmSelectToggle"))setTimeout(syncChainSelection,0);if(e.target.closest("#pmDeleteSelected")&&chainSelected.size){e.preventDefault();e.stopImmediatePropagation();void deleteUnifiedSelection()}},false);setTimeout(()=>{applyType();syncChainSelection()},250)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();