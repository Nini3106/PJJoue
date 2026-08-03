#!/usr/bin/env python3
"""Construit le fichier JavaScript utilisé par PJJoue à partir des JSON de référence."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from validation_donnees import exiger_donnees_valides


RACINE_PROJET = Path(__file__).resolve().parents[1]
DOSSIER_DONNEES = RACINE_PROJET / "donnees"
FICHIER_DESTINATION = DOSSIER_DONNEES / "donnees-pjj.js"

THEMES = [
    {
        "id": "commun",
        "icone": "",
        "titre": "Parcours PJJ",
        "sousTitre": "Découvre la PJJ à travers 10 étapes progressives",
        "categorie": "socle",
    }
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


def construire_donnees() -> tuple[int, int]:
    """Génère donnees-pjj.js et renvoie les nombres de questions et de sources."""
    programme = lire_json("programme.json")
    sources = lire_json("sources.json")
    questions = lire_json("questions.json")
    exiger_donnees_valides(programme, sources, questions)

    ensembles = (
        ("THEMES", THEMES),
        ("PROGRAMMES", programme),
        ("SOURCES", sources),
        ("QUESTIONS", questions),
    )

    lignes = [
        "/* Fichier généré depuis donnees/*.json. Ne pas modifier directement. */",
        "window.DONNEES_PJJ=window.DONNEES_PJJ||{};",
    ]
    lignes.extend(
        convertir_en_javascript(nom_variable, contenu)
        for nom_variable, contenu in ensembles
    )

    FICHIER_DESTINATION.write_text(
        "\n".join(lignes) + "\n",
        encoding="utf-8",
    )
    return len(questions), len(sources)


def principal() -> None:
    """Exécute la construction et affiche un bilan lisible."""
    nombre_questions, nombre_sources = construire_donnees()
    print(
        "Données construites : "
        f"{nombre_questions} questions, {nombre_sources} sources."
    )


if __name__ == "__main__":
    principal()
