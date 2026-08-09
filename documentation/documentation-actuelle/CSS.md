# CSS — règle de travail actuelle

Le CSS de PJJoue est organisé par page, mais la cascade publique reste volontairement conservée dans ses fichiers historiques générés.

Les **25 déclarations strictement répétées** qui étaient prouvées inutiles ont été retirées de leurs sources. Le contrôle structurel ne signale plus de déclaration répétée ni de paire de blocs `@media` adjacents ayant exactement la même condition.

## Ce qu’il faut faire avant de déplacer ou fusionner une règle

1. vérifier la page concernée ;
2. vérifier le contexte `@media` ;
3. vérifier ce qui passe avant et après dans la cascade ;
4. reconstruire le site ;
5. lancer les contrôles CSS ;
6. faire une comparaison visuelle avec une version de référence.

Les conditions d’écran restantes ne doivent pas être regroupées uniquement pour réduire leur nombre : déplacer des règles peut changer la cascade même si les conditions `@media` se ressemblent.

Commandes :

```bash
node outils/controler_css.js doublons
node outils/controler_css.js structure
python tests/verifier_regression_visuelle.py --reference-projet CHEMIN_DE_LA_VERSION_REFERENCE
```
