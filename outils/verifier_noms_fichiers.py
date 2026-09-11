from __future__ import annotations

from pathlib import Path
import sys
import unicodedata

RACINE = Path(__file__).resolve().parents[1]
DOSSIERS_IGNORES = {'.git', 'node_modules', 'test-results', '__pycache__', '.pytest_cache'}
CARACTERES_SUSPECTS = ('├', '┬', '┤', '┐', '└', '─', '╬', '╩', '╦', '╔', '╗', '╝', '╚', 'Â', 'Ã', '�')
SEQUENCES_SUSPECTES = ('ÔÇ', 'ΓÇ', '├®', '├ë', '├á', '├¿', '├©', '├ª', '├´', '├ö', '├¼')
EXTENSIONS_TEXTE = {
    '.bat', '.conf', '.css', '.csv', '.html', '.js', '.json', '.md', '.py',
    '.svg', '.txt', '.webmanifest', '.xml', '.yaml', '.yml',
}
NOMS_TEXTE_SANS_EXTENSION = {'.gitignore', '.nojekyll', 'CNAME'}


def est_ignore(chemin: Path) -> bool:
    try:
        relatif = chemin.relative_to(RACINE)
    except ValueError:
        return True
    return any(partie in DOSSIERS_IGNORES for partie in relatif.parts)


def nom_suspect(nom: str) -> bool:
    return (
        unicodedata.normalize('NFC', nom) != nom
        or any(caractere in nom for caractere in CARACTERES_SUSPECTS)
        or any(sequence in nom for sequence in SEQUENCES_SUSPECTES)
    )


def est_fichier_texte(chemin: Path) -> bool:
    return chemin.suffix.lower() in EXTENSIONS_TEXTE or chemin.name in NOMS_TEXTE_SANS_EXTENSION


def main() -> int:
    suspects: list[Path] = []
    fichiers_non_utf8: list[tuple[Path, str]] = []

    for chemin in RACINE.rglob('*'):
        if est_ignore(chemin):
            continue
        relatif = chemin.relative_to(RACINE)
        if any(nom_suspect(partie) for partie in relatif.parts):
            suspects.append(relatif)
            continue
        if chemin.is_file() and est_fichier_texte(chemin):
            try:
                chemin.read_text(encoding='utf-8')
            except UnicodeDecodeError as erreur:
                fichiers_non_utf8.append((relatif, str(erreur)))

    if suspects or fichiers_non_utf8:
        if suspects:
            print('ÉCHEC — noms de fichiers ou dossiers potentiellement corrompus détectés :')
            for chemin in sorted(set(suspects), key=lambda p: str(p).lower()):
                print(f' - {chemin}')
            print()
            print('Ces noms ressemblent à un problème d’encodage lors de la création ou de l’extraction d’une archive ZIP.')
            print('Ne publie pas cette version. Les dossiers français accentués doivent conserver leurs vrais noms UTF-8,')
            print('par exemple « Éléments communs » et non « ├ël├®ments communs ».')
        if fichiers_non_utf8:
            if suspects:
                print()
            print('ÉCHEC — fichiers texte non lisibles en UTF-8 détectés :')
            for chemin, erreur in fichiers_non_utf8:
                print(f' - {chemin} : {erreur}')
            print()
            print('Tous les fichiers texte de PJJoue doivent être enregistrés en UTF-8 avant commit, ZIP ou push.')
        return 1

    print('OK — noms valides et fichiers texte UTF-8 : aucun problème détecté.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
