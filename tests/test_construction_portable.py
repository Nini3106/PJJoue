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

    def test_empreinte_cache_normalise_les_svg_windows_linux(self):
        chemin_module = Path(__file__).resolve().parents[1] / "outils" / "construire_site.py"
        spec = importlib.util.spec_from_file_location("construire_site_cache_portable", chemin_module)
        module = importlib.util.module_from_spec(spec)
        assert spec.loader is not None
        spec.loader.exec_module(module)

        with tempfile.TemporaryDirectory() as dossier:
            svg = Path(dossier) / "icone.svg"
            svg.write_bytes(b"<svg>\n<path/>\n</svg>\n")
            empreinte_lf = module.lire_octets_stables_pour_empreinte(svg)
            svg.write_bytes(b"<svg>\r\n<path/>\r\n</svg>\r\n")
            empreinte_crlf = module.lire_octets_stables_pour_empreinte(svg)
            self.assertEqual(empreinte_lf, empreinte_crlf)

    def test_empreinte_analytics_ignore_uniquement_les_fins_de_ligne(self):
        contenu_lf = b"ligne1\nligne2\n"
        contenu_crlf = b"ligne1\r\nligne2\r\n"
        normaliser = lambda contenu: contenu.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
        self.assertEqual(normaliser(contenu_lf), normaliser(contenu_crlf))
        self.assertNotEqual(normaliser(b"ligne1\nDIFFERENT\n"), normaliser(contenu_lf))

    def test_manifeste_normalise_les_fins_de_ligne(self):
        chemin_module = Path(__file__).resolve().parents[1] / "outils" / "construire_manifeste.py"
        spec = importlib.util.spec_from_file_location("construire_manifeste_portable", chemin_module)
        module = importlib.util.module_from_spec(spec)
        assert spec.loader is not None
        spec.loader.exec_module(module)

        with tempfile.TemporaryDirectory() as dossier:
            fichier = Path(dossier) / "exemple.svg"
            fichier.write_bytes(b"<svg>\n<path/>\n</svg>\n")
            lf = module.decrire_fichier(fichier)
            fichier.write_bytes(b"<svg>\r\n<path/>\r\n</svg>\r\n")
            crlf = module.decrire_fichier(fichier)
            self.assertEqual(lf, crlf)

    def test_manifeste_normalise_les_fichiers_sans_extension_connus(self):
        chemin_module = Path(__file__).resolve().parents[1] / "outils" / "construire_manifeste.py"
        spec = importlib.util.spec_from_file_location("construire_manifeste_cname", chemin_module)
        module = importlib.util.module_from_spec(spec)
        assert spec.loader is not None
        spec.loader.exec_module(module)

        with tempfile.TemporaryDirectory() as dossier:
            fichier = Path(dossier) / "CNAME"
            fichier.write_bytes(b"pjjoue.fr\n")
            lf = module.decrire_fichier(fichier)
            fichier.write_bytes(b"pjjoue.fr\r\n")
            crlf = module.decrire_fichier(fichier)
            self.assertEqual(lf, crlf)


if __name__ == "__main__":
    unittest.main()
