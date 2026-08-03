# Commencer ici — guide de reprise

Ce document est le point d'entrée du projet. PJJoue est un site statique : il
fonctionne en ouvrant `index.html` et ne nécessite ni serveur applicatif, ni
base de données, ni étape de compilation pour être diffusé.

Pour reprendre le chantier de nettoyage interrompu, lire d'abord
`documentation/POINT_DE_REPRISE.md`.

## Trouver immédiatement le bon fichier

| Besoin | Fichier à ouvrir | Repère principal |
|---|---|---|
| Modifier un texte ou la structure d'un écran | `index.html` | identifiant français de l'écran : `accueil`, `parcours`, `question`, `bilan`… |
| Modifier le fonctionnement du jeu | `ressources/moteur-jeu.js` | nom français de l'action : `afficherQuestion`, `validerQuestion`, `terminerSession`… |
| Modifier l'apparence du jeu | `ressources/styles/` | commencer par `ressources/styles/README.md` |
| Modifier l'outil d'administration | `administration.html`, puis `ressources/administration.js` et `ressources/administration.css` | `administration` |
| Modifier une question | `donnees/questions.json` | identifiant numérique de la question |
| Modifier une étape ou ses souvenirs | `donnees/programme.json` | numéro de l'étape |
| Modifier une source documentaire | `donnees/sources.json` | identifiant de la source |
| Comprendre l'état, la navigation et les activités | `documentation/ARCHITECTURE.md` | rubrique correspondant au besoin |
| Exécuter ou comprendre les tests | `documentation/RECETTE.md` | contrôle automatique ou recette manuelle |
| Déployer le dossier | `documentation/DEPLOIEMENT.md` | hébergement statique |

## Règles à connaître avant de modifier

1. `donnees/questions.json`, `donnees/programme.json` et
   `donnees/sources.json` sont les sources de vérité.
2. `donnees/donnees-pjj.js` est généré : ne jamais le modifier à la main.
3. Les noms propres au projet sont en français et décrivent le composant visible
   ou l'action déclenchée. Les mots imposés par HTML, CSS et JavaScript restent
   naturellement dans leur syntaxe standard.
4. `index.html` doit continuer à fonctionner en ouverture directe, sans serveur.
5. Une correction CSS ne doit pas être ajoutée machinalement en fin de feuille :
   chercher d'abord la règle existante et vérifier la cascade.
6. Une référence visuelle ne se recrée jamais pour faire disparaître un échec :
   l'écart doit d'abord être compris et accepté.

## Carte rapide du CSS

- `:root` : palette, surfaces, texte, états, dimensions et couleurs d'icônes ;
- `.entete`, `.navigation`, `.menu-mobile-bouton` : navigation générale ;
- `#accueil`, `#jouer`, `#parcours`, `#entrainement`, `#revision`,
  `#progression`, `#parametres`, `#question`, `#bilan` : écrans ;
- `.question-carte`, `.zone-reponses`, `.question-commande-ligne` : structure
  commune d'une question ;
- `.association-*`, `.elimination-*`, `.ordre-*`, `.classement-*` : activités ;
- `.joker-*`, `.correction*`, `.indication*` : aides et résultat ;
- les blocs `@media` restent à leur position : leur ordre participe au rendu.

Le détail du système visuel se trouve dans `documentation/ARCHITECTURE.md`. Le
journal des décisions prises sans changement de rendu se trouve dans
`documentation/JOURNAL_NETTOYAGE_CSS.md`.

## Cycle normal d'une modification

Installer une fois les outils de développement :

```bash
npm ci
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
```

Après une modification des données :

```bash
python outils/construire_donnees.py
```

Après toute modification :

```bash
npm test
```

Après une modification visuelle ou CSS, sur le poste Windows de référence :

```bash
npm run test:visuel
```

Avant de créer une archive :

```bash
python outils/construire_manifeste.py
python tests/verifier_v1.py
```

Le résultat attendu est : ESLint sans erreur, CSS sans doublon ni déclaration
répétée, 6 tests unitaires réussis, contrôle structurel réussi, 42 scénarios
d'interface réussis et 19 captures visuelles identiques.
