"""Vérifie le parcours de lecture, les destinations et le consentement des guides."""
from html.parser import HTMLParser
import json
import re
from pathlib import Path
import subprocess
import unittest
from urllib.parse import urljoin, urlparse

RACINE = Path(__file__).resolve().parents[1]
PARCOURS = {
    "cjpm-enquete-sanction": "procedure_ordinaire",
    "cjpm-information-judiciaire": "information_judiciaire",
    "cjpm-jugement-sanction-educative": "jugement_educatif_ordinaire",
    "cjpm-matiere-criminelle-peines": "matiere_criminelle_peines",
    "cjpm-application-execution": "application_execution_peines",
}


class LiensHTML(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.liens = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attributs = dict(attrs)
        if tag == "a" and "href" in attributs:
            self.liens.append(attributs)


class GuidesCJPMTests(unittest.TestCase):
    def test_accueil_propose_les_cinq_guides_avant_la_pjj(self):
        liens = LiensHTML((RACINE / "guides/index.html").read_text()).liens
        cartes = [l["href"] for l in liens if "guide-carte-lien" in l.get("class", "").split()]
        self.assertEqual(cartes[:5], [f"../{route}/" for route in PARCOURS])
        self.assertEqual(cartes[5:7], ["../mesures-educatives-pjj/", "../sigles-cjpm/"])
        self.assertEqual(cartes[-1], "../sigles-pjj/")
        page = (RACINE / "guides/index.html").read_text()
        collections = re.findall(r'<section class="guides-collection".*?</section>', page, re.S)
        self.assertEqual(len(collections), 2)
        self.assertNotIn("Prendre ses repères", page)
        self.assertIn("../sigles-cjpm/", collections[0])
        self.assertNotIn("../sigles-pjj/", collections[0])
        self.assertIn("../sigles-pjj/", collections[1])
        self.assertNotIn("../mesures-educatives-pjj/", collections[1])

    def test_chaque_guide_mene_au_bon_parcours_et_a_des_pages_existantes(self):
        sitemap = (RACINE / "sitemap.xml").read_text()
        for route, parcours in PARCOURS.items():
            with self.subTest(route=route):
                page = (RACINE / route / "index.html").read_text()
                liens = LiensHTML(page).liens
                actions = [l["href"] for l in liens if "guide-bouton-parcours" in l.get("class", "").split()]
                self.assertEqual(actions, [f"../parcours/{parcours}/"])
                self.assertIn(f"<loc>https://pjjoue.fr/{route}/</loc>", sitemap)
                self.assertIn("Exemple fictif", page)
                self.assertIn("ne constitue ni une consultation juridique", page)
                officiels = {l["href"] for l in liens if urlparse(l["href"]).hostname == "www.legifrance.gouv.fr"}
                self.assertGreaterEqual(len(officiels), 4)
                for lien in liens:
                    adresse = urlparse(urljoin(f"https://pjjoue.fr/{route}/", lien["href"]))
                    if adresse.hostname != "pjjoue.fr":
                        continue
                    chemin = adresse.path.lstrip("/")
                    if adresse.path.endswith("/"):
                        chemin += "index.html"
                    self.assertTrue((RACINE / chemin).is_file(), f"Lien interne absent : {adresse.path}")

    def test_nouveaux_guides_mesures_une_fois_et_seulement_apres_consentement(self):
        programme = r'''
const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const code = fs.readFileSync('ressources/analytics-pages-pjjoue.js', 'utf8');
const routes = JSON.parse(process.argv[1]);
for (const route of routes) {
    let autorise = false;
    const envois = [];
    const ecouteurs = {};
    const contexte = {
        location: {pathname: '/' + route + '/', protocol: 'https:', origin: 'https://pjjoue.fr'},
        document: {readyState: 'complete', referrer: 'https://pjjoue.fr/guides/'},
        URL,
        window: {
            PJJConsentement: {estAutorise: () => autorise},
            PJJ_ANALYTICS: {envoyer: (...args) => envois.push(args)},
            addEventListener: (nom, rappel) => { ecouteurs[nom] = rappel; }
        }
    };
    vm.runInNewContext(code, contexte);
    assert.equal(envois.length, 0, route + ' : envoi avant accord');
    ecouteurs['pjjoue:consentement-change']({detail: {analytics: false}});
    assert.equal(envois.length, 0, route + ' : envoi après refus');
    autorise = true;
    ecouteurs['pjjoue:consentement-change']({detail: {analytics: true}});
    ecouteurs['pjjoue:consentement-change']({detail: {analytics: true}});
    assert.equal(envois.length, 1, route + ' : nombre d’envois');
    assert.equal(envois[0][0], 'page_consultee');
    assert.equal(envois[0][1].pjjoue_page_consultee, 'Guides');
    assert.equal(envois[0][1].pjjoue_page_precedente, 'Guides');
    assert.ok(envois[0][1].pjjoue_nom_guide.length > 10);
}
'''
        resultat = subprocess.run(["node", "-e", programme, json.dumps([*PARCOURS, "sigles-cjpm", "sigles-pjj", "mesures-educatives-pjj"])], cwd=RACINE, capture_output=True, text=True)
        self.assertEqual(resultat.returncode, 0, resultat.stderr)


if __name__ == "__main__":
    unittest.main()
