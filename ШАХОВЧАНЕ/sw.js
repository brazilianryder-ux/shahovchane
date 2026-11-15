const V='shv-v5',SHELL=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/favicon-32.png','./icons/apple-touch-icon.png'];
const CDN=/^https:\/\/(cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;
const TILES=/^https:\/\/[a-z]\.tile\.openstreetmap\.org\//;

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  // страница: сначала сеть, без сети — из кэша
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(x=>{const c=x.clone();caches.open(V).then(h=>h.put('./index.html',c));return x}).catch(()=>caches.match('./index.html')));
    return;
  }
  // свои файлы, библиотеки, шрифты, плитки карты: сначала кэш, обновление в фоне
  if(u.origin===location.origin||CDN.test(r.url)||TILES.test(r.url)){
    e.respondWith(caches.match(r).then(hit=>{
      const net=fetch(r).then(x=>{if(x.ok||x.type==='opaque'){const c=x.clone();caches.open(V).then(h=>h.put(r,c))}return x}).catch(()=>hit);
      return hit||net;
    }));
  }
  // всё остальное (погода и прочее) — напрямую; веб-сокеты сюда не попадают
});
