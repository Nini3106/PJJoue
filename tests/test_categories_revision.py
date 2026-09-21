"""Parcours réels des catégories de révision, dans les trois jeux."""
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright
from verifier_interface import construire_page_jeu, lancer_chromium


class CategoriesRevisionTests(unittest.TestCase):
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
            window.preparerCategories = jeu => {
                sauvegarde = creerSauvegardeInitiale();
                sauvegarde.parametres.son = false;
                sauvegarde.aDejaJoue = true;
                sauvegarde.xp = 432;
                etat.questionsSession = [];
                choisirDomaineSigles('cjpm');
                const motifs = ['reprise','joker','passage','incorrecte',null];
                const pool = jeu === 'parcours' ? obtenirQuestionsEtape('commun',1)
                    : jeu === 'sigles' ? obtenirPoolDomaineSigles() : obtenirReperesMesuresEtape(1);
                const cles = pool.slice(0,6).map(c => jeu === 'parcours' ? String(c.id)
                    : jeu === 'sigles' ? normaliserSigleJeu(c.sigle) : normaliserCleMesure(c.cle));
                const erreurs = jeu === 'parcours' ? sauvegarde.erreurs
                    : jeu === 'sigles' ? sauvegarde.siglesJeu.erreurs : sauvegarde.mesuresJeu.erreurs;
                cles.forEach((cle,i) => erreurs[cle] = {active:i < 5,maitrisee:i === 5,
                    nombreErreurs:1,motifRevision:motifs[i] || null,reussites:0,reussitesRevision:0,theme:'commun'});
                const ecran = {parcours:'erreurs',sigles:'sigles-revision',mesures:'mesures-revision'}[jeu];
                afficherEcran(ecran,{forcerSortieQuestion:true,remplacerHistorique:true});
                return {cles,ecran};
            };
        }""")

    def tearDown(self):
        self.contexte.close()

    def test_categories_et_sessions_ciblees_des_trois_jeux(self):
        motifs = ['reprise', 'joker', 'passage', 'incorrecte', 'inconnu']
        libelles = ['Validée après reprise sans joker · à consolider',
                    'Validée avec joker · à consolider', 'Passée — non répondue',
                    'Incorrecte — erreur à réviser', 'Motif non enregistré · à consolider']
        for jeu in ['parcours', 'sigles', 'mesures']:
            for index, motif in enumerate(motifs):
                with self.subTest(jeu=jeu, categorie=motif):
                    fixture = self.page.evaluate('preparerCategories', jeu)
                    zone = self.page.locator(f"#{fixture['ecran']} .revision-categories")
                    self.assertEqual(zone.locator('.revision-categorie').count(), 5)
                    self.assertEqual(zone.locator('summary small').all_text_contents(), ['1 question'] * 5)
                    self.assertEqual(zone.locator('summary strong').all_text_contents(), libelles)
                    dossier = zone.locator(f'[data-categorie-revision="{motif}"]').first
                    dossier.locator('summary').click()
                    dossier.locator('button').click()
                    resultat = self.page.evaluate("""jeu => ({
                        mode:etat.mode, jokers:etat.jokersSessionActifs, xp:sauvegarde.xp,
                        cles:etat.questionsSession.flatMap(q => jeu === 'parcours' ? [String(q.id)]
                            : jeu === 'sigles' ? q.missionSiglesMeta.cibles : q.missionMesuresMeta.cibles),
                        actifs:obtenirElementsCategoriesRevision(jeu).length
                    })""", jeu)
                    self.assertEqual(resultat, dict(mode='revision' if jeu == 'parcours' else f'{jeu}-revision',
                                                   jokers=False, xp=432, cles=[fixture['cles'][index]], actifs=5))
                    self.page.evaluate("finaliserReponse(true,etat.questionCourante.bonneReponse)")
                    self.assertEqual(self.page.evaluate('jeu => obtenirElementsCategoriesRevision(jeu).length', jeu), 4)

    def test_categorie_sigles_respecte_le_domaine_selectionne(self):
        resultat = self.page.evaluate("""() => {
            preparerCategories('sigles');
            const cible = SIGLES.find(c => c.domaine === 'pjj');
            enregistrerErreurSigles([cible], 'passage');
            choisirDomaineSigles('pjj');
            afficherEcran('sigles-revision');
            return {cle:cible.sigle};
        }""")
        dossier = self.page.locator('#sigles-revision .revision-categorie[data-categorie-revision="passage"]')
        self.assertEqual(dossier.locator('summary small').inner_text(), '1 question')
        dossier.locator('summary').click()
        dossier.locator('button').click()
        self.assertEqual(self.page.evaluate('etat.questionsSession.flatMap(q => q.missionSiglesMeta.cibles)'), [resultat['cle']])

    def test_categorie_vide_ou_consolidee_ne_relance_pas_dancienne_question(self):
        for jeu in ['parcours', 'sigles', 'mesures']:
            with self.subTest(jeu=jeu):
                fixture = self.page.evaluate("""jeu => {
                    const fixture = preparerCategories(jeu);
                    const erreurs = jeu === 'parcours' ? sauvegarde.erreurs
                        : jeu === 'sigles' ? sauvegarde.siglesJeu.erreurs : sauvegarde.mesuresJeu.erreurs;
                    erreurs[fixture.cles[3]].maitrisee = true;
                    erreurs[fixture.cles[3]].active = false;
                    return fixture;
                }""", jeu)
                zone = self.page.locator(f"#{fixture['ecran']}")
                dossier = zone.locator('.revision-categorie[data-categorie-revision="incorrecte"]')
                dossier.locator('summary').click()
                dossier.locator('button').click()
                self.assertEqual(self.page.evaluate('etat.questionsSession.length'), 0)
                self.page.evaluate('ecran => afficherEcran(ecran)', fixture['ecran'])
                self.assertEqual(dossier.count(), 0)
                self.assertEqual(zone.locator('.revision-categorie').count(), 4)
                self.page.evaluate("""({jeu,ecran}) => {
                    const erreurs = jeu === 'parcours' ? sauvegarde.erreurs
                        : jeu === 'sigles' ? sauvegarde.siglesJeu.erreurs : sauvegarde.mesuresJeu.erreurs;
                    Object.values(erreurs).forEach(suivi => { suivi.maitrisee = true; suivi.active = false; });
                    afficherEcran(ecran);
                }""", dict(jeu=jeu, ecran=fixture['ecran']))
                self.assertEqual(zone.locator('.revision-categories').count(), 0)
                self.assertEqual(self.page.evaluate('construireCategoriesRevision', jeu), '')

    def test_categories_lisibles_sur_mobile_et_ordinateur(self):
        sortie = Path(__file__).resolve().parents[1] / 'test-results' / 'categories-revision'
        sortie.mkdir(parents=True, exist_ok=True)
        for jeu in ['parcours', 'sigles', 'mesures']:
            fixture = self.page.evaluate("""jeu => {
                const fixture = preparerCategories(jeu);
                const erreurs = jeu === 'parcours' ? sauvegarde.erreurs
                    : jeu === 'sigles' ? sauvegarde.siglesJeu.erreurs : sauvegarde.mesuresJeu.erreurs;
                [1,2,3].forEach(i => { erreurs[fixture.cles[i]].maitrisee = true; erreurs[fixture.cles[i]].active = false; });
                if (jeu === 'parcours') {
                    THEMES.forEach((theme,i) => {
                        const question = obtenirQuestionsEtape(theme.id, i + 2)[0];
                        erreurs[question.id] = {maitrisee:false, motifRevision:i % 2 ? 'reprise' : null};
                    });
                }
                afficherEcran(fixture.ecran);
                return fixture;
            }""", jeu)
            for largeur in [1440, 390, 320]:
                with self.subTest(jeu=jeu, largeur=largeur):
                    self.page.set_viewport_size({'width':largeur,'height':1000})
                    self.page.locator(f"#{fixture['ecran']} .revision-categories").scroll_into_view_if_needed()
                    self.page.locator(f"#{fixture['ecran']} .revision-categorie").evaluate_all(
                        '(categories) => categories.forEach(categorie => categorie.open = true)'
                    )
                    self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth - innerWidth'), 1)
                    self.assertTrue(self.page.locator(f"#{fixture['ecran']} .revision-categories").is_visible())
                    self.assertEqual(self.page.locator(f"#{fixture['ecran']} .revision-categorie").count(), 2)
                    self.page.evaluate('document.activeElement?.blur()')
                    self.page.screenshot(path=str(sortie / f'{jeu}-{largeur}.png'), full_page=True)


if __name__ == '__main__':
    unittest.main()
