/* PJJoue garde son application principale disponible après une première visite. */
const NOM_CACHE = 'pjjoue-application-82cb039ad28f';
const RESSOURCES_ESSENTIELLES = [
  './',
  './index.html',
  './ressources/styles/atlas-systeme.css?v=82cb039ad28f',
  './manifest.webmanifest',
  './donnees/donnees-pjj.js?v=82cb039ad28f',
  './ressources/moteur-jeu.js?v=82cb039ad28f',
  './ressources/navigation-locale.js?v=82cb039ad28f',
  './ressources/consentement-analytics.js?v=82cb039ad28f',
  './ressources/videos-guides.js?v=82cb039ad28f',
  './ressources/styles/pjjoue-principal.css?v=82cb039ad28f',
  './ressources/styles/pjjoue-static.css?v=82cb039ad28f',
  './ressources/styles/95-consentement.css?v=82cb039ad28f',
  './guides/index.html',
  './guides/style-de-la-page.css?v=82cb039ad28f',
  './rrse-mineur/index.html',
  './rrse-mineur/style-de-la-page.css?v=82cb039ad28f',
  './peines-mineurs-cjpm/index.html',
  './peines-mineurs-cjpm/style-de-la-page.css?v=82cb039ad28f',
  './cjpm-enquete-sanction/index.html',
  './cjpm-enquete-sanction/style-de-la-page.css?v=82cb039ad28f',
  './cjpm-information-judiciaire/index.html',
  './cjpm-information-judiciaire/style-de-la-page.css?v=82cb039ad28f',
  './cjpm-jugement-sanction-educative/index.html',
  './cjpm-jugement-sanction-educative/style-de-la-page.css?v=82cb039ad28f',
  './cjpm-matiere-criminelle-peines/index.html',
  './cjpm-matiere-criminelle-peines/style-de-la-page.css?v=82cb039ad28f',
  './cjpm-application-execution/index.html',
  './cjpm-application-execution/style-de-la-page.css?v=82cb039ad28f',
  './decouvrir-la-pjj/index.html',
  './decouvrir-la-pjj/style-de-la-page.css?v=82cb039ad28f',
  './organisation-pjj/index.html',
  './organisation-pjj/style-de-la-page.css?v=82cb039ad28f',
  './metiers-pjj/index.html',
  './metiers-pjj/style-de-la-page.css?v=82cb039ad28f',
  './structures-pjj/index.html',
  './structures-pjj/style-de-la-page.css?v=82cb039ad28f',
  './mesures-educatives-pjj/index.html',
  './mesures-educatives-pjj/style-de-la-page.css?v=82cb039ad28f',
  './sigles-cjpm/index.html',
  './sigles-cjpm/style-de-la-page.css?v=82cb039ad28f',
  './sigles-pjj/index.html',
  './sigles-pjj/style-de-la-page.css?v=82cb039ad28f',
  './quiz-pjj/index.html',
  './quiz-pjj/style-de-la-page.css?v=82cb039ad28f',
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

function estRessourceIndispensable(ressource) {
  return ressource === './' || ressource === './index.html'
    || /(?:donnees-pjj|moteur-jeu|navigation-locale)\.js/.test(ressource)
    || /(?:pjjoue-principal|atlas-systeme)\.css/.test(ressource);
}
async function precacherApplication(cache) {
  // Le nouveau moteur ne peut prendre la main qu'après le téléchargement
  // complet de l'application. Un réseau interrompu garde l'ancienne version.
  const indispensables = RESSOURCES_ESSENTIELLES.filter(estRessourceIndispensable);
  await cache.addAll(indispensables.map(ressource => new Request(ressource, { cache: 'reload' })));
  await Promise.all(RESSOURCES_ESSENTIELLES.filter(ressource => !estRessourceIndispensable(ressource)).map(async ressource => {
    try { await cache.add(new Request(ressource, { cache: 'reload' })); }
    catch (erreur) { console.warn('[PJJoue] Ressource secondaire non précachée :', ressource); }
  }));
}

self.addEventListener('install', evenement => {
  evenement.waitUntil(
    caches.open(NOM_CACHE)
      .then(cache => precacherApplication(cache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', evenement => {
  evenement.waitUntil(
    caches.keys()
      .then(noms => Promise.all(noms
        .filter(nom => nom.startsWith('pjjoue-application-') && nom !== NOM_CACHE)
        .slice(0, -1)
        .map(nom => caches.delete(nom))))
      .then(() => self.clients.claim())
  );
});

async function trouverNavigationEnCache(requete) {
  const cache = await caches.open(NOM_CACHE);
  const reponseExacte = await cache.match(requete);
  if (reponseExacte)
    return reponseExacte;

  const adresse = new URL(requete.url);
  if (adresse.pathname.endsWith('/')) {
    const adresseIndex = new URL('index.html', adresse).href;
    const reponseIndex = await cache.match(adresseIndex);
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
  return cache.match(accueil);
}

self.addEventListener('fetch', evenement => {
  const requete = evenement.request;
  const adresse = new URL(requete.url);
  if (requete.method !== 'GET' || adresse.origin !== self.location.origin)
    return;

  if (requete.mode === 'navigate') {
    evenement.respondWith(
      caches.open(NOM_CACHE).then(async cache => {
        // Une page déjà installée reste liée à son moteur jusqu'à activation
        // complète de la version suivante. Les nouveaux scripts sont prêts
        // avant le rechargement automatique des onglets.
        const connue = await cache.match(requete, { ignoreSearch: true });
        if (connue) return connue;
        return fetch(requete, { cache: 'no-cache' });
      })
        .then(reponse => {
          if (!reponse.ok) throw new Error('Navigation indisponible');
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
