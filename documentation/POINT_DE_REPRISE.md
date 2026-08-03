# Point de reprise PJJoue — CSS thématique validé

État enregistré le 2 août 2026 après validation complète.

## Version à reprendre

Le dossier de travail validé est :
`C:\Users\inesz\OneDrive\Desktop\PJJoue\PJJoue_V2_TRAVAIL`

L’archive finale est :
`C:\Users\inesz\OneDrive\Desktop\PJJoue\PJJoue_V2_CSS_THEMATIQUE.zip`

## Travail terminé

- La grande feuille de 8 455 lignes a été divisée en dix feuilles thématiques.
- Chaque feuille correspond à une tranche continue de la cascade d’origine.
- Aucune règle ni déclaration n’a été déplacée ou réordonnée.
- Les quatre pages publiques chargent les feuilles dans le même ordre numérique.
- Le chemin relatif du filigrane a été adapté au nouveau sous-dossier.
- Les contrôles CSS analysent encore l’interface complète, y compris entre fichiers.
- ESLint, les contrôles CSS, les 6 tests unitaires, le contrôle structurel et les
  42 scénarios Chromium ont réussi.
- Les 19 captures Windows/Chromium sont restées identiques pixel par pixel.

## Pour continuer

1. Lire `documentation/COMMENCER_ICI.md`.
2. Lire `ressources/styles/README.md` avant toute modification visuelle.
3. Travailler uniquement dans le dossier indiqué ci-dessus.
4. Exécuter `npm test` après toute modification.
5. Exécuter `npm run test:visuel` après toute modification CSS.

## Travail futur non inclus

- Étudier séparément les deux animations sans référence signalées par l’audit.
- Recalculer les déclarations historiques potentiellement surdéfinies avant toute
  suppression, par petits lots visuellement contrôlés.
- Traiter séparément les points d’accessibilité et la référence
  `theme.iconee`, car ils touchent au comportement JavaScript.

Le rendu et le fonctionnement de référence ne doivent jamais être modifiés sans
décision explicite.
