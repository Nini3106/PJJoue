from __future__ import annotations

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
            ],
        )

    def test_menu_guides_reproduit_les_memes_groupes(self) -> None:
        js = (CODE / "01 - Éléments communs/Navigation/navigation-locale.js").read_text(encoding="utf-8")
        bloc_menu = js[js.index('const entrees = ['):js.index('];', js.index('const entrees = ['))]
        attendu = [
            "Accueil", "Parcours PJJ", "Entraînement libre", "Réviser", "Progression",
            "Carnet de parcours", "Supports", "Supports de révision", "Guides", "Mini jeux", "Mission Sigles",
        ]
        positions = []
        for libelle in attendu:
            pos = bloc_menu.find(libelle)
            self.assertNotEqual(pos, -1, f"Entrée absente du menu Guides : {libelle}")
            positions.append(pos)
        self.assertEqual(positions, sorted(positions), "L’ordre du menu Guides ne correspond pas au menu principal.")
        self.assertIn("Mission Mesures", js, "Le point d’extension prévu pour le prochain mini-jeu doit rester documenté.")

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

    def test_aucun_bouton_avec_aplat_jaune(self) -> None:
        termes_jaunes = (
            "var(--jaune-interface)",
            "var(--bouton-selection)",
            "#ffc83d",
            "linear-gradient(180deg,#ffe",
            "linear-gradient(180deg,#ffd",
            "linear-gradient(135deg,#ff",
        )
        motif_bloc = re.compile(r"([^{}]+)\{([^{}]*)\}", re.S)
        classes_bouton = re.compile(
            r"(?:^|[.#])(?:button|bouton|principal|secondaire|joker|lancer|continuer|confirmer|installer)(?:[-_a-z0-9]|$)",
            re.I,
        )
        erreurs: list[str] = []
        for css in CODE.rglob("*.css"):
            contenu = css.read_text(encoding="utf-8")
            for match in motif_bloc.finditer(contenu):
                corps = match.group(2)
                fonds = [x.strip() for x in corps.split(";") if "background" in x]
                if not any(any(terme in fond for terme in termes_jaunes) for fond in fonds):
                    continue
                for selecteur in match.group(1).split(","):
                    selecteur = " ".join(selecteur.split())
                    dernier = selecteur.split()[-1] if selecteur.split() else ""
                    # On vise l’élément cliquable lui-même, pas ses badges/icônes enfants.
                    if dernier == "button" or classes_bouton.search(dernier):
                        if ".danger" in dernier:
                            continue
                        erreurs.append(f"{css.relative_to(RACINE)} :: {selecteur} :: {'; '.join(fonds)}")
        self.assertEqual(erreurs, [], "Aplat jaune détecté sur un bouton :\n" + "\n".join(erreurs))

    def test_reinitialisation_globale_reste_rouge(self) -> None:
        html = (CODE / "10 - Paramètres/contenu.html").read_text(encoding="utf-8")
        css = (CODE / "10 - Paramètres/style-parametres-alignes.css").read_text(encoding="utf-8")
        self.assertIn('class="danger" id="boutonReinitialiserTouteLaProgression"', html)
        self.assertRegex(css, re.compile(r"\.parametres-zone-sensible \.danger \{[^}]*background:#ca3453;", re.S))


if __name__ == "__main__":
    unittest.main()
