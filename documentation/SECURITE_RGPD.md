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
- aucune dépendance JavaScript distante ni CDN ;
- import de progression limité à 5 Mo et validation structurelle ;
- échappement HTML des réponses utilisateur lorsqu’elles sont réaffichées.


## Mesure d’audience

Le conteneur public est `GTM-M3LD4ZHK`. La page `administration.html` ne charge pas Google Tag Manager. La politique de confidentialité doit être révisée à chaque ajout ou modification de balise, de finalité, de destinataire ou de durée de conservation. Les balises soumises au consentement ne doivent pas être déclenchées avant le choix du visiteur.
