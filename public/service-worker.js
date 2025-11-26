self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    self.registration.showNotification(data.title || 'Foodie Dash', {
      body: data.body || 'New notification',
      icon: '/logo.jpg',
      badge: '/logo.jpg'
    });
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});
