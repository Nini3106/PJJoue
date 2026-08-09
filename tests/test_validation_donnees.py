#!/usr/bin/env python3
"""Tests unitaires de la validation des données canoniques de PJJoue."""

from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path
import unittest

from outils.validation_donnees import valider_donnees


RACINE = Path(__file__).resolve().parents[1]


def lire_json(chemin: str):
    return json.loads((RACINE / chemin).read_text(encoding="utf-8"))


class ValidationDonneesTest(unittest.TestCase):
    """Vérifie les relations que les simples types JSON ne protègent pas."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.programme = lire_json("donnees/programme.json")
        cls.sources = lire_json("donnees/sources.json")
        cls.questions = lire_json("donnees/questions.json")

    def erreurs_apres_modification(self, modifier) -> list[str]:
        questions = deepcopy(self.questions)
        modifier(questions)
        return valider_donnees(self.programme, self.sources, questions)

    def test_banque_actuelle_valide(self) -> None:
        self.assertEqual(
            valider_donnees(self.programme, self.sources, self.questions),
            [],
        )

    def test_reponse_multiple_inconnue_refusee(self) -> None:
        erreurs = self.erreurs_apres_modification(
            lambda questions: questions[1]["activite"]["reponses"].append("inconnue")
        )
        self.assertTrue(any("proposition inconnue" in erreur for erreur in erreurs))

    def test_ordre_incomplet_refuse(self) -> None:
        erreurs = self.erreurs_apres_modification(
            lambda questions: questions[4]["activite"]["ordre"].pop()
        )
        self.assertTrue(any("permutation" in erreur for erreur in erreurs))

    def test_association_orpheline_refusee(self) -> None:
        erreurs = self.erreurs_apres_modification(
            lambda questions: questions[2]["activite"]["associations"].pop("q3l0")
        )
        self.assertTrue(any("chaque élément de gauche" in erreur for erreur in erreurs))

    def test_categorie_inconnue_refusee(self) -> None:
        erreurs = self.erreurs_apres_modification(
            lambda questions: questions[6]["activite"]["classements"].update(
                {"q7i0": "categorie_inconnue"}
            )
        )
        self.assertTrue(any("catégorie inconnue" in erreur for erreur in erreurs))

    def test_source_inconnue_refusee(self) -> None:
        erreurs = self.erreurs_apres_modification(
            lambda questions: questions[0].update({"source": "SOURCE_INCONNUE"})
        )
        self.assertTrue(any("source inconnue" in erreur for erreur in erreurs))

    def test_phrase_eclatee_en_caracteres_refusee(self) -> None:
        erreurs = self.erreurs_apres_modification(
            lambda questions: questions[25].update({"faitsCorrects": list("Une phrase éclatée")})
        )
        self.assertTrue(any("caractère par caractère" in erreur for erreur in erreurs))


if __name__ == "__main__":
    unittest.main()
