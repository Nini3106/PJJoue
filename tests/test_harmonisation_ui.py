from __future__ import annotations

import json
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path

RACINE = Path(__file__).resolve().parents[1]
CODE = RACINE / "code"


class _MenuParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_menu = False
        self.depth = 0
        self.labels: list[str] = []
        self.current: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_d = dict(attrs)
        if tag == "nav" and attrs_d.get("id") == "menuPrincipal":
            self.in_menu = True
            self.depth = 1
            return
        if not self.in_menu:
            return
        if tag == "nav":
            self.depth += 1
        if tag in {"button", "a", "span"} and (
            tag in {"button", "a"} or "navigation-section-titre" in (attrs_d.get("class") or "")
        ):
            self.current = []

    def handle_endtag(self, tag: str) -> None:
        if self.in_menu and self.current is not None and tag in {"button", "a", "span"}:
            texte = " ".join("".join(self.current).split())
            if texte and texte != "Installer PJJoue":
                self.labels.append(texte)
            self.current = None
        if self.in_menu and tag == "nav":
            self.depth -= 1
            if self.depth == 0:
                self.in_menu = False

    def handle_data(self, data: str) -> None:
        if self.in_menu and self.current is not None:
            self.current.append(data)


class HarmonisationInterfaceTests(unittest.TestCase):
    def test_menu_principal_suit_ordre_valide(self) -> None:
        html = (CODE / "01 - Éléments communs/gabarit-page-principale.html").read_text(encoding="utf-8")
        parser = _MenuParser()
        parser.feed(html)
        self.assertEqual(
            parser.labels,
            [
                "Accueil",
                "Parcours PJJ",
                "Entraînement libre",
                "Réviser",
                "Progression",
                "Carnet de parcours",
                "Supports",
                "Supports de révision",
                "Guides",
                "Mini jeux",
                "Mission Sigles",
                "Paramètres",
            ],
        )

    def test_menu_guides_reproduit_les_memes_groupes(self) -> None:
        js = (CODE / "01 - Éléments communs/Navigation/navigation-locale.js").read_text(encoding="utf-8")
        bloc_menu = js[js.index('const entrees = ['):js.index('];', js.index('const entrees = ['))]
        attendu = [
            "Accueil", "Parcours PJJ", "Entraînement libre", "Réviser", "Progression",
            "Carnet de parcours", "Supports", "Supports de révision", "Guides", "Mini jeux", "Mission Sigles", "Paramètres",
        ]
        positions = []
        for libelle in attendu:
            pos = bloc_menu.find(libelle)
            self.assertNotEqual(pos, -1, f"Entrée absente du menu Guides : {libelle}")
            positions.append(pos)
        self.assertEqual(positions, sorted(positions), "L’ordre du menu Guides ne correspond pas au menu principal.")
        self.assertIn("Mission Mesures", js, "Le point d’extension prévu pour le prochain mini-jeu doit rester documenté.")


    def test_parametres_reste_harmonise_dans_le_menu(self) -> None:
        html = (CODE / "01 - Éléments communs/gabarit-page-principale.html").read_text(encoding="utf-8")
        self.assertIn('id="boutonParametres" data-ecran="parametres"', html)
        self.assertLess(html.index('id="boutonJeuSigles"'), html.index('id="boutonParametres"'))
        general = (CODE / "01 - Éléments communs/style-general-pjjoue.css").read_text(encoding="utf-8")
        self.assertRegex(general, re.compile(r"header\.entete \.navigation button,\s*header\.entete \.navigation \.navigation-lien\s*\{[^}]*font-size:\s*1rem;", re.S))

    def test_titre_supports_est_centre_comme_les_autres_pages(self) -> None:
        general = (CODE / "01 - Éléments communs/style-general-pjjoue.css").read_text(encoding="utf-8")
        self.assertRegex(general, re.compile(r"#supports > \.page-entete,[^}]*#parametres > \.page-entete\s*\{\s*text-align:\s*center;", re.S))

    def test_guides_possedent_un_bouton_retour(self) -> None:
        dossier = CODE / "11 - Guides pour découvrir la PJJ"
        pages = sorted(dossier.glob("*/page.html"))
        self.assertGreaterEqual(len(pages), 10)
        for page in pages:
            html = page.read_text(encoding="utf-8")
            self.assertIn("page-information-retour", html, f"Bouton Retour absent : {page.relative_to(RACINE)}")
            self.assertRegex(html, r">\s*← Retour (?:aux guides|à PJJoue)\s*</a>")

    def test_espacement_retour_titre_est_harmonise_a_24_px(self) -> None:
        general = (CODE / "01 - Éléments communs/style-general-pjjoue.css").read_text(encoding="utf-8")
        statique = (CODE / "01 - Éléments communs/static-pages.css").read_text(encoding="utf-8")
        sigles = (CODE / "08 - Réviser/Jeu des sigles/style-jeu-des-sigles.css").read_text(encoding="utf-8")
        self.assertRegex(general, re.compile(r"\.barre-actions-page:has\(\.bouton-retour:not\(\.masque\)\)\s*\{[^}]*margin-bottom:\s*24px;", re.S))
        self.assertRegex(statique, re.compile(r"\.page-information-retour, \.guide-fil-ariane\s*\{[^}]*margin-bottom:\s*24px;", re.S))
        self.assertIn("#sigles .sigles-retour { margin:0 0 24px; }", sigles)

    def test_titres_mission_sigles_et_guides_sont_harmonises(self) -> None:
        sigles = (CODE / "08 - Réviser/Jeu des sigles/style-jeu-des-sigles.css").read_text(encoding="utf-8")
        guides = (CODE / "11 - Guides pour découvrir la PJJ/Accueil des guides/style-de-la-page.css").read_text(encoding="utf-8")
        statique = (CODE / "01 - Éléments communs/static-pages.css").read_text(encoding="utf-8")
        self.assertRegex(sigles, re.compile(r"#sigles \.sigles-accueil-entete\s*\{[^}]*text-align:center;", re.S))
        self.assertRegex(guides, re.compile(r"\.guides-entete\s*\{[^}]*text-align:center;", re.S))
        self.assertRegex(guides, re.compile(r"\.guides-entete h1\s*\{[^}]*font-size:clamp\(1\.65rem,2\.75vw,2\.55rem\);", re.S))
        self.assertRegex(statique, re.compile(r"\.guide-site-entete\.menu-guide-actif \.guide-navigation-principale a\s*\{[^}]*font-size:\s*1rem;[^}]*font-weight:\s*800;", re.S))

    def test_reviser_offre_acces_direct_aux_supports(self) -> None:
        html = (CODE / "08 - Réviser/contenu.html").read_text(encoding="utf-8")
        self.assertIn('class="discret revision-lien-supports"', html)
        self.assertIn('data-ecran="supports"', html)
        self.assertIn("Supports de révision", html)

    def test_question_affiche_parcours_puis_etape(self) -> None:
        html = (CODE / "06 - Question/contenu.html").read_text(encoding="utf-8")
        self.assertLess(html.index("numeroParcoursQuestion"), html.index("numeroEtapeQuestion"))
        self.assertIn("titreParcoursQuestion", html)
        js = (CODE / "06 - Question/actions/05 - Préparer et afficher la question.js").read_text(encoding="utf-8")
        self.assertIn("numeroParcours.textContent", js)
        self.assertIn("titreParcours.textContent", js)
        general = (CODE / "01 - Éléments communs/style-general-pjjoue.css").read_text(encoding="utf-8")
        self.assertIn("color:var(--parcours-accent,#8db9ff);", general)
        self.assertIn("color:var(--couleur-etape-active,#7de0d5);", general)

    def test_seul_commencer_reprendre_est_jaune_plein(self) -> None:
        termes_jaunes = (
            "var(--jaune-interface)",
            "var(--bouton-selection)",
            "#ffc83d",
            "#ffd45f",
            "#ffe08a",
            "#f6bb3b",
        )
        motif_bloc = re.compile(r"([^{}]+)\{([^{}]*)\}", re.S)
        classes_bouton = re.compile(
            r"(?:^|[.#])(?:button|bouton|principal|secondaire|joker|lancer|continuer|confirmer|installer|accepter)(?:[-_a-z0-9]|$)",
            re.I,
        )
        erreurs: list[str] = []
        autorises: list[str] = []
        for css in CODE.rglob("*.css"):
            contenu = css.read_text(encoding="utf-8")
            for match in motif_bloc.finditer(contenu):
                corps = match.group(2)
                fonds = [x.strip() for x in corps.split(";") if "background" in x]
                if not any(any(terme in fond.lower() for terme in termes_jaunes) for fond in fonds):
                    continue
                for selecteur in match.group(1).split(","):
                    selecteur = " ".join(selecteur.split())
                    dernier = selecteur.split()[-1] if selecteur.split() else ""
                    if dernier == "button" or classes_bouton.search(dernier):
                        if ".danger" in dernier:
                            continue
                        if ".bouton-commencer" in selecteur:
                            autorises.append(f"{css.relative_to(RACINE)} :: {selecteur}")
                            continue
                        erreurs.append(f"{css.relative_to(RACINE)} :: {selecteur} :: {'; '.join(fonds)}")
        self.assertTrue(autorises, "Le bouton Commencer/Reprendre de l’accueil doit conserver son aplat jaune.")
        self.assertEqual(erreurs, [], "Aplat jaune détecté hors Commencer/Reprendre :\n" + "\n".join(erreurs))

    def test_boutons_epousent_leur_texte_sans_largeur_forcee(self) -> None:
        motif_bloc = re.compile(r"([^{}]+)\{([^{}]*)\}", re.S)
        erreurs: list[str] = []
        for css in CODE.rglob("*.css"):
            contenu = css.read_text(encoding="utf-8")
            for match in motif_bloc.finditer(contenu):
                selecteurs = [" ".join(x.split()) for x in match.group(1).split(",")]
                corps = match.group(2)
                largeur_forcee = re.search(r"(?<!max-)\bwidth\s*:\s*(?:100%|min\()", corps)
                etirement = re.search(r"justify-self\s*:\s*stretch\s*;", corps)
                croissance_flex = re.search(r"\bflex\s*:\s*[1-9]", corps)
                if not (largeur_forcee or etirement or croissance_flex):
                    continue
                for selecteur in selecteurs:
                    dernier = selecteur.split()[-1] if selecteur.split() else ""
                    dernier_minuscule = dernier.lower()
                    # La règle vise les éléments bouton eux-mêmes, pas les conteneurs
                    # dont le nom peut contenir « boutons » (ex. .parametres-actions-boutons).
                    est_bouton = (
                        dernier == "button"
                        or ("bouton" in dernier_minuscule and "boutons" not in dernier_minuscule)
                        or dernier_minuscule.endswith(("-lancer", ".principal", ".secondaire", "-continuer", "-confirmer", "-valider"))
                    )
                    if est_bouton:
                        erreurs.append(f"{css.relative_to(RACINE)} :: {selecteur} :: {' '.join(corps.split())}")
        self.assertEqual(erreurs, [], "Bouton encore étiré artificiellement :\n" + "\n".join(erreurs))

        entrainement = (CODE / "05 - Entraînement libre/style-configurateur-entrainement.css").read_text(encoding="utf-8")
        parametres = (CODE / "10 - Paramètres/style-parametres-alignes.css").read_text(encoding="utf-8")
        self.assertRegex(entrainement, re.compile(r"#entrainement \.entrainement-options-avancees \+ \.entrainement-lancer,\s*#entrainement \.entrainement-lancer \{[^}]*width:max-content;[^}]*max-width:100%;", re.S))
        self.assertIn(".choix-groupe .choix-bouton { width:max-content; max-width:100%;", parametres)

    def test_question_parametres_et_entrainement_respectent_les_nouvelles_regles(self) -> None:
        question_html = (CODE / "06 - Question/contenu.html").read_text(encoding="utf-8")
        question_css = (CODE / "06 - Question/style-de-la-page.css").read_text(encoding="utf-8")
        parametres_html = (CODE / "10 - Paramètres/contenu.html").read_text(encoding="utf-8")
        sauvegarde = (CODE / "01 - Éléments communs/JavaScript - Sauvegarde locale.js").read_text(encoding="utf-8")
        entrainement = (CODE / "05 - Entraînement libre/style-configurateur-entrainement.css").read_text(encoding="utf-8")

        self.assertNotIn('question-contexte-separateur', question_html)
        self.assertIn('grid-template-columns: minmax(0,1fr) auto minmax(0,1fr);', question_css)
        self.assertIn('#question .suivant-ligne #boutonJokers {\n        grid-column: 2;\n        grid-row: 2;', question_css)
        self.assertIn('<option value="1" selected>', parametres_html)
        self.assertIn('id="boutonTailleTexteNormale" class="choix-bouton actif selectionne" data-valeur="1" aria-pressed="true"', parametres_html)
        self.assertIn('parametres: { son: true, volume: .65, echelleTexte: 1 }', sauvegarde)
        self.assertRegex(entrainement, re.compile(r"#entrainement \.entrainement-options-avancees \+ \.entrainement-lancer,\s*#entrainement \.entrainement-lancer \{[^}]*align-self:start;[^}]*width:max-content;", re.S))
        question_js = (CODE / "06 - Question/actions/05 - Préparer et afficher la question.js").read_text(encoding="utf-8")
        self.assertIn("question?.theme === 'commun'", question_js)
        self.assertIn("obtenirCouleurTitreEtape(question?.etape)", question_js)

    def test_navigation_locale_ne_manipule_pas_history_en_file(self) -> None:
        navigation = (CODE / "01 - Éléments communs/JavaScript - Navigation et fenêtres.js").read_text(encoding="utf-8")
        debut = navigation.index('if (utiliserNavigationLocaleSansServeur()) {', navigation.index('function mettreAJourAdresseNavigation'))
        fin = navigation.index('    if (window.location.pathname === route', debut)
        branche_locale = navigation[debut:fin]
        self.assertNotIn('history[methode]', branche_locale)
        self.assertNotIn("'#'", branche_locale)
        self.assertIn("identifiant === 'accueil'", branche_locale)

    def test_entrainement_est_structurellement_harmonise(self) -> None:
        css = (CODE / "05 - Entraînement libre/style-configurateur-entrainement.css").read_text(encoding="utf-8")
        css_genere = (RACINE / "ressources/styles/pjjoue-principal.css").read_text(encoding="utf-8")
        self.assertRegex(css_genere, re.compile(r"#entrainement \.entrainement-perimetre-choix \.choix-bouton \{[^}]*width:230px;[^}]*height:82px;", re.S), "Le gabarit harmonisé des parcours doit être compilé dans le site public.")
        self.assertIn("#entrainement .entrainement-etape-config.entrainement-etape-modes {", css)
        self.assertRegex(css, re.compile(r"#entrainement \.entrainement-etape-config,\s*#entrainement \.entrainement-etape-config\.entrainement-etape-modes \{[^}]*border:1px solid var\(--bordure-carte\);[^}]*background:var\(--surface-carte\);", re.S))
        self.assertRegex(css, re.compile(r"#entrainement \.entrainement-nombre-config \{[^}]*grid-template-columns:1fr;", re.S))
        self.assertRegex(css_genere, re.compile(r"#entrainement \.entrainement-grille \{[^}]*grid-template-columns:\s*repeat\(2,minmax\(0,1fr\)\);", re.S))
        self.assertRegex(css, re.compile(r"#entrainement \.entrainement-options-avancees summary \{[^}]*width:max-content;[^}]*border:1px solid var\(--bordure\);", re.S))
        self.assertRegex(css, re.compile(r"#entrainement \.entrainement-perimetre-choix \.choix-bouton \{[^}]*width:230px;[^}]*height:82px;", re.S))
        self.assertIn("justify-content:center;", css)

    def test_titre_revision_est_reellement_centre(self) -> None:
        general = (CODE / "01 - Éléments communs/style-general-pjjoue.css").read_text(encoding="utf-8")
        self.assertRegex(general, re.compile(r"#erreurs \.revision-page-entete-ligne \{[^}]*grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\);", re.S))
        self.assertRegex(general, re.compile(r"#erreurs \.revision-page-entete-ligne h1 \{[^}]*grid-column:2;[^}]*justify-self:center;[^}]*text-align:center;", re.S))

    def test_survol_menu_principal_reprend_celui_des_guides(self) -> None:
        general = (CODE / "01 - Éléments communs/style-general-pjjoue.css").read_text(encoding="utf-8")
        statique = (CODE / "01 - Éléments communs/static-pages.css").read_text(encoding="utf-8")
        self.assertRegex(statique, re.compile(r"\.guide-site-entete\.menu-guide-actif \.guide-navigation-principale a:hover \{ color: var\(--text\); background: var\(--surface-raised\); \}"))
        self.assertRegex(general, re.compile(r"header\.entete \.navigation button,\s*header\.entete \.navigation \.navigation-lien \{[^}]*color: #d5e6f7;[^}]*font-weight: 800;", re.S))
        self.assertRegex(general, re.compile(r"header\.entete \.navigation button:hover,[^{]+\{[^}]*color: #fff;[^}]*border-color: transparent;[^}]*background: #1b568f;", re.S))


    def test_identite_couleur_parcours_et_etapes_est_une_regle_manifeste(self) -> None:
        manifeste = json.loads((RACINE / "MANIFESTE.json").read_text(encoding="utf-8"))
        regle = manifeste.get("reglesVisuelles", {}).get("identiteCouleurParcoursEtEtapes", {})
        self.assertTrue(regle.get("obligatoire"))
        self.assertIn("couleur canonique", regle.get("principe", ""))
        self.assertIn("contour ou accent d'encadrement", regle.get("applicationMinimum", []))
        self.assertIn("survol ou focus lorsque le composant est interactif", regle.get("applicationMinimum", []))

        parcours_css = (CODE / "01 - Éléments communs/style-des-six-parcours.css").read_text(encoding="utf-8")
        entrainement_css = (CODE / "05 - Entraînement libre/style-configurateur-entrainement.css").read_text(encoding="utf-8")
        entrainement_js = (CODE / "05 - Entraînement libre/actions-de-la-page.js").read_text(encoding="utf-8")
        revision_css = (CODE / "08 - Réviser/style-reviser-et-supports.css").read_text(encoding="utf-8")
        revision_js = (CODE / "08 - Réviser/actions-de-la-page.js").read_text(encoding="utf-8")
        question_css = (CODE / "01 - Éléments communs/style-general-pjjoue.css").read_text(encoding="utf-8")
        question_js = (CODE / "06 - Question/actions/05 - Préparer et afficher la question.js").read_text(encoding="utf-8")

        self.assertIn("border-top: 5px solid var(--parcours-accent-lisible,var(--parcours-accent));", parcours_css)
        self.assertIn("border-left:5px solid var(--parcours-accent,var(--bordure));", entrainement_css)
        self.assertIn("border-color:var(--parcours-accent,#4f8cff);", entrainement_css)
        self.assertIn("bouton.style.setProperty('--parcours-accent', identite.couleur);", entrainement_js)
        self.assertIn("border-left:5px solid var(--parcours-accent);", revision_css)
        self.assertIn("style=\"--parcours-accent:${identite.couleur};--parcours-accent-rgb:${identite.couleurRgb}\"", revision_js)
        self.assertIn("background: var(--couleur-etape-active);", question_css)
        self.assertIn("border-color: var(--couleur-etape-active,var(--jaune-interface));", question_css)
        self.assertIn("color:var(--parcours-accent,#8db9ff);", question_css)
        self.assertIn("color:var(--couleur-etape-active,#7de0d5);", question_css)
        self.assertIn("obtenirCouleurTitreEtape(question?.etape)", question_js)

    def test_reinitialisation_globale_reste_rouge(self) -> None:
        html = (CODE / "10 - Paramètres/contenu.html").read_text(encoding="utf-8")
        css = (CODE / "10 - Paramètres/style-parametres-alignes.css").read_text(encoding="utf-8")
        self.assertIn('class="danger" id="boutonReinitialiserTouteLaProgression"', html)
        self.assertRegex(css, re.compile(r"\.parametres-zone-sensible \.danger \{[^}]*background:#ca3453;", re.S))


if __name__ == "__main__":
    unittest.main()
