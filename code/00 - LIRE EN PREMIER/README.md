# PJJoue — LIRE EN PREMIER

Avant de modifier le projet, lis :

**`REGLES_OBLIGATOIRES_ORGANISATION_ET_NOMMAGE.md`**

Puis utilise :

- **`INDEX_VISUEL_VERS_CODE.md`** pour partir de ce que tu vois à l’écran ;
- **`CARTE_DES_ACTIONS_JAVASCRIPT.md`** pour retrouver l’action qui ouvre, affiche, valide, enregistre ou réinitialise quelque chose ;
- **`LEXIQUE_VISUEL_VERS_CODE.md`** pour les correspondances de vocabulaire.

## Règle n°1 — ne jamais modifier les fichiers publics comme sources

Les fichiers publics (`index.html`, `*/index.html`, `ressources/...`, `service-worker.js`, pages légales) sont **générés depuis `code/`**.

> **Toute modification doit être faite dans `code/`, puis reconstruite. Un fichier public modifié seul ne doit jamais être poussé.**

Avant chaque push :

```bash
python outils/verifier_noms_fichiers.py
python outils/construire_donnees.py
python outils/construire_site.py
python outils/construire_seo.py
python outils/construire_seo.py --verifier
python outils/construire_manifeste.py
python outils/construire_site.py --verifier
python outils/construire_manifeste.py --verifier
npm test
```

### UTF-8 : règle non négociable

Les chemins français accentués doivent rester **strictement en UTF-8**. Si un dossier contient `├`, `Ã`, `Â`, `ÔÇ`, `ΓÇ` ou `�`, arrêter immédiatement : il s’agit d’un encodage corrompu. `Éléments communs`, `Entraînement libre`, `Réviser` et `Paramètres` doivent conserver exactement ces noms.

`outils/verifier_noms_fichiers.py` contrôle les noms et l’encodage UTF-8 des fichiers texte. Pour créer un ZIP, utiliser `python outils/creer_archive_utf8.py` afin que les noms accentués portent bien l’indicateur UTF-8 dans l’archive.

### Manifeste : toujours en dernier

`MANIFESTE.json` est une photographie d’intégrité du projet. **Après toute modification, reconstruction ou restauration de fichier, il faut le régénérer en dernier** avec `python outils/construire_manifeste.py`. Aucune modification ne doit intervenir entre cette génération et le commit sans une nouvelle génération du manifeste.

Le SEO fait partie de la construction : **à chaque évolution de la V1**, exécuter `python outils/construire_seo.py` puis `python outils/construire_seo.py --verifier` avant de générer le manifeste. Cela contrôle les balises SEO, les URL propres, les relais `noindex` et `sitemap.xml`.

## Où modifier ?

Le nom du dossier suit le nom visible dans PJJoue. Si une action concerne la page Question, ouvre `code/06 - Question/`. Si elle concerne plusieurs pages, ouvre `code/01 - Éléments communs/`.

La page Question est plus riche que les autres : son JavaScript est rangé dans `code/06 - Question/actions/` par grandes actions visibles.

## Après une modification

Construire dans l’ordre :

```bash
python outils/construire_donnees.py
python outils/construire_site.py
python outils/construire_seo.py
python outils/construire_manifeste.py
```

Vérifier les fichiers générés et le SEO :

```bash
python outils/construire_site.py --verifier
python outils/construire_seo.py --verifier
python outils/construire_manifeste.py --verifier
```

Puis lancer les tests avant publication.
