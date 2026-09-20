# Réviser

Ce dossier correspond à la page **Réviser** visible dans PJJoue.

- `contenu.html` = structure de la page et supports de révision.
- `style-de-la-page.css` = règles CSS propres à cette page lorsqu’elles peuvent être isolées sans dupliquer le design commun.
- `actions-de-la-page.js` = affichage et actions propres à la révision.

## Organisation des supports

Les supports sont regroupés par juridiction pour éviter une page trop longue. L’utilisateur ouvre d’abord la juridiction dont il a besoin, puis la fiche voulue.

L’ordre à conserver est :

1. **JE** : fiche pratique, puis fiche synthétique ;
2. **TPE** : fiche pratique, puis fiche synthétique ;
3. **JI** : fiche pratique, puis fiche synthétique ;
4. **JLD** : fiche pratique, puis fiche synthétique ;
5. **CAM** : fiche pratique, puis fiche synthétique ;
6. **JAP / application des peines** : fiche pratique, fiche synthétique, récapitulatif JAP, complément JAP ;
7. **Repères transversaux CJPM** : tableau maître.

Ne pas réempiler tous les supports ouverts les uns sous les autres par défaut : la consultation doit rester progressive et ciblée.

## Questions à consolider

Une réponse juste sans joker compte comme validée, même après une reprise. Dans ce dernier cas, elle reste dans les questions à consolider sans empêcher la validation de l’étape ou de la session. Les réponses avec joker, passées ou incorrectes sont également à consolider. Une réussite directe sans joker dans une nouvelle session retire la question de cette liste.

Les clés historiques `erreurs`, `maitrisee` et `active` sont conservées pour la compatibilité des sauvegardes ; elles décrivent le suivi de révision, distinct des acquis de l’étape. `motifRevision` permet de présenter le motif sans assimiler une reprise réussie à une erreur.

Les règles ou actions utilisées par plusieurs pages restent dans **01 - Éléments communs**.
