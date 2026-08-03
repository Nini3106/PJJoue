# Déploiement de PJJoue V1

## Environnement

Utiliser un serveur web statique HTTPS administré par l’organisme déployeur. `index.html` doit rester à la racine publiée.

## Fichiers publics nécessaires

Publier :

- `index.html` ;
- `accessibilite.html`, `confidentialite.html` et `mentions-legales.html` ;
- les dossiers `ressources/` et `donnees/` ;
- `.nojekyll` lorsque l’hébergement l’exige ;
- la configuration de sécurité adaptée au serveur.

`administration.html`, `outils/`, `tests/` et `documentation/` ne sont pas nécessaires au fonctionnement public. L’outil d’administration ne doit pas être exposé sans contrôle d’accès dans un contexte institutionnel.

## Avant publication institutionnelle

- faire valider les 150 questions par les référents compétents ;
- réaliser un audit d’accessibilité représentatif ;
- compléter les responsabilités, contacts et informations d’hébergement ;
- effectuer la revue de sécurité adaptée au contexte ;
- exécuter la recette sur les navigateurs et postes cibles.

## Données

La progression reste dans le navigateur. Ne pas ajouter de collecte serveur ou de service tiers sans cadrage RGPD et sécurité préalable.
