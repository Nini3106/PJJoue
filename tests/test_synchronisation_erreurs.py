"""Régressions des erreurs actives, acquis et sauvegardes dans les trois jeux."""
import unittest
from playwright.sync_api import sync_playwright
from verifier_interface import construire_page_jeu, lancer_chromium


class SynchronisationErreursTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.navigateur = lancer_chromium(cls.playwright)
        cls.html = construire_page_jeu()

    @classmethod
    def tearDownClass(cls):
        cls.navigateur.close()
        cls.playwright.stop()

    def setUp(self):
        self.contexte = self.navigateur.new_context()
        self.contexte.route('**/*', lambda route: route.fulfill(body=self.html, content_type='text/html')
                            if route.request.url == 'http://pjjoue.test/' else route.abort())
        self.page = self.contexte.new_page()
        self.page.goto('http://pjjoue.test/', wait_until='domcontentloaded')
        self.page.evaluate("""() => {
            sauvegarde=creerSauvegardeInitiale();
            sauvegarde.parametres.son=false;
            window.fixtureErreur=(jeu,mode,theme='commun',numero=6) => {
                sauvegarde=creerSauvegardeInitiale();
                sauvegarde.parametres.son=false;
                if(jeu==='parcours') {
                    const q=obtenirQuestionsEtape(theme,1)[0];
                    const bilan=obtenirBilanEtape(theme,1);
                    bilan.questionsTraitees[q.id]=true;
                    bilan.resultats[q.id]=false;
                    sauvegarde.erreurs[q.id]={nombreErreurs:2,reussites:0,maitrisee:false,theme};
                    const ouvrir=()=>{
                        etat.mode=mode; etat.theme=theme; etat.etape=1;
                        etat.perimetreRevision=mode==='revision'?`${theme}:etape:1`:'tous';
                        etat.jokersSessionActifs=true; etat.chronometreSessionActif=false;
                        lancerSession([q]);
                    };
                    return {ouvrir, q, suivi:()=>sauvegarde.erreurs[q.id], active:()=>sauvegarde.erreurs[q.id]?.maitrisee!==true,
                        acquis:()=>obtenirBilanEtape(theme,1).resultats[q.id]===true};
                }
                if(jeu==='sigles') {
                    const c=obtenirSiglesEtape(numero)[0];
                    marquerSigleIntroduit(c.sigle); enregistrerErreurSigles([c]);
                    const ouvrir=()=>preparerSessionMissionSiglesNative({mode,etape:numero,
                        sigles:[c],questions:[creerQuestionRappelDirectSigles(c)],titre:'Test'});
                    return {ouvrir,suivi:()=>sauvegarde.siglesJeu.erreurs[c.sigle],active:()=>sauvegarde.siglesJeu.erreurs[c.sigle].active,
                        acquis:()=>obtenirEtatEtapeSigles(numero).autonomes[c.sigle]===true};
                }
                const c=obtenirReperesMesuresEtape(1)[0];
                marquerRepereMesureIntroduit(c.cle); enregistrerErreurMesures([c]);
                const ouvrir=()=>preparerSessionMissionMesuresNative({mode,etape:1,
                    reperes:[c],questions:creerQuestionsRevisionMesures([c]),titre:'Test'});
                return {ouvrir,suivi:()=>sauvegarde.mesuresJeu.erreurs[c.cle],active:()=>sauvegarde.mesuresJeu.erreurs[c.cle].active,
                    acquis:()=>obtenirEtatEtapeMesures(1).autonomes[c.cle]===true};
            };
        }""")

    def tearDown(self):
        self.contexte.close()

    def test_une_reussite_autonome_synchronise_tous_les_modes(self):
        resultats = self.page.evaluate("""() => {
            const cas=[];
            THEMES.forEach(t=>['parcours','libre','revision'].forEach(mode=>cas.push(['parcours',mode,t.id])));
            ['parcours','entrainement','hasard','revision','evaluation'].forEach(mode=>{
                cas.push(['sigles',mode,'commun',1],['sigles',mode,'commun',6],['mesures',mode]);
            });
            return cas.map(args=>{
                const f=fixtureErreur(...args); f.ouvrir();
                finaliserReponse(true,etat.questionCourante.bonneReponse);
                const resultat={cas:args,active:f.active(),acquis:f.acquis(),
                    bouton:document.querySelector('#boutonRejouerErreursEtape').disabled,
                    erreursPrincipales:Object.keys(sauvegarde.erreurs).length};
                sauvegarde=nettoyerSauvegarde(JSON.parse(JSON.stringify(sauvegarde)));
                resultat.apresNettoyage=f.active();
                return resultat;
            });
        }""")
        self.assertEqual(len(resultats), 33)
        for r in resultats:
            with self.subTest(cas=r['cas']):
                self.assertFalse(r['active'], r)
                self.assertFalse(r['apresNettoyage'], r)
                self.assertTrue(r['acquis'], r)
                self.assertTrue(r['bouton'], r)
                if r['cas'][0] != 'parcours':
                    self.assertEqual(r['erreursPrincipales'], 0, r)

    def test_nouvel_echec_aide_reprise_et_passage_restent_a_revoir(self):
        resultats = self.page.evaluate("""() => {
            const resultats=[];
            for(const jeu of ['parcours','sigles','mesures']) {
                const f=fixtureErreur(jeu,'parcours'); f.ouvrir();
                finaliserReponse(true,etat.questionCourante.bonneReponse);
                f.ouvrir(); finaliserReponse(false,'Erreur');
                const apresEchec=f.active();
                rejouerQuestionCourante(); finaliserReponse(true,etat.questionCourante.bonneReponse);
                const apresReprise=f.active();
                f.ouvrir(); etat.jokers.indice=false;
                finaliserReponse(true,etat.questionCourante.bonneReponse);
                const apresJoker=f.active();
                f.ouvrir(); finaliserReponse(true,etat.questionCourante.bonneReponse);
                const apresSucces=f.active();
                f.ouvrir(); passerQuestion();
                sauvegarde=nettoyerSauvegarde(JSON.parse(JSON.stringify(sauvegarde)));
                resultats.push({jeu,apresEchec,apresReprise,apresJoker,apresSucces,
                    apresPassage:f.active(),acquis:f.acquis(),
                    erreursPrincipales:Object.keys(sauvegarde.erreurs).length});
            }
            return resultats;
        }""")
        for r in resultats:
            with self.subTest(jeu=r['jeu']):
                for cle in ['apresEchec','apresReprise','apresJoker','apresPassage','acquis']:
                    self.assertTrue(r[cle], r)
                self.assertFalse(r['apresSucces'], r)
                if r['jeu'] != 'parcours':
                    self.assertEqual(r['erreursPrincipales'], 0, r)

    def test_ancienne_sauvegarde_archive_seulement_les_acquis_autonomes(self):
        r = self.page.evaluate("""() => {
            const brut=creerSauvegardeInitiale(); delete brut.erreursSynchronisees;
            brut.xp=432; brut.evaluationsFinales.commun={meilleurScore:94,nombreTentatives:3,reussie:true};
            const qs=obtenirQuestionsEtape('commun',1).slice(0,3);
            brut.progression.apprenant.commun={1:{questionsTraitees:{},resultats:{},validationsSansJoker:{}}};
            const bilan=brut.progression.apprenant.commun[1];
            qs.forEach((q,i)=>{
                bilan.questionsTraitees[q.id]=true; bilan.resultats[q.id]=i===0;
                bilan.validationsSansJoker[q.id]=i<2;
                brut.erreurs[q.id]={maitrisee:false,nombreErreurs:8,reussites:0,theme:'commun'};
            });
            const sigles=obtenirSiglesEtape(6).slice(0,3), mesures=obtenirReperesMesuresEtape(1).slice(0,3);
            for(const [jeu,cibles,numero,champ] of [[brut.siglesJeu,sigles,6,'sigle'],[brut.mesuresJeu,mesures,1,'cle']]) {
                cibles.forEach((c,i)=>{
                    const cle=c[champ]; jeu.erreurs[cle]={active:true,nombreErreurs:8,reussitesRevision:0};
                    jeu.etapes[numero].autonomes[cle]=i===0;
                    jeu.etapes[numero].validationsSansJoker[cle]=i<2;
                });
                jeu.etapes[numero].celebrationAffichee=true;
            }
            const avant=JSON.stringify(brut), propre=nettoyerSauvegarde(brut);
            return {brutInchange:avant===JSON.stringify(brut),version:propre.version,marqueur:propre.erreursSynchronisees,
                xp:propre.xp,evaluation:propre.evaluationsFinales.commun,
                principales:qs.map(q=>propre.erreurs[q.id].maitrisee),
                sigles:sigles.map(c=>propre.siglesJeu.erreurs[c.sigle].active),
                mesures:mesures.map(c=>propre.mesuresJeu.erreurs[c.cle].active),
                historique:propre.siglesJeu.erreurs[sigles[0].sigle].nombreErreurs,
                etoile:propre.siglesJeu.etapes[6].celebrationAffichee,
                idempotent:JSON.stringify(propre)===JSON.stringify(nettoyerSauvegarde(propre))};
        }""")
        self.assertEqual(r, {'brutInchange':True,'version':'V1','marqueur':True,'xp':432,
                            'evaluation':{'meilleurScore':94,'nombreTentatives':3,'reussie':True},
                            'principales':[True,False,False],'sigles':[False,True,True],
                            'mesures':[False,True,True],'historique':8,'etoile':True,'idempotent':True})

    def test_cas_12_maitrises_et_8_erreurs_puis_rechargement(self):
        r = self.page.evaluate("""() => {
            const cibles=obtenirSiglesEtape(6);
            const jeu=obtenirSauvegardeJeuSigles();
            cibles.forEach(c=>{jeu.decouverts[c.sigle]=true;jeu.etapes[6].autonomes[c.sigle]=true;jeu.etapes[6].validationsSansJoker[c.sigle]=true;});
            enregistrerErreurSigles(cibles.slice(0,8));
            delete sauvegarde.erreursSynchronisees;
            sauvegarde=nettoyerSauvegarde(sauvegarde);
            choisirDomaineSigles('pjj'); afficherEcran('sigles'); afficherVueSigles('parcours');
            enregistrerSauvegarde();
            return {acquis:compterMaitrisesEtapeSigles(6),erreurs:obtenirCiblesARejouerEtapeSigles(6).length,
                carte:document.querySelector('[data-sigles-etape="6"]').textContent,
                bouton:document.querySelector('[data-action="reviser-etape-sigles"][data-etape="6"]').disabled};
        }""")
        self.assertEqual(r['acquis'],12)
        self.assertEqual(r['erreurs'],0)
        self.assertTrue(r['bouton'])
        self.assertIn('Maîtrisée',r['carte'])
        self.page.reload(wait_until='domcontentloaded')
        self.assertEqual(self.page.evaluate('compterMaitrisesEtapeSigles(6)'),12)
        self.assertEqual(self.page.evaluate('obtenirCiblesARejouerEtapeSigles(6).length'),0)
        self.page.evaluate("enregistrerErreurSigles(obtenirSiglesEtape(6).slice(0,1)); enregistrerSauvegarde()")
        self.page.reload(wait_until='domcontentloaded')
        self.assertEqual(self.page.evaluate('obtenirCiblesARejouerEtapeSigles(6).length'),1)
        self.assertEqual(self.page.evaluate('compterMaitrisesEtapeSigles(6)'),12)

    def test_introduction_ne_valide_pas_un_rappel(self):
        r = self.page.evaluate("""() => {
            const c=obtenirSiglesEtape(6)[0]; enregistrerErreurSigles([c]);
            preparerSessionMissionSiglesNative({mode:'parcours',etape:6,sigles:[c],questions:[creerQuestionIntroductionSigles(c)]});
            finaliserReponse(true,etat.questionCourante.bonneReponse);
            const sigleActif=sauvegarde.siglesJeu.erreurs[c.sigle].active;
            const m=obtenirReperesMesuresEtape(1)[0]; enregistrerErreurMesures([m]);
            preparerSessionMissionMesuresNative({mode:'parcours',etape:1,reperes:[m],questions:[creerQuestionChoixMesure(m,'Introduction',new Set())]});
            finaliserReponse(true,etat.questionCourante.bonneReponse);
            return {sigleActif,mesureActive:sauvegarde.mesuresJeu.erreurs[m.cle].active,
                siglesMaitrises:compterMaitrisesEtapeSigles(6),mesuresMaitrisees:compterMaitrisesEtapeMesures(1)};
        }""")
        self.assertEqual(r,{'sigleActif':True,'mesureActive':True,'siglesMaitrises':0,'mesuresMaitrisees':0})

    def test_association_consolide_toutes_ses_cibles_et_epargne_les_autres(self):
        r = self.page.evaluate("""() => {
            const cibles=obtenirSiglesEtape(6).slice(0,5);
            cibles.forEach(c=>{
                marquerSigleIntroduit(c.sigle);
                obtenirEtatEtapeSigles(6).autonomes[c.sigle]=true;
            });
            enregistrerErreurSigles(cibles);
            preparerSessionMissionSiglesNative({mode:'evaluation',sigles:cibles.slice(0,4),questions:[creerQuestionAssociationSigles(cibles.slice(0,4))]});
            finaliserReponse(true,'Associations correctes');
            return cibles.map(c=>sauvegarde.siglesJeu.erreurs[c.sigle].active);
        }""")
        self.assertEqual(r,[False,False,False,False,True])

    def test_revision_generale_consolide_et_entrainement_ne_demarre_pas_une_etape(self):
        r = self.page.evaluate("""() => {
            const f=fixtureErreur('parcours','revision'); f.ouvrir();
            etat.perimetreRevision='tous';
            finaliserReponse(true,etat.questionCourante.bonneReponse);
            const revision={active:f.active(),acquis:f.acquis()};
            sauvegarde=creerSauvegardeInitiale();
            const q=obtenirQuestionsEtape('commun',1)[0];
            etat.mode='libre'; etat.theme='commun'; etat.etape=1;
            lancerSession([q]); finaliserReponse(true,q.bonneReponse);
            return {revision,demarree:obtenirBilanEtape('commun',1).questionsTraitees[q.id]===true};
        }""")
        self.assertEqual(r,{'revision':{'active':False,'acquis':True},'demarree':False})


    def test_reprise_validee_et_consolidation_independantes_dans_tous_les_modes(self):
        resultats = self.page.evaluate("""() => {
            const cas=[];
            THEMES.forEach(t=>['parcours','libre','revision'].forEach(mode=>cas.push(['parcours',mode,t.id])));
            ['parcours','entrainement','hasard','revision'].forEach(mode=>{
                cas.push(['sigles',mode,'commun',1],['sigles',mode,'commun',6],['mesures',mode]);
            });
            return cas.map(args=>{
                const f=fixtureErreur(...args); f.ouvrir();
                finaliserReponse(false,'Incorrect');
                const historique=f.suivi().nombreErreurs;
                rejouerQuestionCourante(); finaliserReponse(true,etat.questionCourante.bonneReponse);
                const q=etat.questionCourante;
                const resultat={cas:args,score:etat.score,aidees:etat.nombreReponsesAidees,
                    statut:etat.reponsesSession.get(q.id).statut,erreur:etat.erreursSession.has(q.id),
                    motif:f.suivi().motifRevision,acquis:f.acquis(),revision:f.active(),
                    historiqueStable:f.suivi().nombreErreurs===historique,
                    questionsRevision:obtenirQuestionsAConsoliderSession().length};
                afficherErreursBilan(obtenirQuestionsAConsoliderSession(),0);
                resultat.bilan=document.querySelector('#listeErreursBilan').textContent;
                sauvegarde=nettoyerSauvegarde(JSON.parse(JSON.stringify(sauvegarde)));
                resultat.persiste=f.active() && f.acquis() && f.suivi().motifRevision==='reprise';
                f.ouvrir(); finaliserReponse(true,etat.questionCourante.bonneReponse);
                resultat.consolidee=!f.active() && f.acquis();
                return resultat;
            });
        }""")
        self.assertEqual(len(resultats),30)
        for r in resultats:
            with self.subTest(cas=r['cas']):
                self.assertEqual(r['score'],1,r)
                self.assertEqual(r['aidees'],0,r)
                self.assertEqual(r['statut'],'correcte',r)
                self.assertFalse(r['erreur'],r)
                self.assertEqual(r['motif'],'reprise',r)
                self.assertEqual(r['questionsRevision'],1,r)
                for cle in ['acquis','revision','historiqueStable','persiste','consolidee']:
                    self.assertTrue(r[cle],r)
                self.assertIn('Question rejouée après erreur · à consolider',r['bilan'])
                self.assertNotIn('Incorrecte — erreur à réviser',r['bilan'])

    def test_evaluations_sans_reprise_joker_ni_passage(self):
        for jeu in ['parcours', 'sigles', 'mesures']:
            with self.subTest(jeu=jeu):
                r = self.page.evaluate("""jeu => {
                    const f=fixtureErreur(jeu,jeu==='parcours'?'evaluation-finale':'evaluation'); f.ouvrir();
                    const passeesAvant=etat.questionsPassees.size;
                    const passerCache=document.querySelector('#boutonPasser').classList.contains('masque');
                    const jokersCaches=document.querySelector('#boutonJokers').classList.contains('masque');
                    passerQuestion(); finaliserReponse(false,'Incorrect');
                    const repriseAbsente=!document.querySelector('#rejouerQuestion');
                    rejouerQuestionCourante(); finaliserReponse(true,etat.questionCourante.bonneReponse);
                    return {score:etat.score,reprises:etat.tentativesQuestions.size,
                        passageInchange:etat.questionsPassees.size===passeesAvant,
                        passerCache,jokersCaches,repriseAbsente};
                }""", jeu)
                self.assertEqual(r,dict(score=0,reprises=0,passageInchange=True,
                                        passerCache=True,jokersCaches=True,repriseAbsente=True))

    def test_reprise_avec_joker_reste_aidee(self):
        resultats=self.page.evaluate("""() => ['parcours','sigles','mesures'].map(jeu=>{
            const f=fixtureErreur(jeu,'parcours'); f.ouvrir();
            etat.jokers.indice=false; finaliserReponse(false,'Incorrect');
            rejouerQuestionCourante(); finaliserReponse(true,etat.questionCourante.bonneReponse);
            return {jeu,score:etat.score,aidees:etat.nombreReponsesAidees,
                acquis:f.acquis(),revision:f.active(),motif:f.suivi().motifRevision};
        })""")
        for r in resultats:
            self.assertEqual(r,dict(jeu=r['jeu'],score=0,aidees=1,acquis=False,revision=True,motif='joker'))

    def test_migration_reprises_validees_sans_effacer_consolidation_ni_historique(self):
        r=self.page.evaluate("""() => {
            const brut=creerSauvegardeInitiale(); delete brut.reprisesSansJokerValidees;
            brut.xp=432;
            const q=obtenirQuestionsEtape('commun',1)[0];
            brut.progression.apprenant.commun={1:{questionsTraitees:{[q.id]:true},resultats:{[q.id]:false},validationsSansJoker:{[q.id]:true}}};
            brut.erreurs[q.id]={maitrisee:false,nombreErreurs:8,theme:'commun'};
            const c=obtenirSiglesEtape(6)[0], m=obtenirReperesMesuresEtape(1)[0];
            for (const [jeu,cle,n] of [[brut.siglesJeu,c.sigle,6],[brut.mesuresJeu,m.cle,1]]) {
                jeu.etapes[n].validationsSansJoker[cle]=true;
                jeu.erreurs[cle]={active:true,nombreErreurs:8};
            }
            const avant=JSON.stringify(brut), propre=nettoyerSauvegarde(brut);
            const suivis=[propre.erreurs[q.id],propre.siglesJeu.erreurs[c.sigle],propre.mesuresJeu.erreurs[m.cle]];
            const idempotent=JSON.stringify(propre)===JSON.stringify(nettoyerSauvegarde(propre));
            propre.siglesJeu.erreurs[c.sigle].motifRevision='incorrecte';
            const nouveau=nettoyerSauvegarde(propre);
            return {brutInchange:avant===JSON.stringify(brut),xp:propre.xp,idempotent,
                acquis:[propre.progression.apprenant.commun[1].resultats[q.id],propre.siglesJeu.etapes[6].autonomes[c.sigle],propre.mesuresJeu.etapes[1].autonomes[m.cle]],
                motifs:suivis.map(s=>s.motifRevision),historique:suivis.map(s=>s.nombreErreurs),
                actif:[!propre.erreurs[q.id].maitrisee,propre.siglesJeu.erreurs[c.sigle].active,propre.mesuresJeu.erreurs[m.cle].active],
                nouvelleTentativePreservee:nouveau.siglesJeu.erreurs[c.sigle].motifRevision==='incorrecte'};
        }""")
        self.assertEqual(r,dict(brutInchange=True,xp=432,idempotent=True,acquis=[True]*3,
            motifs=['reprise','incorrecte','reprise'],historique=[8]*3,actif=[True]*3,nouvelleTentativePreservee=True))

    def test_rechargement_session_et_reprise_ancienne(self):
        for ancienne in [False,True]:
            with self.subTest(ancienne=ancienne):
                r=self.page.evaluate("""ancienne => {
                    const f=fixtureErreur('parcours','parcours'); f.ouvrir();
                    finaliserReponse(false,'Incorrect'); rejouerQuestionCourante();
                    finaliserReponse(true,etat.questionCourante.bonneReponse);
                    const avant=chargerSessionEnCours();
                    if(ancienne) {
                        avant.score=0; avant.nombreReponsesAidees=1; avant.erreursSession=[f.q.id];
                        const rep=avant.reponsesSession.find(([id])=>id===f.q.id)[1];
                        rep.statut='aidee'; rep.precisions.aidee=true; delete rep.precisions.aConsolider;
                        localStorage.setItem(CLE_SESSION_EN_COURS,JSON.stringify(avant));
                    }
                    etat.score=0; etat.reponsesSession=new Map();
                    const restauree=restaurerSessionEnCours();
                    return {restauree,score:etat.score,aidees:etat.nombreReponsesAidees,
                        statut:etat.reponsesSession.get(f.q.id).statut,erreur:etat.erreursSession.has(f.q.id),
                        revision:obtenirQuestionsAConsoliderSession().length,motif:f.suivi().motifRevision};
                }""",ancienne)
                self.assertEqual(r,dict(restauree=True,score=1,aidees=0,statut='correcte',erreur=False,revision=1,motif='reprise'))
        self.page.reload(wait_until='domcontentloaded')
        self.assertTrue(self.page.evaluate('restaurerSessionEnCours()'))
        self.assertEqual(self.page.evaluate('etat.score'),1)
        self.assertEqual(self.page.evaluate('obtenirQuestionsAConsoliderSession().length'),1)

    def test_etape_et_session_validees_malgre_consolidation(self):
        r=self.page.evaluate("""() => {
            const qs=obtenirQuestionsEtape('commun',1);
            etat.mode='parcours'; etat.theme='commun'; etat.etape=1;
            etat.jokersSessionActifs=true; etat.chronometreSessionActif=false;
            lancerSession(qs);
            for (let i=0;i<qs.length;i++) {
                if(i===qs.length-1) {finaliserReponse(false,'Incorrect');rejouerQuestionCourante();}
                finaliserReponse(true,etat.questionCourante.bonneReponse);
                if(i<qs.length-1) afficherQuestionSuivante();
            }
            terminerSession();
            const bilan=obtenirBilanEtape('commun',1);
            return {score:document.querySelector('#scoreBilan').textContent,
                bonnes:document.querySelector('#bonnesReponsesBilan').textContent,
                total:qs.length,maitrisee:bilan.termineeSansJoker,celebration:bilan.celebrationSansJokerAffichee,
                revision:obtenirQuestionsAvecErreursActives().length,
                libelle:document.querySelector('#nombreErreursBilan').textContent};
        }""")
        self.assertEqual(r['score'],'100%')
        self.assertEqual(r['bonnes'],f"{r['total']}/{r['total']}")
        self.assertTrue(r['maitrisee'],r)
        self.assertTrue(r['celebration'],r)
        self.assertEqual(r['revision'],1)
        self.assertEqual(r['libelle'],'1 question à consolider')


if __name__ == '__main__':
    unittest.main()
