/* PJJoue garde son application principale disponible après une première visite. */
const NOM_CACHE = 'pjjoue-application-3ccea205c7a5';
const RESSOURCES_ESSENTIELLES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './donnees/donnees-pjj.js',
  './ressources/moteur-jeu.js',
  './ressources/navigation-locale.js',
  './ressources/consentement-analytics.js',
  './ressources/styles/pjjoue-principal.css?v=20260809-1',
  './ressources/panorama-accueil.webp',
  './ressources/panorama-accueil-mobile.webp',
  './favicon.ico',
  './icone-pjjoue-192.png',
  './icone-pjjoue-512.png'
];

self.addEventListener('install', evenement => {
  evenement.waitUntil(
    caches.open(NOM_CACHE)
      .then(cache => cache.addAll(RESSOURCES_ESSENTIELLES))
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
          caches.open(NOM_CACHE).then(cache => cache.put(requete, copie));
          return reponse;
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
          caches.open(NOM_CACHE).then(cache => cache.put(requete, copie));
        }
        return reponse;
      });
    })
  );
});
