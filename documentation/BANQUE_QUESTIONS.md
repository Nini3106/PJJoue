# Banque de questions PJJoue V1

La banque contient exactement 160 questions actives :

- 110 questions dans les 11 étapes du parcours ;
- 50 questions en évaluation finale, toutes en réponse écrite.

Les identifiants sont permanents et ne sont volontairement plus continus. Les IDs Q043, Q101 à Q110, Q145, Q154, Q155 et Q157 à Q160 sont retirés et ne seront jamais recyclés. Les nouvelles questions utilisent Q161 à Q178.

L’étape 8 visible est désormais « Les activités éducatives » (Q161 à Q170). La nouvelle question 2 de l’étape 5 utilise Q171. Les nouvelles questions de l’évaluation utilisent Q172 à Q178.

L’évaluation finale est identifiée par `estEvaluationFinale: true`, et non plus par une plage numérique d’IDs. Elle ne propose aucun joker.

## Source de vérité

- `donnees/questions.json` : questions et activités ;
- `donnees/programme.json` : titres et objectifs des étapes ;
- `donnees/sources.json` : références documentaires ;
- `donnees/donnees-pjj.js` : copie générée pour le navigateur.

Après une modification des JSON, exécuter `python3 outils/construire_donnees.py` puis les contrôles automatiques.


## Ordre pédagogique et identifiant permanent

Le champ numérique `id` reste l’identité permanente de la question, notamment pour Analytics. Il ne doit pas être renuméroté lorsqu’une question garde la même compétence mais doit être déplacée dans son étape.

Le champ optionnel `ordreEtape` permet de modifier uniquement l’ordre d’affichage pédagogique. Le moteur trie d’abord les questions d’une étape par `ordreEtape`, puis par `id` en cas d’égalité ou d’absence de valeur. Ainsi, une question peut être présentée avant une autre sans casser son identifiant `Qxxx` ni l’historique Analytics.

Après une modification d’ordre, vérifier à la fois :

- l’ordre réellement affiché au joueur ;
- la continuité des identifiants permanents ;
- l’absence de notion évaluée avant son introduction.

## Identité permanente des étapes

Le numéro visible d’une étape et son identité Analytics sont désormais séparés. `id` correspond à la position visible dans le parcours ; `idAnalyticsPermanent` dans `programme.json` et `etapeAnalyticsPermanent` dans les questions conservent l’identité historique utilisée pour Analytics. Ainsi, les anciennes étapes 8, 9 et 10 peuvent apparaître en positions 9, 10 et 11 sans falsifier l’historique. La nouvelle étape « Les activités éducatives » reçoit une identité Analytics permanente nouvelle.
