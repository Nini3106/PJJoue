from __future__ import annotations

import json
import re
import unittest
from collections import defaultdict
from pathlib import Path

RACINE = Path(__file__).resolve().parents[1]
CHARTE = RACINE / "documentation" / "documentation-actuelle" / "CHARTE_BANQUE_QUESTIONS.md"
QUESTIONS = RACINE / "donnees" / "questions.json"
MANIFESTE = RACINE / "MANIFESTE.json"

NOMBRE_INTERROGATIF_SANS_SONT = re.compile(
    r"^(Quels?|Quelles?)\s+(?:\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze)\b",
    re.I,
)
ARTICLE_BRUT = re.compile(
    r"\b(?:article\s+)?[LRD]\s*\.?\s*\d+(?:[-‑]\d+)*\b|\barticle\s+\d+(?:[-‑]\d+)*\b",
    re.I,
)


class CharteQuestionsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.charte = CHARTE.read_text(encoding="utf-8")
        cls.questions = json.loads(QUESTIONS.read_text(encoding="utf-8"))
        cls.manifeste = json.loads(MANIFESTE.read_text(encoding="utf-8"))

    def test_charte_interdit_quels_quelles_nombre_sans_sont(self) -> None:
        self.assertIn("Quels/Quelles sont les + nombre", self.charte)
        self.assertIn("Quels deux… ?", self.charte)
        self.assertIn("Quelles trois… ?", self.charte)
        violations = [
            q["id"] for q in self.questions
            if NOMBRE_INTERROGATIF_SANS_SONT.search(q.get("enonce", "").strip())
        ]
        self.assertEqual(violations, [], f"Questions à reformuler avec « sont » : {violations}")

    def test_charte_interdit_les_references_juridiques_brutes_dans_enonce(self) -> None:
        self.assertIn("article L1", self.charte)
        self.assertIn("L. 11-1", self.charte)
        violations = [
            q["id"] for q in self.questions
            if ARTICLE_BRUT.search(q.get("enonce", ""))
        ]
        self.assertEqual(violations, [], f"Références juridiques brutes dans les énoncés : {violations}")

    def test_charte_impose_une_notion_principale_et_une_longueur_maitrisee(self) -> None:
        self.assertIn("une seule notion, une seule distinction ou un seul raisonnement", self.charte)
        self.assertIn("220 caractères", self.charte)
        self.assertIn("Une question longue parce qu'elle traite plusieurs notions différentes doit être scindée", self.charte)

    def test_charte_impose_les_sept_modes_dans_chaque_etape(self) -> None:
        self.assertIn("Chaque étape d'apprentissage doit comporter au moins une question utilisant chacun des sept modes canoniques", self.charte)
        for mode in [
            "Choix unique", "Sélection multiple", "Relier / Association",
            "Éliminer / Retirer des choix", "Réponse écrite",
            "Remettre dans l'ordre", "Classer",
        ]:
            self.assertIn(mode, self.charte)


    def test_toutes_les_etapes_contiennent_les_sept_modes(self) -> None:
        modes_attendus = {
            "choix-unique", "selection-multiple", "association", "eliminer",
            "reponse-ecrite", "remettre-ordre", "classer",
        }
        par_etape = defaultdict(set)
        for q in self.questions:
            if not q.get("estEvaluationFinale"):
                par_etape[(q["theme"], q["etape"])].add(q.get("modePrefere"))
        self.assertEqual(len(par_etape), 66)
        manquants = {
            cle: sorted(modes_attendus - presents)
            for cle, presents in par_etape.items()
            if modes_attendus - presents
        }
        self.assertEqual(manquants, {}, f"Modes absents par étape : {manquants}")

    def test_aucun_enonce_ne_depasse_220_caracteres(self) -> None:
        violations = [(q["id"], len(q.get("enonce", ""))) for q in self.questions if len(q.get("enonce", "")) > 220]
        self.assertEqual(violations, [], f"Énoncés trop longs : {violations}")

    def test_choix_unique_reponses_visuellement_equilibrees(self) -> None:
        violations = []
        for q in self.questions:
            if q.get("modePrefere") != "choix-unique":
                continue
            choix = [q.get("bonneReponse", "")] + list(q.get("mauvaisesReponses") or [])
            if len(choix) != 4 or any(not str(x).strip() for x in choix):
                continue
            longueurs = [len(str(x).strip()) for x in choix]
            if max(longueurs) > 35 and max(longueurs) / max(1, min(longueurs)) > 2.8:
                violations.append((q["id"], longueurs))
        self.assertEqual(violations, [], f"Choix uniques visuellement déséquilibrés : {violations}")

    def test_classer_ne_reduit_pas_la_question_a_vrai_faux(self) -> None:
        motifs = re.compile(r"\b(?:correct(?:e)?s?|incorrect(?:e)?s?|vrai(?:e)?s?|faux|exact(?:e)?s?|inexact(?:e)?s?)\b", re.I)
        violations = []
        for q in self.questions:
            if q.get("modePrefere") != "classer":
                continue
            categories = [x.get("texte", "") for x in (q.get("activite") or {}).get("categories", [])]
            if any(motifs.search(c) for c in categories):
                violations.append((q["id"], categories))
        self.assertEqual(violations, [], f"Classements artificiels de type vrai/faux : {violations}")


    def test_reponses_ecrites_sont_limitees_a_trois_mots(self) -> None:
        self.assertIn("un à trois mots maximum", self.charte)
        motif_mot = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:['’\-][A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*")
        violations = []
        for q in self.questions:
            if q.get("modePrefere") != "reponse-ecrite":
                continue
            nb_mots = len(motif_mot.findall(str(q.get("bonneReponse", ""))))
            if nb_mots > 3:
                violations.append((q["id"], nb_mots, q.get("bonneReponse")))
        self.assertEqual(violations, [], f"Réponses écrites de plus de trois mots : {violations}")

    def test_prerequis_declares_respectent_ordre_pedagogique_reel(self) -> None:
        self.assertIn("réellement introduite dans une question antérieure", self.charte)
        par_theme = defaultdict(list)
        for q in self.questions:
            if not q.get("estEvaluationFinale"):
                par_theme[q["theme"]].append(q)
        violations = []
        for theme, questions in par_theme.items():
            questions.sort(key=lambda q: (q["etape"], q.get("ordreEtape", q["id"]), q["id"]))
            vus = set()
            for q in questions:
                manquants = [p for p in (q.get("prerequisPedagogiques") or []) if p not in vus]
                if manquants:
                    violations.append((q["id"], manquants))
                vus.update(q.get("introduitConcepts") or [])
        self.assertEqual(violations, [], f"Prérequis placés après leur utilisation : {violations}")

    def test_21_ans_est_visible_avant_les_deux_restitutions_ecrites(self) -> None:
        par_id = {q["id"]: q for q in self.questions}
        for intro_id, rappel_id in [(17, 16), (1811, 1812)]:
            intro = par_id[intro_id]
            visible = intro.get("enonce", "") + " " + intro.get("bonneReponse", "")
            if intro.get("activite"):
                visible += " " + json.dumps(intro["activite"], ensure_ascii=False)
            self.assertIn("21 ans", visible, f"Q{intro_id} doit rendre 21 ans visible avant Q{rappel_id}")
            self.assertEqual(par_id[rappel_id].get("modePrefere"), "reponse-ecrite")

    def test_reponses_ecrites_nacceptent_pas_une_unite_seule(self) -> None:
        unites_seules = {"an", "ans", "mois", "jour", "jours", "euro", "euros"}
        violations = []
        for q in self.questions:
            if q.get("modePrefere") != "reponse-ecrite":
                continue
            for variante in q.get("reponsesAcceptees") or []:
                normalisee = variante.strip().strip(".").casefold()
                if normalisee in unites_seules:
                    violations.append((q["id"], variante))
                if normalisee.isdigit() and any(u in q.get("bonneReponse", "").casefold() for u in ("an", "mois", "jour", "euro")):
                    violations.append((q["id"], variante))
        self.assertEqual(violations, [], f"Variantes écrites trop permissives : {violations}")

    def test_charte_couleurs_couvre_les_interactions_de_question(self) -> None:
        for element in [
            "la carte de l'étape",
            "le badge ou repère **Étape**",
            "les fils de liaison du mode Relier",
            "les réponses sélectionnées en sélection multiple",
            "les éléments sélectionnés du mode Classer",
            "les éléments sélectionnés ou actifs du mode Remettre dans l'ordre",
        ]:
            self.assertIn(element, self.charte)
        regle = self.manifeste["reglesVisuelles"]["identiteCouleurParcoursEtEtapes"]
        self.assertIn("fils de liaison du mode Relier", regle["applicationMinimum"])
        self.assertIn("distinctionSemantique", regle)

    def test_selection_multiple_garde_deux_distracteurs_et_un_equilibre_visuel(self) -> None:
        violations = []
        for q in self.questions:
            if q.get("modePrefere") != "selection-multiple":
                continue
            activite = q.get("activite") or {}
            propositions = activite.get("propositions") or []
            reponses = set(activite.get("reponses") or [])
            distracteurs = [p for p in propositions if p.get("id") not in reponses]
            longueurs = [len(str(p.get("texte", "")).strip()) for p in propositions]
            if len(distracteurs) < 2:
                violations.append((q["id"], "moins de deux distracteurs"))
            if longueurs and max(longueurs) > 40 and max(longueurs) / max(1, min(longueurs)) > 3:
                violations.append((q["id"], longueurs))
        self.assertEqual(violations, [], f"Sélections multiples trop faciles ou déséquilibrées : {violations}")

    def test_eliminer_garde_affichage_et_correction_synchronises(self) -> None:
        violations = []
        for q in self.questions:
            if q.get("modePrefere") != "eliminer":
                continue
            conservees = list(q.get("propositionsAConserver") or [])
            mauvaises = list(q.get("mauvaisesReponses") or [])
            affichees = list(q.get("propositionsAEliminer") or [])
            if set(affichees) != set(conservees) | set(mauvaises) or set(conservees) & set(mauvaises):
                violations.append((q["id"], "champs désynchronisés"))
            if q.get("nombreEliminationsAttendues") != len(mauvaises):
                violations.append((q["id"], "nombre d'éliminations incohérent"))
            longueurs = [len(str(x).strip()) for x in affichees]
            if longueurs and max(longueurs) > 40 and max(longueurs) / max(1, min(longueurs)) > 3:
                violations.append((q["id"], longueurs))
        self.assertEqual(violations, [], f"Activités Éliminer incohérentes ou déséquilibrées : {violations}")

    def test_associations_sont_bijectives_et_sans_cible_inutilisee(self) -> None:
        violations = []
        for q in self.questions:
            if q.get("modePrefere") != "association":
                continue
            activite = q.get("activite") or {}
            gauche = {x.get("id") for x in activite.get("colonneGauche") or []}
            droite = {x.get("id") for x in activite.get("colonneDroite") or []}
            associations = activite.get("associations") or {}
            if set(associations) != gauche or set(associations.values()) != droite or len(set(associations.values())) != len(associations):
                violations.append(q["id"])
        self.assertEqual(violations, [], f"Associations non bijectives : {violations}")

    def test_developpement_de_sigle_ne_demande_pas_le_sigle_lui_meme(self) -> None:
        motif = re.compile(r"^Développe le sigle\s+([A-ZÀ-ÖØ-Ý0-9-]+)\.?$", re.I)
        violations = []
        for q in self.questions:
            correspondance = motif.match(q.get("enonce", "").strip())
            if not correspondance:
                continue
            sigle = correspondance.group(1).strip().strip(".").casefold()
            reponse = str(q.get("bonneReponse", "")).strip().strip(".").casefold()
            if reponse == sigle:
                violations.append(q["id"])
        self.assertEqual(violations, [], f"Développements de sigles dont la réponse reste le sigle : {violations}")

    def test_selection_multiple_consigne_compte_les_reponses_attendues(self) -> None:
        motif = re.compile(r"exactement\s+(\d+)\s+réponses?", re.I)
        violations = []
        for q in self.questions:
            if q.get("modePrefere") != "selection-multiple":
                continue
            activite = q.get("activite") or {}
            reponses = activite.get("reponses") or []
            consigne = str(activite.get("consigne", ""))
            correspondance = motif.search(consigne)
            if not correspondance or int(correspondance.group(1)) != len(reponses):
                violations.append((q["id"], consigne, len(reponses)))
        self.assertEqual(violations, [], f"Consignes de sélection multiple incohérentes : {violations}")

    def test_champs_compatibilite_choix_unique_sont_synchronises(self) -> None:
        violations = []
        for q in self.questions:
            if q.get("modePrefere") != "choix-unique":
                continue
            if q.get("faitsCorrects") != q.get("bonneReponse"):
                violations.append((q["id"], "faitsCorrects"))
            if list(q.get("faitsIncorrects") or []) != list(q.get("mauvaisesReponses") or []):
                violations.append((q["id"], "faitsIncorrects"))
        self.assertEqual(violations, [], f"Champs de compatibilité désynchronisés en choix unique : {violations}")

    def test_champs_compatibilite_eliminer_sont_synchronises(self) -> None:
        violations = []
        for q in self.questions:
            if q.get("modePrefere") != "eliminer":
                continue
            if list(q.get("faitsCorrects") or []) != list(q.get("propositionsAConserver") or []):
                violations.append((q["id"], "faitsCorrects"))
            if list(q.get("faitsIncorrects") or []) != list(q.get("mauvaisesReponses") or []):
                violations.append((q["id"], "faitsIncorrects"))
        self.assertEqual(violations, [], f"Champs de compatibilité désynchronisés en Éliminer : {violations}")


if __name__ == "__main__":
    unittest.main()
