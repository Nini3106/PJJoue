#!/usr/bin/env python3
"""Signaler les sources officielles qui n'ont pas été revérifiées depuis un an."""
from __future__ import annotations

from datetime import date, datetime
import json
from pathlib import Path
import sys

RACINE = Path(__file__).resolve().parents[1]
CHEMIN_SOURCES = RACINE / "donnees" / "sources.json"
DELAI_RAPPEL_JOURS = 365


def main() -> int:
    sources = json.loads(CHEMIN_SOURCES.read_text(encoding="utf-8"))
    aujourd_hui = date.today()
    a_reverifier: list[str] = []
    erreurs: list[str] = []

    for identifiant, source in sorted(sources.items()):
        valeur = source.get("dateVerification")
        try:
            date_verification = datetime.strptime(str(valeur), "%Y-%m-%d").date()
        except ValueError:
            erreurs.append(f"{identifiant} : dateVerification invalide ({valeur!r})")
            continue
        age = (aujourd_hui - date_verification).days
        if age < 0:
            erreurs.append(f"{identifiant} : date de vérification située dans le futur ({valeur})")
        elif age >= DELAI_RAPPEL_JOURS:
            a_reverifier.append(f"{identifiant} — {age} jours — {source.get('titre', 'sans titre')}")

    if erreurs:
        print("ERREUR — dates de vérification incorrectes :")
        print("\n".join(f"- {message}" for message in erreurs))
        return 1
    if a_reverifier:
        print(f"RAPPEL — {len(a_reverifier)} source(s) n'ont pas été vérifiées depuis {DELAI_RAPPEL_JOURS} jours :")
        print("\n".join(f"- {message}" for message in a_reverifier))
        return 1

    age_maximal = max(
        (aujourd_hui - datetime.strptime(source["dateVerification"], "%Y-%m-%d").date()).days
        for source in sources.values()
    )
    print(f"OK — {len(sources)} sources à jour ; la plus ancienne vérification date de {age_maximal} jour(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
