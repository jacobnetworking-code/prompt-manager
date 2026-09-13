"use strict";
/* Prompt Manager — consolidated product UI
   Stable filename from M1.7.3 onward. Version history lives in Git.
   Historical modules intentionally retain their IIFE boundaries and load order. */


/* ===== M1.6.6.19 ===== */
(()=>{"use strict";
const LANG_KEY="pm-language";
const LANGS={en:{label:"English",flag:"🇬🇧"},es:{label:"Español",flag:"🇪🇸"},sr:{label:"Srpski",flag:"🇷🇸"}};

function upgradeLanguageSettings(){
  const section=document.getElementById("pmLanguageSection");
  if(!section||section.dataset.pmSelectEnhanced==="1")return;
  section.dataset.pmSelectEnhanced="1";

  const legacy=section.querySelector(".pm-language-options");
  if(legacy){
    legacy.hidden=true;
    legacy.classList.add("pm-language-legacy-options");
  }

  const wrap=document.createElement("div");
  wrap.className="pm-language-select-control";
  const select=document.createElement("select");
  select.id="pmLanguageSelect";
  select.setAttribute("aria-label","Language");
  Object.entries(LANGS).forEach(([code,lang])=>{
    const option=document.createElement("option");
    option.value=code;
    option.textContent=`${lang.flag}  ${lang.label}`;
    select.appendChild(option);
  });
  select.value=LANGS[localStorage.getItem(LANG_KEY)]?localStorage.getItem(LANG_KEY):"en";
  wrap.appendChild(select);
  section.appendChild(wrap);

  select.addEventListener("change",()=>{
    const button=legacy?.querySelector(`[data-pm-language="${select.value}"]`);
    if(button)button.click();
    else{
      localStorage.setItem(LANG_KEY,select.value);
      location.reload();
    }
  });

  section.addEventListener("click",()=>{
    queueMicrotask(()=>{
      const value=localStorage.getItem(LANG_KEY)||"en";
      if(LANGS[value])select.value=value;
    });
  });
}

function syncExpandedBrand(){
  const brand=document.querySelector(".brand");
  if(!brand)return;
  brand.dataset.pmExpandedBrand="1";
}

function init(){
  upgradeLanguageSettings();
  syncExpandedBrand();

  const settings=document.getElementById("settingsDialog");
  if(settings){
    new MutationObserver(()=>{
      if(settings.open)upgradeLanguageSettings();
    }).observe(settings,{attributes:true,attributeFilter:["open"]});
  }

  new MutationObserver(upgradeLanguageSettings).observe(document.body,{childList:true,subtree:true});
}

init();
})();


/* ===== M1.6.6.20 ===== */
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


/* ===== M1.6.6.21 ===== */
(()=>{"use strict";
/* Prompt Manager M1.6.6.21 — Featured "View" + compact detail actions */

const SAVE_ICON=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.8L6 21V4.8Z"></path></svg>`;
const SHARE_ICON=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3"></path><path d="m8 7 4-4 4 4"></path><path d="M7 10H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2"></path></svg>`;

let openedCatalogId=null;

const language=()=>localStorage.getItem("pm-language")||"en";
const labels=()=> {
  const l=language();
  if(l==="es") return {view:"Ver",save:"Guardar en Biblioteca",saved:"Guardado",share:"Compartir"};
  if(l==="sr") return {view:"Otvori",save:"Sačuvaj u Biblioteku",saved:"Sačuvano",share:"Podeli"};
  return {view:"View",save:"Save to Library",saved:"Saved",share:"Share"};
};

function getCatalog(id){
  if(id==null)return null;
  if(typeof catalogItem==="function")return catalogItem(id);
  return Array.isArray(window.catalog)?window.catalog.find(x=>String(x.id)===String(id)):null;
}

function isCatalogSaved(x){
  if(!x)return false;
  if(typeof catalogSaved==="function")return catalogSaved(x);
  return false;
}

function decorateFeaturedView(){
  const l=labels();
  document.querySelectorAll("#exploreList .pm-featured-card [data-explore-open]").forEach(b=>{
    b.textContent=l.view;
  });
}

function ensureDetailActions(){
  const dialog=document.getElementById("useDialog");
  const head=dialog?.querySelector(".sheethead");
  const close=document.getElementById("useClose");
  if(!dialog||!head||!close)return null;

  let actions=document.getElementById("pmUseActions");
  if(actions)return actions;

  actions=document.createElement("div");
  actions.id="pmUseActions";
  actions.className="pm-use-actions";
  actions.innerHTML=`
    <button type="button" id="pmUseSave" class="pm-use-icon-action" aria-label="Save" title="Save">${SAVE_ICON}</button>
    <button type="button" id="pmUseShare" class="pm-use-icon-action" aria-label="Share" title="Share">${SHARE_ICON}</button>
  `;
  close.parentNode.insertBefore(actions,close);
  return actions;
}

function currentLibraryPrompt(){
  if(openedCatalogId!=null)return null;
  if(typeof currentPrompt!=="undefined" && currentPrompt?.id!=null)return currentPrompt;
  return null;
}

function syncDetailActions(){
  ensureDetailActions();
  const save=document.getElementById("pmUseSave");
  const share=document.getElementById("pmUseShare");
  if(!save||!share)return;

  const l=labels();
  const x=getCatalog(openedCatalogId);
  const libraryPrompt=currentLibraryPrompt();

  const saved = x ? isCatalogSaved(x) : !!libraryPrompt;
  save.classList.toggle("is-saved",saved);
  save.disabled=saved;
  save.setAttribute("aria-label",saved?l.saved:l.save);
  save.title=saved?l.saved:l.save;
  share.setAttribute("aria-label",l.share);
  share.title=l.share;
}

async function saveOpenedCatalog(){
  const x=getCatalog(openedCatalogId);
  if(!x||typeof saveCatalog!=="function")return;
  await saveCatalog(x);
  syncDetailActions();
}

function shareOpenedPrompt(){
  if(openedCatalogId!=null){
    const b=document.querySelector(`#exploreList [data-pm-explore-share="${CSS.escape(String(openedCatalogId))}"]`);
    if(b){ b.click(); return; }
  }

  const p=currentLibraryPrompt();
  if(p?.id!=null){
    const b=document.querySelector(`#list [data-pm-share="${CSS.escape(String(p.id))}"]`);
    if(b){ b.click(); return; }
  }
}

const exploreList=document.getElementById("exploreList");
if(exploreList){
  exploreList.addEventListener("click",e=>{
    const open=e.target.closest("[data-explore-open]");
    if(open)openedCatalogId=String(open.dataset.exploreOpen);
  },true);

  new MutationObserver(()=>{
    decorateFeaturedView();
    if(document.getElementById("useDialog")?.open)syncDetailActions();
  }).observe(exploreList,{childList:true,subtree:true});

  decorateFeaturedView();
}

document.getElementById("list")?.addEventListener("click",e=>{
  if(e.target.closest("[data-use]"))openedCatalogId=null;
},true);

const useDialog=document.getElementById("useDialog");
if(useDialog){
  ensureDetailActions();
  new MutationObserver(()=>{
    if(useDialog.open)syncDetailActions();
  }).observe(useDialog,{attributes:true,attributeFilter:["open"]});
}

document.getElementById("pmUseSave")?.addEventListener("click",e=>{
  e.preventDefault();
  e.stopPropagation();
  void saveOpenedCatalog();
});
document.getElementById("pmUseShare")?.addEventListener("click",e=>{
  e.preventDefault();
  e.stopPropagation();
  shareOpenedPrompt();
});

window.addEventListener("storage",()=>{decorateFeaturedView();syncDetailActions()});
})();


/* ===== M1.6.6.22 fixed in M1.6.6.23 ===== */
(()=>{"use strict";
/* Prompt Manager M1.6.6.22 — editorial Featured descriptions.
   Featured is discovery/editorial UI: describe the outcome instead of exposing prompt copy. */

const COPY={
  en:{
    "pc-017":"Builds polished image-generation prompts from a simple idea by structuring the subject, style, composition, lighting and visual details.",
    "pc-021":"Creates cinematic arrival sequences with controlled movement, atmosphere and visual storytelling for AI video generation.",
    "pc-019":"Creates premium, photorealistic portraits with controlled lighting, composition and detailed facial rendering.",
    "pm-056":"Transforms architectural ideas into refined visual concepts with stronger composition, materials, lighting and presentation.",
    "pm-059":"Creates high-end fashion editorial imagery with deliberate styling, art direction, lighting and magazine-ready composition.",
    "pm-055":"Develops clean, distinctive logo concepts with stronger visual direction, simplicity and brand-ready presentation."
  },
  es:{
    "pc-017":"Convierte una idea sencilla en un prompt de imagen bien estructurado, definiendo sujeto, estilo, composición, iluminación y detalles visuales.",
    "pc-021":"Crea secuencias cinematográficas de llegada con movimiento, atmósfera y narrativa visual controlados para generación de vídeo con IA.",
    "pc-019":"Crea retratos premium y fotorrealistas con iluminación controlada, buena composición y un alto nivel de detalle facial.",
    "pm-056":"Transforma ideas arquitectónicas en conceptos visuales refinados, mejorando composición, materiales, iluminación y presentación.",
    "pm-059":"Crea imágenes editoriales de moda de alta gama con estilismo, dirección artística, iluminación y composición de revista.",
    "pm-055":"Desarrolla conceptos de logo limpios y distintivos con una dirección visual clara, simplicidad y acabado preparado para marca."
  },
  sr:{
    "pc-017":"Pretvara jednostavnu ideju u strukturisan prompt za generisanje slike, definišući subjekat, stil, kompoziciju, osvetljenje i vizuelne detalje.",
    "pc-021":"Kreira filmske scene dolaska sa kontrolisanim pokretom, atmosferom i vizuelnim pripovedanjem za AI generisanje videa.",
    "pc-019":"Kreira premium fotorealistične portrete sa kontrolisanim osvetljenjem, kompozicijom i detaljnim prikazom lica.",
    "pm-056":"Pretvara arhitektonske ideje u doterane vizuelne koncepte sa boljom kompozicijom, materijalima, osvetljenjem i prezentacijom.",
    "pm-059":"Kreira vrhunske modne editorijale sa promišljenim stilom, umetničkim pravcem, osvetljenjem i kompozicijom spremnom za magazin.",
    "pm-055":"Razvija čiste i prepoznatljive koncepte logotipa sa jasnijim vizuelnim pravcem, jednostavnošću i prezentacijom spremnom za brend."
  }
};

const lang=()=>{
  const x=localStorage.getItem("pm-language")||"en";
  return COPY[x]?x:"en";
};

function applyFeaturedDescriptions(){
  const descriptions=COPY[lang()];
  document.querySelectorAll("#exploreList .pm-featured-card").forEach(card=>{
    const open=card.querySelector("[data-explore-open]");
    const p=card.querySelector(".pm-featured-body > p");
    if(!open||!p)return;
    const text=descriptions[String(open.dataset.exploreOpen)];
    if(text && (p.textContent!==text || p.dataset.pmFeaturedDescription!=="true")){
      p.textContent=text;
      p.dataset.pmFeaturedDescription="true";
    }
  });
}

const list=document.getElementById("exploreList");
if(list){
  new MutationObserver(applyFeaturedDescriptions).observe(list,{childList:true,subtree:true});
  applyFeaturedDescriptions();
}

window.addEventListener("storage",applyFeaturedDescriptions);
document.addEventListener("change",e=>{
  if(e.target?.id==="pmLanguageSelect")setTimeout(applyFeaturedDescriptions,0);
},true);
})();


/* ===== M1.6.6.24 ===== */
(()=>{"use strict";
/* Prompt Manager M1.6.6.24
   Offline UX + reconnect session revalidation.
   Offline access is never granted by this file: app.js remains authoritative.
   A user can reach the local app offline only when Supabase restores a persisted session. */

const COPY={
  en:{
    offline:"Offline · Local library",
    back:"Back online · Syncing…",
    online:"Back online",
    share:"Share requires internet",
    signin:"Sign in requires internet",
    expired:"Session expired · Sign in again"
  },
  es:{
    offline:"Sin internet · Biblioteca local",
    back:"Conexión recuperada · Sincronizando…",
    online:"Conexión recuperada",
    share:"Compartir requiere internet",
    signin:"Iniciar sesión requiere internet",
    expired:"Sesión caducada · Inicia sesión de nuevo"
  },
  sr:{
    offline:"Bez interneta · Lokalna biblioteka",
    back:"Internet je ponovo dostupan · Sinhronizacija…",
    online:"Internet je ponovo dostupan",
    share:"Deljenje zahteva internet",
    signin:"Prijava zahteva internet",
    expired:"Sesija je istekla · Prijavi se ponovo"
  }
};

function language(){
  const raw=(localStorage.getItem("pm-language")||document.documentElement.lang||"en").toLowerCase();
  if(raw.startsWith("es"))return "es";
  if(raw.startsWith("sr"))return "sr";
  return "en";
}
const text=key=>COPY[language()][key]||COPY.en[key];

let hideTimer=0;
function indicator(){
  let el=document.getElementById("pmConnectivity");
  if(el)return el;
  el=document.createElement("div");
  el.id="pmConnectivity";
  el.setAttribute("role","status");
  el.setAttribute("aria-live","polite");
  document.body.appendChild(el);
  return el;
}
function showState(state,message,{persist=false,timeout=2600}={}){
  const el=indicator();
  clearTimeout(hideTimer);
  el.dataset.state=state;
  el.textContent=message;
  el.dataset.visible="true";
  if(!persist){
    hideTimer=setTimeout(()=>{el.dataset.visible="false"},timeout);
  }
}
function setOfflineUI(){
  document.documentElement.dataset.pmOffline="true";
  showState("offline",text("offline"),{persist:true});
}
function setOnlineUI(){
  delete document.documentElement.dataset.pmOffline;
  showState("online",text("back"),{persist:false,timeout:3000});
}

/* Existing app toast, when available. */
function notify(message){
  try{
    if(typeof toast==="function"){toast(message);return}
  }catch{}
  showState(navigator.onLine?"online":"offline",message,{persist:false,timeout:2600});
}

/* Network-only actions fail clearly instead of throwing or appearing broken. */
window.addEventListener("click",event=>{
  if(navigator.onLine)return;
  const share=event.target?.closest?.("[data-pm-explore-share],[data-pm-share],#pmUseShare");
  if(share){
    event.preventDefault();
    event.stopImmediatePropagation();
    notify(text("share"));
    return;
  }
  const signIn=event.target?.closest?.("#googleSignIn,#emailSignIn");
  if(signIn){
    event.preventDefault();
    event.stopImmediatePropagation();
    notify(text("signin"));
  }
},true);

async function invalidateLocalSession(){
  try{
    if(typeof supabaseClient!=="undefined" && supabaseClient?.auth){
      await supabaseClient.auth.signOut({scope:"local"});
    }
  }catch(err){
    console.warn("Local sign-out cleanup failed",err);
  }
  try{
    if(typeof applyAuthSession==="function")applyAuthSession(null);
  }catch{}
}

/* Revalidate the persisted offline session against Supabase before cloud sync. */
async function revalidateAndSync(){
  setOnlineUI();
  try{
    if(typeof supabaseClient==="undefined" || !supabaseClient?.auth)return;

    const {data,error}=await supabaseClient.auth.getUser();
    if(error || !data?.user){
      await invalidateLocalSession();
      notify(text("expired"));
      return;
    }

    /* Refresh the app's authoritative auth state with the verified user/session. */
    const {data:sessionData}=await supabaseClient.auth.getSession();
    const session=sessionData?.session||null;
    if(!session){
      await invalidateLocalSession();
      notify(text("expired"));
      return;
    }

    if(typeof applyAuthSession==="function")applyAuthSession(session);
    if(typeof authUser!=="undefined")authUser=session.user;

    if(typeof syncCloudLibrary==="function"){
      await syncCloudLibrary({silent:true});
    }

    showState("online",text("online"),{persist:false,timeout:1800});
  }catch(err){
    /* Connection may be nominally online while the network is still unreachable.
       Do not destroy a locally persisted session on a transport failure. */
    console.warn("Reconnect validation/sync deferred",err);
    showState("offline",text("offline"),{persist:true});
    document.documentElement.dataset.pmOffline="true";
  }
}

window.addEventListener("offline",setOfflineUI);
window.addEventListener("online",()=>{void revalidateAndSync()});

if(navigator.onLine){
  delete document.documentElement.dataset.pmOffline;
}else{
  setOfflineUI();
}

/* Keep the persistent offline label localized if the user changes language. */
window.addEventListener("storage",()=>{
  if(!navigator.onLine)setOfflineUI();
});
document.addEventListener("change",event=>{
  if(event.target?.id==="pmLanguageSelect" && !navigator.onLine){
    setTimeout(setOfflineUI,0);
  }
},true);
})();


/* ===== M1.6.6.25 ===== */
(()=>{"use strict";
const SAVE_ICON=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 4.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v17L12 18l-5.5 3.5z"></path></svg>`;
const SHARE_ICON=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3"></path><path d="m8 7 4-4 4 4"></path><path d="M7 10H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2"></path></svg>`;
let openedCatalogId=null;

function language(){
  const raw=(localStorage.getItem("pm-language")||document.documentElement.lang||"en").toLowerCase();
  if(raw.startsWith("es"))return"es";
  if(raw.startsWith("sr"))return"sr";
  return"en";
}
function label(key){
  const copy={
    en:{save:"Save to Library",saved:"Saved",share:"Share",shareMissing:"Share unavailable"},
    es:{save:"Guardar en Biblioteca",saved:"Guardado",share:"Compartir",shareMissing:"No se puede compartir"},
    sr:{save:"Sačuvaj u biblioteci",saved:"Sačuvano",share:"Podeli",shareMissing:"Deljenje nije dostupno"}
  };
  return copy[language()][key];
}
function showToast(message){
  try{if(typeof toast==="function"){toast(message);return}}catch{}
  const el=document.getElementById("toast");
  if(!el)return;
  el.textContent=message;el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"),1800);
}
function item(id){
  try{if(typeof catalogItem==="function")return catalogItem(id)}catch{}
  try{
    if(typeof catalog!=="undefined"&&Array.isArray(catalog))
      return catalog.find(x=>String(x.id)===String(id))||null;
  }catch{}
  return null;
}
function isSaved(x){
  if(!x)return false;
  try{if(typeof catalogSaved==="function")return!!catalogSaved(x)}catch{}
  try{
    return Array.isArray(prompts)&&prompts.some(p=>p.acquisitionType==="catalog"&&String(p.externalId)===String(x.id));
  }catch{}
  return false;
}
function decorateExploreCards(){
  const list=document.getElementById("exploreList");
  if(!list)return;
  list.querySelectorAll(".explore-card,.pm-featured-card").forEach(card=>{
    const open=card.querySelector("[data-explore-open]");
    if(!open)return;
    card.dataset.pmOpenCard="true";
    card.setAttribute("role","button");
    if(!card.hasAttribute("tabindex"))card.setAttribute("tabindex","0");
  });
}
function ensureDetailActions(){
  const dialog=document.getElementById("useDialog");
  const head=dialog?.querySelector(".sheethead");
  const close=document.getElementById("useClose");
  if(!head||!close)return null;

  let actions=document.getElementById("pmCatalogUseActions");
  if(actions)return actions;

  document.getElementById("pmUseActions")?.remove();

  actions=document.createElement("div");
  actions.id="pmCatalogUseActions";
  actions.hidden=true;
  actions.innerHTML=`
    <button id="pmCatalogUseSave" class="pm-detail-icon" type="button">${SAVE_ICON}</button>
    <button id="pmCatalogUseShare" class="pm-detail-icon" type="button">${SHARE_ICON}</button>`;
  head.insertBefore(actions,close);

  const save=actions.querySelector("#pmCatalogUseSave");
  const share=actions.querySelector("#pmCatalogUseShare");

  save.addEventListener("click",async e=>{
    e.preventDefault();e.stopPropagation();
    const x=item(openedCatalogId);
    if(!x)return;
    if(isSaved(x)){syncDetailActions();return}
    try{
      if(typeof saveCatalog!=="function")throw new Error("Save unavailable");
      await saveCatalog(x);
      syncDetailActions();
    }catch(err){
      console.error("Catalog detail save failed",err);
      showToast(err?.message||"Save unavailable");
    }
  });

  share.addEventListener("click",e=>{
    e.preventDefault();e.stopPropagation();
    const id=String(openedCatalogId||"");
    const selectorId=window.CSS?.escape?CSS.escape(id):id.replace(/["\\]/g,"\\$&");
    const proxy=document.querySelector(`#exploreList [data-pm-explore-share="${selectorId}"]`);
    if(proxy){proxy.click();return}
    showToast(label("shareMissing"));
  });

  return actions;
}
function syncDetailActions(){
  const actions=ensureDetailActions();
  if(!actions)return;
  const dialog=document.getElementById("useDialog");
  const x=openedCatalogId!=null?item(openedCatalogId):null;
  const visible=!!(dialog?.open&&x);
  actions.hidden=!visible;
  if(!visible)return;

  const save=actions.querySelector("#pmCatalogUseSave");
  const share=actions.querySelector("#pmCatalogUseShare");
  const saved=isSaved(x);

  save.dataset.saved=saved?"true":"false";
  save.disabled=saved;
  save.setAttribute("aria-label",saved?label("saved"):label("save"));
  save.setAttribute("title",saved?label("saved"):label("save"));
  share.setAttribute("aria-label",label("share"));
  share.setAttribute("title",label("share"));
}

const list=document.getElementById("exploreList");
if(list){
  list.addEventListener("click",event=>{
    const directOpen=event.target.closest("[data-explore-open]");
    if(directOpen){
      openedCatalogId=String(directOpen.dataset.exploreOpen);
      setTimeout(syncDetailActions,0);
      return;
    }

    const card=event.target.closest(".explore-card,.pm-featured-card");
    if(!card)return;
    if(event.target.closest("button,a,input,textarea,select,video[controls]"))return;

    const open=card.querySelector("[data-explore-open]");
    if(!open)return;

    event.preventDefault();
    event.stopImmediatePropagation();
    openedCatalogId=String(open.dataset.exploreOpen);
    open.click();
    setTimeout(syncDetailActions,0);
  },true);

  list.addEventListener("keydown",event=>{
    const card=event.target.closest(".explore-card,.pm-featured-card");
    if(!card||event.target!==card)return;
    if(event.key!=="Enter"&&event.key!==" ")return;
    const open=card.querySelector("[data-explore-open]");
    if(!open)return;
    event.preventDefault();
    openedCatalogId=String(open.dataset.exploreOpen);
    open.click();
    setTimeout(syncDetailActions,0);
  },true);

  new MutationObserver(()=>{
    decorateExploreCards();
    if(document.getElementById("useDialog")?.open)syncDetailActions();
  }).observe(list,{childList:true,subtree:true});
  decorateExploreCards();
}

document.getElementById("list")?.addEventListener("click",event=>{
  if(event.target.closest("[data-use]")){
    openedCatalogId=null;
    setTimeout(syncDetailActions,0);
  }
},true);

const useDialog=document.getElementById("useDialog");
if(useDialog){
  ensureDetailActions();
  new MutationObserver(syncDetailActions).observe(useDialog,{attributes:true,attributeFilter:["open"]});
  useDialog.addEventListener("close",()=>{openedCatalogId=null;syncDetailActions()});
}

window.addEventListener("storage",syncDetailActions);
document.addEventListener("change",event=>{
  if(event.target?.id==="pmLanguageSelect")setTimeout(syncDetailActions,0);
},true);
})();


/* ===== M1.7.0 ===== */
(()=>{"use strict";const M=500;let rows=[],heads=[],map={},file=null;const q=id=>document.getElementById(id),n=s=>String(s??"").trim(),k=s=>n(s).toLowerCase().replace(/[\s_-]+/g,""),eh=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function reset(){rows=[];heads=[];map={};file=null;q("bulkImportFile").value="";q("importPick").hidden=false;q("importPreview").hidden=true;q("importResult").hidden=true}
function csv(t){let a=[],r=[],f="",z=false;for(let i=0;i<t.length;i++){let c=t[i],d=t[i+1];if(z){if(c=='"'&&d=='"'){f+='"';i++}else if(c=='"')z=false;else f+=c}else if(c=='"')z=true;else if(c==","){r.push(f);f=""}else if(c=="\n"){r.push(f);a.push(r);r=[];f=""}else if(c!="\r")f+=c}r.push(f);if(r.some(n))a.push(r);return a}
function fromCSV(t){let a=csv(t);if(!a.length)return[];let known=["prompt","content","text","title","name","category","platform","source","url"],hdr=a[0].some(x=>known.includes(k(x)));heads=hdr?a[0].map((x,i)=>n(x)||`Column ${i+1}`):a[0].map((_,i)=>`Column ${i+1}`);return(hdr?a.slice(1):a).filter(r=>r.some(n)).map(r=>Object.fromEntries(heads.map((h,i)=>[h,r[i]??""])))}
function fromJSON(t){let x=JSON.parse(t),a=Array.isArray(x)?x:Array.isArray(x.prompts)?x.prompts:[x];if(a.every(x=>typeof x=="string")){heads=["prompt"];return a.map(prompt=>({prompt}))}a=a.filter(x=>x&&typeof x=="object"&&!Array.isArray(x));heads=[...new Set(a.flatMap(Object.keys))];return a}
function automap(){let A={prompt:["prompt","content","text","instruction","instructions"],title:["title","name"],category:["category","type","topic"],platform:["platform","platforms","model","tool"],source:["sourceurl","source","url","link"]};map={};for(let [f,as]of Object.entries(A)){let h=heads.find(x=>as.includes(k(x)));if(h)map[f]=h}if(!map.prompt&&heads.length==1)map.prompt=heads[0]}
const val=(o,f)=>n(map[f]?o[map[f]]:"");
function title(p,i){let s=p.replace(/\s+/g," ").split(/[.!?\n]/)[0].replace(/^(please|act as|you are|create|write|generate)\s+/i,"").trim();return(s.split(/\s+/).slice(0,8).join(" ")||`Imported Prompt ${i+1}`).slice(0,80)}
function cat(p){let t=p.toLowerCase(),R=[["Coding",/\b(code|developer|javascript|python|typescript|sql|api|debug)\b/],["Marketing",/\b(marketing|linkedin|seo|campaign|brand|sales|copywriting)\b/],["Writing",/\b(write|writing|article|blog|email|story|rewrite)\b/],["Image",/\b(image|photo|midjourney|visual|portrait|illustration)\b/],["Video",/\b(video|cinematic|film|storyboard)\b/],["Research",/\b(research|analy[sz]e|study|investigate|compare)\b/],["Productivity",/\b(productivity|plan|schedule|workflow|organize|task)\b/]];return R.find(x=>x[1].test(t))?.[0]||"General"}
function platform(x){x=x.toLowerCase();return["chatgpt","claude","gemini","grok","midjourney"].find(p=>x.includes(p))||"general"}
function normalized(){let old=new Set;try{for(let p of prompts||[])old.add(n(p.content).toLowerCase().replace(/\s+/g," "))}catch{}let seen=new Set;return rows.map((o,i)=>{let content=val(o,"prompt"),sig=content.toLowerCase().replace(/\s+/g," "),dup=!!content&&(old.has(sig)||seen.has(sig));if(content)seen.add(sig);return{valid:!!content,dup,title:val(o,"title")||title(content,i),content,category:val(o,"category")||cat(content),platform:platform(val(o,"platform")),source:val(o,"source")}})}
function mapping(){let F=[["prompt","Prompt text *"],["title","Title"],["category","Category"],["platform","Platform"],["source","Source URL"]];q("importMapping").innerHTML=F.map(([f,l])=>`<label class="pm-import-field"><span>${l}</span><select data-map="${f}"><option value="">${f=="prompt"?"Select column":"Auto / none"}</option>${heads.map(h=>`<option value="${eh(h)}"${map[f]==h?" selected":""}>${eh(h)}</option>`).join("")}</select></label>`).join("")}
function preview(){let a=normalized(),ok=a.filter(x=>x.valid&&!x.dup),du=a.filter(x=>x.dup).length,bad=a.filter(x=>!x.valid).length;q("importCount").textContent=`${rows.length} prompt${rows.length==1?"":"s"} detected`;q("importName").textContent=file?.name||"";q("importRows").innerHTML=a.slice(0,30).map(x=>`<div class="pm-import-row" data-state="${x.dup?"duplicate":x.valid?"ready":"error"}"><div><strong>${eh(x.title||"Untitled")}</strong><small>${eh(x.content||"Missing prompt text")}</small></div><em>${x.dup?"Duplicate":x.valid?eh(x.category):"Error"}</em></div>`).join("");q("importHint").textContent=`${ok.length} ready${du?` · ${du} duplicate${du==1?"":"s"} skipped`:""}${bad?` · ${bad} error${bad==1?"":"s"}`:""}.`;q("importConfirm").disabled=!map.prompt||!ok.length}
async function load(f){if(!f)return;if(f.size>5e6){toast("Maximum file size is 5 MB");return}try{let t=await f.text();rows=f.name.toLowerCase().endsWith(".json")?fromJSON(t):fromCSV(t);if(!rows.length)throw Error("No prompts found");if(rows.length>M)throw Error(`Maximum is ${M} prompts per file`);file=f;automap();q("importPick").hidden=true;q("importPreview").hidden=false;mapping();preview()}catch(e){console.error(e);toast(e.message||"Could not read file")}}
async function run(){let a=normalized().filter(x=>x.valid&&!x.dup),b=q("importConfirm"),done=0,fail=0;b.disabled=true;b.textContent="Importing…";for(let x of a)try{let cid="general";try{cid=(categories||[]).find(c=>String(c.name||c.id).toLowerCase()==x.category.toLowerCase())?.id||slug(x.category)||"general"}catch{}await add("prompts",{title:x.title,content:x.content,source:x.source,categoryId:cid,createdAt:Date.now(),platforms:[x.platform],useCount:0,lastUsedAt:null,acquisitionType:"manual",sourceName:"Bulk import",externalId:null});done++}catch(e){console.error(e);fail++}await refresh();q("importPreview").hidden=true;q("importResult").hidden=false;q("importResultText").textContent=`${done} imported${rows.length-done-fail?` · ${rows.length-done-fail} skipped`:""}${fail?` · ${fail} failed`:""}.`;b.disabled=false;b.textContent="Import to Library"}
q("openBulkImport")?.addEventListener("click",()=>{reset();q("settingsDialog")?.close();q("profileMenu")?.close();q("bulkImportDialog")?.showModal()});q("bulkImportClose")?.addEventListener("click",()=>q("bulkImportDialog").close());q("importDone")?.addEventListener("click",()=>q("bulkImportDialog").close());q("importReset")?.addEventListener("click",reset);q("bulkImportFile")?.addEventListener("change",e=>load(e.target.files?.[0]));q("importMapping")?.addEventListener("change",e=>{if(e.target?.dataset?.map){map[e.target.dataset.map]=e.target.value;preview()}});q("importConfirm")?.addEventListener("click",run)})();


/* ===== M1.7.1 ===== */
(()=>{"use strict";
/* M1.7.1 — settings label repair + Library import shortcut */

const IMPORT_ICON=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"></path><path d="m7.5 10.5 4.5 4.5 4.5-4.5"></path><path d="M5 19h14"></path></svg>`;

function currentLanguage(){
  const raw=(localStorage.getItem("pm-language")||document.documentElement.lang||"en").toLowerCase();
  if(raw.startsWith("es"))return"es";
  if(raw.startsWith("sr"))return"sr";
  return"en";
}

function copy(){
  const lang=currentLanguage();
  return {
    en:{import:"Import Prompts",backup:"Backup & Restore",diagnostics:"Storage Diagnostics",importTitle:"Import prompts"},
    es:{import:"Importar prompts",backup:"Copia de seguridad y restauración",diagnostics:"Diagnóstico de almacenamiento",importTitle:"Importar prompts"},
    sr:{import:"Uvezi promptove",backup:"Backup i vraćanje",diagnostics:"Dijagnostika skladišta",importTitle:"Uvezi promptove"}
  }[lang];
}

function setRowLabel(id,text){
  const row=document.getElementById(id);
  const label=row?.querySelector("span:first-child");
  if(label&&label.textContent!==text)label.textContent=text;
}

function repairSettingsLabels(){
  const c=copy();
  setRowLabel("openBulkImport",c.import);
  setRowLabel("openBackup",c.backup);
  setRowLabel("openDiagnostics",c.diagnostics);
}

function ensureLibraryImport(){
  const actions=document.querySelector(".pm-library-head-actions");
  const add=document.getElementById("libraryAdd");
  if(!actions||!add)return;
  if(document.getElementById("pmLibraryImport"))return;

  const button=document.createElement("button");
  button.type="button";
  button.id="pmLibraryImport";
  button.className="pm-library-import";
  button.setAttribute("aria-label",copy().importTitle);
  button.setAttribute("title",copy().importTitle);
  button.innerHTML=IMPORT_ICON;

  button.addEventListener("click",event=>{
    event.preventDefault();
    event.stopPropagation();
    document.getElementById("openBulkImport")?.click();
  });

  actions.insertBefore(button,add);
}

function sync(){
  repairSettingsLabels();
  ensureLibraryImport();
  const b=document.getElementById("pmLibraryImport");
  if(b){
    b.setAttribute("aria-label",copy().importTitle);
    b.setAttribute("title",copy().importTitle);
  }
}

sync();

const settings=document.getElementById("settingsDialog");
if(settings){
  new MutationObserver(sync).observe(settings,{subtree:true,childList:true,attributes:true,attributeFilter:["open"]});
}

const library=document.getElementById("libraryView");
if(library){
  new MutationObserver(sync).observe(library,{subtree:true,childList:true});
}

document.addEventListener("change",event=>{
  if(event.target?.id==="pmLanguageSelect")setTimeout(sync,0);
},true);

window.addEventListener("storage",sync);
})();


/* ===== M1.7.2 ===== */
(()=>{"use strict";
/* M1.7.2 — Library More menu + category management */

const ICONS={
  select:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h8"></path><path d="m16 17 2 2 3-4"></path></svg>`,
  categories:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v5H4zM14 15h6v5h-6z"></path></svg>`,
  import:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"></path><path d="m7.5 10.5 4.5 4.5 4.5-4.5"></path><path d="M5 19h14"></path></svg>`,
  edit:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z"></path><path d="m13.5 6.5 4 4"></path></svg>`,
  trash:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"></path><path d="M9 7V4h6v3"></path><path d="M7 7l1 13h8l1-13"></path></svg>`
};

function lang(){
  const x=(localStorage.getItem("pm-language")||document.documentElement.lang||"en").toLowerCase();
  return x.startsWith("es")?"es":x.startsWith("sr")?"sr":"en";
}

function tx(){
  return {
    en:{more:"More",select:"Select",categories:"Edit categories",import:"Import prompts",title:"Edit Categories",newCategory:"New category",add:"Add",generalProtected:"General cannot be deleted",created:"Category created",renamed:"Category updated",deleted:"Category deleted",duplicate:"Category already exists",invalid:"Use letters or numbers",confirmDelete:"Delete this category? Its prompts will be moved to General."},
    es:{more:"Más",select:"Seleccionar",categories:"Editar categorías",import:"Importar prompts",title:"Editar categorías",newCategory:"Nueva categoría",add:"Añadir",generalProtected:"General no se puede eliminar",created:"Categoría creada",renamed:"Categoría actualizada",deleted:"Categoría eliminada",duplicate:"La categoría ya existe",invalid:"Usa letras o números",confirmDelete:"¿Eliminar esta categoría? Sus prompts se moverán a General."},
    sr:{more:"Više",select:"Izaberi",categories:"Uredi kategorije",import:"Uvezi promptove",title:"Uredi kategorije",newCategory:"Nova kategorija",add:"Dodaj",generalProtected:"General se ne može obrisati",created:"Kategorija kreirana",renamed:"Kategorija ažurirana",deleted:"Kategorija obrisana",duplicate:"Kategorija već postoji",invalid:"Koristi slova ili brojeve",confirmDelete:"Obrisati ovu kategoriju? Njeni promptovi će biti premešteni u General."}
  }[lang()];
}

function showToast(s){
  try{toast(s)}catch{
    const el=document.getElementById("toast");
    if(el){el.textContent=s;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1800)}
  }
}

function closeMenu(){
  const menu=document.getElementById("pmLibraryMenu");
  if(menu)menu.hidden=true;
}

function ensureMoreMenu(){
  const actions=document.querySelector(".pm-library-head-actions");
  const add=document.getElementById("libraryAdd");
  if(!actions||!add)return;

  let wrap=document.getElementById("pmLibraryOverflowWrap");
  if(wrap)return;

  wrap=document.createElement("div");
  wrap.id="pmLibraryOverflowWrap";
  wrap.className="pm-library-overflow-wrap";

  const more=document.createElement("button");
  more.type="button";
  more.id="pmLibraryMore";
  more.className="pm-library-more";
  more.setAttribute("aria-haspopup","menu");
  more.setAttribute("aria-expanded","false");
  more.textContent="…";

  const menu=document.createElement("div");
  menu.id="pmLibraryMenu";
  menu.className="pm-library-menu";
  menu.hidden=true;
  menu.setAttribute("role","menu");
  menu.innerHTML=`
    <button type="button" data-pm-library-action="select">${ICONS.select}<span></span></button>
    <button type="button" data-pm-library-action="categories">${ICONS.categories}<span></span></button>
    <button type="button" data-pm-library-action="import">${ICONS.import}<span></span></button>`;

  more.addEventListener("click",e=>{
    e.preventDefault();e.stopPropagation();
    menu.hidden=!menu.hidden;
    more.setAttribute("aria-expanded",menu.hidden?"false":"true");
  });

  menu.addEventListener("click",e=>{
    const b=e.target.closest("[data-pm-library-action]");
    if(!b)return;
    e.preventDefault();e.stopPropagation();
    closeMenu();

    if(b.dataset.pmLibraryAction==="select"){
      document.getElementById("pmSelectToggle")?.click();
      return;
    }
    if(b.dataset.pmLibraryAction==="import"){
      document.getElementById("openBulkImport")?.click();
      return;
    }
    if(b.dataset.pmLibraryAction==="categories"){
      openCategoryManager();
    }
  });

  wrap.append(more,menu);

  // Replace the old Select + Import controls visually, keeping their hidden buttons
  // alive as authoritative behavior hooks.
  actions.insertBefore(wrap,add);
  translateMenu();
}

function translateMenu(){
  const t=tx();
  const more=document.getElementById("pmLibraryMore");
  if(more){more.setAttribute("aria-label",t.more);more.setAttribute("title",t.more)}
  const map={select:t.select,categories:t.categories,import:t.import};
  document.querySelectorAll("#pmLibraryMenu [data-pm-library-action]").forEach(b=>{
    const s=b.querySelector("span");
    if(s)s.textContent=map[b.dataset.pmLibraryAction]||"";
  });
  const title=document.querySelector("#pmCategoryManagerDialog .sheethead h3");
  if(title)title.textContent=t.title;
  const input=document.getElementById("pmCategoryManagerNewName");
  if(input)input.placeholder=t.newCategory;
  const add=document.getElementById("pmCategoryManagerAdd");
  if(add)add.textContent=t.add;
}

function categoryCount(id){
  try{return (prompts||[]).filter(p=>(p.categoryId||"general")===id).length}catch{return 0}
}

function displayName(c){
  try{
    if(typeof displayCategory==="function")return displayCategory(c.name||c.id);
  }catch{}
  return c.name||c.id;
}

function renderCategoryManager(){
  const list=document.getElementById("pmCategoryManagerList");
  if(!list)return;
  const cats=[...(categories||[])].sort((a,b)=>{
    if(a.id==="general")return -1;
    if(b.id==="general")return 1;
    return String(a.name||a.id).localeCompare(String(b.name||b.id));
  });

  list.innerHTML=cats.map(c=>`
    <div class="pm-category-manager-row" data-category-row="${esc(c.id)}">
      <div>
        <div class="pm-category-manager-name">${esc(displayName(c))}</div>
        <div class="pm-category-manager-count">${categoryCount(c.id)} prompt${categoryCount(c.id)===1?"":"s"}</div>
      </div>
      <div></div>
      <div class="pm-category-manager-actions">
        <button type="button" data-category-edit="${esc(c.id)}" aria-label="Edit" title="Edit">${ICONS.edit}</button>
        <button type="button" class="pm-danger" data-category-delete="${esc(c.id)}" aria-label="Delete" title="Delete"${c.id==="general"?" disabled":""}>${ICONS.trash}</button>
      </div>
    </div>`).join("");
}

function openCategoryManager(){
  translateMenu();
  renderCategoryManager();
  document.getElementById("pmCategoryManagerDialog")?.showModal();
}

async function addCategory(){
  const input=document.getElementById("pmCategoryManagerNewName");
  const name=(input?.value||"").trim();
  if(!name)return;
  const id=slug(name);
  const t=tx();
  if(!id){showToast(t.invalid);return}
  if((categories||[]).some(c=>c.id===id||String(c.name).toLowerCase()===name.toLowerCase())){showToast(t.duplicate);return}

  await put("categories",{id,name:name.slice(0,40),createdAt:Date.now(),system:false});
  categories=await all("categories");
  input.value="";
  await refresh();
  renderCategoryManager();
  showToast(t.created);
}

function startEdit(id){
  const c=(categories||[]).find(x=>x.id===id);
  const row=document.querySelector(`[data-category-row="${CSS.escape(id)}"]`);
  if(!c||!row)return;
  row.classList.add("pm-category-editing");
  row.innerHTML=`
    <input data-category-edit-input="${esc(id)}" type="text" maxlength="40" value="${esc(c.name||c.id)}">
    <div class="pm-category-edit-actions">
      <button type="button" data-category-edit-cancel="${esc(id)}">Cancel</button>
      <button type="button" class="primary" data-category-edit-save="${esc(id)}">Save</button>
    </div>`;
  const input=row.querySelector("input");
  input?.focus();
  input?.select();
}

async function saveEdit(id){
  const c=(categories||[]).find(x=>x.id===id);
  const input=document.querySelector(`[data-category-edit-input="${CSS.escape(id)}"]`);
  const name=(input?.value||"").trim();
  const t=tx();
  if(!c||!name)return;
  if((categories||[]).some(x=>x.id!==id&&String(x.name).toLowerCase()===name.toLowerCase())){showToast(t.duplicate);return}
  await put("categories",{...c,name:name.slice(0,40)});
  categories=await all("categories");
  await refresh();
  renderCategoryManager();
  showToast(t.renamed);
}

async function deleteCategory(id){
  if(id==="general"){showToast(tx().generalProtected);return}
  const c=(categories||[]).find(x=>x.id===id);
  if(!c)return;
  if(!confirm(tx().confirmDelete))return;

  // Preserve prompt integrity: reassign affected prompts before removing category.
  const affected=(prompts||[]).filter(p=>(p.categoryId||"general")===id);
  for(const p of affected){
    p.categoryId="general";
    await put("prompts",p);
  }

  await del("categories",id);
  categories=await all("categories");
  if(typeof activeCategory!=="undefined"&&activeCategory===id)activeCategory="all";
  await refresh();
  renderCategoryManager();
  showToast(tx().deleted);
}

document.getElementById("pmCategoryManagerClose")?.addEventListener("click",()=>document.getElementById("pmCategoryManagerDialog")?.close());
document.getElementById("pmCategoryManagerAdd")?.addEventListener("click",addCategory);
document.getElementById("pmCategoryManagerNewName")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();addCategory()}});

document.getElementById("pmCategoryManagerList")?.addEventListener("click",async e=>{
  const edit=e.target.closest("[data-category-edit]");
  const delBtn=e.target.closest("[data-category-delete]");
  const cancel=e.target.closest("[data-category-edit-cancel]");
  const save=e.target.closest("[data-category-edit-save]");
  if(edit)return startEdit(edit.dataset.categoryEdit);
  if(delBtn)return deleteCategory(delBtn.dataset.categoryDelete);
  if(cancel)return renderCategoryManager();
  if(save)return saveEdit(save.dataset.categoryEditSave);
});

document.addEventListener("click",e=>{
  if(!e.target.closest("#pmLibraryOverflowWrap"))closeMenu();
},true);

document.addEventListener("change",e=>{
  if(e.target?.id==="pmLanguageSelect")setTimeout(()=>{translateMenu();renderCategoryManager()},0);
},true);

const library=document.getElementById("libraryView");
if(library)new MutationObserver(ensureMoreMenu).observe(library,{childList:true,subtree:true});

ensureMoreMenu();
translateMenu();
})();
/* What's New — user-visible M1.7 capabilities */
(()=>{
"use strict";

const COPY={
  en:{
    kicker:"WHAT'S NEW",
    title:"Your library, more flexible.",
    copy:"Import prompt collections in bulk, manage your categories directly from Library, and keep access to your local prompts when you're offline.",
    highlights:["Bulk Import","Category Management","Offline Library"]
  },
  es:{
    kicker:"NOVEDADES",
    title:"Tu biblioteca, más flexible.",
    copy:"Importa colecciones de prompts de golpe, gestiona tus categorías directamente desde Biblioteca y accede a tus prompts locales incluso sin conexión.",
    highlights:["Importación masiva","Gestión de categorías","Biblioteca offline"]
  },
  sr:{
    kicker:"NOVO",
    title:"Fleksibilnija biblioteka.",
    copy:"Uvezi kolekcije promptova odjednom, upravljaj kategorijama direktno iz Biblioteke i pristupi lokalnim promptovima čak i bez interneta.",
    highlights:["Masovni uvoz","Upravljanje kategorijama","Offline biblioteka"]
  }
};

function language(){
  const raw=(localStorage.getItem("pm-language")||document.documentElement.lang||"en").toLowerCase();
  if(raw.startsWith("es"))return"es";
  if(raw.startsWith("sr"))return"sr";
  return"en";
}

function updateWhatsNew(){
  const card=document.querySelector(".pm-whats-new");
  if(!card)return;
  const c=COPY[language()];
  const kicker=card.querySelector("[data-pm-whats-kicker]");
  const version=card.querySelector(".pm-version");
  const title=card.querySelector("[data-pm-whats-title]");
  const copy=card.querySelector("[data-pm-whats-copy]");
  const list=card.querySelector("ul");

  if(kicker)kicker.textContent=c.kicker;
  if(version)version.textContent="V1.7";
  if(title)title.textContent=c.title;
  if(copy)copy.textContent=c.copy;
  if(list)list.innerHTML=c.highlights.map(x=>`<li>${x}</li>`).join("");
}

updateWhatsNew();

const home=document.getElementById("homeView");
if(home){
  new MutationObserver(updateWhatsNew).observe(home,{childList:true,subtree:true});
}

document.addEventListener("change",event=>{
  if(event.target?.id==="pmLanguageSelect")setTimeout(updateWhatsNew,0);
},true);
window.addEventListener("storage",updateWhatsNew);
})();
