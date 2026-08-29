#!/usr/bin/env python3
from __future__ import annotations
import json
from hashlib import sha256
from pathlib import Path
import re
import sys

RACINE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RACINE))
from outils.validation_donnees import valider_donnees

THEMES_ATTENDUS = (
    "commun",
    "procedure_ordinaire",
    "information_judiciaire",
    "jugement_educatif_ordinaire",
    "matiere_criminelle_peines",
    "application_execution_peines",
)
THEMES_NOUVEAUX = THEMES_ATTENDUS[1:]
FORMULATIONS_INTERDITES = (
    "procédure locale",
    "procedure locale",
    "règle locale",
    "regle locale",
    "circuit local",
    "pratiques du service",
    "procédure du service",
    "procedure du service",
    "assistante administrative",
    "copie cachée",
    "cci",
    "seuil interne",
    "parcours étudié",
    "niveau du parcours",
    "programme précédent",
)
INDICES_GENERIQUES = {
    "Observe les faits et identifie la règle applicable.",
    "Réponds avec le concept ou la règle essentielle.",
}
STATUT_FINAL_P1 = "Révisée et vérifiée selon la charte PJJoue"
STATUT_FINAL_JURIDIQUE = "Révisée et vérifiée sur les sources indiquées"
REFERENCES_METAPEDAGOGIQUES = re.compile(
    r"question(?:s)? précédente(?:s)?|étape précédente|dans ce parcours|"
    r"déjà étudié(?:e|es|s)?|déjà rencontré(?:e|es|s)?|"
    r"introduit(?:e|es|s)? pendant l[’']apprentissage|"
    r"(?:organisation|repères?|cadre|notion|règle|contenu) (?:déjà )?étudié(?:e|es|s)?|"
    r"repère pédagogique",
    re.IGNORECASE,
)
REFERENCE_FICHE_DANS_ENONCE = re.compile(r"\bfiche(?:s)?\b", re.IGNORECASE)


def exiger(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def lire(relatif: str):
    return json.loads((RACINE / relatif).read_text(encoding="utf-8"))


def normaliser_texte(valeur: object) -> str:
    texte = str(valeur).casefold()
    texte = re.sub(r"[^a-zà-ÿ0-9]+", " ", texte)
    return " ".join(texte.split())


def verifier_prerequis_pedagogiques(questions: list[dict]) -> None:
    # Chaque parcours peut être commencé directement. Les dépendances pédagogiques
    # sont donc résolues à l’intérieur du parcours courant, jamais grâce à un autre.
    for identifiant in THEMES_ATTENDUS:
        connus: set[str] = set()
        parcours = [q for q in questions if q.get("theme") == identifiant and not q.get("estEvaluationFinale")]
        parcours.sort(key=lambda q: (int(q.get("etape", 0)), ordre_pedagogique(q)))
        for question in parcours:
            requis = set(question.get("prerequisPedagogiques", []))
            manquants = requis - connus
            exiger(not manquants, f"{identifiant} Q{question['id']} utilise avant introduction : {sorted(manquants)}")
            introduits = set(question.get("introduitConcepts", []))
            exiger(not (requis & introduits), f"{identifiant} Q{question['id']} teste une notion au moment même où elle est introduite : {sorted(requis & introduits)}")
            connus.update(introduits)


def verifier_formulations_publiques(questions: list[dict]) -> None:
    for question in questions:
        exiger(question.get("procedureLocale") is not True, f"Q{question['id']} est marquée comme procédure locale.")
        texte = json.dumps(question, ensure_ascii=False).lower()
        for formulation in FORMULATIONS_INTERDITES:
            exiger(formulation not in texte, f"Q{question['id']} contient une formulation non publique : {formulation!r}")

        enonce = str(question.get("enonce", "")).strip()
        exiger(
            not re.match(
                r"^(?:ce|cet|cette|ces|il|elle|ils|elles|son|sa|ses|une autre|un autre|"
                r"l[’']autre|le même|la même|ce mois|dans cette|dans ce régime|à ce stade)\b",
                enonce,
                re.IGNORECASE,
            ),
            f"Q{question['id']} commence par un référent qui dépend d’un contexte absent.",
        )
        exiger("branche" not in enonce.casefold(), f"Q{question['id']} emploie le repère pédagogique vague « branche ».")
        exiger(
            not re.search(r"\b(?:régime|seuil|réserve|cadre|cas|règle)\s+(?:étudié|étudiée|précédent|précédente)\b", enonce, re.IGNORECASE),
            f"Q{question['id']} contient un référent vague vers un contenu antérieur.",
        )
        exiger(
            not re.search(
                r"\b(?:avant d[’']aborder|question(?:s)? précédente(?:s)?|étape précédente|"
                r"déjà (?:vu|étudié|rencontré|été rencontré(?:e|es|s)?)|"
                r"(?:vient|viennent) d[’']être présenté(?:e|es|s)?|ce mois|l[’']autre (?:exception|règle|cas|seuil|régime)|"
                r"dans (?:ce|le) parcours|"
                r"(?:champ|procédure|matière) [^.?!]{0,30} étudié(?:e)?)\b",
                enonce,
                re.IGNORECASE,
            ),
            f"Q{question['id']} annonce une progression ou dépend d’un contenu antérieur.",
        )

        contenu_visible = json.dumps(
            {
                "enonce": question.get("enonce"),
                "indice": question.get("indice"),
                "explication": question.get("explication"),
                "bonneReponse": question.get("bonneReponse"),
                "mauvaisesReponses": question.get("mauvaisesReponses"),
                "propositionsAConserver": question.get("propositionsAConserver"),
                "propositionsAEliminer": question.get("propositionsAEliminer"),
                "activite": question.get("activite"),
            },
            ensure_ascii=False,
        )
        contenu_hors_correction = json.dumps(
            {
                "enonce": question.get("enonce"),
                "indice": question.get("indice"),
                "bonneReponse": question.get("bonneReponse"),
                "mauvaisesReponses": question.get("mauvaisesReponses"),
                "propositionsAConserver": question.get("propositionsAConserver"),
                "propositionsAEliminer": question.get("propositionsAEliminer"),
                "activite": question.get("activite"),
            },
            ensure_ascii=False,
        )
        exiger(
            not re.search(r"\b\d+°|\b\d+\s+bis\b", contenu_visible, re.IGNORECASE),
            f"Q{question['id']} affiche une notation juridique brute non expliquée.",
        )
        exiger(
            not re.search(r"\b(?:article\s+|[LRD]\.?\s*)\d+(?:-\d+)+(?:-\d+)*", contenu_hors_correction, re.IGNORECASE),
            f"Q{question['id']} affiche un numéro d’article qui devrait rester dans la correction ou la source.",
        )
        if question.get("modePrefere") in {"selection-multiple", "association", "classer", "remettre-ordre"}:
            exiger(
            not str(question.get("bonneReponse", "")).strip().casefold().startswith(("chaque ", "tous les ")),
                f"Q{question['id']} conserve une correction générique au lieu du résultat concret de l’activité.",
            )
        if not question.get("estEvaluationFinale"):
            exiger(
                question.get("indice") not in INDICES_GENERIQUES,
                f"Q{question['id']} conserve un indice générique qui n’aide pas le débutant.",
            )
            indice_normalise = normaliser_texte(question.get("indice", ""))
            reponse_normalisee = normaliser_texte(question.get("bonneReponse", ""))
            exiger(
                len(reponse_normalisee) < 15 or reponse_normalisee not in indice_normalise,
                f"Q{question['id']} recopie sa bonne réponse dans l’indice.",
            )
        texte_pedagogique = " ".join(
            str(question.get(champ, "")) for champ in ("enonce", "indice", "explication")
        )
        exiger(
            not REFERENCES_METAPEDAGOGIQUES.search(texte_pedagogique),
            f"Q{question['id']} rend la progression explicite ou suppose un contenu antérieur.",
        )
        exiger(
            not REFERENCE_FICHE_DANS_ENONCE.search(str(question.get("enonce", ""))),
            f"Q{question['id']} renvoie à une fiche dans son énoncé.",
        )


def longueur_maximale_serie_modes(questions: list[dict]) -> int:
    """Mesure la plus longue série consécutive d’un même mode éditorial."""
    maximum = 0
    precedent = None
    courant = 0
    for question in questions:
        mode = question.get("modePrefere")
        courant = courant + 1 if mode == precedent else 1
        maximum = max(maximum, courant)
        precedent = mode
    return maximum


def ordre_pedagogique(question: dict) -> int:
    """Reproduit exactement le repli d’ordre utilisé par le moteur du site."""
    ordre_explicite = question.get("ordreEtape")
    if isinstance(ordre_explicite, int) and ordre_explicite > 0:
        return ordre_explicite
    return int(question.get("id", 0)) - ((int(question.get("etape", 1)) - 1) * 10)


def principal() -> int:
    questions = lire("donnees/questions.json")
    programme = lire("donnees/programme.json")
    sources = lire("donnees/sources.json")
    erreurs = valider_donnees(programme, sources, questions)
    exiger(not erreurs, "Données invalides :\n- " + "\n- ".join(erreurs))

    exiger(tuple(programme) == THEMES_ATTENDUS, "Les six parcours de livraison doivent être présents dans l’ordre attendu.")
    exiger(len(questions) == 960, "La banque V1 doit contenir 960 questions.")
    ids = [q["id"] for q in questions]
    exiger(len(ids) == len(set(ids)), "Les identifiants de questions doivent être uniques.")
    questions_relues = [question for question in questions if question.get("theme") in THEMES_NOUVEAUX]
    exiger(len(questions_relues) == 800, "Les parcours 2 à 6 doivent contenir exactement 800 questions relues.")
    questions_p2 = [question for question in questions_relues if question.get("theme") == "procedure_ordinaire"]
    questions_p3_p6 = [question for question in questions_relues if question.get("theme") != "procedure_ordinaire"]
    exiger(len(questions_p2) == 160, "Le parcours 2 doit contenir exactement 160 questions.")
    exiger(
        all(question.get("derniereVerification") == "2026-08-29" for question in questions_p2),
        "Les 160 questions du parcours 2 doivent porter la date de relecture éditoriale du 29 août 2026.",
    )
    exiger(
        all(question.get("derniereVerification") == "2026-08-29" for question in questions_p3_p6),
        "Les 640 questions des parcours 3 à 6 doivent porter la date de relecture éditoriale du 29 août 2026.",
    )
    exiger(
        all(question.get("statutContenu") == STATUT_FINAL_JURIDIQUE for question in questions_relues),
        "Les 800 questions des parcours 2 à 6 doivent porter le statut final vérifié.",
    )
    exiger(
        all(
            question.get("statutContenu") == STATUT_FINAL_P1
            for question in questions
            if question.get("theme") == "commun"
        ),
        "Les 160 questions du parcours 1 doivent porter le statut final harmonisé.",
    )

    # En ouverture locale file://, Chrome refuse un manifeste statique et affiche des erreurs CORS.
    # Le manifeste PWA doit donc être injecté uniquement en HTTP(S) par navigation-locale.js.
    index_html = (RACINE / "index.html").read_text(encoding="utf-8")
    navigation_locale = (RACINE / "ressources/navigation-locale.js").read_text(encoding="utf-8")
    consentement_analytics = (RACINE / "ressources/consentement-analytics.js").read_text(encoding="utf-8")
    exiger('rel="manifest"' not in index_html, "index.html ne doit pas charger le manifeste statiquement en mode fichier local.")
    exiger("/^https?:$/.test(window.location.protocol)" in navigation_locale, "Le manifeste doit être limité aux protocoles HTTP(S).")
    exiger("window.location.protocol !== 'file:'" in navigation_locale, "Le service worker doit rester désactivé en mode file://.")
    exiger("new URL('../', scriptNavigation.src)" in navigation_locale, "La racine de l'application doit être calculée depuis le script pour fonctionner sous un sous-chemin GitHub Pages.")
    exiger("new URL('manifest.webmanifest', racineApplication)" in navigation_locale, "Le manifeste doit respecter le sous-chemin GitHub Pages.")
    exiger("new URL('service-worker.js', racineApplication)" in navigation_locale, "Le service worker doit respecter le sous-chemin GitHub Pages.")
    exiger("'/manifest.webmanifest'" not in navigation_locale and "'/service-worker.js'" not in navigation_locale, "Les ressources PWA ne doivent pas pointer vers la racine du domaine.")
    exiger(
        "const CONTEXTE_WEB = /^https?:$/.test(window.location.protocol);" in consentement_analytics
        and "if (!CONTEXTE_WEB || gtmCharge" in consentement_analytics,
        "Google Tag Manager doit rester désactivé en mode file://.",
    )
    exiger((RACINE / "guides/index.html").is_file(), "La page d’accueil dédiée aux guides doit être construite dans guides/index.html.")

    apprentissage = [q for q in questions if not q.get("estEvaluationFinale")]
    evaluations = [q for q in questions if q.get("estEvaluationFinale")]
    exiger(len(apprentissage) == 660, "Les six parcours doivent contenir 660 questions d’apprentissage.")
    exiger(len(evaluations) == 300, "Les six évaluations doivent contenir 300 questions.")

    for identifiant in THEMES_ATTENDUS:
        questions_parcours = [q for q in apprentissage if q.get("theme") == identifiant]
        evaluation = [q for q in evaluations if q.get("theme") == identifiant]
        exiger(len(questions_parcours) == 110, f"Le parcours {identifiant} doit contenir 110 questions d’apprentissage.")
        exiger(len(evaluation) == 50, f"L’évaluation {identifiant} doit contenir 50 questions.")
        exiger(all(q.get("etape") == 12 for q in evaluation), f"L’évaluation {identifiant} doit être en étape 12.")
        exiger(
            any(q.get("modePrefere") != "reponse-ecrite" for q in evaluation),
            f"L’évaluation {identifiant} ne doit pas imposer artificiellement cinquante réponses écrites.",
        )
        modes_evaluation = {q.get("modePrefere") for q in evaluation}
        exiger(
            len(modes_evaluation) >= 3,
            f"L’évaluation {identifiant} doit faire alterner au moins trois modes naturels.",
        )
        evaluation_ordonnee = sorted(evaluation, key=ordre_pedagogique)
        exiger(
            longueur_maximale_serie_modes(evaluation_ordonnee) <= 6,
            f"L’évaluation {identifiant} contient plus de six questions consécutives dans le même mode.",
        )
        exiger(
            all(not (q.get("modePrefere") == "reponse-ecrite" and len(str(q.get("bonneReponse", ""))) > 70) for q in evaluation),
            f"L’évaluation {identifiant} contient une réponse écrite trop longue pour être naturelle.",
        )
        exiger(all(q.get("sansJokers") is True for q in evaluation), f"L’évaluation {identifiant} doit être sans joker.")
        exiger(all(not str(q.get("indice", "")).strip() for q in evaluation), f"L’évaluation {identifiant} ne doit pas fournir d’indice.")
        exiger(sorted(q.get("ordreEtape") for q in evaluation) == list(range(1, 51)), f"L’ordre final {identifiant} doit être 1 à 50.")
        for etape in range(1, 12):
            questions_etape = sorted(
                (q for q in questions_parcours if q["etape"] == etape),
                key=ordre_pedagogique,
            )
            exiger(len(questions_etape) == 10, f"{identifiant} étape {etape} doit contenir 10 questions.")
            exiger(
                longueur_maximale_serie_modes(questions_etape) <= 6,
                f"L’étape {etape} du parcours {identifiant} contient plus de six questions consécutives dans le même mode.",
            )
            exiger(
                all(
                    not (
                        q.get("modePrefere") == "reponse-ecrite"
                        and len(str(q.get("bonneReponse", ""))) > 70
                    )
                    for q in questions_etape
                ),
                f"L’étape {etape} du parcours {identifiant} contient une réponse écrite trop longue pour être naturelle.",
            )
        etapes = programme[identifiant]["etapes"]
        exiger([e["id"] for e in etapes] == list(range(1, 12)), f"Le programme {identifiant} doit avoir les étapes 1 à 11.")
        exiger(all(len(e.get("souvenirs", [])) == 3 for e in etapes), f"Chaque étape {identifiant} doit avoir trois souvenirs.")

    verifier_prerequis_pedagogiques(questions)
    verifier_formulations_publiques(questions)

    exiger(all(q.get("source") in sources for q in questions), "Une source principale est absente.")
    exiger(all(ref in sources for q in questions for ref in q.get("referencesSources", [])), "Une référence source est absente.")
    questions_par_identifiant = {question["id"]: question for question in questions}
    for identifiant in (1406, 1407, 1408):
        question_tig = questions_par_identifiant[identifiant]
        exiger(
            question_tig.get("source") == "LEGIFRANCE_CJPM_TIG"
            and question_tig.get("referencesSources", [])[:1] == ["LEGIFRANCE_CJPM_TIG"],
            f"Q{identifiant} doit référencer directement la règle officielle du TIG.",
        )
    sources_utilisees = {q.get("source") for q in questions if q.get("source")} | {ref for q in questions for ref in q.get("referencesSources", [])}
    exiger(len(sources) == 67, "Le catalogue étendu doit contenir 67 sources officielles.")
    exiger("LEGIFRANCE_CJPM" in sources and "LEGIFRANCE_CJPM_APPLICATION" in sources, "Les sources judiciaires canoniques manquent.")
    exiger(all(str(q.get("indice", "")).strip() for q in apprentissage), "Chaque question d’apprentissage doit avoir un indice.")
    cles_enonce = [(q.get("theme"), q.get("etape"), q["enonce"].strip()) for q in questions]
    exiger(len(cles_enonce) == len(set(cles_enonce)), "Deux énoncés sont identiques dans le même parcours et la même étape.")

    moteur = (RACINE / "ressources/moteur-jeu.js").read_text(encoding="utf-8")
    page = (RACINE / "index.html").read_text(encoding="utf-8")
    administration = (RACINE / "administration.html").read_text(encoding="utf-8")
    style_principal = (RACINE / "ressources/styles/pjjoue-principal.css").read_text(encoding="utf-8")

    exiger("pjjoue_v1_sauvegarde" in moteur, "La sauvegarde V1 dédiée manque.")
    exiger("pjjoue_v1_session_en_cours" in moteur, "La sauvegarde de session V1 manque.")
    exiger("evaluationsFinales" in moteur, "Les résultats des six évaluations ne sont pas séparés.")
    exiger("obtenirQuestionsEvaluationFinale(identifiantTheme" in moteur, "L’évaluation n’est pas filtrée par parcours.")
    exiger("estParcoursCompletReussi" in moteur, "Le calcul du parcours complet manque.")
    exiger("pjjoue_parcours" in moteur, "Le parcours n’est pas ajouté au contexte Analytics.")
    exiger("perimetreEntrainement" in page and 'value="660"' in page, "L’entraînement libre n’atteint pas les 660 questions d’apprentissage.")
    position_hasard = page.find('class="entrainement-hasard"')
    position_configurateur = page.find('class="entrainement-configurateur"')
    exiger(
        position_hasard >= 0 and position_configurateur >= 0 and position_hasard < position_configurateur,
        "Le Défi du hasard doit rester valorisé avant le configurateur manuel.",
    )
    exiger("boutonLancer.classList.add('secondaire')" in moteur,
           "Après un tirage, Relancer le dé doit devenir secondaire et laisser Jouer comme action principale.")
    exiger("selecteurParcours" in page, "Le sélecteur des six parcours manque.")
    exiger("960" in page and "66" in page and "6" in page, "Les statistiques de la livraison sont absentes.")
    categories_supports = re.findall(r'<details\b[^>]*class="[^"]*\bsupports-juridiction\b[^"]*"[^>]*>', page)
    exiger(categories_supports, "Aucune catégorie de supports n’est présente.")
    exiger(all(re.search(r'\bdata-mots-cles="[^"]{3,}"', categorie) for categorie in categories_supports),
           "Chaque nouvelle catégorie de supports doit déclarer ses sigles et synonymes dans data-mots-cles.")
    exiger("categorie.dataset.motsCles" in moteur and "ressource.textContent" in moteur,
           "La recherche doit indexer automatiquement les mots-clés et le contenu de chaque support.")
    exiger("termesRecherches.every" in moteur,
           "La recherche des supports doit reconnaître chaque terme saisi, sans dépendre d’une expression exacte.")
    exiger("motsIndex.has(terme)" in moteur and "limiterAuxCategoriesDirectes" in moteur,
           "Les sigles courts doivent cibler exactement leur juridiction, sans faux positifs par sous-chaîne.")
    exiger('role="group"' in page and 'aria-pressed="true"' in page,
           "Les filtres des supports doivent exposer leur groupe et leur état actif.")
    exiger("synchroniserOuvertureSupports" in moteur and "boutonRefermer.disabled" in moteur,
           "L’ouverture des supports et le bouton Tout refermer doivent rester synchronisés.")
    for identifiant, sigle in {
        "supports-je": "JE",
        "supports-tpe": "TPE",
        "supports-ji": "JI",
        "supports-jld": "JLD",
        "supports-cam": "CAM",
        "supports-jap": "JAP",
    }.items():
        categorie = next((balise for balise in categories_supports if f'id="{identifiant}"' in balise), "")
        exiger(bool(categorie) and bool(re.search(rf'\b{sigle}\b', categorie, re.IGNORECASE)),
               f"La catégorie {identifiant} doit déclarer le sigle {sigle} dans ses mots-clés.")
    exiger("Pour profiter de la progression pédagogique prévue" in page,
           "La page Parcours doit expliquer clairement que chaque itinéraire peut être commencé séparément.")
    exiger(".produit-pied-page::before" in style_principal and "linear-gradient(90deg" in style_principal,
           "Le pied de page principal doit rester visuellement séparé du contenu.")
    for numero, identifiant in enumerate(THEMES_ATTENDUS, start=1):
        exiger(f'value="{identifiant}"' in page or identifiant == "commun", f"Le parcours {numero} manque dans l’interface.")
        exiger(f'value="{identifiant}"' in administration, f"Le parcours {numero} manque dans l’administration.")
    exiger("data-theme=" in moteur and "reviser-etape" in moteur, "La révision par parcours/étape est incomplète.")
    exiger("lancerRevisionEtape(cible.dataset.theme" in moteur and "ouvrir-parcours-depuis-erreurs" in moteur,
           "Les actions Réviser par étape et Commencer un parcours doivent être réellement branchées.")
    exiger("Parcours complet" in moteur, "Le carnet/progression ne matérialise pas le parcours complet.")
    exiger("const reserve = QUESTIONS.filter(question => !question.estEvaluationFinale);" in moteur, "Le Défi du hasard n’utilise pas la banque d’apprentissage complète.")
    exiger("selectionnerQuestionsEquilibrees(reserve, nombreQuestions)" in moteur, "Le Défi du hasard n’équilibre pas le parcours complet.")
    exiger("Étapes abordées" in page and "Questions à revoir" in page,
           "Les indicateurs de progression doivent employer des libellés précis et cohérents.")
    exiger('role="tabpanel"' in page and 'role="tablist"' in page,
           "Le détail Progression doit conserver sa sémantique d’onglets accessible.")
    exiger("totalJalons = totalEtapes + totalEvaluations" in moteur and "objectifs validés" in moteur,
           "La progression globale doit intégrer les 66 étapes et les 6 évaluations.")

    parametres_source = (RACINE / "code/10 - Paramètres/contenu.html").read_text(encoding="utf-8")
    exiger('id="boutonImporterProgression"' in parametres_source and 'type="button"' in parametres_source,
           "L’import de progression doit rester accessible au clavier par un vrai bouton.")
    exiger('data-groupe-choix="sonActif" role="group"' in parametres_source
           and 'data-groupe-choix="echelleTexte" role="group"' in parametres_source,
           "Les groupes Son et Taille du texte doivent conserver un nom accessible.")

    readme = (RACINE / "README.md").read_text(encoding="utf-8")
    serveur_local = (RACINE / "outils/serveur-previsualisation.js").read_text(encoding="utf-8")
    exiger("http://localhost:4173/" in readme and "'4173'" in serveur_local,
           "La documentation et le serveur doivent partager la même adresse locale.")
    exiger("decodeURIComponent" in serveur_local and "catch (_erreur)" in serveur_local
           and "cheminDemande.includes('\\0')" in serveur_local,
           "Le serveur local doit refuser une adresse mal encodée sans s'arrêter.")
    exiger("'.webmanifest': 'application/manifest+json; charset=utf-8'" in serveur_local,
           "Le serveur local doit annoncer le manifeste avec son type MIME correct.")

    exiger('href="sources.html"' in page, "Le lien vers les sources officielles manque.")
    exiger((RACINE / "ressources/panorama-accueil.webp").is_file(), "L’image WebP d’accueil manque.")
    consentement = (RACINE / "ressources/consentement-analytics.js").read_text(encoding="utf-8")
    analytics = (RACINE / "ressources/analytics-pjjoue.js").read_text(encoding="utf-8")
    empreintes_analytics = lire("tests/empreintes_analytics.json")
    for chemin, empreinte_attendue in empreintes_analytics.items():
        # Git peut utiliser CRLF sous Windows et LF sur GitHub/Linux.
        # Les fins de ligne ne doivent pas être interprétées comme une modification Analytics.
        contenu_protege = (RACINE / chemin).read_bytes().replace(b"\r\n", b"\n").replace(b"\r", b"\n")
        empreinte_actuelle = sha256(contenu_protege).hexdigest()
        exiger(empreinte_actuelle == empreinte_attendue, f"Le fichier Analytics protégé a changé : {chemin}.")
    exiger("GTM-M3LD4ZHK" in consentement and "consent', 'default'" in consentement, "Le consentement Analytics est incomplet.")
    exiger("PREFIXE_EVENEMENT = 'pjjoue_'" in analytics, "La couche Analytics PJJoue est incomplète.")
    exiger("supports: 'Supports de révision'" in moteur,
           "La page Supports doit conserver un libellé Analytics lisible.")
    exiger("question.estEvaluationFinale === true" in moteur, "Le marqueur éditorial des évaluations manque.")
    exiger("session.length !== 50" in moteur, "Chaque évaluation doit contrôler ses 50 questions.")
    exiger("etat.etape = 12" in moteur, "Les évaluations ne pointent pas vers l’étape 12.")
    exiger("CLE_SESSION_EN_COURS" in moteur and "restaurerSessionEnCours" in moteur, "La reprise d’une session active manque.")

    manifeste = lire("MANIFESTE.json")
    composition = manifeste["composition"]
    exiger(manifeste.get("version") == "V1", "Le manifeste doit annoncer PJJoue V1.")
    exiger(composition.get("questionsTotales") == 960, "Le manifeste doit annoncer 960 questions.")
    exiger(composition.get("questionsParcours") == 660, "Le manifeste doit annoncer 660 questions d’apprentissage.")
    exiger(composition.get("etapesParcours") == 66, "Le manifeste doit annoncer 66 étapes.")
    exiger(composition.get("evaluationsFinales") == 6, "Le manifeste doit annoncer 6 évaluations.")

    print("OK — PJJoue livraison : 6 parcours · progression pédagogique recommandée · 66 étapes · 960 questions harmonisées · 6 évaluations finales multimodales · V1")
    return 0


if __name__ == "__main__":
    raise SystemExit(principal())
