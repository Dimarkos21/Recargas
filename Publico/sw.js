const CACHE_NAME = 'Inventary-v1.5';
const assetsToCache = [
  '/',
  
  '/manifest.json',  // Corregido a ruta absoluta para evitar errores de resolución
  '/img/Cristal.png' // Recomendado añadir tu icono principal para que cargue offline
];

// Instalación: Cacheamos los recursos locales de nuestro servidor
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Instalando caché de Inventary...');
      return Promise.allSettled(
        assetsToCache.map(url => cache.add(url))
      );
    })
  );
  self.skipWaiting();
});

// Intercepción: Manejo de peticiones locales vs externas
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname.includes('/api/')) {
    return; 
  }
  
  // Si la petición NO es a nuestro servidor (CDNs de fuentes, axios, etc.), que siga normal
  if (url.origin !== location.origin) {
    return; 
  }

  // Para recursos locales, intentamos Caché primero, si no, Red con manejo de errores de conexión
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si está en caché, lo devolvemos
      if (response) {
        return response;
      }

      // Si no está en caché, intentamos ir a la red de forma segura
      return fetch(event.request).catch(() => {
        // Si la red falla (offline o servidor caído), devolvemos una respuesta de respaldo
        // para evitar que el Service Worker colapse con un TypeError.
        return new Response('Recurso no disponible sin conexión', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
        });
      });
    })
  );
});

// Limpieza: Borra cachés antiguos si subes de versión (v10 -> v11)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
