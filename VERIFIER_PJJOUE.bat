@echo off
chcp 65001 >nul
setlocal

echo ============================================================
echo PJJoue - Verification avant publication
 echo ============================================================
echo.

call :trouver_python
if errorlevel 1 goto erreur_python

if not exist "node_modules\.bin\eslint.cmd" goto erreur_node

echo 1/12 - Verification UTF-8 des noms et fichiers texte...
%PYTHON_PJJOUE% outils\verifier_noms_fichiers.py
if errorlevel 1 goto erreur

echo.
echo 2/12 - Verification des donnees, de la construction, du SEO et du manifeste...
%PYTHON_PJJOUE% outils\construire_donnees.py --verifier
if errorlevel 1 goto erreur
%PYTHON_PJJOUE% outils\construire_site.py --verifier
if errorlevel 1 goto erreur
%PYTHON_PJJOUE% outils\construire_seo.py --verifier
if errorlevel 1 goto erreur
%PYTHON_PJJOUE% outils\construire_manifeste.py --verifier
if errorlevel 1 goto erreur

echo.
echo 3/12 - Controle du JavaScript...
call npm.cmd run controle:javascript
if errorlevel 1 goto erreur

echo.
echo 4/12 - Controle des doublons CSS...
call npm.cmd run controle:css:doublons
if errorlevel 1 goto erreur

echo.
echo 5/12 - Controle de la structure CSS...
call npm.cmd run controle:css:structure
if errorlevel 1 goto erreur

echo.
echo 6/12 - Tests unitaires des donnees...
%PYTHON_PJJOUE% -m unittest discover -s tests -p test_*.py
if errorlevel 1 goto erreur

echo.
echo 7/12 - Verification des questions et des fichiers...
%PYTHON_PJJOUE% tests\verifier_pjjoue.py
if errorlevel 1 goto erreur

echo.
echo 8/12 - Recette de l'interface dans Chromium...
%PYTHON_PJJOUE% tests\verifier_interface.py
if errorlevel 1 goto erreur

echo.
echo 9/12 - Controle automatique de l'accessibilite...
%PYTHON_PJJOUE% outils\auditer_accessibilite_statique.py
if errorlevel 1 goto erreur

echo.
echo 10/12 - Rappel de verification des sources tous les 365 jours...
%PYTHON_PJJOUE% outils\verifier_fraicheur_sources.py
if errorlevel 1 goto erreur

echo.
echo 11/12 - Verification des liens officiels...
%PYTHON_PJJOUE% outils\verifier_liens_officiels.py
if errorlevel 1 goto erreur

echo.
echo 12/12 - Captures visuelles ordinateur et mobile...
%PYTHON_PJJOUE% tests\verifier_regression_visuelle.py
if errorlevel 1 goto erreur

echo.
echo ============================================================
echo Tous les controles automatiques sont termines sans erreur.
echo Captures : test-results\regression-visuelle-moderne\
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

:erreur_node
echo.
echo ============================================================
echo Les dependances Node.js ne sont pas installees ou sont incompletes.
echo Lance PREPARER_PJJOUE_AVANT_PUSH.bat ^(recommande^) ou npm ci.
echo ============================================================
pause
exit /b 1

:erreur
echo.
echo ============================================================
echo Un controle a echoue. Ne publie pas cette version avant correction.
echo Lis le message affiche juste au-dessus.
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
