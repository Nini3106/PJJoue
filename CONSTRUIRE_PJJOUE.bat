@echo off
chcp 65001 >nul
py -3.14 outils\verifier_noms_fichiers.py
if errorlevel 1 (
  echo.
  echo Noms de fichiers corrompus detectes. Construction annulee.
  pause
  exit /b 1
)
py -3.14 outils\construire_site.py
if errorlevel 1 pause
