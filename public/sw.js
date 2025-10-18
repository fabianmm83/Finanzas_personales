// sw.js - Service Worker para Finanzas Personales con Notificaciones y Actualizaciones
const CACHE_NAME = 'finanzas-v1.6';

// Archivos para cache
const STATIC_CACHE_FILES = [
    '/',
    '/static/logo_pwa.png',
    '/js/config.js',
    '/js/auth.js',
    '/js/transactions.js',
    '/js/budgets.js',
    '/js/app.js'
];

self.addEventListener('install', (event) => {
    console.log('✅ Service Worker instalado');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✅ Cache abierto');
                return cache.addAll(STATIC_CACHE_FILES);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker activado');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Eliminando cache viejo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Notificar a los clientes que hay una nueva versión disponible
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'NEW_VERSION_AVAILABLE',
                        version: CACHE_NAME
                    });
                });
            });
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Para las notificaciones push, no usar cache
    if (event.request.url.includes('/api/') || event.request.method !== 'GET') {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Devuelve el cache si existe, sino hace fetch
                return response || fetch(event.request)
                    .then(fetchResponse => {
                        // Si es una respuesta válida, la guarda en cache
                        if (fetchResponse && fetchResponse.status === 200) {
                            const responseToCache = fetchResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return fetchResponse;
                    });
            })
            .catch(() => {
                // Fallback para página offline
                if (event.request.destination === 'document') {
                    return caches.match('/');
                }
            })
    );
});

// MANEJO DE NOTIFICACIONES PUSH
self.addEventListener('push', function(event) {
    console.log('📨 Evento push recibido');
    
    if (!event.data) {
        console.log('❌ Push event sin data');
        return;
    }

    let data;
    try {
        data = event.data.json();
        console.log('📊 Datos de notificación:', data);
    } catch (error) {
        console.log('❌ Error parseando datos push:', error);
        data = {
            title: 'Finanzas Personales',
            body: event.data.text() || 'Nueva notificación',
            icon: '/static/logo_pwa.png'
        };
    }

    const options = {
        body: data.body || 'Recordatorio de finanzas',
        icon: data.icon || '/static/logo_pwa.png',
        badge: data.badge || '/static/logo_pwa.png',
        tag: data.tag || 'finances-reminder',
        data: data.data || {},
        actions: data.actions || [
            {
                action: 'add-transaction',
                title: '➕ Agregar'
            },
            {
                action: 'view-dashboard',
                title: '📊 Ver Dashboard'
            }
        ],
        requireInteraction: data.requireInteraction || true,
        silent: false
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
            .then(() => console.log('✅ Notificación mostrada'))
            .catch(error => console.error('❌ Error mostrando notificación:', error))
    );
});

self.addEventListener('notificationclick', function(event) {
    console.log('🖱️ Notificación clickeada:', event.action);
    
    event.notification.close();

    const action = event.action;
    const notification = event.notification;

    let urlToOpen = '/';
    let targetAction = 'view-dashboard';

    if (action === 'add-transaction') {
        urlToOpen = '/#add-transaction';
        targetAction = 'add-transaction';
    } else if (action === 'view-dashboard') {
        urlToOpen = '/#dashboard';
        targetAction = 'view-dashboard';
    }

    event.waitUntil(
        clients.matchAll({ 
            type: 'window',
            includeUncontrolled: true 
        }).then(windowClients => {
            console.log('🪟 Ventanas encontradas:', windowClients.length);
            
            // Buscar si ya hay una ventana/tab abierta
            for (let client of windowClients) {
                if (client.url.includes(self.location.origin)) {
                    console.log('✅ Ventana existente encontrada, enfocando...');
                    client.focus();
                    // Enviar mensaje al cliente sobre la acción
                    client.postMessage({
                        action: targetAction,
                        source: 'notification'
                    });
                    return;
                }
            }
            
            // Si no hay ventanas abiertas, abrir una nueva
            console.log('🌐 Abriendo nueva ventana...');
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen).then(newClient => {
                    if (newClient) {
                        // Esperar a que la ventana se cargue para enviar el mensaje
                        setTimeout(() => {
                            newClient.postMessage({
                                action: targetAction,
                                source: 'notification'
                            });
                        }, 1000);
                    }
                });
            }
        }).catch(error => {
            console.error('❌ Error manejando click de notificación:', error);
        })
    );
});

self.addEventListener('notificationclose', function(event) {
    console.log('❌ Notificación cerrada:', event.notification.tag);
});

// Manejo de mensajes desde la app
self.addEventListener('message', function(event) {
    console.log('📩 Mensaje recibido en Service Worker:', event.data);
    
    const { type, data } = event.data;
    
    if (type === 'SKIP_WAITING') {
        console.log('🔄 Saltando espera de Service Worker...');
        self.skipWaiting().then(() => {
            // Notificar a todos los clientes que se actualizó
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'SERVICE_WORKER_UPDATED'
                    });
                });
            });
        });
    }
    
    // Escuchar solicitudes de verificación de actualizaciones
    if (type === 'CHECK_FOR_UPDATES') {
        self.registration.update().then(() => {
            console.log('✅ Verificación de actualizaciones completada');
        });
    }
});