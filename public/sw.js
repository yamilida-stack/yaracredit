// Service Worker para YaraCredit - Solo caché de assets estáticos
// NO cachea peticiones a la API de Supabase

const CACHE_NAME = 'yaracredit-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Los assets de Vite se cachean automáticamente
];

// Instalar Service Worker - Solo cachear assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando assets estáticos');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activar Service Worker - Limpiar caches antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - Estrategia: Network First para API, Cache First para assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // NO cachear peticiones a Supabase (API REST)
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.in')) {
    console.log('[SW] Petición a Supabase - No cachear:', url.pathname);
    // Dejar que la petición vaya directamente a la red
    return;
  }
  
  // NO cachear peticiones de autenticación
  if (url.pathname.includes('/auth/') || url.pathname.includes('/rest/')) {
    console.log('[SW] Petición de autenticación/API - No cachear:', url.pathname);
    return;
  }
  
  // Para assets estáticos (JS, CSS, imágenes), usar Cache First
  if (event.request.destination === 'script' || 
      event.request.destination === 'style' || 
      event.request.destination === 'image' ||
      event.request.destination === 'font') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          // Solo cachear respuestas exitosas
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // Para HTML, usar Network First (siempre intentar la red primero)
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }
  
  // Para todo lo demás, ir directamente a la red
  event.respondWith(fetch(event.request));
});

console.log('[SW] Service Worker cargado - Solo caché de assets estáticos');
