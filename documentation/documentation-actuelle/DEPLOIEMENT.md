# Déploiement de PJJoue V1

## Environnement

Utiliser un hébergement web statique en HTTPS. `index.html` doit rester à la racine publiée.

## Fichiers publics nécessaires

Publier :

- `index.html` ;
- `confidentialite.html`, `mentions-legales.html` et `accessibilite.html` ;
- les répertoires de guides publics (`preparer-arrivee-pjj/`, `decouvrir-la-pjj/`, `organisation-pjj/`, `metiers-pjj/`, `structures-pjj/`, `mesures-educatives-pjj/`, `sigles-pjj/`, `quiz-pjj/`) ;
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

La progression reste dans le navigateur. Les douze pages publiques chargent `ressources/consentement-analytics.js`, qui maintient Google Tag Manager désactivé tant que le visiteur n’a pas accepté la mesure d’audience. `administration.html` en est volontairement exclue afin de ne pas transmettre l’usage de l’outil interne. Toute balise publiée dans le conteneur doit rester cohérente avec la politique de confidentialité, le choix du visiteur et la configuration CSP.

## Référencement public

Après la mise en ligne sur `https://pjjoue.fr/` :

1. vérifier que `https://pjjoue.fr/robots.txt` et `https://pjjoue.fr/sitemap.xml` répondent correctement ;
2. ouvrir la propriété `pjjoue.fr` dans Google Search Console ;
3. aller dans **Indexation > Sitemaps** ;
4. saisir `sitemap.xml`, puis cliquer sur **Envoyer** ;
5. laisser Google explorer et indexer le site, puis contrôler l’état du sitemap dans Search Console.

Le sitemap contient les pages publiques stables, notamment les guides pédagogiques indexables. Les écrans internes du jeu utilisent une navigation dynamique dans `index.html` et ne doivent pas être déclarés comme des URL séparées. La page `administration.html` porte une directive `noindex,nofollow` et ne figure pas dans le sitemap.


## Google Tag Manager et consentement

Le conteneur `GTM-M3LD4ZHK` n’est plus chargé directement dans les pages. Le module `ressources/consentement-analytics.js`, placé au début du `<head>`, applique un état de consentement par défaut refusé et ne télécharge le conteneur qu’après un accord explicite. La version `noscript` a été retirée : elle contournerait le choix du visiteur.

Le choix est enregistré localement sous la clé `pjjoue_consentement_analytics_v1`. Le bouton flottant **Gérer les cookies** et la commande présente sur `confidentialite.html` permettent de rouvrir le panneau. En cas de refus après un accord, le module transmet l’état refusé et tente de supprimer les cookies Google Analytics accessibles au site.

Les événements du jeu sont produits dans `ressources/moteur-jeu.js`, filtrés par `ressources/analytics-pjjoue.js`, puis envoyés dans `dataLayer` uniquement lorsque le consentement est accordé. La configuration unique à réaliser dans Tag Manager est décrite dans `documentation/documentation-actuelle/CONFIGURATION_GTM_ANALYTICS.md`.

Lors d’un changement de conteneur, modifier uniquement `IDENTIFIANT_GTM` dans `ressources/consentement-analytics.js`, vérifier `confidentialite.html`, la CSP de `index.html`, `serveur/entetes.conf`, puis régénérer `MANIFESTE.json`.
