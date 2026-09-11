# Mission Sigles — mini‑PJJoue V1

Cette page est le mini‑jeu consacré aux 72 sigles de PJJoue.

## Règles pédagogiques

- `donnees/sigles.json` est l’unique source des sigles.
- Un sigle n’est jamais demandé seul avant d’avoir été introduit dans une activité précédente avec son développement complet.
- Chacun des 72 sigles possède une question d’introduction contextuelle rédigée explicitement dans `donnees/sigles.json` (`questionIntroduction`) : aucune consigne générique sans sujet n’est autorisée.
- Les trois distracteurs de chaque introduction sont eux aussi rédigés explicitement (`distracteursIntroduction`) afin d’éviter les formulations automatiques artificielles ou grammaticalement incorrectes.
- Il n’existe aucun écran qui affiche les développements avant de jouer : l’introduction fait partie du parcours de questions.
- Les distracteurs n’emploient jamais un sigle encore inconnu.
- Le parcours comporte 6 étapes de 12 sigles, repérées par les six couleurs des parcours PJJoue.
- Chaque étape construit la chaîne : introduction en situation → reconnaissance → rappel → réutilisation.
- La maîtrise autonome exige une bonne réponse sans joker avant toute erreur sur l’activité de rappel.
- La célébration d’étape se déclenche quand les 12 sigles ont finalement été validés sans joker, même après une nouvelle tentative ou lors d’une session ultérieure.
- L’entraînement permet de choisir le périmètre, 10 / 20 / 30 / Tous, l’ordre par étapes ou mélangé, le chrono et les jokers.
- Le Défi du hasard reprend le dé de PJJoue : tirage de 1 à 6 questions, puis bouton de lancement ; les jokers y sont autorisés.
- « Réviser mes erreurs » rejoue uniquement les sigles encore à consolider.
- L’évaluation finale comporte 30 activités, sans joker ni passage, et se réussit à 90 %.
- Les réussites d’étape et d’évaluation déclenchent les confettis et les sons de célébration de PJJoue.

## Fichiers

- `contenu.html` : interface visible.
- `actions-de-la-page.js` : moteur du mini‑jeu.
- `style-jeu-des-sigles.css` : styles propres à Mission Sigles.

- « Réviser mes erreurs » réutilise désormais la page Réviser native de PJJoue (même structure, mêmes cartes et mêmes boutons), avec un contenu limité aux erreurs de Mission Sigles.
