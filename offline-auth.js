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
 const lb=$("pmAuthLanguageButton");if(lb)lb.textContent={en:"🇬🇧",es:"🇪🇸",sr:"🇷🇸"}[lang()]||"🇬🇧";
 document.querySelectorAll("[data-auth-lang]").forEach(b=>b.classList.toggle("active",b.dataset.authLang===lang()));
}
function showOfflineApp(){
 if(!canUseOffline())return false;
 const marker=readMarker();
 try{
   if(marker?.userId&&typeof authUser!=="undefined"&&!authUser)authUser={id:marker.userId};
 }catch{}
 const gate=$("authGate");if(gate)gate.hidden=true;
 const loader=$("pmAuthLoading");if(loader)loader.hidden=true;
 document.body.classList.remove("pm-auth-pending","pm-offline-loader-hold");
 document.body.classList.add("pm-offline-authenticated");
 try{if(typeof revealApp==="function")revealApp()}catch{}
 return true;
}
function revealOfflineLogin(){
 const loader=$("pmAuthLoading");if(loader)loader.hidden=true;
 try{if(typeof revealLogin==="function")revealLogin();else{const gate=$("authGate");if(gate)gate.hidden=false}}catch{const gate=$("authGate");if(gate)gate.hidden=false}
}
function enforce(){
 if(showOfflineApp())return;
 document.body.classList.remove("pm-offline-authenticated");
 if(!navigator.onLine)revealOfflineLogin();
}
function captureAuthenticatedUser(){
 try{
   if(typeof authUser!=="undefined"&&authUser?.id){writeMarker(authUser);return true}
 }catch{}
 return false;
}
function installStabilityModule(){
 if(document.querySelector('script[data-pm-v235]'))return;
 const s=document.createElement("script");
 s.src="./v235-stability.js";
 s.defer=true;
 s.dataset.pmV235="true";
 document.head.appendChild(s);
}
function install(){
 installStabilityModule();
 applyCopy();

 // V2.0.35: a previously verified user must never see the login gate on
 // the first cold start while offline. Resolve local authorization immediately.
 if(!navigator.onLine){
   document.body.classList.add("pm-offline-loader-hold");
   const loader=$("pmAuthLoading");if(loader)loader.hidden=false;
   if(!showOfflineApp()){
     setTimeout(()=>{
       document.body.classList.remove("pm-offline-loader-hold");
       showOfflineApp()||revealOfflineLogin();
     },900);
   }
 }

 const languageButton=$("pmAuthLanguageButton"),languageMenu=$("pmAuthLanguageMenu");
 languageButton?.addEventListener("click",e=>{e.stopPropagation();const opening=languageMenu.hidden;languageMenu.hidden=!opening;languageButton.setAttribute("aria-expanded",String(opening))});
 document.querySelectorAll("[data-auth-lang]").forEach(b=>b.addEventListener("click",()=>{
   const next=b.dataset.authLang;if(!COPY[next])return;
   localStorage.setItem(LANG_KEY,next);document.documentElement.lang=next;
   languageMenu.hidden=true;languageButton?.setAttribute("aria-expanded","false");
   applyCopy();document.dispatchEvent(new CustomEvent("pm:language-change",{detail:{language:next}}));
 }));
 document.addEventListener("click",e=>{if(!e.target.closest("#pmAuthLanguages")){languageMenu.hidden=true;languageButton?.setAttribute("aria-expanded","false")}});

 const gate=$("authGate");
 if(gate)new MutationObserver(()=>{
   if(canUseOffline()&&!gate.hidden){showOfflineApp();return}
   const loader=$("pmAuthLoading");if(loader&&!canUseOffline())loader.hidden=true;
 }).observe(gate,{attributes:true,attributeFilter:["hidden"]});

 // Guard against late auth bootstrap work re-opening the login gate offline.
 if(!navigator.onLine&&gate){
   let guardFrames=0;
   const guard=setInterval(()=>{
     guardFrames++;
     if(canUseOffline())showOfflineApp();
     if(guardFrames>=30||navigator.onLine)clearInterval(guard);
   },100);
 }

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