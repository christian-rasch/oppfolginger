/* Service worker for push-varsler (avtale om 5 min + daglig tilbud-påminnelse).
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
    data: { url: d.url || './', glow: d.glow || null }, // glow = hvilke kort som skal lyse opp
    requireInteraction: false
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var data = e.notification.data || {};
  var glow = data.glow || null;
  var url = data.url || './';
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list){
      for (var i=0;i<list.length;i++){
        var c = list[i];
        if ('focus' in c){                       // appen er åpen → fokuser + send glow
          c.focus();
          if (glow){ try{ c.postMessage({ type:'notif-glow', glow:glow }); }catch(_){} }
          return;
        }
      }
      // appen er lukket → åpne med glow i URL-en
      var u = glow ? (url + (url.indexOf('?')<0?'?':'&') + 'glow=' + encodeURIComponent(JSON.stringify(glow))) : url;
      if (clients.openWindow) return clients.openWindow(u);
    })
  );
});
