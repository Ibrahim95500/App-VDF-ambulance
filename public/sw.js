const CACHE_NAME = 'vdf-ambulance-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/manifest.json',
    '/media/app/logo.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Ignore Chrome extensions or other non-http requests
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Return fresh network response as priority
                // Optionally we could cache it, but Next.js does its own cache.
                // We'll cache only the essential assets to avoid bloating storage with old chunks.
                return response;
            })
            .catch(() => {
                // On network failure (offline), try looking in the cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // If it's a page navigation request and we're offline, return root.
                    if (event.request.mode === 'navigate') {
                        return caches.match('/');
                    }
                });
            })
    );
});

self.addEventListener('push', (event) => {
    if (event.data) {
        try {
            const data = event.data.json();
            const title = data.title || "Nouvelle notification VDF Ambulance";
            const options = {
                body: data.body || "",
                icon: data.icon || "/media/app/logo.png",
                badge: "/media/app/logo.png",
                data: { url: data.url || "/" }
            };

            event.waitUntil(
                self.registration.showNotification(title, options)
            );
        } catch (error) {
            console.error('Error parsing push data:', error);
            // Fallback for non-JSON payloads
            event.waitUntil(
                self.registration.showNotification("VDF Ambulance", {
                    body: event.data.text()
                })
            );
        }
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Focus or open the target URL
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window/tab
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
