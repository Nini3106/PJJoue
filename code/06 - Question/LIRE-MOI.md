# Question

Cette page contient la carte où l’utilisateur lit une question, répond, utilise éventuellement un joker et consulte la correction.

## Où chercher ?

- `contenu.html` : les éléments visibles de la page Question ;
- `style-de-la-page.css` : le CSS rattaché à cette page ;
- `actions/` : les actions JavaScript rangées par fonction visible.

Dans `actions/`, les fichiers se lisent dans l’ordre de leur numéro :

1. comprendre et valider les réponses écrites ;
2. activités écrites et éliminer des choix ;
3. préparer la session et la correction ;
4. activités interactives ;
5. préparer et afficher la question ;
6. chronomètre de la question ;
7. valider, corriger et naviguer ;
8. jokers de la question.

Le constructeur rassemble ces morceaux **dans cet ordre exact** dans `ressources/moteur-jeu.js`. Il ne faut pas modifier directement le fichier public assemblé.
