const CACHE_NAME = 'undertale-deneme-v3';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './nn.png',
    './neden.gif',
    './kaka.png',
    './bb.gif',
    './hoş.png',
    './lan.png',
    './nik.mp4',
    './fallendown.mp3',
    './wew.mp3',
    './sans.mp3',
    './toriel.mp3',
    './shop3.mp3',
    './fonts/wh.ttf',
    './fonts/notethis.ttf',
    'https://i.ibb.co/bgVjVpPK/toriel.png',
    'https://i.ibb.co/nN37fGZq/toriel2.png',
    'https://i.ibb.co/4Z09dCDt/ah.png'
];

// Service Worker Kurulumu
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Dosyalar önbelleğe alınıyor...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Eski Önbelleklerin Temizlenmesi
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[Service Worker] Eski önbellek siliniyor:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Medya dosyaları (mp3, mp4) için Range (Parçalı) İstek Destekli Fetch Stratejisi
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Eğer istek mp3 veya mp4 dosyalarına yapıldıysa özel akış uygula
    if (url.pathname.endsWith('.mp3') || url.pathname.endsWith('.mp4')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cachedResponse = await cache.match(event.request);
                
                if (cachedResponse) {
                    // Tarayıcı medya oynatmak için Range isteği (parça isteği) gönderebilir
                    const rangeHeader = event.request.headers.get('range');
                    if (!rangeHeader) {
                        return cachedResponse;
                    }

                    const arrayBuffer = await cachedResponse.arrayBuffer();
                    const bytes = rangeHeader.replace(/bytes=/, "").split("-");
                    const start = parseInt(bytes[0], 10);
                    const end = bytes[1] ? parseInt(bytes[1], 10) : arrayBuffer.byteLength - 1;
                    const chunk = arrayBuffer.slice(start, end + 1);

                    return new Response(chunk, {
                        status: 206,
                        statusText: 'Partial Content',
                        headers: [
                            ['Content-Type', cachedResponse.headers.get('Content-Type') || (url.pathname.endsWith('.mp4') ? 'video/mp4' : 'audio/mpeg')],
                            ['Content-Range', `bytes ${start}-${end}/${arrayBuffer.byteLength}`],
                            ['Content-Length', chunk.byteLength],
                            ['Accept-Ranges', 'bytes']
                        ]
                    });
                }

                // Önbellekte yoksa internetten çekmeyi dene
                try {
                    const networkResponse = await fetch(event.request);
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                } catch (error) {
                    return new Response('Medya çevrimdışı olarak yüklenemedi.', { status: 404 });
                }
            })
        );
        return;
    }

    // Diğer standart dosyalar için normal önbellek stratejisi
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((response) => {
                if (!response || response.status !== 200 || (response.type !== 'basic' && !event.request.url.startsWith('http'))) {
                    return response;
                }
                let responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            }).catch(() => {
                // Çevrimdışı fallback
            });
        })
    );
});