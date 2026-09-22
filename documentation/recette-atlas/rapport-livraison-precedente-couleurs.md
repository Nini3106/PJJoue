# Rapport de validation — Quiz CJPM Atlas V1

**21 septembre 2026 · couleurs renforcées et lecture plus confortable · livraison locale**

## Version et provenance

Cette livraison reste en **V1** (`package.json` : `1.0.0`, format de sauvegarde :
`V1`). Elle prolonge l’archive complète `Quiz-CJPM-Atlas-Refonte-Complete.zip`
livrée dans cette conversation. Cette base provient de l’artefact GitHub Pages
**10633915236**, exécution **35588745797**, commit
`283933f5105b12081bbd94cde14e1c2aa40022d9` de `Nini3106/PJJoue`.

La maquette Atlas originale fournie reste la référence. **Aucun commit, aucune
branche, aucune pull request et aucun déploiement n’ont été créés pour ces
retouches. Aucun fichier du dépôt distant n’a été modifié.**

## Retouches réalisées

Les six familles de couleurs existantes sont plus soutenues. Les cartes ont un
filet supérieur, une bordure et une surface légèrement teintés ; les numéros,
barres et repères d’étape ont davantage de présence. Le papier crème, les panneaux
ivoire, le bleu principal, le jaune Atlas et les grands titres serif sont conservés.
Les zones de lecture restent claires et le texte courant conserve une couleur
stable. Les couleurs fonctionnelles de succès, d’erreur et d’avertissement restent
distinctes des couleurs de parcours.

L’étoile filante, son astre et ses deux traînées héritent de la couleur de leur
contexte : étape, parcours ou étape de mini-jeu. Les conditions de maîtrise et le
comptage n’ont pas changé. Une étape garde une étoile sans nombre ; un parcours
conserve le compteur existant. Leur placement dans le flux des cartes évite les
chevauchements avec les textes.

À la taille Normale, le texte courant passe à **17 px**, les contrôles à **16 px**,
le texte secondaire à **15 px** et les petits repères à **14 px**. La navigation
principale est à **15,5 px sur ordinateur**, **14 px sur petit écran** et les entrées
du menu Plus à **16 px**, avec une graisse renforcée. Les réglages de taille du
texte continuent de fonctionner. Sous 480 px, les cartes de parcours passent sur
une colonne pour ne pas comprimer leurs intitulés. Le menu reste dans l’écran,
y compris avec le réglage Grande.

Ces modifications sont intégrées dans les sources CSS existantes, sans ajouter
une feuille de rustines. `Palette-Atlas.js` centralise les accents de présentation.
Les cartes, les questions et la révision utilisent la même fonction de couleur
d’étape ; les guides PJJ et les missions utilisent les mêmes identités partagées.
Les fichiers publics sont reconstruits par le constructeur du projet.

## Préservation du jeu

Les **sept fichiers de données** restent identiques octet pour octet à la livraison
précédente : **960 questions**, programmes, sigles, mesures et sources inchangés.
Les **264 identifiants HTML d’origine** sont conservés, sans doublon.

Les **33 fichiers JavaScript sources présents dans la première archive Atlas** ont
été comparés : 27 sont inchangés et six comportent seulement les substitutions
visuelles recensées. Un test inverse ces substitutions et vérifie l’empreinte de
chaque version antérieure. Le nouveau module de palette ne modifie ni score,
validation, identifiant, ordre des questions, consentement ni sauvegarde.

Les sept formats de questions, chronomètres, jokers, dé, commandes de reprise et
révision, bilans, évaluations, export/import et mini-jeux restent présents. Aucune
nouvelle migration de progression n’est introduite par cette livraison.

## Contrôles obtenus sur cette livraison

| Contrôle | Résultat |
|---|---|
| Recette navigateur Atlas | **154 / 154 scénarios réussis** |
| Actions interactives | 38 cas ordinateur/mobile : navigation, consentement, installation simulée, entraînement, dé, jokers, chrono, reprise/révision, sauvegarde, missions, infobulles et sept formats de réponse. |
| Dispositions de l’application | 74 vues/états, largeurs de 320 à 1920 px selon le scénario. |
| Pages autonomes | 42 vues : 21 pages sur ordinateur et mobile. |
| Recette ciblée couleurs et lisibilité | **12 / 12 scénarios réussis**, à 320, 390, 768 et 1440 px. |
| Étoiles contextuelles | **105 étoiles vérifiées par largeur** : six cartes d’accueil, six cartes de sélection, 66 étapes, six évaluations et 21 étapes de mini-jeux. Teinte, traînées, compteurs et absence de chevauchement avec leur texte contrôlés. |
| Identité des étapes | Les **66 étapes** ont la même couleur sur leur carte, leur question et leur repère de révision, contrôlées aux quatre largeurs. |
| Texte agrandi | Réglage Grande (115 %) et retour à Normale, menu ouvert et huit espaces contrôlés aux quatre largeurs. |
| Socle unitaire | **97 / 97 tests réussis** : données, intégrité, construction, missions, guides et contrôles du corpus. |
| Logique native Node | **37 / 37 tests réussis**. |
| Recette native d’interface | Six parcours, 66 étapes, six évaluations et **562 contrôles de réponses réussis**. |
| Syntaxe JavaScript | **50 / 50 fichiers valides**. |
| Structure et doublons CSS | Aucun doublon strict ni déclaration répétée détectés par les contrôles du projet. |
| Structure d’accessibilité | **41 pages** contrôlées : langue, titre, h1, identifiants, images et champs. |
| Navigation pédagogique | Zéro référence visible imposant un autre parcours. |
| Transport HTTP local | **108 fichiers** : statut 200 et octets identiques ; route inexistante : 404. Client Python, pas navigation Chromium. |

Les traces sont dans `documentation/recette-atlas/`. La recette spécifique est
reproductible par `python tests/verifier_atlas_v1_couleurs.py` ou
`npm run test:atlas-v1-couleurs`. L’empreinte de l’archive de départ et les fichiers
comparés sont consignés dans `retouches-v1-integrite.json`. Le détail graphique
est dans `retouches-v1-design.md`.

## Limites de validation

Les essais utilisent **Chromium 144.0.7559.96 sous Debian Linux**. L’environnement
bloque la navigation du navigateur vers HTTP et les fichiers locaux. Le vrai HTML,
le vrai CSS et le vrai moteur sont donc chargés en mémoire ; l’écriture de l’URL
est neutralisée et le stockage est simulé. Les essais d’installation, de
consentement et d’export emploient les fixtures décrites dans les scripts. Le
transport local est contrôlé séparément avec un client HTTP Python.

L’installation réelle de la PWA, son cache hors connexion, les mises à jour d’une
installation existante, les fenêtres système de Windows et les autres navigateurs
ou appareils restent à essayer sur l’appareil cible. Il ne s’agit ni d’une
certification d’accessibilité ni d’une garantie absolue d’absence de bug. Aucun
nouvel audit juridique du contenu n’est revendiqué. ESLint n’a pas été exécuté ;
les contrôles syntaxiques Node et les suites explicitement listées l’ont été.

Les captures montrant des étoiles utilisent une progression de démonstration
dans le seul navigateur de test. **Aucune progression fictive n’est enregistrée
dans le site livré ou dans une sauvegarde utilisateur.**

## Essai local

Extraire tout le ZIP dans un nouveau dossier puis ouvrir **`ESSAYER_ATLAS.bat`**.
Le site est déjà construit ; Node.js ou Python suffit au lanceur, sans installation
des dépendances de développement. Ne pas remplacer le dossier GitHub actuel.

L’aperçu local et le site en ligne ont des stockages séparés. Pour reprendre ses
acquis dans l’aperçu, exporter depuis le site actuel, conserver la sauvegarde
originale, puis l’importer dans l’aperçu. Le format reste celui de la V1.

**Toute mise en ligne attend la validation explicite de la propriétaire.**
