# Mission Sigles

Mini-jeu V1 commun à deux domaines : CJPM (par défaut) et PJJ (option).
Le choix Tous donne accès aux deux ensembles sans doublon.

- `donnees/sigles.json` est la source unique des 96 sigles : 51 CJPM et 45 PJJ.
- Les 72 identifiants historiques et leurs sigles sont conservés ; 24 entrées sont ajoutées.
- Cinq étapes CJPM reprennent les couleurs des cinq parcours. Les quatre étapes PJJ reprennent les couleurs des thèmes organisation, prise en charge, placement et partenaires. Les SVG existants sont conservés.
- Les tailles d’étape, jauges, étoiles, compteurs et limites d’entraînement sont calculés à partir des données.
- Chaque sigle possède une introduction contextualisée et trois distracteurs rédigés. Il est découvert avant d’être demandé seul.
- Entraînement, dé et erreurs respectent le domaine choisi ; le dé d’entraînement respecte aussi l’étape choisie.
- Chaque domaine a une évaluation de 30 activités, débloquée par ses seules étapes, sans joker ni passage, avec un seuil de 90 %. Tous garde une évaluation globale distincte.
- Les acquis de l’ancienne organisation sont migrés par sigle. Les anciens bilans d’étapes restent archivés dans la sauvegarde ; le résultat global historique reste conservé.
- Les deux glossaires distincts et les supports sont générés depuis les mêmes données, CJPM puis PJJ.
- Les ajouts comportent une référence officielle affichée dans les corrections et le glossaire. Les sigles ambigus (AJ, CEDH) sont explicités dans leur contexte. Les règles de droit commun ne se substituent pas au CJPM.

Vérification : tests unitaires et recette navigateur `tests/verifier_jeu_sigles.py`, dont migration, séparation des domaines, évaluation et affichage mobile.
