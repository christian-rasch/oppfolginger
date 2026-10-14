// Måler hvor godt AI-instruksen i index.html tolker ekte notater til dato – og kan sammenligne modeller.
// Fasit = datoen som står på kortet nå (selgeren har godkjent eller rettet den). Testen er tekst-basert:
// notatet sendes som tekst i stedet for skjermbilde, så det er DATOTOLKNINGEN som måles (ikke lesing av bildet).
//
//   node laering/eval.mjs                         → kjør med appens modell/innsats, nyeste datafil
//   node laering/eval.mjs --modeller               → sammenlign claude-sonnet-5-5, claude-haiku-5-5, claude-opus-5-5
//   node laering/eval.mjs --model claude-haiku-5-5 --effort low --n 60 --data laering/data/laering-2026-10-15.json
//   node laering/eval.mjs --json                   → maskinlesbart resultat (brukes av gjennomgangen)
//
// API-nøkkel: miljøvariabel ANTHROPIC_API_KEY, ellers fila laering/.apikey, ellers feltet "apikey" i datafila.
import {readFileSync, readdirSync, existsSync, writeFileSync, appendFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE=dirname(fileURLToPath(import.meta.url));
const arg=(n,d)=>{const i=process.argv.indexOf('--'+n);return i>0&&process.argv[i+1]&&!process.argv[i+1].startsWith('--')?process.argv[i+1]:d;};
const flag=n=>process.argv.includes('--'+n);

// ---- hent prompt-funksjonen og modellvalg ut av index.html ----
const html=readFileSync(join(HERE,'..','index.html'),'utf8');
const grab=(re,what)=>{const m=re.exec(html);if(!m)throw new Error('fant ikke '+what+' i index.html');return m[0];};
const promptSrc=html.slice(html.indexOf('  function aiPrompt(){'),html.indexOf('\n  }\n',html.indexOf('  function aiPrompt(){'))+4);
const MO=grab(/^\s*const MO=.*$/m,'MO');
const APP_MODEL=/AI_MODEL_KEY='([^']+)'/.exec(html)[1];
const APP_EFFORT=/AI_EFFORT='([^']+)'/.exec(html)[1];
let NOW=new Date();
const helpers=`const pad=n=>String(n).padStart(2,'0');const hhmm=d=>pad(d.getHours())+':'+pad(d.getMinutes());const now=()=>NOW;
function nowCtx(){const n=now();return ['Søndag','Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag'][n.getDay()]+' '+n.getDate()+'. '+MO[n.getMonth()]+' '+n.getFullYear()+', kl '+hhmm(n);}`;
const buildPrompt=new Function('NOW',MO+'\n'+helpers+'\n'+promptSrc+'\nreturn aiPrompt();');

// ---- data ----
const dataDir=join(HERE,'data');
const dataFile=arg('data',(()=>{if(!existsSync(dataDir))return null;const f=readdirSync(dataDir).filter(x=>/^laering-.*\.json$/.test(x)).sort().pop();return f?join(dataDir,f):null;})());
if(!dataFile||!existsSync(dataFile)){console.error('Ingen datafil. Kjør eksporten først (laering/README.md).');process.exit(2);}
const data=JSON.parse(readFileSync(dataFile,'utf8'));
const apiKey=process.env.ANTHROPIC_API_KEY||(existsSync(join(HERE,'.apikey'))?readFileSync(join(HERE,'.apikey'),'utf8').trim():'')||data.apikey||'';
if(!apiKey){console.error('Mangler API-nøkkel (ANTHROPIC_API_KEY, laering/.apikey eller "apikey" i datafila).');process.exit(2);}
const N=+arg('n',80);
// testsett: kort med AI-tolkning OG notat med tids-/dagsord, nyeste først; dato kan være null (= fasit «ingen dato»)
const TW=/(i ?dag|i ?morgen|imrg|i ?mrg|i ?kveld|mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag|\b(man|tirs|ons|tors|fre|lør|søn)\b|neste uke|til uka|uke|\bkl\b|\d{1,2}[:.]\d{2}|\b\d{4}\b|\b(jan|feb|mars|april|mai|juni|juli|aug|sep|okt|nov|des)\w*|\d{1,2}[./]\d{1,2}|etter jobb|ettermiddag|formiddag|senere|tilbake|nyttår|jul\b|om \w+ (dag|uke)|ring\w* \d)/i;
const sett=data.kort.filter(k=>k.ai&&k.kommentar&&TW.test(k.kommentar)&&k.opprettet).sort((a,b)=>b.opprettet.localeCompare(a.opprettet)).slice(0,N);

// ---- modellkall ----
async function spor(model,effort,k){
  const naa=new Date(k.opprettet);
  const prompt=buildPrompt(naa)+'\n\nDENNE GANGEN ER DET IKKE NOE BILDE. Her er teksten i det blaa notatet ved den valgte pinen, ordrett: «'+k.kommentar+'». Panelet viser ingen andre opplysninger. Svar med JSON-objektet som beskrevet (feltene navn/adresse/telefon/sfNr kan vaere tomme).';
  const t0=Date.now();
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},
    body:JSON.stringify({model,max_tokens:1200,output_config:{effort},messages:[{role:'user',content:[{type:'text',text:prompt}]}]})});
  const d=await r.json();const ms=Date.now()-t0;
  if(d.type==='error')throw new Error(model+': '+(d.error&&d.error.message||'api-feil'));
  const txt=(d.content||[]).map(c=>c.type==='text'?c.text:'').join('\n').replace(/```json/gi,'').replace(/```/g,'');
  let dato=null,grunn='';
  try{const a=txt.indexOf('{'),b=txt.lastIndexOf('}');const o=JSON.parse(txt.slice(a,b+1));dato=typeof o.dato==='string'?o.dato.slice(0,16):null;grunn=String(o.datoGrunn||'').slice(0,80);
    if(dato&&!o.eksaktDato){const yy=+dato.slice(0,4),cy=naa.getFullYear();if(yy<cy)dato=String(cy)+dato.slice(4);} // samme årstallsvakt som appen
  }catch(e){grunn='(ugyldig JSON)';}
  return {dato,grunn,ms,inn:(d.usage||{}).input_tokens||0,ut:(d.usage||{}).output_tokens||0};
}
async function kjor(model,effort){
  const res=[];let i=0;
  await Promise.all(Array.from({length:4},async()=>{while(i<sett.length){const k=sett[i++];try{res.push({k,...await spor(model,effort,k)});}catch(e){res.push({k,feil:String(e.message)});}}}));
  const ok=res.filter(r=>!r.feil);
  const dag=ok.filter(r=>(r.dato||'').slice(0,10)===(r.k.dato||'').slice(0,10)).length;
  const eksakt=ok.filter(r=>(r.dato||null)===(r.k.dato||null)).length;
  const ingenDatoFeil=ok.filter(r=>!r.dato&&r.k.dato).length; // modellen ga ingen dato, men kortet har en → havner «Uten tidspunkt»
  const lat=ok.map(r=>r.ms).sort((a,b)=>a-b);
  return {model,effort,n:ok.length,feil:res.length-ok.length,dag,eksakt,dagPct:Math.round(100*dag/Math.max(1,ok.length)),eksaktPct:Math.round(100*eksakt/Math.max(1,ok.length)),
    ingenDatoFeil,medianMs:lat[Math.floor(lat.length/2)]||0,tokInn:ok.reduce((s,r)=>s+r.inn,0),tokUt:ok.reduce((s,r)=>s+r.ut,0),
    bom:ok.filter(r=>(r.dato||'').slice(0,10)!==(r.k.dato||'').slice(0,10)).map(r=>({who:r.k.who,naa:r.k.opprettet,notat:r.k.kommentar.slice(0,120),fasit:r.k.dato,modell:r.dato,grunn:r.grunn}))};
}

const kandidater=flag('modeller')?[[APP_MODEL,APP_EFFORT],['claude-haiku-5-5',APP_EFFORT],['claude-opus-5-5',APP_EFFORT],[APP_MODEL,'low']]:[[arg('model',APP_MODEL),arg('effort',APP_EFFORT)]];
const resultater=[];
for(const [m,e] of kandidater){process.stderr.write('Tester '+m+' ('+e+') på '+sett.length+' kort… ');const r=await kjor(m,e);resultater.push(r);process.stderr.write(r.dagPct+'% riktig dag, '+r.eksaktPct+'% eksakt, median '+r.medianMs+' ms\n');}
const stamp=new Date().toISOString().slice(0,16).replace('T',' ');
const linjer=resultater.map(r=>'| '+stamp+' | '+r.model+' | '+r.effort+' | '+r.n+' | '+r.dagPct+'% | '+r.eksaktPct+'% | '+r.ingenDatoFeil+' | '+r.medianMs+' ms | '+r.tokInn+'/'+r.tokUt+' |');
const hist=join(HERE,'eval-historikk.md');
if(!existsSync(hist))writeFileSync(hist,'# Eval-historikk (datotolkning på ekte notater)\n\n| Når | Modell | Innsats | Kort | Riktig dag | Eksakt | Ga ingen dato (feil) | Median tid | Tokens inn/ut |\n|---|---|---|---|---|---|---|---|---|\n');
appendFileSync(hist,linjer.join('\n')+'\n');
if(flag('json'))console.log(JSON.stringify({data:dataFile,kort:sett.length,resultater},null,1));
else{console.log('\nResultat ('+sett.length+' kort fra '+dataFile.split('/').pop()+'):');resultater.forEach(r=>{console.log('  '+r.model+' ('+r.effort+'): riktig dag '+r.dagPct+'%, eksakt '+r.eksaktPct+'%, ingen-dato-feil '+r.ingenDatoFeil+', median '+r.medianMs+' ms, tokens '+r.tokInn+'/'+r.tokUt+(r.feil?', '+r.feil+' api-feil':''));});
  const b=resultater[0].bom;if(b.length){console.log('\nBommer ('+resultater[0].model+'), første 25:');b.slice(0,25).forEach(x=>console.log('  ['+x.who+' '+x.naa+'] «'+x.notat+'» → modell '+(x.modell||'ingen')+' | fasit '+(x.fasit||'ingen')+' | '+x.grunn));}}
