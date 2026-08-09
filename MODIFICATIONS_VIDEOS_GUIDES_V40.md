# Ajout des vidéos aux guides PJJoue — V40

Date : 9 août 2026

## Pages enrichies

- `metiers-pjj/` : 5 vidéos sur les métiers et le travail en équipe à la PJJ.
- `preparer-arrivee-pjj/` : 2 vidéos sur l’ENPJJ et la préparation aux concours.

## Fonctionnement du lecteur

- aucune iframe YouTube n’est chargée au chargement initial de la page ;
- le lecteur est créé uniquement après un clic sur « Lire la vidéo » ;
- le lecteur utilise `youtube-nocookie.com` ;
- en test local `file://`, la vidéo s’ouvre sur YouTube avec un message explicatif dans la carte ;
- sur `https://pjjoue.fr`, la lecture reste intégrée dans la page.

## Analytics

Deux événements sont prévus :

- `pjjoue_video_lancee` ;
- `pjjoue_video_ouverte_youtube`.

Quatre paramètres sont envoyés dans la Data Layer :

- `pjjoue_video_identifiant` ;
- `pjjoue_video_titre` ;
- `pjjoue_video_page` ;
- `pjjoue_video_source`.

Le code du site est prêt. Pour voir ces quatre paramètres dans GA4, ils doivent aussi être ajoutés comme variables Data Layer dans le conteneur GTM et comme paramètres du tag d’événement GA4. Les détails sont ajoutés à `ANALYTICS_CONSIGNES_MODIFICATIONS_PJJOUE.md`.

## Autres mises à jour

- styles responsifs ajoutés dans `ressources/styles/85-guides-pedagogiques.css` ;
- script réutilisable ajouté dans `ressources/videos-guides.js` ;
- page Confidentialité complétée pour expliquer le chargement des vidéos ;
- dates de modification et sitemap mis à jour pour les deux pages concernées ;
- manifeste d’intégrité reconstruit après modifications.
