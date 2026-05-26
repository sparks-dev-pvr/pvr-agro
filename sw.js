const CACHE_NAME = 'pvr-agro-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/invoice.html',
  '/purchase-bill.html',
  '/party-statement.html',
  '/payment-receipt.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install — cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS.filter(url => !url.startsWith('http')));
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('supabase.co')) return; // Never cache DB calls

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => {
        if (cached) return cached;
        // Offline fallback for navigation
        if (event.request.mode === 'navigate') return caches.match('/index.html');
      }))
  );
});

// Background sync support
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') {
    console.log('Background sync triggered');
  }
});

// Push notification support
self.addEventListener('push', event => {
  const data = event.data?.json() || { title: 'PVR Agro', body: 'New notification' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png'
    })
  );
});
