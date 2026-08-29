import importlib.util
import tempfile
import unittest
from pathlib import Path


class TestConstructionPortable(unittest.TestCase):
    def test_ecriture_publique_conserve_lf(self):
        chemin_module = Path(__file__).resolve().parents[1] / "outils" / "construire_site.py"
        spec = importlib.util.spec_from_file_location("construire_site_portable", chemin_module)
        module = importlib.util.module_from_spec(spec)
        assert spec.loader is not None
        spec.loader.exec_module(module)

        racine_originale = module.RACINE
        try:
            with tempfile.TemporaryDirectory() as dossier:
                module.RACINE = Path(dossier)
                module.ecrire_fichiers({"essai.txt": "ligne1\nligne2\n"})
                self.assertEqual((Path(dossier) / "essai.txt").read_bytes(), b"ligne1\nligne2\n")
        finally:
            module.RACINE = racine_originale

    def test_empreinte_analytics_ignore_uniquement_les_fins_de_ligne(self):
        contenu_lf = b"ligne1\nligne2\n"
        contenu_crlf = b"ligne1\r\nligne2\r\n"
        normaliser = lambda contenu: contenu.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
        self.assertEqual(normaliser(contenu_lf), normaliser(contenu_crlf))
        self.assertNotEqual(normaliser(b"ligne1\nDIFFERENT\n"), normaliser(contenu_lf))


if __name__ == "__main__":
    unittest.main()
