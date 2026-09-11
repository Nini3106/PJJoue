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

La recette Chromium couvre les vues clés de l’application en bureau et mobile :

```bash
npm run test:visuel
```

Les images sont écrites dans `test-results/regression-visuelle-moderne/`. Le contrôle normal reste portable : les assertions DOM, dimensions, débordements, comportement et captures sont bloquants, mais une différence de rasterisation entre versions de Chromium n’est pas traitée comme une régression.

Pour demander volontairement une comparaison pixel par pixel, utiliser un environnement correspondant exactement à `tests/references-visuelles/environnement-reference.json`, puis définir `PJJOUE_COMPARAISON_PIXELS_EXACTE=1` avant de lancer le test. Le script refuse le mode exact si le système ou le Chromium majeur ne correspondent pas.

Après une modification visuelle validée, les références peuvent être régénérées **uniquement sous Linux** :

```bash
python tests/verifier_regression_visuelle.py --actualiser-references
```

Cette commande actualise également `environnement-reference.json`. Ne jamais régénérer les références depuis Windows.

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
