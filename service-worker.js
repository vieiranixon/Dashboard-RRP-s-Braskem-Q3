const CACHE_NAME = "dashboard-v8-lts-20260730";

const STATIC_ASSETS=[
 "./icon-192.png",
 "./icon-512.png"
];

self.addEventListener("install",e=>{
 self.skipWaiting();
 e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(STATIC_ASSETS)));
});

self.addEventListener("activate",e=>{
 e.waitUntil((async()=>{
   const keys=await caches.keys();
   await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
   await self.clients.claim();
 })());
});

self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET") return;
 const url=new URL(req.url);
 const dynamic=/\.(json|csv|xlsx)$/i.test(url.pathname)||req.mode==="navigate"||url.pathname.endsWith("/index.html")||url.pathname==="/";
 if(dynamic){
   event.respondWith(fetch(req,{cache:"no-store"}).catch(()=>caches.match(req)));
   return;
 }
 event.respondWith(caches.match(req).then(r=>r||fetch(req).then(resp=>{
    const copy=resp.clone();
    caches.open(CACHE_NAME).then(c=>c.put(req,copy));
    return resp;
 })));
});
