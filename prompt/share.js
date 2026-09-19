const SUPABASE_URL="https://jqrqsztmcfqfnnzyfjge.supabase.co";
const SUPABASE_KEY="sb_publishable_NbuavLbNAb36kmfuWR_YjQ_zHr6U1Cc";
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);
const slug=new URLSearchParams(location.search).get("s");
const LANG_KEY="pm-language";
const LANGS={
  en:{flag:"🇺🇸",loading:"Loading prompt…",unavailable:"This shared prompt is unavailable.",preview:"Prompt Preview",unlock:"Unlock this prompt free",unlockCopy:"Sign in to see the full prompt and save it.",google:"Continue with Google",email:"Continue with email",via:"{ } Shared via Prompt Manager",close:"Close",emailPrompt:"Email address",general:"General",multiplatform:"Multiplatform"},
  es:{flag:"🇪🇸",loading:"Cargando prompt…",unavailable:"Este prompt compartido no está disponible.",preview:"Vista previa del prompt",unlock:"Desbloquea este prompt gratis",unlockCopy:"Inicia sesión para ver el prompt completo y guardarlo.",google:"Continuar con Google",email:"Continuar con email",via:"{ } Compartido vía Prompt Manager",close:"Cerrar",emailPrompt:"Dirección de email",general:"General",multiplatform:"Multiplataforma"},
  sr:{flag:"🇷🇸",loading:"Učitavanje prompta…",unavailable:"Ovaj deljeni prompt nije dostupan.",preview:"Pregled prompta",unlock:"Otključaj ovaj prompt besplatno",unlockCopy:"Prijavi se da vidiš ceo prompt i sačuvaš ga.",google:"Nastavi sa Google",email:"Nastavi putem emaila",via:"{ } Podeljeno putem Prompt Manager-a",close:"Zatvori",emailPrompt:"Email adresa",general:"Opšte",multiplatform:"Više platformi"}
};
let currentLang=LANGS[localStorage.getItem(LANG_KEY)]?localStorage.getItem(LANG_KEY):"en";
let meta=null,full=null;

function t(key){return LANGS[currentLang]?.[key]||LANGS.en[key]||key}
function applyLanguage(){
  document.documentElement.lang=currentLang;
  $("shareLanguageFlag").textContent=t("flag");
  $("shareLanguageButton").setAttribute("aria-label",currentLang==="es"?"Idioma":currentLang==="sr"?"Jezik":"Language");
  $("shareLoading").textContent=t("loading");
  $("shareError").textContent=t("unavailable");
  $("sharePreviewLabel").textContent=t("preview");
  $("shareUnlockTitle").textContent=t("unlock");
  $("shareUnlockCopy").textContent=t("unlockCopy");
  $("shareGoogle").textContent=t("google");
  $("shareEmail").textContent=t("email");
  $("shareVia").textContent=t("via");
  $("shareClose").setAttribute("aria-label",t("close"));
  if(meta)renderBadges();
}

function renderBadges(){
  const rawBadges=[meta.category_id,...(meta.platforms||[])].filter(Boolean);
  const badges=[];
  for(const b of rawBadges){
    const label=b==="general"?(badges.length?t("multiplatform"):t("general")):b;
    if(!badges.some(x=>x.toLowerCase()===String(label).toLowerCase()))badges.push(label);
  }
  $("shareBadges").innerHTML=badges.map(x=>`<span class="platformbadge">${escapeHtml(x)}</span>`).join("");
}

async function load(){
  if(!slug)return fail();
  const {data,error}=await sb.from("prompt_shares").select("slug,title,teaser,total_length,category_id,platforms,source_name").eq("slug",slug).eq("is_active",true).maybeSingle();
  if(error||!data)return fail();
  meta=data;$("shareLoading").hidden=true;$("shareCard").hidden=false;
  $("shareTitle").textContent=data.title;
  $("shareTeaser").textContent=data.teaser;buildSyntheticBlur(data.teaser,data.total_length);
  renderBadges();
  const {data:{session}}=await sb.auth.getSession();
  if(session)await unlock();
}
function fail(){$("shareLoading").hidden=true;$("shareError").hidden=false}

function buildSyntheticBlur(teaserText,totalLength){
  const wrap=$("shareLocked")?.querySelector(".pm-blur-lines");
  if(!wrap)return;

  const teaser=String(teaserText||"").replace(/\s+/g," ").trim();
  const hiddenTarget=Math.max(0,(Number(totalLength)||teaser.length*5)-teaser.length);
  const targetChars=Math.max(220,Math.min(5000,hiddenTarget));

  const source=[
    "Continue by defining the visual direction, environment, composition, lighting, camera perspective, materials, texture, color atmosphere, and overall mood with enough specificity to guide a high quality result. ",
    "Keep the subject coherent with the scene and preserve believable proportions, natural detail, realistic surfaces, consistent shadows, depth, and physical relationships between all visible elements. ",
    "Use intentional framing, clean hierarchy, balanced negative space, subtle imperfections, controlled contrast, and a polished but natural finish without unnecessary artifacts or distracting elements. ",
    "Maintain continuity across the full result so every detail feels deliberate, visually consistent, and professionally art directed while preserving a realistic sense of scale and atmosphere. ",
    "The final output should feel specific, refined, immersive, cohesive, and production ready, with no added text, watermarks, interface elements, or unrelated objects. "
  ].join("");

  let fake="";
  while(fake.length<targetChars) fake+=source;
  wrap.textContent=fake.slice(0,targetChars).trim();
}

async function unlock(){
  const {data,error}=await sb.from("prompt_share_contents").select("content").eq("share_slug",slug).maybeSingle();
  if(error||!data)return;
  full=data.content;document.body.classList.add("pm-share-authenticated");
  $("shareTeaser").hidden=true;$("shareLocked").hidden=true;$("shareFull").hidden=false;$("shareFull").textContent=full;
  $("shareClose").hidden=false;
}
$("shareGoogle").onclick=()=>sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.href}});
$("shareEmail").onclick=()=>{const email=prompt(t("emailPrompt"));if(email)sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.href}})};
$("shareClose").onclick=()=>{location.href="../"};
function escapeHtml(v){return String(v||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

const langButton=$("shareLanguageButton");
const langMenu=$("shareLanguageMenu");
langButton.onclick=()=>{
  const next=langMenu.hidden;
  langMenu.hidden=!next;
  langButton.setAttribute("aria-expanded",String(next));
};
langMenu.onclick=e=>{
  const button=e.target.closest("[data-share-lang]");
  if(!button)return;
  currentLang=button.dataset.shareLang;
  localStorage.setItem(LANG_KEY,currentLang);
  langMenu.hidden=true;
  langButton.setAttribute("aria-expanded","false");
  applyLanguage();
};
document.addEventListener("click",e=>{
  if(e.target.closest(".pm-share-language"))return;
  langMenu.hidden=true;
  langButton.setAttribute("aria-expanded","false");
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){langMenu.hidden=true;langButton.setAttribute("aria-expanded","false")}
});

sb.auth.onAuthStateChange((_e,s)=>{if(s)setTimeout(unlock,0)});
applyLanguage();
load();