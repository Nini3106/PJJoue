from __future__ import annotations

from pathlib import Path
import sys

RACINE = Path(__file__).resolve().parents[1]
DOSSIERS_IGNORES = {'.git', 'node_modules', 'test-results', '__pycache__', '.pytest_cache'}
CARACTERES_SUSPECTS = ('├', '┬', '┤', '┐', '└', '─', '╬', '╩', '╦', '╔', '╗', '╝', '╚', 'Â', 'Ã', '�')
SEQUENCES_SUSPECTES = ('ÔÇ', '├®', '├ë', '├á', '├¿', '├©', '├ª', '├´', '├ö', '├¼')


def est_ignore(chemin: Path) -> bool:
    try:
        relatif = chemin.relative_to(RACINE)
    except ValueError:
        return True
    return any(partie in DOSSIERS_IGNORES for partie in relatif.parts)


def nom_suspect(nom: str) -> bool:
    return any(caractere in nom for caractere in CARACTERES_SUSPECTS) or any(
        sequence in nom for sequence in SEQUENCES_SUSPECTES
    )


def main() -> int:
    suspects: list[Path] = []

    for chemin in RACINE.rglob('*'):
        if est_ignore(chemin):
            continue
        relatif = chemin.relative_to(RACINE)
        if any(nom_suspect(partie) for partie in relatif.parts):
            suspects.append(relatif)

    if suspects:
        print('ÉCHEC — noms de fichiers ou dossiers potentiellement corrompus détectés :')
        for chemin in sorted(set(suspects), key=lambda p: str(p).lower()):
            print(f' - {chemin}')
        print()
        print('Ces noms ressemblent à un problème d’encodage lors de la création ou de l’extraction d’une archive ZIP.')
        print('Ne publie pas cette version. Les dossiers français accentués doivent conserver leurs vrais noms,')
        print('par exemple « Éléments communs » et non « ├ël├®ments communs ».')
        return 1

    print('OK — aucun nom de fichier ou dossier corrompu détecté.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
