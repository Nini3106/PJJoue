from __future__ import annotations

import re
import unittest
from pathlib import Path

RACINE = Path(__file__).resolve().parents[1]
CODE = RACINE / "code"


class CouleursQuestionsEtCorrectionTests(unittest.TestCase):
    def test_question_utilise_la_couleur_canonique_de_chaque_etape(self) -> None:
        js = (CODE / "06 - Question/actions/05 - Préparer et afficher la question.js").read_text(encoding="utf-8")
        self.assertIn(
            "couleurEtape = etapeProgramme?.couleur || obtenirCouleurTitreEtape(question?.etape);",
            js,
        )
        self.assertIn("--couleur-etape-active", js)
        self.assertIn("--couleur-etape-active-lisible", js)
        self.assertIn("IDENTITE_PARCOURS_MINI_JEUX", js)
        self.assertIn("appliquerIdentiteParcoursQuestion(question);", js)

    def test_tous_les_modes_reprennent_la_couleur_de_l_etape(self) -> None:
        css = (CODE / "06 - Question/style-de-la-page.css").read_text(encoding="utf-8")
        attendus = [
            "#question #zoneReponses .reponse.selectionne",
            "#question .multiple-choix.selectionne",
            "#question .elimination-choix.elimine",
            "#question .association-colonne button.associe",
            "#question .classement-element button.selectionne",
            "#question .association-lignes .fil-association",
            "#question .ordre-choix-selectionne > li:not(.ordre-verrouille)",
            "#question .ecrite-zone input:focus",
        ]
        for selecteur in attendus:
            self.assertIn(selecteur, css)
        self.assertRegex(
            css,
            re.compile(
                r"#question \.association-lignes \.fil-association \{[^}]*stroke:\s*var\(--couleur-etape-active\);",
                re.S,
            ),
        )

    def test_correction_eliminer_reste_alignee_et_lisible(self) -> None:
        css = (CODE / "06 - Question/style-de-la-page.css").read_text(encoding="utf-8")
        self.assertRegex(
            css,
            re.compile(
                r"#question \.detaillee-correction-ligne\.ligne-eliminee \{[^}]*grid-template-columns:\s*24px minmax\(0,1fr\);",
                re.S,
            ),
        )
        self.assertIn("word-break: normal;", css)

    def test_etoile_compteur_est_plus_grande_sans_changer_etoile_etape(self) -> None:
        css = (CODE / "01 - Éléments communs/style-des-six-parcours.css").read_text(encoding="utf-8")
        self.assertRegex(
            css,
            re.compile(
                r"#parcours \.etoile-filante-progression \{[^}]*width:58px;[^}]*height:36px;",
                re.S,
            ),
        )
        self.assertRegex(
            css,
            re.compile(
                r"#parcours \.etoile-filante-progression-compteur \{[^}]*width:88px;[^}]*height:54px;",
                re.S,
            ),
        )
        self.assertIn("min-width:26px;", css)
        self.assertIn("white-space:nowrap;", css)


if __name__ == "__main__":
    unittest.main()
