@echo off
chcp 65001 >nul
setlocal

echo ============================================================
echo PJJoue V1 - Preparation obligatoire avant push
echo ============================================================
echo.

call :trouver_python
if errorlevel 1 goto erreur_python

call :preparer_outils_node
if errorlevel 1 goto erreur_node

echo 1/3 - Verification des noms de fichiers et dossiers...
%PYTHON_PJJOUE% outils\verifier_noms_fichiers.py
if errorlevel 1 goto erreur

echo.
echo 2/3 - Reconstruction des donnees, fichiers publics, service worker et manifeste...
%PYTHON_PJJOUE% outils\construire_donnees.py
if errorlevel 1 goto erreur
%PYTHON_PJJOUE% outils\construire_site.py
if errorlevel 1 goto erreur
%PYTHON_PJJOUE% outils\construire_manifeste.py
if errorlevel 1 goto erreur

echo.
echo 3/3 - Recette complete avant publication...
call VERIFIER_PJJOUE.bat
if errorlevel 1 goto erreur

echo.
echo ============================================================
echo PJJoue est pret pour le commit et le push.
echo ============================================================
pause
exit /b 0

:trouver_python
py -3.14 --version >nul 2>&1
if not errorlevel 1 (
  set "PYTHON_PJJOUE=py -3.14"
  exit /b 0
)
py -3 --version >nul 2>&1
if not errorlevel 1 (
  set "PYTHON_PJJOUE=py -3"
  exit /b 0
)
python --version >nul 2>&1
if not errorlevel 1 (
  set "PYTHON_PJJOUE=python"
  exit /b 0
)
exit /b 1

:preparer_outils_node
where npm.cmd >nul 2>&1
if errorlevel 1 exit /b 1
if exist "node_modules\.bin\eslint.cmd" exit /b 0
echo.
echo Outils Node.js absents ou incomplets : installation automatique avec npm ci...
call npm.cmd ci
if errorlevel 1 exit /b 1
if not exist "node_modules\.bin\eslint.cmd" exit /b 1
exit /b 0

:erreur_node
echo.
echo ============================================================
echo Node.js/npm ou les dependances de developpement sont indisponibles.
echo Lance npm ci manuellement puis relance ce fichier.
echo ============================================================
pause
exit /b 1

:erreur
echo.
echo ============================================================
echo ECHEC - NE PAS POUSSER CETTE VERSION.
echo Corrige le probleme indique ci-dessus, puis relance ce fichier.
echo ============================================================
pause
exit /b 1

:erreur_python
echo.
echo ============================================================
echo Python 3 est introuvable.
echo ============================================================
pause
exit /b 1
