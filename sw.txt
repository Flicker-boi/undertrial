const CACHE_NAME = 'undertale-deneme-v9';

// Sadece küçük statik dosyaları zorunlu yüklüyoruz (Medyalar hariç!)
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './nn.png',
    './neden.gif',
    './kaka.png',
    './bb.gif',
    './lan.png',
    './hoş.png',
    './fonts/wh.ttf',
    './fonts/notethis.ttf'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                // Hata alsa bile kurulumun çökmemesi için her birini ayrı ekliyoruz
                return Promise.allSettled(
                    urlsToCache.map(url => cache.add(url).catch(err => console.log('Cache eklenemedi:', url)))
                );
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Medya dosyaları (mp3, mp4) için akıllı dinamik önbellek
    if (url.pathname.endsWith('.mp3') || url.pathname.endsWith('.mp4')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                try {
                    const networkResponse = await fetch(event.request);
                    if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 206)) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                } catch (error) {
                    return new Response('Medya çevrimdışı yüklenemedi', { status: 404 });
                }
            })
        );
        return;
    }

    // Diğer dosyalar için standart önbellek stratejisi
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) return response;
                return fetch(event.request).then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200) {
                        return networkResponse;
                    }
                    let responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return networkResponse;
                });
            }).catch(() => {})
    );
});