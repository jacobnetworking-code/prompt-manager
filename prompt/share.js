const SUPABASE_URL="https://jqrqsztmcfqfnnzyfjge.supabase.co";
const SUPABASE_KEY="sb_publishable_NbuavLbNAb36kmfuWR_YjQ_zHr6U1Cc";
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);
const slug=new URLSearchParams(location.search).get("s");
let meta=null,full=null;

async function load(){
  if(!slug)return fail();
  const {data,error}=await sb.from("prompt_shares").select("slug,title,teaser,category_id,platforms,source_name").eq("slug",slug).eq("is_active",true).maybeSingle();
  if(error||!data)return fail();
  meta=data;$("shareLoading").hidden=true;$("shareCard").hidden=false;
  $("shareTitle").textContent=data.title;
  $("shareTeaser").textContent=data.teaser;buildSyntheticBlur(data.teaser);
  const rawBadges=[data.category_id,...(data.platforms||[])].filter(Boolean);
  const badges=[];for(const b of rawBadges){const label=b==="general"?(badges.length?"Multiplatform":"General"):b;if(!badges.some(x=>x.toLowerCase()===label.toLowerCase()))badges.push(label)}
  $("shareBadges").innerHTML=badges.map(x=>`<span class="platformbadge">${escapeHtml(x)}</span>`).join("");
  const {data:{session}}=await sb.auth.getSession();
  if(session)await unlock();
}
function fail(){$("shareLoading").hidden=true;$("shareError").hidden=false}

function buildSyntheticBlur(teaserText){
  const wrap=$("shareLocked")?.querySelector(".pm-blur-lines");
  if(!wrap)return;

  const teaser=String(teaserText||"").replace(/\s+/g," ").trim();
  const targetChars=Math.max(520,Math.min(2200,teaser.length*4));

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
$("shareEmail").onclick=()=>{const email=prompt("Email address");if(email)sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.href}})};
$("shareClose").onclick=()=>{location.href="../"};
function escapeHtml(v){return String(v||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
sb.auth.onAuthStateChange((_e,s)=>{if(s)setTimeout(unlock,0)});
load();