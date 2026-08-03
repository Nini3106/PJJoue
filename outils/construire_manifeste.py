#!/usr/bin/env python3
"""Construit le manifeste d’intégrité de la V1 officielle de PJJoue."""
from __future__ import annotations

from datetime import date
from hashlib import sha256
from pathlib import Path
import json

RACINE_PROJET = Path(__file__).resolve().parents[1]
FICHIER_MANIFESTE = RACINE_PROJET / "MANIFESTE.json"
DOSSIERS_IGNORES = {
    ".git",
    ".pytest_cache",
    ".venv",
    "__pycache__",
    "node_modules",
    "test-results",
}
FICHIERS_IGNORES = {".DS_Store"}


def est_fichier_a_recenser(chemin: Path) -> bool:
    """Indique si le fichier appartient réellement à l’archive officielle."""
    chemin_relatif = chemin.relative_to(RACINE_PROJET)
    return (
        chemin.is_file()
        and not DOSSIERS_IGNORES.intersection(chemin_relatif.parts)
        and chemin.name not in FICHIERS_IGNORES
        and chemin_relatif.as_posix() != "MANIFESTE.json"
        and chemin.suffix != ".pyc"
    )


def decrire_fichier(chemin: Path) -> dict[str, int | str]:
    """Retourne la taille et l’empreinte SHA-256 d’un fichier."""
    contenu = chemin.read_bytes()
    return {
        "tailleOctets": len(contenu),
        "sha256": sha256(contenu).hexdigest(),
    }


def construire_manifeste() -> dict[str, object]:
    """Construit le contenu complet du manifeste à partir des fichiers présents."""
    questions = json.loads((RACINE_PROJET / "donnees/questions.json").read_text(encoding="utf-8"))
    questions_parcours = [question for question in questions if not question.get("estEvaluationFinale")]
    questions_evaluation = [question for question in questions if question.get("estEvaluationFinale")]

    fichiers = {
        chemin.relative_to(RACINE_PROJET).as_posix(): decrire_fichier(chemin)
        for chemin in sorted(RACINE_PROJET.rglob("*"))
        if est_fichier_a_recenser(chemin)
    }
    return {
        "produit": "PJJoue",
        "version": "V1",
        "dateConsolidation": date.today().isoformat(),
        "composition": {
            "questionsTotales": len(questions),
            "questionsParcours": len(questions_parcours),
            "etapesParcours": len({question["etape"] for question in questions_parcours}),
            "questionsEvaluationFinale": len(questions_evaluation),
        },
        "fichiers": fichiers,
    }


def principal() -> None:
    manifeste = construire_manifeste()
    FICHIER_MANIFESTE.write_text(
        json.dumps(manifeste, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Manifeste construit : {len(manifeste['fichiers'])} fichiers recensés.")


if __name__ == "__main__":
    principal()
