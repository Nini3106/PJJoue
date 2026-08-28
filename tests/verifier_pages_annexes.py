#!/usr/bin/env python3
"""Recette Chromium des guides, pages d'information et de l'administration locale."""
from __future__ import annotations

from pathlib import Path
import argparse
import base64
import mimetypes
import os
import re

from playwright.sync_api import sync_playwright

RACINE = Path(__file__).resolve().parents[1]
SORTIE = RACINE / "test-results" / "pages-annexes"

PAGES_BUREAU = [
    "guides/index.html",
    "decouvrir-la-pjj/index.html",
    "organisation-pjj/index.html",
    "metiers-pjj/index.html",
    "structures-pjj/index.html",
    "mesures-educatives-pjj/index.html",
    "sigles-pjj/index.html",
    "preparer-arrivee-pjj/index.html",
    "concours-educateur-pjj/index.html",
    "quiz-pjj/index.html",
    "sources.html",
    "accessibilite.html",
    "confidentialite.html",
    "mentions-legales.html",
    "administration.html",
]
PAGES_MOBILE = ["guides/index.html", "decouvrir-la-pjj/index.html", "sources.html", "administration.html"]
SCRIPTS_VISUELS = {"donnees-pjj.js", "sources-pjjoue.js", "administration.js"}


def nom_capture(adresse: str) -> str:
    return adresse.replace("/index.html", "").replace("/", "-").replace(".html", "")


def uri_donnees(chemin: Path) -> str:
    mime = mimetypes.guess_type(chemin.name)[0] or "application/octet-stream"
    return f"data:{mime};base64,{base64.b64encode(chemin.read_bytes()).decode('ascii')}"


def resoudre(chemin_page: Path, adresse: str) -> Path:
    return (chemin_page.parent / adresse.split("?", 1)[0].split("#", 1)[0]).resolve()


def construire_page(adresse: str) -> str:
    chemin_page = RACINE / adresse
    html = chemin_page.read_text(encoding="utf-8")
    html = re.sub(r'<meta[^>]+http-equiv="Content-Security-Policy"[^>]*/?>', "", html, flags=re.I)

    motif_css = re.compile(r'<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>', re.I)
    def remplacer_css(match: re.Match[str]) -> str:
        chemin = resoudre(chemin_page, match.group(1))
        if chemin.is_file():
            return f"<style>{chemin.read_text(encoding='utf-8')}</style>"
        return ""
    html = motif_css.sub(remplacer_css, html)

    motif_image = re.compile(r'(?P<avant>\bsrc=")(?P<adresse>[^"#?]+)(?P<apres>")', re.I)
    def remplacer_image(match: re.Match[str]) -> str:
        adresse_image = match.group("adresse")
        if adresse_image.startswith(("http://", "https://", "data:")):
            return match.group(0)
        chemin = resoudre(chemin_page, adresse_image)
        if chemin.is_file() and chemin.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"}:
            return match.group("avant") + uri_donnees(chemin) + match.group("apres")
        return match.group(0)
    html = motif_image.sub(remplacer_image, html)

    motif_script = re.compile(r'<script\b(?=[^>]*src="([^"]+)")[^>]*>\s*</script>', re.I)
    def remplacer_script(match: re.Match[str]) -> str:
        adresse_script = match.group(1)
        chemin = resoudre(chemin_page, adresse_script)
        if chemin.is_file() and chemin.name in SCRIPTS_VISUELS:
            return f"<script>{chemin.read_text(encoding='utf-8')}</script>"
        return ""
    html = motif_script.sub(remplacer_script, html)
    return html


def verifier_page(page, nom: str) -> None:
    page.wait_for_timeout(260)
    donnees = page.evaluate("""() => {
        const h1 = document.querySelector('h1');
        const style = getComputedStyle(document.body);
        return {
            largeur: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            h1: Boolean(h1 && h1.getBoundingClientRect().width > 20 && h1.getBoundingClientRect().height > 20),
            fond: style.backgroundColor,
            couleur: style.color,
        };
    }""")
    if donnees["largeur"] > 1:
        raise AssertionError(f"{nom}: débordement horizontal de {donnees['largeur']}px")
    if not donnees["h1"]:
        raise AssertionError(f"{nom}: titre principal non visible")
    if donnees["fond"] != "rgb(22, 71, 125)":
        raise AssertionError(f"{nom}: le fond bleu PJJoue validé #16477d a changé ({donnees['fond']})")
    if donnees["couleur"] != "rgb(255, 255, 255)":
        raise AssertionError(f"{nom}: la couleur de texte blanche validée a changé ({donnees['couleur']})")


def options_chromium() -> dict:
    """Utilise Chromium système si présent, sinon celui installé par Playwright."""
    configure = os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE") or os.environ.get("PJJOUE_CHROMIUM")
    candidats = [Path(configure)] if configure else []
    candidats += [Path("/usr/bin/chromium"), Path("/usr/bin/chromium-browser")]
    for candidat in candidats:
        if candidat.is_file():
            return {"headless": True, "executable_path": str(candidat), "args": ["--no-sandbox"]}
    return {"headless": True, "args": ["--no-sandbox"]}


def main() -> int:
    parseur = argparse.ArgumentParser()
    parseur.add_argument("--filtre", default="", help="Sous-chaîne du chemin des pages à contrôler.")
    arguments = parseur.parse_args()
    pages_bureau = [adresse for adresse in PAGES_BUREAU if arguments.filtre.lower() in adresse.lower()]
    pages_mobile = [adresse for adresse in PAGES_MOBILE if arguments.filtre.lower() in adresse.lower()]
    if not pages_bureau and not pages_mobile:
        raise SystemExit("Aucune page annexe ne correspond au filtre.")
    SORTIE.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        navigateur = playwright.chromium.launch(**options_chromium())
        for adresse in pages_bureau:
            page = navigateur.new_page(viewport={"width": 1440, "height": 900})
            erreurs: list[str] = []
            page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
            page.set_content(construire_page(adresse), wait_until="domcontentloaded")
            verifier_page(page, adresse)
            if erreurs:
                raise AssertionError(f"{adresse}: erreur JavaScript: {erreurs[0]}")
            page.screenshot(path=str(SORTIE / f"bureau-{nom_capture(adresse)}.png"), full_page=(adresse != 'administration.html'))
            page.close()
            print(f"OK — bureau {adresse}")
        for adresse in pages_mobile:
            page = navigateur.new_page(viewport={"width": 390, "height": 844})
            erreurs: list[str] = []
            page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
            page.set_content(construire_page(adresse), wait_until="domcontentloaded")
            verifier_page(page, adresse)
            if erreurs:
                raise AssertionError(f"{adresse}: erreur JavaScript mobile: {erreurs[0]}")
            page.screenshot(path=str(SORTIE / f"mobile-{nom_capture(adresse)}.png"), full_page=(adresse != 'administration.html'))
            page.close()
            print(f"OK — mobile {adresse}")
        navigateur.close()
    print(f"OK — pages annexes PJJoue : {len(pages_bureau) + len(pages_mobile)} scénarios")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
