export function renderServiceWorker(slug,version,assets){
 const cache='vasia-card:'+slug+':'+version,prefix='vasia-card:'+slug+':',base='/'+slug+'/';
 return `const CACHE=${JSON.stringify(cache)},PREFIX=${JSON.stringify(prefix)},BASE=${JSON.stringify(base)},ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==self.location.origin)return;
if(event.request.mode==='navigate'&&u.pathname.startsWith(BASE)&&u.pathname!==BASE+'contact.vcf'){event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(BASE+'index.html',copy)))}return response}).catch(()=>caches.open(CACHE).then(cache=>cache.match(BASE+'index.html'))));return;}
if(!ASSETS.includes(u.pathname))return;event.respondWith(caches.open(CACHE).then(cache=>cache.match(u.pathname)).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(u.pathname,copy)))}return response})));});
`;
}
