# Banque de questions — PJJoue V1

La banque contient exactement **960 questions actives** réparties sur six parcours :

- **PJJoue — Parcours PJJ** (`theme: commun`) : 110 questions d’apprentissage + 50 questions d’évaluation finale ;
- **Procédure ordinaire** (`theme: procedure_ordinaire`) : 110 + 50 ;
- **Information judiciaire** (`theme: information_judiciaire`) : 110 + 50 ;
- **Jugement éducatif ordinaire** (`theme: jugement_educatif_ordinaire`) : 110 + 50 ;
- **Matière criminelle et peines** (`theme: matiere_criminelle_peines`) : 110 + 50 ;
- **Application et exécution des peines** (`theme: application_execution_peines`) : 110 + 50.

Soit **660 questions d’apprentissage**, **300 questions d’évaluation finale**, **66 étapes d’apprentissage** et **6 évaluations finales**.

Le parcours `commun` présente les repères généraux de la PJJ, mais il ne constitue pas un prérequis obligatoire. Les six parcours forment une progression cohérente tout en restant accessibles directement. Les champs `prerequisPedagogiques` et `introduitConcepts` servent au contrôle interne de la progression ; ils ne sont pas utilisés pour laisser entendre au joueur qu’un autre parcours aurait dû être suivi.

Le **28 août 2026**, les **960 questions** ont été relues. Les questions déjà naturelles et pédagogiquement utiles ont été conservées ; seules celles qui présentaient un défaut concret de formulation, de mode, de progression, d’autonomie, de correction ou d’utilité ont été révisées. Le parcours `commun` est contrôlé selon sa propre progression, indépendamment des fiches et du tableau maître. Pour les parcours 2 à 6, une précision absente de ces supports n’est conservée que si elle forme un approfondissement guidé, utile et réutilisé dans le même parcours. Les règles juridiques sensibles ont été recroisées avec les sources officielles indiquées et datées.

Les évaluations finales sont identifiées par `estEvaluationFinale: true`, utilisent `etape: 12`, comportent chacune 50 questions, sont sans joker et sans indice. Dans les six parcours, chaque question d’apprentissage ou d’évaluation utilise son mode éditorial naturel conformément à la charte. La rotation des modes est recherchée au sein des étapes comme des évaluations pour éviter les séries monotones, sans quota qui créerait une difficulté artificielle.

## Source de vérité

- `donnees/questions.json` : questions, activités et métadonnées pédagogiques ;
- `donnees/programme.json` : titres, étapes et identités Analytics ;
- `donnees/sources.json` : références documentaires ;
- `donnees/donnees-pjj.js` : copie générée pour le navigateur.

Après une modification des JSON :

```bash
python outils/construire_donnees.py
python outils/construire_site.py
python outils/construire_manifeste.py
```

## Identifiants permanents

Le champ numérique `id` reste l’identité permanente d’une question. Il ne doit pas être recyclé pour une question différente.

Le champ `ordreEtape` définit l’ordre pédagogique d’affichage. `idAnalyticsPermanent` dans `programme.json` et `etapeAnalyticsPermanent` dans les questions conservent l’identité utilisée pour Analytics.

## Règles éditoriales

- une question teste une connaissance déjà introduite dans la chaîne pédagogique lorsqu’un prérequis est nécessaire ;
- une correction consolide la réponse courante et ne cache pas une notion indispensable pour la suite ;
- les textes visibles restent autonomes : aucune référence explicite à un autre parcours ;
- aucune procédure locale ni contenu propre à un métier administratif n’est intégré aux parcours judiciaires.
