# Modifier les questions sans casser Analytics

## But du document

Ce guide explique comment faire évoluer la banque de questions de **PJJoue** sans refaire les réglages de **Google Tag Manager** ou de **Google Analytics**.

> **L’identifiant d’une question est son identité permanente. Sa place dans le parcours ne l’est pas.**

Le suivi utilise le paramètre `pjj_question_id`. Il ne dépend ni du texte de la question, ni de son ordre d’affichage.

## 1. Règle d’or : conserver l’identifiant d’une question existante

Exemple simplifié :

```json
{
  "id": 24,
  "etape": 3,
  "chapitre": 2,
  "enonce": "Quel est le rôle du psychologue à la PJJ ?"
}
```

Analytics reconnaît cette question avec :

```text
pjj_question_id = 24
```

Tu peux modifier, sans toucher à Tag Manager ni à Analytics :

- l’énoncé ;
- les propositions et la bonne réponse ;
- l’explication et l’indice ;
- les sources ;
- le mode de réponse ;
- le chapitre ;
- l’étape, lorsque la progression pédagogique et les contrôles du jeu le permettent.

Tant que le champ `id` reste identique, les statistiques restent rattachées à la même question.

## 2. Ce qu’il ne faut jamais faire

### Ne pas renuméroter les questions pour changer leur ordre

Mauvaise méthode :

```text
Q24 devient Q25
Q25 devient Q24
```

Les historiques des deux questions seraient mélangés.

### Ne pas réutiliser un ancien identifiant

Si Q24 est supprimée, son identifiant ne doit pas être attribué plus tard à une nouvelle notion sans rapport.

### Ne pas créer deux questions avec le même identifiant

Chaque `id` doit être unique dans toute la banque.

## 3. Structure actuelle de cette version

La banque contient **160 questions** :

- **Q1 à Q110** : parcours pédagogique ;
- **11 étapes d’apprentissage** de 10 questions ;
- **Q111 à Q160** : évaluation finale ;
- l’évaluation finale appartient à **l’étape 12** et contient 50 réponses écrites.

Les questions Q111 à Q160 doivent conserver notamment :

```json
"estEvaluationFinale": true,
"etape": 12,
"modePrefere": "reponse-ecrite",
"sansJokers": true
```

Changer le nombre de questions par étape, les bornes Q111–Q160 ou le nombre de questions finales peut nécessiter une adaptation du moteur et des tests. Cela reste distinct de la configuration Analytics.

## 4. Changer l’ordre sans perdre l’historique

Dans le fonctionnement actuel, les questions d’une étape sont organisées à partir de leur `chapitre`, puis de leur `id` dans plusieurs sessions du jeu.

Déplacer seulement une ligne dans `donnees/questions.json` ne garantit donc pas un nouvel ordre d’affichage.

Pour déplacer une question dans un autre chapitre, modifier par exemple :

```json
"chapitre": 3
```

sans modifier son `id`.

Pour obtenir un jour un ordre entièrement libre, la solution propre sera d’ajouter un champ indépendant, par exemple :

```json
"ordre": 4
```

puis d’adapter une seule fois le moteur pour lire ce champ. Tag Manager et Analytics n’auront pas à être modifiés.

## 5. Ajouter une nouvelle question

Une nouvelle question reçoit toujours :

- un identifiant jamais utilisé ;
- une étape et un chapitre valides ;
- un mode de réponse correctement configuré ;
- les données obligatoires attendues par PJJoue ;
- des sources officielles vérifiées.

Attention : dans cette version, les contrôles exigent actuellement des identifiants continus de Q1 à Q160 et une structure fixe de 160 questions. Ajouter Q161 demandera donc d’adapter les règles du moteur, les textes publics et les tests. Le suivi Analytics, lui, acceptera automatiquement le nouvel identifiant.

## 6. Fichier officiel à modifier

La source de vérité est :

```text
donnees/questions.json
```

Ne pas modifier directement :

```text
donnees/donnees-pjj.js
```

Après une modification, reconstruire les données :

```bash
python outils/construire_donnees.py
```

Sous Windows :

```powershell
py outils/construire_donnees.py
```

Puis lancer les contrôles :

```bash
npm test
```

Au minimum, contrôler la structure avec :

```bash
python tests/verifier_v7.py
```

ou sous Windows :

```powershell
py tests/verifier_v7.py
```

Avant de créer l’archive ou de publier, régénérer aussi le manifeste :

```bash
python outils/construire_manifeste.py
```

## 7. Quand faudrait-il réellement modifier Tag Manager ou Analytics ?

Une modification serait nécessaire uniquement si le **contrat de suivi** change, par exemple si l’on :

- renomme `pjj_question_id` ;
- renomme les événements `pjj_question_view` ou `pjj_question_answer` ;
- supprime les événements envoyés par le moteur ;
- change complètement la structure de `dataLayer` ;
- ajoute de nouveaux paramètres que l’on souhaite exploiter comme dimensions personnalisées.

Tant que les événements `pjj_...` et le paramètre `pjj_question_id` restent stables, la banque peut évoluer sans refaire la configuration.

## 8. Checklist avant publication

- [ ] Chaque question possède un `id` unique.
- [ ] Aucun identifiant n’a été réutilisé pour une autre notion.
- [ ] Les identifiants n’ont pas été changés uniquement pour modifier l’ordre.
- [ ] Q1 à Q110 restent dans le parcours pédagogique.
- [ ] Q111 à Q160 restent réservées à l’évaluation finale, sauf refonte volontaire et testée.
- [ ] Les notions sont introduites avant d’être évaluées.
- [ ] Les sources ont été vérifiées et mises à jour.
- [ ] `donnees/donnees-pjj.js` a été reconstruit.
- [ ] Les contrôles automatiques sont passés.
- [ ] `MANIFESTE.json` a été régénéré.
- [ ] Le jeu a été testé avant le commit et le push GitHub.

## Résumé à retenir

> **Je peux modifier le contenu, le chapitre ou l’étape d’une question, mais je conserve son identifiant.**

> **Je ne change jamais un identifiant uniquement pour déplacer une question.**

> **Une nouvelle question reçoit toujours un nouvel identifiant.**
