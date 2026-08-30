#!/usr/bin/env python3
"""Construit et vérifie les éléments SEO publics de PJJoue V1."""
from __future__ import annotations

import argparse
from datetime import date
from html import unescape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urlparse

RACINE = Path(__file__).resolve().parents[1]
CONFIG = RACINE / "code" / "seo-pages.json"
PLAN = RACINE / "code" / "plan-construction.json"
ROUTES = RACINE / "code" / "routes-application.json"
PROGRAMME = RACINE / "donnees" / "programme.json"
SITEMAP = RACINE / "sitemap.xml"
ROBOTS = RACINE / "robots.txt"


class AnalyseHTML(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.titres: list[str] = []
        self._dans_title = False
        self._title_fragments: list[str] = []
        self.meta: list[dict[str, str]] = []
        self.links: list[dict[str, str]] = []
        self.h1 = 0
        self.jsonld: list[str] = []
        self._dans_jsonld = False
        self._jsonld_fragments: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributs = {nom.lower(): (valeur or "") for nom, valeur in attrs}
        tag = tag.lower()
        if tag == "title":
            self._dans_title = True
            self._title_fragments = []
        elif tag == "meta":
            self.meta.append(attributs)
        elif tag == "link":
            self.links.append(attributs)
        elif tag == "h1":
            self.h1 += 1
        elif tag == "script" and attributs.get("type", "").lower() == "application/ld+json":
            self._dans_jsonld = True
            self._jsonld_fragments = []

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "title" and self._dans_title:
            self.titres.append("".join(self._title_fragments).strip())
            self._dans_title = False
        elif tag == "script" and self._dans_jsonld:
            self.jsonld.append("".join(self._jsonld_fragments).strip())
            self._dans_jsonld = False

    def handle_data(self, data: str) -> None:
        if self._dans_title:
            self._title_fragments.append(data)
        if self._dans_jsonld:
            self._jsonld_fragments.append(data)


def lire_json(chemin: Path):
    return json.loads(chemin.read_text(encoding="utf-8"))


def analyser_html(chemin: Path) -> AnalyseHTML:
    analyse = AnalyseHTML()
    analyse.feed(chemin.read_text(encoding="utf-8"))
    return analyse


def valeurs_meta(analyse: AnalyseHTML, *, name: str | None = None, prop: str | None = None) -> list[str]:
    valeurs: list[str] = []
    for meta in analyse.meta:
        if name is not None and meta.get("name", "").lower() == name.lower():
            valeurs.append(meta.get("content", ""))
        if prop is not None and meta.get("property", "").lower() == prop.lower():
            valeurs.append(meta.get("content", ""))
    return valeurs


def valeurs_link(analyse: AnalyseHTML, rel: str) -> list[str]:
    cible = rel.lower()
    return [lien.get("href", "") for lien in analyse.links if cible in lien.get("rel", "").lower().split()]


def extraire_dates_jsonld(analyse: AnalyseHTML) -> list[str]:
    dates: list[str] = []
    for brut in analyse.jsonld:
        try:
            donnees = json.loads(brut)
        except json.JSONDecodeError:
            continue
        pile = [donnees]
        while pile:
            courant = pile.pop()
            if isinstance(courant, dict):
                valeur = courant.get("dateModified")
                if isinstance(valeur, str):
                    dates.append(valeur)
                pile.extend(courant.values())
            elif isinstance(courant, list):
                pile.extend(courant)
    return dates


def sorties_html_indexables_du_plan() -> set[str]:
    plan = lire_json(PLAN)
    sorties = {"index.html"}
    for page in plan["pages_autonomes"]:
        sortie = page["sortie"]
        if sortie == "administration.html":
            continue
        sorties.add(sortie)
    return sorties


def routes_relais_attendues() -> set[str]:
    routes = lire_json(ROUTES)
    programme = lire_json(PROGRAMME)
    chemins = {route.strip("/") for route in routes.values() if route.strip("/")}
    chemins.update(f"parcours/{theme}" for theme in programme)
    return chemins


def valider_date(texte: str, contexte: str) -> str:
    try:
        valeur = date.fromisoformat(texte)
    except ValueError as exc:
        raise SystemExit(f"ÉCHEC SEO — date invalide pour {contexte} : {texte}") from exc
    if valeur > date.today():
        raise SystemExit(f"ÉCHEC SEO — date future pour {contexte} : {texte}")
    return texte


def lastmod_page(page: dict[str, str], analyse: AnalyseHTML) -> str:
    dates = extraire_dates_jsonld(analyse)
    if dates:
        uniques = list(dict.fromkeys(dates))
        if len(uniques) != 1:
            raise SystemExit(f"ÉCHEC SEO — plusieurs dateModified contradictoires dans {page['sortie']} : {uniques}")
        return valider_date(uniques[0], page["sortie"])
    if "lastmod" not in page:
        raise SystemExit(f"ÉCHEC SEO — lastmod absent pour {page['sortie']} (pas de dateModified JSON-LD).")
    return valider_date(page["lastmod"], page["sortie"])


def exiger_unique(valeurs: list[str], nom: str, sortie: str) -> str:
    if len(valeurs) != 1 or not valeurs[0].strip():
        raise SystemExit(f"ÉCHEC SEO — {sortie} doit contenir exactement un {nom} non vide (trouvé : {len(valeurs)}).")
    return unescape(valeurs[0].strip())


def verifier_page(page: dict[str, str], config: dict[str, object]) -> tuple[str, str]:
    sortie = page["sortie"]
    chemin = RACINE / sortie
    if not chemin.is_file():
        raise SystemExit(f"ÉCHEC SEO — page publique absente : {sortie}")
    analyse = analyser_html(chemin)
    titre = exiger_unique(analyse.titres, "<title>", sortie)
    description = exiger_unique(valeurs_meta(analyse, name="description"), "meta description", sortie)
    canonical = exiger_unique(valeurs_link(analyse, "canonical"), "canonical", sortie)
    og_url = exiger_unique(valeurs_meta(analyse, prop="og:url"), "og:url", sortie)
    og_title = exiger_unique(valeurs_meta(analyse, prop="og:title"), "og:title", sortie)
    og_description = exiger_unique(valeurs_meta(analyse, prop="og:description"), "og:description", sortie)
    robots = exiger_unique(valeurs_meta(analyse, name="robots"), "meta robots", sortie).lower()

    titre_max = int(config["titreMax"])
    desc_min = int(config["descriptionMin"])
    desc_max = int(config["descriptionMax"])
    if len(titre) > titre_max:
        raise SystemExit(f"ÉCHEC SEO — title trop long ({len(titre)} > {titre_max}) : {sortie} — {titre}")
    if not (desc_min <= len(description) <= desc_max):
        raise SystemExit(
            f"ÉCHEC SEO — meta description hors plage ({len(description)}, attendu {desc_min}-{desc_max}) : {sortie}"
        )
    if canonical != page["url"] or og_url != page["url"]:
        raise SystemExit(
            f"ÉCHEC SEO — canonical/og:url incohérent dans {sortie} : canonical={canonical}, og:url={og_url}, attendu={page['url']}"
        )
    # Open Graph peut employer une formulation sociale plus naturelle que la balise <title>
    # ou la meta description. On exige sa présence et une URL cohérente, sans imposer
    # une duplication mot pour mot qui n'apporte rien au référencement.
    if "noindex" in robots or "index" not in robots:
        raise SystemExit(f"ÉCHEC SEO — page indexable mal balisée robots : {sortie} — {robots}")
    if sortie == "index.html":
        if analyse.h1 < 1:
            raise SystemExit("ÉCHEC SEO — l’accueil doit conserver au moins un H1.")
    elif analyse.h1 != 1:
        raise SystemExit(f"ÉCHEC SEO — {sortie} doit contenir exactement un H1 (trouvé : {analyse.h1}).")
    return page["url"], lastmod_page(page, analyse)


def verifier_relais() -> None:
    for route in sorted(routes_relais_attendues()):
        chemin = RACINE / route / "index.html"
        if not chemin.is_file():
            raise SystemExit(f"ÉCHEC SEO — relais de route GitHub Pages absent : /{route}/")
        texte = chemin.read_text(encoding="utf-8")
        analyse = analyser_html(chemin)
        robots = exiger_unique(valeurs_meta(analyse, name="robots"), "meta robots", f"/{route}/").lower()
        canonical = exiger_unique(valeurs_link(analyse, "canonical"), "canonical", f"/{route}/")
        if "noindex" not in robots or "follow" not in robots:
            raise SystemExit(f"ÉCHEC SEO — relais /{route}/ doit être noindex,follow.")
        if canonical != "https://pjjoue.fr/":
            raise SystemExit(f"ÉCHEC SEO — relais /{route}/ doit canoniser vers https://pjjoue.fr/.")
        if "pjjoue_route=" not in texte:
            raise SystemExit(f"ÉCHEC SEO — relais /{route}/ ne transmet pas pjjoue_route.")


def construire_sitemap(entrees: list[tuple[str, str]]) -> bytes:
    lignes = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for url, lastmod in entrees:
        lignes.extend([
            "  <url>",
            f"    <loc>{url}</loc>",
            f"    <lastmod>{lastmod}</lastmod>",
            "  </url>",
        ])
    lignes.append("</urlset>")
    return ("\n".join(lignes) + "\n").encode("utf-8")


def principal() -> None:
    parseur = argparse.ArgumentParser(description="Construire ou vérifier le SEO public et sitemap.xml de PJJoue.")
    parseur.add_argument("--verifier", action="store_true")
    args = parseur.parse_args()

    config = lire_json(CONFIG)
    pages = config["pages"]
    if not isinstance(pages, list):
        raise SystemExit("ÉCHEC SEO — code/seo-pages.json : 'pages' doit être une liste.")

    sorties_config = {page["sortie"] for page in pages}
    sorties_plan = sorties_html_indexables_du_plan()
    if sorties_config != sorties_plan:
        manquantes = sorted(sorties_plan - sorties_config)
        en_trop = sorted(sorties_config - sorties_plan)
        raise SystemExit(f"ÉCHEC SEO — configuration des pages indexables incohérente. Manquantes={manquantes}, en trop={en_trop}")

    urls = [page["url"] for page in pages]
    if len(urls) != len(set(urls)):
        raise SystemExit("ÉCHEC SEO — URL dupliquée dans code/seo-pages.json.")
    domaine = str(config["domaine"]).rstrip("/")
    for url in urls:
        analyse_url = urlparse(url)
        if f"{analyse_url.scheme}://{analyse_url.netloc}" != domaine:
            raise SystemExit(f"ÉCHEC SEO — URL hors domaine configuré : {url}")
        if "#" in url or "?" in url:
            raise SystemExit(f"ÉCHEC SEO — URL indexable non propre : {url}")

    entrees = [verifier_page(page, config) for page in pages]
    verifier_relais()

    robots = ROBOTS.read_text(encoding="utf-8") if ROBOTS.is_file() else ""
    if "Sitemap: https://pjjoue.fr/sitemap.xml" not in robots:
        raise SystemExit("ÉCHEC SEO — robots.txt doit déclarer Sitemap: https://pjjoue.fr/sitemap.xml")

    contenu = construire_sitemap(entrees)
    if args.verifier:
        if not SITEMAP.is_file() or SITEMAP.read_bytes() != contenu:
            raise SystemExit("ÉCHEC SEO — sitemap.xml n’est pas à jour. Lance python outils/construire_seo.py.")
        print(
            f"SEO vérifié : {len(pages)} pages indexables, titles/meta/canonical/OG cohérents, "
            "routes propres contrôlées et sitemap à jour."
        )
    else:
        SITEMAP.write_bytes(contenu)
        print(f"SEO construit : sitemap de {len(pages)} pages et contrôles techniques validés.")


if __name__ == "__main__":
    principal()
