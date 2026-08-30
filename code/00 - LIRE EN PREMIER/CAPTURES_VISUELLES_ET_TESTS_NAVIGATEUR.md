# CAPTURES VISUELLES ET TESTS NAVIGATEUR

Ce projet contient ses **outils de recette visuelle Chromium**. Ils font partie du projet et ne doivent pas être supprimés lors d’une reprise par une personne ou une IA.

## Outils à conserver

- `tests/verifier_regression_visuelle.py` : rend et capture l’interface principale en bureau et mobile ;
- `tests/verifier_pages_annexes.py` : rend et capture les guides, pages d’information et administration ;
- `tests/verifier_interface.py` : vérifie le fonctionnement réel de l’interface avec Chromium ;
- `requirements-dev.txt` : dépendances Python (`playwright`, `Pillow`) ;
- `package.json` et `package-lock.json` : commandes de contrôle du projet ;
- `INSTALLER_OUTILS_DE_DEVELOPPEMENT.bat` : installe les dépendances et Chromium ;
- `CAPTURER_PJJOUE.bat` : déclenche directement les captures ;
- `VERIFIER_PJJOUE.bat` : lance la recette complète.

Le dossier `test-results/` contient seulement des **résultats générés**. Il peut être supprimé avant livraison : les scripts le recréent automatiquement.

## Première utilisation sous Windows

1. Exécuter `INSTALLER_OUTILS_DE_DEVELOPPEMENT.bat`.
2. Exécuter `CAPTURER_PJJOUE.bat` pour les captures.
3. Exécuter `VERIFIER_PJJOUE.bat` avant une publication.

L’installateur cherche d’abord Python 3.14, puis n’importe quel Python 3 accessible via `py -3`, puis `python`.

## Commandes utilisables par une IA ou dans un terminal

Depuis la racine de PJJoue :

```bash
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
python tests/verifier_regression_visuelle.py
python tests/verifier_pages_annexes.py
python tests/verifier_interface.py
```

Pour ouvrir le site sur l’adresse locale utilisée par le projet :

```bash
npm run dev
```

Puis saisir `http://localhost:4173/` dans le navigateur. Le serveur écoute aussi `127.0.0.1` sur le même port ; `localhost` reste l’adresse conseillée dans la documentation.

Pour ne capturer qu’un écran ou une famille d’écrans de l’interface principale :

```bash
python tests/verifier_regression_visuelle.py --filtre parcours-detail
python tests/verifier_regression_visuelle.py --filtre mobile
python tests/verifier_regression_visuelle.py --filtre entrainement
```

Avec npm :

```bash
npm run test:visuel
npm run test:interface
npm run test:pages-annexes
```

Les captures générées sont écrites dans :

- `test-results/regression-visuelle-moderne/` ;
- `test-results/pages-annexes/`.

## Choisir un Chromium déjà installé

Les scripts utilisent automatiquement Chromium installé par Playwright lorsqu’aucun navigateur système compatible n’est détecté. Pour imposer un exécutable particulier :

- variable `PLAYWRIGHT_CHROMIUM_EXECUTABLE` pour les recettes visuelles ;
- variable `PJJOUE_CHROMIUM` acceptée également par les recettes navigateur.

## Références et pixel-perfect

La recette normale reste portable : elle contrôle le DOM, les dimensions critiques, les débordements, le comportement et produit les captures sans confondre une différence de moteur de rendu avec une régression.

Le pixel-perfect est un mode volontaire : définir `PJJOUE_COMPARAISON_PIXELS_EXACTE=1` puis lancer `python tests/verifier_regression_visuelle.py`. Ce mode n’est accepté que si le système et le Chromium majeur correspondent à `tests/references-visuelles/environnement-reference.json`.

Après une modification visuelle validée, actualiser les références **uniquement sous Linux** avec :

```bash
python tests/verifier_regression_visuelle.py --actualiser-references
```

Le script met alors à jour les PNG et `environnement-reference.json`. Ne jamais actualiser les références sous Windows.

## Règle pour toute reprise du site

Après une modification visuelle, **ne pas se contenter de lire le HTML/CSS**. Reconstruire si nécessaire, lancer les tests navigateur puis produire de nouvelles captures afin de contrôler le rendu réel en bureau et mobile. Les anciennes captures ne sont jamais une source de vérité : elles sont des résultats de test jetables.
