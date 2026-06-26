/* Service worker for push-varsler (avtale om 5 min).
   Holdes bevisst enkel: INGEN fetch/caching-håndtering, så appens auto-oppdaterer
   og vanlig nettlasting påvirkes ikke. Kun push + klikk på varsel. */
self.addEventListener('push', function(e){
  var d={};
  try{ d = e.data ? e.data.json() : {}; }
  catch(_){ d = { title:'Påminnelse', body:(e.data && e.data.text()) || '' }; }
  var title = d.title || 'Avtale om 5 min';
  var opts = {
    body: d.body || '',
    tag: d.tag || undefined,           // samme tag = erstatter, ikke dobbelt
    data: { url: d.url || './' },
    requireInteraction: false
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list){
      for (var i=0;i<list.length;i++){ if ('focus' in list[i]) return list[i].focus(); }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
