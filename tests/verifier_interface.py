#!/usr/bin/env python3
"""Recette navigateur actuelle de PJJoue — 11 étapes et évaluation finale écrite."""
from __future__ import annotations

from pathlib import Path
import base64
import json
import os
import re
import sys

try:
    from playwright.sync_api import Error as ErreurPlaywright
    from playwright.sync_api import sync_playwright
except ModuleNotFoundError as erreur:
    raise SystemExit(
        "Playwright est requis pour la recette d’interface. "
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
    "ressources/styles/85-guides-pedagogiques.css",
    "ressources/styles/90-responsive-et-etats-finaux.css",
    "ressources/styles/95-consentement.css",
)


def construire_page_jeu() -> str:
    page = (RACINE / "index.html").read_text(encoding="utf-8")
    feuille = "\n".join((RACINE / chemin).read_text(encoding="utf-8") for chemin in FEUILLES_INTERFACE)
    donnees = (RACINE / "donnees/donnees-pjj.js").read_text(encoding="utf-8")
    moteur = (RACINE / "ressources/moteur-jeu.js").read_text(encoding="utf-8")
    image = base64.b64encode((RACINE / "ressources/panorama-accueil-calme.png").read_bytes()).decode("ascii")
    page = re.sub(r'<meta[^>]+http-equiv="Content-Security-Policy"[^>]*/?>', "", page, flags=re.I)
    page = re.sub(r'<!-- Google Tag Manager -->.*?<!-- End Google Tag Manager -->\s*', "", page, count=1, flags=re.S | re.I)
    page = re.sub(r'<!-- Google Tag Manager \(noscript\) -->.*?<!-- End Google Tag Manager \(noscript\) -->\s*', "", page, count=1, flags=re.S | re.I)
    page = re.sub(
        r'<script\b(?=[^>]*src="ressources/(?:consentement-analytics|analytics-pjjoue)\.js")[^>]*>\s*</script>',
        "", page, flags=re.I,
    )
    page = re.sub(r'<link\b(?=[^>]*href="ressources/styles/[^"]+\.css")[^>]*>\s*', "", page, flags=re.I)
    page = page.replace("</head>", f"<style>{feuille}</style></head>", 1)
    page = page.replace('src="ressources/panorama-accueil-calme.png"', f'src="data:image/png;base64,{image}"')
    graine = "<script>let graineTest=123456789;Math.random=()=>{graineTest=(1103515245*graineTest+12345)%2147483648;return graineTest/2147483648};</script>"
    page = re.sub(
        r'<script\b(?=[^>]*src="donnees/donnees-pjj\.js")[^>]*>\s*</script>',
        lambda _: graine + f"<script>{donnees}</script>", page, count=1, flags=re.I,
    )
    page = re.sub(
        r'<script\b(?=[^>]*src="ressources/moteur-jeu\.js")[^>]*>\s*</script>',
        lambda _: f"<script>{moteur}</script>", page, count=1, flags=re.I,
    )
    return page


def construire_page_administration() -> str:
    page = (RACINE / "administration.html").read_text(encoding="utf-8")
    feuille = (RACINE / "ressources/administration.css").read_text(encoding="utf-8")
    donnees = (RACINE / "donnees/donnees-pjj.js").read_text(encoding="utf-8")
    administration = (RACINE / "ressources/administration.js").read_text(encoding="utf-8")
    page = re.sub(r'<link\b(?=[^>]*href="ressources/administration\.css")[^>]*>', f"<style>{feuille}</style>", page, count=1, flags=re.I)
    page = re.sub(r'<script\b(?=[^>]*src="donnees/donnees-pjj\.js")[^>]*>\s*</script>', lambda _: f"<script>{donnees}</script>", page, count=1, flags=re.I)
    page = re.sub(r'<script\b(?=[^>]*src="ressources/administration\.js")[^>]*>\s*</script>', lambda _: f"<script>{administration}</script>", page, count=1, flags=re.I)
    return page


def lancer_chromium(automate):
    arguments = ["--no-sandbox"]
    explicite = os.environ.get("PJJOUE_CHROMIUM")
    candidats = [Path(explicite)] if explicite else []
    candidats += [Path("/usr/bin/chromium"), Path("/usr/bin/chromium-browser")]
    for candidat in candidats:
        if candidat and candidat.exists():
            return automate.chromium.launch(headless=True, executable_path=str(candidat), args=arguments)
    return automate.chromium.launch(headless=True, args=arguments)


def verifier_jeu(navigateur, page_html: str) -> int:
    page = navigateur.new_page(viewport={"width": 1440, "height": 1000})
    erreurs: list[str] = []
    page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
    page.on("console", lambda message: erreurs.append(f"console:{message.type}:{message.text}") if message.type == "error" else None)
    page.set_content(page_html, wait_until="domcontentloaded")
    page.wait_for_function("() => window.DONNEES_PJJ?.QUESTIONS?.length === 160 && typeof ouvrirParcours === 'function'")
    page.evaluate("() => ouvrirParcours('commun', {remplacerHistorique:true})")
    page.wait_for_timeout(150)
    cartes = page.locator('.chemin-etape-carte[data-etape]')
    identifiants = cartes.evaluate_all("elements => elements.map(element => element.dataset.etape)")
    assert cartes.count() == 11, "Le parcours n’affiche pas 11 étapes d’apprentissage."
    assert identifiants == [str(i) for i in range(1, 12)], identifiants
    texte_final = page.locator('.chemin-evaluation-carte').inner_text().upper()
    assert "ÉTAPE 12" in texte_final, texte_final
    assert not page.locator('.chemin-evaluation-carte').evaluate("element => element.classList.contains('deverrouillee')"), "L’évaluation est déverrouillée trop tôt."

    page.evaluate("() => { etapeNecessiteAutreChapitre=()=>false; etat.mode='parcours'; etat.theme='commun'; etat.etape=10; etat.chapitre=1; configurerBoutonContinuerBilan(); }")
    assert "étape 11" in page.locator('#boutonContinuerBilan').inner_text().lower()
    page.evaluate("() => { etat.etape=11; configurerBoutonContinuerBilan(); }")
    assert "retour au parcours" in page.locator('#boutonContinuerBilan').inner_text().lower()

    resultat_ecrit = page.evaluate(r"""() => {
        const questions = QUESTIONS.filter(question => question.modePrefere === 'reponse-ecrite');
        const echecs = [];
        let controles = 0;
        const verifier = (reponse, question, libelle, attendu=true) => {
            controles++;
            const obtenu = validerReponseEcriteEvaluation(reponse, question);
            if (obtenu !== attendu) echecs.push({id: question.id, libelle, reponse, attendu, obtenu});
        };
        for (const question of questions) {
            verifier(question.bonneReponse, question, 'bonne réponse');
            for (const variante of (question.reponsesAcceptees || [])) verifier(variante, question, 'variante');
            verifier(String(question.bonneReponse).normalize('NFD').replace(/[\u0300-\u036f]/g, ''), question, 'sans accents');
            if (question.typeReponseAttendue === 'developpement-sigle') verifier(question.sigleAttendu, question, 'sigle seul', false);
            if (question.typeReponseAttendue === 'sigle') {
                verifier(String(question.sigleAttendu).split('').join(' '), question, 'sigle espacé');
                verifier(String(question.sigleAttendu).split('').join('.') + '.', question, 'sigle ponctué');
            }
        }
        const q126 = QUESTIONS.find(question => question.id === 126);
        const q129 = QUESTIONS.find(question => question.id === 129);
        const q6 = QUESTIONS.find(question => question.id === 6);
        verifier('responsable d unite', q126, 'RUE développement court');
        verifier('RUE', q126, 'RUE seul refusé', false);
        verifier('D.P.J.J.', q129, 'DPJJ ponctué');
        verifier('direction de la protection judiciaire de la jeunesse', q129, 'développement au lieu du sigle', false);
        verifier('une decison', q6, 'faute légère sur décision');
        return {nombreQuestions: questions.length, controles, echecs};
    }""")
    assert not resultat_ecrit["echecs"], resultat_ecrit["echecs"][:20]

    page_mobile = navigateur.new_page(viewport={"width": 390, "height": 844})
    erreurs_mobile: list[str] = []
    page_mobile.on("pageerror", lambda erreur: erreurs_mobile.append(str(erreur)))
    page_mobile.set_content(page_html, wait_until="domcontentloaded")
    page_mobile.wait_for_function("() => window.DONNEES_PJJ?.QUESTIONS?.length === 160")
    page_mobile.evaluate("() => ouvrirParcours('commun', {remplacerHistorique:true})")
    page_mobile.wait_for_timeout(100)
    dimensions = page_mobile.evaluate("() => ({document: document.documentElement.scrollWidth, fenetre: window.innerWidth})")
    assert dimensions["document"] <= dimensions["fenetre"] + 2, dimensions
    page_mobile.evaluate("() => lancerEvaluationFinale()")
    page_mobile.wait_for_timeout(80)
    evaluation = page_mobile.evaluate("() => ({mode: etat.mode, nombre: etat.questionsSession.length, etape: etat.etape, jokers: etat.jokersSessionActifs, saisie: document.querySelector('#zoneReponses input')?.type || null})")
    assert evaluation == {"mode": "evaluation-finale", "nombre": 50, "etape": 12, "jokers": False, "saisie": "text"}, evaluation
    assert not erreurs_mobile, erreurs_mobile
    page_mobile.close()
    assert not erreurs, erreurs
    page.close()
    return int(resultat_ecrit["controles"])


def verifier_administration(navigateur, page_html: str) -> None:
    page = navigateur.new_page(viewport={"width": 1440, "height": 900})
    erreurs: list[str] = []
    page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
    page.set_content(page_html, wait_until="domcontentloaded")
    page.wait_for_timeout(100)
    assert page.locator('.carte-question').count() == 160, "L’administration n’affiche pas 160 questions."
    page.locator('#filtreEtape').select_option('12')
    page.wait_for_timeout(50)
    assert page.locator('.carte-question').count() == 50, "Le filtre de l’étape 12 n’affiche pas 50 questions."
    page.locator('#boutonControler').click()
    assert "OK" in page.locator('#etatAdministration').inner_text(), "Le contrôle structurel de l’administration échoue."
    assert not erreurs, erreurs
    page.close()


def principal() -> int:
    try:
        with sync_playwright() as automate:
            navigateur = lancer_chromium(automate)
            controles = verifier_jeu(navigateur, construire_page_jeu())
            verifier_administration(navigateur, construire_page_administration())
            navigateur.close()
        print(f"OK — interface V7 : 11 étapes, évaluation écrite et {controles} contrôles de réponses réussis")
        return 0
    except (AssertionError, ErreurPlaywright, OSError) as erreur:
        print(f"ÉCHEC — {erreur}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(principal())
