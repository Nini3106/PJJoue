# Configuration Google Tag Manager et Analytics — PJJoue

## Objectif

Le site produit déjà tous les événements utiles. La configuration Tag Manager ne dépend ni de l’ordre des questions, ni de leur texte, ni de leur place dans une étape. Une question est suivie par son identifiant stable (`pjj_question_id`).

Le conteneur Google Tag Manager n’est chargé qu’après acceptation du visiteur. Avant ce choix, aucun événement PJJoue n’est envoyé dans `dataLayer`.

## Événements disponibles

| Événement | Signification |
|---|---|
| `pjj_screen_view` | écran interne affiché dans l’application |
| `pjj_level_start` | session de parcours, révision, entraînement ou évaluation commencée |
| `pjj_question_view` | question affichée |
| `pjj_question_answer` | réponse validée, sans transmettre son contenu |
| `pjj_question_skip` | question passée |
| `pjj_question_replay` | question rejouée après correction |
| `pjj_joker_use` | joker utilisé |
| `pjj_level_end` | session terminée |
| `pjj_level_abandon` | sortie volontaire avant la fin |
| `pjj_dice_roll` | résultat du dé d’entraînement |
| `pjj_progress_export` | progression exportée |
| `pjj_progress_import` | progression importée avec succès |
| `pjj_progress_reset` | progression réinitialisée après confirmation |
| `pjj_settings_save` | paramètres enregistrés |

## Paramètres stables

Créer les variables de couche de données suivantes dans Tag Manager. Pour chacune : **Variables > Nouvelle > Variable de couche de données**, version 2.

| Nom conseillé dans GTM | Nom de variable de couche de données |
|---|---|
| `DLV - pjj_screen` | `pjj_screen` |
| `DLV - pjj_previous_screen` | `pjj_previous_screen` |
| `DLV - pjj_mode` | `pjj_mode` |
| `DLV - pjj_theme` | `pjj_theme` |
| `DLV - pjj_step` | `pjj_step` |
| `DLV - pjj_chapter` | `pjj_chapter` |
| `DLV - pjj_question_id` | `pjj_question_id` |
| `DLV - pjj_question_position` | `pjj_question_position` |
| `DLV - pjj_question_mode` | `pjj_question_mode` |
| `DLV - pjj_attempts` | `pjj_attempts` |
| `DLV - pjj_result` | `pjj_result` |
| `DLV - pjj_joker` | `pjj_joker` |
| `DLV - pjj_score` | `pjj_score` |
| `DLV - pjj_total` | `pjj_total` |
| `DLV - pjj_duration_seconds` | `pjj_duration_seconds` |
| `DLV - pjj_detail` | `pjj_detail` |

Le nom exact des variables GTM peut changer ; le nom de la variable de couche de données ne doit pas changer.

## Déclencheur unique

1. Ouvrir **Déclencheurs > Nouveau**.
2. Nom : `EVT - Tous les événements PJJoue`.
3. Type : **Événement personnalisé**.
4. Nom de l’événement : `^pjj_.*`.
5. Cocher **Utiliser la correspondance avec une expression régulière**.
6. Déclenchement : **Tous les événements personnalisés**.

Ce déclencheur acceptera également un futur événement commençant par `pjj_`, sans nouvelle modification.

## Balise GA4 unique

1. Ouvrir **Balises > Nouvelle**.
2. Nom : `GA4 - Événements PJJoue`.
3. Type : **Événement Google Analytics : GA4**.
4. Sélectionner la balise Google existante de PJJoue.
5. Nom de l’événement : `{{Event}}`.
6. Ajouter les paramètres d’événement listés ci-dessous.

| Paramètre GA4 | Valeur GTM |
|---|---|
| `pjj_screen` | `{{DLV - pjj_screen}}` |
| `pjj_previous_screen` | `{{DLV - pjj_previous_screen}}` |
| `pjj_mode` | `{{DLV - pjj_mode}}` |
| `pjj_theme` | `{{DLV - pjj_theme}}` |
| `pjj_step` | `{{DLV - pjj_step}}` |
| `pjj_chapter` | `{{DLV - pjj_chapter}}` |
| `pjj_question_id` | `{{DLV - pjj_question_id}}` |
| `pjj_question_position` | `{{DLV - pjj_question_position}}` |
| `pjj_question_mode` | `{{DLV - pjj_question_mode}}` |
| `pjj_attempts` | `{{DLV - pjj_attempts}}` |
| `pjj_result` | `{{DLV - pjj_result}}` |
| `pjj_joker` | `{{DLV - pjj_joker}}` |
| `pjj_score` | `{{DLV - pjj_score}}` |
| `pjj_total` | `{{DLV - pjj_total}}` |
| `pjj_duration_seconds` | `{{DLV - pjj_duration_seconds}}` |
| `pjj_detail` | `{{DLV - pjj_detail}}` |

7. Déclencheur : `EVT - Tous les événements PJJoue`.
8. Enregistrer, puis tester en mode **Prévisualiser** avant de publier.

La variable intégrée `Event` doit être activée dans **Variables > Configurer**.

## Consentement dans Tag Manager

La balise Google et la balise d’événement conservent leurs contrôles de consentement intégrés. Ne pas ajouter un déclencheur qui contourne `analytics_storage`. Le site ne charge déjà le conteneur qu’après acceptation ; cette vérification reste une seconde barrière utile.

## Dimensions personnalisées à créer dans Analytics

Dans **Administration > Affichage des données > Définitions personnalisées**, créer au minimum les dimensions d’événement suivantes :

- `pjj_screen` — Écran PJJoue ;
- `pjj_mode` — Mode de session ;
- `pjj_step` — Étape PJJ ;
- `pjj_question_id` — Identifiant de question ;
- `pjj_question_mode` — Mode de réponse ;
- `pjj_result` — Résultat de l’action ;
- `pjj_joker` — Joker utilisé.

Les paramètres numériques `pjj_score`, `pjj_total` et `pjj_duration_seconds` peuvent être créés comme métriques personnalisées si une analyse détaillée l’exige. Éviter de tout créer immédiatement : les événements sont d’abord vérifiés dans DebugView, puis seules les dimensions utiles au tableau de bord sont enregistrées.

## Règle de maintenance des questions

- garder un `id` unique et stable pour chaque question existante ;
- l’ordre, le texte, les réponses, l’étape et le mode peuvent être modifiés dans les fichiers de données ;
- une nouvelle question reçoit un nouvel identifiant ;
- ne jamais réutiliser l’identifiant d’une question supprimée pour une notion différente.

Avec cette règle, les séries historiques restent comparables et aucune modification Tag Manager ou Analytics n’est nécessaire lors d’une réorganisation de la banque.
