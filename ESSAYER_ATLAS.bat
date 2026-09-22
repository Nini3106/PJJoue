@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Quiz CJPM V1 - Apercu local
where node >nul 2>&1
if not errorlevel 1 (
  node outils\essayer_atlas.js
  goto fin
)
where py >nul 2>&1
if not errorlevel 1 (
  py -3 outils\essayer_atlas.py
  goto fin
)
where python >nul 2>&1
if not errorlevel 1 (
  python outils\essayer_atlas.py
  goto fin
)
echo Node.js ou Python est necessaire pour le serveur de test local.
echo Ouverture de index.html directement : le jeu peut etre consulte sans serveur.
echo L'installation et les mises a jour automatiques ne sont pas disponibles dans ce mode.
start "" "%~dp0index.html"
:fin
pause
