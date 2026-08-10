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
    "ressources/styles/99-stabilisation-visuelle.css",
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
    # Matrice représentative des téléphones actuellement courants et compacts.
    ("mobile-320x568-accueil", 320, 568, "accueil"),
    ("mobile-360x640-accueil", 360, 640, "accueil"),
    ("mobile-375x667-accueil", 375, 667, "accueil"),
    ("mobile-393x873-accueil", 393, 873, "accueil"),
    ("mobile-412x915-accueil", 412, 915, "accueil"),
    ("mobile-430x932-accueil", 430, 932, "accueil"),
    ("mobile-fold-344x882-accueil", 344, 882, "accueil"),
    ("mobile-fold-853x1280-accueil", 853, 1280, "accueil"),
    ("mobile-surface-912x1368-accueil", 912, 1368, "accueil"),
    ("mobile-tablette-1024x1366-accueil", 1024, 1366, "accueil"),
    ("mobile-large-1280x800-accueil", 1280, 800, "accueil"),
    ("mobile-375x667-parcours", 375, 667, "parcours"),
    ("mobile-375x667-carnet", 375, 667, "carnet"),
    ("mobile-375x667-entrainement", 375, 667, "entrainement"),
    ("mobile-375x667-question", 375, 667, "question"),
    ("mobile-375x667-progression", 375, 667, "progression"),
    ("mobile-375x667-parametres", 375, 667, "parametres"),
    ("paysage-568x320-accueil", 568, 320, "accueil"),
    ("paysage-667x375-accueil", 667, 375, "accueil"),
    ("paysage-844x390-accueil", 844, 390, "accueil"),
    ("paysage-667x375-question", 667, 375, "question"),
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

    page = motif.sub(remplacer, page)
    motif_srcset = re.compile(r'\bsrcset="(?P<contenu>[^"]+)"')

    def remplacer_srcset(correspondance: re.Match[str]) -> str:
        candidats = []
        for candidat in correspondance.group("contenu").split(","):
            morceaux = candidat.strip().split()
            if not morceaux:
                continue
            chemin = racine / morceaux[0]
            adresse = uri_donnees(chemin) if chemin.is_file() else morceaux[0]
            candidats.append(" ".join([adresse, *morceaux[1:]]))
        return 'srcset="' + ", ".join(candidats) + '"'

    return motif_srcset.sub(remplacer_srcset, page)


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
            debordement = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
            if debordement > 1:
                raise AssertionError(f"{nom} : débordement horizontal de {debordement}px")
            if vue == "accueil":
                image_valide = page.evaluate("""() => {
                    const image = document.querySelector('.accueil-presentation-image');
                    const rectangle = image?.getBoundingClientRect();
                    return Boolean(image?.complete && image.naturalWidth > 0 && rectangle?.width > 0 && rectangle?.height > 100);
                }""")
                if not image_valide:
                    raise AssertionError(f"{nom} : image d’accueil absente ou sans hauteur")
                coherence_accueil = page.evaluate("""() => {
                    const accueil = document.querySelector('#accueil');
                    const guides = document.querySelector('.guides-publics-accueil');
                    const entete = document.querySelector('header.entete');
                    const titre = document.querySelector('#accueil .accueil-contenu h1');
                    const introduction = document.querySelector('#accueil .accueil-introduction');
                    const accent = document.querySelector('#accueil .accueil-accent');
                    const action = document.querySelector('#accueil .accueil-action-principale');
                    const reperes = [...document.querySelectorAll('#accueil .accueil-statistiques li')];
                    const pied = document.querySelector('.produit-pied-page');
                    const boutonMenu = document.querySelector('.bouton-menu-mobile');
                    const navigation = document.querySelector('header.entete .navigation');
                    const largeur = document.documentElement.clientWidth;
                    const ecart = guides.getBoundingClientRect().top - accueil.getBoundingClientRect().bottom;
                    const ecartIntroductionHaut = introduction.getBoundingClientRect().top - accent.getBoundingClientRect().bottom;
                    const ecartIntroductionBas = action.getBoundingClientRect().top - introduction.getBoundingClientRect().bottom;
                    const hauteursReperes = reperes.map(repere => repere.getBoundingClientRect().height);
                    const hautReperes = Math.min(...reperes.map(repere => repere.getBoundingClientRect().top));
                    const basReperes = Math.max(...reperes.map(repere => repere.getBoundingClientRect().bottom));
                    const basBouton = action.getBoundingClientRect().bottom;
                    const hautBouton = action.getBoundingClientRect().top;
                    const basIntroduction = introduction.getBoundingClientRect().bottom;
                    const basImage = document.querySelector('.accueil-presentation').getBoundingClientRect().bottom;
                    const ecartBoutonHaut = hautBouton - basIntroduction;
                    const ecartReperesHaut = hautReperes - basBouton;
                    const ecartReperesBas = basImage - basReperes;
                    const reperesEgaux = Math.max(...hauteursReperes) - Math.min(...hauteursReperes) <= 2;
                    const reperesSansDebordement = reperes.every(repere =>
                        repere.scrollWidth <= repere.clientWidth + 1
                        && repere.scrollHeight <= repere.clientHeight + 1
                    );
                    const titreDegage = titre.getBoundingClientRect().top >= entete.getBoundingClientRect().bottom - 1;
                    const basDocument = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
                    const piedSansVide = basDocument - pied.getBoundingClientRect().bottom - scrollY <= 2;
                    const menuReplie = largeur > 1280 || (
                        getComputedStyle(boutonMenu).display !== 'none'
                        && getComputedStyle(navigation).display === 'none'
                    );
                    return {
                        ecart,
                        menuReplie,
                        titreDegage,
                        reperesEgaux,
                        reperesSansDebordement,
                        ecartIntroductionHaut,
                        ecartIntroductionBas,
                        ecartBoutonHaut,
                        ecartReperesHaut,
                        ecartReperesBas,
                        piedSansVide
                    };
                }""")
                if coherence_accueil["ecart"] > 40:
                    raise AssertionError(f"{nom} : espace de {coherence_accueil['ecart']:.0f}px avant les guides")
                if not coherence_accueil["menuReplie"]:
                    raise AssertionError(f"{nom} : menu principal non replié")
                if not coherence_accueil["titreDegage"]:
                    raise AssertionError(f"{nom} : titre d’accueil masqué par le menu")
                if not coherence_accueil["reperesEgaux"]:
                    raise AssertionError(f"{nom} : les quatre repères n’ont pas la même hauteur")
                if not coherence_accueil["reperesSansDebordement"]:
                    raise AssertionError(f"{nom} : texte débordant dans un repère d’accueil")
                difference_espacement = abs(
                    coherence_accueil["ecartIntroductionHaut"]
                    - coherence_accueil["ecartIntroductionBas"]
                )
                if difference_espacement > 4:
                    raise AssertionError(f"{nom} : espacement vertical irrégulier autour du texte d’accueil")
                difference_reperes = abs(
                    coherence_accueil["ecartReperesHaut"]
                    - coherence_accueil["ecartReperesBas"]
                )
                if difference_reperes > 3:
                    raise AssertionError(f"{nom} : espace inégal au-dessus et sous les quatre repères")
                difference_bouton = abs(
                    coherence_accueil["ecartBoutonHaut"]
                    - coherence_accueil["ecartReperesHaut"]
                )
                if difference_bouton > 3:
                    raise AssertionError(f"{nom} : bouton Commencer non centré entre le texte et les repères")
                if not coherence_accueil["piedSansVide"]:
                    raise AssertionError(f"{nom} : espace résiduel sous les mentions légales")
            captures[nom] = page.screenshot(full_page=False, animations="disabled")
        page.close()
    return captures


def pixels_identiques(image_a: bytes, image_b: bytes) -> bool:
    a = Image.open(io.BytesIO(image_a)).convert("RGBA")
    b = Image.open(io.BytesIO(image_b)).convert("RGBA")
    return a.size == b.size and ImageChops.difference(a, b).getbbox() is None


def lancer_chromium(automate):
    # Playwright installe sa propre version de Chromium dans la CI. L’utiliser
    # directement évite le mode « single-process », instable pendant la série
    # de captures et responsable de fermetures brutales du navigateur.
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
