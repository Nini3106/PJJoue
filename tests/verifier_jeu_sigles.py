#!/usr/bin/env python3
"""Recette Chromium de Mission Sigles branchée sur les composants natifs PJJoue."""
from __future__ import annotations

from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from verifier_interface import construire_page_jeu, lancer_chromium
from playwright.sync_api import sync_playwright

COULEURS_GRISES_NAVIGATEUR = {
    "rgb(239, 239, 239)", "rgb(240, 240, 240)", "rgb(221, 221, 221)",
    "rgb(242, 242, 242)", "buttonface",
}


def boutons_visibles(page, selecteur: str):
    return page.evaluate(
        """sel => [...document.querySelectorAll(sel)].filter(b => {
            const s = getComputedStyle(b);
            const r = b.getBoundingClientRect();
            return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
        }).map(b => ({
            id:b.id, classe:b.className, texte:b.innerText.trim(),
            fond:getComputedStyle(b).backgroundColor.toLowerCase(),
            bord:getComputedStyle(b).borderColor.toLowerCase(),
            couleur:getComputedStyle(b).color.toLowerCase(),
            disabled:b.disabled
        }))""",
        selecteur,
    )


def verifier_aucun_bouton_gris(page, selecteur: str) -> None:
    suspects = [b for b in boutons_visibles(page, selecteur) if b["fond"] in COULEURS_GRISES_NAVIGATEUR]
    assert not suspects, suspects


def verifier() -> None:
    html = construire_page_jeu()
    with sync_playwright() as automate:
        navigateur = lancer_chromium(automate)
        page = navigateur.new_page(viewport={"width": 1440, "height": 1000})
        erreurs: list[str] = []
        page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
        page.on("console", lambda message: erreurs.append(f"console:{message.type}:{message.text}") if message.type == "error" else None)
        page.set_content(html, wait_until="domcontentloaded")
        page.wait_for_function("() => window.DONNEES_PJJ?.SIGLES?.length === 72 && typeof ouvrirEntrainementMissionSiglesNatif === 'function'")
        # set_content inline le script sans defer ; on rebranche les jokers après parsing, comme le fait le vrai index avec defer.
        page.evaluate("() => initialiserFenetreJokers()")

        # 1. Accueil Mission Sigles : nom exact, 6 étapes colorées, aucun bouton natif gris.
        page.evaluate("() => afficherEcran('sigles')")
        assert page.locator("#boutonJeuSigles").text_content().strip() == "Mission Sigles"
        assert page.locator("#siglesEntrainementVue").count() == 0
        assert page.locator("#siglesSession").count() == 0
        assert page.locator("#siglesBilan").count() == 0
        actions_modes = page.evaluate("""() => ['siglesOuvrirParcours','siglesOuvrirEntrainement','siglesLancerDe','siglesLancerRevision'].map(id => {
            const bouton = document.getElementById(id);
            const style = getComputedStyle(bouton);
            const rect = bouton.getBoundingClientRect();
            return {id, classe:bouton.className, y:rect.y, hauteur:rect.height, fond:style.backgroundColor, bord:style.borderColor};
        })""")
        assert all("sigles-bouton-mode" in action["classe"] for action in actions_modes), actions_modes
        assert max(action["hauteur"] for action in actions_modes) - min(action["hauteur"] for action in actions_modes) <= 1, actions_modes
        assert abs(actions_modes[0]["y"] - actions_modes[1]["y"]) <= 1, actions_modes
        assert abs(actions_modes[2]["y"] - actions_modes[3]["y"]) <= 1, actions_modes
        assert len({action["fond"] for action in actions_modes}) == 1, actions_modes
        assert all(action["fond"] not in {"rgb(255, 200, 87)", "rgb(255, 200, 61)"} for action in actions_modes), actions_modes
        page.locator("#siglesOuvrirParcours").click()
        cartes = page.locator("#siglesEtapes .sigles-etape-carte")
        assert cartes.count() == 6
        couleurs = page.evaluate("() => [...document.querySelectorAll('#siglesEtapes .sigles-etape-carte')].map(x => getComputedStyle(x).borderTopColor)")
        assert len(set(couleurs)) == 6, couleurs
        verifier_aucun_bouton_gris(page, "#sigles button")

        # 2. La progression des questions enseigne le développement avant le rappel du sigle.
        donnees = page.evaluate("""() => {
            const q = creerQuestionsEtapeSigles(1);
            return q.map(x => ({type:x.type, consigne:x.consigne, explication:x.explication||'', sigle:x.cible?.sigle||null}));
        }""")
        assert [q["type"] for q in donnees[:4]] == ["introduction"] * 4
        assert [q["type"] for q in donnees[4:8]] == ["choix"] * 4
        assert "Protection judiciaire de la jeunesse" not in donnees[0]["consigne"]
        assert "PJJ" not in donnees[0]["consigne"]
        intro_options = page.evaluate("() => creerQuestionsEtapeSigles(1)[0].options.map(o => o.texte)")
        assert "Protection judiciaire de la jeunesse" in intro_options
        assert donnees[4]["sigle"] == "PJJ"
        assert "Que signifie PJJ" in donnees[4]["consigne"]
        assert all("famille" not in (q["consigne"] + " " + q["explication"]).lower() for q in donnees)
        introductions = page.evaluate("""() => SIGLES.map(c => { const q=creerQuestionIntroductionSigles(c); return {sigle:c.sigle, consigne:q.consigne, options:q.options.map(o=>o.texte)}; })""")
        formulations_generiques = {
            'Quel intitulé complet est correctement formulé ?',
            'Choisis l’appellation complète exacte.',
            'Quelle formulation correspond à l’intitulé complet à retenir ?',
        }
        assert len(introductions) == 72
        for intro in introductions:
            assert intro['consigne'] not in formulations_generiques, intro
            assert len(intro['consigne']) >= 45 and intro['consigne'].endswith('?'), intro
            assert all('complémentaire' not in option.lower() for option in intro['options']), intro

        # 3. Entraînement Mission Sigles = écran natif PJJoue, même DOM/composants/classes.
        page.evaluate("() => { afficherEcran('sigles'); retourAccueilSigles(); }")
        page.locator("#siglesOuvrirEntrainement").click()
        assert page.locator("#entrainement").is_visible()
        assert page.locator("#entrainement").get_attribute("data-contexte-entrainement") == "sigles"
        assert page.locator("#entrainement .entrainement-configurateur").count() == 1
        assert page.locator("#entrainement [data-groupe-choix='perimetreEntrainement'] .choix-bouton").count() == 7
        assert page.locator("#boutonEntrainement10Questions").inner_text().strip() == "10"
        assert page.locator("#boutonEntrainement20Questions").inner_text().strip() == "20"
        assert page.locator("#boutonEntrainement50Questions").inner_text().strip() == "30"
        assert page.locator("#boutonEntrainement100Questions").inner_text().strip() == "Tous"
        assert page.locator("#boutonLancerEntrainementOrdonne").get_attribute("class") == "entrainement-lancer principal"
        assert page.locator("#boutonLancerEntrainementMelange").get_attribute("class") == "entrainement-lancer principal"
        verifier_aucun_bouton_gris(page, "#entrainement button")

        # Le seul écart visuel demandé : le dé est vert parcours 6.
        couleur_de = page.evaluate("() => getComputedStyle(document.querySelector('#faceDeParcours')).color")
        assert couleur_de == "rgb(112, 214, 202)", couleur_de

        # 4. Dé du hasard natif : rotation, tirage, puis clic explicite pour lancer.
        page.evaluate("() => { Math.random = () => 0.5; }")
        page.locator("#boutonLancerLeDe").click()
        assert page.locator("#faceDeParcours").evaluate("el => el.classList.contains('de-en-lancer')")
        page.wait_for_timeout(470)
        assert page.locator("#boutonJouerLeTirage").is_visible()
        assert page.evaluate("() => etatJeuSigles.nombreTire") == 4
        assert page.evaluate("() => estSessionMissionSigles()") is False
        assert "Lancer 4 questions" in page.locator("#boutonJouerLeTirage").inner_text()
        page.locator("#boutonJouerLeTirage").click()
        assert page.locator("#question").is_visible()
        assert page.evaluate("() => obtenirModeMissionSigles()") == "hasard"
        assert page.evaluate("() => etat.questionsSession.length") == 4

        # 5. Carte Question = carte native PJJoue : précédente, passer, étoile Jokers, jokers masqués au départ.
        assert page.locator("#question .question-carte").count() == 1
        assert page.locator("#boutonQuestionPrecedente").is_visible()
        assert page.locator("#boutonPasser").is_visible()
        assert page.locator("#boutonJokers").is_visible()
        assert page.locator("#boutonJokers .joker-onglet-icone svg").count() == 1
        assert page.locator("#fenetreJokers").count() == 1
        assert not page.locator("#fenetreJokers").is_visible()
        assert page.locator("#boutonQuestionSuivante").is_hidden()
        verifier_aucun_bouton_gris(page, "#question button")

        # L'étoile ouvre la vraie fenêtre Jokers PJJoue, elle n'est pas affichée en permanence.
        page.locator("#boutonJokers").click()
        assert page.locator("#fenetreJokers").is_visible()
        assert page.locator("#boutonJoker5050").is_visible()
        assert page.locator("#boutonJokerIndice").is_visible()
        assert page.locator("#boutonJokerLangueAuChat").is_visible()
        page.locator("#fermerFenetreJokers").click()
        assert not page.locator("#fenetreJokers").is_visible()

        # 6. Entraînement sur une étape, mélangé, chrono et sans jokers via les contrôles natifs.
        page.evaluate("() => { etat.missionSiglesConfiguration=null; afficherEcran('sigles'); }")
        page.locator("#siglesOuvrirEntrainement").click()
        page.locator("[data-groupe-choix='perimetreEntrainement'] [data-valeur='2']").click()
        assert page.locator("#boutonEntrainement100Questions").is_visible()
        assert page.locator("#boutonEntrainement100Questions").inner_text().strip() == "Tous"
        page.locator("#boutonEntrainement100Questions").click()
        page.locator("[data-carte-entrainement='melange'] details summary").click()
        page.locator("#boutonEntrainementMelangeSansJokers").click()
        page.locator("#boutonEntrainementMelangeAvecChronometre").click()
        page.locator("#boutonEntrainementMelange15Secondes").click()
        page.locator("#boutonLancerEntrainementMelange").click()
        cfg = page.evaluate("""() => ({
            mode:obtenirModeMissionSigles(), total:etat.questionsSession.length,
            etapes:[...new Set(etatJeuSigles.siglesSession.map(x=>x.etape))],
            chrono:etat.chronometreSessionActif, secondes:etat.dureeChronometreSession,
            jokers:etat.jokersSessionActifs
        })""")
        assert cfg == {"mode":"entrainement", "total":12, "etapes":[2], "chrono":True, "secondes":15, "jokers":False}, cfg
        assert page.locator("#boutonJokers").is_hidden()
        assert page.locator("#chronometreQuestion").is_visible()

        # 7. Réviser mes erreurs passe lui aussi par la carte Question native.
        page.evaluate("""() => {
            afficherEcran('sigles');
            sauvegarde.siglesJeu.erreurs.PJJ = {active:true,nombreErreurs:1,reussitesRevision:0};
            sauvegarde.siglesJeu.erreurs.DPJJ = {active:true,nombreErreurs:1,reussitesRevision:0};
            sauvegarde.siglesJeu.decouverts.PJJ = true;
            sauvegarde.siglesJeu.decouverts.DPJJ = true;
            enregistrerSauvegarde(); actualiserAccueilSigles();
        }""")
        page.locator("#siglesLancerRevision").click()
        assert page.locator("#sigles-revision").is_visible()
        assert not page.locator("#erreurs").is_visible()
        assert page.locator("#sigles-revision h1").inner_text().strip() == "Réviser mes erreurs"
        assert "Sigles à retravailler" in page.locator("#titreErreursRevisionSigles").inner_text()
        assert page.locator("#sigles-revision [data-action='reviser-toutes-erreurs-sigles']").is_visible()
        assert page.locator("#sigles-revision [data-action='reviser-etape-sigles']").count() >= 1
        # La page Réviser de PJJoue reste indépendante et conserve son contenu d’origine.
        page.evaluate("() => afficherEcran('erreurs')")
        assert page.locator("#erreurs h1").inner_text().strip() == "Réviser"
        assert page.locator("#titreErreursRevision").inner_text().strip() == "Questions à retravailler"
        page.evaluate("() => afficherEcran('sigles-revision')")
        page.locator("[data-action='reviser-toutes-erreurs-sigles']").click()
        assert page.locator("#question").is_visible()
        assert page.evaluate("() => obtenirModeMissionSigles()") == "revision"
        assert sorted(page.evaluate("() => etatJeuSigles.siglesSession.map(x=>x.sigle)")) == ["DPJJ","PJJ"]

        # 8. Évaluation native : 30 questions, ni joker ni passage.
        page.evaluate("""() => {
            afficherEcran('sigles');
            [1,2,3,4,5,6].forEach(numero => {
                const e=obtenirEtatEtapeSigles(numero);
                obtenirSiglesEtape(numero).forEach(x => {e.autonomes[x.sigle]=true; e.validationsSansJoker[x.sigle]=true; sauvegarde.siglesJeu.decouverts[x.sigle]=true;});
            }); enregistrerSauvegarde(); actualiserAccueilSigles(); afficherVueSigles('parcours');
        }""")
        assert page.locator("#siglesLancerEvaluation").is_enabled()
        page.locator("#siglesLancerEvaluation").click()
        assert page.locator("#question").is_visible()
        assert page.evaluate("() => etat.questionsSession.length") == 30
        assert page.locator("#boutonJokers").is_hidden()
        assert page.locator("#boutonPasser").is_hidden()

        # 9. Mobile : entraînement et question natifs sans débordement horizontal.
        page.set_viewport_size({"width":390,"height":844})
        page.evaluate("() => { afficherEcran('sigles'); ouvrirEntrainementMissionSiglesNatif(); }")
        for selecteur in ["#entrainement", "#question"]:
            if selecteur == "#question":
                page.locator("#boutonLancerEntrainementOrdonne").click()
            dimensions = page.evaluate("() => ({scroll:document.documentElement.scrollWidth, client:document.documentElement.clientWidth})")
            assert dimensions["scroll"] == dimensions["client"], (selecteur, dimensions)

        assert not erreurs, erreurs
        navigateur.close()
    print("OK — Mission Sigles : composants natifs PJJoue · dé vert · aucun bouton gris · question/jokers natifs · entraînement complet · révision · évaluation · mobile")


if __name__ == "__main__":
    verifier()
