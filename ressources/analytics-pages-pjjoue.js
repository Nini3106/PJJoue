'use strict';

/**
 * Mesure des pages publiques indexables de PJJoue.
 *
 * Chaque guide possède un libellé Analytics stable, indépendant de son titre
 * SEO. L'événement n'est envoyé qu'après consentement Analytics et au plus une
 * fois par chargement de page.
 */
(() => {
    const PAGES = [
        ['preparer-arrivee-pjj', 'Préparer son arrivée à la PJJ'],
        ['concours-educateur-pjj', 'Préparer le concours d’éducateur de la PJJ'],
        ['decouvrir-la-pjj', 'Découvrir la PJJ'],
        ['organisation-pjj', 'Organisation de la PJJ'],
        ['metiers-pjj', 'Métiers de la PJJ'],
        ['structures-pjj', 'Structures de la PJJ'],
        ['mesures-educatives-pjj', 'Mesures éducatives de la PJJ'],
        ['sigles-pjj', 'Sigles de la PJJ'],
        ['quiz-pjj', 'Quiz PJJ']
    ];

    let envoye = false;

    function libellePourChemin(chemin) {
        const normalise = String(chemin || '').toLowerCase().replace(/\\/g, '/');
        const entree = PAGES.find(([fragment]) => normalise.includes(`/${fragment}/`) || normalise.endsWith(`/${fragment}`));
        return entree?.[1] || null;
    }

    function obtenirPagePrecedente() {
        if (!document.referrer)
            return null;
        try {
            const ref = new URL(document.referrer);
            if (location.protocol !== 'file:' && ref.origin !== location.origin)
                return null;
            return libellePourChemin(ref.pathname) || (ref.pathname === '/' ? 'Accueil' : null);
        }
        catch (erreur) {
            return null;
        }
    }

    function envoyerPage() {
        if (envoye || window.PJJConsentement?.estAutorise?.() !== true)
            return;
        const libelle = libellePourChemin(location.pathname);
        if (!libelle || typeof window.PJJ_ANALYTICS?.envoyer !== 'function')
            return;
        const precedente = obtenirPagePrecedente();
        window.PJJ_ANALYTICS.envoyer('page_consultee', {
            pjjoue_page_consultee: libelle,
            ...(precedente ? { pjjoue_page_precedente: precedente } : {})
        });
        envoye = true;
    }

    window.addEventListener('pjjoue:consentement-change', evenement => {
        if (evenement.detail?.analytics === true)
            envoyerPage();
    });

    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', envoyerPage, { once: true });
    else
        envoyerPage();
})();
