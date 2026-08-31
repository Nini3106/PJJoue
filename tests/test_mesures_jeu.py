import difflib
import json
import re
import unittest
from pathlib import Path

RACINE = Path(__file__).resolve().parents[1]


class TestMissionMesures(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.donnees = json.loads((RACINE / 'donnees' / 'mesures.json').read_text(encoding='utf-8'))
        cls.reperes = cls.donnees['reperes']
        cls.etapes = cls.donnees['etapes']
        cls.evaluation = cls.donnees['evaluation']
        cls.sources = json.loads((RACINE / 'donnees' / 'sources.json').read_text(encoding='utf-8'))

    def test_structure_chronologique_complete(self):
        self.assertEqual(len(self.etapes), 12)
        self.assertEqual([e['numero'] for e in self.etapes], list(range(1, 13)))
        self.assertGreaterEqual(len(self.reperes), 100)
        for numero in range(1, 13):
            self.assertTrue(any(r['etape'] == numero for r in self.reperes), numero)
        titres = ' '.join(e['titre'].lower() for e in self.etapes)
        for notion in ['avant', 'culpabilité', 'sanction', 'après']:
            self.assertIn(notion, titres)

    def test_cles_repere_et_evaluation_uniques(self):
        cles = [r['cle'] for r in self.reperes]
        self.assertEqual(len(cles), len(set(cles)))
        ids = [q['id'] for q in self.evaluation]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertGreaterEqual(len(self.evaluation), 30)

    def test_questions_completes_et_distracteurs_non_dupliques(self):
        for repere in self.reperes:
            for suffixe in ('Introduction', 'Rappel'):
                question = str(repere[f'question{suffixe}']).strip()
                bonne = str(repere[f'bonneReponse{suffixe}']).strip()
                distracteurs = [str(x).strip() for x in repere[f'distracteurs{suffixe}']]
                self.assertTrue(question.endswith('?'), (repere['cle'], suffixe, question))
                self.assertEqual(len(distracteurs), 3, repere['cle'])
                self.assertEqual(len({x.casefold() for x in distracteurs}), 3, repere['cle'])
                self.assertNotIn(bonne.casefold(), {x.casefold() for x in distracteurs}, repere['cle'])
                longueurs = [len(bonne), *map(len, distracteurs)]
                # Contrôle de signal grossier : aucune réponse ne doit devenir une balise évidente par sa taille.
                self.assertLessEqual(max(longueurs), max(35, min(longueurs) * 2.8), (repere['cle'], suffixe, longueurs))

    def test_premiere_question_du_repere_developpe_son_sigle(self):
        for repere in self.reperes:
            sigle = str(repere.get('sigle') or '').strip()
            developpement = str(repere.get('developpement') or '').strip()
            if not sigle:
                continue
            self.assertTrue(developpement, repere['cle'])
            question = repere['questionIntroduction']
            self.assertIn(sigle, question, repere['cle'])
            self.assertIn(developpement.casefold(), question.casefold(), repere['cle'])
            # Le rappel peut employer le sigle seul, mais seulement après cette introduction dans le parcours généré.
            self.assertTrue(repere['questionRappel'])

    def test_sources_officielles_referencees_existent(self):
        for element in [*self.reperes, *self.evaluation]:
            refs = element.get('source')
            refs = refs if isinstance(refs, list) else [refs]
            for ref in filter(None, refs):
                self.assertIn(ref, self.sources, (element.get('cle') or element.get('id'), ref))
                self.assertIn('legifrance.gouv.fr', self.sources[ref]['url'], ref)

    def test_evaluation_est_distincte_des_questions_apprentissage(self):
        apprentissage = {
            re.sub(r'\s+', ' ', r[k]).strip().casefold()
            for r in self.reperes for k in ('questionIntroduction', 'questionRappel')
        }
        for question in self.evaluation:
            self.assertNotIn(re.sub(r'\s+', ' ', question['question']).strip().casefold(), apprentissage, question['id'])
            self.assertNotIn('indice', question)

    def test_evaluation_ne_reformule_pas_trop_pres_les_questions_apprentissage(self):
        def normaliser(texte):
            texte = texte.casefold()
            texte = re.sub(r'[^a-z0-9à-ÿ ]', ' ', texte)
            return re.sub(r'\s+', ' ', texte).strip()

        apprentissage = [
            (r['cle'], k, normaliser(r[k]))
            for r in self.reperes
            for k in ('questionIntroduction', 'questionRappel')
        ]
        for question in self.evaluation:
            evaluation = normaliser(question['question'])
            score_max = max(
                difflib.SequenceMatcher(None, evaluation, texte).ratio()
                for _, _, texte in apprentissage
            )
            self.assertLess(
                score_max,
                0.60,
                (question['id'], round(score_max, 3), 'Évaluation trop proche d’une formulation d’apprentissage'),
            )

    def test_evaluation_ne_recycle_pas_un_bloc_de_scenario_apprentissage(self):
        def mots(texte):
            return re.findall(r'[a-z0-9à-ÿ]+', texte.casefold())

        def groupes_quatre(texte):
            tokens = mots(texte)
            return {tuple(tokens[i:i + 4]) for i in range(max(0, len(tokens) - 3))}

        apprentissage = [
            (r['cle'], k, groupes_quatre(r[k]))
            for r in self.reperes
            for k in ('questionIntroduction', 'questionRappel')
        ]
        for question in self.evaluation:
            groupes_eval = groupes_quatre(question['question'])
            score_max = 0.0
            source_plus_proche = None
            for cle, type_question, groupes_apprentissage in apprentissage:
                if not groupes_eval or not groupes_apprentissage:
                    continue
                union = groupes_eval | groupes_apprentissage
                score = len(groupes_eval & groupes_apprentissage) / len(union) if union else 0.0
                if score > score_max:
                    score_max = score
                    source_plus_proche = (cle, type_question)
            self.assertLess(
                score_max,
                0.20,
                (
                    question['id'],
                    round(score_max, 3),
                    source_plus_proche,
                    'Évaluation trop proche d’un scénario déjà travaillé',
                ),
            )

    def test_integration_interface_et_routes(self):
        html = (RACINE / 'index.html').read_text(encoding='utf-8')
        self.assertIn('id="mesures"', html)
        self.assertIn('id="support-jeu-mesures"', html)
        self.assertIn('id="mesures-revision"', html)
        self.assertIn('id="boutonJeuMesures"', html)
        self.assertIn('id="mesuresFaceDe"', html)
        self.assertIn('id="mesuresEtapes"', html)
        routes = json.loads((RACINE / 'code' / 'routes-application.json').read_text(encoding='utf-8'))
        self.assertEqual(routes['mesures'], 'mission-mesures')
        self.assertEqual(routes['mesures-revision'], 'mission-mesures/revision')

    def test_moteur_interdit_rappel_avant_introduction(self):
        js = (RACINE / 'code' / '08 - Réviser' / 'Jeu des mesures' / 'actions-de-la-page.js').read_text(encoding='utf-8')
        self.assertIn("if (!repereMesureEstIntroduit(cible.cle)) questions.push(creerQuestionChoixMesure(cible, 'Introduction', siglesVus));", js)
        self.assertIn("questions.push(creerQuestionChoixMesure(cible, 'Rappel', siglesVus));", js)
        self.assertIn('texteAvecSiglesDeveloppesSiNecessaire', js)
        self.assertIn('creerQuestionEcriteSigleMesure', js)


if __name__ == '__main__':
    unittest.main()
