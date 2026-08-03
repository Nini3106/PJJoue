#!/usr/bin/env python3
"""Protège le rendu CSS de PJJoue avec des captures de pixels déterministes."""
from __future__ import annotations

import argparse
import base64
from dataclasses import dataclass
import json
import platform
from pathlib import Path
import sys

from playwright.sync_api import Error as ErreurPlaywright
from playwright.sync_api import sync_playwright

from verifier_interface import LARGEURS, SCENARIOS


RACINE = Path(__file__).resolve().parents[1]
DOSSIER_REFERENCE = (
    Path(__file__).resolve().parent
    / "references-visuelles"
    / f"{platform.system().lower()}-chromium"
)
DOSSIER_RESULTATS = RACINE / "test-results" / "references-visuelles"
CHEMIN_EMPREINTES = DOSSIER_REFERENCE / "empreintes.json"

STYLE_STABLE = """
*, *::before, *::after {
    animation: none !important;
    caret-color: transparent !important;
    transition: none !important;
}
html {
    overflow-anchor: none !important;
    scroll-behavior: auto !important;
    scrollbar-width: none !important;
}
::-webkit-scrollbar {
    display: none !important;
}
"""

GRAINE_ALEATOIRE = """
let graineTestVisuel = 123456789;
Math.random = () => {
    graineTestVisuel = (1103515245 * graineTestVisuel + 12345) % 2147483648;
    return graineTestVisuel / 2147483648;
};
"""

VERROUILLAGE_DEFILEMENT = """
window.scroll = () => {};
window.scrollBy = () => {};
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};
"""

REPLACER_DEFILEMENT_EN_HAUT = """() => {
    const elements = new Set([
        document.documentElement,
        document.body,
        document.scrollingElement,
    ]);
    for (const element of elements) {
        if (element) {
            element.scrollLeft = 0;
            element.scrollTop = 0;
        }
    }
}"""

SCENARIO_DEFI_CHRONO = """
afficherEcran('entrainement', {remplacerHistorique: true});
document.querySelector(
    '[data-carte-entrainement] [data-proposition="chronometre"] '
    + '[data-valeur="oui"]'
)?.click();
"""

SCENARIOS_VISUELS = {
    "bureau-accueil": ("jeu", "bureau", SCENARIOS["accueil"]),
    "bureau-choix-mode": ("jeu", "bureau", SCENARIOS["jouer"]),
    "bureau-parcours": ("jeu", "bureau", SCENARIOS["parcours"]),
    "bureau-entrainement": ("jeu", "bureau", SCENARIOS["entrainement"]),
    "bureau-question-relier": ("jeu", "bureau", SCENARIOS["question_relier"]),
    "bureau-correction-fausse": ("jeu", "bureau", SCENARIOS["correction_fausse"]),
    "bureau-bilan": ("jeu", "bureau", SCENARIOS["bilan"]),
    "bureau-progression": ("jeu", "bureau", SCENARIOS["progression"]),
    "bureau-parametres": ("jeu", "bureau", SCENARIOS["parametres"]),
    "portable-parcours": ("jeu", "portable", SCENARIOS["parcours"]),
    "portable-question-relier": ("jeu", "portable", SCENARIOS["question_relier"]),
    "mobile-accueil": ("jeu", "mobile", SCENARIOS["accueil"]),
    "mobile-parcours": ("jeu", "mobile", SCENARIOS["parcours"]),
    "mobile-defi-chrono": ("jeu", "mobile", SCENARIO_DEFI_CHRONO),
    "mobile-question-ordre": ("jeu", "mobile", SCENARIOS["question_choisir_ordre"]),
    "mobile-correction-fausse": ("jeu", "mobile", SCENARIOS["correction_fausse"]),
    "mobile-bilan": ("jeu", "mobile", SCENARIOS["bilan"]),
    "mobile-progression": ("jeu", "mobile", SCENARIOS["progression"]),
    "administration-bureau": ("administration", "bureau", ""),
}


@dataclass(frozen=True)
class CaptureVisuelle:
    contenu_png: bytes
    largeur: int
    hauteur: int
    empreinte_pixels: str


def obtenir_empreinte_pixels(page, contenu_png: bytes) -> dict[str, int | str]:
    source = "data:image/png;base64," + base64.b64encode(contenu_png).decode("ascii")
    return page.evaluate(
        """async sourceImage => {
            const image = new Image();
            const chargement = new Promise((resoudre, rejeter) => {
                image.onload = resoudre;
                image.onerror = rejeter;
            });
            image.src = sourceImage;
            await chargement;
            const toile = document.createElement('canvas');
            toile.width = image.naturalWidth;
            toile.height = image.naturalHeight;
            const contexte = toile.getContext('2d', {willReadFrequently: true});
            contexte.drawImage(image, 0, 0);
            const pixels = contexte.getImageData(0, 0, toile.width, toile.height).data;
            const condensat = await crypto.subtle.digest('SHA-256', pixels);
            const empreinte = [...new Uint8Array(condensat)]
                .map(octet => octet.toString(16).padStart(2, '0'))
                .join('');
            return {largeur: toile.width, hauteur: toile.height, empreinte};
        }""",
        source,
    )


def capturer_scenario(
    navigateur,
    page_cible: str,
    format_ecran: str,
    scenario: str,
) -> CaptureVisuelle:
    contexte = navigateur.new_context(
        viewport=LARGEURS[format_ecran],
        device_scale_factor=1,
        color_scheme="light",
        locale="fr-FR",
        reduced_motion="reduce",
        timezone_id="Europe/Paris",
    )
    try:
        page = contexte.new_page()
        page.set_default_timeout(5000)
        erreurs: list[str] = []
        page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
        page.add_init_script(GRAINE_ALEATOIRE)
        nom_page = "index.html" if page_cible == "jeu" else "administration.html"
        page.goto((RACINE / nom_page).as_uri(), wait_until="load")
        page.add_style_tag(content=STYLE_STABLE)
        page.evaluate(VERROUILLAGE_DEFILEMENT)
        if scenario.strip():
            page.evaluate(scenario)
        page.evaluate("() => document.fonts.ready")
        page.wait_for_function(
            "() => [...document.images].every(image => image.complete)"
        )
        page.wait_for_timeout(120)
        page.evaluate(REPLACER_DEFILEMENT_EN_HAUT)
        page.wait_for_timeout(20)
        page.evaluate(REPLACER_DEFILEMENT_EN_HAUT)
        if erreurs:
            raise AssertionError(f"Erreurs JavaScript pendant la capture : {erreurs}")
        contenu_png = page.screenshot(
            full_page=False,
            animations="disabled",
            caret="hide",
            scale="css",
        )
        description = obtenir_empreinte_pixels(page, contenu_png)
        return CaptureVisuelle(
            contenu_png=contenu_png,
            largeur=int(description["largeur"]),
            hauteur=int(description["hauteur"]),
            empreinte_pixels=str(description["empreinte"]),
        )
    finally:
        contexte.close()


def descriptions_identiques(
    premiere: CaptureVisuelle,
    seconde: CaptureVisuelle,
) -> bool:
    return (
        premiere.largeur == seconde.largeur
        and premiere.hauteur == seconde.hauteur
        and premiere.empreinte_pixels == seconde.empreinte_pixels
    )


def creer_reference(navigateur) -> None:
    if CHEMIN_EMPREINTES.exists():
        raise AssertionError(
            "La référence visuelle existe déjà. Elle ne doit pas être remplacée "
            "pendant un nettoyage CSS."
        )
    DOSSIER_REFERENCE.mkdir(parents=True, exist_ok=True)
    descriptions: dict[str, dict[str, int | str]] = {}
    for nom, (page_cible, format_ecran, scenario) in SCENARIOS_VISUELS.items():
        premiere = capturer_scenario(
            navigateur, page_cible, format_ecran, scenario
        )
        seconde = capturer_scenario(
            navigateur, page_cible, format_ecran, scenario
        )
        if not descriptions_identiques(premiere, seconde):
            DOSSIER_RESULTATS.mkdir(parents=True, exist_ok=True)
            (DOSSIER_RESULTATS / f"{nom}-essai-1.png").write_bytes(
                premiere.contenu_png
            )
            (DOSSIER_RESULTATS / f"{nom}-essai-2.png").write_bytes(
                seconde.contenu_png
            )
            raise AssertionError(
                f"La capture {nom} n'est pas déterministe sur deux essais. "
                f"Les essais sont dans {DOSSIER_RESULTATS}."
            )
        nom_fichier = f"{nom}.png"
        (DOSSIER_REFERENCE / nom_fichier).write_bytes(premiere.contenu_png)
        descriptions[nom] = {
            "fichier": nom_fichier,
            "largeur": premiere.largeur,
            "hauteur": premiere.hauteur,
            "sha256Pixels": premiere.empreinte_pixels,
        }
    reference = {
        "plateforme": platform.system(),
        "versionChromium": navigateur.version,
        "captures": descriptions,
    }
    CHEMIN_EMPREINTES.write_text(
        json.dumps(reference, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Référence visuelle créée : {len(descriptions)} captures stables.")


def verifier_reference(navigateur) -> None:
    if not CHEMIN_EMPREINTES.is_file():
        raise AssertionError(
            "Référence visuelle absente. Lancez d'abord "
            "`python tests/verifier_regression_visuelle.py --creer-reference`."
        )
    reference = json.loads(CHEMIN_EMPREINTES.read_text(encoding="utf-8"))
    if reference.get("plateforme") != platform.system():
        raise AssertionError(
            "La référence a été créée sur une autre plateforme "
            f"({reference.get('plateforme')} au lieu de {platform.system()})."
        )
    if reference.get("versionChromium") != navigateur.version:
        raise AssertionError(
            "La version de Chromium diffère de la référence "
            f"({reference.get('versionChromium')} au lieu de {navigateur.version})."
        )
    DOSSIER_RESULTATS.mkdir(parents=True, exist_ok=True)
    differences: list[str] = []
    for nom, (page_cible, format_ecran, scenario) in SCENARIOS_VISUELS.items():
        capture = capturer_scenario(
            navigateur, page_cible, format_ecran, scenario
        )
        attendu = reference.get("captures", {}).get(nom, {})
        identique = (
            capture.largeur == attendu.get("largeur")
            and capture.hauteur == attendu.get("hauteur")
            and capture.empreinte_pixels == attendu.get("sha256Pixels")
        )
        if not identique:
            chemin_resultat = DOSSIER_RESULTATS / f"{nom}.png"
            chemin_resultat.write_bytes(capture.contenu_png)
            differences.append(f"{nom} (capture obtenue : {chemin_resultat})")
    if differences:
        raise AssertionError(
            "Différences visuelles détectées :\n- " + "\n- ".join(differences)
        )
    print(
        f"OK — référence visuelle : {len(SCENARIOS_VISUELS)} captures identiques."
    )


def principal() -> int:
    analyseur = argparse.ArgumentParser()
    analyseur.add_argument(
        "--creer-reference",
        action="store_true",
        help="crée une seule fois les captures de la V1 optimisée",
    )
    arguments = analyseur.parse_args()
    try:
        with sync_playwright() as automate:
            navigateur = automate.chromium.launch(
                headless=True,
                args=["--force-color-profile=srgb"],
            )
            try:
                if arguments.creer_reference:
                    creer_reference(navigateur)
                else:
                    verifier_reference(navigateur)
            finally:
                navigateur.close()
        return 0
    except (AssertionError, ErreurPlaywright, OSError) as erreur:
        print(f"ÉCHEC — {erreur}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(principal())
