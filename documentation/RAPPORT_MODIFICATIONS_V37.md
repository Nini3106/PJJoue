# PJJoue V37 — Activités éducatives et nouvelle évaluation finale

Date : 8 août 2026

## Périmètre appliqué

La V37 part strictement de la V36 fournie et conserve le reste du site en dehors des ajustements nécessaires aux contenus demandés et à la continuité Analytics.

### Étape 2

- Q013 : seuls les deux distracteurs sont remplacés par « Des difficultés scolaires persistantes » et « Des conflits familiaux récurrents ».
- Q018 : « Des filles comme des garçons peuvent être suivis » est retiré ; quatre propositions restent affichées.

### Étape 3

- Q025 : formulation du ministère public autour de l’intérêt public et de l’action publique ; « requérir la loi » devient « requérir l’application de la loi ».
- Q028 : fonctions du procureur et explication rendues plus concrètes.

### Étape 5 — L’organisation de la PJJ

Ordre pédagogique visible :

1. Q050 — association des cinq niveaux, sans sigles dans l’énoncé pédagogique initial ;
2. Q171 — nouvel ordre du terrain vers le niveau le plus large ;
3. Q041 — « Pourquoi la PJJ est-elle organisée de cette manière ? » ;
4. Q042 — sigle DPJJ contextualisé par son rôle national ;
5. Q044 — ancienne Q4 conservée intégralement ;
6. Q045 — ancienne Q5 conservée intégralement ;
7. Q046 — ancienne Q6 conservée intégralement ;
8. Q047 — ancienne Q7 conservée intégralement ;
9. Q048 — nouvelle formulation sur la distinction secteur public / SAH avec trois réponses exactes ;
10. Q049 — ancienne Q9 conservée intégralement.

Q043 est retirée et son identifiant n’est pas recyclé. La nouvelle question 2 reçoit Q171 conformément aux règles Analytics.

### Étape 8 — Les activités éducatives

L’ancienne étape 11 « Le suivi, les écrits et la confidentialité » est retirée. Ses questions Q101 à Q110 sont retirées et leurs IDs restent réservés.

La nouvelle étape 8 utilise Q161 à Q170 :

1. supports éducatifs et objectifs travaillés ;
2. catégories d’activités proposées en UEAJ ;
3. association activité / compétence ;
4. classement d’exemples d’activités ;
5. quatre objectifs des activités de jour prévus par le CJPM ;
6. individualisation des activités ;
7. mise en œuvre au-delà des seules UEAJ ;
8. STEMOI et EPEI comportant une UEAJ ;
9. UEMO / UEHC versus UEAT / SEAT ;
10. réponse écrite « support éducatif » avec variantes sémantiques et tolérance orthographique.

Le message fourni contenait deux fois le même distracteur « STEMO » à la question 8/10. Il n’est affiché qu’une fois afin d’éviter deux choix strictement identiques ; aucun distracteur supplémentaire n’a été inventé.

### Nouvel ordre des étapes

- Étapes 1 à 7 : ordre visible inchangé.
- Étape 8 : Les activités éducatives — nouveau thème.
- Étape 9 : ancienne étape 8, Les structures de placement.
- Étape 10 : ancienne étape 9, Mesures et parcours judiciaire.
- Étape 11 : ancienne étape 10, La logique éducative et les partenaires.
- Étape 12 : Évaluation finale.

L’identité Analytics permanente est séparée de l’ordre visible grâce à `idAnalyticsPermanent` et `etapeAnalyticsPermanent`. Les anciennes étapes 8, 9 et 10 conservent donc leur identité historique malgré leur nouvelle position visible.

## Évaluation finale — 50 réponses écrites

L’évaluation contient toujours exactement 50 questions et utilise uniquement le mode « Réponse écrite » sans joker.

Elle a été recentrée sur les connaissances les plus importantes des onze étapes. Les questions conservant la même compétence gardent leur ID permanent. Les questions remplacées par de nouveaux contenus sont retirées sans recyclage de leur ID.

IDs d’évaluation retirés : Q145, Q154, Q155, Q157, Q158, Q159 et Q160.

Nouvelles questions d’évaluation :

- Q172 : rôle de l’infirmier / infirmière dans l’équipe pluridisciplinaire ;
- Q173 : SAH et distinction avec le secteur public ;
- Q174 : notion de support éducatif ;
- Q175 : quatre grandes catégories d’activités en UEAJ ;
- Q176 : quatre objectifs des activités de jour ;
- Q177 : individualisation des activités ;
- Q178 : compétences ou objectifs travaillés par les activités.

L’ordre de l’évaluation est piloté par `ordreEtape` et non par les IDs Analytics.

## Tolérance des réponses écrites

La validation reste conceptuelle et souple :

- accents ignorés ;
- singulier / pluriel et variantes morphologiques tolérés ;
- fautes légères et lettres manquantes tolérées par rapprochement ;
- synonymes et formulations équivalentes déclarés par groupes de concepts ;
- règles spécifiques conservées pour les sigles ;
- réponses contradictoires ou négations incompatibles refusées.

La Q170 accepte notamment : support(s) éducatif(s), outil(s) éducatif(s), moyen(s) éducatif(s), levier(s) éducatif(s), média(s) éducatif(s), médiation éducative, outil/moyen/support d’accompagnement éducatif et formulations « à visée éducative », avec ou sans accents et avec tolérance aux fautes légères.

## Analytics et sauvegarde locale

- Les anciens IDs ne sont jamais réutilisés.
- Les questions nouvelles utilisent Q161 à Q178.
- L’évaluation est sélectionnée par `estEvaluationFinale: true`, et non par une ancienne plage Q111–Q160.
- La position visible d’une étape est séparée de son identité Analytics permanente.
- La sauvegarde locale passe en `V3-activites-educatives`.
- Une migration conserve l’avancement des anciennes étapes 8, 9 et 10 en les déplaçant vers leurs nouvelles positions 9, 10 et 11 ; l’ancien progrès de l’étape 11 supprimée n’est pas attribué à la nouvelle étape 8.

## Contrôles réalisés

- 160 questions actives : OK.
- 110 questions d’apprentissage : OK.
- 11 étapes × 10 questions : OK.
- 50 questions finales : OK.
- 50/50 questions finales en réponse écrite : OK.
- Sources référencées : OK.
- Contrôle structurel Python : OK.
- Tests unitaires Python : 6/6 OK.
- Recette navigateur : 605 contrôles de réponses réussis.
- Contrôle strict des doublons CSS : OK.
- Audit structurel CSS : même statut non nul et mêmes avertissements préexistants que dans la V36 de référence ; aucun fichier CSS n’a été modifié dans cette version.

Le script npm global n’a pas pu être lancé tel quel dans l’environnement de génération, car le projet impose Node 24.18–24.x alors que l’environnement fournit Node 22.16. Les contrôles sous-jacents disponibles ont été exécutés séparément ; la syntaxe JavaScript et les tests navigateur ont été vérifiés indépendamment.
