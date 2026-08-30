@echo off
chcp 65001 >nul
setlocal

call :trouver_python
if errorlevel 1 goto erreur_python

echo Verification UTF-8 avant construction...
%PYTHON_PJJOUE% outils\verifier_noms_fichiers.py
if errorlevel 1 goto erreur

echo.
echo Construction des donnees...
%PYTHON_PJJOUE% outils\construire_donnees.py
if errorlevel 1 goto erreur

echo.
echo Construction du site et du service worker...
%PYTHON_PJJOUE% outils\construire_site.py
if errorlevel 1 goto erreur

echo.
echo Construction et verification du SEO et du sitemap...
%PYTHON_PJJOUE% outils\construire_seo.py
if errorlevel 1 goto erreur
%PYTHON_PJJOUE% outils\construire_seo.py --verifier
if errorlevel 1 goto erreur

echo.
echo Generation de MANIFESTE.json EN DERNIER, apres le SEO...
%PYTHON_PJJOUE% outils\construire_manifeste.py
if errorlevel 1 goto erreur
%PYTHON_PJJOUE% outils\construire_manifeste.py --verifier
if errorlevel 1 goto erreur

echo.
echo Construction terminee : UTF-8, SEO/sitemap et manifeste a jour.
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
echo ECHEC - construction annulee. Ne pas commit/push.
pause
exit /b 1

:erreur_python
echo Python 3 est introuvable.
pause
exit /b 1
