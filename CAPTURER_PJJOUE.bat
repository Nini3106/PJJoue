@echo off
chcp 65001 >nul
setlocal

echo ============================================================
echo PJJoue - Captures visuelles Chromium
echo ============================================================
echo.

call :trouver_python
if errorlevel 1 goto erreur_python

%PYTHON_PJJOUE% -c "import playwright" >nul 2>&1
if errorlevel 1 goto erreur_outils

echo 1/2 - Captures de l'interface principale...
%PYTHON_PJJOUE% tests\verifier_regression_visuelle.py
if errorlevel 1 goto erreur

echo.
echo 2/2 - Captures des guides et pages annexes...
%PYTHON_PJJOUE% tests\verifier_pages_annexes.py
if errorlevel 1 goto erreur

echo.
echo ============================================================
echo Captures terminees.
echo Dossiers :
echo   test-results\regression-visuelle-moderne\
echo   test-results\pages-annexes\
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
