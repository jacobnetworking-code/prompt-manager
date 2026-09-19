/* Prompt Manager V2.0.27 — account-scoped local data + offline sync integrity */
(()=>{"use strict";
const MARKER_KEY="pm-offline-auth-v1";
const OWNER_FIELD="_pmOwnerId";
const LEGACY_CLAIM_KEY="pm-local-owner-claimed-v1";
const scopedStores=new Set(["prompts","categories","syncQueue"]);

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
async function syncNow(reason="online"){
  const id=owner();
  if(syncing||!navigator.onLine||!id||typeof window.syncCloudLibrary!=="function")return false;
  syncing=true;
  try{
    await adoptUnownedRowsForVerifiedOwner(id);
    if(typeof window.flushSyncQueue==="function")await window.flushSyncQueue();
    await window.syncCloudLibrary({silent:true});
    const pending=await pendingCount();
    document.dispatchEvent(new CustomEvent("pm:sync-status",{detail:{reason,pending,ok:pending===0}}));
    if(pending){
      clearTimeout(retryTimer);
      retryTimer=setTimeout(()=>syncNow("retry"),4000);
    }
    return pending===0;
  }catch(err){
    console.warn("Offline queue sync retry pending",err);
    document.dispatchEvent(new CustomEvent("pm:sync-status",{detail:{reason,pending:await pendingCount(),ok:false}}));
    clearTimeout(retryTimer);
    retryTimer=setTimeout(()=>syncNow("retry"),5000);
    return false;
  }finally{syncing=false}
}

window.addEventListener("online",()=>setTimeout(()=>syncNow("reconnected"),250));
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&navigator.onLine)setTimeout(()=>syncNow("resume"),250)});
document.addEventListener("pm:auth-verified",()=>setTimeout(()=>syncNow("auth"),100));
window.pmDataIntegrity={pendingCount,syncNow,owner};
})();