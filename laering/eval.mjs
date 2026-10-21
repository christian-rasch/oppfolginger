// Måler datotolkningen i index.html mot FASITEN (laering/fasit.json = hva selgeren mente, vurdert av Claude),
// både modellen alene (rå svar) og hele kjeden (modell + normaliserDato = det selgeren faktisk får).
// Testen er tekstbasert: notatet sendes som tekst med samme instruks og samme «Naa» som da kortet ble laget.
//
//   node laering/eval.mjs                      → appens modell/innsats, nyeste datafil, alle kort med fasit
//   node laering/eval.mjs --modeller            → sammenlign Sonnet/Haiku/Opus 5.5 + lav innsats
//   node laering/eval.mjs --model claude-haiku-5-5 --effort low --n 60
//   node laering/eval.mjs --bare-data           → ingen API-kall: bare «stille feil» (kort som står feil uten at noen rettet)
//   node laering/eval.mjs --json                → maskinlesbart (brukes av gjennomgangen)
//
// API-nøkkel: ANTHROPIC_API_KEY, ellers laering/.apikey, ellers feltet "apikey" i datafila.
import {readFileSync, readdirSync, existsSync, writeFileSync, appendFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const HERE=dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);
const {laerApi}=require('./tester.js');
const api=laerApi();
const arg=(n,d)=>{const i=process.argv.indexOf('--'+n);return i>0&&process.argv[i+1]&&!process.argv[i+1].startsWith('--')?process.argv[i+1]:d;};
const flag=n=>process.argv.includes('--'+n);

// ---- prompt (fast + dynamisk del) og modellvalg ut av index.html ----
const html=readFileSync(join(HERE,'..','index.html'),'utf8');
const fnSrc=name=>{const i=html.indexOf('  function '+name+'(){');if(i<0)throw new Error('fant ikke '+name);const j=html.indexOf('\n  }\n',i);return html.slice(i,j+4);};
const line=pre=>{const i=html.indexOf('\n  '+pre);if(i<0)throw new Error('fant ikke '+pre);return html.slice(i+1,html.indexOf('\n',i+1));};
const APP_MODEL=/AI_MODEL_KEY='([^']+)'/.exec(html)[1];
const APP_EFFORT=/AI_EFFORT='([^']+)'/.exec(html)[1];
const promptApi=new Function('NOW',[line('const pad='),line('const MO='),"const hhmm=d=>pad(d.getHours())+':'+pad(d.getMinutes());const now=()=>NOW;",
  "function nowCtx(){const n=now();return ['Søndag','Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag'][n.getDay()]+' '+n.getDate()+'. '+MO[n.getMonth()]+' '+n.getFullYear()+', kl '+hhmm(n);}",
  fnSrc('aiPromptStatic'),fnSrc('aiPromptDynamic'),'return {statisk:aiPromptStatic(),dynamisk:aiPromptDynamic()};'].join('\n'));
const STATIC=promptApi(new Date()).statisk;

// ---- data + fasit ----
const dataDir=join(HERE,'data');
const dataFile=arg('data',(()=>{if(!existsSync(dataDir))return null;const f=readdirSync(dataDir).filter(x=>/^laering-.*\.json$/.test(x)).sort().pop();return f?join(dataDir,f):null;})());
if(!dataFile||!existsSync(dataFile)){console.error('Ingen datafil. Kjør eksporten først (laering/README.md).');process.exit(2);}
const data=JSON.parse(readFileSync(dataFile,'utf8'));
const fasitFil=join(HERE,'fasit.json');
const fasit=existsSync(fasitFil)?JSON.parse(readFileSync(fasitFil,'utf8')):{kort:[]};
const F=new Map(fasit.kort.map(e=>[e.id,e]));
const idOf=k=>k.who+'|'+k.opprettet+'|'+createHash('md5').update(k.kommentar||'').digest('hex').slice(0,10);
const dag=s=>(s||'').slice(0,10);
// «opprettet»/«ai.ts» i eksporten er UTC (toISOString), mens kortets datoer er norsk tid. Uten «Z» leser Node strengen som lokal tid
// → «Naa» ble 2 timer for tidlig (feil ukedag etter kl 22 norsk tid, feil «passert»-vurdering). Rettet 21.10.2026.
const naaAv=k=>new Date((k.ai&&k.ai.ts||k.opprettet)+(/Z$|[+-]\d\d:\d\d$/.test(k.ai&&k.ai.ts||k.opprettet)?'':':00Z'));
// alle AI-kort med fasit (ikke usikre) + umerkede AI-kort med tidsord (provisorisk fasit = kortets dato)
const TW=/(i ?dag|i ?morgen|imrg|i ?mrg|imorra|i ?kveld|mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag|\b(man|tirs|ons|tors|fre|lør|søn)\b|neste uke|til uka|uke|\bkl\b|\bk[iI1]\s?\d|\d{1,2}[:.]\d{2}|\b\d{4}\b|\b(jan|feb|mars|april|mai|juni|juli|aug|sep|okt|nov|des)\w*|\d{1,2}[./]\d{1,2}|etter jobb|ettermiddag|formiddag|senere|tilbake|nyttår|jul\b|om \w+ (dag|uke)|ring\w* \d)/i;
const normN=s=>String(s||'').replace(/\s*\(\d+\s*mbits?\)/gi,'').replace(/\s+/g,' ').trim();
const notatEndret=k=>k.ai&&typeof k.ai.kommentar==='string'&&normN(k.ai.kommentar)!==normN(k.kommentar); // selger skrev/endret notatet ETTER import → AI så annen tekst
const endret=data.kort.filter(k=>k.ai&&k.opprettet&&notatEndret(k)).length;
const alle=data.kort.filter(k=>k.ai&&k.opprettet&&!notatEndret(k)).map(k=>{const e=F.get(idOf(k));
  if(e)return e.usikker?null:{k,gull:e.gull,tidFri:!!e.tidFri,prov:false,merknad:e.merknad||''};
  if(!TW.test(k.kommentar||''))return null;
  return {k,gull:k.dato,tidFri:true,prov:true,merknad:'(uten fasit – kortets dato brukt)'};}).filter(Boolean)
  .sort((a,b)=>(b.k.ai.ts||b.k.opprettet).localeCompare(a.k.ai.ts||a.k.opprettet));
const N=+arg('n',200);const sett=alle.slice(0,N);
const umerket=alle.filter(x=>x.prov).length;
// «nye» kort = AI-tolket etter forrige gjennomgang (--siden ISO, ellers laering/.sist-kjort, ellers 14 dager tilbake). Det er den ekte testen: regler laget FØR disse kortene fantes.
const sidenArg=arg('siden',null);
const SIDEN=sidenArg?new Date(sidenArg):(existsSync(join(HERE,'.sist-kjort'))?new Date(+readFileSync(join(HERE,'.sist-kjort'),'utf8').trim()*1000):new Date(Date.now()-14*864e5));
const erNy=x=>naaAv(x.k)>SIDEN;
const nye=alle.filter(erNy);
// laert klokkeslett: hvor ofte retter selgeren bort fra timen appen laerte? (krever ai.tidLaert i eksporten, build ≥125)
const laert=data.kort.filter(k=>k.ai&&k.ai.tidLaert!=null),laertRettet=laert.filter(k=>k.ai.dato&&k.dato&&k.ai.dato!==k.dato&&k.ai.dato.slice(0,10)===k.dato.slice(0,10)).length;

// ---- stille feil (uten API): kortet står på en annen DAG enn fasiten, og ingen har rettet (ai.dato == kortets dato) ----
const stille=alle.filter(x=>!x.prov&&x.k.state!=='fulgt'&&(x.k.ai.dato||null)===(x.k.dato||null)&&dag(x.k.dato)!==dag(x.gull))
  .map(x=>({who:x.k.who,naa:x.k.ai.ts||x.k.opprettet,notat:(x.k.kommentar||'').slice(0,100),kort:x.k.dato,fasit:x.gull,merknad:x.merknad}));
const rettet=alle.filter(x=>!x.prov&&(x.k.ai.dato||null)!==(x.k.dato||null)).length;
const nyeSignal={nye:nye.length,nyeUmerket:nye.filter(x=>x.prov).length,nyeRettet:nye.filter(x=>(x.k.ai.dato||null)!==(x.k.dato||null)).length,
  nyeUtenDatoMedTidsord:nye.filter(x=>x.k.state!=='fulgt'&&!x.k.dato&&TW.test(x.k.kommentar||'')).length,
  nyeStilleFeil:stille.filter(s=>new Date(s.naa+':00Z')>SIDEN).length,siden:SIDEN.toISOString().slice(0,16)};

if(flag('bare-data')){
  const r={data:dataFile.split('/').pop(),kortMedFasit:alle.length-umerket,umerket,notatEndretEtterImport:endret,rettetAvSelger:rettet,laertTime:{kort:laert.length,selgerRettetTid:laertRettet},signal:nyeSignal,stilleFeil:stille,promptTegn:STATIC.length};
  if(flag('json'))console.log(JSON.stringify(r,null,1));
  else{console.log('Kort med fasit: '+r.kortMedFasit+', uten fasit (nye): '+umerket+', notat endret etter import (holdes utenfor): '+endret+', rettet av selger: '+rettet+'\nStille feil (står på feil dag, ingen har rettet): '+stille.length);
    stille.forEach(x=>console.log('  ['+x.who+' '+x.naa+'] «'+x.notat+'» kort='+(x.kort||'ingen')+' fasit='+(x.fasit||'ingen')+(x.merknad?' – '+x.merknad:'')));
    console.log('Nye kort siden '+nyeSignal.siden+': '+nyeSignal.nye+' (uten fasit '+nyeSignal.nyeUmerket+', rettet '+nyeSignal.nyeRettet+', uten dato m/tidsord '+nyeSignal.nyeUtenDatoMedTidsord+', stille feil '+nyeSignal.nyeStilleFeil+')');
    console.log('Lært klokkeslett brukt på '+laert.length+' kort, selger endret tiden på '+laertRettet+'. Fast instruks: '+STATIC.length+' tegn.');}
  process.exit(0);
}

// ---- modellkall (samme meldingsstruktur som appen: fast del med cache_control, deretter dynamisk del) ----
const apiKey=process.env.ANTHROPIC_API_KEY||(existsSync(join(HERE,'.apikey'))?readFileSync(join(HERE,'.apikey'),'utf8').trim():'')||data.apikey||'';
if(!apiKey){console.error('Mangler API-nøkkel (ANTHROPIC_API_KEY, laering/.apikey eller "apikey" i datafila).');process.exit(2);}
async function spor(model,effort,x){
  const naa=naaAv(x.k); // norsk tid (UTC-streng + Z)
  const dyn=promptApi(naa).dynamisk+'\n\nDENNE GANGEN ER DET IKKE NOE BILDE. Her er teksten i det blaa notatet ved den valgte pinen, ordrett: «'+x.k.kommentar+'». Panelet viser ingen andre opplysninger. Svar med JSON-objektet som beskrevet (navn/adresse/telefon/sfNr kan vaere tomme).';
  const t0=Date.now();
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},
    body:JSON.stringify({model,max_tokens:1200,output_config:{effort},messages:[{role:'user',content:[{type:'text',text:STATIC,cache_control:{type:'ephemeral'}},{type:'text',text:dyn}]}]})});
  const d=await r.json();const ms=Date.now()-t0;
  if(d.type==='error')throw new Error(model+': '+(d.error&&d.error.message||'api-feil'));
  const txt=(d.content||[]).map(c=>c.type==='text'?c.text:'').join('\n').replace(/```json/gi,'').replace(/```/g,'');
  let o={dato:null,eksaktDato:false,datoGrunn:'(ugyldig JSON)',kommentar:x.k.kommentar};
  try{const a=txt.indexOf('{'),b=txt.lastIndexOf('}');let j;try{j=JSON.parse(txt.slice(a,b+1));}catch(e){j=api.sisteJsonObjekt(txt);if(!j)throw e;} // to objekter → det siste (som appen)
    o={dato:typeof j.dato==='string'?j.dato.slice(0,16):null,eksaktDato:!!j.eksaktDato,datoGrunn:String(j.datoGrunn||'').slice(0,90),kommentar:x.k.kommentar};}catch(e){}
  const raa=o.dato;
  api.normaliserDato(o,{now:naa,learnedHour:null});
  const u=d.usage||{};
  return {raa,pipe:o.dato,grunn:o.datoGrunn,ms,inn:u.input_tokens||0,ut:u.output_tokens||0,cache:(u.cache_read_input_tokens||0),cacheSkriv:(u.cache_creation_input_tokens||0)};
}
async function kjor(model,effort){
  const res=[];let i=0;
  await Promise.all(Array.from({length:4},async()=>{while(i<sett.length){const x=sett[i++];try{res.push({x,...await spor(model,effort,x)});}catch(e){res.push({x,feil:String(e.message)});}}}));
  const ok=res.filter(r=>!r.feil);
  const m=felt=>{const dagOk=ok.filter(r=>dag(r[felt])===dag(r.x.gull)).length;
    const tid=ok.filter(r=>!r.x.tidFri&&r.x.gull);const eks=tid.filter(r=>(r[felt]||null)===(r.x.gull||null)).length;
    const ingen=ok.filter(r=>!r[felt]&&r.x.gull).length,falsk=ok.filter(r=>r[felt]&&!r.x.gull).length;
    return {dag:dagOk,dagPct:Math.round(100*dagOk/Math.max(1,ok.length)),eksakt:eks,eksaktAv:tid.length,eksaktPct:Math.round(100*eks/Math.max(1,tid.length)),ingenDatoFeil:ingen,falskDato:falsk};};
  const lat=ok.map(r=>r.ms).sort((a,b)=>a-b);
  const okNye=ok.filter(r=>erNy(r.x)),nyeDag=okNye.filter(r=>dag(r.pipe)===dag(r.x.gull)).length;
  return {model,effort,n:ok.length,feil:res.length-ok.length,raa:m('raa'),pipe:m('pipe'),nye:{n:okNye.length,dag:nyeDag,dagPct:okNye.length?Math.round(100*nyeDag/okNye.length):null},medianMs:lat[Math.floor(lat.length/2)]||0,
    tokInn:ok.reduce((s,r)=>s+r.inn,0),tokUt:ok.reduce((s,r)=>s+r.ut,0),cacheLest:ok.reduce((s,r)=>s+r.cache,0),
    bom:ok.filter(r=>dag(r.pipe)!==dag(r.x.gull)).map(r=>({who:r.x.who||r.x.k.who,naa:r.x.k.ai.ts||r.x.k.opprettet,notat:(r.x.k.kommentar||'').slice(0,110),fasit:r.x.gull,raa:r.raa,pipeline:r.pipe,grunn:r.grunn,merknad:r.x.merknad}))};
}

const kandidater=flag('modeller')?[[APP_MODEL,APP_EFFORT],['claude-haiku-5-5',APP_EFFORT],['claude-opus-5-5',APP_EFFORT],[APP_MODEL,'low']]:[[arg('model',APP_MODEL),arg('effort',APP_EFFORT)]];
const resultater=[];
for(const [m,e] of kandidater){process.stderr.write('Tester '+m+' ('+e+') på '+sett.length+' kort… ');const r=await kjor(m,e);resultater.push(r);
  process.stderr.write('rå: '+r.raa.dagPct+'% dag · kjede: '+r.pipe.dagPct+'% dag, '+r.pipe.eksaktPct+'% eksakt ('+r.pipe.eksaktAv+'), ingen-dato-feil '+r.pipe.ingenDatoFeil+' · NYE kort: '+(r.nye.dagPct==null?'ingen':r.nye.dag+'/'+r.nye.n+' = '+r.nye.dagPct+'%')+', median '+r.medianMs+' ms, cache '+Math.round(100*r.cacheLest/Math.max(1,r.tokInn+r.cacheLest))+'%\n');}
const stamp=new Date().toLocaleString('sv-SE',{timeZone:'Europe/Oslo'}).slice(0,16); // norsk tid (var UTC før 17.10)
const hist=join(HERE,'eval-historikk.md');
if(!existsSync(hist)||!readFileSync(hist,'utf8').includes('| Nye kort: dag |'))writeFileSync(hist,(existsSync(hist)?readFileSync(hist,'utf8')+'\n':'# Eval-historikk (datotolkning på ekte notater)\n\n')+'## Mot fasit (laering/fasit.json), fra 15.10.2026\n\n| Når | Modell | Innsats | Kort | Rå: dag | Kjede: dag | Kjede: eksakt | Ingen-dato-feil | Falsk dato | Nye kort: dag | Median | Tokens inn/ut | Cache-treff |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|\n');
appendFileSync(hist,resultater.map(r=>'| '+stamp+' | '+r.model+' | '+r.effort+' | '+r.n+' | '+r.raa.dagPct+'% | '+r.pipe.dagPct+'% | '+r.pipe.eksaktPct+'% ('+r.pipe.eksaktAv+') | '+r.pipe.ingenDatoFeil+' | '+r.pipe.falskDato+' | '+(r.nye.dagPct==null?'–':r.nye.dag+'/'+r.nye.n)+' | '+r.medianMs+' ms | '+r.tokInn+'/'+r.tokUt+' | '+Math.round(100*r.cacheLest/Math.max(1,r.tokInn+r.cacheLest))+'% |').join('\n')+'\n');
if(flag('json'))console.log(JSON.stringify({data:dataFile.split('/').pop(),kort:sett.length,umerket,notatEndretEtterImport:endret,signal:nyeSignal,laertTime:{kort:laert.length,selgerRettetTid:laertRettet},promptTegn:STATIC.length,stilleFeil:stille,resultater},null,1));
else{
  console.log('\nResultat ('+sett.length+' kort med fasit fra '+dataFile.split('/').pop()+(umerket?', '+umerket+' uten fasit':'')+'):');
  resultater.forEach(r=>console.log('  '+r.model+' ('+r.effort+'): rå dag '+r.raa.dagPct+'% · kjede dag '+r.pipe.dagPct+'%, eksakt '+r.pipe.eksaktPct+'% av '+r.pipe.eksaktAv+', ingen-dato-feil '+r.pipe.ingenDatoFeil+', falsk dato '+r.pipe.falskDato+', median '+r.medianMs+' ms, tokens '+r.tokInn+'/'+r.tokUt+', cache-treff '+Math.round(100*r.cacheLest/Math.max(1,r.tokInn+r.cacheLest))+'%'+(r.feil?', '+r.feil+' api-feil':'')));
  const b=resultater[0].bom;if(b.length){console.log('\nKjeden bommer på dag ('+resultater[0].model+'):');b.forEach(x=>console.log('  ['+x.who+' '+x.naa+'] «'+x.notat+'» → rå '+(x.raa||'ingen')+' → kjede '+(x.pipeline||'ingen')+' | fasit '+(x.fasit||'ingen')+' | '+x.grunn+(x.merknad?' | '+x.merknad:'')));}
  if(stille.length){console.log('\nStille feil i dataene (feil dag, ingen har rettet): '+stille.length+' – se --bare-data');}
}
