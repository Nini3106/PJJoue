@echo off
chcp 65001 >nul
setlocal

echo ============================================================
echo PJJoue V1 - Creation archive UTF-8 verifiee
echo ============================================================
echo.

py -3 outils\creer_archive_utf8.py
if not errorlevel 1 goto fin
python outils\creer_archive_utf8.py
if not errorlevel 1 goto fin

echo.
echo ECHEC - archive non creee. Verifie Python et les messages ci-dessus.
pause
exit /b 1

:fin
echo.
echo Archive creee et controlee. Les noms accentues sont marques UTF-8.
pause
exit /b 0
