# Sécurité et données personnelles — PJJoue V1

## Données
PJJoue ne demande aucune identité et ne crée aucun compte. La progression est enregistrée localement dans le navigateur.

## Règles impératives
- ne jamais saisir de données réelles concernant un mineur, une famille, un professionnel ou une procédure ;
- ne pas ajouter de mesure d’audience, de publicité ou de traceur sans analyse préalable ;
- ne pas centraliser de résultats sans définir la finalité, la base juridique, la durée de conservation, les destinataires et les mesures de sécurité ;
- mettre à jour la page Confidentialité avant toute évolution introduisant un nouveau traitement de données personnelles.

## Mesures techniques présentes
- CSP sans JavaScript inline ;
- `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` ;
- politique de référent `no-referrer` ;
- exemple d’en-têtes serveur dans `serveur/entetes.conf` ;
- aucune dépendance JavaScript distante ni CDN avant le consentement ;
- import de progression limité à 5 Mo et validation structurelle ;
- échappement HTML des réponses utilisateur lorsqu’elles sont réaffichées.


## Mesure d’audience

Le conteneur public est `GTM-M3LD4ZHK`. La page `administration.html` ne charge pas Google Tag Manager. Sur les pages publiques servies en HTTP ou HTTPS, `ressources/consentement-analytics.js` applique un refus par défaut et ne charge Google Tag Manager qu’après acceptation. Le conteneur reste toujours désactivé lors d’une ouverture directe en `file:`. L’absence de choix ou le refus n’empêche jamais l’utilisation du jeu.

`ressources/analytics-pjjoue.js` bloque les événements métier tant que le consentement n’est pas accordé. Les événements peuvent contenir l’énoncé public courant d’une question comme libellé Analytics, limité à 100 caractères, ainsi que son identifiant stable et ses résultats. Ils ne contiennent jamais la réponse libre saisie par l’utilisateur, le contenu d’une sauvegarde, un nom, une adresse e-mail, un numéro de téléphone ou une autre donnée d’identité directe.

La politique de confidentialité doit être révisée à chaque ajout ou modification de balise, de finalité, de destinataire, de paramètre transmis ou de durée de conservation. Le refus doit rester aussi simple que l’acceptation.
