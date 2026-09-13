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