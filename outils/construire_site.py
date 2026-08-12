#!/usr/bin/env python3
"""Construire les fichiers publics de PJJoue à partir du dossier ``code``.

Le mode normal écrit les fichiers publics.
Le mode ``--verifier`` ne modifie rien : il vérifie que les fichiers publics
correspondent exactement aux sources. Ainsi, une modification faite par erreur
directement dans un fichier généré est détectée avant publication.
"""
from __future__ import annotations

from collections import Counter, defaultdict
from pathlib import Path
import argparse
import hashlib
import json
import re
import sys

RACINE = Path(__file__).resolve().parents[1]
CHEMIN_PLAN = RACINE / "code" / "plan-construction.json"
MOTIF_MARQUEUR_HTML = re.compile(r"\{\{[A-Z0-9_]+\}\}")
MOTIF_RESSOURCE_CACHE = re.compile(r"['\"](\./[^'\"]*)['\"]")
MOTIF_REPERE_CSS = re.compile(
    r"/\* === MORCEAU CSS \| sortie=(.*?) \| ordre=(\d+) === \*/\n"
    r"(.*?)\n"
    r"/\* === FIN MORCEAU CSS === \*/",
    re.S,
)


class ErreurConstruction(RuntimeError):
    """Erreur expliquée simplement à la personne qui reprend PJJoue."""


def lire_texte(chemin_relatif: str) -> str:
    chemin = RACINE / chemin_relatif
    if not chemin.is_file():
        raise ErreurConstruction(f"Fichier source introuvable : {chemin_relatif}")
    return chemin.read_text(encoding="utf-8")


def verifier_aucun_doublon(valeurs: list[str], libelle: str) -> None:
    doublons = sorted(valeur for valeur, nombre in Counter(valeurs).items() if nombre > 1)
    if doublons:
        raise ErreurConstruction(
            f"{libelle} déclaré plusieurs fois : " + ", ".join(doublons)
        )


def charger_et_verifier_plan() -> dict:
    if not CHEMIN_PLAN.is_file():
        raise ErreurConstruction("Le fichier code/plan-construction.json est introuvable.")
    try:
        plan = json.loads(CHEMIN_PLAN.read_text(encoding="utf-8"))
    except json.JSONDecodeError as erreur:
        raise ErreurConstruction(f"Le plan de construction n'est pas un JSON valide : {erreur}") from erreur

    cles_obligatoires = {
        "pages_principales",
        "encadrement_guides_accueil",
        "gabarit_page_principale",
        "pages_autonomes",
        "javascript",
        "css",
    }
    manquantes = sorted(cles_obligatoires - set(plan))
    if manquantes:
        raise ErreurConstruction("Éléments manquants dans le plan : " + ", ".join(manquantes))

    # Toutes les sources déclarées doivent exister.
    sources: list[str] = [plan["gabarit_page_principale"], plan["encadrement_guides_accueil"]]
    sources += list(plan["pages_principales"].values())
    for page in plan["pages_autonomes"]:
        sources.append(page["source"])
        if page.get("style_source"):
            sources.append(page["style_source"])
    for ressource in plan.get("ressources_administration", []):
        sources.append(ressource["source"])
    for ressource in plan.get("ressources_communes", []):
        sources.append(ressource["source"])
    sources += [partie["source"] for partie in plan["javascript"]]
    sources += [element["source"] for element in plan["css"]]
    for source in sorted(set(sources)):
        if not (RACINE / source).is_file():
            raise ErreurConstruction(f"Source déclarée mais introuvable : {source}")

    # Un même fichier public ne doit pas être produit par deux entrées indépendantes.
    sorties_autonomes = [page["sortie"] for page in plan["pages_autonomes"]]
    sorties_autonomes += [page["style_sortie"] for page in plan["pages_autonomes"] if page.get("style_sortie")]
    sorties_autonomes += [r["sortie"] for r in plan.get("ressources_administration", [])]
    sorties_autonomes += [r["sortie"] for r in plan.get("ressources_communes", [])]
    verifier_aucun_doublon(sorties_autonomes, "Fichier public")

    # Chaque morceau JavaScript n'est assemblé qu'une fois.
    verifier_aucun_doublon(
        [partie["source"] for partie in plan["javascript"]],
        "Morceau JavaScript",
    )

    # L'identité d'un morceau CSS est son fichier public + son numéro d'ordre.
    identites_css = [f"{e['sortie']}|{int(e['ordre'])}" for e in plan["css"]]
    verifier_aucun_doublon(identites_css, "Morceau CSS (sortie + ordre)")
    return plan


def construire_page_principale(plan: dict) -> str:
    page = lire_texte(plan["gabarit_page_principale"])
    for nom_page, chemin_contenu in plan["pages_principales"].items():
        repere = "{{PAGE_" + nom_page.upper() + "}}"
        nombre = page.count(repere)
        if nombre != 1:
            raise ErreurConstruction(
                f"Le repère {repere} doit apparaître exactement une fois dans le gabarit ; trouvé : {nombre}."
            )
        page = page.replace(repere, lire_texte(chemin_contenu), 1)

    repere_guides = "{{ENCADREMENT_GUIDES_ACCUEIL}}"
    nombre_guides = page.count(repere_guides)
    if nombre_guides != 1:
        raise ErreurConstruction(
            f"Le repère {repere_guides} doit apparaître exactement une fois ; trouvé : {nombre_guides}."
        )
    page = page.replace(repere_guides, lire_texte(plan["encadrement_guides_accueil"]), 1)

    restants = sorted(set(MOTIF_MARQUEUR_HTML.findall(page)))
    if restants:
        raise ErreurConstruction(
            "Repère de page non remplacé dans index.html : " + ", ".join(restants)
        )
    return page


def construire_javascript(plan: dict) -> str:
    parties: list[str] = []
    for partie in plan["javascript"]:
        texte = lire_texte(partie["source"])
        lignes = texte.splitlines(keepends=True)
        debut = int(partie.get("debut_code_apres_entete_lignes", 0))
        if debut < 0 or debut > len(lignes):
            raise ErreurConstruction(
                f"Entête JavaScript invalide pour {partie['source']} : {debut} lignes à ignorer."
            )
        parties.append("".join(lignes[debut:]))
    return "".join(parties)


def lire_morceaux_css(plan: dict) -> dict[tuple[str, int], str]:
    trouves: dict[tuple[str, int], str] = {}
    provenance: dict[tuple[str, int], str] = {}
    sources_css = sorted({element["source"] for element in plan["css"]})

    for source in sources_css:
        texte = lire_texte(source)
        for fichier_sortie, numero_ordre, contenu in MOTIF_REPERE_CSS.findall(texte):
            cle = (fichier_sortie.strip(), int(numero_ordre))
            if cle in trouves:
                raise ErreurConstruction(
                    "Deux morceaux CSS portent le même numéro pour le même fichier public : "
                    f"{cle[0]} ordre {cle[1]} ({provenance[cle]} et {source})."
                )
            trouves[cle] = contenu
            provenance[cle] = source

    attendus: dict[tuple[str, int], str] = {}
    for element in plan["css"]:
        cle = (element["sortie"], int(element["ordre"]))
        attendus[cle] = element["source"]
        if cle not in trouves:
            raise ErreurConstruction(
                f"Morceau CSS déclaré mais introuvable : {cle[0]} ordre {cle[1]}."
            )
        if provenance[cle] != element["source"]:
            raise ErreurConstruction(
                f"Le morceau CSS {cle[0]} ordre {cle[1]} est déclaré dans {element['source']} "
                f"mais son repère se trouve dans {provenance[cle]}."
            )

    inutilises = sorted(set(trouves) - set(attendus))
    if inutilises:
        texte = ", ".join(f"{sortie} ordre {ordre}" for sortie, ordre in inutilises)
        raise ErreurConstruction("Morceau CSS présent dans les sources mais absent du plan : " + texte)
    return trouves


def construire_css(plan: dict) -> dict[str, str]:
    morceaux = lire_morceaux_css(plan)
    par_sortie: dict[str, list[dict]] = defaultdict(list)
    for element in plan["css"]:
        par_sortie[element["sortie"]].append(element)

    resultat: dict[str, str] = {}
    for sortie, elements in par_sortie.items():
        elements_ordonnes = sorted(elements, key=lambda element: int(element["ordre"]))
        ordres = [int(element["ordre"]) for element in elements_ordonnes]
        if len(ordres) != len(set(ordres)):
            raise ErreurConstruction(f"Numéro CSS répété dans {sortie}.")
        resultat[f"ressources/styles/{sortie}"] = "".join(
            morceaux[(sortie, int(element["ordre"]))]
            for element in elements_ordonnes
        )
    return resultat


def construire_tous_les_fichiers(plan: dict) -> dict[str, str]:
    sorties: dict[str, str] = {}

    def ajouter(sortie: str, contenu: str) -> None:
        if sortie in sorties:
            raise ErreurConstruction(f"Le constructeur essaie de produire deux fois : {sortie}")
        sorties[sortie] = contenu

    ajouter("index.html", construire_page_principale(plan))

    for page in plan["pages_autonomes"]:
        ajouter(page["sortie"], lire_texte(page["source"]))
        if page.get("style_source") and page.get("style_sortie"):
            ajouter(page["style_sortie"], lire_texte(page["style_source"]))
        elif bool(page.get("style_source")) != bool(page.get("style_sortie")):
            raise ErreurConstruction(
                f"La page {page['source']} doit déclarer style_source et style_sortie ensemble."
            )

    for cle in ("ressources_administration", "ressources_communes"):
        for ressource in plan.get(cle, []):
            ajouter(ressource["sortie"], lire_texte(ressource["source"]))

    ajouter("ressources/moteur-jeu.js", construire_javascript(plan))
    feuilles_css = construire_css(plan)
    for sortie, contenu in feuilles_css.items():
        ajouter(sortie, contenu)
    # La page principale charge une seule feuille afin de limiter les requêtes
    # bloquant son premier affichage. Les feuilles séparées restent disponibles
    # pour les guides et pour faciliter le diagnostic du code source.
    ordre_feuilles_principales = [
        "00-fondations-et-composants.css",
        "10-parcours-principal.css",
        "20-accueil-et-question-principale.css",
        "30-revision-parcours-et-parametres.css",
        "40-progression-et-erreurs.css",
        "50-carte-question-et-correction.css",
        "60-parcours-modes-et-chronometre.css",
        "70-celebrations-bilan-et-fenetres.css",
        "80-finitions-de-l-interface.css",
        "85-guides-pedagogiques.css",
        "90-adaptation-ecrans-et-etats-finaux.css",
        "95-consentement.css",
        "96-icones-et-defi-hasard.css",
        "99-stabilisation-visuelle.css",
    ]
    ajouter(
        "ressources/styles/pjjoue-principal.css",
        "".join(feuilles_css[f"ressources/styles/{nom}"] for nom in ordre_feuilles_principales),
    )

    # Le nom du cache change automatiquement dès qu'un fichier public généré
    # ou qu'une ressource précachée change. Cela couvre notamment
    # donnees/donnees-pjj.js, les images et les icônes copiées telles quelles.
    empreinte_cache = hashlib.sha256()
    for chemin, contenu in sorted(sorties.items()):
        if chemin != "service-worker.js":
            empreinte_cache.update(chemin.encode("utf-8"))
            empreinte_cache.update(contenu.encode("utf-8"))
    ressources_deja_comptees = set(sorties) - {"service-worker.js"}
    ressources_cache = set(MOTIF_RESSOURCE_CACHE.findall(sorties["service-worker.js"]))
    for adresse in sorted(ressources_cache):
        chemin_relatif = adresse.removeprefix("./").split("?", 1)[0]
        if not chemin_relatif:
            chemin_relatif = "index.html"
        if chemin_relatif in ressources_deja_comptees:
            continue
        chemin = RACINE / chemin_relatif
        if not chemin.is_file():
            raise ErreurConstruction(
                f"Ressource précachée introuvable : {chemin_relatif}"
            )
        empreinte_cache.update(chemin_relatif.encode("utf-8"))
        if chemin.suffix.lower() in {
            ".css", ".html", ".js", ".json", ".svg",
            ".txt", ".webmanifest", ".xml"
        }:
            contenu_cache = chemin.read_text(encoding="utf-8").encode("utf-8")
        else:
            contenu_cache = chemin.read_bytes()
        empreinte_cache.update(contenu_cache)
    version_cache = empreinte_cache.hexdigest()[:12]
    sorties["service-worker.js"] = sorties["service-worker.js"].replace(
        "__VERSION_CACHE_PJJOUE__", version_cache
    )

    # Dernier garde-fou : aucun marqueur de construction ne doit sortir du dossier code.
    for sortie, contenu in sorties.items():
        if sortie.endswith((".html", ".css", ".js")):
            marqueurs = MOTIF_MARQUEUR_HTML.findall(contenu)
            if marqueurs:
                raise ErreurConstruction(
                    f"Marqueur de construction restant dans {sortie} : {', '.join(sorted(set(marqueurs)))}"
                )
    return sorties


def ecrire_fichiers(sorties: dict[str, str]) -> None:
    for chemin_relatif, contenu in sorties.items():
        chemin = RACINE / chemin_relatif
        chemin.parent.mkdir(parents=True, exist_ok=True)
        chemin.write_text(contenu, encoding="utf-8")


def verifier_fichiers(sorties: dict[str, str]) -> None:
    differents: list[str] = []
    manquants: list[str] = []
    for chemin_relatif, contenu_attendu in sorties.items():
        chemin = RACINE / chemin_relatif
        if not chemin.is_file():
            manquants.append(chemin_relatif)
            continue
        if chemin.read_text(encoding="utf-8") != contenu_attendu:
            differents.append(chemin_relatif)
    if manquants or differents:
        morceaux = []
        if manquants:
            morceaux.append("fichiers publics manquants : " + ", ".join(manquants))
        if differents:
            morceaux.append(
                "fichiers publics modifiés directement ou non reconstruits : " + ", ".join(differents)
            )
        raise ErreurConstruction(" ; ".join(morceaux))


def principal() -> int:
    analyseur = argparse.ArgumentParser(description="Construire ou vérifier PJJoue.")
    analyseur.add_argument(
        "--verifier",
        action="store_true",
        help="ne rien écrire et vérifier que les fichiers publics correspondent aux sources",
    )
    options = analyseur.parse_args()

    try:
        plan = charger_et_verifier_plan()
        sorties = construire_tous_les_fichiers(plan)
        if options.verifier:
            verifier_fichiers(sorties)
            print(
                "OK — construction vérifiée : "
                f"{len(sorties)} fichiers publics sont exactement à jour, "
                "aucun repère oublié et aucun morceau CSS dupliqué dans le plan."
            )
        else:
            ecrire_fichiers(sorties)
            print(
                "PJJoue reconstruit : "
                f"{len(sorties)} fichiers publics écrits, "
                "aucun repère oublié et aucun morceau CSS dupliqué dans le plan."
            )
        return 0
    except ErreurConstruction as erreur:
        print(f"ÉCHEC DE CONSTRUCTION — {erreur}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(principal())
