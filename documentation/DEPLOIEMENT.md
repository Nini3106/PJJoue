# Déploiement de PJJoue V1

## Environnement

Utiliser un hébergement web statique en HTTPS. `index.html` doit rester à la racine publiée.

## Fichiers publics nécessaires

Publier :

- `index.html` ;
- `confidentialite.html`, `mentions-legales.html` et `accessibilite.html` ;
- les répertoires de guides publics (`decouvrir-la-pjj/`, `organisation-pjj/`, `metiers-pjj/`, `structures-pjj/`, `mesures-educatives-pjj/`, `sigles-pjj/`, `quiz-pjj/`) ;
- `robots.txt` et `sitemap.xml` ;
- les dossiers `ressources/` et `donnees/` ;
- `.nojekyll` lorsque l’hébergement l’exige ;
- la configuration de sécurité adaptée au serveur.

`administration.html`, `outils/`, `tests/` et `documentation/` ne sont pas nécessaires au fonctionnement public. L’outil d’administration ne doit pas être exposé sans contrôle d’accès dans un contexte institutionnel.

## Avant publication

- vérifier les liens vers les sources officielles ;
- vérifier les mentions légales et la politique de confidentialité ;
- exécuter les contrôles et la recette sur les navigateurs cibles.

## Données

La progression reste dans le navigateur. Les pages publiques intègrent le conteneur Google Tag Manager `GTM-M3LD4ZHK` pour la mesure d’audience. `administration.html` en est volontairement exclue afin de ne pas transmettre l’usage de l’outil interne. Toute balise publiée dans le conteneur doit rester cohérente avec la politique de confidentialité, le recueil du consentement applicable et la configuration CSP.

## Référencement public

Après la mise en ligne sur `https://pjjoue.fr/` :

1. vérifier que `https://pjjoue.fr/robots.txt` et `https://pjjoue.fr/sitemap.xml` répondent correctement ;
2. ouvrir la propriété `pjjoue.fr` dans Google Search Console ;
3. aller dans **Indexation > Sitemaps** ;
4. saisir `sitemap.xml`, puis cliquer sur **Envoyer** ;
5. laisser Google explorer et indexer le site, puis contrôler l’état du sitemap dans Search Console.

Le sitemap contient les pages publiques stables, notamment les guides pédagogiques indexables. Les écrans internes du jeu utilisent une navigation dynamique dans `index.html` et ne doivent pas être déclarés comme des URL séparées. La page `administration.html` porte une directive `noindex,nofollow` et ne figure pas dans le sitemap.


## Google Tag Manager

Le code du conteneur `GTM-M3LD4ZHK` est placé immédiatement après l’ouverture de `<head>` et sa version `noscript` immédiatement après l’ouverture de `<body>` sur les onze pages publiques. Lors d’un changement de conteneur, modifier les deux occurrences sur chaque page, mettre à jour `confidentialite.html`, la CSP de `index.html`, `serveur/entetes.conf`, puis régénérer `MANIFESTE.json`.
