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
import html
import json
import re
import sys

RACINE = Path(__file__).resolve().parents[1]
CHEMIN_PLAN = RACINE / "code" / "plan-construction.json"
CHEMIN_ROUTES = RACINE / "code" / "routes-application.json"
CHEMIN_PROGRAMME = RACINE / "donnees" / "programme.json"
MOTIF_MARQUEUR_HTML = re.compile(r"\{\{[A-Z0-9_]+\}\}")
MOTIF_RESSOURCE_CACHE = re.compile(r"['\"](\./[^'\"]*)['\"]")
EXTENSIONS_TEXTE_EMPREINTE = {
    ".css", ".html", ".js", ".json", ".md", ".svg", ".txt", ".webmanifest", ".xml",
}


def lire_octets_stables_pour_empreinte(chemin: Path) -> bytes:
    """Retourner des octets stables entre Windows et Linux pour le cache PWA."""
    contenu = chemin.read_bytes()
    if chemin.suffix.lower() in EXTENSIONS_TEXTE_EMPREINTE:
        contenu = contenu.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
    return contenu


MOTIF_REPERE_CSS = re.compile(
    r"/\* === MORCEAU CSS \| sortie=(.*?) \| ordre=(\d+) === \*/\n"
    r"(.*?)\n"
    r"/\* === FIN MORCEAU CSS === \*/",
    re.S,
)

# Anciennes feuilles CSS publiques produites par une ancienne organisation du site.
# Elles ne doivent plus exister : la V1 publie désormais une feuille principale assemblée.
FICHIERS_PUBLICS_OBSOLETES = {
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
    "ressources/styles/96-icones-et-defi-hasard.css",
    "ressources/styles/99-stabilisation-visuelle.css",
}



class ErreurConstruction(RuntimeError):
    """Erreur expliquée simplement à la personne qui reprend PJJoue."""




def charger_sigles() -> list[dict]:
    chemin = RACINE / "donnees" / "sigles.json"
    if not chemin.is_file():
        raise ErreurConstruction("Le fichier donnees/sigles.json est introuvable.")
    try:
        sigles = json.loads(chemin.read_text(encoding="utf-8"))
    except json.JSONDecodeError as erreur:
        raise ErreurConstruction(f"donnees/sigles.json n'est pas un JSON valide : {erreur}") from erreur
    if not isinstance(sigles, list) or not sigles:
        raise ErreurConstruction("donnees/sigles.json doit contenir une liste non vide.")
    cles = [str(element.get("sigle", "")).strip().upper() for element in sigles if isinstance(element, dict)]
    if len(cles) != len(sigles) or any(not cle for cle in cles):
        raise ErreurConstruction("Chaque entrée de donnees/sigles.json doit contenir un sigle.")
    verifier_aucun_doublon(cles, "Sigle")
    return sigles


def rendre_lignes_sigles_support(sigles: list[dict]) -> str:
    return "\n".join(
        "<tr><td>{}</td><td>{}</td><td>{}</td></tr>".format(
            html.escape(str(element.get("sigle", ""))),
            html.escape(str(element.get("signification", ""))),
            html.escape(str(element.get("repere", ""))),
        )
        for element in sigles
    )


def rendre_lignes_sigles_guide(sigles: list[dict], groupe: str) -> str:
    selection = [element for element in sigles if element.get("guideGroupe") == groupe]
    return "\n    ".join(
        "<tr><td>{}</td><td>{}</td></tr>".format(
            html.escape(str(element.get("sigle", ""))),
            html.escape(str(element.get("signification", ""))),
        )
        for element in selection
    )


def remplacer_marqueurs_sigles(texte: str) -> str:
    if "{{TABLE_SIGLES_" not in texte:
        return texte
    sigles = charger_sigles()
    remplacements = {
        "{{TABLE_SIGLES_REVISION}}": rendre_lignes_sigles_support(sigles),
        "{{TABLE_SIGLES_GUIDE_ORGANISATION}}": rendre_lignes_sigles_guide(sigles, "Organisation et fonctions"),
        "{{TABLE_SIGLES_GUIDE_SERVICES}}": rendre_lignes_sigles_guide(sigles, "Services, établissements et unités"),
        "{{TABLE_SIGLES_GUIDE_MESURES}}": rendre_lignes_sigles_guide(sigles, "Mesures et justice des mineurs"),
        "{{TABLE_SIGLES_GUIDE_AUTRES}}": rendre_lignes_sigles_guide(sigles, "Autres sigles utiles des glossaires PJJ"),
    }
    for marqueur, contenu in remplacements.items():
        texte = texte.replace(marqueur, contenu)
    return texte

def lire_texte(chemin_relatif: str) -> str:
    chemin = RACINE / chemin_relatif
    if not chemin.is_file():
        raise ErreurConstruction(f"Fichier source introuvable : {chemin_relatif}")
    return remplacer_marqueurs_sigles(chemin.read_text(encoding="utf-8"))


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
        "gabarit_page_principale",
        "pages_autonomes",
        "javascript",
        "css",
    }
    manquantes = sorted(cles_obligatoires - set(plan))
    if manquantes:
        raise ErreurConstruction("Éléments manquants dans le plan : " + ", ".join(manquantes))

    # Toutes les sources déclarées doivent exister.
    sources: list[str] = [plan["gabarit_page_principale"]]
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


def charger_routes_application() -> dict[str, str]:
    if not CHEMIN_ROUTES.is_file():
        raise ErreurConstruction("Le fichier code/routes-application.json est introuvable.")
    try:
        routes = json.loads(CHEMIN_ROUTES.read_text(encoding="utf-8"))
    except json.JSONDecodeError as erreur:
        raise ErreurConstruction(f"code/routes-application.json n'est pas un JSON valide : {erreur}") from erreur
    if not isinstance(routes, dict) or routes.get("accueil") != "":
        raise ErreurConstruction("code/routes-application.json doit contenir accueil avec une route vide.")
    valeurs = [str(route).strip("/") for route in routes.values() if str(route).strip("/")]
    verifier_aucun_doublon(valeurs, "Route propre")
    for ecran, route in routes.items():
        route = str(route)
        if route.startswith("/") or route.endswith("/") or "//" in route or "#" in route or "?" in route:
            raise ErreurConstruction(f"Route propre invalide pour {ecran} : {route!r}")
    return {str(ecran): str(route) for ecran, route in routes.items()}


def construire_relais_route(route: str, profondeur: int) -> str:
    route_encodee = route.replace("/", "%2F")
    retour_racine = "../" * profondeur
    destination = f"{retour_racine}?pjjoue_route={route_encodee}"
    script_destination = json.dumps(destination, ensure_ascii=False)
    return (
        '<!doctype html>\n'
        '<html lang="fr">\n'
        '<head>\n'
        '  <meta charset="utf-8">\n'
        '  <meta name="viewport" content="width=device-width,initial-scale=1">\n'
        '  <meta name="robots" content="noindex,follow">\n'
        '  <link rel="canonical" href="https://pjjoue.fr/">\n'
        f'  <meta http-equiv="refresh" content="0;url={destination}">\n'
        '  <title>Ouverture de PJJoue</title>\n'
        f'  <script>location.replace(new URL({script_destination}, location.href).href);</script>\n'
        '</head>\n'
        '<body>\n'
        '  <h1>Ouverture de PJJoue</h1>\n'
        f'  <p>Redirection vers la section demandée… <a href="{destination}">Continuer</a></p>\n'
        '</body>\n'
        '</html>\n'
    )


def construire_relais_routes() -> dict[str, str]:
    routes = charger_routes_application()
    sorties: dict[str, str] = {}
    for route in routes.values():
        route = route.strip("/")
        if not route:
            continue
        profondeur = len(route.split("/"))
        sorties[f"{route}/index.html"] = construire_relais_route(route, profondeur)

    try:
        programme = json.loads(CHEMIN_PROGRAMME.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as erreur:
        raise ErreurConstruction(f"donnees/programme.json est illisible : {erreur}") from erreur
    if not isinstance(programme, dict) or not programme:
        raise ErreurConstruction("donnees/programme.json doit contenir les parcours.")
    for identifiant_theme in programme:
        route = f"parcours/{identifiant_theme}"
        sorties[f"{route}/index.html"] = construire_relais_route(route, 2)
    return sorties


def construire_tous_les_fichiers(plan: dict) -> dict[str, str]:
    sorties: dict[str, str] = {}

    def ajouter(sortie: str, contenu: str) -> None:
        if sortie in sorties:
            raise ErreurConstruction(f"Le constructeur essaie de produire deux fois : {sortie}")
        sorties[sortie] = contenu

    ajouter("index.html", construire_page_principale(plan))

    for sortie, contenu in construire_relais_routes().items():
        ajouter(sortie, contenu)

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
    # Le plan produit directement l’unique feuille de l’application principale.
    # Aucun alias ni assemblage CSS parallèle n’est conservé.
    for sortie, contenu in construire_css(plan).items():
        ajouter(sortie, contenu)

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
        empreinte_cache.update(lire_octets_stables_pour_empreinte(chemin))
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


def supprimer_fichiers_publics_obsoletes() -> list[str]:
    supprimes: list[str] = []
    for chemin_relatif in sorted(FICHIERS_PUBLICS_OBSOLETES):
        chemin = RACINE / chemin_relatif
        if chemin.is_file():
            chemin.unlink()
            supprimes.append(chemin_relatif)
    return supprimes


def ecrire_fichiers(sorties: dict[str, str]) -> None:
    supprimer_fichiers_publics_obsoletes()
    for chemin_relatif, contenu in sorties.items():
        chemin = RACINE / chemin_relatif
        chemin.parent.mkdir(parents=True, exist_ok=True)
        chemin.write_bytes(contenu.encode("utf-8"))


def verifier_fichiers(sorties: dict[str, str]) -> None:
    obsoletes = [
        chemin_relatif
        for chemin_relatif in sorted(FICHIERS_PUBLICS_OBSOLETES)
        if (RACINE / chemin_relatif).is_file()
    ]
    differents: list[str] = []
    manquants: list[str] = []
    for chemin_relatif, contenu_attendu in sorties.items():
        chemin = RACINE / chemin_relatif
        if not chemin.is_file():
            manquants.append(chemin_relatif)
            continue
        if chemin.read_text(encoding="utf-8") != contenu_attendu:
            differents.append(chemin_relatif)
    if obsoletes or manquants or differents:
        morceaux = []
        if obsoletes:
            morceaux.append(
                "anciens fichiers publics obsolètes à supprimer : " + ", ".join(obsoletes)
            )
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
