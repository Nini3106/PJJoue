"""Parcours réels des catégories de révision, dans les trois jeux."""
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as DelaiPlaywright
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

    def test_menus_de_filtres_au_clavier_et_sur_mobile(self):
        for jeu in ['parcours', 'sigles', 'mesures']:
            with self.subTest(jeu=jeu):
                fixture = self.page.evaluate("""jeu => {
                    const fixture = preparerCategories(jeu);
                    const cible = jeu === 'parcours' ? obtenirQuestionsEtape('commun',2)[0]
                        : jeu === 'sigles' ? obtenirSiglesEtape(2)[0] : obtenirReperesMesuresEtape(2)[0];
                    const erreurs = jeu === 'parcours' ? sauvegarde.erreurs
                        : jeu === 'sigles' ? sauvegarde.siglesJeu.erreurs : sauvegarde.mesuresJeu.erreurs;
                    const cle = jeu === 'parcours' ? cible.id
                        : jeu === 'sigles' ? normaliserSigleJeu(cible.sigle) : normaliserCleMesure(cible.cle);
                    erreurs[cle] = {active:true, maitrisee:false, motifRevision:'passage', nombreErreurs:1};
                    afficherEcran(fixture.ecran);
                    return fixture;
                }""", jeu)
                self.page.set_viewport_size({'width':320, 'height':844})
                entete = self.page.locator(f'#filtreRevisionEtape-{jeu}')
                menu = self.page.locator(f'#{fixture["ecran"]} [data-filtre-revision="etape"]')
                entete.click()
                self.assertTrue(menu.evaluate('(menu) => menu.open'))
                options = menu.locator('[role="option"]')
                self.assertGreaterEqual(options.count(), 3)
                self.assertEqual(menu.locator('[aria-selected="true"]').count(), 1)
                rectangles = options.evaluate_all("""elements => elements.map(element => {
                    const r = element.getBoundingClientRect();
                    return {gauche:r.left, droite:r.right, hauteur:r.height};
                })""")
                for rect in rectangles:
                    self.assertGreaterEqual(rect['gauche'], 0)
                    self.assertLessEqual(rect['droite'], 320)
                    self.assertGreaterEqual(rect['hauteur'], 44)
                entete.press('Escape')
                self.assertFalse(menu.evaluate('(menu) => menu.open'))
                entete.press('ArrowDown')
                self.page.locator(':focus').press('End')
                self.assertEqual(self.page.locator(':focus').get_attribute('data-valeur-filtre'), options.last.get_attribute('data-valeur-filtre'))
                self.page.locator(':focus').press('Home')
                valeurs = options.evaluate_all('(elements) => elements.map(element => element.dataset.valeurFiltre)')
                for _ in range(valeurs.index('2')):
                    self.page.locator(':focus').press('ArrowDown')
                self.page.locator(':focus').press('Enter')
                self.assertIn('2', entete.inner_text())
                self.assertFalse(menu.evaluate('(menu) => menu.open'))
                self.assertEqual(self.page.evaluate('document.activeElement.id'), f'filtreRevisionEtape-{jeu}')
                self.assertEqual(self.page.locator(f'#{fixture["ecran"]} .revision-categorie li').count(), 1)
                self.page.locator(f'[data-revision-selection="{jeu}"]').click()
                self.assertTrue(self.page.evaluate('etat.questionsSession.every(question => Number(question.etape) === 2)'))

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
                    boutons = self.page.locator(
                        f"#{fixture['ecran']} .revision-categorie button, "
                        f"#{fixture['ecran']} [data-revision-selection]"
                    ).evaluate_all("""elements => elements.map(bouton => {
                        const style = getComputedStyle(bouton);
                        const rect = bouton.getBoundingClientRect();
                        return {texte:bouton.textContent, hauteur:rect.height,
                            bordure:style.borderTopStyle, rayon:parseFloat(style.borderRadius),
                            couleur:style.backgroundColor, droite:rect.right, gauche:rect.left};
                    })""")
                    self.assertEqual(len(boutons), 3)
                    for bouton in boutons:
                        self.assertGreaterEqual(bouton['hauteur'], 44, bouton)
                        self.assertEqual(bouton['bordure'], 'solid', bouton)
                        self.assertGreaterEqual(bouton['rayon'], 10, bouton)
                        self.assertEqual(bouton['couleur'], 'rgb(16, 71, 127)', bouton)
                        self.assertGreaterEqual(bouton['gauche'], 0, bouton)
                        self.assertLessEqual(bouton['droite'], largeur, bouton)
                    self.page.evaluate('document.activeElement?.blur()')
                    self.page.screenshot(path=str(sortie / f'{jeu}-{largeur}.png'), full_page=True)


    def preparer_parcours_suspendable(self, jeu):
        if self.page.locator('#fenetreCelebration').is_visible():
            self.page.locator('#fermerFenetreCelebration').click()
        return self.page.evaluate("""jeu => {
            sauvegarde = creerSauvegardeInitiale();
            sauvegarde.parametres.son = false;
            etat.chronometreParcoursActif = false;
            choisirDomaineSigles('cjpm');
            if (jeu === 'parcours') lancerEtape('procedure_ordinaire', 1);
            else if (jeu === 'sigles') {
                const cs = obtenirSiglesEtape(6).slice(0,4);
                preparerSessionMissionSiglesNative({mode:'parcours',etape:6,sigles:cs,
                    questions:creerQuestionsRevisionSigles(cs),titre:'Test'});
            } else {
                const cs = obtenirReperesMesuresEtape(1).slice(0,4);
                preparerSessionMissionMesuresNative({mode:'parcours',etape:1,reperes:cs,
                    questions:creerQuestionsRevisionMesures(cs),titre:'Test'});
            }
            finaliserReponse(false, 'erreur'); afficherQuestionSuivante();
            finaliserReponse(true, etat.questionCourante.bonneReponse); afficherQuestionSuivante();
            return {id:etat.questionCourante.id,index:etat.indexQuestion,score:etat.score,
                enonce:document.querySelector('#enonceQuestion').textContent};
        }""", jeu)

    def test_retour_au_parcours_depuis_revision_meme_apres_rechargement(self):
        html_navigable = self.html.replace('mettreAJourAdresseNavigation = () => {}; ', '')
        self.contexte.route('**/*', lambda route: route.fulfill(body=html_navigable, content_type='text/html')
                            if route.request.is_navigation_request() else route.abort())
        self.page.reload(wait_until='domcontentloaded')
        for jeu in ['parcours', 'sigles', 'mesures']:
            with self.subTest(jeu=jeu):
                avant = self.preparer_parcours_suspendable(jeu)
                bouton = self.page.locator('#boutonReprendreEtapeDepuisDebut')
                self.assertEqual(bouton.inner_text(), 'Reprendre depuis le début')
                saisie = self.page.locator('#reponseEcrite')
                brouillon = saisie.is_visible()
                if brouillon:
                    saisie.fill('réponse en cours')
                self.page.locator('#boutonRejouerErreursEtape').click()
                self.assertEqual(bouton.inner_text(), 'Reprendre ma progression')
                self.assertTrue(bouton.is_visible())
                self.assertIn('Revenir à la question', bouton.get_attribute('data-infobulle'))
                self.page.reload(wait_until='domcontentloaded')
                self.assertEqual(bouton.inner_text(), 'Reprendre ma progression')
                self.assertIn('Revenir à la question', bouton.get_attribute('data-infobulle'))
                bouton.click()
                apres = self.page.evaluate("""() => ({id:etat.questionCourante.id,index:etat.indexQuestion,
                    score:etat.score,enonce:document.querySelector('#enonceQuestion').textContent})""")
                self.assertEqual(apres, avant)
                if brouillon:
                    self.assertEqual(saisie.input_value(), 'réponse en cours')
                self.assertEqual(bouton.inner_text(), 'Reprendre depuis le début')
                self.assertTrue(bouton.is_visible())

    def test_bilan_relance_directement_les_questions_de_la_session(self):
        for jeu in ['parcours', 'sigles', 'mesures']:
            with self.subTest(jeu=jeu):
                self.page.reload(wait_until='domcontentloaded')
                self.preparer_parcours_suspendable(jeu)
                attendues = self.page.evaluate("""() => {
                    passerQuestion();
                    while (etat.ecran === 'question') {
                        finaliserReponse(true, etat.questionCourante.bonneReponse);
                        afficherQuestionSuivante();
                    }
                    return obtenirQuestionsAConsoliderSession().map(q => [q.id,q.enonce]);
                }""")
                self.assertEqual(len(attendues), 2)
                # La célébration éventuelle s'ouvre après l'animation du bilan.
                try:
                    self.page.locator('#fenetreCelebration[open]').wait_for(state='visible', timeout=600)
                except DelaiPlaywright:
                    pass
                else:
                    self.page.locator('#fermerFenetreCelebration').click()
                self.assertNotEqual(self.page.locator('#boutonContinuer').inner_text(), 'Reprendre ma progression')
                bouton = self.page.locator('#boutonRejouerMesErreurs')
                self.assertTrue(bouton.is_visible())
                self.assertEqual(bouton.inner_text(), 'Refaire les questions à consolider')
                bouton.click()
                self.assertEqual(self.page.evaluate('etat.ecran'), 'question')
                self.assertEqual(self.page.evaluate('etat.questionsSession.map(q => [q.id,q.enonce])'), attendues)
                self.page.evaluate("""() => {
                    while (etat.ecran === 'question') {
                        finaliserReponse(true, etat.questionCourante.bonneReponse);
                        afficherQuestionSuivante();
                    }
                }""")
                self.assertFalse(bouton.is_visible())


if __name__ == '__main__':
    unittest.main()
