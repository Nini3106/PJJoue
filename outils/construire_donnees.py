#!/usr/bin/env python3
"""Construit le fichier JavaScript utilisé par PJJoue à partir des JSON de référence."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from validation_donnees import exiger_donnees_valides


RACINE_PROJET = Path(__file__).resolve().parents[1]
DOSSIER_DONNEES = RACINE_PROJET / "donnees"
FICHIER_DESTINATION = DOSSIER_DONNEES / "donnees-pjj.js"

def construire_themes(programme: dict[str, Any]) -> list[dict[str, str]]:
    """Construit le catalogue des parcours depuis le programme de référence."""
    return [
        {
            "id": identifiant,
            "icone": "",
            "titre": contenu.get("titre", identifiant),
            "sousTitre": contenu.get("sousTitre", ""),
            "categorie": contenu.get("categorie", "parcours"),
        }
        for identifiant, contenu in programme.items()
    ]



def lire_json(nom_fichier: str) -> Any:
    """Lit et décode un fichier JSON du dossier de données."""
    chemin = DOSSIER_DONNEES / nom_fichier
    return json.loads(chemin.read_text(encoding="utf-8"))


def convertir_en_javascript(nom_variable: str, contenu: Any) -> str:
    """Produit l'affectation JavaScript compacte d'un ensemble de données."""
    contenu_json = json.dumps(
        contenu,
        ensure_ascii=False,
        separators=(",", ":"),
    )
    return f"window.DONNEES_PJJ.{nom_variable}={contenu_json};"


def preparer_donnees() -> tuple[str, int, int]:
    """Prépare le JavaScript attendu et renvoie son bilan."""
    programme = lire_json("programme.json")
    sources = lire_json("sources.json")
    questions = lire_json("questions.json")
    sigles = lire_json("sigles.json")
    mesures_mission = lire_json("mesures.json")
    exiger_donnees_valides(programme, sources, questions)
    if not isinstance(sigles, list) or not sigles:
        raise SystemExit("ÉCHEC — donnees/sigles.json doit contenir une liste non vide.")
    sigles_normalises = [str(element.get("sigle", "")).strip().upper() for element in sigles if isinstance(element, dict)]
    if len(sigles_normalises) != len(sigles) or any(not sigle for sigle in sigles_normalises):
        raise SystemExit("ÉCHEC — chaque entrée de donnees/sigles.json doit contenir un sigle.")
    if len(sigles_normalises) != len(set(sigles_normalises)):
        raise SystemExit("ÉCHEC — donnees/sigles.json contient un doublon de sigle.")

    if not isinstance(mesures_mission, dict):
        raise SystemExit("ÉCHEC — donnees/mesures.json doit contenir l’objet Mission Mesures.")
    etapes_mesures = mesures_mission.get("etapes")
    reperes_mesures = mesures_mission.get("reperes")
    evaluation_mesures = mesures_mission.get("evaluation")
    if not isinstance(etapes_mesures, list) or not etapes_mesures:
        raise SystemExit("ÉCHEC — Mission Mesures doit contenir une liste d’étapes non vide.")
    numeros_etapes = [int(element.get("numero", 0) or 0) for element in etapes_mesures if isinstance(element, dict)]
    if numeros_etapes != list(range(1, len(etapes_mesures) + 1)):
        raise SystemExit("ÉCHEC — les étapes de Mission Mesures doivent être numérotées sans trou à partir de 1.")
    if not isinstance(reperes_mesures, list) or not reperes_mesures:
        raise SystemExit("ÉCHEC — Mission Mesures doit contenir une liste de repères non vide.")
    cles_mesures = [str(element.get("cle", "")).strip() for element in reperes_mesures if isinstance(element, dict)]
    if len(cles_mesures) != len(reperes_mesures) or any(not cle for cle in cles_mesures) or len(set(cles_mesures)) != len(cles_mesures):
        raise SystemExit("ÉCHEC — Mission Mesures doit contenir des clés de repères uniques et non vides.")
    numeros_valides = set(numeros_etapes)
    for numero_etape in numeros_etapes:
        if not any(int(element.get("etape", 0) or 0) == numero_etape for element in reperes_mesures):
            raise SystemExit(f"ÉCHEC — Mission Mesures : l’étape {numero_etape} ne contient aucun repère.")
    for element in reperes_mesures:
        cle = str(element.get("cle", "")).strip()
        if int(element.get("etape", 0) or 0) not in numeros_valides:
            raise SystemExit(f"ÉCHEC — Mission Mesures : étape invalide pour {cle}.")
        for prefixe in ("Introduction", "Rappel"):
            question = str(element.get(f"question{prefixe}", "")).strip()
            bonne = str(element.get(f"bonneReponse{prefixe}", "")).strip()
            distracteurs = element.get(f"distracteurs{prefixe}")
            explication = str(element.get(f"explication{prefixe}", "")).strip()
            indice = str(element.get(f"indice{prefixe}", "")).strip()
            if not question or not bonne or not explication or not indice or not isinstance(distracteurs, list) or len(distracteurs) != 3:
                raise SystemExit(f"ÉCHEC — Mission Mesures : question {prefixe.lower()} incomplète pour {cle}.")
            textes = [bonne, *[str(valeur).strip() for valeur in distracteurs]]
            if any(not texte for texte in textes) or len({texte.casefold() for texte in textes}) != 4:
                raise SystemExit(f"ÉCHEC — Mission Mesures : réponses vides ou dupliquées pour {cle} ({prefixe.lower()}).")
    if not isinstance(evaluation_mesures, list) or not evaluation_mesures:
        raise SystemExit("ÉCHEC — Mission Mesures doit contenir une banque d’évaluation finale non vide.")
    ids_evaluation = []
    for question in evaluation_mesures:
        identifiant = str(question.get("id", "")).strip() if isinstance(question, dict) else ""
        ids_evaluation.append(identifiant)
        distracteurs = question.get("distracteurs") if isinstance(question, dict) else None
        if (not identifiant or int(question.get("etape", 0) or 0) not in numeros_valides
                or not str(question.get("question", "")).strip()
                or not str(question.get("bonneReponse", "")).strip()
                or not str(question.get("explication", "")).strip()
                or not isinstance(distracteurs, list) or len(distracteurs) != 3):
            raise SystemExit(f"ÉCHEC — Mission Mesures : question d’évaluation incomplète ({identifiant or 'sans identifiant'}).")
    if len(set(ids_evaluation)) != len(ids_evaluation):
        raise SystemExit("ÉCHEC — Mission Mesures : les identifiants d’évaluation doivent être uniques.")
    sources_connues = set(sources) if isinstance(sources, dict) else {str(source.get("id", "")) for source in sources if isinstance(source, dict)}
    sources_requises = set()
    for element in [*reperes_mesures, *evaluation_mesures]:
        reference = element.get("source")
        if isinstance(reference, list):
            sources_requises.update(str(valeur) for valeur in reference if valeur)
        elif reference:
            sources_requises.add(str(reference))
    sources_manquantes = sorted(sources_requises - sources_connues)
    if sources_manquantes:
        raise SystemExit("ÉCHEC — Mission Mesures : sources inconnues : " + ", ".join(sources_manquantes))

    ensembles = (
        ("THEMES", construire_themes(programme)),
        ("PROGRAMMES", programme),
        ("SOURCES", sources),
        ("QUESTIONS", questions),
        ("SIGLES", sigles),
        ("MESURES_MISSION", mesures_mission),
    )

    lignes = [
        "/* Fichier généré depuis donnees/*.json. Ne pas modifier directement. */",
        "window.DONNEES_PJJ=window.DONNEES_PJJ||{};",
    ]
    lignes.extend(
        convertir_en_javascript(nom_variable, contenu)
        for nom_variable, contenu in ensembles
    )

    return "\n".join(lignes) + "\n", len(questions), len(sources)


def construire_donnees() -> tuple[int, int]:
    """Génère donnees-pjj.js et renvoie les nombres de questions et de sources."""
    contenu, nombre_questions, nombre_sources = preparer_donnees()
    FICHIER_DESTINATION.write_bytes(contenu.encode("utf-8"))
    return nombre_questions, nombre_sources


def verifier_donnees() -> tuple[int, int]:
    """Refuse un fichier public absent ou différent des JSON de référence."""
    contenu, nombre_questions, nombre_sources = preparer_donnees()
    if not FICHIER_DESTINATION.is_file():
        raise SystemExit(
            "ÉCHEC — donnees/donnees-pjj.js est absent. Lance npm run build:donnees."
        )
    if FICHIER_DESTINATION.read_text(encoding="utf-8") != contenu:
        raise SystemExit(
            "ÉCHEC — donnees/donnees-pjj.js n’est pas à jour par rapport aux JSON. "
            "Lance npm run build:donnees."
        )
    return nombre_questions, nombre_sources


def principal() -> None:
    """Exécute la construction et affiche un bilan lisible."""
    analyseur = argparse.ArgumentParser(description="Construire ou vérifier les données de PJJoue.")
    analyseur.add_argument(
        "--verifier",
        action="store_true",
        help="vérifier que donnees-pjj.js correspond exactement aux JSON sans l’écrire",
    )
    options = analyseur.parse_args()
    if options.verifier:
        nombre_questions, nombre_sources = verifier_donnees()
        action = "Données vérifiées"
    else:
        nombre_questions, nombre_sources = construire_donnees()
        action = "Données construites"
    print(
        f"{action} : "
        f"{nombre_questions} questions, {nombre_sources} sources."
    )


if __name__ == "__main__":
    principal()
