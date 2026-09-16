const CACHE="pm-m1.8.0.2-v1";
const CORE=[
  "./","./index.html","./styles.css","./ui-refine.css","./desktop-v1.css","./desktop-v1.js","./app.js","./model-registry.js","./model-support.js","./sync-stabilizer.js","./ui-refine.js","./product-ui.css","./product-ui.js","./library-controls.js",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2","./manifest.webmanifest","./apple-touch-icon.png","./icon-192.png","./icon-512.png","./catalog.json","./prompt/","./prompt/share.css","./prompt/share-m1.6.6.18.css","./prompt/share.js"
];

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>Promise.allSettled(CORE.map(url=>cache.add(url))))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

function cacheFirst(request){
  return caches.match(request).then(cached=>{
    if(cached)return cached;
    return fetch(request).then(response=>{
      if(response&&response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});
      }
      return response;
    }).catch(()=>{throw new Error("Offline resource unavailable")});
  });
}

function networkFirst(request,fallback="./"){
  return fetch(request,{cache:"no-store"})
    .then(response=>{
      if(response&&response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});
      }
      return response;
    })
    .catch(()=>caches.match(request).then(cached=>cached||caches.match(fallback)));
}

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  const isSupabaseSDK=event.request.url.startsWith("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
  if(isSupabaseSDK){
    event.respondWith(cacheFirst(event.request));
    return;
  }
  if(url.origin!==self.location.origin)return;

  const path=url.pathname;
  const isCatalog=path.endsWith("/catalog.json");
  const isNavigation=event.request.mode==="navigate";
  const isMutableAsset=/\.(?:html|js|css|json|webmanifest)$/i.test(path);

  // App shell/code must prefer the deployed version. Cache is only the offline fallback.
  // This prevents an old cached HTML shell from being paired with newer JS/CSS releases.
  if(isNavigation||isCatalog||isMutableAsset){
    event.respondWith(networkFirst(event.request,"./index.html"));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});
