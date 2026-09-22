# Atlas V1 — couleurs, étoiles et lisibilité

Livraison locale du 21 septembre 2026. Version du produit : **V1** ; paquet : **1.0.0**.
Aucun déploiement ni changement du dépôt distant.

## Une seule identité graphique

Le papier crème `#f6f3eb`, les panneaux ivoire `#fffef9`, l’encre `#172d48`, le bleu
principal `#214fba` et le jaune Atlas `#f3d86c` sont conservés. Les accents de parcours
sont renforcés, sans colorer les paragraphes de lecture ou remplacer les couleurs
fonctionnelles de bonne réponse, d’erreur et d’avertissement.

| Parcours | Accent |
|---|---|
| 01 · De l’enquête à la sanction | Or `#b8870a` |
| 02 · Information judiciaire | Bleu cyan `#167f9c` |
| 03 · Du jugement à la sanction | Violet `#8753b7` |
| 04 · Matière criminelle | Rose `#c3426a` |
| 05 · Application et exécution | Vert sarcelle `#1b8271` |
| Option 06 · Découvrir la PJJ | Bleu `#3f72bb` |

Cartes : filet supérieur de 5 px, contours colorés, surface légèrement teintée,
numéros plus présents. Étapes : filet latéral de 4 px, numéro sur fond teinté,
progression dans la même couleur, séparation nette entre texte et état.

Les couleurs d’étape sont obtenues par `obtenirCouleurEtapeAtlas`. Cette fonction
alimente les cartes, les questions et les repères de révision. Le jeu des mesures
et celui des sigles utilisent leurs identités propres, transformées par la même
palette de présentation. Les guides PJJ renvoient aux variables communes de leurs
étapes. Les données de contenu n’ont pas été modifiées.

## Étoiles filantes

L’astre et ses deux traînées héritent de l’accent du contexte : étape, parcours ou
étape de mini-jeu. Les étoiles d’étape restent sans chiffre. Le compteur du parcours
et les conditions de maîtrise sont inchangés. Les étoiles sont placées dans le flux
normal des cartes : elles ne recouvrent ni le titre ni le badge de statut.

## Hiérarchie de lecture

Valeurs à la taille « Normale » :

| Usage | Taille |
|---|---:|
| Texte courant et réponses | 17 px |
| Boutons et contrôles | 16 px |
| Texte secondaire et infobulles | 15 px |
| Petits repères et compteurs | 14 px |
| Navigation principale sur ordinateur | 15,5 px |
| Navigation principale sur petit écran | 14 px |
| Entrées du menu Plus | 16 px |

Les grands titres serif gardent leurs dimensions de référence. La navigation a
un poids renforcé et la page active un repère bleu. Les paramètres de taille du
texte existants restent fonctionnels. Les textes agrandis passent sur plusieurs
lignes plutôt que d’être tronqués. Sous 480 px, les parcours passent sur une colonne.
Le menu mobile est ancré au bord de l’en-tête, même avec le réglage Grande.

## Organisation du code

- `code/01 - Éléments communs/Palette-Atlas.js` : conversion des accents, chargée avant les identités de parcours et de missions.
- `code/01 - Éléments communs/atlas-systeme.css` : primitives, palette et échelle typographique communes.
- Les styles de chaque page restent dans leur source existante ; aucun fichier de rustines supplémentaire.
- Six modules JavaScript de présentation sont retouchés ; les remplacements autorisés et les empreintes de leur version antérieure sont recensés dans `tests/atlas_v1_changements_presentation.json` et `tests/atlas_v1_empreintes_presentation.json`.
- `python tests/verifier_atlas_v1_couleurs.py` contrôle les couleurs des étoiles, la cohérence carte/question/révision et l’agrandissement du texte à 320, 390, 768 et 1440 px.

Les captures d’étoiles emploient uniquement des progressions de test. Aucune de ces
progressions n’est injectée dans le site livré ni dans une sauvegarde utilisateur.
