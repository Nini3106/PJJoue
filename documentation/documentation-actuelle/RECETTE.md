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
python outils/construire_seo.py --verifier
```

Cela détecte notamment un fichier public modifié directement au lieu d’être reconstruit.

`npm test` enchaîne :

- contrôle JavaScript avec ESLint ;
- contrôle CSS des doublons stricts ;
- contrôle de la structure CSS ;
- 7 tests unitaires ;
- vérification des **960 questions**, **66 étapes**, **6 parcours** et **300 questions finales** ;
- recette de structure et d’interface, y compris les six parcours, les réponses, les évaluations, les prérequis pédagogiques et les principaux garde-fous ;
- la recette visuelle Chromium reste un contrôle séparé via `npm run test:visuel`.

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

## Garde-fous obligatoires : UTF-8 et manifeste

La recette est invalide si les noms de fichiers/dossiers ne sont pas en UTF-8 correct ou si `MANIFESTE.json` ne correspond pas au dernier état du projet.

Avant le verdict final :

```bash
python outils/verifier_noms_fichiers.py
python outils/construire_manifeste.py --verifier
```

Pour produire une archive de livraison, utiliser `python outils/creer_archive_utf8.py`. Le ZIP doit être relu automatiquement et tous les chemins non ASCII doivent porter le drapeau UTF-8.



## Garde-fou SEO et URL propres

À chaque évolution de la V1, `python outils/construire_seo.py --verifier` doit passer avant publication. Il contrôle les balises SEO des pages indexables, les URL propres de l’application, les relais `noindex,follow` et `sitemap.xml`. Si le SEO/sitemap est reconstruit, `MANIFESTE.json` doit être régénéré ensuite, en dernier.
