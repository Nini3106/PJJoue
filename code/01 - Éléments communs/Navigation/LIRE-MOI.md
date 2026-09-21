# Navigation et mises à jour communes

`navigation-locale.js` équipe l’application et les guides en HTTP(S) : installation,
état de connexion, navigation des guides et mises à jour automatiques.

Une vérification a lieu à l’ouverture, au retour dans l’onglet, à la reconnexion et
toutes les 60 secondes tant que la page est visible et connectée. La nouvelle
version s’applique sans confirmation : la session est enregistrée, puis la page
se recharge. Un stockage indisponible bloque le rechargement pour conserver la
réponse en cours ; une vérification suivante réessaie.

Le constructeur ajoute une version aux URL des scripts et styles. Le service
worker installe entièrement les fichiers indispensables avant de prendre la main,
garde la version précédente pendant la transition et conserve le mode hors ligne.
La version couvre aussi une modification du service worker lui-même.

Les onglets gardent chacun leur session dans `sessionStorage`, avec le stockage
local comme reprise après fermeture. Les clés historiques de progression restent
inchangées. En `file://`, aucun service worker n’est utilisé ; seuls les liens
locaux sont adaptés.

Contrôles : `npm run test:logique` et `tests/test_mises_a_jour_navigateur.py`
(inclus dans la recette complète). Le second publie deux versions successives sur
une origine HTTP de test et vérifie la reprise effective des trois jeux sur mobile.
