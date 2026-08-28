#!/usr/bin/env python3
"""Vérifie l'iconographie sémantique des six parcours PJJoue."""
from __future__ import annotations

from pathlib import Path
import re

RACINE = Path(__file__).resolve().parents[1]
DEMARRAGE = (RACINE / 'code/01 - Éléments communs/JavaScript - Démarrage et Analytics.js').read_text(encoding='utf-8')
PARCOURS = (RACINE / 'code/03 - Parcours PJJ/actions-de-la-page.js').read_text(encoding='utf-8')
ENTRAINEMENT = (RACINE / 'code/05 - Entraînement libre/contenu.html').read_text(encoding='utf-8')
THEMES = (
    'commun',
    'procedure_ordinaire',
    'information_judiciaire',
    'jugement_educatif_ordinaire',
    'matiere_criminelle_peines',
    'application_execution_peines',
)


def principal() -> int:
    erreurs: list[str] = []
    traces = set(re.findall(r'^\s{4}([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9]*)\s*:\s*\'<', DEMARRAGE, re.M))
    if len(traces) < 20:
        erreurs.append(f'Bibliothèque SVG trop pauvre : {len(traces)} pictogrammes trouvés.')

    bloc_general = re.search(r'const ICONES_ETAPES_PARCOURS = Object\.freeze\(\{(.*?)\n\}\);', PARCOURS, re.S)
    if not bloc_general:
        erreurs.append('Mapping ICONES_ETAPES_PARCOURS introuvable.')
    else:
        contenu = bloc_general.group(1)
        total = 0
        for theme in THEMES:
            bloc = re.search(rf'\b{re.escape(theme)}\s*:\s*\{{(.*?)\}}', contenu, re.S)
            if not bloc:
                erreurs.append(f'{theme} : mapping absent.')
                continue
            paires = {int(numero): nom for numero, nom in re.findall(r'(\d+)\s*:\s*\'([^\']+)\'', bloc.group(1))}
            total += len(paires)
            attendus = set(range(1, 12))
            if set(paires) != attendus:
                erreurs.append(f'{theme} : étapes mappées {sorted(paires)}, attendu 1 à 11.')
            inconnues = sorted(set(paires.values()) - traces)
            if inconnues:
                erreurs.append(f'{theme} : pictogrammes inconnus {inconnues}.')
        if total != 66:
            erreurs.append(f'{total} associations étape/icône trouvées au lieu de 66.')

    fichiers_decouverte = set(re.findall(r"\d+: '([^']+\.svg)'", PARCOURS))
    if len(fichiers_decouverte) != 11:
        erreurs.append(f'Le parcours Découvrir la PJJ doit conserver ses 11 illustrations SVG : {len(fichiers_decouverte)} trouvées.')
    for nom_fichier in fichiers_decouverte:
        if not (RACINE / 'ressources/icones-parcours' / nom_fichier).is_file():
            erreurs.append(f'Illustration du parcours 1 absente : {nom_fichier}.')

    if '<img ' in ENTRAINEMENT or 'icones-interface' in ENTRAINEMENT:
        erreurs.append('L’entraînement doit conserver ses pictogrammes intégrés au document.')
    if len(re.findall(r'<div[^>]+class="entrainement-icone"[^>]*>\s*<svg\b', ENTRAINEMENT)) != 2:
        erreurs.append('Les deux modes d’entraînement doivent chacun posséder un pictogramme SVG intégré.')

    # Les six cartes de parcours utilisent la même bibliothèque de traits.
    mapping_themes = re.search(r'const ICONES_THEMES = Object\.freeze\(\{(.*?)\n\}\);', DEMARRAGE, re.S)
    if not mapping_themes:
        erreurs.append('Mapping ICONES_THEMES introuvable.')
    else:
        paires = dict(re.findall(r'^\s{4}([a-z_]+):\s*\'([^\']+)\'', mapping_themes.group(1), re.M))
        if set(paires) != set(THEMES):
            erreurs.append('Les six thèmes ne possèdent pas tous une icône dédiée.')
        inconnues = sorted(set(paires.values()) - traces)
        if inconnues:
            erreurs.append(f'Icônes de thème inconnues : {inconnues}.')

    if erreurs:
        print('\n'.join('ERREUR ' + erreur for erreur in erreurs))
        return 1
    print('OK — iconographie : 11 illustrations originales pour le parcours 1, 55 pictogrammes sémantiques pour les nouveaux parcours et 6 thèmes dédiés.')
    return 0


if __name__ == '__main__':
    raise SystemExit(principal())
