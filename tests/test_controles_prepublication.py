#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import os
import sys
from pathlib import Path
import unittest

RACINE = Path(__file__).resolve().parents[1]


def charger_module(nom: str, chemin: Path):
    spec = importlib.util.spec_from_file_location(nom, chemin)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Impossible de charger {chemin}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[nom] = module
    spec.loader.exec_module(module)
    return module


LIENS = charger_module("verifier_liens_officiels", RACINE / "outils" / "verifier_liens_officiels.py")
VISUEL = charger_module("verifier_regression_visuelle", RACINE / "tests" / "verifier_regression_visuelle.py")


class ControleLiensOfficiels(unittest.TestCase):
    def test_erreurs_reseau_non_bloquantes(self):
        self.assertEqual(LIENS.classer_resultat(("x", "https://exemple.fr", None, "SSL")), "manuel")
        self.assertEqual(LIENS.classer_resultat(("x", "https://exemple.fr", 403, "anti-bot")), "manuel")
        self.assertEqual(LIENS.classer_resultat(("x", "https://exemple.fr", 429, "quota")), "manuel")
        self.assertEqual(LIENS.classer_resultat(("x", "https://exemple.fr", 500, "serveur")), "manuel")
        self.assertEqual(LIENS.classer_resultat(("x", "https://exemple.fr", 503, "maintenance")), "manuel")

    def test_reponse_normale_reste_valide(self):
        self.assertEqual(LIENS.classer_resultat(("x", "https://exemple.fr", 200, "ok")), "ok")

    def test_liens_morts_confirmes_bloquants(self):
        self.assertEqual(LIENS.classer_resultat(("x", "https://exemple.fr", 404, "absent")), "echec")
        self.assertEqual(LIENS.classer_resultat(("x", "https://exemple.fr", 410, "retire")), "echec")
        self.assertEqual(LIENS.classer_resultat(("x", "", None, "invalide")), "echec")


class ControleVisuelPortable(unittest.TestCase):
    def test_pixel_exact_est_opt_in_sur_toutes_les_plateformes(self):
        ancienne = os.environ.pop("PJJOUE_COMPARAISON_PIXELS_EXACTE", None)
        try:
            self.assertFalse(VISUEL.comparaison_pixel_exacte_active("Linux"))
            self.assertFalse(VISUEL.comparaison_pixel_exacte_active("Windows"))
        finally:
            if ancienne is not None:
                os.environ["PJJOUE_COMPARAISON_PIXELS_EXACTE"] = ancienne

    def test_environnement_reference_visuelle_est_documente(self):
        reference = VISUEL.lire_environnement_reference()
        self.assertEqual(reference.get("systeme"), "Linux")
        self.assertIsInstance(reference.get("chromiumMajeur"), int)
        self.assertGreater(reference.get("chromiumMajeur", 0), 0)

    def test_hauteurs_cartes_windows_ne_sont_pas_comparees_aux_pixels_linux(self):
        # Régression observée sous Chromium/Windows : les six cartes mesurent
        # 260.28125 px avec le même HTML/CSS que la référence Linux.
        hauteurs = [260.28125] * 6
        self.assertTrue(all(245 <= hauteur <= 315 for hauteur in hauteurs))
        self.assertLessEqual(max(hauteurs) - min(hauteurs), 45)

    def test_forcage_pixel_exact(self):
        ancienne = os.environ.get("PJJOUE_COMPARAISON_PIXELS_EXACTE")
        os.environ["PJJOUE_COMPARAISON_PIXELS_EXACTE"] = "1"
        try:
            self.assertTrue(VISUEL.comparaison_pixel_exacte_active("Windows"))
        finally:
            if ancienne is None:
                os.environ.pop("PJJOUE_COMPARAISON_PIXELS_EXACTE", None)
            else:
                os.environ["PJJOUE_COMPARAISON_PIXELS_EXACTE"] = ancienne


if __name__ == "__main__":
    unittest.main()
