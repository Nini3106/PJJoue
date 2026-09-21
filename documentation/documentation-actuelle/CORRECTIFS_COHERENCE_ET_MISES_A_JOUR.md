# Correctifs de cohérence et mises à jour — 21 septembre 2026

## Règles métier

- Une reprise immédiate réussie sans joker valide le score et la maîtrise, mais reste à consolider. Une nouvelle session réussie au premier essai enlève la révision.
- Toute révision réussie crédite l’étape d’origine, même pour une question précédemment passée. Les célébrations sont émises une seule fois, quelle que soit l’entrée utilisée.
- Les trois évaluations autorisent une seule tentative par question, sans joker ni passage.
- Chaque activité d’une mission possède un identifiant de session unique. L’identifiant historique Analytics et les identifiants des notions sont conservés séparément.
- La tolérance orthographique des réponses écrites ne doit jamais modifier un montant ou inverser une négation. Les variantes déclarées restent testées.
- Un import exige une sauvegarde V1 identifiable, annonce son remplacement et conserve un retour à la progression précédente. Aucune session antérieure à l’import ne doit être reprise.

## Interface

La révision affiche une seule liste par catégorie, avec des filtres de parcours et d’étape communs à la liste et au lancement. Les catégories vides sont masquées. Les repères gardent leurs couleurs canoniques.

Les bilans renvoient au jeu concerné. « Voir mes révisions » ouvre la liste ; « Réviser cette étape » lance la révision ciblée. Les points XP, sans effet sur la maîtrise, ne sont plus présentés comme des points de progression. Le champ historique reste compatible avec les sauvegardes.

Les pourcentages des parcours comprennent leurs onze étapes et leur évaluation (douze objectifs). Le total global précise qu’il inclut l’option PJJ ; le nombre de parcours CJPM validés est affiché séparément.

## Mises à jour automatiques

Aucune question de confirmation. Vérification à l’ouverture, au retour dans l’onglet, à la reconnexion et toutes les 60 secondes lorsque la page est visible et connectée. Les navigateurs peuvent suspendre les onglets en arrière-plan ; le retour visible déclenche immédiatement une vérification.

La session, la réponse écrite, les manipulations d’activité, le score et le temps restant sont conservés avant rechargement. Chaque onglet garde sa propre session. Les sessions V1 du parcours principal restent reprenables ; les nouvelles sessions V2 incluent les activités des missions.

Les URL CSS/JavaScript et le cache portent la même version calculée par le constructeur. Une installation interrompue ne peut pas activer un moteur incomplet. Les fichiers Analytics protégés sont inchangés.

Références : [mise à jour du service worker](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update) et [changement de contrôleur](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/controllerchange_event).

## Prévention

`npm test` inclut désormais `npm run test:logique` : 66 étapes, 2 000 évaluations générées, réponses écrites, reprise autonome, révision d’une question passée, migrations de session, deux onglets, import et restauration, filtres et mises à jour automatiques.

`test_mises_a_jour_navigateur.py` simule une publication A → B avec le véritable service worker sur une origine HTTP et vérifie que les trois jeux reprennent à la même question sans perdre le score ou la saisie. Les tests de catégories vérifient aussi les largeurs 320, 390 et 1440 pixels.
