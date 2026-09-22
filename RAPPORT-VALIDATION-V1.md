# Quiz CJPM V1 — Rapport de validation des finitions

**21 septembre 2026 · livraison locale complète, sans publication**

## Provenance et périmètre

Cette archive prolonge exactement `Quiz-CJPM-Atlas-V1-Couleurs-Lisibilite.zip`
livrée dans la conversation. Son empreinte figure dans
`documentation/recette-v1-finitions/provenance-integrite.json`. La refonte initiale
provenait du commit `283933f5105b12081bbd94cde14e1c2aa40022d9` du dépôt
`Nini3106/PJJoue`. Aucun fichier du dépôt distant n’a été modifié. Aucun commit,
branche, pull request ni déploiement n’a été créé pour ces finitions.

**Version conservée : V1 / package 1.0.0.** Le contenu complet du site et ses sources
sont inclus. Toute mise en ligne attend la validation explicite de la propriétaire.

## Modifications intégrées aux sources

La bande supérieure séparée est supprimée. Une seule barre, de la même largeur,
réunit l’identité et la navigation. Son fond est **#172D48** ; les entrées du menu,
« Quiz » et le slogan sont beige **#EAE3D5**. Le logo est inversé : fond beige et
q bleu nuit. « CJPM » garde **#214FBA**, en italique, sur un petit cartouche beige
pour ne pas perdre sa lisibilité sur le fond sombre. Sur ordinateur, l’identité
est à gauche et les cinq entrées à droite ; sur mobile, le même conteneur se
répartit sur plusieurs lignes sans recréer un second bandeau.

Les 22 en-têtes (application et 21 pages autonomes) partagent les mêmes règles.
La fermeture du menu Plus au clavier et la lecture des préférences sont aussi
branchées sur les cinq pages annexes qui ne chargeaient pas encore la navigation
commune. Les IDs et les destinations existantes sont conservés.

« Explore les parcours CJPM » remplace l’appellation Atlas visible. Aucun texte
Atlas ne demeure dans le contenu HTML des 22 pages principales/annexes. Les noms
techniques de certains fichiers gardent cette origine historique afin de ne pas
renommer arbitrairement les chemins, les modules ou les anciennes preuves.

Le papier utilise **#EAE3D5** et une profondeur discrète vers **#DDD3BF**. Les cartes
restent ivoire ; l’identité des six parcours et des étapes est conservée.

Les sélections de questions (réponses multiples, association, classement, ordre,
élimination et focus écrit) reprennent l’accent de l’étape. Les fils du mode Relier
ont la même couleur. Les retours de correction vert/rouge restent sémantiques.
Pour une réponse unique, la correction étant immédiate, son état final conserve
également ce sens de réussite/erreur.

Les listes Réviser et S’entraîner reprennent le style des étapes : fond tinté
léger, accent coloré et sélection plus affirmée. Les résumés fermés gardent
l’identité du choix actif. Les entraînements des missions utilisent les mêmes
identités, y compris les étapes 7 à 9 de Mission Sigles qui étaient exclues par
une ancienne borne numérique de présentation.

**Grande (115 %) est le défaut**, soit 19,55 px pour le texte courant basé sur
17 px à la taille normale. Compacte, Normale et Grande restent accessibles dans
les paramètres. Une préférence valide déjà enregistrée est respectée ; aucun
choix antérieur n’est écrasé. Les guides, pages légales, sources et administration
lisent le même réglage. Aucun nouveau format ni aucune migration de sauvegarde
n’est ajouté.

Ces modifications remplacent les règles dans les sources communes ou celles
des composants. Aucun thème historique supplémentaire ni feuille de rustines
n’est chargé par-dessus le site. Les fichiers publics sont reconstruits depuis
`code/` avec les outils existants.

## Intégrité du fonctionnement

Les **sept fichiers de données sont identiques octet pour octet** à l’archive de
départ, dont les **960 questions**. Les 264 IDs HTML du site de référence restent
présents, sans doublon. Les fichiers de logique, scores, réponses, chronomètres,
jokers, progression, export/import et consentement sont contrôlés par les suites
de non-régression et les contrats d’empreintes existants.

Les écarts JavaScript de cette finition concernent six sources et sont recensés
dans `tests/v1_finitions_changements.json`. Un test inverse précisément chaque
substitution puis compare le SHA-256 à l’archive précédente. Les empreintes
historiques originales ne sont pas remplacées pour faire passer le test. La seule
modification de défaut utilisateur est le réglage Grande expressément demandé ;
les autres substitutions concernent la présentation des couleurs et la lecture
de cette préférence sur les documents autonomes.

## Résultats exécutés

| Contrôle | Résultat |
|---|---:|
| Recette générale : 38 interactions, 74 dispositions et 42 vues de pages autonomes | **154 / 154** |
| Contrôle complémentaire des pages autonomes, dont fermeture Escape stricte | **42 / 42 vues** |
| Nouvelle recette ciblée : barre, couleurs, préférences et sept formats | **40 / 40** |
| Recette couleurs, étoiles et lisibilité | **12 / 12** |
| Socle unitaire, corpus, intégrité et construction | **98 / 98** |
| Logique native Node | **37 / 37** |
| Recette native de contenu et réponses | **562 contrôles de réponses réussis** |
| Syntaxe JavaScript | **50 / 50 fichiers valides** |
| CSS | Aucun doublon strict, déclaration répétée ni incohérence de structure détecté |
| Structure d’accessibilité | **41 pages contrôlées** |
| Navigation pédagogique libre | Aucune référence inter-parcours imposée dans le contrôle existant |
| Transport HTTP local par client Python | **79 fichiers : statut 200 et octets exacts ; route inexistante : 404** |

La barre est contrôlée à 320, 390, 768, 1024, 1280 et 1440 px. La recette ciblée
vérifie les six parcours et 66 étapes de Réviser, les options de S’entraîner et
des missions, les sept formats et les fils d’association sous les 66 identités
d’étape. Les tests de préférence vérifient le défaut, les trois choix, les valeurs
anciennes et le retour sur l’application, les guides et les sources. Les étoiles
contextuelles et leurs traînées restent vérifiées à quatre largeurs (105 étoiles
par largeur). Les données de ces essais existent uniquement dans le navigateur
de test.

Les traces et résultats JSON de cette livraison se trouvent dans
**`documentation/recette-v1-finitions/`**. Les tests sont reproductibles depuis
les commandes de `package.json`. Les documents et traces de `recette-atlas/`
sont historiques et ne remplacent pas le présent rapport.

## Limites précises

Exécution sous **Chromium 144.0.7559.96, Debian Linux**. La navigation du navigateur
vers HTTP/file est bloquée par l’environnement de livraison. Le vrai HTML/CSS/JS
construit est donc exécuté en mémoire, avec stockage de test et neutralisation de
l’écriture d’URL. Les essais d’installation et les frontières de téléchargement,
de consentement et de sauvegarde utilisent les fixtures de recette ; ils ne sont
pas des essais système réels. Le transport HTTP est vérifié séparément par Python.

L’installation réelle, le cache hors connexion, la mise à jour d’une application
PWA déjà installée, les fenêtres Windows et les autres appareils/navigateurs
restent à essayer avant publication. Les contrôles de structure ne constituent
pas une certification d’accessibilité et aucun nouvel audit juridique du contenu
n’est revendiqué. ESLint n’est pas présenté comme exécuté : le contrôle de syntaxe
Node et les tests explicitement énumérés l’ont été.

Les captures d’exercices ou de révision utilisent une progression de démonstration.
**Aucune progression fictive ou personnelle n’est injectée dans le site livré.**

## Essai local

Extraire tout le ZIP dans un nouveau dossier, puis ouvrir
**`ESSAYER_QUIZ_CJPM.bat`**. Lire `LIRE-MOI-V1.md`. Ne pas remplacer le dossier
GitHub actuel pendant la validation. L’aperçu et le site en ligne ont des stockages
séparés ; exporte et conserve une copie de ta progression avant de l’importer dans
l’aperçu. Une taille choisie dans une ancienne sauvegarde reste respectée.
