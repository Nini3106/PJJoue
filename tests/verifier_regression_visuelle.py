#!/usr/bin/env python3
"""Recette visuelle Chromium de la refonte moderne de PJJoue V1.

Le test rend les vrais écrans à partir des fichiers publics construits, capture
les vues clés et vérifie les régressions qui avaient été rencontrées :
débordements, activités interactives cassées, icônes de modales géantes,
progression trop large et dé du hasard sans animation.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import argparse
import base64
import mimetypes
import os
import platform
import re
from typing import Callable
from urllib.parse import unquote, urlparse

from PIL import Image, ImageChops
from playwright.sync_api import Page, sync_playwright

RACINE = Path(__file__).resolve().parents[1]
SORTIE = RACINE / "test-results" / "regression-visuelle-moderne"
REFERENCES = RACINE / "tests" / "references-visuelles"

PLATEFORME_REFERENCE_PIXELS = "Linux"

def comparaison_pixel_exacte_active(systeme: str | None = None) -> bool:
    """Réserver le pixel-perfect à la plateforme ayant produit les références.

    Les captures de référence sont produites sous Linux/Chromium. Windows utilise
    DirectWrite et les polices système (notamment Segoe UI), ce qui change les
    métriques et l'antialiasing de texte même lorsque HTML/CSS sont identiques.
    Les assertions DOM, dimensions, débordements et scénarios restent exécutées
    partout ; la comparaison bitmap stricte reste canonique sous Linux/CI.
    """
    if os.environ.get("PJJOUE_COMPARAISON_PIXELS_EXACTE", "").strip() == "1":
        return True
    return (systeme or platform.system()) == PLATEFORME_REFERENCE_PIXELS


@dataclass(frozen=True)
class Scenario:
    nom: str
    largeur: int
    hauteur: int
    action: str
    verification: Callable[[Page], None] | None = None


def uri_donnees(chemin: Path) -> str:
    type_mime = mimetypes.guess_type(chemin.name)[0] or "application/octet-stream"
    contenu = base64.b64encode(chemin.read_bytes()).decode("ascii")
    return f"data:{type_mime};base64,{contenu}"


def integrer_images_html(page: str) -> str:
    motif = re.compile(r'(?P<avant>\bsrc=")(?P<chemin>(?:ressources|donnees)/[^"?#]+)(?P<apres>")')

    def remplacer(correspondance: re.Match[str]) -> str:
        chemin = RACINE / correspondance.group("chemin")
        if not chemin.is_file():
            return correspondance.group(0)
        return correspondance.group("avant") + uri_donnees(chemin) + correspondance.group("apres")

    return motif.sub(remplacer, page)


def construire_page() -> str:
    page = (RACINE / "index.html").read_text(encoding="utf-8")
    css = (RACINE / "ressources/styles/pjjoue-principal.css").read_text(encoding="utf-8")
    donnees = (RACINE / "donnees/donnees-pjj.js").read_text(encoding="utf-8")
    moteur = (RACINE / "ressources/moteur-jeu.js").read_text(encoding="utf-8")

    page = re.sub(r'<meta[^>]+http-equiv="Content-Security-Policy"[^>]*/?>', "", page, flags=re.I)
    page = re.sub(
        r'<script\b(?=[^>]*src="ressources/(?:consentement-analytics|analytics-pjjoue|navigation-locale)\.js")[^>]*>\s*</script>',
        "", page, flags=re.I,
    )
    page = re.sub(r'<link\b(?=[^>]*href="ressources/styles/[^"]+\.css")[^>]*>\s*', "", page, flags=re.I)
    page = page.replace("</head>", f"<style>{css}</style></head>", 1)
    page = page.replace("<head>", '<head><base href="http://pjjoue.test/">', 1)
    page = integrer_images_html(page)
    page = re.sub(
        r'<script\b(?=[^>]*src="donnees/donnees-pjj\.js")[^>]*>\s*</script>',
        lambda _: f"<script>{donnees}</script>", page, count=1, flags=re.I,
    )
    page = re.sub(
        r'<script\b(?=[^>]*src="ressources/moteur-jeu\.js")[^>]*>\s*</script>',
        lambda _: f"<script>{moteur}</script>", page, count=1, flags=re.I,
    )
    # Les icônes du parcours 1 sont créées dynamiquement par le moteur : leur
    # chemin doit donc être intégré après l'injection du JavaScript également.
    return integrer_images_html(page)


def question_action(condition: str) -> str:
    return f"""() => {{
        const q = QUESTIONS.find(q => {condition});
        if (!q) throw new Error('Question de test introuvable');
        lancerEtape(q.theme, q.etape);
        etat.indexQuestion = etat.questionsSession.findIndex(candidate => candidate.id === q.id);
        afficherQuestion();
    }}"""


def verifier_association_bureau(page: Page) -> None:
    donnees = page.evaluate("""() => {
        const colonnes = [...document.querySelectorAll('.association-colonne')];
        return colonnes.map(colonne => colonne.getBoundingClientRect().toJSON());
    }""")
    if len(donnees) != 2 or donnees[0]["right"] >= donnees[1]["left"]:
        raise AssertionError("Association bureau : les deux colonnes ne sont pas correctement séparées.")


def verifier_association_mobile(page: Page) -> None:
    donnees = page.evaluate("""() => {
        const colonnes = [...document.querySelectorAll('.association-colonne')];
        return colonnes.map(colonne => colonne.getBoundingClientRect().toJSON());
    }""")
    if len(donnees) != 2 or donnees[1]["top"] <= donnees[0]["top"]:
        raise AssertionError("Association mobile : les colonnes ne sont pas empilées.")


def verifier_modale(page: Page) -> None:
    dimensions = page.evaluate("""() => ({
        pictogramme: document.querySelector('.pjj-fenetre[open] .pjj-fenetre-icone svg')?.getBoundingClientRect().width || 0,
        joker: Math.max(0, ...[...document.querySelectorAll('.pjj-fenetre[open] .joker-icone svg')].map(svg => svg.getBoundingClientRect().width))
    })""")
    if dimensions["pictogramme"] > 42 or dimensions["joker"] > 36:
        raise AssertionError(f"Modale : icône anormalement grande {dimensions}.")


def verifier_correction(page: Page) -> None:
    style = page.evaluate("""() => {
        const correction = document.querySelector('#zoneCorrection');
        const s = getComputedStyle(correction);
        return {outline:s.outlineStyle, largeur:correction.getBoundingClientRect().width};
    }""")
    if style["outline"] != "solid":
        raise AssertionError(f"Correction : le repère de focus validé a changé : {style}.")
    if style["largeur"] <= 200:
        raise AssertionError("Correction : panneau anormalement étroit.")


def verifier_de(page: Page) -> None:
    etat_initial = page.evaluate("""() => {
        const de = document.querySelector('#faceDeParcours');
        return {couleur:getComputedStyle(de).color, animation:getComputedStyle(de).animationName};
    }""")
    if etat_initial["couleur"] in ("rgb(0, 0, 0)", "rgba(0, 0, 0, 1)"):
        raise AssertionError("Défi du hasard : le dé est redevenu noir.")
    # La capture de référence représente la face 1. Sans valeur fixée,
    # le test visuel échoue aléatoirement alors que l'interface est correcte.
    page.evaluate("() => { Math.random = () => 0; }")
    page.click("#boutonLancerLeDe")
    page.wait_for_timeout(40)
    animation = page.evaluate("() => getComputedStyle(document.querySelector('#faceDeParcours')).animationName")
    if animation == "none":
        raise AssertionError("Défi du hasard : animation du dé absente.")
    page.wait_for_timeout(450)
    resultat = page.evaluate("""() => ({
        face: Number(document.querySelector('#faceDeParcours').dataset.face),
        jouerMasque: document.querySelector('#boutonJouerLeTirage').classList.contains('masque')
    })""")
    if not 1 <= resultat["face"] <= 6 or resultat["jouerMasque"]:
        raise AssertionError("Défi du hasard : résultat du lancer non exploitable.")




def verifier_parcours_choix_bureau(page: Page) -> None:
    donnees = page.evaluate("""() => {
        const cartes = [...document.querySelectorAll('#selecteurParcours > .selecteur-parcours-bouton')];
        return {
            nombre: cartes.length,
            hauteurs: cartes.map(carte => carte.getBoundingClientRect().height),
            largeurs: cartes.map(carte => carte.getBoundingClientRect().width),
            svg: cartes.filter(carte => carte.querySelector('.theme-icone svg')).length,
            badges: cartes.map(carte => {
                const badge = carte.querySelector('.selecteur-parcours-statut');
                const rect = badge?.getBoundingClientRect();
                return rect ? {largeur: rect.width, hauteur: rect.height} : null;
            })
        };
    }""")
    if donnees["nombre"] != 6 or donnees["svg"] != 6:
        raise AssertionError(f"Choix des parcours : six cartes avec icônes SVG attendues : {donnees}")
    if comparaison_pixel_exacte_active():
        # Valeurs canoniques de la référence Linux/Chromium.
        hauteurs_attendues = (250, 250, 273, 273, 250, 250)
        if any(abs(mesuree - attendue) > 1 for mesuree, attendue in zip(donnees["hauteurs"], hauteurs_attendues)):
            raise AssertionError(f"Choix des parcours : les proportions validées ont changé : {donnees['hauteurs']}")
    else:
        # Les polices système Windows changent les retours à la ligne et donc la
        # hauteur intrinsèque des cartes, sans modifier le CSS. On conserve les
        # invariants de structure et des bornes assez serrées pour détecter une
        # vraie casse de mise en page.
        if any(245 > hauteur or hauteur > 315 for hauteur in donnees["hauteurs"]):
            raise AssertionError(f"Choix des parcours : hauteur locale incohérente : {donnees['hauteurs']}")
        if max(donnees["hauteurs"]) - min(donnees["hauteurs"]) > 45:
            raise AssertionError(f"Choix des parcours : écarts de hauteur locaux excessifs : {donnees['hauteurs']}")
    if max(donnees["largeurs"]) - min(donnees["largeurs"]) > 1:
        raise AssertionError(f"Choix des parcours : les six cartes doivent conserver la même largeur : {donnees['largeurs']}")
    if any(badge is None for badge in donnees["badges"]):
        raise AssertionError(f"Choix des parcours : badge de statut manquant : {donnees['badges']}")
    largeurs_badges = [badge["largeur"] for badge in donnees["badges"]]
    hauteurs_badges = [badge["hauteur"] for badge in donnees["badges"]]
    if comparaison_pixel_exacte_active():
        hauteurs_badges_attendues = (18, 18, 22.6, 18, 18, 18)
        if (max(largeurs_badges) - min(largeurs_badges) > 1
                or any(abs(mesuree - attendue) > 1 for mesuree, attendue in zip(hauteurs_badges, hauteurs_badges_attendues))):
            raise AssertionError(f"Choix des parcours : les badges ont changé de proportions : {donnees['badges']}")
    elif any(15 > hauteur or hauteur > 36 for hauteur in hauteurs_badges):
        raise AssertionError(f"Choix des parcours : hauteur locale des badges incohérente : {donnees['badges']}")


def verifier_parcours_choix_mobile(page: Page) -> None:
    donnees = page.evaluate("""() => {
        const cartes = [...document.querySelectorAll('#selecteurParcours > .selecteur-parcours-bouton')];
        return {
            nombre: cartes.length,
            hauteurs: cartes.map(carte => carte.getBoundingClientRect().height),
            largeurs: cartes.map(carte => carte.getBoundingClientRect().width),
            viewport: document.documentElement.clientWidth
        };
    }""")
    if donnees["nombre"] != 6:
        raise AssertionError(f"Choix des parcours mobile : six cartes attendues : {donnees}")
    if comparaison_pixel_exacte_active():
        hauteurs_attendues = (250, 250, 271.4, 271.4, 250, 250)
        if any(abs(mesuree - attendue) > 1 for mesuree, attendue in zip(donnees["hauteurs"], hauteurs_attendues)):
            raise AssertionError(f"Choix des parcours mobile : les proportions validées ont changé : {donnees['hauteurs']}")
    else:
        if any(220 > hauteur or hauteur > 350 for hauteur in donnees["hauteurs"]):
            raise AssertionError(f"Choix des parcours mobile : hauteur locale incohérente : {donnees['hauteurs']}")
        if max(donnees["hauteurs"]) - min(donnees["hauteurs"]) > 70:
            raise AssertionError(f"Choix des parcours mobile : écarts de hauteur locaux excessifs : {donnees['hauteurs']}")
    if max(donnees["largeurs"]) - min(donnees["largeurs"]) > 1:
        raise AssertionError(f"Choix des parcours mobile : cartes de largeurs différentes : {donnees['largeurs']}")
    if max(donnees["largeurs"]) > donnees["viewport"]:
        raise AssertionError(f"Choix des parcours mobile : carte plus large que le viewport : {donnees}")


def verifier_icones_entrainement(page: Page) -> None:
    donnees = page.evaluate("""() => ({
        svg: document.querySelectorAll('.entrainement-carte .entrainement-icone svg').length,
        images: document.querySelectorAll('.entrainement-carte .entrainement-icone img').length,
        titreVisible: Boolean(document.querySelector('#entrainement h1')?.getBoundingClientRect().height),
        texte: document.querySelector('#entrainement')?.innerText?.trim().length || 0
    })""")
    if donnees["svg"] != 2 or donnees["images"] != 0:
        raise AssertionError(f"Entraînement : les deux icônes doivent utiliser le SVG moderne : {donnees}")
    if not donnees["titreVisible"] or donnees["texte"] < 100:
        raise AssertionError(f"Entraînement : le contenu principal n’est pas visible : {donnees}")


def verifier_entrainement_bureau(page: Page) -> None:
    verifier_icones_entrainement(page)
    verifier_de(page)


def verifier_entrainement_mobile(page: Page) -> None:
    verifier_icones_entrainement(page)


def verifier_options_entrainement(page: Page) -> None:
    donnees = page.evaluate("""() => {
        const cartes = [...document.querySelectorAll('.entrainement-carte')];
        return cartes.map(carte => {
            const options = carte.querySelector('.entrainement-options-avancees');
            const commencer = carte.querySelector('.entrainement-lancer');
            const rectangleOptions = options?.getBoundingClientRect();
            const rectangleCommencer = commencer?.getBoundingClientRect();
            return {
                optionsOuvertes: Boolean(options?.open),
                secondesVisibles: !carte.querySelector('.entrainement-chronometre-secondes')
                    ?.classList.contains('masque'),
                espace: rectangleOptions && rectangleCommencer
                    ? rectangleCommencer.top - rectangleOptions.bottom
                    : -1,
                debordement: carte.scrollWidth - carte.clientWidth
            };
        });
    }""")
    if (
        len(donnees) != 2
        or any(not carte["optionsOuvertes"] for carte in donnees)
        or any(not carte["secondesVisibles"] for carte in donnees)
        or any(carte["espace"] < 15 for carte in donnees)
        or abs(donnees[0]["espace"] - donnees[1]["espace"]) > 1
        or any(carte["debordement"] > 1 for carte in donnees)
    ):
        raise AssertionError(
            f"Entraînement : les options avancées doivent être séparées du bouton Commencer : {donnees}"
        )


def verifier_grille_cartes_parcours_bureau(page: Page) -> None:
    donnees = page.evaluate("""() => {
        const ligne = document.querySelector('#ligneParcours1');
        const cartes = [...ligne.querySelectorAll('.chemin-etape-carte')];
        const rectangleLigne = ligne.getBoundingClientRect();
        const rectangles = cartes.map(carte => carte.getBoundingClientRect());
        const debordementsTitres = [...document.querySelectorAll('.chemin-etape-titre')]
            .map(titre => {
                const carte = titre.closest('.chemin-etape-carte');
                const rectangleTitre = titre.getBoundingClientRect();
                const rectangleCarte = carte.getBoundingClientRect();
                return {
                    texte: titre.textContent.trim(),
                    debordementInterne: titre.scrollWidth - titre.clientWidth,
                    horsCarteGauche: rectangleCarte.left - rectangleTitre.left,
                    horsCarteDroite: rectangleTitre.right - rectangleCarte.right
                };
            })
            .filter(titre => titre.debordementInterne > 1
                || titre.horsCarteGauche > 1
                || titre.horsCarteDroite > 1);
        return {
            nombreCartesPremiereLigne: cartes.length,
            nombreColonnes: getComputedStyle(ligne).gridTemplateColumns
                .split(/\\s+/).filter(Boolean).length,
            largeurLigne: rectangleLigne.width,
            largeursCartes: rectangles.map(rectangle => rectangle.width),
            espaceVideGauche: rectangles.length ? rectangles[0].left - rectangleLigne.left : 999,
            espaceVideDroite: rectangles.length ? rectangleLigne.right - rectangles.at(-1).right : 999,
            debordementsTitres
        };
    }""")
    if (
        donnees["nombreCartesPremiereLigne"] != 3
        or donnees["nombreColonnes"] != 3
        or donnees["largeurLigne"] < 900
        or min(donnees["largeursCartes"], default=0) < 300
        or max(donnees["largeursCartes"], default=0) - min(donnees["largeursCartes"], default=0) > 1
        or abs(donnees["espaceVideGauche"]) > 1
        or abs(donnees["espaceVideDroite"]) > 1
        or donnees["debordementsTitres"]
    ):
        raise AssertionError(
            f"Parcours bureau : la grille doit employer toute la largeur sans déborder : {donnees}"
        )


def verifier_parcours_detail_bureau(page: Page) -> None:
    donnees = page.evaluate("""() => {
        const cartes = [...document.querySelectorAll('.chemin-etape-carte[data-etape]')];
        const finales = [
            document.querySelector('.chemin-etape-carte[data-etape="10"]'),
            document.querySelector('.chemin-etape-carte[data-etape="11"]'),
            document.querySelector('.chemin-evaluation-carte')
        ];
        return {
            choixMasque: document.querySelector('#vueChoixParcours')?.classList.contains('masque')
                && getComputedStyle(document.querySelector('#vueChoixParcours')).display === 'none',
            detailVisible: !document.querySelector('#vueDetailParcours')?.classList.contains('masque')
                && getComputedStyle(document.querySelector('#vueDetailParcours')).display !== 'none',
            nombreCartes: cartes.length,
            nombreCartesVisibles: cartes.filter(carte => carte.getBoundingClientRect().height > 0).length,
            nombreSvg: cartes.filter(carte => carte.querySelector('.chemin-etape-icone svg')).length,
            nombreImages: cartes.filter(carte => carte.querySelector('.chemin-etape-icone img')).length,
            nombreImagesChargees: cartes.filter(carte => {
                const image = carte.querySelector('.chemin-etape-icone img');
                return image?.complete && image.naturalWidth > 0;
            }).length,
            iconeEntete: document.querySelector('#iconeParcoursSelectionne svg')?.getBoundingClientRect().width || 0,
            largeursFinales: finales.map(element => element ? element.getBoundingClientRect().width : 0),
            hauteursPremiereLigne: cartes.slice(0, 3).map(element => element.getBoundingClientRect().height)
        };
    }""")
    if (not donnees["choixMasque"] or not donnees["detailVisible"]
            or donnees["nombreCartes"] != 11 or donnees["nombreCartesVisibles"] != 11
            or donnees["nombreSvg"] != 0 or donnees["nombreImages"] != 11 or donnees["nombreImagesChargees"] != 11
            or donnees["iconeEntete"] < 24):
        raise AssertionError(f"Parcours : système d’icônes incohérent : {donnees}")
    if max(donnees["largeursFinales"]) - min(donnees["largeursFinales"]) > 1:
        raise AssertionError(f"Parcours : cartes finales de largeurs différentes : {donnees['largeursFinales']}")
    if max(donnees["hauteursPremiereLigne"]) - min(donnees["hauteursPremiereLigne"]) > 1:
        raise AssertionError(f"Parcours : cartes d’une même ligne de hauteurs différentes : {donnees['hauteursPremiereLigne']}")
    verifier_grille_cartes_parcours_bureau(page)


def verifier_parcours_crimes_bureau(page: Page) -> None:
    donnees = page.evaluate("""() => ({
        theme: etat.theme,
        nombreCartes: document.querySelectorAll('.chemin-etape-carte[data-etape]').length,
        nombreSvg: document.querySelectorAll('.chemin-etape-carte[data-etape] .chemin-etape-icone svg').length,
        titres: [...document.querySelectorAll('.chemin-etape-titre')].map(titre => titre.textContent.trim())
    })""")
    if (
        donnees["theme"] != "matiere_criminelle_peines"
        or donnees["nombreCartes"] != 11
        or donnees["nombreSvg"] != 11
        or not any("Emprisonnement" in titre for titre in donnees["titres"])
    ):
        raise AssertionError(f"Parcours crimes : contenu de contrôle introuvable : {donnees}")
    verifier_grille_cartes_parcours_bureau(page)


def verifier_chronometre_parcours(page: Page) -> None:
    donnees = page.evaluate("""() => {
        const panneau = document.querySelector('.parcours-chronometre-panneau');
        const secondes = document.querySelector('#secondesChronometreParcours');
        const groupes = [
            document.querySelector('#choixChronometreParcours'),
            secondes?.querySelector('.entrainement-secondes-groupe')
        ].filter(Boolean);
        const boutons = groupes.flatMap(groupe => [...groupe.querySelectorAll('button')]);
        return {
            panneauVisible: Boolean(panneau) && getComputedStyle(panneau).display !== 'none',
            secondesVisibles: Boolean(secondes)
                && !secondes.classList.contains('masque')
                && getComputedStyle(secondes).display !== 'none',
            affichagesGroupes: groupes.map(groupe => getComputedStyle(groupe).display),
            boutons: boutons.map(bouton => {
                const style = getComputedStyle(bouton);
                const plage = document.createRange();
                plage.selectNodeContents(bouton);
                const largeurTexte = plage.getBoundingClientRect().width;
                const largeurAttendue = largeurTexte
                    + Number.parseFloat(style.paddingLeft)
                    + Number.parseFloat(style.paddingRight)
                    + Number.parseFloat(style.borderLeftWidth)
                    + Number.parseFloat(style.borderRightWidth);
                const rectangle = bouton.getBoundingClientRect();
                return {
                    texte: bouton.textContent.trim(),
                    largeur: rectangle.width,
                    hauteur: rectangle.height,
                    surplus: rectangle.width - largeurAttendue
                };
            })
        };
    }""")
    boutons_trop_larges = [
        bouton for bouton in donnees["boutons"]
        if bouton["surplus"] > 2 or bouton["hauteur"] < 44
    ]
    if (
        not donnees["panneauVisible"]
        or not donnees["secondesVisibles"]
        or donnees["affichagesGroupes"] != ["flex", "flex"]
        or len(donnees["boutons"]) != 6
        or boutons_trop_larges
    ):
        raise AssertionError(
            f"Chronomètre du parcours : boutons non ajustés à leur texte : {donnees}"
        )


def verifier_parcours_detail_mobile(page: Page) -> None:
    donnees = page.evaluate("""() => ({
        choixMasque: document.querySelector('#vueChoixParcours')?.classList.contains('masque')
            && getComputedStyle(document.querySelector('#vueChoixParcours')).display === 'none',
        detailVisible: !document.querySelector('#vueDetailParcours')?.classList.contains('masque')
            && getComputedStyle(document.querySelector('#vueDetailParcours')).display !== 'none',
        nombreCartes: document.querySelectorAll('.chemin-etape-carte[data-etape]').length,
        nombreCartesVisibles: [...document.querySelectorAll('.chemin-etape-carte[data-etape]')]
            .filter(carte => carte.getBoundingClientRect().height > 0).length,
        nombreSvg: document.querySelectorAll('.chemin-etape-carte[data-etape] .chemin-etape-icone svg').length,
        nombreImages: document.querySelectorAll('.chemin-etape-carte[data-etape] .chemin-etape-icone img').length,
        nombreImagesChargees: [...document.querySelectorAll('.chemin-etape-carte[data-etape] .chemin-etape-icone img')]
            .filter(image => image.complete && image.naturalWidth > 0).length,
        largeurMax: Math.max(...[...document.querySelectorAll('.chemin-etape-carte[data-etape], .chemin-evaluation-carte')].map(element => element.getBoundingClientRect().right)),
        viewport: document.documentElement.clientWidth
    })""")
    if (not donnees["choixMasque"] or not donnees["detailVisible"]
            or donnees["nombreCartes"] != 11 or donnees["nombreCartesVisibles"] != 11
            or donnees["nombreSvg"] != 0 or donnees["nombreImages"] != 11 or donnees["nombreImagesChargees"] != 11):
        raise AssertionError(f"Parcours mobile : les 11 icônes illustrées validées ne sont pas présentes : {donnees}")
    if donnees["largeurMax"] > donnees["viewport"] + 1:
        raise AssertionError(f"Parcours mobile : une carte dépasse du viewport : {donnees}")


def verifier_palette_reference(page: Page) -> None:
    donnees = page.evaluate("""() => {
        const racine = getComputedStyle(document.documentElement);
        const corps = getComputedStyle(document.body);
        const entete = getComputedStyle(document.querySelector('header.entete'));
        return {
            fondImage: corps.backgroundImage,
            entete: entete.backgroundColor,
            jaune: racine.getPropertyValue('--jaune-interface').trim(),
            bleuNuit: racine.getPropertyValue('--bleu-nuit-950').trim(),
            surface: racine.getPropertyValue('--surface-carte').trim(),
            page: racine.getPropertyValue('--surface-page').trim(),
            texte: racine.getPropertyValue('--texte').trim()
        };
    }""")
    attendu = {
        "entete": "rgb(11, 49, 93)",
        "jaune": "#ffc83d",
        "bleuNuit": "#0a2a52",
        "surface": "#0b3d70",
        "page": "",
        "texte": "#f7f8ff",
    }
    for cle, valeur in attendu.items():
        if donnees.get(cle) != valeur:
            raise AssertionError(f"Palette PJJoue incohérente pour {cle} : {donnees}")
    if donnees.get("fondImage") != "none":
        raise AssertionError(f"Palette PJJoue : un ancien fond de page parasite est revenu : {donnees}")


def verifier_accueil_nouveau(page: Page) -> None:
    verifier_palette_reference(page)
    donnees = page.evaluate("""() => ({
        dejaJoue: sauvegarde.aDejaJoue,
        boutonPrincipal: document.querySelector('#boutonCommencer')?.textContent?.trim(),
        ancienBoutonAbsent: !document.querySelector('#boutonEntrainementLibreAccueil')
    })""")
    if donnees["dejaJoue"] or not donnees["ancienBoutonAbsent"] or "Choisir" not in (donnees["boutonPrincipal"] or ""):
        raise AssertionError(f"Accueil nouveau joueur : l’action principale est incohérente : {donnees}")


def verifier_accueil_retour(page: Page) -> None:
    donnees = page.evaluate("""() => ({
        dejaJoue: sauvegarde.aDejaJoue,
        boutonPrincipal: document.querySelector('#boutonCommencer')?.textContent?.trim(),
        ancienBoutonAbsent: !document.querySelector('#boutonEntrainementLibreAccueil')
    })""")
    if not donnees["dejaJoue"] or not donnees["ancienBoutonAbsent"] or "Reprendre" not in (donnees["boutonPrincipal"] or ""):
        raise AssertionError(f"Accueil joueur connu : la reprise du parcours doit être proposée : {donnees}")


def verifier_menu_principal(page: Page) -> None:
    donnees = page.evaluate("""() => ({
        ouvert: document.querySelector('header.entete')?.classList.contains('menu-mobile-ouvert'),
        plus: Boolean(document.querySelector('#boutonPlus, .navigation-plus, #menuNavigationPlus')),
        carnet: document.querySelector('#boutonCarnetDeParcours')?.textContent?.trim(),
        nombreEntrees: document.querySelectorAll('#menuPrincipal > button, #menuPrincipal > a').length,
        visible: getComputedStyle(document.querySelector('#menuPrincipal')).display !== 'none'
    })""")
    if not donnees["ouvert"] or not donnees["visible"] or donnees["plus"]:
        raise AssertionError(f"Menu principal : état invalide : {donnees}")
    if donnees["carnet"] != "Carnet de parcours":
        raise AssertionError(f"Menu principal : libellé du carnet incorrect : {donnees}")
    if donnees["nombreEntrees"] < 8:
        raise AssertionError(f"Menu principal : toutes les entrées ne sont pas réunies : {donnees}")


def verifier_revision_supports(page: Page) -> None:
    donnees = page.evaluate("""() => ({
        supports: document.querySelectorAll('#supports details.support-revision').length,
        juridictions: document.querySelectorAll('#supports details.supports-juridiction').length,
        imprimable: /imprimable/i.test(document.querySelector('#supports')?.innerText || ''),
        aa: /pièces que l[’']AA|lecture administrative/i.test(document.querySelector('#supports')?.innerText || ''),
        phraseTechnique: /15 supports transmis|reconstruits directement en HTML/i.test(document.querySelector('#supports')?.innerText || ''),
        ancienneRegle: /deux réussites|2 réussites/i.test(document.querySelector('#supports')?.innerText || ''),
        ordre: Object.fromEntries(
            [...document.querySelectorAll('#supports details.supports-juridiction')].map(groupe => [
                groupe.id,
                [...groupe.querySelectorAll(':scope > .supports-juridiction-contenu > .support-revision')].map(support => support.id)
            ])
        )
    })""")
    ordre_attendu = {
        "supports-reperes-pjj": ["support-organisation-pjj", "support-mesures-educatives", "support-sigles-essentiels", "support-jeu-sigles"],
        "supports-je": ["support-pratique-je", "support-synthese-je"],
        "supports-tpe": ["support-pratique-tpe", "support-synthese-tpe"],
        "supports-ji": ["support-pratique-ji", "support-synthese-ji"],
        "supports-jld": ["support-pratique-jld", "support-synthese-jld"],
        "supports-cam": ["support-pratique-cam", "support-synthese-cam"],
        "supports-jap": ["support-pratique-jap", "support-synthese-jap", "support-fiche-jap", "support-complement-jap"],
        "supports-transversaux": ["support-tableau-maitre"],
    }
    if (
        donnees["supports"] != 15
        or donnees["juridictions"] != 8
        or donnees["imprimable"]
        or donnees["aa"]
        or donnees["phraseTechnique"]
        or donnees["ancienneRegle"]
        or donnees["ordre"] != ordre_attendu
    ):
        raise AssertionError(f"Réviser : organisation des supports incorrecte : {donnees}")

    regle_erreur = page.evaluate("""() => {
        const question = QUESTIONS.filter(q => !q.estEvaluationFinale)[6];
        const ancienMode = etat.mode;
        const ancienneErreur = sauvegarde.erreurs[question.id];
        sauvegarde.erreurs[question.id] = {maitrisee:false,nombreErreurs:2,reussites:0,theme:question.theme};
        etat.mode = 'revision';
        traiterReussiteAutonome(question, false);
        const resultat = {...sauvegarde.erreurs[question.id]};
        etat.mode = ancienMode;
        if (ancienneErreur) sauvegarde.erreurs[question.id] = ancienneErreur;
        else delete sauvegarde.erreurs[question.id];
        return resultat;
    }""")
    if not regle_erreur.get("maitrisee") or regle_erreur.get("reussites") != 1:
        raise AssertionError(f"Réviser : une réussite doit suffire à maîtriser l’erreur : {regle_erreur}")


def verifier_supports_ouvert(page: Page, mobile: bool = False) -> None:
    donnees = page.evaluate("""() => {
        const categorie = document.querySelector('#supports-je');
        const ressource = document.querySelector('#support-pratique-je');
        const action = categorie?.querySelector(':scope > summary .support-juridiction-action');
        const boutonRefermer = document.querySelector('#boutonRefermerSupports');
        const entetes = [
            categorie?.querySelector(':scope > summary'),
            ressource?.querySelector(':scope > summary')
        ].filter(Boolean);
        const lireChevron = chevron => {
            if (!chevron)
                return {transformation: 'absent', retourne: false};
            const transformation = getComputedStyle(chevron).transform;
            if (!transformation || transformation === 'none')
                return {transformation, retourne: false};
            const matrice = new DOMMatrixReadOnly(transformation);
            return {
                transformation,
                retourne: matrice.a < -0.99 && matrice.d < -0.99
            };
        };
        const rectangleAction = action?.getBoundingClientRect();
        const styleAction = action ? getComputedStyle(action) : null;
        const viewport = document.documentElement.clientWidth;
        return {
            categorieOuverte: Boolean(categorie?.open),
            ressourceOuverte: Boolean(ressource?.open),
            detailsOuverts: document.querySelectorAll('#supports details[open]').length,
            action: action?.textContent?.trim() || '',
            actionVisible: Boolean(rectangleAction)
                && rectangleAction.width > 0
                && rectangleAction.height > 0
                && styleAction?.display !== 'none'
                && styleAction?.visibility !== 'hidden',
            chevrons: [
                lireChevron(categorie?.querySelector(':scope > summary .support-juridiction-chevron')),
                lireChevron(ressource?.querySelector(':scope > summary .support-revision-chevron'))
            ],
            boutonRefermerActif: Boolean(boutonRefermer) && !boutonRefermer.disabled,
            viewport,
            debordementPage: document.documentElement.scrollWidth - viewport,
            entetes: entetes.map(entete => {
                const rectangle = entete.getBoundingClientRect();
                const enfantsHorsBornes = [...entete.children].filter(enfant => {
                    const enfantRectangle = enfant.getBoundingClientRect();
                    return enfantRectangle.left < rectangle.left - 1
                        || enfantRectangle.right > rectangle.right + 1;
                }).map(enfant => enfant.className || enfant.tagName);
                return {
                    gauche: rectangle.left,
                    droite: rectangle.right,
                    largeur: rectangle.width,
                    hauteur: rectangle.height,
                    debordementInterne: entete.scrollWidth - entete.clientWidth,
                    enfantsHorsBornes
                };
            })
        };
    }""")
    if (
        not donnees["categorieOuverte"]
        or not donnees["ressourceOuverte"]
        or donnees["detailsOuverts"] != 2
    ):
        raise AssertionError(f"Supports ouverts : les deux niveaux doivent être ouverts : {donnees}")
    if donnees["action"] != "Fermer" or not donnees["actionVisible"]:
        raise AssertionError(f"Supports ouverts : l’action « Fermer » doit être visible : {donnees}")
    if not all(chevron["retourne"] for chevron in donnees["chevrons"]):
        raise AssertionError(f"Supports ouverts : les deux chevrons doivent être retournés : {donnees}")
    if not donnees["boutonRefermerActif"]:
        raise AssertionError(f"Supports ouverts : le bouton Tout refermer doit être actif : {donnees}")

    if mobile:
        entetes_invalides = [
            entete for entete in donnees["entetes"]
            if entete["gauche"] < -1
            or entete["droite"] > donnees["viewport"] + 1
            or entete["largeur"] < 44
            or entete["hauteur"] < 44
            or entete["debordementInterne"] > 1
            or entete["enfantsHorsBornes"]
        ]
        if donnees["debordementPage"] > 1 or entetes_invalides:
            raise AssertionError(
                f"Supports ouverts mobile : en-tête hors viewport, débordant ou inférieur à 44 px : {donnees}"
            )

    page.click("#boutonRefermerSupports")
    page.wait_for_function("""() =>
        document.querySelectorAll('#supports details[open]').length === 0
        && document.querySelector('#boutonRefermerSupports')?.disabled
    """)
    fermeture = page.evaluate("""() => ({
        ouverts: document.querySelectorAll('#supports details[open]').length,
        action: document.querySelector('#supports-je .support-juridiction-action')?.textContent?.trim() || '',
        boutonDesactive: Boolean(document.querySelector('#boutonRefermerSupports')?.disabled)
    })""")
    if fermeture != {"ouverts": 0, "action": "Ouvrir", "boutonDesactive": True}:
        raise AssertionError(f"Supports ouverts : Tout refermer ne referme pas tous les détails : {fermeture}")

    # Restaurer l’état ouvert afin que la capture de ce scénario reste représentative.
    page.evaluate("""() => {
        document.querySelector('#supports-je').open = true;
        document.querySelector('#support-pratique-je').open = true;
        window.scrollTo(0, 0);
    }""")
    page.wait_for_function("""() =>
        document.querySelector('#supports-je .support-juridiction-action')?.textContent?.trim() === 'Fermer'
        && !document.querySelector('#boutonRefermerSupports')?.disabled
    """)
    page.wait_for_timeout(220)


def verifier_supports_ouvert_bureau(page: Page) -> None:
    verifier_supports_ouvert(page)


def verifier_supports_ouvert_mobile(page: Page) -> None:
    verifier_supports_ouvert(page, mobile=True)


def verifier_progression_peuplee(page: Page, mobile: bool = False) -> None:
    donnees = page.evaluate(r"""() => {
        const lireRectangle = element => {
            const rectangle = element?.getBoundingClientRect();
            return rectangle ? {
                gauche: rectangle.left,
                droite: rectangle.right,
                haut: rectangle.top,
                bas: rectangle.bottom,
                largeur: rectangle.width,
                hauteur: rectangle.height
            } : null;
        };
        const progression = document.querySelector('#progression');
        const studio = progression?.querySelector('.progression-studio');
        const vueEnsemble = progression?.querySelector('.progression-vue-ensemble');
        const explorateur = progression?.querySelector('.progression-explorateur');
        const sections = [vueEnsemble, explorateur].filter(Boolean);
        const metriques = [...progression.querySelectorAll(
            '.progression-vue-ensemble-metrics .progression-statistique'
        )];
        const texteGlobal = progression.querySelector('.progression-global')?.innerText || '';
        const objectifs = texteGlobal.match(/(\d+)\s*\/\s*(\d+)\s*objectifs validés/i);
        const pourcentageTexte = progression.querySelector('.progression-score strong')?.textContent || '';
        const pourcentage = Number(pourcentageTexte.match(/\d+/)?.[0] || -1);
        const rail = progression.querySelector('.progression-rail[role="progressbar"]');
        const onglets = [...progression.querySelectorAll('#listeProgressionParcours [role="tab"]')];
        const ongletSelectionne = onglets.find(onglet => onglet.getAttribute('aria-selected') === 'true');
        const panneau = progression.querySelector('#detailProgressionParcours');
        const statutInitial = panneau?.querySelector('.progression-parcours-statut');
        const jalonEntame = progression.querySelector('.progression-jalon.est-entame');
        const jalonComplet = progression.querySelector('.progression-jalon.est-complet');
        const jalonInitial = progression.querySelector('.progression-jalon.est-a-decouvrir');
        const couleurInitiale = jalonInitial ? getComputedStyle(jalonInitial).color : '';
        const couleurEntamee = jalonEntame ? getComputedStyle(jalonEntame).color : '';
        const couleurComplete = jalonComplet ? getComputedStyle(jalonComplet).color : '';
        const marqueComplete = jalonComplet?.querySelector('b');
        const ongletComplet = onglets.find(onglet => onglet.dataset.theme === THEMES[0].id);
        const identifiantOngletInitial = ongletSelectionne?.id || '';
        ongletComplet?.click();
        const bascule = {
            statutComplet: panneau?.querySelector('.progression-parcours-statut')?.textContent?.trim() || '',
            evaluationReussie: panneau?.querySelector('.progression-etat-reussie')?.textContent?.trim() || '',
            panneauNommeParComplet: panneau?.getAttribute('aria-labelledby') === ongletComplet?.id
        };
        ongletSelectionne?.click();
        bascule.retourOngletInitial = panneau?.getAttribute('aria-labelledby') === identifiantOngletInitial
            && ongletSelectionne?.getAttribute('aria-selected') === 'true';
        return {
            objectifs: objectifs ? {
                valides: Number(objectifs[1]),
                total: Number(objectifs[2])
            } : null,
            pourcentage,
            rail: {
                valeur: Number(rail?.getAttribute('aria-valuenow') || -1),
                texte: rail?.getAttribute('aria-valuetext') || ''
            },
            decompositionVisible: /66 étapes\s*·\s*6 évaluations/i.test(texteGlobal),
            termeTechniqueVisible: /\bjalons?\b/i.test(texteGlobal),
            metriques: metriques.map(metrique => ({
                ...lireRectangle(metrique),
                libelle: metrique.querySelector('span')?.textContent?.trim() || '',
                valeur: Number(metrique.querySelector('strong')?.textContent || 0)
            })),
            activite: {
                etapesAbordees: Number(document.querySelector('#experienceProgression')?.textContent || 0),
                questionsTravaillees: Number(document.querySelector('#questionsJoueesProgression')?.textContent || 0),
                questionsARevoir: Number(document.querySelector('#erreursProgression')?.textContent || 0),
                etapesMaitrisees: Number(document.querySelector('#etapesMaitriseesProgression')?.textContent || 0),
                libelleQuestionsARevoir: document.querySelector('#erreursProgression')
                    ?.parentElement?.querySelector('span')?.textContent?.trim() || '',
                evaluationsReussies: THEMES.filter(theme => estEvaluationFinaleReussie(theme.id)).length
            },
            etats: {
                entames: progression.querySelectorAll('.progression-jalon.est-entame').length,
                complets: progression.querySelectorAll('.progression-jalon.est-complet').length,
                statutInitial: statutInitial?.textContent?.trim() || '',
                couleursDistinctes: Boolean(couleurInitiale)
                    && couleurEntamee !== couleurInitiale
                    && couleurComplete !== couleurInitiale,
                marqueComplete: marqueComplete
                    ? getComputedStyle(marqueComplete, '::after').content
                    : ''
            },
            onglets: {
                roleListe: progression.querySelector('#listeProgressionParcours')?.getAttribute('role') || '',
                nombre: onglets.length,
                identifiants: onglets.map(onglet => onglet.id),
                controles: onglets.map(onglet => onglet.getAttribute('aria-controls')),
                selectionnes: onglets.filter(
                    onglet => onglet.getAttribute('aria-selected') === 'true'
                ).map(onglet => ({id: onglet.id, tabIndex: onglet.tabIndex})),
                tabIndexInactifs: onglets.filter(
                    onglet => onglet.getAttribute('aria-selected') !== 'true'
                ).map(onglet => onglet.tabIndex),
                panneauRole: panneau?.getAttribute('role') || '',
                panneauNommePar: panneau?.getAttribute('aria-labelledby') || '',
                panneauTabIndex: panneau?.tabIndex ?? -1
            },
            bascule,
            disposition: {
                studioAlignement: studio ? getComputedStyle(studio).alignItems : '',
                fondPage: getComputedStyle(document.body).backgroundColor,
                vueEnsemble: lireRectangle(vueEnsemble),
                explorateur: lireRectangle(explorateur),
                sections: sections.map(section => {
                    const style = getComputedStyle(section);
                    const rectangle = section.getBoundingClientRect();
                    const contenu = section.querySelector(':scope > .progression-colonne-contenu');
                    const rectangleContenu = contenu?.getBoundingClientRect();
                    const entete = section.querySelector(':scope > header');
                    const premierBloc = contenu?.firstElementChild;
                    return {
                        espaceVideBas: rectangleContenu ? rectangle.bottom - rectangleContenu.bottom : 999,
                        contenuHaut: rectangleContenu?.top || 0,
                        enteteHaut: entete?.getBoundingClientRect().top || 0,
                        enteteBas: entete?.getBoundingClientRect().bottom || 0,
                        premierBlocHaut: premierBloc?.getBoundingClientRect().top || 0,
                        premierBlocHauteur: premierBloc?.getBoundingClientRect().height || 0,
                        texteExplicatif: entete?.querySelector('p')?.textContent?.trim() || '',
                        texteExplicatifHaut: entete?.querySelector('p')?.getBoundingClientRect().top || 0,
                        paddingHaut: Number.parseFloat(style.paddingTop) || 0,
                        paddingBas: Number.parseFloat(style.paddingBottom) || 0,
                        bordureHaut: Number.parseFloat(style.borderTopWidth) || 0,
                        fond: style.backgroundColor,
                        ombre: style.boxShadow
                    };
                })
            }
        };
    }""")

    objectifs = donnees["objectifs"]
    if not objectifs or objectifs["total"] != 72 or objectifs["valides"] != 15:
        raise AssertionError(
            f"Progression peuplée : 15 objectifs validés sur 72 attendus : {donnees}"
        )
    pourcentage_attendu = round(objectifs["valides"] / objectifs["total"] * 100)
    if (
        donnees["pourcentage"] != pourcentage_attendu
        or donnees["rail"]["valeur"] != pourcentage_attendu
        or f"{objectifs['valides']} objectifs validés sur 72" not in donnees["rail"]["texte"]
        or not donnees["decompositionVisible"]
        or donnees["termeTechniqueVisible"]
    ):
        raise AssertionError(
            f"Progression peuplée : calcul global ou vocabulaire incohérent : {donnees}"
        )

    activite = donnees["activite"]
    if (
        activite["etapesAbordees"] != 15
        or activite["questionsTravaillees"] <= 0
        or activite["questionsARevoir"] != 4
        or activite["etapesMaitrisees"] != 14
        or activite["libelleQuestionsARevoir"] != "Questions à revoir"
        or activite["evaluationsReussies"] < 1
    ):
        raise AssertionError(f"Progression peuplée : activité de test incorrecte : {activite}")

    metriques = donnees["metriques"]
    if (
        len(metriques) != 4
        or abs(metriques[0]["haut"] - metriques[1]["haut"]) > 1
        or abs(metriques[2]["haut"] - metriques[3]["haut"]) > 1
        or abs(metriques[0]["hauteur"] - metriques[1]["hauteur"]) > 1
        or abs(metriques[2]["hauteur"] - metriques[3]["hauteur"]) > 1
    ):
        raise AssertionError(
            f"Progression peuplée : les quatre métriques doivent former deux lignes régulières : {metriques}"
        )

    etats = donnees["etats"]
    if (
        etats["entames"] < 1
        or etats["complets"] < 1
        or etats["statutInitial"] != "Entamé"
        or not etats["couleursDistinctes"]
        or "✓" not in etats["marqueComplete"]
        or donnees["bascule"]["statutComplet"] != "Complet"
        or "Évaluation réussie" not in donnees["bascule"]["evaluationReussie"]
    ):
        raise AssertionError(f"Progression peuplée : états entamé/complet illisibles : {donnees}")

    onglets = donnees["onglets"]
    selectionnes = onglets["selectionnes"]
    if (
        onglets["roleListe"] != "tablist"
        or onglets["nombre"] != 6
        or len(set(onglets["identifiants"])) != 6
        or any(not identifiant for identifiant in onglets["identifiants"])
        or set(onglets["controles"]) != {"detailProgressionParcours"}
        or len(selectionnes) != 1
        or selectionnes[0]["tabIndex"] != 0
        or any(tab_index != -1 for tab_index in onglets["tabIndexInactifs"])
        or onglets["panneauRole"] != "tabpanel"
        or onglets["panneauNommePar"] != selectionnes[0]["id"]
        or onglets["panneauTabIndex"] != 0
        or not donnees["bascule"]["panneauNommeParComplet"]
        or not donnees["bascule"]["retourOngletInitial"]
    ):
        raise AssertionError(f"Progression peuplée : relation onglets/panneau invalide : {donnees}")

    disposition = donnees["disposition"]
    sections_mal_encadrees = [
        section for section in disposition["sections"]
        if abs(section["espaceVideBas"] - section["paddingBas"] - section["bordureHaut"]) > 2
        or section["paddingHaut"] < 18
        or section["paddingBas"] < 18
        or section["bordureHaut"] < 1
        or section["fond"] in ("rgba(0, 0, 0, 0)", "transparent")
        or section["ombre"] == "none"
    ]
    if disposition["studioAlignement"] != "stretch" or sections_mal_encadrees:
        raise AssertionError(
            f"Progression peuplée : les deux cadres doivent rester complets et réguliers : {disposition}"
        )
    if any(not section["texteExplicatif"] for section in disposition["sections"]):
        raise AssertionError(f"Progression peuplée : chaque cadre doit avoir son texte explicatif : {disposition}")
    if any(section["fond"] == disposition["fondPage"] for section in disposition["sections"]):
        raise AssertionError(f"Progression peuplée : les cadres doivent se détacher du fond de page : {disposition}")
    vue_ensemble = disposition["vueEnsemble"]
    explorateur = disposition["explorateur"]
    if mobile:
        disposition_valide = explorateur["haut"] > vue_ensemble["bas"]
    else:
        disposition_valide = (
            abs(vue_ensemble["haut"] - explorateur["haut"]) <= 1
            and abs(vue_ensemble["hauteur"] - explorateur["hauteur"]) <= 1
            and vue_ensemble["droite"] < explorateur["gauche"]
            and abs(disposition["sections"][0]["contenuHaut"] - disposition["sections"][1]["contenuHaut"]) <= 1
            and abs(disposition["sections"][0]["texteExplicatifHaut"] - disposition["sections"][1]["texteExplicatifHaut"]) <= 1
            and abs(disposition["sections"][0]["premierBlocHaut"] - disposition["sections"][1]["premierBlocHaut"]) <= 1
            and abs(disposition["sections"][0]["premierBlocHauteur"] - disposition["sections"][1]["premierBlocHauteur"]) <= 1
        )
    if not disposition_valide:
        raise AssertionError(
            f"Progression peuplée : disposition des deux zones incorrecte : {disposition}"
        )


def verifier_progression_peuplee_bureau(page: Page) -> None:
    verifier_progression_peuplee(page)


def verifier_progression_peuplee_mobile(page: Page) -> None:
    verifier_progression_peuplee(page, mobile=True)


def verifier_parametres_bureau(page: Page) -> None:
    donnees = page.evaluate("""() => {
        const groupeSon = document.querySelector('#parametres [data-groupe-choix="sonActif"]');
        const volume = document.querySelector('#volumeSon');
        const rectangleSon = groupeSon?.getBoundingClientRect();
        const rectangleVolume = volume?.getBoundingClientRect();
        return {
            centreSon: rectangleSon ? rectangleSon.top + rectangleSon.height / 2 : -1,
            centreVolume: rectangleVolume ? rectangleVolume.top + rectangleVolume.height / 2 : -999,
            hauteurSon: rectangleSon?.height || 0,
            hauteurVolume: rectangleVolume?.height || 0
        };
    }""")
    if (
        abs(donnees["centreSon"] - donnees["centreVolume"]) > 1
        or donnees["hauteurSon"] < 44
        or donnees["hauteurVolume"] < 44
    ):
        raise AssertionError(
            f"Paramètres : le volume doit être aligné sur les boutons du son : {donnees}"
        )


def verifier_parametres_mobile(page: Page, echelle_attendue: str) -> None:
    donnees = page.evaluate("""echelleAttendue => {
        const groupeTaille = document.querySelector(
            '#parametres [data-groupe-choix="echelleTexte"]'
        );
        const boutonsTaille = [...(groupeTaille?.querySelectorAll('.choix-bouton') || [])];
        const rectanglesTaille = boutonsTaille.map(bouton => {
            const rectangle = bouton.getBoundingClientRect();
            return {
                gauche: rectangle.left,
                droite: rectangle.right,
                haut: rectangle.top,
                largeur: rectangle.width,
                hauteur: rectangle.height
            };
        });
        const selectionnes = boutonsTaille.filter(
            bouton => bouton.getAttribute('aria-pressed') === 'true'
        );
        const selectionne = selectionnes[0] || null;
        const nonSelectionne = boutonsTaille.find(bouton => bouton !== selectionne) || null;
        const styleSelectionne = selectionne ? getComputedStyle(selectionne) : null;
        const styleNonSelectionne = nonSelectionne ? getComputedStyle(nonSelectionne) : null;
        const boutonImport = document.querySelector('#boutonImporterProgression');
        const fichierImport = document.querySelector('#fichierImporterProgression');
        const styleFichierImport = fichierImport ? getComputedStyle(fichierImport) : null;
        const cibles = [...document.querySelectorAll('#parametres button')]
            .filter(element => {
                const style = getComputedStyle(element);
                const rectangle = element.getBoundingClientRect();
                return style.display !== 'none'
                    && style.visibility !== 'hidden'
                    && rectangle.width > 0
                    && rectangle.height > 0;
            })
            .map(element => {
                const rectangle = element.getBoundingClientRect();
                return {
                    id: element.id || element.textContent.trim(),
                    largeur: rectangle.width,
                    hauteur: rectangle.height
                };
            });
        const viewport = document.documentElement.clientWidth;
        const elementsControles = [
            ...document.querySelectorAll('#parametres .formulaire-grille > *, #parametres button')
        ].filter(element => {
            const style = getComputedStyle(element);
            const rectangle = element.getBoundingClientRect();
            return style.display !== 'none' && rectangle.width > 0 && rectangle.height > 0;
        });
        return {
            echelle: document.querySelector('#echelleTexte')?.value || '',
            nombreBoutonsTaille: boutonsTaille.length,
            rectanglesTaille,
            selectionnes: selectionnes.map(bouton => bouton.dataset.valeur),
            classesSelectionnee: selectionne?.className || '',
            stylesSelectionnee: styleSelectionne ? {
                fond: styleSelectionne.backgroundColor,
                bordure: styleSelectionne.borderColor,
                couleur: styleSelectionne.color
            } : null,
            stylesNonSelectionnee: styleNonSelectionne ? {
                fond: styleNonSelectionne.backgroundColor,
                bordure: styleNonSelectionne.borderColor,
                couleur: styleNonSelectionne.color
            } : null,
            selectionVisible: Boolean(selectionne)
                && (selectionne.classList.contains('actif') || selectionne.classList.contains('selectionne'))
                && Boolean(styleSelectionne)
                && Boolean(styleNonSelectionne)
                && (
                    styleSelectionne.backgroundColor !== styleNonSelectionne.backgroundColor
                    || styleSelectionne.borderColor !== styleNonSelectionne.borderColor
                    || styleSelectionne.color !== styleNonSelectionne.color
                ),
            import: {
                balise: boutonImport?.tagName || '',
                type: boutonImport?.type || '',
                controle: boutonImport?.getAttribute('aria-controls') || '',
                branche: typeof boutonImport?.onclick === 'function',
                fichier: fichierImport?.type || '',
                fichierVisuellementCache: Boolean(styleFichierImport)
                    && styleFichierImport.position === 'absolute'
                    && (styleFichierImport.clip !== 'auto' || styleFichierImport.clipPath !== 'none')
                    && fichierImport.tabIndex === -1
            },
            petitesCibles: cibles.filter(
                cible => cible.largeur < 44 || cible.hauteur < 44
            ),
            debordement: document.documentElement.scrollWidth - viewport,
            elementsHorsViewport: elementsControles.map(element => {
                const rectangle = element.getBoundingClientRect();
                return {
                    id: element.id || element.className || element.tagName,
                    gauche: rectangle.left,
                    droite: rectangle.right
                };
            }).filter(element => element.gauche < -1 || element.droite > viewport + 1),
            echelleAttendue
        };
    }""", echelle_attendue)

    rectangles = donnees["rectanglesTaille"]
    trois_cote_a_cote = (
        donnees["nombreBoutonsTaille"] == 3
        and max(rectangle["haut"] for rectangle in rectangles)
        - min(rectangle["haut"] for rectangle in rectangles) <= 1
        and all(
            rectangles[indice]["droite"] <= rectangles[indice + 1]["gauche"] + 1
            for indice in range(2)
        )
    )
    if not trois_cote_a_cote:
        raise AssertionError(
            f"Paramètres mobile : les trois tailles doivent rester côte à côte : {rectangles}"
        )
    if (
        donnees["echelle"] != echelle_attendue
        or donnees["selectionnes"] != [echelle_attendue]
        or not donnees["selectionVisible"]
    ):
        raise AssertionError(
            f"Paramètres mobile : l’état sélectionné doit être visible et annoncé : {donnees}"
        )
    importation = donnees["import"]
    if importation != {
        "balise": "BUTTON",
        "type": "button",
        "controle": "fichierImporterProgression",
        "branche": True,
        "fichier": "file",
        "fichierVisuellementCache": True,
    }:
        raise AssertionError(
            f"Paramètres mobile : l’import doit passer par un vrai bouton clavier : {importation}"
        )
    if donnees["petitesCibles"]:
        raise AssertionError(
            f"Paramètres mobile : cible interactive inférieure à 44 px : {donnees['petitesCibles']}"
        )
    if donnees["debordement"] > 1 or donnees["elementsHorsViewport"]:
        raise AssertionError(
            f"Paramètres mobile : débordement horizontal détecté : {donnees}"
        )


def verifier_parametres_mobile_normal(page: Page) -> None:
    verifier_parametres_mobile(page, "1")


def verifier_parametres_mobile_texte_115(page: Page) -> None:
    verifier_parametres_mobile(page, "1.15")


def scenarios() -> list[Scenario]:
    erreurs = """() => {
        const qs = QUESTIONS.filter(q => !q.estEvaluationFinale).slice(0, 5);
        sauvegarde.aDejaJoue = true;
        sauvegarde.erreurs = {};
        qs.forEach((q, i) => sauvegarde.erreurs[q.id] = {maitrisee:false,nombreErreurs:(i % 2) + 1,reussites:0});
        afficherEcran('erreurs', {remplacerHistorique:true});
    }"""
    bilan = """() => {
        const q = QUESTIONS.find(q => !q.estEvaluationFinale);
        lancerEtape(q.theme, q.etape);
        etat.score = 7;
        etat.meilleureSerie = 3;
        etat.erreursSession = new Set(etat.questionsSession.slice(0, 2).map(item => item.id));
        terminerSession();
        document.querySelector('.celebration-fenetre[open]')?.close();
    }"""
    correction = question_action("!q.estEvaluationFinale && (!q.activite || q.activite.type === 'choix-unique') && (q.modePrefere || 'choix-unique') === 'choix-unique'")[:-1] + " const mauvais=[...document.querySelectorAll('#zoneReponses .reponse')].find(b=>b.dataset.estCorrecte==='0'); mauvais.click(); }"
    joker = question_action("!q.estEvaluationFinale")[:-1] + " document.querySelector('#fenetreJokers').showModal(); }"
    quitter = question_action("!q.estEvaluationFinale")[:-1] + " document.querySelector('#fenetreQuitterSession').showModal(); }"
    parametres_mobile = """() => {
        sauvegarde.parametres = {...sauvegarde.parametres, son:true, volume:.65, echelleTexte:1};
        enregistrerSauvegarde();
        chargerParametres();
        afficherEcran('parametres', {remplacerHistorique:true});
    }"""
    parametres_mobile_texte_115 = """() => {
        sauvegarde.parametres = {...sauvegarde.parametres, son:true, volume:.65, echelleTexte:1.15};
        enregistrerSauvegarde();
        chargerParametres();
        afficherEcran('parametres', {remplacerHistorique:true});
    }"""
    supports_ouvert = """() => {
        afficherEcran('supports', {remplacerHistorique:true});
        const categorie = document.querySelector('#supports-je');
        const ressource = document.querySelector('#support-pratique-je');
        if (!categorie || !ressource)
            throw new Error('Supports de test introuvables');
        categorie.open = true;
        ressource.open = true;
    }"""
    progression_peuplee = """() => {
        sauvegarde = creerSauvegardeInitiale();
        sauvegarde.aDejaJoue = true;
        sauvegarde.questionsJouees = {};
        sauvegarde.erreurs = {};
        const themeComplet = THEMES[0].id;
        const themeEntame = THEMES[1].id;
        const retenirQuestion = question => {
            sauvegarde.questionsJouees[String(question.id)] = true;
        };
        const maitriserEtape = (theme, etape) => {
            const bilan = obtenirBilanEtape(theme, etape.id);
            const questions = obtenirQuestionsEtape(theme, etape.id);
            bilan.questionsTraitees = {};
            bilan.resultats = {};
            questions.forEach(question => {
                bilan.questionsTraitees[question.id] = true;
                bilan.resultats[question.id] = true;
                retenirQuestion(question);
            });
            bilan.termineeSansJoker = true;
            bilan.jokersUtilises = false;
            bilan.meilleurScore = 100;
            bilan.nombreTentatives = 1;
        };
        obtenirEtapesProgramme(themeComplet).forEach(
            etape => maitriserEtape(themeComplet, etape)
        );
        obtenirEtapesProgramme(themeEntame).slice(0, 3).forEach(
            etape => maitriserEtape(themeEntame, etape)
        );
        const etapePartielle = obtenirEtapesProgramme(themeEntame)[3];
        const bilanPartiel = obtenirBilanEtape(themeEntame, etapePartielle.id);
        const questionsARevoir = obtenirQuestionsEtape(themeEntame, etapePartielle.id).slice(0, 4);
        questionsARevoir.forEach(question => {
            bilanPartiel.questionsTraitees[question.id] = true;
            bilanPartiel.resultats[question.id] = false;
            retenirQuestion(question);
            sauvegarde.erreurs[question.id] = {
                maitrisee: false,
                nombreErreurs: 1,
                reussites: 0,
                theme: question.theme
            };
        });
        QUESTIONS.filter(
            question => question.theme === themeComplet && question.estEvaluationFinale
        ).forEach(retenirQuestion);
        sauvegarde.nombreQuestionsJouees = Object.keys(sauvegarde.questionsJouees).length;
        Object.assign(obtenirEvaluationFinaleTheme(themeComplet), {
            meilleurScore: 94,
            nombreTentatives: 1,
            reussie: true
        });
        etat.theme = themeEntame;
        afficherEcran('progression', {remplacerHistorique:true});
    }"""
    return [
        Scenario("bureau-accueil", 1440, 900, "() => { sauvegarde.aDejaJoue=false; actualiserAccueil(); afficherEcran('accueil',{remplacerHistorique:true}); }", verifier_accueil_nouveau),
        Scenario("bureau-accueil-retour", 1440, 900, "() => { const q=QUESTIONS.find(q=>!q.estEvaluationFinale); sauvegarde.aDejaJoue=true; obtenirBilanEtape(q.theme,q.etape).questionsTraitees[q.id]=true; actualiserAccueil(); afficherEcran('accueil',{remplacerHistorique:true}); }", verifier_accueil_retour),
        Scenario("bureau-menu", 1440, 900, "() => { afficherEcran('accueil',{remplacerHistorique:true}); basculerMenuPrincipal(); }", verifier_menu_principal),
        Scenario("bureau-parcours-choix", 1440, 900, "() => ouvrirChoixParcours({remplacerHistorique:true})", verifier_parcours_choix_bureau),
        Scenario("bureau-parcours-detail", 1440, 900, "() => { ouvrirChoixParcours({remplacerHistorique:true}); document.querySelector('#selecteurParcours .selecteur-parcours-bouton').click(); }", verifier_parcours_detail_bureau),
        Scenario("bureau-large-parcours-crimes", 1920, 1080, "() => { ouvrirChoixParcours({remplacerHistorique:true}); document.querySelector('#selecteurParcours [data-theme=\"matiere_criminelle_peines\"]').click(); }", verifier_parcours_crimes_bureau),
        Scenario("bureau-parcours-chrono", 1440, 900, "() => { ouvrirChoixParcours({remplacerHistorique:true}); document.querySelector('#selecteurParcours .selecteur-parcours-bouton').click(); document.querySelector('.parcours-options-session').open=true; document.querySelector('#boutonParcoursChronometre').click(); }", verifier_chronometre_parcours),
        Scenario("bureau-entrainement", 1440, 900, "() => afficherEcran('entrainement',{remplacerHistorique:true})", verifier_entrainement_bureau),
        Scenario("bureau-entrainement-options", 1440, 900, "() => { afficherEcran('entrainement',{remplacerHistorique:true}); document.querySelectorAll('.entrainement-options-avancees').forEach(options => options.open=true); document.querySelectorAll('[data-proposition=\"chronometre\"] .option-bouton[data-valeur=\"oui\"]').forEach(bouton => bouton.click()); }", verifier_options_entrainement),
        Scenario("bureau-carnet", 1440, 900, "() => {etat.theme='commun';afficherEcran('carnet',{remplacerHistorique:true});}"),
        Scenario("bureau-revision", 1440, 900, erreurs, verifier_revision_supports),
        Scenario("bureau-supports", 1440, 900, "() => afficherEcran('supports',{remplacerHistorique:true})", verifier_revision_supports),
        Scenario("bureau-supports-ouvert", 1440, 900, supports_ouvert, verifier_supports_ouvert_bureau),
        Scenario("bureau-progression", 1440, 900, "() => {etat.theme='commun';afficherEcran('progression',{remplacerHistorique:true});}"),
        Scenario("bureau-progression-peuplee", 1440, 900, progression_peuplee, verifier_progression_peuplee_bureau),
        Scenario("bureau-parametres", 1440, 900, "() => afficherEcran('parametres',{remplacerHistorique:true})", verifier_parametres_bureau),
        Scenario("bureau-bilan", 1440, 900, bilan),
        Scenario("bureau-question-unique", 1440, 900, question_action("!q.estEvaluationFinale && (!q.activite || q.activite.type === 'choix-unique') && (q.modePrefere || 'choix-unique') === 'choix-unique'")),
        Scenario("bureau-question-multiple", 1440, 900, question_action("q.activite?.type === 'selection-multiple'")),
        Scenario("bureau-question-association", 1440, 900, question_action("q.activite?.type === 'association'"), verifier_association_bureau),
        Scenario("bureau-question-classement", 1440, 900, question_action("q.activite?.type === 'classer'")),
        Scenario("bureau-question-ordre", 1440, 900, question_action("q.activite?.type === 'remettre-ordre'")),
        Scenario("bureau-question-eliminer", 1440, 900, question_action("q.modePrefere === 'eliminer'")),
        Scenario("bureau-question-ecrite", 1440, 900, question_action("q.modePrefere === 'reponse-ecrite'")),
        Scenario("bureau-correction", 1440, 900, correction, verifier_correction),
        Scenario("bureau-jokers", 1440, 900, joker, verifier_modale),
        Scenario("bureau-quitter", 1440, 900, quitter, verifier_modale),
        Scenario("mobile-accueil", 390, 844, "() => { sauvegarde.aDejaJoue=false; actualiserAccueil(); afficherEcran('accueil',{remplacerHistorique:true}); }", verifier_accueil_nouveau),
        Scenario("mobile-menu", 390, 844, "() => { afficherEcran('accueil',{remplacerHistorique:true}); basculerMenuPrincipal(); }", verifier_menu_principal),
        Scenario("mobile-parcours-choix", 390, 844, "() => ouvrirChoixParcours({remplacerHistorique:true})", verifier_parcours_choix_mobile),
        Scenario("mobile-parcours-detail", 390, 844, "() => { ouvrirChoixParcours({remplacerHistorique:true}); document.querySelector('#selecteurParcours .selecteur-parcours-bouton').click(); }", verifier_parcours_detail_mobile),
        Scenario("mobile-parcours-chrono", 390, 844, "() => { ouvrirChoixParcours({remplacerHistorique:true}); document.querySelector('#selecteurParcours .selecteur-parcours-bouton').click(); document.querySelector('.parcours-options-session').open=true; document.querySelector('#boutonParcoursChronometre').click(); }", verifier_chronometre_parcours),
        Scenario("mobile-entrainement", 390, 844, "() => afficherEcran('entrainement',{remplacerHistorique:true})", verifier_entrainement_mobile),
        Scenario("mobile-entrainement-options", 390, 844, "() => { afficherEcran('entrainement',{remplacerHistorique:true}); document.querySelectorAll('.entrainement-options-avancees').forEach(options => options.open=true); document.querySelectorAll('[data-proposition=\"chronometre\"] .option-bouton[data-valeur=\"oui\"]').forEach(bouton => bouton.click()); }", verifier_options_entrainement),
        Scenario("mobile-revision", 390, 844, erreurs, verifier_revision_supports),
        Scenario("mobile-supports", 390, 844, "() => afficherEcran('supports',{remplacerHistorique:true})", verifier_revision_supports),
        Scenario("mobile-supports-ouvert", 390, 844, supports_ouvert, verifier_supports_ouvert_mobile),
        Scenario("mobile-progression", 390, 844, "() => {etat.theme='commun';afficherEcran('progression',{remplacerHistorique:true});}"),
        Scenario("mobile-progression-peuplee", 390, 844, progression_peuplee, verifier_progression_peuplee_mobile),
        Scenario("mobile-parametres", 390, 844, parametres_mobile, verifier_parametres_mobile_normal),
        Scenario("mobile-parametres-texte-115", 390, 844, parametres_mobile_texte_115, verifier_parametres_mobile_texte_115),
        Scenario("mobile-question-multiple", 390, 844, question_action("q.activite?.type === 'selection-multiple'")),
        Scenario("mobile-question-association", 390, 844, question_action("q.activite?.type === 'association'"), verifier_association_mobile),
        Scenario("mobile-jokers", 390, 844, joker, verifier_modale),
    ]


def executable_chromium() -> str | None:
    configure = os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE")
    if configure and Path(configure).is_file():
        return configure
    systeme = Path("/usr/bin/chromium")
    return str(systeme) if systeme.is_file() else None


def verifier_scenario(navigateur, html: str, scenario: Scenario, actualiser_references: bool) -> None:
    page = navigateur.new_page(viewport={"width": scenario.largeur, "height": scenario.hauteur})
    def servir_ressource(route) -> None:
        chemin_relatif = unquote(urlparse(route.request.url).path).lstrip('/')
        if not chemin_relatif:
            route.fulfill(body=html, content_type='text/html')
            return
        chemin = (RACINE / chemin_relatif).resolve()
        if RACINE in chemin.parents and chemin.is_file():
            route.fulfill(path=str(chemin), content_type=mimetypes.guess_type(chemin.name)[0])
        else:
            route.fulfill(status=204, body='')
    page.route("http://pjjoue.test/**", servir_ressource)
    erreurs: list[str] = []
    page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
    page.on("console", lambda message: erreurs.append(f"console:{message.type}:{message.text}") if message.type == "error" else None)
    page.goto("http://pjjoue.test/", wait_until="domcontentloaded")
    page.wait_for_function("() => typeof afficherEcran === 'function' && window.DONNEES_PJJ?.QUESTIONS?.length === 960")
    page.evaluate(scenario.action)
    page.wait_for_timeout(420)
    page.evaluate("() => document.querySelector('#notification')?.classList.remove('visible')")
    if erreurs:
        raise AssertionError(f"{scenario.nom} : erreur JavaScript : {erreurs[0]}")
    debordement = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
    if debordement > 1:
        raise AssertionError(f"{scenario.nom} : débordement horizontal de {debordement}px")
    masques_visibles = page.evaluate("""() => [...document.querySelectorAll('.masque')]
        .filter(element => getComputedStyle(element).display !== 'none')
        .map(element => element.id || element.className).slice(0, 5)""")
    if masques_visibles:
        raise AssertionError(f"{scenario.nom} : éléments masqués encore visibles : {masques_visibles}")
    if scenario.verification:
        scenario.verification(page)
    page.add_style_tag(content="*{animation:none!important;transition:none!important;caret-color:transparent!important}")
    SORTIE.mkdir(parents=True, exist_ok=True)
    capture = SORTIE / f"{scenario.nom}.png"
    reference = REFERENCES / f"{scenario.nom}.png"
    page.screenshot(path=str(capture), full_page=True)
    if actualiser_references:
        REFERENCES.mkdir(parents=True, exist_ok=True)
        reference.write_bytes(capture.read_bytes())
    elif not reference.is_file():
        raise AssertionError(f"{scenario.nom} : capture de référence absente ({reference}).")
    else:
        actuelle = Image.open(capture).convert('RGBA')
        attendue = Image.open(reference).convert('RGBA')
        exact = comparaison_pixel_exacte_active()
        if actuelle.width != attendue.width:
            raise AssertionError(
                f"{scenario.nom} : largeur de capture différente, {actuelle.width}px au lieu de {attendue.width}px."
            )
        if actuelle.height != attendue.height:
            if exact:
                raise AssertionError(f"{scenario.nom} : dimensions différentes, {actuelle.size} au lieu de {attendue.size}.")
            print(
                f"INFO — {scenario.nom} : hauteur {actuelle.height}px au lieu de {attendue.height}px "
                f"avec le rendu {platform.system()} ; assertions de structure validées."
            )
        else:
            # Sur une image RGBA, l'alpha de deux captures opaques reste identique.
            # `getbbox()` peut alors ignorer des écarts RGB pourtant visibles ; la
            # comparaison doit porter explicitement sur les trois canaux de couleur.
            difference = ImageChops.difference(actuelle, attendue).convert('RGB')
            if difference.getbbox() is not None:
                pixels = sum(1 for pixel in difference.get_flattened_data() if pixel != (0, 0, 0))
                if exact:
                    raise AssertionError(f"{scenario.nom} : comparaison pixel par pixel échouée ({pixels} pixels différents).")
                print(
                    f"INFO — {scenario.nom} : {pixels} pixels diffèrent de la référence Linux "
                    f"(rendu {platform.system()}) ; assertions de structure validées, "
                    "comparaison pixel exacte réservée à Linux/CI."
                )
    page.close()


def main() -> int:
    parseur = argparse.ArgumentParser()
    parseur.add_argument("--filtre", default="", help="Sous-chaîne du nom des scénarios à exécuter.")
    parseur.add_argument("--actualiser-references", action="store_true", help="Valide explicitement les captures courantes comme références.")
    arguments = parseur.parse_args()
    if arguments.actualiser_references and not comparaison_pixel_exacte_active():
        raise SystemExit(
            "Les références pixel par pixel sont canoniques sous Linux/CI. "
            "Ne pas les actualiser depuis Windows ; utiliser la CI Linux pour valider une nouvelle référence."
        )
    selection = [scenario for scenario in scenarios() if arguments.filtre.lower() in scenario.nom.lower()]
    if not selection:
        raise SystemExit("Aucun scénario ne correspond au filtre.")

    html = construire_page()
    with sync_playwright() as playwright:
        executable = executable_chromium()
        options = {"headless": True}
        if executable:
            options.update({"executable_path": executable, "args": ["--no-sandbox"]})
        navigateur = playwright.chromium.launch(**options)
        for scenario in selection:
            verifier_scenario(navigateur, html, scenario, arguments.actualiser_references)
            print(f"OK — {scenario.nom}")
        navigateur.close()

    mode = "pixel par pixel + structure" if comparaison_pixel_exacte_active() else "structure locale + captures (pixel exact en Linux/CI)"
    print(f"OK — recette visuelle moderne : {len(selection)} scénarios, {mode}, captures dans {SORTIE}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
