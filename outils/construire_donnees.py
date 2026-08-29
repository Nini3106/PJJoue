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
    exiger_donnees_valides(programme, sources, questions)
    if not isinstance(sigles, list) or not sigles:
        raise SystemExit("ÉCHEC — donnees/sigles.json doit contenir une liste non vide.")
    sigles_normalises = [str(element.get("sigle", "")).strip().upper() for element in sigles if isinstance(element, dict)]
    if len(sigles_normalises) != len(sigles) or any(not sigle for sigle in sigles_normalises):
        raise SystemExit("ÉCHEC — chaque entrée de donnees/sigles.json doit contenir un sigle.")
    if len(sigles_normalises) != len(set(sigles_normalises)):
        raise SystemExit("ÉCHEC — donnees/sigles.json contient un doublon de sigle.")

    ensembles = (
        ("THEMES", construire_themes(programme)),
        ("PROGRAMMES", programme),
        ("SOURCES", sources),
        ("QUESTIONS", questions),
        ("SIGLES", sigles),
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
    FICHIER_DESTINATION.write_text(contenu, encoding="utf-8")
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
