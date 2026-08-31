#!/usr/bin/env python3
"""Construit le manifeste d’intégrité de la livraison à six parcours de PJJoue."""
from __future__ import annotations

from datetime import date
import argparse
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
    "audit-resultats",
    "node_modules",
    "test-results",
}
FICHIERS_IGNORES = {".DS_Store"}
EXTENSIONS_TEXTE_MANIFESTE = {
    ".bat", ".conf", ".css", ".csv", ".html", ".js", ".json", ".md",
    ".py", ".svg", ".txt", ".webmanifest", ".xml", ".yaml", ".yml",
}
NOMS_TEXTE_MANIFESTE = {".gitignore", ".nojekyll", "CNAME"}


def lire_octets_stables_pour_manifeste(chemin: Path) -> bytes:
    """Retourner une représentation stable d'un fichier entre Windows et Linux."""
    contenu = chemin.read_bytes()
    if chemin.suffix.lower() in EXTENSIONS_TEXTE_MANIFESTE or chemin.name in NOMS_TEXTE_MANIFESTE:
        contenu = contenu.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
    return contenu


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
    contenu = lire_octets_stables_pour_manifeste(chemin)
    return {
        "tailleOctets": len(contenu),
        "sha256": sha256(contenu).hexdigest(),
    }


def construire_manifeste(date_consolidation: str | None = None) -> dict[str, object]:
    """Construit le manifeste ; la date peut être figée pour une vérification reproductible."""
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
        "dateCreation": "août 2026",
        "dateConsolidation": date_consolidation or date.today().isoformat(),
        "composition": {
            "questionsTotales": len(questions),
            "questionsParcours": len(questions_parcours),
            "etapesParcours": len({(question["theme"], question["etape"]) for question in questions_parcours}),
            "nombreParcours": len({question["theme"] for question in questions_parcours}),
            "questionsEvaluationFinale": len(questions_evaluation),
            "evaluationsFinales": len({question["theme"] for question in questions_evaluation}),
        },
        "reglesVisuelles": {
            "identiteCouleurParcoursEtEtapes": {
                "obligatoire": True,
                "principe": (
                    "Tout bouton, badge, carte ou encadrement représentant un parcours ou une étape "
                    "doit reprendre la couleur canonique de ce parcours ou de cette étape."
                ),
                "applicationMinimum": [
                    "contour ou accent d'encadrement",
                    "survol ou focus lorsque le composant est interactif",
                    "repère coloré lorsque le composant est informatif",
                ],
                "sourceDeVerite": (
                    "Utiliser les identités canoniques du parcours et les fonctions canoniques de couleur "
                    "des étapes ; aucune copie locale divergente de couleur n'est autorisée."
                ),
                "exemples": [
                    "cartes et sélecteurs de parcours",
                    "cartes et boutons liés aux étapes",
                    "cartes de question et réponses interactives",
                    "badges Parcours X et Étape X au-dessus des questions",
                    "boutons de révision et dossiers d'erreurs par parcours ou étape",
                ],
            },
            "etoileFilanteMaitriseSansJoker": {
                "obligatoire": True,
                "principe": (
                    "Une étape maîtrisée sans joker reçoit une étoile filante avec une traînée visible ; "
                    "la carte du parcours affiche le même symbole avec le nombre de jalons maîtrisés."
                ),
                "comptage": (
                    "Le compteur additionne les étapes maîtrisées sans joker et l'évaluation finale réussie ; "
                    "il va de 1 à 12 et affiche 12 lorsque les 11 étapes et l'évaluation sont maîtrisées."
                ),
                "interdiction": "Une étoile seule sans traînée ne doit pas remplacer ce symbole.",
            }
        },
        "fichiers": fichiers,
    }


def principal() -> None:
    analyseur = argparse.ArgumentParser(description="Construire ou vérifier le manifeste de PJJoue.")
    analyseur.add_argument(
        "--verifier",
        action="store_true",
        help="vérifier que MANIFESTE.json correspond aux fichiers sans le réécrire",
    )
    options = analyseur.parse_args()

    date_consolidation = None
    if options.verifier:
        if not FICHIER_MANIFESTE.is_file():
            raise SystemExit("ÉCHEC — MANIFESTE.json est absent. Lance python outils/construire_manifeste.py.")
        try:
            manifeste_existant = json.loads(FICHIER_MANIFESTE.read_text(encoding="utf-8"))
            date_consolidation = manifeste_existant.get("dateConsolidation")
        except (UnicodeDecodeError, json.JSONDecodeError, AttributeError):
            raise SystemExit("ÉCHEC — MANIFESTE.json n’est pas un JSON UTF-8 valide. Régénère-le.")

    manifeste = construire_manifeste(date_consolidation=date_consolidation)
    contenu = (json.dumps(manifeste, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    if options.verifier:
        if FICHIER_MANIFESTE.read_bytes() != contenu:
            raise SystemExit(
                "ÉCHEC — MANIFESTE.json n’est pas à jour. Lance python outils/construire_manifeste.py puis relance les contrôles."
            )
        print(f"Manifeste vérifié : {len(manifeste['fichiers'])} fichiers recensés.")
    else:
        FICHIER_MANIFESTE.write_bytes(contenu)
        print(f"Manifeste construit : {len(manifeste['fichiers'])} fichiers recensés.")


if __name__ == "__main__":
    principal()
