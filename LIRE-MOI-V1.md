# Quiz CJPM V1 — Guide d’essai local

**Livraison locale à valider. Rien n’a été envoyé sur GitHub ni mis en ligne.**

## Ouvrir le site

Extrais **tout le ZIP dans un nouveau dossier**, puis double-clique sur
**`ESSAYER_QUIZ_CJPM.bat`**. Garde la fenêtre du lanceur ouverte pendant l’essai.
Ne remplace pas ton dossier GitHub actuel. Ferme l’ancien aperçu avant de lancer celui-ci.

Le site est déjà construit : aucune installation de dépendances n’est nécessaire
pour jouer. Le lanceur utilise Node.js ou Python 3, et ouvre `http://127.0.0.1:4173`.
L’écoute est limitée à cet ordinateur. Il ne publie rien sur Internet.
`ESSAYER_ATLAS.bat` reste un alias compatible ; ce nom historique n’apparaît plus
dans le site.

Sur macOS/Linux : `node outils/essayer_atlas.js` ou
`python3 outils/essayer_atlas.py`, depuis ce dossier. En l’absence de Node/Python,
le lanceur Windows propose d’ouvrir `index.html` ; les fonctions PWA ne sont alors
pas disponibles. L’aperçu par serveur local reste préférable.

## Ce qui change dans cette finition

Une seule barre bleu nuit **#172D48**, avec logo et slogan à gauche, menus à droite.
Les libellés et « Quiz » reprennent le beige du papier. Le logo a un fond beige et
un q bleu nuit. « CJPM » conserve **#214FBA** sur un petit cartouche beige lisible.
La barre garde sa largeur ; sur petit écran, les éléments se répartissent dans le
même bandeau. « Explore les parcours CJPM » remplace la dénomination Atlas visible.

Le papier **#EAE3D5**, avec une profondeur discrète vers **#DDD3BF**, reste dans la
même famille beige. Les cartes demeurent claires. Parcours, étapes et étoiles
gardent leurs identités colorées.

Les listes de **Réviser** et **S’entraîner**, y compris les entraînements des
mini-jeux, utilisent les couleurs canoniques : fond clair teinté au repos, teinte
renforcée pour la sélection et filet coloré. Le résumé du menu fermé garde la
couleur de son choix. Les cartes de question utilisent le même accent d’étape
pour les choix interactifs, classements, associations et leurs fils de liaison,
remise en ordre, élimination et focus de réponse écrite. Les corrections gardent
leur sens vert/rouge ; elles ne sont pas confondues avec l’identité du parcours.

## Taille du texte

**Grande (115 %) est le réglage par défaut**, y compris sur les guides et les pages
annexes. Les choix **Compacte / Normale / Grande** restent disponibles dans
**Plus → Paramètres → Taille du texte**.

Une préférence valide déjà enregistrée est respectée : cette livraison ne force
pas le remplacement d’un choix précédent. Pour voir la nouvelle grande taille
avec une ancienne sauvegarde, sélectionne simplement « Grande » une fois dans
les paramètres. À la taille normale, la base reste de 17 px ; Grande donne 19,55 px
au texte courant. Les titres gardent leur hiérarchie et le menu reste adaptatif.

## Progression et contenu

Toujours **V1** : aucun changement de format de sauvegarde, d’identifiants, de
questions, de validation, de score ou d’ordre pédagogique. Les 960 questions et
les sept fichiers de données sont identiques à la livraison précédente.

La progression du site en ligne et celle de l’aperçu local sont séparées. Pour
reprendre tes acquis, utilise **Paramètres → Exporter ma progression** sur le site
actuel ; conserve ce fichier original, puis importe-le dans l’aperçu. Ne réinitialise
pas ton site en ligne. Les captures de recette utilisent des données fictives dans
le seul navigateur de test ; elles ne sont jamais enregistrées dans le site livré.

## Sources et reconstruction

Modifie les sources dans `code/`, pas leurs copies générées dans `ressources/`.
La barre et les jetons partagés vivent dans `code/01 - Éléments communs/atlas-systeme.css`.
La structure est dans le gabarit principal et les sources des pages autonomes.
Les couleurs du jeu restent centralisées ; les fichiers historiques contenant
« Atlas » gardent leur nom technique pour ne pas casser les chemins et les outils.

```sh
python outils/construire_donnees.py
python outils/construire_site.py
python outils/construire_seo.py
python outils/construire_manifeste.py
```

Après la toute dernière modification, régénère le manifeste. Les mêmes commandes
avec `--verifier` contrôlent l’intégrité de la construction. Pour créer un ZIP :

```sh
python outils/creer_archive_utf8.py Quiz-CJPM-V1-a-valider.zip
```

Cette commande ne publie rien. Les noms accentués restent encodés en UTF-8.

## Vérifications et limites

Le rapport de la dernière correction est **`RAPPORT-CORRECTION-ENTETE-V1.md`**. Le précédent rapport fonctionnel est **`RAPPORT-VALIDATION-V1.md`**. Les traces actuelles sont dans
`documentation/recette-v1-finitions/`. Les documents de `recette-atlas/` décrivent
les livraisons antérieures et ne remplacent pas le rapport courant.

Pour reproduire les vérifications après installation des dépendances de
 développement : `npm test`. La nouvelle recette ciblée se lance avec
`npm run test:finitions-v1` ; ajoute `--captures` à la commande Python directe
`python tests/verifier_finitions_v1.py` pour générer les captures.

Les tests exécutent le vrai HTML, CSS et JavaScript construits dans Chromium,
avec une origine en mémoire et un stockage de test. La navigation HTTP/file de
Chromium est bloquée par l’environnement de livraison. Le transport HTTP local
est contrôlé séparément avec un client Python. L’installation réelle, le cache
hors connexion, la mise à jour d’une PWA installée et les autres navigateurs
restent à essayer sur tes appareils. Ces contrôles ne sont ni une certification
d’accessibilité ni une garantie absolue d’absence de bug.

**La publication a été autorisée dans la conversation, mais elle n’a pas été exécutée : les actions d’écriture GitHub ne sont pas disponibles dans la session ayant produit cette archive.** Le lanceur reste strictement local et ne publie rien.
