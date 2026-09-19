/* Prompt Manager V2.0.28 — complete normal-prompt editor */
(()=>{"use strict";
const q=id=>document.getElementById(id);
const escapeHtml=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
let target=null;
function modelsOf(p){return window.pmModelSupport?.modelsOf?window.pmModelSupport.modelsOf(p):(Array.isArray(p?.models)?p.models:[])}
function parseModels(s){return window.pmModelSupport?.parse?window.pmModelSupport.parse(s):String(s||"").split(",").map(x=>x.trim()).filter(Boolean)}
function dialog(){
 let d=q("pmFullEditDialog");if(d)return d;
 d=document.createElement("dialog");d.id="pmFullEditDialog";
 d.innerHTML=`<section class="sheet"><div class="sheethead"><div><small>EDIT PROMPT</small><h3>Edit</h3></div><button type="button" class="round" data-full-edit-close>×</button></div><div class="pm-edit-grid">
 <label>Title<input id="pmFullEditTitle" maxlength="80"></label>
 <label>Prompt<textarea id="pmFullEditContent"></textarea></label>
 <label>Category<select id="pmFullEditCategory"></select></label>
 <label>Platform<select id="pmFullEditPlatform"></select></label>
 <label>Model <em>optional</em><input id="pmFullEditModels" maxlength="400" placeholder="Multimodel or models separated by commas"></label>
 <label>Source URL <em>optional</em><input id="pmFullEditSource" type="url" inputmode="url"></label>
 <button class="full primary" type="button" id="pmFullEditSave">Save changes</button></div></section>`;
 document.body.appendChild(d);
 d.addEventListener("click",e=>{if(e.target.closest("[data-full-edit-close]"))d.close()});
 d.addEventListener("pointerdown",e=>{if(e.target===d)d.close()});
 q("pmFullEditSave").addEventListener("click",save);
 return d;
}
function open(p){
 target=p;if(!p)return;const d=dialog();
 q("pmFullEditCategory").innerHTML=(categories||[]).map(c=>`<option value="${escapeHtml(c.id)}">${escapeHtml(typeof catName==="function"?catName(c.id):c.name)}</option>`).join("");
 q("pmFullEditPlatform").innerHTML=Object.entries(PLATFORMS||{}).map(([id,name])=>`<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`).join("");
 q("pmFullEditTitle").value=p.title||"";q("pmFullEditContent").value=p.content||"";q("pmFullEditSource").value=p.source||"";
 q("pmFullEditCategory").value=categoryId(p);q("pmFullEditPlatform").value=platformsOf(p)[0]||"general";q("pmFullEditModels").value=modelsOf(p).join(", ");
 d.showModal();
}
async function save(){
 if(!target)return;const b=q("pmFullEditSave"),title=q("pmFullEditTitle").value.trim(),content=q("pmFullEditContent").value.trim();
 if(!title||!content){toast("Title and prompt are required");return}
 b.disabled=true;
 try{
   target={...target,title,content,source:q("pmFullEditSource").value.trim(),categoryId:q("pmFullEditCategory").value||"general",platforms:[q("pmFullEditPlatform").value||"general"],models:parseModels(q("pmFullEditModels").value),updatedAt:Date.now()};
   await put("prompts",target);await refresh();q("pmFullEditDialog").close();toast("Prompt updated");
 }catch(e){console.error("Prompt edit failed",e);toast("Could not save changes")}finally{b.disabled=false}
}
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-pm-edit]");if(!b)return;
 const p=(prompts||[]).find(x=>String(x.id)===String(b.dataset.pmEdit));if(!p)return;
 e.preventDefault();e.stopImmediatePropagation();open(p);
},true);
})();