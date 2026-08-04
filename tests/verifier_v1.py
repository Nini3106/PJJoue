#!/usr/bin/env python3
"""Contrôles structurels, éditoriaux et techniques de PJJoue V1."""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

RACINE = Path(__file__).resolve().parents[1]
if str(RACINE) not in sys.path:
    sys.path.insert(0, str(RACINE))

from outils.validation_donnees import valider_donnees

DOSSIERS_IGNORES = {
    ".git",
    ".pytest_cache",
    ".venv",
    "__pycache__",
    "node_modules",
    "test-results",
}
FICHIERS_IGNORES = {".DS_Store"}
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
)


def est_ignore_par_controles(chemin: Path) -> bool:
    """Indique si un chemin appartient uniquement à l'environnement local."""
    relatif = chemin.relative_to(RACINE)
    return (
        bool(DOSSIERS_IGNORES.intersection(relatif.parts))
        or chemin.name in FICHIERS_IGNORES
        or chemin.suffix == ".pyc"
    )


class CollecteurReferences(HTMLParser):
    """Collecte les chemins locaux chargés par une page HTML."""

    def __init__(self) -> None:
        super().__init__()
        self.references: list[str] = []

    def handle_starttag(self, balise: str, attributs: list[tuple[str, str | None]]) -> None:
        dictionnaire = dict(attributs)
        for nom in ("src", "href"):
            valeur = dictionnaire.get(nom)
            if not valeur or valeur.startswith(("#", "http://", "https://", "mailto:", "data:")):
                continue
            self.references.append(valeur.split("#", 1)[0].split("?", 1)[0])


def exiger(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def verifier_module_node(nom: str, commande_installation: str) -> None:
    """Vérifie qu’un module Node requis par les contrôles est disponible."""
    resultat = subprocess.run(
        ["node", "-e", f"require.resolve('{nom}')"],
        capture_output=True,
        text=True,
        check=False,
    )
    exiger(
        resultat.returncode == 0,
        f"Le module Node {nom} est requis pour ce contrôle. Installation : {commande_installation}",
    )


def lire_json(chemin: str):
    return json.loads((RACINE / chemin).read_text(encoding="utf-8"))


def lire_styles_interface() -> str:
    """Réunit les feuilles dans leur ordre exact de cascade."""
    return "\n".join(
        (RACINE / chemin).read_text(encoding="utf-8")
        for chemin in FEUILLES_INTERFACE
    )


def verifier_fichiers() -> None:
    obligatoires = [
        ".gitignore",
        ".nojekyll",
        ".github/workflows/controle.yml",
        "index.html",
        "administration.html",
        "favicon.ico",
        "favicon-48x48.png",
        "favicon-96x96.png",
        "favicon-source.png",
        "apple-touch-icon.png",
        "robots.txt",
        "sitemap.xml",
        "ressources/moteur-jeu.js",
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
        "ressources/styles/README.md",
        "ressources/administration.js",
        "ressources/administration.css",
        "ressources/panorama-accueil-calme.png",
        "donnees/questions.json",
        "donnees/programme.json",
        "donnees/sources.json",
        "donnees/donnees-pjj.js",
        "outils/construire_donnees.py",
        "outils/construire_manifeste.py",
        "outils/analyser_doublons_css.js",
        "outils/analyser_structure_css.js",
        "outils/controler_css.js",
        "outils/validation_donnees.py",
        "tests/test_validation_donnees.py",
        "tests/verifier_regression_visuelle.py",
        "tests/references-visuelles/windows-chromium/empreintes.json",
        "documentation/ARCHITECTURE.md",
        "documentation/COMMENCER_ICI.md",
        "documentation/JOURNAL_NETTOYAGE_CSS.md",
        "documentation/RECETTE.md",
        "documentation/ETAT_V1.md",
        "serveur/entetes.conf",
        "eslint.config.js",
        "package.json",
        "package-lock.json",
        "requirements-dev.txt",
    ]
    manquants = [chemin for chemin in obligatoires if not (RACINE / chemin).is_file()]
    exiger(not manquants, f"Fichiers obligatoires manquants : {manquants}")

    emplacements_autorises = {
        '.git', '.github', '.gitignore', '.nojekyll', 'MANIFESTE.json', 'README.md',
        'accessibilite.html', 'administration.html', 'confidentialite.html',
        'decouvrir-la-pjj', 'organisation-pjj', 'metiers-pjj', 'structures-pjj',
        'mesures-educatives-pjj', 'sigles-pjj', 'quiz-pjj',
        'index.html', 'mentions-legales.html', 'ressources', 'donnees', 'documentation',
        'node_modules', 'outils', 'serveur', 'test-results', 'tests', 'eslint.config.js',
        'package.json', 'package-lock.json', 'requirements-dev.txt', 'robots.txt',
        'sitemap.xml', 'favicon.ico', 'favicon-48x48.png', 'favicon-96x96.png',
        'favicon-source.png', 'apple-touch-icon.png',
    }
    emplacements_inattendus = sorted(
        chemin.name
        for chemin in RACINE.iterdir()
        if chemin.name not in emplacements_autorises
        and not est_ignore_par_controles(chemin)
    )
    exiger(not emplacements_inattendus, f"Éléments inattendus à la racine : {emplacements_inattendus}")


def verifier_references_html() -> None:
    for page in RACINE.rglob("*.html"):
        if est_ignore_par_controles(page):
            continue
        collecteur = CollecteurReferences()
        collecteur.feed(page.read_text(encoding="utf-8"))
        manquantes = [
            reference
            for reference in collecteur.references
            if not (page.parent / reference).resolve().exists()
        ]
        exiger(
            not manquantes,
            f"{page.relative_to(RACINE)} contient des références locales manquantes : {manquantes}",
        )


def verifier_referencement() -> None:
    """Vérifie les éléments publics nécessaires à l'exploration du site."""
    page = (RACINE / "index.html").read_text(encoding="utf-8")
    descriptions = re.findall(
        r'<meta\s+[^>]*name=["\']description["\'][^>]*>',
        page,
        re.IGNORECASE,
    )
    exiger(len(descriptions) == 1, "La page d'accueil doit contenir une seule méta-description.")
    exiger(
        "PJJoue est un parcours pédagogique interactif" in descriptions[0],
        "La méta-description de l'accueil est absente ou incorrecte.",
    )

    robots = (RACINE / "robots.txt").read_text(encoding="utf-8")
    exiger("User-agent: *" in robots, "robots.txt ne cible pas les robots d'exploration.")
    exiger("Allow: /" in robots, "robots.txt n'autorise pas l'exploration publique du site.")
    exiger(
        "Sitemap: https://pjjoue.fr/sitemap.xml" in robots,
        "robots.txt ne déclare pas le sitemap public.",
    )

    administration = (RACINE / "administration.html").read_text(encoding="utf-8")
    exiger(
        'name="robots" content="noindex,nofollow"' in administration,
        "La page d'administration doit être exclue de l'indexation.",
    )

    try:
        arbre = ET.parse(RACINE / "sitemap.xml")
    except ET.ParseError as erreur:
        raise AssertionError(f"Le sitemap XML est invalide : {erreur}") from erreur
    espace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [element.text for element in arbre.findall("s:url/s:loc", espace)]
    urls_attendues = [
        "https://pjjoue.fr/",
        "https://pjjoue.fr/decouvrir-la-pjj/",
        "https://pjjoue.fr/organisation-pjj/",
        "https://pjjoue.fr/metiers-pjj/",
        "https://pjjoue.fr/structures-pjj/",
        "https://pjjoue.fr/mesures-educatives-pjj/",
        "https://pjjoue.fr/sigles-pjj/",
        "https://pjjoue.fr/quiz-pjj/",
        "https://pjjoue.fr/mentions-legales.html",
        "https://pjjoue.fr/confidentialite.html",
        "https://pjjoue.fr/accessibilite.html",
    ]
    exiger(urls == urls_attendues, "Le sitemap ne contient pas exactement les pages publiques attendues.")
    exiger(
        "https://pjjoue.fr/administration.html" not in urls,
        "La page d'administration ne doit pas figurer dans le sitemap.",
    )



def verifier_guides_referencement() -> None:
    guides = (
        "decouvrir-la-pjj",
        "organisation-pjj",
        "metiers-pjj",
        "structures-pjj",
        "mesures-educatives-pjj",
        "sigles-pjj",
        "quiz-pjj",
    )
    accueil = (RACINE / "index.html").read_text(encoding="utf-8")
    exiger('rel="canonical"' in accueil, "La page d’accueil doit déclarer son URL canonique.")
    exiger('type="application/ld+json"' in accueil, "Les données structurées WebSite sont absentes de l’accueil.")
    exiger('id="titreGuidesPublics"' in accueil, "Le maillage visible vers les guides est absent de l’accueil.")
    for guide in guides:
        chemin = RACINE / guide / "index.html"
        exiger(chemin.is_file(), f"Le guide public {guide} est absent.")
        contenu = chemin.read_text(encoding="utf-8")
        exiger(contenu.count('name="description"') == 1, f"La méta-description de {guide} est absente ou dupliquée.")
        exiger(f'href="https://pjjoue.fr/{guide}/"' in contenu, f"L’URL canonique de {guide} est incorrecte.")
        exiger('type="application/ld+json"' in contenu, f"Les données structurées de {guide} sont absentes.")
        exiger('<h1>' in contenu and 'Sources officielles' in contenu, f"Le contenu éditorial de {guide} est incomplet.")
        exiger("site personnel, pédagogique, indépendant et non officiel" in contenu, f"L’avertissement d’indépendance est absent de {guide}.")


def verifier_pied_page_et_pages_information() -> None:
    """Vérifie le pied de page public et l'absence de vestiges juridiques."""
    pages = {
        nom: (RACINE / nom).read_text(encoding="utf-8")
        for nom in (
            "index.html",
            "mentions-legales.html",
            "confidentialite.html",
            "accessibilite.html",
        )
    }
    for nom, contenu in pages.items():
        exiger(
            "contact.pjjoue@gmail.com" in contenu,
            f"L'adresse de contact publique est absente de {nom}.",
        )
        exiger(
            "site personnel, pédagogique, indépendant et non officiel" in contenu,
            f"La mention d'indépendance est absente de {nom}.",
        )
        exiger("<footer" in contenu, f"Le pied de page public est absent de {nom}.")

    mentions = pages["mentions-legales.html"]
    exiger(
        mentions.count("Année de création") == 1,
        "L'année de création doit être indiquée une seule fois dans les mentions légales.",
    )
    exiger(
        "GitHub, Inc." in mentions and "88 Colin P. Kelly Jr. Street" in mentions,
        "L'hébergeur GitHub Pages n'est pas correctement identifié.",
    )
    exiger(
        "ni édité, ni financé, ni mandaté, ni agréé, ni validé" in mentions,
        "L'absence de lien institutionnel n'est pas formulée explicitement.",
    )
    vestiges = (
        "[à compléter",
        "[À compléter",
        "organisme acquéreur",
        "organisme déployeur",
        "diffusion institutionnelle",
        "DPO/RSSI",
        "validation métier formelle",
    )
    for nom in ("mentions-legales.html", "confidentialite.html", "accessibilite.html"):
        presents = [fragment for fragment in vestiges if fragment in pages[nom]]
        exiger(not presents, f"Vestiges juridiques dans {nom} : {presents}")


def verifier_securite_et_accessibilite() -> None:
    page = (RACINE / "index.html").read_text(encoding="utf-8")
    exiger(re.search(r'<html\s+lang="fr"', page, re.IGNORECASE) is not None, "La langue française n’est pas déclarée.")
    exiger("Content-Security-Policy" in page, "La politique de sécurité du contenu est absente.")
    exiger("script-src 'self'" in page and "unsafe-eval" not in page, "La politique de scripts est insuffisante.")
    scripts_gtm = 0
    for attributs, contenu in re.findall(r"<script([^>]*)>(.*?)</script>", page, re.DOTALL | re.IGNORECASE):
        est_json_ld = 'type="application/ld+json"' in attributs.lower()
        est_amorcage_gtm = (
            "GTM-M3LD4ZHK" in contenu
            and "www.googletagmanager.com/gtm.js" in contenu
            and "dataLayer" in contenu
        )
        if est_amorcage_gtm:
            scripts_gtm += 1
        exiger(
            "src=" in attributs or not contenu.strip() or est_json_ld or est_amorcage_gtm,
            "Un script exécutable intégré non autorisé dans index.html a été détecté.",
        )
    exiger(scripts_gtm == 1, "Le script Google Tag Manager doit être présent une seule fois sur l’accueil.")
    exiger(
        page.count("GTM-M3LD4ZHK") == 2
        and "Google Tag Manager (noscript)" in page,
        "L’intégration Google Tag Manager de l’accueil est absente ou dupliquée.",
    )
    exiger("sha256-" in page, "Les scripts intégrés autorisés doivent être couverts par la CSP.")
    identifiants = re.findall(r'\bid="([^"]+)"', page)
    dupliques = sorted({identifiant for identifiant in identifiants if identifiants.count(identifiant) > 1})
    exiger(not dupliques, f"Identifiants HTML dupliqués : {dupliques}")
    exiger('id="statutAccessibilite"' in page and 'aria-live="polite"' in page, "La zone d’annonce accessible est absente.")
    exiger('id="zoneCorrection"' in page and 'role="status"' in page, "La correction dynamique n’est pas annoncée.")
    exiger('id="notification"' in page and 'aria-live="polite"' in page, "Les notifications ne sont pas annoncées.")
    position_donnees = page.find('src="donnees/donnees-pjj.js"')
    position_moteur = page.find('src="ressources/moteur-jeu.js"')
    exiger(0 <= position_donnees < position_moteur, "Les données doivent être chargées avant le moteur.")
    exiger(page.count('defer=""') >= 2, "Les scripts principaux doivent attendre l’analyse du DOM.")


def verifier_raccourci_validation() -> None:
    page = (RACINE / "index.html").read_text(encoding="utf-8")
    moteur = (RACINE / "ressources/moteur-jeu.js").read_text(encoding="utf-8")
    feuille = lire_styles_interface()
    exiger(
        "function validerQuestionAvecEntree(evenement)" in moteur
        and "evenement.key !== 'Enter'" in moteur
        and "boutonValider.click()" in moteur,
        "Le raccourci Entrée du bouton Valider est absent ou incomplet.",
    )
    exiger(
        ".accueil-action-principale" in feuille
        and 'id="boutonAccueilPrincipal"' in page,
        "Le bouton principal de l’accueil n’est pas intégré sous la barre d’accent.",
    )


def verifier_nommage_interface() -> None:
    """Vérifie que les principaux éléments visibles et leurs actions portent le même nom métier."""
    page = (RACINE / "index.html").read_text(encoding="utf-8")
    moteur = (RACINE / "ressources/moteur-jeu.js").read_text(encoding="utf-8")
    correspondances = {
        "boutonMenuMobile": "basculerMenuMobile",
        "boutonRetourGlobal": "revenirEnArriere",
        "boutonLancerDeParcours": "lancerDeParcours",
        "boutonJouerTirageDe": "jouerTirageDeParcours",
        "boutonMenuJokers": "ouvrirFenetreJokers",
        "boutonValider": "validerQuestionAvecEntree",
        "boutonOuvrirParcoursProgression": "ouvrirParcours",
        "boutonEnregistrerParametres": "enregistrerParametres",
    }
    for identifiant, action in correspondances.items():
        exiger(f'id="{identifiant}"' in page, f"Élément visible mal nommé ou absent : {identifiant}.")
        exiger(re.search(rf"\b{re.escape(action)}\b", moteur) is not None, f"Action métier mal nommée ou absente : {action}.")
    exiger(page.count('id="sonActif"') == 1, "Le réglage du son doit exister une seule fois dans Paramètres.")
    exiger(
        all(f'data-ecran="{ecran}"' in page for ecran in ("parcours", "carnet", "entrainement")),
        "Les destinations principales du menu sont incomplètes.",
    )
    exiger(
        all(page.count(f'id="{ecran}"') == 1 for ecran in ("parcours", "carnet", "entrainement")),
        "Les écrans Parcours, Carnet et Entraînement doivent être uniques.",
    )


def verifier_javascript() -> None:
    verifier_module_node("typescript", "npm install --save-dev typescript")
    for chemin in ("ressources/moteur-jeu.js", "ressources/administration.js", "donnees/donnees-pjj.js"):
        resultat = subprocess.run(
            ["node", "--check", str(RACINE / chemin)],
            capture_output=True,
            text=True,
            check=False,
        )
        exiger(resultat.returncode == 0, f"Syntaxe JavaScript invalide dans {chemin} : {resultat.stderr}")

    controle_identifiants = r"""
const fs=require('fs');
const path=require('path');
let ts;
try {
  ts=require('typescript');
} catch {
  const racineVersions='/opt/nvm/versions/node';
  const dossiers=fs.existsSync(racineVersions) ? fs.readdirSync(racineVersions) : [];
  for (const dossier of dossiers.reverse()) {
    try {
      ts=require(path.join(racineVersions,dossier,'lib/node_modules/typescript'));
      break;
    } catch {}
  }
}
if(!ts){console.error('TypeScript est introuvable.');process.exit(1);}
let anomalies=[];
for(const fichier of process.argv.slice(1)){
  const texte=fs.readFileSync(fichier,'utf8');
  const source=ts.createSourceFile(fichier,texte,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  function estNomDePropriete(noeud){
    const parent=noeud.parent;
    return (ts.isPropertyAccessExpression(parent)&&parent.name===noeud)
      || (ts.isPropertyAssignment(parent)&&parent.name===noeud)
      || (ts.isMethodDeclaration(parent)&&parent.name===noeud);
  }
  function visiter(noeud){
    if(ts.isIdentifier(noeud)&&noeud.text.length===1&&!estNomDePropriete(noeud)){
      const ligne=source.getLineAndCharacterOfPosition(noeud.getStart()).line+1;
      anomalies.push(`${fichier}:${ligne}:${noeud.text}`);
    }
    ts.forEachChild(noeud,visiter);
  }
  visiter(source);
}
if(anomalies.length){console.error(anomalies.join('\n'));process.exit(1);}
"""
    resultat = subprocess.run(
        ["node", "-e", controle_identifiants, str(RACINE / "ressources/moteur-jeu.js"), str(RACINE / "ressources/administration.js")],
        capture_output=True,
        text=True,
        check=False,
    )
    exiger(resultat.returncode == 0, f"Identifiants d’une lettre détectés :\n{resultat.stderr}")

    controle_elements_inutilises = r"""
const fs=require('fs');
const path=require('path');
let ts;
try {
  ts=require('typescript');
} catch {
  const racineVersions='/opt/nvm/versions/node';
  const dossiers=fs.existsSync(racineVersions) ? fs.readdirSync(racineVersions) : [];
  for (const dossier of dossiers.reverse()) {
    try {
      ts=require(path.join(racineVersions,dossier,'lib/node_modules/typescript'));
      break;
    } catch {}
  }
}
if(!ts){console.error('TypeScript est introuvable.');process.exit(1);}
const fichiers=process.argv.slice(1);
const programme=ts.createProgram(fichiers,{
  allowJs:true,
  checkJs:true,
  noEmit:true,
  noUnusedLocals:true,
  noUnusedParameters:true,
  target:ts.ScriptTarget.ES2022,
  module:ts.ModuleKind.None,
  skipLibCheck:true
});
const codesInutiles=new Set([6133,6196,6198]);
const anomalies=ts.getPreEmitDiagnostics(programme).filter(diagnostic=>codesInutiles.has(diagnostic.code));
if(anomalies.length){
  console.error(anomalies.map(diagnostic=>{
    const position=diagnostic.file&&diagnostic.start!==undefined
      ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
      : null;
    const emplacement=diagnostic.file
      ? `${diagnostic.file.fileName}:${position ? position.line+1 : 0}`
      : 'JavaScript';
    return `${emplacement} — ${ts.flattenDiagnosticMessageText(diagnostic.messageText,' ')}`;
  }).join('\n'));
  process.exit(1);
}
"""
    resultat = subprocess.run(
        [
            "node",
            "-e",
            controle_elements_inutilises,
            str(RACINE / "ressources/moteur-jeu.js"),
            str(RACINE / "ressources/administration.js"),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    exiger(resultat.returncode == 0, f"Code JavaScript inutilisé détecté :\n{resultat.stderr}")

    for chemin in ("ressources/moteur-jeu.js", "ressources/administration.js"):
        lignes = (RACINE / chemin).read_text(encoding="utf-8").splitlines()
        lignes_trop_longues = [
            numero for numero, ligne in enumerate(lignes, start=1) if len(ligne) > 200
        ]
        exiger(
            not lignes_trop_longues,
            f"Lignes JavaScript de plus de 200 caractères dans {chemin} : {lignes_trop_longues}",
        )

    moteur = (RACINE / "ressources/moteur-jeu.js").read_text(encoding="utf-8")
    fragments_interdits = [
        fragment for fragment in (
            "corps += '';",
            "classList.add('correcte')",
            "classList.add('incorrecte')",
            "classList.add('aidee')",
        )
        if fragment in moteur
    ]
    exiger(not fragments_interdits, f"Fragments JavaScript sans effet détectés : {fragments_interdits}")

    controle_taille_fonctions = r"""
const fs=require('fs');
const path=require('path');
let ts;
try {
  ts=require('typescript');
} catch {
  const racineVersions='/opt/nvm/versions/node';
  const dossiers=fs.existsSync(racineVersions) ? fs.readdirSync(racineVersions) : [];
  for (const dossier of dossiers.reverse()) {
    try {
      ts=require(path.join(racineVersions,dossier,'lib/node_modules/typescript'));
      break;
    } catch {}
  }
}
if(!ts){console.error('TypeScript est introuvable.');process.exit(1);}
const anomalies=[];
for(const fichier of process.argv.slice(1)){
  const texte=fs.readFileSync(fichier,'utf8');
  const source=ts.createSourceFile(fichier,texte,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  function visiter(noeud){
    if(
      ts.isFunctionDeclaration(noeud)
      || ts.isFunctionExpression(noeud)
      || ts.isArrowFunction(noeud)
      || ts.isMethodDeclaration(noeud)
    ){
      const debut=source.getLineAndCharacterOfPosition(noeud.getStart()).line+1;
      const fin=source.getLineAndCharacterOfPosition(noeud.end).line+1;
      const longueur=fin-debut+1;
      if(longueur>90){
        const nom=noeud.name?.text||'<anonyme>';
        anomalies.push(`${fichier}:${debut}-${fin}:${nom}:${longueur} lignes`);
      }
    }
    ts.forEachChild(noeud,visiter);
  }
  visiter(source);
}
if(anomalies.length){console.error(anomalies.join('\n'));process.exit(1);}
"""
    resultat = subprocess.run(
        [
            "node",
            "-e",
            controle_taille_fonctions,
            str(RACINE / "ressources/moteur-jeu.js"),
            str(RACINE / "ressources/administration.js"),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    exiger(resultat.returncode == 0, f"Fonction JavaScript trop chargée :\n{resultat.stderr}")


def verifier_donnees() -> None:
    questions = lire_json("donnees/questions.json")
    programme = lire_json("donnees/programme.json")
    sources = lire_json("donnees/sources.json")

    erreurs_structurelles = valider_donnees(programme, sources, questions)
    exiger(
        not erreurs_structurelles,
        "Données canoniques invalides :\n- " + "\n- ".join(erreurs_structurelles),
    )

    exiger(len(questions) == 150, f"La banque contient {len(questions)} questions au lieu de 150.")
    exiger([question["id"] for question in questions] == list(range(1, 151)), "Les identifiants Q1 à Q150 ne sont pas continus.")

    # Cette empreinte verrouille l’ordre officiel des 150 énoncés de la V1.
    ordre_officiel = [[question["id"], question["enonce"]] for question in questions]
    empreinte_ordre = hashlib.sha256(
        json.dumps(ordre_officiel, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    exiger(
        empreinte_ordre == "15c31d3be8b3122d8330b7dae35b578b66c5fa1da543219afa4dbc1f6f0ca1d5",
        "L’ordre ou l’énoncé d’une question diffère de la banque officielle V1.",
    )

    parcours = [question for question in questions if not question.get("estEvaluationFinale")]
    evaluation = [question for question in questions if question.get("estEvaluationFinale")]
    exiger(len(parcours) == 100, f"Le parcours contient {len(parcours)} questions au lieu de 100.")
    exiger(len(evaluation) == 50, f"L’évaluation contient {len(evaluation)} questions au lieu de 50.")
    exiger([question["id"] for question in evaluation] == list(range(101, 151)), "L’évaluation finale doit utiliser Q101 à Q150.")

    for etape in range(1, 11):
        questions_etape = [question for question in parcours if int(question["etape"]) == etape]
        exiger(len(questions_etape) == 10, f"L’étape {etape} contient {len(questions_etape)} questions au lieu de 10.")

    exiger(all(question.get("versionContenu") == "V1" for question in questions), "Toutes les questions doivent porter versionContenu = V1.")
    etapes_programme = programme.get("commun", {}).get("etapes", [])
    exiger(len(etapes_programme) == 10, "Le programme doit contenir dix étapes.")
    exiger(
        all(len(etape.get("souvenirs", [])) == 3 for etape in etapes_programme),
        "Chaque étape doit proposer trois souvenirs pédagogiques.",
    )
    exiger(
        all(len(str(etape.get("couleur", ""))) == 7 and str(etape["couleur"]).startswith("#") for etape in etapes_programme),
        "Chaque étape doit posséder une couleur hexadécimale.",
    )
    exiger(bool(sources), "La liste des sources est vide.")
    exiger(all(str(question.get("enonce", "")).strip() for question in questions), "Un énoncé est vide.")
    exiger(all(str(question.get("bonneReponse", "")).strip() for question in questions), "Une bonne réponse est vide.")
    exiger(all(str(question.get("explication", "")).strip() for question in questions), "Une explication est vide.")
    exiger(all(str(question.get("indice", "")).strip() for question in parcours), "Chaque question du parcours doit avoir un indice.")
    exiger(all(not str(question.get("indice", "")).strip() for question in evaluation), "L’évaluation finale ne doit proposer aucun indice.")
    exiger(len({question["indice"] for question in parcours}) == 100, "Les 100 indices du parcours doivent être distincts.")
    exiger(len({question["enonce"].strip() for question in questions}) == 150, "Deux questions possèdent le même énoncé.")
    references_absentes = sorted({
        reference
        for question in questions
        for reference in question.get("referencesSources", [])
        if reference not in sources
    })
    exiger(not references_absentes, f"Références de sources absentes : {references_absentes}")
    choix_incomplets = [
        question["id"] for question in questions
        if question.get("modePrefere") == "choix-unique"
        and len(question.get("mauvaisesReponses", [])) < 3
    ]
    exiger(not choix_incomplets, f"Questions à choix unique incomplètes : {choix_incomplets}")

    themes = [{
        "id": "commun",
        "icone": "",
        "titre": "Parcours PJJ",
        "sousTitre": "Découvre la PJJ à travers 10 étapes progressives",
        "categorie": "socle",
    }]
    lignes = [
        "/* Fichier généré depuis donnees/*.json. Ne pas modifier directement. */",
        "window.DONNEES_PJJ=window.DONNEES_PJJ||{};",
    ]
    for nom, contenu in (("THEMES", themes), ("PROGRAMMES", programme), ("SOURCES", sources), ("QUESTIONS", questions)):
        lignes.append(f"window.DONNEES_PJJ.{nom}=" + json.dumps(contenu, ensure_ascii=False, separators=(",", ":")) + ";")
    attendu = "\n".join(lignes) + "\n"
    genere = (RACINE / "donnees/donnees-pjj.js").read_text(encoding="utf-8")
    exiger(genere == attendu, "donnees/donnees-pjj.js ne correspond pas aux trois fichiers JSON canoniques.")


def verifier_regles_etape_11() -> None:
    moteur = (RACINE / "ressources/moteur-jeu.js").read_text(encoding="utf-8")
    page = (RACINE / "index.html").read_text(encoding="utf-8")

    exiger("titre: 'Évaluation terminée'" in moteur, "Le titre final simplifié de la V1 est absent.")
    exiger("textContent = 'Refaire l’évaluation'" in moteur, "Le bouton pour refaire l’évaluation est absent.")
    exiger("id=\"boutonRetourParcoursBilan\"" in page and "Revenir au parcours" in page, "Le retour au parcours est absent du bilan.")
    garde_nombre = re.search(r"session\.length\s*!==\s*50", moteur)
    garde_identifiants = re.search(
        r"question\.id\s*>=\s*101\s*&&\s*question\.id\s*<=\s*150",
        moteur,
    )
    exiger(garde_nombre and garde_identifiants, "La garde des 50 questions finales est absente.")
    exiger("programme.etapes.every" in moteur and "termineeSansJoker === true" in moteur, "La règle de déverrouillage des dix étapes sans joker est absente.")
    exiger("Les questions passées sont listées sans dévoiler leur réponse" in moteur, "La règle de confidentialité des questions passées est absente.")
    exiger("Réponse non dévoilée" in moteur, "Le bilan d’une question passée doit masquer la réponse.")
    exiger("Version 1 · Août 2026" in page, "L’identification visible de la V1 officielle a été modifiée.")
    exiger("function effacerSauvegardeV1DuNavigateur()" in moteur, "La suppression de la sauvegarde V1 est absente.")
    exiger(moteur.count("effacerSauvegardeV1DuNavigateur();") >= 2, "L’import et la réinitialisation doivent remplacer la sauvegarde V1.")


def verifier_vocabulaire_et_version() -> None:
    extensions = {".html", ".js", ".css", ".json", ".md", ".py", ".csv", ".conf"}
    fichiers = [
        chemin
        for chemin in RACINE.rglob("*")
        if chemin.is_file()
        and not est_ignore_par_controles(chemin)
        and chemin.suffix.lower() in extensions
    ]
    texte_total = "\n".join(chemin.read_text(encoding="utf-8", errors="strict") for chemin in fichiers)

    versions = re.findall(r"\bV(\d+(?:[._-]\d+)*)\b", texte_total)
    autres_versions = sorted({version for version in versions if version != "1"})
    exiger(not autres_versions, f"Références à d’autres versions détectées : {autres_versions}")




def verifier_css() -> None:
    verifier_module_node("postcss", "npm install --save-dev postcss")
    controle = r"""
const fs=require('fs');
const postcss=require('postcss');
const chemins=process.argv[1].split('|');
const corpus=process.argv.slice(2).map(f=>fs.readFileSync(f,'utf8')).join('\n');
const texteCss=chemins.map(chemin=>fs.readFileSync(chemin,'utf8')).join('\n');
const racine=postcss.parse(texteCss);
let vides=[],orphelins=[],declarationsRepetees=[],proprietesEcrasees=[];
const variablesDefinies=new Set();
const variablesUtilisees=new Set();
const emplacementsSelecteurs=new Map();
function contexteRegle(regle){
  const contextes=[];
  let parent=regle.parent;
  while(parent&&parent.type!=='root'){
    if(parent.type==='atrule')contextes.unshift(`@${parent.name} ${parent.params}`.trim());
    parent=parent.parent;
  }
  return contextes.join('|')||'global';
}
racine.walkRules(regle=>{
  const contexte=contexteRegle(regle);
  for(const selecteur of regle.selectors){
    const signature=`${contexte}::${selecteur.trim()}`;
    if(!emplacementsSelecteurs.has(signature))emplacementsSelecteurs.set(signature,[]);
    emplacementsSelecteurs.get(signature).push(regle.source.start.line);
  }
  const declarations=[];regle.walkDecls(d=>declarations.push(d));
  if(!declarations.length)vides.push(`${regle.source.start.line}:${regle.selector}`);
  const signatures=new Set();
  const proprietes=new Set();
  for(const declaration of declarations){
    const signature=`${declaration.prop}:${declaration.value}:${declaration.important}`;
    if(signatures.has(signature)){
      declarationsRepetees.push(`${declaration.source.start.line}:${regle.selector}:${declaration.prop}`);
    }
    signatures.add(signature);
    const propriete=`${declaration.prop}:${declaration.important}`;
    if(proprietes.has(propriete)){
      proprietesEcrasees.push(`${declaration.source.start.line}:${regle.selector}:${declaration.prop}`);
    }
    proprietes.add(propriete);
  }
  const jetons=[...regle.selector.matchAll(/([.#])([_a-zA-Z][\w-]*)/g)].map(c=>c[2]);
  const absents=[...new Set(jetons.filter(jeton=>!corpus.includes(jeton)))];
  if(absents.length)orphelins.push(`${regle.source.start.line}:${regle.selector}:${absents.join(',')}`);
});
racine.walkDecls(declaration=>{
  if(declaration.prop.startsWith('--'))variablesDefinies.add(declaration.prop);
  for(const correspondance of declaration.value.matchAll(/var\((--[\w-]+)/g)){
    variablesUtilisees.add(correspondance[1]);
  }
});
racine.walkAtRules(regle=>{
  if(!regle.nodes||!regle.nodes.some(n=>n.type!=='comment'))vides.push(`${regle.source.start.line}:@${regle.name}`);
});
const variablesInutilisees=[...variablesDefinies].filter(variable=>!variablesUtilisees.has(variable)).sort();
const nombrePriorites=(texteCss.match(/!important\b/g)||[]).length;
const conventionsInterdites=[
  '.reponse.bon',
  '.reponse.mauvais'
].filter(fragment=>texteCss.includes(fragment));
if(
  vides.length
  || orphelins.length
  || variablesInutilisees.length
  || declarationsRepetees.length
  || proprietesEcrasees.length
  || conventionsInterdites.length
  || nombrePriorites>28
){
  console.error(JSON.stringify({
    vides,orphelins,variablesInutilisees,declarationsRepetees,proprietesEcrasees,
    conventionsInterdites,
    nombrePriorites,maxPrioritesAutorisees:28
  },null,2));
  process.exit(1);
}
"""
    fichiers_corpus = [
        RACINE / "index.html",
        RACINE / "administration.html",
        RACINE / "mentions-legales.html",
        RACINE / "confidentialite.html",
        RACINE / "accessibilite.html",
        *(RACINE / guide / "index.html" for guide in (
            "decouvrir-la-pjj", "organisation-pjj", "metiers-pjj",
            "structures-pjj", "mesures-educatives-pjj", "sigles-pjj", "quiz-pjj",
        )),
        RACINE / "ressources/moteur-jeu.js",
        RACINE / "ressources/administration.js",
        RACINE / "donnees/donnees-pjj.js",
    ]
    groupes_feuilles = (
        FEUILLES_INTERFACE,
        ("ressources/administration.css",),
    )
    for feuilles_style in groupes_feuilles:
        description_feuilles = ", ".join(feuilles_style)
        lignes_trop_longues = []
        for feuille_style in feuilles_style:
            chemin_feuille = RACINE / feuille_style
            lignes_trop_longues.extend(
                f"{feuille_style}:{numero}"
                for numero, ligne in enumerate(
                    chemin_feuille.read_text(encoding="utf-8").splitlines(),
                    start=1,
                )
                if len(ligne) > 200
            )
        exiger(
            not lignes_trop_longues,
            f"Lignes CSS de plus de 200 caractères : {lignes_trop_longues}",
        )
        argument_feuilles = "|".join(
            str(RACINE / feuille_style) for feuille_style in feuilles_style
        )
        resultat = subprocess.run(
            ["node", "-e", controle, argument_feuilles, *map(str, fichiers_corpus)],
            capture_output=True,
            text=True,
            check=False,
        )
        exiger(
            resultat.returncode == 0,
            f"Anomalies CSS dans {description_feuilles} :\n{resultat.stderr}",
        )


def verifier_manifeste() -> None:
    chemin_manifeste = RACINE / "MANIFESTE.json"
    exiger(chemin_manifeste.is_file(), "Le manifeste d’intégrité est absent.")
    manifeste = json.loads(chemin_manifeste.read_text(encoding="utf-8"))
    exiger(manifeste.get("produit") == "PJJoue", "Le produit indiqué dans le manifeste est incorrect.")
    exiger(manifeste.get("version") == "V1", "Le manifeste doit décrire uniquement la V1.")

    fichiers_attendus = {}
    for chemin in sorted(RACINE.rglob("*")):
        relatif = chemin.relative_to(RACINE)
        if (
            not chemin.is_file()
            or est_ignore_par_controles(chemin)
            or relatif.as_posix() == "MANIFESTE.json"
        ):
            continue
        contenu = chemin.read_bytes()
        fichiers_attendus[relatif.as_posix()] = {
            "tailleOctets": len(contenu),
            "sha256": hashlib.sha256(contenu).hexdigest(),
        }

    fichiers_declares = manifeste.get("fichiers")
    exiger(isinstance(fichiers_declares, dict), "La liste des fichiers du manifeste est mal structurée.")
    manquants = sorted(set(fichiers_attendus) - set(fichiers_declares))
    superflus = sorted(set(fichiers_declares) - set(fichiers_attendus))
    exiger(not manquants, f"Fichiers absents du manifeste : {manquants}")
    exiger(not superflus, f"Fichiers obsolètes dans le manifeste : {superflus}")
    incoherents = [
        chemin for chemin, description in fichiers_attendus.items()
        if fichiers_declares.get(chemin) != description
    ]
    exiger(not incoherents, f"Empreintes ou tailles obsolètes dans le manifeste : {incoherents}")

    questions = lire_json("donnees/questions.json")
    composition_attendue = {
        "questionsTotales": len(questions),
        "questionsParcours": len([question for question in questions if not question.get("estEvaluationFinale")]),
        "etapesParcours": len({question["etape"] for question in questions if not question.get("estEvaluationFinale")}),
        "questionsEvaluationFinale": len([question for question in questions if question.get("estEvaluationFinale")]),
    }
    exiger(manifeste.get("composition") == composition_attendue, "La composition indiquée dans le manifeste est obsolète.")

def afficher_bilan() -> None:
    fichiers = [
        chemin
        for chemin in RACINE.rglob("*")
        if chemin.is_file() and not est_ignore_par_controles(chemin)
    ]
    empreinte = hashlib.sha256()
    for chemin in sorted(fichiers):
        empreinte.update(chemin.relative_to(RACINE).as_posix().encode("utf-8"))
        empreinte.update(chemin.read_bytes())
    print("OK — PJJoue V1 : contrôles structurels réussis")
    print("150 questions · 10 étapes · 50 questions finales")
    print(f"Empreinte de contrôle du projet : {empreinte.hexdigest()[:16]}")


def principal() -> int:
    controles = [
        verifier_fichiers,
        verifier_references_html,
        verifier_referencement,
        verifier_guides_referencement,
        verifier_pied_page_et_pages_information,
        verifier_securite_et_accessibilite,
        verifier_raccourci_validation,
        verifier_nommage_interface,
        verifier_javascript,
        verifier_donnees,
        verifier_regles_etape_11,
        verifier_vocabulaire_et_version,
        verifier_css,
        verifier_manifeste,
    ]
    try:
        for controle in controles:
            controle()
        afficher_bilan()
        return 0
    except (AssertionError, json.JSONDecodeError, OSError) as erreur:
        print(f"ÉCHEC — {erreur}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(principal())
