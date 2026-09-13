const CACHE="pm-m1.6.6.19-v1";
const CORE=[
  "./","./index.html","./styles.css","./ui-refine.css","./desktop-v1.css","./desktop-v1.js","./m1.6.6.18.css","./m1.6.6.18.js","./app.js","./ui-refine.js",
  "./m1.6.6.19.css","./m1.6.6.19.js","./manifest.webmanifest","./apple-touch-icon.png","./icon-192.png","./icon-512.png","./catalog.json","./prompt/","./prompt/share.css","./prompt/share-m1.6.6.18.css","./prompt/share.js"
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
  if(url.origin!==self.location.origin)return;

  const isCatalog=url.pathname.endsWith("/catalog.json");
  event.respondWith(isCatalog?networkFirst(event.request):cacheFirst(event.request));
});
