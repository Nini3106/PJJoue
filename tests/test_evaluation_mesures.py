"""Non-régression du seuil conservé par la construction de Mission Mesures."""
import importlib.util
import json
import subprocess
import unittest
from pathlib import Path


RACINE = Path(__file__).resolve().parents[1]

# Exécuter le module assemblé avec Node, sans navigateur ni dépendance ajoutée.
# Seules les interactions avec le DOM, le stockage et les animations sont simulées.
RECETTE_NODE = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const entree = JSON.parse(fs.readFileSync(0, 'utf8'));
const elements = new Map();
let celebration = null, ecran = null, sauvegardes = 0, sessionsEffacees = 0;
const contexte = vm.createContext({
    MESURES_MISSION: {},
    document: { querySelector: () => null },
    sauvegarde: { mesuresJeu: { evaluation: entree.evaluation } },
    etat: {
        mode: 'mesures-evaluation',
        questionsSession: Array.from({length: 30}, (_, id) => ({id})),
        questionsPassees: new Set(Array.from({length: entree.passees}, (_, id) => id)),
        erreursSession: new Set(), score: entree.score, meilleureSerie: entree.score
    },
    clearInterval: () => {},
    selectionner: selecteur => {
        if (!elements.has(selecteur)) elements.set(selecteur, {classList: {add: () => {}}});
        return elements.get(selecteur);
    },
    enregistrerSauvegarde: () => { sauvegardes += 1; },
    afficherErreursBilan: () => {},
    effacerSessionEnCours: () => { sessionsEffacees += 1; },
    afficherEcran: nom => { ecran = nom; },
    lancerCelebrationBilan: valeur => { celebration = valeur; }
});
vm.runInContext(entree.module, contexte, {timeout: 1000});
vm.runInContext('terminerSessionMissionMesuresNative()', contexte, {timeout: 1000});
process.stdout.write(JSON.stringify({
    evaluation: contexte.sauvegarde.mesuresJeu.evaluation,
    score: elements.get('#scoreBilan').textContent,
    resultat: elements.get('#rangBilan').textContent,
    celebration, ecran, sauvegardes, sessionsEffacees
}));
"""


class TestEvaluationMesures(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        chemin = RACINE / 'outils' / 'construire_site.py'
        spec = importlib.util.spec_from_file_location('construction_evaluation_mesures', chemin)
        constructeur = importlib.util.module_from_spec(spec)
        assert spec.loader is not None
        spec.loader.exec_module(constructeur)
        plan = json.loads((RACINE / 'code' / 'plan-construction.json').read_text(encoding='utf-8'))
        partie = next(p for p in plan['javascript'] if p['source'] ==
                      'code/08 - Réviser/Jeu des mesures/actions-de-la-page.js')
        cls.module = constructeur.construire_javascript({'javascript': [partie]})

    def test_construction_conserve_le_seuil_dans_le_moteur_public(self):
        declaration = 'const SEUIL_EVALUATION_MESURES = 90;'
        self.assertEqual(self.module.count(declaration), 1)
        moteur = (RACINE / 'ressources' / 'moteur-jeu.js').read_text(encoding='utf-8')
        self.assertIn(self.module, moteur)
        self.assertEqual(moteur.count(declaration), 1)

    def terminer_evaluation(self, score, passees=0, evaluation=None):
        entree = {
            'module': self.module, 'score': score, 'passees': passees,
            'evaluation': evaluation or {
                'meilleurScore': 0, 'nombreTentatives': 0, 'reussie': False,
            },
        }
        execution = subprocess.run(
            ['node', '-e', RECETTE_NODE], input=json.dumps(entree),
            text=True, capture_output=True, timeout=10, check=False,
        )
        self.assertEqual(execution.returncode, 0, execution.stderr)
        bilan = json.loads(execution.stdout)
        self.assertEqual(bilan['ecran'], 'bilan')
        self.assertEqual(bilan['sauvegardes'], 1)
        self.assertEqual(bilan['sessionsEffacees'], 1)
        return bilan

    def test_seuil_inclusif_et_scores_limites(self):
        for score, pourcentage, reussie in (
            (0, 0, False), (26, 87, False), (27, 90, True),
            (28, 93, True), (30, 100, True),
        ):
            with self.subTest(score=score):
                bilan = self.terminer_evaluation(score)
                self.assertEqual(bilan['score'], f'{pourcentage}%')
                self.assertEqual(bilan['evaluation'], {
                    'meilleurScore': pourcentage, 'nombreTentatives': 1, 'reussie': reussie,
                })
                if reussie:
                    self.assertIn('Mission Mesures est validée.', bilan['resultat'])
                    self.assertEqual(bilan['celebration']['finale'], score == 30)
                else:
                    self.assertIn('Le seuil attendu est de 90 %.', bilan['resultat'])
                    self.assertIsNone(bilan['celebration'])

    def test_question_passee_empeche_la_validation_meme_au_seuil(self):
        bilan = self.terminer_evaluation(27, passees=1)
        self.assertFalse(bilan['evaluation']['reussie'])
        self.assertEqual(bilan['evaluation']['meilleurScore'], 90)
        self.assertIsNone(bilan['celebration'])

    def test_echec_ulterieur_conserve_la_reussite_et_le_meilleur_score(self):
        premier_bilan = self.terminer_evaluation(30)
        bilan = self.terminer_evaluation(26, evaluation=premier_bilan['evaluation'])
        self.assertEqual(bilan['evaluation'], {
            'meilleurScore': 100, 'nombreTentatives': 2, 'reussie': True,
        })
        self.assertIn('Le seuil attendu est de 90 %.', bilan['resultat'])
        self.assertIsNone(bilan['celebration'])


if __name__ == '__main__':
    unittest.main()
