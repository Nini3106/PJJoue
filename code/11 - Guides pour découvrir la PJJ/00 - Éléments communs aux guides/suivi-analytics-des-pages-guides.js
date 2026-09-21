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
        ['rrse-mineur', 'RRSE : définition et déroulement pour un mineur'],
        ['peines-mineurs-cjpm', 'Quelles peines pour un mineur dans le CJPM ?'],
        ['cjpm-enquete-sanction', 'De l’enquête à la sanction'],
        ['cjpm-information-judiciaire', 'Avant le jugement : l’information judiciaire'],
        ['cjpm-jugement-sanction-educative', 'Du jugement à la sanction'],
        ['cjpm-matiere-criminelle-peines', 'De la qualification criminelle aux peines'],
        ['cjpm-application-execution', 'Après la sanction : application et exécution'],
        ['decouvrir-la-pjj', 'Découvrir la PJJ'],
        ['organisation-pjj', 'Organisation de la PJJ'],
        ['metiers-pjj', 'Métiers de la PJJ'],
        ['structures-pjj', 'Structures de la PJJ'],
        ['mesures-educatives-pjj', 'Comprendre les mesures éducatives'],
        ['sigles-cjpm', 'Décoder les sigles CJPM'],
        ['sigles-pjj', 'Décoder les sigles PJJ'],
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
