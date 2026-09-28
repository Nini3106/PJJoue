# PJJoue — suivi précis et activation Analytics / GTM

28 septembre 2026 — base du site : commit `99ac284cb332b175a1addd49c0aff1e6fdf9110e` ; base GTM : export v6 fourni.

## Périmètre de cette livraison

Corrections du code du site, fichier GTM prêt à importer et définitions GA4 exactes. La configuration d’administration de GA4 et le conteneur GTM en ligne ne sont pas modifiés par ces fichiers : leur activation depuis les interfaces reste nécessaire. Les anciens événements ne sont pas recalculés.

## 1. Configuration GTM à importer après la mise à jour du site

Fichier : `PJJoue-GTM-configuration-corrigee.json`.
Conteneur : `GTM-M3LD4ZHK` ; mesure : `G-JH3QR12RZF` ; propriété Analytics : `548397269`.

| Élément | Version 6 fournie | Configuration corrigée |
| --- | --- | --- |
| Balises | 2 | 2, conservées |
| Déclencheurs personnalisés | 2 | 1 : `EVT - Tous les événements PJJoue` |
| Variables de couche de données | 34 | 50, toutes utilisées |
| Paramètres raccordés dans la balise GA4 | 32 | 50 disponibles, au plus 25 renseignés pour un même événement |
| Variables intégrées activées | 11 | 5 : Event, Page URL, Page Hostname, Page Path, Referrer |

Corrections exactes :

- `pjjoue_joker_utilise_session` → `{{DLV - Joker utilisé dans la session}}`.
- `pjjoue_resultat_session` → `{{DLV - Résultat de la session}}`.
- `pjjoue_duree_session_secondes` → `{{DLV - Durée de la session}}`.
- Ajout des 16 raccordements du tableau GA4 ci-dessous.
- Retrait du déclencheur inutilisé `PAGE - Toutes les pages` (ID 25).
- Désactivation des six variables intégrées inutilisées : Click Element, Click Classes, Click ID, Click Target, Click URL, Click Text.
- La balise Google, le déclencheur d’initialisation et les 34 variables existantes sont conservés. Le consentement du site est conservé.

### Clics exacts dans GTM

1. Ouvrir **www.pjjoue.fr — GTM-M3LD4ZHK**.
2. Aller dans **Admin → Importer le conteneur**.
3. Choisir le fichier JSON corrigé.
4. Choisir **Nouveau** pour l’espace de travail, le nommer **Suivi PJJoue précis**.
5. Choisir **Remplacer** pour appliquer ce conteneur complet issu de v6. Ce choix retire aussi le déclencheur et les variables intégrées inutilisés. Si des changements ont été faits après l’export v6, les comparer avant de remplacer : ce fichier ne peut pas contenir des changements ultérieurs inconnus.
6. Cliquer sur **Continuer** et vérifier les différences annoncées avec le tableau ci-dessus, puis **Confirmer**.
7. Cliquer sur **Prévisualiser**, saisir `https://pjjoue.fr`, puis **Connecter**.
8. Accepter Analytics sur le site de test, lancer puis terminer une courte partie. Dans Tag Assistant, vérifier les valeurs de la recette ci-dessous.
9. Si la recette correspond : **Envoyer → Publier et créer une version**, nom **PJJoue — suivi précis du 28 septembre 2026**, puis **Publier**.

Une prévisualisation ne publie pas le conteneur. Quitter la prévisualisation après le contrôle.

## 2. GA4 : 15 dimensions et 1 métrique à ajouter

Garder les 28 dimensions et les 6 métriques existantes. Résultat attendu : **43 dimensions de portée Événement et 7 métriques personnalisées** si aucune autre définition n’a été ajoutée depuis l’audit. Rechercher chaque clé avant création pour éviter les doublons.

Dans **Administration → Affichage des données → Définitions personnalisées → Créer une dimension personnalisée** : saisir le nom ci-dessous, choisir **Événement**, puis saisir la clé technique exacte dans **Paramètre d’événement**, sans accolades `{{ }}`. Elle peut être saisie même si la liste proposée ne l’affiche pas encore.

| Nom lisible à créer | Paramètre d’événement | Type |
| --- | --- | --- |
| Repères de la question | `pjjoue_reperes_question` | Dimension, portée Événement |
| Écran | `pjjoue_ecran` | Dimension, portée Événement |
| Écran précédent | `pjjoue_ecran_precedent` | Dimension, portée Événement |
| Nom du guide | `pjjoue_nom_guide` | Dimension, portée Événement |
| Périmètre de la session | `pjjoue_perimetre_session` | Dimension, portée Événement |
| Option de jeu | `pjjoue_option_de_jeu` | Dimension, portée Événement |
| Motif de reprise ou suspension | `pjjoue_motif_reprise` | Dimension, portée Événement |
| Réponse après reprise | `pjjoue_reponse_apres_reprise` | Dimension, portée Événement |
| Catégorie de révision | `pjjoue_categorie_revision` | Dimension, portée Événement |
| Catégorie ou filtre des supports | `pjjoue_categorie_support` | Dimension, portée Événement |
| Nom du support | `pjjoue_nom_support` | Dimension, portée Événement |
| Nombre de résultats des supports | `pjjoue_nombre_resultats` | Métrique, unité Standard |
| Identifiant de la vidéo | `pjjoue_video_identifiant` | Dimension, portée Événement |
| Titre de la vidéo | `pjjoue_video_titre` | Dimension, portée Événement |
| Source de la vidéo | `pjjoue_video_source` | Dimension, portée Événement |
| Volume du son | `pjjoue_volume_son` | Dimension, portée Événement |

Pour **Nombre de résultats des supports**, utiliser l’onglet **Métriques personnalisées → Créer une métrique personnalisée**, avec le paramètre indiqué et l’unité **Standard**.

Renommer les libellés existants en conservant leurs clés :

| Clé existante | Libellé précis recommandé |
| --- | --- |
| `pjjoue_temps_ecoule` | Délai de réponse dépassé |
| `pjjoue_duree_session_secondes` | Durée écoulée de la partie (secondes) |
| `pjjoue_nombre_tentatives` | Rang de la tentative |
| `pjjoue_numero_etape` | Étape — identifiant historique |
| `pjjoue_numero_etape_visible` | Étape — numéro affiché |
| `pjjoue_score` | Score de la partie (%) |

Les dimensions nouvelles peuvent nécessiter 24 à 48 heures après création **et réception des données** avant d’être utilisables dans les rapports. Elles ne recréent pas les données manquantes du passé.

## 3. Rapport « PJJoue — Vue globale »

Sa configuration interne n’est pas accessible par le connecteur actuel. Voici la configuration précise à appliquer, sans supprimer les données historiques de la propriété.

| Tableau | Filtre / mesure | Dimensions utiles |
| --- | --- | --- |
| Pages du site | `page_view` ; nombre de vues | Chemin de page, titre de page, appareil |
| Navigation interne | `pjjoue_page_consultee` ; nombre d’événements | Page PJJoue consultée, Écran, page/écran précédents |
| Parties lancées | `pjjoue_session_commencee` ; nombre d’événements | Nom du parcours, mode de jeu, périmètre de session |
| Parties terminées | `pjjoue_session_terminee` ; nombre d’événements | Nom du parcours, résultat de session, joker utilisé dans la session |
| Réponses | `pjjoue_reponse_validee` ; nombre d’événements | Parcours, étape affichée, identifiant/repères de question, type, résultat, réponse après reprise |
| Jokers | `pjjoue_joker_utilise` ; nombre d’événements | Joker utilisé, parcours, étape, question |
| Guides | `pjjoue_page_consultee` avec Nom du guide renseigné | Nom du guide, URL de page |
| Vidéos | `pjjoue_video_lancee` et `pjjoue_video_ouverte_youtube`, séparés | Guide, titre/identifiant/source vidéo |
| Supports | Ouvertures, filtres et recherches, séparés | Catégorie/filtre, nom du support, nombre de résultats |
| Réglages et progression | Événements dédiés, séparés | Son, volume, taille de texte ; type d’opération de progression |

Score moyen = somme des scores / nombre de fins de partie avec score, **uniquement sur `pjjoue_session_terminee`**. Durée moyenne = somme des durées / nombre de fins avec durée, même filtre. Si l’interface ne propose que la somme de la métrique personnalisée, ne pas la présenter comme une moyenne : utiliser une mesure calculée ou un export.

Ne pas appeler « taux de complétion individuel » le simple ratio fins/débuts sur une période : une partie peut commencer avant cette période ou être reprise. Un comptage des parties terminées est exact ; une cohorte liée à un identifiant de partie demanderait une autre mesure.

Retirer des tableaux les colonnes Revenus, Achats, Panier et Publicité payante si elles y figurent. Conserver `page_view`, `session_start`, `first_visit`, `user_engagement`, les clics sortants et téléchargements utiles. Une session GA4 est une visite ; une session PJJoue est une partie. `scroll` mesure un défilement, jamais la compréhension d’un guide.

Ne pas activer de filtre irréversible d’exclusion de données sans avoir identifié et testé précisément le trafic à exclure. Aucun trafic étranger au site n’a été établi par l’audit.

## 4. Recette de publication : valeurs attendues

| Essai | Résultat à observer dans Tag Assistant / DebugView |
| --- | --- |
| Consentement refusé | Aucun événement métier PJJoue transmis |
| Parcours CJPM 1, étape visible 1 | Identifiant parcours `procedure_ordinaire`, numéro parcours `1`, étape visible `1`, identifiant historique `21` |
| Mission Sigles PJJ, première étape | Identifiant parcours `mission_sigles`, étape visible `1`, identifiant historique `6` |
| Fin d’une partie sans joker | Un `pjjoue_session_terminee`, joker de session `Non`, résultat `Session terminée`, score et durée présents |
| Page visitée après cette fin | Aucun score, aucune durée de partie, aucun résultat de session résiduel dans les paramètres envoyés |
| Fin de Mission Sigles / Mission Mesures | Même événement de fin, avec la mission correcte |
| Entraînement Sigles mélangé | `pjjoue_mode_entrainement = Mélangé` |
| Question de parcours 2 dans une partie mélangée | Identifiant parcours de la question `information_judiciaire`, périmètre de partie distinct |
| Rechercher dans Supports | Nombre de résultats transmis ; aucun texte de recherche |
| Ouvrir un guide | Nom du guide présent une fois par chargement ; URL et titre standards corrects |
| Cliquer une vidéo | Identifiant, titre, source et guide présents ; aucune prétention de lecture complète |

Le JSON est validé hors ligne : toutes ses variables sont résolues, chaque paramètre lit la bonne clé, et chaque famille d’événements reste sous la limite de 25 paramètres renseignés. Le contrôle des requêtes réellement reçues par Google après import demeure distinct des tests locaux.

## 5. Définition exacte des 50 paramètres conservés

Une valeur absente n’est pas remplacée par celle d’un ancien événement. Les champs textuels sont limités à 100 caractères ; un nom pédagogique long peut donc être raccourci. Les identifiants publics servent de référence. Les réponses saisies, recherches libres, noms de personnes et fichiers de progression ne sont pas envoyés.

| Paramètre | Nature | Définition |
| --- | --- | --- |
| `pjjoue_page_consultee` | Dimension | Page du menu ou page publique consultée. Ne pas additionner cet événement à page_view. |
| `pjjoue_ecran` | Dimension | Écran réellement actif : Question, Résultats, Supports de révision, etc. |
| `pjjoue_nom_parcours` | Dimension | Parcours réel de la question ; famille Mission Sigles/Mission Mesures pour les missions. |
| `pjjoue_identifiant_parcours` | Dimension | Clé technique du parcours ou de la mission. Préférer cette clé pour les rapprochements. |
| `pjjoue_numero_parcours` | Dimension | Numéro visible du parcours CJPM. Absent pour les missions, qui ne sont pas un parcours CJPM numéroté. |
| `pjjoue_page_precedente` | Dimension | Page du menu précédente ; sur une page publique, page issue du référent interne si identifiable. |
| `pjjoue_ecran_precedent` | Dimension | Écran interne quitté avant la navigation. |
| `pjjoue_nom_guide` | Dimension | Titre du guide concerné, y compris pour une vidéo de ce guide. |
| `pjjoue_numero_etape` | Dimension | Identifiant historique de l’étape. La convention 12 est conservée pour les évaluations. |
| `pjjoue_numero_etape_visible` | Dimension | Numéro montré à l’écran. Mission Sigles PJJ : identifiant interne 6 → numéro visible 1. Absent pour les évaluations des missions, sans numéro affiché. |
| `pjjoue_nom_etape` | Dimension | Titre public exact de l’étape ou Évaluation finale. |
| `pjjoue_mode_de_jeu` | Dimension | Parcours CJPM, Parcours par étapes (missions), Entraînement libre, Défi du hasard, Révision des erreurs ou Évaluation finale. |
| `pjjoue_perimetre_session` | Dimension | Périmètre de la partie, distinct du parcours de chaque question en mélange. |
| `pjjoue_option_de_jeu` | Dimension | Libellé du réglage ou de l’action choisie ; aucune saisie libre. |
| `pjjoue_nombre_questions_defi_du_hasard` | Dimension | Valeur du dé sur l’événement de tirage ; nombre effectivement joué sur les événements de partie. |
| `pjjoue_nombre_questions` | Dimension | Nombre réel d’activités dans la partie, après préparation. |
| `pjjoue_jokers` | Dimension | Avec/Sans : autorisation des jokers pour la partie. |
| `pjjoue_mode_entrainement` | Dimension | Par ordre d’étapes ou Mélangé, selon le réglage transmis au moteur. |
| `pjjoue_chrono` | Dimension | Avec/Sans : chronomètre de l’entraînement. |
| `pjjoue_temps_par_question` | Dimension | Durée accordée par question en entraînement, en secondes. Ce n’est pas le temps de réponse mesuré. |
| `pjjoue_defi_chrono` | Dimension | Libre/Chronométré pour une étape. |
| `pjjoue_temps_par_question_defi_chrono` | Dimension | Durée accordée par question dans une étape chronométrée, en secondes. |
| `pjjoue_resultat_session` | Dimension | Session commencée, Session terminée, Session quittée, Évaluation réussie ou Évaluation terminée. |
| `pjjoue_score` | Métrique | Pourcentage arrondi de réussites autonomes dans la partie, envoyé à la fin uniquement. Une somme de scores n’est pas une moyenne. |
| `pjjoue_reussites_autonomes` | Métrique | Nombre de réponses comptées autonomes par le jeu ; une réussite après reprise sans joker est autonome. La reprise est précisée séparément. |
| `pjjoue_questions_passees` | Métrique | Nombre de questions passées dans le bilan courant. Séparer fins et abandons. |
| `pjjoue_reussites_avec_aide` | Métrique | Nombre de réussites comptées avec aide par le jeu. Séparer fins et abandons. |
| `pjjoue_joker_utilise_session` | Dimension | Oui/Non : au moins un joker utilisé dans la partie. N’est plus raccordé au résultat de session. |
| `pjjoue_duree_session_secondes` | Métrique | Secondes écoulées entre début et fin/abandon ; inclut les pauses et le temps hors de la page. Ce n’est pas une durée de jeu actif. |
| `pjjoue_motif_reprise` | Dimension | Consultation/retour des supports, retour après révision ou retour à une partie sauvegardée. |
| `pjjoue_identifiant_question` | Dimension | Identifiant Analytics historique Qxxx conservé. Dans les missions, son ancienne formule dépend aussi de la position ; utiliser les Repères de la question pour comparer une même notion entre parties. |
| `pjjoue_nom_question` | Dimension | Intitulé pédagogique public, limité à 100 caractères. Jamais la réponse du visiteur. |
| `pjjoue_reperes_question` | Dimension | Clés des notions de Mission Sigles/Mesures, triées, indépendantes de l’ordre de la partie ; plusieurs clés pour une activité d’association. |
| `pjjoue_position_question_session` | Dimension | Position de l’activité dans la partie, en commençant à 1. |
| `pjjoue_type_question` | Dimension | Type réellement présenté : choix, association, réponse écrite, etc. |
| `pjjoue_resultat_reponse` | Dimension | Réussite autonome, Réussite avec aide, Réponse incorrecte, Question passée ou À répondre selon l’action. |
| `pjjoue_nombre_tentatives` | Métrique | Rang de la tentative au moment de chaque réponse validée (1, puis 2…). Ne pas sommer pour compter les clics : le nombre de reponse_validee donne les validations. |
| `pjjoue_temps_ecoule` | Dimension | Oui/Non : délai de réponse dépassé. N’est pas une durée. |
| `pjjoue_reponse_apres_reprise` | Dimension | Oui si cette validation suit une reprise de la question ; Non pour la première tentative. |
| `pjjoue_joker_utilise` | Dimension | Joker précis : 50/50, Indice ou Langue au chat. |
| `pjjoue_categorie_revision` | Dimension | Catégorie sélectionnée dans Réviser, ou Toutes les catégories. |
| `pjjoue_categorie_support` | Dimension | Catégorie du support ouvert, ou filtre de parcours utilisé pour filtrer/rechercher. |
| `pjjoue_nom_support` | Dimension | Titre du support ouvert manuellement. Associer à sa catégorie pour le distinguer. |
| `pjjoue_nombre_resultats` | Métrique | Nombre de supports trouvés après 600 ms sans saisie. Le texte recherché reste local. |
| `pjjoue_video_identifiant` | Dimension | Identifiant public de la vidéo YouTube, aucun identifiant de compte du visiteur. |
| `pjjoue_video_titre` | Dimension | Titre public de la vidéo. |
| `pjjoue_video_source` | Dimension | Libellé public de la source/chaîne vidéo. |
| `pjjoue_son` | Dimension | Activé/Désactivé dans les paramètres enregistrés. |
| `pjjoue_volume_son` | Dimension | Volume choisi de 0 à 100 ; une dimension pour comparer les réglages. |
| `pjjoue_taille_texte` | Dimension | Classe de taille du texte définie par le site : Compacte, Normale ou Grande. |

## 6. Définition exacte des 27 événements métier

| Événement | Déclenchement mesuré |
| --- | --- |
| `pjjoue_page_consultee` | Navigation affichée, après mise à jour du titre et de l’adresse ; pages publiques après consentement, une fois par chargement. |
| `pjjoue_parcours_selectionne` | Choix d’un parcours CJPM. |
| `pjjoue_etape_selectionnee` | Choix d’une étape ou évaluation ; ajout pour les deux missions. |
| `pjjoue_option_de_jeu_selectionnee` | Choix d’un réglage ou action de jeu. |
| `pjjoue_defi_du_hasard_lance` | Résultat d’un lancer de dé dans les trois jeux ; ce compteur n’est pas un nombre de parties commencées. |
| `pjjoue_session_commencee` | Nouvelle partie avec une liste effective de questions. |
| `pjjoue_session_terminee` | Bilan de partie, au plus un envoi par partie dans le même état de jeu, pour les trois jeux. |
| `pjjoue_session_quittee` | Sortie explicite d’une question par la navigation du site. La fermeture brutale d’un onglet n’est pas garantie mesurable. |
| `pjjoue_session_suspendue` | Ouverture des supports depuis une question, avec sauvegarde de la partie. |
| `pjjoue_session_reprise` | Retour depuis les supports, une révision ou une partie sauvegardée. |
| `pjjoue_question_affichee` | Affichage mesuré d’une question ; les reprises de page sans nouvelle question sont distinguées. |
| `pjjoue_question_rejouee` | Reprise de la même question après une tentative. |
| `pjjoue_question_passee` | Action Passer sur une question. |
| `pjjoue_reponse_validee` | Validation d’une réponse ; comprend le résultat, le rang de tentative et le dépassement du délai. |
| `pjjoue_joker_utilise` | Utilisation effective d’un joker. |
| `pjjoue_revision_filtree` | Choix du filtre de parcours/étape dans les listes Réviser. |
| `pjjoue_revision_lancee` | Lancement depuis la sélection ou une catégorie de Réviser ; les autres raccourcis de révision restent identifiés par session_commencee et le mode Révision. |
| `pjjoue_support_ouvert` | Ouverture manuelle d’une catégorie ou fiche ; l’ouverture automatique par la recherche ne compte pas. |
| `pjjoue_supports_filtres` | Clic sur un filtre de parcours dans les supports. |
| `pjjoue_supports_recherches` | Recherche non vide stabilisée pendant 600 ms ; même recherche et même filtre consécutifs dédupliqués. |
| `pjjoue_video_lancee` | Clic chargeant le lecteur vidéo ; ne prouve ni la lecture effective ni son achèvement. |
| `pjjoue_video_ouverte_youtube` | Clic vers YouTube. |
| `pjjoue_parametres_enregistres` | Enregistrement du son, du volume et de la taille de texte. |
| `pjjoue_progression_exportee` | Demande d’export de la progression ; ne prouve pas l’enregistrement du fichier sur le disque. |
| `pjjoue_progression_importee` | Import de progression réussi. |
| `pjjoue_progression_restauree` | Annulation réussie d’un import et restauration de la progression précédente. |
| `pjjoue_progression_reinitialisee` | Réinitialisation de progression confirmée. |

## Sources de configuration Google

- [Importer un conteneur GTM](https://support.google.com/tagmanager/answer/6106997?hl=fr)
- [Créer une dimension de portée Événement](https://support.google.com/analytics/answer/14239696?hl=fr)
- [Créer une métrique personnalisée](https://support.google.com/analytics/answer/14239619?hl=fr)

## Maintenance et tests

Le plan de collecte exécutable se trouve dans `code/01 - Éléments communs/Analytics/suivi-analytics-pjjoue.js`. Les tests de confidentialité, de nettoyage des valeurs et de limites sont dans `tests/logique/analytics.test.cjs`. Le test Chromium `tests/test_analytics_complet.py` exerce le vrai collecteur avec les trois jeux, les pages publiques et les supports.

Les contrats historiques du site restent en place. `tests/analytics_changements_autorises.json` recense les écarts de cette migration autorisée ; les tests inversent uniquement ces écarts avant de comparer les anciennes empreintes. Les données pédagogiques et clés de progression restent inchangées.
