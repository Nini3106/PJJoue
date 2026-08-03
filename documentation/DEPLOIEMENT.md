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

La progression reste dans le navigateur. Ne pas ajouter de collecte serveur ou de service tiers sans cadrage RGPD et sécurité préalable.

## Référencement public

Après la mise en ligne sur `https://pjjoue.fr/` :

1. vérifier que `https://pjjoue.fr/robots.txt` et `https://pjjoue.fr/sitemap.xml` répondent correctement ;
2. ouvrir la propriété `pjjoue.fr` dans Google Search Console ;
3. aller dans **Indexation > Sitemaps** ;
4. saisir `sitemap.xml`, puis cliquer sur **Envoyer** ;
5. laisser Google explorer et indexer le site, puis contrôler l’état du sitemap dans Search Console.

Le sitemap contient les pages publiques stables, notamment les guides pédagogiques indexables. Les écrans internes du jeu utilisent une navigation dynamique dans `index.html` et ne doivent pas être déclarés comme des URL séparées. La page `administration.html` porte une directive `noindex,nofollow` et ne figure pas dans le sitemap.
