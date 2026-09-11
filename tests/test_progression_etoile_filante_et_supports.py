from __future__ import annotations

import json
import re
import unittest
from pathlib import Path

RACINE = Path(__file__).resolve().parents[1]
CODE = RACINE / "code"


class ProgressionEtoileFilanteEtSupportsTests(unittest.TestCase):
    def test_etoile_filante_represente_bien_une_etoile_avec_trainees(self) -> None:
        actions = (CODE / "03 - Parcours PJJ/actions-de-la-page.js").read_text(encoding="utf-8")
        css = (CODE / "01 - Éléments communs/style-des-six-parcours.css").read_text(encoding="utf-8")
        self.assertIn('class="etoile-filante-trainee etoile-filante-trainee-haute"', actions)
        self.assertIn('class="etoile-filante-trainee etoile-filante-trainee-basse"', actions)
        self.assertIn('class="etoile-filante-astre"', actions)
        self.assertIn(".etoile-filante-trainee {", css)
        self.assertIn(".etoile-filante-astre {", css)

    def test_compteur_parcours_additionne_etapes_et_evaluation(self) -> None:
        actions = (CODE / "03 - Parcours PJJ/actions-de-la-page.js").read_text(encoding="utf-8")
        self.assertIn("const jalonsMaitrises = maitrisees + (evaluationReussie ? 1 : 0);", actions)
        self.assertIn("const totalJalons = total + 1;", actions)
        self.assertIn("creerEtoileFilanteProgression(progression.jalonsMaitrises)", actions)
        self.assertIn("evaluation.insertAdjacentHTML('afterbegin', creerEtoileFilanteProgression());", actions)
        self.assertRegex(actions, re.compile(r"etapeValideeEnAutonomie \? creerEtoileFilanteProgression\(\) : ''"))

    def test_parcours_n_est_termine_qu_apres_evaluation(self) -> None:
        actions = (CODE / "03 - Parcours PJJ/actions-de-la-page.js").read_text(encoding="utf-8")
        self.assertIn("const statut = progression.evaluationReussie", actions)
        self.assertIn("? 'Terminé'", actions)
        self.assertIn("? 'Évaluation à passer'", actions)

    def test_regle_etoile_filante_est_dans_le_manifeste(self) -> None:
        manifeste = json.loads((RACINE / "MANIFESTE.json").read_text(encoding="utf-8"))
        regle = manifeste.get("reglesVisuelles", {}).get("etoileFilanteMaitriseSansJoker", {})
        self.assertTrue(regle.get("obligatoire"))
        self.assertIn("traînée visible", regle.get("principe", ""))
        self.assertIn("1 à 12", regle.get("comptage", ""))

    def test_supports_contiennent_mission_mesures_et_recherche_pluriel_singulier(self) -> None:
        contenu = (CODE / "08 - Réviser/contenu.html").read_text(encoding="utf-8")
        actions = (CODE / "08 - Réviser/actions-de-la-page.js").read_text(encoding="utf-8")
        self.assertIn('id="support-jeu-mesures"', contenu)
        self.assertIn("Mission Mesures", contenu)
        self.assertIn("obtenirVariantesTermeRechercheSupport", actions)
        self.assertIn("variantes.add(terme.slice(0, -1));", actions)
        self.assertIn("variantes.add(`${terme}s`);", actions)
        self.assertIn("calculerPrioriteRechercheSupport", actions)

    def test_cartes_mini_jeux_supports_sont_alignees_a_gauche(self) -> None:
        css = (CODE / "08 - Réviser/style-reviser-et-supports.css").read_text(encoding="utf-8")
        self.assertRegex(css, re.compile(r"#supports \.support-ressource-guide \.support-revision-titre \{[^}]*justify-items:start;[^}]*text-align:left;", re.S))
        self.assertRegex(css, re.compile(r"#supports \.support-ressource-guide \.support-revision-type \{[^}]*justify-self:start;[^}]*text-align:left;", re.S))


if __name__ == "__main__":
    unittest.main()
