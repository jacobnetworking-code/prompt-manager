/* Prompt Manager V2.0.19 — Chain Library coherence pass */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const chainSelected=new Set();
const lang=()=>{const x=(localStorage.getItem("pm-language")||document.documentElement.lang||"en").toLowerCase();return x.startsWith("es")?"es":x.startsWith("sr")?"sr":"en"};
const tx=()=>({
 en:{cancel:"Cancel",selected:"selected",delete:"Delete",rating:"YOUR RATING",used:"Used",times:"times",copied:"First prompt copied · opening ChatGPT",rateFail:"Rating failed",useFail:"Use failed"},
 es:{cancel:"Cancelar",selected:"seleccionados",delete:"Eliminar",rating:"TU VALORACIÓN",used:"Usado",times:"veces",copied:"Primer prompt copiado · abriendo ChatGPT",rateFail:"Error al valorar",useFail:"Error al usar"},
 sr:{cancel:"Otkaži",selected:"izabrano",delete:"Obriši",rating:"TVOJA OCENA",used:"Korišćeno",times:"puta",copied:"Prvi prompt kopiran · otvaram ChatGPT",rateFail:"Ocena nije sačuvana",useFail:"Korišćenje nije uspelo"}
})[lang()];
function toast2(s){try{toast(s)}catch{const e=$("toast");if(e){e.textContent=s;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1800)}}}
function css(){if($("pmChainV2019Styles"))return;const s=document.createElement("style");s.id="pmChainV2019Styles";s.textContent=`
/* One authoritative visual axis for Chain preview. */
.pm-chain-polished{--pm-axis-x:26px}
.pm-chain-polished .pm-chain-rail{left:calc(var(--pm-axis-x) - 15px)!important;width:30px!important}
.pm-chain-polished .pm-chain-line{left:14.25px!important;width:1.5px!important}
.pm-chain-polished .pm-chain-node.is-first{left:0!important;transform:none!important}
.pm-chain-polished .pm-chain-rest{margin-left:-30px!important;padding-left:30px!important}
.pm-chain-polished .pm-chain-step>.pm-chain-node{left:-30px!important;top:50%!important;transform:translateY(-50%)!important;margin:0!important}
.pm-chain-polished .pm-chain-step:before{left:-15px!important;width:15px!important;top:50%!important}
.pm-chain-polished .pm-chain-rest:before,.pm-chain-polished .pm-chain-step:last-child:after{display:none!important}
/* Keep platform, model and step count on one compact metadata row. */
.pm-chain-polished .badges{row-gap:6px!important}
.pm-chain-polished .badges .platformbadge,.pm-chain-polished .badges .modelbadge,.pm-chain-polished .badges .pm-chain-count{white-space:nowrap!important}
/* Detail: remove accidental divider and use the same single axis. */
.pm-chain-detail-desc{border:0!important;text-decoration:none!important}
.pm-chain-detail-desc:after{display:none!important}
.pm-chain-detail-meta{border:0!important;padding-bottom:0!important;flex-wrap:nowrap!important;overflow-x:auto!important;scrollbar-width:none!important}
.pm-chain-detail-meta::-webkit-scrollbar{display:none}
.pm-chain-detail-steps{--pm-detail-axis:18px;padding-left:50px!important}
.pm-chain-detail-steps:before{left:var(--pm-detail-axis)!important;width:1.5px!important}
.pm-chain-detail-node{left:-51px!important;top:50%!important;transform:translateY(-50%)!important;margin:0!important}
.pm-chain-detail-step:before{left:-32px!important;width:32px!important;top:50%!important}
/* Menus match the roomy Library overflow language. */
.pm-chain-menu,.pm-chain-detail-menu{min-width:220px!important;padding:8px!important;border-radius:17px!important;background:var(--surface)!important;border:1px solid var(--border)!important;box-shadow:0 18px 48px rgba(0,0,0,.34)!important;gap:2px!important}
.pm-chain-menu button,.pm-chain-detail-menu button{min-height:48px!important;padding:0 14px!important;border:0!important;border-radius:12px!important;background:transparent!important;font-size:14px!important;font-weight:700!important}
.pm-chain-menu button:hover,.pm-chain-detail-menu button:hover{background:var(--surface2)!important}
.pm-chain-detail-menu{top:auto!important}
/* Prompt-detail-equivalent footer. */
.pm-chain-detail-footer{display:block!important;margin-top:18px!important;padding:18px 0 6px!important;text-align:left!important}
.pm-chain-rating{display:block!important}
.pm-chain-rating:before{content:attr(data-label);display:block;color:var(--muted);font-size:10px;font-weight:800;letter-spacing:1.1px;margin-bottom:7px}
.pm-chain-rating .rating-stars{justify-content:flex-start!important;gap:7px!important}
.pm-chain-rating .rating-stars button{font-size:27px!important;padding:2px!important;min-width:0!important;min-height:0!important;color:var(--muted)!important}
.pm-chain-rating .rating-stars button.on{color:var(--gold)!important}
.pm-chain-rating-value,.pm-chain-rating-count{display:none!important}
.pm-chain-uses{display:block!important;border:0!important;padding:0!important;margin-top:12px!important;color:var(--muted)!important;font-weight:500!important;font-size:12px!important;text-align:center!important}
.pm-chain-use{margin-top:9px!important;border:1px solid var(--border)!important;background:var(--surface)!important;color:var(--text)!important;border-radius:14px!important;padding:14px!important;font-weight:700!important}
/* Chain selection participates in Library selection mode. */
.pm-chain-card.pm-select-mode{cursor:pointer!important}
.pm-chain-card .pm-chain-select-dot{position:absolute;z-index:12;top:14px;left:14px;width:27px;height:27px;border-radius:50%;display:grid;place-items:center;border:1px solid var(--border);background:var(--surface2);font-size:13px;font-weight:900;color:#111}
.pm-chain-card.pm-selected .pm-chain-select-dot{background:var(--gold);border-color:var(--gold)}
.pm-chain-card.pm-select-mode .pm-chain-top-actions{opacity:.28;pointer-events:none}
#pmSelectionBar.pm-chain-selection-active{display:flex!important;align-items:center!important;gap:10px!important;bottom:calc(var(--navH,76px) + env(safe-area-inset-bottom) + 12px)!important}
#pmSelectionBar .pm-selection-cancel{border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:12px;padding:10px 14px;font-weight:750}
`;
document.head.appendChild(s)}
function isSelectMode(){try{return !!selectMode}catch{return false}}
function selectionCount(){let n=chainSelected.size;try{n+=selectedIds.size}catch{}return n}
function syncSelection(){const on=isSelectMode();document.querySelectorAll("#list .pm-chain-card").forEach(card=>{const id=card.dataset.chainId;card.classList.toggle("pm-select-mode",on);card.classList.toggle("pm-selected",on&&chainSelected.has(id));let dot=card.querySelector(".pm-chain-select-dot");if(on&&!dot){dot=document.createElement("span");dot.className="pm-chain-select-dot";card.appendChild(dot)}if(dot){dot.hidden=!on;dot.textContent=chainSelected.has(id)?"✓":""}});const bar=$("pmSelectionBar");if(!bar)return;let cancel=bar.querySelector(".pm-selection-cancel");if(!cancel){cancel=document.createElement("button");cancel.type="button";cancel.className="pm-selection-cancel";cancel.addEventListener("click",()=>$("pmSelectToggle")?.click());bar.appendChild(cancel)}cancel.textContent=tx().cancel;const n=selectionCount();bar.hidden=!on;bar.classList.toggle("pm-chain-selection-active",on);const sum=$("pmSelectionSummary");if(sum)sum.textContent=`${n} ${tx().selected}`;const del=$("pmDeleteSelected");if(del){del.textContent=tx().delete;del.disabled=n===0}}
function syncMenus(){document.querySelectorAll(".pm-chain-card").forEach(card=>{const b=card.querySelector("[data-chain-menu]"),m=card.querySelector(".pm-chain-menu");if(b&&m&&!m.hidden){const cr=card.getBoundingClientRect(),br=b.getBoundingClientRect();m.style.top=`${Math.round(br.bottom-cr.top+10)}px`;m.style.right=`${Math.max(12,Math.round(cr.right-br.right))}px`;m.style.left="auto"}});const d=$("pmChainDetail");if(d?.open){const b=d.querySelector("[data-detail-menu]"),m=d.querySelector(".pm-chain-detail-menu"),sheet=d.querySelector(".pm-chain-detail-sheet");if(b&&m&&sheet&&!m.hidden){const br=b.getBoundingClientRect(),sr=sheet.getBoundingClientRect();m.style.top=`${Math.round(br.bottom-sr.top+12)}px`;m.style.right=`${Math.max(18,Math.round(sr.right-br.right))}px`;m.style.left="auto"}}}
function closeMenus(target){if(target?.closest?.(".pm-chain-menu,.pm-chain-detail-menu,[data-chain-menu],[data-detail-menu],#pmLibraryOverflowWrap"))return;document.querySelectorAll(".pm-chain-menu:not([hidden]),.pm-chain-detail-menu:not([hidden]),#pmLibraryMenu:not([hidden])").forEach(m=>m.hidden=true)}
function collapsedRail(card){const rail=card.querySelector(".pm-chain-rail"),line=rail?.querySelector(".pm-chain-line"),first=card.querySelector(".pm-chain-node.is-first");if(!rail||!line||!first)return;const rest=card.querySelector(".pm-chain-rest"),expanded=rest&&!rest.hidden&&getComputedStyle(rest).display!=="none";if(expanded)return;const rr=rail.getBoundingClientRect(),fr=first.getBoundingClientRect(),start=fr.top+fr.height/2-rr.top;const target=Math.max(start+42,card.getBoundingClientRect().height-rr.top-26);const end=start+(target-start)*.9;line.style.top=`${start}px`;line.style.height=`${Math.max(0,end-start)}px`;line.style.setProperty("--pm-rail-gold-end",`${Math.max(0,end-start-2)}px`);line.style.setProperty("--pm-rail-fade","20px")}
function align(){document.querySelectorAll("#list .pm-chain-card.pm-chain-polished").forEach(collapsedRail);const d=$("pmChainDetail");if(d?.open){const rating=d.querySelector(".pm-chain-rating");if(rating)rating.dataset.label=tx().rating;const c=d._pmChainData,uses=d.querySelector(".pm-chain-uses");if(c&&uses)uses.textContent=`${tx().used} ${Number(c.use_count)||0} ${tx().times}`}}
async function copyText(v){try{await navigator.clipboard.writeText(v);return true}catch{return false}}
async function directRate(btn){const d=$("pmChainDetail"),id=d?.dataset.chainId,c=d?._pmChainData;if(!d||!id||!c)return;const n=Number(btn.dataset.chainRate),value=Number(c.rating)===n?null:n;c.rating=value;d.querySelectorAll("[data-chain-rate]").forEach(x=>x.classList.toggle("on",Number(x.dataset.chainRate)<=Number(value||0)));try{const {error}=await supabaseClient.from("prompt_chains").update({rating:value,updated_at:new Date().toISOString()}).eq("id",id);if(error)throw error}catch(e){toast2(`${tx().rateFail}: ${e.message||e}`)}}
async function directUse(btn){const d=$("pmChainDetail"),id=d?.dataset.chainId,c=d?._pmChainData,first=c?.steps?.[0];if(!d||!id||!first)return;const urls={chatgpt:"https://chatgpt.com/",claude:"https://claude.ai/",gemini:"https://gemini.google.com/",grok:"https://grok.com/"},url=urls[c.platform];let w=null;if(url)try{w=window.open(url,"_blank")}catch{};if(!await copyText(first.content)){try{w?.close()}catch{};return}const old=Number(c.use_count)||0,next=old+1;c.use_count=next;const uses=d.querySelector(".pm-chain-uses");if(uses)uses.textContent=`${tx().used} ${next} ${tx().times}`;toast2(tx().copied);try{const {error}=await supabaseClient.from("prompt_chains").update({use_count:next,updated_at:new Date().toISOString()}).eq("id",id);if(error)throw error;if(url&&!w)location.href=url}catch(e){c.use_count=old;if(uses)uses.textContent=`${tx().used} ${old} ${tx().times}`;toast2(`${tx().useFail}: ${e.message||e}`)}}
async function deleteSelection(){const cids=[...chainSelected];let pids=[];try{pids=[...selectedIds]}catch{};if(!cids.length)return false;const total=cids.length+pids.length;if(!confirm(`${tx().delete} ${total} selected item${total===1?"":"s"}?`))return true;for(const id of cids){const {error}=await supabaseClient.from("prompt_chains").delete().eq("id",id);if(error){toast2(error.message);return true}}for(const id of pids){try{await del("prompts",id)}catch(e){toast2(e.message||e)}}chainSelected.clear();try{selectedIds.clear();selectMode=false}catch{};try{await refresh()}catch{};location.reload();return true}
function install(){css();syncSelection();align();const list=$("list");if(list)new MutationObserver(()=>requestAnimationFrame(()=>{syncSelection();align()})).observe(list,{childList:true,subtree:true,attributes:true,attributeFilter:["hidden","class"]});new MutationObserver(()=>requestAnimationFrame(()=>{syncSelection();align();syncMenus()})).observe(document.body,{childList:true,subtree:true});window.addEventListener("resize",()=>requestAnimationFrame(align));
 document.addEventListener("pointerdown",e=>closeMenus(e.target),true);
 document.addEventListener("click",e=>{const rate=e.target.closest("#pmChainDetail [data-chain-rate]");if(rate){e.preventDefault();e.stopImmediatePropagation();void directRate(rate);return}const use=e.target.closest("#pmChainDetail [data-chain-use]");if(use){e.preventDefault();e.stopImmediatePropagation();void directUse(use);return}const menu=e.target.closest("[data-chain-menu],[data-detail-menu]");if(menu)setTimeout(syncMenus,0);const card=e.target.closest("#list .pm-chain-card");if(card&&isSelectMode()){e.preventDefault();e.stopImmediatePropagation();const id=card.dataset.chainId;chainSelected.has(id)?chainSelected.delete(id):chainSelected.add(id);syncSelection();return}if(e.target.closest("#pmSelectToggle")){chainSelected.clear();setTimeout(syncSelection,0)}},true);
 document.addEventListener("click",e=>{if(e.target.closest("#pmDeleteSelected")&&chainSelected.size){e.preventDefault();e.stopImmediatePropagation();void deleteSelection()}},true);
 setTimeout(()=>{syncSelection();align()},120);setTimeout(()=>{syncSelection();align()},600)
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();
