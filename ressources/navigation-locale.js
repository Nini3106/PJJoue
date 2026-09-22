(function () {
  'use strict';

  // Même préférence sur les guides et l’application, sans écrire ni migrer la progression.
  function appliquerTailleTexteEnregistree() {
    let echelle = 1.15;
    try {
      const preferences = JSON.parse(localStorage.getItem('pjjoue_v1_sauvegarde') || 'null');
      const choix = Number(preferences?.parametres?.echelleTexte);
      if ([.9, 1, 1.08, 1.15].includes(choix)) echelle = choix;
    } catch (erreur) { /* Stockage absent ou invalide : garder Grande. */ }
    document.documentElement.style.setProperty('--echelle-texte', String(echelle));
  }
  appliquerTailleTexteEnregistree();
  window.addEventListener('pageshow', appliquerTailleTexteEnregistree);
  window.addEventListener('storage', evenement => {
    if (!evenement.key || evenement.key === 'pjjoue_v1_sauvegarde') appliquerTailleTexteEnregistree();
  });

  let propositionInstallation = null;
  const scriptNavigation = document.currentScript;
  const racineApplication = scriptNavigation?.src
    ? new URL('../', scriptNavigation.src)
    : new URL('./', document.baseURI);


  function activerManifesteApplication() {
    if (!/^https?:$/.test(window.location.protocol))
      return;
    if (document.querySelector('link[rel="manifest"]'))
      return;
    const manifeste = document.createElement('link');
    manifeste.rel = 'manifest';
    manifeste.href = new URL('manifest.webmanifest', racineApplication).href;
    document.head.appendChild(manifeste);
  }
  function creerMessagesConnexion() {
    const message = document.createElement('div');
    message.className = 'message-connexion';
    message.setAttribute('role', 'status');
    message.setAttribute('aria-live', 'polite');
    document.body.appendChild(message);
    let minuterieMessage;

    const annoncer = enLigne => {
      clearTimeout(minuterieMessage);
      message.textContent = enLigne ? 'Connexion retrouvée' : 'Tu es hors connexion';
      message.classList.add('visible');
      minuterieMessage = setTimeout(() => message.classList.remove('visible'), 3200);
    };

    window.addEventListener('online', () => annoncer(true));
    window.addEventListener('offline', () => annoncer(false));
  }

  function preparerInstallation() {
    const bouton = document.getElementById('boutonInstallerPJJoue');
    if (!bouton)
      return;
    window.addEventListener('beforeinstallprompt', evenement => {
      evenement.preventDefault();
      propositionInstallation = evenement;
      bouton.hidden = false;
    });
    bouton.addEventListener('click', async () => {
      if (!propositionInstallation)
        return;
      propositionInstallation.prompt();
      await propositionInstallation.userChoice;
      propositionInstallation = null;
      bouton.hidden = true;
    });
    window.addEventListener('appinstalled', () => {
      propositionInstallation = null;
      bouton.hidden = true;
    });
  }

  function initialiserMenuPrincipalGuides() {
    // L’en-tête Atlas est écrit dans la source de chaque document : pas de menu
    // reconstruit après coup ni de deuxième navigation ajoutée au chargement.
    const menu = document.querySelector('.atlas-static-menu');
    const resume = menu?.querySelector('summary');
    if (!menu || !resume) return;
    const fermer = () => { menu.open = false; };
    menu.addEventListener('click', evenement => {
      if (evenement.target.closest('a')) fermer();
    });
    document.addEventListener('pointerdown', evenement => {
      if (!menu.contains(evenement.target)) fermer();
    });
    document.addEventListener('keydown', evenement => {
      if (evenement.key === 'Escape' && menu.open) {
        fermer();
        resume.focus();
      }
    });
  }

  function creerOutilsDeLectureGuide() {
    const corpsGuide = document.querySelector('.guide-public-corps');
    const contenu = document.querySelector('main.page-guide');
    if (!corpsGuide || !contenu)
      return;

    const barre = document.createElement('div');
    barre.className = 'barre-lecture-guide';
    barre.setAttribute('aria-hidden', 'true');
    barre.innerHTML = '<span></span>';
    document.body.prepend(barre);

    const retour = document.createElement('button');
    retour.className = 'bouton-retour-haut-guide';
    retour.type = 'button';
    retour.setAttribute('aria-label', 'Retour en haut du guide');
    retour.innerHTML = '<span aria-hidden="true">↑</span><span>Haut</span>';
    document.body.appendChild(retour);
    retour.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    const actualiserLecture = () => {
      const hauteurDisponible = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progression = Math.min(1, Math.max(0, window.scrollY / hauteurDisponible));
      barre.querySelector('span').style.transform = `scaleX(${progression})`;
      retour.classList.toggle('visible', window.scrollY > 600);
    };
    actualiserLecture();
    window.addEventListener('scroll', actualiserLecture, { passive: true });
    window.addEventListener('resize', actualiserLecture, { passive: true });

    const titres = [...contenu.querySelectorAll('h2')].filter(titre =>
      !titre.closest('.guide-sources') && !titre.closest('.guide-navigation-liens')
    );
    if (titres.length >= 5) {
      const sommaire = document.createElement('details');
      sommaire.className = 'sommaire-guide';
      const resume = document.createElement('summary');
      resume.textContent = 'Dans ce guide';
      const liste = document.createElement('ol');
      titres.forEach((titre, indice) => {
        if (!titre.id)
          titre.id = `partie-guide-${indice + 1}`;
        const element = document.createElement('li');
        const lien = document.createElement('a');
        lien.href = `#${titre.id}`;
        lien.textContent = titre.textContent.trim();
        element.appendChild(lien);
        liste.appendChild(element);
      });
      sommaire.append(resume, liste);
      const entete = contenu.querySelector('.guide-page-entete');
      entete?.insertAdjacentElement('afterend', sommaire);
    }

    const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)');
    document.addEventListener('click', evenement => {
      const lien = evenement.target.closest('a[href]');
      if (!lien || mouvementReduit.matches || evenement.defaultPrevented || evenement.button !== 0 ||
          evenement.metaKey || evenement.ctrlKey || evenement.shiftKey || evenement.altKey ||
          lien.target || lien.hasAttribute('download'))
        return;
      const destination = new URL(lien.href, window.location.href);
      const protocolePage = ['http:', 'https:', 'file:'].includes(destination.protocol);
      const fichierDansApplication = destination.protocol !== 'file:'
        || destination.pathname.startsWith(racineApplication.pathname);
      if (!protocolePage || !fichierDansApplication || destination.origin !== window.location.origin
          || destination.hash && destination.pathname === window.location.pathname)
        return;
      evenement.preventDefault();
      document.body.classList.add('guide-quitte-page');
      setTimeout(() => { window.location.href = destination.href; }, 130);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    activerManifesteApplication();
    creerMessagesConnexion();
    preparerInstallation();
    initialiserMenuPrincipalGuides();
    creerOutilsDeLectureGuide();
  });

  if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    let rechargementEnCours = false;
    let miseAJourDisponible = false;
    let controleurConnu = navigator.serviceWorker.controller;
    const appliquerMiseAJour = () => {
      if (!miseAJourDisponible || rechargementEnCours) return;
      // Une écriture refusée ne doit jamais faire perdre la question en cours.
      if (window.preparerMiseAJourPJJoue && !window.preparerMiseAJourPJJoue()) return;
      rechargementEnCours = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      const nouveauControleur = navigator.serviceWorker.controller;
      if (controleurConnu && nouveauControleur !== controleurConnu) {
        miseAJourDisponible = true;
        appliquerMiseAJour();
      }
      controleurConnu = nouveauControleur;
    });
    window.addEventListener('load', async () => {
      try {
        const adresseServiceWorker = new URL('service-worker.js', racineApplication).href;
        const inscription = await navigator.serviceWorker.register(adresseServiceWorker, { updateViaCache: 'none' });
        let verificationEnCours = false;
        const verifierMiseAJour = async () => {
          appliquerMiseAJour();
          if (verificationEnCours || navigator.onLine === false || document.visibilityState === 'hidden') return;
          verificationEnCours = true;
          try { await inscription.update(); }
          catch (erreur) { /* Hors connexion : garder la version complète déjà disponible. */ }
          finally { verificationEnCours = false; }
        };
        verifierMiseAJour();
        window.addEventListener('online', verifierMiseAJour);
        window.addEventListener('focus', verifierMiseAJour);
        window.addEventListener('pageshow', verifierMiseAJour);
        document.addEventListener('visibilitychange', verifierMiseAJour);
        // Les onglets restés ouverts reçoivent aussi les nouvelles publications.
        window.setInterval(verifierMiseAJour, 60000);
      } catch (erreur) {
        // Le site reste utilisable si le navigateur refuse le service worker.
      }
    });
  }

  if (window.location.protocol !== 'file:') {
    return;
  }

  document.querySelectorAll('a[href]').forEach((lien) => {
    const href = lien.getAttribute('href');

    if (!href || href.startsWith('#') || /^(?:https?:|mailto:|tel:|javascript:|data:|blob:)/i.test(href)) {
      return;
    }

    const correspondance = href.match(/^([^?#]*)([?#].*)?$/);
    if (!correspondance) {
      return;
    }

    const chemin = correspondance[1];
    const suffixe = correspondance[2] || '';

    try {
      const adresse = new URL(href, document.baseURI);
      const racine = new URL(racineApplication.href);
      if (adresse.protocol === 'file:' && adresse.pathname.startsWith(racine.pathname)) {
        const relatif = decodeURIComponent(adresse.pathname.slice(racine.pathname.length)).replace(/^\/+/, '');
        const routesVersParametres = {
          'parcours/': 'parcours',
          'revision/': 'revision',
          'mission-sigles/': 'mission-sigles',
          'mission-sigles/revision/': 'mission-sigles/revision',
          'mission-mesures/': 'mission-mesures',
          'mission-mesures/revision/': 'mission-mesures/revision',
          'supports/': 'supports',
          'entrainement/': 'entrainement',
          'progression/': 'progression',
          'carnet/': 'carnet',
          'parametres/': 'parametres'
        };
        let routeLocale = routesVersParametres[relatif];
        if (!routeLocale) {
          const theme = relatif.match(/^parcours\/([^/]+)\/$/);
          if (theme)
            routeLocale = `parcours/${theme[1]}`;
        }
        if (routeLocale) {
          lien.setAttribute('href', `${racineApplication.href}index.html?pjjoue_route=${encodeURIComponent(routeLocale)}`);
          return;
        }
      }
    } catch (erreur) {
      // Lien inchangé si l’URL ne peut pas être interprétée.
    }

    if (!chemin.endsWith('/')) {
      return;
    }

    lien.setAttribute('href', `${chemin}index.html${suffixe}`);
  });
})();
