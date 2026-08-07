# Architecture de PJJoue V1

## Principe général

PJJoue est une application web statique. Le navigateur charge l’interface, les données et le moteur sans serveur applicatif. La progression est enregistrée dans `localStorage` sous une clé propre à la V1.

## Chaîne de chargement

1. Les pages publiques chargent les feuilles de `ressources/styles/` dans leur ordre numérique.
2. `donnees/donnees-pjj.js` expose les thèmes, programmes, sources et questions dans `window.DONNEES_PJJ`.
3. `ressources/moteur-jeu.js` initialise la sauvegarde, restaure la route, branche les commandes et affiche l’écran demandé.

Les fichiers JSON de `donnees/` restent les sources de vérité. `outils/construire_donnees.py` produit le fichier JavaScript utilisé par le navigateur.

Avant toute génération, `outils/validation_donnees.py` contrôle les champs obligatoires et les relations internes des activités : identifiants uniques, réponses multiples, ordres, associations, classements et références de sources. Le build s’arrête en présentant toutes les anomalies plutôt que de produire un fichier partiellement valide.


## Guides pédagogiques publics

Les répertoires `decouvrir-la-pjj/`, `organisation-pjj/`, `metiers-pjj/`,
`structures-pjj/`, `mesures-educatives-pjj/`, `sigles-pjj/` et `quiz-pjj/`
contiennent chacun un `index.html` statique avec une URL canonique propre.
Ces pages n’embarquent pas le moteur du jeu : elles présentent des synthèses
pédagogiques, renvoient vers les sources officielles et assurent le maillage
interne vers le parcours. Leur présence dans `sitemap.xml` est contrôlée par
`tests/verifier_v1.py`.

## Répartition des responsabilités

### `ressources/moteur-jeu.js`

Le moteur est organisé dans l’ordre suivant :

1. utilitaires et sauvegarde locale ;
2. navigation, historique et fenêtres ;
3. progression et préparation des sessions ;
4. affichage et validation des activités ;
5. chronomètre, jokers, correction et bilan ;
6. révision, paramètres, sons et branchement des commandes.

Une fonction doit porter le nom exact de son action. Par exemple : `afficherQuestion`, `validerEliminations`, `utiliserLangueAuChat`, `terminerSession`.

### `ressources/styles/`

Les dix feuilles historiques sont des tranches continues de l’ancienne cascade. Leur
préfixe numérique définit leur ordre de chargement et ne doit pas être
modifié. La feuille `85-guides-pedagogiques.css`, ajoutée après cette séparation,
regroupe uniquement les pages pédagogiques publiques et leur maillage interne.
Aucune règle historique n’y a été déplacée.

Le fichier `ressources/styles/README.md` indique le contenu et les bornes
fonctionnelles de chaque feuille. Les ajustements responsive restent dans la
tranche où ils intervenaient historiquement lorsque leur déplacement aurait
changé la cascade.

Les classes et variables appartenant à PJJoue sont en français. Les propriétés
CSS imposées par le standard web ne sont pas traduites.
### `ressources/consentement-analytics.js` et `ressources/analytics-pjjoue.js`

Le premier module conserve le choix du visiteur, applique le mode consentement Google et charge le conteneur uniquement après acceptation. Le second expose `window.PJJ_ANALYTICS.envoyer()` et refuse silencieusement tout événement tant que la mesure d’audience n’est pas autorisée.

Le moteur produit des événements sémantiques français (`pjjoue_page_consultee`, `pjjoue_session_commencee`, `pjjoue_reponse_validee`, etc.) à partir des fonctions centrales. L’identité d’une question repose sur son champ `id`, transformé pour Analytics en identifiant stable de type `Q037`. Son énoncé courant est également envoyé dans `pjjoue_nom_question` pour rendre les analyses lisibles. L’ordre, l’étape, la formulation, les distracteurs, le type d’activité, l’explication et les aides peuvent évoluer sans perdre la continuité tant que l’identifiant n’est pas recyclé pour une question différente.

### `ressources/administration.js`

L’outil d’administration travaille sur une copie locale de la banque. Il permet de filtrer, modifier, contrôler et exporter les questions. Il ne modifie jamais directement les fichiers JSON présents sur le disque.

## État du jeu

L’objet `etat` contient uniquement la session en cours : écran, étape, question courante, score, brouillons d’activité, jokers et chronomètre.

L’objet `sauvegarde` contient les informations persistantes : progression, erreurs à retravailler, paramètres, questions découvertes et résultat de l’évaluation finale.

Toute donnée importée passe par `nettoyerSauvegarde` avant d’être utilisée.

## Navigation

`afficherEcran` est l’unique point d’entrée pour changer d’écran. Ses options sont explicites :

- `remplacerHistorique` : remplace l’entrée courante de l’historique ;
- `forcerSortieQuestion` : autorise une sortie contrôlée de l’écran question ;
- `depuisHistorique` : indique une restauration déclenchée par le navigateur.

## Activités

Chaque question indique son mode et, lorsque nécessaire, une structure `activite`. Le moteur ne fabrique pas une activité en mélangeant plusieurs questions. Les actions visibles sont reliées à des valeurs `data-action` françaises, par exemple `valider-activite`, `deplacer-ordre` ou `selectionner-association`.

## Étape 11

L’évaluation finale utilise exactement Q111 à Q160. Elle est accessible lorsque les onze étapes du parcours ont été terminées sans joker. Elle ne propose ni joker ni bouton pour passer une question. Son bilan affiche `Évaluation terminée` et permet de refaire l’évaluation ou de revenir au parcours.

## Carnet de parcours

Le carnet complète le chemin existant sans créer une seconde progression. Il lit uniquement les résultats déjà enregistrés pour afficher :

- l’avancement réel dans les 110 questions du parcours ;
- la prochaine destination utile ;
- l’étape à rejouer lorsqu’elle doit encore être validée sans joker ;
- un titre symbolique calculé à partir du nombre d’étapes maîtrisées.

Les fonctions `obtenirTitreSymboliqueParcours`, `obtenirProchaineDestinationParcours`, `calculerAvancementCarnetParcours` et `actualiserCarnetParcours` ont chacune une responsabilité unique. Les titres ne donnent aucun avantage et ne sont pas enregistrés séparément : ils sont toujours recalculés depuis la progression réelle.

Chaque étape de `donnees/programme.json` définit aussi une `couleur` et trois `souvenirs`. La couleur identifie la destination dans le chemin, les questions et la carte finale. Les souvenirs ne sont affichés qu’après la maîtrise de l’étape ; ils restent modifiables dans les données sans toucher au moteur.

Les défis personnels réutilisent trois informations existantes : les étapes terminées sans joker, la meilleure série autonome et les erreurs actives. Seule `meilleureSerie` est ajoutée à la sauvegarde afin que le défi de série survive à la fermeture du navigateur. Elle est nettoyée à l’importation comme les autres valeurs numériques.

Le bouton principal de l’accueil est actualisé par `actualiserBoutonPrincipalAccueil`. Il propose de commencer lorsque la progression est vide, puis de reprendre la première étape utile ou d’ouvrir le carnet lorsque le voyage est complet.

`lancerTransitionVersEtape` affiche brièvement la prochaine destination avant de lancer l’étape depuis le bilan. La transition ne crée ni écran ni état persistant supplémentaire.

Après la réussite de l’évaluation, `afficherCarteVoyageFinale` présente les onze destinations. Les dix premières ouvrent la fiche pédagogique correspondante dans le carnet.

Les célébrations de fin d’étape utilisent ce même vocabulaire de voyage. Elles conservent les sons et confettis existants, uniquement lorsqu’une étape est validée en autonomie ou lorsque l’évaluation finale est réussie.

Pendant une session, `actualiserIndicateurSerie` rend visible la série déjà calculée par le moteur à partir de deux réussites autonomes consécutives. L’indicateur n’ajoute aucune donnée persistante et disparaît dès que la série revient à zéro.

À la fin d’une session, `actualiserProchaineDestinationBilan` complète le bilan existant avec une direction adaptée au mode joué. Cette indication ne remplace ni les erreurs détaillées ni les boutons de navigation.

## Système visuel des composants

Les cartes, boutons et choix racontent le voyage sans ajouter de décoration gratuite :

- les cartes principales utilisent une surface bleue calme, une bordure claire fine et une ombre légère ;
- les surfaces internes utilisent un bleu plus profond pour montrer leur appartenance à la carte ;
- la couleur propre à l’étape représente la destination active et marque le haut de la carte de question ;
- le jaune indique un choix actif, une direction ou l’action principale à poursuivre ;
- le vert et le rouge sont réservés aux résultats corrects et incorrects ;
- les boutons restent bleus au repos, obtiennent un contour jaune au survol et un fond jaune lorsqu’ils sont sélectionnés.

Les variables `--surface-carte`, `--surface-carte-profonde`, `--bordure-carte` et `--ombre-carte` centralisent cette grammaire. Une nouvelle carte doit les réutiliser au lieu de recréer un dégradé ou une ombre isolée.

Dans l’écran de question, `afficherReperesQuestion` rassemble les informations utiles en trois repères : la position actuelle, la destination et le mode de réponse. Après une réussite autonome, la classe `jalon-valide` allume brièvement un jalon vert sur la carte. Ce jalon reste uniquement visuel : le résultat est toujours annoncé par la zone de correction accessible.

Les transitions de question et de correction sont volontairement courtes. Elles sont neutralisées par la préférence système de réduction des animations. Sur mobile, la carte conserve une hauteur minimale mais peut grandir pour accueillir les énoncés et réponses longues sans les comprimer.

Le Carnet de voyage est un écran indépendant accessible depuis la navigation principale. Il regroupe uniquement la prochaine destination, la progression du voyage, les souvenirs et les défis personnels. Les deux outils facultatifs sont intégrés à la carte de Parcours PJJ : le défi chrono configure seulement les prochaines étapes du parcours, tandis que le défi du hasard appelle `lancerDeParcours`, mémorise temporairement une face de 1 à 6 puis `jouerTirageDeParcours` lance exactement le même nombre de questions aléatoires en mode libre. Ce tirage ne modifie pas les règles de validation des onze étapes.

Le dé du hasard est un SVG en perspective. La propriété `data-face` portée par `de-objet` commande uniquement les points de la face avant ; les faces supérieure et latérale restent décoratives. La zone `souvenirsParcours` possède une hauteur maximale et un défilement vertical automatique : la barre latérale n’apparaît que lorsque les fiches dépassent l’espace prévu.

`actualiserResumeCarteParcours` alimente l’en-tête intégré à l’encadrement de la carte des destinations avec un résumé utile : nombre de destinations maîtrisées sans joker et état d’ouverture de l’évaluation. Le carnet de voyage reste consacré aux informations personnelles du joueur. Les titres des écrans secondaires partagent enfin le même espace supérieur sous la navigation.

L’en-tête de la carte utilise une icône de plan dessinée directement en SVG, tandis que le carnet conserve sa boussole. Ces deux icônes ont le même gabarit mais des rôles distincts. Une marge structurelle sépare l’objectif général du carnet afin que la cible ne touche jamais l’encadrement suivant.

`sessionAUtiliseJoker` lit uniquement `etat.sessionAvecJoker`, activé par `marquerJokerUtilise` au moment réel où une aide est consommée. `synchroniserEtapesReussiesEnAutonomie` répare les anciennes sauvegardes lorsque toutes les réponses d’une étape sont déjà enregistrées comme autonomes. Ainsi, le défi personnel, les souvenirs, la destination suivante et la carte d’étape utilisent toujours le même état `termineeSansJoker`.

Dans Progression, la fiche compacte du parcours ne contient aucune action. Le bouton statique `boutonOuvrirParcoursProgression` appartient à la zone d’actions de la grande carte et s’aligne avec les commandes Exporter et Importer de la carte voisine.

Le bouton `boutonRetourGlobal` est placé au début du contenu principal et non dans la navigation. Il reste dans le flux sur toutes les largeurs d’écran. `ajusterQuestionAEcran` déduit sa hauteur de l’espace disponible afin que cette commande contextuelle ne comprime pas les questions.

Dans le bilan, seule la zone `listeErreursBilan` défile lorsque les corrections sont nombreuses. Son titre, le compteur et les boutons restent visibles hors de cette zone ; sa hauteur s’adapte aussi à celle de l’écran.

La carte de question utilise une taille de texte commune à tous les modes. La variable de densité ne sert plus à modifier la police des réponses : elle compacte seulement les espacements lorsque la hauteur disponible diminue. Pour le mode « Remettre dans l’ordre », cette taille est appliquée à la ligne `ordre-liste li` et à son contenu `ordre-texte` ; les petites commandes fléchées restent des commandes et ne déterminent pas la taille du choix. Les actions principales (`Valider`, `Question suivante`) et secondaires (`Question précédente`, `Passer`, `Jokers`) partagent désormais la même géométrie. Le bouton des jokers appartient à la barre d’actions et n’est plus un onglet latéral.

Le filigrane `ressources/filigrane-parcours.svg` rassemble la route, la boussole, la carte et le carnet. Il est appliqué au fond des écrans hors accueil avec une opacité contenue (`.17` sur grand écran et `.12` sur mobile) et ne reçoit aucune interaction.

L’icône cible de l’objectif conserve son SVG et son emplacement. Son trait de `3.2` et son ombre légère reprennent la finesse des icônes de carte et de boussole.

Les pictogrammes de révision et de progression utilisent des SVG au trait commun (`2.6`). Les couleurs existantes restent sémantiques : turquoise pour l’entraînement et la révision aléatoire, jaune pour la révision par étape et la progression du parcours. La carte du parcours réemploie le dessin cartographique de la page Parcours PJJ.

Les phrases produites par `activite-consigne` sont des indications secondaires communes à tous les modes. Leur texte utilise `.88rem`, tandis que le badge du mode utilise `.72rem`. Les compteurs d’élimination et de choix ordonné restent légèrement plus petits (`.82rem`).

La grille de Progression est limitée à `1080px`. Ses deux cartes principales utilisent une hauteur minimale de `440px` et un espacement intérieur réduit ; sous `980px`, leur hauteur redevient naturelle pour éviter les vides sur les écrans étroits.

## Système responsive mobile

Le dernier bloc mobile de `ressources/styles/` sert de référence finale entre `320px` et `820px`. Il neutralise les anciennes adaptations contradictoires. La navigation reste sur une ligne défilable avec des zones tactiles de `42px` à `44px`, les cartes passent en colonne avec un espacement constant et les actions occupent toute la largeur disponible. Sous `420px`, les commandes de question passent sur une seule colonne. Le bouton `boutonMenuJokers` reste toujours dans la barre d’actions et ne redevient jamais un onglet latéral.

Sous `580px`, la navigation utilise une grille de six colonnes : les trois premiers boutons occupent chacun deux colonnes et les deux derniers trois colonnes. Les cinq destinations sont donc entièrement visibles sur deux lignes, sans texte coupé. Les cartes d’entraînement prennent une hauteur naturelle ; chaque libellé précède sa bascule « Avec / Sans », puis le bouton de lancement reste dans le flux avec une marge propre.

Les icônes `entrainement-icone-ordonne` et `entrainement-icone-melange` utilisent le même trait `2.6` que les autres pictogrammes narratifs. Leurs couleurs historiques, jaune et turquoise, sont conservées.

Sur téléphone, les boutons du menu sont des pastilles compactes dimensionnées par leur texte et réparties automatiquement sur plusieurs lignes. L’accueil n’utilise plus de hauteur fixe avec contenu masqué : sa hauteur est naturelle et son contenu reste dans le flux. Le pied de page mobile conserve uniquement les liens juridiques, sur une zone compacte située après l’accueil.

## Règles de maintenance

- ne pas modifier `donnees/donnees-pjj.js` à la main ;
- ne pas ajouter une seconde fonction pour contourner une fonction existante ;
- ne pas ajouter une règle CSS corrective en fin de fichier sans vérifier si la règle d’origine peut être corrigée ;
- supprimer immédiatement tout sélecteur, écouteur ou fonction devenu inutile ;
- conserver les noms applicatifs en français et les API web dans leur syntaxe officielle ;
- exécuter les deux contrôles du dossier `tests/` après toute modification ;
- comparer le rendu de référence sur ordinateur, portable et mobile avant une diffusion.
