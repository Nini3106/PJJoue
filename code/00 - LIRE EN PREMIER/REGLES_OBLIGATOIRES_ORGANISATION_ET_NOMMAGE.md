# RÈGLES OBLIGATOIRES D’ORGANISATION ET DE NOMMAGE DU CODE DE PJJoue

## Objectif

Le code de PJJoue doit être organisé de manière à ce que **n’importe quelle personne qui découvre le projet puisse comprendre immédiatement où chercher**, même si elle ne connaît ni l’historique du site ni son fonctionnement technique.

La règle principale est simple :

> **Ce que l’on voit dans PJJoue doit porter le même nom dans le code.**

Une personne doit pouvoir regarder un élément à l’écran, retenir son nom ou ce qu’il représente, puis retrouver ce même nom dans les fichiers sans avoir à deviner le vocabulaire technique utilisé par le développeur.

---

## RÈGLE ZÉRO — UTF-8, SEO/sitemap et manifeste toujours à jour

Cette règle prime sur toutes les autres règles d’organisation.

### Encodage

- Tous les fichiers texte de PJJoue doivent être enregistrés en **UTF-8**.
- Tous les noms de fichiers et dossiers doivent conserver leurs caractères français exacts.
- Les noms mojibake tels que `├ël├®ments communs`, `Entra├«nement libre`, `R├®viser`, `Param├¿tres`, `ÔÇÖ` ou `ΓÇÖ` sont interdits.
- Une archive ZIP destinée à transmettre PJJoue doit conserver le **drapeau UTF-8** pour chaque chemin non ASCII.
- Pour créer une archive, utiliser `python outils/creer_archive_utf8.py` plutôt qu’un outil ou une méthode d’archivage non vérifiée.
- Avant tout commit : `python outils/verifier_noms_fichiers.py` doit répondre OK.

### Manifeste

`MANIFESTE.json` doit correspondre exactement au contenu qui sera commité. Il doit être généré **après** les données, le site et le SEO/sitemap :

```bash
python outils/construire_donnees.py
python outils/construire_site.py
python outils/construire_seo.py
python outils/construire_seo.py --verifier
python outils/construire_manifeste.py
```

Puis il doit être vérifié :

```bash
python outils/construire_manifeste.py --verifier
```

**Toute modification effectuée après la génération de `MANIFESTE.json` impose de le régénérer.** Il est interdit de pousser un manifeste ancien ou calculé avant les derniers changements.

### SEO et URL publiques

À **chaque évolution de la V1**, vérifier les `title`, meta descriptions, canonical, Open Graph, données structurées, URL propres, `robots.txt`, `sitemap.xml` et `lastmod`. Le contrôle obligatoire est :

```bash
python outils/construire_seo.py --verifier
```

Les routes propres de l’application (`/parcours/`, `/revision/`, `/supports/`, `/progression/`, etc.) sont des vues internes et non de nouvelles pages SEO : leurs relais doivent rester `noindex,follow`, canoniser vers l’accueil et rester absents du sitemap. En mode `file://`, les fragments `#...` sont conservés uniquement pour la prévisualisation locale.

Sous Windows, `PREPARER_PJJOUE_AVANT_PUSH.bat` est la procédure obligatoire : elle applique cet ordre et effectue une vérification finale.

---

## 1. Le nom du code doit être fidèle au visuel

Chaque élément visible doit être nommé d’après **ce que l’utilisateur voit ou comprend à l’écran**.

### Exemples

Si l’utilisateur voit :

**Accueil**

le code doit utiliser un nom du type :

`boutonAccueil`

et non :

`btnHome`  
`mainButton`  
`button1`

Si l’utilisateur voit une icône représentant une **boussole**, son nom doit être :

`iconeBoussole`

ou :

`icone-boussole.svg`

et non :

`iconNav`  
`svg12`  
`compassAsset`

Si le bouton visible est :

**Réinitialiser**

le code doit utiliser :

`boutonReinitialiser`

Si l’écran affiche :

**Validées sans joker**

le code correspondant doit utiliser cette même notion :

`validationsSansJoker`

et non une expression technique sans rapport direct avec ce que voit l’utilisateur.

---

## 2. Le français est la langue de référence du projet

Tout ce qui appartient à PJJoue doit être nommé **en français** :

- dossiers ;
- fichiers ;
- variables ;
- fonctions ;
- identifiants HTML ;
- classes CSS lorsque cela est raisonnablement possible ;
- commentaires ;
- documentation ;
- noms des éléments graphiques ;
- noms des actions.

Exemple :

```js
function afficherQuestionSuivante() {
```

est préférable à :

```js
function showNextQuestion() {
```

Les termes imposés par les technologies utilisées ne doivent évidemment pas être traduits.

Par exemple :

`window`  
`document`  
`localStorage`  
`dataLayer`  
`gtag`  
`iframe`  
`@media`  
`aria-label`

restent tels quels lorsqu’ils appartiennent à HTML, CSS, JavaScript, Google Analytics ou à une API externe.

---

## 3. Le code doit pouvoir être compris par un débutant

Le code de PJJoue doit être écrit de manière **explicite plutôt que raccourcie**.

Une personne qui débute en développement doit pouvoir comprendre ce qu’une fonction ou une variable fait simplement en lisant son nom.

Préférer :

```js
const nombreDeQuestionsReussiesSansJoker = 8;
```

à :

```js
const nQOk = 8;
```

Préférer :

```js
function enregistrerLaProgressionDeLUtilisateur() {
```

à :

```js
function saveProg() {
```

Préférer :

```js
// On vérifie si toutes les questions de l'étape
// ont été réussies sans utiliser de joker.
```

à :

```js
// check completion state
```

Les commentaires doivent expliquer **pourquoi une action existe et ce qu’elle provoque**, avec des phrases simples.

Le but n’est pas d’utiliser le moins de mots possible.

Le but est de **ne laisser aucune ambiguïté**.

---

## 4. L'organisation du code doit suivre les pages visibles de PJJoue

Le dossier principal du code doit permettre de retrouver les pages telles qu’elles apparaissent dans le site.

Exemple :

```text
code/

├── Accueil/
├── Parcours PJJ/
├── Carnet de parcours/
├── Entraînement libre/
├── Question/
├── Bilan de la session/
├── Réviser/
├── Progression/
├── Paramètres/
│
├── Guides pour découvrir la PJJ/
│   ├── Découvrir la PJJ/
│   ├── Organisation de la PJJ/
│   ├── Métiers de la PJJ/
│   ├── Structures de la PJJ/
│   ├── Mesures éducatives de la PJJ/
│   ├── Sigles de la PJJ/
│   ├── Quiz PJJ/
│   └── Préparer son arrivée à la PJJ/
│
├── Informations légales/
└── Éléments communs/
```

Une personne qui cherche le code de la page **Métiers de la PJJ** ne doit donc pas avoir à fouiller dans un dossier appelé `modules`, `components` ou `misc`.

Elle doit pouvoir ouvrir :

**Guides pour découvrir la PJJ → Métiers de la PJJ**

et trouver ce qu’elle cherche.

---

## 5. Chaque page doit posséder son propre espace de travail

Dans la mesure du possible, chaque page doit contenir :

```text
Métiers de la PJJ/

├── page-metiers-pjj.html
├── style-metiers-pjj.css
├── actions-metiers-pjj.js
└── LIRE-MOI.md
```

La fiche CSS de la page doit contenir **uniquement ce qui concerne cette page**, sauf lorsqu’une règle est réellement commune à plusieurs pages.

Le JavaScript de la page doit suivre le même principe.

Cela permet de comprendre immédiatement :

> « Je modifie la page Métiers → je regarde dans le dossier Métiers. »

---

## 6. Les éléments communs doivent rester communs

Il ne faut pas dupliquer le même code dans dix dossiers uniquement pour respecter l’organisation par page.

Un élément réellement partagé doit être placé dans :

**Éléments communs**

Par exemple :

- en-tête ;
- pied de page ;
- consentement Analytics ;
- sauvegarde commune ;
- fonctions utilisées par plusieurs pages ;
- variables générales ;
- styles véritablement communs.

Mais ce dossier ne doit pas devenir un endroit où l’on place tout ce qu’on ne sait pas ranger.

Avant d’y placer quelque chose, il faut pouvoir répondre :

> **« Cet élément est-il réellement utilisé par plusieurs pages ? »**

Si la réponse est non, il doit rester dans le dossier de sa page.

---

## 7. Un élément = un nom stable

Le même élément ne doit pas changer de nom selon les fichiers.

Si le bouton est appelé :

`boutonAccueil`

dans le HTML, il ne doit pas devenir :

`homeButton`

dans le JavaScript et :

`btn-retour`

dans le CSS.

Le vocabulaire doit rester cohérent partout :

```text
HTML          boutonAccueil
JavaScript    boutonAccueil
CSS           bouton-accueil
Documentation Bouton Accueil
```

La syntaxe peut s'adapter au langage, mais **la notion reste exactement la même**.

---

## 8. Les noms doivent décrire la fonction réelle de l'élément

Un nom comme :

`boutonBleu`

est à éviter.

La couleur peut changer demain.

Il faut nommer l’action :

`boutonCommencer`

De même :

`iconeJaune`

est moins utile que :

`iconeBoussole`

Le code doit décrire **ce qu’est ou ce que fait l’élément**, pas uniquement son apparence temporaire.

---

## 9. Les numéros seuls sont interdits lorsqu’un nom compréhensible existe

Éviter :

`bouton1`  
`bloc2`  
`icone3`  
`fonction4`

Sauf lorsqu’un numéro possède réellement une signification visible dans PJJoue, par exemple :

`etape1`  
`questionQ001`

Dans ce cas, le numéro appartient réellement au contenu et peut être conservé.

---

## 10. Analytics et les données techniques stables sont protégés

Les noms visibles dans le code ne doivent pas conduire à modifier arbitrairement les identifiants nécessaires à :

- Google Analytics ;
- Google Tag Manager ;
- Search Console ;
- sauvegardes des utilisateurs ;
- structure des sauvegardes ;
- stockage local ;
- événements déjà exploités ;
- stabilité des progressions déjà enregistrées.

Par exemple :

`pjjoue_resultat_reponse`

ne doit pas être renommé uniquement pour rendre le code plus joli si GA4 attend déjà ce paramètre.

Dans ce cas, le code doit plutôt ajouter une explication claire :

```js
// Ce nom est envoyé à Google Analytics.
// Ne pas le modifier sans modifier également la configuration GA4 et GTM.
pjjoue_resultat_reponse
```

---

## 11. Le CSS doit rester compréhensible avant d'être optimisé

Une règle CSS ne doit pas être supprimée uniquement parce qu’elle semble répétée.

Avant toute suppression, il faut vérifier :

- sa position dans la cascade ;
- ses `@media` ;
- les écrans concernés ;
- les états particuliers ;
- les règles qui la précèdent et la suivent ;
- son effet réel sur PJJoue.

La priorité est :

**1. préserver le visuel ;  
2. comprendre la règle ;  
3. seulement ensuite simplifier.**

Un CSS un peu plus long mais compréhensible et stable est préférable à un CSS très court qui risque de modifier l’interface.

---

## 12. Toute nouvelle fonctionnalité doit respecter cette organisation

Cette règle ne concerne pas seulement le nettoyage actuel.

**Toute future modification de PJJoue doit la respecter.**

Lorsqu’un nouvel élément est ajouté, il faut se demander :

1. **Que voit l’utilisateur ?**
2. **Comment l’appelle-t-il naturellement ?**
3. **Dans quelle page le voit-il ?**
4. **Quel nom français permet de le retrouver immédiatement ?**
5. **Est-il propre à cette page ou réellement commun ?**

Puis seulement écrire le code.

---

## 13. Les fichiers publics sont générés : modification directe interdite

Les fichiers servis par PJJoue ne sont pas la source de vérité lorsqu’ils sont reconstruits par `outils/construire_site.py`.

Cela concerne notamment :

- `index.html` ;
- les pages `*/index.html` ;
- `ressources/navigation-locale.js` ;
- `service-worker.js` ;
- les pages légales ;
- tout autre fichier listé comme sortie du plan de construction.

Une correction apportée directement à un fichier public peut fonctionner visuellement tout en étant perdue à la reconstruction suivante. Elle peut également provoquer l’échec de GitHub Actions avec le message **« fichiers publics modifiés directement ou non reconstruits »**.

La procédure obligatoire est :

1. identifier la vraie source dans `code/` ;
2. modifier cette source ;
3. reconstruire avec `CONSTRUIRE_PJJOUE.bat` ou `python outils/construire_site.py` ;
4. exécuter `VERIFIER_PJJOUE.bat` ou `npm test` ;
5. vérifier explicitement que `python outils/construire_site.py --verifier` est vert ;
6. seulement ensuite publier.

Le `service-worker.js` public ne doit jamais être corrigé seul : sa source se trouve dans `code/01 - Éléments communs/Application installable et hors connexion/`.

---

## 14. L’encodage des noms de fichiers et dossiers doit rester intact

Les accents français font partie des vrais noms du projet. Une archive ou un outil qui transforme par exemple `Éléments communs` en `├ël├®ments communs` crée un **nouveau dossier erroné**, au lieu de mettre à jour le dossier source réel.

Sont donc interdits avant publication :

- noms contenant `├`, `Ã`, `Â`, `�` ou des séquences similaires ;
- doublons de dossiers créés à cause d’un encodage ZIP incorrect ;
- extraction d’une archive dont les noms accentués apparaissent déformés.

Le script `outils/verifier_noms_fichiers.py` doit rester actif dans la chaîne de tests. Il est volontairement exécuté avant le contrôle de construction afin que le problème soit identifié immédiatement.

En cas de nom corrompu : **ne pas renommer au hasard et ne pas pousser**. Repartir d’une copie propre, conserver les vrais noms Unicode, reconstruire, puis vérifier.

---

# Principe final

> **Une personne doit pouvoir utiliser PJJoue pendant cinq minutes, ouvrir ensuite son code et retrouver naturellement les éléments qu’elle vient de voir.**

Le code de PJJoue ne doit pas demander au lecteur d’apprendre le vocabulaire personnel de son développeur.

**C’est le code qui doit parler le langage de PJJoue.**

---

## 15. Les anciens fichiers publics générés doivent disparaître

Les anciennes feuilles CSS publiques fragmentées de `ressources/styles/` (`00-...css`, `10-...css`, etc.) sont obsolètes.

- ne jamais les modifier comme source ;
- ne jamais les restaurer depuis une ancienne archive ;
- la reconstruction complète les supprime automatiquement ;
- le mode `--verifier` doit échouer si elles réapparaissent.

Cette règle évite qu’une extraction ZIP par-dessus un ancien dossier laisse des fichiers fantômes qui perturbent les contrôles CSS ou GitHub Actions.

---

## 15. Les constructions doivent être identiques sous Windows et sur GitHub

Les fichiers générés ne doivent pas dépendre des fins de ligne du système. Le constructeur écrit volontairement les sorties texte en LF. Les empreintes Analytics tolèrent uniquement la différence LF/CRLF ; elles continuent de bloquer toute modification réelle du contenu protégé.

Avant publication, `PREPARER_PJJOUE_AVANT_PUSH.bat` doit reconstruire les données, le site, le service worker, le SEO/sitemap et le manifeste en dernier, puis terminer toute la recette sans erreur. Une empreinte protégée ne doit jamais être modifiée uniquement pour contourner un test.

## 12. Harmonisation visuelle obligatoire

- Ne jamais réintroduire de **bouton jaune plein**. Les actions importantes ont un fond bleu/sombre et un contour jaune au survol/focus.
- Les boutons d’un mode de jeu prennent le contour de la couleur de leur icône/mode.
- Le bouton de réinitialisation globale reste rouge : c’est l’unique exception de danger prévue.
- Conserver **24 px** entre un bouton Retour et le titre qui suit.
- Le menu est structuré en trois groupes : navigation principale, **Supports**, puis **Mini jeux**. Ajouter les futurs mini-jeux dans ce dernier groupe sans modifier les deux premiers.
- Toute modification de ces règles doit être contrôlée sur bureau et mobile avant publication.
