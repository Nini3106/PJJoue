#!/usr/bin/env python3
"""Comparer réellement l'apparence de PJJoue dans Chromium.

Usage recommandé pendant un nettoyage sans changement visuel :

    python tests/verifier_regression_visuelle.py --reference-projet ../PJJoue_REFERENCE

Le script capture les mêmes écrans dans la version de référence et dans la
version courante, avec le même Chromium. Les pixels doivent être identiques.
"""
from __future__ import annotations

from pathlib import Path
import argparse
import base64
import io
import mimetypes
import re
import sys

from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

RACINE = Path(__file__).resolve().parents[1]
FEUILLES_INTERFACE = (
    "ressources/styles/00-fondations-et-composants.css",
    "ressources/styles/10-parcours-principal.css",
    "ressources/styles/20-accueil-et-question-principale.css",
    "ressources/styles/30-revision-parcours-et-parametres.css",
    "ressources/styles/40-progression-et-erreurs.css",
    "ressources/styles/50-carte-question-et-correction.css",
    "ressources/styles/60-parcours-modes-et-chronometre.css",
    "ressources/styles/70-celebrations-bilan-et-fenetres.css",
    "ressources/styles/80-finitions-de-l-interface.css",
    "ressources/styles/85-guides-pedagogiques.css",
    "ressources/styles/90-adaptation-ecrans-et-etats-finaux.css",
    "ressources/styles/95-consentement.css",
    "ressources/styles/96-icones-et-defi-hasard.css",
)

VUES = (
    ("bureau-accueil", 1440, 900, "accueil"),
    ("bureau-parcours", 1440, 900, "parcours"),
    ("bureau-carnet", 1440, 900, "carnet"),
    ("bureau-entrainement", 1440, 900, "entrainement"),
    ("bureau-question", 1440, 900, "question"),
    ("bureau-progression", 1440, 900, "progression"),
    ("bureau-parametres", 1440, 900, "parametres"),
    ("portable-parcours", 1024, 768, "parcours"),
    ("portable-carnet", 1024, 768, "carnet"),
    ("portable-question", 1024, 768, "question"),
    ("mobile-accueil", 390, 844, "accueil"),
    ("mobile-parcours", 390, 844, "parcours"),
    ("mobile-carnet", 390, 844, "carnet"),
    ("mobile-question", 390, 844, "question"),
)


def uri_donnees(chemin: Path) -> str:
    type_mime = mimetypes.guess_type(chemin.name)[0] or "application/octet-stream"
    contenu = base64.b64encode(chemin.read_bytes()).decode("ascii")
    return f"data:{type_mime};base64,{contenu}"


def integrer_images_html(page: str, racine: Path) -> str:
    motif = re.compile(r'(?P<avant>\bsrc=")(?P<chemin>(?:ressources|donnees)/[^"?#]+)(?P<apres>")')

    def remplacer(correspondance: re.Match[str]) -> str:
        chemin = racine / correspondance.group("chemin")
        if not chemin.is_file():
            return correspondance.group(0)
        return correspondance.group("avant") + uri_donnees(chemin) + correspondance.group("apres")

    return motif.sub(remplacer, page)


def integrer_images_css(css: str, racine: Path) -> str:
    motif = re.compile(r'url\(["\']?\.\./([^\)"\']+)["\']?\)')

    def remplacer(correspondance: re.Match[str]) -> str:
        chemin = racine / "ressources" / correspondance.group(1)
        if not chemin.is_file():
            return correspondance.group(0)
        return f'url("{uri_donnees(chemin)}")'

    return motif.sub(remplacer, css)


def construire_page(racine: Path) -> str:
    page = (racine / "index.html").read_text(encoding="utf-8")
    css = "\n".join((racine / chemin).read_text(encoding="utf-8") for chemin in FEUILLES_INTERFACE)
    css = integrer_images_css(css, racine)
    donnees = (racine / "donnees/donnees-pjj.js").read_text(encoding="utf-8")
    moteur = (racine / "ressources/moteur-jeu.js").read_text(encoding="utf-8")

    page = re.sub(r'<meta[^>]+http-equiv="Content-Security-Policy"[^>]*/?>', "", page, flags=re.I)
    page = re.sub(r'<!-- Google Tag Manager -->.*?<!-- End Google Tag Manager -->\s*', "", page, count=1, flags=re.S | re.I)
    page = re.sub(r'<!-- Google Tag Manager \(noscript\) -->.*?<!-- End Google Tag Manager \(noscript\) -->\s*', "", page, count=1, flags=re.S | re.I)
    page = re.sub(
        r'<script\b(?=[^>]*src="ressources/(?:consentement-analytics|analytics-pjjoue)\.js")[^>]*>\s*</script>',
        "", page, flags=re.I,
    )
    page = re.sub(r'<link\b(?=[^>]*href="ressources/styles/[^"]+\.css")[^>]*>\s*', "", page, flags=re.I)
    page = page.replace("</head>", f"<style>{css}</style></head>", 1)
    page = integrer_images_html(page, racine)

    graine = "<script>let graineTest=123456789;Math.random=()=>{graineTest=(1103515245*graineTest+12345)%2147483648;return graineTest/2147483648};</script>"
    page = re.sub(
        r'<script\b(?=[^>]*src="donnees/donnees-pjj\.js")[^>]*>\s*</script>',
        lambda _: graine + f"<script>{donnees}</script>", page, count=1, flags=re.I,
    )
    page = re.sub(
        r'<script\b(?=[^>]*src="ressources/moteur-jeu\.js")[^>]*>\s*</script>',
        lambda _: f"<script>{moteur}</script>", page, count=1, flags=re.I,
    )
    return page


def ouvrir_vue(page, vue: str) -> None:
    if vue == "accueil":
        page.evaluate("() => afficherEcran('accueil', {remplacerHistorique:true})")
    elif vue == "parcours":
        page.evaluate("() => ouvrirParcours('commun', {remplacerHistorique:true})")
    elif vue == "carnet":
        page.evaluate("() => { etat.theme='commun'; afficherEcran('carnet', {remplacerHistorique:true}); }")
    elif vue == "entrainement":
        page.evaluate("() => afficherEcran('entrainement', {remplacerHistorique:true})")
    elif vue == "question":
        page.evaluate("() => lancerEtape('commun', 2)")
    elif vue == "progression":
        page.evaluate("() => { etat.theme='commun'; afficherEcran('progression', {remplacerHistorique:true}); }")
    elif vue == "parametres":
        page.evaluate("() => afficherEcran('parametres', {remplacerHistorique:true})")
    else:
        raise ValueError(vue)
    page.wait_for_timeout(180)


def capturer(navigateur, racine: Path) -> dict[str, bytes]:
    html = construire_page(racine)
    captures: dict[str, bytes] = {}
    tailles: dict[tuple[int, int], list[tuple[str, str]]] = {}
    for nom, largeur, hauteur, vue in VUES:
        tailles.setdefault((largeur, hauteur), []).append((nom, vue))

    for (largeur, hauteur), vues in tailles.items():
        page = navigateur.new_page(viewport={"width": largeur, "height": hauteur})
        erreurs: list[str] = []
        page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
        page.set_content(html, wait_until="domcontentloaded")
        page.wait_for_function("() => window.DONNEES_PJJ?.QUESTIONS?.length === 160 && typeof afficherEcran === 'function'")
        for nom, vue in vues:
            ouvrir_vue(page, vue)
            if erreurs:
                raise AssertionError(f"{nom} : erreur JavaScript : {erreurs[0]}")
            captures[nom] = page.screenshot(full_page=False, animations="disabled")
        page.close()
    return captures


def pixels_identiques(image_a: bytes, image_b: bytes) -> bool:
    a = Image.open(io.BytesIO(image_a)).convert("RGBA")
    b = Image.open(io.BytesIO(image_b)).convert("RGBA")
    return a.size == b.size and ImageChops.difference(a, b).getbbox() is None


def lancer_chromium(automate):
    candidats = [Path("/usr/bin/chromium"), Path("/usr/bin/chromium-browser")]
    for candidat in candidats:
        if candidat.exists():
            return automate.chromium.launch(headless=True, executable_path=str(candidat), args=["--no-sandbox"])
    return automate.chromium.launch(headless=True)


def principal() -> int:
    analyseur = argparse.ArgumentParser()
    analyseur.add_argument("--reference-projet", type=Path)
    options = analyseur.parse_args()
    reference = options.reference_projet.resolve() if options.reference_projet else None
    if reference and not (reference / "index.html").is_file():
        print(f"ÉCHEC — projet de référence introuvable : {reference}", file=sys.stderr)
        return 1

    try:
        with sync_playwright() as automate:
            navigateur = lancer_chromium(automate)
            apres = capturer(navigateur, RACINE)
            avant = capturer(navigateur, reference) if reference else None
            navigateur.close()

        dossier = RACINE / "test-results" / "regression-visuelle"
        dossier.mkdir(parents=True, exist_ok=True)
        if avant is None:
            for nom, image in apres.items():
                (dossier / f"{nom}.png").write_bytes(image)
            print(f"OK — {len(apres)} captures visuelles créées dans test-results/regression-visuelle/.")
            print("Pour une comparaison pixel par pixel, relancer avec --reference-projet CHEMIN_DE_LA_VERSION_REFERENCE.")
            return 0

        differences = [nom for nom in avant if not pixels_identiques(avant[nom], apres[nom])]
        if differences:
            for nom in differences:
                (dossier / f"{nom}-reference.png").write_bytes(avant[nom])
                (dossier / f"{nom}-actuel.png").write_bytes(apres[nom])
            print("ÉCHEC — différence visuelle : " + ", ".join(differences), file=sys.stderr)
            return 1
        print(f"OK — {len(avant)} vues identiques pixel par pixel entre la référence et la version courante.")
        return 0
    except Exception as erreur:
        print(f"ÉCHEC — {erreur}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(principal())
