const CACHE_NAME = 'undertale-deneme-v6';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Medya dosyaları için güvenli fetch stratejisi
    if (url.pathname.endsWith('.mp3') || url.pathname.endsWith('.mp4')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                try {
                    const networkResponse = await fetch(event.request);
                    // Sadece tam ve başarılı yanıtları (200) önbelleğe kaydet (206'yı ve hataları atla)
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                } catch (error) {
                    return new Response('Medya çevrimdışı yüklenemedi.', { status: 404 });
                }
            })
        );
        return;
    }

    // Diğer standart dosyalar
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then((response) => {
                if (!response || response.status !== 200) {
                    return response;
                }
                let responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            }).catch(() => {});
        })
    );
});