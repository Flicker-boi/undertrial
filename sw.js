const CACHE_NAME = 'undertale-deneme-v1';

// Kodunun çalışması için gereken tüm yerel ve dış kaynaklı dosyalar
const ASSETS_TO_CACHE = [
    './',
    './index.html', // Eğer ana sayfanın adı index.html ise burayı './index.html' yapabilirsin
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
    // İstediğin Toriel, Toriel2 ve Kalp Chart (ah.png) linkleri:
    'https://i.ibb.co/bgVjVpPK/toriel.png',
    'https://i.ibb.co/nN37fGZq/toriel2.png',
    'https://i.ibb.co/4Z09dCDt/ah.png'
];

// Service Worker Kurulumu ve Dosyaların Önbelleğe Alınması
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

// İnternet Olmadığında Önbellekten Sunma Stratejisi (Cache-First)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; // Önbellekte varsa internete bakmadan direkt getir
            }
            return fetch(event.request).catch(() => {
                // Eğer internet yoksa ve dış kaynaklı bir resim/sayfa yüklenemezse yedek durum yönetimi yapılabilir
            });
        })
    );
});