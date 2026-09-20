# Analytics — éléments communs

Ces fichiers servent à plusieurs pages de PJJoue.

- `suivi-analytics-pjjoue.js` : prépare et envoie les événements `pjjoue_...` à Google Analytics.
- `consentement-analytics.js` : demande l’accord de la personne avant de charger Google Tag Manager / Google Analytics.

Les rapports métier séparent la page du menu (`pjjoue_page_consultee`),
l’écran interne (`pjjoue_ecran`), le parcours, l’étape, le nom et l’identifiant
de la question, le type de question (`pjjoue_type_question`) et les options
propres à la page (`pjjoue_option_de_jeu`). Les réponses saisies, l’adresse IP
et les données d’identité ne sont pas envoyées par PJJoue.

⚠️ Les noms `pjjoue_...`, l’identifiant GTM et les paramètres déjà utilisés dans GA4 ne doivent pas être renommés sans vérifier la configuration Analytics.
