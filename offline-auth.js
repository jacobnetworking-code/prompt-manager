/* Prompt Manager — offline authenticated access + auth language controls */
(()=>{"use strict";
const MARKER_KEY="pm-offline-auth-v1";
const LANG_KEY="pm-language";
const COPY={
 en:{subtitle:"Sign in to continue",google:"Continue with Google",or:"or",email:"Email",send:"Send magic link",placeholder:"you@example.com",offline:"Offline · Local library"},
 es:{subtitle:"Inicia sesión para continuar",google:"Continuar con Google",or:"o",email:"Email",send:"Enviar enlace mágico",placeholder:"tu@ejemplo.com",offline:"Sin conexión · Biblioteca local"},
 sr:{subtitle:"Prijavi se da nastaviš",google:"Nastavi sa Google",or:"ili",email:"Email",send:"Pošalji magic link",placeholder:"ti@primer.com",offline:"Van mreže · Lokalna biblioteka"}
};
const $=id=>document.getElementById(id);
function lang(){const v=localStorage.getItem(LANG_KEY)||"en";return COPY[v]?v:"en"}
function readMarker(){try{const x=JSON.parse(localStorage.getItem(MARKER_KEY)||"null");return x&&x.userId?x:null}catch{return null}}
function writeMarker(user){
 if(!user?.id)return;
 try{
   localStorage.setItem(MARKER_KEY,JSON.stringify({userId:user.id,lastVerifiedAt:Date.now()}));
   document.dispatchEvent(new CustomEvent("pm:auth-verified",{detail:{userId:user.id}}));
 }catch{}
}
function clearMarker(){try{localStorage.removeItem(MARKER_KEY)}catch{}}
function canUseOffline(){return !navigator.onLine&&!!readMarker()}
function applyCopy(){
 const c=COPY[lang()];
 const subtitle=$("pmAuthSubtitle"); if(subtitle)subtitle.textContent=c.subtitle;
 const google=$("googleSignIn"); if(google)google.textContent=c.google;
 const divider=document.querySelector("#authGate .auth-divider span"); if(divider)divider.textContent=c.or;
 const label=document.querySelector('#authGate label');
 if(label){
   const input=$("authEmail");
   for(const n of [...label.childNodes])if(n.nodeType===Node.TEXT_NODE&&n.textContent.trim())n.textContent=c.email+"\n      ";
   if(input)input.placeholder=c.placeholder;
 }
 const send=$("emailSignIn"); if(send)send.textContent=c.send;
 document.querySelectorAll("[data-auth-lang]").forEach(b=>b.classList.toggle("active",b.dataset.authLang===lang()));
}
let offlineLoaderTimer=null;
function showOfflineLoader(){
 const loader=$("pmAuthLoading"),text=$("pmAuthLoadingText");
 if(!loader)return;
 if(text)text.textContent=COPY[lang()].offline;
 loader.hidden=false;
 clearTimeout(offlineLoaderTimer);
 offlineLoaderTimer=setTimeout(()=>{loader.hidden=true},650);
}
function enforce(){
 const gate=$("authGate"),status=$("authStatus");
 if(canUseOffline()){
   if(gate)gate.hidden=true;
   if(status)status.textContent="";
   document.body.classList.add("pm-offline-authenticated");
   showOfflineLoader();
 }else document.body.classList.remove("pm-offline-authenticated");
}
function captureAuthenticatedUser(){
 try{
   if(typeof authUser!=="undefined"&&authUser?.id){writeMarker(authUser);return true}
 }catch{}
 return false;
}
function install(){
 applyCopy();
 enforce();

 document.querySelectorAll("[data-auth-lang]").forEach(b=>b.addEventListener("click",()=>{
   const next=b.dataset.authLang;
   if(!COPY[next])return;
   localStorage.setItem(LANG_KEY,next);
   document.documentElement.lang=next;
   applyCopy();
   document.dispatchEvent(new CustomEvent("pm:language-change",{detail:{language:next}}));
 }));

 const gate=$("authGate");
 if(gate)new MutationObserver(()=>{if(canUseOffline()&&!gate.hidden)gate.hidden=true}).observe(gate,{attributes:true,attributeFilter:["hidden"]});

 let attempts=0;
 const timer=setInterval(()=>{
   attempts++;
   if(captureAuthenticatedUser()||attempts>=40)clearInterval(timer);
 },500);

 window.addEventListener("online",()=>{document.body.classList.remove("pm-offline-authenticated");captureAuthenticatedUser()});
 window.addEventListener("offline",enforce);
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"){captureAuthenticatedUser();enforce()}});
 $("logoutBtn")?.addEventListener("click",clearMarker,{capture:true});

 try{
   if(typeof supabaseClient!=="undefined"&&supabaseClient?.auth){
     supabaseClient.auth.onAuthStateChange((event,session)=>{
       if(event==="SIGNED_OUT")clearMarker();
       else if(session?.user)writeMarker(session.user);
       enforce();
     });
   }
 }catch{}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();