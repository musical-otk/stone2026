const CACHE_NAME = 'stone-stamp-v1.0.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&family=Share+Tech+Mono&display=swap'
];

// 설치 — 핵심 파일 캐싱
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS.slice(0, 3));
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// 활성화 — 이전 캐시 삭제
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — Cache-first 전략 (오프라인 지원)
self.addEventListener('fetch', function(e) {
  if (e.request.url.includes('fonts.googleapis.com') || e.request.url.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(function(cache) {
        return fetch(e.request).then(function(res) {
          cache.put(e.request, res.clone());
          return res;
        }).catch(function() {
          return caches.match(e.request);
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(res) {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, resClone);
        });
        return res;
      });
    })
  );
});
