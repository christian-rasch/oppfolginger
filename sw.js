/* Service worker: push-varsler (avtale om 5 min + daglig tilbud-påminnelse) + offline-skall.
   Offline-skallet cacher KUN selve siden (navigasjoner til appen) så hjemskjerm-appen åpner uten dekning.
   Alt annet (Supabase, jsdelivr, fonter, bilder) røres ikke. Auto-oppdatereren (?_v=) går alltid rett på nett
   og legger den ferske versjonen i cachen, så en ny utrulling når fram som før. */
var CACHE='oppf-shell-v1';
var SW_VER='154'; // skrives til Cache API («oppf-glow»/oppf-swver) ved aktivering, så appen kan logge hvilken versjon som faktisk kjører
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(['./','apple-touch-icon.png']).catch(function(){}); })
      .then(function(){ return self.skipWaiting(); })
  );
});
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k!==CACHE && k!=='oppf-glow'; }).map(function(k){ return caches.delete(k); })); })
      .then(function(){ return caches.open('oppf-glow').then(function(c){ return c.put('./oppf-swver', new Response(SW_VER)); }).catch(function(){}); })
      .then(function(){ return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.mode !== 'navigate') return;                       // kun selve siden
  var url = new URL(req.url), base = new URL('./', self.location.href).pathname;
  if (url.origin !== self.location.origin) return;
  if (url.pathname !== base && url.pathname !== base + 'index.html') return;
  function putFresh(res){ if (res && res.ok){ var cp = res.clone(); caches.open(CACHE).then(function(c){ c.put('./', cp); }); } return res; }
  if (/[?&]_v=/.test(url.search)){                           // auto-oppdaterer / tvungen reload: nett først, cache som nødløsning
    e.respondWith(fetch(req).then(putFresh).catch(function(){ return caches.match('./'); }));
    return;
  }
  e.respondWith(                                             // vanlig åpning: cache først (åpner uten dekning), oppdater i bakgrunnen
    caches.match('./').then(function(hit){
      var net = fetch(req).then(putFresh);
      if (hit){ net.catch(function(){}); return hit; }
      return net;
    })
  );
});

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
  // Gløden legges også i Cache API («oppf-glow»): postMessage når ikke alltid fram på iPad når appen alt er åpen,
  // så appen sjekker dette lageret hver gang den får fokus (pendingGlowCheck i index.html) og sletter det etter bruk.
  var stash = caches.open('oppf-glow').then(function(c){
    var ps = [ c.put('./oppf-lastclick', new Response(String(Date.now()))) ]; // feilsøking: appen logger når service workeren sist så et varsel-trykk
    if (glow) ps.push(c.put('./oppf-glow', new Response(JSON.stringify({ glow:glow, t:Date.now() }), { headers:{ 'Content-Type':'application/json' } })));
    return Promise.all(ps);
  }).catch(function(){});
  e.waitUntil(
    stash.then(function(){ return clients.matchAll({ type:'window', includeUncontrolled:true }); }).then(function(list){
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
