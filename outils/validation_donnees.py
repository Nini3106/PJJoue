#!/usr/bin/env python3
"""Validation structurelle et relationnelle des données canoniques de PJJoue."""

from __future__ import annotations

from typing import Any


MODES_QUESTION = {
    "association",
    "choix-unique",
    "classer",
    "eliminer",
    "remettre-ordre",
    "reponse-ecrite",
    "selection-multiple",
}
TYPES_ACTIVITE = {
    "association",
    "choisir-ordre",
    "classer",
    "remettre-ordre",
    "selection-multiple",
}


def est_entier(valeur: object) -> bool:
    """Reconnaît un entier JSON sans accepter les booléens Python."""
    return isinstance(valeur, int) and not isinstance(valeur, bool)


def valider_texte(
    valeur: object,
    emplacement: str,
    erreurs: list[str],
    *,
    vide_autorise: bool = False,
) -> None:
    """Ajoute une erreur lorsqu’un champ textuel est absent ou vide."""
    if not isinstance(valeur, str) or (not vide_autorise and not valeur.strip()):
        erreurs.append(f"{emplacement} doit être un texte{' éventuellement vide' if vide_autorise else ' non vide'}.")


def valider_liste_textes(
    valeur: object,
    emplacement: str,
    erreurs: list[str],
    *,
    vide_autorise: bool = True,
) -> list[str]:
    """Valide une liste de textes et retourne ses valeurs utilisables."""
    if not isinstance(valeur, list):
        erreurs.append(f"{emplacement} doit être une liste.")
        return []
    if not vide_autorise and not valeur:
        erreurs.append(f"{emplacement} ne doit pas être vide.")
    if any(not isinstance(element, str) or not element.strip() for element in valeur):
        erreurs.append(f"{emplacement} doit contenir uniquement des textes non vides.")
    return [element for element in valeur if isinstance(element, str) and element.strip()]


def valider_elements(
    activite: dict[str, Any],
    cle: str,
    contexte: str,
    erreurs: list[str],
) -> set[str]:
    """Valide une collection d’éléments identifiés d’une activité."""
    elements = activite.get(cle)
    emplacement = f"{contexte}.{cle}"
    if not isinstance(elements, list) or not elements:
        erreurs.append(f"{emplacement} doit être une liste non vide.")
        return set()
    identifiants: list[str] = []
    for indice, element in enumerate(elements):
        if not isinstance(element, dict):
            erreurs.append(f"{emplacement}[{indice}] doit être un objet.")
            continue
        identifiant = element.get("id")
        texte = element.get("texte")
        valider_texte(identifiant, f"{emplacement}[{indice}].id", erreurs)
        valider_texte(texte, f"{emplacement}[{indice}].texte", erreurs)
        if isinstance(identifiant, str) and identifiant.strip():
            identifiants.append(identifiant)
    doublons = sorted({identifiant for identifiant in identifiants if identifiants.count(identifiant) > 1})
    if doublons:
        erreurs.append(f"{emplacement} contient des identifiants dupliqués : {doublons}.")
    return set(identifiants)


def valider_activite(question: dict[str, Any], erreurs: list[str]) -> None:
    """Contrôle les identifiants et relations internes d’une activité."""
    activite = question.get("activite")
    if activite is None:
        return
    contexte = f"Q{question.get('id', '?')}.activite"
    if not isinstance(activite, dict):
        erreurs.append(f"{contexte} doit être un objet.")
        return
    type_activite = activite.get("type")
    if type_activite not in TYPES_ACTIVITE:
        erreurs.append(f"{contexte}.type est inconnu : {type_activite!r}.")
        return
    valider_texte(activite.get("libelleAffiche"), f"{contexte}.libelleAffiche", erreurs)
    valider_texte(activite.get("consigne"), f"{contexte}.consigne", erreurs)

    mode = question.get("modePrefere")
    correspondances_autorisees = {
        "choisir-ordre": "remettre-ordre",
    }
    if mode != type_activite and correspondances_autorisees.get(type_activite) != mode:
        erreurs.append(
            f"{contexte}.type {type_activite!r} ne correspond pas au mode {mode!r}."
        )

    if type_activite == "selection-multiple":
        propositions = valider_elements(activite, "propositions", contexte, erreurs)
        reponses = set(valider_liste_textes(
            activite.get("reponses"),
            f"{contexte}.reponses",
            erreurs,
            vide_autorise=False,
        ))
        if not reponses.issubset(propositions):
            erreurs.append(f"{contexte}.reponses référence une proposition inconnue.")
    elif type_activite == "association":
        gauche = valider_elements(activite, "colonneGauche", contexte, erreurs)
        droite = valider_elements(activite, "colonneDroite", contexte, erreurs)
        associations = activite.get("associations")
        if not isinstance(associations, dict):
            erreurs.append(f"{contexte}.associations doit être un objet.")
        else:
            if set(associations) != gauche:
                erreurs.append(f"{contexte}.associations doit référencer chaque élément de gauche une fois.")
            if not set(associations.values()).issubset(droite):
                erreurs.append(f"{contexte}.associations référence un élément de droite inconnu.")
            if len(set(associations.values())) != len(associations.values()):
                erreurs.append(f"{contexte}.associations doit être bijective.")
    elif type_activite in {"remettre-ordre", "choisir-ordre"}:
        elements = valider_elements(activite, "elements", contexte, erreurs)
        ordre_liste = valider_liste_textes(
            activite.get("ordre"),
            f"{contexte}.ordre",
            erreurs,
            vide_autorise=False,
        )
        ordre = set(ordre_liste)
        if len(ordre) != len(ordre_liste):
            erreurs.append(f"{contexte}.ordre contient un identifiant plusieurs fois.")
        if not ordre.issubset(elements):
            erreurs.append(f"{contexte}.ordre référence un élément inconnu.")
        if type_activite == "remettre-ordre" and ordre != elements:
            erreurs.append(f"{contexte}.ordre doit être une permutation de tous les éléments.")
    elif type_activite == "classer":
        categories = valider_elements(activite, "categories", contexte, erreurs)
        elements = valider_elements(activite, "elements", contexte, erreurs)
        classements = activite.get("classements")
        if not isinstance(classements, dict):
            erreurs.append(f"{contexte}.classements doit être un objet.")
        else:
            if set(classements) != elements:
                erreurs.append(f"{contexte}.classements doit référencer chaque élément une fois.")
            if not set(classements.values()).issubset(categories):
                erreurs.append(f"{contexte}.classements référence une catégorie inconnue.")


def valider_donnees(
    programme: object,
    sources: object,
    questions: object,
) -> list[str]:
    """Retourne toutes les anomalies détectées sans interrompre le premier contrôle."""
    erreurs: list[str] = []
    if not isinstance(sources, dict) or not sources:
        erreurs.append("sources.json doit contenir un objet non vide.")
        sources_connues: set[str] = set()
    else:
        sources_connues = set(sources)
        for identifiant, source in sources.items():
            if not isinstance(source, dict):
                erreurs.append(f"Source {identifiant} : la fiche doit être un objet.")
                continue
            for champ in ("titre", "url", "repere", "dateVerification", "statutRelecture", "roleRelecteur"):
                valider_texte(source.get(champ), f"Source {identifiant}.{champ}", erreurs)

    if not isinstance(programme, dict):
        erreurs.append("programme.json doit contenir un objet.")
    else:
        etapes = programme.get("commun", {}).get("etapes") if isinstance(programme.get("commun"), dict) else None
        if not isinstance(etapes, list) or len(etapes) != 10:
            erreurs.append("programme.commun.etapes doit contenir dix étapes.")
        else:
            identifiants_etapes = [etape.get("id") for etape in etapes if isinstance(etape, dict)]
            if identifiants_etapes != list(range(1, 11)):
                erreurs.append("Les étapes du programme doivent être numérotées de 1 à 10 dans l’ordre.")
            for indice, etape in enumerate(etapes, start=1):
                if not isinstance(etape, dict):
                    erreurs.append(f"Étape {indice} : la fiche doit être un objet.")
                    continue
                valider_texte(etape.get("titre"), f"Étape {indice}.titre", erreurs)
                valider_texte(etape.get("couleur"), f"Étape {indice}.couleur", erreurs)
                valider_liste_textes(
                    etape.get("souvenirs"),
                    f"Étape {indice}.souvenirs",
                    erreurs,
                    vide_autorise=False,
                )
                references = valider_liste_textes(etape.get("sources"), f"Étape {indice}.sources", erreurs)
                if not set(references).issubset(sources_connues):
                    erreurs.append(f"Étape {indice}.sources référence une source inconnue.")

    if not isinstance(questions, list) or not questions:
        erreurs.append("questions.json doit contenir une liste non vide.")
        return erreurs

    identifiants: list[int] = []
    for indice, question in enumerate(questions):
        contexte = f"Question à l’index {indice}"
        if not isinstance(question, dict):
            erreurs.append(f"{contexte} doit être un objet.")
            continue
        identifiant = question.get("id")
        if not est_entier(identifiant) or identifiant <= 0:
            erreurs.append(f"{contexte}.id doit être un entier positif.")
        else:
            identifiants.append(identifiant)
            contexte = f"Q{identifiant}"
        if question.get("modePrefere") not in MODES_QUESTION:
            erreurs.append(f"{contexte}.modePrefere est inconnu : {question.get('modePrefere')!r}.")
        for champ in (
            "theme", "enonce", "libelleMode", "explication", "source", "nature",
            "statutContenu", "versionContenu", "derniereVerification", "bonneReponse",
        ):
            valider_texte(question.get(champ), f"{contexte}.{champ}", erreurs)
        valider_texte(question.get("indice"), f"{contexte}.indice", erreurs, vide_autorise=True)
        if not est_entier(question.get("etape")) or not 1 <= question["etape"] <= 11:
            erreurs.append(f"{contexte}.etape doit être un entier de 1 à 11.")
        if not est_entier(question.get("chapitre")) or question["chapitre"] < 1:
            erreurs.append(f"{contexte}.chapitre doit être un entier positif.")
        if not isinstance(question.get("procedureLocale"), bool):
            erreurs.append(f"{contexte}.procedureLocale doit être un booléen.")
        valider_liste_textes(question.get("mauvaisesReponses"), f"{contexte}.mauvaisesReponses", erreurs)
        references = valider_liste_textes(question.get("referencesSources"), f"{contexte}.referencesSources", erreurs)
        if question.get("source") not in sources_connues or not set(references).issubset(sources_connues):
            erreurs.append(f"{contexte} référence une source inconnue.")
        valider_activite(question, erreurs)

    doublons = sorted({identifiant for identifiant in identifiants if identifiants.count(identifiant) > 1})
    if doublons:
        erreurs.append(f"Identifiants de questions dupliqués : {doublons}.")
    return erreurs


def exiger_donnees_valides(programme: object, sources: object, questions: object) -> None:
    """Refuse une génération lorsque les données canoniques sont incohérentes."""
    erreurs = valider_donnees(programme, sources, questions)
    if erreurs:
        details = "\n".join(f"- {erreur}" for erreur in erreurs)
        raise ValueError(f"Données PJJoue invalides :\n{details}")
