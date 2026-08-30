# CHECKLIST AVANT PUSH — PJJoue V1

Cette checklist est obligatoire avant toute publication de PJJoue.

> `node_modules/` n'est jamais livré ni versionné. `PREPARER_PJJOUE_AVANT_PUSH.bat` exécute automatiquement `npm ci` si les outils Node.js (dont ESLint) sont absents ou incomplets.

## 1. Modifier uniquement les sources

- Modifier dans `code/`.
- Ne pas utiliser `index.html`, `*/index.html`, `ressources/navigation-locale.js` ou `service-worker.js` public comme source de travail.
- Pour le service worker, modifier `code/01 - Éléments communs/Application installable et hors connexion/service-worker.js`.

## 2. Vérifier les noms ET l’encodage UTF-8

Exécuter :

```bash
python outils/verifier_noms_fichiers.py
```

Résultat attendu :

```text
OK — noms valides et fichiers texte UTF-8 : aucun problème détecté.
```

Si un nom contient `├`, `Ã`, `Â`, `�` ou ressemble à un accent français cassé : **STOP — ne pas pousser**.

## 3. Reconstruire

Sous Windows :

```text
CONSTRUIRE_PJJOUE.bat
```

Ou, manuellement et **dans cet ordre** :

```bash
python outils/construire_donnees.py
python outils/construire_site.py
python outils/construire_seo.py
python outils/construire_seo.py --verifier
python outils/construire_manifeste.py
```

La reconstruction régénère les données publiques, les pages, le service worker puis **`MANIFESTE.json` en dernier**.

> Après la génération de `MANIFESTE.json`, toute nouvelle modification d’un fichier impose de relancer `python outils/construire_manifeste.py`.


## 3 bis. Vérifier qu’aucun ancien CSS public ne subsiste

La reconstruction supprime automatiquement les anciennes feuilles CSS fragmentées (`00-...css`, `10-...css`, ..., `99-...css`).

Après `CONSTRUIRE_PJJOUE.bat`, le dossier `ressources/styles/` ne doit plus contenir ces anciennes feuilles. Si `--verifier` signale « anciens fichiers publics obsolètes », ne pas pousser avant reconstruction.

## 4. Vérifier que public = sources

Exécuter :

```bash
python outils/construire_site.py --verifier
```

Résultat attendu : `OK`.

Puis vérifier le manifeste :

```bash
python outils/construire_manifeste.py --verifier
```

**Si le message « fichiers publics modifiés directement ou non reconstruits » ou « MANIFESTE.json n’est pas à jour » apparaît : ne pas pousser.** Corriger/reconstruire, puis régénérer le manifeste en dernier.

## 5. Vérifier le SEO, les URL propres et le sitemap

À chaque évolution de la V1, exécuter :

```bash
python outils/construire_seo.py --verifier
```

Le contrôle doit confirmer les pages indexables, les `title`/descriptions, canonical, Open Graph, les relais d’URL propres et `sitemap.xml`. Les routes internes (`/parcours/`, `/revision/`, `/progression/`, etc.) doivent rester `noindex,follow` et absentes du sitemap.

Contrôles d’interface obligatoires avant push :

- aucun lien interne ne doit réintroduire de fragment `#` dans la barre d’adresse ; en `file://`, utiliser `index.html?pjjoue_route=...` ;
- le seul bouton jaune plein est **Commencer / Reprendre** sur l’accueil ;
- les boutons de commande doivent épouser leur libellé avec uniquement le padding nécessaire, sans `width:100%`, `flex-grow` ni étirement décoratif.

Si un contenu public, une URL, une meta ou une date éditoriale change, reconstruire d’abord le SEO avec `python outils/construire_seo.py`, puis **régénérer `MANIFESTE.json` en dernier**.

## 6. Lancer la recette complète

Sous Windows :

```text
VERIFIER_PJJOUE.bat
```

Ou :

```bash
npm test
```

Tous les contrôles doivent être verts.

## 7. Contrôle Git avant commit

- Aucun dossier au nom corrompu.
- Aucun doublon de dossier accentué.
- Les fichiers publics modifiés correspondent à une reconstruction attendue.
- Aucun fichier supprimé ou ajouté par erreur.
- La version reste **PJJoue V1**.

## 8. Push

Seulement lorsque les étapes 1 à 7 sont validées.

> **Règle courte : UTF-8 → `code/` → construire données/site → SEO + sitemap → régénérer manifeste en dernier → vérifier → tester → pousser.**

## 9. Portabilité Windows / Linux

- Les fichiers générés sont écrits avec des fins de ligne LF déterministes, quel que soit le système.
- Les empreintes Analytics ignorent uniquement la différence technique LF/CRLF ; toute modification réelle du contenu reste bloquée.
- `PREPARER_PJJOUE_AVANT_PUSH.bat` reconstruit les données, le site, le service worker, le SEO/sitemap puis `MANIFESTE.json` en dernier avant la recette.
- Ne jamais modifier une empreinte Analytics pour faire passer un test : si elle échoue, comparer d'abord la source protégée et le fichier public.

## 10. Contrôles réseau et visuels portables

- Un lien officiel en **404/410** ou une adresse invalide reste bloquant.
- Un **403**, un délai dépassé, une erreur DNS/SSL ou un refus anti-robot est signalé en avertissement : ce n'est pas une preuve que le lien est mort.
- La recette visuelle normale est **structurelle et portable** : scénarios, DOM, dimensions, débordements et captures restent bloquants, pas les différences de rasterisation entre navigateurs.
- Le pixel-perfect est volontairement **opt-in** (`PJJOUE_COMPARAISON_PIXELS_EXACTE=1`) et n’est valable que si l’environnement correspond à `tests/references-visuelles/environnement-reference.json`.
- Ne jamais lancer `--actualiser-references` sous Windows : les références et leur fichier d’environnement se régénèrent uniquement sous Linux/Chromium.
