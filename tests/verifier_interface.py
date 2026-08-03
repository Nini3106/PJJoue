#!/usr/bin/env python3
"""Recette navigateur des écrans et interactions principales de PJJoue V1."""
from __future__ import annotations

from pathlib import Path
import base64
import hashlib
import json
import re
import sys

try:
    from playwright.sync_api import Error as ErreurPlaywright
    from playwright.sync_api import sync_playwright
except ModuleNotFoundError as erreur:
    raise SystemExit(
        "Playwright est requis pour la recette visuelle. "
        "Installation : python -m pip install playwright puis python -m playwright install chromium"
    ) from erreur

RACINE = Path(__file__).resolve().parents[1]
FEUILLES_INTERFACE = (
    "ressources/styles/00-fondations-et-composants.css",
    "ressources/styles/10-parcours-principal.css",
    "ressources/styles/20-accueil-et-question-principale.css",
    "ressources/styles/30-revision-parcours-et-parametres.css",
    "ressources/styles/40-progression-et-erreurs.css",
    "ressources/styles/50-carte-question-et-correction.css",
    "ressources/styles/60-parcours-modes-et-chronometre.css",
    "ressources/styles/70-celebrations-bilan-et-fenetres.css",
    "ressources/styles/80-finitions-de-l-interface.css",
    "ressources/styles/90-responsive-et-etats-finaux.css",
)



def construire_page_jeu() -> str:
    page = (RACINE / "index.html").read_text(encoding="utf-8")
    feuille = "\n".join(
        (RACINE / chemin).read_text(encoding="utf-8")
        for chemin in FEUILLES_INTERFACE
    )
    donnees = (RACINE / "donnees/donnees-pjj.js").read_text(encoding="utf-8")
    moteur = (RACINE / "ressources/moteur-jeu.js").read_text(encoding="utf-8")
    image = base64.b64encode((RACINE / "ressources/panorama-accueil-calme.png").read_bytes()).decode("ascii")

    page = re.sub(
        r'<meta[^>]+http-equiv="Content-Security-Policy"[^>]*/?>',
        "",
        page,
        flags=re.IGNORECASE,
    )
    page = re.sub(
        r'<link\b(?=[^>]*href="ressources/styles/[^"]+\.css")[^>]*>\s*',
        "",
        page,
        flags=re.IGNORECASE,
    )
    page = page.replace("</head>", f"<style>{feuille}</style></head>", 1)
    page = page.replace('src="ressources/panorama-accueil-calme.png"', f'src="data:image/png;base64,{image}"')
    graine = "<script>let graineTest=123456789;Math.random=()=>{graineTest=(1103515245*graineTest+12345)%2147483648;return graineTest/2147483648};</script>"
    page = re.sub(
        r'<script\b(?=[^>]*src="donnees/donnees-pjj\.js")[^>]*>\s*</script>',
        lambda _: graine + f"<script>{donnees}</script>",
        page,
        count=1,
        flags=re.IGNORECASE,
    )
    page = re.sub(
        r'<script\b(?=[^>]*src="ressources/moteur-jeu\.js")[^>]*>\s*</script>',
        lambda _: f"<script>{moteur}</script>",
        page,
        count=1,
        flags=re.IGNORECASE,
    )
    return page


def construire_page_administration() -> str:
    page = (RACINE / "administration.html").read_text(encoding="utf-8")
    feuille = (RACINE / "ressources/administration.css").read_text(encoding="utf-8")
    donnees = (RACINE / "donnees/donnees-pjj.js").read_text(encoding="utf-8")
    administration = (RACINE / "ressources/administration.js").read_text(encoding="utf-8")
    page = re.sub(
        r'<link\b(?=[^>]*href="ressources/administration\.css")[^>]*>',
        f"<style>{feuille}</style>",
        page,
        count=1,
        flags=re.IGNORECASE,
    )
    page = re.sub(
        r'<script\b(?=[^>]*src="donnees/donnees-pjj\.js")[^>]*>\s*</script>',
        lambda _: f"<script>{donnees}</script>",
        page,
        count=1,
        flags=re.IGNORECASE,
    )
    page = re.sub(
        r'<script\b(?=[^>]*src="ressources/administration\.js")[^>]*>\s*</script>',
        lambda _: f"<script>{administration}</script>",
        page,
        count=1,
        flags=re.IGNORECASE,
    )
    return page


SCENARIOS = {
    "accueil": "afficherEcran('accueil',{remplacerHistorique:true});",
    "carnet": "afficherEcran('carnet',{remplacerHistorique:true});",
    "parcours": "etat.theme='commun';ouvrirParcours('commun',{remplacerHistorique:true});",
    "entrainement": "afficherEcran('entrainement',{remplacerHistorique:true});",
    "question_choix": "etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===1)]);",
    "question_multiple": "etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===2)]);",
    "question_relier": "etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===3)]);",
    "question_eliminer": "etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===4)]);",
    "question_ordre": "etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===5)]);",
    "question_ecrite": "etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===6)]);",
    "question_classer": "etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===7)]);",
    "question_choisir_ordre": "etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===48)]);",
    "joker_5050_eliminer": "etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===4)]);utiliserJoker5050();",
    "joker_5050_choisir_ordre": "etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===48)]);utiliserJoker5050();",
    "celebration_finale": "afficherCelebration({titre:'Parcours terminé',message:'Tu as terminé la V1.',finale:true});",
    "correction_bonne": "etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===1)]);document.querySelector('.reponse[data-est-correcte=\"1\"]').click();",
    "correction_fausse": "etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===1)]);document.querySelector('.reponse[data-est-correcte=\"0\"]').click();",
    "menu_jokers": "etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===1)]);ouvrirFenetreJokers();",
    "joker_indice": "etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===1)]);utiliserIndice('indice');",
    "joker_langue_chat": "etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===1)]);utiliserLangueAuChat();",
    "confirmation_passer": "etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===1)]);demanderPassageQuestion();",
    "confirmation_quitter": "etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===1)]);ouvrirFenetreQuitterSession();",
    "bilan": "etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===1)]);etat.score=1;etat.reponsesSession.set(1,{statut:'correcte',texteReponse:QUESTIONS.find(question=>question.id===1).bonneReponse,precisions:{}});terminerSession();",
    "erreurs": "sauvegarde.aDejaJoue=true;sauvegarde.erreurs={'1':{reussites:0,maitrisee:false,nombreErreurs:1,theme:'commun'},'2':{reussites:0,maitrisee:false,nombreErreurs:2,theme:'commun'}};afficherErreurs();afficherEcran('erreurs',{remplacerHistorique:true});",
    "progression": "sauvegarde.aDejaJoue=true;sauvegarde.nombreQuestionsJouees=12;sauvegarde.erreurs={'1':{reussites:0,maitrisee:false,nombreErreurs:1,theme:'commun'}};initialiserProgression('commun');sauvegarde.progression.apprenant.commun['1']={meilleurScore:8,nombreTentatives:1,questionsTraitees:{'1':true,'2':true},resultats:{'1':true,'2':false},termineeSansJoker:false,jokersUtilises:true};afficherProgression();afficherEcran('progression',{remplacerHistorique:true});",
    "parametres": "afficherEcran('parametres',{remplacerHistorique:true});",
}

LARGEURS = {
    "bureau": {"width": 1440, "height": 900},
    "portable": {"width": 1024, "height": 768},
    "mobile": {"width": 390, "height": 844},
}


def verifier_chargement_local(navigateur) -> None:
    page = navigateur.new_page(viewport=LARGEURS["bureau"])
    page.set_default_timeout(3000)
    erreurs: list[str] = []
    page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
    page.goto((RACINE / "index.html").as_uri(), wait_until="load")
    page.wait_for_timeout(100)
    etat_chargement = page.evaluate("""() => ({
        questions: window.DONNEES_PJJ?.QUESTIONS?.length || 0,
        moteur: typeof afficherEcran === 'function',
        ecransActifs: document.querySelectorAll('.ecran.actif').length,
        feuillesChargees: [...document.styleSheets].filter(feuille =>
            feuille.href?.includes('/ressources/styles/')
        ).length,
        largeurDocument: document.documentElement.scrollWidth,
        largeurFenetre: window.innerWidth
    })""")
    attendu = {
        "questions": 150,
        "moteur": True,
        "ecransActifs": 1,
        "feuillesChargees": len(FEUILLES_INTERFACE),
    }
    for cle, valeur in attendu.items():
        if etat_chargement[cle] != valeur:
            raise AssertionError(
                f"Ouverture locale incorrecte ({cle}) : {etat_chargement}."
            )
    if etat_chargement["largeurDocument"] > etat_chargement["largeurFenetre"] + 2:
        raise AssertionError("L’accueil ouvert localement déborde horizontalement.")
    if erreurs:
        raise AssertionError(f"Erreurs JavaScript pendant l’ouverture locale : {erreurs}")
    page.close()


def construire_combinaisons() -> list[tuple[str, str]]:
    combinaisons = [("bureau", nom) for nom in SCENARIOS]
    combinaisons.extend(("mobile", nom) for nom in [
        "accueil", "carnet", "parcours", "entrainement", "question_choix",
        "question_choisir_ordre", "joker_5050_choisir_ordre", "correction_fausse",
        "bilan", "erreurs", "progression", "parametres",
    ])
    combinaisons.extend(("portable", nom) for nom in ["accueil", "parcours", "question_relier", "progression"])
    return combinaisons


def verifier_scenarios(navigateur, page_html: str) -> int:
    nombre = 0
    for format_ecran, nom_scenario in construire_combinaisons():
        page = navigateur.new_page(viewport=LARGEURS[format_ecran], device_scale_factor=1)
        page.set_default_timeout(3000)
        erreurs: list[str] = []
        page.on("pageerror", lambda erreur, erreurs=erreurs: erreurs.append(str(erreur)))
        page.set_content(page_html, wait_until="domcontentloaded")
        page.evaluate(SCENARIOS[nom_scenario])
        page.wait_for_timeout(80)
        actif = page.locator(".ecran.actif").count()
        if actif != 1:
            raise AssertionError(f"{format_ecran}/{nom_scenario} : {actif} écrans actifs au lieu d’un.")
        largeur_document = page.evaluate("document.documentElement.scrollWidth")
        largeur_fenetre = page.evaluate("window.innerWidth")
        if largeur_document > largeur_fenetre + 2:
            raise AssertionError(f"{format_ecran}/{nom_scenario} : débordement horizontal de {largeur_document - largeur_fenetre}px.")
        if erreurs:
            raise AssertionError(f"{format_ecran}/{nom_scenario} : erreurs JavaScript : {erreurs}")
        page.close()
        nombre += 1
    return nombre


def verifier_interactions(navigateur, page_html: str) -> None:
    page = navigateur.new_page(viewport=LARGEURS["bureau"])
    page.set_default_timeout(3000)
    erreurs: list[str] = []
    page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
    page.set_content(page_html, wait_until="domcontentloaded")

    # Le menu expose les écrans principaux dans l’ordre attendu.
    libelles_menu = page.locator("header .navigation button").all_inner_texts()
    libelles_attendus = [
        "Accueil", "Parcours PJJ", "Carnet de voyage", "Entraînement libre",
        "Réviser", "Progression", "Paramètres",
    ]
    if libelles_menu != libelles_attendus:
        raise AssertionError(f"Ordre ou libellés du menu incorrects : {libelles_menu}")
    page.locator("#boutonAccueilPrincipal").click()
    if not page.locator("#parcours").evaluate("element => element.classList.contains('actif')"):
        raise AssertionError("Le bouton Commencer n’ouvre pas le Parcours PJJ.")

    # Le sélecteur visuel du nombre de questions pilote bien la valeur native.
    page.evaluate("afficherEcran('entrainement',{remplacerHistorique:true});")
    page.locator('[data-groupe-choix="nombreQuestionsEntrainement"] [data-valeur="20"]').click()
    if page.locator("#nombreQuestionsEntrainement").input_value() != "20":
        raise AssertionError("Le bouton 20 questions ne met pas à jour le sélecteur d’entraînement.")
    etat_selection = page.evaluate("""() => {
        const boutons=[...document.querySelectorAll('[data-groupe-choix="nombreQuestionsEntrainement"] .choix-bouton')];
        return {
            actifs:boutons.filter(bouton=>bouton.classList.contains('actif')).map(bouton=>bouton.dataset.valeur),
            selectionnes:boutons.filter(bouton=>bouton.classList.contains('selectionne')).map(bouton=>bouton.dataset.valeur),
            presses:boutons.filter(bouton=>bouton.getAttribute('aria-pressed')==='true').map(bouton=>bouton.dataset.valeur)
        };
    }""")
    attendu_selection = {"actifs": ["20"], "selectionnes": ["20"], "presses": ["20"]}
    if etat_selection != attendu_selection:
        raise AssertionError(f"Plusieurs nombres de questions paraissent sélectionnés : {etat_selection}")

    page.evaluate("afficherEcran('parametres',{remplacerHistorique:true});")
    page.locator('[data-groupe-choix="echelleTexte"] [data-valeur="1.08"]').click()
    etat_echelle = page.evaluate("""() => {
        const boutons=[...document.querySelectorAll('[data-groupe-choix="echelleTexte"] .choix-bouton')];
        return {
            valeur:document.querySelector('#echelleTexte').value,
            actifs:boutons.filter(bouton=>bouton.classList.contains('actif')).map(bouton=>bouton.dataset.valeur),
            selectionnes:boutons.filter(bouton=>bouton.classList.contains('selectionne')).map(bouton=>bouton.dataset.valeur)
        };
    }""")
    if etat_echelle != {"valeur": "1.08", "actifs": ["1.08"], "selectionnes": ["1.08"]}:
        raise AssertionError(f"La taille de texte possède une sélection incohérente : {etat_echelle}")

    # Le son se règle uniquement depuis Paramètres et désactive le volume quand il est coupé.
    page.locator('[data-groupe-choix="sonActif"] [data-valeur="false"]').click()
    etat_son_coupe = page.evaluate("""() => ({
        valeur:document.querySelector('#sonActif').value,
        volumeDesactive:document.querySelector('#volumeSon').disabled,
        carteDesactivee:document.querySelector('.parametre-volume').classList.contains('parametre-desactive')
    })""")
    if etat_son_coupe != {"valeur": "false", "volumeDesactive": True, "carteDesactivee": True}:
        raise AssertionError(f"La désactivation du son est incohérente : {etat_son_coupe}")
    page.locator('[data-groupe-choix="sonActif"] [data-valeur="true"]').click()
    if page.locator("#volumeSon").is_disabled():
        raise AssertionError("Le volume reste désactivé après la réactivation du son.")

    # Les libellés de progression et les accords doivent suivre les compteurs.
    libelles_progression = page.evaluate("""() => {
        const valeurs={
            experienceProgression:1,
            questionsJoueesProgression:1,
            erreursProgression:1,
            etapesMaitriseesProgression:1
        };
        const lireStatistique=(identifiant)=>{
            const valeur=document.getElementById(identifiant);
            if(identifiant==='experienceProgression'){
                return `${valeur.querySelector('.experience-valeur')?.textContent||''} ${valeur.querySelector('.experience-libelle')?.textContent||''}`.trim();
            }
            return valeur.parentElement.innerText.replace(/\\s+/g,' ').trim();
        };
        Object.entries(valeurs).forEach(([identifiant,valeur])=>document.getElementById(identifiant).textContent=String(valeur));
        actualiserLibellesProgression();
        const singuliers=Object.keys(valeurs).map(lireStatistique);
        Object.keys(valeurs).forEach(identifiant=>document.getElementById(identifiant).textContent='2');
        actualiserLibellesProgression();
        const pluriels=Object.keys(valeurs).map(lireStatistique);
        return {singuliers,pluriels};
    }""")
    if libelles_progression["singuliers"] != ["1 découverte", "1 activité réalisée", "1 erreur active", "1 étape maîtrisée"]:
        raise AssertionError(f"Libellés singuliers incorrects : {libelles_progression['singuliers']}")
    if libelles_progression["pluriels"] != ["2 découvertes", "2 activités réalisées", "2 erreurs actives", "2 étapes maîtrisées"]:
        raise AssertionError(f"Libellés pluriels incorrects : {libelles_progression['pluriels']}")

    accords_erreurs = page.evaluate("""() => {
        sauvegarde.aDejaJoue=true;
        sauvegarde.erreurs={'1':{reussites:0,maitrisee:false,nombreErreurs:1,nombrePassages:0,theme:'commun'}};
        afficherErreurs();
        const singulier=document.querySelector('#contenuErreurs').innerText;
        sauvegarde.erreurs['2']={reussites:0,maitrisee:false,nombreErreurs:1,nombrePassages:0,theme:'commun'};
        afficherErreurs();
        return {singulier,pluriel:document.querySelector('#contenuErreurs').innerText};
    }""")
    if "1 erreur active" not in accords_erreurs["singulier"] or "1 erreurs actives" in accords_erreurs["singulier"]:
        raise AssertionError("L’écran Réviser n’accorde pas correctement une erreur active.")
    if "2 erreurs actives" not in accords_erreurs["pluriel"]:
        raise AssertionError("L’écran Réviser n’accorde pas correctement plusieurs erreurs actives.")

    # Le format unique de sauvegarde V1 est nettoyé sans déplacer les questions.
    sauvegarde_nettoyee = page.evaluate("""() => nettoyerSauvegarde({
        version:'V1',xp:14,nombreQuestionsJouees:7,aDejaJoue:true,
        erreurs:{'96':{reussites:1,maitrisee:false,nombreErreurs:2,nombrePassages:3,theme:'commun'}},
        progression:{apprenant:{commun:{'10':{
            meilleurScore:8,nombreTentatives:2,questionsTraitees:{'96':true},
            resultats:{'96':true},termineeSansJoker:true,jokersUtilises:false
        }}}},
        parametres:{son:false,volume:.4,echelleTexte:1.08},dernierTheme:'commun',
        etapesDecouvertes:{'10':true},questionsJouees:{'96':true},
        evaluationFinale:{meilleurScore:41,nombreTentatives:2,reussie:true}
    })""")
    if (
        sauvegarde_nettoyee["nombreQuestionsJouees"] != 7
        or sauvegarde_nettoyee["erreurs"]["96"]["nombrePassages"] != 3
        or sauvegarde_nettoyee["progression"]["apprenant"]["commun"]["10"]["questionsTraitees"] != {"96": True}
        or sauvegarde_nettoyee["parametres"] != {"son": False, "volume": 0.4, "echelleTexte": 1.08}
        or sauvegarde_nettoyee["evaluationFinale"] != {"meilleurScore": 41, "nombreTentatives": 2, "reussie": True}
    ):
        raise AssertionError(f"La sauvegarde V1 est nettoyée incorrectement : {sauvegarde_nettoyee}")

    sauvegarde_malformee = page.evaluate("""() => nettoyerSauvegarde({
        xp:'Infinity',meilleureSerie:2.7,nombreQuestionsJouees:-4,
        erreurs:{'2':{reussites:'Infinity',nombreErreurs:1.8,nombrePassages:-2,theme:'inconnu'}},
        progression:{apprenant:{commun:{'1':{
            meilleurScore:999,nombreTentatives:1.5,
            questionsTraitees:{'1':true,'2':'oui','999':true},
            resultats:{'1':'oui','2':false,'999':true}
        },'99':{meilleurScore:10}}}},
        parametres:{volume:4},
        etapesDecouvertes:{'1':true,'2':'oui','99':true},
        questionsJouees:{'1':true,'2':'oui','999':true},
        evaluationFinale:{meilleurScore:999,nombreTentatives:1.5,reussie:'oui'}
    })""")
    attendu_malforme = {
        "xp": 0,
        "meilleureSerie": 2,
        "nombreQuestionsJouees": 0,
        "erreur": {"reussites": 0, "nombreErreurs": 1, "nombrePassages": 0, "theme": "commun"},
        "progression": {
            "meilleurScore": 10,
            "nombreTentatives": 1,
            "questionsTraitees": {"1": True},
            "resultats": {"2": False},
        },
        "etapesDecouvertes": {"1": True},
        "questionsJouees": {"1": True},
        "evaluationFinale": {"meilleurScore": 50, "nombreTentatives": 1, "reussie": False},
    }
    obtenu_malforme = {
        "xp": sauvegarde_malformee["xp"],
        "meilleureSerie": sauvegarde_malformee["meilleureSerie"],
        "nombreQuestionsJouees": sauvegarde_malformee["nombreQuestionsJouees"],
        "erreur": sauvegarde_malformee["erreurs"]["2"],
        "progression": sauvegarde_malformee["progression"]["apprenant"]["commun"]["1"],
        "etapesDecouvertes": sauvegarde_malformee["etapesDecouvertes"],
        "questionsJouees": sauvegarde_malformee["questionsJouees"],
        "evaluationFinale": sauvegarde_malformee["evaluationFinale"],
    }
    obtenu_malforme["progression"].pop("termineeSansJoker")
    obtenu_malforme["progression"].pop("jokersUtilises")
    obtenu_malforme["erreur"].pop("maitrisee")
    if obtenu_malforme != attendu_malforme:
        raise AssertionError(f"Une sauvegarde malformée est mal nettoyée : {obtenu_malforme}")

    # L’ouverture de la fenêtre des jokers place le focus sur le premier joker disponible.
    page.evaluate("etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===1)]);ouvrirFenetreJokers();")
    page.wait_for_timeout(50)
    identifiant_focus = page.evaluate("document.activeElement?.id || ''")
    if identifiant_focus != "joker5050":
        raise AssertionError(f"Le focus de la fenêtre des jokers est mal placé : {identifiant_focus}")
    page.evaluate("fermerFenetreJokers({restaurerFocus:false});")

    # Les fils d’association utilisent des coordonnées valides.
    page.evaluate("etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;lancerSession([QUESTIONS.find(question=>question.id===3)]);")
    boutons_gauche = page.locator('.association-colonne [data-gauche][data-action="selectionner-association"]')
    boutons_droite = page.locator('.association-colonne [data-droite][data-action="selectionner-association"]')
    boutons_gauche.first.click()
    boutons_droite.first.click()
    page.wait_for_timeout(50)
    chemins = page.locator(".association-lignes path").all()
    if not chemins:
        raise AssertionError("Le mode Relier ne dessine aucun fil après une association.")
    for chemin in chemins:
        valeur = chemin.get_attribute("d") or ""
        if "NaN" in valeur:
            raise AssertionError("Un fil d’association contient une coordonnée invalide.")
        apparence_fil = chemin.evaluate("""element => {
            const style = getComputedStyle(element);
            return {
                remplissage: style.fill,
                couleur: style.stroke,
                epaisseur: style.strokeWidth,
                extremite: style.strokeLinecap,
                jonction: style.strokeLinejoin
            };
        }""")
        apparence_attendue = {
            "remplissage": "none",
            "couleur": "rgb(255, 201, 79)",
            "epaisseur": "4px",
            "extremite": "round",
            "jonction": "round",
        }
        if apparence_fil != apparence_attendue:
            raise AssertionError(f"Le fil d’association n’a pas l’apparence jaune attendue : {apparence_fil}")

    # L’étape 11 est verrouillée puis déverrouillée selon les dix bilans.
    resultat_verrouillage = page.evaluate("""() => {
        initialiserProgression('commun');
        obtenirEtapesProgramme('commun').forEach(etapeProgramme=>{
            obtenirBilanEtape('commun',etapeProgramme.id).termineeSansJoker=false;
        });
        etat.theme='commun';afficherEtapes();
        const carte=document.querySelector('.chemin-evaluation-carte');
        const verrouillee=carte.classList.contains('verrouillee')||carte.getAttribute('aria-disabled')==='true';
        obtenirEtapesProgramme('commun').forEach(etapeProgramme=>{
            const bilan=obtenirBilanEtape('commun',etapeProgramme.id);
            bilan.termineeSansJoker=true;
            bilan.questionsTraitees={};
            obtenirQuestionsEtape('commun',etapeProgramme.id).forEach(question=>{
                bilan.questionsTraitees[String(question.id)]=true;
            });
        });
        afficherEtapes();
        const carteOuverte=document.querySelector('.chemin-evaluation-carte');
        const deverrouillee=carteOuverte.classList.contains('deverrouillee')&&!carteOuverte.disabled&&typeof carteOuverte.onclick==='function';
        return {verrouillee,deverrouillee};
    }""")
    if not resultat_verrouillage["verrouillee"] or not resultat_verrouillage["deverrouillee"]:
        raise AssertionError(f"Règle de déverrouillage incorrecte : {resultat_verrouillage}")

    # L’évaluation finale charge 50 questions sans jokers ni passage.
    resultat_evaluation = page.evaluate("""() => {
        lancerEvaluationFinale();
        return {
            nombre:etat.questionsSession.length,
            jokers:etat.jokersSessionActifs,
            passerVisible:!document.querySelector('#boutonPasserQuestion').classList.contains('masque')
        };
    }""")
    if resultat_evaluation != {"nombre": 50, "jokers": False, "passerVisible": False}:
        raise AssertionError(f"Configuration de l’évaluation finale incorrecte : {resultat_evaluation}")

    # Une question passée ne révèle pas la réponse dans son bilan.
    resultat_passage = page.evaluate("""() => {
        const question=QUESTIONS.find(questionCible=>questionCible.id===1);
        etat.mode='entrainement';etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;
        lancerSession([question]);
        etat.questionsPassees.add(question.id);
        etat.erreursSession.add(question.id);
        etat.reponsesSession.set(question.id,{statut:'passee',texteReponse:''});
        terminerSession();
        const carte=document.querySelector('.bilan-erreur-element');
        return {
            texte:carte?.textContent||'',
            reponse:question.bonneReponse
        };
    }""")
    if resultat_passage["reponse"] in resultat_passage["texte"] or "Réponse non dévoilée" not in resultat_passage["texte"]:
        raise AssertionError("Le bilan d’une question passée révèle la réponse ou n’affiche pas l’avertissement attendu.")

    if erreurs:
        raise AssertionError(f"Erreurs JavaScript pendant les interactions : {erreurs}")
    page.close()


def verifier_defi_chrono(navigateur, page_html: str) -> None:
    formats_sensibles = {
        "mobile-360": {"width": 360, "height": 800},
        "mobile-390": LARGEURS["mobile"],
        "seuil-580": {"width": 580, "height": 900},
        "seuil-760": {"width": 760, "height": 900},
        "seuil-820": {"width": 820, "height": 900},
        "apres-seuil-820": {"width": 821, "height": 900},
        "portable": LARGEURS["portable"],
        "bureau": LARGEURS["bureau"],
    }
    for format_ecran, dimensions in formats_sensibles.items():
        page = navigateur.new_page(viewport=dimensions)
        page.set_default_timeout(3000)
        page.set_content(page_html, wait_until="domcontentloaded")
        page.evaluate("etat.theme='commun';afficherEcran('carnet',{remplacerHistorique:true});")
        page.locator('#choixChronometreParcours [data-valeur="oui"]').click()
        mesures = page.evaluate("""() => {
            const panneau = document.querySelector('.parcours-chronometre-panneau')
                .getBoundingClientRect();
            const boutons = [...document.querySelectorAll(
                '#secondesChronometreParcours .choix-bouton'
            )];
            const debordements = boutons.flatMap(bouton => {
                const cadre = bouton.getBoundingClientRect();
                return [
                    panneau.left - cadre.left,
                    cadre.right - panneau.right,
                    panneau.top - cadre.top,
                    cadre.bottom - panneau.bottom
                ];
            });
            return {
                panneau: Math.max(0, ...debordements),
                document: Math.max(
                    0,
                    document.documentElement.scrollWidth - window.innerWidth
                )
            };
        }""")
        if mesures["panneau"] > 1:
            raise AssertionError(
                f"{format_ecran} : les boutons du défi chrono dépassent leur panneau "
                f"de {mesures['panneau']:.2f}px."
            )
        if mesures["document"] > 2:
            raise AssertionError(
                f"{format_ecran} : le défi chrono provoque un débordement horizontal "
                f"de {mesures['document']:.2f}px."
            )
        page.close()


def verifier_accueil_et_entetes(navigateur, page_html: str) -> None:
    """Vérifie le placement de l’action d’accueil et l’alignement des entêtes concernés."""
    for format_ecran in ("bureau", "mobile"):
        page = navigateur.new_page(viewport=LARGEURS[format_ecran])
        page.set_default_timeout(3000)
        page.set_content(page_html, wait_until="domcontentloaded")
        page.evaluate("afficherEcran('accueil',{remplacerHistorique:true});")
        disposition = page.evaluate("""() => {
            const boite = selecteur => document.querySelector(selecteur).getBoundingClientRect();
            const accent = boite('.accueil-accent');
            const bouton = boite('#boutonAccueilPrincipal');
            const introduction = boite('.accueil-introduction');
            return {
                ecartHorizontal: Math.abs(bouton.left - accent.left),
                ecartVertical: bouton.top - accent.bottom,
                boutonApresIntroduction: bouton.top >= introduction.bottom,
            };
        }""")
        if format_ecran == "mobile":
            if disposition["ecartHorizontal"] > 1:
                raise AssertionError(
                    "mobile : le bouton principal de l’accueil n’est plus aligné à gauche avec la barre jaune."
                )
            if disposition["ecartVertical"] < 18:
                raise AssertionError(
                    "mobile : l’espace entre la barre jaune et le bouton principal est insuffisant."
                )
            if disposition["boutonApresIntroduction"]:
                raise AssertionError(
                    "mobile : le bouton principal doit rester dans l’illustration, avant le texte de présentation."
                )
        elif not disposition["boutonApresIntroduction"]:
            raise AssertionError(
                "bureau : le bouton principal de l’accueil doit suivre le texte de présentation."
            )
        page.close()

    page = navigateur.new_page(viewport=LARGEURS["bureau"])
    page.set_default_timeout(3000)
    page.set_content(page_html, wait_until="domcontentloaded")
    for ecran in ("carnet", "erreurs", "parametres"):
        alignement = page.evaluate("""ecran => {
            afficherEcran(ecran, {remplacerHistorique: true});
            const entete = document.querySelector(`#${ecran} > .page-entete`);
            const paragraphe = entete.querySelector('p');
            const cadreEntete = entete.getBoundingClientRect();
            const cadreParagraphe = paragraphe.getBoundingClientRect();
            return {
                texte: getComputedStyle(entete).textAlign,
                ecartCentres: Math.abs(
                    (cadreEntete.left + cadreEntete.width / 2)
                    - (cadreParagraphe.left + cadreParagraphe.width / 2)
                ),
            };
        }""", ecran)
        if alignement["texte"] != "center" or alignement["ecartCentres"] > 1:
            raise AssertionError(
                f"{ecran} : le titre et son texte d’introduction ne sont plus centrés."
            )
    page.close()


def verifier_reponses_ecrites(navigateur, page_html: str) -> None:
    page = navigateur.new_page(viewport=LARGEURS["bureau"])
    page.set_content(page_html, wait_until="domcontentloaded")
    cas = [
        {"question": 6, "reponse": "décision judiciaire", "attendu": True},
        {"question": 6, "reponse": "pas de décision", "attendu": False},
        {"question": 101, "reponse": "ministère de la justice et une direction", "attendu": True},
        {"question": 101, "reponse": "pas ministère justice pas direction", "attendu": False},
        {"question": 103, "reponse": "ordonnance du juge", "attendu": True},
        {"question": 103, "reponse": "aucune décision aucun mandat judiciaire", "attendu": False},
        {"question": 106, "reponse": "parqet", "attendu": True},
        {"question": 106, "reponse": "pas le parquet", "attendu": False},
        {"question": 108, "reponse": "procureur République", "attendu": True},
        {"question": 108, "reponse": "pas le procureur", "attendu": False},
        {"question": 108, "reponse": "un antiprocureur", "attendu": False},
    ]
    resultats = page.evaluate("""cas => cas.map(test => {
        const question = QUESTIONS.find(element => element.id === test.question);
        const resultat = question.estEvaluationFinale
            ? validerReponseEcriteEvaluation(test.reponse, question)
            : validerReponseEcriteSouple(test.reponse, question);
        return {...test, resultat};
    })""", cas)
    incorrects = [test for test in resultats if test["resultat"] != test["attendu"]]
    if incorrects:
        raise AssertionError(f"Validation incorrecte de réponses écrites : {incorrects}")
    page.close()


def verifier_mise_en_page_questions(navigateur, page_html: str) -> None:
    """Vérifie les contrats visuels qui avaient été cassés pendant le nettoyage CSS."""
    for format_ecran in ("bureau", "mobile"):
        page = navigateur.new_page(viewport=LARGEURS[format_ecran])
        page.set_default_timeout(3000)
        page.set_content(page_html, wait_until="domcontentloaded")

        resultat_multiple = page.evaluate("""() => {
            etat.jokersSessionActifs = true;
            etat.chronometreSessionActif = false;
            lancerSession([QUESTIONS.find(question => question.id === 2)]);
            const zone = document.querySelector('#zoneReponses');
            const consigne = document.querySelector('.activite-consigne');
            const grille = document.querySelector('.multiple-grille');
            const styleZone = getComputedStyle(zone);
            return {
                affichageZone: styleZone.display,
                largeurZone: zone.getBoundingClientRect().width,
                largeurConsigne: consigne.getBoundingClientRect().width,
                largeurGrille: grille.getBoundingClientRect().width,
                colonnes: getComputedStyle(grille).gridTemplateColumns
            };
        }""")
        if resultat_multiple["affichageZone"] != "block":
            raise AssertionError(f"{format_ecran} : une activité est encore affichée comme une grille générale.")
        if resultat_multiple["largeurConsigne"] < resultat_multiple["largeurZone"] * 0.94:
            raise AssertionError(f"{format_ecran} : la consigne d’activité n’occupe plus toute la largeur.")
        if resultat_multiple["largeurGrille"] < resultat_multiple["largeurZone"] * 0.94:
            raise AssertionError(f"{format_ecran} : la grille d’activité est comprimée dans une colonne.")

        resultat_ordre = page.evaluate("""() => {
            lancerSession([QUESTIONS.find(question => question.id === 5)]);
            const zone = document.querySelector('#zoneReponses');
            const liste = document.querySelector('.ordre-liste');
            const ligne = liste.querySelector('li');
            return {
                largeurZone: zone.getBoundingClientRect().width,
                largeurListe: liste.getBoundingClientRect().width,
                affichageLigne: getComputedStyle(ligne).display,
                colonnesLigne: getComputedStyle(ligne).gridTemplateColumns
            };
        }""")
        if resultat_ordre["largeurListe"] < resultat_ordre["largeurZone"] * 0.94:
            raise AssertionError(f"{format_ecran} : la liste à ordonner n’occupe plus toute la largeur.")
        if resultat_ordre["affichageLigne"] != "grid" or " " not in resultat_ordre["colonnesLigne"]:
            raise AssertionError(f"{format_ecran} : les flèches d’ordre ne sont plus alignées avec leur texte.")

        resultat_relier = page.evaluate("""() => {
            lancerSession([QUESTIONS.find(question => question.id === 3)]);
            const colonnes = document.querySelectorAll('.association-colonne');
            colonnes[0].querySelector('button').click();
            colonnes[1].querySelector('button').click();
            const panneau = document.querySelector('.association-panneau');
            const couche = document.querySelector('.association-lignes');
            const fil = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            fil.classList.add('fil-association');
            couche.appendChild(fil);
            return {
                largeurZone: document.querySelector('#zoneReponses').getBoundingClientRect().width,
                largeurPanneau: panneau.getBoundingClientRect().width,
                colonnes: getComputedStyle(panneau).gridTemplateColumns,
                couleurFil: getComputedStyle(fil).stroke
            };
        }""")
        if resultat_relier["largeurPanneau"] < resultat_relier["largeurZone"] * 0.94:
            raise AssertionError(f"{format_ecran} : le mode Relier est comprimé dans une demi-colonne.")
        if format_ecran == "bureau" and " " not in resultat_relier["colonnes"]:
            raise AssertionError("Le mode Relier n’affiche plus ses deux colonnes sur ordinateur.")
        if format_ecran == "bureau" and resultat_relier["couleurFil"] not in ("rgb(255, 201, 79)", "#ffc94f"):
            raise AssertionError(f"Le fil du mode Relier n’est plus jaune : {resultat_relier['couleurFil']}")

        page.evaluate("""() => {
            lancerSession([QUESTIONS.find(question => question.id === 1)]);
        }""")
        page.wait_for_timeout(220)
        resultat_correction = page.evaluate("""() => {
            document.querySelector('.reponse[data-est-correcte="0"]').click();
            const carte = document.querySelector('.question-carte').getBoundingClientRect();
            const correction = document.querySelector('#zoneCorrection');
            const cadre = correction.getBoundingClientRect();
            const style = getComputedStyle(correction);
            return {
                position: style.position,
                debordementVertical: style.overflowY,
                ecartGauche: Math.abs(carte.left - cadre.left),
                ecartHaut: Math.abs(carte.top - cadre.top),
                ecartLargeur: Math.abs(carte.width - cadre.width),
                ecartHauteur: Math.abs(carte.height - cadre.height)
            };
        }""")
        if resultat_correction["position"] != "absolute":
            raise AssertionError(f"{format_ecran} : la correction ne recouvre plus la carte de question.")
        if resultat_correction["debordementVertical"] not in ("auto", "scroll"):
            raise AssertionError(f"{format_ecran} : une correction longue ne peut plus défiler dans sa carte.")
        for cle in ("ecartGauche", "ecartHaut", "ecartLargeur", "ecartHauteur"):
            if resultat_correction[cle] > 5:
                raise AssertionError(
                    f"{format_ecran} : la correction ne correspond plus à la carte "
                    f"({cle} : {resultat_correction[cle]:.2f}px)."
                )

        apparence_navigation = page.evaluate("""() => {
            afficherEcran('accueil', {remplacerHistorique: true});
            const bouton = document.querySelector('.navigation button:not([aria-current="page"])');
            const style = getComputedStyle(bouton);
            return {rayon: parseFloat(style.borderRadius), fond: style.backgroundColor};
        }""")
        fond_transparent = apparence_navigation["fond"] in (
            "transparent",
            "rgba(0, 0, 0, 0)",
        )
        apparence_incorrecte = (
            format_ecran == "mobile"
            and (apparence_navigation["rayon"] != 0 or not fond_transparent)
        ) or (
            format_ecran != "mobile"
            and (apparence_navigation["rayon"] < 20 or fond_transparent)
        )
        if apparence_incorrecte:
            raise AssertionError(
                f"{format_ecran} : les boutons de navigation ont perdu leur présentation V1 "
                f"(rayon : {apparence_navigation['rayon']}px, "
                f"fond : {apparence_navigation['fond']})."
            )
        page.close()


EMPREINTES_CORRECTIONS = {
    "1:correcte": "0adc17a49649545004cc0830c29f3f78526d551276bc3053a35f668e4682f031",
    "1:incorrecte": "80b1a119622b4d63f963351760cee5fb232a76f3682c4d527d3371998a955bd0",
    "2:correcte": "cf469c527c2e2ca3d03128165861e20c1787971234c375d30ba2d893f524a96a",
    "2:incorrecte": "297d0ba709194733c15457b94c512aa5f3b9203bd6b6c1d4b6d503d4b902650d",
    "3:correcte": "6194d2478dd82dcc8c30d6308ccc5993acddda08f422e4fa220458181af57207",
    "3:incorrecte": "a9151d13cdcff7f125ef615e51b7293b07404abee2fa9028acdde6d56c937124",
    "4:correcte": "0301ae36ae642127841e46f7feec8094c9a91d5b459d167339d6e3007258ae40",
    "4:incorrecte": "c2a2d0acebbecfb69317e3b328c7454013b9e208324782cf57975502ba461846",
    "5:correcte": "396f792336e5d32f5350be2be00cea6a0d2d9216012302fb3e405e943b738c5c",
    "5:incorrecte": "62b29239a3dd4a68fd594109eb11a26aec5e7b14b0906b6a0a8ebfcdee530d1d",
    "6:correcte": "41f99f7f97b42bbb22d6bf5f8e535280100092e1291f7177fb7560943ff790d5",
    "6:incorrecte": "c3834f919bd502a8b4c5e2e329fbbf613bc5d96c258f4701ee0feb350298b224",
    "7:correcte": "38a0b6d5a1b5b75168f95fd8b0e5311b7236a77556e1fba4ff932360802df897",
    "7:incorrecte": "bbcbd00a152c27844386a1e19e0da7cd338a345d424ee513718b1aec36629e62",
    "48:correcte": "b219dd09f9c094067234675d218fbfa91162e98a09e20e8e2b6ec190d2375a72",
    "48:incorrecte": "038fe412604a945891026114502936e73e2c0a156f62b557bd93af3ad098e61c",
}


def verifier_textes_corrections(navigateur, page_html: str) -> None:
    for format_ecran in ("bureau", "mobile"):
        page = navigateur.new_page(viewport=LARGEURS[format_ecran])
        page.set_default_timeout(3000)
        page.set_content(page_html, wait_until="domcontentloaded")
        for identifiant_question in (1, 2, 3, 4, 5, 6, 7, 48):
            for statut in ("correcte", "incorrecte"):
                texte = page.evaluate(
                    r"""([identifiantQuestion, statutReponse]) => {
                        const question = QUESTIONS.find(element => element.id === identifiantQuestion);
                        etat.jokersSessionActifs = true;
                        etat.chronometreSessionActif = false;
                        lancerSession([question]);
                        afficherCorrectionEnregistree(question, {
                            statut: statutReponse,
                            texteReponse: statutReponse === 'incorrecte'
                                ? 'Réponse de test'
                                : question.bonneReponse,
                            precisions: {}
                        });
                        const zone = document.querySelector('#zoneCorrection');
                        const debordement = zone.scrollWidth > zone.clientWidth + 2;
                        const conteneurExplication = document.createElement('div');
                        conteneurExplication.innerHTML = question.explication;
                        return {
                            texte: zone.innerText.replace(/\s+/g, ' ').trim(),
                            explication: conteneurExplication.innerText.replace(/\s+/g, ' ').trim(),
                            debordement
                        };
                    }""",
                    [identifiant_question, statut],
                )
                cle = f"{identifiant_question}:{statut}"
                empreinte = hashlib.sha256(texte["texte"].encode("utf-8")).hexdigest()
                if empreinte != EMPREINTES_CORRECTIONS[cle]:
                    raise AssertionError(
                        f"{format_ecran}/{cle} : le texte de correction diffère de la référence V1."
                    )
                if texte["explication"] not in texte["texte"]:
                    raise AssertionError(f"{format_ecran}/{cle} : l’explication de la question est absente.")
                if texte["debordement"]:
                    raise AssertionError(f"{format_ecran}/{cle} : la correction déborde horizontalement.")
        page.close()


def verifier_administration(navigateur, page_html: str) -> None:
    page = navigateur.new_page(viewport=LARGEURS["bureau"])
    page.set_default_timeout(3000)
    erreurs: list[str] = []
    page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
    page.set_content(page_html, wait_until="domcontentloaded")
    page.wait_for_timeout(80)
    if page.locator(".carte-question").count() != 150:
        raise AssertionError("L’administration n’affiche pas les 150 questions.")
    page.locator("#filtreEtape").select_option("11")
    if page.locator(".carte-question").count() != 50:
        raise AssertionError("Le filtre de l’étape 11 n’affiche pas 50 questions.")
    page.locator("#boutonControler").click()
    etat_controle = page.locator("#etatAdministration").inner_text()
    etat_reference = "Validation structurelle : OK."
    if etat_controle != etat_reference:
        raise AssertionError(f"Le contrôle structurel de l’administration diffère de la référence : {etat_controle}")
    brouillon_valide = page.evaluate("""() => validerBrouillon(questionsOriginales.map(question => ({
        ...structuredClone(question),
        enonce: question.id === 1 ? 'Énoncé conservé' : question.enonce
    })))""")
    if (
        not brouillon_valide
        or brouillon_valide[0]["enonce"] != "Énoncé conservé"
        or brouillon_valide[0]["id"] != 1
        or brouillon_valide[0]["versionContenu"] != "V1"
        or len(brouillon_valide) != 150
    ):
        raise AssertionError(f"Un brouillon V1 valide n’est pas repris correctement : {brouillon_valide}")
    if erreurs:
        raise AssertionError(f"Erreurs JavaScript dans l’administration : {erreurs}")
    page.close()


def principal() -> int:
    try:
        page_jeu = construire_page_jeu()
        page_administration = construire_page_administration()
        with sync_playwright() as automate:
            navigateur = automate.chromium.launch(headless=True)
            verifier_chargement_local(navigateur)
            nombre_scenarios = verifier_scenarios(navigateur, page_jeu)
            verifier_accueil_et_entetes(navigateur, page_jeu)
            verifier_interactions(navigateur, page_jeu)
            verifier_defi_chrono(navigateur, page_jeu)
            verifier_reponses_ecrites(navigateur, page_jeu)
            verifier_mise_en_page_questions(navigateur, page_jeu)
            verifier_textes_corrections(navigateur, page_jeu)
            verifier_administration(navigateur, page_administration)
            navigateur.close()
        print(f"OK — interface PJJoue V1 : {nombre_scenarios} scénarios et interactions complémentaires réussis")
        return 0
    except (AssertionError, ErreurPlaywright, OSError) as erreur:
        print(f"ÉCHEC — {erreur}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(principal())
