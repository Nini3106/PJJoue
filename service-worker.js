/* PJJoue garde son application principale disponible après une première visite. */
const NOM_CACHE = 'pjjoue-application-cb5297986905';
const RESSOURCES_ESSENTIELLES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './donnees/donnees-pjj.js',
  './ressources/moteur-jeu.js',
  './ressources/navigation-locale.js',
  './ressources/consentement-analytics.js',
  './ressources/videos-guides.js',
  './ressources/styles/pjjoue-principal.css?v=20260809-1',
  './ressources/styles/00-fondations-et-composants.css',
  './ressources/styles/80-finitions-de-l-interface.css',
  './ressources/styles/85-guides-pedagogiques.css',
  './ressources/styles/90-adaptation-ecrans-et-etats-finaux.css',
  './ressources/styles/95-consentement.css',
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
  './ressources/icones-interface/icone-boussole.svg',
  './ressources/icones-interface/icone-carte-du-parcours.svg',
  './ressources/icones-interface/icone-cible.svg',
  './ressources/icones-interface/icone-defi-chrono.svg',
  './ressources/icones-interface/icone-melanger.svg',
  './ressources/icones-interface/icone-mon-activite.svg',
  './ressources/icones-interface/icone-par-ordre-des-etapes.svg',
  './ressources/icones-interface/icone-trophee-evaluation-finale.svg'
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
        .catch(() => caches.match(requete).then(reponse => reponse || caches.match('./index.html')))
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
