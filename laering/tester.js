// Regresjonstester for datotolkningen i index.html.
// Laster blokken mellom [[LAER-START]] og [[LAER-END]] (regex-konstanter, tidshjelpere, normaliserDato)
// pluss datohjelperne (pad, p, sameDay, startOfDay, startOfWeek, toLocal) – ingen DOM.
// Kjør:  node laering/tester.js      Alle linjer skal bli OK.
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function laerApi(){
  const block=html.slice(html.indexOf('// [[LAER-START]]'),html.indexOf('// [[LAER-END]]'));
  const helpers=['const pad=','const p=s=>','const dKey=','const sameDay=','const startOfDay=','const startOfWeek=','const toLocal=','const MO=']
    .map(pre=>{const i=html.indexOf('\n  '+pre);if(i<0)throw new Error('fant ikke '+pre);return html.slice(i+1,html.indexOf('\n',i+1));}).join('\n');
  return new Function(helpers+'\n'+block+'\nreturn {timeFromText,timeWordFromText,daysAheadFromText,normaliserDato,WDRE,WNUM,MONTH_RE,TOMORROW_RE,TODAY_RE};')();
}
const api=laerApi();
module.exports={laerApi};
if(require.main!==module)return;

let fail=0;const ok=(name,got,want)=>{const g=JSON.stringify(got),w=JSON.stringify(want);console.log((g===w?'OK  ':'FEIL')+' '+name+(g===w?'':'  fikk '+g+' ville ha '+w));if(g!==w)fail++;};
const T=(k,hh,mm)=>{const r=api.timeFromText(k);ok('tid: '+JSON.stringify(k),r?[r.hh,r.mm]:null,hh==null?null:[hh,mm]);};
// --- klokkeslett (fra ekte notater) ---
T('Ringe imorgen 1430',14,30);T('ringe mandag kl 1700',17,0);T('ring imorgen 2100',21,0);T('Ringe 1300, intressert',13,0);T('Ringe i morgen 1200',12,0);
T('KI 19',19,0);T('kl 8',20,0);T('kl 09',9,0);T('kl19',19,0);T('16.20',16,20);T('Komme tilbake 17.00 Imorgen',17,0);
T('Ring 21 om ikke svart',21,0);T('Ringe 9, Anders',21,0);T('ring 13',13,0);T('Ringe 1830, Talkmore',18,30);
T('Telenor 1000 og T-We',null);T('100 linje på ene 500 på andre',null);T('sendt 1197',null);T('Sendt 1497, bør svare ja',null);T('fiber 500',null);
T('Ringe mannen',null);T('Send melding 25. mars 2026',null);T('Ring februar 2027',null);T('binding til 31.12.2027',null);T('Cancelled 2026-08-22. Within',null);T('Følge opp tirsdag, etter 2030',20,30);T('Kontakt i 17/18 tiden tirsdag',17,0);T('i 19-tiden',19,0);T('onsdag på ettermiddag. Rundt 13-15',13,0);T('I morgen etter 18',18,0);T('etter 3 dager',null);T('ring om 2 dager',null);T('Talkmore 2 ubegrensa voksen + 1 14 år 5gig',null);
// --- tidsord ---
ok('kveld',api.timeWordFromText('Ring Imrg kveld').hh,21);ok('etter jobb',api.timeWordFromText('kom etter jobb').hh,17);ok('ingen tidsord',api.timeWordFromText('ringe mannen'),null);
// --- om N dager/uker ---
ok('om en uke',api.daysAheadFromText('Ringe om en uke'),7);ok('om to dager',api.daysAheadFromText('Ringe om to dager. Må nok ringe kona'),2);ok('om 2 uker',api.daysAheadFromText('om 2 uker'),14);ok('ingen',api.daysAheadFromText('ring mannen'),null);
// --- i morgen / ukedag / måned ---
['Ring Imrg','ring i mrg','imorra kl 18','Ringe imorgen 1430','skulle svare i løpet av dagen i morgen'].forEach(k=>ok('imorgen: '+k,api.TOMORROW_RE.test(k),true));
['ringe mannen','i morges var han hjemme'].forEach(k=>ok('ikke imorgen: '+k,api.TOMORROW_RE.test(k),false));
const W=(k,d)=>{const m=api.WDRE.exec(' '+k.toLowerCase());ok('ukedag: '+k,m?api.WNUM[m[2]]:null,d);};
W('snakk fre',5);W('kom tilbake tirs',2);W('ring onsdag',3);W('neste tors',4);W('mannen jobber',null);W('Ringe søndag 20ende sep',0);
const M=(k,want)=>{const m=api.MONTH_RE.exec(k);ok('måned: '+k,m?m[2].toLowerCase():null,want);};
M('Ringe februar. Binding til mai','februar');M('før jul',null);M('ring i feb','feb');M('marked',null);M('Ringe i mars, vil over','mars');

// --- hele etterbehandlingen (normaliserDato): AI-svar + notat + «nå» → endelig dato ---
const N=(name,ai,kommentar,naa,want,lh)=>{const o=Object.assign({kommentar},ai);api.normaliserDato(o,{now:new Date(naa),learnedHour:lh==null?null:lh});ok('pipeline: '+name,o.dato,want);};
N('AI tom + imrg',{dato:null},'Ring Imrg','2026-10-12T17:34','2026-10-13T12:00');
N('AI tom + imrg kveld',{dato:null},'Ring Imrg kveld','2026-10-12T15:39','2026-10-13T21:00');
N('AI tom + KI 19 passert',{dato:null},'KI 19','2026-10-14T21:03','2026-10-15T19:00');
N('AI tom + ring 21',{dato:null},'Ring 21 om ikke svart','2026-10-09T14:37','2026-10-09T21:00');
N('AI tom + om en uke',{dato:null},'Ringe om en uke','2026-09-15T17:44','2026-09-22T12:00');
N('AI tom + februar i oktober',{dato:null},'Ringe februar. Binding til mai','2026-10-09T16:20','2027-02-01T12:00');
N('AI tom + ukedag',{dato:null},'Måtte se over. Ringe onsdag','2026-09-14T18:05','2026-09-16T12:00');
N('AI feil år 2020 relativt',{dato:'2020-09-17T12:00',eksaktDato:false},'Ringe i morgen','2026-09-16T16:02','2026-09-17T12:00');
N('AI feil år 2025 relativt',{dato:'2025-09-22T12:00',eksaktDato:false},'Ringe neste uke','2026-09-17T14:35','2026-09-22T12:00');
N('AI 2020 med klokkeslett beholdes',{dato:'2020-10-12T17:00',eksaktDato:false},'ringe mandag kl 1700','2026-10-09T18:05','2026-10-12T17:00');
N('måned passert → neste år',{dato:'2026-03-01T12:00',eksaktDato:false},'Ringe i mars, vil over til oss','2026-09-17T14:08','2027-03-01T12:00');
N('eksplisitt dato uten år >60 d bakover → neste år',{dato:'2026-03-25T12:00',eksaktDato:true},'Send melding 25. mars','2026-10-12T14:28','2027-03-25T12:00');
N('eksplisitt dato med årstall beholdes',{dato:'2026-03-25T12:00',eksaktDato:true},'Send melding 25. mars 2026','2026-10-12T14:28','2026-03-25T12:00');
N('eksplisitt dato nylig passert beholdes (forfalt)',{dato:'2026-10-10T12:00',eksaktDato:true},'Ring 10. oktober','2026-10-12T14:28','2026-10-10T12:00');
N('samme ukedag → +7',{dato:'2026-09-14T12:00',eksaktDato:false},'Ringe mandag','2026-09-14T13:39','2026-09-21T12:00');
N('samme ukedag + tid ikke passert → i dag',{dato:'2026-10-13T17:00',eksaktDato:false},'Kontakt i 17/18 tiden tirsdag','2026-10-13T12:12','2026-10-13T17:00');
N('AI 12:00 men notat har 1700',{dato:'2026-10-12T12:00',eksaktDato:false},'ringe mandag kl 1700','2026-10-09T18:05','2026-10-12T17:00');
N('AI 12:00 + lært time 15',{dato:'2026-10-06T12:00',eksaktDato:false},'Ring imorgen om ikke svart','2026-10-05T16:28','2026-10-06T15:00',15);
N('AI 12:00 + lært time, men langt frem → urørt',{dato:'2027-02-01T12:00',eksaktDato:false},'Ringe i februar','2026-10-06T15:46','2027-02-01T12:00',15);
N('AI 12:00 uten lært time → urørt',{dato:'2026-10-06T12:00',eksaktDato:false},'Ring imorgen','2026-10-05T16:28','2026-10-06T12:00');
N('AI klokkeslett i dag passert → i morgen',{dato:'2026-10-14T16:20',eksaktDato:false},'Kom innom 16.20','2026-10-14T20:48','2026-10-15T16:20');
N('«ringe 21» som AI gjorde til 21. i maaneden → kl 21 i dag',{dato:'2026-09-21T12:00',eksaktDato:true},'Måtte sjekke når han var ferdig i binding ringe 21','2026-09-15T14:38','2026-09-15T21:00');
N('«ring 21. september» forblir dato',{dato:'2026-09-21T12:00',eksaktDato:true},'ring 21. september','2026-09-15T14:38','2026-09-21T12:00');
N('«ring den 21» forblir dato',{dato:'2026-09-21T12:00',eksaktDato:true},'ring den 21','2026-09-15T14:38','2026-09-21T12:00');
N('fortids-ukedag gir ikke dato',{dato:null},'Ser på fotball og strømmetjenester Teneo var innom møtte kona torsdag','2026-09-10T12:51',null);
N('ila uka (mandag) → torsdag',{dato:null},'Ring ila uka. Fotball og flere strømmetjenester','2026-09-28T16:18','2026-10-01T12:00');
N('ila uka (torsdag) → fredag',{dato:null},'Ring ila uka','2026-10-01T10:00','2026-10-02T12:00');
N('ila uka (fredag) → mandag',{dato:null},'Ring i løpet av uka','2026-10-02T10:00','2026-10-05T12:00');
N('senere i uka (tirsdag) → torsdag',{dato:null},'Komme tilbake senere i uka','2026-10-13T16:08','2026-10-15T12:00');
N('hastighet er ikke tid',{dato:null},'Telenor 1000 og T-We. Nettet hakker','2026-09-12T15:38',null);
N('rent info-notat → ingen dato',{dato:null},'Kun 75 binding','2026-10-14T21:09',null);
console.log(fail?('\n'+fail+' FEIL'):'\nAlle tester OK');process.exit(fail?1:0);
