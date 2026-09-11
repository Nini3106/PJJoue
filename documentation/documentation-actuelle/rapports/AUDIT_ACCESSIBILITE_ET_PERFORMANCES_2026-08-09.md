# Audit accessibilité et performances — 9 août 2026

## Périmètre

- page d’accueil et application principale ;
- 14 pages HTML publiques contrôlées statiquement ;
- affichage mobile simulé par Lighthouse dans Chromium ;
- tests hors connexion dans Chromium avec un service worker actif.

## Résultats automatiques

Lighthouse après optimisation :

- accessibilité : **100/100** ;
- bonnes pratiques : **100/100** ;
- référencement : **100/100** ;
- performances : **78/100** dans le serveur local non compressé utilisé pour le test.

Le regroupement des feuilles de style de la page principale a fait progresser
le score de performances de 63 à 78 et a réduit le First Contentful Paint de
4,2 s à 2,3 s dans les mêmes conditions. Le serveur local ne compresse pas les
réponses, contrairement à l’hébergement public : le score de production doit
être mesuré à nouveau après déploiement.

Le contrôle statique valide sur les 14 pages : langue principale, titre de
page, présence d’un titre de premier niveau, unicité des identifiants,
alternatives des images et nom détectable des champs de formulaire.

Une incohérence entre le nom accessible du logo et son texte visible a été
corrigée pendant l’audit.

## Limites RGAA

Ce document n’est pas une déclaration de conformité RGAA. Un taux officiel
nécessite l’examen des 106 critères applicables sur un échantillon
représentatif. Restent notamment à vérifier manuellement :

- restitution avec Firefox et NVDA ;
- restitution avec Safari et VoiceOver ;
- activités interactives de classement, association et remise en ordre ;
- ordre de lecture et restitution des corrections dynamiques ;
- contrastes de tous les états et thèmes ;
- zoom à 200 % et 400 % ;
- fonctionnement complet sans souris ;
- médias institutionnels, sous-titres et alternatives disponibles à la source.

## Application installable et hors connexion

Le manifeste, les icônes 192 et 512 pixels et le service worker sont présents.
Le test automatisé confirme qu’après une première visite l’accueil se recharge
hors connexion avec son titre et son contenu visibles.
