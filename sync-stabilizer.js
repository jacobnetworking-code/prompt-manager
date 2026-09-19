"use strict";
/* Prompt Manager V2.0.33 — bootstrap sync stabilization.
   Keep cloud sync single-flight, but do not bypass the account-scoped local
   storage helpers. The previous raw IndexedDB replacement cleared the shared
   prompts store and re-added cloud rows without _pmOwnerId, causing the
   account filter to hide the entire prompt library. */
(()=>{
  if(typeof window.syncCloudLibrary!=="function")return;
  const originalSync=window.syncCloudLibrary;
  let syncInFlight=null;
  window.syncCloudLibrary=function syncCloudLibrarySingleFlight(options){
    if(syncInFlight)return syncInFlight;
    syncInFlight=Promise.resolve()
      .then(()=>originalSync(options))
      .finally(()=>{syncInFlight=null});
    return syncInFlight;
  };
  // Intentionally leave app.js replaceLocalFromCloud intact. data-integrity.js
  // wraps localClear/localAdd so replacement remains scoped to the active user.
})();
