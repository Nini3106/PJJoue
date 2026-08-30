#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import unittest

RACINE = Path(__file__).resolve().parents[1]


def charger_module(nom: str, chemin: Path):
    spec = importlib.util.spec_from_file_location(nom, chemin)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Impossible de charger {chemin}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


CONSTRUCTION = charger_module("construire_site_routes", RACINE / "outils" / "construire_site.py")
SEO = charger_module("construire_seo_routes", RACINE / "outils" / "construire_seo.py")


class TestSeoEtRoutesPropres(unittest.TestCase):
    def test_accueil_et_routes_production_sans_fragment(self):
        routes = json.loads((RACINE / "code" / "routes-application.json").read_text(encoding="utf-8"))
        self.assertEqual(routes["accueil"], "")
        for ecran, route in routes.items():
            self.assertNotIn("#", route, ecran)
            self.assertNotIn("?", route, ecran)
            self.assertFalse(route.startswith("/"), ecran)
            self.assertFalse(route.endswith("/"), ecran)

    def test_relais_github_pages_sont_noindex_et_transmettent_la_route(self):
        relais = CONSTRUCTION.construire_relais_routes()
        routes = json.loads((RACINE / "code" / "routes-application.json").read_text(encoding="utf-8"))
        programme = json.loads((RACINE / "donnees" / "programme.json").read_text(encoding="utf-8"))
        attendus = {f"{route}/index.html" for route in routes.values() if route}
        attendus.update(f"parcours/{theme}/index.html" for theme in programme)
        self.assertEqual(set(relais), attendus)
        for chemin, contenu in relais.items():
            self.assertIn('name="robots" content="noindex,follow"', contenu, chemin)
            self.assertIn('rel="canonical" href="https://pjjoue.fr/"', contenu, chemin)
            self.assertIn("pjjoue_route=", contenu, chemin)

    def test_relais_routes_restent_utilisables_en_ouverture_locale(self):
        relais = CONSTRUCTION.construire_relais_routes()
        cas = {
            "parametres/index.html": "index.html?pjjoue_route=parametres",
            "revision/index.html": "index.html?pjjoue_route=revision",
            "mission-sigles/index.html": "index.html?pjjoue_route=mission-sigles",
            "mission-sigles/revision/index.html": "index.html?pjjoue_route=mission-sigles%2Frevision",
            "resultats/index.html": "index.html?pjjoue_route=resultats",
            "parcours/commun/index.html": "index.html?pjjoue_route=parcours%2Fcommun",
        }
        for chemin, destination_locale in cas.items():
            contenu = relais[chemin]
            self.assertIn('location.protocol==="file:"', contenu, chemin)
            self.assertIn(destination_locale, contenu, chemin)

    def test_sitemap_ne_contient_que_les_pages_indexables_configurees(self):
        config = json.loads((RACINE / "code" / "seo-pages.json").read_text(encoding="utf-8"))
        urls = [page["url"] for page in config["pages"]]
        self.assertTrue(all("#" not in url and "?" not in url for url in urls))
        sitemap = SEO.construire_sitemap([(url, "2026-08-30") for url in urls]).decode("utf-8")
        routes = json.loads((RACINE / "code" / "routes-application.json").read_text(encoding="utf-8"))
        for route in routes.values():
            if route:
                self.assertNotIn(f"https://pjjoue.fr/{route}/</loc>", sitemap)

    def test_navigation_http_et_file_reste_explicitement_separee(self):
        source = (RACINE / "code" / "01 - Éléments communs" / "JavaScript - Navigation et fenêtres.js").read_text(encoding="utf-8")
        navigation_locale = (RACINE / "code" / "01 - Éléments communs" / "Navigation" / "navigation-locale.js").read_text(encoding="utf-8")
        self.assertIn("window.location.protocol === 'file:'", source)
        self.assertIn("routeLocalePourEcran", source)
        self.assertIn("ROUTES_APPLICATION_PROPRES", source)
        self.assertIn("history[methode]", source)
        self.assertIn("pjjoue_route", source)
        self.assertIn("index.html?pjjoue_route=", navigation_locale)
        self.assertNotRegex(navigation_locale, r"index\.html#[a-z]")
        self.assertNotRegex(source, r"routeLocalePourEcran[^}]+return\s+['\"]#")

    def test_hors_connexion_relaie_une_route_propre_vers_la_racine(self):
        source = (RACINE / "code" / "01 - Éléments communs" / "Application installable et hors connexion" / "service-worker.js").read_text(encoding="utf-8")
        self.assertIn("destination.searchParams.set('pjjoue_route', cheminRoute)", source)
        self.assertIn("Response.redirect(destination.href, 302)", source)

    def test_archive_officielle_verifie_aussi_le_seo(self):
        source = (RACINE / "outils" / "creer_archive_utf8.py").read_text(encoding="utf-8")
        self.assertIn("executer('outils/construire_seo.py', '--verifier')", source)


if __name__ == "__main__":
    unittest.main()
