#!/usr/bin/env python3
"""Vérifier que les adresses des sources officielles répondent encore."""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
import json
from pathlib import Path
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

RACINE = Path(__file__).resolve().parents[1]
CHEMIN_SOURCES = RACINE / "donnees" / "sources.json"
DELAI_SECONDES = 15


def verifier_lien(identifiant: str, source: dict) -> tuple[str, str, int | None, str]:
    adresse = str(source.get("url", "")).strip()
    titre = str(source.get("titre", identifiant))
    if not adresse.startswith(("https://", "http://")):
        return identifiant, adresse, None, "adresse absente ou invalide"
    requete = Request(
        adresse,
        headers={"User-Agent": "PJJoue-Controle-Liens/1.0 (+https://pjjoue.fr/)"},
        method="GET",
    )
    try:
        with urlopen(requete, timeout=DELAI_SECONDES) as reponse:
            code = int(reponse.status)
            reponse.read(512)
            return identifiant, adresse, code, titre
    except HTTPError as erreur:
        return identifiant, adresse, int(erreur.code), titre
    except (URLError, TimeoutError, OSError) as erreur:
        return identifiant, adresse, None, f"{titre} — {erreur}"


def main() -> int:
    sources = json.loads(CHEMIN_SOURCES.read_text(encoding="utf-8"))
    echecs: list[tuple[str, str, int | None, str]] = []
    controles_manuels: list[tuple[str, str, int | None, str]] = []
    with ThreadPoolExecutor(max_workers=6) as executant:
        travaux = [executant.submit(verifier_lien, identifiant, source) for identifiant, source in sources.items()]
        for travail in as_completed(travaux):
            resultat = travail.result()
            code = resultat[2]
            if code is None or code in {404, 410}:
                echecs.append(resultat)
            elif code >= 300:
                # Plusieurs sites publics (notamment Légifrance) refusent les
                # robots ou renvoient ponctuellement une erreur de passerelle.
                # Cela exige un contrôle humain, mais ne prouve pas un lien mort.
                controles_manuels.append(resultat)

    for identifiant, adresse, code, detail in sorted(controles_manuels):
        print(f"À CONTRÔLER — {identifiant} : HTTP {code} — {adresse} — {detail}")
    if echecs:
        print(f"ERREUR — {len(echecs)} lien(s) officiel(s) à contrôler manuellement :")
        for identifiant, adresse, code, detail in sorted(echecs):
            etat = f"HTTP {code}" if code is not None else "aucune réponse"
            print(f"- {identifiant} : {etat} — {adresse} — {detail}")
        return 1
    nombre_repondant = len(sources) - len(controles_manuels)
    print(
        f"OK — {nombre_repondant} liens répondent normalement ; "
        f"{len(controles_manuels)} refus ou erreurs temporaires sont signalés sans faux échec."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
