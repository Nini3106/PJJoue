# Rapport de relecture humaine finale — PJJoue V1

**Date : 31 août 2026**

## Périmètre

La dernière passe a porté sur les **960 questions** de la banque, avec une conservation maximale du parcours 1 déjà relu auparavant et une relecture renforcée des parcours 2 à 6, en particulier des questions dont le mode de jeu a été transformé lors de l'harmonisation.

Pour chaque question, les éléments suivants ont été contrôlés ensemble :

- stade juridique et place dans la progression ;
- sens principal réellement enseigné ;
- énoncé et naturel de la formulation ;
- mode de jeu et adéquation entre le mode et le raisonnement ;
- bonne réponse et éventuelles variantes acceptées ;
- distracteurs ou éléments interactifs ;
- indice pour les questions d'apprentissage ;
- explication/correction ;
- cohérence avec le thème et l'étape ;
- source et absence de dérive vers une pratique locale.

## Règle de conservation

Le parcours 1 a été traité comme une base stable : aucune réécriture n'a été recherchée pour elle-même. Les modifications y sont limitées aux changements nécessaires à la nouvelle charte (couverture des modes, formulation réellement problématique, cohérence du mode ou garde-fou éditorial).

Pour les parcours 2 à 6, la règle appliquée est : **conserver la question intacte si elle fonctionne ; faire la plus petite modification suffisante ; accepter une transformation plus importante uniquement lorsqu'elle est nécessaire pour préserver le sens pédagogique et juridique.**

## Contrôles de fond appliqués

- Une transformation de mode ne doit jamais changer le savoir central de la question.
- Une association n'est conservée que si la relation est juridiquement exacte, univoque et utile.
- Un classement doit reposer sur de vraies catégories et non sur un vrai/faux déguisé.
- Un ordre doit correspondre à une chronologie, une procédure, une hiérarchie ou un enchaînement logique justifiable.
- Une réponse écrite doit rester courte, prévisible et suffisamment univoque.
- Les distracteurs doivent être plausibles, non caricaturaux, équilibrés et cohérents avec le thème et le stade procédural ; les formulations absolues ne doivent pas servir de faux choix facile.
- Les questions juridiques suivent la progression : **avant jugement → culpabilité → MEE éventuelle → sanction → application/exécution**, avec l'information judiciaire dans l'avant-jugement et l'audience unique comme branche particulière.
- Aucun énoncé ne dépasse 220 caractères.
- Les formulations télégraphiques « Quels/Quelles + nombre » sans « sont » et les références juridiques brutes interdites sont absentes.

## Résultat de la banque

- **960 questions** ;
- **660 questions d'apprentissage + 300 questions d'évaluation** ;
- **66 étapes** ;
- **66/66 étapes avec les 7 modes canoniques** ;
- **199 changements de mode**, soit le minimum nécessaire sans ajout ni suppression de question ;
- identifiants permanents conservés ;
- **960/960 questions : RAS automatique — relecture humaine** après la passe finale ;
- **0 énoncé > 220 caractères** ;
- date de dernière vérification éditoriale harmonisée au **31 août 2026**.

## Vérifications techniques finales

Contrôles exécutés après la relecture :

- données : **960 questions, 73 sources** ;
- construction : **63 fichiers publics exactement à jour** ;
- SEO : **15 pages indexables conformes** ;
- manifeste : régénéré en dernier après la documentation finale ;
- tests Python/pytest : **111/111 réussis** ;
- validation PJJoue : **6 parcours, 66 étapes, 6 évaluations** ;
- navigation libre : conforme ;
- accessibilité statique : **35 pages** ;
- pages annexes Chromium : **19 scénarios bureau/mobile réussis** ;
- interface Chromium : **552 contrôles de réponses réussis** ;
- recette Mission Sigles : réussie ;
- recette visuelle : **44/44 scénarios** validés en lots ciblés (le lancement monolithique dépasse le délai de l'environnement, sans échec d'assertion) ;
- syntaxe JavaScript publique : vérifiée par `node --check`.

Le contrôle ESLint n'a pas pu être exécuté dans cet environnement car l'installation locale de la dépendance `eslint` est incomplète et le téléchargement npm n'aboutit pas dans le délai disponible. Ce point concerne l'environnement de développement ; les scripts JavaScript publics passent le contrôle syntaxique Node et les recettes Chromium.

## Conclusion

Cette passe constitue la **relecture humaine finale avant gel de la V1**. Toute modification ultérieure de la banque doit être considérée comme une nouvelle modification éditoriale et repasser par la charte, les validations de données, la reconstruction et les tests applicables.


## Ultime passe de cohérence sémantique

Après la relecture humaine principale, une dernière vérification a été effectuée sur la version gelée afin de rechercher uniquement des incohérences résiduelles de sens, sans reformuler les questions déjà satisfaisantes.

Les corrections ont été limitées à quelques questions de l’évaluation finale du parcours 1 :

- alignement d’une question sur le RUE avec la réponse réellement attendue ;
- développement effectif de `UEAT` et `STEMO` au lieu d’une réponse répétant le sigle ;
- harmonisation de consignes d’association avec l’activité affichée ;
- correction du nombre annoncé dans une sélection multiple ;
- reformulation minimale d’une question sur le module santé de la MEJ afin que les autres modules restent de vrais distracteurs et non des réponses exactes présentées comme fausses ;
- alignement de quelques énoncés avec le choix ou le raisonnement réellement évalué.

Quatre garde-fous automatiques supplémentaires vérifient désormais le développement réel des sigles, le nombre de réponses attendu en sélection multiple et la synchronisation des champs de compatibilité utilisés par les modes Choix unique et Éliminer. La suite compte désormais **111 tests réussis**.
