import json
import re
import unittest
from html import unescape
from pathlib import Path

RACINE = Path(__file__).resolve().parents[1]


def texte_cellule(brut: str) -> str:
    sans_balises = re.sub(r'<[^>]+>', '', brut)
    return unescape(sans_balises).strip()


def extraire_sigles_tableau(html: str, debut: str, fin: str) -> list[str]:
    position = html.find(debut)
    if position < 0:
        raise AssertionError(f'Repère introuvable : {debut}')
    extrait = html[position:]
    position_fin = extrait.find(fin)
    if position_fin >= 0:
        extrait = extrait[:position_fin]
    lignes = re.findall(r'<tr>(.*?)</tr>', extrait, flags=re.S | re.I)
    resultat = []
    for ligne in lignes:
        cellules = re.findall(r'<td>(.*?)</td>', ligne, flags=re.S | re.I)
        if cellules:
            resultat.append(texte_cellule(cellules[0]).upper())
    return resultat


class TestMissionSigles(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sigles = json.loads((RACINE / 'donnees' / 'sigles.json').read_text(encoding='utf-8'))

    def test_72_sigles_uniques(self):
        cles = [str(element['sigle']).strip().upper() for element in self.sigles]
        self.assertEqual(len(cles), 72)
        self.assertEqual(len(set(cles)), 72)

    def test_6_etapes_de_12(self):
        repartition = {numero: 0 for numero in range(1, 7)}
        for element in self.sigles:
            repartition[int(element['etape'])] += 1
        self.assertEqual(repartition, {numero: 12 for numero in range(1, 7)})


    def test_72_introductions_contextuelles_avec_sujet(self):
        formulations_interdites = {
            "Quel intitulé complet est correctement formulé ?",
            "Choisis l’appellation complète exacte.",
            "Quelle formulation correspond à l’intitulé complet à retenir ?",
        }
        for element in self.sigles:
            question = str(element.get('questionIntroduction', '')).strip()
            self.assertTrue(question, element['sigle'])
            self.assertNotIn(question, formulations_interdites, element['sigle'])
            sigle = re.escape(str(element['sigle']).upper())
            self.assertIsNone(re.search(rf'(?<![A-Z0-9]){sigle}(?![A-Z0-9])', question.upper()), element['sigle'])
            self.assertNotIn(str(element['signification']).lower(), question.lower(), element['sigle'])
            self.assertGreaterEqual(len(question), 45, element['sigle'])
            self.assertTrue(question.endswith('?'), element['sigle'])
            for autre in self.sigles:
                token = re.escape(str(autre['sigle']))
                self.assertIsNone(re.search(rf'(?<![A-Z0-9]){token}(?![A-Z0-9])', question), (element['sigle'], autre['sigle'], question))

    def test_distracteurs_introduction_rediges_et_uniques(self):
        significations = {str(element['signification']).strip().casefold() for element in self.sigles}
        for element in self.sigles:
            distracteurs = [str(x).strip() for x in element.get('distracteursIntroduction', [])]
            self.assertEqual(len(distracteurs), 3, element['sigle'])
            self.assertEqual(len({x.casefold() for x in distracteurs}), 3, element['sigle'])
            self.assertNotIn(str(element['signification']).strip().casefold(), {x.casefold() for x in distracteurs}, element['sigle'])
            self.assertTrue(all('complémentaire' not in x.casefold() for x in distracteurs), element['sigle'])
            self.assertTrue(all(x.casefold() not in significations for x in distracteurs), element['sigle'])
            contenus = distracteurs + [str(element.get('significationJeu') or element['signification'])]
            for contenu in contenus:
                for autre in self.sigles:
                    if autre['sigle'] == element['sigle']:
                        continue
                    token = re.escape(str(autre['sigle']))
                    self.assertIsNone(re.search(rf'(?<![A-Z0-9]){token}(?![A-Z0-9])', contenu), (element['sigle'], autre['sigle'], contenu))

    def test_support_et_guide_synchronises_sans_doublon(self):
        html_index = (RACINE / 'index.html').read_text(encoding='utf-8')
        support = extraire_sigles_tableau(
            html_index,
            '<section><h3>Sigles essentiels</h3>',
            '</tbody></table></div></section>',
        )

        html_guide = (RACINE / 'sigles-pjj' / 'index.html').read_text(encoding='utf-8')
        sigles_guide = []
        for tbody in re.findall(r'<tbody>(.*?)</tbody>', html_guide, flags=re.S | re.I):
            for ligne in re.findall(r'<tr>(.*?)</tr>', tbody, flags=re.S | re.I):
                cellules = re.findall(r'<td>(.*?)</td>', ligne, flags=re.S | re.I)
                if cellules:
                    sigles_guide.append(texte_cellule(cellules[0]).upper())

        attendu = {str(element['sigle']).upper() for element in self.sigles}
        self.assertEqual(len(support), 72)
        self.assertEqual(len(set(support)), 72)
        self.assertEqual(set(support), attendu)
        self.assertEqual(len(sigles_guide), 72)
        self.assertEqual(len(set(sigles_guide)), 72)
        self.assertEqual(set(sigles_guide), attendu)

    def test_jeu_present_dans_index(self):
        html_index = (RACINE / 'index.html').read_text(encoding='utf-8')
        self.assertIn('id="sigles"', html_index)
        self.assertIn('id="sigles-revision"', html_index)
        self.assertIn('id="contenuErreursSigles"', html_index)
        self.assertIn('id="boutonJeuSigles"', html_index)
        self.assertIn('id="support-jeu-sigles"', html_index)
        self.assertNotIn('id="siglesDecouverte"', html_index)
        self.assertIn('id="siglesFaceDe"', html_index)
        self.assertIn('id="siglesJouerTirage"', html_index)
        self.assertIn('id="siglesParcoursVue"', html_index)
        self.assertNotIn('id="siglesEntrainementVue"', html_index)
        self.assertNotIn('id="siglesSession"', html_index)
        self.assertNotIn('id="siglesBilan"', html_index)
        self.assertIn('id="entrainement"', html_index)
        self.assertIn('id="question"', html_index)


if __name__ == '__main__':
    unittest.main()
