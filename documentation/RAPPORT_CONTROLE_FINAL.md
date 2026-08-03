# Rapport de contrôle final — PJJoue V1

Date du contrôle : 1er août 2026.

## Périmètre validé

- syntaxe des trois fichiers JavaScript ;
- présence et intégrité des fichiers diffusés ;
- références locales des pages HTML ;
- déclaration de langue et zones d’annonce accessibles ;
- 150 questions, dont 100 pour les dix étapes et 50 pour l’évaluation finale ;
- règle des dix étapes terminées sans joker ;
- fonctionnement de la navigation, du parcours, de la validation par Entrée et des paramètres dans Chrome ;
- affichage contrôlé à 390, 1024 et 1440 pixels ;
- correspondance entre les principaux noms techniques français et les éléments ou actions visibles ;
- absence de fonction JavaScript déclarée sans référence évidente ;
- absence de classe CSS orpheline connue, de variable CSS inutilisée et de fichier de cache dans l’archive ;
- manifeste d’intégrité reconstruit après le nettoyage.

## Reproductibilité

Les dépendances de développement sont déclarées dans `package.json` et `requirements-dev.txt`. Elles ne sont pas nécessaires pour jouer : PJJoue reste un site statique, autonome et sans dépendance distante à l’exécution.

Pour lancer la recette complète sur un poste de développement :

```bash
npm install
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
npm test
```

## Garantie de présentation

Le nettoyage final ne modifie ni les contenus, ni les règles du jeu, ni la composition visuelle. Il retire uniquement les éléments sans usage démontré et renforce les contrôles de reprise.
