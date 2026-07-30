const CACHE_NAME = "dashboard-v6";

const STATIC_ASSETS = [
  "./icon-192.png",
  "./icon-512.png"
];

// Arquivos que devem sempre ser buscados na rede primeiro (conteúdo que muda)
const NETWORK_FIRST = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cache => cache !== CACHE_NAME ? caches.delete(cache) : null)
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  const isNetworkFirst =
    event.request.mode === "navigate" ||
    NETWORK_FIRST.some(path => url.pathname.endsWith(path.replace("./", "")) || url.pathname === "/");

  if (isNetworkFirst) {
    // Network-first: sempre tenta buscar a versão mais recente.
    // Só cai pro cache se estiver offline.
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match("./index.html")))
    );
  } else {
    // Cache-first para assets estáticos (ícones etc.)
    event.respondWith(
      caches.match(event.request).then(response => response || fetch(event.request))
    );
  }
});
