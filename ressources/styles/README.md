# Feuilles de style de l’interface

Les fichiers sont chargés dans l’ordre de leur préfixe numérique. Ils
proviennent de tranches strictement continues de la cascade de référence :
les déplacer ou modifier leur ordre peut changer le rendu.

| Ordre | Fichier | Contenu principal |
|---:|---|---|
| 00 | `00-fondations-et-composants.css` | variables, base globale, composants et activités communes |
| 10 | `10-parcours-principal.css` | présentation et structure principales du parcours |
| 20 | `20-accueil-et-question-principale.css` | accueil, question, correction et commandes principales |
| 30 | `30-revision-parcours-et-parametres.css` | révision, carnet de parcours et paramètres |
| 40 | `40-progression-et-erreurs.css` | progression, erreurs et dimensions associées |
| 50 | `50-carte-question-et-correction.css` | carte de question, validation, jokers et correction |
| 60 | `60-parcours-modes-et-chronometre.css` | finitions du parcours, modes, chronomètre et classement |
| 70 | `70-celebrations-bilan-et-fenetres.css` | célébrations, bilan, modales et messages |
| 80 | `80-finitions-de-l-interface.css` | couche de compatibilité et finitions transversales |
| 90 | `90-responsive-et-etats-finaux.css` | derniers états et adaptations responsive de référence |

## Règle de modification

Chercher d’abord le composant dans toutes les feuilles. Une règle tardive peut
volontairement compléter une règle antérieure. Ne pas la déplacer sans prouver
l’équivalence de la cascade et sans exécuter `npm test` puis
`npm run test:visuel`.

Le filigrane référencé depuis le sous-dossier utilise volontairement le chemin
`../filigrane-parcours.svg`.
