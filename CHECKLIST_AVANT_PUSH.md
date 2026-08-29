# CHECKLIST AVANT PUSH — PJJoue V1

Cette checklist est obligatoire avant toute publication de PJJoue.

> `node_modules/` n'est jamais livré ni versionné. `PREPARER_PJJOUE_AVANT_PUSH.bat` exécute automatiquement `npm ci` si les outils Node.js (dont ESLint) sont absents ou incomplets.

## 1. Modifier uniquement les sources

- Modifier dans `code/`.
- Ne pas utiliser `index.html`, `*/index.html`, `ressources/navigation-locale.js` ou `service-worker.js` public comme source de travail.
- Pour le service worker, modifier `code/01 - Éléments communs/Application installable et hors connexion/service-worker.js`.

## 2. Vérifier les noms de fichiers

Exécuter :

```bash
python outils/verifier_noms_fichiers.py
```

Résultat attendu :

```text
OK — aucun nom de fichier ou dossier corrompu détecté.
```

Si un nom contient `├`, `Ã`, `Â`, `�` ou ressemble à un accent français cassé : **STOP — ne pas pousser**.

## 3. Reconstruire

Sous Windows :

```text
CONSTRUIRE_PJJOUE.bat
```

Ou :

```bash
python outils/construire_site.py
```

La reconstruction régénère notamment les pages publiques et le service worker.


## 3 bis. Vérifier qu’aucun ancien CSS public ne subsiste

La reconstruction supprime automatiquement les anciennes feuilles CSS fragmentées (`00-...css`, `10-...css`, ..., `99-...css`).

Après `CONSTRUIRE_PJJOUE.bat`, le dossier `ressources/styles/` ne doit plus contenir ces anciennes feuilles. Si `--verifier` signale « anciens fichiers publics obsolètes », ne pas pousser avant reconstruction.

## 4. Vérifier que public = sources

Exécuter :

```bash
python outils/construire_site.py --verifier
```

Résultat attendu : `OK`.

**Si le message « fichiers publics modifiés directement ou non reconstruits » apparaît : ne pas pousser.** Corriger d’abord la source dans `code/`, puis reconstruire.

## 5. Lancer la recette complète

Sous Windows :

```text
VERIFIER_PJJOUE.bat
```

Ou :

```bash
npm test
```

Tous les contrôles doivent être verts.

## 6. Contrôle Git avant commit

- Aucun dossier au nom corrompu.
- Aucun doublon de dossier accentué.
- Les fichiers publics modifiés correspondent à une reconstruction attendue.
- Aucun fichier supprimé ou ajouté par erreur.
- La version reste **PJJoue V1**.

## 7. Push

Seulement lorsque les étapes 1 à 6 sont validées.

> **Règle courte : `code/` → construire → vérifier → tester → pousser.**

## 7. Portabilité Windows / Linux

- Les fichiers générés sont écrits avec des fins de ligne LF déterministes, quel que soit le système.
- Les empreintes Analytics ignorent uniquement la différence technique LF/CRLF ; toute modification réelle du contenu reste bloquée.
- `PREPARER_PJJOUE_AVANT_PUSH.bat` reconstruit les données, le site, le service worker et `MANIFESTE.json` avant la recette.
- Ne jamais modifier une empreinte Analytics pour faire passer un test : si elle échoue, comparer d'abord la source protégée et le fichier public.

## 8. Contrôles réseau et visuels portables

- Un lien officiel en **404/410** ou une adresse invalide reste bloquant.
- Un **403**, un délai dépassé, une erreur DNS/SSL ou un refus anti-robot est signalé en avertissement : ce n'est pas une preuve que le lien est mort.
- Les références pixel par pixel sont canoniques sous **Linux/Chromium (CI GitHub)**.
- Sous Windows, la recette exécute les scénarios, assertions de structure, contrôles de débordement et captures, mais n'échoue pas sur les différences de rasterisation des polices système.
- Ne jamais lancer `--actualiser-references` sous Windows pour écraser les références Linux.
