# Quiz CJPM V1 — Correction de la barre de menu et du logo

## État de cette livraison

Version du produit : **V1**, paquet `1.0.0`. Cette archive complète prolonge
`Quiz-CJPM-V1-Finitions.zip` fourni dans la conversation. Les fichiers publics ont
été reconstruits à partir des sources du projet.

**La publication a été autorisée par la propriétaire, mais aucun push ni
commit distant n’a pu être effectué dans cette session.** La connexion GitHub
accessible propose uniquement des actions de lecture. L’accès Git direct a aussi
échoué : le nom d’hôte GitHub ne peut pas être résolu depuis le conteneur.
La branche `main` a été lue au commit
`283933f5105b12081bbd94cde14e1c2aa40022d9`.

## Correction graphique

- Une seule barre d’identité/navigation en haut de la page, sur fond `#172D48`.
  Aucun bandeau « QUIZ CJPM · V1 » ni élément `.q-demo` dans les pages vérifiées.
- Le slogan « Comprendre · Pratiquer · Retenir » est présent une seule fois,
  dans le groupe du logo. Il est à côté du logo sur ordinateur ; la disposition
  se replie dans la même barre sur petit écran.
- Le médaillon conserve le fond beige avec la lettre `q` bleu nuit.
- « Quiz » reste beige. « CJPM » reste bleu `#214FBA`, en italique.
  Le cartouche beige a été retiré. Le fond est transparent, sans bordure,
  sans ombre ni arrondi. Un contour beige de **1,4 px** suit uniquement les lettres.
  La propriété `paint-order: stroke fill` préserve le remplissage bleu.
- La règle est modifiée dans la feuille source commune `atlas-systeme.css`,
  partagée par l’application, les guides et les pages d’informations.
  Aucune feuille supplémentaire de corrections n’est ajoutée.
- Le visuel de partage `ressources/atlas-apercu.png` est lui aussi actualisé à
  partir de la capture Chromium, pour ne pas conserver l’ancien cartouche.

## Vérifications effectuées sur cette correction

| Contrôle | Résultat |
|---|---|
| Recette navigateur de finitions | **40 / 40 scénarios réussis** |
| Barre principale responsive | Largeurs **320, 390, 768, 1024, 1280 et 1440 px** |
| Pages autonomes | Barre unique et logo contrôlés sur les **21 pages**, à 1280 px |
| Logo | Couleurs calculées, contour, transparence, absence de bordure et d’ombre vérifiés |
| Bandeau et slogan | Aucun ancien bandeau ; slogan unique dans le groupe du logo ; en-tête au sommet |
| Actions couvertes par la recette | Menu et Échap, paramètres de taille, filtres de révision, entraînements des parcours et mini-jeux, formats de questions et liaisons colorées |
| Socle unitaire | **98 / 98 tests réussis** |
| Logique Node | **37 / 37 tests réussis** |
| Syntaxe JavaScript | **50 / 50 fichiers valides** |
| CSS | Contrôles de doublons stricts et de déclarations répétées réussis |
| Données | **7 fichiers identiques octet pour octet** à l’archive précédente, soit 960 questions conservées |
| JavaScript | 50 fichiers JavaScript du produit et des outils inchangés ; seul le jeton de cache du service worker généré est actualisé |

Les résultats détaillés de cette passe figurent dans
`documentation/recette-entete-v1/`. Les scénarios de navigateur sont exécutables
avec `python tests/verifier_finitions_v1.py --captures`.

## Limites et publication

Les tests utilisent Chromium **144.0.7559.96** sous Linux avec les vrais fichiers
construits chargés en mémoire, et un stockage de test. Une tentative de navigation
HTTP locale a été effectuée : Chromium renvoie `ERR_BLOCKED_BY_ADMINISTRATOR`.
Le script de test neutralise donc l’écriture d’URL sur l’origine en mémoire,
comme dans les précédentes recettes. Cela ne modifie pas les fichiers livrés.

L’installation réelle de l’application, le cache hors connexion, la mise à jour
d’une installation existante et le rendu dans les autres navigateurs ne sont
pas validés par ces essais. La présente correction n’est pas une certification
d’accessibilité ni une garantie absolue d’absence de bug.

**Pas de publication exécutée.** L’autorisation de publier est acquise ; ce sont
les actions d’écriture de cette session qui manquent. Aucun jeton ni mot de passe
n’est demandé ou inclus dans cette archive.

## Essai local

Extraire entièrement l’archive dans un nouveau dossier, puis lancer
`ESSAYER_QUIZ_CJPM.bat`. Le lanceur utilise Node.js ou Python et n’effectue aucun
push. La progression du site en ligne et celle de l’aperçu local sont séparées.
La taille Grande reste le défaut ; une préférence déjà sauvegardée est conservée.

Les rapports plus anciens sont conservés comme historique. Les tests de ce
rapport décrivent exclusivement la présente correction de l’en-tête.
