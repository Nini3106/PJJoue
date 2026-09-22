@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================================
echo PJJoue - Captures visuelles Chromium
echo ============================================================
echo.

call :trouver_python
if errorlevel 1 goto erreur_python

%PYTHON_PJJOUE% -c "import playwright" >nul 2>&1
if errorlevel 1 goto erreur_outils

echo Captures et interactions Atlas - ordinateur, mobile, guides et pages annexes...
%PYTHON_PJJOUE% tests\verifier_atlas.py --captures
if errorlevel 1 goto erreur

echo.
echo ============================================================
echo Captures terminees : test-results\atlas\
echo Le rapport JSON indique les controles et leurs limites.
echo Aucune publication n'a ete effectuee.
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

:erreur_outils
echo.
echo Playwright n'est pas installe.
echo Lance d'abord INSTALLER_OUTILS_DE_DEVELOPPEMENT.bat.
pause
exit /b 1

:erreur_python
echo.
echo Python 3 est introuvable.
pause
exit /b 1

:erreur
echo.
echo Une recette visuelle a echoue. Lis le message ci-dessus.
pause
exit /b 1
