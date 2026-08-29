# État de validation — PJJoue V1 moderne

**Création : août 2026.**  
**Consolidation éditoriale : 28 août 2026.**

## Contenu pédagogique harmonisé

- 6 parcours ;
- 66 étapes d’apprentissage ;
- 960 questions ;
- 6 évaluations finales ;
- 67 sources ;
- formulations, réponses, aides, corrections et modes de jeu revus selon la charte de la banque ;
- ordre des thèmes et identité permanente des questions conservés.

Les six parcours peuvent être commencés indépendamment. Chaque question reste compréhensible seule, y compris en entraînement libre, et la progression se ressent par la nature des activités sans être annoncée artificiellement à l’utilisateur.

Le parcours 1 suit sa propre progression, indépendamment des fiches de révision et du tableau maître. Dans les parcours 2 à 6, les questions s’appuient sur ces supports et ne conservent un détail supplémentaire que lorsqu’il possède une utilité d’apprentissage concrète, qu’il est introduit de manière accessible et qu’il est réutilisé à un endroit cohérent du parcours.

## Architecture et identité visuelle

L’interface suit une grammaire visuelle unique :

- fond général et surfaces principales : bleus profonds ;
- en-tête et repères de marque : `#0b315d` ;
- texte principal sur ces surfaces : blanc cassé `#f7f8ff` ;
- cadres principaux : bleu profond `#0b3d70` ; contenus intérieurs : bleu `#10477f` ;
- action principale : jaune `#ffc83d` ;
- six couleurs d’accent distinctes pour les six parcours.

Ces couleurs et les règles communes sont définies dans `style-general-pjjoue.css` et `static-pages.css`. Les fragments propres aux pages, tous déclarés dans `code/plan-construction.json`, sont assemblés dans l’unique feuille publique `pjjoue-principal.css`.

L’iconographie des 6 parcours a été redessinée en SVG au trait arrondi, avec un pictogramme propre à la logique de chaque itinéraire. Les 66 étapes, les évaluations et les modes d’entraînement utilisent le même langage graphique.

## Navigation et pages

- toutes les entrées principales sont réunies dans un menu unique ouvrable et repliable ;
- l’ancien libellé **Plus** a été supprimé ;
- **Carnet de voyage** est devenu **Carnet de parcours** dans le visuel et dans les sources ;
- **S’entraîner librement** est masqué sur l’accueil d’un nouvel utilisateur et apparaît après enregistrement d’une progression ;
- les Guides disposent de leur page dédiée ;
- l’appel final de la page Guides est limité à **Passer à la pratique** / **Voir les parcours** ;
- les badges **À découvrir** des 6 cartes de parcours sont contrôlés automatiquement pour conserver les mêmes dimensions.

## Supports de révision

La page **Réviser** comporte une section **Supports de révision** organisée par juridiction. Les fiches pratique et synthétique se suivent pour JE, TPE, JI, JLD, CAM et JAP ; les compléments JAP et le tableau transversal CJPM restent rangés dans leurs groupes respectifs. Les encadrements spécifiques à l’AA et le terme « imprimable » ont été retirés conformément à la consigne de contenu. Une erreur est désormais retirée de la révision dès sa prochaine réussite autonome.

## Compatibilité locale

Pour une utilisation locale dans les conditions normales d’un site web, lancer `npm run dev` depuis le dossier du projet puis ouvrir **http://localhost:4173/**.

L’ouverture directe de `index.html` en `file:` est prise en charge :

- le manifeste PWA n’est injecté qu’en HTTP/HTTPS ;
- le service worker n’est pas enregistré en `file:` ;
- Google Tag Manager reste désactivé en `file:` afin qu’aucun contenu web tiers ne tente d’interagir avec une URL locale ;
- la navigation locale évite les appels d’historique incompatibles avec les URL locales.

## État des contrôles au 28 août 2026

La consolidation éditoriale porte sur l’ensemble des 960 questions. Les contrôles automatiques ciblés de structure, de cohérence éditoriale et de conformité PJJoue disponibles pendant l’harmonisation ont été exécutés sur la banque reconstruite.

Périmètre contrôlé :

- construction : **44 fichiers publics exactement à jour** ;
- données : **960 questions, 67 sources** ;
- structure PJJoue : **6 parcours · 66 étapes · 6 évaluations** ;
- navigation libre : **0 référence inter-parcours visible** ;
- iconographie : **66 étapes + 6 thèmes + modes d’entraînement** conformes ;
- identité V1 : conforme ;
- tests unitaires : **14 réussis** ;
- accessibilité statique : **16 pages contrôlées** ;
- recette visuelle : **44 scénarios réussis** ;
- pages annexes : **19 scénarios réussis** ;
- interface : **6 parcours, 66 étapes, 6 évaluations et 612 contrôles de réponses réussis**.

La campagne automatisée complète `npm test` est réussie sur la version finale reconstruite le 28 août 2026.

Les captures produites par les tests ne sont pas livrées. Les scripts Playwright, les lanceurs Windows et la documentation permettant à une personne ou une IA de les régénérer restent inclus dans l’archive.

## Contrôle ciblé du parcours 2 — 29 août 2026

Une relecture éditoriale et pédagogique complète du parcours 2 a été effectuée sur ses **160 questions**. Les identifiants 1001 à 1160, les étapes et les marqueurs Analytics ont été conservés. La passe a corrigé notamment l’ordre d’introduction de certaines notions, les formulations trop mécaniques, les sigles non développés, les distracteurs prématurés ou trop révélateurs et plusieurs répétitions.

État après reconstruction :

- audit éditorial P2 : **160/160 RAS automatique — relecture humaine** ;
- questions d’apprentissage P2 dépassant 220 caractères : **0** ;
- prérequis pédagogiques orphelins P2 : **0** ;
- références inter-parcours visibles : **0** ;
- structure globale : **6 parcours · 66 étapes · 960 questions · 6 évaluations** ;
- tests unitaires : **14/14 réussis** ;
- accessibilité statique : **16 pages contrôlées** ;
- pages annexes : **19 scénarios PC/mobile réussis** ;
- recette d’interface autonome : **580 contrôles de réponses réussis** ;
- syntaxe JavaScript publique vérifiée par `node --check`.

Le test d’ouverture directe `file://` de Playwright ne peut pas être exécuté dans l’environnement de contrôle utilisé ici (`ERR_BLOCKED_BY_ADMINISTRATOR`) ; les contrôles d’interface indépendants de cette ouverture ont été exécutés avec succès.

## Outils de reprise à conserver

- `INSTALLER_OUTILS_DE_DEVELOPPEMENT.bat` ;
- `CAPTURER_PJJOUE.bat` ;
- `VERIFIER_PJJOUE.bat` ;
- `requirements-dev.txt` ;
- `package.json` et `package-lock.json` ;
- `tests/verifier_regression_visuelle.py` ;
- `tests/verifier_pages_annexes.py` ;
- `tests/verifier_interface.py` ;
- `code/00 - LIRE EN PREMIER/CAPTURES_VISUELLES_ET_TESTS_NAVIGATEUR.md`.

Le dossier `test-results/` est volontairement absent de la livraison : il est recréé automatiquement.

## Version

**PJJoue V1 — Version 1.0 · Août 2026.**

## Relecture éditoriale globale — 29 août 2026

- Les six parcours ont été relus dans leur ordre pédagogique réel.
- Les 960 questions passent l’audit éditorial automatique sans anomalie résiduelle.
- Les formulations numériques télégraphiques ont été naturalisées.
- Les restitutions écrites de l’évaluation finale ont été remplacées par des modes structurés lorsqu’elles exposaient à une réponse trop opaque.
- Les prérequis P2 à P6 sont vérifiés sans notion orpheline.
- Le parcours 2 validé le 29 août 2026 a été conservé strictement inchangé pendant cette passe.
