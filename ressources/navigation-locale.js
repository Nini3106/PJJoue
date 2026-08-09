(function () {
  'use strict';

  let propositionInstallation = null;

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
      if (destination.origin !== window.location.origin || destination.hash && destination.pathname === window.location.pathname)
        return;
      evenement.preventDefault();
      document.body.classList.add('guide-quitte-page');
      setTimeout(() => { window.location.href = destination.href; }, 130);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    creerMessagesConnexion();
    preparerInstallation();
    creerOutilsDeLectureGuide();
  });

  if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {
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

    if (!chemin.endsWith('/')) {
      return;
    }

    lien.setAttribute('href', `${chemin}index.html${suffixe}`);
  });
})();
