const CACHE_NAME = 'nag-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// Handle push events from server (if any)
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'Reminder', body: 'You have something due!' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'reminder',
      renotify: true,
      requireInteraction: true,
      actions: [
        { action: 'done', title: '✓ Done' },
        { action: 'snooze', title: '⏱ Snooze 5m' }
      ],
      data: data
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const action = e.action;
  const reminderId = e.notification.data?.id;

  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      const msg = { type: action === 'done' ? 'MARK_DONE' : 'SNOOZE', id: reminderId };
      if (windowClients.length > 0) {
        windowClients[0].postMessage(msg);
        windowClients[0].focus();
      } else {
        clients.openWindow('/').then(c => c && c.postMessage(msg));
      }
    })
  );
});

// Local alarm scheduling via postMessage
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE') {
    const { id, title, delay } = e.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body: 'Tap to mark done or snooze.',
        icon: '/icon-192.png',
        tag: `reminder-${id}`,
        renotify: true,
        requireInteraction: true,
        actions: [
          { action: 'done', title: '✓ Done' },
          { action: 'snooze', title: '⏱ Snooze 5m' }
        ],
        data: { id, title }
      });
    }, delay);
  }
});
