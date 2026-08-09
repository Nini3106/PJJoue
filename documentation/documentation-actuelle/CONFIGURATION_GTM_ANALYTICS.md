# Configuration GTM et GA4 — PJJoue

Ce document décrit la configuration Analytics correspondant au code PJJoue actuel.

## Principe

Tous les événements métier propres à PJJoue commencent par `pjjoue_` et utilisent des noms français lisibles.

Le vocabulaire Analytics reprend autant que possible les mots visibles dans l'interface : **Parcours PJJ**, **Entraînement libre**, **Défi chrono**, **Défi du hasard**, **Jokers**, **Chrono**, **Temps par question**, **Réussite autonome**, etc.

Les identifiants techniques stables servent uniquement à conserver l'historique lorsqu'un contenu évolue. La question affichée reste lisible grâce à `pjjoue_nom_question`.

Le conteneur Google Tag Manager n'est chargé qu'après consentement Analytics. Les événements métier sont également bloqués côté `ressources/analytics-pjjoue.js` tant que le consentement n'est pas accordé.

## Événements PJJoue envoyés

| Événement | Signification |
|---|---|
| `pjjoue_page_consultee` | une page interne de PJJoue est consultée |
| `pjjoue_session_commencee` | une session de jeu commence |
| `pjjoue_question_affichee` | une question est affichée |
| `pjjoue_reponse_validee` | une réponse est validée |
| `pjjoue_question_passee` | l'utilisateur passe une question |
| `pjjoue_question_rejouee` | une question est rejouée après correction |
| `pjjoue_joker_utilise` | un joker est utilisé |
| `pjjoue_session_terminee` | une session arrive à son bilan |
| `pjjoue_session_quittee` | l'utilisateur quitte une session avant son terme |
| `pjjoue_defi_du_hasard_lance` | le Défi du hasard est lancé et tire de 1 à 6 questions |
| `pjjoue_progression_exportee` | la progression locale est exportée |
| `pjjoue_progression_importee` | une progression est importée avec succès |
| `pjjoue_progression_reinitialisee` | la progression locale est réinitialisée après confirmation |
| `pjjoue_parametres_enregistres` | les paramètres PJJoue sont enregistrés |

## Paramètres Data Layer à créer dans GTM

Créer une variable **Variable de couche de données** pour chacun des paramètres ci-dessous. Utiliser exactement le même nom dans le champ « Nom de la variable de couche de données ».

| Nom conseillé dans GTM | Paramètre Data Layer | Ce qu'il contient |
|---|---|---|
| DLV - Page PJJoue consultée | `pjjoue_page_consultee` | Accueil, Parcours PJJ, Carnet de voyage, etc. |
| DLV - Page PJJoue précédente | `pjjoue_page_precedente` | page interne précédente |
| DLV - Mode de jeu | `pjjoue_mode_de_jeu` | Parcours PJJ, Entraînement libre, Révision des erreurs, Évaluation finale, Défi du hasard |
| DLV - Mode d'entraînement | `pjjoue_mode_entrainement` | Par ordre d'étapes ou Mélangé |
| DLV - Numéro de l'étape | `pjjoue_numero_etape` | 1 à 12 selon le contexte |
| DLV - Nom de l'étape | `pjjoue_nom_etape` | intitulé actuel de l'étape |
| DLV - Nombre de questions | `pjjoue_nombre_questions` | nombre de questions de la session |
| DLV - Jokers | `pjjoue_jokers` | Avec ou Sans |
| DLV - Défi chrono | `pjjoue_defi_chrono` | Libre ou Chronométré, uniquement dans le Parcours PJJ |
| DLV - Temps par question du Défi chrono | `pjjoue_temps_par_question_defi_chrono` | durée choisie en secondes |
| DLV - Chrono | `pjjoue_chrono` | Avec ou Sans, uniquement dans Entraînement libre |
| DLV - Temps par question | `pjjoue_temps_par_question` | durée choisie en secondes dans Entraînement libre |
| DLV - Nombre de questions du Défi du hasard | `pjjoue_nombre_questions_defi_du_hasard` | résultat du tirage : 1 à 6 |
| DLV - Identifiant de la question | `pjjoue_identifiant_question` | identifiant permanent de type Q001, Q002… |
| DLV - Nom de la question | `pjjoue_nom_question` | énoncé lisible de la question, limité à 100 caractères par GA4 |
| DLV - Position de la question dans la session | `pjjoue_position_question_session` | position réellement jouée : 1, 2, 3… |
| DLV - Type de question | `pjjoue_type_question` | Choix unique, Sélection multiple, Relier, etc. |
| DLV - Résultat de la réponse | `pjjoue_resultat_reponse` | Réussite autonome, Réussite avec aide, Réponse incorrecte, Question passée… |
| DLV - Nombre de tentatives | `pjjoue_nombre_tentatives` | nombre de tentatives sur la question |
| DLV - Joker utilisé | `pjjoue_joker_utilise` | 50/50, Indice ou Langue au chat |
| DLV - Temps écoulé | `pjjoue_temps_ecoule` | Oui ou Non sur une réponse validée |
| DLV - Score | `pjjoue_score` | pourcentage final affiché au bilan |
| DLV - Réussites autonomes | `pjjoue_reussites_autonomes` | nombre de réussites autonomes de la session |
| DLV - Questions passées | `pjjoue_questions_passees` | nombre de questions passées |
| DLV - Réussites avec aide | `pjjoue_reussites_avec_aide` | nombre de réussites avec aide |
| DLV - Joker utilisé dans la session | `pjjoue_joker_utilise_session` | Oui ou Non |
| DLV - Durée de la session | `pjjoue_duree_session_secondes` | durée totale en secondes |
| DLV - Résultat de la session | `pjjoue_resultat_session` | Session commencée, Session terminée, Session quittée, Évaluation réussie… |
| DLV - Son | `pjjoue_son` | Activé ou Désactivé |
| DLV - Taille du texte | `pjjoue_taille_texte` | Compacte, Normale ou Grande |

Il y a donc **30 paramètres PJJoue** actuellement prévus dans le code.

## Déclencheur GTM

Créer ou modifier le déclencheur d'événement personnalisé PJJoue :

1. Type : **Événement personnalisé**.
2. Nom de l'événement : `^pjjoue_.*`.
3. Cocher l'utilisation d'une expression régulière si l'interface GTM le demande.
4. Déclencher sur **Tous les événements personnalisés** correspondant à cette expression.

Ne plus utiliser l'ancienne expression `^pjj_.*`.

## Balise d'événement GA4

La balise d'événement GA4 doit :

1. utiliser la balise Google / l'identifiant de mesure PJJoue existant ;
2. utiliser comme nom d'événement la variable GTM intégrée `{{Event}}` ;
3. transmettre les paramètres PJJoue ci-dessus avec leurs variables DLV correspondantes ;
4. utiliser le déclencheur `^pjjoue_.*` ;
5. conserver les contrôles de consentement Analytics.

Il est normal que certains paramètres soient absents d'un événement : par exemple `pjjoue_son` ne concerne que `pjjoue_parametres_enregistres`, tandis que `pjjoue_nom_question` concerne les événements de question. **Ne pas inventer de valeur de remplacement** pour un paramètre qui n'est pas pertinent.

## Défi chrono

Dans le **Parcours PJJ**, Analytics reçoit :

- `pjjoue_defi_chrono` = `Libre` ou `Chronométré` ;
- `pjjoue_temps_par_question_defi_chrono` si le Défi chrono est chronométré ;
- `pjjoue_temps_ecoule` sur chaque réponse, afin de distinguer une réponse incorrecte d'une question perdue parce que le temps est arrivé à zéro ;
- à la fin de la session : Score, Réussites autonomes, Questions passées, Réussites avec aide, Joker utilisé dans la session et Durée de la session.

Pour analyser les résultats du Défi chrono, filtrer les sessions avec `pjjoue_defi_chrono = Chronométré`.

## Défi du hasard

Lors du tirage :

- événement `pjjoue_defi_du_hasard_lance` ;
- `pjjoue_nombre_questions_defi_du_hasard` = 1 à 6.

La session qui suit porte :

- `pjjoue_mode_de_jeu = Défi du hasard` ;
- le nombre tiré ;
- les mêmes résultats finaux qu'une autre session.

Il est donc possible de comparer les performances selon le nombre de questions tirées sans créer un deuxième système de score.

## Questions : identité stable et nom lisible

`pjjoue_identifiant_question` est la clé de continuité. Le code transforme l'identifiant numérique interne en libellé lisible stable : `1` devient `Q001`, `37` devient `Q037`, etc.

`pjjoue_nom_question` contient l'énoncé courant pour le rendre lisible dans Analytics. GA4 standard limite une valeur de paramètre d'événement à 100 caractères ; l'énoncé est donc automatiquement tronqué à cette limite si nécessaire. **L'identification exacte doit toujours se faire avec `pjjoue_identifiant_question`.**

Une reformulation ne doit pas créer un nouvel identifiant. Une question réellement nouvelle sur le fond doit recevoir un nouvel identifiant jamais utilisé auparavant.

Voir le fichier `ANALYTICS_CONSIGNES_MODIFICATIONS_PJJOUE.md` à la racine du projet pour toutes les règles détaillées de modification.

## Définitions personnalisées GA4

Pour les analyses et rapports, créer en priorité des **dimensions personnalisées de portée Événement** pour les paramètres textuels utiles, par exemple :

- Page PJJoue consultée ;
- Mode de jeu ;
- Mode d'entraînement ;
- Numéro de l'étape ;
- Nom de l'étape ;
- Identifiant de la question ;
- Nom de la question ;
- Position de la question dans la session ;
- Type de question ;
- Résultat de la réponse ;
- Joker utilisé ;
- Défi chrono ;
- Chrono ;
- Temps écoulé ;
- Résultat de la session.

Les valeurs numériques comme le Score, la Durée de la session ou le Nombre de tentatives peuvent être utilisées comme métriques personnalisées **uniquement lorsque le rapport et l'agrégation sont adaptés**. Dans un rapport standard non filtré, GA4 additionne les métriques événementielles ; cela peut produire des totaux sans sens. Ne pas remettre ces métriques partout par défaut.

## Acquisition des visiteurs

Ne pas créer de paramètres PJJoue en doublon pour la provenance des visiteurs. GA4 gère nativement les informations de campagne (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`) et les dimensions Source/Support de la session et Première source/support de l'utilisateur.

Utiliser des liens UTM lorsque PJJoue est partagé sur un réseau social, un QR code, un portfolio ou via un partenaire. Ces données d'acquisition pourront ensuite être croisées avec les événements PJJoue.

## Limites GA4 prises en compte par le code

La nomenclature actuelle respecte les limites GA4 standard importantes :

- nom d'événement : maximum 40 caractères ;
- nom de paramètre : maximum 40 caractères ;
- valeur d'un paramètre d'événement : maximum 100 caractères ;
- maximum 25 paramètres par événement.

Le code PJJoue limite les valeurs textuelles à 100 caractères et aucun événement PJJoue n'approche la limite de 25 paramètres.

## Contrôle après configuration

Après modification du conteneur GTM :

1. lancer l'aperçu GTM ;
2. accepter Analytics sur PJJoue ;
3. vérifier un `pjjoue_page_consultee` ;
4. démarrer une session et vérifier `pjjoue_session_commencee` ;
5. afficher puis répondre à une question ;
6. utiliser au moins un joker ;
7. terminer une session ;
8. tester le Défi du hasard ;
9. tester un Défi chrono avec une question allant jusqu'à « Temps écoulé » ;
10. vérifier les paramètres dans DebugView / Temps réel avant de publier GTM.

Les anciennes données utilisant les noms `pjj_...` restent dans l'historique GA4, mais les nouvelles données utilisent exclusivement la nouvelle nomenclature `pjjoue_...`.
