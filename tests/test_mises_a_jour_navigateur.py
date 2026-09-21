"""Publication A → B sur une vraie origine HTTP : les sessions doivent survivre."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
import threading
import unittest
from playwright.sync_api import sync_playwright
from verifier_interface import lancer_chromium

RACINE = Path(__file__).resolve().parents[1]
VERSION = re.search(r"pjjoue-application-([a-f0-9]{12})", (RACINE / 'service-worker.js').read_text()).group(1)


class ServeurVersions(SimpleHTTPRequestHandler):
    revision = 'aaaaaaaaaaaa'

    def log_message(self, *_args):
        pass

    def do_GET(self):
        chemin = Path(self.translate_path(self.path))
        if chemin.is_dir():
            chemin /= 'index.html'
        if chemin.is_file() and chemin.suffix in {'.html', '.js', '.css'}:
            contenu = chemin.read_text(encoding='utf-8').replace(VERSION, self.revision)
            if chemin.name == 'index.html':
                contenu = contenu.replace('<html', f'<html data-version-test="{self.revision}"', 1)
            octets = contenu.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', self.guess_type(str(chemin)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(octets)))
            self.end_headers()
            self.wfile.write(octets)
        else:
            super().do_GET()


class MisesAJourNavigateurTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.serveur = ThreadingHTTPServer(('127.0.0.1', 0), partial(ServeurVersions, directory=str(RACINE)))
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

    def test_mise_a_jour_directe_conserve_question_score_et_saisie(self):
        for jeu in ['parcours', 'sigles', 'mesures']:
            with self.subTest(jeu=jeu):
                ServeurVersions.revision = 'aaaaaaaaaaaa'
                contexte = self.navigateur.new_context(viewport={'width':390,'height':844})
                page = contexte.new_page()
                try:
                    page.goto(self.url, wait_until='load')
                    page.wait_for_function('!!navigator.serviceWorker.controller')
                    page.evaluate("""jeu => {
                        sauvegarde = creerSauvegardeInitiale(); sauvegarde.parametres.son = false;
                        if (jeu === 'parcours') {
                            etat.mode = 'parcours'; etat.theme = 'matiere_criminelle_peines'; etat.etape = 6;
                            lancerSession([QUESTIONS.find(q=>q.id===1651),QUESTIONS.find(q=>q.id===1652)]);
                        } else if (jeu === 'sigles') {
                            const cibles = obtenirSiglesEtape(6).slice(0,2);
                            preparerSessionMissionSiglesNative({mode:'parcours',etape:6,sigles:cibles,questions:creerQuestionsRevisionSigles(cibles),titre:'Test'});
                        } else {
                            const cibles = obtenirReperesMesuresEtape(1).slice(0,2);
                            preparerSessionMissionMesuresNative({mode:'parcours',etape:1,reperes:cibles,questions:creerQuestionsRevisionMesures(cibles),titre:'Test'});
                        }
                        finaliserReponse(true,etat.questionCourante.bonneReponse); afficherQuestionSuivante();
                    }""", jeu)
                    identifiant = page.evaluate('etat.questionCourante.id')
                    if jeu == 'parcours':
                        page.locator('#reponseEcrite').fill('7 500 euros')
                    ServeurVersions.revision = 'bbbbbbbbbbbb'
                    page.evaluate('async () => {const r=await navigator.serviceWorker.getRegistration();await r.update();}')
                    page.wait_for_function("document.documentElement.dataset.versionTest === 'bbbbbbbbbbbb'", timeout=30000)
                    page.wait_for_function("typeof etat !== 'undefined' && etat.ecran === 'question' && etat.indexQuestion === 1")
                    self.assertEqual(page.evaluate('etat.questionCourante.id'), identifiant)
                    self.assertEqual(page.evaluate('etat.score'), 1)
                    self.assertEqual(page.locator('#compteurQuestion').inner_text().strip(), '2 / 2')
                    if jeu == 'parcours':
                        self.assertEqual(page.locator('#reponseEcrite').input_value(), '7 500 euros')
                    self.assertLessEqual(page.evaluate('document.documentElement.scrollWidth - innerWidth'), 1)
                    sortie = RACINE / 'test-results' / 'mises-a-jour'
                    sortie.mkdir(parents=True, exist_ok=True)
                    page.screenshot(path=str(sortie / f'{jeu}-mobile.png'), full_page=True)
                finally:
                    contexte.close()


if __name__ == '__main__':
    unittest.main()
