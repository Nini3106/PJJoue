@echo off
py -3.14 outils\construire_site.py
if errorlevel 1 pause
