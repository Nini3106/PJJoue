# COMMENCER ICI — reprendre PJJoue sans se perdre

Si tu découvres PJJoue, commence par **`code/00 - LIRE EN PREMIER/`**.

Le document obligatoire est :

**`code/00 - LIRE EN PREMIER/REGLES_OBLIGATOIRES_ORGANISATION_ET_NOMMAGE.md`**

Il fixe la règle centrale : **ce que l’on voit dans PJJoue doit porter le même nom dans le code.**

## Je veux modifier quelque chose de visible

Ouvre le dossier qui porte le nom de la page :

- `code/02 - Accueil/`
- `code/03 - Parcours PJJ/`
- `code/04 - Carnet de parcours/`
- `code/05 - Entraînement libre/`
- `code/06 - Question/`
- `code/07 - Bilan de la session/`
- `code/08 - Réviser/`
- `code/09 - Progression/`
- `code/10 - Paramètres/`
- `code/11 - Guides pour découvrir la PJJ/`
- `code/12 - Informations légales/`
- `code/13 - Administration/`

Ce qui sert à plusieurs pages est rangé dans **`code/01 - Éléments communs/`**.

La page **Question** a volontairement un sous-dossier `actions/` : ses actions JavaScript sont séparées par rôle pour éviter un fichier géant.

## Je veux retrouver un bouton, une icône ou une action

- `code/00 - LIRE EN PREMIER/INDEX_VISUEL_VERS_CODE.md`
- `code/00 - LIRE EN PREMIER/CARTE_DES_ACTIONS_JAVASCRIPT.md`

## Après une modification dans `code/`

Reconstruire les fichiers publics :

```bash
python outils/construire_site.py
python outils/construire_seo.py
```

Sous Windows, on peut aussi lancer `CONSTRUIRE_PJJOUE.bat`.

Le constructeur refuse maintenant les erreurs silencieuses : repère HTML oublié, morceau CSS dupliqué, source absente, morceau CSS non utilisé ou incohérence du plan.

Pour vérifier qu’aucun fichier généré n’a été modifié directement :

```bash
python outils/construire_site.py --verifier
python outils/construire_seo.py --verifier
```

## Lancer les contrôles

Sous Windows, pour une première installation, double-clique sur **`INSTALLER_OUTILS_DE_DEVELOPPEMENT.bat`**.

Ensuite, le contrôle complet peut être lancé avec **`VERIFIER_PJJOUE.bat`**.

Les mêmes commandes à la main sont :

```bash
npm ci
npm test
```

Versions de Node acceptées : **20.19+, 22.13+ ou 24+** selon la plage déclarée dans `package.json` et supportée par ESLint.

Pour produire de vraies captures Chromium sur ordinateur, portable et mobile :

```bash
npm run test:visuel
```

Guide détaillé pour une reprise humaine ou par IA : **`code/00 - LIRE EN PREMIER/CAPTURES_VISUELLES_ET_TESTS_NAVIGATEUR.md`**. Les outils de capture font partie du projet ; seul `test-results/` est jetable et régénérable.

Pour comparer deux versions pixel par pixel :

```bash
python tests/verifier_regression_visuelle.py --reference-projet CHEMIN_DE_LA_VERSION_REFERENCE
```

## Documentation actuelle

Tout ce qui sert à travailler aujourd’hui se trouve dans :

**`documentation/documentation-actuelle/`**

## Ne jamais renommer sans vérifier les conséquences

- paramètres Analytics `pjjoue_...` ;
- clés de sauvegarde locale ;
- identifiants permanents des questions ;
- URL publiques déjà indexées ;
- format des sauvegardes locales et compatibilité des données enregistrées.
