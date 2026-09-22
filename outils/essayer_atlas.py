#!/usr/bin/env python3
"""Secours sans Node : aperçu lié à cet ordinateur uniquement, pas à Internet."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Timer
import webbrowser
RACINE = Path(__file__).resolve().parents[1]
try:
    serveur = ThreadingHTTPServer(('127.0.0.1',4173),partial(SimpleHTTPRequestHandler,directory=str(RACINE)))
except OSError as erreur:
    raise SystemExit('Le port 4173 est déjà utilisé. Ferme l’autre aperçu puis relance.\n'+str(erreur))
print('Quiz CJPM V1 : http://127.0.0.1:4173 — Ctrl+C pour fermer le serveur local.',flush=True)
Timer(.7,lambda:webbrowser.open('http://127.0.0.1:4173')).start()
try:serveur.serve_forever()
except KeyboardInterrupt:pass
finally:serveur.server_close()
