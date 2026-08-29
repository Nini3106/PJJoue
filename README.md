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

## Vérifications

Sous Windows, `VERIFIER_PJJOUE.bat` lance la recette. En ligne de commande :

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
