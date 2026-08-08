# Point de reprise PJJoue — CSS thématique validé

État enregistré le 2 août 2026 après validation complète.

## Version à reprendre

Utiliser une copie locale de la version validée du projet PJJoue.
Aucun chemin de poste de travail personnel n'est conservé dans cette documentation.

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
3. Travailler dans une copie locale du projet.
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
