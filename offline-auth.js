/* Prompt Manager V2.0.37 — startup coordinator */
(()=>{"use strict";
const KEY="pm-offline-auth-v1",MIN=2000,start=performance.now(),$=id=>document.getElementById(id);
let resolved=false;
const marker=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||"null");return x?.userId?x:null}catch{return null}};
const remember=u=>{if(u?.id)try{localStorage.setItem(KEY,JSON.stringify({userId:u.id,lastVerifiedAt:Date.now()}))}catch{}};
const forget=()=>{try{localStorage.removeItem(KEY)}catch{}};
const wait=()=>new Promise(r=>setTimeout(r,Math.max(0,MIN-(performance.now()-start))));
function loading(on=true){
 const l=$("pmAuthLoading"),g=$("authGate");
 if(on){if(g)g.hidden=true;if(l)l.hidden=false;document.documentElement.classList.add("pm-starting")}
 else{if(l)l.hidden=true;document.documentElement.classList.remove("pm-starting")}
}
function app(id){if(id)try{authUser=authUser||{id}}catch{};const g=$("authGate");if(g)g.hidden=true;loading(false);resolved=true}
function login(){const g=$("authGate");if(g)g.hidden=false;loading(false);resolved=true}
async function boot(){
 loading(true);
 const m=marker();
 if(!navigator.onLine){await wait();m?app(m.userId):login();return}
 try{
  const {data,error}=await supabaseClient.auth.getSession();
  if(error)throw error;
  if(data?.session?.user){remember(data.session.user);await wait();app(data.session.user.id);return}
 }catch(e){console.warn("Startup session check",e)}
 await wait();login();
}
function install(){
 // V2.0.37 UI patch is loaded by a file already present in index, so it works online and is cached for offline.
 if(!document.querySelector('script[data-pm-v237]')){const s=document.createElement("script");s.src="./v237-ui.js";s.defer=true;s.dataset.pmV237="1";document.head.appendChild(s)}
 loading(true);
 // Legacy app.js may try to reveal authGate during its own async auth path. Suppress that only while boot is unresolved.
 const g=$("authGate");if(g)new MutationObserver(()=>{if(!resolved&&document.documentElement.classList.contains("pm-starting"))g.hidden=true}).observe(g,{attributes:true,attributeFilter:["hidden"]});
 void boot();
 try{supabaseClient?.auth?.onAuthStateChange((event,session)=>{if(event==="SIGNED_OUT"){forget();if(resolved)login()}else if(session?.user)remember(session.user)})}catch{}
 $("logoutBtn")?.addEventListener("click",forget,{capture:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();