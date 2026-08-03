# Sécurité et RGPD — PJJoue V1

## Données
PJJoue V1 ne demande aucune identité, aucun compte et aucune donnée relative à un mineur. La progression est enregistrée localement dans le navigateur.

## Règles impératives
- ne jamais saisir de données réelles de jeunes ;
- ne pas ajouter d’analytique tiers sans analyse préalable ;
- ne pas centraliser les résultats sans définir finalité, base juridique, durée de conservation et habilitations ;
- faire valider toute évolution introduisant un traitement de données personnelles par les acteurs compétents (DPO/RSSI selon le contexte).

## Mesures techniques présentes
- CSP sans JavaScript inline ;
- `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` ;
- politique de référent `no-referrer` ;
- exemple d’en-têtes serveur dans `serveur/entetes.conf` ;
- aucune dépendance JavaScript distante ni CDN ;
- import de progression limité à 5 Mo et validation structurelle ;
- échappement HTML des réponses utilisateur lorsqu’elles sont réaffichées.

Une revue de sécurité indépendante reste nécessaire avant homologation ou déploiement institutionnel.
