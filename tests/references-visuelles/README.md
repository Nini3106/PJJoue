# Références visuelles

Ce dossier protège l'apparence de PJJoue par des captures déterministes. Chaque
sous-dossier correspond au système d'exploitation et au moteur Chromium ayant
créé la référence.

Sous Windows, lancer depuis la racine :

```bash
npm run test:visuel
```

Le contrôle compare 19 vues par leur largeur, leur hauteur et l'empreinte
SHA-256 de leurs pixels décodés. Les métadonnées propres au fichier PNG ne sont
donc pas prises en compte.

En cas d'écart, les nouvelles captures sont écrites dans
`test-results/references-visuelles/`. Comparer ces images avec la référence et
chercher la cause dans le code. Ne jamais recréer la référence uniquement pour
faire passer le test.

Une nouvelle référence n'est légitime qu'après une décision explicite de
modifier l'apparence. Elle doit être capturée deux fois à l'identique par le
script avant d'être acceptée.

