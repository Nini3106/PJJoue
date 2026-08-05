# Banque de questions PJJoue V1

La banque contient exactement 160 questions :

- Q1 à Q110 : parcours pédagogique ;
- Q111 à Q160 : évaluation finale.

Chaque étape du parcours contient 10 questions : étape 1 pour Q1–Q10, étape 2 pour Q11–Q20, jusqu’à l’étape 10 pour Q91–Q100.

L’étape 12 utilise les 50 questions finales et ne propose aucun joker.

## Source de vérité

- `donnees/questions.json` : questions et activités ;
- `donnees/programme.json` : titres et objectifs des étapes ;
- `donnees/sources.json` : références documentaires ;
- `donnees/donnees-pjj.js` : copie générée pour le navigateur.

Après une modification des JSON, exécuter `python3 outils/construire_donnees.py` puis les contrôles automatiques.
