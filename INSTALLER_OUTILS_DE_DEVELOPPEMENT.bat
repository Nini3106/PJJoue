@echo off
chcp 65001 >nul
echo ============================================================
echo PJJoue - Installer les outils de developpement
echo ============================================================
echo.

rem Certaines decompressions Windows ou OneDrive peuvent omettre le petit
rem dossier source Analytics. Les fichiers publics correspondants sont des
rem copies exactes : l'installateur restaure donc automatiquement les sources.
if not exist "code\01 - Éléments communs\Analytics" mkdir "code\01 - Éléments communs\Analytics"
if not exist "code\01 - Éléments communs\Analytics\consentement-analytics.js" copy /Y "ressources\consentement-analytics.js" "code\01 - Éléments communs\Analytics\consentement-analytics.js" >nul
if not exist "code\01 - Éléments communs\Analytics\suivi-analytics-pjjoue.js" copy /Y "ressources\analytics-pjjoue.js" "code\01 - Éléments communs\Analytics\suivi-analytics-pjjoue.js" >nul

rem Utiliser explicitement Python 3.14. La commande « python » n'est jamais
rem appelee car son alias ouvre le Microsoft Store sur ce poste.
py -3.14 --version >nul 2>&1
if errorlevel 1 goto erreur_python

echo 1/3 - Installation des outils JavaScript...
call npm.cmd ci
if errorlevel 1 goto erreur

echo.
echo 2/3 - Installation de Playwright pour Python...
py -3.14 -m pip install -r requirements-dev.txt
if errorlevel 1 goto erreur

echo.
echo 3/3 - Installation de Chromium pour les tests visuels...
py -3.14 -m playwright install chromium
if errorlevel 1 goto erreur

echo.
echo ============================================================
echo Installation terminee. Tu peux lancer VERIFIER_PJJOUE.bat.
echo ============================================================
pause
exit /b 0

:erreur
echo.
echo ============================================================
echo L'installation s'est arretee car une commande a echoue.
echo Lis le message affiche juste au-dessus avant de recommencer.
echo ============================================================
pause
exit /b 1

:erreur_python
echo.
echo ============================================================
echo Python est introuvable. Installe Python 3.14 puis relance ce fichier.
echo ============================================================
pause
exit /b 1
