# PJJoue — LIRE EN PREMIER

Avant de modifier le projet, lis :

**`REGLES_OBLIGATOIRES_ORGANISATION_ET_NOMMAGE.md`**

Puis utilise :

- **`INDEX_VISUEL_VERS_CODE.md`** pour partir de ce que tu vois à l’écran ;
- **`CARTE_DES_ACTIONS_JAVASCRIPT.md`** pour retrouver l’action qui ouvre, affiche, valide, enregistre ou réinitialise quelque chose ;
- **`LEXIQUE_VISUEL_VERS_CODE.md`** pour les correspondances de vocabulaire.

## Où modifier ?

Le nom du dossier suit le nom visible dans PJJoue. Si une action concerne la page Question, ouvre `code/06 - Question/`. Si elle concerne plusieurs pages, ouvre `code/01 - Éléments communs/`.

La page Question est plus riche que les autres : son JavaScript est rangé dans `code/06 - Question/actions/` par grandes actions visibles.

## Après une modification

Construire :

```bash
python outils/construire_site.py
```

Vérifier les fichiers générés :

```bash
python outils/construire_site.py --verifier
```

Puis lancer les tests avant publication.
