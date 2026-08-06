# PJJoue V1

PJJoue est un jeu web statique d’acculturation à la Protection judiciaire de la jeunesse.

Pour reprendre le projet rapidement, commencer par
[`documentation/COMMENCER_ICI.md`](documentation/COMMENCER_ICI.md).

## Contenu officiel

- 160 questions : Q1 à Q110 pour le parcours guidé, Q111 à Q160 pour l’évaluation finale ;
- 11 étapes pédagogiques de 10 questions ;
- une étape 12 d’évaluation finale comportant 50 questions ;
- 7 formes d’activité : Choix unique, Sélection multiple, Relier / Association, Éliminer, Réponse écrite, Remettre dans l’ordre et Classer ;
- 3 jokers dans le parcours : 50/50, indice et langue au chat ;
- une progression enregistrée uniquement dans le navigateur ;
- aucun service serveur ; Google Tag Manager et Google Analytics ne sont chargés qu’après un consentement explicite.

## Démarrer le jeu

PJJoue peut être ouvert directement avec `index.html`. Pour reproduire un hébergement web local :

```bash
python3 -m http.server 8000
```

Puis ouvrir `http://localhost:8000` dans un navigateur.

Sous Windows, si la commande `python3` n’existe pas, utiliser :

```powershell
py -m http.server 8000
```

## Organisation principale

- `index.html` : interface publique du jeu et point d’entrée vers les guides ;
- `decouvrir-la-pjj/`, `organisation-pjj/`, `metiers-pjj/`, `structures-pjj/`, `mesures-educatives-pjj/`, `sigles-pjj/` et `quiz-pjj/` : pages pédagogiques publiques indexables ;
- `ressources/moteur-jeu.js` : logique complète du jeu ;
- `ressources/consentement-analytics.js` : choix du visiteur et chargement conditionnel de Google Tag Manager ;
- `ressources/analytics-pjjoue.js` : événements métier du jeu, sans texte de réponse ;
- `ressources/styles/` : feuilles visuelles thématiques chargées dans l’ordre numérique ;
- `donnees/*.json` : sources de vérité de la banque, des programmes et des références ;
- `donnees/donnees-pjj.js` : données générées pour une ouverture locale sans requête réseau ;
- `administration.html` : outil local d’édition et de contrôle des questions ;
- `outils/construire_donnees.py` : reconstruction du fichier de données généré ;
- `outils/analyser_doublons_css.js` et `outils/analyser_structure_css.js` :
  garde-fous du nettoyage CSS ;
- `tests/` : contrôles automatiques de la V1 ;
- `documentation/` : architecture, recette, sécurité, accessibilité et gouvernance éditoriale.

## Modifier la banque de questions

Les trois fichiers JSON du dossier `donnees/` sont canoniques. Après toute modification :

```bash
python3 outils/construire_donnees.py
python3 tests/verifier_v1.py
```

`donnees/donnees-pjj.js` est généré automatiquement et ne doit pas être modifié à la main. La génération refuse une banque dont les activités contiennent des identifiants, ordres, associations, classements ou références incohérents.

## Mesure d’audience

Le site reste entièrement utilisable sans accepter Analytics. Le conteneur Google Tag Manager n’est téléchargé qu’après un accord explicite. Les événements du jeu reposent sur des identifiants stables et ne transmettent ni le texte des questions, ni les réponses saisies, ni la sauvegarde du joueur. La configuration est décrite dans `documentation/CONFIGURATION_GTM_ANALYTICS.md` et les règles de maintenance dans `documentation/MODIFIER_LES_QUESTIONS_SANS_CASSER_ANALYTICS.md`.

## Vérifier la V1

### Prérequis des contrôles

Les contrôles techniques utilisent Python, Node.js, TypeScript, PostCSS, Playwright et Chromium. Ces outils servent uniquement au développement : le jeu diffusé reste entièrement statique et ne charge aucune dépendance distante avant le consentement Analytics.

Installation des dépendances Node.js :

```bash
npm ci
```

Installation de la recette navigateur :

```bash
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
```

Sous Windows, `py -m pip` peut remplacer `python -m pip`.

```bash
npm test
```

Cette commande exécute ESLint, les contrôles de doublons et de structure CSS,
les tests unitaires de validation des données, le contrôle structurel puis la
recette Chromium. Le contrôle structurel vérifie notamment le JavaScript avec
TypeScript en modes `allowJs` et `checkJs`, sans convertir ni produire de
fichier. La recette ouvre aussi le vrai `index.html` local, puis 42 états et
interactions dans Chromium ; elle contrôle les corrections, les jokers, le mode
Relier, les réponses écrites, les sauvegardes, l’étape 12, le défi chrono et
l’administration.

Le rendu CSS est en plus protégé, sous Windows avec la version Chromium prévue
par le projet, par 19 empreintes de pixels :

```bash
npm run test:visuel
```

Les captures obtenues en cas d’écart sont écrites dans `test-results/`, dossier
temporaire ignoré par le manifeste. La référence ne doit être recréée que pour
valider volontairement une nouvelle apparence.

Le fichier `package-lock.json` verrouille les dépendances Node.js. Utiliser Node.js 24.18 avec npm 11 pour reproduire l’environnement de contrôle.

## Intégration continue

Le workflow `.github/workflows/controle.yml` lance automatiquement les contrôles structurels et la recette d’interface à chaque envoi et demande de fusion sur GitHub. Aucun dépôt distant n’est créé automatiquement : le workflow devient actif lorsque ce dossier est placé dans un dépôt GitHub.

Le détail des garde-fous figure dans `documentation/AUDIT_TECHNIQUE_V1.md`.

Après toute modification d’un fichier diffusé, régénérer le manifeste d’intégrité avant de créer l’archive :

```bash
python outils/construire_manifeste.py
```


## Statut

Cette archive constitue la **V1 officielle du projet personnel PJJoue**. Avant chaque publication, vérifier les sources, les mentions juridiques, la sécurité de l’hébergement et la recette fonctionnelle.
<!-- redéploiement v35 -->