# Guides CJPM

Les cinq fiches correspondent aux cinq parcours judiciaires de Quiz CJPM. Le parcours `commun` reste l’option Découvrir la PJJ, dont les guides existants sont conservés.

## Présentation et navigation

La porte d’entrée reste `../11 - Guides pour découvrir la PJJ/Accueil des guides/`. Les fiches réutilisent le gabarit visuel commun, les couleurs canoniques des parcours et des liens vers leurs routes stables. Aucun dessin SVG existant n’est modifié.

## Rédaction juridique

Rédaction originale, à vocation pédagogique générale ; aucun dossier réel ni donnée permettant d’identifier un mineur. Les exemples sont explicitement fictifs. La mention d’indépendance ne remplace pas la vérification des affirmations.

Les références Légifrance figurent auprès des explications et dans les sources. La date visible correspond à la consultation réelle des textes. Pour une évolution, lire la version en vigueur et ses dispositions transitoires avant de modifier le contenu. Ne pas appliquer par anticipation une abrogation ou une entrée en vigueur future.

Points de contrôle : présomptions de discernement (L11-1), interdiction des peines avant 13 ans (L11-4), âge aux faits sauf exception (L13-2), voies distinctes d’audience unique (L521-2 et L521-26/27), distinction MEE/MEJP/MEJ, exception à la MJIE en instruction (L432-1), connexité criminelle (L434-2), atténuation et exclusion exceptionnelle (L121-5/7), compétence JE/JAP après majorité (L611-2/5/6).

## Construction et contrôles

Les pages sont inscrites dans `plan-construction.json`, `seo-pages.json` et le précache hors connexion. Le suivi des pages ajoute seulement leurs routes à la liste existante ; aucun identifiant d’événement ni règle de consentement ne change. L’empreinte de `analytics-pages-pjjoue.js` est actualisée pour cette extension après vérification comportementale du consentement.

Reconstruire données, site et SEO, puis le manifeste en dernier. Lancer `npm test`. Vérifier les nouveaux guides sur ordinateur et mobile et leur présence dans le sitemap avant publication.
