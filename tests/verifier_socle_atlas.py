#!/usr/bin/env python3
"""Socle automatique courant. Les assertions visuelles de l'ancien thème bleu
restent archivées ; elles ne définissent pas la recette du nouveau thème Atlas.
Les tests d'intégration nécessitant un navigateur HTTP restent séparés.
"""
import sys
from pathlib import Path
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
MODULES=[
 'test_validation_donnees','test_construction_portable','test_sigles_jeu',
 'test_mesures_jeu','test_guides_cjpm','test_seo_routes','test_atlas_integrite',
 'test_audit_juridique_mesures','test_charte_questions','test_controles_prepublication'
]
if __name__=='__main__':
    resultat=unittest.TextTestRunner(verbosity=1).run(unittest.defaultTestLoader.loadTestsFromNames(MODULES))
    raise SystemExit(0 if resultat.wasSuccessful() else 1)
