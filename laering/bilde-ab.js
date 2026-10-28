// laering/bilde-ab.js — A/B-test av bildestørrelsen som sendes til AI-en (28.10.2026)
// Spørsmål: tolker modellen det samme fra et mindre bilde (B = 1280 px / jpeg 0,65) som fra dagens (A = 1400 px / 0,72)?
// Kjøres i en innlogget ADMIN-fane av den publiserte appen (Chrome): lim inn hele fila i konsollen, eller la Claude kjøre den.
// Henter alle selgeres kort med bilde fra de siste 14 dagene, sender A og B gjennom nøyaktig samme kall som appen
// (samme instruks, samme «Naa» som da kortet ble laget), og sammenligner dato (dag + klokkeslett), handling, navn, alder,
// salgsrunde, status, saksnummer, adresse og kommentar.
// Støykontroll: modellen er ikke deterministisk (funn.md: 12:00/13:00-flipp mellom like kjøringer). Alle kort med avvik, pluss
// et tilfeldig utvalg uten avvik, kjøres en gang til (A2/B2): ekte forskjell = A1==A2 && B1==B2 && A1!=B1, ellers støy.
// A1-mot-A2 på de kortene som ble kjørt to ganger er grunnlinja (så mye flakker modellen av seg selv).
// Beslutningsregel (skrevet FØR kjøring, se funn.md 28.10): bytt til 1280/0,65 bare hvis ekte=0 på dag, klokkeslett,
// handling, navn og alder, og ekte for salgsrunde ikke er høyere enn grunnlinja for salgsrunde.
// Merk: B lages ved å re-kode den lagrede A-jpeg-en (dobbel komprimering) → litt verre enn produksjons-B, som kodes rett fra
// skjermbildet. Testen er altså konservativ. Resultatet legges i window.__AB og lastes ned som bilde-ab-<dato>.json
// (navn, adresser, kommentarer og saksnummer bare som like/ulike – aldri selve verdiene). Kostnad: ~2–3 kall pr. kort.
(async function(){
  const DAGER=14,SAMTIDIG=3,B_PX=1280,B_Q=0.65,UTVALG=10;
  const log=function(){console.log.apply(console,['[bilde-ab]'].concat(Array.from(arguments)));};
  // --- oppsett lest ut av appens kildekode (samme som laering/eval.mjs) ---
  const src=await (await fetch(location.pathname,{cache:'no-store'})).text();
  const grab=re=>{const m=re.exec(src);if(!m)throw new Error('fant ikke '+re);return m[1];};
  const SUPA=grab(/supabaseUrl:\s*["']([^"']+)["']/),ANON=grab(/supabaseAnonKey:\s*["']([^"']+)["']/);
  const MODEL=grab(/AI_MODEL_KEY='([^']+)'/),EFFORT=grab(/AI_EFFORT='([^']+)'/);
  const ref=/https:\/\/([a-z0-9]+)\.supabase\.co/.exec(SUPA)[1];
  const sess=JSON.parse(localStorage.getItem('sb-'+ref+'-auth-token')||'null');
  if(!sess||!sess.access_token)throw new Error('Ikke innlogget i appen (ingen sb-…-auth-token i localStorage)');
  const myUid=sess.user&&sess.user.id,myEmail=sess.user&&sess.user.email;
  const H={apikey:ANON,Authorization:'Bearer '+sess.access_token};
  const cfg=await (await fetch(SUPA+'/rest/v1/app_config?select=anthropic_key&id=eq.1',{headers:H})).json();
  const KEY=cfg&&cfg[0]&&cfg[0].anthropic_key;if(!KEY)throw new Error('fikk ikke AI-nøkkel fra app_config');
  // funksjoner ordrett fra appen: én-linjes funksjoner tas som linja, ellers fram til «\n  }\n»
  const fnAny=name=>{const i=src.indexOf('  function '+name+'(');if(i<0)return null;const one=src.slice(i,src.indexOf('\n',i));try{new Function(one);return one;}catch(e){const j=src.indexOf('\n  }\n',i);return src.slice(i,j+4);}};
  const line=pre=>{const i=src.indexOf('\n  '+pre);if(i<0)throw new Error('fant ikke '+pre);return src.slice(i+1,src.indexOf('\n',i+1));};
  const promptApi=new Function('NOW',[line('const pad='),line('const MO='),"const hhmm=d=>pad(d.getHours())+':'+pad(d.getMinutes());const now=()=>NOW;",
    "function nowCtx(){const n=now();return ['Søndag','Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag'][n.getDay()]+' '+n.getDate()+'. '+MO[n.getMonth()]+' '+n.getFullYear()+', kl '+hhmm(n);}",
    fnAny('aiPromptStatic'),fnAny('aiPromptDynamic'),'return {statisk:aiPromptStatic(),dynamisk:aiPromptDynamic()};'].join('\n'));
  const STATIC=promptApi(new Date()).statisk;
  // salgsrundeFraLinje: fra appen om den finnes (build ≥148), ellers kopien under (identisk)
  const sfl=fnAny('salgsrundeFraLinje')||`function salgsrundeFraLinje(s){
    let t=String(s||'').replace(/[_\\/,;]+/g,' ').replace(/\\s+/g,' ').trim();if(!t)return '';
    t=t.replace(/\\s(?:jan|feb|mar|apr|mai|jun|jul|aug|sep|okt|nov|des)[a-zæøå]*\\s*\\d{2,4}$/i,'');
    const tok=t.split(' ').filter(function(x){return !/^(?:ftth|fttb|fttx|r[1-5])$/i.test(x);});
    let num='',bok='',i=tok.length-1,m;
    if(i>=0&&(m=/^([A-Da-d])?(\\d{1,2})$/.exec(tok[i]))){num=m[2];if(m[1])bok=m[1].toUpperCase();i--;}
    if(num&&!bok&&i>=0&&/^[A-Da-d]$/.test(tok[i])){bok=tok[i].toUpperCase();i--;}
    while(i>=0&&!/^[a-zæøåA-ZÆØÅ][a-zæøåA-ZÆØÅ.'-]*[a-zæøåA-ZÆØÅ.]$/.test(tok[i]))i--;
    if(i<0)return '';
    return tok[i]+(num?' '+bok+num:'');
  }`;
  const hjelp=new Function(fnAny('sisteJsonObjekt')+'\n'+sfl+'\nreturn {sisteJsonObjekt,salgsrundeFraLinje};')();
  // --- kort med bilde fra siste 14 dager, alle selgere ---
  const rows=await (await fetch(SUPA+'/rest/v1/oppf_snapshots?select=user_id,email,data',{headers:H})).json();
  if(!Array.isArray(rows))throw new Error('kunne ikke hente kort: '+JSON.stringify(rows).slice(0,200));
  const siden=Date.now()-DAGER*864e5;
  const kort=[];rows.forEach(r=>(Array.isArray(r.data)?r.data:[]).forEach(it=>{if(it&&it.hasImg&&it.ai&&+it.ai.ts>siden)kort.push({uid:r.user_id,who:String(r.email||'').split('@')[0],it});}));
  kort.sort((a,b)=>b.it.ai.ts-a.it.ai.ts);
  log('kort med bilde siste',DAGER,'dager:',kort.length,'(fra',rows.length,'selgere). Modell',MODEL,'effort',EFFORT);
  if(!kort.length)return;
  const hentBilde=async k=>{const r=await fetch(SUPA+'/storage/v1/object/authenticated/cardimg/'+k.uid+'/'+k.it.id+'.jpg',{headers:H});if(!r.ok)throw new Error('bilde '+r.status);const b=await r.blob();
    return await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(String(fr.result));fr.onerror=rej;fr.readAsDataURL(b);});};
  const annen=kort.find(k=>k.uid!==myUid); // probe: kan admin lese andre selgeres bilder?
  if(annen){try{await hentBilde(annen);}catch(e){console.error('[bilde-ab] Admin kan ikke lese andre selgeres bilder ('+e.message+'). Kjør i Supabase SQL Editor og prøv igjen:\n'
    +"create policy cardimg_admin_read on storage.objects for select to authenticated using (bucket_id='cardimg' and (auth.jwt()->>'email')='"+myEmail+"');");return;}}
  const reencode=(durl,max,q)=>new Promise((res,rej)=>{const img=new Image();img.onload=()=>{let w=img.width,h=img.height;if(w>=h&&w>max){h=Math.round(h*max/w);w=max;}else if(h>w&&h>max){w=Math.round(w*max/h);h=max;}
    const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);res(c.toDataURL('image/jpeg',q));};img.onerror=rej;img.src=durl;});
  const parts=durl=>{const i=durl.indexOf(';base64,');return {media:durl.slice(5,i),data:durl.slice(i+8)};};
  const kb=durl=>Math.round(parts(durl).data.length*3/4/1024);
  // --- AI-kall, nøyaktig som callClaude i appen ---
  const spor=async(durl,naa)=>{const p=parts(durl),dyn=promptApi(naa).dynamisk,t0=Date.now();
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':KEY,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({model:MODEL,max_tokens:2500,output_config:{effort:EFFORT},messages:[{role:'user',content:[{type:'text',text:STATIC,cache_control:{type:'ephemeral'}},{type:'image',source:{type:'base64',media_type:p.media,data:p.data}},{type:'text',text:dyn}]}]})});
    const d=await r.json();const ms=Date.now()-t0;if(d.type==='error')throw new Error(d.error&&d.error.message||'api-feil');
    const txt=(d.content||[]).map(c=>c.type==='text'?c.text:'').join('\n').replace(/```json/gi,'').replace(/```/g,'');
    let o=null;try{const a=txt.indexOf('{'),b=txt.lastIndexOf('}');o=JSON.parse(txt.slice(a,b+1));}catch(e){o=hjelp.sisteJsonObjekt(txt);}
    const u=d.usage||{};return {o:o||{},ms,prosa:Math.max(0,txt.indexOf('{')),ut:u.output_tokens||0,cache:u.cache_read_input_tokens||0};};
  // --- feltene som sammenlignes (rå JSON fra modellen; normaliserDato er deterministisk, så like råfelt gir like kort) ---
  const norm=s=>String(s||'').toLowerCase().replace(/\s*\(\d+\s*mbits?\)/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const felt=o=>({dag:typeof o.dato==='string'?o.dato.slice(0,10):null,tid:typeof o.dato==='string'?o.dato.slice(11,16):null,handling:String(o.nextAction||''),navn:norm(o.navn),alder:o.alder==null||o.alder===''?null:+o.alder,
    salgsrunde:hjelp.salgsrundeFraLinje(o.salgsrundeLinje)||hjelp.salgsrundeFraLinje(o.salgsrunde)||String(o.salgsrunde||''),status:String(o.status||''),sfNr:String(o.sfNr||'').replace(/\D/g,''),adresse:norm(o.adresse),kommentar:norm(o.kommentar),eksakt:!!o.eksaktDato});
  const FELT=['dag','tid','handling','navn','alder','salgsrunde','status','sfNr','adresse','kommentar','eksakt'],NOEKKEL=['dag','tid','handling','navn','alder','salgsrunde'],PRIVAT=['navn','adresse','kommentar','sfNr'];
  const eq=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
  // --- runde 1: A og B pr. kort (A først, så B – samme rekkefølge for alle) ---
  const res=[];let idx=0,feil=0;
  const jobb=async()=>{while(idx<kort.length){const k=kort[idx++];try{
      const a=await hentBilde(k),b=await reencode(a,B_PX,B_Q),naa=new Date(+k.it.ai.ts);
      const ra=await spor(a,naa),rb=await spor(b,naa);
      res.push({k,a,b,naa,A1:felt(ra.o),B1:felt(rb.o),msA:ra.ms,msB:rb.ms,kbA:kb(a),kbB:kb(b),utA:ra.ut,utB:rb.ut,prosaA:ra.prosa,prosaB:rb.prosa,cacheA:ra.cache,cacheB:rb.cache});
      log(res.length+'/'+kort.length,k.who,'A '+ra.ms+' ms '+kb(a)+' KB · B '+rb.ms+' ms '+kb(b)+' KB');
    }catch(e){feil++;console.warn('[bilde-ab] hoppet over',k.who,k.it.id,e.message);}}};
  await Promise.all(Array.from({length:SAMTIDIG},jobb));
  // --- runde 2 (støykontroll): alle med avvik + tilfeldig utvalg uten ---
  const ulik=r=>FELT.filter(f=>!eq(r.A1[f],r.B1[f]));
  const rerun=res.filter(r=>ulik(r).length),resten=res.filter(r=>!ulik(r).length);
  for(let i=0;i<UTVALG&&resten.length;i++){const j=Math.floor(Math.random()*resten.length);rerun.push(resten.splice(j,1)[0]);}
  log('runde 2 (A2/B2):',rerun.length,'kort');
  idx=0;const jobb2=async()=>{while(idx<rerun.length){const r=rerun[idx++];try{const ra=await spor(r.a,r.naa),rb=await spor(r.b,r.naa);r.A2=felt(ra.o);r.B2=felt(rb.o);}catch(e){console.warn('[bilde-ab] A2/B2 feilet',e.message);}}};
  await Promise.all(Array.from({length:SAMTIDIG},jobb2));
  // --- oppsummering ---
  const ekte={},stoey={},like={},grunn={kort:0,uenige:{}};
  res.forEach(r=>{FELT.forEach(f=>{like[f]=(like[f]||0)+(eq(r.A1[f],r.B1[f])?1:0);});
    if(r.A2){grunn.kort++;FELT.forEach(f=>{if(!eq(r.A1[f],r.A2[f]))grunn.uenige[f]=(grunn.uenige[f]||0)+1;});}
    FELT.forEach(f=>{if(eq(r.A1[f],r.B1[f]))return;if(r.A2&&r.B2&&eq(r.A1[f],r.A2[f])&&eq(r.B1[f],r.B2[f]))ekte[f]=(ekte[f]||0)+1;else stoey[f]=(stoey[f]||0)+1;});});
  const med=a=>{a=a.slice().sort((x,y)=>x-y);return a.length?a[a.length>>1]:null;};
  const kortUt=res.map(r=>{const o={who:r.k.who,ts:new Date(+r.k.it.ai.ts).toISOString().slice(0,16),kbA:r.kbA,kbB:r.kbB,msA:r.msA,msB:r.msB,utA:r.utA,utB:r.utB,prosaA:r.prosaA,prosaB:r.prosaB,felt:{}};
    FELT.forEach(f=>{const priv=PRIVAT.indexOf(f)>=0;o.felt[f]={likt:eq(r.A1[f],r.B1[f]),a1:priv?undefined:r.A1[f],b1:priv?undefined:r.B1[f],a2:(r.A2&&!priv)?r.A2[f]:undefined,b2:(r.B2&&!priv)?r.B2[f]:undefined,
      a1a2Likt:r.A2?eq(r.A1[f],r.A2[f]):undefined,b1b2Likt:r.B2?eq(r.B1[f],r.B2[f]):undefined};});return o;});
  const n=f=>ekte[f]||0,gb=grunn.uenige.salgsrunde||0;
  const groent=NOEKKEL.filter(f=>f!=='salgsrunde').every(f=>n(f)===0)&&n('salgsrunde')<=gb;
  const ut={dato:new Date().toISOString(),modell:MODEL,effort:EFFORT,dager:DAGER,a:{px:1400,q:0.72},b:{px:B_PX,q:B_Q,merknad:'B er re-kodet fra lagret A-jpeg (dobbel komprimering) → litt verre enn produksjons-B som kodes rett fra skjermbildet; testen er konservativ'},
    antallKort:res.length,feil,like,ekte,stoey,grunnlinje:grunn,
    medianMs:{a:med(res.map(r=>r.msA)),b:med(res.map(r=>r.msB))},medianKb:{a:med(res.map(r=>r.kbA)),b:med(res.map(r=>r.kbB))},medianUtTok:{a:med(res.map(r=>r.utA)),b:med(res.map(r=>r.utB))},
    cacheTreff:{a:res.filter(r=>r.cacheA>0).length,b:res.filter(r=>r.cacheB>0).length},
    beslutning:(groent?'GRØNT':'RØDT')+': ekte forskjeller dag='+n('dag')+' tid='+n('tid')+' handling='+n('handling')+' navn='+n('navn')+' alder='+n('alder')+' salgsrunde='+n('salgsrunde')+' (grunnlinje salgsrunde A1≠A2: '+gb+' av '+grunn.kort+' kort kjørt to ganger)',
    kort:kortUt};
  window.__AB=ut;
  log('FERDIG —',ut.beslutning);
  log(JSON.stringify({antallKort:ut.antallKort,feil,like,ekte,stoey,grunnlinje:grunn,medianMs:ut.medianMs,medianKb:ut.medianKb,medianUtTok:ut.medianUtTok,cacheTreff:ut.cacheTreff}));
  try{const blob=new Blob([JSON.stringify(ut,null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='bilde-ab-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},5000);}catch(e){console.warn('[bilde-ab] nedlasting feilet',e.message);}
})().catch(e=>console.error('[bilde-ab] FEIL',e));
