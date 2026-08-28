#!/usr/bin/env python3
"""Vérifie que la livraison se présente uniquement comme PJJoue V1 créée en août 2026."""
from pathlib import Path
import json
import re

RACINE = Path(__file__).resolve().parents[1]
EXTENSIONS_TEXTE = {'.js', '.json', '.md', '.html', '.css', '.py', '.bat', '.xml', '.txt', '.yml', '.yaml', '.webmanifest', '.csv'}
MOTIFS_VERSIONS_INTERMEDIAIRES = (
    re.compile(r'PJJoue\s+V[234]\b', re.I),
    re.compile(r'pjjoue[-_]v[234]\b', re.I),
    re.compile(r'\bV[234]-(?:deux|cinq|six)-parcours\b', re.I),
    re.compile(r'Version\s+[234](?:\.0)?\s*·\s*Août\s+2026', re.I),
)
ANCIENS_IDENTIFIANTS = {
    'judiciaire',
    'maitrise_judiciaire',
    'accompagnement',
    'prise_en_charge',
    'application_peines',
}
IDENTIFIANTS_ATTENDUS = (
    'commun',
    'procedure_ordinaire',
    'information_judiciaire',
    'jugement_educatif_ordinaire',
    'matiere_criminelle_peines',
    'application_execution_peines',
)


def principal() -> int:
    erreurs: list[str] = []
    for chemin in RACINE.rglob('*'):
        if not chemin.is_file() or chemin.suffix.lower() not in EXTENSIONS_TEXTE or chemin.name == 'package-lock.json':
            continue
        try:
            texte = chemin.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            continue
        for motif in MOTIFS_VERSIONS_INTERMEDIAIRES:
            if motif.search(texte):
                erreurs.append(f'{chemin.relative_to(RACINE)} contient une ancienne identité de version.')
                break

    programme = json.loads((RACINE / 'donnees/programme.json').read_text(encoding='utf-8'))
    if tuple(programme) != IDENTIFIANTS_ATTENDUS:
        erreurs.append(f'Identifiants de parcours inattendus : {tuple(programme)}')
    if ANCIENS_IDENTIFIANTS.intersection(programme):
        erreurs.append('Un ancien identifiant de parcours subsiste dans programme.json.')

    questions = json.loads((RACINE / 'donnees/questions.json').read_text(encoding='utf-8'))
    themes_questions = {question.get('theme') for question in questions}
    anciens_themes_questions = sorted(ANCIENS_IDENTIFIANTS.intersection(themes_questions))
    if anciens_themes_questions:
        erreurs.append('Des questions utilisent encore un ancien identifiant de parcours : ' + ', '.join(anciens_themes_questions))
    themes_inattendus = sorted(theme for theme in themes_questions if theme not in IDENTIFIANTS_ATTENDUS)
    if themes_inattendus:
        erreurs.append('Des questions utilisent un identifiant de parcours inattendu : ' + ', '.join(themes_inattendus))

    manifeste = json.loads((RACINE / 'MANIFESTE.json').read_text(encoding='utf-8'))
    if manifeste.get('version') != 'V1':
        erreurs.append('Le manifeste ne déclare pas V1.')
    if manifeste.get('dateCreation') != 'août 2026':
        erreurs.append('La date de création du manifeste doit rester « août 2026 ».')

    index = (RACINE / 'index.html').read_text(encoding='utf-8')
    if 'Version 1 · Août 2026' not in index:
        erreurs.append('Le pied de page public ne présente pas l’identité originale « Version 1 · Août 2026 ».')

    illustrations_parcours_1 = list((RACINE / 'ressources/icones-parcours').glob('*.svg'))
    if len(illustrations_parcours_1) != 11:
        erreurs.append(f'Le parcours 1 doit livrer exactement ses 11 illustrations SVG, {len(illustrations_parcours_1)} trouvées.')
    if (RACINE / 'ressources/icones-interface').exists():
        erreurs.append('Le dossier inutilisé ressources/icones-interface ne doit pas être livré.')

    if erreurs:
        print('\n'.join('ERREUR — ' + erreur for erreur in erreurs))
        return 1
    print('OK — identité V1 : aucune ancienne version PJJoue, date de création août 2026, identifiants de parcours normalisés.')
    return 0


if __name__ == '__main__':
    raise SystemExit(principal())
