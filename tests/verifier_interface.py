#!/usr/bin/env python3
"""Recette navigateur PJJoue — 6 parcours, 66 étapes et 6 évaluations finales."""
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
    "ressources/styles/pjjoue-principal.css",
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
        r'<script\b(?=[^>]*src="ressources/(?:consentement-analytics|analytics-pjjoue|navigation-locale)\.js")[^>]*>\s*</script>',
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


def verifier_ouverture_locale(navigateur) -> None:
    """Vérifier le vrai index en file://, avec un consentement déjà accepté."""
    page = navigateur.new_page(viewport={"width": 1440, "height": 1000})
    erreurs: list[str] = []
    requetes_externes: list[str] = []
    page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
    page.on(
        "console",
        lambda message: erreurs.append(f"console:{message.type}:{message.text}")
        if message.type == "error" else None,
    )
    page.on(
        "requestfailed",
        lambda requete: erreurs.append(f"requête:{requete.url}:{requete.failure}"),
    )
    page.on(
        "request",
        lambda requete: requetes_externes.append(requete.url)
        if requete.url.startswith(("http://", "https://")) else None,
    )

    page.goto((RACINE / "index.html").resolve().as_uri(), wait_until="domcontentloaded")
    page.wait_for_function("() => window.DONNEES_PJJ?.QUESTIONS?.length === 960")
    page.evaluate(
        "() => localStorage.setItem('pjjoue_consentement_analytics_v1', 'accepte')"
    )
    erreurs.clear()
    requetes_externes.clear()
    page.reload(wait_until="domcontentloaded")
    page.wait_for_function("() => window.DONNEES_PJJ?.QUESTIONS?.length === 960")

    page.goto(f"{(RACINE / 'index.html').resolve().as_uri()}#supports", wait_until="domcontentloaded")
    page.wait_for_function("() => window.DONNEES_PJJ?.QUESTIONS?.length === 960")
    assert page.locator("body").get_attribute("data-ecran-actif") == "supports", (
        "La route file:// #supports doit ouvrir les supports depuis le menu des guides."
    )

    page.goto(f"{(RACINE / 'index.html').resolve().as_uri()}#%E0%A4%A", wait_until="domcontentloaded")
    page.wait_for_function("() => window.DONNEES_PJJ?.QUESTIONS?.length === 960")
    assert page.locator("body").get_attribute("data-ecran-actif") == "accueil", (
        "Un fragment d'adresse mal encodé doit revenir à l'accueil sans interrompre le site."
    )

    for ecran in ("parcours", "supports", "entrainement", "progression", "carnet", "parametres"):
        page.evaluate("ecran => afficherEcran(ecran)", ecran)
    page.evaluate("() => ouvrirParcours('matiere_criminelle_peines')")
    page.wait_for_timeout(150)

    assert page.url.startswith("file:") and "#parcours/matiere_criminelle_peines" in page.url, page.url
    assert page.locator("#pjjoue-google-tag-manager").count() == 0, (
        "Google Tag Manager ne doit pas être injecté depuis une page file://."
    )
    assert not requetes_externes, f"Requêtes externes inattendues en file:// : {requetes_externes}"
    assert not erreurs, erreurs
    page.close()


def verifier_liens_guides_locaux(navigateur) -> None:
    """Ne pas transformer un lien externe opaque en navigation file:// différée."""
    page = navigateur.new_page(viewport={"width": 1440, "height": 1000})
    erreurs: list[str] = []
    page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
    page.on(
        "console",
        lambda message: erreurs.append(f"console:{message.type}:{message.text}")
        if message.type == "error" else None,
    )
    page.goto((RACINE / "guides" / "index.html").resolve().as_uri(), wait_until="domcontentloaded")
    page.wait_for_function("() => Boolean(document.querySelector('.guide-bouton-menu-principal'))")
    observation = page.evaluate("""() => new Promise(resolve => {
        const lien = document.querySelector('a[href^="mailto:"]');
        if (!lien) {
            resolve(null);
            return;
        }
        document.addEventListener('click', evenement => {
            if (evenement.target.closest('a[href^="mailto:"]'))
                resolve({ annule: evenement.defaultPrevented, adresse: location.href });
        }, { once: true });
        lien.click();
    })""")
    page.wait_for_timeout(180)
    assert observation and not observation["annule"], (
        "Le script de transition des guides ne doit pas intercepter les liens mailto: en file://."
    )
    assert page.url.startswith("file:") and "/guides/index.html" in page.url, page.url
    assert not erreurs, erreurs
    page.close()


def verifier_jeu(navigateur, page_html: str) -> int:
    index_public = (RACINE / "index.html").read_text(encoding="utf-8")
    navigation_locale = (RACINE / "ressources/navigation-locale.js").read_text(encoding="utf-8")
    moteur_public = (RACINE / "ressources/moteur-jeu.js").read_text(encoding="utf-8")
    assert not re.search(r'<link\b[^>]*rel=["\']manifest["\']', index_public, re.I), (
        "Le manifeste ne doit pas être chargé directement en file:// : navigation-locale.js l’active seulement en HTTP(S)."
    )
    assert "activerManifesteApplication" in navigation_locale and "^https?:$" in navigation_locale, (
        "La protection du manifeste pour l’ouverture locale est absente."
    )
    assert "new URL('../', scriptNavigation.src)" in navigation_locale, (
        "La racine de l’application doit rester compatible avec un sous-chemin GitHub Pages."
    )
    assert "new URL('service-worker.js', racineApplication)" in navigation_locale, (
        "Le service worker doit rester compatible avec un sous-chemin GitHub Pages."
    )
    assert "['http:', 'https:', 'file:'].includes(destination.protocol)" in navigation_locale, (
        "Les transitions des guides ne doivent pas intercepter mailto:, tel: ou un autre protocole opaque."
    )
    assert "destination.pathname.startsWith(racineApplication.pathname)" in navigation_locale, (
        "En file://, une transition animée ne doit pas sortir du dossier de l'application."
    )
    assert "function mettreAJourAdresseNavigation" in moteur_public and "window.location.protocol === 'file:'" in moteur_public, (
        "La navigation par fragment dédiée aux fichiers locaux est absente."
    )
    assert re.search(r"ecransAutorises\s*=\s*\[[^\]]*['\"]supports['\"]", moteur_public), (
        "La route directe #supports doit rester autorisée, notamment depuis le menu des guides."
    )
    assert "decodeURIComponent(segment)" in moteur_public and "catch (erreur)" in moteur_public, (
        "Un fragment d'adresse mal encodé ne doit pas interrompre le démarrage de PJJoue."
    )

    page = navigateur.new_page(viewport={"width": 1440, "height": 1000})
    erreurs: list[str] = []
    page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
    page.on("console", lambda message: erreurs.append(f"console:{message.type}:{message.text}") if message.type == "error" else None)
    page.set_content(page_html, wait_until="domcontentloaded")
    page.wait_for_function("() => window.DONNEES_PJJ?.QUESTIONS?.length === 960 && typeof ouvrirParcours === 'function'")
    page.evaluate("() => ouvrirParcours('commun', {remplacerHistorique:true})")
    page.wait_for_timeout(150)
    cartes = page.locator('.chemin-etape-carte[data-etape]')
    identifiants = cartes.evaluate_all("elements => elements.map(element => element.dataset.etape)")
    assert cartes.count() == 11, "Le parcours 1 n’affiche pas 11 étapes d’apprentissage."
    assert identifiants == [str(i) for i in range(1, 12)], identifiants
    texte_final = page.locator('.chemin-evaluation-carte').inner_text().upper()
    assert "ÉTAPE 12" in texte_final, texte_final
    assert not page.locator('.chemin-evaluation-carte').evaluate("element => element.classList.contains('deverrouillee')"), "L’évaluation est déverrouillée trop tôt."

    # Le sélecteur doit exposer six parcours séparés, chacun avec 11 étapes.
    selecteurs = page.locator('#selecteurParcours .selecteur-parcours-bouton')
    assert selecteurs.count() == 6, "Le sélecteur ne propose pas les six parcours."
    themes_attendus = ["commun", "procedure_ordinaire", "information_judiciaire", "jugement_educatif_ordinaire", "matiere_criminelle_peines", "application_execution_peines"]
    for index, theme_attendu in enumerate(themes_attendus):
        page.evaluate("() => ouvrirChoixParcours({remplacerHistorique:true})")
        page.wait_for_timeout(40)
        selecteurs.nth(index).click()
        page.wait_for_timeout(70)
        cartes_theme = page.locator('.chemin-etape-carte[data-etape]')
        assert cartes_theme.count() == 11, f"Le parcours {index + 1} n’affiche pas 11 étapes d’apprentissage."
        assert page.evaluate("() => etat.theme") == theme_attendu
    page.evaluate("() => ouvrirParcours('commun', {remplacerHistorique:true})")
    page.wait_for_timeout(80)

    # Navigation libre : avec une sauvegarde vierge, chacun des six parcours
    # doit pouvoir démarrer directement à son étape 1, sans prérequis de parcours.
    premieres_questions = {
        "commun": 1,
        "procedure_ordinaire": 1001,
        "information_judiciaire": 1201,
        "jugement_educatif_ordinaire": 1401,
        "matiere_criminelle_peines": 1601,
        "application_execution_peines": 1801,
    }
    for theme, question_attendue in premieres_questions.items():
        page.evaluate("theme => ouvrirParcours(theme, {remplacerHistorique:true})", theme)
        page.wait_for_timeout(70)
        premiere_carte = page.locator('.chemin-etape-carte[data-etape="1"]')
        assert premiere_carte.count() == 1, f"L’étape 1 du parcours {theme} n’est pas affichée."
        assert premiere_carte.is_visible() and premiere_carte.is_enabled(), (
            f"L’étape 1 du parcours {theme} n’est pas directement accessible avec une sauvegarde vierge."
        )
        assert premiere_carte.get_attribute("data-theme") == theme
        premiere_carte.click()
        page.wait_for_timeout(70)
        lancement = page.evaluate("() => ({theme: etat.theme, etape: etat.etape, question: etat.questionCourante?.id})")
        assert lancement == {"theme": theme, "etape": 1, "question": question_attendue}, lancement
    page.evaluate("() => ouvrirParcours('commun', {remplacerHistorique:true})")
    page.wait_for_timeout(80)

    page.evaluate("() => { etapeNecessiteAutreChapitre=()=>false; etat.mode='parcours'; etat.theme='commun'; etat.etape=10; etat.chapitre=1; configurerBoutonContinuerBilan(); }")
    assert "étape 11" in page.locator('#boutonContinuer').inner_text().lower()
    page.evaluate("() => { etat.etape=11; configurerBoutonContinuerBilan(); }")
    assert "retour au parcours" in page.locator('#boutonContinuer').inner_text().lower()

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
            if (question.typeReponseAttendue !== 'sigle') {
                const motsLongs = [...String(question.bonneReponse).matchAll(/[A-Za-zÀ-ÿ]{6,}/g)]
                    .sort((a, b) => b[0].length - a[0].length);
                if (motsLongs.length) {
                    const mot = motsLongs[0][0];
                    const index = motsLongs[0].index;
                    const coupe = Math.max(1, Math.min(mot.length - 2, Math.floor(mot.length / 2)));
                    const motAvecFaute = mot.slice(0, coupe) + mot.slice(coupe + 1);
                    verifier(
                        String(question.bonneReponse).slice(0, index) + motAvecFaute + String(question.bonneReponse).slice(index + mot.length),
                        question,
                        'faute légère automatique'
                    );
                    if (!/s$/i.test(mot)) {
                        verifier(
                            String(question.bonneReponse).slice(0, index) + mot + 's' + String(question.bonneReponse).slice(index + mot.length),
                            question,
                            'variation de pluriel automatique'
                        );
                    }
                }
            }
            if (question.typeReponseAttendue === 'developpement-sigle') verifier(question.sigleAttendu, question, 'sigle seul', false);
            if (question.typeReponseAttendue === 'sigle') {
                verifier(String(question.sigleAttendu).split('').join(' '), question, 'sigle espacé');
                verifier(String(question.sigleAttendu).split('').join('.') + '.', question, 'sigle ponctué');
            }
        }
        const q126 = QUESTIONS.find(question => question.id === 126);
        const q129 = QUESTIONS.find(question => question.id === 129);
        const q6 = QUESTIONS.find(question => question.id === 6);
        if (q126?.modePrefere === 'reponse-ecrite') {
            verifier('responsable d unite', q126, 'RUE développement court');
            verifier('RUE', q126, 'RUE seul refusé', false);
        }
        if (q129?.modePrefere === 'reponse-ecrite') {
            verifier('D.P.J.J.', q129, 'DPJJ ponctué');
            verifier('direction de la protection judiciaire de la jeunesse', q129, 'développement au lieu du sigle', false);
        }
        if (q6?.modePrefere === 'reponse-ecrite') verifier('une decison', q6, 'faute légère sur décision');
        return {nombreQuestions: questions.length, controles, echecs};
    }""")
    assert not resultat_ecrit["echecs"], resultat_ecrit["echecs"][:20]

    # Recette des ajouts finaux : ordre pédagogique indépendant des IDs Analytics,
    # identité d’étape, restauration responsive, reprise unique et compteur sans joker.
    page.evaluate("() => lancerEtape('commun', 2)")
    page.wait_for_timeout(120)
    ordre_etape_2 = page.evaluate("() => etat.questionsSession.map(question => question.id)")
    assert ordre_etape_2 == [11, 12, 13, 14, 15, 17, 16, 18, 19, 20], ordre_etape_2
    contexte = page.evaluate(r"""() => ({
        numero: document.querySelector('#numeroEtapeQuestion')?.textContent.trim(),
        titre: document.querySelector('#titreEtapeQuestion')?.textContent.trim(),
        suivi: document.querySelector('#suiviSansJokerQuestion')?.textContent.replace(/\s+/g, ' ').trim(),
        id: etat.questionCourante?.id
    })""")
    assert contexte["numero"] == "Étape 2", contexte
    assert contexte["titre"], contexte
    assert "Maîtrisées sans aide" in contexte["suivi"], contexte

    identifiant_avant_resize = contexte["id"]
    page.evaluate("""() => {
        document.querySelector('#enonceQuestion').textContent = '';
        document.querySelector('#zoneReponses').replaceChildren();
    }""")
    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(180)
    rendu_repare = page.evaluate("""() => ({
        id: etat.questionCourante?.id,
        enonce: document.querySelector('#enonceQuestion')?.textContent.trim(),
        reponses: document.querySelector('#zoneReponses')?.children.length || 0
    })""")
    assert rendu_repare["id"] == identifiant_avant_resize and rendu_repare["enonce"] and rendu_repare["reponses"] > 0, rendu_repare
    page.set_viewport_size({"width": 1440, "height": 1000})
    page.wait_for_timeout(120)

    # Le stockage local est volontairement indisponible dans la page inline de cette
    # recette (origine opaque). La restauration après rechargement est donc couverte
    # par les contrôles statiques de verifier_pjjoue.py ; ici on couvre le même rendu
    # responsive à chaud, qui était l’autre déclencheur du bug signalé.

    reprise = page.evaluate("""() => {
        const id = etat.questionCourante.id;
        etat.questionValidee = true;
        etat.reponsesSession.set(id, {statut:'incorrecte'});
        etat.tentativesQuestions = new Map();
        rejouerQuestionCourante();
        const apresPremiere = etat.tentativesQuestions.get(id) || 0;
        etat.questionValidee = true;
        rejouerQuestionCourante();
        const apresSeconde = etat.tentativesQuestions.get(id) || 0;
        return {apresPremiere, apresSeconde};
    }""")
    assert reprise == {"apresPremiere": 1, "apresSeconde": 1}, reprise

    compteur_sans_joker = page.evaluate("""() => {
        const bilan = obtenirBilanEtape('commun', 2);
        const ids = obtenirQuestionsEtape('commun', 2).slice(0, 2).map(question => question.id);
        bilan.questionsTraitees = bilan.questionsTraitees || {};
        bilan.resultats = bilan.resultats || {};
        ids.forEach(id => { bilan.questionsTraitees[id] = true; bilan.resultats[id] = true; });
        actualiserSuiviEtapeQuestion(etat.questionCourante);
        const avant = compterReussitesAutonomesEtape('commun', 2);
        reinitialiserValidationSansJokerEtape('commun', 2);
        const apres = compterReussitesAutonomesEtape('commun', 2);
        const progressionConservee = ids.every(id => bilan.questionsTraitees[id] === true);
        return {avant, apres, progressionConservee};
    }""")
    assert compteur_sans_joker == {"avant": 2, "apres": 0, "progressionConservee": True}, compteur_sans_joker

    page_mobile = navigateur.new_page(viewport={"width": 390, "height": 844})
    erreurs_mobile: list[str] = []
    page_mobile.on("pageerror", lambda erreur: erreurs_mobile.append(str(erreur)))
    page_mobile.set_content(page_html, wait_until="domcontentloaded")
    page_mobile.wait_for_function("() => window.DONNEES_PJJ?.QUESTIONS?.length === 960")
    page_mobile.evaluate("() => ouvrirParcours('commun', {remplacerHistorique:true})")
    page_mobile.wait_for_timeout(100)
    dimensions = page_mobile.evaluate("() => ({document: document.documentElement.scrollWidth, fenetre: window.innerWidth})")
    assert dimensions["document"] <= dimensions["fenetre"] + 2, dimensions
    page_mobile.evaluate("() => lancerEvaluationFinale('commun')")
    page_mobile.wait_for_timeout(80)
    evaluation = page_mobile.evaluate("""() => ({
        mode: etat.mode,
        nombre: etat.questionsSession.length,
        etape: etat.etape,
        jokers: etat.jokersSessionActifs,
        modes: [...new Set(etat.questionsSession.map(question => question.modePresentation || question.modePrefere))],
        rendu: Boolean(document.querySelector('#zoneReponses')?.children.length)
    })""")
    assert evaluation["mode"] == "evaluation-finale" and evaluation["nombre"] == 50, evaluation
    assert evaluation["etape"] == 12 and evaluation["jokers"] is False, evaluation
    assert len(evaluation["modes"]) >= 3 and evaluation["rendu"], evaluation

    # Les 960 questions des six parcours sont rendues réellement dans l’interface.
    # Ce contrôle couvre les 66 étapes et les six évaluations,
    # afin de détecter un champ résiduel ou une activité impossible à afficher.
    parcours_rendus = page_mobile.evaluate(r"""() => {
        const themes = [
            'commun',
            'procedure_ordinaire',
            'information_judiciaire',
            'jugement_educatif_ordinaire',
            'matiere_criminelle_peines',
            'application_execution_peines'
        ];
        const resultats = [];
        const verifierSession = (anomalies, modesTous, modesEvaluation, evaluation) => {
            let nombre = 0;
            etat.chronometreSessionActif = false;
            for (let index = 0; index < etat.questionsSession.length; index++) {
                etat.indexQuestion = index;
                afficherQuestion({ suivreAnalytics: false });
                clearInterval(etat.identifiantMinuteur);
                etat.identifiantMinuteur = null;
                const question = etat.questionCourante;
                const mode = question.modePresentation || question.modePrefere;
                const zone = document.querySelector('#zoneReponses');
                modesTous[mode] = (modesTous[mode] || 0) + 1;
                if (evaluation) modesEvaluation[mode] = (modesEvaluation[mode] || 0) + 1;
                const compter = selecteur => zone?.querySelectorAll(selecteur).length || 0;
                let renduValide = Boolean(
                    document.querySelector('#enonceQuestion')?.textContent.trim()
                    && zone?.textContent.trim()
                    && zone.children.length
                );
                if (mode === 'choix-unique') renduValide = renduValide && compter('button.reponse') === 4;
                if (mode === 'reponse-ecrite') renduValide = renduValide && compter('#reponseEcrite') === 1;
                if (mode === 'selection-multiple') renduValide = renduValide && compter('button.multiple-choix') >= 3;
                if (mode === 'association') renduValide = renduValide && compter('.association-panneau button') >= 4;
                if (mode === 'classer') renduValide = renduValide && compter('.classement-element') >= 2;
                if (mode === 'remettre-ordre') renduValide = renduValide && compter('.ordre-liste li') >= 2;
                if (mode === 'eliminer') renduValide = renduValide && compter('button.elimination-choix') >= 2;
                if (!renduValide) anomalies.push({ id: question.id, mode });
                nombre++;
            }
            return nombre;
        };
        for (const theme of themes) {
            const anomalies = [];
            const modesTous = {};
            const modesEvaluation = {};
            let nombre = 0;
            for (let etape = 1; etape <= 11; etape++) {
                lancerEtape(theme, etape);
                nombre += verifierSession(anomalies, modesTous, modesEvaluation, false);
            }
            lancerEvaluationFinale(theme);
            nombre += verifierSession(anomalies, modesTous, modesEvaluation, true);
            resultats.push({ theme, nombre, modesTous, modesEvaluation, anomalies });
        }
        return resultats;
    }""")
    for resultat in parcours_rendus:
        assert resultat["nombre"] == 160, resultat
        assert len(resultat["modesEvaluation"]) >= 3, resultat
        assert not resultat["anomalies"], resultat["anomalies"][:20]
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
    assert page.locator('.carte-question').count() == 960, "L’administration n’affiche pas 960 questions."
    page.locator('#filtreEtape').select_option('12')
    page.wait_for_timeout(50)
    assert page.locator('.carte-question').count() == 300, "Le filtre de l’étape 12 n’affiche pas les 300 questions des six évaluations."
    page.locator('#filtreParcours').select_option('application_execution_peines')
    page.wait_for_timeout(50)
    assert page.locator('.carte-question').count() == 50, "Le filtre Parcours 6 + étape 12 n’affiche pas ses 50 questions."
    page.locator('#boutonControler').click()
    assert "OK" in page.locator('#etatAdministration').inner_text(), "Le contrôle structurel de l’administration échoue."
    assert not erreurs, erreurs
    page.close()


def principal() -> int:
    try:
        with sync_playwright() as automate:
            navigateur = lancer_chromium(automate)
            verifier_ouverture_locale(navigateur)
            verifier_liens_guides_locaux(navigateur)
            controles = verifier_jeu(navigateur, construire_page_jeu())
            verifier_administration(navigateur, construire_page_administration())
            navigateur.close()
        print(f"OK — interface : 6 parcours, 66 étapes, 6 évaluations et {controles} contrôles de réponses réussis")
        return 0
    except (AssertionError, ErreurPlaywright, OSError) as erreur:
        print(f"ÉCHEC — {erreur}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(principal())
