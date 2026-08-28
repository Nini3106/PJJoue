from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
questions = json.loads((ROOT / "donnees/questions.json").read_text(encoding="utf-8"))
programme = json.loads((ROOT / "donnees/programme.json").read_text(encoding="utf-8"))

MOTIFS = [
    ("numero_parcours", re.compile(r"\bP[1-6]\b", re.I)),
    ("parcours_explicit", re.compile(r"\bparcours\s+(?:précédent|precedent|suivant|[1-6])\b", re.I)),
    ("apprentissage_explicit", re.compile(r"\b(?:déjà|deja)\s+(?:vu|appris|étudi\w*|abord\w*)\b", re.I)),
    ("comme_appris", re.compile(r"\bcomme\s+(?:déjà\s+)?(?:vu|appris|étudi\w*)\b", re.I)),
    ("enseignement_futur", re.compile(r"\b(?:sera|seront)\s+étudi\w*\s+(?:plus\s+tard|plus\s+loin|ensuite)\b", re.I)),
    ("etude_plus_tard", re.compile(r"\bétudi\w*\s+(?:plus\s+tard|plus\s+loin|auparavant|précédemment|precedemment)\b", re.I)),
    ("meta_pjjoue", re.compile(r"\b(?:PJJoue|cursus)\b", re.I)),
    ("meta_bloc", re.compile(r"\b(?:prochain\s+bloc|bloc\s+consacré)\b", re.I)),
    ("meta_etude", re.compile(r"\b(?:avant\s+d[’']étudier|étudiée?\s+ensuite|distingué\s+ultérieurement)\b", re.I)),
]

erreurs = []
def verifier(identifiant, emplacement, valeur):
    if not isinstance(valeur, str):
        return
    for nom, motif in MOTIFS:
        if motif.search(valeur):
            erreurs.append((identifiant, emplacement, nom, valeur))

for q in questions:
    if q.get("theme") == "commun":
        continue
    for champ in ["enonce", "explication", "indice", "bonneReponse", "sourcePedagogique"]:
        verifier(q.get("id"), champ, q.get(champ, ""))
    for champ in ["mauvaisesReponses", "propositionsAConserver", "propositionsAEliminer"]:
        for i, valeur in enumerate(q.get(champ, []) or []):
            verifier(q.get("id"), f"{champ}[{i}]", valeur)
    activite = q.get("activite") or {}
    for champ in ["consigne", "libelleAffiche"]:
        verifier(q.get("id"), f"activite.{champ}", activite.get(champ, ""))
    for champ in ["propositions", "categories", "elements", "colonneGauche", "colonneDroite"]:
        for i, item in enumerate(activite.get(champ, []) or []):
            if isinstance(item, dict):
                verifier(q.get("id"), f"activite.{champ}[{i}]", item.get("texte", ""))

for theme, rec in programme.items():
    if theme == "commun":
        continue
    for champ in ["sequence", "titre", "sousTitre"]:
        verifier(f"programme:{theme}", champ, rec.get(champ, ""))
    for etape in rec.get("etapes", []):
        verifier(f"programme:{theme}:e{etape.get('id')}", "titre", etape.get("titre", ""))
        for i, valeur in enumerate(etape.get("souvenirs", []) or []):
            verifier(f"programme:{theme}:e{etape.get('id')}", f"souvenir[{i}]", valeur)

if erreurs:
    for erreur in erreurs:
        print("\t".join(map(str, erreur)))
    raise SystemExit(f"Navigation libre : {len(erreurs)} référence(s) pédagogique(s) explicite(s) détectée(s).")

print("OK — navigation libre : 0 référence inter-parcours visible")
