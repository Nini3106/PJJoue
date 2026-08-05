'use strict';

/**
 * Couche d'événements métier de PJJoue.
 *
 * Seules des valeurs techniques courtes sont envoyées. Le texte des questions,
 * les réponses saisies et le contenu de la progression ne quittent jamais le
 * navigateur par ce module.
 */
(() => {
    const PREFIXE_EVENEMENT = 'pjj_';
    const LONGUEUR_MAXIMALE = 100;

    function consentementAccorde() {
        return window.PJJConsentement?.estAutorise?.() === true;
    }

    function normaliserValeur(valeur) {
        if (valeur === null || valeur === undefined || valeur === '')
            return null;
        if (typeof valeur === 'boolean')
            return valeur ? 1 : 0;
        if (typeof valeur === 'number')
            return Number.isFinite(valeur) ? valeur : null;
        return String(valeur).slice(0, LONGUEUR_MAXIMALE);
    }

    function normaliserParametres(parametres) {
        return Object.fromEntries(
            Object.entries(parametres || {})
                .map(([cle, valeur]) => [cle, normaliserValeur(valeur)])
                .filter(([, valeur]) => valeur !== null)
        );
    }

    function envoyer(nom, parametres = {}) {
        if (!consentementAccorde())
            return false;
        const nomNormalise = String(nom || '').trim().toLowerCase();
        if (!/^[a-z0-9_]+$/.test(nomNormalise))
            return false;
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: nomNormalise.startsWith(PREFIXE_EVENEMENT)
                ? nomNormalise
                : PREFIXE_EVENEMENT + nomNormalise,
            ...normaliserParametres(parametres)
        });
        return true;
    }

    window.PJJ_ANALYTICS = Object.freeze({ envoyer });
})();
