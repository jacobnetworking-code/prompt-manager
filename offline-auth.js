/* Prompt Manager V2.0.36 — deterministic startup gate + offline authorization */
(()=>{"use strict";
const MARKER_KEY="pm-offline-auth-v1";
const MIN_SPLASH_MS=1800;
const startedAt=performance.now();
const $=id=>document.getElementById(id);
function marker(){try{const x=JSON.parse(localStorage.getItem(MARKER_KEY)||"null");return x?.userId?x:null}catch{return null}}
function setMarker(user){if(user?.id)try{localStorage.setItem(MARKER_KEY,JSON.stringify({userId:user.id,lastVerifiedAt:Date.now()}))}catch{}}
function clearMarker(){try{localStorage.removeItem(MARKER_KEY)}catch{}}
function waitMin(){return new Promise(ok=>setTimeout(ok,Math.max(0,MIN_SPLASH_MS-(performance.now()-startedAt))))}
function showSplash(){
 const l=$("pmAuthLoading"),g=$("authGate");
 if(g)g.hidden=true;
 if(l){l.hidden=false;l.setAttribute("aria-busy","true")}
 document.body.classList.add("pm-auth-pending");
}
function hideSplash(){
 const l=$("pmAuthLoading");if(l){l.hidden=true;l.setAttribute("aria-busy","false")}
 document.body.classList.remove("pm-auth-pending");
}
function showLogin(){const g=$("authGate");if(g)g.hidden=false;hideSplash()}
function showApp(userId){
 if(userId)try{if(typeof authUser!=="undefined"&&!authUser)authUser={id:userId}}catch{}
 const g=$("authGate");if(g)g.hidden=true;
 hideSplash();
 document.body.classList.toggle("pm-offline-authenticated",!navigator.onLine);
}
async function resolve(){
 showSplash();
 const local=marker();

 // Offline is deterministic: a previously verified account gets local access;
 // an unknown device gets Login only after the startup splash.
 if(!navigator.onLine){
   await waitMin();
   local?showApp(local.userId):showLogin();
   return;
 }

 // Online: prefer the persisted Supabase session and refresh the offline marker.
 try{
   if(typeof supabaseClient!=="undefined"&&supabaseClient?.auth){
     const {data,error}=await supabaseClient.auth.getSession();
     if(error)throw error;
     const session=data?.session||null;
     if(session?.user){
       setMarker(session.user);
       await waitMin();showApp(session.user.id);return;
     }
   }
 }catch(e){console.warn("Auth startup check failed",e)}

 await waitMin();showLogin();
}
function install(){
 if(!document.querySelector('script[data-pm-v236-menu]')){
   const s=document.createElement("script");s.src="./prompt-menu-v236.js";s.defer=true;s.dataset.pmV236Menu="true";document.head.appendChild(s);
 }
 showSplash();
 resolve();

 // Prevent competing legacy bootstrap code from flashing Login while startup is unresolved.
 const gate=$("authGate");
 if(gate)new MutationObserver(()=>{if(document.body.classList.contains("pm-auth-pending")&&!gate.hidden)gate.hidden=true}).observe(gate,{attributes:true,attributeFilter:["hidden"]});

 try{
   if(typeof supabaseClient!=="undefined"&&supabaseClient?.auth){
     supabaseClient.auth.onAuthStateChange((event,session)=>{
       if(event==="SIGNED_OUT"){clearMarker();return}
       if(session?.user)setMarker(session.user);
     });
   }
 }catch{}
 $("logoutBtn")?.addEventListener("click",clearMarker,{capture:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();