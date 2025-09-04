// Emoji Cipher Pro - Service Worker
// تطبيق تشفير الإيموجي - عامل الخدمة للعمل بدون إنترنت

const CACHE_NAME = 'emoji-cipher-pro-v2.1.0'; // Version bump to trigger update
const urlsToCache = [
  '/e/index.html',
  '/e/manifest.json',
  '/e/assets/css/app.css',
  '/e/assets/js/bundle.js',
  '/e/assets/fonts/fa-solid-900.woff2',
  '/e/assets/fonts/fa-regular-400.woff2',
  '/e/assets/fonts/fa-brands-400.woff2',
  '/e/assets/icons/icon-72x72.png',
  '/e/assets/icons/icon-96x96.png',
  '/e/assets/icons/icon-128x128.png',
  '/e/assets/icons/icon-144x144.png',
  '/e/assets/icons/icon-152x152.png',
  '/e/assets/icons/icon-192x192.png',
  '/e/assets/icons/icon-384x384.png',
  '/e/assets/icons/icon-512x512.png',
  '/e/assets/icons/icon.svg'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('Service Worker: Installed successfully');
        return self.skipWaiting();
      })
      .catch(function(error) {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('Service Worker: Activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }
        
        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request).then(function(response) {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Add to cache for future use
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(function(error) {
        console.error('Service Worker: Fetch failed', error);
        
        // Return offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/e/index.html');
        }
      })
  );
});

// Message event - handle messages from main thread
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for future features
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    // Handle background sync tasks here
  }
});

// Push notification support for future features
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    console.log('Service Worker: Push notification received', data);
    
    const options = {
      body: data.body,
      icon: '/e/assets/icons/icon-192x192.png',
      // badge: '/e/assets/icons/badge-72x72.png', // Icon not found in project
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'فتح التطبيق'
          // icon: '/e/assets/icons/checkmark.png' // Icon not found in project
        },
        {
          action: 'close',
          title: 'إغلاق'
          // icon: '/e/assets/icons/xmark.png' // Icon not found in project
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  console.log('Service Worker: Notification clicked', event);
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/e/index.html')
    );
  }
});

console.log('Service Worker: Script loaded successfully');