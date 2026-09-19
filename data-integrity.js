/* Prompt Manager V2.0.27 — account-scoped local data + offline sync integrity */
(()=>{"use strict";
const MARKER_KEY="pm-offline-auth-v1";
const OWNER_FIELD="_pmOwnerId";
const LEGACY_CLAIM_KEY="pm-local-owner-claimed-v1";
const scopedStores=new Set(["prompts","categories","syncQueue"]);
const DIAG_KEY="pm-sync-diagnostics-v1";
function diag(stage,detail={}){
  try{
    const entry={at:new Date().toISOString(),stage,online:navigator.onLine,...detail};
    const log=JSON.parse(localStorage.getItem(DIAG_KEY)||"[]");
    log.push(entry);
    localStorage.setItem(DIAG_KEY,JSON.stringify(log.slice(-100)));
    document.dispatchEvent(new CustomEvent("pm:sync-diagnostic",{detail:entry}));
  }catch{}
}
function errInfo(err){return {name:err?.name||null,message:err?.message||String(err||"Unknown error"),code:err?.code||null,details:err?.details||null,hint:err?.hint||null}}


function markerOwner(){
  try{return JSON.parse(localStorage.getItem(MARKER_KEY)||"null")?.userId||null}catch{return null}
}
function owner(){
  try{if(typeof authUser!=="undefined"&&authUser?.id)return authUser.id}catch{}
  return markerOwner();
}
function owned(record,id=owner()){
  if(!record||!id)return false;
  return record[OWNER_FIELD]===id;
}
async function adoptUnownedRowsForVerifiedOwner(id){
  if(!id||markerOwner()!==id)return;
  for(const store of scopedStores){
    const rows=await rawAll(store);
    for(const row of rows)if(row&&row[OWNER_FIELD]==null)await rawPut(store,{...row,[OWNER_FIELD]:id});
  }
}
function tag(record,id=owner()){
  if(!record||!id||typeof record!=="object")return record;
  return {...record,[OWNER_FIELD]:id};
}
function rawAll(store){
  return new Promise((resolve,reject)=>{
    try{
      const tx=db.transaction(store,"readonly"),req=tx.objectStore(store).getAll();
      req.onsuccess=()=>resolve(req.result||[]);
      req.onerror=()=>reject(req.error);
    }catch(e){reject(e)}
  });
}
function rawPut(store,value){
  return new Promise((resolve,reject)=>{
    try{
      const tx=db.transaction(store,"readwrite"),req=tx.objectStore(store).put(value);
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    }catch(e){reject(e)}
  });
}
async function claimLegacyFor(id){
  if(!id||localStorage.getItem(LEGACY_CLAIM_KEY))return;
  // One-time upgrade: the pre-V2.0.27 local library belongs to the last
  // previously verified account on this device. Never claim legacy data for
  // an unrelated newly signed-in account.
  if(markerOwner()!==id)return;
  for(const store of scopedStores){
    const rows=await rawAll(store);
    for(const row of rows){
      if(row&&row[OWNER_FIELD]==null)await rawPut(store,{...row,[OWNER_FIELD]:id});
    }
  }
  localStorage.setItem(LEGACY_CLAIM_KEY,id);
}

const originalLocalAll=window.localAll;
const originalLocalGet=window.localGet;
const originalLocalAdd=window.localAdd;
const originalLocalPut=window.localPut;
const originalLocalDel=window.localDel;
const originalLocalClear=window.localClear;

if(typeof originalLocalAll==="function"){
  window.localAll=async function(store){
    const id=owner();
    if(!scopedStores.has(store)||!id)return originalLocalAll(store);
    await claimLegacyFor(id);
    return (await originalLocalAll(store)).filter(row=>owned(row,id));
  };
}
if(typeof originalLocalGet==="function"){
  window.localGet=async function(store,key){
    const row=await originalLocalGet(store,key),id=owner();
    if(!scopedStores.has(store)||!id)return row;
    return owned(row,id)?row:undefined;
  };
}
if(typeof originalLocalAdd==="function"){
  window.localAdd=function(store,value){
    const id=owner();
    return originalLocalAdd(store,scopedStores.has(store)&&id?tag(value,id):value);
  };
}
if(typeof originalLocalPut==="function"){
  window.localPut=function(store,value){
    const id=owner();
    return originalLocalPut(store,scopedStores.has(store)&&id?tag(value,id):value);
  };
}
if(typeof originalLocalDel==="function"){
  window.localDel=async function(store,key){
    const id=owner();
    if(!scopedStores.has(store)||!id)return originalLocalDel(store,key);
    const row=await originalLocalGet(store,key);
    if(row&&owned(row,id))return originalLocalDel(store,key);
  };
}
if(typeof originalLocalClear==="function"){
  window.localClear=async function(store){
    const id=owner();
    if(!scopedStores.has(store)||!id)return originalLocalClear(store);
    const rows=await originalLocalAll(store);
    for(const row of rows){
      if(owned(row,id)){
        const key=store==="syncQueue"?row.qid:row.id;
        if(key!=null)await originalLocalDel(store,key);
      }
    }
  };
}

// Strip local-only ownership metadata before cloud writes.
if(typeof window.toCloudPrompt==="function"){
  const originalToCloud=window.toCloudPrompt;
  window.toCloudPrompt=function(record){
    const clean={...record};delete clean[OWNER_FIELD];
    return originalToCloud(clean);
  };
}

let retryTimer=null,syncing=false;
async function pendingCount(){
  try{
    const id=owner(); if(!id)return 0;
    await claimLegacyFor(id);
    return (await originalLocalAll("syncQueue")).filter(q=>owned(q,id)).length;
  }catch{return 0}
}
async function reconcileQueuedInserts(id){
  if(!id||markerOwner()!==id||!navigator.onLine||typeof supabaseClient==="undefined"||!supabaseClient)return;
  await adoptUnownedRowsForVerifiedOwner(id);
  const queue=(await rawAll("syncQueue"))
    .filter(q=>q&&(q[OWNER_FIELD]===id||q[OWNER_FIELD]==null))
    .sort((a,b)=>(a.qid||0)-(b.qid||0));
  diag("queue:reconcile",{count:queue.length});
  for(const q of queue){
    if(q.op!=="insert"||q.localId==null)continue;
    const current=await originalLocalGet("prompts",q.localId);
    if(!current||current.cloudId)continue;
    const createdAt=current.createdAt?new Date(current.createdAt).toISOString():null;
    let query=supabaseClient.from("prompts")
      .select("id,updated_at")
      .eq("user_id",id)
      .eq("title",current.title||"Untitled")
      .eq("content",current.content||"")
      .limit(1);
    if(createdAt)query=query.eq("created_at",createdAt);
    const {data,error}=await query;
    if(error){diag("queue:reconcile-error",{qid:q.qid,...errInfo(error)});continue}
    if(data?.[0]?.id){
      current.cloudId=data[0].id;
      current.updatedAt=Date.parse(data[0].updated_at)||Date.now();
      current[OWNER_FIELD]=id;
      await originalLocalPut("prompts",current);
      await originalLocalDel("syncQueue",q.qid);
      diag("queue:reconciled-existing",{qid:q.qid,cloudId:data[0].id});
    }
  }
}
async function syncNow(reason="online"){
  const id=owner();
  if(syncing||!navigator.onLine||!id||typeof window.syncCloudLibrary!=="function")return false;
  syncing=true;
  try{
    diag("sync:start",{reason});
    await reconcileQueuedInserts(id);
    await window.syncCloudLibrary({silent:true});
    const pending=await pendingCount();
    diag("sync:complete",{reason,pending});
    document.dispatchEvent(new CustomEvent("pm:sync-status",{detail:{reason,pending,ok:pending===0}}));
    if(pending){
      clearTimeout(retryTimer);
      retryTimer=setTimeout(()=>syncNow("retry"),5000);
    }
    return pending===0;
  }catch(err){
    const pending=await pendingCount();
    diag("sync:error",{reason,pending,...errInfo(err)});
    console.warn("Offline queue sync retry pending",err);
    document.dispatchEvent(new CustomEvent("pm:sync-status",{detail:{reason,pending,ok:false}}));
    clearTimeout(retryTimer);
    retryTimer=setTimeout(()=>syncNow("retry"),5000);
    return false;
  }finally{syncing=false}
}

window.addEventListener("online",()=>{diag("event:online");setTimeout(()=>syncNow("reconnected"),700)});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&navigator.onLine)setTimeout(()=>syncNow("resume"),250)});
document.addEventListener("pm:auth-verified",()=>setTimeout(()=>syncNow("auth"),100));
function loadDiagnosticsAssets(){
 if(!document.querySelector('link[data-pm-sync-diag]')){const l=document.createElement("link");l.rel="stylesheet";l.href="./sync-diagnostics.css";l.dataset.pmSyncDiag="1";document.head.appendChild(l)}
 if(!document.querySelector('script[data-pm-sync-diag]')){const s=document.createElement("script");s.src="./sync-diagnostics.js";s.defer=true;s.dataset.pmSyncDiag="1";document.head.appendChild(s)}
}
loadDiagnosticsAssets();
window.pmDataIntegrity={
 pendingCount,syncNow,owner,
 diagnostics(){try{return JSON.parse(localStorage.getItem(DIAG_KEY)||"[]")}catch{return[]}},
 clearDiagnostics(){localStorage.removeItem(DIAG_KEY)},
 async copyDiagnostics(){
   return JSON.stringify({capturedAt:new Date().toISOString(),online:navigator.onLine,pending:await pendingCount(),events:this.diagnostics()},null,2);
 }
};
})();