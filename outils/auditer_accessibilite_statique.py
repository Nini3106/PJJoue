#!/usr/bin/env python3
"""Contrôles d'accessibilité automatiques sur toutes les pages HTML publiques."""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
import sys

RACINE = Path(__file__).resolve().parents[1]


class AnalysePage(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.langue = ""
        self.titres_page = 0
        self.titres_h1 = 0
        self.identifiants: list[str] = []
        self.images_sans_alt = 0
        self.champs_sans_nom = 0

    def handle_starttag(self, balise: str, attributs_bruts: list[tuple[str, str | None]]) -> None:
        attributs = dict(attributs_bruts)
        if balise == "html":
            self.langue = attributs.get("lang", "") or ""
        if balise == "title":
            self.titres_page += 1
        if balise == "h1":
            self.titres_h1 += 1
        if attributs.get("id"):
            self.identifiants.append(str(attributs["id"]))
        if balise == "img" and "alt" not in attributs:
            self.images_sans_alt += 1
        if balise in {"input", "select", "textarea"} and attributs.get("type") != "hidden":
            if not any(attributs.get(nom) for nom in ("aria-label", "aria-labelledby", "title", "id")):
                self.champs_sans_nom += 1


def pages_publiques() -> list[Path]:
    pages = []
    for chemin in RACINE.rglob("*.html"):
        relatif = chemin.relative_to(RACINE)
        if relatif.parts[0] in {"code", "node_modules", "test-results"}:
            continue
        pages.append(chemin)
    return sorted(pages)


def main() -> int:
    anomalies: list[str] = []
    pages = pages_publiques()
    for chemin in pages:
        analyse = AnalysePage()
        analyse.feed(chemin.read_text(encoding="utf-8"))
        nom = chemin.relative_to(RACINE).as_posix()
        if analyse.langue != "fr":
            anomalies.append(f"{nom} : langue principale absente ou différente de fr")
        if analyse.titres_page != 1:
            anomalies.append(f"{nom} : {analyse.titres_page} élément(s) title")
        # index.html regroupe plusieurs écrans dynamiques, chacun avec son propre h1.
        if (nom == "index.html" and analyse.titres_h1 < 1) or (nom != "index.html" and analyse.titres_h1 != 1):
            anomalies.append(f"{nom} : {analyse.titres_h1} titre(s) h1")
        doublons = sorted({identifiant for identifiant in analyse.identifiants if analyse.identifiants.count(identifiant) > 1})
        if doublons:
            anomalies.append(f"{nom} : identifiants dupliqués ({', '.join(doublons)})")
        if analyse.images_sans_alt:
            anomalies.append(f"{nom} : {analyse.images_sans_alt} image(s) sans attribut alt")
        if analyse.champs_sans_nom:
            anomalies.append(f"{nom} : {analyse.champs_sans_nom} champ(s) sans nom détectable")

    if anomalies:
        print("ERREUR — anomalies d'accessibilité statique :")
        print("\n".join(f"- {message}" for message in anomalies))
        return 1
    print(f"OK — {len(pages)} pages contrôlées : langue, titre, h1, identifiants, images et champs.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
