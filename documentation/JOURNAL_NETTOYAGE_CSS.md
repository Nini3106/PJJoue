# Journal du nettoyage CSS

Ce document permet de reprendre le chantier sans ambiguïté. Il est mis à jour
après chaque lot entièrement contrôlé.

## Référence immuable

- Archive source : `PJJoue_V1_optimisee.zip`
- Empreinte SHA-256 :
  `63d5528faab2cca059b37413236cae06e4860425a1e1d68f314abc8b7c846c5b`
- Manifeste extrait : 44 fichiers vérifiés
- Copie de travail distincte de `PJJoue_FINAL`

L'archive source et `PJJoue_FINAL` sont conservés comme références et ne sont
pas modifiés pendant ce chantier.

## Invariants

1. Aucun changement volontaire d'apparence.
2. Aucun changement du fonctionnement ou des règles du jeu.
3. L'ouverture directe de `index.html` reste possible sans serveur.
4. Les noms propres au projet restent en français et décrivent le visuel ou
   l'action réellement déclenchée.
5. Un seul lot CSS cohérent est appliqué entre deux contrôles visuels.
6. Une référence visuelle ne peut jamais être remplacée automatiquement.

## Nettoyage réalisé le 2 août 2026

- 19 références visuelles déterministes créées pour ordinateur, portable et
  mobile ; leur empreinte porte sur les pixels décodés et non sur les métadonnées
  des fichiers PNG.
- 43 règles strictement dupliquées supprimées.
- 46 déclarations antérieures strictement répétées supprimées.
- 4 paires de blocs `@media` adjacents de même condition fusionnées sans déplacer
  l'ordre relatif des règles.
- Palette principale centralisée dans des variables françaises déjà existantes
  ou ajoutées avec la même valeur calculée.
- Bloc `:root` rangé par rôle pour faciliter la reprise.
- Défi chrono vérifié aux largeurs 360, 390, 580, 760, 820, 821, 1024 et
  1440 pixels, sans débordement de son panneau.
- Contrôles CSS ajoutés à la chaîne de tests et à l'intégration continue.
- Dossier temporaire `test-results` exclu du manifeste et du contrôle de
  structure.

Après chaque lot ci-dessus, les 19 captures sont restées identiques pixel par
pixel à la référence.

## Décisions de prudence

- Pas de réécriture globale en `@layer` : elle modifierait la cascade et serait
  disproportionnée pour un objectif de rendu strictement identique.
- Pas de regroupement de blocs `@media` non adjacents : leur position participe
  à la cascade.
- Pas de conversion des fichiers JavaScript en TypeScript. Le contrôle existant
  utilise TypeScript en mode `allowJs` et `checkJs`, sans émission de fichier.
- Pas de modules ES : l'ouverture locale directe doit rester compatible.

