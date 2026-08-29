# PJJoue V1 — 6 parcours pédagogiques

**Création : août 2026.**

PJJoue est un site web pédagogique consacré à la Protection judiciaire de la jeunesse. La V1 contient six parcours organisés selon une progression pédagogique recommandée. Un joueur qui maîtrise déjà certaines notions peut néanmoins ouvrir directement le parcours qui correspond à ses connaissances ou à ses besoins.

## Parcours

1. **PJJoue — Parcours PJJ** — découvrir la PJJ ;
2. **Suivre la procédure ordinaire : du parquet à la sanction** ;
3. **Comprendre l’information judiciaire, le JI, le JLD et les décisions provisoires** ;
4. **Juger devant le JE et le TPE : mesures éducatives et sanctions ordinaires** ;
5. **Juger la matière criminelle et comprendre les sanctions et peines** ;
6. **Appliquer, exécuter et aménager les mesures et les peines**.

Chaque parcours comporte **11 étapes de 10 questions d’apprentissage**, puis **une évaluation finale de 50 questions**. Dans les six parcours, le mode de réponse est choisi selon l’action réellement demandée ; les évaluations alternent elles aussi plusieurs modes naturels. La V1 contient donc :

- **660 questions d’apprentissage** ;
- **300 questions d’évaluation** ;
- **960 questions au total** ;
- **66 étapes d’apprentissage** ;
- **6 évaluations finales**.

La progression entre les parcours reste pédagogique et implicite : aucun texte visible n’oblige le joueur à avoir suivi un autre parcours auparavant.

PJJoue reste transversal : aucun contenu spécifique à un poste d’assistante administrative ni aucune procédure locale de service n’est intégré aux parcours judiciaires.


## Mission Sigles

La page **Réviser** donne accès à **Mission Sigles**, un mini-PJJoue consacré aux 72 sigles de référence. Le module comprend six étapes colorées de douze sigles, un entraînement configurable, un Défi du hasard, la révision des erreurs, une progression dédiée et une évaluation finale de 30 activités avec un seuil de réussite de 90 %.

La progression pédagogique reprend la logique des parcours principaux : **un sigle n’est jamais demandé seul avant d’avoir été introduit dans une activité précédente avec son développement complet**. Les **72 premières questions sont contextualisées individuellement** : chacune possède un sujet explicite et trois distracteurs rédigés à la main ; les formulations génériques sans sujet sont interdites par les tests. Il n’existe pas d’écran qui donne les réponses avant de jouer. L’entraînement permet de choisir une étape ou tout Mission Sigles, 10 / 20 / 30 / Tous, un ordre par étapes ou mélangé, avec ou sans chrono et avec ou sans jokers. Le Défi du hasard utilise le même dé animé que PJJoue, tire de 1 à 6 questions puis attend le clic de l’utilisateur pour démarrer ; les jokers y sont autorisés.

Le support de révision, le guide public et Mission Sigles utilisent tous la même source `donnees/sigles.json`, afin d’éviter les doublons et les divergences. **Réviser mes erreurs** possède sa propre page `#sigles-revision` : elle reprend le gabarit visuel de Réviser PJJoue mais conserve des données d’erreurs entièrement séparées dans la progression Mission Sigles.

## ⚠️ Règle absolue avant toute modification ou publication

Les fichiers publics à la racine du projet et dans les dossiers publiés sont **des fichiers générés**. Ils ne doivent jamais devenir la source de vérité.

**Ne jamais modifier directement puis publier** `index.html`, les pages `*/index.html`, `ressources/navigation-locale.js`, `service-worker.js`, les pages légales ou tout autre fichier reconstruit par `outils/construire_site.py`.

Toute correction doit suivre cet ordre, sans exception :

1. modifier le fichier source correspondant dans `code/` ;
2. lancer `CONSTRUIRE_PJJOUE.bat` ou `python outils/construire_site.py` ;
3. lancer `VERIFIER_PJJOUE.bat` ou `npm test` ;
4. vérifier que `python outils/construire_site.py --verifier` répond **OK** ;
5. seulement ensuite faire le commit et le push.

Le `service-worker.js` public doit donc toujours être régénéré à partir de sa source située dans `code/01 - Éléments communs/Application installable et hors connexion/`. Le même principe s’applique aux guides, à l’accueil, aux pages légales et à la navigation locale.

### Archives ZIP et accents français

Les noms de dossiers accentués (`Éléments communs`, `Métiers de la PJJ`, etc.) doivent rester strictement intacts. **Ne jamais publier un dossier dont le nom contient des caractères corrompus** comme `├`, `Ã`, `Â` ou `�`. Un tel dossier est généralement un doublon créé par un mauvais encodage ZIP et n’est pas utilisé par le constructeur.

Le contrôle `python outils/verifier_noms_fichiers.py` est exécuté automatiquement par `npm test` et par la recette Windows. S’il échoue, **ne pas pousser**.

Pour une publication normale, le réflexe recommandé est : **modifier dans `code/` → construire → vérifier → pousser**.

## Organisation du code

Le français est la langue de référence du projet. La règle centrale est :

> **Ce que l’on voit dans PJJoue doit porter le même nom dans le code.**

Pour reprendre le projet, ouvrir d’abord :

`code/00 - LIRE EN PREMIER/`

puis lire :

1. `REGLES_OBLIGATOIRES_ORGANISATION_ET_NOMMAGE.md` ;
2. `INDEX_VISUEL_VERS_CODE.md` ;
3. `CARTE_DES_ACTIONS_JAVASCRIPT.md`.

Les fichiers publics (`index.html`, `ressources/moteur-jeu.js`, les feuilles CSS, les guides, etc.) sont reconstruits depuis `code/`.

```bash
python outils/construire_donnees.py
python outils/construire_site.py
python outils/construire_manifeste.py
```

Pour prévisualiser le site dans un navigateur :

```bash
npm run dev
```

Puis ouvrir **http://localhost:4173/**. L’ouverture directe de `index.html` reste prise en charge, mais le serveur local permet aussi de vérifier le manifeste et le fonctionnement hors connexion dans les conditions normales d’un site web.

## Publication sur GitHub Pages

Le contenu du projet peut être placé à la racine d’une branche, puis publié depuis **Settings → Pages → Deploy from a branch → /(root)**. Le fichier `.nojekyll` est déjà présent. Les chemins du manifeste, du service worker et des ressources fonctionnent aussi lorsque GitHub Pages publie le site sous `/nom-du-depot/`.

Les URL canoniques, le sitemap et le fichier `robots.txt` ciblent `https://pjjoue.fr/`. Si ce domaine personnalisé est utilisé, il doit être configuré dans les paramètres GitHub Pages du dépôt. Sinon, ces trois éléments doivent être adaptés à l’adresse publique retenue avant l’indexation du site.


### Nettoyage automatique des anciens CSS publics

Une ancienne organisation de PJJoue produisait plusieurs feuilles CSS publiques séparées (`00-fondations-et-composants.css`, `10-parcours-principal.css`, etc.). Elles sont désormais obsolètes.

- `python outils/construire_site.py` les supprime automatiquement si elles sont encore présentes ;
- `python outils/construire_site.py --verifier` échoue si l’une d’elles réapparaît ;
- ne pas les restaurer ni les modifier : la feuille publique de référence est `ressources/styles/pjjoue-principal.css`, reconstruite depuis `code/`.

## Construction reproductible sur Windows et Linux

Les sorties générées sont écrites avec des fins de ligne LF déterministes afin qu'une reconstruction sous Windows produise les mêmes octets que sur GitHub/Linux. Les contrôles Analytics normalisent uniquement LF/CRLF avant de vérifier les empreintes : un simple changement de fin de ligne ne bloque donc plus la recette, tandis qu'une modification réelle du code Analytics reste détectée.

Avant tout push, utiliser `PREPARER_PJJOUE_AVANT_PUSH.bat`. Ce script reconstruit `donnees/donnees-pjj.js`, les 44 fichiers publics (service worker compris) et `MANIFESTE.json`, puis lance la recette complète.

## Vérifications

Sous Windows, lancer de préférence `PREPARER_PJJOUE_AVANT_PUSH.bat` avant chaque commit/push. Il vérifie les noms, reconstruit le site et installe automatiquement les dépendances Node.js avec `npm ci` si ESLint est absent. Le dossier `node_modules/` ne doit jamais être livré dans une archive ni versionné.

`VERIFIER_PJJOUE.bat` lance ensuite la recette. En ligne de commande :

```bash
npm ci
npm test
```

Les tests Python et Chromium peuvent également être lancés séparément depuis le dossier `tests/`.

## Sources et droit applicable

Le corpus juridique transmis est recroisé avec les sources officielles. En cas de divergence entre une synthèse pédagogique et un texte en vigueur, la source officielle actuelle prime. La couverture est documentée dans `AUDIT_COUVERTURE_CORPUS_V1.md`.

## Validation technique finale

La version consolidée du 28 août 2026 a été contrôlée sur ses données, ses 960 questions, sa construction, ses pages, sa navigation, son identité, son iconographie et son interface Chromium. Le détail est consigné dans `ETAT_VALIDATION_V1.md`.


## Architecture visuelle moderne

L’interface principale est construite à partir des fragments HTML, JavaScript et CSS déclarés dans `code/plan-construction.json`. La base commune se trouve dans `code/01 - Éléments communs/style-general-pjjoue.css`, puis les styles propres aux pages complètent cette base. Le constructeur assemble ces sources dans l’unique feuille publique `ressources/styles/pjjoue-principal.css`. Les pages autonomes partagent `static-pages.css`, et le consentement Analytics possède son composant dédié.
L’identité repose sur un bleu PJJoue profond et un jaune franc : fond général `#16477d`, en-tête `#0b315d`, texte principal `#f7f8ff`, cartes bleues `#10477f` ou `#0b3d70` et action principale `#ffc83d`. Les six parcours possèdent chacun leur couleur d’accent. Ces choix sont définis directement dans le design system, sans feuille de surcharge ajoutée en fin de cascade.
Les questions, réponses, modes de jeu et données pédagogiques restent gérés par
le moteur V1.

La navigation principale est regroupée dans un menu unique ouvrable et repliable.
Le **Carnet de parcours** y possède sa propre entrée. Sur l'accueil,
**S'entraîner librement** n'est proposé qu'aux utilisateurs dont une progression
a déjà été enregistrée. La page **Réviser** rassemble les questions à retravailler. La page **Supports** classe les ressources par juridiction, avec la fiche pratique puis la fiche synthétique avant les éventuels compléments.

## Tests et captures visuelles

Les outils de recette Chromium sont livrés avec le projet afin qu’une personne ou une IA puisse contrôler le rendu réel après modification.

- première installation : `INSTALLER_OUTILS_DE_DEVELOPPEMENT.bat` ;
- captures desktop/mobile : `CAPTURER_PJJOUE.bat` ;
- contrôle complet avant publication : `VERIFIER_PJJOUE.bat` ;
- guide détaillé : `code/00 - LIRE EN PREMIER/CAPTURES_VISUELLES_ET_TESTS_NAVIGATEUR.md`.

Le dossier `test-results/` n’est pas livré : il est recréé automatiquement par les scripts.

Les références visuelles pixel par pixel sont canoniques sous Linux/Chromium, comme la CI GitHub. Sous Windows, le moteur de rendu des polices système (DirectWrite/Segoe UI) peut produire des pixels et des retours à la ligne différents alors que le HTML, le CSS et le JavaScript sont identiques. La recette Windows exécute donc tous les scénarios, assertions DOM, dimensions critiques, contrôles de débordement et captures, tandis que la comparaison bitmap exacte reste bloquante sous Linux/CI. Les références ne doivent pas être régénérées depuis Windows.

Le contrôle des liens officiels ne bloque que les anomalies confirmées (adresse invalide, HTTP 404 ou 410). Les refus anti-robot, délais réseau, erreurs DNS/SSL ou HTTP temporaires sont signalés pour contrôle humain sans rendre la publication rouge.
