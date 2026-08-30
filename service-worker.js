/* PJJoue garde son application principale disponible après une première visite. */
const NOM_CACHE = 'pjjoue-application-a85caeb50efd';
const RESSOURCES_ESSENTIELLES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './donnees/donnees-pjj.js',
  './ressources/moteur-jeu.js',
  './ressources/navigation-locale.js',
  './ressources/navigation-locale.js?v=20260828-menu2',
  './ressources/consentement-analytics.js',
  './ressources/videos-guides.js',
  './ressources/styles/pjjoue-principal.css?v=20260828-coherence11',
  './ressources/styles/pjjoue-static.css?v=20260828-menu2',
  './ressources/styles/95-consentement.css',
  './ressources/styles/95-consentement.css?v=20260827-final1',
  './guides/index.html',
  './guides/style-de-la-page.css',
  './decouvrir-la-pjj/index.html',
  './decouvrir-la-pjj/style-de-la-page.css',
  './organisation-pjj/index.html',
  './organisation-pjj/style-de-la-page.css',
  './metiers-pjj/index.html',
  './metiers-pjj/style-de-la-page.css',
  './structures-pjj/index.html',
  './structures-pjj/style-de-la-page.css',
  './mesures-educatives-pjj/index.html',
  './mesures-educatives-pjj/style-de-la-page.css',
  './sigles-pjj/index.html',
  './sigles-pjj/style-de-la-page.css',
  './quiz-pjj/index.html',
  './quiz-pjj/style-de-la-page.css',
  './preparer-arrivee-pjj/index.html',
  './preparer-arrivee-pjj/style-de-la-page.css',
  './concours-educateur-pjj/index.html',
  './concours-educateur-pjj/style-de-la-page.css',
  './ressources/panorama-accueil.webp',
  './ressources/panorama-accueil-mobile.webp',
  './favicon.ico',
  './icone-pjjoue-192.png',
  './icone-pjjoue-512.png',
  './ressources/icones-parcours/icone-loupe-decouverte.svg',
  './ressources/icones-parcours/icone-public-accompagne.svg',
  './ressources/icones-parcours/icone-acteurs-justice.svg',
  './ressources/icones-parcours/icone-professionnels-pjj.svg',
  './ressources/icones-parcours/icone-organisation-pjj.svg',
  './ressources/icones-parcours/icone-formes-prise-en-charge.svg',
  './ressources/icones-parcours/icone-structure-ouverte-de-jour.svg',
  './ressources/icones-parcours/icone-activites-educatives.svg',
  './ressources/icones-parcours/icone-structures-placement.svg',
  './ressources/icones-parcours/icone-mesures-judiciaires.svg',
  './ressources/icones-parcours/icone-partenaires.svg',
];

async function precacherSeparément(cache) {
  await Promise.all(RESSOURCES_ESSENTIELLES.map(async ressource => {
    try {
      await cache.add(ressource);
    } catch (erreur) {
      console.warn('[PJJoue] Ressource non précachée :', ressource, erreur);
    }
  }));
}

self.addEventListener('install', evenement => {
  evenement.waitUntil(
    caches.open(NOM_CACHE)
      .then(cache => precacherSeparément(cache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', evenement => {
  evenement.waitUntil(
    caches.keys()
      .then(noms => Promise.all(noms
        .filter(nom => nom.startsWith('pjjoue-application-') && nom !== NOM_CACHE)
        .map(nom => caches.delete(nom))))
      .then(() => self.clients.claim())
  );
});

async function trouverNavigationEnCache(requete) {
  const reponseExacte = await caches.match(requete);
  if (reponseExacte)
    return reponseExacte;

  const adresse = new URL(requete.url);
  if (adresse.pathname.endsWith('/')) {
    const adresseIndex = new URL('index.html', adresse).href;
    const reponseIndex = await caches.match(adresseIndex);
    if (reponseIndex)
      return reponseIndex;
  }

  const racine = new URL(self.registration.scope);
  const cheminRacine = racine.pathname.endsWith('/') ? racine.pathname : `${racine.pathname}/`;
  let cheminRoute = adresse.pathname.startsWith(cheminRacine)
    ? adresse.pathname.slice(cheminRacine.length)
    : '';
  cheminRoute = cheminRoute.replace(/\/index\.html$/i, '').replace(/^\/+|\/+$/g, '');

  // Une route interne propre (/parcours/, /progression/, etc.) n'est pas un document
  // autonome. Hors connexion, on repasse par l'accueil mis en cache avec la route
  // en paramètre ; l'application restaure ensuite l'écran et remet l'URL propre.
  if (cheminRoute && !adresse.searchParams.has('pjjoue_route')) {
    const destination = new URL('./', racine);
    destination.searchParams.set('pjjoue_route', cheminRoute);
    return Response.redirect(destination.href, 302);
  }

  const accueil = new URL('index.html', racine).href;
  return caches.match(accueil);
}

self.addEventListener('fetch', evenement => {
  const requete = evenement.request;
  const adresse = new URL(requete.url);
  if (requete.method !== 'GET' || adresse.origin !== self.location.origin)
    return;

  if (requete.mode === 'navigate') {
    evenement.respondWith(
      fetch(requete)
        .then(reponse => {
          const copie = reponse.clone();
          return caches.open(NOM_CACHE)
            .then(cache => cache.put(requete, copie))
            .catch(() => undefined)
            .then(() => reponse);
        })
        .catch(() => trouverNavigationEnCache(requete))
    );
    return;
  }

  evenement.respondWith(
    caches.match(requete).then(reponseEnCache => {
      if (reponseEnCache)
        return reponseEnCache;
      return fetch(requete).then(reponse => {
        if (reponse.ok) {
          const copie = reponse.clone();
          return caches.open(NOM_CACHE)
            .then(cache => cache.put(requete, copie))
            .catch(() => undefined)
            .then(() => reponse);
        }
        return reponse;
      });
    })
  );
});
