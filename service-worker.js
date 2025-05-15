const CACHE_NAME = 'mix-calculator-v1';
const urlsToCache = ['/fuel-mix-calculator/', '/fuel-mix-calculator/static/js/main.02e316e3.js', '/fuel-mix-calculator/static/css/main.e6c13ad2.css'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});