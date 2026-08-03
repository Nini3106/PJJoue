# Recette de PJJoue V1

## Contrôles automatiques

### Prérequis

Les contrôles nécessitent Python, Node.js, TypeScript, PostCSS, Playwright et Chromium. Installer les dépendances de développement avant la première exécution :

```bash
npm ci
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
```

Sous Windows, `py` peut remplacer `python` et `python3` dans les commandes ci-dessous.

Depuis la racine du projet :

```bash
npm test
```

La commande exécute successivement ESLint, les contrôles CSS, les tests
unitaires, le contrôle structurel et la recette navigateur. Toutes les étapes
doivent se terminer sans erreur.

Après une modification volontaire d’un fichier recensé, reconstruire le manifeste avant la vérification finale :

```bash
python outils/construire_manifeste.py
npm test
```

Si un contrôle signale une dépendance absente, installer celle qui est indiquée dans le message puis relancer la commande. Une dépendance manquante ne doit pas être interprétée comme une anomalie du code du jeu.

Le contrôle structurel refuse notamment le code JavaScript inutilisé, les
fonctions ou lignes trop longues, les références locales cassées et les
anomalies CSS. Deux contrôles dédiés refusent aussi les règles strictement
dupliquées, les déclarations identiques répétées et les blocs `@media` adjacents
de même condition.

La recette navigateur contrôle l’ouverture réelle avec `file://`, 42 états et interactions, les fils jaunes du mode Relier, les corrections complètes, les réponses écrites, les sauvegardes importées, l’étape 11, le défi chrono et l’administration.

Sur le poste Windows de référence, vérifier en plus les 19 empreintes de pixels :

```bash
npm run test:visuel
```

Ce contrôle utilise la version Chromium inscrite dans la référence locale. Il
ne remplace pas la recette fonctionnelle et la référence ne doit jamais être
recréée uniquement pour masquer un écart.

## Contrôles GitHub

Le workflow `.github/workflows/controle.yml` utilise les versions déclarées par
le projet et lance deux tâches indépendantes : structure/JavaScript/CSS et
interface Chromium. Il s’exécute à chaque `push` et `pull_request` dès que le
dossier appartient à un dépôt GitHub.

## Recette fonctionnelle manuelle

1. Ouvrir l’accueil et vérifier les boutons Accueil, Jouer, Réviser, Progression et Paramètres.
2. Ouvrir le parcours et vérifier les dix étapes ainsi que la carte de l’évaluation finale.
3. Tester les sept formes d’activité : Choix unique, Sélection multiple, Relier / Association, Éliminer, Réponse écrite, Remettre dans l’ordre et Classer.
4. Vérifier les fils jaunes et les associations du mode Relier.
5. Tester les jokers 50/50, indice et langue au chat dans une étape du parcours.
6. Vérifier les textes après une bonne et une mauvaise réponse, explication comprise.
7. Vérifier qu’une question passée apparaît dans le bilan sans révéler la réponse attendue.
8. Terminer une étape avec puis sans joker et vérifier le statut enregistré.
9. Vérifier que l’étape 11 reste verrouillée tant que les dix étapes ne sont pas terminées sans joker.
10. Lancer l’étape 11 et vérifier ses 50 questions, l’absence de joker et l’absence de bouton Passer.
11. Vérifier le titre `Évaluation terminée`, le bouton `Refaire l’évaluation` et le retour au parcours.
12. Tester la révision des erreurs, la progression, les paramètres, l’export et l’import.
13. Tester au clavier les fenêtres, les boutons d’ordre et le retour global.
14. Contrôler le rendu à 390 px, 1024 px et 1440 px de largeur.
15. Sur chaque forme de question, vérifier que la touche Entrée déclenche le bouton `Valider` lorsqu’il est disponible, sans empêcher l’utilisation normale des autres boutons et champs.
16. Sur l’accueil, vérifier que `S’entraîner librement` reçoit un contour doré au survol sans déplacer le bouton.

## Critère d’acceptation

La V1 est acceptable lorsque les contrôles automatiques sont verts, qu’aucune erreur JavaScript n’est remontée et que la comparaison visuelle ne révèle aucun déplacement ou changement inattendu.
