#!/usr/bin/env python3
"""Créer une archive PJJoue V1 dont tous les chemins Unicode sont explicitement UTF-8."""
from __future__ import annotations

from pathlib import Path
import argparse
import subprocess
import sys
import zipfile

RACINE = Path(__file__).resolve().parents[1]
DOSSIERS_IGNORES = {'.git', '.pytest_cache', '.venv', '__pycache__', 'node_modules', 'test-results', 'audit-resultats'}
FICHIERS_IGNORES = {'.DS_Store'}
CARACTERES_SUSPECTS = ('├', '┬', '┤', 'Â', 'Ã', '�')
SEQUENCES_SUSPECTES = ('ÔÇ', 'ΓÇ', '├®', '├ë', '├á', '├¿', '├©', '├ª', '├´', '├ö', '├¼')


def executer(*arguments: str) -> None:
    resultat = subprocess.run([sys.executable, *arguments], cwd=RACINE)
    if resultat.returncode:
        raise SystemExit(resultat.returncode)


def est_ignore(chemin: Path, sortie: Path) -> bool:
    relatif = chemin.relative_to(RACINE)
    return (
        bool(DOSSIERS_IGNORES.intersection(relatif.parts))
        or chemin.name in FICHIERS_IGNORES
        or chemin.suffix == '.pyc'
        or chemin.resolve() == sortie.resolve()
    )


def nom_corrompu(nom: str) -> bool:
    return any(c in nom for c in CARACTERES_SUSPECTS) or any(s in nom for s in SEQUENCES_SUSPECTES)


def ajouter_entree(archive: zipfile.ZipFile, chemin: Path, nom: str) -> None:
    if chemin.is_dir():
        info = zipfile.ZipInfo(nom.rstrip('/') + '/')
        archive.writestr(info, b'')
        return
    archive.write(chemin, arcname=nom)


def verifier_archive(chemin_zip: Path) -> None:
    with zipfile.ZipFile(chemin_zip) as archive:
        mauvais_noms: list[str] = []
        sans_utf8: list[str] = []
        for info in archive.infolist():
            nom = info.filename
            if nom_corrompu(nom):
                mauvais_noms.append(nom)
            if any(ord(caractere) > 127 for caractere in nom) and not (info.flag_bits & 0x800):
                sans_utf8.append(nom)
        if mauvais_noms or sans_utf8:
            if mauvais_noms:
                print('ÉCHEC — noms corrompus présents dans le ZIP :')
                for nom in mauvais_noms:
                    print(f' - {nom}')
            if sans_utf8:
                print('ÉCHEC — chemins non ASCII sans drapeau UTF-8 dans le ZIP :')
                for nom in sans_utf8:
                    print(f' - {nom}')
            chemin_zip.unlink(missing_ok=True)
            raise SystemExit(1)
        print(f'Archive UTF-8 vérifiée : {len(archive.infolist())} entrées, 0 nom corrompu, 0 chemin accentué sans drapeau UTF-8.')


def main() -> int:
    analyseur = argparse.ArgumentParser(description='Créer l’archive officielle UTF-8 de PJJoue V1.')
    analyseur.add_argument('sortie', nargs='?', default='PJJoue_V1_UTF8.zip', help='nom ou chemin du ZIP de sortie')
    args = analyseur.parse_args()
    sortie = Path(args.sortie)
    if not sortie.is_absolute():
        sortie = RACINE / sortie

    # Refuser de figer une livraison incohérente.
    executer('outils/verifier_noms_fichiers.py')
    executer('outils/construire_donnees.py', '--verifier')
    executer('outils/construire_site.py', '--verifier')
    executer('outils/construire_seo.py', '--verifier')
    executer('outils/construire_manifeste.py', '--verifier')

    sortie.parent.mkdir(parents=True, exist_ok=True)
    sortie.unlink(missing_ok=True)

    chemins = sorted(RACINE.rglob('*'), key=lambda p: p.relative_to(RACINE).as_posix())
    with zipfile.ZipFile(sortie, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for chemin in chemins:
            if est_ignore(chemin, sortie):
                continue
            nom = chemin.relative_to(RACINE).as_posix()
            if nom_corrompu(nom):
                raise SystemExit(f'ÉCHEC — chemin corrompu refusé avant archivage : {nom}')
            ajouter_entree(archive, chemin, nom)

    verifier_archive(sortie)
    print(f'OK — archive PJJoue V1 créée : {sortie}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
