# Recette actuelle de PJJoue

## Prérequis

Installer les dépendances de développement :

```bash
npm ci
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
```

La plage Node acceptée est celle de `package.json` : Node 20.19+, Node 22.13+ ou Node 24+ selon les versions supportées par ESLint. npm 10 et 11 sont acceptés.

## Contrôle complet

```bash
npm test
```

Avant les tests, PJJoue vérifie maintenant que les fichiers publics correspondent exactement aux sources :

```bash
python outils/construire_site.py --verifier
```

Cela détecte notamment un fichier public modifié directement au lieu d’être reconstruit.

`npm test` enchaîne :

- contrôle JavaScript avec ESLint ;
- contrôle CSS des doublons stricts ;
- contrôle de la structure CSS ;
- 6 tests unitaires ;
- vérification des 160 questions, 11 étapes et 50 questions finales ;
- recette réelle de l’interface dans Chromium, y compris les réponses écrites et les principaux garde-fous du parcours.

## Vérification visuelle réelle

Créer 14 captures Chromium couvrant ordinateur, portable et mobile :

```bash
npm run test:visuel
```

Les images sont écrites dans `test-results/regression-visuelle/`.

Pendant un nettoyage qui ne doit rien changer visuellement, comparer directement avec la version de référence :

```bash
python tests/verifier_regression_visuelle.py --reference-projet CHEMIN_DE_LA_VERSION_REFERENCE
```

Le test compare alors les pixels des mêmes 14 vues dans le même Chromium. Toute différence fait échouer le contrôle et les deux captures concernées sont conservées pour comparaison.

## CSS

```bash
node outils/controler_css.js doublons
node outils/controler_css.js structure
```

Une condition `@media` ne doit pas être déplacée uniquement pour réduire le nombre de blocs. Si deux blocs identiques ne sont pas adjacents, leur regroupement peut modifier la cascade.

## Construction

Après une modification de `code/` :

```bash
python outils/construire_site.py
```

Le constructeur refuse notamment :

- un repère `{{PAGE_...}}` oublié ;
- un morceau CSS déclaré deux fois avec le même fichier de sortie et le même numéro ;
- un morceau CSS présent mais absent du plan ;
- une source déclarée mais introuvable ;
- deux constructions qui viseraient le même fichier public.

## Avant publication

```bash
python outils/construire_site.py --verifier
python outils/construire_manifeste.py
```

Puis faire un dernier contrôle visuel manuel des écrans principaux, en particulier après toute modification CSS.
