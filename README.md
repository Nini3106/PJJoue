# PJJoue — reprendre le code sans se perdre

PJJoue est un site web pédagogique statique consacré à la Protection judiciaire de la jeunesse.

## Première chose à ouvrir

👉 **`code/00 - LIRE EN PREMIER/`**

Commence par :

1. `REGLES_OBLIGATOIRES_ORGANISATION_ET_NOMMAGE.md` ;
2. `INDEX_VISUEL_VERS_CODE.md` ;
3. `CARTE_DES_ACTIONS_JAVASCRIPT.md`.

La règle centrale est : **ce que l’on voit dans PJJoue doit porter le même nom dans le code.**

## Organisation

Le dossier `code/` suit les pages visibles : Accueil, Parcours PJJ, Carnet de voyage, Entraînement libre, Question, Bilan de la session, Réviser, Progression, Paramètres, Guides, Informations légales et Administration.

Les éléments réellement partagés restent dans `code/01 - Éléments communs/`.

La page **Question** possède un sous-dossier `actions/` qui sépare sa logique en huit familles lisibles : réponses écrites, activités écrites, session/correction, activités interactives, affichage, chronomètre, validation/navigation et jokers.

## Fichiers publics générés

`index.html`, `ressources/moteur-jeu.js`, les feuilles CSS publiques, les guides et plusieurs autres fichiers sont reconstruits depuis `code/`.

Pour construire :

```bash
python outils/construire_site.py
```

Pour vérifier que personne n’a modifié un fichier généré à la main :

```bash
python outils/construire_site.py --verifier
```

## Tests

Sous Windows :

- `INSTALLER_OUTILS_DE_DEVELOPPEMENT.bat` installe les outils nécessaires ;
- `VERIFIER_PJJOUE.bat` lance les contrôles avant publication.

En ligne de commande :

```bash
npm ci
npm test
```

Pour les captures visuelles Chromium :

```bash
npm run test:visuel
```

Pour comparer une version avec une référence :

```bash
python tests/verifier_regression_visuelle.py --reference-projet CHEMIN_DE_LA_VERSION_REFERENCE
```

## Documentation

Le seul point d’entrée est :

**`documentation/COMMENCER_ICI.md`**

La documentation utile aujourd’hui est dans `documentation/documentation-actuelle/`.

## Noms à protéger

Ne jamais renommer au hasard :

- les paramètres Analytics `pjjoue_...` ;
- les clés de sauvegarde locale ;
- les identifiants permanents des questions ;
- les URL publiques indexées par Google.
