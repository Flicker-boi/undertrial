const CACHE_NAME = 'undertale-deneme-v7';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './nn.png',
    './neden.gif',
    './kaka.png',
    './bb.gif',
    './lan.png',
    './nik.mp4',
    './hoş.png',
    './fallendown.mp3',
    './wew.mp3',
    './shop3.mp3',
    './sans.mp3',
    './toriel.mp3',
    './fonts/wh.ttf',
    './fonts/notethis.ttf'
];

// Service Worker Kurulumu ve Dosyaların Önbelleğe Alınması
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Eski Önbelleklerin Temizlenmesi
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

// İstekleri Yakalama (Cache First Stratejisi)
self.addEventListener('fetch', (event) => {
    // Harici URL'ler (ibb.co vb.) için ağ öncelikli yaklaşım
    if (event.request.url.startsWith('http') && !event.request.url.includes(self.location.origin)) {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match(event.request))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            }).catch(() => {
                // Çevrimdışı durumlar için fallback eklenebilir
            })
    );
});