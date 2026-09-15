"use strict";
/* Prompt Manager M1.7.10 — bootstrap sync stabilization.
   Loaded immediately after app.js so the auth bootstrap uses a single-flight
   cloud sync and IndexedDB replacement commits atomically. */
(()=>{
  if(typeof window.syncCloudLibrary!=="function")return;

  // Prevent getSession() and onAuthStateChange from running overlapping syncs.
  const originalSync=window.syncCloudLibrary;
  let syncInFlight=null;
  window.syncCloudLibrary=function syncCloudLibrarySingleFlight(options){
    if(syncInFlight)return syncInFlight;
    syncInFlight=Promise.resolve()
      .then(()=>originalSync(options))
      .finally(()=>{syncInFlight=null});
    return syncInFlight;
  };

  // Replace the local cloud snapshot in one IndexedDB transaction. The old
  // implementation cleared and re-added rows in separate transactions, which
  // allowed two bootstrap syncs to interleave and temporarily duplicate cards.
  window.replaceLocalFromCloud=function replaceLocalFromCloudAtomic(rows){
    return new Promise((resolve,reject)=>{
      let tx;
      try{
        tx=db.transaction("prompts","readwrite");
        const store=tx.objectStore("prompts");
        store.clear();
        for(const row of rows||[])store.add(fromCloudPrompt(row));
      }catch(err){
        reject(err);
        return;
      }
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||new Error("Local library replacement failed"));
      tx.onabort=()=>reject(tx.error||new Error("Local library replacement aborted"));
    });
  };
})();
