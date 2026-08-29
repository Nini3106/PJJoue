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




def classer_resultat(resultat: tuple[str, str, int | None, str]) -> str:
    """Classer un contrôle de lien en ``ok``, ``manuel`` ou ``echec``.

    Seules les adresses invalides et les réponses 404/410 prouvent ici une
    anomalie bloquante. Les erreurs réseau et refus anti-robot restent à
    contrôler humainement sans produire de faux échec de publication.
    """
    adresse = resultat[1]
    code = resultat[2]
    if not adresse.startswith(("https://", "http://")):
        return "echec"
    if code in {404, 410}:
        return "echec"
    if code is None or code >= 300:
        return "manuel"
    return "ok"


def main() -> int:
    sources = json.loads(CHEMIN_SOURCES.read_text(encoding="utf-8"))
    echecs: list[tuple[str, str, int | None, str]] = []
    controles_manuels: list[tuple[str, str, int | None, str]] = []
    with ThreadPoolExecutor(max_workers=6) as executant:
        travaux = [executant.submit(verifier_lien, identifiant, source) for identifiant, source in sources.items()]
        for travail in as_completed(travaux):
            resultat = travail.result()
            classification = classer_resultat(resultat)
            if classification == "echec":
                echecs.append(resultat)
            elif classification == "manuel":
                controles_manuels.append(resultat)

    for identifiant, adresse, code, detail in sorted(controles_manuels):
        etat = f"HTTP {code}" if code is not None else "aucune réponse"
        print(f"À CONTRÔLER — {identifiant} : {etat} — {adresse} — {detail}")
    if echecs:
        print(f"ERREUR — {len(echecs)} lien(s) officiel(s) manifestement indisponible(s) :")
        for identifiant, adresse, code, detail in sorted(echecs):
            etat = f"HTTP {code}" if code is not None else "aucune réponse"
            print(f"- {identifiant} : {etat} — {adresse} — {detail}")
        return 1
    nombre_repondant = len(sources) - len(controles_manuels) - len(echecs)
    print(
        f"OK — {nombre_repondant} liens répondent normalement ; "
        f"{len(controles_manuels)} refus ou erreurs réseau temporaires sont signalés sans faux échec."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
