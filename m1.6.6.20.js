(()=>{"use strict";
/* Prompt Manager M1.6.6.20 — clickable Featured cards + sharing across Explore */

const SHARE_ICON=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3"></path><path d="m8 7 4-4 4 4"></path><path d="M7 10H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2"></path></svg>`;
const lang=()=>localStorage.getItem("pm-language")||document.documentElement.lang||"en";
const shareLabel=()=>lang().startsWith("es")?"Compartir":lang().startsWith("sr")?"Podeli":"Share";
const copiedLabel=()=>lang().startsWith("es")?"✓ Copiado":lang().startsWith("sr")?"✓ Kopirano":"✓ Copied";
const sharedLabel=()=>lang().startsWith("es")?"✓ Compartido":lang().startsWith("sr")?"✓ Podeljeno":"✓ Shared";
const unavailableLabel=()=>lang().startsWith("es")?"No se puede compartir":lang().startsWith("sr")?"Deljenje nije dostupno":"Share unavailable";

function showToast(message){
  const el=document.getElementById("toast");
  if(!el)return;
  el.textContent=message;
  el.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer=setTimeout(()=>el.classList.remove("show"),1800);
}

function catalogPrompt(id){
  if(typeof catalogItem==="function"){
    const x=catalogItem(id);
    if(x)return x;
  }
  if(typeof catalog!=="undefined"&&Array.isArray(catalog)){
    return catalog.find(x=>String(x.id)===String(id))||null;
  }
  return null;
}

function catalogCategoryId(x){
  const raw=String(x?.category||"General");
  if(typeof slug==="function")return slug(raw)||"general";
  return raw.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"general";
}

function teaserFor(fullText){
  const full=String(fullText||"").trim();
  const target=Math.min(full.length,Math.max(120,Math.ceil(full.length*.20)));
  const searchStart=Math.max(0,target-48);
  const windowText=full.slice(searchStart,target+1);
  let end=target;
  const lastSpace=windowText.lastIndexOf(" ");
  if(lastSpace>0)end=searchStart+lastSpace;
  while(end>0&&/[.!?;:,\-—]/.test(full[end-1]))end--;
  return full.slice(0,end).trimEnd();
}

async function ensureCatalogShare(x){
  if(typeof supabaseClient==="undefined"||!supabaseClient)throw new Error("Cloud unavailable");
  const {data:{user},error:userError}=await supabaseClient.auth.getUser();
  if(userError)throw userError;
  if(!user)throw new Error("Sign in required");

  const fullText=String(x?.prompt||x?.content||x?.description||"").trim();
  if(!fullText)throw new Error("Prompt unavailable");

  // Reuse a public share for the same catalog prompt without saving it to Library.
  // source_name doubles as a stable catalog marker without requiring a schema change.
  const marker=`catalog:${String(x.id)}`;
  let shareSlug=null;

  const {data:existing,error:existingError}=await supabaseClient
    .from("prompt_shares")
    .select("slug")
    .eq("owner_user_id",user.id)
    .eq("source_name",marker)
    .eq("is_active",true)
    .limit(1);

  if(existingError)throw existingError;
  shareSlug=existing?.[0]?.slug||null;

  if(!shareSlug){
    const payload={
      owner_user_id:user.id,
      source_prompt_id:null,
      title:x.title||x.act||"Prompt",
      teaser:teaserFor(fullText),
      total_length:fullText.length,
      category_id:catalogCategoryId(x),
      platforms:["general"],
      source_name:marker
    };
    const {data:created,error:createError}=await supabaseClient
      .from("prompt_shares")
      .insert(payload)
      .select("slug")
      .single();
    if(createError)throw createError;
    shareSlug=created.slug;
  }else{
    // Keep the public metadata current if catalog copy changes.
    const {error:updateError}=await supabaseClient
      .from("prompt_shares")
      .update({
        title:x.title||x.act||"Prompt",
        teaser:teaserFor(fullText),
        total_length:fullText.length,
        category_id:catalogCategoryId(x),
        platforms:["general"]
      })
      .eq("slug",shareSlug)
      .eq("owner_user_id",user.id);
    if(updateError)throw updateError;
  }

  const {error:contentError}=await supabaseClient
    .from("prompt_share_contents")
    .upsert({share_slug:shareSlug,owner_user_id:user.id,content:fullText},{onConflict:"share_slug"});
  if(contentError)throw contentError;

  return `${location.origin}${location.pathname.replace(/[^/]*$/,"")}prompt/?s=${encodeURIComponent(shareSlug)}`;
}

async function shareCatalog(id,button){
  const x=catalogPrompt(id);
  if(!x){showToast(unavailableLabel());return}
  const original=button?.innerHTML;
  try{
    const url=await ensureCatalogShare(x);
    const data={title:x.title||"Prompt",text:`${x.title||"Prompt"} — shared via Prompt Manager`,url};
    if(navigator.share){
      await navigator.share(data);
      showToast(sharedLabel());
    }else{
      await navigator.clipboard.writeText(url);
      showToast(copiedLabel());
    }
  }catch(err){
    if(err?.name==="AbortError")return;
    console.error("Catalog prompt share failed",err);
    showToast(err?.message==="Sign in required"?(lang().startsWith("es")?"Inicia sesión para compartir":lang().startsWith("sr")?"Prijavi se da podeliš":"Sign in to share this prompt"):unavailableLabel());
  }finally{
    if(button&&original!=null)button.innerHTML=original;
  }
}

function addShareButton(actions,id){
  if(!actions||actions.querySelector("[data-pm-explore-share]"))return;
  const button=document.createElement("button");
  button.type="button";
  button.className="pm-explore-share";
  button.dataset.pmExploreShare=String(id);
  button.setAttribute("aria-label",shareLabel());
  button.setAttribute("title",shareLabel());
  button.innerHTML=SHARE_ICON;
  actions.appendChild(button);
}

function enhanceExploreCards(){
  const list=document.getElementById("exploreList");
  if(!list)return;

  list.querySelectorAll(".pm-featured-card").forEach(card=>{
    const open=card.querySelector("[data-explore-open]");
    if(!open)return;
    card.dataset.pmFeaturedOpen=String(open.dataset.exploreOpen);
    card.setAttribute("role","button");
    card.setAttribute("tabindex","0");
    addShareButton(card.querySelector(".pm-featured-actions"),open.dataset.exploreOpen);
  });

  list.querySelectorAll(".explore-card").forEach(card=>{
    const open=card.querySelector("[data-explore-open]");
    if(!open)return;
    addShareButton(card.querySelector(".actions"),open.dataset.exploreOpen);
  });
}

const list=document.getElementById("exploreList");
if(list){
  const observer=new MutationObserver(enhanceExploreCards);
  observer.observe(list,{childList:true,subtree:true});
  enhanceExploreCards();

  list.addEventListener("click",event=>{
    const share=event.target.closest("[data-pm-explore-share]");
    if(share){
      event.preventDefault();
      event.stopImmediatePropagation();
      void shareCatalog(share.dataset.pmExploreShare,share);
      return;
    }

    const card=event.target.closest(".pm-featured-card");
    if(!card)return;
    if(event.target.closest("button,a,input,textarea,select,video[controls]"))return;
    const open=card.querySelector("[data-explore-open]");
    if(open){
      event.preventDefault();
      event.stopImmediatePropagation();
      open.click();
    }
  },true);

  list.addEventListener("keydown",event=>{
    const card=event.target.closest(".pm-featured-card");
    if(!card||event.target!==card)return;
    if(event.key!=="Enter"&&event.key!==" ")return;
    event.preventDefault();
    card.querySelector("[data-explore-open]")?.click();
  },true);
}

new MutationObserver(()=>{
  document.querySelectorAll("[data-pm-explore-share]").forEach(button=>{
    button.setAttribute("aria-label",shareLabel());
    button.setAttribute("title",shareLabel());
  });
}).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});

})();