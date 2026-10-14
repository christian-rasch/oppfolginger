// Regresjonstester for tidstolkningen i index.html (blokken mellom [[LAER-START]] og [[LAER-END]] + regex-konstantene).
// Kjør:  node laering/tester.js      (fra prosjektmappa). Alle linjer skal bli OK.
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const block=html.slice(html.indexOf('// [[LAER-START]]'),html.indexOf('// [[LAER-END]]'));
const consts=['WNUM3','WNUM','WDRE','MONTH_RE','MONTH_NUM','TOMORROW_RE','TODAY_RE'].map(n=>{
  const m=new RegExp('^\\s*const '+n+'=.*$','m').exec(html);if(!m)throw new Error('fant ikke '+n);return m[0];}).join('\n');
const api=new Function(consts+'\n'+block+'\nreturn {timeFromText,timeWordFromText,daysAheadFromText,WDRE,WNUM,MONTH_RE,TOMORROW_RE,TODAY_RE};')();

let fail=0;const ok=(name,got,want)=>{const g=JSON.stringify(got),w=JSON.stringify(want);console.log((g===w?'OK  ':'FEIL')+' '+name+(g===w?'':'  fikk '+g+' ville ha '+w));if(g!==w)fail++;};
const T=(k,hh,mm)=>{const r=api.timeFromText(k);ok('tid: '+JSON.stringify(k),r?[r.hh,r.mm]:null,hh==null?null:[hh,mm]);};
// --- klokkeslett (fra ekte notater, oktober 2026) ---
T('Ringe imorgen 1430',14,30);T('ringe mandag kl 1700',17,0);T('ring imorgen 2100',21,0);T('Ringe 1300, intressert',13,0);T('Ringe i morgen 1200',12,0);
T('KI 19',19,0);T('kl 8',20,0);T('kl 09',9,0);T('kl19',19,0);T('16.20',16,20);T('Komme tilbake 17.00 Imorgen',17,0);
T('Ring 21 om ikke svart',21,0);T('Ringe 9, Anders',21,0);T('ring 13',13,0);
T('Telenor 1000 og T-We',null);T('100 linje på ene 500 på andre',null);T('sendt 1197',null);T('Sendt 1497, bør svare ja',null);T('fiber 500',null);
T('Ringe mannen',null);T('ring om 2 dager',null);T('Talkmore 2 ubegrensa voksen + 1 14 år 5gig',null);
// --- tidsord ---
ok('kveld',api.timeWordFromText('Ring Imrg kveld').hh,21);ok('etter jobb',api.timeWordFromText('kom etter jobb').hh,17);ok('ingen tidsord',api.timeWordFromText('ringe mannen'),null);
// --- om N dager/uker ---
ok('om en uke',api.daysAheadFromText('Ringe om en uke'),7);ok('om to dager',api.daysAheadFromText('Ringe om to dager. Må nok ringe kona'),2);ok('om 2 uker',api.daysAheadFromText('om 2 uker'),14);ok('ingen',api.daysAheadFromText('ring mannen'),null);
// --- i morgen / i dag / ukedag / måned ---
['Ring Imrg','ring i mrg','imorra kl 18','Ringe imorgen 1430','skulle svare i løpet av dagen i morgen'].forEach(k=>ok('imorgen: '+k,api.TOMORROW_RE.test(k),true));
['ringe mannen','i morges var han hjemme'].forEach(k=>ok('ikke imorgen: '+k,api.TOMORROW_RE.test(k),false));
const W=(k,d)=>{const m=api.WDRE.exec(' '+k.toLowerCase());ok('ukedag: '+k,m?api.WNUM[m[2]]:null,d);};
W('snakk fre',5);W('kom tilbake tirs',2);W('ring onsdag',3);W('neste tors',4);W('mannen jobber',null);W('Ringe søndag 20ende sep',0);
const M=(k,want)=>{const m=api.MONTH_RE.exec(k);ok('måned: '+k,m?m[2].toLowerCase():null,want);};
M('Ringe februar. Binding til mai','februar');M('før jul',null);M('ring i feb','feb');M('marked',null);M('Ringe i mars, vil over','mars');
console.log(fail?('\n'+fail+' FEIL'):'\nAlle tester OK');process.exit(fail?1:0);
