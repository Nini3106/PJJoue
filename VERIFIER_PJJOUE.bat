@echo off
chcp 65001 >nul
echo ============================================================
echo PJJoue - Verification avant publication
echo ============================================================
echo.
py -3.14 --version >nul 2>&1
if errorlevel 1 goto erreur_python

echo 1/8 - Verification de la construction...
py -3.14 outils\construire_site.py --verifier
if errorlevel 1 goto erreur

echo.
echo 2/8 - Controle du JavaScript...
call npm.cmd run controle:javascript
if errorlevel 1 goto erreur

echo.
echo 3/8 - Controle des doublons CSS...
call npm.cmd run controle:css:doublons
if errorlevel 1 goto erreur

echo.
echo 4/8 - Controle de la structure CSS...
call npm.cmd run controle:css:structure
if errorlevel 1 goto erreur

echo.
echo 5/8 - Tests unitaires des donnees...
py -3.14 -m unittest discover -s tests -p test_*.py
if errorlevel 1 goto erreur

echo.
echo 6/8 - Verification des questions et des fichiers...
py -3.14 tests\verifier_pjjoue.py
if errorlevel 1 goto erreur

echo.
echo 7/8 - Recette de l'interface dans Chromium...
py -3.14 tests\verifier_interface.py
if errorlevel 1 goto erreur

echo.
echo 8/8 - Captures visuelles ordinateur, portable et mobile...
py -3.14 tests\verifier_regression_visuelle.py
if errorlevel 1 goto erreur

echo.
echo ============================================================
echo Tous les controles automatiques sont termines sans erreur.
echo Regarde aussi les captures dans test-results\regression-visuelle.
echo ============================================================
pause
exit /b 0

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
echo Python 3.14 est introuvable. Verifie avec : py -3.14 --version
echo ============================================================
pause
exit /b 1
