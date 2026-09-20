'use strict';

/**
 * Mesure des pages publiques indexables de PJJoue.
 *
 * Les pages guides appartiennent à la page « Guides » du menu. Le rapport
 * conserve donc cette page comme niveau principal et ajoute le titre exact du
 * guide comme détail. L'événement n'est envoyé qu'après consentement Analytics
 * et au plus une fois par chargement de page.
 */
(() => {
    const PAGES = [
        ['guides', 'Accueil des guides'],
        ['decouvrir-la-pjj', 'Découvrir la PJJ'],
        ['organisation-pjj', 'Organisation de la PJJ'],
        ['metiers-pjj', 'Métiers de la PJJ'],
        ['structures-pjj', 'Structures de la PJJ'],
        ['mesures-educatives-pjj', 'Mesures éducatives de la PJJ'],
        ['sigles-pjj', 'Sigles de la PJJ'],
        ['quiz-pjj', 'Quiz PJJ']
    ];

    let envoye = false;

    function entreePourChemin(chemin) {
        const normalise = String(chemin || '').toLowerCase().replace(/\\/g, '/');
        return PAGES.find(([fragment]) => normalise.includes(`/${fragment}/`) || normalise.endsWith(`/${fragment}`)) || null;
    }

    function obtenirPagePrecedente() {
        if (!document.referrer)
            return null;
        try {
            const ref = new URL(document.referrer);
            if (location.protocol !== 'file:' && ref.origin !== location.origin)
                return null;
            const entree = entreePourChemin(ref.pathname);
            return entree ? 'Guides' : (ref.pathname === '/' ? 'Accueil' : null);
        }
        catch (erreur) {
            return null;
        }
    }

    function envoyerPage() {
        if (envoye || window.PJJConsentement?.estAutorise?.() !== true)
            return;
        const entree = entreePourChemin(location.pathname);
        if (!entree || typeof window.PJJ_ANALYTICS?.envoyer !== 'function')
            return;
        const precedente = obtenirPagePrecedente();
        window.PJJ_ANALYTICS.envoyer('page_consultee', {
            pjjoue_page_consultee: 'Guides',
            pjjoue_page_detail: entree[1],
            pjjoue_nom_guide: entree[1],
            pjjoue_ecran: 'Page publique · Guide',
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
