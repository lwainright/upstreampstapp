// public/sw-push.js
// Service worker push event handler
// Add this to your vite-plugin-pwa config as a custom service worker

self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'upstream',
    renotify: true,
    requireInteraction: data.type === 'pst_request',
    data: { type: data.type, url: '/' },
    actions: data.type === 'pst_request' ? [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ] : [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Upstream Approach', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
