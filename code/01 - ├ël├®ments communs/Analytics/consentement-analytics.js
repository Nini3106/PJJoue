'use strict';

/**
 * Consentement et chargement de Google Tag Manager pour PJJoue.
 *
 * Le conteneur Google n'est chargé qu'après un accord explicite. Le refus
 * laisse le jeu entièrement utilisable et aucune interaction PJJoue n'est
 * envoyée à la couche de données Analytics.
 */
(() => {
    const IDENTIFIANT_GTM = 'GTM-M3LD4ZHK';
    const CLE_CONSENTEMENT = 'pjjoue_consentement_analytics_v1';
    const CHOIX_ACCEPTE = 'accepte';
    const CHOIX_REFUSE = 'refuse';
    const CONTEXTE_WEB = /^https?:$/.test(window.location.protocol);
    const scriptCourant = document.currentScript;
    const urlConfidentialite = scriptCourant?.src
        ? new URL('../confidentialite.html', scriptCourant.src).href
        : 'confidentialite.html';

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
        window.dataLayer.push(arguments);
    };

    function lireChoix() {
        try {
            const choix = localStorage.getItem(CLE_CONSENTEMENT);
            return [CHOIX_ACCEPTE, CHOIX_REFUSE].includes(choix) ? choix : null;
        }
        catch (erreur) {
            return null;
        }
    }

    function enregistrerChoix(choix) {
        try {
            localStorage.setItem(CLE_CONSENTEMENT, choix);
        }
        catch (erreur) {
            // Le choix reste valable pour la page courante si le stockage est indisponible.
        }
    }

    function construireEtatGoogle(autorise) {
        const etat = autorise ? 'granted' : 'denied';
        return {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: etat,
            functionality_storage: 'granted',
            personalization_storage: 'denied',
            security_storage: 'granted'
        };
    }

    const choixInitial = lireChoix();
    window.gtag('consent', 'default', {
        ...construireEtatGoogle(choixInitial === CHOIX_ACCEPTE),
        wait_for_update: 500
    });
    window.gtag('set', 'ads_data_redaction', true);

    let gtmCharge = false;
    let choixCourant = choixInitial;
    let panneau = null;
    let boutonPreferences = null;

    function chargerGoogleTagManager() {
        // Une page ouverte directement depuis le disque possède une origine
        // file:// opaque. Google Tag Manager n'a aucune visite publique à y
        // mesurer et certains conteneurs tiers tentent alors de charger une URL
        // locale depuis un contexte HTTPS, ce que Chrome signale comme dangereux.
        if (!CONTEXTE_WEB || gtmCharge || document.getElementById('pjjoue-google-tag-manager'))
            return;
        gtmCharge = true;
        window.dataLayer.push({
            'gtm.start': Date.now(),
            event: 'gtm.js'
        });
        const script = document.createElement('script');
        script.id = 'pjjoue-google-tag-manager';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(IDENTIFIANT_GTM)}`;
        const premierScript = document.getElementsByTagName('script')[0];
        if (premierScript?.parentNode)
            premierScript.parentNode.insertBefore(script, premierScript);
        else
            document.head.appendChild(script);
    }

    function obtenirDomainesCookies() {
        const nomHote = location.hostname;
        if (!nomHote)
            return [''];
        const morceaux = nomHote.split('.');
        const domaines = ['', nomHote, `.${nomHote}`];
        if (morceaux.length > 2) {
            const domaineRacine = morceaux.slice(-2).join('.');
            domaines.push(domaineRacine, `.${domaineRacine}`);
        }
        return [...new Set(domaines)];
    }

    function supprimerCookiesGoogleAnalytics() {
        const noms = document.cookie
            .split(';')
            .map(cookie => cookie.split('=')[0].trim())
            .filter(nom => nom === '_ga' || nom.startsWith('_ga_'));
        const chemins = ['/', location.pathname || '/'];
        for (const nom of noms) {
            for (const domaine of obtenirDomainesCookies()) {
                for (const chemin of chemins) {
                    const attributDomaine = domaine ? `; domain=${domaine}` : '';
                    document.cookie = `${nom}=; Max-Age=0; path=${chemin}${attributDomaine}; SameSite=Lax`;
                }
            }
        }
    }

    function fermerPanneau({ afficherPreferences = false } = {}) {
        if (panneau)
            panneau.hidden = true;
        if (boutonPreferences)
            boutonPreferences.hidden = !afficherPreferences;
    }

    function ouvrirPanneau() {
        if (!panneau)
            return;
        panneau.hidden = false;
        if (boutonPreferences)
            boutonPreferences.hidden = true;
        requestAnimationFrame(() => {
            const cible = choixCourant === CHOIX_REFUSE
                ? panneau.querySelector('[data-consentement="refuser"]')
                : panneau.querySelector('[data-consentement="accepter"]');
            cible?.focus({ preventScroll: true });
        });
    }

    function notifierChangement(autorise) {
        window.dispatchEvent(new CustomEvent('pjjoue:consentement-change', {
            detail: { analytics: autorise }
        }));
    }

    function appliquerChoix(choix, { enregistrer = true } = {}) {
        const autorise = choix === CHOIX_ACCEPTE;
        choixCourant = autorise ? CHOIX_ACCEPTE : CHOIX_REFUSE;
        if (enregistrer)
            enregistrerChoix(choixCourant);
        window.gtag('consent', 'update', construireEtatGoogle(autorise));
        if (autorise)
            chargerGoogleTagManager();
        else
            supprimerCookiesGoogleAnalytics();
        fermerPanneau({ afficherPreferences: false });
        notifierChangement(autorise);
    }

    function creerInterface() {
        if (document.getElementById('pjjoueConsentement'))
            return;
        panneau = document.createElement('section');
        panneau.id = 'pjjoueConsentement';
        panneau.className = 'pjj-consentement';
        panneau.setAttribute('role', 'dialog');
        panneau.setAttribute('aria-modal', 'false');
        panneau.setAttribute('aria-labelledby', 'pjjoueConsentementTitre');
        panneau.setAttribute('aria-describedby', 'pjjoueConsentementTexte');
        panneau.innerHTML = `
            <div class="pjj-consentement-repere" aria-hidden="true"><span class="pjj-consentement-marque"><span class="pjj-consentement-marque-pjj">PJJ</span><span class="pjj-consentement-marque-oue">oue</span></span></div>
            <button class="pjj-consentement-fermer" type="button" aria-label="Fermer sans choisir">×</button>
            <div class="pjj-consentement-contenu">
                <h2 id="pjjoueConsentementTitre">Mesure d’audience</h2>
                <p id="pjjoueConsentementTexte">Autoriser Google Analytics à mesurer les visites et les actions utiles dans PJJoue ? Aucun suivi publicitaire n’est utilisé.</p>
                <a class="pjj-consentement-lien" href="${urlConfidentialite}">En savoir plus</a>
            </div>
            <div class="pjj-consentement-actions">
                <button class="pjj-consentement-bouton pjj-consentement-refuser" data-consentement="refuser" type="button">Refuser</button>
                <button class="pjj-consentement-bouton pjj-consentement-accepter" data-consentement="accepter" type="button">Accepter</button>
            </div>`;

        boutonPreferences = document.createElement('button');
        boutonPreferences.type = 'button';
        boutonPreferences.className = 'pjj-consentement-preferences';
        boutonPreferences.textContent = 'Gérer les cookies';
        boutonPreferences.setAttribute('aria-controls', 'pjjoueConsentement');

        panneau.querySelector('[data-consentement="accepter"]')?.addEventListener('click', () => appliquerChoix(CHOIX_ACCEPTE));
        panneau.querySelector('[data-consentement="refuser"]')?.addEventListener('click', () => appliquerChoix(CHOIX_REFUSE));
        panneau.querySelector('.pjj-consentement-fermer')?.addEventListener('click', fermerPanneau);
        boutonPreferences.addEventListener('click', ouvrirPanneau);
        document.addEventListener('click', evenement => {
            const cible = evenement.target instanceof Element ? evenement.target : null;
            const commande = cible?.closest('[data-pjj-ouvrir-consentement]');
            if (!commande)
                return;
            evenement.preventDefault();
            ouvrirPanneau();
        });

        document.body.append(panneau, boutonPreferences);
        if (choixCourant)
            fermerPanneau({ afficherPreferences: false });
        else {
            boutonPreferences.hidden = true;
            panneau.hidden = false;
        }
    }

    window.PJJConsentement = Object.freeze({
        estAutorise: () => choixCourant === CHOIX_ACCEPTE,
        obtenirChoix: () => choixCourant,
        ouvrir: ouvrirPanneau,
        accepter: () => appliquerChoix(CHOIX_ACCEPTE),
        refuser: () => appliquerChoix(CHOIX_REFUSE)
    });

    if (choixInitial === CHOIX_ACCEPTE)
        chargerGoogleTagManager();

    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', creerInterface, { once: true });
    else
        creerInterface();
})();
