# PJJoue — Consignes très précises pour modifier le contenu sans casser Analytics

## À quoi sert ce fichier

Ce fichier est la règle de référence avant toute modification future de PJJoue.

Son objectif est double :

1. permettre de faire évoluer librement les questions, les étapes, les modes de jeu, les jokers et les textes de l'interface ;
2. conserver un historique Analytics cohérent afin que les données anciennes et nouvelles puissent toujours être rapprochées.

La règle générale est simple : **un libellé visible peut évoluer ; une identité technique permanente ne doit pas être recyclée.**

---

## 1. Questions : ce qui identifie réellement une question

Chaque question possède dans `donnees/questions.json` un champ numérique `id`.

Exemple :

```json
{
  "id": 37,
  "enonce": "..."
}
```

Dans Analytics, cet identifiant est envoyé sous la forme :

```text
pjjoue_identifiant_question = Q037
```

Cet identifiant est **l'identité permanente de la question**.

Il ne représente ni sa position dans une session, ni son étape, ni son texte, ni son type de réponse.

### Ne jamais réutiliser un ancien identifiant

Si Q037 est supprimée du jeu, son historique reste Q037 dans Analytics.

Si une nouvelle question est créée six mois plus tard, **elle ne doit jamais reprendre Q037**. Elle doit recevoir un nouvel identifiant qui n'a encore jamais existé.

---

## 2. Reformuler l'énoncé d'une question

### Exemple

Avant :

> Quel est le sigle de la Protection judiciaire de la jeunesse ?

Après :

> La Protection judiciaire de la jeunesse est couramment désignée par quel sigle ?

Si l'objectif pédagogique reste le même, garder le même `id`.

Analytics recevra toujours :

```text
pjjoue_identifiant_question = Qxxx
```

mais `pjjoue_nom_question` contiendra le nouvel énoncé pour les nouvelles visites.

Les anciennes données garderont naturellement l'ancien libellé et les nouvelles données le nouveau libellé. Elles pourront être regroupées grâce à l'identifiant Qxxx.

### Correction orthographique ou typographique

Une correction de faute, ponctuation, majuscule, accord, espace, formulation plus fluide ou simplification de phrase **ne change jamais l'identifiant**.

### Limite d'affichage Analytics

GA4 standard limite une valeur de paramètre à 100 caractères. `pjjoue_nom_question` est donc un libellé lisible de l'énoncé courant, tronqué automatiquement à 100 caractères lorsque l'énoncé est plus long.

Pour toute analyse fiable, utiliser **Identifiant de la question + Nom de la question** ensemble.

---

## 3. Modifier la bonne réponse

Changer la bonne réponse ne change pas automatiquement l'identité de la question.

Garder le même identifiant si la question reste fondamentalement la même et que la modification corrige :

- une erreur factuelle ;
- une information devenue obsolète ;
- une évolution juridique ou institutionnelle ;
- une formulation trop stricte ;
- un synonyme ou une variante qui doit désormais être acceptée ;
- une réponse qui était mal paramétrée.

Créer une nouvelle question avec un nouvel identifiant si le changement transforme réellement ce qui est demandé ou la compétence évaluée.

### Conséquence Analytics

Une correction de la bonne réponse peut modifier le taux de réussite futur. C'est normal. L'historique antérieur n'est pas réécrit.

---

## 4. Modifier les mauvaises réponses / distracteurs

Les distracteurs comprennent notamment :

- `mauvaisesReponses` ;
- les propositions incorrectes d'une sélection multiple ;
- les éléments incorrects proposés dans une activité interactive ;
- tout choix volontairement plausible mais faux présenté à l'utilisateur.

Tu peux :

- reformuler un distracteur ;
- remplacer un distracteur ;
- en ajouter ;
- en supprimer ;
- modifier leur ordre ;
- rendre un distracteur plus ou moins difficile.

**L'identifiant permanent de la question ne change pas** tant que la question reste la même sur le fond.

Le paramètre Analytics `pjjoue_identifiant_question` permet de conserver la continuité.

Attention : modifier fortement les distracteurs peut changer le niveau de difficulté. Il faut donc interpréter avec prudence une comparaison du taux de réussite avant/après la modification.

---

## 5. Changer le type ou le mode de réponse d'une question

PJJoue peut afficher notamment :

- Choix unique ;
- Sélection multiple ;
- Relier ;
- Retirer des choix ;
- Réponse écrite ;
- Remettre dans l'ordre ;
- Choisir puis ordonner ;
- Classer.

Le type courant est envoyé dans :

```text
pjjoue_type_question
```

Tu peux transformer une question de Choix unique en Sélection multiple, Réponse écrite, Relier, etc. **sans changer son identifiant**, si elle vérifie toujours le même savoir ou raisonnement principal.

Si cette transformation crée en réalité une nouvelle activité pédagogique sans rapport suffisant avec l'ancienne, créer un nouvel identifiant.

Analytics conservera l'ancien type sur les anciens événements et le nouveau type sur les nouveaux événements, tout en gardant le même Qxxx lorsque la continuité pédagogique est volontaire.

---

## 6. Modifier l'explication / la correction

Par « explication » ou « correction », on entend notamment :

- le champ `explication` ;
- le texte affiché après une bonne ou une mauvaise réponse ;
- une précision pédagogique ;
- un rappel de règle ;
- une reformulation de la justification ;
- une mise à jour juridique ou institutionnelle ;
- une correction de source ou de vocabulaire dans le retour pédagogique.

Tu peux modifier ce contenu librement **sans changer l'identifiant de la question**.

L'explication n'est pas utilisée pour identifier la question dans Analytics.

Le texte complet de l'explication n'est pas envoyé à GA4. Analytics suit la question par Qxxx et son résultat, pas le contenu détaillé de la correction.

---

## 7. Modifier le joker « Indice » d'une question

Le champ `indice` contient l'aide affichée lorsque l'utilisateur choisit le joker **Indice**.

Tu peux :

- reformuler l'indice ;
- corriger une faute ;
- rendre l'indice plus précis ;
- le rendre moins révélateur ;
- remplacer complètement l'indice ;
- adapter l'indice après une modification de la question.

Cela **ne change pas l'identifiant permanent de la question**.

Analytics enregistre que le joker **Indice** a été utilisé avec :

```text
pjjoue_joker_utilise = Indice
```

Le texte de l'indice lui-même n'est pas envoyé à GA4.

Si l'indice devient beaucoup plus ou moins aidant, les performances futures « avec aide » peuvent naturellement évoluer.

---

## 8. Modifier le joker 50/50

Le 50/50 peut agir différemment selon le type de question : retirer des propositions, verrouiller une partie du bon ordre, fournir une partie d'une association, etc.

Tu peux modifier la logique d'aide du 50/50 sans changer l'identifiant des questions concernées, tant que les questions restent les mêmes.

Analytics continue d'enregistrer :

```text
pjjoue_joker_utilise = 50/50
```

Si le fonctionnement du 50/50 devient sensiblement plus puissant ou plus faible, noter cette évolution lors de l'analyse des résultats « avec aide ».

---

## 9. Modifier « Langue au chat »

Le joker **Langue au chat** révèle la réponse attendue et finalise la réponse avec aide.

Tu peux modifier :

- la bonne réponse révélée ;
- sa formulation ;
- la présentation du joker ;
- le texte autour de la réponse révélée.

Cela ne change pas l'identifiant de la question si la question reste la même.

Analytics enregistre :

```text
pjjoue_joker_utilise = Langue au chat
```

et la réponse correspondante est classée comme **Réussite avec aide**.

---

## 10. Déplacer une question dans la même étape

Tu peux changer l'ordre d'une question autant de fois que nécessaire.

Ne change pas son `id`.

Analytics distingue :

- `pjjoue_identifiant_question` : identité permanente ;
- `pjjoue_position_question_session` : position réellement jouée dans la session.

Q037 peut donc apparaître 2e dans une session et 14e dans une autre sans aucune perte de continuité.

C'est également normal dans le mode **Mélangé**.

---

## 11. Déplacer une question vers une autre étape

Tu peux déplacer Q037 de l'étape 3 vers l'étape 5 sans changer Q037.

Pour les nouvelles visites, Analytics enverra automatiquement :

- le même `pjjoue_identifiant_question` ;
- le nouveau `pjjoue_numero_etape` ;
- le nouveau `pjjoue_nom_etape`.

Les anciennes données garderont l'ancienne étape. C'est souhaitable : Analytics représente l'état réel du jeu au moment où l'événement s'est produit.

---

## 12. Ajouter une nouvelle question

Une nouvelle question réellement distincte doit recevoir un **nouvel identifiant jamais utilisé**.

Ne pas renuméroter les anciennes questions uniquement pour rendre la liste « propre ».

### Contrainte actuelle du projet

PJJoue contient 160 questions actives, mais les identifiants ne sont volontairement pas continus : un identifiant retiré n’est jamais recyclé. L’évaluation finale est repérée par `estEvaluationFinale: true` et non par une plage numérique fixe.

IDs actuellement retirés et réservés définitivement : Q043, Q101 à Q110, Q145, Q154, Q155 et Q157 à Q160. Les nouvelles questions créées dans cette refonte utilisent Q161 à Q178.

Donc ajouter une nouvelle question peut nécessiter, en plus de `donnees/questions.json` :

- d'adapter les règles dans `outils/validation_donnees.py` ;
- d'adapter `tests/verifier_pjjoue.py` ;
- d'adapter les textes publics annonçant « 160 questions » ;
- d'adapter la logique de l'Évaluation finale si son périmètre change ;
- de reconstruire `donnees/donnees-pjj.js` et `MANIFESTE.json` avec les scripts du projet.

**Cette contrainte concerne la structure de PJJoue, pas Analytics.** Le suivi Analytics accepte un nouvel identifiant dès lors qu'il n'est pas recyclé.

---

## 13. Supprimer une question

Supprimer une question du jeu ne supprime pas son historique Analytics.

Règle absolue : **ne jamais réattribuer son ancien identifiant à une autre question.**

Exemple : si Q037 est supprimée, Q037 reste « réservée pour toujours » dans l'historique.

La suppression peut aussi nécessiter d'adapter les contrôles de quantité et, selon la question concernée, le périmètre de l'Évaluation finale.

---

## 14. Remplacer complètement une question

Si une question est supprimée puis remplacée par une autre question qui évalue un sujet différent, **ne pas garder l'ancien identifiant**.

Exemple :

- ancienne Q037 : rôle du parquet ;
- nouvelle activité : organisation d'un CEF.

Même si elle occupe la même place dans le fichier, ce n'est pas la même question. Créer un nouvel identifiant.

---

## 15. Scinder une question en deux

Si Q037 devient deux questions distinctes :

- conserver Q037 pour celle qui représente le mieux la continuité avec l'ancienne ;
- attribuer un nouvel identifiant à la deuxième.

Ne jamais dupliquer Q037.

---

## 16. Fusionner deux questions

Si deux anciennes questions sont fusionnées en une seule :

- choisir avec prudence l'identifiant de la question qui constitue réellement la continuité principale ;
- retirer l'autre identifiant sans le recycler ;
- si la nouvelle question est substantiellement nouvelle, préférer un nouvel identifiant.

---

## 17. Modifier les sources d'une question

Tu peux modifier :

- `source` ;
- `referencesSources` ;
- une URL ou une référence documentaire ;
- la source principale ;
- les sources complémentaires ;
- la date de vérification ;
- le statut éditorial du contenu.

Cela ne change pas l'identifiant de la question si le fond de la question reste le même.

Ces métadonnées éditoriales ne sont pas utilisées comme identifiants Analytics.

---

## 18. Modifier le nom d'une étape

Le nom actuel d'une étape vient de `donnees/programme.json`.

Analytics envoie deux informations différentes :

```text
pjjoue_numero_etape
pjjoue_nom_etape
```

Si « Les acteurs et les rôles » devient « Les acteurs de la justice des mineurs », garder le même identifiant d'étape.

Les anciennes visites garderont l'ancien nom et les nouvelles le nouveau. Le numéro permet de conserver la continuité.

---

## 19. Modifier la couleur, l'icône, les souvenirs ou les textes d'une étape

Tu peux modifier sans casser Analytics :

- la couleur de l'étape ;
- son icône ;
- son sous-titre ;
- ses souvenirs pédagogiques ;
- ses sources ;
- ses textes de présentation ;
- ses objectifs ;
- son contenu éditorial.

Ces éléments ne définissent pas l'identité Analytics de l'étape.

---

## 20. Déplacer / réordonner des étapes

L’identité Analytics d’une étape est séparée de sa position visible.

- `id` dans `programme.json` = position visible dans le parcours ;
- `idAnalyticsPermanent` = identité permanente de l’étape pour Analytics ;
- `etapeAnalyticsPermanent` dans chaque question = identité permanente utilisée lors de l’envoi Analytics.

Pour préserver l’historique, **ne jamais recycler une identité Analytics permanente**. Lorsqu’une étape existante change seulement de position, conserver son `idAnalyticsPermanent`. Lorsqu’un thème entièrement nouveau est créé, lui attribuer une nouvelle identité permanente.

---

## 21. Ajouter une étape

Une nouvelle étape doit recevoir un identifiant qui n'a jamais été utilisé.

PJJoue comporte actuellement 11 étapes d'apprentissage puis l'étape 12 pour l'Évaluation finale. Ajouter une étape demande donc une modification structurelle plus large :

- programme ;
- navigation ;
- progression ;
- déverrouillage de l'Évaluation ;
- textes publics ;
- validations et tests ;
- éventuellement le numéro de l'Évaluation finale.

Ne pas simplement décaler tous les numéros existants sans plan de migration Analytics.

---

## 22. Supprimer une étape

Une étape supprimée peut rester dans l'historique Analytics.

Ne réattribue pas son ancien identifiant à une étape différente.

Il faut également vérifier les questions qui lui appartenaient : elles doivent être supprimées ou déplacées vers une autre étape en conservant leurs identifiants de question lorsqu'elles restent les mêmes.

---

## 23. Modifier « Parcours PJJ »

Le mode de jeu est envoyé comme :

```text
pjjoue_mode_de_jeu = Parcours PJJ
```

Changer des règles internes du Parcours PJJ ne nécessite pas de changer ce paramètre tant que le mode visible reste le même.

Si le nom visible « Parcours PJJ » change un jour, mettre à jour le libellé Analytics dans `ressources/moteur-jeu.js` pour qu'il corresponde au nouveau vocabulaire de l'interface. Les anciens événements conserveront l'ancien nom.

---

## 24. Modifier le Défi chrono du Parcours PJJ

Dans le Parcours, le vocabulaire Analytics est volontairement celui de l'interface : **Défi chrono**.

Paramètres :

```text
pjjoue_defi_chrono = Libre | Chronométré
pjjoue_temps_par_question_defi_chrono = nombre de secondes
pjjoue_temps_ecoule = Oui | Non
```

Tu peux modifier les durées proposées (5 s, 10 s, etc.) sans changer les noms de paramètres.

Si tu changes uniquement les valeurs disponibles, GTM n'a pas besoin d'être recréé.

Si tu renommes visuellement « Défi chrono », il faut décider si le nom Analytics doit suivre ce nouveau vocabulaire. **Ne renomme jamais le paramètre technique `pjjoue_defi_chrono` sans migration volontaire**, car cela casserait la continuité des rapports.

Pour mesurer les résultats du Défi chrono, utiliser les événements `pjjoue_session_terminee` avec :

- Défi chrono = Chronométré ;
- Score ;
- Réussites autonomes ;
- Questions passées ;
- Réussites avec aide ;
- Durée de la session ;
- Temps écoulé au niveau des réponses.

---

## 25. Modifier Entraînement libre

Analytics distingue :

```text
pjjoue_mode_de_jeu = Entraînement libre
pjjoue_mode_entrainement = Par ordre d'étapes | Mélangé
pjjoue_jokers = Avec | Sans
pjjoue_chrono = Avec | Sans
pjjoue_temps_par_question = durée en secondes
```

Si tu modifies le nombre de questions disponible, l'ordre, le mélange ou les durées de chrono, les noms techniques restent les mêmes.

Le paramètre `pjjoue_nombre_questions` prend automatiquement le nombre réel de questions de la session.

---

## 26. Modifier le Défi du hasard

Le nom visible est **Défi du hasard**.

Le tirage envoie :

```text
pjjoue_defi_du_hasard_lance
pjjoue_nombre_questions_defi_du_hasard = 1 à 6
```

La session qui suit est identifiée par :

```text
pjjoue_mode_de_jeu = Défi du hasard
```

Si tu modifies un jour la plage du dé (par exemple 1 à 8 questions), conserver le même paramètre ; seules ses valeurs évolueront.

Les résultats du Défi du hasard sont ceux de la session : Score, Réussites autonomes, Questions passées, Réussites avec aide, Joker utilisé dans la session et Durée de la session.

---

## 27. Modifier Révision des erreurs

Les questions de révision conservent leur identifiant Qxxx d'origine.

Une question n'obtient jamais un nouvel identifiant parce qu'elle est jouée en révision.

Le mode de jeu est envoyé comme :

```text
pjjoue_mode_de_jeu = Révision des erreurs
```

Cela permet de comparer la même question lorsqu'elle est rencontrée dans le Parcours, l'Entraînement ou la Révision.

---

## 28. Modifier l'Évaluation finale

L’Évaluation finale attend 50 questions écrites et sélectionne les questions portant `estEvaluationFinale: true`. Elle ne dépend plus d’une plage Q111–Q160, ce qui permet de retirer une ancienne question sans recycler son ID et d’ajouter son remplacement avec un nouvel identifiant permanent.

Modifier l'énoncé, la correction, la bonne réponse ou l'indice d'une question d'évaluation suit les mêmes règles d'identifiant que toutes les autres questions.

En revanche, ajouter, supprimer ou remplacer des questions dans l'Évaluation demande de vérifier :

- le marqueur `estEvaluationFinale: true` et le contrôle des 50 questions dans le moteur ;
- le contrôle des 50 questions ;
- les tests ;
- les textes publics ;
- les règles de réussite.

Analytics envoie :

```text
pjjoue_mode_de_jeu = Évaluation finale
pjjoue_resultat_session = Évaluation réussie | Évaluation terminée
```

---

## 29. Ajouter un nouveau mode de jeu

Si un nouveau mode est ajouté à PJJoue :

1. créer son fonctionnement sans recycler un ancien mode ;
2. ajouter son libellé dans le contexte Analytics du moteur ;
3. conserver le préfixe `pjjoue_` pour tout nouvel événement ou paramètre ;
4. vérifier que le nom d'événement et le nom de paramètre font au maximum 40 caractères ;
5. ne pas dépasser 25 paramètres sur un même événement ;
6. documenter le mode dans `documentation/documentation-actuelle/CONFIGURATION_GTM_ANALYTICS.md` ;
7. tester dans GTM Preview et GA4 DebugView.

Grâce au déclencheur GTM `^pjjoue_.*`, un nouvel événement PJJoue pourra être capté sans créer un déclencheur séparé, à condition que les paramètres nécessaires soient aussi configurés dans la balise.

---

## 30. Ajouter ou renommer un joker

Les jokers actuels sont :

- 50/50 ;
- Indice ;
- Langue au chat.

Le paramètre est :

```text
pjjoue_joker_utilise
```

Si le texte d'un joker change mais que sa fonction reste identique, garder la même valeur Analytics si l'on veut conserver une comparaison directe.

Si le joker devient réellement un nouvel outil d'aide, utiliser une nouvelle valeur.

Si un quatrième joker est créé, il peut utiliser le même événement `pjjoue_joker_utilise` avec une nouvelle valeur ; il n'est pas nécessaire de créer un événement séparé.

---

## 31. Renommer une page de PJJoue

Les pages internes sont suivies par :

```text
pjjoue_page_consultee
pjjoue_page_precedente
```

Les libellés lisibles sont définis dans `LIBELLES_PAGES_ANALYTICS` dans `ressources/moteur-jeu.js`.

Si le nom visible d'une page change, mettre à jour ce dictionnaire pour conserver le même vocabulaire dans Analytics.

Ne change pas les noms techniques des paramètres.

---

## 32. Modifier les Paramètres (Son, Taille du texte)

L'événement `pjjoue_parametres_enregistres` envoie actuellement :

```text
pjjoue_son = Activé | Désactivé
pjjoue_taille_texte = Compacte | Normale | Grande
```

Si les libellés visibles changent, adapter les valeurs Analytics afin qu'elles restent compréhensibles.

Si un nouveau réglage mérite d'être mesuré, ajouter un paramètre explicite ; ne pas recréer un champ générique « détail ».

---

## 33. Ce qu'il ne faut jamais refaire

Ne pas recréer des paramètres vagues comme :

```text
mode
theme
chapitre
detail
result
```

Chaque paramètre doit répondre à une question claire : **mode de jeu de quoi ? résultat de quoi ? chrono de quel mode ? étape de quoi ?**

La nomenclature actuelle sépare précisément ces notions.

---

## 34. Ne jamais envoyer à Analytics

Ne pas envoyer :

- le nom réel d'un utilisateur ;
- son adresse e-mail ;
- son numéro de téléphone ;
- une réponse libre saisie par l'utilisateur ;
- le contenu d'une sauvegarde de progression ;
- des données permettant d'identifier directement une personne.

PJJoue ne possède actuellement pas de comptes utilisateurs. GA4 suit donc des utilisateurs pseudonymes liés au navigateur/appareil, sous réserve du consentement.

L'énoncé d'une question peut être envoyé parce qu'il s'agit d'un contenu public de PJJoue, pas d'une donnée personnelle de l'utilisateur.

---

## 35. Campagnes pour savoir ce qui attire les visiteurs

Ne pas ajouter un paramètre PJJoue maison pour remplacer les fonctions d'acquisition GA4.

Pour un lien partagé sur LinkedIn, Instagram, un QR code, un portfolio ou par un partenaire, utiliser les paramètres UTM standards afin de retrouver :

- la source ;
- le support ;
- la campagne ;
- éventuellement le contenu de campagne.

Cela permet de savoir ce qui attire les visiteurs, puis de croiser leur provenance avec les usages PJJoue.

---

## 36. Détail champ par champ de `donnees/questions.json`

Cette section précise ce que signifie chaque famille de champs actuellement présente dans la banque et son effet sur l'identité Analytics.

### `id`

Identité permanente de la question. C'est le seul champ qui ne doit pas être modifié pour une question qui reste la même sur le fond.

- changement autorisé : **non**, sauf migration volontaire et exceptionnelle ;
- effet Analytics : devient `pjjoue_identifiant_question` sous la forme Q001, Q002… ;
- règle : un ID supprimé n'est jamais recyclé.

### `enonce`

Texte principal de la question affiché à l'utilisateur.

- peut être corrigé, raccourci, reformulé ou clarifié ;
- peut évoluer après une mise à jour juridique ou pédagogique ;
- ne change pas l'ID si le fond reste le même ;
- alimente `pjjoue_nom_question` pour les nouvelles données Analytics.

### `theme`

Catégorie technique de rattachement des données. PJJoue utilise principalement `commun`.

- peut évoluer si l'architecture éditoriale change ;
- ne sert pas d'identité Analytics de la question ;
- ne doit pas être confondu avec le nom visible d'une étape.

### `etape`

Rattachement actuel de la question à une étape du Parcours PJJ.

- peut changer sans changer l'ID de la question ;
- Analytics enverra automatiquement le nouveau numéro et le nouveau nom d'étape sur les nouveaux événements ;
- l'historique conserve l'ancien rattachement.

### `chapitre`

Découpage technique interne utilisé par le moteur lorsque certaines étapes contiennent suffisamment de questions.

- peut être modifié si l'organisation interne du parcours évolue ;
- n'est volontairement **pas envoyé à Analytics**, car ce terme n'est pas un repère utilisateur clair dans PJJoue ;
- ne change pas l'identité de la question.

### `libelleMode`

Libellé éditorial du type de réponse.

- peut être harmonisé ou corrigé ;
- le suivi Analytics utilise le type réellement présenté à la question ;
- ne change pas l'ID.

### `modePrefere`

Type d'activité choisi pour présenter la question : choix unique, sélection multiple, association, classement, etc.

- peut changer si la question est transformée dans un autre format ;
- Analytics mettra à jour `pjjoue_type_question` ;
- garder le même ID si le savoir évalué reste le même.

### `bonneReponse`

Réponse de référence utilisée notamment pour les corrections et pour Langue au chat.

- peut être corrigée ou actualisée ;
- ne change pas l'ID si la question reste la même ;
- ne doit jamais être envoyée comme réponse de l'utilisateur dans Analytics.

### `mauvaisesReponses`

Distracteurs d'un format de question classique.

- peuvent être ajoutés, supprimés, remplacés, réordonnés ou reformulés ;
- ne changent pas l'ID ;
- une évolution importante peut modifier la difficulté et doit être prise en compte lors de l'interprétation des résultats historiques.

### `explication`

Texte pédagogique de correction.

- peut être corrigé ou entièrement réécrit ;
- peut intégrer une nouvelle précision juridique, institutionnelle ou pédagogique ;
- ne change pas l'ID ;
- n'est pas envoyé à GA4.

### `indice`

Contenu du joker Indice propre à la question.

- peut être reformulé ou remplacé ;
- ne change pas l'ID ;
- le texte n'est pas envoyé à GA4 ; seul l'usage du joker `Indice` est mesuré.

### `source` et `referencesSources`

Références documentaires justifiant le contenu.

- peuvent être mises à jour, complétées ou remplacées ;
- ne changent pas l'ID si la question reste la même ;
- ne sont pas utilisées comme clé Analytics.

### `procedureLocale`

Indique une particularité éditoriale liée à une procédure locale.

- peut être corrigé en fonction du statut réel de la question ;
- ne change pas son identité Analytics.

### `nature`

Métadonnée éditoriale décrivant la nature de la question.

- peut évoluer ;
- n'est pas utilisée comme identifiant Analytics ;
- ne nécessite pas de nouvel ID à elle seule.

### `statutContenu`

Statut de validation éditoriale du contenu.

- peut évoluer au fil des relectures ;
- ne change jamais l'identité Analytics.

### `versionContenu`

Repère interne de version éditoriale déjà présent dans les données.

- peut évoluer autant de fois que nécessaire ;
- **n'est volontairement pas transmis à GA4** pour éviter de multiplier inutilement les variantes dans les rapports ;
- l'identité reste Qxxx.

### `derniereVerification`

Date de dernière vérification éditoriale ou documentaire.

- doit être actualisée lorsque le contenu est revérifié ;
- n'a aucun effet sur l'identité Analytics.

### `faitsCorrects` et `faitsIncorrects`

Repères utilisés par certaines validations et par le contenu pédagogique.

- peuvent être corrigés ou complétés ;
- ne changent pas l'ID si le savoir évalué reste le même.

### `activite`

Objet qui décrit les formats interactifs avancés. Changer sa structure peut modifier le type de question sans modifier son identité si l'objectif pédagogique reste le même.

#### Activité `selection-multiple`

Champs possibles :

- `consigne` : instruction affichée ;
- `propositions` : liste des choix ;
- `reponses` : identifiants des choix corrects ;
- `libelleAffiche` : libellé du format ;
- `type` : `selection-multiple`.

Tu peux modifier la consigne, les propositions, les distracteurs et les réponses correctes. Garder le même Qxxx si la question reste la même sur le fond.

#### Activité `association`

Champs possibles :

- `consigne` ;
- `colonneGauche` ;
- `colonneDroite` ;
- `associations` ;
- `libelleAffiche` ;
- `type`.

Tu peux reformuler les éléments, modifier les associations correctes ou réorganiser les colonnes sans nouvel ID si l'activité évalue toujours la même connaissance.

#### Activité `remettre-ordre`

Champs possibles :

- `consigne` ;
- `elements` ;
- `ordre` ;
- `libelleAffiche` ;
- `type`.

L'ordre correct peut être corrigé ou les éléments reformulés sans changer Qxxx si la logique évaluée reste identique.

#### Activité `classer`

Champs possibles :

- `consigne` ;
- `categories` ;
- `elements` ;
- `classements` ;
- `libelleAffiche` ;
- `type`.

Changer le nom d'une catégorie, reformuler un élément ou corriger son classement n'impose pas un nouvel ID si la question reste la même.

### Champs propres aux questions « Retirer des choix »

La banque peut contenir :

- `consigneElimination` ;
- `nombreEliminationsAttendues` ;
- `propositionsAConserver` ;
- `propositionsAEliminer`.

Ces éléments peuvent évoluer comme des distracteurs ou une règle de validation. L'identifiant de la question reste le même tant que le fond ne change pas.

### Champs propres aux réponses écrites et à l'Évaluation finale

La banque peut contenir :

- `reponsesAcceptees` ;
- `typeReponseAttendue` ;
- `sigleAttendu` ;
- `sigleSeulRefuse` ;
- `nombreSiglesRequis` ;
- `siglesDistinctsAttendus` ;
- `conceptsEvaluation` ;
- `nombreConceptsRequis` ;
- `conceptsInterdits` ;
- `expressionsInterditesExactes` ;
- `conceptsOrdonnes` ;
- `sansJokers` ;
- `estEvaluationFinale`.

Ces champs constituent les règles de validation d'une réponse écrite. Ils peuvent être ajustés pour mieux accepter une réponse correcte, éviter un faux positif, corriger une règle trop stricte ou suivre une évolution du contenu.

**Ils ne créent pas une nouvelle identité Analytics à eux seuls.** Garder Qxxx si le sens de la question reste le même. Créer un nouvel ID si la question évalue désormais un autre concept.

### Identifiants internes des éléments d'activité

Les objets interactifs peuvent contenir des identifiants comme `q3l0`, `q3r2`, `q2_p1`, etc.

Ces identifiants servent au fonctionnement interne de l'activité. Ils ne sont pas les identifiants Analytics de la question.

Ils peuvent parfois devoir être ajustés lors d'une refonte de l'activité, mais :

- ils doivent rester uniques à l'intérieur de la structure concernée ;
- toutes les références (`reponses`, `associations`, `ordre`, `classements`) doivent être mises à jour ensemble ;
- Qxxx reste inchangé tant que la question reste la même.

---

## 36 bis. Détail champ par champ des étapes dans `donnees/programme.json`

Chaque étape contient actuellement notamment :

- `id` : numéro structurel de l'étape ;
- `titre` : nom visible de l'étape ;
- `couleur` : identité visuelle ;
- `souvenirs` : repères pédagogiques conservés dans le Carnet de voyage ;
- `sousTitre` : texte complémentaire éventuel ;
- `modules` : structure éditoriale éventuelle ;
- `sources` : références documentaires ;
- `fondement` : métadonnée éditoriale.

### `id` de l'étape

C'est actuellement à la fois un identifiant structurel et le numéro utilisé dans le Parcours. Ne pas le renuméroter à la légère. Une simple modification de titre, couleur, souvenirs, sources ou contenu ne justifie jamais un changement d'ID.

### `titre`

Alimente automatiquement `pjjoue_nom_etape`. Tu peux le renommer : les nouvelles données Analytics prendront le nouveau titre tout en conservant le même `pjjoue_numero_etape`.

### `couleur`, `souvenirs`, `sousTitre`, `modules`, `sources`, `fondement`

Peuvent évoluer sans modifier l'identité Analytics de l'étape. Ils ne sont pas utilisés comme clé Analytics.

---

## 36. Checklist avant toute modification de contenu

Avant de modifier PJJoue, poser ces questions :

1. Est-ce la **même question sur le fond** ? Si oui, garder son ID.
2. Est-ce une **nouvelle question** ? Si oui, nouvel ID jamais utilisé.
3. La question change-t-elle simplement de place ou d'étape ? Garder son ID.
4. Le nom d'une étape change-t-il seulement ? Garder son numéro/identité actuelle.
5. Une étape est-elle réellement ajoutée, supprimée ou réordonnée ? Vérifier la structure du moteur avant de renuméroter.
6. Le vocabulaire visible d'un mode, d'une page ou d'un joker change-t-il ? Vérifier les libellés Analytics correspondants.
7. Un nouveau comportement doit-il être mesuré ? Ajouter un paramètre explicite, pas un champ fourre-tout.
8. Les tests, textes publics, fichiers de données et manifeste doivent-ils être reconstruits ?
9. Les événements et paramètres gardent-ils le préfixe `pjjoue_` ?
10. Le suivi a-t-il été testé dans GTM Preview et GA4 DebugView avant publication ?

---

## 37. Résumé de la règle d'or

**Même objet pédagogique = même identifiant permanent.**

Une question peut changer de texte, de réponse correcte, de distracteurs, de type d'activité, d'explication, d'indice, de place ou d'étape sans perdre son identité si elle reste la même question sur le fond.

**Nouvel objet pédagogique = nouvel identifiant jamais recyclé.**

Les libellés visibles peuvent évoluer ; Analytics conservera l'historique ancien et les nouvelles valeurs. Les identifiants permettent de réunir les deux périodes sans casser la continuité.


---

## 38. Déplacer une question sans casser son identité Analytics

Lorsque la progression pédagogique impose d’échanger deux questions mais que chacune conserve le même savoir évalué, **ne pas échanger ni renuméroter leurs `id` permanents**.

Utiliser le champ optionnel `ordreEtape` pour définir leur ordre d’affichage dans l’étape. Le champ `id` continue d’alimenter `pjjoue_identifiant_question` (`Qxxx`) et reste donc stable dans GA4.

Exemple : si Q017 doit être affichée avant Q016 pour introduire une notion, Q017 peut recevoir `ordreEtape: 6` et Q016 `ordreEtape: 7`. Analytics continue de suivre Q017 comme Q017 et Q016 comme Q016.

Une restauration technique de la même question après rechargement ou changement de largeur ne constitue pas un nouvel affichage métier : elle doit réafficher l’interface **sans renvoyer** artificiellement `pjjoue_question_affichee`.


## Vidéos des guides publics

Les pages `metiers-pjj/` et `preparer-arrivee-pjj/` contiennent désormais des lecteurs YouTube chargés uniquement après clic.

### Événement Data Layer

- `pjjoue_video_lancee` : lecture intégrée lancée sur pjjoue.fr ;
- `pjjoue_video_ouverte_youtube` : ouverture volontaire de la vidéo sur YouTube (lien externe ou test local).

### Paramètres envoyés par le site

- `pjjoue_video_identifiant` : identifiant YouTube stable de la vidéo ;
- `pjjoue_video_titre` : titre lisible affiché dans PJJoue ;
- `pjjoue_video_page` : page guide depuis laquelle la vidéo a été lancée ;
- `pjjoue_video_source` : source institutionnelle affichée (Ministère de la Justice ou ENPJJ).

### Branchement GTM à ajouter

Le déclencheur générique `^pjjoue_.*` capte déjà les événements `pjjoue_video_lancee` et `pjjoue_video_ouverte_youtube`. Pour faire remonter les quatre paramètres dans GA4, créer quatre variables Data Layer et les ajouter au tag d'événement GA4 existant :

1. `DLV - Identifiant de la vidéo` → `pjjoue_video_identifiant`
2. `DLV - Titre de la vidéo` → `pjjoue_video_titre`
3. `DLV - Page de la vidéo` → `pjjoue_video_page`
4. `DLV - Source de la vidéo` → `pjjoue_video_source`

Dans GA4, créer ensuite les dimensions personnalisées événementielles correspondantes si l'on veut analyser séparément quelle vidéo a été lancée, depuis quelle page et depuis quelle source.

Le site n'envoie aucun de ces événements si le consentement Analytics n'a pas été accordé.
