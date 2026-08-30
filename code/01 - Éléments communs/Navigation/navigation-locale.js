(function () {
  'use strict';

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
    const entete = document.querySelector('.guide-site-entete');
    const navigation = entete?.querySelector('nav');
    const marque = entete?.querySelector('.guide-site-marque');
    if (!entete || !navigation || !marque || entete.dataset.menuInitialise === 'true')
      return;

    entete.dataset.menuInitialise = 'true';
    entete.classList.add('menu-guide-actif');
    navigation.classList.add('guide-navigation-principale');
    navigation.id = navigation.id || 'navigationPrincipaleGuides';

    const navigationLocale = window.location.protocol === 'file:';
    const routesApplication = {
      accueil: ['', '#accueil'],
      parcours: ['parcours/', '#parcours'],
      erreurs: ['revision/', '#erreurs'],
      supports: ['supports/', '#supports'],
      entrainement: ['entrainement/', '#entrainement'],
      progression: ['progression/', '#progression'],
      carnet: ['carnet/', '#carnet'],
      parametres: ['parametres/', '#parametres']
    };
    const lienApplication = ecran => navigationLocale
      ? `${racineApplication.href}index.html${routesApplication[ecran][1]}`
      : new URL(routesApplication[ecran][0], racineApplication).href;
    const lienGuides = `${racineApplication.href}guides/${navigationLocale ? 'index.html' : ''}`;
    const entrees = [
      ['Accueil', lienApplication('accueil')],
      ['Apprendre', lienApplication('parcours')],
      ['Réviser', lienApplication('erreurs')],
      ['Supports', lienApplication('supports')],
      ['S’entraîner', lienApplication('entrainement')],
      ['Progression', lienApplication('progression')],
      ['Guides', lienGuides],
      ['Carnet', lienApplication('carnet')],
      ['Paramètres', lienApplication('parametres')]
    ];

    navigation.innerHTML = entrees.map(([libelle, href]) => {
      const actif = libelle === 'Guides' ? ' aria-current="page"' : '';
      return `<a href="${href}"${actif}>${libelle}</a>`;
    }).join('');

    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'guide-bouton-menu-principal';
    bouton.setAttribute('aria-controls', navigation.id);
    bouton.setAttribute('aria-expanded', 'false');
    bouton.innerHTML = '<span>Menu</span><span class="guide-bouton-menu-icone" aria-hidden="true"><i></i><i></i><i></i></span>';
    entete.insertBefore(bouton, navigation);

    const fermerMenu = () => {
      entete.classList.remove('menu-guide-ouvert');
      bouton.setAttribute('aria-expanded', 'false');
    };

    bouton.addEventListener('click', evenement => {
      evenement.stopPropagation();
      const ouvert = entete.classList.toggle('menu-guide-ouvert');
      bouton.setAttribute('aria-expanded', String(ouvert));
    });
    navigation.addEventListener('click', evenement => {
      if (evenement.target.closest('a'))
        fermerMenu();
    });
    document.addEventListener('click', evenement => {
      if (!entete.contains(evenement.target))
        fermerMenu();
    });
    document.addEventListener('keydown', evenement => {
      if (evenement.key === 'Escape' && entete.classList.contains('menu-guide-ouvert')) {
        fermerMenu();
        bouton.focus();
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
    window.addEventListener('load', () => {
      const adresseServiceWorker = new URL('service-worker.js', racineApplication).href;
      navigator.serviceWorker.register(adresseServiceWorker).catch(() => {
        // Le site reste entièrement utilisable si le navigateur refuse ce mode.
      });
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
        const routesVersFragments = {
          'parcours/': '#parcours',
          'revision/': '#erreurs',
          'mission-sigles/': '#sigles',
          'mission-sigles/revision/': '#sigles-revision',
          'supports/': '#supports',
          'entrainement/': '#entrainement',
          'progression/': '#progression',
          'carnet/': '#carnet',
          'parametres/': '#parametres'
        };
        let fragment = routesVersFragments[relatif];
        if (!fragment) {
          const theme = relatif.match(/^parcours\/([^/]+)\/$/);
          if (theme)
            fragment = `#parcours/${encodeURIComponent(theme[1])}`;
        }
        if (fragment) {
          lien.setAttribute('href', `${racineApplication.href}index.html${fragment}`);
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
