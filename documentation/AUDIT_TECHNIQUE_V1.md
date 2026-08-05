# Audit technique de PJJoue V1

## Objectif

Le nettoyage technique conserve strictement le produit visible : mêmes écrans, mêmes textes, mêmes boutons, mêmes activités, structure actuelle des 160 questions et mêmes règles de progression.

Les changements concernent uniquement la lisibilité, l’organisation et la suppression du code sans effet.

## JavaScript

Les contrôles imposent :

- aucun paramètre ou variable locale inutilisé ;
- aucune fonction de plus de 90 lignes ;
- aucune ligne de plus de 200 caractères ;
- aucun fragment connu sans effet ;
- des fonctions et variables applicatives nommées en français selon leur rôle réel.

Les API du navigateur conservent naturellement leur syntaxe officielle.

## CSS

Les deux feuilles de style sont analysées par PostCSS. Les contrôles refusent :

- les règles ou adaptations d’écran vides ;
- les sélecteurs sans élément correspondant ;
- les variables CSS définies sans usage ;
- les règles strictement dupliquées dans un même contexte de cascade ;
- les déclarations identiques répétées pour le même sélecteur et le même contexte ;
- les propriétés répétées ou immédiatement écrasées dans une même règle ;
- les blocs `@media` adjacents qui portent la même condition ;
- plus de 28 priorités `!important` ;
- les lignes de plus de 200 caractères.

Un même sélecteur peut apparaître dans plusieurs sections lorsqu’il porte des responsabilités distinctes (structure, apparence ou adaptation responsive). Les contrôles refusent en revanche les déclarations identiques, les propriétés immédiatement écrasées et les sélecteurs qui ne correspondent à aucun composant réel.

## Contrôles de comportement

La recette Chromium vérifie notamment :

- 42 états et interactions du jeu ;
- les sept formes d’activité et l’activité « Choisir puis ordonner » ;
- les trois jokers ;
- les fils jaunes du mode Relier ;
- les bonnes et mauvaises réponses sur ordinateur et mobile ;
- 16 textes de correction représentatifs, explication comprise ;
- le verrouillage et le bilan de l’étape 11 ;
- les sauvegardes, l’import, l’export et la réinitialisation ;
- l’administration et ses 160 questions.

Une comparaison locale Windows protège également 19 vues de référence sur
ordinateur, portable et mobile. Elle compare les pixels décodés avec la même
version de Chromium. La recette responsive couvre en complément les largeurs
360, 390, 580, 760, 820, 821, 1024 et 1440 pixels pour le défi chrono, ainsi
qu'un contrôle ciblé à 320 pixels.

## Règle de maintenance

Une modification n’est acceptée que si les contrôles structurels, la recette navigateur et la comparaison visuelle restent verts. Une réduction du nombre de lignes ne constitue jamais, à elle seule, une preuve de qualité.
