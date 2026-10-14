// Kjøres i Chrome-fanen der Oppfølginger-appen er åpen og Christian er innlogget (admin).
// Henter alle selgeres kort fra skyen, FJERNER navn/adresser/telefon, og legger to lister i window:
//   window.__L1 = aktive kort UTEN dato der notatet likevel har tids-/dagsord  (= tolkningen bommet)
//   window.__L2 = kort der selgeren har endret datoen AI satte            (= hva selgeren egentlig mente)
// Les ut med f.eks.  window.__L1.join('\n')  og  window.__L2.slice(0,4).join('\n')  (små biter, ellers kuttes svaret).
(async()=>{
const tok=JSON.parse(localStorage.getItem('sb-lmomwyyaxjeobbfuklgv-auth-token')).access_token;
const anon=document.documentElement.innerHTML.match(/supabaseAnonKey:"([^"]+)"/)[1];
const r=await fetch('https://lmomwyyaxjeobbfuklgv.supabase.co/rest/v1/oppf_snapshots?select=user_id,email,updated_at,app_build,data',{headers:{apikey:anon,Authorization:'Bearer '+tok}});
const rows=await r.json();
const scrub=t=>String(t||'').replace(/\d{8,}|(\d{2,3}\s?){3,4}/g,'[tlf]').replace(/\s+/g,' ').trim();
const TW=/(i ?dag|i ?morgen|imrg|i ?mrg|i ?kveld|mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag|\b(man|tirs|ons|tors|fre|lør|søn)\b|neste uke|til uka|uke|\bkl\b|\d{1,2}[:.]\d{2}|\b(jan|feb|mars|april|mai|juni|juli|aug|sep|okt|nov|des)\w*|\d{1,2}[./]\d{1,2}|etter jobb|ettermiddag|formiddag|senere|tilbake|nyttår|jul\b|om \d|helg)/i;
const L1=[],L2=[];let total=0,withAi=0;
rows.forEach(x=>{const who=x.email.split('@')[0];(Array.isArray(x.data)?x.data:[]).forEach(i=>{total++;if(i.ai)withAi++;
  const k=scrub(i.kommentar),d=new Date(i.opprettet).toISOString().slice(0,10);
  if(i.state!=='fulgt'&&!i.dato&&TW.test(k))L1.push([who,d,i.nextAction||'-',i.ai?('ai:'+(i.ai.dato||'null')+'/raw:'+(i.ai.raw||'-')+'/'+scrub(i.ai.grunn)):'ai:-',k.slice(0,170)].join(' | '));
  if(i.ai&&i.ai.dato!==i.dato)L2.push([who,d,(i.ai.dato||'null')+'→'+(i.dato||'null'),i.state,scrub(i.ai.grunn).slice(0,70),k.slice(0,150)].join(' | '));
});});
window.__L1=L1;window.__L2=L2;
console.log({total,withAi,utenDato:L1.length,rettet:L2.length});
})();
