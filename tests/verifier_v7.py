#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
import sys

RACINE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RACINE))
from outils.validation_donnees import valider_donnees


def exiger(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def lire(relatif: str):
    return json.loads((RACINE / relatif).read_text(encoding="utf-8"))


def principal() -> int:
    questions = lire("donnees/questions.json")
    programme = lire("donnees/programme.json")
    sources = lire("donnees/sources.json")
    erreurs = valider_donnees(programme, sources, questions)
    exiger(not erreurs, "Données invalides :\n- " + "\n- ".join(erreurs))
    exiger(len(questions) == 160, "La banque doit contenir 160 questions.")
    exiger([q["id"] for q in questions] == list(range(1, 161)), "Les identifiants Q1 à Q160 doivent être continus.")
    parcours = [q for q in questions if not q.get("estEvaluationFinale")]
    evaluation = [q for q in questions if q.get("estEvaluationFinale")]
    exiger(len(parcours) == 110, "Le parcours doit contenir 110 questions.")
    exiger(len(evaluation) == 50, "L’évaluation doit contenir 50 questions.")
    exiger([q["id"] for q in evaluation] == list(range(111, 161)), "L’évaluation doit utiliser Q111 à Q160.")
    exiger(all(q["etape"] == 12 for q in evaluation), "Toute l’évaluation doit appartenir à l’étape 12.")
    exiger(all(q["modePrefere"] == "reponse-ecrite" for q in evaluation), "Toute l’évaluation doit être écrite.")
    exiger(all(q.get("sansJokers") is True for q in evaluation), "Les jokers doivent être désactivés en évaluation.")
    exiger(all(not str(q.get("indice", "")).strip() for q in evaluation), "L’évaluation ne doit pas afficher d’indice.")
    for etape in range(1, 12):
        exiger(sum(q["etape"] == etape for q in parcours) == 10, f"L’étape {etape} doit contenir 10 questions.")
    etapes = programme["commun"]["etapes"]
    exiger([e["id"] for e in etapes] == list(range(1, 12)), "Le programme doit comporter les étapes 1 à 11.")
    exiger(all(len(e.get("souvenirs", [])) == 3 for e in etapes), "Chaque étape doit avoir trois souvenirs.")
    exiger(all(q.get("source") in sources for q in questions), "Une source principale est absente.")
    exiger(all(ref in sources for q in questions for ref in q.get("referencesSources", [])), "Une référence officielle est absente.")
    exiger(all(str(q.get("indice", "")).strip() for q in parcours), "Chaque question d’apprentissage doit avoir un indice.")
    exiger(len({q["enonce"].strip() for q in questions}) == 160, "Deux énoncés sont identiques.")
    sigles = [q for q in questions if q.get("typeReponseAttendue") in {"sigle", "developpement-sigle"}]
    exiger(sigles, "Aucune règle de forme des sigles n’est déclarée.")
    exiger(all(q.get("sigleAttendu") for q in sigles), "Une question de sigle n’indique pas le sigle attendu.")

    moteur = (RACINE/"ressources/moteur-jeu.js").read_text(encoding="utf-8")
    page = (RACINE/"index.html").read_text(encoding="utf-8")
    guide = (RACINE/"quiz-pjj/index.html").read_text(encoding="utf-8")
    exiger("question.id >= 111" in moteur and "question.id <= 160" in moteur, "Bornes de l’évaluation absentes.")
    exiger("session.length !== 50" in moteur, "Contrôle des 50 questions finales absent.")
    exiger("etat.etape = 12" in moteur, "L’évaluation ne pointe pas vers l’étape 12.")
    exiger("etapeCourante < 10" not in moteur and "Number(etat.etape) < 10" not in moteur, "Une ancienne limite à 10 étapes subsiste.")
    exiger(moteur.count("etapeCourante < 11") >= 2 and "Number(etat.etape) < 11" in moteur, "La navigation vers l’étape 11 est incomplète.")
    exiger("programme.etapes.length" in moteur and "programme.etapes.every" in moteur, "Le déverrouillage ne dépend pas de toutes les étapes.")
    exiger("ÉTAPE 12" in page and "Les 11 destinations" in page, "La page principale n’affiche pas la nouvelle structure.")
    exiger("160 questions" in page, "La page principale n’affiche pas 160 questions.")
    exiger("<strong>11</strong><span>étapes progressives</span>" in guide, "Le guide public n’affiche pas 11 étapes.")
    exiger("12 — Évaluation finale" in (RACINE/"administration.html").read_text(encoding="utf-8"), "Le filtre de l’administration est obsolète.")
    consentement = (RACINE / "ressources/consentement-analytics.js").read_text(encoding="utf-8")
    analytics = (RACINE / "ressources/analytics-pjjoue.js").read_text(encoding="utf-8")
    exiger("GTM-M3LD4ZHK" in consentement and "consent', 'default'" in consentement and "consent', 'update'" in consentement, "Le mode de consentement Google est incomplet.")
    exiger("analytics_storage" in consentement and "pjjoue_consentement_analytics_v1" in consentement, "Le stockage ou l’état Analytics du consentement est incomplet.")
    exiger("PREFIXE_EVENEMENT = 'pjj_'" in analytics and "normaliserParametres" in analytics, "La couche d’événements PJJoue est incomplète.")
    exiger(page.count('src="ressources/consentement-analytics.js"') == 1, "Le module de consentement doit être chargé une seule fois sur l’accueil.")
    exiger(page.count('src="ressources/analytics-pjjoue.js"') == 1, "La couche d’événements doit être chargée une seule fois sur l’accueil.")
    exiger("www.googletagmanager.com/gtm.js" not in page and "Google Tag Manager (noscript)" not in page, "GTM ne doit pas être chargé directement avant le consentement.")
    pages_publiques = [
        "accessibilite.html", "confidentialite.html", "mentions-legales.html",
        "decouvrir-la-pjj/index.html", "organisation-pjj/index.html", "metiers-pjj/index.html",
        "structures-pjj/index.html", "mesures-educatives-pjj/index.html", "sigles-pjj/index.html",
        "quiz-pjj/index.html",
    ]
    for chemin_page in pages_publiques:
        contenu_page = (RACINE / chemin_page).read_text(encoding="utf-8")
        exiger("consentement-analytics.js" in contenu_page, f"Le consentement est absent de {chemin_page}.")
        exiger("www.googletagmanager.com/gtm.js" not in contenu_page and "Google Tag Manager (noscript)" not in contenu_page, f"GTM est encore chargé directement dans {chemin_page}.")
    exiger("data-pjj-ouvrir-consentement" in (RACINE / "confidentialite.html").read_text(encoding="utf-8"), "La commande de modification du consentement est absente.")
    evenements_attendus = [
        "screen_view", "level_start", "question_view", "question_answer", "question_skip",
        "question_replay", "joker_use", "level_end", "level_abandon", "progress_export",
        "progress_import", "progress_reset", "settings_save",
    ]
    exiger(all(f"'{nom}'" in moteur for nom in evenements_attendus), "Un événement métier Analytics manque dans le moteur.")
    exiger("pjj_question_id" in moteur and "question?.id" in moteur, "Le suivi des questions ne repose pas sur leur identifiant stable.")
    print("OK — 160 questions · 11 étapes d’apprentissage · 50 réponses écrites finales")
    return 0


if __name__ == "__main__":
    raise SystemExit(principal())
