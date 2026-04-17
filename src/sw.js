import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

// Clean old caches
cleanupOutdatedCaches();

// Precache resources
precacheAndRoute(self.__WB_MANIFEST || []);

// Claim clients
self.skipWaiting();
clientsClaim();

// Handle Push Events
self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: "New Notification", body: event.data.text() };
    }
  }

  const title = data.title || "KōA";
  const options = {
    body: data.body || "It's time to review your daily tasks.",
    icon: data.icon || '/icon.ico',
    badge: '/icon.ico',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: data.actions || [
      { action: 'start', title: '🚀 Start Session' }
    ],
    requireInteraction: data.requireInteraction !== false
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle Notification Clicks (body tap + action buttons)
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // 'dismiss' action — just close, do nothing
  if (event.action === 'dismiss') return;

  // 'start' action or body tap — open/focus the app
  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          // Navigate to the target URL and focus
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
