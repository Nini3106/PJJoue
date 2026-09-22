/* Tests du contrat de mise à jour, sans navigateur ni réseau réel. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const racine=path.resolve(__dirname,'../..');
const lire=nom=>fs.readFileSync(path.join(racine,nom),'utf8');

function creerNavigation({controleur={},sauvegardePossible=true,enLigne=true}={}){
 const fenetre={},documentEvents={},workerEvents={},intervalles=[];
 let recharges=0,sauvegardes=0,verifications=0,options;
 const inscription={update:async()=>{verifications++}};
 const serviceWorker={controller:controleur,addEventListener:(e,f)=>workerEvents[e]=f,
  register:async(_url,o)=>{options=o;return inscription}};
 const contexte={URL,console,navigator:{serviceWorker,onLine:enLigne},
  document:{documentElement:{style:{setProperty(){}}},currentScript:{src:'https://pjjoue.test/ressources/navigation-locale.js'},baseURI:'https://pjjoue.test/',visibilityState:'visible',addEventListener:(e,f)=>documentEvents[e]=f},
  window:{location:{protocol:'https:',reload:()=>recharges++},addEventListener:(e,f)=>fenetre[e]=f,
  setInterval:(f,ms)=>{intervalles.push({f,ms})},preparerMiseAJourPJJoue:()=>{sauvegardes++;return sauvegardePossible}}};
 vm.runInNewContext(lire('ressources/navigation-locale.js'),contexte);
 return {contexte,fenetre,documentEvents,workerEvents,intervalles,serviceWorker,
 bilan:()=>({recharges,sauvegardes,verifications,options})};
}

test('Nouvelle version : sauvegarde puis rechargement immédiat, une seule fois, sans confirmation',async()=>{
 const n=creerNavigation();await n.fenetre.load();
 n.serviceWorker.controller={version:'nouvelle'};n.workerEvents.controllerchange();n.workerEvents.controllerchange();
 assert.equal(n.bilan().sauvegardes,1);assert.equal(n.bilan().recharges,1);
 assert.equal(n.bilan().options.updateViaCache,'none');
});
test('Première installation : aucun rechargement inutile, les mises à jour suivantes sont automatiques',async()=>{
 const n=creerNavigation({controleur:null});await n.fenetre.load();n.serviceWorker.controller={};n.workerEvents.controllerchange();assert.equal(n.bilan().recharges,0);
 n.serviceWorker.controller={};n.workerEvents.controllerchange();assert.equal(n.bilan().recharges,1);
});
test('Vérifications au démarrage, retour dans l’onglet, reconnexion et toutes les minutes',async()=>{
 const n=creerNavigation();await n.fenetre.load();await Promise.resolve();
 assert.equal(n.bilan().verifications,1);assert.equal(n.intervalles[0].ms,60000);
 for(const verifier of [n.fenetre.focus,n.fenetre.online,n.fenetre.pageshow,n.documentEvents.visibilitychange,n.intervalles[0].f])await verifier();
 assert.equal(n.bilan().verifications,6);
 n.contexte.navigator.onLine=false;await n.intervalles[0].f();assert.equal(n.bilan().verifications,6);
});
test('Échec de sauvegarde : pas de perte de session ni boucle de rechargement',async()=>{
 const n=creerNavigation({sauvegardePossible:false});await n.fenetre.load();n.serviceWorker.controller={};n.workerEvents.controllerchange();assert.equal(n.bilan().recharges,0);
 n.contexte.window.preparerMiseAJourPJJoue=()=>true;await n.fenetre.focus();assert.equal(n.bilan().recharges,1);
});

function creerWorker({echecEssentiel=false}={}){
 const evenements={},cachesMemoire=new Map();let activations=0,reseau=0;
 const cle=q=>new URL(typeof q==='string'?q:q.url,'https://pjjoue.test/').href;
 const ouvrir=async nom=>{
  if(!cachesMemoire.has(nom))cachesMemoire.set(nom,new Map());const m=cachesMemoire.get(nom);
  return {match:async q=>m.get(cle(q)),put:async(q,r)=>m.set(cle(q),r),
   addAll:async qs=>{if(echecEssentiel)throw Error('réseau coupé');for(const q of qs)m.set(cle(q),new Response('nouveau'));},
   add:async q=>m.set(cle(q),new Response('secondaire'))};
 };
 class Requete extends Request{constructor(url,options){super(cle(url),options)}}
 const c={URL,Request:Requete,Response,console,
  self:{location:{origin:'https://pjjoue.test'},registration:{scope:'https://pjjoue.test/'},addEventListener:(e,f)=>evenements[e]=f,
   skipWaiting:async()=>activations++,clients:{claim:async()=>{}}},
  caches:{open:ouvrir,keys:async()=>[...cachesMemoire.keys()],delete:async nom=>cachesMemoire.delete(nom),match:async q=>{for(const m of cachesMemoire.values()){const v=m.get(cle(q));if(v)return v;}}},
  fetch:async()=>{reseau++;return new Response('serveur')}};
 vm.runInNewContext(lire('service-worker.js'),c);
 const emettre=async(e,options={})=>{let attente;evenements[e]({...options,waitUntil:p=>attente=p,respondWith:p=>attente=p});return await attente};
 return {emettre,cachesMemoire,c,bilan:()=>({activations,reseau})};
}

test('Une installation incomplète ne remplace jamais la version utilisable',async()=>{
 const w=creerWorker({echecEssentiel:true});await assert.rejects(w.emettre('install'));assert.equal(w.bilan().activations,0);
});
test('Une ancienne ressource ne satisfait jamais la demande d’une version différente',async()=>{
 const w=creerWorker();w.cachesMemoire.set('pjjoue-application-ancienne',new Map([['https://pjjoue.test/ressources/moteur-jeu.js?v=ancienne',new Response('ancien')]]));
 const reponse=await w.emettre('fetch',{request:{method:'GET',url:'https://pjjoue.test/ressources/moteur-jeu.js?v=nouvelle',mode:'cors'}});
 assert.equal(await reponse.text(),'serveur');assert.equal(w.bilan().reseau,1);
});
test('Construction : toutes les ressources CSS/JS locales des pages portent la même version que le cache',()=>{
 const worker=lire('service-worker.js'),version=worker.match(/pjjoue-application-([a-f0-9]{12})/)[1];
 for(const nom of ['index.html','guides/index.html','cjpm-enquete-sanction/index.html']){
  for(const [,adresse]of lire(nom).matchAll(/(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/g)){
   if(/^https?:|^\/\//.test(adresse))continue;
   assert.equal(adresse.split('?v=')[1],version,`${nom} : ${adresse}`);
  }
 }
 const urls=[...worker.matchAll(/['"](\.\/[^'"]+\.(?:js|css)\?[^'"]+)['"]/g)].map(m=>m[1]);
 assert.equal(new Set(urls).size,urls.length);
 assert.ok(urls.every(url=>url.endsWith(`?v=${version}`)));
});
