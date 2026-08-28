@echo off
chcp 65001 >nul
setlocal

echo ============================================================
echo PJJoue - Installer les outils de developpement
 echo ============================================================
echo.

call :trouver_python
if errorlevel 1 goto erreur_python

echo 1/3 - Installation des outils JavaScript...
call npm.cmd ci
if errorlevel 1 goto erreur

echo.
echo 2/3 - Installation de Playwright et Pillow pour Python...
%PYTHON_PJJOUE% -m pip install -r requirements-dev.txt
if errorlevel 1 goto erreur

echo.
echo 3/3 - Installation de Chromium pour les tests et captures visuelles...
%PYTHON_PJJOUE% -m playwright install chromium
if errorlevel 1 goto erreur

echo.
echo ============================================================
echo Installation terminee.
echo - VERIFIER_PJJOUE.bat : tous les controles
 echo - CAPTURER_PJJOUE.bat : captures Chromium
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
echo Python 3 est introuvable. Installe Python puis relance ce fichier.
echo ============================================================
pause
exit /b 1
