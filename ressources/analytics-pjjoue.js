'use strict';

/**
 * Couche d'événements métier de PJJoue.
 *
 * Les événements et paramètres métier utilisent le vocabulaire visible dans
 * PJJoue. Les libellés pédagogiques publics (page, parcours, étape, question
 * et type d'activité) peuvent être envoyés pour rendre les rapports lisibles.
 * La réponse saisie, le contenu d'une sauvegarde, l'adresse IP et toute donnée
 * d'identité restent exclus du suivi.
 */
(() => {
    const PREFIXE_EVENEMENT = 'pjjoue_';
    const LONGUEUR_MAXIMALE = 100;
    const PARAMETRES_INTERDITS = new Set([
        'adresse_ip', 'ip', 'ip_address', 'email', 'adresse_email',
        'nom', 'prenom', 'telephone', 'reponse_saisie', 'contenu_sauvegarde'
    ]);

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
                .filter(([cle]) => {
                    const cleNormalisee = String(cle).toLowerCase().replace(/^pjjoue_/, '');
                    return !PARAMETRES_INTERDITS.has(cleNormalisee);
                })
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
