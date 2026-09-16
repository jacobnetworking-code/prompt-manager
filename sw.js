const CACHE="pm-m1.7.11.4-v1";
const CORE=[
  "./","./index.html","./styles.css","./ui-refine.css","./desktop-v1.css","./desktop-v1.js","./app.js","./model-registry.js","./model-support.js","./sync-stabilizer.js","./ui-refine.js","./product-ui.css","./product-ui.js",
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
    }).catch(()=>{
      if(request.mode==="navigate"){
        return caches.match("./index.html").then(x=>x||caches.match("./"));
      }
      throw new Error("Offline resource unavailable");
    });
  });
}

function networkFirst(request){
  return fetch(request)
    .then(response=>{
      if(response&&response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});
      }
      return response;
    })
    .catch(()=>caches.match(request).then(cached=>cached||caches.match("./")));
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

  const isCatalog=url.pathname.endsWith("/catalog.json");
  event.respondWith(isCatalog?networkFirst(event.request):cacheFirst(event.request));
});
