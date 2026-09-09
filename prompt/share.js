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

  const normalized=String(teaserText||"").replace(/\s+/g," ").trim();
  const visibleApproxLines=Math.max(2,Math.ceil(normalized.length/42));
  const targetLines=Math.max(10,Math.min(30,visibleApproxLines*4));

  const syntheticBlocks=[
    "Style: cinematic realism, premium detail, natural texture, intentional composition.",
    "Subject: [SUBJECT] with clearly defined posture, expression, wardrobe, and visual hierarchy.",
    "Lighting: soft directional key light, subtle rim light, realistic reflections, controlled contrast.",
    "Camera: medium-format look, shallow depth of field, crisp focal plane, natural lens falloff.",
    "Environment: [LOCATION] with grounded materials, believable atmosphere, and contextual detail.",
    "Composition: strong foreground-background separation, clean negative space, balanced framing.",
    "Color: restrained palette, realistic skin tones, subtle filmic response, no artificial oversaturation.",
    "Details: preserve anatomy, texture, fabric behavior, reflections, scale, and physical plausibility.",
    "Mood: confident, polished, contemporary, editorial, immersive, and visually cohesive.",
    "Output: photorealistic, high detail, natural imperfections, no text, no watermark, no UI elements."
  ];

  wrap.innerHTML="";
  let lines=0;
  let i=0;
  while(lines<targetLines){
    const p=document.createElement("p");
    p.className="pm-blur-prompt-text";
    p.textContent=syntheticBlocks[i%syntheticBlocks.length];
    wrap.appendChild(p);
    lines+=Math.max(1,Math.ceil(p.textContent.length/46));
    i++;
  }
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