const {test}=require('node:test');
const assert=require('node:assert/strict');
const {creerMoteur}=require('./moteur-simule.cjs');
const normaliser=x=>JSON.parse(JSON.stringify(x));

test('66 étapes : les 660 réponses autonomes survivent au nettoyage et célèbrent une seule fois',()=>{
 const {run}=creerMoteur();
 const echecs=run(`(()=>{const echecs=[];for(const t of THEMES)for(const e of PROGRAMMES[t.id].etapes){
  const qs=obtenirQuestionsEtape(t.id,e.id);init('parcours',qs);etat.theme=t.id;etat.etape=e.id;
  for(const q of qs){etat.questionCourante=q;etat.questionValidee=false;finaliserReponse(true,q.bonneReponse);}
  const fin=mettreAJourProgressionFinSession(100,0,false);
  sauvegarde=nettoyerSauvegarde(JSON.parse(JSON.stringify(sauvegarde)));
  if(etat.score!==qs.length||!estEtapeMaitrisee(t.id,e.id)||!fin.celebration||mettreAJourProgressionFinSession(100,0,false).celebration)echecs.push([t.id,e.id]);
 }return echecs;})()`);
 assert.deepEqual(normaliser(echecs),[]);
});

test('Une reprise autonome valide le score, reste à consolider et disparaît après une nouvelle session réussie',()=>{
 const {run}=creerMoteur();
 assert.deepEqual(normaliser(run(`(()=>{const qs=init();finaliserReponse(false,'erreur');rejouerQuestionCourante();finaliserReponse(true,qs[0].bonneReponse);
 const avant=[etat.score,etat.nombreReponsesAidees,etat.erreursSession.size,sauvegarde.erreurs[qs[0].id].motifRevision,compterReussitesAutonomesEtape(qs[0].theme,qs[0].etape)];
 etat.mode='revision';lancerSession([qs[0]]);finaliserReponse(true,qs[0].bonneReponse);return {avant,revisee:sauvegarde.erreurs[qs[0].id].maitrisee};})()`)),{avant:[1,0,0,'reprise',1],revisee:true});
});

test('Une question passée puis révisée valide son étape depuis toute entrée de révision',()=>{
 const {run}=creerMoteur();
 for(const perimetre of ['toutes','procedure_ordinaire','procedure_ordinaire:etape:1']){
  const r=run(`(()=>{const qs=init();for(const q of qs.slice(0,-1)){etat.questionCourante=q;etat.questionValidee=false;finaliserReponse(true,q.bonneReponse);}
   const q=qs.at(-1);etat.questionCourante=q;etat.questionValidee=false;passerQuestion();
   etat.mode='revision';etat.perimetreRevision=${JSON.stringify(perimetre)};lancerSession([q]);finaliserReponse(true,q.bonneReponse);
   return [compterReussitesAutonomesEtape(q.theme,q.etape),sauvegarde.erreurs[q.id].maitrisee,!!mettreAJourProgressionFinSession(100,0,false).celebration];})()`);
  assert.deepEqual(normaliser(r),[10,true,true],perimetre);
 }
});

test('Les montants et négations sont exacts, les variantes déclarées restent acceptées',()=>{
 const {run}=creerMoteur();
 const cas=[[1652,'8 500 euros',false],[1652,'500 euros',false],[1652,'7500 euros',true],[1652,'7 500 euros',true],[1652,'7 500 ou 8 500 euros',false],
 [1464,'Avec délai',false],[1464,'Dans un délai',false],[1464,'délai',false],[1464,'Sans délai',true],[1464,'sans delai',true],[1280,'2 ans',false]];
 for(const [id,reponse,attendu]of cas)assert.equal(run(`validerReponseEcriteSouple(${JSON.stringify(reponse)},QUESTIONS.find(q=>q.id===${id}))`),attendu,`${id}: ${reponse}`);
 const refuses=run(`QUESTIONS.filter(q=>q.modePrefere==='reponse-ecrite').flatMap(q=>[q.bonneReponse,...(q.reponsesAcceptees||[])].filter(v=>!validerReponseEcriteSouple(v,q)).map(v=>[q.id,v]))`);
 assert.deepEqual(normaliser(refuses),[]);
});

test('Aucune collision dans 1000 évaluations de 30 questions par mission, y compris les associations',()=>{
 const {run}=creerMoteur();
 const erreurs=run(`(()=>{let graine=42;Math.random=()=>((graine=(Math.imul(1664525,graine)+1013904223)>>>0)/4294967296);
 const erreurs=[];for(let i=0;i<1000;i++)for(const jeu of ['sigles','mesures']){
 const qs=jeu==='sigles'?creerQuestionsEvaluationSigles().map((q,i)=>convertirQuestionMissionSiglesVersPJJoue(q,i,{mode:'evaluation'})):
 creerQuestionsEvaluationMesures().map((q,i)=>convertirQuestionMissionMesuresVersPJJoue(q,i,{mode:'evaluation'}));
 if(qs.length!==30||new Set(qs.map(q=>q.id)).size!==30)erreurs.push([jeu,i]);
 }return erreurs;})()`);
 assert.deepEqual(normaliser(erreurs),[]);
});

test('Les trois évaluations refusent passage, joker et reprise sans altérer le score',()=>{
 const {run}=creerMoteur();
 for(const mode of ['evaluation-finale','sigles-evaluation','mesures-evaluation']){
  assert.deepEqual(normaliser(run(`(()=>{init(${JSON.stringify(mode)});etat.jokersSessionActifs=false;
   const index=etat.indexQuestion;passerQuestion();const passees=etat.questionsPassees.size;
   finaliserReponse(false,'erreur');rejouerQuestionCourante();finaliserReponse(true,'réponse');
   return [index===etat.indexQuestion,passees,etat.score,etat.tentativesQuestions.size];})()`)),[true,0,0,0],mode);
 }
});

for(const jeu of ['sigles','mesures'])test(`Mission ${jeu} : reprise après mise à jour dans un moteur neuf, avec brouillon et minuterie`,()=>{
 const m=creerMoteur();
 m.run(`init();${jeu==='sigles'?`const cs=obtenirSiglesEtape(6).slice(0,2);preparerSessionMissionSiglesNative({mode:'parcours',etape:6,sigles:cs,questions:creerQuestionsRevisionSigles(cs),titre:'Test'});`:
 `const cs=obtenirReperesMesuresEtape(1).slice(0,2);preparerSessionMissionMesuresNative({mode:'parcours',etape:1,reperes:cs,questions:creerQuestionsRevisionMesures(cs),titre:'Test'});`}
 finaliserReponse(true,etat.questionCourante.bonneReponse);afficherQuestionSuivante();
 etat.tempsRestant=13;etat.chronometreSessionActif=true;etat.brouillonActivite={identifiantQuestion:etat.questionCourante.id,elementsSelectionnes:['a']};
 selectionner('#reponseEcrite').value='réponse en cours';preparerMiseAJourAutomatique();`);
 const nouveau=creerMoteur({storage:m.storage,onglet:m.onglet});
 assert.equal(nouveau.run('restaurerSessionEnCours()'),true);
 assert.deepEqual(normaliser(nouveau.run(`({mode:etat.mode,index:etat.indexQuestion,score:etat.score,temps:etat.tempsRestant,brouillon:etat.brouillonsEcrits.get(etat.questionCourante.id),selection:etat.brouillonActivite.elementsSelectionnes})`)),
 {mode:`${jeu}-parcours`,index:1,score:1,temps:13,brouillon:'réponse en cours',selection:['a']});
});

test('Deux onglets retrouvent chacun leur question après une mise à jour',()=>{
 const storage=new Map();const a=creerMoteur({storage}),b=creerMoteur({storage});
 a.run("init();etat.indexQuestion=2;afficherQuestion();preparerMiseAJourAutomatique()");
 b.run("init();etat.indexQuestion=5;afficherQuestion();preparerMiseAJourAutomatique()");
 for(const [m,index]of [[a,2],[b,5]]){
  const n=creerMoteur({storage,onglet:m.onglet});assert.equal(n.run('restaurerSessionEnCours()'),true);assert.equal(n.run('etat.indexQuestion'),index);
 }
});

test('Import valide : remplacement récupérable, session obsolète effacée ; panne et JSON étrangers refusés',()=>{
 const m=creerMoteur();m.run('chargerParametres=()=>{};actualiserAccueil=()=>{};actualiserRestaurationAvantImport=()=>{};init();sauvegarde.xp=400;enregistrerSauvegarde();');
 for(const valeur of [{},{version:'V1'},[],{version:'V2',progression:{apprenant:{}},erreurs:{}}])assert.throws(()=>m.run(`validerFichierProgression(${JSON.stringify(valeur)})`));
 assert.equal(m.run('sauvegarde.xp'),400);
 m.run('appliquerProgressionImportee(validerFichierProgression(creerSauvegardeInitiale()))');
 assert.equal(m.run('sauvegarde.xp'),0);assert.equal(m.run('chargerSessionEnCours()'),null);
 m.run('annulerDernierImport()');assert.equal(m.run('sauvegarde.xp'),400);
 m.c.localStorage.setItem=()=>{throw Error('quota')};
 assert.throws(()=>m.run('appliquerProgressionImportee(creerSauvegardeInitiale())'));
 assert.equal(m.run('sauvegarde.xp'),400);
});

test('Une session ancienne V1 du parcours reste reprenable',()=>{
 const m=creerMoteur();m.run("init();enregistrerSessionEnCours();const ancien=chargerSessionEnCours();ancien.version=1;sessionStorage.removeItem(CLE_SESSION_EN_COURS);localStorage.setItem(CLE_SESSION_EN_COURS,JSON.stringify(ancien));");
 const n=creerMoteur({storage:m.storage});assert.equal(n.run('restaurerSessionEnCours()'),true);
});

test('Le pourcentage du parcours inclut son évaluation partout',()=>{
 const {run}=creerMoteur();assert.deepEqual(normaliser(run(`(()=>{init();for(const e of PROGRAMMES.procedure_ordinaire.etapes){const b=obtenirBilanEtape('procedure_ordinaire',e.id);for(const q of obtenirQuestionsEtape('procedure_ordinaire',e.id)){b.questionsTraitees[q.id]=true;b.resultats[q.id]=true;}b.termineeSansJoker=true;}return [calculerProgressionParcours('procedure_ordinaire').pourcentage,obtenirAvanceeJalonsProgression('procedure_ordinaire').pourcentage];})()`)),[92,92]);
});

test('Les filtres et le lancement de révision sélectionnent exactement les mêmes questions',()=>{
 const {run}=creerMoteur();assert.deepEqual(normaliser(run(`(()=>{init();for(const n of [1,2])for(const q of obtenirQuestionsEtape('procedure_ordinaire',n).slice(0,2))sauvegarde.erreurs[q.id]={maitrisee:false,motifRevision:'passage'};
 etat.filtresRevision={parcours:{theme:'procedure_ordinaire',etape:'2'}};
 const prevus=filtrerElementsRevision('parcours',obtenirElementsCategoriesRevision('parcours')).map(e=>e.cible.id).sort();
 lancerRevisionCategorie('parcours','passage');return [prevus,etat.questionsSession.map(q=>q.id).sort()];})()`)),[[1011,1012],[1011,1012]]);
});
