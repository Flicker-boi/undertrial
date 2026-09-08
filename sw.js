const CACHE_NAME = 'undertale-deneme-v2';

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

// Eski Önbelleklerin Temizlenmesi (Versiyon güncellendiğinde eskiler silinir)
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

// Geliştirilmiş Fetch Stratejisi (Özellikle ses ve video dosyaları için)
self.addEventListener('fetch', (event) => {
    // Tarayıcı dış kaynaklı istekleri (örneğin ibb.co resimleri) ve kendi dosyalarımızı yakala
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Önbellekte varsa direkt döndür
                return cachedResponse;
            }

            // Önbellekte yoksa internetten çek ve önbelleğe klonlayıp kaydet
            return fetch(event.request).then((response) => {
                // Geçerli bir yanıt alıp almadığımızı kontrol et
                if (!response || response.status !== 200 || response.type !== 'basic' && !event.request.url.startsWith('http')) {
                    return response;
                }

                let responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }).catch(() => {
                // Çevrimdışıyken ve dosya önbellekte yoksa yapılabilecek alternatif fallback işlemleri
            });
        })
    );
});
