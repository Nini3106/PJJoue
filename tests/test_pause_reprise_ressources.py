"""Ressources pendant une session : pause complète puis reprise sans perte."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
import unittest

from playwright.sync_api import sync_playwright
from verifier_interface import lancer_chromium

RACINE = Path(__file__).resolve().parents[1]


class PauseRessourcesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.serveur = ThreadingHTTPServer(
            ('127.0.0.1', 0),
            partial(SimpleHTTPRequestHandler, directory=str(RACINE)),
        )
        cls.thread = threading.Thread(target=cls.serveur.serve_forever, daemon=True)
        cls.thread.start()
        cls.url = f'http://127.0.0.1:{cls.serveur.server_port}/'
        cls.playwright = sync_playwright().start()
        cls.navigateur = lancer_chromium(cls.playwright)

    @classmethod
    def tearDownClass(cls):
        cls.navigateur.close()
        cls.playwright.stop()
        cls.serveur.shutdown()
        cls.serveur.server_close()
        cls.thread.join()

    def test_evaluation_ressources_retour_recharge_conserve_toute_la_session(self):
        contexte = self.navigateur.new_context(viewport={'width': 1280, 'height': 900}, bypass_csp=True)
        page = contexte.new_page()
        try:
            page.goto(self.url, wait_until='load')
            page.evaluate("""() => {
                sauvegarde = creerSauvegardeInitiale();
                sauvegarde.parametres.son = false;
                etat.mode = 'evaluation-finale';
                etat.theme = 'procedure_ordinaire';
                etat.etape = 12;
                const questions = obtenirQuestionsEvaluationFinale(etat.theme)
                    .filter(q => (q.modePrefere || obtenirModeQuestion(q)) === 'choix-unique')
                    .slice(0, 2);
                if (questions.length !== 2) throw new Error('Deux QCM d’évaluation sont requis pour le test.');
                lancerSession(questions);
                finaliserReponse(true, etat.questionCourante.bonneReponse);
                afficherQuestionSuivante();
                ajouterTempsChronometreQuestion();
                etat.tempsRestant = 12;
                obtenirChronometreQuestion().tempsRestant = 12;
                enregistrerSessionEnCours();
            }""")
            question_id = page.evaluate('etat.questionCourante.id')
            self.assertEqual(page.evaluate('etat.indexQuestion'), 1)
            self.assertEqual(page.evaluate('etat.score'), 1)

            page.locator('#boutonSupportsRevision').click()
            page.wait_for_function("etat.ecran === 'supports'")
            self.assertEqual(page.evaluate('etat.questionsSession.length'), 2)
            self.assertTrue(page.evaluate("chargerSessionEnCours()?.retourDepuisSupports === true"))
            self.assertTrue(page.evaluate("etat.identifiantMinuteur === null"))

            # Même après un rechargement sur l’écran Ressources, le point de reprise reste disponible.
            page.reload(wait_until='load')
            page.wait_for_function("etat.ecran === 'supports'")
            self.assertTrue(page.evaluate("chargerSessionEnCours()?.retourDepuisSupports === true"))

            page.locator('#boutonRetour').click()
            page.wait_for_function("etat.ecran === 'question' && etat.indexQuestion === 1")
            self.assertEqual(page.evaluate('etat.questionCourante.id'), question_id)
            self.assertEqual(page.evaluate('etat.score'), 1)
            self.assertGreater(page.locator('#zoneReponses .reponse:not(:disabled)').count(), 0)
            self.assertTrue(page.evaluate("etat.identifiantMinuteur !== null"))
            self.assertGreater(page.evaluate('etat.tempsRestant'), 0)
            self.assertLessEqual(page.evaluate('etat.tempsRestant'), 12)

            # Un F5 sur la question doit restaurer la même tentative, et non recommencer à zéro.
            page.reload(wait_until='load')
            page.wait_for_function("etat.ecran === 'question' && etat.indexQuestion === 1")
            self.assertEqual(page.evaluate('etat.questionCourante.id'), question_id)
            self.assertEqual(page.evaluate('etat.score'), 1)
            self.assertGreater(page.locator('#zoneReponses .reponse:not(:disabled)').count(), 0)

            page.locator('#zoneReponses .reponse[data-est-correcte="1"]').click()
            page.wait_for_function("etat.questionValidee === true")
            self.assertEqual(page.evaluate('etat.score'), 2)
        finally:
            contexte.close()


if __name__ == '__main__':
    unittest.main()
