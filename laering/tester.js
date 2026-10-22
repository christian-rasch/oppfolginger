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
  return new Function(helpers+'\n'+block+'\nreturn {timeFromText,timeWordFromText,daysAheadFromText,nextWeekWeekday,normaliserDato,sisteJsonObjekt,WDRE,WNUM,MONTH_RE,TOMORROW_RE,TODAY_RE};')();
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
// --- 17.10.2026: semikolon = kolon; dd.mm (punktum + maaned) er dato, ikke klokkeslett ---
T('[tlf] Ice Snakka med Anders (komme tilbake 19;00',19,0);T('M1 06.10 M1 08. Hilde 5 abbonomenter fra ice. Kontakt tirsdag neste uke',null);T('Binding frem til 05.12.2026 Kontaktes mandag',null);T('Kom tilbake lørdag 11.07.26 klokka 11:30.',11,30);T('19:00 08.09',19,0);T('Ring Onsdag 16 september kl 13.00',13,0);T('kl 10.10',10,10);
// --- «<ukedag> neste uke» = ukedagen i NESTE kalenderuke ---
const NW=(k,naa,want)=>{const d=api.nextWeekWeekday(k,new Date(naa));ok('neste uke: '+k+' @'+naa.slice(0,10),d?d.toISOString().slice(0,10):null,want);};
NW('Ring tirsdag neste uke','2026-10-15T14:14','2026-10-20');NW('Ringe fredag neste uke. Er på sjøen','2026-09-14T16:21','2026-09-25');NW('Ringe tirsdag neste uke','2026-10-12T10:00','2026-10-20');NW('ring mandag til uka','2026-10-18T12:00','2026-10-19');NW('neste uke onsdag','2026-10-13T10:00','2026-10-21');
NW('neste fredag','2026-08-26T16:18',null);NW('Ringe neste uke','2026-09-17T14:35',null);NW('ring tirsdag. neste uke er han borte','2026-10-15T14:14',null);
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
// --- 22.10.2026 (Christian): «i morgen» rett etter midnatt (foer kl 05) = dagen som nettopp har begynt ---
N('imorgen kl 00:12 → dagen som kommer (Fredrik)',{dato:'2026-09-16T18:00',eksaktDato:false},'I morgen etter 18','2026-09-15T00:12','2026-09-15T18:00');
N('imorgen 15 kl 00:35 → samme dag kl 15',{dato:'2026-10-21T15:00',eksaktDato:false},'Skal svare ja ring opp imorgen 15','2026-10-20T00:35','2026-10-20T15:00');
N('imorgen paa dagtid → uroert',{dato:'2026-10-21T15:00',eksaktDato:false},'Skal svare ja ring opp imorgen 15','2026-10-20T16:35','2026-10-21T15:00');
N('imorgen kl 05:10 → kalenderdagen etter',{dato:'2026-10-21T15:00',eksaktDato:false},'ring opp imorgen 15','2026-10-20T05:10','2026-10-21T15:00');
N('AI tom + imrg kl 00:40 → i dag 12:00',{dato:null},'Ring Imrg','2026-10-20T00:40','2026-10-20T12:00');
N('AI tom + imrg kveld kl 00:40 → i dag 21:00',{dato:null},'Ring Imrg kveld','2026-10-20T00:40','2026-10-20T21:00');
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
N('samme ukedag + tid ikke passert → likevel +7 (Christian 23.10)',{dato:'2026-10-13T17:00',eksaktDato:false},'Kontakt i 17/18 tiden tirsdag','2026-10-13T12:12','2026-10-20T17:00');
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
// 17.10.2026 (ekte kort): «<ukedag> neste uke» og dd.mm-datoer
N('ukedag neste uke (torsdag), AI tok +7',{dato:'2026-10-27T12:00',eksaktDato:false},'[tlf] Ring tirsdag neste uke','2026-10-15T14:14','2026-10-20T12:00');
N('ukedag neste uke (torsdag), AI riktig → urørt',{dato:'2026-10-13T12:00',eksaktDato:false},'Kontakt tirsdag neste uke','2026-10-08T18:15','2026-10-13T12:00');
N('ukedag neste uke (mandag) = neste kalenderuke',{dato:'2026-09-25T12:00',eksaktDato:false},'Ringe fredag neste uke. Er på sjøen','2026-09-14T16:21','2026-09-25T12:00');
N('ukedag neste uke, AI tom (mandag) → ikke i morgen',{dato:null},'Ringe tirsdag neste uke','2026-10-12T10:00','2026-10-20T12:00');
N('ukedag neste uke med klokkeslett beholdes',{dato:'2026-10-21T16:00',eksaktDato:false},'Må tenke følges opp onsdag neste uke etter 16:00','2026-10-14T12:19','2026-10-21T16:00');
N('ukedag neste uke, AI tok +7 med tid → dag rettes, tid beholdes',{dato:'2026-10-28T16:00',eksaktDato:false},'følges opp onsdag neste uke etter 16:00','2026-10-14T12:19','2026-10-21T16:00');
N('neste fredag (onsdag) = uka etter, uendret',{dato:null},'Spørre dama om hun fikk snakka med mannen om tilbudet neste fredag','2026-08-26T16:18','2026-09-04T12:00');
N('dd.mm i notatet er dato, ikke 06:10',{dato:'2026-10-13T12:00',eksaktDato:false},'M1 06.10 M1 08.[tlf]Hilde 5 abbonomenter fra ice. Kontakt tirsdag neste uke','2026-10-08T18:15','2026-10-13T12:00');
N('semikolon-klokkeslett, AI tom → i dag 19:00',{dato:null},'[tlf] Ice Snakka med Anders (komme tilbake 19;00','2026-10-15T14:56','2026-10-15T19:00');
// --- 17.10.2026 (Christian): «Ring oå» = «Ring opp» uten dag/tid = ring tilbake, ingen dato ---
N('Ring oå (=opp) uten dag → ingen dato',{dato:null},'Ring oå','2026-10-15T14:10',null);N('Ring opp uten dag → ingen dato',{dato:null},'Ring opp','2026-10-15T14:10',null);N('Ring opp lørdag → lørdag',{dato:null},'Sendt 1497. Ring opp lørdag.','2026-10-15T14:49','2026-10-17T12:00');
// --- 21.10.2026 (ekte kort): dagens ukedag + klokkeslett som ikke er passert, men AI satte +7 → i dag ---
N('samme ukedag + tid ikke passert, AI tok +7 → beholdes (Jacob; Christian 23.10)',{dato:'2026-10-20T17:00',eksaktDato:false},'Kontakt i 17/18 tiden tirsdag','2026-10-13T14:12','2026-10-20T17:00');
N('samme ukedag + kl 17 rett etter midnatt, AI tok +7 → beholdes',{dato:'2026-10-27T17:00',eksaktDato:false},'Hjemme tirsdag kl 17','2026-10-20T00:58','2026-10-27T17:00');
N('samme ukedag + tid PASSERT, AI tok +7 → urørt',{dato:'2026-10-27T17:00',eksaktDato:false},'Hjemme tirsdag kl 17','2026-10-20T18:00','2026-10-27T17:00');
N('samme ukedag uten klokkeslett, AI tok +7 → urørt',{dato:'2026-10-27T12:00',eksaktDato:false},'Ring opp tirsdag','2026-10-20T10:00','2026-10-27T12:00');
N('«tirsdag neste uke kl 17» skrevet tirsdag → neste uke, ikke i dag',{dato:'2026-10-27T17:00',eksaktDato:false},'Ring tirsdag neste uke kl 17','2026-10-20T10:00','2026-10-27T17:00');
N('«neste tirsdag kl 17» skrevet tirsdag → urørt',{dato:'2026-10-27T17:00',eksaktDato:false},'Ring neste tirsdag kl 17','2026-10-20T10:00','2026-10-27T17:00');
N('fortids-ukedag + klokkeslett → urørt',{dato:'2026-10-27T17:00',eksaktDato:false},'Snakket med kona tirsdag, ring kl 17','2026-10-20T10:00','2026-10-27T17:00');
N('AI satte i dag + tid ikke passert → +7 (Christian 23.10: ukedag = aldri i dag)',{dato:'2026-10-20T17:00',eksaktDato:false},'Hjemme tirsdag kl 17','2026-10-20T00:58','2026-10-27T17:00');
// --- 21.10.2026 (ekte kort): bindings-maaned er ikke oppfoelging naar AI ga null ---
N('«Binding 20. februar … sende tilbud», AI null → ingen dato (ikke 1. feb)',{dato:null},'Binding 20. februar, kun internett i dag, sende tilbud. Mobil happybytes 10mbit ubegrenset','2026-10-20T00:54',null);
N('«Ute av binding februar, ringe desember», AI null → desember',{dato:null},'Ute av binding februar, ringe desember når hun holder på å gå ut av binding. Riks og nexgt','2026-09-29T17:47','2026-12-01T12:00');
N('«Ringe i februar binding til mars», AI null → februar',{dato:null},'Ringe [tlf] Ringe i februar binding til mars. Banhof 500.','2026-10-06T17:46','2027-02-01T12:00');
N('«Ferdig i binding i juli» alene, AI null → ingen dato',{dato:null},'Har veldig mye streaming. Ferdig i binding i juli.','2026-09-26T22:53',null);
N('«Binding går ut april», AI null → ingen dato',{dato:null},'Måtte tenke. Binding går ut april','2026-09-17T16:08',null);
N('«Ringe februar … Binding til mai», AI null → februar (som før)',{dato:null},'Ringe februar. Eier begge husene her 100 linje på ene 500 på andre nexgt. Binding til mai ca.','2026-10-09T18:20','2027-02-01T12:00');
// --- 21.10.2026: modellen skrev to JSON-objekter («Korrigering: …») på «Komme tilbke» i 3 av 5 kjøringer → bruk det siste ---
const J=(name,t,want)=>ok('json: '+name,api.sisteJsonObjekt(t),want);
J('to objekter → det siste',' {"dato":"2026-10-19T21:05","datoGrunn":"a"}\n\nKorrigering: Naa er 19:05 {ikke json}.\n\n{"dato":"2026-10-19T21:15","datoGrunn":"b"}',{dato:'2026-10-19T21:15',datoGrunn:'b'});
J('ett objekt',' {"a":1,"b":{"c":"}"}}',{a:1,b:{c:'}'}});
J('avkuttet svar → null','{"a":1,"b":',null);
J('streng med escapet anførselstegn','{"k":"si \\"hei\\" {"}',{k:'si "hei" {'});
J('ingen json','bare tekst',null);
console.log(fail?('\n'+fail+' FEIL'):'\nAlle tester OK');process.exit(fail?1:0);
