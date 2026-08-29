# Architecture du code par page — V1

Le dossier **`code/`** est la porte d’entrée pour reprendre PJJoue.

L’idée est simple : **on part du nom visible dans le site, puis on ouvre le dossier qui porte le même nom.**

## Pages du jeu

1. `02 - Accueil`
2. `03 - Parcours PJJ`
3. `04 - Carnet de parcours`
4. `05 - Entraînement libre`
5. `06 - Question`
6. `07 - Bilan de la session`
7. `08 - Réviser`
   - `08 - Réviser/Jeu des sigles` — Mission Sigles
8. `09 - Progression`
9. `10 - Paramètres`

Chaque dossier contient :

- `contenu.html` : ce qui est affiché ;
- `style-de-la-page.css` : le CSS rattachable à cette page sans casser la cascade ;
- `actions-de-la-page.js` : les actions propres à cette page, quand elles peuvent être isolées proprement ;
- exception : **Question** utilise `actions/` avec huit fichiers nommés par action visible, afin qu’aucun fichier géant ne soit nécessaire ;
- `LIRE-MOI.md` : une explication courte du dossier.



### Mission Sigles

`08 - Réviser/Jeu des sigles` contient le mini-jeu **Mission Sigles**. Ses données ne sont pas dupliquées dans la page : la liste canonique des 72 sigles se trouve dans `donnees/sigles.json`. Le même fichier alimente le support de révision, le guide `sigles-pjj/` et les activités du mini-jeu lors de la construction.

Le module possède une progression locale enregistrée dans la sauvegarde principale de PJJoue. Aucun sigle encore inconnu ne peut être utilisé comme question ou distracteur avant l'affichage de son développement complet.

## Éléments communs

`01 - Éléments communs` contient uniquement ce qui sert à plusieurs pages :

- navigation ;
- sauvegarde locale ;
- préparation des sessions ;
- sons et célébrations ;
- branchement des boutons ;
- consentement et Analytics ;
- CSS partagé et adaptations aux différentes tailles d’écran.

On préfère un seul fichier commun bien nommé à cinq copies du même code.

## Guides pour découvrir la PJJ

`11 - Guides pour découvrir la PJJ` contient un dossier par guide, avec son **nom visible** :

- Qu’est-ce que la PJJ ;
- Organisation de la PJJ ;
- Métiers de la PJJ ;
- Structures de la PJJ ;
- Mesures éducatives ;
- Sigles essentiels ;
- Préparer son arrivée à la PJJ ;
- Quiz PJJ — banque complète à 960 questions.

Chaque guide possède son `page.html`, son `style-de-la-page.css` et son `LIRE-MOI.md`.

Le dossier `00 - Éléments communs aux guides` contient seulement ce qui est réellement partagé entre plusieurs guides : styles communs, lecteurs vidéo et suivi Analytics des pages.

## Informations légales

`12 - Informations légales` contient :

- Accessibilité ;
- Confidentialité ;
- Mentions légales.

Chaque page possède son HTML et sa propre feuille CSS source.

## Administration

`13 - Administration` contient :

- `page.html` ;
- `style-de-la-page.css` ;
- `actions-de-la-page.js` ;
- `LIRE-MOI.md`.

## Pourquoi les fichiers publics existent encore à la racine

GitHub Pages a besoin des fichiers publics classiques : `index.html`, `ressources/moteur-jeu.js`, feuilles CSS, dossiers `/metiers-pjj/`, `/sigles-pjj/`, etc.

Ils sont donc **fabriqués à partir du dossier `code/`** par :

`python outils/construire_site.py`

Sous Windows, `CONSTRUIRE_PJJOUE.bat` lance la même construction.

Le fichier `code/plan-construction.json` indique au constructeur dans quel ordre rassembler les morceaux.

## Ce qu’il ne faut pas renommer pendant un simple rangement

- paramètres Analytics `pjjoue_...` ;
- clés de sauvegarde locale ;
- structure des données enregistrées sans migration ;
- URL publiques des guides ;
- identifiants externes imposés par Google/YouTube.

Ces éléments ont besoin de stabilité, même si le reste du code devient plus lisible.
