/* Prompt Manager V2.0.38 — startup deadlock hotfix */
(()=>{"use strict";
const KEY="pm-offline-auth-v1",MIN=1800,AUTH_TIMEOUT=2500,start=performance.now(),$=id=>document.getElementById(id);
let resolved=false;
const marker=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||"null");return x?.userId?x:null}catch{return null}};
const remember=u=>{if(u?.id)try{localStorage.setItem(KEY,JSON.stringify({userId:u.id,lastVerifiedAt:Date.now()}))}catch{}};
const forget=()=>{try{localStorage.removeItem(KEY)}catch{}};
const minWait=()=>new Promise(r=>setTimeout(r,Math.max(0,MIN-(performance.now()-start))));
const timeout=ms=>new Promise((_,reject)=>setTimeout(()=>reject(new Error("auth startup timeout")),ms));
function loading(on){
 const l=$("pmAuthLoading"),g=$("authGate");
 if(on){if(g&&!g.hidden)g.hidden=true;if(l)l.hidden=false;document.documentElement.classList.add("pm-starting")}
 else{if(l)l.hidden=true;document.documentElement.classList.remove("pm-starting")}
}
function app(id){try{if(id&&!authUser)authUser={id}}catch{};const g=$("authGate");if(g&&!g.hidden)g.hidden=true;resolved=true;loading(false)}
function login(){resolved=true;loading(false);const g=$("authGate");if(g)g.hidden=false}
async function boot(){
 loading(true);
 const m=marker();
 if(!navigator.onLine){await minWait();return m?app(m.userId):login()}
 try{
   const result=await Promise.race([supabaseClient.auth.getSession(),timeout(AUTH_TIMEOUT)]);
   const session=result?.data?.session;
   if(session?.user){remember(session.user);await minWait();return app(session.user.id)}
 }catch(e){
   console.warn("Startup session check",e);
   // A previously verified account may still enter its local library if auth bootstrap is temporarily unavailable.
   if(m){await minWait();return app(m.userId)}
 }
 await minWait();login();
}
function install(){
 if(!document.querySelector('script[data-pm-v237]')){const s=document.createElement("script");s.src="./v237-ui.js";s.defer=true;s.dataset.pmV237="1";document.head.appendChild(s)}
 loading(true);
 const g=$("authGate");
 if(g)new MutationObserver(()=>{
   // Critical V2.0.38 fix: never write hidden=true when it is already true.
   // V2.0.37 re-wrote the observed attribute from inside its own observer and could starve timers indefinitely.
   if(!resolved&&document.documentElement.classList.contains("pm-starting")&&!g.hidden)g.hidden=true;
 }).observe(g,{attributes:true,attributeFilter:["hidden"]});
 void boot();
 try{supabaseClient?.auth?.onAuthStateChange((event,session)=>{if(event==="SIGNED_OUT"){forget();if(resolved)login()}else if(session?.user)remember(session.user)})}catch{}
 $("logoutBtn")?.addEventListener("click",forget,{capture:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();