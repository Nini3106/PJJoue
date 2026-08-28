# Architecture CSS de PJJoue

L’application utilise un petit nombre de feuilles construites depuis leurs
sources lisibles, sans surcouche de compatibilité.

| Fichier | Rôle |
|---|---|
| `pjjoue-principal.css` | feuille chargée par l’application principale ; elle assemble le style général d’origine et les composants nécessaires aux six parcours |
| `pjjoue-static.css` | design commun des guides, pages légales et outils autonomes |
| `95-consentement.css` | composant de consentement Analytics partagé |

Les quelques feuilles sous `pages-legales/` et les `style-de-la-page.css` des
guides ne contiennent que des règles réellement spécifiques à leur page.

## Règle de modification

1. modifier la source dans `code/`, jamais le fichier public construit ;
2. reconstruire avec `python outils/construire_site.py` ;
3. vérifier la construction et les données ;
4. exécuter la recette visuelle Chromium principale et celle des pages annexes.

Aucune feuille corrective ou feuille de surcharge n’est chargée après le style principal.
