import csv
import json
import re
import unicodedata
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUESTIONS = json.loads((ROOT / "donnees/questions.json").read_text(encoding="utf-8"))
OUT = ROOT / "audit-resultats"
OUT.mkdir(exist_ok=True)

PARCOURS = {
    "commun": (1, "Découvrir la PJJ", "p1_"),
    "procedure_ordinaire": (2, "Du parquet à la sanction", "p2_"),
    "information_judiciaire": (3, "Comprendre l’information judiciaire", "p3_"),
    "jugement_educatif_ordinaire": (4, "Juger et construire la réponse éducative", "p4_"),
    "matiere_criminelle_peines": (5, "Crimes, sanctions et peines", "p5_"),
    "application_execution_peines": (6, "De la décision à l’exécution", "p6_"),
}

def norm(s):
    s = unicodedata.normalize("NFKD", str(s).lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", s).strip()

def add(findings, level, code, text):
    findings.append((level, code, text))

rows = []
for q in QUESTIONS:
    findings = []
    number, title, own_prefix = PARCOURS[q["theme"]]
    mode = q.get("modePrefere", "")
    answer = str(q.get("bonneReponse", ""))
    stem = str(q.get("enonce", ""))
    hint = str(q.get("indice", ""))
    accepted = q.get("reponsesAcceptees") or []
    concepts = q.get("conceptsEvaluation") or []
    prereqs = q.get("prerequisPedagogiques") or []
    foreign = [p for p in prereqs if re.match(r"^p[1-6]_", p) and not p.startswith(own_prefix)]

    if foreign:
        add(findings, 3, "AUTONOMIE", "Dépendance éditoriale déclarée envers un autre parcours : " + ", ".join(foreign))
    prior_re = r"question[s]? précédente[s]?|étape précédente|déjà (?:vu|rencontré|étudié)|a été (?:donné|présenté|utilisé|étudié)|reprends la chaîne|plus haut|ci-dessus"
    if re.search(prior_re, stem + " " + hint, re.I):
        add(findings, 2, "CONTEXTE_ANTERIEUR", "La formulation renvoie explicitement à un contenu antérieur ; elle fonctionne mal en navigation libre ou session composée.")
    if hint in {"Observe les faits et identifie la règle applicable.", "Réponds avec le concept ou la règle essentielle."}:
        add(findings, 1, "INDICE_GENERIQUE", "Indice générique : il n’aide pas réellement à raisonner.")
    legal_text = stem + " " + answer
    if re.search(r"\b\d+°(?:\s*(?:à|au)\s*\d+°)?|\b\d+\s*bis\b", legal_text, re.I):
        add(findings, 3, "RENVOI_LEGAL_NON_EXPLIQUE", "Notation de texte comme « 5° » ou « 7 bis » non expliquée : incompréhensible pour un utilisateur non juriste.")
    if re.search(r"\b[LRD]\s*\.?\s*\d{3}(?:[-‑]\d+)+\b", stem):
        add(findings, 2, "ARTICLE_DANS_QUESTION", "Numéro d’article utilisé dans la question sans reformulation suffisante ; la règle doit être nommée en langage clair.")
    if re.search(r"\b(?:régime|branche|cadre|interdiction|exception|catégories?) (?:étudié|étudiée|visé|visée|2026)\b", stem, re.I):
        add(findings, 2, "REFERENT_VAGUE", "Référent abstrait ou scolaire (« régime étudié », « branche », « catégories visées ») : l’utilisateur ne sait pas précisément de quoi il s’agit.")
    if re.search(r"\b(?:sous réserve|de plein droit|au titre de|en vertu de|quel que soit le reliquat|dessaisissement)\b", stem, re.I):
        add(findings, 1, "JARGON_JURIDIQUE", "Jargon juridique à reformuler ou à définir avant usage.")
    # Ce contrôle historique ne doit s’activer que si Q1002 mélange encore
    # réellement la qualification des faits avec la question sur l’âge.
    if q.get("id") == 1002 and re.search(r"\b(?:qualification|contravention|délit|crime)\b", stem, re.I):
        add(findings, 2, "INFORMATION_PARASITE", "L’introduction sur la qualification (contravention, délit ou crime) ne sert pas à répondre à la question sur l’âge et mélange deux apprentissages.")
    if re.search(r"\b(?:quel repère viens-tu d’identifier|quel objet faut-il rechercher|quels repères faut-il retrouver)\b", stem, re.I):
        add(findings, 2, "FORMULATION_SCOLAIRE_VAGUE", "La question demande de retrouver un « repère » ou un « objet » sans nommer directement l’information recherchée.")
    if re.search(r"\b(?:elle|il|celui-ci|celle-ci|cette mesure|ce régime|cette branche|ces demandes)\b", stem, re.I) and stem.count(".") == 0 and len(stem) < 95:
        add(findings, 1, "REFERENT_FRAGILE", "Le référent dépend fortement du contexte immédiat et peut devenir ambigu en navigation libre.")

    if mode == "reponse-ecrite":
        if q.get("estEvaluationFinale"):
            add(findings, 3, "EVALUATION_ECRITE", "L’évaluation finale impose une réponse écrite ; le mode doit devenir structuré sauf réponse très courte et univoque.")
        if len(answer) > 70:
            add(findings, 3, "REPONSE_TROP_LONGUE", f"Réponse attendue de {len(answer)} caractères : restitution imprévisible au clavier.")
        elif len(answer) > 40:
            add(findings, 2, "REPONSE_LONGUE", f"Réponse attendue de {len(answer)} caractères : risque élevé de faux négatif ou d’attente opaque.")
        if ("·" in answer or answer.count(";") >= 1 or answer.count(",") >= 3) and not q.get("typeReponseAttendue") == "sigle":
            add(findings, 3, "ENUMERATION_ECRITE", "Plusieurs éléments sont attendus dans un champ libre ; préférer sélection multiple, association, classement ou ordre.")
        if len(accepted) <= 1 and len(answer) > 30 and not concepts:
            add(findings, 3, "ACCEPTATION_OPAQUE", "Une seule formulation déclarée et aucun groupe de concepts : la validation repose sur une proximité de mots invisible pour l’utilisateur.")
        if re.match(r"^(Quels?|Quelles?|Cite|Donne|Énumère|Indique)\b", stem, re.I) and any(x in answer for x in [" · ", ",", ";", " ou "]):
            add(findings, 2, "MODE_INADAPTE", "La consigne appelle plusieurs réponses ; un mode structuré serait plus naturel.")
    if mode == "remettre-ordre" and not re.search(r"ordre|chronolog|séquence|temps|étape|du plus|avant|après", stem, re.I):
        add(findings, 2, "ORDRE_ARTIFICIEL", "Le besoin d’ordonner n’est pas clairement justifié par l’énoncé.")
    if mode == "classer" and not re.search(r"class|range|catégor|colonne|famille|selon", stem, re.I):
        add(findings, 2, "CLASSEMENT_ARTIFICIEL", "La consigne ne présente pas clairement les catégories ou le principe de classement.")
    if re.match(r"^(Que faut-il|Quel réflexe|Quels repères|Quelle règle)\b", stem, re.I) and len(answer) > 55:
        add(findings, 2, "QUESTION_VAGUE", "Question large au regard d’une réponse précise et longue ; plusieurs formulations raisonnables sont possibles.")
    if norm(answer) and len(norm(answer)) > 5 and norm(answer) in norm(stem):
        add(findings, 2, "REPONSE_DANS_ENONCE", "La réponse attendue apparaît littéralement dans l’énoncé.")

    highest = max((f[0] for f in findings), default=0)
    decision = {0: "RAS automatique — relecture humaine", 1: "À améliorer", 2: "À revoir", 3: "À changer absolument"}[highest]
    rows.append({
        "ID": q["id"], "Parcours": number, "Titre du parcours": title, "Étape": q["etape"],
        "Évaluation finale": "Oui" if q.get("estEvaluationFinale") else "Non",
        "Mode": mode, "Énoncé": stem, "Réponse attendue": answer,
        "Décision": decision,
        "Niveau max": highest,
        "Codes": " | ".join(f[1] for f in findings),
        "Constats": " | ".join(f[2] for f in findings),
        "Prérequis externes": ", ".join(foreign),
        "Source": q.get("source", ""),
    })

# Repère les quasi-doublons d’énoncé afin de compléter l’audit sans modifier les décisions déjà graves.
by_theme = defaultdict(list)
for i, q in enumerate(QUESTIONS):
    by_theme[q["theme"]].append((i, norm(q["enonce"])))
for items in by_theme.values():
    for a in range(len(items)):
        ia, sa = items[a]
        for b in range(a + 1, len(items)):
            ib, sb = items[b]
            if abs(len(sa) - len(sb)) > 35 or min(len(sa), len(sb)) < 25:
                continue
            score = SequenceMatcher(None, sa, sb).ratio()
            if score >= 0.88:
                other_a, other_b = QUESTIONS[ib]["id"], QUESTIONS[ia]["id"]
                for idx, other in ((ia, other_a), (ib, other_b)):
                    rows[idx]["Codes"] += (" | " if rows[idx]["Codes"] else "") + "QUASI_DOUBLON"
                    rows[idx]["Constats"] += (" | " if rows[idx]["Constats"] else "") + f"Énoncé très proche de la question {other}."
                    if rows[idx]["Niveau max"] < 2:
                        rows[idx]["Niveau max"] = 2
                        rows[idx]["Décision"] = "À revoir"

csv_path = OUT / "audit_questions_960.csv"
with csv_path.open("w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=list(rows[0]))
    writer.writeheader()
    writer.writerows(rows)

problem_path = OUT / "questions_a_revoir_sans_propositions.csv"
problem_rows = [r for r in rows if r["Parcours"] != 1 and r["Niveau max"] >= 2]
with problem_path.open("w", encoding="utf-8-sig", newline="") as f:
    fields = ["ID", "Parcours", "Titre du parcours", "Étape", "Évaluation finale", "Mode", "Énoncé", "Décision", "Codes", "Constats", "Source"]
    writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(problem_rows)

scope_rows = [r for r in rows if r["Parcours"] != 1]
scope_path = OUT / "audit_800_questions_parcours_2_a_6.csv"
with scope_path.open("w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=list(rows[0]))
    writer.writeheader()
    writer.writerows(scope_rows)

summary = {
    "total": len(rows),
    "decisions": Counter(r["Décision"] for r in rows),
    "codes": Counter(c for r in rows for c in r["Codes"].split(" | ") if c),
    "parcours": {p: Counter(r["Décision"] for r in rows if r["Parcours"] == p) for p in range(1, 7)},
}
(OUT / "synthese_audit.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
print(csv_path)
print(problem_path)
print(scope_path)
print(json.dumps(summary, ensure_ascii=False, indent=2))
