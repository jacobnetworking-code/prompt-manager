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
  $("shareTeaser").textContent=data.teaser;
  const rawBadges=[data.category_id,...(data.platforms||[])].filter(Boolean);
  const badges=[];for(const b of rawBadges){const label=b==="general"?(badges.length?"Multiplatform":"General"):b;if(!badges.some(x=>x.toLowerCase()===label.toLowerCase()))badges.push(label)}
  $("shareBadges").innerHTML=badges.map(x=>`<span class="platformbadge">${escapeHtml(x)}</span>`).join("");
  const {data:{session}}=await sb.auth.getSession();
  if(session)await unlock();
}
function fail(){$("shareLoading").hidden=true;$("shareError").hidden=false}
async function unlock(){
  const {data,error}=await sb.from("prompt_share_contents").select("content").eq("share_slug",slug).maybeSingle();
  if(error||!data)return;
  full=data.content;$("shareTeaser").hidden=true;$("shareLocked").hidden=true;$("shareFull").hidden=false;$("shareFull").textContent=full;
}
$("shareGoogle").onclick=()=>sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.href}});
$("shareEmail").onclick=()=>{const email=prompt("Email address");if(email)sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.href}})};
function escapeHtml(v){return String(v||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
sb.auth.onAuthStateChange((_e,s)=>{if(s)setTimeout(unlock,0)});
load();