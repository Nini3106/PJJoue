#!/usr/bin/env python3
from __future__ import annotations
import json
from hashlib import sha256
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
    exiger(all(q.get("versionContenu") == "V1" for q in questions), "Toutes les questions doivent être marquées V1.")
    ids_attendus = list(range(1, 43)) + list(range(44, 101)) + list(range(111, 145)) + list(range(146, 154)) + [156] + list(range(161, 179))
    exiger([q["id"] for q in questions] == ids_attendus, "Les identifiants actifs doivent respecter les IDs permanents et les retraits documentés.")
    parcours = [q for q in questions if not q.get("estEvaluationFinale")]
    evaluation = [q for q in questions if q.get("estEvaluationFinale")]
    exiger(len(parcours) == 110, "Le parcours doit contenir 110 questions.")
    exiger(len(evaluation) == 50, "L’évaluation doit contenir 50 questions.")
    ids_evaluation_attendus = list(range(111, 145)) + list(range(146, 154)) + [156] + list(range(172, 179))
    exiger([q["id"] for q in evaluation] == ids_evaluation_attendus, "L’évaluation doit conserver les IDs continus sur les compétences inchangées et utiliser de nouveaux IDs pour les remplacements.")
    exiger(all(q["etape"] == 12 for q in evaluation), "Toute l’évaluation doit appartenir à l’étape 12.")
    exiger(all(q["modePrefere"] == "reponse-ecrite" for q in evaluation), "Toute l’évaluation doit être écrite.")
    exiger(all(q.get("sansJokers") is True for q in evaluation), "Les jokers doivent être désactivés en évaluation.")
    exiger(all(not str(q.get("indice", "")).strip() for q in evaluation), "L’évaluation ne doit pas afficher d’indice.")
    exiger(sorted(q.get("ordreEtape") for q in evaluation) == list(range(1, 51)), "L’évaluation doit avoir un ordre pédagogique 1 à 50 indépendant des IDs Analytics.")
    q170 = next(q for q in questions if q["id"] == 170)
    exiger(q170.get("modePrefere") == "reponse-ecrite" and len(q170.get("reponsesAcceptees", [])) >= 20, "Les variantes de la réponse « support éducatif » sont incomplètes.")
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
    source_entrainement = (RACINE / "code/05 - Entraînement libre/contenu.html").read_text(encoding="utf-8")
    exiger("Étape 1 → Étape 11" in source_entrainement and "Étape 1 → Étape 11" in page, "L’entraînement doit annoncer les étapes 1 à 11 dans la source et la page construite.")
    ancienne_limite_visuelle = "Étape 1 → Étape " + str(10)
    exiger(ancienne_limite_visuelle not in source_entrainement + page, "Une ancienne limite visuelle à 10 étapes subsiste.")
    exiger("question.estEvaluationFinale === true" in moteur, "L’évaluation doit être sélectionnée par son marqueur éditorial et non par une plage d’IDs obsolète.")
    exiger("session.length !== 50" in moteur, "Contrôle des 50 questions finales absent.")
    exiger("etat.etape = 12" in moteur, "L’évaluation ne pointe pas vers l’étape 12.")
    exiger("etapeCourante < 10" not in moteur and "Number(etat.etape) < 10" not in moteur, "Une ancienne limite à 10 étapes subsiste.")
    exiger(moteur.count("etapeCourante < 11") >= 2 and "Number(etat.etape) < 11" in moteur, "La navigation vers l’étape 11 est incomplète.")
    exiger("programme.etapes.length" in moteur and "programme.etapes.every" in moteur, "Le déverrouillage ne dépend pas de toutes les étapes.")
    exiger("ÉTAPE 12" in page and "Les 11 destinations" in page, "La page principale n’affiche pas la nouvelle structure.")
    exiger("160 questions" in page, "La page principale n’affiche pas 160 questions.")
    exiger('href="sources.html"' in page, "Le lien vers les sources officielles manque dans le pied de page.")
    page_sources = (RACINE / "sources.html").read_text(encoding="utf-8")
    exiger("Sources officielles" in page_sources and "ressources/sources-pjjoue.js" in page_sources, "La page autonome des sources est incomplète.")
    exiger((RACINE / "ressources/panorama-accueil.webp").is_file() and (RACINE / "ressources/panorama-accueil-mobile.webp").is_file(), "Les images WebP optimisées de l’accueil manquent.")
    exiger("panorama-accueil-mobile.webp" in page and "panorama-accueil.webp" in page, "L’accueil n’utilise pas les images optimisées selon la largeur d’écran.")
    exiger("<picture>" not in page and 'class="accueil-presentation-image"' in page, "La structure stable de l’image d’accueil a été modifiée.")
    adaptation = (RACINE / "ressources/styles/90-adaptation-ecrans-et-etats-finaux.css").read_text(encoding="utf-8")
    exiger("@media (max-width:1280px)" in adaptation, "Le menu replié des grands appareils tactiles n’est pas protégé.")
    exiger('body[data-ecran-actif="accueil"] main.conteneur' in adaptation and "min-height: 0" in adaptation, "Le retrait du grand vide avant les guides n’est pas protégé.")
    exiger("<strong>11</strong><span>étapes progressives</span>" in guide, "Le guide public n’affiche pas 11 étapes.")
    exiger("12 — Évaluation finale" in (RACINE/"administration.html").read_text(encoding="utf-8"), "Le filtre de l’administration est obsolète.")
    consentement = (RACINE / "ressources/consentement-analytics.js").read_text(encoding="utf-8")
    analytics = (RACINE / "ressources/analytics-pjjoue.js").read_text(encoding="utf-8")
    empreintes_analytics = lire("tests/empreintes_analytics.json")
    for chemin, empreinte_attendue in empreintes_analytics.items():
        empreinte_actuelle = sha256((RACINE / chemin).read_bytes()).hexdigest()
        exiger(empreinte_actuelle == empreinte_attendue, f"Le fichier Analytics protégé a changé : {chemin}.")
    exiger("GTM-M3LD4ZHK" in consentement and "consent', 'default'" in consentement and "consent', 'update'" in consentement, "Le mode de consentement Google est incomplet.")
    exiger("analytics_storage" in consentement and "pjjoue_consentement_analytics_v1" in consentement, "Le stockage ou l’état Analytics du consentement est incomplet.")
    exiger("PREFIXE_EVENEMENT = 'pjjoue_'" in analytics and "normaliserParametres" in analytics, "La couche d’événements PJJoue est incomplète.")
    exiger(page.count('src="ressources/consentement-analytics.js"') == 1, "Le module de consentement doit être chargé une seule fois sur l’accueil.")
    exiger(page.count('src="ressources/analytics-pjjoue.js"') == 1, "La couche d’événements doit être chargée une seule fois sur l’accueil.")
    exiger("www.googletagmanager.com/gtm.js" not in page and "Google Tag Manager (noscript)" not in page, "GTM ne doit pas être chargé directement avant le consentement.")
    pages_publiques = [
        "accessibilite.html", "confidentialite.html", "mentions-legales.html", "sources.html",
        "preparer-arrivee-pjj/index.html", "concours-educateur-pjj/index.html", "decouvrir-la-pjj/index.html", "organisation-pjj/index.html", "metiers-pjj/index.html",
        "structures-pjj/index.html", "mesures-educatives-pjj/index.html", "sigles-pjj/index.html",
        "quiz-pjj/index.html",
    ]
    for chemin_page in pages_publiques:
        contenu_page = (RACINE / chemin_page).read_text(encoding="utf-8")
        exiger("consentement-analytics.js" in contenu_page, f"Le consentement est absent de {chemin_page}.")
        exiger("www.googletagmanager.com/gtm.js" not in contenu_page and "Google Tag Manager (noscript)" not in contenu_page, f"GTM est encore chargé directement dans {chemin_page}.")
    exiger("data-pjj-ouvrir-consentement" in (RACINE / "confidentialite.html").read_text(encoding="utf-8"), "La commande de modification du consentement est absente.")
    evenements_attendus = [
        "page_consultee", "session_commencee", "question_affichee", "reponse_validee",
        "question_passee", "question_rejouee", "joker_utilise", "session_terminee",
        "session_quittee", "defi_du_hasard_lance", "progression_exportee",
        "progression_importee", "progression_reinitialisee", "parametres_enregistres",
    ]
    exiger(all(f"'{nom}'" in moteur for nom in evenements_attendus), "Un événement métier Analytics manque dans le moteur.")
    exiger("pjjoue_identifiant_question" in moteur and "obtenirIdentifiantQuestionAnalytics" in moteur, "Le suivi des questions ne repose pas sur leur identifiant stable.")
    exiger("pjjoue_nom_question" in moteur and "question?.enonce" in moteur, "Le libellé lisible de la question n’est pas envoyé à Analytics.")
    exiger("pjjoue_numero_etape" in moteur and "pjjoue_nom_etape" in moteur, "Le suivi Analytics des étapes est incomplet.")
    exiger("etapeAnalyticsPermanent" in moteur and "idAnalyticsPermanent" in json.dumps(programme, ensure_ascii=False), "L’identité Analytics permanente des étapes n’est pas séparée de leur ordre visible.")
    exiger("pjjoue_defi_chrono" in moteur and "pjjoue_nombre_questions_defi_du_hasard" in moteur, "Le suivi des défis PJJoue est incomplet.")

    # Garde-fous : ordre pédagogique indépendant des identifiants Analytics,
    # reprise robuste de la question active et validation persistante sans joker.
    exiger("obtenirOrdrePedagogiqueQuestion" in moteur and "ordreEtape" in moteur, "L’ordre pédagogique indépendant des identifiants permanents manque.")
    exiger("CLE_SESSION_EN_COURS" in moteur and "restaurerSessionEnCours" in moteur, "La restauration de la session de question active manque.")
    exiger("verifierRenduQuestionActif" in moteur and "window.addEventListener('resize'" in moteur, "La réparation du rendu après changement de largeur manque.")
    exiger("V3-activites-educatives" in moteur and "migrerSauvegardeV2VersV3" in moteur, "La migration de sauvegarde vers la nouvelle organisation manque.")
    exiger("reinitialiserValidationSansJokerEtape" in moteur and "compterReussitesAutonomesEtape" in moteur, "Le suivi persistant des réussites sans joker est incomplet.")
    exiger("(etat.tentativesQuestions?.get(question.id) || 0) < 1" in moteur, "La limite d’une seule reprise par question manque.")
    exiger(all(identifiant in page for identifiant in ["contexteEtapeQuestion", "numeroEtapeQuestion", "titreEtapeQuestion", "compteurSansJokerQuestion", "boutonReinitialiserValidationsSansJoker"]), "Les repères discrets au-dessus de la carte de question sont incomplets.")
    print("OK — 160 questions · 11 étapes d’apprentissage · 50 réponses écrites finales")
    return 0


if __name__ == "__main__":
    raise SystemExit(principal())
